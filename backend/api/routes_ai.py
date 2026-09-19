from fastapi import APIRouter, HTTPException
from core.ai_client import get_ai_explanation, get_macro_explanation

router = APIRouter()

@router.post("/explain")
def explain_results(results: dict):
    try:
        explanation = get_ai_explanation(results)
        return {"explanation": explanation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/macro")
def get_macro_report():
    try:
        # Prompt the AI Failover Engine for a macro report
        from core.ai_client import _is_key_available, _burn_key
        from core.config import settings
        from google import genai
        from groq import Groq
        from openai import OpenAI
        
        prompt = """
        You are the Chief Investment Officer of QuantLens. Provide a brief 3-paragraph macro market intelligence report summarizing current global conditions. Touch upon Equities (NVDA), Crypto (BTC), and Commodities (Gold). Do not invent exact prices, focus on the general macroeconomic environment and typical correlations between these asset classes. Use markdown formatting.
        """
        
        # Try Gemini
        for key in settings.get_gemini_keys():
            if _is_key_available(key):
                try:
                    client = genai.Client(api_key=key)
                    res = client.models.generate_content(model='gemini-3.1-pro-preview', contents=prompt)
                    return {"report": res.text}
                except Exception as e:
                    _burn_key(key)
        
        # Try Groq
        for key in settings.get_groq_keys():
            if _is_key_available(key):
                try:
                    client = Groq(api_key=key)
                    res = client.chat.completions.create(messages=[{"role": "user", "content": prompt}], model="llama3-70b-8192")
                    return {"report": res.choices[0].message.content}
                except Exception as e:
                    _burn_key(key)
                    
        return {"report": "AI Macro Report failed. No API keys available or all providers are rate limited."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/explain-macro")
def explain_macro(payload: dict):
    try:
        explanation = get_macro_explanation(payload)
        return {"explanation": explanation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
