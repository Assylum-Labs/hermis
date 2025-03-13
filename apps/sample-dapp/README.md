# Solana Headless Wallet Demo

This is a sample application demonstrating the use of the `@agateh/solana-headless-adapter-base` package for integrating Solana wallets into a web application without any predefined UI components.

## Features

- ✅ Connect to any Solana wallet
- ✅ Display wallet connection status and details
- ✅ Get wallet balance
- ✅ Track wallet events
- ✅ Support for multiple wallet types
- ✅ Auto-connect functionality

## Project Structure

The project follows a simple structure:

```
apps/sample-dapp/
├── public/              # Static assets
├── src/                 # JavaScript source code
├── .babelrc             # Babel configuration
├── package.json         # Package configuration
└── webpack.config.js    # Webpack build configuration
```

## Getting Started

### Prerequisites

- Node.js 14+
- pnpm (for monorepo management)

### Installation

Since this is part of a monorepo, make sure you've installed all dependencies at the root level:

```bash
# At the root of the monorepo
pnpm install
```

### Development

To start the development server:

```bash
# Navigate to the sample app directory
cd apps/sample-dapp

# Start the development server
pnpm start
```

This will start a development server at http://localhost:9000

### Building

To build the application:

```bash
# Navigate to the sample app directory
cd apps/sample-dapp

# Build for production
pnpm build
```

The built files will be in the `dist` directory.

## Usage

1. Open the application in your browser
2. Select a wallet from the list of available wallets
3. Click "Connect" to connect to the selected wallet
4. Once connected, you can view your wallet details and balance
5. Click "Disconnect" to disconnect from the wallet

## Event Logging

The application includes an event log section that displays all events that occur during wallet interaction. This is useful for debugging and understanding the wallet connection flow.

## Customization

The application is styled with CSS and can be easily customized to match your application's design. The main styling is in `public/styles.css`.