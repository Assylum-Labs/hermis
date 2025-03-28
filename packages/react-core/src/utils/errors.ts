// src/utils/errors.ts
import { WalletError } from '@hermis/solana-headless-core';

/**
 * Error thrown when no wallet is selected
 */
export class WalletNotSelectedError extends WalletError {
  name = 'WalletNotSelectedError';
  
  constructor(message = 'No wallet selected', error?: any) {
    super(message, error);
  }
}