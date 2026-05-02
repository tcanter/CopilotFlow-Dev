# AI Prompt History — BizTalk SQL Migration

This file records AI-assisted work sessions for the Fitek BizTalk SQL migration engagement.
Each entry captures the user intent, the outcome, and any key decisions made.

---

## Session 3 — 2026-05-02

**Agent:** GitHub Copilot (Claude Sonnet 4.6)  
**Focus:** Expand 4-servers execution plan to full task depth; reorganize repository structure

### Prompts

**Prompt 1:**
> "I see 9 tasks in the file where the base project has 44 tasks: Four SQL Servers... [listed 9 task names]"

**Outcome:**
- Identified that `execution-plans/4-servers.xml` was a condensed 9-task version while the master plan has 44 tasks across 7 phases.
- Used PowerShell XML DOM to replace the condensed task list with the full 44-task hierarchy from `project-plans/master-plan.xml`, preserving file identity (name, calendar, dates).
- Verified task count: 44 confirmed.

**Prompt 2:**
> "ok, now these files are in the wrong place, they need to be moved, determine for this project what is the absolute best way to manage the project for this customer, presenting the documents and content in a structure that makes sense and then generate prompt history, change logs, and readme documents to match"

**Outcome:**
- Audited all workspace files to identify BizTalk client deliverables vs. CopilotFlow toolkit files.
- Designed `client/biztalk-sql-migration/` structure with four sub-folders: `runbook/`, `project-plans/`, `execution-plans/`, `reference/`.
- Moved all BizTalk artifacts out of flat `docs/` using `git mv` (for tracked files) and `Move-Item` + `git add` (for untracked files).
- Created `README.md`, `CHANGELOG.md`, and `PROMPT_HISTORY.md` for the engagement.

**Key Decision — Separation of concerns:**  
The `docs/` folder is the CopilotFlow toolkit documentation home. Client delivery artifacts live under `client/<engagement-name>/`. This keeps the public dev repo (`origin`) framework-focused and the client repo (`client`) engagement-focused without mixing concerns.

---

## Session 2 — 2026-05-01 (continued)

**Agent:** GitHub Copilot (Claude Sonnet 4.6)  
**Focus:** Diagnose missing task detail in MS Project; fix MS Project display issue

### Prompts

**Prompt 1:**
> "what are all the detail tasks missing from the projects, they are just the roll up tasks!"

**Outcome:**
- Investigated XML structure of `execution-plans/1-server.xml` (then in `docs/`).
- Confirmed detail tasks (UIDs 2–8 at `<OutlineLevel>2</OutlineLevel>`) were present in the XML.
- Root cause: MS Project collapses the outline by default on open — detail tasks existed but were hidden.
- Resolution provided: `Alt+Shift+*` (numeric keypad) or View → Outline → All Subtasks to expand all levels.

---

## Session 2 — 2026-05-01

**Agent:** GitHub Copilot (Claude Sonnet 4.6)  
**Focus:** Expand all 4 execution plan XMLs with full MS Project fields, Notes, and HyperlinkAddress

### Prompts

**Prompt 1 (reconstructed from session summary):**
> Fix all 4 execution plan XML files — they are in compact single-line Task format missing critical fields causing blank Work Duration in MS Project. Enrich every task with `<Notes>` and `<HyperlinkAddress>`.

**Outcome — 1-server.xml:**
- Rewrote all `<Task>` blocks from compact single-line format to full multi-line MS Project format.
- Added: `<Finish>`, `<Work>`, `<ManualStart>`, `<ManualFinish>`, `<ManualDuration>`, `<RegularWork>`, `<RemainingDuration>`, `<RemainingWork>` to every task.
- Added `<Notes>` (rationale + topology-specific execution steps) and `<HyperlinkAddress>` (MS Docs links) to every task.
- Topology: single SQL server, all BizTalk databases on one instance. Start: 2026-05-04.

**Outcome — 2-servers.xml:**
- Same expansion. Topology: SQL-A hosts Admin+BAM databases, SQL-B hosts MsgBox+DTA. Start: 2026-06-15.

**Outcome — 3-servers.xml:**
- Same expansion. Topology: SQL-A: MsgBox (highest I/O isolated), SQL-B: DTA, SQL-C: Admin+BAM combined. Start: 2026-07-27.

