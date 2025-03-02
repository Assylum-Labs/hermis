import { createWallet } from "@solana/headless-core";

const wallet = createWallet();
console.log("New Wallet key:", wallet.publicKey.toBase58());
