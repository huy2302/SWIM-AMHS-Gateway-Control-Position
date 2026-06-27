import React, { useState, useEffect, useCallback } from "react";
import {
  XCircle,
  Copy,
  RefreshCcw,
  Search,
  Loader2,
  FileText
} from "lucide-react";
import toast from "react-hot-toast";
import DashboardLayout from "@/layout/DashboardLayout";
import gatewayApi from "@/api/gatewayApi";
import TablePagination from "@/components/TablePagination";
import { t } from "@/i18n/translator";

const getStatusStyle = (status) => {
  if (!status) return "bg-slate-50 text-slate-600 border-slate-200/60";

  switch (status.toUpperCase()) {
    case "OK":
    case "SUCCESS":
    case "ACK_RECEIVED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200/50";
    case "WAITING_ACK":
    case "SENDING":
    case "VALIDATING":
    case "ROUTING":
    case "TRANSFORMING":
      return "bg-sky-50 text-sky-700 border-sky-200/50";
    case "UNROUTED":
    case "ROUTING_FAILED":
      return "bg-amber-50 text-amber-700 border-amber-200/50";
    case "ERROR":
    case "REJECT":
    case "FAILED":
    case "VALIDATION_FAILED":
    case "TRANSFORMATION_FAILED":
    case "SEND_FAILED":
    case "ACK_TIMEOUT":
      return "bg-rose-50 text-rose-700 border-rose-200/50";
    default:
      return "bg-slate-50 text-slate-600 border-slate-200/50";
  }
};

const getStatusLabel = (status) => {
  if (!status) return "-";
  const statusKey = status.toLowerCase();
  const label = t(`log.status.${statusKey}`);
  return label !== `log.status.${statusKey}` ? label : status.toUpperCase();
};

const getPriorityStyle = (priority) => {
  if (!priority) return "text-slate-400";
  const p = priority.toUpperCase();
  if (p.startsWith("SS")) return "text-rose-600 font-bold";
  if (p.startsWith("DD")) return "text-amber-600 font-bold";
  if (p.startsWith("FF")) return "text-yellow-600 font-bold";
  if (p.startsWith("GG")) return "text-cyan-600 font-bold";
  if (p.startsWith("KK")) return "text-slate-400 font-bold";
  return "text-slate-500";
};

const getDirectionStyle = (dir) => {
  if (dir === "OUT") return "text-sky-600 bg-sky-50 border-sky-100";
  if (dir === "IN") return "text-purple-600 bg-purple-50 border-purple-100";
  return "text-slate-500 bg-slate-50 border-slate-100";
};

const getDirectionLabel = (dir) => {
  if (dir === "OUT") return t("log.direction.out");
  if (dir === "IN") return t("log.direction.in");
  return dir || "-";
};

const isErrorStatus = (status) => {
  if (!status) return false;
  const s = status.toUpperCase();
  return [
    'FAILED',
    'ERROR',
    'REJECT',
    'VALIDATION_FAILED',
    'ROUTING_FAILED',
    'TRANSFORMATION_FAILED',
    'SEND_FAILED',
    'ACK_TIMEOUT'
  ].includes(s);
};

