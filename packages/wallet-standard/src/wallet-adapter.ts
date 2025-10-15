import {
  WalletReadyState,
  WalletName,
  WalletAdapterEvents,
  MessageSignerWalletAdapter,
  SignerWalletAdapter,
  SignInMessageSignerWalletAdapter,
  SupportedTransactionVersions,
  WalletAdapter,
  WalletError,
  EventEmitter
} from '@solana/wallet-adapter-base';

import {
  Connection,
  PublicKey,
  SendOptions,
  Transaction,
  VersionedTransaction,
  TransactionSignature,
  TransactionVersion,
} from '@solana/web3.js';

import type { DualConnection, DualTransaction } from '@hermis/solana-headless-core';
import { getLatestBlockhash, sendRawTransaction, serializeTransactionForWallet, isTransactionSigned } from '@hermis/solana-headless-core';
import {
  HermisError,
  HERMIS_ERROR__WALLET_CONNECTION__NOT_CONNECTED,
  HERMIS_ERROR__STANDARD_WALLET__FEATURE_NOT_FOUND,
  HERMIS_ERROR__STANDARD_WALLET__ACCOUNT_NOT_FOUND,
  HERMIS_ERROR__TRANSACTION__SERIALIZATION_FAILED,
  HERMIS_ERROR__WALLET_CONNECTION__NO_PUBLIC_KEY
} from '@hermis/errors';

// Removed coreSignMessage import to avoid circular dependency
// The centralized signMessage is for external use, not internal adapter implementation

import {
  isWalletAdapterCompatibleStandardWallet,
  StandardConnectMethod,
  StandardDisconnectMethod,
  StandardEventsMethod,
  SolanaSignAndSendTransactionMethod,
  SolanaSignTransactionMethod,
  SolanaSignMessageMethod,
  SolanaSignInMethod
} from './types.js';
import {
  TypedStandardWallet,
  StandardConnectFeature,
  StandardEventsFeature,
  StandardDisconnectFeature,
  SolanaSignTransactionFeature,
  SolanaSignAndSendTransactionFeature,
  SolanaSignMessageFeature,
  SolanaSignInFeature,
  StandardWalletAccount,
  StandardEventsChangeEvent
} from './types.js';
import { WalletAccount } from '@wallet-standard/base';
import {
  detectClusterFromEndpoint,
  ClusterMismatchError
} from './utils.js';

import bs58 from 'bs58';

import {
  signMessage as coreSignMessage,
  signTransaction as coreSignTransaction,
  sendTransaction as coreSendTransaction,
  signAndSendTransaction as coreSignAndSendTransaction
} from '@hermis/solana-headless-core';

type IStandardWalletAdapter =
  Pick<WalletAdapter, 'name' | 'url' | 'icon' | 'publicKey' | 'connecting' | 'on' | 'off' | 'emit'> &
  Pick<MessageSignerWalletAdapter, 'signMessage'> &
  Omit<Pick<SignerWalletAdapter, 'signTransaction' | 'signAllTransactions'>, 'signTransaction' | 'signAllTransactions'> &
  Pick<SignInMessageSignerWalletAdapter, 'signIn'> & {

    connected: boolean;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    signTransaction<T extends DualTransaction>(transaction: T): Promise<T>;
    signAllTransactions<T extends DualTransaction>(transactions: T[]): Promise<T[]>;
    sendTransaction(
      transaction: DualTransaction,
      connection?: DualConnection,
      options?: SendOptions
    ): Promise<TransactionSignature>;
    signAndSendTransaction(
      transaction: DualTransaction,
      connection: DualConnection,
      options?: SendOptions
    ): Promise<TransactionSignature>;
  };

/**
 * An adapter that wraps a standard wallet to make it compatible with the Solana wallet adapter interface
 */
