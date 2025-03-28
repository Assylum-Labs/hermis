import { useState, useEffect, useCallback } from 'react';
import { PublicKey, LAMPORTS_PER_SOL } from '@hermis/solana-headless-core';
import { useConnection } from './useConnection.js';
import { useWallet } from './useWallet.js';

/**
 * Interface for balance information
 */
export interface BalanceInfo {
    balance: number | null;
    balanceLamports: number | null;
    loading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

/**
 * Hook for fetching and tracking a wallet's SOL balance
 * 
 * @param address Optional PublicKey to check balance for (defaults to connected wallet)
 * @param refreshInterval Optional automatic refresh interval in milliseconds
 * @returns Balance information
 */
export function useSolanaBalance(
    address?: PublicKey | null,
    refreshInterval?: number
): BalanceInfo {
    const { connection } = useConnection();
    const { publicKey } = useWallet();
    const [balanceLamports, setBalanceLamports] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const targetAddress = address || publicKey;

    const fetchBalance = useCallback(async () => {
        if (!targetAddress) {
            setBalanceLamports(null);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const balance = await connection.getBalance(targetAddress);
            setBalanceLamports(balance);
        } catch (err) {
            setError(err as Error);
            setBalanceLamports(null);
        } finally {
            setLoading(false);
        }
    }, [connection, targetAddress]);

    useEffect(() => {
        fetchBalance();

        if (refreshInterval && targetAddress) {
            const intervalId = setInterval(fetchBalance, refreshInterval);
            return () => clearInterval(intervalId);
        }

        return undefined;
    }, [fetchBalance, refreshInterval, targetAddress]);

    return {
        balance: balanceLamports !== null ? balanceLamports / LAMPORTS_PER_SOL : null,
        balanceLamports,
        loading,
        error,
        refetch: fetchBalance
    };
}