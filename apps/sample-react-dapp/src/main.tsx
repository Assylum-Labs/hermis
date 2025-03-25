import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import WalletContextProvider from './context/WalletContextProvider.tsx'

const root = createRoot(document.getElementById('root')!);

root.render(
  <StrictMode>
    <WalletContextProvider>
      <App />
    </WalletContextProvider>
  </StrictMode>
); 