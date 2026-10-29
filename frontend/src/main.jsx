import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";
import AuthProvider from "./auth/AuthProvider.jsx";
import { applyLanguage } from "./i18n/i18n.js";
import LanguageProvider from "./i18n/LanguageProvider.jsx";
import { registerServiceWorker } from "./push/push.js";
import "./config.js";
import "./styles/global.css";

applyLanguage();
registerServiceWorker();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>,
);
