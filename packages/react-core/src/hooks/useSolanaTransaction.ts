import { useCallback, useEffect, useRef, useState } from 'react';
import {
    VersionedTransactionResponse,
    SignatureStatus,
    TransactionSignature,
    Connection
} from '@hermis/solana-headless-core';
import { useConnection } from './useConnection.js';

/**
 * Transaction status with confirmation information
 */
export interface TransactionStatus {
    signature: TransactionSignature;
    status: 'pending' | 'confirmed' | 'finalized' | 'failed';
    confirmations: number;
    confirmationStatus: SignatureStatus['confirmationStatus'];
    error?: string;
    transactionDetails?: VersionedTransactionResponse;
    //   transactionDetails?: ConfirmedTransaction;
}

/**
 * Hook for tracking transaction status with confirmations
 * 
 * @param signature Transaction signature to track
 * @param autoFetch Whether to automatically fetch transaction status
 * @returns Transaction status information and functions
 */
export function useSolanaTransaction(
    signature?: TransactionSignature,
    autoFetch: boolean = true
) {
    const { connection: dualConnection } = useConnection();
    // Cast to legacy Connection for existing code compatibility
    const connection = dualConnection as Connection;
    const [txStatus, setTxStatus] = useState<TransactionStatus | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchStatus = useCallback(async () => {
        if (!signature) {
            setTxStatus(null);
            return;
        }

        setLoading(true);
        try {
            const status = await connection.getSignatureStatus(signature, {
                searchTransactionHistory: true,
            });

            let transactionDetails;
            if (status.value?.confirmationStatus === 'confirmed' ||
                status.value?.confirmationStatus === 'finalized') {
                try {
                    transactionDetails = await connection.getTransaction(signature, {
                        maxSupportedTransactionVersion: 0
                    });
                } catch (e) {
                    // Transaction details not yet available, will retry
                }
            }

            if (status.value) {
                const txStatus: TransactionStatus = {
                    signature,
                    status: status.value.err ? 'failed' :
                        (status.value.confirmationStatus === 'finalized' ? 'finalized' :
                            status.value.confirmationStatus === 'confirmed' ? 'confirmed' : 'pending'),
                    confirmations: status.value.confirmations || 0,
                    confirmationStatus: status.value.confirmationStatus || 'processed',
                    error: status.value.err ? JSON.stringify(status.value.err) : undefined,
                    transactionDetails: transactionDetails || undefined,
                };
                setTxStatus(txStatus);
            } else {
                setTxStatus({
                    signature,
                    status: 'pending',
                    confirmations: 0,
                    confirmationStatus: undefined,
                });
            }
        } catch (error) {
            console.error('Error fetching transaction status:', error);
            setTxStatus({
                signature,
                status: 'failed',
                confirmations: 0,
                confirmationStatus: undefined,
                error: (error as Error).message,
            });
        } finally {
            setLoading(false);
        }
    }, [connection, signature]);

    // Latest status, read inside the scheduler without re-triggering the effect.
    const txStatusRef = useRef<TransactionStatus | null>(null);
    useEffect(() => {
        txStatusRef.current = txStatus;
    }, [txStatus]);

    // Poll with exponential backoff and stop on terminal status.
    // Previously this was setInterval(fetchStatus, 2000) — it kept hitting
    // the RPC twice every 2s forever, including after finalisation, which
    // tripped rate limits on hosted RPC providers.
    useEffect(() => {
        if (!autoFetch || !signature) return;

        const BACKOFF_MS = [1000, 2000, 5000, 10000, 30000] as const;
        let cancelled = false;
        let timeoutId: ReturnType<typeof setTimeout> | null = null;
        let attempt = 0;

        const tick = async () => {
            if (cancelled) return;
            await fetchStatus();
            if (cancelled) return;

            const current = txStatusRef.current;
            if (current && (current.status === 'finalized' || current.status === 'failed')) {
                return;
            }

            const delay = BACKOFF_MS[Math.min(attempt, BACKOFF_MS.length - 1)];
            attempt += 1;
            timeoutId = setTimeout(tick, delay);
        };

        void tick();

        return () => {
            cancelled = true;
            if (timeoutId !== null) clearTimeout(timeoutId);
        };
    }, [autoFetch, fetchStatus, signature]);

    return {
        status: txStatus,
        loading,
        refetch: fetchStatus
    };
}