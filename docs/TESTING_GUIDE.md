# Documentation Testing Guide

Complete guide for manually testing all code examples from the documentation.

---

## 📋 Quick Start

### Prerequisites

1. **Install Dependencies**
   ```bash
   # From project root
   pnpm install

   # Install documentation-specific packages
   pnpm add @solana-program/system @solana-program/token @solana-program/compute-budget
   ```

2. **Get Test SOL**
   - Set wallet to Devnet
   - Get SOL from [Solana Faucet](https://faucet.solana.com/)
   - Need ~1 SOL for all tests

3. **Prepare Checklist**
   - Open `docs/VALIDATION_CHECKLIST.md`
   - Keep it open to mark off tests as you complete them

---

## 🧪 Testing Approach

### Option A: React Sample App (Recommended for React Examples)

**Best for:** Testing 18 React examples (both web3.js and Kit)

#### Step 1: Start the React Sample App

```bash
cd apps/sample-react-dapp
pnpm install
pnpm dev
```

App will open at `http://localhost:5173`

#### Step 2: Navigate to Validation Page

1. Connect your wallet (Phantom, Solflare, etc.)
2. Navigate to `/docs-validation` route
   - **Option A:** Add to your routing manually:
     ```tsx
     // In App.tsx or your router
     import DocsValidation from './pages/DocsValidation';

     // Add route:
     <Route path="/docs-validation" element={<DocsValidation />} />
     ```
   - **Option B:** Replace a page temporarily:
     ```tsx
     // In App.tsx
     import DocsValidation from './pages/DocsValidation';
     // Use instead of another page
     ```

#### Step 3: Run Tests

1. **Connect Wallet** - Click connect button
2. **Select Devnet** - Make sure you're on devnet
3. **Test Each Section:**
   - Click "Test React + web3.js" button
   - Check logs at bottom of page
   - Check browser console for details
   - Mark checkbox in `VALIDATION_CHECKLIST.md`
   - Repeat for "Test React + Kit" button
4. **Move to Next Section** - Scroll down and repeat

#### Step 4: Document Results

- ✅ Success: Check box in checklist
- ❌ Failure: Check box, note issue in "Issues" field
- Take screenshots of any errors

---

### Option B: Vanilla Sample App (For Vanilla TS Examples)

**Best for:** Testing 18 Vanilla TypeScript examples

#### Step 1: Start the Vanilla Sample App

```bash
cd apps/sample-dapp
pnpm install
pnpm dev
```

#### Step 2: Integrate Test File

Add to your main file (e.g., `wallet.ts`):

```typescript
import { runAllTests } from './docs-validation';

// After wallet is connected and manager is created:
const connection = new Connection('https://api.devnet.solana.com');

// Option 1: Run all tests at once
document.getElementById('test-all-btn')?.addEventListener('click', async () => {
  await runAllTests(manager, connection);
});

// Option 2: Add individual test buttons
import {
  testBasicTransferWeb3,
  testBasicTransferKit,
  // ... import others
} from './docs-validation';
```

#### Step 3: Add Test Buttons to HTML

```html
<!-- In your HTML -->
<section class="test-section">
  <h2>Documentation Validation</h2>
  <button id="test-all-btn">Run All Tests</button>

  <!-- Or individual buttons -->
  <button id="test-basic-web3">Test Basic Transfer (web3.js)</button>
  <button id="test-basic-kit">Test Basic Transfer (Kit)</button>
  <!-- ... more buttons -->
</section>
```

#### Step 4: Run Tests

1. **Connect wallet** in your app
2. **Click test buttons**
3. **Check console** for results (press F12)
4. **Mark checklist** as tests complete

---

### Option C: Browser Console Testing (Fastest for Spot Checks)

**Best for:** Quick validation of specific examples

#### Steps:

1. Start either sample app and connect wallet
2. Open browser console (F12)
3. For React app - functions are exposed via components
4. For Vanilla app - functions exposed via `window.docsValidation`:

```javascript
// In browser console:
window.docsValidation.testBasicTransferWeb3(manager, connection)
  .then(sig => console.log('Success:', sig))
  .catch(err => console.error('Failed:', err));
```

---

## 📊 What to Look For

### ✅ Success Indicators

- **Transaction Signature** returned (58-char base58 string)
- **No console errors** (red text in console)
- **Log shows "SUCCESS"** in test output
- **Wallet popup** appeared and you approved (for send operations)

### ❌ Failure Indicators

- **TypeScript Error** - Import or type issue
- **Runtime Error** - Code crashes
- **Transaction Failed** - Wallet rejected or insufficient funds
- **Timeout** - Network issue or RPC down

---

## 🔍 Common Issues & Fixes

### Issue 1: Import Errors

**Error:**
```
Cannot find module '@solana-program/system'
```

**Fix:**
```bash
pnpm add @solana-program/system @solana-program/token @solana-program/compute-budget
```

---

### Issue 2: Insufficient Funds

**Error:**
```
Error: Insufficient funds
```

**Fix:**
- Visit [Solana Faucet](https://faucet.solana.com/)
- Request devnet SOL
- Wait for confirmation
- Retry test

---

### Issue 3: Network/RPC Issues

**Error:**
```
Error: Failed to fetch
```

**Fix:**
- Check internet connection
- Try different RPC endpoint:
  ```typescript
  // Instead of:
  const rpc = createSolanaRpc(devnet('https://api.devnet.solana.com'));

  // Try:
  const rpc = createSolanaRpc(devnet('https://api.devnet.solana.com'));
  ```
- Wait a minute and retry

---

### Issue 4: Wallet Not Connected

**Error:**
```
Cannot read property 'publicKey' of null
```

**Fix:**
- Make sure wallet is connected
- Check wallet is unlocked
- Refresh page and reconnect

---

### Issue 5: Type Errors with Kit

**Error:**
```
Type 'TransactionMessage' is not assignable to...
```

**Fix:**
- This is expected if using older versions
- Update to latest `@solana/kit` version:
  ```bash
  pnpm update @solana/kit
  ```

---

## 📝 Testing Workflow Example

Here's a complete example of testing one section:

### Example: Testing "Basic Transfer"

1. **Prep**
   - Open `docs/VALIDATION_CHECKLIST.md`
   - Find "1. Basic Transfer" section
   - Have 4 checkboxes ready

2. **Test React + web3.js**
   ```
   - Navigate to /docs-validation
   - Click "Test React + web3.js" button
   - Approve in wallet popup
   - Check logs: "✅ Basic Transfer (web3.js) SUCCESS: [signature]"
   - ✅ Mark checkbox in checklist
   ```

3. **Test React + Kit**
   ```
   - Click "Test React + Kit" button
   - Approve in wallet popup
   - Check logs: "✅ Basic Transfer (Kit) SUCCESS: [signature]"
   - ✅ Mark checkbox in checklist
   ```

4. **Test Vanilla TS + web3.js**
   ```
   - Switch to Vanilla sample app
   - Click "Test Basic Transfer (web3.js)" button
   - Check console: "✅ Basic Transfer (Vanilla TS + web3.js) SUCCESS"
   - ✅ Mark checkbox in checklist
   ```

5. **Test Vanilla TS + Kit**
   ```
   - Click "Test Basic Transfer (Kit)" button
   - Check console: "✅ Basic Transfer (Vanilla TS + Kit) SUCCESS"
   - ✅ Mark checkbox in checklist
   ```

6. **Document**
   - All 4 checkboxes checked ✅
   - Move to next section

---

## ⏱️ Time Estimates

### Full Testing (All 36 Examples)
- **Setup:** 15 minutes
- **React Tests:** 45 minutes (18 examples × 2.5 min)
- **Vanilla Tests:** 45 minutes (18 examples × 2.5 min)
- **Documentation:** 15 minutes
- **Total:** ~2 hours

### Critical Path Only (12 Examples)
- Basic Transfer (4 examples)
- SPL Token Transfer (4 examples)
- Priority Fees (4 examples)
- **Total:** ~30-40 minutes

### Spot Check (4 Examples)
- Basic Transfer: React + web3.js
- Basic Transfer: React + Kit
- Basic Transfer: Vanilla + web3.js
- Basic Transfer: Vanilla + Kit
- **Total:** ~10 minutes

---

##  Testing Priorities

Test in this order:

### Priority 1: MUST TEST ⭐
1. **Basic Transfer** - Core functionality
2. **SPL Token Transfer** - Common use case
3. **Priority Fees** - Important for production

### Priority 2: SHOULD TEST 🔸
4. Sign Only
5. With Confirmation
6. Retry Logic

### Priority 3: NICE TO HAVE 🔹
7. Sign Multiple
8. With Options
9. Estimating Fees

---

## 📤 Reporting Issues

When you find issues:

1. **Note in Checklist**
   ```markdown
   - [ ] React + web3.js - SOL transfer
     Issues: TypeError on line 45, missing import
   ```

2. **Take Screenshot**
   - Error message
   - Console output
   - Code snippet

3. **Create GitHub Issue** (if bug in library)
   - Title: "Docs example error: [section name]"
   - Include: error message, expected behavior, actual behavior

4. **Fix Documentation** (if error in docs)
   - Update the `.mdx` file
   - Retest
   - Mark as fixed

---

## ✨ Tips for Efficient Testing

1. **Use Console History**
   - Press ↑ in console to repeat commands
   - Saves typing for retries

2. **Keep Network Tab Open**
   - See RPC calls in real-time
   - Diagnose network issues faster

3. **Test in Batches**
   - Do all React tests first
   - Then all Vanilla tests
   - Fewer context switches

4. **Use Auto-approve** (if your wallet supports it)
   - Speeds up testing
   - Only for devnet!

5. **Take Breaks**
   - Testing 36 examples is tedious
   - Take 5-min break every 30 minutes

---

## 🎬 Next Steps After Testing

### All Tests Pass ✅
- Mark date completed in checklist
- Archive checklist for future reference
- Document any warnings or notes
- Deploy docs with confidence!

### Some Tests Fail ❌
- Document all failures in checklist
- Prioritize critical failures
- Fix issues in documentation
- Retest failed examples only
- Repeat until all pass

### Can't Complete Tests 🤔
- Note which tests couldn't run and why
- Add to "Known Issues" section in docs
- Consider automated testing setup
- Get help from team

---

## 📚 Additional Resources

- **Checklist:** `docs/VALIDATION_CHECKLIST.md`
- **React Test Page:** `apps/sample-react-dapp/src/pages/DocsValidation.tsx`
- **Vanilla Tests:** `apps/sample-dapp/src/docs-validation.ts`
- **Docs Source:** `docs/core-concepts/transactions.mdx`
- **Solana Devnet Faucet:** https://faucet.solana.com/
- **Hermis Docs:** (your deployed docs URL)

---

## 🆘 Getting Help

If stuck:

1. Check this guide's "Common Issues" section
2. Search error message on GitHub Issues
3. Ask in team chat with:
   - Test you were running
   - Error message
   - Screenshot
   - What you've tried

---

**Happy Testing! 🚀**

*Remember: Manual testing might feel tedious, but it's the best way to ensure our documentation is accurate and helps developers succeed.*
