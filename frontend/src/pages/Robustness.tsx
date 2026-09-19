import { useState } from 'react';
import { Shield, Play } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import AssetSelector from '../components/AssetSelector';

export default function Robustness() {
  const [ticker, setTicker] = useState('NVDA');
  const [strategy, setStrategy] = useState('SMA_Crossover');
  const [startDate, setStartDate] = useState('2020-01-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  
  const [distribution, setDistribution] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/robustness`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker, start_date: startDate, end_date: endDate, strategy, params: {} })
      });
      const data = await res.json();
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
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><Play className="w-4 h-4" /> Run Monte Carlo</>}
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card lg:col-span-2">
            <h3 className="text-lg font-bold mb-4">Simulated Return Distribution (50 Iterations)</h3>
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
              <span className="text-textMuted">5th Percentile (P5)</span>
              <span className="font-bold text-danger">{stats.p5}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-textMuted">95th Percentile (P95)</span>
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
      )}
    </div>
  );
}
