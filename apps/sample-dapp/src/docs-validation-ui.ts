/**
 * Documentation Code Validation UI - Vanilla TypeScript
 *
 * This file creates a UI for testing all vanilla TS documentation examples
 */

import { Connection } from '@solana/web3.js';
import {
  createWalletConnectionManager,
  type WalletConnectionManager,
  sortWalletAdapters,
  getAdaptersByReadyState
} from '@hermis/solana-headless-adapter-base';
import { Adapter, WalletReadyState } from '@hermis/solana-headless-core';
import {
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
} from './docs-validation.js';

// Global state
let manager: WalletConnectionManager | null = null;
let connection: Connection | null = null;
let isConnected = false;
let globalAdapters: any[] = [];
let clickedWalletName = '';

// DOM Elements
let connectionStatus: HTMLElement;
let walletAddress: HTMLElement;
let connectBtn: HTMLButtonElement;
let disconnectBtn: HTMLButtonElement;
let logPanel: HTMLElement;
let clearLogBtn: HTMLButtonElement;
let walletListEl: HTMLElement;

// Store initialization state on window to persist across HMR reloads
declare global {
  interface Window {
    __appInitialized?: boolean;
  }
}

// Initialize on page load (use 'once' to prevent HMR duplicates)
window.addEventListener('DOMContentLoaded', initializeApp, { once: true });

async function initializeApp() {
  // Prevent duplicate initialization from HMR (store on window to persist across reloads)
  if (window.__appInitialized) {
    console.log('⚠️ App already initialized, skipping duplicate initialization');
    return;
  }

  console.log('Initializing Documentation Validation UI...');
  window.__appInitialized = true;

  // Get DOM elements
  connectionStatus = document.getElementById('connection-status')!;
  walletAddress = document.getElementById('wallet-address')!;
  connectBtn = document.getElementById('connect-btn') as HTMLButtonElement;
  disconnectBtn = document.getElementById('disconnect-btn') as HTMLButtonElement;
  logPanel = document.getElementById('log-panel')!;
  clearLogBtn = document.getElementById('clear-log-btn') as HTMLButtonElement;
  walletListEl = document.getElementById('wallet-list')!;

  // Initialize connection
  connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  addLog('✅ Connected to Solana Devnet', 'success');

  // Initialize wallet adapters
  await initializeWalletManager();

  // Set up event listeners
  setupEventListeners();

  addLog('📦 Documentation validation UI ready!', 'info');
  addLog('👉 Connect your wallet to start testing', 'info');
}

async function initializeWalletManager() {
  try {
    // Single call - everything built-in with adapter management
    manager = createWalletConnectionManager([], 'selectedWallet', 'https://api.devnet.solana.com');

    // Subscribe to adapter changes (handles both initial load and dynamic updates)
    manager.onAdaptersChange((adapters) => {
      if (adapters.length === 0) {
        addLog('⚠️ No wallet adapters found. Please install Phantom or Solflare.', 'warning');
        walletListEl.innerHTML = '<p class="empty-message">No wallet adapters available. Please install a Solana wallet extension.</p>';
        return;
      }

      // Update global adapters and re-render
      globalAdapters = sortWalletAdapters(adapters);
      renderWalletList();

      addLog(` ${adapters.length} wallet adapter(s) detected`, 'info');
    });

    // Initially disable connect button until wallet is selected
    connectBtn.disabled = true;

  } catch (error: any) {
    addLog(`❌ Error initializing wallet manager: ${error.message}`, 'error');
    console.error('Wallet initialization error:', error);
  }
}

