#!/usr/bin/env node

/**
 * AI Code Analysis Script
 * Performs deep analysis of codebase using AI
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
// Load .env file with override to ensure .env values take precedence over system env vars
require('dotenv').config({ override: true });

// Optional debug logging (enable with AI_DEBUG=1)
const debugEnabled = /^(1|true)$/i.test(process.env.AI_DEBUG || '');
const debug = (...args) => {
  if (debugEnabled) console.log('[DEBUG]', ...args);
};
debug('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'set' : 'unset');
debug(
  'AZURE_OPENAI_API_KEY:',
  process.env.AZURE_OPENAI_API_KEY ? 'set' : 'unset'
);
debug(
  'AZURE_OPENAI_ENDPOINT:',
  process.env.AZURE_OPENAI_ENDPOINT ? 'set' : 'unset'
);
debug('AI_PROVIDER:', process.env.AI_PROVIDER || 'unset');

// Skip AI analysis if no API key is set (local or CI)
const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
const hasAzureKey =
  !!process.env.AZURE_OPENAI_API_KEY && !!process.env.AZURE_OPENAI_ENDPOINT;
if (!hasOpenAIKey && !hasAzureKey) {
  console.warn(
    '⚠️  Skipping AI analysis: No OpenAI API key found in environment.'
  );
  process.exit(0);
}

debug('Passed API key check, importing OpenAI...');
let OpenAI, openai, aiModel;
// Only import and configure OpenAI if a key is present
if (hasAzureKey) {
  OpenAI = require('openai');
  openai = new OpenAI({
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
    defaultQuery: { 'api-version': process.env.AZURE_OPENAI_API_VERSION },
    defaultHeaders: {
      'api-key': process.env.AZURE_OPENAI_API_KEY,
    },
  });
  aiModel =
    process.env.AZURE_OPENAI_DEPLOYMENT_NAME || process.env.AI_MODEL || 'gpt-4';
  debug('Initialized Azure OpenAI client');
} else if (hasOpenAIKey) {
  OpenAI = require('openai');
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  aiModel = process.env.AI_MODEL || 'gpt-4';
  debug('Initialized OpenAI client');
}

class CodeAnalyzer {
  constructor() {
    this.outputDir = path.join(process.cwd(), 'temp', 'ai-outputs');
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.config = this.loadProjectConfig();
    fs.ensureDirSync(this.outputDir);
  }

  loadProjectConfig() {
    const configPath = path.join(process.cwd(), '.copilotflow', 'config.json');
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
    return { primaryLanguage: 'javascript', projectType: 'general' };
  }

  async analyze() {
    console.log('🔍 Starting AI Code Analysis...\n');

    try {
      const analyses = [
        { name: 'Architecture Analysis', fn: () => this.analyzeArchitecture() },
        { name: 'Code Quality', fn: () => this.analyzeCodeQuality() },
        { name: 'Security Scan', fn: () => this.analyzeSecurity() },
        { name: 'Performance Review', fn: () => this.analyzePerformance() },
        { name: 'Best Practices Check', fn: () => this.checkBestPractices() },
      ];

      const results = {};

      for (const analysis of analyses) {
        console.log(`📊 Running: ${analysis.name}`);
        results[analysis.name] = await analysis.fn();
        console.log(`✅ Completed: ${analysis.name}\n`);
      }

      await this.generateReport(results);
      console.log('🎉 Code analysis completed!');
    } catch (error) {
      console.error('💥 Analysis failed:', error);
      process.exit(1);
    }
  }

  async analyzeArchitecture() {
    const fileStructure = await this.getFileStructure();
    const packageInfo = await this.getPackageInfo();

    const prompt = `
    Analyze the following ${this.config.primaryLanguage} project structure and provide architectural insights:
    
    Project Type: ${this.config.projectType}
    Primary Language: ${this.config.primaryLanguage}
    
    File Structure:
    ${fileStructure}
    
    Package/Configuration Information:
    ${JSON.stringify(packageInfo, null, 2)}
    
    Please analyze for ${this.config.primaryLanguage} projects:
    1. Overall architecture pattern
    2. Directory organization following ${this.config.primaryLanguage} conventions
    3. Separation of concerns
    4. Language-specific best practices adherence
    5. Scalability considerations
    6. Recommended improvements
    `;

    try {
      const response = await openai.chat.completions.create({
        model: aiModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      });
      return {
        analysis: response.choices[0].message.content,
        score: this.calculateArchitectureScore(fileStructure),
        recommendations: [],
      };
    } catch (err) {
      if (err?.code === 'DeploymentNotFound' || err?.status === 404) {
        console.warn(
          '⚠️  Azure OpenAI deployment not found. Falling back to static architecture assessment.'
        );
        return {
          analysis:
            'AI architecture analysis skipped: Azure OpenAI deployment not found. Provide a valid deployment name or set OPENAI_API_KEY to enable full analysis.',
          score: this.calculateArchitectureScore(fileStructure),
          recommendations: [
            'Configure a valid Azure OpenAI deployment or standard OpenAI key to enable AI-assisted architecture review.',
          ],
        };
      }
      debug('Architecture analysis OpenAI error (unhandled)', err.message);
      throw err; // rethrow unexpected
    }
  }

  async analyzeCodeQuality() {
    const codeFiles = await this.getCodeFiles();
    const lintResults = await this.runLanguageSpecificLinter();

    let totalLines = 0;
    const totalFiles = codeFiles.length;

    for (const file of codeFiles.slice(0, 5)) {
      // Analyze first 5 files
      try {
        const content = await fs.readFile(file, 'utf-8');
        totalLines += content.split('\n').length;
      } catch (error) {
        console.error(`Error reading file ${file}:`, error);
        // Skip files that can't be read
      }
    }

    // Generate AI analysis
    const prompt = `
    Analyze code quality for this ${this.config.primaryLanguage} project:
    
    Project Type: ${this.config.projectType}
    Total Files: ${totalFiles}
    Total Lines (sample): ${totalLines}
    
    Linting Results:
    ${JSON.stringify(lintResults, null, 2)}
    
    Please analyze:
    1. Code quality metrics for ${this.config.primaryLanguage}
    2. ${this.config.primaryLanguage}-specific best practices compliance
    3. Maintainability assessment
    4. Common patterns and anti-patterns
    5. Refactoring opportunities
    `;

    try {
      const response = await openai.chat.completions.create({
        model: aiModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      });
      return {
        totalFiles,
        totalLines,
        lintIssues: lintResults.length,
        score: Math.max(0, 100 - lintResults.length * 2),
        analysis: response.choices[0].message.content,
        recommendations: [
          `Fix ${this.config.primaryLanguage} linting issues`,
          'Add more comprehensive tests',
          'Improve code documentation',
        ],
      };
    } catch (err) {
      if (err?.code === 'DeploymentNotFound' || err?.status === 404) {
        console.warn(
          '⚠️  Skipping AI code quality analysis due to missing deployment.'
        );
        return {
          totalFiles,
          totalLines,
          lintIssues: lintResults.length,
          score: Math.max(0, 100 - lintResults.length * 2),
          analysis:
            'AI code quality narrative skipped: Azure OpenAI deployment not found.',
          recommendations: [
            `Fix ${this.config.primaryLanguage} linting issues`,
            'Add more comprehensive tests',
            'Improve code documentation',
            'Configure a valid AI deployment for enhanced analysis',
          ],
        };
      }
      debug('Code quality OpenAI error (unhandled)', err.message);
      return {
        totalFiles,
        totalLines,
        lintIssues: lintResults.length,
        score: Math.max(0, 100 - lintResults.length * 2),
        analysis: 'AI code quality narrative skipped: unexpected AI error.',
        recommendations: [
          `Fix ${this.config.primaryLanguage} linting issues`,
          'Stabilize AI configuration',
        ],
      };
    }
  }

  async analyzeSecurity() {
    const packageJson = await this.getPackageInfo();
    const securityIssues = [];

    // Check for common security issues
    if (packageJson.dependencies) {
      const deps = Object.keys(packageJson.dependencies);

      // Check for known vulnerable packages (simplified check)
      const potentialIssues = deps.filter(dep =>
        ['lodash', 'moment', 'request'].includes(dep.split('/').pop())
      );

      if (potentialIssues.length > 0) {
        securityIssues.push(
          `Potentially outdated dependencies: ${potentialIssues.join(', ')}`
        );
      }
    }

    // Check for hardcoded secrets (basic pattern matching)
    const codeFiles = await this.getCodeFiles();
    for (const file of codeFiles.slice(0, 10)) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const patterns = [
          /api[_-]?key\s*=\s*['"]\w+['"]/,
          /password\s*=\s*['"]\w+['"]/,
          /secret\s*=\s*['"]\w+['"]/,
        ];

        for (const pattern of patterns) {
          if (pattern.test(content)) {
            securityIssues.push(`Potential hardcoded secret in ${file}`);
            break;
          }
        }
      } catch (error) {
        console.error(`Error reading file ${file}:`, error);
        // Skip files that can't be read
      }
    }

    return {
      issuesFound: securityIssues.length,
      issues: securityIssues,
      score: Math.max(0, 100 - securityIssues.length * 20),
      recommendations: [
        'Use environment variables for secrets',
        'Run npm audit regularly',
        'Implement proper input validation',
        'Use HTTPS for all external communications',
      ],
    };
  }

  async analyzePerformance() {
    const packageJson = await this.getPackageInfo();
    const bundleSize = await this.estimateBundleSize();

    const performanceIssues = [];

    // Check for heavy dependencies
    if (packageJson.dependencies) {
      const heavyDeps = ['moment', 'lodash', 'axios'].filter(
        dep => packageJson.dependencies[dep]
      );

      if (heavyDeps.length > 0) {
        performanceIssues.push(
          `Consider lighter alternatives to: ${heavyDeps.join(', ')}`
        );
      }
    }

    let perfScore;
    if (bundleSize < 500) perfScore = 90;
    else if (bundleSize < 1000) perfScore = 70;
    else perfScore = 50;
    return {
      estimatedBundleSize: bundleSize,
      performanceIssues,
      score: perfScore,
      recommendations: [
        'Optimize bundle size',
        'Implement code splitting',
        'Use tree shaking',
        'Compress images and assets',
      ],
    };
  }

  async checkBestPractices() {
    const checks = {
      hasReadme: await fs.pathExists('README.md'),
      hasPackageJson: await fs.pathExists('package.json'),
      hasGitignore: await fs.pathExists('.gitignore'),
      hasTests: await this.hasTestFiles(),
      hasLinting: await this.hasLintingSetup(),
      hasTypeScript: await fs.pathExists('tsconfig.json'),
      hasCI: await fs.pathExists('.github/workflows'),
    };

    const score =
      (Object.values(checks).filter(Boolean).length * 100) /
      Object.keys(checks).length;

    return {
      checks,
      score: Math.round(score),
      recommendations: Object.entries(checks)
        .filter(([, value]) => !value)
        .map(([key]) => `Add ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`),
    };
  }

  async generateReport(results) {
    const overallScore =
      Object.values(results)
        .filter(r => r.score !== undefined)
        .reduce((sum, r) => sum + r.score, 0) /
      Object.values(results).filter(r => r.score !== undefined).length;

    const report = `
# 🔍 AI Code Analysis Report
*Generated on ${new Date().toLocaleString()}*

## Overall Score: ${Math.round(overallScore)}/100

## Analysis Results

### 🏗️ Architecture Analysis
**Score:** ${results['Architecture Analysis']?.score || 'N/A'}/100
${results['Architecture Analysis']?.analysis || 'No analysis available'}

### 📊 Code Quality
**Score:** ${results['Code Quality']?.score || 'N/A'}/100
- Total Files: ${results['Code Quality']?.totalFiles || 0}
- Total Lines: ${results['Code Quality']?.totalLines || 0}
- ESLint Issues: ${results['Code Quality']?.eslintIssues || 0}

### 🔒 Security Analysis
**Score:** ${results['Security Scan']?.score || 'N/A'}/100
- Issues Found: ${results['Security Scan']?.issuesFound || 0}
${results['Security Scan']?.issues?.map(issue => `- ${issue}`).join('\n') || ''}

### ⚡ Performance Review
**Score:** ${results['Performance Review']?.score || 'N/A'}/100
- Estimated Bundle Size: ${results['Performance Review']?.estimatedBundleSize || 'Unknown'} KB

### ✅ Best Practices
**Score:** ${results['Best Practices Check']?.score || 'N/A'}/100
${Object.entries(results['Best Practices Check']?.checks || {})
  .map(([key, value]) => `- ${key}: ${value ? '✅' : '❌'}`)
  .join('\n')}

## 🚀 Recommendations

### High Priority
${this.getHighPriorityRecommendations(results)
  .map(rec => `- ${rec}`)
  .join('\n')}

### General Improvements
${this.getAllRecommendations(results)
  .slice(0, 10)
  .map(rec => `- ${rec}`)
  .join('\n')}

---
*Report generated by CopilotFlow AI Assistant*
    `;

    await fs.writeFile(
      path.join(this.outputDir, `code-analysis-${this.timestamp}.md`),
      report
    );

    await fs.writeFile(
      path.join(this.outputDir, `code-analysis-${this.timestamp}.json`),
      JSON.stringify(results, null, 2)
    );

    console.log(
      `📄 Report saved to: temp/ai-outputs/code-analysis-${this.timestamp}.md`
    );
  }

  // Helper methods
  async getFileStructure() {
    try {
      const extensions = this.getLanguageExtensions();
      const files = await this.findFilesRecursive(
        process.cwd(),
        extensions,
        20
      );
      return files.join('\n');
    } catch (error) {
      console.error('Error generating file structure:', error);
      return 'Unable to generate file structure';
    }
  }

  async getPackageInfo() {
    try {
      switch (this.config.primaryLanguage) {
        case 'javascript':
        case 'typescript':
          return await fs.readJson('package.json');
        case 'python': {
          const info = {};
          if (await fs.pathExists('requirements.txt')) {
            info.requirements = await fs.readFile('requirements.txt', 'utf8');
          }
          if (await fs.pathExists('setup.py')) {
            info.hasSetupPy = true;
          }
          if (await fs.pathExists('pyproject.toml')) {
            info.hasPyprojectToml = true;
          }
          return info;
        }
        case 'powershell': {
          const psInfo = {};
          if (await fs.pathExists('*.psd1')) {
            psInfo.hasManifest = true;
          }
          return psInfo;
        }
        default:
          return {};
      }
    } catch (error) {
      console.error('Error getting package info:', error);
      return {};
    }
  }

  async getCodeFiles() {
    try {
      const extensions = this.getLanguageExtensions();
      const files = await this.findFilesRecursive(process.cwd(), extensions);
      return files;
    } catch (error) {
      console.error('Error getting code files:', error);
      return [];
    }
  }

  // Recursively find files with given extensions, skipping node_modules, with optional limit
  async findFilesRecursive(dir, extensions, limit = Infinity, found = []) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.git'))
        continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await this.findFilesRecursive(fullPath, extensions, limit, found);
        if (found.length >= limit) break;
      } else {
        const ext = path.extname(entry.name).replace(/^\./, '');
        if (extensions.includes(ext)) {
          found.push(fullPath);
          if (found.length >= limit) break;
        }
      }
    }
    return found;
  }

  getLanguageExtensions() {
    switch (this.config.primaryLanguage) {
      case 'javascript':
        return ['js', 'jsx', 'json', 'md'];
      case 'typescript':
        return ['ts', 'tsx', 'js', 'jsx', 'json', 'md'];
      case 'python':
        return ['py', 'pyx', 'pyi', 'md', 'txt', 'toml'];
      case 'powershell':
        return ['ps1', 'psm1', 'psd1', 'md'];
      default:
        return ['js', 'ts', 'py', 'ps1', 'md'];
    }
  }

  async runLanguageSpecificLinter() {
    try {
      switch (this.config.primaryLanguage) {
        case 'javascript':
        case 'typescript':
          return await this.runEslint();
        case 'python':
          return await this.runPythonLinters();
        case 'powershell':
          return await this.runPowerShellLinters();
        default:
          return [];
      }
    } catch (error) {
      console.warn(
        `Linting failed for ${this.config.primaryLanguage}:`,
        error.message
      );
      return [];
    }
  }

  async runEslint() {
    const cmd = 'npx eslint . --format json';
    try {
      const stdout = execSync(cmd, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      return this.parseEslintJson(stdout);
    } catch (error) {
      // ESLint exits non-zero when issues found; still try to parse stdout
      if (error && error.stdout) {
        const parsed = this.parseEslintJson(error.stdout);
        if (parsed.length) return parsed;
      }
      console.warn(
        '⚠️  ESLint unavailable or failed; continuing without lint details.'
      );
      return [];
    }
  }

  parseEslintJson(raw) {
    try {
      const data = JSON.parse(raw || '[]');
      return Array.isArray(data)
        ? data.flatMap(file => file.messages || [])
        : [];
    } catch (e) {
      debug('Failed to parse ESLint JSON:', e.message);
      return [];
    }
  }

  async runPythonLinters() {
    const results = [];

    try {
      // Run flake8 if available
      const flake8Output = execSync('flake8 . --format=json', {
        encoding: 'utf-8',
      });
      const flake8Results = JSON.parse(flake8Output || '[]');
      results.push(...flake8Results);
    } catch (error) {
      console.error('Error running flake8:', error);
      // Flake8 not available or no issues
    }

    try {
      // Run black --check if available
      execSync('black --check .', { encoding: 'utf-8' });
    } catch (error) {
      if (error.stdout && error.stdout.includes('would reformat')) {
        results.push({
          message: 'Code formatting issues detected by Black',
          severity: 'warning',
        });
      } else {
        console.error('Error running black:', error);
      }
    }

    return results;
  }

  async runPowerShellLinters() {
    const results = [];

    try {
      // Run PSScriptAnalyzer if available
      const psOutput = execSync(
        'pwsh -Command "Invoke-ScriptAnalyzer -Path . -Recurse | ConvertTo-Json"',
        { encoding: 'utf-8' }
      );
      const psResults = JSON.parse(psOutput || '[]');
      results.push(...(Array.isArray(psResults) ? psResults : [psResults]));
    } catch (error) {
      console.error('Error running PSScriptAnalyzer:', error);
      // PSScriptAnalyzer not available
    }

    return results;
  }

  calculateArchitectureScore(fileStructure) {
    // Simple scoring based on file organization
    const hasProperStructure =
      fileStructure.includes('src/') || fileStructure.includes('lib/');
    const hasTests =
      fileStructure.includes('test/') || fileStructure.includes('spec/');
    const hasConfig =
      fileStructure.includes('config/') || fileStructure.includes('.json');

    return (
      (hasProperStructure ? 40 : 0) + (hasTests ? 30 : 0) + (hasConfig ? 30 : 0)
    );
  }

  async hasTestFiles() {
    // Pure Node implementation avoids shell dependency
    try {
      const exts = this.getLanguageExtensions();
      const files = await this.findFilesRecursive(process.cwd(), exts, 500);
      return files.some(f => /\.(test|spec)\.[^.]+$/i.test(f));
    } catch (error) {
      debug('Test discovery failed:', error.message);
      return false;
    }
  }

  async hasLintingSetup() {
    switch (this.config.primaryLanguage) {
      case 'javascript':
      case 'typescript':
        return (
          (await fs.pathExists('.eslintrc.js')) ||
          (await fs.pathExists('.eslintrc.json')) ||
          (await fs.pathExists('eslint.config.js'))
        );
      case 'python':
        return (
          (await fs.pathExists('.flake8')) ||
          (await fs.pathExists('setup.cfg')) ||
          (await fs.pathExists('pyproject.toml'))
        );
      case 'powershell':
        return await fs.pathExists('PSScriptAnalyzerSettings.psd1');
      default:
        return false;
    }
  }

  async estimateBundleSize() {
    try {
      const packageJson = await this.getPackageInfo();
      const depCount = Object.keys(packageJson.dependencies || {}).length;
      return depCount * 50; // Rough estimate: 50KB per dependency
    } catch (error) {
      console.error('Error estimating bundle size:', error);
      return 0;
    }
  }

  getHighPriorityRecommendations(results) {
    const recommendations = [];

    if (results['Security Scan']?.score < 80) {
      recommendations.push('Address security vulnerabilities immediately');
    }
    if (results['Code Quality']?.eslintIssues > 10) {
      recommendations.push('Fix critical ESLint issues');
    }
    if (results['Best Practices Check']?.score < 70) {
      recommendations.push('Implement missing development best practices');
    }

    return recommendations;
  }

  getAllRecommendations(results) {
    return Object.values(results)
      .flatMap(result => result.recommendations || [])
      .filter((rec, index, self) => self.indexOf(rec) === index); // Remove duplicates
  }
}

// Run the analysis if called directly
if (require.main == module) {
  const analyzer = new CodeAnalyzer();
  analyzer.analyze().catch(console.error);
}

module.exports = CodeAnalyzer;
