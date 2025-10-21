import { useState, useContext } from 'react'
import {
  address,
  appendTransactionMessageInstruction,
  createTransactionMessage,
  lamports,
  pipe,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  type Address,
  type TransactionSigner,
} from '@solana/kit'
import {
  isHermisError,
  HERMIS_ERROR__SIGNING__MESSAGE_FAILED,
  HERMIS_ERROR__TRANSACTION__SEND_FAILED,
  HERMIS_ERROR__WALLET_CONNECTION__FAILED,
} from '@hermis/errors'
import { useWallet, type WalletName } from '@hermis/solana-headless-react'
import { KitRpcContext } from '../context/KitRpcContext'
import './KitDemo.css'

// System Program Address
const SYSTEM_PROGRAM_ADDRESS = address('11111111111111111111111111111111')

/**
 * Create a transfer SOL instruction using Kit types
 * This replaces @solana-program/system which has web3.js 2.0 dependency conflicts
 */
function getTransferSolInstruction({
  source,
  destination,
  amount,
}: {
  source: TransactionSigner<string>
  destination: Address<string>
  amount: ReturnType<typeof lamports>
}) {
  // System Program Transfer instruction layout:
  // [u32 instruction_index, u64 lamports]
  const instructionData = new Uint8Array(12)
  const view = new DataView(instructionData.buffer)
  view.setUint32(0, 2, true) // instruction discriminator: 2 = Transfer
  view.setBigUint64(4, BigInt(amount), true) // amount in lamports

  return {
    programAddress: SYSTEM_PROGRAM_ADDRESS,
    accounts: [
      { address: source.address, role: 3 }, // from account (writable + signer)
      { address: destination, role: 1 },     // to account (writable)
    ],
    data: instructionData,
  }
}

interface WalletItemProps {
  name: string
  icon: string
  isSelected: boolean
  onClick: () => void
}

