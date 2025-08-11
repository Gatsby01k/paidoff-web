import React from "react";
import { WagmiProvider, http } from "wagmi";
import {
  mainnet,
  polygon,
  arbitrum,
  base,
  optimism,
  sepolia,
} from "wagmi/chains";
import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@rainbow-me/rainbowkit/styles.css";

const projectId = import.meta.env.VITE_WALLETCONNECT_ID || "demo";

// ВАЖНО: никакого createConfig здесь не вызываем.
// getDefaultConfig уже вернет valid wagmi config.
export const wagmiConfig = getDefaultConfig({
  appName: "PaidOFF",
  projectId,
  chains: [mainnet, base, optimism, arbitrum, polygon, sepolia],
  transports: {
    [mainnet.id]: http(),
    [base.id]: http(),
    [optimism.id]: http(),
    [arbitrum.id]: http(),
    [polygon.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: true,
});

const queryClient = new QueryClient();

export function WalletProviders({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
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
