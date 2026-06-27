import React, { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/layout/DashboardLayout";
import {
  Plus,
  Trash2,
  Edit3,
  Play,
  Square,
  X,
} from "lucide-react";
import gatewayApi from "@/api/gatewayApi";
import ConfirmModal from "@/components/ConfirmModal";
import toast from "react-hot-toast";
import { 
  showSuccessToast, 
  showErrorToast, 
} from '@/constants/toastIcons';
import { t } from "@/i18n/translator";
import TablePagination from "@/components/TablePagination";

export default function Account() {
  const [accounts, setAccounts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [accountStatus, setAccountStatus] = useState("INACTIVE");
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState(null);
  
  // Pagination States
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: "",
    message: "",
    confirmText: "",
    confirmClass: "",
    onConfirm: null,
  });

  const defaultFormState = {
    accountName: "",
    protocol: "AMQP",
    host: "",
    port: 5672,
    configJson: '{"username":"","password":"","vpn":"default"}',
    username: "",
    password: "",
    vpn: "default",
    status: "INACTIVE",
    bindStatus: "DISCONNECTED",
    tlsEnabled: false,
  };

  const [formData, setFormData] = useState(defaultFormState);

  const openConfirmModal = ({
    title,
    message,
    confirmText,
    confirmClass,
    onConfirm,
  }) => {
    setConfirmModal({
      open: true,
      title,
      message,
      confirmText,
      confirmClass,
      onConfirm,
    });
  };
  
  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await gatewayApi.getAccounts();
      setAccounts(response || []); 
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu accounts:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Reset page to 0 if page is out of bounds
  useEffect(() => {
    if (page > 0 && page >= Math.ceil(accounts.length / pageSize)) {
      setPage(0);
    }
  }, [accounts.length, pageSize, page]);

  // --- LOGIC FUNCTIONS ---

  const handleAdd = () => {
    setEditingAccountId(null);
    setFormData(defaultFormState);
    setIsModalOpen(true);
  };

  const handleEdit = () => {
    if (!selectedId) return;
    const account = accounts.find((acc) => acc.id === selectedId);
    if (!account) return;

    const userConfig = JSON.parse(account.configJson || "{}");
    setEditingAccountId(account.id);
    setFormData({
      accountName: account.accountName || "",
      protocol: account.protocol || "AMQP",
      host: account.host || "",
      port: account.port || 5672,
      configJson: account.configJson || '{"username":"","password":"","vpn":"default"}',
      username: userConfig.username || "",
      password: userConfig.password || "",
      vpn: userConfig.vpn || "default",
      status: account.status || "INACTIVE",
      bindStatus: account.bindStatus || "DISCONNECTED",
      tlsEnabled: account.tlsEnabled || false,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (gatewayApi.deleteAccount(id)) {
      setAccounts(accounts.filter(acc => acc.id !== selectedId));
      setSelectedId(null);
      showSuccessToast(t("accounts.toast.deleteSuccess"), toast);
    } else {
      setSelectedId(null);
      showErrorToast(t("accounts.toast.deleteFailed"), toast);
    }
  };

  const handleToggleStatus = (status) => {
    showSuccessToast(
      status === "ACTIVE" 
        ? t("accounts.toast.enableSuccess") 
        : t("accounts.toast.disableSuccess"), 
      toast
    );
    setAccounts(accounts.map(acc => 
      acc.id === selectedId ? { ...acc, status } : acc
    ));
    setAccountStatus(status);
  };

  const handleSaveAccount = async (e) => {
    e.preventDefault();
    setLoading(true);

    const configJson = JSON.stringify({
      username: formData.username,
      password: formData.password,
      vpn: formData.vpn,
    });

    const savedAccount = {
      id: editingAccountId || Date.now(),
      accountName: formData.accountName,
      protocol: formData.protocol,
      host: formData.host,
      port: Number(formData.port),
      configJson: configJson,
      status: formData.status,
      bindStatus: formData.bindStatus,
      tlsEnabled: formData.tlsEnabled,
    };

    try {
      if (editingAccountId) {
        const response = await gatewayApi.updateAccount(editingAccountId, savedAccount);
        const updatedAccount = response?.data ?? response ?? savedAccount;

        setAccounts(accounts.map((acc) => 
          acc.id === editingAccountId ? updatedAccount : acc
        ));

        showSuccessToast(t("accounts.toast.updateSuccess"), toast);
      } else {
        const response = await gatewayApi.createAccount(savedAccount);
        const createdAccount = response?.data ?? response ?? savedAccount;
        setAccounts([...accounts, createdAccount]);
        showSuccessToast(t("accounts.toast.createSuccess") || "Account created successfully", toast);
      }

      setIsModalOpen(false);
      setEditingAccountId(null);
    } catch (error) {
      console.error("Lỗi khi lưu account:", error);
      showErrorToast(error?.message || t("accounts.toast.saveError"), toast);
    } finally {
      setLoading(false);
    }
  };

  const displayedAccounts = accounts.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <DashboardLayout>
      <div className="flex h-full bg-slate-100 text-slate-900 p-6 gap-6 relative min-h-[70vh]">
        {loading && loadingOverlay(true)}
        
        {/* LEFT COLUMN: LIST TABLE */}
        <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs relative">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="px-4 py-3.5 font-semibold text-xs">{t("accounts.table.accountName")}</th>
                  <th className="px-4 py-3.5 font-semibold text-xs">{t("accounts.table.protocol")}</th>
                  <th className="px-4 py-3.5 font-semibold text-xs">{t("accounts.table.status")}</th>
                  <th className="px-4 py-3.5 font-semibold text-xs">{t("accounts.table.bindStatus")}</th>
                  <th className="px-4 py-3.5 font-semibold text-xs">{t("accounts.table.host")}</th>
                  <th className="px-4 py-3.5 font-semibold text-xs">{t("accounts.table.port")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400 font-medium">
                      No accounts configured.
                    </td>
                  </tr>
                ) : (
                  displayedAccounts.map((acc) => (
                    <tr
                      key={acc.id}
                      onClick={() => {
                        setSelectedId(acc.id);
                        setAccountStatus(acc.status);
                      }}
                      className={`cursor-pointer transition-all duration-150 ${
                        selectedId === acc.id
                          ? "bg-blue-50/80 ring-1 ring-blue-200/50"
                          : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <td className={`px-4 py-3.5 flex items-center gap-2.5 ${acc.status === "ACTIVE" ? "text-emerald-600" : "text-gray-400"}`}>
                        <div className={`w-2 h-2 rounded-full ${acc.status === "ACTIVE" ? "bg-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.2)]" : "bg-gray-300"}`} />
                        <span className="font-semibold">{acc.accountName}</span>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-700">
                        {acc.protocol === "AMQP" ? t("accounts.protocols.amqp") : t("accounts.protocols.mqtt")}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          acc.status === "ACTIVE" 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50" 
                            : "bg-slate-50 text-slate-500 border border-slate-200"
                        }`}>
                          {acc.status === "ACTIVE" ? t("accounts.statuses.active") : t("accounts.statuses.inactive")}
                        </span>
                      </td>
                      <td className={`px-4 py-3.5 font-bold text-[11px] ${
                        acc.bindStatus === "CONNECTED" 
                          ? "text-emerald-600" 
                          : acc.bindStatus === "DISCONNECTED" 
                            ? "text-slate-400" 
                            : "text-amber-600"
                      }`}>
                        {acc.bindStatus === "CONNECTED" 
                          ? t("accounts.bindStatuses.connected") 
                          : t("accounts.bindStatuses.disconnected")}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-600">{acc.host}</td>
                      <td className="px-4 py-3.5 font-mono text-xs font-semibold text-slate-600">{acc.port}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <TablePagination
            page={page}
            totalPages={Math.ceil(accounts.length / pageSize)}
            onPageChange={setPage}
            totalItems={accounts.length}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[5, 10, 20]}
          />
        </div>

        {/* RIGHT COLUMN: COMMAND BUTTONS */}
        <div className="w-48 flex flex-col gap-3">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">{t("accounts.commands.title")}</h3>
          
          <div className="flex flex-col gap-1.5 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <CommandBtn 
              icon={<Plus size={14} />} 
              label={t("accounts.commands.add")} 
              color="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50/50" 
              onClick={handleAdd} 
              disabled={false} 
            />
            <CommandBtn 
              icon={<Edit3 size={14} />} 
              label={t("accounts.commands.edit")} 
              color="text-slate-700 hover:text-indigo-600" 
              onClick={handleEdit} 
              disabled={!selectedId} 
            />
            <CommandBtn 
              icon={<Trash2 size={14} />} 
              label={t("accounts.commands.delete")} 
              color="text-rose-600 hover:text-rose-700 hover:bg-rose-50/50" 
              disabled={!selectedId} 
              onClick={() =>
                openConfirmModal({
                  title: t("accounts.confirm.deleteTitle"),
                  message: t("accounts.confirm.deleteMessage"),
                  confirmText: t("accounts.confirm.deleteConfirm"),
                  confirmClass: "bg-rose-600 hover:bg-rose-500",
                  onConfirm: () => handleDelete(selectedId),
                })
              }
            />
          </div>

          <div className="flex flex-col gap-1.5 bg-white p-3 rounded-xl border border-slate-200 shadow-xs mt-1">
            <CommandBtn 
              icon={<Play size={14} />} 
              label={t("accounts.commands.enable")} 
              color="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50/50"
              onClick={() =>
                openConfirmModal({
                  title: t("accounts.confirm.enableTitle"),
                  message: t("accounts.confirm.enableMessage"),
                  confirmText: t("accounts.confirm.enableConfirm"),
                  confirmClass: "bg-emerald-600 hover:bg-emerald-500",
                  onConfirm: () => handleToggleStatus("ACTIVE"),
                })
              }
              disabled={!selectedId || accountStatus === "ACTIVE"} 
            />
            <CommandBtn 
              icon={<Square size={14} />} 
              label={t("accounts.commands.disable")}
              color="text-rose-600 hover:text-rose-700 hover:bg-rose-50/50"
              onClick={() =>
                openConfirmModal({
                  title: t("accounts.confirm.disableTitle"),
                  message: t("accounts.confirm.disableMessage"),
                  confirmText: t("accounts.confirm.disableConfirm"),
                  confirmClass: "bg-rose-600 hover:bg-rose-500",
                  onConfirm: () => handleToggleStatus("INACTIVE"),
                })
              }
              disabled={!selectedId || accountStatus === "INACTIVE"} 
            />
          </div>
        </div>

        {/* MODAL FORM */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-zoom-in">
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {editingAccountId ? t("accounts.modal.editTitle") : t("accounts.modal.addTitle")}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={18}/>
                </button>
              </div>
              <form onSubmit={handleSaveAccount} className="p-6 flex flex-col gap-4 text-xs text-slate-600">
                <div>
                  <label className="text-slate-500 font-semibold mb-1 block">{t("accounts.modal.accountName")}</label>
                  <input 
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 outline-none focus:border-indigo-500 transition-all font-medium"
                    value={formData.accountName}
                    onChange={(e) => setFormData({...formData, accountName: e.target.value})}
                    disabled={editingAccountId ? true : false}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-500 font-semibold mb-1 block">{t("accounts.modal.protocol")}</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 outline-none focus:border-indigo-500 transition-all font-medium"
                      value={formData.protocol}
                      onChange={(e) => setFormData({...formData, protocol: e.target.value})}
                    >
                      <option value="AMQP">{t("accounts.protocols.amqp")}</option>
                      <option value="MQTT">{t("accounts.protocols.mqtt")}</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-500 font-semibold mb-1 block">{t("accounts.modal.port")}</label>
                    <input
                      type="number"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 outline-none focus:border-indigo-500 transition-all font-medium"
                      value={formData.port}
                      onChange={(e) => setFormData({...formData, port: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-500 font-semibold mb-1 block">{t("accounts.modal.host")}</label>
                  <input 
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 outline-none focus:border-indigo-500 transition-all font-medium"
                    value={formData.host}
                    onChange={(e) => setFormData({...formData, host: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-slate-500 font-semibold mb-1 block">{t("accounts.modal.username")}</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 outline-none focus:border-indigo-500 transition-all font-medium"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="text-slate-500 font-semibold mb-1 block">{t("accounts.modal.password")}</label>
                  <input
                    type="password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 outline-none focus:border-indigo-500 transition-all font-medium"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-slate-500 font-semibold mb-1 block">{t("accounts.modal.vpn")}</label>
                  <input
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 outline-none focus:border-indigo-500 transition-all font-medium"
                    value={formData.configJson ? JSON.parse(formData.configJson).vpn : ""}
                    onChange={(e) => setFormData({...formData, configJson: JSON.stringify({...JSON.parse(formData.configJson), vpn: e.target.value})})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-500 font-semibold mb-1 block">{t("accounts.modal.status")}</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 outline-none focus:border-indigo-500 transition-all font-medium"
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                    >
                      <option value="ACTIVE">{t("accounts.statuses.active")}</option>
                      <option value="INACTIVE">{t("accounts.statuses.inactive")}</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-500 font-semibold mb-1 block">{t("accounts.modal.bindStatus")}</label>
                    <select
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 outline-none focus:border-indigo-500 transition-all font-medium"
                      value={formData.bindStatus}
                      onChange={(e) => setFormData({...formData, bindStatus: e.target.value})}
                    >
                      <option value="CONNECTED">{t("accounts.bindStatuses.connected")}</option>
                      <option value="DISCONNECTED">{t("accounts.bindStatuses.disconnected")}</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <input
                    id="tlsEnabled"
                    type="checkbox"
                    checked={formData.tlsEnabled}
                    onChange={(e) => setFormData({...formData, tlsEnabled: e.target.checked})}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer h-4 w-4"
                  />
                  <label htmlFor="tlsEnabled" className="text-slate-500 font-semibold cursor-pointer">{t("accounts.modal.tlsEnabled")}</label>
                </div>

                <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)} 
                    className="px-4 py-2 text-slate-500 hover:text-slate-700 transition-colors font-semibold"
                  >
                    {t("accounts.modal.cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`bg-indigo-600 text-white px-5 py-2 rounded-lg font-bold transition-all shadow-sm active:scale-95 ${loading ? "opacity-50 cursor-not-allowed" : "hover:bg-indigo-700"}`}
                  >
                    {editingAccountId ? t("accounts.modal.save") : t("accounts.modal.create")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        confirmClass={confirmModal.confirmClass}
        onCancel={() =>
          setConfirmModal((prev) => ({
            ...prev,
            open: false,
          }))
        }
        onConfirm={() => {
          confirmModal.onConfirm?.();

          setConfirmModal((prev) => ({
            ...prev,
            open: false,
          }));
        }}
      />
    </DashboardLayout>
  );
}

const CommandBtn = ({ icon, label, color = "text-slate-700 hover:text-indigo-600", disabled = false, onClick }) => (
  <button
    disabled={disabled}
    onClick={onClick}
    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-semibold transition-all border border-transparent w-full text-left
    ${disabled 
      ? "opacity-30 cursor-not-allowed text-slate-400" 
      : `hover:bg-slate-50 hover:border-slate-200/80 hover:shadow-xs active:scale-95 ${color}`
    }
    `}
  >
    {icon} <span>{label}</span>
  </button>
);

const loadingOverlay = (isLoading) => {
  if (!isLoading) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="rounded-2xl bg-white p-6 text-center text-slate-800 border border-slate-200 shadow-2xl">
        <div role="status" className="flex flex-col items-center gap-4">
          <svg aria-hidden="true" className="w-10 h-10 text-indigo-600 animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
          </svg>
          <span className="text-sm font-semibold">{t("accounts.modal.saving")}</span>
        </div>
      </div>
    </div>
  );
}