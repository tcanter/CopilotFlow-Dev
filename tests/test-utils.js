/**
 * Test utilities for CopilotFlow project tests
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');

/**
 * Create a temporary directory for testing
 * @param {string} prefix - Prefix for the temp directory name
 * @returns {Promise<string>} - Path to the created temp directory
 */
async function createTempDir(prefix = 'copilot-test') {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), `${prefix}-`));
  return tempDir;
}

/**
 * Clean up a temporary directory with retry logic for Windows
 * @param {string} dirPath - Path to the directory to clean up
 * @param {number} maxRetries - Maximum number of retry attempts (default: 3)
 * @param {number} retryDelay - Delay between retries in milliseconds (default: 100)
 */
async function cleanupTempDirWithRetry(
  dirPath,
  maxRetries = 3,
  retryDelay = 100
) {
  if (!dirPath || !(await fs.pathExists(dirPath))) {
    return;
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await fs.remove(dirPath);
      return; // Success, exit the function
    } catch (error) {
      if (attempt === maxRetries) {
        // Last attempt failed, but don't throw in tests
        console.warn(
          `Failed to cleanup ${dirPath} after ${maxRetries} attempts:`,
          error.message
        );
        return;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
    }
  }
}

/**
 * Clean up a temporary directory
 * @param {string} dirPath - Path to the directory to clean up
 */
async function cleanupTempDir(dirPath) {
  if (dirPath && (await fs.pathExists(dirPath))) {
    await fs.remove(dirPath);
  }
}

/**
 * Create a mock project structure for testing
 * @param {string} projectDir - Base directory for the project
 * @param {Object} structure - Object describing the file structure
 */
async function createMockProject(projectDir, structure = {}) {
  await fs.ensureDir(projectDir);

  // Create package.json if not provided
  if (!structure['package.json']) {
    structure['package.json'] = JSON.stringify(
      {
        name: 'test-project',
        version: '1.0.0',
        scripts: {
          test: 'jest',
          lint: 'eslint .',
          build: 'echo "build command"',
        },
      },
      null,
      2
    );
  }

  // Create files based on structure
  for (const [filePath, content] of Object.entries(structure)) {
    const fullPath = path.join(projectDir, filePath);
    await fs.ensureDir(path.dirname(fullPath));
    await fs.writeFile(fullPath, content);
  }
}

module.exports = {
  createTempDir,
  cleanupTempDir,
  cleanupTempDirWithRetry,
  createMockProject,
};
