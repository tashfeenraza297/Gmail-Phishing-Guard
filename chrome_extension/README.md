# 🛡️ PhishGuard Chrome Extension

**AI-Powered Real-time Phishing Protection for Gmail**

PhishGuard is a beautiful Chrome extension that monitors your Gmail inbox and automatically detects phishing emails using advanced AI and threat intelligence.

## ✨ Features

- 🤖 **AI-Powered Detection** - Uses Google Gemini LLM with smart fallback models
- 🔍 **3-Layer Analysis** - Rule-based patterns + VirusTotal + AlienVault OTX + LLM reasoning
- ⚡ **Real-time Monitoring** - Scans new emails automatically (configurable intervals)
- 🎨 **Beautiful UI** - Modern gradient design with smooth animations
- 📊 **Smart Scoring** - Risk scores from 0-100 with color-coded alerts
- 🔔 **Desktop Notifications** - Instant alerts for detected threats
- 📈 **Scan History** - Track all scanned emails with exportable reports
- 🛡️ **Privacy First** - All scans run locally, no data sent to third parties
- ⚙️ **Fully Configurable** - Set scan intervals, daily limits, risk thresholds

## 🚀 Quick Start

### Prerequisites

1. **Backend API Running**
   ```bash
   cd d:\Portfolio_Projects\Phishing_Agent
   # Activate virtual environment
   .\Pvenv\Scripts\activate
   # Start FastAPI server
   python -m uvicorn main:app --reload
   ```
   API should be running at `http://localhost:8000`

2. **API Keys Configured**
   - Create `.env` file with:
     - `GEMINI_API_KEY` (Google Gemini)
     - `VIRUSTOTAL_API_KEY` (VirusTotal)
     - `OTX_API_KEY` (AlienVault OTX)

### Installation

#### Method 1: Load Unpacked (Developer Mode)

1. **Open Chrome Extensions**
   - Go to `chrome://extensions/`
   - Enable **Developer mode** (toggle in top-right)

2. **Load Extension**
   - Click **Load unpacked**
   - Select folder: `d:\Portfolio_Projects\Phishing_Agent\chrome_extension`

3. **Grant Permissions**
   - Click **Details** on PhishGuard extension
   - Scroll to **Permissions**
   - Grant **Gmail API** access when prompted

4. **Configure Settings**
   - Click extension icon in toolbar
   - Click ⚙️ **Settings**
   - Verify API endpoint: `http://localhost:8000/scan`
   - Set your preferred scan interval (default: 10 minutes)
   - Save changes

#### Method 2: Chrome Web Store (Production)

> Coming soon! For now, use Developer Mode installation.

## 📖 How to Use

### 1️⃣ Automatic Monitoring

Once installed and configured, PhishGuard automatically scans new emails:

- **Scans only NEW emails** received in the last X minutes (based on your scan interval)
- **Does NOT scan old emails** - prevents quota drainage
- **Daily limit protection** - Stops at 50 scans/day (configurable)
- **Desktop notifications** - Alerts you when phishing is detected

### 2️⃣ Manual Scan

Click the extension icon to open the popup:

- **Scan Now** - Immediately scan recent emails (last 5)
- **Manual Scan** - Opens Gmail for manual inspection
- **View Stats** - See scans today, threats blocked, safe emails

### 3️⃣ View Results

**Recent Scans** section shows:
- 🟢 **Safe** (0-39) - Legitimate email
- 🟡 **Suspicious** (40-69) - Be cautious
- 🔴 **Phishing** (70-100) - Dangerous threat

Click on any scan to see detailed analysis.

### 4️⃣ Configure Settings

Open settings to customize:

#### Auto-Scan Configuration
- **Enable/Disable** automatic scanning
- **Scan Interval**: 10min / 30min / 1hr / 3hr / 6hr / 1day
- **Daily Limit**: 10-200 emails per day

#### Detection Settings
- **Risk Threshold**: Only alert for scores above this (default: 70)
- **Desktop Notifications**: Enable/disable alerts
- **Sound Alerts**: Play sound on threat detection

#### API Configuration
- **Backend URL**: Your FastAPI endpoint (default: localhost:8000)
- **API Status**: Check if backend is running

#### Data & Privacy
- **Export History**: Download scan history as CSV
- **Clear All Data**: Reset extension (removes all history)

## 🎨 UI Screenshots

### Popup Interface
```
┌────────────────────────────────┐
│  PhishGuard                    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                │
│  📊 Today's Stats              │
│  ├─ Scans: 12 / 50             │
│  ├─ Safe: 10                   │
│  └─ Threats: 2                 │
│                                │
│  🟢 Monitoring Active          │
│  Next scan in ~8 minutes       │
│                                │
│  [🔍 Scan Now] [📧 Manual]     │
│                                │
│  Recent Scans                  │
│  ├─ 95 🔴 "Urgent: Verify..."  │
│  ├─ 15 🟢 "Team Meeting..."    │
│  └─ 68 🟡 "Special Offer..."   │
│                                │
│  Last update: 2m ago           │
└────────────────────────────────┘
```

### Settings Page
```
Beautiful gradient background (purple to blue)
Modern card-based design
Smooth animations and hover effects
Responsive layout
```

## 🔧 Configuration Examples

### Aggressive Protection (High Security)
```
Scan Interval: Every 10 minutes
Daily Limit: 100 emails
Risk Threshold: 40 (alerts on suspicious too)
Notifications: Enabled
```

