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
  Users,
  Settings,
  AlertCircle,
  MailWarning
} from "lucide-react";
import { useState } from "react";
import ServerMonitor from "@/components/ServerMonitor";
import { NavLink } from "react-router-dom";
import { t } from "@/i18n/translator";
import { useAuth } from "@/components/auth-context";

export default function Sidebar() {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const isAdmin = user?.role?.toLowerCase() === "admin";

  const toggleCollapsed = () => {
    setCollapsed((prev) => !prev);
  };

  return (
    <div
      className={`sidebar flex flex-col p-2 relative transition-all duration-300 ${collapsed ? "collapsed w-[70px]" : "w-[240px]"
        }`}
    >
      {/* Collapse Toggle Button */}
      <div className="absolute top-1/2 -right-3 flex flex-col items-center -translate-y-1/2 z-50">
        <button
          type="button"
          onClick={toggleCollapsed}
          className="p-1 bg-white border border-slate-200 shadow-sm rounded-full cursor-pointer text-slate-600 hover:bg-slate-50 transition-colors"
          title={collapsed ? t("sidebar.toggle.expand") : t("sidebar.toggle.collapse")}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Brand Header */}
      <div className={`flex items-center gap-2 p-1.5 ${collapsed ? "justify-center" : ""}`}>
        <img className="w-[36px] min-w-[36px] h-[36px] object-contain" src="/bg2.webp" alt="Logo" />
        {!collapsed && (
          <span className="sidebar-title font-extrabold text-[13px] leading-tight text-slate-800 tracking-wide">
            AMHS SWIM <br />
            <span className="text-blue-600 font-bold text-[11px]">Control Position</span>
          </span>
        )}
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 w-full space-y-1.5 overflow-y-auto px-1 custom-scrollbar">

        {/* GROUP 1: GIÁM SÁT & VẬN HÀNH */}
        <div className="space-y-1">
          {!collapsed && (
            <div className="text-[10px] font-extrabold text-slate-400 tracking-wider px-3 mb-1">
              {t("sidebar.sections.monitoring")}
            </div>
          )}
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              isActive ? "menu-item active" : "menu-item"
            }
            title={collapsed ? t("sidebar.menu.monitor") : ""}
          >
            <Monitor size={17} />
            <span className={`menu-label ${collapsed ? "collapsed" : ""}`}>
              {t("sidebar.menu.monitor")}
            </span>
          </NavLink>

          <NavLink
            to="/system"
            className={({ isActive }) =>
              isActive ? "menu-item active" : "menu-item"
            }
            title={collapsed ? t("sidebar.menu.systemMonitor") : ""}
          >
            <MonitorCog size={17} />
            <span className={`menu-label ${collapsed ? "collapsed" : ""}`}>
              {t("sidebar.menu.systemMonitor")}
            </span>
          </NavLink>

          <NavLink
            to="/alerts"
            className={({ isActive }) =>
              isActive ? "menu-item active" : "menu-item"
            }
            title={collapsed ? t("sidebar.menu.alerts") : ""}
          >
            <AlertCircle size={17} />
            <span className={`menu-label ${collapsed ? "collapsed" : ""}`}>
              {t("sidebar.menu.alerts")}
            </span>
          </NavLink>
        </div>

        {/* GROUP 2: ĐIỆN VĂN & ĐỊNH TUYẾN */}
        <div className="space-y-1 pt-0 border-t border-slate-100">
          {!collapsed && (
            <div className="text-[10px] font-extrabold text-slate-400 tracking-wider px-3 mb-1">
              {t("sidebar.sections.traffic")}
            </div>
          )}
          <NavLink
            to="/messages"
            className={({ isActive }) =>
              isActive ? "menu-item active" : "menu-item"
            }
            title={collapsed ? t("sidebar.menu.messages") : ""}
          >
            <Archive size={17} />
            <span className={`menu-label ${collapsed ? "collapsed" : ""}`}>
              {t("sidebar.menu.messages")}
            </span>
          </NavLink>

          <NavLink
            to="/unrouted"
            className={({ isActive }) =>
              isActive ? "menu-item active" : "menu-item"
            }
            title={collapsed ? t("sidebar.menu.unrouted") : ""}
          >
            <Unplug size={17} />
            <span className={`menu-label ${collapsed ? "collapsed" : ""}`}>
              {t("sidebar.menu.unrouted")}
            </span>
          </NavLink>

          <NavLink
            to="/control-traffic"
            className={({ isActive }) =>
              isActive ? "menu-item active" : "menu-item"
            }
            title={collapsed ? t("sidebar.menu.controlTraffic") : ""}
          >
            <MailWarning size={17} />
            <span className={`menu-label `}>
              {t("sidebar.menu.controlTraffic")}
            </span>
          </NavLink>

          <NavLink
            to="/routing"
            className={({ isActive }) =>
              isActive ? "menu-item active" : "menu-item"
            }
            title={collapsed ? t("sidebar.menu.routing") : ""}
          >
            <Settings size={17} />
            <span className={`menu-label ${collapsed ? "collapsed" : ""}`}>
              {t("sidebar.menu.routing")}
            </span>
          </NavLink>
        </div>

        {/* GROUP 3: NHẬT KÝ & LỊCH SỬ */}
        <div className="space-y-1 pt-1 border-t border-slate-100">
          {!collapsed && (
            <div className="text-[10px] font-extrabold text-slate-400 tracking-wider px-3 mb-1">
              {t("sidebar.sections.logs")}
            </div>
          )}
          <NavLink
            to="/log"
            className={({ isActive }) =>
              isActive ? "menu-item active" : "menu-item"
            }
            title={collapsed ? t("sidebar.menu.logs") : ""}
          >
            <TriangleAlert size={17} />
            <span className={`menu-label ${collapsed ? "collapsed" : ""}`}>
              {t("sidebar.menu.logs")}
            </span>
          </NavLink>

          <NavLink
            to="/system-events"
            className={({ isActive }) =>
              isActive ? "menu-item active" : "menu-item"
            }
            title={collapsed ? t("sidebar.menu.systemHistory") : ""}
          >
            <History size={17} />
            <span className={`menu-label ${collapsed ? "collapsed" : ""}`}>
              {t("sidebar.menu.systemHistory")}
            </span>
          </NavLink>
        </div>

        {/* GROUP 4: QUẢN TRỊ & CẤU HÌNH */}
        <div className="space-y-1 pt-1 border-t border-slate-100">
          {!collapsed && (
            <div className="text-[10px] font-extrabold text-slate-400 tracking-wider px-3 mb-1">
              {t("sidebar.sections.admin")}
            </div>
          )}

          <NavLink
            to="/accounts"
            className={({ isActive }) =>
              isActive ? "menu-item active" : "menu-item"
            }
            title={collapsed ? t("sidebar.menu.accounts") : ""}
          >
            <Mail size={17} />
            <span className={`menu-label ${collapsed ? "collapsed" : ""}`}>
              {t("sidebar.menu.accounts")}
            </span>
          </NavLink>

          {isAdmin && (
            <NavLink
              to="/users"
              className={({ isActive }) =>
                isActive ? "menu-item active" : "menu-item"
              }
              title={collapsed ? t("sidebar.menu.users") : ""}
            >
              <Users size={17} />
              <span className={`menu-label ${collapsed ? "collapsed" : ""}`}>
                {t("sidebar.menu.users")}
              </span>
            </NavLink>
          )}

          {isAdmin && (
            <NavLink
              to="/config"
              className={({ isActive }) =>
                isActive ? "menu-item active" : "menu-item"
              }
              title={collapsed ? t("sidebar.menu.admin") : ""}
            >
              <Settings size={17} />
              <span className={`menu-label ${collapsed ? "collapsed" : ""}`}>
                {t("sidebar.menu.admin")}
              </span>
            </NavLink>
          )}
        </div>
        {/* Collapsible server resource monitor widget inside scrollable area */}
        <div className={`sidebar-extra border-t border-slate-100 ${collapsed ? "collapsed opacity-0 max-h-0 overflow-hidden" : "opacity-100"}`}>
          <ServerMonitor />
        </div>
      </nav>
    </div>
  );
}