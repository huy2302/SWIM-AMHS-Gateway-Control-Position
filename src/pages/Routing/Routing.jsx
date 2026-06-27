import React, { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../layout/DashboardLayout";
import TablePagination from "@/components/TablePagination";
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

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setPage(0);
  }, [activeTab, filterMessageType, filterStatus, searchQuery]);

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
      <div className="flex flex-col gap-4">
        {statusMessage && (
          <div
            className={`rounded-xl px-4 py-3 text-xs font-semibold border transition-all ${
              statusType === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200/60"
                : "bg-rose-50 text-rose-800 border-rose-200/60"
            }`}
          >
            {statusMessage}
          </div>
        )}

        {/* Top Control Bar (Tabs + Add Action) */}
        <div className="flex items-center justify-between bg-white border border-slate-200/80 p-3 rounded-xl shadow-xs gap-4">
          {/* Segmented Control for Tabs */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/60 shadow-xxs">
            <button
              onClick={() => setActiveTab("A2S")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeTab === "A2S"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <ArrowUpRight size={14} />
              <span>{t("routing.tabs.a2s")}</span>
            </button>
            <button
              onClick={() => setActiveTab("S2A")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeTab === "S2A"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <ArrowDownLeft size={14} />
              <span>{t("routing.tabs.s2a")}</span>
            </button>
          </div>

          <button
            onClick={handleAddNewRule}
            disabled={loadingRoutes}
            className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold px-4 py-2 rounded-xl shadow-xs hover:shadow-md active:scale-95 transition-all text-xs cursor-pointer"
          >
            <Plus size={14} />
            <span>{t("routing.buttons.addRule")}</span>
          </button>
        </div>

        {/* Table & Filter Panel Container */}
        <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs flex flex-col">
          {/* Header & Filters row */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-xs font-bold text-slate-650 uppercase tracking-wider">
              {activeTab === "A2S" ? t("routing.title.a2s") : t("routing.title.s2a")}
            </h2>

            {/* Filter Section */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("routing.filter.searchPlaceholder")}
                  className="pl-9 pr-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all min-w-[200px] text-slate-900"
                />
              </div>

              <select
                value={filterMessageType}
                onChange={(e) => setFilterMessageType(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-700 cursor-pointer"
              >
                <option value="">{t("routing.filter.allMessageTypes")}</option>
                <option value="METAR">METAR</option>
                <option value="SPECI">SPECI</option>
                <option value="TAF">TAF</option>
                <option value="SIGMET">SIGMET</option>
                <option value="AIRMET">AIRMET</option>
                <option value="FPL">FPL</option>
                <option value="DEP">DEP</option>
                <option value="ARR">ARR</option>
                <option value="DLA">DLA</option>
                <option value="CNL">CNL</option>
                <option value="CHG">CHG</option>
                <option value="NOTAM">NOTAM</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-700 cursor-pointer"
              >
                <option value="">{t("routing.filter.allStatus")}</option>
                <option value="Active">{t("routing.filter.active")}</option>
                <option value="Inactive">{t("routing.filter.inactive")}</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <SimpleBar autoHide={false} style={{ height: '62vh', paddingRight: '5px' }}>
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200/80 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3.5">{t("routing.table.id")}</th>
                  {activeTab === "A2S" ? (
                    <>
                      <th className="p-3.5">{t("routing.table.messageType")}</th>
                      <th className="p-3.5">{t("routing.table.sendTopic")}</th>
                      <th className="p-3.5">{t("routing.table.priority")}</th>
                      <th className="p-3.5">{t("routing.table.active")}</th>
                    </>
                  ) : (
                    <>
                      <th className="p-3.5">{t("routing.table.receiveTopic")}</th>
                      <th className="p-3.5">{t("routing.table.recipients")}</th>
                      <th className="p-3.5">{t("routing.table.originator")}</th>
                      <th className="p-3.5">{t("routing.table.priority")}</th>
                      <th className="p-3.5">{t("routing.table.active")}</th>
                    </>
                  )}
                  <th className="p-3.5 text-right">{t("routing.table.action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeTab === "A2S" ? (
                  displayedA2sRules.slice(page * pageSize, (page + 1) * pageSize).map((rule, index) => (
                    <tr 
                      key={rule.id} 
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                      onClick={() => handleEditRule(rule)}
                    >
                      <td className="p-3.5 font-bold text-slate-900">{rule.id}</td>
                      <td className="p-3.5 text-slate-700">{rule.messageType || rule.msgType}</td>
                      <td className="p-3.5 text-slate-600 font-mono">{rule.sendTopic || rule.topic}</td>
                      <td className="p-3.5 font-semibold text-indigo-650">{formatPriorityDisplay(rule, false)}</td>
                      <td className="p-3.5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          rule.active ? 'bg-green-50 text-green-700 border-green-200/60' : 'bg-slate-50 text-slate-500 border-slate-200/80'
                        }`}>
                          {rule.active ? t("routing.status.on") : t("routing.status.off")}
                        </span>
                      </td>
                      <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleDeleteRule(rule)}
                          className="text-red-500 hover:text-red-750 p-1 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  displayedS2aRules.slice(page * pageSize, (page + 1) * pageSize).map((rule, index) => (
                    <tr 
                      key={rule.id} 
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                      onClick={() => handleEditRule(rule)}
                    >
                      <td className="p-3.5 font-bold text-slate-900">{rule.id}</td>
                      <td className="p-3.5 text-slate-600 font-mono">{rule.receiveTopic}</td>
                      <td className="p-3.5 text-slate-600 font-mono">{rule.destination}</td>
                      <td className="p-3.5 text-slate-700">{rule.originator}</td>
                      <td className="p-3.5 font-semibold text-indigo-650">{formatPriorityDisplay(rule, true)}</td>
                      <td className="p-3.5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          rule.active ? 'bg-green-50 text-green-700 border-green-200/60' : 'bg-slate-50 text-slate-500 border-slate-200/80'
                        }`}>
                          {rule.active ? t("routing.status.on") : t("routing.status.off")}
                        </span>
                      </td>
                      <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleDeleteRule(rule)}
                          className="text-red-500 hover:text-red-750 p-1 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </SimpleBar>

          <div className="border-t border-slate-100 px-4 py-2">
            <TablePagination
              page={page}
              totalPages={Math.ceil(
                (activeTab === "A2S" ? displayedA2sRules.length : displayedS2aRules.length) / pageSize
              )}
              onPageChange={setPage}
              totalItems={activeTab === "A2S" ? displayedA2sRules.length : displayedS2aRules.length}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
              pageSizeOptions={[5, 10, 20, 50]}
            />
          </div>
        </div>
      </div>

      {/* Rule Editor Modal */}
      {editingRule && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-xl border border-slate-200/50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 sticky top-0 bg-white z-10">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                {t("routing.modal.editTitle")}{activeTab === "A2S" ? t("routing.tabs.a2s") : t("routing.tabs.s2a")}
              </h3>
              <button
                onClick={handleCloseEdit}
                className="text-slate-400 hover:text-slate-655 p-1 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              {activeTab === "A2S" ? (
                // A2S (OUT) Form
                <>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {t("routing.form.a2s.messageType.label")}
                    </label>
                    <div className="border border-slate-200 rounded-xl px-3.5 py-3 bg-slate-50/50">
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {(editFormData.msgTypeList || []).map((type) => (
                          <span
                            key={type}
                            className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-200/50"
                          >
                            {type}
                            <button
                              type="button"
                              onClick={() => removeA2sMsgType(type)}
                              className="text-indigo-550 hover:text-indigo-900 font-extrabold cursor-pointer"
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
                          className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-900"
                        />
                        <button
                          type="button"
                          onClick={() => addA2sMsgType(msgTypeInput)}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer"
                        >
                          {t("routing.form.a2s.messageType.addButton")}
                        </button>
                      </div>
                      <datalist id="a2s-msg-types">
                        {A2S_MESSAGE_TYPES.map((type) => (
                          <option key={type} value={type} />
                        ))}
                      </datalist>
                      <p className="mt-1.5 text-[10px] text-slate-400 font-medium">
                        {t("routing.form.a2s.messageType.hint")}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {t("routing.form.a2s.sendTopic.label")}
                    </label>
                    <input
                      type="text"
                      value={editFormData.topic || ""}
                      onChange={(e) => handleEditFormChange("topic", e.target.value)}
                      placeholder={t("routing.form.a2s.sendTopic.placeholder")}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {t("routing.form.a2s.priority.label")}
                    </label>
                    <select
                      value={editFormData.priority || "FF"}
                      onChange={(e) => handleEditFormChange("priority", e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-700 cursor-pointer"
                    >
                      <option value="SS">{t("routing.form.a2s.priority.options.ss")}</option>
                      <option value="DD">{t("routing.form.a2s.priority.options.dd")}</option>
                      <option value="FF">{t("routing.form.a2s.priority.options.ff")}</option>
                      <option value="GG">{t("routing.form.a2s.priority.options.gg")}</option>
                      <option value="KK">{t("routing.form.a2s.priority.options.kk")}</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {t("routing.form.common.status.label")}
                    </label>
                    <div className="flex items-center space-x-6 text-xs text-slate-700 font-semibold bg-slate-50/50 p-2 border border-slate-100 rounded-lg w-fit">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="status"
                          checked={editFormData.active === true}
                          onChange={() => handleEditFormChange("active", true)}
                          className="mr-2 cursor-pointer"
                        />
                        {t("routing.form.common.status.active")}
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="status"
                          checked={editFormData.active === false}
                          onChange={() => handleEditFormChange("active", false)}
                          className="mr-2 cursor-pointer"
                        />
                        {t("routing.form.common.status.inactive")}
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {t("routing.form.common.note.label")}
                    </label>
                    <textarea
                      value={editFormData.note || ""}
                      onChange={(e) => handleEditFormChange("note", e.target.value)}
                      placeholder={t("routing.form.a2s.note.placeholder")}
                      rows={3}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-900"
                    />
                  </div>
                </>
              ) : (
                // S2A (IN) Form
                <>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {t("routing.form.s2a.receiveTopic.label")}
                    </label>
                    <input
                      type="text"
                      value={editFormData.receiveTopic || editFormData.topic || ""}
                      onChange={(e) => handleEditFormChange("receiveTopic", e.target.value)}
                      placeholder={t("routing.form.s2a.receiveTopic.placeholder")}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {t("routing.form.s2a.messageFilter.label")}
                    </label>
                    <input
                      type="text"
                      value={editFormData.msgFilter || ""}
                      onChange={(e) => handleEditFormChange("msgFilter", e.target.value)}
                      placeholder={t("routing.form.s2a.messageFilter.placeholder")}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {t("routing.form.s2a.recipients.label")}
                    </label>
                    <textarea
                      value={editFormData.recipients || ""}
                      onChange={(e) => handleEditFormChange("recipients", e.target.value)}
                      placeholder={t("routing.form.s2a.recipients.placeholder")}
                      rows={2}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
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
                      className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-900 ${
                        originatorError ? "border-red-500 focus:border-red-555 focus:ring-red-500/10" : "border-slate-200"
                      }`}
                    />
                    {originatorError && (
                      <p className="text-red-650 text-xxs mt-1 font-bold">{originatorError}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {t("routing.form.s2a.priority.label")}
                    </label>
                    <select
                      value={editFormData.prioritySwim || "Unset"}
                      onChange={(e) => handleEditFormChange("prioritySwim", e.target.value)}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-700 cursor-pointer"
                    >
                      {SWIM_PRIORITIES.map((p) => (
                        <option key={p} value={p}>
                          {t(`routing.form.s2a.priority.options.${p}`)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {t("routing.form.common.status.label")}
                    </label>
                    <div className="flex items-center space-x-6 text-xs text-slate-700 font-semibold bg-slate-50/50 p-2 border border-slate-100 rounded-lg w-fit">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="status"
                          checked={editFormData.active === true}
                          onChange={() => handleEditFormChange("active", true)}
                          className="mr-2 cursor-pointer"
                        />
                        {t("routing.form.common.status.active")}
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="status"
                          checked={editFormData.active === false}
                          onChange={() => handleEditFormChange("active", false)}
                          className="mr-2 cursor-pointer"
                        />
                        {t("routing.form.common.status.inactive")}
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                      {t("routing.form.common.note.label")}
                    </label>
                    <textarea
                      value={editFormData.note || ""}
                      onChange={(e) => handleEditFormChange("note", e.target.value)}
                      placeholder={t("routing.form.s2a.note.placeholder")}
                      rows={3}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-900"
                    />
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  onClick={handleCloseEdit}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold active:scale-95 transition-all cursor-pointer"
                >
                  {t("routing.buttons.cancel")}
                </button>
                <button
                  onClick={handleSaveEditRule}
                  className="px-4 py-2 bg-gradient-to-r from-blue-650 to-indigo-650 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl text-xs font-semibold active:scale-95 transition-all cursor-pointer shadow-sm hover:shadow"
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
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm border border-slate-200/50 shadow-xl flex flex-col gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">
                {t("routing.modal.deleteTitle")}{deleteRule?.id}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {t("routing.modal.deleteMessage")}<br />
                {t("routing.modal.topicLabel")}<strong>{getTopicName(deleteRule)}</strong> 
              </p>
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-450 uppercase tracking-wider">
                {t("routing.modal.passwordLabel")}
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-900"
                placeholder={t("routing.modal.passwordPlaceholder")}
              />
              {deleteError && (
                <p className="text-red-650 text-xxs font-bold">{deleteError}</p>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 border border-slate-200 text-slate-650 hover:bg-slate-50 rounded-xl text-xs font-semibold active:scale-95 transition-all cursor-pointer"
              >
                {t("routing.buttons.cancel")}
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold active:scale-95 transition-all cursor-pointer shadow-sm hover:shadow"
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