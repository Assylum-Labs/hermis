/**
 * @fileoverview Dual Architecture Transaction Signing
 * 
 * This module provides transaction signing capabilities that support both:
 * 1. Legacy architecture: @solana/web3.js Transaction/VersionedTransaction with Keypair/Adapter
 * 2. Kit architecture: @solana/kit TransactionMessage with CryptoKeyPair/Address
 * 
 * USAGE EXAMPLES:
 * 
 * Legacy Usage (maintains backward compatibility):
 * ```typescript
 * import { Keypair, Transaction } from '@solana/web3.js';
 * import { signTransactionLegacyCompatible } from './transaction';
 * 
 * const keypair = Keypair.generate();
 * const transaction = new Transaction();
 * const signed = await signTransactionLegacyCompatible(transaction, keypair);
 * ```
 * 
 * Kit Usage (new architecture):
 * ```typescript
 * import { generateKitKeypair, createKitTransaction } from './transaction';
 * 
 * const { keypair, address } = await generateKitKeypair();
 * const transaction = await createKitTransaction(connection, address);
 * // Note: Kit signing implementation requires proper transaction message formatting
 * ```
 * 
 * Dual Architecture Usage:
 * ```typescript
 * import { signTransaction, DualArchitectureOptions } from './transaction';
 * 
 * // Works with both legacy and kit wallets/transactions
 * const signed = await signTransaction(transaction, wallet, {
 *   fallbackToLegacy: true,  // Allow conversion between architectures
 *   preferKitArchitecture: false  // Prefer legacy when possible
 * });
 * ```
 * 
 * CURRENT LIMITATIONS:
 * - Kit transaction signing requires proper implementation of transaction message formatting
 * - Conversion between legacy and kit types requires @solana/compat (not yet available)
 * - Kit message signing and sign-in not yet implemented
 * 
 * MIGRATION PATH:
 * 1. Use *LegacyCompatible functions for existing code
 * 2. Gradually adopt kit architecture with helper functions
 * 3. Use dual architecture functions when mixing both approaches
 */

import { Adapter } from '@solana/wallet-adapter-base';
import {
  Connection,
  ConnectionConfig,
  Keypair,
  Transaction,
  TransactionSignature,
  sendAndConfirmTransaction,
  VersionedTransaction,
  PublicKey,
} from '@solana/web3.js';
import {
  SolanaSignInInput,
  SolanaSignInOutput,
  DualTransaction,
  DualArchitectureOptions,
  DualWallet,
  LegacyWallet,
  KitWallet,
  DualConnection,
  isLegacyConnection
} from '../types/index.js';
import { generateNonce, generateSignInMessage } from '../utils/index.js';
import {
  createConnection,
  getLatestBlockhash,
  sendRawTransaction as sendRawTransactionHelper,
  sendTransactionHelper
} from '../connection/index.js';

// Import error handling
import {
  HermisError,
  HERMIS_ERROR__WALLET_CONNECTION__NOT_CONNECTED,
  HERMIS_ERROR__WALLET_CONNECTION__NO_PUBLIC_KEY,
  HERMIS_ERROR__TRANSACTION__SIGNATURE_FAILED,
  HERMIS_ERROR__TRANSACTION__SEND_FAILED,
  HERMIS_ERROR__TRANSACTION__SERIALIZATION_FAILED,
  HERMIS_ERROR__STANDARD_WALLET__FEATURE_NOT_FOUND,
  HERMIS_ERROR__STANDARD_WALLET__ACCOUNT_NOT_FOUND,
  HERMIS_ERROR__SIGNING__MESSAGE_FAILED,
  HERMIS_ERROR__SIGNING__TRANSACTION_FAILED,
  HERMIS_ERROR__KIT__LEGACY_MODE_INCOMPATIBLE,
  HERMIS_ERROR__INVARIANT__INVALID_ARGUMENT,
  HERMIS_ERROR__INVARIANT__OPERATION_NOT_ALLOWED
} from '@hermis/errors';

// Import required packages for CryptoKeyPair conversion
import * as ed25519 from '@noble/ed25519';
import bs58 from 'bs58';
import nacl from 'tweetnacl';


// Import kit functions with correct names based on actual exports
import {
  // Key generation and management
  generateKeyPair,
  createKeyPairSignerFromBytes,
  createKeyPairSignerFromPrivateKeyBytes,

  // Address utilities
  address,
  getAddressFromPublicKey,

  // Transaction message creation
  createTransactionMessage,
  setTransactionMessageFeePayer,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstruction,

  // Message signing
  createSignableMessage,

  // Signing
  signTransaction as kitSignTransaction,
  signTransactionMessageWithSigners,

  // Transaction utilities
  getTransactionEncoder,
  compileTransaction,
} from '@solana/kit';

// Import types
import type {
  Address,
  Blockhash,
  TransactionMessage,
  KeyPairSigner,
  MessagePartialSigner
} from '@solana/kit';
import {
  SolanaSignAndSendTransactionFeature,
  SolanaSignAndSendTransactionMethod,
  SolanaSignMessageFeature,
  SolanaSignMessageMethod,
  SolanaSignTransactionFeature,
  SolanaSignTransactionMethod,
  StandardWalletAccount,
  TypedStandardWallet
} from '../types/wallet-standard-types.js';

// Note: Compatibility functions would be imported from @solana/compat when available
// For now, we'll implement placeholder conversion functions

/**
 * Helper to safely detect if a transaction is a VersionedTransaction
 * Works even when instanceof checks might not work in test environments
 */
function isVersionedTransaction(transaction: Transaction | VersionedTransaction): boolean {
  // In test environments, VersionedTransaction might not be properly mocked
  // So we check for the version property which is only present in VersionedTransaction
  return (
    // Check if it has a version property
    'version' in transaction ||
    // Check for an explicit flag that might be set in tests
    '_isVersionedTransaction' in transaction ||
    // Try instanceof check as a backup when available
    (typeof VersionedTransaction === 'function' && transaction instanceof VersionedTransaction)
  );
}

/**
 * Helper to detect if a wallet is a legacy wallet (Keypair or Adapter)
 */
function isLegacyWallet(wallet: DualWallet): wallet is LegacyWallet {
  return (
    typeof wallet === 'object' &&
    wallet !== null &&
    ('secretKey' in wallet || // Keypair
    ('publicKey' in wallet && 'connected' in wallet)) // Adapter
  );
}

/**
 * Helper to detect if a wallet is a kit wallet (CryptoKeyPair, Address, or MessagePartialSigner)
 * Explicitly checks for the three Kit wallet types instead of using !isLegacyWallet()
 */
function isKitWallet(wallet: DualWallet): wallet is KitWallet {
  return (
    // Check for CryptoKeyPair (has privateKey and publicKey)
    (typeof wallet === 'object' &&
     wallet !== null &&
     'privateKey' in wallet &&
     'publicKey' in wallet) ||
    // Check for Address (string)
    typeof wallet === 'string' ||
    // Check for MessagePartialSigner (has address and signMessages)
    isMessagePartialSigner(wallet)
  );
}

/**
 * Helper to detect if a wallet is a MessagePartialSigner (KeyPairSigner)
 */
function isMessagePartialSigner(wallet: any): wallet is MessagePartialSigner {
  return (
    wallet &&
    typeof wallet === 'object' &&
    'address' in wallet &&
    'signMessages' in wallet &&
    typeof wallet.signMessages === 'function'
  );
}

/**
 * Helper to detect if a transaction is a TransactionMessage (kit architecture)
 */
function isTransactionMessage(transaction: DualTransaction): transaction is object {
  return (
    typeof transaction === 'object' &&
    transaction !== null &&
    'instructions' in transaction &&
    'version' in transaction &&
    // Kit transactions have 'version' but it's a string like '0' not a number
    // Legacy VersionedTransaction also has 'version' but also has 'signatures'
    !('signatures' in transaction) &&
    !('recentBlockhash' in transaction)
  );
}

/**
 * Serialize a DualTransaction for Standard Wallet consumption
 * Handles Transaction, VersionedTransaction, and Kit TransactionMessage
 *
 * This helper provides a single point of serialization logic for Standard Wallets,
 * properly handling Kit TransactionMessage by compiling and encoding, while maintaining
 * backward compatibility with legacy Transaction and VersionedTransaction types.
 *
 * @param transaction - Any dual transaction type (Transaction, VersionedTransaction, or TransactionMessage)
 * @returns Serialized transaction bytes ready for Standard Wallet
 */
export function serializeTransactionForWallet(transaction: DualTransaction): Uint8Array {
  // Kit TransactionMessage: compile then encode
  if (isTransactionMessage(transaction)) {
    const compiled = compileTransaction(transaction as any);
    const encoder = getTransactionEncoder();
    // Convert ReadonlyUint8Array to Uint8Array for compatibility
    return new Uint8Array(encoder.encode(compiled));
  }

  // Legacy VersionedTransaction
  if (isVersionedTransaction(transaction)) {
    return (transaction as VersionedTransaction).serialize();
  }

  // Legacy Transaction
  return (transaction as Transaction).serialize({ verifySignatures: false });
}

/**
 * Helper to detect if a wallet is a CryptoKeyPair
 */
function isCryptoKeyPair(wallet: KitWallet): wallet is CryptoKeyPair {
  return (
    typeof wallet === 'object' &&
    wallet !== null &&
    'privateKey' in wallet &&
    'publicKey' in wallet
  );
}

/**
 * Helper to detect if a wallet is an Address
 */
function isAddress(wallet: KitWallet): wallet is string {
  return typeof wallet === 'string';
}

/**
 * Helper to detect the Solana chain from a connection's RPC endpoint
 * Maps known RPC endpoints to their corresponding chain identifiers
 * @param connection The connection to detect the chain from
 * @returns The chain identifier (e.g., 'solana:devnet', 'solana:mainnet')
 */
function getChainFromConnection(connection: DualConnection): string {
  // For legacy connections, check the rpcEndpoint property
  if (isLegacyConnection(connection)) {
    const endpoint = connection.rpcEndpoint.toLowerCase();

    // Check for devnet
    if (endpoint.includes('devnet')) {
      return 'solana:devnet';
    }

    // Check for testnet
    if (endpoint.includes('testnet')) {
      return 'solana:testnet';
    }

    // Check for mainnet-beta (official endpoint)
    if (endpoint.includes('mainnet-beta') || endpoint.includes('mainnet')) {
      return 'solana:mainnet';
    }
  }

  // Default to mainnet for unknown endpoints or Kit connections
  return 'solana:mainnet';
}

/**
 * Helper to detect if a transaction has valid signatures
 * Returns false for unsigned or partially signed transactions
 * @param transaction The transaction to check
 * @returns true if the transaction has at least one valid signature
 */
