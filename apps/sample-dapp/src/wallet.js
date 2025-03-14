import { 
  WalletAdapterManager, 
  getStandardWalletAdapters,
  sortWalletAdapters,
  getAdaptersByReadyState
} from '@agateh/solana-headless-adapter-base';

import {
  WalletReadyState,
  WalletAdapterNetwork,
  createConnection,
  signMessage
} from '@agateh/solana-headless-core';

import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';

const walletListEl = document.getElementById('wallet-list');
const connectButton = document.getElementById('connect-button');
const connectSignButton = document.getElementById('connect-sign-button');
const disconnectButton = document.getElementById('disconnect-button');
const connectionStatus = document.getElementById('connection-status');
const walletAddress = document.getElementById('wallet-address');
const transactionActions = document.getElementById('transaction-actions');
const getBalanceButton = document.getElementById('get-balance-button');
const balanceDisplay = document.getElementById('balance-display');
const selectedAdapterInfo = document.getElementById('selected-adapter-info');
const eventLog = document.getElementById('event-log');
const clearLogButton = document.getElementById('clear-log-button');

const connection = createConnection(WalletAdapterNetwork.Devnet);

const wallets = [new PhantomWalletAdapter(), new SolflareWalletAdapter()];


let walletManager;
let previousPublicKey = null;
let isFetchingBalance = false;

window.addEventListener('DOMContentLoaded', initializeWalletIntegration);

window.addEventListener('beforeunload', cleanupWalletIntegration);

function addLogEntry(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = document.createElement('div');
  logEntry.className = `log-entry log-type-${type}`;
  logEntry.innerHTML = `<span class="log-timestamp">[${timestamp}]</span> ${message}`;
  eventLog.appendChild(logEntry);
  eventLog.scrollTop = eventLog.scrollHeight;
}

clearLogButton.addEventListener('click', () => {
  eventLog.innerHTML = '';
  addLogEntry('Log cleared', 'info');
});

function initializeWalletIntegration() {
  addLogEntry('Initializing wallet integration...', 'info');
  
  const adapters = getStandardWalletAdapters(wallets);
  
  if (adapters.length === 0) {
    walletListEl.innerHTML = '<p class="empty-message">No wallet adapters available. Please install a Solana wallet extension.</p>';
    addLogEntry('No wallet adapters found', 'warning');
    return;
  }
  
  const sortedAdapters = sortWalletAdapters(adapters);
  
  walletManager = new WalletAdapterManager(sortedAdapters, 'selectedWallet');
  
  setupWalletManagerEvents();
  
  renderWalletList();
  
  connectButton.addEventListener('click', connectWallet);
  disconnectButton.addEventListener('click', disconnectWallet);
  getBalanceButton.addEventListener('click', getBalance);
  connectSignButton.addEventListener('click', connectSignWallet);
  
  tryAutoConnect();
  
  addLogEntry(`Initialized with ${adapters.length} wallet adapters`, 'success');
}

function cleanupWalletIntegration() {
  if (walletManager) {
    walletManager.dispose();
    walletManager = null;
    addLogEntry('Wallet manager disposed', 'info');
  }
  
  connectButton.removeEventListener('click', connectWallet);
  disconnectButton.removeEventListener('click', disconnectWallet);
  getBalanceButton.removeEventListener('click', getBalance);
}

function setupWalletManagerEvents() {
  walletManager.on('connect', handleConnect);
  walletManager.on('disconnect', handleDisconnect);
  walletManager.on('error', handleError);
  walletManager.on('adapterChange', handleAdapterChange);
  walletManager.on('readyStateChange', handleReadyStateChange);
  addLogEntry('Wallet manager event listeners set up', 'info');
}

