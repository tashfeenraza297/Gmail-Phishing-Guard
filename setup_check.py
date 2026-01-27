# setup_check.py
"""
Environment Setup Checker
Validates that all required API keys and files are configured correctly.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

def check_env_vars():
    """Check if all required API keys are set"""
    print("=" * 60)
    print("ENVIRONMENT VARIABLES CHECK")
    print("=" * 60)
    
    required_vars = {
        "GEMINI_API_KEY": "Google Gemini API",
        "VT_API_KEY": "VirusTotal API",
        "OTX_API_KEY": "AlienVault OTX API"
    }
    
    all_set = True
    
    for var, description in required_vars.items():
        value = os.getenv(var)
        if value and value != f"your_{var.lower()}":
            print(f"✅ {var:20} → Set ({description})")
        else:
            print(f"❌ {var:20} → MISSING! ({description})")
            all_set = False
    
    return all_set

def check_files():
    """Check if required files exist"""
    print("\n" + "=" * 60)
    print("REQUIRED FILES CHECK")
    print("=" * 60)
    
    base_dir = Path(__file__).parent
    
    files_to_check = {
        ".env": "Environment variables file",
        "archive/Nazario.csv": "Phishing dataset",
        "data/reports": "Reports directory (auto-created)",
    }
    
    all_exist = True
    
    for file_path, description in files_to_check.items():
        full_path = base_dir / file_path
        if full_path.exists():
            if full_path.is_dir():
                print(f"✅ {file_path:30} → EXISTS (folder)")
            else:
                size = full_path.stat().st_size
                print(f"✅ {file_path:30} → EXISTS ({size:,} bytes)")
        else:
            print(f"❌ {file_path:30} → MISSING! ({description})")
            if file_path != "data/reports":  # This one is auto-created
                all_exist = False
    
    return all_exist

def check_gmail_setup():
    """Check Gmail OAuth setup"""
    print("\n" + "=" * 60)
    print("GMAIL INTEGRATION CHECK (Optional)")
    print("=" * 60)
    
    base_dir = Path(__file__).parent
    
    client_secret = base_dir / "client_secret.json"
    token_pickle = base_dir / "token.pickle"
    
    if client_secret.exists():
        print(f"✅ client_secret.json  → EXISTS (Google OAuth credentials)")
    else:
        print(f"⚠️  client_secret.json  → MISSING (needed for Gmail monitoring)")
        print(f"   Download from: https://console.cloud.google.com/apis/credentials")
    
    if token_pickle.exists():
        print(f"✅ token.pickle       → EXISTS (OAuth token)")
    else:
        print(f"⚠️  token.pickle       → Not generated yet")
        print(f"   Will be created on first gmail_listener.py run")

def check_dependencies():
    """Check if key Python packages are installed"""
    print("\n" + "=" * 60)
    print("PYTHON DEPENDENCIES CHECK")
    print("=" * 60)
    
    required_packages = [
        "fastapi",
        "uvicorn",
        "streamlit",
        "requests",
        "google.generativeai",
        "pandas",
        "python-dotenv"
    ]
    
    all_installed = True
    
    for package in required_packages:
        package_import = package.replace("-", "_").replace(".", ".")
        try:
            if package == "google.generativeai":
                import google.generativeai
            else:
                __import__(package_import)
            print(f"✅ {package:25} → Installed")
        except ImportError:
            print(f"❌ {package:25} → NOT INSTALLED!")
            all_installed = False
    
    return all_installed

def generate_env_template():
    """Create .env file if missing"""
    print("\n" + "=" * 60)
    print("ENVIRONMENT FILE SETUP")
    print("=" * 60)
    
    base_dir = Path(__file__).parent
    env_file = base_dir / ".env"
    env_example = base_dir / ".env.example"
    
    if env_file.exists():
        print("✅ .env file already exists")
        print("   Edit it to add your API keys")
    else:
        if env_example.exists():
            # Copy from example
            import shutil
            shutil.copy(env_example, env_file)
            print("✅ Created .env from .env.example")
            print("   → Edit .env and add your API keys:")
        else:
            # Create new
            env_content = """# .env - API Keys Configuration
GEMINI_API_KEY=your_gemini_api_key_here
VT_API_KEY=your_virustotal_api_key_here
OTX_API_KEY=your_otx_api_key_here
"""
            env_file.write_text(env_content)
            print("✅ Created new .env file")
            print("   → Edit .env and add your API keys:")
        
        print("\n   📝 How to get API keys:")
        print("      • Gemini:      https://aistudio.google.com/app/apikey")
        print("      • VirusTotal:  https://www.virustotal.com/gui/my-apikey")
        print("      • OTX:         https://otx.alienvault.com/api")

def main():
    """Run all setup checks"""
    print("\n🔧 PHISHING AGENT - SETUP CHECKER")
    print("=" * 60)
    print("Checking if your environment is configured correctly...\n")
    
    # Run all checks
    env_ok = check_env_vars()
    files_ok = check_files()
    deps_ok = check_dependencies()
    check_gmail_setup()
    
    if not os.path.exists(".env"):
        generate_env_template()
    
    # Final verdict
    print("\n" + "=" * 60)
    print("FINAL VERDICT")
    print("=" * 60)
    
    if env_ok and files_ok and deps_ok:
        print("✅ ALL CHECKS PASSED!")
        print("   Your environment is ready to run.")
        print("\n📌 Next steps:")
        print("   1. Start API:  uvicorn main:app --reload")
        print("   2. Start UI:   streamlit run ui/app.py")
        print("   3. Test CSV:   python test_csv.py")
    else:
        print("⚠️  SETUP INCOMPLETE - Please fix the issues above")
        
        if not deps_ok:
            print("\n   Install dependencies:")
            print("   pip install -r requirements.txt")
        
        if not env_ok:
            print("\n   Configure API keys in .env file")
        
        if not files_ok:
            print("\n   Download missing dataset from:")
            print("   https://www.kaggle.com/datasets/naserabdullahalam/phishing-email-dataset")
    
    print("=" * 60)

if __name__ == "__main__":
    main()
