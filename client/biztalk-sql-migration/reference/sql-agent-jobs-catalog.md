# BizTalk Server SQL Agent Jobs Catalog

**Source:** Microsoft Learn — [Database Structure and Jobs](https://learn.microsoft.com/en-us/biztalk/core/database-structure-and-jobs)  
**Source:** Microsoft Learn — [How to Back Up and Restore SQL Agent Jobs](https://learn.microsoft.com/en-us/biztalk/core/how-to-back-up-and-restore-sql-agent-jobs)

---

## Overview

BizTalk Server creates SQL Server Agent jobs to manage its databases. These jobs are created on the SQL Server instance(s) hosting the corresponding BizTalk databases during BizTalk configuration. During a SQL Server migration, **all jobs must be scripted on the source server and recreated on the target server**. Jobs that reference server paths, server names, or database names must be reconfigured after recreation.

> **Migration requirement:** Script each job using SQL Server Management Studio → right-click job → Script Job As → CREATE To. Store the `.sql` script files for evidence and rollback traceability.

---

## Complete BizTalk SQL Agent Jobs

### Runtime and Maintenance Jobs (Created During BizTalk Configuration)

| Job Name | Host Database | Purpose | Migration Action |
|---|---|---|---|
| `Backup BizTalk Server (BizTalkMgmtDb)` | BizTalkMgmtDb | Performs full and log backups of **all** BizTalk databases using coordinated marked transactions. Writes to `adm_BackupHistory`. | **Must reconfigure** paths, destination server name, and `@unc_root` backup path after recreation. Minimum required backup. |
| `CleanupBTFExpiredEntriesJob_BizTalkMgmtDb` | BizTalkMgmtDb | Cleans up expired BizTalk Framework (BTF) entries from BizTalkMgmtDb. | Script and recreate. No path-specific reconfiguration typically needed. |
| `DTA Purge and Archive (BizTalkDTADb)` | BizTalkDTADb | Archives data from BizTalkDTADb and purges obsolete records on a scheduled basis. Prevents unbounded DTA database growth. | **Must reconfigure** archive file path if it changes. Validate schedule and soft/hard purge thresholds post-cutover. |
| `MessageBox_DeadProcesses_Cleanup_BizTalkMsgBoxDb` | BizTalkMsgBoxDb | Detects stopped BizTalk host instances and releases in-progress work items for processing by other instances. | Script and recreate. No path reconfiguration needed. |
| `MessageBox_Message_Cleanup_BizTalkMsgBoxDb` | BizTalkMsgBoxDb | Removes messages no longer referenced by any subscriber. **Unscheduled — do not manually start.** Started internally by ManageRefCountLog job. | Script and recreate. Do not enable or run manually. |
| `MessageBox_Message_ManageRefCountLog_BizTalkMsgBoxDb` | BizTalkMsgBoxDb | Manages message reference count logs and determines when messages are no longer subscribed. Runs every minute by design — this behavior is intentional. | Script and recreate. Validate schedule = 1-minute interval. |
| `MessageBox_Parts_Cleanup_BizTalkMsgBoxDb` | BizTalkMsgBoxDb | Removes message parts (actual message data) no longer referenced by any message record. | Script and recreate. |
| `MessageBox_UpdateStats_BizTalkMsgBoxDb` | BizTalkMsgBoxDb | Manually updates statistics for BizTalkMsgBoxDb. Keeps query plans optimized under high-volume conditions. | Script and recreate. |
| `Monitor BizTalk Server` | BizTalkMgmtDb, BizTalkMsgBoxDb, BizTalkDTADb | Scans core databases for known issues including orphaned service instances. | Script and recreate. |
| `Operations_OperateOnInstances_OnMaster_BizTalkMsgBoxDb` | BizTalkMsgBoxDb | Required for multi-MessageBox deployments. Asynchronously applies bulk operational actions (e.g., bulk terminate) to the master MessageBox. | Script and recreate. Required even in single-MsgBox environments. |
| `PurgeSubscriptionsJob_BizTalkMsgBoxDb` | BizTalkMsgBoxDb | Purges unused subscription predicates from BizTalkMsgBoxDb. | Script and recreate. |
| `Rules_Database_Cleanup_BizTalkRuleEngineDb` | BizTalkRuleEngineDb | Purges old audit data (every 90 days) and old deploy/undeploy history (every 3 days) from BizTalkRuleEngineDb. | Script and recreate. |
| `TrackedMessages_Copy_BizTalkMsgBoxDb` | BizTalkMsgBoxDb | Copies tracked messages from BizTalkMsgBoxDb to BizTalkDTADb. Runs continuously. | Script and recreate. Validate that it targets correct DTA database server after cutover. |

### Log Shipping Jobs (Created During Disaster Recovery / Log Shipping Configuration)

These jobs are only present if BizTalk log shipping was configured for the DR scenario.

| Job Name | Purpose | Migration Action |
|---|---|---|
| `BTS Log Shipping - Get Backup History` | Moves backup history records from source `BizTalkMgmtDb` to destination system. Runs every minute. | Disable before cutover. Recreate on new destination after migration. |
| `BTS Log Shipping - Restore Databases` | Restores backup files from source to destination server. Runs continuously as backup files become available. | Disable before cutover. Recreate on new destination. |
| `BTS Log Shipping - Restore To Mark` | Restores all databases to a consistent mark in the last log backup. Also re-creates SQL Agent jobs on the destination system. | Run this job as part of the final restore sequence during cutover. |

---

## Job Distribution by Topology

In multi-server topologies, jobs run on the SQL Server instance hosting the relevant database:

| Job | 1 Server | 2 Servers | 3 Servers | 4 Servers |
|---|---|---|---|---|
| Backup BizTalk Server | SQL-A | SQL-A | SQL-C | SQL-C |
| CleanupBTFExpiredEntries | SQL-A | SQL-A | SQL-C | SQL-C |
| DTA Purge and Archive | SQL-A | SQL-B | SQL-B | SQL-B |
| MessageBox jobs (5 jobs) | SQL-A | SQL-B | SQL-A | SQL-A |
| Monitor BizTalk Server | SQL-A | SQL-A* | SQL-C* | SQL-C* |
| Operations_OnMaster | SQL-A | SQL-B | SQL-A | SQL-A |
| PurgeSubscriptions | SQL-A | SQL-B | SQL-A | SQL-A |
| Rules_Database_Cleanup | SQL-A | SQL-A | SQL-C | SQL-C |
| TrackedMessages_Copy | SQL-A | SQL-B | SQL-A | SQL-A |

*Monitor BizTalk Server accesses multiple databases across servers.

> **Note:** If multiple MessageBox databases are deployed, there will be a separate set of MessageBox jobs for each database instance.

---

## Pre-Cutover Job Scripting Checklist

Before cutover, complete the following for each SQL instance in scope:

- [ ] Open SSMS on source SQL server
- [ ] Expand SQL Server Agent → Jobs
- [ ] For each job in the list above: right-click → Script Job As → CREATE To → File → save as `<jobname>.sql`
- [ ] Verify `Backup BizTalk Server` job script contains correct UNC backup path
- [ ] Store all `.sql` scripts in version control or secure artifact location
- [ ] Verify job scripts execute successfully in lower environment before cutover

## Post-Cutover Job Validation Query

Run on each target SQL instance after recreation:

```sql
-- Verify all expected BizTalk jobs are present and enabled
SELECT 
    j.name,
    j.enabled,
    j.description,
    h.run_status,
    h.run_date,
    h.run_time,
    h.message
FROM msdb.dbo.sysjobs j
LEFT JOIN msdb.dbo.sysjobhistory h 
    ON j.job_id = h.job_id
    AND h.instance_id = (
        SELECT MAX(instance_id) 
        FROM msdb.dbo.sysjobhistory 
        WHERE job_id = j.job_id
    )
WHERE j.name LIKE '%BizTalk%' 
   OR j.name LIKE '%DTA%'
   OR j.name LIKE '%MessageBox%'
   OR j.name LIKE '%Rules_Database%'
   OR j.name LIKE '%TrackedMessages%'
ORDER BY j.name;
```

---

## Sources

- [Database Structure and Jobs](https://learn.microsoft.com/en-us/biztalk/core/database-structure-and-jobs)
- [How to Back Up and Restore SQL Agent Jobs](https://learn.microsoft.com/en-us/biztalk/core/how-to-back-up-and-restore-sql-agent-jobs)
- [How to Configure the Backup BizTalk Server Job](https://learn.microsoft.com/en-us/biztalk/core/how-to-configure-the-backup-biztalk-server-job)
- [How to Configure the Destination System for Log Shipping](https://learn.microsoft.com/en-us/biztalk/core/how-to-configure-the-destination-system-for-log-shipping)
