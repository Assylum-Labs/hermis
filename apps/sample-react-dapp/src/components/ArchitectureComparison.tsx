import React, { useState } from 'react';
import {
  useWallet,
  useConnection,
  signTransaction as signTransactionCore,
  createKitTransaction,
  generateKitKeypair,
} from '@hermis/solana-headless-react';
import {
  Transaction,
  SystemProgram,
  PublicKey,
  LAMPORTS_PER_SOL,
  Connection,
} from '@hermis/solana-headless-core';
import './ArchitectureComparison.css';

interface ComparisonResult {
  signature?: string;
  error?: string;
  executionTime?: number;
  details?: string;
}

export const ArchitectureComparison: React.FC = () => {
  const { connection: dualConnection } = useConnection();
  const connection = dualConnection as Connection;
  const { publicKey, wallet } = useWallet();
  const [recipient] = useState('So11111111111111111111111111111111111111112'); // Wrapped SOL
  const [isRunning, setIsRunning] = useState(false);
  const [web3Results, setWeb3Results] = useState<ComparisonResult>({});
  const [kitResults, setKitResults] = useState<ComparisonResult>({});
  const [currentStep, setCurrentStep] = useState<string>('');

  const logStep = (step: string) => {
    setCurrentStep(step);
    console.log(` ${step}`);
  };

  const runComparison = async () => {
    if (!publicKey || !wallet?.adapter || !connection) return;

    setIsRunning(true);
    setWeb3Results({});
    setKitResults({});
    setCurrentStep('Starting comparison...');

    try {
      // Web3.js Approach
      logStep(' Creating Web3.js Transaction...');
      const web3StartTime = performance.now();

      const web3Transaction = new Transaction();
      const { blockhash } = await connection.getLatestBlockhash();
      web3Transaction.recentBlockhash = blockhash;
      web3Transaction.feePayer = publicKey;

      web3Transaction.add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(recipient),
          lamports: 0.001 * LAMPORTS_PER_SOL
        })
      );

      logStep(' Signing Web3.js Transaction with Dual Architecture...');
      console.log('   Input: Transaction + WalletAdapter');
      console.log('   Expected Path: Legacy wallet detection → sign via adapter');

      await signTransactionCore(web3Transaction, wallet.adapter);
      const web3EndTime = performance.now();
      const web3ExecutionTime = web3EndTime - web3StartTime;

      setWeb3Results({
        signature: 'Web3.js transaction signed successfully',
        executionTime: web3ExecutionTime,
        details: `Transaction type: ${web3Transaction.constructor.name}, Signer: WalletAdapter`
      });

      console.log(`✅ Web3.js path completed in ${web3ExecutionTime.toFixed(2)}ms`);

      // Kit Approach
      logStep('🟢 Creating Kit TransactionMessage...');
      const kitStartTime = performance.now();

      // Generate Kit keypair for demonstration
      const kitKeypair = await generateKitKeypair();

      logStep('🟢 Building Kit TransactionMessage...');
      const kitTransaction = await createKitTransaction(
        connection,
        kitKeypair.address,
        [] // Instructions would be added here in real usage
      );

      logStep('🟢 Signing Kit Transaction with Dual Architecture...');
      console.log('   Input: TransactionMessage + CryptoKeyPair');
      console.log('   Expected Path: Kit architecture detection → sign via kit methods');

      await signTransactionCore(kitTransaction, kitKeypair.keypair);
      const kitEndTime = performance.now();
      const kitExecutionTime = kitEndTime - kitStartTime;

      setKitResults({
        signature: 'Kit transaction signed successfully',
        executionTime: kitExecutionTime,
        details: `Transaction type: TransactionMessage, Signer: CryptoKeyPair`
      });

      console.log(`✅ Kit path completed in ${kitExecutionTime.toFixed(2)}ms`);

      logStep('✅ Comparison Complete!');

    } catch (error) {
      console.error('Comparison error:', error);
      if (currentStep.includes('')) {
        setWeb3Results({ error: (error as Error).message });
      } else {
        setKitResults({ error: (error as Error).message });
      }
    } finally {
      setIsRunning(false);
      setCurrentStep('');
    }
  };

  if (!publicKey) {
    return (
      <div className="architecture-comparison">
        <div className="comparison-header">
          <h3> Architecture Comparison: Web3.js vs Kit</h3>
          <p>Please connect a wallet to compare architectures</p>
        </div>
      </div>
    );
  }

  return (
    <div className="architecture-comparison">
      <div className="comparison-header">
        <h3> Architecture Comparison: Web3.js vs Kit</h3>
        <p>Side-by-side comparison showing how the SAME dual architecture method handles different inputs</p>
      </div>

      <div className="comparison-controls">
        <button
          onClick={runComparison}
          disabled={isRunning}
          className="comparison-button"
        >
          {isRunning ? 'Running Comparison...' : 'Run Side-by-Side Comparison'}
        </button>
        {currentStep && (
          <div className="current-step">
            {currentStep}
          </div>
        )}
      </div>

      <div className="comparison-grid">
        {/* Web3.js Side */}
        <div className="comparison-side web3js-side">
          <div className="side-header">
            <h4> Web3.js Architecture</h4>
            <p>Traditional Solana development</p>
          </div>

          <div className="code-example">
            <h5>Code Structure:</h5>
            <pre><code>{`// Web3.js Style
import { Transaction, SystemProgram } from '@solana/web3.js';

const transaction = new Transaction();
transaction.add(SystemProgram.transfer({
  fromPubkey: publicKey,
  toPubkey: recipientKey,
  lamports: amount
}));

// SAME dual architecture method!
const signed = await signTransactionCore(
  transaction,     // ← Transaction object
  wallet.adapter   // ← WalletAdapter
);`}</code></pre>
          </div>

          <div className="execution-path">
            <h5>Execution Path:</h5>
            <ol>
              <li>Detect: Transaction object (legacy)</li>
              <li>Detect: WalletAdapter (legacy)</li>
              <li>Route: Use legacy signing path</li>
              <li>Execute: adapter.signTransaction()</li>
            </ol>
          </div>

          {web3Results.signature && (
            <div className="result-card success">
              <h5>✅ Result:</h5>
              <p>{web3Results.signature}</p>
              <div className="result-details">
                <p>Execution Time: {web3Results.executionTime?.toFixed(2)}ms</p>
                <p>{web3Results.details}</p>
              </div>
            </div>
          )}

          {web3Results.error && (
            <div className="result-card error">
              <h5>❌ Error:</h5>
              <p>{web3Results.error}</p>
            </div>
          )}
        </div>

        {/* Kit Side */}
        <div className="comparison-side kit-side">
          <div className="side-header">
            <h4>🟢 Kit Architecture</h4>
            <p>Modern Solana development</p>
          </div>

          <div className="code-example">
            <h5>Code Structure:</h5>
            <pre><code>{`// Kit Style
import { createTransactionMessage } from '@solana/kit';

const transactionMessage = createTransactionMessage({
  version: 0,
  instructions: [transferInstruction],
  feePayer: address,
  lifetimeConstraint: blockhash
});

// SAME dual architecture method!
const signed = await signTransactionCore(
  transactionMessage,  // ← TransactionMessage
  cryptoKeyPair       // ← CryptoKeyPair
);`}</code></pre>
          </div>

          <div className="execution-path">
            <h5>Execution Path:</h5>
            <ol>
              <li>Detect: TransactionMessage (kit)</li>
              <li>Detect: CryptoKeyPair (kit)</li>
              <li>Route: Use kit signing path</li>
              <li>Execute: kit.signTransaction()</li>
            </ol>
          </div>

          {kitResults.signature && (
            <div className="result-card success">
              <h5>✅ Result:</h5>
              <p>{kitResults.signature}</p>
              <div className="result-details">
                <p>Execution Time: {kitResults.executionTime?.toFixed(2)}ms</p>
                <p>{kitResults.details}</p>
              </div>
            </div>
          )}

          {kitResults.error && (
            <div className="result-card error">
              <h5>❌ Error:</h5>
              <p>{kitResults.error}</p>
            </div>
          )}
        </div>
      </div>

      <div className="comparison-summary">
        <h4> Key Takeaway</h4>
        <div className="summary-points">
          <div className="summary-point">
            <strong>Same Method:</strong> <code>signTransaction</code> handles both architectures
          </div>
          <div className="summary-point">
            <strong>Automatic Detection:</strong> Input types determine the execution path
          </div>
          <div className="summary-point">
            <strong>Backward Compatibility:</strong> Existing web3.js code continues working unchanged
          </div>
          <div className="summary-point">
            <strong>Forward Compatibility:</strong> New kit code works seamlessly with same API
          </div>
        </div>
      </div>

      <div className="architecture-details">
        <h4>📋 Input Type Detection</h4>
        <div className="detection-table">
          <div className="detection-row header">
            <span>Input Type</span>
            <span>Architecture</span>
            <span>Execution Path</span>
          </div>
          <div className="detection-row">
            <span>Transaction + Keypair</span>
            <span> Web3.js</span>
            <span>Legacy signing</span>
          </div>
          <div className="detection-row">
            <span>Transaction + WalletAdapter</span>
            <span> Web3.js</span>
            <span>Adapter signing</span>
          </div>
          <div className="detection-row">
            <span>TransactionMessage + CryptoKeyPair</span>
            <span>🟢 Kit</span>
            <span>Kit signing</span>
          </div>
          <div className="detection-row">
            <span>TransactionMessage + KeyPairSigner</span>
            <span>🟢 Kit</span>
            <span>Kit signer signing</span>
          </div>
        </div>
      </div>
    </div>
  );
};