import React, { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/layout/DashboardLayout";
import { Unplug, Search, Check, X, Send, BarChart3, AlertCircle, RefreshCw, Copy, Eye, MoreVertical } from "lucide-react";
import gatewayApi from "@/api/gatewayApi";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import toast from "react-hot-toast";
import { t } from "@/i18n/translator";
import TablePagination from "@/components/TablePagination";

const COLORS = ["#3B82F6", "#F59E0B", "#10B981", "#EF4444", "#8B5CF6"];

export default function UnroutedQueue() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [originatorFilter, setOriginatorFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

  // Stats states
  const [successRateData, setSuccessRateData] = useState(null);
  const [distributionData, setDistributionData] = useState([]);
  const [overallStats, setOverallStats] = useState({ total: 0, pending: 0, rate: 100 });
  const [statsPeriod, setStatsPeriod] = useState("last_24h");

  // Pagination & Sorting state
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  // Dialogs state
  const [isRouteOpen, setIsRouteOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [actionMessage, setActionMessage] = useState(null); // String or Array (for batch)
  const [detailMessage, setDetailMessage] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);

  const [routeFormData, setRouteFormData] = useState({
    originator: "",
    recipients: "",
    note: "",
  });
  const [rejectFormData, setRejectFormData] = useState({
    reason: "",
  });

  // Fetch Stats
  const fetchStats = useCallback(async () => {
    try {
      const dist = await gatewayApi.getAddressingDistribution(statsPeriod);
      if (dist && dist.distribution) {
        setDistributionData(dist.distribution.map(d => ({
          name: d.source || "Unknown",
          value: d.count,
        })));
      }

      const rate = await gatewayApi.getAddressingSuccessRate("last_7d");
      if (rate) {
        setSuccessRateData([
          { name: t("global.pagination.routed"), value: rate.resolved, color: "#10B981" },
          { name: t("global.pagination.unrouted"), value: rate.unrouted, color: "#EF4444" },
        ]);
        setOverallStats({
          total: rate.totalMessages,
          pending: rate.unrouted,
          rate: rate.successRate,
        });
      }
    } catch (error) {
      console.error("Error fetching addressing stats:", error);
    }
  }, [statsPeriod]);

  // Fetch Unrouted Messages
  const fetchUnrouted = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        size: pageSize,
        sort: "time,desc",
      };
      if (originatorFilter.trim()) {
        params.source = originatorFilter.trim();
      }
      const response = await gatewayApi.getUnroutedMessages(params);
      const itemsList = response?.items || response?.content || [];
      if (response) {
        setMessages(itemsList);
        setTotalPages(response.totalPages || 1);
        setTotalElements(response.totalItems ?? response.totalElements ?? 0);
      }
    } catch (error) {
      console.error("Error fetching unrouted messages:", error);
      toast.error(t("unrouted.messages.loadError"));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, originatorFilter]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchUnrouted();
  }, [fetchUnrouted]);

  // Close actions menu when clicking outside
  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  // Batch Select Toggle
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(messages.map((m) => m.msgid));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id, checked) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  // Open manual route dialog
  const handleOpenRoute = (msg) => {
    setActionMessage(msg);
    if (Array.isArray(msg)) {
      setRouteFormData({ originator: "", recipients: "", note: "" });
    } else {
      setRouteFormData({
        originator: msg.origin || "",
        recipients: msg.address || "",
        note: "",
      });
    }
    setIsRouteOpen(true);
  };

  // Open single reject dialog
  const handleOpenReject = (msg) => {
    setActionMessage(msg);
    setRejectFormData({ reason: "" });
    setIsRejectOpen(true);
  };

  // Open details modal
  const handleViewDetails = (msg) => {
    setDetailMessage(msg);
  };

  // Execute manual route
  const handleRouteSubmit = async (e) => {
    e.preventDefault();
    
    // Validate originator (8 chars)
    const originatorClean = routeFormData.originator.trim().toUpperCase();
    const recipientsClean = routeFormData.recipients.trim().toUpperCase();

    if (!originatorClean || originatorClean.length !== 8) {
      toast.error(t("unrouted.messages.requiredOriginator"));
      return;
    }
    if (!recipientsClean) {
      toast.error(t("unrouted.messages.requiredRecipients"));
      return;
    }

    try {
      if (Array.isArray(actionMessage)) {
        // Batch Route
        await gatewayApi.batchRouteUnrouted({
          msgids: actionMessage,
          originator: originatorClean,
          recipients: recipientsClean,
          note: routeFormData.note,
        });
        toast.success(t("unrouted.messages.batchSuccess"));
      } else {
        // Single Route
        await gatewayApi.manualRoute(actionMessage.msgid, {
          originator: originatorClean,
          recipients: recipientsClean,
          note: routeFormData.note,
        });
        toast.success(t("unrouted.messages.routeSuccess"));
      }
      setIsRouteOpen(false);
      setDetailMessage(null);
      setSelectedIds([]);
      fetchUnrouted();
      fetchStats();
    } catch (error) {
      console.error("Routing error:", error);
      toast.error(t("unrouted.messages.failedRoute"));
    }
  };

  // Execute manual reject
  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    try {
      if (Array.isArray(actionMessage)) {
        // Batch Reject (sequentially)
        for (const id of actionMessage) {
          await gatewayApi.rejectUnrouted(id, {
            reason: rejectFormData.reason || t("unrouted.messages.defaultRejectReason"),
          });
        }
        toast.success(t("unrouted.messages.batchSuccess"));
      } else {
        // Single Reject
        await gatewayApi.rejectUnrouted(actionMessage.msgid, {
          reason: rejectFormData.reason || t("unrouted.messages.defaultRejectReason"),
        });
        toast.success(t("unrouted.messages.rejectSuccess"));
      }
      setIsRejectOpen(false);
      setDetailMessage(null);
      setSelectedIds([]);
      fetchUnrouted();
      fetchStats();
    } catch (error) {
      console.error("Rejection error:", error);
      toast.error(t("unrouted.messages.failedReject"));
    }
  };

  const handleCopy = (text) => {
    if (text) {
      navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      toast.success(t("messages.toast.copySuccess"));
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200/80 p-5 rounded-xl flex items-center gap-4 shadow-xs">
            <div className="p-3 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl">
              <BarChart3 size={24} />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-bold tracking-wider">{t("unrouted.stats.total")}</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{overallStats.total}</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 p-5 rounded-xl flex items-center gap-4 shadow-xs">
            <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl">
              <AlertCircle size={24} />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-bold tracking-wider">{t("unrouted.stats.unroutedCount")}</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{overallStats.pending}</div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 p-5 rounded-xl flex items-center gap-4 shadow-xs">
            <div className="p-3 bg-green-50 text-green-600 border border-green-100 rounded-xl">
              <Check size={24} />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-bold tracking-wider">{t("unrouted.stats.successRate")}</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{overallStats.rate}%</div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Source Distribution Chart */}
          <div className="bg-white border border-slate-200/80 p-5 rounded-xl shadow-xs">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold text-slate-700 tracking-wider">
                {t("unrouted.stats.distributionTitle")}
              </h3>
              <select
                value={statsPeriod}
                onChange={(e) => setStatsPeriod(e.target.value)}
                className="bg-white border border-slate-350 text-[10px] rounded px-2.5 py-1.5 outline-none text-slate-700 font-bold cursor-pointer shadow-xs"
              >
                <option value="last_hour">{t("unrouted.stats.periods.last_hour")}</option>
                <option value="last_24h">{t("unrouted.stats.periods.last_24h")}</option>
                <option value="last_7d">{t("unrouted.stats.periods.last_7d")}</option>
                <option value="last_30d">{t("unrouted.stats.periods.last_30d")}</option>
              </select>
            </div>
            <div className="h-64">
              {distributionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart data={distributionData}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "8px", fontSize: 11 }} />
                    <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]}>
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-xs font-medium">
                  {t("unrouted.stats.noDistribution")}
                </div>
              )}
            </div>
          </div>

          {/* Success vs Unrouted Pie Chart */}
          <div className="bg-white border border-slate-200/80 p-5 rounded-xl shadow-xs">
            <h3 className="text-xs font-bold text-slate-700 tracking-wider mb-4">
              {t("unrouted.stats.rateTitle")}
            </h3>
            <div className="h-64">
              {successRateData ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie
                       data={successRateData}
                       cx="50%"
                       cy="50%"
                       innerRadius={60}
                       outerRadius={80}
                       paddingAngle={4}
                       dataKey="value"
                    >
                      {successRateData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "8px", fontSize: 11 }} />
                    <Legend verticalAlign="bottom" height={36} iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 10, color: "#475569" }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-xs font-medium">
                  {t("unrouted.stats.noRate")}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Toolbar & Filter */}
        <div className="bg-white border border-slate-200/80 p-4 rounded-xl flex flex-wrap justify-between items-center gap-4 shadow-xs">
          <div className="flex items-center gap-2 w-full max-w-sm">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder={t("unrouted.searchPlaceholder")}
                className="w-full bg-slate-50 border border-slate-355 rounded-lg pl-10 pr-4 py-2 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-xs text-slate-900 font-medium"
                value={originatorFilter}
                onChange={(e) => setOriginatorFilter(e.target.value)}
              />
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
            <button
              onClick={() => {
                fetchStats();
                fetchUnrouted();
              }}
              className="p-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-650 rounded-lg hover:text-slate-900 shadow-sm active:scale-95 transition-all cursor-pointer flex items-center justify-center h-8 w-8"
              title={t("unrouted.stats.refreshTitle")}
            >
              <RefreshCw size={13} />
            </button>
          </div>

          {/* Batch Actions */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 px-3.5 py-2 rounded-xl shadow-xs">
              <span className="text-[11px] text-indigo-700 font-bold">
                {t("unrouted.selectedText")} <span className="text-indigo-900 font-extrabold">{selectedIds.length}</span>
              </span>
              <button
                onClick={() => {
                  setActionMessage(selectedIds);
                  setIsRouteOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <Send size={10} />
                <span>{t("unrouted.actions.batchRoute")}</span>
              </button>
              <button
                onClick={() => {
                  setActionMessage(selectedIds);
                  setRejectFormData({ reason: "" });
                  setIsRejectOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold transition-all border border-red-200 active:scale-95 cursor-pointer"
              >
                <X size={10} />
                <span>{t("unrouted.actions.batchReject")}</span>
              </button>
            </div>
          )}
        </div>

        {/* Unrouted Queue Table */}
        <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto min-h-[260px]">
            <table className="w-full text-left text-sm border-collapse font-sans">
              <thead className="bg-slate-50 text-slate-555 border-b border-slate-200/80 font-bold tracking-wider text-[11px]">
                <tr>
                  <th className="p-4 w-12 text-center">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-indigo-600 cursor-pointer"
                      onChange={handleSelectAll}
                      checked={messages.length > 0 && selectedIds.length === messages.length}
                    />
                  </th>
                  <th className="p-4">{t("unrouted.table.time")}</th>
                  <th className="p-4">{t("unrouted.table.msgid")}</th>
                  <th className="p-4">{t("unrouted.table.originator")}</th>
                  <th className="p-4">{t("unrouted.table.priority")}</th>
                  <th className="p-4">{t("unrouted.table.errorMsg")}</th>
                  <th className="p-4 text-right">{t("unrouted.table.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="p-10 text-center text-slate-400">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500 mb-2"></div>
                      <div className="text-xs font-semibold">{t("unrouted.table.loading")}</div>
                    </td>
                  </tr>
                ) : messages.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-10 text-center text-slate-500 text-sm font-medium">
                      {t("unrouted.table.noData")}
                    </td>
                  </tr>
                ) : (
                  messages.map((row) => (
                    <tr
                      key={row.msgid}
                      onClick={() => handleViewDetails(row)}
                      onDoubleClick={() => handleViewDetails(row)}
                      className={`hover:bg-slate-100/70 transition-colors cursor-pointer ${
                        selectedIds.includes(row.msgid) ? "bg-indigo-50/70" : ""
                      }`}
                    >
                      <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-indigo-600 cursor-pointer"
                          checked={selectedIds.includes(row.msgid)}
                          onChange={(e) => handleSelectOne(row.msgid, e.target.checked)}
                        />
                      </td>
                      <td className="p-4 text-slate-500 text-sm whitespace-nowrap">
                        {row.time ? new Date(row.time).toLocaleString() : "-"}
                      </td>
                      <td className={`p-4 font-mono text-sm font-bold text-indigo-650 border-l-4 transition-all duration-150 ${selectedIds.includes(row.msgid) ? "border-l-indigo-600" : "border-l-transparent"}`}>
                        {row.msgid}
                      </td>
                      <td className="p-4 font-mono text-sm font-bold text-blue-600">{row.origin || "-"}</td>
                      <td className="p-4 text-slate-700 text-sm">{row.priority || "NORMAL"}</td>
                      <td className="p-4 text-red-655 font-semibold break-words max-w-xs text-sm">
                        {row.errorDesc || "NO_MATCHING_ROUTING_RULE"}
                      </td>
                      <td className="p-4 text-right relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === row.msgid ? null : row.msgid);
                          }}
                          className="p-2 rounded-lg hover:bg-slate-100 text-slate-450 hover:text-slate-700 transition-colors cursor-pointer inline-flex items-center justify-center"
                          title={t("unrouted.table.actions")}
                        >
                          <MoreVertical size={16} />
                        </button>
                        {activeMenuId === row.msgid && (
                          <div className="absolute right-4 mt-1 w-32 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1.5 animate-zoom-in text-left">
                            <button
                              onClick={() => {
                                handleViewDetails(row);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                            >
                              <Eye size={13} className="text-slate-500" />
                              <span>{t("unrouted.table.viewDetail")}</span>
                            </button>
                            <button
                              onClick={() => {
                                handleOpenRoute(row);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                            >
                              <Send size={13} className="text-indigo-600" />
                              <span>{t("unrouted.actions.route")}</span>
                            </button>
                            <button
                              onClick={() => {
                                handleOpenReject(row);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3 py-2 text-[11px] font-semibold text-red-650 hover:bg-red-50/50 flex items-center gap-2 cursor-pointer border-t border-slate-100"
                            >
                              <X size={13} className="text-red-500" />
                              <span>{t("unrouted.actions.reject")}</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          <TablePagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={totalElements}
            pageSize={pageSize}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(0);
            }}
          />
        </div>

        {/* Modal: Details view */}
        {detailMessage && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex justify-center items-center p-4 animate-fade-in">
            <div className="w-full max-w-5xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-zoom-in">
              {/* HEADER */}
              <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold tracking-wider text-slate-400">
                    {t("unrouted.dialog.detailTitle")}
                  </span>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-lg font-extrabold text-slate-900">
                      #{detailMessage.msgid}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      UNROUTED
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setDetailMessage(null)}
                  className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* BODY */}
              <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto custom-scrollbar">
                {/* INFO GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div className="flex flex-col gap-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl relative shadow-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 font-bold tracking-wider">{t("unrouted.dialog.fields.origin")}</span>
                      <button onClick={() => handleCopy(detailMessage.origin)} className="text-indigo-600 hover:text-indigo-500 cursor-pointer" title="Copy"><Copy size={12} /></button>
                    </div>
                    <div className="text-slate-800 break-all text-[11px] font-mono font-medium mt-0.5">{detailMessage.origin || "N/A"}</div>
                  </div>

                  <div className="flex flex-col gap-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl relative shadow-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 font-bold tracking-wider">{t("unrouted.dialog.fields.address")}</span>
                      <button onClick={() => handleCopy(detailMessage.address)} className="text-indigo-600 hover:text-indigo-500 cursor-pointer" title="Copy"><Copy size={12} /></button>
                    </div>
                    <div className="text-slate-800 break-all text-[11px] font-mono font-medium mt-0.5">{detailMessage.address || "N/A"}</div>
                  </div>

                  <div className="flex flex-col gap-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl relative shadow-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 font-bold tracking-wider">{t("unrouted.dialog.fields.subject")}</span>
                      <button onClick={() => handleCopy(detailMessage.subject)} className="text-indigo-600 hover:text-indigo-500 cursor-pointer" title="Copy"><Copy size={12} /></button>
                    </div>
                    <div className="text-slate-800 break-all text-[11px] font-mono font-medium mt-0.5">{detailMessage.subject || "N/A"}</div>
                  </div>

                  <div className="flex flex-col gap-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl relative shadow-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 font-bold tracking-wider">{t("unrouted.dialog.fields.priority")}</span>
                      <button onClick={() => handleCopy(detailMessage.priority)} className="text-indigo-600 hover:text-indigo-500 cursor-pointer" title="Copy"><Copy size={12} /></button>
                    </div>
                    <div className="text-slate-800 break-all text-[11px] font-mono font-medium mt-0.5">{detailMessage.priority || "NORMAL"}</div>
                  </div>

                  <div className="flex flex-col gap-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl relative shadow-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 font-bold tracking-wider">{t("unrouted.dialog.fields.time")}</span>
                      <button onClick={() => handleCopy(detailMessage.time)} className="text-indigo-600 hover:text-indigo-500 cursor-pointer" title="Copy"><Copy size={12} /></button>
                    </div>
                    <div className="text-slate-800 break-all text-[11px] font-mono font-medium mt-0.5">{detailMessage.time ? new Date(detailMessage.time).toLocaleString() : "N/A"}</div>
                  </div>

                  <div className="flex flex-col gap-1.5 p-3 bg-red-50/50 border border-red-150 rounded-xl relative shadow-xs md:col-span-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-red-700 font-bold tracking-wider">{t("unrouted.dialog.fields.errorType")}</span>
                      <button onClick={() => handleCopy(detailMessage.errorDesc)} className="text-red-700 hover:text-red-650 cursor-pointer" title="Copy"><Copy size={12} /></button>
                    </div>
                    <div className="text-red-700 break-all text-[11px] font-mono font-bold mt-0.5">{detailMessage.errorDesc || "NO_MATCHING_ROUTING_RULE"}</div>
                  </div>
                </div>

                {/* RAW MESSAGE TEXT */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold tracking-wider text-slate-500">
                      {t("unrouted.dialog.fields.rawMessage")}
                    </span>
                    <button
                      onClick={() => handleCopy(detailMessage.text)}
                      className="text-[11px] text-indigo-600 hover:text-indigo-500 font-semibold cursor-pointer"
                    >
                      {t("messages.modal.buttons.copy")}
                    </button>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-inner max-h-48 overflow-y-auto custom-scrollbar">
                    <pre className="text-slate-800 text-[12px] whitespace-pre-wrap font-mono leading-relaxed">
                      {detailMessage.text || "N/A"}
                    </pre>
                  </div>
                </div>


              </div>

              {/* FOOTER */}
              <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
                <button
                  onClick={() => setDetailMessage(null)}
                  className="px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition cursor-pointer font-semibold active:scale-95"
                >
                  {t("unrouted.dialog.cancel")}
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      handleOpenReject(detailMessage);
                    }}
                    className="px-4 py-2 text-sm rounded-lg border border-red-200 text-red-650 bg-white hover:bg-red-50/50 transition cursor-pointer font-semibold active:scale-95 flex items-center gap-1.5"
                  >
                    <X size={14} />
                    {t("unrouted.dialog.rejectButton")}
                  </button>
                  <button
                    onClick={() => {
                      handleOpenRoute(detailMessage);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-500 transition text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
                  >
                    <Send size={14} />
                    {t("unrouted.dialog.routeButton")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Manual Route Dialog */}
        {isRouteOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex justify-center items-center p-4 animate-fade-in" onClick={() => setIsRouteOpen(false)}>
            <div className="w-[540px] max-w-full bg-white max-h-[88vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-zoom-in border border-slate-200" onClick={(e) => e.stopPropagation()}>
              
              {/* MODAL HEADER */}
              <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 flex items-center justify-center shrink-0">
                    <Send size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">
                      {t("unrouted.dialog.routeTitle")}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Manual Aeronautical Message Routing
                    </p>
                  </div>
                </div>
                
                <button onClick={() => setIsRouteOpen(false)} className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              {/* MODAL BODY */}
              <form onSubmit={handleRouteSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-4 text-xs">
                  {/* Originator Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {t("unrouted.dialog.originator")}
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={8}
                      placeholder={t("unrouted.dialog.originatorPlaceholder")}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      value={routeFormData.originator}
                      onChange={(e) => setRouteFormData({ ...routeFormData, originator: e.target.value })}
                    />
                  </div>

                  {/* Recipients Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {t("unrouted.dialog.recipients")}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={t("unrouted.dialog.recipientsPlaceholder")}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      value={routeFormData.recipients}
                      onChange={(e) => setRouteFormData({ ...routeFormData, recipients: e.target.value })}
                    />
                  </div>

                  {/* Operator Note Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {t("unrouted.dialog.note")}
                    </label>
                    <input
                      type="text"
                      placeholder={t("unrouted.dialog.notePlaceholder")}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      value={routeFormData.note}
                      onChange={(e) => setRouteFormData({ ...routeFormData, note: e.target.value })}
                    />
                  </div>
                </div>

                {/* MODAL FOOTER */}
                <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsRouteOpen(false)}
                    className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-xs"
                  >
                    {t("unrouted.dialog.cancel")}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <Send size={14} />
                    <span>{t("unrouted.dialog.submit")}</span>
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}
        {/* Modal: Reject Dialog */}
        {isRejectOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex justify-center items-center p-4 animate-fade-in">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-zoom-in">
              <div className="flex justify-between items-center border-b border-slate-100 px-6 py-4 bg-slate-50">
                <h3 className="text-sm font-bold text-slate-800 tracking-wider">
                  {t("unrouted.dialog.rejectTitle")}
                </h3>
                <button onClick={() => setIsRouteOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleRejectSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5">
                    {t("unrouted.dialog.rejectReason")}
                  </label>
                  <textarea
                    rows={3}
                    placeholder={t("unrouted.dialog.rejectReasonPlaceholder")}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-xs text-slate-900 resize-none font-medium"
                    value={rejectFormData.reason}
                    onChange={(e) => setRejectFormData({ reason: e.target.value })}
                  />
                </div>

                <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsRejectOpen(false)}
                    className="rounded-lg bg-white border border-slate-300 hover:bg-slate-50 px-4 py-2.5 text-xs text-slate-700 font-semibold transition-colors cursor-pointer"
                  >
                    {t("unrouted.dialog.cancel")}
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-red-600 hover:bg-red-500 px-4 py-2.5 text-xs text-white font-semibold transition-colors shadow-sm hover:shadow active:scale-95 cursor-pointer"
                  >
                    {t("unrouted.dialog.submit")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
