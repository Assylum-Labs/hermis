// src/utils/errors.ts
import {
  HermisError,
  HERMIS_ERROR__WALLET_CONNECTION__NO_WALLET_SELECTED
} from '@hermis/errors';

/**
 * Error thrown when no wallet is selected
 * @deprecated Use HermisError with HERMIS_ERROR__WALLET_CONNECTION__NO_WALLET_SELECTED instead
 */
export class WalletNotSelectedError extends HermisError {
  name = 'WalletNotSelectedError';

  constructor(message = 'No wallet selected', error?: Error) {
    super(
      HERMIS_ERROR__WALLET_CONNECTION__NO_WALLET_SELECTED,
      {},
      error
    );
  }
}

// Re-export commonly used error types and codes for convenience
export {
  HermisError,
  isHermisError,
  HERMIS_ERROR__WALLET_CONNECTION__NO_WALLET_SELECTED,
  HERMIS_ERROR__WALLET_CONNECTION__NOT_CONNECTED,
  HERMIS_ERROR__TRANSACTION__SEND_FAILED,
  HERMIS_ERROR__SIGNING__MESSAGE_FAILED
} from '@hermis/errors';