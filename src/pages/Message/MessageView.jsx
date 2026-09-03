import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import {
  Search,
  XCircle,
  Copy,
  Check,
  Send,
  Inbox,
  AlertCircle,
  Paperclip,
  Download,
  FileText
} from "lucide-react";
import toast from "react-hot-toast";
import DashboardLayout from "@/layout/DashboardLayout";
import gatewayApi from "@/api/gatewayApi";
import TablePagination from "@/components/TablePagination";
import { t } from "@/i18n/translator";

const MessageView = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const hasAutoOpenedRef = useRef(false);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return "-";
    const num = Number(bytes);
    if (num < 1024) return `${num} B`;
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
    return `${(num / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleDownloadAttachment = (item) => {
    try {
      const content = item.payloadContent || item.text || "";
      if (!content) {
        toast.error(t("messages.toast.downloadFailed"));
        return;
      }
      let blob;
      try {
        const cleanBase64 = content.replace(/\s+/g, '');
        const byteCharacters = atob(cleanBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const mimeType = item.contentType?.split(';')[0]?.trim() || "application/octet-stream";
        blob = new Blob([byteArray], { type: mimeType });
      } catch {
        blob = new Blob([content], { type: item.contentType || "text/plain" });
      }

      const fileName = item.ftbpFileName || (item.messageId ? `${item.messageId}.bin` : "data.bin");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(t("messages.toast.downloadSuccess"));
    } catch (err) {
      console.error("Failed to download attachment:", err);
      toast.error(t("messages.toast.downloadFailed"));
    }
  };

  const handleCloseModal = () => {
    hasAutoOpenedRef.current = true;
    setSelectedItem(null);
    setSelectedId(null);
    window.history.replaceState({}, document.title);
  };

  const handleSelectMessage = async (row) => {
    const rowId = row.msgid || row.id;
    setSelectedId(rowId);
    setSelectedItem(row);
    try {
      const fetchFunc = searchType === "AMQP" 
        ? gatewayApi.getInboundMessageById 
        : gatewayApi.getOutboundMessageById;
      const res = await fetchFunc(rowId);
      if (res && res.message) {
        setSelectedItem(prev => ({
          ...prev,
          ...res.message,
          dispatches: res.dispatches || []
        }));
      }
    } catch (err) {
      console.warn("Could not load extended detail for message:", err);
    }
  };

  const isFailedStatus = (status, type) => {
    if (type === "AMQP") return Number(status) === 4 || Number(status) === 11;
    return Number(status) === 3;
  };

  const isUnroutedStatus = (status, type) => {
    if (type === "AMQP") return Number(status) === 1;
    return Number(status) === 4;
  };

  const getRejectionInfo = (item) => {
    if (!item) return { rejReason: null, rejDiag: null, hasError: false };
    const rejReason = 
      item.rejectionReason || 
      item.parsedAmqpProperties?.rejection_reason || 
      item.parsedAmqpProperties?.rejectionReason || null;

    const rejDiag = 
      item.rejectionDiagnostic || 
      item.parsedAmqpProperties?.rejection_note || 
      item.parsedAmqpProperties?.rejectionDiagnostic ||
      item.errorDesc ||
      (item.dispatches?.find(d => d.lastError)?.lastError) || null;

    const hasError = Boolean(
      rejReason || 
      rejDiag || 
      (item.dispatches && item.dispatches.some(d => d.lastError || d.status === 'FAILED' || d.status === 'DEAD'))
    );

    return { rejReason, rejDiag, hasError };
  };

  // Mode: AMQP (SWIM -> AMHS) or X.400 (AMHS -> SWIM)
  const [searchType, setSearchType] = useState("AMQP");
  const [rows, setRows] = useState([]);
  
  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    status: '',
    source: '',
  });

  // Fetch messages API
  const fetchArchiveData = useCallback(async () => {
    setLoading(true);
    try {
      let response;
      const params = {
        page: page,
        size: rowsPerPage,
        ...(filters.status !== '' && { status: parseInt(filters.status) }),
        ...(filters.source && { source: filters.source }),
        ...(searchQuery.trim() && { query: searchQuery.trim() }),
      };

      if (searchType === "AMQP") {
        response = await gatewayApi.getAllSwimMessages(params);
      } else {
        response = await gatewayApi.getAllAmhsMessages(params);
      }
      
      const itemsList = response?.items || response?.content || [];
      if (response && (response.items || response.content)) {
        setRows(itemsList);
        setTotalElements(response.totalItems ?? response.totalElements ?? 0);
        setTotalPages(response.totalPages || 0);
      } else {
        setRows([]);
        setTotalElements(0);
        setTotalPages(0);
      }
    } catch (error) {
      console.error("Error fetching archive data:", error);
      setRows([]);
      setTotalElements(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, filters, searchQuery, searchType]);

  useEffect(() => {
    fetchArchiveData();
  }, [fetchArchiveData]);

  // Handle deep-linking navigation from Logs, Alerts, or Unrouted Queue
  useEffect(() => {
    const queryParam = searchParams.get("search") || location.state?.searchQuery;
    const typeParam = searchParams.get("type") || location.state?.searchType;
    
    if (queryParam) {
      setSearchQuery(queryParam);
      if (typeParam && (typeParam === "AMQP" || typeParam === "X400")) {
        setSearchType(typeParam);
      }
      setPage(0);
      hasAutoOpenedRef.current = false;
    }
  }, [location.state, searchParams]);

  // Auto-open modal when navigating with autoOpen flag (run once only)
  useEffect(() => {
    if (!hasAutoOpenedRef.current && location.state?.autoOpen && rows.length > 0) {
      const q = (location.state.searchQuery || searchParams.get("search") || "").trim().toLowerCase();
      if (q) {
        const match = rows.find(r => 
          String(r.id || "").toLowerCase() === q ||
          String(r.msgid || "").toLowerCase() === q ||
          String(r.messageId || "").toLowerCase() === q ||
          String(r.amhsid || "").toLowerCase() === q ||
          String(r.ipmId || "").toLowerCase() === q ||
          String(r.mtsId || "").toLowerCase() === q
        ) || rows[0];
        if (match) {
          hasAutoOpenedRef.current = true;
          handleSelectMessage(match);
          window.history.replaceState({}, document.title);
        }
      }
    }
  }, [rows, location.state, searchParams]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setFilters({ status: '', source: '' });
    setPage(0);
  };

  const handleCopy = (text) => {
    if (text) {
      navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 relative">
        
        {/* CLEAN UNIFIED SEARCH TOOLBAR */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
          
          {/* Segmented Direction Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 shrink-0">
            <button
              onClick={() => {
                setSearchType("AMQP");
                setPage(0);
                setFilters((prev) => ({ ...prev, status: '' }));
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                searchType === "AMQP"
                  ? "bg-white text-indigo-650 shadow-xs border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Inbox size={15} />
              <span>{t("messages.tabs.amqp")}</span>
            </button>

            <button
              onClick={() => {
                setSearchType("X.400");
                setPage(0);
                setFilters((prev) => ({ ...prev, status: '' }));
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                searchType === "X.400"
                  ? "bg-white text-indigo-650 shadow-xs border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Send size={15} />
              <span>{t("messages.tabs.x400")}</span>
            </button>
          </div>

          {/* SEARCH INPUT & STATUS SELECT */}
          <div className="flex flex-wrap items-center gap-2.5 flex-1 max-w-2xl justify-end">
            <div className="relative flex-1 min-w-[240px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(0);
                }}
                placeholder={t("messages.toolbar.searchPlaceholder")}
                className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 font-medium transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => {
                    setSearchQuery("");
                    setPage(0);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <XCircle size={14} />
                </button>
              )}
            </div>

            {/* Status Select */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 shrink-0">
              <span className="text-[10px] text-slate-500 font-bold">{t("messages.toolbar.status")}</span>
              <select
                value={filters.status}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, status: e.target.value }));
                  setPage(0);
                }}
                className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
              >
                <option value="">{t("messages.status.ALL")}</option>
                {searchType === "AMQP" ? (
                  <>
                    <option value="0">{t("messages.status.PENDING")}</option>
                    <option value="1">{t("messages.status.UNROUTED")}</option>
                    <option value="2">{t("messages.status.TRANSFORMED")}</option>
                    <option value="10">{t("messages.status.DELIVERED")}</option>
                    <option value="11">{t("messages.status.FAILED")}</option>
                    <option value="5">{t("messages.status.RESOLVED")}</option>
                    <option value="6">{t("messages.status.CANCELLED")}</option>
                  </>
                ) : (
                  <>
                    <option value="0">{t("messages.status.PENDING")}</option>
                    <option value="1">{t("messages.status.TRANSFORMED")}</option>
                    <option value="2">{t("messages.status.PUBLISHED")}</option>
                    <option value="3">{t("messages.status.FAILED")}</option>
                    <option value="4">{t("messages.status.UNROUTED")}</option>
                    <option value="5">{t("messages.status.RESOLVED")}</option>
                    <option value="6">{t("messages.status.CANCELLED")}</option>
                  </>
                )}
              </select>
            </div>

            {/* Reset Filters */}
            {(filters.status !== '' || searchQuery) && (
              <button
                onClick={handleResetFilters}
                className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors font-medium cursor-pointer"
              >
                {t("messages.toolbar.resetFilter")}
              </button>
            )}
          </div>

        </div>

        {/* MAIN DATA TABLE CONTAINER */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto min-h-[260px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 tracking-wider border-b border-slate-200">
                  {searchType === "AMQP" ? (
                    <>
                      <th className="px-4 py-3 font-semibold">{t("messages.table.columns.id")}</th>
                      <th className="px-4 py-3 font-semibold">{t("messages.table.columns.messageId")}</th>
                      <th className="px-4 py-3 font-semibold">{t("messages.table.columns.time")}</th>
                      <th className="px-4 py-3 font-semibold">{t("messages.table.columns.topic")}</th>
                      <th className="px-4 py-3 font-semibold">{t("messages.table.columns.atsmhsLevel")}</th>
                      <th className="px-4 py-3 font-semibold">{t("messages.table.columns.origin")}</th>
                      <th className="px-4 py-3 font-semibold">{t("messages.table.columns.address")}</th>
                      <th className="px-4 py-3 font-semibold">{t("messages.table.columns.payload")}</th>
                      <th className="px-4 py-3 font-semibold">{t("messages.table.columns.status")}</th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-3 font-semibold">{t("messages.table.columns.id")}</th>
                      <th className="px-4 py-3 font-semibold">{t("messages.table.columns.time")}</th>
                      <th className="px-4 py-3 font-semibold">{t("messages.table.columns.origin")}</th>
                      <th className="px-4 py-3 font-semibold">{t("messages.table.columns.filingTime")}</th>
                      <th className="px-4 py-3 font-semibold">{t("messages.table.columns.amhsId")}</th>
                      <th className="px-4 py-3 font-semibold">{t("messages.table.columns.payload")}</th>
                      <th className="px-4 py-3 font-semibold">{t("messages.table.columns.status")}</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={searchType === "AMQP" ? 9 : 7} className="text-center py-8 text-slate-400 font-medium">
                      {t("messages.table.loading")}
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={searchType === "AMQP" ? 9 : 7} className="text-center py-8 text-slate-400 font-medium">
                      {t("messages.table.empty")}
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => {
                    const rowId = row.msgid;
                    const isSelected = selectedId === rowId;
                    const rawContent = row.payloadContent || row.text || "";

                    return (
                      <tr
                        key={rowId}
                        onClick={() => handleSelectMessage(row)}
                        className={`cursor-pointer transition-all border-b border-slate-100 ${
                          isSelected
                            ? "bg-indigo-50/70 text-slate-900 font-semibold ring-1 ring-indigo-200"
                            : "hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        {searchType === "AMQP" ? (
                          <>
                            <td className="px-4 py-3 font-semibold text-slate-500">{row.msgid}</td>
                            <td className="px-4 py-3 font-mono text-[11px] max-w-[140px] truncate" title={row.messageId}>{row.messageId || "-"}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{row.time ? new Date(row.time).toLocaleString() : "-"}</td>
                            <td className="px-4 py-3 font-mono text-[11px] text-slate-600">{row.source || "-"}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{renderAtsmhsLevel(row.atsmhsServiceLevel)}</td>
                            <td className="px-4 py-3 font-mono font-bold text-slate-800">{row.origin || "-"}</td>
                            <td className="px-4 py-3 font-mono text-[11px] max-w-[150px] truncate text-slate-600" title={row.amhsRecipients || row.address}>{row.amhsRecipients || row.address || "-"}</td>
                            <td className="px-4 py-3 max-w-[220px] truncate font-mono text-[11px]" title={rawContent}>
                              {row.ftbpFileName ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold max-w-full truncate" title={row.ftbpFileName}>
                                  <Paperclip size={11} className="shrink-0 text-amber-600" />
                                  <span className="truncate">{row.ftbpFileName}</span>
                                </span>
                              ) : (
                                rawContent
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {renderSwimStatus(row.status)}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3 font-semibold text-slate-500">{row.msgid}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{row.time ? new Date(row.time).toLocaleString() : "-"}</td>
                            <td className="px-4 py-3 font-mono font-bold text-slate-800">{row.origin || "-"}</td>
                            <td className="px-4 py-3 font-mono text-[11px] text-slate-600">{row.filingTime || "-"}</td>
                            <td className="px-4 py-3 font-mono text-[11px] max-w-[140px] truncate" title={row.amhsid}>{row.amhsid || "-"}</td>
                            <td className="px-4 py-3 max-w-[240px] truncate font-mono text-[11px]" title={rawContent}>
                              {row.ftbpFileName ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold max-w-full truncate" title={row.ftbpFileName}>
                                  <Paperclip size={11} className="shrink-0 text-amber-600" />
                                  <span className="truncate">{row.ftbpFileName}</span>
                                </span>
                              ) : (
                                rawContent
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {renderAmhsStatus(row.status)}
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <TablePagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={totalElements}
            pageSize={rowsPerPage}
            onPageSizeChange={(newSize) => {
              setRowsPerPage(newSize);
              setPage(0);
            }}
          />
        </div>

        {/* CENTER DETAIL MODAL */}
        {selectedItem && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex justify-center items-center p-4 animate-fade-in" onClick={handleCloseModal}>
            <div className="w-[860px] max-w-full bg-white max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-zoom-in border border-slate-200" onClick={(e) => e.stopPropagation()}>
              
              {/* MODAL HEADER */}
              <div className="px-6 py-4 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2 rounded-xl flex items-center justify-center ${
                    searchType === "AMQP" ? "bg-purple-100 text-purple-700" : "bg-sky-100 text-sky-700"
                  }`}>
                    {searchType === "AMQP" ? <Inbox size={20} /> : <Send size={20} />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="font-bold text-base text-slate-900 m-0">
                        {t("messages.drawer.title")} #{selectedItem.msgid}
                      </h3>
                      <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold border ${
                        searchType === "AMQP" 
                          ? "bg-purple-50 text-purple-700 border-purple-200" 
                          : "bg-sky-50 text-sky-700 border-sky-200"
                      }`}>
                        {searchType === "AMQP" ? "SWIM ➔ AMHS (IN)" : "AMHS ➔ SWIM (OUT)"}
                      </span>
                      <div>
                        {searchType === "AMQP" ? renderSwimStatus(selectedItem.status) : renderAmhsStatus(selectedItem.status)}
                      </div>
                    </div>
                    {(selectedItem.messageId || selectedItem.amhsid || selectedItem.ipmId) && (
                      <p className="text-xs text-slate-500 font-mono mt-0.5 truncate max-w-lg" title={selectedItem.messageId || selectedItem.amhsid || selectedItem.ipmId}>
                        ID: {selectedItem.messageId || selectedItem.amhsid || selectedItem.ipmId}
                      </p>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={handleCloseModal}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-lg text-sm font-bold transition-all cursor-pointer"
                >
                  <XCircle size={20} />
                </button>
              </div>

              {/* MODAL BODY */}
              <div className="p-6 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-5 text-xs bg-slate-50/30">
                
                {/* 1. KEY METADATA SUMMARY BAR */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] text-slate-500 font-medium">{t("messages.drawer.fields.origin")}:</span>
                    <span className="font-mono font-bold text-slate-900 text-sm truncate" title={selectedItem.origin || "-"}>
                      {selectedItem.origin || "-"}
                    </span>
                  </div>

                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] text-slate-500 font-medium">{t("messages.drawer.fields.address")}:</span>
                    <span className="font-mono font-bold text-indigo-700 text-xs truncate" title={selectedItem.amhsRecipients || selectedItem.address || "-"}>
                      {selectedItem.amhsRecipients || selectedItem.address || "-"}
                    </span>
                  </div>

                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] text-slate-500 font-medium">{t("messages.drawer.fields.time")}:</span>
                    <span className="font-mono font-semibold text-slate-800 text-xs truncate" title={selectedItem.time ? new Date(selectedItem.time).toLocaleString() : "-"}>
                      {selectedItem.time ? new Date(selectedItem.time).toLocaleString() : "-"}
                    </span>
                  </div>

                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] text-slate-500 font-medium">{t("messages.drawer.fields.atsPriority")}:</span>
                    <span className="font-mono font-bold text-slate-800 text-xs">
                      {selectedItem.atsPriority || selectedItem.amhsPriority || selectedItem.amhs_ats_pri || "NORMAL"}
                    </span>
                  </div>
                </div>

                {/* 2. REJECTION / NDR / DISPATCH ERROR SECTION (NẾU CÓ LỖI) */}
                {(() => {
                  const { rejReason, rejDiag, hasError } = getRejectionInfo(selectedItem);
                  if (!hasError) return null;

                  const rawSource = selectedItem.rejectionSource || selectedItem.errorSource;
                  let originLabel = t("messages.drawer.fields.partySwim") || "Phía SWIM";
                  let originBadge = "bg-purple-100 text-purple-900 border-purple-300";

                  if (rawSource === "AMHS") {
                    originLabel = t("messages.drawer.fields.partyAmhs") || "Phía AMHS";
                    originBadge = "bg-sky-100 text-sky-900 border-sky-300";
                  } else if (rawSource === "SWIM") {
                    originLabel = t("messages.drawer.fields.partySwim") || "Phía SWIM";
                    originBadge = "bg-purple-100 text-purple-900 border-purple-300";
                  } else if (searchType === "X.400") {
                    originLabel = t("messages.drawer.fields.partyAmhs") || "Phía AMHS";
                    originBadge = "bg-sky-100 text-sky-900 border-sky-300";
                  }

                  return (
                    <div className="bg-rose-50/90 border border-rose-200 rounded-xl p-4 flex flex-col gap-3 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-rose-200/80 pb-2 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <AlertCircle size={16} className="text-rose-600 shrink-0" />
                          <span className="font-bold text-rose-900 uppercase tracking-wider text-[11px]">
                            {t("messages.drawer.sections.rejectionInfo")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-600 font-medium text-xs">
                            {t("messages.drawer.fields.errorOrigin")}:
                          </span>
                          <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${originBadge}`}>
                            {originLabel}
                          </span>
                          {rejReason && (
                            <span className="bg-white text-rose-900 border border-rose-300 px-2 py-0.5 rounded text-xs font-mono font-bold">
                              {rejReason}
                            </span>
                          )}
                        </div>
                      </div>
                      {rejDiag && (
                        <div className="bg-white p-3 rounded-lg border border-rose-200 text-xs text-rose-900 leading-relaxed font-sans shadow-2xs">
                          <strong className="font-mono text-rose-950 block mb-1">
                            {t("messages.drawer.fields.rejectionDiagnostic") || "Chẩn đoán lỗi"}:
                          </strong>
                          <span>{rejDiag}</span>
                        </div>
                      )}
                      {selectedItem.supplementaryInfo && (
                        <div className="bg-white p-3 rounded-lg border border-rose-200 text-xs text-slate-700 leading-relaxed font-sans shadow-2xs">
                          <strong className="font-mono text-slate-900 block mb-1">
                            Thông tin bổ sung (Supplementary Info):
                          </strong>
                          <span>{selectedItem.supplementaryInfo}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* 3. PROTOCOL & TECHNICAL METADATA SECTION */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs flex flex-col">
                  <div className="bg-slate-50/80 px-4 py-2.5 border-b border-slate-200 font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center justify-between">
                    <span>{t("messages.drawer.sections.technicalInfo")}</span>
                  </div>

                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5 text-xs">
                    {searchType === "AMQP" ? (
                      <>
                        <div className="flex justify-between items-center py-1 border-b border-slate-100 gap-2 min-w-0">
                          <span className="text-slate-500 font-medium shrink-0">{t("messages.drawer.fields.messageId") || "Message ID"}:</span>
                          <span className="font-mono font-semibold text-slate-800 truncate text-right flex-1" title={selectedItem.messageId || "-"}>{selectedItem.messageId || "-"}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-100 gap-2 min-w-0">
                          <span className="text-slate-500 font-medium shrink-0">{t("messages.drawer.fields.ipmId")}:</span>
                          <span className="font-mono font-semibold text-slate-800 truncate text-right flex-1" title={selectedItem.ipmId || selectedItem.amhs_ipm_id || "-"}>{selectedItem.ipmId || selectedItem.amhs_ipm_id || "-"}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-100 gap-2 min-w-0">
                          <span className="text-slate-500 font-medium shrink-0">{t("messages.drawer.fields.filingTime")}:</span>
                          <span className="font-mono font-semibold text-slate-800 truncate text-right flex-1" title={selectedItem.filingTime || selectedItem.amhs_ats_ft || "-"}>{selectedItem.filingTime || selectedItem.amhs_ats_ft || "-"}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-100 gap-2 min-w-0">
                          <span className="text-slate-500 font-medium shrink-0">{t("messages.drawer.fields.atsmhsServiceLevel")}:</span>
                          <div className="shrink-0">{renderAtsmhsLevel(selectedItem.atsmhsServiceLevel)}</div>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-100 gap-2 min-w-0">
                          <span className="text-slate-500 font-medium shrink-0">{t("messages.drawer.fields.contentType")}:</span>
                          <span className="font-mono font-semibold text-slate-800 truncate text-right flex-1" title={selectedItem.contentType || "text/plain"}>{selectedItem.contentType || "text/plain"}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-100 gap-2 min-w-0">
                          <span className="text-slate-500 font-medium shrink-0">{t("messages.drawer.fields.bodyPartType")}:</span>
                          <span className="font-mono font-semibold text-slate-800 truncate text-right flex-1" title={selectedItem.bodyPartType || selectedItem.bodyType || "ia5-text"}>{selectedItem.bodyPartType || selectedItem.bodyType || "ia5-text"}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-100 gap-2 min-w-0">
                          <span className="text-slate-500 font-medium shrink-0">{t("messages.drawer.fields.optionalHeading")}:</span>
                          <span className="font-mono font-semibold text-slate-800 truncate text-right flex-1" title={selectedItem.optionalHeading || selectedItem.amhs_ats_ohi || "-"}>{selectedItem.optionalHeading || selectedItem.amhs_ats_ohi || "-"}</span>
                        </div>
                        {selectedItem.ftbpFileName && (
                          <div className="flex justify-between items-center py-1 border-b border-slate-100 gap-2 min-w-0">
                            <span className="text-slate-500 font-medium shrink-0">{t("messages.drawer.fields.ftbpFileName")}:</span>
                            <span className="font-mono font-semibold text-amber-700 truncate text-right flex-1" title={selectedItem.ftbpFileName}>{selectedItem.ftbpFileName}</span>
                          </div>
                        )}
                        {selectedItem.ftbpObjectSize && (
                          <div className="flex justify-between items-center py-1 border-b border-slate-100 gap-2 min-w-0">
                            <span className="text-slate-500 font-medium shrink-0">{t("messages.drawer.fields.ftbpObjectSize")}:</span>
                            <span className="font-mono font-semibold text-slate-800 truncate text-right flex-1">{formatFileSize(selectedItem.ftbpObjectSize)} ({selectedItem.ftbpObjectSize} bytes)</span>
                          </div>
                        )}
                        {selectedItem.subject && (
                          <div className="md:col-span-2 flex justify-between items-center py-1 border-b border-slate-100 gap-2 min-w-0">
                            <span className="text-slate-500 font-medium shrink-0">{t("messages.drawer.fields.subject")}:</span>
                            <span className="font-mono font-semibold text-slate-800 text-right truncate flex-1" title={selectedItem.subject}>{selectedItem.subject}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between items-center py-1 border-b border-slate-100 gap-2 min-w-0">
                          <span className="text-slate-500 font-medium shrink-0">{t("messages.drawer.fields.amhsId")}:</span>
                          <span className="font-mono font-semibold text-slate-800 truncate text-right flex-1" title={selectedItem.amhsid || "-"}>{selectedItem.amhsid || "-"}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-100 gap-2 min-w-0">
                          <span className="text-slate-500 font-medium shrink-0">{t("messages.drawer.fields.ipmId")}:</span>
                          <span className="font-mono font-semibold text-slate-800 truncate text-right flex-1" title={selectedItem.ipmId || selectedItem.amhs_ipm_id || "-"}>{selectedItem.ipmId || selectedItem.amhs_ipm_id || "-"}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-100 gap-2 min-w-0">
                          <span className="text-slate-500 font-medium shrink-0">{t("messages.drawer.fields.filingTime")}:</span>
                          <span className="font-mono font-semibold text-slate-800 truncate text-right flex-1" title={selectedItem.filingTime || selectedItem.amhs_ats_ft || "-"}>{selectedItem.filingTime || selectedItem.amhs_ats_ft || "-"}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-100 gap-2 min-w-0">
                          <span className="text-slate-500 font-medium shrink-0">{t("messages.drawer.fields.x400ContentType")}:</span>
                          <span className="font-mono font-semibold text-slate-800 truncate text-right flex-1" title={formatX400ContentType(selectedItem.x400ContentType)}>{formatX400ContentType(selectedItem.x400ContentType)}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-100 gap-2 min-w-0">
                          <span className="text-slate-500 font-medium shrink-0">{t("messages.drawer.fields.bodyPartType")}:</span>
                          <span className="font-mono font-semibold text-slate-800 truncate text-right flex-1" title={selectedItem.bodyPartType || selectedItem.bodyType || "ia5-text"}>{selectedItem.bodyPartType || selectedItem.bodyType || "ia5-text"}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-100 gap-2 min-w-0">
                          <span className="text-slate-500 font-medium shrink-0">{t("messages.drawer.fields.originEit")}:</span>
                          <span className="font-mono font-semibold text-slate-800 truncate text-right flex-1" title={selectedItem.originEit || "-"}>{selectedItem.originEit || "-"}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-100 gap-2 min-w-0">
                          <span className="text-slate-500 font-medium shrink-0">{t("messages.drawer.fields.numberOfAttachment")}:</span>
                          <span className="font-mono font-semibold text-slate-800 truncate text-right flex-1" title={String(selectedItem.numberOfAttachment !== null && selectedItem.numberOfAttachment !== undefined ? selectedItem.numberOfAttachment : "-")}>
                            {selectedItem.numberOfAttachment !== null && selectedItem.numberOfAttachment !== undefined ? selectedItem.numberOfAttachment : "-"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-100 gap-2 min-w-0">
                          <span className="text-slate-500 font-medium shrink-0">{t("messages.drawer.fields.optionalHeading")}:</span>
                          <span className="font-mono font-semibold text-slate-800 truncate text-right flex-1" title={selectedItem.optionalHeading || selectedItem.amhs_ats_ohi || "-"}>{selectedItem.optionalHeading || selectedItem.amhs_ats_ohi || "-"}</span>
                        </div>
                        {selectedItem.ftbpFileName && (
                          <div className="flex justify-between items-center py-1 border-b border-slate-100 gap-2 min-w-0">
                            <span className="text-slate-500 font-medium shrink-0">{t("messages.drawer.fields.ftbpFileName")}:</span>
                            <span className="font-mono font-semibold text-amber-700 truncate text-right flex-1" title={selectedItem.ftbpFileName}>{selectedItem.ftbpFileName}</span>
                          </div>
                        )}
                        {selectedItem.ftbpObjectSize && (
                          <div className="flex justify-between items-center py-1 border-b border-slate-100 gap-2 min-w-0">
                            <span className="text-slate-500 font-medium shrink-0">{t("messages.drawer.fields.ftbpObjectSize")}:</span>
                            <span className="font-mono font-semibold text-slate-800 truncate text-right flex-1">{formatFileSize(selectedItem.ftbpObjectSize)} ({selectedItem.ftbpObjectSize} bytes)</span>
                          </div>
                        )}
                        {selectedItem.subject && (
                          <div className="md:col-span-2 flex justify-between items-center py-1 border-b border-slate-100 gap-2 min-w-0">
                            <span className="text-slate-500 font-medium shrink-0">{t("messages.drawer.fields.subject")}:</span>
                            <span className="font-mono font-semibold text-slate-800 text-right truncate flex-1" title={selectedItem.subject}>{selectedItem.subject}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* FTBP ATTACHMENT CARD */}
                {selectedItem.ftbpFileName && (
                  <div className="flex flex-col gap-2">
                    <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Paperclip size={13} className="text-amber-600" />
                      {t("messages.drawer.sections.attachmentInfo")}
                    </span>
                    <div className="bg-gradient-to-r from-amber-50/70 to-orange-50/40 border border-amber-200/90 rounded-xl p-3.5 flex items-center justify-between gap-4 shadow-2xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shrink-0">
                          <FileText size={20} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 text-xs truncate" title={selectedItem.ftbpFileName}>
                            {selectedItem.ftbpFileName}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                            {selectedItem.ftbpObjectSize && (
                              <span>{formatFileSize(selectedItem.ftbpObjectSize)}</span>
                            )}
                            {selectedItem.ftbpObjectSize && selectedItem.ftbpLastMod && <span>•</span>}
                            {selectedItem.ftbpLastMod && (
                              <span>Mod: {selectedItem.ftbpLastMod}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownloadAttachment(selectedItem)}
                        className="px-3 py-1.5 bg-white hover:bg-amber-50 text-amber-800 border border-amber-300 rounded-lg font-semibold text-xs transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
                      >
                        <Download size={13} />
                        <span>{t("messages.drawer.buttons.download")}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 4. RAW MESSAGE CONTENT */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                      {t("messages.drawer.sections.rawMessage")}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                        {(selectedItem.payloadContent || selectedItem.text || "").length} bytes
                      </span>
                      <button
                        onClick={() => handleCopy(selectedItem.payloadContent || selectedItem.text)}
                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer bg-white hover:bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200 transition-all shadow-2xs flex items-center gap-1.5"
                      >
                        {isCopied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
                        <span>{isCopied ? t("messages.drawer.buttons.copied") : t("messages.drawer.buttons.copy")}</span>
                      </button>
                    </div>
                  </div>

                  <div className="relative rounded-xl overflow-hidden border border-slate-300 bg-slate-50 shadow-inner">
                    <pre
                      className="p-4 font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed custom-scrollbar max-h-64 select-all font-semibold"
                      style={{ backgroundColor: '#f8fafc', color: '#0f172a' }}
                    >
                      {selectedItem.payloadContent || selectedItem.text || "— Không có nội dung payload —"}
                    </pre>
                  </div>
                </div>

              </div>

              {/* MODAL FOOTER */}
              <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <span className="text-slate-500 text-xs font-medium">
                  {searchType === "AMQP" ? "Luồng chuyển đổi: SWIM ➔ AMHS" : "Luồng chuyển đổi: AMHS ➔ SWIM"}
                </span>

                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-xs cursor-pointer text-xs transition-all active:scale-95"
                >
                  {t("messages.drawer.buttons.close")}
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

const renderAtsmhsLevel = (level) => {
  if (!level) return <span className="text-slate-400 font-mono">-</span>;
  const isExtended = String(level).toUpperCase().includes("EXTENDED");
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
      isExtended ? "bg-purple-100 text-purple-700 border border-purple-200" : "bg-blue-100 text-blue-700 border border-blue-200"
    }`}>
      {level}
    </span>
  );
};

const formatX400ContentType = (type) => {
  if (type === undefined || type === null || type === '') return "-";
  const num = Number(type);
  switch (num) {
    case 22:
      return "22 (IPM-1988)";
    case 2:
      return "2 (IPM-1984)";
    case 35:
      return "35 (EDI)";
    case 0:
      return "0 (Unidentified)";
    default:
      return String(type);
  }
};

const renderAmhsStatus = (status) => {
  const statusMap = {
    0: { label: 'PENDING', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
    1: { label: 'TRANSFORMED', className: 'bg-blue-50 text-blue-700 border border-blue-200' },
    2: { label: 'PUBLISHED', className: 'bg-green-50 text-green-700 border border-green-200' },
    3: { label: 'FAILED', className: 'bg-red-50 text-red-700 border border-red-200' },
    4: { label: 'UNROUTED', className: 'bg-purple-50 text-purple-700 border border-purple-200' },
    5: { label: 'RESOLVED', className: 'bg-teal-50 text-teal-700 border border-teal-200' },
    6: { label: 'CANCELLED', className: 'bg-slate-50 text-slate-700 border border-slate-200' },
  };

  const current = statusMap[status] || { label: 'UNKNOWN', className: 'bg-slate-50 text-slate-700 border border-slate-200' };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${current.className}`}>
      {t("messages.status." + current.label) || current.label}
    </span>
  );
};

const renderSwimStatus = (status) => {
  const statusMap = {
    0: { label: 'PENDING', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
    1: { label: 'UNROUTED', className: 'bg-purple-50 text-purple-700 border border-purple-200' },
    2: { label: 'TRANSFORMED', className: 'bg-blue-50 text-blue-700 border border-blue-200' },
    3: { label: 'DELIVERED', className: 'bg-green-50 text-green-700 border border-green-200' },
    4: { label: 'FAILED', className: 'bg-red-50 text-red-700 border border-red-200' },
    10: { label: 'DELIVERED', className: 'bg-green-50 text-green-700 border border-green-200' },
    11: { label: 'FAILED', className: 'bg-red-50 text-red-700 border border-red-200' },
    5: { label: 'RESOLVED', className: 'bg-teal-50 text-teal-700 border border-teal-200' },
    6: { label: 'CANCELLED', className: 'bg-slate-50 text-slate-700 border border-slate-200' },
  };

  const current = statusMap[status] || { label: 'UNKNOWN', className: 'bg-slate-50 text-slate-700 border border-slate-200' };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${current.className}`}>
      {t("messages.status." + current.label) || current.label}
    </span>
  );
};

export default MessageView;
