import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { UserRound } from "lucide-react";
import UserMenu from "../components/UserMenu";

const titleMap = {
  monitor: "Gateway Monitor Dashboard",
  accounts: "Accounts Management",
  routing: "Routing Configuration",
  log: "Live Logs",
  messages: "Message Infomation",
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
  const { uptime } = useSelector((state) => state.system);

  return (
    <div className="flex justify-between items-center">
      <div className="flex flex-col justify-between pl-4 pr-4 pt-4">
        <h3 className="text-[24px] mb-2 font-bold">{title}</h3>
        <span className="text-sm text-muted-foreground">{statusTag}</span>
       </div>

      <div>
        Up time: <span className="time">{formatUptime(uptime)}</span>
      </div>

      <div className="mr-4">
        {/* <UserRound /> */}
        <UserMenu />
      </div>
    </div>
  );
}

const formatUptime = (seconds) => {
  if (!seconds && seconds !== 0) return "0:00:00:00";

  const days = Math.floor(seconds / 86400);
  seconds %= 86400;

  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;

  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  // padStart để luôn có 2 chữ số
  const h = String(hours).padStart(2, "0");
  const m = String(minutes).padStart(2, "0");
  const s = String(secs).padStart(2, "0");

  return `${days}:${h}:${m}:${s}`;
}