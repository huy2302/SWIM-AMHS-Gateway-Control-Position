import React, { useState } from "react";
import DashboardLayout from "../layout/DashboardLayout";
import { Search, Database, Download, X, Copy, Check } from "lucide-react";

const ArchiveView = () => {
  const [selectedId, setSelectedId] = useState(null);
  const [modalData, setModalData] = useState(null);
  const [isCopied, setIsCopied] = useState(false);

  // Dữ liệu mẫu (giả lập từ ảnh)
  const rows = [...Array(20)].map((_, i) => ({
    id: 281 + i,
    time: "08/12/25 15:14:59",
    mtsId: `[/PRMD=URUGUAY/ADMD=ICAO/C=XX;/Nova.000${i + 1}-251208.151459.4]`,
    ipmId: `${281 + i}*/OU=EGLLAMHS/O=AFTN/PRMD=EG/ADMD=ICAO/C=XX/`,
    content: "FPL-HVN123-IS-A321/M-SDFM1/S-VVTS0900-N0450F350 DCT PANTO DCT...", // Nội dung giả lập
  }));

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Giả sử rows là mảng dữ liệu gốc từ sampleData
  const [searchType, setSearchType] = useState("AMQP");
  const [direction, setDirection] = useState("Received");
  const [searchTerm, setSearchTerm] = useState("");

  // State lưu dữ liệu sau khi lọc để hiển thị lên bảng
  const [filteredRows, setFilteredRows] = useState(rows);

  const handleSearch = () => {
    const results = rows.filter((row) => {
      // 1. Lọc theo Type (Ví dụ: MTS-ID chứa thông tin X.400 hoặc AMQP)
      const matchesType =
        searchType === "AMQP"
          ? row.mtsId.includes("Nova")
          : row.mtsId.includes("PRMD");

      // 2. Lọc theo Direction (Giả sử dữ liệu của bạn có field 'type' là 'sent' hoặc 'received')
      const matchesDir = row.direction === direction.toLowerCase();

      // 3. Lọc theo Keyword (ID, MTS-ID hoặc IPM-ID)
      const query = searchTerm.toLowerCase();
      const matchesQuery =
        row.id.toString().includes(query) ||
        row.mtsId.toLowerCase().includes(query) ||
        row.ipmId.toLowerCase().includes(query);

      return matchesType && matchesDir && matchesQuery;
    });

    setFilteredRows(results);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full bg-slate-100 text-slate-900 p-4 relative overflow-hidden">
        {/* Search Header */}
        <div className="bg-slate-900 p-4 rounded-t-xl border border-slate-800 flex flex-wrap gap-4 items-center">
          {/* Select Type */}
          <div className="flex items-center gap-2 bg-black/40 px-3 py-2 rounded border border-slate-800">
            <span className="text-[10px] text-slate-500 font-bold uppercase">
              Search
            </span>
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="bg-transparent text-xs outline-none text-blue-400 font-bold cursor-pointer"
            >
              <option value="AMQP">AMQP</option>
              <option value="X.400">X.400</option>
            </select>
            <span className="text-[10px] text-slate-500 font-medium">
              messages
            </span>
          </div>

          {/* Radio Buttons Direction */}
          <div className="flex items-center gap-4 text-xs">
            {["Received", "Sent"].map((dir) => (
              <label
                key={dir}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <input
                  type="radio"
                  name="dir"
                  value={dir}
                  checked={direction === dir}
                  onChange={(e) => setDirection(e.target.value)}
                  className="accent-blue-500"
                />
                <span
                  className={
                    direction === dir
                      ? "text-blue-400"
                      : "text-slate-400 group-hover:text-blue-300"
                  }
                >
                  {dir}
                </span>
              </label>
            ))}
          </div>

          {/* Search Input */}
          <div className="flex-1 min-w-[300px] relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()} // Nhấn Enter để search
              placeholder="Matching AMQP Message ID / MTS-ID..."
              className="w-full bg-black/40 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-xs focus:border-blue-500 outline-none transition-all text-slate-200"
            />
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-900/20"
          >
            <Search size={14} /> SEARCH
          </button>
        </div>

        {/* Archive Table */}
        <div className="flex-1 bg-slate-900 border-x border-slate-800 overflow-auto custom-scrollbar">
          <table className="w-full text-left text-[11px] border-collapse min-w-[900px] font-mono">
            <thead className="sticky top-0 bg-slate-800 z-10 shadow-md">
              <tr className="text-slate-400 border-b border-slate-700">
                <th className="px-4 py-3">AMQP ID</th>
                <th className="px-4 py-3">Date / Time</th>
                <th className="px-4 py-3">Generated MTS-ID</th>
                <th className="px-4 py-3">Generated IPM ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => setSelectedId(row.id)} // Click 1 lần để chọn
                  onDoubleClick={() => setModalData(row)} // Click đúp để mở Modal
                  className={`transition-all duration-150 cursor-pointer select-none
                  ${selectedId === row.id ? "bg-blue-600/30 text-white shadow-inner" : "hover:bg-slate-800/60 text-slate-400"}
                `}
                >
                  <td
                    className={`px-4 py-2.5 font-bold ${selectedId === row.id ? "text-blue-300" : "text-blue-500"}`}
                  >
                    {row.id}
                  </td>
                  <td className="px-4 py-2.5 whitespace-nowrap">{row.time}</td>
                  <td className="px-4 py-2.5 break-all opacity-80">
                    {row.mtsId}
                  </td>
                  <td className="px-4 py-2.5 break-all opacity-60">
                    {row.ipmId}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MODAL CHI TIẾT ĐIỆN VĂN */}
        {modalData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
              {/* Modal Header */}
              <div className="bg-slate-800 px-4 py-3 flex justify-between items-center border-b border-slate-700">
                <div className="flex items-center gap-2">
                  <Database size={16} className="text-blue-400" />
                  <span className="text-xs font-bold uppercase tracking-tight">
                    Message Details: #{modalData.id}
                  </span>
                </div>
                <button
                  onClick={() => setModalData(null)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4 font-mono">
                <div className="grid grid-cols-2 gap-4 text-[11px]">
                  <DetailBox
                    label="MTS-ID"
                    value={modalData.mtsId}
                    onCopy={() => handleCopy(modalData.mtsId)}
                  />
                  <DetailBox
                    label="IPM-ID"
                    value={modalData.ipmId}
                    onCopy={() => handleCopy(modalData.ipmId)}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">
                    Raw Message Content
                  </span>
                  <div className="bg-black/60 p-4 rounded-lg border border-slate-800 text-green-400 text-xs leading-relaxed h-48 overflow-y-auto custom-scrollbar whitespace-pre-wrap shadow-inner">
                    {modalData.content}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-slate-800/50 p-3 px-6 flex justify-end gap-3">
                <button
                  onClick={() => setModalData(null)}
                  className="text-[11px] font-bold text-slate-400 hover:text-white transition-colors uppercase"
                >
                  Close
                </button>
                <button
                  onClick={() => handleCopy(modalData.content)}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded text-[11px] font-bold flex items-center gap-2 transition-all active:scale-95"
                >
                  {isCopied ? <Check size={14} /> : <Copy size={14} />}
                  {isCopied ? "COPIED" : "COPY CONTENT"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status Bar */}
        <div className="bg-slate-950 border border-slate-800 rounded-b-xl p-2 px-4 flex justify-between items-center text-[10px] text-slate-500 italic">
          <span>* Single click to select, Double click for details</span>
          <span>Connected to server: Nova</span>
        </div>
      </div>
    </DashboardLayout>
  );
};

// Component nhỏ hiển thị thông tin mã ID
const DetailBox = ({ label, value, onCopy }) => (
  <div className="flex flex-col gap-1">
    <div className="flex justify-between items-center">
      <span className="text-[10px] text-slate-500 font-bold uppercase">
        {label}
      </span>
      <button
        onClick={onCopy}
        className="text-blue-500 hover:text-blue-400 transition-colors"
      >
        <Copy size={12} />
      </button>
    </div>
    <div className="bg-black/40 p-2 rounded border border-slate-800 text-slate-300 break-all h-16 overflow-y-auto text-[10px]">
      {value}
    </div>
  </div>
);

export default ArchiveView;
