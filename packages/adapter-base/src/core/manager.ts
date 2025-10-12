import { Adapter, WalletName, WalletReadyState, EventEmitter, WalletAdapterEvents } from '../types/index.js';
import { PublicKey, Transaction, TransactionSignature } from '@solana/web3.js';
import { createLocalStorageUtility } from '../utils/storage.js';
import { addWalletAdapterEventListeners } from './adapters.js';
import { WalletConnectionManager } from '../types.js';
import { getDetectedWalletAdapters, initializeWalletDetection } from '@hermis/wallet-standard-base';
import {
    signTransaction,
    signAllTransactions,
    signMessage,
    sendTransaction as sendTransactionCore,
    DualArchitectureOptions,
    DualConnection,
    DualTransaction
} from '@hermis/solana-headless-core';

/**
 * Create a simple wallet connection manager
 * @param adapters Array of adapters to manage
 * @param localStorageKey Key to store the selected wallet name
 * @returns Wallet connection manager object
 */
export function createWalletConnectionManager(adapters: Adapter[], localStorageKey = 'walletName'): WalletConnectionManager {
    // Initialize wallet detection and merge with provided adapters
    initializeWalletDetection();
    const allAdapters = getDetectedWalletAdapters(adapters);
    
    
    const storageUtil = createLocalStorageUtility<string | null>(localStorageKey, null);
    let currentAdapter: Adapter | null = null;

    storageUtil.get().then((storedWalletName) => {
        if (storedWalletName) {
            currentAdapter = allAdapters.find(a => a.name === storedWalletName) || null;
        }
    })

    return {
        /**
         * Get the current adapter
         */
        getAdapter: () => currentAdapter,

        /**
         * Select an adapter by wallet name
         */
        selectWallet: (walletName: WalletName | null) => {
            // If same wallet, do nothing
            if (currentAdapter?.name === walletName) return currentAdapter;

            // If we have a current adapter, disconnect it
            if (currentAdapter && currentAdapter.connected) {
                try {
                    currentAdapter.disconnect();
                } catch (error) {
                    console.error('Error disconnecting wallet:', error);
                }
            }

            // Select new adapter
            if (!walletName) {
                currentAdapter = null;
                storageUtil.set(null);
                return null;
            }

            const adapter = allAdapters.find(a => a.name === walletName) || null;
            currentAdapter = adapter;

            // Store selected wallet
            if (adapter) {
                storageUtil.set(walletName as string);
            } else {
                storageUtil.set(null);
            }

            return adapter;
        },

        /**
         * Connect to the selected wallet
         */
        connect: async () => {
            if (!currentAdapter) throw new Error('No wallet selected');

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
            if (!currentAdapter) return null;

            try {
                await currentAdapter.autoConnect();
                return currentAdapter;
            } catch (error) {
                console.error('Error auto-connecting wallet:', error);
                return null;
            }
        },

        /**
         * Sign a transaction (supports both legacy and Kit architectures)
         */
        signTransaction: async <T extends DualTransaction>(
            transaction: T,
            options?: DualArchitectureOptions
        ): Promise<T> => {
            if (!currentAdapter) throw new Error('No wallet connected');
            return await signTransaction(transaction, currentAdapter, options);
        },

        /**
         * Sign multiple transactions (supports both legacy and Kit architectures)
         */
        signAllTransactions: async <T extends DualTransaction>(
            transactions: T[],
            options?: DualArchitectureOptions
        ): Promise<T[]> => {
            if (!currentAdapter) throw new Error('No wallet connected');
            return await signAllTransactions(transactions, currentAdapter, options);
        },

        /**
         * Send a transaction (supports both legacy and Kit architectures)
         */
        sendTransaction: async <T extends DualTransaction>(
            connection: DualConnection,
            transaction: T,
            options?: DualArchitectureOptions
        ): Promise<string> => {
            if (!currentAdapter) throw new Error('No wallet connected');
            return await sendTransactionCore(connection, transaction, currentAdapter, options);
        },

        /**
         * Sign and send a transaction in one operation (supports both legacy and Kit architectures)
         */
        signAndSendTransaction: async <T extends DualTransaction>(
            connection: DualConnection,
            transaction: T,
            options?: DualArchitectureOptions
        ): Promise<string> => {
            if (!currentAdapter) throw new Error('No wallet connected');
            // For simplicity, we'll sign then send
            const signed = await signTransaction(transaction, currentAdapter, options);
            return await sendTransactionCore(connection, signed, currentAdapter, options);
        }
    };
}

