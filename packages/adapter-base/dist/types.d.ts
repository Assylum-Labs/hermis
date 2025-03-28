import { Adapter, WalletName, WalletReadyState } from '@hermis/solana-headless-core';
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
export declare enum Environment {
    DESKTOP_WEB = 0,
    MOBILE_WEB = 1
}
/**
 * Configuration for environment detection
 */
export interface EnvironmentConfig {
    adapters: Adapter[];
    userAgentString: string | null;
}
