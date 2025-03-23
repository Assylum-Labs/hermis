import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { WalletAdapterNetwork } from '@agateh/solana-headless-core'
import { 
  ContextProvider,
  setStorageProviderFactory, 
  createIndexedDBStorageFactory 
} from '@agateh/solana-headless-react'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
// import { TrustWalletAdapter } from '@solana/wallet-adapter-trust';

// Optional: Use IndexedDB for persistence instead of localStorage
// This is more robust for larger amounts of data and works in private browsing
const indexedDBStorage = createIndexedDBStorageFactory('solana-wallet-demo', 'wallet-data');
setStorageProviderFactory(indexedDBStorage);

// Create a root element to render the app
const root = createRoot(document.getElementById('root')!);

const wallets = [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter(),
  // new TrustWalletAdapter()
]

// Render the app with wallet provider context
root.render(
  <StrictMode>
    <ContextProvider
      rpcEndpoint="https://api.devnet.solana.com"
      network={WalletAdapterNetwork.Devnet}
      autoConnect={false}
      storageKey="solana-wallet-name"
      additionalAdapters={wallets}
    >
      <App />
    </ContextProvider>
  </StrictMode>
);