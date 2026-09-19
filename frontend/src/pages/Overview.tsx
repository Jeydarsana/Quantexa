import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, Zap, Info } from 'lucide-react';
import { useMode } from '../contexts/ModeContext';
import GlossaryTerm from '../components/GlossaryTerm';

export default function Overview() {
  const [summary, setSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isSimpleMode } = useMode();

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/market/summary');
        const data = await res.json();
        if (data.summary) {
          setSummary(data.summary);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Market Overview</h1>
          <p className="text-textMuted text-sm">Real-time macro dashboard and asset snapshot.</p>
        </div>
      </div>
      
      {isSimpleMode && (
        <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-4 text-sm text-textMuted flex items-start gap-3">
          <Info className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-white block mb-1">Welcome to QuantLens Simple Mode!</strong>
            The platform is currently running in <em>Jargon Free</em> mode. Complex financial metrics have been translated into plain English, and "What this means" guide panels will appear beneath charts to help you understand the data. To return to the standard quantitative layout, toggle the switch in the top right.
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {summary.map((asset, idx) => (
            <div key={idx} className="card hover:border-primary transition-colors cursor-pointer group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{asset.ticker}</h3>
                  <div className={`mt-2 inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                    asset.regime === 'Bullish' ? 'bg-secondary/20 text-secondary' :
                    asset.regime === 'Bearish' ? 'bg-danger/20 text-danger' :
                    'bg-gray-500/20 text-gray-300'
                  }`}>
                    {asset.regime === 'Bullish' && <TrendingUp className="w-3 h-3" />}
                    {asset.regime === 'Bearish' && <TrendingDown className="w-3 h-3" />}
                    {asset.regime === 'Sideways' && <Activity className="w-3 h-3" />}
                    <GlossaryTerm 
                      term={`${asset.regime} Regime`}
                      simpleLabel={asset.regime === 'Bullish' ? 'Uptrend' : asset.regime === 'Bearish' ? 'Downtrend' : 'Sideways Trend'}
                      definition="The current overarching mathematical direction of the asset."
                      isSimpleMode={isSimpleMode}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-white">${asset.price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                  <p className={`text-sm font-semibold flex items-center justify-end gap-1 ${asset.change >= 0 ? 'text-secondary' : 'text-danger'}`}>
                    {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          ))}
          {summary.length === 0 && (
            <div className="col-span-3 text-center text-textMuted p-10 bg-surface rounded-xl">
              Unable to load market data.
            </div>
          )}
        </div>
      )}

      {/* Hero section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="card bg-gradient-to-br from-surface to-background border-primary/30">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <Zap className="text-accent w-5 h-5" />
            QuantLens Intelligence
          </h2>
          <p className="text-textMuted mb-6 text-sm leading-relaxed">
            Welcome to QuantLens. This platform fuses institutional-grade quantitative algorithms with AI-driven insights to analyze cross-asset correlations, detect market regimes, and backtest sophisticated trading strategies.
          </p>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center p-3 bg-background rounded-lg">
              <span className="text-textMuted">Active Algorithms</span>
              <span className="text-white font-semibold">SMA, EMA, Momentum, Mean Reversion</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-background rounded-lg">
              <span className="text-textMuted">AI Failover Engine</span>
              <span className="text-secondary font-semibold">Online (Gemini/Groq)</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-background rounded-lg">
              <span className="text-textMuted">Monte Carlo Robustness</span>
              <span className="text-accent font-semibold">Ready</span>
            </div>
          </div>
        </div>
        
        <div className="card flex items-center justify-center flex-col text-center border-dashed border-2 border-border bg-transparent">
          <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mb-4">
            <Activity className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Explore the Platform</h3>
          <p className="text-textMuted text-sm max-w-sm">
            Navigate through the tabs above to analyze raw market data, discover hidden correlations, backtest your ideas, or ask the AI Chief Investment Officer for a macro summary.
          </p>
        </div>
      </div>
    </div>
  );
}
