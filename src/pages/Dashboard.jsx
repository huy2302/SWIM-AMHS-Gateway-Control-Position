import DashboardLayout from "../layout/DashboardLayout";
import { SAMPLE_STATS } from "../data/sampleData";
import { Check, Clock } from "lucide-react";

const statusTags = [
  { label: "System Healthy", tone: "success" },
  { label: "All systems are operating normally", tone: "muted" },
];

const summaryStats = [
  {
    title: "AMQP Received",
    value: "1,245",
    subtitle: "Total messages",
    trend: "+12.5% vs last 1 hour",
    color: "#2563eb",
  },
  {
    title: "AMQP Sent",
    value: "850",
    subtitle: "Total messages",
    trend: "+8.7% vs last 1 hour",
    color: "#10b981",
  },
  {
    title: "AMHS Received",
    value: "932",
    subtitle: "Total messages",
    trend: "+5.4% vs last 1 hour",
    color: "#8b5cf6",
  },
  {
    title: "AMHS Sent",
    value: "1,001",
    subtitle: "Total messages",
    trend: "+7.3% vs last 1 hour",
    color: "#f97316",
  },
];

export default function Dashboard() {
  const serverData = SAMPLE_STATS.server;
  const amqpData = SAMPLE_STATS.amqp;
  const amhsData = SAMPLE_STATS.amhs;

  return (
    <DashboardLayout>
      <div className="dashboard-page mt-[-10px] pt-0">
        <section className="dashboard-hero flex flex-col bg-[rgba(34, 197, 94, 0.12)]">
              <div className="flex items-center justify-end gap-2 mb-2">
                <Clock />
                <span className="text-[14px]">Last updated: 12/05/2025 10:25:12</span>
              </div>
          <div className="hero-card flex items-center justify-between">
            <div className="hero-card-top">
              <div>
                <div className="hero-tag">
                  <div className="p-[10px] rounded-full bg-[#28C86B] text-white mr-2">
                    <Check />
                  </div>
                  <div>
                    <h2 className="text-[oklch(0.66_0.19_151.99)] text-[18px]">SYSTEM HEALTHY</h2>
                    <span>All systems are operating normally</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="hero-details">
              <div className="hero-detail-item">
                <div className="detail-label">Running since</div>
                <div className="detail-value">{serverData["Server running since"]}</div>
              </div>
            </div>
          </div>

        </section>
        <section className="dashboard-summary-grid">
          {summaryStats.map((stat) => (
            <div key={stat.title} className="summary-card" style={{ borderTopColor: stat.color }}>
              <div className="summary-card-title">{stat.title}</div>
              <div className="summary-card-value">{stat.value}</div>
              <div className="summary-card-subtitle">{stat.subtitle}</div>
              <div className="summary-card-trend">{stat.trend}</div>
            </div>
          ))}
        </section>

        <section className="dashboard-panels">
          <div className="dashboard-panel server-panel">
            <div className="panel-header">
              <div>
                <p className="panel-label">Server Information</p>
                <h2>Server details</h2>
              </div>
            </div>

            <div className="panel-grid">
              {Object.entries(serverData).map(([key, value]) => (
                <div key={key} className="panel-row">
                  <span>{key}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="dashboard-panel compact-panel">
            <div className="panel-header">
              <div>
                <p className="panel-label">Queue Status (AMQP)</p>
                <h2>All queues are clear</h2>
              </div>
            </div>

            <ul className="status-list">
              <li>
                <span>Incoming Queues</span>
                <strong>0</strong>
              </li>
              <li>
                <span>Outgoing Queues</span>
                <strong>0</strong>
              </li>
              <li>
                <span>Error Queues</span>
                <strong>0</strong>
              </li>
              <li>
                <span>Active Connections</span>
                <strong>{amqpData["Number of active connections"]}</strong>
              </li>
            </ul>

            <div className="chart-pillars">
              {[70, 58, 48, 34, 20].map((height, index) => (
                <div key={index} className="chart-pillars-bar" style={{ height: `${height}%` }} />
              ))}
            </div>
          </div>

          <div className="dashboard-panel compact-panel">
            <div className="panel-header">
              <div>
                <p className="panel-label">AMHS Status</p>
                <h2>Connection overview</h2>
              </div>
            </div>

            <ul className="status-list">
              <li>
                <span>Active connections</span>
                <strong>{amhsData["Number of active connections"]}</strong>
              </li>
              <li>
                <span>Total AMHS Errors</span>
                <strong>{amhsData["Total AMHS Errors"]}</strong>
              </li>
              <li>
                <span>AMC Tables Version</span>
                <strong>{amhsData["AMC Tables Version"]}</strong>
              </li>
            </ul>

            <div className="status-ring">
              <div className="status-ring-inner">
                <span>Active</span>
                <strong>{amhsData["Number of active connections"]} / 2</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="dashboard-bottom-grid">
          <div className="dashboard-panel chart-panel">
            <div className="panel-header">
              <div>
                <p className="panel-label">Messages Over Time</p>
                <h2>Last 24 hours</h2>
              </div>
            </div>
            <div className="timeline-grid">
              <div className="timeline-legend">
                <span className="legend-dot sent" /> AMQP RX
                <span className="legend-dot received" /> AMQP TX
                <span className="legend-dot amhs" /> AMHS RX
                <span className="legend-dot amhs-sent" /> AMHS TX
              </div>
              <div className="chart-line-placeholder">
                <div className="chart-line chart-line-1" />
                <div className="chart-line chart-line-2" />
                <div className="chart-line chart-line-3" />
                <div className="chart-line chart-line-4" />
              </div>
            </div>
          </div>

          <div className="dashboard-panel chart-panel">
            <div className="panel-header">
              <div>
                <p className="panel-label">Errors Over Time</p>
                <h2>Last 24 hours</h2>
              </div>
            </div>
            <div className="chart-badges">
              {[10, 14, 9, 15, 12, 8, 7, 4, 6, 9, 11].map((item, idx) => (
                <div key={idx} className="chart-bar-item" style={{ height: `${item * 4}px` }} />
              ))}
            </div>
          </div>

          <div className="dashboard-panel alerts-panel">
            <div className="panel-header">
              <div>
                <p className="panel-label">Recent Alerts</p>
                <h2>Current status</h2>
              </div>
              <a href="#" className="view-all-link">View all</a>
            </div>
            <div className="alert-card success-alert">
              <span className="alert-icon">✓</span>
              <div>
                <strong>No alerts detected</strong>
                <p>System operating normally</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
