// src/types/index.ts

// Only re-export specific types that you actually need
import { 
    PublicKey, 
    Connection, 
    Transaction, 
    TransactionSignature, 
    Keypair,
    Commitment,
    ConnectionConfig,
    VersionedTransaction,
    SendOptions,
    TransactionVersion
  } from '@solana/web3.js';
  
  import {
    Adapter,
    WalletAdapterNetwork,
    WalletError,
    WalletName,
    WalletReadyState,
    WalletAdapterEvents,
    BaseWalletAdapter,
    EventEmitter,

    MessageSignerWalletAdapter,
    SignerWalletAdapter, 
    SignInMessageSignerWalletAdapter, 
    SupportedTransactionVersions, 
    WalletAdapter,
  } from '@solana/wallet-adapter-base';
  
  // Export only the specific types you need
  export type {
    // From web3.js
    // PublicKey,
    // Connection,
    // Transaction,
    // TransactionSignature,
    Keypair,
    Commitment,
    ConnectionConfig,
    TransactionVersion,
    // VersionedTransaction,
    
    // From wallet-adapter-base
    Adapter,
    // WalletAdapterNetwork,
    WalletName,
    WalletAdapterEvents,
    // WalletReadyState
};

export {
    PublicKey,
    Connection,
    Transaction,
    TransactionSignature,
    VersionedTransaction,
    SendOptions,
    
    // Keypair,
    // Commitment,
    // ConnectionConfig,
    MessageSignerWalletAdapter,
    SignerWalletAdapter, 
    SignInMessageSignerWalletAdapter, 
    SupportedTransactionVersions, 
    WalletAdapter,
    
    WalletError,
    WalletAdapterNetwork,
    WalletReadyState,
    BaseWalletAdapter,
    EventEmitter
  }
  
  // Add your own custom types
  export interface WalletConnectionOptions {
    autoConnect?: boolean;
    onConnect?: () => void;
    onDisconnect?: () => void;
    onError?: (error: Error) => void;
  }
  
  export interface TransactionOptions {
    skipPreflight?: boolean;
    preflightCommitment?: Commitment;
    maxRetries?: number;
  }