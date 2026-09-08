import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import DashboardLayout from "../../layout/DashboardLayout";
import gatewayApi from "../../api/gatewayApi";
import { Check } from "lucide-react";
import TablePagination from "../../components/TablePagination";
import { t } from "@/i18n/translator";

const getSeverityStyle = (severity) => {
  switch (severity) {
    case "INFO":
      return "bg-emerald-50 text-emerald-700 border-emerald-200/60";
    case "WARN":
      return "bg-amber-50 text-amber-700 border-amber-200/60";
    case "ERROR":
      return "bg-rose-50 text-rose-700 border-rose-200/60";
    default:
      return "bg-slate-50 text-slate-600 border-slate-200/60";
  }
};

const SystemEvents = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [rowCount, setRowCount] = useState(0);

  const [selected, setSelected] = useState(null);
  const user = JSON.parse(localStorage.getItem('user'));

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await gatewayApi.getSystemEventsByUser({
        page,
        size: pageSize,
        userId: user?.userId || 1
      });

      const historiesData = response?.histories;
      setRows(historiesData?.items || historiesData?.content || []);
      setRowCount(historiesData?.totalItems ?? historiesData?.totalElements ?? 0);
    } catch (error) {
      console.error("Load system events failed", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    const interval = setInterval(() => {
      fetchData();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [page, pageSize]);

  const postReadNoti = async (userId, historyId) => {
    try {
      const response = await gatewayApi.postReadNotify(userId, historyId);
      return response;
    } catch (error) {
      console.error('API Error:', error.response?.data || error.message);
      throw error;
    }
  };

  const postReadAllNoti = async (userId) => {
    try {
      const response = await gatewayApi.postReadAllNotify(userId);
      return response;
    } catch (error) {
      console.error('API Error:', error.response?.data || error.message);
      throw error;
    }
  };

  const handleMarkAsRead = async (params) => {
    if (params.row.isRead) {
      return;
    }    
    
    const previousRows = [...rows];
    setRows(prevRows => 
      prevRows.map(row => 
        row.id === params.id ? { ...row, isRead: true } : row
      )
    );

    try {
      await postReadNoti(user?.userId || null, params.row.id);
    } catch (error) {
      setRows(previousRows);
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    const hasUnread = rows.some(row => !row.isRead);
    if (!hasUnread) return;

    const previousRows = [...rows];

    setRows(prevRows =>
      prevRows.map(row => (row.isRead ? row : { ...row, isRead: true }))
    );

    try {
      await postReadAllNoti(user?.userId || null); 
    } catch (error) {
      setRows(previousRows);
      console.error('Error marking all as read:', error);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 py-2">
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          {/* Card Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <span className="text-xs font-bold text-slate-700 tracking-wider">
              {t("sidebar.menu.systemHistory")}
            </span>
            <button 
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-slate-250 rounded-xl shadow-xxs transition-all duration-200 hover:bg-gray-50 hover:text-indigo-650 active:scale-95 cursor-pointer"
            >
              <Check size={14} className="text-slate-550 shrink-0"/>
              {t("systemEvents.markAllRead")}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 tracking-wider border-b border-slate-200">
                  <th className="px-4 py-3 font-semibold text-xs">{t("systemEvents.table.time")}</th>
                  <th className="px-4 py-3 font-semibold text-xs">{t("systemEvents.table.severity")}</th>
                  <th className="px-4 py-3 font-semibold text-xs">{t("systemEvents.table.type")}</th>
                  <th className="px-4 py-3 font-semibold text-xs">{t("systemEvents.table.message")}</th>
                  <th className="px-4 py-3 font-semibold text-xs">{t("systemEvents.table.description")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400 font-medium">
                      {t("systemEvents.status.loading")}
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400 font-medium">
                      {t("systemEvents.status.noData")}
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => handleMarkAsRead({ id: row.id, row })}
                      onDoubleClick={() => setSelected(row)}
                      className={`cursor-pointer transition-all duration-150 border-b border-slate-100 ${
                        !row.isRead
                          ? "bg-sky-50/70 hover:bg-sky-100/70 text-slate-900 font-semibold"
                          : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <td className="px-4 py-3 font-medium whitespace-nowrap">
                        {row.eventTime ? new Date(row.eventTime).toLocaleString() : ""}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getSeverityStyle(row.severity)}`}>
                          {row.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-600">
                        {row.eventType}
                      </td>
                      <td className="px-4 py-3 font-normal max-w-xs truncate">
                        {row.title}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-500">
                        {row.description}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <TablePagination
            page={page}
            totalPages={Math.ceil(rowCount / pageSize)}
            onPageChange={setPage}
            totalItems={rowCount}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[10, 20, 50, 100]}
          />
        </div>

        <Dialog
          open={!!selected}
          onClose={() => setSelected(null)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <span className="text-sm font-bold text-slate-800 tracking-wider">{t("systemEvents.dialog.title")}</span>
          </DialogTitle>

          <DialogContent>
            {selected && (
              <div className="space-y-3 text-xs text-slate-700">
                <div className="flex gap-2">
                  <span className="font-semibold text-slate-500 w-24">{t("systemEvents.table.time")}:</span>
                  <span>{new Date(selected.eventTime).toLocaleString()}</span>
                </div>

                <div className="flex gap-2">
                  <span className="font-semibold text-slate-500 w-24">{t("systemEvents.table.severity")}:</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getSeverityStyle(selected.severity)}`}>
                    {selected.severity}
                  </span>
                </div>

                <div className="flex gap-2">
                  <span className="font-semibold text-slate-500 w-24">{t("systemEvents.table.type")}:</span>
                  <span>{selected.eventType}</span>
                </div>

                <div className="flex gap-2">
                  <span className="font-semibold text-slate-500 w-24">{t("systemEvents.table.message")}:</span>
                  <span>{selected.title}</span>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="font-semibold text-slate-500 block mb-1">{t("systemEvents.dialog.description")}:</span>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 font-mono text-[11px] text-slate-800 whitespace-pre-wrap max-h-60 overflow-y-auto">
                    {selected.description || t("systemEvents.dialog.noDescription")}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default SystemEvents;
