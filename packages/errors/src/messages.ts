/**
 * Human-readable error messages for each error code
 *
 * Messages can include interpolated variables using $variable syntax
 * Variables correspond to properties in the error context
 */

import type { HermisErrorCode } from './codes.js';
import {
  HERMIS_ERROR__WALLET_CONNECTION__NO_WALLET_SELECTED,
  HERMIS_ERROR__WALLET_CONNECTION__NOT_CONNECTED,
  HERMIS_ERROR__WALLET_CONNECTION__FAILED,
  HERMIS_ERROR__WALLET_CONNECTION__DISCONNECT_FAILED,
  HERMIS_ERROR__WALLET_CONNECTION__NOT_READY,
  HERMIS_ERROR__WALLET_CONNECTION__UNSUPPORTED,
  HERMIS_ERROR__WALLET_CONNECTION__AUTO_CONNECT_FAILED,
  HERMIS_ERROR__WALLET_CONNECTION__NO_PUBLIC_KEY,
  HERMIS_ERROR__WALLET_INTERACTION__USER_REJECTED_CONNECTION,
  HERMIS_ERROR__WALLET_INTERACTION__USER_REJECTED_TRANSACTION,
  HERMIS_ERROR__WALLET_INTERACTION__USER_REJECTED_SIGNATURE,
  HERMIS_ERROR__WALLET_INTERACTION__TIMEOUT,
  HERMIS_ERROR__WALLET_INTERACTION__FEATURE_NOT_SUPPORTED,
  HERMIS_ERROR__TRANSACTION__SIGNATURE_FAILED,
  HERMIS_ERROR__TRANSACTION__SEND_FAILED,
  HERMIS_ERROR__TRANSACTION__SIGNATURES_MISSING,
  HERMIS_ERROR__TRANSACTION__FEE_PAYER_MISSING,
  HERMIS_ERROR__TRANSACTION__SERIALIZATION_FAILED,
  HERMIS_ERROR__TRANSACTION__COMPILATION_FAILED,
  HERMIS_ERROR__TRANSACTION__ENCODING_FAILED,
  HERMIS_ERROR__TRANSACTION__CONFIRMATION_FAILED,
  HERMIS_ERROR__TRANSACTION__SIMULATION_FAILED,
  HERMIS_ERROR__TRANSACTION__INVALID_TYPE,
  HERMIS_ERROR__TRANSACTION__VERSION_NOT_SUPPORTED,
  HERMIS_ERROR__TRANSACTION__DESERIALIZATION_FAILED,
  HERMIS_ERROR__TRANSACTION__BATCH_SIGNING_NOT_IMPLEMENTED,
  HERMIS_ERROR__NETWORK__RPC_REQUEST_FAILED,
  HERMIS_ERROR__NETWORK__CONNECTION_FAILED,
  HERMIS_ERROR__NETWORK__BLOCKHASH_UNAVAILABLE,
  HERMIS_ERROR__NETWORK__AIRDROP_FAILED,
  HERMIS_ERROR__NETWORK__ACCOUNT_NOT_FOUND,
  HERMIS_ERROR__NETWORK__INSUFFICIENT_BALANCE,
  HERMIS_ERROR__NETWORK__RATE_LIMIT_EXCEEDED,
  HERMIS_ERROR__SIGNING__MESSAGE_FAILED,
  HERMIS_ERROR__SIGNING__TRANSACTION_FAILED,
  HERMIS_ERROR__SIGNING__ALL_TRANSACTIONS_FAILED,
  HERMIS_ERROR__SIGNING__INVALID_SIGNATURE,
  HERMIS_ERROR__SIGNING__VERIFICATION_FAILED,
  HERMIS_ERROR__SIGNING__KEYPAIR_CONVERSION_FAILED,
  HERMIS_ERROR__SIGNING__PRIVATE_KEY_UNAVAILABLE,
  HERMIS_ERROR__SIGNING__SIGNATURE_NOT_FOUND,
  HERMIS_ERROR__STANDARD_WALLET__FEATURE_NOT_FOUND,
  HERMIS_ERROR__STANDARD_WALLET__METHOD_NOT_IMPLEMENTED,
  HERMIS_ERROR__STANDARD_WALLET__ACCOUNT_NOT_FOUND,
  HERMIS_ERROR__STANDARD_WALLET__ACCOUNT_CHANGE_FAILED,
  HERMIS_ERROR__STANDARD_WALLET__CHAIN_NOT_SUPPORTED,
  HERMIS_ERROR__STANDARD_WALLET__DETECTION_FAILED,
  HERMIS_ERROR__STANDARD_WALLET__REGISTRATION_FAILED,
  HERMIS_ERROR__STANDARD_WALLET__CLUSTER_MISMATCH,
  HERMIS_ERROR__STANDARD_WALLET__ACCOUNT_VALIDATION_FAILED,
  HERMIS_ERROR__KIT__RPC_CONNECTION_FAILED,
  HERMIS_ERROR__KIT__MESSAGE_COMPILATION_FAILED,
  HERMIS_ERROR__KIT__ENCODER_NOT_AVAILABLE,
  HERMIS_ERROR__KIT__DECODER_NOT_AVAILABLE,
  HERMIS_ERROR__KIT__LEGACY_MODE_INCOMPATIBLE,
  HERMIS_ERROR__KIT__CANNOT_SIGN_WITH_ADDRESS,
  HERMIS_ERROR__KIT__LEGACY_CONVERSION_FAILED,
  HERMIS_ERROR__KIT__INVALID_WALLET_TYPE,
  HERMIS_ERROR__KIT__REQUIRES_CONNECTION,
  HERMIS_ERROR__CONFIG__INVALID_CONFIGURATION,
  HERMIS_ERROR__CONFIG__MISSING_REQUIRED,
  HERMIS_ERROR__CONFIG__INVALID_RPC_ENDPOINT,
  HERMIS_ERROR__CONFIG__INVALID_ADAPTER,
  HERMIS_ERROR__CONFIG__STORAGE_INIT_FAILED,
  HERMIS_ERROR__STORAGE__INDEXEDDB_FAILED,
  HERMIS_ERROR__STORAGE__LOCALSTORAGE_FAILED,
  HERMIS_ERROR__STORAGE__READ_FAILED,
  HERMIS_ERROR__STORAGE__WRITE_FAILED,
  HERMIS_ERROR__REACT__CONTEXT_NOT_FOUND,
  HERMIS_ERROR__REACT__INVALID_PROVIDER_CONFIG,
  HERMIS_ERROR__INVARIANT__UNEXPECTED_STATE,
  HERMIS_ERROR__INVARIANT__NULL_VALUE,
  HERMIS_ERROR__INVARIANT__INVALID_ARGUMENT,
  HERMIS_ERROR__INVARIANT__OPERATION_NOT_ALLOWED,
  HERMIS_ERROR__INVARIANT__TYPE_MISMATCH,
} from './codes.js';

