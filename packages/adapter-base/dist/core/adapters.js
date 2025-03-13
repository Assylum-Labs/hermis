import { WalletReadyState } from '@agateh/solana-headless-core';
// Store for all initialized adapters
let _adapters = [];
let _selectedAdapter = null;
/**
 * Initialize wallet adapters
 * @param adapters Array of wallet adapters to initialize
 */
export function initAdapters(adapters) {
    // Filter out any unsupported adapters and assign to the store
    _adapters = adapters.filter(adapter => adapter.readyState !== WalletReadyState.Unsupported);
}
/**
 * Select a wallet adapter by name
 * @param walletName Name of the wallet to select
 * @returns The selected adapter or null if not found
 */
export function selectAdapter(walletName) {
    if (!walletName) {
        _selectedAdapter = null;
        return null;
    }
    const adapter = _adapters.find(adapter => adapter.name === walletName) || null;
    _selectedAdapter = adapter;
    return adapter;
}
/**
 * Get the currently selected adapter
 * @returns The currently selected adapter or null
 */
export function getSelectedAdapter() {
    return _selectedAdapter;
}
/**
 * Get all wallet adapters, optionally filtered by ready state
 * @param readyState Optional wallet ready state to filter by
 * @returns Array of wallet providers
 */
export function getWalletAdapters(readyState) {
    let adapters = _adapters;
    if (readyState) {
        adapters = adapters.filter(adapter => adapter.readyState === readyState);
    }
    return adapters.map(adapter => ({
        adapter,
        name: adapter.name,
        icon: adapter.icon,
        url: adapter.url,
        readyState: adapter.readyState
    }));
}
/**
 * Get wallet adapters by ready state
 * @param adapters Array of adapters
 * @param readyState The ready state to filter by
 * @returns Filtered array of adapters
 */
export function getAdaptersByReadyState(adapters, readyState) {
    return adapters.filter(adapter => adapter.readyState === readyState);
}
/**
 * Sort wallet adapters by priority (Installed > Loadable > others)
 * @param adapters Array of wallet adapters
 * @returns Sorted array of wallet adapters
 */
export function sortWalletAdapters(adapters) {
    // Create a copy of the array to avoid mutating the original
    const sortedAdapters = [...adapters];
    // Sort the adapters by ready state priority
    return sortedAdapters.sort((a, b) => {
        if (a.readyState === WalletReadyState.Installed && b.readyState !== WalletReadyState.Installed) {
            return -1;
        }
        if (a.readyState !== WalletReadyState.Installed && b.readyState === WalletReadyState.Installed) {
            return 1;
        }
        if (a.readyState === WalletReadyState.Loadable && b.readyState !== WalletReadyState.Loadable) {
            return -1;
        }
        if (a.readyState !== WalletReadyState.Loadable && b.readyState === WalletReadyState.Loadable) {
            return 1;
        }
        return 0;
    });
}
/**
 * Handler for wallet adapter events
 * @param adapter The wallet adapter to listen to
 * @param handlers Object with event handlers
 * @returns Function to remove the event listeners
 */
export function addWalletAdapterEventListeners(adapter, handlers) {
    const { onConnect, onDisconnect, onError, onReadyStateChange } = handlers;
    if (onConnect) {
        adapter.on('connect', onConnect);
    }
    if (onDisconnect) {
        adapter.on('disconnect', onDisconnect);
    }
    if (onError) {
        adapter.on('error', onError);
    }
    if (onReadyStateChange) {
        adapter.on('readyStateChange', onReadyStateChange);
    }
    // Return function to remove all event listeners
    return () => {
        if (onConnect) {
            adapter.off('connect', onConnect);
        }
        if (onDisconnect) {
            adapter.off('disconnect', onDisconnect);
        }
        if (onError) {
            adapter.off('error', onError);
        }
        if (onReadyStateChange) {
            adapter.off('readyStateChange', onReadyStateChange);
        }
    };
}
