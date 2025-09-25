# Testing Guide - CopilotFlow v1.0.1

## Overview

CopilotFlow includes a comprehensive testing infrastructure with **73 tests** across 4 test suites,
optimized for cross-platform reliability and production-ready development workflows.

## Test Suites

### 1. Setup Project Wizard (20 tests)

**File**: `tests/unit/setup-project.test.js`

Tests project initialization, configuration, and setup wizard functionality:

- Script loading and syntax validation
- Project detection (empty directories, existing projects, git repos)
- File creation (basic structure, source directories, tests)
- Directory structure creation and validation
- Configuration file generation (package.json, .copilotflow.json)
- Template creation (JavaScript, Python, documentation)
- Error handling (invalid names, permissions, interruptions)
- Validation (name formats, template selection, package.json structure)

### 2. Universal Runner (23 tests)

**File**: `tests/unit/universal-runner.test.js`

Tests cross-language command execution and project management:

- Language detection (JavaScript, Python, PowerShell, mixed projects)
- Command execution (lint, format, help display)
- Edge cases (unknown languages, missing configs, no indicators)
- Error handling (missing files, corrupted configs, permission errors)
- State preservation (file integrity, structure consistency)
- Integration points (npm scripts, git repos, CI/CD environments)

### 3. Cleanup Project System (17 tests)

**File**: `tests/unit/cleanup-project.test.js`

Tests backup, restore, and project maintenance functionality:

- Backup creation with valid project structures
- Backup listing and metadata management
- Restore operations from backups
- Edge cases (empty projects, missing directories, large files)
- Error handling (missing backups, corrupted metadata, disk space)
- State consistency (metadata integrity, permissions, timestamps)
- Integration (git repositories, environment variables, VS Code workspace)

### 4. AI Automation Scripts (13 tests)

**File**: `tests/unit/ai-automation.test.js`

Tests AI workflow validation and integration:

- Script loading (generate-docs, analyze-code, daily-workflow, generate-commit)
- Environment configuration (AI provider setup, missing variables)
- Project structure handling (JavaScript projects, source files, docs)
- Git integration and repository interaction
- File operations (readonly handling, source file preservation)

## Running Tests

### Basic Commands

```bash
# Run all test suites
npm test

# Run with verbose output
npm test -- --verbose

# Run specific test suite
npm test -- tests/unit/setup-project.test.js

# Run tests matching pattern
npm test -- --testNamePattern="should create"

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Advanced Options

```bash
# Run with specific timeout
npm test -- --testTimeout=60000

# Run with detective open handles (debugging)
npm test -- --detectOpenHandles

# Run without cache
npm test -- --no-cache

# Run tests serially (default behavior)
npm test -- --maxWorkers=1
```

## Jest Configuration

### Production Configuration (`jest.config.js`)

```javascript
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js', '**/tests/**/*.spec.js'],

  // Coverage requirements
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // Setup and utilities
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // Module path mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@scripts/(.*)$': '<rootDir>/scripts/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
  },

  // Execution configuration
  testTimeout: 30000,
  maxWorkers: 1, // Serial execution for reliability
  forceExit: false, // Clean Jest exit
  detectOpenHandles: true, // Async operation detection
  verbose: true, // Detailed output
  clearMocks: true, // Clean state between tests
  restoreMocks: true, // Restore mocks after tests
};
```

### Key Configuration Choices

#### `maxWorkers: 1` - Serial Execution

- **Purpose**: Prevents file system conflicts, especially on Windows
- **Benefit**: Eliminates race conditions in file operations
- **Trade-off**: Longer execution time (~45-50s) for stability

#### `detectOpenHandles: true` - Async Detection

- **Purpose**: Identifies open async operations preventing clean exit
- **Benefit**: Eliminates "Force exiting Jest" warnings
- **Result**: Clean Jest termination without forced exit

#### `forceExit: false` - Clean Exit

- **Purpose**: Allows Jest to exit naturally after cleanup
- **Benefit**: Proper resource cleanup and graceful shutdown
- **Requirement**: All async operations must be properly closed

## Test Setup and Utilities

### Global Test Setup (`tests/setup.js`)

Provides shared utilities and configuration for all tests:

```javascript
// Global timeout
jest.setTimeout(30000);

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.AI_PROVIDER = 'OpenAI';
process.env.OPENAI_API_KEY = 'test-api-key';