function setupEventListeners() {
  // Connection buttons
  connectBtn.addEventListener('click', connectWallet);
  disconnectBtn.addEventListener('click', disconnectWallet);
  clearLogBtn.addEventListener('click', clearLog);

  // Test buttons - Basic Transfer
  document.getElementById('test-basic-web3')!.addEventListener('click', () => runTest('Basic Transfer (web3.js)', testBasicTransferWeb3));
  document.getElementById('test-basic-kit')!.addEventListener('click', () => runTest('Basic Transfer (Kit)', testBasicTransferKit, true));

  // Test buttons - Sign Only
  document.getElementById('test-sign-web3')!.addEventListener('click', () => runTest('Sign Only (web3.js)', testSignOnlyWeb3));
  document.getElementById('test-sign-kit')!.addEventListener('click', () => runTest('Sign Only (Kit)', testSignOnlyKit, true));

  // Test buttons - Sign Multiple
  document.getElementById('test-sign-multiple-web3')!.addEventListener('click', () => runTest('Sign Multiple (web3.js)', testSignMultipleWeb3));
  document.getElementById('test-sign-multiple-kit')!.addEventListener('click', () => runTest('Sign Multiple (Kit)', testSignMultipleKit, true));

  // Test buttons - SPL Token Transfer
  document.getElementById('test-token-transfer-web3')!.addEventListener('click', () => runTest('SPL Token Transfer (web3.js)', testTokenTransferWeb3));
  document.getElementById('test-token-transfer-kit')!.addEventListener('click', () => runTest('SPL Token Transfer (Kit)', testTokenTransferKit, true));

  // Test buttons - With Confirmation
  document.getElementById('test-confirmation-web3')!.addEventListener('click', () => runTest('With Confirmation (web3.js)', testWithConfirmationWeb3));
  document.getElementById('test-confirmation-kit')!.addEventListener('click', () => runTest('With Confirmation (Kit)', testWithConfirmationKit, true));

  // Test buttons - Priority Fees
  document.getElementById('test-priority-web3')!.addEventListener('click', () => runTest('Priority Fees (web3.js)', testPriorityFeesWeb3));
  document.getElementById('test-priority-kit')!.addEventListener('click', () => runTest('Priority Fees (Kit)', testPriorityFeesKit, true));

  // Run All Tests button
  document.getElementById('run-all-tests')!.addEventListener('click', runAllTestsHandler);
}

async function connectWallet() {
  if (!manager) {
    addLog('❌ Wallet manager not initialized', 'error');
    return;
  }

  try {
    connectBtn.disabled = true;
    connectBtn.textContent = 'Connecting...';
    addLog(' Connecting wallet...', 'info');

    // Select the wallet that user clicked
    if (clickedWalletName) {
      manager.selectWallet(clickedWalletName as any);
    }

    const adapter = manager.getAdapter();

    if (!adapter) {
      addLog('❌ No wallet selected', 'error');
      connectBtn.disabled = false;
      connectBtn.textContent = 'Connect Wallet';
      return;
    }

    addLog(`Attempting to connect using adapter: ${adapter.name}`, 'info');

    const connectedAdapter = await manager.connect();

    if (connectedAdapter && connectedAdapter.publicKey) {
      handleWalletConnect(connectedAdapter.publicKey);
    }

  } catch (error: any) {
    addLog(`❌ Connection error: ${error.message || String(error)}`, 'error');
    console.error('Connection error:', error);
    connectBtn.disabled = false;
    connectBtn.textContent = 'Connect Wallet';
  }
}

async function disconnectWallet() {
  if (!manager) return;

  try {
    await manager.disconnect();
    handleWalletDisconnect();
  } catch (error: any) {
    addLog(`❌ Disconnection error: ${error.message}`, 'error');
    console.error('Disconnection error:', error);
  }
}

function handleWalletConnect(publicKey: any) {
  isConnected = true;
  const address = publicKey.toBase58();

  connectionStatus.textContent = '✅ Connected';
  connectionStatus.className = 'status-badge success';
  walletAddress.textContent = `Address: ${address.substring(0, 4)}...${address.substring(address.length - 4)}`;

  connectBtn.style.display = 'none';
  disconnectBtn.style.display = 'inline-block';

  addLog(`✅ Wallet connected: ${address}`, 'success');
}

function handleWalletDisconnect() {
  isConnected = false;

  connectionStatus.textContent = '❌ Not Connected';
  connectionStatus.className = 'status-badge error';
  walletAddress.textContent = 'Address: -';

  connectBtn.style.display = 'inline-block';
  connectBtn.disabled = false;
  connectBtn.textContent = 'Connect Wallet';
  disconnectBtn.style.display = 'none';

  // Clear wallet selection
  highlightSelectedWallet('');

  addLog('ℹ️ Wallet disconnected', 'info');
}