export function isTransactionSigned(transaction: any): boolean {
  console.log('🔍 [isTransactionSigned] Checking transaction:', transaction);

  // Safety check: only works with objects that have a signatures property
  if (!transaction || typeof transaction !== 'object' || !('signatures' in transaction)) {
    console.log('❌ [isTransactionSigned] No signatures property found');
    return false;
  }

  const signatures = transaction.signatures;
  console.log('🔍 [isTransactionSigned] Signatures array:', signatures);
  console.log('🔍 [isTransactionSigned] Signatures length:', signatures?.length);

  // No signatures array means unsigned
  if (!signatures || signatures.length === 0) {
    console.log('❌ [isTransactionSigned] Empty signatures array');
    return false;
  }

  // Check if at least one signature is present and non-zero
  // A zero signature (all bytes are 0) indicates a placeholder, not a real signature
  const hasValidSig = signatures.some((sig: any, index: number) => {
    console.log(`🔍 [isTransactionSigned] Checking signature ${index}:`, sig);
    console.log(`🔍 [isTransactionSigned] Signature type: ${typeof sig}, is Buffer: ${Buffer.isBuffer(sig)}, is Uint8Array: ${sig instanceof Uint8Array}`);

    // Handle both signature formats (Uint8Array or {signature: Uint8Array})
    const sigBytes = sig.signature !== undefined ? sig.signature : sig;
    console.log(`🔍 [isTransactionSigned] Extracted sigBytes:`, sigBytes);

    if (!sigBytes || sigBytes.length === 0) {
      console.log(`❌ [isTransactionSigned] Signature ${index} is empty`);
      return false;
    }

    // Check if all bytes are zero (placeholder signature)
    for (let i = 0; i < sigBytes.length; i++) {
      if (sigBytes[i] !== 0) {
        console.log(`✅ [isTransactionSigned] Signature ${index} has non-zero byte at position ${i}`);
        return true;  // Found a non-zero byte, this is a real signature
      }
    }
    console.log(`❌ [isTransactionSigned] Signature ${index} is all zeros (placeholder)`);
    return false;  // All bytes are zero, this is a placeholder
  });

  console.log(`🔍 [isTransactionSigned] Final result: ${hasValidSig}`);
  return hasValidSig;
}

// /**
//  * Signs a transaction using the specified wallet (supports both legacy and kit architectures)
//  * @param transaction The transaction to sign (can be Transaction, VersionedTransaction, or TransactionMessage)
//  * @param wallet The wallet to sign with (can be Keypair, Adapter, CryptoKeyPair, or Address)
//  * @param options Optional configuration for dual architecture behavior
//  * @returns The signed transaction
//  */
// export async function signTransaction<T extends DualTransaction>(
//   transaction: T,
//   wallet: DualWallet,
//   options?: DualArchitectureOptions
// ): Promise<T>;

// /**
//  * Signs a transaction using the specified signer (overload for explicit signer support)
//  * @param transaction The transaction to sign
//  * @param signer The signer to use (Keypair, MessagePartialSigner, or KeyPairSigner)
//  * @param options Optional configuration for dual architecture behavior
//  * @returns The signed transaction
//  */
// export async function signTransaction<T extends DualTransaction>(
//   transaction: T,
//   signer: Keypair | MessagePartialSigner | KeyPairSigner,
//   options?: DualArchitectureOptions
// ): Promise<T>;

/**
 * Implementation for signTransaction with improved signer compatibility
 */
export async function signTransaction<T extends DualTransaction>(
  transaction: T,
  walletOrSigner: DualWallet | Keypair | MessagePartialSigner | KeyPairSigner,
  options: DualArchitectureOptions = {}
): Promise<T> {
  // Handle MessagePartialSigner or KeyPairSigner directly (kit signers)
  if (isMessagePartialSigner(walletOrSigner)) {
    if (isTransactionMessage(transaction)) {
      // Kit signer with kit transaction
      return await signTransactionWithKitSigner(transaction as TransactionMessage, walletOrSigner) as T;
    } else {
      // Kit signer with legacy transaction - use Web Crypto API signing
      if (options.fallbackToLegacy !== false) {
        return await signTransactionLegacyWithKitSigner(
          transaction as Transaction | VersionedTransaction,
          walletOrSigner
        ) as T;
      } else {
        throw new Error('Kit signer cannot sign legacy transaction without fallback enabled');
      }
    }
  }

  // Handle kit architecture
  if (isKitWallet(walletOrSigner)) {
    if (isTransactionMessage(transaction)) {
      // Both wallet and transaction are kit architecture
      if (isCryptoKeyPair(walletOrSigner)) {
        // Both wallet and transaction are kit architecture - use kit signing
        return await signTransactionKit(transaction as TransactionMessage, walletOrSigner) as T;
      } else {
        // Address without private key - cannot sign
        throw new Error('Cannot sign transaction with Address - private key required');
      }
    } else {
      // Kit wallet but legacy transaction - convert if possible
      if (options.fallbackToLegacy !== false) {
        // Convert kit wallet to legacy for signing
        if (isCryptoKeyPair(walletOrSigner)) {
          const legacyKeypair = await convertCryptoKeyPairToKeypair(walletOrSigner);
          return await signTransactionLegacy(transaction as Transaction | VersionedTransaction, legacyKeypair) as T;
        } else {
          throw new Error('Cannot convert Address to legacy wallet for signing');
        }
      } else {
        throw new Error('Kit wallet cannot sign legacy transaction without fallback enabled');
      }
    }
  }

  // Everything else uses legacy implementation (Keypair, Adapter, Standard Wallet)
  if (isTransactionMessage(transaction)) {
    // Legacy wallet but kit transaction - convert if possible
    if (options.preferKitArchitecture === false || options.fallbackToLegacy !== false) {
      // Convert transaction to legacy format
      const legacyTransaction = await convertTransactionMessageToLegacy(transaction as TransactionMessage);
      return await signTransactionLegacy(legacyTransaction, walletOrSigner) as T;
      // This would need proper implementation using conversion utilities
      // throw new Error('Legacy to kit transaction conversion not yet implemented');
    } else {
      throw new Error('Legacy wallet cannot sign kit transaction without conversion enabled');
    }
  } else {
    // Both wallet and transaction are legacy architecture
    return await signTransactionLegacy(transaction as Transaction | VersionedTransaction, walletOrSigner) as T;
  }
}

/**
 * Legacy transaction signing implementation
 */
async function signTransactionLegacy<T extends Transaction | VersionedTransaction>(
  transaction: T, 
  wallet: LegacyWallet
): Promise<T> {
  // Use different signing methods based on wallet type
  if ('secretKey' in wallet) {
    // It's a Keypair
    if (!isVersionedTransaction(transaction)) {
      // For legacy Transaction, we can sign directly
      (transaction as Transaction).sign(wallet);
      return transaction;
    } else {
      // For VersionedTransaction, we need manual signing logic
      return await signVersionedTransactionWithKeypair(transaction as VersionedTransaction, wallet) as T;
    }
  } else if ("features" in wallet) {
    // It's a Standard Wallet
    const feature = wallet.features[SolanaSignTransactionMethod] as SolanaSignTransactionFeature;
    if (!feature || typeof feature.signTransaction !== 'function') {
      throw new HermisError(
        HERMIS_ERROR__STANDARD_WALLET__FEATURE_NOT_FOUND,
        { featureName: 'signTransaction', walletName: wallet.name || 'Unknown wallet' }
      );
    }

    // Get the account to use for signing
    const account = wallet.accounts[0] as StandardWalletAccount;
    if (!account) {
      throw new HermisError(
        HERMIS_ERROR__STANDARD_WALLET__ACCOUNT_NOT_FOUND,
        { walletName: wallet.name || 'Unknown wallet' }
      );
    }

    const accountPublicKey = new PublicKey(account.publicKey);

    // Ensure transaction has feePayer set (only for legacy Transaction, not Kit TransactionMessage)
    if (!isVersionedTransaction(transaction) && !isTransactionMessage(transaction) && !(transaction as Transaction).feePayer) {
      (transaction as Transaction).feePayer = accountPublicKey;
    }

    // Serialize the transaction
    let transactionBytes: Uint8Array;
    try {
      transactionBytes = serializeTransactionForWallet(transaction);
    } catch (error) {
      throw new HermisError(
        HERMIS_ERROR__TRANSACTION__SERIALIZATION_FAILED,
        {
          transactionType: isTransactionMessage(transaction) ? 'Kit TransactionMessage' : isVersionedTransaction(transaction) ? 'VersionedTransaction' : 'Transaction',
          reason: 'Serialization failed for Standard Wallet',
          originalError: error instanceof Error ? error.message : String(error)
        },
        error instanceof Error ? error : undefined
      );
    }

    // Call wallet's signTransaction feature
    const result = await feature.signTransaction({
      transaction: transactionBytes,
      account: account
    });

    if (!result || !result[0] || !result[0].signedTransaction) {
      throw new Error('No signed transaction returned from wallet');
    }

    // Deserialize the signed transaction
    try {
      const signedTransactionBytes = result[0].signedTransaction;
      if (isVersionedTransaction(transaction)) {
        return VersionedTransaction.deserialize(signedTransactionBytes) as T;
      } else {
        return Transaction.from(signedTransactionBytes) as T;
      }
    } catch (error) {
      throw new Error(`Failed to deserialize signed transaction: ${error instanceof Error ? error.message : error}`);
    }
  } else {
    // It's an Adapter
    if (!wallet.publicKey) {
      throw new HermisError(
        HERMIS_ERROR__WALLET_CONNECTION__NOT_CONNECTED,
        { walletName: wallet.name || 'Unknown wallet' }
      );
    }

    // For versioned transactions, we need to check if the adapter supports it
    if (
      isVersionedTransaction(transaction) && 
      wallet.supportedTransactionVersions &&
      !wallet.supportedTransactionVersions.has((transaction as any).version)
    ) {
      throw new Error(`Wallet doesn't support transaction version ${(transaction as any).version}`);
    }
    
    // Check if this adapter supports signing directly
    if ('signTransaction' in wallet && typeof wallet.signTransaction === 'function') {
      return await wallet.signTransaction(transaction);
    } else {
      throw new Error('Wallet adapter does not support direct transaction signing');
    }
  }
}

/**
 * Convert CryptoKeyPair to legacy Keypair
 * This extracts the private key bytes and creates a @solana/web3.js Keypair
 */
