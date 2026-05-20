/**
 * Solana Off-Chain Message domain separator.
 *
 * Without a domain separator, raw `signMessage` output is structurally
 * indistinguishable from a transaction signature — a caller can be tricked
 * into producing a valid transaction signature by handing the signer bytes
 * that happen to encode a Solana transaction message.
 *
 * Wallet adapters that implement Standard Wallet / wallet-adapter-base
 * (Phantom, Backpack, Solflare, …) apply this prefix themselves. The in-SDK
 * local-key signers (Keypair / CryptoKeyPair / KeyPairSigner) do not, so we
 * wrap their inputs here.
 *
 * Layout (per Solana off-chain message spec):
 *   signing_domain: 0xff "solana offchain"   (16 bytes)
 *   header_version: u8                         (currently 0)
 *   format:         u8                         (1 = UTF-8)
 *   length:         u16 little-endian
 *   message:        variable
 *
 * The leading 0xff guarantees the buffer cannot be parsed as a Solana
 * transaction (a real transaction's first byte is the number of required
 * signatures, always < 0x80).
 *
 * @see https://github.com/solana-foundation/solana-improvement-documents/pull/48
 */
const SIGNING_DOMAIN = new Uint8Array([
  0xff,
  0x73, 0x6f, 0x6c, 0x61, 0x6e, 0x61, 0x20, // "solana "
  0x6f, 0x66, 0x66, 0x63, 0x68, 0x61, 0x69, 0x6e, // "offchain"
]);

const HEADER_VERSION = 0;
const FORMAT_UTF8 = 1;
const HEADER_SIZE = SIGNING_DOMAIN.length + 1 + 1 + 2; // domain + version + format + len

/**
 * Wrap raw message bytes with the Solana off-chain message header so the
 * resulting signature cannot be re-interpreted as a transaction signature.
 *
 * Verifiers must apply the same wrapping before checking the signature.
 */
export function withOffchainMessagePrefix(messageBytes: Uint8Array): Uint8Array {
  if (messageBytes.length > 0xffff) {
    throw new Error(
      `Off-chain message too large: ${messageBytes.length} bytes (max ${0xffff})`,
    );
  }

  const out = new Uint8Array(HEADER_SIZE + messageBytes.length);
  out.set(SIGNING_DOMAIN, 0);
  out[SIGNING_DOMAIN.length] = HEADER_VERSION;
  out[SIGNING_DOMAIN.length + 1] = FORMAT_UTF8;
  // length, little-endian u16
  out[SIGNING_DOMAIN.length + 2] = messageBytes.length & 0xff;
  out[SIGNING_DOMAIN.length + 3] = (messageBytes.length >> 8) & 0xff;
  out.set(messageBytes, HEADER_SIZE);
  return out;
}
