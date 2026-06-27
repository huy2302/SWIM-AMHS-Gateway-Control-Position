import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/layout/DashboardLayout";
import { Search, X, Copy, Check, Loader2, MoreVertical, RotateCcw, CheckCircle, Ban, Trash2, SlidersHorizontal } from "lucide-react";
import gatewayApi from "@/api/gatewayApi";
import { t } from "@/i18n/translator";
import toast from "react-hot-toast";
import TablePagination from "@/components/TablePagination";

const MessageView = () => {
  const [selectedId, setSelectedId] = useState(null);
  const [modalData, setModalData] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const [activeMenuId, setActiveMenuId] = useState(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Close actions menu when clicking outside
  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  // States cho Filter và Search
  const [searchType, setSearchType] = useState("AMQP");
  const [rows, setRows] = useState([]);
  
  // Pagination states
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filter states
  const [filters, setFilters] = useState({
    status: '',
    source: '',
    fromTime: '',
    toTime: '',
  });

  // Local filter cho search (client-side)
  const [localFilters, setLocalFilters] = useState({
    callsign: '',
    origin: '',
    address: '',
    messageId: '',
    text: '',
  });

  // Hàm gọi API lấy dữ liệu với phân trang và filter
  const fetchArchiveData = useCallback(async () => {
    setLoading(true);
    try {
      let response;
      const params = {
        page: page,
        size: rowsPerPage,
        ...(filters.status !== '' && { status: parseInt(filters.status) }),
        ...(filters.source && { source: filters.source }),
        ...(filters.fromTime && { fromTime: filters.fromTime }),
        ...(filters.toTime && { toTime: filters.toTime }),
      };

      if (searchType === "AMQP") {
        response = await gatewayApi.getAllSwimMessages(params);
      } else {
        response = await gatewayApi.getAllAmhsMessages(params);
      }
      
      console.log("API Response:", response);
      
      if (response && response.content) {
        setRows(response.content || []);
        setTotalElements(response.totalElements || 0);
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
  }, [page, rowsPerPage, filters, searchType]);

  // Gọi dữ liệu khi page, rowsPerPage, filters hoặc searchType thay đổi
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

  // Local filter (client-side)
  const filteredData = rows.filter((row) => {
    const callsign = localFilters.callsign.toLowerCase();
    const origin = localFilters.origin.toLowerCase();
    const address = localFilters.address.toLowerCase();
    const messageId = localFilters.messageId.toLowerCase();
    const text = localFilters.text.toLowerCase();

    return (
      (!callsign ||
        row.subject?.toLowerCase().includes(callsign) ||
        row.text?.toLowerCase().includes(callsign)) &&
      (!origin ||
        row.origin?.toLowerCase().includes(origin)) &&
      (!address ||
        row.address?.toLowerCase().includes(address)) &&
      (!messageId ||
        row.amhsid?.toLowerCase().includes(messageId) ||
        row.messageId?.toLowerCase().includes(messageId)) &&
      (!text ||
        row.text?.toLowerCase().includes(text))
    );
  });

  const handleFilterChange = (field, value) => {
    setLocalFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleApiFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
    setPage(0); // Reset page khi filter thay đổi
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
      <div className="flex flex-col gap-4 relative overflow-hidden" style={{height: 'fit-content', maxHeight: '100vh'}}>
        
        {/* Search Header */}
        <div className="bg-white p-3 rounded-t-xl border border-slate-200 flex flex-wrap gap-4 items-center justify-between shadow-xs">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Source dropdown */}
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-[10px] text-slate-500 font-bold uppercase">{t("messages.source.label")}</span>
              <select
                value={searchType}
                onChange={(e) => {
                  setSearchType(e.target.value);
                  setPage(0);
                  setFilters((prev) => ({ ...prev, status: '' }));
                }}
                className="bg-transparent text-xs outline-none text-slate-855 font-bold cursor-pointer"
              >
                <option value="AMQP">{t("messages.source.swim")}</option>
                <option value="X.400">{t("messages.source.amhs")}</option>
              </select>
            </div>

            {/* Status Filter - API */}
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs">
              <span className="text-[10px] text-slate-500 font-bold uppercase">{t("messages.filters.status.label")}</span>
              <select
                value={filters.status}
                onChange={(e) => handleApiFilterChange('status', e.target.value)}
                className="bg-transparent text-xs outline-none text-slate-855 font-bold cursor-pointer"
              >
                <option value="">{t("messages.status.ALL")}</option>
                {searchType === "AMQP" ? (
                  <>
                    <option value="0">{t("messages.status.PENDING")}</option>
                    <option value="1">{t("messages.status.PROCESSING")}</option>
                    <option value="3">{t("messages.status.SENT")}</option>
                    <option value="4">{t("messages.status.FAILED")}</option>
                    <option value="5">{t("messages.status.UNROUTED")}</option>
                    <option value="6">{t("messages.status.RESOLVED")}</option>
                    <option value="7">{t("messages.status.CANCELLED")}</option>
                  </>
                ) : (
                  <>
                    <option value="0">{t("messages.status.PENDING")}</option>
                    <option value="2">{t("messages.status.TRANSFORMED")}</option>
                    <option value="3">{t("messages.status.PUBLISHING")}</option>
                    <option value="4">{t("messages.status.PUBLISHED")}</option>
                    <option value="5">{t("messages.status.FAILED")}</option>
                    <option value="6">{t("messages.status.RESOLVED")}</option>
                    <option value="7">{t("messages.status.CANCELLED")}</option>
                  </>
                )}
              </select>
            </div>

            {/* Source Filter - API (chỉ cho inbound) */}
            {searchType === "AMQP" && (
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs">
                <span className="text-[10px] text-slate-500 font-bold uppercase">{t("messages.source.label")}</span>
                <input
                  type="text"
                  value={filters.source}
                  onChange={(e) => handleApiFilterChange('source', e.target.value)}
                  placeholder={`${t("messages.source.label")}...`}
                  className="bg-transparent text-xs outline-none text-slate-800 w-32 font-medium"
                />
              </div>
            )}
          </div>

          {/* Toggle Advanced Filters Button */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
          >
            <SlidersHorizontal size={13} className={showAdvancedFilters ? "text-indigo-650" : "text-slate-500"} />
            {showAdvancedFilters ? t("messages.filters.hideAdvanced") : t("messages.filters.showAdvanced")}
          </button>
        </div>

        {/* Local Filters (Collapsible) */}
        {showAdvancedFilters && (
          <div className="bg-white border border-slate-200 border-t-0 rounded-b-xl px-4 py-4 shadow-xs transition-all duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {/* Callsign */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-555 uppercase tracking-wider">
                  {t("messages.filters.callsign.label")}
                </label>
                <input
                  value={localFilters.callsign}
                  onChange={(e) => handleFilterChange('callsign', e.target.value)}
                  type="text"
                  placeholder="VN756..."
                  className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-xs font-medium"
                />
              </div>

              {/* Origin */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">
                  {t("messages.filters.origin.label")}
                </label>
                <input
                  value={localFilters.origin}
                  onChange={(e) => handleFilterChange('origin', e.target.value)}
                  type="text"
                  placeholder="VVNB..."
                  className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-xs font-medium"
                />
              </div>

              {/* Address */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">
                  {t("messages.filters.address.label")}
                </label>
                <input
                  value={localFilters.address}
                  onChange={(e) => handleFilterChange('address', e.target.value)}
                  type="text"
                  placeholder="VVTSYFYX..."
                  className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-xs font-medium"
                />
              </div>

              {/* Message ID */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">
                  {t("messages.filters.messageId.label")}
                </label>
                <input
                  value={localFilters.messageId}
                  onChange={(e) => handleFilterChange('messageId', e.target.value)}
                  type="text"
                  placeholder="MSG-IN-0001..."
                  className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-xs font-medium"
                />
              </div>

              {/* Raw Text */}
              <div className="flex flex-col gap-1.5 md:col-span-2 xl:col-span-3">
                <label className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">
                  {t("messages.filters.rawText.label")}
                </label>
                <input
                  value={localFilters.text}
                  onChange={(e) => handleFilterChange('text', e.target.value)}
                  type="text"
                  placeholder={t("messages.filters.rawText.placeholder")}
                  className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-xs font-medium"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setPage(0);
                    fetchArchiveData();
                  }}
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm font-semibold cursor-pointer h-9"
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} 
                  {t("messages.filters.filterButton")}
                </button>
              </div>
            </div>      
          </div>
        )}

        {/* Dynamic Table Content Card */}
        <div className="flex-1 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex flex-col min-h-0">
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left text-sm border-collapse min-w-[1000px] font-sans">
              <thead className="sticky top-0 bg-slate-50/90 backdrop-blur-xs z-10 border-b border-slate-200">
                <tr className="text-slate-655 font-bold uppercase tracking-wider text-[11px]">
                  {searchType === "AMQP" ? (
                    <>
                      <th className="px-6 py-4">ID</th>
                      <th className="px-6 py-4">MSG ID</th>
                      <th className="px-6 py-4">{t("messages.table.amqp.time")}</th>
                      <th className="px-6 py-4">{t("messages.table.amqp.source")}</th>
                      <th className="px-6 py-4">{t("messages.table.amqp.origin")}</th>
                      <th className="px-6 py-4">{t("messages.table.amqp.address")}</th>
                      <th className="px-6 py-4">{t("messages.table.amqp.textRaw")}</th>
                      <th className="px-6 py-4">{t("messages.table.amqp.status")}</th>
                      <th className="px-6 py-4 text-right">{t("messages.actions.label")}</th>
                    </>
                  ) : (
                    <>
                      <th className="px-6 py-4">{t("messages.table.x400.id")}</th>
                      <th className="px-6 py-4">{t("messages.table.x400.date")}</th>
                      <th className="px-6 py-4">{t("messages.table.x400.origin")}</th>
                      <th className="px-6 py-4">{t("messages.table.x400.filingTime")}</th>
                      <th className="px-6 py-4">{t("messages.table.x400.messageId")}</th>
                      <th className="px-6 py-4">{t("messages.table.x400.textRaw")}</th>
                      <th className="px-6 py-4">{t("messages.table.x400.status")}</th>
                      <th className="px-6 py-4 text-right">{t("messages.actions.label")}</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={searchType === "AMQP" ? 9 : 8} className="text-center py-12 text-slate-400">
                      <Loader2 size={24} className="animate-spin mx-auto mb-2 text-indigo-600" />
                      {t("messages.ops.loading")}
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={searchType === "AMQP" ? 9 : 8} className="text-center py-12 text-slate-500 text-sm">
                      {t("messages.ops.noData")}
                    </td>
                  </tr>
                ) : (
                  filteredData.map((row) => {
                    const rowId = row.msgid || row.id;
                    return (
                      <tr
                        key={rowId}
                        onClick={() => setSelectedId(rowId)}
                        onDoubleClick={() => setModalData(row)}
                        className={`transition-all duration-150 cursor-pointer border-b border-slate-100
                        ${selectedId === rowId ? "bg-indigo-50/80 text-slate-950" : "hover:bg-slate-100/80 text-slate-800"}
                      `}
                      >
                        {searchType === "AMQP" ? (
                          <>
                            <td className={`px-6 py-4 font-mono font-bold text-indigo-650 text-[13px] border-l-4 transition-all duration-150 ${selectedId === rowId ? "border-l-indigo-600" : "border-l-transparent"}`}>{row.msgid}</td>
                            <td className="px-6 py-4 font-mono text-[13px] text-slate-900">{row.messageId}</td>
                            <td className="px-6 py-4 text-slate-650 text-[13px] whitespace-nowrap">{row.time}</td>
                            <td className="px-6 py-4 break-all text-slate-650 text-[13px]">{row.source}</td>
                            <td className="px-6 py-4 font-mono font-bold text-slate-800 text-[13px] whitespace-nowrap">{row.origin}</td>
                            <td className="px-6 py-4 font-mono text-slate-700 text-[13px] max-w-[160px] truncate" title={row.address}>{row.address}</td>
                            <td className="px-6 py-4 max-w-[250px]">
                              <span className="font-mono text-xs text-slate-700 bg-slate-50 border border-slate-200 px-2 py-1 rounded truncate block" title={row.text}>
                                {row.text}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">{renderSwimStatus(row.status)}</td>
                            <td className="px-6 py-4 text-right relative" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(activeMenuId === rowId ? null : rowId);
                                }}
                                className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                              >
                                <MoreVertical size={16} />
                              </button>
                              {activeMenuId === rowId && (
                                <div className="absolute right-4 mt-1 w-32 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1.5 animate-zoom-in text-left">
                                  <button
                                    onClick={() => {
                                      handleRetry(rowId);
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                  >
                                    <RotateCcw size={13} className="text-blue-500" />
                                    {t("messages.actions.retry")}
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleResolve(rowId);
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                  >
                                    <CheckCircle size={13} className="text-green-500" />
                                    {t("messages.actions.resolve")}
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleCancel(rowId);
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                  >
                                    <Ban size={13} className="text-amber-500" />
                                    {t("messages.actions.cancel")}
                                  </button>
                                  <div className="h-px bg-slate-100 my-1" />
                                  <button
                                    onClick={() => {
                                      handleDeleteMessage(rowId);
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full px-3 py-2 text-[11px] font-semibold text-red-650 hover:bg-red-50/50 flex items-center gap-2 cursor-pointer"
                                  >
                                    <Trash2 size={13} className="text-red-500" />
                                    {t("messages.actions.delete")}
                                  </button>
                                </div>
                              )}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className={`px-6 py-4 font-mono font-bold text-indigo-650 text-[13px] border-l-4 transition-all duration-150 ${selectedId === rowId ? "border-l-indigo-600" : "border-l-transparent"}`}>{row.msgid}</td>
                            <td className="px-6 py-4 text-slate-650 text-[13px] whitespace-nowrap">{row.time}</td>
                            <td className="px-6 py-4 font-mono font-bold text-slate-800 text-[13px] whitespace-nowrap">{row.origin}</td>
                            <td className="px-6 py-4"><span className="font-mono text-slate-700 text-[12px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded whitespace-nowrap">{row.filingTime}</span></td>
                            <td className="px-6 py-4 font-mono text-[13px] text-slate-900 break-all">{row.amhsid}</td>
                            <td className="px-6 py-4 max-w-[250px]">
                              <span className="font-mono text-xs text-slate-700 bg-slate-50 border border-slate-200 px-2 py-1 rounded truncate block" title={row.text}>
                                {row.text}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">{renderAmhsStatus(row.status)}</td>
                            <td className="px-6 py-4 text-right relative" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(activeMenuId === rowId ? null : rowId);
                                }}
                                className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                              >
                                <MoreVertical size={16} />
                              </button>
                              {activeMenuId === rowId && (
                                <div className="absolute right-4 mt-1 w-32 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1.5 animate-zoom-in text-left">
                                  <button
                                    onClick={() => {
                                      handleRetry(rowId);
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                  >
                                    <RotateCcw size={13} className="text-blue-500" />
                                    {t("messages.actions.retry")}
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleResolve(rowId);
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                  >
                                    <CheckCircle size={13} className="text-green-500" />
                                    {t("messages.actions.resolve")}
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleCancel(rowId);
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full px-3 py-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                  >
                                    <Ban size={13} className="text-amber-500" />
                                    {t("messages.actions.cancel")}
                                  </button>
                                  <div className="h-px bg-slate-100 my-1" />
                                  <button
                                    onClick={() => {
                                      handleDeleteMessage(rowId);
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full px-3 py-2 text-[11px] font-semibold text-red-650 hover:bg-red-50/50 flex items-center gap-2 cursor-pointer"
                                  >
                                    <Trash2 size={13} className="text-red-500" />
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
          pageSizeOptions={[5, 10, 25, 50, 100]}
        />
      </div>

      <div className="bg-slate-50 border border-slate-200 border-t-0 rounded-b-xl p-2.5 px-4 flex justify-between items-center text-[10px] text-slate-500 italic shadow-xs">
        <span>
          {loading ? t("messages.pagination.refreshing") : 
            `${t("messages.pagination.showing")} ${filteredData.length} / ${totalElements} ${t("messages.pagination.entries")}`
          }
        </span>
      </div>

      {/* Modal Details */}
      {modalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-6xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-zoom-in">
            {/* HEADER */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  {t("messages.modal.title")}
                </span>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-lg font-extrabold text-slate-900">
                    #{modalData.msgid}
                  </span>
                  {searchType === "AMQP" ? renderSwimStatus(modalData.status) : renderAmhsStatus(modalData.status)}
                </div>
              </div>
              <button
                onClick={() => setModalData(null)}
                className="text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* BODY */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-scroll custom-scrollbar">
              {/* INFO GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <DetailBox
                  label={t("messages.modal.fields.messageId")}
                  value={modalData.messageId}
                  onCopy={() => handleCopy(modalData.messageId)}
                />
                <DetailBox
                  label={t("messages.modal.fields.subject")}
                  value={modalData.subject}
                  onCopy={() => handleCopy(modalData.subject)}
                />
                <DetailBox
                  label={t("messages.modal.fields.origin")}
                  value={modalData.origin}
                  onCopy={() => handleCopy(modalData.origin)}
                />
                <DetailBox
                  label={t("messages.modal.fields.address")}
                  value={modalData.address}
                  onCopy={() => handleCopy(modalData.address)}
                />
                <DetailBox
                  label={t("messages.modal.fields.source")}
                  value={modalData.source}
                  onCopy={() => handleCopy(modalData.source)}
                />
                <DetailBox
                  label={t("messages.modal.fields.addressingSource")}
                  value={modalData.addressingSource}
                  onCopy={() => handleCopy(modalData.addressingSource)}
                />
                <DetailBox
                  label={t("messages.modal.fields.bodyType")}
                  value={modalData.bodyType}
                  onCopy={() => handleCopy(modalData.bodyType)}
                />
                <DetailBox
                  label={t("messages.modal.fields.contentType")}
                  value={modalData.contentType}
                  onCopy={() => handleCopy(modalData.contentType)}
                />
                <DetailBox
                  label={t("messages.modal.fields.cpa")}
                  value={modalData.cpa}
                  onCopy={() => handleCopy(modalData.cpa)}
                />
                <DetailBox
                  label={t("messages.modal.fields.priority")}
                  value={modalData.priority}
                  onCopy={() => handleCopy(modalData.priority)}
                />
                <DetailBox
                  label={t("messages.modal.fields.time")}
                  value={modalData.time}
                  onCopy={() => handleCopy(modalData.time)}
                />
                <DetailBox
                  label={t("messages.modal.fields.errorType")}
                  value={modalData.errorType || t("messages.modal.none")}
                  onCopy={() => handleCopy(modalData.errorType || t("messages.modal.none"))}
                />
              </div>

              {/* RAW MESSAGE */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {t("messages.modal.sections.rawMessage")}
                  </span>
                  <button
                    onClick={() => handleCopy(modalData.text)}
                    className="text-[11px] text-indigo-600 hover:text-indigo-500 font-semibold cursor-pointer"
                  >
                    {t("messages.modal.buttons.copy")}
                  </button>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-inner overflow-y-auto custom-scrollbar">
                  <pre className="text-slate-800 text-[12px] whitespace-pre-wrap font-mono leading-relaxed">
                    {modalData.text}
                  </pre>
                </div>
              </div>

              {/* PAYLOAD */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {t("messages.modal.sections.payload")}
                  </span>
                  <button
                    onClick={() => handleCopy(modalData.payloadContent)}
                    className="text-[11px] text-indigo-600 hover:text-indigo-500 font-semibold cursor-pointer"
                  >
                    {t("messages.modal.buttons.copy")}
                  </button>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-inner overflow-y-auto custom-scrollbar">
                  <pre className="text-slate-800 text-[12px] whitespace-pre-wrap font-mono leading-relaxed">
                    {modalData.payloadContent}
                  </pre>
                </div>
              </div>

              {/* AMQP PROPERTIES */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {t("messages.modal.sections.amqpProperties")}
                  </span>
                  <button
                    onClick={() => handleCopy(modalData.amqpProperties)}
                    className="text-[11px] text-indigo-600 hover:text-indigo-500 font-semibold cursor-pointer"
                  >
                    {t("messages.modal.buttons.copy")}
                  </button>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 shadow-inner overflow-y-auto custom-scrollbar">
                  <pre className="text-slate-850 text-[12px] whitespace-pre-wrap font-mono leading-relaxed">
                    {modalData.amqpProperties}
                  </pre>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setModalData(null)}
                className="px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition cursor-pointer font-semibold active:scale-95"
              >
                {t("messages.modal.buttons.close")}
              </button>
              <button
                onClick={() => handleCopy(`${modalData.text}\n\n${modalData.payloadContent}`)}
                className="bg-indigo-600 hover:bg-indigo-500 transition text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 cursor-pointer active:scale-95 shadow-sm"
              >
                {isCopied ? <Check size={16} /> : <Copy size={16} />}
                {isCopied ? t("messages.modal.buttons.copied") : t("messages.modal.buttons.copyAll")}
              </button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
};

const DetailBox = ({ label, value, onCopy }) => (
  <div className="flex flex-col gap-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl relative shadow-xs">
    <div className="flex justify-between items-center">
      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{label}</span>
      <button onClick={onCopy} className="text-indigo-600 hover:text-indigo-500 cursor-pointer animate-pulse-once" title="Copy"><Copy size={12} /></button>
    </div>
    <div className="text-slate-800 break-all text-[11px] font-mono font-medium mt-0.5">{value || "N/A"}</div>
  </div>
);

const renderAmhsStatus = (status) => {
  const statusMap = {
    0: { label: 'PENDING', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
    1: { label: 'PROCESSING', className: 'bg-blue-50 text-blue-700 border border-blue-200' }, // Để tương thích tin cũ
    2: { label: 'TRANSFORMED', className: 'bg-indigo-50 text-indigo-700 border border-indigo-200' },
    3: { label: 'PUBLISHING', className: 'bg-blue-50 text-blue-700 border border-blue-200' },
    4: { label: 'PUBLISHED', className: 'bg-green-50 text-green-700 border border-green-200' },
    5: { label: 'FAILED', className: 'bg-red-50 text-red-700 border border-red-200' },
    6: { label: 'RESOLVED', className: 'bg-slate-50 text-slate-700 border border-slate-200' },
    7: { label: 'CANCELLED', className: 'bg-slate-50 text-slate-700 border border-slate-200' },
  };

  const current = statusMap[status] || { label: 'UNKNOWN', className: 'bg-slate-50 text-slate-750 border border-slate-250' };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${current.className}`}>
      {t("messages.status." + current.label) || current.label}
    </span>
  );
};

const renderSwimStatus = (status) => {
  const statusMap = {
    0: { label: 'PENDING', className: 'bg-amber-50 text-amber-700 border border-amber-200' },
    1: { label: 'PROCESSING', className: 'bg-blue-50 text-blue-700 border border-blue-200' },
    2: { label: 'TRANSFORMED', className: 'bg-indigo-50 text-indigo-700 border border-indigo-200' },
    3: { label: 'SENT', className: 'bg-green-50 text-green-700 border border-green-200' },
    4: { label: 'FAILED', className: 'bg-red-50 text-red-700 border border-red-200' },
    5: { label: 'UNROUTED', className: 'bg-slate-50 text-slate-700 border border-slate-200' },
    6: { label: 'RESOLVED', className: 'bg-slate-50 text-slate-700 border border-slate-200' },
    7: { label: 'CANCELLED', className: 'bg-slate-50 text-slate-700 border border-slate-200' },
  };

  const current = statusMap[status] || { label: 'UNKNOWN', className: 'bg-slate-50 text-slate-750 border border-slate-250' };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${current.className}`}>
      {t("messages.status." + current.label) || current.label}
    </span>
  );
};

export default MessageView;