import { useState, useEffect } from 'react';
import { Activity, Zap, Info, BarChart3, Globe, ChevronRight } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, YAxis } from 'recharts';
import { useMode } from '../contexts/ModeContext';
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
    <div className="space-y-6 animate-fade-in -mt-4">
      
      {/* 1. Market Marquee (Ticker Tape) */}
      <div className="w-full bg-surface/30 border-b border-border/50 py-3 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 overflow-hidden relative">
        {loading ? (
          <div className="flex gap-4 animate-pulse">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-8 w-32 bg-border/50 rounded"></div>)}
          </div>
        ) : (
          <div className="flex items-center gap-6 overflow-x-auto hide-scrollbar whitespace-nowrap">
            {summary.map((asset, idx) => {
              const match = asset.ticker.match(/(.+) \((.+)\)/);
              const symbol = match ? match[2] : asset.ticker;
              
              return (
                <div key={idx} className="flex items-center gap-3 pr-6 border-r border-border/40 last:border-0 min-w-max cursor-pointer group">
                  <div className="flex flex-col">
                    <span className="text-[11px] text-textMuted font-bold uppercase tracking-wider">{symbol}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">${asset.price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                      <span className={`text-[11px] font-bold ${asset.change >= 0 ? 'text-secondary' : 'text-danger'}`}>
                        {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  {asset.sparkline && asset.sparkline.length > 0 && (
                    <div className="h-6 w-16 opacity-60 group-hover:opacity-100 transition-opacity">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={asset.sparkline.map((val: number, i: number) => ({ val, index: i }))}>
                          <YAxis domain={['auto', 'auto']} hide />
                          <Line type="monotone" dataKey="val" stroke={asset.change >= 0 ? '#10B981' : '#EF4444'} dot={false} strokeWidth={1.5} isAnimationActive={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isSimpleMode && (
        <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-4 text-sm text-textMuted flex items-start gap-3 mt-4">
          <Info className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-white block mb-1">Welcome to QuantLens Simple Mode!</strong>
            The platform is currently running in <em>Jargon Free</em> mode. Complex financial metrics have been translated into plain English. To return to the standard quantitative layout, toggle the switch in the top right.
          </div>
        </div>
      )}

      {/* 2. Main Body Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        
        {/* Left Column (Main Features) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card bg-gradient-to-br from-surface to-background border-primary/30 relative overflow-hidden group min-h-[360px] flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20 transition-transform duration-1000 group-hover:scale-150"></div>
            
            <div>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2 relative z-10">
                <Zap className="text-accent w-6 h-6" />
                QuantLens Intelligence Engine
              </h2>
              <p className="text-textMuted mb-8 text-base leading-relaxed max-w-xl relative z-10">
                This platform fuses institutional-grade quantitative algorithms with local AI-driven insights. Discover hidden correlations, detect market regimes, and backtest sophisticated trading strategies completely privately on your device.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm relative z-10">
              <div className="p-4 bg-background/60 backdrop-blur-md rounded-xl border border-border">
                <div className="text-textMuted mb-1 text-xs uppercase tracking-wider font-semibold">Active Algorithms</div>
                <div className="text-white font-semibold text-sm">SMA, EMA, Momentum</div>
              </div>
              <div className="p-4 bg-background/60 backdrop-blur-md rounded-xl border border-border">
                <div className="text-textMuted mb-1 text-xs uppercase tracking-wider font-semibold">Local AI Engine</div>
                <div className="text-secondary font-semibold text-sm flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-secondary animate-pulse"></div>
                  Ollama Qwen
                </div>
              </div>
              <div className="p-4 bg-background/60 backdrop-blur-md rounded-xl border border-border">
                <div className="text-textMuted mb-1 text-xs uppercase tracking-wider font-semibold">Monte Carlo Engine</div>
                <div className="text-accent font-semibold text-sm">Ready</div>
              </div>
            </div>
          </div>
          
          <div className="card flex flex-col sm:flex-row items-start sm:items-center justify-between border border-border bg-surface/50 group hover:border-secondary/50 transition-colors gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl flex-shrink-0 bg-gradient-to-br from-surface to-background border border-border flex items-center justify-center shadow-lg group-hover:shadow-secondary/20 transition-all">
                <Globe className="w-7 h-7 text-secondary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Macro Market Report</h3>
                <p className="text-textMuted text-sm">
                  Generate a comprehensive global macroeconomic summary using the local AI engine.
                </p>
              </div>
            </div>
            <Link to="/intelligence" className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap self-stretch sm:self-auto justify-center">
              <BarChart3 className="w-4 h-4" />
              Open Intelligence
            </Link>
          </div>
        </div>
        
        {/* Right Column (Trending Tickers Sidebar) */}
        <div className="lg:col-span-1">
          <div className="card bg-surface/30 p-0 overflow-hidden h-full flex flex-col">
            <div className="p-4 border-b border-border/50 bg-surface/50 flex-shrink-0">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Trending Watchlist
              </h3>
            </div>
            <div className="divide-y divide-border/30 overflow-y-auto flex-1 hide-scrollbar">
              {loading ? (
                <div className="p-8 text-center text-textMuted text-sm animate-pulse">Loading market data...</div>
              ) : summary.length === 0 ? (
                <div className="p-8 text-center text-textMuted text-sm">No assets available.</div>
              ) : (
                summary.slice(0, 8).map((asset, idx) => {
                  const match = asset.ticker.match(/(.+) \((.+)\)/);
                  const name = match ? match[1] : asset.ticker;
                  const symbol = match ? match[2] : asset.ticker;
                  
                  return (
                    <div key={idx} className="p-4 hover:bg-surface/50 transition-colors cursor-pointer group flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-bold text-white text-sm">{symbol}</div>
                        <div className="text-xs text-textMuted mt-0.5 max-w-[90px] xl:max-w-[120px] truncate" title={name}>{name}</div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {asset.sparkline && asset.sparkline.length > 0 && (
                          <div className="h-8 w-14 opacity-50 group-hover:opacity-100 transition-opacity hidden sm:block">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={asset.sparkline.map((val: number, i: number) => ({ val, index: i }))}>
                                <YAxis domain={['auto', 'auto']} hide />
                                <Line type="monotone" dataKey="val" stroke={asset.change >= 0 ? '#10B981' : '#EF4444'} dot={false} strokeWidth={1.5} isAnimationActive={false} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                        
                        <div className="text-right w-20">
                          <div className="font-semibold text-white text-sm">${asset.price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                          <div className={`text-[11px] font-bold mt-0.5 ${asset.change >= 0 ? 'text-secondary' : 'text-danger'}`}>
                            {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}%
                          </div>
                        </div>
                        
                        <ChevronRight className="w-4 h-4 text-textMuted group-hover:text-white transition-colors flex-shrink-0" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            {/* View All Button */}
            {!loading && summary.length > 0 && (
              <div className="p-3 border-t border-border/50 bg-surface/50 text-center flex-shrink-0">
                <Link to="/market-analysis" className="text-xs font-semibold text-primary hover:text-white transition-colors">
                  View Full Market Analysis &rarr;
                </Link>
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}
