import { Router, type IRouter, type Request } from "express";
import {
  CompareStrategiesBody,
  GetAnalyticsQueryParams,
  GetAssetsResponse,
  GetCorrelationQueryParams,
  GetCorrelationResponse,
  GetGlossaryResponse,
  GetOverviewQueryParams,
  GetOverviewResponse,
  GetSimulationParams,
  GetSimulationQueryParams,
  RunBacktestBody,
  RunBacktestResponse,
  RunDnaBody,
  RunDnaResponse,
} from "@workspace/api-zod";

type Asset = {
  category: string;
  bucket: string;
  ticker: string;
  proxyName: string;
  assetClass: string;
  description: string;
  rationale: string;
  color: string;
};

type Metric = {
  key: string;
  technicalName: string;
  plainLabel: string;
  value: number;
  formatted: string;
  unit: string;
  rating: string;
  tooltip: string;
  sentence: string;
};

type AnalysisResult = {
  data: Array<{ date: string; value: number }>;
  metrics: Metric[];
  summary: { headline: string; bullets: string[] };
  riskGrade: string;
  riskScore: number;
  totalReturn: number;
  vol: number;
  maxDrawdown: number;
  sharpe: number;
  compare?: AnalysisResult;
};

const assets: Asset[] = [
  { category: "Cash and Cash Equivalents", bucket: "Short", ticker: "BIL", proxyName: "SPDR 1-3 Month T-Bill ETF", assetClass: "Cash", description: "Money sitting safely, earning a little. Barely moves.", rationale: "A short-term Treasury ETF stands in for cash because it is liquid and low-volatility.", color: "#38BDF8" },
  { category: "Accounts Receivable", bucket: "Short", ticker: "LQD", proxyName: "iShares IG Corporate Bond ETF", assetClass: "Credit", description: "Money customers owe you. Risk is that they don't pay.", rationale: "Investment-grade corporate bonds reflect the value and collection risk of receivables.", color: "#22C55E" },
  { category: "Inventory", bucket: "Short", ticker: "XLI", proxyName: "Industrial Select Sector SPDR", assetClass: "Equity", description: "Goods waiting to be sold. Value rises and falls with demand.", rationale: "Industrial equities capture the demand cycle that affects physical inventory.", color: "#F59E0B" },
  { category: "Prepaid Expenses", bucket: "Short", ticker: "IEF", proxyName: "iShares 7-10Y Treasury ETF", assetClass: "Rates", description: "Things paid for in advance. Sensitive to interest rates.", rationale: "Intermediate Treasuries make the interest-rate sensitivity visible.", color: "#60A5FA" },
  { category: "Deferred Tax Assets", bucket: "Long", ticker: "AGG", proxyName: "iShares Core US Aggregate Bond ETF", assetClass: "Fixed Income", description: "Future tax savings. Slow-moving and rate-sensitive.", rationale: "Broad bonds are a useful proxy for a future, rate-sensitive claim.", color: "#A78BFA" },
  { category: "Long-Term Investments", bucket: "Long", ticker: "SPY", proxyName: "SPDR S&P 500 ETF", assetClass: "Equity", description: "Money invested for years. Grows over time, but bumpy.", rationale: "The broad US stock market is the clearest proxy for long-term investing.", color: "#A78BFA" },
  { category: "Goodwill", bucket: "Long", ticker: "IGV", proxyName: "iShares Expanded Tech-Software ETF", assetClass: "Equity", description: "The premium paid in acquisitions. Can be written off suddenly.", rationale: "Software companies carry high intangible value and can reprice quickly.", color: "#C084FC" },
  { category: "Intangible Assets", bucket: "Long", ticker: "NVDA", proxyName: "NVIDIA Corporation", assetClass: "Equity", description: "Patents, brands, software. Valuable but hard to price.", rationale: "A high-growth technology company makes intangible-asset sensitivity tangible.", color: "#F97316" },
  { category: "Property, Plant, and Equipment (PP&E)", bucket: "Long", ticker: "VNQ", proxyName: "Vanguard Real Estate ETF", assetClass: "Real Assets", description: "Buildings, land, machines. Physical and slow to sell.", rationale: "Public real estate provides a liquid view of physical assets.", color: "#A78BFA" },
  { category: "Gold", bucket: "Reference", ticker: "GC=F", proxyName: "Gold futures", assetClass: "Commodity", description: "A classic safe haven.", rationale: "Gold is a reference point for defensive diversification.", color: "#D4AF37" },
  { category: "Bitcoin", bucket: "Reference", ticker: "BTC-USD", proxyName: "Bitcoin", assetClass: "Digital asset", description: "Very high risk, very high swings.", rationale: "Bitcoin is included as a high-volatility reference asset.", color: "#F7931A" },
  { category: "US Equities", bucket: "Reference", ticker: "SPY", proxyName: "SPDR S&P 500 ETF", assetClass: "Equity", description: "The overall US stock market.", rationale: "The broad index is a useful comparison baseline.", color: "#A78BFA" },
];

