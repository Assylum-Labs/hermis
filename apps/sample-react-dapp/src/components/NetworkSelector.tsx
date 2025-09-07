import React from 'react';
import './NetworkSelector.css';

export type SolanaNetwork = 'devnet' | 'testnet';

interface NetworkSelectorProps {
  currentNetwork: SolanaNetwork;
  onNetworkChange: (network: SolanaNetwork) => void;
  disabled?: boolean;
}

export const NetworkSelector: React.FC<NetworkSelectorProps> = ({
  currentNetwork,
  onNetworkChange,
  disabled = false
}) => {
  const networks: { value: SolanaNetwork; label: string; endpoint: string }[] = [
    { value: 'devnet', label: 'Devnet', endpoint: 'https://api.devnet.solana.com' },
    { value: 'testnet', label: 'Testnet', endpoint: 'https://api.testnet.solana.com' }
  ];

  return (
    <div className="network-selector">
      <label htmlFor="network-select">Network:</label>
      <select
        id="network-select"
        value={currentNetwork}
        onChange={(e) => onNetworkChange(e.target.value as SolanaNetwork)}
        disabled={disabled}
        className="network-select"
      >
        {networks.map((network) => (
          <option key={network.value} value={network.value}>
            {network.label}
          </option>
        ))}
      </select>
      <div className="network-info">
        <span className={`network-indicator ${currentNetwork}`}></span>
        <span className="network-label">{networks.find(n => n.value === currentNetwork)?.label}</span>
      </div>
    </div>
  );
};