/**
 * Class to manage wallet adapters with event emission
 */
export class WalletAdapterManager extends EventEmitter {
    private adapters: Adapter[] = [];
    private selectedAdapter: Adapter | null = null;
    private storageUtil: ReturnType<typeof createLocalStorageUtility<string | null>>;
    private cleanupListeners: (() => void) | null = null;
    private isHandlingError = false;

    constructor(adapters: Adapter[] = [], localStorageKey = 'walletName') {
        super();
        
        // Initialize wallet detection and merge with provided adapters
        initializeWalletDetection();
        const allAdapters = getDetectedWalletAdapters(adapters);
        
        this.adapters = allAdapters.filter(adapter => adapter.readyState !== WalletReadyState.Unsupported);
        this.storageUtil = createLocalStorageUtility<string | null>(localStorageKey, null);

        // Initialize from storage
        this.storageUtil.get().then((storedWalletName) => {
            if (storedWalletName) {
                this.selectedAdapter = this.adapters.find(a => a.name === storedWalletName) || null;
    
                // Set up event listeners if we have a stored adapter
                if (this.selectedAdapter) {
                    this.setupEventListeners();
                }
            }
        })
    }

    /**
     * Get all wallet adapters
     */
    public getAdapters(): Adapter[] {
        return this.adapters;
    }

    /**
     * Get the currently selected adapter
     */
    public getSelectedAdapter(): Adapter | null {
        return this.selectedAdapter;
    }

    /**
     * Select a wallet adapter by name
     */
    public selectAdapter(walletName: WalletName | null): Adapter | null {
        // If same wallet, do nothing
        if (this.selectedAdapter?.name === walletName) return this.selectedAdapter;

        // Clean up any existing listeners
        this.cleanupAdapterListeners();

        // If we have a current adapter, disconnect it
        if (this.selectedAdapter && this.selectedAdapter.connected) {
            try {
                this.selectedAdapter.disconnect();
            } catch (error) {
                console.error('Error disconnecting wallet:', error);
            }
        }

        // Select new adapter
        if (!walletName) {
            this.clearSelectedAdapter()
            return null;
        }

        const adapter = this.adapters.find(a => a.name === walletName) || null;
        this.selectedAdapter = adapter;

        // Set up event listeners for the new adapter
        if (adapter) {
            this.setupEventListeners();
            this.storageUtil.set(walletName as string);
        } else {
            this.storageUtil.set(null);
        }

        this.emit('adapterChange', adapter);
        return adapter;
    }

    private cleanupAdapterListeners() {
        if (this.cleanupListeners) {
            this.cleanupListeners();
            this.cleanupListeners = null;
        }
    }

    private clearSelectedAdapter() {
        this.selectedAdapter = null;
        this.storageUtil.set(null);
        this.emit('adapterChange', null);
    }

    private emitSafeError(error: unknown): void {
        // Prevent concurrent error handling
        if (this.isHandlingError) return;

        try {
            this.isHandlingError = true;
            this.emit('error', error);
        } finally {
            // Use setTimeout to prevent immediate re-triggering
            setTimeout(() => {
                this.isHandlingError = false;
            }, 100);
        }
    }

    /**
     * Connect to the selected wallet
     */
    public async connect(): Promise<Adapter | null> {
        if (!this.selectedAdapter) {
            return null;
        }

        try {
            if (!this.selectedAdapter.connected) {
                await this.selectedAdapter.connect();
            }
            return this.selectedAdapter;
        } catch (error) {
            this.emitSafeError(error)
            return null;
        }
    }

    /**
     * Disconnect from the current wallet
     */
    public async disconnect(): Promise<void> {
        if (this.selectedAdapter?.connected) {
            try {
                await this.selectedAdapter.disconnect();
                this.clearSelectedAdapter()
            } catch (error) {
                this.emitSafeError(error)
            }
        }
    }

    /**
     * Auto-connect to the stored wallet
     */
    public async autoConnect(): Promise<Adapter | null> {
        if (!this.selectedAdapter) return null;

        try {
            await this.selectedAdapter.autoConnect();
            return this.selectedAdapter;
        } catch (error) {
            this.emitSafeError(error);
            return null;
        }
    }

