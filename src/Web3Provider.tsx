import React from 'react'
import { http, createConfig, WagmiProvider } from 'wagmi'
import { defineChain } from 'viem'
import { ConnectKitProvider, getDefaultConfig } from "connectkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export const fiscobcos = defineChain({
  id: 20200,
  name: 'Fisco Bcos',
  nativeCurrency: {
    decimals: 18,
    name: 'FISCO BCOS Token',
    symbol: 'FBT',
  },
  rpcUrls: {
    default: {
      http: ['/api'],
    },
  },
})

const config = createConfig(getDefaultConfig({
  chains: [fiscobcos],
  transports: {
    [fiscobcos.id]: http('/api', {
      fetchOptions: {
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
      },
    }),
  },
  walletConnectProjectId: "d407d7ce99cba317a25976696ed57f26",

  // Required App Info
  appName: "Fisco Bcos",
}))

const queryClient = new QueryClient();

export const Web3Provider = ({ children }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>{children}</ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};