import { useState, useEffect, FC } from "react";
import { HeadlessWalletSDK } from "@agateh/solana-headless-core";
import { WalletInitProps } from "./types/index.js";


export const useWallet = ({
  apiKey
}: WalletInitProps) => {
  const walletSDK = new HeadlessWalletSDK(apiKey);
  const [wallet, setWallet] = useState<any>(null);

  useEffect(() => {
    try {
        walletSDK.createWallet().then(setWallet);
    } catch (error) {
        console.error()
    }
  }, []);

  return { wallet };
};

// export * from "./AgateContextProvider"