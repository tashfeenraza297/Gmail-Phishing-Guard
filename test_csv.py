# test_csv.py
"""
Test script to validate CSV loading and batch scanning functionality.
Tests the phishing detection pipeline with sample URLs from the dataset.
"""

import project_root
import pandas as pd
from tools.csv_loader import load_phishing_csv
from config import CONFIG
import requests
import json

API_URL = "http://localhost:8000/scan"

def test_csv_loading():
    """Test if CSV loads correctly and has expected structure"""
    print("=" * 60)
    print("TEST 1: CSV Loading")
    print("=" * 60)
    
    try:
        df = load_phishing_csv()
        print(f"✅ CSV loaded successfully!")
        print(f"   Rows: {len(df)}")
        print(f"   Columns: {list(df.columns)[:5]}...")
        print(f"\nFirst 3 rows:")
        print(df.head(3))
        return df
    except Exception as e:
        print(f"❌ CSV loading failed: {e}")
        return None

def test_url_extraction(df):
    """Test URL extraction from dataset"""
    print("\n" + "=" * 60)
    print("TEST 2: URL Extraction")
    print("=" * 60)
    
    if df is None:
        print("❌ Skipped (CSV not loaded)")
        return []
    
    # Try common column names
    url_col = None
    possible_cols = ["url", "URL", "link", "Link", "phishing_url", "email_url"]
    
    for col in possible_cols:
        if col in df.columns:
            url_col = col
            break
    
    if url_col:
        urls = df[url_col].dropna().astype(str).tolist()[:10]  # Get first 10
        print(f"✅ Found URL column: '{url_col}'")
        print(f"   Extracted {len(urls)} sample URLs")
        for i, url in enumerate(urls[:3], 1):
            print(f"   {i}. {url[:70]}...")
        return urls
    else:
        # Fallback: Extract from text columns
        print("⚠️  No URL column found, trying text extraction...")
        import re
        url_pattern = r'https?://[^\s"\'<>]+'
        urls = []
        
        for col in ["body", "message", "email", "text", "content"]:
            if col in df.columns:
                extracted = df[col].astype(str).apply(
                    lambda x: re.findall(url_pattern, x)
                ).explode().dropna().tolist()
                urls.extend(extracted)
                if urls:
                    break
        
        urls = list(set(urls))[:10]  # Dedupe and limit
        if urls:
            print(f"✅ Extracted {len(urls)} URLs from text")
            for i, url in enumerate(urls[:3], 1):
                print(f"   {i}. {url[:70]}...")
        else:
            print("❌ No URLs found in dataset")
        
        return urls

def test_api_connection():
    """Test if FastAPI server is running"""
    print("\n" + "=" * 60)
    print("TEST 3: API Connection")
    print("=" * 60)
    
    try:
        response = requests.get("http://localhost:8000/docs", timeout=5)
        if response.status_code == 200:
            print("✅ FastAPI server is running")
            print("   Access docs at: http://localhost:8000/docs")
            return True
        else:
            print(f"⚠️  API responded with status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ API server not running")
        print("   Start it with: uvicorn main:app --reload")
        return False
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return False

def test_single_scan(urls):
    """Test scanning a single URL"""
    print("\n" + "=" * 60)
    print("TEST 4: Single URL Scan")
    print("=" * 60)
    
    if not urls:
        print("❌ Skipped (no URLs available)")
        return
    
    test_url = urls[0]
    print(f"Scanning: {test_url[:70]}...")
    
    try:
        payload = {"input": test_url, "type": "url"}
        response = requests.post(API_URL, json=payload, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Scan completed!")
            print(f"\n📊 Results:")
            print(f"   Risk Score: {result.get('risk_score', 'N/A')}/100")
            print(f"   Classification: {result.get('classification', 'N/A')}")
            print(f"   Alert: {result.get('alert', 'N/A')}")
            print(f"\n   LLM Reasoning: {result.get('llm', {}).get('reason', 'N/A')}")
            return result
        else:
            print(f"❌ Scan failed with status {response.status_code}")
            print(f"   Response: {response.text}")
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to API (is it running?)")
    except Exception as e:
        print(f"❌ Scan error: {e}")

def test_batch_scan(urls):
    """Test batch scanning (first 5 URLs)"""
    print("\n" + "=" * 60)
    print("TEST 5: Batch Scan (5 URLs)")
    print("=" * 60)
    
    if not urls:
        print("❌ Skipped (no URLs available)")
        return
    
    batch_urls = urls[:5]
    results = []
    
    for i, url in enumerate(batch_urls, 1):
        print(f"[{i}/5] Scanning: {url[:50]}...")
        try:
            payload = {"input": url, "type": "url"}
            response = requests.post(API_URL, json=payload, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                results.append({
                    "url": url[:60],
                    "risk": result.get("risk_score"),
                    "classification": result.get("classification"),
                    "alert": result.get("alert")
                })
                print(f"    ✅ Risk: {result.get('risk_score')}/100 | {result.get('classification')}")
            else:
                results.append({"url": url[:60], "risk": "ERROR", "classification": "ERROR"})
                print(f"    ❌ Failed")
        except Exception as e:
            results.append({"url": url[:60], "risk": "ERROR", "classification": str(e)[:30]})
            print(f"    ❌ Error: {str(e)[:40]}")
    
    print("\n📊 Batch Results Summary:")
    print("-" * 60)
    for r in results:
        print(f"  {r['classification']:12} | Risk: {str(r['risk']):3} | {r['url']}")
    
    # Calculate stats
    valid_scores = [r['risk'] for r in results if isinstance(r['risk'], (int, float))]
    if valid_scores:
        avg_risk = sum(valid_scores) / len(valid_scores)
        high_risk = sum(1 for s in valid_scores if s > 70)
        print(f"\n  Average Risk: {avg_risk:.1f}/100")
        print(f"  High Risk (>70): {high_risk}/{len(valid_scores)} ({high_risk/len(valid_scores)*100:.1f}%)")

def main():
    """Run all tests"""
    print("\n🧪 PHISHING AGENT - CSV & API TESTING")
    print("=" * 60)
    
    # Test 1: CSV Loading
    df = test_csv_loading()
    
    # Test 2: URL Extraction
    urls = test_url_extraction(df)
    
    # Test 3: API Connection
    api_running = test_api_connection()
    
    if api_running and urls:
        # Test 4: Single Scan
        test_single_scan(urls)
        
        # Test 5: Batch Scan
        user_input = input("\n\nRun batch scan of 5 URLs? (y/n): ").strip().lower()
        if user_input == 'y':
            test_batch_scan(urls)
    
    print("\n" + "=" * 60)
    print("✅ Testing Complete!")
    print("=" * 60)

if __name__ == "__main__":
    main()
