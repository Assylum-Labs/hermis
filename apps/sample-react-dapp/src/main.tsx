// Import polyfills first, before any other imports
import './polyfills'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import WalletContextProvider from './context/WalletContextProvider.tsx'

const root = createRoot(document.getElementById('root')!);

root.render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <WalletContextProvider>
        <App />
      </WalletContextProvider>
    </BrowserRouter>
  </StrictMode>
); 