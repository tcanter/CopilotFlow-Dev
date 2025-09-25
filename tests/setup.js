/**
 * Jest Test Setup
 * Global test configuration and utilities
 */

const fs = require('fs-extra');
const path = require('path');

// Global test timeout
jest.setTimeout(30000);

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.AI_PROVIDER = 'OpenAI';
process.env.OPENAI_API_KEY = 'test-api-key';
process.env.PROJECT_NAME = 'test-project';

// Create global test utilities
global.testUtils = {
  // Create temporary test directory
  createTempDir: async (name = 'test-temp') => {
    const tempDir = path.join(__dirname, 'temp', name);
    await fs.ensureDir(tempDir);
    return tempDir;
  },

  // Clean up temporary test directory
  cleanupTempDir: async dirPath => {
    if (await fs.pathExists(dirPath)) {
      await fs.remove(dirPath);
    }
  },

  // Clean up temporary test directory with retry for Windows file locks
  cleanupTempDirWithRetry: async (dirPath, maxRetries = 5) => {
    if (!(await fs.pathExists(dirPath))) {
      return;
    }

    for (let i = 0; i < maxRetries; i++) {
      try {
        // Force garbage collection to release file handles
        if (global.gc) {
          global.gc();
        }

        // Wait a bit for file handles to be released
        await new Promise(resolve => setTimeout(resolve, 50 * (i + 1)));

        await fs.remove(dirPath);
        return;
      } catch (error) {
        if (i === maxRetries - 1) {
          // Don't fail the test, just warn - this is a Windows file lock issue
          console.warn(
            `⚠️  Cleanup warning: Could not remove temp directory after ${maxRetries} attempts: ${error.message.split(',')[0]}`
          );
          return; // Don't throw, just return
        } else {
          // Wait progressively longer between retries
          await new Promise(resolve => setTimeout(resolve, 200 * (i + 1)));
        }
      }
    }
  },

  // Create test files
  createTestFile: async (filePath, content = '') => {
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, content);
    return filePath;
  },

  // Mock console methods
  mockConsole: () => {
    const originalConsole = { ...console };
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
    console.info = jest.fn();

    return {
      restore: () => {
        Object.assign(console, originalConsole);
      },
      getLogs: () => console.log.mock.calls,
      getErrors: () => console.error.mock.calls,
      getWarnings: () => console.warn.mock.calls,
    };
  },
};

// Global cleanup after all tests
afterAll(async () => {
  // Clean up any remaining temp directories
  const tempDir = path.join(__dirname, 'temp');
  if (await fs.pathExists(tempDir)) {
    await fs.remove(tempDir);
  }
});
