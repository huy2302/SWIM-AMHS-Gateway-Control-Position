import {
  Monitor,
  Mail,
  Unplug,
  MonitorCog,
  Archive,
  TriangleAlert,
  ChevronLeft,
  ChevronRight,
  History,
} from "lucide-react";
import { useState, useEffect } from "react";
import ServerMonitor from "@/components/ServerMonitor";
import { NavLink } from "react-router-dom";
import { LOG_TEMPLATES } from "@/data/sampleData";
// import { useSystemStore } from '@/hooks/systemStore';
import { t } from "@/i18n/translator";

export default function Sidebar() {
  const [logs, setLogs] = useState([]);
  const [collapsed, setCollapsed] = useState(false);

  // const unreadCount = useSystemStore((state) => state.unreadCount);

  useEffect(() => {
    const interval = setInterval(() => {
      // Lấy ngẫu nhiên 1 mẫu log
      const randomIndex = Math.floor(Math.random() * LOG_TEMPLATES.length);
      const newLog = {
        ...LOG_TEMPLATES[randomIndex],
        timestamp: new Date().toLocaleTimeString(),
        id: Date.now(),
      };

      // setLogs((prevLogs) => {
      //   const updatedLogs = [...prevLogs, newLog];
      //   // Chỉ giữ lại 50 dòng log mới nhất để tránh lag trình duyệt
      //   return updatedLogs.slice(-50);
      // });
    }, 2000); // Cứ mỗi 2 giây bắn 1 log mới

    return () => clearInterval(interval);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => !prev);
  };

  return (
    <div
      className={`sidebar flex flex-col p-2 relative transition-all duration-300 ${
        collapsed ? "collapsed w-[70px]" : "w-[220px]"
      }`}
    >
      <div className="absolute top-1/2 -right-3 flex flex-col items-center -translate-y-1/2">
        <button
          type="button"
          onClick={toggleCollapsed}
          className="p-1 bg-[#ccc] rounded-full cursor-pointer text-[#1f2937] hover:bg-slate-300 transition-colors"
          title={collapsed ? t("sidebar.toggle.expand") : t("sidebar.toggle.collapse")}
        >
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </button>
      </div>

      <div className={`flex items-center gap-2 mb-4 ${collapsed ? "justify-center" : ""}`}>
        <img className="w-[60px] min-w-[60px]" src="/public/bg2.webp" alt="Logo" />
        <span className={`sidebar-title ${collapsed ? "collapsed" : ""}`}>
          AMHS SWIM <br /> Gateway
        </span>
      </div>

      <nav className="space-y-1 w-full divide-y divide-gray-400/40">
        <NavLink
          to="/monitor"
          className={({ isActive }) =>
            isActive ? "menu-item active" : "menu-item"
          }
          style={{ paddingLeft: collapsed ? "16px" : null }}
        >
          <Monitor size={18} />
          <span className={`menu-label ${collapsed ? "collapsed" : ""}`}>
            {t("sidebar.menu.monitor")}
          </span>
        </NavLink>

        <NavLink
          to="/accounts"
          className={({ isActive }) =>
            isActive ? "menu-item active" : "menu-item"
          }
          style={{ paddingLeft: collapsed ? "16px" : null }}
        >
          <Mail size={18} />
          <span className={`menu-label ${collapsed ? "collapsed" : ""}`}>
            {t("sidebar.menu.accounts")}
          </span>
        </NavLink>

        <NavLink
          to="/routing"
          className={({ isActive }) =>
            isActive ? "menu-item active" : "menu-item"
          }
          style={{ paddingLeft: collapsed ? "16px" : null }}
        >
          <Unplug size={18} />
          <span className={`menu-label ${collapsed ? "collapsed" : ""}`}>
            {t("sidebar.menu.routing")}
          </span>
        </NavLink>

        <NavLink
          to="/log"
          className={({ isActive }) =>
            isActive ? "menu-item active" : "menu-item"
          }
          style={{ paddingLeft: collapsed ? "16px" : null }}
        >
          <TriangleAlert size={18} />
          <span className={`menu-label ${collapsed ? "collapsed" : ""}`}>
            {t("sidebar.menu.logs")}
          </span>
        </NavLink>

        <NavLink
          to="/messages"
          className={({ isActive }) =>
            isActive ? "menu-item active" : "menu-item"
          }
          style={{ paddingLeft: collapsed ? "16px" : null }}
        >
          <Archive size={18} />
          <span className={`menu-label ${collapsed ? "collapsed" : ""}`}>
            {t("sidebar.menu.messages")}
          </span>
        </NavLink>

        <NavLink
          to="/system"
          className={({ isActive }) =>
            isActive ? "menu-item active" : "menu-item"
          }
          style={{ paddingLeft: collapsed ? "16px" : null }}
        >
          <MonitorCog size={18} />
          <span className={`menu-label ${collapsed ? "collapsed" : ""}`}>
            {t("sidebar.menu.systemMonitor")}
          </span>
        </NavLink>

        {/* <NavLink
          to="/system-events"
          className={({ isActive }) =>
            isActive ? "menu-item active" : "menu-item"
          }
          style={{ paddingLeft: collapsed ? "16px" : null, position: "relative" }}
        >
          <div className="absolute w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center top-[-9px] right-[-9px]"> */}
            {/* Vòng tròn hiệu ứng sóng lan tỏa ra ngoài */}
            {
              // unreadCount > 0 ? 
              // (<span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping"></span>)
              // :
              // null
            }
            
            {/* Số thông báo chính đứng yên ở trên */}
            {/* <span className="relative text-[11px] font-bold leading-none">{unreadCount || 0}</span>
          </div>
          <History size={18} />
          <span className={`menu-label ${collapsed ? "collapsed" : ""}`}>
            {t("sidebar.menu.systemHistory")}
          </span>
        </NavLink> */}
      </nav>

      <div className={`sidebar-extra ${collapsed ? "collapsed" : ""}`}>
        {/* <div className="h-56 mt-4">
          <LogConsole logs={logs} />
        </div> */}

        <ServerMonitor />
      </div>
    </div>
  );
}