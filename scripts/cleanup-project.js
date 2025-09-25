#!/usr/bin/env node

/**
 * CopilotFlow Project Cleanup & Reset
 * Resets the project to its base state by cleaning up generated files and configurations
 */

const fs = require('fs-extra');
const path = require('path');
const readline = require('readline');

class ProjectCleanup {
  constructor() {
    this.projectRoot = process.cwd();
    this.backupBaseDir = path.join(this.projectRoot, '.cleanup-backups');
  }

  generateBackupName(description = '') {
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, 19);
    const desc = description
      ? `-${description.replace(/[^a-zA-Z0-9]/g, '-')}`
      : '';
    return `backup-${timestamp}${desc}`;
  }

  async createBackup(description = '') {
    const backupName = this.generateBackupName(description);
    const backupDir = path.join(this.backupBaseDir, backupName);

    console.log(`📦 Creating backup: ${backupName}...`);

    await fs.ensureDir(backupDir);

    // Create backup metadata
    const metadata = {
      name: backupName,
      description: description || 'Auto-generated backup',
      timestamp: new Date().toISOString(),
      projectState: await this.getProjectState(),
    };

    await fs.writeJson(path.join(backupDir, 'metadata.json'), metadata, {
      spaces: 2,
    });

    // Backup critical files and directories
    const itemsToBackup = [
      { src: '.env', dest: '.env', required: false },
      { src: 'docs', dest: 'docs', required: false },
      { src: 'logs', dest: 'logs', required: false },
      { src: 'temp', dest: 'temp', required: false },
      { src: 'dist', dest: 'dist', required: false },
      { src: 'build', dest: 'build', required: false },
    ];

    for (const item of itemsToBackup) {
      const srcPath = path.join(this.projectRoot, item.src);
      const destPath = path.join(backupDir, item.dest);

      try {
        if (await fs.pathExists(srcPath)) {
          await fs.copy(srcPath, destPath);
          console.log(`  ✅ Backed up: ${item.src}`);
        }
      } catch (error) {
        if (item.required) {
          throw error;
        }
        console.log(`  ⚠️ Skipped: ${item.src} (${error.message})`);
      }
    }

    console.log(`✅ Backup created: ${backupName}\n`);
    return backupName;
  }

  async cleanup() {
    console.log('🧹 CopilotFlow Project Cleanup Starting...\n');

    try {
      // Create backup before cleanup
      await this.createBackup('Pre-cleanup backup');

      // Clean generated documentation
      await this.cleanGeneratedDocs();

      // Clean logs and AI outputs
      await this.cleanLogsAndOutputs();

      // Reset environment configuration
      await this.resetEnvironmentConfig();

      // Clean build artifacts
      await this.cleanBuildArtifacts();

      // Clean temporary files
      await this.cleanTempFiles();

      // Reset git state (optional)
      await this.resetGitState();

      // Show completion message
      this.showCompletionMessage();
    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
      console.log('\n🔄 Attempting to restore from most recent backup...');

      const backups = await this.listBackups();
      if (backups.length > 0) {
        await this.restoreFromBackup(backups[0].name);
      } else {
        console.log('❌ No backups available for restoration.');
      }
    }
  }

  async getProjectState() {
    return {
      envExists: await fs.pathExists('.env'),
      docsExists: await fs.pathExists('docs'),
      logsExists: await fs.pathExists('logs'),
      tempExists: await fs.pathExists('temp'),
    };
  }

  async cleanGeneratedDocs() {
    console.log('📚 Cleaning generated documentation...');

    const generatedDocs = [
      'docs/ARCHITECTURE.md',
      'docs/CONTRIBUTING.md',
      'docs/DEVELOPER_GUIDE.md',
      'docs/INSTALLATION.md',
      'docs/MODULES.md',
      'docs/USER_GUIDE.md',
      // Keep docs/README.md and docs/ai-prompts/ as they are base files
    ];

    // Remove MVE documentation artifacts
    const mveDocs = [
      'docs/PROJECT_CONTEXT.md',
      'docs/EXPERIMENT_LOG.md',
      'docs/RESULTS_REVIEW.md',
      'docs/REFERENCES.md',
    ];

    for (const doc of generatedDocs) {
      const docPath = path.join(this.projectRoot, doc);
      if (await fs.pathExists(docPath)) {
        await fs.remove(docPath);
        console.log(`   🗑️  Removed ${doc}`);
      }
    }
    for (const doc of mveDocs) {
      const docPath = path.join(this.projectRoot, doc);
      if (await fs.pathExists(docPath)) {
        await fs.remove(docPath);
        console.log(`   🗑️  Removed ${doc}`);
      }
    }
    console.log();
  }

  async cleanLogsAndOutputs() {
    console.log('📋 Cleaning logs and AI outputs...');

    const dirsToClean = ['logs/ai-conversations', 'temp/ai-outputs'];

    for (const dir of dirsToClean) {
      const dirPath = path.join(this.projectRoot, dir);
      if (await fs.pathExists(dirPath)) {
        // Keep the directory but clean its contents
        const files = await fs.readdir(dirPath);
        for (const file of files) {
          await fs.remove(path.join(dirPath, file));
        }
        console.log(`   🗑️  Cleaned ${dir}/`);
      }
    }
    console.log();
  }

  async resetEnvironmentConfig() {
    console.log('⚙️  Resetting environment configuration...');

    // Reset .env to .env.example
    const envExamplePath = path.join(this.projectRoot, '.env.example');
    const envPath = path.join(this.projectRoot, '.env');

    if (await fs.pathExists(envExamplePath)) {
      await fs.copy(envExamplePath, envPath);
      console.log('   ✅ Reset .env from .env.example');
    }

    // Reset .copilotflow.json to default state
    const defaultConfig = {
      project: {
        name: 'CopilotFlow',
        version: '1.0.0',
        description: 'An AI-powered project built with CopilotFlow',
        language: 'auto-detect',
      },
      ai: {
        provider: 'OpenAI',
        model: 'gpt-4',
        enabled: true,
        features: {
          code_analysis: true,
          documentation_generation: true,
          commit_messages: true,
          code_review: true,
        },
      },
      automation: {
        daily_workflow: true,
        auto_commit_messages: false,
        auto_documentation: false,
      },
      output: {
        verbose: true,
        save_conversations: true,
        log_level: 'INFO',
      },
    };

    const configPath = path.join(this.projectRoot, '.copilotflow.json');
    await fs.writeJson(configPath, defaultConfig, { spaces: 2 });
    console.log('   ✅ Reset .copilotflow.json to defaults');
    console.log();
  }

  async cleanBuildArtifacts() {
    console.log('🔧 Cleaning build artifacts...');

    const artifactsToClean = [
      'dist/',
      'build/',
      '.next/',
      'coverage/',
      '__pycache__/',
      '*.pyc',
      '.pytest_cache/',
      '.tox/',
    ];

    for (const artifact of artifactsToClean) {
      if (artifact.includes('*')) {
        // Handle glob patterns
        try {
          const files = require('glob').sync(artifact);
          for (const file of files) {
            await fs.remove(file);
            console.log(`   🗑️  Removed ${file}`);
          }
        } catch (error) {
          // Glob not available, skip this pattern
          console.log(
            `   ℹ️  Skipping pattern ${artifact} (glob not available)`
          );
          console.error('Error during cleanup pattern:', error);
        }
      } else {
        const artifactPath = path.join(this.projectRoot, artifact);
        if (await fs.pathExists(artifactPath)) {
          await fs.remove(artifactPath);
          console.log(`   🗑️  Removed ${artifact}`);
        }
      }
    }
    console.log();
  }

  async cleanTempFiles() {
    console.log('🗂️  Cleaning temporary files...');

    // Only clean specific temp files, not logs in logs/ directory
    const tempFilesToRemove = [
      'debug.log',
      'error.log',
      'npm-debug.log*',
      'yarn-debug.log*',
      'yarn-error.log*',
    ];

    for (const tempFile of tempFilesToRemove) {
      const tempPath = path.join(this.projectRoot, tempFile);
      if (await fs.pathExists(tempPath)) {
        await fs.remove(tempPath);
        console.log(`   🗑️  Removed ${tempFile}`);
      }
    }
    console.log();
  }

  async resetGitState() {
    console.log('🔄 Git state reset options:');
    console.log('   ℹ️  Skipping git reset (preserve your work)');
    console.log(
      '   ℹ️  To reset git manually: git checkout . && git clean -fd'
    );
    console.log();
  }

  async listBackups() {
    if (!(await fs.pathExists(this.backupBaseDir))) {
      console.log('📭 No backups found.');
      return [];
    }

    const backupDirs = await fs.readdir(this.backupBaseDir);
    const backups = [];

    for (const dir of backupDirs) {
      const metadataPath = path.join(this.backupBaseDir, dir, 'metadata.json');
      if (await fs.pathExists(metadataPath)) {
        const metadata = await fs.readJson(metadataPath);
        backups.push({
          name: dir,
          ...metadata,
          path: path.join(this.backupBaseDir, dir),
        });
      }
    }

    // Sort by timestamp (newest first)
    backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return backups;
  }

  async askQuestion(question) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise(resolve => {
      rl.question(question, answer => {
        rl.close();
        resolve(answer);
      });
    });
  }

  async confirmAction(message) {
    const answer = await this.askQuestion(`${message} (y/N): `);
    return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
  }

  async selectBackupInteractively() {
    const backups = await this.listBackups();

    if (backups.length === 0) {
      console.log('❌ No backups available for restoration.');
      return null;
    }

    console.log('\n📋 Available Backups:');

    backups.forEach((backup, index) => {
      const date = new Date(backup.timestamp).toLocaleString();
      console.log(`${index + 1}. ${backup.description} (${date})`);
    });
    console.log(`${backups.length + 1}. Cancel restoration`);

    const answer = await this.askQuestion(
      `\nSelect a backup to restore (1-${backups.length + 1}): `
    );
    const selection = parseInt(answer);

    if (isNaN(selection) || selection < 1 || selection > backups.length + 1) {
      console.log('❌ Invalid selection.');
      return null;
    }

    if (selection === backups.length + 1) {
      console.log('🚫 Restoration cancelled.');
      return null;
    }

    return backups[selection - 1].name;
  }

  async restoreFromBackup(backupName = null) {
    try {
      let targetBackup = backupName;

      if (!targetBackup) {
        targetBackup = await this.selectBackupInteractively();
        if (!targetBackup) {
          console.log('🚫 Restoration cancelled.');
          return;
        }
      }

      const backupPath = path.join(this.backupBaseDir, targetBackup);

      if (!(await fs.pathExists(backupPath))) {
        throw new Error(`Backup '${targetBackup}' not found`);
      }

      console.log(`🔄 Restoring from backup: ${targetBackup}...`);

      // Restore files
      const itemsToRestore = ['.env', 'docs', 'logs', 'temp', 'dist', 'build'];

      for (const item of itemsToRestore) {
        const backupItemPath = path.join(backupPath, item);
        const targetPath = path.join(this.projectRoot, item);

        if (await fs.pathExists(backupItemPath)) {
          // Remove existing if it exists
          if (await fs.pathExists(targetPath)) {
            await fs.remove(targetPath);
          }
          await fs.copy(backupItemPath, targetPath);
          console.log(`  ✅ Restored: ${item}`);
        }
      }

      console.log(`✅ Successfully restored from backup: ${targetBackup}\n`);
    } catch (error) {
      console.error('❌ Restore failed:', error.message);
      throw error;
    }
  }

  async manageBackups() {
    const backups = await this.listBackups();

    if (backups.length === 0) {
      console.log('📭 No backups to manage.');
      return;
    }

    console.log('\n📋 Backup Management:');
    backups.forEach((backup, index) => {
      const date = new Date(backup.timestamp).toLocaleString();
      console.log(`${index + 1}. ${backup.description} (${date})`);
    });

    console.log('\nAvailable actions:');
    console.log('1. List backups');
    console.log('2. Delete old backups');
    console.log('3. Exit');

    const answer = await this.askQuestion('What would you like to do? (1-3): ');
    const action = parseInt(answer);

    switch (action) {
      case 2:
        await this.deleteOldBackups();
        break;
      case 1:
        // Already listed above
        break;
      default:
        console.log('👋 Exiting backup management.');
    }
  }

  async deleteOldBackups() {
    const backups = await this.listBackups();

    if (backups.length <= 3) {
      console.log('💡 Keeping all backups (3 or fewer exist).');
      return;
    }

    const confirm = await this.confirmAction(
      `Delete backups older than the 3 most recent? (${backups.length - 3} will be deleted)`
    );

    if (confirm) {
      const toDelete = backups.slice(3);
      for (const backup of toDelete) {
        await fs.remove(backup.path);
        console.log(`🗑️ Deleted: ${backup.description}`);
      }
      console.log(`✅ Deleted ${toDelete.length} old backups.`);
    } else {
      console.log('🚫 Deletion cancelled.');
    }
  }

  showCompletionMessage() {
    console.log('🎉 Project cleanup completed successfully!\n');

    console.log('📋 What was cleaned:');
    console.log('   • Generated documentation files');
    console.log('   • AI conversation logs');
    console.log('   • Temporary outputs');
    console.log('   • Build artifacts');
    console.log('   • Environment configuration reset');
    console.log();

    console.log('📁 What was preserved:');
    console.log('   • Source code files');
    console.log('   • node_modules/');
    console.log('   • .git/ directory');
    console.log('   • Base documentation templates');
    console.log('   • Package.json and dependencies');
    console.log();

    console.log('🚀 Next steps:');
    console.log('   1. Configure your .env file with your API keys');
    console.log('   2. Run: npm run setup');
    console.log('   3. Run: npm run ai:daily-workflow');
    console.log();

    console.log('💾 Backup available at: .cleanup-backup/');
    console.log('   (Automatically removed after successful cleanup)');
  }

  // Cleanup the backup directory
  async removeBackup() {
    if (await fs.pathExists(this.backupDir)) {
      await fs.remove(this.backupDir);
      console.log('🗑️  Removed backup files');
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const cleanup = new ProjectCleanup();

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
CopilotFlow Project Cleanup & Reset

Usage: node scripts/cleanup-project.js [options]

Options:
  --help, -h          Show this help message
  --backup-only       Create a backup with optional description
  --restore           Interactively restore from available backups
  --list-backups      List all available backups
  --manage-backups    Manage (list/delete) backups
  --description "..."  Add description to backup (use with --backup-only)

Examples:
  node scripts/cleanup-project.js                                    # Full cleanup
  node scripts/cleanup-project.js --backup-only                      # Create backup only
  node scripts/cleanup-project.js --backup-only --description "v1.0" # Named backup
  node scripts/cleanup-project.js --restore                          # Interactive restore
  node scripts/cleanup-project.js --list-backups                     # List backups
  node scripts/cleanup-project.js --manage-backups                   # Manage backups

This script will reset your CopilotFlow project to its base state by:
• Removing generated documentation
• Clearing AI conversation logs  
• Cleaning temporary files and build artifacts
• Resetting environment configuration to defaults
• Preserving source code and dependencies

A timestamped backup is automatically created before cleanup.
`);
    return;
  }

  if (args.includes('--list-backups')) {
    const backups = await cleanup.listBackups();
    if (backups.length === 0) {
      console.log('📭 No backups found.');
    } else {
      console.log('\n📋 Available Backups:');
      backups.forEach((backup, index) => {
        const date = new Date(backup.timestamp).toLocaleString();
        console.log(`${index + 1}. ${backup.description} (${date})`);
      });
    }
    return;
  }

  if (args.includes('--manage-backups')) {
    await cleanup.manageBackups();
    return;
  }

  if (args.includes('--backup-only')) {
    const descIndex = args.indexOf('--description');
    const description =
      descIndex !== -1 && args[descIndex + 1]
        ? args[descIndex + 1]
        : 'Manual backup';

    await cleanup.createBackup(description);
    console.log('✅ Backup created successfully');
    return;
  }

  if (args.includes('--restore')) {
    await cleanup.restoreFromBackup();
    return;
  }

  // Default: full cleanup
  await cleanup.cleanup();
}

// Run if called directly
if (require.main == module) {
  main().catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}

module.exports = ProjectCleanup;
