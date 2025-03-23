import React from 'react';
import { useSolanaNFTs } from '@agateh/solana-headless-react';
import './NFTGallery.css';

export const NFTGallery: React.FC = () => {
  const { nfts, loading, error, refetch } = useSolanaNFTs();

  if (loading) {
    return (
      <div className="nft-gallery-card">
        <div className="nft-gallery-header">
          <h3>NFT Gallery</h3>
        </div>
        <div className="nft-gallery-body">
          <div className="nft-gallery-loading">Loading NFTs...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="nft-gallery-card">
        <div className="nft-gallery-header">
          <h3>NFT Gallery</h3>
        </div>
        <div className="nft-gallery-body">
          <div className="nft-gallery-error">
            Error loading NFTs: {error.message}
          </div>
          <button className="nft-gallery-retry" onClick={refetch}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="nft-gallery-card">
      <div className="nft-gallery-header">
        <h3>NFT Gallery</h3>
        <button className="nft-gallery-refresh" onClick={refetch}>
          ↻
        </button>
      </div>
      <div className="nft-gallery-body">
        {nfts.length === 0 ? (
          <div className="nft-gallery-empty">
            No NFTs found in this wallet
          </div>
        ) : (
          <div className="nft-grid">
            {nfts.map((nft) => (
              <div key={nft.mint.toString()} className="nft-item">
                <div className="nft-thumbnail">
                  {/* We use a placeholder since we don't have full metadata */}
                  <div className="nft-placeholder">
                    NFT
                  </div>
                </div>
                <div className="nft-info">
                  <div className="nft-name" title={nft.mint.toString()}>
                    {nft.metadata?.name || `NFT ${nft.mint.toString().slice(0, 4)}...${nft.mint.toString().slice(-4)}`}
                  </div>
                  <div className="nft-mint">
                    {nft.mint.toString().slice(0, 6)}...{nft.mint.toString().slice(-6)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};