import React, { ReactNode, useCallback, useEffect, useMemo, useRef } from 'react';
import { Adapter, signAllTransactions, signIn, signMessage, signTransaction, WalletError, WalletName } from '@agateh/solana-headless-core';
import { 
  getIsMobile, 
  SolanaMobileWalletAdapterWalletName 
} from '@agateh/solana-headless-adapter-base';
import { useStandardWalletAdapters } from '../hooks/useStandardWalletAdapters.js';
import { useConnection } from '../hooks/useConnection.js';
import { useLocalStorage, StorageProviderFactory } from '../hooks/useLocalStorage.js';
import { WalletContext } from '../hooks/useWallet.js';
import { WalletNotSelectedError } from '../utils/errors.js';

/**
 * Props for the WalletProvider component
 */
export interface WalletProviderProps {
  /** Child components */
  children: ReactNode;
  /** Wallet adapters to be used */
  wallets: Adapter[];
  /** Whether to automatically connect to the last used wallet */
  autoConnect?: boolean | ((adapter: Adapter) => Promise<boolean>);
  /** Key for storing wallet name in storage */
  storageKey?: string;
  /** Custom storage factory for persisting wallet selection */
  storageFactory?: StorageProviderFactory;
  /** Error handler for wallet errors */
  onError?: (error: WalletError, adapter?: Adapter) => void;
}

/**
 * Provider for Solana wallet functionality
 * 
 * This provider manages wallet state, connections, and disconnections.
 * It also persists the selected wallet name in the configured storage.
 * 
 * @param props WalletProviderProps
 * @returns WalletProvider component
 */
export function WalletProvider({
  children,
  wallets: adapters,
  autoConnect = false,
  storageKey = 'walletName',
  storageFactory,
  onError,
}: WalletProviderProps) {
  const { connection } = useConnection();
  const adaptersWithStandardAdapters = useStandardWalletAdapters(adapters, connection?.rpcEndpoint);
  
  // Use the provided storage factory if supplied
  const [walletName, setWalletName] = useLocalStorage<WalletName | null>(
    storageKey, 
    null,
    storageFactory
  );
  
  // Track the selected adapter
  const adapter = useMemo(
    () => adaptersWithStandardAdapters.find((a) => a.name === walletName) ?? null,
    [adaptersWithStandardAdapters, walletName]
  );
  
  // Track unloading state for cleanup
  const isUnloadingRef = useRef(false);
  
  // Change wallet selection
  const changeWallet = useCallback(
    (nextWalletName: WalletName | null) => {
      if (walletName === nextWalletName) return;
      
      // Disconnect current wallet before switching (except special cases)
      if (
        adapter &&
        adapter.name !== SolanaMobileWalletAdapterWalletName
      ) {
        adapter.disconnect();
      }
      
      setWalletName(nextWalletName);
    },
    [adapter, setWalletName, walletName]
  );
  
  // Listen for disconnect events to update wallet name state
  useEffect(() => {
    if (!adapter) return;
    
    function handleDisconnect() {
      if (isUnloadingRef.current) return;
      setWalletName(null);
    }
    
    adapter.on('disconnect', handleDisconnect);
    
    return () => {
      adapter.off('disconnect', handleDisconnect);
    };
  }, [adapter, setWalletName]);
  
  // Track if user has manually selected a wallet
  const hasUserSelectedAWallet = useRef(false);
  
  // Auto-connect handler
  const handleAutoConnectRequest = useMemo(() => {
    if (!autoConnect || !adapter) return;
    
    return async () => {
      try {
        // Use custom auto-connect logic if provided
        if (typeof autoConnect === 'function') {
          const shouldAutoConnect = await autoConnect(adapter);
          if (!shouldAutoConnect) return;
        }
        
        // Use different connection methods based on user interaction
        if (hasUserSelectedAWallet.current) {
          await adapter.connect();
        } else {
          await adapter.autoConnect();
        }
      } catch (error) {
        console.error('Auto-connect error:', error);
      }
    };
  }, [autoConnect, adapter]);
  
  // Handle beforeunload for cleanup
  useEffect(() => {
    // Skip for mobile wallet adapters in mobile environment
    if (walletName === SolanaMobileWalletAdapterWalletName && getIsMobile(adaptersWithStandardAdapters)) {
      isUnloadingRef.current = false;
      return;
    }
    
    function handleBeforeUnload() {
      isUnloadingRef.current = true;
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [adaptersWithStandardAdapters, walletName]);
  
  // Handle connection errors
  const handleConnectError = useCallback(() => {
    if (adapter) {
      changeWallet(null);
    }
  }, [adapter, changeWallet]);
  
  // Select wallet function
  const selectWallet = useCallback(
    (walletName: WalletName | null) => {
      hasUserSelectedAWallet.current = true;
      changeWallet(walletName);
    },
    [changeWallet]
  );
  
  // Auto-connect on mount if enabled
  useEffect(() => {
    if (handleAutoConnectRequest) {
      handleAutoConnectRequest();
    }
  }, [handleAutoConnectRequest]);
  
  return (
    <WalletContext.Provider
      value={{
        autoConnect: !!autoConnect,
        wallets: adaptersWithStandardAdapters.map(adapter => ({
          adapter,
          readyState: adapter.readyState
        })),
        wallet: adapter ? {
          adapter,
          readyState: adapter.readyState
        } : null,
        publicKey: adapter?.publicKey || null,
        connecting: adapter?.connecting || false,
        connected: adapter?.connected || false,
        disconnecting: false, // Manage this if we want to track disconnecting state
        select: selectWallet,
        connect: async () => {
          if (!adapter) throw new WalletNotSelectedError();
          await adapter.connect();
        },
        disconnect: async () => {
          if (adapter) {
            await adapter.disconnect();
          }
        },
        sendTransaction: async (transaction, connection, options) => {
          if (!adapter) throw new WalletNotSelectedError();
          return await adapter.sendTransaction(transaction, connection, options);
        },
        signTransaction: adapter && 'signTransaction' in adapter ? 
          async (transaction) => {
            // const signAdapter = 
            return await signTransaction(transaction, adapter)
            // return await (adapter as Adapter).signTransaction(transaction)
          } : 
          undefined,
        signAllTransactions: adapter && 'signAllTransactions' in adapter ? 
          async (transactions) => await signAllTransactions(transactions, adapter) : 
          undefined,
        signMessage: adapter && 'signMessage' in adapter ? 
          async (message) => await signMessage(message, adapter) : 
          undefined,
        signIn: adapter && 'signIn' in adapter ? 
          async (input) => await signIn(adapter, input) : 
          undefined,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}