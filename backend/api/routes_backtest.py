from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from data.market_data import get_historical_data
from data.preprocessing import clean_data
from backtesting.engine import run_backtest, run_monte_carlo

router = APIRouter()

class BacktestRequest(BaseModel):
    ticker: str
    start_date: str
    end_date: str
    strategy: str
    params: dict = {}

@router.post("/backtest")
def run_strategy(req: BacktestRequest):
    try:
        data = get_historical_data(req.ticker, req.start_date, req.end_date)
        if data.empty:
            raise HTTPException(status_code=404, detail="No data found for backtest.")
        
        clean_df = clean_data(data)
        results = run_backtest(clean_df, req.strategy, req.params)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/robustness")
def run_robustness(req: BacktestRequest):
    try:
        data = get_historical_data(req.ticker, req.start_date, req.end_date)
        if data.empty:
            raise HTTPException(status_code=404, detail="No data found.")
        
        clean_df = clean_data(data)
        # Run 50 iterations for speed on the backend
        results = run_monte_carlo(clean_df, req.strategy, req.params, iterations=50)
        return results
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