### Balanced (Recommended)
```
Scan Interval: Every 30 minutes
Daily Limit: 50 emails
Risk Threshold: 70 (phishing only)
Notifications: Enabled
```

### Conservative (Low Volume)
```
Scan Interval: Every 6 hours
Daily Limit: 20 emails
Risk Threshold: 80 (very high confidence)
Notifications: Disabled
```

## 📊 How Scanning Works

### Time-Window Scanning (Key Feature!)

PhishGuard uses **smart time-window filtering**:

1. **User sets scan interval** (e.g., 10 minutes)
2. **Extension wakes up every 10 minutes**
3. **Fetches emails from LAST 10 minutes only**
4. **Scans new emails (max 5 per check)**
5. **Updates scan count and history**

**Example:**
- Scan interval: 10 minutes
- Time now: 2:30 PM
- Fetches emails: 2:20 PM - 2:30 PM only
- Old emails: Ignored ✅

This prevents:
- ❌ Scanning the same email multiple times
- ❌ Draining API quota on old emails
- ❌ Unnecessary processing

### Daily Limit Protection

```
Reset time: Midnight
Default limit: 50 scans/day
When reached: Auto-scan pauses
Manual scan: Still available (up to limit)
```

## 🛡️ Privacy & Security

### What PhishGuard Does:
✅ Scans email subject and body text locally
✅ Sends text to YOUR backend API (localhost)
✅ Stores scan results in Chrome local storage
✅ Uses Gmail API read-only permissions
✅ Respects daily scan limits

### What PhishGuard Does NOT Do:
❌ Store email content permanently
❌ Send data to external servers (except your API)
❌ Access emails you don't grant permission for
❌ Share data with third parties
❌ Modify or delete your emails

## 🐛 Troubleshooting

### "API Offline" Error

**Solution:**
1. Start the backend server:
   ```bash
   cd d:\Portfolio_Projects\Phishing_Agent
   .\Pvenv\Scripts\activate
   python -m uvicorn main:app --reload
   ```
2. Verify API is running: Visit `http://localhost:8000` in browser
3. Check settings: Extension → Settings → API endpoint

### "Authentication Failed" Error

**Solution:**
1. Go to `chrome://extensions/`
2. Find PhishGuard → Click **Details**
3. Scroll to **Permissions** → Click **Remove**
4. Click extension icon → Grant permissions again
5. Or: Revoke access in [Google Account Settings](https://myaccount.google.com/permissions)

### "Daily Limit Reached"

**Solution:**
1. Wait until midnight for automatic reset
2. Or: Settings → Increase daily limit (10-200)
3. Or: Temporarily disable auto-scan

### Scans Not Running

**Solution:**
1. Check Settings → Auto-Scan is enabled
2. Verify scan interval is set (not disabled)
3. Check Chrome → Extensions → PhishGuard is enabled
4. Look for errors in Extension console (chrome://extensions/ → Details → Inspect views)

### No Notifications

**Solution:**
1. Chrome Settings → Privacy and security → Site Settings → Notifications
2. Allow notifications for Chrome Extensions
3. PhishGuard Settings → Enable desktop notifications
4. Check system notification settings (Windows/Mac)

## 📝 Development

### Project Structure
```
chrome_extension/
├── manifest.json       # Extension configuration
├── background.js       # Service worker (background tasks)
├── popup.html          # Popup UI structure
├── popup.js            # Popup logic
├── popup.css           # Popup styles
├── settings.html       # Settings page structure
├── settings.js         # Settings logic
├── settings.css        # Settings styles
└── icons/              # Extension icons (16, 32, 48, 128)
```

### Making Changes

1. **Edit files** in `chrome_extension/`
2. **Reload extension**:
   - Go to `chrome://extensions/`
   - Click reload icon on PhishGuard
3. **Test changes** by clicking extension icon

### Debugging

**Background Service Worker:**
```
chrome://extensions/ → Details → Inspect views: service worker
```

**Popup:**
```
Right-click extension icon → Inspect
```

**View Logs:**
```javascript
// In background.js or popup.js
console.log('Debug message');
```

## 🚀 Publishing to Chrome Web Store

### Prerequisites
- Google Developer account ($5 one-time fee)
- All icons created (16x16, 32x32, 48x48, 128x128)
- Screenshots of extension UI
- Privacy policy (if collecting data)

### Steps

1. **Create Icons**
   - Generate PNG icons at required sizes
   - Place in `chrome_extension/icons/`
   - Update paths in `manifest.json`

2. **Prepare Package**
   ```bash
   cd chrome_extension
   # Remove any dev files
   # Ensure all paths are correct
   ```

3. **Upload to Chrome Web Store**
   - Visit [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - Click **New Item**
   - Upload ZIP of `chrome_extension/` folder
   - Fill in listing details
   - Add screenshots
   - Submit for review

4. **Review Process**
   - Google reviews within 1-3 days
   - May request changes
   - Once approved, extension goes live

## 📄 License

MIT License - See LICENSE file

## 🤝 Contributing

Contributions welcome! Please open issues or submit PRs.

## 📧 Support

For issues or questions:
- GitHub Issues: [your-repo/issues](https://github.com/yourusername/phishguard/issues)
- Email: your-email@example.com

---

**Made with ❤️ using Google Gemini AI**
