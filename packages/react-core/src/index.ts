import { useState, useEffect, FC } from "react";
import { createWallet, PublicKey } from "@agateh/solana-headless-core";
import { WalletInitProps } from "./types/index.js";


export const useWallet = ({
  apiKey
}: WalletInitProps) => {
  // const walletSDK = new HeadlessWalletSDK(apiKey);
  const [wallet, setWallet] = useState<PublicKey>();

  useEffect(() => {
    try {
        const keyPair = createWallet()
        setWallet(keyPair.publicKey)
    } catch (error) {
        console.error()
    }
  }, []);

  return { wallet };
};

// export * from "./AgateContextProvider"