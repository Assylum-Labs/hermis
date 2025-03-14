// packages/react-core/src/types/index.ts

/**
 * Props for wallet initialization
 */
export interface WalletInitProps {
    /** API key for the Agateh service */
    apiKey: string;
    
    /** Optional callback for when wallet is connected */
    onConnect?: () => void;
    
    /** Optional callback for when wallet is disconnected */
    onDisconnect?: () => void;
  }
  
  /**
   * Context provider props
   */
  export interface AgateContextProviderProps {
    /** API key for the Agateh service */
    apiKey: string;
    
    /** Children components */
    children: React.ReactNode;
  }