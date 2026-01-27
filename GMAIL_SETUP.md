# Gmail Integration Setup Guide

## Overview
The Gmail listener monitors your Gmail inbox for new emails and automatically scans any URLs found in the email body for phishing threats.

---

## Prerequisites
- Google Cloud Platform account
- Gmail account
- Python environment with all dependencies installed

---

## Step-by-Step Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Gmail API**:
   - Go to **APIs & Services > Library**
   - Search for "Gmail API"
   - Click **Enable**

### 2. Create OAuth 2.0 Credentials

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth client ID**
3. Configure OAuth consent screen (if first time):
   - User Type: **External** (or Internal if G Suite)
   - App name: `Phishing Agent`
   - Add your email as test user
   - Scopes: Add `https://www.googleapis.com/auth/gmail.readonly`
4. Application type: **Desktop app**
5. Name: `Phishing Agent Gmail Listener`
6. Click **Create**

### 3. Download Credentials

1. After creating, click the **Download** button (⬇️)
2. Save the file as `client_secret.json` in your project root:
   ```
   D:\Portfolio_Projects\Phishing_Agent\client_secret.json
   ```

### 4. Run Gmail Listener

```bash
# Make sure FastAPI is running first
uvicorn main:app --reload

# In a new terminal, run the Gmail listener
python gmail_listener.py
```

### 5. First-Time OAuth Flow

When you run `gmail_listener.py` for the first time:

1. A browser window will open automatically
2. Sign in to your Gmail account
3. Grant permissions to read emails
4. A `token.pickle` file will be created (stores your OAuth token)

**Note:** Future runs won't require browser authentication (uses cached token)

---

## How It Works

```
┌─────────────────┐
│  Gmail Inbox    │
│  (New Email)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ gmail_listener  │ ← Polls every 15 seconds
│    .py          │
└────────┬────────┘
         │
         ├─ Extracts URLs from email body
         │
         ▼
┌─────────────────┐
│  FastAPI Server │
│  /scan endpoint │ ← POST {input: url, type: "url"}
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Phishing       │
│  Detection      │
│  (Rule+Intel+LLM)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  JSON Report    │
│  Saved to       │
│  data/reports/  │
└─────────────────┘
```

---

## Testing

### Test Email Setup

Send yourself a test email with a suspicious URL:

**Subject:** Test Phishing Detection

**Body:**
```
Hey, please verify your account:
https://secure-paypa1.com/login

Click here immediately!
```

### Expected Behavior

1. `gmail_listener.py` detects the new unread email
2. Extracts URL: `https://secure-paypa1.com/login`
3. Sends to API for scanning
4. Marks email as read
5. Report saved to `data/reports/`

### Check Logs

```bash
# View real-time logs
tail -f data/agent.log
```

---

## Configuration

### Modify Polling Interval

Edit [gmail_listener.py](gmail_listener.py#L45):

```python
time.sleep(15)  # Change from 15 to desired seconds
```

### Filter Emails

Modify the Gmail query in [gmail_listener.py](gmail_listener.py#L24):

```python
# Current: all unread emails
q='is:unread'

# Examples:
q='is:unread subject:urgent'          # Only urgent emails
q='is:unread from:unknown-sender.com' # Specific sender
q='is:unread newer_than:1h'          # Last hour only
```

---

## Troubleshooting

### Issue: "Client secret not found"
**Solution:** Download `client_secret.json` from Google Cloud Console

### Issue: "Invalid grant" error
**Solution:** Delete `token.pickle` and re-authenticate

### Issue: "Quota exceeded"
**Solution:** Gmail API has rate limits (250 quota units/user/second). Add delay between scans.

### Issue: No URLs extracted
**Solution:** The regex pattern looks for `https?://` - check email format

---

## Security Best Practices

✅ **DO:**
- Keep `client_secret.json` and `token.pickle` private
- Add them to `.gitignore` (already done)
- Use read-only scope (`gmail.readonly`)
- Monitor API quota usage

❌ **DON'T:**
- Commit credentials to Git
- Share OAuth tokens
- Use modify/delete scopes (not needed)

---

## Current Limitations

⚠️ **Known Issues:**
- Only scans URLs in plain text email bodies
- HTML emails may not extract URLs correctly
- No support for attachments (PDFs, docs)
- Marks ALL emails as read (not just phishing)

**Planned Improvements:**
- HTML email parsing
- Attachment scanning
- Smart labeling (mark only phishing emails)
- Email notification on high-risk detection

---

## Integration with UI

The Streamlit UI (Tab 3) shows instructions but doesn't yet integrate live monitoring.

**Future Enhancement:** Display real-time Gmail scan results in the UI using WebSocket or polling.

---

## Files Created

After setup, you'll have:

```
Phishing_Agent/
├── client_secret.json    ← OAuth credentials (DO NOT COMMIT)
├── token.pickle          ← OAuth token cache (DO NOT COMMIT)
└── gmail_listener.py     ← Main listener script
```

---

## Support

For Gmail API issues:
- [Gmail API Docs](https://developers.google.com/gmail/api)
- [OAuth 2.0 Troubleshooting](https://developers.google.com/identity/protocols/oauth2/native-app#errors)

For project issues:
- Check `data/agent.log`
- Run `python setup_check.py` to validate configuration

---

**Status:** ✅ Ready to use after OAuth setup
**Last Updated:** January 7, 2026
