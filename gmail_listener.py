# gmail_listener.py
import os, pickle, base64, time, requests
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from datetime import datetime

# Changed from readonly to modify - needed to mark emails as read
SCOPES = ['https://www.googleapis.com/auth/gmail.modify']
CREDS_FILE = "token.pickle"
CLIENT_SECRET = "client_secret.json"  # download from Google Cloud

# Safety settings
MAX_EMAILS_PER_CHECK = 5  # Only process 5 emails at a time (prevent quota drain)
SCAN_LIMIT_PER_DAY = 50   # Stop after 50 scans per day

def get_service():
    creds = None
    if os.path.exists(CREDS_FILE):
        with open(CREDS_FILE, 'rb') as token:
            creds = pickle.load(token)
    if not creds or not creds.valid:
        flow = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRET, SCOPES)
        creds = flow.run_local_server(port=0)
        with open(CREDS_FILE, 'wb') as token:
            pickle.dump(creds, token)
    return build('gmail', 'v1', credentials=creds)

def extract_urls(text):
    import re
    return re.findall(r'https?://[^\s]+', text)

service = get_service()
last_id = None
scans_today = 0
last_reset = datetime.now().date()

print("[GMAIL LISTENER] Started monitoring...")
print(f"[CONFIG] Max emails per check: {MAX_EMAILS_PER_CHECK}")
print(f"[CONFIG] Daily scan limit: {SCAN_LIMIT_PER_DAY}")
print(f"[INFO] Checking inbox every 15 seconds...\n")

while True:
    # Reset daily counter
    current_date = datetime.now().date()
    if current_date != last_reset:
        scans_today = 0
        last_reset = current_date
        print(f"[RESET] Daily counter reset. New date: {current_date}")
    
    # Check if daily limit reached
    if scans_today >= SCAN_LIMIT_PER_DAY:
        print(f"[LIMIT] Daily scan limit ({SCAN_LIMIT_PER_DAY}) reached. Sleeping until midnight...")
        time.sleep(3600)  # Sleep 1 hour, then check again
        continue
    
    results = service.users().messages().list(userId='me', q='is:unread').execute()
    messages = results.get('messages', [])
    
    if messages:
        print(f"[INBOX] Found {len(messages)} unread email(s)")
    
    # Limit emails processed per check
    messages_to_process = messages[:MAX_EMAILS_PER_CHECK]
    
    for msg in messages_to_process:
        if last_id and msg['id'] == last_id: continue
        
        txt = service.users().messages().get(userId='me', id=msg['id']).execute()
        payload = txt['payload']
        
        # Extract subject for logging
        subject = "Unknown"
        headers = payload.get('headers', [])
        for header in headers:
            if header['name'] == 'Subject':
                subject = header['value']
                break
        
        print(f"\n[EMAIL] Subject: {subject[:50]}...")
        
        body = ""
        if 'parts' in payload:
            for part in payload['parts']:
                if part['mimeType'] == 'text/plain':
                    body = base64.urlsafe_b64decode(part['body']['data']).decode()
        else:
            if 'data' in payload.get('body', {}):
                body = base64.urlsafe_b64decode(payload['body']['data']).decode()

        urls = extract_urls(body)
        
        if urls:
            print(f"[URLS] Found {len(urls)} URL(s) to scan")
            for i, url in enumerate(urls[:3], 1):  # Max 3 URLs per email
                if scans_today >= SCAN_LIMIT_PER_DAY:
                    print(f"[LIMIT] Daily limit reached, skipping remaining URLs")
                    break
                    
                print(f"  [{i}] Scanning: {url[:60]}...")
                try:
                    r = requests.post("http://localhost:8000/scan", json={"input": url, "type": "url"}, timeout=30)
                    result = r.json()
                    risk = result.get('risk_score', 0)
                    classification = result.get('classification', 'Unknown')
                    print(f"      Result: {classification} (Risk: {risk}/100)")
                    scans_today += 1
                except Exception as e:
                    print(f"      Error: {e}")
        else:
            print(f"[URLS] No URLs found in email")
        
        # Mark read
        service.users().messages().modify(userId='me', id=msg['id'], body={'removeLabelIds': ['UNREAD']}).execute()
        print(f"[DONE] Email marked as read\n")
        print(f"[STATS] Scans today: {scans_today}/{SCAN_LIMIT_PER_DAY}")
    
    last_id = messages[0]['id'] if messages else last_id
    time.sleep(15)