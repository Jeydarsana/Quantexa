export interface AssetOption {
  ticker: string;
  name: string;
  category: 'Equities' | 'Crypto' | 'Commodities' | 'Indices/ETFs' | 'Custom';
  icon: string;
  description: string;
  basePrice?: number;
  volatility?: number;
  trendDrift?: number;
}

export const ALL_ASSETS: AssetOption[] = [
  { ticker: 'NVDA', name: 'NVIDIA Corp.', category: 'Equities', icon: '💻', description: 'Semiconductors & AI Megacap', basePrice: 124.5 },
  { ticker: 'AMZN', name: 'Amazon.com, Inc.', category: 'Equities', icon: '📦', description: 'E-Commerce & AWS Cloud Computing', basePrice: 186.5 },
  { ticker: 'AAPL', name: 'Apple Inc.', category: 'Equities', icon: '📱', description: 'Consumer Tech & Services Ecosystem', basePrice: 182.0 },
  { ticker: 'MSFT', name: 'Microsoft Corp.', category: 'Equities', icon: '☁️', description: 'Enterprise Cloud & AI Software', basePrice: 415.0 },
  { ticker: 'GOOGL', name: 'Alphabet Inc.', category: 'Equities', icon: '🔍', description: 'Search, Advertising & Cloud Intelligence', basePrice: 176.0 },
  { ticker: 'META', name: 'Meta Platforms Inc.', category: 'Equities', icon: '🌐', description: 'Social Media & Open-Source AI', basePrice: 512.0 },
  { ticker: 'TSLA', name: 'Tesla, Inc.', category: 'Equities', icon: '⚡', description: 'Electric Vehicles & Clean Energy', basePrice: 238.0 },
  { ticker: 'AMD', name: 'Advanced Micro Devices', category: 'Equities', icon: '⚙️', description: 'Data Center Accelerators & Microprocessors', basePrice: 154.0 },
  { ticker: 'NFLX', name: 'Netflix Inc.', category: 'Equities', icon: '🎬', description: 'Global Digital Streaming Entertainment', basePrice: 635.0 },
  { ticker: 'BTC', name: 'Bitcoin (USD)', category: 'Crypto', icon: '₿', description: 'Leading Digital Asset & Store of Value', basePrice: 63500.0 },
  { ticker: 'ETH', name: 'Ethereum (USD)', category: 'Crypto', icon: 'Ξ', description: 'Decentralized Smart Contract Platform', basePrice: 3250.0 },
  { ticker: 'SOL', name: 'Solana (USD)', category: 'Crypto', icon: '☀️', description: 'High-Throughput Layer 1 Blockchain', basePrice: 148.0 },
  { ticker: 'GOLD', name: 'Gold Futures', category: 'Commodities', icon: '🥇', description: 'Precious Metals & Macro Inflation Hedge', basePrice: 2340.0 },
  { ticker: 'SILVER', name: 'Silver Futures', category: 'Commodities', icon: '🥈', description: 'Precious & Industrial Metal Commodity', basePrice: 29.2 },
  { ticker: 'OIL', name: 'Crude Oil', category: 'Commodities', icon: '🛢️', description: 'Global Fossil Fuel & Energy Benchmark', basePrice: 79.5 },
  { ticker: 'SPY', name: 'S&P 500 ETF Trust', category: 'Indices/ETFs', icon: '📈', description: 'US Large-Cap Core Benchmark ETF', basePrice: 522.0 },
  { ticker: 'QQQ', name: 'Invesco QQQ Trust', category: 'Indices/ETFs', icon: '📊', description: 'Nasdaq 100 Tech Megacap Benchmark ETF', basePrice: 462.0 },
];

export function getAssetMeta(ticker: string): AssetOption {
  const norm = (ticker || 'NVDA').trim().toUpperCase();
  const matched = ALL_ASSETS.find(a => a.ticker.toUpperCase() === norm);
  if (matched) return matched;
  return {
    ticker: norm,
    name: `${norm} Security`,
    category: 'Custom',
    icon: '📊',
    description: `Custom ticker symbol: ${norm}`,
    basePrice: 150.0
  };
}
