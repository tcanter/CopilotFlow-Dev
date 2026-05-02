# BizTalk SQL Migration Change Plan and Cutover Runbook

## 1. Executive summary
This change moves an existing BizTalk Group production SQL data tier from the current SQL Server to a new SQL Server instance/server using Microsoft-supported move and restore procedures. BizTalk application servers, host instance accounts, BizTalk version, and Windows versions remain unchanged.

Expected downtime is a full maintenance-window cutover with processing freeze, final backup/restore, pointer updates, and controlled restart. Key risks are restore inconsistency across BizTalk databases, missing SQL Agent jobs, missing SQL logins/orphaned users, and restore path mismatches on target SQL.

Sources: turn1search8, turn1search2, turn1search20, turn1search16, turn1search5, turn1search4

## 2. Architecture and inventory to capture before change

### Required inventory capture
- Current SQL Server: server name, instance, SQL version/build, TCP port(s), collation, service account.
- New SQL Server: server name, instance, SQL version/build, TCP port(s), collation, service account.
- Full BizTalk database inventory and current host SQL mapping.
- BizTalk-related SQL Agent jobs and schedules on source SQL.
- BizTalk host instances: host name, server placement, logon account, startup mode.
- ENTSSO placement: SSO server/master secret server and backup status.
- BAM presence decision: in-scope or out-of-scope.

Sources: turn1search8, turn1search20, turn1search4, turn1search6

### How to collect (do not invent values)
- BizTalk Admin Console: Group hub and platform settings for hosts, host instances, and DB references.
- SQL Server queries on source and target for DBs, jobs, logins, and server properties.
- SSO console/commands for master secret server confirmation.
- CMDB and firewall records for server/instance/port and service account validation.

Sources: turn1search8, turn1search20, turn1search16

### In-scope SQL artifacts
- BizTalkMgmtDb and related BizTalk Group databases moved via supported process.
- BizTalkMsgBoxDb plus dependent SQL Agent jobs recreated and reconfigured.
- Backup BizTalk Server SQL Agent job moved and validated end-to-end.
- BizTalk-related SQL logins transferred to avoid orphaned users and access failures.

Sources: turn1search8, turn1search20, turn1search16

### BAM handling
- If BAM is present: treat as special handling with separate plan and schedule because BAM procedures differ from non-BAM restoration/move flow.
- If BAM is not in scope: document explicit out-of-scope statement and attach evidence of BAM absence.

Sources: turn1search6, turn1search2

## 3. Project plan (Deliverable A)

### Phase plan with ownership, dependencies, acceptance criteria

