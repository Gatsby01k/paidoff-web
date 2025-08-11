import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { WalletProviders } from "./wallet";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WalletProviders>
      <App />
    </WalletProviders>
  </React.StrictMode>
);
