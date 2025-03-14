# 🪐 Solana Headless SDK

### **A Modular & Fully Headless Wallet Adapter for Solana**

🚀 **Solana Headless SDK** is a **UI-agnostic wallet adapter** that enables developers to integrate Solana authentication, wallet management, and transactions **without enforcing any UI constraints**.

This SDK provides **complete flexibility** for dApp developers, allowing full customization while leveraging Solana's core capabilities.

## 🌟 **Community Edition Features**

- **Fully Headless** – No predefined UI, complete developer control
- **Solana-Native** – Built specifically for Solana, not a general blockchain solution
- **Multi-Wallet Support** – Compatible with Phantom, Backpack, Ledger, and more
- **Framework Flexibility** – React, Vue, and vanilla JS support
- **Modular Architecture** – Pick and use only the parts you need

## 🔐 **Enterprise Edition Features**

- **Enhanced Authentication** – OAuth, email, biometrics, and session management
- **Gasless Transactions** – Optional transaction relaying for a seamless UX
- **MPC Wallet Management** – 2-of-2 non-custodial wallet implementation
- **Advanced Recovery Options** – Multiple secure methods for wallet recovery
- **Enterprise Support** – Dedicated assistance for commercial implementations

## 📦 **Packages**

### Community Edition
| Package | Description | Documentation |
|---------|-------------|---------------|
| [@agateh/solana-headless-core](./packages/core/README.md) | Core wallet functionality and Solana interactions | [README](./packages/core/README.md) |
| [@agateh/solana-headless-adapter-base](./packages/adapter-base/README.md) | Base adapter implementations | [README](./packages/adapter-base/README.md) |
| [@agateh/solana-headless-react](./packages/react-core/README.md) | React hooks and components | [README](./packages/react-core/README.md) |
| [@agateh/solana-headless-vue](./packages/vue-core/README.md) | Vue composables and components | Coming soon |

### Enterprise Edition
| Package | Description | Access |
|---------|-------------|--------|
| [@agateh/solana-headless-enterprise](./packages/enterprise/README.md) | Enterprise authentication & wallet features | Contact for access |

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

## 📜 **Licensing**

- **Community Edition**: All Community Edition packages are licensed under the Apache 2.0 license, which allows free use, modification, and distribution, even for commercial purposes.

- **Enterprise Edition**: The Enterprise Edition features are available under a separate commercial license that requires a subscription. Contact us for pricing and terms.

This "open core" model provides a robust open-source foundation while offering advanced features and support through our commercial offering.

## 📮 **Stay Updated**

For updates and discussions:
- Twitter: [@agateh](https://x.com/agateh)

## 💼 **Enterprise Inquiries**

For information about Enterprise Edition licensing, features, and support:
- Contact: [enterprise@agateh.com](mailto:enterprise@agateh.com)