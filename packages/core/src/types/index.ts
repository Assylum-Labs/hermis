// src/types/index.ts

// Only re-export specific types that you actually need
import { 
    PublicKey, 
    Connection, 
    Transaction, 
    TransactionSignature, 
    Keypair,
    Commitment,
    ConnectionConfig
  } from '@solana/web3.js';
  
  import {
    Adapter,
    WalletAdapterNetwork,
    WalletError,
    WalletName,
    WalletReadyState
  } from '@solana/wallet-adapter-base';
  
  // Export only the specific types you need
  export type {
    // From web3.js
    PublicKey,
    Connection,
    Transaction,
    TransactionSignature,
    Keypair,
    Commitment,
    ConnectionConfig,
    
    // From wallet-adapter-base
    Adapter,
    WalletAdapterNetwork,
    WalletError,
    WalletName,
    WalletReadyState
  };
  
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