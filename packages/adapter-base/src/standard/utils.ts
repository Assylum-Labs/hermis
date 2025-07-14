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
} from './types.js';
import { getEnvironment, getUriForAppIdentity, getUserAgent, getInferredNetworkFromEndpoint } from '../utils/environment.js';
import { SolanaMobileWalletAdapterWalletName } from './constants.js';

import { 
  SolanaMobileWalletAdapter,
  createDefaultAuthorizationResultCache,
  createDefaultWalletNotFoundHandler
} from '@solana-mobile/wallet-adapter-mobile'

// isWalletAdapterCompatibleStandardWallet is imported from types.js

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
    //   } = await import( '@solana-mobile/wallet-adapter-mobile')
      
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

// Global state for wallet detection
let isWalletDetectionInitialized = false;

// Store for current adapters - this will be updated when wallets are detected
let currentAdapters: (Adapter | SolanaMobileWalletAdapter)[] = [];

// Store for callbacks that want to be notified of adapter changes
const updateCallbacks = new Set<(adapters: (Adapter | SolanaMobileWalletAdapter)[]) => void>();

// Store for existing adapters from different consumers
const existingAdaptersStore = new Map<string, { adapters: (Adapter | SolanaMobileWalletAdapter)[], endpoint?: string }>();

/**
 * Generate a unique key for a consumer based on their adapters
 */
function generateConsumerKey(adapters: (Adapter | SolanaMobileWalletAdapter)[], endpoint?: string): string {
  const adapterNames = adapters.map(a => a.name).sort().join(',');
  return `${adapterNames}:${endpoint || 'default'}`;
}

/**
 * Get all unique existing adapters from all consumers
 */
function getAllExistingAdapters(): (Adapter | SolanaMobileWalletAdapter)[] {
  const allAdapters = new Map<string, Adapter | SolanaMobileWalletAdapter>();
  
  for (const { adapters } of existingAdaptersStore.values()) {
    for (const adapter of adapters) {
      allAdapters.set(adapter.name, adapter);
    }
  }
  
  return Array.from(allAdapters.values());
}

/**
 * Subscribe to adapter changes
 * @param callback Function to call when adapters change
 * @returns Unsubscribe function
 */
function subscribeToAdapterChanges(callback: (adapters: (Adapter | SolanaMobileWalletAdapter)[]) => void): () => void {
  updateCallbacks.add(callback);
  return () => {
    updateCallbacks.delete(callback);
  };
}

/**
 * Public function to subscribe to adapter changes
 * This allows React components to listen for dynamic wallet registration
 * @param callback Function to call when adapters change
 * @returns Unsubscribe function
 */
export function subscribeToWalletAdapterChanges(callback: (adapters: (Adapter | SolanaMobileWalletAdapter)[]) => void): () => void {
  return subscribeToAdapterChanges(callback);
}

/**
 * Notify all subscribers of adapter changes
 */
function notifyAdapterChanges() {
  updateCallbacks.forEach(callback => {
    try {
      callback([...currentAdapters]);
    } catch (error) {
      console.error('Error in adapter change callback:', error);
    }
  });
}

/**
 * Update the current adapters list and notify subscribers
 */
async function updateAdapters(consumerKey?: string) {
  try {
    // Get all existing adapters from all consumers
    const allExistingAdapters = getAllExistingAdapters();
    
    // Determine endpoint - use the first available endpoint
    let endpoint: string | undefined;
    for (const { endpoint: consumerEndpoint } of existingAdaptersStore.values()) {
      if (consumerEndpoint) {
        endpoint = consumerEndpoint;
        break;
      }
    }
    
    const userAgentString = getUserAgent();
    let adaptersToUse = [...allExistingAdapters];
    
    // Check if we're in a mobile environment
    const isMobileEnv = getEnvironment({
      adapters: allExistingAdapters,
      userAgentString
    }) === Environment.MOBILE_WEB;
    
    // Check if mobile wallet adapter is already included
    const hasMobileWalletAdapter = allExistingAdapters.some(
      adapter => adapter.name === SolanaMobileWalletAdapterWalletName
    );
    
    // Separate mobile wallet adapter from regular adapters
    const regularAdapters = allExistingAdapters.filter(adapter => 
      adapter.name !== SolanaMobileWalletAdapterWalletName
    ) as Adapter[];
    
    let mobileAdapter: SolanaMobileWalletAdapter | null = null;
    
    // Add mobile wallet adapter if in mobile environment and not already included
    if (isMobileEnv && !hasMobileWalletAdapter) {
      console.log("Created Mobile Adapter");
      
      const createdMobileAdapter = await createMobileWalletAdapter(endpoint);
      
      if (createdMobileAdapter && isMobileWalletAdapter(createdMobileAdapter)) {
        mobileAdapter = createdMobileAdapter;
      }
    } else if (hasMobileWalletAdapter) {
      // Find existing mobile adapter
      const existingMobileAdapter = allExistingAdapters.find(adapter => 
        adapter.name === SolanaMobileWalletAdapterWalletName
      );
      if (existingMobileAdapter && isMobileWalletAdapter(existingMobileAdapter)) {
        mobileAdapter = existingMobileAdapter;
      }
    }
    
    // Get detected wallets merged with regular adapters only
    const mergedRegularAdapters = getDetectedWalletAdapters(regularAdapters);

    // Combine all adapters: mobile adapter first (if exists), then regular adapters
    adaptersToUse = mobileAdapter ? [mobileAdapter, ...mergedRegularAdapters] : mergedRegularAdapters;

    // Update current adapters if they've changed
    const hasChanged = currentAdapters.length !== adaptersToUse.length || 
      !currentAdapters.every((adapter, index) => adapter.name === adaptersToUse[index]?.name);
    
    if (hasChanged) {
      currentAdapters = adaptersToUse;
      notifyAdapterChanges();
    }

    return adaptersToUse;
  } catch (error) {
    console.error('Error updating adapters:', error);
    return getAllExistingAdapters();
  }
}

/**
 * Get wallet adapters for all available standard wallets
 * This function now handles initialization and change detection automatically
 * @param existingAdapters Existing (non-standard) adapters to include in result
 * @param endpoint Optional endpoint for mobile wallet adapter
 * @returns Array of all adapters including standard wallet adapters
 */
export async function getStandardWalletAdapters(
  existingAdapters: (Adapter | SolanaMobileWalletAdapter)[] = [], 
  endpoint?: string
): Promise<(Adapter | SolanaMobileWalletAdapter)[]> {
  // Skip if not in browser environment
  if (typeof window === 'undefined' || !window.navigator) {
    return existingAdapters;
  }

  // Generate a unique key for this consumer
  const consumerKey = generateConsumerKey(existingAdapters, endpoint);
  
  // Store the existing adapters for this consumer
  existingAdaptersStore.set(consumerKey, { adapters: existingAdapters, endpoint });

  // Initialize wallet detection system only once
  if (!isWalletDetectionInitialized) {
    initializeWalletDetection();
    isWalletDetectionInitialized = true;

    // Set up wallet registry change listener to update adapters
    addWalletRegistryChangeListener(async () => {
      await updateAdapters();
    });
  }

  // Update and return adapters
  return await updateAdapters(consumerKey);
}

export function isMobileWalletAdapter(adapter: any): adapter is SolanaMobileWalletAdapter {
  return adapter && 'findWallets' in adapter;
}

// Import these from types.js to avoid circular dependencies
import { Environment } from '../types.js';
import { createStandardWalletAdapter } from './adapter-factory.js';
import { getDetectedWalletAdapters, initializeWalletDetection, addWalletRegistryChangeListener } from './wallet-detection.js';

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