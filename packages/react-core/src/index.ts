// packages/react-core/src/index.ts
import { useState, useEffect, FC } from "react";
import { Keypair, PublicKey } from "@agateh/solana-headless-core";
import { createWallet } from "@agateh/solana-headless-core";
import { WalletInitProps } from "./types/index.js";
import AppProvider from "./AgateContextProvider.js";

/**
 * React hook to use a Solana wallet
 * @param apiKey API key for the Agateh service
 */
export const useWallet = ({
  apiKey
}: WalletInitProps) => {
  const [wallet, setWallet] = useState<PublicKey | null>(null);
  const [keypair, setKeypair] = useState<Keypair | null>(null);

  useEffect(() => {
    try {
      const keyPair = createWallet();
      setKeypair(keyPair);
      setWallet(keyPair.publicKey);
    } catch (error) {
      console.error("Error creating wallet:", error);
    }
  }, []);

  return { 
    wallet,
    keypair,
    publicKey: wallet
  };
};

// Export the context provider
export { AppProvider as AgateContextProvider };

// Export types
export * from "./types/index.js";