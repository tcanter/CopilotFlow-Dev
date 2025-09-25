#!/usr/bin/env node

/**
 * QA Validation Script
 * Validates project configuration and GitHub workflows to catch common issues
 */

const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');

class QAValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.projectRoot = process.cwd();
  }

  /**
   * Run all validation checks with optional auto-fix
   */
  async runAll(autoFix = false) {
    console.log('🔍 Running QA Validation Checks...\n');

    try {
      if (autoFix) {
        await this.autoFixEnvironmentIssues();
      }

      await this.validateGitHubWorkflows();
      await this.validatePackageJson();
      await this.validateProjectStructure();
      await this.validateScripts();
      await this.validateTests();
      await this.validateShellCommands();
      await this.validateShellCommands();

      this.printResults();

      if (this.errors.length > 0) {
        console.log('\n💡 Tip: Run with --fix flag to auto-fix some issues:');
        console.log('   npm run qa:fix\n');
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ QA Validation failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Validate GitHub workflows for common issues
   */
  async validateGitHubWorkflows() {
    console.log('📋 Validating GitHub Workflows...');

    const workflowsDir = path.join(this.projectRoot, '.github', 'workflows');

    if (!(await fs.pathExists(workflowsDir))) {
      this.warnings.push('No .github/workflows directory found');
      return;
    }

    const workflowFiles = await fs.readdir(workflowsDir);
    const yamlFiles = workflowFiles.filter(
      file => file.endsWith('.yml') || file.endsWith('.yaml')
    );

    for (const file of yamlFiles) {
      await this.validateWorkflowFile(path.join(workflowsDir, file));
    }
  }

  /**
   * Validate individual workflow file
   */
  async validateWorkflowFile(filePath) {
    const fileName = path.basename(filePath);

    try {
      const content = await fs.readFile(filePath, 'utf8');
      const workflow = yaml.load(content);

      // Check for environment references
      this.checkEnvironmentReferences(workflow, fileName);

      // Check for secret references
      this.checkSecretReferences(workflow, fileName);

      // Check for action versions
      this.checkActionVersions(workflow, fileName);

      // Check for required fields
      this.checkRequiredWorkflowFields(workflow, fileName);
    } catch (error) {
      this.errors.push(
        `Failed to parse workflow ${fileName}: ${error.message}`
      );
    }
  }

  /**
   * Check for environment references that might not exist and provide fixes
   */
  checkEnvironmentReferences(workflow, fileName) {
    const content = JSON.stringify(workflow);
    const environmentMatches = content.match(/"environment":\s*"([^"]+)"/g);

    if (environmentMatches) {
      environmentMatches.forEach(match => {
        const envName = match.match(/"environment":\s*"([^"]+)"/)[1];
        this.warnings.push(
          `${fileName}: References environment '${envName}'. This will cause "Value '${envName}' is not valid" error if environment doesn't exist in GitHub.`
        );
        this.warnings.push(
          `Fix: Either create the '${envName}' environment in GitHub repository settings, or comment out the environment line.`
        );
      });
    }

    // Also check for commented environment references to suggest when they can be enabled
    const fileContent = require('fs').readFileSync(
      path.join(this.projectRoot, '.github', 'workflows', fileName),
      'utf8'
    );
    const commentedEnvMatches = fileContent.match(/#\s*environment:\s*(\w+)/g);

    if (commentedEnvMatches) {
      commentedEnvMatches.forEach(match => {
        const envName = match.match(/#\s*environment:\s*(\w+)/)[1];
        this.warnings.push(
          `${fileName}: Has commented environment '${envName}'. Uncomment when the environment is created in GitHub.`
        );
      });
    }
  }

  /**
   * Auto-fix GitHub workflow environment issues
   */
  async autoFixEnvironmentIssues() {
    console.log('🔧 Auto-fixing GitHub environment issues...');

    const workflowsDir = path.join(this.projectRoot, '.github', 'workflows');
    if (!(await fs.pathExists(workflowsDir))) {
      return;
    }

    const workflowFiles = await fs.readdir(workflowsDir);
    const yamlFiles = workflowFiles.filter(
      file => file.endsWith('.yml') || file.endsWith('.yaml')
    );

    for (const file of yamlFiles) {
      const filePath = path.join(workflowsDir, file);
      await this.fixWorkflowEnvironments(filePath);
    }
  }

  /**
   * Fix environment references in a workflow file
   */
  async fixWorkflowEnvironments(filePath) {
    const fileName = path.basename(filePath);
    let content = await fs.readFile(filePath, 'utf8');
    let modified = false;

    // Find active environment references
    const environmentLines = content.match(/^(\s*)environment:\s*(\w+).*$/gm);

    if (environmentLines) {
      environmentLines.forEach(line => {
        const indent = line.match(/^(\s*)/)[1];
        const envName = line.match(/environment:\s*(\w+)/)[1];

        // Comment out the environment line with explanation
        const commentedLine = `${indent}# environment: ${envName}  # Uncomment when GitHub environment is created`;
        content = content.replace(line, commentedLine);
        modified = true;

        console.log(
          `  ✅ Commented out environment '${envName}' in ${fileName}`
        );
      });
    }

    if (modified) {
      await fs.writeFile(filePath, content);
      console.log(
        `  💾 Updated ${fileName} to fix environment validation issues`
      );
    }
  }

  /**
   * Check for secret references
   */
  checkSecretReferences(workflow, fileName) {
    const content = JSON.stringify(workflow);
    const secretMatches = content.match(/\$\{\{\s*secrets\.([A-Z_]+)\s*\}\}/g);

    if (secretMatches) {
      const secrets = [
        ...new Set(
          secretMatches.map(
            match => match.match(/\$\{\{\s*secrets\.([A-Z_]+)\s*\}\}/)[1]
          )
        ),
      ];

      this.warnings.push(
        `${fileName}: References secrets: ${secrets.join(', ')}. Ensure these are configured in GitHub repository settings.`
      );
    }
  }

  /**
   * Check action versions for security and compatibility
   */
  checkActionVersions(workflow, fileName) {
    const content = JSON.stringify(workflow);
    const actionMatches = content.match(/"uses":\s*"([^"]+)"/g);

    if (actionMatches) {
      actionMatches.forEach(match => {
        const action = match.match(/"uses":\s*"([^"]+)"/)[1];

        // Check for actions without version tags
        if (!action.includes('@') && !action.startsWith('./')) {
          this.errors.push(
            `${fileName}: Action '${action}' should specify a version (e.g., @v4)`
          );
        }

        // Check for outdated common actions
        if (action.includes('actions/checkout@v3')) {
          this.warnings.push(
            `${fileName}: Consider upgrading actions/checkout to @v4`
          );
        }
        if (action.includes('actions/setup-node@v3')) {
          this.warnings.push(
            `${fileName}: Consider upgrading actions/setup-node to @v4`
          );
        }
      });
    }
  }

  /**
   * Check required workflow fields
   */
  checkRequiredWorkflowFields(workflow, fileName) {
    if (!workflow.name) {
      this.errors.push(`${fileName}: Missing required 'name' field`);
    }

    if (!workflow.on) {
      this.errors.push(`${fileName}: Missing required 'on' field`);
    }

    if (!workflow.jobs || Object.keys(workflow.jobs).length === 0) {
      this.errors.push(`${fileName}: Missing or empty 'jobs' field`);
    }
  }

  /**
   * Validate package.json configuration
   */
  async validatePackageJson() {
    console.log('📦 Validating package.json...');

    const packagePath = path.join(this.projectRoot, 'package.json');

    if (!(await fs.pathExists(packagePath))) {
      this.errors.push('package.json not found');
      return;
    }

    try {
      const packageJson = await fs.readJson(packagePath);

      // Check required fields
      const requiredFields = ['name', 'version', 'scripts'];
      requiredFields.forEach(field => {
        if (!packageJson[field]) {
          this.errors.push(`package.json: Missing required field '${field}'`);
        }
      });

      // Check for script existence
      if (packageJson.scripts) {
        for (const [scriptName, scriptCommand] of Object.entries(
          packageJson.scripts
        )) {
          if (scriptCommand.includes('node scripts/')) {
            const scriptPath = scriptCommand.match(/node scripts\/([^\s]+)/);
            if (scriptPath) {
              const fullPath = path.join(
                this.projectRoot,
                'scripts',
                scriptPath[1]
              );
              if (!(await fs.pathExists(fullPath))) {
                this.errors.push(
                  `package.json: Script '${scriptName}' references non-existent file: ${fullPath}`
                );
              }
            }
          }
        }
      }
    } catch (error) {
      this.errors.push(`Failed to parse package.json: ${error.message}`);
    }
  }

  /**
   * Validate project structure
   */
  async validateProjectStructure() {
    console.log('📁 Validating project structure...');

    const requiredPaths = [
      'scripts',
      'tests',
      'docs',
      'README.md',
      'package.json',
    ];

    for (const reqPath of requiredPaths) {
      const fullPath = path.join(this.projectRoot, reqPath);
      if (!(await fs.pathExists(fullPath))) {
        this.warnings.push(`Missing recommended path: ${reqPath}`);
      }
    }

    // Check for common configuration files
    const configFiles = [
      '.eslintrc.js',
      'jest.config.js',
      'tsconfig.json',
      '.gitignore',
    ];

    for (const configFile of configFiles) {
      const fullPath = path.join(this.projectRoot, configFile);
      if (!(await fs.pathExists(fullPath))) {
        this.warnings.push(`Missing configuration file: ${configFile}`);
      }
    }
  }

  /**
   * Validate scripts directory
   */
  async validateScripts() {
    console.log('📜 Validating scripts...');

    const scriptsDir = path.join(this.projectRoot, 'scripts');

    if (!(await fs.pathExists(scriptsDir))) {
      this.warnings.push('No scripts directory found');
      return;
    }

    // Check if script files are executable (have proper shebang or are .js files)
    const scriptFiles = await this.getJavaScriptFiles(scriptsDir);

    for (const scriptFile of scriptFiles) {
      try {
        const content = await fs.readFile(scriptFile, 'utf8');

        // Check for shebang or proper Node.js structure
        if (
          !content.includes('#!/usr/bin/env node') &&
          !content.includes('require(') &&
          !content.includes('import ')
        ) {
          this.warnings.push(
            `Script ${path.relative(this.projectRoot, scriptFile)} might not be properly structured`
          );
        }

        // Check for error handling
        if (content.includes('process.exit(') && !content.includes('catch')) {
          this.warnings.push(
            `Script ${path.relative(this.projectRoot, scriptFile)} uses process.exit() but might lack error handling`
          );
        }
      } catch (error) {
        this.warnings.push(
          `Could not read script ${scriptFile}: ${error.message}`
        );
      }
    }
  }

  /**
   * Validate tests
   */
  async validateTests() {
    console.log('🧪 Validating tests...');

    const testsDir = path.join(this.projectRoot, 'tests');

    if (!(await fs.pathExists(testsDir))) {
      this.warnings.push('No tests directory found');
      return;
    }

    // Check Jest configuration
    const jestConfigPath = path.join(this.projectRoot, 'jest.config.js');
    if (!(await fs.pathExists(jestConfigPath))) {
      this.warnings.push(
        'No jest.config.js found - tests might not run properly'
      );
    }

    // Check for test files
    const testFiles = await this.getTestFiles(testsDir);

    if (testFiles.length === 0) {
      this.warnings.push('No test files found in tests directory');
    } else {
      console.log(`  Found ${testFiles.length} test files`);
    }

    // Validate test files
    for (const testFile of testFiles) {
      try {
        const content = await fs.readFile(testFile, 'utf8');

        // Check for proper test structure
        if (
          !content.includes('describe(') &&
          !content.includes('test(') &&
          !content.includes('it(')
        ) {
          this.warnings.push(
            `Test file ${path.relative(this.projectRoot, testFile)} might not contain valid tests`
          );
        }

        // Check for async cleanup
        if (content.includes('beforeEach') || content.includes('afterEach')) {
          if (!content.includes('await') && content.includes('cleanup')) {
            this.warnings.push(
              `Test file ${path.relative(this.projectRoot, testFile)} might need async cleanup`
            );
          }
        }
      } catch (error) {
        this.warnings.push(
          `Could not read test file ${testFile}: ${error.message}`
        );
      }
    }
  }

  /**
   * Validate shell command usage for reliability
   */
  async validateShellCommands() {
    console.log('🐚 Validating shell command usage...');

    const scriptFiles = await this.getJavaScriptFiles();
    const riskyPatterns = [
      {
        pattern: /execSync\([^)]*findstr/g,
        description: 'Windows findstr command can hang',
      },
      {
        pattern: /execSync\([^)]*grep.*-r/g,
        description: 'Recursive grep without timeout can hang',
      },
      {
        pattern: /execSync\([^)]*Get-ChildItem/g,
        description: 'PowerShell Get-ChildItem can be slow',
      },
      {
        pattern: /execSync\([^)]*\.exe.*\*\./g,
        description: 'Wildcard searches can hang',
      },
      {
        pattern: /execSync\([^)]*(?!.*timeout)/g,
        description: 'execSync without timeout can hang',
      },
    ];

    for (const file of scriptFiles) {
      try {
        const content = await fs.readFile(file, 'utf-8');

        for (const risk of riskyPatterns) {
          const matches = content.match(risk.pattern);
          if (matches) {
            this.warnings.push({
              file: path.relative(this.projectRoot, file),
              issue: `Potentially unreliable shell command: ${risk.description}`,
              suggestion:
                'Consider using Node.js built-in modules (fs, path) instead of shell commands',
              lines: this.findMatchingLines(content, risk.pattern),
            });
          }
        }

        // Check for execSync without timeout
        const execSyncMatches = content.match(/execSync\([^,)]+(?!.*timeout)/g);
        if (execSyncMatches) {
          this.warnings.push({
            file: path.relative(this.projectRoot, file),
            issue: 'execSync without timeout can cause hanging',
            suggestion: 'Add timeout option: execSync(cmd, { timeout: 10000 })',
            lines: this.findMatchingLines(
              content,
              /execSync\([^,)]+(?!.*timeout)/g
            ),
          });
        }
      } catch (error) {
        this.warnings.push({
          file: path.relative(this.projectRoot, file),
          issue: `Could not read file for shell command validation: ${error.message}`,
        });
      }
    }
  }

  /**
   * Get all JavaScript files for validation
   */
  async getJavaScriptFiles() {
    const files = [];

    const searchDirectory = async dir => {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (
          entry.isDirectory() &&
          !['node_modules', '.git', 'dist', 'build', 'coverage'].includes(
            entry.name
          )
        ) {
          await searchDirectory(fullPath);
        } else if (
          entry.isFile() &&
          (entry.name.endsWith('.js') || entry.name.endsWith('.ts'))
        ) {
          files.push(fullPath);
        }
      }
    };

    await searchDirectory(this.projectRoot);
    return files;
  }

  /**
   * Find line numbers where pattern matches
   */
  findMatchingLines(content, pattern) {
    const lines = content.split('\n');
    const matchingLines = [];

    lines.forEach((line, index) => {
      if (pattern.test(line)) {
        matchingLines.push(index + 1);
      }
    });

    return matchingLines;
  }

  /**
   * Get all test files
   */
  async getTestFiles(dir) {
    const files = [];

    async function scan(currentDir) {
      const items = await fs.readdir(currentDir);

      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = await fs.stat(fullPath);

        if (stat.isDirectory() && !item.startsWith('.')) {
          await scan(fullPath);
        } else if (
          stat.isFile() &&
          (item.endsWith('.test.js') || item.endsWith('.spec.js'))
        ) {
          files.push(fullPath);
        }
      }
    }

    await scan(dir);
    return files;
  }

  /**
   * Print validation results
   */
  printResults() {
    console.log('\n📊 QA Validation Results\n');

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('✅ All checks passed! No issues found.');
      return;
    }

    if (this.errors.length > 0) {
      console.log(`❌ ERRORS (${this.errors.length}):`);
      this.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
      console.log('');
    }

    if (this.warnings.length > 0) {
      console.log(`⚠️  WARNINGS (${this.warnings.length}):`);
      this.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning}`);
      });
      console.log('');
    }

    console.log('💡 RECOMMENDATIONS:');
    console.log('  1. Fix all errors before deploying');
    console.log('  2. Address warnings to improve reliability');
    console.log('  3. Run this validation script before each release');
    console.log('  4. Add this script to your CI/CD pipeline');
    console.log('');
  }
}

// Run validation if called directly
if (require.main === module) {
  const autoFix = process.argv.includes('--fix') || process.argv.includes('-f');
  const validator = new QAValidator();

  if (autoFix) {
    console.log('🔧 Running QA Validation with auto-fix enabled...\n');
  }

  validator.runAll(autoFix).catch(error => {
    console.error('💥 QA Validation crashed:', error);
    process.exit(1);
  });
}

module.exports = QAValidator;
