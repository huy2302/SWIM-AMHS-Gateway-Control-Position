import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  uptime: 0,
  status: "running",   // idle | running | error
  error: null,
  GatewayProcess: null,
  Mysql: null,
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
      state.GatewayProcess = action.payload.gatewayCp;
      state.Mysql = action.payload.mysql || action.payload.mysqlCp || null;
    }
  },
});

export const { setUptime, setSystemError, setUsedProcess } = systemSlice.actions;
export default systemSlice.reducer;
