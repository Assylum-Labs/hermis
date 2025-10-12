import { useEffect, useState, useCallback } from 'react';
import { PublicKey, TOKEN_PROGRAM_ID, Connection } from '@hermis/solana-headless-core';
import { useConnection } from './useConnection.js';
import { useWallet } from './useWallet.js';

/**
 * Token account information
 */
export interface TokenAccountInfo {
    pubkey: PublicKey;
    mint: PublicKey;
    owner: PublicKey;
    amount: bigint;
    decimals: number;
}

/**
 * Hook for fetching and tracking token accounts
 * 
 * @param owner Optional owner address (defaults to connected wallet)
 * @returns Object with token accounts and loading state
 */
export function useSolanaTokenAccounts(owner?: PublicKey) {
    const { connection: dualConnection } = useConnection();
    // Cast to legacy Connection for existing code compatibility
    const connection = dualConnection as Connection;
    const { publicKey } = useWallet();
    const [tokenAccounts, setTokenAccounts] = useState<TokenAccountInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const ownerAddress = owner || publicKey;

    const fetchTokenAccounts = useCallback(async () => {
        if (!ownerAddress) {
            setTokenAccounts([]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const accounts = await connection.getParsedTokenAccountsByOwner(
                ownerAddress,
                { programId: TOKEN_PROGRAM_ID }
            );

            const tokenAccountsInfo = accounts.value.map((account) => {
                const parsedInfo = account.account.data.parsed.info;
                return {
                    pubkey: account.pubkey,
                    mint: new PublicKey(parsedInfo.mint),
                    owner: new PublicKey(parsedInfo.owner),
                    amount: BigInt(parsedInfo.tokenAmount.amount),
                    decimals: parsedInfo.tokenAmount.decimals,
                };
            });

            setTokenAccounts(tokenAccountsInfo);
        } catch (err) {
            console.error('Error fetching token accounts:', err);
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [connection, ownerAddress]);

    useEffect(() => {
        fetchTokenAccounts();
    }, [fetchTokenAccounts]);

    return {
        tokenAccounts,
        loading,
        error,
        refetch: fetchTokenAccounts
    };
}