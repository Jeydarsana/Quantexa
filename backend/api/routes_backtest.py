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
    benchmark_ticker: str = None

@router.post("/backtest")
def run_strategy(req: BacktestRequest):
    try:
        data = get_historical_data(req.ticker, req.start_date, req.end_date)
        if data.empty:
            raise HTTPException(status_code=404, detail="No data found for backtest.")
        
        clean_df = clean_data(data)
        
        benchmark_df = None
        if req.benchmark_ticker:
            b_data = get_historical_data(req.benchmark_ticker, req.start_date, req.end_date)
            if not b_data.empty:
                benchmark_df = clean_data(b_data)
                
        results = run_backtest(clean_df, req.strategy, req.params, benchmark_df=benchmark_df)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class SweepRequest(BaseModel):
    ticker: str
    start_date: str
    end_date: str
    strategy: str

@router.post("/robustness/sweep")
def run_parameter_sweep(req: SweepRequest):
    try:
        from data.market_data import get_historical_data
        from data.preprocessing import clean_data
        from quant.quant_fixes import analyze_sweep
        from backtesting.engine import run_backtest
        import numpy as np
        import pandas as pd
        
        df = get_historical_data(req.ticker, req.start_date, req.end_date)
        if df.empty: raise HTTPException(status_code=404, detail="No data found")
        df = clean_data(df)
        
        # Hardcode sweep grid for MVP based on strategy
        if req.strategy == 'SMA_Crossover':
            param1_list = [10, 20, 30, 40, 50] # Short window
            param2_list = [50, 100, 150, 200] # Long window
        else:
            param1_list = [5, 10, 14, 20, 30]
            param2_list = [40, 50, 60, 80]
            
        results = []
        matrix = []
        for p1 in param1_list:
            row = []
            for p2 in param2_list:
                if p1 >= p2:
                    row.append(None)
                    results.append({"p1": p1, "p2": p2, "sharpe": None})
                    continue
                    
                if req.strategy == 'SMA_Crossover':
                    params = {'short_window': p1, 'long_window': p2}
                else:
                    params = {'window1': p1, 'window2': p2}
                    
                bt = run_backtest(df, req.strategy, params)
                sharpe = bt.get("metrics", {}).get("strategy", {}).get("sharpe_ratio", 0)
                row.append(sharpe)
                results.append({"p1": p1, "p2": p2, "sharpe": sharpe})
            matrix.append(row)
            
        # Analyze with our robust function
        sweep_df = pd.DataFrame(matrix, index=param1_list, columns=param2_list)
        verdict = analyze_sweep(sweep_df)
        
        return {
            "heatmap": results,
            "xAxis": param2_list,
            "yAxis": param1_list,
            "analysis": verdict
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
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

