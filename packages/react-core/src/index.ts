export * from './providers/WalletProvider.js';
export * from './providers/ConnectionProvider.js';

export * from './hooks/useWallet.js';
export * from './hooks/useConnection.js';
export * from './hooks/useStandardWalletAdapters.js';
export * from './hooks/useLocalStorage.js';
export * from './hooks/useAnchorWallet.js';

export * from './hooks/useWalletMultiButton.js';
export * from './hooks/useWalletModal.js';
export * from './hooks/useSolanaBalance.js';
export * from './hooks/useWalletAdapters.js';
export * from './hooks/useSolanaTokenAccounts.js';
export * from './hooks/useSolanaTransaction.js';
export * from './hooks/useSolanaNFTs.js';
export * from './hooks/useWalletAdapter.js';

export * from './components/ContextProvider.js';
export * from './components/WalletConnectionManager.js';
export * from './components/HermisProvider.js';

export * from './utils/errors.js';

export type { WalletName } from '@hermis/solana-headless-core';

export {
  WalletAdapterNetwork,
  WalletReadyState,
  WalletError,
  // Core transaction methods - NOW SUPPORT BOTH web3.js AND Kit!
  signMessage,
  signTransaction,
  signAllTransactions,
  sendTransaction,
  signAndSendTransaction,
  // Kit-specific utilities
  createKitTransaction,
  generateKitKeypair,
  generateKeyPairSigner,
  signTransactionWithSigner,
  createRPCConnection,
  sendTransactionWithRPC,
  signMessageWithKitCryptoKeyPair,
  signMessageWithGeneratedKitKeypair,
  supportsKitArchitecture,
  isKitTransaction
} from '@hermis/solana-headless-core';

export {
  getIsMobile,
  sortWalletAdapters,
  getAdaptersByReadyState,
  SolanaMobileWalletAdapterWalletName,
} from '@hermis/solana-headless-adapter-base';

export {
  getStandardWalletAdapters
} from '@hermis/wallet-standard-base';