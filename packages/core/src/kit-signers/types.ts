/**
 * Kit-Compatible Signer Types
 *
 * Framework-agnostic signer interfaces that match @solana/signers specification.
 * These types enable seamless integration with @solana/kit without external dependencies.
 */

import type { Address } from '@solana/kit'

/**
 * Signature bytes type (64-byte Ed25519 signature)
 */
export type SignatureBytes = Uint8Array

/**
 * Slot number on Solana blockchain
 */
export type Slot = bigint

/**
 * Dictionary mapping addresses to their signatures
 */
export type SignatureDictionary = Readonly<Record<Address, SignatureBytes>>

/**
 * A signable message with content and signatures
 */
export type SignableMessage = {
  content: Uint8Array
  signatures: SignatureDictionary
}

/**
 * Base configuration for signer operations
 */
export type BaseSignerConfig = Readonly<{
  abortSignal?: AbortSignal
}>

/**
 * Configuration for message signing operations
 */
export type MessageModifyingSignerConfig = BaseSignerConfig

/**
 * Configuration for transaction signing operations
 */
export type TransactionSendingSignerConfig = BaseSignerConfig & Readonly<{
  minContextSlot?: Slot
}>

/**
 * Message Modifying Signer
 *
 * A signer that can modify and sign messages. This matches the @solana/signers
 * MessageModifyingSigner interface for compatibility.
 *
 * @template TAddress - The address type (defaults to string)
 */
export type MessageModifyingSigner<TAddress extends string = string> = Readonly<{
  /** The address of this signer */
  address: Address<TAddress>

  /**
   * Modify and sign messages
   *
   * @param messages - Array of messages to sign
   * @param config - Optional configuration
   * @returns Promise resolving to signed messages
   */
  modifyAndSignMessages(
    messages: readonly SignableMessage[],
    config?: MessageModifyingSignerConfig,
  ): Promise<readonly SignableMessage[]>
}>

/**
 * Transaction Sending Signer
 *
 * A signer that can sign and send transactions. This matches the @solana/signers
 * TransactionSendingSigner interface for compatibility.
 *
 * Note: This uses a simplified Transaction type. For full Kit integration,
 * this should be replaced with the actual Kit Transaction type.
 *
 * @template TAddress - The address type (defaults to string)
 */
export type TransactionSendingSigner<TAddress extends string = string> = Readonly<{
  /** The address of this signer */
  address: Address<TAddress>

  /**
   * Sign and send transactions
   *
   * @param transactions - Array of transactions to sign and send
   * @param config - Optional configuration
   * @returns Promise resolving to array of transaction signatures
   */
  signAndSendTransactions(
    transactions: readonly any[], // TODO: Replace with actual Kit Transaction type
    config?: TransactionSendingSignerConfig,
  ): Promise<readonly SignatureBytes[]>
}>

/**
 * Type guard to check if a value is a MessageModifyingSigner
 */
export function isMessageModifyingSigner(value: unknown): value is MessageModifyingSigner {
  return (
    typeof value === 'object' &&
    value !== null &&
    'address' in value &&
    'modifyAndSignMessages' in value &&
    typeof (value as any).modifyAndSignMessages === 'function'
  )
}

/**
 * Type guard to check if a value is a TransactionSendingSigner
 */
export function isTransactionSendingSigner(value: unknown): value is TransactionSendingSigner {
  return (
    typeof value === 'object' &&
    value !== null &&
    'address' in value &&
    'signAndSendTransactions' in value &&
    typeof (value as any).signAndSendTransactions === 'function'
  )
}
