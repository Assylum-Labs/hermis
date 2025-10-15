/**
 * @hermis/solana-headless-errors
 *
 * Type-safe error handling system for the Hermis Solana Headless SDK
 *
 * Features:
 * - Numeric error codes (tree-shakeable)
 * - Type-safe context data
 * - Message interpolation
 * - Dev/Prod modes
 * - Error chaining
 * - Type guards
 *
 * @example
 * ```ts
 * import { HermisError, HERMIS_ERROR__WALLET_CONNECTION__FAILED } from '@hermis/solana-headless-errors';
 *
 * throw new HermisError(
 *   HERMIS_ERROR__WALLET_CONNECTION__FAILED,
 *   { walletName: 'Phantom', reason: 'User rejected' }
 * );
 * ```
 *
 * @example Type-safe error handling
 * ```ts
 * import { isHermisError, HERMIS_ERROR__WALLET_CONNECTION__FAILED } from '@hermis/solana-headless-errors';
 *
 * try {
 *   await wallet.connect();
 * } catch (error) {
 *   if (isHermisError(error, HERMIS_ERROR__WALLET_CONNECTION__FAILED)) {
 *     // TypeScript knows error.context has walletName, reason, etc.
 *     console.log(`Failed to connect to ${error.context.walletName}`);
 *   }
 * }
 * ```
 */

// Export all error codes
export * from './codes.js';

// Export context types
export type { HermisErrorContext, DefaultHermisErrorContext } from './context.js';

// Export error class and utilities
export { HermisError, isHermisError, createHermisError, wrapError } from './error.js';

// Export message formatting utilities (useful for custom error handling)
export { formatErrorMessage, getErrorMessageTemplate, formatContext } from './message-formatter.js';

// Export error messages (useful for testing and documentation)
export { HERMIS_ERROR_MESSAGES } from './messages.js';
