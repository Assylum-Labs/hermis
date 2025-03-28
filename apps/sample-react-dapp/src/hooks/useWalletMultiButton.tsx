import { FC } from 'react';
import { useWalletMultiButton } from '@hermis/solana-headless-react';

export const WalletButton: FC = () => {
  const { 
    buttonState, 
    onConnect, 
    onDisconnect, 
    onSelectWallet,
    walletIcon,
    walletName,
    publicKey
  } = useWalletMultiButton();
  
  const renderButton = () => {
    switch (buttonState) {
      case 'connecting':
        return <button disabled>Connecting...</button>;
      
      case 'connected':
        return (
          <button onClick={onDisconnect} className="connected-button">
            {walletIcon && <img src={walletIcon} alt="Wallet" width={20} height={20} />}
            <span>{publicKey?.slice(0, 4)}...{publicKey?.slice(-4)}</span>
          </button>
        );
      
      case 'disconnecting':
        return <button disabled>Disconnecting...</button>;
      
      case 'has-wallet':
        return (
          <button onClick={onConnect}>
            Connect to {walletName}
          </button>
        );
      
      case 'no-wallet':
      default:
        return (
          <button onClick={onSelectWallet}>
            Select Wallet
          </button>
        );
    }
  };
  
  return (
    <div className="wallet-button-container">
      {renderButton()}
    </div>
  );
};