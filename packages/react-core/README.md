# @hermis/solana-headless-react

[![npm version](https://img.shields.io/npm/v/@hermis/solana-headless-react.svg)](https://www.npmjs.com/package/@hermis/solana-headless-react)

React hooks and components for Solana wallet integration. UI-agnostic design lets you build custom wallet experiences.

## Installation

```bash
npm install @hermis/solana-headless-react
```

## Setup

Wrap your app with `HermisProvider`:

```tsx
import { HermisProvider } from '@hermis/solana-headless-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';

function App() {
  return (
    <HermisProvider
      endpoint="https://devnet.solana.com"
      network={WalletAdapterNetwork.Devnet}
      autoConnect={true}
      wallets={[]}
      onError={(error) => console.error('Wallet error:', error)}
    >
      <YourApp />
    </HermisProvider>
  );
}
```

## Core Hooks

### useWallet

```tsx
import { useWallet } from '@hermis/solana-headless-react';

function WalletButton() {
  const { wallet, publicKey, connected, connect, disconnect, select } = useWallet();

  return (
    <div>
      {!connected ? (
        <button onClick={() => { select('Phantom'); connect(); }}>
          Connect Wallet
        </button>
      ) : (
        <div>
          <p>Wallet: {wallet?.adapter.name}</p>
          <p>Address: {publicKey?.toBase58()}</p>
          <button onClick={disconnect}>Disconnect</button>
        </div>
      )}
    </div>
  );
}
```

### useSolanaBalance

```tsx
import { useWallet, useSolanaBalance } from '@hermis/solana-headless-react';

function BalanceDisplay() {
  const { publicKey } = useWallet();
  const { balance, loading } = useSolanaBalance(publicKey);

  if (!publicKey) return <p>Connect your wallet</p>;
  if (loading) return <p>Loading balance...</p>;

  return <p>Balance: {balance} SOL</p>;
}
```

### useWallets

```tsx
import { useWallets } from '@hermis/solana-headless-react';

function WalletSelector() {
  const { wallets, select } = useWallets();

  return (
    <div>
      {wallets.map((wallet) => (
        <button key={wallet.adapter.name} onClick={() => select(wallet.adapter.name)}>
          {wallet.adapter.name}
        </button>
      ))}
    </div>
  );
}
```

### useConnection

```tsx
import { useConnection } from '@hermis/solana-headless-react';

function NetworkInfo() {
  const { connection } = useConnection();

  // Use connection for RPC calls
  const getLatestBlockhash = async () => {
    const { blockhash } = await connection.getLatestBlockhash();
    console.log('Latest blockhash:', blockhash);
  };

  return <button onClick={getLatestBlockhash}>Get Blockhash</button>;
}
```

## Documentation

For complete documentation, examples, and API reference, visit [docs.hermis.io/quickstart/react](https://docs.hermis.io/quickstart/react)

## License

Apache 2.0
