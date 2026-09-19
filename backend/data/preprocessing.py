import pandas as pd

def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Handles missing values and sorts dates.
    Do not silently fabricate missing market data, use ffill for intraday gaps
    but leave large gaps if they exist (as per quant best practices).
    """
    if df.empty:
        return df
        
    # Strip timezones and normalize to date to ensure Crypto (UTC) and Equities (EST) align
    if isinstance(df.index, pd.DatetimeIndex):
        df.index = pd.to_datetime(df.index).tz_localize(None).normalize()
        # Drop duplicates if any arise from date truncation
        df = df[~df.index.duplicated(keep='last')]
        
    # Sort dates
    df = df.sort_index()
    
    # Forward fill missing values (e.g., weekends for crypto when joined with equities)
    # But only up to 3 days to avoid fabricating data for delisted assets
    df = df.ffill(limit=3)
    
    return df
