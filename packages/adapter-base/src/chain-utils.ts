/**
 * Solana Chain Utilities
 *
 * Constants and utilities for working with Solana chain identifiers
 * in the Wallet Standard format.
 */

import { HermisError, HERMIS_ERROR__INVARIANT__INVALID_ARGUMENT } from '@hermis/errors'
import type { DualConnection, WalletAdapterNetwork } from '@hermis/solana-headless-core'
import { isLegacyConnection } from '@hermis/solana-headless-core'

/**
 * Solana chain identifiers following the Wallet Standard format
 * Format: solana:<base58-encoded-genesis-hash>
 *
 * @see https://github.com/wallet-standard/wallet-standard
 */
export const SOLANA_CHAINS = {
  /** Solana Mainnet Beta */
  mainnet: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp' as const,

  /** Solana Devnet */
  devnet: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1' as const,

  /** Solana Testnet */
  testnet: 'solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z' as const,
} as const

/**
 * Solana network names
 */
export type SolanaNetwork = 'mainnet' | 'devnet' | 'testnet'

/**
 * Get the Wallet Standard chain identifier for a given network
 *
 * @param network - The Solana network name
 * @returns The Wallet Standard chain identifier
 *
 * @example
 * ```typescript
 * const chainId = getChainId('devnet')
 * // 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1'
 * ```
 */
export function getChainId(network: SolanaNetwork): `solana:${string}` {
  return SOLANA_CHAINS[network]
}

/**
 * Get the network name from a Wallet Standard chain identifier
 *
 * @param chain - The Wallet Standard chain identifier
 * @returns The network name or null if unknown
 *
 * @example
 * ```typescript
 * const network = getNetworkFromChainId('solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1')
 * // 'devnet'
 * ```
 */
export function getNetworkFromChainId(chain: string): SolanaNetwork | null {
  switch (chain) {
    case SOLANA_CHAINS.mainnet:
      return 'mainnet'
    case SOLANA_CHAINS.devnet:
      return 'devnet'
    case SOLANA_CHAINS.testnet:
      return 'testnet'
    default:
      return null
  }
}

/**
 * Check if a chain identifier is a valid Solana chain
 *
 * @param chain - The chain identifier to validate
 * @returns true if the chain is a valid Solana chain, false otherwise
 */
export function isSolanaChain(chain: string): chain is `solana:${string}` {
  return chain.startsWith('solana:')
}

/**
 * Validate that a chain is one of the known Solana chains
 *
 * @param chain - The chain to validate
 * @throws Error if the chain is not a known Solana chain
 */
export function validateKnownSolanaChain(chain: string): asserts chain is typeof SOLANA_CHAINS[SolanaNetwork] {
  if (!Object.values(SOLANA_CHAINS).includes(chain as any)) {
    throw new HermisError(
      HERMIS_ERROR__INVARIANT__INVALID_ARGUMENT,
      {
        argumentName: 'chain',
        expectedType: `one of: ${Object.values(SOLANA_CHAINS).join(', ')}`,
        receivedValue: chain
      }
    )
  }
}

/**
 * Get the Solana Explorer cluster name for a given network
 *
 * @param network - The Solana network name
 * @returns The Solana Explorer cluster name
 */
export function getExplorerClusterName(network: SolanaNetwork): 'mainnet-beta' | 'devnet' | 'testnet' {
  switch (network) {
    case 'mainnet':
      return 'mainnet-beta'
    case 'devnet':
      return 'devnet'
    case 'testnet':
      return 'testnet'
  }
}

/**
 * Convert WalletAdapterNetwork enum to SolanaNetwork type
 *
 * @param network - The WalletAdapterNetwork enum value
 * @returns The corresponding SolanaNetwork type
 *
 * @example
 * ```typescript
 * import { WalletAdapterNetwork } from '@hermis/solana-headless-core';
 *
 * const network = walletAdapterNetworkToSolanaNetwork(WalletAdapterNetwork.Devnet);
 * // 'devnet'
 * ```
 */
export function walletAdapterNetworkToSolanaNetwork(network: WalletAdapterNetwork): SolanaNetwork {
  switch (network) {
    case 'mainnet-beta' as WalletAdapterNetwork:
      return 'mainnet'
    case 'devnet' as WalletAdapterNetwork:
      return 'devnet'
    case 'testnet' as WalletAdapterNetwork:
      return 'testnet'
    default:
      return 'mainnet' // Default to mainnet for unknown networks
  }
}

/**
 * Detect the Solana network from a connection's RPC endpoint
 *
 * Analyzes the connection's endpoint URL to determine which Solana network
 * (mainnet, devnet, or testnet) is being used. Supports both legacy web3.js
 * Connection and Kit Rpc.
 *
 * @param connection - The Solana connection (DualConnection supports both architectures)
 * @param fallbackNetwork - Optional network to use if detection fails (defaults to 'devnet')
 * @returns The detected network name
 *
 * @example
 * ```typescript
 * import { Connection } from '@solana/web3.js';
 *
 * const connection = new Connection('https://api.devnet.solana.com');
 * const network = getNetworkFromConnection(connection);
 * // 'devnet'
 * ```
 */
export function getNetworkFromConnection(
  connection: DualConnection,
  fallbackNetwork: SolanaNetwork = 'devnet'
): SolanaNetwork {
  // For legacy connections, check the rpcEndpoint property
  if (isLegacyConnection(connection)) {
    const endpoint = connection.rpcEndpoint.toLowerCase()

    // Check for devnet
    if (endpoint.includes('devnet')) {
      return 'devnet'
    }

    // Check for testnet
    if (endpoint.includes('testnet')) {
      return 'testnet'
    }

    // Check for mainnet-beta (official endpoint)
    if (endpoint.includes('mainnet-beta') || endpoint.includes('mainnet')) {
      return 'mainnet'
    }
  }

  // For Kit connections or if endpoint parsing failed, use fallback
  // Kit connections don't expose endpoint URL in a standard way
  return fallbackNetwork
}
