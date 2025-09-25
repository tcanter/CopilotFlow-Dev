#!/usr/bin/env node
/**
 * Parse Linter Output Script
 * - Runs ESLint and Prettier, parses output for remaining issues
 * - Logs unresolved issues for manual review or Copilot suggestions
 * [Copilot Attribution] This file may be auto-updated by GitHub Copilot on workflow runs.
 */
const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

function runCommand(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf-8' });
  } catch (e) {
    return e.stdout || e.message;
  }
}

function parseESLintOutput(output) {
  const issues = [];
  const lines = output.split('\n');
  lines.forEach(line => {
    if (line.match(/error|warning/)) {
      issues.push(line.trim());
    }
  });
  return issues;
}

async function parseLinter() {
  console.log('🔍 Running ESLint for remaining issues...');
  const eslintOutput = runCommand('npx eslint . --ext .js,.ts,.tsx');
  const issues = parseESLintOutput(eslintOutput);
  if (issues.length) {
    const logPath = path.join(
      process.cwd(),
      'logs',
      'ai-conversations',
      `linter-issues-${Date.now()}.log`
    );
    await fs.writeFile(logPath, issues.join('\n'));
    console.log(`❌ Remaining issues logged to ${logPath}`);
    // Optionally, call Copilot for suggestions here
  } else {
    console.log('✅ No remaining linter issues.');
  }
  return issues.map(issue => ({
    type: issue.split(' ')[2] || 'unknown',
    resolved: false,
    raw: issue,
  }));
}

if (require.main == module) {
  parseLinter();
}

module.exports = parseLinter;
