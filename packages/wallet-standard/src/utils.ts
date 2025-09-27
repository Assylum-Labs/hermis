import { Adapter, WalletAdapterNetwork, WalletReadyState } from '@hermis/solana-headless-adapter-base';
import { PublicKey } from '@solana/web3.js';
// import { Wallet as StandardWallet } from '@wallet-standard/base';
import { 
  StandardConnectMethod,
  StandardDisconnectMethod,
  StandardEventsMethod,
  SolanaSignAndSendTransactionMethod,
  SolanaSignTransactionMethod,
  SolanaSignMessageMethod,
  SolanaSignInMethod,
  TypedStandardWallet,
  StandardWalletAccount,
  UiWallet,
  UiWalletAccount,
  toUiWallet,
  toUiWalletAccount,
} from './types.js';
import { getEnvironment, getUriForAppIdentity, getUserAgent, getInferredNetworkFromEndpoint } from './environment.js';
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
import { Environment } from './types.js';
// import { createStandardWalletAdapter } from './adapter-factory.js';
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

/**
 * Validate a wallet account has required Solana features
 */
export function isValidSolanaAccount(account: StandardWalletAccount): boolean {
  if (!account) return false;
  
  // Check for public key
  if (!account.publicKey || !(account.publicKey instanceof Uint8Array) || account.publicKey.length === 0) {
    return false;
  }
  
  // Try to create a PublicKey to validate it
  try {
    new PublicKey(account.publicKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the best available Solana account from a list of accounts
 */
export function getBestSolanaAccount(accounts: StandardWalletAccount[]): StandardWalletAccount | null {
  if (!accounts || accounts.length === 0) return null;
  
  // First, try to find an account with explicit Solana features
  let account = accounts.find(
    acc => acc && acc.features && 
    Array.isArray(acc.features) && 
    acc.features.includes('solana:publicKey')
  );
  
  // If not found, try to find any valid Solana account
  if (!account) {
    account = accounts.find(acc => isValidSolanaAccount(acc));
  }
  
  return account || null;
}

/**
 * Convert adapter to UI wallet representation
 */
export function adapterToUiWallet(adapter: Adapter): UiWallet | null {
  if (!adapter) return null;
  
  const uiWallet: UiWallet = {
    name: adapter.name,
    icon: adapter.icon || '',
    chains: ['solana:mainnet-beta', 'solana:devnet', 'solana:testnet'],
    features: [],
    accounts: [],
    website: adapter.url || undefined
  };
  
  // Add features based on adapter capabilities
  if ('connect' in adapter) uiWallet.features.push(StandardConnectMethod);
  if ('disconnect' in adapter) uiWallet.features.push(StandardDisconnectMethod);
  if ('signTransaction' in adapter) uiWallet.features.push(SolanaSignTransactionMethod);
  if ('signAllTransactions' in adapter) uiWallet.features.push(SolanaSignTransactionMethod);
  if ('signMessage' in adapter) uiWallet.features.push(SolanaSignMessageMethod);
  if ('signIn' in adapter) uiWallet.features.push(SolanaSignInMethod);
  
  // Add connected account if available
  if (adapter.publicKey) {
    const account: UiWalletAccount = {
      address: adapter.publicKey.toBase58(),
      publicKey: adapter.publicKey.toBytes(),
      chains: ['solana:mainnet-beta', 'solana:devnet', 'solana:testnet'],
      features: ['solana:publicKey']
    };
    uiWallet.accounts.push(account);
  }
  
  return uiWallet;
}

/**
 * Check if wallet supports a specific feature
 */
export function walletSupportsFeature(wallet: TypedStandardWallet, feature: string): boolean {
  return wallet && wallet.features && feature in wallet.features;
}

/**
 * Get supported transaction versions from wallet
 */
export function getWalletTransactionVersions(wallet: TypedStandardWallet): Set<number> | null {
  if (!wallet || !wallet.features) return null;
  
  // Check sign transaction feature
  if (SolanaSignTransactionMethod in wallet.features) {
    const feature = wallet.features[SolanaSignTransactionMethod];
    if (feature && 'supportedTransactionVersions' in feature) {
      const versions = (feature as any).supportedTransactionVersions;
      if (Array.isArray(versions)) {
        return new Set(versions);
      }
    }
  }
  
  // Check sign and send transaction feature
  if (SolanaSignAndSendTransactionMethod in wallet.features) {
    const feature = wallet.features[SolanaSignAndSendTransactionMethod];
    if (feature && 'supportedTransactionVersions' in feature) {
      const versions = (feature as any).supportedTransactionVersions;
      if (Array.isArray(versions)) {
        return new Set(versions);
      }
    }
  }
  
  return null;
}

/**
 * Create a wallet ready state from adapter
 */
export function getWalletReadyState(adapter: Adapter): WalletReadyState {
  if (!adapter) return WalletReadyState.NotDetected;
  
  if ('readyState' in adapter) {
    return adapter.readyState;
  }
  
  // Default to installed for standard wallets
  return WalletReadyState.Installed;
}

/**
 * Safely dispose an adapter
 */
export function disposeAdapter(adapter: Adapter | any): void {
  if (!adapter) return;
  
  try {
    // Call dispose if available
    if (typeof adapter.dispose === 'function') {
      adapter.dispose();
    }
    
    // Remove all listeners if available
    if (typeof adapter.removeAllListeners === 'function') {
      adapter.removeAllListeners();
    }
    
    // Disconnect if connected
    if (adapter.connected && typeof adapter.disconnect === 'function') {
      adapter.disconnect().catch((error: any) => {
        console.warn('[Utils] Error disconnecting adapter during disposal:', error);
      });
    }
  } catch (error) {
    console.error('[Utils] Error disposing adapter:', error);
  }
}

/**
 * Create a unique identifier for a wallet
 */
export function getWalletIdentifier(wallet: TypedStandardWallet | Adapter): string {
  if ('name' in wallet) {
    return wallet.name;
  }
  return 'unknown-wallet';
}

/**
 * Check if two wallets are the same
 */
export function isSameWallet(wallet1: TypedStandardWallet | Adapter, wallet2: TypedStandardWallet | Adapter): boolean {
  return getWalletIdentifier(wallet1) === getWalletIdentifier(wallet2);
}

/**
 * Detect cluster/network from RPC endpoint
 */
export function detectClusterFromEndpoint(endpoint: string): string {
  const url = endpoint.toLowerCase();
  
  if (url.includes('mainnet') || url.includes('api.solana.com')) {
    return 'mainnet-beta';
  } else if (url.includes('devnet')) {
    return 'devnet';
  } else if (url.includes('testnet')) {
    return 'testnet';
  } else if (url.includes('localhost') || url.includes('127.0.0.1')) {
    return 'localnet';
  }
  
  return 'unknown';
}

/**
 * Get cluster identifier for wallet standard
 */
export function getClusterIdentifier(cluster: string): string {
  switch (cluster) {
    case 'mainnet-beta':
      return 'solana:mainnet-beta';
    case 'devnet':
      return 'solana:devnet';
    case 'testnet':
      return 'solana:testnet';
    case 'localnet':
      return 'solana:localnet';
    default:
      return `solana:${cluster}`;
  }
}

/**
 * Check if wallet account supports a specific cluster
 */
export function walletSupportsCluster(account: StandardWalletAccount, cluster: string): boolean {
  if (!account.chains || account.chains.length === 0) {
    // If no chains specified, assume it supports all
    return true;
  }
  
  const clusterIdentifier = getClusterIdentifier(cluster);
  return account.chains.includes(clusterIdentifier);
}

/**
 * Validate account exists on cluster using connection
 */
export async function validateAccountOnCluster(
  connection: any, // Connection from @solana/web3.js
  publicKey: PublicKey,
  cluster: string
): Promise<{ exists: boolean; balance?: number; error?: string }> {
  try {
    const accountInfo = await connection.getAccountInfo(publicKey);
    
    if (!accountInfo) {
      return {
        exists: false,
        error: `Account does not exist on ${cluster}. This wallet may not have been used on this network yet.`
      };
    }
    
    const balance = await connection.getBalance(publicKey);
    return {
      exists: true,
      balance: balance / 1000000000 // Convert lamports to SOL
    };
  } catch (error: any) {
    return {
      exists: false,
      error: `Failed to validate account on ${cluster}: ${error.message || 'Unknown error'}`
    };
  }
}

/**
 * Create cluster mismatch error with helpful message
 */
export class ClusterMismatchError extends Error {
  public readonly cluster: string;
  public readonly expectedCluster?: string;
  public readonly accountExists: boolean;

  constructor(
    message: string,
    cluster: string,
    expectedCluster?: string,
    accountExists: boolean = false
  ) {
    super(message);
    this.name = 'ClusterMismatchError';
    this.cluster = cluster;
    this.expectedCluster = expectedCluster;
    this.accountExists = accountExists;
  }

  static createAccountNotFoundError(cluster: string, publicKey: string): ClusterMismatchError {
    const message = `Account ${publicKey} does not exist on ${cluster}. ` +
      `This usually means the wallet hasn't been used on this network yet. ` +
      `Try switching to a different network or use a wallet that has been active on ${cluster}.`;
    
    return new ClusterMismatchError(message, cluster, undefined, false);
  }

  static createTransactionError(cluster: string, publicKey: string): ClusterMismatchError {
    const message = `Transaction failed on ${cluster} - account ${publicKey} may not exist on this network. ` +
      `Please ensure your wallet has been used on ${cluster} before attempting transactions.`;
    
    return new ClusterMismatchError(message, cluster, undefined, false);
  }
}

// Re-export utility functions from types
export { toUiWallet, toUiWalletAccount, isWalletAdapterCompatibleStandardWallet } from './types.js';