import React, { useState, useEffect } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
  BarChart,
  Bar
} from "recharts";
import {
  LayoutGrid
} from "lucide-react";
import DashboardLayout from "@/layout/DashboardLayout";
import { useSelector } from "react-redux";
import { t } from "@/i18n/translator";

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
  const now = new Date();
  const timeLabel = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

  return {
    time: prevTime + 1,
    timeLabel,
    processCpuLoad: Number(gatewayCp?.processCpuLoad ?? 0),
    systemCpuLoad: Number(gatewayCp?.systemCpuLoad ?? 0),
    heapUsedMb: Number(gatewayCp?.heapUsedMb ?? 0),
    totalPhysicalMemoryMb: Number(gatewayCp?.totalPhysicalMemoryMb ?? 0),
    usedPhysicalMemoryMb: Number(gatewayCp?.usedPhysicalMemoryMb ?? 0),
    totalRamPercent: Number(gatewayCp?.totalRamPercent ?? 0),
    mysqlConnections: Number(mysql?.connections ?? 0),
    mysqlCpu: Number(mysql?.cpuPercent ?? 0),
    upTime: Number(gatewayCp?.serviceUptimeSec ?? 0)
  };
};

const SystemMonitorView = () => {
  const [data, setData] = useState(generateData());
  const { GatewayProcess, Mysql } = useSelector((state) => state.system);
  
  useEffect(() => {
    setData((prev) => [
      ...prev.slice(1),
      toChartPoint(GatewayProcess, Mysql, prev[prev.length - 1]?.time ?? 0),
    ]);
  }, [GatewayProcess, Mysql]);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">

        {/* First Row: CPU & Memory side-by-side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title={t("systemMonitor.charts.cpu.title")} color="#ef4444" type="CPU" card={GatewayProcess}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSystem" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="timeLabel" hide />
              <YAxis stroke="#94a3b8" fontSize={10} unit="%" domain={[0, 100]} />
              <Legend verticalAlign="top" align="right" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px", paddingBottom: "10px" }} />
              <Tooltip labelFormatter={(label) => `Thời gian: ${label}`} contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "11px" }} />
              <Area type="monotone" dataKey="processCpuLoad" name={t("systemMonitor.charts.cpu.legend.process")} stroke="#ef4444" strokeWidth={2} fill="url(#colorCpu)" isAnimationActive={false} />
              <Area type="monotone" dataKey="systemCpuLoad" name={t("systemMonitor.charts.cpu.legend.system")} stroke="#3b82f6" strokeWidth={2} fill="url(#colorSystem)" isAnimationActive={false} />
            </AreaChart>
          </ChartCard>

          <ChartCard title={t("systemMonitor.charts.memory.title")} color="#f59e0b" type="Memory" card={GatewayProcess}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorHeap" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSysMem" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="timeLabel" hide />
              <YAxis stroke="#94a3b8" fontSize={10} domain={[0, GatewayProcess?.totalPhysicalMemoryMb || 16384]} />
              <Legend verticalAlign="top" align="right" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px", paddingBottom: "10px" }} />
              <Tooltip labelFormatter={(label) => `Thời gian: ${label}`} contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "11px" }} />
              <Area type="monotone" dataKey="heapUsedMb" name={t("systemMonitor.charts.memory.legend.process")} stroke="#f59e0b" strokeWidth={2} fill="url(#colorHeap)" isAnimationActive={false} />
              <Area type="monotone" dataKey="usedPhysicalMemoryMb" name={t("systemMonitor.charts.memory.legend.system")} stroke="#8b5cf6" strokeWidth={2} fill="url(#colorSysMem)" isAnimationActive={false} />
            </AreaChart>
          </ChartCard>
        </div>

        {/* Second Row: MySQL Connections & CPU Load side-by-side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title={t("systemMonitor.charts.mysql.connections.title")} color="#3b82f6" type="MySQL_Conn" card={Mysql}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorMysqlConn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="timeLabel" hide />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={10} 
                domain={[0, (dataMax) => Math.max(10, Math.ceil(dataMax * 1.3))]} 
                allowDecimals={false} 
              />
              <Tooltip 
                labelFormatter={(label) => `Thời gian: ${label}`}
                contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "11px" }} 
              />
              <Area 
                type="monotone" 
                dataKey="mysqlConnections" 
                name="Số kết nối MySQL" 
                stroke="#3b82f6" 
                strokeWidth={2} 
                fill="url(#colorMysqlConn)" 
                isAnimationActive={false} 
              />
            </AreaChart>
          </ChartCard>

          <ChartCard title={t("systemMonitor.charts.mysql.cpu.title")} color="#10b981" type="MySQL_CPU" card={Mysql}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorMysqlCpu" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="time" hide />
              <YAxis stroke="#94a3b8" fontSize={10} unit="%" domain={[0, 100]} />
              <Tooltip contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "11px" }} />
              <Area type="monotone" dataKey="mysqlCpu" name={t("systemMonitor.charts.mysql.cpu.title")} stroke="#10b981" strokeWidth={2} fill="url(#colorMysqlCpu)" isAnimationActive={false} />
            </AreaChart>
          </ChartCard>
        </div>

        {/* Third Row: Physical Disk space and partition info */}
        {GatewayProcess?.disks && GatewayProcess.disks.length > 0 && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-800 tracking-wider mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              {t("systemMonitor.disks.title")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {GatewayProcess.disks.map((disk, idx) => (
                <div key={idx} className="border border-slate-100 rounded-xl p-4 bg-slate-50/30">
                  <div className="flex justify-between items-start mb-3 pb-2 border-b border-slate-100">
                    <div>
                      <p className="text-xs font-bold text-slate-700">{disk.model || disk.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">Serial: {disk.serial || "N/A"} | Size: {(disk.sizeBytes / (1024 * 1024 * 1024)).toFixed(1)} GB</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {disk.partitions && disk.partitions.map((part, pIdx) => (
                      <div key={pIdx}>
                        <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                          <span>{t("systemMonitor.disks.partition")}{part.mountPoint}</span>
                          <span>{part.usedPercent?.toFixed(1)}% ({((part.totalBytes - part.freeBytes) / (1024 * 1024 * 1024)).toFixed(1)} GB / {(part.totalBytes / (1024 * 1024 * 1024)).toFixed(1)} GB)</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              part.usedPercent > 90 ? "bg-rose-500" : part.usedPercent > 75 ? "bg-amber-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${Math.min(part.usedPercent, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

// Component khung cho mỗi biểu đồ
const ChartCard = ({ title, children, color, type, card }) => {
  const upTimeSeconds = formatUptime(card?.jvmUptimeSeconds || card?.serviceUptimeSec);
  
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col h-[420px] shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-slate-800 tracking-wider flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          {title}
        </h3>
        <LayoutGrid size={14} className="text-slate-400" />
      </div>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          {children}
        </ResponsiveContainer>
      </div>
      {type === "CPU" ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div>
            <h4 className="text-[9px] font-bold tracking-wider text-slate-400">{t("systemMonitor.info.cpu.totalLoad")}</h4>
            <p className="text-sm font-extrabold text-slate-800 mt-0.5">{card?.systemCpuLoad ? `${card.systemCpuLoad.toFixed(2)}%` : "0.00%"}</p>
          </div>
          <div>
            <h4 className="text-[9px] font-bold tracking-wider text-slate-400">{t("systemMonitor.info.cpu.processLoad")}</h4>
            <p className="text-sm font-extrabold text-slate-800 mt-0.5">{card?.processCpuLoad ? `${card.processCpuLoad.toFixed(2)}%` : "0.00%"}</p>
          </div>
          <div>
            <h4 className="text-[9px] font-bold tracking-wider text-slate-400">{t("systemMonitor.info.cpu.cpuInfo")}</h4>
            <p className="text-xs font-semibold text-slate-700 mt-0.5 truncate" title={card?.cpuName}>{card?.cpuName || "N/A"}</p>
          </div>
          <div>
            <h4 className="text-[9px] font-bold tracking-wider text-slate-400">{t("systemMonitor.info.cpu.uptime")}</h4>
            <p className="text-xs font-mono font-bold text-indigo-600 mt-0.5">{upTimeSeconds}</p>
          </div>
        </div>
      ) : type === "Memory" ? (
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div>
            <h4 className="text-[9px] font-bold tracking-wider text-slate-400">{t("systemMonitor.info.memory.processHeap")}</h4>
            <p className="text-sm font-extrabold text-slate-800 mt-0.5">{card?.heapUsedMb || 0} MB</p>
          </div>
          <div>
            <h4 className="text-[9px] font-bold tracking-wider text-slate-400">{t("systemMonitor.info.memory.systemUsed")}</h4>
            <p className="text-sm font-extrabold text-slate-800 mt-0.5">{card?.usedPhysicalMemoryMb || 0} MB</p>
          </div>
          <div>
            <h4 className="text-[9px] font-bold tracking-wider text-slate-400">{t("systemMonitor.info.memory.totalRam")}</h4>
            <p className="text-sm font-extrabold text-slate-800 mt-0.5">{card?.totalPhysicalMemoryMb || 0} MB</p>
          </div>
        </div>
      ) : type === "MySQL_Conn" ? (
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div>
            <h4 className="text-[9px] font-bold tracking-wider text-slate-400">{t("systemMonitor.info.mysql.activeConn")}</h4>
            <p className="text-sm font-extrabold text-slate-800 mt-0.5">{card?.connections ?? 0}</p>
          </div>
          <div>
            <h4 className="text-[9px] font-bold tracking-wider text-slate-400">Giới hạn Max</h4>
            <p className="text-sm font-extrabold text-slate-800 mt-0.5">{card?.maxConnections ?? 100}</p>
          </div>
          <div>
            <h4 className="text-[9px] font-bold tracking-wider text-slate-400">{t("systemMonitor.info.mysql.status")}</h4>
            <p className="text-sm font-extrabold text-emerald-600 mt-0.5">{card ? "Online" : "Offline"}</p>
          </div>
        </div>
      ) : type === "MySQL_CPU" ? (
        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div>
            <h4 className="text-[9px] font-bold tracking-wider text-slate-400">{t("systemMonitor.info.mysql.dbCpuLoad")}</h4>
            <p className="text-sm font-extrabold text-slate-800 mt-0.5">{card?.cpuPercent >= 0 ? `${card.cpuPercent.toFixed(2)}%` : "0.00%"}</p>
          </div>
          <div>
            <h4 className="text-[9px] font-bold tracking-wider text-slate-400">RAM Sử dụng DB</h4>
            <p className="text-sm font-mono font-extrabold text-slate-800 mt-0.5">{card?.ramPercent >= 0 ? `${card.ramPercent.toFixed(2)}%` : "0.00%"}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
};


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
};

export default SystemMonitorView;
