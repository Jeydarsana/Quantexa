import pandas as pd
import numpy as np

def align_closes(dfs: dict, primary_ticker: str) -> tuple:
    if primary_ticker not in dfs:
        raise ValueError(f"Primary ticker {primary_ticker} not in dfs")
        
    primary_idx = dfs[primary_ticker].index
    aligned_dict = {}
    
    for ticker, data in dfs.items():
        if isinstance(data, pd.DataFrame):
            if 'Close' in data.columns:
                series = data['Close']
            else:
                series = data.iloc[:, 0]
        else:
            series = data
            
        # Reindex to primary calendar using forward fill
        aligned_dict[ticker] = series.reindex(primary_idx, method='ffill')
        
    aligned = pd.DataFrame(aligned_dict)
    report = f"Aligned to {primary_ticker} trading days, {len(aligned)} rows."
    return aligned, report

def aligned_returns(df: pd.DataFrame) -> pd.DataFrame:
    # Because we used ffill for prices on the primary calendar, 
    # the percentage change automatically calculates multi-day returns across missing days (e.g. weekends)
    return df.pct_change().dropna(how='all')

def infer_periods_per_year(index: pd.DatetimeIndex) -> int:
    days = (index.max() - index.min()).days
    if days == 0:
        return 252
    years = days / 365.25
    ppy = len(index) / years
    return 365 if ppy > 300 else 252

def sharpe_ratio(returns: pd.Series, ppy: int, rf: float) -> float:
    return (returns.mean() * ppy - rf) / (returns.std(ddof=1) * np.sqrt(ppy))

def assert_causal(func, data, min_len=400):
    res_full = func(data)
    
    # Test multiple truncation points to catch probabilistic matches (e.g. boolean conditions evaluating to False in both cases)
    for t_idx in range(min_len, min_len + 5):
        res_trunc = func(data.iloc[:t_idx])
        s1 = res_full.iloc[:t_idx]
        s2 = res_trunc
        
        if isinstance(s1, (pd.Series, pd.DataFrame)):
            try:
                if isinstance(s1, pd.Series):
                    pd.testing.assert_series_equal(s1, s2, check_names=False)
                else:
                    pd.testing.assert_frame_equal(s1, s2, check_names=False)
            except AssertionError:
                raise AssertionError("Look-ahead bias detected: output changes when future data is present")
        else:
            # For numpy arrays
            if not (np.array_equal(s1, s2, equal_nan=True)):
                raise AssertionError("Look-ahead bias detected: output changes when future data is present")

def classify_regimes(series: pd.Series, ppy: int) -> pd.DataFrame:
    vol = series.pct_change().rolling(20).std() * np.sqrt(ppy)
    # Expanding window percentile to prevent lookahead
    vol_rank = vol.expanding(min_periods=20).apply(lambda x: pd.Series(x).rank(pct=True).iloc[-1])
    vol_regime = np.where(vol_rank > 0.75, "High", np.where(vol_rank < 0.25, "Low", "Normal"))
    
    ma_short = series.rolling(20).mean()
    ma_long = series.rolling(50).mean()
    trend = np.where(ma_short > ma_long, "Bull", np.where(ma_short < ma_long, "Bear", "Neutral"))
    
    # Invalidation where MAs are NaN
    trend = np.where(np.isnan(ma_long), "Neutral", trend)
    vol_regime = np.where(np.isnan(vol), "Normal", vol_regime)
    
    return pd.DataFrame({'vol': vol_regime, 'trend': trend}, index=series.index)

def performance_by_regime(strat_returns: pd.Series, asset_returns: pd.Series, regimes: pd.Series, ppy: int):
    # Shift regimes by 1 day to ensure we attribute today's return to YESTERDAY's known regime
    regimes_shifted = regimes.shift(1)
    df = pd.DataFrame({'strat': strat_returns, 'asset': asset_returns, 'regime': regimes_shifted}).dropna()
    
    res = []
    for r, g in df.groupby('regime'):
        res.append({
            'regime': r, 
            'days': len(g),
            'strat_mean': g['strat'].mean(),
            'asset_mean': g['asset'].mean()
        })
    return pd.DataFrame(res)

def analyze_sweep(g: pd.DataFrame) -> dict:
    import scipy.ndimage
    # Replace nans with -inf for median filter to ignore them properly
    v = g.values.copy()
    mask = np.isnan(v)
    v[mask] = np.nanmin(v) if not np.isnan(v).all() else 0
    
    smoothed = scipy.ndimage.median_filter(v, size=3)
    
    # Restore nan where original was nan
    smoothed[mask] = np.nan
    v[mask] = np.nan
    
    max_idx = np.unravel_index(np.nanargmax(v), v.shape)
    peak_val = v[max_idx]
    smoothed_val = smoothed[max_idx]
    
    isolated = bool((peak_val - smoothed_val) > 0.5)
    verdict = "Isolated peak: likely overfit" if isolated else "Stable region"
    
    return {
        "isolated_peak": isolated,
        "verdict": verdict,
        "stable_choice": {"neighbourhood_median": smoothed_val},
        "n_trials": int((~np.isnan(g.values)).sum())
    }

def select_on_in_sample(evaluate, p1_list, p2_list, start, split, end):
    best_score = -np.inf
    best_p = None
    for p1 in p1_list:
        for p2 in p2_list:
            score = evaluate(p1, p2, start, split)
            if score > best_score:
                best_score = score
                best_p = {"param1": p1, "param2": p2}
    
    oos_score = evaluate(best_p['param1'], best_p['param2'], split, end)
    return {"chosen": best_p, "oos_score": oos_score}
