import { configureStore } from "@reduxjs/toolkit";
import systemReducer from "./systemSlice";

export const store = configureStore({
  reducer: {
    system: systemReducer,
  },
});
