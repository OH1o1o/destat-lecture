import { createModal } from "@rabby-wallet/rabbykit";
import {
  createConfig,
  disconnect,
  getAccount,
  http,
  reconnect,
  switchChain,
  watchAccount,
} from "@wagmi/core";
import { hardhat } from "@wagmi/core/chains";
import { injected } from "@wagmi/connectors";

// Browser-only module: RabbyKit uses the DOM and injected wallet providers.
// MetaMask extension connections do not require a WalletConnect project ID.
export const config = createConfig({
  chains: [hardhat],
  connectors: [injected({ target: "metaMask" })],
  transports: { [hardhat.id]: http("http://127.0.0.1:8545") },
});

export const rabbykit = createModal({
  wagmi: config,
  showWalletConnect: false,
  customButtons: [{
    name: "MetaMask 설치 안내",
    logo: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" stroke="currentColor" stroke-width="2"/></svg>',
    onClick: () => {
      window.open("https://metamask.io/download/", "_blank", "noopener,noreferrer");
    },
  }],
});
export const getWalletAccount = () => getAccount(config);
export const watchWalletAccount = (
  onChange: (account: ReturnType<typeof getWalletAccount>) => void,
) => watchAccount(config, { onChange });
export const reconnectWallet = () => reconnect(config);
export const disconnectWallet = () => disconnect(config);
export const switchToHardhat = () =>
  switchChain(config, {
    chainId: hardhat.id,
    addEthereumChainParameter: {
      chainName: "Hardhat Local",
      rpcUrls: ["http://127.0.0.1:8545"],
      nativeCurrency: hardhat.nativeCurrency,
    },
  });
