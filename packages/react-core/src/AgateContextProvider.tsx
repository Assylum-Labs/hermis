// packages/react-core/src/AgateContextProvider.tsx
import { createContext, ReactNode, useContext, useState, useMemo } from 'react';
import { PublicKey, Keypair } from '@agateh/solana-headless-core';
import { createWallet } from '@agateh/solana-headless-core';
import { AgateContextProviderProps } from './types/index.js';

interface AppContextType {
  wallet: PublicKey | null;
  keypair: Keypair | null;
  connected: boolean;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

const AppProvider = ({
    children,
    apiKey,
  }: AgateContextProviderProps) => {
    const [keypair, setKeypair] = useState<Keypair | null>(null);
    const [connecting, setConnecting] = useState(false);
    const [connected, setConnected] = useState(false);
    
    const connect = async () => {
      if (connected || connecting) return;
      
      try {
        setConnecting(true);
        const newKeypair = createWallet();
        setKeypair(newKeypair);
        setConnected(true);
      } catch (error) {
        console.error("Failed to connect wallet:", error);
      } finally {
        setConnecting(false);
      }
    };
    
    const disconnect = async () => {
      setKeypair(null);
      setConnected(false);
    };
    
    const contextValue = useMemo(() => ({
      wallet: keypair?.publicKey || null,
      keypair,
      connected,
      connecting,
      connect,
      disconnect,
    }), [keypair, connected, connecting]);
  
    return (
      <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
    );
  };

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
      throw new Error("useApp must be used within an AppProvider");
    }
    return context;
  };

export default AppProvider;