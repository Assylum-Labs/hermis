import { Adapter, WalletAdapterNetwork, WalletReadyState } from '@hermis/solana-headless-core';
import { Wallet as StandardWallet } from '@wallet-standard/base';
import { 
  StandardConnectMethod,
  StandardDisconnectMethod,
  StandardEventsMethod,
  SolanaSignAndSendTransactionMethod,
  SolanaSignTransactionMethod,
  SolanaSignMessageMethod,
  SolanaSignInMethod,
  TypedStandardWallet
} from './types.js';
import { getEnvironment, getUriForAppIdentity, getUserAgent, getInferredNetworkFromEndpoint } from '../utils/environment.js';
import { SolanaMobileWalletAdapterWalletName } from './constants.js';

import { 
  SolanaMobileWalletAdapter,
  createDefaultAuthorizationResultCache,
  createDefaultWalletNotFoundHandler
} from '@solana-mobile/wallet-adapter-mobile'

/**
 * Check if a wallet implements the Wallet Standard interface and has required features
 * @param wallet The wallet to check
 * @returns True if the wallet is wallet standard compatible
 */
export function isWalletAdapterCompatibleStandardWallet(
  wallet: StandardWallet
): wallet is TypedStandardWallet {
  if (!wallet || !wallet.features) return false;

  return (
    // Must have standard:connect feature
    StandardConnectMethod in wallet.features &&
    // Must have standard:events feature
    StandardEventsMethod in wallet.features &&
    // Must have either solana:signAndSendTransaction OR solana:signTransaction feature
    (SolanaSignAndSendTransactionMethod in wallet.features || 
     SolanaSignTransactionMethod in wallet.features)
  );
}

/**
 * Create a Mobile Wallet Adapter
 * @param endpoint Optional RPC endpoint
 * @returns Mobile wallet adapter or null if not available
 */
export async function createMobileWalletAdapter(endpoint?: string): Promise<Adapter | SolanaMobileWalletAdapter | null> {
    // Skip if not in browser environment
    if (typeof window === 'undefined' || !window.navigator) {
      console.log('not in a browser');
      return null;
    }
    
    // Try to import the mobile wallet adapter
    // let SolanaMobileWalletAdapterState;
    const { 
      SolanaMobileWalletAdapter,
  } = await import( '@solana-mobile/wallet-adapter-mobile')
    try {
      console.log(SolanaMobileWalletAdapter);
    //   SolanaMobileWalletAdapterState = SolanaMobileWalletAdapter;
    } catch (error) {
      console.warn('Mobile wallet adapter not available:', error);
      console.log('null returned');
      return null;
    }
    
    // Check if adapter class was found
    if (!SolanaMobileWalletAdapter) {
      console.log('null returned');
      return null;
    }
    
    // Try to create the adapter
    try {
      console.log('Mobile wallet');
      const network = getInferredNetworkFromEndpoint(endpoint);

    //   const { 
    //     SolanaMobileWalletAdapter,
    //     createDefaultAuthorizationResultCache,
    //     createDefaultWalletNotFoundHandler
    // } = await import( '@solana-mobile/wallet-adapter-mobile')
      
      const adapter = new SolanaMobileWalletAdapter({
        addressSelector: {
          select: (addresses: string[]) => Promise.resolve(addresses[0]),
        //   resolveImmediately: true,
        },
        appIdentity: {
          name: document.title || 'Solana dApp',
          uri: getUriForAppIdentity() || window.location.href,
        },
        authorizationResultCache: createDefaultAuthorizationResultCache(),
        cluster: network,
        onWalletNotFound: createDefaultWalletNotFoundHandler(),
      });
      
      return adapter;
    } catch (error) {
      console.warn('Error creating mobile wallet adapter:', error);
      console.log('null returned');
      return null;
    }
  }

/**
 * Get wallet adapters for all available standard wallets
 * @param existingAdapters Existing (non-standard) adapters to include in result
 * @param endpoint Optional endpoint for mobile wallet adapter
 * @returns Array of all adapters including standard wallet adapters
 */
export async function getStandardWalletAdapters(existingAdapters: Adapter[] | SolanaMobileWalletAdapter[] = [], endpoint?: string): Promise<(Adapter | SolanaMobileWalletAdapter)[]> {
  // Skip if not in browser environment
  if (typeof window === 'undefined' || !window.navigator) {
    return existingAdapters;
  }
  

  // Initialize wallet detection system
  initializeWalletDetection();
  
  const userAgentString = getUserAgent();
  let adaptersToUse = [...existingAdapters];
  
  try {
    // Check if we're in a mobile environment
    const isMobileEnv = getEnvironment({
      adapters: existingAdapters,
      userAgentString
    }) === Environment.MOBILE_WEB;
    
    // Check if mobile wallet adapter is already included
    const hasMobileWalletAdapter = existingAdapters.some(
      adapter => adapter.name === SolanaMobileWalletAdapterWalletName
    );
    
    // Add mobile wallet adapter if in mobile environment and not already included
    if (isMobileEnv && !hasMobileWalletAdapter) {
      console.log("Created Mobile Adapter");
      
      const mobileAdapter = await createMobileWalletAdapter(endpoint);
      
      if (mobileAdapter) {
        // Add at the beginning for priority
        adaptersToUse.unshift(mobileAdapter);
      }
    }
    
    // Get detected wallets merged with existing adapters
    // This will automatically include any detected standard wallets
    adaptersToUse = getDetectedWalletAdapters(adaptersToUse as Adapter[]);

    return adaptersToUse;
  } catch (error) {
    console.error('Error getting standard wallets:', error);
    return adaptersToUse;
  }
}

export function isMobileWalletAdapter(adapter: any): adapter is SolanaMobileWalletAdapter {
  return adapter && 'findWallets' in adapter;
}

// Import these from types.js to avoid circular dependencies
import { Environment } from '../types.js';
import { createStandardWalletAdapter } from './adapter-factory.js';
import { getDetectedWalletAdapters, initializeWalletDetection } from './wallet-detection.js';

// Re-export constants
export {
  StandardConnectMethod,
  StandardDisconnectMethod,
  StandardEventsMethod,
  SolanaSignAndSendTransactionMethod,
  SolanaSignTransactionMethod,
  SolanaSignMessageMethod,
  SolanaSignInMethod
};