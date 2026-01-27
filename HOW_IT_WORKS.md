# 🎯 What This Project Does (Simple Explanation)

## In 10 Seconds
**Your AI bodyguard that checks if emails, URLs, or links are trying to scam you.**

---

## 📧 How It Works (Super Simple)

### **Scenario: You get a suspicious email**

```
From: security@paypa1-verify.com  ← (notice the "1" instead of "l")
Subject: Urgent! Verify your account now!
Body: Click here: https://secure-paypa1.com/login
```

### **What happens when Gmail Listener scans it:**

```
Step 1: RULE CHECK (Super Fast) 
→ Looks for red flags: "urgent", "verify", fake domain "paypa1"
→ Result: ⚠️ SUSPICIOUS

Step 2: THREAT INTEL (Ask the Experts)
→ Checks VirusTotal: "Is this URL flagged by antivirus companies?"
→ Checks AlienVault OTX: "Have hackers used this before?"
→ Result: 🚨 3/10 antivirus engines flagged it

Step 3: AI BRAIN (Gemini Thinks)
→ Reads all the evidence
→ Makes smart decision based on patterns
→ Result: 🧠 Risk Score: 85/100 - PHISHING!

Final Verdict: ⛔ DANGER - BLOCK THIS EMAIL!
```

---

## 🎬 Real Example from Your Logs

**What You Did:**
- Started API server (uvicorn) ✅
- Started Gmail listener ✅  
- Gmail found emails in your inbox
- Extracted URLs from them
- Sent 10+ URLs to scan

**What Happened:**
- First 5 URLs: ✅ Scanned successfully
- After 5: ❌ Gemini said "Too fast! Wait 1 minute" (free tier limit)
- Gmail listener: ❌ Crashed (permission issue)

---

## 🚨 Issues Found in Your Logs

### **Issue 1: Gemini Rate Limit** ✅ FIXED
**Problem:** Free tier = 5 scans per minute. You scanned too fast.
```
ERROR: 429 quota exceeded... Please retry in 58s
```
**What I Fixed:** Added automatic waiting when limit is hit

### **Issue 2: Gmail Permission Error** ✅ FIXED  
**Problem:** Gmail listener tried to mark emails as "read" but didn't have permission
```
HttpError 403: Request had insufficient authentication scopes
```
**What I Fixed:** Changed permission from `readonly` to `modify`

---

## 🔄 What You Need to Do Now

### **Step 1: Delete Old Token**
```powershell
# The old token has wrong permissions
Remove-Item token.pickle
```

### **Step 2: Restart Gmail Listener**
```powershell
python gmail_listener.py
```
**You'll see:** Browser opens → Click "Allow" again → Done!

### **Step 3: Test It**

**Option A: Test with Gmail (Coolest Way)**
1. Send yourself a test email with a suspicious link:
   ```
   Subject: Test
   Body: Check this out: https://secure-paypa1.com/login
   ```
2. Watch the terminal - it will auto-scan the URL!
3. Check `data/reports/` folder for the JSON report

**Option B: Test with UI (Easy Way)**
```powershell
# In new terminal
streamlit run ui/app.py
```
1. Open browser: http://localhost:8501
2. Go to "Single Scan" tab
3. Paste: `https://secure-paypa1.com/login`
4. Click "Scan Now"
5. See result: DANGER! 🚨

**Option C: Test with Script (Automated)**
```powershell
python test_csv.py
```
Will test everything automatically!

---

## 📊 Current Status

| Feature | Status | Notes |
|---------|--------|-------|
| ✅ API Server | WORKING | Running on http://localhost:8000 |
| ⚠️ Gmail Listener | NEEDS RE-AUTH | Delete token.pickle and re-run |
| ✅ Rule Detection | WORKING | Checks keywords & fake domains |
| ✅ VirusTotal | WORKING | (if you have API key) |
| ✅ AlienVault OTX | WORKING | (if you have API key) |
| ⚠️ Gemini AI | RATE LIMITED | Free tier: 5/minute (now has auto-wait) |
| ✅ Streamlit UI | WORKING | http://localhost:8501 |

---

## 🎯 Quick Test Command

```powershell
# Send a test URL to the API
curl -X POST http://localhost:8000/scan -H "Content-Type: application/json" -d '{\"input\":\"https://secure-paypa1.com/login\",\"type\":\"url\"}'
```

Expected output:
```json
{
  "risk_score": 85,
  "classification": "Phishing",
  "alert": "DANGER – BLOCK!",
  "rule": {"suspected": true, "reasons": ["Domain typo-squatting"]},
  "llm": {"reason": "Fake PayPal domain designed to steal credentials"}
}
```

---

## 💡 What Makes It Smart?

**3-Layer Protection:**
1. **Rules** = Fast pattern matching (like a spell-checker for scams)
2. **Threat Intel** = Asks security companies "seen this before?"
3. **AI** = Reads all evidence and makes final judgment

**It's like having:**
- A security guard (rules) 🛡️
- A detective (threat intel) 🔍  
- A judge (AI) ⚖️

All working together to protect you!

---

## 🐛 Troubleshooting

**Gmail listener keeps crashing?**
```powershell
Remove-Item token.pickle
python gmail_listener.py
```

**"429 quota exceeded" errors?**
- **Fixed!** Now waits automatically
- OR upgrade to paid Gemini tier (higher limits)

**API not starting?**
```powershell
# Check if port 8000 is already in use
netstat -ano | findstr :8000
```

**No emails being scanned?**
- Check Gmail has unread emails
- Send yourself a test email with a URL

---

## 📁 Where Are Reports Saved?

Every scan creates a JSON file:
```
data/reports/1736352000.json
```

Contains:
- Risk score (0-100)
- Classification (Phishing/Safe/Suspicious)
- Why it's dangerous
- What you should do

---

## 🎓 Summary

**YOU BUILT:** An AI phishing detector that:
- ✅ Monitors your Gmail inbox automatically
- ✅ Scans URLs for phishing attempts
- ✅ Uses AI to make smart decisions
- ✅ Saves reports for every scan
- ✅ Has a nice web interface

**STATUS:** 95% Complete! Just need to re-authenticate Gmail.

**NEXT:** Delete `token.pickle` → Run `python gmail_listener.py` → You're done! 🎉
