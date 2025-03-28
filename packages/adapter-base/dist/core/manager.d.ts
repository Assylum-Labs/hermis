import { Adapter, WalletName, EventEmitter, WalletAdapterEvents, Transaction } from '@hermis/solana-headless-core';
/**
 * Create a simple wallet connection manager
 * @param adapters Array of adapters to manage
 * @param localStorageKey Key to store the selected wallet name
 * @returns Wallet connection manager object
 */
export declare function createWalletConnectionManager(adapters: Adapter[], localStorageKey?: string): {
    /**
     * Get the current adapter
     */
    getAdapter: () => Adapter | null;
    /**
     * Select an adapter by wallet name
     */
    selectWallet: (walletName: WalletName | null) => import("@solana/wallet-adapter-base").WalletAdapter | null;
    /**
     * Connect to the selected wallet
     */
    connect: () => Promise<Adapter>;
    /**
     * Disconnect from the current wallet
     */
    disconnect: () => Promise<void>;
    /**
     * Auto-connect to the stored wallet
     */
    autoConnect: () => Promise<import("@solana/wallet-adapter-base").WalletAdapter | null>;
};
/**
 * Class to manage wallet adapters with event emission
 */
export declare class WalletAdapterManager extends EventEmitter {
    private adapters;
    private selectedAdapter;
    private storageUtil;
    private cleanupListeners;
    private isHandlingError;
    constructor(adapters?: Adapter[], localStorageKey?: string);
    /**
     * Get all wallet adapters
     */
    getAdapters(): Adapter[];
    /**
     * Get the currently selected adapter
     */
    getSelectedAdapter(): Adapter | null;
    /**
     * Select a wallet adapter by name
     */
    selectAdapter(walletName: WalletName | null): Adapter | null;
    private cleanupAdapterListeners;
    private clearSelectedAdapter;
    private emitSafeError;
    /**
     * Connect to the selected wallet
     */
    connect(): Promise<Adapter | null>;
    /**
     * Disconnect from the current wallet
     */
    disconnect(): Promise<void>;
    /**
     * Auto-connect to the stored wallet
     */
    autoConnect(): Promise<Adapter | null>;
    /**
     * Set up event listeners for the selected adapter
     * @private
     */
    private setupEventListeners;
    /**
     *
     * @param optional wallet adapter event
     * @returns The class to manage wallet adapters with event emission
     */
    removeAllListeners<E extends keyof WalletAdapterEvents>(event?: E): this;
    /**
     * Clean up resources when no longer needed
     */
    dispose(): void;
    signTransaction(transaction: Transaction): Promise<Transaction | null>;
    signAllTransaction(transaction: Transaction[]): Promise<Transaction[] | null>;
    signMessage(message: string | Uint8Array<ArrayBufferLike>): Promise<Uint8Array | null>;
}
