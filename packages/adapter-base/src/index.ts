// Only export the shared types - no implementations that depend on other packages
export * from './types/index.js';

// Export utilities that don't create circular dependencies
export * from './utils/environment.js';

// Export specific utility functions that are used by other packages
export { sortWalletAdapters, getAdaptersByReadyState } from './utils/adapter-utils.js';
export { createLocalStorageUtility } from './utils/storage.js';

// Re-export dual architecture types from core for convenience
export type {
    DualArchitectureOptions,
    DualConnection,
    DualTransaction,
    DualWallet,
    LegacyWallet,
    KitWallet,
} from '@hermis/solana-headless-core';