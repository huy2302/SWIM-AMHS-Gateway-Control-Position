import { useLocation } from 'react-router-dom';

const titleMap = {
  monitor: 'Gateway Monitor Dashboard',
  accounts: 'Accounts Management',
  routing: 'Routing Configuration',
  log: 'Live Logs',
  archive: 'Archive Viewer',
  admin: 'Admin Console',
  system: 'System Monitor',
};

export default function Topbar() {
  const location = useLocation();
  const pathKey = location.pathname.split('/')[1] || 'monitor';
  const title = titleMap[pathKey] || 'Gateway Monitor Dashboard';

  return (
    <div className="flex justify-between items-center pl-4 pr-4 pt-4">
      <h3>{title}</h3>
    </div>
  );
}