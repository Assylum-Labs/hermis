/**
 * Utility functions for error handling
 */

/**
 * Detects if an error represents a user rejection
 *
 * This function checks multiple indicators that wallets use to signal user rejection:
 * - Error message keywords (user rejected, denied, cancelled, etc.)
 * - Error codes (4001 = user rejected in EIP-1193 standard)
 * - Error.name properties
 *
 * Supports various wallet implementations:
 * - Standard wallets (Phantom, Solflare, etc.)
 * - Mobile wallets
 * - Browser extension wallets
 * - WalletConnect
 *
 * @param error - The error to check
 * @returns true if the error represents a user rejection, false otherwise
 *
 * @example
 * ```typescript
 * try {
 *   await wallet.signMessage(message);
 * } catch (error) {
 *   if (isUserRejection(error)) {
 *     console.log('User rejected the request');
 *   } else {
 *     console.error('Unexpected error:', error);
 *   }
 * }
 * ```
 */
export function isUserRejection(error: unknown): boolean {
  if (!error) {
    return false;
  }

  // Check error code (EIP-1193 standard: 4001 = user rejected)
  // Also check 4100 (unauthorized) which some wallets use for rejection
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as any;

    if (errorObj.code === 4001 || errorObj.code === 4100) {
      return true;
    }

    // Check error.name property
    const errorName = errorObj.name?.toLowerCase() || '';
    if (
      errorName.includes('userrejected') ||
      errorName.includes('rejected') ||
      errorName.includes('cancelled') ||
      errorName.includes('canceled')
    ) {
      return true;
    }
  }

  // Check error message (fallback for wallets that don't use standard codes)
  const errorMessage = error instanceof Error ? error.message : String(error);
  const messageLower = errorMessage.toLowerCase();

  // Common rejection keywords used by different wallets
  const rejectionKeywords = [
    'user rejected',
    'user denied',
    'user cancelled',
    'user canceled',
    'rejected by user',
    'denied by user',
    'cancelled by user',
    'canceled by user',
    'transaction rejected',
    'signature rejected',
    'request rejected',
    'approval declined',
    'user disapproved',
    'user rejection',
    // Short forms that are specific enough
    'rejected the request',
    'denied the request',
    'cancelled the request',
    'canceled the request',
  ];

  return rejectionKeywords.some(keyword => messageLower.includes(keyword));
}
