import React from 'react';
import { useSolanaTokenAccounts } from '@agateh/solana-headless-react';
import './TokenBalances.css';

export const TokenBalances: React.FC = () => {
  const { tokenAccounts, loading, error, refetch } = useSolanaTokenAccounts();

  if (loading) {
    return (
      <div className="token-balances-card">
        <div className="token-balances-header">
          <h3>SPL Token Balances</h3>
        </div>
        <div className="token-balances-body">
          <div className="token-balances-loading">Loading token balances...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="token-balances-card">
        <div className="token-balances-header">
          <h3>SPL Token Balances</h3>
        </div>
        <div className="token-balances-body">
          <div className="token-balances-error">
            Error loading token balances: {error.message}
          </div>
          <button className="token-balances-retry" onClick={refetch}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="token-balances-card">
      <div className="token-balances-header">
        <h3>SPL Token Balances</h3>
        <button className="token-balances-refresh" onClick={refetch}>
          ↻
        </button>
      </div>
      <div className="token-balances-body">
        {tokenAccounts.length === 0 ? (
          <div className="token-balances-empty">
            No SPL tokens found in this wallet
          </div>
        ) : (
          <div className="token-balances-list">
            <table className="token-table">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Balance</th>
                  <th>Decimals</th>
                </tr>
              </thead>
              <tbody>
                {tokenAccounts.map((account) => {
                  // Calculate the display amount based on decimals
                  const displayAmount = Number(account.amount) / Math.pow(10, account.decimals);
                  const formattedAmount = displayAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: account.decimals,
                  });

                  return (
                    <tr key={account.pubkey.toString()}>
                      <td className="token-mint" title={account.mint.toString()}>
                        {account.mint.toString().slice(0, 4)}...{account.mint.toString().slice(-4)}
                      </td>
                      <td className="token-amount">{formattedAmount}</td>
                      <td className="token-decimals">{account.decimals}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};