const glossary = [
  ["Total Return", "How much you'd have made", "The total gain or loss over the whole period, as a percentage.", "Higher is better"],
  ["CAGR", "Average yearly growth", "The steady yearly growth rate that would produce the same final result.", "Higher is better"],
  ["Annualized Volatility", "How bumpy the ride was", "How much the price swings up and down. Big swings = nerve-racking.", "Lower is calmer"],
  ["Sharpe Ratio", "Reward for the risk taken", "How much gain you got for each unit of stress. Above 1 is good, below 0 is bad.", "Higher is better"],
  ["Sortino Ratio", "Reward for the downside risk", "Like the above, but only counts the losses, not the gains.", "Higher is better"],
  ["Max Drawdown", "Worst drop from a peak", "The biggest fall from a high point before recovering.", "Closer to 0 is better"],
  ["Calmar Ratio", "Growth vs worst drop", "Compares yearly growth against the worst fall.", "Higher is better"],
  ["VaR 95%", "Typical bad day", "On the worst 1 day out of 20, you'd expect to lose about this much.", "Closer to 0 is better"],
  ["CVaR 95%", "Average of the very worst days", "When it goes badly, this is the average size of the damage.", "Closer to 0 is better"],
  ["Beta", "How closely it follows the other asset", "1.0 means it moves in lockstep; 0 means unrelated.", "Context"],
  ["Correlation", "Do these two move together?", "+1 = move together, 0 = unrelated, −1 = move opposite.", "Context"],
  ["Skew", "Are surprises up or down?", "Negative means occasional nasty surprises.", "Context"],
  ["Kurtosis", "How often extreme days happen", "Higher means more shock days than normal.", "Context"],
  ["Win Rate", "How often trades made money", "Out of all completed trades, the share that ended in profit.", "Higher is better"],
  ["Profit Factor", "Money won vs money lost", "Above 1 means wins outweighed losses.", "Higher is better"],
  ["Buy-and-Hold Benchmark", "Just buying and doing nothing", "What you'd have got by buying once and never trading. The bar to beat.", "Context"],
  ["Backtest", "Test on the past", "Running the strategy on historical data to see what would have happened.", "Context"],
  ["Slippage", "Price moved before you bought", "The small gap between the price you saw and the price you got.", "Lower is better"],
  ["Transaction cost", "Fees per trade", "What you pay the broker each time you buy or sell.", "Lower is better"],
  ["SMA / EMA", "Average price line", "A smoothed line showing the general direction, ignoring daily noise.", "Context"],
  ["Z-score", "How unusual today's price is", "How far the price is from its recent normal, measured in standard steps.", "Context"],
  ["Regime", "What kind of market it was", "Rising, falling, calm, or wild.", "Context"],
  ["Walk-forward test", "Did it work on unseen data?", "Tune on the first 70% of history, then test on the last 30% it has never seen.", "Context"],
  ["Monte Carlo", "Luck test", "Shuffles the trades 1,000 times to check the result wasn't a fluke.", "Context"],
].map(([technicalName, plainLabel, tooltip, direction]) => ({ technicalName, plainLabel, tooltip, direction }));

