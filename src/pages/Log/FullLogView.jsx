import React, { useState, useEffect, useCallback } from "react";
import {
  XCircle,
  Copy,
  Check,
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


const formatActionTaken = (action) => {
  if (!action) return "-";
  const norm = String(action).toLowerCase().replace(/[\s\-_]+/g, '_');
  if (norm.includes("routing_failed")) return t("log.actionTaken.routing_failed");
  if (norm.includes("validation_failed") || norm.includes("invalid")) return t("log.actionTaken.validation_failed");
  if (norm.includes("unauthorized")) return t("log.actionTaken.unauthorized");
  if (norm.includes("ttl_expired")) return t("log.actionTaken.ttl_expired");
  if (norm.includes("type_detection")) return t("log.actionTaken.type_detection_failed");
  if (norm.includes("ndr")) return t("log.actionTaken.ndr");
  if (norm.includes("received") && norm.includes("routing")) return t("log.actionTaken.received_routed");
  if (norm.includes("publish")) return t("log.actionTaken.published_swim");
  if (norm.includes("deliver")) return t("log.actionTaken.delivered_amhs");
  if (norm.includes("unrouted")) return t("log.actionTaken.unrouted_queue");
  return action;
};

const getStatusLabel = (status) => {
  if (!status) return "-";
  const statusKey = status.toLowerCase();
  const label = t("log.status." + statusKey);
  return label !== "log.status." + statusKey ? label : status.toUpperCase();
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
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    setPage(0);
  }, [searchTerm]);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await gatewayApi.getMessageLog({ page, size: pageSize });
      setLogs(response?.items || response?.content || []);
      setTotalElements(response?.totalItems ?? response?.totalElements ?? 0);
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu log:", error);
      toast.error(t("log.toast.fetchFailed"));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

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
      log.id?.toString().includes(searchLower)
    );
  });

  const handleCopy = () => {
    if (selectedLog) {
      const copyText = selectedLog.content || selectedLog.actionTaken || "";
      navigator.clipboard.writeText(copyText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
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
      <div className="flex flex-col gap-4 relative">
        {/* TOOLBAR */}
        <div className="flex flex-wrap justify-between items-center bg-white border border-slate-200 p-4 rounded-xl shadow-xs gap-4">
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
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg shadow-xs transition-all duration-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Copy size={15}/>
              {t("log.toolbar.copy")}
            </button>
          </div>

          {/* SEARCH INPUT */}
          <div className="relative flex-1 max-w-md">
            <input 
              type="text" 
              placeholder={t("log.filter.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 focus:bg-white font-medium"
            />
            <FileText size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <XCircle size={14} />
              </button>
            )}
          </div>
        </div>

        {/* TABLE CONTAINER */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 tracking-wider border-b border-slate-200">
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
                      {loading ? 'Đang tải nhật ký...' : t("log.empty.title")}
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const isSelected = selectedLog?.id === log.id;
                    const isError = isErrorStatus(log.status);
                    
                    return (
                      <tr
                        key={log.id}
                        onClick={() => setSelectedLog(log)}
                        className={`cursor-pointer transition-all duration-150 border-b border-slate-100 ${
                          isSelected
                            ? isError 
                              ? "bg-rose-100 text-slate-900" 
                              : "bg-indigo-50/90 text-slate-900 font-semibold ring-1 ring-indigo-200"
                            : isError
                              ? "bg-rose-50/30 text-rose-950 hover:bg-rose-50/80"
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
                        <td className="px-4 py-3 max-w-[220px] truncate font-mono text-[11px]" title={log.content}>
                          {log.content || "-"}
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
            totalPages={Math.ceil(totalElements / pageSize)}
            onPageChange={setPage}
            totalItems={totalElements}
            pageSize={pageSize}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(0);
            }}
          />
        </div>

        {/* VIEWPORT-FIXED CENTER MODAL */}
        {selectedLog && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex justify-center items-center p-4 animate-fade-in" onClick={() => setSelectedLog(null)}>
            <div className="w-[700px] max-w-full bg-white max-h-[88vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-zoom-in border border-slate-200" onClick={(e) => e.stopPropagation()}>
              
              {/* MODAL HEADER */}
              <div className="px-6 py-4 bg-white text-slate-900 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 text-slate-700 rounded-xl border border-slate-200">
                    <FileText size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-slate-900">{t("log.modal.title")} #{selectedLog.id}</h3>
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {getDirectionLabel(selectedLog.category)}
                      </span>
                    </div>
                    {(selectedLog.messageId || selectedLog.mtsId || selectedLog.ipmId || selectedLog.referenceId) && (
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {selectedLog.messageId || selectedLog.mtsId || selectedLog.ipmId || selectedLog.referenceId}
                      </p>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  <XCircle size={20} />
                </button>
              </div>

              {/* MODAL BODY */}
              <div className="p-6 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4 text-xs">
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-400">{t("log.modal.direction")}</span>
                    <span className="font-semibold text-slate-800">{getDirectionLabel(selectedLog.category)} ({selectedLog.type})</span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-400">{t("log.modal.status")}</span>
                    <div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusStyle(selectedLog.status)}`}>
                        {getStatusLabel(selectedLog.status)}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-400">{t("log.modal.origin")}</span>
                    <span className="font-mono font-bold text-slate-800">{selectedLog.origin || "-"}</span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-400">{t("log.modal.convertedTime")}</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {selectedLog.convertedTime ? new Date(selectedLog.convertedTime).toLocaleString() : "-"}
                    </span>
                  </div>
                </div>

                

                {selectedLog.nonDeliveryReason && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-rose-600">{t("log.modal.nonDeliveryReason")}</span>
                    <span className="font-mono font-bold text-rose-800">{selectedLog.nonDeliveryReason}</span>
                  </div>
                )}

                {/* RAW CONTENT CODE BLOCK */}
                <div className="flex flex-col gap-2 flex-1 min-h-[160px]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">{t("log.modal.rawContent")}</span>
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1 text-[11px] text-indigo-650 hover:underline font-semibold cursor-pointer"
                    >
                      {isCopied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      {isCopied ? t("log.modal.copied") : t("log.modal.copy")}
                    </button>
                  </div>

                  <div className="relative rounded-xl overflow-hidden border border-slate-300 bg-slate-50 flex-1 min-h-[140px] shadow-inner">
                    <pre className="p-4 text-slate-900 font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed custom-scrollbar h-full max-h-[250px] font-semibold">
                      {selectedLog.content || selectedLog.remark || selectedLog.subject || selectedLog.supplementaryInfo || t("log.modal.noContent")}
                    </pre>
                  </div>
                </div>

              </div>

              {/* MODAL FOOTER */}
              <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold rounded-lg transition-all cursor-pointer shadow-xs"
                >
                  {t("log.modal.close")}
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default FullLogView;
