import React, { useState } from "react";
import DashboardLayout from "../layout/DashboardLayout";
import { 
  Save, 
  ArrowRightLeft, 
  Plus, 
  Trash2, 
  Settings2, 
  ArrowUpRight, 
  ArrowDownLeft,
  CheckCircle2,
  XCircle
} from "lucide-react";

const RoutingView = () => {
  const [activeTab, setActiveTab] = useState("S2A"); // S2A (SWIM to AMHS) là quan trọng hơn

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full bg-slate-100 text-slate-900 p-6 overflow-y-auto custom-scrollbar">
        
        {/* Header Area */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
              <ArrowRightLeft size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Gateway Routing Engine</h1>
              <p className="text-xs text-slate-500 font-medium">Configure message transformation and flow rules</p>
            </div>
          </div>
          
          <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-bold text-sm transition-all shadow-md active:scale-95">
            <Save size={18} /> SAVE ALL CONFIGURATIONS
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-6 bg-slate-200/50 p-1 rounded-xl w-fit border border-slate-200">
          <button 
            onClick={() => setActiveTab("A2S")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "A2S" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            <ArrowUpRight size={16} /> AMHS ➜ SWIM
          </button>
          <button 
            onClick={() => setActiveTab("S2A")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "S2A" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            <ArrowDownLeft size={16} /> SWIM ➜ AMHS
          </button>
        </div>

        {/* Main Content Area */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wider">
              {activeTab === "A2S" ? "Outbound Rules (ROUTING_A2S)" : "Inbound Rules (ROUTING_S2A)"}
            </h2>
            <button className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-bold text-xs">
              <Plus size={16} /> ADD NEW RULE
            </button>
          </div>

          {activeTab === "A2S" ? (
            <div className="grid gap-4">
               {/* Example Row for A2S */}
               <A2SRuleRow 
                destination="VVTSYMYZ" 
                msgType="FPL" 
                domain="FIXM" 
                topic="icao/v1/fpl/vts" 
               />
               <A2SRuleRow 
                destination="VVNBZQZX" 
                msgType="NOTAM" 
                domain="AIXM" 
                topic="icao/v1/notam/vnb" 
               />
            </div>
          ) : (
            <div className="grid gap-4">
              {/* Example Row for S2A */}
              <S2ARuleRow 
                topic="broker.topic.metar"
                domain="IWXXM"
                msgType="METAR"
                originator="EGGGYMYX"
                recipients="VVTSZQZX, VVNBZQZX"
              />
              <S2ARuleRow 
                topic="broker.topic.fpl"
                domain="FIXM"
                msgType="FlightPlan"
                originator="EGLLAMHS"
                recipients="VVDNZQZX"
              />
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

// --- SUB-COMPONENTS ---

const A2SRuleRow = ({ destination, msgType, domain, topic }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-indigo-300 transition-all group">
    <div className="grid grid-cols-12 gap-4 items-center">
      <div className="col-span-1 flex flex-col items-center border-r border-slate-100">
        <span className="text-[10px] font-bold text-slate-400 uppercase">Priority</span>
        <input type="number" defaultValue="1" className="w-10 text-center font-bold text-indigo-600 outline-none" />
        <div className="mt-2 text-green-500"><CheckCircle2 size={18} /></div>
      </div>
      
      <div className="col-span-11 grid grid-cols-5 gap-4">
        <InputGroup label="AMHS Destination" value={destination} />
        <SelectGroup label="Msg Type" options={["FPL", "DEP", "ARR", "NOTAM"]} selected={msgType} />
        <SelectGroup label="SWIM Domain" options={["FIXM", "AIXM", "IWXXM"]} selected={domain} />
        <InputGroup label="Publish Topic" value={topic} className="col-span-2" />
      </div>
    </div>
  </div>
);

const S2ARuleRow = ({ topic, domain, msgType, originator, recipients }) => (
  <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden border-l-4 border-l-indigo-500">
    {/* Input Section (SWIM) */}
    <div className="bg-slate-50/50 p-4 border-b border-slate-100 grid grid-cols-12 gap-4 items-center">
      <div className="col-span-2">
        <span className="text-[10px] font-black text-indigo-500 uppercase flex items-center gap-1">
          <Settings2 size={12} /> SWIM Input
        </span>
      </div>
      <div className="col-span-4">
        <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Topic (From Broker)</label>
        <select className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-xs font-mono outline-none focus:ring-1 ring-indigo-500">
          <option>{topic}</option>
          <option>topic.weather.direct</option>
        </select>
      </div>
      <div className="col-span-3">
        <SelectGroup label="Domain" options={["FIXM", "AIXM", "IWXXM"]} selected={domain} />
      </div>
      <div className="col-span-3">
        <InputGroup label="Message Type" value={msgType} />
      </div>
    </div>

    {/* Output Section (AMHS) */}
    <div className="p-4 grid grid-cols-12 gap-4 items-start">
      <div className="col-span-2">
        <span className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-1">
          <ArrowRightLeft size={12} /> AMHS Output
        </span>
        <div className="mt-4">
          <label className="inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" defaultChecked />
            <div className="w-8 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all"></div>
            <span className="ml-2 text-[10px] font-bold text-slate-400 uppercase">Active</span>
          </label>
        </div>
      </div>
      
      <div className="col-span-2">
        <InputGroup label="Originator" value={originator} />
      </div>
      
      <div className="col-span-4">
        <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Recipients (Multi-input)</label>
        <textarea 
          defaultValue={recipients}
          className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs font-mono outline-none focus:border-indigo-500 h-16"
          placeholder="VVTSZQZX, VVNBZQZX..."
        />
      </div>

      <div className="col-span-2 space-y-3">
        <SelectGroup label="Priority" options={["SS", "DD", "FF", "GG"]} selected="FF" />
        <SelectGroup label="Filing Time" options={["AUTO", "MANUAL"]} selected="AUTO" />
      </div>

      <div className="col-span-2 flex justify-end gap-2 pt-4">
        <button className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
        <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Settings2 size={18} /></button>
      </div>
    </div>
  </div>
);

// Reusable Small Components
const InputGroup = ({ label, value, className = "" }) => (
  <div className={className}>
    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">{label}</label>
    <input 
      type="text" 
      defaultValue={value} 
      className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs font-semibold outline-none focus:border-indigo-500 transition-colors"
    />
  </div>
);

const SelectGroup = ({ label, options, selected }) => (
  <div>
    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">{label}</label>
    <select className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs font-bold outline-none focus:border-indigo-500 cursor-pointer">
      {options.map(opt => (
        <option key={opt} selected={opt === selected}>{opt}</option>
      ))}
    </select>
  </div>
);

export default RoutingView;
