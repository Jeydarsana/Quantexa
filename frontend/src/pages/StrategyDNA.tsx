import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ShieldCheck,
  TrendingUp, 
  TrendingDown,
  Download, 
  Printer, 
  RefreshCw, 
  DollarSign, 
  Percent,
  Zap, 
  CheckCircle2, 
  XCircle,
  Info,
  ArrowRight,
  Search,
  ChevronDown,
  Check,
  Plus,
  X,
  Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { generateInvestmentReportPDF, type ReportData } from '../services/pdfReportGenerator';

interface AssetOption {
  ticker: string;
  name: string;
  category: 'Equities' | 'Crypto' | 'Commodities' | 'Indices/ETFs';
  icon: string;
  description: string;
  basePrice: number;
  volatility: number;
  trendDrift: number;
}

const SUPPORTED_ASSETS: AssetOption[] = [
  { ticker: 'NVDA', name: 'NVIDIA Corp.', category: 'Equities', icon: '💻', description: 'Semiconductor & AI Megacap', basePrice: 124.5, volatility: 0.42, trendDrift: 0.35 },
  { ticker: 'AMZN', name: 'Amazon.com, Inc.', category: 'Equities', icon: '📦', description: 'E-Commerce & AWS Cloud Computing', basePrice: 186.5, volatility: 0.28, trendDrift: 0.22 },
  { ticker: 'AAPL', name: 'Apple Inc.', category: 'Equities', icon: '📱', description: 'Consumer Technology & Services', basePrice: 182.0, volatility: 0.22, trendDrift: 0.12 },
  { ticker: 'MSFT', name: 'Microsoft Corp.', category: 'Equities', icon: '☁️', description: 'Enterprise Cloud & AI Software', basePrice: 415.0, volatility: 0.24, trendDrift: 0.18 },
  { ticker: 'GOOGL', name: 'Alphabet Inc.', category: 'Equities', icon: '🔍', description: 'Search, Advertising & Cloud Intelligence', basePrice: 176.0, volatility: 0.26, trendDrift: 0.20 },
  { ticker: 'META', name: 'Meta Platforms Inc.', category: 'Equities', icon: '🌐', description: 'Social Media & Open-Source AI', basePrice: 512.0, volatility: 0.35, trendDrift: 0.28 },
  { ticker: 'TSLA', name: 'Tesla, Inc.', category: 'Equities', icon: '⚡', description: 'Electric Vehicles & Clean Energy', basePrice: 238.0, volatility: 0.52, trendDrift: -0.08 },
  { ticker: 'AMD', name: 'Advanced Micro Devices', category: 'Equities', icon: '⚙️', description: 'Data Center Accelerators & Microprocessors', basePrice: 154.0, volatility: 0.46, trendDrift: 0.18 },
  { ticker: 'NFLX', name: 'Netflix Inc.', category: 'Equities', icon: '🎬', description: 'Global Digital Streaming Entertainment', basePrice: 635.0, volatility: 0.32, trendDrift: 0.24 },
  { ticker: 'BTC', name: 'Bitcoin (USD)', category: 'Crypto', icon: '₿', description: 'Leading Digital Asset & Store of Value', basePrice: 63500.0, volatility: 0.58, trendDrift: 0.45 },
  { ticker: 'ETH', name: 'Ethereum (USD)', category: 'Crypto', icon: 'Ξ', description: 'Decentralized Smart Contract Platform', basePrice: 3250.0, volatility: 0.62, trendDrift: 0.25 },
  { ticker: 'SOL', name: 'Solana (USD)', category: 'Crypto', icon: '☀️', description: 'High-Throughput Layer 1 Blockchain', basePrice: 148.0, volatility: 0.72, trendDrift: 0.38 },
  { ticker: 'GOLD', name: 'Gold Futures', category: 'Commodities', icon: '🥇', description: 'Precious Metals & Macro Inflation Hedge', basePrice: 2340.0, volatility: 0.15, trendDrift: 0.14 },
  { ticker: 'SILVER', name: 'Silver Futures', category: 'Commodities', icon: '🥈', description: 'Precious & Industrial Metal Commodity', basePrice: 29.2, volatility: 0.28, trendDrift: 0.12 },
  { ticker: 'OIL', name: 'Crude Oil', category: 'Commodities', icon: '🛢️', description: 'Global Energy Commodity', basePrice: 79.5, volatility: 0.32, trendDrift: -0.05 },
  { ticker: 'SPY', name: 'S&P 500 ETF', category: 'Indices/ETFs', icon: '📈', description: 'US Broad Market Benchmark ETF', basePrice: 522.0, volatility: 0.14, trendDrift: 0.16 },
  { ticker: 'QQQ', name: 'Invesco QQQ Trust', category: 'Indices/ETFs', icon: '📊', description: 'Nasdaq 100 Tech Megacap Benchmark ETF', basePrice: 462.0, volatility: 0.20, trendDrift: 0.22 },
];

/**
 * Deterministic client-side generator guaranteeing immediate interactivity
 * even if backend API is offline or loading.
 */
