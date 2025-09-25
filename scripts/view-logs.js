#!/usr/bin/env node

/**
 * View Logs Script
 * Simple log viewer utility
 */

const fs = require('fs-extra');
const path = require('path');

console.log('📄 CopilotFlow Log Viewer');

async function viewLogs() {
  try {
    const logsDir = path.join(process.cwd(), 'logs');

    if (!(await fs.pathExists(logsDir))) {
      console.log('📁 No logs directory found');
      console.log('💡 Logs will be created when AI automation scripts run');
      return;
    }

    const files = await fs.readdir(logsDir);
    const logFiles = files.filter(
      file =>
        file.endsWith('.log') ||
        file.endsWith('.json') ||
        file.includes('ai-conversation')
    );

    if (logFiles.length === 0) {
      console.log('📄 No log files found');
      return;
    }

    console.log(`📚 Found ${logFiles.length} log files:`);

    for (const file of logFiles) {
      const filePath = path.join(logsDir, file);
      const stats = await fs.stat(filePath);
      const size = (stats.size / 1024).toFixed(2);

      console.log(`\n📄 ${file}`);
      console.log(`   Size: ${size} KB`);
      console.log(`   Modified: ${stats.mtime.toLocaleString()}`);

      // Show preview of recent logs
      if (file.endsWith('.log')) {
        try {
          const content = await fs.readFile(filePath, 'utf8');
          const lines = content.split('\n').filter(line => line.trim());
          const recentLines = lines.slice(-5);

          console.log('   Recent entries:');
          recentLines.forEach(line => {
            const truncated =
              line.length > 80 ? `${line.substring(0, 80)}...` : line;
            console.log(`     ${truncated}`);
          });
        } catch (error) {
          console.log(`     Error reading file: ${error.message}`);
        }
      }
    }

    console.log('\n💡 Use individual log files for detailed analysis');
  } catch (error) {
    console.error('❌ Failed to view logs:', error.message);
    process.exit(1);
  }
}

// Run log viewer
viewLogs().catch(console.error);
