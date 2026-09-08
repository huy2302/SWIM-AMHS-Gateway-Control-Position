import { Unplug } from "lucide-react";
import React from "react";
import { useSelector } from "react-redux";

export default function Bottombar() {
  const { status } = useSelector((state) => state.system);

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

  return <div className="flex justify-between pl-4 pr-4 text-slate-500" />;
}
