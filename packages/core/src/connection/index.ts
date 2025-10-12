import { Connection, ConnectionConfig, Commitment } from '@solana/web3.js';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { createSolanaRpc, type Rpc } from '@solana/kit';

// Network endpoints mapping
const NETWORK_ENDPOINTS: Record<WalletAdapterNetwork, string> = {
  [WalletAdapterNetwork.Mainnet]: 'https://api.mainnet-beta.solana.com',
  [WalletAdapterNetwork.Testnet]: 'https://api.testnet.solana.com',
  [WalletAdapterNetwork.Devnet]: 'https://api.devnet.solana.com',
};

// Default connection config
const DEFAULT_CONNECTION_CONFIG: ConnectionConfig = {
  commitment: 'confirmed',
  confirmTransactionInitialTimeout: 60000, // 1 minute
};

/**
 * Creates a new Solana connection for the specified network or RPC URL
 * @param networkOrUrl The Solana network or RPC URL to connect to
 * @param commitmentOrConfig Optional commitment level or connection configuration
 * @returns A Connection instance
 */
export function createConnection(
  networkOrUrl: WalletAdapterNetwork | string,
  commitmentOrConfig?: Commitment | ConnectionConfig
): Connection {
  let endpoint: string;
  
  // Determine if the input is a network enum or direct URL
  if (Object.values(WalletAdapterNetwork).includes(networkOrUrl as WalletAdapterNetwork)) {
    // It's a network enum
    endpoint = NETWORK_ENDPOINTS[networkOrUrl as WalletAdapterNetwork];
  } else {
    // It's a direct URL
    endpoint = networkOrUrl as string;
  }
  
  // Prepare the connection config
  let connectionConfig: ConnectionConfig;
  
  if (!commitmentOrConfig) {
    // Use default config if none provided
    connectionConfig = DEFAULT_CONNECTION_CONFIG;
  } else if (typeof commitmentOrConfig === 'string') {
    // If only commitment is provided
    connectionConfig = {
      ...DEFAULT_CONNECTION_CONFIG,
      commitment: commitmentOrConfig,
    };
  } else {
    // If full config is provided
    connectionConfig = {
      ...DEFAULT_CONNECTION_CONFIG,
      ...commitmentOrConfig,
    };
  }
  
  // Create and return the connection
  return new Connection(endpoint, connectionConfig);
}

/**
 * Creates a new Kit Rpc connection for the specified network or RPC URL
 * @param networkOrUrl The Solana network or RPC URL to connect to
 * @returns A Kit Rpc instance
 */
export function createKitRpc(
  networkOrUrl: WalletAdapterNetwork | string
): ReturnType<typeof createSolanaRpc> {
  let endpoint: string;

  // Determine if the input is a network enum or direct URL
  if (Object.values(WalletAdapterNetwork).includes(networkOrUrl as WalletAdapterNetwork)) {
    // It's a network enum
    endpoint = NETWORK_ENDPOINTS[networkOrUrl as WalletAdapterNetwork];
  } else {
    // It's a direct URL
    endpoint = networkOrUrl as string;
  }

  // Create and return the Kit Rpc
  return createSolanaRpc(endpoint);
}

// Export connection helper utilities
export * from './helpers.js';