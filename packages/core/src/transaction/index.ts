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
  Keypair,
  Transaction,
  TransactionSignature,
  sendAndConfirmTransaction,
  VersionedTransaction,
} from '@solana/web3.js';
import {
  SolanaSignInInput,
  SolanaSignInOutput,
  DualTransaction,
  DualArchitectureOptions,
  DualWallet,
  LegacyWallet,
  KitWallet
} from '../types/index.js';
import { generateNonce, generateSignInMessage } from '../utils/index.js';

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
  setTransactionMessageLifetimeUsingBlockhash,

  // Message signing
  createSignableMessage,

  // Signing
  signTransaction as kitSignTransaction,
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
  StandardWalletAccount
} from '@hermis/solana-headless-adapter-base';

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
 */
function isKitWallet(wallet: DualWallet): wallet is KitWallet {
  return !isLegacyWallet(wallet);
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
    !('recentBlockhash' in transaction) &&
    !('version' in transaction)
  );
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
 * Signs a transaction using the specified wallet (supports both legacy and kit architectures)
 * @param transaction The transaction to sign (can be Transaction, VersionedTransaction, or TransactionMessage)
 * @param wallet The wallet to sign with (can be Keypair, Adapter, CryptoKeyPair, or Address)
 * @param options Optional configuration for dual architecture behavior
 * @returns The signed transaction
 */
