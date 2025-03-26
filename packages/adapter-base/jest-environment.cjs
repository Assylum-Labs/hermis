const NodeEnvironment = require('jest-environment-node').default;
const { JSDOM } = require('jsdom');

/**
 * A custom environment that provides both Node features and browser globals
 */
class CustomEnvironment extends NodeEnvironment {
  constructor(config) {
    super(config);
    this.dom = null; // Store the dom instance
  }

  async setup() {
    await super.setup();
    
    // Set up a minimal browser-like environment
    this.dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost/',
      pretendToBeVisual: true,
      runScripts: 'dangerously',
    });

    // Create a simple mock function implementation
    const createMockFn = () => {
      const mockFn = function() { return mockFn.returnValue; };
      mockFn.returnValue = undefined;
      mockFn.calls = [];
      mockFn.mockReturnValue = function(value) { 
        this.returnValue = value; 
        return this; 
      };
      mockFn.mockImplementation = function(fn) {
        this.implementation = fn;
        return this;
      };
      return mockFn;
    };

    // Add DOM globals to the Node environment
    this.global.window = this.dom.window;
    this.global.document = this.dom.window.document;
    this.global.navigator = this.dom.window.navigator;
    this.global.location = this.dom.window.location;
    this.global.HTMLElement = this.dom.window.HTMLElement;
    
    // Use our simple mock functions instead of jest.fn()
    this.global.localStorage = {
      getItem: createMockFn().mockReturnValue(null),
      setItem: createMockFn(),
      removeItem: createMockFn(),
      clear: createMockFn(),
    };
    
    // Fix for TextEncoder/TextDecoder
    this.global.TextEncoder = TextEncoder;
    this.global.TextDecoder = TextDecoder;
    
    // Add browser globals
    this.global.btoa = (data) => Buffer.from(data).toString('base64');
    this.global.atob = (data) => Buffer.from(data, 'base64').toString();
  }

  async teardown() {
    // Use the JSDOM's method to close instead of window.close()
    if (this.dom) {
      this.dom.window.document.defaultView.close();
    }
    
    this.dom = null;
    this.global.window = null;
    this.global.document = null;
    this.global.navigator = null;
    
    await super.teardown();
  }
}

module.exports = CustomEnvironment;