import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, Zap, Info, BarChart3, Globe } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, YAxis } from 'recharts';
import { useMode } from '../contexts/ModeContext';
import GlossaryTerm from '../components/GlossaryTerm';
import { Link } from 'react-router-dom';

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
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500 mb-2">Command Center</h1>
          <p className="text-textMuted text-sm">Real-time macro dashboard and cross-asset snapshot.</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {summary.map((asset, idx) => (
            <div key={idx} className="card bg-surface/40 backdrop-blur-sm hover:bg-surface/80 hover:border-primary/50 transition-all duration-300 cursor-pointer group flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">{asset.ticker}</h3>
                  <div className={`mt-2 inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full ${
                    asset.regime === 'Bullish' ? 'bg-secondary/10 text-secondary border border-secondary/20' :
                    asset.regime === 'Bearish' ? 'bg-danger/10 text-danger border border-danger/20' :
                    'bg-gray-500/10 text-gray-300 border border-gray-500/20'
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
                  <p className="text-xl font-bold text-white tracking-tight">${asset.price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                  <p className={`text-sm font-semibold flex items-center justify-end gap-1 ${asset.change >= 0 ? 'text-secondary drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'text-danger drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}>
                    {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}%
                  </p>
                </div>
              </div>
              
              {/* Sparkline Chart */}
              {asset.sparkline && asset.sparkline.length > 0 && (
                <div className="h-12 w-full mt-2 opacity-70 group-hover:opacity-100 transition-opacity">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={asset.sparkline.map((val: number, i: number) => ({ val, index: i }))}>
                      <YAxis domain={['auto', 'auto']} hide />
                      <Line 
                        type="monotone" 
                        dataKey="val" 
                        stroke={asset.change >= 0 ? '#10B981' : '#EF4444'} 
                        dot={false} 
                        strokeWidth={2} 
                        isAnimationActive={false} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          ))}
          {summary.length === 0 && (
            <div className="col-span-full text-center text-textMuted p-10 bg-surface rounded-xl border border-border">
              <Activity className="w-8 h-8 opacity-20 mx-auto mb-3" />
              Unable to load market data. Ensure backend is running.
            </div>
          )}
        </div>
      )}

      {/* Hero section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 card bg-gradient-to-br from-surface to-background border-primary/30 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 transition-transform duration-1000 group-hover:scale-150"></div>
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2 relative z-10">
            <Zap className="text-accent w-5 h-5" />
            QuantLens Intelligence Engine
          </h2>
          <p className="text-textMuted mb-6 text-sm leading-relaxed max-w-xl relative z-10">
            This platform fuses institutional-grade quantitative algorithms with local AI-driven insights to analyze cross-asset correlations, detect market regimes, and backtest sophisticated trading strategies completely privately on your device.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm relative z-10">
            <div className="p-4 bg-background/50 rounded-xl border border-border">
              <div className="text-textMuted mb-1 text-xs uppercase tracking-wider font-semibold">Active Algorithms</div>
              <div className="text-white font-semibold">SMA, EMA, Momentum</div>
            </div>
            <div className="p-4 bg-background/50 rounded-xl border border-border">
              <div className="text-textMuted mb-1 text-xs uppercase tracking-wider font-semibold">Local AI Engine</div>
              <div className="text-secondary font-semibold flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></div>
                Ollama Qwen
              </div>
            </div>
            <div className="p-4 bg-background/50 rounded-xl border border-border">
              <div className="text-textMuted mb-1 text-xs uppercase tracking-wider font-semibold">Monte Carlo Engine</div>
              <div className="text-accent font-semibold">Ready</div>
            </div>
          </div>
        </div>
        
        <div className="card flex flex-col justify-between border border-border bg-surface/50 relative overflow-hidden">
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-secondary/5 rounded-full blur-2xl"></div>
          <div>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-surface to-background border border-border flex items-center justify-center mb-4 shadow-lg">
              <Globe className="w-6 h-6 text-secondary" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Macro Market Report</h3>
            <p className="text-textMuted text-sm mb-6">
              Generate a comprehensive global macroeconomic summary using the local AI engine.
            </p>
          </div>
          <Link to="/intelligence" className="w-full py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-lg transition-colors flex justify-center items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Open Intelligence
          </Link>
        </div>
      </div>
    </div>
  );
}
