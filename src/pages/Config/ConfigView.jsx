import React, { useState, useEffect } from "react";
import { Settings, Save, X, Edit2 } from "lucide-react";
import DashboardLayout from "@/layout/DashboardLayout";
import gatewayApi from "@/api/gatewayApi";
import toast from "react-hot-toast";
import { t } from "@/i18n/translator";

export default function ConfigView() {
  const [loading, setLoading] = useState(false);
  const [configs, setConfigs] = useState([]);
  const [editingConfigKey, setEditingConfigKey] = useState(null);
  const [editingValue, setEditingValue] = useState("");

  // Fetch configs
  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const res = await gatewayApi.getConfigs();
      setConfigs(res || []);
    } catch (error) {
      console.error("Failed to load configs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  // Start editing a config key
  const startEditConfig = (cfg) => {
    setEditingConfigKey(cfg.configKey);
    setEditingValue(cfg.configValue);
  };

  // Update a config key value
  const handleSaveConfig = async (key) => {
    try {
      setLoading(true);
      await gatewayApi.updateConfig(key, editingValue);
      toast.success(t("admin.settings.toast"));
      setEditingConfigKey(null);
      fetchConfigs();
    } catch (error) {
      console.error("Failed to update config:", error);
      toast.error(error.response?.data?.message || t("admin.settings.toastFail"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 py-2">
        {/* System Configurations Table Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold tracking-wider">
                <tr>
                  <th className="p-3.5 w-1/3">{t("admin.settings.key")}</th>
                  <th className="p-3.5 w-1/2">{t("admin.settings.value")}</th>
                  <th className="p-3.5 text-right">{t("admin.settings.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {configs.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="p-8 text-center text-slate-500 font-medium">
                      {loading ? "..." : t("admin.settings.noData")}
                    </td>
                  </tr>
                ) : (
                  configs.map((row) => (
                    <tr key={row.configKey} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3.5 font-semibold text-slate-800 break-all">{row.configKey}</td>
                      <td className="p-3.5 text-slate-650 break-all">
                        {editingConfigKey === row.configKey ? (
                          <input
                            type="text"
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 outline-none text-xs text-slate-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                          />
                        ) : (
                          row.configValue || <span className="italic text-slate-400 font-medium">null</span>
                        )}
                      </td>
                      <td className="p-3.5 text-right font-medium">
                        {editingConfigKey === row.configKey ? (
                          <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleSaveConfig(row.configKey)}
                              className="p-2 rounded-xl border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 transition-colors cursor-pointer active:scale-95 shadow-xxs"
                              title={t("global.save")}
                            >
                              <Save size={14} />
                            </button>
                            <button
                              onClick={() => setEditingConfigKey(null)}
                              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors cursor-pointer active:scale-95 shadow-xxs"
                              title={t("global.cancel")}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEditConfig(row)}
                            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-950 transition-colors cursor-pointer active:scale-95 shadow-xxs"
                            title={t("global.edit")}
                          >
                            <Edit2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
