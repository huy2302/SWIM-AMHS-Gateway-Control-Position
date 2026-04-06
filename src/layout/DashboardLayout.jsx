import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import "../styles/dashboard.css";
import Bottombar from "./Bottombar";

/**
 * DashboardLayout component that provides the main layout structure for the application.
 * Includes a sidebar for navigation, topbar for header, content area for main views, and bottombar.
 * @param {ReactNode} children - The child components to render in the content area.
 * @returns {JSX.Element} The layout wrapper with sidebar, topbar, content, and bottombar.
 */
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
