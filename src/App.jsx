import React from "react";
import Account from "./pages/Account/Account";
import Dashboard from "./pages/Dashboard/Dashboard";
import RoutingView from "./pages/Routing/Routing";
import FullLogView from "./pages/Log/FullLogView";
import MessageView from "./pages/Message/MessageView";
import AdminView from "./pages/AdminView";
import SystemMonitorView from "./pages/System/SystemMonitorView";
import Login from "./components/Login";
// import NewGatewayDashboard from "./pages/NewGatewayDashboard";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { AuthProvider } from "./components/AuthContext";
import SystemEvents from "./pages/SystemEventsView";
import { authApi } from "./api/authApi";
import LoginPage from "./pages/Login/LoginPage";

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
            <Route index element={<Navigate to="/monitor" replace />} />
            <Route path="monitor" element={<Dashboard />} />
            <Route path="dashboard" element={<Navigate to="/monitor" replace />} />
            <Route path="accounts" element={<Account />} />
            <Route path="routing" element={<RoutingView />} />
            <Route path="log" element={<FullLogView />} />
            <Route path="messages" element={<MessageView />} />
            <Route path="admin" element={<AdminView />} />
            <Route path="system" element={<SystemMonitorView />} />
            <Route path="system-events" element={<SystemEvents />} />
            <Route path="login1" element={<LoginPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
