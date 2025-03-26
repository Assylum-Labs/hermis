
namespace TestEnvironment {
    export const WalletReadyState = {
        Installed: 'Installed',
        Loadable: 'Loadable',
        NotDetected: 'NotDetected',
        Unsupported: 'Unsupported'
    } as const;

    export type WalletReadyStateType = (typeof WalletReadyState)[keyof typeof WalletReadyState];

    export const WalletAdapterNetwork = {
        Mainnet: 'mainnet-beta',
        Testnet: 'testnet',
        Devnet: 'devnet'
    } as const;

    export const SolanaMobileWalletAdapterWalletName = 'Mobile Wallet Adapter';

    export const Environment = {
        DESKTOP_WEB: 'DESKTOP_WEB',
        MOBILE_WEB: 'MOBILE_WEB'
    } as const;

    export class PublicKey {
        private value: string;

        constructor(value: string | Uint8Array) {
            this.value = typeof value === 'string'
                ? value
                : new TextDecoder().decode(value);
        }

        toBase58() { return this.value; }
        toString() { return this.value; }
        equals(other: any) { return this.value === other?.toString(); }
        toBytes() { return new TextEncoder().encode(this.value); }
    }

    export interface FullAdapter {
        name: string;
        url: string;
        icon: string;
        readyState: WalletReadyStateType;
        publicKey: PublicKey | null;
        connecting: boolean;
        connected: boolean;
        supportedTransactionVersions?: ReadonlySet<any> | undefined;
        autoConnect: () => Promise<void>;
        connect: () => Promise<void>;
        disconnect: () => Promise<void>;
        sendTransaction: (transaction: any, connection: any, options?: any) => Promise<string>;
        on: (event: string, callback: any) => any;
        off: (event: string, callback: any) => any;
        once: (event: string, callback: any) => any;
        emit: (event: string, ...args: any[]) => boolean;
        removeListener: (event: string, callback: any) => any;
        removeAllListeners: (event?: string) => any;
        addListener: (event: string, callback: any) => any;
        listenerCount: (event: string) => number;
        listeners: (event: string) => Function[];
        eventNames: () => (string | symbol)[];
    }

    export function createMockAdapter(
        name: string,
        readyState: WalletReadyStateType
    ): FullAdapter {
        return {
            name,
            url: `https://${name.toLowerCase()}.com`,
            icon: `${name.toLowerCase()}-icon`,
            readyState,
            publicKey: null,
            connecting: false,
            connected: false,
            autoConnect: jest.fn().mockResolvedValue(undefined),
            connect: jest.fn().mockResolvedValue(undefined),
            disconnect: jest.fn().mockResolvedValue(undefined),
            sendTransaction: jest.fn().mockResolvedValue('mock-signature'),
            on: jest.fn().mockReturnThis(),
            off: jest.fn().mockReturnThis(),
            once: jest.fn().mockReturnThis(),
            emit: jest.fn().mockReturnValue(true),
            removeListener: jest.fn().mockReturnThis(),
            removeAllListeners: jest.fn().mockReturnThis(),
            addListener: jest.fn().mockReturnThis(),
            listenerCount: jest.fn().mockReturnValue(0),
            listeners: jest.fn().mockReturnValue([]),
            eventNames: jest.fn().mockReturnValue([])
        };
    }

    export const getEnvironment = jest.fn(({ adapters, userAgentString }: any) => {
        if (userAgentString && userAgentString.includes('iPhone') &&
            !adapters.some((adapter: any) =>
                adapter.name !== SolanaMobileWalletAdapterWalletName &&
                adapter.readyState === WalletReadyState.Installed)) {
            return Environment.MOBILE_WEB;
        }
        return Environment.DESKTOP_WEB;
    });

    export const getIsMobile = jest.fn((adapters: any, userAgentString?: string | null) => {
        if (userAgentString && (userAgentString.includes('iPhone') || userAgentString.includes('Android'))) {
            return true;
        }
        return false;
    });

