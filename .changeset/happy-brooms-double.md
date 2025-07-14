---
"sample-react-dapp": patch
"@hermis/solana-headless-adapter-base": patch
"@hermis/solana-headless-core": patch
"@hermis/solana-headless-react": patch
---

Fixed

- Wallet Detection Race Condition: Fixed issue where Backpack wallet would work on first visit but fail on subsequent visits due to asynchronous wallet standard events
- React State Synchronization: Fixed subscription system where manually provided adapters (like Solflare) would disappear when standard wallets register dynamically
- Deployment Build Process: Added proper build sequence to ensure all workspace packages are built before Vercel deployment

Improved

- Wallet Detection Architecture: Moved core wallet detection logic from React to vanilla JS libraries for better separation of concerns
- Subscription System: Enhanced wallet adapter change notifications to properly merge existing and newly detected adapters
- Error Handling: Added duplicate prevention and better logging for wallet detection debugging
