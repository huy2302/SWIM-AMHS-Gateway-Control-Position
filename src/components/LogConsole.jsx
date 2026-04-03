import React, { useEffect, useRef, useState } from 'react';

const LogConsole = ({ logs }) => {
  const scrollRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);

  const handleScroll = () => {
    if (!scrollRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    // Kiểm tra nếu người dùng cuộn lên cách đáy hơn 50px
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    
    // Nếu ở đáy thì cho phép auto-scroll, nếu cuộn lên thì tạm dừng
    setIsPaused(!isAtBottom);
  };

  useEffect(() => {
    // Chỉ tự động cuộn nếu người dùng không chủ động cuộn lên xem log cũ
    if (scrollRef.current && !isPaused) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isPaused]);

  return (
    <div className="bg-black/90 border border-slate-700 rounded h-full flex flex-col font-mono relative">
      <div className="bg-slate-800 px-3 py-1 border-b border-slate-700 flex justify-between text-[10px]">
        <span className="text-slate-400 font-bold uppercase tracking-widest">System Live Logs</span>
        
        {/* Hiển thị thông báo nếu đang tạm dừng cuộn */}
        {isPaused && (
          <span className="text-yellow-500 animate-pulse font-bold">
            [ TẠM DỪNG CUỘN - XEM LOG CŨ ]
          </span>
        )}
      </div>

      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-2 custom-scrollbar"
      >
        {logs.map((log) => (
          <div key={log.id} className="flex gap-3 text-[11px] mb-1">
            <span className="text-slate-400 whitespace-nowrap">[{log.timestamp}]</span>
            <span className={`font-bold min-w-[60px] ${
              log.level === 'ERROR' ? 'text-red-500' : 
              log.level === 'WARN' ? 'text-yellow-500' : 'text-blue-400'
            }`}>
              {log.level}
            </span>
            <span className="text-slate-300">{log.message}</span>
          </div>
        ))}
      </div>

      {/* Nút hỗ trợ cuộn nhanh xuống đáy */}
      {isPaused && (
        <button 
          onClick={() => setIsPaused(false)}
          className="absolute bottom-4 right-6 bg-blue-600 hover:bg-blue-500 text-white text-[10px] px-3 py-1 rounded shadow-lg transition-all"
        >
          Cuộn xuống mới nhất ↓
        </button>
      )}
    </div>
  );
};

export default LogConsole;