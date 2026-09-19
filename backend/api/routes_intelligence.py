from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from data.market_data import get_historical_data
from data.preprocessing import clean_data
from quant.regimes import detect_market_regime, detect_anomalies
import numpy as np
import pandas as pd

router = APIRouter()

class RegimeRequest(BaseModel):
    ticker: str
    start_date: str
    end_date: str

@router.post("/regimes")
def get_regime_analysis(req: RegimeRequest):
    try:
        data = get_historical_data(req.ticker, req.start_date, req.end_date)
        if data.empty:
            raise HTTPException(status_code=404, detail="No data found")
            
        clean_df = clean_data(data)
        
        # Apply Regime and Anomaly Detection
        df = detect_market_regime(clean_df)
        df = detect_anomalies(df)
        
        # Extract anomalies for the frontend table
        anomalies_df = df[df['Is_Anomaly'] == True].copy()
        
        # Prepare chart data (time series)
        records = df.reset_index()
        records['Date'] = records['Date'].astype(str)
        
        # Replace NaN with None for JSON compliance
        records = records.replace({np.nan: None})
        
        anomalies = []
        for index, row in anomalies_df.iterrows():
            anomalies.append({
                "date": str(index.date()) if hasattr(index, 'date') else str(index)[:10],
                "price": float(row['Close']),
                "z_score": float(row['Z_Score'])
            })
            
        return {
            "chart_data": records.to_dict(orient="records"),
            "anomalies": anomalies
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
