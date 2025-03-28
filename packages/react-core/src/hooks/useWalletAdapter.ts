import { useMemo } from 'react';
import { Adapter, WalletName } from '@hermis/solana-headless-core';
import { useWallet } from './useWallet.js';

/**
 * Hook for accessing a specific wallet adapter by name
 * 
 * @param adapterName Optional name of the wallet adapter to access
 * @returns The requested adapter or the currently selected adapter
 */
export function useWalletAdapter(adapterName?: WalletName): Adapter | null {
  const { wallet, wallets } = useWallet();
  
  return useMemo(() => {
    if (adapterName) {
      const adapter = wallets.find((walletItem) => walletItem.adapter.name === adapterName)?.adapter || null;
      return adapter;
    }
    
    return wallet?.adapter || null;
  }, [wallet, wallets, adapterName]);
}