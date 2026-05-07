import React, { useState, useEffect, useCallback } from "react";
import {
  XCircle,
  Copy,
  RefreshCcw,
  Calendar,
  FolderOpen,
  Search,
  Info,
  ChevronRight,
  Loader2 // Thêm icon loading
} from "lucide-react";
import DashboardLayout from "../layout/DashboardLayout";
import gatewayApi from "../api/gatewayApi"; // Import file API bạn đã viết

const FullLogView = () => {
  const [logs, setLogs] = useState([]); // Dữ liệu log từ API
  const [selectedLog, setSelectedLog] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);

  // 1. Hàm lấy dữ liệu từ API
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      // Gọi API message-log
      const response = await gatewayApi.getMessageLog();
      
      // Giả sử response trả về dạng Page của Spring Boot có trường .content
      setLogs(response || []); 
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu log:", error);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchLogs();

    const interval = setInterval(() => {
      fetchLogs();
    }, 3000);

    return () => clearInterval(interval);
  }, []);
  // 2. Tự động lấy dữ liệu khi Component mount hoặc đổi trang
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // 3. Xử lý Search onChange
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    // Logic tìm kiếm tại local hoặc gọi API search tùy bạn thiết kế
  };

  // Lọc dữ liệu hiển thị dựa trên search term (Local Filter)
  const filteredLogs = logs.filter(log => 
    log.messageId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.payload?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopy = () => {
    if (selectedLog) {
      navigator.clipboard.writeText(
        `${selectedLog.createdAt} [${selectedLog.status}] ${selectedLog.payload || selectedLog.messageId}`
      );
      alert("Copied to clipboard!");
    }
  };

  const getStatusColor = (status, isSelected = false) => {
    if (isSelected) return "text-white";

    switch (status) {
      case "SUCCESS":
      case "ACK_RECEIVED":
        return "text-green-400";

      case "WAITING_ACK":
      case "SENDING":
      case "VALIDATING":
      case "ROUTING":
      case "TRANSFORMING":
        return "text-blue-400";

      case "ROUTING_FAILED":
        return "text-yellow-400";

      case "VALIDATION_FAILED":
      case "TRANSFORMATION_FAILED":
      case "SEND_FAILED":
      case "ACK_TIMEOUT":
      case "FAILED":
        return "text-red-400";

      default:
        return "text-gray-400";
    }
  };

  const getPriorityColor = (priority) => {
    if (!priority) return "text-gray-400";

    if (priority.startsWith("SS")) {
      return "text-red-500";
    }

    if (priority.startsWith("DD")) {
      return "text-orange-400";
    }

    if (priority.startsWith("FF")) {
      return "text-yellow-400";
    }

    if (priority.startsWith("GG")) {
      return "text-cyan-400";
    }

    if (priority.startsWith("KK")) {
      return "text-gray-400";
    }

    return "text-white";
  };

  const getDirectionColor = (dir) => {
    switch (dir) {
      case "OUT":
        return "text-blue-400";

      case "IN":
        return "text-purple-400";

      default:
        return "text-gray-400";
    }
  };

  const isErrorStatus = (status) => {
    return [
      "FAILED",
      "VALIDATION_FAILED",
      "ROUTING_FAILED",
      "TRANSFORMATION_FAILED",
      "SEND_FAILED",
      "ACK_TIMEOUT"
    ].includes(status);
  };

  const getRowStatusClass = (status, isSelected) => {
    if (isSelected && isErrorStatus(status)) {
      return `
        bg-red-600/60
        text-white

        [&>td]:text-white
        [&>td>span]:text-white
      `;
    } 

    if (isSelected) {
      return `
        bg-blue-600/60
        text-white

        [&>td]:text-white
        [&>td>span]:text-white
      `;
    }

    if (isErrorStatus(status)) {
      return `
        bg-red-500/5
        text-red-600

        [&>td]:text-red-600
        [&>td>span]:text-red-600
      `;
    }

    return "hover:bg-slate-200";
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full bg-slate-100 text-slate-900 font-sans">
        
        {/* TOOLBAR */}
        <div className="bg-slate-900 p-2 border-b border-slate-800 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-1">
            <ToolbarBtn
              icon={<XCircle size={14} />}
              label="Clear"
              onClick={() => setLogs([])}
              variant="danger"
            />
            <div className="w-[1px] h-6 bg-slate-800 mx-2" />

            <ToolbarBtn
              icon={<Copy size={14} />}
              label="Copy"
              onClick={handleCopy}
              disabled={!selectedLog}
            />

            <div className="w-[1px] h-6 bg-slate-800 mx-2" />

            <ToolbarBtn icon={<Calendar size={14} />} label="Today's Log" />
            {/* Nút Update với hiệu ứng Loading */}
            <ToolbarBtn
              icon={loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />}
              label={loading ? "Update" : "Update"}
              onClick={fetchLogs}
              active={loading}
            />
          </div>

          {/* INPUT SEARCH ONCHANGE */}
          <div className="flex items-center gap-2 bg-black/30 px-3 py-1 rounded-md border border-slate-800">
            <Search size={14} className="text-slate-500" />
            <input
              type="text"
              placeholder="Search Message ID..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="bg-transparent text-xs outline-none w-32 focus:w-48 transition-all"
            />
          </div>
        </div>

        {/* TABLE DỮ LIỆU THẬT */}
        <div className="flex-1 overflow-auto custom-scrollbar relative bg-slate-100">
          <table className="w-full text-left text-[11px] border-collapse font-mono">
            <thead className="sticky top-0 bg-white z-20 shadow-sm">
              <tr className="text-slate-500 border-b border-slate-200">
                <th className="px-4 py-2 w-8">#</th>
                <th className="px-4 py-2 w-48">TIME</th>
                <th className="px-4 py-2 w-24">DIR</th>
                <th className="px-4 py-2 w-32">MSG ID</th>
                <th className="px-4 py-2 font-semibold">TYPE</th>
                <th className="px-4 py-2 font-semibold">PRIO</th>
                <th className="px-4 py-2 font-semibold">MESSAGE</th>
                <th className="px-4 py-2 font-semibold">TOPIC</th>
                <th className="px-4 py-2 font-semibold">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className={`
                    group cursor-pointer border-b border-slate-200 transition-colors
                    ${getRowStatusClass(
                      log.processingStatus,
                      selectedLog?.id === log.id
                    )}
                  `}
                >
                  <td className="px-4 py-1">
                    <span>{log.id}</span>
                  </td>

                  <td className="px-4 py-1 whitespace-nowrap">
                    <span>{new Date(log.createdAt).toLocaleString()}</span>
                  </td>

                  <td
                    className={`px-4 py-1 font-semibold ${getDirectionColor(
                      log.direction
                    )}`}
                  >
                    <span>{log.direction}</span>
                  </td>

                  <td className="px-4 py-1 font-mono">
                    <span>{log.messageId}</span>
                  </td>

                  <td className="px-4 py-1 font-medium">
                    <span>{log.amhsMessageType}</span>
                  </td>

                  <td
                    className={`px-4 py-1 font-bold ${getPriorityColor(
                      log.amhsPriority
                    )}`}
                  >
                    <span>{`${log.amhsPriority || "-"} (${log.swimPriority ?? "-"})`}</span>
                  </td>

                  <td
                    className="px-4 py-1 truncate max-w-[250px]"
                    title={log.errorMessage}
                  >
                    <span>{log.errorMessage}</span>
                  </td>

                  <td
                    className="px-4 py-1 truncate max-w-[220px]"
                    title={log.swimTopic}
                  >
                    <span>{log.swimTopic || "-"}</span>
                  </td>

                  <td className="px-4 py-1">
                    <span
                      className={`
                        px-2 py-0.5 rounded text-xs font-bold
                        bg-white/5
                        ${getStatusColor(
                          log.processingStatus,
                          selectedLog?.id === log.id
                        )}
                      `}
                    >
                      {log.processingStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PREVIEW PANEL */}
        {selectedLog && (
          <div className="bg-slate-900 border-t border-blue-500 p-3 flex gap-4">
            <div className="flex-1">
              <h4 className="text-[10px] font-bold text-blue-400 uppercase mb-1">Log Detail</h4>
              <div className="text-xs text-slate-300 bg-black/40 p-2 rounded border border-slate-800 max-h-32 overflow-y-auto">
                <p><strong>Message ID:</strong> {selectedLog.messageId}</p>
                <p><strong>Payload:</strong> {selectedLog.payload}</p>
                {selectedLog.errorMessage && (
                  <p className="text-red-400 mt-2"><strong>Error:</strong> {selectedLog.errorMessage}</p>
                )}
              </div>
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
      flex items-center gap-1.5 px-3 py-1.5 rounded transition-all text-[12px] font-medium
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
