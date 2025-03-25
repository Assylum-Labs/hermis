import { PublicKey, Transaction, VersionedTransaction } from '@agateh/solana-headless-core';
import { useMemo } from 'react';
import { useWallet } from './useWallet.js';

/**
 * Interface for Anchor wallet
 * 
 * This interface is compatible with Anchor program's wallet requirements
 */
export interface AnchorWallet {
  publicKey: PublicKey;
  signTransaction<T extends Transaction | VersionedTransaction>(transaction: T): Promise<T>;
  signAllTransactions<T extends Transaction | VersionedTransaction>(transactions: T[]): Promise<T[]>;
}

/**
 * Hook for accessing a wallet that is compatible with Anchor programs
 * 
 * @returns AnchorWallet or undefined if wallet is not connected
 */
export function useAnchorWallet(): AnchorWallet | undefined {
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  
  return useMemo(
    () => {
      if (publicKey && signTransaction && signAllTransactions) {
        return { publicKey, signTransaction, signAllTransactions };
      }
      return undefined;
    },
    [publicKey, signTransaction, signAllTransactions]
  );
}