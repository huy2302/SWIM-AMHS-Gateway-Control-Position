import { Unplug } from "lucide-react";
import React from "react";
import { useSelector } from "react-redux";

export default function Bottombar() {
  const { uptime, status, error } = useSelector((state) => state.system);

  if (status === "error") {
    return (
      <div className="flex justify-between items-center gap-2 fixed bottom-0 right-0 bg-red-600 text-white px-4 py-2 text-xs">
        <Unplug size={18} /> System monitoring is DOWN
      </div>
    );
  }

  if (status === "idle") {
    return (
      <div className="fixed bottom-0 right-0 text-slate-400 text-xs p-2">
        Connecting to monitoring service...
      </div>
    );
  }

  return (
    <div className="flex justify-between pl-4 pr-4 text-slate-500">
      <div>
        {/* <h3>Connected to server Nova</h3> */}
      </div>
      <div>
        {/* <h3>
          Up time: <span className="time">{formatUptime(uptime)}</span>
        </h3> */}
      </div>
    </div>
  );
}

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