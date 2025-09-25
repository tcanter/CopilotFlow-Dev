#!/usr/bin/env node

/**
 * Universal Script Runner for Multi-Language Support
 * Detects the project language and runs appropriate commands
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

class UniversalRunner {
  constructor() {
    this.projectRoot = process.cwd();
    this.config = this.loadConfig();
  }

  loadConfig() {
    try {
      const configPath = path.join(this.projectRoot, '.copilotflow.json');
      if (fs.existsSync(configPath)) {
        return fs.readJsonSync(configPath);
      }
    } catch (error) {
      console.warn('⚠️ Could not load project config');
    }

    // Auto-detect language if no config
    return this.autoDetectLanguage();
  }

  autoDetectLanguage() {
    const files = fs.readdirSync(this.projectRoot);

    if (files.some(f => f.endsWith('.psd1') || f.endsWith('.psm1'))) {
      return { primaryLanguage: 'powershell' };
    }

    if (files.includes('requirements.txt') || files.includes('setup.py')) {
      return { primaryLanguage: 'python' };
    }

    if (files.includes('package.json')) {
      return { primaryLanguage: 'javascript' };
    }

    return { primaryLanguage: 'javascript' }; // default
  }

  async runCommand(scriptType) {
    let language = this.config.primaryLanguage;
    if (!language) {
      language = 'javascript';
    }
    const langDisplay =
      typeof language === 'string' ? language.toUpperCase() : 'UNKNOWN';
    console.log(`🔧 Running ${scriptType} for ${langDisplay} project\n`);

    try {
      switch (scriptType) {
        case 'ai:daily-workflow':
          await this.runAIWorkflow();
          break;
        case 'ai:analyze-code':
          await this.runCodeAnalysis();
          break;
        case 'ai:generate-docs':
          await this.runDocGeneration();
          break;
        case 'test':
          await this.runTests();
          break;
        case 'lint':
          await this.runLinter();
          break;
        case 'format':
          await this.runFormatter();
          break;
        default:
          console.error(`❌ Unknown script type: ${scriptType}`);
          process.exit(1);
      }
    } catch (error) {
      console.error(`💥 Failed to run ${scriptType}:`, error.message);
      process.exit(1);
    }
  }

  async runAIWorkflow() {
    const scriptPath = path.join(
      __dirname,
      'ai-automation',
      'daily-workflow.js'
    );
    execSync(`node "${scriptPath}"`, { stdio: 'inherit' });
  }

  async runCodeAnalysis() {
    const scriptPath = path.join(__dirname, 'ai-automation', 'analyze-code.js');
    execSync(`node "${scriptPath}"`, { stdio: 'inherit' });
  }

  async runDocGeneration() {
    const scriptPath = path.join(
      __dirname,
      'ai-automation',
      'generate-docs.js'
    );
    execSync(`node "${scriptPath}"`, { stdio: 'inherit' });
  }

  async runTests() {
    const language = this.config.primaryLanguage;

    switch (language) {
      case 'javascript':
        if (this.hasNpmScript('test')) {
          execSync('npm test', { stdio: 'inherit' });
        } else if (this.hasPackage('jest')) {
          execSync('npx jest', { stdio: 'inherit' });
        } else {
          console.log('⚠️ No test runner configured for JavaScript project');
        }
        break;

      case 'python':
        if (
          this.hasFile('pytest.ini') ||
          this.config.tools?.includes('pytest')
        ) {
          execSync('python -m pytest', { stdio: 'inherit' });
        } else {
          execSync('python -m unittest discover', { stdio: 'inherit' });
        }
        break;

      case 'powershell':
        if (this.hasFolder('Tests')) {
          execSync('powershell -Command "Invoke-Pester -Path ./Tests"', {
            stdio: 'inherit',
          });
        } else {
          console.log('⚠️ No Tests folder found for PowerShell project');
        }
        break;
    }
  }

  async runLinter() {
    const language = this.config.primaryLanguage;

    switch (language) {
      case 'javascript':
        if (this.hasPackage('eslint')) {
          execSync('npx eslint . --ext .js,.ts', { stdio: 'inherit' });
        } else {
          console.log('⚠️ ESLint not configured');
        }
        break;

      case 'python':
        if (this.config.tools?.includes('flake8')) {
          execSync('python -m flake8', { stdio: 'inherit' });
        } else {
          console.log('⚠️ Flake8 not configured');
        }
        break;

      case 'powershell':
        if (this.config.tools?.includes('psscriptanalyzer')) {
          execSync(
            'powershell -Command "Invoke-ScriptAnalyzer -Path . -Recurse"',
            { stdio: 'inherit' }
          );
        } else {
          console.log('⚠️ PSScriptAnalyzer not configured');
        }
        break;
    }
  }

  async runFormatter() {
    const language = this.config.primaryLanguage;

    switch (language) {
      case 'javascript':
        if (this.hasPackage('prettier')) {
          execSync('npx prettier --write .', { stdio: 'inherit' });
        } else {
          console.log('⚠️ Prettier not configured');
        }
        break;

      case 'python':
        if (this.config.tools?.includes('black')) {
          execSync('python -m black .', { stdio: 'inherit' });
        } else {
          console.log('⚠️ Black not configured');
        }
        break;

      case 'powershell':
        console.log(
          '⚠️ PowerShell formatting requires manual VS Code formatting'
        );
        break;
    }
  }

  hasNpmScript(scriptName) {
    try {
      const packageJson = fs.readJsonSync(
        path.join(this.projectRoot, 'package.json')
      );
      return packageJson.scripts?.[scriptName];
    } catch {
      return false;
    }
  }

  hasPackage(packageName) {
    try {
      const packageJson = fs.readJsonSync(
        path.join(this.projectRoot, 'package.json')
      );
      return (
        packageJson.dependencies?.[packageName] ||
        packageJson.devDependencies?.[packageName]
      );
    } catch {
      return false;
    }
  }

  hasFile(fileName) {
    return fs.existsSync(path.join(this.projectRoot, fileName));
  }

  hasFolder(folderName) {
    return fs.existsSync(path.join(this.projectRoot, folderName));
  }
}

// CLI interface
if (require.main == module) {
  const runner = new UniversalRunner();
  const [, , scriptType] = process.argv;

  if (!scriptType) {
    console.error('Usage: node universal-runner.js <script-type> [args...]');
    process.exit(1);
  }

  runner.runCommand(scriptType);
}

module.exports = UniversalRunner;
