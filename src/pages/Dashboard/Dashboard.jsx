import React, { useState, useEffect } from "react";
import DashboardLayout from "@/layout/DashboardLayout";
import {
  BookText, Cable, Check, X,
  ArrowDownToLine, ArrowUpFromLine
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import gatewayApi from "@/api/gatewayApi";
import { useSelector } from "react-redux";
import { t } from "@/i18n/translator";

const BouncingDots = () => (
  <span className="inline-flex items-center gap-0.5">
    <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
    <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
    <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" />
  </span>
);

const fmt = (num) => {
  if (num === undefined || num === null) return <BouncingDots />;
  return num.toLocaleString("en-US");
};

const pct = (a, b) => {
  if (!b) return "—";
  return `${((a / b) * 100).toFixed(1)}%`;
};

const rateColor = (a, b) => {
  if (!b) return "#9ca3af";
  const r = a / b;
  if (r >= 0.95) return "#10b981";
  if (r >= 0.7) return "#f59e0b";
  return "#ef4444";
};


const formatDate = (dateString) => {
  if (!dateString) return "—";
  const normalized = dateString.replace("ICT", "GMT+0700");
  const date = new Date(normalized);
  if (isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).format(date).replace(",", "");
};


const StatRow = ({ label, value, valueClass = "text-slate-700" }) => (
  <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 gap-4">
    <span className="text-[12px] text-slate-500 leading-tight">{label}</span>
    <span className={`text-[13px] font-bold text-right tabular-nums ${valueClass}`}>{value}</span>
  </div>
);

const TrafficCard = ({
  title, icon: Icon, iconBg, iconColor,
  total, pending, converted, convertFailed, sent, failed, unrouted
}) => {
  const pieData = [
    { name: t("dashboard.trafficCard.pending"),       value: pending      || 0, color: "#94a3b8" },
    { name: t("dashboard.trafficCard.converted"),      value: converted    || 0, color: iconColor },
    { name: t("dashboard.trafficCard.unrouted"),       value: unrouted     || 0, color: "#f59e0b" },
    { name: t("dashboard.trafficCard.sent"),           value: sent         || 0, color: "#10b981" },
    { name: t("dashboard.trafficCard.failed"),         value: (failed || 0) + (convertFailed || 0), color: "#ef4444" },
  ].filter(d => d.value > 0);

  const emptyPie = [{ name: t("global.noData") || "No data", value: 1, color: "#e2e8f0" }];
  const rColor = rateColor(sent || 0, total || 0);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col gap-4">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-lg" style={{ backgroundColor: iconBg }}>
          <Icon size={16} style={{ color: iconColor }} />
        </div>
        <span className="text-[13px] font-bold text-slate-800">{title}</span>
        {total !== undefined && total !== null && (
          <span className="ml-auto text-[11px] font-semibold px-2.5 py-0.5 bg-slate-100 text-slate-500 rounded-full">
            {fmt(total)} {t("dashboard.trafficCard.messages")}
          </span>
        )}
      </div>

      <div className="flex items-start gap-5">
        <div className="flex-1 min-w-0">
          <StatRow label={t("dashboard.trafficCard.pending")}   value={fmt(pending)}      valueClass="text-slate-600" />
          <StatRow label={t("dashboard.trafficCard.converted")} value={fmt(converted)}    valueClass="text-blue-600" />
          <StatRow label={t("dashboard.trafficCard.convertFailed")} value={fmt(convertFailed)} valueClass={convertFailed > 0 ? "text-red-500" : "text-slate-400"} />
          <StatRow label={t("dashboard.trafficCard.unrouted")}  value={fmt(unrouted)}     valueClass={unrouted > 0 ? "text-amber-600" : "text-slate-400"} />
          <StatRow label={t("dashboard.trafficCard.sent")}      value={fmt(sent)}         valueClass={sent > 0 ? "text-emerald-600" : "text-slate-400"} />
          <StatRow label={t("dashboard.trafficCard.failed")}    value={fmt(failed)}       valueClass={failed > 0 ? "text-red-500" : "text-slate-400"} />
          <div className="flex items-center justify-between pt-2.5 mt-1">
            <span className="text-[12px] font-semibold text-slate-600">{t("dashboard.trafficCard.successRate")}</span>
            <span className="text-[16px] font-extrabold" style={{ color: rColor }}>
              {total ? pct(sent || 0, total) : <BouncingDots />}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2.5 shrink-0 w-[100px]">
          <div className="w-[90px] h-[90px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip 
                  wrapperStyle={{ pointerEvents: "none", zIndex: 50 }}
                  position={{ x: -105, y: 15 }}
                  contentStyle={{ 
                    background: "#fff", 
                    borderRadius: "6px", 
                    border: "none", 
                    boxShadow: "0 2px 8px rgba(0,0,0,0.12)", 
                    fontSize: "11px",
                    width: "100px",
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                    padding: "6px 8px"
                  }} 
                />
                <Pie data={pieData.length ? pieData : emptyPie} cx="50%" cy="50%"
                  innerRadius={26} outerRadius={42} paddingAngle={1} dataKey="value" isAnimationActive={false}>
                  {(pieData.length ? pieData : emptyPie).map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-1 w-full">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-[10px] text-slate-500 leading-tight">{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const { GatewayProcess, status } = useSelector((state) => state.system);
  const startTime = GatewayProcess?.serviceStartTime;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const r = await gatewayApi.getDashboardStats();
        setStats(r);
      } catch (e) {
        console.error("Dashboard fetch error:", e);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 1000);
    return () => clearInterval(interval);
  }, []);

  const gwin  = stats?.database?.gw_in;
  const gwout = stats?.database?.gw_out;

  const allConns = [...(stats?.connections?.amqp || []), ...(stats?.connections?.amhs || [])];
  const connectedCount    = allConns.filter(c => c.status === "CONNECTED").length;
  const disconnectedCount = allConns.filter(c => c.status !== "CONNECTED").length;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-5 pb-6">

        <div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl px-5 py-4 border"
          style={status === "error"
            ? { background: "#fff5f5", borderColor: "#fecaca" }
            : { background: "#f0fdf4", borderColor: "#bbf7d0" }
          }
        >
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-full ${status === "error" ? "bg-red-100" : "bg-emerald-100"}`}>
              {status === "error" ? <X size={18} className="text-red-500" /> : <Check size={18} className="text-emerald-600" />}
            </div>
            <div>
              <p className={`text-[14px] font-extrabold ${status === "error" ? "text-red-600" : "text-emerald-700"}`}>
                {status === "error" ? t("dashboard.health.error") : t("dashboard.health.title")}
              </p>
              <p className="text-[12px] text-slate-500">
                {status === "error" ? t("dashboard.health.try") : t("dashboard.health.description")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-5 flex-wrap">
            {stats?.connections && (
              <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-white/60 border border-slate-200">
                <Cable size={13} className="text-slate-400 shrink-0" />
                <div className="flex flex-col gap-0.5">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">{t("dashboard.channels.title")}</div>
                  <div className="flex items-center gap-3">
                    {[
                      { key: "amqp", label: "AMQP" },
                      { key: "amhs", label: "AMHS" },
                    ].map(({ key, label }) => {
                      const list = stats.connections[key] || [];
                      const ok = list.filter(c => c.status === "CONNECTED").length;
                      const all = list.length;
                      const allOk = ok === all && all > 0;
                      return (
                        <div key={key} className="flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${allOk ? "bg-emerald-500" : all === 0 ? "bg-slate-300" : "bg-rose-500"}`} />
                          <span className={`text-[11px] font-bold ${allOk ? "text-emerald-700" : all === 0 ? "text-slate-400" : "text-rose-600"}`}>
                            {label} {all > 0 ? `${ok}/${all}` : "—"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <TrafficCard
            title={t("dashboard.trafficCard.swimToAmhs")}
            icon={ArrowDownToLine} iconBg="#e0f2fe" iconColor="#0284c7"
            total={gwin?.total} pending={gwin?.pending} converted={gwin?.transformed}
            convertFailed={gwin?.convertFailed} sent={gwin?.sent} failed={gwin?.failed} unrouted={gwin?.unrouted}
          />
          <TrafficCard
            title={t("dashboard.trafficCard.amhsToSwim")}
            icon={ArrowUpFromLine} iconBg="#fdf4ff" iconColor="#9333ea"
            total={gwout?.total} pending={gwout?.pending} converted={gwout?.transformed}
            convertFailed={gwout?.convertFailed} sent={gwout?.published} failed={gwout?.failed} unrouted={gwout?.undefinded}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-[#e3edfc] p-1.5 rounded-md"><BookText size={14} style={{ color: "#2563eb" }} /></div>
              <span className="text-[13px] font-bold text-slate-800">{t("dashboard.server.title")}</span>
            </div>
            <table className="w-full"><tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-2.5 text-[12px] text-slate-500 font-medium">{t("dashboard.server.serverName")}</td>
                <td className="py-2.5 text-[12px] font-bold text-slate-700 text-right">{stats?.server?.serverName || <BouncingDots />}</td>
              </tr>
              <tr>
                <td className="py-2.5 text-[12px] text-slate-500 font-medium">{t("dashboard.server.runningSince")}</td>
                <td className="py-2.5 text-[12px] font-bold text-slate-700 text-right">{formatDate(startTime)}</td>
              </tr>
              <tr>
                <td className="py-2.5 text-[12px] text-slate-500 font-medium">{t("dashboard.server.version")}</td>
                <td className="py-2.5 text-[12px] font-bold text-slate-700 text-right">{stats?.server?.version || <BouncingDots />}</td>
              </tr>
              <tr>
                <td className="py-2.5 text-[12px] text-slate-500 font-medium">{t("dashboard.server.memoryUsage")}</td>
                <td className="py-2.5 text-[12px] font-bold text-slate-700 text-right">
                  {t("dashboard.server.allocated")} {GatewayProcess?.heapUsedMb ?? "—"} MB,&nbsp;
                  {t("dashboard.server.unused")} {GatewayProcess?.totalPhysicalMemoryMb && GatewayProcess?.usedPhysicalMemoryMb
                    ? (GatewayProcess.totalPhysicalMemoryMb - GatewayProcess.usedPhysicalMemoryMb) : "—"} MB
                </td>
              </tr>
            </tbody></table>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-[#e7f7ed] p-1.5 rounded-md"><Cable size={14} style={{ color: "#10b981" }} /></div>
              <span className="text-[13px] font-bold text-slate-800">{t("dashboard.channels.title")}</span>
            </div>
            <div className="grid grid-cols-2 gap-5 flex-1">
              {[
                { label: t("dashboard.channels.amqp"), key: "amqp" },
                { label: t("dashboard.channels.amhs"), key: "amhs" },
              ].map(({ label, key }) => (
                <div key={key}>
                  <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2.5">{label}</h4>
                  {!stats?.connections?.[key] || stats.connections[key].length === 0
                    ? <p className="text-[12px] text-slate-400 italic">{t("dashboard.channels.noConfig")}</p>
                    : (
                      <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
                        {stats.connections[key].map((conn) => (
                          <div key={conn.id || conn.name}
                            className="flex items-center justify-between px-2.5 py-2 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors">
                            <span className="text-[12px] font-semibold text-slate-700 truncate max-w-[110px]" title={conn.name}>{conn.name}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${conn.status === "CONNECTED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}>
                              {conn.status === "CONNECTED" ? t("dashboard.channels.connected") : t("dashboard.channels.disconnected")}
                            </span>
                          </div>
                        ))}
                      </div>
                    )
                  }
                </div>
              ))}
            </div>
            {stats?.connections && (
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                  <span className="text-[11px] text-slate-500 font-medium">{connectedCount} {t("dashboard.channels.connectedCount")}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-rose-400 rounded-full" />
                  <span className="text-[11px] text-slate-500 font-medium">{disconnectedCount} {t("dashboard.channels.disconnectedCount")}</span>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}