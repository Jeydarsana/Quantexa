import pandas as pd
import numpy as np
from backtesting.strategies import generate_signals

def run_backtest(data: pd.DataFrame, strategy: str, params: dict) -> dict:
    """
    Simulates a portfolio execution based on strategy signals.
    Supports Initial Capital, Transaction Costs, Position Sizing, and Trade Logging.
    """
    df = data.copy()
    if df.empty or 'Close' not in df.columns:
        return {"error": "Invalid data"}
        
    initial_capital = float(params.get('initial_capital', 10000.0))
    tx_cost = float(params.get('transaction_cost', 0.1)) / 100.0 # user inputs 0.1 for 0.1%
    pos_size_pct = float(params.get('position_size', 100.0)) / 100.0 # user inputs 100 for 100%
    
    # Generate target position signals (-1, 0, 1)
    df['Target_Signal'] = generate_signals(df, strategy, params)
    
    cash = initial_capital
    holdings = 0.0
    
    portfolio_values = []
    trade_log = []
    
    # Benchmarks
    bnh_shares = initial_capital / df['Close'].iloc[0]
    bnh_values = []
    
    dates = df.index.astype(str).tolist()
    closes = df['Close'].values
    signals = df['Target_Signal'].values
    
    # Previous actual position (0 means flat, 1 means long, -1 means short)
    current_pos = 0.0
    
    for i in range(len(closes)):
        price = closes[i]
        date = dates[i]
        target = signals[i]
        
        # Benchmark value
        bnh_values.append(bnh_shares * price)
        
        # Determine if we need to trade to reach target
        if target != current_pos:
            # First, close existing position if any
            if current_pos != 0:
                revenue = holdings * price
                fee = revenue * tx_cost
                cash += revenue - fee
                trade_log.append({
                    "date": date,
                    "type": "SELL" if current_pos > 0 else "COVER",
                    "price": float(price),
                    "shares": float(holdings),
                    "fee": float(fee)
                })
                holdings = 0.0
                current_pos = 0.0
                
            # Second, open new position if target is not 0
            if target > 0: # Go long
                alloc = cash * pos_size_pct
                shares = alloc / price
                fee = alloc * tx_cost
                
                # Check if we have enough cash for the fee
                if cash >= (alloc + fee):
                    cash -= (alloc + fee)
                else:
                    # Adjust shares down to account for fee
                    alloc = cash / (1 + tx_cost)
                    fee = cash - alloc
                    shares = alloc / price
                    cash = 0
                    
                holdings = shares
                current_pos = 1.0
                trade_log.append({
                    "date": date,
                    "type": "BUY",
                    "price": float(price),
                    "shares": float(shares),
                    "fee": float(fee)
                })
                
        # Record daily portfolio value
        port_val = cash + (holdings * price if current_pos > 0 else 0)
        portfolio_values.append(float(port_val))
        
    df['Portfolio_Value'] = portfolio_values
    df['BnH_Value'] = bnh_values
    
    # Calculate Metrics
    def calc_metrics(series):
        if len(series) < 2: return {"return": 0, "sharpe": 0, "drawdown": 0}
        returns = pd.Series(series).pct_change().dropna()
        tot_ret = (series[-1] / series[0]) - 1.0
        sharpe = (returns.mean() / returns.std() * np.sqrt(252)) if returns.std() > 0 else 0
        roll_max = pd.Series(series).cummax()
        dd = (pd.Series(series) / roll_max) - 1.0
        max_dd = dd.min()
        return {
            "total_return": float(tot_ret) if pd.notna(tot_ret) else 0.0,
            "sharpe_ratio": float(sharpe) if pd.notna(sharpe) else 0.0,
            "max_drawdown": float(max_dd) if pd.notna(max_dd) else 0.0
        }
        
    strat_metrics = calc_metrics(portfolio_values)
    bnh_metrics = calc_metrics(bnh_values)
    
    # Chart Data Preparation
    chart_df = pd.DataFrame({
        "Date": dates,
        "Asset_Price": closes,
        "Strategy_Value": portfolio_values,
        "BnH_Value": bnh_values
    })
    # Convert absolute values to % growth for easier visual comparison on the chart
    chart_df['Strategy_Growth'] = (chart_df['Strategy_Value'] / initial_capital) - 1.0
    chart_df['BnH_Growth'] = (chart_df['BnH_Value'] / initial_capital) - 1.0
    
    chart_df = chart_df.replace({np.nan: None})
    
    return {
        "metrics": {
            "strategy": strat_metrics,
            "benchmark": bnh_metrics
        },
        "trade_log": trade_log,
        "chart_data": chart_df.to_dict(orient="records")
    }

def run_monte_carlo(data: pd.DataFrame, strategy: str, params: dict, iterations: int = 100) -> dict:
    """
    Runs a Monte Carlo simulation by injecting random Gaussian noise (e.g. slippage/market shocks)
    into the price data and re-evaluating the strategy multiple times.
    """
    import copy
    results = []
    
    # Pre-generate signals if strategy is deterministic based on original data (faster),
    # but actual robustness should test signal sensitivity to noise too.
    # To keep it performant but accurate, we will add small noise to Close prices.
    
    for _ in range(iterations):
        noisy_df = data.copy()
        # Inject 0.5% std dev random noise into prices
        noise = np.random.normal(0, 0.005, len(noisy_df))
        noisy_df['Close'] = noisy_df['Close'] * (1 + noise)
        
        # Run backtest on noisy data
        bt = run_backtest(noisy_df, strategy, params)
        if "metrics" in bt and "strategy" in bt["metrics"]:
            metrics = bt["metrics"]["strategy"]
            results.append({
                "return": metrics.get("total_return", 0),
                "sharpe": metrics.get("sharpe_ratio", 0),
                "drawdown": metrics.get("max_drawdown", 0)
            })
            
    return {"iterations": results}
