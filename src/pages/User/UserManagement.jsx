import React, { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/layout/DashboardLayout";
import { Plus, Edit2, Trash2, Shield, UserCheck, UserX, Search, X, Users, Check } from "lucide-react";
import gatewayApi from "@/api/gatewayApi";
import ConfirmModal from "@/components/ConfirmModal";
import toast from "react-hot-toast";
import { useAuth } from "@/components/auth-context";
import { t } from "@/i18n/translator";
import { translateApiMessage } from "@/i18n/errorTranslator";
import TablePagination from "@/components/TablePagination";

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");

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
    role: "viewer",
    isActive: true,
  };
  const [formData, setFormData] = useState(defaultForm);
  const [formErrors, setFormErrors] = useState({});

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
      const userItems = response?.items || response?.users || [];
      if (response) {
        setUsers(userItems);
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

  useEffect(() => {
    if (isAdmin) {
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
      const userItems = response?.items || response?.users || [];
      const filtered = userItems.filter(
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
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      fullName: user.fullName || "",
      email: user.email || "",
      password: "", // Do not populate password for editing security
      role: user.role || "viewer",
      isActive: user.isActive !== false,
    });
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Submit Form (Create / Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = {};
    const cleanUsername = (formData.username || "").trim();
    const cleanFullName = (formData.fullName || "").trim();
    const cleanEmail = (formData.email || "").trim();
    const cleanPassword = formData.password || "";

    if (!cleanUsername) {
      errors.username = t("users.validation.usernameRequired");
    } else if (cleanUsername.length < 3) {
      errors.username = t("users.validation.usernameMin");
    }

    if (!cleanFullName) {
      errors.fullName = t("users.validation.fullNameRequired");
    }

    if (!cleanEmail) {
      errors.email = t("users.validation.emailRequired");
    } else if (!/^[A-Za-z0-9+_.-]+@(.+)$/.test(cleanEmail)) {
      errors.email = t("users.validation.emailInvalid");
    }

    if (!editingUser) {
      if (!cleanPassword) {
        errors.password = t("users.validation.passwordRequired");
      } else if (cleanPassword.length < 6) {
        errors.password = t("users.validation.passwordMin");
      }
    } else {
      if (cleanPassword && cleanPassword.length < 6) {
        errors.password = t("users.validation.passwordMin");
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error(t("users.validation.fillRequired"));
      return;
    }

    setFormErrors({});
    try {
      if (editingUser) {
        // Edit User
        const payload = {
          ...formData,
          username: cleanUsername,
          fullName: cleanFullName,
          email: cleanEmail,
        };
        // Only include password if changed
        if (!formData.password) {
          delete payload.password;
        }
        await gatewayApi.updateUser(editingUser.id, payload);
        toast.success(t("users.messages.updateSuccess"));
      } else {
        // Create User
        await gatewayApi.createUser({
          ...formData,
          username: cleanUsername,
          fullName: cleanFullName,
          email: cleanEmail,
        });
        toast.success(t("users.messages.createSuccess"));
      }
      setIsDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error("Failed to save user:", error);
      toast.error(translateApiMessage(error?.response?.data?.message || error?.message || "Failed to save user"));
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
      toast.error(translateApiMessage(error?.response?.data?.message || error?.message || "Failed to update user status"));
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
          toast.error(translateApiMessage(error?.response?.data?.message || error?.message || "Failed to delete user"));
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
          <div className="overflow-x-auto min-h-[260px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200/80 font-bold tracking-wider">
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
                          row.role?.toLowerCase() === "admin"
                            ? "bg-red-50 text-red-700 border-red-200/60"
                            : row.role?.toLowerCase() === "operator"
                            ? "bg-amber-50 text-amber-700 border-amber-200/60"
                            : "bg-blue-50 text-blue-700 border-blue-200/60"
                        }`}>
                          {t(`users.roles.${row.role?.toLowerCase()}`) || row.role}
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
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex justify-center items-center p-4 animate-fade-in" onClick={() => setIsDialogOpen(false)}>
            <div className="w-[540px] max-w-full bg-white max-h-[88vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-zoom-in border border-slate-200" onClick={(e) => e.stopPropagation()}>
              
              {/* MODAL HEADER */}
              <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 flex items-center justify-center shrink-0">
                    <Users size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">
                      {editingUser ? t("users.editUser") : t("users.addUser")}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      System User Account Management
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => setIsDialogOpen(false)}
                  className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* MODAL BODY */}
              <form onSubmit={handleSubmit} noValidate className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-4 text-xs">
                  {/* Username */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {t("users.dialog.username")} <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      name="username"
                      disabled={Boolean(editingUser)}
                      className={`w-full px-3.5 py-2 rounded-lg text-xs font-medium text-slate-800 focus:outline-none transition-all disabled:opacity-50 disabled:bg-slate-100 ${
                        formErrors.username
                          ? "bg-red-50/30 border border-red-500 ring-1 ring-red-500/30 focus:border-red-600"
                          : "bg-slate-50 border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      }`}
                      value={formData.username}
                      onChange={handleFormChange}
                    />
                    {formErrors.username && (
                      <p className="text-[11px] text-red-600 font-medium mt-1">{formErrors.username}</p>
                    )}
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {t("users.dialog.fullName")} <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      className={`w-full px-3.5 py-2 rounded-lg text-xs font-medium text-slate-800 focus:outline-none transition-all ${
                        formErrors.fullName
                          ? "bg-red-50/30 border border-red-500 ring-1 ring-red-500/30 focus:border-red-600"
                          : "bg-slate-50 border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      }`}
                      value={formData.fullName}
                      onChange={handleFormChange}
                    />
                    {formErrors.fullName && (
                      <p className="text-[11px] text-red-600 font-medium mt-1">{formErrors.fullName}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {t("users.dialog.email")} <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      className={`w-full px-3.5 py-2 rounded-lg text-xs font-medium text-slate-800 focus:outline-none transition-all ${
                        formErrors.email
                          ? "bg-red-50/30 border border-red-500 ring-1 ring-red-500/30 focus:border-red-600"
                          : "bg-slate-50 border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      }`}
                      value={formData.email}
                      onChange={handleFormChange}
                    />
                    {formErrors.email && (
                      <p className="text-[11px] text-red-600 font-medium mt-1">{formErrors.email}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {t("users.dialog.password")} {!editingUser && <span className="text-red-500 font-bold">*</span>}
                    </label>
                    <input
                      type="password"
                      name="password"
                      placeholder={editingUser ? t("users.dialog.passwordHelp") : ""}
                      className={`w-full px-3.5 py-2 rounded-lg text-xs font-medium text-slate-800 focus:outline-none transition-all ${
                        formErrors.password
                          ? "bg-red-50/30 border border-red-500 ring-1 ring-red-500/30 focus:border-red-600"
                          : "bg-slate-50 border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      }`}
                      value={formData.password}
                      onChange={handleFormChange}
                    />
                    {formErrors.password && (
                      <p className="text-[11px] text-red-600 font-medium mt-1">{formErrors.password}</p>
                    )}
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {t("users.dialog.role")}
                    </label>
                    <select
                      name="role"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                      value={formData.role}
                      onChange={handleFormChange}
                    >
                      <option value="admin">{t("users.roles.admin")}</option>
                      <option value="operator">{t("users.roles.operator")}</option>
                      <option value="viewer">{t("users.roles.viewer")}</option>
                    </select>
                  </div>

                  {/* Is Active (Toggle check) */}
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      name="isActive"
                      id="isActive"
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      checked={formData.isActive}
                      onChange={handleFormChange}
                    />
                    <label htmlFor="isActive" className="text-xs font-semibold text-slate-700 select-none cursor-pointer">
                      Active Account
                    </label>
                  </div>
                </div>

                {/* MODAL FOOTER */}
                <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsDialogOpen(false)}
                    className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-xs"
                  >
                    {t("users.dialog.cancel")}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <Check size={14} />
                    <span>{t("users.dialog.save")}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
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
