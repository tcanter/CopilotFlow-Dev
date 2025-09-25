# 🛠️ CopilotFlow Setup Tasks & Workflow

This file describes the recommended setup workflow and tasks for personalizing and maintaining your
CopilotFlow project.

---

## 🚀 Setup Workflow

1. **Copy the Instructions Template**
   - Copy `INSTRUCTIONS.template.md` to `INSTRUCTIONS.md` in your project root.
   - Edit `INSTRUCTIONS.md` with your personal information, stylistic preferences, and workflow
     details.

2. **Edit Personal Instructions**
   - Add owner name, preferred workspace, OS, shell, and AI assistant details.
   - Specify documentation and coding style, automation preferences, and collaboration guidelines.
   - Update with any additional preferences or workflow changes.

3. **Review .gitignore**
   - Ensure `INSTRUCTIONS.md` is listed in `.gitignore` to prevent personal information from being
     checked in.

4. **Share Context Files**
   - Use `PROJECT_CONTEXT.md` and `INSTRUCTIONS.md` for onboarding and Copilot sessions.
   - Update context files as new features or decisions are made.

5. **Run Initial Setup**
   - Install dependencies: `npm install`
   - Configure environment: `cp .env.example .env` and edit with your API keys
   - Run interactive setup: `npm run setup`

6. **Start Using AI Workflows**
   - Run daily workflow: `npm run ai:daily-workflow`
   - Use other automation scripts as needed

---

## 📋 Recommended Tasks

- [ ] Copy and personalize `INSTRUCTIONS.md`
- [ ] Verify `.gitignore` includes `INSTRUCTIONS.md`
- [ ] Complete initial setup and configuration
- [ ] Share context and instructions files with team
- [ ] Update instructions and context files regularly
- [ ] Use daily workflow automation for continuous improvement

---

_Refer to this file during setup and onboarding to ensure a smooth and personalized experience with
CopilotFlow._
