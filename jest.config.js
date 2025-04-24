const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    // Handle module aliases (if you're using them in your project)
    '^@/(.*)$': '<rootDir>/$1',
    // Mock packages to prevent dynamic import issues
    '@heroui/ripple': '<rootDir>/__mocks__/heroui-ripple.js',
    '@heroui/react/outline': '<rootDir>/__mocks__/heroui-react-outline.js',
  },
  testMatch: [
    "**/__tests__/**/*.ts?(x)",
    "**/?(*.)+(spec|test).ts?(x)"
  ],
  // Configure to handle both ESM and CJS
  transform: {
    '^.+\\.(ts|tsx)$': ['babel-jest']
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(@heroui|next)/)"
  ],
  globals: {
    'ts-jest': {
      isolatedModules: true
    }
  },
  // Ensure Jest can find the mocks directory
  moduleDirectories: ['node_modules', '<rootDir>'],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);