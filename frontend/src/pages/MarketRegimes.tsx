import { useState, useEffect } from 'react';
import { Activity, AlertTriangle, Layers, HelpCircle, Compass } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ComposedChart, Line } from 'recharts';
import { useMode } from '../contexts/ModeContext';
import GlossaryTerm from '../components/GlossaryTerm';
import AssetSelector from '../components/AssetSelector';

export default function MarketRegimes() {
  const [ticker, setTicker] = useState('NVDA');
  const [startDate, setStartDate] = useState('2020-01-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  
  const [data, setData] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const { isSimpleMode } = useMode();

  const fetchRegimes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/intelligence/regimes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker, start_date: startDate, end_date: endDate })
      });
      const result = await res.json();
      if (result.chart_data) {
        setData(result.chart_data);
        setAnomalies(result.anomalies || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegimes();
  }, [ticker]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-surface border border-border p-3 rounded-lg shadow-xl">
          <p className="text-textMuted text-xs mb-1">{label}</p>
          <p className="font-bold text-white mb-2">${d.Close?.toFixed(2)}</p>
          <div className="space-y-1">
            <p className="text-xs">
              <span className="text-textMuted">Regime: </span>
              <span className={`font-semibold ${d.Regime === 'Bullish' ? 'text-secondary' : d.Regime === 'Bearish' ? 'text-danger' : 'text-gray-400'}`}>
                {d.Regime}
              </span>
            </p>
            <p className="text-xs">
              <span className="text-textMuted">Z-Score: </span>
              <span className={`font-semibold ${Math.abs(d.Z_Score) > 3 ? 'text-accent' : 'text-white'}`}>
                {d.Z_Score?.toFixed(2)}
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
            onClick={fetchRegimes} 
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
          <div className="card min-h-[400px]">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Layers className="text-primary w-5 h-5" />
              <GlossaryTerm 
                term="Regime Classification & Price Trajectory" 
                simpleLabel="Market Trend & Shocks"
                definition="The current overarching trend of the market based on momentum slopes, overlaid with extreme volatility shocks."
                isSimpleMode={isSimpleMode}
              />
            </h2>
            
            {isSimpleMode && (
              <div className="bg-surfaceHover border border-border rounded-lg p-3 mb-4 text-sm text-textMuted flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-accent flex-shrink-0" />
                <span><strong>What this means:</strong> The colored background blocks show the overarching trend (Green = Bullish, Red = Bearish). The red dots on the chart show extreme market shocks where prices moved unusually fast.</span>
              </div>
            )}
            
            {loading ? (
              <div className="flex justify-center items-center h-[350px]">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="w-full" style={{ height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                    <XAxis dataKey="Date" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} minTickGap={50} />
                    <YAxis domain={['auto', 'auto']} stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="Close" stroke="#6366F1" dot={false} strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
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
                <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="Date" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} minTickGap={50} />
                  <YAxis domain={[-5, 5]} stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(val) => val.toFixed(1)} />
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
        <div className="card bg-danger/10 border-danger/20 lg:col-span-1 flex flex-col max-h-[700px]">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-danger">
            <AlertTriangle className="w-5 h-5" />
            <GlossaryTerm 
              term="Structural Anomalies (>3σ)" 
              simpleLabel="Extreme Market Shocks"
              definition="Extreme volatility events (more than 3 standard deviations from average) that often signal a massive crash or a sudden rally."
              isSimpleMode={isSimpleMode}
            />
          </h2>
          <p className="text-textMuted text-sm mb-4">
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
