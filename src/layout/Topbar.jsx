import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

import { useSelector } from "react-redux";
import { Bell, History, Check, ChevronRight, Clock, Info, TriangleAlert, AlertCircle, CheckCircle, Circle } from "lucide-react";
import UserMenu from "../components/UserMenu";
import { useSystemStore } from '@/hooks/systemStore';
import { t } from "@/i18n/translator";
import { Link } from "react-router-dom";
import gatewayApi from "../api/gatewayApi";

const titleMap = {
  dashboard: "sidebar.menu.monitor",
  monitor: "sidebar.menu.monitor",
  accounts: "sidebar.menu.accounts",
  routing: "sidebar.menu.routing",
  log: "sidebar.menu.logs",
  messages: "sidebar.menu.messages",
  system: "sidebar.menu.systemMonitor",
  unrouted: "sidebar.menu.unrouted",
  alerts: "sidebar.menu.alerts",
  "system-events": "sidebar.menu.systemHistory",
  users: "sidebar.menu.users",
  config: "sidebar.menu.admin",
};

const getSeverityMeta = (severity) => {
  switch (severity?.toUpperCase()) {
    case "INFO":
      return "bg-emerald-50 text-emerald-700 border-emerald-200/70";
    case "WARN":
    case "WARNING":
      return "bg-amber-50 text-amber-700 border-amber-200/70";
    case "ERROR":
      return "bg-rose-50 text-rose-700 border-rose-200/70";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
};

const formatRelativeTime = (timeString, lang) => {
  if (!timeString) return "";
  
  const date = new Date(timeString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  // Kiểm tra date hợp lệ
  if (isNaN(date.getTime())) return "";

  // Vừa xong (dưới 1 phút)
  if (diffMins < 1) {
    return lang === "vi" ? "Vừa xong" : "Just now";
  }

  // Vài phút trước (dưới 1 giờ)
  if (diffMins < 60) {
    return lang === "vi" ? `${diffMins} phút trước` : `${diffMins}m ago`;
  }

  // Hôm nay (dưới 24h và cùng ngày)
  if (diffHours < 24 && date.getDate() === now.getDate()) {
    const timeStr = date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false 
    });
    return lang === "vi" ? `Hôm nay lúc ${timeStr}` : `Today at ${timeStr}`;
  }

  // Hôm qua
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.getDate() === yesterday.getDate() && 
      date.getMonth() === yesterday.getMonth() && 
      date.getFullYear() === yesterday.getFullYear()) {
    const timeStr = date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false 
    });
    return lang === "vi" ? `Hôm qua lúc ${timeStr}` : `Yesterday at ${timeStr}`;
  }

  // Trong tuần (cách đây < 7 ngày)
  if (diffDays < 7) {
    const options = { weekday: 'short' };
    const dayName = date.toLocaleDateString(lang === "vi" ? "vi-VN" : "en-US", options);
    const timeStr = date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false 
    });
    return lang === "vi" ? `${dayName} lúc ${timeStr}` : `${dayName} at ${timeStr}`;
  }

  // Cũ hơn: hiển thị ngày tháng
  const options = { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false 
  };

  console.log(date.toLocaleString(lang === "vi" ? "vi-VN" : "en-US", options))
  return date.toLocaleString(lang === "vi" ? "vi-VN" : "en-US", options);
};

