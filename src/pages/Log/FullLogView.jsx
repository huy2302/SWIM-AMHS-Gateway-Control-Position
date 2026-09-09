import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  XCircle,
  Copy,
  Check,
  FileText,
  Search,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  Clock,
  Send,
  Layers,
  ArrowRightLeft,
  FilterX,
  ExternalLink
} from "lucide-react";
import toast from "react-hot-toast";
import DashboardLayout from "@/layout/DashboardLayout";
import gatewayApi from "@/api/gatewayApi";
import TablePagination from "@/components/TablePagination";
import { t } from "@/i18n/translator";

/**
 * Chuẩn hóa hướng truyền điện văn
 */
const normalizeDirection = (cat, type) => {
  const str = String(cat || type || "").toUpperCase();
  if (str.includes("IN") || str.includes("SWIM_TO_AMHS") || str.includes("SWIM")) return "IN";
  if (str.includes("OUT") || str.includes("AMHS_TO_SWIM") || str.includes("AMHS")) return "OUT";
  return "OTHER";
};

const getDirectionMeta = (cat, type) => {
  const dir = normalizeDirection(cat, type);
  if (dir === "IN") {
    return {
      label: t("log.toolbar.directionIn"),
      shortLabel: "IN",
      badgeClass: "text-purple-700 bg-purple-50 border-purple-200",
      type: "IN"
    };
  }
  if (dir === "OUT") {
    return {
      label: t("log.toolbar.directionOut"),
      shortLabel: "OUT",
      badgeClass: "text-sky-700 bg-sky-50 border-sky-200",
      type: "OUT"
    };
  }
  return {
    label: cat || type || "-",
    shortLabel: "-",
    badgeClass: "text-slate-600 bg-slate-50 border-slate-200",
    type: "OTHER"
  };
};

/**
 * Style & label cho trạng thái xử lý
 */
const getStatusStyle = (status) => {
  if (!status) return "bg-slate-50 text-slate-600 border-slate-200/70";

  switch (String(status).toUpperCase()) {
    case "OK":
    case "SUCCESS":
    case "ACK_RECEIVED":
    case "DELIVERED":
    case "PUBLISHED":
    case "TRANSFORMED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200/80";
    case "WAITING_ACK":
    case "SENDING":
    case "VALIDATING":
    case "ROUTING":
    case "TRANSFORMING":
    case "PENDING":
      return "bg-sky-50 text-sky-700 border-sky-200/80";
    case "UNROUTED":
    case "ROUTING_FAILED":
      return "bg-amber-50 text-amber-700 border-amber-200/80";
    case "ERROR":
    case "REJECTED":
    case "FAILED":
    case "VALIDATION_FAILED":
    case "TRANSFORMATION_FAILED":
    case "SEND_FAILED":
    case "ACK_TIMEOUT":
      return "bg-rose-50 text-rose-700 border-rose-200/80";
    case "RESOLVED":
      return "bg-teal-50 text-teal-700 border-teal-200/80";
    case "CANCELLED":
      return "bg-slate-50 text-slate-700 border-slate-200/80";
    default:
      return "bg-slate-50 text-slate-600 border-slate-200/70";
  }
};

const getStatusLabel = (status) => {
  if (!status) return "-";
  const statusKey = String(status).toUpperCase();
  const label = t("log.status." + statusKey);
  return label !== "log.status." + statusKey ? label : statusKey;
};

const isErrorStatus = (status) => {
  if (!status) return false;
  const s = String(status).toUpperCase();
  return [
    'FAILED',
    'ERROR',
    'REJECTED',
    'VALIDATION_FAILED',
    'ROUTING_FAILED',
    'TRANSFORMATION_FAILED',
    'SEND_FAILED',
    'ACK_TIMEOUT'
  ].includes(s);
};

/**
 * Format hành động xử lý
 */
