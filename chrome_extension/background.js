// background.js - Background Service Worker for Gmail Monitoring
console.log('PhishGuard background service started');

// Default settings
const DEFAULT_SETTINGS = {
  scanInterval: 10, // minutes
  dailyLimit: 50,
  autoScan: true,
  monitoringActive: false,
  monitoringStartTime: null,
  instantScan: true, // Scan immediately when new emails arrive
  apiEndpoint: 'http://localhost:8000/scan',
  lastScanTime: null,
  scansToday: 0,
  lastResetDate: new Date().toDateString()
};

// Initialize settings
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get('settings', (data) => {
    if (!data.settings) {
      chrome.storage.sync.set({ settings: DEFAULT_SETTINGS });
      console.log('Default settings initialized');
    }
  });
  
  // Create alarm for periodic scanning
  setupScanAlarm();
});

// Setup alarm based on scan interval
function setupScanAlarm() {
  chrome.storage.sync.get('settings', (data) => {
    const settings = data.settings || DEFAULT_SETTINGS;
    
    // Ensure instantScan is set (for existing installations)
    if (settings.instantScan === undefined) {
      settings.instantScan = true;
    }
    
    console.log('Setting up alarms with settings:', {
      autoScan: settings.autoScan,
      scanInterval: settings.scanInterval,
      monitoringActive: settings.monitoringActive,
      instantScan: settings.instantScan,
      monitoringStartTime: settings.monitoringStartTime
    });
    
    // Clear existing alarms
    chrome.alarms.clear('gmailScan');
    chrome.alarms.clear('instantScan');
    
    if (settings.autoScan) {
      // Create alarm with user-defined interval
      chrome.alarms.create('gmailScan', {
        delayInMinutes: settings.scanInterval,
        periodInMinutes: settings.scanInterval
      });
      console.log(`Scan alarm set for every ${settings.scanInterval} minutes`);
    }
    
    // Instant scan alarm (30 seconds) when monitoring is active
    if (settings.monitoringActive && settings.instantScan) {
      chrome.alarms.create('instantScan', {
        delayInMinutes: 0.5, // 30 seconds
        periodInMinutes: 0.5
      });
      console.log('✅ Instant scan ENABLED (30s intervals)');
    } else {
      console.log('❌ Instant scan NOT enabled. monitoringActive:', settings.monitoringActive, 'instantScan:', settings.instantScan);
    }
  });
}

// Listen for alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'gmailScan') {
    performAutomaticScan(false); // Regular scan
  } else if (alarm.name === 'instantScan') {
    performAutomaticScan(true); // Instant scan with monitoring filter
  }
});