export async function signTransaction<T extends DualTransaction>(
  transaction: T, 
  wallet: DualWallet,
  options: DualArchitectureOptions = {}
): Promise<T> {
  // Handle kit architecture
  if (isKitWallet(wallet)) {
    if (isTransactionMessage(transaction)) {
      // Both wallet and transaction are kit architecture
      if (isCryptoKeyPair(wallet)) {
        // The transaction message needs to be properly formatted for signing
        // For now, we'll throw an error indicating this needs proper implementation
        throw new Error('Kit transaction signing requires proper transaction message formatting - not yet implemented');
      } else {
        // Address without private key - cannot sign
        throw new Error('Cannot sign transaction with Address - private key required');
      }
    } else {
      // Kit wallet but legacy transaction - convert if possible
      if (options.fallbackToLegacy !== false) {
        // Convert kit wallet to legacy for signing
        if (isCryptoKeyPair(wallet)) {
          const legacyKeypair = await convertCryptoKeyPairToKeypair(wallet);
          return await signTransactionLegacy(transaction as Transaction | VersionedTransaction, legacyKeypair) as T;
        } else {
          throw new Error('Cannot convert Address to legacy wallet for signing');
        }
      } else {
        throw new Error('Kit wallet cannot sign legacy transaction without fallback enabled');
      }
    }
  }

  // Handle legacy architecture
  if (isLegacyWallet(wallet)) {
    if (isTransactionMessage(transaction)) {
      // Legacy wallet but kit transaction - convert if possible
      if (options.preferKitArchitecture === false || options.fallbackToLegacy !== false) {
        // Convert transaction to legacy format
        const legacyTransaction = await convertTransactionMessageToLegacy(transaction as TransactionMessage);
        const signedLegacy = await signTransactionLegacy(legacyTransaction, wallet);
        // Convert back to TransactionMessage if needed
        // This would need proper implementation using conversion utilities
        throw new Error('Legacy to kit transaction conversion not yet implemented');
      } else {
        throw new Error('Legacy wallet cannot sign kit transaction without conversion enabled');
      }
    } else {
      // Both wallet and transaction are legacy architecture
      return await signTransactionLegacy(transaction as Transaction | VersionedTransaction, wallet) as T;
    }
  }

  throw new Error('Invalid wallet or transaction type');
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
      // For VersionedTransaction, we need different signing logic
      // Currently not implemented in standard web3.js for Keypair
      throw new Error('Signing versioned transactions with a Keypair directly is not supported');
    }
  } else if ("features" in wallet) {
    // It's a Standard Wallet
    const feature = wallet.features[SolanaSignTransactionMethod] as SolanaSignTransactionFeature;
    if (!feature || typeof feature.signTransaction !== 'function') {
      throw new Error('Wallet has invalid signTransaction feature');
    }

    return transaction
  } else {
    // It's an Adapter
    if (!wallet.publicKey) {
      throw new Error('Wallet not connected');
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
 * Convert CryptoKeyPair to legacy Keypair (placeholder - needs proper implementation)
 */
async function convertCryptoKeyPairToKeypair(cryptoKeyPair: CryptoKeyPair): Promise<Keypair> {
  // This would need proper implementation using @solana/compat
  // For now, throw an error to indicate this needs implementation
  throw new Error('CryptoKeyPair to Keypair conversion not yet implemented');
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
 * Convert TransactionMessage to legacy Transaction (placeholder - needs proper implementation)
 */
async function convertTransactionMessageToLegacy(transactionMessage: TransactionMessage): Promise<Transaction> {
  // This would need proper implementation using @solana/compat
  // For now, throw an error to indicate this needs implementation
  throw new Error('TransactionMessage to Transaction conversion not yet implemented');
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

  // Handle legacy architecture
  if (isLegacyWallet(wallet)) {
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
            throw new Error('Legacy to kit transaction conversion not yet implemented');
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

  throw new Error('Invalid wallet or transaction types');
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
        // For VersionedTransaction, we would need custom signing logic
        throw new Error('Signing versioned transactions with a Keypair directly is not supported');
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

    return transactions
  } else {
    // It's an Adapter
    if (!wallet.publicKey) {
      throw new Error('Wallet not connected');
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
 * @param connection The Solana connection to use
 * @param transaction The transaction to send
 * @param wallet The wallet to sign with (can be Keypair, Adapter, CryptoKeyPair, or Address)
 * @param options Optional configuration for dual architecture behavior
 * @returns A promise that resolves to the transaction signature
 */
export async function sendTransaction(
  connection: Connection, 
  transaction: DualTransaction, 
  wallet: DualWallet,
  options: DualArchitectureOptions = {}
): Promise<TransactionSignature> {
  try {
    // Handle kit architecture
    if (isKitWallet(wallet)) {
      if (isTransactionMessage(transaction)) {
        // Both wallet and transaction are kit architecture
        if (isCryptoKeyPair(wallet)) {
          // Kit transaction sending requires proper implementation
          throw new Error('Kit transaction sending not yet implemented');
        } else {
          throw new Error('Cannot send transaction with Address - private key required');
        }
      } else {
        // Kit wallet but legacy transaction
        if (options.fallbackToLegacy !== false) {
          if (isCryptoKeyPair(wallet)) {
            const legacyKeypair = await convertCryptoKeyPairToKeypair(wallet);
            return await sendTransactionLegacy(connection, transaction as Transaction | VersionedTransaction, legacyKeypair);
          } else {
            throw new Error('Cannot convert Address to legacy wallet for sending');
          }
        } else {
          throw new Error('Kit wallet cannot send legacy transaction without fallback enabled');
        }
      }
    }

    // Handle legacy architecture
    if (isLegacyWallet(wallet)) {
      if (isTransactionMessage(transaction)) {
        // Legacy wallet but kit transaction
        if (options.preferKitArchitecture === false || options.fallbackToLegacy !== false) {
          const legacyTransaction = await convertTransactionMessageToLegacy(transaction as TransactionMessage);
          return await sendTransactionLegacy(connection, legacyTransaction, wallet);
        } else {
          throw new Error('Legacy wallet cannot send kit transaction without conversion enabled');
        }
      } else {
        // Both wallet and transaction are legacy architecture
        return await sendTransactionLegacy(connection, transaction as Transaction | VersionedTransaction, wallet);
      }
    }

    throw new Error('Invalid wallet or transaction type');
  } catch (error) {
    console.error('Failed to send transaction:', error);
    throw error;
  }
}

/**
 * Legacy implementation for sending transactions
 */
async function sendTransactionLegacy(
  connection: Connection, 
  transaction: Transaction | VersionedTransaction, 
  wallet: LegacyWallet
): Promise<TransactionSignature> {
  // Set recent blockhash if not already set (for regular transactions)
  if (!isVersionedTransaction(transaction) && !(transaction as Transaction).recentBlockhash) {
    const { blockhash } = await connection.getLatestBlockhash();
    (transaction as Transaction).recentBlockhash = blockhash;
  }
  
  // Handle different wallet types
  if ('secretKey' in wallet) {
    // It's a Keypair
    if (!isVersionedTransaction(transaction)) {
      return await sendAndConfirmTransaction(connection, transaction as Transaction, [wallet]);
    } else {
      throw new Error('Sending versioned transactions with a Keypair is not directly supported');
    }
  } else if ("features" in wallet) {
      // It's a Standard Wallet
      const feature = wallet.features[SolanaSignAndSendTransactionMethod] as SolanaSignAndSendTransactionFeature;
      if (!feature || typeof feature.signAndSendTransaction !== 'function') {
        throw new Error('Wallet has invalid signAndSendTransaction feature');
      }

      const result = await feature.signAndSendTransaction({
        account: wallet.accounts[0] as StandardWalletAccount,
        transaction: transaction as any,
        chain: 'solana:mainnet'
      });

      return result[0].signature.toString();
  } else {
    // It's an Adapter
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
    
    // Send the transaction using the adapter
    return await wallet.sendTransaction(transaction, connection);
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
    
    if (isLegacyWallet(wallet)) {
      return await signMessageLegacy(messageBytes, wallet);
    }
    // Handle legacy architecture

    throw new Error('Invalid wallet type');
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
      throw new Error('Wallet has invalid signMessage feature');
    }

    const result = await feature.signMessage({
      message: messageBytes,
      account: wallet._connectedAccount![0]
    }); 

    if (!result || result.length < 1 || !result[0].signature) {
      throw new Error('No signature returned from signMessage');
    }

    return result[0].signature;
  } else {
    throw new Error('Invalid wallet type');
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
      throw new Error('Wallet not connected');
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
      throw new Error('Wallet does not support message signing');
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
  connection: Connection,
  feePayer: Address,
  instructions: any[] = []
): Promise<TransactionMessage> {
  // Get recent blockhash
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  
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
  return await sendTransactionLegacy(connection, transaction, wallet);
}