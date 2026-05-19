import { FC, ReactNode, useState, useEffect, useMemo } from 'react';
import { Adapter, WalletAdapterNetwork, WalletError } from '@hermis/solana-headless-core';
import { ContextProvider } from './ContextProvider.js';
import { useStandardWalletAdapters } from '../hooks/useStandardWalletAdapters.js';
import { StorageProviderFactory } from '../hooks/useLocalStorage.js';

/**
 * Convert {@link TWalletAdapterNetwork} (which includes Localnet) into the
 * upstream {@link WalletAdapterNetwork} enum understood by wallet adapters.
 * Localnet is mapped to Devnet for cluster-aware features since wallets do
 * not have a chain identifier for local validators.
 */
export function toWalletAdapterNetwork(network: TWalletAdapterNetwork): WalletAdapterNetwork {
  if (network === TWalletAdapterNetwork.Localnet) {
    return WalletAdapterNetwork.Devnet;
  }
  // Mainnet/Devnet/Testnet share string values with WalletAdapterNetwork.
  return network as unknown as WalletAdapterNetwork;
}

/**
 * Props for the ContextProvider component
 */

export enum TWalletAdapterNetwork {
  Mainnet = "mainnet-beta",
  Devnet = "devnet",
  Testnet = "testnet",
  Localnet = "localnet"
}
export interface HermisWalletProviderProps {
  /** Children components */
  children: ReactNode;
  /** RPC endpoint for Solana connection */
  endpoint: string;
  /** Network to connect to */
  network: TWalletAdapterNetwork;
  /** Whether to automatically connect to the last used wallet */
  autoConnect?: boolean;
  /** Key for storing wallet name in storage */
  storageKey?: string;
  /** Custom storage factory for persisting wallet selection */
  storageFactory?: StorageProviderFactory;
  /** Wallet adapters to use */
  wallets?: Adapter[];
  /** Error handler for wallet errors */
  onError?: (error: WalletError, adapter?: Adapter) => void;
}

/**
 * Complete context provider with default adapters
 * 
 * This component provides a complete setup for Solana wallet functionality
 * with default adapters (Phantom and Solflare) and automatic detection of
 * standard wallets.
 * 
 * @param props ContextProviderProps
 * @returns Provider component
 */
export const HermisProvider = ({
  children,
  endpoint,
  network,
  autoConnect = false,
  storageKey = 'walletName',
  storageFactory,
  wallets = [],
  onError,
}: HermisWalletProviderProps) => {
  const [adapters, setAdapters] = useState<Adapter[]>([]);

  // Identity-stable key over the wallet set. Memoising on `.length` would
  // miss swaps where the array length stays the same but the wallets differ.
  const walletNamesKey = useMemo(
    () => wallets.map(w => w.name).join('|'),
    [wallets],
  );

  useEffect(() => {
    setAdapters([...wallets]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletNamesKey]);

  const allAdapters = useStandardWalletAdapters(adapters, endpoint, toWalletAdapterNetwork(network));

  return (
    <ContextProvider
      adapters={allAdapters}
      rpcEndpoint={endpoint}
      network={network}
      autoConnect={autoConnect}
      storageKey={storageKey}
      storageFactory={storageFactory}
      onError={onError}
    >
      {children}
    </ContextProvider>
  );
};