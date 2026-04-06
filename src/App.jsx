import Account from "./pages/Account";
import Dashboard from "./pages/Dashboard";
import RoutingView from "./pages/Routing";
import FullLogView from "./pages/FullLogView";
import ArchiveView from "./pages/ArchiveView";
import AdminView from "./pages/AdminView";
import SystemMonitorView from "./pages/SystemMonitorView";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

/**
 * Main App component that sets up routing for the Swim Monitor application.
 * Uses React Router to define routes for different views like Dashboard, Accounts, etc.
 * @returns {JSX.Element} The root component with routing configuration.
 */
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default route redirects to monitor dashboard */}
        <Route index element={<Navigate to="/monitor" replace />} />
        {/* Dashboard view for system monitoring */}
        <Route path="monitor" element={<Dashboard />} />
        {/* Account management view */}
        <Route path="accounts" element={<Account />} />
        {/* Routing configuration view */}
        <Route path="routing" element={<RoutingView />} />
        {/* Full log view for detailed logging */}
        <Route path="log" element={<FullLogView />} />
        {/* Archive view for historical data */}
        <Route path="archive" element={<ArchiveView />} />
        {/* Admin panel for system administration */}
        <Route path="admin" element={<AdminView />} />
        {/* System monitor view for detailed system stats */}
        <Route path="system" element={<SystemMonitorView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
