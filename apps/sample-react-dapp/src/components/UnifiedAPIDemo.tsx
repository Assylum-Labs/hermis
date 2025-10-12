import React, { useState } from 'react';
import {
  useWallet,
  useConnection,
  generateKitKeypair,
  createKitTransaction,
} from '@hermis/solana-headless-react';
import {
  Transaction,
  SystemProgram,
  PublicKey,
  LAMPORTS_PER_SOL,
  Connection
} from '@hermis/solana-headless-core';
import './UnifiedAPIDemo.css';

interface UnifiedAPIDemoProps {
  recipient?: string;
  amount?: string;
}

export const UnifiedAPIDemo: React.FC<UnifiedAPIDemoProps> = ({ recipient, amount }) => {
  const { connection: dualConnection } = useConnection();
  const connection = dualConnection as Connection;
  const { publicKey, wallet, signTransaction, sendTransaction } = useWallet();
  const [isTestingWeb3, setIsTestingWeb3] = useState(false);
  const [isTestingKit, setIsTestingKit] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [results, setResults] = useState<{web3?: string; kit?: string}>({});

  const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : '🔹';
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${emoji} ${message}`]);
  };

  const clearLogs = () => {
    setLogs([]);
    setResults({});
  };

  // Test Web3.js Transaction with Unified API
  const handleTestWeb3Transaction = async () => {
    if (!publicKey || !connection || !wallet?.adapter || !recipient || !amount) return;

    setIsTestingWeb3(true);
    addLog('🟦 Testing Web3.js Transaction with Unified API', 'info');

    try {
      // Step 1: Create web3.js Transaction
      addLog('Creating web3.js Transaction object');
      const transaction = new Transaction();
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      transaction.add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(recipient),
          lamports: parseFloat(amount) * LAMPORTS_PER_SOL
        })
      );

      addLog('Created Transaction: ' + JSON.stringify({ type: 'web3.js Transaction', feePayer: publicKey.toBase58().substring(0, 16) + '...' }));

      // Step 2: Sign with standard API
      addLog('Calling signTransaction(web3Tx, options)');
      const signedTx = await signTransaction(transaction);
      addLog('✅ signTransaction successfully signed web3.js transaction!', 'success');

      // Step 3: Send with standard API
      addLog('Calling sendTransaction(connection, signedTx)');
      const signature = await sendTransaction(signedTx, connection);
      addLog(`✅ sendTransaction successfully sent web3.js transaction!`, 'success');
      addLog(`Signature: ${signature.substring(0, 16)}...`, 'success');

      setResults(prev => ({ ...prev, web3: signature }));

    } catch (error) {
      addLog(`❌ Error: ${(error as Error).message}`, 'error');
      console.error('Web3 unified API test error:', error);
    } finally {
      setIsTestingWeb3(false);
    }
  };

  // Test Kit TransactionMessage with Unified API
  const handleTestKitTransaction = async () => {
    if (!connection) return;

    setIsTestingKit(true);
    addLog('🟢 Testing Kit TransactionMessage with Unified API', 'info');

    try {
      // Step 1: Generate Kit signer
      addLog('Generating Kit KeyPairSigner (CryptoKeyPair)');
      const kitKeypair = await generateKitKeypair();
      addLog(`Generated Kit signer with address: ${kitKeypair.address.substring(0, 16)}...`);

      // Step 2: Create Kit TransactionMessage
      addLog('Creating Kit TransactionMessage');
      const kitTransaction = await createKitTransaction(
        connection,
        kitKeypair.address,
        [] // Empty instructions for demo
      );
      addLog('Created TransactionMessage: ' + JSON.stringify({ type: 'Kit TransactionMessage', version: '0' }));

      // Step 3: Sign with standard API (SAME METHOD!)
      addLog('Calling signTransaction(kitTx, options) - SAME API!');
      await signTransaction(kitTransaction);
      addLog('✅ signTransaction successfully signed Kit transaction!', 'success');
      addLog('🎯 Key Point: SAME signTransaction() method handled Kit transaction!', 'success');

      setResults(prev => ({ ...prev, kit: 'Kit transaction signed successfully!' }));

    } catch (error) {
      addLog(`❌ Error: ${(error as Error).message}`, 'error');
      console.error('Kit unified API test error:', error);
    } finally {
      setIsTestingKit(false);
    }
  };

  if (!publicKey) {
    return (
      <div className="unified-api-demo">
        <div className="demo-header">
          <h3>✨ Unified API Demo</h3>
          <p>Please connect a wallet to test the unified API</p>
        </div>
      </div>
    );
  }

  return (
    <div className="unified-api-demo">
      <div className="demo-header">
        <h3>✨ Unified API Demo</h3>
        <p className="demo-subtitle">One API, Two Architectures</p>
      </div>

      <div className="api-comparison">
        <div className="comparison-section">
          <h4>🟦 Web3.js Transaction</h4>
          <div className="code-example">
            <code>
              const tx = new Transaction();<br/>
              <span className="highlight">await signTransaction(tx);</span><br/>
              <span className="highlight">await sendTransaction(tx, connection);</span>
            </code>
          </div>
        </div>

        <div className="divider">
          <span className="divider-text">SAME API</span>
        </div>

        <div className="comparison-section">
          <h4>🟢 Kit TransactionMessage</h4>
          <div className="code-example">
            <code>
              const kitTx = await createKitTransaction(...);<br/>
              <span className="highlight">await signTransaction(kitTx);</span><br/>
              <span className="highlight">await sendTransaction(kitTx, connection);</span>
            </code>
          </div>
        </div>
      </div>

      <div className="test-buttons">
        <button
          onClick={handleTestWeb3Transaction}
          disabled={isTestingWeb3 || isTestingKit || !recipient || !amount}
          className="test-button web3-button"
        >
          {isTestingWeb3 ? 'Testing...' : '🟦 Test Web3.js with Unified API'}
        </button>

        <button
          onClick={handleTestKitTransaction}
          disabled={isTestingWeb3 || isTestingKit}
          className="test-button kit-button"
        >
          {isTestingKit ? 'Testing...' : '🟢 Test Kit with Unified API'}
        </button>

        {logs.length > 0 && (
          <button onClick={clearLogs} className="clear-button">
            Clear Logs
          </button>
        )}
      </div>

      {results.web3 && (
        <div className="result-box success">
          <strong>Web3.js Result:</strong> {results.web3.substring(0, 32)}...
        </div>
      )}

      {results.kit && (
        <div className="result-box success">
          <strong>Kit Result:</strong> {results.kit}
        </div>
      )}

      {logs.length > 0 && (
        <div className="logs-section">
          <h5>📋 Execution Log</h5>
          <div className="logs-container">
            {logs.map((log, index) => (
              <div key={index} className="log-entry">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="demo-footer">
        <div className="key-point">
          <strong>🎯 Key Achievement:</strong> ONE API method automatically handles BOTH web3.js and Kit architectures!
        </div>
        <div className="benefits">
          <h5>Benefits:</h5>
          <ul>
            <li>✅ No need to know which architecture you're using</li>
            <li>✅ Automatic detection and routing</li>
            <li>✅ Same method signature for both</li>
            <li>✅ Seamless developer experience</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
