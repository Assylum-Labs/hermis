import { Adapter } from '@agateh/solana-headless-core';
import { getStandardWalletAdapters as getBaseStandardWalletAdapters } from '@agateh/solana-headless-adapter-base';
import { useEffect, useState } from 'react';

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
  }, [existingAdapters, endpoint]);
  
  return adapters;
}