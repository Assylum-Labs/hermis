import { useMemo } from 'react';
import { Adapter, WalletReadyState } from '@agateh/solana-headless-core';
import { sortWalletAdapters, getAdaptersByReadyState } from '@agateh/solana-headless-adapter-base';
import { useWallet } from './useWallet.js';

/**
 * Interface for grouped wallet adapters
 */
export interface GroupedWalletAdapters {
    installed: Adapter[];
    loadable: Adapter[];
    notDetected: Adapter[];
    all: Adapter[];
}

/**
 * Hook for working with wallet adapters, including sorting and filtering
 * 
 * @returns Object with grouped and sorted wallet adapters
 */
export function useWalletAdapters(): GroupedWalletAdapters {
    const { wallets } = useWallet();

    return useMemo(() => {
        const adapters = wallets.map(wallet => wallet.adapter);
        const sortedAdapters = sortWalletAdapters(adapters);

        const installed = getAdaptersByReadyState(sortedAdapters, WalletReadyState.Installed);
        const loadable = getAdaptersByReadyState(sortedAdapters, WalletReadyState.Loadable);
        const notDetected = getAdaptersByReadyState(sortedAdapters, WalletReadyState.NotDetected);

        return {
            installed,
            loadable,
            notDetected,
            all: sortedAdapters
        };
    }, [wallets]);
}