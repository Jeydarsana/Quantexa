from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np

from data.market_data import get_historical_data, ASSET_METADATA
from data.preprocessing import clean_data
from quant.indicators import calculate_indicators
from quant.risk import calculate_risk_metrics, determine_risk_level
from backtesting.engine import run_backtest

router = APIRouter()

class SimulationDNARequest(BaseModel):
    asset: str = "NVDA"
    start_date: str = "2023-01-01"
    end_date: str = "2024-01-01"
    strategy: str = "SMA_Crossover"
    strategy_params: Dict[str, Any] = Field(default_factory=lambda: {"short_window": 20, "long_window": 50})
    cash_balance: float = 10000.0
    investment_amount: float = 5000.0
    trading_cost_pct: float = 0.1 # 0.1%

@router.get("/assets")
def get_supported_assets():
    """Returns curated list of supported multi-asset investments across asset classes."""
    assets = [
        {"ticker": "NVDA", "name": "NVIDIA Corporation", "category": "Equities", "description": "Semiconductor & AI Megacap"},
        {"ticker": "AMZN", "name": "Amazon.com, Inc.", "category": "Equities", "description": "E-Commerce & AWS Cloud Computing"},
        {"ticker": "AAPL", "name": "Apple Inc.", "category": "Equities", "description": "Consumer Tech & Services Giant"},
        {"ticker": "MSFT", "name": "Microsoft Corporation", "category": "Equities", "description": "Enterprise Cloud & Software Leader"},
        {"ticker": "GOOGL", "name": "Alphabet Inc.", "category": "Equities", "description": "Search, Advertising & Cloud Intelligence"},
        {"ticker": "META", "name": "Meta Platforms Inc.", "category": "Equities", "description": "Social Media & Meta AI"},
        {"ticker": "TSLA", "name": "Tesla, Inc.", "category": "Equities", "description": "Electric Vehicles & Clean Energy"},
        {"ticker": "AMD", "name": "Advanced Micro Devices", "category": "Equities", "description": "High Performance Compute & AI Accelerators"},
        {"ticker": "NFLX", "name": "Netflix Inc.", "category": "Equities", "description": "Global Digital Streaming Entertainment"},
        {"ticker": "BTC", "name": "Bitcoin (USD)", "category": "Crypto", "description": "Digital Store of Value & Leading Crypto"},
        {"ticker": "ETH", "name": "Ethereum (USD)", "category": "Crypto", "description": "Decentralized Smart Contract Platform"},
        {"ticker": "SOL", "name": "Solana (USD)", "category": "Crypto", "description": "High-Throughput Layer 1 Blockchain"},
        {"ticker": "GOLD", "name": "Gold Futures", "category": "Commodities", "description": "Safe-Haven Precious Metal Asset"},
        {"ticker": "SILVER", "name": "Silver Futures", "category": "Commodities", "description": "Precious & Industrial Metal"},
        {"ticker": "OIL", "name": "Crude Oil Futures", "category": "Commodities", "description": "Global Energy Commodity"},
        {"ticker": "SPY", "name": "S&P 500 ETF Trust", "category": "Indices/ETFs", "description": "Benchmark US Broad Market Index"},
        {"ticker": "QQQ", "name": "Invesco QQQ Trust", "category": "Indices/ETFs", "description": "Nasdaq 100 Tech Megacap Benchmark ETF"}
    ]
    return {"assets": assets}