| Phase | Task | Owner role | Duration | Depends on | Acceptance criteria |
|---|---|---|---:|---|---|
| Discover | Capture full inventory, SQL topology, jobs, logins, BAM decision | BizTalk Admin + DBA | 20 hours (2.5 days) | None | Inventory signed by BizTalk lead + DBA |
| Discover | Confirm maintenance window, rollback trigger criteria | Change Manager | 10 hours (1.25 days) | Inventory complete | CAB pre-check approved |
| Discover | Kickoff and success criteria alignment | BizTalk Architect + Change Manager | 6 hours (0.75 day) | None | Objectives, SLAs, and fallback threshold approved |
| Discover | Strategy and governance gate approval | CAB + Technical Leads | 6 hours (0.75 day) | Prior Discover tasks | Go-forward decision recorded |
| Design | Provision readiness validation of new SQL platform | DBA + Infrastructure | 24 hours (3 days) | Discover | New SQL meets baseline checklist |
| Design | SQL standards and configuration validation | DBA | 20 hours (2.5 days) | Provision readiness | Collation, tempdb, backup settings validated |
| Design | Security/logins/SPN/service-account validation | DBA + AD Team | 24 hours (3 days) | SQL standards | Security and identity checks passed |
| Design | Baseline performance/health and restore-path constraints | DBA | 12 hours (1.5 days) | Security validation | Baseline report and path constraints signed |
| Design | HA/DR and backup-restore strategy validation | DBA + BizTalk Admin | 20 hours (2.5 days) | Baseline complete | Recovery strategy approved |
| Build | Clone lower environment and refresh BizTalk databases | DBA + BizTalk Admin | 32 hours (4 days) | Design | Lower environment ready for rehearsals |
| Build | Dry run #1 full rehearsal | BizTalk Admin + DBA + Ops | 28 hours (3.5 days) | Environment clone | Rehearsal completed with evidence |
| Build | Measure bottlenecks and optimize scripts/jobs | DBA + BizTalk Admin | 32 hours (4 days) | Dry run #1 | Optimized cutover scripts validated |
| Build | Dry run #2 timed rehearsal | BizTalk Admin + DBA + Ops | 24 hours (3 days) | Optimizations complete | Downtime target met in rehearsal |
| Build | Finalize production runbook and rollback scripts | BizTalk Architect + DBA | 12 hours (1.5 days) | Dry run #2 | Runbook and rollback signed off |
| Test | CAB submission and approvals | Change Manager | 10 hours (1.25 days) | Build | CAB approval obtained |
| Test | Business communication and outage notice | App Owner + PM | 6 hours (0.75 day) | CAB submission | Stakeholders acknowledged outage window |
| Test | Freeze/release readiness verification | Release Manager + Ops | 12 hours (1.5 days) | Communications complete | Freeze checklist complete |
| Test | Monitoring and alert routing updates | Ops + Monitoring Team | 10 hours (1.25 days) | Freeze readiness | Cutover monitoring dashboard ready |
| Test | Pre-stage scripts/jobs/aliases/credentials | DBA + BizTalk Admin | 20 hours (2.5 days) | Monitoring updates | All pre-stage artifacts validated |
| Test | Final go/no-go review | CAB + Technical Leads | 0 hours (milestone) | Pre-stage complete | Go/no-go decision logged |
| Optional BAM workstream | Confirm BAM deployment scope and dependent databases/packages | BizTalk Admin + DBA | 6 hours (0.75 day) | Discover inventory complete | BAM scope decision signed |
| Optional BAM workstream | Execute BAM-specific backup/restore and configuration steps in rehearsal | BizTalk Admin + DBA | 16 hours (2 days) | BAM scope confirmed | BAM rehearsal succeeds |
| Optional BAM workstream | Perform BAM post-cutover validation and activity checks | QA + BizTalk Admin | 8 hours (1 day) | Cutover restart complete | BAM portal/activity validation passed |
| Cutover | Execute freeze and stop sequence | BizTalk Admin + Ops | 7 hours | Go/no-go | All required services stopped and verified |
| Cutover | Final backup/restore, repoint, and restart | DBA + BizTalk Admin | 10 hours | Freeze complete | Databases restored and pointers updated |
| Cutover | Smoke tests and business validation | App Owner + QA + Ops | 5 hours | Repoint/restart complete | Business sign-off received |
| Cutover | End maintenance window | Change Manager | 0 hours (milestone) | Validation complete | Change bridge formally closed |
| Post cutover stabilization | Hypercare monitoring and incident triage | Ops + DBA | 32 hours (4 days) | Cutover complete | Stability targets met |
| Post cutover stabilization | Performance tuning and optimization | DBA | 12 hours (1.5 days) | Hypercare in progress | Performance baseline achieved |
| Post cutover stabilization | Final handover and closure report | PM + Technical Leads | 10 hours (1.25 days) | Tuning complete | Closure package accepted |

Sources: turn1search8, turn1search2, turn1search20, turn1search16, turn1search5

### Go or no-go checkpoints (objective)
- Go/No-Go 1 (before freeze): all backups healthy, restore media reachable, login/job scripts validated in lower env.
- Go/No-Go 2 (before repoint): all BizTalk services + IIS + SQL Agent stopped and verified, no inflight work.
- Go/No-Go 3 (before restart): all required BizTalk DBs restored to same mark, SQL jobs and logins in place.
- Go/No-Go 4 (exit cutover): smoke tests and business transactions pass, critical jobs enabled and successful.

Sources: turn1search8, turn1search2, turn1search20, turn1search16

### Cutover timeline (minute-by-minute template)
- T-120 to T-90: Change bridge start, attendance, final gate check.
- T-90 to T-60: Freeze inbound integrations, disable receive locations.
- T-60 to T-40: Stop BizTalk host instances/services, stop IIS.
- T-40 to T-30: Stop SQL Server Agent at source per procedure.
- T-30 to T-10: Final backup chain capture and verification.
- T-10 to T+45: Restore all BizTalk DBs on target to same mark.
- T+45 to T+65: Restore logins and remediate orphaned users.
- T+65 to T+90: Recreate and configure BizTalk SQL Agent jobs.
- T+90 to T+110: Apply BizTalk update info and registry/config pointers.
- T+110 to T+130: Start SQL Agent (target), start BizTalk services, start IIS.
- T+130 to T+170: Run smoke tests, DTA checks, backup job test.
- T+170 to T+180: Business validation and go-live declaration.

