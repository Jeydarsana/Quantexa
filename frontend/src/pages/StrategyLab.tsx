import { useState } from 'react';
import { Activity, TrendingUp, AlertTriangle, Cpu, List } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import ControlPanel from '../components/ControlPanel';
import { useMode } from '../contexts/ModeContext';
import GlossaryTerm from '../components/GlossaryTerm';

export default function StrategyLab() {
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [tradeLog, setTradeLog] = useState<any[]>([]);
  const [explanation, setExplanation] = useState<string>('');
  const { isSimpleMode } = useMode();
  
  const handleRunBacktest = async (params: any) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await response.json();
      
      if (data.results && data.results.metrics) {
        setMetrics(data.results.metrics);
        setChartData(data.results.chart_data);
        setTradeLog(data.results.trade_log);
        
        // Fetch AI Explanation
        const aiResponse = await fetch('http://localhost:8000/api/ai/explain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data.results),
        });
        const aiData = await aiResponse.json();
        setExplanation(aiData.explanation);
      }
    } catch (error) {
      console.error("Backtest failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-1">
        <ControlPanel onRun={handleRunBacktest} loading={loading} />
      </div>
      
      <div className="lg:col-span-3 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard 
            title="Total Return" 
            strategy={metrics?.strategy.total_return}
            benchmark={metrics?.benchmark.total_return}
            icon={<TrendingUp className="text-secondary" />} 
            isSimpleMode={isSimpleMode}
          />
          <MetricCard 
            title="Sharpe Ratio" 
            strategy={metrics?.strategy.sharpe_ratio}
            benchmark={metrics?.benchmark.sharpe_ratio}
            icon={<Activity className="text-primary" />} 
            isRatio
            isSimpleMode={isSimpleMode}
          />
          <MetricCard 
            title="Max Drawdown" 
            strategy={metrics?.strategy.max_drawdown}
            benchmark={metrics?.benchmark.max_drawdown}
            icon={<AlertTriangle className="text-danger" />} 
            isSimpleMode={isSimpleMode}
          />
        </div>
        
        <div className="card min-h-[400px] flex flex-col">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Equity Curve
          </h2>
          
          {isSimpleMode && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4 text-sm text-textMuted leading-relaxed">
              <strong className="text-white">What this means:</strong> The green line shows how your money would have grown (or shrunk) if you traded this strategy. The purple line shows what would have happened if you just bought and held the asset without trading.
            </div>
          )}
          
          <div className="flex-1 relative">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : chartData.length > 0 ? (
              <div className="w-full" style={{ height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                    <XAxis dataKey="Date" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} minTickGap={50} />
                    <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} tickFormatter={(val) => `${(val * 100).toFixed(0)}%`} />
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '0.5rem' }} formatter={(val: any) => `${(Number(val) * 100).toFixed(2)}%`} />
                    <Legend />
                    <Line type="monotone" name="Strategy" dataKey="Strategy_Growth" stroke="#10B981" dot={false} strokeWidth={2} />
                    <Line type="monotone" name="Buy & Hold" dataKey="BnH_Growth" stroke="#6366F1" dot={false} strokeWidth={2} opacity={0.6} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-textMuted flex-col gap-3">
                <Activity className="w-12 h-12 opacity-20" />
                <p>Run a backtest to see the equity curve</p>
              </div>
            )}
          </div>
        </div>

        {/* Trade Log */}
        {tradeLog.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <List className="w-5 h-5 text-secondary" />
              Trade Log ({tradeLog.length} trades)
            </h2>
            <div className="overflow-x-auto max-h-64 overflow-y-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-textMuted uppercase bg-background/50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Shares</th>
                    <th className="px-4 py-3">Fee Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {tradeLog.map((trade, i) => (
                    <tr key={i} className="border-b border-border hover:bg-background/50">
                      <td className="px-4 py-3">{trade.date}</td>
                      <td className={`px-4 py-3 font-semibold ${trade.type === 'BUY' ? 'text-secondary' : 'text-danger'}`}>{trade.type}</td>
                      <td className="px-4 py-3">${trade.price.toFixed(2)}</td>
                      <td className="px-4 py-3">{trade.shares.toFixed(4)}</td>
                      <td className="px-4 py-3">${trade.fee.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        <div className="card relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150"></div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 relative z-10">
            <Cpu className="w-5 h-5 text-accent" />
            AI Quantitative Analysis
          </h2>
          <div className="relative z-10 text-sm leading-relaxed text-textMuted">
            {loading ? (
              <div className="flex flex-col gap-2 animate-pulse">
                <div className="h-4 bg-border rounded w-3/4"></div>
                <div className="h-4 bg-border rounded w-full"></div>
                <div className="h-4 bg-border rounded w-5/6"></div>
              </div>
            ) : explanation ? (
              <p className="text-gray-300">{explanation}</p>
            ) : (
              <p>Waiting for backtest results...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, strategy, benchmark, icon, isRatio = false, isSimpleMode = false }: any) {
  if (strategy === undefined) {
    return (
      <div className="card flex items-center justify-between">
        <div><p className="text-sm font-medium text-textMuted mb-1">{title}</p><p className="text-2xl font-bold text-white">--</p></div>
        <div className="p-3 bg-surfaceHover rounded-xl">{icon}</div>
      </div>
    );
  }

  const formatValue = (val: number) => isRatio ? val.toFixed(2) : `${(val * 100).toFixed(2)}%`;
  const sColor = title === 'Max Drawdown' ? (strategy > -0.2 ? 'text-secondary' : 'text-danger') : (strategy > 0 ? 'text-secondary' : 'text-danger');

  return (
    <div className="card">
      <div className="flex justify-between items-start mb-2">
        <p className="text-sm font-medium text-textMuted">
          <GlossaryTerm 
            term={title}
            simpleLabel={title === 'Total Return' ? 'Total Profit' : title === 'Sharpe Ratio' ? 'Risk-Adjusted Score' : 'Worst Case Drop'}
            definition={title === 'Total Return' ? 'The total percentage of money made (or lost) over the entire time period.' : title === 'Sharpe Ratio' ? 'Measures return compared to the risk taken. Above 1.0 is good, below 0 is bad.' : 'The biggest single drop from a high point to a low point. Shows how much pain you might endure.'}
            isSimpleMode={isSimpleMode}
          />
        </p>
        <div className="p-2 bg-surfaceHover rounded-lg">{icon}</div>
      </div>
      <div className="flex items-end gap-3">
        <p className={`text-2xl font-bold ${sColor}`}>{formatValue(strategy)}</p>
        <div className="text-xs text-textMuted pb-1">
          B&H: {formatValue(benchmark)}
        </div>
      </div>
    </div>
  );
}
