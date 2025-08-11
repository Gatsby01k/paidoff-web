import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import AppSafe from "./AppSafe";
import { WalletProviders } from "./wallet";
import { SAFE } from "./safe";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {SAFE ? (
      <AppSafe />
    ) : (
      <WalletProviders>
        <App />
      </WalletProviders>
    )}
  </React.StrictMode>
);
