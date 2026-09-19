import pandas as pd
import numpy as np

def generate_signals(df: pd.DataFrame, strategy: str, params: dict) -> pd.Series:
    """
    Generates deterministic trading signals (1: Buy, 0: Neutral, -1: Sell)
    based on the selected strategy and its parameters.
    """
    signals = pd.Series(0, index=df.index, dtype=float)
    
    if strategy == "SMA_Crossover":
        short_w = int(params.get('short_window', 20))
        long_w = int(params.get('long_window', 50))
        short_sma = df['Close'].rolling(window=short_w).mean()
        long_sma = df['Close'].rolling(window=long_w).mean()
        signals = np.where(short_sma > long_sma, 1.0, 0.0)
        
    elif strategy == "EMA_Trend":
        window = int(params.get('ema_window', 20))
        ema = df['Close'].ewm(span=window, adjust=False).mean()
        signals = np.where(df['Close'] > ema, 1.0, 0.0)
        
    elif strategy == "Momentum":
        window = int(params.get('momentum_window', 10))
        # Buy if current price > price N days ago
        shifted = df['Close'].shift(window)
        signals = np.where(df['Close'] > shifted, 1.0, 0.0)
        
    elif strategy == "Mean_Reversion":
        window = int(params.get('reversion_window', 20))
        std_dev = float(params.get('reversion_std', 2.0))
        sma = df['Close'].rolling(window=window).mean()
        std = df['Close'].rolling(window=window).std()
        lower_band = sma - (std * std_dev)
        upper_band = sma + (std * std_dev)
        
        # Simplistic logic: Buy if below lower band, Sell if above upper band
        # 1.0 = long, -1.0 = short/exit
        cond_buy = df['Close'] < lower_band
        cond_sell = df['Close'] > upper_band
        signals = np.where(cond_buy, 1.0, np.where(cond_sell, -1.0, 0.0))
        
        # Forward fill the signal so we hold the position until a reversal
        signals = pd.Series(signals, index=df.index).replace(0.0, np.nan).ffill().fillna(0.0).values
        
    else:
        # Default to neutral if unknown strategy
        pass

    return pd.Series(signals, index=df.index)
