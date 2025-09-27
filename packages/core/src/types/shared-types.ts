// Shared types that need to be used across packages without creating circular dependencies

// Forward declare minimal interfaces to avoid circular dependencies
export interface StandardWalletAccountShared {
  address: string;
  publicKey: Uint8Array;
  features: string[];
  chains?: string[];
  label?: string;
  [key: string]: any;
}

export interface SolanaSignTransactionParamsShared {
  transaction: Uint8Array;
  account: StandardWalletAccountShared;
  chain?: string;
}

export interface SolanaSignTransactionResultShared {
  signedTransaction: Uint8Array;
}

export interface SolanaSignTransactionFeatureShared {
  signTransaction(params: SolanaSignTransactionParamsShared): Promise<SolanaSignTransactionResultShared[]>;
  supportedTransactionVersions?: number[];
}

export interface SolanaSignAndSendTransactionParamsShared {
  account: StandardWalletAccountShared;
  transaction: Uint8Array;
  chain: string | string[];
  options?: Record<string, any>;
}

export interface SolanaSignAndSendTransactionResultShared {
  signature: Uint8Array;
}

export interface SolanaSignAndSendTransactionFeatureShared {
  signAndSendTransaction(params: SolanaSignAndSendTransactionParamsShared): Promise<SolanaSignAndSendTransactionResultShared[]>;
  supportedTransactionVersions?: number[];
}

export interface SolanaSignMessageParamsShared {
  account: StandardWalletAccountShared;
  message: Uint8Array;
}

export interface SolanaSignMessageResultShared {
  signature: Uint8Array;
  signedMessage: Uint8Array;
}

export interface SolanaSignMessageFeatureShared {
  signMessage(params: SolanaSignMessageParamsShared): Promise<SolanaSignMessageResultShared[]>;
}

// Constants for standard method names
export const SolanaSignTransactionMethodShared = 'solana:signTransaction';
export const SolanaSignAndSendTransactionMethodShared = 'solana:signAndSendTransaction';
export const SolanaSignMessageMethodShared = 'solana:signMessage';