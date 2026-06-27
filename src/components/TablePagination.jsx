import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { t } from "@/i18n/translator";

export default function TablePagination({
  page,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100]
}) {
  return (
    <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-4">
      <div className="text-xs text-slate-500 flex items-center gap-1.5">
        <span>{t("global.pagination.page")}</span>
        <span className="font-semibold text-slate-900">{page + 1}</span>
        <span>{t("global.pagination.of")}</span>
        <span className="font-semibold text-slate-900">{totalPages || 1}</span>
        {totalItems !== undefined && (
          <span className="ml-1 text-slate-400">
            ({totalItems} {t("global.pagination.items")})
          </span>
        )}
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>{t("global.pagination.rowsPerPage")}</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-white border border-slate-300 rounded px-1.5 py-1 text-slate-700 font-medium outline-none focus:border-indigo-500 cursor-pointer text-xs"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => onPageChange(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-2.5 py-1.5 bg-white border border-slate-300 text-xs rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 font-semibold text-slate-600 active:scale-95 transition-all"
          >
            <ChevronLeft size={14} />
            <span>{t("global.pagination.previous")}</span>
          </button>
          <button
            onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
            disabled={page === totalPages - 1 || totalPages <= 1}
            className="px-2.5 py-1.5 bg-white border border-slate-300 text-xs rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 font-semibold text-slate-600 active:scale-95 transition-all"
          >
            <span>{t("global.pagination.next")}</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
