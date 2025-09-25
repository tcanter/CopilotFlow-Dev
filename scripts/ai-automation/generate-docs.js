#!/usr/bin/env node

/**
 * AI Documentation Generator
 * Automatically generates and updates project documentation
 * Supports JavaScript, Python, and PowerShell projects
 */

const fs = require('fs-extra');
const path = require('path');
// Load .env file with override to ensure .env values take precedence over system env vars
require('dotenv').config({ override: true });

// Skip AI analysis if no API key is set (local or CI)
const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
const hasAzureKey =
  !!process.env.AZURE_OPENAI_API_KEY && !!process.env.AZURE_OPENAI_ENDPOINT;
if (!hasOpenAIKey && !hasAzureKey) {
  console.warn(
    '⚠️  Skipping AI documentation generation: No OpenAI API key found in environment.'
  );
  process.exit(0);
}

const { OpenAI, AzureOpenAI } = require('openai');
// Configure OpenAI client based on provider
let openai;
let aiModel;
let isAzureOpenAI = false;

if (
  process.env.AI_PROVIDER === 'Azure OpenAI' &&
  process.env.AZURE_OPENAI_ENDPOINT
) {
  isAzureOpenAI = true;
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;

  console.log(`🔧 DEBUG - Azure OpenAI Client Configuration:`);
  console.log(
    `   API Key: ${apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT SET'}`
  );
  console.log(`   Endpoint: ${endpoint}`);
  console.log(`   API Version: ${apiVersion}`);
  console.log(`   Deployment: ${deployment}`);

  openai = new AzureOpenAI({
    endpoint,
    apiKey,
    apiVersion,
    deployment,
  });

  // For Azure OpenAI, the model is determined by the deployment
  aiModel = deployment || 'gpt-4';
} else {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  aiModel = process.env.AI_MODEL || 'gpt-4';
}

// Helper function to create API request parameters
function createChatRequest(messages, options = {}) {
  const baseParams = {
    messages,
    temperature: options.temperature || 0.3,
    max_tokens: options.max_tokens,
  };

  // For Azure OpenAI, don't include model parameter (it's implicit in deployment)
  // For regular OpenAI, include the model parameter
  if (!isAzureOpenAI) {
    baseParams.model = aiModel;
  }

  return baseParams;
}

console.log(`🤖 Using AI Provider: ${process.env.AI_PROVIDER || 'OpenAI'}`);
console.log(`🎯 Model/Deployment: ${aiModel}`);
console.log(`🔗 Azure Endpoint: ${process.env.AZURE_OPENAI_ENDPOINT}`);
console.log(`📋 Azure Deployment: ${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`);
console.log(
  `🔑 Azure Deployment Name: ${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`
);
console.log(`🔑 Azure Endpoint: ${process.env.AZURE_OPENAI_ENDPOINT}`);

class DocumentationGenerator {
  constructor() {
    this.outputDir = path.join(process.cwd(), 'docs');
    this.tempDir = path.join(process.cwd(), 'temp', 'ai-outputs');
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.projectConfig = this.loadProjectConfig();

    fs.ensureDirSync(this.outputDir);
    fs.ensureDirSync(this.tempDir);
  }

  loadProjectConfig() {
    try {
      const configPath = path.join(process.cwd(), '.copilotflow.json');
      if (fs.existsSync(configPath)) {
        return fs.readJsonSync(configPath);
      }
    } catch (error) {
      console.warn('⚠️ Could not load project config, using defaults');
    }

    // Default to JavaScript if no config found
    return { primaryLanguage: 'javascript', projectType: 'custom' };
  }

  async generate() {
    console.log('📝 Starting AI Documentation Generation...\n');
    console.log(
      `🔧 Detected language: ${this.projectConfig.primaryLanguage.toUpperCase()}\n`
    );

    try {
      // Language-specific task generation
      const tasks = this.getLanguageSpecificTasks();

      const results = {};

      for (const task of tasks) {
        console.log(`📋 Generating: ${task.name}`);
        results[task.name] = await task.fn();
        console.log(`✅ Completed: ${task.name}\n`);
      }

      await this.updateMainReadme();
      await this.generateIndex(results);

      console.log('🎉 Documentation generation completed!');
    } catch (error) {
      console.error('💥 Documentation generation failed:', error);
      process.exit(1);
    }
  }

