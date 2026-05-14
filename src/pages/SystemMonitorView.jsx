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
  Database,
  Cpu,
  Activity,
  RefreshCw,
  Save,
  Monitor,
  Mail,
  RouterIcon,
  Logs,
  Archive,
  SettingsIcon,
  MonitorCog,
} from "lucide-react";
import {
  // data,
  NavLink
} from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";
import gatewayApi from "../api/gatewayApi";
import { useDispatch } from "react-redux";
import { setUptime } from "../store/systemSlice";

const generateData = () =>
  [...Array(20)].map((_, i) => ({
    time: i,
    processCpu: 0,
    systemCpu: 0,
    heapUsedMb: 0,
    totalPhysicalMemoryMb: 0,
    totalRamPercent: 0,
    mysqlConnections: 0,
    mysqlCpu: 0,
    upTime: null
  }));

const normalizePercent = (value) =>
  typeof value === "number" && !Number.isNaN(value)
    ? Number((value * 100).toFixed(1))
    : 0;

const toChartPoint = (health, prevTime) => {
  const gatewayCp = health?.gatewayCp || {};
  const mysql = health?.mysql || {};

  return {
    time: prevTime + 1,
    processCpu: normalizePercent(gatewayCp.processCpu),
    systemCpu: normalizePercent(gatewayCp.systemCpu),
    heapUsedMb: Number(gatewayCp.heapUsedMb ?? 0),
    totalPhysicalMemoryMb: Number(gatewayCp.totalPhysicalMemoryMb ?? 0),
    usedPhysicalMemoryMb: Number(gatewayCp.usedPhysicalMemoryMb ?? 0),
    totalRamPercent: normalizePercent(gatewayCp.totalRamPercent),
    mysqlConnections: Number(mysql.connections ?? 0),
    mysqlCpu: normalizePercent(mysql.cpuPercent),
    upTime: Number(gatewayCp.serviceUptimeSec ?? 0)
  };
};

const SystemMonitorView = () => {
  const [activeTab, setActiveTab] = useState("CPU");
  const [data, setData] = useState(generateData());
  const [refreshInterval, setRefreshInterval] = useState(2);
  const dispatch = useDispatch();

  const fetchSystemMonitor = async () => {
    try {
      const response = await gatewayApi.getSystemHealth();
      
      setData((prev) => [
        ...prev.slice(1),
        toChartPoint(response, prev[prev.length - 1]?.time ?? 0),
      ]);
      // console.log(response.gatewayCp.systemCpu + ' - ' + response.gatewayCp.processCpu);
      dispatch(setUptime(response.gatewayCp.serviceUptimeSec));

    } catch (error) {
      console.error("Error fetching system health:", error);
    }
  };
  
  useEffect(() => {
    const t = setTimeout(() => {
      setRefreshInterval(1); // sau 1s đổi về poll 1s
    }, 1000);

    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    // fetchSystemMonitor();
    const interval = setInterval(fetchSystemMonitor, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [refreshInterval]);
  
  return (
    <DashboardLayout>
      <div className="flex flex-col h-full bg-slate-100 text-slate-900 p-4 gap-4 overflow-y-auto">
        {/* Top Toolbar */}
        <div className="bg-white p-3 rounded-lg border border-slate-300 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-600 font-bold uppercase">
                Refresh every
              </span>
              <input
                type="number"
                min="1"
                value={refreshInterval}
                onChange={(e) =>
                  setRefreshInterval(Math.max(1, Number(e.target.value) || 1))
                }
                className="bg-white border border-slate-300 rounded px-2 py-1 text-xs w-16 text-slate-900 outline-none focus:border-blue-500"
              />
              <span className="text-[10px] text-slate-600 font-medium">
                seconds
              </span>
            </div>
            <button className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded text-[11px] font-bold text-slate-900 transition-all active:scale-95">
              <Save size={14} /> WRITE TO LOG
            </button>
          </div>
        </div>

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
              {data[19]?.processCpu >= 0 && (
                <span className="text-[12px] text-green-500 font-light">
                  {data[19]?.processCpu}%
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
              {data[19]?.usedPhysicalMemoryMb >= 0 && (
                <span className="text-[12px] text-green-500 font-light">
                  {data[19]?.usedPhysicalMemoryMb}/{data[19]?.totalPhysicalMemoryMb} MB
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
              <ChartCard title="CPU Usage (%)" color="#ef4444" unit="%" data={data} type={activeTab}>
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
                    dataKey="processCpu"
                    stroke="#ef4444"
                    fillOpacity={1}
                    fill="url(#colorCpu)"
                    isAnimationActive={false}
                  />

                  {/* Đường thứ hai: System CPU */}
                  <Area
                    type="monotone"
                    dataKey="systemCpu"
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
                    domain={[0, data[19].totalPhysicalMemoryMb]} 
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
                    stroke="#eab308"
                    dot={false}
                    isAnimationActive={false}
                    strokeWidth={2}
                  />

                  <Line
                    type="stepAfter"
                    dataKey="usedPhysicalMemoryMb"
                    stroke="#3b34ff"
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
const ChartCard = ({ title, children, color, data, type }) => {
  const upTimeSeconds = formatUptime(data[19]?.upTime);
  
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
          {/* Ô 1: Gateway Application */}
          <div className="p-4">
            <h3 className="text-[14px] uppercase tracking-wider text-slate-400 mb-1">Gateway Application</h3>
            <p className="text-[24px]">{data[19]?.processCpu}%</p>
          </div>

          {/* Ô 2: MySQL Service */}
          <div className="p-4">
            <h3 className="text-[14px] uppercase tracking-wider text-slate-400 mb-1">MySQL Service</h3>
            <p className="text-[24px]">{data[19]?.mysqlCpu}%</p>
          </div>

          {/* Ô 3: Total CPU Utilization */}
          <div className="p-4">
            <h3 className="text-[14px] uppercase tracking-wider text-slate-400 mb-1">Total System Load</h3>
            <p className="text-[24px]">{data[19]?.systemCpu}%</p>
          </div>

          {/* Ô 4: Up time */}
          <div className="p-4">
            <h3 className="text-[14px] uppercase tracking-wider text-slate-400 mb-1">Up Time</h3>
            <p className="text-[24px] font-mono text-slate-200">{upTimeSeconds}</p>
          </div>
        </div>
      )
      : type === "Memory" ? (
        <div className="grid grid-cols-2 gap-0 rounded-lg overflow-hidden">
          {/* Ô 1: Gateway Application */}
          <div className="p-4">
            <h3 className="text-[14px] uppercase tracking-wider text-slate-400 mb-1">In use Process</h3>
            <p className="text-[24px]">{data[19]?.heapUsedMb} MB</p>
          </div>

          <div className="p-4">
            <h3 className="text-[14px] uppercase tracking-wider text-slate-400 mb-1">In use System Memory</h3>
            <p className="text-[24px]">{data[19]?.usedPhysicalMemoryMb} MB</p>
          </div>

          {/* Ô 3: Total System Memory */}
          <div className="p-4">
            <h3 className="text-[14px] uppercase tracking-wider text-slate-400 mb-1">Total System Memory</h3>
            <p className="text-[24px]">{data[19]?.totalPhysicalMemoryMb} MB</p>
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
