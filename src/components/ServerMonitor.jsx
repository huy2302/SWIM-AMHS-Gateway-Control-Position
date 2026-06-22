import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { t } from "@/i18n/translator";

const ServerMonitor = () => {
  const [metrics, setMetrics] = useState({
    cpu: [45, 25, 19, 30, 55, 35, 32, 40, 28, 22, 18, 30, 50, 60, 42, 38, 33, 29, 31, 27], // % CPU Load history
    ram: 0,
    rom: 0, // % Disk Usage
    net: { in: 124, out: 85 }, // KB/s
    mysqlStatus: "UP",
    totalRamGb: 4,
    usedRamGb: 1.8,
    totalDiskGb: 1000,
    usedDiskGb: 72,
  });
  const { GatewayProcess } = useSelector((state) => state.system);

  const [cpuHistory, setCpuHistory] = useState(Array(20).fill(0));

  useEffect(() => {
    if (typeof GatewayProcess?.processCpuLoad !== "number") return;

    setCpuHistory(prev => [
      ...prev.slice(1),
      Math.min(Math.max(GatewayProcess?.processCpuLoad, 0), 100) // clamp 0–100
    ]);

    setMetrics(prev => ({
      ...prev,
      cpu: [
        ...prev.cpu.slice(1),
        Math.min(Math.max(GatewayProcess?.processCpuLoad, 0), 100) // clamp 0–100
      ]
    }));
    
  }, [GatewayProcess?.processCpuLoad]);

  const cpuPoints = cpuHistory
    .map((val, i) => `${i * 9},${(30 - (val / 100) * 30)}`)
    .join(" ");
    
  return (
    <div className="bg-slate-100 border border-slate-300 rounded-lg flex flex-col shadow-inner">
      <div className="flex justify-between items-center border-b border-slate-300/50 px-3 py-1">
        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
          {t("sidebar.serverMonitor.title")}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 px-3 py-1 bg-[#fff]">
        {/* CPU - Sparkline */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px]">
            <span className="text-slate-300">{t("sidebar.serverMonitor.cpu")}</span>
            <span className="text-green-400 font-mono">
              {(GatewayProcess?.processCpuLoad)?.toFixed(2) ?? 0}%
            </span>
          </div>
          <svg viewBox="0 0 180 30" className="w-full h-8 overflow-visible">
            <polyline
              fill="none"
              stroke="#22c55e"
              strokeWidth="1.5"
              points={cpuPoints}
            />
          </svg>
        </div>

        {/* RAM - Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px]">
            <span className="text-slate-300">{t("sidebar.serverMonitor.ram")}</span>
            <span className="text-blue-400 font-mono">{GatewayProcess?.ramUsedPercent?.toFixed(2) ?? 0}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-700 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-1000"
              style={{ width: `${GatewayProcess?.ramUsedPercent}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 text-right italic">
            {GatewayProcess?.usedPhysicalMemoryMb ?? 0}MB / {GatewayProcess?.totalPhysicalMemoryMb ?? 0}MB
          </p>
        </div>

        {/* ROM (Storage) - Tuyến tính */}
        {/* <div className="space-y-1 border-t border-slate-700/30 pt-2">
          <div className="flex justify-between text-[10px]">
            <span className="text-slate-300">Disk Usage</span>
            <span className="text-orange-400 font-mono">{metrics.rom}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500"
              style={{ width: `${metrics.rom}%` }}
            />
          </div> */}
          {/* <p className="text-[8px] text-slate-400 italic">Used: {metrics.usedDiskGb.toFixed(2)}GB / {metrics.totalDiskGb.toFixed(2)}GB</p> */}
        {/* </div> */}

      </div>
    </div>
  );
};

export default ServerMonitor;
