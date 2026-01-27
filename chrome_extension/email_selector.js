// email_selector.js - Select and scan old emails
console.log('Email selector loaded');

const emailList = document.getElementById('emailList');
const selectedCount = document.getElementById('selectedCount');
const selectAllBtn = document.getElementById('selectAllBtn');
const scanSelectedBtn = document.getElementById('scanSelectedBtn');

let emails = [];
let selectedEmails = new Set();

// Get auth token from URL params
const urlParams = new URLSearchParams(window.location.search);
let authToken = urlParams.get('token');

// Load emails on startup
document.addEventListener('DOMContentLoaded', () => {
  if (!authToken) {
    // Try to get token from storage or request new one
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError || !token) {
        showError('Authentication failed. Please try again.');
        return;
      }
      authToken = token;
      loadEmails();
    });
  } else {
    loadEmails();
  }
});

// Load emails from Gmail
async function loadEmails() {
  try {
    // Fetch last 20 emails from inbox (reduced to avoid rate limit)
    const response = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20&labelIds=INBOX',
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch emails');
    }
    
    const data = await response.json();
    
    if (!data.messages || data.messages.length === 0) {
      showEmptyState();
      return;
    }
    
    // Fetch details in batches to avoid rate limiting
    emails = [];
    for (let i = 0; i < data.messages.length; i++) {
      try {
        const email = await fetchEmailDetails(data.messages[i].id);
        emails.push(email);
        
        // Small delay every 5 emails to avoid rate limit
        if ((i + 1) % 5 === 0 && i < data.messages.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.warn(`Failed to fetch email ${data.messages[i].id}:`, error);
        // Continue with other emails
      }
    }
    
    if (emails.length === 0) {
      showError('Could not load emails. Please try again.');
      return;
    }
    
    displayEmails();
  } catch (error) {
    console.error('Error loading emails:', error);
    showError('Failed to load emails. Please try again.');
  }
}

// Fetch full email details
async function fetchEmailDetails(messageId) {
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
    {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    }
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch email details');
  }
  
  const data = await response.json();
  
  // Extract headers
  const headers = data.payload.headers;
  const subject = headers.find(h => h.name === 'Subject')?.value || '(No Subject)';
  const from = headers.find(h => h.name === 'From')?.value || 'Unknown';
  const date = headers.find(h => h.name === 'Date')?.value || '';
  
  return {
    id: messageId,
    subject: subject,
    from: from,
    date: new Date(date),
    snippet: data.snippet,
    payload: data.payload
  };
}

// Display emails in list
function displayEmails() {
  const html = emails.map(email => `
    <div class="email-item ${selectedEmails.has(email.id) ? 'selected' : ''}" data-email-id="${email.id}">
      <input type="checkbox" class="checkbox" id="cb-${email.id}" ${selectedEmails.has(email.id) ? 'checked' : ''}>
      <div class="email-info">
        <div class="email-subject">${escapeHtml(email.subject)}</div>
        <div class="email-from">${escapeHtml(email.from)}</div>
      </div>
      <div class="email-date">${formatDate(email.date)}</div>
    </div>
  `).join('');
  
  emailList.innerHTML = html;
  
  // Add event listeners to all email items
  document.querySelectorAll('.email-item').forEach(item => {
    const emailId = item.getAttribute('data-email-id');
    const checkbox = item.querySelector('.checkbox');
    
    // Click on item toggles selection
    item.addEventListener('click', (e) => {
      if (e.target !== checkbox) {
        toggleEmail(emailId);
      }
    });
    
    // Click on checkbox also toggles
    checkbox.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleEmail(emailId);
    });
  });
  
  updateSelectedCount();
}

// Toggle email selection
function toggleEmail(emailId) {
  if (selectedEmails.has(emailId)) {
    selectedEmails.delete(emailId);
  } else {
    selectedEmails.add(emailId);
  }
  
  const checkbox = document.getElementById(`cb-${emailId}`);
  const item = document.querySelector(`[data-email-id="${emailId}"]`);
  
  if (checkbox) checkbox.checked = selectedEmails.has(emailId);
  if (item) {
    if (selectedEmails.has(emailId)) {
      item.classList.add('selected');
    } else {
      item.classList.remove('selected');
    }
  }
  
  updateSelectedCount();
}

// Select/Deselect all
selectAllBtn.addEventListener('click', () => {
  if (selectedEmails.size === emails.length) {
    // Deselect all
    selectedEmails.clear();
    selectAllBtn.textContent = 'Select All';
  } else {
    // Select all
    emails.forEach(email => selectedEmails.add(email.id));
    selectAllBtn.textContent = 'Deselect All';
  }
  
  displayEmails();
});

// Update selected count
function updateSelectedCount() {
  const count = selectedEmails.size;
  selectedCount.textContent = `${count} email${count !== 1 ? 's' : ''} selected`;
  
  // Enable/disable scan button based on selection
  if (scanSelectedBtn) {
    scanSelectedBtn.disabled = (count === 0);
  }
  
  // Update select all button text
  if (selectAllBtn) {
    selectAllBtn.textContent = (count === emails.length && emails.length > 0) ? 'Deselect All' : 'Select All';
  }
  
  console.log(`Selection updated: ${count} emails selected, button ${scanSelectedBtn?.disabled ? 'disabled' : 'enabled'}`);
}

// Scan selected emails
scanSelectedBtn.addEventListener('click', async () => {
  if (selectedEmails.size === 0) return;
  
  const originalText = scanSelectedBtn.innerHTML;
  scanSelectedBtn.innerHTML = '<div class="loading-spinner" style="width:16px;height:16px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:8px;"></div>Scanning...';
  scanSelectedBtn.disabled = true;
  selectAllBtn.disabled = true;
  
  try {
    // Get selected email objects
    const emailsToScan = emails.filter(email => selectedEmails.has(email.id));
    
    console.log(`Scanning ${emailsToScan.length} emails...`);
    
    // Send to background script for scanning
    chrome.runtime.sendMessage({
      action: 'scanSelectedEmails',
      emails: emailsToScan.map(email => ({
        id: email.id,
        subject: email.subject,
        from: email.from,
        date: email.date.toISOString(),
        payload: email.payload
      }))
    }, (response) => {
      console.log('Scan response:', response);
      
      if (chrome.runtime.lastError) {
        console.error('Runtime error:', chrome.runtime.lastError);
        alert('Scan failed: ' + chrome.runtime.lastError.message);
      } else if (response?.success) {
        alert(`✅ Successfully scanned ${response.scanned} email(s)!\n\nCheck the extension popup for results.`);
        window.close();
      } else {
        alert('❌ Scan failed. Error: ' + (response?.error || 'Unknown error'));
      }
      
      scanSelectedBtn.innerHTML = originalText;
      scanSelectedBtn.disabled = false;
      selectAllBtn.disabled = false;
    });
  } catch (error) {
    console.error('Scan error:', error);
    alert('Scan failed: ' + error.message);
    scanSelectedBtn.innerHTML = originalText;
    scanSelectedBtn.disabled = false;
    selectAllBtn.disabled = false;
  }
});

// Helper functions
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(date) {
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  
  return date.toLocaleDateString();
}

function showEmptyState() {
  emailList.innerHTML = `
    <div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
      </svg>
      <p>No emails found in your inbox</p>
    </div>
  `;
}

function showError(message) {
  emailList.innerHTML = `
    <div class="empty-state">
      <p style="color: #dc2626;">⚠️ ${message}</p>
    </div>
  `;
}