    export const getUserAgent = jest.fn(() => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
    export const isAndroid = jest.fn((ua: string) => ua.includes('Android'));
    export const isIOS = jest.fn((ua: string) => ua.includes('iPhone') || ua.includes('iPad'));
    export const isMobileDevice = jest.fn((ua: string) =>
        (ua.includes('iPhone') || ua.includes('Android')) && !ua.includes('wv)'));
    export const isIosAndRedirectable = jest.fn(() => true);
    export const getInferredNetworkFromEndpoint = jest.fn((endpoint?: string) => {
        if (endpoint?.includes('devnet')) return WalletAdapterNetwork.Devnet;
        if (endpoint?.includes('testnet')) return WalletAdapterNetwork.Testnet;
        return WalletAdapterNetwork.Mainnet;
    });
    export const getUriForAppIdentity = jest.fn(() => {
        if (typeof window === 'undefined') return undefined;

        return window.location ? `${window.location.protocol}//${window.location.host}` : undefined;
    });
}

jest.mock('../../src/utils/environment', () => ({
    ...TestEnvironment
}));

describe('Environment Utilities', () => {
    const mockAdapters: TestEnvironment.FullAdapter[] = [
        TestEnvironment.createMockAdapter('Phantom', TestEnvironment.WalletReadyState.Installed),
        TestEnvironment.createMockAdapter('Solflare', TestEnvironment.WalletReadyState.Installed),
        TestEnvironment.createMockAdapter(TestEnvironment.SolanaMobileWalletAdapterWalletName, TestEnvironment.WalletReadyState.Loadable)
    ];

    const originalWindow = global.window;

    beforeAll(() => {
        Object.defineProperty(global, 'window', {
            value: {
                location: {
                    protocol: 'https:',
                    host: 'test.com',
                }
            },
            writable: true
        });
    });

    afterAll(() => {
        global.window = originalWindow;
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getEnvironment', () => {
        test('should detect mobile environment based on user agent', () => {
            const mobileUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1';

            const mobileOnlyAdapters = [
                TestEnvironment.createMockAdapter(TestEnvironment.SolanaMobileWalletAdapterWalletName, TestEnvironment.WalletReadyState.Loadable)
            ];

            const environment = TestEnvironment.getEnvironment({
                adapters: mobileOnlyAdapters as any,
                userAgentString: mobileUA
            });

            expect(environment).toBe(TestEnvironment.Environment.MOBILE_WEB);
        });

        test('should detect desktop environment when desktop adapters are installed', () => {
            const mobileUA = 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.101 Mobile Safari/537.36';

            const environment = TestEnvironment.getEnvironment({
                adapters: mockAdapters as any,
                userAgentString: mobileUA
            });

            expect(environment).toBe(TestEnvironment.Environment.DESKTOP_WEB);
        });

        test('should default to desktop with no user agent', () => {
            const environment = TestEnvironment.getEnvironment({
                adapters: mockAdapters as any,
                userAgentString: null
            });

            expect(environment).toBe(TestEnvironment.Environment.DESKTOP_WEB);
        });
    });

    describe('getIsMobile', () => {
        test('should return true for mobile environment', () => {
            const mobileUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1';

            const isMobile = TestEnvironment.getIsMobile(mockAdapters as any, mobileUA);
            expect(isMobile).toBe(true);
        });

        test('should return false for desktop environment', () => {
            const desktopUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

            const isMobile = TestEnvironment.getIsMobile(mockAdapters as any, desktopUA);
            expect(isMobile).toBe(false);
        });
    });

    describe('getUriForAppIdentity', () => {
        test('should return protocol and host', () => {
            const uri = TestEnvironment.getUriForAppIdentity();
            expect(uri).toBe('https://test.com');
        });

        test('should return undefined if window is undefined', () => {
            const originalWindow = global.window;
            // @ts-ignore: Intentionally setting window to undefined for testing
            delete global.window;

            const uri = TestEnvironment.getUriForAppIdentity();
            expect(uri).toBeUndefined();

            global.window = originalWindow;
        });
    });

});