export class StandardWalletAdapter implements IStandardWalletAdapter {
  readonly name: WalletName;
  readonly url: string;
  readonly icon: string;
  readonly readyState: WalletReadyState = WalletReadyState.Installed;
  readonly supportedTransactionVersions: ReadonlySet<TransactionVersion> | null | undefined

  private _wallet: TypedStandardWallet;
  private _publicKey: PublicKey | null = null;
  private _connecting = false;
  private _eventEmitter = new EventEmitter<WalletAdapterEvents>();
  private _removeAccountChangeListener: (() => void) | null = null;
  private _connectedAccount: StandardWalletAccount[] | null = null;
  private _currentCluster: string | null = null;
  private _rpcEndpoint: string | null = null;

  constructor(wallet: TypedStandardWallet) {
    if (!isWalletAdapterCompatibleStandardWallet(wallet)) {
      throw new Error('Wallet is not adapter compatible');
    }

    this._wallet = wallet;
    this.name = wallet.name as WalletName;
    this.url = wallet.website || '';
    this.icon = wallet.icon || '';

    // Setup account change listener - following official wallet-standard pattern
    if (StandardEventsMethod in wallet.features) {
      try {
        const events = wallet.features[StandardEventsMethod] as StandardEventsFeature;
        if (events && typeof events.on === 'function') {
          this._removeAccountChangeListener = events.on('change', this._handleWalletChange.bind(this));
        }
      } catch (error) {
        console.error('Error setting up account change listener', error);
      }
    }

    // Initialize supported transaction versions
    this._resetSupportedFeatures();
  }

  /**
   * Handle wallet change events (account switches, feature updates, etc.)
   * Following the official wallet-standard pattern
   */
  private _handleWalletChange(properties: StandardEventsChangeEvent): void {
    try {
      // Handle account changes (user switched accounts in wallet extension)
      if ('accounts' in properties) {
        const account = this._wallet.accounts[0]; // Wallets only expose current active account

        // Check if account reference changed (not just value)
        // Use object reference equality like official implementation
        if (this._connectedAccount && this._connectedAccount.length > 0 && account !== this._connectedAccount[0]) {
          if (account) {
            // Account switched - treat as new connection
            this._handleConnected(account);
          } else {
            // Account removed - disconnect
            this._handleDisconnected();
          }
        }
      }

      // Handle feature changes
      if ('features' in properties) {
        this._resetSupportedFeatures();
      }
    } catch (error) {
      console.error('Error handling wallet change event', error);
      this._eventEmitter.emit('error', new WalletError('Error handling wallet event'));
    }
  }

  /**
   * Handle successful account connection
   * Updates internal state and emits connect event
   * @param account - Account from wallet (WalletAccount from @wallet-standard/base)
   */
  private _handleConnected(account: WalletAccount): void {
    try {
      // Use account.address (could be PDA), not account.publicKey
      const publicKey = new PublicKey(account.address);

      // Convert WalletAccount to StandardWalletAccount for internal storage
      const standardAccount: StandardWalletAccount = {
        address: account.address,
        publicKey: new Uint8Array(account.publicKey), // Convert ReadonlyUint8Array to Uint8Array
        features: account.features as string[],
        chains: account.chains as string[],
        label: account.label,
        icon: account.icon,
      };

      // Update state
      this._connectedAccount = [standardAccount];
      this._publicKey = publicKey;
      this._resetSupportedFeatures();

      // Emit connect event (used for both initial connection and account switches)
      this._eventEmitter.emit('connect', publicKey);
    } catch (error: any) {
      console.error('Error in _handleConnected', error);
      throw new WalletError(`Failed to connect account: ${error.message}`);
    }
  }

  /**
   * Handle disconnection
   */
  private _handleDisconnected(): void {
    this._connectedAccount = null;
    this._publicKey = null;
    this._resetSupportedFeatures();
    this._eventEmitter.emit('disconnect');
  }

