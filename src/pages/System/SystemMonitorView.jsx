import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend
} from "recharts";
import {
  LayoutGrid,
} from "lucide-react";
import DashboardLayout from "@/layout/DashboardLayout";
import { useSelector } from "react-redux";

const generateData = () =>
  [...Array(20)].map((_, i) => ({
    time: i,
    processCpuLoad: 0,
    systemCpuLoad: 0,
    heapUsedMb: 0,
    totalPhysicalMemoryMb: 0,
    totalRamPercent: 0,
    mysqlConnections: 0,
    mysqlCpu: 0,
    upTime: null
  }));

const toChartPoint = (gatewayCp, mysql, prevTime) => {
  return {
    time: prevTime + 1,
    processCpuLoad: gatewayCp?.processCpuLoad,
    systemCpuLoad: gatewayCp?.systemCpuLoad,
    heapUsedMb: Number(gatewayCp?.heapUsedMb ?? 0),
    totalPhysicalMemoryMb: Number(gatewayCp?.totalPhysicalMemoryMb ?? 0),
    usedPhysicalMemoryMb: Number(gatewayCp?.usedPhysicalMemoryMb ?? 0),
    totalRamPercent: gatewayCp?.totalRamPercent,
    mysqlConnections: Number(mysql?.connections ?? 0),
    mysqlCpu: mysql?.cpuPercent,
    upTime: Number(gatewayCp?.serviceUptimeSec ?? 0)
  };
};

