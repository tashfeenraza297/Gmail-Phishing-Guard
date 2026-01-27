# AI Phishing Detection Agent

An AI-powered phishing detection system that analyzes **URLs, IPs, and full email content** using:
- Rule-based pattern matching
- Threat intelligence (VirusTotal, AlienVault OTX)
- **Gemini 2.5 Flash LLM** for intelligent reasoning & risk scoring

**Note:** This is an **ongoing project**. I'm actively enhancing it with:
- Fine-tuned LLM models for higher accuracy
- Real-time Gmail monitoring
- Chrome extension for in-browser phishing alerts
- Cloud deployment (e.g: Render/Heroku)
- **Modern, responsive UI/frontend **  
Contributions and feedback are welcome!

---

## Features

| Feature | Description |
|-------|-----------|
| **3-Layer Detection** | Rule → Threat Intel → LLM Reasoning |
| **Input Types** | URLs, IPs, Full Emails |
| **Batch Processing** | 1,565 emails (Nazario Corpus) → 299 URLs scanned |
| **Interactive UI** | Streamlit dashboard (being upgraded to modern frontend) |
| **FastAPI Backend** | REST API for integration |
| **JSON Reports** | Risk score (0–100), classification, action steps |
| **Detection Rate** | **24.7% phishing detected in batch test** |

---

## Demo

![Batch Scan Demo](demo.gif)  
*(GIF will be added soon )*

---

## Tech Stack

- **Language:** Python 3.10+
- **LLM:** Google Gemini 2.5 Flash
- **APIs:** VirusTotal, AlienVault OTX
- **Backend:** FastAPI
- **Frontend:** Streamlit *(will upgrade the UI soon)*
- **Libraries:** `requests`, `pandas`, `google-generativeai`, `python-dotenv`

---

## Setup & Run Locally

```bash
# 1. Clone
git clone https://github.com/tashfeenraza297/ai-phishing-detection-agent.git
cd ai-phishing-detection-agent

# 2. Install
pip install -r requirements.txt

# 3. Check Setup
python setup_check.py  # Validates environment

# 4. Add API Keys
cp .env.example .env
# Edit .env with your keys

# 5. Run API
uvicorn main:app --reload

# 6. Run UI (new terminal)
streamlit run ui/app.py

# 7. Test Everything
python test_csv.py
Test: Scan https://secure-paypa1.com/login → DANGER – BLOCK!

Folder Structure
textai-phishing-detection-agent/
├── tools/              → Rule, VT, OTX, CSV loader
├── ui/app.py           → Streamlit dashboard
├── main.py             → FastAPI entry
├── llm_agent.py        → Gemini reasoning
├── config.py           → API keys & paths
├── gmail_listener.py   → Live email scanner
└── data/reports/       → JSON outputs (generated)

Dataset
Uses Nazario Phishing Corpus (1,565 emails).
Download and place in: archive/Nazario.csv
Download Link :[Link](https://www.kaggle.com/datasets/naserabdullahalam/phishing-email-dataset)

Future Enhancements

 Fine-tune Gemini on phishing data
 Chrome extension (real-time email scanning)
 Deploy to Render (free public URL)
Upgrade UI to React/Next.js (responsive, dark mode)
 Add PhishTank, URLhaus APIs
 Accuracy dashboard + confusion matrix


License
MIT License – Free to use, modify, and contribute.

Built with passion for cybersecurity & AI
By Tashfeen Raza | Pakistan | Nov 2025