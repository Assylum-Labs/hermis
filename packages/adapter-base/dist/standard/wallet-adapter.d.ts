import { WalletReadyState, WalletName, Connection, PublicKey, SendOptions, Transaction, VersionedTransaction, TransactionSignature, TransactionVersion, WalletAdapterEvents, MessageSignerWalletAdapter, SignerWalletAdapter, SignInMessageSignerWalletAdapter, WalletAdapter, EventEmitter } from '@agateh/solana-headless-core';
import { TypedStandardWallet } from './types.js';
interface IStandardWalletAdapter extends WalletAdapter, SignerWalletAdapter, MessageSignerWalletAdapter, SignInMessageSignerWalletAdapter {
}
/**
 * An adapter that wraps a standard wallet to make it compatible with the Solana wallet adapter interface
 */
export declare class StandardWalletAdapter implements IStandardWalletAdapter {
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
export {};
