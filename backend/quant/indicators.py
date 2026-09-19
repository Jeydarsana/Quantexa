import pandas as pd
import numpy as np

def calculate_indicators(data: pd.DataFrame, short_window: int = 20, long_window: int = 50, rolling_return_window: int = 30) -> pd.DataFrame:
    """
    Calculates basic technical indicators (SMA, EMA, Returns).
    """
    df = data.copy()
    if 'Close' in df.columns:
        df['SMA_Short'] = df['Close'].rolling(window=short_window).mean()
        df['SMA_Long'] = df['Close'].rolling(window=long_window).mean()
        df['EMA_20'] = df['Close'].ewm(span=20, adjust=False).mean()
        
        # Returns
        df['Daily_Return'] = df['Close'].pct_change()
        df['Cumulative_Return'] = (1 + df['Daily_Return']).cumprod() - 1
        df['Rolling_Return'] = df['Close'].pct_change(periods=rolling_return_window)
        
    return df