/**
 * Error message templates mapped by error code
 */
export const HERMIS_ERROR_MESSAGES: Record<HermisErrorCode, string> = {
  // ============================================
  // 1000-1999: Wallet Connection Errors
  // ============================================
  [HERMIS_ERROR__WALLET_CONNECTION__NO_WALLET_SELECTED]:
    'No wallet has been selected. Please select a wallet before attempting to connect.',

  [HERMIS_ERROR__WALLET_CONNECTION__NOT_CONNECTED]:
    'Wallet is not connected. Please connect your wallet before performing this operation.',

  [HERMIS_ERROR__WALLET_CONNECTION__FAILED]:
    'Failed to connect to wallet "$walletName". $reason',

  [HERMIS_ERROR__WALLET_CONNECTION__DISCONNECT_FAILED]:
    'Failed to disconnect from wallet "$walletName". $reason',

  [HERMIS_ERROR__WALLET_CONNECTION__NOT_READY]:
    'Wallet "$walletName" is not ready. Current state: $readyState. Please ensure the wallet extension is installed and enabled.',

  [HERMIS_ERROR__WALLET_CONNECTION__UNSUPPORTED]:
    'Wallet "$walletName" is not supported on this platform.',

  [HERMIS_ERROR__WALLET_CONNECTION__AUTO_CONNECT_FAILED]:
    'Failed to auto-connect to wallet "$walletName". $reason',

  [HERMIS_ERROR__WALLET_CONNECTION__NO_PUBLIC_KEY]:
    'Wallet public key is not available. The wallet may not be properly connected.',

  // ============================================
  // 2000-2999: Wallet Interaction Errors
  // ============================================
  [HERMIS_ERROR__WALLET_INTERACTION__USER_REJECTED_CONNECTION]:
    'User rejected the connection request for wallet "$walletName".',

  [HERMIS_ERROR__WALLET_INTERACTION__USER_REJECTED_TRANSACTION]:
    'User rejected the transaction request.',

  [HERMIS_ERROR__WALLET_INTERACTION__USER_REJECTED_SIGNATURE]:
    'User rejected the signature request.',

  [HERMIS_ERROR__WALLET_INTERACTION__TIMEOUT]:
    'Operation "$operation" timed out after $timeoutMs milliseconds.',

  [HERMIS_ERROR__WALLET_INTERACTION__FEATURE_NOT_SUPPORTED]:
    'Feature "$feature" is not supported by wallet "$walletName".',

  // ============================================
  // 3000-3999: Transaction Errors
  // ============================================
  [HERMIS_ERROR__TRANSACTION__SIGNATURE_FAILED]:
    'Failed to sign transaction. $reason',

  [HERMIS_ERROR__TRANSACTION__SEND_FAILED]:
    'Failed to send transaction. $reason',

  [HERMIS_ERROR__TRANSACTION__SIGNATURES_MISSING]:
    'Transaction is missing required signatures for addresses: $missingSignatures.',

  [HERMIS_ERROR__TRANSACTION__FEE_PAYER_MISSING]:
    'Transaction fee payer is missing. Legacy transactions require a fee payer to be set.',

  [HERMIS_ERROR__TRANSACTION__SERIALIZATION_FAILED]:
    'Failed to serialize $transactionType transaction. $reason',

  [HERMIS_ERROR__TRANSACTION__COMPILATION_FAILED]:
    'Failed to compile Kit TransactionMessage. $reason',

  [HERMIS_ERROR__TRANSACTION__ENCODING_FAILED]:
    'Failed to encode transaction. $reason',

  [HERMIS_ERROR__TRANSACTION__CONFIRMATION_FAILED]:
    'Transaction confirmation failed for signature "$signature". $reason',

  [HERMIS_ERROR__TRANSACTION__SIMULATION_FAILED]:
    'Transaction simulation failed. $reason',

  [HERMIS_ERROR__TRANSACTION__INVALID_TYPE]:
    'Invalid transaction type. Received: $receivedType. Expected one of: $expectedTypes.',

  [HERMIS_ERROR__TRANSACTION__VERSION_NOT_SUPPORTED]:
    'Wallet "$walletName" does not support transaction version $version.',

  [HERMIS_ERROR__TRANSACTION__DESERIALIZATION_FAILED]:
    'Failed to deserialize transaction. $reason',

  [HERMIS_ERROR__TRANSACTION__BATCH_SIGNING_NOT_IMPLEMENTED]:
    'Batch transaction signing is not yet implemented for $walletType wallets.',

  // ============================================
  // 4000-4999: Network/RPC Errors
  // ============================================
  [HERMIS_ERROR__NETWORK__RPC_REQUEST_FAILED]:
    'RPC request "$method" failed. $reason',

  [HERMIS_ERROR__NETWORK__CONNECTION_FAILED]:
    'Failed to connect to RPC endpoint "$endpoint". $reason',

  [HERMIS_ERROR__NETWORK__BLOCKHASH_UNAVAILABLE]:
    'Failed to retrieve recent blockhash from the network. $reason',

  [HERMIS_ERROR__NETWORK__AIRDROP_FAILED]:
    'Airdrop of $amount SOL to address "$address" failed. $reason',

  [HERMIS_ERROR__NETWORK__ACCOUNT_NOT_FOUND]:
    'Account not found on-chain: $address',

  [HERMIS_ERROR__NETWORK__INSUFFICIENT_BALANCE]:
    'Insufficient balance for address "$address". Required: $required SOL, Available: $available SOL.',

  [HERMIS_ERROR__NETWORK__RATE_LIMIT_EXCEEDED]:
    'RPC rate limit exceeded. Please retry after $retryAfter seconds.',

  // ============================================
  // 5000-5999: Signing Errors
  // ============================================
  [HERMIS_ERROR__SIGNING__MESSAGE_FAILED]:
    'Failed to sign message. $reason',

  [HERMIS_ERROR__SIGNING__TRANSACTION_FAILED]:
    'Failed to sign transaction. $reason',

  [HERMIS_ERROR__SIGNING__ALL_TRANSACTIONS_FAILED]:
    'Failed to sign $transactionCount transactions. $reason',

  [HERMIS_ERROR__SIGNING__INVALID_SIGNATURE]:
    'Invalid signature format. $reason',

  [HERMIS_ERROR__SIGNING__VERIFICATION_FAILED]:
    'Signature verification failed for public key "$publicKey". $reason',

  [HERMIS_ERROR__SIGNING__KEYPAIR_CONVERSION_FAILED]:
    'Failed to convert CryptoKeyPair to Keypair. $reason',

  [HERMIS_ERROR__SIGNING__PRIVATE_KEY_UNAVAILABLE]:
    'Cannot sign with Address type - private key is required. Use a wallet adapter or keypair instead.',

  [HERMIS_ERROR__SIGNING__SIGNATURE_NOT_FOUND]:
    'No signature found for signer address "$address".',

  // ============================================
  // 6000-6999: Standard Wallet Errors
  // ============================================
  [HERMIS_ERROR__STANDARD_WALLET__FEATURE_NOT_FOUND]:
    'Standard wallet feature "$featureName" not found in wallet "$walletName".',

  [HERMIS_ERROR__STANDARD_WALLET__METHOD_NOT_IMPLEMENTED]:
    'Method "$methodName" is not implemented by standard wallet "$walletName".',

  [HERMIS_ERROR__STANDARD_WALLET__ACCOUNT_NOT_FOUND]:
    'Standard wallet account not found in wallet "$walletName".',

  [HERMIS_ERROR__STANDARD_WALLET__ACCOUNT_CHANGE_FAILED]:
    'Failed to detect account change in standard wallet "$walletName". $reason',

  [HERMIS_ERROR__STANDARD_WALLET__CHAIN_NOT_SUPPORTED]:
    'Chain "$chain" is not supported by standard wallet "$walletName".',

  [HERMIS_ERROR__STANDARD_WALLET__DETECTION_FAILED]:
    'Failed to detect wallet "$walletName". $reason',

  [HERMIS_ERROR__STANDARD_WALLET__REGISTRATION_FAILED]:
    'Failed to register wallet "$walletName". $reason',

  [HERMIS_ERROR__STANDARD_WALLET__CLUSTER_MISMATCH]:
    'Cluster mismatch: wallet is connected to "$walletCluster" but transaction is for "$transactionCluster".',

  [HERMIS_ERROR__STANDARD_WALLET__ACCOUNT_VALIDATION_FAILED]:
    'Account validation failed for "$address". $reason',

  // ============================================
  // 7000-7999: Kit Architecture Errors
  // ============================================
  [HERMIS_ERROR__KIT__RPC_CONNECTION_FAILED]:
    'Failed to create Kit RPC connection to "$endpoint". $reason',

  [HERMIS_ERROR__KIT__MESSAGE_COMPILATION_FAILED]:
    'Failed to compile Kit TransactionMessage. $reason',

  [HERMIS_ERROR__KIT__ENCODER_NOT_AVAILABLE]:
    'Kit encoder "$encoderType" is not available. Ensure @solana/kit is properly installed.',

  [HERMIS_ERROR__KIT__DECODER_NOT_AVAILABLE]:
    'Kit decoder "$decoderType" is not available. Ensure @solana/kit is properly installed.',

  [HERMIS_ERROR__KIT__LEGACY_MODE_INCOMPATIBLE]:
    'Feature "$feature" is not compatible with legacy mode. $suggestion',

  [HERMIS_ERROR__KIT__CANNOT_SIGN_WITH_ADDRESS]:
    'Cannot sign with Address type in Kit architecture. Use a CryptoKeyPair or wallet adapter.',

  [HERMIS_ERROR__KIT__LEGACY_CONVERSION_FAILED]:
    'Failed to convert Kit $sourceType to legacy $targetType. $reason',

  [HERMIS_ERROR__KIT__INVALID_WALLET_TYPE]:
    'Invalid wallet type "$walletType" for operation "$operation". Expected one of: $expectedTypes.',

  [HERMIS_ERROR__KIT__REQUIRES_CONNECTION]:
    'Operation "$operation" requires a connection parameter when using Kit architecture.',

  // ============================================
  // 8000-8999: Configuration Errors
  // ============================================
  [HERMIS_ERROR__CONFIG__INVALID_CONFIGURATION]:
    'Invalid configuration for "$configKey". $reason',

  [HERMIS_ERROR__CONFIG__MISSING_REQUIRED]:
    'Required configuration "$requiredConfig" is missing.',

  [HERMIS_ERROR__CONFIG__INVALID_RPC_ENDPOINT]:
    'Invalid RPC endpoint: "$endpoint". $reason',

  [HERMIS_ERROR__CONFIG__INVALID_ADAPTER]:
    'Invalid wallet adapter configuration. $reason',

  [HERMIS_ERROR__CONFIG__STORAGE_INIT_FAILED]:
    'Failed to initialize storage for key "$storageKey". $reason',

  [HERMIS_ERROR__STORAGE__INDEXEDDB_FAILED]:
    'IndexedDB operation "$operation" failed for key "$key". $reason',

  [HERMIS_ERROR__STORAGE__LOCALSTORAGE_FAILED]:
    'LocalStorage operation "$operation" failed for key "$key". $reason',

  [HERMIS_ERROR__STORAGE__READ_FAILED]:
    'Failed to read from storage key "$key". $reason',

  [HERMIS_ERROR__STORAGE__WRITE_FAILED]:
    'Failed to write to storage key "$key". $reason',

  [HERMIS_ERROR__REACT__CONTEXT_NOT_FOUND]:
    'Hook "$hookName" must be used within a "$providerName" provider.',

  [HERMIS_ERROR__REACT__INVALID_PROVIDER_CONFIG]:
    'Invalid configuration for "$providerName" provider. $reason',

  // ============================================
  // 9000-9999: Invariant Violations
  // ============================================
  [HERMIS_ERROR__INVARIANT__UNEXPECTED_STATE]:
    'Unexpected state: $state. This indicates a programming error.',

  [HERMIS_ERROR__INVARIANT__NULL_VALUE]:
    'Unexpected null or undefined value for "$valueName". This indicates a programming error.',

  [HERMIS_ERROR__INVARIANT__INVALID_ARGUMENT]:
    'Invalid argument "$argumentName". Expected $expectedType, received: $receivedValue.',

  [HERMIS_ERROR__INVARIANT__OPERATION_NOT_ALLOWED]:
    'Operation "$operation" is not allowed. $reason',

  [HERMIS_ERROR__INVARIANT__TYPE_MISMATCH]:
    'Type mismatch for "$variableName". Expected $expectedType, received $receivedType.',
};
