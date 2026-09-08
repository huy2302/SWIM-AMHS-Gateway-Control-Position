import { createSlice } from "@reduxjs/toolkit";

/** Số điểm giữ lại cho các biểu đồ theo thời gian. */
const HISTORY_SIZE = 20;

const emptyPoint = {
  time: 0,
  timeLabel: "",
  processCpuLoad: 0,
  systemCpuLoad: 0,
  heapUsedMb: 0,
  totalPhysicalMemoryMb: 0,
  usedPhysicalMemoryMb: 0,
  totalRamPercent: 0,
  mysqlConnections: 0,
  mysqlCpu: 0,
  upTime: 0,
};

const num = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);

/** Kẹp về dải 0-100 cho các giá trị phần trăm. */
const percent = (value) => Math.min(Math.max(num(value), 0), 100);

const initialState = {
  uptime: 0,
  status: "running",   // idle | running | error
  error: null,
  GatewayProcess: null,
  Mysql: null,
  // Chuỗi thời gian dùng chung cho sparkline ở Sidebar và các biểu đồ ở màn Giám sát.
  // Tích luỹ tại đây - nơi dữ liệu đi vào - thay vì để từng component tự gom trong
  // useEffect: bỏ được setState trong effect và không còn hai bản logic trùng nhau.
  history: Array(HISTORY_SIZE).fill(emptyPoint),
};

const systemSlice = createSlice({
  name: "system",
  initialState,
  reducers: {
    setUptime: (state, action) => {
      state.uptime = action.payload;
      state.status = "running";
      state.error = null;
    },
    setSystemError: (state, action) => {
      state.status = "error";
      state.error = action.payload;
    },
    /**
     * Ghi nhận một lần lấy mẫu thành công từ /api/system/health.
     *
     * @param action.payload.timeLabel nhãn thời gian do nơi gọi tạo sẵn - reducer phải thuần
     *                                 nên không tự gọi new Date()
     */
    setUsedProcess: (state, action) => {
      const gatewayCp = action.payload.gatewayCp;
      const mysql = action.payload.mysql || action.payload.mysqlCp || null;

      state.GatewayProcess = gatewayCp;
      state.Mysql = mysql;

      const previous = state.history[state.history.length - 1];
      state.history = [
        ...state.history.slice(1),
        {
          time: num(previous?.time) + 1,
          timeLabel: action.payload.timeLabel || "",
          processCpuLoad: percent(gatewayCp?.processCpuLoad),
          systemCpuLoad: percent(gatewayCp?.systemCpuLoad),
          heapUsedMb: num(gatewayCp?.heapUsedMb),
          totalPhysicalMemoryMb: num(gatewayCp?.totalPhysicalMemoryMb),
          usedPhysicalMemoryMb: num(gatewayCp?.usedPhysicalMemoryMb),
          totalRamPercent: percent(gatewayCp?.ramUsedPercent),
          mysqlConnections: num(mysql?.connections),
          mysqlCpu: num(mysql?.cpuPercent),
          upTime: num(gatewayCp?.jvmUptimeSeconds),
        },
      ];
    },
  },
});

export const { setUptime, setSystemError, setUsedProcess } = systemSlice.actions;
export default systemSlice.reducer;