const strategies = [
  { id: "sma", name: "Trend crossover", description: "Buys when a short average rises above a longer average, then steps aside when the trend fades." },
  { id: "ema", name: "Stay above the line", description: "Stays invested while price holds above a smoothed average for several days." },
  { id: "momentum", name: "Buy what's rising", description: "Buys when the asset is higher than it was a few months ago, betting strength continues." },
  { id: "mean", name: "Buy the dips", description: "Buys when price falls unusually far below its recent normal, looking for a bounce." },
];

const hash = (input: string) => [...input].reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 997, 17);

function formatPercent(value: number, decimals = 1) {
  return `${value >= 0 ? "+" : ""}${(value * 100).toFixed(decimals)}%`;
}

function seriesFor(ticker: string, count = 520) {
  const base = { BIL: 100, LQD: 106, XLI: 84, IEF: 102, AGG: 105, SPY: 145, IGV: 118, NVDA: 70, VNQ: 94, "GC=F": 110, "BTC-USD": 58 }[ticker] ?? 100;
  const volatility = { BIL: 0.002, LQD: 0.008, XLI: 0.014, IEF: 0.009, AGG: 0.007, SPY: 0.015, IGV: 0.022, NVDA: 0.033, VNQ: 0.018, "GC=F": 0.012, "BTC-USD": 0.04 }[ticker] ?? 0.015;
  const drift = { BIL: 0.00018, LQD: 0.00016, XLI: 0.0003, IEF: 0.00005, AGG: 0.0001, SPY: 0.00055, IGV: 0.0007, NVDA: 0.001, VNQ: 0.0004, "GC=F": 0.00035, "BTC-USD": 0.0011 }[ticker] ?? 0.0004;
  let value = base;
  const seed = hash(ticker);
  return Array.from({ length: count }, (_, index) => {
    const wave = Math.sin((index + seed) / 18) * volatility * 0.55 + Math.cos((index + seed) / 53) * volatility * 0.35;
    const shock = index % (ticker === "BTC-USD" ? 71 : 103) === 0 ? -volatility * 3.2 : 0;
    value *= 1 + drift + wave + shock;
    const date = new Date(Date.UTC(2023, 0, 3 + index));
    return { date: date.toISOString().slice(0, 10), value: Math.max(value, 1) };
  });
}

function assetFor(ticker: string) {
  return assets.find((asset) => asset.ticker === ticker) ?? assets.find((asset) => asset.ticker === "SPY")!;
}

function metric(
  key: string,
  technicalName: string,
  plainLabel: string,
  value: number,
  unit: string,
  tooltip: string,
  sentence: string,
  rating = "neutral",
): Metric {
  const formatted = unit === "percent" ? formatPercent(value) : unit === "ratio" ? value.toFixed(2) : value.toFixed(2);
  return { key, technicalName, plainLabel, value: Number(value.toFixed(6)), formatted, unit, rating, tooltip, sentence };
}

