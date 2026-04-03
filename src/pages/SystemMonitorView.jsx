import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { LayoutGrid, Database, Cpu, Activity, RefreshCw, Save } from 'lucide-react';
import DashboardLayout from '../layout/DashboardLayout';

// Giả lập dữ liệu thời gian thực
const generateData = () => [...Array(20)].map((_, i) => ({
  time: i,
  cpu: Math.floor(Math.random() * 30) + 10,
  heap: Math.floor(Math.random() * 200) + 400,
  amqp: Math.floor(Math.random() * 50),
  amhs: Math.floor(Math.random() * 40),
}));

const SystemMonitorView = () => {
  const [data, setData] = useState(generateData());
  const [refreshInterval, setRefreshInterval] = useState(5);

  // Hiệu ứng cập nhật dữ liệu giả lập mỗi 3 giây
  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => [...prev.slice(1), {
        time: prev[prev.length - 1].time + 1,
        cpu: Math.floor(Math.random() * 40),
        heap: Math.floor(Math.random() * 100) + 500,
        amqp: Math.floor(Math.random() * 60),
        amhs: Math.floor(Math.random() * 50),
      }]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <DashboardLayout>
        <div className="flex flex-col h-full bg-slate-950 text-slate-200 p-4 gap-4 overflow-y-auto">
        
        {/* Top Toolbar */}
        <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Refresh every</span>
                <input 
                type="number" 
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(e.target.value)}
                className="bg-black border border-slate-700 rounded px-2 py-1 text-xs w-16 text-blue-400 outline-none focus:border-blue-500"
                />
                <span className="text-[10px] text-slate-500 font-medium">seconds</span>
            </div>
            <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded text-[11px] font-bold transition-all active:scale-95">
                <Save size={14} /> WRITE TO LOG
            </button>
            </div>

            <div className="flex items-center gap-4">
            <div className="bg-black/50 px-3 py-1.5 rounded border border-slate-800 flex items-center gap-3">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Heap Manager:</span>
                <div className="h-2 w-32 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[45%]" />
                </div>
                <span className="text-[10px] font-mono text-blue-400">41.14MB / 1024MB</span>
            </div>
            <button className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"><RefreshCw size={16}/></button>
            </div>
        </div>

        {/* Grid Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
            
            <ChartCard title="CPU Usage (%)" color="#ef4444" unit="%">
            <AreaChart data={data}>
                <defs>
                <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" hide />
                <YAxis stroke="#475569" fontSize={10} unit="%" />
                <Tooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', fontSize: '10px'}} />
                <Area type="monotone" dataKey="cpu" stroke="#ef4444" fillOpacity={1} fill="url(#colorCpu)" isAnimationActive={false} />
            </AreaChart>
            </ChartCard>

            <ChartCard title="Console Heap Memory Usage (MB)" color="#eab308" unit="MB">
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" hide />
                <YAxis stroke="#475569" fontSize={10} />
                <Tooltip contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', fontSize: '10px'}} />
                <Line type="stepAfter" dataKey="heap" stroke="#eab308" dot={false} isAnimationActive={false} strokeWidth={2} />
            </LineChart>
            </ChartCard>

            <ChartCard title="AMQP Incoming Messages (msg/period)" color="#3b82f6" unit="">
            <BarChartCustom data={data} dataKey="amqp" color="#3b82f6" />
            </ChartCard>

            <ChartCard title="AMHS Incoming Messages (msg/period)" color="#10b981" unit="">
            <BarChartCustom data={data} dataKey="amhs" color="#10b981" />
            </ChartCard>

        </div>
        </div>
    </DashboardLayout>
  );
};

// Component khung cho mỗi biểu đồ
const ChartCard = ({ title, children, color }) => (
  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col h-[280px] shadow-lg">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
        <div className="w-2 h-2 rounded-full" style={{backgroundColor: color}} />
        {title}
      </h3>
      <LayoutGrid size={14} className="text-slate-600" />
    </div>
    <div className="flex-1 w-full">
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  </div>
);

// Component vẽ Bar chart đơn giản cho điện văn
const BarChartCustom = ({ data, dataKey, color }) => (
  <div className="h-full w-full flex items-end gap-1 px-2">
    {data.map((item, i) => (
      <div 
        key={i} 
        className="flex-1 rounded-t-sm transition-all duration-500" 
        style={{ 
          height: `${(item[dataKey] / 100) * 100}%`, 
          backgroundColor: color,
          opacity: 0.6 + (i / 20) * 0.4 
        }} 
      />
    ))}
  </div>
);

export default SystemMonitorView;