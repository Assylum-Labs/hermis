class Transaction {
    constructor() {
      this.feePayer = null;
      this.recentBlockhash = null;
    }
    
    sign() {}
    
    serialize() {
      return new Uint8Array([1, 2, 3, 4]);
    }
    
    static from(buffer) {
      return new Transaction();
    }
  }
  
  class VersionedTransaction {
    constructor() {}
    
    serialize() {
      return new Uint8Array([1, 2, 3, 4]);
    }
    
    static deserialize(buffer) {
      return new VersionedTransaction();
    }
  }
  
  module.exports = {
    Connection: jest.fn().mockImplementation(() => ({
      getLatestBlockhash: jest.fn().mockResolvedValue({ blockhash: 'mockedBlockhash' }),
      getBalance: jest.fn().mockResolvedValue(1000000000)
    })),
    PublicKey: jest.fn().mockImplementation((key) => ({
      toString: () => key,
      toBase58: () => key,
      equals: (other) => key === other?.toString(),
      toBytes: () => new Uint8Array([1, 2, 3, 4])
    })),
    Transaction,
    VersionedTransaction,
    LAMPORTS_PER_SOL: 1000000000,
    sendAndConfirmTransaction: jest.fn().mockResolvedValue('mocked-signature')
  };