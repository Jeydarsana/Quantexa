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
        from core.ai_client import _get_ollama_client
        
        prompt = """
        You are the Chief Investment Officer of QuantLens. Provide a brief 3-paragraph macro market intelligence report summarizing current global conditions. Touch upon Equities (NVDA), Crypto (BTC), and Commodities (Gold). Do not invent exact prices, focus on the general macroeconomic environment and typical correlations between these asset classes. Use markdown formatting.
        """
        
        client = _get_ollama_client()
        response = client.chat.completions.create(
            model="qwen2.5:3b",
            messages=[{"role": "user", "content": prompt}]
        )
        return {"report": response.choices[0].message.content or "AI Macro Report unavailable."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/explain-macro")
def explain_macro(payload: dict):
    try:
        explanation = get_macro_explanation(payload)
        return {"explanation": explanation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
