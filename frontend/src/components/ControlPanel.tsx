import { useState } from 'react';
import { Play } from 'lucide-react';
import AssetSelector from './AssetSelector';

interface ControlPanelProps {
  onRun: (params: any) => void;
  loading: boolean;
}

export default function ControlPanel({ onRun, loading }: ControlPanelProps) {
  const [ticker, setTicker] = useState('NVDA');
  const [startDate, setStartDate] = useState('2020-01-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [strategy, setStrategy] = useState('SMA_Crossover');
  
  const [capital, setCapital] = useState('10000');
  const [txCost, setTxCost] = useState('0.1');
  const [posSize, setPosSize] = useState('100');

  const [shortWindow, setShortWindow] = useState('20');
  const [longWindow, setLongWindow] = useState('50');

  const handleRun = () => {
    onRun({
      ticker,
      start_date: startDate,
      end_date: endDate,
      strategy,
      params: {
        short_window: parseInt(shortWindow),
        long_window: parseInt(longWindow),
        initial_capital: parseFloat(capital),
        transaction_cost: parseFloat(txCost),
        position_size: parseFloat(posSize)
      }
    });
  };

  return (
    <div className="card space-y-4">
      <h3 className="font-semibold text-white mb-4">Parameters</h3>
      
      <div>
        <label className="block text-xs font-medium text-textMuted mb-1">Asset Ticker</label>
        <AssetSelector value={ticker} onChange={setTicker} compact />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-textMuted mb-1">Start Date</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-background border border-border rounded px-2 py-2 text-sm outline-none text-white" />
        </div>
        <div>
          <label className="block text-xs font-medium text-textMuted mb-1">End Date</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full bg-background border border-border rounded px-2 py-2 text-sm outline-none text-white" />
        </div>
      </div>

      <div className="pt-2 border-t border-border">
        <label className="block text-xs font-medium text-textMuted mb-1">Simulation Settings</label>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <label className="block text-[10px] text-textMuted mb-1">Initial Capital ($)</label>
            <input type="number" value={capital} onChange={e => setCapital(e.target.value)} placeholder="10000" className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm outline-none text-white" />
          </div>
          <div>
            <label className="block text-[10px] text-textMuted mb-1">Tx Cost (%)</label>
            <input type="number" step="0.01" value={txCost} onChange={e => setTxCost(e.target.value)} placeholder="0.1" className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm outline-none text-white" />
          </div>
        </div>
        <div>
          <label className="block text-[10px] text-textMuted mb-1">Position Size (% of cash)</label>
          <input type="number" value={posSize} onChange={e => setPosSize(e.target.value)} placeholder="100" className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm outline-none text-white" />
        </div>
      </div>

      <div className="pt-2 border-t border-border">
        <label className="block text-xs font-medium text-textMuted mb-1">Strategy</label>
        <select value={strategy} onChange={e => setStrategy(e.target.value)} className="w-full bg-background border border-border rounded px-3 py-2 text-sm outline-none text-white mb-3">
          <option value="SMA_Crossover">SMA Crossover</option>
          <option value="EMA_Trend">EMA Trend</option>
          <option value="Momentum">Momentum</option>
          <option value="Mean_Reversion">Mean Reversion</option>
        </select>
        
        {strategy === 'SMA_Crossover' && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-textMuted mb-1">Short Window</label>
              <input type="number" value={shortWindow} onChange={e => setShortWindow(e.target.value)} className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm outline-none text-white" />
            </div>
            <div>
              <label className="block text-xs text-textMuted mb-1">Long Window</label>
              <input type="number" value={longWindow} onChange={e => setLongWindow(e.target.value)} className="w-full bg-background border border-border rounded px-2 py-1.5 text-sm outline-none text-white" />
            </div>
          </div>
        )}
      </div>

      <button 
        onClick={handleRun}
        disabled={loading}
        className="w-full mt-4 bg-primary hover:bg-primaryHover text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
      >
        {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Play className="w-4 h-4" />}
        Run Backtest
      </button>
    </div>
  );
}