  /**
   * Reset and update supported transaction versions and features
   */
  private _resetSupportedFeatures(): void {
    // Extract supported transaction versions
    if (SolanaSignAndSendTransactionMethod in this._wallet.features) {
      try {
        const feature = this._wallet.features[SolanaSignAndSendTransactionMethod] as SolanaSignAndSendTransactionFeature;
        if (feature?.supportedTransactionVersions) {
          const versions = feature.supportedTransactionVersions;
          // Cast to mutable to bypass readonly constraint
          (this as any).supportedTransactionVersions = new Set(versions) as ReadonlySet<TransactionVersion>;
        }
      } catch (error) {
        console.warn('Error extracting supportedTransactionVersions from signAndSendTransaction', error);
      }
    } else if (SolanaSignTransactionMethod in this._wallet.features) {
      try {
        const feature = this._wallet.features[SolanaSignTransactionMethod] as SolanaSignTransactionFeature;
        if (feature?.supportedTransactionVersions) {
          const versions = feature.supportedTransactionVersions;
          // Cast to mutable to bypass readonly constraint
          (this as any).supportedTransactionVersions = new Set(versions) as ReadonlySet<TransactionVersion>;
        }
      } catch (error) {
        console.warn('Error extracting supportedTransactionVersions from signTransaction', error);
      }
    }
  }

  get publicKey(): PublicKey | null {
    return this._publicKey;
  }

  get connecting(): boolean {
    return this._connecting;
  }

  get connected(): boolean {
    return !!this._publicKey;
  }

  /**
   * Helper to get the current connected account
   */
  private _findAccount(): StandardWalletAccount {
    if (!this._connectedAccount || this._connectedAccount.length === 0) {
      throw new HermisError(
        HERMIS_ERROR__STANDARD_WALLET__ACCOUNT_NOT_FOUND,
        { walletName: this._wallet.name }
      );
    }

    return this._connectedAccount[0];
  }

  // Standard EventEmitter interface implementation
  eventNames() {
    return this._eventEmitter.eventNames();
  }

  listeners<E extends keyof WalletAdapterEvents>(event: E) {
    return this._eventEmitter.listeners(event);
  }

  listenerCount<E extends keyof WalletAdapterEvents>(event: E) {
    return this._eventEmitter.listenerCount(event);
  }

  addListener<E extends keyof WalletAdapterEvents>(event: E, listener: (...args: any[]) => void) {
    this._eventEmitter.addListener(event, listener);
    return this;
  }

  removeListener<E extends keyof WalletAdapterEvents>(event: E, listener: (...args: any[]) => void) {
    this._eventEmitter.removeListener(event, listener);
    return this;
  }

  on<E extends keyof WalletAdapterEvents>(event: E, listener: (...args: any[]) => void): this {
    this._eventEmitter.on(event, listener);
    return this;
  }

  once<E extends keyof WalletAdapterEvents>(event: E, listener: (...args: any[]) => void): this {
    this._eventEmitter.once(event, listener);
    return this;
  }

  off<E extends keyof WalletAdapterEvents>(event: E, listener: (...args: any[]) => void): this {
    this._eventEmitter.off(event, listener);
    return this;
  }

  emit<E extends keyof WalletAdapterEvents>(event: E, ...args: EventEmitter.ArgumentMap<WalletAdapterEvents>[Extract<E, keyof WalletAdapterEvents>]): boolean {
    return this._eventEmitter.emit(event, ...args);
  }

  removeAllListeners<E extends keyof WalletAdapterEvents>(event?: E): this {
    this._eventEmitter.removeAllListeners(event);
    return this;
  }

  async autoConnect(): Promise<void> {
    try {
      await this.connect();
    } catch (error) {
      console.error('Error in autoConnect', error);
      throw error;
    }
  }

