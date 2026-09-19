import React, { useState } from 'react';
import { Shield, Play } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useMode } from '../contexts/ModeContext';
import GlossaryTerm from '../components/GlossaryTerm';
import AssetSelector from '../components/AssetSelector';

export default function Robustness() {
  const [ticker, setTicker] = useState('NVDA');
  const [strategy, setStrategy] = useState('SMA_Crossover');
  const [startDate, setStartDate] = useState('2020-01-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const { isSimpleMode } = useMode();
  
  const [distribution, setDistribution] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [xAxis, setXAxis] = useState<number[]>([]);
  const [yAxis, setYAxis] = useState<number[]>([]);
  const [sweepAnalysis, setSweepAnalysis] = useState<any>(null);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const [mcRes, sweepRes] = await Promise.all([
        fetch(`http://localhost:8000/api/robustness`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticker, start_date: startDate, end_date: endDate, strategy, params: {} })
        }),
        fetch(`http://localhost:8000/api/robustness/sweep`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticker, start_date: startDate, end_date: endDate, strategy })
        })
      ]);
      
      const data = await mcRes.json();
      const sweepData = await sweepRes.json();
      if (data.iterations) {
        // Bin the returns into a histogram
        const returns = data.iterations.map((i: any) => i.return * 100);
        returns.sort((a: number, b: number) => a - b);
        
        const min = returns[0];
        const max = returns[returns.length - 1];
        const range = max - min;
        const numBins = 20;
        const binSize = range / numBins;
        
        const bins = Array(numBins).fill(0).map((_, i) => ({
          bin: (min + i * binSize).toFixed(1) + '%',
          count: 0
        }));
        
        returns.forEach((r: number) => {
          let binIdx = Math.floor((r - min) / binSize);
          if (binIdx >= numBins) binIdx = numBins - 1;
          bins[binIdx].count++;
        });
        
        setDistribution(bins);
        
        setStats({
          mean: (returns.reduce((a: number, b: number) => a + b, 0) / returns.length).toFixed(2),
          worst: min.toFixed(2),
          best: max.toFixed(2),
          p5: returns[Math.floor(returns.length * 0.05)].toFixed(2),
          p95: returns[Math.floor(returns.length * 0.95)].toFixed(2)
        });
      }
      
      if (sweepData.heatmap) {
        setHeatmapData(sweepData.heatmap);
        setXAxis(sweepData.xAxis);
        setYAxis(sweepData.yAxis);
        setSweepAnalysis(sweepData.analysis);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <Shield className="text-accent" />
            Robustness Testing
          </h1>
          <p className="text-textMuted text-sm">Monte Carlo simulation testing strategy survival against random market noise.</p>
        </div>
      </div>

      <div className="card grid grid-cols-1 md:grid-cols-5 gap-4 items-end relative z-20">
        <AssetSelector 
          value={ticker} 
          onChange={setTicker} 
          label="Asset" 
          compact 
        />
        <div>
          <label className="block text-sm font-medium text-textMuted mb-1">Strategy</label>
          <select value={strategy} onChange={(e) => setStrategy(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white outline-none">
            <option value="SMA_Crossover">SMA Crossover</option>
            <option value="EMA_Trend">EMA Trend</option>
            <option value="Momentum">Momentum</option>
            <option value="Mean_Reversion">Mean Reversion</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-textMuted mb-1">Start Date</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-textMuted mb-1">End Date</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white outline-none" />
        </div>
        <div>
          <button onClick={runSimulation} disabled={loading} className="w-full bg-primary hover:bg-primaryHover text-white font-medium py-2 px-4 rounded-lg flex justify-center items-center h-[42px] gap-2">
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><Play className="w-4 h-4" /> Run Robustness Tests</>}
          </button>
        </div>
      </div>

      {stats && (
        <>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card lg:col-span-2">
            <h3 className="text-lg font-bold mb-4">Simulated Return Distribution (50 Iterations)</h3>
            
            {isSimpleMode && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4 text-sm text-textMuted leading-relaxed">
                <strong className="text-white">What this means:</strong> We took your strategy and ran it 50 times against historical data, but purposefully injected random market chaos (slippage, price shocks) each time. The bars below show where your returns are most likely to land in the real world.
              </div>
            )}
            
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="bin" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                  <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                  <Bar dataKey="count" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center text-xs text-textMuted mt-4">Gaussian noise injected into close prices simulating real-world slippage.</p>
          </div>
          
          <div className="card space-y-4 flex flex-col justify-center">
            <h3 className="text-lg font-bold mb-2 border-b border-border pb-2">Survival Metrics</h3>
            <div className="flex justify-between items-center">
              <span className="text-textMuted">Expected Mean Return</span>
              <span className="font-bold text-white">{stats.mean}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-textMuted">
                <GlossaryTerm 
                  term="5th Percentile (P5)" 
                  simpleLabel="Worst Expected Outcome"
                  definition="If 95% of the time things go okay, this is what happens in the bottom 5% unlucky scenarios."
                  isSimpleMode={isSimpleMode}
                />
              </span>
              <span className="font-bold text-danger">{stats.p5}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-textMuted">
                <GlossaryTerm 
                  term="95th Percentile (P95)" 
                  simpleLabel="Best Expected Outcome"
                  definition="The optimistic scenario where your strategy avoids most market shocks."
                  isSimpleMode={isSimpleMode}
                />
              </span>
              <span className="font-bold text-secondary">{stats.p95}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-textMuted">Absolute Worst Case</span>
              <span className="font-bold text-gray-500">{stats.worst}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-textMuted">Absolute Best Case</span>
              <span className="font-bold text-gray-500">{stats.best}%</span>
            </div>
          </div>
        </div>
        
        {/* Parameter Sweep Heatmap */}
        {sweepAnalysis && (
          <div className="card mt-6">
            <h3 className="text-lg font-bold mb-4">2D Parameter Sweep Heatmap</h3>
            {isSimpleMode && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4 text-sm text-textMuted leading-relaxed flex gap-2 items-start">
                <Shield className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">What this means:</strong> We tested this strategy across dozens of different parameter combinations (like 10-day vs 50-day windows). 
                  If you see one isolated bright green square surrounded by red, it means the strategy was just "lucky" on that specific setting and will likely fail in real life. 
                  A mathematically robust strategy has a large "stable plateau" of green squares.
                </div>
              </div>
            )}
            
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <div className="grid gap-1" style={{ gridTemplateColumns: `auto repeat(${xAxis.length}, minmax(0, 1fr))` }}>
                  {/* Top Header Row (X Axis) */}
                  <div className="text-center font-bold text-textMuted text-xs p-2">Param 1 \ Param 2</div>
                  {xAxis.map(x => <div key={`hx-${x}`} className="text-center font-bold text-textMuted text-xs p-2">{x}</div>)}
                  
                  {/* Data Rows */}
                  {yAxis.map(y => (
                    <React.Fragment key={`row-${y}`}>
                      <div className="text-right font-bold text-textMuted text-xs p-2 flex items-center justify-end pr-4">{y}</div>
                      {xAxis.map(x => {
                        const cell = heatmapData.find(d => d.p1 === y && d.p2 === x);
                        if (!cell || cell.sharpe === null) {
                          return <div key={`cell-${y}-${x}`} className="bg-surfaceHover/50 rounded-sm"></div>;
                        }
                        const val = cell.sharpe;
                        // Color scaling: red (-1) to green (2)
                        const isPositive = val > 0;
                        const intensity = Math.min(Math.abs(val) / 2, 1);
                        const bgColor = isPositive ? `rgba(16, 185, 129, ${intensity})` : `rgba(239, 68, 68, ${intensity})`;
                        
                        return (
                          <div 
                            key={`cell-${y}-${x}`} 
                            className="p-3 text-center rounded-sm text-white font-medium text-xs border border-white/5" 
                            style={{ backgroundColor: bgColor }}
                            title={`Sharpe: ${val.toFixed(2)}`}
                          >
                            {val.toFixed(2)}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
              
              <div className="w-full md:w-64 bg-surfaceHover border border-border rounded-lg p-5 flex flex-col justify-center">
                <h4 className="text-sm font-bold text-textMuted mb-2 uppercase tracking-wider">Quantitative Verdict</h4>
                <p className={`text-xl font-bold mb-4 ${sweepAnalysis.isolated_peak ? 'text-danger' : 'text-secondary'}`}>
                  {sweepAnalysis.verdict}
                </p>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-textMuted">Isolated Peak</span>
                    <span className="font-medium text-white">{sweepAnalysis.isolated_peak ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-textMuted">Neighborhood Avg Sharpe</span>
                    <span className="font-medium text-white">{sweepAnalysis.stable_choice.neighbourhood_median.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-textMuted">Trials Run</span>
                    <span className="font-medium text-white">{sweepAnalysis.n_trials}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        </>
      )}
    </div>
  );
}
