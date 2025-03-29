import { Connection, WalletAdapterNetwork } from '@hermis/solana-headless-core';
import { createContext, useContext } from 'react';

/**
 * State for the connection context
 */
export interface ConnectionContextState {
    connection: Connection;
    network?: WalletAdapterNetwork
}

/**
 * Context for connection functionality
 */
export const ConnectionContext = createContext<ConnectionContextState>({} as ConnectionContextState);

/**
 * Hook for accessing Solana connection
 * 
 * @returns ConnectionContextState
 */
export function useConnection(): ConnectionContextState {
    const connectionContext = useContext(ConnectionContext);
    if (connectionContext === undefined) {
        throw new Error("useConnection must be used within an ConnectionProvider");
    }
    return connectionContext;
}