function handleWalletError(error: Error) {
  addLog(`❌ Wallet error: ${error.message}`, 'error');
  console.error('Wallet error:', error);
}

async function runTest(testName: string, testFn: Function, isKitTest: boolean = false) {
  if (!manager || !connection) {
    addLog('❌ System not initialized', 'error');
    return;
  }

  if (!isConnected) {
    addLog(`⚠️ Please connect your wallet before running ${testName}`, 'warning');
    return;
  }

  addLog(`🧪 Testing: ${testName}...`, 'info');

  try {
    let result;
    if (isKitTest) {
      result = await testFn(manager);
    } else {
      result = await testFn(manager, connection);
    }

    if (result) {
      addLog(`✅ ${testName} completed successfully!`, 'success');
    }
  } catch (error: any) {
    const errorMsg = error.message || String(error);
    const causeMsg = error.cause ? ` | Cause: ${error.cause.message || String(error.cause)}` : '';
    addLog(`❌ ${testName} FAILED: ${errorMsg}${causeMsg}`, 'error');
    console.error(`${testName} error:`, error);
  }
}

async function runAllTestsHandler() {
  if (!manager || !connection) {
    addLog('❌ System not initialized', 'error');
    return;
  }

  if (!isConnected) {
    addLog('⚠️ Please connect your wallet before running tests', 'warning');
    return;
  }

  addLog('🚀 Running all tests...', 'info');
  addLog('═'.repeat(50), 'info');

  try {
    const results = await runAllTests(manager, connection);

    addLog('═'.repeat(50), 'info');
    addLog(`📊 TEST RESULTS:`, 'info');
    addLog(`   Total: ${results.total}`, 'info');
    addLog(`   ✅ Passed: ${results.passed}`, 'success');
    addLog(`   ❌ Failed: ${results.failed}`, results.failed > 0 ? 'error' : 'success');
    addLog('═'.repeat(50), 'info');

  } catch (error: any) {
    addLog(`❌ Error running all tests: ${error.message}`, 'error');
    console.error('Run all tests error:', error);
  }
}

function addLog(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = document.createElement('div');
  logEntry.className = `log-entry log-${type}`;

  const timeSpan = document.createElement('span');
  timeSpan.className = 'log-time';
  timeSpan.textContent = `[${timestamp}]`;

  const messageSpan = document.createElement('span');
  messageSpan.className = 'log-message';
  messageSpan.textContent = message;

  logEntry.appendChild(timeSpan);
  logEntry.appendChild(messageSpan);

  logPanel.appendChild(logEntry);
  logPanel.scrollTop = logPanel.scrollHeight;
}

function clearLog() {
  logPanel.innerHTML = '';
  addLog('🗑️ Log cleared', 'info');
}

// ==========================================================================
// Wallet Selection Functions
// ==========================================================================

function getReadyStateLabel(readyState: WalletReadyState): string {
  switch (readyState) {
    case WalletReadyState.Installed:
      return 'Installed';
    case WalletReadyState.Loadable:
      return 'Loadable';
    case WalletReadyState.NotDetected:
      return 'Not Detected';
    case WalletReadyState.Unsupported:
      return 'Not Supported';
    default:
      return 'Unknown';
  }
}

