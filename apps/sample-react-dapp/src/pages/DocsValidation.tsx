/**
 * Documentation Code Validation Page
 *
 * This page contains all React examples from the documentation
 * for manual testing purposes.
 *
 * To use:
 * 1. Connect your wallet
 * 2. Test each section by clicking the buttons
 * 3. Check console for results
 * 4. Mark off in VALIDATION_CHECKLIST.md
 */

import { useState } from 'react';
import { Transaction, SystemProgram, LAMPORTS_PER_SOL, PublicKey, ComputeBudgetProgram, Connection } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction, createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import { useWallet, useConnection, createKitTransaction } from '@hermis/solana-headless-react';
import {
  address,
  lamports,
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstruction,
  appendTransactionMessageInstructions,
  type TransactionSigner,
} from '@solana/kit';
import { createSolanaRpc, devnet } from '@solana/kit';
import { getTransferSolInstruction } from '@solana-program/system';
import { getSetComputeUnitPriceInstruction } from '@solana-program/compute-budget';
import { getTransferInstruction, getCreateAssociatedTokenIdempotentInstruction } from '@solana-program/token';

export default function DocsValidation() {
  const { publicKey, addressString, transactionSigner, signAndSendTransaction, signTransaction, signAllTransactions, connected } = useWallet();
  const { connection: dualConnection } = useConnection();
  const connection = dualConnection as Connection;

  const [testRecipient] = useState('9ksQrNQ5GEB4AKpuDrRxF8KASAtJ7zXXm81XSqsqNyhR'); // Valid address for testing
  const [testTokenMint] = useState('Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr'); // Devnet USDC
  const [testTokenAmount] = useState(1000000); // 1 USDC (6 decimals)
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string, type: 'success' | 'error' | 'info' = 'info', errorDetails?: any) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    console.log(logMessage);

    // If error details provided, log the full error object to console for debugging
    if (errorDetails) {
      console.error('Full error details:', errorDetails);
      if (errorDetails.cause) {
        console.error('Error cause:', errorDetails.cause);
      }
      if (errorDetails.context) {
        console.error('Error context:', errorDetails.context);
      }
    }

    setLogs(prev => [...prev, logMessage]);
  };

  // Helper function to check if a token account exists
  const checkTokenAccount = async (tokenAddress: PublicKey): Promise<boolean> => {
    try {
      const accountInfo = await connection.getAccountInfo(tokenAddress);
      return accountInfo !== null;
    } catch (error) {
      return false;
    }
  };

  // ==========================================================================
  // 1. BASIC TRANSFER - React + web3.js
  // ==========================================================================
  const testBasicTransferWeb3 = async () => {
    try {
      addLog('Testing Basic Transfer (React + web3.js)...');

      const transaction = new Transaction();
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: publicKey!,
          toPubkey: new PublicKey(testRecipient),
          lamports: 0.001 * LAMPORTS_PER_SOL
        })
      );

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey!;

      const signature = await signAndSendTransaction(transaction, connection);
      addLog(`✅ Basic Transfer (web3.js) SUCCESS: ${signature}`, 'success');
    } catch (error: any) {
      const errorMsg = error.message || String(error);
      const causeMsg = error.cause ? ` | Cause: ${error.cause.message || String(error.cause)}` : '';
      addLog(`❌ Basic Transfer (web3.js) FAILED: ${errorMsg}${causeMsg}`, 'error', error);
    }
  };

  // ==========================================================================
  // 1. BASIC TRANSFER - React + Kit (Proper Kit Pattern with pipe)
  // ==========================================================================
  const testBasicTransferKit = async () => {
    try {
      addLog('Testing Basic Transfer (React + Kit)...');

      const rpc = createSolanaRpc(devnet('https://api.devnet.solana.com'));

      // Get latest blockhash
      const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

      // Build transaction using Kit's functional pipe pattern
      const message = pipe(
        createTransactionMessage({ version: 0 }),
        m => setTransactionMessageFeePayerSigner(transactionSigner as TransactionSigner<string>, m),
        m => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
        m => appendTransactionMessageInstruction(
          getTransferSolInstruction({
            source: transactionSigner as TransactionSigner<string>,
            destination: address(testRecipient),
            amount: lamports(BigInt(0.001 * 1_000_000_000))
          }),
          m
        )
      );

      const signature = await signAndSendTransaction(message, rpc);
      addLog(`✅ Basic Transfer (Kit) SUCCESS: ${signature}`, 'success');
    } catch (error: any) {
      const errorMsg = error.message || String(error);
      const causeMsg = error.cause ? ` | Cause: ${error.cause.message || String(error.cause)}` : '';
      addLog(`❌ Basic Transfer (Kit) FAILED: ${errorMsg}${causeMsg}`, 'error', error);
    }
  };

  // ==========================================================================
  // 2. SIGN ONLY - React + web3.js
  // ==========================================================================
  const testSignOnlyWeb3 = async () => {
    try {
      addLog('Testing Sign Only (React + web3.js)...');

      const transaction = new Transaction();
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: publicKey!,
          toPubkey: new PublicKey(testRecipient),
          lamports: 0.001 * LAMPORTS_PER_SOL
        })
      );

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey!;

      const signedTx = await signTransaction(transaction);
      addLog(`✅ Sign Only (web3.js) SUCCESS: Transaction signed (${signedTx.signatures.length} signatures)`, 'success');
    } catch (error: any) {
      const errorMsg = error.message || String(error);
      const causeMsg = error.cause ? ` | Cause: ${error.cause.message || String(error.cause)}` : '';
      addLog(`❌ Sign Only (web3.js) FAILED: ${errorMsg}${causeMsg}`, 'error', error);
    }
  };

  // ==========================================================================
  // 2. SIGN ONLY - React + Kit (Proper Kit Pattern with pipe)
  // ==========================================================================
  const testSignOnlyKit = async () => {
    try {
      addLog('Testing Sign Only (React + Kit)...');

      const rpc = createSolanaRpc(devnet('https://api.devnet.solana.com'));

      // Get latest blockhash
      const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

      // Build transaction using Kit's functional pipe pattern
      const message = pipe(
        createTransactionMessage({ version: 0 }),
        m => setTransactionMessageFeePayerSigner(transactionSigner as TransactionSigner<string>, m),
        m => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
        m => appendTransactionMessageInstruction(
          getTransferSolInstruction({
            source: transactionSigner as TransactionSigner<string>,
            destination: address(testRecipient),
            amount: lamports(BigInt(0.001 * 1_000_000_000))
          }),
          m
        )
      );

      await signTransaction(message);
      addLog(`✅ Sign Only (Kit) SUCCESS: Message signed`, 'success');
    } catch (error: any) {
      const errorMsg = error.message || String(error);
      const causeMsg = error.cause ? ` | Cause: ${error.cause.message || String(error.cause)}` : '';
      addLog(`❌ Sign Only (Kit) FAILED: ${errorMsg}${causeMsg}`, 'error', error);
    }
  };

  // ==========================================================================
  // 3. SIGN MULTIPLE - React + web3.js
  // ==========================================================================
  const testSignMultipleWeb3 = async () => {
    try {
      addLog('Testing Sign Multiple (React + web3.js)...');

      // Create 3 identical transactions for testing
      const transactions = [];
      for (let i = 0; i < 3; i++) {
        const transaction = new Transaction();
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: publicKey!,
            toPubkey: new PublicKey(testRecipient),
            lamports: 0.001 * LAMPORTS_PER_SOL
          })
        );

        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = publicKey!;

        transactions.push(transaction);
      }

      const signedTxs = await signAllTransactions(transactions);
      addLog(`✅ Sign Multiple (web3.js) SUCCESS: ${signedTxs.length} transactions signed`, 'success');
    } catch (error: any) {
      const errorMsg = error.message || String(error);
      const causeMsg = error.cause ? ` | Cause: ${error.cause.message || String(error.cause)}` : '';
      addLog(`❌ Sign Multiple (web3.js) FAILED: ${errorMsg}${causeMsg}`, 'error', error);
    }
  };

  // ==========================================================================
  // 3. SIGN MULTIPLE - React + Kit (Proper Kit Pattern with pipe)
  // ==========================================================================
  const testSignMultipleKit = async () => {
    try {
      addLog('Testing Sign Multiple (React + Kit)...');

      const rpc = createSolanaRpc(devnet('https://api.devnet.solana.com'));

      // Get latest blockhash
      const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

      // Create 3 identical transaction messages for testing
      const messages = [];
      for (let i = 0; i < 3; i++) {
        const message = pipe(
          createTransactionMessage({ version: 0 }),
          m => setTransactionMessageFeePayerSigner(transactionSigner as TransactionSigner<string>, m),
          m => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
          m => appendTransactionMessageInstruction(
            getTransferSolInstruction({
              source: transactionSigner as TransactionSigner<string>,
              destination: address(testRecipient),
              amount: lamports(BigInt(0.001 * 1_000_000_000))
            }),
            m
          )
        );
        messages.push(message);
      }

      const signedMessages = await signAllTransactions(messages);
      addLog(`✅ Sign Multiple (Kit) SUCCESS: ${signedMessages.length} messages signed`, 'success');
    } catch (error: any) {
      const errorMsg = error.message || String(error);
      const causeMsg = error.cause ? ` | Cause: ${error.cause.message || String(error.cause)}` : '';
      addLog(`❌ Sign Multiple (Kit) FAILED: ${errorMsg}${causeMsg}`, 'error', error);
    }
  };

  // ==========================================================================
  // 4. WITH CONFIRMATION - React + web3.js
  // ==========================================================================
  const testWithConfirmationWeb3 = async () => {
    try {
      addLog('Testing With Confirmation (React + web3.js)...');

      const transaction = new Transaction();
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: publicKey!,
          toPubkey: new PublicKey(testRecipient),
          lamports: 0.001 * LAMPORTS_PER_SOL
        })
      );

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey!;

      const signature = await signAndSendTransaction(transaction, connection);

      addLog('Waiting for confirmation...');
      await connection.confirmTransaction(signature, 'confirmed');

      addLog(`✅ With Confirmation (web3.js) SUCCESS: ${signature} (confirmed)`, 'success');
    } catch (error: any) {
      const errorMsg = error.message || String(error);
      const causeMsg = error.cause ? ` | Cause: ${error.cause.message || String(error.cause)}` : '';
      addLog(`❌ With Confirmation (web3.js) FAILED: ${errorMsg}${causeMsg}`, 'error', error);
    }
  };

  // ==========================================================================
  // 4. WITH CONFIRMATION - React + Kit (Proper Kit Pattern with pipe)
  // ==========================================================================
  const testWithConfirmationKit = async () => {
    try {
      addLog('Testing With Confirmation (React + Kit)...');

      const rpc = createSolanaRpc(devnet('https://api.devnet.solana.com'));

      // Get latest blockhash
      const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

      // Build transaction using Kit's functional pipe pattern
      const message = pipe(
        createTransactionMessage({ version: 0 }),
        m => setTransactionMessageFeePayerSigner(transactionSigner as TransactionSigner<string>, m),
        m => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
        m => appendTransactionMessageInstruction(
          getTransferSolInstruction({
            source: transactionSigner as TransactionSigner<string>,
            destination: address(testRecipient),
            amount: lamports(BigInt(0.001 * 1_000_000_000))
          }),
          m
        )
      );

      const signature = await signAndSendTransaction(message, rpc);

      addLog('Waiting for confirmation...');

      // Poll for signature status (Kit pattern for confirmation)
      let confirmed = false;
      for (let i = 0; i < 30; i++) {
        const { value } = await rpc.getSignatureStatuses([signature as any]).send();
        if (value && value[0] && value[0].confirmationStatus === 'confirmed' || value[0]?.confirmationStatus === 'finalized') {
          confirmed = true;
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (confirmed) {
        addLog(`✅ With Confirmation (Kit) SUCCESS: ${signature} (confirmed)`, 'success');
      } else {
        addLog(`⚠️ With Confirmation (Kit) TIMEOUT: ${signature} (not confirmed within 30s)`, 'error');
      }
    } catch (error: any) {
      const errorMsg = error.message || String(error);
      const causeMsg = error.cause ? ` | Cause: ${error.cause.message || String(error.cause)}` : '';
      addLog(`❌ With Confirmation (Kit) FAILED: ${errorMsg}${causeMsg}`, 'error', error);
    }
  };

  // ==========================================================================
  // 6. PRIORITY FEES - React + web3.js
  // ==========================================================================
  const testPriorityFeesWeb3 = async () => {
    try {
      addLog('Testing Priority Fees (React + web3.js)...');

      const transaction = new Transaction();

      // Add priority fee instruction
      transaction.add(
        ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: 1000,
        })
      );

      // Add actual transaction
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: publicKey!,
          toPubkey: new PublicKey(testRecipient),
          lamports: 0.001 * LAMPORTS_PER_SOL
        })
      );

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey!;

      const signature = await signAndSendTransaction(transaction, connection);
      addLog(`✅ Priority Fees (web3.js) SUCCESS: ${signature}`, 'success');
    } catch (error: any) {
      const errorMsg = error.message || String(error);
      const causeMsg = error.cause ? ` | Cause: ${error.cause.message || String(error.cause)}` : '';
      addLog(`❌ Priority Fees (web3.js) FAILED: ${errorMsg}${causeMsg}`, 'error', error);
    }
  };

  // ==========================================================================
  // 6. PRIORITY FEES - React + Kit (Proper Kit Pattern with pipe)
  // ==========================================================================
  const testPriorityFeesKit = async () => {
    try {
      addLog('Testing Priority Fees (React + Kit)...');

      const rpc = createSolanaRpc(devnet('https://api.devnet.solana.com'));

      // Get latest blockhash
      const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

      // Priority fee instruction
      const priorityFeeInstruction = getSetComputeUnitPriceInstruction({
        microLamports: 1000n
      });

      // Transfer instruction
      const transferInstruction = getTransferSolInstruction({
        source: transactionSigner as TransactionSigner<string>,
        destination: address(testRecipient),
        amount: lamports(BigInt(0.001 * 1_000_000_000))
      });

      // Build transaction with multiple instructions using pipe
      const message = pipe(
        createTransactionMessage({ version: 0 }),
        m => setTransactionMessageFeePayerSigner(transactionSigner as TransactionSigner<string>, m),
        m => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
        m => appendTransactionMessageInstructions([priorityFeeInstruction, transferInstruction], m)
      );

      const signature = await signAndSendTransaction(message, rpc);
      addLog(`✅ Priority Fees (Kit) SUCCESS: ${signature}`, 'success');
    } catch (error: any) {
      const errorMsg = error.message || String(error);
      const causeMsg = error.cause ? ` | Cause: ${error.cause.message || String(error.cause)}` : '';
      addLog(`❌ Priority Fees (Kit) FAILED: ${errorMsg}${causeMsg}`, 'error', error);
    }
  };

  // ==========================================================================
  // 7. SPL TOKEN TRANSFER - React + web3.js
  // ==========================================================================
  const testTokenTransferWeb3 = async () => {
    try {
      addLog('Testing SPL Token Transfer (React + web3.js)...');

      const mintAddress = new PublicKey(testTokenMint);
      const recipientAddress = new PublicKey(testRecipient);

      // Get Associated Token Accounts
      const fromTokenAccount = await getAssociatedTokenAddress(mintAddress, publicKey!);
      const toTokenAccount = await getAssociatedTokenAddress(mintAddress, recipientAddress);

      addLog('Checking token accounts...');

      // Check if ATAs exist
      const fromExists = await checkTokenAccount(fromTokenAccount);
      const toExists = await checkTokenAccount(toTokenAccount);

      if (!fromExists) {
        throw new Error(`You don't have a token account for this token. ATA: ${fromTokenAccount.toBase58()}`);
      }

      // Create transaction
      const transaction = new Transaction();

      // If recipient's ATA doesn't exist, create it first
      if (!toExists) {
        addLog('Recipient ATA does not exist. Creating it...');
        transaction.add(
          createAssociatedTokenAccountInstruction(
            publicKey!,           // payer
            toTokenAccount,       // ata
            recipientAddress,     // owner
            mintAddress          // mint
          )
        );
      } else {
        addLog('Token accounts verified.');
      }

      addLog('Adding transfer instruction...');

      // Add transfer instruction
      transaction.add(
        createTransferInstruction(fromTokenAccount, toTokenAccount, publicKey!, testTokenAmount)
      );

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey!;

      const signature = await signAndSendTransaction(transaction, connection);
      addLog(`✅ SPL Token Transfer (web3.js) SUCCESS: ${signature}`, 'success');
    } catch (error: any) {
      const errorMsg = error.message || String(error);
      const causeMsg = error.cause ? ` | Cause: ${error.cause.message || String(error.cause)}` : '';
      addLog(`❌ SPL Token Transfer (web3.js) FAILED: ${errorMsg}${causeMsg}`, 'error', error);
    }
  };

  // ==========================================================================
  // 7. SPL TOKEN TRANSFER - React + Kit (Proper Kit Pattern with pipe)
  // ==========================================================================
  const testTokenTransferKit = async () => {
    try {
      addLog('Testing SPL Token Transfer (React + Kit)...');

      const rpc = createSolanaRpc(devnet('https://api.devnet.solana.com'));

      const mintAddress = new PublicKey(testTokenMint);
      const recipientAddress = new PublicKey(testRecipient);

      // Get Associated Token Accounts (using web3.js helpers, then convert to Kit addresses)
      const fromTokenAccount = await getAssociatedTokenAddress(mintAddress, publicKey!);
      const toTokenAccount = await getAssociatedTokenAddress(mintAddress, recipientAddress);

      addLog('Checking token accounts...');

      // Check if ATAs exist
      const fromExists = await checkTokenAccount(fromTokenAccount);
      const toExists = await checkTokenAccount(toTokenAccount);

      if (!fromExists) {
        throw new Error(`You don't have a token account for this token. ATA: ${fromTokenAccount.toBase58()}`);
      }

      // Build instructions array
      const instructions: any[] = [];

      // If recipient's ATA doesn't exist, create it first
      if (!toExists) {
        addLog('Recipient ATA does not exist. Creating it...');
        instructions.push(
          getCreateAssociatedTokenIdempotentInstruction({
            payer: transactionSigner as TransactionSigner<string>,
            ata: address(toTokenAccount.toBase58()),
            owner: address(recipientAddress.toBase58()),
            mint: address(mintAddress.toBase58())
          })
        );
      } else {
        addLog('Token accounts verified.');
      }

      addLog('Adding transfer instruction...');

      // Add transfer instruction
      instructions.push(
        getTransferInstruction({
          source: address(fromTokenAccount.toBase58()),
          destination: address(toTokenAccount.toBase58()),
          authority: transactionSigner as TransactionSigner<string>,
          amount: BigInt(testTokenAmount)
        })
      );

      // Get latest blockhash
      const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

      // Build transaction using Kit's functional pipe pattern
      const message = pipe(
        createTransactionMessage({ version: 0 }),
        m => setTransactionMessageFeePayerSigner(transactionSigner as TransactionSigner<string>, m),
        m => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
        m => appendTransactionMessageInstructions(instructions, m)
      );

      const signature = await signAndSendTransaction(message, rpc);
      addLog(`✅ SPL Token Transfer (Kit) SUCCESS: ${signature}`, 'success');
    } catch (error: any) {
      const errorMsg = error.message || String(error);
      const causeMsg = error.cause ? ` | Cause: ${error.cause.message || String(error.cause)}` : '';
      addLog(`❌ SPL Token Transfer (Kit) FAILED: ${errorMsg}${causeMsg}`, 'error', error);
    }
  };

  // ==========================================================================
  // 7. TEST createKitTransaction HELPER
  // ==========================================================================
  const testCreateKitTransactionHelper = async () => {
    try {
      addLog('Testing createKitTransaction helper...');

      const rpc = createSolanaRpc(devnet('https://api.devnet.solana.com'));

      // Create SOL transfer instruction
      const transferInstruction = getTransferSolInstruction({
        source: transactionSigner as TransactionSigner<string>,
        destination: address(testRecipient),
        amount: lamports(BigInt(0.001 * 1_000_000_000))
      });

      // Use the helper to create transaction
      const transactionMessage = await createKitTransaction(
        rpc,
        address(addressString!),
        [transferInstruction]
      );

      addLog('Transaction created successfully with createKitTransaction helper', 'success');

      // Sign and send the transaction
      const signature = await signAndSendTransaction(transactionMessage, rpc);
      addLog(`createKitTransaction Helper SUCCESS: ${signature}`, 'success');
    } catch (error: any) {
      const errorMsg = error.message || String(error);
      const causeMsg = error.cause ? ` | Cause: ${error.cause.message || String(error.cause)}` : '';
      addLog(`❌ createKitTransaction Helper FAILED: ${errorMsg}${causeMsg}`, 'error', error);
    }
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================
  if (!connected) {
    return (
      <div style={{ padding: '20px', fontFamily: 'monospace' }}>
        <h1>📋 Documentation Validation</h1>
        <p style={{ color: 'orange' }}>⚠️ Please connect your wallet first to test examples</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', maxWidth: '1200px' }}>
      <h1>📋 Documentation Code Validation</h1>
      <p>Testing all React examples from docs/core-concepts/transactions.mdx</p>

      <div style={{ background: '#1a1a1a', padding: '10px', marginBottom: '20px', borderRadius: '4px' }}>
        <strong>Connected:</strong> {addressString || publicKey?.toBase58().slice(0, 8)}...
      </div>

      {/* SECTION 1: Basic Transfer */}
      <section style={{ marginBottom: '30px', borderLeft: '3px solid #9945FF', paddingLeft: '15px' }}>
        <h2>1️⃣ Basic Transfer</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={testBasicTransferWeb3} style={buttonStyle}>
            Test React + web3.js
          </button>
          <button onClick={testBasicTransferKit} style={buttonStyle}>
            Test React + Kit
          </button>
        </div>
      </section>

      {/* SECTION 2: Sign Only */}
      <section style={{ marginBottom: '30px', borderLeft: '3px solid #14F195', paddingLeft: '15px' }}>
        <h2>2️⃣ Sign Only</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={testSignOnlyWeb3} style={buttonStyle}>
            Test React + web3.js
          </button>
          <button onClick={testSignOnlyKit} style={buttonStyle}>
            Test React + Kit
          </button>
        </div>
      </section>

      {/* SECTION 3: Sign Multiple */}
      <section style={{ marginBottom: '30px', borderLeft: '3px solid #9945FF', paddingLeft: '15px' }}>
        <h2>3️⃣ Sign Multiple</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={testSignMultipleWeb3} style={buttonStyle}>
            Test React + web3.js
          </button>
          <button onClick={testSignMultipleKit} style={buttonStyle}>
            Test React + Kit
          </button>
        </div>
      </section>

      {/* SECTION 4: With Confirmation */}
      <section style={{ marginBottom: '30px', borderLeft: '3px solid #14F195', paddingLeft: '15px' }}>
        <h2>4️⃣ With Confirmation</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={testWithConfirmationWeb3} style={buttonStyle}>
            Test React + web3.js
          </button>
          <button onClick={testWithConfirmationKit} style={buttonStyle}>
            Test React + Kit
          </button>
        </div>
      </section>

      {/* SECTION 5: Priority Fees */}
      <section style={{ marginBottom: '30px', borderLeft: '3px solid #9945FF', paddingLeft: '15px' }}>
        <h2>5️⃣ Priority Fees</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={testPriorityFeesWeb3} style={buttonStyle}>
            Test React + web3.js
          </button>
          <button onClick={testPriorityFeesKit} style={buttonStyle}>
            Test React + Kit
          </button>
        </div>
      </section>

      {/* SECTION 6: SPL Token Transfer */}
      <section style={{ marginBottom: '30px', borderLeft: '3px solid #14F195', paddingLeft: '15px' }}>
        <h2>6️⃣ SPL Token Transfer</h2>
        <p style={{ fontSize: '14px', color: '#888', margin: '5px 0' }}>
          Token: Devnet USDC (Gh9ZwE...) | Amount: 1 USDC (1,000,000 with 6 decimals)
        </p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={testTokenTransferWeb3} style={buttonStyle}>
            Test React + web3.js
          </button>
          <button onClick={testTokenTransferKit} style={buttonStyle}>
            Test React + Kit
          </button>
        </div>
      </section>

      {/* SECTION 7: Test createKitTransaction Helper */}
      <section style={{ marginBottom: '30px', borderLeft: '3px solid #9945FF', paddingLeft: '15px' }}>
        <h2>7️⃣ createKitTransaction Helper</h2>
        <p style={{ fontSize: '14px', color: '#888', margin: '5px 0' }}>
          Test the createKitTransaction helper utility with a real SOL transfer
        </p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={testCreateKitTransactionHelper} style={buttonStyle}>
            Test Helper
          </button>
        </div>
      </section>

      {/* Logs Section */}
      <section style={{ marginTop: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>📝 Test Logs</h2>
          <button onClick={() => setLogs([])} style={{ ...buttonStyle, background: '#ff4444' }}>
            Clear Logs
          </button>
        </div>
        <div style={{
          background: '#000',
          color: '#0f0',
          padding: '15px',
          borderRadius: '4px',
          maxHeight: '400px',
          overflow: 'auto',
          fontFamily: 'Courier New, monospace',
          fontSize: '12px'
        }}>
          {logs.length === 0 ? (
            <p style={{ color: '#666' }}>No logs yet. Click buttons above to test examples.</p>
          ) : (
            logs.map((log, i) => (
              <div key={i} style={{
                marginBottom: '5px',
                color: log.includes('SUCCESS') ? '#0f0' : log.includes('FAILED') ? '#f00' : '#fff'
              }}>
                {log}
              </div>
            ))
          )}
        </div>
      </section>

      {/* Instructions */}
      <section style={{ marginTop: '30px', background: '#2a2a2a', padding: '15px', borderRadius: '4px' }}>
        <h3>ℹ️ Instructions</h3>
        <ol>
          <li>Make sure you're on Devnet</li>
          <li>Have some test SOL (use faucet if needed)</li>
          <li>Click each test button</li>
          <li>Check console and logs below for results</li>
          <li>Mark off in <code>docs/VALIDATION_CHECKLIST.md</code></li>
        </ol>
        <p style={{ color: '#888', fontSize: '12px', marginTop: '10px' }}>
          Note: Some tests use the burn address (11111...) so tokens are safely discarded
        </p>
      </section>
    </div>
  );
}

const buttonStyle: React.CSSProperties = {
  padding: '10px 20px',
  background: '#9945FF',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: '14px',
  transition: 'all 0.2s',
};
