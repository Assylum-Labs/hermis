import { FC, ReactNode, useState, useEffect, useMemo } from 'react';
import { Adapter, WalletAdapterNetwork, WalletError } from '@hermis/solana-headless-core';
import { ContextProvider } from './ContextProvider.js';
import { useStandardWalletAdapters } from '../hooks/useStandardWalletAdapters.js';
import { StorageProviderFactory } from '../hooks/useLocalStorage.js';

/**
 * Props for the ContextProvider component
 */
export interface HermisWalletProviderProps {
  /** Children components */
  children: ReactNode;
  /** RPC endpoint for Solana connection */
  rpcEndpoint?: string;
  /** Network to connect to */
  network?: WalletAdapterNetwork;
  /** Whether to automatically connect to the last used wallet */
  autoConnect?: boolean;
  /** Key for storing wallet name in storage */
  storageKey?: string;
  /** Custom storage factory for persisting wallet selection */
  storageFactory?: StorageProviderFactory;
  /** Additional wallet adapters to use */
  additionalAdapters?: Adapter[];
  /** Error handler for wallet errors */
  onError?: (error: WalletError, adapter?: Adapter) => void;
}

/**
 * Complete context provider with default adapters
 * 
 * This component provides a complete setup for Solana wallet functionality
 * with default adapters (Phantom and Solflare) and automatic detection of
 * standard wallets.
 * 
 * @param props ContextProviderProps
 * @returns Provider component
 */
export const HermisProvider = ({
  children,
  rpcEndpoint = 'https://api.mainnet-beta.solana.com',
  network = WalletAdapterNetwork.Mainnet,
  autoConnect = false,
  storageKey = 'walletName',
  storageFactory,
  additionalAdapters = [],
  onError,
}: HermisWalletProviderProps) => {
  const [adapters, setAdapters] = useState<Adapter[]>([]);

  const memoizedAdapters = useMemo(() =>
    additionalAdapters, [

    additionalAdapters.length,
  ]);

  useEffect(() => {
    const baseAdapters: Adapter[] = [];

    setAdapters([...baseAdapters, ...additionalAdapters]);
  }, [memoizedAdapters]);

  const allAdapters = useStandardWalletAdapters(adapters, rpcEndpoint);

  return (
    <ContextProvider
      adapters={allAdapters}
      rpcEndpoint={rpcEndpoint}
      network={network}
      autoConnect={autoConnect}
      storageKey={storageKey}
      storageFactory={storageFactory}
      onError={onError}
    >
      {children}
    </ContextProvider>
  );
};