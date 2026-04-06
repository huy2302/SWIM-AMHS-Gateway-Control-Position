export default function StatCard({ title, value, color, type }) {
  return (
    <div className="statCard" style={{ borderLeft: `6px solid ${color}` }}>
      <div className={`statTitle`}>{title}</div>
      <div className={`statValue ${type}`}>{value}</div>
    </div>
  );
}
