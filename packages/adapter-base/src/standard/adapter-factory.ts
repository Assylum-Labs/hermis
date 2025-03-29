import { TypedStandardWallet } from './types.js';
import { StandardWalletAdapter } from './wallet-adapter.js';

export function createStandardWalletAdapter(wallet: TypedStandardWallet) {
  return new StandardWalletAdapter(wallet);
}