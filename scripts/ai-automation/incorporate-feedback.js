#!/usr/bin/env node
/**
 * Incorporate Daily Workflow Feedback into Codebase
 * - Parses latest daily workflow log
 * - Updates PROCESS_FEEDBACK.md
 * - Optionally creates GitHub issues for high-priority TODOs
 * [Copilot Attribution] This file may be auto-updated by GitHub Copilot on workflow runs.
 */
const fs = require('fs-extra');
const path = require('path');
const processFeedbackPath = path.join(
  process.cwd(),
  'docs',
  'PROCESS_FEEDBACK.md'
);
const logsDir = path.join(process.cwd(), 'logs', 'ai-conversations');

async function getLatestWorkflowLog() {
  const files = await fs.readdir(logsDir);
  const dailyLogs = files.filter(
    f => f.startsWith('daily-workflow-') && f.endsWith('.json')
  );
  if (dailyLogs.length === 0) return null;
  // Fix: Provide a compare function for reliable sorting
  dailyLogs.sort((a, b) => a.localeCompare(b));
  return path.join(logsDir, dailyLogs[dailyLogs.length - 1]);
}

async function appendFeedbackToProcessDoc(feedback) {
  const entry = `
---

## Automated Feedback Entry (${new Date().toISOString()})

### Code Analysis
- ${feedback.results['Code Analysis']?.summary || 'N/A'}

### Git Status Review
- Branch: ${feedback.results['Git Status Review']?.branch || 'N/A'}
- Uncommitted files: ${feedback.results['Git Status Review']?.uncommittedFiles?.length || 0}
- Recommendations: ${feedback.results['Git Status Review']?.recommendations?.join('; ') || 'N/A'}

### Documentation Check
- Status: ${feedback.results['Documentation Check']?.status || 'N/A'}
- Recommendations: ${feedback.results['Documentation Check']?.recommendations?.join('; ') || 'N/A'}

### TODO Analysis
- TODOs found: ${feedback.results['TODO Analysis']?.count || 0}
- Recommendations: ${feedback.results['TODO Analysis']?.recommendations?.join('; ') || 'N/A'}

### Daily Report
- Summary: ${feedback.results['Generate Daily Report']?.summary || 'N/A'}
`;
  await fs.appendFile(processFeedbackPath, entry);
}

async function main() {
  const logPath = await getLatestWorkflowLog();
  if (!logPath) {
    console.error('No daily workflow log found.');
    process.exit(1);
  }
  const feedback = await fs.readJson(logPath);
  await appendFeedbackToProcessDoc(feedback);
}

main();
