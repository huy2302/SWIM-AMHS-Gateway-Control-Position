import {
  Monitor,
  Mail,
  Unplug,
  SettingsIcon,
  MonitorCog,
  Archive,
  TriangleAlert,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import ServerMonitor from "../components/ServerMonitor";
import { NavLink } from "react-router-dom";
import { LOG_TEMPLATES } from "../data/sampleData";

export default function Sidebar() {
  const [logs, setLogs] = useState([]);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      // Lấy ngẫu nhiên 1 mẫu log
      const randomIndex = Math.floor(Math.random() * LOG_TEMPLATES.length);
      const newLog = {
        ...LOG_TEMPLATES[randomIndex],
        timestamp: new Date().toLocaleTimeString(),
        id: Date.now(),
      };

      setLogs((prevLogs) => {
        const updatedLogs = [...prevLogs, newLog];
        // Chỉ giữ lại 50 dòng log mới nhất để tránh lag trình duyệt
        return updatedLogs.slice(-50);
      });
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
          title={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
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

      <nav className="space-y-1 w-full">
        <NavLink
          to="/monitor"
          className={({ isActive }) =>
            isActive ? "menu-item active" : "menu-item"
          }
          style={{ paddingLeft: collapsed ? "16px" : null }}
        >
          <Monitor size={18} />
          <span className={`menu-label ${collapsed ? "collapsed" : ""}`}>Monitor</span>
        </NavLink>

        <NavLink
          to="/accounts"
          className={({ isActive }) =>
            isActive ? "menu-item active" : "menu-item"
          }
          style={{ paddingLeft: collapsed ? "16px" : null }}
        >
          <Mail size={18} />
          <span className={`menu-label ${collapsed ? "collapsed" : ""}`}>Accounts</span>
        </NavLink>

        <NavLink
          to="/routing"
          className={({ isActive }) =>
            isActive ? "menu-item active" : "menu-item"
          }
          style={{ paddingLeft: collapsed ? "16px" : null }}
        >
          <Unplug size={18} />
          <span className={`menu-label ${collapsed ? "collapsed" : ""}`}>Routing</span>
        </NavLink>

        <NavLink
          to="/log"
          className={({ isActive }) =>
            isActive ? "menu-item active" : "menu-item"
          }
          style={{ paddingLeft: collapsed ? "16px" : null }}
        >
          <TriangleAlert size={18} />
          <span className={`menu-label ${collapsed ? "collapsed" : ""}`}>Logs</span>
        </NavLink>

        <NavLink
          to="/archive"
          className={({ isActive }) =>
            isActive ? "menu-item active" : "menu-item"
          }
          style={{ paddingLeft: collapsed ? "16px" : null }}
        >
          <Archive size={18} />
          <span className={`menu-label ${collapsed ? "collapsed" : ""}`}>Archive</span>
        </NavLink>

        <NavLink
          to="/admin"
          className={({ isActive }) =>
            isActive ? "menu-item active" : "menu-item"
          }
          style={{ paddingLeft: collapsed ? "16px" : null }}
        >
          <SettingsIcon size={18} />
          <span className={`menu-label ${collapsed ? "collapsed" : ""}`}>Admin</span>
        </NavLink>

        <NavLink
          to="/system"
          className={({ isActive }) =>
            isActive ? "menu-item active" : "menu-item"
          }
          style={{ paddingLeft: collapsed ? "16px" : null }}
        >
          <MonitorCog size={18} />
          <span className={`menu-label ${collapsed ? "collapsed" : ""}`}>System Monitor</span>
        </NavLink>
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