const formatActionTaken = (action) => {
  if (!action) return "-";
  const norm = String(action).toLowerCase().replace(/[\s\-_]+/g, '_');

  // --- Probe (CTSW011/012/013) ---
  // Phải xét TRƯỚC luật chung: "probe_deliverable" và "undeliverable" đều chứa chuỗi "deliver".
  if (norm.startsWith("probe_unknown_recipient")) return t("log.actionTaken.probe_unknown_recipient");
  if (norm.startsWith("probe_deliverable")) return t("log.actionTaken.probe_deliverable");
  if (norm.startsWith("probe_rejected")) return t("log.actionTaken.probe_rejected");
  if (norm.includes("undeliverable")) return t("log.actionTaken.undeliverable");

  // --- Phản hồi AMHS bay ngược về (CTSW014/015/113/114) ---
  if (norm.startsWith("misrouted_ipn")) return t("log.actionTaken.misrouted_ipn");
  if (norm.startsWith("ipn_rejected_priority")) return t("log.actionTaken.ipn_rejected_priority");
  if (norm.startsWith("dr_received")) return t("log.actionTaken.dr_received");
  if (norm.startsWith("ndr_received")) return t("log.actionTaken.ndr_received");

  // --- Chiều AMHS → SWIM: tiếp nhận và chuyển tiếp ---
  if (norm.startsWith("dr_requested")) return t("log.actionTaken.dr_requested");
  if (norm.startsWith("forwarded_unchanged")) return t("log.actionTaken.forwarded_unchanged");
  if (norm.startsWith("received_amqp_property")) return t("log.actionTaken.received_amqp_property");
  if (norm.startsWith("received_routing_rule")) return t("log.actionTaken.received_routing_rule");
  if (norm.startsWith("received_unresolved")) return t("log.actionTaken.received_unresolved");

  // --- Từ chối ở mức recipient ---
  if (norm.startsWith("unrecognised_recipient")) return t("log.actionTaken.unrecognised_recipient");
  if (norm.startsWith("no_route")) return t("log.actionTaken.no_route");
  if (norm.startsWith("no_recipients")) return t("log.actionTaken.no_recipients");
  if (norm.startsWith("invalid_recipients")) return t("log.actionTaken.invalid_recipients");

  // --- Từ chối ở mức bản tin (13 nhánh NDR của Appendix A) ---
  if (norm.startsWith("unsupported_eit")) return t("log.actionTaken.unsupported_eit");
  if (norm.startsWith("unsupported_content_type")) return t("log.actionTaken.unsupported_content_type");
  if (norm.startsWith("unsupported_body_parts")) return t("log.actionTaken.unsupported_body_parts");
  if (norm.startsWith("unsupported_repertoire")) return t("log.actionTaken.unsupported_repertoire");
  if (norm.startsWith("ats_header_syntax_error")) return t("log.actionTaken.ats_header_syntax_error");
  if (norm.startsWith("invalid_origin_format")) return t("log.actionTaken.invalid_origin_format");
  if (norm.startsWith("processing_failed")) return t("log.actionTaken.processing_failed");
  if (norm.includes("ttl_expired")) return t("log.actionTaken.ttl_expired");
  if (norm.includes("routing_failed")) return t("log.actionTaken.routing_failed");
  if (norm.includes("unauthorized")) return t("log.actionTaken.unauthorized");
  if (norm.includes("validation_failed") || norm.includes("invalid")) return t("log.actionTaken.validation_failed");

  return action;
};

/**
 * ATS Priority styling
 */
