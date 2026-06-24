import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/layout/DashboardLayout";
import { Search, X, Copy, Check, Loader2 } from "lucide-react";
import gatewayApi from "@/api/gatewayApi";
import { t } from "@/i18n/translator";
import {
  TablePagination,
  Dialog,
  DialogContent,
  DialogTitle,
  Box,
  Typography,
  Chip
} from "@mui/material";

const MessageView = () => {
  const [selectedId, setSelectedId] = useState(null);
  const [modalData, setModalData] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  const [loading, setLoading] = useState(false);

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
      
      // Xử lý response từ API
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

  // Xử lý filter từ API
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

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col bg-slate-100 text-slate-900 p-4 relative overflow-hidden" style={{height: 'fit-content', maxHeight: '100vh'}}>
        
        {/* Search Header */}
        <div className="bg-slate-900 p-4 rounded-t-xl border border-slate-800 flex flex-wrap gap-4 items-center shadow-2xl">
          <div className="flex items-center gap-2 bg-black/40 px-3 py-2 rounded border border-slate-800">
            <span className="text-[10px] text-slate-500 font-bold uppercase">{t("messages.source.label")}</span>
            <select
              value={searchType}
              onChange={(e) => {
                setSearchType(e.target.value);
                setPage(0);
              }}
              className="bg-transparent text-xs outline-none text-blue-400 font-bold cursor-pointer"
            >
              <option value="AMQP">AMQP SWIM (Gateway In)</option>
              <option value="X.400">X.400 (Gateway Out)</option>
            </select>
          </div>

          {/* Status Filter - API */}
          <div className="flex items-center gap-2 bg-black/40 px-3 py-2 rounded border border-slate-800">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Status</span>
            <select
              value={filters.status}
              onChange={(e) => handleApiFilterChange('status', e.target.value)}
              className="bg-transparent text-xs outline-none text-slate-300 font-bold cursor-pointer"
            >
              <option value="">All</option>
              <option value="0">PENDING</option>
              <option value="1">PROCESSING</option>
              <option value="2">TRANSFORMED</option>
              <option value="3">PUBLISHED</option>
              <option value="4">FAILED</option>
              <option value="5">UNROUTED</option>
            </select>
          </div>

          {/* Source Filter - API (chỉ cho inbound) */}
          {searchType === "AMQP" && (
            <div className="flex items-center gap-2 bg-black/40 px-3 py-2 rounded border border-slate-800">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Source</span>
              <input
                type="text"
                value={filters.source}
                onChange={(e) => handleApiFilterChange('source', e.target.value)}
                placeholder="Enter source..."
                className="bg-transparent text-xs outline-none text-slate-300 w-32"
              />
            </div>
          )}
        </div>

        {/* Local Filters */}
        <div className="flex-1 bg-slate-900 border-x border-b border-slate-800 rounded-b-xl transition-all duration-300 ease-in-out max-h-[600px] opacity-100 mb-3 px-4 py-2">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
            {/* Callsign */}
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-medium text-gray-700">
                Callsign
              </label>
              <input
                value={localFilters.callsign}
                onChange={(e) => handleFilterChange('callsign', e.target.value)}
                type="text"
                placeholder="VN756..."
                className="border border-gray-300 rounded-lg px-3 py-1 text-[12px] outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Origin */}
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-medium text-gray-700">
                {t("messages.filters.origin.label")}
              </label>
              <input
                value={localFilters.origin}
                onChange={(e) => handleFilterChange('origin', e.target.value)}
                type="text"
                placeholder="VVNB..."
                className="border border-gray-300 rounded-lg px-3 py-1 text-[12px] outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Address */}
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-medium text-gray-700">
                {t("messages.filters.address.label")}
              </label>
              <input
                value={localFilters.address}
                onChange={(e) => handleFilterChange('address', e.target.value)}
                type="text"
                placeholder="VVTSYFYX..."
                className="border border-gray-300 rounded-lg px-3 py-1 text-[12px] outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Message ID */}
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-medium text-gray-700">
                {t("messages.filters.messageId.label")}
              </label>
              <input
                value={localFilters.messageId}
                onChange={(e) => handleFilterChange('messageId', e.target.value)}
                type="text"
                placeholder="MSG-IN-0001..."
                className="border border-gray-300 rounded-lg px-3 py-1 text-[12px] outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Raw Text */}
            <div className="flex flex-col gap-1 md:col-span-2 xl:col-span-3">
              <label className="text-[12px] font-medium text-gray-700">
                {t("messages.filters.rawText.label")}
              </label>
              <input
                value={localFilters.text}
                onChange={(e) => handleFilterChange('text', e.target.value)}
                type="text"
                placeholder={t("messages.filters.rawText.placeholder")}
                className="border border-gray-300 rounded-lg px-3 py-1 text-[12px] outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={() => {
                setPage(0);
                fetchArchiveData();
              }}
              disabled={loading}
              className="w-fit bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs flex items-center gap-2 transition-all active:scale-95 shadow-lg"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} 
              {t("messages.filters.filterButton")}
            </button>
          </div>      
        </div>

        {/* Dynamic Table Content */}
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-t-xl overflow-auto custom-scrollbar">
          <table className="w-full text-left text-[11px] border-collapse min-w-[1000px] font-mono">
            <thead className="sticky top-0 bg-slate-800 z-10 shadow-md">
              <tr className="text-slate-400 border-b border-slate-700">
                {searchType === "AMQP" ? (
                  <>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">MSG ID</th>
                    <th className="px-4 py-3">{t("messages.table.amqp.time")}</th>
                    <th className="px-4 py-3">{t("messages.table.amqp.source")}</th>
                    <th className="px-4 py-3">{t("messages.table.amqp.origin")}</th>
                    <th className="px-4 py-3">{t("messages.table.amqp.address")}</th>
                    <th className="px-4 py-3">{t("messages.table.amqp.textRaw")}</th>
                    <th className="px-4 py-3">{t("messages.table.amqp.status")}</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-3">{t("messages.table.x400.id")}</th>
                    <th className="px-4 py-3">{t("messages.table.x400.date")}</th>
                    <th className="px-4 py-3">{t("messages.table.x400.origin")}</th>
                    <th className="px-4 py-3">{t("messages.table.x400.filingTime")}</th>
                    <th className="px-4 py-3">{t("messages.table.x400.messageId")}</th>
                    <th className="px-4 py-3">{t("messages.table.x400.textRaw")}</th>
                    <th className="px-4 py-3">{t("messages.table.x400.status")}</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={searchType === "AMQP" ? 8 : 7} className="text-center py-8 text-slate-400">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                    Loading messages...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={searchType === "AMQP" ? 8 : 7} className="text-center py-8 text-slate-400">
                    No messages found
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => (
                  <tr
                    key={row.msgid || row.id}
                    onClick={() => setSelectedId(row.msgid || row.id)}
                    onDoubleClick={() => setModalData(row)}
                    className={`transition-all duration-150 cursor-pointer 
                    ${selectedId === (row.msgid || row.id) ? "bg-blue-600/30 text-white" : "hover:bg-slate-800/60 text-slate-400"}
                  `}
                  >
                    {searchType === "AMQP" ? (
                      <>
                        <td className="px-4 py-2.5 font-bold text-blue-400">{row.msgid}</td>
                        <td className="px-4 py-2.5 font-bold text-blue-700">{row.messageId}</td>
                        <td className="px-4 py-2.5 text-black">{row.time}</td>
                        <td className="px-4 py-2.5 break-all text-black">{row.source}</td>
                        <td className="px-4 py-2.5 break-all text-black">{row.origin}</td>
                        <td className="px-4 py-2.5 break- text-black">{row.address}</td>
                        <td className="px-4 py-2.5 break-all text-black w-[30%]" style={{maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden'}}>{row.text}</td>
                        <td className="px-4 py-2.5">{renderSwimStatus(row.status)}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-2.5 font-bold text-blue-400">{row.msgid}</td>
                        <td className="px-4 py-2.5 text-black">{row.time}</td>
                        <td className="px-4 py-2.5 text-black font-bold">{row.origin}</td>
                        <td className="px-4 py-2.5 text-black">{row.filingTime}</td>
                        <td className="px-4 py-2.5 font-bold text-blue-700 break-all">{row.amhsid}</td>
                        <td className="px-4 py-2.5 text-black break-all w-[30%]" style={{maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden'}}>{row.text}</td>
                        <td className={`px-4 py-2.5 font-bold`}>{renderAmhsStatus(row.status)}</td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Material-UI Pagination */}
        <div className="bg-slate-900 border border-slate-800 border-t-0 rounded-b-xl">
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50, 100]}
            component="div"
            count={totalElements}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            sx={{
              color: '#94a3b8',
              '& .MuiTablePagination-select': {
                color: '#94a3b8'
              },
              '& .MuiTablePagination-selectIcon': {
                color: '#94a3b8'
              },
              '& .MuiTablePagination-actions button': {
                color: '#94a3b8'
              },
              '& .MuiTablePagination-actions button.Mui-disabled': {
                color: '#475569'
              },
              '& .MuiTablePagination-selectLabel': {
                color: '#94a3b8'
              },
              '& .MuiTablePagination-input': {
                color: '#94a3b8'
              },
              '& .MuiTablePagination-displayedRows': {
                color: '#94a3b8'
              }
            }}
          />
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-b-xl p-2 px-4 flex justify-between items-center text-[10px] text-slate-500 italic shadow-inner">
          <span>
            {loading ? t("messages.pagination.refreshing") : 
              `${t("messages.pagination.showing")} ${filteredData.length} / ${totalElements} ${t("messages.pagination.entries")}`
            }
          </span>
          <span>{t("messages.pagination.sourceTable")}{searchType === "AMQP" ? "gwin" : "gwout"}</span>
        </div>

        {/* Modal Details - Giữ nguyên */}
        {modalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-6xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* HEADER */}
            <div className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-700">
                  {t("messages.modal.title")}
                </span>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-lg font-bold text-slate-700">
                    #{modalData.msgid}
                  </span>
                  {renderAmhsStatus(modalData.status)}
                </div>
              </div>
              <button
                onClick={() => setModalData(null)}
                className="text-slate-400 hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* BODY */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-scroll">
              {/* INFO GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
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
                  label="CPA"
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
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {t("messages.modal.sections.rawMessage")}
                  </span>
                  <button
                    onClick={() => handleCopy(modalData.text)}
                    className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold"
                  >
                    {t("messages.modal.buttons.copy")}
                  </button>
                </div>
                <div className="bg-black/60 border border-slate-800 rounded-xl px-2 py-1 overflow-y-auto custom-scrollbar">
                  <pre className="text-green-400 text-[12px] whitespace-pre-wrap font-mono">
                    {modalData.text}
                  </pre>
                </div>
              </div>

              {/* PAYLOAD */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {t("messages.modal.sections.payload")}
                  </span>
                  <button
                    onClick={() => handleCopy(modalData.payloadContent)}
                    className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold"
                  >
                    {t("messages.modal.buttons.copy")}
                  </button>
                </div>
                <div className="bg-black/60 border border-slate-800 rounded-xl px-2 py-1 overflow-y-auto custom-scrollbar">
                  <pre className="text-cyan-400 text-[12px] whitespace-pre-wrap font-mono">
                    {modalData.payloadContent}
                  </pre>
                </div>
              </div>

              {/* AMQP PROPERTIES */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {t("messages.modal.sections.amqpProperties")}
                  </span>
                  <button
                    onClick={() => handleCopy(modalData.amqpProperties)}
                    className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold"
                  >
                    {t("messages.modal.buttons.copy")}
                  </button>
                </div>
                <div className="bg-black/60 border border-slate-800 rounded-xl px-2 py-1 overflow-y-auto custom-scrollbar">
                  <pre className="text-orange-400 text-[12px] whitespace-pre-wrap font-mono">
                    {modalData.amqpProperties}
                  </pre>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="bg-slate-800/50 border-t border-slate-700 px-6 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setModalData(null)}
                className="px-4 py-2 text-sm rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition"
              >
                {t("messages.modal.buttons.close")}
              </button>
              <button
                onClick={() => handleCopy(`${modalData.text}\n\n${modalData.payloadContent}`)}
                className="bg-blue-600 hover:bg-blue-500 transition text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
              >
                {isCopied ? <Check size={16} /> : <Copy size={16} />}
                {isCopied ? t("messages.modal.buttons.copied") : t("messages.modal.buttons.copyAll")}
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </DashboardLayout>
  );
};

const DetailBox = ({ label, value, onCopy }) => (
  <div className="flex flex-col gap-1">
    <div className="flex justify-between items-center">
      <span className="text-[10px] text-slate-500 font-bold uppercase">{label}</span>
      <button onClick={onCopy} className="text-blue-500 hover:text-blue-400"><Copy size={12} /></button>
    </div>
    <div className="bg-black/40 px-2 py-1 rounded border border-slate-800 text-slate-300 break-all overflow-y-auto text-[10px]">{value || t("messages.modal.na")}</div>
  </div>
);

const renderAmhsStatus = (status) => {
  const statusMap = {
    0: { label: 'PENDING', className: 'bg-amber-100 text-amber-700' },
    1: { label: 'PROCESSING', className: 'bg-blue-100 text-blue-700' },
    2: { label: 'TRANSFORMED', className: 'bg-violet-100 text-violet-700' },
    3: { label: 'PUBLISHED', className: 'bg-green-100 text-green-700' },
    4: { label: 'FAILED', className: 'bg-red-100 text-red-700' },
    5: { label: 'UNROUTED', className: 'bg-gray-100 text-gray-700' },
  };

  const current = statusMap[status] || { label: 'UNKNOWN', className: 'bg-gray-100 text-gray-700' };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${current.className}`}>
      {current.label}
    </span>
  );
};

const renderSwimStatus = (status) => {
  const statusMap = {
    0: { label: 'PENDING', className: 'bg-[#fef3c7] text-[#f59e0b]' },
    1: { label: 'PROCESSING', className: 'bg-[#dbeafe] text-[#2563eb]' },
    2: { label: 'TRANSFORMED', className: 'bg-[#ede9fe] text-[#7c3aed]' },
    3: { label: 'SENT', className: 'bg-[#dcfce7] text-[#16a34a]' },
    4: { label: 'FAILED', className: 'bg-[#fee2e2] text-[#dc2626]' },
    5: { label: 'UNROUTED', className: 'bg-[#f3f4f6] text-[#6b7280]' },
  };

  const current = statusMap[status] || { label: 'UNKNOWN', className: 'bg-gray-100 text-gray-700' };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${current.className}`}>
      {current.label}
    </span>
  );
};

export default MessageView;