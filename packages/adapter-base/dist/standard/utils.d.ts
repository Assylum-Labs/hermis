import { Adapter } from '@agateh/solana-headless-core';
import { Wallet as StandardWallet } from '@wallet-standard/base';
import { StandardConnectMethod, StandardDisconnectMethod, StandardEventsMethod, SolanaSignAndSendTransactionMethod, SolanaSignTransactionMethod, SolanaSignMessageMethod, SolanaSignInMethod, TypedStandardWallet } from './types.js';
/**
 * Check if a wallet implements the Wallet Standard interface and has required features
 * @param wallet The wallet to check
 * @returns True if the wallet is wallet standard compatible
 */
export declare function isWalletAdapterCompatibleStandardWallet(wallet: StandardWallet): wallet is TypedStandardWallet;
/**
 * Get wallet adapters for all available standard wallets
 * @param existingAdapters Existing (non-standard) adapters to include in result
 * @returns Array of all adapters including standard wallet adapters
 */
export declare function getStandardWalletAdapters(existingAdapters?: Adapter[]): Adapter[];
export { StandardConnectMethod, StandardDisconnectMethod, StandardEventsMethod, SolanaSignAndSendTransactionMethod, SolanaSignTransactionMethod, SolanaSignMessageMethod, SolanaSignInMethod };
