import React, { useState, useEffect } from "react";
import DashboardLayout from "../layout/DashboardLayout";
import { Search, Database, X, Copy, Check, Loader2 } from "lucide-react";
import gatewayApi from "../api/gatewayApi"; // Giả định file api đã tạo ở bước trước

const ArchiveView = () => {
  const [selectedId, setSelectedId] = useState(null);
  const [modalData, setModalData] = useState(null);
  const [isCopied, setIsCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // States cho Filter và Search
  const [searchType, setSearchType] = useState("AMQP"); // AMQP hoặc X.400
  const [direction, setDirection] = useState("Received");
  const [searchTerm, setSearchTerm] = useState("");
  const [rows, setRows] = useState([]);

  // Hàm gọi API lấy dữ liệu thực tế
  const fetchArchiveData = async () => {
    setLoading(true);
    try {
      let response;
      if (searchType === "AMQP") {
        // Lấy dữ liệu từ bảng message_archive (Dữ liệu hệ thống SWIM/CP)
        response = await gatewayApi.getAllArchives({
          direction: direction.toLowerCase(),
          query: searchTerm
        });
      } else {
        // Lấy dữ liệu từ bảng message_conversion_log (Dữ liệu Gateway re-use)
        response = await gatewayApi.getConversionLogs({
          page: 0,
          size: 50,
          query: searchTerm
        });
        response = response.content; // Giả sử backend trả về Page object
      }
      setRows(response || []);
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
              <option value="AMQP">AMQP (SWIM)</option>
              <option value="X.400">X.400 (Gateway)</option>
            </select>
          </div>

          <div className="flex items-center gap-4 text-xs">
            {["Received", "Sent"].map((dir) => (
              <label key={dir} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="radio"
                  name="dir"
                  value={dir}
                  checked={direction === dir}
                  onChange={(e) => setDirection(e.target.value)}
                  className="accent-blue-500"
                />
                <span className={direction === dir ? "text-blue-400" : "text-slate-400"}>{dir}</span>
              </label>
            ))}
          </div>

          <div className="flex-1 min-w-[300px] relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchType === "AMQP" ? "Search by Message ID / MTS-ID..." : "Search by Origin / Filing Time..."}
              className="w-full bg-black/40 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-xs focus:border-blue-500 outline-none text-slate-200"
            />
          </div>

          <button
            onClick={fetchArchiveData}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all active:scale-95 shadow-lg"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} 
            SEARCH
          </button>
        </div>

        {/* Dynamic Table Content */}
        <div className="flex-1 bg-slate-900 border-x border-slate-800 overflow-auto custom-scrollbar">
          <table className="w-full text-left text-[11px] border-collapse min-w-[1000px] font-mono">
            <thead className="sticky top-0 bg-slate-800 z-10 shadow-md">
              <tr className="text-slate-400 border-b border-slate-700">
                {searchType === "AMQP" ? (
                  <>
                    <th className="px-4 py-3">MSG ID</th>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">MTS-ID</th>
                    <th className="px-4 py-3">IPM-ID</th>
                    <th className="px-4 py-3">Status</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Origin</th>
                    <th className="px-4 py-3">Filing Time</th>
                    <th className="px-4 py-3">Message ID</th>
                    <th className="px-4 py-3">Status</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {rows.map((row) => (
                <tr
                  key={row.uuid || row.id}
                  onClick={() => setSelectedId(row.uuid || row.id)}
                  onDoubleClick={() => setModalData(row)}
                  className={`transition-all duration-150 cursor-pointer 
                  ${selectedId === (row.uuid || row.id) ? "bg-blue-600/30 text-white" : "hover:bg-slate-800/60 text-slate-400"}
                `}
                >
                  {searchType === "AMQP" ? (
                    <>
                      <td className="px-4 py-2.5 font-bold text-blue-400">{row.msgId}</td>
                      <td className="px-4 py-2.5">{new Date(row.timestamp).toLocaleString()}</td>
                      <td className="px-4 py-2.5 opacity-80 break-all">{row.mtsId}</td>
                      <td className="px-4 py-2.5 opacity-60 break-all">{row.ipmId}</td>
                      <td className="px-4 py-2.5 text-green-500 font-bold">{row.processingStatus}</td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-2.5 font-bold text-orange-400">{row.id}</td>
                      <td className="px-4 py-2.5">{row.date}</td>
                      <td className="px-4 py-2.5 text-blue-300 font-bold">{row.origin}</td>
                      <td className="px-4 py-2.5">{row.filing_time}</td>
                      <td className="px-4 py-2.5 break-all">{row.messageId}</td>
                      <td className={`px-4 py-2.5 font-bold ${row.status === 'ERROR' ? 'text-red-500' : 'text-green-500'}`}>{row.status}</td>
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
            <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
              <div className="bg-slate-800 px-4 py-3 flex justify-between items-center border-b border-slate-700">
                <span className="text-xs font-bold uppercase tracking-tight text-blue-400">
                   Detail View: #{modalData.msgId || modalData.id}
                </span>
                <button onClick={() => setModalData(null)} className="text-slate-400 hover:text-white"><X size={20} /></button>
              </div>

              <div className="p-6 space-y-4 font-mono">
                <div className="grid grid-cols-2 gap-4 text-[11px]">
                  <DetailBox 
                    label={searchType === "AMQP" ? "MTS-ID" : "IPM-ID / Remark"} 
                    value={modalData.mtsId || modalData.remark} 
                    onCopy={() => handleCopy(modalData.mtsId || modalData.remark)} 
                  />
                  <DetailBox 
                    label={searchType === "AMQP" ? "Recipients" : "Type/Category"} 
                    value={modalData.recipients || `${modalData.type} / ${modalData.category}`} 
                    onCopy={() => handleCopy(modalData.recipients || modalData.type)} 
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Raw Message Content</span>
                  <div className="bg-black/60 p-4 rounded-lg border border-slate-800 text-green-400 text-[11px] h-60 overflow-y-auto custom-scrollbar whitespace-pre-wrap">
                    {modalData.rawContent || modalData.content}
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 p-3 px-6 flex justify-end gap-3">
                <button onClick={() => setModalData(null)} className="text-[11px] text-slate-400 font-bold uppercase">Close</button>
                <button
                  onClick={() => handleCopy(modalData.rawContent || modalData.content)}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded text-[11px] font-bold flex items-center gap-2"
                >
                  {isCopied ? <Check size={14} /> : <Copy size={14} />} {isCopied ? "COPIED" : "COPY CONTENT"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-slate-950 border border-slate-800 rounded-b-xl p-2 px-4 flex justify-between items-center text-[10px] text-slate-500 italic shadow-inner">
          <span>{loading ? "Refreshing data..." : `Showing ${rows.length} ${searchType} entries`}</span>
          <span>Source Table: {searchType === "AMQP" ? "message_archive" : "message_conversion_log"}</span>
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
    <div className="bg-black/40 p-2 rounded border border-slate-800 text-slate-300 break-all h-16 overflow-y-auto text-[10px]">{value || "N/A"}</div>
  </div>
);

export default ArchiveView;
