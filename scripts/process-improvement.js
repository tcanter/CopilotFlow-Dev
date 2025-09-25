#!/usr/bin/env node
/**
 * CopilotFlow Process Improvement Engine
 * Automatically captures feedback and applies improvements to the process
 */

const fs = require('fs-extra');

class ProcessImprovementEngine {
  constructor() {
    this.feedbackFile = 'docs/PROCESS_FEEDBACK.md';
    this.metricsFile = 'logs/process-metrics.json';
    this.improvementsFile = 'logs/applied-improvements.json';
  }

  /**
   * Capture feedback from workflow execution
   */
  async captureFeedback(workflowResults) {
    const feedback = {
      timestamp: new Date().toISOString(),
      workflow: workflowResults.workflow || 'unknown',
      success: workflowResults.success || false,
      duration: workflowResults.duration || 0,
      issues: workflowResults.issues || [],
      insights: workflowResults.insights || [],
      environment: {
        platform: process.platform,
        nodeVersion: process.version,
        cwd: process.cwd(),
      },
    };

    // Store metrics
    await this.storeMetrics(feedback);

    // Analyze for improvements
    const improvements = await this.analyzeForImprovements(feedback);

    // Apply improvements
    if (improvements.length > 0) {
      await this.applyImprovements(improvements);
    }

    return feedback;
  }

  /**
   * Store performance and success metrics
   */
  async storeMetrics(feedback) {
    const metricsPath = this.metricsFile;
    await fs.ensureFile(metricsPath);

    let metrics = [];
    try {
      const existing = await fs.readFile(metricsPath, 'utf8');
      metrics = JSON.parse(existing);
    } catch (error) {
      // Start with empty metrics
      console.error('Error reading metrics file:', error);
    }

    metrics.push(feedback);

    // Keep only last 100 entries
    if (metrics.length > 100) {
      metrics = metrics.slice(-100);
    }

    await fs.writeFile(metricsPath, JSON.stringify(metrics, null, 2));
  }

  /**
   * Analyze feedback for potential improvements
   */
  async analyzeForImprovements(feedback) {
    const improvements = [];

    // Check for hanging/timeout issues
    if (feedback.issues.some(issue => issue.type === 'timeout')) {
      improvements.push({
        type: 'timeout-prevention',
        description: 'Add timeout guards to prevent hanging',
        priority: 'high',
        implementation: 'Add timeout to execSync calls',
      });
    }

    // Check for cross-platform issues
    if (feedback.issues.some(issue => issue.type === 'platform')) {
      improvements.push({
        type: 'cross-platform-compatibility',
        description: 'Improve cross-platform reliability',
        priority: 'high',
        implementation: 'Use Node.js built-ins instead of shell commands',
      });
    }

    // Check for performance issues
    if (feedback.duration > 300000) {
      // More than 5 minutes
      improvements.push({
        type: 'performance-optimization',
        description: 'Optimize workflow performance',
        priority: 'medium',
        implementation: 'Profile and optimize slow operations',
      });
    }

    // Check for error handling issues
    if (feedback.issues.some(issue => issue.type === 'error')) {
      improvements.push({
        type: 'error-handling',
        description: 'Improve error handling and recovery',
        priority: 'medium',
        implementation: 'Add try-catch blocks and graceful degradation',
      });
    }

    return improvements;
  }

  /**
   * Apply improvements to the process
   */
  async applyImprovements(improvements) {
    const appliedPath = this.improvementsFile;
    await fs.ensureFile(appliedPath);

    let applied = [];
    try {
      const existing = await fs.readFile(appliedPath, 'utf8');
      applied = JSON.parse(existing);
    } catch (error) {
      // Start with empty list
      console.error('Error reading improvements file:', error);
    }

    for (const improvement of improvements) {
      // Check if already applied
      const alreadyApplied = applied.some(
        a =>
          a.type === improvement.type &&
          a.description === improvement.description
      );

      if (!alreadyApplied) {
        const appliedImprovement = {
          ...improvement,
          appliedAt: new Date().toISOString(),
          status: 'identified',
        };

        applied.push(appliedImprovement);
        console.log(`🔧 Improvement identified: ${improvement.description}`);
      }
    }

    await fs.writeFile(appliedPath, JSON.stringify(applied, null, 2));
  }