const SystemMonitorView = () => {
  const [activeTab, setActiveTab] = useState("CPU");
  const [data, setData] = useState(generateData());
  const [refreshInterval, setRefreshInterval] = useState(2);
  const { GatewayProcess, Mysql } = useSelector((state) => state.system);
  
  useEffect(() => {
    setData((prev) => [
      ...prev.slice(1),
      toChartPoint(GatewayProcess, Mysql, prev[prev.length - 1]?.time ?? 0),
    ]);
  }, [GatewayProcess]);

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full bg-slate-100 text-slate-900 p-4 gap-4 overflow-y-auto">
        {/* Grid Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_8fr] gap-4 flex-1">
          {/* Tab Switcher */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setActiveTab("CPU")}
              className={`flex flex-col items-start gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === "CPU" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              CPU
              {GatewayProcess?.processCpuLoad >= 0 && (
                <span className="text-[12px] text-green-500 font-light">
                  {GatewayProcess?.processCpuLoad?.toFixed(2)}%
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("Memory")}
              className={`flex flex-col items-start gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === "Memory" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Memory
              {GatewayProcess?.usedPhysicalMemoryMb >= 0 && (
                <span className="text-[12px] text-green-500 font-light">
                  {GatewayProcess?.usedPhysicalMemoryMb}/{GatewayProcess?.totalPhysicalMemoryMb} MB
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("MySQL")}
              className={`flex flex-col items-start gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === "MySQL" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              MySQL
            </button>
          </div>
          <div>
            {activeTab === "CPU" && (
              <ChartCard title="CPU Usage (%)" color="#ef4444" unit="%" data={data} type={activeTab} card={GatewayProcess}>
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>

                    <linearGradient id="colorSystem" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1e293b"
                    vertical={false}
                  />
                  <XAxis dataKey="time" hide />
                  <YAxis
                    stroke="#475569"
                    fontSize={10} 
                    unit="%" 
                    domain={[0, 100]} 
                    ticks={[0, 25, 50, 75, 100]} 
                    allowDataOverflow={true} 
                  />
                  <Legend 
                    verticalAlign="top" 
                    align="right"
                    iconType="circle"
                    iconSize={10}
                    wrapperStyle={{
                      paddingBottom: "20px",
                      fontSize: "12px",
                      color: "#94a3b8"
                    }}
                    formatter={(value) => <span style={{ color: '#cbd5e1' }}>{value}</span>}
                  />
                  <Tooltip
                    useTranslate3d={true}
                    isAnimationActive={false}
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #d1d5db",
                      color: "#0f172a",
                      fontSize: "10px",
                    }}
                  />
                  {/* Đường thứ nhất: Process CPU */}
                  <Area
                    type="monotone"
                    dataKey="processCpuLoad"
                    name="Process CPU Load"
                    stroke="#ef4444"
                    fillOpacity={1}
                    fill="url(#colorCpu)"
                    isAnimationActive={false}
                  />

                  {/* Đường thứ hai: System CPU */}
                  <Area
                    type="monotone"
                    dataKey="systemCpuLoad"
                    name="System CPU Load"
                    stroke="#3b82f6"
                    fill="url(#colorSystem)"
                    fillOpacity={1}
                    isAnimationActive={false}
                    dot={false}
                  />
                </AreaChart>
              </ChartCard>
            )}

            {activeTab === "Memory" && (
              <ChartCard
                title="Console Heap Memory Usage (MB)"
                color="#eab308"
                unit="MB"
                data={data}
                type={activeTab}
                card={GatewayProcess}
              >
                <LineChart data={data}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#cbd5e1"
                    vertical={false}
                  />
                  <XAxis dataKey="time" hide />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={10} 
                    domain={[0, GatewayProcess?.totalPhysicalMemoryMb || 0]} 
                    allowDataOverflow={true}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #d1d5db",
                      color: "#0f172a",
                      fontSize: "10px",
                    }}
                  />
                  <Line
                    type="stepAfter"
                    dataKey="heapUsedMb"
                    name="Process Memory Used"
                    stroke="#eab308"
                    dot={false}
                    isAnimationActive={false}
                    strokeWidth={2}
                  />

                  <Line
                    type="stepAfter"
                    dataKey="usedPhysicalMemoryMb"
                    stroke="#3b34ff"
                    name="System Memory Used"
                    dot={false}
                    isAnimationActive={false}
                    strokeWidth={2}
                  />
                </LineChart>
              </ChartCard>
            )}

            {activeTab === "MySQL" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartCard
                  title="MySQL Connections"
                  color="#3b82f6"
                  unit=""
                  data={data}
                  type={activeTab}
                >
                  <BarChartCustom data={data} dataKey="mysqlConnections" color="#3b82f6" />
                </ChartCard>

                <ChartCard
                  title="MySQL CPU Usage (%)"
                  color="#10b981"
                  unit="%"
                  data={data}
                  type={activeTab}
                >
                  <BarChartCustom data={data} dataKey="mysqlCpu" color="#10b981" />
                </ChartCard>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

// Component khung cho mỗi biểu đồ
const ChartCard = ({ title, children, color, data, type, card }) => {
  const upTimeSeconds = formatUptime(card?.jvmUptimeSeconds);
  
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col h-[600px] shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: color }}
          />
          {title}
        </h3>
        <LayoutGrid size={14} className="text-slate-600" />
      </div>
      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
      {type === "CPU" ? (
        <div className="grid grid-cols-2 gap-0 rounded-lg overflow-hidden">
          {/* Ô 2: CPU Information */}
          <div className="p-4">
            <h3 className="text-[14px] uppercase tracking-wider text-slate-400 mb-1">CPU Information</h3>
            <p className="text-[18px]">{card?.cpuName}</p>
          </div>

          {/* Ô 4: Up time */}
          <div className="p-4">
            <h3 className="text-[14px] uppercase tracking-wider text-slate-400 mb-1">Up Time</h3>
            <p className="text-[24px] font-mono text-slate-200">{upTimeSeconds}</p>
          </div>

          <div className="p-4">
            <h3 className="text-[14px] uppercase tracking-wider text-slate-400 mb-1">CPU Cores</h3>
            <p className="text-[18px]">{card?.physicalCores} cores / {card?.logicalCores} threads</p>
          </div>

          {/* Ô 3: Total CPU Utilization */}
          <div className="p-4">
            <h3 className="text-[14px] uppercase tracking-wider text-slate-400 mb-1">Total System Load</h3>
            <p className="text-[24px]">{card?.systemCpuLoad?.toFixed(2)}%</p>
          </div>

         

           {/* Ô 1: Used load */}
          <div className="p-4">
            <h3 className="text-[14px] uppercase tracking-wider text-slate-400 mb-1">Used load</h3>
            <p className="text-[24px]">{card?.processCpuLoad?.toFixed(2)}%</p>
          </div>
        </div>
      )
      : type === "Memory" ? (
        <div className="grid grid-cols-2 gap-0 rounded-lg overflow-hidden">
          {/* Ô 1: Gateway Application */}
          <div className="p-4">
            <h3 className="text-[14px] uppercase tracking-wider text-slate-400 mb-1">In use Process</h3>
            <p className="text-[24px]">{card?.heapUsedMb} MB</p>
          </div>

          <div className="p-4">
            <h3 className="text-[14px] uppercase tracking-wider text-slate-400 mb-1">In use System Memory</h3>
            <p className="text-[24px]">{card?.usedPhysicalMemoryMb} MB</p>
          </div>

          {/* Ô 3: Total System Memory */}
          <div className="p-4">
            <h3 className="text-[14px] uppercase tracking-wider text-slate-400 mb-1">Total System Memory</h3>
            <p className="text-[24px]">{card?.totalPhysicalMemoryMb} MB</p>
          </div>
        </div>
        )
      :
      null}
      
    </div>
  )
};

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
          opacity: 0.6 + (i / 20) * 0.4,
        }}
      />
    ))}
  </div>
);

// Format Up time từ giây sang định dạng D:HH:MM:SS
const formatUptime = (seconds) => {
  if (!seconds && seconds !== 0) return "0:00:00:00";

  const days = Math.floor(seconds / 86400);
  seconds %= 86400;

  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;

  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  // padStart để luôn có 2 chữ số
  const h = String(hours).padStart(2, "0");
  const m = String(minutes).padStart(2, "0");
  const s = String(secs).padStart(2, "0");

  return `${days}:${h}:${m}:${s}`;
}

export default SystemMonitorView;
