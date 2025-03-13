import { Adapter, WalletName, WalletReadyState, PublicKey } from '@agateh/solana-headless-core';
import { WalletProvider } from '../types.js';
/**
 * Initialize wallet adapters
 * @param adapters Array of wallet adapters to initialize
 */
export declare function initAdapters(adapters: Adapter[]): void;
/**
 * Select a wallet adapter by name
 * @param walletName Name of the wallet to select
 * @returns The selected adapter or null if not found
 */
export declare function selectAdapter(walletName: WalletName | null): Adapter | null;
/**
 * Get the currently selected adapter
 * @returns The currently selected adapter or null
 */
export declare function getSelectedAdapter(): Adapter | null;
/**
 * Get all wallet adapters, optionally filtered by ready state
 * @param readyState Optional wallet ready state to filter by
 * @returns Array of wallet providers
 */
export declare function getWalletAdapters(readyState?: WalletReadyState): WalletProvider[];
/**
 * Get wallet adapters by ready state
 * @param adapters Array of adapters
 * @param readyState The ready state to filter by
 * @returns Filtered array of adapters
 */
export declare function getAdaptersByReadyState(adapters: Adapter[], readyState: WalletReadyState): Adapter[];
/**
 * Sort wallet adapters by priority (Installed > Loadable > others)
 * @param adapters Array of wallet adapters
 * @returns Sorted array of wallet adapters
 */
export declare function sortWalletAdapters(adapters: Adapter[]): Adapter[];
/**
 * Handler for wallet adapter events
 * @param adapter The wallet adapter to listen to
 * @param handlers Object with event handlers
 * @returns Function to remove the event listeners
 */
export declare function addWalletAdapterEventListeners(adapter: Adapter, handlers: {
    onConnect?: (publicKey: PublicKey) => void;
    onDisconnect?: () => void;
    onError?: (error: Error) => void;
    onReadyStateChange?: (readyState: WalletReadyState) => void;
}): () => void;
