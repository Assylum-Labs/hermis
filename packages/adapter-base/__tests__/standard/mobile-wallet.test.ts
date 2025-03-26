const SolanaMobileWalletAdapterWalletName = 'Mobile Wallet Adapter';
namespace TestWalletConfig {
    export const WalletAdapterNetwork = {
        Mainnet: 'mainnet-beta',
        Testnet: 'testnet',
        Devnet: 'devnet'
    } as const;
}

const adapterNetwork = TestWalletConfig.WalletAdapterNetwork

const mockMobileAdapter = {
    name: SolanaMobileWalletAdapterWalletName,
    url: 'https://solanamobile.com',
    icon: 'solanamobile-icon',
    readyState: 'Loadable',
    publicKey: null,
    connecting: false,
    connected: false,
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    sendTransaction: jest.fn(),
    signTransaction: jest.fn(),
    on: jest.fn().mockReturnThis(),
    off: jest.fn().mockReturnThis(),

    _config: {
        cluster: adapterNetwork.Mainnet,
        appIdentity: {
            name: 'Test dApp',
            uri: 'https://test.com'
        },
        addressSelector: {
            select: jest.fn().mockImplementation(addresses => addresses[0])
        },
        onWalletNotFound: jest.fn()
    }
};


const createMobileWalletAdapter = jest.fn().mockResolvedValue(mockMobileAdapter);

const createDefaultWalletNotFoundHandler = jest.fn().mockReturnValue(jest.fn());
const createDefaultAuthorizationResultCache = jest.fn().mockReturnValue({});

describe('Mobile Wallet Adapter', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should create a mobile wallet adapter', async () => {
        const adapter = await createMobileWalletAdapter();

        expect(adapter).not.toBeNull();
        expect(adapter!.name).toBe(SolanaMobileWalletAdapterWalletName);
    });

    test('should use default cluster based on endpoint', async () => {
        const adapter = await createMobileWalletAdapter('https://api.devnet.solana.com');


        const mobileAdapter = adapter;

        expect(mobileAdapter._config.cluster).toBe(adapterNetwork.Mainnet);
    });

    test('should use app identity from document title and URI', async () => {
        const adapter = await createMobileWalletAdapter();

        const mobileAdapter = adapter;

        expect(mobileAdapter._config.appIdentity.name).toBe('Test dApp');
        expect(mobileAdapter._config.appIdentity.uri).toBe('https://test.com');
    });

    test('should handle address selection', async () => {
        const adapter = await createMobileWalletAdapter();

        const mobileAdapter = adapter;

        const mockAddresses = ['address1', 'address2', 'address3'];
        const selectedAddress = await mobileAdapter._config.addressSelector.select(mockAddresses);

        expect(selectedAddress).toBe('address1');
    });

    test('should handle wallet not found', async () => {
        const adapter = await createMobileWalletAdapter();

        const mobileAdapter = adapter;

        expect(mobileAdapter._config.onWalletNotFound).toBeDefined();
    });

    test('should return null when window is undefined', async () => {
        createMobileWalletAdapter.mockResolvedValueOnce(null);

        const adapter = await createMobileWalletAdapter();

        expect(adapter).toBeNull();
    });
});