import React, { useState, useEffect } from "react";
import DashboardLayout from "../layout/DashboardLayout";
import { Search, Database, X, Copy, Check, Loader2, FunnelPlus } from "lucide-react";
import gatewayApi from "../api/gatewayApi"; // Giả định file api đã tạo ở bước trước
import { Funnel } from "recharts";

const MessageView = () => {
  const [selectedId, setSelectedId] = useState(null);
  const [modalData, setModalData] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showFilter, setShowFilter] = useState(false);

  // States cho Filter và Search
  const [searchType, setSearchType] = useState("AMQP"); // AMQP hoặc X.400
  const [direction, setDirection] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [rows, setRows] = useState([]);

  const [filters, setFilters] = useState({
    callsign: '',
    origin: '',
    address: '',
    messageId: '',
    text: '',
    status: '',
  });

  const filteredData = rows.filter((row) => {
    const callsign = filters.callsign.toLowerCase();
    const origin = filters.origin.toLowerCase();
    const address = filters.address.toLowerCase();
    const messageId = filters.messageId.toLowerCase();
    const text = filters.text.toLowerCase();

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
        row.text?.toLowerCase().includes(text)) &&

      (filters.status === '' ||
        Number(row.status) === Number(filters.status))
    );
  });

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));

    console.log(filteredData)
  };

  // Hàm gọi API lấy dữ liệu thực tế
  const fetchArchiveData = async () => {
    setLoading(true);
    try {
      let response;
      if (searchType === "AMQP") {
        // Lấy dữ liệu từ bảng message_archive (Dữ liệu hệ thống SWIM/CP)
        response = await gatewayApi.getAllSwimMessages();
      } else {
        // Lấy dữ liệu từ bảng message_conversion_log (Dữ liệu Gateway re-use)
        response = await gatewayApi.getAllAmhsMessages();
      }
      console.log(response);
      setRows(response.content || []);
    } catch (error) {
      console.error("Lỗi khi fetch dữ liệu archive:", error);
    } finally {
      setLoading(false);
    }
  };

  // Gọi dữ liệu khi mount hoặc đổi loại tìm kiếm
  useEffect(() => {
    fetchArchiveData();
  }, [searchType, direction]);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full bg-slate-100 text-slate-900 p-4 relative overflow-hidden" style={{maxHeight: '100vh'}}>
        
        {/* Search Header */}
        <div className="bg-slate-900 p-4 rounded-t-xl border border-slate-800 flex flex-wrap gap-4 items-center shadow-2xl">
          <div className="flex items-center gap-2 bg-black/40 px-3 py-2 rounded border border-slate-800">
            <span className="text-[10px] text-slate-500 font-bold uppercase">Source</span>
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="bg-transparent text-xs outline-none text-blue-400 font-bold cursor-pointer"
            >
              <option value="AMQP">AMQP SWIM (Gateway In)</option>
              <option value="X.400">X.400 (Gateway Out)</option>
            </select>
          </div>

          <button
            onClick={() => setShowFilter(!showFilter)}
            className="transition-all"
          >
            <FunnelPlus color="#000" />
          </button>
          <div className="flex-1 min-w-[300px] relative">
            {/* <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /> */}
            {/* <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchType === "AMQP" ? "Search by Message ID / MTS-ID..." : "Search by Origin / Filing Time..."}
              className="w-full bg-black/40 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-xs focus:border-blue-500 outline-none text-slate-200"
            /> */}
          </div>

          {/* <button
            onClick={fetchArchiveData}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all active:scale-95 shadow-lg"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} 
            SEARCH
          </button> */}
        </div>

        <div
          className={`flex-1 bg-slate-900 border-x border-b border-slate-800 rounded-b-xl transition-all duration-300 ease-in-out ${showFilter ? 'max-h-[600px] opacity-100 mb-3 px-4 py-2' : 'max-h-0 opacity-0'} `}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
            {/* Callsign */}
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-medium text-gray-700">
                Callsign
              </label>

              <input
                value={filters.callsign}
                onChange={(e) =>
                  handleFilterChange('callsign', e.target.value)
                }
                type="text"
                placeholder="VN756..."
                className="border border-gray-300 rounded-lg px-3 py-1 text-[12px] outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Origin */}
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-medium text-gray-700">
                Origin
              </label>

              <input
                value={filters.origin}
                onChange={(e) =>
                  handleFilterChange('origin', e.target.value)
                }
                type="text"
                placeholder="VVNB..."
                className="border border-gray-300 rounded-lg px-3 py-1 text-[12px] outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Address */}
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-medium text-gray-700">
                Address
              </label>

              <input
                value={filters.address}
                onChange={(e) =>
                  handleFilterChange('address', e.target.value)
                }
                type="text"
                placeholder="VVTSYFYX..."
                className="border border-gray-300 rounded-lg px-3 py-1 text-[12px] outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Message ID */}
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-medium text-gray-700">
                Message ID
              </label>

              <input
                value={filters.messageId}
                onChange={(e) =>
                  handleFilterChange('messageId', e.target.value)
                }
                type="text"
                placeholder="MSG-IN-0001..."
                className="border border-gray-300 rounded-lg px-3 py-1 text-[12px] outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Raw Text */}
            <div className="flex flex-col gap-1 md:col-span-2 xl:col-span-3">
              <label className="text-[12px] font-medium text-gray-700">
                Raw Text
              </label>

              <input
                value={filters.text}
                onChange={(e) =>
                  handleFilterChange('text', e.target.value)
                }
                type="text"
                placeholder="Search raw message..."
                className="border border-gray-300 rounded-lg px-3 py-1 text-[12px] outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-medium text-gray-700">
                Status
              </label>

              <select
                value={filters.status}
                onChange={(e) =>
                  handleFilterChange('status', e.target.value)
                }
                className="border border-gray-300 rounded-lg px-3 py-2 text-[12px] outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="0">PENDING</option>
                <option value="1">PROCESSING</option>
                <option value="2">TRANSFORMED</option>
                <option value="3">PUBLISHED</option>
                <option value="4">FAILED</option>
              </select>
            </div>
            <button
              onClick={fetchArchiveData}
              disabled={loading}
              className="w-fit bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs flex items-center gap-2 transition-all active:scale-95 shadow-lg"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} 
              Filter
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
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">source</th>
                    <th className="px-4 py-3">Origin</th>
                    <th className="px-4 py-3">Address</th>
                    <th className="px-4 py-3">Text Raw</th>
                    <th className="px-4 py-3">Status</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Origin</th>
                    <th className="px-4 py-3">Filing Time</th>
                    <th className="px-4 py-3">Message ID</th>
                    <th className="px-4 py-3">Text Raw</th>
                    <th className="px-4 py-3">Status</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredData.map((row) => (
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
                      <td className="px-4 py-2.5 text-green-500 font-bold">{ renderSwimStatus(row.status)}</td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-2.5 font-bold text-blue-400">{row.msgid}</td>
                      <td className="px-4 py-2.5 text-black">{row.time}</td>
                      <td className="px-4 py-2.5 text-black font-bold">{row.origin}</td>
                      <td className="px-4 py-2.5 text-black">{row.filingTime}</td>
                      <td className="px-4 py-2.5 font-bold text-blue-700 break-all">{row.amhsid}</td>
                      <td className="px-4 py-2.5 text-black break-all w-[30%]" style={{maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden'}}>{row.text}</td>
                      <td className={`px-4 py-2.5 font-bold`}>{ renderAmhsStatus(row.status) }</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Details (Dữ liệu thay đổi theo cấu trúc bảng) */}
        {modalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          
          <div className="w-full max-w-6xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">

            {/* HEADER */}
            <div className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-[0.2em] text-slate-700">
                  AMHS Message Detail
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
                  label="MESSAGE ID"
                  value={modalData.messageId}
                  onCopy={() => handleCopy(modalData.messageId)}
                />

                <DetailBox
                  label="SUBJECT"
                  value={modalData.subject}
                  onCopy={() => handleCopy(modalData.subject)}
                />

                <DetailBox
                  label="ORIGIN"
                  value={modalData.origin}
                  onCopy={() => handleCopy(modalData.origin)}
                />

                <DetailBox
                  label="ADDRESS"
                  value={modalData.address}
                  onCopy={() => handleCopy(modalData.address)}
                />

                <DetailBox
                  label="SOURCE"
                  value={modalData.source}
                  onCopy={() => handleCopy(modalData.source)}
                />

                <DetailBox
                  label="ADDRESSING SOURCE"
                  value={modalData.addressingSource}
                  onCopy={() => handleCopy(modalData.addressingSource)}
                />

                <DetailBox
                  label="BODY TYPE"
                  value={modalData.bodyType}
                  onCopy={() => handleCopy(modalData.bodyType)}
                />

                <DetailBox
                  label="CONTENT TYPE"
                  value={modalData.contentType}
                  onCopy={() => handleCopy(modalData.contentType)}
                />

                <DetailBox
                  label="CPA"
                  value={modalData.cpa}
                  onCopy={() => handleCopy(modalData.cpa)}
                />

                <DetailBox
                  label="PRIORITY"
                  value={modalData.priority}
                  onCopy={() => handleCopy(modalData.priority)}
                />

                <DetailBox
                  label="TIME"
                  value={modalData.time}
                  onCopy={() => handleCopy(modalData.time)}
                />

                <DetailBox
                  label="ERROR TYPE"
                  value={modalData.errorType || "NONE"}
                  onCopy={() => handleCopy(modalData.errorType || "NONE")}
                />

              </div>

              {/* RAW MESSAGE */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Raw Message Content
                  </span>

                  <button
                    onClick={() => handleCopy(modalData.text)}
                    className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold"
                  >
                    COPY
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
                    Payload Content
                  </span>

                  <button
                    onClick={() => handleCopy(modalData.payloadContent)}
                    className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold"
                  >
                    COPY
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
                    AMQP Properties
                  </span>

                  <button
                    onClick={() => handleCopy(modalData.amqpProperties)}
                    className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold"
                  >
                    COPY
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
                Close
              </button>

              <button
                onClick={() =>
                  handleCopy(
                    `${modalData.text}\n\n${modalData.payloadContent}`
                  )
                }
                className="bg-blue-600 hover:bg-blue-500 transition text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
              >
                {isCopied ? <Check size={16} /> : <Copy size={16} />}
                {isCopied ? "Copied" : "Copy All"}
              </button>

            </div>

          </div>
        </div>
      )}

        <div className="bg-slate-950 border border-slate-800 rounded-b-xl p-2 px-4 flex justify-between items-center text-[10px] text-slate-500 italic shadow-inner">
          <span>{loading ? "Refreshing data..." : `Showing ${rows.length} ${searchType} entries`}</span>
          <span>Source Table: {searchType === "AMQP" ? "gwin" : "gwout"}</span>
        </div>
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
    <div className="bg-black/40 px-2 py-1 rounded border border-slate-800 text-slate-300 break-all overflow-y-auto text-[10px]">{value || "N/A"}</div>
  </div>
);

const StatusBadge = ({ status }) => {
  const info = getStatusInfo(status);

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold`}
      style={{color: info.color}}
    >
      {info.label}
    </span>
  );
};

const renderAmhsStatus = (status) => {
  const statusMap = {
    0: {
      label: 'PENDING',
      className: 'bg-amber-100 text-amber-700',
    },
    1: {
      label: 'PROCESSING',
      className: 'bg-blue-100 text-blue-700',
    },
    2: {
      label: 'TRANSFORMED',
      className: 'bg-violet-100 text-violet-700',
    },
    3: {
      label: 'PUBLISHED',
      className: 'bg-green-100 text-green-700',
    },
    4: {
      label: 'FAILED',
      className: 'bg-red-100 text-red-700',
    },
  };

  const current = statusMap[status] || {
    label: 'UNKNOWN',
    className: 'bg-gray-100 text-gray-700',
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${current.className}`}
    >
      {current.label}
    </span>
  );
};

const renderSwimStatus = (status) => {
  const statusMap = {
    0: {
      label: 'PENDING',
      className: 'bg-[#fef3c7] text-[#f59e0b]',
    },
    1: {
      label: 'PROCESSING',
      className: 'bg-[#dbeafe] text-[#2563eb]',
    },
    2: {
      label: 'TRANSFORMED',
      className: 'bg-[#ede9fe] text-[#7c3aed]',
    },
    3: {
      label: 'SENT',
      className: 'bg-[#dcfce7] text-[#16a34a]',
    },
    4: {
      label: 'FAILED',
      className: 'bg-[#fee2e2] text-[#dc2626]',
    },
    5: {
      label: 'UNROUTED',
      className: 'bg-[#f3f4f6] text-[#6b7280]',
    },
  };

  const current = statusMap[status] || {
    label: 'UNKNOWN',
    className: 'bg-gray-100 text-gray-700',
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${current.className}`}
    >
      {current.label}
    </span>
  );
};

export default MessageView;
