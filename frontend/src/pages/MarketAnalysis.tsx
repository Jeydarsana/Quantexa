import { useState, useEffect } from 'react';
import { Activity, TrendingUp, AlertTriangle, BarChart2, HelpCircle } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useMode } from '../contexts/ModeContext';
import GlossaryTerm from '../components/GlossaryTerm';
import AssetSelector from '../components/AssetSelector';

export default function MarketAnalysis() {
  const [ticker, setTicker] = useState('NVDA');
  const [startDate, setStartDate] = useState('2020-01-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const { isSimpleMode } = useMode();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/analysis/market/${ticker}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker, start_date: startDate, end_date: endDate })
      });
      const data = await res.json();
      if (data.metrics) {
        setMetrics(data.metrics);
        setChartData(data.chart_data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [ticker]);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="card grid grid-cols-1 md:grid-cols-4 gap-4 items-end relative z-20">
        <AssetSelector 
          value={ticker} 
          onChange={setTicker} 
          label="Asset" 
          compact 
        />
        <div>
          <label className="block text-sm font-medium text-textMuted mb-1">Start Date</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-textMuted mb-1">End Date</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white outline-none" />
        </div>
        <div>
          <button 
            onClick={fetchData} 
            disabled={loading}
            className="w-full bg-primary hover:bg-primaryHover text-white font-medium py-2 px-4 rounded-lg transition-colors flex justify-center items-center h-[42px]"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Analyze'}
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard title="Annual Volatility" value={metrics ? `${(metrics.annualized_volatility * 100).toFixed(2)}%` : '--'} icon={<Activity className="text-secondary" />} isSimpleMode={isSimpleMode} />
        <MetricCard title="Sharpe Ratio (RF=2%)" value={metrics ? metrics.sharpe_ratio.toFixed(2) : '--'} icon={<TrendingUp className="text-primary" />} isSimpleMode={isSimpleMode} />
        <MetricCard title="Max Drawdown" value={metrics ? `${(metrics.max_drawdown * 100).toFixed(2)}%` : '--'} icon={<AlertTriangle className="text-danger" />} isSimpleMode={isSimpleMode} />
        <MetricCard title="Total Return" value={metrics ? `${(metrics.total_return * 100).toFixed(2)}%` : '--'} icon={<BarChart2 className="text-white" />} isSimpleMode={isSimpleMode} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Price & Moving Averages</h2>
          
          {isSimpleMode && chartData.length > 0 && (
            <div className="bg-surfaceHover border border-border rounded-lg p-3 mb-4 text-sm text-textMuted flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-accent flex-shrink-0" />
              <span><strong>What this means:</strong> The chart displays the asset's price alongside a Short-Term and Long-Term moving average. When the fast line crosses above the slow line, it's often a signal that momentum is shifting upwards.</span>
            </div>
          )}
          
          <div className="w-full" style={{ height: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="Date" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} minTickGap={50} />
                <YAxis domain={['auto', 'auto']} stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '0.5rem' }} />
                <Legend />
                <Line type="monotone" dataKey="Close" stroke="#6366F1" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="SMA_Short" name="SMA (20)" stroke="#10B981" dot={false} strokeWidth={1.5} opacity={0.8} />
                <Line type="monotone" dataKey="SMA_Long" name="SMA (50)" stroke="#F59E0B" dot={false} strokeWidth={1.5} opacity={0.8} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Rolling Returns (30d)</h2>
          <div className="w-full" style={{ height: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="Date" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} minTickGap={50} />
                <YAxis domain={['auto', 'auto']} stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(val) => `${(val * 100).toFixed(0)}%`} />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '0.5rem' }} formatter={(val: any) => `${(Number(val) * 100).toFixed(2)}%`} />
                <Line type="monotone" dataKey="Rolling_Return" stroke="#EC4899" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, isSimpleMode = false }: { title: string, value: string, icon: React.ReactNode, isSimpleMode?: boolean }) {
  const getSimpleLabel = (t: string) => {
    switch (t) {
      case 'Annual Volatility': return 'Price Swings';
      case 'Sharpe Ratio (RF=2%)': return 'Risk-Adjusted Score';
      case 'Max Drawdown': return 'Worst Case Drop';
      case 'Total Return': return 'Total Profit';
      default: return t;
    }
  };

  const getDef = (t: string) => {
    switch (t) {
      case 'Annual Volatility': return 'How violently the price swings up and down over a year.';
      case 'Sharpe Ratio (RF=2%)': return 'Measures return compared to the risk taken. Above 1.0 is good, below 0 is bad.';
      case 'Max Drawdown': return 'The biggest single drop from a high point to a low point.';
      case 'Total Return': return 'The total percentage of money made (or lost).';
      default: return '';
    }
  };

  return (
    <div className="card flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <p className="text-sm font-medium text-textMuted">
          <GlossaryTerm 
            term={title}
            simpleLabel={getSimpleLabel(title)}
            definition={getDef(title)}
            isSimpleMode={isSimpleMode}
          />
        </p>
        {icon}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
