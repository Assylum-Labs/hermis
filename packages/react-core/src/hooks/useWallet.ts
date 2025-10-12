import {
    Adapter,
    MessageSignerWalletAdapterProps,
    PublicKey,
    SignerWalletAdapterProps,
    SignInMessageSignerWalletAdapterProps,
    WalletAdapter,
    WalletAdapterProps,
    WalletName,
    WalletReadyState,
    Connection,
    DualArchitectureOptions,
    DualTransaction,
    DualConnection
} from '@hermis/solana-headless-core';
import { createContext, useContext } from 'react';

/**
 * Interface for a wallet
 */
export interface Wallet {
    adapter: Adapter;
    readyState: WalletReadyState; // WalletReadyState
    // readyState: number; // WalletReadyState
}

export type TWalletAdapterProps = WalletAdapterProps['sendTransaction'] & SignerWalletAdapterProps['signTransaction']

/**
 * State for the wallet context
 */
export interface WalletContextState {
    autoConnect: boolean;
    wallets: Wallet[];
    wallet: Wallet | null;
    publicKey: PublicKey | null;
    connecting: boolean;
    connected: boolean;
    disconnecting: boolean;

    select(walletName: WalletName | null): Promise<void>;
    connect(): Promise<WalletAdapter>;
    disconnect(): Promise<void>;

    /**
     * Sign a transaction - EXTENDED to support both web3.js and Kit architectures
     * @param transaction - Can be web3.js Transaction/VersionedTransaction OR Kit TransactionMessage
     * @param options - Optional dual architecture configuration
     * @returns Promise resolving to the signed transaction
     *
     * @example
     * // Web3.js usage (legacy)
     * const web3Tx = new Transaction();
     * const signed = await signTransaction(web3Tx);
     *
     * // Kit usage (NEW!)
     * const kitTx = await createKitTransaction(...);
     * const signed = await signTransaction(kitTx);
     */
    signTransaction<T extends DualTransaction = DualTransaction>(transaction: T, options?: DualArchitectureOptions): Promise<T>;

    /**
     * Send a transaction - EXTENDED to support both web3.js and Kit architectures
     * @param transaction - The transaction to send (supports both architectures)
     * @param connection - The Solana connection (Legacy Connection or Kit Rpc)
     * @param options - Optional dual architecture configuration
     * @returns Promise resolving to the transaction signature
     *
     * @example
     * // Web3.js usage (legacy)
     * const signature = await sendTransaction(web3Tx, connection);
     *
     * // Kit usage (NEW!)
     * const signature = await sendTransaction(kitTx, connection);
     */
    sendTransaction<T extends DualTransaction = DualTransaction>(
        transaction: T,
        connection: DualConnection,
        options?: DualArchitectureOptions
    ): Promise<string>;

    /**
     * Sign and send a transaction - EXTENDED to support both web3.js and Kit architectures
     * @param transaction - The transaction to sign and send (supports both architectures)
     * @param connection - The Solana connection (Legacy Connection or Kit Rpc)
     * @param options - Optional dual architecture configuration
     * @returns Promise resolving to the transaction signature
     */
    signAndSendTransaction<T extends DualTransaction = DualTransaction>(
        transaction: T,
        connection: DualConnection,
        options?: DualArchitectureOptions
    ): Promise<string>;

    /**
     * Sign multiple transactions - EXTENDED to support both web3.js and Kit architectures
     * @param transactions - Array of transactions (all same architecture)
     * @param options - Optional dual architecture configuration
     * @returns Promise resolving to array of signed transactions
     */
    signAllTransactions<T extends DualTransaction = DualTransaction>(transactions: T[], options?: DualArchitectureOptions): Promise<T[]>;

    signMessage: MessageSignerWalletAdapterProps['signMessage'] | undefined;
    signIn: SignInMessageSignerWalletAdapterProps['signIn'] | undefined;

    hasFeature(feature: 'signMessage' | 'signTransaction' | 'signAllTransactions' | 'signIn'): boolean;
}

/**
 * Context for wallet functionality
 */
export const WalletContext = createContext<WalletContextState>({} as WalletContextState);

/**
 * Hook for accessing wallet functionality
 * 
 * @returns WalletContextState
 */
export function useWallet(): WalletContextState {
    return useContext(WalletContext);
}