function generateLocalSimulation(
  assetTicker: string,
  startDate: string,
  endDate: string,
  strategyName: string,
  shortW: number,
  longW: number,
  cash: number,
  invest: number,
  feePct: number
) {
  const normTicker = (assetTicker || 'NVDA').trim().toUpperCase();
  const matched = SUPPORTED_ASSETS.find(a => a.ticker.toUpperCase() === normTicker);
  const asset: AssetOption = matched || {
    ticker: normTicker,
    name: `${normTicker} Security`,
    category: 'Equities',
    icon: '📊',
    description: `Global Market Asset (${normTicker})`,
    basePrice: 150.0,
    volatility: 0.32,
    trendDrift: 0.15
  };
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Generate daily points
  const daysDiff = Math.max(20, Math.min(500, Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24))));
  const dates: string[] = [];
  const prices: number[] = [];
  
  let curPrice = asset.basePrice * 0.75;
  const dailyVol = asset.volatility / Math.sqrt(252);
  const dailyDrift = asset.trendDrift / 252;
  
  // Seeded pseudo-random
  let seed = Math.abs(assetTicker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + daysDiff);
  const pseudoRand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return (seed / 233280) - 0.5;
  };

  const dt = new Date(start);
  for (let i = 0; i < daysDiff; i++) {
    dt.setDate(dt.getDate() + 1);
    // Skip weekends
    if (dt.getDay() === 0 || dt.getDay() === 6) continue;
    
    dates.push(dt.toISOString().split('T')[0]);
    const shock = pseudoRand() * dailyVol * 2.5;
    curPrice = Math.max(1, curPrice * (1 + dailyDrift + shock));
    prices.push(curPrice);
  }

  if (prices.length < 5) {
    prices.push(asset.basePrice);
    dates.push(endDate);
  }

  const entryPrice = prices[0];
  const exitPrice = prices[prices.length - 1];
  const priceChangePct = ((exitPrice - entryPrice) / entryPrice) * 100;

  // Compute returns and indicators
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  
  const avgRet = returns.reduce((a, b) => a + b, 0) / (returns.length || 1);
  const variance = returns.reduce((acc, r) => acc + Math.pow(r - avgRet, 2), 0) / (returns.length || 1);
  const annVol = Math.sqrt(variance) * Math.sqrt(252);
  const annReturn = avgRet * 252;
  const sharpe = annVol > 0 ? annReturn / annVol : 0;

  // Max Drawdown
  let peak = prices[0];
  let maxDd = 0;
  for (const p of prices) {
    if (p > peak) peak = p;
    const dd = (p - peak) / peak;
    if (dd < maxDd) maxDd = dd;
  }

  // Risk Level
  let riskLevel = 'Medium';
  if (annVol < 0.18 && maxDd > -0.18) riskLevel = 'Low';
  else if (annVol >= 0.35 || maxDd <= -0.35) riskLevel = 'High';

  // Strategy Execution Simulation
  let stratGrowth = 1.0;
  let bnhGrowth = 1.0;
  const equityCurve: any[] = [];
  let currentPos = 0;
  let totalTrades = 0;

  // Moving averages
  const maShort: (number | null)[] = [];
  const maLong: (number | null)[] = [];
  for (let i = 0; i < prices.length; i++) {
    if (i >= shortW) {
      const slice = prices.slice(i - shortW, i);
      maShort.push(slice.reduce((a, b) => a + b, 0) / shortW);
    } else {
      maShort.push(null);
    }

    if (i >= longW) {
      const slice = prices.slice(i - longW, i);
      maLong.push(slice.reduce((a, b) => a + b, 0) / longW);
    } else {
      maLong.push(null);
    }

    // Strategy signal
    const sMa = maShort[i];
    const lMa = maLong[i];
    let targetPos = 0;
    if (sMa !== null && lMa !== null) {
      targetPos = sMa > lMa ? 1 : 0;
    } else {
      targetPos = 1; // initial hold
    }

    if (targetPos !== currentPos) {
      totalTrades++;
      currentPos = targetPos;
    }

    if (i > 0) {
      const dayRet = returns[i - 1];
      bnhGrowth *= (1 + dayRet);
      if (currentPos === 1) {
        stratGrowth *= (1 + dayRet);
      }
    }

    equityCurve.push({
      Date: dates[i],
      Strategy_Growth: stratGrowth - 1.0,
      BnH_Growth: bnhGrowth - 1.0,
      Asset_Price: prices[i]
    });
  }

  const stratReturn = stratGrowth - 1.0;
  const bnhReturn = bnhGrowth - 1.0;

  // Portfolio Math
  const investmentAmount = Math.min(invest, cash);
  const quantity = investmentAmount / entryPrice;
  const feeRate = feePct / 100.0;
  const totalTradingCost = (investmentAmount * feeRate) * Math.max(2, totalTrades);
  const grossProfitLoss = investmentAmount * stratReturn;
  // DEDUCT TRADING COSTS FROM NET PROFIT/LOSS
  const netProfitLoss = grossProfitLoss - totalTradingCost;
  const returnPct = (netProfitLoss / (investmentAmount || 1)) * 100;
  const finalPortfolioValue = (cash - investmentAmount) + investmentAmount + netProfitLoss;

  // Dynamic Reasons Generation
  const isProfit = netProfitLoss >= 0;
  const reasons: Array<{ factor: string; status: string; detail: string }> = [];

  if (isProfit) {
    reasons.push({
      factor: 'Price Trajectory',
      status: 'Positive',
      detail: `Exit price ($${exitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) ended ${Math.abs(priceChangePct).toFixed(2)}% higher than the entry price ($${entryPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}), providing favorable baseline capital growth.`
    });
    if (stratReturn >= bnhReturn) {
      reasons.push({
        factor: 'Strategy Outperformance',
        status: 'Positive',
        detail: `The ${strategyName.replace(/_/g, ' ')} strategy generated a ${(stratReturn * 100).toFixed(2)}% return across ${totalTrades} trades, successfully outperforming standard Buy & Hold (${(bnhReturn * 100).toFixed(2)}%).`
      });
    } else {
      reasons.push({
        factor: 'Strategy Efficacy',
        status: 'Positive',
        detail: `The ${strategyName.replace(/_/g, ' ')} captured a positive gain of ${(stratReturn * 100).toFixed(2)}% while limiting downside exposure.`
      });
    }
    reasons.push({
      factor: 'Trading Cost Efficiency',
      status: 'Positive',
      detail: `Trading fees totaled $${totalTradingCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${((totalTradingCost / investmentAmount) * 100).toFixed(2)}% of capital), which was comfortably absorbed by the strategy returns.`
    });
    reasons.push({
      factor: 'Risk Containment',
      status: 'Positive',
      detail: `Risk was maintained at a ${riskLevel} level with a Sharpe Ratio of ${sharpe.toFixed(2)} and peak drawdown contained at ${(Math.abs(maxDd) * 100).toFixed(2)}%.`
    });
  } else {
    // Loss reasons
    if (exitPrice < entryPrice) {
      reasons.push({
        factor: 'Unfavorable Price Movement',
        status: 'Negative',
        detail: `Entry price ($${entryPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) was higher than exit price ($${exitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}), causing an underlying asset decline of ${Math.abs(priceChangePct).toFixed(2)}%.`
      });
    } else {
      reasons.push({
        factor: 'Adverse Trade Timing',
        status: 'Negative',
        detail: `Despite positive asset gains, ${strategyName.replace(/_/g, ' ')} incurred whipsaws, buying into intermediate peaks and exiting on pullbacks.`
      });
    }
    if (annVol > 0.25) {
      reasons.push({
        factor: 'High Volatility Impact',
        status: 'Negative',
        detail: `Elevated annualized volatility of ${(annVol * 100).toFixed(2)}% created sharp whipsaws that triggered premature exit signals.`
      });
    } else {
      reasons.push({
        factor: 'Choppy Market Action',
        status: 'Negative',
        detail: `Range-bound price action prevented trend-following indicators from generating sustained profit runs.`
      });
    }
    reasons.push({
      factor: 'Trading Cost Drag',
      status: 'Negative',
      detail: `Trading costs deducted $${totalTradingCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${((totalTradingCost / investmentAmount) * 100).toFixed(2)}% of capital), exacerbating the total net loss to -$${Math.abs(netProfitLoss).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`
    });
    reasons.push({
      factor: 'Drawdown Severity',
      status: 'Negative',
      detail: `Maximum drawdown reached ${(Math.abs(maxDd) * 100).toFixed(2)}%, demonstrating significant capital exposure during the test period.`
    });
  }

  // Investment Assessment
  let assessmentBadge = 'Not Suitable Under Current Parameters';
  let assessmentColor = 'danger';
  let assessmentNarrative = '';

  if (returnPct > 8.0 && sharpe > 0.8 && Math.abs(maxDd) < 0.25 && riskLevel !== 'High') {
    assessmentBadge = 'Potentially Suitable';
    assessmentColor = 'success';
    assessmentNarrative = `The simulated strategy demonstrated solid capital growth (+${returnPct.toFixed(2)}%) with positive risk-adjusted returns (Sharpe ${sharpe.toFixed(2)}) and controlled downside risk (Max Drawdown: ${(Math.abs(maxDd) * 100).toFixed(2)}%). Trading costs ($${totalTradingCost.toFixed(2)}) were well absorbed by generated alpha, making this setup viable for investors seeking exposure to ${asset.name}.`;
  } else if (returnPct >= 0 && Math.abs(maxDd) < 0.40) {
    assessmentBadge = 'Requires Caution';
    assessmentColor = 'warning';
    assessmentNarrative = `While the simulation concluded with a net positive result (+${returnPct.toFixed(2)}%), elevated volatility (${(annVol * 100).toFixed(2)}%) or moderate peak-to-trough drawdowns (${(Math.abs(maxDd) * 100).toFixed(2)}%) warrant prudence. Transaction cost drag ($${totalTradingCost.toFixed(2)}) consumed a notable portion of returns. Consider widening signal windows or reducing exposure.`;
  } else {
    assessmentBadge = 'Not Suitable Under Current Parameters';
    assessmentColor = 'danger';
    assessmentNarrative = `This configuration produced an adverse net return (${returnPct.toFixed(2)}%) accompanied by an unfavorable Sharpe Ratio (${sharpe.toFixed(2)}) and significant capital drawdown (${(Math.abs(maxDd) * 100).toFixed(2)}%). Trading friction and whipsaws during this historical period eroded capital. This setup is not recommended without parameter recalibration.`;
  }

  const historicalChart = dates.map((d, i) => ({
    Date: d,
    Price: prices[i],
    MA20: maShort[i] || prices[i],
    MA50: maLong[i] || prices[i]
  }));

  return {
    asset_info: {
      ticker: asset.ticker,
      name: asset.name,
      category: asset.category,
      start_date: startDate,
      end_date: endDate,
      entry_price: entryPrice,
      exit_price: exitPrice,
      price_change_pct: priceChangePct
    },
    risk_metrics: {
      annualized_volatility: annVol,
      sharpe_ratio: sharpe,
      max_drawdown: maxDd,
      risk_level: riskLevel,
      value_at_risk_95: annVol * 0.103
    },
    strategy_analysis: {
      strategy: strategyName,
      total_trades: totalTrades,
      strategy_return: stratReturn,
      benchmark_return: bnhReturn,
      equity_curve: equityCurve
    },
    portfolio_simulation: {
      cash_balance: cash,
      selected_asset: asset.ticker,
      quantity: quantity,
      trading_cost: totalTradingCost,
      entry_price: entryPrice,
      exit_price: exitPrice,
      investment_amount: investmentAmount,
      gross_profit_loss: grossProfitLoss,
      net_profit_loss: netProfitLoss,
      return_pct: returnPct,
      final_portfolio_value: finalPortfolioValue,
      risk_level: riskLevel
    },
    reasons: reasons,
    investment_assessment: {
      badge: assessmentBadge,
      color: assessmentColor,
      narrative: assessmentNarrative
    },
    historical_chart: historicalChart
  };
}

