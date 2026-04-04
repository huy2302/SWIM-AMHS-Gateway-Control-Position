import React, { useState, useEffect } from 'react';

const ServerMonitor = () => {
  const [metrics, setMetrics] = useState({
    cpu: [45, 25, 19, 30, 55, 35, 32, 40],
    ram: 45,
    rom: 72, // % Disk Usage
    net: { in: 124, out: 85 } // KB/s
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        cpu: [...prev.cpu.slice(1), Math.floor(Math.random() * 30) + 15],
        ram: Math.min(90, prev.ram + (Math.random() > 0.5 ? 1 : -1)),
        rom: 72.4, // ROM thường tăng chậm nên để gần như tĩnh
        net: { 
          in: Math.floor(Math.random() * 200) + 50, 
          out: Math.floor(Math.random() * 150) + 40 
        }
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const cpuPoints = metrics.cpu.map((val, i) => `${i * 25},${30 - (val / 100) * 30}`).join(' ');

  return (
    <div className="bg-slate-100 border border-slate-300 rounded-lg flex flex-col shadow-inner">
      <div className="flex justify-between items-center border-b border-slate-300/50 px-3 py-1">
        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Resource Infrastructure</span>
        <span className="text-[9px] text-green-500 font-mono">UPTIME: 12d 04h</span>
      </div>

      <div className="grid grid-cols-2 gap-3 px-3 py-1 bg-[#000]">
        {/* CPU - Sparkline */}
        <div className="space-y-1">
          <div className="flex justify-between text-[9px]">
            <span className="text-slate-300">CPU LOAD</span>
            <span className="text-green-400 font-mono">{metrics.cpu[metrics.cpu.length-1]}%</span>
          </div>
          <svg viewBox="0 0 180 30" className="w-full h-8 overflow-visible">
            <polyline fill="none" stroke="#22c55e" strokeWidth="1.5" points={cpuPoints} />
          </svg>
        </div>

        {/* RAM - Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[9px]">
            <span className="text-slate-300">RAM USAGE</span>
            <span className="text-blue-400 font-mono">{metrics.ram}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-700 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${metrics.ram}%` }} />
          </div>
          <p className="text-[8px] text-slate-400 text-right italic">1.8GB / 4GB</p>
        </div>

        {/* ROM (Storage) - Tuyến tính */}
        <div className="space-y-1 border-t border-slate-700/30 pt-2">
          <div className="flex justify-between text-[9px]">
            <span className="text-slate-300">ROM (NVMe)</span>
            <span className="text-orange-400 font-mono">{metrics.rom}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-orange-500" style={{ width: `${metrics.rom}%` }} />
          </div>
          <p className="text-[8px] text-slate-400 italic">Logs: 128GB Free</p>
        </div>

        {/* Network - Throughput */}
        <div className="space-y-1 border-t border-slate-700/30 pt-2">
          <div className="flex justify-between text-[9px]">
            <span className="text-slate-300">NETWORK (IO)</span>
            <span className="text-purple-400 font-mono">LIVE</span>
          </div>
          <div className="flex flex-col gap-0.5 font-mono text-[9px]">
            <div className="flex justify-between">
              <span className="text-slate-400">IN:</span>
              <span className="text-slate-300">{metrics.net.in} KB/s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">OUT:</span>
              <span className="text-slate-300">{metrics.net.out} KB/s</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServerMonitor;