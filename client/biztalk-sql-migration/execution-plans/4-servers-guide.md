# Execution Guide: 4-Servers Topology

**Topology:** MsgBox on SQL-A; DTA on SQL-B; Admin on SQL-C; BAM on SQL-D  
**MS Project Plan:** [4-servers.xml](4-servers.xml) — 44 tasks across 7 phases  
**Scenario Guide:** [scenario-selection-guide.md](scenario-selection-guide.md)

---

## Environment Map

| Server Role | Instance Name | Databases Hosted |
|---|---|---|
| **SQL-A** (MessageBox) | `<SQL-A-INSTANCE>` | BizTalkMsgBoxDb |
| **SQL-B** (Tracking) | `<SQL-B-INSTANCE>` | BizTalkDTADb |
| **SQL-C** (Admin) | `<SQL-C-INSTANCE>` | BizTalkMgmtDb, SSODB, BizTalkRuleEngineDb |
| **SQL-D** (BAM) | `<SQL-D-INSTANCE>` | BAMPrimaryImport, BAMArchive, BAMStarSchema, BAMAnalysis, BAMAlertsApplication, BAMAlertsNSMain |

**Maximum isolation topology.** Each major workload tier runs on a dedicated SQL instance. Required for environments with high message volume, active BAM RTA, or enterprise isolation requirements.

---

## Key Architectural Rationale

### Why a Dedicated BAM Server (SQL-D)?

