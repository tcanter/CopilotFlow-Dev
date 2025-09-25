# 🧹 CopilotFlow Project Cleanup & Multi-Backup System

The CopilotFlow cleanup system provides a comprehensive solution for resetting your project to its
base state while maintaining multiple timestamped backups for safe restoration.

## 🎯 Quick Start

```bash
# Full cleanup with automatic backup
npm run cleanup

# Create a named backup only
npm run cleanup:backup

# Interactive restore from backups
npm run cleanup:restore

# List all available backups
npm run cleanup:list

# Manage backups (list/delete old ones)
npm run cleanup:manage
```

## 📋 Available Commands

### Main Operations

- **`npm run cleanup`** - Full project cleanup with automatic backup
- **`npm run cleanup:backup`** - Create backup only (no cleanup)
- **`npm run cleanup:restore`** - Interactive restoration from available backups

### Backup Management

- **`npm run cleanup:list`** - List all available backups with timestamps
- **`npm run cleanup:manage`** - Interactive backup management (delete old backups)

### Advanced Usage

```bash
# Create a named backup
node scripts/cleanup-project.js --backup-only --description "Version 1.0 Release"

# Get help
node scripts/cleanup-project.js --help
```

## 🔄 Multi-Backup System

### Timestamped Backups

Each backup is automatically named with:

- **Timestamp**: ISO format for precise ordering
- **Description**: User-provided or auto-generated
- **Metadata**: Project state information

Example backup name: `backup-2025-07-11T15-30-45-Version-1.0-Release`

### Interactive Restoration

When restoring, you can choose from:

1. **List of available backups** with descriptions and timestamps
2. **Newest first ordering** for easy selection
3. **Cancellation option** if you change your mind

### Automatic Management

- **Keeps 3 most recent** backups by default
- **Interactive deletion** of older backups
- **Metadata preservation** for backup information

## 🗂️ What Gets Backed Up

### Included in Backups

- **Environment configuration** (`.env`)
- **Generated documentation** (`docs/`)
- **AI conversation logs** (`logs/`)
- **Temporary files** (`temp/`)
- **Build artifacts** (`dist/`, `build/`)

### Preserved (Never Removed)

- **Source code files** (`.js`, `.ts`, `.py`, etc.)
- **Configuration files** (`package.json`, `tsconfig.json`)
- **Git repository** (`.git/`)
- **Node modules** (`node_modules/`)
- **Base documentation** (`README.md`, `docs/ai-prompts/`)

## 🧹 Cleanup Process

### 1. **Automatic Backup**

```
📦 Creating backup: backup-2025-07-11T15-30-45-Pre-cleanup-backup
  ✅ Backed up: .env
  ✅ Backed up: docs
  ✅ Backed up: logs
✅ Backup created: backup-2025-07-11T15-30-45-Pre-cleanup-backup
```

### 2. **Generated Documentation Cleanup**

- Removes AI-generated documentation files
- Preserves base documentation structure

### 3. **Logs & AI Outputs**

- Clears conversation logs
- Removes temporary AI outputs
- Resets AI conversation history

### 4. **Build Artifacts**

- Removes compiled files
- Clears cache directories
- Resets build outputs

### 5. **Environment Reset**

- Resets `.env` to template defaults
- Preserves `.env.example` as reference

## 🛡️ Safety Features

### Error Recovery

If cleanup fails:

```
❌ Cleanup failed: [error message]
🔄 Attempting to restore from most recent backup...
✅ Successfully restored from backup: [backup-name]
```

### Backup Verification

Each backup includes:

- **Metadata file** with backup information
- **Project state snapshot** for verification
- **Timestamp and description** for identification

### Interactive Confirmations

- **Backup deletion** requires confirmation
- **Restoration selection** with preview
- **Cancellation options** at key points

## 📁 Backup Structure

```
.cleanup-backups/
├── backup-2025-07-11T15-30-45-Pre-cleanup-backup/
│   ├── metadata.json          # Backup information
│   ├── .env                   # Environment config
│   ├── docs/                  # Generated documentation
│   ├── logs/                  # AI conversation logs
│   └── temp/                  # Temporary files
├── backup-2025-07-11T14-15-30-Manual-backup/
│   └── ...
└── backup-2025-07-11T13-00-00-Version-1.0-Release/
    └── ...
```

## 🔧 Backup Metadata

Each backup includes a `metadata.json` file:

```json
{
  "name": "backup-2025-07-11T15-30-45-Pre-cleanup-backup",
  "description": "Pre-cleanup backup",
  "timestamp": "2025-07-11T15:30:45.123Z",
  "projectState": {
    "envExists": true,
    "docsExists": true,
    "logsExists": true,
    "tempExists": false
  }
}
```

## 🚀 Integration with Development Workflow

### Before Major Changes

```bash
npm run cleanup:backup
# Will prompt for description: "Before refactoring"
```

### After Deployment

```bash
npm run cleanup:backup
# Will prompt for description: "Post deployment v1.2"
```

### Regular Maintenance