  /**
   * Generate improvement report
   */
  async generateReport() {
    const metricsPath = this.metricsFile;
    const improvementsPath = this.improvementsFile;

    let metrics = [];
    let improvements = [];

    try {
      metrics = JSON.parse(await fs.readFile(metricsPath, 'utf8'));
    } catch (error) {
      console.log('No metrics found');
      console.error('Error reading metrics file:', error);
    }

    try {
      improvements = JSON.parse(await fs.readFile(improvementsPath, 'utf8'));
    } catch (error) {
      console.log('No improvements found');
      console.error('Error reading improvements file:', error);
    }

    const report = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalRuns: metrics.length,
        successRate: metrics.filter(m => m.success).length / metrics.length,
        averageDuration:
          metrics.reduce((sum, m) => sum + (m.duration || 0), 0) /
          metrics.length,
        totalImprovements: improvements.length,
        pendingImprovements: improvements.filter(i => i.status === 'identified')
          .length,
      },
      recentMetrics: metrics.slice(-10),
      pendingImprovements: improvements.filter(i => i.status === 'identified'),
      appliedImprovements: improvements.filter(i => i.status === 'applied'),
    };

    console.log('📊 Process Improvement Report');
    console.log('============================');
    console.log(`Total Runs: ${report.summary.totalRuns}`);
    console.log(
      `Success Rate: ${(report.summary.successRate * 100).toFixed(1)}%`
    );
    console.log(
      `Average Duration: ${(report.summary.averageDuration / 1000).toFixed(1)}s`
    );
    console.log(`Total Improvements: ${report.summary.totalImprovements}`);
    console.log(`Pending Improvements: ${report.summary.pendingImprovements}`);

    // Save detailed report
    await fs.writeFile(
      'logs/improvement-report.json',
      JSON.stringify(report, null, 2)
    );

    return report;
  }

  /**
   * Update process documentation with feedback
   */
  async updateProcessDocumentation(feedback) {
    const feedbackPath = this.feedbackFile;
    await fs.ensureFile(feedbackPath);

    const timestamp = new Date().toISOString();
    const entry = `
## Automated Feedback - ${timestamp}

### Workflow Results
- **Success**: ${feedback.success ? '✅' : '❌'}
- **Duration**: ${feedback.duration}ms
- **Environment**: ${feedback.environment.platform} (${feedback.environment.nodeVersion})

### Issues Identified
${feedback.issues.map(issue => `- **${issue.type}**: ${issue.description}`).join('\n')}

### Insights Captured
${feedback.insights.map(insight => `- ${insight}`).join('\n')}

---

`;

    // Append to feedback file
    await fs.appendFile(feedbackPath, entry);
  }
}

// CLI interface
if (require.main == module) {
  const engine = new ProcessImprovementEngine();

  const command = process.argv[2];

  switch (command) {
    case 'report':
      engine
        .generateReport()
        .then(() => console.log('✅ Report generated'))
        .catch(console.error);
      break;

    case 'capture': {
      // Example usage: node process-improvement.js capture '{"workflow":"daily","success":true,"duration":180000}'
      const feedbackJson = process.argv[3];
      let feedback;
      if (feedbackJson) {
        try {
          feedback = JSON.parse(feedbackJson);
        } catch (err) {
          console.error('Invalid JSON for feedback:', err);
          break;
        }
        engine
          .captureFeedback(feedback)
          .then(() => console.log('✅ Feedback captured'))
          .catch(console.error);
      } else {
        console.log(
          'Usage: node process-improvement.js capture <feedback-json>'
        );
      }
      break;
    }

    default:
      console.log('CopilotFlow Process Improvement Engine');
      console.log('Usage:');
      console.log(
        '  node process-improvement.js report    - Generate improvement report'
      );
      console.log(
        '  node process-improvement.js capture   - Capture workflow feedback'
      );
  }
}

module.exports = ProcessImprovementEngine;
