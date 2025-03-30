import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  SendOptions,
  WalletAdapter
} from '@hermis/solana-headless-core';
import {
  getIsMobile,
  SolanaMobileWalletAdapterWalletName
} from '@hermis/solana-headless-adapter-base';
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

  const [walletName, setWalletName] = useLocalStorage<WalletName | null>(
    storageKey,
    null,
    storageFactory
  );

  const latestAdapterRef = useRef<Adapter | null>(null);
  
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

  useEffect(() => {
    onErrorRef.current = onError;
    return () => {
      onErrorRef.current = undefined;
    };
  }, [onError]);

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

  const findAdapter = useCallback(
    (name: WalletName | null) => {
      return name ? adaptersWithStandardAdapters.find((a) => a.name === name) ?? null : null;
    },
    [adaptersWithStandardAdapters]
  );

  useEffect(() => {
    const adapter = findAdapter(walletName);
    
    if(!autoConnect) return

    latestAdapterRef.current = adapter;
    
    setAdapterState({
      adapter,
      connected: adapter?.connected || false,
      connecting: false,
      disconnecting: false,
      publicKey: adapter?.publicKey || null
    });
  }, [walletName, findAdapter]);

  const changeWallet = useCallback(
    (nextWalletName: WalletName | null) => {
      if (walletName === nextWalletName) return;

      const currentAdapter = adapterState.adapter;
      if (
        currentAdapter &&
        currentAdapter.name !== SolanaMobileWalletAdapterWalletName &&
        currentAdapter.connected
      ) {
        currentAdapter.disconnect();
      }
      latestAdapterRef.current = currentAdapter
      setWalletName(nextWalletName);
    },
    [adapterState.adapter, setWalletName, walletName]
  );

  const updateWalletNameAsync = useCallback(
    async (newValue: WalletName | null): Promise<void> => {
      hasUserSelectedAWallet.current = true;
      
      return new Promise<void>((resolve) => {
        const selectedAdapter = findAdapter(newValue);
        
        latestAdapterRef.current = selectedAdapter;
        
        setAdapterState((prev) => ({
          ...prev,
          adapter: selectedAdapter,
          connected: selectedAdapter?.connected || false,
          publicKey: selectedAdapter?.publicKey || null
        }));
        
        changeWallet(newValue);
        // console.log("selected wallet", wallet);
        
        
        setTimeout(resolve, 50);
      });
    },
    [changeWallet, findAdapter]
  );

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

  const [wallets, setWallets] = useState(() =>
    adapters
      .map((adapter) => ({
        adapter,
        readyState: adapter.readyState,
      }))
      .filter(({ readyState }) => readyState !== WalletReadyState.Unsupported)
  );

  useEffect(() => {
    setWallets((wallets) =>
      adapters
        .map((adapter, index) => {
          const wallet = wallets[index];
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

  const wallet = useMemo(
    () => wallets.find((wallet) => wallet.adapter === adapterState.adapter) ?? null, 
    [adapterState.adapter, wallets]
  );

  useEffect(() => {
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

      changeWallet(null)
    }
    
    function handleError(error: WalletError) {
      handleErrorRef.current(error, currentAdapter!);
    }
    
    currentAdapter.on('connect', handleConnect);
    currentAdapter.on('disconnect', handleDisconnect);
    currentAdapter.on('error', handleError);
    
    if (currentAdapter.connected && currentAdapter.publicKey) {
      handleConnect(currentAdapter.publicKey);
    }
    
    return () => {
      currentAdapter.off('connect', handleConnect);
      currentAdapter.off('disconnect', handleDisconnect);
      currentAdapter.off('error', handleError);
    };
  }, [adapterState.adapter]);

  const handleAutoConnectRequest = useCallback(async () => {
    const currentAdapter = adapterState.adapter;
    if (!autoConnect || !currentAdapter) return;

    try {
      if (typeof autoConnect === 'function') {
        const shouldAutoConnect = await autoConnect(currentAdapter);
        if (!shouldAutoConnect) return;
      }

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

  useEffect(() => {
    if (adapterState.adapter) {
      handleAutoConnectRequest();
    }
  }, [handleAutoConnectRequest, adapterState.adapter]);

  const handleConnect = useCallback(async () => {
    const currentAdapter = latestAdapterRef.current || adapterState.adapter;
    if (!currentAdapter) throw new WalletNotSelectedError();
    
    setAdapterState(prev => ({ ...prev, connecting: true }));
    
    try {
      return new Promise<WalletAdapter>(async(resolve) => {
        await currentAdapter.connect();
        
        const isConnected = currentAdapter.connected;
        const publicKey = currentAdapter.publicKey;
        
        setAdapterState(prev => ({ 
          ...prev, 
          adapter: currentAdapter,
          connected: isConnected, 
          connecting: false,
          publicKey: publicKey 
        }));

        latestAdapterRef.current = currentAdapter

        // console.log('Publickey', publicKey);
        // console.log('isConnected', isConnected);
        // console.log('adapterState', adapterState);
        // console.log('adapter REf', latestAdapterRef.current);
        
        
        setTimeout(() => resolve(currentAdapter), 50);
      })
    } catch (error) {
      handleErrorRef.current(error as WalletError, currentAdapter);
      setAdapterState(prev => ({ ...prev, connecting: false }));
      await handleDisconnect()
      throw error;
    }
  }, [adapterState.adapter]);

  const handleDisconnect = useCallback(async () => {
    const currentAdapter = latestAdapterRef.current || adapterState.adapter;
    if (!currentAdapter) return;
    
    setAdapterState(prev => ({ 
      ...prev,
      connected: false,
      adapter: null,
      publicKey: null,
      connecting: false,
      disconnecting: true
    }));
    
    try {
      await currentAdapter.disconnect();
      changeWallet(null)
      setWalletName(null)
    } catch (error) {
      handleErrorRef.current(error as WalletError, currentAdapter);
    } finally {
      setAdapterState(prev => ({ ...prev, disconnecting: false }));
    }
  }, [adapterState.adapter]);

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
        publicKey: wallet?.adapter.publicKey || latestAdapterRef.current?.publicKey || adapterState.adapter?.publicKey || adapterState.publicKey || null,
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