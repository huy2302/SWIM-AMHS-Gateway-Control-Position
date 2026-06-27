import React, { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/layout/DashboardLayout";
import { Plus, Edit2, Trash2, Shield, UserCheck, UserX, Search, X } from "lucide-react";
import gatewayApi from "@/api/gatewayApi";
import ConfirmModal from "@/components/ConfirmModal";
import toast from "react-hot-toast";
import { useAuth } from "@/components/AuthContext";
import { t } from "@/i18n/translator";
import TablePagination from "@/components/TablePagination";

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [roles, setRoles] = useState([]);
  
  // Pagination & Sorting state
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Form State
  const defaultForm = {
    username: "",
    fullName: "",
    email: "",
    password: "",
    role: "USER",
    isActive: true,
  };
  const [formData, setFormData] = useState(defaultForm);

  // Confirm Modal State
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  const isAdmin = currentUser?.role?.toLowerCase() === "admin";

  // Fetch Users
  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;
    try {
      setLoading(true);
      const response = await gatewayApi.getUsers({
        page,
        size: pageSize,
        sortBy: "id",
        sortDir: "asc",
      });
      if (response && response.users) {
        setUsers(response.users);
        setTotalPages(response.totalPages || 1);
        setTotalItems(response.totalItems || 0);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error(t("users.messages.loadError"));
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, isAdmin]);

  // Fetch roles metadata
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const rolesRes = await gatewayApi.getUserRoles();
        setRoles(rolesRes || []);
      } catch (error) {
        console.error("Failed to load user roles:", error);
      }
    };
    if (isAdmin) {
      fetchMetadata();
      fetchUsers();
    }
  }, [isAdmin, fetchUsers]);

  // Handle Search
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchKeyword.trim()) {
      fetchUsers();
      return;
    }
    try {
      setLoading(true);
      const response = await gatewayApi.getUsers({
        page: 0,
        size: 50,
        sortBy: "id",
        sortDir: "asc",
      });
      // Filter locally based on keyword for search consistency if backend search is simple
      const filtered = (response?.users || []).filter(
        (u) =>
          u.username.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          u.email.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          (u.fullName && u.fullName.toLowerCase().includes(searchKeyword.toLowerCase()))
      );
      setUsers(filtered);
      setTotalPages(1);
      setTotalItems(filtered.length);
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData(defaultForm);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      fullName: user.fullName || "",
      email: user.email || "",
      password: "", // Do not populate password for editing security
      role: user.role || "USER",
      isActive: user.isActive !== false,
    });
    setIsDialogOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Submit Form (Create / Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // Edit User
        const payload = {
          ...formData,
        };
        // Only include password if changed
        if (!formData.password) {
          delete payload.password;
        }
        await gatewayApi.updateUser(editingUser.id, payload);
        toast.success(t("users.messages.updateSuccess"));
      } else {
        // Create User
        if (!formData.password) {
          toast.error("Password is required for new users");
          return;
        }
        await gatewayApi.createUser(formData);
        toast.success(t("users.messages.createSuccess"));
      }
      setIsDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error("Failed to save user:", error);
      toast.error(error.response?.data?.message || "Failed to save user");
    }
  };

  // Toggle Active/Inactive Status
  const handleToggleStatus = async (user) => {
    try {
      if (user.isActive) {
        await gatewayApi.deactivateUser(user.id);
      } else {
        await gatewayApi.activateUser(user.id);
      }
      toast.success(t("users.messages.statusSuccess"));
      fetchUsers();
    } catch (error) {
      console.error("Failed to toggle status:", error);
      toast.error("Failed to update user status");
    }
  };

  // Delete User
  const handleDelete = (user) => {
    setConfirmModal({
      open: true,
      title: t("users.messages.deleteConfirmTitle"),
      message: t("users.messages.deleteConfirmMsg"),
      onConfirm: async () => {
        try {
          await gatewayApi.deleteUser(user.id);
          toast.success(t("users.messages.deleteSuccess"));
          setConfirmModal((prev) => ({ ...prev, open: false }));
          fetchUsers();
        } catch (error) {
          console.error("Failed to delete user:", error);
          toast.error("Failed to delete user");
        }
      },
    });
  };

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[70vh] text-slate-500">
          <Shield size={64} className="text-red-500 mb-4 animate-pulse" />
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">ACCESS DENIED</h2>
          <p className="mt-2 text-sm text-slate-500">
            You do not have the required permissions to view this page.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4">
        {/* Filters, Search and Actions */}
        <div className="flex items-center justify-between bg-white border border-slate-200/80 p-4 rounded-xl shadow-xs gap-4">
          <div className="flex flex-1 items-center gap-4">
            <form onSubmit={handleSearch} className="relative w-full max-w-md">
              <input
                type="text"
                placeholder={t("users.searchPlaceholder")}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-10 pr-4 py-2 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-xs text-slate-900"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </form>
            <div className="text-xs text-slate-500">
              Total Accounts: <span className="font-semibold text-slate-950">{totalItems}</span>
            </div>
          </div>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm hover:shadow-md active:scale-95 transition-all text-xs cursor-pointer"
          >
            <Plus size={16} />
            <span>{t("users.addUser")}</span>
          </button>
        </div>

        {/* Users Table */}
        <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200/80 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4">{t("users.table.username")}</th>
                  <th className="p-4">{t("users.table.fullName")}</th>
                  <th className="p-4">{t("users.table.email")}</th>
                  <th className="p-4">{t("users.table.role")}</th>
                  <th className="p-4 text-center">{t("users.table.status")}</th>
                  <th className="p-4">{t("users.table.lastLogin")}</th>
                  <th className="p-4 text-right">{t("users.table.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="p-10 text-center text-slate-400">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500 mb-2"></div>
                      <div>Loading users...</div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-10 text-center text-slate-500">
                      No user accounts found.
                    </td>
                  </tr>
                ) : (
                  users.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-4 font-bold text-slate-900">{row.username}</td>
                      <td className="p-4 text-slate-700">{row.fullName || "-"}</td>
                      <td className="p-4 text-slate-500">{row.email || "-"}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          row.role === "ADMIN" 
                            ? "bg-red-50 text-red-700 border-red-200/60" 
                            : row.role === "OPERATOR"
                            ? "bg-amber-50 text-amber-700 border-amber-200/60"
                            : "bg-blue-50 text-blue-700 border-blue-200/60"
                        }`}>
                          {t(`users.roles.${row.role}`) || row.role}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(row)}
                          title="Click to toggle active state"
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all border cursor-pointer ${
                            row.isActive !== false
                              ? "bg-green-50 text-green-700 border-green-200/60 hover:bg-green-100"
                              : "bg-slate-50 text-slate-500 border-slate-200/80 hover:bg-slate-100"
                          }`}
                        >
                          {row.isActive !== false ? <UserCheck size={10} /> : <UserX size={10} />}
                          <span>{row.isActive !== false ? t("users.status.active") : t("users.status.inactive")}</span>
                        </button>
                      </td>
                      <td className="p-4 text-slate-500">
                        {row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleString() : "Never"}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleOpenEdit(row)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors shadow-xs cursor-pointer"
                            title={t("users.editUser")}
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => handleDelete(row)}
                            className="p-1.5 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors shadow-xs cursor-pointer"
                            title="Delete User"
                            disabled={row.username === currentUser?.username} // Cannot delete self
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <TablePagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={totalItems}
          />
        </div>

        {/* Modal: Add/Edit User Dialog */}
        {isDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-zoom-in">
              <div className="flex justify-between items-center border-b border-slate-100 px-6 py-4 bg-slate-50">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  {editingUser ? t("users.editUser") : t("users.addUser")}
                </h3>
                <button
                  onClick={() => setIsDialogOpen(false)}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Username */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">
                    {t("users.dialog.username")}
                  </label>
                  <input
                    type="text"
                    name="username"
                    required
                    disabled={Boolean(editingUser)} // Username is unique and unchangeable
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-xs text-slate-900 disabled:opacity-50 disabled:bg-slate-50"
                    value={formData.username}
                    onChange={handleFormChange}
                  />
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">
                    {t("users.dialog.fullName")}
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-xs text-slate-900"
                    value={formData.fullName}
                    onChange={handleFormChange}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">
                    {t("users.dialog.email")}
                  </label>
                  <input
                    type="email"
                    name="email"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-xs text-slate-900"
                    value={formData.email}
                    onChange={handleFormChange}
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">
                    {t("users.dialog.password")}
                  </label>
                  <input
                    type="password"
                    name="password"
                    required={!editingUser} // Required only for new users
                    placeholder={editingUser ? t("users.dialog.passwordHelp") : ""}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-xs text-slate-900"
                    value={formData.password}
                    onChange={handleFormChange}
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">
                    {t("users.dialog.role")}
                  </label>
                  <select
                    name="role"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 text-xs text-slate-900 cursor-pointer"
                    value={formData.role}
                    onChange={handleFormChange}
                  >
                    {roles.length > 0 ? (
                      roles.map((r) => (
                        <option key={r.code} value={r.code}>
                          {r.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="USER">User</option>
                        <option value="OPERATOR">Operator</option>
                        <option value="ADMIN">Admin</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Is Active (Toggle check) */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    name="isActive"
                    id="isActive"
                    className="h-4 w-4 border-slate-300 text-indigo-600 rounded cursor-pointer"
                    checked={formData.isActive}
                    onChange={handleFormChange}
                  />
                  <label htmlFor="isActive" className="text-xs font-medium text-slate-700 select-none cursor-pointer">
                    Active Account
                  </label>
                </div>

                {/* Dialog Actions */}
                <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsDialogOpen(false)}
                    className="rounded-lg bg-white border border-slate-300 hover:bg-slate-50 px-4 py-2.5 text-xs text-slate-700 font-semibold transition-colors cursor-pointer"
                  >
                    {t("users.dialog.cancel")}
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 text-xs text-white font-semibold transition-colors shadow-sm hover:shadow active:scale-95 cursor-pointer"
                  >
                    {t("users.dialog.save")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Reusable Confirm Dialog */}
        <ConfirmModal
          isOpen={confirmModal.open}
          title={confirmModal.title}
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal((prev) => ({ ...prev, open: false }))}
        />
      </div>
    </DashboardLayout>
  );
}