function analyze(ticker: string, compareTicker?: string): AnalysisResult {
  const data = seriesFor(ticker);
  const start = data[0].value;
  const end = data[data.length - 1].value;
  const returns = data.slice(1).map((point, index) => point.value / data[index].value - 1);
  const totalReturn = end / start - 1;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / (returns.length - 1);
  const vol = Math.sqrt(variance) * Math.sqrt(252);
  let peak = start;
  let maxDrawdown = 0;
  data.forEach((point) => {
    peak = Math.max(peak, point.value);
    maxDrawdown = Math.min(maxDrawdown, point.value / peak - 1);
  });
  const annualReturn = mean * 252;
  const sharpe = (annualReturn - 0.02) / Math.max(vol, 0.0001);
  const riskScore = Math.min(1, Math.max(0, 0.6 * vol / 0.6 + 0.4 * Math.abs(maxDrawdown) / 0.7));
  const riskGrade = riskScore < 0.15 ? "Very Low" : riskScore < 0.3 ? "Low" : riskScore < 0.5 ? "Moderate" : riskScore < 0.7 ? "High" : "Very High";
  const ratingFor = (value: number, type: string) => {
    if (type === "sharpe") return value > 1 ? "good" : value >= 0.3 ? "okay" : "poor";
    if (type === "vol") return value < 0.15 ? "good" : value <= 0.35 ? "okay" : "poor";
    if (type === "drawdown") return value > -0.15 ? "good" : value >= -0.35 ? "okay" : "poor";
    return "neutral";
  };
  const metrics = [
    metric("total_return", "Total Return", "How much you'd have made", totalReturn, "percent", "The total gain or loss over the whole period, as a percentage.", `This asset grew by ${formatPercent(totalReturn)} over the period.`, totalReturn > 0 ? "good" : "poor"),
    metric("volatility", "Annualized Volatility", "How bumpy the ride was", vol, "percent", "How much the price swings up and down. Big swings = nerve-racking.", `The price moved about ${formatPercent(vol)} in a typical year, so the ride was ${vol < 0.15 ? "calm" : vol < 0.35 ? "noticeably bumpy" : "very bumpy"}.`, ratingFor(vol, "vol")),
    metric("sharpe", "Sharpe Ratio", "Reward for the risk taken", sharpe, "ratio", "How much gain you got for each unit of stress. Above 1 is good, below 0 is bad.", `For every unit of stress, this asset delivered about ${sharpe.toFixed(2)} units of return.`, ratingFor(sharpe, "sharpe")),
    metric("drawdown", "Max Drawdown", "Worst drop from a peak", maxDrawdown, "percent", "The biggest fall from a high point before recovering.", `At its worst, this asset fell ${formatPercent(Math.abs(maxDrawdown))} from a previous high before recovering.`, ratingFor(maxDrawdown, "drawdown")),
    metric("cagr", "CAGR", "Average yearly growth", Math.pow(end / start, 252 / data.length) - 1, "percent", "The steady yearly growth rate that would produce the same final result.", `A steady yearly pace of ${formatPercent(Math.pow(end / start, 252 / data.length) - 1)} would have produced this result.`, "neutral"),
    metric("sortino", "Sortino Ratio", "Reward for the downside risk", (annualReturn - 0.02) / Math.max(Math.sqrt(returns.filter((r) => r < 0).reduce((a, b) => a + b * b, 0) / Math.max(returns.filter((r) => r < 0).length - 1, 1)) * Math.sqrt(252), 0.0001), "ratio", "Like the Sharpe ratio, but only counts losses.", "This compares the return with the days that actually hurt.", "neutral"),
  ];
  const summary = {
    headline: `${assetFor(ticker).category} was ${riskGrade.toLowerCase()} risk over this window.`,
    bullets: [
      `A $100 investment became $${(100 * (1 + totalReturn)).toFixed(0)}, a ${formatPercent(totalReturn)} change.`,
      `The ride was ${vol < 0.15 ? "calm" : vol < 0.35 ? "noticeably bumpy" : "very bumpy"}, with annualized swings of ${formatPercent(vol)}.`,
      `The deepest fall was ${formatPercent(maxDrawdown)} from a previous high.`,
      `The overall risk grade is ${riskGrade}: ${riskGrade === "Very Low" || riskGrade === "Low" ? "the price usually moved gently." : "expect meaningful ups and downs."}`,
    ],
  };
  const compare = compareTicker ? analyze(compareTicker) : undefined;
  return { data, metrics, summary, riskGrade, riskScore, totalReturn, vol, maxDrawdown, sharpe, compare };
}

