import { WalletAdapterNetwork, WalletReadyState } from '@agateh/solana-headless-core';
import { Environment } from '../types.js';
/**
 * Get the current user agent
 * @returns User agent string or null
 */
let _userAgent;
export function getUserAgent() {
    if (_userAgent === undefined) {
        _userAgent = typeof window !== 'undefined' ? window.navigator?.userAgent ?? null : null;
    }
    return _userAgent;
}
/**
 * Get the URI for app identity
 * @returns The protocol + host URI or undefined
 */
export function getUriForAppIdentity() {
    if (typeof window === 'undefined')
        return undefined;
    const location = window.location;
    if (!location)
        return undefined;
    return `${location.protocol}//${location.host}`;
}
/**
 * Check if the user agent string belongs to a WebView
 * @param userAgentString The user agent string to check
 * @returns true if it's a WebView
 */
function isWebView(userAgentString) {
    return /(WebView|Version\/.+(Chrome)\/(\d+)\.(\d+)\.(\d+)\.(\d+)|; wv\).+(Chrome)\/(\d+)\.(\d+)\.(\d+)\.(\d+))/i.test(userAgentString);
}
/**
 * Determine the current environment (desktop or mobile web)
 * @param config Configuration with adapters and userAgentString
 * @returns The detected environment
 */
export function getEnvironment({ adapters, userAgentString }) {
    // Check if any non-mobile wallet adapters are installed
    if (adapters.some(adapter => adapter.name !== 'Mobile Wallet Adapter' &&
        adapter.readyState === WalletReadyState.Installed)) {
        return Environment.DESKTOP_WEB;
    }
    // Check for Android device that's not in a WebView
    if (userAgentString &&
        /android/i.test(userAgentString) &&
        !isWebView(userAgentString)) {
        return Environment.MOBILE_WEB;
    }
    // Default to desktop
    return Environment.DESKTOP_WEB;
}
/**
 * Determine if the current environment is mobile
 * @param adapters Array of wallet adapters
 * @param userAgentString Optional user agent string (for testing)
 * @returns true if the environment is mobile
 */
export function getIsMobile(adapters, userAgentString) {
    return getEnvironment({ adapters, userAgentString: userAgentString || getUserAgent() }) === Environment.MOBILE_WEB;
}
/**
 * Infer Solana cluster from endpoint
 * @param endpoint RPC endpoint URL
 * @returns The inferred cluster/network
 */
export function getInferredNetworkFromEndpoint(endpoint) {
    if (!endpoint) {
        return WalletAdapterNetwork.Mainnet;
    }
    if (/devnet/i.test(endpoint)) {
        return WalletAdapterNetwork.Devnet;
    }
    else if (/testnet/i.test(endpoint)) {
        return WalletAdapterNetwork.Testnet;
    }
    else {
        return WalletAdapterNetwork.Mainnet;
    }
}
