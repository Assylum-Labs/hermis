import { WalletAdapterNetwork, Adapter } from '@agateh/solana-headless-core';
import { Environment, EnvironmentConfig } from '../types.js';
export declare function getUserAgent(): string | null;
/**
 * Get the URI for app identity
 * @returns The protocol + host URI or undefined
 */
export declare function getUriForAppIdentity(): string | undefined;
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
 * Infer Solana cluster from endpoint
 * @param endpoint RPC endpoint URL
 * @returns The inferred cluster/network
 */
export declare function getInferredNetworkFromEndpoint(endpoint?: string): WalletAdapterNetwork;
