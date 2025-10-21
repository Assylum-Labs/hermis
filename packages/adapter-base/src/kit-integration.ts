/**
 * Kit Integration for Wallet Adapters
 *
 * Creates Kit-compatible signers from wallet adapters.
 * This module bridges the gap between legacy wallet adapters and modern Kit architecture.
 */

import { HermisError, HERMIS_ERROR__STANDARD_WALLET__FEATURE_NOT_FOUND, HERMIS_ERROR__INVARIANT__OPERATION_NOT_ALLOWED } from '@hermis/errors'
import type { Address } from '@solana/kit'
import type { WalletAdapter, PublicKey } from '@hermis/solana-headless-core'
import {
  createMessageSignerFromWallet,
  createTransactionSendingSignerFromWallet,
  publicKeyToAddress,
  publicKeyToString,
  type MessageModifyingSigner,
  type TransactionSendingSigner,
} from '@hermis/solana-headless-core'

/**
 * Result of creating Kit signers from a wallet adapter
 */
export interface KitSigners {
  /** Kit Address type (null if wallet not connected) */
  address: Address<string> | null

  /** Plain address string (null if wallet not connected) */
  addressString: string | null

  /** Message signer (null if wallet doesn't support signing or not connected) */
  messageSigner: MessageModifyingSigner<string> | null

  /** Transaction sending signer (null if wallet doesn't support or not connected) */
  transactionSigner: TransactionSendingSigner<string> | null
}

/**
 * Create Kit-compatible signers from a wallet adapter
 *
 * This function bridges legacy wallet adapters with modern Kit architecture.
 * It's framework-agnostic and can be used in any JavaScript environment.
 *
 * @param adapter - The wallet adapter instance
 * @param chain - The Solana chain identifier (e.g., 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1')
 * @returns Kit signers object with address and signer instances
 *
 * @example
 * ```typescript
 * const {address, messageSigner, transactionSigner} = createKitSignersFromAdapter(
 *   walletAdapter,
 *   'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1' // devnet
 * )
 * ```
 */
export function createKitSignersFromAdapter(
  adapter: WalletAdapter | null,
  chain: `solana:${string}`,
): KitSigners {
  // If no adapter or not connected, return null values
  if (!adapter || !adapter.publicKey) {
    return {
      address: null,
      addressString: null,
      messageSigner: null,
      transactionSigner: null,
    }
  }

  // Convert publicKey to Kit Address
  const walletAddress = publicKeyToAddress(adapter.publicKey)
  const walletAddressString = publicKeyToString(adapter.publicKey)

  if (!walletAddress) {
    return {
      address: null,
      addressString: null,
      messageSigner: null,
      transactionSigner: null,
    }
  }

  // Create message signer if adapter supports message signing
  const messageSigner = 'signMessage' in adapter && typeof adapter.signMessage === 'function'
    ? createMessageSignerFromWallet(
        walletAddress,
        async (message: Uint8Array) => {
          if (!('signMessage' in adapter) || typeof adapter.signMessage !== 'function') {
            throw new HermisError(
              HERMIS_ERROR__STANDARD_WALLET__FEATURE_NOT_FOUND,
              { featureName: 'signMessage', walletName: adapter.name || 'Unknown wallet' }
            )
          }
          return await adapter.signMessage(message)
        }
      )
    : null

  // Create transaction sending signer if adapter supports sending transactions
  const transactionSigner = 'sendTransaction' in adapter && typeof adapter.sendTransaction === 'function'
    ? createTransactionSendingSignerFromWallet(
        walletAddress,
        chain,
        async (transaction: any) => {
          if (!('sendTransaction' in adapter) || typeof adapter.sendTransaction !== 'function') {
            throw new HermisError(
              HERMIS_ERROR__STANDARD_WALLET__FEATURE_NOT_FOUND,
              { featureName: 'sendTransaction', walletName: adapter.name || 'Unknown wallet' }
            )
          }

          // Note: This is a simplified implementation
          // For full Kit support, we need to handle transaction conversion
          // between Kit TransactionMessage and web3.js Transaction
          //
          // For now, we pass through the transaction as-is
          // The actual implementation will depend on dual architecture support

          // In a real implementation, you might do:
          // const signature = await adapter.sendTransaction(transaction, connection)
          // return signature

          // Placeholder - needs actual connection
          throw new HermisError(
            HERMIS_ERROR__INVARIANT__OPERATION_NOT_ALLOWED,
            {
              argumentName: 'connection',
              expectedType: 'Connection instance',
              receivedValue: 'undefined (connection parameter required)'
            }
          )
        }
      )
    : null

  return {
    address: walletAddress,
    addressString: walletAddressString,
    messageSigner,
    transactionSigner,
  }
}

/**
 * Check if an adapter supports message signing
 *
 * @param adapter - The wallet adapter to check
 * @returns true if the adapter supports message signing, false otherwise
 */
export function adapterSupportsMessageSigning(adapter: WalletAdapter | null): boolean {
  return !!(adapter && 'signMessage' in adapter && typeof adapter.signMessage === 'function')
}

/**
 * Check if an adapter supports transaction sending
 *
 * @param adapter - The wallet adapter to check
 * @returns true if the adapter supports transaction sending, false otherwise
 */
export function adapterSupportsTransactionSending(adapter: WalletAdapter | null): boolean {
  return !!(adapter && 'sendTransaction' in adapter && typeof adapter.sendTransaction === 'function')
}
