# BizTalk SQL Server Migration — Fitek Engagement Deliverables

**Client:** Fitek  
**Engagement:** BizTalk Group SQL Data Tier Migration — Minimal Downtime  
**Delivery Lead:** tcanter  
**Status:** Active — artifacts in use

---

## Engagement Overview

This engagement moves the BizTalk Group production SQL data tier to new SQL Server infrastructure using Microsoft-supported backup/restore procedures and the BizTalk ConfigFramework repoint mechanism (`SampleUpdateInfo.xml` + `UpdateDatabase.vbs`). BizTalk application servers, host instance accounts, BizTalk version, and Windows versions remain unchanged in all topologies.

Four SQL server distribution topologies are supported, ranging from single-instance consolidation to maximum isolation with four dedicated SQL servers. The choice of topology is made during the Design phase based on current hardware inventory, I/O requirements, and operational team capacity.

---

## Deliverables Index

### Runbook

| File | Description |
|---|---|
| [runbook/change-plan-runbook.md](runbook/change-plan-runbook.md) | Full change plan and cutover runbook — architecture inventory, risk matrix, phase acceptance criteria, cutover procedure, and post-cutover validation checklist |

### Project Plans (MS Project XML — open in Microsoft Project)

| File | Description |
|---|---|
| [project-plans/master-plan.xml](project-plans/master-plan.xml) | Master migration plan — 44 tasks across 7 phases (Discover, Design, Build, Test, Cutover, Post-Cutover Stabilization, Optional BAM Workstream). Technology-neutral — apply to any topology |
| [project-plans/master-plan.pdf](project-plans/master-plan.pdf) | PDF export of the master plan — for distribution without MS Project |
| [project-plans/scenarios.xml](project-plans/scenarios.xml) | Side-by-side scenario comparison — 1-server through 4-server topologies on a single timeline for evaluation and customer presentation |

### Execution Plans (Topology-Specific — MS Project XML)

Each execution plan is a complete, self-contained MS Project file for the specific SQL server distribution topology. All four files have 44 tasks (matching the master plan structure) with topology-specific `<Notes>` and `<HyperlinkAddress>` fields on each task.

| File | Topology | SQL Server Assignment | Approx. Duration |
|---|---|---|---|
| [execution-plans/1-server.xml](execution-plans/1-server.xml) | Single SQL server | All BizTalk databases on one instance | ~17 days |
| [execution-plans/2-servers.xml](execution-plans/2-servers.xml) | Two SQL servers | SQL-A: Admin + BAM; SQL-B: MsgBox + DTA | ~18.5 days |
| [execution-plans/3-servers.xml](execution-plans/3-servers.xml) | Three SQL servers | SQL-A: MsgBox; SQL-B: DTA; SQL-C: Admin + BAM | ~16 days |
| [execution-plans/4-servers.xml](execution-plans/4-servers.xml) | Four SQL servers | SQL-A: MsgBox; SQL-B: DTA; SQL-C: Admin; SQL-D: BAM | ~16 days |

### Reference

| File | Description |
|---|---|
| [reference/database-catalog.md](reference/database-catalog.md) | **Complete BizTalk database catalog** — all 13 databases, login groups, required SQL roles, backup chain requirements, placement matrix |
| [reference/sql-agent-jobs-catalog.md](reference/sql-agent-jobs-catalog.md) | **All 15 SQL Agent jobs** — descriptions, job-to-server mapping by topology, scripting procedure, post-cutover validation query |
| [reference/SampleUpdateInfo-template.xml](reference/SampleUpdateInfo-template.xml) | **Annotated SampleUpdateInfo.xml template** — ready-to-edit XML for `UpdateDatabase.vbs` and `UpdateRegistry.vbs` with comments for all topology scenarios |
| [reference/new-sql-readiness-checklist.md](reference/new-sql-readiness-checklist.md) | **Target SQL Server readiness checklist** — 50+ validation items across edition, disk, config, security, HA, connectivity, and dry-run categories |
| [reference/sampleproject.xml](reference/sampleproject.xml) | MS Project sample used as XML schema structural reference |

