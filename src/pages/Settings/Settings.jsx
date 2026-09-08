import React, { useState, useEffect } from "react";
import DashboardLayout from "@/layout/DashboardLayout";
import { useAuth } from "@/components/auth-context";
import { authApi } from "@/api/authApi";
import { useLanguageStore } from "@/store/languageStore";
import { t } from "@/i18n/translator";
import toast from "react-hot-toast";
import { useLocation, useNavigate } from "react-router-dom";

export default function Settings() {
  const { user, logout } = useAuth();
  const { language, setLanguage } = useLanguageStore();
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(location.state?.tab || "profile");

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state?.tab]);

  // Password Form States
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError(t("settings.security.errorEmpty"));
      return;
    }

    if (newPassword.length < 6) {
      setError(t("settings.security.errorLength"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t("settings.security.errorMismatch"));
      return;
    }

    setLoading(true);
    try {
      await authApi.changePassword(oldPassword, newPassword);
      setSuccess(t("settings.security.success"));
      toast.success(t("settings.security.success"));
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Change password error:", err);
      const errMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to change password";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    // Gọi t() SAU setLanguage để thông báo hiện bằng chính ngôn ngữ vừa chọn
    toast.success(t("settings.preferences.languageChanged"));
  };

  const handleLogout = () => {
    try {
      logout();
    } catch (err) {
      console.error("Logout error:", err);
    }
    navigate("/login", { replace: true });
  };

  const isAdmin = user?.role?.toLowerCase() === "admin";

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5 max-w-2xl mx-auto py-2">
        

        {/* Clean Tabs */}
        <div className="flex gap-4 border-b border-slate-200">
          <button
            onClick={() => {
              setActiveTab("profile");
              setError("");
              setSuccess("");
            }}
            className={`pb-2.5 px-1 text-xs font-bold transition-colors cursor-pointer border-b-2 -mb-px ${
              activeTab === "profile"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {t("settings.tabs.profile")}
          </button>

          <button
            onClick={() => {
              setActiveTab("security");
              setError("");
              setSuccess("");
            }}
            className={`pb-2.5 px-1 text-xs font-bold transition-colors cursor-pointer border-b-2 -mb-px ${
              activeTab === "security"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {t("settings.tabs.security")}
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          
          {/* TAB 1: PROFILE & PREFERENCES */}
          {activeTab === "profile" && (
            <div className="space-y-4 text-xs">
              
              {/* Account Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">
                    {t("settings.profile.username")}
                  </label>
                  <input
                    type="text"
                    value={user?.username || ""}
                    readOnly
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold cursor-not-allowed outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-medium mb-1">
                    {t("settings.profile.role")}
                  </label>
                  <input
                    type="text"
                    value={isAdmin ? t("settings.profile.roleAdmin") : t("settings.profile.roleUser")}
                    readOnly
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold cursor-not-allowed outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-medium mb-1">
                    {t("settings.profile.status")}
                  </label>
                  <input
                    type="text"
                    value={t("settings.profile.active")}
                    readOnly
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-emerald-700 font-semibold cursor-not-allowed outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 font-medium mb-1">
                    {t("settings.profile.sessionExpires")}
                  </label>
                  <input
                    type="text"
                    value={user?.expiresIn ? `${user.expiresIn}s` : t("settings.profile.sessionActive")}
                    readOnly
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono font-semibold cursor-not-allowed outline-none"
                  />
                </div>
              </div>

              {/* Language Selection */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-700 block">
                    {t("settings.preferences.language")}
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    {t("settings.preferences.languageDesc")}
                  </span>
                </div>

                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleLanguageChange("vi")}
                    className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                      language?.startsWith("vi")
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Tiếng Việt
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLanguageChange("en")}
                    className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer ${
                      language?.startsWith("en")
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>

              {/* Logout Action */}
              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-semibold transition-colors cursor-pointer text-xs"
                >
                  {t("settings.profile.logoutBtn")}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SECURITY */}
          {activeTab === "security" && (
            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              {error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-medium">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium">
                  {success}
                </div>
              )}

              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  {t("settings.security.oldPassword")}
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder={t("settings.security.oldPasswordPlaceholder")}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  {t("settings.security.newPassword")}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t("settings.security.newPasswordPlaceholder")}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  {t("settings.security.confirmPassword")}
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t("settings.security.confirmPasswordPlaceholder")}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition-colors"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors cursor-pointer disabled:opacity-60 text-xs"
                >
                  {loading ? t("settings.security.submitting") : t("settings.security.submit")}
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </DashboardLayout>
  );
}
