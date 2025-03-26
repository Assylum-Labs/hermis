import { useMemo } from 'react';
import { useWallet } from './useWallet.js';
import { WalletName } from '@agateh/solana-headless-core';

/**
 * Interface for wallet multi-button state
 */
export interface WalletMultiButtonState {
    buttonState: 'connecting' | 'connected' | 'disconnecting' | 'has-wallet' | 'no-wallet';
    onConnect: () => Promise<boolean>;
    onDisconnect: () => Promise<void>;
    onSelectWallet: () => void;
    walletIcon?: string;
    walletName?: string;
    publicKey?: string;
}

/**
 * Hook that provides state for building a wallet multi-button component
 * 
 * This hook is helpful for creating fully customizable wallet connection buttons
 * 
 * @returns State for building a wallet button UI
 */
export function useWalletMultiButton(): WalletMultiButtonState {
    const { wallet, publicKey, connecting, connected, disconnecting, connect, disconnect, select } = useWallet();

    return useMemo(() => {
        let buttonState: WalletMultiButtonState['buttonState'] = 'no-wallet';

        if (connecting) {
            buttonState = 'connecting';
        } else if (connected) {
            buttonState = 'connected';
        } else if (disconnecting) {
            buttonState = 'disconnecting';
        } else if (wallet) {
            buttonState = 'has-wallet';
        }

        const handleSelectWallet = async(name: WalletName<string> | undefined) => {
            if (!name) return
            await select(name)
        }

        return {
            buttonState,
            onConnect: connect,
            onDisconnect: disconnect,
            onSelectWallet: () => handleSelectWallet(wallet?.adapter.name),
            walletIcon: wallet?.adapter.icon,
            walletName: wallet?.adapter.name.toString(),
            publicKey: publicKey?.toBase58(),
        };
    }, [wallet, publicKey, connecting, connected, disconnecting, connect, disconnect]);
}