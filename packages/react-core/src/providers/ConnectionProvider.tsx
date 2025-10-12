import { FC, ReactNode, useMemo } from 'react';
import { Connection, ConnectionConfig, WalletAdapterNetwork } from '@hermis/solana-headless-core';
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
 * Provider for Solana connection with dual architecture support
 *
 * This provider creates and manages a Solana connection instance that works
 * with both legacy (@solana/web3.js) and Kit (@solana/kit) architectures.
 *
 * By default, this creates a legacy Connection from @solana/web3.js, which is
 * compatible with all existing code. The connection is typed as DualConnection,
 * meaning it will work seamlessly with:
 * - Legacy transactions (Transaction, VersionedTransaction)
 * - Kit transactions (TransactionMessage)
 * - All dual architecture helper functions
 *
 * To use a Kit Rpc connection instead, you can create a custom connection provider
 * that creates a Kit Rpc instance and passes it through the same context.
 *
 * @example
 * // Standard usage with legacy connection (default)
 * <ConnectionProvider endpoint="https://api.devnet.solana.com" network="devnet">
 *   <YourApp />
 * </ConnectionProvider>
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