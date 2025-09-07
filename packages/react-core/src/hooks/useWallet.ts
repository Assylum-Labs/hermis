import {
    Adapter,
    MessageSignerWalletAdapterProps,
    PublicKey,
    SignerWalletAdapterProps,
    SignInMessageSignerWalletAdapterProps,
    WalletAdapter,
    WalletAdapterProps,
    WalletName,
    WalletReadyState
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

    sendTransaction: WalletAdapterProps['sendTransaction'];
    signTransaction: SignerWalletAdapterProps['signTransaction'] | undefined;
    signAndSendTransaction: WalletAdapterProps['sendTransaction'];
    signAllTransactions: SignerWalletAdapterProps['signAllTransactions'] | undefined;
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