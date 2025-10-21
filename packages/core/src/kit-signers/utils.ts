/**
 * Kit-Compatible Signer Utilities
 *
 * Framework-agnostic utility functions for Kit signer implementation.
 */

import { address, type Address } from '@solana/kit'
import type { PublicKey } from '../types/index.js'
import type { SignableMessage, SignatureDictionary } from './types.js'
import { HermisError, HERMIS_ERROR__STANDARD_WALLET__CHAIN_NOT_SUPPORTED } from '@hermis/errors'

/**
 * Detect if a message was modified during signing
 *
 * @param original - Original message bytes
 * @param modified - Potentially modified message bytes
 * @returns true if message was modified, false otherwise
 */
export function detectMessageModification(
  original: Uint8Array,
  modified: Uint8Array
): boolean {
  if (original.length !== modified.length) {
    return true
  }

  for (let i = 0; i < original.length; i++) {
    if (original[i] !== modified[i]) {
      return true
    }
  }

  return false
}

/**
 * Compare two Uint8Arrays for equality
 *
 * @param a - First array
 * @param b - Second array
 * @returns true if arrays are equal, false otherwise
 */
export function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false
  }

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false
    }
  }

  return true
}

/**
 * Update signature dictionary with new signature
 *
 * If message was modified, clears existing signatures (they're now invalid).
 * Otherwise, merges new signature with existing ones.
 *
 * @param original - Original message content
 * @param signed - Signed message content
 * @param originalSignatures - Original signature dictionary
 * @param address - Address of the signer
 * @param signature - New signature bytes
 * @returns Updated signature dictionary
 */
export function updateSignatureDictionary(
  original: Uint8Array,
  signed: Uint8Array,
  originalSignatures: SignatureDictionary,
  address: Address,
  signature: Uint8Array
): SignatureDictionary {
  const wasModified = detectMessageModification(original, signed)

  // If message was modified, existing signatures are invalid
  if (wasModified) {
    return { [address]: signature }
  }

  // Message unchanged, add to existing signatures
  return {
    ...originalSignatures,
    [address]: signature
  }
}

/**
 * Convert web3.js PublicKey to Kit Address type
 *
 * @param publicKey - Web3.js PublicKey instance or null
 * @returns Kit Address or null
 */
export function publicKeyToAddress(publicKey: PublicKey | null): Address<string> | null {
  if (!publicKey) {
    return null
  }

  try {
    return address(publicKey.toBase58())
  } catch (error) {
    console.error('Failed to convert PublicKey to Address:', error)
    return null
  }
}

/**
 * Convert web3.js PublicKey to address string
 *
 * @param publicKey - Web3.js PublicKey instance or null
 * @returns Base58 address string or null
 */
export function publicKeyToString(publicKey: PublicKey | null): string | null {
  if (!publicKey) {
    return null
  }

  try {
    return publicKey.toBase58()
  } catch (error) {
    console.error('Failed to convert PublicKey to string:', error)
    return null
  }
}

/**
 * Validate that an account supports a specific chain
 *
 * @param accountChains - Array of chains supported by the account
 * @param requiredChain - Chain that must be supported
 * @throws Error if chain is not supported
 */
export function validateChainSupport(
  accountChains: readonly string[],
  requiredChain: string
): void {
  if (!accountChains.includes(requiredChain)) {
    throw new HermisError(HERMIS_ERROR__STANDARD_WALLET__CHAIN_NOT_SUPPORTED, {
      chain: requiredChain,
      walletName: 'Account',
      supportedChains: Array.from(accountChains)
    })
  }
}

/**
 * Create a frozen (immutable) signer object
 *
 * This ensures referential stability and prevents accidental mutations.
 *
 * @param signer - Signer object to freeze
 * @returns Frozen signer object
 */
export function freezeSigner<T extends object>(signer: T): Readonly<T> {
  return Object.freeze(signer)
}
