import React from "react";
import { useSelector } from "react-redux";
import { t } from "@/i18n/translator";

const ServerMonitor = () => {
  const { GatewayProcess, history } = useSelector((state) => state.system);

  const cpuPoints = history
    .map((point, i) => `${i * 9},${(30 - (point.processCpuLoad / 100) * 30)}`)
    .join(" ");
    
  return (
    <div className="bg-slate-100 border border-slate-300 rounded-lg flex flex-col shadow-inner">
      <div className="flex justify-between items-center border-b border-slate-300/50 px-3 py-1">
        <span className="text-[10px] font-bold text-slate-300 tracking-widest">
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

      </div>
    </div>
  );
};

export default ServerMonitor;
