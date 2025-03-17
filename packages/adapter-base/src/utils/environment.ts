// import { WalletAdapterNetwork, Adapter, WalletReadyState } from '@agateh/solana-headless-core';
// import { Environment, EnvironmentConfig } from '../types.js';

// /**
//  * Get the current user agent
//  * @returns User agent string or null
//  */
// let _userAgent: string | null;
// export function getUserAgent(): string | null {
//   if (_userAgent === undefined) {
//     _userAgent = typeof window !== 'undefined' ? window.navigator?.userAgent ?? null : null;
//   }
//   return _userAgent;
// }

// /**
//  * Get the URI for app identity
//  * @returns The protocol + host URI or undefined
//  */
// export function getUriForAppIdentity(): string | undefined {
//   if (typeof window === 'undefined') return undefined;
//   const location = window.location;
//   if (!location) return undefined;
//   return `${location.protocol}//${location.host}`;
// }

// /**
//  * Check if the user agent string belongs to a WebView
//  * @param userAgentString The user agent string to check
//  * @returns true if it's a WebView
//  */
// function isWebView(userAgentString: string): boolean {
//   return /(WebView|Version\/.+(Chrome)\/(\d+)\.(\d+)\.(\d+)\.(\d+)|; wv\).+(Chrome)\/(\d+)\.(\d+)\.(\d+)\.(\d+))/i.test(
//     userAgentString
//   );
// }

// /**
//  * Determine the current environment (desktop or mobile web)
//  * @param config Configuration with adapters and userAgentString
//  * @returns The detected environment
//  */
// export function getEnvironment({ adapters, userAgentString }: EnvironmentConfig): Environment {
//   // Check if any non-mobile wallet adapters are installed
//   if (
//     adapters.some(
//       adapter => 
//         adapter.name !== 'Mobile Wallet Adapter' && 
//         adapter.readyState === WalletReadyState.Installed
//     )
//   ) {
//     return Environment.DESKTOP_WEB;
//   }
  
//   // Check for Android device that's not in a WebView
//   if (
//     userAgentString &&
//     /android/i.test(userAgentString) &&
//     !isWebView(userAgentString)
//   ) {
//     return Environment.MOBILE_WEB;
//   } 
  
//   // Default to desktop
//   return Environment.DESKTOP_WEB;
// }

// /**
//  * Determine if the current environment is mobile
//  * @param adapters Array of wallet adapters
//  * @param userAgentString Optional user agent string (for testing)
//  * @returns true if the environment is mobile
//  */
// export function getIsMobile(adapters: Adapter[], userAgentString?: string | null): boolean {
//   return getEnvironment({ adapters, userAgentString: userAgentString || getUserAgent() }) === Environment.MOBILE_WEB;
// }

// /**
//  * Infer Solana cluster from endpoint
//  * @param endpoint RPC endpoint URL
//  * @returns The inferred cluster/network
//  */
// export function getInferredNetworkFromEndpoint(endpoint?: string): WalletAdapterNetwork {
//   if (!endpoint) {
//     return WalletAdapterNetwork.Mainnet;
//   }
//   if (/devnet/i.test(endpoint)) {
//     return WalletAdapterNetwork.Devnet;
//   } else if (/testnet/i.test(endpoint)) {
//     return WalletAdapterNetwork.Testnet;
//   } else {
//     return WalletAdapterNetwork.Mainnet;
//   }
// }

import { WalletAdapterNetwork, Adapter, WalletReadyState } from '@agateh/solana-headless-core';
import { Environment, EnvironmentConfig } from '../types.js';
import { SolanaMobileWalletAdapterWalletName } from '../standard/constants.js';

/**
 * Get the current user agent
 * @returns User agent string or null
 */
let _userAgent: string | null;
export function getUserAgent(): string | null {
  if (_userAgent === undefined) {
    _userAgent = typeof window !== 'undefined' ? window.navigator?.userAgent ?? null : null;
  }
  return _userAgent;
}

/**
 * Get the URI for app identity
 * @returns The protocol + host URI or undefined
 */
export function getUriForAppIdentity(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const location = window.location;
  if (!location) return undefined;
  return `${location.protocol}//${location.host}`;
}

/**
 * Check if the user agent string belongs to a WebView
 * @param userAgentString The user agent string to check
 * @returns true if it's a WebView
 */
function isWebView(userAgentString: string): boolean {
  return /(WebView|Version\/.+(Chrome)\/(\d+)\.(\d+)\.(\d+)\.(\d+)|; wv\).+(Chrome)\/(\d+)\.(\d+)\.(\d+)\.(\d+))/i.test(
    userAgentString
  );
}

/**
 * Check if the device is iOS
 * @param userAgentString The user agent string
 * @returns true if running on iOS device
 */
export function isIOS(userAgentString: string): boolean {
  return /iphone|ipad|ipod/i.test(userAgentString);
}

/**
 * Check if the device is Android
 * @param userAgentString The user agent string
 * @returns true if running on Android device
 */
export function isAndroid(userAgentString: string): boolean {
  return /android/i.test(userAgentString);
}

/**
 * Check if the current device is mobile
 * @param userAgentString User agent string
 * @returns true if it's a mobile device
 */
export function isMobileDevice(userAgentString: string): boolean {
  return (isAndroid(userAgentString) || isIOS(userAgentString)) && !isWebView(userAgentString);
}

/**
 * Determine the current environment (desktop or mobile web)
 * @param config Configuration with adapters and userAgentString
 * @returns The detected environment
 */
export function getEnvironment({ adapters, userAgentString }: EnvironmentConfig): Environment {
  // Early check for no user agent (e.g., server-side rendering)
  if (!userAgentString) {
    return Environment.DESKTOP_WEB;
  }

  // First check if we're on a mobile device
  if (isMobileDevice(userAgentString)) {
    return Environment.MOBILE_WEB;
  }
  
  // Check if any non-mobile adapters are installed
  if (
    adapters.some(
      adapter => 
        adapter.name !== SolanaMobileWalletAdapterWalletName && 
        adapter.readyState === WalletReadyState.Installed
    )
  ) {
    return Environment.DESKTOP_WEB;
  }
  
  // Default based on user agent again if we couldn't determine from adapters
  if (isAndroid(userAgentString) || isIOS(userAgentString)) {
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
export function getIsMobile(adapters: Adapter[], userAgentString?: string | null): boolean {
  return getEnvironment({ adapters, userAgentString: userAgentString || getUserAgent() }) === Environment.MOBILE_WEB;
}

/**
 * Check if the user is on iOS and can be redirected
 * @returns true if the user can be redirected
 */
export function isIosAndRedirectable(): boolean {
  // SSR: return false
  if (typeof navigator === 'undefined') return false;

  const userAgent = navigator.userAgent.toLowerCase();

  // if on iOS and not in a webview
  const isIos = userAgent.includes('iphone') || userAgent.includes('ipad');
  
  // if in a webview then it will not include Safari
  // note that other iOS browsers also include Safari
  const isSafari = userAgent.includes('safari');

  return isIos && isSafari;
}

/**
 * Infer Solana cluster from endpoint
 * @param endpoint RPC endpoint URL
 * @returns The inferred cluster/network
 */
export function getInferredNetworkFromEndpoint(endpoint?: string): WalletAdapterNetwork {
  if (!endpoint) {
    return WalletAdapterNetwork.Mainnet;
  }
  if (/devnet/i.test(endpoint)) {
    return WalletAdapterNetwork.Devnet;
  } else if (/testnet/i.test(endpoint)) {
    return WalletAdapterNetwork.Testnet;
  } else {
    return WalletAdapterNetwork.Mainnet;
  }
}