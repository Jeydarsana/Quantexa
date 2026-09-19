import pandas as pd
import numpy as np
from typing import Dict, Any

def determine_risk_level(ann_vol: float, max_dd: float) -> str:
    """
    Categorizes asset risk into Low, Medium, or High based on annualized volatility and maximum drawdown.
    - Low: Volatility < 18% and Max Drawdown > -18%
    - Medium: Volatility < 35% and Max Drawdown > -35%
    - High: Volatility >= 35% or Max Drawdown <= -35%
    """
    if ann_vol < 0.18 and max_dd > -0.18:
        return "Low"
    elif ann_vol < 0.35 and max_dd > -0.35:
        return "Medium"
    else:
        return "High"

def calculate_risk_metrics(data: pd.DataFrame) -> Dict[str, Any]:
    """
    Calculates deterministic risk metrics based on daily returns including Risk Level.
    """
    metrics = {
        "annualized_volatility": 0.0,
        "sharpe_ratio": 0.0,
        "max_drawdown": 0.0,
        "total_return": 0.0,
        "risk_level": "Low",
        "value_at_risk_95": 0.0,
        "sortino_ratio": 0.0
    }
    
    if data.empty or 'Daily_Return' not in data.columns:
        return metrics
        
    returns = data['Daily_Return'].dropna()
    if returns.empty:
        return metrics
        
    # Volatility
    daily_vol = returns.std()
    ann_vol = daily_vol * np.sqrt(252) if pd.notna(daily_vol) else 0.0
    metrics["annualized_volatility"] = float(ann_vol)
    
    # Sharpe Ratio (Assuming 0% risk-free rate for simplicity)
    ann_return = returns.mean() * 252 if pd.notna(returns.mean()) else 0.0
    if ann_vol > 0:
        metrics["sharpe_ratio"] = float(ann_return / ann_vol)
        
    # Downside volatility & Sortino
    downside = returns[returns < 0]
    downside_vol = downside.std() * np.sqrt(252) if len(downside) > 1 and pd.notna(downside.std()) else ann_vol
    if downside_vol > 0:
        metrics["sortino_ratio"] = float(ann_return / downside_vol)
        
    # Value at Risk (95% parametric daily)
    var_95 = 1.645 * daily_vol if pd.notna(daily_vol) else 0.0
    metrics["value_at_risk_95"] = float(var_95)
        
    # Max Drawdown
    if 'Cumulative_Return' in data.columns and not data['Cumulative_Return'].empty:
        cum_ret = data['Cumulative_Return'] + 1
        roll_max = cum_ret.cummax()
        drawdowns = cum_ret / roll_max - 1.0
        metrics["max_drawdown"] = float(drawdowns.min()) if pd.notna(drawdowns.min()) else 0.0
        
        # Total Return
        last_ret = cum_ret.iloc[-1]
        metrics["total_return"] = float(last_ret - 1.0) if pd.notna(last_ret) else 0.0

    # Risk Level
    metrics["risk_level"] = determine_risk_level(metrics["annualized_volatility"], metrics["max_drawdown"])
        
    return metrics