// Perform automatic Gmail scan
async function performAutomaticScan(isInstant = false) {
  try {
    // Get settings with defaults
    const data = await chrome.storage.sync.get('settings');
    const settings = data.settings || DEFAULT_SETTINGS;
    
    console.log('Current settings:', settings);
    console.log('API URL:', settings.apiEndpoint);
    console.log('Scan type:', isInstant ? 'Instant' : 'Regular');
    
    // Reset daily counter if new day
    const today = new Date().toDateString();
    if (settings.lastResetDate !== today) {
      settings.scansToday = 0;
      settings.lastResetDate = today;
      await chrome.storage.sync.set({ settings });
      console.log('Daily scan counter reset');
    }
    
    // Check daily limit
    if (settings.scansToday >= settings.dailyLimit) {
      console.log(`Daily limit (${settings.dailyLimit}) reached. Skipping scan.`);
      showNotification('PhishGuard - Daily Limit Reached', 
        `Scanned ${settings.dailyLimit} emails today. Limit reset at midnight.`, 
        'warning');
      return;
    }
    
    // Get OAuth token
    const token = await getAuthToken();
    if (!token) {
      console.error('Failed to get auth token');
      return;
    }
    
    // Calculate time window
    let cutoffTime;
    if (isInstant && settings.monitoringActive && settings.monitoringStartTime) {
      // Instant scan: only emails AFTER monitoring started
      cutoffTime = new Date(settings.monitoringStartTime);
      console.log(`Scanning emails after monitoring start: ${cutoffTime.toLocaleTimeString()}`);
    } else {
      // Regular scan: last X minutes
      const scanWindowMs = settings.scanInterval * 60 * 1000;
      cutoffTime = new Date(Date.now() - scanWindowMs);
    }
    
    // Fetch recent emails
    const emails = await fetchRecentEmails(token, cutoffTime);
    console.log(`Found ${emails.length} new email(s) in last ${settings.scanInterval} minutes`);
    
    // Get scan history to avoid re-scanning
    const scanHistory = await new Promise(resolve => {
      chrome.storage.local.get('scanHistory', (data) => {
        resolve(data.scanHistory || []);
      });
    });
    
    // Create set of already scanned email IDs
    const scannedEmailIds = new Set(scanHistory.map(scan => scan.emailId).filter(Boolean));
    
    // Filter out already scanned emails
    const newEmails = emails.filter(email => !scannedEmailIds.has(email.id));
    console.log(`${newEmails.length} new emails to scan (${emails.length - newEmails.length} already scanned)`);
    
    // Scan emails
    let scannedCount = 0;
    for (const email of newEmails) {
      if (settings.scansToday >= settings.dailyLimit) {
        break;
      }
      
      const result = await scanEmail(email, settings.apiEndpoint);
      settings.scansToday++;
      scannedCount++;
      
      // Show notification if phishing detected
      if (result && result.risk_score > 70) {
        showNotification(
          '🚨 Phishing Detected!',
          `Subject: ${email.subject}\nRisk: ${result.risk_score}/100`,
          'danger'
        );
      }
    }
    
    // Update settings
    settings.lastScanTime = new Date().toISOString();
    await chrome.storage.sync.set({ settings });
    
    console.log(`Scan complete. Scanned: ${scannedCount}, Total today: ${settings.scansToday}`);
    
  } catch (error) {
    console.error('Auto-scan error:', error);
  }
}

// Get OAuth token for Gmail API
async function getAuthToken() {
  return new Promise((resolve) => {
    chrome.identity.getAuthToken({ interactive: false }, (token) => {
      if (chrome.runtime.lastError) {
        console.error('Auth error:', chrome.runtime.lastError);
        resolve(null);
      } else {
        resolve(token);
      }
    });
  });
}

