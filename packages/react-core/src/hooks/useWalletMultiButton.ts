import { useMemo } from 'react';
import { useWallet } from './useWallet.js';

/**
 * Interface for wallet multi-button state
 */
export interface WalletMultiButtonState {
  buttonState: 'connecting' | 'connected' | 'disconnecting' | 'has-wallet' | 'no-wallet';
  onConnect: () => Promise<void>;
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
  const { wallet, publicKey, connecting, connected, disconnecting, connect, disconnect } = useWallet();
  
  return useMemo(() => {
    // Determine the button state based on wallet connection status
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
    
    return {
      buttonState,
      onConnect: connect,
      onDisconnect: disconnect,
      onSelectWallet: () => {/* Logic to show wallet selector */},
      walletIcon: wallet?.adapter.icon,
      walletName: wallet?.adapter.name.toString(),
      publicKey: publicKey?.toBase58(),
    };
  }, [wallet, publicKey, connecting, connected, disconnecting, connect, disconnect]);
}