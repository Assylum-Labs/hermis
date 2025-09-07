import { useState, useEffect, useCallback, useRef } from 'react'
import './App.css'
import { 
  useWallet, 
  useConnection, 
  useWalletAdapters, 
  useSolanaBalance,
  getIsMobile
} from '@hermis/solana-headless-react'
import { 
  WalletReadyState, 
  PublicKey, 
  WalletName 
} from '@hermis/solana-headless-core'

// Import the custom components we created
import { WalletModal } from './components/WalletModal'
import { TransactionCard } from './components/TransactionCard'
import { TokenBalances } from './components/TokenBalances'
import { NFTGallery } from './components/NFTGallery'
import { NetworkSelector } from './components/NetworkSelector'
import { useNetwork } from './context/WalletContextProvider'

// Wallet Item Component for the list
interface WalletItemProps {
  name: string;
  icon: string;
  readyState: WalletReadyState;
  index: number;
  isSelected: boolean;
  disabled: boolean;
  onClick: () => void;
}

const WalletItem = ({ name, icon, readyState, index, isSelected, disabled, onClick }: WalletItemProps) => {
  const getReadyStateLabel = (readyState: WalletReadyState) => {
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
  };

  const statusClass = readyState === WalletReadyState.Installed ? 'installed' : 
                     readyState === WalletReadyState.Unsupported ? 'unsupported' :
                     readyState === WalletReadyState.NotDetected ? 'not-detected' : '';

  return (
    <div 
      className={`wallet-item ${disabled ? 'disabled' : ''}`}
      style={{ 
        border: isSelected ? '2px solid #9945FF' : '1px solid #eee',
        backgroundColor: isSelected ? '#f0e6ff' : '',
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer'
      }}
      onClick={disabled ? undefined : onClick}
      title={disabled ? `${name} cannot be selected (${getReadyStateLabel(readyState)})` : undefined}
    >
      <span className="wallet-index">{index}.</span>
      <img 
        src={icon} 
        alt={`${name} icon`} 
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = 'https://raw.githubusercontent.com/solana-labs/wallet-adapter/master/packages/wallets/icons/generic.svg';
        }}
      />
      <div>{name}</div>
      <div className={`status ${statusClass}`}>{getReadyStateLabel(readyState)}</div>
    </div>
  );
};

// Event log entry type
interface LogEntry {
  message: string;
  type: 'info' | 'error' | 'warning' | 'success';
  timestamp: Date;
}