const WalletItem = ({ name, icon, isSelected, onClick }: WalletItemProps) => {
  return (
    <div
      className={`wallet-item ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <img
        src={icon}
        alt={`${name} icon`}
        onError={(e) => {
          const target = e.target as HTMLImageElement
          target.src = 'https://raw.githubusercontent.com/solana-labs/wallet-adapter/master/packages/wallets/icons/generic.svg'
        }}
      />
      <div className="wallet-info">
        <div className="wallet-name">{name}</div>
      </div>
    </div>
  )
}

function solStringToLamports(solQuantityString: string) {
  if (Number.isNaN(parseFloat(solQuantityString))) {
    throw new Error('Could not parse token quantity: ' + String(solQuantityString))
  }
  const numDecimals = BigInt(solQuantityString.split('.')[1]?.length ?? 0)
  const bigIntLamports = BigInt(solQuantityString.replace('.', '')) * 10n ** (9n - numDecimals)
  return lamports(bigIntLamports)
}

export const KitDemo = () => {
  const { rpc } = useContext(KitRpcContext)

  // Use hermis useWallet hook with Kit properties
  const {
    wallets,
    wallet,
    connected,
    connecting,
    connect,
    disconnect,
    select,
    address: walletAddress,
    addressString,
    messageSigner,
    transactionSigner,
    chain,
    signAndSendTransaction,
  } = useWallet()

  const [error, setError] = useState<string | null>(null)

  // Sign message state
  const [messageToSign, setMessageToSign] = useState('')
  const [isSigning, setIsSigning] = useState(false)
  const [signature, setSignature] = useState<string | null>(null)

  // Transaction state
  const [recipientAddress, setRecipientAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [isSendingTransaction, setIsSendingTransaction] = useState(false)
  const [txSignature, setTxSignature] = useState<string | null>(null)

  const handleSelectWallet = async (walletName: string) => {
    try {
      setError(null)
      await select(walletName as WalletName)
    } catch (err) {
      console.error('Wallet selection error:', err)
      setError(`Selection error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const handleConnect = async () => {
    if (!wallet) {
      setError('Please select a wallet first')
      return
    }

    setError(null)

    try {
      await connect()
    } catch (err) {
      console.error('Connection error:', err)
      if (isHermisError(err, HERMIS_ERROR__WALLET_CONNECTION__FAILED)) {
        setError(`Failed to connect: ${err.message}`)
      } else {
        setError(`Connection error: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }
  }

  const handleDisconnect = async () => {
    try {
      setError(null)
      await disconnect()
      setSignature(null)
      setTxSignature(null)
    } catch (err) {
      console.error('Disconnection error:', err)
      setError(`Disconnection error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const handleSignMessage = async () => {
    if (!connected || !messageSigner || !walletAddress) {
      setError('Wallet not connected or does not support message signing')
      return
    }

    if (!messageToSign.trim()) {
      setError('Please enter a message to sign')
      return
    }

    setIsSigning(true)
    setError(null)
    setSignature(null)

    try {
      const messageBytes = new TextEncoder().encode(messageToSign)

      const [result] = await messageSigner.modifyAndSignMessages([
        {
          content: messageBytes as Uint8Array,
          signatures: {},
        },
      ])

      const messageSignature = result?.signatures[walletAddress]
      if (!messageSignature) {
        throw new Error('Failed to get signature from message signer')
      }

      // Convert signature to base64 for display
      const signatureBase64 = btoa(String.fromCharCode(...Array.from(messageSignature)))

      setSignature(signatureBase64)
    } catch (err) {
      console.error('Sign message error:', err)
      if (isHermisError(err, HERMIS_ERROR__SIGNING__MESSAGE_FAILED)) {
        setError(`Failed to sign message: ${err.message}`)
      } else {
        setError(`Sign error: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    } finally {
      setIsSigning(false)
    }
  }

  const handleSignAndSend = async () => {
    if (!connected || !transactionSigner || !walletAddress) {
      setError('Wallet not connected or does not support transactions')
      return
    }

    if (!recipientAddress.trim() || !amount.trim()) {
      setError('Please enter recipient address and amount')
      return
    }

    setIsSendingTransaction(true)
    setError(null)
    setTxSignature(null)

    try {
      let recipientAddr: Address<string>
      try {
        recipientAddr = address(recipientAddress.trim())
      } catch {
        setError('Invalid recipient address')
        setIsSendingTransaction(false)
        return
      }

      let amountLamports
      try {
        amountLamports = solStringToLamports(amount)
      } catch {
        setError('Invalid amount')
        setIsSendingTransaction(false)
        return
      }

      const { value: latestBlockhash } = await rpc
        .getLatestBlockhash({ commitment: 'confirmed' })
        .send()

      // Build transaction using Kit's pattern
      const message = pipe(
        createTransactionMessage({ version: 0 }),
        m => setTransactionMessageFeePayerSigner(transactionSigner as TransactionSigner<string>, m),
        m => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
        m => appendTransactionMessageInstruction(
          getTransferSolInstruction({
            amount: amountLamports,
            destination: recipientAddr,
            source: transactionSigner as TransactionSigner<string>,
          }),
          m,
        ),
      )

      const signature = await signAndSendTransaction(message, rpc)

      setTxSignature(signature)
      setRecipientAddress('')
      setAmount('')
    } catch (err) {
      console.error('Transaction error:', err)
      if (isHermisError(err, HERMIS_ERROR__TRANSACTION__SEND_FAILED)) {
        setError(`Transaction failed: ${err.message}`)
      } else {
        setError(`Transaction error: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    } finally {
      setIsSendingTransaction(false)
    }
  }

  return (
    <div className="kit-demo-container">
      <header className="kit-demo-header">
        <h1>Kit Demo</h1>
        <p className="subtitle">Pure Kit Architecture with Hermis</p>
      </header>

      {error && (
        <div className="error-banner">
          <strong>Error:</strong> {error}
          <button onClick={() => setError(null)} className="close-btn">×</button>
        </div>
      )}

      <div className="kit-demo-content">
        {/* Wallet Connection Section */}
        <section className="section">
          <h2>1. Connect Wallet</h2>

          {!connected ? (
            <>
              <div className="wallet-grid">
                {wallets.map((w) => (
                  <WalletItem
                    key={w.adapter.name}
                    name={w.adapter.name}
                    icon={w.adapter.icon}
                    isSelected={wallet?.adapter.name === w.adapter.name}
                    onClick={() => handleSelectWallet(w.adapter.name)}
                  />
                ))}
              </div>

              <button
                onClick={handleConnect}
                disabled={!wallet || connecting}
                className="btn btn-primary"
              >
                {connecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            </>
          ) : (
            <div className="connected-info">
              <div className="info-card">
                <div className="info-row">
                  <span className="label">Wallet:</span>
                  <span className="value">{wallet?.adapter.name}</span>
                </div>
                <div className="info-row">
                  <span className="label">Address:</span>
                  <span className="value address">{addressString}</span>
                </div>
                <div className="info-row">
                  <span className="label">Chain:</span>
                  <span className="value">Devnet ({chain})</span>
                </div>
                <div className="info-row">
                  <span className="label">Message Signer:</span>
                  <span className="value">{messageSigner ? '✓ Available' : '✗ Not available'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Transaction Signer:</span>
                  <span className="value">{transactionSigner ? '✓ Available' : '✗ Not available'}</span>
                </div>
              </div>
              <button onClick={handleDisconnect} className="btn btn-secondary">
                Disconnect
              </button>
            </div>
          )}
        </section>

        {/* Sign Message Section */}
        {connected && messageSigner && (
          <section className="section">
            <h2>2. Sign Message</h2>
            <div className="form-group">
              <label htmlFor="message">Message to sign:</label>
              <input
                id="message"
                type="text"
                value={messageToSign}
                onChange={(e) => setMessageToSign(e.target.value)}
                placeholder="Enter a message to sign"
                className="input"
              />
            </div>

            <button
              onClick={handleSignMessage}
              disabled={!messageToSign.trim() || isSigning}
              className="btn btn-primary"
            >
              {isSigning ? 'Signing...' : 'Sign Message'}
            </button>

            {signature && (
              <div className="result-card success">
                <h3>✓ Message Signed Successfully!</h3>
                <div className="result-content">
                  <div className="result-row">
                    <span className="result-label">Message:</span>
                    <span className="result-value">{messageToSign}</span>
                  </div>
                  <div className="result-row">
                    <span className="result-label">Signature:</span>
                    <span className="result-value signature">{signature}</span>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Sign and Send Transaction Section */}
        {connected && transactionSigner && (
          <section className="section">
            <h2>3. Sign and Send Transaction</h2>
            <div className="form-group">
              <label htmlFor="recipient">Recipient Address:</label>
              <input
                id="recipient"
                type="text"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                placeholder="Enter recipient address"
                className="input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="amount">Amount (SOL):</label>
              <input
                id="amount"
                type="number"
                step="0.001"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.001"
                className="input"
              />
            </div>

            <button
              onClick={handleSignAndSend}
              disabled={!recipientAddress.trim() || !amount.trim() || isSendingTransaction}
              className="btn btn-primary"
            >
              {isSendingTransaction ? 'Sending...' : 'Sign and Send'}
            </button>

            {txSignature && (
              <div className="result-card success">
                <h3>✓ Transaction Sent Successfully!</h3>
                <div className="result-content">
                  <div className="result-row">
                    <span className="result-label">Signature:</span>
                    <span className="result-value signature">{txSignature}</span>
                  </div>
                  <div className="result-row">
                    <a
                      href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="explorer-link"
                    >
                      View on Solana Explorer →
                    </a>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