Sources: turn1search8, turn1search2, turn1search20, turn1search16

## 4. Cutover runbook (Deliverable B)

### A. Pre-cutover preparation
1. Confirm last successful BizTalk backup cycle and retention availability.
2. Confirm restore media path access from target SQL.
3. Confirm login transfer scripts are current and tested.
4. Confirm SQL Agent job scripts are current and include all BizTalk jobs.
5. Confirm target drive letters and directory structure for restores.
6. Confirm log shipping/DR constraints when applicable, including restore method limits.
7. Confirm BAM decision and separate plan if BAM exists.

Verification commands/examples:
- SQL backup status check:
```sql
SELECT TOP 20 database_name, backup_start_date, backup_finish_date, type, physical_device_name
FROM msdb.dbo.backupset bs
JOIN msdb.dbo.backupmediafamily bmf ON bs.media_set_id = bmf.media_set_id
ORDER BY backup_finish_date DESC;
```
- SQL Agent job inventory:
```sql
SELECT name, enabled FROM msdb.dbo.sysjobs ORDER BY name;
```

Success criteria:
- All prerequisites green and signed on bridge checklist.

Sources: turn1search20, turn1search16, turn1search5, turn1search8, turn1search6

### B. Freeze and stop services
1. Freeze inbound traffic and disable BizTalk receive locations.
2. Stop BizTalk services/host instances on all BizTalk servers.
3. Stop IIS where BizTalk-related endpoints run.
4. Stop SQL Server Agent at source before move activities.

Verification:
- BizTalk hosts all stopped in Admin Console.
- IIS sites/app pools confirmed stopped where required.
- SQL Agent service status = Stopped.

Success criteria:
- Zero active processing and no new messages entering system.

Sources: turn1search8

### C. Backup and restore
1. Take final required backups (full/log/tail-log as designed).
2. Restore BizTalk databases to target SQL using one consistent recovery mark.
3. Validate every required DB restore completed and LSN/mark alignment is consistent.

Verification commands/examples:
```sql
SELECT name, state_desc FROM sys.databases WHERE name LIKE 'BizTalk%';
```

Success criteria:
- All required BizTalk DBs restored and consistency gate passed.

Sources: turn1search2, turn1search8, turn1search6

### D. Move SQL Agent jobs and logins
1. Recreate BizTalk-related SQL Agent jobs on target SQL.
2. Reconfigure Backup BizTalk Server job paths/settings if changed.
3. Restore SQL logins required by BizTalk/SQL security mappings.
4. Detect and fix orphaned users.

Verification commands/examples:
```sql
SELECT name, enabled FROM msdb.dbo.sysjobs WHERE name LIKE '%BizTalk%' OR name LIKE '%DTA%' ORDER BY name;
```
```sql
-- Example orphaned-user check pattern
EXEC sp_change_users_login 'Report';
```

Success criteria:
- Required jobs exist/enabled and login mappings validated.

Sources: turn1search20, turn1search16, turn1search8

### E. Update BizTalk configuration pointers
1. Run the documented update process to point BizTalk to new SQL location.
2. Prepare and validate SampleUpdateInfo.xml with old and new SQL server/database references before execution.
3. Edit `SampleUpdateInfo.xml` on the BizTalk server. The file is located at:
   - 32-bit: `%SystemDrive%\Program Files\Microsoft BizTalk Server <version>\Schema\Restore\SampleUpdateInfo.xml`
   - 64-bit: `%SystemDrive%\Program Files (x86)\Microsoft BizTalk Server <version>\Bins32\Schema\Restore\SampleUpdateInfo.xml`
   - Replace all instances of `"SourceServer"` with the source SQL server name (keep the quotes).
   - Replace all instances of `"DestinationServer"` with the target SQL server name (keep the quotes).
   - Comment out databases NOT being moved; uncomment BAM and Rules Engine sections if applicable.
   - If BAM Notification Services is deployed, add `BAMAlertsApplication` and `BAMAlertsNSMain` manually to the `<OtherDatabases>` section.
   - Template: see [SampleUpdateInfo-template.xml](../reference/SampleUpdateInfo-template.xml)