async function convertCryptoKeyPairToKeypair(cryptoKeyPair: CryptoKeyPair): Promise<Keypair> {
  try {
    // Extract the private key bytes using our existing extraction method
    const privateKeyBytes = await attemptPrivateKeyExtraction(cryptoKeyPair);

    if (!privateKeyBytes) {
      throw new Error('Cannot extract private key from CryptoKeyPair - key is not extractable');
    }

    // Create a Keypair from the private key bytes
    // For Ed25519, we need to create a 64-byte seed (32 bytes private key + 32 bytes public key)
    const publicKeyBytes = new Uint8Array(await crypto.subtle.exportKey("raw", cryptoKeyPair.publicKey));

    // Create the 64-byte secret key format expected by Keypair.fromSecretKey
    const secretKeyBytes = new Uint8Array(64);
    secretKeyBytes.set(privateKeyBytes, 0);
    secretKeyBytes.set(publicKeyBytes, 32);

    // Create and return the Keypair
    return Keypair.fromSecretKey(secretKeyBytes);
  } catch (error) {
    throw new Error(`Failed to convert CryptoKeyPair to Keypair: ${error instanceof Error ? error.message : error}`);
  }
}

/**
 * Convert CryptoKeyPair to MessagePartialSigner for kit message signing
 * This is the complete implementation that properly converts CryptoKeyPair to a working MessagePartialSigner
 *
 * IMPLEMENTATION STRATEGY:
 * 1. Try to extract private key via multiple methods (raw, pkcs8, jwk)
 * 2. If extraction fails, create a bridge signer that uses the CryptoKeyPair directly
 * 3. Provide a working MessagePartialSigner interface regardless of extraction success
 */
async function convertCryptoKeyPairToMessageSigner(cryptoKeyPair: CryptoKeyPair): Promise<MessagePartialSigner> {
  try {
    // Validate input CryptoKeyPair
    if (!cryptoKeyPair || !cryptoKeyPair.privateKey || !cryptoKeyPair.publicKey) {
      throw new Error("Invalid CryptoKeyPair: missing private or public key");
    }

    // Check key algorithm
    if (cryptoKeyPair.privateKey.algorithm.name !== "Ed25519") {
      throw new Error(`Unsupported key algorithm: ${cryptoKeyPair.privateKey.algorithm.name}. Only Ed25519 is supported.`);
    }

    // Check key usage
    if (!cryptoKeyPair.privateKey.usages.includes("sign")) {
      throw new Error("Private key does not support signing");
    }

    // Strategy 1: Try to extract private key bytes using multiple methods
    const privateKeyBytes = await attemptPrivateKeyExtraction(cryptoKeyPair);

    if (privateKeyBytes) {
      // Success! Create a proper kit signer from the extracted bytes
      console.log("🔓 Successfully extracted private key from CryptoKeyPair");
      return await createKeyPairSignerFromPrivateKeyBytes(privateKeyBytes);
    }

    // Strategy 2: Create a bridge signer that uses the CryptoKeyPair directly
    console.log("🌉 Creating bridge signer for non-extractable CryptoKeyPair");
    return await createBridgeMessageSigner(cryptoKeyPair);

  } catch (error) {
    throw new Error(`Failed to convert CryptoKeyPair to MessageSigner: ${error instanceof Error ? error.message : error}`);
  }
}

/**
 * Attempt to extract private key bytes from CryptoKeyPair using multiple strategies
 * Returns null if extraction fails, which is expected for non-extractable keys
 */
async function attemptPrivateKeyExtraction(cryptoKeyPair: CryptoKeyPair): Promise<Uint8Array | null> {
  const strategies = [
    // Strategy 1: Try raw export (works if key is extractable)
    async () => {
      const rawKey = await crypto.subtle.exportKey("raw", cryptoKeyPair.privateKey);
      return new Uint8Array(rawKey);
    },

    // Strategy 2: Try PKCS#8 export and extract the Ed25519 key
    async () => {
      const pkcs8Key = await crypto.subtle.exportKey("pkcs8", cryptoKeyPair.privateKey);
      const pkcs8Bytes = new Uint8Array(pkcs8Key);

      // Ed25519 private keys in PKCS#8 format: extract last 32 bytes
      if (pkcs8Bytes.length >= 32) {
        const privateKeyBytes = pkcs8Bytes.slice(-32);
        if (privateKeyBytes.length === 32) {
          return privateKeyBytes;
        }
      }
      throw new Error("Invalid PKCS#8 format for Ed25519 key");
    },

    // Strategy 3: Try JWK export and decode
    async () => {
      const jwk = await crypto.subtle.exportKey("jwk", cryptoKeyPair.privateKey);

      if (!jwk.d) {
        throw new Error("JWK does not contain private key component 'd'");
      }

      // Decode base64url to get raw bytes
      const base64url = jwk.d;
      const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
      const padding = '='.repeat((4 - base64.length % 4) % 4);
      const privateKeyBytes = Uint8Array.from(atob(base64 + padding), c => c.charCodeAt(0));

      if (privateKeyBytes.length !== 32) {
        throw new Error(`Invalid Ed25519 private key length: ${privateKeyBytes.length}`);
      }

      return privateKeyBytes;
    }
  ];

  // Try each strategy in order
  for (const [index, strategy] of strategies.entries()) {
    try {
      const result = await strategy();
      console.log(`✅ Private key extraction succeeded using strategy ${index + 1}`);
      return result;
    } catch (error) {
      console.log(`❌ Private key extraction strategy ${index + 1} failed:`, error instanceof Error ? error.message : error);
      continue;
    }
  }

  console.log("🔐 All private key extraction strategies failed (key is not extractable)");
  return null;
}

/**
 * Create a bridge MessagePartialSigner that uses the CryptoKeyPair directly
 * This works even when the private key is not extractable
 */
async function createBridgeMessageSigner(cryptoKeyPair: CryptoKeyPair): Promise<MessagePartialSigner> {
  // Get the public key bytes to create the address
  const publicKeyBytes = new Uint8Array(await crypto.subtle.exportKey("raw", cryptoKeyPair.publicKey));

  // Create Solana address from public key bytes
  const addressString = bs58.encode(publicKeyBytes);

  // Create the bridge signer
  const bridgeSigner: MessagePartialSigner = {
    address: addressString as any, // Cast to Address type

    async signMessages(messages: any[]): Promise<any[]> {
      try {
        const signatureDictionaries: any[] = [];

        for (const message of messages) {
          // Extract the message bytes from the signable message
          let messageBytes: Uint8Array;

          if (message && typeof message === 'object' && 'content' in message) {
            // It's a SignableMessage with content property
            messageBytes = message.content;
          } else if (message instanceof Uint8Array) {
            // It's raw message bytes
            messageBytes = message;
          } else {
            throw new Error("Unsupported message format for bridge signer");
          }

          // Sign the message using the CryptoKeyPair directly
          const signature = await crypto.subtle.sign(
            "Ed25519",
            cryptoKeyPair.privateKey,
            messageBytes as BufferSource
          );

          // Create signature dictionary for this message
          const signatureBytes = new Uint8Array(signature);
          const signatureDictionary = {
            [addressString]: signatureBytes
          };

          signatureDictionaries.push(signatureDictionary);
        }

        return signatureDictionaries;
      } catch (error) {
        throw new Error(`Bridge signer failed to sign messages: ${error instanceof Error ? error.message : error}`);
      }
    }
  };

  console.log(`🌉 Created bridge signer with address: ${addressString}`);
  return bridgeSigner;
}

/**
 * Alternative method for creating MessagePartialSigner from private key bytes
 * This is useful when you need to extract private key from CryptoKeyPair first
 */
async function createMessageSignerFromPrivateKeyBytes(privateKeyBytes: Uint8Array): Promise<MessagePartialSigner> {
  try {
    if (privateKeyBytes.length !== 32) {
      throw new Error(`Invalid private key length: expected 32 bytes, got ${privateKeyBytes.length}`);
    }

    // Create a new CryptoKeyPair from the private key bytes
    // Note: This assumes we have access to createKeyPairFromBytes from @solana/kit
    const fullKeypairBytes = new Uint8Array(64);
    fullKeypairBytes.set(privateKeyBytes, 0);

    // Create a KeyPairSigner directly from the private key bytes
    const keypairSigner = await createKeyPairSignerFromPrivateKeyBytes(privateKeyBytes);

    return keypairSigner;
  } catch (error) {
    throw new Error(`Failed to create MessageSigner from private key bytes: ${error instanceof Error ? error.message : error}`);
  }
}

/**
 * Utility function to extract private key bytes from CryptoKeyPair
 * This is useful for debugging or when you need the raw private key
 * Uses the same multi-strategy approach as the main conversion function
 */
async function extractPrivateKeyBytes(cryptoKeyPair: CryptoKeyPair): Promise<Uint8Array> {
  const privateKeyBytes = await attemptPrivateKeyExtraction(cryptoKeyPair);

  if (!privateKeyBytes) {
    throw new Error("Failed to extract private key bytes: key is not extractable");
  }

  return privateKeyBytes;
}

/**
 * Create an extractable Ed25519 CryptoKeyPair for testing and development
 * This generates keys that can have their private key bytes extracted
 */
export async function generateExtractableCryptoKeyPair(): Promise<CryptoKeyPair> {
  try {
    // Generate an extractable Ed25519 key pair
    const keyPair = await crypto.subtle.generateKey(
      {
        name: "Ed25519",
        namedCurve: "Ed25519",
      } as EcKeyGenParams,
      true, // extractable = true
      ["sign", "verify"]
    );

    console.log("🔓 Generated extractable Ed25519 CryptoKeyPair");
    return keyPair;
  } catch (error) {
    // Fallback: generate a key pair using @noble/ed25519 and import it
    console.log("⚠️  Web Crypto Ed25519 not available, falling back to @noble/ed25519");

    // Generate random private key
    const privateKeyBytes = ed25519.utils.randomPrivateKey();

    // Derive public key
    const publicKeyBytes = await ed25519.getPublicKey(privateKeyBytes);

    // Import the private key as extractable CryptoKey
    const privateKey = await crypto.subtle.importKey(
      "pkcs8",
      wrapEd25519PrivateKeyInPKCS8(privateKeyBytes) as BufferSource,
      { name: "Ed25519" },
      true, // extractable = true
      ["sign"]
    );

    // Import the public key
    const publicKey = await crypto.subtle.importKey(
      "raw",
      publicKeyBytes as BufferSource,
      { name: "Ed25519" },
      true, // extractable = true
      ["verify"]
    );

    return { privateKey, publicKey };
  }
}

/**
 * Wrap an Ed25519 private key in PKCS#8 format for import
 * This is needed when creating extractable keys from raw bytes
 */
