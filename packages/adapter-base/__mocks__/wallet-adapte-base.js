module.exports = {
  WalletAdapterNetwork: {
    Mainnet: 'mainnet-beta',
    Testnet: 'testnet',
    Devnet: 'devnet'
  },
  WalletReadyState: {
    Installed: 'Installed',
    Loadable: 'Loadable',
    NotDetected: 'NotDetected',
    Unsupported: 'Unsupported'
  },
  WalletError: class WalletError extends Error {
    constructor(message, error) {
      super(message);
      this.name = 'WalletError';
      this.error = error;
    }
  }
};