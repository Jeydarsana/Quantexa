import pandas as pd
import numpy as np

def detect_market_regime(df: pd.DataFrame, sma_window: int = 50, atr_window: int = 14) -> pd.DataFrame:
    """
    Classifies the market regime into Bullish, Bearish, or Sideways based on SMA slope normalized by ATR.
    """
    if df.empty or 'Close' not in df.columns or 'High' not in df.columns or 'Low' not in df.columns:
        return df

    # Calculate SMA
    df['SMA'] = df['Close'].rolling(window=sma_window).mean()
    
    # Calculate SMA Slope (daily change in SMA)
    df['SMA_Slope'] = df['SMA'].diff()
    
    # Calculate True Range (TR)
    df['Prev_Close'] = df['Close'].shift(1)
    df['TR'] = np.maximum(
        df['High'] - df['Low'],
        np.maximum(
            abs(df['High'] - df['Prev_Close']),
            abs(df['Low'] - df['Prev_Close'])
        )
    )
    # Calculate ATR
    df['ATR'] = df['TR'].rolling(window=atr_window).mean()
    
    # Normalize Slope by ATR
    # If slope is significantly positive relative to average daily volatility -> Bullish
    # If significantly negative -> Bearish
    # Otherwise -> Sideways
    df['Normalized_Slope'] = np.where(df['ATR'] > 0, df['SMA_Slope'] / df['ATR'], 0)
    
    threshold = 0.1 # This means the SMA moves by 10% of a typical day's range per day
    
    conditions = [
        (df['Normalized_Slope'] > threshold),
        (df['Normalized_Slope'] < -threshold)
    ]
    choices = ['Bullish', 'Bearish']
    
    df['Regime'] = np.select(conditions, choices, default='Sideways')
    
    # Clean up intermediate columns
    df.drop(columns=['Prev_Close', 'TR'], inplace=True)
    return df

def detect_anomalies(df: pd.DataFrame, window: int = 60, threshold: float = 3.0) -> pd.DataFrame:
    """
    Detects structural anomalies using a rolling Z-score on daily returns.
    """
    if df.empty or 'Close' not in df.columns:
        return df
        
    df['Daily_Return'] = df['Close'].pct_change()
    
    rolling_mean = df['Daily_Return'].rolling(window=window).mean()
    rolling_std = df['Daily_Return'].rolling(window=window).std()
    
    # Avoid division by near-zero which causes insane math blowups (e.g., 71 million Z-Scores)
    epsilon = 1e-6
    df['Z_Score'] = np.where(rolling_std > epsilon, (df['Daily_Return'] - rolling_mean) / rolling_std, 0)
    
    # Clip Z-score to a realistic range to prevent chart breaking
    df['Z_Score'] = df['Z_Score'].clip(lower=-10, upper=10)
    
    # Flag anomaly if |Z-Score| > threshold
    df['Is_Anomaly'] = np.abs(df['Z_Score']) > threshold
    
    return df
