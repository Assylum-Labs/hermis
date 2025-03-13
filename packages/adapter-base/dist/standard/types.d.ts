import { Wallet, WalletIcon } from "@wallet-standard/base";
/**
 * Account interface for standard wallet accounts
 */
export interface StandardWalletAccount {
    address: string;
    publicKey: Uint8Array;
    features: string[];
    [key: string]: any;
}
/**
 * Connect result interface for standard wallet connect method
 */
export interface StandardConnectResult {
    accounts: StandardWalletAccount[];
}
/**
 * Connect feature interface for standard wallet
 */
export interface StandardConnectFeature {
    connect(): Promise<StandardConnectResult>;
}
/**
 * Disconnect feature interface for standard wallet
 */
export interface StandardDisconnectFeature {
    disconnect(): Promise<void>;
}
/**
 * Change event data interface for standard events
 */
export interface StandardEventsChangeEvent {
    accounts: StandardWalletAccount[];
}
/**
 * Events feature interface for standard wallet
 */
export interface StandardEventsFeature {
    on(eventName: string, listener: (event: StandardEventsChangeEvent) => void): (() => void);
    off?(eventName: string, listener: (event: StandardEventsChangeEvent) => void): void;
    emit?(eventName: string, event: StandardEventsChangeEvent): void;
}
/**
 * Chain identifier for Solana networks
 */
export interface SolanaChainIdentifier {
    id: string;
}
/**
 * Transaction parameters for sign transaction method
 */
export interface SolanaSignTransactionParams {
    transaction: Uint8Array;
}
/**
 * Transaction result from sign transaction method
 */
export interface SolanaSignTransactionResult {
    signedTransaction: Uint8Array;
}
/**
 * Sign transaction feature interface for Solana standard wallet
 */
export interface SolanaSignTransactionFeature {
    signTransaction(params: SolanaSignTransactionParams): Promise<SolanaSignTransactionResult>;
    supportedTransactionVersions?: number[];
}
/**
 * Transaction parameters for sign and send transaction method
 */
export interface SolanaSignAndSendTransactionParams {
    transaction: Uint8Array;
    chain: SolanaChainIdentifier;
    options?: Record<string, any>;
}
/**
 * Transaction result from sign and send transaction method
 */
export interface SolanaSignAndSendTransactionResult {
    signature: Uint8Array;
}
/**
 * Sign and send transaction feature interface for Solana standard wallet
 */
export interface SolanaSignAndSendTransactionFeature {
    signAndSendTransaction(params: SolanaSignAndSendTransactionParams): Promise<SolanaSignAndSendTransactionResult>;
    supportedTransactionVersions?: number[];
}
/**
 * Message parameters for sign message method
 */
export interface SolanaSignMessageParams {
    message: Uint8Array;
}
/**
 * Message result from sign message method
 */
export interface SolanaSignMessageResult {
    signature: Uint8Array;
}
/**
 * Sign message feature interface for Solana standard wallet
 */
export interface SolanaSignMessageFeature {
    signMessage(params: SolanaSignMessageParams): Promise<SolanaSignMessageResult>;
}
/**
 * Sign in parameters for sign in method
 */
export interface SolanaSignInParams {
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
export interface SolanaSignInResult {
    account: StandardWalletAccount;
    signature: Uint8Array;
    signedMessage: Uint8Array;
    [key: string]: any;
}
/**
 * Sign in feature interface for Solana standard wallet
 */
export interface SolanaSignInFeature {
    signIn(params?: SolanaSignInParams): Promise<SolanaSignInResult>;
}
export declare const StandardConnectMethod = "standard:connect";
export declare const StandardDisconnectMethod = "standard:disconnect";
export declare const StandardEventsMethod = "standard:events";
export declare const SolanaSignTransactionMethod = "solana:signTransaction";
export declare const SolanaSignAndSendTransactionMethod = "solana:signAndSendTransaction";
export declare const SolanaSignMessageMethod = "solana:signMessage";
export declare const SolanaSignInMethod = "solana:signIn";
export type StandardWalletMethod = typeof StandardConnectMethod | typeof StandardDisconnectMethod | typeof StandardEventsMethod | typeof SolanaSignTransactionMethod | typeof SolanaSignAndSendTransactionMethod | typeof SolanaSignMessageMethod | typeof SolanaSignInMethod;
/**
 * Standard wallet features map interface
 */
export interface StandardWalletFeatures {
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
export interface TypedStandardWallet extends Wallet {
    name: string;
    icon: WalletIcon;
    website?: string;
    features: StandardWalletFeatures;
}