export default function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const pathKey = location.pathname.split("/")[1] || "dashboard";
  const titleKey = titleMap[pathKey];
  const title = titleKey ? t(titleKey) : "Gateway Monitor";
  const { uptime } = useSelector((state) => state.system);

  const unreadCount = useSystemStore((state) => state.unreadCount);
  
  const [language, setLanguage] = useState(
    localStorage.getItem("language") || "en"
  );

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem('user'));

  const handleChangeLanguage = (e) => {
    const lang = e.target.value;
    localStorage.setItem("language", lang);
    setLanguage(lang);
    window.location.reload();
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await gatewayApi.getSystemEventsByUser({
        page: 0,
        size: 5,
        userId: user?.userId || null,
      });
      setNotifications(response?.histories?.items || response?.histories?.content || []);
    } catch (error) {
      console.error("Load system events in Topbar failed", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest(".notification-popover-container")) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleMarkAsRead = async (id, item) => {
    if (!item.isRead) {
      setNotifications((prev) =>
        prev.map((notif) => (notif.id === id ? { ...notif, isRead: true } : notif))
      );

      const setSystemData = useSystemStore.getState().setSystemData;
      if (unreadCount > 0) {
        setSystemData(unreadCount - 1);
      }

      try {
        await gatewayApi.postReadNotify(user?.userId || null, id);
      } catch (error) {
        console.error("Error marking notification as read in Topbar:", error);
      }
    }

    // điều hướng đến đúng page dựa theo status của thông báo
    // setIsOpen(false);

    // if (item.eventType?.startsWith("ROUTING")) {
    //   navigate("/routing");
    // } else if (
    //   item.eventType === "HIGH_CPU" ||
    //   item.eventType === "HIGH_MEMORY" ||
    //   item.eventType === "APPLICATION_START" ||
    //   item.eventType === "APPLICATION_STOP"
    // ) {
    //   navigate("/system");
    // } else {
    //   navigate("/system-events");
    // }
  };

  const handleMarkAllAsRead = async () => {
    const hasUnread = notifications.some((n) => !n.isRead);
    if (!hasUnread && unreadCount === 0) return;

    setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })));

    const setSystemData = useSystemStore.getState().setSystemData;
    setSystemData(0);

    try {
      await gatewayApi.postReadAllNotify(user?.userId || null);
    } catch (error) {
      console.error("Error marking all notifications as read in Topbar:", error);
    }
  };

  return (
    <div className="topbar w-full flex justify-between items-center">
      {/* Title block */}
      <div className="flex flex-col justify-center">
        <h2 className="text-[15px] font-bold text-slate-800 tracking-wide m-0 font-heading">{title}</h2>
      </div>

      {/* Uptime and info */}
      <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 font-medium bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
        <Clock size={13} className="text-slate-400" />
        <span>{t("dashboard.uptime")}:</span>
        <span className="font-mono text-slate-700 font-bold">{formatUptime(uptime)}</span>
      </div>

      <div className="flex items-center gap-4">
        {/* Language select selector */}
        <div className="relative">
          <select 
            value={language} 
            onChange={handleChangeLanguage}
            className="text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-1.5 outline-none cursor-pointer transition-colors"
          >
            <option value="en">English</option>
            <option value="vi">Tiếng Việt</option>
          </select>
        </div>

        {/* Notification Bell with Dropdown */}
        <div className="relative notification-popover-container flex items-center">
          <style>{`
            .notification-list-scroll::-webkit-scrollbar {
              width: 5px;
            }
            .notification-list-scroll::-webkit-scrollbar-track {
              background: transparent;
            }
            .notification-list-scroll::-webkit-scrollbar-thumb {
              background: rgba(148, 163, 184, 0.25);
              border-radius: 99px;
            }
            .notification-list-scroll::-webkit-scrollbar-thumb:hover {
              background: rgba(148, 163, 184, 0.4);
            }
          `}</style>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="relative flex items-center justify-center p-2.5 rounded-full hover:bg-slate-100/80 active:scale-95 transition-all duration-205 focus:outline-none"
            aria-label="Toggle notifications"
          >
            <Bell size={20} className="text-slate-650 hover:text-slate-850 transition-colors" />
            {unreadCount > 0 && (
              <div className="absolute w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center top-[4px] right-[4px] ring-2 ring-white">
                <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
                <span className="relative text-[9px] font-bold leading-none">
                  {unreadCount || 0}
                </span>
              </div>
            )}
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2.5 top-full w-[380px] bg-white border border-slate-200/90 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col transition-all duration-150">
              {/* Header */}
              <div className="flex items-center justify-between gap-2 px-4 py-3 bg-slate-50/90 border-b border-slate-200/80">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-700 truncate">
                    {t("dashboard.notifications")}
                  </span>
                  {unreadCount > 0 && (
                    <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0">
                      {unreadCount}
                    </span>
                  )}
                </div>
                {(unreadCount > 0 || notifications.some(n => !n.isRead)) && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Check size={13} />
                    {t("dashboard.markAllRead")}
                  </button>
                )}
              </div>

              {/* List */}
              <div className="flex-1 max-h-[360px] overflow-y-auto notification-list-scroll divide-y divide-slate-100 bg-white">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-400">
                    <div className="w-5 h-5 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
                    <span className="text-[11px] font-medium">Loading...</span>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-1.5">
                    <Bell size={22} className="text-slate-300" />
                    <span className="text-[11px] font-medium">{t("dashboard.noNotify")}</span>
                  </div>
                ) : (
                  notifications.map((item) => 
                  {
                    const badgeStyle = getSeverityMeta(item.severity);

                    return (
                      <div
                        key={item.id || item.eventTime}
                        onClick={() => handleMarkAsRead(item.id, item)}
                        className={`
                          px-4 py-3 cursor-pointer transition-colors flex flex-col gap-1.5
                          ${!item.isRead ? 'bg-slate-50/80 hover:bg-slate-100/70' : 'bg-white hover:bg-slate-50/60'}
                        `}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${badgeStyle}`}>
                            {item.severity}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">
                            {formatRelativeTime(item.eventTime, language)}
                          </span>
                        </div>

                        <p className={`text-[13px] leading-snug ${
                          !item.isRead ? 'text-slate-900 font-semibold' : 'text-slate-700 font-medium'
                        }`}>
                          {item.title}
                        </p>
                        
                        {item.subtitle && (
                          <p className="text-xs text-slate-500 leading-normal">
                            {item.subtitle}
                          </p>
                        )}
                      </div>  
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <Link
                to="/system-events"
                onClick={() => setIsOpen(false)}
                className="w-full text-center py-2.5 text-xs font-semibold text-slate-600 hover:text-blue-600 border-t border-slate-100 bg-slate-50/50 hover:bg-slate-100/60 transition-colors flex items-center justify-center gap-1 rounded-b-xl"
              >
                {t("dashboard.seeAllHistory")}
                <ChevronRight size={14} />
              </Link>
            </div>
          )}
        </div>

        {/* User profile Menu */}
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