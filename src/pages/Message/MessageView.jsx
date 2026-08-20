import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  XCircle,
  MoreVertical,
  RotateCcw,
  CheckCircle,
  Ban,
  Trash2,
  Copy,
  Check,
  FileText,
  Send,
  Inbox
} from "lucide-react";
import toast from "react-hot-toast";
import DashboardLayout from "@/layout/DashboardLayout";
import gatewayApi from "@/api/gatewayApi";
import TablePagination from "@/components/TablePagination";
import { t } from "@/i18n/translator";

const MessageView = () => {
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  // Mode: AMQP (SWIM -> AMHS) hoặc X.400 (AMHS -> SWIM)
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

  // Gọi API lấy dữ liệu điện văn
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
      console.error("Lỗi khi fetch dữ liệu archive:", error);
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

  const handleRetry = async (id) => {
    try {
      if (searchType === "AMQP") {
        await gatewayApi.retryInboundMessage(id);
      } else {
        await gatewayApi.retryOutboundMessage(id);
      }
      toast.success(t("messages.ops.retrySuccess"));
      fetchArchiveData();
    } catch (error) {
      console.error("Retry failed:", error);
      toast.error(t("messages.ops.retryFailed"));
    }
  };

  const handleResolve = async (id) => {
    try {
      if (searchType === "AMQP") {
        await gatewayApi.resolveInboundMessage(id);
      } else {
        await gatewayApi.resolveOutboundMessage(id);
      }
      toast.success(t("messages.ops.resolveSuccess"));
      fetchArchiveData();
    } catch (error) {
      console.error("Resolve failed:", error);
      toast.error(t("messages.ops.resolveFailed"));
    }
  };

  const handleCancel = async (id) => {
    try {
      if (searchType === "AMQP") {
        await gatewayApi.cancelInboundMessage(id);
      } else {
        await gatewayApi.cancelOutboundMessage(id);
      }
      toast.success(t("messages.ops.cancelSuccess"));
      fetchArchiveData();
    } catch (error) {
      console.error("Cancel failed:", error);
      toast.error(t("messages.ops.cancelFailed"));
    }
  };

  const handleDeleteMessage = async (id) => {
    if (!window.confirm(t("messages.ops.deleteConfirm"))) return;
    try {
      if (searchType === "AMQP") {
        await gatewayApi.deleteInboundMessage(id);
      } else {
        await gatewayApi.deleteOutboundMessage(id);
      }
      toast.success(t("messages.ops.deleteSuccess"));
      setSelectedId(null);
      fetchArchiveData();
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error(t("messages.ops.deleteFailed"));
    }
  };

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
              <span>SWIM → AMHS (IN)</span>
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
              <span>AMHS → SWIM (OUT)</span>
            </button>
          </div>

          {/* SINGLE UNIFIED SEARCH INPUT & STATUS SELECT */}
          <div className="flex flex-wrap items-center gap-2.5 flex-1 max-w-2xl justify-end">
            
            {/* 1 Ô TÌM KIẾM DUY NHẤT */}
            <div className="relative flex-1 min-w-[240px]">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(0);
                }}
                placeholder="Tìm kiếm điện văn (Callsign, Địa chỉ, Mã tin, Nội dung...)"
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
              <span className="text-[10px] text-slate-500 font-bold">{t("messages.filters.status.label")}:</span>
              <select
                value={filters.status}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, status: e.target.value }));
                  setPage(0);
                }}
                className="bg-transparent text-xs outline-none text-slate-800 font-bold cursor-pointer"
              >
                <option value="">{t("messages.status.ALL")}</option>
                {searchType === "AMQP" ? (
                  <>
                    <option value="0">{t("messages.status.PENDING")}</option>
                    <option value="2">{t("messages.status.UNROUTED")}</option>
                    <option value="3">{t("messages.status.DELIVERED")}</option>
                    <option value="1">{t("messages.status.FAILED")}</option>
                    <option value="4">{t("messages.status.CANCELLED")}</option>
                  </>
                ) : (
                  <>
                    <option value="0">{t("messages.status.PENDING")}</option>
                    <option value="1">{t("messages.status.PUBLISHED")}</option>
                    <option value="2">{t("messages.status.FAILED")}</option>
                    <option value="3">{t("messages.status.CANCELLED")}</option>
                  </>
                )}
              </select>
            </div>

            {/* Reset Filters */}
            {(filters.status !== '' || searchQuery) && (
              <button
                onClick={handleResetFilters}
                className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors font-medium cursor-pointer"
                title="Xóa bộ lọc"
              >
                Xóa lọc
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
                      <th className="px-4 py-3 font-semibold">{t("messages.table.columns.origin")}</th>
                      <th className="px-4 py-3 font-semibold">{t("messages.table.columns.address")}</th>
                      <th className="px-4 py-3 font-semibold">{t("messages.table.columns.payload")}</th>
                      <th className="px-4 py-3 font-semibold">{t("messages.table.columns.status")}</th>
                      <th className="px-4 py-3 font-semibold text-right">{t("messages.table.columns.actions")}</th>
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
                      <th className="px-4 py-3 font-semibold text-right">{t("messages.table.columns.actions")}</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={10} className="text-center py-8 text-slate-400 font-medium">
                      {t("messages.table.loading")}
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-8 text-slate-400 font-medium">
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
                        onClick={() => {
                          setSelectedId(rowId);
                          setSelectedItem(row);
                        }}
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
                            <td className="px-4 py-3 font-mono font-bold text-slate-800">{row.origin || "-"}</td>
                            <td className="px-4 py-3 font-mono text-[11px] max-w-[150px] truncate text-slate-600" title={row.amhsRecipients || row.address}>{row.amhsRecipients || row.address || "-"}</td>
                            <td className="px-4 py-3 max-w-[240px] truncate font-mono text-[11px]" title={rawContent}>{rawContent}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{renderSwimStatus(row.status)}</td>
                            <td className="px-4 py-3 text-right relative" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(activeMenuId === rowId ? null : rowId);
                                }}
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                              >
                                <MoreVertical size={15} />
                              </button>
                              {activeMenuId === rowId && (
                                <div className="absolute right-4 mt-1 w-32 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1.5 animate-zoom-in text-left">
                                  <button
                                    onClick={() => { handleRetry(rowId); setActiveMenuId(null); }}
                                    className="w-full px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                  >
                                    <RotateCcw size={13} className="text-blue-500" />
                                    {t("messages.actions.retry")}
                                  </button>
                                  <button
                                    onClick={() => { handleResolve(rowId); setActiveMenuId(null); }}
                                    className="w-full px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                  >
                                    <CheckCircle size={13} className="text-green-500" />
                                    {t("messages.actions.resolve")}
                                  </button>
                                  <button
                                    onClick={() => { handleCancel(rowId); setActiveMenuId(null); }}
                                    className="w-full px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                  >
                                    <Ban size={13} className="text-amber-500" />
                                    {t("messages.actions.cancel")}
                                  </button>
                                  <div className="h-px bg-slate-100 my-1" />
                                  <button
                                    onClick={() => { handleDeleteMessage(rowId); setActiveMenuId(null); }}
                                    className="w-full px-3 py-1.5 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                                  >
                                    <Trash2 size={13} className="text-rose-500" />
                                    {t("messages.actions.delete")}
                                  </button>
                                </div>
                              )}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3 font-semibold text-slate-500">{row.msgid}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{row.time ? new Date(row.time).toLocaleString() : "-"}</td>
                            <td className="px-4 py-3 font-mono font-bold text-slate-800">{row.origin || "-"}</td>
                            <td className="px-4 py-3 font-mono text-[11px] text-slate-600">{row.filingTime || "-"}</td>
                            <td className="px-4 py-3 font-mono text-[11px] max-w-[140px] truncate" title={row.amhsid}>{row.amhsid || "-"}</td>
                            <td className="px-4 py-3 max-w-[240px] truncate font-mono text-[11px]" title={rawContent}>{rawContent}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{renderAmhsStatus(row.status)}</td>
                            <td className="px-4 py-3 text-right relative" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(activeMenuId === rowId ? null : rowId);
                                }}
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                              >
                                <MoreVertical size={15} />
                              </button>
                              {activeMenuId === rowId && (
                                <div className="absolute right-4 mt-1 w-32 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1.5 animate-zoom-in text-left">
                                  <button
                                    onClick={() => { handleRetry(rowId); setActiveMenuId(null); }}
                                    className="w-full px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                  >
                                    <RotateCcw size={13} className="text-blue-500" />
                                    {t("messages.actions.retry")}
                                  </button>
                                  <button
                                    onClick={() => { handleResolve(rowId); setActiveMenuId(null); }}
                                    className="w-full px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                  >
                                    <CheckCircle size={13} className="text-green-500" />
                                    {t("messages.actions.resolve")}
                                  </button>
                                  <button
                                    onClick={() => { handleCancel(rowId); setActiveMenuId(null); }}
                                    className="w-full px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                  >
                                    <Ban size={13} className="text-amber-500" />
                                    {t("messages.actions.cancel")}
                                  </button>
                                  <div className="h-px bg-slate-100 my-1" />
                                  <button
                                    onClick={() => { handleDeleteMessage(rowId); setActiveMenuId(null); }}
                                    className="w-full px-3 py-1.5 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                                  >
                                    <Trash2 size={13} className="text-rose-500" />
                                    {t("messages.actions.delete")}
                                  </button>
                                </div>
                              )}
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
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex justify-center items-center p-4 animate-fade-in" onClick={() => setSelectedItem(null)}>
            <div className="w-[720px] max-w-full bg-white max-h-[88vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-zoom-in border border-slate-200" onClick={(e) => e.stopPropagation()}>
              
              {/* MODAL HEADER */}
              <div className="px-6 py-4 bg-white text-slate-900 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 text-slate-700 rounded-xl border border-slate-200">
                    <FileText size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-slate-900">{t("messages.drawer.title")} #{selectedItem.msgid}</h3>
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {searchType === "AMQP" ? "SWIM → AMHS" : "AMHS → SWIM"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {selectedItem.messageId || selectedItem.amhsid || selectedItem.ipmId || "N/A"}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(selectedItem.payloadContent || selectedItem.text)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-all cursor-pointer"
                  >
                    {isCopied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    <span>{isCopied ? "Đã chép" : "Sao chép"}</span>
                  </button>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                  >
                    <XCircle size={20} />
                  </button>
                </div>
              </div>

              {/* MODAL BODY */}
              <div className="p-6 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-5">
                
                {/* METADATA CARDS GRID */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-500 tracking-wider">Người phát (Originator)</span>
                    <span className="font-mono font-bold text-sm text-slate-900">{selectedItem.origin || "-"}</span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-500 tracking-wider">Người nhận (Recipients)</span>
                    <span className="font-mono font-semibold text-xs text-slate-800 truncate" title={selectedItem.amhsRecipients || selectedItem.address}>
                      {selectedItem.amhsRecipients || selectedItem.address || "-"}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-500 tracking-wider">Thời điểm tiếp nhận</span>
                    <span className="font-mono font-semibold text-xs text-slate-800">
                      {selectedItem.time ? new Date(selectedItem.time).toLocaleString() : "-"}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-500 tracking-wider">Trạng thái xử lý</span>
                    <div>
                      {searchType === "AMQP" ? renderSwimStatus(selectedItem.status) : renderAmhsStatus(selectedItem.status)}
                    </div>
                  </div>
                </div>

                {/* ADDITIONAL FIELDS */}
                <div className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-xl grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block">Filing Time</span>
                    <span className="font-mono font-semibold text-slate-800">{selectedItem.filingTime || "-"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block">Body Part Type</span>
                    <span className="font-mono font-semibold text-slate-800">{selectedItem.bodyPartType || selectedItem.bodyType || "ia5-text"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block">Source / Topic</span>
                    <span className="font-mono font-semibold text-slate-800 truncate block" title={selectedItem.source}>{selectedItem.source || "-"}</span>
                  </div>
                </div>

                {/* RAW CONTENT CODE BLOCK */}
                <div className="flex flex-col gap-2 flex-1 min-h-[220px]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 tracking-wider">{t("messages.drawer.sections.rawMessage")}</span>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {(selectedItem.payloadContent || selectedItem.text || "").length} bytes
                    </span>
                  </div>

                  <div className="relative rounded-xl overflow-hidden border border-slate-300 bg-slate-50 flex-1 min-h-[180px] shadow-inner">
                    <pre className="p-4 text-slate-900 font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed custom-scrollbar h-full max-h-[300px] font-semibold">
                      {selectedItem.payloadContent || selectedItem.text || t("global.noData")}
                    </pre>
                  </div>
                </div>

              </div>

              {/* MODAL FOOTER */}
              <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold rounded-lg transition-all cursor-pointer shadow-xs"
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

const renderAmhsStatus = (status) => {
  const statusMap = {
    0: { label: 'PENDING', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
    1: { label: 'PUBLISHED', className: 'bg-green-50 text-green-700 border border-green-200' },
    2: { label: 'FAILED', className: 'bg-red-50 text-red-700 border border-red-200' },
    3: { label: 'CANCELLED', className: 'bg-slate-50 text-slate-700 border border-slate-200' },
  };

  const current = statusMap[status] || { label: 'PUBLISHED', className: 'bg-green-50 text-green-700 border border-green-200' };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${current.className}`}>
      {t("messages.status." + current.label) || current.label}
    </span>
  );
};

const renderSwimStatus = (status) => {
  const statusMap = {
    0: { label: 'PENDING', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
    1: { label: 'FAILED', className: 'bg-red-50 text-red-700 border border-red-200' },
    2: { label: 'UNROUTED', className: 'bg-purple-50 text-purple-700 border border-purple-200' },
    3: { label: 'DELIVERED', className: 'bg-green-50 text-green-700 border border-green-200' },
    4: { label: 'CANCELLED', className: 'bg-slate-50 text-slate-700 border border-slate-200' },
  };

  const current = statusMap[status] || { label: 'UNKNOWN', className: 'bg-slate-50 text-slate-700 border border-slate-200' };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${current.className}`}>
      {t("messages.status." + current.label) || current.label}
    </span>
  );
};

export default MessageView;
