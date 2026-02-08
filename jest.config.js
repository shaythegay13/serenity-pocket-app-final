/** @type {import('jest').Config} */
module.exports = {
  // Use different test environments based on file patterns
  projects: [
    // Node environment for API and service tests
    {
      displayName: 'node',
      testEnvironment: 'node',
      preset: 'ts-jest',
      roots: ['<rootDir>/test'],
      testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
      transform: {
        '^.+\\.ts$': 'ts-jest',
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
      },
      setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
      testTimeout: 10000,
    },
    // jsdom environment for React component tests
    {
      displayName: 'react',
      testEnvironment: 'jsdom',
      preset: 'ts-jest',
      roots: ['<rootDir>/test'],
      testMatch: ['**/__tests__/**/*.tsx', '**/?(*.)+(spec|test).tsx'],
      transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        // Mock CSS modules
        '\\.css$': 'identity-obj-proxy',
      },
      setupFilesAfterEnv: [
        '<rootDir>/test/setup.ts',
        '<rootDir>/test/setup-react.ts',
      ],
      testTimeout: 10000,
    },
  ],
  collectCoverageFrom: [
    'lib/**/*.ts',
    'app/api/**/*.ts',
    'components/**/*.tsx',
    '!**/*.d.ts',
  ],
};