  async connect(): Promise<void> {
    try {
      if (this.connected || this.connecting) {
        console.log("DEBUG connected:", this.connected);
        console.log("DEBUG connecting:", this.connecting);
        return;
      }
      this._connecting = true;

      
      if (!(StandardConnectMethod in this._wallet.features)) {
        throw new Error('Wallet does not support connect feature');
      }

      const connectFeature = this._wallet.features[StandardConnectMethod] as StandardConnectFeature;
      if (!connectFeature || typeof connectFeature.connect !== 'function') {
        throw new Error('Wallet has invalid connect feature');
      }

      const connectResult = await connectFeature.connect();

      console.log("DEBUG connectResult", connectResult);

      if (!connectResult || !connectResult.accounts || !Array.isArray(connectResult.accounts)) {
        throw new Error('Invalid connect result from wallet');
      }

      // Wallet Standard only exposes the currently active account
      // Note: This comes from @wallet-standard/base as WalletAccount
      const account: WalletAccount = connectResult.accounts[0] as unknown as WalletAccount;

      if (!account) {
        throw new Error('No accounts found from wallet');
      }

      if (!account.address && !account.publicKey) {
        throw new Error('Account has no address or publicKey');
      }

      // Use the centralized connection handler
      this._handleConnected(account);
    } catch (error: any) {
      console.error('Error connecting to wallet', error);
      this._eventEmitter.emit('error', error);
      throw error;
    } finally {
      this._connecting = false;
    }
  }

  async disconnect(): Promise<void> {
    try {
      // Call wallet's disconnect if supported
      if (StandardDisconnectMethod in this._wallet.features) {
        const disconnectFeature = this._wallet.features[StandardDisconnectMethod] as StandardDisconnectFeature;
        if (disconnectFeature && typeof disconnectFeature.disconnect === 'function') {
          try {
            await disconnectFeature.disconnect();
          } catch (error: any) {
            console.error('Error disconnecting wallet', error);
            this._eventEmitter.emit('error', error);
          }
        }
      }

      // Use centralized disconnection handler
      this._handleDisconnected();

      // Note: We don't remove the account change listener here
      // It stays active even when disconnected, ready for reconnection
    } catch (error: any) {
      console.error('Error in disconnect', error);
      this._eventEmitter.emit('error', error);
      throw error;
    }
  }