export default function StrategyDNA() {
  // Step 1: Selected Asset & Category filter
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedAsset, setSelectedAsset] = useState<string>('NVDA');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Step 2: Historical Date Range
  const [startDate, setStartDate] = useState<string>('2023-01-01');
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Step 4: Strategy Controls
  const [strategy, setStrategy] = useState<string>('SMA_Crossover');
  const [shortWindow, setShortWindow] = useState<number>(20);
  const [longWindow, setLongWindow] = useState<number>(50);

  // Step 5: Portfolio Simulation Parameters
  const [cashBalance, setCashBalance] = useState<number>(10000);
  const [investmentAmount, setInvestmentAmount] = useState<number>(5000);
  const [tradingCostPct, setTradingCostPct] = useState<number>(0.1); // 0.1%

  // Simulation Results state - Initialized with live local calculation
  const initialData = useMemo(() => {
    return generateLocalSimulation(
      'NVDA',
      '2023-01-01',
      new Date().toISOString().split('T')[0],
      'SMA_Crossover',
      20,
      50,
      10000,
      5000,
      0.1
    );
  }, []);

  const [loading, setLoading] = useState<boolean>(false);
  const [simulationData, setSimulationData] = useState<any>(initialData);
  const [apiConnected, setApiConnected] = useState<boolean>(false);

  // Fetch simulation from FastAPI backend with local fallback
  const runSimulation = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/simulation/dna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset: selectedAsset,
          start_date: startDate,
          end_date: endDate,
          strategy: strategy,
          strategy_params: {
            short_window: shortWindow,
            long_window: longWindow
          },
          cash_balance: Number(cashBalance),
          investment_amount: Number(investmentAmount),
          trading_cost_pct: Number(tradingCostPct)
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSimulationData(data);
        setApiConnected(true);
      } else {
        throw new Error(`Server status ${response.status}`);
      }
    } catch (err) {
      // Gracefully fall back to client calculation
      const fallback = generateLocalSimulation(
        selectedAsset,
        startDate,
        endDate,
        strategy,
        shortWindow,
        longWindow,
        Number(cashBalance),
        Number(investmentAmount),
        Number(tradingCostPct)
      );
      setSimulationData(fallback);
      setApiConnected(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, [selectedAsset, strategy, startDate, endDate, shortWindow, longWindow, cashBalance, investmentAmount, tradingCostPct]);

  // Quick Date Selectors
  const setPresetRange = (years: number) => {
    const end = new Date();
    const start = new Date();
    start.setFullYear(end.getFullYear() - years);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  // Active Asset Metadata helper (handles both presets and custom symbols)
  const currentAsset = useMemo(() => {
    const norm = (selectedAsset || 'NVDA').trim().toUpperCase();
    const found = SUPPORTED_ASSETS.find(a => a.ticker.toUpperCase() === norm);
    if (found) return found;
    return {
      ticker: norm,
      name: simulationData?.asset_info?.name || `${norm} Security`,
      category: (simulationData?.asset_info?.category || 'Equities') as any,
      icon: '📊',
      description: `Custom ticker symbol: ${norm}`,
      basePrice: simulationData?.asset_info?.entry_price || 150.0,
      volatility: simulationData?.risk_metrics?.annualized_volatility || 0.30,
      trendDrift: 0.15
    };
  }, [selectedAsset, simulationData]);

  const currentAssetMeta = currentAsset;

  // Search & Category Filtered Assets
  const filteredAssets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return SUPPORTED_ASSETS.filter((asset) => {
      const matchesCat = selectedCategory === 'All' || asset.category === selectedCategory;
      if (!q) return matchesCat;
      const matchesSearch = 
        asset.ticker.toLowerCase().includes(q) || 
        asset.name.toLowerCase().includes(q) || 
        asset.description.toLowerCase().includes(q) ||
        asset.category.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const cleanSearchQuery = searchQuery.trim().toUpperCase();
  const exactMatchExists = SUPPORTED_ASSETS.some(a => a.ticker.toUpperCase() === cleanSearchQuery);

  const handleSelectTicker = (ticker: string) => {
    const norm = ticker.trim().toUpperCase();
    if (!norm) return;
    setSelectedAsset(norm);
    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  // Download PDF Handler
  const handleDownloadPDF = () => {
    if (!simulationData) return;
    const reportPayload: ReportData = {
      assetInfo: {
        ticker: simulationData.asset_info.ticker,
        name: simulationData.asset_info.name,
        category: simulationData.asset_info.category,
        startDate: simulationData.asset_info.start_date,
        endDate: simulationData.asset_info.end_date,
        entryPrice: simulationData.asset_info.entry_price,
        exitPrice: simulationData.asset_info.exit_price,
        priceChangePct: simulationData.asset_info.price_change_pct || 0
      },
      riskMetrics: {
        annualizedVolatility: simulationData.risk_metrics.annualized_volatility,
        sharpeRatio: simulationData.risk_metrics.sharpe_ratio,
        maxDrawdown: simulationData.risk_metrics.max_drawdown,
        riskLevel: simulationData.risk_metrics.risk_level,
        sortinoRatio: simulationData.risk_metrics.sortino_ratio,
        valueAtRisk95: simulationData.risk_metrics.value_at_risk_95
      },
      strategyAnalysis: {
        strategy: simulationData.strategy_analysis.strategy,
        totalTrades: simulationData.strategy_analysis.total_trades,
        strategyReturn: simulationData.strategy_analysis.strategy_return,
        benchmarkReturn: simulationData.strategy_analysis.benchmark_return
      },
      portfolioSimulation: {
        cashBalance: simulationData.portfolio_simulation.cash_balance,
        selectedAsset: simulationData.portfolio_simulation.selected_asset,
        quantity: simulationData.portfolio_simulation.quantity,
        tradingCost: simulationData.portfolio_simulation.trading_cost,
        entryPrice: simulationData.portfolio_simulation.entry_price,
        exitPrice: simulationData.portfolio_simulation.exit_price,
        investmentAmount: simulationData.portfolio_simulation.investment_amount,
        grossProfitLoss: simulationData.portfolio_simulation.gross_profit_loss,
        netProfitLoss: simulationData.portfolio_simulation.net_profit_loss,
        returnPct: simulationData.portfolio_simulation.return_pct,
        finalPortfolioValue: simulationData.portfolio_simulation.final_portfolio_value,
        riskLevel: simulationData.portfolio_simulation.risk_level
      },
      reasons: simulationData.reasons || [],
      investmentAssessment: {
        badge: simulationData.investment_assessment.badge,
        color: simulationData.investment_assessment.color,
        narrative: simulationData.investment_assessment.narrative
      }
    };
    generateInvestmentReportPDF(reportPayload);
  };

  const sim = simulationData?.portfolio_simulation;
  const risk = simulationData?.risk_metrics;
  const strat = simulationData?.strategy_analysis;
  const assess = simulationData?.investment_assessment;
  const isNetProfit = (sim?.net_profit_loss ?? 0) >= 0;

  return (
    <div className="space-y-8 pb-16">
      {/* Platform Title Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-surface via-surfaceHover to-surface border border-border p-6 md:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs font-semibold mb-3">
              <Zap className="w-3.5 h-3.5" /> Strategy DNA & Portfolio Simulator
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Investment Analysis & Portfolio Simulation Platform
            </h1>
            <p className="text-textMuted text-sm mt-1 max-w-2xl">
              Deterministic multi-asset risk measurement, systematic strategy modeling, and dynamic capital simulation with real-world trading friction.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2.5 bg-primary hover:bg-primaryHover text-white rounded-xl font-medium text-sm flex items-center gap-2 shadow-lg shadow-primary/25 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" /> Download PDF Report
            </button>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2.5 bg-surface border border-border hover:border-gray-500 text-textMuted hover:text-white rounded-xl text-sm flex items-center gap-2 transition-all cursor-pointer"
              title="Print or Save via Browser"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>
        </div>

        {/* Linear Step Progression Indicator */}
        <div className="mt-6 pt-6 border-t border-border/60 flex flex-wrap items-center gap-2 text-xs text-textMuted">
          <span className="font-semibold text-primary">1. Choose Asset</span>
          <ArrowRight className="w-3 h-3 text-border" />
          <span className="font-semibold text-primary">2. Historical Data</span>
          <ArrowRight className="w-3 h-3 text-border" />
          <span className="font-semibold text-primary">3. Risk Analysis</span>
          <ArrowRight className="w-3 h-3 text-border" />
          <span className="font-semibold text-primary">4. Strategy Analysis</span>
          <ArrowRight className="w-3 h-3 text-border" />
          <span className="font-semibold text-secondary">5. Portfolio Simulation</span>
          <ArrowRight className="w-3 h-3 text-border" />
          <span className="font-semibold text-secondary">6. Profit/Loss</span>
          <ArrowRight className="w-3 h-3 text-border" />
          <span className="font-semibold text-amber-400">7. Reason for Result</span>
          <ArrowRight className="w-3 h-3 text-border" />
          <span className="font-semibold text-amber-400">8. Investment Assessment</span>
          <ArrowRight className="w-3 h-3 text-border" />
          <span className="font-semibold text-white">9. PDF Report</span>
        </div>
      </div>

      {/* Backend Status indicator banner if offline */}
      {!apiConnected && (
        <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>Interactive Simulator is active with local historical model. Launch <code>start_backend.bat</code> in backend to sync live Yahoo Finance feeds.</span>
          </div>
          <button 
            onClick={runSimulation}
            className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded text-amber-200 text-xs font-semibold cursor-pointer"
          >
            Retry API
          </button>
        </div>
      )}

      {/* SECTION 1: ASSET SELECTION & SEARCHABLE DROPDOWN */}
      <section className="card space-y-4 relative z-30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">1</span>
              Select Asset & Investment Class
            </h2>
            <p className="text-xs text-textMuted">
              Choose from curated presets or search and enter any custom ticker symbol (e.g., AMZN, GOOGL, COIN, PLTR).
            </p>
          </div>
        </div>

        {/* Searchable Dropdown / Combobox Trigger & Popular Quick Pills */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start" ref={dropdownRef}>
          {/* Main Dropdown Combobox */}
          <div className="lg:col-span-8 relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`w-full p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between shadow-lg ${
                isDropdownOpen
                  ? 'bg-surfaceHover border-primary ring-2 ring-primary/30'
                  : 'bg-surface hover:bg-surfaceHover border-border hover:border-gray-500'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <span className="text-2xl p-2 rounded-xl bg-background border border-border/60 flex-shrink-0">
                  {currentAsset.icon}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-lg text-white font-mono tracking-tight">
                      {currentAsset.ticker}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                      {currentAsset.category}
                    </span>
                    {SUPPORTED_ASSETS.some(a => a.ticker.toUpperCase() === currentAsset.ticker.toUpperCase()) ? (
                      <span className="text-[10px] font-medium text-textMuted bg-background/60 px-2 py-0.5 rounded border border-border/40">
                        Verified Preset
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Custom Ticker
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-textMuted truncate mt-0.5">
                    {currentAsset.name} &bull; <span className="text-gray-400">{currentAsset.description}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                <span className="hidden sm:inline text-xs text-textMuted font-medium">
                  {isDropdownOpen ? 'Close' : 'Search / Change'}
                </span>
                <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center text-textMuted">
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-primary' : ''}`} />
                </div>
              </div>
            </button>

            {/* Dropdown Menu Popover */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-[#121826] border border-border/90 rounded-2xl shadow-2xl p-3.5 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Search Input */}
                <div className="relative mb-3">
                  <Search className="w-4 h-4 text-primary absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && cleanSearchQuery) {
                        if (filteredAssets.length === 1) {
                          handleSelectTicker(filteredAssets[0].ticker);
                        } else {
                          handleSelectTicker(cleanSearchQuery);
                        }
                      }
                    }}
                    placeholder="Search preset or type any ticker (e.g. AMZN, META, PLTR)..."
                    className="w-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl pl-10 pr-9 py-2.5 text-sm text-white placeholder-textMuted outline-none"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-textMuted hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Custom Ticker Direct Entry Card */}
                {cleanSearchQuery.length > 0 && !exactMatchExists && (
                  <div className="mb-3 p-3 rounded-xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/40 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-primary/30 text-primary flex items-center justify-center font-bold">
                        <Plus className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          Analyze custom ticker:
                          <span className="font-mono bg-primary px-2 py-0.5 rounded text-white text-xs font-extrabold shadow">
                            {cleanSearchQuery}
                          </span>
                        </div>
                        <div className="text-[11px] text-textMuted">
                          Press Enter or click to fetch live data and model historical prices
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSelectTicker(cleanSearchQuery)}
                      className="px-3 py-1.5 bg-primary hover:bg-primaryHover text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow cursor-pointer"
                    >
                      Select <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Category Filter Tabs inside Dropdown */}
                <div className="flex items-center gap-1 mb-2.5 p-1 bg-background rounded-lg border border-border overflow-x-auto">
                  {['All', 'Equities', 'Crypto', 'Commodities', 'Indices/ETFs'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 text-xs rounded-md font-medium whitespace-nowrap transition-all cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-primary text-white shadow-sm'
                          : 'text-textMuted hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Presets List */}
                <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                  {filteredAssets.length === 0 ? (
                    <div className="py-6 text-center text-textMuted text-xs">
                      No presets found matching "{searchQuery}".
                      {cleanSearchQuery && (
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={() => handleSelectTicker(cleanSearchQuery)}
                            className="text-primary hover:underline font-semibold cursor-pointer"
                          >
                            Click here to analyze "{cleanSearchQuery}" as a custom ticker
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    filteredAssets.map((asset) => {
                      const isSelected = selectedAsset.toUpperCase() === asset.ticker.toUpperCase();
                      return (
                        <button
                          key={asset.ticker}
                          type="button"
                          onClick={() => handleSelectTicker(asset.ticker)}
                          className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-primary/20 border-primary ring-1 ring-primary/40 text-white'
                              : 'bg-surface/60 hover:bg-surface border-border/60 hover:border-border text-textMuted hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-xl flex-shrink-0">{asset.icon}</span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white font-mono text-sm">
                                  {asset.ticker}
                                </span>
                                <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-background/80 text-textMuted font-semibold">
                                  {asset.category}
                                </span>
                              </div>
                              <div className="text-[11px] text-textMuted truncate">
                                {asset.name} &bull; {asset.description}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                            <span className="text-xs font-mono text-textMuted hidden sm:inline">
                              ${asset.basePrice.toLocaleString()}
                            </span>
                            {isSelected && (
                              <Check className="w-4 h-4 text-primary flex-shrink-0" />
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Popular Tickers Bar */}
          <div className="lg:col-span-4 p-3 rounded-xl bg-surface border border-border flex flex-col justify-between">
            <div className="text-[11px] font-semibold text-textMuted uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Quick Popular Presets</span>
              <span className="text-[10px] text-primary">1-Click</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['NVDA', 'AMZN', 'AAPL', 'MSFT', 'TSLA', 'BTC', 'ETH', 'GOLD', 'SPY'].map((t) => {
                const isCur = selectedAsset.toUpperCase() === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleSelectTicker(t)}
                    className={`px-2.5 py-1 text-xs rounded-lg font-mono font-semibold transition-all cursor-pointer ${
                      isCur
                        ? 'bg-primary text-white shadow-md ring-1 ring-primary/50'
                        : 'bg-background hover:bg-surfaceHover border border-border text-textMuted hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 & 3: HISTORICAL DATA ACCESS + RISK ANALYSIS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Historical Chart */}
        <div className="lg:col-span-2 card flex flex-col justify-between space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">2</span>
                Historical Market Data ({currentAssetMeta.ticker})
              </h2>
              <p className="text-xs text-textMuted">Historical price trajectory with moving average overlays.</p>
            </div>

            {/* Date Range Controls & Presets */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex gap-1 bg-background rounded-lg p-1 border border-border">
                <button onClick={() => setPresetRange(1)} className="px-2 py-0.5 text-xs text-textMuted hover:text-white cursor-pointer">1Y</button>
                <button onClick={() => setPresetRange(2)} className="px-2 py-0.5 text-xs text-textMuted hover:text-white cursor-pointer">2Y</button>
                <button onClick={() => setPresetRange(3)} className="px-2 py-0.5 text-xs text-textMuted hover:text-white cursor-pointer">3Y</button>
                <button onClick={() => setPresetRange(5)} className="px-2 py-0.5 text-xs text-textMuted hover:text-white cursor-pointer">5Y</button>
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-background border border-border rounded px-2 py-1 text-xs text-white outline-none"
                />
                <span className="text-textMuted text-xs">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-background border border-border rounded px-2 py-1 text-xs text-white outline-none"
                />
                <button
                  onClick={runSimulation}
                  disabled={loading}
                  className="p-1.5 bg-primary/20 hover:bg-primary/30 border border-primary/40 rounded text-primary text-xs flex items-center justify-center cursor-pointer"
                  title="Reload Data"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Historical Price Chart */}
          <div className="w-full" style={{ width: '100%', height: 300 }}>
            {simulationData?.historical_chart?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={simulationData.historical_chart} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" vertical={false} />
                  <XAxis dataKey="Date" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 11 }} minTickGap={45} />
                  <YAxis 
                    domain={['auto', 'auto']} 
                    stroke="#9CA3AF" 
                    tick={{ fill: '#9CA3AF', fontSize: 11 }} 
                    tickFormatter={(val) => `$${Number(val).toFixed(0)}`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', borderRadius: '0.5rem', fontSize: '12px' }}
                    formatter={(val: any) => `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                  <Line type="monotone" name={`${selectedAsset} Price`} dataKey="Price" stroke="#38BDF8" dot={false} strokeWidth={2} />
                  <Line type="monotone" name="MA (20)" dataKey="MA20" stroke="#F59E0B" dot={false} strokeWidth={1.5} strokeDasharray="4 4" />
                  <Line type="monotone" name="MA (50)" dataKey="MA50" stroke="#EC4899" dot={false} strokeWidth={1.5} strokeDasharray="2 2" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-textMuted text-sm">
                No historical price records available for selected range.
              </div>
            )}
          </div>

          {/* Quick Price Statistics Bar */}
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border/80">
            <div className="text-center p-2 rounded-lg bg-background">
              <span className="text-[11px] text-textMuted block">Period Entry Price</span>
              <span className="text-sm font-bold text-white">
                ${simulationData?.asset_info?.entry_price ? simulationData.asset_info.entry_price.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '--'}
              </span>
            </div>
            <div className="text-center p-2 rounded-lg bg-background">
              <span className="text-[11px] text-textMuted block">Period Exit Price</span>
              <span className="text-sm font-bold text-white">
                ${simulationData?.asset_info?.exit_price ? simulationData.asset_info.exit_price.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '--'}
              </span>
            </div>
            <div className="text-center p-2 rounded-lg bg-background">
              <span className="text-[11px] text-textMuted block">Underlying Price Change</span>
              <span className={`text-sm font-bold ${
                (simulationData?.asset_info?.price_change_pct || 0) >= 0 ? 'text-secondary' : 'text-danger'
              }`}>
                {(simulationData?.asset_info?.price_change_pct || 0) >= 0 ? '+' : ''}
                {simulationData?.asset_info?.price_change_pct ? simulationData.asset_info.price_change_pct.toFixed(2) : '--'}%
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: SECTION 3 - RISK ANALYSIS & RISK LEVEL INDICATOR */}
        <div className="card flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">3</span>
              Risk Analysis & Risk Level
            </h2>
            <p className="text-xs text-textMuted">Deterministic risk quantification across volatility & drawdowns.</p>
          </div>

          {/* Prominent Risk Level Indicator Badge */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            risk?.risk_level === 'Low'
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-400'
              : risk?.risk_level === 'Medium'
              ? 'bg-amber-950/30 border-amber-500/40 text-amber-400'
              : 'bg-rose-950/30 border-rose-500/40 text-rose-400'
          }`}>
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-8 h-8" />
              <div>
                <span className="text-[11px] uppercase tracking-wider font-semibold opacity-80 block">Calculated Risk Level</span>
                <span className="text-2xl font-black">{risk?.risk_level ? `${risk.risk_level.toUpperCase()} RISK` : 'CALCULATING...'}</span>
              </div>
            </div>

            {/* Gauge representation */}
            <div className="flex gap-1.5">
              <div className={`w-3 h-7 rounded-sm ${risk?.risk_level ? 'bg-emerald-500' : 'bg-surfaceHover'}`}></div>
              <div className={`w-3 h-7 rounded-sm ${risk?.risk_level === 'Medium' || risk?.risk_level === 'High' ? 'bg-amber-500' : 'bg-surfaceHover'}`}></div>
              <div className={`w-3 h-7 rounded-sm ${risk?.risk_level === 'High' ? 'bg-rose-500' : 'bg-surfaceHover'}`}></div>
            </div>
          </div>

          {/* Risk Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-background border border-border">
              <span className="text-xs text-textMuted block mb-1">Annualized Volatility</span>
              <span className="text-xl font-bold text-white">
                {risk?.annualized_volatility ? `${(risk.annualized_volatility * 100).toFixed(2)}%` : '--'}
              </span>
              <span className="text-[10px] text-textMuted block mt-1">Daily standard deviation x √252</span>
            </div>

            <div className="p-3 rounded-lg bg-background border border-border">
              <span className="text-xs text-textMuted block mb-1">Sharpe Ratio</span>
              <span className={`text-xl font-bold ${
                (risk?.sharpe_ratio || 0) > 1.0 ? 'text-secondary' : (risk?.sharpe_ratio || 0) > 0 ? 'text-amber-400' : 'text-danger'
              }`}>
                {risk?.sharpe_ratio !== undefined ? risk.sharpe_ratio.toFixed(2) : '--'}
              </span>
              <span className="text-[10px] text-textMuted block mt-1">Risk-adjusted excess return</span>
            </div>

            <div className="p-3 rounded-lg bg-background border border-border">
              <span className="text-xs text-textMuted block mb-1">Max Drawdown</span>
              <span className="text-xl font-bold text-danger">
                {risk?.max_drawdown ? `${(risk.max_drawdown * 100).toFixed(2)}%` : '--'}
              </span>
              <span className="text-[10px] text-textMuted block mt-1">Deepest peak-to-trough decline</span>
            </div>

            <div className="p-3 rounded-lg bg-background border border-border">
              <span className="text-xs text-textMuted block mb-1">Daily VaR (95%)</span>
              <span className="text-xl font-bold text-white">
                {risk?.value_at_risk_95 ? `${(risk.value_at_risk_95 * 100).toFixed(2)}%` : '--'}
              </span>
              <span className="text-[10px] text-textMuted block mt-1">Parametric 95% confidence</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-surfaceHover/50 border border-border text-xs text-textMuted flex items-start gap-2">
            <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <span>
              Risk level reflects asset volatility and peak drawdown boundaries. High risk demands wider stop margins or smaller position sizes.
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 4: STRATEGY ANALYSIS */}
      <section className="card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">4</span>
              Trading Strategy Analysis & Performance
            </h2>
            <p className="text-xs text-textMuted">Select and backtest algorithmic models against standard Buy & Hold.</p>
          </div>

          {/* Strategy Selector */}
          <div className="flex items-center gap-3">
            <label className="text-xs text-textMuted">Algorithm:</label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-white font-medium outline-none cursor-pointer"
            >
              <option value="SMA_Crossover">SMA Crossover (Fast / Slow)</option>
              <option value="EMA_Trend">EMA Trend Following</option>
              <option value="Momentum">Price Momentum (N-Day)</option>
              <option value="Mean_Reversion">Mean Reversion (Bollinger Style)</option>
            </select>
          </div>
        </div>

        {/* Strategy Parameters Bar */}
        {strategy === 'SMA_Crossover' && (
          <div className="flex flex-wrap items-center gap-6 p-3 rounded-xl bg-background border border-border text-xs">
            <div className="flex items-center gap-2">
              <span className="text-textMuted">Short MA Window:</span>
              <input
                type="number"
                min="5"
                max="100"
                value={shortWindow}
                onChange={(e) => setShortWindow(Number(e.target.value))}
                className="w-16 bg-surface border border-border rounded px-2 py-1 text-white font-bold"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-textMuted">Long MA Window:</span>
              <input
                type="number"
                min="20"
                max="250"
                value={longWindow}
                onChange={(e) => setLongWindow(Number(e.target.value))}
                className="w-16 bg-surface border border-border rounded px-2 py-1 text-white font-bold"
              />
            </div>
            <button
              onClick={runSimulation}
              disabled={loading}
              className="px-3 py-1 bg-primary/20 hover:bg-primary/30 border border-primary/40 rounded text-primary font-medium cursor-pointer"
            >
              Update Strategy
            </button>
          </div>
        )}

        {/* Strategy Equity Curve Chart */}
        <div className="w-full" style={{ width: '100%', height: 300 }}>
          {strat?.equity_curve?.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={strat.equity_curve} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" vertical={false} />
                <XAxis dataKey="Date" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 11 }} minTickGap={50} />
                <YAxis 
                  domain={['auto', 'auto']} 
                  stroke="#9CA3AF" 
                  tick={{ fill: '#9CA3AF', fontSize: 11 }} 
                  tickFormatter={(val) => `${(Number(val) * 100).toFixed(0)}%`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', borderRadius: '0.5rem', fontSize: '12px' }}
                  formatter={(val: any) => `${(Number(val) * 100).toFixed(2)}%`}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Line type="monotone" name="Strategy Cumulative Growth" dataKey="Strategy_Growth" stroke="#10B981" dot={false} strokeWidth={2.5} />
                <Line type="monotone" name="Buy & Hold Benchmark" dataKey="BnH_Growth" stroke="#6366F1" dot={false} strokeWidth={1.5} opacity={0.6} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-textMuted text-sm">
              No strategy signals available.
            </div>
          )}
        </div>

        {/* Strategy Metrics Comparison */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border">
          <div className="p-3 rounded-lg bg-background">
            <span className="text-xs text-textMuted block mb-1">Strategy Return</span>
            <span className={`text-xl font-bold ${(strat?.strategy_return || 0) >= 0 ? 'text-secondary' : 'text-danger'}`}>
              {(strat?.strategy_return || 0) >= 0 ? '+' : ''}
              {strat?.strategy_return !== undefined ? `${(strat.strategy_return * 100).toFixed(2)}%` : '--'}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-background">
            <span className="text-xs text-textMuted block mb-1">Benchmark (Buy & Hold)</span>
            <span className={`text-xl font-bold ${(strat?.benchmark_return || 0) >= 0 ? 'text-indigo-400' : 'text-danger'}`}>
              {(strat?.benchmark_return || 0) >= 0 ? '+' : ''}
              {strat?.benchmark_return !== undefined ? `${(strat.benchmark_return * 100).toFixed(2)}%` : '--'}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-background">
            <span className="text-xs text-textMuted block mb-1">Total Executed Trades</span>
            <span className="text-xl font-bold text-white">
              {strat?.total_trades !== undefined ? strat.total_trades : '--'}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-background">
            <span className="text-xs text-textMuted block mb-1">Alpha vs Benchmark</span>
            <span className={`text-xl font-bold ${
              ((strat?.strategy_return || 0) - (strat?.benchmark_return || 0)) >= 0 ? 'text-secondary' : 'text-danger'
            }`}>
              {((strat?.strategy_return || 0) - (strat?.benchmark_return || 0)) >= 0 ? '+' : ''}
              {strat ? `${(((strat.strategy_return || 0) - (strat.benchmark_return || 0)) * 100).toFixed(2)}%` : '--'}
            </span>
          </div>
        </div>
      </section>

      {/* SECTION 5: PORTFOLIO SIMULATION (DYNAMIC CALCULATIONS WITH TRADING FEES DEDUCTED) */}
      <section className="card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-secondary/20 text-secondary flex items-center justify-center text-xs font-bold">5</span>
              Dynamic Portfolio Simulation
            </h2>
            <p className="text-xs text-textMuted">Adjust capital and trading fee assumptions. Trading costs are strictly deducted from profit/loss.</p>
          </div>

          <div className="text-xs text-secondary font-medium px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Fees Automatically Deducted
          </div>
        </div>

        {/* Input Parameters Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-background border border-border">
          <div>
            <label className="text-xs text-textMuted block mb-1 font-medium">Initial Cash Balance ($)</label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-textMuted absolute left-3 top-2.5" />
              <input
                type="number"
                min="500"
                step="500"
                value={cashBalance}
                onChange={(e) => setCashBalance(Number(e.target.value))}
                className="w-full bg-surface border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-white font-bold outline-none"
              />
            </div>
            <span className="text-[10px] text-textMuted block mt-1">Total liquid portfolio capital</span>
          </div>

          <div>
            <label className="text-xs text-textMuted block mb-1 font-medium">Investment Amount ($)</label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-textMuted absolute left-3 top-2.5" />
              <input
                type="number"
                min="100"
                max={cashBalance}
                step="500"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(Number(e.target.value))}
                className="w-full bg-surface border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-white font-bold outline-none"
              />
            </div>
            <span className="text-[10px] text-textMuted block mt-1">
              {((investmentAmount / (cashBalance || 1)) * 100).toFixed(0)}% of initial cash allocated
            </span>
          </div>

          <div>
            <label className="text-xs text-textMuted block mb-1 font-medium">Trading Fee / Brokerage (%)</label>
            <div className="relative">
              <Percent className="w-4 h-4 text-textMuted absolute left-3 top-2.5" />
              <input
                type="number"
                min="0"
                max="5"
                step="0.05"
                value={tradingCostPct}
                onChange={(e) => setTradingCostPct(Number(e.target.value))}
                className="w-full bg-surface border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-white font-bold outline-none"
              />
            </div>
            <span className="text-[10px] text-textMuted block mt-1">Round-trip fee deducted from returns</span>
          </div>
        </div>

        {/* Dynamic Simulation Metrics Table */}
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-surface border-b border-border text-xs uppercase text-textMuted">
                <th className="py-3 px-4">Metric</th>
                <th className="py-3 px-4">Simulation Value</th>
                <th className="py-3 px-4">Description / Mathematical Formula</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr className="hover:bg-surfaceHover/40">
                <td className="py-3 px-4 font-semibold text-textMuted">Cash Balance</td>
                <td className="py-3 px-4 font-bold text-white">
                  ${sim ? Number(sim.cash_balance).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '--'}
                </td>
                <td className="py-3 px-4 text-xs text-textMuted">Starting total cash in simulated account</td>
              </tr>

              <tr className="hover:bg-surfaceHover/40">
                <td className="py-3 px-4 font-semibold text-textMuted">Selected Asset</td>
                <td className="py-3 px-4 font-bold text-primary">
                  {sim ? `${sim.selected_asset} (${currentAssetMeta.category})` : '--'}
                </td>
                <td className="py-3 px-4 text-xs text-textMuted">Asset instrument evaluated</td>
              </tr>

              <tr className="hover:bg-surfaceHover/40">
                <td className="py-3 px-4 font-semibold text-textMuted">Simulated Quantity</td>
                <td className="py-3 px-4 font-bold text-white">
                  {sim ? `${Number(sim.quantity).toFixed(4)} units` : '--'}
                </td>
                <td className="py-3 px-4 text-xs text-textMuted">Investment Amount ÷ Entry Price</td>
              </tr>

              <tr className="hover:bg-surfaceHover/40">
                <td className="py-3 px-4 font-semibold text-textMuted">Entry Price</td>
                <td className="py-3 px-4 font-bold text-white">
                  ${sim ? Number(sim.entry_price).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '--'}
                </td>
                <td className="py-3 px-4 text-xs text-textMuted">Initial price at start of simulation window</td>
              </tr>

              <tr className="hover:bg-surfaceHover/40">
                <td className="py-3 px-4 font-semibold text-textMuted">Exit Price</td>
                <td className="py-3 px-4 font-bold text-white">
                  ${sim ? Number(sim.exit_price).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '--'}
                </td>
                <td className="py-3 px-4 text-xs text-textMuted">Closing price at end of simulation window</td>
              </tr>

              <tr className="hover:bg-surfaceHover/40">
                <td className="py-3 px-4 font-semibold text-textMuted">Investment Amount</td>
                <td className="py-3 px-4 font-bold text-white">
                  ${sim ? Number(sim.investment_amount).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '--'}
                </td>
                <td className="py-3 px-4 text-xs text-textMuted">Capital deployed into strategy trades</td>
              </tr>

              <tr className="hover:bg-surfaceHover/40 bg-amber-950/10">
                <td className="py-3 px-4 font-semibold text-amber-400">Trading Cost (Deducted)</td>
                <td className="py-3 px-4 font-bold text-amber-400">
                  -${sim ? Number(sim.trading_cost).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '--'}
                </td>
                <td className="py-3 px-4 text-xs text-amber-300/80">Cumulative brokerage & friction subtracted from profit</td>
              </tr>

              <tr className={`font-bold ${isNetProfit ? 'bg-emerald-950/20' : 'bg-rose-950/20'}`}>
                <td className={`py-3.5 px-4 ${isNetProfit ? 'text-emerald-400' : 'text-rose-400'}`}>Net Profit / Loss</td>
                <td className={`py-3.5 px-4 text-lg ${isNetProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {sim ? `${Number(sim.net_profit_loss) >= 0 ? '+' : ''}$${Number(sim.net_profit_loss).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '--'}
                </td>
                <td className="py-3.5 px-4 text-xs text-textMuted">Gross Profit/Loss minus Trading Costs</td>
              </tr>

              <tr className={`font-bold ${isNetProfit ? 'bg-emerald-950/20' : 'bg-rose-950/20'}`}>
                <td className={`py-3 px-4 ${isNetProfit ? 'text-emerald-400' : 'text-rose-400'}`}>Net Return %</td>
                <td className={`py-3 px-4 text-lg ${isNetProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {sim ? `${Number(sim.return_pct) >= 0 ? '+' : ''}${Number(sim.return_pct).toFixed(2)}%` : '--'}
                </td>
                <td className="py-3 px-4 text-xs text-textMuted">Net Profit ÷ Investment Amount × 100</td>
              </tr>

              <tr className="hover:bg-surfaceHover/40 bg-surface">
                <td className="py-3.5 px-4 font-bold text-white">Final Portfolio Value</td>
                <td className="py-3.5 px-4 text-xl font-extrabold text-white">
                  ${sim ? Number(sim.final_portfolio_value).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '--'}
                </td>
                <td className="py-3.5 px-4 text-xs text-textMuted">Unallocated Cash + Investment + Net Profit/Loss</td>
              </tr>

              <tr className="hover:bg-surfaceHover/40">
                <td className="py-3 px-4 font-semibold text-textMuted">Risk Level</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    sim?.risk_level === 'Low' ? 'bg-emerald-500/20 text-emerald-400' :
                    sim?.risk_level === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {sim?.risk_level || '--'}
                  </span>
                </td>
                <td className="py-3 px-4 text-xs text-textMuted">Composite exposure risk rating</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION 6: VERY IMPORTANT — REASON FOR THE RESULT (PROFIT OR LOSS) */}
      <section className={`card border-2 ${
        isNetProfit ? 'border-emerald-500/40 bg-emerald-950/10' : 'border-rose-500/40 bg-rose-950/10'
      }`}>
        <div className="flex items-center gap-3 mb-4">
          {isNetProfit ? (
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-6 h-6" />
            </div>
          )}

          <div>
            <span className={`text-xs font-bold uppercase tracking-wider ${
              isNetProfit ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {isNetProfit ? 'Simulation Outcome: Net Profit' : 'Simulation Outcome: Net Loss'}
            </span>
            <h2 className="text-xl font-black text-white">
              {isNetProfit ? 'Why the Investment Generated Profit' : 'Why the Investment Resulted in a Loss'}
            </h2>
          </div>
        </div>

        <p className="text-xs text-textMuted mb-4">
          Explanations are dynamically derived from the underlying asset price movements, strategy execution signals, trading friction, and volatility:
        </p>

        {/* Dynamic Reason Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {simulationData?.reasons?.map((reason: any, idx: number) => (
            <div key={idx} className="p-4 rounded-xl bg-background border border-border flex items-start gap-3">
              {reason.status === 'Positive' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <span className="text-xs font-bold text-white block mb-0.5">{reason.factor}</span>
                <p className="text-xs text-textMuted leading-relaxed">{reason.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 7: INVESTMENT DECISION / ASSESSMENT */}
      <section className="card space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">7</span>
          <h2 className="text-lg font-bold text-white">Investment Assessment & Suitability Analysis</h2>
        </div>

        {assess && (
          <div className="p-6 rounded-xl bg-background border border-border space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
              <div>
                <span className="text-xs text-textMuted uppercase font-semibold block mb-1">Analytical Classification</span>
                <span className={`inline-block text-lg font-extrabold px-3 py-1 rounded-lg ${
                  assess.color === 'success' 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : assess.color === 'warning'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}>
                  {assess.badge}
                </span>
              </div>

              <div className="text-xs text-textMuted max-w-xs text-right">
                Synthesized from Sharpe Ratio ({Number(risk?.sharpe_ratio || 0).toFixed(2)}), Max Drawdown ({(Number(risk?.max_drawdown || 0) * 100).toFixed(1)}%), and Net Return ({Number(sim?.return_pct || 0).toFixed(1)}%).
              </div>
            </div>

            {/* Narrative Explanation */}
            <div>
              <span className="text-xs font-bold text-white block mb-1">Assessment Rationale</span>
              <p className="text-sm text-textMuted leading-relaxed">
                {assess.narrative}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 8: DOWNLOAD REPORT & REGULATORY DISCLAIMER */}
      <section className="card p-6 border-t-2 border-primary/40 bg-gradient-to-b from-surface to-background flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Download className="w-4 h-4 text-primary" />
            Download Complete Investment Analysis Report
          </h3>
          <p className="text-xs text-textMuted max-w-xl">
            Download a PDF containing the full asset profile, risk statistics, strategy parameters, portfolio simulation accounting, dynamic loss/profit reasons, and investment assessment.
          </p>
          <p className="text-[11px] text-gray-500 italic mt-2">
            "Historical simulation is for educational and analytical purposes only. Past performance does not guarantee future results and this platform does not provide personalized financial advice."
          </p>
        </div>

        <button
          onClick={handleDownloadPDF}
          className="px-6 py-3.5 bg-primary hover:bg-primaryHover text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-xl shadow-primary/20 transition-all cursor-pointer disabled:opacity-50 flex-shrink-0"
        >
          <Download className="w-5 h-5" />
          Download PDF Report
        </button>
      </section>
    </div>
  );
}
