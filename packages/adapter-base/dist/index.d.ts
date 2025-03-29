import { Adapter, WalletName, WalletReadyState, WalletAdapterNetwork, PublicKey, EventEmitter, WalletAdapterEvents, Transaction, WalletAdapter, MessageSignerWalletAdapter, SignerWalletAdapter, SignInMessageSignerWalletAdapter, VersionedTransaction, Connection, SendOptions, TransactionSignature, TransactionVersion } from '@hermis/solana-headless-core';
import { SolanaMobileWalletAdapter } from '@solana-mobile/wallet-adapter-mobile';
import * as _solana_wallet_adapter_base from '@solana/wallet-adapter-base';
import { Wallet, WalletIcon } from '@wallet-standard/base';

/**
 * Interface for wallet provider information
 */
interface WalletProvider {
    adapter: Adapter;
    name: WalletName;
    icon: string;
    url: string;
    readyState: WalletReadyState;
}
/**
 * Environment detection enum
 */
declare enum Environment {
    DESKTOP_WEB = 0,
    MOBILE_WEB = 1
}
/**
 * Configuration for environment detection
 */
interface EnvironmentConfig {
    adapters: Adapter[] | SolanaMobileWalletAdapter[];
    userAgentString: string | null;
}

declare const SolanaMobileWalletAdapterWalletName = "Mobile Wallet Adapter";

declare function getUserAgent(): string | null;
/**
 * Get the URI for app identity
 * @returns The protocol + host URI or undefined
 */
declare function getUriForAppIdentity(): string | undefined;
/**
 * Check if the device is iOS
 * @param userAgentString The user agent string
 * @returns true if running on iOS device
 */
declare function isIOS(userAgentString: string): boolean;
/**
 * Check if the device is Android
 * @param userAgentString The user agent string
 * @returns true if running on Android device
 */
declare function isAndroid(userAgentString: string): boolean;
/**
 * Check if the current device is mobile
 * @param userAgentString User agent string
 * @returns true if it's a mobile device
 */
declare function isMobileDevice(userAgentString: string): boolean;
/**
 * Determine the current environment (desktop or mobile web)
 * @param config Configuration with adapters and userAgentString
 * @returns The detected environment
 */
declare function getEnvironment({ adapters, userAgentString }: EnvironmentConfig): Environment;
/**
 * Determine if the current environment is mobile
 * @param adapters Array of wallet adapters
 * @param userAgentString Optional user agent string (for testing)
 * @returns true if the environment is mobile
 */
declare function getIsMobile(adapters: Adapter[], userAgentString?: string | null): boolean;
/**
 * Check if the user is on iOS and can be redirected
 * @returns true if the user can be redirected
 */
declare function isIosAndRedirectable(): boolean;
/**
 * Infer Solana cluster from endpoint
 * @param endpoint RPC endpoint URL
 * @returns The inferred cluster/network
 */
declare function getInferredNetworkFromEndpoint(endpoint?: string): WalletAdapterNetwork;

/**
 * Create a local storage utility for persisting data
 * @param key The local storage key
 * @param defaultValue Default value if the key doesn't exist
 * @returns An object with get and set methods
 */
declare function createLocalStorageUtility<T>(key: string, defaultValue: T): {
    get(): Promise<T>;
    set(value: T | null): Promise<void>;
};

/**
 * Initialize wallet adapters
 * @param adapters Array of wallet adapters to initialize
 */
declare function initAdapters(adapters: Adapter[]): void;
/**
 * Select a wallet adapter by name
 * @param walletName Name of the wallet to select
 * @returns The selected adapter or null if not found
 */
declare function selectAdapter(walletName: WalletName | null): Adapter | null;
/**
 * Get the currently selected adapter
 * @returns The currently selected adapter or null
 */
declare function getSelectedAdapter(): Adapter | null;
/**
 * Get all wallet adapters, optionally filtered by ready state
 * @param readyState Optional wallet ready state to filter by
 * @returns Array of wallet providers
 */
