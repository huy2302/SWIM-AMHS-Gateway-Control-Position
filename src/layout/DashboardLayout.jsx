import Sidebar from "./Sidebar/Sidebar";
import Topbar from "./Topbar";
import "../styles/dashboard.css";
import Bottombar from "./Bottombar";
import GlobalSystemFetcher from "./GlobalSystemFetcher";
import { Toaster } from 'react-hot-toast';

/**
 * DashboardLayout component that provides the main layout structure for the application.
 * Includes a sidebar for navigation, topbar for header, content area for main views, and bottombar.
 * @param {ReactNode} children - The child components to render in the content area.
 * @returns {JSX.Element} The layout wrapper with sidebar, topbar, content, and bottombar.
 */
export default function DashboardLayout({ children }) {

  return (
    <div className="app">
      <GlobalSystemFetcher />
      <Toaster 
        position="top-right"
        gutter={10}
        toastOptions={{
          duration: 4000,
          style: {
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
            background: '#ffffff',
            color: '#0f172a',
            fontSize: '13px',
            fontWeight: '600',
            borderRadius: '12px',
            padding: '10px 14px',
            boxShadow: '0 12px 30px -6px rgba(15, 23, 42, 0.12), 0 4px 6px -2px rgba(15, 23, 42, 0.04)',
            border: '1px solid #e2e8f0',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#ffffff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#ffffff' },
            duration: 5000,
          },
          loading: {
            iconTheme: { primary: '#3b82f6', secondary: '#ffffff' },
          },
        }}
      />
      <Sidebar />
      <div className="main">
        <Topbar />
        <div className="content">{children}</div>
        <Bottombar />
      </div>
    </div>
  );
}
