import React, { useState } from 'react';
import {
  useWallet,
  useConnection,
  signMessage as signMessageCore,
  signTransaction as signTransactionCore,
  sendTransaction as sendTransactionCore,
  signAllTransactions as signAllTransactionsCore,
  signAndSendTransaction as signAndSendTransactionCore,
  createKitTransaction,
  generateKitKeypair,
} from '@hermis/solana-headless-react';
import {
  Transaction,
  SystemProgram,
  PublicKey,
  LAMPORTS_PER_SOL,
  Connection
} from '@hermis/solana-headless-core';
import './TransactionMethodsDemo.css';

interface TransactionMethodsDemoProps {
  onMethodResult?: (method: string, result: string, architecture: string) => void;
}

export const TransactionMethodsDemo: React.FC<TransactionMethodsDemoProps> = ({ onMethodResult }) => {
  const { connection: dualConnection } = useConnection();
  const connection = dualConnection as Connection;
  const { publicKey, wallet } = useWallet();
  const [recipient] = useState('So11111111111111111111111111111111111111112'); // Wrapped SOL
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, { signature?: string; error?: string; architecture?: string }>>({});

  const addResult = (method: string, result: { signature?: string; error?: string; architecture?: string }) => {
    setResults(prev => ({ ...prev, [method]: result }));
    if (onMethodResult && result.signature) {
      onMethodResult(method, result.signature, result.architecture || 'unknown');
    }
  };

  const setMethodLoading = (method: string, loading: boolean) => {
    setIsLoading(prev => ({ ...prev, [method]: loading }));
  };

  const logArchitecturePath = (method: string, architecture: 'web3.js' | 'kit', details: string) => {
    const emoji = architecture === 'web3.js' ? '' : '🟢';
    console.log(`${emoji} ${method} - ${architecture.toUpperCase()} Path: ${details}`);
  };

  // 1. Sign Message Demo
  const handleSignMessageDemo = async () => {
    if (!publicKey || !wallet?.adapter) return;

    setMethodLoading('signMessage', true);
    try {
      const message = `Dual Architecture Message Test - ${new Date().toISOString()}`;

      // Test with Web3.js style (legacy wallet adapter)
      logArchitecturePath('signMessage', 'web3.js', 'Using wallet adapter (legacy)');
      const messageBytes = new TextEncoder().encode(message);
      const signature = await signMessageCore(messageBytes, wallet.adapter);

      const signatureBase64 = btoa(String.fromCharCode.apply(null, Array.from(signature)));
      addResult('signMessage', {
        signature: signatureBase64,
        architecture: 'web3.js (adapter)'
      });

    } catch (error) {
      console.error('Sign message error:', error);
      addResult('signMessage', { error: (error as Error).message });
    } finally {
      setMethodLoading('signMessage', false);
    }
  };

  // 2. Sign Transaction Demo
  const handleSignTransactionDemo = async () => {
    if (!publicKey || !wallet?.adapter || !connection) return;

    setMethodLoading('signTransaction', true);
    try {
      // Create Web3.js style transaction
      const transaction = new Transaction();
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      transaction.add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(recipient),
          lamports: 0.001 * LAMPORTS_PER_SOL
        })
      );

      logArchitecturePath('signTransaction', 'web3.js', 'Transaction + WalletAdapter');
      await signTransactionCore(transaction, wallet.adapter);

      addResult('signTransaction', {
        signature: 'Transaction signed successfully',
        architecture: 'web3.js (Transaction + Adapter)'
      });

    } catch (error) {
      console.error('Sign transaction error:', error);
      addResult('signTransaction', { error: (error as Error).message });
    } finally {
      setMethodLoading('signTransaction', false);
    }
  };

  // 3. Send Transaction Demo
  const handleSendTransactionDemo = async () => {
    if (!publicKey || !wallet?.adapter || !connection) return;

    setMethodLoading('sendTransaction', true);
    try {
      // Create Web3.js style transaction
      const transaction = new Transaction();
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      transaction.add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(recipient),
          lamports: 0.001 * LAMPORTS_PER_SOL
        })
      );

      logArchitecturePath('sendTransaction', 'web3.js', 'Transaction + WalletAdapter via dual architecture');
      const signature = await sendTransactionCore(connection, transaction, wallet.adapter);

      addResult('sendTransaction', {
        signature,
        architecture: 'web3.js (dual architecture)'
      });

    } catch (error) {
      console.error('Send transaction error:', error);
      addResult('sendTransaction', { error: (error as Error).message });
    } finally {
      setMethodLoading('sendTransaction', false);
    }
  };

  // 4. Sign All Transactions Demo
  const handleSignAllTransactionsDemo = async () => {
    if (!publicKey || !wallet?.adapter || !connection) return;

    setMethodLoading('signAllTransactions', true);
    try {
      // Create multiple Web3.js style transactions
      const { blockhash } = await connection.getLatestBlockhash();

      const transactions = [];
      for (let i = 0; i < 2; i++) {
        const transaction = new Transaction();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = publicKey;

        transaction.add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: new PublicKey(recipient),
            lamports: 0.001 * LAMPORTS_PER_SOL
          })
        );
        transactions.push(transaction);
      }

      logArchitecturePath('signAllTransactions', 'web3.js', 'Multiple Transactions + WalletAdapter');
      const signedTransactions = await signAllTransactionsCore(transactions, wallet.adapter);

      addResult('signAllTransactions', {
        signature: `${signedTransactions.length} transactions signed successfully`,
        architecture: 'web3.js (batch signing)'
      });

    } catch (error) {
      console.error('Sign all transactions error:', error);
      addResult('signAllTransactions', { error: (error as Error).message });
    } finally {
      setMethodLoading('signAllTransactions', false);
    }
  };

  // 5. Sign and Send Transaction Demo
  const handleSignAndSendTransactionDemo = async () => {
    if (!publicKey || !wallet?.adapter || !connection) return;

    setMethodLoading('signAndSendTransaction', true);
    try {
      // Create Web3.js style transaction
      const transaction = new Transaction();
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      transaction.add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(recipient),
          lamports: 0.001 * LAMPORTS_PER_SOL
        })
      );

      logArchitecturePath('signAndSendTransaction', 'web3.js', 'Combined operation via dual architecture');
      const signature = await signAndSendTransactionCore(connection, transaction, wallet.adapter);

      addResult('signAndSendTransaction', {
        signature,
        architecture: 'web3.js (combined operation)'
      });

    } catch (error) {
      console.error('Sign and send transaction error:', error);
      addResult('signAndSendTransaction', { error: (error as Error).message });
    } finally {
      setMethodLoading('signAndSendTransaction', false);
    }
  };

  // Kit Architecture Demo
  const handleKitArchitectureDemo = async () => {
    setMethodLoading('kitDemo', true);
    try {
      // Generate Kit-style signer
      logArchitecturePath('Kit Demo', 'kit', 'Generating CryptoKeyPair signer');
      const kitKeypair = await generateKitKeypair();

      // Create Kit-style transaction message
      logArchitecturePath('Kit Demo', 'kit', 'Creating TransactionMessage');
      const kitTransaction = await createKitTransaction(
        connection,
        kitKeypair.address,
        [] // No instructions for demo
      );

      // Test Kit signing
      logArchitecturePath('Kit Demo', 'kit', 'Signing with Kit architecture');
      await signTransactionCore(kitTransaction, kitKeypair.signer);

      addResult('kitDemo', {
        signature: 'Kit transaction signed successfully',
        architecture: 'kit (TransactionMessage + CryptoKeyPair)'
      });

    } catch (error) {
      console.error('Kit demo error:', error);
      addResult('kitDemo', { error: (error as Error).message });
    } finally {
      setMethodLoading('kitDemo', false);
    }
  };

  if (!publicKey) {
    return (
      <div className="transaction-methods-demo">
        <div className="demo-header">
          <h3> Dual Architecture Transaction Methods Demo</h3>
          <p>Please connect a wallet to test all dual architecture methods</p>
        </div>
      </div>
    );
  }

  return (
    <div className="transaction-methods-demo">
      <div className="demo-header">
        <h3> Dual Architecture Transaction Methods Demo</h3>
        <p>Test all 5 core operations with automatic architecture detection</p>
        <div className="architecture-legend">
          <span className="legend-item web3js"> Web3.js Path</span>
          <span className="legend-item kit">🟢 Kit Path</span>
        </div>
      </div>

      <div className="methods-grid">
        {/* Sign Message */}
        <div className="method-card">
          <h4>1. Sign Message</h4>
          <p>Dual architecture message signing</p>
          <button
            onClick={handleSignMessageDemo}
            disabled={isLoading.signMessage}
            className="method-button"
          >
            {isLoading.signMessage ? 'Signing...' : 'Test signMessage'}
          </button>
          {results.signMessage && (
            <div className={`result ${results.signMessage.error ? 'error' : 'success'}`}>
              {results.signMessage.error ? (
                <span>❌ {results.signMessage.error}</span>
              ) : (
                <div>
                  <span>✅ Architecture: {results.signMessage.architecture}</span>
                  <div className="signature-preview">
                    Signature: {results.signMessage.signature?.substring(0, 32)}...
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sign Transaction */}
        <div className="method-card">
          <h4>2. Sign Transaction</h4>
          <p>Dual architecture transaction signing</p>
          <button
            onClick={handleSignTransactionDemo}
            disabled={isLoading.signTransaction}
            className="method-button"
          >
            {isLoading.signTransaction ? 'Signing...' : 'Test signTransaction'}
          </button>
          {results.signTransaction && (
            <div className={`result ${results.signTransaction.error ? 'error' : 'success'}`}>
              {results.signTransaction.error ? (
                <span>❌ {results.signTransaction.error}</span>
              ) : (
                <div>
                  <span>✅ Architecture: {results.signTransaction.architecture}</span>
                  <div className="signature-preview">{results.signTransaction.signature}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Send Transaction */}
        <div className="method-card">
          <h4>3. Send Transaction</h4>
          <p>Dual architecture transaction sending</p>
          <button
            onClick={handleSendTransactionDemo}
            disabled={isLoading.sendTransaction}
            className="method-button"
          >
            {isLoading.sendTransaction ? 'Sending...' : 'Test sendTransaction'}
          </button>
          {results.sendTransaction && (
            <div className={`result ${results.sendTransaction.error ? 'error' : 'success'}`}>
              {results.sendTransaction.error ? (
                <span>❌ {results.sendTransaction.error}</span>
              ) : (
                <div>
                  <span>✅ Architecture: {results.sendTransaction.architecture}</span>
                  <div className="signature-preview">
                    TX: {results.sendTransaction.signature?.substring(0, 32)}...
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sign All Transactions */}
        <div className="method-card">
          <h4>4. Sign All Transactions</h4>
          <p>Dual architecture batch signing</p>
          <button
            onClick={handleSignAllTransactionsDemo}
            disabled={isLoading.signAllTransactions}
            className="method-button"
          >
            {isLoading.signAllTransactions ? 'Signing...' : 'Test signAllTransactions'}
          </button>
          {results.signAllTransactions && (
            <div className={`result ${results.signAllTransactions.error ? 'error' : 'success'}`}>
              {results.signAllTransactions.error ? (
                <span>❌ {results.signAllTransactions.error}</span>
              ) : (
                <div>
                  <span>✅ Architecture: {results.signAllTransactions.architecture}</span>
                  <div className="signature-preview">{results.signAllTransactions.signature}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sign and Send Transaction */}
        <div className="method-card">
          <h4>5. Sign & Send Transaction</h4>
          <p>Dual architecture combined operation</p>
          <button
            onClick={handleSignAndSendTransactionDemo}
            disabled={isLoading.signAndSendTransaction}
            className="method-button"
          >
            {isLoading.signAndSendTransaction ? 'Processing...' : 'Test signAndSendTransaction'}
          </button>
          {results.signAndSendTransaction && (
            <div className={`result ${results.signAndSendTransaction.error ? 'error' : 'success'}`}>
              {results.signAndSendTransaction.error ? (
                <span>❌ {results.signAndSendTransaction.error}</span>
              ) : (
                <div>
                  <span>✅ Architecture: {results.signAndSendTransaction.architecture}</span>
                  <div className="signature-preview">
                    TX: {results.signAndSendTransaction.signature?.substring(0, 32)}...
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Kit Architecture Demo */}
        <div className="method-card kit-demo">
          <h4>🟢 Kit Architecture Demo</h4>
          <p>Pure kit: TransactionMessage + CryptoKeyPair</p>
          <button
            onClick={handleKitArchitectureDemo}
            disabled={isLoading.kitDemo}
            className="method-button kit-button"
          >
            {isLoading.kitDemo ? 'Testing...' : 'Test Kit Architecture'}
          </button>
          {results.kitDemo && (
            <div className={`result ${results.kitDemo.error ? 'error' : 'success'}`}>
              {results.kitDemo.error ? (
                <span>❌ {results.kitDemo.error}</span>
              ) : (
                <div>
                  <span>✅ Architecture: {results.kitDemo.architecture}</span>
                  <div className="signature-preview">{results.kitDemo.signature}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="demo-footer">
        <p> <strong>Goal Achieved:</strong> ONE method handles BOTH web3.js and kit architectures!</p>
        <p>Check the console for detailed architecture path logging.</p>
      </div>
    </div>
  );
};