function handleConnect(publicKey) {
  previousPublicKey = publicKey;
  
  const selectedAdapter = walletManager.getSelectedAdapter();
  connectionStatus.textContent = `Connected to: ${selectedAdapter.name}`;
  walletAddress.textContent = `Wallet address: ${publicKey.toBase58()}`;
  
  connectButton.disabled = true;
  connectSignButton.disabled = true
  disconnectButton.disabled = false;
  transactionActions.style.display = 'block';
  
  updateAdapterDetails(selectedAdapter);
  
  addLogEntry(`Connected to wallet with public key: ${publicKey.toBase58()}`, 'success');
}

function handleDisconnect() {
  previousPublicKey = null;
  
  connectionStatus.textContent = 'Not connected';
  walletAddress.textContent = 'Wallet address: Not available';
  
  connectButton.disabled = false;
  connectSignButton.disabled = false
  disconnectButton.disabled = true;
  transactionActions.style.display = 'none';
  balanceDisplay.textContent = '';

  highlightSelectedWallet('')
  
  addLogEntry('Disconnected from wallet', 'info');
}

function handleError(error) {
  console.error('Wallet error:', error);
  addLogEntry(`Wallet error: ${error.message || 'Unknown error'}`, 'error');
  alert(`Wallet error: ${error.message || 'Unknown error'}`);
}

function handleAdapterChange(adapter) {
  if (adapter) {
    connectionStatus.textContent = `Selected: ${adapter.name}, Status: Not connected`;
    connectButton.disabled = false;
    connectSignButton.disabled = false
    
    highlightSelectedWallet(adapter.name);
    
    updateAdapterDetails(adapter);
    
    addLogEntry(`Selected wallet: ${adapter.name}`, 'info');
  } else {
    connectionStatus.textContent = 'No wallet selected';
    connectButton.disabled = true;
    connectSignButton.disabled = true
    
    selectedAdapterInfo.innerHTML = '<p>No wallet selected</p>';
    
    addLogEntry('No wallet selected', 'info');
  }
}

function handleReadyStateChange(readyState) {
  addLogEntry(`Wallet ready state changed: ${readyState}`, 'info');
  
  const adapter = walletManager.getSelectedAdapter();
  if (adapter && adapter.connected && adapter.publicKey) {
    if (previousPublicKey && 
        previousPublicKey.toBase58() !== adapter.publicKey.toBase58()) {
      addLogEntry(`Account changed from ${previousPublicKey.toBase58()} to ${adapter.publicKey.toBase58()}`, 'warning');
      
      walletAddress.textContent = `Wallet address: ${adapter.publicKey.toBase58()}`;
      
      previousPublicKey = adapter.publicKey;
      
      updateAdapterDetails(adapter);
      
      const accountChangedEvent = new CustomEvent('walletAccountChanged', {
        detail: {
          oldPublicKey: previousPublicKey,
          newPublicKey: adapter.publicKey
        }
      });
      document.dispatchEvent(accountChangedEvent);
      
      balanceDisplay.textContent = '';
    }
  }
}

function renderWalletList() {
  const adapters = walletManager.getAdapters();
  
  walletListEl.innerHTML = '';
  
  if (adapters.length === 0) {
    walletListEl.innerHTML = '<p class="empty-message">No wallets found. Please install a Solana wallet.</p>';
    return;
  }
  
  const installedAdapters = getAdaptersByReadyState(adapters, WalletReadyState.Installed);
  const loadableAdapters = getAdaptersByReadyState(adapters, WalletReadyState.Loadable);
  const notDetectedAdapters = getAdaptersByReadyState(adapters, WalletReadyState.NotDetected);
  
  if (installedAdapters.length > 0) {
    const sectionHeader = document.createElement('div');
    sectionHeader.className = 'wallet-section-header';
    sectionHeader.textContent = 'Installed Wallets';
    walletListEl.appendChild(sectionHeader);
    
    installedAdapters.forEach((adapter, index) => {
      walletListEl.appendChild(createWalletItem(adapter, index + 1));
    });
  }
  
  if (loadableAdapters.length > 0) {
    const sectionHeader = document.createElement('div');
    sectionHeader.className = 'wallet-section-header';
    sectionHeader.textContent = 'Loadable Wallets';
    walletListEl.appendChild(sectionHeader);
    
    loadableAdapters.forEach((adapter, index) => {
      walletListEl.appendChild(createWalletItem(adapter, installedAdapters.length + index + 1));
    });
  }
  
  if (notDetectedAdapters.length > 0) {
    const sectionHeader = document.createElement('div');
    sectionHeader.className = 'wallet-section-header';
    sectionHeader.textContent = 'Not Detected Wallets';
    walletListEl.appendChild(sectionHeader);
    
    notDetectedAdapters.forEach((adapter, index) => {
      walletListEl.appendChild(createWalletItem(
        adapter, 
        installedAdapters.length + loadableAdapters.length + index + 1
      ));
    });
  }
  
  const selectedAdapter = walletManager.getSelectedAdapter();
  if (selectedAdapter) {
    highlightSelectedWallet(selectedAdapter.name);
  }
}