function wrapEd25519PrivateKeyInPKCS8(privateKeyBytes: Uint8Array): Uint8Array {
  // PKCS#8 wrapper for Ed25519 private keys
  const pkcs8Header = new Uint8Array([
    0x30, 0x2e, // SEQUENCE (46 bytes)
    0x02, 0x01, 0x00, // INTEGER 0 (version)
    0x30, 0x05, // SEQUENCE (5 bytes)
    0x06, 0x03, 0x2b, 0x65, 0x70, // OID 1.3.101.112 (Ed25519)
    0x04, 0x22, // OCTET STRING (34 bytes)
    0x04, 0x20, // OCTET STRING (32 bytes)
  ]);

  const pkcs8Key = new Uint8Array(pkcs8Header.length + privateKeyBytes.length);
  pkcs8Key.set(pkcs8Header);
  pkcs8Key.set(privateKeyBytes, pkcs8Header.length);

  return pkcs8Key;
}

/**
 * Convert TransactionMessage to legacy Transaction
 * This converts a kit TransactionMessage to a @solana/web3.js Transaction
 */
async function convertTransactionMessageToLegacy(transactionMessage: TransactionMessage): Promise<Transaction> {
  try {
    // Create a new legacy Transaction
    const transaction = new Transaction();

    // Extract transaction properties - skip compilation for legacy conversion
    // const compiledTransaction = compileTransaction(transactionMessage);

    // Convert kit instructions to legacy format
    if ('instructions' in transactionMessage && Array.isArray(transactionMessage.instructions)) {
      for (const instruction of transactionMessage.instructions) {
        // Convert kit instruction to legacy TransactionInstruction
        const legacyInstruction = {
          programId: new PublicKey(instruction.programAddress),
          keys: instruction.accounts?.map((account: any) => ({
            pubkey: new PublicKey(account.address),
            isSigner: account.role?.includes('signer') || false,
            isWritable: account.role?.includes('writable') || false,
          })) || [],
          data: instruction.data || Buffer.alloc(0),
        };

        transaction.add(legacyInstruction);
      }
    }

    // Set transaction properties if available
    if ('feePayer' in transactionMessage && transactionMessage.feePayer) {
      transaction.feePayer = new PublicKey(transactionMessage.feePayer);
    }

    if ('lifetimeConstraint' in transactionMessage && transactionMessage.lifetimeConstraint) {
      const lifetime = transactionMessage.lifetimeConstraint as any;
      if (lifetime.blockhash) {
        transaction.recentBlockhash = lifetime.blockhash;
      }
    }

    return transaction;
  } catch (error) {
    throw new Error(`Failed to convert TransactionMessage to Transaction: ${error instanceof Error ? error.message : error}`);
  }
}

/**
 * Signs multiple transactions using the specified wallet (supports both legacy and kit architectures)
 * @param transactions The array of transactions to sign
 * @param wallet The wallet to sign with (can be Keypair, Adapter, CryptoKeyPair, or Address)
 * @param options Optional configuration for dual architecture behavior
 * @returns A promise that resolves to an array of signed transactions
 */
export async function signAllTransactions<T extends DualTransaction>(
  transactions: T[],
  wallet: DualWallet,
  options: DualArchitectureOptions = {}
): Promise<T[]> {
  // Handle kit architecture
  if (isKitWallet(wallet)) {
    if (transactions.every(isTransactionMessage)) {
      // Both wallet and all transactions are kit architecture
      if (isCryptoKeyPair(wallet)) {
        // Kit batch signing requires proper transaction message formatting
        throw new Error('Kit batch transaction signing not yet implemented');
      } else {
        // Address without private key - cannot sign
        throw new Error('Cannot sign transactions with Address - private key required');
      }
    } else {
      // Kit wallet but some legacy transactions - convert if possible
      if (options.fallbackToLegacy !== false) {
        if (isCryptoKeyPair(wallet)) {
          const legacyKeypair = await convertCryptoKeyPairToKeypair(wallet);
          const signedTransactions: T[] = [];
          for (const transaction of transactions) {
            if (isTransactionMessage(transaction)) {
              const legacyTransaction = await convertTransactionMessageToLegacy(transaction as TransactionMessage);
              const signed = await signTransactionLegacy(legacyTransaction, legacyKeypair);
              // Convert back to TransactionMessage if needed
              throw new Error('Legacy to kit transaction conversion not yet implemented');
            } else {
              const signed = await signTransactionLegacy(transaction as Transaction | VersionedTransaction, legacyKeypair);
              signedTransactions.push(signed as T);
            }
          }
          return signedTransactions;
        } else {
          throw new Error('Cannot convert Address to legacy wallet for signing');
        }
      } else {
        throw new Error('Kit wallet cannot sign legacy transactions without fallback enabled');
      }
    }
  }

  // Everything else uses legacy implementation (Keypair, Adapter, Standard Wallet)
  if (transactions.every(tx => !isTransactionMessage(tx))) {
    // Both wallet and all transactions are legacy architecture
    return await signAllTransactionsLegacy(transactions as (Transaction | VersionedTransaction)[], wallet) as T[];
  } else {
    // Legacy wallet but some kit transactions - convert if possible
    if (options.preferKitArchitecture === false || options.fallbackToLegacy !== false) {
      const signedTransactions: T[] = [];
      for (const transaction of transactions) {
        if (isTransactionMessage(transaction)) {
          const legacyTransaction = await convertTransactionMessageToLegacy(transaction as TransactionMessage);
          const signed = await signTransactionLegacy(legacyTransaction, wallet);
          // Convert back to TransactionMessage if needed
          // throw new Error('Legacy to kit transaction conversion not yet implemented');
          signedTransactions.push(signed as T);
        } else {
          const signed = await signTransactionLegacy(transaction as Transaction | VersionedTransaction, wallet);
          signedTransactions.push(signed as T);
        }
      }
      return signedTransactions;
    } else {
      throw new Error('Legacy wallet cannot sign kit transactions without conversion enabled');
    }
  }
}

/**
 * Legacy implementation for signing multiple transactions
 */
async function signAllTransactionsLegacy<T extends Transaction | VersionedTransaction>(
  transactions: T[], 
  wallet: LegacyWallet
): Promise<T[]> {
  // Use different signing methods based on wallet type
  if ('secretKey' in wallet) {
    // It's a Keypair
    const signedTransactions = transactions.map(transaction => {
      // Check if transaction is a Transaction or VersionedTransaction
      if (isVersionedTransaction(transaction)) {
        // For VersionedTransaction, use our custom signing logic
        return signVersionedTransactionWithKeypair(transaction as VersionedTransaction, wallet) as any;
      }
      
      // Create a copy to avoid modifying the original
      const txCopy = Transaction.from((transaction as Transaction).serialize());
      
      // Sign the transaction
      txCopy.sign(wallet);
      
      return txCopy as T;
    });
    
    return signedTransactions;
  } else if ("features" in wallet) {
    // It's a Standard Wallet
    const feature = wallet.features[SolanaSignTransactionMethod] as SolanaSignTransactionFeature;
    if (!feature || typeof feature.signTransaction !== 'function') {
      throw new Error('Wallet has invalid signTransaction feature');
    }

    // Sign each transaction using the Standard Wallet feature
    const signedTransactions: T[] = [];
    for (const transaction of transactions) {
      // Get the account to use for signing
      const account = wallet.accounts[0] as StandardWalletAccount;
      if (!account) {
        throw new Error('No account found in wallet');
      }

      const accountPublicKey = new PublicKey(account.publicKey);

      // Ensure transaction has feePayer set (only for legacy Transaction, not Kit TransactionMessage)
      if (!isVersionedTransaction(transaction) && !isTransactionMessage(transaction) && !(transaction as Transaction).feePayer) {
        (transaction as Transaction).feePayer = accountPublicKey;
      }

      // Serialize the transaction
      let transactionBytes: Uint8Array;
      try {
        transactionBytes = serializeTransactionForWallet(transaction);
      } catch (error) {
        throw new Error(`Failed to serialize transaction for signing: ${error instanceof Error ? error.message : error}`);
      }

      // Call wallet's signTransaction feature
      const result = await feature.signTransaction({
        transaction: transactionBytes,
        account: account
      });

      if (!result || !result[0] || !result[0].signedTransaction) {
        throw new Error('No signed transaction returned from wallet');
      }

      // Deserialize the signed transaction
      try {
        const signedTransactionBytes = result[0].signedTransaction;
        if (isVersionedTransaction(transaction)) {
          signedTransactions.push(VersionedTransaction.deserialize(signedTransactionBytes) as T);
        } else {
          signedTransactions.push(Transaction.from(signedTransactionBytes) as T);
        }
      } catch (error) {
        throw new Error(`Failed to deserialize signed transaction: ${error instanceof Error ? error.message : error}`);
      }
    }
    return signedTransactions;
  } else {
    // It's an Adapter
    if (!wallet.publicKey) {
      throw new HermisError(
        HERMIS_ERROR__WALLET_CONNECTION__NOT_CONNECTED,
        { walletName: wallet.name || 'Unknown wallet' }
      );
    }

    // Check for versioned transactions and verify support
    for (const transaction of transactions) {
      if (
        isVersionedTransaction(transaction) && 
        wallet.supportedTransactionVersions &&
        !wallet.supportedTransactionVersions.has((transaction as any).version)
      ) {
        throw new Error(`Wallet doesn't support transaction version ${(transaction as any).version}`);
      }
    }
    
    // Check if this adapter supports signing transactions
    if ('signAllTransactions' in wallet && typeof wallet.signAllTransactions === 'function') {
      return await wallet.signAllTransactions(transactions);
    } else if ('signTransaction' in wallet && typeof wallet.signTransaction === 'function') {
      // Fall back to signing transactions individually if batch signing is not supported
      const signedTransactions: T[] = [];
      for (const transaction of transactions) {
        const signed = await wallet.signTransaction(transaction as any);
        signedTransactions.push(signed as T);
      }
      return signedTransactions;
    } else {
      throw new Error('Wallet adapter does not support transaction signing');
    }
  }
}

/**
 * Sends a transaction to the Solana network (supports both legacy and kit architectures)
 * @param connectionOrTransaction The Solana connection to use, or transaction when used with default connection
 * @param transactionOrWallet The transaction to send, or wallet when connection is omitted
 * @param walletOrOptions The wallet to sign with, or options when connection is omitted
 * @param options Optional configuration for dual architecture behavior
 * @returns A promise that resolves to the transaction signature
 */
export async function sendTransaction(
  connectionOrTransaction: DualConnection | DualTransaction,
  transactionOrWallet: DualTransaction | DualWallet,
  walletOrOptions?: DualWallet | DualArchitectureOptions,
  options?: DualArchitectureOptions
): Promise<TransactionSignature>;

