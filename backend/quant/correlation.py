import pandas as pd

def calculate_correlation_matrix(dfs: dict[str, pd.DataFrame]) -> pd.DataFrame:
    """
    Calculates a Pearson correlation matrix across multiple assets.
    dfs: dictionary of {ticker: dataframe}
    """
    # Extract 'Daily_Return' from each df and align them by Date
    returns_series = {}
    for ticker, df in dfs.items():
        if not df.empty and 'Daily_Return' in df.columns:
            returns_series[ticker] = df['Daily_Return']
            
    if not returns_series:
        return pd.DataFrame()
        
    combined_returns = pd.DataFrame(returns_series).dropna()
    return combined_returns.corr()

def calculate_rolling_correlation(df1: pd.DataFrame, df2: pd.DataFrame, window: int = 60) -> pd.Series:
    """
    Calculates the rolling correlation between two assets over a given window.
    """
    if df1.empty or df2.empty or 'Daily_Return' not in df1.columns or 'Daily_Return' not in df2.columns:
        return pd.Series(dtype=float)
        
    ret1 = df1['Daily_Return']
    ret2 = df2['Daily_Return']
    
    # Align dates
    combined = pd.DataFrame({'asset1': ret1, 'asset2': ret2}).dropna()
    
    return combined['asset1'].rolling(window=window).corr(combined['asset2']).dropna()
