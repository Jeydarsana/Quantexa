from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from data.market_data import get_historical_data
from data.preprocessing import clean_data
from quant.indicators import calculate_indicators
from quant.risk import calculate_risk_metrics
from quant.correlation import calculate_correlation_matrix, calculate_rolling_correlation
from quant.quant_fixes import align_closes, aligned_returns
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
            # We don't clean_data yet, just get raw
            df = get_historical_data(ticker, req.start_date, req.end_date)
            dfs[ticker] = df
            
        # Align closes to the first asset (usually an equity like NVDA)
        # Actually, let's strictly align to NVDA or the first asset
        primary_asset = req.assets[1] if len(req.assets) > 1 and req.assets[1] == 'NVDA' else req.assets[0]
        aligned_df, align_report = align_closes(dfs, primary_asset)
        
        # Compute aligned returns
        returns_df = aligned_returns(aligned_df)
        
        corr_matrix = returns_df.corr()
        
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
                
        return {"matrix": result, "alignment_report": align_report}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/correlation/rolling")
def get_rolling_correlation(req: RollingCorrelationRequest):
    try:
        df_a = get_historical_data(req.asset_a, req.start_date, req.end_date)
        df_b = get_historical_data(req.asset_b, req.start_date, req.end_date)
        
        # Align closes to Equities if one of them is NVDA/GLD, else just use asset A
        primary_asset = req.asset_a
        if req.asset_b in ['NVDA', 'GOLD']: primary_asset = req.asset_b
        if req.asset_a in ['NVDA', 'GOLD']: primary_asset = req.asset_a
            
        aligned_df, align_report = align_closes({req.asset_a: df_a, req.asset_b: df_b}, primary_asset)
        returns_df = aligned_returns(aligned_df)
        
        # Calculate Rolling Correlation
        rolling_series = returns_df[req.asset_a].rolling(window=req.window).corr(returns_df[req.asset_b]).dropna()
        
        records = rolling_series.reset_index()
        records.columns = ['Date', 'Correlation']
        records['Date'] = records['Date'].astype(str)
        
        records = records.replace({np.nan: None})
        
        return {"chart_data": records.to_dict(orient="records")}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
