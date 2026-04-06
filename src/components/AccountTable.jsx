/**
 * AccountTable component that displays a table of accounts with their status and details.
 * Shows running status indicators, account names, connection status, and last activity dates.
 * @param {string} title - The title displayed at the top of the table.
 * @param {Array} data - Array of account objects with properties like name, status, online, lastFetched, lastSent.
 * @returns {JSX.Element} A table displaying account information.
 */
const AccountTable = ({ title, data }) => (
  <div className="bg-slate-800/40 border border-slate-700 rounded overflow-hidden">
    <div className="bg-slate-700/30 px-3 py-1.5 text-[11px] font-bold text-slate-400 border-b border-slate-700 uppercase">
      {title}
    </div>
    <table className="w-full text-[11px] text-left">
      <thead className="bg-slate-900/50 text-slate-500 border-b border-slate-700 uppercase">
        <tr>
          <th className="p-2 w-16 text-center">Running</th>
          <th className="p-2">Name</th>
          <th className="p-2">Status</th>
          <th className="p-2">Date Last Fetched</th>
          <th className="p-2">Date Last Sent</th>
          <th className="p-2 text-right">Action</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-700/50">
        {data.map((row, idx) => (
          <tr key={idx} className="hover:bg-slate-700/20 transition-colors">
            <td className="p-2">
              <div className="flex justify-center gap-1 bg-black/40 p-1 rounded-sm w-fit mx-auto">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${row.online ? "bg-slate-700" : "bg-red-600 shadow-[0_0_5px_rgba(220,38,38,0.8)] animate-pulse"}`}
                />
                <div
                  className={`w-2.5 h-2.5 rounded-full ${row.online ? "bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.8)]" : "bg-slate-700"}`}
                />
              </div>
            </td>
            <td className="p-2 font-bold text-blue-400">{row.name}</td>
            <td
              className={`p-2 font-medium ${row.online ? "text-green-500" : "text-red-500"}`}
            >
              {row.status}
            </td>
            <td className="p-2 text-slate-400">{row.lastFetched || "N/A"}</td>
            <td className="p-2 text-slate-400">{row.lastSent || "N/A"}</td>
            <td className="p-2 text-right">
              <button className="text-blue-500 hover:underline text-[10px] font-bold">
                VIEW
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default AccountTable;