const FullLogView = () => {
  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 15;

  useEffect(() => {
    setPage(0);
  }, [searchTerm]);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await gatewayApi.getMessageLog();
      setLogs(response?.content || []);
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu log:", error);
      toast.error(t("log.toast.fetchFailed"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  // Lọc dữ liệu theo trường thực tế của MessageConversionLog
  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    return (
      log.amqpMessageId?.toLowerCase().includes(searchLower) ||
      log.ipmId?.toLowerCase().includes(searchLower) ||
      log.mtsId?.toLowerCase().includes(searchLower) ||
      log.messageId?.toLowerCase().includes(searchLower) ||
      log.content?.toLowerCase().includes(searchLower) ||
      log.subject?.toLowerCase().includes(searchLower) ||
      log.type?.toLowerCase().includes(searchLower) ||
      log.category?.toLowerCase().includes(searchLower) ||
      log.status?.toLowerCase().includes(searchLower) ||
      log.origin?.toLowerCase().includes(searchLower) ||
      log.actionTaken?.toLowerCase().includes(searchLower) ||
      log.nonDeliveryReason?.toLowerCase().includes(searchLower) ||
      log.nonDeliveryDiagnostic?.toLowerCase().includes(searchLower) ||
      log.supplementaryInfo?.toLowerCase().includes(searchLower) ||
      log.remark?.toLowerCase().includes(searchLower) ||
      log.referenceId?.toString().includes(searchLower) ||
      log.id?.toString().includes(searchLower)
    );
  });

  const handleCopy = () => {
    if (selectedLog) {
      const timeStr = selectedLog.convertedTime ? new Date(selectedLog.convertedTime).toLocaleString() : "";
      const statusStr = selectedLog.status || "";
      const messageId = selectedLog.messageId || selectedLog.mtsId || selectedLog.ipmId || selectedLog.amqpMessageId || "";
      const dirStr = `${selectedLog.type || ""} (${selectedLog.category || ""})`;
      
      const copyParts = [
        `ID: ${selectedLog.id}`,
        `Time: ${timeStr}`,
        `Direction: ${dirStr}`,
        `Status: ${statusStr}`,
        `MsgId/MtsId/IpmId: ${messageId}`,
        `Origin: ${selectedLog.origin || ""}`,
        `Action: ${selectedLog.actionTaken || ""}`
      ];
      if (selectedLog.nonDeliveryReason) {
        copyParts.push(`Reason: ${selectedLog.nonDeliveryReason}`);
      }
      copyParts.push(`Content: ${selectedLog.content || ""}`);
      
      const copyText = copyParts.join(" | ");
      navigator.clipboard.writeText(copyText);
      toast.success(t("log.toast.copied"));
    }
  };

  const handleClear = () => {
    setLogs([]);
    setSelectedLog(null);
    toast.success(t("log.toast.noLogs"));
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        {/* TOOLBAR */}
        <div className="flex flex-wrap justify-between items-center bg-white border border-slate-200/80 p-4 rounded-xl shadow-xs gap-4">
          <div className="flex items-center gap-2">
            <button 
              onClick={handleClear}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg shadow-xs transition-all duration-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 active:scale-95 cursor-pointer"
            >
              <XCircle size={15}/>
              {t("log.toolbar.clear")}
            </button>
            <button 
              onClick={handleCopy}
              disabled={!selectedLog}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg shadow-xs transition-all duration-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-slate-600 disabled:hover:border-slate-200 cursor-pointer"
            >
              <Copy size={15}/>
              {t("log.toolbar.copy")}
            </button>
            <button 
              onClick={fetchLogs}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg shadow-xs transition-all duration-200 hover:bg-slate-50 hover:text-blue-600 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="animate-spin text-blue-500" size={15}/>
              ) : (
                <RefreshCcw size={15}/>
              )}
              {t("log.toolbar.update")}
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
            <input
              type="text"
              placeholder={t("log.toolbar.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 bg-slate-50/50 rounded-lg text-xs w-64 outline-none focus:border-indigo-500 focus:bg-white transition-all font-medium text-slate-800"
            />
          </div>
        </div>

        {/* MAIN LAYOUT SPLIT */}
        <div className="flex gap-4 items-start">
          {/* TABLE CONTAINER */}
          <div className="flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <th className="px-4 py-3 font-semibold text-xs">{t("log.table.id")}</th>
                    <th className="px-4 py-3 font-semibold text-xs">{t("log.table.time")}</th>
                    <th className="px-4 py-3 font-semibold text-xs">{t("log.table.dir")}</th>
                    <th className="px-4 py-3 font-semibold text-xs">{t("log.table.mtsId")}</th>
                    <th className="px-4 py-3 font-semibold text-xs">{t("log.table.ipmId")}</th>
                    <th className="px-4 py-3 font-semibold text-xs">{t("log.table.type")}</th>
                    <th className="px-4 py-3 font-semibold text-xs">{t("log.table.prio")}</th>
                    <th className="px-4 py-3 font-semibold text-xs">{t("log.table.message")}</th>
                    <th className="px-4 py-3 font-semibold text-xs">{t("log.table.origin")}</th>
                    <th className="px-4 py-3 font-semibold text-xs">{t("log.table.status")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-8 text-slate-400 font-medium">
                        {loading ? 'Loading logs...' : t("log.empty.title")}
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.slice(page * pageSize, (page + 1) * pageSize).map((log) => {
                      const isSelected = selectedLog?.id === log.id;
                      const isError = isErrorStatus(log.status);
                      
                      return (
                        <tr
                          key={log.id}
                          onClick={() => setSelectedLog(log)}
                          className={`cursor-pointer transition-all duration-150 border-b border-slate-100 ${
                            isSelected
                              ? isError 
                                ? "bg-rose-100 hover:bg-rose-200/70 text-slate-900" 
                                : "bg-blue-50/90 text-slate-900 font-semibold ring-1 ring-blue-100/50"
                              : isError
                                ? "bg-rose-50/30 hover:bg-rose-50/80 text-rose-950"
                                : "hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <td className="px-4 py-3 font-semibold text-slate-500">{log.id}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {log.convertedTime ? new Date(log.convertedTime).toLocaleString() : ""}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getDirectionStyle(log.category)}`}>
                              {getDirectionLabel(log.category)}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] truncate max-w-[120px]" title={log.mtsId}>
                            {log.mtsId || "-"}
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] truncate max-w-[120px]" title={log.ipmId}>
                            {log.ipmId || "-"}
                          </td>
                          <td className="px-4 py-3 font-medium text-center">{log.type}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`${getPriorityStyle(log.priority)}`}>
                              {log.priority || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3 max-w-[200px] truncate" title={log.content}>
                            {log.content}
                          </td>
                          <td className="px-4 py-3 max-w-[150px] truncate font-medium text-slate-500" title={log.origin}>
                            {log.origin || "-"}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusStyle(log.status)}`}>
                              {getStatusLabel(log.status)}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <TablePagination
              page={page}
              totalPages={Math.ceil(filteredLogs.length / pageSize)}
              onPageChange={setPage}
              totalItems={filteredLogs.length}
            />
          </div>

          {/* PREVIEW PANEL */}
          {selectedLog && (
            <div className="w-[480px] bg-white border border-slate-200 rounded-xl p-5 shadow-xs shrink-0 flex flex-col gap-4 self-start sticky top-4 max-h-[calc(100vh-140px)] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileText className="text-indigo-600" size={16} />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{t("log.preview.title")}</h3>
                </div>
                <button 
                  onClick={() => setSelectedLog(null)} 
                  className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <XCircle size={18}/>
                </button>
              </div>
              
              <div className="flex flex-col gap-3 text-xs">
                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="font-semibold text-slate-400">Log ID:</span>
                  <span className="font-mono text-slate-800 font-semibold text-right">#{selectedLog.id}</span>
                </div>
                
                {selectedLog.referenceId && (
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="font-semibold text-slate-400">Reference ID:</span>
                    <span className="font-mono text-slate-800 text-right">{selectedLog.referenceId}</span>
                  </div>
                )}

                {selectedLog.messageId && (
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="font-semibold text-slate-400">Message ID:</span>
                    <span className="font-mono text-slate-800 text-right break-all max-w-[280px]" title={selectedLog.messageId}>
                      {selectedLog.messageId}
                    </span>
                  </div>
                )}

                {selectedLog.mtsId && (
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="font-semibold text-slate-400">{t("log.preview.mtsId")}</span>
                    <span className="font-mono text-slate-800 text-right break-all max-w-[280px]" title={selectedLog.mtsId}>
                      {selectedLog.mtsId}
                    </span>
                  </div>
                )}

                {selectedLog.ipmId && (
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="font-semibold text-slate-400">{t("log.preview.ipmId")}</span>
                    <span className="font-mono text-slate-800 text-right break-all max-w-[280px]" title={selectedLog.ipmId}>
                      {selectedLog.ipmId}
                    </span>
                  </div>
                )}

                {selectedLog.amqpMessageId && (
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="font-semibold text-slate-400">{t("log.preview.amqpMessageId")}</span>
                    <span className="font-mono text-slate-800 text-right break-all max-w-[280px]" title={selectedLog.amqpMessageId}>
                      {selectedLog.amqpMessageId}
                    </span>
                  </div>
                )}

                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="font-semibold text-slate-400">{t("log.preview.convertedTime")}</span>
                  <span className="text-slate-800 font-medium">
                    {selectedLog.convertedTime ? new Date(selectedLog.convertedTime).toLocaleString() : "-"}
                  </span>
                </div>

                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="font-semibold text-slate-400">{t("log.preview.status")}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusStyle(selectedLog.status)}`}>
                    {getStatusLabel(selectedLog.status)}
                  </span>
                </div>

                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="font-semibold text-slate-400">{t("log.preview.direction")}</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getDirectionStyle(selectedLog.category)}`}>
                    {selectedLog.type} ({getDirectionLabel(selectedLog.category)})
                  </span>
                </div>

                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="font-semibold text-slate-400">{t("log.preview.priority")}</span>
                  <span className={`text-xs font-semibold ${getPriorityStyle(selectedLog.priority)}`}>
                    {selectedLog.priority || '-'}
                  </span>
                </div>

                <div className="flex justify-between border-b border-slate-50 pb-2">
                  <span className="font-semibold text-slate-400">{t("log.preview.origin")}</span>
                  <span className="text-slate-700 font-medium truncate max-w-[280px]" title={selectedLog.origin}>
                    {selectedLog.origin || "-"}
                  </span>
                </div>

                {selectedLog.subject && (
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="font-semibold text-slate-400">{t("log.preview.subject")}</span>
                    <span className="text-slate-700 font-medium truncate max-w-[280px]" title={selectedLog.subject}>
                      {selectedLog.subject}
                    </span>
                  </div>
                )}

                {selectedLog.actionTaken && (
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="font-semibold text-slate-400">{t("log.preview.actionTaken")}</span>
                    <span className="text-slate-700 font-semibold">{selectedLog.actionTaken}</span>
                  </div>
                )}

                {selectedLog.nonDeliveryReason && (
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="font-semibold text-rose-500">{t("log.preview.nonDeliveryReason")}</span>
                    <span className="text-rose-700 font-mono font-medium">{selectedLog.nonDeliveryReason}</span>
                  </div>
                )}

                {selectedLog.nonDeliveryDiagnostic && (
                  <div className="flex justify-between border-b border-slate-50 pb-2">
                    <span className="font-semibold text-rose-500">{t("log.preview.nonDeliveryDiagnostic")}</span>
                    <span className="text-rose-700 font-mono font-medium">{selectedLog.nonDeliveryDiagnostic}</span>
                  </div>
                )}

                {selectedLog.supplementaryInfo && (
                  <div className="flex flex-col gap-1 border-b border-slate-50 pb-2">
                    <span className="font-semibold text-slate-400">{t("log.preview.supplementaryInfo")}</span>
                    <span className="text-slate-700 break-words">{selectedLog.supplementaryInfo}</span>
                  </div>
                )}

                {selectedLog.remark && (
                  <div className="flex flex-col gap-1 border-b border-slate-50 pb-2">
                    <span className="font-semibold text-slate-400">{t("log.preview.remark")}</span>
                    <span className="text-slate-700 break-words">{selectedLog.remark}</span>
                  </div>
                )}
              </div>

              {/* MESSAGE CONTENT VIEW */}
              <div className="flex flex-col gap-3.5 mt-1 pt-3 border-t border-slate-100">
                <div>
                  <span className="font-semibold text-slate-500 block mb-1.5 text-[11px]">{t("log.preview.content")}</span>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 font-mono text-[11px] text-slate-800 whitespace-pre-wrap max-h-48 overflow-y-auto custom-scrollbar">
                    {selectedLog.content || "No content available"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FullLogView;