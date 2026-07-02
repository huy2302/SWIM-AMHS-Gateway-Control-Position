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

const getSeverityIcon = (severity) => {
  switch (severity) {
    case "INFO":
      return <Info size={14} className="text-blue-600" />;
    case "WARN":
      return <TriangleAlert size={14} className="text-amber-600" />;
    case "ERROR":
      return <AlertCircle size={14} className="text-red-650" />;
    default:
      return <Info size={14} className="text-slate-500" />;
  }
};

const getSeverityItemStyles = (severity) => {
  switch (severity) {
    case "INFO":
      return {
        borderLeft: 'border-l-blue-500',
        bg: 'bg-blue-50/30 hover:bg-blue-100/30',
        color: 'text-blue-700'
      };
    case "WARN":
      return {
        borderLeft: 'border-l-amber-500',
        bg: 'bg-amber-50/30 hover:bg-amber-100/30',
        color: 'text-amber-800'
      };
    case "ERROR":
      return {
        borderLeft: 'border-l-red-500',
        bg: 'bg-red-50/30 hover:bg-red-100/30',
        color: 'text-red-700'
      };
    default:
      return {
        borderLeft: 'border-l-slate-400',
        bg: 'bg-slate-50/30 hover:bg-slate-100/30',
        color: 'text-slate-600'
      };
  }
};

const getSeverityBg = (severity) => {
  switch (severity) {
    case 'error':
      return 'bg-red-50 border-red-200';
    case 'warning':
      return 'bg-yellow-50 border-yellow-200';
    case 'success':
      return 'bg-green-50 border-green-200';
    case 'info':
    default:
      return 'bg-blue-50 border-blue-200';
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
      setNotifications(response?.histories?.content || []);
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
        <h2 className="text-[15px] font-bold text-slate-800 tracking-wide m-0 uppercase font-heading">{title}</h2>
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
            <div className="absolute right-0 mt-3 top-full w-[360px] bg-white/95 backdrop-blur-md border border-slate-200/85 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] z-50 overflow-hidden flex flex-col transition-all duration-300 transform scale-100 origin-top-right">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-800 tracking-tight">
                    {t("dashboard.notifications")}
                  </span>
                  {unreadCount > 0 && (
                    <span className="bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                      {unreadCount}
                    </span>
                  )}
                </div>
                {(unreadCount > 0 || notifications.some(n => !n.isRead)) && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50/50 hover:bg-blue-50/80 px-2.5 py-1 rounded-lg border border-blue-100/20 transition-all cursor-pointer"
                  >
                    <Check size={12} />
                    {t("dashboard.markAllRead")}
                  </button>
                )}
              </div>

              {/* List */}
              <div className="flex-1 p-2 max-h-[340px] overflow-y-auto notification-list-scroll py-2 bg-slate-50/20">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400">
                    <div className="w-5 h-5 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
                    <span className="text-[11px] font-medium">Loading...</span>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-1.5">
                    <Bell size={24} className="text-slate-300" />
                    <span className="text-[11px] font-medium">{t("dashboard.noNotify")}</span>
                  </div>
                ) : (
                  notifications.map((item) => 
                  {
                    const itemStyles = getSeverityItemStyles(item.severity);

                    return (
                      <div
                        onClick={() => handleMarkAsRead(item.id, item)}
                        className={`
                          flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all
                          hover:bg-gray-50 border border-transparent border-l-4 ${itemStyles.borderLeft} ${itemStyles.bg}
                          ${!item.isRead ? 'bg-blue-50/30 border-blue-200/50' : ''}
                        `}
                      >
                        {/* Left: Icon */}
                        <div className="flex-shrink-0 pt-0.5">
                          <div className={`
                            w-8 h-8 rounded-full flex items-center justify-center
                            ${getSeverityBg(item.severity)}
                          `}>
                            {getSeverityIcon(item.severity)}
                          </div>
                        </div>

                        {/* Right: Content */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-[13px] leading-relaxed ${
                            !item.isRead ? 'text-gray-900 font-semibold' : 'text-gray-600'
                          }`}>
                            {item.title}
                          </p>
                          
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-[11px] ${itemStyles.color} font-semibold`}>
                                {item.severity.toUpperCase()}
                              </span>
                              {!item.isRead && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-medium rounded-full">
                                  <Circle size={6} className="fill-blue-600" />
                                  New
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-gray-400 font-medium whitespace-nowrap">
                              {formatRelativeTime(item.eventTime, language)}
                            </span>
                          </div>
                          
                          {/* Hiển thị subtitle nếu có */}
                          {item.subtitle && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                      </div>  
                      )
                    })
                )}
              </div>

              {/* Footer */}
              <Link
                to="/system-events"
                onClick={() => setIsOpen(false)}
                className="w-full text-center py-3.5 text-xs text-blue-600 font-bold border-t border-slate-100 bg-slate-50/30 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 rounded-b-2xl"
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