// Fetch recent emails from Gmail
async function fetchRecentEmails(token, afterDate) {
  try {
    // Query for emails after specific time
    const afterTimestamp = Math.floor(afterDate.getTime() / 1000);
    const query = `after:${afterTimestamp}`;
    
    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=10`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    const data = await response.json();
    
    if (!data.messages) {
      return [];
    }
    
    // Fetch full email details
    const emails = await Promise.all(
      data.messages.slice(0, 5).map(async (msg) => {
        const msgResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        const msgData = await msgResponse.json();
        
        // Extract subject and body
        const subject = msgData.payload.headers.find(h => h.name === 'Subject')?.value || 'No Subject';
        const body = extractEmailBody(msgData.payload);
        
        return {
          id: msg.id,
          subject,
          body,
          date: msgData.internalDate
        };
      })
    );
    
    return emails;
  } catch (error) {
    console.error('Error fetching emails:', error);
    return [];
  }
}

// Extract email body from payload
function extractEmailBody(payload) {
  let body = '';
  
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body.data) {
        body = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
        break;
      }
    }
  } else if (payload.body.data) {
    body = atob(payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
  }
  
  return body;
}

// Scan email using FastAPI backend
async function scanEmail(email, apiUrl) {
  try {
    console.log('Scanning email with API:', apiUrl);
    console.log('Email body length:', email.body?.length);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: email.body,
        type: 'email'
      })
    });
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Scan result:', result);
    
    // Store result with FULL details in local storage
    chrome.storage.local.get('scanHistory', (data) => {
      const history = data.scanHistory || [];
      
      // Extract VirusTotal and OTX from intel array
      const vtData = result.intel?.find(i => i.source === 'VirusTotal');
      const otxData = result.intel?.find(i => i.source === 'OTX');
      
      history.unshift({
        timestamp: Date.now(),
        scanTime: new Date().toISOString(),
        emailId: email.id, // Store email ID to prevent re-scanning
        emailSubject: email.subject,
        emailDate: email.date,
        // Full scan results
        risk_score: result.risk_score,
        verdict: result.classification,
        // Tool outputs mapped from API response
        rule_analysis: {
          score: result.rule?.score || 0,
          flags: result.rule?.flags || [],
          suspected: result.rule?.suspected || false
        },
        virustotal_data: vtData ? [{
          positives: vtData.positives || 0,
          total: vtData.total || 0,
          details: vtData.details || ''
        }] : [],
        otx_data: otxData?.pulses || [],
        llm_reasoning: result.llm?.reason || '',
        // Raw result for debugging
        raw_result: result
      });
      
      // Keep only last 50 scans
      chrome.storage.local.set({ scanHistory: history.slice(0, 50) });
    });
    
    return result;
  } catch (error) {
    console.error('Scan error:', error);
    return null;
  }
}

// Show notification
function showNotification(title, message, type = 'info') {
  const icons = {
    info: 'icons/icon48.png',
    warning: 'icons/icon48.png',
    danger: 'icons/icon48.png'
  };
  
  chrome.notifications.create({
    type: 'basic',
    iconUrl: icons[type],
    title: title,
    message: message,
    priority: type === 'danger' ? 2 : 1
  });
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'manualScan') {
    // Trigger immediate scan
    performAutomaticScan().then(() => {
      sendResponse({ success: true, scanned: 1 });
    }).catch(error => {
      console.error('Manual scan error:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep channel open for async response
    
  } else if (request.action === 'toggleMonitoring') {
    // Start/Stop monitoring
    chrome.storage.sync.get('settings', (data) => {
      const settings = data.settings || DEFAULT_SETTINGS;
      settings.monitoringActive = request.active;
      
      if (request.active) {
        // Starting monitoring - set timestamp
        settings.monitoringStartTime = new Date().toISOString();
        console.log('Monitoring started at:', settings.monitoringStartTime);
      } else {
        // Stopping monitoring
        settings.monitoringStartTime = null;
        console.log('Monitoring stopped');
      }
      
      // Save settings first, then setup alarms in callback
      chrome.storage.sync.set({ settings }, () => {
        console.log('Settings saved, setting up alarms...');
        setupScanAlarm(); // Restart alarms with new settings
        sendResponse({ success: true, active: settings.monitoringActive });
      });
    });
    return true;
    
  } else if (request.action === 'updateSettings') {
    // Update settings and reset alarm
    chrome.storage.sync.set({ settings: request.settings }, () => {
      setupScanAlarm();
      sendResponse({ success: true });
    });
    return true;
  } else if (request.action === 'getStats') {
    // Get current stats
    chrome.storage.sync.get('settings', (data) => {
      sendResponse(data.settings);
    });
    return true;
    
  } else if (request.action === 'scanSelectedEmails') {
    // Scan emails selected from email selector page
    chrome.storage.sync.get('settings', async (data) => {
      const settings = data.settings || DEFAULT_SETTINGS;
      let scannedCount = 0;
      
      try {
        for (const email of request.emails) {
          if (settings.scansToday >= settings.dailyLimit) {
            break;
          }
          
          // Extract email body from payload
          const body = extractEmailBody(email.payload);
          const emailData = {
            id: email.id,
            subject: email.subject,
            from: email.from,
            date: email.date,
            body: body
          };
          
          const result = await scanEmail(emailData, settings.apiEndpoint);
          settings.scansToday++;
          scannedCount++;
          
          // Show notification if phishing detected
          if (result && result.risk_score > 70) {
            showNotification(
              '🚨 Phishing Detected!',
              `Subject: ${email.subject}\nRisk: ${result.risk_score}/100`,
              'danger'
            );
          }
        }
        
        // Update settings
        settings.lastScanTime = new Date().toISOString();
        await chrome.storage.sync.set({ settings });
        
        sendResponse({ success: true, scanned: scannedCount });
      } catch (error) {
        console.error('Selected email scan error:', error);
        sendResponse({ success: false, error: error.message });
      }
    });
    return true;
  }
});

// Manual scan triggers automatic scan
// This ensures consistency and uses the same scan logic