4. Run `UpdateDatabase.vbs` on **one BizTalk server only** in the BizTalk group:

```cmd
cd "%SystemDrive%\Program Files (x86)\Microsoft BizTalk Server <version>\Bins32\Schema\Restore"
cscript UpdateDatabase.vbs SampleUpdateInfo.xml
```

   > **IMPORTANT — SQL Server 2016 and later:** If `UpdateDatabase.vbs` fails with "Invalid connection string attribute", open the file and change `conn.Provider = "SQLOLEDB"` to `conn.Provider = "MSOLEDBSQL"`. Download [MSOLEDBSQL 18.x](https://learn.microsoft.com/en-us/sql/connect/oledb/release-notes-for-oledb-driver-for-sql-server) from Microsoft if not installed.
   > 
   > **IMPORTANT — 64-bit computers:** Must run from 64-bit command prompt (`%SystemDrive%\windows\System32\cmd.exe`).

   This script updates all tables in BizTalkMgmtDb that store the location of other databases.

5. Copy the edited `SampleUpdateInfo.xml` to the same `Schema\Restore` directory on every BizTalk server in the group.

6. Run `UpdateRegistry.vbs` on **every BizTalk server** in the group:

```cmd
cd "%SystemDrive%\Program Files (x86)\Microsoft BizTalk Server <version>\Bins32\Schema\Restore"
cscript UpdateRegistry.vbs SampleUpdateInfo.xml
```

   This script updates all Windows Registry entries that store database location references.

7. Confirm BizTalkMgmtDb and related references now point to target SQL.
- Store the exact XML used for cutover evidence and rollback traceability.
- If command execution fails, do not proceed to service restart until pointer consistency is resolved.

Verification:
- Registry/config references reflect target SQL.
- BizTalk Admin Console connects and enumerates group objects.
- ConfigFramework execution output shows successful update completion.

Success criteria:
- BizTalk metadata and runtime pointers updated without errors.

Sources: turn1search8

### F. Bring services back
1. Start SQL Server Agent on target SQL.
2. Start BizTalk services/host instances in controlled order.
3. Start IIS components.

Verification:
- Host instances in Running state.
- No startup errors in Event Viewer / BizTalk logs.

Success criteria:
- Platform operational and stable for validation tests.

Sources: turn1search8, turn1search20

### G. Validation
1. Validate BizTalk Admin Console connectivity.
2. Run smoke tests for representative inbound and outbound flows.
3. Validate DTA tracking writes and reads.
4. Verify SQL Agent jobs enabled with expected schedules.
5. Run Backup BizTalk Server job and verify valid output files.

Verification commands/examples:
```sql
SELECT j.name, h.run_status, h.run_date, h.run_time
FROM msdb.dbo.sysjobs j
LEFT JOIN msdb.dbo.sysjobhistory h ON j.job_id = h.job_id
WHERE j.name LIKE '%BizTalk%' OR j.name LIKE '%DTA%';
```

Success criteria:
- Business and technical validation checklist fully passed.

Sources: turn1search20, turn1search8

## 5. Rollback plan

### Rollback decision triggers
- Any failed consistency gate (databases not restored to same mark).
- Critical job or login failures not recoverable within rollback threshold.
- Smoke tests fail for critical business flows.
- Cutover elapsed time exceeds approved hard stop.

### Rollback steps
1. Freeze processing and keep BizTalk/IIS/SQL Agent stopped.
2. Repoint BizTalk metadata/config back to original SQL server.
3. Re-enable and start original SQL Agent jobs on source SQL.
4. Start BizTalk services and IIS against original SQL.
5. Re-run smoke tests on original platform.
6. Bridge communication: declare rollback and incident follow-up.

Data consistency note:
- Handle messages-in-flight by queue drain and reconciliation plan defined before cutover; do not resume traffic until source state is validated.

Sources: turn1search8, turn1search2, turn1search20

## 6. Risks and mitigations
- Orphaned users and missing logins: pre-script logins, post-restore orphan scan and remap.
- SQL Agent jobs missing or misconfigured: scripted export/import, mandatory post-cutover job execution test.
- Restore inconsistency across BizTalk DBs: hard gate requiring restore to same mark.
- Drive/path mismatch on target: pre-validate drive letters/directories; resolve before cutover.
- Extended outage due to partial stop state: explicit stop/verify gates for BizTalk, IIS, and SQL Agent.

Sources: turn1search16, turn1search20, turn1search2, turn1search5, turn1search8

## 7. Appendices

### A. Source links map

| Reference | URL |
|---|---|
| How to Move the BizTalk Server Databases | https://learn.microsoft.com/en-us/biztalk/core/how-to-move-the-biztalk-server-databases |
| Restore your databases (BizTalk) | https://learn.microsoft.com/en-us/biztalk/core/how-to-restore-your-databases |
| How to Back Up and Restore SQL Agent Jobs | https://learn.microsoft.com/en-us/biztalk/core/how-to-back-up-and-restore-sql-agent-jobs |
| How to Back Up and Restore SQL Server Logins | https://learn.microsoft.com/en-us/biztalk/core/how-to-back-up-and-restore-sql-server-logins |
| Configure Destination System for Log Shipping | https://learn.microsoft.com/en-us/biztalk/core/how-to-configure-the-destination-system-for-log-shipping |
| Backing Up and Restoring BizTalk Server | https://learn.microsoft.com/en-us/biztalk/core/backing-up-and-restoring-biztalk-server |
| Backing Up and Restoring BAM | https://learn.microsoft.com/en-us/biztalk/core/backing-up-and-restoring-bam |
| Databases in BizTalk Server | https://learn.microsoft.com/en-us/biztalk/core/databases-in-biztalk-server |
| Database Structure and Jobs | https://learn.microsoft.com/en-us/biztalk/core/database-structure-and-jobs |
| Checklist: Configuring SQL Server | https://learn.microsoft.com/en-us/biztalk/technical-guides/checklist-configuring-sql-server |
| Planning for Database Performance | https://learn.microsoft.com/en-us/biztalk/technical-guides/planning-for-database-performance |
| Planning for Disaster Recovery | https://learn.microsoft.com/en-us/biztalk/core/planning-for-disaster-recovery |

### B. Glossary (minimal)
- BizTalkMgmtDb: BizTalk group configuration database.
- BizTalkMsgBoxDb: Messaging runtime database.
- BizTalkDTADb: Tracking database.
- Backup BizTalk Server job: Coordinates backup marks and BizTalk backup chain.
- SampleUpdateInfo.xml: Input artifact used in documented pointer-update process.

### C. Runbook quick view (bridge copy)
- Freeze traffic -> Stop BizTalk/IIS/SQL Agent -> Final backup -> Restore all DBs to same mark -> Restore logins -> Recreate jobs -> Run UpdateDatabase.vbs (one BizTalk server) -> Run UpdateRegistry.vbs (all BizTalk servers) -> Restart WMI -> Reconnect Admin Console -> Start SQL Agent -> Start BizTalk services -> Start IIS -> Validate -> Go/No-Go.

Sources: https://learn.microsoft.com/en-us/biztalk/core/how-to-move-the-biztalk-server-databases

### D. Related reference documents (this engagement)

| Document | Purpose |
|---|---|
| [database-catalog.md](../reference/database-catalog.md) | Complete 13-database catalog, login groups, roles, placement matrix |
| [sql-agent-jobs-catalog.md](../reference/sql-agent-jobs-catalog.md) | All 15 SQL Agent jobs — descriptions, job-to-server mapping, validation query |
| [SampleUpdateInfo-template.xml](../reference/SampleUpdateInfo-template.xml) | Annotated template for UpdateDatabase.vbs and UpdateRegistry.vbs |
| [new-sql-readiness-checklist.md](../reference/new-sql-readiness-checklist.md) | Pre-migration target SQL server validation checklist |
| [scenario-selection-guide.md](../execution-plans/scenario-selection-guide.md) | Topology decision framework with rationale per scenario |
| [1-server-guide.md](../execution-plans/1-server-guide.md) | Step-by-step cutover for single SQL server topology |
| [2-servers-guide.md](../execution-plans/2-servers-guide.md) | Step-by-step cutover for 2-server topology |
| [3-servers-guide.md](../execution-plans/3-servers-guide.md) | Step-by-step cutover for 3-server topology |
| [4-servers-guide.md](../execution-plans/4-servers-guide.md) | Step-by-step cutover for 4-server topology including BAM-specific steps |