declare function getWalletAdapters(readyState?: WalletReadyState): WalletProvider[];
/**
 * Get wallet adapters by ready state
 * @param adapters Array of adapters
 * @param readyState The ready state to filter by
 * @returns Filtered array of adapters
 */
declare function getAdaptersByReadyState(adapters: Adapter[], readyState: WalletReadyState): Adapter[];
/**
 * Sort wallet adapters by priority (Mobile > Installed > Loadable > others)
 * @param adapters Array of wallet adapters
 * @returns Sorted array of wallet adapters
 */
declare function sortWalletAdapters(adapters: Adapter[]): Adapter[];
/**
 * Handler for wallet adapter events
 * @param adapter The wallet adapter to listen to
 * @param handlers Object with event handlers
 * @returns Function to remove the event listeners
 */
declare function addWalletAdapterEventListeners(adapter: Adapter, handlers: {
    onConnect?: (publicKey: PublicKey) => void;
    onDisconnect?: () => void;
    onError?: (error: Error) => void;
    onReadyStateChange?: (readyState: WalletReadyState) => void;
}): () => void;

/**
 * Create a simple wallet connection manager
 * @param adapters Array of adapters to manage
 * @param localStorageKey Key to store the selected wallet name
 * @returns Wallet connection manager object
 */
declare function createWalletConnectionManager(adapters: Adapter[], localStorageKey?: string): {
    /**
     * Get the current adapter
     */
    getAdapter: () => Adapter | null;
    /**
     * Select an adapter by wallet name
     */
    selectWallet: (walletName: WalletName | null) => _solana_wallet_adapter_base.WalletAdapter | null;
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
    autoConnect: () => Promise<_solana_wallet_adapter_base.WalletAdapter | null>;
};
/**
 * Class to manage wallet adapters with event emission
 */
