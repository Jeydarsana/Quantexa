import pandas as pd

def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Handles missing values and sorts dates.
    Do not silently fabricate missing market data, use ffill for intraday gaps
    but leave large gaps if they exist (as per quant best practices).
    """
    if df.empty:
        return df
        
    # Sort dates
    df = df.sort_index()
    
    # Forward fill missing values (e.g., weekends for crypto when joined with equities)
    # But only up to 3 days to avoid fabricating data for delisted assets
    df = df.ffill(limit=3)
    
    return df
