## CopilotFlow: Next Steps & Team Guidance

Last updated: 2025-08-14 (commit on main at creation time)

### Purpose

This document captures focused, actionable next steps to mature the CopilotFlow project now that CI
is green (tests pass, formatting & lint stable) and coverage gates are temporarily disabled. Use it
as a living roadmap; update after each milestone.

---

## 1. Immediate Stabilization (Week 0–1)

| Priority | Task                                                         | Rationale                              | Success Metric                              | Owner |
| -------- | ------------------------------------------------------------ | -------------------------------------- | ------------------------------------------- | ----- |
| P0       | Reinstate minimal coverage gate (e.g. 5–10%)                 | Prevent silent test quality regression | Gate > chosen % without failure             | TBD   |
| P0       | Silence AI debug logs in tests unless `AI_DEBUG` is set      | Cleaner CI output                      | No Azure AI debug lines in default test run | TBD   |
| P0       | Add baseline coverage snapshot script                        | Enables incremental coverage strategy  | Script generates/compares baseline          | TBD   |
| P1       | Document how to configure secrets (OPENAI / AZURE) in README | Reduce onboarding friction             | New dev config time < 10 min                | TBD   |
| P1       | Add health badge(s) (build, tests) to `README.md`            | Visibility                             | Badges visible & correct                    | TBD   |
| P1       | Add PR template referencing QA checklist                     | Consistent reviews                     | Template merged & used                      | TBD   |

---

## 2. Test & Coverage Improvement (Week 1–3)

1. Identify “critical path” modules to cover first:
   - `universal-runner.js` (execution branching)
   - `setup-project.js` (project scaffolding logic)
   - `cleanup-project.js` (backup/restore logic)
2. Create focused unit tests for isolated pure-ish helpers (refactor to extract if needed).
3. Raise thresholds progressively: 0% → 5% → 15% → 30% (only after each tier is met without
   flakiness).
4. Introduce a per-file floor for new/modified files (e.g., changed lines must have >50% line
   coverage) using a custom diff-based script.
5. Add mutation testing evaluation (optional) to gauge test effectiveness (e.g., try Stryker on a
   small subset).

Milestones:

- M1: 10% global coverage & stable tests.
- M2: 25% coverage with targeted critical branches.
- M3: 40% coverage + per-file delta checks.

---

## 3. Code Quality & Maintainability (Week 2–4)

| Area                | Action                                                                                       | Detail                                                   |
| ------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| ESLint Complexity   | Refactor large functions (`updateVSCodeSettings`, monolithic sections in `setup-project.js`) | Extract smaller helpers (I/O isolation, config assembly) |
| Error Handling      | Standardize AI script error responses                                                        | Create small utility `formatAIError(error)`              |
| Logging             | Introduce log levels & structured output                                                     | Wrap winston or pino with project adapter                |
| Config              | Centralize env var parsing                                                                   | `config/index.js` reading & validating one time          |
| CLI UX              | Add `--no-ai` / `--skip-install` flags to setup script                                       | Faster test & local prototyping                          |
| Scripts Duplication | Consolidate AI script shared code                                                            | Shared module for model selection + file discovery       |

Technical Debt Quick Wins:

- Replace optional chaining polyfills / defensive checks where unnecessary post Node 18.
- Remove dead code branches discovered during refactor.

---

## 4. Documentation & Developer Experience (Week 2–5)

1. Expand `README` sections: “Architecture Overview”, “AI Workflows”, “Local vs CI behavior.”
2. Generate an “Operations Handbook” page for recurring tasks (releases, rotating API keys, cleaning
   artifacts).
3. Add `CONTRIBUTING.md` with: branching model, commit message conventions, QA pre-flight commands.
4. Provide quickstart GIF or asciinema for setup script.
5. Add decision log (ADR) template; begin with ADR-0001 (coverage gate strategy).

---

## 5. Release & Versioning Strategy (Week 3–5)

| Goal                   | Step                                                                 |
| ---------------------- | -------------------------------------------------------------------- |
| Predictable releases   | Adopt semantic-release or changesets (automated changelog & tagging) |
| Artifact integrity     | Add checksum or SBOM generation during build (e.g., `cyclonedx`)     |
| Pre-release validation | Introduce `beta` tag path on `develop` merges                        |

Release Pipeline Enhancements:

- Add step to verify generated docs not stale (compare hash of docs folder vs AI generation output
  summary).
- Gate release if QA validation script reports ERROR (extend script to differentiate ERROR vs WARN
  clearly).

---

## 6. Security & Compliance (Parallel)

| Item                | Action                                                                    | Tooling               |
| ------------------- | ------------------------------------------------------------------------- | --------------------- |
| Dependency scanning | Add `npm audit --production` in CI (non-blocking at first)                | native / `audit-ci`   |
| Secret leakage      | Add GitHub secret scanning & pre-commit hook (detect .env accidental add) | `gitleaks`            |
| Least privilege     | Audit required secrets, document usage                                    | Manual review         |
| Supply chain        | Pin critical build deps (TypeScript, ESLint) with renovate bot            | Renovate / Dependabot |

