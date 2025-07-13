import { Adapter } from '@hermis/solana-headless-core';
import { 
  getStandardWalletAdapters as getBaseStandardWalletAdapters,
  subscribeToWalletAdapterChanges 
} from '@hermis/solana-headless-adapter-base';
import { useEffect, useMemo, useState } from 'react';

/**
 * Hook for getting standard wallet adapters
 * 
 * This hook integrates with @hermis/solana-headless-adapter-base's
 * getStandardWalletAdapters function to discover and initialize
 * wallet adapters including standard wallets.
 * 
 * The base library handles all initialization and change detection automatically.
 * 
 * @param existingAdapters Existing adapters to include
 * @param endpoint Optional RPC endpoint for mobile wallet adapter
 * @returns Array of Adapters
 */
export function useStandardWalletAdapters(
    existingAdapters: Adapter[] = [],
    endpoint?: string
): Adapter[] {
    const [adapters, setAdapters] = useState<Adapter[]>(existingAdapters);

    const memoizedAdapters = useMemo(() => existingAdapters, [
        existingAdapters.length,
    ]);

    // Initial fetch of adapters
    useEffect(() => {
        let mounted = true;

        const fetchAdapters = async () => {
            try {
                // The base library handles initialization and change detection automatically
                const standardAdapters = await getBaseStandardWalletAdapters(
                    existingAdapters,
                    endpoint
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
    }, [memoizedAdapters, endpoint]);

    // Subscribe to dynamic adapter changes
    useEffect(() => {
        let mounted = true;

        const unsubscribe = subscribeToWalletAdapterChanges((updatedAdapters: Adapter[]) => {
            if (mounted) {
                console.log('[useStandardWalletAdapters] Adapters updated from base library');
                
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
    }, [existingAdapters]); // Add existingAdapters as dependency

    return adapters;
}