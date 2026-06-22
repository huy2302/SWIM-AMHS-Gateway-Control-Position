import React, { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import gatewayApi from "../../api/gatewayApi";
import {
  Plus,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Search,
} from "lucide-react";
import SimpleBar from 'simplebar-react';
import 'simplebar-react/dist/simplebar.min.css';
import { 
  showSuccessToast, 
  showErrorToast, 
} from '../../constants/toastIcons'; 
import toast from 'react-hot-toast';
import { t } from "@/i18n/translator";

const createTimestamp = () => new Date().toISOString();

const createA2SRule = () => ({
  id: `a2s-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
  originator: "",
  destination: "",
  msgType: "FPL",
  messageType: "FPL",
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

const A2S_MESSAGE_TYPES = [
  "METAR",
  "SPECI",
  "TAF",
  "SIGMET",
  "AIRMET",
  "FPL",
  "DEP",
  "ARR",
  "DLA",
  "CNL",
  "CHG",
  "NOTAM",
];

// AMHS Priority levels: SS, DD, FF, GG, KK
const AMHS_PRIORITIES = {
  SS: "SS",
  DD: "DD",
  FF: "FF",
  GG: "GG",
  KK: "KK",
};

// SWIM Priority levels: 0-9
const SWIM_PRIORITIES = Array.from({ length: 10 }, (_, i) => i.toString());

// Convert AMHS priority to SWIM priority
const amhsToSwimPriority = (amhsPriority) => {
  const mapping = {
    SS: "0",
    DD: "1",
    FF: "3",
    GG: "5",
    KK: "7",
  };
  return mapping[amhsPriority?.toUpperCase()] || "3";
};

// Convert SWIM priority to AMHS priority
const swimToAmhsPriority = (swimPriority) => {
  const num = parseInt(swimPriority) || 0;
  if (num <= 1) return "DD";
  if (num <= 3) return "FF";
  if (num <= 6) return "GG";
  if (num <= 9) return "KK";
  return "FF";
};

const buildA2sTopicFromRule = (rule) => {
  if (!rule.domain) return "";

  const domain = rule.domain.toLowerCase().trim();
  const msgTypeString = (rule.msgType || "").toUpperCase().trim();
  const msgType = msgTypeString.split(",")[0].trim();

  // tìm event từ bảng mapping
  const event = MSG_TYPE_TO_EVENT[msgType];

  // nếu chưa có mapping → fallback generic
  const finalEvent = event || "message";

  return `${domain}.${finalEvent}`;
};

const formatPriorityDisplay = (rule, isS2A) => {
  if (isS2A) {
    // S2A uses SWIM rule (0-9), show with AMHS equivalent
    return `${rule.prioritySwim} (${rule.priorityAmhs})`;
  } else {
    // A2S uses AMHS rule (SS/DD/FF/GG/KK)
    return `${rule.priorityAmhs} (${rule.prioritySwim})`;
  }
};

// Map AMHS priority to SWIM priority value
const getSwimPriorityFromAmhs = (amhsPriority) => {
  const mapping = {
    SS: 0,
    DD: 1,
    FF: 3,
    GG: 5,
    KK: 7,
  };
  return mapping[amhsPriority?.toUpperCase()] ?? 3;
};

// Map SWIM priority to AMHS priority
const getAmhsPriorityFromSwim = (swimPriority) => {
  const num = parseInt(swimPriority) || 0;
  if (num <= 1) return "DD";
  if (num <= 3) return "FF";
  if (num <= 6) return "GG";
  if (num <= 9) return "KK";
  return "FF";
};

const createS2ARule = () => ({
  id: `s2a-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
  topic: "",
  receiveTopic: "",
  sendTopic: "",
  domain: "",
  msgType: "",
  originator: "",
  destination: "",
  priority: "FF",
  filingTime: "CURRENT_TIME",
  active: true,
  description: "",
  createdBy: "",
  createdAt: createTimestamp(),
  updatedAt: createTimestamp(),
});

const normalizeA2sApiRule = (rule) => ({
  id: rule.id || `a2s-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
  direction: "OUT",
  originator: rule.amhsOriginator ?? rule.originator ?? "",
  destination: rule.amhsDestination ?? rule.destination ?? "",
  msgType: rule.messageType ?? rule.amhsMsgType ?? rule.msgType ?? "",
  messageType: rule.messageType ?? rule.amhsMsgType ?? rule.msgType ?? "",
  domain: rule.swimDomain ?? rule.domain ?? "",
  topic: rule.sendTopic ?? rule.swimTopic ?? rule.topic ?? "",
  sendTopic: rule.sendTopic ?? rule.swimTopic ?? rule.topic ?? "",
  topicAuto: true,
  prioritySwim: rule.prioritySwim ?? null,
  priorityAmhs: rule.priorityAmhs ?? null,
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
  messageType: rule.messageType ?? rule.msgType,
  swimDomain: rule.domain,
  swimTopic: rule.topic,
  description: rule.description ?? "",
  createdAt: rule.createdAt,
  updatedAt: rule.updatedAt,
});

const normalizeS2aApiRule = (rule) => ({
  id: rule.id || `s2a-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
  direction: "IN",
  topic: rule.receiveTopic ?? rule.swimTopic ?? rule.topic ?? "",
  receiveTopic: rule.receiveTopic ?? rule.swimTopic ?? rule.topic ?? "",
  sendTopic: rule.sendTopic ?? rule.amhsTopic ?? "",
  domain: rule.swimDomain ?? rule.domain ?? "",
  messageFilter: rule.messageFilter ?? "",
  msgType: rule.messageType ?? rule.msgType ?? "",
  originator: rule.amhsOriginator ?? rule.originator ?? "",
  destination: rule.recipients ?? rule.amhsDestination ?? rule.destination ?? "",
  priorityAmhs: rule.priorityAmhs ?? null,
  prioritySwim: rule.prioritySwim ?? null,
  filingTime: rule.amhsFilingTimeMode ?? rule.filingTime ?? "CURRENT_TIME",
  active: rule.enabled ?? rule.active ?? false,
  description: rule.note ?? rule.description ?? "",
  createdBy: rule.createdBy ?? rule.created_by ?? "",
  createdAt: rule.createdAt ?? rule.created_at ?? null,
  updatedAt: rule.updatedAt ?? rule.updated_at ?? null,
});

const denormalizeS2aRuleForApi = (rule) => ({
  id: rule.id,
  enabled: rule.active,
  swimTopic: rule.receiveTopic ?? rule.topic,
  amhsTopic: rule.sendTopic,
  swimDomain: rule.domain,
  swimMessageType: rule.msgType,
  amhsOriginator: rule.originator,
  amhsDestination: rule.destination,
  amhsPriorityIndicator: rule.priorityAmhs ?? null,
  swimPriorityIndicator: rule.prioritySwim ?? null,
  amhsFilingTimeMode: rule.filingTime,
  recipients: rule.destination,
  note: rule.description ?? rule.note ?? "",
  createdBy: rule.createdBy,
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
  const [editingRule, setEditingRule] = useState(null); // Rule đang được edit
  const [editFormData, setEditFormData] = useState({}); // Data của form edit
  const [msgTypeInput, setMsgTypeInput] = useState("");
  const [filterMessageType, setFilterMessageType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [originatorError, setOriginatorError] = useState(""); // Originator validation error
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteRule, setDeleteRule] = useState(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");

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
      setStatusMessage(error?.message || t("routing.toast.fetchFailed"));
      setStatusType("error");
    } finally {
      setLoadingRoutes(false);
    }
  };

  useEffect(() => {
    fetchRoutingConfigs();
  }, []);

  const handleAddNewRule = () => {
    const newRule = activeTab === "A2S" ? createA2SRule() : createS2ARule();
    if (activeTab === "A2S") {
      setA2sRules((prev) => [newRule, ...prev]);
    } else {
      setS2aRules((prev) => [newRule, ...prev]);
    }
    handleEditRule(newRule); // Tự động mở edit mode cho rule mới
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

  const handleDeleteRule = (rule) => {
    setDeleteRule(rule);
    setShowDeleteModal(true);
    setDeletePassword("");
    setDeleteError("");
  };

  const handleConfirmDelete = async () => {
    if (deletePassword !== "1") {
      setDeleteError(t("routing.modal.deleteError"));
      return;
    }
    try {
      await gatewayApi.deleteRouting(deleteRule.id);
      if (activeTab === "A2S") {
        handleRemoveA2sRule(deleteRule.id);
      } else {
        handleRemoveS2aRule(deleteRule.id);
      }

      showSuccessToast(t("routing.toast.deleteSuccess"), toast);
      setStatusMessage(`✓ Rule ${deleteRule.id} ${t("routing.toast.deleteSuccess")}`);
      setStatusType("success");
      setShowDeleteModal(false);
      setDeleteRule(null);
      setDeletePassword("");
    }
    catch (error) {
      console.error("Error when delete rule:", error);
      setDeleteError(error.message || t("routing.toast.deleteFailed"));
      showErrorToast(`${t("routing.toast.deleteFailed")}${error.message || t("routing.toast.deleteFailed")}`, toast);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteRule(null);
    setDeletePassword("");
    setDeleteError("");
  };

  const getTopicName = (rule) => {
    if (!rule) return "";
    return activeTab === "A2S" ? (rule.sendTopic || rule.topic || "No Topic") : (rule.receiveTopic || rule.topic || "No Topic");
  };

  const handleEditRule = (rule) => {
    setEditingRule(rule);
    setOriginatorError("");
    if (activeTab === "A2S") {
      setEditFormData({
        id: rule.id,
        direction: "OUT",
        msgType: rule.messageType || rule.msgType || "",
        msgTypeList: (rule.messageType || rule.msgType || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        topic: rule.topic || "",
        priorityAmhs: rule.priorityAmhs || "", // A2S uses AMHS priority (SS/DD/FF/GG/KK)
        prioritySwim: rule.prioritySwim?.toString() || "", // A2S uses AMHS priority (SS/DD/FF/GG/KK)
        active: rule.active ?? true,
        note: rule.description || "",
      });
      setMsgTypeInput("");
    } else {
      setEditFormData({
        id: rule.id,
        direction: "IN",
        topic: rule.topic || "",
        receiveTopic: rule.receiveTopic || rule.topic || "",
        sendTopic: rule.sendTopic || "",
        msgFilter: rule.msgType || "",
        recipients: rule.destination || "",
        originator: rule.originator || "",
        priorityAmhs: rule.priorityAmhs || "", // S2A uses SWIM priority (0-9)
        prioritySwim: rule.prioritySwim?.toString() || "", // S2A uses SWIM priority (0-9)
        active: rule.active ?? true,
        note: rule.description || "",
      });
    }
  };

  const handleCloseEdit = () => {
    setEditingRule(null);
    setEditFormData({});
    setMsgTypeInput("");
  };

  const filterRuleList = (rules, mode) => {
    const query = searchQuery.trim().toLowerCase();

    return rules.filter((rule) => {
      if (filterMessageType) {
        const values = (mode === "A2S"
          ? (rule.messageType || rule.msgType || "")
          : (rule.msgType || ""))
          .split(",")
          .map((item) => item.trim().toUpperCase())
          .filter(Boolean);

        if (!values.includes(filterMessageType.toUpperCase())) {
          return false;
        }
      }

      if (filterStatus) {
        const active = Boolean(rule.active);
        if (filterStatus === "Active" && !active) return false;
        if (filterStatus === "Inactive" && active) return false;
      }

      if (query) {
        const haystack = [
          rule.messageType || rule.msgType || "",
          rule.topic || "",
          rule.sendTopic || rule.topic || "",
          rule.originator || "",
          rule.destination || "",
          rule.receiveTopic || "",
          rule.description || rule.note || "",
        ]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(query)) {
          return false;
        }
      }

      return true;
    });
  };

  const displayedA2sRules = useMemo(() => filterRuleList(a2sRules, "A2S"), [a2sRules, filterMessageType, filterStatus, searchQuery]);
  const displayedS2aRules = useMemo(() => filterRuleList(s2aRules, "S2A"), [s2aRules, filterMessageType, filterStatus, searchQuery]);

  const handleEditFormChange = (field, value) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
  };

  const addA2sMsgType = (value) => {
    const normalized = (value || "").toUpperCase().trim();
    if (!normalized) return;

    setEditFormData((prev) => {
      const list = Array.from(new Set([...(prev.msgTypeList || []), normalized]));
      return { ...prev, msgTypeList: list };
    });
    setMsgTypeInput("");
  };

  const removeA2sMsgType = (type) => {
    setEditFormData((prev) => ({
      ...prev,
      msgTypeList: (prev.msgTypeList || []).filter((item) => item !== type),
    }));
  };

  const handleA2sMsgTypeKeyDown = (event) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addA2sMsgType(msgTypeInput);
    }
  };

  const handleSaveEditRule = async () => {
    if (!editingRule) return;

    const updatedData = { ...editFormData, updatedAt: createTimestamp() };

    const msgTypeValue = Array.isArray(updatedData.msgTypeList)
      ? updatedData.msgTypeList.join(",")
      : updatedData.msgType;

    if (activeTab === "A2S") {
      // A2S uses AMHS priority (SS/DD/FF/GG/KK)
      handleChangeA2sRule(editingRule.id, "msgType", msgTypeValue);
      handleChangeA2sRule(editingRule.id, "messageType", msgTypeValue);
      handleChangeA2sRule(editingRule.id, "topic", updatedData.topic);
      handleChangeA2sRule(editingRule.id, "priority", updatedData.priority); // Store as AMHS priority
      handleChangeA2sRule(editingRule.id, "active", updatedData.active);
      handleChangeA2sRule(editingRule.id, "description", updatedData.note);
    } else {
      // S2A uses SWIM priority (0-9)
      handleChangeS2aRule(editingRule.id, "receiveTopic", updatedData.receiveTopic ?? updatedData.topic);
      handleChangeS2aRule(editingRule.id, "topic", updatedData.receiveTopic ?? updatedData.topic);
      handleChangeS2aRule(editingRule.id, "sendTopic", updatedData.sendTopic);
      handleChangeS2aRule(editingRule.id, "msgType", updatedData.msgFilter);
      handleChangeS2aRule(editingRule.id, "destination", updatedData.recipients);
      handleChangeS2aRule(editingRule.id, "originator", updatedData.originator);
      handleChangeS2aRule(editingRule.id, "prioritySwim", updatedData.prioritySwim); // Store as SWIM priority
      handleChangeS2aRule(editingRule.id, "priorityAmhs", updatedData.priorityAmhs); // Store as AMHS priority
      handleChangeS2aRule(editingRule.id, "active", updatedData.active);
      handleChangeS2aRule(editingRule.id, "description", updatedData.note);
    }

    try {
      if (Number.isFinite(updatedData.id)) {
        await gatewayApi.updateRouting(updatedData.id, updatedData);
      } else {
        await gatewayApi.createRouting(updatedData);
      }

      showSuccessToast(t("routing.toast.saveSuccess"), toast);
      setStatusMessage(`✓ Rule ${editingRule.id} ${t("routing.toast.saveSuccess")}`);
      setStatusType("success");
      handleCloseEdit();
    } catch (error) {
      showErrorToast(`${t("routing.toast.saveFailed")}${error.message || t("routing.toast.saveFailed")}`, toast);
      console.error("Error when save rule:", error);
      setStatusMessage(error.message || t("routing.toast.saveFailed"));
      setStatusType("error");
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full bg-slate-100 text-slate-900 p-6 overflow-y-auto custom-scrollbar">

        {/* Header Area */}
        {/* <div className="flex justify-between items-center mb-6"> */}
          {/* <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200">
              <ArrowRightLeft size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Gateway Routing Engine</h1>
              <p className="text-xs text-slate-500 font-medium">Configure message transformation and flow rules</p>
            </div>
          </div> */}

          {/* <button
            // onClick={handleSaveAll}
            disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-6 py-2.5 rounded-lg font-bold text-sm transition-all shadow-md active:scale-95"
          >
            <Save size={18} /> {saving ? "SAVING..." : "SAVE ALL CONFIGURATIONS"}
          </button> */}
        {/* </div> */}

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
        <div className="flex gap-2 mb-6 bg-slate-200 bg-opacity-50 p-1 rounded-xl w-fit border border-slate-200">
          <button
            onClick={() => {
              setActiveTab("A2S");
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === "A2S" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <ArrowUpRight size={16} /> {t("routing.tabs.a2s")}
          </button>
          <button
            onClick={() => {
              setActiveTab("S2A");
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === "S2A" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <ArrowDownLeft size={16} /> {t("routing.tabs.s2a")}
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex gap-6 h-full">
          {/* Left Panel - Table (Full Width) */}
          <div className="flex-1 panel overflow-hidden">
            <div className="border-b border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wider">
                  {activeTab === "A2S" ? t("routing.title.a2s") : t("routing.title.s2a")}
                </h2>
                <button
                  onClick={handleAddNewRule}
                  disabled={loadingRoutes}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-md active:scale-95"
                >
                  <Plus size={16} /> {t("routing.buttons.addRule")}
                </button>
              </div>

              {/* Filter Section */}
              <div className="flex items-center gap-4 bg-slate-50 p-3 rounded mb-4">
                <div className="flex items-center gap-2">
                  <Search size={16} className="text-slate-500" />
                  <span className="text-sm font-medium text-slate-600">{t("routing.filter.title")}</span>
                  <select
                    value={filterMessageType}
                    onChange={(e) => setFilterMessageType(e.target.value)}
                    className="px-3 py-1 border border-slate-300 rounded text-sm bg-white"
                  >
                    <option value="">{t("routing.filter.allMessageTypes")}</option>
                    <option value="METAR">METAR</option>
                    <option value="TAF">TAF</option>
                    <option value="FPL">FPL</option>
                    <option value="NOTAM">NOTAM</option>
                    <option value="SIGMET">SIGMET</option>
                    <option value="AIRMET">AIRMET</option>
                    <option value="DEP">DEP</option>
                    <option value="ARR">ARR</option>
                    <option value="DLA">DLA</option>
                    <option value="CNL">CNL</option>
                    <option value="CHG">CHG</option>
                  </select>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-1 border border-slate-300 rounded text-sm bg-white"
                  >
                    <option value="">{t("routing.filter.allStatus")}</option>
                    <option value="Active">{t("routing.filter.active")}</option>
                    <option value="Inactive">{t("routing.filter.inactive")}</option>
                  </select>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t("routing.filter.searchPlaceholder")}
                    className="px-3 py-1 border border-slate-300 rounded text-sm bg-white min-w-[200px]"
                  />
                  <button
                    type="button"
                    onClick={() => {}}
                    className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
                  >
                    {t("routing.filter.searchButton")}
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <SimpleBar autoHide={false} style={{ height: '70vh', paddingRight: '5px' }}>
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">{t("routing.table.id")}</th>
                    {activeTab === "A2S" ? (
                      <>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">{t("routing.table.messageType")}</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">{t("routing.table.sendTopic")}</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">{t("routing.table.priority")}</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">{t("routing.table.active")}</th>
                      </>
                    ) : (
                      <>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">{t("routing.table.receiveTopic")}</th>
                        {/* <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Message Filter</th> */}
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">{t("routing.table.recipients")}</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">{t("routing.table.originator")}</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">{t("routing.table.priority")}</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">{t("routing.table.active")}</th>
                      </>
                    )}
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">{t("routing.table.action")}</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTab === "A2S" ? (
                    displayedA2sRules.map((rule, index) => (
                      <tr 
                        key={rule.id} 
                        className="cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={() => handleEditRule(rule)}
                      >
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">{rule.id}</td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">{rule.messageType || rule.msgType}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 font-mono">{rule.sendTopic || rule.topic}</td>
                        <td className="px-4 py-3 text-sm font-medium text-indigo-600">{formatPriorityDisplay(rule, false)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            rule.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {rule.active ? t("routing.status.on") : t("routing.status.off")}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteRule(rule);
                              }}
                              className="text-red-600 hover:text-red-800 p-1"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    displayedS2aRules.map((rule, index) => (
                      <tr 
                        key={rule.id} 
                        className="cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={() => handleEditRule(rule)}
                      >
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">{rule.id}</td>
                        <td className="px-4 py-3 text-sm text-slate-900 font-mono">{rule.receiveTopic}</td>
                        {/* <td className="px-4 py-3 text-sm font-medium text-slate-900">{rule.msgType}</td> */}
                        <td className="px-4 py-3 text-sm text-slate-900 font-mono">{rule.destination}</td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">{rule.originator}</td>
                        <td className="px-4 py-3 text-sm font-medium text-indigo-600">{formatPriorityDisplay(rule, true)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            rule.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {rule.active ? t("routing.status.on") : t("routing.status.off")}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteRule(rule);
                              }}
                              className="text-red-600 hover:text-red-800 p-1"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </SimpleBar>
          </div>
        </div>
      </div>

      {/* Rule Editor Modal */}
      {editingRule && (
        <div className="fixed inset-0 bg-[#0000001a] bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[50%] max-h-[90vh] overflow-y-auto shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 sticky top-0 bg-white">
              <h3 className="text-lg font-bold text-slate-800">
                {t("routing.modal.editTitle")}{activeTab === "A2S" ? t("routing.tabs.a2s") : t("routing.tabs.s2a")}
              </h3>
              <button
                onClick={handleCloseEdit}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              {activeTab === "A2S" ? (
                // A2S (OUT) Form
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {t("routing.form.a2s.messageType.label")}
                    </label>
                    <div className="border border-slate-300 rounded px-3 py-2 bg-white">
                      <div className="flex flex-wrap gap-2 mb-2">
                        {(editFormData.msgTypeList || []).map((type) => (
                          <span
                            key={type}
                            className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 text-xs font-medium px-2 py-1 rounded-full"
                          >
                            {type}
                            <button
                              type="button"
                              onClick={() => removeA2sMsgType(type)}
                              className="text-indigo-700 hover:text-indigo-900"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          list="a2s-msg-types"
                          value={msgTypeInput}
                          onChange={(e) => setMsgTypeInput(e.target.value)}
                          onKeyDown={handleA2sMsgTypeKeyDown}
                          placeholder={t("routing.form.a2s.messageType.placeholder")}
                          className="flex-1 px-2 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => addA2sMsgType(msgTypeInput)}
                          className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                          {t("routing.form.a2s.messageType.addButton")}
                        </button>
                      </div>
                      <datalist id="a2s-msg-types">
                        {A2S_MESSAGE_TYPES.map((type) => (
                          <option key={type} value={type} />
                        ))}
                      </datalist>
                      <p className="mt-2 text-xs text-slate-500">
                        {t("routing.form.a2s.messageType.hint")}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {t("routing.form.a2s.sendTopic.label")}
                    </label>
                    <input
                      type="text"
                      value={editFormData.topic || ""}
                      onChange={(e) => handleEditFormChange("topic", e.target.value)}
                      placeholder={t("routing.form.a2s.sendTopic.placeholder")}
                      className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {t("routing.form.a2s.priority.label")}
                    </label>
                    <select
                      value={editFormData.priority || "FF"}
                      onChange={(e) => handleEditFormChange("priority", e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="SS">{t("routing.form.a2s.priority.options.ss")}</option>
                      <option value="DD">{t("routing.form.a2s.priority.options.dd")}</option>
                      <option value="FF">{t("routing.form.a2s.priority.options.ff")}</option>
                      <option value="GG">{t("routing.form.a2s.priority.options.gg")}</option>
                      <option value="KK">{t("routing.form.a2s.priority.options.kk")}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {t("routing.form.common.status.label")}
                    </label>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="status"
                          checked={editFormData.active === true}
                          onChange={() => handleEditFormChange("active", true)}
                          className="mr-2"
                        />
                        {t("routing.form.common.status.active")}
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="status"
                          checked={editFormData.active === false}
                          onChange={() => handleEditFormChange("active", false)}
                          className="mr-2"
                        />
                        {t("routing.form.common.status.inactive")}
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {t("routing.form.common.note.label")}
                    </label>
                    <textarea
                      value={editFormData.note || ""}
                      onChange={(e) => handleEditFormChange("note", e.target.value)}
                      placeholder={t("routing.form.a2s.note.placeholder")}
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </>
              ) : (
                // S2A (IN) Form
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {t("routing.form.s2a.receiveTopic.label")}
                    </label>
                    <input
                      type="text"
                      value={editFormData.receiveTopic || editFormData.topic || ""}
                      onChange={(e) => handleEditFormChange("receiveTopic", e.target.value)}
                      placeholder={t("routing.form.s2a.receiveTopic.placeholder")}
                      className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {t("routing.form.s2a.messageFilter.label")}
                    </label>
                    <input
                      type="text"
                      value={editFormData.msgFilter || ""}
                      onChange={(e) => handleEditFormChange("msgFilter", e.target.value)}
                      placeholder={t("routing.form.s2a.messageFilter.placeholder")}
                      className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {t("routing.form.s2a.recipients.label")}
                    </label>
                    <textarea
                      value={editFormData.recipients || ""}
                      onChange={(e) => handleEditFormChange("recipients", e.target.value)}
                      placeholder={t("routing.form.s2a.recipients.placeholder")}
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {t("routing.form.s2a.originator.label")}
                    </label>
                    <input
                      type="text"
                      value={editFormData.originator || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        handleEditFormChange("originator", value);
                        if (value && value.length !== 8) {
                          setOriginatorError(t("routing.form.s2a.originator.error"));
                        } else {
                          setOriginatorError("");
                        }
                      }}
                      placeholder={t("routing.form.s2a.originator.placeholder")}
                      className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        originatorError ? "border-red-500" : "border-slate-300"
                      }`}
                    />
                    {originatorError && (
                      <p className="text-red-600 text-sm mt-1 font-medium">{originatorError}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {t("routing.form.s2a.priority.label")}
                    </label>
                    <select
                      value={editFormData.prioritySwim || "Unset"}
                      onChange={(e) => handleEditFormChange("prioritySwim", e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {SWIM_PRIORITIES.map((p) => (
                        <option key={p} value={p}>
                          {t(`routing.form.s2a.priority.options.${p}`)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {t("routing.form.common.status.label")}
                    </label>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="status"
                          checked={editFormData.active === true}
                          onChange={() => handleEditFormChange("active", true)}
                          className="mr-2"
                        />
                        {t("routing.form.common.status.active")}
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="status"
                          checked={editFormData.active === false}
                          onChange={() => handleEditFormChange("active", false)}
                          className="mr-2"
                        />
                        {t("routing.form.common.status.inactive")}
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      {t("routing.form.common.note.label")}
                    </label>
                    <textarea
                      value={editFormData.note || ""}
                      onChange={(e) => handleEditFormChange("note", e.target.value)}
                      placeholder={t("routing.form.s2a.note.placeholder")}
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  onClick={handleCloseEdit}
                  className="px-4 py-2 text-slate-600 border border-slate-300 rounded hover:bg-slate-50"
                >
                  {t("routing.buttons.cancel")}
                </button>
                <button
                  onClick={handleSaveEditRule}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  {t("routing.buttons.saveRule")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-[#0000001a] bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-bold text-slate-800 mb-4">
              {t("routing.modal.deleteTitle")}{deleteRule?.id}
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              {t("routing.modal.deleteMessage")}<br />
              {t("routing.modal.topicLabel")}<strong>{getTopicName(deleteRule)}</strong> 
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t("routing.modal.passwordLabel")}
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder={t("routing.modal.passwordPlaceholder")}
              />
              {deleteError && (
                <p className="text-red-600 text-sm mt-1">{deleteError}</p>
              )}
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 text-slate-600 border border-slate-300 rounded hover:bg-slate-50"
              >
                {t("routing.buttons.cancel")}
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                {t("routing.buttons.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

// --- SUB-COMPONENTS ---

export default RoutingView;