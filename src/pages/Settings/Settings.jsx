import React, { useState, useEffect } from "react";
import DashboardLayout from "@/layout/DashboardLayout";
import { User, Shield, KeyRound, CheckCircle2, AlertCircle } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import authApi from "@/api/authApi";
import { t } from "@/i18n/translator";
import toast from "react-hot-toast";
import { useLocation } from "react-router-dom";

export default function Settings() {
  const { user } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.tab || "profile"); // profile or security

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state?.tab]);

  // Change Password Form States
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
      const errMsg = err.response?.data?.error || err.response?.data?.message || "Failed to change password";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (username) => {
    if (!username) return "U";
    return username.slice(0, 2).toUpperCase();
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 max-w-4xl mx-auto py-2">
        {/* Title */}
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">{t("settings.title")}</h1>
        </div>

        {/* Premium Profile Header Card */}
        <div className="bg-white border border-slate-200/85 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4.5">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xl shadow-md border-4 border-slate-50">
              {getInitials(user?.username)}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">{user?.username}</h2>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-indigo-50 border border-indigo-200/50 text-indigo-700 uppercase">
                  {user?.role === "ADMIN" ? t("settings.profile.roleAdmin") : t("settings.profile.roleUser")}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] text-slate-400 font-medium">Active Session</span>
              </div>
            </div>
          </div>

          {/* Premium Horizontal Segmented Control for Tabs */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/60 shadow-xxs">
            <button
              onClick={() => {
                setActiveTab("profile");
                setError("");
                setSuccess("");
              }}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeTab === "profile"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <User size={14} />
              <span>{t("settings.tabs.profile")}</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("security");
                setError("");
                setSuccess("");
              }}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                activeTab === "security"
                  ? "bg-white text-blue-600 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Shield size={14} />
              <span>{t("settings.tabs.security")}</span>
            </button>
          </div>
        </div>

        {/* Main Panel Content */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs min-h-[280px]">
          {activeTab === "profile" ? (
            /* Profile Panel */
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {t("settings.profile.title")}
                </h3>
                <p className="text-[11px] text-slate-400">Account identifiers and details</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                    {t("settings.profile.username")}
                  </label>
                  <div className="relative">
                    <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-450" />
                    <input
                      type="text"
                      value={user?.username || ""}
                      readOnly
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs outline-none text-slate-500 cursor-not-allowed font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                    {t("settings.profile.role")}
                  </label>
                  <div className="relative">
                    <Shield size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-450" />
                    <input
                      type="text"
                      value={user?.role === "ADMIN" ? t("settings.profile.roleAdmin") : t("settings.profile.roleUser")}
                      readOnly
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs outline-none text-slate-500 cursor-not-allowed font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Security Panel */
            <form onSubmit={handleChangePassword} className="space-y-5 max-w-md">
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {t("settings.security.title")}
                </h3>
                <p className="text-[11px] text-slate-400">Change your login credentials securely</p>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-150/60 text-rose-700 px-3.5 py-2.5 text-xs font-semibold">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-150/60 text-emerald-700 px-3.5 py-2.5 text-xs font-semibold">
                  <CheckCircle2 size={14} className="shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                  {t("settings.security.oldPassword")}
                </label>
                <div className="relative">
                  <KeyRound size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-450" />
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                  {t("settings.security.newPassword")}
                </label>
                <div className="relative">
                  <KeyRound size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-450" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                  {t("settings.security.confirmPassword")}
                </label>
                <div className="relative">
                  <KeyRound size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-450" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-900"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold active:scale-95 transition-all cursor-pointer shadow-sm hover:shadow disabled:opacity-60"
              >
                {loading ? "..." : t("settings.security.submit")}
              </button>
            </form>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