/**
 * Sends a transaction to the Solana network (supports both legacy and kit architectures)
 * @param connection The Solana connection to use (supports both Legacy Connection and Kit Rpc)
 * @param transaction The transaction to send
 * @param wallet The wallet to sign with (can be Keypair, Adapter, CryptoKeyPair, or Address)
 * @param options Optional configuration for dual architecture behavior
 * @returns A promise that resolves to the transaction signature
 */
export async function sendTransaction(
  connection: DualConnection,
  transaction: DualTransaction,
  wallet: DualWallet,
  options?: DualArchitectureOptions
): Promise<TransactionSignature>;

/**
 * Implementation for sendTransaction with flexible parameter handling
 */
export async function sendTransaction(
  connectionOrTransaction: DualConnection | DualTransaction,
  transactionOrWallet?: DualTransaction | DualWallet,
  walletOrOptions?: DualWallet | DualArchitectureOptions,
  options: DualArchitectureOptions = {}
): Promise<TransactionSignature> {
  let connection: DualConnection;
  let transaction: DualTransaction;
  let wallet: DualWallet;
  let finalOptions: DualArchitectureOptions;

  // Parse parameters based on overload usage
  // Check if first parameter is a connection (either legacy Connection or Kit Rpc)
  // First check if it looks like a transaction
  const looksLikeTransaction = typeof connectionOrTransaction === 'object' && connectionOrTransaction !== null &&
    ('recentBlockhash' in connectionOrTransaction || 'instructions' in connectionOrTransaction || 'message' in connectionOrTransaction);

  if (!looksLikeTransaction) {
    // Standard usage: connection, transaction, wallet, options
    connection = connectionOrTransaction as DualConnection;
    transaction = transactionOrWallet as DualTransaction;
    wallet = walletOrOptions as DualWallet;
    finalOptions = options;
  } else {
    // Alternative usage: transaction, wallet, options (creates default connection)
    transaction = connectionOrTransaction as DualTransaction;
    wallet = transactionOrWallet as DualWallet;
    finalOptions = (walletOrOptions as DualArchitectureOptions) || {};

    // Create a default connection to devnet
    connection = createConnection('https://api.devnet.solana.com');
  }
  try {
    // Handle kit architecture
    if (isKitWallet(wallet)) {
      if (isTransactionMessage(transaction)) {
        // Both wallet and transaction are kit architecture
        if (isCryptoKeyPair(wallet)) {
          // Both wallet and transaction are kit architecture - sign and send
          return await sendTransactionKit(connection, transaction as TransactionMessage, wallet);
        } else {
          throw new Error('Cannot send transaction with Address - private key required');
        }
      } else {
        // Kit wallet but legacy transaction
        if (finalOptions.fallbackToLegacy !== false) {
          if (isCryptoKeyPair(wallet)) {
            const legacyKeypair = await convertCryptoKeyPairToKeypair(wallet);
            return await sendTransactionLegacy(connection, transaction as Transaction | VersionedTransaction, legacyKeypair, finalOptions);
          } else {
            throw new Error('Cannot convert Address to legacy wallet for sending');
          }
        } else {
          throw new Error('Kit wallet cannot send legacy transaction without fallback enabled');
        }
      }
    }

    // Everything else uses legacy implementation (Keypair, Adapter, Standard Wallet)
    if (isTransactionMessage(transaction)) {
      // Legacy wallet but kit transaction
      if (finalOptions.preferKitArchitecture === false || finalOptions.fallbackToLegacy !== false) {
        const legacyTransaction = await convertTransactionMessageToLegacy(transaction as TransactionMessage);
        return await sendTransactionLegacy(connection, legacyTransaction, wallet, finalOptions);
      } else {
        throw new Error('Legacy wallet cannot send kit transaction without conversion enabled');
      }
    } else {
      // Both wallet and transaction are legacy architecture
      return await sendTransactionLegacy(connection, transaction as Transaction | VersionedTransaction, wallet, finalOptions);
    }
  } catch (error) {
    console.error('Failed to send transaction:', error);
    throw error;
  }
}

/**
 * Legacy implementation for sending transactions
 */
async function sendTransactionLegacy(
  connection: DualConnection,
  transaction: Transaction | VersionedTransaction,
  wallet: LegacyWallet,
  options: DualArchitectureOptions = {}
): Promise<TransactionSignature> {
  // Set recent blockhash if not already set (for regular transactions)
  if (!isVersionedTransaction(transaction) && !(transaction as Transaction).recentBlockhash) {
    const { blockhash } = await getLatestBlockhash(connection);
    (transaction as Transaction).recentBlockhash = blockhash;
  }
  
  // Handle different wallet types
  if ('secretKey' in wallet) {
    // It's a Keypair
    if (!isVersionedTransaction(transaction)) {
      // For legacy Connection, use sendAndConfirmTransaction
      if (isLegacyConnection(connection)) {
        return await sendAndConfirmTransaction(connection, transaction as Transaction, [wallet]);
      } else {
        // For Kit connection, sign and send manually
        (transaction as Transaction).sign(wallet);
        return await sendTransactionHelper(connection, transaction);
      }
    } else {
      // For VersionedTransaction, sign and send manually
      const signedTransaction = await signVersionedTransactionWithKeypair(transaction as VersionedTransaction, wallet);
      return await sendTransactionHelper(connection, signedTransaction);
    }
  } else if ("features" in wallet) {
      // It's a Standard Wallet

      // Check if transaction is already signed
      if (isTransactionSigned(transaction)) {
        // Transaction is already signed - send raw bytes directly (no wallet prompt)
        const serializedTx = isVersionedTransaction(transaction)
          ? (transaction as VersionedTransaction).serialize()
          : (transaction as Transaction).serialize();

        return await sendRawTransactionHelper(connection, serializedTx, {
          skipPreflight: false,
          preflightCommitment: 'confirmed'
        });
      }

      // Transaction is unsigned - throw error with helpful message
      throw new HermisError(
        HERMIS_ERROR__TRANSACTION__SEND_FAILED,
        {
          reason: 'Cannot send unsigned transaction with Standard Wallet. Use signAndSendTransaction() instead, or call signTransaction() first.'
        }
      );
  } else {
    // It's an Adapter
    if (!wallet.publicKey) {
      throw new HermisError(
        HERMIS_ERROR__WALLET_CONNECTION__NOT_CONNECTED,
        { walletName: wallet.name || 'Unknown wallet' }
      );
    }

    if (!wallet.sendTransaction) {
      throw new HermisError(
        HERMIS_ERROR__INVARIANT__OPERATION_NOT_ALLOWED,
        { operation: 'sendTransaction', reason: 'Wallet does not support sending transactions' }
      );
    }
    
    // Set fee payer if not already set (for regular transactions)
    if (!isVersionedTransaction(transaction) && !(transaction as Transaction).feePayer) {
      (transaction as Transaction).feePayer = wallet.publicKey;
    }
    
    // Check for versioned transaction support
    if (
      isVersionedTransaction(transaction) &&
      wallet.supportedTransactionVersions &&
      !wallet.supportedTransactionVersions.has((transaction as any).version)
    ) {
      throw new Error(`Wallet doesn't support transaction version ${(transaction as any).version}`);
    }

    // Send the transaction using the adapter
    // Note: Adapter expects legacy Connection, so only works with legacy connection
    if (isLegacyConnection(connection)) {
      return await wallet.sendTransaction(transaction, connection);
    } else {
      throw new Error('Adapter requires legacy Connection, not Kit Rpc');
    }
  }
}

/**
 * Signs a message using the specified wallet (supports both legacy and kit architectures)
 * @param message The message to sign
 * @param wallet The wallet to sign with (can be Keypair, Adapter, CryptoKeyPair, or Address)
 * @param options Optional configuration for dual architecture behavior
 * @returns A promise that resolves to the signed message bytes
 */
export async function signMessage(
  message: string | Uint8Array, 
  wallet: DualWallet,
  options: DualArchitectureOptions = {}
): Promise<Uint8Array> {
  console.log("DEBUG: Sign Message with message", message);
  
  try {
    // Convert message to bytes if it's a string
    const messageBytes = typeof message === 'string'
      ? new TextEncoder().encode(message)
      : message;

    // Handle kit architecture
    if (isKitWallet(wallet)) {
      if (isMessagePartialSigner(wallet)) {
        // It's already a MessagePartialSigner (KeyPairSigner)
        return await signMessageKit(messageBytes, wallet);
      } else if (isCryptoKeyPair(wallet)) {
        // Use kit's message signing capabilities
        const messageSigner = await convertCryptoKeyPairToMessageSigner(wallet);
        return await signMessageKit(messageBytes, messageSigner);
      } else if (typeof wallet === 'string') {
        // Address without private key - cannot sign
        throw new Error('Cannot sign message with Address - private key required');
      }
      //  else {
      //   throw new Error('Unsupported kit wallet type');
      // }
    }

    // Everything else uses legacy implementation (Keypair, Adapter, Standard Wallet)
    return await signMessageLegacy(messageBytes, wallet as LegacyWallet);
  } catch (error) {
    console.error('Failed to sign message:', error);
    throw error;
  }
}

/**
 * Kit implementation for message signing using @solana/kit
 */
async function signMessageKit(
  messageBytes: Uint8Array,
  signer: MessagePartialSigner
): Promise<Uint8Array> {
  try {
    // Create a signable message from the bytes
    const signableMessage = createSignableMessage(messageBytes);

    // Sign the message using kit's signMessages method
    const [signatureDictionary] = await signer.signMessages([signableMessage]);

    // Extract the signature for this signer's address
    const signature = signatureDictionary[signer.address];

    if (!signature) {
      throw new Error('No signature found for signer address');
    }

    return signature;
  } catch (error) {
    throw new Error(`Kit message signing failed: ${error instanceof Error ? error.message : error}`);
  }
}

/**
 * Kit implementation for transaction signing using @solana/kit with direct signer
 * This follows the exact pattern from @solana/signers/sign-transaction.ts
 *
 * Key Points:
 * - Input: TransactionMessage (unsigned transaction message)
 * - Output: Transaction (compiled transaction with signatures)
 * - Process: compile → sign messageBytes → attach signatures → return Transaction
 *
 * @param transactionMessage The TransactionMessage to sign
 * @param signer The MessagePartialSigner to sign with (must be KeyPairSigner or compatible)
 * @returns The signed Transaction (NOT TransactionMessage)
 */
