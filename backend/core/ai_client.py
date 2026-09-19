from openai import OpenAI

def _get_ollama_client():
    return OpenAI(
        base_url="http://localhost:11434/v1",
        api_key="ollama" # required but ignored by ollama
    )

def get_ai_explanation(backtest_results: dict) -> str:
    """
    Structured AI explanation service that uses local Ollama Qwen.
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
    
    try:
        client = _get_ollama_client()
        response = client.chat.completions.create(
            model="qwen2.5:3b",
            messages=[{"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content or "AI explanation unavailable."
    except Exception as e:
        return f"AI explanation failed. Ensure Ollama is running with qwen2.5:3b. Details: {e}"

def get_macro_explanation(payload: dict) -> str:
    """
    Structured AI explanation service for macroeconomics module using local Ollama Qwen.
    """
    submodule = payload.get("submodule", "unknown")
    inputs = payload.get("inputs", {})
    results = payload.get("calculated_results", {})
    context = payload.get("context", {}).get("description", "Explain the macroeconomic results.")
    
    prompt = f"""
    You are a Chief Economist. 
    Context: {context}
    Sub-module: {submodule}
    
    User Inputs: {inputs}
    Calculated Results: {results}
    
    Provide a concise, 2-3 paragraph explanation of these results in simple, accessible language.
    Do NOT recompute the math. Assume the calculated results are mathematically correct.
    Explain WHAT the result means for the economy and WHY it matters.
    Use Markdown formatting.
    """
    
    try:
        client = _get_ollama_client()
        response = client.chat.completions.create(
            model="qwen2.5:3b",
            messages=[{"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content or "AI explanation unavailable."
    except Exception as e:
        return f"AI explanation failed. Ensure Ollama is running with qwen2.5:3b. Details: {e}"