  getLanguageSpecificTasks() {
    const commonTasks = [
      { name: 'User Guide', fn: () => this.generateUserGuide() },
      { name: 'Developer Guide', fn: () => this.generateDeveloperGuide() },
      {
        name: 'Architecture Overview',
        fn: () => this.generateArchitectureDocs(),
      },
      {
        name: 'Contributing Guide',
        fn: () => this.generateContributingGuide(),
      },
    ];

    switch (this.projectConfig.primaryLanguage) {
      case 'javascript':
        return [
          {
            name: 'API Documentation',
            fn: () => this.generateJavaScriptApiDocs(),
          },
          ...commonTasks,
          {
            name: 'Package Documentation',
            fn: () => this.generatePackageDocs(),
          },
        ];

      case 'python':
        return [
          { name: 'API Documentation', fn: () => this.generatePythonApiDocs() },
          ...commonTasks,
          { name: 'Module Documentation', fn: () => this.generateModuleDocs() },
          {
            name: 'Installation Guide',
            fn: () => this.generateInstallationGuide(),
          },
        ];

      case 'powershell':
        return [
          {
            name: 'Cmdlet Documentation',
            fn: () => this.generatePowerShellCmdletDocs(),
          },
          ...commonTasks,
          {
            name: 'Module Documentation',
            fn: () => this.generatePowerShellModuleDocs(),
          },
          {
            name: 'Usage Examples',
            fn: () => this.generatePowerShellExamples(),
          },
        ];

      default:
        return commonTasks;
    }
  }

  async generateJavaScriptApiDocs() {
    console.log(
      `🔧 DEBUG - generateJavaScriptApiDocs() using model: ${aiModel}`
    );
    const codeFiles = await this.getCodeFiles();
    const apiEndpoints = await this.extractApiEndpoints(codeFiles);

    if (apiEndpoints.length === 0) {
      return { message: 'No API endpoints found' };
    }

    const prompt = `
    Generate comprehensive API documentation for the following JavaScript endpoints:
    
    ${apiEndpoints
      .map(
        endpoint => `
    File: ${endpoint.file}
    Method: ${endpoint.method}
    Path: ${endpoint.path}
    Code: ${endpoint.code}
    `
      )
      .join('\n')}
    
    Please provide:
    1. Clear endpoint descriptions
    2. Request/response schemas
    3. Authentication requirements
    4. Example requests and responses
    5. Error codes and messages
    
    Format as Markdown with proper sections and examples.
    `;

    const response = await openai.chat.completions.create(
      createChatRequest([{ role: 'user', content: prompt }], {
        temperature: 0.3,
      })
    );

    const apiDocs = response.choices[0].message.content;

    await fs.writeFile(
      path.join(this.outputDir, 'API.md'),
      `# API Documentation\n\n${apiDocs}\n\n---\n*Generated by CopilotFlow AI on ${new Date().toLocaleString()}*`
    );

    return {
      endpointsDocumented: apiEndpoints.length,
      filePath: 'docs/API.md',
    };
  }

  async generatePythonApiDocs() {
    const codeFiles = await this.getCodeFiles('python');
    const apiEndpoints = await this.extractApiEndpoints(codeFiles, 'python');

    if (apiEndpoints.length === 0) {
      return { message: 'No API endpoints found' };
    }

    const prompt = `
    Generate comprehensive API documentation for the following Python endpoints:
    
    ${apiEndpoints
      .map(
        endpoint => `
    File: ${endpoint.file}
    Method: ${endpoint.method}
    Path: ${endpoint.path}
    Code: ${endpoint.code}
    `
      )
      .join('\n')}
    
    Please provide:
    1. Clear endpoint descriptions
    2. Request/response schemas
    3. Authentication requirements
    4. Example requests and responses
    5. Error codes and messages
    
    Format as Markdown with proper sections and examples.
    `;

    const response = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    const apiDocs = response.choices[0].message.content;

    await fs.writeFile(
      path.join(this.outputDir, 'API.md'),
      `# API Documentation\n\n${apiDocs}\n\n---\n*Generated by CopilotFlow AI on ${new Date().toLocaleString()}*`
    );

    return {
      endpointsDocumented: apiEndpoints.length,
      filePath: 'docs/API.md',
    };
  }

