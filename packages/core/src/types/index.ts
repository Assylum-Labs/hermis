
type SendOptions = {
  skipPreflight?: boolean;
  preflightCommitment?: Commitment;
  maxRetries?: number;
  minContextSlot?: number;
}

type SignatureStatus = {
  slot: number;
  confirmations: number | null;
  err: TransactionError | null;
  confirmationStatus?: TransactionConfirmationStatus;
}

type SupportedTransactionVersions = ReadonlySet<TransactionVersion> | null | undefined
type TransactionSignature = string
type VersionedTransactionResponse = {
  slot: number;
  transaction: {
      message: VersionedMessage;
      signatures: string[];
  };
  meta: ConfirmedTransactionMeta | null;
  blockTime?: number | null;
  version?: TransactionVersion;
}

type WalletAdapter<Name extends string = string> = WalletAdapterProps<Name> & EventEmitter<WalletAdapterEvents, any>
type SignInMessageSignerWalletAdapter<Name extends string = string> = WalletAdapterProps<Name> & EventEmitter<WalletAdapterEvents, any> & SignInMessageSignerWalletAdapterProps<Name>

// Only re-export specific types that you actually need
import { 
    PublicKey, 
    Connection, 
    Transaction,  
    Keypair,
    Commitment,
    ConnectionConfig,
    VersionedTransaction,
    TransactionVersion,
    LAMPORTS_PER_SOL,
    TransactionError,
    TransactionConfirmationStatus,
    VersionedMessage,
    ConfirmedTransactionMeta,
} from '@solana/web3.js';

export {
  SystemProgram,
} from '@solana/web3.js';

import {
    TOKEN_PROGRAM_ID,
  } from "@solana/spl-token";

// Kit types are imported directly in transaction/index.ts where they're used
// This avoids export conflicts at the package level

// Import Kit RPC types for dual connection support
import type { Rpc, RpcSubscriptions } from '@solana/kit';

  import {
    Adapter,
    WalletAdapterNetwork,
    WalletError,
    WalletNotReadyError,
    WalletName,
    WalletReadyState,
    WalletAdapterEvents,
    BaseWalletAdapter,
    EventEmitter,

    // MessageSignerWalletAdapter,
    BaseMessageSignerWalletAdapter as MessageSignerWalletAdapter,
    MessageSignerWalletAdapterProps,
    BaseSignInMessageSignerWalletAdapter as SignerWalletAdapterProps,
    SignInMessageSignerWalletAdapterProps,
    WalletAdapterProps,
    BaseSignerWalletAdapter as SignerWalletAdapter,
    // SignInMessageSignerWalletAdapter,
    // SupportedTransactionVersions,
    // WalletAdapter,
    // WalletAdapter as nativeAdapter,
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
    // Keypair,
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
    Keypair,
    Connection,
    Transaction,
    TransactionSignature,
    VersionedTransactionResponse,
    VersionedTransaction,
    SendOptions,
    SignatureStatus,
    LAMPORTS_PER_SOL,
    TOKEN_PROGRAM_ID,
    MessageSignerWalletAdapter,
    SignerWalletAdapter,
    SignInMessageSignerWalletAdapter,
    SupportedTransactionVersions,
    WalletAdapter,

    WalletNotReadyError,
    WalletError,
    WalletAdapterNetwork,
    WalletReadyState,
    BaseWalletAdapter,
    EventEmitter,
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


  // Import TypedStandardWallet from local wallet-standard-types
  import { TypedStandardWallet } from './wallet-standard-types.js';

  // Export all wallet-standard types
  export * from './wallet-standard-types.js';

  // Types for dual architecture support
  export type LegacyWallet = Keypair | Adapter | TypedStandardWallet;
  export type KitWallet = CryptoKeyPair | string | object; // CryptoKeyPair, Address (string), or MessagePartialSigner (object)
  export type DualWallet = LegacyWallet | KitWallet;

  export type LegacyTransaction = Transaction | VersionedTransaction;
  export type DualTransaction = LegacyTransaction | object; // TransactionMessage is an object

  // Connection types for dual architecture support
  export type LegacyConnection = Connection;
  export type KitConnection = Rpc<any>; // Using any for generic parameter as Kit Rpc needs a transport type
  export type DualConnection = LegacyConnection | KitConnection;

  /**
   * Helper to detect if a connection is a legacy Connection from @solana/web3.js
   */
  export function isLegacyConnection(connection: DualConnection): connection is LegacyConnection {
    return (
      connection !== null &&
      typeof connection === 'object' &&
      'rpcEndpoint' in connection &&
      'commitment' in connection &&
      '_rpcRequest' in connection
    );
  }

  /**
   * Helper to detect if a connection is a Kit Rpc from @solana/kit
   */
  export function isKitConnection(connection: DualConnection): connection is KitConnection {
    return !isLegacyConnection(connection);
  }

  // Options for dual architecture operations
  export interface DualArchitectureOptions {
    preferKitArchitecture?: boolean;
    fallbackToLegacy?: boolean;
    /**
     * Specify which account to use for signing operations (for multi-account wallets)
     * - PublicKey: web3.js style public key
     * - string: Kit/Address style or base58 encoded public key
     * - undefined: defaults to first account (index 0)
     */
    account?: PublicKey | string;
    /**
     * Specify the Solana chain/cluster for wallet standard operations
     * - Examples: 'solana:mainnet', 'solana:devnet', 'solana:testnet', 'solana:mainnet-beta'
     * - undefined: defaults to 'solana:mainnet'
     */
    chain?: string;
  }

  // Interface for wallet signing capabilities
  export interface WalletSigningCapabilities {
    canSignTransaction: boolean;
    canSignAllTransactions: boolean;
    canSignMessage: boolean;
    supportedTransactionVersions?: Set<number>;
    supportsKitArchitecture?: boolean;
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