import React, { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { 
  Adapter, 
  PublicKey, 
  signAllTransactions, 
  signIn, 
  signMessage, 
  signTransaction, 
  Transaction,
  WalletError, 
  WalletName, 
  WalletNotReadyError, 
  WalletReadyState,
  VersionedTransaction,
  MessageSignerWalletAdapter,
  SignerWalletAdapter,
  SignInMessageSignerWalletAdapter,
  SendOptions
} from '@agateh/solana-headless-core';
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
 * Interface for the adapter state
 */
interface AdapterState {
  adapter: Adapter | null;
  connected: boolean;
  connecting: boolean;
  disconnecting: boolean;
  publicKey: PublicKey | null;
}

/**
 * Type guards for wallet adapter capabilities
 */
function supportsSignMessage(adapter: Adapter): adapter is MessageSignerWalletAdapter {
  return 'signMessage' in adapter && typeof adapter.signMessage === 'function';
}

function supportsSignTransaction(adapter: Adapter): adapter is SignerWalletAdapter {
  return 'signTransaction' in adapter && typeof adapter.signTransaction === 'function';
}

function supportsSignAllTransactions(adapter: Adapter): adapter is SignerWalletAdapter {
  return 'signAllTransactions' in adapter && typeof adapter.signAllTransactions === 'function';
}

function supportsSignIn(adapter: Adapter): adapter is SignInMessageSignerWalletAdapter {
  return 'signIn' in adapter && typeof adapter.signIn === 'function';
}

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

  // Ref to keep track of the latest adapter for immediately accessing after selection
  const latestAdapterRef = useRef<Adapter | null>(null);
  
  // Centralized adapter state
  const [adapterState, setAdapterState] = useState<AdapterState>({
    adapter: null,
    connected: false,
    connecting: false,
    disconnecting: false,
    publicKey: null
  });

  const onErrorRef = useRef(onError);
  const isUnloadingRef = useRef(false);
  const hasUserSelectedAWallet = useRef(false);

  // Update error handler ref when prop changes
  useEffect(() => {
    onErrorRef.current = onError;
    return () => {
      onErrorRef.current = undefined;
    };
  }, [onError]);

  // Error handling function
  const handleErrorRef = useRef((error: WalletError, adapter?: Adapter) => {
    if (!isUnloadingRef.current) {
      if (onErrorRef.current) {
        onErrorRef.current(error, adapter);
      } else {
        console.error(error, adapter);
        if (error instanceof WalletNotReadyError && typeof window !== 'undefined' && adapter) {
          window.open(adapter.url, '_blank');
        }
      }
    }
    return error;
  });

  // Find adapter by name
  const findAdapter = useCallback(
    (name: WalletName | null) => {
      return name ? adaptersWithStandardAdapters.find((a) => a.name === name) ?? null : null;
    },
    [adaptersWithStandardAdapters]
  );

  // Initialize adapter on mount or when walletName changes
  useEffect(() => {
    const adapter = findAdapter(walletName);
    
    // Update latestAdapterRef
    latestAdapterRef.current = adapter;
    
    // Initialize adapter state
    setAdapterState({
      adapter,
      connected: adapter?.connected || false,
      connecting: false,
      disconnecting: false,
      publicKey: adapter?.publicKey || null
    });
  }, [walletName, findAdapter]);

  // Change wallet selection
  const changeWallet = useCallback(
    (nextWalletName: WalletName | null) => {
      if (walletName === nextWalletName) return;

      // Disconnect current adapter before switching (except special cases)
      const currentAdapter = adapterState.adapter;
      if (
        currentAdapter &&
        currentAdapter.name !== SolanaMobileWalletAdapterWalletName &&
        currentAdapter.connected
      ) {
        currentAdapter.disconnect();
      }

      setWalletName(nextWalletName);
    },
    [adapterState.adapter, setWalletName, walletName]
  );

  // Select wallet asynchronously with promise resolution
  const updateWalletNameAsync = useCallback(
    async (newValue: WalletName | null): Promise<void> => {
      hasUserSelectedAWallet.current = true;
      
      return new Promise<void>((resolve) => {
        // Find the selected adapter
        const selectedAdapter = findAdapter(newValue);
        
        // Update the latest adapter ref immediately
        latestAdapterRef.current = selectedAdapter;
        
        // Update the adapter state
        setAdapterState((prev) => ({
          ...prev,
          adapter: selectedAdapter,
          connected: selectedAdapter?.connected || false,
          publicKey: selectedAdapter?.publicKey || null
        }));
        
        // Change the stored wallet name
        changeWallet(newValue);
        
        // Resolve the promise
        setTimeout(resolve, 50); // Small delay to ensure state updates
      });
    },
    [changeWallet, findAdapter]
  );

  // Listen for disconnect events to update wallet name state
  useEffect(() => {
    const currentAdapter = adapterState.adapter;
    if (!currentAdapter) return;

    function handleDisconnect() {
      if (isUnloadingRef.current) return;
      setWalletName(null);
    }

    currentAdapter.on('disconnect', handleDisconnect);

    return () => {
      currentAdapter.off('disconnect', handleDisconnect);
    };
  }, [adapterState.adapter, setWalletName]);

  // Wrap adapters to conform to the `Wallet` interface
  const [wallets, setWallets] = useState(() =>
    adapters
      .map((adapter) => ({
        adapter,
        readyState: adapter.readyState,
      }))
      .filter(({ readyState }) => readyState !== WalletReadyState.Unsupported)
  );

  // Track adapter readyState changes
  useEffect(() => {
    // When the adapters change, wrap them to conform to the `Wallet` interface
    setWallets((wallets) =>
      adapters
        .map((adapter, index) => {
          const wallet = wallets[index];
          // If the wallet hasn't changed, return the same instance
          return wallet && wallet.adapter === adapter && wallet.readyState === adapter.readyState
            ? wallet
            : {
              adapter: adapter,
              readyState: adapter.readyState,
            };
        })
        .filter(({ readyState }) => readyState !== WalletReadyState.Unsupported)
    );

    function handleReadyStateChange(this: Adapter, readyState: WalletReadyState) {
      setWallets((prevWallets) => {
        const index = prevWallets.findIndex(({ adapter }) => adapter === this);
        if (index === -1) return prevWallets;

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const { adapter } = prevWallets[index]!;
        return [
          ...prevWallets.slice(0, index),
          { adapter, readyState },
          ...prevWallets.slice(index + 1),
        ].filter(({ readyState }) => readyState !== WalletReadyState.Unsupported);
      });
    }
    adapters.forEach((adapter) => adapter.on('readyStateChange', handleReadyStateChange, adapter));
    return () => {
      adapters.forEach((adapter) => adapter.off('readyStateChange', handleReadyStateChange, adapter));
    };
  }, [adapters]);

  // Current wallet from wallets array
  const wallet = useMemo(
    () => wallets.find((wallet) => wallet.adapter === adapterState.adapter) ?? null, 
    [adapterState.adapter, wallets]
  );

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

  // Single effect to handle all adapter events
  useEffect(() => {
    const currentAdapter = adapterState.adapter;
    if (!currentAdapter) return;
    
    function handleConnect(publicKey: PublicKey) {
      if (isUnloadingRef.current) return;
      
      setAdapterState(prev => ({
        ...prev,
        connected: true,
        connecting: false,
        disconnecting: false,
        publicKey
      }));
    }
    
    function handleDisconnect() {
      if (isUnloadingRef.current) return;
      
      setAdapterState(prev => ({
        ...prev,
        connected: false,
        connecting: false,
        disconnecting: false,
        publicKey: null
      }));
    }
    
    function handleError(error: WalletError) {
      handleErrorRef.current(error, currentAdapter!);
    }
    
    currentAdapter.on('connect', handleConnect);
    currentAdapter.on('disconnect', handleDisconnect);
    currentAdapter.on('error', handleError);
    
    // Initialize state from current adapter values
    if (currentAdapter.connected && currentAdapter.publicKey) {
      handleConnect(currentAdapter.publicKey);
    }
    
    return () => {
      currentAdapter.off('connect', handleConnect);
      currentAdapter.off('disconnect', handleDisconnect);
      currentAdapter.off('error', handleError);
    };
  }, [adapterState.adapter]);

  //
  //  Auto-connect handler
  const handleAutoConnectRequest = useCallback(async () => {
    const currentAdapter = adapterState.adapter;
    if (!autoConnect || !currentAdapter) return;

    try {
      // Use custom auto-connect logic if provided
      if (typeof autoConnect === 'function') {
        const shouldAutoConnect = await autoConnect(currentAdapter);
        if (!shouldAutoConnect) return;
      }

      // Use different connection methods based on user interaction
      setAdapterState(prev => ({ ...prev, connecting: true }));
      
      if (hasUserSelectedAWallet.current) {
        await currentAdapter.connect();
      } else {
        await currentAdapter.autoConnect();
      }
    } catch (error) {
      console.error('Auto-connect error:', error);
      setAdapterState(prev => ({ ...prev, connecting: false }));
    }
  }, [autoConnect, adapterState.adapter]);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (adapterState.adapter) {
      handleAutoConnectRequest();
    }
  }, [handleAutoConnectRequest, adapterState.adapter]);

  // Handle connect
  const handleConnect = useCallback(async () => {
    const currentAdapter = latestAdapterRef.current || adapterState.adapter;
    if (!currentAdapter) throw new WalletNotSelectedError();
    
    setAdapterState(prev => ({ ...prev, connecting: true }));
    
    try {
      await currentAdapter.connect();
      
      // Check if connection was successful
      const isConnected = currentAdapter.connected;
      const publicKey = currentAdapter.publicKey;
      
      // Update state
      setAdapterState(prev => ({ 
        ...prev, 
        adapter: currentAdapter,
        connected: isConnected, 
        connecting: false,
        publicKey: publicKey 
      }));
      
      // Return the connection status directly
      return isConnected;
    } catch (error) {
      handleErrorRef.current(error as WalletError, currentAdapter);
      setAdapterState(prev => ({ ...prev, connecting: false }));
      throw error;
    }
  }, [adapterState.adapter]);

  // Handle disconnect
  const handleDisconnect = useCallback(async () => {
    const currentAdapter = latestAdapterRef.current || adapterState.adapter;
    if (!currentAdapter) return;
    
    setAdapterState(prev => ({ ...prev, disconnecting: true }));
    
    try {
      await currentAdapter.disconnect();
    } catch (error) {
      handleErrorRef.current(error as WalletError, currentAdapter);
    } finally {
      // Ensure disconnecting state is reset even on error
      setAdapterState(prev => ({ ...prev, disconnecting: false }));
    }
  }, [adapterState.adapter]);

  // Handle send transaction
  const handleSendTransaction = useCallback(async (
    transaction: Transaction | VersionedTransaction,
    connection: any,
    options?: SendOptions
  ) => {
    const currentAdapter = latestAdapterRef.current || adapterState.adapter;
    if (!currentAdapter) throw new WalletNotSelectedError();
    
    try {
      return await currentAdapter.sendTransaction(transaction, connection, options);
    } catch (error) {
      handleErrorRef.current(error as WalletError, currentAdapter);
      throw error;
    }
  }, [adapterState.adapter]);

  // Handle sign transaction
  const handleSignTransaction = useCallback(async <T extends Transaction | VersionedTransaction>(transaction: T): Promise<T> => {
    const currentAdapter = latestAdapterRef.current || adapterState.adapter;
    if (!currentAdapter) throw new WalletNotSelectedError();
    
    if (!supportsSignTransaction(currentAdapter)) {
      throw new Error('Wallet does not support transaction signing');
    }
    
    try {
      return await signTransaction(transaction, currentAdapter);
    } catch (error) {
      handleErrorRef.current(error as WalletError, currentAdapter);
      throw error;
    }
  }, [adapterState.adapter]);

  // Handle sign all transactions
  const handleSignAllTransactions = useCallback(async <T extends Transaction | VersionedTransaction>(transactions: T[]): Promise<T[]> => {
    const currentAdapter = latestAdapterRef.current || adapterState.adapter;
    if (!currentAdapter) throw new WalletNotSelectedError();
    
    if (!supportsSignAllTransactions(currentAdapter)) {
      throw new Error('Wallet does not support signing multiple transactions');
    }
    
    try {
      return await signAllTransactions(transactions, currentAdapter);
    } catch (error) {
      handleErrorRef.current(error as WalletError, currentAdapter);
      throw error;
    }
  }, [adapterState.adapter]);

  // Handle sign message
  const handleSignMessage = useCallback(async (message: Uint8Array) => {
    const currentAdapter = latestAdapterRef.current || adapterState.adapter;
    if (!currentAdapter) throw new WalletNotSelectedError();
    
    if (!supportsSignMessage(currentAdapter)) {
      throw new Error('Wallet does not support message signing');
    }
    
    try {
      return await signMessage(message, currentAdapter);
    } catch (error) {
      handleErrorRef.current(error as WalletError, currentAdapter);
      throw error;
    }
  }, [adapterState.adapter]);

  // Handle sign in
  const handleSignIn = useCallback(async (input?: any) => {
    const currentAdapter = latestAdapterRef.current || adapterState.adapter;
    if (!currentAdapter) throw new WalletNotSelectedError();
    
    if (!supportsSignIn(currentAdapter)) {
      throw new Error('Wallet does not support sign in');
    }
    
    try {
      return await signIn(currentAdapter, input);
    } catch (error) {
      handleErrorRef.current(error as WalletError, currentAdapter);
      throw error;
    }
  }, [adapterState.adapter]);

  // Feature support checker
  const hasFeature = useCallback((feature: 'signMessage' | 'signTransaction' | 'signAllTransactions' | 'signIn') => {
    const currentAdapter = latestAdapterRef.current || adapterState.adapter;
    if (!currentAdapter) return false;
    return feature in currentAdapter;
  }, [adapterState.adapter]);

  return (
    <WalletContext.Provider
      value={{
        autoConnect: !!autoConnect,
        wallets,
        wallet,
        publicKey: latestAdapterRef.current?.publicKey || adapterState.publicKey,
        connecting: latestAdapterRef.current?.connecting || adapterState.connecting,
        connected: latestAdapterRef.current?.connected || adapterState.connected,
        disconnecting: adapterState.disconnecting,
        select: updateWalletNameAsync,
        connect: handleConnect,
        disconnect: handleDisconnect,
        sendTransaction: handleSendTransaction,
        signTransaction: handleSignTransaction,
        signAllTransactions: handleSignAllTransactions,
        signMessage: handleSignMessage,
        signIn: handleSignIn,
        hasFeature
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}