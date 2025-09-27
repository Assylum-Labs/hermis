import { WalletReadyState } from '@solana/wallet-adapter-base';
import { SolanaMobileWalletAdapterWalletName } from './environment.js';

// Generic adapter interface that doesn't create circular dependencies
interface BaseAdapter {
  name: string;
  readyState: WalletReadyState;
  [key: string]: any;
}

/**
 * Get wallet adapters by ready state
 * @param adapters Array of adapters
 * @param readyState The ready state to filter by
 * @returns Filtered array of adapters
 */
export function getAdaptersByReadyState<T extends BaseAdapter>(adapters: T[], readyState: WalletReadyState): T[] {
  return adapters.filter(adapter => adapter.readyState === readyState);
}

/**
 * Sort wallet adapters by priority (Mobile > Installed > Loadable > others)
 * @param adapters Array of wallet adapters
 * @returns Sorted array of wallet adapters
 */
export function sortWalletAdapters<T extends BaseAdapter>(adapters: T[]): T[] {
  // Create a copy of the array to avoid mutating the original
  const sortedAdapters = [...adapters];

  // Sort the adapters by ready state priority
  return sortedAdapters.sort((a, b) => {
    // Mobile wallet adapter gets top priority on mobile
    if (a.name === SolanaMobileWalletAdapterWalletName) return -1;
    if (b.name === SolanaMobileWalletAdapterWalletName) return 1;

    // Then installed wallets
    if (a.readyState === WalletReadyState.Installed && b.readyState !== WalletReadyState.Installed) {
      return -1;
    }
    if (a.readyState !== WalletReadyState.Installed && b.readyState === WalletReadyState.Installed) {
      return 1;
    }

    // Then loadable wallets
    if (a.readyState === WalletReadyState.Loadable && b.readyState !== WalletReadyState.Loadable) {
      return -1;
    }
    if (a.readyState !== WalletReadyState.Loadable && b.readyState === WalletReadyState.Loadable) {
      return 1;
    }

    return 0;
  });
}