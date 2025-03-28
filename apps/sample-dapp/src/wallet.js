import { 
  WalletAdapterManager, 
  getStandardWalletAdapters,
  sortWalletAdapters,
  getAdaptersByReadyState,
  getIsMobile
} from '@hermis/solana-headless-adapter-base';

import {
  WalletReadyState,
  WalletAdapterNetwork,
  createConnection,
  signMessage
} from '@hermis/solana-headless-core';

import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { TrustWalletAdapter } from '@solana/wallet-adapter-trust';

const walletListEl = document.getElementById('wallet-list');
const connectButton = document.getElementById('connect-button');
const connectSignButton = document.getElementById('connect-sign-button');
const signMessageButton = document.getElementById('sign-message-button');
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

// Define base wallet adapters - Mobile adapter will be added automatically if needed
const wallets = [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter(),
  new TrustWalletAdapter()
];

// Check if we're on a mobile device to add some mobile-specific UI
const isMobile = getIsMobile(wallets);
if (isMobile) {
  document.body.classList.add('mobile-view');
  if (!document.querySelector('.mobile-notice')) {
    const mobileNotice = document.createElement('div');
    mobileNotice.className = 'mobile-notice';
    mobileNotice.textContent = 'When connecting, you will be redirected to your wallet app. Return to this page after approving the connection.';
    const connectionSection = document.querySelector('.connection-section');
    if (connectionSection) {
      connectionSection.prepend(mobileNotice);
    }
  }
}

let walletManager;
let globalAdapters = [] 
let previousPublicKey = null;
let isFetchingBalance = false;
let clickedWalletName = ''

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

async function initializeWalletIntegration() {
  addLogEntry('Initializing wallet integration...', 'info');
  addLogEntry(`Device environment: ${isMobile ? 'Mobile' : 'Desktop'}`, 'info');
  
  // Get standard wallet adapters, which will include mobile adapter if appropriate
  globalAdapters = await getStandardWalletAdapters(wallets, connection.rpcEndpoint);
  console.log(globalAdapters);
  
  // Hide the Connect & Sign button on mobile
  if (isMobile) {
    connectSignButton.style.display = 'none';
  }
  
  if (globalAdapters.length === 0) {
    walletListEl.innerHTML = '<p class="empty-message">No wallet adapters available. Please install a Solana wallet extension.</p>';
    addLogEntry('No wallet adapters found', 'warning');
    return;
  }
  
  addLogEntry(`Found ${globalAdapters.length} wallet adapters`, 'success');
  globalAdapters.forEach(adapter => {
    addLogEntry(`Available adapter: ${adapter.name} (${getReadyStateLabel(adapter.readyState)})`, 'info');
  });
  
  const sortedAdapters = sortWalletAdapters(globalAdapters);
  
  walletManager = new WalletAdapterManager(sortedAdapters, 'selectedWallet');
  
  setupWalletManagerEvents();
  
  renderWalletList();
  
  connectButton.addEventListener('click', connectWallet);
  disconnectButton.addEventListener('click', disconnectWallet);
  getBalanceButton.addEventListener('click', getBalance);
  connectSignButton.addEventListener('click', connectSignWallet);
  signMessageButton.addEventListener('click', signMessageOnly);
  
  // Initially hide the sign message button and disable it
  signMessageButton.style.display = 'none';
  signMessageButton.disabled = true;
  
  tryAutoConnect();
  
  addLogEntry(`Initialized with ${globalAdapters.length} wallet adapters`, 'success');
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
  connectSignButton.removeEventListener('click', connectSignWallet);
  signMessageButton.removeEventListener('click', signMessageOnly);
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
  connectSignButton.disabled = true;
  signMessageButton.style.display = 'block';
  signMessageButton.disabled = false;
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
  connectSignButton.disabled = false;
  signMessageButton.style.display = 'none';
  signMessageButton.disabled = true;
  disconnectButton.disabled = true;
  transactionActions.style.display = 'none';
  balanceDisplay.textContent = '';

  highlightSelectedWallet('')
  
  addLogEntry('Disconnected from wallet', 'info');
}

function handleError(error) {
  console.error('Wallet error:', error);
  addLogEntry(`Wallet error: ${error.message || 'Unknown error'}`, 'error');
  if (error.stack) {
    addLogEntry(`Error stack: ${error.stack}`, 'error');
  }
  alert(`Wallet error: ${error.message || 'Unknown error'}`);
}

