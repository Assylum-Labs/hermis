const LAMPORTS_PER_SOL = 1000000000;

enum WalletAdapterNetwork {
    Mainnet = 'mainnet-beta',
    Testnet = 'testnet',
    Devnet = 'devnet'
}

class PublicKey {
    constructor(private value: string) { }

    toString() {
        return this.value;
    }

    equals(other: PublicKey) {
        return this.value === other.value;
    }
}

class Connection {
    constructor(endpoint: string, config?: any) { }

    async getBalance() {
        return 2.5 * LAMPORTS_PER_SOL;
    }
}

interface Adapter {
    name: string;
    publicKey: PublicKey | null;
    connected: boolean;
    connect: jest.Mock;
    disconnect: jest.Mock;
}

class WalletManager {
    private wallet: Adapter | null = null;
    private connection: Connection;

    constructor(private network: WalletAdapterNetwork = WalletAdapterNetwork.Mainnet) {
        this.connection = new Connection(`https://api.${network}.solana.com`);
    }

    async connect(wallet: Adapter): Promise<boolean> {
        try {
            this.wallet = wallet;

            if (!wallet.connected) {
                await wallet.connect();
            }

            return wallet.connected;
        } catch (error) {
            console.error('Failed to connect wallet:', error);
            this.wallet = null;
            return false;
        }
    }

    async getBalance(): Promise<number> {
        if (!this.wallet || !this.wallet.publicKey) {
            throw new Error('Wallet not connected');
        }

        try {
            const balance = await this.connection.getBalance();
            return balance / LAMPORTS_PER_SOL;
        } catch (error) {
            console.error('Failed to get balance:', error);
            throw error;
        }
    }

    getPublicKey(): PublicKey {
        if (!this.wallet || !this.wallet.publicKey) {
            throw new Error('Wallet not connected');
        }

        return this.wallet.publicKey;
    }
}

describe('WalletManager', () => {
    let manager: WalletManager;
    let mockAdapter: Adapter;

    beforeEach(() => {
        mockAdapter = {
            name: 'MockWallet',
            publicKey: new PublicKey('mockPublicKey'),
            connected: false,
            connect: jest.fn().mockImplementation(() => {
                mockAdapter.connected = true;
                return Promise.resolve(true);
            }),
            disconnect: jest.fn().mockResolvedValue(undefined),
        };

        manager = new WalletManager();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('connect', () => {
        test('should connect to a wallet adapter', async () => {
            const result = await manager.connect(mockAdapter);

            expect(mockAdapter.connect).toHaveBeenCalled();
            expect(result).toBe(true);
        });

        test('should not reconnect if already connected', async () => {
            mockAdapter.connected = true;

            const result = await manager.connect(mockAdapter);

            expect(mockAdapter.connect).not.toHaveBeenCalled();
            expect(result).toBe(true);
        });

        test('should handle connection errors', async () => {
            mockAdapter.connect.mockRejectedValue(new Error('Connection failed'));

            const result = await manager.connect(mockAdapter);

            expect(result).toBe(false);
        });
    });

    describe('getBalance', () => {
        test('should get the wallet balance in SOL', async () => {
            await manager.connect(mockAdapter);

            const balance = await manager.getBalance();

            expect(balance).toBe(2.5);
        });

        test('should throw error if wallet not connected', async () => {
            await expect(manager.getBalance()).rejects.toThrow('Wallet not connected');
        });
    });

    describe('getPublicKey', () => {
        test('should return the wallet public key', async () => {
            await manager.connect(mockAdapter);

            const publicKey = manager.getPublicKey();

            expect(publicKey.toString()).toBe('mockPublicKey');
        });

        test('should throw error if wallet not connected', () => {
            expect(() => manager.getPublicKey()).toThrow('Wallet not connected');
        });
    });
});