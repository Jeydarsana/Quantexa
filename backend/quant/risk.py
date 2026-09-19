import pandas as pd
import numpy as np
from typing import Dict

def calculate_risk_metrics(data: pd.DataFrame) -> Dict[str, float]:
    """
    Calculates deterministic risk metrics based on daily returns.
    """
    metrics = {
        "annualized_volatility": 0.0,
        "sharpe_ratio": 0.0,
        "max_drawdown": 0.0,
        "total_return": 0.0
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
        
    # Max Drawdown
    if 'Cumulative_Return' in data.columns and not data['Cumulative_Return'].empty:
        cum_ret = data['Cumulative_Return'] + 1
        roll_max = cum_ret.cummax()
        drawdowns = cum_ret / roll_max - 1.0
        metrics["max_drawdown"] = float(drawdowns.min()) if pd.notna(drawdowns.min()) else 0.0
        
        # Total Return
        last_ret = cum_ret.iloc[-1]
        metrics["total_return"] = float(last_ret - 1.0) if pd.notna(last_ret) else 0.0
        
    return metrics