@router.post("/dna")
def run_strategy_dna_simulation(req: SimulationDNARequest):
    try:
        raw_data = get_historical_data(req.asset, req.start_date, req.end_date)
        if raw_data.empty or len(raw_data) < 5:
            raise HTTPException(status_code=404, detail=f"Insufficient historical data for {req.asset}")
            
        clean_df = clean_data(raw_data)
        indicators_df = calculate_indicators(clean_df)
        asset_risk = calculate_risk_metrics(indicators_df)
        
        # Run Backtest with strategy
        backtest_params = dict(req.strategy_params)
        backtest_params["initial_capital"] = req.investment_amount
        backtest_params["transaction_cost"] = req.trading_cost_pct
        backtest_params["position_size"] = 100.0
        
        bt_results = run_backtest(clean_df, req.strategy, backtest_params)
        trade_log = bt_results.get("trade_log", [])
        strat_metrics = bt_results.get("metrics", {}).get("strategy", {})
        bnh_metrics = bt_results.get("metrics", {}).get("benchmark", {})
        
        # Price and performance figures
        closes = clean_df['Close'].values
        dates = clean_df.index.astype(str).tolist()
        entry_price = float(closes[0])
        exit_price = float(closes[-1])
        price_change_pct = ((exit_price - entry_price) / entry_price) * 100.0
        
        # Portfolio calculations
        investment_amount = min(req.investment_amount, req.cash_balance)
        quantity = investment_amount / entry_price if entry_price > 0 else 0.0
        
        # Calculate fees: entry trade fee + exit trade fee (or sum of fees from trades)
        fee_rate = req.trading_cost_pct / 100.0
        if len(trade_log) > 0:
            total_trading_cost = sum(t.get("fee", 0.0) for t in trade_log)
        else:
            total_trading_cost = (investment_amount * fee_rate) * 2.0 # buy + sell fee
            
        # Strategy return applied to investment amount
        strategy_return_ratio = strat_metrics.get("total_return", 0.0)
        gross_profit_loss = investment_amount * strategy_return_ratio
        
        # TRADING COST DEDUCTED FROM PROFIT/LOSS
        net_profit_loss = gross_profit_loss - total_trading_cost
        return_pct = (net_profit_loss / investment_amount) * 100.0 if investment_amount > 0 else 0.0
        final_portfolio_value = (req.cash_balance - investment_amount) + investment_amount + net_profit_loss
        
        # Dynamic Risk Level determination
        ann_vol = asset_risk.get("annualized_volatility", 0.0)
        max_dd = strat_metrics.get("max_drawdown", asset_risk.get("max_drawdown", 0.0))
        sharpe = strat_metrics.get("sharpe_ratio", asset_risk.get("sharpe_ratio", 0.0))
        risk_level = determine_risk_level(ann_vol, max_dd)
        
        # Dynamic Reasons Generation (LOSS vs PROFIT)
        reasons: List[Dict[str, str]] = []
        is_profit = net_profit_loss >= 0
        
        if is_profit:
            reasons.append({
                "factor": "Price Trajectory",
                "status": "Positive",
                "detail": f"Exit price (${exit_price:,.2f}) ended {abs(price_change_pct):.2f}% higher than the entry price (${entry_price:,.2f}), providing favorable baseline asset appreciation."
            })
            if strategy_return_ratio >= bnh_metrics.get("total_return", 0.0):
                reasons.append({
                    "factor": "Strategy Efficacy",
                    "status": "Positive",
                    "detail": f"The {req.strategy.replace('_', ' ')} strategy generated a {strategy_return_ratio * 100:.2f}% return, successfully outperforming simple buy-and-hold."
                })
            else:
                reasons.append({
                    "factor": "Strategy Return",
                    "status": "Positive",
                    "detail": f"The {req.strategy.replace('_', ' ')} strategy captured a positive return of {strategy_return_ratio * 100:.2f}% across {len(trade_log)} executed signals."
                })
            reasons.append({
                "factor": "Trading Cost Efficiency",
                "status": "Positive",
                "detail": f"Trading fees totaled ${total_trading_cost:,.2f} ({ (total_trading_cost / investment_amount) * 100:.2f}% of capital), allowing { (net_profit_loss / (gross_profit_loss if gross_profit_loss != 0 else 1)) * 100:.1f}% of gross gains to be retained as net profit."
            })
            reasons.append({
                "factor": "Risk Containment",
                "status": "Positive",
                "detail": f"Risk was maintained at a {risk_level} level with a Sharpe Ratio of {sharpe:.2f} and a peak-to-trough drawdown contained at {abs(max_dd) * 100:.2f}%."
            })
        else:
            # LOSS REASONS
            if exit_price < entry_price:
                reasons.append({
                    "factor": "Unfavorable Price Movement",
                    "status": "Negative",
                    "detail": f"Entry price (${entry_price:,.2f}) was higher than exit price (${exit_price:,.2f}), causing an underlying asset decline of {abs(price_change_pct):.2f}%."
                })
            else:
                reasons.append({
                    "factor": "Adverse Trade Timing",
                    "status": "Negative",
                    "detail": f"Despite underlying asset gains, strategy trade timing led to buying high and selling low across intermediate pullbacks."
                })
                
            if ann_vol > 0.25:
                reasons.append({
                    "factor": "High Volatility Impact",
                    "status": "Negative",
                    "detail": f"Elevated annualized volatility of {ann_vol * 100:.2f}% amplified drawdowns and triggered false reversal signals."
                })
            else:
                reasons.append({
                    "factor": "Market Conditions",
                    "status": "Negative",
                    "detail": f"Range-bound market action prevented {req.strategy.replace('_', ' ')} from establishing sustained trends."
                })
                
            reasons.append({
                "factor": "Trading Cost Drag",
                "status": "Negative",
                "detail": f"Transaction costs deducted ${total_trading_cost:,.2f} ({ (total_trading_cost / investment_amount) * 100:.2f}% of principal), deepening the net loss to ${abs(net_profit_loss):,.2f}."
            })
            
            reasons.append({
                "factor": "Drawdown Severity",
                "status": "Negative",
                "detail": f"Maximum drawdown reached {abs(max_dd) * 100:.2f}%, exposing the simulated capital to substantial interim paper losses."
            })
            
        # Investment Assessment Determination
        # Categories: "Potentially Suitable", "Requires Caution", "Not Suitable Under Current Parameters"
        if return_pct > 8.0 and sharpe > 0.9 and abs(max_dd) < 0.25 and risk_level in ["Low", "Medium"]:
            assessment_badge = "Potentially Suitable"
            assessment_color = "success"
            assessment_narrative = (
                f"The simulated strategy demonstrated solid capital growth (+{return_pct:.2f}%) with healthy risk-adjusted return "
                f"(Sharpe {sharpe:.2f}) and controlled downside risk (Max Drawdown: {abs(max_dd)*100:.2f}%). "
                f"Trading costs (${total_trading_cost:,.2f}) were well absorbed by generated alpha, making this configuration "
                f"analytically viable for investors seeking exposure to {req.asset}."
            )
        elif return_pct >= 0 and abs(max_dd) < 0.40 and sharpe >= 0.3:
            assessment_badge = "Requires Caution"
            assessment_color = "warning"
            assessment_narrative = (
                f"While the simulation concluded with a net positive result (+{return_pct:.2f}%), elevated volatility ({ann_vol*100:.2f}%) "
                f"or moderate peak-to-trough drawdowns ({abs(max_dd)*100:.2f}%) warrant prudence. "
                f"Transaction cost drag (${total_trading_cost:,.2f}) consumed a meaningful portion of gross returns. "
                f"Investors should consider tightening stop-loss thresholds or reducing position sizing."
            )
        else:
            assessment_badge = "Not Suitable Under Current Parameters"
            assessment_color = "danger"
            assessment_narrative = (
                f"This configuration produced an adverse net return ({return_pct:.2f}%) accompanied by an unfavorable Sharpe Ratio ({sharpe:.2f}) "
                f"and severe capital drawdown ({abs(max_dd)*100:.2f}%). "
                f"Trading friction and poor strategy timing during this historical cycle eroded capital. "
                f"This strategy setup is not recommended without significant parameter recalibration or alternative risk hedging."
            )

        # Build chart data for frontend
        chart_records = []
        for i in range(len(dates)):
            record = {
                "Date": dates[i],
                "Price": float(closes[i]),
                "Daily_Return": float(clean_df['Daily_Return'].iloc[i]) if 'Daily_Return' in clean_df.columns and pd.notna(clean_df['Daily_Return'].iloc[i]) else 0.0
            }
            if 'MA20' in indicators_df.columns and pd.notna(indicators_df['MA20'].iloc[i]):
                record["MA20"] = float(indicators_df['MA20'].iloc[i])
            if 'MA50' in indicators_df.columns and pd.notna(indicators_df['MA50'].iloc[i]):
                record["MA50"] = float(indicators_df['MA50'].iloc[i])
            chart_records.append(record)

        return {
            "asset_info": {
                "ticker": req.asset,
                "name": ASSET_METADATA.get(req.asset.upper(), {}).get("name", req.asset),
                "category": ASSET_METADATA.get(req.asset.upper(), {}).get("type", "General Asset"),
                "start_date": req.start_date,
                "end_date": req.end_date,
                "entry_price": entry_price,
                "exit_price": exit_price,
                "price_change_pct": price_change_pct
            },
            "risk_metrics": {
                "annualized_volatility": ann_vol,
                "sharpe_ratio": sharpe,
                "max_drawdown": max_dd,
                "risk_level": risk_level,
                "sortino_ratio": asset_risk.get("sortino_ratio", 0.0),
                "value_at_risk_95": asset_risk.get("value_at_risk_95", 0.0)
            },
            "strategy_analysis": {
                "strategy": req.strategy,
                "strategy_params": req.strategy_params,
                "total_trades": len(trade_log),
                "strategy_return": strategy_return_ratio,
                "benchmark_return": bnh_metrics.get("total_return", 0.0),
                "equity_curve": bt_results.get("chart_data", [])
            },
            "portfolio_simulation": {
                "cash_balance": req.cash_balance,
                "selected_asset": req.asset,
                "quantity": quantity,
                "trading_cost": total_trading_cost,
                "entry_price": entry_price,
                "exit_price": exit_price,
                "investment_amount": investment_amount,
                "gross_profit_loss": gross_profit_loss,
                "net_profit_loss": net_profit_loss,
                "return_pct": return_pct,
                "final_portfolio_value": final_portfolio_value,
                "risk_level": risk_level
            },
            "reasons": reasons,
            "investment_assessment": {
                "badge": assessment_badge,
                "color": assessment_color,
                "narrative": assessment_narrative
            },
            "historical_chart": chart_records
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
