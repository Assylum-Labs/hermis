// src/types.ts
import { Adapter, WalletName, WalletReadyState } from '@hermis/solana-headless-core';
import { SolanaMobileWalletAdapter } from '@solana-mobile/wallet-adapter-mobile';

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
export enum Environment {
  DESKTOP_WEB,
  MOBILE_WEB,
}

/**
 * Configuration for environment detection
 */
export interface EnvironmentConfig {
  adapters: Adapter[] | SolanaMobileWalletAdapter[];
  userAgentString: string | null;
}

export interface WalletConnectionManager {
  getAdapter: () => Adapter | null;
  selectWallet: (walletName: WalletName | null) => Adapter | null;
  connect: () => Promise<Adapter | null>;
  disconnect: () => Promise<void>;
  autoConnect: () => Promise<Adapter | null>;
}