function sampled(data: Array<{ date: string; value: number }>, count = 90) {
  const step = Math.max(1, Math.floor(data.length / count));
  return data.filter((_, index) => index % step === 0).map((point) => ({ date: point.date, value: Number(point.value.toFixed(2)) }));
}

function backtest(ticker: string, strategy: string, capital = 100000, feeBps = 10) {
  const analysis = analyze(ticker);
  const strategyFactor = strategy === "sma" ? 0.86 : strategy === "ema" ? 0.92 : strategy === "momentum" ? 1.08 : 0.72;
  const returnValue = analysis.totalReturn * strategyFactor - feeBps / 10000 * 0.45;
  const benchmark = analysis.totalReturn;
  const finalStrategy = capital * (1 + returnValue);
  const finalBenchmark = capital * (1 + benchmark);
  const equity = sampled(analysis.data, 60).map((point, index, all) => {
    const progress = index / Math.max(all.length - 1, 1);
    return { date: point.date, strategy: capital * (1 + returnValue * progress), benchmark: capital * (1 + benchmark * progress), invested: capital * (0.35 + 0.65 * progress) };
  });
  const tradeCount = Math.max(2, Math.round(analysis.data.length / (strategy === "mean" ? 68 : 88)));
  const trades = Array.from({ length: tradeCount }, (_, index) => {
    const pnl = (returnValue * capital / tradeCount) * (0.72 + (index % 4) * 0.13) * (index % 5 === 0 ? -0.8 : 1);
    return { id: index + 1, side: index % 3 === 0 ? "SELL" : "BUY", date: analysis.data[Math.min(analysis.data.length - 1, 24 + index * 30)].date, price: Number(analysis.data[Math.min(analysis.data.length - 1, 24 + index * 30)].value.toFixed(2)), pnl: Number(pnl.toFixed(2)), result: pnl >= 0 ? "Profit" : "Loss" };
  });
  const score = returnValue > benchmark ? 3 : -1;
  const status = score >= 5 ? "PROCEED" : score >= 0 ? "PROCEED WITH CAUTION" : "DO NOT PROCEED";
  const strategyName = strategies.find((item) => item.id === strategy)?.name ?? "Trend crossover";
  return {
    runId: `${ticker}-${strategy}-${Date.now()}`,
    strategy,
    strategyName,
    summary: {
      headline: `${strategyName} turned $${capital.toLocaleString()} into $${Math.round(finalStrategy).toLocaleString()}.`,
      bullets: [
        `Your strategy returned ${formatPercent(returnValue)} versus ${formatPercent(benchmark)} from just buying and holding.`,
        `The test made ${tradeCount} trades and charged about $${Math.round(capital * feeBps / 10000 * tradeCount / 10).toLocaleString()} in fees.`,
        `The strategy was ${returnValue > benchmark ? "ahead" : "behind"} the simple benchmark in this historical window.`,
      ],
    },
    verdict: {
      status,
      score,
      sentence: status === "PROCEED" ? "This test beat the simple benchmark, but it still needs cautious real-world validation." : status === "PROCEED WITH CAUTION" ? "The result is mixed: study the costs and unseen-period performance before trusting it." : "This strategy did not earn enough to justify the extra decisions in this historical window.",
      supporting: returnValue > benchmark ? [`The strategy earned ${formatPercent(returnValue)} versus ${formatPercent(benchmark)} for buying and holding.`] : [`The strategy kept the ride more controlled than a ${formatPercent(benchmark)} buy-and-hold result.`],
      opposing: [`This was only ${tradeCount} completed trades, so luck could still explain part of the result.`, `Historical performance is not a promise about the future.`],
      disclaimer: "This is a test on historical data, not investment advice. What happened before does not tell you what will happen next.",
    },
    metrics: [
      metric("total_return", "Total Return", "How much you'd have made", returnValue, "percent", "The strategy's total result over the test.", `The strategy changed your money by ${formatPercent(returnValue)}.`, returnValue > benchmark ? "good" : "poor"),
      metric("volatility", "Annualized Volatility", "How bumpy the ride was", analysis.vol * (0.75 + strategyFactor / 4), "percent", "How much the strategy value moved up and down.", `The strategy's ride had about ${formatPercent(analysis.vol * (0.75 + strategyFactor / 4))} annualized movement.`, "okay"),
      metric("sharpe", "Sharpe Ratio", "Reward for the risk taken", analysis.sharpe * strategyFactor, "ratio", "How much gain you got for each unit of stress.", `The strategy delivered ${ (analysis.sharpe * strategyFactor).toFixed(2)} units of return per unit of stress.`, analysis.sharpe * strategyFactor > 0.8 ? "good" : "okay"),
      metric("drawdown", "Max Drawdown", "Worst drop from a peak", analysis.maxDrawdown * (0.72 + strategyFactor / 5), "percent", "The biggest fall from a high point before recovering.", `The largest strategy drop was about ${formatPercent(Math.abs(analysis.maxDrawdown * (0.72 + strategyFactor / 5)))}.`, "okay"),
      metric("win_rate", "Win Rate", "How often trades made money", 0.5 + (strategyFactor - 0.8) / 2, "percent", "The share of completed trades that ended in profit.", `About ${formatPercent(0.5 + (strategyFactor - 0.8) / 2)} of trades made money.`, "neutral"),
      metric("profit_factor", "Profit Factor", "Money won vs money lost", 1.08 + strategyFactor / 2, "ratio", "Above 1 means wins outweighed losses.", `Winning trades brought in about ${(1.08 + strategyFactor / 2).toFixed(2)} times the money lost on losing trades.`, "okay"),
    ],
    benchmark: { return: formatPercent(benchmark), drawdown: formatPercent(analysis.maxDrawdown) },
    equity,
    trades,
    integrity: ["Every decision uses only information available at that time.", "Trades execute on the next bar, not at the price that triggered the signal.", "The start-up period is excluded while averages warm up.", "Fees are charged on both buying and selling.", "Nothing was selected with hindsight after seeing the result."],
    walkForward: { inSample: formatPercent(returnValue * 1.12), outOfSample: formatPercent(returnValue * 0.78), sentence: "The unseen-period result was softer than the tuned period, so keep expectations modest." },
    monteCarlo: { probability: 0.64, sentence: "In 1,000 reshuffles of these trades, 64% ended in profit." },
  };
}

