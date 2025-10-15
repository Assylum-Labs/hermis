/**
 * Core HermisError class and type guard
 *
 * Provides type-safe error creation and handling with rich context
 */

import type { HermisErrorCode } from './codes.js';
import type { HermisErrorContext } from './context.js';
import { formatErrorMessage, formatContext } from './message-formatter.js';

/**
 * Base class for all Hermis SDK errors
 *
 * Features:
 * - Type-safe error codes
 * - Rich context data
 * - Automatic message formatting
 * - Stack trace preservation
 * - Original error chaining
 */
export class HermisError<TCode extends HermisErrorCode = HermisErrorCode> extends Error {
  /** The error code */
  readonly code: TCode;

  /** Context data associated with this error */
  readonly context: HermisErrorContext[TCode];

  /** The original error that caused this error, if any */
  readonly cause?: Error;

  /**
   * Create a new HermisError
   *
   * @param code - The error code
   * @param context - Context data for the error
   * @param cause - Optional original error that caused this error
   */
  constructor(code: TCode, context: HermisErrorContext[TCode], cause?: Error) {
    // Format the error message
    const message = formatErrorMessage(code, context);

    // Call Error constructor
    super(message);

    // Set error properties
    this.name = 'HermisError';
    this.code = code;
    this.context = context;
    this.cause = cause;

    // Maintain proper stack trace (only available in V8 engines like Chrome and Node)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, HermisError);
    }

    // If there's a cause, append its stack trace
    if (cause?.stack) {
      this.stack = `${this.stack}\nCaused by: ${cause.stack}`;
    }
  }

  /**
   * Get a detailed string representation of this error
   * Includes error code, message, and context
   */
  toString(): string {
    const contextStr = formatContext(this.context as Record<string, unknown>);
    const parts = [
      `${this.name} [${this.code}]: ${this.message}`,
      contextStr ? `Context: ${contextStr}` : null,
      this.cause ? `Caused by: ${this.cause.message}` : null,
    ].filter(Boolean);

    return parts.join('\n');
  }

  /**
   * Convert error to a JSON-serializable object
   * Useful for logging and error reporting
   */
  toJSON(): {
    name: string;
    code: TCode;
    message: string;
    context: HermisErrorContext[TCode];
    cause?: string;
    stack?: string;
  } {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
      cause: this.cause?.message,
      stack: this.stack,
    };
  }
}

/**
 * Type guard to check if an error is a HermisError
 *
 * Usage:
 * ```ts
 * try {
 *   await wallet.connect();
 * } catch (error) {
 *   if (isHermisError(error, HERMIS_ERROR__WALLET_CONNECTION__FAILED)) {
 *     // TypeScript knows error.context has walletName, reason, etc.
 *     console.log(`Failed to connect to ${error.context.walletName}`);
 *   }
 * }
 * ```
 *
 * @param error - The error to check
 * @param code - Optional specific error code to check for
 * @returns True if error is a HermisError (with specific code if provided)
 */
export function isHermisError<TCode extends HermisErrorCode>(
  error: unknown,
  code?: TCode
): error is HermisError<TCode> {
  if (!(error instanceof HermisError)) {
    return false;
  }

  // If a specific code is provided, check for exact match
  if (code !== undefined) {
    return error.code === code;
  }

  return true;
}

/**
 * Helper to create a HermisError instance
 *
 * Provides better type inference than using `new HermisError()` directly
 *
 * @param code - The error code
 * @param context - Context data for the error
 * @param cause - Optional original error that caused this error
 * @returns A new HermisError instance
 */
export function createHermisError<TCode extends HermisErrorCode>(
  code: TCode,
  context: HermisErrorContext[TCode],
  cause?: Error
): HermisError<TCode> {
  return new HermisError(code, context, cause);
}

/**
 * Wrap an unknown error in a HermisError
 *
 * Useful for standardizing error handling in catch blocks
 *
 * @param error - The error to wrap
 * @param code - The error code to use for the wrapper
 * @param context - Context data for the wrapper error
 * @returns A HermisError instance
 */
export function wrapError<TCode extends HermisErrorCode>(
  error: unknown,
  code: TCode,
  context: HermisErrorContext[TCode]
): HermisError<TCode> {
  const cause = error instanceof Error ? error : new Error(String(error));
  return new HermisError(code, context, cause);
}
