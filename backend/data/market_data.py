import yfinance as yf
import pandas as pd
from typing import Dict, Optional

# Simple in-memory cache for MVP Phase 1
_cache: Dict[str, pd.DataFrame] = {}

def get_historical_data(ticker: str, start_date: str, end_date: str) -> pd.DataFrame:
    """
    Downloads and caches historical market data.
    """
    cache_key = f"{ticker}_{start_date}_{end_date}"
    if cache_key in _cache:
        return _cache[cache_key].copy()

    # YFinance requires valid tickers. We support NVDA, BTC-USD, and GC=F (Gold).
    # If the user passed just 'BTC', we map it.
    mapping = {
        "BTC": "BTC-USD",
        "GOLD": "GC=F"
    }
    actual_ticker = mapping.get(ticker.upper(), ticker.upper())

    data = yf.download(actual_ticker, start=start_date, end=end_date)
    
    if data.empty:
        return pd.DataFrame()
        
    # Clean up multi-index columns if present
    if isinstance(data.columns, pd.MultiIndex):
        cols = []
        for col in data.columns:
            if col[1] == actual_ticker or col[1] == '':
                cols.append(col[0])
            else:
                cols.append(col[0] + '_' + col[1])
        data.columns = cols
        
    _cache[cache_key] = data
    return data.copy()
