/**
 * Kit Integration for Wallet Adapters
 *
 * Creates Kit-compatible signers from wallet adapters.
 * This module bridges the gap between legacy wallet adapters and modern Kit architecture.
 */

import { HermisError, HERMIS_ERROR__STANDARD_WALLET__FEATURE_NOT_FOUND } from '@hermis/errors'
import type { Address } from '@solana/kit'
import type { WalletAdapter, DualConnection } from '@hermis/solana-headless-core'
import {
  createMessageSignerFromWallet,
  createTransactionSendingSignerFromWallet,
  publicKeyToAddress,
  publicKeyToString,
  type MessageModifyingSigner,
  type TransactionSendingSigner,
} from '@hermis/solana-headless-core'
import { getChainId, getNetworkFromConnection, type SolanaNetwork } from './chain-utils.js'

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
 * The network is automatically detected from the connection's RPC endpoint.
 * For custom RPC URLs, you can override detection with the optional `network` parameter.
 *
 * **DualConnection Support:**
 * This function accepts both legacy `Connection` from @solana/web3.js and Kit `Rpc`.
 * Wallet adapters created with the Hermis wallet standard support both connection types
 * through their `sendTransaction` and `signAndSendTransaction` methods.
 *
 * @param adapter - The wallet adapter instance (must be connected)
 * @param connection - The Solana connection (supports both web3.js Connection and Kit Rpc)
 * @param network - Optional network override ('mainnet' | 'devnet' | 'testnet')
 * @returns Kit signers object with address and signer instances
 *
 * @example
 * ```typescript
 * import { Connection } from '@solana/web3.js';
 * import { createKitSignersFromAdapter } from '@hermis/solana-headless-adapter-base';
 *
 * const connection = new Connection('https://api.devnet.solana.com');
 * const {address, messageSigner, transactionSigner} = createKitSignersFromAdapter(
 *   walletAdapter,
 *   connection
 * );
 * ```
 */
export function createKitSignersFromAdapter(
  adapter: WalletAdapter | null,
  connection: DualConnection,
  network?: SolanaNetwork,
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

  // Detect network from connection (or use provided override)
  const detectedNetwork = network || getNetworkFromConnection(connection)
  const chain = getChainId(detectedNetwork)

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
  // Prefer signAndSendTransaction over sendTransaction as it's more efficient
  const transactionSigner = ('signAndSendTransaction' in adapter || 'sendTransaction' in adapter)
    ? createTransactionSendingSignerFromWallet(
        walletAddress,
        chain,
        async (transaction: any) => {
          // Prefer signAndSendTransaction (sign + send in one call)
          // Both methods support DualConnection (Legacy Connection or Kit Rpc)
          // Note: Type assertion needed because some adapters may be typed as Connection-only,
          // but StandardWalletAdapter implementations accept DualConnection
          if ('signAndSendTransaction' in adapter && typeof adapter.signAndSendTransaction === 'function') {
            return await (adapter.signAndSendTransaction as any)(transaction, connection)
          }

          // Fallback to sendTransaction
          if ('sendTransaction' in adapter && typeof adapter.sendTransaction === 'function') {
            return await (adapter.sendTransaction as any)(transaction, connection)
          }

          throw new HermisError(
            HERMIS_ERROR__STANDARD_WALLET__FEATURE_NOT_FOUND,
            { featureName: 'sendTransaction or signAndSendTransaction', walletName: adapter.name || 'Unknown wallet' }
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
