# 🪐 Solana Headless SDK  

### **A Fully Headless & Customizable Wallet Adapter for Solana**  

🚀 **Solana Headless SDK** is a **modular, UI-agnostic wallet adapter** that enables developers to integrate Solana authentication, wallet management, and transactions **without enforcing any UI constraints**.  

This SDK provides **true flexibility** for dApps, allowing full customization while leveraging Solana's core capabilities.

---

## **Features**
**Fully Headless** – No predefined UI, complete developer control.  
**Solana-Native** – Optimized for **Solana first**, not an afterthought.  
**Multi-Wallet Support** – Compatible with Phantom, Backpack, Ledger, etc.  
**Authentication Flexibility** – OAuth, email, biometrics, and session management.  
**Gasless Transactions** – Optional transaction relaying for a seamless UX.  
**Modular Architecture** – Pick and use only the parts you need.  

## **📖 Installation**
To install the core SDK:  
```sh
pnpm add @solana/headless-core
```

## **Usage**
```ts
import { createWallet } from "@solana/headless-core";

const wallet = createWallet();
console.log("Public Key:", wallet.publicKey.toBase58());
```


## **📜 License**
**This project is licensed under Apache 2.0.**


## **📮 Stay Updated**
For updates and discussions:
📢 **Twitter** : [@agateh](https://x.com/agateh)


## **📦 Monorepo Structure**
This repository is a **pnpm monorepo** managed with [Turborepo](https://turbo.build/).  