function renderWalletList() {
  walletListEl.innerHTML = '';

  if (globalAdapters.length === 0) {
    walletListEl.innerHTML = '<p class="empty-message">No wallets found. Please install a Solana wallet.</p>';
    return;
  }

  // Group adapters by ready state
  const installedAdapters = getAdaptersByReadyState(globalAdapters, WalletReadyState.Installed);
  const loadableAdapters = getAdaptersByReadyState(globalAdapters, WalletReadyState.Loadable);
  const notDetectedAdapters = getAdaptersByReadyState(globalAdapters, WalletReadyState.NotDetected);
  const unsupportedAdapters = globalAdapters.filter(adapter =>
    adapter.readyState === WalletReadyState.Unsupported);

  let itemIndex = 1;

  // Render installed adapters
  if (installedAdapters.length > 0) {
    const sectionHeader = document.createElement('div');
    sectionHeader.className = 'wallet-section-header';
    sectionHeader.textContent = 'Installed Wallets';
    walletListEl.appendChild(sectionHeader);

    installedAdapters.forEach(adapter => {
      walletListEl.appendChild(createWalletItem(adapter, itemIndex++));
    });
  }

  // Render loadable adapters
  if (loadableAdapters.length > 0) {
    const sectionHeader = document.createElement('div');
    sectionHeader.className = 'wallet-section-header';
    sectionHeader.textContent = 'Loadable Wallets';
    walletListEl.appendChild(sectionHeader);

    loadableAdapters.forEach(adapter => {
      walletListEl.appendChild(createWalletItem(adapter, itemIndex++));
    });
  }

  // Render not detected adapters
  if (notDetectedAdapters.length > 0) {
    const sectionHeader = document.createElement('div');
    sectionHeader.className = 'wallet-section-header';
    sectionHeader.textContent = 'Not Detected Wallets';
    walletListEl.appendChild(sectionHeader);

    notDetectedAdapters.forEach(adapter => {
      walletListEl.appendChild(createWalletItem(adapter, itemIndex++, true));
    });
  }

  // Render unsupported adapters
  if (unsupportedAdapters.length > 0) {
    const sectionHeader = document.createElement('div');
    sectionHeader.className = 'wallet-section-header';
    sectionHeader.textContent = 'Unsupported Wallets';
    walletListEl.appendChild(sectionHeader);

    unsupportedAdapters.forEach(adapter => {
      walletListEl.appendChild(createWalletItem(adapter, itemIndex++, true));
    });
  }

  const selectedAdapter = manager?.getAdapter();
  if (selectedAdapter) {
    highlightSelectedWallet(selectedAdapter.name);
  }
}

function createWalletItem(adapter: any, index: number, disabled = false) {
  const { name, icon, readyState } = adapter;

  const walletItem = document.createElement('div');
  walletItem.className = `wallet-item ${disabled ? 'disabled' : ''}`;
  walletItem.dataset.walletName = name;

  let iconUrl = icon;
  if (typeof icon === 'string' && icon.startsWith('data:')) {
    iconUrl = icon;
  } else if (typeof icon === 'string') {
    iconUrl = icon;
  } else {
    // Fallback icon
    iconUrl = 'https://raw.githubusercontent.com/solana-labs/wallet-adapter/master/packages/wallets/icons/generic.svg';
  }

  const statusClass = readyState === WalletReadyState.Installed ? 'installed' :
                     readyState === WalletReadyState.Loadable ? 'loadable' :
                     readyState === WalletReadyState.Unsupported ? 'unsupported' :
                     readyState === WalletReadyState.NotDetected ? 'not-detected' : '';

  walletItem.innerHTML = `
    <span class="wallet-index">${index}.</span>
    <img src="${iconUrl}" alt="${name} icon" onerror="this.src='https://raw.githubusercontent.com/solana-labs/wallet-adapter/master/packages/wallets/icons/generic.svg'">
    <div class="wallet-name">${name}</div>
    <div class="wallet-status ${statusClass}">${getReadyStateLabel(readyState)}</div>
  `;

  if (!disabled) {
    walletItem.addEventListener('click', () => {
      selectWallet(name);
    });
  } else {
    walletItem.style.opacity = '0.6';
    walletItem.style.cursor = 'not-allowed';
    walletItem.title = `${name} cannot be selected (${getReadyStateLabel(readyState)})`;
  }

  return walletItem;
}

function selectWallet(walletName: string) {
  highlightSelectedWallet(walletName);
  clickedWalletName = walletName;
  connectionStatus.textContent = `Selected: ${walletName}, Status: Not connected`;
  connectionStatus.className = 'status-badge';
  connectBtn.disabled = false;
  addLog(`📌 Selected wallet: ${walletName}`, 'info');
}

function highlightSelectedWallet(walletName: string) {
  document.querySelectorAll('.wallet-item').forEach(item => {
    const itemElement = item as HTMLElement;
    if (itemElement.dataset.walletName === walletName) {
      itemElement.style.border = '2px solid #9945FF';
      itemElement.style.backgroundColor = '#f0e6ff';
    } else {
      itemElement.style.border = '1px solid #eee';
      itemElement.style.backgroundColor = '';
    }
  });
}
