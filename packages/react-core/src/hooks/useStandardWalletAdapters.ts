import { Adapter } from '@hermis/solana-headless-core';
import { getStandardWalletAdapters as getBaseStandardWalletAdapters } from '@hermis/solana-headless-adapter-base';
import { useEffect, useMemo, useState } from 'react';

/**
 * Hook for getting standard wallet adapters
 * 
 * This hook integrates with @hermis/solana-headless-adapter-base's
 * getStandardWalletAdapters function to discover and initialize
 * wallet adapters including standard wallets.
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

    useEffect(() => {
        let mounted = true;

        const fetchAdapters = async () => {
            try {
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

    return adapters;
}