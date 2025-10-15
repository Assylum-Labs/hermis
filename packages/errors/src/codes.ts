/**
 * Error codes for Hermis Solana Headless SDK
 *
 * Organized into ranges:
 * - 1000-1999: Wallet Connection Errors
 * - 2000-2999: Wallet Interaction Errors
 * - 3000-3999: Transaction Errors
 * - 4000-4999: Network/RPC Errors
 * - 5000-5999: Signing Errors
 * - 6000-6999: Standard Wallet Errors
 * - 7000-7999: Kit Architecture Errors
 * - 8000-8999: Configuration Errors
 * - 9000-9999: Invariant Violations
 *
 * NOTE: These are constants, not enums, to enable tree-shaking
 */

// ============================================
// 1000-1999: Wallet Connection Errors
// ============================================

/** No wallet adapter has been selected */
export const HERMIS_ERROR__WALLET_CONNECTION__NO_WALLET_SELECTED = 1000 as const;

/** Wallet is not connected */
export const HERMIS_ERROR__WALLET_CONNECTION__NOT_CONNECTED = 1001 as const;

/** Wallet connection failed */
export const HERMIS_ERROR__WALLET_CONNECTION__FAILED = 1002 as const;

/** Wallet disconnection failed */
export const HERMIS_ERROR__WALLET_CONNECTION__DISCONNECT_FAILED = 1003 as const;

/** Wallet is not ready (not installed or not loaded) */
export const HERMIS_ERROR__WALLET_CONNECTION__NOT_READY = 1004 as const;

/** Wallet is not supported on this platform */
export const HERMIS_ERROR__WALLET_CONNECTION__UNSUPPORTED = 1005 as const;

/** Auto-connect failed */
export const HERMIS_ERROR__WALLET_CONNECTION__AUTO_CONNECT_FAILED = 1006 as const;

/** Wallet public key is not available */
export const HERMIS_ERROR__WALLET_CONNECTION__NO_PUBLIC_KEY = 1007 as const;

// ============================================
// 2000-2999: Wallet Interaction Errors
// ============================================

/** User rejected the connection request */
export const HERMIS_ERROR__WALLET_INTERACTION__USER_REJECTED_CONNECTION = 2000 as const;

/** User rejected the transaction */
export const HERMIS_ERROR__WALLET_INTERACTION__USER_REJECTED_TRANSACTION = 2001 as const;

/** User rejected the signature request */
export const HERMIS_ERROR__WALLET_INTERACTION__USER_REJECTED_SIGNATURE = 2002 as const;

/** Wallet operation timed out */
export const HERMIS_ERROR__WALLET_INTERACTION__TIMEOUT = 2003 as const;

/** Wallet does not support the requested feature */
export const HERMIS_ERROR__WALLET_INTERACTION__FEATURE_NOT_SUPPORTED = 2004 as const;

// ============================================
// 3000-3999: Transaction Errors
// ============================================

/** Transaction signature failed */
export const HERMIS_ERROR__TRANSACTION__SIGNATURE_FAILED = 3000 as const;

/** Transaction send failed */
export const HERMIS_ERROR__TRANSACTION__SEND_FAILED = 3001 as const;

/** Transaction is missing required signatures */
export const HERMIS_ERROR__TRANSACTION__SIGNATURES_MISSING = 3002 as const;

/** Transaction fee payer is missing */
export const HERMIS_ERROR__TRANSACTION__FEE_PAYER_MISSING = 3003 as const;

/** Transaction serialization failed */
export const HERMIS_ERROR__TRANSACTION__SERIALIZATION_FAILED = 3004 as const;

/** Transaction compilation failed (Kit architecture) */
export const HERMIS_ERROR__TRANSACTION__COMPILATION_FAILED = 3005 as const;

/** Transaction encoding failed (Kit architecture) */
export const HERMIS_ERROR__TRANSACTION__ENCODING_FAILED = 3006 as const;

/** Transaction confirmation failed */
export const HERMIS_ERROR__TRANSACTION__CONFIRMATION_FAILED = 3007 as const;

/** Transaction simulation failed */
export const HERMIS_ERROR__TRANSACTION__SIMULATION_FAILED = 3008 as const;

/** Invalid transaction type */
export const HERMIS_ERROR__TRANSACTION__INVALID_TYPE = 3009 as const;

// ============================================
// 4000-4999: Network/RPC Errors
// ============================================

/** RPC request failed */
export const HERMIS_ERROR__NETWORK__RPC_REQUEST_FAILED = 4000 as const;

/** Network connection failed */
export const HERMIS_ERROR__NETWORK__CONNECTION_FAILED = 4001 as const;

/** Failed to get recent blockhash */
export const HERMIS_ERROR__NETWORK__BLOCKHASH_UNAVAILABLE = 4002 as const;

/** Airdrop request failed */
export const HERMIS_ERROR__NETWORK__AIRDROP_FAILED = 4003 as const;