function handleAdapterChange(adapter) {
  if (adapter) {
    connectionStatus.textContent = `Selected: ${adapter.name}, Status: Not connected`;
    
    // Check if adapter is loadable or installed before enabling connect button
    const isAdapterUsable = adapter.readyState === WalletReadyState.Installed || 
                          adapter.readyState === WalletReadyState.Loadable;
                          
    connectButton.disabled = !isAdapterUsable;
    connectSignButton.disabled = !isAdapterUsable || isMobile;
    
    highlightSelectedWallet(adapter.name);
    
    updateAdapterDetails(adapter);
    
    addLogEntry(`Selected wallet: ${adapter.name}`, 'info');
  } else {
    connectionStatus.textContent = 'No wallet selected';
    connectButton.disabled = true;
    connectSignButton.disabled = true;
    
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
  
  // Render unsupported adapters (with visual indicator)
  if (unsupportedAdapters.length > 0) {
    const sectionHeader = document.createElement('div');
    sectionHeader.className = 'wallet-section-header';
    sectionHeader.textContent = 'Unsupported Wallets';
    walletListEl.appendChild(sectionHeader);
    
    unsupportedAdapters.forEach(adapter => {
      walletListEl.appendChild(createWalletItem(adapter, itemIndex++, true));
    });
  }
  
  const selectedAdapter = walletManager.getSelectedAdapter();
  if (selectedAdapter) {
    highlightSelectedWallet(selectedAdapter.name)
  }
}

function createWalletItem(adapter, index, disabled = false) {
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
                     readyState === WalletReadyState.Unsupported ? 'unsupported' :
                     readyState === WalletReadyState.NotDetected ? 'not-detected' : '';
  
  walletItem.innerHTML = `
    <span class="wallet-index">${index}.</span>
    <img src="${iconUrl}" alt="${name} icon" onerror="this.src='https://raw.githubusercontent.com/solana-labs/wallet-adapter/master/packages/wallets/icons/generic.svg'">
    <div>${name}</div>
    <div class="status ${statusClass}">${getReadyStateLabel(readyState)}</div>
  `;
  
  if (!disabled) {
    walletItem.addEventListener('click', () => {
      selectWallet(name);
    });
  } else {
    // Apply a visual indication that this wallet is not selectable
    walletItem.style.opacity = '0.6';
    walletItem.style.cursor = 'not-allowed';
    walletItem.title = `${name} cannot be selected (${getReadyStateLabel(readyState)})`;
  }
  
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
    case WalletReadyState.Unsupported:
      return 'Not Supported';
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
  highlightSelectedWallet(walletName)
  clickedWalletName = walletName
  connectionStatus.textContent = `Selected: ${walletName}, Status: Not connected`
  connectButton.disabled = false;
  connectSignButton.disabled = false;
  // walletManager.selectAdapter(walletName); 
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
    if(clickedWalletName){
      walletManager.selectAdapter(clickedWalletName);
    }

    const adapter = walletManager.getSelectedAdapter();

    if(!adapter){
      addLogEntry('No wallet Selected', 'info');
      return
    }
    
    // Log extra details about the connection attempt
    addLogEntry(`Attempting to connect using adapter: ${adapter?.name}`, 'info');
    
    await walletManager.connect();
  } catch (error) {
    addLogEntry(`Connection error: ${error.message || 'Unknown error'}`, 'error');
    if (error.stack) {
      addLogEntry(`Error stack: ${error.stack}`, 'error');
    }
    console.error('Connection error:', error);
    alert(`Failed to connect: ${error.message || 'Unknown error'}`);
  }
}

async function connectSignWallet() {
  addLogEntry('Connecting wallet and preparing to sign message...', 'info');
  try {
    if(clickedWalletName){
      walletManager.selectAdapter(clickedWalletName);
    }

    const selectedAdapter = walletManager.getSelectedAdapter()
    console.log('Seelcted Wallet name', clickedWalletName);
    console.log('Selected Adapter', selectedAdapter);
    
    if (selectedAdapter) {
      await walletManager.connect();
      
      await signMessageWithAdapter(selectedAdapter);
    }
  } catch (error) {
    await disconnectWallet()
    addLogEntry(`Sign message error: ${error.message}`, 'error');
    if (error.stack) {
      addLogEntry(`Error stack: ${error.stack}`, 'error');
    }
    console.error('Sign message error:', error);
    alert(`Failed to sign message: ${error.message}`);
  }
}

async function signMessageOnly() {
  addLogEntry('Signing message...', 'info');
  try {
    const selectedAdapter = walletManager.getSelectedAdapter();
    if (selectedAdapter && selectedAdapter.connected) {
      await signMessageWithAdapter(selectedAdapter);
    } 
  } catch (error) {
    addLogEntry(`Sign message error: ${error.message}`, 'error');
    console.error('Sign message error:', error);
    alert(`Failed to sign message: ${error.message}`);
  }
}

async function signMessageWithAdapter(adapter) {
  const message = 'Test message for wallet authentication';
  addLogEntry(`Signing message: "${message}"`, 'info');
  
  const messageBytes = new TextEncoder().encode(message);
  const signature = await signMessage(messageBytes, adapter);
  
  let signatureBase64;
  try {
    signatureBase64 = btoa(String.fromCharCode.apply(null, Array.from(signature)));
  } catch (error) {
    signatureBase64 = Array.from(signature).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  addLogEntry(`Message signed successfully! Signature: ${signatureBase64}`, 'success');
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