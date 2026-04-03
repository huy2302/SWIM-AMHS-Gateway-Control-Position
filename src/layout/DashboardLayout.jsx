import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "../styles/dashboard.css";
import Bottombar from "./Bottombar";

export default function DashboardLayout({ children }) {
  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <Topbar />
        <div className="content">{children}</div>
      <Bottombar />
      </div>
    </div>
  );
}