#!/usr/bin/env node

/**
 * AI Commit Message Generator
 * Generates meaningful commit messages based on git changes
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
    '⚠️  Skipping AI commit message generation: No OpenAI API key found in environment.'
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

class CommitMessageGenerator {
  constructor() {
    this.config = this.loadProjectConfig();
  }

  loadProjectConfig() {
    const configPath = path.join(process.cwd(), '.copilotflow', 'config.json');
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
    return { primaryLanguage: 'javascript', projectType: 'general' };
  }

  async generateCommitMessage() {
    console.log('🤖 Generating AI commit message...\n');

    try {
      const gitDiff = this.getGitChanges();
      const gitStatus = this.getGitStatus();

      if (!gitDiff.trim() && !gitStatus.trim()) {
        console.log('❌ No changes detected. Stage your changes first.');
        return;
      }

      const commitMessage = await this.generateMessage(gitDiff, gitStatus);

      console.log('📝 Generated commit message:');
      console.log('='.repeat(50));
      console.log(commitMessage);
      console.log('='.repeat(50));

      console.log('\nTo use this commit message:');
      console.log(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`);
    } catch (error) {
      console.error('💥 Failed to generate commit message:', error.message);
      process.exit(1);
    }
  }

  async generateMessage(gitDiff, gitStatus) {
    const prompt = `
    Generate a clear, conventional commit message for this ${this.config.primaryLanguage} project:
    
    Project Type: ${this.config.projectType}
    Primary Language: ${this.config.primaryLanguage}
    
    Git Status:
    ${gitStatus}
    
    Git Diff (first 2000 chars):
    ${gitDiff.substring(0, 2000)}
    
    Rules:
    1. Use conventional commit format: type(scope): description
    2. Types: feat, fix, docs, style, refactor, test, chore
    3. Keep description under 50 characters
    4. Be specific and clear about ${this.config.primaryLanguage} changes
    5. Focus on WHAT changed, not HOW
    6. Consider ${this.config.primaryLanguage} conventions
    
    Examples:
    - feat(auth): add user login functionality
    - fix(api): resolve timeout issue in user endpoint
    - docs(readme): update installation instructions
    - refactor(utils): simplify error handling logic
    
    Generate only the commit message, no additional text.
    `;

    const response = await openai.chat.completions.create({
      model: aiModel,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 100,
    });

    return response.choices[0].message.content.trim();
  }

  getGitChanges() {
    try {
      // Try to get staged changes first
      const staged = execSync('git diff --cached', { encoding: 'utf-8' });
      if (staged.trim()) {
        return staged;
      }

      // Fall back to unstaged changes
      return execSync('git diff', { encoding: 'utf-8' });
    } catch (error) {
      return '';
    }
  }

  getGitStatus() {
    try {
      return execSync('git status --porcelain', { encoding: 'utf-8' });
    } catch (error) {
      return '';
    }
  }
}

// Run the generator if called directly
if (require.main === module) {
  const generator = new CommitMessageGenerator();
  generator.generateCommitMessage().catch(console.error);
}

module.exports = CommitMessageGenerator;
