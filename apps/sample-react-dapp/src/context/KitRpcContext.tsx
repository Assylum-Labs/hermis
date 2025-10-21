import type { Rpc, RpcSubscriptions, SolanaRpcApiMainnet, SolanaRpcSubscriptionsApi } from '@solana/kit'
import { createSolanaRpc, createSolanaRpcSubscriptions, devnet } from '@solana/kit'
import { createContext } from 'react'

export const KitRpcContext = createContext<{
  rpc: Rpc<SolanaRpcApiMainnet>
  rpcSubscriptions: RpcSubscriptions<SolanaRpcSubscriptionsApi>
}>({
  rpc: createSolanaRpc(devnet('https://api.devnet.solana.com')),
  rpcSubscriptions: createSolanaRpcSubscriptions(devnet('wss://api.devnet.solana.com')),
})
