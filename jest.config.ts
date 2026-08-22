import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  setupFiles: ['dotenv/config'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  clearMocks: true,
  forceExit: true,
  detectOpenHandles: true,
  globals: {
    'ts-jest': {
      tsconfig: {
        module: 'CommonJS',
        esModuleInterop: true,
      },
    },
  },
};

export default config;
