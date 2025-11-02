/**
 * Documentation Code Validation - Vanilla TypeScript
 *
 * This file contains all Vanilla TS examples from the documentation
 * for manual testing purposes.
 *
 * To use:
 * 1. Import this file in your main app
 * 2. Expose functions to window for console testing OR
 * 3. Add buttons that call these functions
 * 4. Check console for results
 * 5. Mark off in VALIDATION_CHECKLIST.md
 */

import { Transaction, SystemProgram, LAMPORTS_PER_SOL, PublicKey, Connection, ComputeBudgetProgram } from '@solana/web3.js';
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createTransferInstruction } from '@solana/spl-token';
import { type WalletConnectionManager } from '@hermis/solana-headless-adapter-base';
import {
  address,
  lamports,
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstruction,
  appendTransactionMessageInstructions,
  TransactionMessage,
  setTransactionMessageFeePayerSigner,
} from '@solana/kit';
import { createSolanaRpc, devnet } from '@solana/kit';
import { getTransferSolInstruction } from '@solana-program/system';
import { getSetComputeUnitPriceInstruction } from '@solana-program/compute-budget';
import { getTransferInstruction, getCreateAssociatedTokenIdempotentInstruction, findAssociatedTokenPda, TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';

const TEST_RECIPIENT = '9ksQrNQ5GEB4AKpuDrRxF8KASAtJ7zXXm81XSqsqNyhR'; // Burn address for testing
const TEST_TOKEN_MINT = 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr'; // Devnet USDC
const TEST_TOKEN_AMOUNT = 1000000; // 1 USDC (6 decimals)

// ==========================================================================
// SECTION 1: BASIC TRANSFER - Vanilla TS + web3.js
// ==========================================================================
export async function testBasicTransferWeb3(manager: WalletConnectionManager, connection: Connection) {
  console.log('🧪 Testing Basic Transfer (Vanilla TS + web3.js)...');

  try {
    const publicKey = manager.getAdapter()?.publicKey;
    if (!publicKey) throw new Error('No wallet connected');

    const transaction = new Transaction();

    transaction.add(
      SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: new PublicKey(TEST_RECIPIENT),
        lamports: 0.001 * LAMPORTS_PER_SOL
      })
    );

    // Set recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = publicKey;

    // Sign and send using manager
    const signature = await manager.signAndSendTransaction(connection, transaction);
    // const signature = await manager.sendTransaction(connection, transaction);

    console.log('✅ Basic Transfer (Vanilla TS + web3.js) SUCCESS:', signature);
    return signature;
  } catch (error: any) {
    console.error('❌ Basic Transfer (Vanilla TS + web3.js) FAILED:', error.message);
    throw error;
  }
}

// ==========================================================================
// SECTION 1: BASIC TRANSFER - Vanilla TS + Kit (Proper Kit Pattern with pipe)
// ==========================================================================
export async function testBasicTransferKit(manager: WalletConnectionManager) {
  console.log('🧪 Testing Basic Transfer (Vanilla TS + Kit)...');

  try {
    const publicKey = manager.getAdapter()?.publicKey;
    if (!publicKey) throw new Error('No wallet connected');

    // Create Kit RPC
    const rpc = createSolanaRpc(devnet('https://api.devnet.solana.com'));

    // Get latest blockhash
    const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

    // Build transaction using Kit's functional pipe pattern
    const message = pipe(
      createTransactionMessage({ version: 0 }),
      (m: TransactionMessage) => setTransactionMessageFeePayer(address(publicKey.toBase58()), m),
      (m: TransactionMessage) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
      (m: TransactionMessage) => appendTransactionMessageInstruction(
        getTransferSolInstruction({
          source: address(publicKey.toBase58()),
          destination: address(TEST_RECIPIENT),
          amount: lamports(BigInt(0.001 * 1_000_000_000))
        }),
        m
      )
    );

    // Sign and send using manager
    const signature = await manager.signAndSendTransaction(rpc, message);

    console.log('✅ Basic Transfer (Vanilla TS + Kit) SUCCESS:', signature);
    return signature;
  } catch (error: any) {
    console.error('❌ Basic Transfer (Vanilla TS + Kit) FAILED:', error.message);
    throw error;
  }
}

// ==========================================================================
// SECTION 2: SIGN ONLY - Vanilla TS + web3.js
// ==========================================================================
export async function testSignOnlyWeb3(manager: WalletConnectionManager, connection: Connection) {
  console.log('🧪 Testing Sign Only (Vanilla TS + web3.js)...');

  try {
    const publicKey = manager.getAdapter()?.publicKey;
    if (!publicKey) throw new Error('No wallet connected');

    const transaction = new Transaction();

    transaction.add(
      SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: new PublicKey(TEST_RECIPIENT),
        lamports: 0.001 * LAMPORTS_PER_SOL
      })
    );

    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = publicKey;

    // Sign without sending
    const signedTx = await manager.signTransaction(transaction);

    console.log('✅ Sign Only (Vanilla TS + web3.js) SUCCESS: Transaction signed');
    console.log('   Signatures:', signedTx?.signatures.length);
    return signedTx;
  } catch (error: any) {
    console.error('❌ Sign Only (Vanilla TS + web3.js) FAILED:', error.message);
    throw error;
  }
}

// ==========================================================================
// SECTION 2: SIGN ONLY - Vanilla TS + Kit (Proper Kit Pattern with pipe)
// ==========================================================================
export async function testSignOnlyKit(manager: WalletConnectionManager) {
  console.log('🧪 Testing Sign Only (Vanilla TS + Kit)...');

  try {
    const publicKey = manager.getAdapter()?.publicKey;
    if (!publicKey) throw new Error('No wallet connected');

    const rpc = createSolanaRpc(devnet('https://api.devnet.solana.com'));

    // Get latest blockhash
    const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

    // Build transaction using Kit's functional pipe pattern
    const message = pipe(
      createTransactionMessage({ version: 0 }),
      (m: any) => setTransactionMessageFeePayer(address(publicKey.toBase58()), m),
      (m: any) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
      (m: any) => appendTransactionMessageInstruction(
        getTransferSolInstruction({
          source: address(publicKey.toBase58()),
          destination: address(TEST_RECIPIENT),
          amount: lamports(BigInt(0.001 * 1_000_000_000))
        }),
        m
      )
    );

    // Sign without sending using manager
    const signedMessage = await manager.signTransaction(message);

    console.log('✅ Sign Only (Vanilla TS + Kit) SUCCESS: Message signed');
    return signedMessage;
  } catch (error: any) {
    console.error('❌ Sign Only (Vanilla TS + Kit) FAILED:', error.message);
    throw error;
  }
}

// ==========================================================================
// SECTION 3: SIGN MULTIPLE - Vanilla TS + web3.js
// ==========================================================================
export async function testSignMultipleWeb3(manager: WalletConnectionManager, connection: Connection) {
  console.log('🧪 Testing Sign Multiple (Vanilla TS + web3.js)...');

  try {
    const publicKey = manager.getAdapter()?.publicKey;
    if (!publicKey) throw new Error('No wallet connected');

    const transactions = [];

    // Create 3 identical transactions for testing
    for (let i = 0; i < 3; i++) {
      const transaction = new Transaction();
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(TEST_RECIPIENT),
          lamports: 0.001 * LAMPORTS_PER_SOL
        })
      );

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      transactions.push(transaction);
    }

    const signedTxs = await manager.signAllTransactions(transactions);

    console.log('✅ Sign Multiple (Vanilla TS + web3.js) SUCCESS:', signedTxs?.length, 'transactions signed');
    return signedTxs;
  } catch (error: any) {
    console.error('❌ Sign Multiple (Vanilla TS + web3.js) FAILED:', error.message);
    throw error;
  }
}

// ==========================================================================
// SECTION 3: SIGN MULTIPLE - Vanilla TS + Kit
// ==========================================================================
export async function testSignMultipleKit(manager: WalletConnectionManager) {
  console.log('🧪 Testing Sign Multiple (Vanilla TS + Kit)...');

  try {
    const publicKey = manager.getAdapter()?.publicKey;
    if (!publicKey) throw new Error('No wallet connected');

    const rpc = createSolanaRpc(devnet('https://api.devnet.solana.com'));
    const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

    // Create 3 identical transactions for testing
    const messages = [];
    for (let i = 0; i < 3; i++) {
      const message = pipe(
        createTransactionMessage({ version: 0 }),
        (m: TransactionMessage) => setTransactionMessageFeePayer(address(publicKey.toBase58()), m),
        (m: TransactionMessage) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
        (m: TransactionMessage) => appendTransactionMessageInstruction(
          getTransferSolInstruction({
            source: address(publicKey.toBase58()),
            destination: address(TEST_RECIPIENT),
            amount: lamports(BigInt(0.001 * 1_000_000_000))
          }),
          m
        )
      );
      messages.push(message);
    }

    const signedMessages = await manager.signAllTransactions(messages);

    console.log('✅ Sign Multiple (Vanilla TS + Kit) SUCCESS:', signedMessages?.length, 'transactions signed');
    return signedMessages;
  } catch (error: any) {
    console.error('❌ Sign Multiple (Vanilla TS + Kit) FAILED:', error.message);
    throw error;
  }
}

// ==========================================================================
// SECTION 3.5: SPL TOKEN TRANSFER - Vanilla TS + web3.js
// ==========================================================================
export async function testTokenTransferWeb3(manager: WalletConnectionManager, connection: Connection) {
  console.log('🧪 Testing SPL Token Transfer (Vanilla TS + web3.js)...');

  try {
    const publicKey = manager.getAdapter()?.publicKey;
    if (!publicKey) throw new Error('No wallet connected');

    const mintPubkey = new PublicKey(TEST_TOKEN_MINT);
    const recipientPubkey = new PublicKey(TEST_RECIPIENT);

    // Get or create associated token accounts
    const sourceAta = await getAssociatedTokenAddress(mintPubkey, publicKey);
    const destinationAta = await getAssociatedTokenAddress(mintPubkey, recipientPubkey);

    const transaction = new Transaction();

    // Check if destination ATA exists, if not create it
    const destAccountInfo = await connection.getAccountInfo(destinationAta);
    if (!destAccountInfo) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          publicKey, // payer
          destinationAta,
          recipientPubkey,
          mintPubkey
        )
      );
    }

    // Add transfer instruction
    transaction.add(
      createTransferInstruction(
        sourceAta,
        destinationAta,
        publicKey,
        TEST_TOKEN_AMOUNT
      )
    );

    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = publicKey;

    const signature = await manager.signAndSendTransaction(connection, transaction);

    console.log('✅ SPL Token Transfer (Vanilla TS + web3.js) SUCCESS:', signature);
    return signature;
  } catch (error: any) {
    console.error('❌ SPL Token Transfer (Vanilla TS + web3.js) FAILED:', error.message);
    throw error;
  }
}

// ==========================================================================
// SECTION 3.5: SPL TOKEN TRANSFER - Vanilla TS + Kit
// ==========================================================================
export async function testTokenTransferKit(manager: WalletConnectionManager) {
  console.log('🧪 Testing SPL Token Transfer (Vanilla TS + Kit)...');

  try {
    const publicKey = manager.getAdapter()?.publicKey;
    if (!publicKey) throw new Error('No wallet connected');

    const rpc = createSolanaRpc(devnet('https://api.devnet.solana.com'));
    const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

    const mintAddress = address(TEST_TOKEN_MINT);
    const ownerAddress = address(publicKey.toBase58());
    const recipientAddress = address(TEST_RECIPIENT);

    // Find associated token addresses
    const [sourceAta] = await findAssociatedTokenPda({
      mint: mintAddress,
      owner: ownerAddress,
      tokenProgram: TOKEN_PROGRAM_ADDRESS
    });
    const [destinationAta] = await findAssociatedTokenPda({
      mint: mintAddress,
      owner: recipientAddress,
      tokenProgram: TOKEN_PROGRAM_ADDRESS
    });

    // Build transaction with create ATA (idempotent) and transfer
    const message = pipe(
      createTransactionMessage({ version: 0 }),
      (m: TransactionMessage) => setTransactionMessageFeePayer(ownerAddress, m),
      (m: TransactionMessage) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
      (m: TransactionMessage) => appendTransactionMessageInstructions([
        // Create destination ATA if it doesn't exist (idempotent instruction)
        getCreateAssociatedTokenIdempotentInstruction({
          mint: mintAddress,
          owner: recipientAddress,
          ata: destinationAta,
          payer: ownerAddress
        }),
        // Transfer tokens
        getTransferInstruction({
          source: sourceAta,
          destination: destinationAta,
          authority: ownerAddress,
          amount: BigInt(TEST_TOKEN_AMOUNT)
        })
      ], m)
    );

    const signature = await manager.signAndSendTransaction(rpc, message);

    console.log('✅ SPL Token Transfer (Vanilla TS + Kit) SUCCESS:', signature);
    return signature;
  } catch (error: any) {
    console.error('❌ SPL Token Transfer (Vanilla TS + Kit) FAILED:', error.message);
    throw error;
  }
}

// ==========================================================================
// SECTION 4: WITH CONFIRMATION - Vanilla TS + web3.js
// ==========================================================================
export async function testWithConfirmationWeb3(manager: WalletConnectionManager, connection: Connection) {
  console.log('🧪 Testing With Confirmation (Vanilla TS + web3.js)...');

  try {
    const publicKey = manager.getAdapter()?.publicKey;
    if (!publicKey) throw new Error('No wallet connected');

    const transaction = new Transaction();
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: new PublicKey(TEST_RECIPIENT),
        lamports: 0.001 * LAMPORTS_PER_SOL
      })
    );

    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = publicKey;

    const signature = await manager.sendTransaction(connection, transaction);
    if (!signature) throw new Error('Failed to send transaction');

    console.log('⏳ Waiting for confirmation...');
    await connection.confirmTransaction(signature, 'confirmed');

    console.log('✅ With Confirmation (Vanilla TS + web3.js) SUCCESS:', signature, '(confirmed)');
    return signature;
  } catch (error: any) {
    console.error('❌ With Confirmation (Vanilla TS + web3.js) FAILED:', error.message);
    throw error;
  }
}

// ==========================================================================
// SECTION 4: WITH CONFIRMATION - Vanilla TS + Kit
// ==========================================================================
export async function testWithConfirmationKit(manager: WalletConnectionManager) {
  console.log('🧪 Testing With Confirmation (Vanilla TS + Kit)...');

  try {
    const publicKey = manager.getAdapter()?.publicKey;
    if (!publicKey) throw new Error('No wallet connected');

    const rpc = createSolanaRpc(devnet('https://api.devnet.solana.com'));

    // const instruction = getTransferSolInstruction({
    //   source: address(publicKey.toBase58()),
    //   destination: address(TEST_RECIPIENT),
    //   amount: lamports(BigInt(0.001 * 1_000_000_000))
    // });

    // const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
    // const message = {
    //   version: 0,
    //   feePayer: address(publicKey.toBase58()),
    //   instructions: [instruction],
    //   ...latestBlockhash
    // };

     // Get latest blockhash
     const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

     // Build transaction using Kit's functional pipe pattern
     const message = pipe(
       createTransactionMessage({ version: 0 }),
       m => setTransactionMessageFeePayer(address(publicKey.toBase58()), m),
       m => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
       m => appendTransactionMessageInstruction(
         getTransferSolInstruction({
           source: address(publicKey.toBase58()!),
           destination: address(TEST_RECIPIENT),
           amount: lamports(BigInt(0.001 * 1_000_000_000))
         }),
         m
       )
     );

    const signature = await manager.signAndSendTransaction(rpc, message);
    if (!signature) throw new Error('Failed to send transaction');

    console.log('⏳ Waiting for confirmation...');
    const { value } = await rpc.getSignatureStatuses([signature as any]).send();

    console.log('✅ With Confirmation (Vanilla TS + Kit) SUCCESS:', signature);
    console.log('   Status:', value);
    return signature;
  } catch (error: any) {
    console.error('❌ With Confirmation (Vanilla TS + Kit) FAILED:', error.message);
    throw error;
  }
}

// ==========================================================================
// SECTION 5: PRIORITY FEES - Vanilla TS + web3.js
// ==========================================================================
export async function testPriorityFeesWeb3(manager: WalletConnectionManager, connection: Connection) {
  console.log('🧪 Testing Priority Fees (Vanilla TS + web3.js)...');

  try {
    const publicKey = manager.getAdapter()?.publicKey;
    if (!publicKey) throw new Error('No wallet connected');

    const transaction = new Transaction();

    // Add priority fee to transaction
    transaction.add(
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 1000, // Priority fee
      })
    );

    // Add actual transaction
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: new PublicKey(TEST_RECIPIENT),
        lamports: 0.001 * LAMPORTS_PER_SOL
      })
    );

    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = publicKey;

    const signature = await manager.sendTransaction(connection, transaction);

    console.log('✅ Priority Fees (Vanilla TS + web3.js) SUCCESS:', signature);
    return signature;
  } catch (error: any) {
    console.error('❌ Priority Fees (Vanilla TS + web3.js) FAILED:', error.message);
    throw error;
  }
}

