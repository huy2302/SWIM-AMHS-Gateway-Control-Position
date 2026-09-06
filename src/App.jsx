import React from "react";
import Account from "./pages/Account/Account";
import Dashboard from "./pages/Dashboard/Dashboard";
import RoutingView from "./pages/Routing/Routing";
import FullLogView from "./pages/Log/FullLogView";
import MessageView from "./pages/Message/MessageView";
import ConfigView from "./pages/Config/ConfigView";
import SystemMonitorView from "./pages/System/SystemMonitorView";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./components/AuthContext";
import SystemEvents from "./pages/SystemEvents/SystemEventsView";
import { authApi } from "./api/authApi";
import LoginPage from "./pages/Login/LoginPage";
import UserManagement from "./pages/User/UserManagement";
import UnroutedQueue from "./pages/Unrouted/UnroutedQueue";
import AlertsView from "./pages/Alerts/AlertsView";
import ControlTrafficView from "./pages/ControlTraffic/ControlTrafficView";
import Settings from "./pages/Settings/Settings";

/**
 * Main App component that sets up routing for the Swim Monitor application.
 * Uses React Router to define routes for different views like Dashboard, Accounts, etc.
 * @returns {JSX.Element} The root component with routing configuration.
 */
function RequireAuth() {
  const location = useLocation();

  if (!authApi.isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

// Chặn truy cập trực tiếp URL vào các trang chỉ dành cho admin (khớp với việc ẩn menu
// trong Sidebar), tránh viewer vẫn vào được UI dù API sẽ trả 403.
function RequireAdmin() {
  const { isAdmin } = useAuth();

  if (!isAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

function SessionWatcher() {
  const navigate = useNavigate();

  React.useEffect(() => {
    const interval = setInterval(() => {
      if (!authApi.isAuthenticated()) {
        navigate("/login", { replace: true });
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [navigate]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SessionWatcher />
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<RequireAuth />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="monitor" element={<Navigate to="/dashboard" replace />} />
            <Route path="accounts" element={<Account />} />
            <Route path="routing" element={<RoutingView />} />
            <Route path="log" element={<FullLogView />} />
            <Route path="messages" element={<MessageView />} />
            <Route path="system" element={<SystemMonitorView />} />
            <Route path="system-events" element={<SystemEvents />} />
            <Route path="unrouted" element={<UnroutedQueue />} />
            <Route path="alerts" element={<AlertsView />} />
            <Route path="control-traffic" element={<ControlTrafficView />} />
            <Route path="settings" element={<Settings />} />

            <Route element={<RequireAdmin />}>
              <Route path="users" element={<UserManagement />} />
              <Route path="config" element={<ConfigView />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