  async sendTransaction(
    transaction: DualTransaction,
    connection?: DualConnection,
    options: SendOptions = {}
  ): Promise<TransactionSignature> {
    if (!this.connected) {
      throw new HermisError(
        HERMIS_ERROR__WALLET_CONNECTION__NOT_CONNECTED,
        { walletName: this._wallet.name }
      );
    }

    if (!this.publicKey) {
      throw new HermisError(
        HERMIS_ERROR__WALLET_CONNECTION__NO_PUBLIC_KEY,
        { walletName: this._wallet.name }
      );
    }

    try {
      // Path 1: If connection is provided, delegate to core for sign + send
      if (connection) {
        console.log('🔍 [StandardWalletAdapter.sendTransaction] Received transaction:', transaction);
        console.log('🔍 [StandardWalletAdapter.sendTransaction] Transaction type:', transaction.constructor.name);
        // console.log('🔍 [StandardWalletAdapter.sendTransaction] Transaction.signatures:', transaction.signatures);

        // Set recent blockhash if not already set (for legacy Transaction)
        if (transaction instanceof Transaction && !transaction.recentBlockhash) {
          const { blockhash } = await getLatestBlockhash(connection, options.preflightCommitment);
          transaction.recentBlockhash = blockhash;
        }

        // Check if transaction is already signed
        // Note: Don't use instanceof - it fails with bundling/prototype issues
        console.log('🔍 [StandardWalletAdapter.sendTransaction] About to check if signed...');
        const isSigned = isTransactionSigned(transaction as any);
        console.log(`🔍 [StandardWalletAdapter.sendTransaction] isSigned result: ${isSigned}`);

        let rawTransaction: Uint8Array;

        if (isSigned) {
          console.log('✅ [StandardWalletAdapter.sendTransaction] Transaction is SIGNED - sending directly without wallet prompt');
          // Transaction is already signed - serialize and send directly (no wallet prompt)
          if (transaction instanceof Transaction) {
            rawTransaction = transaction.serialize();
          } else if (transaction instanceof VersionedTransaction) {
            rawTransaction = transaction.serialize();
          } else if (typeof (transaction as any).serialize === 'function') {
            rawTransaction = (transaction as any).serialize();
          } else {
            throw new Error('Signed transaction does not have a serialize method');
          }
        } else {
          console.log('⚠️ [StandardWalletAdapter.sendTransaction] Transaction is UNSIGNED - signing first (will prompt wallet)');
          // Transaction is unsigned - sign it first using core
          const dualOptions = {
            chain: this._currentCluster || 'solana:mainnet'
          };

          // Sign the transaction using core (which handles Standard Wallet)
          const signedTransaction = await coreSignTransaction(transaction, this._wallet, dualOptions);

          // Serialize the signed transaction
          if (signedTransaction instanceof Transaction) {
            rawTransaction = signedTransaction.serialize();
          } else if (signedTransaction instanceof VersionedTransaction) {
            rawTransaction = signedTransaction.serialize();
          } else if (typeof (signedTransaction as any).serialize === 'function') {
            // Kit TransactionMessage or other signable transaction
            rawTransaction = (signedTransaction as any).serialize();
          } else {
            throw new Error('Signed transaction does not have a serialize method');
          }
        }

        return await sendRawTransaction(connection, rawTransaction, options);
      }

      // Path 2: If no connection, use wallet's signAndSendTransaction feature
      return await this._sendTransactionWithWallet(transaction, options);
    } catch (error: any) {
      const walletError = this._handleTransactionError(error, 'sendTransaction');
      console.error('Error in sendTransaction', error);
      this._eventEmitter.emit('error', walletError);
      throw walletError;
    }
  }

  /**
   * Send transaction using wallet's signAndSendTransaction feature
   */
  private async _sendTransactionWithWallet(
    transaction: DualTransaction,
    options: SendOptions
  ): Promise<TransactionSignature> {
    try {
      // Validate that wallet supports signAndSendTransaction
      if (!(SolanaSignAndSendTransactionMethod in this._wallet.features)) {
        throw new HermisError(
          HERMIS_ERROR__STANDARD_WALLET__FEATURE_NOT_FOUND,
          { featureName: 'signAndSendTransaction', walletName: this._wallet.name }
        );
      }

      const feature = this._wallet.features[SolanaSignAndSendTransactionMethod] as SolanaSignAndSendTransactionFeature;
      if (!feature || typeof feature.signAndSendTransaction !== 'function') {
        throw new HermisError(
          HERMIS_ERROR__STANDARD_WALLET__FEATURE_NOT_FOUND,
          { featureName: 'signAndSendTransaction', walletName: this._wallet.name }
        );
      }

      // Get the account to use
      const signingAccount = this._findAccount();
      const accountPublicKey = new PublicKey(signingAccount.publicKey);

      // Prepare the transaction (only set feePayer on legacy Transaction, not Kit TransactionMessage)
      if (transaction instanceof Transaction) {
        if (!transaction.feePayer) {
          transaction.feePayer = accountPublicKey;
        }
        // Note: For wallet-based sending, we don't set blockhash as the wallet should handle this
      }

      // Serialize transaction for wallet (handles Transaction, VersionedTransaction, and Kit TransactionMessage)
      let transactionBytes: Uint8Array;
      try {
        transactionBytes = serializeTransactionForWallet(transaction);
      } catch (error) {
        throw new HermisError(
          HERMIS_ERROR__TRANSACTION__SERIALIZATION_FAILED,
          {
            transactionType: transaction instanceof Transaction ? 'Transaction' : transaction instanceof VersionedTransaction ? 'VersionedTransaction' : 'Kit TransactionMessage',
            reason: 'Failed to serialize for Standard Wallet',
            originalError: error instanceof Error ? error.message : String(error)
          },
          error instanceof Error ? error : undefined
        );
      }

      // Determine chain based on current cluster or default to mainnet
      const chain = this._currentCluster || 'solana:mainnet-beta';

      // Call wallet's signAndSendTransaction with the specified account
      const result = await feature.signAndSendTransaction({
        transaction: transactionBytes,
        chain,
        account: signingAccount,
        options
      });

      // Validate result
      if (!result || !Array.isArray(result) || result.length === 0) {
        throw new Error('No result returned from wallet signAndSendTransaction');
      }

      if (!result[0].signature) {
        throw new Error('No signature returned from wallet signAndSendTransaction');
      }

      // Convert signature to base58
      try {
        return bs58.encode(result[0].signature);
      } catch (error) {
        throw new Error(`Failed to encode transaction signature: ${error instanceof Error ? error.message : error}`);
      }
    } catch (error: any) {
      throw new Error(`Failed to send transaction with wallet: ${error.message || error}`);
    }
  }

