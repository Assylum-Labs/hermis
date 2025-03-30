import React, { FC, ReactNode, useCallback } from 'react';
import { useWallet } from '../hooks/useWallet.js';
import { WalletAdapter, WalletName } from '@hermis/solana-headless-core';

/**
 * Information about the wallet connection state and actions
 */
export interface WalletConnectionInfo {
    /** Whether the wallet is currently connecting */
    connecting: boolean;
    /** Whether the wallet is connected */
    connected: boolean;
    /** Public key of the connected wallet (as a string), or null if not connected */
    publicKey: string | null;
    /** Name of the selected wallet, or null if none selected */
    walletName: string | null;
    /** Icon URL of the selected wallet, or null if none selected */
    walletIcon: string | null;
    /** Function to connect to the selected wallet */
    connect: () => Promise<WalletAdapter>;
    /** Function to disconnect from the wallet */
    disconnect: () => Promise<void>;
    /** Function to select a wallet by name */
    selectWallet: (name: string | null) => void;
}

/**
 * Props for the WalletConnectionManager component
 */
export interface WalletConnectionManagerProps {
    /** Children function that receives connection state and actions */
    children: (info: WalletConnectionInfo) => ReactNode;
}

/**
 * Render props component for managing wallet connections
 * 
 * This component provides a render props pattern for easily creating
 * custom wallet connection UIs without being prescriptive about design.
 * 
 * @param props WalletConnectionManagerProps
 * @returns Rendered children with connection state and actions
 */
export const WalletConnectionManager: FC<WalletConnectionManagerProps> = ({
    children,
}) => {
    const {
        wallet,
        publicKey,
        connecting,
        connected,
        select,
        connect,
        disconnect
    } = useWallet();

    const handleSelectWallet = useCallback((name: string | null) => {
        select(name as WalletName);
    }, [select]);

    const connectionInfo: WalletConnectionInfo = {
        connecting,
        connected,
        publicKey: publicKey?.toBase58() || null,
        walletName: wallet?.adapter.name.toString() || null,
        walletIcon: wallet?.adapter.icon || null,
        connect,
        disconnect,
        selectWallet: handleSelectWallet,
    };

    return <>{children(connectionInfo)}</>;
};