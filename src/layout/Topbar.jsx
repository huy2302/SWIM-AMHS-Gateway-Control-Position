import { useLocation } from "react-router-dom";

const titleMap = {
  monitor: "Gateway Monitor Dashboard",
  accounts: "Accounts Management",
  routing: "Routing Configuration",
  log: "Live Logs",
  archive: "Archive Viewer",
  admin: "Admin Console",
  system: "System Monitor",
};

const statusTags = {
  monitor: [
    { label: "System Healthy", tone: "success" },
    { label: "All systems are operating normally", tone: "muted" },
  ],
}

export default function Topbar() {
  const location = useLocation();
  const pathKey = location.pathname.split("/")[1] || "monitor";
  const title = titleMap[pathKey] || "Gateway Monitor Dashboard";
  const statusTag = statusTags.monitor[1].label;

  return (
    <div className="flex flex-col justify-between pl-4 pr-4 pt-4">
      <h3 className="text-[24px] mb-2 font-bold">{title}</h3>
      <span className="text-sm text-muted-foreground">{statusTag}</span>
    </div>
  );
}