  async signAndSendTransaction(
    transaction: DualTransaction,
    connection: DualConnection,
    options: SendOptions = {}
  ): Promise<TransactionSignature> {
    if (!this.connected) {
      throw new HermisError(
        HERMIS_ERROR__WALLET_CONNECTION__NOT_CONNECTED,
        { walletName: this._wallet.name }
      );
    }

    try {
      // Delegate to core implementation which will:
      // 1. Detect that this._wallet is a Standard Wallet
      // 2. Try to use the wallet's signAndSendTransaction feature if available
      // 3. Otherwise, fall back to sign then send separately
      // 4. Handle setting feePayer, getting blockhash (using helper for dual connection support), serialization, and sending
      // Note: We pass the chain from current cluster for Standard Wallet operations
      const dualOptions = {
        chain: this._currentCluster || 'solana:mainnet'
      };

      return await coreSignAndSendTransaction(connection, transaction, this._wallet, dualOptions);
    } catch (error: any) {
      console.error('Error in signAndSendTransaction', error);
      this._eventEmitter.emit('error', error);
      throw error;
    }
  }

  async signTransaction<T extends DualTransaction>(
    transaction: T
  ): Promise<T> {
    if (!this.connected) {
      throw new HermisError(
        HERMIS_ERROR__WALLET_CONNECTION__NOT_CONNECTED,
        { walletName: this._wallet.name }
      );
    }

    try {
      // Delegate to core implementation which handles Standard Wallet detection and signing
      // The core function will:
      // 1. Detect that this._wallet is a Standard Wallet (has "features" property)
      // 2. Get the account from this._wallet.accounts[0]
      // 3. Set feePayer if needed
      // 4. Serialize the transaction
      // 5. Call the wallet's signTransaction feature
      // 6. Deserialize and return the signed transaction
      return await coreSignTransaction(transaction, this._wallet) as T;
    } catch (error: any) {
      console.error('Error in signTransaction', error);
      this._eventEmitter.emit('error', error);
      throw error;
    }
  }

  async signAllTransactions<T extends DualTransaction>(
    transactions: T[]
  ): Promise<T[]> {
    if (!this.connected) {
      throw new HermisError(
        HERMIS_ERROR__WALLET_CONNECTION__NOT_CONNECTED,
        { walletName: this._wallet.name }
      );
    }

    try {
      // Process each transaction sequentially
      const signedTransactions: T[] = [];
      for (const transaction of transactions) {
        signedTransactions.push(await this.signTransaction(transaction));
      }
      return signedTransactions;
    } catch (error: any) {
      console.error('Error in signAllTransactions', error);
      this._eventEmitter.emit('error', error);
      throw error;
    }
  }