// ==========================================================================
// SECTION 5: PRIORITY FEES - Vanilla TS + Kit (Proper Kit Pattern with pipe)
// ==========================================================================
export async function testPriorityFeesKit(manager: WalletConnectionManager) {
  console.log('🧪 Testing Priority Fees (Vanilla TS + Kit)...');

  try {
    const publicKey = manager.getAdapter()?.publicKey;
    if (!publicKey) throw new Error('No wallet connected');

    const rpc = createSolanaRpc(devnet('https://api.devnet.solana.com'));

    // Get latest blockhash
    const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

    // Priority fee instruction
    const priorityFeeInstruction = getSetComputeUnitPriceInstruction({
      microLamports: 1000n
    });

    // Transfer instruction
    const transferInstruction = getTransferSolInstruction({
      source: address(publicKey.toBase58()),
      destination: address(TEST_RECIPIENT),
      amount: lamports(BigInt(0.001 * 1_000_000_000))
    });

    // Build transaction with multiple instructions using pipe
    const message = pipe(
      createTransactionMessage({ version: 0 }),
      (m: any) => setTransactionMessageFeePayer(address(publicKey.toBase58()), m),
      (m: any) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
      (m: any) => appendTransactionMessageInstructions([priorityFeeInstruction, transferInstruction], m)
    );

    const signature = await manager.signAndSendTransaction(rpc, message);

    console.log('✅ Priority Fees (Vanilla TS + Kit) SUCCESS:', signature);
    return signature;
  } catch (error: any) {
    console.error('❌ Priority Fees (Vanilla TS + Kit) FAILED:', error.message);
    throw error;
  }
}

// ==========================================================================
// HELPER: Run all tests
// ==========================================================================
export async function runAllTests(manager: WalletConnectionManager, connection: Connection) {
  console.log('🚀 Running all Vanilla TS documentation tests...\n');

  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };

  const tests = [
    { name: 'Basic Transfer (web3.js)', fn: () => testBasicTransferWeb3(manager, connection) },
    { name: 'Basic Transfer (Kit)', fn: () => testBasicTransferKit(manager) },
    { name: 'Sign Only (web3.js)', fn: () => testSignOnlyWeb3(manager, connection) },
    { name: 'Sign Only (Kit)', fn: () => testSignOnlyKit(manager) },
    { name: 'Sign Multiple (web3.js)', fn: () => testSignMultipleWeb3(manager, connection) },
    { name: 'Sign Multiple (Kit)', fn: () => testSignMultipleKit(manager) },
    { name: 'SPL Token Transfer (web3.js)', fn: () => testTokenTransferWeb3(manager, connection) },
    { name: 'SPL Token Transfer (Kit)', fn: () => testTokenTransferKit(manager) },
    { name: 'With Confirmation (web3.js)', fn: () => testWithConfirmationWeb3(manager, connection) },
    { name: 'With Confirmation (Kit)', fn: () => testWithConfirmationKit(manager) },
    { name: 'Priority Fees (web3.js)', fn: () => testPriorityFeesWeb3(manager, connection) },
    { name: 'Priority Fees (Kit)', fn: () => testPriorityFeesKit(manager) },
  ];

  for (const test of tests) {
    results.total++;
    try {
      await test.fn();
      results.passed++;
      console.log(`\n`);
    } catch (error) {
      results.failed++;
      console.log(`\n`);
    }
  }

  console.log('\n========================================');
  console.log('📊 TEST RESULTS');
  console.log('========================================');
  console.log(`Total: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log('========================================\n');

  return results;
}

// ==========================================================================
// EXPOSE TO WINDOW FOR CONSOLE TESTING (OPTIONAL)
// ==========================================================================
if (typeof window !== 'undefined') {
  // Only expose once, even across HMR reloads
  if (!(window as any).docsValidation) {
    (window as any).docsValidation = {
      testBasicTransferWeb3,
      testBasicTransferKit,
      testSignOnlyWeb3,
      testSignOnlyKit,
      testSignMultipleWeb3,
      testSignMultipleKit,
      testTokenTransferWeb3,
      testTokenTransferKit,
      testWithConfirmationWeb3,
      testWithConfirmationKit,
      testPriorityFeesWeb3,
      testPriorityFeesKit,
      runAllTests
    };

    console.log('📦 Docs validation functions exposed to window.docsValidation');
    console.log('Example usage: window.docsValidation.runAllTests(manager, connection)');
  }
}
