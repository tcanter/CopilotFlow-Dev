# Execution Guide: 2-Servers Topology

**Topology:** Admin/BAM databases on SQL-A; MsgBox+DTA databases on SQL-B  
**MS Project Plan:** [2-servers.xml](2-servers.xml) — 44 tasks across 7 phases  
**Scenario Guide:** [scenario-selection-guide.md](scenario-selection-guide.md)

---

## Environment Map

| Server Role | Instance Name | Databases Hosted |
|---|---|---|
| **SQL-A** (Admin / BAM) | `<SQL-A-INSTANCE>` | BizTalkMgmtDb, SSODB, BizTalkRuleEngineDb, BAMPrimaryImport, BAMArchive, BAMStarSchema, BAMAnalysis, BAMAlertsApplication, BAMAlertsNSMain |
| **SQL-B** (Runtime) | `<SQL-B-INSTANCE>` | BizTalkMsgBoxDb, BizTalkDTADb |

**Migration involves moving databases to two target SQL instances.** All `SampleUpdateInfo.xml` entries reference either SQL-A or SQL-B based on the placement table above.

---

## Design Phase Key Decisions

### Disk Layout Guidance (per Microsoft technical guidance)

**SQL-A:**
- Separate physical drives for BizTalkMgmtDb data / log
- BAM databases (PrimaryImport, Archive) on dedicated drives if possible — BAM interceptors write continuously

**SQL-B:**
- **Critical:** BizTalkMsgBoxDb data files on high-I/O dedicated drives
- BizTalkMsgBoxDb `.LDF` on separate drive from `.MDF`
- BizTalkDTADb on separate drives from MsgBoxDb to reduce DTA Purge and Archive impact
- `DTA Purge and Archive` job runs on SQL-B — this is intentional in this topology

### DTC Configuration
DTC network access must be enabled and tested between SQL-A ↔ SQL-B. BizTalk orchestrations and distributed transactions require MSDTC across servers.

**Test DTC connectivity:**
```powershell
# Run from each BizTalk server
Test-NetConnection -ComputerName <SQL-A> -Port 135
Test-NetConnection -ComputerName <SQL-B> -Port 135
```

Use DTCPing tool (`DTCPing.exe`) from Microsoft to validate bi-directional DTC between:
- Each BizTalk server ↔ SQL-A
- Each BizTalk server ↔ SQL-B
- SQL-A ↔ SQL-B

---

## SampleUpdateInfo.xml for This Topology

In the file, entries are split across two destination servers. Example structure:

```xml
<UpdateInfo>
  <!-- SQL-A databases -->
  <BizTalkMgmtDb oldDBServer="SourceServer" newDBServer="SQL-A-INSTANCE" ... />
  <SSODB oldDBServer="SourceServer" newDBServer="SQL-A-INSTANCE" ... />
  <BAMPrimaryImportDB oldDBServer="SourceServer" newDBServer="SQL-A-INSTANCE" ... />
  <BAMStarSchemaDB oldDBServer="SourceServer" newDBServer="SQL-A-INSTANCE" ... />
  <BAMArchiveDB oldDBServer="SourceServer" newDBServer="SQL-A-INSTANCE" ... />
  <BAMAnalysisDB oldDBServer="SourceServer" newDBServer="SQL-A-INSTANCE" ... />
  <RulesEngineDB oldDBServer="SourceServer" newDBServer="SQL-A-INSTANCE" ... />

  <!-- SQL-B databases -->
  <MessageBoxDB oldDBServer="SourceServer" newDBServer="SQL-B-INSTANCE" IsMaster="1" ... />
  <TrackingDB oldDBServer="SourceServer" newDBServer="SQL-B-INSTANCE" ... />

  <OtherDatabases>
    <!-- BAM Alerts — if Notification Services deployed -->
    <Database Name="BAM Alerts Application DB" oldDBServer="SourceServer" newDBServer="SQL-A-INSTANCE" ... />
    <Database Name="BAM Alerts Instance DB" oldDBServer="SourceServer" newDBServer="SQL-A-INSTANCE" ... />
  </OtherDatabases>
</UpdateInfo>
```

---

## SQL Agent Job Distribution

