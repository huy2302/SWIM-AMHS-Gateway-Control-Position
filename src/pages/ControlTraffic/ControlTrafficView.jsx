import React, { useEffect, useState, useCallback, useMemo } from "react";
import DashboardLayout from "@/layout/DashboardLayout";
import { RefreshCw, Search, MailCheck, MailX, PackageCheck, PackageX } from "lucide-react";
import gatewayApi from "@/api/gatewayApi";
import toast from "react-hot-toast";
import { t } from "@/i18n/translator";
import TablePagination from "@/components/TablePagination";

/**
 * Phản hồi AMHS — RN, NRN, DR, NDR bay ngược về cho điện văn gateway đã gửi sang AMHS.
 *
 * Cả bốn loại nằm chung bảng `cp`, phân biệt bằng cột `ipnType`, nên hiển thị một danh sách
 * chung. EUR Doc 047 §2.2.1.1 cấm chuyển chúng sang môi trường SWIM, nên Control Position là
 * điểm đến duy nhất. Appendix A CTSW014/015/113/114 đều đòi "stores the message for appropriate
 * processing at the Control Position" — màn hình này chính là chỗ đó.
 */
export default function ControlTrafficView() {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({ rn: 0, nrn: 0, dr: 0, ndr: 0 });
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 15;

  useEffect(() => {
    setPage(0);
  }, [typeFilter, keyword]);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [list, sum] = await Promise.all([
        gatewayApi.getAmhsFeedback(),
        gatewayApi.getControlTrafficSummary(),
      ]);
      setRows(Array.isArray(list) ? list : []);
      setSummary(sum || { rn: 0, nrn: 0, dr: 0, ndr: 0 });
    } catch (error) {
      console.error("Error fetching AMHS feedback:", error);
      toast.error(t("controlTraffic.loadError"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
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
  const subjectRef = (r) =>
    isReport(r.ipnType)
      ? { label: "MTS", value: r.subjectMts }
      : { label: "IPM", value: r.subjectIpm };

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
        // CTSW114 cố tình để trống diagnostic-code. Hiện rõ "(để trống)" để operator biết đó là
        // dữ liệu đúng chuẩn, không phải mất dữ liệu.
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

  return (
    <DashboardLayout>
      <div className="p-4 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-slate-800">{t("controlTraffic.title")}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{t("controlTraffic.subtitle")}</p>
          </div>
          <button
            onClick={fetchAll}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            {t("controlTraffic.refresh")}
          </button>
        </div>

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
                    "supplementaryInfo", "status"].map((c) => (
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
                    <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-500">{r.id}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${badgeClass(r.ipnType)}`}>
                          {dash(r.ipnType)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs max-w-[200px] truncate" title={r.origin || ""}>
                        {dash(r.origin)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs max-w-[200px] truncate" title={r.recipient || ""}>
                        {dash(r.recipient)}
                      </td>
                      {/* Nhãn IPM/MTS cho biết phản hồi này tra về điện văn gốc bằng khoá nào */}
                      <td className="px-4 py-3 text-xs max-w-[260px]">
                        <span className="inline-block px-1.5 py-0.5 mr-1.5 rounded bg-slate-100 text-slate-500 font-semibold text-[10px]">
                          {ref.label}
                        </span>
                        <span className="font-mono" title={ref.value || ""}>
                          {ref.value ? String(ref.value).slice(0, 32) : "-"}
                        </span>
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
                      <td className="px-4 py-3 text-xs">{dash(r.status)}</td>
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
    </DashboardLayout>
  );
}