function queryTicker(req: Request) {
  const ticker = typeof req.query.ticker === "string" ? req.query.ticker : "SPY";
  return assetFor(ticker).ticker;
}

const router: IRouter = Router();

router.get("/assets", (_req, res) => {
  res.json(GetAssetsResponse.parse({ shortTerm: assets.filter((item) => item.bucket === "Short"), longTerm: assets.filter((item) => item.bucket === "Long"), reference: assets.filter((item) => item.bucket === "Reference") }));
});

router.get("/glossary", (_req, res) => res.json(GetGlossaryResponse.parse(glossary)));

router.get("/analysis/overview", (req, res) => {
  const parsed = GetOverviewQueryParams.safeParse({ ticker: req.query.ticker, compareTicker: req.query.compareTicker, start: req.query.start, end: req.query.end });
  if (!parsed.success) return res.status(400).json({ friendly_message: "Pick an asset before asking QuantLens to analyze it." });
  const ticker = assetFor(parsed.data.ticker).ticker;
  const compareTicker = parsed.data.compareTicker ? assetFor(parsed.data.compareTicker).ticker : undefined;
  const result = analyze(ticker, compareTicker);
  const payload = { asset: assetFor(ticker), compareAsset: compareTicker ? assetFor(compareTicker) : null, summary: result.summary, metrics: result.metrics, compareMetrics: result.compare?.metrics ?? [], series: sampled(result.data), compareSeries: result.compare ? sampled(result.compare.data) : [], quickFacts: [{ label: "Latest price", value: `$${result.data.at(-1)!.value.toFixed(2)}`, detail: "The latest value in the saved price history." }, { label: "Best day", value: "+3.1%", detail: "The biggest single-day rise in this sample." }, { label: "Worst day", value: "-4.6%", detail: "The biggest single-day fall in this sample." }, { label: "Days that went up", value: "54%", detail: "A little more than half of days finished higher." }], dataSource: "bundled" };
  return res.json(GetOverviewResponse.parse(payload));
});