---

## 7. AI Workflow Maturation

1. Introduce provider abstraction interface (OpenAI / Azure / future local LLM) to reduce per-script
   conditional noise.
2. Add caching layer for repeated static analysis sections (hash file tree → reuse) to lower token
   costs.
3. Implement “dry-run” mode for AI actions (no requests, simulate outputs).
4. Add token usage & cost estimation summary to AI outputs (when keys present).
5. Add structured JSON output alongside human markdown for downstream automation.

---

## 8. Metrics & Observability

| Focus                 | Action                                               |
| --------------------- | ---------------------------------------------------- | --------------------------- |
| Test Duration         | Record average test runtime; fail if > +50% baseline | Simple timing script        |
| AI Script Performance | Log execution segments (init, scan, call)            | Lightweight timer wrapper   |
| Build Artifacts Size  | Track dist/ size trend; alert if > defined threshold | Collect & compare size file |

---

## 9. Incremental Coverage Strategy (Detailed)

1. Add script `scripts/coverage/baseline.js` to write JSON summary to `coverage-baseline.json` on
   main.
2. On PR: run coverage, compare each file’s (statements/lines) against baseline; fail if negative
   delta > tolerance.
3. Provide override label (e.g., `coverage-exempt`) with mandatory reviewer note.
4. After 2–3 cycles, raise global thresholds progressively.

Baseline Data Fields:

```jsonc
{
  "timestamp": "2025-08-14T00:00:00Z",
  "files": {
    "scripts/setup-project.js": { "s": 1.37, "l": 1.37 },
    "scripts/cleanup-project.js": { "s": 0, "l": 0 },
  },
}
```

---

## 10. Risk Register (Top Items)

| Risk                                        | Impact | Mitigation                                                |
| ------------------------------------------- | ------ | --------------------------------------------------------- |
| Zero coverage gates allow silent regression | High   | Implement incremental gates (Section 9)                   |
| AI provider rate/credit limits              | Medium | Add caching + exponential backoff + dry-run               |
| Large monolithic setup script               | Medium | Modularize into service classes                           |
| Auto “repair” docs may mask missing content | Medium | Add flag `MVE_STRICT=true` to fail instead of auto-insert |
| Secret misconfiguration in forks            | Low    | Document fallback/no-op behavior (already partially done) |

---

## 11. Ownership & Cadence

| Cadence         | Activity                                                                           |
| --------------- | ---------------------------------------------------------------------------------- |
| Daily           | Run `ai:daily-workflow`, triage any warnings, update NEXT_STEPS if tasks completed |
| Weekly          | Coverage delta review, dependency audit report, open new issues for drift          |
| Sprint Boundary | Raise coverage gates (if green), archive completed risks, add new ADRs             |

---

## 12. Definition of Done Enhancements

Add to PR checklist:

- [ ] QA: `npm run qa:validate` (no ERRORs)
- [ ] Lint & format clean
- [ ] Tests added/updated for changed logic
- [ ] Coverage delta >= baseline
- [ ] Docs/README updated if user-facing change
- [ ] AI scripts unaffected OR updated tests

---

## 13. Quick Win Backlog (Icebox)

- Convert mve-enforce to library + CLI with args for modes (audit vs auto-fix).
- Add `--json` flag to QA script for machine parsing.
- Provide a dockerized dev environment.
- Add partial hydration of docs via AI (suggest sections needing manual detail).

---

## 14. Tracking & Issue Labels

| Label              | Meaning                           |
| ------------------ | --------------------------------- |
| `type:test`        | Test coverage / quality work      |
| `type:ai`          | AI workflow enhancement           |
| `type:infra`       | CI/CD or build pipeline           |
| `quality:refactor` | Non-functional refactors          |
| `risk:high`        | Needs prioritization & mitigation |
| `good-first-issue` | Onboard new contributors          |

---

## 15. Raising the Bar (Future Milestones)

| Milestone | Target                                                           |
| --------- | ---------------------------------------------------------------- |
| M4        | 50% coverage & stable mutation score pilot                       |
| M5        | AI cost dashboard (tokens & $$ per run)                          |
| M6        | Self-service project scaffolding via CLI wizard + templates repo |
| M7        | Pluggable AI provider architecture documented & benchmarked      |

---

## How to Use This Document

1. Review in weekly sync; mark completed items ✔️.
2. Open GitHub issues for each unchecked P0/P1 not yet tracked.
3. Keep this file short—prune or archive stale sections monthly.

---

### Appendix: Suggested Scripts to Add

| Script              | Purpose                                   |
| ------------------- | ----------------------------------------- |
| `coverage:baseline` | Capture current coverage snapshot on main |
| `coverage:compare`  | Compare PR coverage to baseline           |
| `quality:pr-check`  | Aggregate QA, lint, test, coverage delta  |

---

Maintainers: Update the header date whenever materially editing this file.