  async generateUserGuide() {
    const packageJson = await this.getPackageInfo();
    const readmeContent = await this.getReadmeContent();

    const prompt = `
    Create a comprehensive user guide for this project:
    
    Project: ${packageJson.name || 'Unknown'}
    Description: ${packageJson.description || 'No description'}
    
    Current README content:
    ${readmeContent}
    
    Generate a user-friendly guide that includes:
    1. Getting started instructions
    2. Installation guide
    3. Basic usage examples
    4. Common use cases
    5. Troubleshooting section
    6. FAQ
    
    Make it accessible to non-technical users where possible.
    `;

    const response = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
    });

    const userGuide = response.choices[0].message.content;

    await fs.writeFile(
      path.join(this.outputDir, 'USER_GUIDE.md'),
      `# User Guide\n\n${userGuide}\n\n---\n*Generated by CopilotFlow AI on ${new Date().toLocaleString()}*`
    );

    return { filePath: 'docs/USER_GUIDE.md' };
  }

  async generateDeveloperGuide() {
    const fileStructure = await this.getFileStructure();
    const packageJson = await this.getPackageInfo();
    const scripts = Object.keys(packageJson.scripts || {});

    const prompt = `
    Create a comprehensive developer guide for this project:
    
    Project Structure:
    ${fileStructure}
    
    Available Scripts:
    ${scripts.join(', ')}
    
    Dependencies:
    ${Object.keys(packageJson.dependencies || {}).join(', ')}
    
    Generate a developer guide that includes:
    1. Development environment setup
    2. Project structure explanation
    3. Code architecture overview
    4. Development workflow
    5. Testing guidelines
    6. Build and deployment process
    7. Contributing guidelines
    8. Code style and conventions
    
    Focus on helping new developers get up to speed quickly.
    `;

    const response = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    const devGuide = response.choices[0].message.content;

    await fs.writeFile(
      path.join(this.outputDir, 'DEVELOPER_GUIDE.md'),
      `# Developer Guide\n\n${devGuide}\n\n---\n*Generated by CopilotFlow AI on ${new Date().toLocaleString()}*`
    );

    return { filePath: 'docs/DEVELOPER_GUIDE.md' };
  }

  async generateArchitectureDocs() {
    const fileStructure = await this.getFileStructure();
    const packageJson = await this.getPackageInfo();

    const prompt = `
    Create detailed architecture documentation for this project:
    
    Project: ${packageJson.name}
    File Structure:
    ${fileStructure}
    
    Generate architecture documentation that includes:
    1. High-level architecture overview
    2. Component diagram (ASCII art)
    3. Data flow description
    4. Technology stack details
    5. Design patterns used
    6. Scalability considerations
    7. Integration points
    8. Security architecture
    
    Use diagrams and clear explanations.
    `;

    const response = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    const architectureDocs = response.choices[0].message.content;

    await fs.writeFile(
      path.join(this.outputDir, 'ARCHITECTURE.md'),
      `# Architecture Documentation\n\n${architectureDocs}\n\n---\n*Generated by CopilotFlow AI on ${new Date().toLocaleString()}*`
    );

    return { filePath: 'docs/ARCHITECTURE.md' };
  }

  async generateContributingGuide() {
    const packageJson = await this.getPackageInfo();

    const contributingGuide = `
# Contributing Guide

Thank you for your interest in contributing to ${packageJson.name || 'this project'}!

## Getting Started

1. **Fork the repository**
2. **Clone your fork locally**
   \`\`\`bash
   git clone https://github.com/tcanter/CopilotFlow.git
   cd ${packageJson.name || 'project-name'}
   \`\`\`

3. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

4. **Create a new branch**
   \`\`\`bash
   git checkout -b feature/your-feature-name
   \`\`\`

## Development Workflow

### 1. Code Style
- Follow the existing code style
- Run \`npm run lint\` to check for style issues
- Run \`npm run format\` to auto-format code

### 2. Testing
- Write tests for new features
- Run \`npm test\` to execute all tests
- Ensure all tests pass before submitting

### 3. AI-Assisted Development
- Use the AI automation scripts:
  - \`npm run ai:analyze-code\` - Analyze your changes
  - \`npm run ai:code-review\` - Get AI code review
  - \`npm run ai:generate-docs\` - Update documentation

### 4. Commit Guidelines
- Use clear, descriptive commit messages
- Use conventional commit format: \`type(scope): description\`
- Examples:
  - \`feat(auth): add user authentication\`
  - \`fix(api): resolve timeout issue\`
  - \`docs(readme): update installation guide\`

### 5. Pull Request Process
1. Update documentation if needed
2. Add tests for new functionality
3. Ensure CI passes
4. Request review from maintainers
5. Address feedback and update PR

## Types of Contributions

### 🐛 Bug Reports
- Use the bug report template
- Include steps to reproduce
- Provide environment details

### 💡 Feature Requests
- Use the feature request template
- Explain the use case
- Discuss implementation approach

### 📝 Documentation
- Fix typos and grammar
- Add examples and clarifications
- Update outdated information

### 🧪 Testing
- Add missing test cases
- Improve test coverage
- Fix flaky tests

## Code Review Process

1. All contributions require review
2. Reviewers will check:
   - Code quality and style
   - Test coverage
   - Documentation updates
   - Performance implications
   - Security considerations

## AI-Powered Development

This project uses AI tools for enhanced development:

- **Automated Code Review**: AI analyzes PRs for issues
- **Documentation Generation**: AI helps keep docs updated
- **Code Analysis**: Regular AI-powered code quality checks

## Community Guidelines

- Be respectful and inclusive
- Help others learn and grow
- Share knowledge and best practices
- Follow the code of conduct

## Questions?

- Open an issue for bugs or feature requests
- Use discussions for questions and ideas
- Check existing issues before creating new ones

---

*This guide was generated with assistance from CopilotFlow AI*
`;

    await fs.writeFile(
      path.join(this.outputDir, 'CONTRIBUTING.md'),
      contributingGuide
    );

    return { filePath: 'docs/CONTRIBUTING.md' };
  }

  async updateMainReadme() {
    const packageJson = await this.getPackageInfo();
    const existingReadme = await this.getReadmeContent();

    // Only update if README is minimal or missing
    if (existingReadme.length < 200 || existingReadme.includes('TODO')) {
      const prompt = `
      Generate an improved README.md for this project:
      
      Project: ${packageJson.name}
      Description: ${packageJson.description}
      Current README: ${existingReadme}
      
      Create a comprehensive README that includes:
      1. Project title and description
      2. Features and benefits
      3. Installation instructions
      4. Quick start guide
      5. Usage examples
      6. Documentation links
      7. Contributing information
      8. License information
      
      Make it professional and engaging.
      `;

      const response = await openai.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
      });

      await fs.writeFile('README.md', response.choices[0].message.content);
    }
  }

  async generateIndex(results) {
    const indexContent = `
# 📚 Documentation Index

Welcome to the project documentation!

## 📖 Available Documentation

### For Users
- **[User Guide](USER_GUIDE.md)** - Complete guide for end users
- **[API Documentation](API.md)** - API reference and examples

### For Developers
- **[Developer Guide](DEVELOPER_GUIDE.md)** - Development setup and workflow
- **[Architecture Documentation](ARCHITECTURE.md)** - System architecture overview
- **[Contributing Guide](CONTRIBUTING.md)** - How to contribute to the project

## 🤖 AI-Generated Content

This documentation was generated using CopilotFlow AI Assistant on ${new Date().toLocaleString()}.

### Generation Results:
${Object.entries(results)
  .map(
    ([name, result]) =>
      `- **${name}**: ${result.filePath ? `[${result.filePath}](${result.filePath.replace('docs/', '')})` : 'Generated'}`
  )
  .join('\n')}

## 🔄 Keeping Documentation Updated

To regenerate documentation:
\`\`\`bash
npm run ai:generate-docs
\`\`\`

---
*Documentation powered by CopilotFlow AI*
`;

    await fs.writeFile(path.join(this.outputDir, 'README.md'), indexContent);
  }

  async generatePowerShellCmdletDocs() {
    const psFiles = await this.getCodeFiles('powershell');
    const cmdlets = await this.extractPowerShellCmdlets(psFiles);

    if (cmdlets.length === 0) {
      return { message: 'No PowerShell cmdlets found' };
    }

    const prompt = `
    Generate comprehensive PowerShell cmdlet documentation for the following functions:
    
    ${cmdlets
      .map(
        cmdlet => `
    File: ${cmdlet.file}
    Function: ${cmdlet.name}
    Parameters: ${cmdlet.parameters}
    Synopsis: ${cmdlet.synopsis}
    Code: ${cmdlet.code}
    `
      )
      .join('\n')}
    
    Please provide:
    1. Detailed cmdlet descriptions
    2. Parameter explanations with types and examples
    3. Input/output descriptions
    4. Usage examples
    5. Common scenarios
    6. Notes and warnings
    
    Format as Markdown with proper PowerShell code blocks.
    `;

    const response = await openai.chat.completions.create({
      model: aiModel,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    const cmdletDocs = response.choices[0].message.content;

    await fs.writeFile(
      path.join(this.outputDir, 'CMDLETS.md'),
      `# PowerShell Cmdlet Documentation\n\n${cmdletDocs}\n\n---\n*Generated by CopilotFlow AI on ${new Date().toLocaleString()}*`
    );

    return {
      cmdletsDocumented: cmdlets.length,
      filePath: 'docs/CMDLETS.md',
    };
  }

  async generatePowerShellModuleDocs() {
    const manifestFile = await this.getPowerShellManifest();
    const moduleStructure = await this.getPowerShellModuleStructure();

    const prompt = `
    Generate comprehensive PowerShell module documentation for this module:
    
    Manifest Info:
    ${manifestFile}
    
    Module Structure:
    ${moduleStructure}
    
    Please provide:
    1. Module overview and purpose
    2. Installation instructions
    3. Import instructions
    4. Available functions and their purposes
    5. Module dependencies
    6. Version information
    7. Usage examples
    
    Format as Markdown with proper PowerShell code blocks.
    `;

    const response = await openai.chat.completions.create({
      model: aiModel,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    const moduleDocs = response.choices[0].message.content;

    await fs.writeFile(
      path.join(this.outputDir, 'MODULE.md'),
      `# PowerShell Module Documentation\n\n${moduleDocs}\n\n---\n*Generated by CopilotFlow AI on ${new Date().toLocaleString()}*`
    );

    return { filePath: 'docs/MODULE.md' };
  }

  async generatePowerShellExamples() {
    const psFiles = await this.getCodeFiles('powershell');
    const cmdlets = await this.extractPowerShellCmdlets(psFiles);

    const prompt = `
    Generate comprehensive usage examples for this PowerShell module:
    
    Available Functions:
    ${cmdlets.map(cmdlet => `- ${cmdlet.name}: ${cmdlet.synopsis}`).join('\n')}
    
    Project: ${this.projectConfig.projectName}
    Type: ${this.projectConfig.projectType}
    
    Please provide:
    1. Basic usage examples
    2. Advanced scenarios
    3. Real-world use cases
    4. Common workflows
    5. Error handling examples
    6. Best practices
    
    Format as Markdown with clear explanations and PowerShell code blocks.
    `;

    const response = await openai.chat.completions.create({
      model: aiModel,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.4,
    });

    const examples = response.choices[0].message.content;

    await fs.writeFile(
      path.join(this.outputDir, 'EXAMPLES.md'),
      `# Usage Examples\n\n${examples}\n\n---\n*Generated by CopilotFlow AI on ${new Date().toLocaleString()}*`
    );

    return { filePath: 'docs/EXAMPLES.md' };
  }

  async generateModuleDocs() {
    const pythonFiles = await this.getCodeFiles('python');
    const modules = await this.extractPythonModules(pythonFiles);

    const prompt = `
    Generate comprehensive Python module documentation for the following modules:
    
    ${modules
      .map(
        module => `
    Module: ${module.name}
    File: ${module.file}
    Classes: ${module.classes.join(', ')}
    Functions: ${module.functions.join(', ')}
    Docstring: ${module.docstring}
    `
      )
      .join('\n')}
    
    Please provide:
    1. Module overviews
    2. Class and function documentation
    3. Usage examples
    4. Import instructions
    5. Dependencies
    
    Format as Markdown with Python code examples.
    `;

    const response = await openai.chat.completions.create({
      model: aiModel,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    const moduleDocs = response.choices[0].message.content;

    await fs.writeFile(
      path.join(this.outputDir, 'MODULES.md'),
      `# Python Module Documentation\n\n${moduleDocs}\n\n---\n*Generated by CopilotFlow AI on ${new Date().toLocaleString()}*`
    );

    return {
      modulesDocumented: modules.length,
      filePath: 'docs/MODULES.md',
    };
  }

  async generateInstallationGuide() {
    const requirementsFile = await this.getPythonRequirements();
    const setupFile = await this.getPythonSetup();

    const prompt = `
    Generate a comprehensive installation guide for this Python project:
    
    Requirements:
    ${requirementsFile}
    
    Setup Info:
    ${setupFile}
    
    Project: ${this.projectConfig.projectName}
    Description: ${this.projectConfig.description}
    
    Please provide:
    1. System requirements
    2. Python version requirements
    3. Virtual environment setup
    4. Package installation steps
    5. Configuration instructions
    6. Verification steps
    7. Troubleshooting common issues
    
    Format as Markdown with clear step-by-step instructions.
    `;

    const response = await openai.chat.completions.create({
      model: aiModel,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    const installGuide = response.choices[0].message.content;

    await fs.writeFile(
      path.join(this.outputDir, 'INSTALLATION.md'),
      `# Installation Guide\n\n${installGuide}\n\n---\n*Generated by CopilotFlow AI on ${new Date().toLocaleString()}*`
    );

    return { filePath: 'docs/INSTALLATION.md' };
  }

  async generatePackageDocs() {
    const packageJson = await this.getPackageInfo();
    const scriptsInfo = await this.getScriptsInfo();

    const prompt = `
    Generate comprehensive package documentation for this JavaScript project:
    
    Package Info:
    ${JSON.stringify(packageJson, null, 2)}
    
    Available Scripts:
    ${scriptsInfo}
    
    Please provide:
    1. Package overview
    2. Scripts explanation
    3. Dependencies information
    4. Build and deployment instructions
    5. Testing instructions
    6. Development workflow
    
    Format as Markdown with clear sections.
    `;

    const response = await openai.chat.completions.create({
      model: aiModel,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    });

    const packageDocs = response.choices[0].message.content;

    await fs.writeFile(
      path.join(this.outputDir, 'PACKAGE.md'),
      `# Package Documentation\n\n${packageDocs}\n\n---\n*Generated by CopilotFlow AI on ${new Date().toLocaleString()}*`
    );

    return { filePath: 'docs/PACKAGE.md' };
  }

  // Helper methods
  async getCodeFiles(language = 'javascript') {
    try {
      const extensions = this.getLanguageExtensions(language);
      const files = [];

      const scanDir = dir => {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
          const fullPath = path.join(dir, item.name);
          if (
            item.isDirectory() &&
            !item.name.includes('node_modules') &&
            !item.name.startsWith('.')
          ) {
            scanDir(fullPath);
          } else if (item.isFile()) {
            const ext = path.extname(item.name).slice(1);
            if (extensions.includes(ext)) {
              files.push(fullPath);
            }
          }
        }
      };

      scanDir('.');
      return files.slice(0, 20);
    } catch (error) {
      return [];
    }
  }

  getLanguageExtensions(language = 'javascript') {
    switch (language) {
      case 'python':
        return ['py'];
      case 'powershell':
        return ['ps1'];
      default:
        return ['js', 'ts'];
    }
  }

  async extractApiEndpoints(files, language = 'javascript') {
    const endpoints = [];

    for (const file of files.slice(0, 10)) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        let patterns;

        switch (language) {
          case 'python':
            patterns = [
              /@app\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/g,
              /def\s+\w+\(['"`]([^'"`]+)['"`]/g,
            ];
            break;
          case 'powershell':
            patterns = [
              /function\s+\w+\s*\{[^}]*param\s*\(\s*\[string\]\s*\$Uri\s*\)/g,
            ];
            break;
          default:
            patterns = [
              /app\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/g,
              /router\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/g,
              /@(Get|Post|Put|Delete|Patch)\(['"`]([^'"`]+)['"`]/g,
            ];
        }

        for (const pattern of patterns) {
          let match;
          while ((match = pattern.exec(content)) !== null) {
            endpoints.push({
              file,
              method: match[1].toUpperCase(),
              path: match[2],
              code: content.slice(
                Math.max(0, match.index - 100),
                match.index + 200
              ),
            });
          }
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }

    return endpoints;
  }

  async extractPowerShellCmdlets(files) {
    const cmdlets = [];

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const pattern = /function\s+(\w+)\s*\{([^}]*)\}/g;
        let match;

        while ((match = pattern.exec(content)) !== null) {
          const paramsPattern = /\$([a-zA-Z_][a-zA-Z0-9_]*)/g;
          const synopsisPattern = /#\s+(.+?)(?=\n)/;

          const paramsMatch = [...match[2].matchAll(paramsPattern)];
          const synopsisMatch = synopsisPattern.exec(
            content.slice(0, match.index)
          );

          cmdlets.push({
            file,
            name: match[1],
            parameters: paramsMatch.map(p => p[1]),
            synopsis: synopsisMatch
              ? synopsisMatch[1]
              : 'No synopsis available',
            code: content.slice(
              Math.max(0, match.index - 100),
              match.index + 200
            ),
          });
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }

    return cmdlets;
  }

  async extractPythonModules(files) {
    const modules = [];

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        const moduleName = path.basename(file, '.py');

        // Extract classes
        const classPattern = /class\s+(\w+)[\s\S]*?:/g;
        const classes = [...content.matchAll(classPattern)].map(
          match => match[1]
        );

        // Extract functions
        const functionPattern = /def\s+(\w+)\s*\(/g;
        const functions = [...content.matchAll(functionPattern)].map(
          match => match[1]
        );

        // Extract module docstring
        const docstringPattern = /"""([\s\S]*?)"""/;
        const docstringMatch = content.match(docstringPattern);
        const docstring = docstringMatch ? docstringMatch[1].trim() : '';

        modules.push({
          name: moduleName,
          file,
          classes,
          functions,
          docstring,
        });
      } catch (error) {
        // Skip files that can't be read
      }
    }

    return modules;
  }

  async getPackageInfo() {
    try {
      return await fs.readJson('package.json');
    } catch (error) {
      return { name: 'Unknown Project', description: '' };
    }
  }

  async getReadmeContent() {
    try {
      return await fs.readFile('README.md', 'utf-8');
    } catch (error) {
      return '';
    }
  }

  async getFileStructure() {
    try {
      const extensions = ['js', 'ts', 'json', 'md'];
      const files = [];

      const scanDir = dir => {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        for (const item of items) {
          const fullPath = path.join(dir, item.name);
          if (
            item.isDirectory() &&
            !item.name.includes('node_modules') &&
            !item.name.startsWith('.')
          ) {
            scanDir(fullPath);
          } else if (item.isFile()) {
            const ext = path.extname(item.name).slice(1);
            if (extensions.includes(ext)) {
              files.push(fullPath);
            }
          }
        }
      };

      scanDir('.');
      return files.slice(0, 30).join('\n');
    } catch (error) {
      return 'Unable to generate file structure';
    }
  }

  async getPowerShellManifest() {
    try {
      const manifestFiles = await fs.readdir(process.cwd());
      const manifestFile = manifestFiles.find(file => file.endsWith('.psd1'));

      if (manifestFile) {
        return await fs.readFile(
          path.join(process.cwd(), manifestFile),
          'utf-8'
        );
      }
    } catch (error) {
      // No manifest found
    }

    return 'No PowerShell manifest file found';
  }

  async getPowerShellModuleStructure() {
    try {
      const structure = {};

      // Check for common PowerShell folders
      const folders = ['Public', 'Private', 'Tests'];
      for (const folder of folders) {
        const folderPath = path.join(process.cwd(), folder);
        if (await fs.pathExists(folderPath)) {
          const files = await fs.readdir(folderPath);
          structure[folder] = files.filter(file => file.endsWith('.ps1'));
        }
      }

      return JSON.stringify(structure, null, 2);
    } catch (error) {
      return 'Unable to determine module structure';
    }
  }

  async getPythonRequirements() {
    try {
      const requirementsPath = path.join(process.cwd(), 'requirements.txt');
      if (await fs.pathExists(requirementsPath)) {
        return await fs.readFile(requirementsPath, 'utf-8');
      }
    } catch (error) {
      // No requirements file
    }

    return 'No requirements.txt file found';
  }

  async getPythonSetup() {
    try {
      const setupPath = path.join(process.cwd(), 'setup.py');
      if (await fs.pathExists(setupPath)) {
        return await fs.readFile(setupPath, 'utf-8');
      }

      const pyprojectPath = path.join(process.cwd(), 'pyproject.toml');
      if (await fs.pathExists(pyprojectPath)) {
        return await fs.readFile(pyprojectPath, 'utf-8');
      }
    } catch (error) {
      // No setup file
    }

    return 'No setup.py or pyproject.toml file found';
  }

  async getScriptsInfo() {
    try {
      const packageJson = await this.getPackageInfo();
      const scripts = packageJson.scripts || {};

      return Object.entries(scripts)
        .map(([script, command]) => `${script}: ${command}`)
        .join('\n');
    } catch (error) {
      return 'No scripts information available';
    }
  }
}

// Run the generator if called directly
if (require.main === module) {
  const generator = new DocumentationGenerator();
  generator.generate().catch(console.error);
}

module.exports = DocumentationGenerator;
