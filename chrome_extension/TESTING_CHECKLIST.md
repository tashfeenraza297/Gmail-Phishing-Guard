# 🧪 PhishGuard Testing Checklist

Use this checklist to verify everything works before publishing.

## Pre-Testing Setup

- [ ] Backend API is running (`http://localhost:8000`)
- [ ] `.env` file has all API keys (GEMINI, VIRUSTOTAL, OTX)
- [ ] Chrome is open with extensions page (`chrome://extensions/`)
- [ ] Developer mode is enabled
- [ ] Extension is loaded from `chrome_extension` folder

---

## ✅ Installation Testing

### Load Extension
- [ ] Extension appears in extensions list
- [ ] Name shows as "PhishGuard"
- [ ] Version is "1.0.0"
- [ ] No error messages in console

### Grant Permissions
- [ ] Click extension icon opens permission prompt
- [ ] Gmail access request appears
- [ ] Can sign in with Google account
- [ ] "Allow" button grants permissions successfully
- [ ] Extension icon becomes active (not grayed out)

### Initial Settings
- [ ] Settings page opens (click ⚙️ button)
- [ ] API endpoint shows `http://localhost:8000/scan`
- [ ] API Status shows "Connected" (green dot)
- [ ] Default settings loaded:
  - [ ] Auto-Scan: Enabled
  - [ ] Scan Interval: 10 minutes
  - [ ] Daily Limit: 50 emails
  - [ ] Risk Threshold: 70
  - [ ] Notifications: Enabled

---

## 🔍 Manual Scan Testing

### Scan Now Button
- [ ] Click extension icon opens popup
- [ ] "Scan Now" button is visible and enabled
- [ ] Click button shows "Scanning..." state
- [ ] Button is disabled during scan
- [ ] After scan completes:
  - [ ] Button returns to normal state
  - [ ] Stats update (scans today increments)
  - [ ] Recent scans section populates
  - [ ] No errors in console

### Scan Results Display
- [ ] Risk score appears (0-100)
- [ ] Risk badge shows correct color:
  - [ ] 0-39: Green (Safe)
  - [ ] 40-69: Yellow (Suspicious)
  - [ ] 70-100: Red (Phishing)
- [ ] Email subject appears
- [ ] Time ago shows correctly ("Just now", "5m ago", etc.)
- [ ] Verdict label matches score

---

## ⏰ Automatic Scan Testing

### Alarm Setup
- [ ] Go to settings
- [ ] Change scan interval to 1 minute (for testing)
- [ ] Click "Save Changes"
- [ ] Toast notification appears: "Settings saved"
- [ ] Wait 1 minute
- [ ] Check popup - new scan should appear
- [ ] Verify only NEW emails scanned (not old ones)

### Daily Limit
- [ ] Set daily limit to 5 (for testing)
- [ ] Run multiple manual scans
- [ ] After 5 scans:
  - [ ] "Scan Now" button disabled
  - [ ] Notification appears: "Daily limit reached"
  - [ ] Stats show "5 / 5"
- [ ] Reset: Settings → Daily Limit → 50 → Save

---

## ⚙️ Settings Page Testing

### Auto-Scan Configuration
- [ ] Toggle "Enable Auto-Scan" - ON/OFF works
- [ ] Change "Scan Interval" dropdown - all options selectable
- [ ] Change "Daily Limit" input - accepts 10-200
- [ ] Values save when clicking "Save Changes"
- [ ] Values persist after closing/reopening settings

### Detection Settings
- [ ] Move "Risk Threshold" slider - value updates (30-90)
- [ ] Toggle "Desktop Notifications" - ON/OFF works
- [ ] Toggle "Sound Alerts" - ON/OFF works
- [ ] Settings save correctly

### API Configuration
- [ ] Change "Backend URL" input - accepts valid URLs
- [ ] Invalid URL shows error toast
- [ ] API Status updates after URL change
- [ ] Test connection to backend:
  - [ ] Backend running: Shows "Connected" (green)
  - [ ] Backend stopped: Shows "Offline" (red)

