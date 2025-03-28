# @hermis/solana-headless-react

<p align="center">
  <img src="https://iq.wiki/_next/image?url=https%3A%2F%2Fipfs.everipedia.org%2Fipfs%2FQmTaB5ygg5qNMDKmnfPgottNRZTe7PXzMpe3Tg7Bdw57HN&w=1080&q=95" width="100" alt="Solana Logo">
  <h3 align="center">React Hooks and Components for Solana Headless SDK</h3>
</p>

<p align="center">
  Modern React integration for the Solana blockchain - flexible, lightweight wallet management without UI constraints
</p>

## 🌟 Overview

`@hermis/solana-headless-react` provides a complete set of React hooks and components for integrating Solana wallet functionality into React applications. Built on top of the core `@hermis/solana-headless-core` package, it allows developers to implement wallet connection, transaction signing, and blockchain interactions with full UI flexibility.

## ✨ Features

- **UI Agnostic**: Build your own UI components without any design constraints
- **Modern React Hooks**: Intuitive hooks-based API for wallet and connection management
- **Full TypeScript Support**: Complete type definitions for better development experience
- **Complete Wallet Management**: Support for all major Solana wallets
- **Multi-Framework Support**: Works with React, Next.js, Vite, and any React-based framework
- **Persistence**: Local storage integration for wallet connection persistence

## 📦 Installation

```bash
# Using npm
npm install @hermis/solana-headless-react @hermis/solana-headless-core

# Using yarn
yarn add @hermis/solana-headless-react @hermis/solana-headless-core

# Using pnpm
pnpm add @hermis/solana-headless-react @hermis/solana-headless-core
```

You'll also need to install the wallet adapters you want to support:

```bash
# Install Phantom and Solflare adapters
npm install @solana/wallet-adapter-phantom @solana/wallet-adapter-solflare
```

## 🚀 Quick Start

### Basic Setup with HermisProvider

```tsx
// App.tsx
import React from 'react';
import { HermisProvider } from '@hermis/solana-headless-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { WalletAdapterNetwork } from '@hermis/solana-headless-core';
import Home from './Home';

function App() {
  // Create wallet adapters
  const wallets = [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
  ];

  return (
    <HermisProvider
      rpcEndpoint="https://api.devnet.solana.com"
      network={WalletAdapterNetwork.Devnet}
      autoConnect={true}
      additionalAdapters={wallets}
    >
      <Home />
    </HermisProvider>
  );
}

export default App;
```

### Using Wallet Hooks

```tsx
// Home.tsx
import React from 'react';
import { useWallet, useSolanaBalance } from '@hermis/solana-headless-react';

function Home() {
  const { 
    wallet, 
    publicKey, 
    connecting, 
    connected, 
    connect, 
    disconnect, 
    select 
  } = useWallet();
  
  const { balance, loading } = useSolanaBalance(publicKey);

  const handleConnect = async () => {
    if (wallet) {
      await connect();
    } else {
      // Select a wallet first if none is selected
      select('Phantom');
      await connect();
    }
  };

  return (
    <div>
      <h1>Solana Wallet Demo</h1>
      
      {!connected ? (
        <div>
          <button onClick={handleConnect} disabled={connecting}>
            {connecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
        </div>
      ) : (
        <div>
          <p>Connected with: {wallet?.adapter.name}</p>
          <p>Public Key: {publicKey?.toBase58()}</p>
          <p>Balance: {loading ? 'Loading...' : `${balance} SOL`}</p>
          <button onClick={disconnect}>Disconnect</button>
        </div>
      )}
    </div>
  );
}

export default Home;
```

## ⚛️ Next.js Integration

For Next.js applications, you'll need to handle the client-side rendering aspect of wallet connections.

### Next.js Provider Setup (App Router)

```tsx
// app/providers.tsx
'use client';

import { HermisProvider } from '@hermis/solana-headless-react';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { WalletAdapterNetwork } from '@hermis/solana-headless-core';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  // Create wallet adapters
  const wallets = [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
  ];

  return (
    <HermisProvider
      rpcEndpoint="https://api.devnet.solana.com"
      network={WalletAdapterNetwork.Devnet}
      autoConnect={true}
      additionalAdapters={wallets}
    >
      {children}
    </HermisProvider>
  );
}
```