function App() {
  // Network context
  const { currentNetwork, changeNetwork, isChangingNetwork } = useNetwork();
  
  // React hooks from the headless SDK
  const { 
    wallet, 
    wallets, 
    publicKey, 
    connecting, 
    connected, 
    select, 
    connect, 
    disconnect,
    signIn,
    signMessage
  } = useWallet();
  const { connection } = useConnection();
  const { installed, loadable, notDetected } = useWalletAdapters();
  const balance = useSolanaBalance(publicKey);

  // Local component state
  const [clickedWalletName, setClickedWalletName] = useState<string | null>(null);
  const [eventLogs, setEventLogs] = useState<LogEntry[]>([]);
  const eventLogRef = useRef<HTMLDivElement>(null);
  const [isFetchingBalance, setIsFetchingBalance] = useState(false);
  const previousPublicKeyRef = useRef<PublicKey | null>(null);
  const isMobile = getIsMobile(wallets.map(w => w.adapter));

  // Add log entry
  const addLogEntry = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    setEventLogs(prev => [...prev, {
      message,
      type,
      timestamp: new Date()
    }]);
  }, []);

  // Clear logs
  const clearLogs = () => {
    setEventLogs([]);
    addLogEntry('Log cleared', 'info');
  };

  // Auto-scroll log to bottom when new entries added
  useEffect(() => {
    if (eventLogRef.current) {
      eventLogRef.current.scrollTop = eventLogRef.current.scrollHeight;
    }
  }, [eventLogs]);

  // Log when component mounts
  useEffect(() => {
    addLogEntry('Initializing wallet integration...', 'info');
    addLogEntry(`Device environment: ${isMobile ? 'Mobile' : 'Desktop'}`, 'info');
    addLogEntry(`Found ${wallets.length} wallet adapters`, 'success');
    
    wallets.forEach(wallet => {
      addLogEntry(`Available adapter: ${wallet.adapter.name} (${getReadyStateLabel(wallet.readyState)})`, 'info');
    });
  }, [wallets.length, addLogEntry, isMobile, wallets]);

  // Log changes in connection state
  useEffect(() => {
    if (connected && wallet) {
      addLogEntry(`Connected to wallet with public key: ${publicKey?.toBase58()}`, 'success');
    }
  }, [connected, wallet, publicKey, addLogEntry]);

  // Track previous public key for account changes
  useEffect(() => {
    if (publicKey && previousPublicKeyRef.current && 
        publicKey.toBase58() !== previousPublicKeyRef.current.toBase58()) {
      addLogEntry(`Account changed from ${previousPublicKeyRef.current.toBase58()} to ${publicKey.toBase58()}`, 'warning');
    }
    
    previousPublicKeyRef.current = publicKey;
  }, [publicKey, addLogEntry]);

  useEffect(() => {
    if(!wallet?.adapter) return
    setClickedWalletName(wallet?.adapter.name)
  
    return () => {}
  }, [connected, wallet])
  
  

  // Helper function to get readable wallet state
  const getReadyStateLabel = (readyState: WalletReadyState) => {
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
  };

  // Handle wallet selection
  const handleSelectWallet = (walletName: string) => {
    setClickedWalletName(walletName);
    addLogEntry(`Selected wallet: ${walletName}`, 'info');
  };

  // Connect to wallet
  const handleConnectWallet = async () => {
    
    if (!clickedWalletName) {
      addLogEntry('No wallet selected', 'warning');
      return;
    }
    
    addLogEntry('Connecting wallet...', 'info');
    try {
      await select(clickedWalletName as WalletName);
      await connect();
    } catch (error) {
      console.error('Connection error:', error);
      addLogEntry(`Connection error: ${(error as Error).message || 'Unknown error'}`, 'error');
      await disconnect();
    }
  };

  // Connect and sign message
  const handleConnectSignWallet = async () => {
    if (!clickedWalletName) {
      addLogEntry('No wallet selected', 'warning');
      return;
    }
    
    addLogEntry('Connecting wallet and preparing to sign message...', 'info');
    try {
      await select(clickedWalletName as WalletName);
      if(signIn) {
        const statement = `Test message for wallet authentication at ${new Date().toISOString()}`;
        const result = await signIn({ statement });
        const parsedResult = result as unknown as {'0':{signature: Uint8Array}};
        const signature = parsedResult['0'].signature;
        if(signature) {
          let signatureBase64: string;
          try {
            signatureBase64 = btoa(String.fromCharCode.apply(null, Array.from(signature)));
          } catch {
            signatureBase64 = Array.from(signature).map(b => b.toString(16).padStart(2, '0')).join('');
          }
          addLogEntry(`Message signed successfully! Signature: ${signatureBase64}`, 'success');
        }
        return;
      } 
    } catch (error) {
      addLogEntry('Wallet does not support signIn', 'info');
      if (error == "Error: Wallet does not support sign in") {
        const selectedAdapter = await connect();
        const isConnected = selectedAdapter.connected
        
        if (isConnected) {
          addLogEntry('Successfully connected to wallet!', 'success');
        } else {
          addLogEntry('Connection attempted but wallet reported not connected', 'warning');
        }
        await handleSignMessage(isConnected);
      } else {
        console.error('Connect and sign error:', error);
        addLogEntry(`Sign message error: ${(error as Error).message}`, 'error');
        await disconnect();
      }
    }
  };

  // Sign a message
  const handleSignMessage = async (isConnected?: boolean) => {
    
    const connectStatus = isConnected || connected

    if (!connectStatus || !signMessage) {
      addLogEntry('Wallet not connected or does not support signing', 'error');
      return;
    }

    const message = `Test message for wallet authentication at ${new Date().toISOString()}`;
    addLogEntry(`Signing message: "${message}"`, 'info');
    
    try {
      const messageBytes = new TextEncoder().encode(message);
      const signature = await signMessage(messageBytes);
      
      let signatureBase64: string;
      try {
        signatureBase64 = btoa(String.fromCharCode.apply(null, Array.from(signature)));
      } catch {
        signatureBase64 = Array.from(signature).map(b => b.toString(16).padStart(2, '0')).join('');
      }
      
      addLogEntry(`Message signed successfully! Signature: ${signatureBase64}`, 'success');
    } catch (error) {
      console.error('Sign message error:', error);
      addLogEntry(`Sign message error: ${(error as Error).message}`, 'error');
      await disconnect();
    }
  };

  // Disconnect wallet
  const handleDisconnectWallet = async () => {
    addLogEntry('Disconnecting wallet...', 'info');
    try {
      await disconnect();
      setClickedWalletName(null)
    } catch (error) {
      console.error('Disconnection error:', error);
      addLogEntry(`Disconnection error: ${(error as Error).message}`, 'error');
    }
  };

  // Get wallet balance from the connection directly
  const getBalance = async () => {
    if (isFetchingBalance || !publicKey) return;
    
    setIsFetchingBalance(true);
    addLogEntry('Fetching wallet balance...', 'info');
    
    try {
      const balanceValue = await connection.getBalance(publicKey);
      const solBalance = balanceValue / 1000000000;
      addLogEntry(`Balance retrieved: ${solBalance} SOL`, 'success');
    } catch (error) {
      console.error('Error getting balance:', error);
      addLogEntry(`Error getting balance: ${(error as Error).message}`, 'error');
    } finally {
      setIsFetchingBalance(false);
    }
  };

  // Render wallet adapter details
  const renderAdapterDetails = () => {
    if (!wallet) {
      return <p>No wallet selected</p>;
    }

    const adapter = wallet.adapter;
    const supportedTransactionsText = adapter.supportedTransactionVersions 
      ? Array.from(adapter.supportedTransactionVersions).join(', ')
      : 'Not specified';

    return (
      <>
        <dl>
          <dt>Name:</dt>
          <dd>{adapter.name}</dd>
          
          <dt>Ready State:</dt>
          <dd>{getReadyStateLabel(adapter.readyState)}</dd>
          
          <dt>Connected:</dt>
          <dd>{adapter.connected ? 'Yes' : 'No'}</dd>
          
          <dt>Public Key:</dt>
          <dd>{adapter.publicKey ? adapter.publicKey.toBase58() : 'Not available'}</dd>
          
          <dt>URL:</dt>
          <dd><a href={adapter.url} target="_blank">{adapter.url || 'Not available'}</a></dd>
          
          <dt>Supported Transactions:</dt>
          <dd>{supportedTransactionsText}</dd>
        </dl>
        
        <div className="adapter-methods">
          <h3>Available Methods</h3>
          <ul>
            {'connect' in adapter ? <li>connect()</li> : null}
            {'disconnect' in adapter ? <li>disconnect()</li> : null}
            {'sendTransaction' in adapter ? <li>sendTransaction()</li> : null}
            {'signAndSendTransaction' in adapter ? <li>signAndSendTransaction()</li> : null}
            {'signTransaction' in adapter ? <li>signTransaction()</li> : null}
            {'signAllTransactions' in adapter ? <li>signAllTransactions()</li> : null}
            {'signMessage' in adapter ? <li>signMessage()</li> : null}
            {'signIn' in adapter ? <li>signIn()</li> : null}
          </ul>
        </div>
      </>
    );
  };

  // State for controlling the modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Handler for transaction events
  const handleTransactionSent = (signature: string) => {
    addLogEntry(`Transaction sent with signature: ${signature}`, 'success');
  };

  // Main JSX render
  return (
    <div className="container">
      <header>
        <h1>Solana Headless Wallet Demo</h1>
        <p className="subtitle">React implementation using @hermis/solana-headless-react</p>
      </header>

      {/* Network Selector */}
      <NetworkSelector 
        currentNetwork={currentNetwork}
        onNetworkChange={changeNetwork}
        disabled={isChangingNetwork || connecting}
      />

      <div className={`wallet-container ${isMobile ? 'mobile-view' : ''}`}>
        {/* Wallet Section */}
        <div className="wallet-section">
          <h2>Available Wallets</h2>
          <div id="wallet-list" className="wallet-list">
            {wallets.length === 0 ? (
              <p className="empty-message">No wallets found. Please install a Solana wallet.</p>
            ) : (
              <>
                {/* Installed Wallets */}
                {installed.length > 0 && (
                  <>
                    <div className="wallet-section-header">Installed Wallets</div>
                    {installed.map((adapter, index) => (
                      <WalletItem
                        key={adapter.name}
                        name={adapter.name.toString()}
                        icon={adapter.icon || ''}
                        readyState={adapter.readyState}
                        index={index + 1}
                        isSelected={clickedWalletName === adapter.name.toString()}
                        disabled={false}
                        onClick={() => handleSelectWallet(adapter.name.toString())}
                      />
                    ))}
                  </>
                )}

                {/* Loadable Wallets */}
                {loadable.length > 0 && (
                  <>
                    <div className="wallet-section-header">Loadable Wallets</div>
                    {loadable.map((adapter, index) => (
                      <WalletItem
                        key={adapter.name}
                        name={adapter.name.toString()}
                        icon={adapter.icon || ''}
                        readyState={adapter.readyState}
                        index={installed.length + index + 1}
                        isSelected={clickedWalletName === adapter.name.toString()}
                        disabled={false}
                        onClick={() => handleSelectWallet(adapter.name.toString())}
                      />
                    ))}
                  </>
                )}

                {/* Not Detected Wallets */}
                {notDetected.length > 0 && (
                  <>
                    <div className="wallet-section-header">Not Detected Wallets</div>
                    {notDetected.map((adapter, index) => (
                      <WalletItem
                        key={adapter.name}
                        name={adapter.name.toString()}
                        icon={adapter.icon || ''}
                        readyState={adapter.readyState}
                        index={installed.length + loadable.length + index + 1}
                        isSelected={clickedWalletName === adapter.name.toString()}
                        disabled={true}
                        onClick={() => {}}
                      />
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Connection Section */}
        <div className="connection-section">
          <h2>Wallet Connection</h2>
          {isMobile && (
            <div className="mobile-notice">
              When connecting, you will be redirected to your wallet app. Return to this page after approving the connection.
            </div>
          )}
          <div className="status-container">
            <div id="connection-status" className="status">
              {connected 
                ? `Connected to: ${wallet?.adapter.name}` 
                : clickedWalletName 
                  ? `Selected: ${clickedWalletName}, Status: Not connected`
                  : 'Not connected (select a wallet)'}
            </div>
            <div id="wallet-address" className="address">
              Wallet address: {publicKey ? publicKey.toBase58() : 'Not available'}
            </div>
          </div>
          <div className="button-group">
            <button 
              onClick={handleConnectWallet} 
              disabled={!clickedWalletName || connecting || connected}
            >
              Connect
            </button>
            <button 
              onClick={handleConnectSignWallet} 
              disabled={!clickedWalletName || connecting || connected || isMobile}
              style={isMobile ? { display: 'none' } : undefined}
            >
              Sign In
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              disabled={connecting || connected}
            >
              Connect with Modal
            </button>
            <button 
              onClick={() =>handleSignMessage()} 
              disabled={!connected || !signMessage}
              style={{ display: connected && signMessage ? 'block' : 'none' }}
            >
              Sign Message
            </button>
            <button 
              onClick={handleDisconnectWallet} 
              disabled={!connected}
            >
              Disconnect
            </button>
          </div>
        </div>
        
        {/* Wallet Details Section */}
        <div id="wallet-details" className="wallet-details-section">
          <h2>Wallet Details</h2>
          <div className="details-container">
            <div id="selected-adapter-info">
              {renderAdapterDetails()}
            </div>
          </div>
        </div>

        {/* Transaction Section */}
        <div 
          id="transaction-actions" 
          className="transaction-section" 
          style={{ display: connected ? 'block' : 'none' }}
        >
          <h2>Actions</h2>
          <div className="action-buttons">
            <button 
              id="get-balance-button" 
              onClick={getBalance}
              disabled={isFetchingBalance || !publicKey}
            >
              Get Balance
            </button>
            <div id="balance-display" className={`balance ${isFetchingBalance ? 'loading' : ''}`}>
              {isFetchingBalance 
                ? 'Fetching balance...' 
                : balance.balance !== null 
                  ? `Balance: ${balance.balance.toLocaleString()} SOL` 
                  : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Additional components will be visible when wallet is connected */}
      {connected && (
        <div className="extended-components">
          <div className="component-row">
            <TransactionCard onTransactionSent={handleTransactionSent} />
          </div>
          <div className="component-row token-components">
            <div className="component-column">
              <TokenBalances />
            </div>
            <div className="component-column">
              <NFTGallery />
            </div>
          </div>
        </div>
      )}

      {/* Log Section */}
      <div id="log-container" className="log-section">
        <h2>Event Log</h2>
        <div id="event-log" className="event-log" ref={eventLogRef}>
          {eventLogs.map((log, index) => (
            <div key={index} className={`log-entry log-type-${log.type}`}>
              <span className="log-timestamp">[{log.timestamp.toLocaleTimeString()}]</span> {log.message}
            </div>
          ))}
        </div>
        <button id="clear-log-button" onClick={clearLogs}>Clear Log</button>
      </div>

      {/* Wallet Modal Component */}
      <WalletModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

export default App