import React, { useState } from "react";
import DashboardLayout from "../layout/DashboardLayout";
import {
  Plus,
  Trash2,
  Edit3,
  Copy,
  Play,
  Square,
  Download,
  Upload,
  Save,
  Link,
  Link2Off,
} from "lucide-react";
import { ACCOUNT_DATA } from "../data/sampleData";

/**
 * Account page component for managing system accounts.
 * Displays a table of accounts with their status and provides command buttons for account operations.
 * @returns {JSX.Element} The account management interface.
 */
export default function Account() {
  const [selectedId, setSelectedId] = useState(2);
  return (
    <DashboardLayout>
      <div className="flex h-full bg-slate-100 text-slate-900 p-4 gap-4">
        {/* LEFT COLUMN: LIST TABLE */}
        <div className="flex-1 flex flex-col bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="bg-slate-800/50 text-slate-400 uppercase tracking-wider border-b border-slate-700">
                  <th className="px-4 py-3 font-semibold">Account name</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Mode</th>
                  <th className="px-4 py-3 font-semibold">Activation Status</th>
                  <th className="px-4 py-3 font-semibold">Bind Status</th>
                  <th className="px-4 py-3 font-semibold">Server</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {ACCOUNT_DATA.map((acc) => (
                  <tr
                    key={acc.id}
                    onClick={() => setSelectedId(acc.id)}
                    className={`cursor-pointer transition-colors ${
                      selectedId === acc.id
                        ? "bg-blue-600/30 text-blue-100"
                        : "hover:bg-slate-800/40"
                    }`}
                  >
                    <td className="px-4 py-3 flex items-center gap-2">
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${acc.activation === "Enabled" ? "bg-green-500 shadow-[0_0_5px_green]" : "bg-slate-500"}`}
                      />
                      {acc.name}
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono">
                      {acc.type}
                    </td>
                    <td className="px-4 py-3">{acc.mode}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] ${
                          acc.activation === "Enabled"
                            ? "bg-green-950 text-green-400"
                            : "bg-slate-800 text-slate-500"
                        }`}
                      >
                        {acc.activation}
                      </span>
                    </td>
                    <td
                      className={`px-4 py-3 font-medium ${acc.bind === "Bound Active" ? "text-green-400" : "text-slate-500"}`}
                    >
                      {acc.bind}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{acc.server}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Status footer */}
          <div className="mt-auto p-2 bg-slate-800/30 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between">
            <span>Connected to server Nova</span>
            <span>Last update: Thu Dec 11 2025</span>
          </div>
        </div>

        {/* RIGHT COLUMN: COMMAND BUTTONS */}
        <div className="w-48 flex flex-col gap-2">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase px-2 mb-1">
            Commands
          </h3>

          {/* Main functions group */}
          <div className="flex flex-col gap-1 bg-slate-900 p-2 rounded-lg border border-slate-800">
            <CommandBtn
              icon={<Plus size={14} />}
              label="Add"
              color="text-green-400"
            />
            <CommandBtn
              icon={<Trash2 size={14} />}
              label="Delete"
              color="text-red-400"
            />
            <CommandBtn icon={<Edit3 size={14} />} label="Edit" />
            <CommandBtn icon={<Copy size={14} />} label="Copy" />
          </div>

          {/* Status group */}
          <div className="flex flex-col gap-1 bg-slate-900 p-2 rounded-lg border border-slate-800 mt-2">
            <CommandBtn
              icon={<Play size={14} />}
              label="Enable"
              disabled={selectedId === 1 ? false : true}
            />
            <CommandBtn icon={<Square size={14} />} label="Disable" />
          </div>

          {/* Import/Export group */}
          <div className="flex flex-col gap-1 bg-slate-900 p-2 rounded-lg border border-slate-800 mt-2 text-blue-400">
            <CommandBtn icon={<Upload size={14} />} label="Import" />
            <CommandBtn icon={<Download size={14} />} label="Export" />
            <div className="h-[1px] bg-slate-800 my-1" />
            <CommandBtn icon={<Save size={14} />} label="Save" />
          </div>

          {/* Connect group */}
          <div className="flex flex-col gap-1 bg-slate-900 p-2 rounded-lg border border-slate-800 mt-auto">
            <CommandBtn
              icon={<Link size={14} />}
              label="Connect"
              color="text-emerald-400"
            />
            <CommandBtn
              icon={<Link2Off size={14} />}
              label="Disconnect"
              color="text-rose-400"
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Sub-component for command buttons
const CommandBtn = ({
  icon,
  label,
  color = "text-slate-300",
  disabled = false,
}) => (
  <button
    disabled={disabled}
    className={`flex items-center gap-3 px-3 py-2 rounded text-[11px] font-medium transition-all
    ${disabled ? "opacity-30 cursor-not-allowed" : `hover:bg-slate-800 hover:shadow-md active:scale-95 ${color}`}
    `}
  >
    {icon} {label}
  </button>
);
