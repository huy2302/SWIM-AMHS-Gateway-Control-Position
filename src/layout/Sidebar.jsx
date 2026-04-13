import {
  LayoutDashboard,
  Settings,
  FileText,
  AlertTriangle,
  Monitor,
  Mail,
  RouterIcon,
  Logs,
  SettingsIcon,
  MonitorCog,
  Archive,
} from "lucide-react";
import { useState, useEffect } from "react";
import LogConsole from "../components/LogConsole";
import ServerMonitor from "../components/ServerMonitor";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
} from "react-router-dom";
import { LOG_TEMPLATES } from "../data/sampleData";

export default function Sidebar() {
  const [logs, setLogs] = useState([]);

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

  return (
    <div className="sidebar flex flex-col justify-between">
      <div>
        <h2 className="logo" style={{color: '#000000'}}>
          {/* <span style={{color: '#ff0000'}}>A</span>
          <span style={{color: '#009fde'}}>TTECH</span> */}
          AMHS SWIM Gateway
        </h2>

        <nav>
          <NavLink
            to="/monitor"
            className={({ isActive }) =>
              isActive ? "menu-item active" : "menu-item"
            }
          >
            <Monitor size={18} /> Monitor
          </NavLink>

          <NavLink
            to="/accounts"
            className={({ isActive }) =>
              isActive ? "menu-item active" : "menu-item"
            }
          >
            <Mail size={18} /> Accounts
          </NavLink>

          <NavLink
            to="/routing"
            className={({ isActive }) =>
              isActive ? "menu-item active" : "menu-item"
            }
          >
            <RouterIcon size={18} /> Routing
          </NavLink>

          <NavLink
            to="/log"
            className={({ isActive }) =>
              isActive ? "menu-item active" : "menu-item"
            }
          >
            <Logs size={18} /> Log
          </NavLink>

          <NavLink
            to="/archive"
            className={({ isActive }) =>
              isActive ? "menu-item active" : "menu-item"
            }
          >
            <Archive size={18} /> Archive
          </NavLink>

          <NavLink
            to="/admin"
            className={({ isActive }) =>
              isActive ? "menu-item active" : "menu-item"
            }
          >
            <SettingsIcon size={18} /> Admin
          </NavLink>

          <NavLink
            to="/system"
            className={({ isActive }) =>
              isActive ? "menu-item active" : "menu-item"
            }
          >
            <MonitorCog size={18} /> System Monitor
          </NavLink>
        </nav>
      </div>
      <div>
        <div className="h-56 mt-4">
          <LogConsole logs={logs} />
        </div>

        <div className="mt-4">
          <ServerMonitor />
        </div>
      </div>
    </div>
  );
}
