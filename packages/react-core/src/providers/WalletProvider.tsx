import React, { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Adapter, PublicKey, signAllTransactions, signIn, signMessage, signTransaction, WalletError, WalletName, WalletNotReadyError, WalletReadyState } from '@agateh/solana-headless-core';
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

  const onErrorRef = useRef(onError);

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

  // Track the selected adapter
  const adapter = useMemo(
    () => adaptersWithStandardAdapters.find((a) => a.name === walletName) ?? null,
    [adaptersWithStandardAdapters, walletName]
  );

  const isConnectingRef = useRef(false);
  const [connecting, setConnecting] = useState(false);
  const isDisconnectingRef = useRef(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [publicKey, setPublicKey] = useState(() => adapter?.publicKey ?? null);
  const [connected, setConnected] = useState(() => adapter?.connected ?? false);

  // Wrap adapters to conform to the `Wallet` interface
  const [wallets, setWallets] = useState(() =>
    adapters
      .map((adapter) => ({
        adapter,
        readyState: adapter.readyState,
      }))
      .filter(({ readyState }) => readyState !== WalletReadyState.Unsupported)
  );

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
  }, [adapter, adapters]);

  const wallet = useMemo(() => wallets.find((wallet) => wallet.adapter === adapter) ?? null, [adapter, wallets]);

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
      setConnected(true)
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
  // const handleConnectError = useCallback(() => {
  //   if (adapter) {
  //     changeWallet(null);
  //   }
  // }, [adapter, changeWallet]);

  const updateWalletNameAsync = async (newValue: WalletName): Promise<void> => {
    return new Promise(resolve => {
      hasUserSelectedAWallet.current = true;
      changeWallet(newValue);
      // React batches state updates and processes them after the current execution context
      // so we need to use setTimeout to get the updated state
      setTimeout(() => {
        resolve();
      }, 0);
    });
  };

  // Select wallet function
  const selectWallet = useCallback(
    async (walletName: WalletName | null) => {
      hasUserSelectedAWallet.current = true;
      // updateWalletNameAsync(walletName);

      // Wait a tick for state to update
      return await new Promise(resolve => setTimeout(resolve, 0)) as any;

      // Return the newly selected adapter for chaining
      // return adaptersWithStandardAdapters.find(a => a.name === walletName) || null;
    },
    [adaptersWithStandardAdapters, changeWallet]
  );

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (handleAutoConnectRequest) {
      handleAutoConnectRequest();
    }
  }, [handleAutoConnectRequest]);

  useEffect(() => {
    if (!adapter) return;

    const handleConnect = (publicKey: PublicKey) => {
      setPublicKey(publicKey);
      isConnectingRef.current = false;
      setConnecting(false);
      setConnected(true);
      isDisconnectingRef.current = false;
      setDisconnecting(false);
    };

    const handleDisconnect = () => {
      if (isUnloadingRef.current) return;

      setPublicKey(null);
      isConnectingRef.current = false;
      setConnecting(false);
      setConnected(false);
      isDisconnectingRef.current = false;
      setDisconnecting(false);
    };

    const handleError = (error: WalletError) => {
      handleErrorRef.current(error, adapter);
    };

    adapter.on('connect', handleConnect);
    adapter.on('disconnect', handleDisconnect);
    adapter.on('error', handleError);

    return () => {
      adapter.off('connect', handleConnect);
      adapter.off('disconnect', handleDisconnect);
      adapter.off('error', handleError);

      handleDisconnect();
    };
  }, [adapter, isUnloadingRef]);

  const handleConnect = useCallback(async () => {
    if (!adapter) throw new WalletNotSelectedError();
    await adapter.connect();
  }, [wallet])

  const hanndleDisconnect = useCallback(async () => {
    if (isDisconnectingRef.current) return;
    if (!adapter) return;
    isDisconnectingRef.current = true;
    setDisconnecting(true);
    try {
      await adapter.disconnect();
    } finally {
      setDisconnecting(false);
      isDisconnectingRef.current = false;
    }
  }, [adapter]);

  return (
    <WalletContext.Provider
      value={{
        autoConnect: !!autoConnect,
        wallets,
        wallet,
        publicKey,
        connecting,
        connected,
        disconnecting,
        select: updateWalletNameAsync,
        // select: selectWallet,
        connect: handleConnect,
        disconnect: hanndleDisconnect,

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