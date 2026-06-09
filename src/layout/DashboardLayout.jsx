import Sidebar from "./Sidebar";
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
        toastOptions={{
          duration: 4000,
          style: {
            background: '#FFFFFF',
            color: '#000',
            borderRadius: '12px',
            padding: '12px 16px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
            duration: 5000,
          },
          loading: {
            iconTheme: { primary: '#3b82f6', secondary: '#fff' },
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
