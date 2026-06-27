import React, { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/layout/DashboardLayout";
import { AlertOctagon, CheckCircle2, ShieldAlert, Eye, Search, BellRing, RefreshCw } from "lucide-react";
import gatewayApi from "@/api/gatewayApi";
import toast from "react-hot-toast";
import { t } from "@/i18n/translator";
import TablePagination from "@/components/TablePagination";

export default function AlertsView() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ACTIVE"); // ACTIVE, ACKNOWLEDGED, RESOLVED, ALL
  const [searchKeyword, setSearchKeyword] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    setPage(0);
  }, [statusFilter, searchKeyword]);

  const [stats, setStats] = useState({
    activeCount: 0,
    ackCount: 0,
    resolvedCount: 0,
  });

  // Fetch Alerts
  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      let response = [];
      const apiStatus = statusFilter === "ACTIVE" ? "NEW" : statusFilter;
      if (statusFilter === "ALL") {
        response = await gatewayApi.getAlerts();
      } else {
        response = await gatewayApi.getAlertsByStatus(apiStatus);
      }

      const allAlerts = (statusFilter === "ALL") ? response : await gatewayApi.getAlerts();
      setStats({
        activeCount: (allAlerts || []).filter(a => a.status === "NEW" || a.status === "ACTIVE").length,
        ackCount: (allAlerts || []).filter(a => a.status === "ACKNOWLEDGED").length,
        resolvedCount: (allAlerts || []).filter(a => a.status === "RESOLVED").length,
      });

      // Map backend properties to match frontend expectations
      let mapped = (response || []).map(a => ({
        ...a,
        status: a.status === "NEW" ? "ACTIVE" : a.status,
        timeRaised: a.createdAt,
        module: a.alertType,
      }));

      // Filter locally based on search keyword
      let filtered = mapped;
      if (searchKeyword.trim()) {
        filtered = filtered.filter(
          (a) =>
            a.message?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
            a.alertType?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
            a.module?.toLowerCase().includes(searchKeyword.toLowerCase())
        );
      }
      setAlerts(filtered);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      toast.error(t("alerts.messages.loadError"));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchKeyword]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Acknowledge Alert
  const handleAcknowledge = async (id) => {
    try {
      await gatewayApi.acknowledgeAlert(id);
      toast.success(t("alerts.messages.ackSuccess"));
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

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            onClick={() => setStatusFilter("ACTIVE")}
            className={`cursor-pointer p-5 rounded-xl border flex items-center gap-4 transition-all hover:scale-[1.01] hover:shadow-xs shadow-xs ${
              statusFilter === "ACTIVE"
                ? "bg-red-50 border-red-200 text-red-700"
                : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
            }`}
          >
            <div className={`p-3 rounded-lg ${statusFilter === "ACTIVE" ? "bg-red-100/80" : "bg-slate-50"}`}>
              <AlertOctagon size={24} />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider">{t("alerts.filterStatus.ACTIVE")}</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{stats.activeCount}</div>
            </div>
          </div>

          <div
            onClick={() => setStatusFilter("ACKNOWLEDGED")}
            className={`cursor-pointer p-5 rounded-xl border flex items-center gap-4 transition-all hover:scale-[1.01] hover:shadow-xs shadow-xs ${
              statusFilter === "ACKNOWLEDGED"
                ? "bg-amber-50 border-amber-200 text-amber-700"
                : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
            }`}
          >
            <div className={`p-3 rounded-lg ${statusFilter === "ACKNOWLEDGED" ? "bg-amber-100/80" : "bg-slate-50"}`}>
              <Eye size={24} />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider">{t("alerts.filterStatus.ACKNOWLEDGED")}</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{stats.ackCount}</div>
            </div>
          </div>

          <div
            onClick={() => setStatusFilter("RESOLVED")}
            className={`cursor-pointer p-5 rounded-xl border flex items-center gap-4 transition-all hover:scale-[1.01] hover:shadow-xs shadow-xs ${
              statusFilter === "RESOLVED"
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
            }`}
          >
            <div className={`p-3 rounded-lg ${statusFilter === "RESOLVED" ? "bg-green-100/80" : "bg-slate-50"}`}>
              <CheckCircle2 size={24} />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider">{t("alerts.filterStatus.RESOLVED")}</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">{stats.resolvedCount}</div>
            </div>
          </div>
        </div>

        {/* Toolbar & Status tab */}
        <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-wrap justify-between items-center gap-4 shadow-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
              {["ACTIVE", "ACKNOWLEDGED", "RESOLVED", "ALL"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all cursor-pointer ${
                    statusFilter === st
                      ? "bg-white text-indigo-700 shadow-sm border border-slate-200/50"
                      : "text-slate-500 hover:text-slate-850"
                  }`}
                >
                  {t(`alerts.filterStatus.${st}`) || st}
                </button>
              ))}
            </div>

            {/* Bulk actions */}
            {stats.activeCount > 0 && (
              <button
                onClick={handleBulkAcknowledge}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/60 rounded-lg text-[10px] font-bold uppercase transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 h-[34px] shadow-xs"
              >
                <Eye size={12} />
                {t("alerts.buttons.bulkAck")}
              </button>
            )}

            {(stats.activeCount > 0 || stats.ackCount > 0) && (
              <button
                onClick={handleBulkResolve}
                className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200/60 rounded-lg text-[10px] font-bold uppercase transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 h-[34px] shadow-xs"
              >
                <CheckCircle2 size={12} />
                {t("alerts.buttons.bulkResolve")}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full max-w-sm justify-end">
            <div className="relative flex-1 max-w-xs">
              <input
                type="text"
                placeholder={t("alerts.searchPlaceholder")}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-10 pr-4 py-2 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-xs text-slate-900"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>
            <button
              onClick={fetchAlerts}
              className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg hover:text-slate-900 shadow-xs active:scale-95 transition-all cursor-pointer flex items-center justify-center h-8 w-8"
              title="Refresh alerts"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Table of Alerts */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4">{t("alerts.table.time")}</th>
                  <th className="p-4">{t("alerts.table.level")}</th>
                  <th className="p-4">{t("alerts.table.module")}</th>
                  <th className="p-4">{t("alerts.table.message")}</th>
                  <th className="p-4">{t("alerts.table.ackBy")}</th>
                  <th className="p-4">{t("alerts.table.resolvedAt")}</th>
                  <th className="p-4 text-right">{t("alerts.table.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="p-10 text-center text-slate-400">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500 mb-2"></div>
                      <div>{t("alerts.state.loading")}</div>
                    </td>
                  </tr>
                ) : alerts.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-10 text-center text-slate-500">
                      {t("alerts.state.empty")}
                    </td>
                  </tr>
                ) : (
                  alerts.slice(page * pageSize, (page + 1) * pageSize).map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-4 text-slate-500">
                        {row.timeRaised ? new Date(row.timeRaised).toLocaleString() : "-"}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          row.severity === "CRITICAL" || row.severity === "ERROR"
                            ? "bg-red-50 text-red-700 border-red-200/60"
                            : row.severity === "WARNING" || row.severity === "WARN"
                            ? "bg-amber-50 text-amber-700 border-amber-200/60"
                            : "bg-blue-50 text-blue-700 border-blue-200/60"
                        }`}>
                          {t("alerts.severity." + row.severity) || row.severity || "WARNING"}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-slate-800">{row.module || "-"}</td>
                      <td className="p-4 text-slate-600 break-words max-w-sm">{row.message || "-"}</td>
                      <td className="p-4 text-slate-500">
                        {row.acknowledgedBy ? (
                          <span className="flex items-center gap-1.5 text-amber-600 font-semibold">
                            <Eye size={12} />
                            <span>{row.acknowledgedBy}</span>
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="p-4 text-slate-500">
                        {row.resolvedAt ? new Date(row.resolvedAt).toLocaleString() : "-"}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          {row.status === "ACTIVE" && (
                            <button
                              onClick={() => handleAcknowledge(row.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200/60 text-amber-700 font-bold text-[10px] transition-colors cursor-pointer active:scale-95"
                            >
                              {t("alerts.actions.ack")}
                            </button>
                          )}
                          {(row.status === "ACTIVE" || row.status === "ACKNOWLEDGED") && (
                            <button
                              onClick={() => handleResolve(row.id)}
                              className="px-2.5 py-1.5 rounded-lg bg-green-50 hover:bg-green-100 border border-green-200/60 text-green-700 font-bold text-[10px] transition-colors cursor-pointer active:scale-95"
                            >
                              {t("alerts.actions.resolve")}
                            </button>
                          )}
                          {row.status === "RESOLVED" && (
                            <span className="text-green-600 font-semibold text-[10px] flex items-center gap-1">
                              <CheckCircle2 size={12} />
                              <span>{t("alerts.state.resolved")}</span>
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
          <TablePagination
            page={page}
            totalPages={Math.ceil(alerts.length / pageSize)}
            onPageChange={setPage}
            totalItems={alerts.length}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