### Data Management
- [ ] Click "Export Data" button:
  - [ ] CSV file downloads
  - [ ] Filename format: `phishguard-history-YYYY-MM-DD.csv`
  - [ ] File contains scan history with headers
- [ ] Click "Clear All" button:
  - [ ] Confirmation dialog appears
  - [ ] Clicking "Cancel" - no change
  - [ ] Clicking "OK" - all data cleared
  - [ ] Settings reset to defaults
  - [ ] Scan history emptied

### Action Buttons
- [ ] "Reset to Defaults" button:
  - [ ] Confirmation dialog appears
  - [ ] Settings revert to default values
  - [ ] Toast notification appears
- [ ] "Save Changes" button:
  - [ ] Validates inputs
  - [ ] Shows error for invalid values
  - [ ] Shows success toast on save
  - [ ] Updates background worker

---

## 🔔 Notification Testing

### Desktop Notifications
- [ ] Chrome → Settings → Privacy → Site Settings → Notifications
- [ ] Verify Chrome Extensions are allowed
- [ ] Send/forward a phishing email to yourself
- [ ] Wait for automatic scan (or click "Scan Now")
- [ ] If risk score >= 70:
  - [ ] Desktop notification appears
  - [ ] Title: "🚨 Phishing Detected!"
  - [ ] Message shows subject and risk score
  - [ ] Clicking notification opens popup

### Daily Limit Notification
- [ ] Set daily limit to 2 (for testing)
- [ ] Run 2 manual scans
- [ ] Third scan triggers notification:
  - [ ] Title: "PhishGuard - Daily Limit Reached"
  - [ ] Message: "Scanned X emails today..."

---

## 📊 Stats Dashboard Testing

### Today's Activity Cards
- [ ] "Scans Today" - increments with each scan
- [ ] "Daily Limit" - matches settings value
- [ ] "Safe" count - increments for scores < 40
- [ ] "Threats" count - increments for scores >= 70

### Status Indicator
- [ ] Auto-scan enabled: Shows "Monitoring Active" (green pulse)
- [ ] Auto-scan disabled: Shows "Monitoring Paused" (gray)
- [ ] "Next scan in X minutes" - updates correctly
- [ ] "Last update" - shows time ago, updates every 5s

### Recent Scans List
- [ ] Shows last 5 scans
- [ ] Newest scans appear at top
- [ ] Each scan shows:
  - [ ] Risk score badge (colored)
  - [ ] Email subject (truncated if long)
  - [ ] Time ago (e.g., "2m ago")
  - [ ] Verdict label (Safe/Suspicious/Phishing)
- [ ] Empty state when no scans:
  - [ ] Icon displayed
  - [ ] Message: "No scans yet"
  - [ ] Prompt: "Click 'Scan Now' to get started"

### Auto-Refresh
- [ ] Open popup
- [ ] Wait 5 seconds
- [ ] Stats update automatically
- [ ] "Last update" time changes

---

## 📧 Real Email Testing

### Test Email 1: Legitimate Email
**Send yourself:**
```
From: you@gmail.com
Subject: Test - Normal Email
Body: This is a legitimate email with no suspicious content.
Just testing the PhishGuard extension.
```

**Expected:**
- [ ] Risk score: 10-30 (Safe)
- [ ] Badge color: Green
- [ ] Verdict: Safe
- [ ] No notification

---

### Test Email 2: Promotional Email
**Send yourself:**
```
From: newsletter@company.com
Subject: Special Offer - 50% Off This Weekend!
Body: Click here to shop now: https://company.com/sale
Limited time offer. Don't miss out!
```

**Expected:**
- [ ] Risk score: 30-50 (Borderline Safe/Suspicious)
- [ ] Badge color: Green or Yellow
- [ ] Verdict: Safe or Suspicious
- [ ] Notification depends on risk threshold

---

### Test Email 3: Phishing - Urgency + Suspicious Link
**Send yourself:**
```
From: security@fake-bank.com
Subject: URGENT: Verify Your Account Now
Body: Your account has been locked due to suspicious activity.
Click here immediately to verify: http://bit.ly/fake-verify
You have 24 hours or your account will be permanently closed.
```

