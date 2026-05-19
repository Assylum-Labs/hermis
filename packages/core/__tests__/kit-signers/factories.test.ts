import bs58 from 'bs58';
import { createTransactionSendingSignerFromWallet } from '../../src/kit-signers/factories';
import type { Address } from '@solana/kit';

describe('createTransactionSendingSignerFromWallet', () => {
  const walletAddress = 'DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1' as Address<string>;
  const chain = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp' as const;

  it('returns 64-byte Ed25519 signature bytes (not UTF-8 of the base58 string)', async () => {
    const knownSignatureBytes = new Uint8Array(64);
    for (let i = 0; i < 64; i++) knownSignatureBytes[i] = i;
    const knownSignatureBase58 = bs58.encode(knownSignatureBytes);

    const signer = createTransactionSendingSignerFromWallet(
      walletAddress,
      chain,
      async () => knownSignatureBase58,
    );

    const [signatureBytes] = await signer.signAndSendTransactions([{}]);

    expect(signatureBytes.length).toBe(64);
    expect(Array.from(signatureBytes)).toEqual(Array.from(knownSignatureBytes));
  });

  it('rejects when more than one transaction is passed', async () => {
    const signer = createTransactionSendingSignerFromWallet(
      walletAddress,
      chain,
      async () => bs58.encode(new Uint8Array(64)),
    );

    await expect(signer.signAndSendTransactions([{}, {}])).rejects.toThrow();
  });
});
