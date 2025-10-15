/**
 * Context type definitions for each error code
 *
 * Maps error codes to their associated metadata/context
 * This enables type-safe error creation and handling
 */

import type {
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
  HERMIS_ERROR__STANDARD_WALLET__FEATURE_NOT_FOUND,
  HERMIS_ERROR__STANDARD_WALLET__METHOD_NOT_IMPLEMENTED,
  HERMIS_ERROR__STANDARD_WALLET__ACCOUNT_NOT_FOUND,
  HERMIS_ERROR__STANDARD_WALLET__ACCOUNT_CHANGE_FAILED,
  HERMIS_ERROR__STANDARD_WALLET__CHAIN_NOT_SUPPORTED,
  HERMIS_ERROR__KIT__RPC_CONNECTION_FAILED,
  HERMIS_ERROR__KIT__MESSAGE_COMPILATION_FAILED,
  HERMIS_ERROR__KIT__ENCODER_NOT_AVAILABLE,
  HERMIS_ERROR__KIT__DECODER_NOT_AVAILABLE,
  HERMIS_ERROR__KIT__LEGACY_MODE_INCOMPATIBLE,
  HERMIS_ERROR__CONFIG__INVALID_CONFIGURATION,
  HERMIS_ERROR__CONFIG__MISSING_REQUIRED,
  HERMIS_ERROR__CONFIG__INVALID_RPC_ENDPOINT,
  HERMIS_ERROR__CONFIG__INVALID_ADAPTER,
  HERMIS_ERROR__CONFIG__STORAGE_INIT_FAILED,
  HERMIS_ERROR__INVARIANT__UNEXPECTED_STATE,
  HERMIS_ERROR__INVARIANT__NULL_VALUE,
  HERMIS_ERROR__INVARIANT__INVALID_ARGUMENT,
  HERMIS_ERROR__INVARIANT__OPERATION_NOT_ALLOWED,
  HERMIS_ERROR__INVARIANT__TYPE_MISMATCH,
} from './codes.js';

/**
 * Context mapping for each error code
 *
 * Each error code can have optional context data that provides
 * additional information about the error
 */
