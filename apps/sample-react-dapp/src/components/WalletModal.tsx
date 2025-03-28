import React, { useState, useEffect } from 'react';
import { 
  useWallet, 
  useWalletAdapters, 
  WalletConnectionManager 
} from '@hermis/solana-headless-react';
import './WalletModal.css';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({ isOpen, onClose }) => {
  const { installed, loadable } = useWalletAdapters();
  const { select, connect, connected } = useWallet();
  const [_connecting, setConnecting] = useState(false);
  
  // Close modal when connection is successful
  useEffect(() => {
    if (connected && isOpen) {
      onClose();
    }
  }, [connected, isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelectAndConnect = async (walletName: string) => {
    try {
      setConnecting(true);
      select(walletName as any);
      await connect();
      onClose();
    } catch (error) {
      console.error('Failed to connect:', error);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="wallet-modal-overlay" onClick={onClose}>
      <div className="wallet-modal-content" onClick={e => e.stopPropagation()}>
        <div className="wallet-modal-header">
          <h3>Connect a Wallet</h3>
          <button className="wallet-modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="wallet-modal-body">
          <WalletConnectionManager>
            {/* {({ walletName, selectWallet }) => ( */}
            {() => (
              <>
                <div className="wallet-list-section">
                  <h4>Installed Wallets</h4>
                  {installed.length === 0 ? (
                    <p className="wallet-none-message">No installed wallets found</p>
                  ) : (
                    <ul className="wallet-list">
                      {installed.map(adapter => (
                        <li 
                          key={adapter.name} 
                          className="wallet-list-item"
                          onClick={() => handleSelectAndConnect(adapter.name.toString())}
                        >
                          <img 
                            src={adapter.icon} 
                            alt={`${adapter.name} icon`}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'https://raw.githubusercontent.com/solana-labs/wallet-adapter/master/packages/wallets/icons/generic.svg';
                            }}
                          />
                          <span>{adapter.name}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="wallet-list-section">
                  <h4>Other Wallets</h4>
                  {loadable.length === 0 ? (
                    <p className="wallet-none-message">No additional wallets found</p>
                  ) : (
                    <ul className="wallet-list">
                      {loadable.map(adapter => (
                        <li 
                          key={adapter.name} 
                          className="wallet-list-item"
                          onClick={() => handleSelectAndConnect(adapter.name.toString())}
                        >
                          <img 
                            src={adapter.icon} 
                            alt={`${adapter.name} icon`}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'https://raw.githubusercontent.com/solana-labs/wallet-adapter/master/packages/wallets/icons/generic.svg';
                            }}
                          />
                          <span>{adapter.name}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </WalletConnectionManager>
        </div>
        
        <div className="wallet-modal-footer">
          <p className="wallet-modal-note">
            By connecting a wallet, you agree to the Terms of Service and acknowledge that you have read and understand the protocol disclaimer.
          </p>
        </div>
      </div>
    </div>
  );
};