#!/usr/bin/env node

/**
 * CopilotFlow Entry Point
 * Main application entry for the AI-powered development toolkit
 */

const fs = require('fs-extra');
const path = require('path');
require('dotenv').config();

class CopilotFlow {
  constructor() {
    this.version = '1.0.0';
    this.projectRoot = process.cwd();
  }

  async start() {
    console.log('🚀 CopilotFlow AI Development Toolkit');
    console.log(`📦 Version ${this.version}`);
    console.log(`📁 Project: ${path.basename(this.projectRoot)}\n`);

    try {
      await this.checkConfiguration();
      await this.displayStatus();
      await this.showAvailableCommands();
    } catch (error) {
      console.error('💥 Failed to start CopilotFlow:', error.message);
      process.exit(1);
    }
  }

  async checkConfiguration() {
    const configFile = path.join(this.projectRoot, '.copilotflow.json');

    if (await fs.pathExists(configFile)) {
      const config = await fs.readJson(configFile);
      console.log(
        `✅ Project configured for ${config.primaryLanguage?.toUpperCase() || 'UNKNOWN'} on ${new Date(config.setupDate).toLocaleDateString()}`
      );

      // Show language-specific status
      await this.showLanguageStatus(config);
    } else {
      console.log(
        '⚠️ Project not configured. Run "npm run setup" to get started.'
      );
    }

    // Check AI configuration
    if (process.env.OPENAI_API_KEY) {
      console.log('✅ AI API key configured');
    } else {
      console.log(
        '⚠️ AI API key not found. Add OPENAI_API_KEY to your .env file.'
      );
    }
  }

  async showLanguageStatus(config) {
    const language = config.primaryLanguage;

    switch (language) {
      case 'javascript':
        if (await fs.pathExists(path.join(this.projectRoot, 'package.json'))) {
          console.log('✅ JavaScript project structure detected');
        }
        if (await fs.pathExists(path.join(this.projectRoot, 'node_modules'))) {
          console.log('✅ Dependencies installed');
        } else {
          console.log('⚠️ Dependencies not installed. Run "npm install"');
        }
        break;

      case 'python':
        if (
          await fs.pathExists(path.join(this.projectRoot, 'requirements.txt'))
        ) {
          console.log('✅ Python requirements.txt found');
        }
        if (await fs.pathExists(path.join(this.projectRoot, 'venv'))) {
          console.log('✅ Virtual environment detected');
        } else {
          console.log(
            '⚠️ Virtual environment not found. Run "python -m venv venv"'
          );
        }
        break;

      case 'powershell': {
        const manifestFiles = (await fs.readdir(this.projectRoot)).filter(f =>
          f.endsWith('.psd1')
        );
        if (manifestFiles.length > 0) {
          console.log('✅ PowerShell module manifest found');
        }
        if (await fs.pathExists(path.join(this.projectRoot, 'Public'))) {
          console.log('✅ PowerShell module structure detected');
        }
        break;
      }
    }
  }

  async displayStatus() {
    console.log('\n📊 Project Status:');

    // Check for recent AI outputs
    const aiOutputsDir = path.join(this.projectRoot, 'temp', 'ai-outputs');
    if (await fs.pathExists(aiOutputsDir)) {
      const files = await fs.readdir(aiOutputsDir);
      const recentFiles = files.filter(f =>
        f.includes(new Date().toISOString().split('T')[0])
      );
      console.log(`🤖 AI outputs today: ${recentFiles.length}`);
    }

    // Check for documentation
    const docsDir = path.join(this.projectRoot, 'docs');
    if (await fs.pathExists(docsDir)) {
      const files = await fs.readdir(docsDir);
      console.log(`📚 Documentation files: ${files.length}`);
    }

    // Check for logs
    const logsDir = path.join(this.projectRoot, 'logs', 'ai-conversations');
    if (await fs.pathExists(logsDir)) {
      const files = await fs.readdir(logsDir);
      console.log(`📋 AI conversation logs: ${files.length}`);
    }
  }

  async showAvailableCommands() {
    const configFile = path.join(this.projectRoot, '.copilotflow.json');
    let language = 'javascript'; // default

    if (await fs.pathExists(configFile)) {
      const config = await fs.readJson(configFile);
      language = config.primaryLanguage || 'javascript';
    }

    console.log('\n🛠️ Available Commands:');
    console.log('');
    console.log('🚀 Setup & Configuration');
    console.log('  npm run setup              - Interactive project setup');
    console.log('');
    console.log('🤖 AI Workflows');
    console.log('  npm run ai:daily-workflow  - Run daily AI automation');
    console.log('  npm run ai:analyze-code    - Analyze code quality');
    console.log('  npm run ai:generate-docs   - Generate documentation');
    console.log('  npm run ai:commit-message  - Generate commit messages');
    console.log('  npm run ai:code-review     - Get AI code review');
    console.log('');

    // Language-specific commands
    this.showLanguageSpecificCommands(language);

    console.log('� Analytics');
    console.log('  npm run logs:view          - View recent logs');
    console.log('  npm run logs:analyze       - AI log analysis');
    console.log('');
    console.log('📚 Documentation: docs/');
    console.log('🎯 Quick Start: docs/QUICKSTART.md');
    console.log('');
    console.log('Happy coding with AI assistance! 🚀✨');
  }

  showLanguageSpecificCommands(language) {
    switch (language) {
      case 'javascript':
        console.log('�🔧 JavaScript Development');
        console.log('  npm start                  - Start application');
        console.log('  npm run dev                - Start in development mode');
        console.log('  npm test                   - Run Jest tests');
        console.log('  npm run lint               - ESLint code check');
        console.log('  npm run format             - Prettier code format');
        console.log('  npm run build              - Build for production');
        break;

      case 'python':
        console.log('🔧 Python Development');
        console.log('  python main.py             - Run main application');
        console.log('  npm test                   - Run pytest tests');
        console.log('  npm run lint               - Run flake8 linter');
        console.log('  npm run format             - Run black formatter');
        console.log('  pip install -r requirements.txt - Install dependencies');
        console.log(
          '  python -m venv venv        - Create virtual environment'
        );
        break;

      case 'powershell':
        console.log('� PowerShell Development');
        console.log('  Import-Module .\\[ModuleName].psm1 - Import module');
        console.log('  npm test                   - Run Pester tests');
        console.log('  npm run lint               - Run PSScriptAnalyzer');
        console.log('  Get-Command -Module [Name] - List available cmdlets');
        console.log('  Update-Help               - Update PowerShell help');
        break;
    }
    console.log('');
  }
}

// Run CopilotFlow if called directly
if (require.main === module) {
  const app = new CopilotFlow();
  app.start().catch(console.error);
}

module.exports = CopilotFlow;
