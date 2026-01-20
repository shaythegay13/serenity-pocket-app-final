/**
 * Jest test setup file
 */

// Mock console methods in tests to avoid noise
global.console = {
  ...console,
  // Uncomment to suppress console.log in tests
  // log: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Mock environment variables for testing
process.env.EMAIL_USER = 'test@example.com';
process.env.EMAIL_PASS = 'test-password';
process.env.ALERT_EMAIL = 'alerts@example.com';
process.env.THEODDS_WARNING_PCT = '25';
process.env.RAPIDAPI_WARNING_PCT = '75';
process.env.THEODDS_TOTAL = '20000';
process.env.RAPIDAPI_TOTAL = '150';
process.env.THEODDS_UPGRADE_MRR = '250';
process.env.RAPIDAPI_UPGRADE_MRR = '75';
process.env.PLATFORM_MARGIN = '0.8';
