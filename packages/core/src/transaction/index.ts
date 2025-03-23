import { Adapter } from '@solana/wallet-adapter-base';
import { 
  Connection, 
  Keypair, 
  Transaction, 
  TransactionSignature,
  sendAndConfirmTransaction,
  VersionedTransaction,
} from '@solana/web3.js';
import { SolanaSignInInput, SolanaSignInOutput } from '../types/index.js';
import { generateNonce, generateSignInMessage } from '../utils/index.js';

/**
 * Helper to safely detect if a transaction is a VersionedTransaction
 * Works even when instanceof checks might not work in test environments
 */
function isVersionedTransaction(transaction: Transaction | VersionedTransaction): boolean {
  // In test environments, VersionedTransaction might not be properly mocked
  // So we check for the version property which is only present in VersionedTransaction
  return (
    // Check if it has a version property
    'version' in transaction ||
    // Check for an explicit flag that might be set in tests
    '_isVersionedTransaction' in transaction ||
    // Try instanceof check as a backup when available
    (typeof VersionedTransaction === 'function' && transaction instanceof VersionedTransaction)
  );
}

/**
 * Signs a transaction using the specified wallet
 * @param transaction The transaction to sign (can be Transaction or VersionedTransaction)
 * @param wallet The wallet to sign with (can be a Keypair or Adapter)
 * @returns The signed transaction
 */
export async function signTransaction<T extends Transaction | VersionedTransaction>(
  transaction: T, 
  wallet: Keypair | Adapter
): Promise<T> {
  // Use different signing methods based on wallet type
  if ('secretKey' in wallet) {
    // It's a Keypair
    if (!isVersionedTransaction(transaction)) {
      // For legacy Transaction, we can sign directly
      (transaction as Transaction).sign(wallet);
      return transaction;
    } else {
      // For VersionedTransaction, we need different signing logic
      // Currently not implemented in standard web3.js for Keypair
      throw new Error('Signing versioned transactions with a Keypair directly is not supported');
    }
  } else {
    // It's an Adapter
    if (!wallet.publicKey) {
      throw new Error('Wallet not connected');
    }
    
    // For versioned transactions, we need to check if the adapter supports it
    if (
      isVersionedTransaction(transaction) && 
      wallet.supportedTransactionVersions &&
      !wallet.supportedTransactionVersions.has((transaction as any).version)
    ) {
      throw new Error(`Wallet doesn't support transaction version ${(transaction as any).version}`);
    }
    
    // Check if this adapter supports signing directly
    if ('signTransaction' in wallet && typeof wallet.signTransaction === 'function') {
      return await wallet.signTransaction(transaction);
    } else {
      throw new Error('Wallet adapter does not support direct transaction signing');
    }
  }
}

/**
 * Signs multiple transactions using the specified wallet
 * @param transactions The array of transactions to sign
 * @param wallet The wallet to sign with (can be a Keypair or Adapter)
 * @returns A promise that resolves to an array of signed transactions
 */
export async function signAllTransactions<T extends Transaction | VersionedTransaction>(
  transactions: T[], 
  wallet: Keypair | Adapter
): Promise<T[]> {
  // Use different signing methods based on wallet type
  if ('secretKey' in wallet) {
    // It's a Keypair
    const signedTransactions = transactions.map(transaction => {
      // Check if transaction is a Transaction or VersionedTransaction
      if (isVersionedTransaction(transaction)) {
        // For VersionedTransaction, we would need custom signing logic
        throw new Error('Signing versioned transactions with a Keypair directly is not supported');
      }
      
      // Create a copy to avoid modifying the original
      const txCopy = Transaction.from((transaction as Transaction).serialize());
      
      // Sign the transaction
      txCopy.sign(wallet);
      
      return txCopy as T;
    });
    
    return signedTransactions;
  } else {
    // It's an Adapter
    if (!wallet.publicKey) {
      throw new Error('Wallet not connected');
    }
    
    // Check for versioned transactions and verify support
    for (const transaction of transactions) {
      if (
        isVersionedTransaction(transaction) && 
        wallet.supportedTransactionVersions &&
        !wallet.supportedTransactionVersions.has((transaction as any).version)
      ) {
        throw new Error(`Wallet doesn't support transaction version ${(transaction as any).version}`);
      }
    }
    
    // Check if this adapter supports signing transactions
    if ('signAllTransactions' in wallet && typeof wallet.signAllTransactions === 'function') {
      return await wallet.signAllTransactions(transactions);
    } else if ('signTransaction' in wallet && typeof wallet.signTransaction === 'function') {
      // Fall back to signing transactions individually if batch signing is not supported
      const signedTransactions: T[] = [];
      for (const transaction of transactions) {
        const signed = await wallet.signTransaction(transaction as any);
        signedTransactions.push(signed as T);
      }
      return signedTransactions;
    } else {
      throw new Error('Wallet adapter does not support transaction signing');
    }
  }
}

/**
 * Sends a transaction to the Solana network
 * @param connection The Solana connection to use
 * @param transaction The transaction to send
 * @param wallet The wallet to sign with (can be a Keypair or Adapter)
 * @returns A promise that resolves to the transaction signature
 */
