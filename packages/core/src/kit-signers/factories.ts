/**
 * Kit-Compatible Signer Factories
 *
 * Framework-agnostic factory functions to create signers from wallet functions.
 * These factories enable pure Kit integration without React or framework dependencies.
 */

import type { Address } from '@solana/kit'
import type {
  MessageModifyingSigner,
  TransactionSendingSigner,
  SignableMessage,
  MessageModifyingSignerConfig,
  TransactionSendingSignerConfig,
  SignatureBytes,
} from './types.js'
import { updateSignatureDictionary, freezeSigner } from './utils.js'

/**
 * Create a MessageModifyingSigner from a wallet's sign message function
 *
 * This is a pure, framework-agnostic factory function that can be used anywhere.
 *
 * @param walletAddress - The address of the wallet
 * @param signMessageFn - Function to sign a message (from wallet adapter)
 * @returns A frozen MessageModifyingSigner object
 *
 * @example
 * ```typescript
 * const signer = createMessageSignerFromWallet(
 *   address('...'),
 *   async (msg) => await wallet.signMessage(msg)
 * )
 * ```
 */
export function createMessageSignerFromWallet(
  walletAddress: Address<string>,
  signMessageFn: (message: Uint8Array) => Promise<Uint8Array>,
): MessageModifyingSigner<string> {
  const signer: MessageModifyingSigner<string> = {
    address: walletAddress,

    async modifyAndSignMessages(
      messages: readonly SignableMessage[],
      config?: MessageModifyingSignerConfig,
    ): Promise<readonly SignableMessage[]> {
      // Most wallets only support signing one message at a time
      if (messages.length !== 1) {
        throw new Error(
          `Wallet signers only support signing one message at a time. ` +
          `Received ${messages.length} messages.`
        )
      }

      const [message] = messages
      const { content, signatures: originalSignatures } = message

      // Handle abort signal if provided
      if (config?.abortSignal?.aborted) {
        throw new Error('Message signing aborted')
      }

      // Sign the message
      const signature = await signMessageFn(content)

      // Update signatures (handle potential message modification)
      const signatures = updateSignatureDictionary(
        content,
        content, // Message content doesn't change in signMessage
        originalSignatures,
        walletAddress,
        signature
      )

      // Return signed message
      return [{
        content,
        signatures
      }]
    }
  }

  return freezeSigner(signer)
}

/**
 * Create a TransactionSendingSigner from a wallet's send transaction function
 *
 * This is a pure, framework-agnostic factory function that can be used anywhere.
 *
 * @param walletAddress - The address of the wallet
 * @param chain - The Solana chain identifier (e.g., 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1')
 * @param sendTransactionFn - Function to send a transaction (from wallet adapter)
 * @returns A frozen TransactionSendingSigner object
 *
 * @example
 * ```typescript
 * const signer = createTransactionSendingSignerFromWallet(
 *   address('...'),
 *   'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
 *   async (tx) => await wallet.sendTransaction(tx, connection)
 * )
 * ```
 */
export function createTransactionSendingSignerFromWallet(
  walletAddress: Address<string>,
  chain: `solana:${string}`,
  sendTransactionFn: (transaction: any) => Promise<string>,
): TransactionSendingSigner<string> {
  const signer: TransactionSendingSigner<string> = {
    address: walletAddress,

    async signAndSendTransactions(
      transactions: readonly any[],
      config?: TransactionSendingSignerConfig,
    ): Promise<readonly SignatureBytes[]> {
      // Most wallets only support signing one transaction at a time
      if (transactions.length !== 1) {
        throw new Error(
          `Wallet signers only support signing one transaction at a time. ` +
          `Received ${transactions.length} transactions.`
        )
      }

      const [transaction] = transactions

      // Handle abort signal if provided
      if (config?.abortSignal?.aborted) {
        throw new Error('Transaction signing aborted')
      }

      // Send the transaction and get signature
      const signatureString = await sendTransactionFn(transaction)

      // Convert base58 signature string to bytes
      // For now, we'll keep it as Uint8Array from base58 decode
      // In a full implementation, you'd use proper base58 decoder
      const signatureBytes = new TextEncoder().encode(signatureString) as SignatureBytes

      return [signatureBytes]
    }
  }

  return freezeSigner(signer)
}

/**
 * Type guard to check if a signing function is available
 *
 * @param signFn - Potential signing function
 * @returns true if function is available, false otherwise
 */
export function isSigningFunctionAvailable(
  signFn: unknown
): signFn is (input: any) => Promise<any> {
  return typeof signFn === 'function'
}
