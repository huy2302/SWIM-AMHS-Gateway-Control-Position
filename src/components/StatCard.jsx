export default function StatCard({ title, value, color, type, subtitle, footnote }) {
  return (
    <div className="statCard" style={{ borderLeft: `6px solid ${color}` }}>
      <div className={`statTitle`}>{title}</div>
      <div className={`statValue ${type}`}>{value}</div>
      {subtitle ? <div className="statSubtitle">{subtitle}</div> : null}
      {footnote ? <div className="statFootnote">{footnote}</div> : null}
    </div>
  );
}