const getPriorityBadge = (priority) => {
  if (!priority) return <span className="text-slate-400 font-mono text-xs">-</span>;
  const p = String(priority).toUpperCase();
  let colorClass = "bg-slate-100 text-slate-700 border-slate-200";
  if (p.startsWith("SS")) colorClass = "bg-rose-100 text-rose-800 border-rose-200 font-black";
  else if (p.startsWith("DD")) colorClass = "bg-amber-100 text-amber-800 border-amber-200 font-bold";
  else if (p.startsWith("FF")) colorClass = "bg-yellow-100 text-yellow-800 border-yellow-200 font-bold";
  else if (p.startsWith("GG")) colorClass = "bg-cyan-100 text-cyan-800 border-cyan-200 font-bold";
  else if (p.startsWith("KK")) colorClass = "bg-slate-100 text-slate-600 border-slate-200 font-medium";

  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${colorClass}`}>
      {priority}
    </span>
  );
};

/**
 * Định dạng nội dung chi tiết (prettify nếu là JSON)
 */
const formatRawContent = (content) => {
  if (!content) return "";
  if (typeof content === "object") {
    try {
      return JSON.stringify(content, null, 2);
    } catch {
      return String(content);
    }
  }
  const str = String(content).trim();
  if ((str.startsWith("{") && str.endsWith("}")) || (str.startsWith("[") && str.endsWith("]"))) {
    try {
      const parsed = JSON.parse(str);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return str;
    }
  }
  return str;
};

const FullLogView = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState({
    direction: "ALL",
    status: "ALL",
    timeRange: "ALL"
  });
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [isModalCopied, setIsModalCopied] = useState(false);

  // Navigate directly to Message View
  const handleNavigateToMessage = (log, e) => {
    if (e) e.stopPropagation();
    if (!log) return;
    const dirMeta = getDirectionMeta(log.category, log.type);
    const targetType = dirMeta.type === "IN" ? "AMQP" : "X400";
    const searchKey = log.amqpMessageId || log.messageId || log.mtsId || log.ipmId || "";
    navigate("/messages", {
      state: {
        searchQuery: searchKey,
        searchType: targetType,
        autoOpen: true
      }
    });
  };

  // Debounce search term (350ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setPage(0);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Tính toán startTime / endTime dựa trên timeRange
  const getTimeRangeParams = useCallback(() => {
    if (filters.timeRange === "ALL") return {};
    const now = new Date();
    let startTime = null;

    if (filters.timeRange === "TODAY") {
      startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    } else if (filters.timeRange === "24H") {
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    } else if (filters.timeRange === "7D") {
      startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    }

    return startTime ? { startTime, endTime: now.toISOString() } : {};
  }, [filters.timeRange]);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const timeParams = getTimeRangeParams();
      const params = {
        page,
        size: pageSize,
        ...(filters.direction !== "ALL" && { direction: filters.direction }),
        ...(filters.status !== "ALL" && { status: filters.status }),
        ...(debouncedSearch && { search: debouncedSearch, keyword: debouncedSearch }),
        ...timeParams
      };

      const response = await gatewayApi.getMessageLog(params);

      const items = response?.items || response?.content || (Array.isArray(response) ? response : []);
      const total = response?.totalItems ?? response?.totalElements ?? items.length;

      setLogs(items);
      setTotalElements(total);
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu log:", error);
      toast.error(t("log.toast.fetchFailed"));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters, debouncedSearch, getTimeRangeParams]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Client-side search fallback nếu backend không filter theo search
  const displayedLogs = React.useMemo(() => {
    if (!debouncedSearch) return logs;
    const s = debouncedSearch.toLowerCase();
    return logs.filter(log => {
      const matchText = [
        log.id,
        log.mtsId,
        log.ipmId,
        log.amqpMessageId,
        log.messageId,
        log.origin,
        log.status,
        log.actionTaken,
        log.rejectionSource,
        log.rejectionReason,
        log.rejectionDiagnostic,
        log.subject,
        log.remark
      ].filter(Boolean).join(" ").toLowerCase();
      return matchText.includes(s);
    });
  }, [logs, debouncedSearch]);

  const handleCopyRaw = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setIsModalCopied(true);
    setTimeout(() => setIsModalCopied(false), 2000);
    toast.success(t("log.toast.copied"));
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setFilters({ direction: "ALL", status: "ALL", timeRange: "ALL" });
    setPage(0);
  };

  const hasActiveFilters = filters.direction !== "ALL" || filters.status !== "ALL" || filters.timeRange !== "ALL" || Boolean(searchTerm);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 relative">
        
        {/* TOP TOOLBAR & ADVANCED FILTER */}
        <div className="flex flex-wrap justify-between items-center bg-white border border-slate-200 p-4 rounded-xl shadow-xs gap-3">
          
          {/* FILTER CONTROLS */}
          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* Direction Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 shrink-0">
              <span className="text-[11px] text-slate-500 font-bold">{t("log.toolbar.direction")}</span>
              <select
                value={filters.direction}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, direction: e.target.value }));
                  setPage(0);
                }}
                className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
              >
                <option value="ALL">{t("log.toolbar.allDirections")}</option>
                <option value="SWIM_TO_AMHS">{t("log.toolbar.directionIn")}</option>
                <option value="AMHS_TO_SWIM">{t("log.toolbar.directionOut")}</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 shrink-0">
              <span className="text-[11px] text-slate-500 font-bold">{t("log.toolbar.status")}</span>
              <select
                value={filters.status}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, status: e.target.value }));
                  setPage(0);
                }}
                className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
              >
                <option value="ALL">{t("log.toolbar.allStatuses")}</option>
                <option value="SUCCESS">{t("log.status.SUCCESS")}</option>
                <option value="FAILED">{t("log.status.FAILED")}</option>
                <option value="REJECTED">{t("log.status.REJECTED")}</option>
                <option value="UNROUTED">{t("log.status.UNROUTED")}</option>
                <option value="PENDING">{t("log.status.PENDING")}</option>
                <option value="ERROR">{t("log.status.ERROR")}</option>
              </select>
            </div>

            {/* Time Range Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 shrink-0">
              <Clock size={13} className="text-slate-400" />
              <span className="text-[11px] text-slate-500 font-bold">{t("log.toolbar.timeRange")}</span>
              <select
                value={filters.timeRange}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, timeRange: e.target.value }));
                  setPage(0);
                }}
                className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
              >
                <option value="ALL">{t("log.toolbar.allTime")}</option>
                <option value="TODAY">{t("log.toolbar.today")}</option>
                <option value="24H">{t("log.toolbar.last24h")}</option>
                <option value="7D">{t("log.toolbar.last7d")}</option>
              </select>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => fetchLogs()}
              disabled={loading}
              className="p-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-650 rounded-lg hover:text-slate-900 shadow-xs active:scale-95 transition-all cursor-pointer flex items-center justify-center h-8 w-8 disabled:opacity-50"
              title={t("log.toolbar.refresh")}
            >
              <RefreshCw size={13} className={loading ? "animate-spin text-indigo-600" : ""} />
            </button>

            {/* Clear Filter Button */}
            {hasActiveFilters && (
              <button 
                onClick={handleResetFilters}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                <FilterX size={13} />
                <span>{t("log.toolbar.clear")}</span>
              </button>
            )}
          </div>

          {/* SEARCH INPUT WITH ICON */}
          <div className="relative flex-1 max-w-md min-w-[240px]">
            <input 
              type="text" 
              placeholder={t("log.filter.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 focus:bg-white font-medium transition-all"
            />
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <XCircle size={14} />
              </button>
            )}
          </div>

        </div>

        {/* LOG DATA TABLE */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 tracking-wider border-b border-slate-200 select-none">
                  <th className="px-4 py-3 font-semibold w-12 text-center">{t("log.table.id")}</th>
                  <th className="px-4 py-3 font-semibold w-40">{t("log.table.time")}</th>
                  <th className="px-4 py-3 font-semibold w-36">{t("log.table.dir")}</th>
                  <th className="px-4 py-3 font-semibold">{t("log.table.identifier")}</th>
                  <th className="px-4 py-3 font-semibold w-28">{t("log.table.origin")}</th>
                  <th className="px-4 py-3 font-semibold w-20 text-center">{t("log.table.prio")}</th>
                  <th className="px-4 py-3 font-semibold">{t("log.table.actionTaken")}</th>
                  <th className="px-4 py-3 font-semibold w-36">{t("log.table.status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-slate-400 font-medium">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-6 h-6 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin" />
                        <span>{t("log.toolbar.loading")}</span>
                      </div>
                    </td>
                  </tr>
                ) : displayedLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-14 text-slate-400 font-medium">
                      <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                        <AlertCircle size={32} className="text-slate-300" />
                        <span className="font-semibold text-slate-650 text-sm">{t("log.empty.title")}</span>
                        <span className="text-xs text-slate-400">{t("log.empty.subtitle")}</span>
                        {hasActiveFilters && (
                          <button
                            onClick={handleResetFilters}
                            className="mt-2 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer border border-indigo-200"
                          >
                            {t("log.empty.resetBtn")}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedLogs.map((log) => {
                    const isSelected = selectedLog?.id === log.id;
                    const isError = isErrorStatus(log.status);
                    const dirMeta = getDirectionMeta(log.category, log.type);
                    
                    // Smart identifier fallback
                    const identifier = dirMeta.type === "IN"
                      ? (log.amqpMessageId || log.messageId || log.mtsId || "-")
                      : (log.mtsId || log.ipmId || log.amqpMessageId || log.messageId || "-");

                    return (
                      <tr
                        key={log.id}
                        onClick={() => setSelectedLog(log)}
                        className={`cursor-pointer transition-all duration-150 border-b border-slate-100 ${
                          isSelected
                            ? "bg-indigo-50/90 text-slate-900 font-semibold ring-1 ring-indigo-200"
                            : isError
                              ? "bg-rose-50/35 text-rose-950 hover:bg-rose-50/80"
                              : "hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        {/* ID */}
                        <td className="px-4 py-3 text-center font-mono font-semibold text-slate-500">
                          #{log.id}
                        </td>

                        {/* Converted Time */}
                        <td className="px-4 py-3 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                          {log.convertedTime ? new Date(log.convertedTime).toLocaleString() : "-"}
                        </td>

                        {/* Direction Badge */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border inline-flex items-center gap-1 ${dirMeta.badgeClass}`}>
                            <ArrowRightLeft size={11} />
                            <span>{dirMeta.label}</span>
                          </span>
                        </td>

                        {/* Smart Identifier */}
                        <td className="px-4 py-3 font-mono text-[11px] max-w-[200px] truncate" title={identifier}>
                          <div className="flex items-center gap-1.5 group">
                            <span className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                              {identifier}
                            </span>
                            {identifier !== "-" && (
                              <button
                                onClick={(e) => handleNavigateToMessage(log, e)}
                                title={t("log.modal.viewMessage")}
                                className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-blue-600 hover:bg-blue-50 transition-all cursor-pointer shrink-0"
                              >
                                <ExternalLink size={12} />
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Originator */}
                        <td className="px-4 py-3 font-mono font-bold text-slate-800 truncate max-w-[120px]" title={log.origin}>
                          {log.origin || "-"}
                        </td>

                        {/* Priority */}
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          {getPriorityBadge(log.priority)}
                        </td>

                        {/* Action Taken */}
                        <td className="px-4 py-3 font-mono text-[11px] max-w-[220px] truncate" title={log.actionTaken || "-"}>
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 text-[10px] font-semibold">
                            {formatActionTaken(log.actionTaken)}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border inline-block w-fit ${getStatusStyle(log.status)}`}>
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

          {/* TABLE PAGINATION */}
          <TablePagination
            page={page}
            totalPages={Math.ceil(totalElements / pageSize) || 1}
            onPageChange={setPage}
            totalItems={totalElements}
            pageSize={pageSize}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(0);
            }}
          />
        </div>

        {/* LOG DETAIL MODAL */}
        {selectedLog && (() => {
          const dirMeta = getDirectionMeta(selectedLog.category, selectedLog.type);
          const rawContentFormatted = formatRawContent(selectedLog.content || selectedLog.payloadContent || selectedLog.remark || selectedLog.subject || "");

          return (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex justify-center items-center p-4 animate-fade-in" onClick={() => setSelectedLog(null)}>
              <div className="w-[820px] max-w-full bg-white max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-zoom-in border border-slate-200" onClick={(e) => e.stopPropagation()}>
                
                {/* MODAL HEADER */}
                <div className="px-6 py-4 bg-white text-slate-900 border-b border-slate-200 flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-base text-slate-900 m-0">{t("log.modal.title")} #{selectedLog.id}</h3>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${dirMeta.badgeClass}`}>
                        {dirMeta.label}
                      </span>
                      {selectedLog.referenceId && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Ref: #{selectedLog.referenceId}
                        </span>
                      )}
                    </div>
                    {(selectedLog.messageId || selectedLog.mtsId || selectedLog.ipmId || selectedLog.amqpMessageId) && (
                      <p className="text-[11px] text-slate-500 font-mono mt-1 truncate max-w-md" title={selectedLog.messageId || selectedLog.mtsId || selectedLog.ipmId || selectedLog.amqpMessageId}>
                        ID: {selectedLog.messageId || selectedLog.mtsId || selectedLog.ipmId || selectedLog.amqpMessageId}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleCopyRaw(rawContentFormatted)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-all cursor-pointer"
                    >
                      {isModalCopied ? t("log.modal.copied") : t("log.modal.copy")}
                    </button>
                    <button
                      onClick={() => setSelectedLog(null)}
                      className="px-2.5 py-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-md text-sm font-bold transition-colors cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                {/* MODAL BODY */}
                <div className="p-6 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4 text-xs">
                  
                  {/* 1. OVERVIEW STAT CARDS */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("log.modal.direction")}</span>
                      <span className="font-bold text-slate-800 text-xs truncate" title={dirMeta.label}>{dirMeta.shortLabel} ({selectedLog.type || "MSG"})</span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("log.modal.status")}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border inline-block w-fit ${getStatusStyle(selectedLog.status)}`}>
                        {getStatusLabel(selectedLog.status)}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("log.modal.origin")}</span>
                      <span className="font-mono font-bold text-slate-800 text-xs truncate" title={selectedLog.origin || "-"}>{selectedLog.origin || "-"}</span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("log.modal.convertedTime")}</span>
                      <span className="font-mono font-semibold text-slate-700 text-xs truncate" title={selectedLog.convertedTime ? new Date(selectedLog.convertedTime).toLocaleString() : "-"}>
                        {selectedLog.convertedTime ? new Date(selectedLog.convertedTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "-"}
                      </span>
                    </div>
                  </div>

                  {/* 2. TECHNICAL METADATA SECTION */}
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs flex flex-col">
                    <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                      {t("log.modal.technicalInfo")}
                    </div>

                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5 text-xs">
                      <div className="flex justify-between items-center py-1 border-b border-slate-100 gap-2 min-w-0">
                        <span className="text-slate-500 font-medium shrink-0">{t("log.modal.actionTaken")}:</span>
                        <span className="font-mono font-semibold text-slate-800 truncate text-right flex-1" title={selectedLog.actionTaken || "-"}>
                          {formatActionTaken(selectedLog.actionTaken)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-1 border-b border-slate-100 gap-2 min-w-0">
                        <span className="text-slate-500 font-medium shrink-0">{t("log.modal.priority")}:</span>
                        <div className="shrink-0">{getPriorityBadge(selectedLog.priority)}</div>
                      </div>

                      <div className="flex justify-between items-center py-1 border-b border-slate-100 gap-2 min-w-0">
                        <span className="text-slate-500 font-medium shrink-0">{t("log.modal.filingTime")}:</span>
                        <span className="font-mono font-semibold text-slate-800 truncate text-right flex-1" title={selectedLog.filingTime || "-"}>
                          {selectedLog.filingTime || "-"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-1 border-b border-slate-100 gap-2 min-w-0">
                        <span className="text-slate-500 font-medium shrink-0">{t("log.modal.referenceId")}:</span>
                        <span className="font-mono font-bold text-indigo-700 truncate text-right flex-1" title={selectedLog.referenceId ? `#${selectedLog.referenceId}` : "-"}>
                          {selectedLog.referenceId ? `#${selectedLog.referenceId}` : "-"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-1 border-b border-slate-100 gap-2 min-w-0">
                        <span className="text-slate-500 font-medium shrink-0">{t("log.modal.mtsId")}:</span>
                        <span className="font-mono font-semibold text-slate-800 truncate text-right flex-1" title={selectedLog.mtsId || "-"}>
                          {selectedLog.mtsId || "-"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-1 border-b border-slate-100 gap-2 min-w-0">
                        <span className="text-slate-500 font-medium shrink-0">{t("log.modal.ipmId")}:</span>
                        <span className="font-mono font-semibold text-slate-800 truncate text-right flex-1" title={selectedLog.ipmId || "-"}>
                          {selectedLog.ipmId || "-"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-1 border-b border-slate-100 gap-2 min-w-0">
                        <span className="text-slate-500 font-medium shrink-0">{t("log.modal.amqpMessageId")}:</span>
                        <span className="font-mono font-semibold text-slate-800 truncate text-right flex-1" title={selectedLog.amqpMessageId || selectedLog.messageId || "-"}>
                          {selectedLog.amqpMessageId || selectedLog.messageId || "-"}
                        </span>
                      </div>

                      {selectedLog.ohi && (
                        <div className="flex justify-between items-center py-1 border-b border-slate-100 gap-2 min-w-0">
                          <span className="text-slate-500 font-medium shrink-0">{t("log.modal.ohi")}:</span>
                          <span className="font-mono font-semibold text-slate-800 truncate text-right flex-1" title={selectedLog.ohi}>
                            {selectedLog.ohi}
                          </span>
                        </div>
                      )}

                      {selectedLog.subject && (
                        <div className="md:col-span-2 flex justify-between items-center py-1 border-b border-slate-100 gap-2 min-w-0">
                          <span className="text-slate-500 font-medium shrink-0">{t("log.modal.subject")}:</span>
                          <span className="font-mono font-semibold text-slate-800 truncate text-right flex-1" title={selectedLog.subject}>
                            {selectedLog.subject}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3. NDR / REJECTION DIAGNOSTICS SECTION */}
                  {(() => {
                    const rejReason = selectedLog.rejectionReason;
                    const rejDiag = selectedLog.rejectionDiagnostic || selectedLog.remark || selectedLog.supplementaryInfo;
                    if (!rejReason && !rejDiag) return null;

                    const cat = String(selectedLog.category || "").toUpperCase();
                    const r = String(rejReason || "").toLowerCase();
                    const d = String(rejDiag || "").toLowerCase();
                    const rawSource = selectedLog.rejectionSource;
                    let originLabel = t("log.modal.partySwim");
                    let originBadge = "bg-purple-100 text-purple-900 border-purple-300";

                    if (rawSource === "AMHS") {
                      originLabel = t("log.modal.partyAmhs");
                      originBadge = "bg-sky-100 text-sky-900 border-sky-300";
                    } else if (rawSource === "SWIM") {
                      originLabel = t("log.modal.partySwim");
                      originBadge = "bg-purple-100 text-purple-900 border-purple-300";
                    } else if (cat.includes("IN") || cat.includes("SWIM")) {
                      if (r.startsWith("ndr_") || r.includes("x400") || d.includes("non-delivery") || d.includes("mta")) {
                        originLabel = t("log.modal.partyAmhs");
                        originBadge = "bg-sky-100 text-sky-900 border-sky-300";
                      }
                    } else {
                      originLabel = t("log.modal.partyAmhs");
                      originBadge = "bg-sky-100 text-sky-900 border-sky-300";
                      if (r.includes("amqp") || r.includes("broker") || d.includes("amqp") || d.includes("broker") || d.includes("connection")) {
                        originLabel = t("log.modal.partySwim");
                        originBadge = "bg-purple-100 text-purple-900 border-purple-300";
                      }
                    }

                    return (
                      <div className="p-4 bg-rose-50/90 border border-rose-200 rounded-xl flex flex-col gap-2.5 text-xs text-rose-900 shadow-2xs">
                        <div className="flex items-center justify-between border-b border-rose-200/80 pb-2 flex-wrap gap-2">
                          <span className="font-bold text-rose-900 uppercase tracking-wider text-[11px]">
                            {t("log.modal.ndrSection")}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-600 font-medium text-xs">
                              {t("log.modal.errorOrigin")}:
                            </span>
                            <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${originBadge}`}>
                              {originLabel}
                            </span>
                            {rejReason && (
                              <span className="font-bold text-rose-900 font-mono bg-white px-2 py-0.5 rounded border border-rose-300">
                                {rejReason}
                              </span>
                            )}
                          </div>
                        </div>

                        {rejDiag && (
                          <div className="bg-white p-2.5 rounded-lg border border-rose-200 text-rose-950 font-sans leading-relaxed">
                            <strong className="font-mono text-rose-900 block mb-0.5">{t("log.modal.rejectionDiagnostic")}:</strong>
                            <span>{rejDiag}</span>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* 4. RAW CONTENT PAYLOAD BLOCK */}
                  <div className="flex flex-col gap-2 flex-1 min-h-[160px]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        {t("log.modal.rawContent")}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {rawContentFormatted.length} bytes
                        </span>
                        <button
                          onClick={() => handleCopyRaw(rawContentFormatted)}
                          className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 transition-all"
                        >
                          {isModalCopied ? t("log.modal.copied") : t("log.modal.copy")}
                        </button>
                      </div>
                    </div>

                    <div className="relative rounded-xl overflow-hidden border border-slate-300 bg-slate-50 shadow-inner flex-1 min-h-[140px]">
                      <pre
                        className="p-4 font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed custom-scrollbar max-h-64 select-all font-semibold"
                        style={{ backgroundColor: '#f8fafc', color: '#0f172a' }}
                      >
                        {rawContentFormatted || t("log.modal.noContent")}
                      </pre>
                    </div>
                  </div>

                </div>

                {/* MODAL FOOTER */}
                <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                  <button
                    onClick={() => handleNavigateToMessage(selectedLog)}
                    className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold rounded-lg transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    {t("log.modal.viewMessage")}
                  </button>

                  <button
                    onClick={() => setSelectedLog(null)}
                    className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold rounded-lg transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    {t("log.modal.close")}
                  </button>
                </div>

              </div>
            </div>
          );
        })()}

      </div>
    </DashboardLayout>
  );
};

export default FullLogView;
