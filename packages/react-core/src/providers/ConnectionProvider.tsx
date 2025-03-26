import { FC, ReactNode, useMemo } from 'react';
import { Connection, ConnectionConfig, WalletAdapterNetwork } from '@agateh/solana-headless-core';
import { ConnectionContext } from '../hooks/useConnection.js';

/**
 * Props for the ConnectionProvider component
 */
export interface ConnectionProviderProps {
  /** Child components */
  children: ReactNode;
  /** Solana RPC endpoint */
  endpoint: string;
  /** Optional connection configuration */
  config?: ConnectionConfig;
  /**Optional Network value */
  network: WalletAdapterNetwork
}

/**
 * Provider for Solana connection
 * 
 * This provider creates and manages a Solana connection instance.
 * 
 * @param props ConnectionProviderProps
 * @returns ConnectionProvider component
 */
export const ConnectionProvider: FC<ConnectionProviderProps> = ({
  children,
  endpoint,
  config = { commitment: 'confirmed' },
  network
}) => {
  const connection = useMemo(() => 
    new Connection(endpoint, config), 
    [endpoint, config]
  );
  
  return (
    <ConnectionContext.Provider value={{ connection, network }}>
      {children}
    </ConnectionContext.Provider>
  );
};