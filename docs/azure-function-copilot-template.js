// Azure Function: ApplyCopilotSuggestion
// Project-agnostic template for CopilotFlow agentic automation
// This function receives a Copilot suggestion and applies it to the repo via GitHub API
// Logs all actions for traceability

const axios = require('axios');

module.exports = async function (context, req) {
  context.log('Copilot suggestion received:', req.body.suggestion);

  // Example: Apply suggestion using GitHub API
  try {
    const githubToken = process.env.GITHUB_TOKEN;
    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH || 'main';
    const suggestion = req.body.suggestion;

    // PATCH file in repo (simplified example)
    await axios.patch(
      `https://api.github.com/repos/${repo}/contents/${suggestion.filePath}`,
      {
        message: `Agentic update: ${suggestion.description}`,
        content: Buffer.from(suggestion.newContent).toString('base64'),
        branch,
      },
      {
        headers: {
          Authorization: `token ${githubToken}`,
          'User-Agent': 'CopilotFlow-Agentic-Automation',
        },
      }
    );

    context.log('Suggestion applied:', suggestion.filePath);
    context.res = {
      status: 200,
      body: { result: 'success', file: suggestion.filePath },
    };
  } catch (error) {
    context.log.error('Failed to apply suggestion:', error);
    context.res = {
      status: 500,
      body: { result: 'error', details: error.message },
    };
  }
};
