import { Wallet, WalletIcon, WalletAccount, IdentifierArray } from "@wallet-standard/base";
import { Adapter } from '@solana/wallet-adapter-base';
import { SolanaMobileWalletAdapter } from '@solana-mobile/wallet-adapter-mobile';

// Re-export all standard wallet types from core
export * from '@hermis/solana-headless-core';

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
  adapters: any[]; // Use any[] to allow for different adapter types including SolanaMobileWalletAdapter
  userAgentString: string | null;
}

