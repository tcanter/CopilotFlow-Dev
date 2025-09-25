# CopilotFlow User Guide

## Logic App Workflow: Agentic Loop for Code Review & QA

CopilotFlow supports a robust agentic loop for code review, developer/QA handoff, and Copilot
suggestion integration. The workflow is:

1. **Code Review Initiation**: Developer submits code for review.
2. **Agentic Loop**:
   - Copilot analyzes code and provides suggestions.
   - Reviewer (developer or QA) reviews Copilot feedback.
   - Actionable changes are proposed and tracked.
   - Reviewer can accept, reject, or request further Copilot suggestions.
3. **QA Handoff**: QA validates changes, runs tests, and confirms quality gates.
4. **Documentation Update**: At each loop, documentation is updated and validated using the
   `generate-docs.js` automation script.
5. **Release/Commit**: Once all checks pass, changes are committed and released.

## Azure Function Template: Code Analysis with Copilot

Below is a template for an Azure Function that analyzes code using Copilot and returns actionable
feedback:

````javascript
// Azure Function: codeAnalysis/index.js
module.exports = async function (context, req) {
  const code = req.body.code;
  // Call Copilot API or local Copilot integration
  const feedback = await analyzeWithCopilot(code);
  context.res = {
    status: 200,
    body: { feedback }
  };
};

async function analyzeWithCopilot(code) {
  // Integrate with Copilot or use local AI model
  // Return actionable feedback (suggestions, improvements, issues)
  return [
    { type: 'suggestion', message: 'Refactor for readability.' },
    { type: 'issue', message: 'Potential null reference.' }
  ];
}

## Documentation Update Automation
CopilotFlow uses the `generate-docs.js` script to automate documentation updates:

- **Trigger**: After each code review or QA loop
- **Action**: `generate-docs.js` scans codebase, updates documentation, and validates changes
- **Validation**: Ensures docs are up-to-date and match codebase state
- **Integration**: Can be run manually or as part of CI/CD pipeline

### Example Usage

```bash
npm run ai:generate-docs
````

This keeps your documentation synchronized with code changes and review cycles.

---

For more details, see `/docs/README.md` and `/docs/PROJECT_CONTEXT.md`.
