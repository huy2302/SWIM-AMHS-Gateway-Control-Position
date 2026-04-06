import StatCard from "./StatCard";

export default function StatGrid() {
  return (
    <div className="statGrid">
      <StatCard
        title="Tổng tin nhắn (24h)"
        value="15,420"
        color="#27ae60"
        type="acp"
      />
      <StatCard
        title="Mapping thất bại (Failed)"
        value="12"
        color="#e74c3c"
        type="err"
      />
      <StatCard
        title="Độ trễ trung bình (Latency)"
        value="450ms"
        color="#f1c40f"
        type="wrn"
      />
      <StatCard
        title="Tin nhắn ưu tiên (VIP/Cargo)"
        value="85"
        color="#3498db"
        type="wrn"
      />
      <StatCard title="Queued Messages" value="83" color="#95a5a6" type="def" />
      <StatCard title="Queued Messages" value="11" color="#95a5a6" type="def" />
    </div>
  );
}
