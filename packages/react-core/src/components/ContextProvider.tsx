import React, { FC, ReactNode, useMemo } from 'react';
import { Adapter, ConnectionConfig, WalletAdapterNetwork } from '@agateh/solana-headless-core';
import { WalletProvider as BaseWalletProvider } from '../providers/WalletProvider.js';
import { ConnectionProvider } from '../providers/ConnectionProvider.js';
import { StorageProviderFactory } from '../hooks/useLocalStorage.js';

/**
 * Props for the combined wallet and connection provider
 */
export interface ContextProviderProps {
  /** Children components */
  children: ReactNode;
  /** Wallet adapters to use */
  adapters: Adapter[];
  /** RPC endpoint for Solana connection */
  rpcEndpoint: string;
  /** Network to connect to */
  network?: WalletAdapterNetwork;
  /** Whether to automatically connect to the last used wallet */
  autoConnect?: boolean;
  /** Key for storing wallet name in storage */
  storageKey?: string;
  /** Custom storage factory for persisting wallet selection */
  storageFactory?: StorageProviderFactory;
  /** Error handler for wallet errors */
  onError?: (error: any, adapter?: Adapter) => void;
}

/**
 * Combined provider for Solana wallet and connection
 * 
 * This component combines both the ConnectionProvider and WalletProvider
 * for easier setup of Solana wallet functionality in React applications.
 * 
 * It supports custom storage mechanisms via the storageFactory prop.
 * 
 * @param props AgatehWalletProviderProps
 * @returns Provider component
 */
export const ContextProvider: FC<ContextProviderProps> = ({
  children,
  adapters,
  rpcEndpoint,
  network = WalletAdapterNetwork.Mainnet,
  autoConnect = false,
  storageKey = 'walletName',
  storageFactory,
  onError,
}) => {
  const connectionConfig = useMemo(() => ({
    commitment: 'confirmed',
  }) as ConnectionConfig, []);
  
  return (
    <ConnectionProvider endpoint={rpcEndpoint} config={connectionConfig}>
      <BaseWalletProvider 
        wallets={adapters} 
        autoConnect={autoConnect}
        storageKey={storageKey}
        storageFactory={storageFactory}
        onError={onError}
      >
        {children}
      </BaseWalletProvider>
    </ConnectionProvider>
  );
};