import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, Optional

# Simple in-memory cache
_cache: Dict[str, pd.DataFrame] = {}

ASSET_METADATA = {
    "NVDA": {"name": "NVIDIA Corp", "type": "Equities", "base_price": 120.0, "vol": 0.45},
    "AAPL": {"name": "Apple Inc", "type": "Equities", "base_price": 180.0, "vol": 0.22},
    "MSFT": {"name": "Microsoft Corp", "type": "Equities", "base_price": 410.0, "vol": 0.24},
    "TSLA": {"name": "Tesla Inc", "type": "Equities", "base_price": 240.0, "vol": 0.55},
    "AMZN": {"name": "Amazon.com Inc", "type": "Equities", "base_price": 185.0, "vol": 0.28},
    "GOOGL": {"name": "Alphabet Inc", "type": "Equities", "base_price": 175.0, "vol": 0.26},
    "META": {"name": "Meta Platforms Inc", "type": "Equities", "base_price": 500.0, "vol": 0.35},
    "AMD": {"name": "Advanced Micro Devices", "type": "Equities", "base_price": 150.0, "vol": 0.48},
    "NFLX": {"name": "Netflix Inc", "type": "Equities", "base_price": 620.0, "vol": 0.36},
    "BTC": {"name": "Bitcoin USD", "type": "Crypto", "base_price": 62000.0, "vol": 0.60},
    "ETH": {"name": "Ethereum USD", "type": "Crypto", "base_price": 3200.0, "vol": 0.65},
    "SOL": {"name": "Solana USD", "type": "Crypto", "base_price": 145.0, "vol": 0.75},
    "GOLD": {"name": "Gold Futures", "type": "Commodities", "base_price": 2350.0, "vol": 0.16},
    "SILVER": {"name": "Silver Futures", "type": "Commodities", "base_price": 28.5, "vol": 0.26},
    "OIL": {"name": "Crude Oil Futures", "type": "Commodities", "base_price": 78.0, "vol": 0.32},
    "SPY": {"name": "S&P 500 ETF Trust", "type": "Indices/ETFs", "base_price": 520.0, "vol": 0.14},
    "QQQ": {"name": "Invesco QQQ Trust", "type": "Indices/ETFs", "base_price": 450.0, "vol": 0.19},
}

def generate_fallback_data(ticker: str, start_date: str, end_date: str) -> pd.DataFrame:
    """
    Generates realistic synthetic daily market data when external APIs are rate limited or offline.
    """
    dates = pd.date_range(start=start_date, end=end_date, freq='B')
    if len(dates) == 0:
        dates = pd.date_range(end=datetime.now(), periods=252, freq='B')
        
    meta = ASSET_METADATA.get(ticker.upper(), {"base_price": 100.0, "vol": 0.25})
    daily_vol = meta["vol"] / np.sqrt(252)
    daily_drift = 0.08 / 252 # 8% annual drift
    
    np.random.seed(abs(hash(ticker + start_date + end_date)) % (2**32))
    returns = np.random.normal(daily_drift, daily_vol, len(dates))
    price_paths = meta["base_price"] * np.cumprod(1 + returns)
    
    highs = price_paths * (1 + np.abs(np.random.normal(0, daily_vol * 0.5, len(dates))))
    lows = price_paths * (1 - np.abs(np.random.normal(0, daily_vol * 0.5, len(dates))))
    opens = price_paths * (1 + np.random.normal(0, daily_vol * 0.2, len(dates)))
    volumes = np.random.randint(500000, 15000000, len(dates))
    
    df = pd.DataFrame({
        "Open": opens,
        "High": highs,
        "Low": lows,
        "Close": price_paths,
        "Adj Close": price_paths,
        "Volume": volumes
    }, index=dates)
    df.index.name = "Date"
    return df

def get_historical_data(ticker: str, start_date: str, end_date: str) -> pd.DataFrame:
    """
    Downloads and caches historical market data with graceful fallback.
    """
    cache_key = f"{ticker.upper()}_{start_date}_{end_date}"
    if cache_key in _cache:
        return _cache[cache_key].copy()

    mapping = {
        "BTC": "BTC-USD",
        "ETH": "ETH-USD",
        "SOL": "SOL-USD",
        "GOLD": "GLD",
        "SILVER": "SI=F",
        "OIL": "CL=F",
        "SPY": "SPY",
        "QQQ": "QQQ",
        "NVDA": "NVDA",
        "AAPL": "AAPL",
        "MSFT": "MSFT",
        "TSLA": "TSLA",
        "AMZN": "AMZN",
        "GOOGL": "GOOGL",
        "META": "META",
        "AMD": "AMD",
        "NFLX": "NFLX"
    }
    actual_ticker = mapping.get(ticker.upper(), ticker.upper())

    data = pd.DataFrame()
    try:
        data = yf.download(actual_ticker, start=start_date, end=end_date, progress=False)
    except Exception as e:
        print(f"[get_historical_data] YFinance warning for {ticker}: {e}")

    if data.empty or len(data) < 5:
        print(f"[get_historical_data] Using realistic fallback data for {ticker} ({start_date} to {end_date})")
        data = generate_fallback_data(ticker, start_date, end_date)
    else:
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
