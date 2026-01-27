# ui/app.py
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent.resolve()
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

import streamlit as st
import pandas as pd
import json
import requests
from tools.csv_loader import load_phishing_csv

st.set_page_config(page_title="PhishGuard", layout="wide")
st.title("AI Phishing Detection Agent")

API_URL = "http://localhost:8000/scan"

tab1, tab2, tab3 = st.tabs(["Single Scan", "CSV Batch", "Live Gmail"])

# === TAB 1: SINGLE SCAN ===
with tab1:
    col1, col2 = st.columns([3, 1])
    with col1:
        inp = st.text_area("URL / IP / Email", height=100, key="single_input")
    with col2:
        typ = st.selectbox("Type", ["url", "ip", "email"], key="single_type")
    
    if st.button("Scan Now", key="single_scan"):
        if inp.strip():
            with st.spinner("Analyzing..."):
                try:
                    payload = {"input": inp.strip(), "type": typ}
                    r = requests.post(API_URL, json=payload, timeout=30)
                    result = r.json()
                    
                    # === BEAUTIFUL OUTPUT (not raw JSON) ===
                    st.markdown("---")
                    
                    # Header with risk score
                    risk = result.get("risk_score", 0)
                    classification = result.get("classification", "Unknown")
                    
                    if risk >= 70:
                        st.error(f"### 🚨 {classification} - Risk Score: {risk}/100")
                    elif risk >= 40:
                        st.warning(f"### ⚠️ {classification} - Risk Score: {risk}/100")
                    else:
                        st.success(f"### ✅ {classification} - Risk Score: {risk}/100")
                    
                    # Alert banner
                    alert = result.get("alert", "Unknown")
                    if "DANGER" in alert:
                        st.error(f"**{alert}**")
                    else:
                        st.success(f"**{alert}**")
                    
                    # LLM Analysis
                    llm = result.get("llm", {})
                    st.markdown("#### 🧠 AI Analysis")
                    st.info(llm.get("reason", "No analysis available"))
                    st.markdown(f"**Recommended Action:** {llm.get('action', 'N/A')}")
                    
                    # Rule Detection
                    rule = result.get("rule", {})
                    if rule.get("suspected"):
                        st.markdown("#### 🔍 Rule Detection")
                        for reason in rule.get("reasons", []):
                            st.markdown(f"- ⚠️ {reason}")
                    
                    # Threat Intelligence
                    intel = result.get("intel", [])
                    if intel and any(i.get("source") != "Skipped" for i in intel):
                        st.markdown("#### 🛡️ Threat Intelligence")
                        for i in intel:
                            if i.get("source") != "Skipped":
                                source = i.get("source", "Unknown")
                                threat = i.get("threat_level", "N/A")
                                
                                if source == "VirusTotal":
                                    mal = i.get("malicious", 0)
                                    total = i.get("total", 0)
                                    st.markdown(f"**{source}:** {mal}/{total} engines flagged as malicious ({threat} threat)")
                                elif source == "AlienVault OTX":
                                    pulses = i.get("pulses", 0)
                                    st.markdown(f"**{source}:** {pulses} threat reports ({threat} threat)")
                                else:
                                    st.markdown(f"**{source}:** {i}")
                    
                    # Expandable JSON (for technical users)
                    with st.expander("📄 View Raw JSON"):
                        st.json(result, expanded=False)
                    
                except Exception as e:
                    st.error(f"API Error: {e}")
        else:
            st.warning("Enter input!")

# === TAB 2: CSV BATCH (SMART VERSION) ===
with tab2:
    st.info("Auto-loading your Nazario.csv dataset...")
    
    try:
        df = load_phishing_csv()
        total = len(df)
        st.success(f"Loaded **{total}** rows from Nazario.csv")
        st.dataframe(df.head(), use_container_width=True)

        # === AUTO DETECT URL COLUMN ===
        url_col = None
        possible_cols = ["url", "URL", "link", "Link", "phishing_url", "email_url"]
        for col in possible_cols:
            if col in df.columns:
                url_col = col
                break

        urls = []
        if url_col:
            st.info(f"Found URL column: `{url_col}`")
            urls = df[url_col].dropna().astype(str).tolist()
        else:
            # === FALLBACK: Extract URLs from 'body', 'message', 'email', 'text' columns ===
            text_cols = []
            for col in ["body", "message", "email", "text", "content"]:
                if col in df.columns:
                    text_cols.append(col)
            
            if text_cols:
                st.info(f"No URL column. Extracting from: {text_cols}")
                import re
                url_pattern = r'https?://[^\s"\'<>]+'
                for col in text_cols:
                    urls.extend(
                        df[col].astype(str).apply(
                            lambda x: re.findall(url_pattern, x)
                        ).explode().dropna().tolist()
                    )
                urls = list(set(urls))  # dedupe
            else:
                st.error("No URL column or text column found!")
                st.stop()

        if not urls:
            st.warning("No URLs found in dataset.")
        else:
            st.write(f"Found **{len(urls)}** unique URLs to scan")

            if st.button("RUN BATCH SCAN", type="primary", use_container_width=True):
                results = []
                progress = st.progress(0)
                status = st.empty()

                for i, url in enumerate(urls):
                    if not url.startswith("http"):
                        continue  # skip invalid
                    status.text(f"Scanning {i+1}/{len(urls)}: {url[:60]}...")
                    try:
                        payload = {"input": url, "type": "url"}
                        r = requests.post(API_URL, json=payload, timeout=30)
                        res = r.json()
                        results.append({
                            "url": url,
                            "risk": res["risk_score"],
                            "classification": res["classification"],
                            "alert": res["alert"]
                        })
                    except Exception as e:
                        results.append({"url": url, "risk": "ERROR", "classification": "ERROR", "alert": str(e)})
                    
                    progress.progress((i + 1) / len(urls))
                
                progress.empty()
                status.empty()
                
                df_res = pd.DataFrame(results)
                st.success("Batch Scan Complete!")
                st.dataframe(df_res, use_container_width=True)
                
                # Accuracy
                high_risk = df_res['risk'].apply(lambda x: isinstance(x, (int, float)) and x > 70).sum()
                acc = high_risk / len(df_res) * 100 if len(df_res) > 0 else 0
                st.metric("Phishing Detection Rate", f"{acc:.1f}%")

                # Download
                csv = df_res.to_csv(index=False).encode()
                st.download_button("Download Results", csv, "phishing_batch_results.csv", "text/csv")

    except Exception as e:
        st.error(f"CSV Load Failed: {e}")
        st.info("Make sure Nazario.csv is in: `archive/Nazario.csv`")
# === TAB 3: LIVE GMAIL ===
with tab3:
    st.info("Run `python gmail_listener.py` in another terminal to push new emails to the API.")
    st.code("python gmail_listener.py", language="bash")