async function signTransactionWithKitSigner(
  transactionMessage: TransactionMessage,
  signer: MessagePartialSigner
): Promise<any> {
  try {
    // Step 1: Compile the TransactionMessage to Transaction
    // This converts the high-level TransactionMessage to a low-level Transaction
    // with messageBytes and an empty signatures map
    const transaction = compileTransaction(transactionMessage as any);

    // Type assertion: transaction has { messageBytes, signatures, lifetimeConstraint? }
    const messageBytes = (transaction as any).messageBytes;

    if (!messageBytes) {
      throw new Error('Failed to get message bytes from compiled transaction');
    }

    // Step 2: Sign the messageBytes using the signer's signMessages method
    // KeyPairSigner.signMessages expects an array of SignableMessage objects
    // Each SignableMessage has { content: Uint8Array, signatures: SignatureDictionary }
    const signableMessage = createSignableMessage(messageBytes);

    // Sign the message - returns array of SignatureDictionary
    const signatureDictionaries = await signer.signMessages([signableMessage]);

    if (!signatureDictionaries || signatureDictionaries.length === 0) {
      throw new Error('No signatures returned from signer');
    }

    // Step 3: Extract the signature from the dictionary
    const signatureDict = signatureDictionaries[0];
    const signature = signatureDict[signer.address];

    if (!signature) {
      throw new Error(`No signature found for address ${signer.address}`);
    }

    // Step 4: Merge signatures into the transaction
    // The compiled transaction has a signatures map with null values
    // We merge our new signature into it
    const signedTransaction = {
      ...transaction,
      signatures: {
        ...((transaction as any).signatures || {}),
        [signer.address]: signature
      }
    };

    // Return the signed Transaction object
    // Note: This is a Transaction, not a TransactionMessage
    return signedTransaction;
  } catch (error) {
    throw new Error(`Kit transaction signing with signer failed: ${error instanceof Error ? error.message : error}`);
  }
}

/**
 * Signs a legacy transaction (Transaction or VersionedTransaction) using a Kit signer
 * This enables Kit signers to sign legacy transactions without extracting private keys
 * @param transaction The legacy transaction to sign
 * @param signer The MessagePartialSigner (KeyPairSigner) to sign with
 * @returns The signed transaction
 */
async function signTransactionLegacyWithKitSigner<T extends Transaction | VersionedTransaction>(
  transaction: T,
  signer: MessagePartialSigner
): Promise<T> {
  try {
    // Extract CryptoKeyPair from the signer if available
    const cryptoKeyPair = (signer as any).keyPair as CryptoKeyPair | undefined;

    if (!cryptoKeyPair || !cryptoKeyPair.privateKey) {
      throw new Error('Signer does not contain a CryptoKeyPair with private key');
    }

    // Serialize the transaction message to bytes
    const messageBytesRaw = isVersionedTransaction(transaction)
      ? (transaction as VersionedTransaction).message.serialize()
      : (transaction as Transaction).serializeMessage();

    // Convert to Uint8Array if it's a Buffer (for Web Crypto API compatibility)
    const messageBytes = messageBytesRaw instanceof Uint8Array
      ? messageBytesRaw
      : new Uint8Array(messageBytesRaw);

    // Sign using Web Crypto API
    const signatureArrayBuffer = await crypto.subtle.sign(
      'Ed25519',
      cryptoKeyPair.privateKey,
      messageBytes as BufferSource
    );
    const signatureBytes = new Uint8Array(signatureArrayBuffer);

    // Get the public key from the signer
    const publicKeyBuffer = await crypto.subtle.exportKey('raw', cryptoKeyPair.publicKey);
    const publicKeyBytes = new Uint8Array(publicKeyBuffer);
    const publicKey = new PublicKey(publicKeyBytes);

    // Convert signature to Buffer for @solana/web3.js compatibility
    const signature = Buffer.from(signatureBytes);

    // Add signature to the transaction
    if (isVersionedTransaction(transaction)) {
      const signedTransaction = new VersionedTransaction((transaction as VersionedTransaction).message);
      signedTransaction.addSignature(publicKey, signature);
      return signedTransaction as T;
    } else {
      // For legacy Transaction, add the signature
      (transaction as Transaction).addSignature(publicKey, signature);
      return transaction;
    }
  } catch (error) {
    throw new Error(`Failed to sign legacy transaction with Kit signer: ${error instanceof Error ? error.message : error}`);
  }
}

/**
 * Kit implementation for transaction signing using @solana/kit
 * @param transactionMessage The TransactionMessage to sign
 * @param cryptoKeyPair The CryptoKeyPair to sign with
 * @returns The signed TransactionMessage
 */
async function signTransactionKit(
  transactionMessage: TransactionMessage,
  cryptoKeyPair: CryptoKeyPair
): Promise<TransactionMessage> {
  try {
    // Convert CryptoKeyPair to MessagePartialSigner for kit signing
    const messageSigner = await convertCryptoKeyPairToMessageSigner(cryptoKeyPair);

    // Use the direct signer method
    return await signTransactionWithKitSigner(transactionMessage, messageSigner);
  } catch (error) {
    throw new Error(`Kit transaction signing failed: ${error instanceof Error ? error.message : error}`);
  }
}

/**
 * Kit implementation for transaction sending using @solana/kit
 * @param connection The Solana connection (accepts both Legacy and Kit)
 * @param transactionMessage The TransactionMessage to send
 * @param cryptoKeyPair The CryptoKeyPair to sign with
 * @returns The transaction signature
 */
async function sendTransactionKit(
  connection: DualConnection,
  transactionMessage: TransactionMessage,
  cryptoKeyPair: CryptoKeyPair
): Promise<TransactionSignature> {
  try {
    // First sign the transaction using kit
    const signedTransaction = await signTransactionKit(transactionMessage, cryptoKeyPair);

    // Convert the signed kit transaction to a format the connection can send
    const compiledTransaction = compileTransaction(signedTransaction as any);

    // Use getTransactionEncoder to encode the transaction
    const transactionEncoder = getTransactionEncoder();
    const serializedTransaction = transactionEncoder.encode(compiledTransaction);

    // Send the raw transaction to the network using helper (supports both connection types)
    const signature = await sendRawTransactionHelper(connection, new Uint8Array(serializedTransaction), {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    });

    return signature;
  } catch (error) {
    throw new Error(`Kit transaction sending failed: ${error instanceof Error ? error.message : error}`);
  }
}

/**
 * Sign a VersionedTransaction with a Keypair
 * This implements manual signing for VersionedTransaction since @solana/web3.js doesn't support it directly
 */
async function signVersionedTransactionWithKeypair(
  transaction: VersionedTransaction,
  keypair: Keypair
): Promise<VersionedTransaction> {
  try {
    // Create a message from the transaction for signing
    const messageBytes = transaction.message.serialize();

    // Sign the message bytes with the keypair
    const signature = nacl.sign.detached(messageBytes, keypair.secretKey);

    // Create a new VersionedTransaction with the signature
    const signedTransaction = new VersionedTransaction(transaction.message);
    signedTransaction.addSignature(keypair.publicKey, signature);

    return signedTransaction;
  } catch (error) {
    throw new Error(`Failed to sign VersionedTransaction with Keypair: ${error instanceof Error ? error.message : error}`);
  }
}

/**
 * Legacy implementation for message signing
 */
async function signMessageLegacy(
  messageBytes: Uint8Array,
  wallet: LegacyWallet
): Promise<Uint8Array> {
  
  // Handle different wallet types
  if ('secretKey' in wallet) {
    // It's a Keypair
    const signature = nacl.sign.detached(messageBytes, wallet.secretKey);
    return signature;
  } else if ("_connectedAccount" in wallet && "_wallet" in wallet) {
    // It's a Standard Wallet
    const feature = wallet._wallet.features[SolanaSignMessageMethod] as SolanaSignMessageFeature;
    if (!feature || typeof feature.signMessage !== 'function') {
      throw new HermisError(
        HERMIS_ERROR__STANDARD_WALLET__FEATURE_NOT_FOUND,
        { featureName: 'signMessage', walletName: wallet._wallet.name || 'Unknown wallet' }
      );
    }

    const result = await feature.signMessage({
      message: messageBytes,
      account: wallet._connectedAccount![0]
    }); 

    if (!result || result.length < 1 || !result[0].signature) {
      throw new HermisError(
        HERMIS_ERROR__SIGNING__MESSAGE_FAILED,
        { reason: 'No signature returned from signMessage' }
      );
    }

    return result[0].signature;
  } else {
    throw new HermisError(
      HERMIS_ERROR__INVARIANT__INVALID_ARGUMENT,
      { argumentName: 'wallet', expectedType: 'Keypair or Standard Wallet', receivedValue: typeof wallet }
    );
  }
  // else {
  //   // It's an Adapter
  //   if (!wallet.publicKey) {
  //     throw new Error('Wallet not connected');
  //   }

  //   // Check if this adapter supports message signing
  //   if ('signMessage' in wallet && typeof wallet.signMessage === 'function') {
      
  //     return await wallet.signMessage(messageBytes);
  //   } else {
  //     throw new Error('Wallet adapter does not support message signing');
  //   }
  // }


}

/**
 * Performs a Sign-In with Solana (SIWS) operation (supports both legacy and kit architectures)
 * 
 * @param wallet The wallet to use for signing (can be Adapter, CryptoKeyPair, or Address)
 * @param input Optional sign-in parameters
 * @param options Optional configuration for dual architecture behavior
 * @returns A promise that resolves to the sign-in result
 */
export async function signIn(
    wallet: DualWallet,
    input: SolanaSignInInput = {},
    options: DualArchitectureOptions = {}
  ): Promise<SolanaSignInOutput> {
    try {
      // Handle kit architecture
      if (isKitWallet(wallet)) {
        if (isCryptoKeyPair(wallet)) {
          // Generate the sign-in message
          const signInMessage = generateSignInMessage(input);
          const messageBytes = new TextEncoder().encode(signInMessage);
          
          // Sign the message using kit architecture
          // This would need proper kit message signing implementation
          throw new Error('Kit sign-in not yet implemented');
        } else {
          // Address without private key - cannot sign
          throw new Error('Cannot sign in with Address - private key required');
        }
      }

      // Handle legacy architecture
      if (isLegacyWallet(wallet)) {
        // Only Adapters are supported for sign-in (not raw Keypairs)
        if ('secretKey' in wallet) {
          throw new Error('Sign-in with raw Keypair is not supported - use an Adapter');
        }

        return await signInLegacy(wallet, input);
      }

      throw new Error('Invalid wallet type for sign-in');
    } catch (error) {
      console.error('Failed to sign in with Solana:', error);
      throw error;
    }
  }

/**
 * Legacy implementation for Sign-In with Solana
 */
