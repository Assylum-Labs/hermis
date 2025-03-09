import { Adapter, WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { createConnection } from '../connection/index.js';

/**
 * Manages wallet connections and interactions
 */
export class WalletManager {
  private wallet: Adapter | null = null;
  private connection: Connection;

  /**
   * Creates a new WalletManager
   * @param network The Solana network to use (defaults to Mainnet)
   */
  constructor(private network: WalletAdapterNetwork = WalletAdapterNetwork.Mainnet) {
    this.connection = createConnection(network);
  }

  /**
   * Connects to a wallet adapter
   * @param wallet The wallet adapter to connect to
   * @returns A promise that resolves to a boolean indicating success
   */
  async connect(wallet: Adapter): Promise<boolean> {
    try {
      this.wallet = wallet;
      
      // Only attempt connection if the wallet is not connected already
      if (!wallet.connected) {
        await wallet.connect();
      }
      
      return wallet.connected;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      this.wallet = null;
      return false;
    }
  }

  /**
   * Gets the wallet's balance
   * @returns A promise that resolves to the wallet's balance in SOL
   */
  async getBalance(): Promise<number> {
    if (!this.wallet || !this.wallet.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const balance = await this.connection.getBalance(this.wallet.publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Failed to get balance:', error);
      throw error;
    }
  }

  /**
   * Gets the wallet's public key
   * @returns The wallet's public key
   */
  getPublicKey(): PublicKey {
    if (!this.wallet || !this.wallet.publicKey) {
      throw new Error('Wallet not connected');
    }
    
    return this.wallet.publicKey;
  }
}