### Next.js App Layout

```tsx
// app/layout.tsx
import { Providers } from './providers';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### Next.js Client Component

```tsx
// app/wallet-component.tsx
'use client';

import { useWallet, useSolanaBalance } from '@hermis/solana-headless-react';

export default function WalletComponent() {
  const { 
    wallet, 
    publicKey, 
    connected, 
    connect, 
    disconnect 
  } = useWallet();
  
  const { balance, loading } = useSolanaBalance(publicKey);

  return (
    <div>
      {!connected ? (
        <button onClick={connect}>Connect Wallet</button>
      ) : (
        <div>
          <p>Connected to {wallet?.adapter.name}</p>
          <p>Public Key: {publicKey?.toBase58()}</p>
          <p>Balance: {loading ? 'Loading...' : `${balance} SOL`}</p>
          <button onClick={disconnect}>Disconnect</button>
        </div>
      )}
    </div>
  );
}
```

### Next.js Page

```tsx
// app/page.tsx
import WalletComponent from './wallet-component';

export default function Home() {
  return (
    <main>
      <h1>Solana Wallet Integration</h1>
      <WalletComponent />
    </main>
  );
}
```

## 🔌 Core Components

### `HermisProvider`

The main provider component that sets up all Solana wallet functionality. It combines both the connection provider and wallet provider.

```tsx
<HermisProvider
  rpcEndpoint="https://api.devnet.solana.com"
  network={WalletAdapterNetwork.Devnet}
  autoConnect={true}
  additionalAdapters={wallets}
  storageKey="my-app-wallet"
  onError={(error) => console.error(error)}
>
  {children}
</HermisProvider>
```

Props:
- `rpcEndpoint`: (string) The Solana RPC endpoint to connect to
- `network`: (WalletAdapterNetwork) The Solana network (Mainnet, Devnet, Testnet)
- `autoConnect`: (boolean) Whether to automatically connect to the last used wallet
- `additionalAdapters`: (Adapter[]) Wallet adapters to use
- `storageKey`: (string) Key for storing wallet name in local storage
- `storageFactory`: (StorageProviderFactory) Custom storage factory for persistence
- `onError`: (function) Error handler for wallet errors

### `WalletConnectionManager`

A render props component for managing wallet connections. This is useful when you want to create custom wallet connection UI components.

```tsx
<WalletConnectionManager>
  {({
    connecting,
    connected,
    publicKey,
    walletName,
    walletIcon,
    connect,
    disconnect,
    selectWallet
  }) => (
    <div>
      {/* Custom wallet UI */}
    </div>
  )}
</WalletConnectionManager>
```

## 🧰 React Hooks

### `useWallet`

The primary hook for wallet interactions, providing state and methods for wallet management.

```tsx
const {
  autoConnect,         // Whether auto-connect is enabled
  wallets,             // Array of available wallets
  wallet,              // The currently selected wallet
  publicKey,           // Public key of the connected wallet
  connecting,          // Whether wallet is connecting
  connected,           // Whether wallet is connected
  disconnecting,       // Whether wallet is disconnecting
  select,              // Function to select a wallet by name
  connect,             // Function to connect to the selected wallet
  disconnect,          // Function to disconnect the wallet
  sendTransaction,     // Function to send a transaction
  signTransaction,     // Function to sign a transaction
  signAllTransactions, // Function to sign multiple transactions
  signMessage,         // Function to sign a message
  signIn,              // Function for Sign-In With Solana
  hasFeature           // Function to check wallet capability
} = useWallet();
```

### `useConnection`

Hook for accessing the Solana connection instance.

```tsx
const { connection, network } = useConnection();

