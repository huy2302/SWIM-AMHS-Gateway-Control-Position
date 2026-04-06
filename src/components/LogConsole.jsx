import React, { useEffect, useRef, useState } from "react";

/**
 * LogConsole component that displays live system logs in a scrollable console.
 * Automatically scrolls to bottom for new logs, but pauses if user scrolls up to view older logs.
 * @param {Array} logs - Array of log objects with id, timestamp, level, and message properties.
 * @returns {JSX.Element} A console-like log display with auto-scroll functionality.
 */
const LogConsole = ({ logs }) => {
  const scrollRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);

  const handleScroll = () => {
    if (!scrollRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    // Check if user has scrolled up more than 50px from bottom
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;

    // If at bottom, allow auto-scroll; if scrolled up, pause
    setIsPaused(!isAtBottom);
  };

  useEffect(() => {
    // Only auto-scroll if user hasn't manually scrolled up to view old logs
    if (scrollRef.current && !isPaused) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isPaused]);

  return (
    <div className="bg-black/90 border border-slate-700 rounded h-full flex flex-col font-mono relative">
      <div className="bg-slate-800 px-3 py-1 border-b border-slate-700 flex justify-between text-[10px]">
        <span className="text-slate-400 font-bold uppercase tracking-widest">
          System Live Logs
        </span>

        {/* Display notification if scrolling is paused */}
        {isPaused && (
          <span className="text-yellow-500 animate-pulse font-bold">
            [ SCROLL PAUSED - VIEWING OLD LOGS ]
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
            <span className="text-slate-400 whitespace-nowrap">
              [{log.timestamp}]
            </span>
            <span
              className={`font-bold min-w-[60px] ${
                log.level === "ERROR"
                  ? "text-red-500"
                  : log.level === "WARN"
                    ? "text-yellow-500"
                    : "text-blue-400"
              }`}
            >
              {log.level}
            </span>
            <span className="text-slate-300">{log.message}</span>
          </div>
        ))}
      </div>

      {/* Button to quickly scroll to bottom */}
      {isPaused && (
        <button
          onClick={() => setIsPaused(false)}
          className="absolute bottom-4 right-6 bg-blue-600 hover:bg-blue-500 text-white text-[10px] px-3 py-1 rounded shadow-lg transition-all"
        >
          Scroll to latest ↓
        </button>
      )}
    </div>
  );
};

export default LogConsole;
