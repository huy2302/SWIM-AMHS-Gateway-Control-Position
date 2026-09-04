import React, { useEffect, useMemo, useState, memo } from "react";
import { createPortal } from "react-dom";
import DashboardLayout from "../../layout/DashboardLayout";
import TablePagination from "@/components/TablePagination";
import gatewayApi from "../../api/gatewayApi";
import authApi from "../../api/authApi";
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
  recipients: "",
  topic: "",
  sendTopic: "",
  priority: 100,
  active: true,
  createdAt: createTimestamp(),
  updatedAt: createTimestamp(),
});

// Gợi ý địa chỉ AFTN cho ô nhập - chỉ là danh sách gợi ý, người dùng gõ địa chỉ khác vẫn được.
// Lấy từ các recipient đã xuất hiện thực tế trong gwout_dispatch.
const A2S_KNOWN_RECIPIENTS = [
  "VVTSZTZX",
  "VVNBZTZX",
  "VVHHZTZX",
  "VVHHZPZX",
  "VVTSOPTB",
  "VVTSMHSA",
  "VVTSSWIM",
];


const createS2ARule = () => ({
  id: `s2a-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
  topic: "",
  receiveTopic: "",
  sendTopic: "",
  domain: "",
  msgType: "",
  destination: "",
  priority: 100,
  filingTime: "CURRENT_TIME",
  active: true,
  description: "",
  note: "",
  createdBy: "",
  createdAt: createTimestamp(),
  updatedAt: createTimestamp(),
});

const normalizeA2sApiRule = (rule) => ({
  id: rule.id || `a2s-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
  direction: "OUT",
  recipients: rule.recipients ?? "",
  topic: rule.sendTopic ?? rule.swimTopic ?? rule.topic ?? "",
  sendTopic: rule.sendTopic ?? rule.swimTopic ?? rule.topic ?? "",
  priority: rule.priority ?? 100,
  active: rule.enabled ?? rule.active ?? false,
  description: rule.note ?? rule.description ?? "",
  note: rule.note ?? "",
  createdAt: rule.createdAt ?? rule.created_at ?? null,
  updatedAt: rule.updatedAt ?? rule.updated_at ?? null,
});

