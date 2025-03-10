import { Adapter } from '@solana/wallet-adapter-base';
import { 
  Connection, 
  Keypair, 
  Transaction, 
  TransactionSignature,
  sendAndConfirmTransaction 
} from '@solana/web3.js';

/**
 * Signs a transaction using the specified wallet
 * @param transaction The transaction to sign
 * @param wallet The wallet to sign with (can be a Keypair or Adapter)
 * @returns The signed transaction
 */
export async function signTransaction(
  transaction: Transaction, 
  wallet: Keypair | Adapter
): Promise<Transaction> {
  // Use different signing methods based on wallet type
  if ('secretKey' in wallet) {
    // It's a Keypair
    transaction.sign(wallet);
    return transaction;
  } else {
    // It's an Adapter
    if (!wallet.publicKey) {
      throw new Error('Wallet not connected');
    }
    
    // Check if this adapter supports signing directly
    // Note: Not all adapters support direct signing, some only support sendTransaction
    if ('signTransaction' in wallet && typeof wallet.signTransaction === 'function') {
      return await wallet.signTransaction(transaction);
    } else {
      throw new Error('Wallet adapter does not support direct transaction signing');
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
  transaction: Transaction, 
  wallet: Keypair | Adapter
): Promise<TransactionSignature> {
  try {
    // Set recent blockhash if not already set
    if (!transaction.recentBlockhash) {
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
    }
    
    // Handle different wallet types
    if ('secretKey' in wallet) {
      // It's a Keypair
      return await sendAndConfirmTransaction(connection, transaction, [wallet]);
    } else {
      // It's an Adapter
      if (!wallet.publicKey) {
        throw new Error('Wallet not connected');
      }
      
      if (!wallet.sendTransaction) {
        throw new Error('Wallet does not support sending transactions');
      }
      
      // Set fee payer if not already set
      if (!transaction.feePayer) {
        transaction.feePayer = wallet.publicKey;
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
  message: string | Uint8Array<ArrayBufferLike>, 
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