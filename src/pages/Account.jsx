import React, { useState } from "react";
import DashboardLayout from "../layout/DashboardLayout";
import {
  Plus,
  Trash2,
  Edit3,
  Play,
  Square,
  X,
} from "lucide-react";
import gatewayApi from "../api/gatewayApi";
import { useEffect } from "react";
import { useCallback } from "react";
import ConfirmModal from "@/components/ConfirmModal";
import toast from "react-hot-toast";
import { 
  showSuccessToast, 
  showErrorToast, 
} from '../constants/toastIcons'; 

export default function Account() {
  const [accounts, setAccounts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [accountStatus, setAccountStatus] = useState("INACTIVE");
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [page, setPage] = useState(0);
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
      // Gọi API message-log
      const response = await gatewayApi.getAccounts();
      
      // Giả sử response trả về dạng Page của Spring Boot có trường .content
      setAccounts(response || []); 
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu log:", error);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
      fetchAccounts();
    }, [fetchAccounts]);

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
      showSuccessToast("Account deleted successfully!", toast);
    } else {
      setSelectedId(null);
      showErrorToast("Failed to delete account: " + (response.message || "Unknown error"), toast);
    }
  };

  const handleToggleStatus = (status) => {
    showSuccessToast(`Account ${status === "ACTIVE" ? "enabled" : "disabled"} successfully!`, toast);
    setAccounts(accounts.map(acc => 
      acc.id === selectedId ? { ...acc, status } : acc
    ));
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

        showSuccessToast("Account updated successfully!", toast);
      } else {
        const response = await gatewayApi.createAccount(savedAccount);
        const createdAccount = response?.data ?? response ?? savedAccount;
        setAccounts([...accounts, createdAccount]);
      }

      setIsModalOpen(false);
      setEditingAccountId(null);
    } catch (error) {
      console.error("Lỗi khi lưu account:", error);
      showErrorToast(error?.message || "Lỗi khi lưu account", toast);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex h-full bg-slate-100 text-slate-900 p-4 gap-4 relative m-h-[70vh]">
        {loading && loadingOverlay(true)}
        {/* LEFT COLUMN: LIST TABLE */}
        <div className="flex-1 flex flex-col bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-xl relative">
          {/* {loadingOverlay(loading)} */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
  <thead>
    <tr className="bg-gray-50 text-gray-500 uppercase tracking-wider border-b border-gray-200">
      <th className="px-4 py-3 font-semibold text-xs">Account name</th>
      <th className="px-4 py-3 font-semibold text-xs">Protocol</th>
      <th className="px-4 py-3 font-semibold text-xs">Status</th>
      <th className="px-4 py-3 font-semibold text-xs">Bind Status</th>
      <th className="px-4 py-3 font-semibold text-xs">Host</th>
      <th className="px-4 py-3 font-semibold text-xs">Port</th>
    </tr>
  </thead>
  <tbody className="divide-y divide-gray-100">
    {accounts.map((acc) => (
      <tr
        key={acc.id}
        onClick={() => {
          setSelectedId(acc.id)
          setAccountStatus(acc.status)
        }}
        className={`cursor-pointer transition-all duration-150 ${
          selectedId === acc.id
            ? "bg-blue-50/80 ring-1 ring-blue-200/50"
            : "hover:bg-gray-50 text-gray-700"
        }`}
      >
        <td className={`px-4 py-3 flex items-center gap-2.5 ${acc.status === "ACTIVE" ? "text-emerald-600" : "text-gray-400"}`}>
          <div className={`w-2 h-2 rounded-full ${acc.status === "ACTIVE" ? "bg-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.2)]" : "bg-gray-300"}`} />
          <span className="font-medium">{acc.accountName}</span>
        </td>
        <td className="px-4 py-3 font-bold text-gray-800">{acc.protocol}</td>
        <td className="px-4 py-3">
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
            acc.status === "ACTIVE" 
              ? "bg-emerald-100 text-emerald-700 border border-emerald-200/70" 
              : "bg-gray-100 text-gray-500 border border-gray-200"
          }`}>
            {acc.status}
          </span>
        </td>
        <td className={`px-4 py-3 font-bold ${
          acc.bindStatus === "CONNECTED" 
            ? "text-emerald-600" 
            : acc.bindStatus === "DISCONNECTED" 
              ? "text-gray-400" 
              : "text-amber-600"
        }`}>
          {acc.bindStatus}
        </td>
        <td className="px-4 py-3 font-mono text-sm text-gray-700">{acc.host}</td>
        <td className="px-4 py-3 font-mono text-sm font-semibold text-gray-700">{acc.port}</td>
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
            <CommandBtn icon={<Plus size={14} />} label="Add" color="text-green-400" onClick={handleAdd} disabled={false} />
            <CommandBtn icon={<Edit3 size={14} />} label="Edit" onClick={handleEdit} disabled={!selectedId} />
            <CommandBtn icon={<Trash2 size={14} />} label="Delete" color="text-red-400" 
            disabled={!selectedId} 
            onClick={() =>
                  openConfirmModal({
                    title: "Delete Account",
                    message: "Are you sure you want to delete this account?",
                    confirmText: "Delete",
                    confirmClass: "bg-red-500 hover:bg-red-400",
                    onConfirm: () => handleDelete(selectedId),
                  })
                }
            />
          </div>

          <div className="flex flex-col gap-1 bg-slate-900 p-2 rounded-lg border border-slate-800 mt-2">
            <CommandBtn 
                icon={<Play size={14} />} label="Enable" color="text-green-500"
                onClick={() =>
                  openConfirmModal({
                    title: "Enable Account",
                    message: "Are you sure you want to enable this account?",
                    confirmText: "Enable",
                    confirmClass: "bg-green-500 hover:bg-green-400",
                    onConfirm: () => handleToggleStatus("ACTIVE"),
                  })
                }
                disabled={!selectedId || accountStatus === "ACTIVE"} 
            />
            <CommandBtn 
                icon={<Square size={14} />} label="Disable"
                onClick={() =>
                  openConfirmModal({
                    title: "Disable Account",
                    message: "Are you sure you want to disable this account?",
                    confirmText: "Disable",
                    confirmClass: "bg-red-500 hover:bg-red-400",
                    onConfirm: () => handleToggleStatus("INACTIVE"),
                  })
                }
                disabled={!selectedId || accountStatus === "INACTIVE"} 
            />
          </div>

          {/* <div className="flex flex-col gap-1 bg-slate-900 p-2 rounded-lg border border-slate-800 mt-2 text-blue-400">
            <CommandBtn icon={<Upload size={14} />} label="Import" />
            <CommandBtn icon={<Download size={14} />} label="Export" />
            <div className="h-[1px] bg-slate-800 my-1" />
            <CommandBtn icon={<Save size={14} />} label="Save" onClick={() => alert("Data Saved Successfully!")} />
          </div> */}
        </div>

        {/* MODAL FORM */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-xl shadow-2xl overflow-hidden">
              <div className="flex justify-between items-center p-4 border-b border-slate-800">
                <h2 className="text-black font-bold">{editingAccountId ? "Edit Account" : "Add New Account"}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X size={18}/></button>
              </div>
              <form onSubmit={handleSaveAccount} className="p-4 flex flex-col gap-4 text-sm">
                <div>
                  <label className="text-slate-400 block mb-1">Account Name</label>
                  <input 
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-black focus:border-blue-500"
                    value={formData.accountName}
                    onChange={(e) => setFormData({...formData, accountName: e.target.value})}
                    disabled={editingAccountId ? true : false}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-400 block mb-1">Protocol</label>
                    <select
                      className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-black focus:border-blue-500"
                      value={formData.protocol}
                      onChange={(e) => setFormData({...formData, protocol: e.target.value})}
                    >
                      <option value="AMQP">AMQP Solace</option>
                      <option value="MQTT">X.400 AMHS</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Port</label>
                    <input
                      type="number"
                      className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-black focus:border-blue-500"
                      value={formData.port}
                      onChange={(e) => setFormData({...formData, port: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Host</label>
                  <input 
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-black focus:border-blue-500"
                    value={formData.host}
                    onChange={(e) => setFormData({...formData, host: e.target.value})}
                  />
                </div>

                {/* <div>
                  <label className="text-slate-400 block mb-1">Config JSON</label>
                  <textarea
                    rows={4}
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-black focus:border-blue-500"
                    value={formData.configJson}
                    onChange={(e) => setFormData({...formData, configJson: e.target.value})}
                  />
                </div> */}

                <div>
                  <label className="text-slate-400 block mb-1">Username</label>
                  <input
                    type="text"
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-black focus:border-blue-500"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="text-slate-400 block mb-1">Password</label>
                  <input
                    type="password"
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-black focus:border-blue-500"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">VPN</label>
                  <input
                    type="text"
                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-black focus:border-blue-500"
                    value={formData.configJson ? JSON.parse(formData.configJson).vpn : ""}
                    onChange={(e) => setFormData({...formData, configJson: JSON.stringify({...JSON.parse(formData.configJson), vpn: e.target.value})})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-400 block mb-1">Status</label>
                    <select
                      className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-black focus:border-blue-500"
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Bind Status</label>
                    <select
                      className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-black focus:border-blue-500"
                      value={formData.bindStatus}
                      onChange={(e) => setFormData({...formData, bindStatus: e.target.value})}
                    >
                      <option value="CONNECTED">CONNECTED</option>
                      <option value="DISCONNECTED">DISCONNECTED</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="tlsEnabled"
                    type="checkbox"
                    checked={formData.tlsEnabled}
                    onChange={(e) => setFormData({...formData, tlsEnabled: e.target.checked})}
                    className="rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
                  />
                  <label htmlFor="tlsEnabled" className="text-slate-400">TLS Enabled</label>
                </div>

                <div className="flex gap-2 justify-end mt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white transition-colors">Cancel</button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`bg-blue-600 text-white px-6 py-2 rounded font-medium transition-all ${loading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-500"}`}
                  >
                    {editingAccountId ? "Save Changes" : "Create Account"}
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

const loadingOverlay = (isLoading) => {
  if (!isLoading) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="rounded-xl bg-slate-900/95 p-6 text-center text-white border border-slate-700 shadow-2xl">
        <div role="status" className="flex flex-col items-center gap-4">
          <svg aria-hidden="true" className="w-10 h-10 text-white animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
          </svg>
          <span className="text-sm font-medium">Đang lưu thay đổi...</span>
        </div>
      </div>
    </div>
  );
}