/** Account not found on-chain */
export const HERMIS_ERROR__NETWORK__ACCOUNT_NOT_FOUND = 4004 as const;

/** Insufficient SOL balance */
export const HERMIS_ERROR__NETWORK__INSUFFICIENT_BALANCE = 4005 as const;

/** Rate limit exceeded */
export const HERMIS_ERROR__NETWORK__RATE_LIMIT_EXCEEDED = 4006 as const;

// ============================================
// 5000-5999: Signing Errors
// ============================================

/** Message signing failed */
export const HERMIS_ERROR__SIGNING__MESSAGE_FAILED = 5000 as const;

/** Transaction signing failed */
export const HERMIS_ERROR__SIGNING__TRANSACTION_FAILED = 5001 as const;

/** Multiple transaction signing failed */
export const HERMIS_ERROR__SIGNING__ALL_TRANSACTIONS_FAILED = 5002 as const;

/** Invalid signature format */
export const HERMIS_ERROR__SIGNING__INVALID_SIGNATURE = 5003 as const;

/** Signature verification failed */
export const HERMIS_ERROR__SIGNING__VERIFICATION_FAILED = 5004 as const;

// ============================================
// 6000-6999: Standard Wallet Errors
// ============================================

/** Standard wallet feature not found */
export const HERMIS_ERROR__STANDARD_WALLET__FEATURE_NOT_FOUND = 6000 as const;

/** Standard wallet method not implemented */
export const HERMIS_ERROR__STANDARD_WALLET__METHOD_NOT_IMPLEMENTED = 6001 as const;

/** Standard wallet account not found */
export const HERMIS_ERROR__STANDARD_WALLET__ACCOUNT_NOT_FOUND = 6002 as const;

/** Standard wallet account change detection failed */
export const HERMIS_ERROR__STANDARD_WALLET__ACCOUNT_CHANGE_FAILED = 6003 as const;

/** Standard wallet chain not supported */
export const HERMIS_ERROR__STANDARD_WALLET__CHAIN_NOT_SUPPORTED = 6004 as const;

// ============================================
// 7000-7999: Kit Architecture Errors
// ============================================

/** Kit RPC connection failed */
export const HERMIS_ERROR__KIT__RPC_CONNECTION_FAILED = 7000 as const;

/** Kit transaction message compilation failed */
export const HERMIS_ERROR__KIT__MESSAGE_COMPILATION_FAILED = 7001 as const;

/** Kit encoder not available */
export const HERMIS_ERROR__KIT__ENCODER_NOT_AVAILABLE = 7002 as const;

/** Kit decoder not available */
export const HERMIS_ERROR__KIT__DECODER_NOT_AVAILABLE = 7003 as const;

/** Kit feature not supported in legacy mode */
export const HERMIS_ERROR__KIT__LEGACY_MODE_INCOMPATIBLE = 7004 as const;

// ============================================
// 8000-8999: Configuration Errors
// ============================================

/** Invalid configuration provided */
export const HERMIS_ERROR__CONFIG__INVALID_CONFIGURATION = 8000 as const;

/** Required configuration missing */
export const HERMIS_ERROR__CONFIG__MISSING_REQUIRED = 8001 as const;

/** Invalid RPC endpoint */
export const HERMIS_ERROR__CONFIG__INVALID_RPC_ENDPOINT = 8002 as const;

/** Invalid adapter configuration */
export const HERMIS_ERROR__CONFIG__INVALID_ADAPTER = 8003 as const;

/** Storage utility initialization failed */
export const HERMIS_ERROR__CONFIG__STORAGE_INIT_FAILED = 8004 as const;

// ============================================
// 9000-9999: Invariant Violations
// ============================================

/** Invariant violation: unexpected state */
export const HERMIS_ERROR__INVARIANT__UNEXPECTED_STATE = 9000 as const;

/** Invariant violation: null or undefined value */
export const HERMIS_ERROR__INVARIANT__NULL_VALUE = 9001 as const;

/** Invariant violation: invalid argument */
export const HERMIS_ERROR__INVARIANT__INVALID_ARGUMENT = 9002 as const;

/** Invariant violation: operation not allowed */
export const HERMIS_ERROR__INVARIANT__OPERATION_NOT_ALLOWED = 9003 as const;

/** Invariant violation: type mismatch */
export const HERMIS_ERROR__INVARIANT__TYPE_MISMATCH = 9004 as const;

// ============================================
// Union Type for Type Safety
// ============================================

