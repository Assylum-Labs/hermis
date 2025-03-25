// Mock console.error to avoid noisy logs during tests
beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  
  afterAll(() => {
    console.error.mockRestore();
    console.warn.mockRestore();
  });