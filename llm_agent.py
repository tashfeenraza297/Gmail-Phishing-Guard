# llm_agent.py
import json, google.generativeai as genai, time, re
from config import CONFIG
from error_handler import log

genai.configure(api_key=CONFIG["llm"]["api_key"])

# Primary and fallback models
PRIMARY_MODEL = "gemini-2.5-flash"      # 250/day
FALLBACK_MODEL = "gemini-2.5-flash-lite" # Lighter version, backup quota

# Start with primary model
current_model = genai.GenerativeModel(PRIMARY_MODEL)
_using_fallback = False

# Rate limit tracker - Using sliding window for better accuracy
_request_timestamps = []
_RATE_LIMIT = 4  # Conservative: 4 requests per minute (instead of 5)
_RATE_WINDOW = 60  # seconds

def _check_rate_limit():
    """Smart rate limiter with sliding window"""
    global _request_timestamps
    
    current_time = time.time()
    
    # Remove timestamps older than 60 seconds
    _request_timestamps = [ts for ts in _request_timestamps if current_time - ts < _RATE_WINDOW]
    
    # If we've hit the limit, wait
    if len(_request_timestamps) >= _RATE_LIMIT:
        oldest_request = _request_timestamps[0]
        wait_time = _RATE_WINDOW - (current_time - oldest_request) + 2  # +2s buffer
        log.warning(f"[LIMIT] Rate limit: {len(_request_timestamps)}/{_RATE_LIMIT}. Waiting {wait_time:.1f}s...")
        time.sleep(wait_time)
        # Clear after waiting
        _request_timestamps.clear()
    
    # Record this request
    _request_timestamps.append(time.time())

def generate_report(rule_res: dict, intel_res: list, raw: str) -> dict:
    """Generate AI-powered phishing analysis report with retry logic"""
    global current_model, _using_fallback
    
    context = f"""
    Input: {raw}
    Rule Result: {json.dumps(rule_res)}
    Threat Intel: {json.dumps(intel_res)}
    """
    prompt = f"""
    You are a senior cybersecurity analyst.
    Based on the data above, output **only** valid JSON with:
    - risk_score (0-100)
    - classification (Phishing / Malicious / Suspicious / Safe)
    - reason (2 sentences max)
    - action (user advice)
    {context}
    """
    
    # Retry logic - but skip retries for daily quota
    max_retries = 2  # Reduced from 3
    base_delay = 1   # Reduced from 2
    
    for attempt in range(max_retries):
        try:
            # Check rate limit before making request
            _check_rate_limit()
            
            # Make API call with current model
            resp = current_model.generate_content(prompt)
            
            # Parse response
            text = resp.text.strip()
            # Remove markdown code blocks if present
            text = re.sub(r'^```json\s*', '', text)
            text = re.sub(r'\s*```$', '', text)
            
            result = json.loads(text)
            
            # Validate required fields
            required_fields = ['risk_score', 'classification', 'reason', 'action']
            if all(field in result for field in required_fields):
                log.info(f"[OK] LLM analysis: {result['classification']} (Risk: {result['risk_score']})")
                return result
            else:
                raise ValueError(f"Missing required fields in LLM response")
        
        except json.JSONDecodeError as e:
            log.error(f"[ERROR] LLM JSON parse error (attempt {attempt + 1}/{max_retries}): {e}")
            if attempt < max_retries - 1:
                time.sleep(base_delay)
                continue
        
        except Exception as e:
            error_str = str(e)
            
            # Handle quota errors
            if "429" in error_str or "quota" in error_str.lower():
                # Check if it's DAILY quota - switch to fallback model
                if ("PerDay" in error_str or "per day" in error_str.lower()) and not _using_fallback:
                    log.warning(f"[QUOTA] {PRIMARY_MODEL} daily limit reached. Switching to {FALLBACK_MODEL}...")
                    current_model = genai.GenerativeModel(FALLBACK_MODEL)
                    _using_fallback = True
                    # Retry immediately with fallback model
                    if attempt < max_retries - 1:
                        time.sleep(1)  # Short delay
                        continue
                    else:
                        # Last attempt failed even with fallback
                        return {
                            "risk_score": 50, 
                            "classification": "Unknown", 
                            "reason": "Both LLM models quota exhausted", 
                            "action": "Rule-based detection active"
                        }
                
                # Per-minute rate limit - retry with short delay
                log.warning(f"[LIMIT] Rate limit hit (attempt {attempt + 1}/{max_retries})")
                
                if attempt < max_retries - 1:
                    # Max 5s wait to avoid UI timeout
                    wait_time = min(5, base_delay * (2 ** attempt))
                    log.info(f"[WAIT] Retrying in {wait_time:.1f}s...")
                    time.sleep(wait_time)
                    continue
            else:
                log.error(f"[ERROR] LLM failed (attempt {attempt + 1}/{max_retries}): {error_str[:100]}")
                if attempt < max_retries - 1:
                    time.sleep(base_delay)
                    continue
    
    # All retries failed - return fallback
    log.warning("[FALLBACK] LLM unavailable, using rule-based detection")
    return {
        "risk_score": 50, 
        "classification": "Unknown", 
        "reason": "LLM temporarily unavailable", 
        "action": "Manual review recommended"
    }