// settings.js - Settings Page Logic
console.log('PhishGuard settings loaded');

// Default settings
const DEFAULT_SETTINGS = {
  autoScan: true,
  scanInterval: 10, // minutes
  dailyLimit: 50,
  riskThreshold: 70,
  notifyOnThreat: true,
  soundAlerts: false,
  apiEndpoint: 'http://localhost:8000'
};

// DOM Elements
const autoScanToggle = document.getElementById('autoScanToggle');
const scanInterval = document.getElementById('scanInterval');
const dailyLimit = document.getElementById('dailyLimit');
const riskThreshold = document.getElementById('riskThreshold');
const riskValue = document.getElementById('riskValue');
const notifyOnThreat = document.getElementById('notifyOnThreat');
const soundAlerts = document.getElementById('soundAlerts');
const apiEndpoint = document.getElementById('apiEndpoint');
const apiStatus = document.getElementById('apiStatus');
const apiStatusText = document.getElementById('apiStatusText');
const exportHistoryBtn = document.getElementById('exportHistoryBtn');
const clearDataBtn = document.getElementById('clearDataBtn');
const resetBtn = document.getElementById('resetBtn');
const saveBtn = document.getElementById('saveBtn');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

// Load settings on page open
loadSettings();
checkApiStatus();

// Range slider value display
riskThreshold.addEventListener('input', (e) => {
  riskValue.textContent = e.target.value;
});

// API endpoint change - check status
let apiCheckTimeout;
apiEndpoint.addEventListener('input', () => {
  clearTimeout(apiCheckTimeout);
  apiCheckTimeout = setTimeout(() => {
    checkApiStatus();
  }, 1000);
});

// Save button
saveBtn.addEventListener('click', async () => {
  const settings = {
    autoScan: autoScanToggle.checked,
    scanInterval: parseInt(scanInterval.value),
    dailyLimit: parseInt(dailyLimit.value),
    riskThreshold: parseInt(riskThreshold.value),
    notifyOnThreat: notifyOnThreat.checked,
    soundAlerts: soundAlerts.checked,
    apiEndpoint: apiEndpoint.value.trim()
  };

  // Validate
  if (!settings.apiEndpoint) {
    showToast('Please enter a valid API endpoint', 'error');
    return;
  }

  if (settings.dailyLimit < 10 || settings.dailyLimit > 200) {
    showToast('Daily limit must be between 10 and 200', 'error');
    return;
  }

  // Save to storage
  chrome.storage.local.set(settings, () => {
    console.log('Settings saved:', settings);
    
    // Update background script
    chrome.runtime.sendMessage({ action: 'updateSettings', settings }, (response) => {
      if (response && response.success) {
        showToast('Settings saved successfully!', 'success');
        
        // Reset scan alarm if interval changed
        chrome.runtime.sendMessage({ action: 'resetAlarm' });
      } else {
        showToast('Failed to update background script', 'error');
      }
    });
  });
});

// Reset button
resetBtn.addEventListener('click', () => {
  if (confirm('Reset all settings to default values?')) {
    applySettings(DEFAULT_SETTINGS);
    showToast('Settings reset to defaults', 'success');
  }
});

