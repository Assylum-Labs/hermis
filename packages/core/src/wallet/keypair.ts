import { Keypair } from '@solana/web3.js';

/**
 * Creates a new Solana wallet (keypair)
 * @returns A new Keypair instance
 */
export function createWallet(): Keypair {
  return Keypair.generate();
}

/**
 * Imports a wallet from a secret key
 * @param secretKey The secret key as a Uint8Array
 * @returns A Keypair instance
 */
export function importWallet(secretKey: Uint8Array): Keypair {
  return Keypair.fromSecretKey(secretKey);
}

/**
 * Exports a wallet to its secret key
 * @param wallet The wallet to export
 * @returns The secret key as a Uint8Array
 */
export function exportWallet(wallet: Keypair): Uint8Array {
  return wallet.secretKey;
}