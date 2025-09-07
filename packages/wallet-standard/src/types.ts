import { Wallet, WalletIcon, WalletAccount, IdentifierArray } from "@wallet-standard/base";
import { Adapter } from '@hermis/solana-headless-core';
import { SolanaMobileWalletAdapter } from '@solana-mobile/wallet-adapter-mobile';

/**
 * UI representation of a wallet account with enhanced type safety
 */
export interface UiWalletAccount extends WalletAccount {
  address: string;
  publicKey: Uint8Array;
  chains: IdentifierArray;
  features: IdentifierArray;
  label?: string;
  icon?: WalletIcon;
}

/**
 * Account interface for standard wallet accounts
 */
export interface StandardWalletAccount {
  address: string;
  publicKey: Uint8Array;
  features: string[];
  chains?: string[];
  label?: string;
  // Additional properties may be present
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
  id: string; // e.g. 'solana:mainnet-beta'
}

/**
 * Transaction parameters for sign transaction method
 */
export interface SolanaSignTransactionParams {
  transaction: Uint8Array;
  account: StandardWalletAccount;
  chain?: string;
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
  account: StandardWalletAccount;
  transaction: Uint8Array;
  chain: string | string[];
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
  signAndSendTransaction(params: SolanaSignAndSendTransactionParams): Promise<SolanaSignAndSendTransactionResult[]>;
  supportedTransactionVersions?: number[];
}

/**
 * Message parameters for sign message method
 */
export interface SolanaSignMessageParams {
  account: StandardWalletAccount;
  message: Uint8Array;
}

/**
 * Message result from sign message method
 */
export interface SolanaSignMessageResult {
  signature: Uint8Array;
  signedMessage: Uint8Array;
}

/**
 * Sign message feature interface for Solana standard wallet
 */
export interface SolanaSignMessageFeature {
  signMessage(params: SolanaSignMessageParams): Promise<SolanaSignMessageResult[]>;
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
// Constants for standard method names
export const StandardConnectMethod = 'standard:connect';
export const StandardDisconnectMethod = 'standard:disconnect';
export const StandardEventsMethod = 'standard:events';
export const SolanaSignTransactionMethod = 'solana:signTransaction';
export const SolanaSignAndSendTransactionMethod = 'solana:signAndSendTransaction';
export const SolanaSignMessageMethod = 'solana:signMessage';
export const SolanaSignInMethod = 'solana:signIn';

export type StandardWalletMethod =
  | typeof StandardConnectMethod
  | typeof StandardDisconnectMethod
  | typeof StandardEventsMethod
  | typeof SolanaSignTransactionMethod
  | typeof SolanaSignAndSendTransactionMethod
  | typeof SolanaSignMessageMethod
  | typeof SolanaSignInMethod;

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
 * UI representation of a wallet with enhanced features
 */
export interface UiWallet {
  name: string;
  icon: string | WalletIcon;
  chains: string[];
  features: string[];
  accounts: UiWalletAccount[];
  version?: string;
  website?: string;
}

/**
 * Standard wallet interface with typed features
 */
export interface TypedStandardWallet extends Wallet {
  name: string;
  icon: WalletIcon;
  website?: string;
  features: StandardWalletFeatures;
  accounts: ReadonlyArray<WalletAccount>;
  chains: IdentifierArray;
  version: "1.0.0";
}

/**
 * Wallet with UI enhancements
 */
export interface UiStandardWallet extends TypedStandardWallet {
  uiAccounts?: UiWalletAccount[];
  isConnecting?: boolean;
  isConnected?: boolean;
}

/**
 * Wallet registry entry
 */
export interface WalletRegistryEntry {
  wallet: TypedStandardWallet;
  adapter?: any; // StandardWalletAdapter instance
  registeredAt: number;
  lastUsed?: number;
}

/**
 * Check if a wallet is compatible with the wallet adapter
 */
export function isWalletAdapterCompatibleStandardWallet(
  wallet: TypedStandardWallet
): wallet is TypedStandardWallet {
  return (
    StandardConnectMethod in wallet.features &&
    StandardEventsMethod in wallet.features &&
    (SolanaSignAndSendTransactionMethod in wallet.features || SolanaSignTransactionMethod in wallet.features)
  );
}

/**
 * Convert a standard account to a UI account
 */
export function toUiWalletAccount(account: StandardWalletAccount): UiWalletAccount {
  // Convert chains and features to IdentifierArray format
  const chains = (account.chains || ['solana:mainnet-beta']) as IdentifierArray;
  const features = (account.features || ['solana:publicKey']) as IdentifierArray;
  
  return {
    address: account.address,
    publicKey: account.publicKey,
    chains,
    features,
    label: account.label,
    icon: undefined
  };
}

/**
 * Convert a wallet to a UI wallet representation
 */
export function toUiWallet(wallet: TypedStandardWallet): UiWallet {
  // Convert WalletAccount to StandardWalletAccount for mapping
  const accounts = wallet.accounts.map((acc: WalletAccount) => {
    const standardAccount: StandardWalletAccount = {
      address: acc.address,
      publicKey: new Uint8Array(acc.publicKey),
      features: Array.from(acc.features || []),
      chains: Array.from(acc.chains || []),
      label: (acc as any).label
    };
    return standardAccount;
  });
  
  return {
    name: wallet.name,
    icon: wallet.icon,
    chains: Array.from(wallet.chains) as string[],
    features: Object.keys(wallet.features),
    accounts: accounts.map(toUiWalletAccount),
    version: wallet.version,
    website: wallet.website
  };
}

/**
 * Environment detection enum
 */
export enum Environment {
  DESKTOP_WEB,
  MOBILE_WEB,
}

/**
 * Configuration for environment detection
 */
export interface EnvironmentConfig {
  adapters: (Adapter | SolanaMobileWalletAdapter)[];
  userAgentString: string | null;
}