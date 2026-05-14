import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  uptime: 0,
  status: "connecting",   // idle | running | error
  error: null,
  CpuLoad: 0,
  MemoryUsage: 0,
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
    setUsedProcess: (state, action) => {
      state.usedProcess = action.payload;
      state.CpuLoad = action.payload.cpu;
      state.MemoryUsage = action.payload.memory;
    }
  },
});

export const { setUptime, setSystemError, setUsedProcess } = systemSlice.actions;
export default systemSlice.reducer;