**Expected:**
- [ ] Risk score: 70-90 (Phishing)
- [ ] Badge color: Red
- [ ] Verdict: Phishing
- [ ] Desktop notification appears
- [ ] LLM analysis explains why (urgency, suspicious link, etc.)

---

### Test Email 4: CEO Fraud / BEC
**Send yourself:**
```
From: CEO <ceo@similar-domain.com>
Subject: Urgent Wire Transfer - Confidential
Body: I need you to wire $5,000 to this account immediately.
Account: 123456789
This is time-sensitive. Don't discuss with anyone.
I'm in a meeting and can't be reached.
```

**Expected:**
- [ ] Risk score: 85-95 (High-confidence Phishing)
- [ ] Badge color: Red
- [ ] Verdict: Phishing
- [ ] Desktop notification appears
- [ ] LLM identifies BEC attempt, urgency, confidentiality tactics

---

### Test Email 5: HTML Email with Images
**Send an HTML email with:**
- Images
- Links
- Formatted text
- Tracking pixels

**Expected:**
- [ ] Extension handles HTML parsing correctly
- [ ] Links extracted for scanning
- [ ] Images don't break the scan
- [ ] Risk score based on content, not formatting

---

## 🐛 Error Handling Testing

### Backend API Offline
- [ ] Stop FastAPI server (Ctrl+C)
- [ ] Click "Scan Now"
- [ ] Error appears: "Scan failed. Check if API is running."
- [ ] Settings → API Status shows "Offline" (red)
- [ ] Extension doesn't crash

### Gmail Permission Revoked
- [ ] Go to Google Account → Permissions
- [ ] Revoke PhishGuard access
- [ ] Click "Scan Now"
- [ ] Authentication prompt appears
- [ ] Can re-grant access
- [ ] Extension recovers gracefully

### Network Issues
- [ ] Disconnect internet
- [ ] Click "Scan Now"
- [ ] Error message appears
- [ ] Reconnect internet
- [ ] Extension works again

### Invalid API Endpoint
- [ ] Settings → API Endpoint → Enter invalid URL
- [ ] Click "Save Changes"
- [ ] Error toast appears
- [ ] Settings don't save
- [ ] Previous valid URL retained

---

## 💾 Storage Testing

### Settings Persistence
- [ ] Change settings (interval, limit, threshold)
- [ ] Close settings page
- [ ] Reopen settings
- [ ] Verify values persisted
- [ ] Close Chrome completely
- [ ] Reopen Chrome
- [ ] Verify settings still saved

### Scan History Storage
- [ ] Run 10 scans
- [ ] Close popup
- [ ] Reopen popup
- [ ] Verify all 10 scans appear
- [ ] Run 45 more scans (55 total)
- [ ] Verify only last 50 stored (oldest 5 removed)

### Export Data
- [ ] Run 10 scans
- [ ] Settings → Export Data
- [ ] Open CSV file
- [ ] Verify all 10 scans present
- [ ] Check headers: Timestamp, Subject, Risk Score, Verdict, Details
- [ ] Verify data format is correct

---

## 🎨 UI/UX Testing

### Popup Design
- [ ] Popup opens at 350px width
- [ ] Gradient background renders correctly
- [ ] All text is readable
- [ ] Icons appear properly
- [ ] Hover effects work on buttons
- [ ] Scrolling works for long scan lists
- [ ] No visual glitches or overlaps

### Settings Page Design
- [ ] Page renders on full gradient background
- [ ] All sections visible and organized
- [ ] Form inputs styled correctly
- [ ] Toggle switches animate smoothly
- [ ] Range slider moves smoothly
- [ ] Buttons have hover effects
- [ ] Toast notifications appear/disappear smoothly

### Responsive Design
- [ ] Resize browser window
- [ ] UI adapts to smaller screens
- [ ] No horizontal scrolling in popup
- [ ] Settings page remains usable
- [ ] Text doesn't overflow containers

### Accessibility
- [ ] All buttons are keyboard accessible (Tab key)
- [ ] Enter key works on focused buttons
- [ ] Color contrast is sufficient (WCAG AA)
- [ ] Text is readable at 100% zoom
- [ ] No flashing/seizure-inducing animations