export type HermisErrorContext = {
  // ============================================
  // 1000-1999: Wallet Connection Errors
  // ============================================
  [HERMIS_ERROR__WALLET_CONNECTION__NO_WALLET_SELECTED]: Record<string, never>;

  [HERMIS_ERROR__WALLET_CONNECTION__NOT_CONNECTED]: {
    walletName?: string;
  };

  [HERMIS_ERROR__WALLET_CONNECTION__FAILED]: {
    walletName: string;
    reason?: string;
    originalError?: string;
  };

  [HERMIS_ERROR__WALLET_CONNECTION__DISCONNECT_FAILED]: {
    walletName: string;
    reason?: string;
    originalError?: string;
  };

  [HERMIS_ERROR__WALLET_CONNECTION__NOT_READY]: {
    walletName: string;
    readyState: string;
  };

  [HERMIS_ERROR__WALLET_CONNECTION__UNSUPPORTED]: {
    walletName: string;
    platform?: string;
  };

  [HERMIS_ERROR__WALLET_CONNECTION__AUTO_CONNECT_FAILED]: {
    walletName: string;
    reason?: string;
    originalError?: string;
  };

  [HERMIS_ERROR__WALLET_CONNECTION__NO_PUBLIC_KEY]: {
    walletName?: string;
  };

  // ============================================
  // 2000-2999: Wallet Interaction Errors
  // ============================================
  [HERMIS_ERROR__WALLET_INTERACTION__USER_REJECTED_CONNECTION]: {
    walletName: string;
  };

  [HERMIS_ERROR__WALLET_INTERACTION__USER_REJECTED_TRANSACTION]: {
    walletName: string;
    transactionSignature?: string;
  };

  [HERMIS_ERROR__WALLET_INTERACTION__USER_REJECTED_SIGNATURE]: {
    walletName: string;
    messagePreview?: string;
  };

  [HERMIS_ERROR__WALLET_INTERACTION__TIMEOUT]: {
    operation: string;
    timeoutMs: number;
    walletName?: string;
  };

  [HERMIS_ERROR__WALLET_INTERACTION__FEATURE_NOT_SUPPORTED]: {
    feature: string;
    walletName: string;
  };

  // ============================================
  // 3000-3999: Transaction Errors
  // ============================================
  [HERMIS_ERROR__TRANSACTION__SIGNATURE_FAILED]: {
    reason?: string;
    originalError?: string;
    transactionType?: string;
  };

  [HERMIS_ERROR__TRANSACTION__SEND_FAILED]: {
    reason?: string;
    originalError?: string;
    signature?: string;
  };

  [HERMIS_ERROR__TRANSACTION__SIGNATURES_MISSING]: {
    missingSignatures: string[];
  };

  [HERMIS_ERROR__TRANSACTION__FEE_PAYER_MISSING]: {
    transactionType?: string;
  };

  [HERMIS_ERROR__TRANSACTION__SERIALIZATION_FAILED]: {
    transactionType: string;
    reason?: string;
    originalError?: string;
  };

  [HERMIS_ERROR__TRANSACTION__COMPILATION_FAILED]: {
    reason?: string;
    originalError?: string;
  };

  [HERMIS_ERROR__TRANSACTION__ENCODING_FAILED]: {
    reason?: string;
    originalError?: string;
  };

  [HERMIS_ERROR__TRANSACTION__CONFIRMATION_FAILED]: {
    signature: string;
    reason?: string;
    originalError?: string;
  };

  [HERMIS_ERROR__TRANSACTION__SIMULATION_FAILED]: {
    reason?: string;
    logs?: string[];
    originalError?: string;
  };

  [HERMIS_ERROR__TRANSACTION__INVALID_TYPE]: {
    receivedType: string;
    expectedTypes: string[];
  };

  // ============================================
  // 4000-4999: Network/RPC Errors
  // ============================================
  [HERMIS_ERROR__NETWORK__RPC_REQUEST_FAILED]: {
    method: string;
    endpoint?: string;
    reason?: string;
    originalError?: string;
  };

  [HERMIS_ERROR__NETWORK__CONNECTION_FAILED]: {
    endpoint: string;
    reason?: string;
    originalError?: string;
  };

  [HERMIS_ERROR__NETWORK__BLOCKHASH_UNAVAILABLE]: {
    reason?: string;
    originalError?: string;
  };

  [HERMIS_ERROR__NETWORK__AIRDROP_FAILED]: {
    address: string;
    amount: number;
    reason?: string;
    originalError?: string;
  };

  [HERMIS_ERROR__NETWORK__ACCOUNT_NOT_FOUND]: {
    address: string;
  };

  [HERMIS_ERROR__NETWORK__INSUFFICIENT_BALANCE]: {
    address: string;
    required: number;
    available: number;
  };

  [HERMIS_ERROR__NETWORK__RATE_LIMIT_EXCEEDED]: {
    endpoint?: string;
    retryAfter?: number;
  };

  // ============================================
  // 5000-5999: Signing Errors
  // ============================================
  [HERMIS_ERROR__SIGNING__MESSAGE_FAILED]: {
    messagePreview?: string;
    reason?: string;
    originalError?: string;
  };

  [HERMIS_ERROR__SIGNING__TRANSACTION_FAILED]: {
    transactionType?: string;
    reason?: string;
    originalError?: string;
  };

  [HERMIS_ERROR__SIGNING__ALL_TRANSACTIONS_FAILED]: {
    transactionCount: number;
    reason?: string;
    originalError?: string;
  };

  [HERMIS_ERROR__SIGNING__INVALID_SIGNATURE]: {
    signature?: string;
    reason?: string;
  };

  [HERMIS_ERROR__SIGNING__VERIFICATION_FAILED]: {
    publicKey?: string;
    reason?: string;
  };

  // ============================================
  // 6000-6999: Standard Wallet Errors
  // ============================================
  [HERMIS_ERROR__STANDARD_WALLET__FEATURE_NOT_FOUND]: {
    featureName: string;
    walletName: string;
    availableFeatures?: string[];
  };

  [HERMIS_ERROR__STANDARD_WALLET__METHOD_NOT_IMPLEMENTED]: {
    methodName: string;
    walletName: string;
  };

  [HERMIS_ERROR__STANDARD_WALLET__ACCOUNT_NOT_FOUND]: {
    accountAddress?: string;
    walletName: string;
  };

  [HERMIS_ERROR__STANDARD_WALLET__ACCOUNT_CHANGE_FAILED]: {
    walletName: string;
    reason?: string;
    originalError?: string;
  };

  [HERMIS_ERROR__STANDARD_WALLET__CHAIN_NOT_SUPPORTED]: {
    chain: string;
    walletName: string;
    supportedChains?: string[];
  };

  // ============================================
  // 7000-7999: Kit Architecture Errors
  // ============================================
  [HERMIS_ERROR__KIT__RPC_CONNECTION_FAILED]: {
    endpoint: string;
    reason?: string;
    originalError?: string;
  };

  [HERMIS_ERROR__KIT__MESSAGE_COMPILATION_FAILED]: {
    reason?: string;
    originalError?: string;
  };

  [HERMIS_ERROR__KIT__ENCODER_NOT_AVAILABLE]: {
    encoderType: string;
  };

  [HERMIS_ERROR__KIT__DECODER_NOT_AVAILABLE]: {
    decoderType: string;
  };

  [HERMIS_ERROR__KIT__LEGACY_MODE_INCOMPATIBLE]: {
    feature: string;
    suggestion?: string;
  };

  // ============================================
  // 8000-8999: Configuration Errors
  // ============================================
  [HERMIS_ERROR__CONFIG__INVALID_CONFIGURATION]: {
    configKey: string;
    reason?: string;
    receivedValue?: string;
  };

  [HERMIS_ERROR__CONFIG__MISSING_REQUIRED]: {
    requiredConfig: string;
  };

  [HERMIS_ERROR__CONFIG__INVALID_RPC_ENDPOINT]: {
    endpoint: string;
    reason?: string;
  };

  [HERMIS_ERROR__CONFIG__INVALID_ADAPTER]: {
    adapterName?: string;
    reason?: string;
  };

  [HERMIS_ERROR__CONFIG__STORAGE_INIT_FAILED]: {
    storageKey: string;
    reason?: string;
    originalError?: string;
  };

  // ============================================
  // 9000-9999: Invariant Violations
  // ============================================
  [HERMIS_ERROR__INVARIANT__UNEXPECTED_STATE]: {
    state: string;
    expectedStates?: string[];
  };

  [HERMIS_ERROR__INVARIANT__NULL_VALUE]: {
    valueName: string;
    location?: string;
  };

  [HERMIS_ERROR__INVARIANT__INVALID_ARGUMENT]: {
    argumentName: string;
    receivedValue?: string;
    expectedType?: string;
  };

  [HERMIS_ERROR__INVARIANT__OPERATION_NOT_ALLOWED]: {
    operation: string;
    reason?: string;
    currentState?: string;
  };

  [HERMIS_ERROR__INVARIANT__TYPE_MISMATCH]: {
    variableName: string;
    expectedType: string;
    receivedType: string;
  };
};

/**
 * Default empty context for errors that don't require additional data
 */
export type DefaultHermisErrorContext = Record<string, never>;
