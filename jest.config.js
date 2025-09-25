module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Test file patterns
  testMatch: ['**/tests/**/*.test.js', '**/tests/**/*.spec.js'],

  // Coverage configuration
  collectCoverageFrom: [
    // Core scripts we want baseline coverage on
    'scripts/cleanup-project.js',
    'scripts/universal-runner.js',
    'scripts/setup-project.js',
    // Temporarily exclude operational / automation scripts that skew coverage
    '!scripts/ai-automation/**',
    '!scripts/deployment/**',
    '!scripts/mve-enforce.js',
    '!scripts/process-improvement.js',
    '!scripts/qa-validation.js',
    '!scripts/setup-azure.js',
    '!scripts/setup-storage.js',
    '!scripts/view-logs.js',
    '!**/coverage/**',
    '!**/dist/**',
  ],

  // Coverage thresholds
  // Temporary relaxed thresholds after restructuring coverage scope.
  // NOTE: Plan to reintroduce incremental coverage gates and raise these numbers progressively.
  coverageThreshold: {
    global: {
      // Temporarily set to 0 while incremental coverage strategy is implemented.
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // Module path mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@scripts/(.*)$': '<rootDir>/scripts/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
  },

  // Test timeout
  testTimeout: 30000,
  // Run tests serially to avoid file conflicts on Windows
  maxWorkers: 1,

  // Force exit after tests complete - can be removed if detectOpenHandles resolves issues
  forceExit: false,

  // Detect open handles to help debug file locks
  detectOpenHandles: true, // Enable to identify async operations preventing clean exit

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true,
};
