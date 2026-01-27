// popup.js - Popup UI Logic
console.log('PhishGuard popup loaded');

// DOM Elements
const scansToday = document.getElementById('scansToday');
const dailyLimit = document.getElementById('dailyLimit');
const safeCount = document.getElementById('safeCount');
const threatsCount = document.getElementById('threatsCount');
const statusText = document.getElementById('statusText');
const statusDetail = document.getElementById('statusDetail');
const recentScans = document.getElementById('recentScans');
const scanNowBtn = document.getElementById('scanNowBtn');
const manualScanBtn = document.getElementById('manualScanBtn');
const settingsBtn = document.getElementById('settingsBtn');
const viewAllBtn = document.getElementById('viewAllBtn');
const lastUpdate = document.getElementById('lastUpdate');
const toggleMonitoringBtn = document.getElementById('toggleMonitoringBtn');

// Load stats on popup open
loadStats();
loadRecentScans();

// Auto-refresh every 5 seconds
setInterval(() => {
  loadStats();
  loadRecentScans();
}, 5000);

// Load statistics
function loadStats() {
  chrome.runtime.sendMessage({ action: 'getStats' }, (settings) => {
    if (!settings) return;
    
    scansToday.textContent = settings.scansToday || 0;
    dailyLimit.textContent = settings.dailyLimit || 50;
    
    // Update monitoring toggle button
    const iconStop = toggleMonitoringBtn.querySelector('.icon-stop');
    const iconPlay = toggleMonitoringBtn.querySelector('.icon-play');
    const btnText = toggleMonitoringBtn.querySelector('.btn-text');
    
    if (settings.monitoringActive) {
      iconStop.style.display = 'block';
      iconPlay.style.display = 'none';
      btnText.textContent = 'Stop';
      toggleMonitoringBtn.classList.add('active');
    } else {
      iconStop.style.display = 'none';
      iconPlay.style.display = 'block';
      btnText.textContent = 'Start';
      toggleMonitoringBtn.classList.remove('active');
    }
    
    // Update status
    if (settings.monitoringActive) {
      statusText.textContent = 'Live Monitoring Active';
      statusDetail.textContent = 'Scanning new emails instantly (30s)';
    } else if (settings.autoScan) {
      statusText.textContent = 'Scheduled Monitoring';
      const nextScanMin = settings.scanInterval || 10;
      statusDetail.textContent = `Next scan in ~${nextScanMin} minutes`;
    } else {
      statusText.textContent = 'Monitoring Paused';
      statusDetail.textContent = 'Enable in settings';
    }
    
    // Update last scan time
    if (settings.lastScanTime) {
      const timeDiff = getTimeAgo(settings.lastScanTime);
      lastUpdate.textContent = timeDiff;
    }
  });
}

