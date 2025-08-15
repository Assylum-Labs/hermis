# 🪐 Solana Headless SDK

### **A Modular & Fully Headless Wallet Adapter for Solana**

🚀 **Solana Headless SDK** is a **UI-agnostic wallet adapter** that enables developers to integrate Solana authentication, wallet management, and transactions **without enforcing any UI constraints**.

This SDK provides **complete flexibility** for dApp developers, allowing full customization while leveraging Solana's core capabilities.

## 🧪 **Live Demo**

Try our playground:

[**View the Demo →**](https://assylum-labs.github.io/hermis/)

This demo showcases the core functionality of our adapter-base package with the React framework, demonstrating how you can integrate Solana wallets with complete UI freedom.

## 🌟 **Community Edition Features**

- **Fully Headless** – No predefined UI, complete developer control
- **Solana-Native** – Built specifically for Solana, not a general blockchain solution
- **Multi-Wallet Support** – Compatible with Phantom, Backpack, Ledger, and more
- **Framework Flexibility** – React, Vue, and vanilla JS support
- **Modular Architecture** – Pick and use only the parts you need

## 🔐 **Enterprise Edition Features**

- **Enhanced Authentication** – OAuth, email, and session management
- **Gasless Transactions** – Optional transaction relaying for a seamless UX
- **MPC Wallet Management** – 2-of-2 non-custodial wallet implementation
- **Advanced Recovery Options** – Multiple secure methods for wallet recovery
- **Enterprise Support** – Dedicated assistance for commercial implementations

## 📦 **Packages**

### Community Edition
| Package | Description | Documentation |
|---------|-------------|---------------|
| [@hermis/solana-headless-core](https://www.npmjs.com/package/@hermis/solana-headless-core) | Core wallet functionality and Solana interactions | [README](https://github.com/agateh/solana-headless-sdk/blob/main/packages/core/README.md) |
| [@hermis/solana-headless-adapter-base](https://www.npmjs.com/package/@hermis/solana-headless-adapter-base) | Base adapter implementations | [README](https://github.com/agateh/solana-headless-sdk/blob/main/packages/adapter-base/README.md) |
| [@hermis/solana-headless-react](https://www.npmjs.com/package/@hermis/solana-headless-react) | React hooks and components | [README](https://github.com/agateh/solana-headless-sdk/blob/main/packages/react-core/README.md) |
| [@hermis/solana-headless-vue](./packages/vue-core/README.md) | Vue composables and components | Coming soon |

### Enterprise Edition
| Package | Description | Access |
|---------|-------------|--------|
| [@hermis/solana-headless-enterprise](./packages/enterprise/README.md) | Enterprise authentication & wallet features | Contact for access |

## 🛠️ **Development**

This repository is a **pnpm monorepo** managed with [Turborepo](https://turbo.build/).

```bash
# Clone the repository
git clone https://github.com/Assylum-Labs/hermis.git

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

## 📜 **Licensing**

- **Community Edition**: All Community Edition packages are licensed under the Apache 2.0 license, which allows free use, modification, and distribution, even for commercial purposes.

- **Enterprise Edition**: The Enterprise Edition features are available under a separate commercial license that requires a subscription. Contact us for pricing and terms.

This "open core" model provides a robust open-source foundation while offering advanced features and support through our commercial offering.

## 📮 **Stay Updated**

For updates and discussions:
- Twitter: [@Hermis_xyz](https://x.com/Hermis_xyz)

## 💼 **Enterprise Inquiries**

For information about Enterprise Edition licensing, features, and support:
- Contact: [agateh.labs@gmail.com](mailto:agateh.labs@gmail.com)
