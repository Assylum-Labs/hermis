import { useCallback, useEffect, useState } from 'react';
import { PublicKey, Connection } from '@hermis/solana-headless-core';
import { useConnection } from './useConnection.js';
import { useWallet } from './useWallet.js';

/**
 * NFT metadata information
 */
export interface NFTMetadata {
    name?: string;
    symbol?: string;
    description?: string;
    image?: string;
    externalUrl?: string;
    attributes?: Array<{
        trait_type: string;
        value: string;
    }>;
    [key: string]: any;
}

/**
 * NFT information
 */
export interface NFTInfo {
    mint: PublicKey;
    tokenAccount: PublicKey;
    metadata: NFTMetadata | null;
    uri: string | null;
}

/**
 * Hook for fetching NFTs owned by an address
 * 
 * @param owner Optional owner address (defaults to connected wallet)
 * @returns Object with NFTs and loading state
 */
export function useSolanaNFTs(owner?: PublicKey) {
    const { connection: dualConnection } = useConnection();
    // Cast to legacy Connection for existing code compatibility
    const connection = dualConnection as Connection;
    const { publicKey } = useWallet();
    const [nfts, setNfts] = useState<NFTInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const ownerAddress = owner || publicKey;

    const fetchNFTs = useCallback(async () => {
        if (!ownerAddress) {
            setNfts([]);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { value: tokenAccounts } = await connection.getParsedTokenAccountsByOwner(
                ownerAddress,
                { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
            );

            const potentialNFTs = tokenAccounts
                .filter(account => {
                    const amount = account.account.data.parsed.info.tokenAmount;
                    return amount.decimals === 0 && amount.uiAmount === 1;
                })
                .map(account => ({
                    mint: new PublicKey(account.account.data.parsed.info.mint),
                    tokenAccount: account.pubkey,
                    metadata: null,
                    uri: null
                }));

            setNfts(potentialNFTs);
        } catch (err) {
            console.error('Error fetching NFTs:', err);
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    }, [connection, ownerAddress]);

    useEffect(() => {
        fetchNFTs();
    }, [fetchNFTs]);

    return {
        nfts,
        loading,
        error,
        refetch: fetchNFTs
    };
}