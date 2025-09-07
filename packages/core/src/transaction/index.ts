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
  DualWallet, 
  DualTransaction, 
  LegacyWallet,
  KitWallet,
  DualArchitectureOptions 
} from '../types/index.js';
import { generateNonce, generateSignInMessage } from '../utils/index.js';

import {
  Address,
  generateKeyPair,
  getAddressFromPublicKey,
  createTransactionMessage,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransaction as kitSignTransaction,
  Blockhash,
  TransactionMessage,
  createSignerFromKeyPair,
  KeyPairSigner,
} from "@solana/kit"

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
    'secretKey' in wallet || // Keypair
    ('publicKey' in wallet && 'connected' in wallet) // Adapter
  );
}

/**
 * Helper to detect if a wallet is a kit wallet (CryptoKeyPair or Address)
 */
function isKitWallet(wallet: DualWallet): wallet is KitWallet {
  return !isLegacyWallet(wallet);
}

/**
 * Helper to detect if a transaction is a TransactionMessage (kit architecture)
 */
function isTransactionMessage(transaction: DualTransaction): transaction is TransactionMessage {
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
function isAddress(wallet: KitWallet): wallet is Address {
  return typeof wallet === 'string' || (wallet instanceof String);
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
      if (isCryptoKeyPair(wallet)) {
        // Use kit's message signing capabilities
        // This would need to be implemented with proper kit message signing
        throw new Error('Kit message signing not yet implemented');
      } else {
        // Address without private key - cannot sign
        throw new Error('Cannot sign message with Address - private key required');
      }
    }

    // Handle legacy architecture
    if (isLegacyWallet(wallet)) {
      return await signMessageLegacy(messageBytes, wallet);
    }

    throw new Error('Invalid wallet type');
  } catch (error) {
    console.error('Failed to sign message:', error);
    throw error;
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
    // Note: Keypair doesn't have a direct message signing method in web3.js
    // You would need to implement it using nacl or similar
    throw new Error('Direct message signing with Keypair is not supported');
  } else {
    // It's an Adapter
    if (!wallet.publicKey) {
      throw new Error('Wallet not connected');
    }
    
    // Check if this adapter supports message signing
    if ('signMessage' in wallet && typeof wallet.signMessage === 'function') {
      return await wallet.signMessage(messageBytes);
    } else {
      throw new Error('Wallet adapter does not support message signing');
    }
  }
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
 * Utility to generate a kit keypair and get its address
 */
export async function generateKeyPairSigner(): Promise<KeyPairSigner<string>> {
// export async function generateKitKeypair(): Promise<{ keypair: CryptoKeyPair; address: Address }> {
  const keypair = await generateKeyPair();
  // const address = await getAddressFromPublicKey(keypair.publicKey);
  return createSignerFromKeyPair(keypair)
  // return { keypair, address };
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