// Example: Get account info
const getAccountInfo = async (publicKey) => {
  const info = await connection.getAccountInfo(publicKey);
  return {
        ...info,
        network,
    };
};
```

### `useSolanaBalance`

Hook for fetching and tracking a wallet's SOL balance.

```tsx
const { 
  balance,         // Balance in SOL
  balanceLamports, // Balance in lamports
  loading,         // Whether balance is loading
  error,           // Error, if any occurred
  refetch          // Function to manually refetch balance
} = useSolanaBalance(publicKey, 10000); // 10000ms refresh interval
```

### `useWalletAdapters`

Hook for working with wallet adapters, including sorting and filtering.

```tsx
const { 
  installed,     // Installed wallet adapters
  loadable,      // Loadable wallet adapters
  notDetected,   // Not detected wallet adapters
  all            // All wallet adapters
} = useWalletAdapters();

// Example: Render installed wallets
return (
  <div>
    <h2>Installed Wallets</h2>
    <ul>
      {installed.map(adapter => (
        <li key={adapter.name}>
          {adapter.name}
        </li>
      ))}
    </ul>
  </div>
);
```

### `useSolanaTokenAccounts`

Hook for fetching and tracking SPL token accounts owned by a wallet address.

```tsx
const {
  tokenAccounts, // Array of token accounts
  loading,       // Whether data is loading
  error,         // Error, if any occurred
  refetch        // Function to manually refetch data
} = useSolanaTokenAccounts(publicKey);

// Example: Display token balances
return (
  <div>
    <h2>Token Balances</h2>
    {loading ? (
      <p>Loading tokens...</p>
    ) : tokenAccounts.length === 0 ? (
      <p>No tokens found</p>
    ) : (
      <ul>
        {tokenAccounts.map(account => {
          const displayAmount = Number(account.amount) / Math.pow(10, account.decimals);
          return (
            <li key={account.mint.toString()}>
              {displayAmount} ({account.mint.toString().slice(0, 6)}...)
            </li>
          );
        })}
      </ul>
    )}
  </div>
);
```

### `useSolanaNFTs`

Hook for fetching and displaying NFTs owned by a wallet address.

```tsx
const {
  nfts,    // Array of NFTs
  loading, // Whether data is loading
  error,   // Error, if any occurred
  refetch  // Function to manually refetch data
} = useSolanaNFTs(publicKey);