const normalizeS2aApiRule = (rule) => ({
  id: rule.id || `s2a-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
  direction: "IN",
  topic: rule.receiveTopic ?? rule.swimTopic ?? rule.topic ?? "",
  receiveTopic: rule.receiveTopic ?? rule.swimTopic ?? rule.topic ?? "",
  sendTopic: rule.sendTopic ?? rule.amhsTopic ?? "",
  domain: rule.swimDomain ?? rule.domain ?? "",
  msgType: rule.messageType ?? rule.msgType ?? "",
  destination: rule.recipients ?? rule.amhsDestination ?? rule.destination ?? "",
  priority: rule.priority ?? 100,
  filingTime: rule.amhsFilingTimeMode ?? rule.filingTime ?? "CURRENT_TIME",
  active: rule.enabled ?? rule.active ?? false,
  description: rule.note ?? rule.description ?? "",
  createdBy: rule.createdBy ?? rule.created_by ?? "",
  createdAt: rule.createdAt ?? rule.created_at ?? null,
  updatedAt: rule.updatedAt ?? rule.updated_at ?? null,
});

const RoutingView = () => {
  const [activeTab, setActiveTab] = useState("A2S"); // S2A (SWIM to AMHS) là quan trọng hơn
  const [a2sRules, setA2sRules] = useState([]);
  const [s2aRules, setS2aRules] = useState([]);
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [statusType, setStatusType] = useState(null);
  const [editingRule, setEditingRule] = useState(null); // Rule đang được edit
  const [editFormData, setEditFormData] = useState({}); // Data của form edit
  const [recipientInput, setRecipientInput] = useState("");
  const [filterMessageType, setFilterMessageType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
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
      console.log("Fetched routing configs:", a2s);
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

  const user = JSON.parse(localStorage.getItem('user'));

  const handleConfirmDelete = async () => {
    if (!deletePassword?.trim()) {
      setDeleteError(t("routing.modal.deleteError"));
      return;
    }

    try {
      const isPasswordValid = await authApi.verifyPassword(user.userId, deletePassword);
      if (!isPasswordValid) {
        setDeleteError(t("routing.modal.deleteError"));
        return;
      }

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
    if (activeTab === "A2S") {
      setEditFormData({
        id: rule.id,
        direction: "OUT",
        recipientList: (rule.recipients || "")
          .split(/[,;\s]+/)
          .map((item) => item.trim())
          .filter(Boolean),
        topic: rule.topic || "",
        priority: rule.priority ?? 100,
        active: rule.active ?? true,
        note: rule.description || "",
      });
      setRecipientInput("");
    } else {
      setEditFormData({
        id: rule.id,
        direction: "IN",
        receiveTopic: rule.receiveTopic || rule.topic || "",
        recipients: rule.destination || "",
        priority: rule.priority ?? 100,
        active: rule.active ?? true,
        note: rule.description || "",
      });
    }
  };

  const handleCloseEdit = () => {
    // Rule mới thêm (handleAddNewRule) đã được chèn thẳng vào a2sRules/s2aRules để mở edit mode
    // ngay lập tức — nếu người dùng huỷ trước khi lưu, phải gỡ nó ra, nếu không sẽ để lại 1 dòng
    // rỗng "ma" trên bảng (chưa từng tồn tại ở BE) cho tới khi F5.
    if (editingRule && !Number.isFinite(editingRule.id)) {
      if (activeTab === "A2S") {
        handleRemoveA2sRule(editingRule.id);
      } else {
        handleRemoveS2aRule(editingRule.id);
      }
    }
    setEditingRule(null);
    setEditFormData({});
    setRecipientInput("");
  };

  const filterRuleList = (rules, mode) => {
    const query = searchQuery.trim().toLowerCase();

    return rules.filter((rule) => {
      // Rule A2S định tuyến theo địa chỉ recipient nên không còn message type để lọc;
      // bộ lọc này chỉ còn ý nghĩa với chiều S2A.
      if (filterMessageType && mode !== "A2S") {
        const values = (rule.msgType || "")
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
          rule.recipients || "",
          rule.messageType || rule.msgType || "",
          rule.topic || "",
          rule.sendTopic || rule.topic || "",
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

  const addA2sRecipient = (value) => {
    const normalized = (value || "").toUpperCase().trim();
    if (!normalized) return;

    setEditFormData((prev) => {
      const list = Array.from(new Set([...(prev.recipientList || []), normalized]));
      return { ...prev, recipientList: list };
    });
    setRecipientInput("");
  };

  const removeA2sRecipient = (type) => {
    setEditFormData((prev) => ({
      ...prev,
      recipientList: (prev.recipientList || []).filter((item) => item !== type),
    }));
  };

  const handleA2sRecipientKeyDown = (event) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addA2sRecipient(recipientInput);
    }
  };

  const handleSaveEditRule = async () => {
    if (!editingRule) return;

    // Chỉ gửi đúng field thật mà form hiện có UI cho sửa (PUT/POST đều optional-field,
    // field nào không có UI thì bỏ qua để không ghi đè giá trị đang có trên BE bằng dữ liệu cũ/rỗng).
    const payload = {
      direction: editFormData.direction,
      active: editFormData.active,
      note: editFormData.note || "",
      priority: Number(editFormData.priority) || 100,
    };

    if (activeTab === "A2S") {
      payload.recipients = (editFormData.recipientList || []).join(",");
      payload.sendTopic = editFormData.topic || "";
    } else {
      payload.receiveTopic = editFormData.receiveTopic || "";
      payload.recipients = editFormData.recipients || "";
    }

    try {
      if (Number.isFinite(editFormData.id)) {
        await gatewayApi.updateRouting(editFormData.id, payload);
      } else {
        await gatewayApi.createRouting(payload);
      }

      showSuccessToast(t("routing.toast.saveSuccess"), toast);
      setStatusMessage(`✓ Rule ${editingRule.id} ${t("routing.toast.saveSuccess")}`);
      setStatusType("success");
      // Đóng edit mode trực tiếp (không qua handleCloseEdit) vì rule đã lưu thành công,
      // không còn là draft cần dọn nữa.
      setEditingRule(null);
      setEditFormData({});
      setRecipientInput("");
      // Refetch từ BE thay vì tin state local: rule mới tạo đang mang id giả (client-generated),
      // nếu không đồng bộ lại, sửa/xoá tiếp rule đó ngay sau khi tạo sẽ gọi API bằng id sai.
      await fetchRoutingConfigs();
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
            <h2 className="text-xs font-bold text-slate-650 tracking-wider">
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
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200/80 font-bold tracking-wider">
                <tr>
                  <th className="p-3.5">{t("routing.table.id")}</th>
                  {activeTab === "A2S" ? (
                    <>
                      <th className="p-3.5">{t("routing.table.recipients")}</th>
                      <th className="p-3.5">{t("routing.table.sendTopic")}</th>
                      <th className="p-3.5">{t("routing.table.note")}</th>
                      <th className="p-3.5">{t("routing.table.priority")}</th>
                      <th className="p-3.5">{t("routing.table.active")}</th>
                    </>
                  ) : (
                    <>
                      <th className="p-3.5">{t("routing.table.receiveTopic")}</th>
                      <th className="p-3.5">{t("routing.table.recipients")}</th>
                      <th className="p-3.5">{t("routing.table.messageType")}</th>
                      <th className="p-3.5">{t("routing.table.note")}</th>
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
                      <td className="p-3.5 text-slate-600 font-mono font-bold text-indigo-600">{rule.recipients || "-"}</td>
                      <td className="p-3.5 text-slate-600 font-mono">{rule.sendTopic || rule.topic}</td>
                      <td className="p-3.5 text-slate-600 max-w-[220px] truncate" title={rule.description || rule.note || ""}>{rule.description || rule.note || "-"}</td>
                      <td className="p-3.5 font-semibold text-indigo-650">{rule.priority ?? 100}</td>
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
                      onDoubleClick={() => handleEditRule(rule)}
                    >
                      <td className="p-3.5 font-bold text-slate-900">{rule.id}</td>
                      <td className="p-3.5 text-slate-600 font-mono">{rule.receiveTopic}</td>
                      <td className="p-3.5 text-slate-600 font-mono">{rule.destination}</td>
                      <td className="p-3.5 text-slate-700">{rule.msgType || "-"}</td>
                      <td className="p-3.5 text-slate-600 max-w-[220px] truncate" title={rule.description || rule.note || ""}>{rule.description || rule.note || "-"}</td>
                      <td className="p-3.5 font-semibold text-indigo-650">{rule.priority ?? 100}</td>
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

      <RuleEditorModal
        activeTab={activeTab}
        editingRule={editingRule}
        editFormData={editFormData}
        recipientInput={recipientInput}
        setRecipientInput={setRecipientInput}
        handleCloseEdit={handleCloseEdit}
        handleEditFormChange={handleEditFormChange}
        handleA2sRecipientKeyDown={handleA2sRecipientKeyDown}
        addA2sRecipient={addA2sRecipient}
        removeA2sRecipient={removeA2sRecipient}
        handleSaveEditRule={handleSaveEditRule}
        t={t}
      />

      <DeleteConfirmModal
        showDeleteModal={showDeleteModal}
        deleteRule={deleteRule}
        deletePassword={deletePassword}
        deleteError={deleteError}
        getTopicName={getTopicName}
        setDeletePassword={setDeletePassword}
        handleCancelDelete={handleCancelDelete}
        handleConfirmDelete={handleConfirmDelete}
        t={t}
      />
    </DashboardLayout>
  );
};

// --- SUB-COMPONENTS ---

const DeleteConfirmModal = memo(({
  showDeleteModal,
  deleteRule,
  deletePassword,
  deleteError,
  getTopicName,
  setDeletePassword,
  handleCancelDelete,
  handleConfirmDelete,
  t,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() => setIsVisible(true));

    return () => {
      document.body.style.overflow = previousOverflow;
      cancelAnimationFrame(frame);
    };
  }, []);

  if (!showDeleteModal) return null;

  return createPortal(
    <div className={`fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs ${isVisible ? "opacity-100" : "opacity-0"}`}>
      <div className={`w-full max-w-sm rounded-2xl border border-slate-200/60 bg-white p-6 shadow-[0_10px_40px_rgba(15,23,42,0.16)] flex flex-col gap-4 will-change-transform ${isVisible ? "translate-y-0" : "translate-y-2"}`}>
        <div>
          <h3 className="text-sm font-bold text-slate-800 tracking-wider mb-2">
            {t("routing.modal.deleteTitle")}{deleteRule?.id}
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            {t("routing.modal.deleteMessage")}<br />
            {t("routing.modal.topicLabel")}<strong>{getTopicName(deleteRule)}</strong>
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-450 tracking-wider">
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
    </div>,
    document.body
  );
});

const RuleEditorModal = memo(({
  activeTab,
  editingRule,
  editFormData,
  recipientInput,
  setRecipientInput,
  handleCloseEdit,
  handleEditFormChange,
  handleA2sRecipientKeyDown,
  addA2sRecipient,
  removeA2sRecipient,
  handleSaveEditRule,
  t,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() => setIsVisible(true));

    return () => {
      document.body.style.overflow = previousOverflow;
      cancelAnimationFrame(frame);
    };
  }, []);

  if (!editingRule) return null;

  const isEdit = Number.isFinite(editFormData.id);

  return createPortal(
    <div className={`fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[60] p-4 transition-opacity duration-200 ${isVisible ? "opacity-100" : "opacity-0"}`}>
      <div className={`bg-white rounded-2xl w-full max-w-lg max-h-[90vh] shadow-xl border border-slate-200 flex flex-col transition-all duration-200 overflow-hidden ${isVisible ? "translate-y-0 scale-100" : "translate-y-2 scale-[0.99]"}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
          <h3 className="text-xs font-bold text-slate-800 tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600" />
            {isEdit ? t("routing.modal.editTitle") : t("routing.buttons.addRule")} - {activeTab === "A2S" ? "OUT (AMHS → SWIM)" : "IN (SWIM → AMHS)"}
          </h3>
          <button
            onClick={handleCloseEdit}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar text-xs">
          {activeTab === "A2S" ? (
            <>
              {/* Recipients (địa chỉ AFTN người nhận) */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-600 tracking-wider">
                  {t("routing.form.a2s.recipients.label")} *
                </label>
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {(editFormData.recipientList || []).map((type) => (
                      <span
                        key={type}
                        className="inline-flex items-center gap-1.5 bg-white text-indigo-700 font-bold px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs"
                      >
                        {type}
                        <button
                          type="button"
                          onClick={() => removeA2sRecipient(type)}
                          className="text-slate-400 hover:text-red-600 font-bold cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      list="a2s-recipients"
                      value={recipientInput}
                      onChange={(e) => setRecipientInput(e.target.value)}
                      onKeyDown={handleA2sRecipientKeyDown}
                      placeholder={t("routing.form.a2s.recipients.placeholder")}
                      className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => addA2sRecipient(recipientInput)}
                      className="px-3.5 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition cursor-pointer"
                    >
                      {t("routing.form.a2s.recipients.addButton")}
                    </button>
                  </div>
                  <datalist id="a2s-recipients">
                    {A2S_KNOWN_RECIPIENTS.map((type) => (
                      <option key={type} value={type} />
                    ))}
                  </datalist>
                </div>
              </div>
              {/* Send Topic */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-600 tracking-wider">
                  {t("routing.form.a2s.sendTopic.label")} *
                </label>
                <input
                  type="text"
                  value={editFormData.topic || ""}
                  onChange={(e) => handleEditFormChange("topic", e.target.value)}
                  placeholder={t("routing.form.a2s.sendTopic.placeholder")}
                  className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl font-mono outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition text-slate-900"
                />
              </div>

              {/* Priority & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-600 tracking-wider">
                    {t("routing.form.a2s.priority.label")}
                  </label>
                  <input
                    type="number"
                    value={editFormData.priority ?? 100}
                    onChange={(e) => handleEditFormChange("priority", e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl font-semibold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition text-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-600 tracking-wider">
                    {t("routing.form.common.status.label")}
                  </label>
                  <div className="flex items-center space-x-4 p-2 bg-slate-50/50 border border-slate-200 rounded-xl">
                    <label className="flex items-center cursor-pointer font-medium text-slate-700">
                      <input
                        type="radio"
                        name="status-a2s"
                        checked={editFormData.active === true}
                        onChange={() => handleEditFormChange("active", true)}
                        className="mr-1.5 cursor-pointer accent-indigo-600"
                      />
                      {t("routing.form.common.status.active")}
                    </label>
                    <label className="flex items-center cursor-pointer font-medium text-slate-700">
                      <input
                        type="radio"
                        name="status-a2s"
                        checked={editFormData.active === false}
                        onChange={() => handleEditFormChange("active", false)}
                        className="mr-1.5 cursor-pointer accent-slate-500"
                      />
                      {t("routing.form.common.status.inactive")}
                    </label>
                  </div>
                </div>
              </div>

              {/* Note */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-600 tracking-wider">
                  {t("routing.form.common.note.label")}
                </label>
                <textarea
                  value={editFormData.note || ""}
                  onChange={(e) => handleEditFormChange("note", e.target.value)}
                  placeholder={t("routing.form.a2s.note.placeholder")}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition text-slate-900"
                />
              </div>
            </>
          ) : (
            <>
              {/* S2A Form */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-600 tracking-wider">
                  {t("routing.form.s2a.receiveTopic.label")} *
                </label>
                <input
                  type="text"
                  value={editFormData.receiveTopic || editFormData.topic || ""}
                  onChange={(e) => handleEditFormChange("receiveTopic", e.target.value)}
                  placeholder={t("routing.form.s2a.receiveTopic.placeholder")}
                  className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl font-mono outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-600 tracking-wider">
                  {t("routing.form.s2a.recipients.label")} *
                </label>
                <input
                  type="text"
                  value={editFormData.recipients || editFormData.destination || ""}
                  onChange={(e) => handleEditFormChange("recipients", e.target.value)}
                  placeholder={t("routing.form.s2a.recipients.placeholder")}
                  className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl font-mono outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition text-slate-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-600 tracking-wider">
                    {t("routing.form.s2a.priority.label")}
                  </label>
                  <input
                    type="number"
                    value={editFormData.priority ?? 100}
                    onChange={(e) => handleEditFormChange("priority", e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl font-semibold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition text-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-600 tracking-wider">
                    {t("routing.form.common.status.label")}
                  </label>
                  <div className="flex items-center space-x-4 p-2 bg-slate-50/50 border border-slate-200 rounded-xl">
                    <label className="flex items-center cursor-pointer font-medium text-slate-700">
                      <input
                        type="radio"
                        name="status-s2a"
                        checked={editFormData.active === true}
                        onChange={() => handleEditFormChange("active", true)}
                        className="mr-1.5 cursor-pointer accent-indigo-600"
                      />
                      {t("routing.form.common.status.active")}
                    </label>
                    <label className="flex items-center cursor-pointer font-medium text-slate-700">
                      <input
                        type="radio"
                        name="status-s2a"
                        checked={editFormData.active === false}
                        onChange={() => handleEditFormChange("active", false)}
                        className="mr-1.5 cursor-pointer accent-slate-500"
                      />
                      {t("routing.form.common.status.inactive")}
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block font-bold text-slate-600 tracking-wider">
                  {t("routing.form.common.note.label")}
                </label>
                <textarea
                  value={editFormData.note || ""}
                  onChange={(e) => handleEditFormChange("note", e.target.value)}
                  placeholder={t("routing.form.s2a.note.placeholder")}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition text-slate-900"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 flex justify-end gap-2.5 bg-white sticky bottom-0 z-10">
          <button
            onClick={handleCloseEdit}
            className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-semibold transition cursor-pointer"
          >
            {t("routing.buttons.cancel")}
          </button>
          <button
            onClick={handleSaveEditRule}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition cursor-pointer shadow-xs"
          >
            {t("routing.buttons.save")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
});

export default RoutingView;
