import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

interface ChartProps {
  data: any[];
}

export default function Chart({ data }: ChartProps) {
  
  // Custom tooltip for premium look
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface border border-border p-3 rounded-lg shadow-xl text-sm">
          <p className="text-textMuted mb-2 font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 my-1">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></span>
              <span className="text-gray-300">{entry.name}:</span>
              <span className="font-semibold text-white">
                {entry.name.includes('Cumulative') 
                  ? `${((entry.value - 1) * 100).toFixed(2)}%` 
                  : entry.value.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full" style={{ height: 350 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
          <XAxis 
            dataKey="Date" 
            stroke="#9CA3AF" 
            tick={{ fill: '#9CA3AF', fontSize: 12 }} 
            tickFormatter={(str) => {
              const date = new Date(str);
              return `${date.getMonth() + 1}/${date.getFullYear().toString().substr(2)}`;
            }}
            minTickGap={30}
          />
          <YAxis 
            yAxisId="left"
            stroke="#9CA3AF" 
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            tickFormatter={(val) => val.toFixed(0)}
            domain={['auto', 'auto']}
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            stroke="#9CA3AF" 
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            tickFormatter={(val) => `${((val - 1) * 100).toFixed(0)}%`}
            domain={['auto', 'auto']}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: '10px' }} />
          
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="Close" 
            name="Asset Price" 
            stroke="#9CA3AF" 
            strokeWidth={1}
            dot={false} 
            opacity={0.5}
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="Cumulative_Market" 
            name="Buy & Hold" 
            stroke="#10B981" 
            strokeWidth={2}
            dot={false} 
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="Cumulative_Strategy" 
            name="Strategy" 
            stroke="#4F46E5" 
            strokeWidth={2}
            dot={false} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
