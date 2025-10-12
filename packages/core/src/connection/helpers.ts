/**
 * Connection helper utilities to abstract differences between Legacy Connection and Kit Rpc
 *
 * These helpers allow code to work transparently with both:
 * - Legacy Connection from @solana/web3.js
 * - Kit Rpc from @solana/kit
 */

import type { DualConnection, Commitment } from '../types/index.js';
import { isKitConnection } from '../types/index.js';

/**
 * Get the latest blockhash from a connection (Legacy or Kit)
 *
 * Abstracts the difference between:
 * - Legacy: connection.getLatestBlockhash(commitment) returns { blockhash, lastValidBlockHeight }
 * - Kit: connection.getLatestBlockhash({ commitment }).send() returns { value: { blockhash, lastValidBlockHeight } }
 *
 * @param connection - Either Legacy Connection or Kit Rpc
 * @param commitment - Optional commitment level
 * @returns Promise resolving to { blockhash, lastValidBlockHeight }
 */
export async function getLatestBlockhash(
  connection: DualConnection,
  commitment?: Commitment
): Promise<{ blockhash: string; lastValidBlockHeight: number }> {
  if (isKitConnection(connection)) {
    // Kit Rpc: returns { value: { blockhash, lastValidBlockHeight } }
    const result = await (connection as any).getLatestBlockhash({ commitment }).send();
    return result.value;
  } else {
    // Legacy Connection: returns { blockhash, lastValidBlockHeight }
    return await (connection as any).getLatestBlockhash(commitment);
  }
}

/**
 * Send a raw transaction (as bytes) to the network
 *
 * Abstracts the difference between:
 * - Legacy: connection.sendRawTransaction(bytes, options) returns signature string
 * - Kit: connection.sendTransaction(bytes, options).send() returns signature string
 *
 * @param connection - Either Legacy Connection or Kit Rpc
 * @param bytes - Serialized transaction bytes
 * @param options - Optional send options (skipPreflight, etc.)
 * @returns Promise resolving to transaction signature
 */
export async function sendRawTransaction(
  connection: DualConnection,
  bytes: Uint8Array,
  options?: {
    skipPreflight?: boolean;
    preflightCommitment?: Commitment;
    maxRetries?: number;
    minContextSlot?: number;
  }
): Promise<string> {
  if (isKitConnection(connection)) {
    // Kit Rpc: sendTransaction(bytes, options).send()
    const result = await (connection as any).sendTransaction(bytes, options).send();
    return result;
  } else {
    // Legacy Connection: sendRawTransaction(bytes, options)
    return await (connection as any).sendRawTransaction(bytes, options);
  }
}

/**
 * Send a transaction object to the network (helper for internal use)
 *
 * Abstracts the difference between:
 * - Legacy: connection.sendTransaction(transaction) accepts Transaction objects
 * - Kit: connection.sendTransaction(bytes) requires pre-serialized bytes
 *
 * Note: For Kit, the transaction must have a serialize() method
 * Note: This is named sendTransactionHelper to avoid conflicts with the main sendTransaction function
 *
 * @param connection - Either Legacy Connection or Kit Rpc
 * @param transaction - Transaction object (must have serialize() method for Kit)
 * @param options - Optional send options
 * @returns Promise resolving to transaction signature
 */
export async function sendTransactionHelper(
  connection: DualConnection,
  transaction: any,
  options?: {
    skipPreflight?: boolean;
    preflightCommitment?: Commitment;
    maxRetries?: number;
    minContextSlot?: number;
  }
): Promise<string> {
  if (isKitConnection(connection)) {
    // Kit requires serialized bytes
    if (typeof transaction.serialize !== 'function') {
      throw new Error('Transaction must have a serialize() method for Kit connections');
    }
    const bytes = transaction.serialize();
    return await sendRawTransaction(connection, bytes, options);
  } else {
    // Legacy accepts transaction objects directly
    return await (connection as any).sendTransaction(transaction, options);
  }
}