function createWalletItem(adapter, index) {
  const { name, icon, readyState } = adapter;
  
  const walletItem = document.createElement('div');
  walletItem.className = 'wallet-item';
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
  
  const statusClass = readyState === WalletReadyState.Installed ? 'installed' : '';
  
  walletItem.innerHTML = `
    <span class="wallet-index">${index}.</span>
    <img src="${iconUrl}" alt="${name} icon" onerror="this.src='https://raw.githubusercontent.com/solana-labs/wallet-adapter/master/packages/wallets/icons/generic.svg'">
    <div>${name}</div>
    <div class="status ${statusClass}">${getReadyStateLabel(readyState)}</div>
  `;
  
  walletItem.addEventListener('click', () => {
    selectWallet(name);
  });
  
  return walletItem;
}

function getReadyStateLabel(readyState) {
  switch (readyState) {
    case WalletReadyState.Installed:
      return 'Installed';
    case WalletReadyState.Loadable:
      return 'Loadable';
    case WalletReadyState.NotDetected:
      return 'Not Detected';
    default:
      return 'Unknown';
  }
}

function highlightSelectedWallet(walletName) {
  document.querySelectorAll('.wallet-item').forEach(item => {
    if (item.dataset.walletName === walletName) {
      item.style.border = '2px solid #9945FF';
      item.style.backgroundColor = '#f0e6ff';
    } else {
      item.style.border = '1px solid #eee';
      item.style.backgroundColor = '';
    }
  });
}

function selectWallet(walletName) {
  walletManager.selectAdapter(walletName);
}

function updateAdapterDetails(adapter) {
  if (!adapter) {
    selectedAdapterInfo.innerHTML = '<p>No wallet selected</p>';
    return;
  }
  
  let supportedTransactionsText = 'Not specified';
  if (adapter.supportedTransactionVersions) {
    supportedTransactionsText = Array.from(adapter.supportedTransactionVersions).join(', ');
  }
  
  const detailsHTML = `
    <dl>
      <dt>Name:</dt>
      <dd>${adapter.name}</dd>
      
      <dt>Ready State:</dt>
      <dd>${getReadyStateLabel(adapter.readyState)}</dd>
      
      <dt>Connected:</dt>
      <dd>${adapter.connected ? 'Yes' : 'No'}</dd>
      
      <dt>Public Key:</dt>
      <dd>${adapter.publicKey ? adapter.publicKey.toBase58() : 'Not available'}</dd>
      
      <dt>URL:</dt>
      <dd><a href="${adapter.url}" target="_blank">${adapter.url || 'Not available'}</a></dd>
      
      <dt>Supported Transactions:</dt>
      <dd>${supportedTransactionsText}</dd>
    </dl>
    
    <div class="adapter-methods">
      <h3>Available Methods</h3>
      <ul>
        ${adapter.connect ? '<li>connect()</li>' : ''}
        ${adapter.disconnect ? '<li>disconnect()</li>' : ''}
        ${adapter.sendTransaction ? '<li>sendTransaction()</li>' : ''}
        ${adapter.signTransaction ? '<li>signTransaction()</li>' : ''}
        ${adapter.signAllTransactions ? '<li>signAllTransactions()</li>' : ''}
        ${adapter.signMessage ? '<li>signMessage()</li>' : ''}
        ${adapter.signIn ? '<li>signIn()</li>' : ''}
      </ul>
    </div>
  `;
  
  selectedAdapterInfo.innerHTML = detailsHTML;
}


