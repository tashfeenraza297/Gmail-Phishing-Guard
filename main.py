# main.py
import project_root
import uvicorn, argparse, json, datetime, re
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from tools.rule_tool import RuleTool
from tools.virustotal_tool import VirusTotalTool
from tools.otx_tool import OTXTool
from llm_agent import generate_report
from config import CONFIG
from error_handler import log

app = FastAPI(title="AI Phishing Agent")

# Add CORS middleware for Chrome extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def health_check():
    """Health check endpoint for Chrome extension"""
    return {"status": "online", "service": "PhishGuard API", "version": "1.0.0"}

class ScanRequest(BaseModel):
    input: str
    type: str = "url"   # url | ip | email

def extract_urls(text: str) -> list:
    """Extract URLs from email/text content"""
    url_pattern = r'https?://[^\s<>"\']+|www\.[^\s<>"\']+'
    urls = re.findall(url_pattern, text)
    return [url if url.startswith('http') else f'http://{url}' for url in urls]

def run_scan(data: str, typ: str) -> dict:
    # 1. Rule
    rule = RuleTool.analyze(data)

    # 2. Threat Intel (only if rule suspicious)
    intel = []
    if rule["suspected"]:
        if typ == "email":
            # Extract URLs from email body and scan them
            urls = extract_urls(data)
            if urls:
                # Scan first URL found (or could scan all)
                primary_url = urls[0]
                intel.append(VirusTotalTool.scan_url(primary_url))
                intel.append(OTXTool.check_indicator(primary_url, "url"))
                intel.append({"source": "Email Analysis", "urls_found": len(urls), "scanned_url": primary_url})
            else:
                intel.append({"source": "Email Analysis", "details": "No URLs found in email body"})
        elif typ == "url":
            intel.append(VirusTotalTool.scan_url(data))
            intel.append(OTXTool.check_indicator(data, "url"))
        elif typ == "ip":
            intel.append(OTXTool.check_indicator(data, "IPv4"))
    else:
        intel.append({"source": "Skipped", "details": "Rule clean"})

    # 3. LLM
    llm = generate_report(rule, intel, data)

    # 4. Calculate final risk score (if LLM failed, use rule-based scoring)
    final_risk = llm["risk_score"]
    final_classification = llm["classification"]
    
    # Smart fallback scoring
    if llm["classification"] == "Unknown":
        if rule["suspected"]:
            # Phishing detected by rules but LLM unavailable
            final_risk = 75
            final_classification = "Suspicious"
        else:
            # No threats detected by rules, likely safe
            final_risk = 20
            final_classification = "Likely Safe"

    # 5. Final Report
    report = {
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "input": {"type": typ, "value": data},
        "rule": rule,
        "intel": intel,
        "llm": llm,
        "risk_score": final_risk,
        "classification": final_classification,
        "alert": "⛔ DANGER – BLOCK!" if final_risk > CONFIG["risk_threshold"] else "✅ Safe"
    }
    # Save
    out_path = CONFIG["paths"]["reports"] / f"{int(datetime.datetime.now().timestamp())}.json"
    out_path.write_text(json.dumps(report, indent=2))
    return report

@app.post("/scan")
def scan(req: ScanRequest):
    return run_scan(req.input, req.type)

# CLI
if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--type", default="url")
    parser.add_argument("--serve", action="store_true")
    args = parser.parse_args()

    if args.serve:
        uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
    else:
        print(json.dumps(run_scan(args.input, args.type), indent=2))