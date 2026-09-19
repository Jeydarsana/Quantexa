from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from data.market_data import get_historical_data
from data.preprocessing import clean_data
from quant.indicators import calculate_indicators
from quant.risk import calculate_risk_metrics
from quant.correlation import calculate_correlation_matrix, calculate_rolling_correlation
import numpy as np
import pandas as pd

router = APIRouter()

class AssetRequest(BaseModel):
    ticker: str
    start_date: str
    end_date: str

class CorrelationRequest(BaseModel):
    start_date: str
    end_date: str
    assets: List[str] = ["BTC", "NVDA", "GOLD"]

class RollingCorrelationRequest(BaseModel):
    asset_a: str
    asset_b: str
    start_date: str
    end_date: str
    window: int = 60

@router.post("/market/{asset}")
def get_market_analysis(asset: str, req: AssetRequest):
    try:
        data = get_historical_data(req.ticker, req.start_date, req.end_date)
        if data.empty:
            raise HTTPException(status_code=404, detail="No data found")
            
        clean_df = clean_data(data)
        indicators_df = calculate_indicators(clean_df)
        risk_metrics = calculate_risk_metrics(indicators_df)
        
        records = indicators_df.reset_index()
        records['Date'] = records['Date'].astype(str)
        
        # Replace NaN with None for JSON compliance
        records = records.replace({np.nan: None})
        
        return {
            "metrics": risk_metrics,
            "chart_data": records.to_dict(orient="records")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/correlation")
def get_correlation_matrix(req: CorrelationRequest):
    try:
        dfs = {}
        for ticker in req.assets:
            df = get_historical_data(ticker, req.start_date, req.end_date)
            df = clean_data(df)
            df = calculate_indicators(df)
            dfs[ticker] = df
            
        corr_matrix = calculate_correlation_matrix(dfs)
        
        # Convert matrix to frontend friendly format
        matrix_dict = corr_matrix.to_dict()
        result = []
        for asset_a, row in matrix_dict.items():
            for asset_b, val in row.items():
                result.append({
                    "id": f"{asset_a}-{asset_b}",
                    "asset_a": asset_a,
                    "asset_b": asset_b,
                    "value": float(val) if not pd.isna(val) else 0.0
                })
                
        return {"matrix": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/correlation/rolling")
def get_rolling_correlation(req: RollingCorrelationRequest):
    try:
        df_a = get_historical_data(req.asset_a, req.start_date, req.end_date)
        df_a = calculate_indicators(clean_data(df_a))
        
        df_b = get_historical_data(req.asset_b, req.start_date, req.end_date)
        df_b = calculate_indicators(clean_data(df_b))
        
        rolling_series = calculate_rolling_correlation(df_a, df_b, req.window)
        
        records = rolling_series.reset_index()
        records.columns = ['Date', 'Correlation']
        records['Date'] = records['Date'].astype(str)
        
        records = records.replace({np.nan: None})
        
        return {"chart_data": records.to_dict(orient="records")}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
