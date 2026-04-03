import React from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import { Save, ArrowRightLeft, Send, Download } from 'lucide-react';

const RoutingView = () => {
  return (
    <DashboardLayout>
        <div className="flex flex-col h-full bg-slate-950 text-slate-200 p-6 overflow-y-auto custom-scrollbar">
        {/* Top Toolbar */}
        <div className="flex justify-between items-center mb-6 bg-slate-900 p-3 rounded-lg border border-slate-800 shadow-lg">
            <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 rounded-lg text-blue-400">
                <ArrowRightLeft size={20} />
            </div>
            <div>
                <h2 className="text-sm font-bold uppercase tracking-wider">Routing Configuration</h2>
                <p className="text-[10px] text-slate-500">Define message flow between AMHS and SWIM protocols</p>
            </div>
            </div>
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-bold text-xs transition-all shadow-lg active:scale-95">
            <Save size={16} /> SAVE CONFIGURATION
            </button>
        </div>

        <div className="grid gap-6">
            {/* SECTION 1: AMHS TO SWIM */}
            <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="bg-slate-800/50 px-4 py-3 border-b border-slate-700 flex items-center gap-2">
                <Send size={14} className="text-green-400" />
                <h3 className="text-xs font-bold text-slate-300 uppercase">Inbound: AMHS to SWIM</h3>
            </div>
            
            <div className="p-6">
                <table className="w-full text-left text-xs border-separate border-spacing-y-3">
                <thead>
                    <tr className="text-slate-500 uppercase text-[10px] tracking-widest">
                    <th className="px-2 pb-2">Message Type</th>
                    <th className="px-2 pb-2">AMQP Account</th>
                    <th className="px-2 pb-2">Send Queue</th>
                    </tr>
                </thead>
                <tbody>
                    <RoutingRowIn label="IWXXM messages" />
                    <RoutingRowIn label="FIXM messages" value="FPL" />
                    <RoutingRowIn label="AIXM messages" value="DNotam" />
                    <RoutingRowIn label="Default messages" value="SendQueue" />
                </tbody>
                </table>
            </div>
            </section>

            {/* SECTION 2: SWIM TO AMHS */}
            <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="bg-slate-800/50 px-4 py-3 border-b border-slate-700 flex items-center gap-2">
                <Download size={14} className="text-blue-400" />
                <h3 className="text-xs font-bold text-slate-300 uppercase">Outbound: SWIM to AMHS</h3>
            </div>

            <div className="p-6">
                <div className="grid grid-cols-4 text-slate-500 uppercase text-[10px] tracking-widest mb-4 px-2">
                <span>AMQP Account</span>
                <span>Receive Queue</span>
                <span>Sender AFTN Address</span>
                <span>AFTN Recipients</span>
                </div>
                
                <div className="space-y-4">
                <RoutingRowOut 
                    account="AMQP Nova" 
                    queue="ReceiveQueue" 
                    sender="EGLLAMHS" 
                    recipients="EGLLATNS" 
                />
                <RoutingRowOut 
                    account="DWD OPMET via AMQP" 
                    queue="/topic/metar.direct" 
                    sender="EGLLAMHS" 
                    recipients="EGPDPTHR" 
                />
                </div>
            </div>
            </section>
        </div>

        <div className="mt-auto pt-6 text-[10px] text-slate-600 flex justify-between italic">
            <span>* Manual routing overrides default gateway logic</span>
            <span>Connected to server: Nova (Active)</span>
        </div>
        </div>
    </DashboardLayout>
  );
};

// Sub-component cho hàng AMHS to SWIM
const RoutingRowIn = ({ label, value = "" }) => (
  <tr className="group">
    <td className="px-2 text-slate-400 font-medium py-1">{label}</td>
    <td className="px-2">
      <select className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded px-2 py-1.5 w-48 focus:border-blue-500 outline-none">
        <option>None</option>
        <option selected>MET</option>
        <option>FPL</option>
      </select>
    </td>
    <td className="px-2">
      <input 
        type="text" 
        defaultValue={value}
        className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded px-3 py-1.5 w-48 focus:border-blue-500 outline-none font-mono"
      />
    </td>
  </tr>
);

// Sub-component cho hàng SWIM to AMHS
const RoutingRowOut = ({ account, queue, sender, recipients }) => (
  <div className="grid grid-cols-4 gap-4 items-start bg-slate-950/30 p-3 rounded-lg border border-slate-800/50 hover:border-slate-700 transition-colors">
    <div className="text-xs text-slate-300 pt-2 font-semibold px-2">{account}</div>
    <input 
      type="text" 
      defaultValue={queue}
      className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded px-3 py-1.5 focus:border-blue-500 outline-none font-mono"
    />
    <input 
      type="text" 
      defaultValue={sender}
      className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded px-3 py-1.5 focus:border-blue-500 outline-none font-mono"
    />
    <textarea 
      defaultValue={recipients}
      rows="2"
      className="bg-slate-950 border border-slate-800 text-slate-300 text-[11px] rounded px-3 py-1.5 focus:border-blue-500 outline-none font-mono resize-none"
    />
  </div>
);

export default RoutingView;