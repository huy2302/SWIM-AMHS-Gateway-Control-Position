import { ShieldCheck, Globe, Eye, Lock, User } from "lucide-react";

import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authApi } from "../api/authApi";
import { useAuth } from "./AuthContext";
import { t } from "@/i18n/translator";

export default function LoginCard() {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [language, setLanguage] = useState(localStorage.getItem("language") || "en");

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/monitor";

  // save data login to context
  const { login } = useAuth();

  const handleChangeLang = (e) => {
    const lang = e.target.value;

    setLanguage(lang);
    localStorage.setItem("language", lang);
  }
  useEffect(() => {
    if (authApi.isAuthenticated()) {
      navigate(from, { replace: true });
    }
  }, [from, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await authApi.login(username, password);
      console.log("Login successful:", response);

      // Lưu trực tiếp response.data
      const userData = response; // { username, role, token, expiresIn }

      localStorage.setItem("token", userData.token);
      localStorage.setItem("user", JSON.stringify(userData));

      login(userData, userData.token);

      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
      // Redirect về login page
      // window.location.href = '/login';
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <>
      <form
        className="
              w-[27em]
              rounded-[34px]
              border
              border-white/70
              bg-white/92
              backdrop-blur-xl
              px-10
              py-5
              transition-all
              duration-500
              hover:-translate-y-1
              hover:shadow-[0_40px_100px_rgba(40,80,140,.20)]
              shadow-[0_30px_80px_rgba(40,80,140,.18)]
          "
        onSubmit={handleLogin}
      >
        <div className="flex justify-center">
          <div className="flex items-center justify-center rounded-full mb-4">
            <ShieldCheck size={46} className="text-blue-700" />
          </div>
        </div>

        <h2 className="mt-8 text-[24px] text-center font-bold tracking-[6px] uppercase">
          {t("login.title")}
        </h2>

        <p className="mt-4 text-[14px] text-center text-slate-500 leading-7">
          AMHS SWIM Gateway
          <br />
          {t("login.subtitle")}
          {/* Monitoring Administration Portal */}
        </p>

        {/* Username */}
        <div className="mt-5">
          <div className="relative">
            <User
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 pr-4 py-3 outline-none transition-all hover:border-blue-300 hover:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              placeholder={t("login.username")}
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
        </div>

        {/* Password */}
        <div className="mt-5">
          <div className="relative">
            <Lock
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type={showPassword ? "text" : "password"}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 py-3 pr-14 outline-none transition-all hover:border-blue-300 hover:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              placeholder={t("login.password")}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              <Eye size={20} className="text-slate-400" />
            </button>
          </div>
        </div>

        {/* Language */}
        <div className="mt-5">
          <div className="relative">
            <Globe
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            
            <select value={language} onChange={handleChangeLang} className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-12 py-3 outline-none transition hover:border-blue-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100">
              {
                language == "vi" ?
                <>
                  <option value="vi">Tiếng Việt</option>
                  <option value="en">English</option>
                </>
                :
                <>
                  <option value="en">English</option>
                  <option value="vi">Tiếng Việt</option>
                </>
              }
              
            </select>
          </div>
        </div>

        <button
          className="group relative mt-5 py-3 w-full overflow-hidden rounded-xl bg-gradient-to-r from-[#0A5FD8] via-[#2176FF] to-[#44A4FF] font-semibold text-white hover:shadow-xl "
          type="submit"
          disabled={loading}
        >
          <span className="relative z-20">
            {loading ? t("login.signin") : t("login.title")}
          </span>
        </button>
        {error && (
          <div className="text-red-600 text-sm text-center">{error}</div>
        )}

        <div className="mt-6 flex justify-between text-[16px]">
          <label className="flex items-center gap-2">
            <input type="checkbox" />
            {t("login.remember")}
          </label>

          <button className="text-blue-600">{t("login.forgot")}?</button>
        </div>

        <div className="mt-8 border-t border-black/45 pt-6 text-center">
          <p className="text-sm text-slate-500">© 2026 ATTECH</p>

          <p className="text-xs text-slate-400">
            {t("login.company")}
          </p>
        </div>
      </form>
      {authApi.isAuthenticated() && (
        <div className="text-center">
          <button
            onClick={handleLogout}
            className="text-indigo-600 hover:text-indigo-500 text-sm"
          >
            Logout
          </button>
        </div>
      )}
    </>
  );
}
