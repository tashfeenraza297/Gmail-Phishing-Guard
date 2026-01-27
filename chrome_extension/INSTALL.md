# 🚀 Quick Installation Guide

## Step-by-Step Setup (5 minutes)

### ✅ Step 1: Start the Backend API

```powershell
# Open PowerShell in project folder
cd d:\Portfolio_Projects\Phishing_Agent

# Activate Python virtual environment
.\Pvenv\Scripts\activate

# Start FastAPI server
python -m uvicorn main:app --reload
```

**Verify:** Open browser to `http://localhost:8000` - you should see API response

---

### ✅ Step 2: Load Chrome Extension

1. **Open Chrome Extensions Page**
   - Type in address bar: `chrome://extensions/`
   - Or: Menu (⋮) → Extensions → Manage Extensions

2. **Enable Developer Mode**
   - Toggle switch in **top-right corner**

3. **Load Extension**
   - Click **"Load unpacked"** button
   - Browse to: `d:\Portfolio_Projects\Phishing_Agent\chrome_extension`
   - Click **"Select Folder"**

4. **Verify Installation**
   - You should see "PhishGuard" in extensions list
   - Extension icon appears in toolbar (puzzle piece until icons added)

---

### ✅ Step 3: Grant Gmail Permissions

1. **Click Extension Icon** in Chrome toolbar
2. Chrome will prompt: **"PhishGuard wants to access your Gmail"**
3. Click **"Allow"** or **"Continue"**
4. Sign in with your Google account
5. Review permissions and click **"Allow"**

**Permissions needed:**
- ✅ View your email messages (read-only)
- ✅ View basic account info

---

### ✅ Step 4: Configure Settings

1. **Click extension icon** in toolbar
2. Click **⚙️ Settings button** at bottom
3. Verify settings:
   - **API Endpoint:** `http://localhost:8000/scan`
   - **Auto-Scan:** Enabled ✅
   - **Scan Interval:** 10 minutes (recommended)
   - **Daily Limit:** 50 emails
4. Click **"Save Changes"**

---

### ✅ Step 5: Test It!

#### Manual Test:
1. Click extension icon
2. Click **"Scan Now"** button
3. Wait 5-10 seconds
4. Check **"Recent Scans"** section for results

#### Automatic Test:
1. Send yourself a test email with suspicious content:
   ```
   Subject: URGENT: Verify your account NOW!
   Body: Click here immediately to avoid account suspension: http://bit.ly/fake-link
   Your account will be closed in 24 hours if you don't verify.
   ```
2. Wait 10 minutes (or click "Scan Now")
3. Extension should detect it as phishing (70-95 risk score)
4. You'll get a desktop notification

---

## ✅ You're Done!

PhishGuard is now:
- 🟢 Monitoring your Gmail inbox
- 🔍 Scanning new emails every 10 minutes
- 🛡️ Protecting you from phishing attacks
- 🔔 Alerting you to threats

---

## 🎯 Quick Actions

### View Stats
Click extension icon to see:
- Scans today / Daily limit
- Safe emails count
- Threats blocked
- Recent scan history

### Change Scan Interval
Settings → Scan Interval → Choose from:
- Every 10 minutes (aggressive)
- Every 30 minutes (balanced)
- Every 1 hour (conservative)
- Every 3-6 hours (light)
- Once per day (minimal)

### Pause Monitoring
Settings → Auto-Scan → Toggle OFF

### Export Scan History
Settings → Export Data button

---

## 🐛 Troubleshooting

### "API Offline" Error
**Problem:** Extension can't reach backend server  
**Solution:**
```powershell
# Make sure FastAPI is running
cd d:\Portfolio_Projects\Phishing_Agent
.\Pvenv\Scripts\activate
python -m uvicorn main:app --reload
```
Visit `http://localhost:8000` to verify

### "Authentication Failed"
**Problem:** Gmail permissions not granted  
**Solution:**
1. Go to `chrome://extensions/`
2. Find PhishGuard → Click "Details"
3. Click "Remove" under Permissions
4. Click extension icon again and re-grant access

### No Scans Happening
**Problem:** Auto-scan not running  
**Solution:**
1. Settings → Check "Auto-Scan" is enabled
2. Check scan interval is set (not 0)
3. Verify extension is enabled in `chrome://extensions/`

### Daily Limit Reached
**Problem:** Hit 50 scans/day limit  
**Solution:**
- Wait until midnight (auto-resets)
- Or: Settings → Increase Daily Limit to 100-200

---

## 📊 What Happens Next?

### Automatic Scanning:
- Extension wakes up every X minutes (your interval)
- Fetches ONLY emails from last X minutes
- Scans up to 5 emails per check
- Updates stats and history
- Shows notification if phishing detected

### When Phishing Found:
```
🚨 Desktop Notification:
"Phishing Detected!"
Subject: "Urgent: Verify account"
Risk: 95/100
```

Click notification or extension icon to see full details.

---

## 🎨 Next Steps

### Optional Enhancements:

1. **Create Custom Icons**
   - See `chrome_extension/icons/ICONS_README.md`
   - Use Canva, GIMP, or AI generator
   - Add 16x16, 32x32, 48x48, 128x128 PNG files

2. **Adjust Risk Threshold**
   - Settings → Risk Threshold slider
   - Default: 70 (only phishing)
   - Lower to 40: alerts on suspicious emails too
   - Higher to 80: only very confident threats

3. **Enable Sound Alerts**
   - Settings → Sound Alerts toggle
   - Plays sound when threat detected

4. **Test with Real Phishing Examples**
   - Forward known spam to yourself
   - Check dataset: `archive/Nazario.csv` for examples
   - See how extension scores them

---

## 📱 Daily Usage

### Morning Routine:
1. Click extension icon
2. Check stats: "Safe emails: 12, Threats: 0"
3. Continue your day protected ✅

### When Alert Appears:
1. Read notification: "Phishing Detected!"
2. Click extension icon
3. Review scan details
4. **DO NOT click links in that email**
5. Report or delete the email

### Weekly Review:
1. Settings → Export Data
2. Review CSV file
3. See patterns (which senders, types)
4. Adjust settings if needed

---

## 🎓 Understanding Risk Scores

| Score Range | Verdict | Action |
|------------|---------|--------|
| **0-39** | 🟢 Safe | Normal email, no action needed |
| **40-69** | 🟡 Suspicious | Be cautious, verify sender |
| **70-100** | 🔴 Phishing | DO NOT CLICK LINKS, report/delete |

### Example Scores:
- **15** - Newsletter from trusted company
- **35** - Promotional email with tracking links
- **55** - Unsolicited offer, unknown sender
- **75** - Fake invoice, urgent language, suspicious link
- **95** - CEO fraud, account verification scam

---

**🎉 Congratulations! You're now protected by PhishGuard!**

---

**Need Help?** See [README.md](README.md) for full documentation.