### Execution Plan Scenario Guides (Markdown)

Step-by-step execution guidance for each topology — environment maps, disk layout, DTC config, SampleUpdateInfo.xml structure, cutover sequence tables, BAM steps, and validation checklists.

| File | Topology |
|---|---|
| [execution-plans/scenario-selection-guide.md](execution-plans/scenario-selection-guide.md) | **Topology decision framework** — decision tree, topology comparison matrix, tradeoffs |
| [execution-plans/1-server-guide.md](execution-plans/1-server-guide.md) | Single SQL server — full cutover sequence with minute-by-minute table |
| [execution-plans/2-servers-guide.md](execution-plans/2-servers-guide.md) | Two SQL servers — split placement, DTC config, job-to-server mapping |
| [execution-plans/3-servers-guide.md](execution-plans/3-servers-guide.md) | Three SQL servers — MsgBox isolation, TrackedMessages_Copy cross-server validation |
| [execution-plans/4-servers-guide.md](execution-plans/4-servers-guide.md) | Four SQL servers — maximum isolation, BAM-specific migration steps (6A–6F), SSAS restore |

---

## BizTalk Database Placement Reference

| Database | Single | 2-Server | 3-Server | 4-Server |
|---|---|---|---|---|
| BizTalkMgmtDb | SQL-A | SQL-A | SQL-C | SQL-C |
| BizTalkMsgBoxDb | SQL-A | SQL-B | SQL-A | SQL-A |
| BizTalkDTADb | SQL-A | SQL-B | SQL-B | SQL-B |
| SSODB | SQL-A | SQL-A | SQL-C | SQL-C |
| BizTalkRuleEngineDb | SQL-A | SQL-A | SQL-C | SQL-C |
| BAMPrimaryImport | SQL-A | SQL-A | SQL-C | SQL-D |
| BAMArchive | SQL-A | SQL-A | SQL-C | SQL-D |
| BAMStarSchema | SQL-A | SQL-A | SQL-C | SQL-D |
| BAMAlertsApplication | SQL-A | SQL-A | SQL-C | SQL-D |
| BAMAlertsNSMain | SQL-A | SQL-A | SQL-C | SQL-D |

---

## Project Plan Structure

All MS Project files use the same 7-phase outline:

| Phase | WBS | Summary |
|---|---|---|
| 1. Discover | 1 | Kickoff, inventory, downtime budget, governance approval |
| 2. Design | 2 | Provision SQL, configure instances, security, HA/DR baseline |
| 3. Build | 3 | Clone lower env, dry runs, timing measurement, optimize, runbook finalization |
| 4. Test | 4 | CAB submission, comms, freeze, pre-stage, Go/No-Go milestone |
| 5. Cutover | 5 | Maintenance window: stop, backup, restore, repoint, start, smoke test, sign-off |
| 6. Post-Cutover Stabilization | 6 | Elevated monitoring, performance tuning, final handover |
| 7. Optional BAM Workstream | 7 | BAM-specific scope confirmation, rehearsal, post-cutover validation (inactive by default) |

---

## How to Open the MS Project Files

1. Open **Microsoft Project** (2016 or later recommended — SaveVersion 14 format)
2. File → Open → Browse to the `.xml` file
3. All tasks will be in the Gantt view. Use **View → Outline → All Subtasks** (`Alt+Shift+*`) to expand all levels if the outline appears collapsed.

---

## Key References

| Topic | Link |
|---|---|
| BizTalk Database Overview | https://learn.microsoft.com/en-us/biztalk/core/databases-in-biztalk-server |
| Move BizTalk Databases | https://learn.microsoft.com/en-us/biztalk/core/how-to-move-the-biztalk-server-databases |
| Backup and Restore | https://learn.microsoft.com/en-us/biztalk/core/backing-up-and-restoring-biztalk-server |
| Restore DB Backup via SSMS | https://learn.microsoft.com/en-us/sql/relational-databases/backup-restore/restore-a-database-backup-using-ssms |
| Operational Readiness Checklist | https://learn.microsoft.com/en-us/biztalk/technical-guides/operational-readiness-checklist |