---

## 🔒 Security & Privacy Testing

### OAuth Flow
- [ ] Extension requests correct Gmail scopes
- [ ] Permissions prompt shows "Read-only" access
- [ ] No write/send permissions requested
- [ ] OAuth token stored securely (chrome.identity)
- [ ] Token refreshes automatically when expired

### Data Privacy
- [ ] Email content NOT stored permanently (check chrome.storage.local)
- [ ] Only metadata stored: subject, score, verdict, timestamp
- [ ] No data sent to third parties
- [ ] All API calls go to localhost backend
- [ ] Clear data removes all personal info

### API Keys
- [ ] No API keys hardcoded in extension code
- [ ] Keys stored in backend .env file
- [ ] Extension never exposes keys to client

---

## ⚡ Performance Testing

### Scan Speed
- [ ] Single email scans in < 5 seconds
- [ ] 5 emails batch scans in < 20 seconds
- [ ] Background scans don't freeze UI
- [ ] Popup remains responsive during scans

### Resource Usage
- [ ] Open Chrome Task Manager (Shift+Esc)
- [ ] Find "PhishGuard" process
- [ ] Memory usage < 100 MB
- [ ] CPU usage spikes only during scans
- [ ] No memory leaks after 50+ scans

### Battery Impact (Laptop)
- [ ] Extension doesn't drain battery excessively
- [ ] Background alarms don't wake CPU constantly
- [ ] Idle time between scans has minimal impact

---

## 🌐 Browser Compatibility

### Chrome (Primary Target)
- [ ] Version 100+ (Manifest V3 support)
- [ ] All features work
- [ ] No console errors

### Edge (Chromium-based)
- [ ] Extension loads successfully
- [ ] Basic functionality works
- [ ] May need separate Edge store listing

### Brave (Chromium-based)
- [ ] Extension loads successfully
- [ ] Privacy features don't block OAuth
- [ ] Scans work normally

---

## 📋 Final Checklist

### Before Publishing:

- [ ] All tests above passed
- [ ] Icons created (16, 32, 48, 128)
- [ ] No TODO comments in production code
- [ ] No console.log statements (or kept for debugging)
- [ ] README.md reviewed and accurate
- [ ] INSTALL.md step-by-step verified
- [ ] Privacy policy written (if required)
- [ ] Screenshots taken for Chrome Web Store
- [ ] Promotional images prepared (440x280, 920x680, 1400x560)
- [ ] Version number finalized in manifest.json

### During Testing:
- [ ] Test on fresh Chrome profile (no other extensions)
- [ ] Test with multiple Gmail accounts
- [ ] Test with inbox of 1000+ emails
- [ ] Test with slow internet connection
- [ ] Test on Windows 10/11
- [ ] Test on different screen sizes

### Post-Testing:
- [ ] Document any bugs found
- [ ] Fix critical issues
- [ ] Optional: Create GitHub repository
- [ ] Optional: Add telemetry (usage stats)
- [ ] Prepare for Chrome Web Store submission

---

## 🎯 Success Criteria

Extension is ready for publishing when:

- ✅ All core features work without errors
- ✅ UI is polished and professional
- ✅ No security vulnerabilities
- ✅ Privacy-compliant (no data leaks)
- ✅ Performance is acceptable
- ✅ Documentation is complete
- ✅ Icons and branding finalized
- ✅ Test coverage > 80%

---

## 📝 Bug Tracking Template

When you find a bug, document it:

```markdown
### Bug #X: [Title]

**Severity:** Critical / High / Medium / Low

**Steps to Reproduce:**
1. Step one
2. Step two
3. Expected: ...
4. Actual: ...

**Environment:**
- Chrome Version: 
- Extension Version: 
- OS: Windows 11

**Screenshots/Logs:**
[Attach console errors, screenshots]

**Status:** Open / In Progress / Fixed / Won't Fix
```

---

## ✅ Testing Complete!

Once all checkboxes are marked, your extension is ready for:
- Real-world usage
- Beta testing with friends
- Chrome Web Store submission
- Production deployment

**Good luck! 🚀**
