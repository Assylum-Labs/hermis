import { PublicKey, DualTransaction, DualArchitectureOptions } from '@hermis/solana-headless-core';
import { useMemo } from 'react';
import { useWallet } from './useWallet.js';

/**
 * Interface for Anchor wallet with dual architecture support
 *
 * This interface is compatible with Anchor program's wallet requirements.
 *
 * **Primary Use Case:**
 * Pass to Anchor programs - they use web3.js Transaction/VersionedTransaction:
 * ```typescript
 * const anchorWallet = useAnchorWallet();
 * const program = new Program(idl, programId, { connection, wallet: anchorWallet });
 * await program.methods.myMethod().accounts({...}).rpc();
 * ```
 *
 * **Advanced Use Case:**
 * Also supports manual signing with Kit TransactionMessage:
 * ```typescript
 * const signedKitTx = await anchorWallet.signTransaction(kitTransactionMessage);
 * ```
 */
export interface AnchorWallet {
  publicKey: PublicKey;
  signTransaction<T extends DualTransaction = DualTransaction>(
    transaction: T,
    options?: DualArchitectureOptions
  ): Promise<T>;
  signAllTransactions<T extends DualTransaction = DualTransaction>(
    transactions: T[],
    options?: DualArchitectureOptions
  ): Promise<T[]>;
}

/**
 * Hook for accessing a wallet that is compatible with Anchor programs
 *
 * Returns an Anchor-compatible wallet interface that supports both web3.js
 * and Kit transaction architectures.
 *
 * @returns AnchorWallet or undefined if wallet is not connected
 */
export function useAnchorWallet(): AnchorWallet | undefined {
  const { publicKey, signTransaction, signAllTransactions } = useWallet();

  return useMemo(
    () => {
      if (publicKey) {
        return { publicKey, signTransaction, signAllTransactions };
      }
      return undefined;
    },
    [publicKey, signTransaction, signAllTransactions]
  );
}