    /**
     * Set up event listeners for the selected adapter
     * @private
     */
    private setupEventListeners(): void {
        if (!this.selectedAdapter) return;

        this.cleanupListeners = addWalletAdapterEventListeners(this.selectedAdapter, {
            onConnect: (publicKey: PublicKey) => {
                this.emit('connect', publicKey);
            },

            onDisconnect: () => {
                this.emit('disconnect');
            },

            onError: (error: Error) => {
                this.emitSafeError(error);
            },

            onReadyStateChange: (readyState: WalletReadyState) => {
                this.emit('readyStateChange', readyState);
            }
        });
    }

    /**
     * 
     * @param optional wallet adapter event 
     * @returns The class to manage wallet adapters with event emission
     */
    public removeAllListeners<E extends keyof WalletAdapterEvents>(event?: E): this {
        super.removeAllListeners(event);
        return this;
    }

    /**
     * Clean up resources when no longer needed
     */
    public dispose(): void {
        if (this.cleanupListeners) {
            this.cleanupListeners();
            this.cleanupListeners = null;
        }

        this.removeAllListeners();
    }

    /**
     * Sign a transaction (supports both legacy and Kit architectures)
     * @param transaction - The transaction to sign (Transaction, VersionedTransaction, or TransactionMessage)
     * @param options - Optional dual architecture configuration
     * @returns The signed transaction or null if error occurs
     */
    public async signTransaction<T extends DualTransaction>(
        transaction: T,
        options?: DualArchitectureOptions
    ): Promise<T | null> {
        if (!this.selectedAdapter) {
            this.emitSafeError("No Adapter connected")
            return null;
        }

        try {
            return await signTransaction(transaction, this.selectedAdapter, options)
        } catch (error) {
            this.emitSafeError(error)
            return null
        }
    }

    /**
     * Sign multiple transactions (supports both legacy and Kit architectures)
     * @param transactions - Array of transactions to sign (all same architecture)
     * @param options - Optional dual architecture configuration
     * @returns Array of signed transactions or null if error occurs
     */
    public async signAllTransaction<T extends DualTransaction>(
        transactions: T[],
        options?: DualArchitectureOptions
    ): Promise<T[] | null> {
        if (!this.selectedAdapter) {
            this.emitSafeError("No Adapter connected")
            return null;
        }

        try {
            return await signAllTransactions(transactions, this.selectedAdapter, options)
        } catch (error) {
            this.emitSafeError(error)
            return null
        }
    }

    /**
     * Sign a message (supports both legacy and Kit architectures)
     * @param message - The message to sign (string or Uint8Array)
     * @param options - Optional dual architecture configuration
     * @returns The signature bytes or null if error occurs
     */
    public async signMessage(
        message: string | Uint8Array<ArrayBufferLike>,
        options?: DualArchitectureOptions
    ): Promise<Uint8Array | null> {
        if (!this.selectedAdapter) {
            this.emitSafeError("No Adapter connected")
            return null;
        }

        try {
            return await signMessage(message, this.selectedAdapter, options)
        } catch (error) {
            this.emitSafeError(error)
            return null
        }
    }

    /**
     * Send a transaction (supports both legacy and Kit architectures)
     * @param connection - The Solana connection (Legacy Connection or Kit Rpc)
     * @param transaction - The transaction to send
     * @param options - Optional dual architecture configuration
     * @returns The transaction signature or null if error occurs
     */
    public async sendTransaction<T extends DualTransaction>(
        connection: DualConnection,
        transaction: T,
        options?: DualArchitectureOptions
    ): Promise<string | null> {
        if (!this.selectedAdapter) {
            this.emitSafeError("No Adapter connected")
            return null;
        }

        try {
            return await sendTransactionCore(connection, transaction, this.selectedAdapter, options)
        } catch (error) {
            this.emitSafeError(error)
            return null
        }
    }

    /**
     * Sign and send a transaction in one operation (supports both legacy and Kit architectures)
     * @param connection - The Solana connection (Legacy Connection or Kit Rpc)
     * @param transaction - The transaction to sign and send
     * @param options - Optional dual architecture configuration
     * @returns The transaction signature or null if error occurs
     */
    public async signAndSendTransaction<T extends DualTransaction>(
        connection: DualConnection,
        transaction: T,
        options?: DualArchitectureOptions
    ): Promise<string | null> {
        if (!this.selectedAdapter) {
            this.emitSafeError("No Adapter connected")
            return null;
        }

        try {
            // Sign the transaction first
            const signed = await signTransaction(transaction, this.selectedAdapter, options);
            // Then send it
            return await sendTransactionCore(connection, signed, this.selectedAdapter, options);
        } catch (error) {
            this.emitSafeError(error)
            return null
        }
    }
}