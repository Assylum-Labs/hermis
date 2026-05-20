import { withOffchainMessagePrefix } from '../../src/transaction/offchain-message';

describe('withOffchainMessagePrefix', () => {
  it('prepends the 0xff "solana offchain" domain separator', () => {
    const out = withOffchainMessagePrefix(new Uint8Array([0xaa, 0xbb]));

    // 0xff || "solana offchain" || version(0) || format(1) || len(2 LE) || body
    expect(Array.from(out.slice(0, 16))).toEqual([
      0xff,
      0x73, 0x6f, 0x6c, 0x61, 0x6e, 0x61, 0x20, // "solana "
      0x6f, 0x66, 0x66, 0x63, 0x68, 0x61, 0x69, 0x6e, // "offchain"
    ]);
    expect(out[16]).toBe(0); // header version
    expect(out[17]).toBe(1); // format: UTF-8
    expect(out[18]).toBe(2); // len LE low byte
    expect(out[19]).toBe(0); // len LE high byte
    expect(Array.from(out.slice(20))).toEqual([0xaa, 0xbb]);
  });

  it('produces bytes that cannot be confused with a Solana transaction', () => {
    // Real Solana transactions start with a "number of required signatures"
    // byte that's typically 1-8 and always less than 0x80.
    const out = withOffchainMessagePrefix(new Uint8Array([1, 2, 3]));
    expect(out[0]).toBe(0xff);
  });

  it('encodes message length as little-endian u16', () => {
    const out = withOffchainMessagePrefix(new Uint8Array(0x0102));
    expect(out[18]).toBe(0x02);
    expect(out[19]).toBe(0x01);
  });

  it('rejects messages longer than u16 max', () => {
    expect(() => withOffchainMessagePrefix(new Uint8Array(0x10000))).toThrow(
      /too large/i,
    );
  });
});