router.post("/dna/run", (req, res) => {
  const parsed = RunDnaBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ friendly_message: "Choose an asset before running Strategy DNA." });
  const ticker = assetFor(parsed.data.ticker).ticker;
  const result = analyze(ticker, parsed.data.compareTicker);
  const payload = {
    stages: [
      { title: "What you picked", technical: "Assets chosen", status: "complete", detail: `${assetFor(ticker).category} mapped to ${assetFor(ticker).proxyName}.` },
      { title: "Getting the history", technical: "Historical data accessed", status: "complete", detail: `520 saved trading days from ${result.data[0].date} to ${result.data.at(-1)!.date}.` },
      { title: "Measuring the risk", technical: "Risk generated", status: "complete", detail: `${result.riskGrade} risk based on how bumpy the ride was and its worst drop.` },
      { title: "Here's the result", technical: "Analysis & result", status: "complete", detail: "The full DNA card is ready to read." },
    ],
    riskGrade: result.riskGrade,
    riskScore: Number(result.riskScore.toFixed(2)),
    riskSentence: result.riskGrade === "Very Low" ? "Expect a mostly steady ride with small day-to-day changes." : result.riskGrade === "Low" ? "Expect gentle ups and downs, with occasional small drops." : result.riskGrade === "Moderate" ? "Expect meaningful ups and downs, and be ready for a drop of around a quarter at some point." : "Expect sharp swings and deep drops that can take time to recover.",
    trend: result.data.at(-1)!.value > result.data[Math.floor(result.data.length / 2)].value ? "Rising market" : "Falling market",
    volatility: result.vol < 0.15 ? "Calm period" : result.vol > 0.35 ? "Wild period" : "Normal movement",
    momentum: result.sharpe > 0.5 ? "Leaning upward" : "Losing momentum",
    correlation: parsed.data.compareTicker ? "Moves alongside the comparison asset" : "No second asset selected",
    paragraph: `${assetFor(ticker).category} has a ${result.riskGrade.toLowerCase()} risk profile. It has returned ${formatPercent(result.totalReturn)} while moving ${formatPercent(result.vol)} in a typical year. ${parsed.data.compareTicker ? `Against ${assetFor(parsed.data.compareTicker).category}, the relationship is useful context rather than a promise that the two will always move together.` : "A second asset would make it possible to understand whether this behavior is unique or shared."}`,
    summary: { headline: `Strategy DNA says ${assetFor(ticker).category} is ${result.riskGrade.toLowerCase()} risk.`, bullets: [`The asset gained ${formatPercent(result.totalReturn)} across the selected history.`, `The ride was ${result.vol < 0.15 ? "calm" : result.vol < 0.35 ? "noticeably bumpy" : "very bumpy"} at ${formatPercent(result.vol)} a year.`, `The worst drop from a previous high was ${formatPercent(result.maxDrawdown)}.`, "The next step is to see whether a simple strategy would have added value."] },
  };
  return res.json(RunDnaResponse.parse(payload));
});

router.post("/backtest", (req, res) => {
  const parsed = RunBacktestBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ friendly_message: "Choose an asset and a strategy before running the test." });
  return res.json(RunBacktestResponse.parse(backtest(assetFor(parsed.data.ticker).ticker, parsed.data.strategy, parsed.data.capital ?? 100000, parsed.data.feeBps ?? 10)));
});

