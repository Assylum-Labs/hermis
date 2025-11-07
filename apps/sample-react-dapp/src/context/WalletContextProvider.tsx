import { HermisProvider, TWalletAdapterNetwork } from "@hermis/solana-headless-react"
import { FC, ReactNode, createContext, useContext, useState, useCallback } from "react"
import { SolanaNetwork } from "../components/NetworkSelector"

// Network endpoints
const NETWORK_ENDPOINTS: Record<SolanaNetwork, string> = {
  devnet: "https://api.devnet.solana.com",
  testnet: "https://api.testnet.solana.com"
};

interface NetworkContextType {
  currentNetwork: SolanaNetwork;
  currentEndpoint: string;
  changeNetwork: (network: SolanaNetwork) => void;
  isChangingNetwork: boolean;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};

interface WalletContextProviderProps {
    children: ReactNode
}

const WalletContextProvider: FC<WalletContextProviderProps> = ({
    children
}) => {
    const [currentNetwork, setCurrentNetwork] = useState<SolanaNetwork>('devnet');
    const [isChangingNetwork, setIsChangingNetwork] = useState(false);
    const currentEndpoint = NETWORK_ENDPOINTS[currentNetwork];

    const changeNetwork = useCallback(async (network: SolanaNetwork) => {
        if (network === currentNetwork) return;
        
        setIsChangingNetwork(true);
        try {
            // Small delay to show loading state
            await new Promise(resolve => setTimeout(resolve, 100));
            setCurrentNetwork(network);
        } finally {
            setIsChangingNetwork(false);
        }
    }, [currentNetwork]);

    const networkContextValue: NetworkContextType = {
        currentNetwork,
        currentEndpoint,
        changeNetwork,
        isChangingNetwork
    };

    return (
        <NetworkContext.Provider value={networkContextValue}>
            <HermisProvider
                network={TWalletAdapterNetwork.Devnet}
                key={currentNetwork} // Force re-mount when network changes
                endpoint={currentEndpoint}
                autoConnect={true}
                storageKey={`solana-wallet-name-${currentNetwork}`} // Network-specific storage
            >
                {children}
            </HermisProvider>
        </NetworkContext.Provider>
    )
}

export default WalletContextProvider