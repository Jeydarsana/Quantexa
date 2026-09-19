from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from data.market_data import get_historical_data
from quant.regimes import detect_market_regime
import pandas as pd
import numpy as np
from data.preprocessing import clean_data
from quant.indicators import calculate_indicators

router = APIRouter()

class AssetRequest(BaseModel):
    ticker: str
    start_date: str
    end_date: str

@router.post("/data")
def fetch_market_data(req: AssetRequest):
    try:
        data = get_historical_data(req.ticker, req.start_date, req.end_date)
        if data.empty:
            raise HTTPException(status_code=404, detail="No data found for given dates.")
        
        # Clean and calculate basic indicators
        clean_df = clean_data(data)
        data_with_indicators = calculate_indicators(clean_df)
        
        # Convert to records for frontend
        records = data_with_indicators.reset_index()
        records['Date'] = records['Date'].astype(str)
        return {"data": records.to_dict(orient="records")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/summary")
def get_market_summary():
    """
    Returns a quick snapshot of NVDA, BTC, and GOLD.
    """
    tickers = ["NVDA", "AMZN", "AAPL", "MSFT", "GOOGL", "META", "TSLA", "BTC", "ETH", "GOLD", "OIL", "SPY"]
    display_names = {
        "NVDA": "NVIDIA (NVDA)",
        "AMZN": "Amazon (AMZN)",
        "AAPL": "Apple (AAPL)",
        "MSFT": "Microsoft (MSFT)",
        "GOOGL": "Alphabet (GOOGL)",
        "META": "Meta (META)",
        "TSLA": "Tesla (TSLA)",
        "BTC": "Bitcoin (BTC)",
        "ETH": "Ethereum (ETH)",
        "GOLD": "Gold (GLD)",
        "OIL": "Crude Oil",
        "SPY": "S&P 500 ETF"
    }
    
    results = []
    
    try:
        # Just grab the last 60 days to get regime
        import datetime
        end_date = datetime.datetime.now().strftime("%Y-%m-%d")
        start_date = (datetime.datetime.now() - datetime.timedelta(days=150)).strftime("%Y-%m-%d")
        
        for t in tickers:
            df = get_historical_data(t, start_date, end_date)
            if df.empty or len(df) < 20:
                continue
            
            # Detect regime
            df = detect_market_regime(df)
            last_row = df.iloc[-1]
            prev_row = df.iloc[-2]
            
            price = float(last_row['Close'])
            prev_price = float(prev_row['Close'])
            change_pct = ((price / prev_price) - 1.0) * 100
            
            results.append({
                "ticker": display_names[t],
                "price": price,
                "change": change_pct,
                "regime": str(last_row['Regime'])
            })
            
        return {"summary": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
