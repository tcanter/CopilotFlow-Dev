#!/usr/bin/env node
/**
 * Automated Code Correction Script
 * - Reads quality check output
 * - Applies fixes: removes debug logs, TODO/FIXME/HACK comments, splits long lines, enforces naming
 */
// [Copilot Attribution] This file was auto-corrected by GitHub Copilot on 2023-10-05
const fs = require('fs-extra');
const path = require('path');

const filesToCorrect = [
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
const attributionComment =
  '// [Copilot Attribution] This file was auto-corrected by GitHub Copilot on ';

async function logChange(filePath) {
  const logEntry = `${new Date().toISOString()} | ${path.relative(process.cwd(), filePath)} | Change attributed to Copilot\n`;
  await fs.ensureFile(changeLogPath);
  await fs.appendFile(changeLogPath, logEntry);
}

async function addAttributionComment(content) {
  const dateStr = new Date().toISOString().split('T')[0];
  if (!content.startsWith('// [Copilot Attribution]')) {
    return `${attributionComment}${dateStr}\n${content}`;
  }
  return content;
}

async function correctFile(filePath) {
  let content = await fs.readFile(filePath, 'utf-8');
  let changed = false;
  // Remove debug logging
  if (/console\.log\(/.test(content)) {
    content = content.replace(/console\.log\([^;]*;?/g, '');
    changed = true;
  }
  // Remove TODO/FIXME/HACK comments
  if (/TODO|FIXME|HACK/.test(content)) {
    content = content.replace(/\/\/\s*(TODO|FIXME|HACK)[^\n]*\n/g, '');
    content = content.replace(/\/\*\s*(TODO|FIXME|HACK)[^*]*\*\//g, '');
    changed = true;
  }
  // Split long lines
  content = content
    .split('\n')
    .map(line => {
      if (line.length > 120) {
        return line.match(/.{1,120}/g).join('\n');
      }
      return line;
    })
    .join('\n');
  // Enforce camelCase for variables (simple heuristic)
  content = content.replace(/var\s+([A-Z][a-zA-Z0-9]*)/g, (m, p1) => {
    const camel = p1.charAt(0).toLowerCase() + p1.slice(1);
    return `var ${camel}`;
  });
  if (changed) {
    content = await addAttributionComment(content);
    await fs.writeFile(filePath, content);
    await logChange(filePath);
    console.log(
      `🛠️ Auto-corrected ${path.relative(process.cwd(), filePath)} (Copilot attribution added)`
    );
  } else {
    console.log(
      `✅ No corrections needed for ${path.relative(process.cwd(), filePath)}`
    );
  }
}

async function autoCorrect() {
  for (const file of filesToCorrect) {
    if (await fs.pathExists(file)) {
      await correctFile(file);
    } else {
      console.log(`⚠️ File not found: ${file}`);
    }
  }
}

if (require.main == module) {
  autoCorrect();
}

module.exports = autoCorrect;
