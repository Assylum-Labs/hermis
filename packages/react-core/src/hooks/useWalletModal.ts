import { useState, useCallback } from 'react';
import { useWallet } from './useWallet.js';

/**
 * Interface for wallet modal state and controls
 */
export interface WalletModalState {
  visible: boolean;
  showModal: () => void;
  hideModal: () => void;
  selectedWallet: string | null;
  setSelectedWallet: (walletName: string | null) => void;
}

/**
 * Hook that provides state and controls for a wallet selection modal
 * 
 * This hook makes it easy to create a custom wallet selection UI
 * 
 * @returns State and controls for a wallet modal
 */
export function useWalletModal(): WalletModalState {
  const [visible, setVisible] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const { select } = useWallet();
  
  const showModal = useCallback(() => {
    setVisible(true);
  }, []);
  
  const hideModal = useCallback(() => {
    setVisible(false);
  }, []);
  
  const handleSelectWallet = useCallback((walletName: string | null) => {
    setSelectedWallet(walletName);
    if (walletName) {
      select(walletName as any); // Cast to WalletName type
    }
  }, [select]);
  
  return {
    visible,
    showModal,
    hideModal,
    selectedWallet,
    setSelectedWallet: handleSelectWallet
  };
}