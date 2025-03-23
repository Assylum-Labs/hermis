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
    TransactionVersion,
    LAMPORTS_PER_SOL,
    VersionedTransactionResponse,
    SignatureStatus,
    
} from '@solana/web3.js';

import {
    TOKEN_PROGRAM_ID,
  } from "@solana/spl-token";
  
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
    MessageSignerWalletAdapterProps,
    SignerWalletAdapterProps,
    SignInMessageSignerWalletAdapterProps,
    WalletAdapterProps,
    SignerWalletAdapter, 
    SignInMessageSignerWalletAdapter, 
    SupportedTransactionVersions, 
    WalletAdapter,
} from '@solana/wallet-adapter-base';

// Export only the specific types you need
export type {
    // From web3.js
    // PublicKey,
    MessageSignerWalletAdapterProps,
    SignerWalletAdapterProps,
    SignInMessageSignerWalletAdapterProps,
    WalletAdapterProps,
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
    VersionedTransactionResponse,
    VersionedTransaction,
    SendOptions,
    SignatureStatus,
    LAMPORTS_PER_SOL,
    TOKEN_PROGRAM_ID,
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

/**
 * Interface for Solana Sign-In input parameters
 */
export interface SolanaSignInInput {
    domain?: string;              // The domain requesting the sign-in (e.g. 'example.com')
    statement?: string;           // Human-readable statement that the user is signing
    uri?: string;                 // URI of the service (e.g. 'https://example.com/login')
    version?: string;             // Version of the sign-in message format (e.g. '1')
    nonce?: string;               // Unique nonce to prevent replay attacks
    chainId?: string;             // Chain ID (e.g. 'solana:mainnet')
    issuedAt?: string;            // ISO timestamp when request was issued
    expirationTime?: string;      // ISO timestamp when request expires
    notBefore?: string;           // ISO timestamp before which the message is not valid
    requestId?: string;           // Unique identifier for the sign-in request
    resources?: readonly string[];         // Optional resources/scopes being requested
    [key: string]: any;           // Support for additional custom fields
  }
  
 /**
 * Interface for Solana Sign-In output
 * 
 * This is designed to work with our implementation while being compatible
 * with results from wallet adapters
 */
export interface SolanaSignInOutput {
    // Use a looser type for account to accommodate different wallet implementations
    account: any;
    signature: Uint8Array;        // The signature bytes
    signedMessage: Uint8Array;    // The actual message that was signed
    
    // The following fields are optional to ensure compatibility with wallet standard
    domain?: string;              // Domain that requested the signature  
    nonce?: string;               // Nonce used in the request
    statement?: string;           // The statement that was signed
    version?: string;             // Sign-in message version
    signatureType?: "ed25519";       // Type of signature (e.g. 'ed25519')
    [key: string]: any;           // Additional fields returned by the wallet
  }