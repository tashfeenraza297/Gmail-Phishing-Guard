# tools/rule_tool.py
import re
from error_handler import safe_tool

class RuleTool:
    KEYWORDS = ['login', 'verify', 'update', 'bank', 'password', 'security', 'account', 
                'urgent', 'suspended', 'locked', 'confirm', 'click here', 'act now']
    
    # Expanded known good domains
    KNOWN_GOOD_DOMAINS = ['google.com', 'microsoft.com', 'apple.com', 'amazon.com', 
                          'github.com', 'gmail.com', 'outlook.com', 'yahoo.com',
                          'techcrunch.com', 'nytimes.com', 'linkedin.com']
    
    # Enhanced typo patterns
    TYPOS = re.compile(
        r'(paypa[1l]|g[o0]{2}gle|am[4a]z[0o]n|micros[o0]ft|'
        r'apple-support|icloud-verification|'
        r'chase-?bank|fedex-?tracking|ups-?delivery)\.(com|net|org|info)',
        re.IGNORECASE
    )
    
    # Suspicious TLDs and patterns
    SUSPICIOUS_PATTERNS = [
        r'\.xyz$', r'\.tk$', r'\.ml$', r'\.ga$', r'\.cf$',  # Suspicious TLDs
        r'-verify\.(com|net)', r'-secure\.(com|net)', r'-login\.(com|net)',  # Phishing patterns
        r'\.secure-[a-z]+\.(com|net)', r'-update\.(com|net)',
    ]
    
    # URL shorteners (often used in phishing)
    URL_SHORTENERS = ['bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'ow.ly', 'is.gd']
    
    # Money/urgency patterns
    MONEY_PATTERN = re.compile(r'\$[\d,]+|\d+\s*(dollars?|USD|euros?)', re.IGNORECASE)
    URGENCY_WORDS = ['urgent', 'immediately', 'within 24', 'within 48', 'act now', 
                     'limited time', 'expires', 'suspended', 'locked']

    @staticmethod
    @safe_tool
    def analyze(text: str) -> dict:
        reasons = []
        lower = text.lower()

        # 1. Keyword check
        found_keywords = [kw for kw in RuleTool.KEYWORDS if kw in lower]
        if found_keywords:
            reasons.append(f"Suspicious keywords: {', '.join(found_keywords[:3])}")

        # 2. Domain checks
        domain_match = re.search(r'https?://([^\s/]+)', text)
        if domain_match:
            domain = domain_match.group(1).lower()
            
            # Check if NOT in known good domains
            if not any(good in domain for good in RuleTool.KNOWN_GOOD_DOMAINS):
                # Typo-squatting
                if RuleTool.TYPOS.search(domain):
                    reasons.append("Domain typo-squatting detected")
                
                # Suspicious TLD/pattern
                for pattern in RuleTool.SUSPICIOUS_PATTERNS:
                    if re.search(pattern, domain, re.IGNORECASE):
                        reasons.append("Suspicious domain pattern")
                        break
                
                # URL shortener
                if any(shortener in domain for shortener in RuleTool.URL_SHORTENERS):
                    reasons.append("URL shortener detected")
        
        # 3. Money + urgency (business email compromise indicator)
        has_money = RuleTool.MONEY_PATTERN.search(text)
        has_urgency = any(word in lower for word in RuleTool.URGENCY_WORDS)
        
        if has_money and has_urgency:
            reasons.append("Money request with urgency (BEC indicator)")
        
        # 4. Excessive urgency
        urgency_count = sum(1 for word in RuleTool.URGENCY_WORDS if word in lower)
        if urgency_count >= 3:
            reasons.append("Excessive urgency language")

        return {
            "suspected": bool(reasons),
            "reasons": reasons
        }