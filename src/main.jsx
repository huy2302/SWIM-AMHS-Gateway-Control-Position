import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store/store";
import "./index.css";
import App from "./App.jsx";

// Main entry point for the React application.
// Renders the App component into the DOM root element with StrictMode for development checks.
createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <StrictMode>
      <App />
    </StrictMode>
  </Provider>
);