// Global test utilities
global.testUtils = {
  createTempDir, // Create temporary directories
  cleanupTempDir, // Basic cleanup
  cleanupTempDirWithRetry, // Advanced Windows-compatible cleanup
  createTestFile, // Create test files with content
  mockConsole, // Console method mocking
};
```

### Advanced Cleanup Logic

#### `cleanupTempDirWithRetry()` Function

Handles Windows file lock issues with sophisticated retry logic:

```javascript
async cleanupTempDirWithRetry(dirPath, maxRetries = 5) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Force garbage collection to release file handles
      if (global.gc) {
        global.gc();
      }

      // Progressive wait times: 50ms, 100ms, 150ms, 200ms, 250ms
      await new Promise(resolve => setTimeout(resolve, 50 * (i + 1)));

      await fs.remove(dirPath);
      return; // Success
    } catch (error) {
      if (i === maxRetries - 1) {
        // Non-blocking warning instead of test failure
        console.warn(`⚠️  Cleanup warning: ${error.message.split(',')[0]}`);
        return;
      } else {
        // Progressive retry delays: 200ms, 400ms, 600ms, 800ms
        await new Promise(resolve => setTimeout(resolve, 200 * (i + 1)));
      }
    }
  }
}
```

#### Features:

- **Progressive Delays**: Increasing wait times between attempts
- **Garbage Collection**: Optional memory cleanup to release handles
- **Non-Blocking Failures**: Warnings instead of test failures
- **Windows Optimization**: Designed for Windows file system behavior

## Cross-Platform Compatibility

### Windows-Specific Optimizations

- **File Lock Handling**: Retry logic for EBUSY errors
- **Serial Execution**: Prevents concurrent file access conflicts
- **Progressive Timeouts**: Allows OS time to release file handles
- **Non-Blocking Cleanup**: Tests don't fail due to Windows file locks

### macOS/Linux Considerations

- **Fast Execution**: Typically complete cleanup in first attempt
- **Standard File Operations**: No special handling required
- **Consistent Behavior**: Same test logic across all platforms

### Universal Features

- **Path Handling**: Cross-platform path resolution
- **Environment Variables**: Platform-agnostic configuration
- **Command Execution**: Shell-appropriate command generation

## Coverage Reports

### Coverage Thresholds

All coverage metrics must meet 70% minimum:

- **Branches**: 70% (conditional logic coverage)
- **Functions**: 70% (function execution coverage)
- **Lines**: 70% (line execution coverage)
- **Statements**: 70% (statement execution coverage)

### Generating Coverage

```bash
# Generate HTML coverage report
npm run test:coverage

# View coverage in browser
# Open coverage/lcov-report/index.html
```

### Coverage Exclusions

```javascript
collectCoverageFrom: [
  'scripts/**/*.js',
  '!scripts/**/node_modules/**',
  '!**/coverage/**',
  '!**/dist/**',
];
```

## Debugging Tests

### Common Issues and Solutions

#### Jest Hangs or Doesn't Exit

```bash
# Enable open handle detection
npm test -- --detectOpenHandles

# Force exit if needed (not recommended)
npm test -- --forceExit
```

#### File Lock Errors on Windows

```bash
# Check for processes holding files
lsof /path/to/file  # macOS/Linux
handle /path/to/file # Windows

# Increase cleanup retries in tests/setup.js
cleanupTempDirWithRetry(dirPath, 10) // Increase from 5 to 10
```

#### Timeout Issues

```bash
# Increase timeout for specific tests
npm test -- --testTimeout=60000

# Or modify individual test timeouts
test('long running test', async () => {
  // test code
}, 60000); // 60 second timeout
```

### Debug Mode

```bash
# Run with Node.js debugging
node --inspect-brk node_modules/.bin/jest --runInBand

# Run with verbose output
npm test -- --verbose --no-coverage
```

## Performance Metrics

### Execution Times (v1.0.1)

- **Total Runtime**: ~45-50 seconds
- **Setup Project Tests**: ~13-14 seconds
- **Universal Runner Tests**: ~14-15 seconds
- **Cleanup Project Tests**: ~16-17 seconds
- **AI Automation Tests**: ~4-5 seconds

### Memory Usage

- **Peak Memory**: ~150-200MB during test execution
- **File Handle Management**: Proper cleanup prevents leaks
- **Garbage Collection**: Optional GC calls in cleanup

### Optimization Strategies

- **Serial Execution**: Prevents resource conflicts
- **Cleanup Retries**: Handles Windows file locks gracefully
- **Mock Optimization**: Proper mock cleanup between tests
- **Timeout Management**: Generous timeouts prevent false failures

## Best Practices

### Writing New Tests

1. **Use testUtils**: Leverage global utilities for consistency
2. **Cleanup Resources**: Always clean up temporary files/directories
3. **Mock External Dependencies**: Avoid real API calls or file system operations
4. **Test Error Conditions**: Include both happy path and error scenarios
5. **Descriptive Names**: Use clear, descriptive test and describe block names

### Test Organization

```javascript
describe('Component Name', () => {
  describe('Happy Path Testing', () => {
    test('should handle normal operations', () => {});
  });

  describe('Edge Cases', () => {
    test('should handle empty input', () => {});
  });

  describe('Error Handling', () => {
    test('should handle invalid input gracefully', () => {});
  });
});
```

### Cleanup Patterns

```javascript
describe('File Operations', () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = await testUtils.createTempDir();
  });

  afterEach(async () => {
    await testUtils.cleanupTempDirWithRetry(tempDir);
  });

  test('should create files', async () => {
    // test implementation
  });
});
```

## Troubleshooting

### Common Error Messages

#### "Force exiting Jest"

**Solution**: Enable `detectOpenHandles: true` in jest.config.js

#### "EBUSY: resource busy or locked"

**Solution**: Use `cleanupTempDirWithRetry()` instead of direct `fs.remove()`

#### "Cannot find module"

**Solution**: Check `moduleNameMapper` configuration in jest.config.js

#### "Timeout" errors

**Solution**: Increase `testTimeout` or add timeout to specific tests

### Getting Help

1. Check the [Contributing Guide](../CONTRIBUTING.md)
2. Review [Developer Guide](DEVELOPER_GUIDE.md)
3. Run tests with `--verbose` flag for detailed output
4. Enable `--detectOpenHandles` for async debugging

## Changelog

### v1.0.1 Testing Improvements

- Enhanced Windows file lock handling
- Implemented `detectOpenHandles` for clean Jest exit
- Added retry logic with progressive delays
- Improved error handling with non-blocking warnings
- Optimized cross-platform compatibility
- Added comprehensive test documentation

### v1.0.0 Initial Testing Framework

- Complete Jest testing infrastructure
- 73 comprehensive tests across 4 test suites
- Cross-platform test execution
- Coverage requirements and reporting
- Mock utilities and test helpers
