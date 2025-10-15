/**
 * Message formatting utilities for error messages
 *
 * Handles interpolation of context values into message templates
 * and supports both development and production modes
 */

import type { HermisErrorCode } from './codes.js';
import type { HermisErrorContext } from './context.js';
import { HERMIS_ERROR_MESSAGES } from './messages.js';

/**
 * Development mode flag
 * In production builds, this should be replaced with `false` by the bundler
 */
declare const __DEV__: boolean;

/**
 * Check if we're in development mode
 * Falls back to checking NODE_ENV if __DEV__ is not defined
 */
function isDevelopmentMode(): boolean {
  try {
    return __DEV__;
  } catch {
    return typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production';
  }
}

/**
 * Interpolate context values into a message template
 *
 * Replaces $variableName with the corresponding value from context
 *
 * @param template - Message template with $variable placeholders
 * @param context - Context object containing values to interpolate
 * @returns Formatted message with interpolated values
 */
function interpolateMessage(template: string, context?: Record<string, unknown>): string {
  if (!context) {
    // Remove any remaining $variable placeholders
    return template.replace(/\$\w+/g, '');
  }

  return template.replace(/\$(\w+)/g, (match, variableName) => {
    const value = context[variableName];

    if (value === undefined || value === null) {
      // Keep the placeholder if no value available
      return '';
    }

    // Handle arrays specially
    if (Array.isArray(value)) {
      return value.join(', ');
    }

    // Convert to string
    return String(value);
  });
}

/**
 * Format an error message for a given error code and context
 *
 * In development mode: Returns fully interpolated message
 * In production mode: Returns compact error code reference
 *
 * @param code - The error code
 * @param context - Optional context data for interpolation
 * @returns Formatted error message
 */
export function formatErrorMessage<TCode extends HermisErrorCode>(
  code: TCode,
  context?: HermisErrorContext[TCode]
): string {
  const messageTemplate = HERMIS_ERROR_MESSAGES[code];

  if (!messageTemplate) {
    return `Unknown error code: ${code}`;
  }

  // In development mode, show full interpolated message
  if (isDevelopmentMode()) {
    return interpolateMessage(messageTemplate, context as Record<string, unknown>);
  }

  // In production mode, show compact error code reference
  // Users can decode this using the CLI tool or documentation
  return `Hermis Error ${code}. Decode at: https://hermis.dev/errors/${code}`;
}

/**
 * Get the raw message template for an error code
 * Useful for testing or debugging
 *
 * @param code - The error code
 * @returns Raw message template
 */
export function getErrorMessageTemplate(code: HermisErrorCode): string {
  return HERMIS_ERROR_MESSAGES[code] || `Unknown error code: ${code}`;
}

/**
 * Format context data for logging
 * Converts context object to a readable string
 *
 * @param context - Context data
 * @returns Formatted context string
 */
export function formatContext(context?: Record<string, unknown>): string {
  if (!context || Object.keys(context).length === 0) {
    return '';
  }

  const entries = Object.entries(context)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}: [${value.join(', ')}]`;
      }
      return `${key}: ${value}`;
    });

  return entries.length > 0 ? `{ ${entries.join(', ')} }` : '';
}
