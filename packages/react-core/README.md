# @agateh/solana-headless-react

<p align="center">
  <img src="https://iq.wiki/_next/image?url=https%3A%2F%2Fipfs.everipedia.org%2Fipfs%2FQmTaB5ygg5qNMDKmnfPgottNRZTe7PXzMpe3Tg7Bdw57HN&w=1080&q=95" width="100" alt="Solana Logo">
  <h3 align="center">React Hooks for Solana Headless SDK</h3>
</p>

<p align="center">
  React integration for the Solana Headless SDK - flexible, lightweight wallet management
</p>

## 🌟 Overview

`@agateh/solana-headless-react` provides React hooks and components for seamless integration of Solana wallet functionality in React applications. Built on top of the core `@agateh/solana-headless-core` package, it brings all the flexibility of the headless SDK to React developers.

## ✨ Features

- **React Hooks**: Easy-to-use hooks for wallet management
- **Wallet Provider**: Context provider for app-wide wallet access
- **UI Flexibility**: No predefined UI components - style as you wish
- **TypeScript Support**: Full type definitions for React components and hooks

## 📦 Installation

```bash
# Using pnpm (recommended)
pnpm add @agateh/solana-headless-react

# Using npm
npm install @agateh/solana-headless-react

# Using yarn
yarn add @agateh/solana-headless-react
```

## 🚀 Quick Start

```tsx
import React from 'react';
import { useWallet } from '@agateh/solana-headless-react';

function WalletInfo() {
  const { wallet } = useWallet({
    apiKey: 'your-api-key'
  });

  return (
    <div>
      <h2>Wallet Information</h2>
      {wallet ? (
        <div>
          <p>Wallet is connected</p>
          <p>Public Key: {wallet.publicKey?.toBase58()}</p>
        </div>
      ) : (
        <p>Loading wallet...</p>
      )}
    </div>
  );
}

export default WalletInfo;
```

## 📋 API Reference

### `useWallet`

A React hook that provides wallet functionality:

```typescript
const { wallet } = useWallet({
  apiKey: string
});
```

Parameters:
- `apiKey`: Your API key for the Solana Headless SDK

Returns:
- `wallet`: The wallet object from the SDK

### Components (Coming Soon)

- `AgateContextProvider`: A context provider for app-wide wallet access
- Additional components to enhance your Solana dApp experience

## 🛠️ Usage Examples

### Setting Up Wallet Provider (Coming Soon)

```tsx
import React from 'react';
import { AgateContextProvider } from '@agateh/solana-headless-react';
import App from './App';

function AppWithWallet() {
  return (
    <AgateContextProvider apiKey="your-api-key">
      <App />
    </AgateContextProvider>
  );
}

export default AppWithWallet;
```

### Using Wallet in a Component

```tsx
import React, { useState } from 'react';
import { useWallet } from '@agateh/solana-headless-react';

function SendSol() {
  const { wallet } = useWallet({ apiKey: 'your-api-key' });
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  
  const handleSend = async () => {
    if (!wallet) return;
    
    try {
      // Send transaction using wallet
      console.log(`Sending ${amount} SOL to ${recipient}`);
      // Implementation coming soon
    } catch (error) {
      console.error('Error sending SOL:', error);
    }
  };

  return (
    <div>
      <h2>Send SOL</h2>
      <input 
        type="text" 
        placeholder="Recipient address" 
        value={recipient} 
        onChange={(e) => setRecipient(e.target.value)} 
      />
      <input 
        type="text" 
        placeholder="Amount" 
        value={amount} 
        onChange={(e) => setAmount(e.target.value)} 
      />
      <button onClick={handleSend} disabled={!wallet}>
        Send
      </button>
    </div>
  );
}
```

## 🔗 Related Packages

- [@agateh/solana-headless-core](../core/README.md): Core wallet functionality for Solana

## 📜 License

This project is licensed under Apache 2.0.