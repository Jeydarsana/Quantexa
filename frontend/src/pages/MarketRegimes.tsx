import { useState, useEffect } from 'react';
import { Activity, AlertTriangle, Compass } from 'lucide-react';
import { ResponsiveContainer, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ComposedChart } from 'recharts';
import AssetSelector from '../components/AssetSelector';

export default function MarketRegimes() {
  const [ticker, setTicker] = useState('NVDA');
  const [startDate, setStartDate] = useState('2020-01-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  
  const [chartData, setChartData] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/intelligence/regimes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker, start_date: startDate, end_date: endDate })
      });
      const data = await res.json();
      if (data.chart_data) {
        setChartData(data.chart_data);
        setAnomalies(data.anomalies || []);
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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-surface border border-border p-3 rounded-lg shadow-xl">
          <p className="text-textMuted text-xs mb-1">{label}</p>
          <p className="font-bold text-white mb-2">${data.Close?.toFixed(2)}</p>
          <div className="space-y-1">
            <p className="text-xs">
              <span className="text-textMuted">Regime: </span>
              <span className={`font-semibold ${data.Regime === 'Bullish' ? 'text-secondary' : data.Regime === 'Bearish' ? 'text-danger' : 'text-gray-400'}`}>
                {data.Regime}
              </span>
            </p>
            <p className="text-xs">
              <span className="text-textMuted">Z-Score: </span>
              <span className={`font-semibold ${Math.abs(data.Z_Score) > 3 ? 'text-accent' : 'text-white'}`}>
                {data.Z_Score?.toFixed(2)}
              </span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

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
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Analyze Regimes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Price & Regime Chart */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Compass className="text-secondary w-5 h-5" />
              Market Regime Analysis
            </h2>
            <div className="w-full" style={{ height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="Date" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} minTickGap={50} />
                  <YAxis domain={['auto', 'auto']} stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="Close" stroke="#6366F1" dot={false} strokeWidth={2} />
                  {/* We can use a bar on a secondary Y axis to show the regime if we wanted, but tooltip is cleaner */}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-4 mt-4 text-xs text-textMuted justify-center">
              <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-secondary"></div> Bullish</span>
              <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-danger"></div> Bearish</span>
              <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-gray-400"></div> Sideways</span>
              <span className="ml-2 italic">(Hover over chart to view daily regime)</span>
            </div>
          </div>

          {/* Volatility Anomalies Chart */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="text-accent w-5 h-5" />
              Volatility Anomalies (Z-Score)
            </h2>
            <div className="w-full" style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="Date" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} minTickGap={50} />
                  <YAxis domain={[-5, 5]} stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '0.5rem' }} />
                  <Bar 
                    dataKey="Z_Score" 
                    fill="#F59E0B"
                    shape={(props: any) => {
                      const { x, y, width, height, payload } = props;
                      const fill = payload.Is_Anomaly ? '#F59E0B' : '#4B5563';
                      return <rect x={x} y={y} width={width} height={height} fill={fill} />;
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Anomalies Table */}
        <div className="card lg:col-span-1 flex flex-col max-h-[700px]">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="text-danger w-5 h-5" />
            Structural Shocks
          </h2>
          <p className="text-xs text-textMuted mb-4">
            Detected {anomalies.length} extreme volatility events (&gt;3 std dev). These often precede regime shifts.
          </p>
          <div className="overflow-y-auto flex-1 pr-2">
            <div className="space-y-3">
              {anomalies.map((anomaly, idx) => (
                <div key={idx} className="p-3 bg-surface border border-border rounded-lg flex justify-between items-center">
                  <div>
                    <p className="text-sm font-semibold text-white">{anomaly.date}</p>
                    <p className="text-xs text-textMuted">Price: ${anomaly.price.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${anomaly.z_score > 0 ? 'text-secondary' : 'text-danger'}`}>
                      {anomaly.z_score > 0 ? '+' : ''}{anomaly.z_score.toFixed(2)}z
                    </p>
                    <p className="text-[10px] text-textMuted uppercase tracking-wider">Shock</p>
                  </div>
                </div>
              ))}
              {anomalies.length === 0 && !loading && (
                <div className="text-center p-6 text-textMuted text-sm">
                  No structural anomalies detected in this timeframe.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