```bash
npm run cleanup          # Clean and backup
npm run cleanup:manage   # Delete old backups
```

## ⚙️ Configuration

The cleanup system is configured through the script itself. Key settings:

- **Backup retention**: Keeps 3 most recent backups
- **Backup location**: `.cleanup-backups/` directory
- **File patterns**: Defined in cleanup script

## 🔍 Troubleshooting

### No Backups Found

```bash
📭 No backups found.
```

**Solution**: Create a backup first with `npm run cleanup:backup`

### Restoration Failed

```bash
❌ Restore failed: Backup 'backup-name' not found
```

**Solution**: Check available backups with `npm run cleanup:list`

### Permission Errors

**Solution**: Ensure write permissions for project directory

## 🎉 Summary

The enhanced cleanup system provides:

- ✅ **Multiple timestamped backups** for safety
- ✅ **Interactive restoration** with selection
- ✅ **Automatic backup management**
- ✅ **Comprehensive project reset**
- ✅ **Error recovery** with restoration
- ✅ **Cross-platform compatibility**

Perfect for maintaining a clean development environment while preserving the ability to restore to
any previous state!

- **Package files** (`package.json`, `requirements.txt`)
- **Dependencies** (`node_modules/`, `.venv/`)
- **Git repository** (`.git/`)
- **Base documentation** (`docs/README.md`, `docs/ai-prompts/`)
- **Project configuration** (`tsconfig.json`, `.eslintrc.js`, etc.)
- **Workspace settings** (`.vscode/`)

## Cleanup Process Details

### 1. **Automatic Backup**

Before any cleanup, a backup is automatically created in `.cleanup-backup/`:

```
.cleanup-backup/
├── .env
├── docs/
├── logs/
├── temp/
└── .copilotflow.json
```

### 2. **Safe Cleanup**

The script only removes files that are:

- Generated by AI automation
- Temporary or cache files
- Build artifacts
- Log files (not in source control)

### 3. **Configuration Reset**

- **Environment variables** reset to template values
- **Project settings** reset to defaults
- **AI configurations** cleared

## Usage Examples

### Full Project Reset

```bash
npm run cleanup
```

This will:

1. Create automatic backup
2. Clean all generated files
3. Reset configurations
4. Remove backup after success

### Backup Before Manual Changes

```bash
npm run cleanup:backup
# Make manual changes...
npm run cleanup:restore  # If needed
```

### Restore Previous State

```bash
npm run cleanup:restore
```

## After Cleanup

Once cleanup is complete, you'll need to:

1. **Configure Environment**

   ```bash
   # Edit .env with your API keys
   cp .env.example .env
   # Add your actual API keys
   ```

2. **Run Initial Setup**

   ```bash
   npm run setup
   ```

3. **Start AI Automation**
   ```bash
   npm run ai:daily-workflow
   ```

## Default Configuration

After cleanup, your `.copilotflow.json` will be reset to:

```json
{
  "project": {
    "name": "CopilotFlow",
    "version": "1.0.0",
    "description": "An AI-powered project built with CopilotFlow",
    "language": "auto-detect"
  },
  "ai": {
    "provider": "OpenAI",
    "model": "gpt-4",
    "enabled": true,
    "features": {
      "code_analysis": true,
      "documentation_generation": true,
      "commit_messages": true,
      "code_review": true
    }
  },
  "automation": {
    "daily_workflow": true,
    "auto_commit_messages": false,
    "auto_documentation": false
  },
  "output": {
    "verbose": true,
    "save_conversations": true,
    "log_level": "INFO"
  }
}
```

## Safety Features

- **Automatic backup** before any changes
- **Error recovery** with automatic restore
- **Preserves source code** and dependencies
- **Git-safe** (doesn't touch `.git/`)
- **Rollback option** available

## Troubleshooting

### If Cleanup Fails

The script will automatically restore from backup if any error occurs.

### Manual Recovery

If you need to manually restore:

```bash
# If backup exists
npm run cleanup:restore

# Or copy manually
cp -r .cleanup-backup/* .
```

### Clean Backup Files

```bash
# Remove backup after successful cleanup
rm -rf .cleanup-backup
```

## Integration with Development Workflow

### Before Major Changes

```bash
npm run cleanup:backup
# Make experimental changes...
```

### Regular Maintenance

```bash
# Weekly or monthly
npm run cleanup
npm run setup
```

### CI/CD Integration

```bash
# In CI pipeline
npm run cleanup
npm run setup
npm test
```

## Files Affected by Language

The cleanup process adapts based on your project's primary language:

### **JavaScript/TypeScript Projects**

- Cleans `.js`, `.ts` files' generated docs
- Removes `dist/`, `build/`, `.next/`
- Cleans npm logs

### **Python Projects**

- Cleans `.py` files' generated docs
- Removes `__pycache__/`, `.pytest_cache/`, `.tox/`
- Cleans pip logs

### **Multi-Language Projects**

- Cleans all supported language artifacts
- Maintains language-specific configurations

---

**🚀 Ready to start fresh? Run `npm run cleanup` and begin with a clean CopilotFlow project!**
