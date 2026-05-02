# Changelog — BizTalk SQL Migration Deliverables

All notable changes to the Fitek BizTalk SQL migration artifacts are recorded here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

---

## [Unreleased]

---

## [1.3.0] — 2026-05-02

### Added
- `execution-plans/4-servers.xml` — expanded from 9 condensed tasks to the full 44-task hierarchy matching the master plan structure (7 phases: Discover, Design, Build, Test, Cutover, Post-Cutover Stabilization, Optional BAM Workstream)
- `client/biztalk-sql-migration/` directory structure — all BizTalk engagement artifacts moved from the flat `docs/` folder into a properly organized client delivery layout
- `client/biztalk-sql-migration/README.md` — engagement index with deliverables table, topology database placement matrix, phase structure reference, and MS Project open instructions
- `client/biztalk-sql-migration/CHANGELOG.md` — this file
- `client/biztalk-sql-migration/PROMPT_HISTORY.md` — AI-assisted session log

### Changed
- All execution plan XML files relocated from `docs/` to `client/biztalk-sql-migration/execution-plans/`
- Master plan, PDF, and scenarios XML relocated from `docs/` to `client/biztalk-sql-migration/project-plans/`
- Cutover runbook relocated from `docs/` to `client/biztalk-sql-migration/runbook/`
- `sampleproject.xml` relocated to `client/biztalk-sql-migration/reference/`

---

## [1.2.0] — 2026-05-01

### Added
- `docs/biztalk-sql-migration-execution-4-servers.xml` — initial compact execution plan for the four-server topology (SQL-A: MsgBox, SQL-B: DTA, SQL-C: Admin, SQL-D: BAM)
- `<Notes>` blocks added to every task in all four execution XML files — each note contains rationale, topology-specific execution steps, and rollback decision guidance
- `<HyperlinkAddress>` added to every task in all four execution XML files — links to the authoritative Microsoft Docs page relevant to that task phase

### Fixed
- All four execution XML files were in compact single-line `<Task>` format missing `<Finish>`, `<Work>`, `<ManualDuration>`, `<ManualStart>`, `<ManualFinish>`, `<RegularWork>`, `<RemainingDuration>`, `<RemainingWork>` — causing blank Work Duration in MS Project. All four files rewritten with the full MS Project field set.

---

## [1.1.0] — 2026-05-01

### Added
- `docs/biztalk-sql-migration-execution-1-server.xml` — execution plan, single SQL server topology
- `docs/biztalk-sql-migration-execution-2-servers.xml` — execution plan, two SQL servers (SQL-A: Admin+BAM, SQL-B: MsgBox+DTA)
- `docs/biztalk-sql-migration-execution-3-servers.xml` — execution plan, three SQL servers (SQL-A: MsgBox, SQL-B: DTA, SQL-C: Admin+BAM)
- `docs/biztalk-sql-migration-project-scenarios.xml` — side-by-side comparison of all four topologies on one timeline
- `docs/biztalk-sql-migration-project.pdf` — PDF export of the master plan

---

## [1.0.0] — 2026-05-01

### Added
- `docs/biztalk-sql-migration-project.xml` — master plan: 44 tasks, 7 phases, 5-day/8-hour calendar, full MS Project field set with `<PredecessorLink>` chains, SaveVersion 14
- `docs/biztalk-sql-migration-change-plan-runbook.md` — full change plan and cutover runbook covering architecture inventory, BizTalk database catalog, SQL artifact scope, BAM handling, phased acceptance criteria, cutover procedure, validation steps, and rollback guidance
- `docs/sampleproject.xml` — MS Project XML schema structural reference
