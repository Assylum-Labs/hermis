# Documentation Code Validation Checklist

**Date Started:** _________
**Tester:** _________
**Status:** 🔄 In Progress

---

## Testing Priority

- ⭐ **Critical** - Must test (core functionality)
- 🔸 **Important** - Should test (common use cases)
- 🔹 **Nice to have** - Optional (edge cases)

---

## 1. Basic Transfer ⭐ CRITICAL

**Location:** `docs/core-concepts/transactions.mdx` - Basic Transfer section

- [ ] **React + web3.js** - SOL transfer with signAndSendTransaction
  - Expected: Transaction signature returned
  - Issues: ___________

- [ ] **React + Kit** - SOL transfer with @solana-program/system
  - Expected: Transaction signature returned
  - Issues: ___________

- [ ] **Vanilla TS + web3.js** - SOL transfer with WalletAdapterManager
  - Expected: Transaction signature returned
  - Issues: ___________

- [ ] **Vanilla TS + Kit** - SOL transfer with WalletAdapterManager + Kit
  - Expected: Transaction signature returned
  - Issues: ___________

---

## 2. Sign Only 🔸 IMPORTANT

**Location:** `docs/core-concepts/transactions.mdx` - Sign Only section

- [ ] **React + web3.js** - Sign transaction without sending
  - Expected: Signed transaction object
  - Issues: ___________

- [ ] **React + Kit** - Sign Kit message without sending
  - Expected: Signed message
  - Issues: ___________

- [ ] **Vanilla TS + web3.js** - Sign with adapter
  - Expected: Signed transaction object
  - Issues: ___________

- [ ] **Vanilla TS + Kit** - Sign Kit message with adapter
  - Expected: Signed message
  - Issues: ___________

---

## 3. Sign Multiple 🔸 IMPORTANT

**Location:** `docs/core-concepts/transactions.mdx` - Sign Multiple section

- [ ] **React + web3.js** - Sign array of transactions
  - Expected: Array of signed transactions
  - Issues: ___________

- [ ] **React + Kit** - Sign array of Kit messages
  - Expected: Array of signed messages
  - Issues: ___________

- [ ] **Vanilla TS + web3.js** - Sign multiple with adapter
  - Expected: Array of signed transactions
  - Issues: ___________

- [ ] **Vanilla TS + Kit** - Sign multiple Kit messages with adapter
  - Expected: Array of signed messages
  - Issues: ___________

---

## 4. With Confirmation 🔸 IMPORTANT

**Location:** `docs/core-concepts/transactions.mdx` - With Confirmation section

- [ ] **React + web3.js** - Send and confirm transaction
  - Expected: Confirmed transaction signature
  - Issues: ___________

- [ ] **React + Kit** - Send and check Kit transaction status
  - Expected: Transaction status response
  - Issues: ___________

- [ ] **Vanilla TS + web3.js** - Send and confirm with adapter
  - Expected: Confirmed transaction signature
  - Issues: ___________

- [ ] **Vanilla TS + Kit** - Send and check Kit status with adapter
  - Expected: Transaction status response
  - Issues: ___________

---

## 5. With Options 🔹 NICE TO HAVE

**Location:** `docs/core-concepts/transactions.mdx` - With Options section

- [ ] **React + web3.js** - Send with custom options
  - Expected: Transaction signature with options applied
  - Issues: ___________

- [ ] **React + Kit** - Send Kit transaction with options
  - Expected: Transaction signature with options applied
  - Issues: ___________

- [ ] **Vanilla TS + web3.js** - Send with options via adapter
  - Expected: Transaction signature with options applied
  - Issues: ___________

- [ ] **Vanilla TS + Kit** - Send Kit transaction with options via adapter
  - Expected: Transaction signature with options applied
  - Issues: ___________

---

## 6. SPL Token Transfer ⭐ CRITICAL

**Location:** `docs/core-concepts/transactions.mdx` - Transfer Tokens section

- [ ] **React + web3.js** - Transfer SPL tokens
  - Expected: Token transfer signature
  - Issues: ___________

- [ ] **React + Kit** - Transfer tokens with @solana-program/token
  - Expected: Token transfer signature
  - Issues: ___________

- [ ] **Vanilla TS + web3.js** - Transfer tokens with adapter
  - Expected: Token transfer signature
  - Issues: ___________

- [ ] **Vanilla TS + Kit** - Transfer tokens with adapter + Kit
  - Expected: Token transfer signature
  - Issues: ___________

---

## 7. Retry Logic 🔸 IMPORTANT

**Location:** `docs/core-concepts/transactions.mdx` - Retry Logic section

- [ ] **React + web3.js** - Retry failed transactions
  - Expected: Transaction succeeds after retry
  - Issues: ___________

- [ ] **React + Kit** - Retry Kit transactions
  - Expected: Transaction succeeds after retry
  - Issues: ___________

- [ ] **Vanilla TS + web3.js** - Retry with adapter
  - Expected: Transaction succeeds after retry
  - Issues: ___________

- [ ] **Vanilla TS + Kit** - Retry Kit transactions with adapter
  - Expected: Transaction succeeds after retry
  - Issues: ___________

---

## 8. Estimating Fees 🔹 NICE TO HAVE

**Location:** `docs/core-concepts/transactions.mdx` - Estimating Fees section

- [ ] **React + web3.js** - Estimate transaction fees
  - Expected: Fee amount in SOL
  - Issues: ___________

- [ ] **React + Kit** - Estimate Kit transaction fees
  - Expected: Fee amount in lamports
  - Issues: ___________

- [ ] **Vanilla TS + web3.js** - Estimate fees with adapter
  - Expected: Fee amount in SOL
  - Issues: ___________

- [ ] **Vanilla TS + Kit** - Estimate Kit fees with adapter
  - Expected: Fee amount in lamports
  - Issues: ___________

---

## 9. Priority Fees ⭐ CRITICAL

**Location:** `docs/core-concepts/transactions.mdx` - Priority Fees section

- [ ] **React + web3.js** - Add compute budget instruction
  - Expected: Transaction with priority fee sent
  - Issues: ___________

- [ ] **React + Kit** - Add Kit compute budget instruction
  - Expected: Transaction with priority fee sent
  - Issues: ___________

- [ ] **Vanilla TS + web3.js** - Priority fee with adapter
  - Expected: Transaction with priority fee sent
  - Issues: ___________

- [ ] **Vanilla TS + Kit** - Kit priority fee with adapter
  - Expected: Transaction with priority fee sent
  - Issues: ___________

---

## Summary

**Total Tests:** 36
**Completed:** _____ / 36
**Failed:** _____
**Skipped:** _____

### Critical Issues Found:
1. _________________________________
2. _________________________________
3. _________________________________

### Minor Issues Found:
1. _________________________________
2. _________________________________

### Dependencies to Install:
- [ ] `@solana-program/system`
- [ ] `@solana-program/token`
- [ ] `@solana-program/compute-budget`

---

## Notes

**Common Issues:**
- Missing dependencies
- Type mismatches
- Import path errors
- Runtime errors

**Testing Environment:**
- Network: Devnet
- Wallet: __________
- Browser: __________
- Node Version: __________

**Additional Comments:**
___________________________________________
___________________________________________
___________________________________________
