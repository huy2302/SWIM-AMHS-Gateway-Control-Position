import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

import { useSelector } from "react-redux";
import { Bell, History } from "lucide-react";
import UserMenu from "../components/UserMenu";
import { useSystemStore } from '@/hooks/systemStore';
import { t } from "@/i18n/translator";
import { Link } from "react-router-dom";

const titleMap = {
  monitor: "Gateway Monitor Dashboard",
  accounts: "Accounts Management",
  routing: "Routing Configuration",
  log: "Live Logs",
  messages: "Message Infomation",
  admin: "Admin Console",
  system: "System Monitor",
};

const statusTags = {
  monitor: [
    { label: "System Healthy", tone: "success" },
    { label: "All systems are operating normally", tone: "muted" },
  ],
}

export default function Topbar() {
  const location = useLocation();
  const pathKey = location.pathname.split("/")[1] || "monitor";
  const title = titleMap[pathKey] || "Gateway Monitor Dashboard";
  const statusTag = statusTags.monitor[1].label;
  const { uptime } = useSelector((state) => state.system);

  const unreadCount = useSystemStore((state) => state.unreadCount);
  
  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "en"
  );

  const handleChangeLanguage = (e) => {
    const lang = e.target.value;

    // Lưu vào localStorage
    localStorage.setItem("language", lang);

    // Cập nhật state
    setLanguage(lang);

    // Reload để áp dụng ngôn ngữ mới
    window.location.reload();
  };

  
  return (
    <div className="flex justify-between items-center">
      <div className="flex flex-col justify-between pl-4 pr-4 pt-4">
        <h3 className="text-[24px] mb-2 font-bold">{title}</h3>
        <span className="text-sm text-muted-foreground">{statusTag}</span>
       </div>

      <div>
        Up time: <span className="time">{formatUptime(uptime)}</span>
      </div>

      <div className="mr-4 flex items-center gap-4">
        {/* Language */}
        <div>
          <select value={language} onChange={handleChangeLanguage}>
            <option value="en">English</option>
            <option value="vi">Tiếng Việt</option>
          </select>
        </div>
    
        {/* Notification */}
        <Link to="/system-events" className="flex items-center">
          <div className="relative flex items-center justify-center">
            <Bell size={24} />

            <div className="absolute w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center top-[-8px] right-[-4px]">
    
            {/* ping layer */}
            {unreadCount > 0 && (
              <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
            )}

            {/* number */}
            <span className="relative text-[11px] font-bold leading-none">
              {unreadCount || 0}
            </span>
          </div>
          </div>
        </Link>

        {/* User */}
        <UserMenu />
      </div>
    </div>
  );
}

const formatUptime = (seconds) => {
  if (!seconds && seconds !== 0) return "0:00:00:00";

  const days = Math.floor(seconds / 86400);
  seconds %= 86400;

  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;

  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  // padStart để luôn có 2 chữ số
  const h = String(hours).padStart(2, "0");
  const m = String(minutes).padStart(2, "0");
  const s = String(secs).padStart(2, "0");

  return `${days}:${h}:${m}:${s}`;
}