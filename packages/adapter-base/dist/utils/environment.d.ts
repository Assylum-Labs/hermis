import { WalletAdapterNetwork, Adapter } from '@hermis/solana-headless-core';
import { Environment, EnvironmentConfig } from '../types.js';
export declare function getUserAgent(): string | null;
/**
 * Get the URI for app identity
 * @returns The protocol + host URI or undefined
 */
export declare function getUriForAppIdentity(): string | undefined;
/**
 * Check if the device is iOS
 * @param userAgentString The user agent string
 * @returns true if running on iOS device
 */
export declare function isIOS(userAgentString: string): boolean;
/**
 * Check if the device is Android
 * @param userAgentString The user agent string
 * @returns true if running on Android device
 */
export declare function isAndroid(userAgentString: string): boolean;
/**
 * Check if the current device is mobile
 * @param userAgentString User agent string
 * @returns true if it's a mobile device
 */
export declare function isMobileDevice(userAgentString: string): boolean;
/**
 * Determine the current environment (desktop or mobile web)
 * @param config Configuration with adapters and userAgentString
 * @returns The detected environment
 */
export declare function getEnvironment({ adapters, userAgentString }: EnvironmentConfig): Environment;
/**
 * Determine if the current environment is mobile
 * @param adapters Array of wallet adapters
 * @param userAgentString Optional user agent string (for testing)
 * @returns true if the environment is mobile
 */
export declare function getIsMobile(adapters: Adapter[], userAgentString?: string | null): boolean;
/**
 * Check if the user is on iOS and can be redirected
 * @returns true if the user can be redirected
 */
export declare function isIosAndRedirectable(): boolean;
/**
 * Infer Solana cluster from endpoint
 * @param endpoint RPC endpoint URL
 * @returns The inferred cluster/network
 */
export declare function getInferredNetworkFromEndpoint(endpoint?: string): WalletAdapterNetwork;