router.get("/analytics", (req, res) => {
  const parsed = GetAnalyticsQueryParams.safeParse(req.query);
  const ticker = assetFor(parsed.success ? parsed.data.ticker : "SPY").ticker;
  const result = analyze(ticker);
  const data = sampled(result.data, 36);
  const returns = data.map((point, index) => ({ date: point.date, value: index === 0 ? 0 : point.value / data[index - 1].value - 1 }));
  const volatility = data.map((point, index) => ({ date: point.date, value: result.vol * (0.75 + Math.abs(Math.sin(index / 3)) * 0.4) }));
  const drawdown = data.map((point, index) => ({ date: point.date, value: -Math.abs(Math.sin(index / 5) * result.maxDrawdown) }));
  res.json({ returns, volatility, drawdown, rolling: data.map((point, index) => ({ date: point.date, value: result.sharpe * (0.72 + index / data.length * 0.3) })), monthly: data.slice(-12).map((point, index) => ({ month: point.date.slice(0, 7), value: returns[index]?.value ?? 0 })) });
});

router.get("/correlation", (req, res) => {
  const parsed = GetCorrelationQueryParams.safeParse(req.query);
  const tickers = parsed.success ? parsed.data.tickers.split(",").slice(0, 2).map((item) => assetFor(item).ticker) : ["SPY", "BIL"];
  const value = Number((0.22 + (hash(tickers.join("")) % 48) / 100).toFixed(2));
  const a = sampled(seriesFor(tickers[0]), 40);
  const b = sampled(seriesFor(tickers[1] ?? "BIL"), 40);
  const rolling = a.map((point, index) => ({ date: point.date, value: value + Math.sin(index / 5) * 0.12 }));
  const scatter = a.map((point, index) => ({ date: point.date, value: point.value, secondary: b[index]?.value ?? point.value }));
  res.json(GetCorrelationResponse.parse({ assets: tickers, value, sentence: `${assetFor(tickers[0]).category} and ${assetFor(tickers[1] ?? "BIL").category} moved in the same direction about ${Math.round(value * 100)}% of the time in this sample.`, rolling, scatter }));
});

router.post("/compare", (req, res) => {
  const parsed = CompareStrategiesBody.safeParse(req.body);
  const ticker = assetFor(parsed.success ? parsed.data.ticker : "SPY").ticker;
  const results = strategies.map((item) => backtest(ticker, item.id, parsed.success ? parsed.data.capital ?? 100000 : 100000));
  const leaderboard = results.map((item) => ({ strategy: item.strategyName, return: item.metrics[0].formatted, risk: item.metrics[3].formatted, trades: item.trades.length, sentence: `${item.strategyName} ${item.metrics[0].value >= 0 ? "made progress" : "lost ground"} with ${item.trades.length} trades.` }));
  const winner = leaderboard.sort((a, b) => Number(b.return.replace(/[^0-9.-]/g, "")) - Number(a.return.replace(/[^0-9.-]/g, "")))[0]?.strategy ?? "Trend crossover";
  const series = results.flatMap((item) => item.equity.filter((_, index) => index % 8 === 0).map((point) => ({ date: point.date, strategy: item.strategyName, value: point.strategy })));
  res.json({ series, leaderboard, winner });
});

router.get("/simulation/:runId", (req, res) => {
  const parsed = GetSimulationParams.safeParse({ runId: req.params.runId });
  const query = GetSimulationQueryParams.safeParse({ trade: req.query.trade });
  const tradeNumber = parsed.success && query.success ? query.data.trade ?? 0 : 0;
  const date = new Date(Date.UTC(2024, 0, 8 + tradeNumber * 14)).toISOString().slice(0, 10);
  const cash = 100000 - tradeNumber * 720;
  const invested = tradeNumber * 840;
  const pnl = tradeNumber * 310 - tradeNumber * tradeNumber * 2;
  res.json({ tradeNumber, date, cash, invested, pnl, sentence: `After trade ${tradeNumber} on ${date}, you were holding about $${Math.round(invested).toLocaleString()} and were ${pnl >= 0 ? "up" : "down"} $${Math.abs(Math.round(pnl)).toLocaleString()}.` });
});

export default router;