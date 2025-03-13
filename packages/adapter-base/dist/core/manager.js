import { WalletReadyState, EventEmitter } from '@agateh/solana-headless-core';
import { createLocalStorageUtility } from '../utils/storage.js';
import { addWalletAdapterEventListeners } from './adapters.js';
/**
 * Create a simple wallet connection manager
 * @param adapters Array of adapters to manage
 * @param localStorageKey Key to store the selected wallet name
 * @returns Wallet connection manager object
 */
export function createWalletConnectionManager(adapters, localStorageKey = 'walletName') {
    const storageUtil = createLocalStorageUtility(localStorageKey, null);
    let currentAdapter = null;
    const storedWalletName = storageUtil.get();
    if (storedWalletName) {
        currentAdapter = adapters.find(a => a.name === storedWalletName) || null;
    }
    return {
        /**
         * Get the current adapter
         */
        getAdapter: () => currentAdapter,
        /**
         * Select an adapter by wallet name
         */
        selectWallet: (walletName) => {
            // If same wallet, do nothing
            if (currentAdapter?.name === walletName)
                return currentAdapter;
            // If we have a current adapter, disconnect it
            if (currentAdapter && currentAdapter.connected) {
                try {
                    currentAdapter.disconnect();
                }
                catch (error) {
                    console.error('Error disconnecting wallet:', error);
                }
            }
            // Select new adapter
            if (!walletName) {
                currentAdapter = null;
                storageUtil.set(null);
                return null;
            }
            const adapter = adapters.find(a => a.name === walletName) || null;
            currentAdapter = adapter;
            // Store selected wallet
            if (adapter) {
                storageUtil.set(walletName);
            }
            else {
                storageUtil.set(null);
            }
            return adapter;
        },
        /**
         * Connect to the selected wallet
         */
        connect: async () => {
            if (!currentAdapter)
                throw new Error('No wallet selected');
            if (!currentAdapter.connected) {
                await currentAdapter.connect();
            }
            return currentAdapter;
        },
        /**
         * Disconnect from the current wallet
         */
        disconnect: async () => {
            if (currentAdapter?.connected) {
                await currentAdapter.disconnect();
            }
        },
        /**
         * Auto-connect to the stored wallet
         */
        autoConnect: async () => {
            if (!currentAdapter)
                return null;
            try {
                await currentAdapter.autoConnect();
                return currentAdapter;
            }
            catch (error) {
                console.error('Error auto-connecting wallet:', error);
                return null;
            }
        }
    };
}
/**
 * Class to manage wallet adapters with event emission
 */
export class WalletAdapterManager extends EventEmitter {
    constructor(adapters = [], localStorageKey = 'walletName') {
        super();
        this.adapters = [];
        this.selectedAdapter = null;
        this.cleanupListeners = null;
        this.isHandlingError = false;
        this.adapters = adapters.filter(adapter => adapter.readyState !== WalletReadyState.Unsupported);
        this.storageUtil = createLocalStorageUtility(localStorageKey, null);
        // Initialize from storage
        const storedWalletName = this.storageUtil.get();
        if (storedWalletName) {
            this.selectedAdapter = this.adapters.find(a => a.name === storedWalletName) || null;
            // Set up event listeners if we have a stored adapter
            if (this.selectedAdapter) {
                this.setupEventListeners();
            }
        }
    }
    /**
     * Get all wallet adapters
     */
    getAdapters() {
        return this.adapters;
    }
    /**
     * Get the currently selected adapter
     */
    getSelectedAdapter() {
        return this.selectedAdapter;
    }
    /**
     * Select a wallet adapter by name
     */
    selectAdapter(walletName) {
        // If same wallet, do nothing
        if (this.selectedAdapter?.name === walletName)
            return this.selectedAdapter;
        // Clean up any existing listeners
        this.cleanupAdapterListeners();
        // If we have a current adapter, disconnect it
        if (this.selectedAdapter && this.selectedAdapter.connected) {
            try {
                this.selectedAdapter.disconnect();
            }
            catch (error) {
                console.error('Error disconnecting wallet:', error);
            }
        }
        // Select new adapter
        if (!walletName) {
            this.clearSelectedAdapter();
            return null;
        }
        const adapter = this.adapters.find(a => a.name === walletName) || null;
        this.selectedAdapter = adapter;
        // Set up event listeners for the new adapter
        if (adapter) {
            this.setupEventListeners();
            this.storageUtil.set(walletName);
        }
        else {
            this.storageUtil.set(null);
        }
        this.emit('adapterChange', adapter);
        return adapter;
    }
    cleanupAdapterListeners() {
        if (this.cleanupListeners) {
            this.cleanupListeners();
            this.cleanupListeners = null;
        }
    }
    clearSelectedAdapter() {
        this.selectedAdapter = null;
        this.storageUtil.set(null);
        this.emit('adapterChange', null);
    }
    emitSafeError(error) {
        // Prevent concurrent error handling
        if (this.isHandlingError)
            return;
        try {
            this.isHandlingError = true;
            this.emit('error', error);
        }
        finally {
            // Use setTimeout to prevent immediate re-triggering
            setTimeout(() => {
                this.isHandlingError = false;
            }, 100);
        }
    }
    /**
     * Connect to the selected wallet
     */
    async connect() {
        if (!this.selectedAdapter) {
            return null;
        }
        try {
            if (!this.selectedAdapter.connected) {
                await this.selectedAdapter.connect();
            }
            return this.selectedAdapter;
        }
        catch (error) {
            this.emitSafeError(error);
            return null;
        }
    }
    /**
     * Disconnect from the current wallet
     */
    async disconnect() {
        if (this.selectedAdapter?.connected) {
            try {
                await this.selectedAdapter.disconnect();
                this.clearSelectedAdapter();
            }
            catch (error) {
                this.emitSafeError(error);
            }
        }
    }
    /**
     * Auto-connect to the stored wallet
     */
    async autoConnect() {
        if (!this.selectedAdapter)
            return null;
        try {
            await this.selectedAdapter.autoConnect();
            return this.selectedAdapter;
        }
        catch (error) {
            this.emitSafeError(error);
            return null;
        }
    }
    /**
     * Set up event listeners for the selected adapter
     * @private
     */
    setupEventListeners() {
        if (!this.selectedAdapter)
            return;
        this.cleanupListeners = addWalletAdapterEventListeners(this.selectedAdapter, {
            onConnect: (publicKey) => {
                this.emit('connect', publicKey);
            },
            onDisconnect: () => {
                this.emit('disconnect');
            },
            onError: (error) => {
                this.emitSafeError(error);
            },
            onReadyStateChange: (readyState) => {
                this.emit('readyStateChange', readyState);
            }
        });
    }
    /**
     *
     * @param optional wallet adapter event
     * @returns The class to manage wallet adapters with event emission
     */
    removeAllListeners(event) {
        super.removeAllListeners(event);
        return this;
    }
    /**
     * Clean up resources when no longer needed
     */
    dispose() {
        if (this.cleanupListeners) {
            this.cleanupListeners();
            this.cleanupListeners = null;
        }
        this.removeAllListeners();
    }
}
