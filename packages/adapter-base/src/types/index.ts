// Re-export wallet adapter types from @solana/wallet-adapter-base
// This allows other packages to import these types from adapter-base instead of directly from @solana/wallet-adapter-base

import {
    Adapter,
    WalletAdapterNetwork,
    WalletError,
    WalletNotReadyError,
    WalletName,
    WalletReadyState,
    WalletAdapterEvents,
    BaseWalletAdapter,
    EventEmitter,
    BaseMessageSignerWalletAdapter as MessageSignerWalletAdapter,
    MessageSignerWalletAdapterProps,
    BaseSignInMessageSignerWalletAdapter as SignerWalletAdapterProps,
    SignInMessageSignerWalletAdapterProps,
    WalletAdapterProps,
    BaseSignerWalletAdapter as SignerWalletAdapter,
} from '@solana/wallet-adapter-base';

// Export types
export type {
    MessageSignerWalletAdapterProps,
    SignerWalletAdapterProps,
    SignInMessageSignerWalletAdapterProps,
    WalletAdapterProps,
    Adapter,
    WalletName,
    WalletAdapterEvents,
};

export {
    MessageSignerWalletAdapter,
    SignerWalletAdapter,
    WalletNotReadyError,
    WalletError,
    WalletAdapterNetwork,
    WalletReadyState,
    BaseWalletAdapter,
    EventEmitter,
}

// Additional exports for wallet-standard compatibility
// Import specific types from their respective modules
import type { SupportedTransactionVersions } from '@solana/wallet-adapter-base';
import type { WalletAdapter } from '@solana/wallet-adapter-base';
import { BaseSignInMessageSignerWalletAdapter } from '@solana/wallet-adapter-base';

export {
    BaseSignInMessageSignerWalletAdapter as SignInMessageSignerWalletAdapter,
};

export type { SupportedTransactionVersions, WalletAdapter };

// Re-export all standard wallet types
export * from './standard-types.js';

// Re-export dual architecture types
export * from './dual-types.js';