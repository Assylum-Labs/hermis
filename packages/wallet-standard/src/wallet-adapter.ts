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
} from '@hermis/solana-headless-adapter-base';

import {
  Connection,
  PublicKey,
  SendOptions,
  Transaction,
  VersionedTransaction,
  TransactionSignature,
  TransactionVersion,
} from '@solana/web3.js';

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
import {
  detectClusterFromEndpoint,
  ClusterMismatchError
} from './utils.js';

import bs58 from 'bs58';

import { signMessage as coreSignMessage } from '@hermis/solana-headless-core';

type IStandardWalletAdapter =
  Pick<WalletAdapter, 'name' | 'url' | 'icon' | 'publicKey' | 'connecting' | 'on' | 'off' | 'emit'> &
  Pick<MessageSignerWalletAdapter, 'signMessage'> &
  Pick<SignerWalletAdapter, 'signTransaction' | 'signAllTransactions'> &
  Pick<SignInMessageSignerWalletAdapter, 'signIn'> & {

    connected: boolean;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    sendTransaction(
      transaction: Transaction | VersionedTransaction,
      connection: Connection,
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

    // Extract supported transaction versions if available
    // if (SolanaSignTransactionMethod in wallet.features) {
    //   try {
    //     const feature = wallet.features[SolanaSignTransactionMethod] as SolanaSignTransactionFeature;
    //     if (feature && feature.supportedTransactionVersions) {
    //       const versions = feature.supportedTransactionVersions;
    //       if (Array.isArray(versions)) {
    //         this.supportedTransactionVersions = new Set(versions) as ReadonlySet<TransactionVersion>;
    //       }
    //     }
    //   } catch (error) {
    //     console.warn('Error extracting supportedTransactionVersions from signTransaction feature', error);
    //   }
    // } else if (SolanaSignAndSendTransactionMethod in wallet.features) {
    //   try {
    //     const feature = wallet.features[SolanaSignAndSendTransactionMethod] as SolanaSignAndSendTransactionFeature;
    //     if (feature && feature.supportedTransactionVersions) {
    //       const versions = feature.supportedTransactionVersions;
    //       if (Array.isArray(versions)) {
    //         this.supportedTransactionVersions = new Set(versions) as ReadonlySet<TransactionVersion>;
    //       }
    //     }
    //   } catch (error) {
    //     console.warn('Error extracting supportedTransactionVersions from signAndSendTransaction feature', error);
    //   }
    // }

    // // Setup account change listener
    // if (StandardEventsMethod in wallet.features) {
    //   try {
    //     const events = wallet.features[StandardEventsMethod] as StandardEventsFeature;
    //     if (events && typeof events.on === 'function') {
    //       this._removeAccountChangeListener = events.on('change', (event: StandardEventsChangeEvent) => {
    //         try {
    //           if (!event || !event.accounts || !Array.isArray(event.accounts)) {
    //             console.warn('Invalid event data received from wallet', event);
    //             return;
    //           }

    //           // Find Solana account - made more flexible to work with real wallet implementations
    //           let solanaAccount = event.accounts.find(
    //             (account: StandardWalletAccount) => account && account.features &&
    //               Array.isArray(account.features) &&
    //               account.features.includes('solana:publicKey')
    //           );

    //           // If no account found with the exact feature, try to find any account with a publicKey
    //           if (!solanaAccount) {
    //             solanaAccount = event.accounts.find(
    //               (account: StandardWalletAccount) => account && account.publicKey && 
    //                 account.publicKey instanceof Uint8Array && account.publicKey.length > 0
    //             );
    //           }

    //           // If still no account found, try to find any account that looks like a Solana account
    //           if (!solanaAccount && event.accounts.length > 0) {
    //             solanaAccount = event.accounts.find(
    //               (account: StandardWalletAccount) => account && account.publicKey
    //             );
    //           }

    //           if (solanaAccount) {
    //             // If account exists, get the public key
    //             try {
    //               if (!solanaAccount.publicKey) {
    //                 console.warn('Account has no publicKey', solanaAccount);
    //                 return;
    //               }

    //               const publicKey = new PublicKey(solanaAccount.publicKey);
    //               if (!this._publicKey || !this._publicKey.equals(publicKey)) {
    //                 this._publicKey = publicKey;
    //                 this._eventEmitter.emit('connect', publicKey);
    //               }
    //             } catch (error) {
    //               // If error occurs when creating public key, emit error
    //               console.error('Error creating PublicKey from account', error);
    //               this._eventEmitter.emit('error', new WalletError('Invalid public key from wallet'));
    //             }
    //           } else if (this._publicKey) {
    //             // If no account but we had one before, disconnect
    //             this._publicKey = null;
    //             this._eventEmitter.emit('disconnect');
    //           }
    //         } catch (error) {
    //           console.error('Error handling wallet account change event', error);
    //           this._eventEmitter.emit('error', new WalletError('Error handling wallet event'));
    //         }
    //       });
    //     }
    //   } catch (error) {
    //     console.error('Error setting up account change listener', error);
    //   }
    // }
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
      this._connectedAccount = connectResult.accounts;
      // this._wallet.accounts = connectResult.accounts as readonly any[];
      // this._wallet.accounts = connectResult.accounts as readonly WalletAccount[];
      console.log("DEBUG connectedAccount", this._connectedAccount);
      if (!connectResult || !connectResult.accounts || !Array.isArray(connectResult.accounts)) {
        throw new Error('Invalid connect result from wallet');
      }

      // Find Solana account - made more flexible to work with real wallet implementations
      let solanaAccount = connectResult.accounts.find(
        (account: StandardWalletAccount) => account && account.features &&
          Array.isArray(account.features) &&
          account.features.includes('solana:publicKey')
      );

      // If no account found with the exact feature, try to find any account with a publicKey
      // This makes the implementation more flexible for real wallet standards
      if (!solanaAccount) {
        solanaAccount = connectResult.accounts.find(
          (account: StandardWalletAccount) => account && account.publicKey && 
            account.publicKey instanceof Uint8Array && account.publicKey.length > 0
        );
      }

      // If still no account found, try to find any account that looks like a Solana account
      if (!solanaAccount && connectResult.accounts.length > 0) {
        // Many wallets might just return accounts without specific features
        // Look for the first account with a valid public key
        solanaAccount = connectResult.accounts.find(
          (account: StandardWalletAccount) => account && account.publicKey
        );
      }

      if (!solanaAccount) {
        throw new Error('No Solana accounts found');
      }

      if (!solanaAccount.publicKey) {
        throw new Error('Solana account has no public key');
      }

      // If account exists, get the public key
      const publicKeyBytes = solanaAccount.publicKey;
      this._publicKey = new PublicKey(publicKeyBytes);
      this._eventEmitter.emit('connect', this._publicKey);
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

      if (this._publicKey) {
        this._publicKey = null;
        this._eventEmitter.emit('disconnect');
      }

      // Remove account change listener
      if (this._removeAccountChangeListener) {
        try {
          this._removeAccountChangeListener();
        } catch (error) {
          console.error('Error removing account change listener', error);
        }
        this._removeAccountChangeListener = null;
      }
    } catch (error: any) {
      console.error('Error in disconnect', error);
      this._eventEmitter.emit('error', error);
      throw error;
    }
  }

  async sendTransaction(
    transaction: Transaction | VersionedTransaction,
    connection?: Connection,
    options: SendOptions = {}
  ): Promise<TransactionSignature> {
    if (!this.connected) {
      throw new Error('Wallet not connected');
    }

    if (!this.publicKey) {
      throw new Error('Wallet public key not available');
    }

    try {
      // Path 1: If connection is provided, use traditional sign + send approach
      if (connection) {
        return await this._sendTransactionWithConnection(transaction, connection, options);
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
   * Send transaction using connection (sign then send)
   */
  private async _sendTransactionWithConnection(
    transaction: Transaction | VersionedTransaction,
    connection: Connection,
    options: SendOptions
  ): Promise<TransactionSignature> {
    try {
      // Validate that wallet supports signing
      if (!(SolanaSignTransactionMethod in this._wallet.features)) {
        throw new Error('Wallet does not support signing transactions');
      }

      // Prepare the transaction
      if (transaction instanceof Transaction) {
        if (!transaction.feePayer) {
          transaction.feePayer = this.publicKey!;
        }
        
        if (!transaction.recentBlockhash) {
          const { blockhash } = await connection.getLatestBlockhash(options.preflightCommitment);
          transaction.recentBlockhash = blockhash;
        }
      }

      // Sign the transaction
      const signedTransaction = await this.signTransaction(transaction);

      // Serialize the signed transaction
      const rawTransaction = signedTransaction instanceof Transaction
        ? signedTransaction.serialize()
        : signedTransaction.serialize();

      // Send the transaction
      return await connection.sendRawTransaction(rawTransaction, options);
    } catch (error: any) {
      throw new Error(`Failed to send transaction with connection: ${error.message || error}`);
    }
  }

  /**
   * Send transaction using wallet's signAndSendTransaction feature
   */
  private async _sendTransactionWithWallet(
    transaction: Transaction | VersionedTransaction,
    options: SendOptions
  ): Promise<TransactionSignature> {
    try {
      // Validate that wallet supports signAndSendTransaction
      if (!(SolanaSignAndSendTransactionMethod in this._wallet.features)) {
        throw new Error('Wallet does not support signAndSendTransaction feature');
      }

      const feature = this._wallet.features[SolanaSignAndSendTransactionMethod] as SolanaSignAndSendTransactionFeature;
      if (!feature || typeof feature.signAndSendTransaction !== 'function') {
        throw new Error('Wallet has invalid signAndSendTransaction feature');
      }

      // Prepare the transaction
      if (transaction instanceof Transaction) {
        if (!transaction.feePayer) {
          transaction.feePayer = this.publicKey!;
        }
        // Note: For wallet-based sending, we don't set blockhash as the wallet should handle this
      }

      // Serialize transaction for wallet
      let transactionBytes: Uint8Array;
      try {
        transactionBytes = transaction instanceof Transaction
          ? transaction.serialize({ verifySignatures: false })
          : transaction.serialize();
      } catch (error) {
        throw new Error(`Failed to serialize transaction: ${error instanceof Error ? error.message : error}`);
      }

      // Determine chain based on current cluster or default to mainnet
      const chain = this._currentCluster || 'solana:mainnet-beta';

      // Prepare account info for wallet
      const account: StandardWalletAccount = {
        address: this.publicKey!.toBase58(),
        publicKey: this.publicKey!.toBytes(),
        chains: ['solana:mainnet-beta', 'solana:devnet', 'solana:testnet'],
        features: ['solana:signAndSendTransaction']
      };

      // Call wallet's signAndSendTransaction
      const result = await feature.signAndSendTransaction({
        transaction: transactionBytes,
        chain,
        account,
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
    transaction: Transaction | VersionedTransaction,
    connection: Connection,
    options: SendOptions = {}
  ): Promise<TransactionSignature> {
    if (!this.connected) throw new Error('Wallet not connected');

    try {
      // If this wallet supports signAndSendTransaction, use it
      if (SolanaSignAndSendTransactionMethod in this._wallet.features) {
        const feature = this._wallet.features[SolanaSignAndSendTransactionMethod] as SolanaSignAndSendTransactionFeature;
        if (!feature || typeof feature.signAndSendTransaction !== 'function') {
          throw new Error('Wallet has invalid signAndSendTransaction feature');
        }

        // Prepare the transaction (get latest blockhash etc)
        if (transaction instanceof Transaction) {
          transaction.feePayer = this.publicKey!;
          const { blockhash } = await connection.getLatestBlockhash(options.preflightCommitment);
          transaction.recentBlockhash = blockhash;
        }

        // Get transaction bytes
        let transactionBytes: Uint8Array;
        try {
          transactionBytes = transaction instanceof Transaction
            ? transaction.serialize({ verifySignatures: false })
            : transaction.serialize();
        } catch (error) {
          console.error('Error serializing transaction', error);
          throw new Error('Failed to serialize transaction');
        }
        
        // Call wallet's signAndSendTransaction
        const result = await feature.signAndSendTransaction({
          transaction: transactionBytes,
          chain: 'solana:mainnet',
          account: this._connectedAccount![0],
          options
        });

        if (!result || !result.length || !result[0].signature) {
          throw new Error('No signature returned from signAndSendTransaction');
        }

        let signatureBase58: string;
        try {
          
          signatureBase58 = bs58.encode(result[0].signature);
        } catch (error) {
          console.error('Error encoding signature to base58', error);
          throw new Error('Failed to encode transaction signature');
        }
        return signatureBase58;
      }
      // Otherwise, sign the transaction and send it
      else if (SolanaSignTransactionMethod in this._wallet.features) {
        // Sign the transaction
        const signedTransaction = await this.signTransaction(transaction);

        // Send the signed transaction
        const rawTransaction = signedTransaction instanceof Transaction
          ? signedTransaction.serialize()
          : signedTransaction.serialize();

        // Send the transaction
        return await connection.sendRawTransaction(rawTransaction, options);
      } else {
        throw new Error('Wallet does not support sending transactions');
      }
    } catch (error: any) {
      console.error('Error in sendTransaction', error);
      this._eventEmitter.emit('error', error);
      throw error;
    }
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(transaction: T): Promise<T> {
    if (!this.connected) throw new Error('Wallet not connected');

    try {
      if (!(SolanaSignTransactionMethod in this._wallet.features)) {
        throw new Error('Wallet does not support signing transactions');
      }

      const feature = this._wallet.features[SolanaSignTransactionMethod] as SolanaSignTransactionFeature;
      if (!feature || typeof feature.signTransaction !== 'function') {
        throw new Error('Wallet has invalid signTransaction feature');
      }

      // Ensure transaction has feePayer set
      if (transaction instanceof Transaction && !transaction.feePayer) {
        transaction.feePayer = this.publicKey!;
      }

      // Serialize the transaction
      let transactionBytes: Uint8Array;
      try {
        transactionBytes = transaction instanceof Transaction
          ? transaction.serialize({ verifySignatures: false })
          : transaction.serialize();
      } catch (error) {
        console.error('Error serializing transaction for signing', error);
        throw new Error('Failed to serialize transaction for signing');
      }

      console.log("DEBUG transactionBytes", transactionBytes);
      console.log("DEBUG connectedAccount", this._connectedAccount);

      // Send to wallet for signing
      const result = await feature.signTransaction({
        transaction: transactionBytes,
        account: this._connectedAccount![0]
        // account: {
        //   address: this.publicKey!.toBase58(),
        //   publicKey: this.publicKey!.toBytes(),
        //   chains: ['solana:mainnet', 'solana:devnet', 'solana:testnet'],
        //   features: ['solana:signTransaction']
        // }
      });

      console.log("DEBUG result", result);

      if (!result) {
      // if (!result || !result.signedTransaction) {
        throw new Error('No signed transaction returned from wallet');
      }

      // Deserialize the signed transaction
      try {
        const signedTransaction = result[0]!.signedTransaction;
        // console.log("DEBUG signedTransaction", signedTransaction);

                // return (
                //   transaction instanceof Transaction
                //         ? VersionedTransaction.deserialize(serializedTransaction)
                //         : Transaction.from(serializedTransaction)
                // ) as T;
        if (transaction instanceof Transaction) {
          return Transaction.from(signedTransaction) as T;
        } else {
          return VersionedTransaction.deserialize(signedTransaction) as T;
        }
      } catch (error) {
        console.error('Error deserializing signed transaction', error);
        throw new Error('Failed to deserialize signed transaction');
      }
    } catch (error: any) {
      console.error('Error in signTransaction', error);
      this._eventEmitter.emit('error', error);
      throw error;
    }
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(transactions: T[]): Promise<T[]> {
    if (!this.connected) throw new Error('Wallet not connected');

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
    if (!this.connected) throw new Error('Wallet not connected');

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
    if (!this.connected) throw new Error('Wallet not connected');

    try {
      if (!(SolanaSignInMethod in this._wallet.features)) {
        throw new Error('Wallet does not support sign in');
      }

      const feature = this._wallet.features[SolanaSignInMethod] as SolanaSignInFeature;
      if (!feature || typeof feature.signIn !== 'function') {
        throw new Error('Wallet has invalid signIn feature');
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