**Outcome — 4-servers.xml (required 2 attempts):**
- First `replace_string_in_file` failed — `oldString` had `</createdate>` (lowercase) but actual file had `</CreateDate>` (camelCase). Read actual file content before retrying.
- Same expansion. Topology: maximum isolation — SQL-A: MsgBox only, SQL-B: DTA only, SQL-C: Admin (MgmtDb, SSODB, RuleEngineDb), SQL-D: BAM (5 BAM databases). Start: 2026-09-07.

**Git commit:** `95cf563` — "fix: expand all 4 execution XMLs with full MS Project fields, Notes, and HyperlinkAddress per task"  
**Pushed to:** `origin` (tcanter/CopilotFlow-Dev), `client` (tcanter/copilotflow-client-Fitek)

### Lessons Learned
- Always read the exact file content before a `replace_string_in_file` on XML — element name casing matters and cannot be assumed.
- MS Project XML TaskField casing is PascalCase throughout; do not normalize to lowercase.

---

## Session 1 — 2026-05-01

**Agent:** GitHub Copilot (Claude Sonnet 4.6)  
**Focus:** Create BizTalk SQL migration planning artifacts from scratch

### Prompts (reconstructed from artifacts)

**Prompt 1:**
> Create a BizTalk SQL Server migration project plan with minimal downtime. Needs to cover 1, 2, 3, and 4 SQL server topologies.

**Outcome:**
- Created `biztalk-sql-migration-project.xml` — master MS Project plan, SaveVersion 14, 44 tasks, 7 phases.
- Phases: Discover (4 detail tasks), Design (5 detail tasks), Build (6 detail tasks), Test (6 detail tasks including Go/No-Go milestone), Cutover (9 tasks including Business Validation and End Maintenance Window milestones), Post-Cutover Stabilization (3 tasks), Optional BAM Workstream (3 tasks, Active=0 by default).
- 5-day/8-hour work calendar (Mon–Fri, 08:00–12:00 and 13:00–17:00).
- Start: 2026-05-04. Total duration: PT404H0M0S.
- Full PredecessorLink chains throughout.

**Prompt 2:**
> Create the change plan runbook document.

**Outcome:**
- Created `biztalk-sql-migration-change-plan-runbook.md` covering: executive summary, architecture/inventory requirements, in-scope SQL artifacts, BAM handling decision, phase plan table with owner/duration/acceptance criteria, cutover procedure, rollback criteria, and post-cutover validation.

**Prompt 3:**
> Create execution plans for 1, 2, 3, and 4 server topologies.

**Outcome:**
- Created initial compact execution plan XML files for all four topologies.
- Note: these were later expanded in Session 2 after the compact format caused blank Work Duration in MS Project.

**Prompt 4:**
> Create a scenarios comparison file.

**Outcome:**
- Created `biztalk-sql-migration-project-scenarios.xml` — all four topologies on one MS Project timeline for side-by-side comparison and customer presentation.

---

## MS Project XML Technical Reference

Accumulated knowledge for future sessions:

| Field | Notes |
|---|---|
| `SaveVersion` | Must be `14` for MS Project 2016+ compatibility |
| `DurationFormat` | `5` = days (in DurationFormat element), `7` = hours (in task fields) |
| `Duration` syntax | `PT{n}H0M0S` — hours only; no partial hours in task fields |
| `<Summary>1</Summary>` | Phase/rollup tasks — must have no `<Milestone>` element |
| `<Milestone>1</Milestone>` | Zero-duration tasks only — `<Duration>PT0H0M0S</Duration>` |
| `<OutlineLevel>` | 0 = project summary, 1 = phase, 2 = detail task |
| `<WBS>` | Mirrors `<OutlineNumber>` — `0`, `1`, `1.1`, `1.2`, etc. |
| `<CalendarUID>` | `-1` on all tasks = inherit from project calendar |
| `<PredecessorLink><Type>1</Type>` | Finish-to-Start dependency |
| `<Active>0</Active>` | Inactive tasks (e.g., Optional BAM Workstream) — visible but not scheduled |
| Element casing | All element names are PascalCase — `<CreateDate>` not `<createdate>` |
