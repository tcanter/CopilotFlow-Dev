#!/usr/bin/env node
const fs = require('fs-extra');
const path = require('path');

const filesToCheck = [
  path.join(
    process.cwd(),
    'scripts',
    'ai-automation',
    'incorporate-feedback.js'
  ),
  path.join(process.cwd(), 'scripts', 'ai-automation', 'quality-check.js'),
];

const changeLogPath = path.join(
  process.cwd(),
  'logs',
  'ai-conversations',
  'copilot-changes.log'
);

async function logChange(filePath, issues) {
  const logEntry = `${new Date().toISOString()} | ${path.relative(process.cwd(), filePath)} | Quality check issues: ${issues.join('; ')} | Attributed to Copilot\n`;
  await fs.ensureFile(changeLogPath);
  await fs.appendFile(changeLogPath, logEntry);
}

async function checkFileQuality(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  const issues = [];
  // Basic checks
  if (/var\s+/.test(content)) {
    issues.push('Use let/const instead of var');
  }
  if (/function\s+\w+\(/.test(content) && !/async function/.test(content)) {
    issues.push('Prefer async functions for IO');
  }
  if (/console\.log\(/.test(content)) {
    issues.push('Remove debug logging from production code');
  }
  if (/TODO|FIXME|HACK/.test(content)) {
    issues.push('Remove TODO/FIXME/HACK comments');
  }
  const longLines = content.split('\n').filter(line => line.length > 120);
  if (longLines.length > 0) {
    issues.push('Line length exceeds 120 characters');
  }
  if (!/\/\*/.test(content)) {
    issues.push('Missing file/module-level documentation');
  }
  // Naming conventions
  if (/([A-Z][a-z]+){2,}/.test(content)) {
    issues.push('Check for camelCase and PascalCase naming');
  }
  // Error handling
  if (/try\s*{[^}]*}/.test(content) && !/catch/.test(content)) {
    issues.push('Missing error handling for try blocks');
  }
  // Test coverage (for test files)
  if (filePath.endsWith('.test.js') && !/describe\(/.test(content)) {
    issues.push('Missing describe block in test file');
  }
  return issues;
}

async function qualityCheck() {
  for (const file of filesToCheck) {
    if (await fs.pathExists(file)) {
      const issues = await checkFileQuality(file);
      if (issues.length) {
        await logChange(file, issues);
        // Future: auto-fix logic can be added here
        // If auto-fix is applied, add attribution comment:
        // let content = await fs.readFile(file, 'utf-8');
        // content = await addAttributionComment(content);
        // await fs.writeFile(file, content);
      } else {
        // No issues found
      }
    }
  }
}

if (require.main == module) {
  qualityCheck();
}

module.exports = qualityCheck;