async function signInLegacy(
    wallet: Adapter,
    input: SolanaSignInInput = {}
  ): Promise<SolanaSignInOutput> {
    // Check if wallet is connected
    if (!wallet.publicKey) {
      throw new HermisError(
        HERMIS_ERROR__WALLET_CONNECTION__NOT_CONNECTED,
        { walletName: wallet.name || 'Unknown wallet' }
      );
    }
    
    // Check if wallet supports signIn directly
    if ('signIn' in wallet && typeof wallet.signIn === 'function') {
      // The wallet has native signIn support, use it
      const result = await wallet.signIn(input);
      return {
        ...result,
        signature: result.signature,
        signedMessage: result.signedMessage,
        domain: input.domain || (typeof window !== 'undefined' ? window.location.host : 'unknown'),
        nonce: input.nonce || generateNonce(),
        version: input.version || '1'
      };
    }
    
    // Check if wallet at least supports signMessage
    if (!('signMessage' in wallet) || typeof wallet.signMessage !== 'function') {
      throw new HermisError(
        HERMIS_ERROR__SIGNING__MESSAGE_FAILED,
        { reason: 'Wallet does not support message signing' }
      );
    }
    
    // Generate the sign-in message
    const signInMessage = generateSignInMessage(input);
    const messageBytes = new TextEncoder().encode(signInMessage);
    
    // Sign the message
    const signature = await wallet.signMessage(messageBytes);
    
    // Create and return the sign-in output
    const domain = input.domain || (typeof window !== 'undefined' ? window.location.host : 'unknown');
    const nonce = input.nonce || generateNonce();
    const chainId = input.chainId || 'solana:mainnet';
    const version = input.version || '1';
    
    return {
      account: {
        address: wallet.publicKey.toBase58(),
        publicKey: new Uint8Array(wallet.publicKey.toBytes()),
        chain: chainId,
      },
      signature,
      signedMessage: messageBytes,
      domain,
      nonce,
      statement: input.statement,
      version,
    };
  }

// Helper functions for working with dual architectures

/**
 * Creates a kit transaction message with fee payer and lifetime
 * This is a helper function to demonstrate how to create proper kit transactions
 */
export async function createKitTransaction(
  connection: DualConnection,
  feePayer: Address,
  instructions: any[] = []
): Promise<TransactionMessage> {
  // Get recent blockhash using helper (supports both connection types)
  const { blockhash, lastValidBlockHeight } = await getLatestBlockhash(connection);
  
  // Create transaction message
  let transactionMessage = createTransactionMessage({ version: 0 });
  
  // Add instructions if provided
  for (const instruction of instructions) {
    // This would need proper instruction handling
    // transactionMessage = addTransactionMessageInstruction(instruction, transactionMessage);
  }
  
  // Set fee payer
  transactionMessage = setTransactionMessageFeePayer(feePayer, transactionMessage);
  
  // Set lifetime
  const recentBlockhash = {
    blockhash: blockhash as Blockhash,
    lastValidBlockHeight: BigInt(lastValidBlockHeight),
  };
  transactionMessage = setTransactionMessageLifetimeUsingBlockhash(recentBlockhash, transactionMessage);
  
  return transactionMessage;
}

/**
 * Utility to generate a kit keypair signer directly
 * This bypasses the CryptoKeyPair extraction issues by using kit's internal methods
 */
export async function generateKeyPairSigner(): Promise<KeyPairSigner> {
  // Generate 32 random bytes for Ed25519 private key
  const privateKeyBytes = crypto.getRandomValues(new Uint8Array(32));

  // Create a signer directly from the private key bytes
  return await createKeyPairSignerFromPrivateKeyBytes(privateKeyBytes);
}

/**
 * Generate a kit keypair with address for easier access
 * Returns both a CryptoKeyPair (for compatibility) and a working signer
 */
export async function generateKitKeypair(): Promise<{ keypair: CryptoKeyPair; address: Address; signer: KeyPairSigner }> {
  // Generate the signer first
  const signer = await generateKeyPairSigner();

  // Create a CryptoKeyPair for compatibility (though it may not be directly usable for signing)
  const keypair = await generateKeyPair();

  return { keypair, address: signer.address, signer };
}

/**
 * Comprehensive kit message signing function that handles the complete flow
 * @param message The message to sign (string or Uint8Array)
 * @param cryptoKeyPair The CryptoKeyPair to sign with
 * @returns Promise<{ signature: Uint8Array, address: Address }>
 */
export async function signMessageWithKitCryptoKeyPair(
  message: string | Uint8Array,
  cryptoKeyPair: CryptoKeyPair
): Promise<{ signature: Uint8Array; address: Address }> {
  try {
    // Convert message to bytes if it's a string
    const messageBytes = typeof message === 'string'
      ? new TextEncoder().encode(message)
      : message;

    // Convert CryptoKeyPair to MessagePartialSigner
    const messageSigner = await convertCryptoKeyPairToMessageSigner(cryptoKeyPair);

    // Sign the message using kit implementation
    const signature = await signMessageKit(messageBytes, messageSigner);

    return {
      signature,
      address: messageSigner.address
    };
  } catch (error) {
    throw new Error(`Kit message signing with CryptoKeyPair failed: ${error instanceof Error ? error.message : error}`);
  }
}

/**
 * Convenience function to sign a message with a generated kit keypair
 * @param message The message to sign
 * @returns Promise<{ signature: Uint8Array, address: Address, keypair: CryptoKeyPair }>
 */
export async function signMessageWithGeneratedKitKeypair(
  message: string | Uint8Array
): Promise<{ signature: Uint8Array; address: Address; keypair: CryptoKeyPair }> {
  try {
    // Generate a new kit keypair
    const { keypair, address, signer } = await generateKitKeypair();

    // Convert message to bytes if it's a string
    const messageBytes = typeof message === 'string'
      ? new TextEncoder().encode(message)
      : message;

    // Sign the message
    const signature = await signMessageKit(messageBytes, signer);

    return {
      signature,
      address,
      keypair
    };
  } catch (error) {
    throw new Error(`Kit message signing with generated keypair failed: ${error instanceof Error ? error.message : error}`);
  }
}

/**
 * Test function to verify kit message signing is working correctly
 * This function demonstrates the complete kit message signing flow
 */
export async function testKitMessageSigning(): Promise<void> {
  try {
    console.log("🧪 Testing Kit Message Signing Implementation...");

    // Test 1: Sign with generated keypair
    console.log("Test 1: Signing with generated kit keypair");
    const testMessage1 = "Hello, Solana Kit Message Signing!";
    const result1 = await signMessageWithGeneratedKitKeypair(testMessage1);
    console.log("✅ Generated keypair signing successful");
    console.log(`   Address: ${result1.address}`);
    console.log(`   Signature length: ${result1.signature.length} bytes`);

    // Test 2: Sign with existing CryptoKeyPair
    console.log("Test 2: Signing with existing CryptoKeyPair");
    const { keypair } = await generateKitKeypair();
    const testMessage2 = new TextEncoder().encode("Test message with bytes");
    const result2 = await signMessageWithKitCryptoKeyPair(testMessage2, keypair);
    console.log("✅ CryptoKeyPair signing successful");
    console.log(`   Address: ${result2.address}`);
    console.log(`   Signature length: ${result2.signature.length} bytes`);

    // Test 3: Verify the dual architecture signMessage function works with kit
    console.log("Test 3: Testing dual architecture signMessage function");
    const testMessage3 = "Testing dual architecture with kit wallet";
    const dualSignature = await signMessage(testMessage3, keypair);
    console.log("✅ Dual architecture kit signing successful");
    console.log(`   Signature length: ${dualSignature.length} bytes`);

    console.log("🎉 All kit message signing tests passed!");

  } catch (error) {
    console.error("❌ Kit message signing test failed:", error);
    throw error;
  }
}

/**
 * Utility to check if a wallet supports kit architecture
 */
export function supportsKitArchitecture(wallet: DualWallet): boolean {
  return isKitWallet(wallet);
}

/**
 * Utility to check if a transaction is kit architecture
 */
export function isKitTransaction(transaction: DualTransaction): boolean {
  return isTransactionMessage(transaction);
}

/**
 * Legacy-compatible signing function that maintains backward compatibility
 * This function will work with existing code while supporting kit architecture when available
 */
export async function signTransactionLegacyCompatible<T extends Transaction | VersionedTransaction>(
  transaction: T, 
  wallet: Keypair | Adapter
): Promise<T> {
  return await signTransactionLegacy(transaction, wallet);
}

/**
 * Legacy-compatible batch signing function
 */
export async function signAllTransactionsLegacyCompatible<T extends Transaction | VersionedTransaction>(
  transactions: T[], 
  wallet: Keypair | Adapter
): Promise<T[]> {
  return await signAllTransactionsLegacy(transactions, wallet);
}

/**
 * Legacy-compatible send transaction function
 */
export async function sendTransactionLegacyCompatible(
  connection: Connection,
  transaction: Transaction | VersionedTransaction,
  wallet: Keypair | Adapter
): Promise<TransactionSignature> {
  return await sendTransactionLegacy(connection, transaction, wallet, {});
}

/**
 * Create RPC connection helper function
 * This provides a more convenient way to create connections for transaction operations
 * @param rpcUrl The RPC URL to connect to
 * @param options Optional connection configuration
 * @returns A Connection instance configured for transaction operations
 */
export function createRPCConnection(rpcUrl: string, options?: ConnectionConfig): Connection {
  return createConnection(rpcUrl, {
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: 60000,
    ...options
  });
}

/**
 * Send transaction with automatic RPC connection creation
 * @param rpcUrl The RPC URL to use for the connection
 * @param transaction The transaction to send
 * @param wallet The wallet to sign with
 * @param options Optional dual architecture options
 * @returns Promise resolving to transaction signature
 */
export async function sendTransactionWithRPC(
  rpcUrl: string,
  transaction: DualTransaction,
  wallet: DualWallet,
  options: DualArchitectureOptions = {}
): Promise<TransactionSignature> {
  const connection = createRPCConnection(rpcUrl);
  return await sendTransaction(connection, transaction, wallet, options);
}

/**
 * Sign transaction with explicit signer support (improved compatibility)
 * @param transaction The transaction to sign
 * @param signer The signer to use (supports all signer types)
 * @param options Optional dual architecture options
 * @returns Promise resolving to signed transaction
 */
export async function signTransactionWithSigner<T extends DualTransaction>(
  transaction: T,
  signer: Keypair | MessagePartialSigner | KeyPairSigner | CryptoKeyPair,
  options: DualArchitectureOptions = {}
): Promise<T> {
  return await signTransaction(transaction, signer as any, options);
}