// Example: Display NFTs
return (
  <div>
    <h2>My NFTs</h2>
    {loading ? (
      <p>Loading NFTs...</p>
    ) : nfts.length === 0 ? (
      <p>No NFTs found</p>
    ) : (
      <div className="nft-grid">
        {nfts.map(nft => (
          <div key={nft.mint.toString()} className="nft-item">
            <div className="nft-info">
              <div className="nft-mint">
                {nft.mint.toString().slice(0, 6)}...{nft.mint.toString().slice(-6)}
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);
```

### `useSolanaTransaction`

Hook for tracking transaction status with confirmations.

```tsx
const {
  status,  // Transaction status information
  loading, // Whether data is loading
  refetch  // Function to manually refetch status
} = useSolanaTransaction(signature);

// Example: Display transaction status
if (status) {
  return (
    <div>
      <p>Status: {status.status}</p>
      <p>Confirmations: {status.confirmations}</p>
      {status.error && <p>Error: {status.error}</p>}
    </div>
  );
}
```

### `useWalletMultiButton`

Hook for building a customizable wallet connection button.

```tsx
const {
  buttonState,    // State of button: connecting, connected, disconnecting, has-wallet, no-wallet
  onConnect,      // Function to connect
  onDisconnect,   // Function to disconnect
  onSelectWallet, // Function to select wallet
  walletIcon,     // Icon URL of selected wallet
  walletName,     // Name of selected wallet
  publicKey       // Public key string of connected wallet
} = useWalletMultiButton();

// Example: Custom wallet button
const renderButton = () => {
  switch (buttonState) {
    case 'connecting':
      return <button disabled>Connecting...</button>;
    case 'connected':
      return (
        <button onClick={onDisconnect}>
          {publicKey?.slice(0, 4)}...{publicKey?.slice(-4)}
        </button>
      );
    case 'disconnecting':
      return <button disabled>Disconnecting...</button>;
    case 'has-wallet':
      return <button onClick={onConnect}>Connect</button>;
    case 'no-wallet':
      return <button onClick={onSelectWallet}>Select Wallet</button>;
  }
};
```

### `useWalletModal`

Hook for creating a custom wallet selection modal.

```tsx
const {
  visible,           // Whether modal is visible
  showModal,         // Function to show modal
  hideModal,         // Function to hide modal
  selectedWallet,    // Currently selected wallet
  setSelectedWallet  // Function to select a wallet
} = useWalletModal();

// Example: Custom wallet modal
return (
  <>
    <button onClick={showModal}>Connect Wallet</button>
    
    {visible && (
      <div className="modal">
        <div className="modal-content">
          <h2>Select a Wallet</h2>
          {adapters.map(adapter => (
            <div 
              key={adapter.name}
              onClick={() => {
                setSelectedWallet(adapter.name);
                hideModal();
              }}
            >
              {adapter.name}
            </div>
          ))}
          <button onClick={hideModal}>Close</button>
        </div>
      </div>
    )}
  </>
);
```

### `useAnchorWallet`

Hook for accessing a wallet interface that is compatible with Anchor programs.

```tsx
const anchorWallet = useAnchorWallet();

// Can be passed directly to Anchor Program
if (anchorWallet) {
  const program = new Program(idl, programId, {
    connection,
    wallet: anchorWallet
  });
}
```

### `useLocalStorage`

Hook for accessing and updating persistent storage.

```tsx
const [value, setValue, loading] = useLocalStorage('my-key', 'default-value');
```

## 🔄 Advanced Usage

### Sending Transactions

```tsx
import { useWallet, useConnection } from '@hermis/solana-headless-react';
import { Transaction, SystemProgram, LAMPORTS_PER_SOL, PublicKey } from '@hermis/solana-headless-core';

function SendTransaction() {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  
  const handleSend = async () => {
    if (!publicKey) return;
    
    // Create a new transaction to send 0.1 SOL to recipient
    const transaction = new Transaction();
    const recipientPubKey = new PublicKey('recipient-address');
    
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: recipientPubKey,
        lamports: 0.1 * LAMPORTS_PER_SOL
      })
    );
    
    try {
      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;
      
      // Send transaction
      const signature = await sendTransaction(transaction, connection);
      console.log('Transaction sent:', signature);
    } catch (error) {
      console.error('Error sending transaction:', error);
    }
  };
  
  return (
    <button onClick={handleSend} disabled={!publicKey}>
      Send 0.1 SOL
    </button>
  );
}
```

### Custom Storage Persistence

You can customize how wallet selection is persisted across sessions:

```tsx
import { HermisProvider, createIndexedDBStorageFactory } from '@hermis/solana-headless-react';

// Create IndexedDB storage factory
const indexedDBStorage = createIndexedDBStorageFactory('solana-wallets', 'wallet-store');

function App() {
  return (
    <HermisProvider
      rpcEndpoint="https://api.mainnet-beta.solana.com"
      storageFactory={indexedDBStorage}
      // ...other props
    >
      {children}
    </HermisProvider>
  );
}
```

### Error Handling

Handle wallet connection errors gracefully:

```tsx
<HermisProvider
  rpcEndpoint="https://api.devnet.solana.com"
  onError={(error, adapter) => {
    console.error(`Error with ${adapter?.name || 'wallet'}:`, error);
    // Show user-friendly error notification
    toast.error(`Wallet error: ${error.message}`);
  }}
>
  {children}
</HermisProvider>
```

## 📋 Tips & Best Practices

1. **Handle Connection States**: Always check `connecting`, `connected`, and `disconnecting` states to provide appropriate UI feedback.

2. **Error Handling**: Implement proper error handling for wallet operations, especially during transactions.

3. **Mobile Support**: Test your application on mobile devices and ensure you're handling mobile wallet redirects correctly.

4. **Security**: Never request or store a user's private keys or seed phrases.

5. **Network Selection**: Make sure your RPC endpoint matches the network you intend to use (e.g., Mainnet, Devnet).

6. **React StrictMode**: The wallet hooks work correctly in StrictMode, which may render components twice during development.

7. **Performance**: For high-frequency data like balances, consider using larger refresh intervals in production.

## 📄 License

This project is licensed under the Apache 2.0 License - see the LICENSE file for details.