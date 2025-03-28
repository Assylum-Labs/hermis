import { HermisProvider } from "@hermis/solana-headless-react"
import { FC, ReactNode } from "react"
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';

interface WalletContextProviderProps {
    children: ReactNode
}

const WalletContextProvider: FC<WalletContextProviderProps> = ({
    children
}) => {

    const wallets = [
        new PhantomWalletAdapter(),
        new SolflareWalletAdapter(),
    ]

    return (
        <HermisProvider
            rpcEndpoint="https://api.devnet.solana.com"
            autoConnect={true}
            storageKey="solana-wallet-name"
            additionalAdapters={wallets}
        >
            {children}
        </HermisProvider>
    )
}

export default WalletContextProvider