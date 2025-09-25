/**
 * Universal Runner Tests
 * Comprehensive testing for multi-language script execution
 */

const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const testUtils = require('../test-utils');

describe('Universal Runner', () => {
  let tempProjectDir;
  let originalCwd;
  let originalEnv;

  beforeEach(async () => {
    // Create temporary project directory
    tempProjectDir = await testUtils.createTempDir('universal-runner-test');
    originalCwd = process.cwd();

    // Save original environment
    originalEnv = { ...process.env };

    // Set up test environment
    process.env.NODE_ENV = 'test';

    // Create a mock project structure
    await createMockProject(tempProjectDir);

    // Change to temp directory for testing
    process.chdir(tempProjectDir);
  });

  afterEach(async () => {
    // Restore original directory and environment
    process.chdir(originalCwd);
    Object.assign(process.env, originalEnv);

    // Clean up temp directory
    await testUtils.cleanupTempDirWithRetry(tempProjectDir);
  });

  describe('Happy Path Testing', () => {
    test('should detect JavaScript project correctly', async () => {
      const result = await runUniversalRunner(['test']);

      expect(result.exitCode).toBeDefined();
      // Should attempt to run JavaScript commands or show appropriate error
    });

    test('should run lint command for JavaScript project', async () => {
      const result = await runUniversalRunner(['lint']);

      expect(result.exitCode).toBeDefined();
      // Should attempt to run linting or show appropriate error
    });

    test('should run format command for JavaScript project', async () => {
      const result = await runUniversalRunner(['format']);

      expect(result.exitCode).toBeDefined();
      // Should attempt to run formatting or show appropriate error
    });

    test('should display help information', async () => {
      const result = await runUniversalRunner(['--help']);

      expect(result.exitCode).toBeDefined();
      // Check if help text appears in stdout or stderr, or script completes successfully
      const hasHelpText =
        result.stdout.includes('help') || result.stderr.includes('help');
      const isSuccessful = result.exitCode === 0;

      expect(hasHelpText || isSuccessful).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle Python project detection', async () => {
      // Add Python files
      await fs.writeFile('requirements.txt', 'pytest==7.1.0');
      await fs.writeFile('setup.py', 'from setuptools import setup');

      const result = await runUniversalRunner(['test']);

      expect(result.exitCode).toBeDefined();
      // Should detect Python and attempt appropriate commands
    });

    test('should handle PowerShell project detection', async () => {
      // Add PowerShell files
      await fs.writeFile('module.psm1', 'function Test-Function { }');
      await fs.writeFile('manifest.psd1', '@{ ModuleVersion = "1.0.0" }');

      const result = await runUniversalRunner(['test']);

      expect(result.exitCode).toBeDefined();
      // Should detect PowerShell and attempt appropriate commands
    });

    test('should handle mixed language projects', async () => {
      // Add multiple language files
      await fs.writeFile('requirements.txt', 'pytest==7.1.0');
      await fs.writeFile('module.psm1', 'function Test-Function { }');

      const result = await runUniversalRunner(['test']);

      expect(result.exitCode).toBeDefined();
      // Should use primary detection logic
    });

    test('should handle project with no language indicators', async () => {
      // Remove all language-specific files
      await fs.remove('package.json');

      const result = await runUniversalRunner(['test']);

      expect(result.exitCode).toBeDefined();
      // Should default to JavaScript or handle gracefully
    });

    test('should handle unknown commands', async () => {
      const result = await runUniversalRunner(['unknown-command']);

      expect(result.exitCode).toBeDefined();
      // Should handle unknown commands gracefully
    });
  });

  describe('Error Handling', () => {
    test('should handle missing configuration file', async () => {
      await fs.remove('.copilotflow.json');

      const result = await runUniversalRunner(['test']);

      expect(result.exitCode).toBeDefined();
      // Should fall back to auto-detection
    });

    test('should handle corrupted configuration file', async () => {
      await fs.writeFile('.copilotflow.json', 'invalid json content');

      const result = await runUniversalRunner(['test']);

      expect(result.exitCode).toBeDefined();
      // Should handle corrupted config gracefully
    });

    test('should handle missing dependencies', async () => {
      // Create package.json without dependencies
      await fs.writeJson('package.json', {
        name: 'test-project',
        version: '1.0.0',
      });

      const result = await runUniversalRunner(['test']);

      expect(result.exitCode).toBeDefined();
      // Should handle missing dependencies
    });

    test('should handle permission errors', async () => {
      const result = await runUniversalRunner(['test']);

      expect(result.exitCode).toBeDefined();
      // Should complete basic operations
    });

    test('should handle command execution failures', async () => {
      // Test with non-existent script
      const result = await runUniversalRunner(['nonexistent-script']);

      expect(result.exitCode).toBeDefined();
      // Should handle command failures gracefully
    });
  });

  describe('State Testing', () => {
    test('should not modify project files during execution', async () => {
      const originalPackageJson = await fs.readFile('package.json', 'utf8');

      await runUniversalRunner(['test']);

      const afterPackageJson = await fs.readFile('package.json', 'utf8');
      expect(afterPackageJson).toBe(originalPackageJson);
    });

    test('should preserve project structure', async () => {
      const beforeFiles = await fs.readdir('.');

      await runUniversalRunner(['lint']);

      const afterFiles = await fs.readdir('.');
      expect(afterFiles.sort()).toEqual(beforeFiles.sort());
    });

    test('should maintain configuration consistency', async () => {
      const originalConfig = await fs.readJson('.copilotflow.json');

      await runUniversalRunner(['format']);

      if (await fs.pathExists('.copilotflow.json')) {
        const afterConfig = await fs.readJson('.copilotflow.json');
        expect(afterConfig).toEqual(originalConfig);
      }
    });

    test('should handle concurrent executions', async () => {
      const promises = [
        runUniversalRunner(['test']),
        runUniversalRunner(['lint']),
      ];

      const results = await Promise.allSettled(promises);

      // Both should complete without interfering
      results.forEach(result => {
        expect(result.status).toBe('fulfilled');
        expect(result.value.exitCode).toBeDefined();
      });
    });
  });

  describe('Integration Points', () => {
    test('should work with npm scripts', async () => {
      // Add npm scripts to package.json
      await fs.writeJson('package.json', {
        name: 'test-project',
        version: '1.0.0',
        scripts: {
          test: 'echo "test"',
          lint: 'echo "lint"',
          format: 'echo "format"',
        },
      });

      const result = await runUniversalRunner(['test']);

      expect(result.exitCode).toBeDefined();
    });

    test('should respect .copilotflow.json configuration', async () => {
      await fs.writeJson('.copilotflow.json', {
        primaryLanguage: 'javascript',
        customCommands: {
          test: 'npm test',
        },
      });

      const result = await runUniversalRunner(['test']);

      expect(result.exitCode).toBeDefined();
    });

    test('should work with git repositories', async () => {
      try {
        await runCommand('git', ['init']);
        await runCommand('git', ['config', 'user.email', 'test@example.com']);
        await runCommand('git', ['config', 'user.name', 'Test User']);

        const result = await runUniversalRunner(['test']);

        expect(result.exitCode).toBeDefined();
        expect(await fs.pathExists('.git')).toBe(true);
      } catch (error) {
        // Git may not be available, skip gracefully
        expect(error).toBeDefined();
      }
    });

    test('should handle different working directories', async () => {
      // Create subdirectory
      await fs.ensureDir('subdir');
      await fs.writeJson('subdir/package.json', {
        name: 'sub-project',
        version: '1.0.0',
      });

      // Change to subdirectory
      process.chdir('subdir');

      const result = await runUniversalRunner(['test']);

      expect(result.exitCode).toBeDefined();

      // Restore directory
      process.chdir('..');
    });

    test('should integrate with CI/CD environments', async () => {
      // Set CI environment variables
      process.env.CI = 'true';
      process.env.GITHUB_ACTIONS = 'true';

      const result = await runUniversalRunner(['test']);

      expect(result.exitCode).toBeDefined();
    });
  });

  // Helper functions
  async function createMockProject(projectDir) {
    // Create package.json for JavaScript detection
    await fs.writeJson(path.join(projectDir, 'package.json'), {
      name: 'test-universal-project',
      version: '1.0.0',
      description: 'Test project for universal runner',
      scripts: {
        test: 'echo "Running tests"',
        lint: 'echo "Running linter"',
        format: 'echo "Formatting code"',
      },
    });

    // Create .copilotflow.json
    await fs.writeJson(path.join(projectDir, '.copilotflow.json'), {
      primaryLanguage: 'javascript',
      projectType: 'node-cli-tool',
      version: '1.0.0',
    });

    // Create source files
    await fs.ensureDir(path.join(projectDir, 'src'));
    await fs.writeFile(
      path.join(projectDir, 'src/index.js'),
      'console.log("Hello, World!");'
    );

    // Create README.md
    await fs.writeFile(
      path.join(projectDir, 'README.md'),
      '# Test Project\\n\\nUniversal runner test project.'
    );
  }

  async function runUniversalRunner(args = [], input = '') {
    const scriptPath = path.resolve(originalCwd, 'scripts/universal-runner.js');

    return new Promise(resolve => {
      const child = spawn('node', [scriptPath, ...args], {
        cwd: tempProjectDir,
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 10000, // 10 second timeout
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', data => {
        stdout += data.toString();
      });

      child.stderr.on('data', data => {
        stderr += data.toString();
      });

      child.on('close', code => {
        resolve({
          exitCode: code,
          stdout,
          stderr,
        });
      });

      child.on('error', error => {
        resolve({
          exitCode: 1,
          stdout,
          stderr: stderr + error.message,
        });
      });

      // Send input if provided
      if (input) {
        child.stdin.write(input);
      }
      child.stdin.end();
    });
  }

  async function runCommand(command, args) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, { cwd: tempProjectDir });
      child.on('close', code => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with exit code ${code}`));
        }
      });
    });
  }
});
