import React, { FC, ReactNode, useMemo } from 'react';
import { Connection, ConnectionConfig } from '@agateh/solana-headless-core';
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
}) => {
  // Create a memoized connection instance with the provided endpoint and config
  const connection = useMemo(() => 
    new Connection(endpoint, config), 
    [endpoint, config]
  );
  
  return (
    <ConnectionContext.Provider value={{ connection }}>
      {children}
    </ConnectionContext.Provider>
  );
};