export async function sendTransaction(
  connection: Connection, 
  transaction: Transaction | VersionedTransaction, 
  wallet: Keypair | Adapter
): Promise<TransactionSignature> {
  try {
    // Set recent blockhash if not already set (for regular transactions)
    if (!isVersionedTransaction(transaction) && !(transaction as Transaction).recentBlockhash) {
      const { blockhash } = await connection.getLatestBlockhash();
      (transaction as Transaction).recentBlockhash = blockhash;
    }
    
    // Handle different wallet types
    if ('secretKey' in wallet) {
      // It's a Keypair
      if (!isVersionedTransaction(transaction)) {
        return await sendAndConfirmTransaction(connection, transaction as Transaction, [wallet]);
      } else {
        throw new Error('Sending versioned transactions with a Keypair is not directly supported');
      }
    } else {
      // It's an Adapter
      if (!wallet.publicKey) {
        throw new Error('Wallet not connected');
      }
      
      if (!wallet.sendTransaction) {
        throw new Error('Wallet does not support sending transactions');
      }
      
      // Set fee payer if not already set (for regular transactions)
      if (!isVersionedTransaction(transaction) && !(transaction as Transaction).feePayer) {
        (transaction as Transaction).feePayer = wallet.publicKey;
      }
      
      // Check for versioned transaction support
      if (
        isVersionedTransaction(transaction) && 
        wallet.supportedTransactionVersions &&
        !wallet.supportedTransactionVersions.has((transaction as any).version)
      ) {
        throw new Error(`Wallet doesn't support transaction version ${(transaction as any).version}`);
      }
      
      // Send the transaction using the adapter
      return await wallet.sendTransaction(transaction, connection);
    }
  } catch (error) {
    console.error('Failed to send transaction:', error);
    throw error;
  }
}

/**
 * Signs a message using the specified wallet
 * @param message The message to sign
 * @param wallet The wallet to sign with (can be a Keypair or Adapter)
 * @returns A promise that resolves to the signed message bytes
 */
export async function signMessage(
  message: string | Uint8Array, 
  wallet: Keypair | Adapter
): Promise<Uint8Array> {
  try {
    // Convert message to bytes if it's a string
    const messageBytes = typeof message === 'string' 
      ? new TextEncoder().encode(message) 
      : message;
    
    // Handle different wallet types
    if ('secretKey' in wallet) {
      // It's a Keypair
      // Note: Keypair doesn't have a direct message signing method in web3.js
      // You would need to implement it using nacl or similar
      throw new Error('Direct message signing with Keypair is not supported');
    } else {
      // It's an Adapter
      if (!wallet.publicKey) {
        throw new Error('Wallet not connected');
      }
      
      // Check if this adapter supports message signing
      if ('signMessage' in wallet && typeof wallet.signMessage === 'function') {
        return await wallet.signMessage(messageBytes);
      } else {
        throw new Error('Wallet adapter does not support message signing');
      }
    }
  } catch (error) {
    console.error('Failed to sign message:', error);
    throw error;
  }
}

/**
 * Performs a Sign-In with Solana (SIWS) operation
 * 
 * @param wallet The wallet adapter to use for signing
 * @param input Optional sign-in parameters
 * @returns A promise that resolves to the sign-in result
 */
export async function signIn(
    wallet: Adapter,
    input: SolanaSignInInput = {}
  ): Promise<SolanaSignInOutput> {
    try {
      // Check if wallet is connected
      if (!wallet.publicKey) {
        throw new Error('Wallet not connected');
      }
      
      // Check if wallet supports signIn directly
      if ('signIn' in wallet && typeof wallet.signIn === 'function') {
        // The wallet has native signIn support, use it
        const result = await wallet.signIn(input);
        
        // We don't need to modify the account structure, just return the result
        // with any additional fields we want to include
        return {
          ...result,
          domain: input.domain || window.location.host,
          nonce: input.nonce || generateNonce(),
          version: input.version || '1'
        };
      }
      
      // Check if wallet at least supports signMessage
      if (!('signMessage' in wallet) || typeof wallet.signMessage !== 'function') {
        throw new Error('Wallet does not support message signing');
      }
      
      // Generate the sign-in message
      const signInMessage = generateSignInMessage(input);
      const messageBytes = new TextEncoder().encode(signInMessage);
      
      // Sign the message
      const signature = await wallet.signMessage(messageBytes);
      
      // Create and return the sign-in output
      const domain = input.domain || window.location.host;
      const nonce = input.nonce || generateNonce();
      const chainId = input.chainId || 'solana:mainnet';
      const version = input.version || '1';
      
      return {
        account: {
          address: wallet.publicKey.toBase58(),
          publicKey: new Uint8Array(wallet.publicKey.toBytes()),
          chain: chainId,
        },
        signature,
        signedMessage: messageBytes,
        domain,
        nonce,
        statement: input.statement,
        version,
      };
    } catch (error) {
      console.error('Failed to sign in with Solana:', error);
      throw error;
    }
  }