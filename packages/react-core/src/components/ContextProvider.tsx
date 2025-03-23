import React, { FC, ReactNode, useState, useEffect } from 'react';
import { Adapter, WalletAdapterNetwork } from '@agateh/solana-headless-core';
// import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
// import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { AgatehWalletProvider } from './AgatehWalletProvider.js';
import { useStandardWalletAdapters } from '../hooks/useStandardWalletAdapters.js';
import { StorageProviderFactory } from '../hooks/useLocalStorage.js';

/**
 * Props for the ContextProvider component
 */
export interface ContextProviderProps {
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
  onError?: (error: any, adapter?: Adapter) => void;
//   /** Whether to include default adapters (Phantom and Solflare) */
//   includeDefaultAdapters?: boolean;
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
export const ContextProvider: FC<ContextProviderProps> = ({
  children,
  rpcEndpoint = 'https://api.mainnet-beta.solana.com',
  network = WalletAdapterNetwork.Mainnet,
  autoConnect = false,
  storageKey = 'walletName',
  storageFactory,
  additionalAdapters = [],
  onError,
//   includeDefaultAdapters = true,
}) => {
  // Set up default adapters
  const [adapters, setAdapters] = useState<Adapter[]>([]);
  
  // Initialize default adapters
  useEffect(() => {
    const baseAdapters: Adapter[] = [];
    
    // Add default adapters if enabled
    // if (includeDefaultAdapters) {
    //   try {
    //     // Only add adapters if packages are available
    //     // baseAdapters.push(new PhantomWalletAdapter());
    //     // baseAdapters.push(new SolflareWalletAdapter());
    //   } catch (error) {
    //     console.warn('Could not initialize default wallet adapters:', error);
    //   }
    // }
    
    // Add additional adapters
    setAdapters([...baseAdapters, ...additionalAdapters]);
  }, [additionalAdapters]);
//   }, [additionalAdapters, includeDefaultAdapters]);
  
  // Get standard wallet adapters - this handles async detection
  const allAdapters = useStandardWalletAdapters(adapters, rpcEndpoint);
  
  return (
    <AgatehWalletProvider
      adapters={allAdapters}
      rpcEndpoint={rpcEndpoint}
      network={network}
      autoConnect={autoConnect}
      storageKey={storageKey}
      storageFactory={storageFactory}
      onError={onError}
    >
      {children}
    </AgatehWalletProvider>
  );
};