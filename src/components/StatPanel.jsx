const StatPanel = ({ title, stats = {} }) => {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded shadow-sm flex-1">
      <div className="bg-slate-700/50 px-3 py-1.5 border-b border-slate-600 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        {title}
      </div>
      <table className="w-full text-[11px] border-collapse">
        <tbody>
          {Object.entries(stats).map(([key, value], i) => (
            <tr key={key} className={`${i % 2 === 0 ? 'bg-transparent' : 'bg-slate-800/30'} border-b border-slate-700/50 last:border-none hover:bg-blue-500/5`}>
              <td className="px-3 py-1.5 text-slate-500 w-[60%] border-r border-slate-700/50">{key}</td>
              <td className="px-3 py-1.5 text-slate-200 font-mono">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StatPanel;