import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";
import { DialogHost } from "./lib/dialog.jsx";
import "./styles.css";
import "./admin.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
        <DialogHost />
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>,
);
