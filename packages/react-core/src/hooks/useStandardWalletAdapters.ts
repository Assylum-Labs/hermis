import { Adapter, WalletAdapterNetwork } from '@hermis/solana-headless-core';
import {
  getStandardWalletAdapters as getBaseStandardWalletAdapters,
  subscribeToWalletAdapterChanges
} from '@hermis/wallet-standard-base';
import { useEffect, useMemo, useState } from 'react';

/**
 * Hook for getting standard wallet adapters
 *
 * This hook integrates with @hermis/wallet-standard-base's
 * getStandardWalletAdapters function to discover and initialize
 * wallet adapters including standard wallets.
 *
 * The base library handles all initialization and change detection automatically.
 *
 * `network` must be supplied explicitly — we do not infer the cluster from the
 * RPC endpoint URL (substring matching is unsafe).
 *
 * @param existingAdapters Existing adapters to include
 * @param endpoint Optional RPC endpoint for mobile wallet adapter
 * @param network Active Solana network for the cluster hint
 * @returns Array of Adapters
 */
export function useStandardWalletAdapters(
    existingAdapters: Adapter[] = [],
    endpoint: string | undefined,
    network: WalletAdapterNetwork,
): Adapter[] {
    const [adapters, setAdapters] = useState<Adapter[]>(existingAdapters);

    // Identity-stable key over the adapter set. Memoising on `.length` would
    // miss swaps where the array length stays the same but the adapters differ.
    const adapterNamesKey = useMemo(
        () => existingAdapters.map(a => a.name).join('|'),
        [existingAdapters],
    );

    // Initial fetch of adapters
    useEffect(() => {
        let mounted = true;

        const fetchAdapters = async () => {
            try {
                // The base library handles initialization and change detection automatically
                const standardAdapters = await getBaseStandardWalletAdapters(
                    existingAdapters,
                    endpoint,
                    network,
                );

                if (mounted) {
                    setAdapters(standardAdapters);
                }
            } catch (error) {
                console.error('Error getting standard wallet adapters:', error);

                if (mounted) {
                    setAdapters(existingAdapters);
                }
            }
        };

        fetchAdapters();

        return () => {
            mounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [adapterNamesKey, endpoint, network]);

    // Subscribe to dynamic adapter changes
    useEffect(() => {
        let mounted = true;

        const unsubscribe = subscribeToWalletAdapterChanges((updatedAdapters: Adapter[]) => {
            if (mounted) {
                
                // The subscription only provides standard wallets, we need to merge with existing adapters
                const mergedAdapters = [...existingAdapters, ...updatedAdapters];
                
                // Remove duplicates based on adapter name
                const uniqueAdapters = mergedAdapters.filter((adapter, index, array) => 
                    array.findIndex(a => a.name === adapter.name) === index
                );
                
                setAdapters(uniqueAdapters);
            }
        });

        return () => {
            mounted = false;
            unsubscribe();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [adapterNamesKey]);

    return adapters;
}