Per Microsoft documentation ([Planning for Database Performance](https://learn.microsoft.com/en-us/biztalk/technical-guides/planning-for-database-performance)):

> "BAM RTA requires SQL Server Enterprise Edition."

BAM Real-Time Aggregation (RTA) performs OLAP processing continuously. When co-located with BizTalk operational databases, BAM cube processing can create I/O and CPU contention. SQL-D isolates:
- BAM interceptor writes (BAMPrimaryImport)
- OLAP cube processing (BAMAnalysis — SSAS required)
- Archive operations (BAMArchive)
- Notification Services (BAMAlertsApplication, BAMAlertsNSMain)

### SQL-D Edition Requirement
**SQL-D MUST be SQL Server Enterprise Edition** if BAM Real-Time Aggregation (RTA) is used.  
SQL Server Analysis Services (SSAS) must be installed and configured on SQL-D for BAMAnalysis.

---

## Design Phase Key Decisions

### Disk Layout Guidance

**SQL-A (MsgBox — highest I/O):**
- Highest-IOPS storage in the environment
- BizTalkMsgBoxDb `.MDF` and `.LDF` on separate dedicated drives
- tempdb with 1 data file per CPU core (max 8), equal sizes, dedicated drive

**SQL-B (DTA — write-burst I/O):**
- BizTalkDTADb `.MDF` and `.LDF` on separate drives
- Account for DTA Purge and Archive write spikes

**SQL-C (Admin — low I/O):**
- Standard RAID storage acceptable
- BizTalkMgmtDb, SSODB, BizTalkRuleEngineDb share server with minimal I/O

**SQL-D (BAM — OLAP + interceptor writes):**
- SSAS data and log volumes on dedicated drives
- BAMPrimaryImport `.MDF`/`.LDF` separate from SSAS volumes
- BAMAnalysis (SSAS database) on SSAS data directory
- BAMArchive on large-capacity storage (growth can be significant over time)

### DTC Configuration
DTC must be validated between all relevant server pairs:
- All BizTalk servers ↔ SQL-A, SQL-B, SQL-C, SQL-D
- SQL-A ↔ SQL-B (TrackedMessages_Copy)
- SQL-A ↔ SQL-C (MgmtDb + MsgBox BizTalk group spanning)
- SQL-C ↔ SQL-D (BAM interceptor tracking from BizTalk context)

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

  <!-- SQL-D: BAM databases -->
  <BAMPrimaryImportDB oldDBServer="SourceServer" newDBServer="SQL-D-INSTANCE" ... />
  <BAMStarSchemaDB oldDBServer="SourceServer" newDBServer="SQL-D-INSTANCE" ... />
  <BAMArchiveDB oldDBServer="SourceServer" newDBServer="SQL-D-INSTANCE" ... />
  <BAMAnalysisDB oldDBServer="SourceServer" newDBServer="SQL-D-INSTANCE" ... />

  <OtherDatabases>
    <Database Name="BAM Alerts Application DB" oldDBServer="SourceServer" newDBServer="SQL-D-INSTANCE" ... />
    <Database Name="BAM Alerts Instance DB" oldDBServer="SourceServer" newDBServer="SQL-D-INSTANCE" ... />
  </OtherDatabases>
</UpdateInfo>
```

---

## SQL Agent Job Distribution

| Job | Runs On | Why |
|---|---|---|
| Backup BizTalk Server (BizTalkMgmtDb) | **SQL-C** | Job context is BizTalkMgmtDb; backs up all four servers |
| CleanupBTFExpiredEntriesJob_BizTalkMgmtDb | SQL-C | Operates on BizTalkMgmtDb |
| DTA Purge and Archive (BizTalkDTADb) | **SQL-B** | Operates on BizTalkDTADb |
| MessageBox_DeadProcesses_Cleanup | **SQL-A** | Operates on BizTalkMsgBoxDb |
| MessageBox_Message_Cleanup | SQL-A | Operates on BizTalkMsgBoxDb |
| MessageBox_Message_ManageRefCountLog | SQL-A | Operates on BizTalkMsgBoxDb |
| MessageBox_Parts_Cleanup | SQL-A | Operates on BizTalkMsgBoxDb |
| MessageBox_UpdateStats | SQL-A | Operates on BizTalkMsgBoxDb |
| Monitor BizTalk Server | SQL-C | Accesses MgmtDb, MsgBox (SQL-A), DTA (SQL-B) |
| Operations_OperateOnInstances_OnMaster | SQL-A | Operates on BizTalkMsgBoxDb |
| PurgeSubscriptionsJob | SQL-A | Operates on BizTalkMsgBoxDb |
| Rules_Database_Cleanup | SQL-C | Operates on BizTalkRuleEngineDb |
| TrackedMessages_Copy | **SQL-A** | Copies MsgBox → DTA (SQL-B cross-server) |

> **Note:** BAM jobs (cube processing, etc.) are managed by SQL Server Agent on SQL-D but are not part of the standard BizTalk SQL Agent job set — they are created by BAM configuration.

---

## BAM-Specific Migration Steps (Phase 6)

The 4-server topology requires explicit BAM migration actions in addition to the standard restore flow. Execute these steps **after** the core restore sequence is complete and before restarting BizTalk services.

### 6A — Restore BAMAnalysis Separately

BAMAnalysis (SSAS) is **not** included in the BizTalk Backup job chain. It must be backed up and restored separately.

```powershell
# On source — backup BAMAnalysis SSAS database using SSAS Backup
# Use SQL Server Management Studio → Analysis Services → Databases → BAMAnalysis → Backup
# Produces: BAMAnalysis.abf file

# On target SQL-D — restore using SSMS → Analysis Services → Restore Database
```

### 6B — Update BAM Primary Import References

Per [How to Update References to the BAM Primary Import Database Name and Connection String](https://learn.microsoft.com/en-us/biztalk/core/update-references-to-bam-primary-import-database-name-and-connection-string):

- Update all BizTalk applications that have BAM interceptors if the server name or database name changed
- Update BAM management web service web.config if applicable

### 6C — Update BAM Analysis Server References

Per [How to Update References to the BAM Analysis Server and Star Schema Database Names](https://learn.microsoft.com/en-us/biztalk/core/update-references-to-the-bam-analysis-server-and-star-schema-database-names):

- Update BAM configuration to point to new SQL-D SSAS instance for cube processing

### 6D — Update BAM Archive References

Per [How to Update References to the BAM Archive Database Name](https://learn.microsoft.com/en-us/biztalk/core/how-to-update-references-to-the-bam-archive-database-name):

- Verify BAM archiving job points to correct BAMArchive location on SQL-D

### 6E — Update BAM Notification Services References

Per [How to Update References to the BAM Notification Services Databases](https://learn.microsoft.com/en-us/biztalk/core/how-to-update-references-to-the-bam-notification-services-databases):

- Update BAMAlertsApplication and BAMAlertsNSMain connection references

### 6F — Resolve Incomplete Activity Instances

After restore, check for and resolve any BAM activity instances that were in progress during cutover:

Per [How to Resolve Incomplete Activity Instances](https://learn.microsoft.com/en-us/biztalk/core/how-to-resolve-incomplete-activity-instances):

```sql
-- Check for incomplete BAM activity instances
SELECT ActivityName, LongReferenceData, COUNT(*) as IncompleteCount
FROM BAMPrimaryImport.dbo.bam_ActivityInstances  -- actual table names vary by activity
WHERE IsCompleted = 0
GROUP BY ActivityName, LongReferenceData;
```

---

## Cutover Sequence — Key Differences from 3-Server

1. **Four restore operations** must all reach the same backup mark
2. BAMAnalysis (SSAS) must be restored separately before restarting BAM services
3. Restore logins on SQL-A, SQL-B, SQL-C, and SQL-D
4. Recreate jobs on SQL-A, SQL-B, SQL-C (no standard BizTalk jobs on SQL-D)
5. Configure `Backup BizTalk Server` on SQL-C to reach all four servers
6. Execute BAM-specific update steps (Section 6A–6F above) before starting BizTalk host instances
7. Start BAM Notification Services application pools after BAM database connections validated

```sql
-- Verify same restore mark across all four instances
-- Run on SQL-A, SQL-B, SQL-C, SQL-D:
SELECT TOP 1 mark_name, database_name, mark_time
FROM msdb.dbo.logmarkhistory
ORDER BY mark_time DESC;
-- mark_name must match across all instances
```

---

## Post-Cutover Validation Checklist

- [ ] BizTalk Admin Console connects to BizTalkMgmtDb on SQL-C
- [ ] All host instances Running
- [ ] `TrackedMessages_Copy` running on SQL-A; data in BizTalkDTADb on SQL-B confirmed
- [ ] `Backup BizTalk Server` on SQL-C backs up databases on SQL-A, SQL-B, SQL-C, and SQL-D
- [ ] `DTA Purge and Archive` running on SQL-B
- [ ] All MessageBox jobs running on SQL-A
- [ ] BAMAnalysis SSAS database online on SQL-D
- [ ] BAM portal accessible and activity data visible
- [ ] BAM cube processing job running on SQL-D
- [ ] BAM Notification Services alerts functioning
- [ ] DTC transactions successful across all four server pairs
- [ ] No incomplete BAM activity instances (or resolved per 6F above)

---

## Key Reference Docs for This Topology

| Document | Purpose |
|---|---|
| [database-catalog.md](../reference/database-catalog.md) | Full database list, login requirements, BAM login details |
| [sql-agent-jobs-catalog.md](../reference/sql-agent-jobs-catalog.md) | All jobs — 4-server distribution table |
| [SampleUpdateInfo-template.xml](../reference/SampleUpdateInfo-template.xml) | Template — fill in four DestinationServer values |
| [new-sql-readiness-checklist.md](../reference/new-sql-readiness-checklist.md) | Run for SQL-A, SQL-B, SQL-C, and SQL-D independently. Note SQL-D requires Enterprise Edition. |
| [change-plan-runbook.md](../runbook/change-plan-runbook.md) | Full cutover runbook |
