import React, { useState } from 'react';
import { useWallet, useConnection, useSolanaTransaction } from '@hermis/solana-headless-react';
import { 
  Transaction, 
  SystemProgram, 
  PublicKey, 
  LAMPORTS_PER_SOL
} from '@hermis/solana-headless-core';
import './TransactionCard.css';

interface TransactionCardProps {
  onTransactionSent?: (signature: string) => void;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({ onTransactionSent }) => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, signTransaction } = useWallet();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { status } = useSolanaTransaction(signature || undefined);

  const isValidSolanaAddress = (address: string): boolean => {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  };

  const handleSendTransaction = async () => {
    if (!publicKey || !connection || !signTransaction || !sendTransaction) return;
    
    // Validate inputs
    if (!recipient || !amount) {
      setError('Please enter both recipient address and amount');
      return;
    }
    
    if (!isValidSolanaAddress(recipient)) {
      setError('Invalid Solana address');
      return;
    }
    
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    setIsSending(true);
    setError(null);
    
    try {
      const transaction = new Transaction();
      
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(recipient),
          lamports: parsedAmount * LAMPORTS_PER_SOL
        })
      );

      const signedTransaction = await signTransaction(transaction);
      
      const txSignature = await sendTransaction(signedTransaction, connection);

      setSignature(txSignature);
      if (onTransactionSent) {
        onTransactionSent(txSignature);
      }
      
      setAmount('');
      setRecipient('');
    } catch (err) {
      console.error('Error sending transaction:', err);
      setError((err as Error).message || 'Failed to send transaction');
    } finally {
      setIsSending(false);
    }
  };

  if (!publicKey) {
    return (
      <div className="transaction-card">
        <div className="transaction-card-header">
          <h3>Send SOL</h3>
        </div>
        <div className="transaction-card-body">
          <p className="transaction-card-message">Please connect a wallet to send transactions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="transaction-card">
      <div className="transaction-card-header">
        <h3>Send SOL</h3>
      </div>
      <div className="transaction-card-body">
        <div className="transaction-form">
          <div className="form-group">
            <label htmlFor="recipient">Recipient Address</label>
            <input
              id="recipient"
              type="text"
              placeholder="Enter Solana address"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              disabled={isSending}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="amount">Amount (SOL)</label>
            <input
              id="amount"
              type="number"
              step="0.001"
              min="0"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isSending}
            />
          </div>
          
          {error && <div className="transaction-error">{error}</div>}
          
          {signature && (
            <div className="transaction-result">
              <p>Transaction: <span className="tx-signature">{signature}</span></p>
              <p>Status: <span className={`tx-status tx-status-${status?.status || 'pending'}`}>
                {status?.status || 'Processing...'}
              </span></p>
            </div>
          )}
          
          <button 
            className="send-button" 
            onClick={handleSendTransaction}
            disabled={isSending}
          >
            {isSending ? 'Sending...' : 'Send SOL'}
          </button>
        </div>
      </div>
    </div>
  );
};