import { 
    Adapter, 
    MessageSignerWalletAdapterProps,
    PublicKey, 
    SignerWalletAdapterProps, 
    SignInMessageSignerWalletAdapterProps,
    WalletAdapterProps,
    WalletName,
    WalletReadyState
  } from '@agateh/solana-headless-core';
  import { createContext, useContext } from 'react';
  
  /**
   * Interface for a wallet
   */
  export interface Wallet {
    adapter: Adapter;
    readyState: WalletReadyState; // WalletReadyState
    // readyState: number; // WalletReadyState
  }
  
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
    connect(): Promise<boolean>;
    disconnect(): Promise<void>;
  
    sendTransaction: WalletAdapterProps['sendTransaction'];
    signTransaction: SignerWalletAdapterProps['signTransaction'] | undefined;
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