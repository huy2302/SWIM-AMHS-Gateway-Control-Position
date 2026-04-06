import React, { useState } from "react";
import {
  XCircle,
  Copy,
  RefreshCcw,
  Calendar,
  FolderOpen,
  Search,
  Filter,
  Info,
  ChevronRight,
} from "lucide-react";
import DashboardLayout from "../layout/DashboardLayout";
import { LOG_DATA } from "../data/sampleData";

const FullLogView = () => {
  const [selectedLog, setSelectedLog] = useState(null);
  const [filterLevel, setFilterLevel] = useState("All");

  // Hàm xử lý copy nội dung log được chọn
  const handleCopy = () => {
    if (selectedLog) {
      navigator.clipboard.writeText(
        `${selectedLog.timestamp} [${selectedLog.level}] ${selectedLog.message}`,
      );
      alert("Copied to clipboard!");
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full bg-slate-100 text-slate-900 font-sans">
        {/* 1. FUNCTION BUTTONS (Toolbar chính) */}
        <div className="bg-slate-900 p-2 border-b border-slate-800 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-1">
            <ToolbarBtn
              icon={<XCircle size={14} />}
              label="Clear"
              onClick={() => console.log("Clear logs")}
              variant="danger"
            />
            <div className="w-[1px] h-6 bg-slate-800 mx-2" />

            {/* Nút Copy chỉ sáng lên khi có log được chọn */}
            <ToolbarBtn
              icon={<Copy size={14} />}
              label="Copy"
              onClick={handleCopy}
              disabled={!selectedLog}
            />

            <ToolbarBtn
              icon={<RefreshCcw size={14} />}
              label="Updating"
              active={true}
            />

            <div className="w-[1px] h-6 bg-slate-800 mx-2" />

            <ToolbarBtn icon={<Calendar size={14} />} label="Today's Log" />
            <ToolbarBtn icon={<FolderOpen size={14} />} label="Open Log" />

            {/* Nút xem chi tiết (Mới thêm) */}
            <ToolbarBtn
              icon={<Info size={14} />}
              label="Details"
              disabled={!selectedLog}
              onClick={() => alert(selectedLog?.message)}
            />
          </div>

          {/* Bộ lọc nhanh bên phải */}
          <div className="flex items-center gap-2 bg-black/30 px-3 py-1 rounded-md border border-slate-800">
            <Search size={14} className="text-slate-500" />
            <input
              type="text"
              placeholder="Quick search..."
              className="bg-transparent text-xs outline-none w-32 focus:w-48 transition-all"
            />
          </div>
        </div>

        {/* 2. LOG TABLE (With click selection feature) */}
        <div className="flex-1 overflow-auto custom-scrollbar relative bg-slate-100">
          <table className="w-full text-left text-[11px] border-collapse font-mono">
            <thead className="sticky top-0 bg-slate-100 z-20 shadow-sm">
              <tr className="text-slate-500 border-b border-slate-800">
                <th className="px-4 py-2 w-8"></th>{" "}
                {/* Indicator icon column */}
                <th className="px-4 py-2 w-32">Date / Time</th>
                <th className="px-4 py-2 w-24">Level</th>
                <th className="px-4 py-2 w-40">Thread</th>
                <th className="px-4 py-2 font-semibold">Message</th>
              </tr>
            </thead>
            <tbody>
              {LOG_DATA.map((log) => (
                <tr
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className={`group cursor-pointer border-b border-slate-900/30 transition-colors ${
                    selectedLog?.id === log.id
                      ? "bg-blue-600/40 text-white" // Màu khi được chọn
                      : "hover:bg-slate-800/40"
                  }`}
                >
                  <td className="px-2 py-1 text-center">
                    {selectedLog?.id === log.id && (
                      <ChevronRight
                        size={12}
                        className="text-blue-400 inline"
                      />
                    )}
                  </td>
                  <td
                    className={`px-4 py-1 ${selectedLog?.id === log.id ? "text-white" : "text-slate-500"}`}
                  >
                    {log.timestamp}
                  </td>
                  <td className="px-4 py-1">
                    <span
                      className={`font-bold ${
                        log.level === "WARNING"
                          ? "text-orange-500"
                          : log.level === "INFO"
                            ? "text-blue-400"
                            : "text-slate-400"
                      } ${selectedLog?.id === log.id ? "text-white" : ""}`}
                    >
                      {log.level}
                    </span>
                  </td>
                  <td
                    className={`px-4 py-1 ${selectedLog?.id === log.id ? "text-blue-100" : "text-purple-400/80"}`}
                  >
                    {log.thread}
                  </td>
                  <td
                    className={`px-4 py-1 whitespace-pre-wrap ${
                      selectedLog?.id === log.id
                        ? "text-white"
                        : "text-slate-300"
                    }`}
                  >
                    {log.message}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 3. SELECTED PREVIEW (Khu vực xem nhanh log đang chọn) */}
        {selectedLog && (
          <div className="bg-slate-900 border-t border-blue-500/50 p-3 flex gap-4 animate-slideUp">
            <div className="flex-1">
              <h4 className="text-[10px] font-bold text-blue-400 uppercase mb-1">
                Selected Message Detail
              </h4>
              <div className="text-xs text-slate-300 bg-black/40 p-2 rounded border border-slate-800 max-h-20 overflow-y-auto">
                {selectedLog.message}
              </div>
            </div>
            <div className="w-48 flex flex-col justify-end gap-2 text-[10px]">
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-500 uppercase">Status:</span>
                <span className="text-green-500 font-bold tracking-tighter">
                  READING
                </span>
              </div>
              <button
                onClick={handleCopy}
                className="bg-blue-600 hover:bg-blue-500 text-white py-1 px-2 rounded font-bold uppercase transition-all"
              >
                Copy Details
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

// Component con cho các nút Toolbar
const ToolbarBtn = ({
  icon,
  label,
  onClick,
  disabled = false,
  active = false,
  variant = "default",
}) => (
  <button
    disabled={disabled}
    onClick={onClick}
    className={`
      flex items-center gap-1.5 px-3 py-1.5 rounded transition-all text-[11px] font-medium
      ${disabled ? "opacity-20 cursor-not-allowed" : "hover:bg-slate-800 active:scale-95 cursor-pointer"}
      ${active ? "bg-slate-800 text-blue-400 shadow-inner" : "text-slate-300"}
      ${variant === "danger" ? "hover:text-red-400" : ""}
    `}
  >
    <span className={active ? "animate-spin-slow" : ""}>{icon}</span>
    <span>{label}</span>
  </button>
);

export default FullLogView;