declare class WalletAdapterManager extends EventEmitter {
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

/**
 * Account interface for standard wallet accounts
 */
interface StandardWalletAccount {
    address: string;
    publicKey: Uint8Array;
    features: string[];
    [key: string]: any;
}
/**
 * Connect result interface for standard wallet connect method
 */
interface StandardConnectResult {
    accounts: StandardWalletAccount[];
}
/**
 * Connect feature interface for standard wallet
 */
interface StandardConnectFeature {
    connect(): Promise<StandardConnectResult>;
}
/**
 * Disconnect feature interface for standard wallet
 */
interface StandardDisconnectFeature {
    disconnect(): Promise<void>;
}
/**
 * Change event data interface for standard events
 */
interface StandardEventsChangeEvent {
    accounts: StandardWalletAccount[];
}
/**
 * Events feature interface for standard wallet
 */
interface StandardEventsFeature {
    on(eventName: string, listener: (event: StandardEventsChangeEvent) => void): (() => void);
    off?(eventName: string, listener: (event: StandardEventsChangeEvent) => void): void;
    emit?(eventName: string, event: StandardEventsChangeEvent): void;
}
/**
 * Chain identifier for Solana networks
 */
interface SolanaChainIdentifier {
    id: string;
}
/**
 * Transaction parameters for sign transaction method
 */
interface SolanaSignTransactionParams {
    transaction: Uint8Array;
}
/**
 * Transaction result from sign transaction method
 */
interface SolanaSignTransactionResult {
    signedTransaction: Uint8Array;
}
/**
 * Sign transaction feature interface for Solana standard wallet
 */
interface SolanaSignTransactionFeature {
    signTransaction(params: SolanaSignTransactionParams): Promise<SolanaSignTransactionResult>;
    supportedTransactionVersions?: number[];
}
/**
 * Transaction parameters for sign and send transaction method
 */
interface SolanaSignAndSendTransactionParams {
    transaction: Uint8Array;
    chain: SolanaChainIdentifier;
    options?: Record<string, any>;
}
/**
 * Transaction result from sign and send transaction method
 */
interface SolanaSignAndSendTransactionResult {
    signature: Uint8Array;
}
/**
 * Sign and send transaction feature interface for Solana standard wallet
 */
interface SolanaSignAndSendTransactionFeature {
    signAndSendTransaction(params: SolanaSignAndSendTransactionParams): Promise<SolanaSignAndSendTransactionResult>;
    supportedTransactionVersions?: number[];
}
/**
 * Message parameters for sign message method
 */
interface SolanaSignMessageParams {
    message: Uint8Array;
}
/**
 * Message result from sign message method
 */
interface SolanaSignMessageResult {
    signature: Uint8Array;
}
/**
 * Sign message feature interface for Solana standard wallet
 */
interface SolanaSignMessageFeature {
    signMessage(params: SolanaSignMessageParams): Promise<SolanaSignMessageResult>;
}
/**
 * Sign in parameters for sign in method
 */
interface SolanaSignInParams {
    domain?: string;
    statement?: string;
    uri?: string;
    version?: string;
    nonce?: string;
    chainId?: string;
    resources?: string[];
    [key: string]: any;
}
/**
 * Sign in result from sign in method
 */
interface SolanaSignInResult {
    account: StandardWalletAccount;
    signature: Uint8Array;
    signedMessage: Uint8Array;
    [key: string]: any;
}
/**
 * Sign in feature interface for Solana standard wallet
 */
interface SolanaSignInFeature {
    signIn(params?: SolanaSignInParams): Promise<SolanaSignInResult>;
}
declare const StandardConnectMethod = "standard:connect";
declare const StandardDisconnectMethod = "standard:disconnect";
declare const StandardEventsMethod = "standard:events";
declare const SolanaSignTransactionMethod = "solana:signTransaction";
declare const SolanaSignAndSendTransactionMethod = "solana:signAndSendTransaction";
declare const SolanaSignMessageMethod = "solana:signMessage";
declare const SolanaSignInMethod = "solana:signIn";
/**
 * Standard wallet features map interface
 */
interface StandardWalletFeatures {
    [StandardConnectMethod]?: StandardConnectFeature;
    [StandardDisconnectMethod]?: StandardDisconnectFeature;
    [StandardEventsMethod]?: StandardEventsFeature;
    [SolanaSignTransactionMethod]?: SolanaSignTransactionFeature;
    [SolanaSignAndSendTransactionMethod]?: SolanaSignAndSendTransactionFeature;
    [SolanaSignMessageMethod]?: SolanaSignMessageFeature;
    [SolanaSignInMethod]?: SolanaSignInFeature;
    [key: string]: any;
}
/**
 * Standard wallet interface
 */
interface TypedStandardWallet extends Wallet {
    name: string;
    icon: WalletIcon;
    website?: string;
    features: StandardWalletFeatures;
}

type IStandardWalletAdapter = Pick<WalletAdapter, 'name' | 'url' | 'icon' | 'publicKey' | 'connecting' | 'on' | 'off' | 'emit'> & Pick<MessageSignerWalletAdapter, 'signMessage'> & Pick<SignerWalletAdapter, 'signTransaction' | 'signAllTransactions'> & Pick<SignInMessageSignerWalletAdapter, 'signIn'> & {
    connected: boolean;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    sendTransaction(transaction: Transaction | VersionedTransaction, connection: Connection, options?: SendOptions): Promise<TransactionSignature>;
};
/**
 * An adapter that wraps a standard wallet to make it compatible with the Solana wallet adapter interface
 */
declare class StandardWalletAdapter implements IStandardWalletAdapter {
    readonly name: WalletName;
    readonly url: string;
    readonly icon: string;
    readonly readyState: WalletReadyState;
    readonly supportedTransactionVersions: ReadonlySet<TransactionVersion> | null | undefined;
    private _wallet;
    private _publicKey;
    private _connecting;
    private _eventEmitter;
    private _removeAccountChangeListener;
    constructor(wallet: TypedStandardWallet);
    get publicKey(): PublicKey | null;
    get connecting(): boolean;
    get connected(): boolean;
    eventNames(): (keyof WalletAdapterEvents)[];
    listeners<E extends keyof WalletAdapterEvents>(event: E): ((...args: EventEmitter.ArgumentMap<WalletAdapterEvents>[Extract<E, keyof WalletAdapterEvents>]) => void)[];
    listenerCount<E extends keyof WalletAdapterEvents>(event: E): number;
    addListener<E extends keyof WalletAdapterEvents>(event: E, listener: (...args: any[]) => void): this;
    removeListener<E extends keyof WalletAdapterEvents>(event: E, listener: (...args: any[]) => void): this;
    on<E extends keyof WalletAdapterEvents>(event: E, listener: (...args: any[]) => void): this;
    once<E extends keyof WalletAdapterEvents>(event: E, listener: (...args: any[]) => void): this;
    off<E extends keyof WalletAdapterEvents>(event: E, listener: (...args: any[]) => void): this;
    emit<E extends keyof WalletAdapterEvents>(event: E, ...args: EventEmitter.ArgumentMap<WalletAdapterEvents>[Extract<E, keyof WalletAdapterEvents>]): boolean;
    removeAllListeners<E extends keyof WalletAdapterEvents>(event?: E): this;
    autoConnect(): Promise<void>;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    sendTransaction(transaction: Transaction | VersionedTransaction, connection: Connection, options?: SendOptions): Promise<TransactionSignature>;
    signTransaction<T extends Transaction | VersionedTransaction>(transaction: T): Promise<T>;
    signAllTransactions<T extends Transaction | VersionedTransaction>(transactions: T[]): Promise<T[]>;
    signMessage(message: Uint8Array): Promise<Uint8Array>;
    signIn(input?: any): Promise<any>;
}

/**
 * Check if a wallet implements the Wallet Standard interface and has required features
 * @param wallet The wallet to check
 * @returns True if the wallet is wallet standard compatible
 */
declare function isWalletAdapterCompatibleStandardWallet(wallet: Wallet): wallet is TypedStandardWallet;
/**
 * Create a Mobile Wallet Adapter
 * @param endpoint Optional RPC endpoint
 * @returns Mobile wallet adapter or null if not available
 */
declare function createMobileWalletAdapter(endpoint?: string): Promise<Adapter | SolanaMobileWalletAdapter | null>;
/**
 * Get wallet adapters for all available standard wallets
 * @param existingAdapters Existing (non-standard) adapters to include in result
 * @param endpoint Optional endpoint for mobile wallet adapter
 * @returns Array of all adapters including standard wallet adapters
 */
declare function getStandardWalletAdapters(existingAdapters?: Adapter[] | SolanaMobileWalletAdapter[], endpoint?: string): Promise<(Adapter | SolanaMobileWalletAdapter)[]>;
declare function isMobileWalletAdapter(adapter: any): adapter is SolanaMobileWalletAdapter;

export { Environment, type EnvironmentConfig, SolanaMobileWalletAdapterWalletName, SolanaSignAndSendTransactionMethod, SolanaSignInMethod, SolanaSignMessageMethod, SolanaSignTransactionMethod, StandardConnectMethod, StandardDisconnectMethod, StandardEventsMethod, StandardWalletAdapter, WalletAdapterManager, type WalletProvider, addWalletAdapterEventListeners, createLocalStorageUtility, createMobileWalletAdapter, createWalletConnectionManager, getAdaptersByReadyState, getEnvironment, getInferredNetworkFromEndpoint, getIsMobile, getSelectedAdapter, getStandardWalletAdapters, getUriForAppIdentity, getUserAgent, getWalletAdapters, initAdapters, isAndroid, isIOS, isIosAndRedirectable, isMobileDevice, isMobileWalletAdapter, isWalletAdapterCompatibleStandardWallet, selectAdapter, sortWalletAdapters };
