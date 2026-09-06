import React, { useEffect, useState, useCallback, useMemo } from "react";
import DashboardLayout from "@/layout/DashboardLayout";
import { RefreshCw, Search, MailCheck, MailX, PackageCheck, PackageX } from "lucide-react";
import gatewayApi from "@/api/gatewayApi";
import toast from "react-hot-toast";
import { t } from "@/i18n/translator";
import TablePagination from "@/components/TablePagination";

/**
 * Phản hồi AMHS — IPN (RN/NRN) và Report (DR/NDR) bay ngược về cho điện văn gateway đã gửi
 * sang AMHS.
 *
 * EUR Doc 047 §2.2.1.1 cấm chuyển chúng sang môi trường SWIM, nên Control Position là điểm
 * đến duy nhất. Appendix A CTSW014/015/113/114 đều đòi "stores the message for appropriate
 * processing at the Control Position" — màn hình này chính là chỗ đó.
 */
export default function ControlTrafficView() {
  const [tab, setTab] = useState("report"); // "report" | "ipn"
  const [ipnList, setIpnList] = useState([]);
  const [reportList, setReportList] = useState([]);
  const [summary, setSummary] = useState({ rn: 0, nrn: 0, dr: 0, ndr: 0 });
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    setPage(0);
  }, [tab, typeFilter, keyword]);

  // Đổi tab thì bộ lọc loại của tab cũ (RN/NRN vs DR/NDR) không còn nghĩa
  useEffect(() => {
    setTypeFilter("ALL");
  }, [tab]);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [ipn, report, sum] = await Promise.all([
        gatewayApi.getIncomingIpn(),
        gatewayApi.getIncomingReports(),
        gatewayApi.getControlTrafficSummary(),
      ]);
      setIpnList(Array.isArray(ipn) ? ipn : []);
      setReportList(Array.isArray(report) ? report : []);
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

  const rows = tab === "ipn" ? ipnList : reportList;

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return rows.filter((r) => {
      const type = tab === "ipn" ? r.notificationType : r.reportType;
      if (typeFilter !== "ALL" && type !== typeFilter) return false;
      if (!kw) return true;
      return Object.values(r).some(
        (v) => v != null && String(v).toLowerCase().includes(kw)
      );
    });
  }, [rows, tab, typeFilter, keyword]);

  const paged = filtered.slice(page * pageSize, page * pageSize + pageSize);

  const typeOptions = tab === "ipn" ? ["RN", "NRN"] : ["DR", "NDR"];

  const formatTime = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString();
  };

  const dash = (value) =>
    value === null || value === undefined || String(value).trim() === "" ? "-" : value;

  /** NDR và NRN là tin xấu — tô đỏ để operator thấy ngay giữa danh sách dài. */
  const badgeClass = (type) =>
    type === "NDR" || type === "NRN"
      ? "bg-rose-100 text-rose-700"
      : "bg-emerald-100 text-emerald-700";

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
          <div className="flex items-center gap-2 border-b border-slate-100 px-3">
            {["report", "ipn"].map((key) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={
                  tab === key
                    ? "px-3 py-3 text-sm font-semibold text-sky-700 border-b-2 border-sky-600"
                    : "px-3 py-3 text-sm font-medium text-slate-500 hover:text-slate-700"
                }
              >
                {t(`controlTraffic.tabs.${key}`)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 p-3 flex-wrap">
            <div className="relative flex-1 min-w-[220px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder={t("controlTraffic.filter.search")}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
            </div>
            <div className="flex items-center gap-1">
              {["ALL", ...typeOptions].map((option) => (
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
            {tab === "ipn" ? (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    {["id", "type", "orAddress", "subjectIpmId", "subjectMtsId", "receiptTime",
                      "nonReceiptReason", "receivedAt", "status"].map((c) => (
                      <th key={c} className="px-4 py-3 text-left font-semibold text-xs whitespace-nowrap">
                        {t(`controlTraffic.ipnColumns.${c}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paged.map((r) => (
                    <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-500">{r.id}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${badgeClass(r.notificationType)}`}>
                          {r.notificationType}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{dash(r.orAddress)}</td>
                      <td className="px-4 py-3 font-mono text-xs">{dash(r.subjectIpmId)}</td>
                      <td className="px-4 py-3 font-mono text-xs">{dash(r.subjectMtsId)}</td>
                      <td className="px-4 py-3 text-xs">{dash(r.receiptTime)}</td>
                      <td className="px-4 py-3 text-xs">{dash(r.nonReceiptReason)}</td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap">{formatTime(r.receivedAt)}</td>
                      <td className="px-4 py-3 text-xs">{dash(r.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    {["id", "type", "recipient", "gwinId", "subjectMtsId", "reasonCode",
                      "diagnosticCode", "supplementaryInfo", "receivedAt", "status"].map((c) => (
                      <th key={c} className="px-4 py-3 text-left font-semibold text-xs whitespace-nowrap">
                        {t(`controlTraffic.reportColumns.${c}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paged.map((r) => (
                    <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-500">{r.id}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${badgeClass(r.reportType)}`}>
                          {r.reportType}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{dash(r.recipient)}</td>
                      <td className="px-4 py-3 text-xs">{r.gwinId ? `gwin#${r.gwinId}` : "-"}</td>
                      <td className="px-4 py-3 font-mono text-xs">{dash(r.subjectMtsId)}</td>
                      <td className="px-4 py-3 font-mono text-xs">{dash(r.reasonCode)}</td>
                      {/* CTSW114: NDR của nó cố tình để trống diagnostic-code. Hiện rõ "(để trống)"
                          để operator biết đó là dữ liệu đúng chuẩn, không phải lỗi mất dữ liệu. */}
                      <td className="px-4 py-3 font-mono text-xs">
                        {r.diagnosticCode && String(r.diagnosticCode).trim() !== "" ? (
                          r.diagnosticCode
                        ) : (
                          <span className="text-slate-400 italic">{t("controlTraffic.diagnosticEmpty")}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs max-w-xs truncate" title={r.supplementaryInfo || ""}>
                        {dash(r.supplementaryInfo)}
                      </td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap">{formatTime(r.receivedAt)}</td>
                      <td className="px-4 py-3 text-xs">{dash(r.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {!loading && filtered.length === 0 && (
              <div className="px-4 py-10 text-center text-sm text-slate-400">
                {t(`controlTraffic.empty.${tab}`)}
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
