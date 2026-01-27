# config.example.py - Template for API keys
# Copy this to config.py and add your actual keys

from pathlib import Path

# Project paths
BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"

CONFIG = {
    "llm": {
        "api_key": "YOUR_GOOGLE_GEMINI_API_KEY_HERE"  # Get from https://aistudio.google.com/
    },
    "virustotal": {
        "api_key": "YOUR_VIRUSTOTAL_API_KEY_HERE"  # Get from https://www.virustotal.com/
    },
    "otx": {
        "api_key": "YOUR_ALIENVAULT_OTX_API_KEY_HERE"  # Get from https://otx.alienvault.com/
    },
    "paths": {
        "reports": DATA_DIR / "reports",
        "archive": BASE_DIR / "archive"
    },
    "risk_threshold": 70  # Score above this = high risk
}

# Create directories
CONFIG["paths"]["reports"].mkdir(parents=True, exist_ok=True)