// /**
//  * Signs and sends a transaction in a single operation (supports both legacy and kit architectures)
//  * @param connectionOrTransaction The Solana connection to use, or transaction when used with default connection
//  * @param transactionOrWallet The transaction to sign and send, or wallet when connection is omitted
//  * @param walletOrOptions The wallet to sign with, or options when connection is omitted
//  * @param options Optional configuration for dual architecture behavior
//  * @returns A promise that resolves to the transaction signature
//  */
// export async function signAndSendTransaction(
//   connectionOrTransaction: DualConnection | DualTransaction,
//   transactionOrWallet: DualTransaction | DualWallet,
//   walletOrOptions?: DualWallet | DualArchitectureOptions,
//   options?: DualArchitectureOptions
// ): Promise<TransactionSignature>;

// /**
//  * Signs and sends a transaction in a single operation (supports both legacy and kit architectures)
//  * @param connection The Solana connection to use (supports both Legacy Connection and Kit Rpc)
//  * @param transaction The transaction to sign and send
//  * @param wallet The wallet to sign with (can be Keypair, Adapter, CryptoKeyPair, or Address)
//  * @param options Optional configuration for dual architecture behavior
//  * @returns A promise that resolves to the transaction signature
//  */
// export async function signAndSendTransaction(
//   connection: DualConnection,
//   transaction: DualTransaction,
//   wallet: DualWallet,
//   options?: DualArchitectureOptions
// ): Promise<TransactionSignature>;

/**
 * Implementation for signAndSendTransaction with flexible parameter handling
 */
export async function signAndSendTransaction(
  connectionOrTransaction: DualConnection | DualTransaction,
  transactionOrWallet?: DualTransaction | DualWallet,
  walletOrOptions?: DualWallet | DualArchitectureOptions,
  options: DualArchitectureOptions = {}
): Promise<TransactionSignature> {
  let connection: DualConnection;
  let transaction: DualTransaction;
  let wallet: DualWallet;
  let finalOptions: DualArchitectureOptions;

  // Parse parameters based on overload usage
  // Check if first parameter is a connection (either legacy Connection or Kit Rpc)
  // First check if it looks like a transaction
  const looksLikeTransaction = typeof connectionOrTransaction === 'object' && connectionOrTransaction !== null &&
    ('recentBlockhash' in connectionOrTransaction || 'instructions' in connectionOrTransaction || 'message' in connectionOrTransaction);

  if (!looksLikeTransaction) {
    // Standard usage: connection, transaction, wallet, options
    connection = connectionOrTransaction as DualConnection;
    transaction = transactionOrWallet as DualTransaction;
    wallet = walletOrOptions as DualWallet;
    finalOptions = options;
  } else {
    // Alternative usage: transaction, wallet, options (creates default connection)
    transaction = connectionOrTransaction as DualTransaction;
    wallet = transactionOrWallet as DualWallet;
    finalOptions = (walletOrOptions as DualArchitectureOptions) || {};

    // Create a default connection to devnet
    connection = createConnection('https://api.devnet.solana.com');
  }

  try {
    // Handle kit architecture
    if (isKitWallet(wallet)) {
      if (isTransactionMessage(transaction)) {
        // Both wallet and transaction are kit architecture
        if (isCryptoKeyPair(wallet)) {
          // Both wallet and transaction are kit architecture - sign and send directly
          return await signAndSendTransactionKit(connection, transaction as TransactionMessage, wallet);
        } else {
          throw new Error('Cannot sign and send transaction with Address - private key required');
        }
      } else {
        // Kit wallet but legacy transaction
        if (finalOptions.fallbackToLegacy !== false) {
          if (isCryptoKeyPair(wallet)) {
            const legacyKeypair = await convertCryptoKeyPairToKeypair(wallet);
            return await signAndSendTransactionLegacy(connection, transaction as Transaction | VersionedTransaction, legacyKeypair, finalOptions);
          } else {
            throw new Error('Cannot convert Address to legacy wallet for signing and sending');
          }
        } else {
          throw new Error('Kit wallet cannot sign and send legacy transaction without fallback enabled');
        }
      }
    }

    // Everything else uses legacy implementation (Keypair, Adapter, Standard Wallet)
    if (isTransactionMessage(transaction)) {
      // Legacy wallet but kit transaction
      if (finalOptions.preferKitArchitecture === false || finalOptions.fallbackToLegacy !== false) {
        const legacyTransaction = await convertTransactionMessageToLegacy(transaction as TransactionMessage);
        return await signAndSendTransactionLegacy(connection, legacyTransaction, wallet, finalOptions);
      } else {
        throw new Error('Legacy wallet cannot sign and send kit transaction without conversion enabled');
      }
    } else {
      // Both wallet and transaction are legacy architecture
      return await signAndSendTransactionLegacy(connection, transaction as Transaction | VersionedTransaction, wallet, finalOptions);
    }
  } catch (error) {
    console.error('Failed to sign and send transaction:', error);
    throw error;
  }
}

/**
 * Legacy implementation for signing and sending transactions
 */
async function signAndSendTransactionLegacy(
  connection: DualConnection,
  transaction: Transaction | VersionedTransaction,
  wallet: LegacyWallet,
  options: DualArchitectureOptions = {}
): Promise<TransactionSignature> {
  // Set recent blockhash if not already set (for regular transactions)
  if (!isVersionedTransaction(transaction) && !(transaction as Transaction).recentBlockhash) {
    const { blockhash } = await getLatestBlockhash(connection);
    (transaction as Transaction).recentBlockhash = blockhash;
  }

  // Handle different wallet types
  if ('secretKey' in wallet) {
    // It's a Keypair - sign and send in one operation
    if (!isVersionedTransaction(transaction)) {
      // For legacy Connection, use sendAndConfirmTransaction
      if (isLegacyConnection(connection)) {
        return await sendAndConfirmTransaction(connection, transaction as Transaction, [wallet]);
      } else {
        // For Kit connection, sign and send manually
        (transaction as Transaction).sign(wallet);
        return await sendTransactionHelper(connection, transaction);
      }
    } else {
      // For VersionedTransaction, sign and send manually
      const signedTransaction = await signVersionedTransactionWithKeypair(transaction as VersionedTransaction, wallet);
      return await sendTransactionHelper(connection, signedTransaction);
    }
  } else if ("features" in wallet) {
    // It's a Standard Wallet - use signAndSendTransaction feature
    const feature = wallet.features[SolanaSignAndSendTransactionMethod] as SolanaSignAndSendTransactionFeature;
    if (!feature || typeof feature.signAndSendTransaction !== 'function') {
      throw new Error('Wallet has invalid signAndSendTransaction feature');
    }

    // Get the account to use
    const account = wallet.accounts[0] as StandardWalletAccount;
    if (!account) {
      throw new Error('No account found in wallet');
    }

    const accountPublicKey = new PublicKey(account.publicKey);

    // Ensure transaction has feePayer set (only for legacy Transaction, not Kit TransactionMessage)
    if (!isVersionedTransaction(transaction) && !isTransactionMessage(transaction) && !(transaction as Transaction).feePayer) {
      (transaction as Transaction).feePayer = accountPublicKey;
    }

    // Serialize the transaction
    let transactionBytes: Uint8Array;
    try {
      transactionBytes = serializeTransactionForWallet(transaction);
    } catch (error) {
      throw new HermisError(
        HERMIS_ERROR__TRANSACTION__SERIALIZATION_FAILED,
        {
          transactionType: isTransactionMessage(transaction) ? 'Kit TransactionMessage' : isVersionedTransaction(transaction) ? 'VersionedTransaction' : 'Transaction',
          reason: 'Serialization failed for Standard Wallet',
          originalError: error instanceof Error ? error.message : String(error)
        },
        error instanceof Error ? error : undefined
      );
    }

    // Use chain from options, or auto-detect from connection
    const chain = options.chain || getChainFromConnection(connection);

    console.log("DEBUG chain: ", chain);
        
    const result = await feature.signAndSendTransaction({
      account: account,
      transaction: transactionBytes,
      chain: chain
    });

    if (!result || !result[0] || !result[0].signature) {
      throw new Error('No signature returned from signAndSendTransaction');
    }

    // Convert signature bytes to base58 string
    return bs58.encode(result[0].signature);
  } else {
    // It's an Adapter - sign then send separately
    if (!wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    if (!wallet.sendTransaction) {
      throw new Error('Wallet does not support sending transactions');
    }

    // Set fee payer if not already set (for regular transactions)
    if (!isVersionedTransaction(transaction) && !(transaction as Transaction).feePayer) {
      (transaction as Transaction).feePayer = wallet.publicKey;
    }

    // Check for versioned transaction support
    if (
      isVersionedTransaction(transaction) &&
      wallet.supportedTransactionVersions &&
      !wallet.supportedTransactionVersions.has((transaction as any).version)
    ) {
      throw new Error(`Wallet doesn't support transaction version ${(transaction as any).version}`);
    }

    // Check if adapter supports signAndSendTransaction
    // Note: Adapter expects legacy Connection, so only works with legacy connection
    if (!isLegacyConnection(connection)) {
      throw new Error('Adapter requires legacy Connection, not Kit Rpc');
    }

    if ('signAndSendTransaction' in wallet && typeof wallet.signAndSendTransaction === 'function') {
      return await wallet.signAndSendTransaction(transaction, connection);
    } else if ('signTransaction' in wallet && typeof wallet.signTransaction === 'function') {
      // Fall back to sign then send
      const signedTransaction = await wallet.signTransaction(transaction);
      return await wallet.sendTransaction(signedTransaction, connection);
    } else {
      throw new Error('Wallet adapter does not support transaction signing or sending');
    }
  }
}

/**
 * Kit implementation for signing and sending transactions using @solana/kit
 * @param connection The Solana connection (accepts both Legacy and Kit)
 * @param transactionMessage The TransactionMessage to sign and send
 * @param cryptoKeyPair The CryptoKeyPair to sign with
 * @returns The transaction signature
 */
async function signAndSendTransactionKit(
  connection: DualConnection,
  transactionMessage: TransactionMessage,
  cryptoKeyPair: CryptoKeyPair
): Promise<TransactionSignature> {
  try {
    // First sign the transaction using kit
    const signedTransaction = await signTransactionKit(transactionMessage, cryptoKeyPair);

    // Convert the signed kit transaction to a format the connection can send
    const compiledTransaction = compileTransaction(signedTransaction as any);

    // Use getTransactionEncoder to encode the transaction
    const transactionEncoder = getTransactionEncoder();
    const serializedTransaction = transactionEncoder.encode(compiledTransaction);

    // Send the raw transaction to the network using helper (supports both connection types)
    const signature = await sendRawTransactionHelper(connection, new Uint8Array(serializedTransaction), {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    });

    return signature;
  } catch (error) {
    throw new Error(`Kit sign and send transaction failed: ${error instanceof Error ? error.message : error}`);
  }
}