| Job | Runs On |
|---|---|
| Backup BizTalk Server (BizTalkMgmtDb) | **SQL-A** (job is in BizTalkMgmtDb context; backs up all servers) |
| CleanupBTFExpiredEntriesJob_BizTalkMgmtDb | SQL-A |
| DTA Purge and Archive (BizTalkDTADb) | **SQL-B** (DTA resides on SQL-B) |
| MessageBox_DeadProcesses_Cleanup_BizTalkMsgBoxDb | SQL-B |
| MessageBox_Message_Cleanup_BizTalkMsgBoxDb | SQL-B |
| MessageBox_Message_ManageRefCountLog_BizTalkMsgBoxDb | SQL-B |
| MessageBox_Parts_Cleanup_BizTalkMsgBoxDb | SQL-B |
| MessageBox_UpdateStats_BizTalkMsgBoxDb | SQL-B |
| Monitor BizTalk Server | SQL-A (accesses both) |
| Operations_OperateOnInstances_OnMaster_BizTalkMsgBoxDb | SQL-B |
| PurgeSubscriptionsJob_BizTalkMsgBoxDb | SQL-B |
| Rules_Database_Cleanup_BizTalkRuleEngineDb | SQL-A |
| TrackedMessages_Copy_BizTalkMsgBoxDb | SQL-B (copies to DTA on same server) |

> **Script jobs separately from each source server.** Jobs are stored in `msdb` on the SQL instance where they run.

---

## Phase-Specific Notes

### Discover Phase
- Inventory **both source server locations** — confirm all databases are on one source server (typical single-server-to-2-server split migration) or document if source is already split
- Capture `sys.databases` from all source SQL instances in scope

### Design Phase
- Validate SQL-A and SQL-B independently using [new-sql-readiness-checklist.md](../reference/new-sql-readiness-checklist.md)
- Confirm SQL-B has appropriate I/O capacity for MsgBox workload
- Design drive layout and document expected file paths on SQL-B for MsgBox `.MDF`/`.LDF`

### Build Phase
- Rehearse restore of SQL-A databases and SQL-B databases independently
- Rehearse `UpdateDatabase.vbs` with 2-server `SampleUpdateInfo.xml`
- Rehearse starting BizTalk services with connections across SQL-A (MgmtDb) and SQL-B (MsgBox)

### Cutover Phase — Key Differences from 1-Server

1. Run `BTS Log Shipping - Restore To Mark` on **both SQL-A and SQL-B** destination systems — both must be at the same mark
2. Restore logins on both SQL-A and SQL-B
3. Recreate jobs on both SQL-A (MgmtDb/Admin jobs) and SQL-B (MsgBox/DTA jobs)
4. Configure `Backup BizTalk Server` job on SQL-A to backup databases on both servers
5. Verify `Backup BizTalk Server` job can reach SQL-B backup paths

```sql
-- After cutover: verify Backup BizTalk Server job covers both servers
SELECT adm_BackupHistory.*, sd.SQLServerName
FROM adm_BackupHistory
JOIN adm_BackupHistory sd ON 1=1  -- illustrative; check actual adm_BackupHistory columns
ORDER BY BackupSetDateTime DESC;
```

---

## Post-Cutover Validation Checklist

- [ ] BizTalk Admin Console connects to BizTalkMgmtDb on SQL-A
- [ ] All host instances show Running state
- [ ] `TrackedMessages_Copy` job running on SQL-B; messages appearing in BizTalkDTADb on SQL-B
- [ ] `Backup BizTalk Server` job on SQL-A successfully backs up databases on both SQL-A and SQL-B
- [ ] `DTA Purge and Archive` running on SQL-B without errors
- [ ] DTC transactions succeed (test with an orchestration that spans multiple databases)
- [ ] BAM portal accessible and showing activity data (if BAM deployed)

---

## Key Reference Docs for This Topology

| Document | Purpose |
|---|---|
| [database-catalog.md](../reference/database-catalog.md) | Full database list and login/role requirements |
| [sql-agent-jobs-catalog.md](../reference/sql-agent-jobs-catalog.md) | All jobs — note which run on SQL-A vs SQL-B |
| [SampleUpdateInfo-template.xml](../reference/SampleUpdateInfo-template.xml) | Template — fill in two DestinationServer values |
| [new-sql-readiness-checklist.md](../reference/new-sql-readiness-checklist.md) | Run for both SQL-A and SQL-B |
| [change-plan-runbook.md](../runbook/change-plan-runbook.md) | Full cutover runbook (see two-server notes) |
