// Providers
export * from './providers/WalletProvider.js';
export * from './providers/ConnectionProvider.js';

// Core hooks
export * from './hooks/useWallet.js';
export * from './hooks/useConnection.js';
export * from './hooks/useStandardWalletAdapters.js';
export * from './hooks/useLocalStorage.js';
export * from './hooks/useAnchorWallet.js';

// Additional hooks
export * from './hooks/useWalletMultiButton.jsx';
export * from './hooks/useWalletModal.jsx';
export * from './hooks/useSolanaBalance.jsx';
export * from './hooks/useWalletAdapters.jsx';
export * from './hooks/useSolanaTokenAccounts.js';
export * from './hooks/useSolanaTransaction.js';
export * from './hooks/useSolanaNFTs.js';
export * from './hooks/useWalletAdapter.js';

// Components
export * from './components/AgatehWalletProvider.js';
export * from './components/WalletConnectionManager.jsx';
export * from './components/ContextProvider.jsx';

// Utilities
export * from './utils/errors.js';

// Re-export relevant types from core and adapter-base
export { 
  WalletAdapterNetwork, 
  WalletReadyState,
  WalletError 
} from '@agateh/solana-headless-core';

export {
  getIsMobile,
  getStandardWalletAdapters,
  sortWalletAdapters,
  getAdaptersByReadyState,
  SolanaMobileWalletAdapterWalletName
} from '@agateh/solana-headless-adapter-base';