import React, { useState } from 'react';
import {
  useWallet,
  useConnection,
  useSolanaTransaction,
  signTransaction as signTransactionCore,
  sendTransaction as sendTransactionCore,
  signAndSendTransaction as signAndSendTransactionCore,
  createKitTransaction,
  generateKitKeypair,
  supportsKitArchitecture,
  isKitTransaction
} from '@hermis/solana-headless-react';
import {
  Transaction,
  SystemProgram,
  PublicKey,
  LAMPORTS_PER_SOL,
  Connection
} from '@hermis/solana-headless-core';
import './TransactionCard.css';

interface TransactionCardProps {
  onTransactionSent?: (signature: string) => void;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({ onTransactionSent }) => {
  const { connection: dualConnection } = useConnection();
  const connection = dualConnection as Connection;
  const { publicKey, sendTransaction, signTransaction, wallet } = useWallet();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSigningKit, setIsSigningKit] = useState(false);
  const [isSendingKit, setIsSendingKit] = useState(false);
  const [isSignAndSending, setIsSignAndSending] = useState(false);
  const [isKitTransactionDemo, setIsKitTransactionDemo] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [architectureLog, setArchitectureLog] = useState<string[]>([]);
  
  const { status } = useSolanaTransaction(signature || undefined);

  const isValidSolanaAddress = (address: string): boolean => {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  };

