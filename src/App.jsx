import Account from "./pages/Account";
import Dashboard from "./pages/Dashboard";
import RoutingView from "./pages/Routing";
import FullLogView from "./pages/FullLogView";
import ArchiveView from "./pages/ArchiveView";
import AdminView from "./pages/AdminView";
import SystemMonitorView from "./pages/SystemMonitorView";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Route cha sử dụng Layout */}
        <Route index element={<Navigate to="/monitor" replace />} />
        <Route path="monitor" element={<Dashboard />} />
        <Route path="accounts" element={<Account />} />
        <Route path="routing" element={<RoutingView />} />
        <Route path="log" element={<FullLogView />} />
        <Route path="archive" element={<ArchiveView />} />
        <Route path="admin" element={<AdminView />} />
        <Route path="system" element={<SystemMonitorView />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;