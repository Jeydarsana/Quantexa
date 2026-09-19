import time
from google import genai
from groq import Groq
from openai import OpenAI
from core.config import settings

_cooldowns = {}
COOLDOWN_SECONDS = 60

def _is_key_available(key: str) -> bool:
    if not key:
        return False
    if key in _cooldowns:
        if time.time() < _cooldowns[key]:
            return False
        else:
            del _cooldowns[key] # Cooldown expired
    return True

def _burn_key(key: str):
    if key:
        _cooldowns[key] = time.time() + COOLDOWN_SECONDS

def get_ai_explanation(backtest_results: dict) -> str:
    """
    Structured AI explanation service that automatically fails over
    between Gemini, Groq, and OpenRouter with rate-limit cooldowns.
    """
    metrics = backtest_results.get("metrics", {})
    if "strategy" in metrics:
        # Handle the new Phase 3 nested metrics structure
        total_return = metrics["strategy"].get("total_return", 0) * 100
        sharpe = metrics["strategy"].get("sharpe_ratio", 0)
        max_drawdown = metrics["strategy"].get("max_drawdown", 0) * 100
    else:
        # Fallback for old flat structure if any
        total_return = metrics.get("total_return", 0) * 100
        sharpe = metrics.get("sharpe_ratio", 0)
        max_drawdown = metrics.get("max_drawdown", 0) * 100
    
    prompt = f"""
    You are a quantitative analyst. Explain the following backtest results simply to a user.
    Never invent numbers, recompute metrics, or provide investment advice.
    
    Results:
    - Total Return: {total_return:.2f}%
    - Sharpe Ratio: {sharpe:.2f}
    - Max Drawdown: {max_drawdown:.2f}%
    
    Provide a concise explanation highlighting the risk-reward tradeoff.
    """
    
    errors = []

    # 1. Try Gemini
    for key in settings.get_gemini_keys():
        if not _is_key_available(key):
            errors.append("Gemini key cooling down")
            continue
        try:
            client = genai.Client(api_key=key)
            response = client.models.generate_content(
                model='gemini-3.1-pro-preview',
                contents=prompt,
            )
            return response.text
        except Exception as e:
            err_str = str(e).lower()
            errors.append(f"Gemini: {err_str}")
            if "429" in err_str or "exhausted" in err_str or "503" in err_str or "500" in err_str:
                _burn_key(key)

    # 2. Try Groq
    for key in settings.get_groq_keys():
        if not _is_key_available(key):
            errors.append("Groq key cooling down")
            continue
        try:
            client = Groq(api_key=key)
            response = client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="llama3-70b-8192"
            )
            return response.choices[0].message.content
        except Exception as e:
            err_str = str(e).lower()
            errors.append(f"Groq: {err_str}")
            if "429" in err_str or "exhausted" in err_str or "503" in err_str or "500" in err_str:
                _burn_key(key)

    # 3. Try OpenRouter
    for key in settings.get_openrouter_keys():
        if not _is_key_available(key):
            errors.append("OpenRouter key cooling down")
            continue
        try:
            client = OpenAI(
                base_url="https://openrouter.ai/api/v1",
                api_key=key,
            )
            response = client.chat.completions.create(
                model="meta-llama/llama-3-8b-instruct:free",
                messages=[{"role": "user", "content": prompt}]
            )
            return response.choices[0].message.content
        except Exception as e:
            err_str = str(e).lower()
            errors.append(f"OpenRouter: {err_str}")
            if "429" in err_str or "exhausted" in err_str or "503" in err_str or "500" in err_str:
                _burn_key(key)
            
    if not errors:
        return "AI explanation is unavailable because no API keys were configured."
        
    error_summary = " | ".join(errors)
    return f"AI explanation failed. All configured providers were exhausted or rate limited. Details: {error_summary}"
