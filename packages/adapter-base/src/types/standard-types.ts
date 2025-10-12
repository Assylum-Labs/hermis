/**
 * Re-export all wallet-standard types from core package
 * This maintains backward compatibility for code that imports from adapter-base
 */

// Export types (interfaces and type aliases)
export type {
  // Account interfaces
  UiWalletAccount,
  StandardWalletAccount,

  // Connect/Disconnect interfaces
  StandardConnectResult,
  StandardConnectFeature,
  StandardDisconnectFeature,

  // Events interfaces
  StandardEventsChangeEvent,
  StandardEventsFeature,

  // Chain identifier
  SolanaChainIdentifier,

  // Transaction interfaces
  SolanaSignTransactionParams,
  SolanaSignTransactionResult,
  SolanaSignTransactionFeature,
  SolanaSignAndSendTransactionParams,
  SolanaSignAndSendTransactionResult,
  SolanaSignAndSendTransactionFeature,

  // Message interfaces
  SolanaSignMessageParams,
  SolanaSignMessageResult,
  SolanaSignMessageFeature,

  // Sign in interfaces
  SolanaSignInParams,
  SolanaSignInResult,
  SolanaSignInFeature,

  // Type unions
  StandardWalletMethod,

  // Features map
  StandardWalletFeatures,

  // Wallet interfaces
  UiWallet,
  TypedStandardWallet,
  UiStandardWallet,
  WalletRegistryEntry,
} from '@hermis/solana-headless-core';

// Export runtime values (constants and functions)
export {
  // Method constants
  StandardConnectMethod,
  StandardDisconnectMethod,
  StandardEventsMethod,
  SolanaSignTransactionMethod,
  SolanaSignAndSendTransactionMethod,
  SolanaSignMessageMethod,
  SolanaSignInMethod,

  // Helper functions
  isWalletAdapterCompatibleStandardWallet,
  toUiWalletAccount,
  toUiWallet,
} from '@hermis/solana-headless-core';
