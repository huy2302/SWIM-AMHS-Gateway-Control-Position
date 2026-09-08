import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/layout/DashboardLayout";
import { Search, RefreshCw, X, Check, ExternalLink } from "lucide-react";
import gatewayApi from "@/api/gatewayApi";
import toast from "react-hot-toast";
import { t } from "@/i18n/translator";
import TablePagination from "@/components/TablePagination";

export default function AlertsView() {
  const navigate = useNavigate();
  const [allAlertsList, setAllAlertsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, ACTIVE, ACKNOWLEDGED, RESOLVED
  const [searchKeyword, setSearchKeyword] = useState("");
  const [page, setPage] = useState(0);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const pageSize = 10;

  // Reset page when filter or search changes
  useEffect(() => {
    setPage(0);
  }, [statusFilter, searchKeyword]);

  // Fetch all alerts from backend
  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await gatewayApi.getAlerts();
      const rawList = Array.isArray(response) ? response : [];
      
      const mapped = rawList.map((a) => ({
        ...a,
        status: a.status === "NEW" ? "ACTIVE" : a.status,
        timeRaised: a.createdAt || a.timeRaised,
        module: a.alertType || a.module || "-",
      }));

      // Sort by newest first
      mapped.sort((a, b) => new Date(b.timeRaised || 0) - new Date(a.timeRaised || 0));

      setAllAlertsList(mapped);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      toast.error(t("alerts.messages.loadError"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Calculate statistics directly from the loaded list
  const activeCount = allAlertsList.filter((a) => a.status === "ACTIVE" || a.status === "NEW").length;
  const ackCount = allAlertsList.filter((a) => a.status === "ACKNOWLEDGED").length;
  const resolvedCount = allAlertsList.filter((a) => a.status === "RESOLVED").length;

  // Filter alerts by status and search keyword
  const filteredAlerts = allAlertsList.filter((a) => {
    // Status filter
    if (statusFilter !== "ALL") {
      if (statusFilter === "ACTIVE" && a.status !== "ACTIVE" && a.status !== "NEW") return false;
      if (statusFilter === "ACKNOWLEDGED" && a.status !== "ACKNOWLEDGED") return false;
      if (statusFilter === "RESOLVED" && a.status !== "RESOLVED") return false;
    }

    // Search filter
    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase();
      const matchMessage = (a.message || "").toLowerCase().includes(q);
      const matchModule = (a.module || "").toLowerCase().includes(q);
      const matchSeverity = (a.severity || "").toLowerCase().includes(q);
      const matchAck = (a.acknowledgedBy || "").toLowerCase().includes(q);
      if (!matchMessage && !matchModule && !matchSeverity && !matchAck) return false;
    }

    return true;
  });

  // Acknowledge Alert
  const handleAcknowledge = async (id) => {
    try {
      await gatewayApi.acknowledgeAlert(id);
      toast.success(t("alerts.messages.ackSuccess"));
      if (selectedAlert?.id === id) {
        setSelectedAlert((prev) => prev ? { ...prev, status: "ACKNOWLEDGED" } : null);
      }
      fetchAlerts();
    } catch (error) {
      console.error("Failed to ack alert:", error);
      toast.error(t("alerts.messages.ackFailed"));
    }
  };

  // Resolve Alert
  const handleResolve = async (id) => {
    try {
      await gatewayApi.resolveAlert(id);
      toast.success(t("alerts.messages.resolveSuccess"));
      if (selectedAlert?.id === id) {
        setSelectedAlert((prev) => prev ? { ...prev, status: "RESOLVED", resolvedAt: new Date().toISOString() } : null);
      }
      fetchAlerts();
    } catch (error) {
      console.error("Failed to resolve alert:", error);
      toast.error(t("alerts.messages.resolveFailed"));
    }
  };

  // Bulk Acknowledge
  const handleBulkAcknowledge = async () => {
    try {
      setLoading(true);
      await gatewayApi.bulkAcknowledgeAlerts();
      toast.success(t("alerts.messages.bulkAckSuccess"));
      fetchAlerts();
    } catch (error) {
      console.error("Bulk ack failed:", error);
      toast.error(t("alerts.messages.bulkAckFailed"));
    } finally {
      setLoading(false);
    }
  };

  // Bulk Resolve
  const handleBulkResolve = async () => {
    try {
      setLoading(true);
      await gatewayApi.bulkResolveAlerts();
      toast.success(t("alerts.messages.bulkResolveSuccess"));
      fetchAlerts();
    } catch (error) {
      console.error("Bulk resolve failed:", error);
      toast.error(t("alerts.messages.bulkResolveFailed"));
    } finally {
      setLoading(false);
    }
  };

  // Extract message ID from alert object or message text
  const extractMessageId = (alert) => {
    if (!alert) return null;
    if (alert.messageId) return String(alert.messageId);
    // BE (gw_alert) trả về refId - id của dòng gwin/gwout sinh ra cảnh báo
    if (alert.refId) return String(alert.refId);
    // Match patterns like "Message ID #1234", "message_id: 123", "msgId: 123", or numbers
    const match = (alert.message || "").match(/(?:message[_\s-]?id|msgid|id)[\s:#]+([a-zA-Z0-9_-]+)/i);
    if (match && match[1]) return match[1];
    return null;
  };

  // Navigate directly to Message View
  const handleNavigateToMessage = (alert, e) => {
    if (e) e.stopPropagation();
    if (!alert) return;
    const msgId = extractMessageId(alert);
    navigate("/messages", {
      state: {
        searchQuery: msgId || alert.module || "",
        autoOpen: true
      }
    });
  };

  // Helper badge for severity
  const getSeverityBadge = (severity) => {
    const sev = (severity || "").toUpperCase();
    if (sev === "CRITICAL" || sev === "ERROR") {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 border border-rose-200 text-rose-700">
          {t(`alerts.severity.${sev}`) || sev}
        </span>
      );
    }
    if (sev === "WARNING" || sev === "WARN") {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 border border-amber-200 text-amber-700">
          {t(`alerts.severity.${sev}`) || sev}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 border border-blue-200 text-blue-700">
        {t(`alerts.severity.${sev}`) || sev || "INFO"}
      </span>
    );
  };

  // Helper badge for status
  const getStatusBadge = (status) => {
    if (status === "ACTIVE" || status === "NEW") {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 border border-rose-200 text-rose-700">
          {t("alerts.filterStatus.ACTIVE")}
        </span>
      );
    }
    if (status === "ACKNOWLEDGED") {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 border border-amber-200 text-amber-700">
          {t("alerts.filterStatus.ACKNOWLEDGED")}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">
        {t("alerts.filterStatus.RESOLVED")}
      </span>
    );
  };

  const paginatedAlerts = filteredAlerts.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 max-w-7xl mx-auto py-1">
        

        {/* COMPACT STAT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* Active Card */}
          <div
            onClick={() => setStatusFilter("ACTIVE")}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              statusFilter === "ACTIVE"
                ? "bg-rose-50/80 border-rose-300 shadow-xs"
                : "bg-white border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {t("alerts.stats.active")}
            </div>
            <div className="text-xl font-extrabold text-rose-700 mt-1">
              {activeCount}
            </div>
          </div>

          {/* Acknowledged Card */}
          <div
            onClick={() => setStatusFilter("ACKNOWLEDGED")}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              statusFilter === "ACKNOWLEDGED"
                ? "bg-amber-50/80 border-amber-300 shadow-xs"
                : "bg-white border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {t("alerts.stats.acknowledged")}
            </div>
            <div className="text-xl font-extrabold text-amber-700 mt-1">
              {ackCount}
            </div>
          </div>

          {/* Resolved Card */}
          <div
            onClick={() => setStatusFilter("RESOLVED")}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              statusFilter === "RESOLVED"
                ? "bg-emerald-50/80 border-emerald-300 shadow-xs"
                : "bg-white border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {t("alerts.stats.resolved")}
            </div>
            <div className="text-xl font-extrabold text-emerald-700 mt-1">
              {resolvedCount}
            </div>
          </div>

        </div>

        {/* TOOLBAR */}
        <div className="bg-white border border-slate-200 p-3 rounded-xl flex flex-wrap justify-between items-center gap-3 shadow-xs">
          
          {/* Status Tabs & Bulk actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              {["ALL", "ACTIVE", "ACKNOWLEDGED", "RESOLVED"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    statusFilter === st
                      ? "bg-white text-blue-600 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {t(`alerts.filterStatus.${st}`) || st}
                </button>
              ))}
            </div>

            {/* Bulk actions */}
            {activeCount > 0 && (
              <button
                onClick={handleBulkAcknowledge}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                {t("alerts.buttons.bulkAck")} ({activeCount})
              </button>
            )}

            {(activeCount > 0 || ackCount > 0) && (
              <button
                onClick={handleBulkResolve}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                {t("alerts.buttons.bulkResolve")} ({activeCount + ackCount})
              </button>
            )}
          </div>

          {/* Search & Refresh */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={t("alerts.searchPlaceholder")}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-blue-600 focus:bg-white transition-colors"
              />
              {searchKeyword && (
                <button
                  onClick={() => setSearchKeyword("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <button
              onClick={fetchAlerts}
              className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
              title={t("alerts.buttons.refresh")}
            >
              <RefreshCw size={14} className={loading ? "animate-spin text-blue-600" : ""} />
            </button>
          </div>

        </div>

        {/* ALERTS TABLE */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
                <tr>
                  <th className="py-3 px-4 w-40">{t("alerts.table.time")}</th>
                  <th className="py-3 px-4 w-28">{t("alerts.table.level")}</th>
                  <th className="py-3 px-4 w-36">{t("alerts.table.module")}</th>
                  <th className="py-3 px-4">{t("alerts.table.message")}</th>
                  <th className="py-3 px-4 w-28">{t("alerts.table.status")}</th>
                  <th className="py-3 px-4 w-32">{t("alerts.table.ackBy")}</th>
                  <th className="py-3 px-4 text-right w-36">{t("alerts.table.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && allAlertsList.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-10 text-center text-slate-400">
                      <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent mb-2"></div>
                      <div>{t("alerts.state.loading")}</div>
                    </td>
                  </tr>
                ) : filteredAlerts.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-10 text-center text-slate-400">
                      {t("alerts.state.empty")}
                    </td>
                  </tr>
                ) : (
                  paginatedAlerts.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedAlert(row)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      {/* Timestamp */}
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                        {row.timeRaised ? new Date(row.timeRaised).toLocaleString() : "-"}
                      </td>

                      {/* Severity Level */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getSeverityBadge(row.severity)}
                      </td>

                      {/* Module */}
                      <td className="py-3 px-4 font-bold text-slate-800 whitespace-nowrap">
                        {row.module || "-"}
                      </td>

                      {/* Message with hover title and deep link */}
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        <div className="flex items-center justify-between gap-2 group max-w-md">
                          <span className="truncate" title={row.message}>
                            {row.message || "-"}
                          </span>
                          <button
                            onClick={(e) => handleNavigateToMessage(row, e)}
                            title={t("alerts.modal.viewMessage")}
                            className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-blue-600 hover:bg-blue-50 transition-all cursor-pointer shrink-0"
                          >
                            <ExternalLink size={12} />
                          </button>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getStatusBadge(row.status)}
                      </td>

                      {/* Ack By */}
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap text-[11px]">
                        {row.acknowledgedBy || "-"}
                      </td>

                      {/* Row Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {row.status === "ACTIVE" && (
                            <button
                              onClick={() => handleAcknowledge(row.id)}
                              className="px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 font-bold text-[11px] transition-colors cursor-pointer"
                            >
                              {t("alerts.actions.ack")}
                            </button>
                          )}
                          {(row.status === "ACTIVE" || row.status === "ACKNOWLEDGED") && (
                            <button
                              onClick={() => handleResolve(row.id)}
                              className="px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold text-[11px] transition-colors cursor-pointer"
                            >
                              {t("alerts.actions.resolve")}
                            </button>
                          )}
                          {row.status === "RESOLVED" && (
                            <span className="text-emerald-600 font-semibold text-[11px]">
                              {t("alerts.state.resolved")}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          <TablePagination
            page={page}
            totalPages={Math.ceil(filteredAlerts.length / pageSize)}
            onPageChange={setPage}
            totalItems={filteredAlerts.length}
          />
        </div>

        {/* ALERT DETAIL MODAL */}
        {selectedAlert && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
              
              {/* Modal Header */}
              <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-800">
                    {t("alerts.modal.title")} #{selectedAlert.id}
                  </span>
                  {getSeverityBadge(selectedAlert.severity)}
                </div>
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-md hover:bg-slate-200/60"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 overflow-y-auto space-y-4 text-xs">
                
                {/* Meta Grid */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      {t("alerts.modal.time")}
                    </span>
                    <span className="font-mono text-slate-700 font-medium">
                      {selectedAlert.timeRaised ? new Date(selectedAlert.timeRaised).toLocaleString() : "-"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      {t("alerts.modal.module")}
                    </span>
                    <span className="font-bold text-slate-800">
                      {selectedAlert.module || "-"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      {t("alerts.modal.status")}
                    </span>
                    <div className="mt-0.5">{getStatusBadge(selectedAlert.status)}</div>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      {t("alerts.modal.ackBy")}
                    </span>
                    <span className="text-slate-700 font-medium">
                      {selectedAlert.acknowledgedBy || "-"}
                    </span>
                  </div>

                  {selectedAlert.resolvedAt && (
                    <div className="col-span-2">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        {t("alerts.modal.resolvedAt")}
                      </span>
                      <span className="font-mono text-slate-700 font-medium">
                        {new Date(selectedAlert.resolvedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Message Detail Box */}
                <div>
                  <span className="text-slate-500 font-bold block mb-1.5">
                    {t("alerts.modal.message")}
                  </span>
                  <div className="border border-slate-300 bg-slate-50 rounded-lg p-3 shadow-inner">
                    <pre
                      className="font-mono text-xs whitespace-pre-wrap leading-relaxed select-all"
                      style={{ backgroundColor: "#f8fafc", color: "#0f172a" }}
                    >
                      {selectedAlert.message || "-"}
                    </pre>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleNavigateToMessage(selectedAlert, e)}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg font-bold text-xs transition-colors cursor-pointer"
                  >
                    {t("alerts.modal.viewMessage")}
                  </button>

                  {selectedAlert.status === "ACTIVE" && (
                    <button
                      onClick={() => handleAcknowledge(selectedAlert.id)}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg font-bold text-xs transition-colors cursor-pointer"
                    >
                      {t("alerts.actions.ack")}
                    </button>
                  )}
                  {(selectedAlert.status === "ACTIVE" || selectedAlert.status === "ACKNOWLEDGED") && (
                    <button
                      onClick={() => handleResolve(selectedAlert.id)}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg font-bold text-xs transition-colors cursor-pointer"
                    >
                      {t("alerts.actions.resolve")}
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setSelectedAlert(null)}
                  className="px-4 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg font-bold text-xs transition-colors cursor-pointer"
                >
                  {t("alerts.modal.close")}
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
