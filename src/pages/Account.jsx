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
  X,
} from "lucide-react";
import { ACCOUNT_DATA as INITIAL_DATA } from "../data/sampleData";

export default function Account() {
  const [accounts, setAccounts] = useState(INITIAL_DATA);
  const [selectedId, setSelectedId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // State cho form (Dùng chung cho cả Add và Edit)
  const [formData, setFormData] = useState({ name: "", type: "MT4", mode: "Demo" });

  // --- LOGIC FUNCTIONS ---

  const handleAdd = () => {
    setFormData({ name: "", type: "MT4", mode: "Demo" });
    setIsModalOpen(true);
  };

  const handleDelete = () => {
    if (!selectedId) return alert("Please select an account to delete");
    if (window.confirm("Are you sure you want to delete this account?")) {
      setAccounts(accounts.filter(acc => acc.id !== selectedId));
      setSelectedId(null);
    }
  };

  const handleToggleStatus = (status) => {
    setAccounts(accounts.map(acc => 
      acc.id === selectedId ? { ...acc, activation: status } : acc
    ));
  };

  const handleSaveAccount = (e) => {
    e.preventDefault();
    const newAccount = {
      id: Date.now(), // Tạo ID tạm thời
      ...formData,
      activation: "Disabled",
      bind: "Unbound",
      server: "Nova-Live"
    };
    setAccounts([...accounts, newAccount]);
    setIsModalOpen(false);
  };

  return (
    <DashboardLayout>
      <div className="flex h-full bg-slate-100 text-slate-900 p-4 gap-4 relative">
        
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
                {accounts.map((acc) => (
                  <tr
                    key={acc.id}
                    onClick={() => setSelectedId(acc.id)}
                    className={`cursor-pointer transition-colors ${
                      selectedId === acc.id
                        ? "bg-blue-600/30 text-blue-100"
                        : "hover:bg-slate-800/40 text-slate-300"
                    }`}
                  >
                    <td className="px-4 py-3 flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${acc.activation === "Enabled" ? "bg-green-500 shadow-[0_0_5px_green]" : "bg-slate-500"}`} />
                      {acc.name}
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono">{acc.type}</td>
                    <td className="px-4 py-3">{acc.mode}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${acc.activation === "Enabled" ? "bg-green-950 text-green-400" : "bg-slate-800 text-slate-500"}`}>
                        {acc.activation}
                      </span>
                    </td>
                    <td className={`px-4 py-3 font-medium ${acc.bind === "Bound Active" ? "text-green-400" : "text-slate-500"}`}>
                      {acc.bind}
                    </td>
                    <td className="px-4 py-3 text-slate-400">{acc.server}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN: COMMAND BUTTONS */}
        <div className="w-48 flex flex-col gap-2">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase px-2 mb-1">Commands</h3>
          
          <div className="flex flex-col gap-1 bg-slate-900 p-2 rounded-lg border border-slate-800">
            <CommandBtn icon={<Plus size={14} />} label="Add" color="text-green-400" onClick={handleAdd} />
            <CommandBtn icon={<Trash2 size={14} />} label="Delete" color="text-red-400" onClick={handleDelete} disabled={!selectedId} />
            <CommandBtn icon={<Edit3 size={14} />} label="Edit" disabled={!selectedId} />
            <CommandBtn icon={<Copy size={14} />} label="Copy" disabled={!selectedId} />
          </div>

          <div className="flex flex-col gap-1 bg-slate-900 p-2 rounded-lg border border-slate-800 mt-2">
            <CommandBtn 
                icon={<Play size={14} />} label="Enable" color="text-green-500"
                onClick={() => handleToggleStatus("Enabled")} 
                disabled={!selectedId} 
            />
            <CommandBtn 
                icon={<Square size={14} />} label="Disable" 
                onClick={() => handleToggleStatus("Disabled")} 
                disabled={!selectedId} 
            />
          </div>

          <div className="flex flex-col gap-1 bg-slate-900 p-2 rounded-lg border border-slate-800 mt-2 text-blue-400">
            <CommandBtn icon={<Upload size={14} />} label="Import" />
            <CommandBtn icon={<Download size={14} />} label="Export" />
            <div className="h-[1px] bg-slate-800 my-1" />
            <CommandBtn icon={<Save size={14} />} label="Save" onClick={() => alert("Data Saved Successfully!")} />
          </div>
        </div>

        {/* MODAL FORM */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-xl shadow-2xl overflow-hidden">
              <div className="flex justify-between items-center p-4 border-b border-slate-800">
                <h2 className="text-black font-bold">Add new Account</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X size={18}/></button>
              </div>
              <form onSubmit={handleSaveAccount} className="p-4 flex flex-col gap-4 text-sm">
                <div>
                  <label className="text-slate-400 block mb-1">Account Name</label>
                  <input 
                    required className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-black focus:border-blue-500"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-slate-400 block mb-1">Type</label>
                        <select className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-black" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                            <option>MT4</option>
                            <option>MT5</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-slate-400 block mb-1">Mode</label>
                        <select className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-black" value={formData.mode} onChange={(e) => setFormData({...formData, mode: e.target.value})}>
                            <option>Demo</option>
                            <option>Live</option>
                        </select>
                    </div>
                </div>
                <div className="flex gap-2 justify-end mt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white transition-colors">Cancel</button>
                  <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded font-medium transition-all">Create Account</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

const CommandBtn = ({ icon, label, color = "text-slate-300", disabled = false, onClick }) => (
  <button
    disabled={disabled}
    onClick={onClick}
    className={`flex items-center gap-3 px-3 py-2 rounded text-[12px] font-medium transition-all
    ${disabled ? "opacity-20 cursor-not-allowed" : `hover:bg-slate-800 hover:shadow-md active:scale-95 ${color}`}
    `}
  >
    {icon} {label}
  </button>
);