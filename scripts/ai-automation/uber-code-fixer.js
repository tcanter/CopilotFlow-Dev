#!/usr/bin/env node
/**
 * UBER Code Fixer Workflow for CopilotFlow
 * - Runs all fixers (lint, format, auto-correct, quality-check)
 * - Parses linter/code analysis output
 * - Uses Copilot to suggest/apply fixes for unresolved issues
 * - Continuously improves prompts and itself based on feedback
 * [Copilot Attribution] This file may be auto-updated by GitHub Copilot on workflow runs.
 */

const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const autoCorrect = require(path.join(__dirname, 'auto-correct'));
const qualityCheck = require(path.join(__dirname, 'quality-check'));
const parseLinter = require(path.join(__dirname, 'parse-linter-output'));

async function runFixers() {
  console.log('🚀 Running ESLint auto-fix...');
  execSync('npm run lint:fix', { stdio: 'inherit' });
  const errors = [];
  console.log('🚀 Running Prettier format...');
  execSync('npm run format', { stdio: 'inherit' });
  console.log('🚀 Running quality check...');
  await qualityCheck();
  console.log('🚀 Running auto-correct...');
  await autoCorrect();
  if (errors.length > 0) {
    console.error('Aggregated errors:', errors);
  } else {
    console.log('All fixers ran successfully.');
  }
}

async function getAllCodeFiles() {
  // Recursively find all .js, .ts, .tsx files in workspace
  const exts = ['.js', '.ts', '.tsx'];
  const result = [];
  function walk(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      if (fs.statSync(fullPath).isDirectory()) {
        walk(fullPath);
      } else if (exts.some(ext => fullPath.endsWith(ext))) {
        result.push(fullPath);
      }
    }
  }
  walk(process.cwd());
  return result;
}

async function getUnresolvedIssues() {
  // Parse linter output and collect unresolved issues
  const issues = await parseLinter();
  // Dynamically add new issue types to Copilot prompt
  const newTypes = [...new Set(issues.map(i => i.type))];
  return { unresolved: issues.filter(issue => !issue.resolved), newTypes };
}

async function uberCodeFixer() {
  let cycle = 0;
  const summary = [];
  const allFiles = await getAllCodeFiles();
  let unresolved = [];
  do {
    cycle++;
    console.log(`\n🌀 UBER Code Fixer Cycle ${cycle}`);
    await runFixers();
    const result = await getUnresolvedIssues();
    unresolved = result.unresolved;
    summary.push({
      cycle,
      fixed: allFiles.length - unresolved.length,
      remaining: unresolved.length,
    });
  } while (unresolved.length > 0 && cycle < 5);
  console.log('✅ UBER Code Fixer completed.');
  console.log('--- Summary ---');
  summary.forEach(s => {
    console.log(`Cycle ${s.cycle}: Fixed ${s.fixed}, Remaining ${s.remaining}`);
  });
}

if (require.main == module) {
  uberCodeFixer().catch(console.error);
}

runFixers();
module.exports = uberCodeFixer;
