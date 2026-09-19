import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function CrossAsset() {
  const [startDate, setStartDate] = useState('2020-01-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [windowSize, setWindowSize] = useState(60);
  
  const [assetA, setAssetA] = useState('BTC');
  const [assetB, setAssetB] = useState('NVDA');
  
  const [matrix, setMatrix] = useState<any[]>([]);
  const [rollingData, setRollingData] = useState<any[]>([]);
  const [loadingMatrix, setLoadingMatrix] = useState(false);
  const [loadingRolling, setLoadingRolling] = useState(false);

  const fetchMatrix = async () => {
    setLoadingMatrix(true);
    try {
      const res = await fetch(`http://localhost:8000/api/analysis/correlation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start_date: startDate, end_date: endDate, assets: ["BTC", "NVDA", "GOLD"] })
      });
      const data = await res.json();
      if (data.matrix) setMatrix(data.matrix);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMatrix(false);
    }
  };

  const fetchRolling = async () => {
    setLoadingRolling(true);
    try {
      const res = await fetch(`http://localhost:8000/api/analysis/correlation/rolling`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asset_a: assetA, asset_b: assetB, start_date: startDate, end_date: endDate, window: windowSize })
      });
      const data = await res.json();
      if (data.chart_data) setRollingData(data.chart_data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRolling(false);
    }
  };

  useEffect(() => {
    fetchMatrix();
    fetchRolling();
  }, []);

  const handleUpdate = () => {
    fetchMatrix();
    fetchRolling();
  };

  // Helper to format matrix for display
  const assets = ["BTC", "NVDA", "GOLD"];

  return (
    <div className="space-y-6">
      <div className="card grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-textMuted mb-1">Start Date</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-textMuted mb-1">End Date</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-textMuted mb-1">Asset A</label>
          <select value={assetA} onChange={(e) => setAssetA(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white outline-none">
            {assets.map(a => <option key={`a-${a}`} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-textMuted mb-1">Asset B</label>
          <select value={assetB} onChange={(e) => setAssetB(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-white outline-none">
            {assets.map(a => <option key={`b-${a}`} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <button onClick={handleUpdate} className="w-full bg-primary hover:bg-primaryHover text-white font-medium py-2 px-4 rounded-lg h-[42px]">
            Update Analysis
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Correlation Matrix */}
        <div className="card lg:col-span-1">
          <h2 className="text-lg font-semibold mb-4">Correlation Matrix</h2>
          {loadingMatrix ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 text-sm">
              <div className="font-bold text-textMuted"></div>
              {assets.map(a => <div key={`h-${a}`} className="font-bold text-center">{a}</div>)}
              
              {assets.map(a => (
                <React.Fragment key={`row-${a}`}>
                  <div className="font-bold flex items-center">{a}</div>
                  {assets.map(b => {
                    const cell = matrix.find(m => m.asset_a === a && m.asset_b === b);
                    const val = cell ? cell.value : 0;
                    // Color scaling: red (-1) to green (1)
                    const bgOpacity = Math.abs(val);
                    const bgColor = val > 0 ? `rgba(16, 185, 129, ${bgOpacity})` : `rgba(239, 68, 68, ${bgOpacity})`;
                    return (
                      <div key={`cell-${a}-${b}`} className="p-3 text-center rounded text-white font-medium" style={{ backgroundColor: bgColor }}>
                        {val.toFixed(2)}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        {/* Rolling Correlation */}
        <div className="card lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Rolling Correlation ({assetA} vs {assetB})</h2>
            <select 
              value={windowSize} 
              onChange={(e) => { setWindowSize(Number(e.target.value)); setTimeout(fetchRolling, 0); }}
              className="bg-background border border-border rounded-lg px-2 py-1 text-sm text-white outline-none"
            >
              <option value={30}>30 Days</option>
              <option value={60}>60 Days</option>
              <option value={90}>90 Days</option>
            </select>
          </div>
          
          <div className="w-full flex-1 min-h-[300px]">
            {loadingRolling ? (
               <div className="h-full flex items-center justify-center">
                 <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
               </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rollingData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="Date" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} minTickGap={50} />
                  <YAxis domain={[-1, 1]} stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '0.5rem' }} />
                  <Line type="monotone" dataKey="Correlation" stroke="#10B981" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
