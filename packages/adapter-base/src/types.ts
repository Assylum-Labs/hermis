// src/types.ts
import { Adapter, WalletName, WalletReadyState } from '@hermis/solana-headless-adapter-base';
import type { DualArchitectureOptions, DualTransaction, DualConnection } from '@hermis/solana-headless-core';

/**
 * Interface for wallet provider information
 */
export interface WalletProvider {
  adapter: Adapter;
  name: WalletName;
  icon: string;
  url: string;
  readyState: WalletReadyState;
}

/**
 * Environment detection enum
 */
// export enum Environment {
//   DESKTOP_WEB,
//   MOBILE_WEB,
// }

/**
 * Configuration for environment detection
 */
// export interface EnvironmentConfig {
//   adapters: (Adapter | SolanaMobileWalletAdapter)[];
//   userAgentString: string | null;
// }

/**
 * Interface for wallet connection manager with dual architecture support
 * Supports both legacy (@solana/web3.js) and Kit (@solana/kit) architectures
 */
export interface WalletConnectionManager {
  getAdapter: () => Adapter | null;
  selectWallet: (walletName: WalletName | null) => Adapter | null;
  connect: () => Promise<Adapter | null>;
  disconnect: () => Promise<void>;
  autoConnect: () => Promise<Adapter | null>;

  /**
   * Sign a transaction (supports both legacy and Kit architectures)
   * @param transaction - The transaction to sign (Transaction, VersionedTransaction, or TransactionMessage)
   * @param options - Optional dual architecture configuration
   * @returns Promise resolving to the signed transaction
   */
  signTransaction<T extends DualTransaction = DualTransaction>(transaction: T, options?: DualArchitectureOptions): Promise<T>;

  /**
   * Sign multiple transactions (supports both legacy and Kit architectures)
   * @param transactions - Array of transactions to sign (all same architecture)
   * @param options - Optional dual architecture configuration
   * @returns Promise resolving to array of signed transactions
   */
  signAllTransactions<T extends DualTransaction = DualTransaction>(transactions: T[], options?: DualArchitectureOptions): Promise<T[]>;

  /**
   * Send a transaction (supports both legacy and Kit architectures)
   * @param connection - The Solana connection (Legacy Connection or Kit Rpc)
   * @param transaction - The transaction to send
   * @param options - Optional dual architecture configuration
   * @returns Promise resolving to transaction signature
   */
  sendTransaction<T extends DualTransaction = DualTransaction>(
    connection: DualConnection,
    transaction: T,
    options?: DualArchitectureOptions
  ): Promise<string>;

  /**
   * Sign and send a transaction in one operation (supports both legacy and Kit architectures)
   * @param connection - The Solana connection (Legacy Connection or Kit Rpc)
   * @param transaction - The transaction to sign and send
   * @param options - Optional dual architecture configuration
   * @returns Promise resolving to transaction signature
   */
  signAndSendTransaction<T extends DualTransaction = DualTransaction>(
    connection: DualConnection,
    transaction: T,
    options?: DualArchitectureOptions
  ): Promise<string>;
}