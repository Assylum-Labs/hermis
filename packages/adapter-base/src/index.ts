// Only export the shared types - no implementations that depend on other packages
export * from './types/index.js';

// Export utilities that don't create circular dependencies
export * from './utils/environment.js';

// Export specific utility functions that are used by other packages
export { sortWalletAdapters, getAdaptersByReadyState } from './utils/adapter-utils.js';
export { createLocalStorageUtility } from './utils/storage.js';

// Export Kit integration utilities
export * from './kit-integration.js';
export * from './chain-utils.js';

// Re-export dual architecture types from core for convenience
export type {
    DualArchitectureOptions,
    DualConnection,
    DualTransaction,
    DualWallet,
    LegacyWallet,
    KitWallet,
    // Kit signer types
    MessageModifyingSigner,
    TransactionSendingSigner,
    SignableMessage,
    SignatureDictionary,
} from '@hermis/solana-headless-core';