import { Connection, WalletAdapterNetwork, DualConnection } from '@hermis/solana-headless-core';
import { HermisError, HERMIS_ERROR__REACT__CONTEXT_NOT_FOUND } from '@hermis/errors';
import { createContext, useContext } from 'react';
import { TWalletAdapterNetwork } from '../index.js';

/**
 * State for the connection context
 * Supports both legacy (@solana/web3.js Connection) and Kit (@solana/kit Rpc) architectures
 */
export interface ConnectionContextState {
    /**
     * The Solana connection
     * - Legacy: Connection from @solana/web3.js
     * - Kit: Rpc from @solana/kit
     *
     * Most operations will work seamlessly with either connection type
     * thanks to the dual architecture helpers in the core package.
     */
    connection: DualConnection;
    network: TWalletAdapterNetwork
}

/**
 * Context for connection functionality
 */
export const ConnectionContext = createContext<ConnectionContextState>({} as ConnectionContextState);

/**
 * Hook for accessing Solana connection
 *
 * Returns a connection that can be either legacy or Kit architecture.
 * The connection will work with all dual architecture transaction methods.
 *
 * @returns ConnectionContextState with DualConnection
 */
export function useConnection(): ConnectionContextState {
    const connectionContext = useContext(ConnectionContext);
    if (connectionContext === undefined) {
        throw new HermisError(
            HERMIS_ERROR__REACT__CONTEXT_NOT_FOUND,
            { hookName: 'useConnection', providerName: 'ConnectionProvider' }
        );
    }
    return connectionContext;
}