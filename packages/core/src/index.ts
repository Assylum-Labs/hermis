import { Keypair } from "@solana/web3.js";

export const createWallet = () => {
  return Keypair.generate();
};