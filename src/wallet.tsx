// src/wallet.tsx
import React from "react";
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet, polygon, arbitrum, base, optimism, sepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getDefaultConfig, RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";

const wcId = import.meta.env.VITE_WALLETCONNECT_ID || "demo";

const config = createConfig(
  getDefaultConfig({
    appName: "PaidOFF",
    projectId: wcId,
    chains: [mainnet, base, optimism, arbitrum, polygon, sepolia],
    transports: {
      [mainnet.id]: http(),
      [base.id]: http(),
      [optimism.id]: http(),
      [arbitrum.id]: http(),
      [polygon.id]: http(),
      [sepolia.id]: http()
    },
    ssr: true
  })
);

const qc = new QueryClient();

export function WalletProviders({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={qc}>
        <RainbowKitProvider
          theme={darkTheme({
            borderRadius: "large",
            overlayBlur: "small",
            accentColor: "#FEE440",
          })}
          modalSize="compact"
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
