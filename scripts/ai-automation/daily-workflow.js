#!/usr/bin/env node
/**
 * Daily AI Workflow Script
 * Automates daily development tasks using AI assistance
 * [Copilot Attribution] This file may be auto-updated by GitHub Copilot on workflow runs.
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
// Load .env file with override to ensure .env values take precedence over system env vars
require('dotenv').config({ override: true });

// Skip AI analysis if no API key is set (local or CI)
const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
const hasAzureKey =
  !!process.env.AZURE_OPENAI_API_KEY && !!process.env.AZURE_OPENAI_ENDPOINT;
if (!hasOpenAIKey && !hasAzureKey) {
  console.warn(
    '⚠️  Skipping AI workflow: No OpenAI API key found in environment.'
  );
  process.exit(0);
}

const OpenAI = require('openai');
// Configure OpenAI client based on provider
let openai;
let aiModel;

if (
  process.env.AI_PROVIDER === 'Azure OpenAI' &&
  process.env.AZURE_OPENAI_ENDPOINT
) {
  openai = new OpenAI({
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
    defaultQuery: { 'api-version': process.env.AZURE_OPENAI_API_VERSION },
    defaultHeaders: {
      'api-key': process.env.AZURE_OPENAI_API_KEY,
    },
  });
  // For Azure OpenAI, use the deployment name as the model
  aiModel =
    process.env.AZURE_OPENAI_DEPLOYMENT_NAME || process.env.AI_MODEL || 'gpt-4';
} else {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  aiModel = process.env.AI_MODEL || 'gpt-4';
}

class DailyAIWorkflow {
  constructor() {
    this.outputDir = path.join(process.cwd(), 'temp', 'ai-outputs');
    this.logsDir = path.join(process.cwd(), 'logs', 'ai-conversations');
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.config = this.loadProjectConfig();

    // Ensure directories exist
    fs.ensureDirSync(this.outputDir);
    fs.ensureDirSync(this.logsDir);
  }

  loadProjectConfig() {
    const configPath = path.join(process.cwd(), '.copilotflow', 'config.json');
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
    return { primaryLanguage: 'javascript', projectType: 'general' };
  }

  async run() {
    console.log('🤖 Starting Daily AI Workflow...\n');

    try {
      const tasks = [
        { name: 'Code Analysis', fn: () => this.analyzeCode() },
        { name: 'Git Status Review', fn: () => this.reviewGitStatus() },
        { name: 'Documentation Check', fn: () => this.checkDocumentation() },
        { name: 'TODO Analysis', fn: () => this.analyzeTodos() },
        { name: 'Generate Daily Report', fn: () => this.generateDailyReport() },
      ];

      const results = {};

      for (const task of tasks) {
        console.log(`📋 Running: ${task.name}`);
        try {
          results[task.name] = await task.fn();
          console.log(`✅ Completed: ${task.name}\n`);
        } catch (error) {
          console.error(`❌ Failed: ${task.name}`, error.message);
          results[task.name] = { error: error.message };
        }
      }

      // Save results as before
      await this.saveResults(results);

      // Chain feedback incorporation, quality check, and auto-correct
      try {
        // Run Copilot auto-fix for trivial issues before checks
        await require(
          path.join(
            process.cwd(),
            'scripts',
            'ai-automation',
            'copilot-auto-fix.js'
          )
        );
      } catch (e) {
        console.error('Copilot auto-fix failed:', e.message);
      }
      try {
        // Incorporate feedback
        await require(
          path.join(
            process.cwd(),
            'scripts',
            'ai-automation',
            'incorporate-feedback.js'
          )
        );
      } catch (e) {
        console.error('Feedback incorporation failed:', e.message);
      }
      try {
        // Run quality check
        await require(
          path.join(
            process.cwd(),
            'scripts',
            'ai-automation',
            'quality-check.js'
          )
        );
      } catch (e) {
        console.error('Quality check failed:', e.message);
      }
      try {
        // Run auto-correct
        await require(
          path.join(
            process.cwd(),
            'scripts',
            'ai-automation',
            'auto-correct.js'
          )
        );
      } catch (e) {
        console.error('Auto-correct failed:', e.message);
      }
      try {
        // Run Prettier to fix line endings and formatting
        execSync('npm run format', { stdio: 'inherit' });
      } catch (e) {
        console.error('Prettier formatting failed:', e.message);
      }

      console.log('🎉 Daily AI Workflow completed successfully!');
    } catch (error) {
      console.error('💥 Daily workflow failed:', error);
      process.exit(1);
    }
  }

  async analyzeCode() {
    const gitDiff = this.getGitChanges();
    if (!gitDiff.trim()) {
      return { message: 'No recent changes to analyze' };
    }

    const prompt = `
    Analyze the following ${this.config.primaryLanguage} code changes and provide insights:
    
    Project Type: ${this.config.projectType}
    Primary Language: ${this.config.primaryLanguage}
    
    Changes:
    ${gitDiff}
    
    Please provide ${this.config.primaryLanguage}-specific analysis:
    1. Summary of changes
    2. Language-specific best practices compliance
    3. Potential issues or improvements
    4. Code quality assessment for ${this.config.primaryLanguage}
    5. Security considerations
    6. Performance implications
    `;

    const response = await openai.chat.completions.create({
      model: aiModel,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    const analysis = response.choices[0].message.content;

    // Save detailed analysis
    await fs.writeFile(
      path.join(this.outputDir, `code-analysis-${this.timestamp}.md`),
      `# Daily Code Analysis (${this.config.primaryLanguage})\n\n${analysis}`
    );

    return {
      summary: analysis.split('\n')[0],
      language: this.config.primaryLanguage,
      fullPath: `temp/ai-outputs/code-analysis-${this.timestamp}.md`,
    };
  }

  async reviewGitStatus() {
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf-8' });
      const branch = execSync('git branch --show-current', {
        encoding: 'utf-8',
      }).trim();
      const lastCommits = execSync('git log --oneline -5', {
        encoding: 'utf-8',
      });

      const statusInfo = {
        branch,
        uncommittedFiles: status
          .trim()
          .split('\n')
          .filter(line => line.trim()),
        recentCommits: lastCommits.trim().split('\n'),
        recommendations: [],
      };

      if (statusInfo.uncommittedFiles.length > 0) {
        statusInfo.recommendations.push(
          'You have uncommitted changes. Consider committing or stashing them.'
        );
      }

      if (statusInfo.branch !== 'main' && statusInfo.branch !== 'develop') {
        statusInfo.recommendations.push(
          'You are working on a feature branch. Consider merging when ready.'
        );
      }

      return statusInfo;
    } catch (error) {
      return { error: `Failed to get git status: ${error.message}` };
    }
  }

  async checkDocumentation() {
    const projectFiles = await this.getProjectFiles();
    const missingDocs = [];

    // Check for README files
    const hasReadme = projectFiles.some(file =>
      file.toLowerCase().includes('readme')
    );
    if (!hasReadme) {
      missingDocs.push('Project README.md');
    }

    // Check for package.json description
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJson(packageJsonPath);
      if (
        !packageJson.description ||
        packageJson.description.includes('TODO')
      ) {
        missingDocs.push('Package description');
      }
    }

    return {
      status: missingDocs.length === 0 ? 'Good' : 'Needs attention',
      missingDocumentation: missingDocs,
      recommendations:
        missingDocs.length > 0
          ? ['Add missing documentation']
          : ['Documentation looks good'],
    };
  }

  async analyzeTodos() {
    try {
      // Use a Node.js-based solution instead of shell commands to avoid hanging
      const todos = [];
      const todoPatterns = /TODO|FIXME|HACK/gi;
      const extensions = ['.js', '.ts', '.py', '.md', '.txt'];

      const searchInDirectory = async dir => {
        try {
          const entries = await fs.readdir(dir, { withFileTypes: true });

          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            // Skip node_modules, .git, dist, build directories
            if (
              entry.isDirectory() &&
              ![
                'node_modules',
                '.git',
                'dist',
                'build',
                'coverage',
                'temp',
              ].includes(entry.name)
            ) {
              await searchInDirectory(fullPath);
            } else if (
              entry.isFile() &&
              extensions.some(ext => entry.name.endsWith(ext))
            ) {
              try {
                const content = await fs.readFile(fullPath, 'utf-8');
                const lines = content.split('\n');

                lines.forEach((line, index) => {
                  if (todoPatterns.test(line)) {
                    todos.push({
                      file: path.relative(process.cwd(), fullPath),
                      line: index + 1,
                      content: line.trim(),
                    });
                  }
                });
              } catch (readError) {
                // Skip files that can't be read (binary files, etc.)
                console.warn(`Skipping file ${fullPath}: ${readError.message}`);
              }
            }
          }
        } catch (error) {
          console.warn(`Error reading directory ${dir}: ${error.message}`);
        }
      };

      await searchInDirectory(process.cwd());

      if (todos.length === 0) {
        return { count: 0, message: 'No TODOs found' };
      }

      return {
        count: todos.length,
        todos: todos.slice(0, 10), // Limit to first 10
        recommendations: [
          'Consider addressing high-priority TODOs',
          'Remove completed TODO comments',
        ],
      };
    } catch (error) {
      return { error: `Failed to analyze TODOs: ${error.message}` };
    }
  }

  async generateDailyReport() {
    const reportData = {
      timestamp: new Date().toISOString(),
      project: process.env.PROJECT_NAME || 'Unknown Project',
      summary: 'Daily AI workflow completed successfully',
    };

    const reportContent = `
# Daily AI Report - ${new Date().toLocaleDateString()}

## Project: ${reportData.project}

## Summary
${reportData.summary}

## Generated Files
- Code Analysis: \`temp/ai-outputs/code-analysis-${this.timestamp}.md\`
- Daily Report: \`temp/ai-outputs/daily-report-${this.timestamp}.json\`

## Next Steps
1. Review code analysis insights
2. Address any identified issues
3. Update documentation if needed
4. Plan tomorrow's development tasks

---
*Generated by CopilotFlow AI Assistant*
    `;

    await fs.writeFile(
      path.join(this.outputDir, `daily-report-${this.timestamp}.md`),
      reportContent
    );

    await fs.writeFile(
      path.join(this.outputDir, `daily-report-${this.timestamp}.json`),
      JSON.stringify(reportData, null, 2)
    );

    return reportData;
  }

  getGitChanges() {
    try {
      return execSync('git diff HEAD~1 HEAD', { encoding: 'utf-8' });
    } catch (error) {
      try {
        return execSync('git diff --cached', { encoding: 'utf-8' });
      } catch (error2) {
        return '';
      }
    }
  }

  async getProjectFiles() {
    const files = [];
    const walk = async dir => {
      const items = await fs.readdir(dir);
      for (const item of items) {
        if (item.startsWith('.') || item === 'node_modules') continue;
        const fullPath = path.join(dir, item);
        const stat = await fs.stat(fullPath);
        if (stat.isDirectory()) {
          await walk(fullPath);
        } else {
          files.push(fullPath);
        }
      }
    };
    await walk(process.cwd());
    return files;
  }

  async saveResults(results) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      workflow: 'daily-ai-workflow',
      results,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        cwd: process.cwd(),
      },
    };

    await fs.writeFile(
      path.join(this.logsDir, `daily-workflow-${this.timestamp}.json`),
      JSON.stringify(logEntry, null, 2)
    );
  }
}

// Run the workflow if called directly
if (require.main == module) {
  const workflow = new DailyAIWorkflow();
  workflow.run().catch(console.error);
}

module.exports = DailyAIWorkflow;

// Refactor exception handling to meet lint requirements
// Only catch exceptions if necessary, otherwise let them propagate
