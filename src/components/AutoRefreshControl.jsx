import React from "react";
import { RefreshCw } from "lucide-react";
import { t } from "@/i18n/translator";

/**
 * Component điều khiển Auto-Refresh:
 * - Nút bấm Làm mới tức thì (Manual Refresh)
 * - Dropdown chọn chu kỳ (Tắt, 3s, 5s, 10s, 30s)
 * - Đèn báo trạng thái hoạt động
 */
export default function AutoRefreshControl({
  intervalTime,
  setIntervalTime,
  onRefresh,
  isRefreshing,
  className = "",
}) {
  const isEnabled = intervalTime > 0;

  return (
    <div
      className={`flex items-center bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden shrink-0 h-8 ${className}`}
    >
      {/* Nút bấm làm mới thủ công */}
      <button
        type="button"
        onClick={onRefresh}
        disabled={isRefreshing}
        title={t("global.autoRefresh.refreshNow") || "Làm mới ngay"}
        className="h-full px-2.5 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-r border-slate-200 transition-colors cursor-pointer disabled:opacity-60"
      >
        <RefreshCw
          size={13}
          className={`${isRefreshing ? "animate-spin text-indigo-600" : ""} transition-transform`}
        />
      </button>

      {/* Dropdown chọn chu kỳ tự động */}
      <div className="relative flex items-center px-2 py-1 gap-1.5 bg-slate-50/70 h-full">
        {/* Đèn báo trạng thái auto-refresh */}
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
            isEnabled
              ? isRefreshing
                ? "bg-amber-400 animate-ping"
                : "bg-emerald-500"
              : "bg-slate-300"
          }`}
          title={isEnabled ? "Tự động làm mới đang bật" : "Tự động làm mới đang tắt"}
        />

        <select
          value={intervalTime}
          onChange={(e) => setIntervalTime(Number(e.target.value))}
          title={t("global.autoRefresh.title") || "Tự động làm mới"}
          className="bg-transparent text-[11px] font-semibold text-slate-700 outline-hidden cursor-pointer pr-1"
        >
          <option value={0}>{t("global.autoRefresh.off") || "Tắt"}</option>
          <option value={3000}>3s</option>
          <option value={5000}>5s</option>
          <option value={10000}>10s</option>
          <option value={30000}>30s</option>
        </select>
      </div>
    </div>
  );
}
