import { useCallback, useEffect, useState } from 'react';
import {
    VersionedTransactionResponse,
    SignatureStatus,
    TransactionSignature
} from '@agateh/solana-headless-core';
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
    const { connection } = useConnection();
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
                    console.log('Transaction details not available yet');
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

    useEffect(() => {
        if (autoFetch && signature) {
            fetchStatus();

            const interval = setInterval(fetchStatus, 2000);
            return () => clearInterval(interval);
        }
    }, [autoFetch, fetchStatus, signature]);

    return {
        status: txStatus,
        loading,
        refetch: fetchStatus
    };
}