async function tryAutoConnect() {
  addLogEntry('Attempting auto-connect...', 'info');
  try {
    const adapter = await walletManager.autoConnect();
    
    if (adapter) {
      addLogEntry(`Auto-connected to ${adapter.name}`, 'success');
    } else {
      addLogEntry('Auto-connect did not find a previously connected wallet', 'info');
    }
  } catch (error) {
    addLogEntry(`Auto-connect failed: ${error.message}`, 'error');
    console.error('Auto-connect failed:', error);
  }
}

async function connectWallet() {
  addLogEntry('Connecting wallet...', 'info');
  try {
    await walletManager.connect();
  } catch (error) {
    addLogEntry(`Connection error: ${error.message}`, 'error');
    console.error('Connection error:', error);
    alert(`Failed to connect: ${error.message}`);
  }
}


async function connectSignWallet() {
  addLogEntry('Waiting for Signin wallet...', 'info');
  try {
    const selectedAdapter = walletManager.getSelectedAdapter()
    if (selectedAdapter) {
      await walletManager.connect();
      
      // Sign a test message
      const message = 'Test message for wallet authentication';
      addLogEntry(`Signing message: "${message}"`, 'info');
      
      const messageBytes = new TextEncoder().encode(message);
      const signature = await signMessage(messageBytes, selectedAdapter);
      
      // Convert signature to Base64 for display
      let signatureBase64;
      try {
        // Browser approach
        signatureBase64 = btoa(String.fromCharCode.apply(null, Array.from(signature)));
      } catch (error) {
        // Fallback
        signatureBase64 = Array.from(signature).map(b => b.toString(16).padStart(2, '0')).join('');
      }
      
      addLogEntry(`Message signed successfully! Signature: ${signatureBase64}`, 'success');
    }
  } catch (error) {
    await disconnectWallet()
    addLogEntry(`Sign message error: ${error.message}`, 'error');
    console.error('Sign message error:', error);
    alert(`Failed to connect: ${error.message}`);
  }
}

async function disconnectWallet() {
  addLogEntry('Disconnecting wallet...', 'info');
  try {
    await walletManager.disconnect();
  } catch (error) {
    addLogEntry(`Disconnection error: ${error.message}`, 'error');
    console.error('Disconnection error:', error);
    alert(`Failed to disconnect: ${error.message}`);
  }
}

async function getBalance() {
  if (isFetchingBalance) return;
  
  try {
    const adapter = walletManager.getSelectedAdapter();
    
    if (!adapter || !adapter.connected || !adapter.publicKey) {
      throw new Error('Wallet not connected');
    }
    
    // Display loading state
    isFetchingBalance = true;
    balanceDisplay.textContent = 'Fetching balance...';
    addLogEntry('Fetching wallet balance...', 'info');
    getBalanceButton.disabled = true;
    
    const balance = await connection.getBalance(adapter.publicKey);
    
    const solBalance = balance / 1000000000;
    
    balanceDisplay.textContent = `Balance: ${solBalance.toLocaleString()} SOL`;
    addLogEntry(`Balance retrieved: ${solBalance} SOL`, 'success');
    
  } catch (error) {
    addLogEntry(`Error getting balance: ${error.message}`, 'error');
    console.error('Error getting balance:', error);
    balanceDisplay.textContent = `Error getting balance: ${error.message}`;
  } finally {
    isFetchingBalance = false;
    getBalanceButton.disabled = false;
  }
}

document.addEventListener('walletAccountChanged', (event) => {
  addLogEntry(`Account changed event detected: ${JSON.stringify(event.detail)}`, 'warning');
});