  async signMessage(message: Uint8Array): Promise<Uint8Array> {
    console.log("DEBUG wallet", this._wallet);
    if (!this.connected) {
      throw new HermisError(
        HERMIS_ERROR__WALLET_CONNECTION__NOT_CONNECTED,
        { walletName: this._wallet.name }
      );
    }

    try {
      return await coreSignMessage(message, this._wallet);
      // Direct implementation to avoid circular dependency with centralized signMessage
      // The centralized signMessage is designed for external callers, not internal adapter use

      // if (!(SolanaSignMessageMethod in this._wallet.features)) {
      //   throw new Error('Wallet does not support signing messages');
      // }

      // const feature = this._wallet.features[SolanaSignMessageMethod] as SolanaSignMessageFeature;
      // if (!feature || typeof feature.signMessage !== 'function') {
      //   throw new Error('Wallet has invalid signMessage feature');
      // }

      // const result = await feature.signMessage({
      //   message,
      //   account: this._connectedAccount![0]
      // });

      // if (!result || result.length < 1 || !result[0].signature) {
      //   throw new Error('No signature returned from signMessage');
      // }

      // return result[0].signature;
    } catch (error: any) {
      console.error('Error in signMessage', error);
      this._eventEmitter.emit('error', error);
      throw error;
    }
  }

  async signIn(input?: any): Promise<any> {
    if (!this.connected) {
      throw new HermisError(
        HERMIS_ERROR__WALLET_CONNECTION__NOT_CONNECTED,
        { walletName: this._wallet.name }
      );
    }

    try {
      if (!(SolanaSignInMethod in this._wallet.features)) {
        throw new HermisError(
          HERMIS_ERROR__STANDARD_WALLET__FEATURE_NOT_FOUND,
          { featureName: 'signIn', walletName: this._wallet.name }
        );
      }

      const feature = this._wallet.features[SolanaSignInMethod] as SolanaSignInFeature;
      if (!feature || typeof feature.signIn !== 'function') {
        throw new HermisError(
          HERMIS_ERROR__STANDARD_WALLET__FEATURE_NOT_FOUND,
          { featureName: 'signIn', walletName: this._wallet.name }
        );
      }

      return await feature.signIn(input);
    } catch (error: any) {
      console.error('Error in signIn', error);
      this._eventEmitter.emit('error', error);
      throw error;
    }
  }

  /**
   * Set the current RPC endpoint for cluster detection
   */
  setRpcEndpoint(endpoint: string): void {
    this._rpcEndpoint = endpoint;
    this._currentCluster = detectClusterFromEndpoint(endpoint);
  }

  /**
   * Get current cluster
   */
  getCurrentCluster(): string | null {
    return this._currentCluster;
  }

  /**
   * Enhanced error handler that detects cluster mismatches
   */
  private _handleTransactionError(error: any, operation: string): WalletError {
    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    
    // Check for common account not found errors
    if (
      errorMessage.includes('Account not found') ||
      errorMessage.includes('AccountNotFound') ||
      errorMessage.includes('could not find account') ||
      errorMessage.includes('Invalid account owner')
    ) {
      if (this._publicKey && this._currentCluster) {
        const clusterError = ClusterMismatchError.createAccountNotFoundError(
          this._currentCluster,
          this._publicKey.toBase58()
        );
        return new WalletError(clusterError.message, clusterError);
      }
    }
    
    // Check for transaction-related cluster errors
    if (
      errorMessage.includes('Transaction simulation failed') ||
      errorMessage.includes('Insufficient funds') ||
      errorMessage.includes('blockhash not found')
    ) {
      if (this._publicKey && this._currentCluster) {
        const clusterError = ClusterMismatchError.createTransactionError(
          this._currentCluster,
          this._publicKey.toBase58()
        );
        return new WalletError(clusterError.message, clusterError);
      }
    }
    
    // Default error handling
    return new WalletError(`${operation} failed: ${errorMessage}`, error);
  }
}