  const addArchitectureLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    setArchitectureLog(prev => [...prev, logEntry]);
    console.log(`🔍 ${logEntry}`);
  };

  const clearLogs = () => {
    setArchitectureLog([]);
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

  // Sign transaction using Kit (dual architecture)
  const handleSignTransactionKit = async () => {
    if (!publicKey || !connection || !wallet?.adapter) return;

    setError(null);
    setIsSigningKit(true);

    try {
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

      // Create the transaction
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

      // Use dual architecture signTransaction - this will detect wallet type and route appropriately
      const signedTransaction = await signTransactionCore(transaction, wallet.adapter);

      console.log('Transaction signed using Kit dual architecture:', signedTransaction);
      alert('Transaction signed successfully using Kit! Check console for details.');

    } catch (err) {
      console.error('Error signing transaction with Kit:', err);
      setError((err as Error).message || 'Failed to sign transaction with Kit');
    } finally {
      setIsSigningKit(false);
    }
  };

  // Send transaction using Kit (dual architecture)
  const handleSendTransactionKit = async () => {
    if (!publicKey || !connection || !wallet?.adapter) return;

    setError(null);
    setIsSendingKit(true);
    addArchitectureLog('🟦 Starting Kit-style sendTransaction demo...');

    try {
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

      // Create the transaction
      addArchitectureLog('Creating Transaction object (web3.js style)');
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

      addArchitectureLog('Calling sendTransaction with Transaction + WalletAdapter');
      addArchitectureLog('Expected path: Legacy detection → adapter.sendTransaction()');

      // Use dual architecture sendTransaction - this will sign and send using kit approach
      const txSignature = await sendTransactionCore(connection, transaction, wallet.adapter);

      setSignature(txSignature);
      if (onTransactionSent) {
        onTransactionSent(txSignature);
      }

      setAmount('');
      setRecipient('');

      addArchitectureLog(`✅ Transaction sent successfully: ${txSignature.substring(0, 16)}...`);

    } catch (err) {
      console.error('Error sending transaction with Kit:', err);
      setError((err as Error).message || 'Failed to send transaction with Kit');
      addArchitectureLog(`❌ Error: ${(err as Error).message}`);
    } finally {
      setIsSendingKit(false);
    }
  };

  // Sign and Send Transaction (combined operation)
  const handleSignAndSendTransaction = async () => {
    if (!publicKey || !connection || !wallet?.adapter) return;

    setError(null);
    setIsSignAndSending(true);
    addArchitectureLog('🔄 Starting signAndSendTransaction demo...');

    try {
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

      // Create the transaction
      addArchitectureLog('Creating Transaction for combined sign & send operation');
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

      addArchitectureLog('Calling signAndSendTransaction (NEW METHOD!)');
      addArchitectureLog('This combines signing + sending in one dual architecture call');

      // Use the new combined operation
      const txSignature = await signAndSendTransactionCore(connection, transaction, wallet.adapter);

      setSignature(txSignature);
      if (onTransactionSent) {
        onTransactionSent(txSignature);
      }

      setAmount('');
      setRecipient('');

      addArchitectureLog(`✅ Combined operation successful: ${txSignature.substring(0, 16)}...`);

    } catch (err) {
      console.error('Error with sign and send transaction:', err);
      setError((err as Error).message || 'Failed to sign and send transaction');
      addArchitectureLog(`❌ Error: ${(err as Error).message}`);
    } finally {
      setIsSignAndSending(false);
    }
  };

  // Kit Transaction Demo (pure kit architecture)
  const handleKitTransactionDemo = async () => {
    setError(null);
    setIsKitTransactionDemo(true);
    addArchitectureLog('🟢 Starting pure Kit architecture demo...');

    try {
      addArchitectureLog('Generating Kit CryptoKeyPair...');
      const kitKeypair = await generateKitKeypair();

      addArchitectureLog('Creating Kit TransactionMessage...');
      const kitTransaction = await createKitTransaction(
        connection,
        kitKeypair.address,
        [] // Empty instructions for demo
      );

      addArchitectureLog('Checking architecture support...');
      addArchitectureLog(`Kit wallet support: ${supportsKitArchitecture(kitKeypair.keypair)}`);
      addArchitectureLog(`Kit transaction type: ${isKitTransaction(kitTransaction)}`);

      addArchitectureLog('Signing with signTransaction...');
      addArchitectureLog('Expected path: Kit detection → kit signing methods');

      await signTransactionCore(kitTransaction, kitKeypair.keypair);

      addArchitectureLog(`✅ Kit transaction signed successfully!`);
      addArchitectureLog('This used TransactionMessage + CryptoKeyPair → Kit signing path');

    } catch (err) {
      console.error('Error with Kit transaction demo:', err);
      setError((err as Error).message || 'Failed to demonstrate Kit transaction');
      addArchitectureLog(`❌ Kit demo error: ${(err as Error).message}`);
    } finally {
      setIsKitTransactionDemo(false);
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
          
          {/* Architecture Log */}
          {architectureLog.length > 0 && (
            <div className="architecture-log">
              <div className="log-header">
                <h5>🔍 Architecture Detection Log</h5>
                <button onClick={clearLogs} className="clear-log-button">Clear</button>
              </div>
              <div className="log-content">
                {architectureLog.map((log, index) => (
                  <div key={index} className="log-entry">{log}</div>
                ))}
              </div>
            </div>
          )}

          <div className="button-group">
            <div className="button-section">
              <h5>🟦 Web3.js Style (Legacy)</h5>
              <button
                className="send-button"
                onClick={handleSendTransaction}
                disabled={isSending || isSigningKit || isSendingKit || isSignAndSending || isKitTransactionDemo}
              >
                {isSending ? 'Sending...' : 'Send SOL (Standard)'}
              </button>

              <button
                className="send-button kit-button"
                onClick={handleSignTransactionKit}
                disabled={isSending || isSigningKit || isSendingKit || isSignAndSending || isKitTransactionDemo}
              >
                {isSigningKit ? 'Signing...' : 'Sign Transaction (Dual)'}
              </button>

              <button
                className="send-button kit-button"
                onClick={handleSendTransactionKit}
                disabled={isSending || isSigningKit || isSendingKit || isSignAndSending || isKitTransactionDemo}
              >
                {isSendingKit ? 'Sending...' : 'Send Transaction (Dual)'}
              </button>
            </div>

            <div className="button-section">
              <h5>🔄 New Dual Architecture Methods</h5>
              <button
                className="send-button new-method-button"
                onClick={handleSignAndSendTransaction}
                disabled={isSending || isSigningKit || isSendingKit || isSignAndSending || isKitTransactionDemo}
              >
                {isSignAndSending ? 'Processing...' : 'Sign & Send (Combined)'}
              </button>

              <button
                className="send-button kit-pure-button"
                onClick={handleKitTransactionDemo}
                disabled={isSending || isSigningKit || isSendingKit || isSignAndSending || isKitTransactionDemo}
              >
                {isKitTransactionDemo ? 'Testing...' : 'Kit Architecture Demo'}
              </button>
            </div>
          </div>

          <div className="architecture-info">
            <p><strong>🎯 Goal:</strong> Same methods handle both web3.js and kit inputs!</p>
            <p>Watch the log to see architecture detection in action.</p>
          </div>
        </div>
      </div>
    </div>
  );
};