// Export history button
exportHistoryBtn.addEventListener('click', () => {
  chrome.storage.local.get('scanHistory', (data) => {
    const history = data.scanHistory || [];
    
    if (history.length === 0) {
      showToast('No scan history to export', 'error');
      return;
    }

    // Convert to CSV
    const csv = convertToCSV(history);
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `phishguard-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast(`Exported ${history.length} scans`, 'success');
  });
});

// Clear data button
clearDataBtn.addEventListener('click', () => {
  if (confirm('⚠️ This will delete ALL scan history and reset settings. Are you sure?')) {
    chrome.storage.local.clear(() => {
      // Reset to defaults
      chrome.storage.local.set(DEFAULT_SETTINGS, () => {
        applySettings(DEFAULT_SETTINGS);
        showToast('All data cleared successfully', 'success');
        
        // Notify background
        chrome.runtime.sendMessage({ action: 'resetAll' });
      });
    });
  }
});

// Load settings from storage
function loadSettings() {
  chrome.storage.local.get(DEFAULT_SETTINGS, (settings) => {
    applySettings(settings);
  });
}

// Apply settings to UI
function applySettings(settings) {
  autoScanToggle.checked = settings.autoScan;
  scanInterval.value = settings.scanInterval;
  dailyLimit.value = settings.dailyLimit;
  riskThreshold.value = settings.riskThreshold;
  riskValue.textContent = settings.riskThreshold;
  notifyOnThreat.checked = settings.notifyOnThreat;
  soundAlerts.checked = settings.soundAlerts;
  apiEndpoint.value = settings.apiEndpoint;
}

// Check API status
async function checkApiStatus() {
  const url = apiEndpoint.value.trim() || DEFAULT_SETTINGS.apiEndpoint;
  
  try {
    // Update UI to checking
    apiStatus.querySelector('.status-dot').className = 'status-dot status-checking';
    apiStatusText.textContent = 'Checking...';
    
    const response = await fetch(`${url}/`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    if (response.ok) {
      apiStatus.querySelector('.status-dot').className = 'status-dot status-online';
      apiStatusText.textContent = 'Connected';
    } else {
      throw new Error('API returned error');
    }
  } catch (error) {
    apiStatus.querySelector('.status-dot').className = 'status-dot status-offline';
    apiStatusText.textContent = 'Offline - Start the backend server';
  }
}

// Convert history to CSV with detailed columns
function convertToCSV(history) {
  const headers = [
    'Timestamp',
    'Subject',
    'Risk Score',
    'Verdict',
    'Rule Score',
    'Rule Flags',
    'VirusTotal Detections',
    'OTX Pulses',
    'LLM Reasoning'
  ];
  
  const rows = history.map(scan => {
    // Extract rule analysis
    const ruleScore = scan.rule_analysis?.score !== undefined 
      ? scan.rule_analysis.score 
      : 'N/A';
    const ruleFlags = scan.rule_analysis?.flags?.length > 0 
      ? scan.rule_analysis.flags.join('; ') 
      : 'None';
    
    // Extract VirusTotal data
    const vtDetections = scan.virustotal_data?.length > 0 
      ? scan.virustotal_data.map(vt => `${vt.positives || 0}/${vt.total || 0}`).join('; ')
      : 'Not scanned';
    
    // Extract OTX data
    const otxPulses = scan.otx_data?.length > 0
      ? `${scan.otx_data.length} pulse(s)`
      : 'No threats';
    
    // Extract LLM reasoning (first 300 chars)
    const llmReason = scan.llm_reasoning 
      ? `"${scan.llm_reasoning.replace(/"/g, '""').substring(0, 300)}"`
      : 'No analysis';
    
    // Use verdict from scan or derive from risk_score
    const verdict = scan.verdict || 
      (scan.risk_score >= 70 ? 'Phishing' : scan.risk_score >= 40 ? 'Suspicious' : 'Safe');
    
    return [
      new Date(scan.scanTime).toLocaleString(),
      `"${scan.emailSubject?.replace(/"/g, '""') || 'No Subject'}"`,
      scan.risk_score || 0,
      verdict,
      ruleScore,
      `"${ruleFlags}"`,
      vtDetections,
      otxPulses,
      llmReason
    ];
  });
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

// Show toast notification
function showToast(message, type = 'success') {
  toastMessage.textContent = message;
  
  const icon = toast.querySelector('.toast-icon');
  if (type === 'error') {
    icon.innerHTML = '<path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
    icon.style.color = '#f56565';
  } else {
    icon.innerHTML = '<polyline points="20 6 9 17 4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
    icon.style.color = '#48bb78';
  }
  
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Privacy policy link
document.getElementById('privacyLink').addEventListener('click', (e) => {
  e.preventDefault();
  alert('Privacy Policy:\n\n• PhishGuard only scans email metadata (subject, sender)\n• No email content is stored permanently\n• Scan results are saved locally in your browser\n• API keys are stored securely in Chrome storage\n• No data is sent to third parties\n\nFor full details, visit our GitHub repository.');
});

// License link
document.getElementById('licenseLink').addEventListener('click', (e) => {
  e.preventDefault();
  alert('MIT License\n\nCopyright © 2024 PhishGuard\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED.');
});