// Load recent scan history
function loadRecentScans() {
  chrome.storage.local.get('scanHistory', (data) => {
    const history = data.scanHistory || [];
    
    if (history.length === 0) {
      recentScans.innerHTML = `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <p>No scans yet</p>
          <span>Click "Scan Now" to get started</span>
        </div>
      `;
      return;
    }
    
    // Calculate safe vs threat counts
    const safe = history.filter(s => s.risk_score < 40).length;
    const threats = history.filter(s => s.risk_score >= 70).length;
    
    safeCount.textContent = safe;
    threatsCount.textContent = threats;
    
    // Display recent scans (last 5)
    const recentHTML = history.slice(0, 5).map(scan => {
      const riskClass = getRiskClass(scan.risk_score);
      const riskLabel = getRiskLabel(scan.risk_score);
      const timeAgo = getTimeAgo(scan.scanTime);
      
      // Prepare detailed info
      const ruleScore = scan.rule_analysis?.score !== undefined 
        ? scan.rule_analysis.score 
        : 'N/A';
      const ruleFlags = scan.rule_analysis?.flags?.length > 0 
        ? scan.rule_analysis.flags.join(', ') 
        : 'None detected';
      const vtDetections = scan.virustotal_data?.length > 0 
        ? scan.virustotal_data[0] 
        : null;
      const otxCount = scan.otx_data?.length || 0;
      const llmReason = scan.llm_reasoning || 'No AI analysis available';
      const verdict = scan.verdict || getRiskLabel(scan.risk_score);
      
      return `
        <div class="recent-item" data-scan-id="${scan.timestamp}" onclick="toggleScanDetails(this)">
          <div class="risk-badge ${riskClass}">
            ${scan.risk_score}
          </div>
          <div class="recent-info">
            <div class="recent-subject">${escapeHtml(scan.emailSubject || 'No Subject')}</div>
            <div class="recent-time">${timeAgo} • ${verdict}</div>
          </div>
          <div class="recent-risk ${riskClass}">
            ${riskLabel}
          </div>
          <svg class="expand-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <div class="scan-details" style="display:none;">
            <div class="detail-row">
              <span class="detail-label">Rule Analysis:</span>
              <span class="detail-value">Score: ${ruleScore} | Flags: ${ruleFlags}</span>
            </div>
            ${vtDetections ? `
            <div class="detail-row">
              <span class="detail-label">VirusTotal:</span>
              <span class="detail-value">${vtDetections.positives || 0}/${vtDetections.total || 0} security vendors flagged this${vtDetections.details ? ' - ' + vtDetections.details : ''}</span>
            </div>` : `
            <div class="detail-row">
              <span class="detail-label">VirusTotal:</span>
              <span class="detail-value">Not scanned (no URLs found or rule-based clean)</span>
            </div>`}
            <div class="detail-row">
              <span class="detail-label">OTX Threat Intelligence:</span>
              <span class="detail-value">${otxCount > 0 ? otxCount + ' threat pulse(s) found' : 'No threats detected'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">AI Analysis:</span>
              <span class="detail-value detail-llm">${escapeHtml(llmReason)}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
    
    recentScans.innerHTML = recentHTML;
  });
}

// Scan Now button
scanNowBtn.addEventListener('click', async () => {
  const originalText = scanNowBtn.innerHTML;
  scanNowBtn.innerHTML = '<div class="loading"></div><span>Scanning...</span>';
  scanNowBtn.disabled = true;
  
  try {
    // Request OAuth token
    chrome.identity.getAuthToken({ interactive: true }, async (token) => {
      if (chrome.runtime.lastError) {
        showError('Authentication failed. Please try again.');
        resetButton();
        return;
      }
      
      // Trigger background scan
      chrome.runtime.sendMessage({ action: 'manualScan', immediate: true }, (response) => {
        if (response && response.success) {
          showSuccess(`Scanned ${response.scanned} email(s)`);
          loadStats();
          loadRecentScans();
        } else {
          showError('Scan failed. Check if API is running.');
        }
        resetButton();
      });
    });
  } catch (error) {
    showError('Scan failed: ' + error.message);
    resetButton();
  }
  
  function resetButton() {
    scanNowBtn.innerHTML = originalText;
    scanNowBtn.disabled = false;
  }
});

// Toggle Monitoring button
toggleMonitoringBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'getStats' }, (settings) => {
    const newState = !settings.monitoringActive;
    
    toggleMonitoringBtn.disabled = true;
    
    chrome.runtime.sendMessage({ 
      action: 'toggleMonitoring', 
      active: newState 
    }, (response) => {
      if (response && response.success) {
        loadStats();
        showSuccess(newState ? 'Live monitoring started!' : 'Monitoring stopped');
      } else {
        showError('Failed to toggle monitoring');
      }
      toggleMonitoringBtn.disabled = false;
    });
  });
});

// Manual Scan button (Select & Scan Old Emails)
manualScanBtn.addEventListener('click', () => {
  // Open email selector page in new tab
  chrome.tabs.create({ 
    url: chrome.runtime.getURL('email_selector.html')
  });
});

// Settings button
settingsBtn.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// View All button
viewAllBtn.addEventListener('click', () => {
  // TODO: Open full history page
  alert('Full history page coming soon!');
});

// Helper: Get risk class
function getRiskClass(score) {
  if (score >= 70) return 'risk-danger';
  if (score >= 40) return 'risk-warning';
  return 'risk-safe';
}

// Helper: Get risk label
function getRiskLabel(score) {
  if (score >= 70) return 'Phishing';
  if (score >= 40) return 'Suspicious';
  return 'Safe';
}

// Helper: Time ago
function getTimeAgo(dateString) {
  const date = new Date(dateString);
  const seconds = Math.floor((new Date() - date) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// Helper: Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Toggle scan details (called from HTML onclick)
window.toggleScanDetails = function(element, event) {
  // Prevent event bubbling if event is passed
  if (event) {
    event.stopPropagation();
  }
  
  const details = element.querySelector('.scan-details');
  const icon = element.querySelector('.expand-icon');
  
  if (!details) {
    console.error('No scan-details found in element');
    return;
  }
  
  const isHidden = details.style.display === 'none' || !details.style.display;
  
  if (isHidden) {
    details.style.display = 'block';
    if (icon) icon.style.transform = 'rotate(180deg)';
    console.log('Expanded scan details');
  } else {
    details.style.display = 'none';
    if (icon) icon.style.transform = 'rotate(0deg)';
    console.log('Collapsed scan details');
  }
};

// Helper: Show success message
function showSuccess(message) {
  // TODO: Add toast notification
  console.log('Success:', message);
}

// Helper: Show error message
function showError(message) {
  // TODO: Add toast notification
  console.error('Error:', message);
  alert(message);
}
