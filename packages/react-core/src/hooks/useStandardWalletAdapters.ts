import { Adapter } from '@agateh/solana-headless-core';
import { getStandardWalletAdapters as getBaseStandardWalletAdapters } from '@agateh/solana-headless-adapter-base';
import { useEffect, useMemo, useState } from 'react';

/**
 * Hook for getting standard wallet adapters
 * 
 * This hook integrates with @agateh/solana-headless-adapter-base's
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

  // Memoize the existingAdapters array to prevent unnecessary effect reruns
  const memoizedAdapters = useMemo(() => existingAdapters, [
    // If you need to detect changes within the array, add specific dependencies
    // For example, if you need to detect when array length changes:
    existingAdapters.length,
    // Or if you can identify adapters by a stable ID, you can include those:
    // ...existingAdapters.map(adapter => adapter.name)
  ]);
  
  // Fetch standard wallet adapters on mount and when dependencies change
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
        
        // Fall back to existing adapters on error
        if (mounted) {
          setAdapters(existingAdapters);
        }
      }
    };
    
    fetchAdapters();
    
    return () => {
      mounted = false;
    };
//   }, [endpoint]);
  }, [memoizedAdapters, endpoint]);
//   }, [existingAdapters, endpoint]);
  
  return adapters;
}