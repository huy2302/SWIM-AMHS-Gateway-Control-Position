import React, { useState, useEffect } from "react";
import DashboardLayout from "../layout/DashboardLayout";
import { SAMPLE_STATS } from "../data/sampleData";
import { Antenna, ArrowDownToLine, ArrowUpFromLine, BookText, Cable, ChartColumn, Check, Clock, Database, Download, Mail, Send, X } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import gatewayApi from "@/api/gatewayApi";
import { useSelector } from "react-redux";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(2);
  const [amqpData, setAmqpData] = useState([
    { name: "Pending", value: 0, color: "#fbff0b" },
    { name: "Converted", value: 0, color: "#5999ff" },
    { name: "Convert Failed", value: 0, color: "#EF4444" },
    { name: "Sent", value: 0, color: "#4bf13c" },
    { name: "Un router", value: 0, color: "#a1a1a1" },
  ]);
  const [amhsData, setAmhsData] = useState([
    { name: "Pending", value: 0, color: "#fbff0b" },
    { name: "Converted", value: 0, color: "#5999ff" },
    { name: "Convert Failed", value: 0, color: "#EF4444" },
    { name: "Publish", value: 0, color: "#4bf13c" },
    { name: "Undefinded", value: 0, color: "#a1a1a1" },
  ]);

  const { GatewayProcess, status, uptime } = useSelector((state) => state.system);
  const startTime = GatewayProcess?.serviceStartTime;

  const fetchDashboardStats = async () => {
    try {
      const response = await gatewayApi.getDashboardStats();
      setStats(response);
      setAmqpData([
        { name: "Pending", value: response?.database?.gw_in?.pending, color: '#fbff0b' },
        { name: "Converted", value: response?.database?.gw_in?.transformed, color: '#5999ff' },
        { name: "Convert Failed", value: response?.database?.gw_in?.convertFailed, color: '#EF4444' },
        { name: "Sent", value: response?.database?.gw_in?.sent, color: '#4bf13c' },
        { name: "Un router", value: response?.database?.gw_in?.unrouted, color: '#a1a1a1' }
      ])
      setAmhsData([
        { name: "Pending", value: response?.database?.gw_out?.pending, color: '#fbff0b' },
        { name: "Converted", value: response?.database?.gw_out?.transformed, color: '#5999ff' },
        { name: "Convert Failed", value: response?.database?.gw_out?.convertFailed, color: '#EF4444' },
        { name: "Publish", value: response?.database?.gw_out?.published, color: '#4bf13c' },
        { name: "Un router", value: response?.database?.gw_out?.unrouted, color: '#a1a1a1' }
      ])
    } catch (error) {
      console.error("Error fetching system health:", error);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      setRefreshInterval(1);
    }, 1000);

    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchDashboardStats, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  return (
    <DashboardLayout>
      <div className="dashboard-page mt-[-10px] pt-0">
        <section className="dashboard-hero flex flex-col bg-[rgba(34, 197, 94, 0.12)]">
          <div className="flex items-center justify-end gap-2 mb-2">
            <Clock />
            <span className="text-[14px]">Last updated: 12/05/2025 10:25:12</span>
          </div>
          <div 
            className="hero-card flex items-center justify-between"
            style={ status === "error" ? { background: "#fcf3f3" } : { background: "#f3fcf5"}}
          >
            <div className="hero-card-top">
              <div>
                <div className="hero-tag">
                  {
                    status === "error" ?
                    <>
                      <div className="p-[10px] rounded-full bg-[#f34444] text-white mr-2">
                        <X />
                      </div>
                      <div>
                        <h2 className="text-red-500 text-[18px]">DISCONNECT TO SERVER</h2>
                        <span>Trying to reconnect to the server...</span>
                      </div>
                    </>
                    :
                    <>
                      <div className="p-[10px] rounded-full bg-[#28C86B] text-white mr-2">
                        <Check />
                      </div>
                      <div>
                        <h2 className="text-[oklch(0.66_0.19_151.99)] text-[18px]">SYSTEM HEALTHY</h2>
                        <span>All systems are operating normally</span>
                      </div>
                    </>
                  }
                </div>
              </div>
            </div>
            
            <div className="hero-details">
              <div className="hero-detail-item">
                <div className="detail-label">Total errors today</div>
                <div className="detail-value">5</div>
              </div>
            </div>
            <div className="hero-details">
              <div className="hero-detail-item">
                <div className="detail-label">Last error time</div>
                <div className="detail-value">10:25:12</div>
              </div>
            </div>
            <div className="hero-details">
              <div className="hero-detail-item">
                <div className="detail-label">Running since</div>
                <div className="detail-value">{formatDate(startTime)}</div>
              </div>
            </div>
          </div>

        </section>
        <section className="dashboard-summary-grid">
          <div className="summary-card flex items-start gap-4 pt-4 relative">
            {loadingOverlay(stats?.database?.gw_out)}
            <div 
              className="p-3 w-fit rounded-md"
              style={{ backgroundColor: "#f0e6fa" }}>
              <Mail style={{ color: "#8755fa" }}/>
            </div>
            <div>
              <div className="text-[12px] font-bold">AMHS Sent</div>
              <div className="text-[12px] grid grid-cols-[1fr_auto] gap-x-8 gap-y-2 w-full text-sm">
                <span className="text-slate-600">Total</span>
                <span className="font-bold text-right text-[#2563eb]">{formatNumber(stats?.database?.gw_out?.total)}</span>

                <span className="text-slate-600">Pending</span>
                <span className="font-bold text-right text-[#7d7d79]">{formatNumber(stats?.database?.gw_out?.pending)}</span>
                
                <span className="text-slate-600">Convert Success</span>
                <span className="font-bold text-right text-[#10b981]">{formatNumber(stats?.database?.gw_out?.transformed)}</span>

                <span className="text-slate-600">Publish Success</span>
                <span className="font-bold text-right text-[#10b981]">{formatNumber(stats?.database?.gw_out?.published)}</span>

                <span className="text-slate-600">Error</span>
                <span className="font-bold text-right text-[#ef4444]">{formatNumber(stats?.database?.gw_out?.failed)}</span>
                
                <span className="text-slate-600">Success Rate</span>
                <span 
                  className="font-bold text-right" 
                  style={{ color: ColorByRate(stats?.database?.gw_out?.transformed, stats?.database?.gw_out?.total)}} 
                >
                  {formatNumber(stats?.database?.gw_out?.transformed / stats?.database?.gw_out?.total * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          <div className="summary-card flex items-start gap-4 pt-4 relative">
            {loadingOverlay(stats?.database?.gw_in)}
            <div 
              className="p-3 w-fit rounded-md"
              style={{ backgroundColor: "#fdede3" }}>
              <ArrowUpFromLine style={{ color: "#f97316" }}/>
            </div>
            <div>
              <div className="text-[12px] font-bold">AMQP Sent</div>
              <div className="text-[12px] grid grid-cols-[1fr_auto] gap-x-8 gap-y-2 w-full text-sm">
                <span className="text-slate-600">Total</span>
                <span className="font-bold text-right text-[#2563eb]">{formatNumber(stats?.database?.gw_in?.total)}</span>

                <span className="text-slate-600">Pending</span>
                <span className="font-bold text-right text-[#7d7d79]">{formatNumber(stats?.database?.gw_in?.pending)}</span>
                
                <span className="text-slate-600">Convert Success</span>
                <span className="font-bold text-right text-[#10b981]">{formatNumber(stats?.database?.gw_in?.transformed)}</span>


                <span className="text-slate-600">Sent Success</span>
                <span className="font-bold text-right text-[#10b981]">{formatNumber(stats?.database?.gw_in?.sent)}</span>

                <span className="text-slate-600">No Routing</span>
                <span className="font-bold text-right text-[#9b9998]">{formatNumber(stats?.database?.gw_in?.unrouted)}</span>

                <span className="text-slate-600">Error</span>
                <span className="font-bold text-right text-[#ef4444]">{formatNumber(stats?.database?.gw_in?.failed)}</span>
              </div>
            </div>
          </div>

          <div className="summary-card flex items-start gap-4 pt-4 relative">
            {loadingOverlay(stats?.database?.gw_out)}
            <div 
              className="p-3 w-fit rounded-md"
              style={{ backgroundColor: "#e7f7ed" }}>
              <Cable style={{ color: "#10b981" }}/>
            </div>
            <div>
              <div className="text-[12px] font-bold">Conversion Status</div>
              <div className="text-[12px] grid grid-cols-[1fr_auto] gap-x-8 gap-y-2 w-full text-sm">
                <span className="text-slate-600">Successful conversions</span>
                <span className="font-bold text-right text-[#2563eb]">1,561</span>

                <span className="text-slate-600">Failed conversions</span>
                <span className="font-bold text-right text-[#ef4444]">19</span>

                <span className="text-slate-600">Success rate</span>
                <span 
                  className="font-bold text-right" 
                  style={{ color: ColorByRate(stats?.database?.gw_out?.transformed, stats?.database?.gw_out?.total)}} 
                >
                  {formatNumber(stats?.database?.gw_out?.transformed / stats?.database?.gw_out?.total * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          <div className="summary-card flex items-start gap-4 pt-4 relative">
            {loadingOverlay(stats?.database?.gw_in || stats?.database?.gw_out)}
            <div 
              className="p-3 w-fit rounded-md"
              style={{ backgroundColor: "#e3edfc" }}>
              <ChartColumn style={{ color: "#2563eb" }}/>
            </div>
            <div>
              <div className="text-[12px] font-bold">Message Flow</div>
              <div className="text-[12px] grid grid-cols-[1fr_auto] gap-x-8 gap-y-2 w-full text-sm">
                <span className="text-slate-600">Total Received</span>
                <span className="font-bold text-slate-800 text-right">{formatNumber((stats?.database?.gw_out?.published || 0) + (stats?.database?.gw_in?.sent || 0))}</span>
                
                <span className="text-slate-600">AMHS → SWIM</span>
                <span className="font-bold text-slate-800 text-right">{formatNumber(stats?.database?.gw_out?.published || 0)}</span>

                <span className="text-slate-600">SWIM → AMHS</span>
                <span className="font-bold text-slate-800 text-right">{formatNumber(stats?.database?.gw_in?.sent || 0)}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="dashboard-panels">
          <div className="dashboard-panel server-panel">
            <div className="panel-header">
              <div className="flex items-center gap-2">
                <div className="bg-[#e3edfc] p-1 rounded-md">
                  <BookText style={{ color: "#2563eb", width: "1em", height: "1em" }} />
                </div>
                <p className="panel-label">Server Information</p>
              </div>
            </div>

            <table className="text-[12px]">
              <tbody>
                <tr>
                  <td>Console Connection</td>
                  {
                    status === "error" ? 
                    <td className="text-right text-red-500 font-bold">
                      <span className="w-[8px] h-[8px] bg-red-500 rounded-full mr-2 inline-block"></span>
                      Connecting to server...
                    </td>
                    :
                    <td className="text-right text-green-500 font-bold">
                      <span className="w-[8px] h-[8px] bg-green-500 rounded-full mr-2 inline-block"></span>
                      Connected (Supervisor)
                    </td>
                  }
                </tr>
                <tr>
                  <td>Server name</td>
                  <td className="text-right font-bold">
                    {stats?.server?.serverName || BouncingDotsLoading()}
                  </td>
                </tr>
                <tr>
                  <td>Server running since</td>
                  <td className="text-right font-bold">{formatDate(startTime) || BouncingDotsLoading()}</td>
                </tr>
                <tr>
                  <td>Server up time</td>
                  <td className="text-right font-bold">{formatUptime(uptime) || BouncingDotsLoading()}</td>
                </tr>
                <tr>
                  <td>Server Software Version</td>
                  <td className="text-right font-bold">{stats?.server?.version || BouncingDotsLoading()}</td>
                </tr>
                <tr>
                  <td>Run State</td>
                  {
                    status === "error" ? 
                      <td className="text-right text-red-800 font-bold">
                        <span className="bg-red-100 p-2 mr-[-8px] rounded-md">Stop</span>
                      </td>
                      :
                      <td className="text-right text-green-800 font-bold">
                        <span className="bg-green-100 p-2 mr-[-8px] rounded-md">Running</span>
                      </td>
                    }
                </tr>
                <tr>
                  <td>Memory Usage (MB)</td>
                  <td className="text-right font-bold">Allocated {GatewayProcess?.heapUsedMb}, Unused {GatewayProcess?.totalPhysicalMemoryMb - GatewayProcess?.usedPhysicalMemoryMb}</td>
                </tr>
                <tr>
                  <td>Disk Space (GB)</td>
                  <td className="text-right font-bold">Free 129.2 GB, Total 1.9 TB</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="dashboard-panel compact-panel">
            <div className="panel-header">
              <div className="flex items-center gap-2">
                <div className="bg-[#f0e6fa] p-1 rounded-md">
                  <Database style={{ color: "#8b5cf6", width: "1em", height: "1em"}} />
                </div>
                <p className="panel-label">SWIM → AMHS (AMQP Queue)</p>
              </div>
            </div>

            <table className="text-[12px]">
              <tbody>
                <tr>
                  <td>Total</td>
                  <td className="text-right font-bold">
                    {formatNumber(stats?.database?.gw_in?.total)}
                  </td>
                </tr>
                <tr>
                  <td>Pending</td>
                  <td className="text-right font-bold">
                    {formatNumber(stats?.database?.gw_in?.pending)}
                  </td>
                </tr>
                <tr>
                  <td>Converted</td>
                  <td className="text-right font-bold">
                    {formatNumber(stats?.database?.gw_in?.transformed)}
                  </td>
                </tr>
                <tr>
                  <td>Converted Failed</td>
                  <td className="text-right font-bold text-red-500">
                    {formatNumber(stats?.database?.gw_in?.convertFailed)}
                  </td>
                </tr>
                <tr>
                  <td>Sent</td>
                  <td className="text-right font-bold">
                    {formatNumber(stats?.database?.gw_in?.sent)}
                  </td>
                </tr>
                <tr>
                  <td>No Routing</td>
                  <td className="text-right font-bold">
                    {formatNumber(stats?.database?.gw_in?.unrouted)}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="flex items-center justify-between mt-8 gap-16 flex-wrap">
              <div className="relative w-[120px] h-[120px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip 
                      contentStyle={{ background: '#fff', borderRadius: '6px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                    />
                    <Pie
                      data={amqpData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40} // Bán kính vòng trong (bỏ dòng này nếu muốn biểu đồ tròn đặc)
                      outerRadius={60} // Bán kính vòng ngoài
                      paddingAngle={0}  // Khoảng cách nhỏ giữa các miếng bánh
                      dataKey="value"
                      isAnimationActive={false}
                    >
                      {amqpData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                
              </div>
              <div className="flex flex-col gap-3 min-w-[140px]">
                <h3 className="text-[12px] font-bold">Queue Overview</h3>
                {amqpData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between gap-4">
                    {/* Phần chấm màu và Tên trạng thái */}
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-2 h-2 rounded-full shrink-0" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-[12px] text-sm font-medium text-slate-600">{item.name}</span>
                    </div>
                    
                    {/* Phần số lượng / phần trăm hiển thị phía sau */}
                    <span className="text-[12px] text-sm text-slate-800">
                      {item.value} ({((item.value / stats?.database?.gw_in?.total) * 100).toFixed(1)}%)
                    </span>

                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="dashboard-panel compact-panel">
            <div className="panel-header">
              <div className="flex items-center gap-2">
                <div className="bg-[#fdede3] p-1 rounded-md">
                  <Antenna style={{ color: "#f97316", width: "1em", height: "1em" }} />
                </div>
                <p className="panel-label">AMHS → SWIM</p>
              </div>
            </div>

            <table className="text-[12px]">
              <tbody>
                <tr>
                  <td>Total</td>
                  <td className="text-right font-bold">
                    {formatNumber(stats?.database?.gw_out?.total)}
                  </td>
                </tr>
                <tr>
                  <td>Pending</td>
                  <td className="text-right font-bold">
                    {formatNumber(stats?.database?.gw_out?.pending)}
                  </td>
                </tr>
                <tr>
                  <td>Converted</td>
                  <td className="text-right font-bold">
                    {formatNumber(stats?.database?.gw_out?.transformed)}
                  </td>
                </tr>
                <tr>
                  <td>Converted Failed</td>
                  <td className="text-right font-bold text-red-500">
                    {formatNumber(stats?.database?.gw_out?.convertFailed)}
                  </td>
                </tr>
                <tr>
                  <td>Published</td>
                  <td className="text-right font-bold">
                    {formatNumber(stats?.database?.gw_out?.published)}
                  </td>
                </tr>
                <tr>
                  <td>Undefinded</td>
                  <td className="text-right font-bold">
                    {formatNumber(stats?.database?.gw_out?.undefinded)}
                  </td>
                </tr>
              </tbody>
            </table>
            
            <div className="flex items-center justify-between mt-8 gap-16 flex-wrap">
              <div className="relative w-[120px] h-[120px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip 
                      contentStyle={{ background: '#fff', borderRadius: '6px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
                    />
                    <Pie
                      data={amhsData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30} // Bán kính vòng trong (bỏ dòng này nếu muốn biểu đồ tròn đặc)
                      outerRadius={45} // Bán kính vòng ngoài
                      paddingAngle={0}  // Khoảng cách nhỏ giữa các miếng bánh
                      dataKey="value"
                      isAnimationActive={false}
                    >
                      {amhsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                
              </div>
              <div className="flex flex-col gap-3 min-w-[140px]">
                <h3 className="text-[12px] font-bold">Connection Status</h3>
                {amhsData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between gap-4">
                    {/* Phần chấm màu và Tên trạng thái */}
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-2 h-2 rounded-full shrink-0" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-[12px] text-sm font-medium text-slate-600">{item.name}</span>
                    </div>
                    
                    {/* Phần số lượng / phần trăm hiển thị phía sau */}
                    <span className="text-[12px] text-sm text-slate-800">
                      {item.value} ({((item.value / stats?.database?.gw_out?.total) * 100).toFixed(1)}%)
                    </span>

                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

const formatDate = (dateString) => {
  if (!dateString) return "";
  
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) return "";

  const options = {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };

  return new Intl.DateTimeFormat('en-GB', options).format(date).replace(',', '');
};

const formatNumber = (num) => {
  if (num === undefined || num === null) return BouncingDotsLoading();
  return num;
}

const loadingOverlay = (data) => {
  if (!data) 
    return (
      <div className="absolute backdrop-blur-[1px] flex top-0 left-0 w-[100%] h-[100%] bg-[#0000002b] rounded-md">
        <div className="relative items-center w-[100%] block max-w-sm p-6 bg-neutral-primary-soft shadow-xs">
          <div role="status" className="absolute -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2">
          <svg aria-hidden="true" className="w-8 h-8 text-[#000] animate-spin fill-[#fff]" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
          </svg>
          <span className="sr-only">Loading...</span>
        </div>
        </div>
      </div>
    )
}

const BouncingDotsLoading = () => {
  return (
    <div className="flex items-center justify-end space-x-1.5 gap-1 h-fit">
      {/* Chấm 1 */}
      <div className="w-1 h-1 bg-slate-600 m-0 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      {/* Chấm 2 */}
      <div className="w-1 h-1 bg-slate-600 m-0 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      {/* Chấm 3 */}
      <div className="w-1 h-1 bg-slate-600 m-0 rounded-full animate-bounce"></div>
    </div>
  );
};

const ColorByRate = (a, b) => {
  const rate = a/b;
  if (rate > 0.8) {
    return "#00c951";
  } else if (rate > 0.4) {
    return "#fbff0b";
  } else {
    return "#ef4444";
  }
}

const formatUptime = (seconds) => {
  if (!seconds && seconds !== 0) return "0:00:00:00";

  const days = Math.floor(seconds / 86400);
  seconds %= 86400;

  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;

  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  // padStart để luôn có 2 chữ số
  const h = String(hours).padStart(2, "0");
  const m = String(minutes).padStart(2, "0");
  const s = String(secs).padStart(2, "0");

  return `${days}:${h}:${m}:${s}`;
}
