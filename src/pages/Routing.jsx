import React, { useEffect, useState } from "react";
import DashboardLayout from "../layout/DashboardLayout";
import gatewayApi from "../api/gatewayApi";
import {
  Save,
  ArrowRightLeft,
  Plus,
  Trash2,
  Settings2,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

const createTimestamp = () => new Date().toISOString();

const formatRuleTimestamp = (timestamp) =>
  timestamp ? new Date(timestamp).toLocaleString() : "-";

const createA2SRule = () => ({
  id: `a2s-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
  originator: "",
  destination: "",
  msgType: "FPL",
  domain: "FIXM",
  topic: "",
  topicAuto: true,
  priority: 1,
  active: true,
  createdAt: createTimestamp(),
  updatedAt: createTimestamp(),
});

const MSG_TYPE_TO_EVENT = {
  // FIXM (Flight)
  FPL: "flight.plan",
  DEP: "flight.departure",
  ARR: "flight.arrival",
  DLA: "flight.delay",
  CNL: "flight.cancel",
  CHG: "flight.change",

  // IWXXM (Weather)
  METAR: "metar",
  SPECI: "speci",
  TAF: "taf",
  SIGMET: "sigmet",
  AIRMET: "airmet",

  // AIXM (Aeronautical info)
  NOTAM: "notam",
};

const buildA2sTopicFromRule = (rule) => {
  if (!rule.domain) return "";

  const domain = rule.domain.toLowerCase().trim();
  const msgType = (rule.msgType || "").toUpperCase().trim();

  // tìm event từ bảng mapping
  const event = MSG_TYPE_TO_EVENT[msgType];

  // nếu chưa có mapping → fallback generic
  const finalEvent = event || "message";

  return `${domain}.${finalEvent}`;
};

const createS2ARule = () => ({
  id: `s2a-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
  topic: "",
  domain: "",
  msgType: "",
  originator: "",
  destination: "",
  priority: "FF",
  filingTime: "CURRENT_TIME",
  active: true,
  createdAt: createTimestamp(),
  updatedAt: createTimestamp(),
});

const normalizeA2sApiRule = (rule) => ({
  id: rule.id || `a2s-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
  originator: rule.amhsOriginator ?? rule.originator ?? "",
  destination: rule.amhsDestination ?? rule.destination ?? "",
  msgType: rule.amhsMsgType ?? rule.msgType ?? "",
  domain: rule.swimDomain ?? rule.domain ?? "",
  topic: rule.swimTopic ?? rule.topic ?? "",
  topicAuto: true,
  priority: rule.priority ?? 1,
  active: rule.enabled ?? rule.active ?? false,
  description: rule.description ?? "",
  createdAt: rule.createdAt ?? rule.created_at ?? null,
  updatedAt: rule.updatedAt ?? rule.updated_at ?? null,
});

const denormalizeA2sRuleForApi = (rule) => ({
  id: rule.id,
  priority: rule.priority,
  enabled: rule.active,
  amhsOriginator: rule.originator,
  amhsDestination: rule.destination,
  amhsMsgType: rule.msgType,
  swimDomain: rule.domain,
  swimTopic: rule.topic,
  description: rule.description ?? "",
  createdAt: rule.createdAt,
  updatedAt: rule.updatedAt,
});

const normalizeS2aApiRule = (rule) => ({
  id: rule.id || `s2a-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
  topic: rule.swimTopic ?? rule.topic ?? "",
  domain: rule.swimDomain ?? rule.domain ?? "",
  msgType: rule.swimMessageType ?? rule.msgType ?? "",
  originator: rule.amhsOriginator ?? rule.originator ?? "",
  destination: rule.amhsDestination ?? rule.destination ?? "",
  priority: rule.amhsPriorityIndicator ?? rule.priority ?? "FF",
  filingTime: rule.amhsFilingTimeMode ?? rule.filingTime ?? "CURRENT_TIME",
  active: rule.enabled ?? rule.active ?? false,
  description: rule.description ?? "",
  createdAt: rule.createdAt ?? rule.created_at ?? null,
  updatedAt: rule.updatedAt ?? rule.updated_at ?? null,
});

const denormalizeS2aRuleForApi = (rule) => ({
  id: rule.id,
  enabled: rule.active,
  swimTopic: rule.topic,
  swimDomain: rule.domain,
  swimMessageType: rule.msgType,
  amhsOriginator: rule.originator,
  amhsDestination: rule.destination,
  amhsPriorityIndicator: rule.priority,
  amhsFilingTimeMode: rule.filingTime,
  description: rule.description ?? "",
  createdAt: rule.createdAt,
  updatedAt: rule.updatedAt,
});

const RoutingView = () => {
  const [activeTab, setActiveTab] = useState("S2A"); // S2A (SWIM to AMHS) là quan trọng hơn
  const [a2sRules, setA2sRules] = useState([]);
  const [s2aRules, setS2aRules] = useState([]);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [statusType, setStatusType] = useState(null);

  const fetchRoutingConfigs = async () => {
    setLoadingRoutes(true);
    setStatusMessage(null);
    setStatusType(null);

    try {
      const { a2s, s2a } = await gatewayApi.getRoutings();
      setA2sRules(Array.isArray(a2s) ? a2s.map(normalizeA2sApiRule) : []);
      setS2aRules(Array.isArray(s2a) ? s2a.map(normalizeS2aApiRule) : []);
    } catch (error) {
      console.error("Lỗi khi lấy cấu hình routing:", error);
      setStatusMessage(error?.message || "Không thể tải dữ liệu routing từ API.");
      setStatusType("error");
    } finally {
      setLoadingRoutes(false);
    }
  };

  useEffect(() => {
    fetchRoutingConfigs();
  }, []);

  const handleAddNewRule = () => {
    if (activeTab === "A2S") {
      setA2sRules((prev) => [createA2SRule(), ...prev]);
    } else {
      setS2aRules((prev) => [createS2ARule(), ...prev]);
    }
  };

  const handleChangeA2sRule = (id, field, value) => {
    setA2sRules((prev) =>
      prev.map((rule) => {
        if (rule.id !== id) return rule;

        const updated = { ...rule, [field]: value, updatedAt: createTimestamp() };
        if ((field === "destination" || field === "msgType") && updated.topicAuto) {
          updated.topic = buildA2sTopicFromRule(updated);
        }
        return updated;
      })
    );
  };

  const handleChangeS2aRule = (id, field, value) => {
    setS2aRules((prev) =>
      prev.map((rule) =>
        rule.id === id ? { ...rule, [field]: value, updatedAt: createTimestamp() } : rule
      )
    );
  };

  const handleRemoveA2sRule = (id) => {
    setA2sRules((prev) => prev.filter((rule) => rule.id !== id));
  };

  const handleRemoveS2aRule = (id) => {
    setS2aRules((prev) => prev.filter((rule) => rule.id !== id));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setStatusMessage(null);
    setStatusType(null);

    try {
      await gatewayApi.createRouting({
        a2sRules: a2sRules.map(denormalizeA2sRuleForApi),
        s2aRules: s2aRules.map(denormalizeS2aRuleForApi),
      });
      setStatusMessage("All routing configurations were saved successfully.");
      setStatusType("success");
    } catch (error) {
      console.error("Lỗi khi lưu cấu hình routing:", error);
      setStatusMessage(error?.message || "Save failed. Please check the API connection.");
      setStatusType("error");
    } finally {
      setSaving(false);
    }
  };

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

          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-lg font-bold text-sm transition-all shadow-md active:scale-95"
          >
            <Save size={18} /> {saving ? "SAVING..." : "SAVE ALL CONFIGURATIONS"}
          </button>
        </div>

        {statusMessage && (
          <div
            className={`mb-4 rounded-xl px-4 py-3 text-sm font-medium ${
              statusType === "success"
                ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                : "bg-rose-100 text-rose-700 border border-rose-200"
            }`}
          >
            {statusMessage}
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-6 bg-slate-200/50 p-1 rounded-xl w-fit border border-slate-200">
          <button
            onClick={() => setActiveTab("A2S")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === "A2S" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <ArrowUpRight size={16} /> AMHS ➜ SWIM
          </button>
          <button
            onClick={() => setActiveTab("S2A")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === "S2A" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
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
            <button
              onClick={handleAddNewRule}
              disabled={loadingRoutes}
              className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 disabled:opacity-60 font-bold text-xs"
            >
              <Plus size={16} /> ADD NEW RULE
            </button>
          </div>

          {activeTab === "A2S" ? (
            <div className="grid gap-4">
              {a2sRules.map((rule) => (
                <A2SRuleRow
                  key={rule.id}
                  rule={rule}
                  onChange={handleChangeA2sRule}
                  onRemove={() => handleRemoveA2sRule(rule.id)}
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-4">
              {s2aRules.map((rule) => (
                <S2ARuleRow
                  key={rule.id}
                  rule={rule}
                  onChange={handleChangeS2aRule}
                  onRemove={() => handleRemoveS2aRule(rule.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

// --- SUB-COMPONENTS ---

const A2SRuleRow = ({ rule, onChange, onRemove }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-indigo-300 transition-all group">
    <div className="grid grid-cols-12 gap-4 items-center">
      <div className="col-span-1 flex flex-col items-center border-r border-slate-100">
        <span className="text-[10px] font-bold text-slate-400 uppercase">Priority</span>
        <input
          type="number"
          min="1"
          value={rule.priority}
          onChange={(e) => onChange(rule.id, "priority", Number(e.target.value) || 1)}
          className="w-10 text-center font-bold text-indigo-600 outline-none"
        />
        <div className="mt-2 text-green-500"><CheckCircle2 size={18} /></div>
      </div>

      <div className="col-span-11 grid grid-cols-12 gap-4 items-end">
        <div className="col-span-2 grid gap-4">
          <InputGroup
            label="AMHS Originator"
            value={rule.originator}
            onChange={(value) => onChange(rule.id, "originator", value)}
          />
          <InputGroup
            label="AMHS Destination"
            value={rule.destination}
            onChange={(value) => onChange(rule.id, "destination", value)}
          />
        </div>
        <div className="col-span-2">
          <InputGroup
            label="Msg Type"
            value={rule.msgType}
            onChange={(value) => onChange(rule.id, "msgType", value)}
          />
        </div>
        <div className="col-span-1 flex justify-center self-center">
          <ArrowRight size={20} className="text-slate-400" />
        </div>
        <div className="col-span-6 flex flex-col gap-4">
          <div className="w-[33%] text-slate-500">
            <span className="text-[10px] font-bold uppercase">SWIM Domain</span>
            <SelectGroup
              label=""
              options={["FIXM", "AIXM", "IWXXM"]}
              selected={rule.domain}
              onChange={(value) => onChange(rule.id, "domain", value)}
            />
          </div>
          <div className="w-full flex justify-between">
            <InputGroup
              label="Publish Topic"
              value={rule.topic}
              onChange={(value) => onChange(rule.id, "topic", value)}
              disabled={rule.topicAuto}
              className="w-[80%]"
            />
            <div className="flex flex-row items-center mb-[-1.5rem]">
              <input
                  type="checkbox"
                  checked={rule.topicAuto}
                  onChange={(e) => {
                    const auto = e.target.checked;
                    const topic = auto ? buildA2sTopicFromRule(rule) : rule.topic;
                    onChange(rule.id, "topicAuto", auto);
                    onChange(rule.id, "topic", topic);
                  }}
                  className="mr-2 h-4 w-4 text-indigo-600 border-slate-300 rounded"
                />
                <span className="text-[10px] font-bold uppercase text-slate-500">Auto topic</span>
            </div>
            {/* <div className="flex items-center gap-2 mb-2">
              <label className="inline-flex items-center cursor-pointer">
                
              </label>
            </div> */}
          </div>
        </div>
      </div>
    </div>

    <div className="mt-4 flex flex-col gap-1 text-[11px] italic text-slate-500">
      <span>Created: {formatRuleTimestamp(rule.createdAt)}</span>
      <span>Updated: {formatRuleTimestamp(rule.updatedAt)}</span>
    </div>

    <div className="mt-4 flex justify-end">
      <button
        onClick={onRemove}
        className="text-slate-400 hover:text-red-500 transition-colors text-xs font-bold"
      >
        Remove rule
      </button>
    </div>
  </div>
);

const S2ARuleRow = ({ rule, onChange, onRemove }) => (
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
        <input
          type="text"
          value={rule.topic}
          onChange={(e) => onChange(rule.id, "topic", e.target.value)}
          className="w-full bg-white border border-slate-200 rounded px-2 py-1.5 text-xs font-mono outline-none focus:ring-1 ring-indigo-500"
        />
      </div>
      <div className="col-span-3">
        <InputGroup
          label="Domain"
          value={rule.domain}
          onChange={(value) => onChange(rule.id, "domain", value)}
        />
      </div>
      <div className="col-span-3">
        <InputGroup
          label="Message Type"
          value={rule.msgType}
          onChange={(value) => onChange(rule.id, "msgType", value)}
        />
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
            <input
              type="checkbox"
              checked={rule.active}
              onChange={(e) => onChange(rule.id, "active", e.target.checked)}
              className="sr-only peer"
            />
            <div className="relative w-8 h-4 bg-slate-200 rounded-full peer-focus:outline-none peer-checked:bg-emerald-500 transition-colors">
              <span className={`absolute left-1 top-1 h-2.5 w-2.5 rounded-full bg-white shadow transition-transform ${rule.active ? "translate-x-4" : "translate-x-0"}`} />
            </div>
            <span className="ml-2 text-[10px] font-bold text-slate-400 uppercase">Active</span>
          </label>
        </div>
      </div>

      <div className="col-span-2">
        <InputGroup
          label="Originator"
          value={rule.originator}
          onChange={(value) => onChange(rule.id, "originator", value)}
        />
      </div>

      <div className="col-span-4">
        <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Destinations (Multi-input)</label>
        <textarea
          value={rule.destination}
          onChange={(e) => onChange(rule.id, "destination", e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs font-mono outline-none focus:border-indigo-500 h-16"
          placeholder="VVTSZQZX, VVNBZQZX..."
        />
      </div>

      <div className="col-span-2 space-y-3">
        <SelectGroup
          label="Priority"
          options={["SS", "DD", "FF", "GG", "KK"]}
          selected={rule.priority}
          onChange={(value) => onChange(rule.id, "priority", value)}
        />
        <SelectGroup
          label="Filing Time"
          options={["CURRENT_TIME", "ORIGINAL_TIME", "AUTO", "MANUAL"]}
          selected={rule.filingTime}
          onChange={(value) => onChange(rule.id, "filingTime", value)}
        />
      </div>

      <div className="col-span-2 flex justify-end gap-2 pt-4">
        <button
          onClick={onRemove}
          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
        >
          <Trash2 size={18} />
        </button>
        <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
          <Settings2 size={18} />
        </button>
      </div>
    </div>

    <div className="px-4 pb-4 flex flex-col gap-1 text-[11px] italic text-slate-500">
      <span>Created: {formatRuleTimestamp(rule.createdAt)}</span>
      <span>Updated: {formatRuleTimestamp(rule.updatedAt)}</span>
    </div>
  </div>
);

// Reusable Small Components
const InputGroup = ({ label, value, className = "", onChange, disabled = false }) => (
  <div className={className}>
    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">{label}</label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      className={`w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs font-semibold outline-none transition-colors ${disabled ? "cursor-not-allowed bg-slate-100 text-slate-400" : "focus:border-indigo-500"}`}
    />
  </div>
);

const SelectGroup = ({ label, options, selected, onChange }) => (
  <div>
    <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">{label}</label>
    <select
      value={selected}
      onChange={(e) => onChange?.(e.target.value)}
      className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs font-bold outline-none focus:border-indigo-500 cursor-pointer"
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);

export default RoutingView;