export type HermisErrorCode =
  // Wallet Connection Errors
  | typeof HERMIS_ERROR__WALLET_CONNECTION__NO_WALLET_SELECTED
  | typeof HERMIS_ERROR__WALLET_CONNECTION__NOT_CONNECTED
  | typeof HERMIS_ERROR__WALLET_CONNECTION__FAILED
  | typeof HERMIS_ERROR__WALLET_CONNECTION__DISCONNECT_FAILED
  | typeof HERMIS_ERROR__WALLET_CONNECTION__NOT_READY
  | typeof HERMIS_ERROR__WALLET_CONNECTION__UNSUPPORTED
  | typeof HERMIS_ERROR__WALLET_CONNECTION__AUTO_CONNECT_FAILED
  | typeof HERMIS_ERROR__WALLET_CONNECTION__NO_PUBLIC_KEY
  // Wallet Interaction Errors
  | typeof HERMIS_ERROR__WALLET_INTERACTION__USER_REJECTED_CONNECTION
  | typeof HERMIS_ERROR__WALLET_INTERACTION__USER_REJECTED_TRANSACTION
  | typeof HERMIS_ERROR__WALLET_INTERACTION__USER_REJECTED_SIGNATURE
  | typeof HERMIS_ERROR__WALLET_INTERACTION__TIMEOUT
  | typeof HERMIS_ERROR__WALLET_INTERACTION__FEATURE_NOT_SUPPORTED
  // Transaction Errors
  | typeof HERMIS_ERROR__TRANSACTION__SIGNATURE_FAILED
  | typeof HERMIS_ERROR__TRANSACTION__SEND_FAILED
  | typeof HERMIS_ERROR__TRANSACTION__SIGNATURES_MISSING
  | typeof HERMIS_ERROR__TRANSACTION__FEE_PAYER_MISSING
  | typeof HERMIS_ERROR__TRANSACTION__SERIALIZATION_FAILED
  | typeof HERMIS_ERROR__TRANSACTION__COMPILATION_FAILED
  | typeof HERMIS_ERROR__TRANSACTION__ENCODING_FAILED
  | typeof HERMIS_ERROR__TRANSACTION__CONFIRMATION_FAILED
  | typeof HERMIS_ERROR__TRANSACTION__SIMULATION_FAILED
  | typeof HERMIS_ERROR__TRANSACTION__INVALID_TYPE
  // Network/RPC Errors
  | typeof HERMIS_ERROR__NETWORK__RPC_REQUEST_FAILED
  | typeof HERMIS_ERROR__NETWORK__CONNECTION_FAILED
  | typeof HERMIS_ERROR__NETWORK__BLOCKHASH_UNAVAILABLE
  | typeof HERMIS_ERROR__NETWORK__AIRDROP_FAILED
  | typeof HERMIS_ERROR__NETWORK__ACCOUNT_NOT_FOUND
  | typeof HERMIS_ERROR__NETWORK__INSUFFICIENT_BALANCE
  | typeof HERMIS_ERROR__NETWORK__RATE_LIMIT_EXCEEDED
  // Signing Errors
  | typeof HERMIS_ERROR__SIGNING__MESSAGE_FAILED
  | typeof HERMIS_ERROR__SIGNING__TRANSACTION_FAILED
  | typeof HERMIS_ERROR__SIGNING__ALL_TRANSACTIONS_FAILED
  | typeof HERMIS_ERROR__SIGNING__INVALID_SIGNATURE
  | typeof HERMIS_ERROR__SIGNING__VERIFICATION_FAILED
  // Standard Wallet Errors
  | typeof HERMIS_ERROR__STANDARD_WALLET__FEATURE_NOT_FOUND
  | typeof HERMIS_ERROR__STANDARD_WALLET__METHOD_NOT_IMPLEMENTED
  | typeof HERMIS_ERROR__STANDARD_WALLET__ACCOUNT_NOT_FOUND
  | typeof HERMIS_ERROR__STANDARD_WALLET__ACCOUNT_CHANGE_FAILED
  | typeof HERMIS_ERROR__STANDARD_WALLET__CHAIN_NOT_SUPPORTED
  // Kit Architecture Errors
  | typeof HERMIS_ERROR__KIT__RPC_CONNECTION_FAILED
  | typeof HERMIS_ERROR__KIT__MESSAGE_COMPILATION_FAILED
  | typeof HERMIS_ERROR__KIT__ENCODER_NOT_AVAILABLE
  | typeof HERMIS_ERROR__KIT__DECODER_NOT_AVAILABLE
  | typeof HERMIS_ERROR__KIT__LEGACY_MODE_INCOMPATIBLE
  // Configuration Errors
  | typeof HERMIS_ERROR__CONFIG__INVALID_CONFIGURATION
  | typeof HERMIS_ERROR__CONFIG__MISSING_REQUIRED
  | typeof HERMIS_ERROR__CONFIG__INVALID_RPC_ENDPOINT
  | typeof HERMIS_ERROR__CONFIG__INVALID_ADAPTER
  | typeof HERMIS_ERROR__CONFIG__STORAGE_INIT_FAILED
  // Invariant Violations
  | typeof HERMIS_ERROR__INVARIANT__UNEXPECTED_STATE
  | typeof HERMIS_ERROR__INVARIANT__NULL_VALUE
  | typeof HERMIS_ERROR__INVARIANT__INVALID_ARGUMENT
  | typeof HERMIS_ERROR__INVARIANT__OPERATION_NOT_ALLOWED
  | typeof HERMIS_ERROR__INVARIANT__TYPE_MISMATCH;
