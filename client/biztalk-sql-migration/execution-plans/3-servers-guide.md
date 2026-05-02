# Execution Guide: 3-Servers Topology

**Topology:** MsgBox on SQL-A; DTA on SQL-B; Admin+BAM on SQL-C  
**MS Project Plan:** [3-servers.xml](3-servers.xml) — 44 tasks across 7 phases  
**Scenario Guide:** [scenario-selection-guide.md](scenario-selection-guide.md)

---

## Environment Map

| Server Role | Instance Name | Databases Hosted |
|---|---|---|
| **SQL-A** (MessageBox) | `<SQL-A-INSTANCE>` | BizTalkMsgBoxDb |
| **SQL-B** (Tracking) | `<SQL-B-INSTANCE>` | BizTalkDTADb |
| **SQL-C** (Admin / BAM) | `<SQL-C-INSTANCE>` | BizTalkMgmtDb, SSODB, BizTalkRuleEngineDb, BAMPrimaryImport, BAMArchive, BAMStarSchema, BAMAnalysis, BAMAlertsApplication, BAMAlertsNSMain |

**This is the recommended topology for production environments.** MessageBox is fully isolated from DTA archiving I/O and from admin/BAM workloads.

---

## Key Architectural Rationale

### Why isolate DTA from MsgBox?
Per Microsoft Technical Guidance ([Checklist: Configuring SQL Server](https://learn.microsoft.com/en-us/biztalk/technical-guides/checklist-configuring-sql-server)):

> "You can reduce disk I/O contention by separating the MessageBox and Tracking (DTA) databases, and by separating the database files and transaction log files on different physical disks."

The `DTA Purge and Archive` job runs a write-intensive archive process. When DTA shares a server with MsgBox, the archiving I/O directly competes with the MessageBox engine. Moving DTA to SQL-B eliminates this contention.

### TrackedMessages_Copy latency impact
`TrackedMessages_Copy_BizTalkMsgBoxDb` runs on SQL-A (MsgBox) and copies tracked message records to SQL-B (DTA). This is a cross-server operation. **Network latency between SQL-A and SQL-B must be < 1ms (dedicated LAN segment).** Validate with:
```cmd
ping -n 100 <SQL-B> | findstr "ms"
```

---

## Design Phase Key Decisions

### Disk Layout Guidance

**SQL-A (MsgBox — highest I/O):**
- BizTalkMsgBoxDb `.MDF` on dedicated high-IOPS drive (SSD recommended for production)
- BizTalkMsgBoxDb `.LDF` on separate dedicated drive
- tempdb data files (1 per CPU core, max 8, equal sizes) on dedicated drive
- No DTA or BAM files on SQL-A

**SQL-B (DTA — moderate I/O, write bursts):**
- BizTalkDTADb `.MDF` on dedicated drive
- BizTalkDTADb `.LDF` on separate dedicated drive
- Account for DTA Purge and Archive job write patterns — I/O spikes during purge runs

**SQL-C (Admin/BAM — low-to-moderate I/O):**
- BizTalkMgmtDb on standard drives (low I/O)
- BAM Primary Import on dedicated drive if BAM interceptors are active
- BAMAnalysis on SQL Server Analysis Services volume

### DTC Configuration
DTC must be enabled and functional for all three server pairs:
- BizTalk servers ↔ SQL-A
- BizTalk servers ↔ SQL-B
- BizTalk servers ↔ SQL-C
- SQL-A ↔ SQL-B (TrackedMessages_Copy cross-server)
- SQL-A ↔ SQL-C (BizTalk group management spans MgmtDb + MsgBox)

---

## SampleUpdateInfo.xml for This Topology

```xml
<UpdateInfo>
  <!-- SQL-C: Admin databases -->
  <BizTalkMgmtDb oldDBServer="SourceServer" newDBServer="SQL-C-INSTANCE" ... />
  <SSODB oldDBServer="SourceServer" newDBServer="SQL-C-INSTANCE" ... />
  <RulesEngineDB oldDBServer="SourceServer" newDBServer="SQL-C-INSTANCE" ... />

  <!-- SQL-A: MessageBox -->
  <MessageBoxDB oldDBServer="SourceServer" newDBServer="SQL-A-INSTANCE" IsMaster="1" ... />

  <!-- SQL-B: Tracking -->
  <TrackingDB oldDBServer="SourceServer" newDBServer="SQL-B-INSTANCE" ... />

  <!-- SQL-C: BAM databases (if deployed) -->
  <BAMPrimaryImportDB oldDBServer="SourceServer" newDBServer="SQL-C-INSTANCE" ... />
  <BAMStarSchemaDB oldDBServer="SourceServer" newDBServer="SQL-C-INSTANCE" ... />
  <BAMArchiveDB oldDBServer="SourceServer" newDBServer="SQL-C-INSTANCE" ... />
  <BAMAnalysisDB oldDBServer="SourceServer" newDBServer="SQL-C-INSTANCE" ... />

  <OtherDatabases>
    <Database Name="BAM Alerts Application DB" oldDBServer="SourceServer" newDBServer="SQL-C-INSTANCE" ... />
    <Database Name="BAM Alerts Instance DB" oldDBServer="SourceServer" newDBServer="SQL-C-INSTANCE" ... />
  </OtherDatabases>
</UpdateInfo>
```

> **Note:** `UpdateDatabase.vbs` is run on **one BizTalk server only**. `UpdateRegistry.vbs` is run on **every BizTalk server** in the group.

---

## SQL Agent Job Distribution

| Job | Runs On | Why |
|---|---|---|
| Backup BizTalk Server (BizTalkMgmtDb) | **SQL-C** | Job context is BizTalkMgmtDb; backs up all three servers |
| CleanupBTFExpiredEntriesJob_BizTalkMgmtDb | SQL-C | Operates on BizTalkMgmtDb |
| DTA Purge and Archive (BizTalkDTADb) | **SQL-B** | Operates on BizTalkDTADb |
| MessageBox_DeadProcesses_Cleanup | **SQL-A** | Operates on BizTalkMsgBoxDb |
| MessageBox_Message_Cleanup | SQL-A | Operates on BizTalkMsgBoxDb |
| MessageBox_Message_ManageRefCountLog | SQL-A | Operates on BizTalkMsgBoxDb |
| MessageBox_Parts_Cleanup | SQL-A | Operates on BizTalkMsgBoxDb |
| MessageBox_UpdateStats | SQL-A | Operates on BizTalkMsgBoxDb |
| Monitor BizTalk Server | SQL-C | Accesses MgmtDb, MsgBox (SQL-A), DTA (SQL-B) via linked servers |
| Operations_OperateOnInstances_OnMaster | SQL-A | Operates on BizTalkMsgBoxDb |
| PurgeSubscriptionsJob | SQL-A | Operates on BizTalkMsgBoxDb |
| Rules_Database_Cleanup | SQL-C | Operates on BizTalkRuleEngineDb |
| TrackedMessages_Copy | **SQL-A** | Copies from BizTalkMsgBoxDb (SQL-A) to BizTalkDTADb (SQL-B) |

> **Critical:** `TrackedMessages_Copy` runs on SQL-A and writes to SQL-B. This is a cross-server job. SQL-A must have a linked server or be able to directly reach SQL-B. Verify after cutover that this job runs without errors.

---

## Cutover Sequence — Key Differences from 2-Server

1. **Three restore operations** must all reach the same backup mark before proceeding
2. Run `BTS Log Shipping - Restore To Mark` on SQL-A, SQL-B, and SQL-C — verify all are at the same mark
3. Restore logins on all three instances: SQL-A, SQL-B, SQL-C
4. Script and recreate jobs on all three instances — careful job-to-server mapping
5. Configure `Backup BizTalk Server` on SQL-C to reach backup paths for SQL-A and SQL-B databases
6. Verify `TrackedMessages_Copy` on SQL-A can reach SQL-B DTA after cutover

```sql
-- Verify same mark restored across all three instances
-- Run on each instance:
SELECT TOP 1 mark_name, database_name, user_name, lsn, mark_time
FROM msdb.dbo.logmarkhistory
ORDER BY mark_time DESC;
-- All three instances should show the same mark_name
```

---

## Post-Cutover Validation Checklist

- [ ] BizTalk Admin Console connects to BizTalkMgmtDb on SQL-C
- [ ] All host instances Running
- [ ] `TrackedMessages_Copy` running on SQL-A; data appearing in BizTalkDTADb on SQL-B (cross-server confirmed)
- [ ] `Backup BizTalk Server` on SQL-C backs up databases on SQL-A, SQL-B, and SQL-C
- [ ] `DTA Purge and Archive` running on SQL-B
- [ ] All MessageBox jobs running on SQL-A
- [ ] Rules_Database_Cleanup running on SQL-C
- [ ] DTC transactions successful (test with BizTalk transaction crossing all three servers)
- [ ] BAM portal accessible (if deployed on SQL-C)
- [ ] Network latency SQL-A → SQL-B < 1ms (re-validate post-cutover)

---

## Key Reference Docs for This Topology

| Document | Purpose |
|---|---|
| [database-catalog.md](../reference/database-catalog.md) | Full database list and login/role requirements |
| [sql-agent-jobs-catalog.md](../reference/sql-agent-jobs-catalog.md) | All jobs — note SQL-A / SQL-B / SQL-C split |
| [SampleUpdateInfo-template.xml](../reference/SampleUpdateInfo-template.xml) | Template — fill in three DestinationServer values |
| [new-sql-readiness-checklist.md](../reference/new-sql-readiness-checklist.md) | Run for SQL-A, SQL-B, and SQL-C independently |
| [change-plan-runbook.md](../runbook/change-plan-runbook.md) | Full cutover runbook |
