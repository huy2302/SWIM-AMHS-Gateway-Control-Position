import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/layout/DashboardLayout";
import {
  Search,
  MailCheck,
  MailX,
  PackageCheck,
  PackageX,
  ExternalLink,
  Eye,
  X,
  Copy,
  Check,
  FileText,
  AlertTriangle,
  Info,
  ArrowUpRight
} from "lucide-react";
import gatewayApi from "@/api/gatewayApi";
import toast from "react-hot-toast";
import { t } from "@/i18n/translator";
import TablePagination from "@/components/TablePagination";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { copyToClipboard } from "@/utils/clipboard";

/**
 * Phản hồi AMHS — RN, NRN, DR, NDR bay ngược về cho điện văn gateway đã gửi sang AMHS.
 */
export default function ControlTrafficView() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({ rn: 0, nrn: 0, dr: 0, ndr: 0 });
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 15;

  const [selectedRecord, setSelectedRecord] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  useEffect(() => {
    setPage(0);
  }, [typeFilter, keyword]);

  const fetchAll = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const [list, sum] = await Promise.all([
        gatewayApi.getAmhsFeedback(),
        gatewayApi.getControlTrafficSummary(),
      ]);
      setRows(Array.isArray(list) ? list : []);
      setSummary(sum || { rn: 0, nrn: 0, dr: 0, ndr: 0 });
    } catch (error) {
      console.error("Error fetching control traffic:", error);
      if (!isBackground) {
        toast.error(t("controlTraffic.loadError"));
      }
    } finally {
      if (!isBackground) {
        setLoading(false);
      }
    }
  }, []);

  useAutoRefresh({
    onRefresh: fetchAll,
    defaultInterval: 5000,
  });

  useEffect(() => {
    fetchAll(false);
  }, [fetchAll]);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return rows.filter((r) => {
      if (typeFilter !== "ALL" && r.ipnType !== typeFilter) return false;
      if (!kw) return true;
      return Object.values(r).some(
        (v) => v != null && String(v).toLowerCase().includes(kw)
      );
    });
  }, [rows, typeFilter, keyword]);

  const paged = filtered.slice(page * pageSize, page * pageSize + pageSize);

  const dash = (value) =>
    value === null || value === undefined || String(value).trim() === "" ? "-" : value;

  /** NDR và NRN là tin xấu — tô đỏ để operator không lướt qua giữa danh sách dài. */
  const badgeClass = (type) =>
    type === "NDR" || type === "NRN"
      ? "bg-rose-100 text-rose-700"
      : "bg-emerald-100 text-emerald-700";

  const isReport = (type) => type === "DR" || type === "NDR";

  /**
   * Khoá đối chiếu về điện văn gốc khác nhau theo tầng sinh ra phản hồi: MTA sinh report mà
   * không giải mã nội dung nên chỉ biết MTS-Id; người nhận sinh IPN sau khi đã đọc nên biết IPM-Id.
   */
  const subjectRef = (r) => {
    if (!r) return { label: "REF", value: null };
    return isReport(r.ipnType)
      ? { label: "MTS", value: r.subjectMts }
      : { label: "IPM", value: r.subjectIpm };
  };

  /**
   * Điều hướng sang Kho điện văn (Messages) với query tìm kiếm và tự động mở modal điện văn gốc
   */
  const handleNavigateToOriginal = (record, e) => {
    if (e) e.stopPropagation();
    const ref = subjectRef(record);
    if (!ref.value) {
      toast.error(t("controlTraffic.modal.noSubject"));
      return;
    }
    navigate("/messages", {
      state: {
        searchQuery: ref.value,
        searchType: "AMQP",
        autoOpen: true,
      },
    });
  };

  const handleCopy = async (text, fieldKey, e) => {
    if (e) e.stopPropagation();
    if (!text) return;
    const ok = await copyToClipboard(String(text), {
      showToast: true,
      successMessage: t("controlTraffic.modal.copied") || t("global.copied") || "Đã sao chép",
      duration: 1500,
    });
    if (ok) {
      setCopiedField(fieldKey);
      setTimeout(() => setCopiedField(null), 1500);
    }
  };

  /**
   * Cột "Chi tiết" gộp các trường riêng của từng loại, vì mỗi loại chỉ dùng vài trường và để
   * cột riêng cho từng loại thì bảng rỗng quá nửa.
   */
  const detailOf = (r) => {
    if (r.ipnType === "NDR") {
      const code = r.diagnosticCode && String(r.diagnosticCode).trim() !== ""
        ? r.diagnosticCode
        : null;
      return {
        main: dash(r.reasonCode),
        extra: code || t("controlTraffic.diagnosticEmpty"),
        muted: !code,
      };
    }
    if (r.ipnType === "NRN") {
      return {
        main: r.nonReceiptReason != null ? `non-receipt-reason=${r.nonReceiptReason}` : "-",
        extra: r.discardReason != null ? `discard-reason=${r.discardReason}` : null,
        muted: false,
      };
    }
    if (r.ipnType === "RN") {
      return { main: dash(r.receiptTime), extra: null, muted: false };
    }
    return { main: "-", extra: null, muted: false };
  };

  const stats = [
    { key: "ndr", value: summary.ndr, Icon: PackageX, tone: "text-rose-600" },
    { key: "dr", value: summary.dr, Icon: PackageCheck, tone: "text-emerald-600" },
    { key: "nrn", value: summary.nrn, Icon: MailX, tone: "text-amber-600" },
    { key: "rn", value: summary.rn, Icon: MailCheck, tone: "text-sky-600" },
  ];

  const selectedRef = selectedRecord ? subjectRef(selectedRecord) : null;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map(({ key, value, Icon, tone }) => (
            <div key={key} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2">
                <Icon size={16} className={tone} />
                <span className="text-xs font-semibold text-slate-500">
                  {t(`controlTraffic.stats.${key}`)}
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-800 mt-1">{value ?? 0}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 p-3 flex-wrap border-b border-slate-100">
            <div className="relative flex-1 min-w-[220px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder={t("controlTraffic.filter.search")}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
            </div>
            <div className="flex items-center gap-1 flex-wrap">
              {["ALL", "NDR", "DR", "NRN", "RN"].map((option) => (
                <button
                  key={option}
                  onClick={() => setTypeFilter(option)}
                  className={
                    typeFilter === option
                      ? "px-3 py-2 text-xs font-semibold rounded-lg bg-sky-600 text-white"
                      : "px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }
                >
                  {option === "ALL" ? t("controlTraffic.filter.all") : option}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  {["id", "type", "origin", "recipient", "subject", "detail",
                    "supplementaryInfo", "status", "actions"].map((c) => (
                    <th key={c} className="px-4 py-3 text-left font-semibold text-xs whitespace-nowrap">
                      {t(`controlTraffic.columns.${c}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((r) => {
                  const ref = subjectRef(r);
                  const detail = detailOf(r);
                  return (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedRecord(r)}
                      className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 text-slate-500 font-mono text-xs">{r.id}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${badgeClass(r.ipnType)}`}>
                          {dash(r.ipnType)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs max-w-[180px] truncate" title={r.origin || ""}>
                        {dash(r.origin)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs max-w-[180px] truncate" title={r.recipient || ""}>
                        {dash(r.recipient)}
                      </td>
                      {/* Nhãn IPM/MTS cho biết phản hồi này tra về điện văn gốc bằng khoá nào + link trực tiếp */}
                      <td className="px-4 py-3 text-xs max-w-[260px]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-semibold text-[10px]">
                            {ref.label}
                          </span>
                          {ref.value ? (
                            <button
                              type="button"
                              onClick={(e) => handleNavigateToOriginal(r, e)}
                              className="font-mono text-sky-600 hover:text-sky-800 hover:underline inline-flex items-center gap-1 truncate max-w-[180px] text-left"
                              title={`${t("controlTraffic.viewOriginal")}: ${ref.value}`}
                            >
                              <span className="truncate">{ref.value}</span>
                              <ExternalLink size={12} className="flex-shrink-0 text-sky-500" />
                            </button>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div className="font-mono">{detail.main}</div>
                        {detail.extra && (
                          <div className={`font-mono ${detail.muted ? "text-slate-400 italic" : "text-slate-500"}`}>
                            {detail.extra}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs max-w-xs truncate" title={r.supplementaryInfo || ""}>
                        {dash(r.supplementaryInfo)}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs font-mono">
                          {dash(r.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedRecord(r)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                            title={t("controlTraffic.viewDetail")}
                          >
                            <Eye size={15} />
                          </button>
                          {ref.value && (
                            <button
                              type="button"
                              onClick={(e) => handleNavigateToOriginal(r, e)}
                              className="p-1.5 rounded-lg text-sky-600 hover:text-sky-800 hover:bg-sky-50 transition-colors"
                              title={t("controlTraffic.viewOriginal")}
                            >
                              <ExternalLink size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {!loading && filtered.length === 0 && (
              <div className="px-4 py-10 text-center text-sm text-slate-400">
                {t("controlTraffic.empty")}
              </div>
            )}
          </div>

          {filtered.length > pageSize && (
            <TablePagination
              page={page}
              totalPages={Math.ceil(filtered.length / pageSize)}
              onPageChange={setPage}
              totalItems={filtered.length}
            />
          )}
        </div>
      </div>

      {/* Modal xem chi tiết phản hồi AMHS */}
      {selectedRecord && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedRecord(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-sky-100 text-sky-700">
                  <FileText size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800 text-base">
                      {t("controlTraffic.modal.title")} #{selectedRecord.id}
                    </h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${badgeClass(selectedRecord.ipnType)}`}>
                      {selectedRecord.ipnType}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-sm">
              {/* Section 1: Thông tin đối chiếu điện văn gốc (QUAN TRỌNG NHẤT) */}
              <div className="bg-sky-50/60 border border-sky-200/80 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sky-900 font-semibold text-xs uppercase tracking-wider">
                    <ArrowUpRight size={15} className="text-sky-600" />
                    {t("controlTraffic.modal.subjectSection")}
                  </div>
                  {selectedRef?.value && (
                    <button
                      type="button"
                      onClick={() => handleNavigateToOriginal(selectedRecord)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition-all"
                      title={t("controlTraffic.modal.viewOriginalTooltip")}
                    >
                      <ExternalLink size={13} />
                      {t("controlTraffic.viewOriginal")}
                    </button>
                  )}
                </div>

                <div className="flex items-start gap-3 bg-white p-3 rounded-lg border border-sky-100">
                  <span className="px-2 py-1 rounded bg-sky-100 text-sky-800 font-bold text-xs">
                    {selectedRef?.label}
                  </span>
                  <div className="flex-1 min-w-0 font-mono text-xs text-slate-800 break-all select-all">
                    {selectedRef?.value || (
                      <span className="text-slate-400 italic">
                        {t("controlTraffic.modal.noSubject")}
                      </span>
                    )}
                  </div>
                  {selectedRef?.value && (
                    <button
                      type="button"
                      onClick={(e) => handleCopy(selectedRef.value, "subjectRef", e)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors"
                      title={t("controlTraffic.modal.copy")}
                    >
                      {copiedField === "subjectRef" ? (
                        <Check size={14} className="text-emerald-600" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Section 2: Thông tin chung */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  {t("controlTraffic.modal.general")}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-xs text-slate-500 block mb-0.5">
                      {t("controlTraffic.modal.fields.type")}
                    </span>
                    <span className="font-semibold text-slate-800 text-xs">
                      {dash(selectedRecord.ipnType)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block mb-0.5">
                      {t("controlTraffic.modal.fields.status")}
                    </span>
                    <span className="font-mono text-slate-800 text-xs">
                      {dash(selectedRecord.status)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block mb-0.5">
                      {t("controlTraffic.modal.fields.origin")}
                    </span>
                    <div className="flex items-center gap-1.5 font-mono text-xs text-slate-800 break-all">
                      <span>{dash(selectedRecord.origin)}</span>
                      {selectedRecord.origin && (
                        <button
                          type="button"
                          onClick={(e) => handleCopy(selectedRecord.origin, "origin", e)}
                          className="text-slate-400 hover:text-slate-700"
                        >
                          {copiedField === "origin" ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block mb-0.5">
                      {t("controlTraffic.modal.fields.recipient")}
                    </span>
                    <div className="flex items-center gap-1.5 font-mono text-xs text-slate-800 break-all">
                      <span>{dash(selectedRecord.recipient)}</span>
                      {selectedRecord.recipient && (
                        <button
                          type="button"
                          onClick={(e) => handleCopy(selectedRecord.recipient, "recipient", e)}
                          className="text-slate-400 hover:text-slate-700"
                        >
                          {copiedField === "recipient" ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Mã kết quả & Chẩn đoán (Diagnostics & Reasons) */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  {t("controlTraffic.modal.diagnostics")}
                </h4>
                <div className="space-y-2.5 bg-slate-50/70 p-4 rounded-xl border border-slate-100">
                  {selectedRecord.ipnType === "NDR" && (
                    <>
                      <div className="flex items-start justify-between gap-2 border-b border-slate-200/60 pb-2">
                        <span className="text-xs text-slate-500">
                          {t("controlTraffic.modal.fields.reasonCode")}
                        </span>
                        <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-rose-600">
                          <span>{dash(selectedRecord.reasonCode)}</span>
                          {selectedRecord.reasonCode && (
                            <button
                              type="button"
                              onClick={(e) => handleCopy(selectedRecord.reasonCode, "reasonCode", e)}
                              className="text-slate-400 hover:text-slate-700"
                            >
                              {copiedField === "reasonCode" ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-start justify-between gap-2 border-b border-slate-200/60 pb-2">
                        <span className="text-xs text-slate-500">
                          {t("controlTraffic.modal.fields.diagnosticCode")}
                        </span>
                        <div className="flex items-center gap-1.5 font-mono text-xs text-slate-800">
                          <span>{dash(selectedRecord.diagnosticCode)}</span>
                          {selectedRecord.diagnosticCode && (
                            <button
                              type="button"
                              onClick={(e) => handleCopy(selectedRecord.diagnosticCode, "diagnosticCode", e)}
                              className="text-slate-400 hover:text-slate-700"
                            >
                              {copiedField === "diagnosticCode" ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                            </button>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {selectedRecord.ipnType === "NRN" && (
                    <>
                      <div className="flex items-start justify-between gap-2 border-b border-slate-200/60 pb-2">
                        <span className="text-xs text-slate-500">
                          {t("controlTraffic.modal.fields.nonReceiptReason")}
                        </span>
                        <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-amber-600">
                          <span>{dash(selectedRecord.nonReceiptReason)}</span>
                          {selectedRecord.nonReceiptReason && (
                            <button
                              type="button"
                              onClick={(e) => handleCopy(selectedRecord.nonReceiptReason, "nonReceiptReason", e)}
                              className="text-slate-400 hover:text-slate-700"
                            >
                              {copiedField === "nonReceiptReason" ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-start justify-between gap-2 border-b border-slate-200/60 pb-2">
                        <span className="text-xs text-slate-500">
                          {t("controlTraffic.modal.fields.discardReason")}
                        </span>
                        <div className="flex items-center gap-1.5 font-mono text-xs text-slate-800">
                          <span>{dash(selectedRecord.discardReason)}</span>
                          {selectedRecord.discardReason && (
                            <button
                              type="button"
                              onClick={(e) => handleCopy(selectedRecord.discardReason, "discardReason", e)}
                              className="text-slate-400 hover:text-slate-700"
                            >
                              {copiedField === "discardReason" ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                            </button>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {selectedRecord.ipnType === "RN" && (
                    <div className="flex items-start justify-between gap-2 border-b border-slate-200/60 pb-2">
                      <span className="text-xs text-slate-500">
                        {t("controlTraffic.modal.fields.receiptTime")}
                      </span>
                      <span className="font-mono text-xs text-emerald-700 font-semibold">
                        {dash(selectedRecord.receiptTime)}
                      </span>
                    </div>
                  )}

                  {selectedRecord.ipnType === "DR" && (
                    <div className="flex items-start justify-between gap-2 border-b border-slate-200/60 pb-2">
                      <span className="text-xs text-slate-500">
                        {t("controlTraffic.modal.fields.status")}
                      </span>
                      <span className="font-mono text-xs text-emerald-700 font-semibold">
                        DELIVERED (DR)
                      </span>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-500 block">
                        {t("controlTraffic.modal.fields.supplementaryInfo")}
                      </span>
                      {selectedRecord.supplementaryInfo && (
                        <button
                          type="button"
                          onClick={(e) => handleCopy(selectedRecord.supplementaryInfo, "supplementaryInfo", e)}
                          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-700"
                        >
                          {copiedField === "supplementaryInfo" ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                          <span>{copiedField === "supplementaryInfo" ? (t("controlTraffic.modal.copied") || "Đã sao chép") : (t("controlTraffic.modal.copy") || "Sao chép")}</span>
                        </button>
                      )}
                    </div>
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs font-mono text-slate-700 whitespace-pre-wrap break-all min-h-[40px]">
                      {dash(selectedRecord.supplementaryInfo)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50/50">
              <div className="text-xs text-slate-400">
                {t("controlTraffic.title")}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/70 rounded-lg transition-colors"
                >
                  {t("controlTraffic.modal.close")}
                </button>
                {selectedRef?.value && (
                  <button
                    type="button"
                    onClick={() => handleNavigateToOriginal(selectedRecord)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition-all"
                  >
                    <ExternalLink size={14} />
                    {t("controlTraffic.viewOriginal")}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

