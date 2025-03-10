# 🪐 Solana Headless SDK

### **A Modular & Fully Headless Wallet Adapter for Solana**

🚀 **Solana Headless SDK** is a **UI-agnostic wallet adapter** that enables developers to integrate Solana authentication, wallet management, and transactions **without enforcing any UI constraints**.

This SDK provides **complete flexibility** for dApp developers, allowing full customization while leveraging Solana's core capabilities.

## 🌟 **Features**

- **Fully Headless** – No predefined UI, complete developer control
- **Solana-Native** – Built specifically for Solana, not a general blockchain solution
- **Multi-Wallet Support** – Compatible with Phantom, Backpack, Ledger, and more
- **Authentication Flexibility** – OAuth, email, biometrics, and session management
- **Gasless Transactions** – Optional transaction relaying for a seamless UX
- **Modular Architecture** – Pick and use only the parts you need

## 📦 **Packages**

| Package | Description | Documentation |
|---------|-------------|---------------|
| [@agateh/solana-headless-core](./packages/core/README.md) | Core wallet functionality and Solana interactions | [README](./packages/core/README.md) |
| [@agateh/solana-headless-react](./packages/react-core/README.md) | React hooks and components | [README](./packages/react-core/README.md) |


## 🛠️ **Development**

This repository is a **pnpm monorepo** managed with [Turborepo](https://turbo.build/).

```bash
# Clone the repository
git clone https://github.com/yourusername/solana-headless-sdk.git

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

## 📜 **License**

This project is licensed under Apache 2.0.

## 📮 **Stay Updated**

For updates and discussions:
- Twitter: [@agateh](https://x.com/agateh)