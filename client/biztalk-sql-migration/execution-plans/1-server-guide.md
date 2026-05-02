# Execution Guide: 1-Server Topology

**Topology:** All BizTalk databases on a single SQL Server instance (SQL-A)  
**MS Project Plan:** [1-server.xml](1-server.xml) — 44 tasks across 7 phases  
**Scenario Guide:** [scenario-selection-guide.md](scenario-selection-guide.md)

---

## Environment Map

| Server Role | Instance Name | Databases Hosted |
|---|---|---|
| **SQL-A** (All-in-One) | `<SQL-A-INSTANCE>` | BizTalkMgmtDb, BizTalkMsgBoxDb, BizTalkDTADb, SSODB, BizTalkRuleEngineDb, BAMPrimaryImport, BAMArchive, BAMStarSchema, BAMAnalysis, BAMAlertsApplication, BAMAlertsNSMain |

**All databases move from one source SQL instance to one target SQL instance.** This is the simplest migration topology.

---

## Phase-by-Phase Execution Notes

### Phase 1 — Discover (Weeks 1–2, ~42 hours)

**Inventory SQL Server state on source:**
```sql
-- Confirm all BizTalk databases present
SELECT name, state_desc, recovery_model_desc
FROM sys.databases
WHERE name IN ('BizTalkMgmtDb','BizTalkMsgBoxDb','BizTalkDTADb','SSODB',
               'BizTalkRuleEngineDb','BAMPrimaryImport','BAMArchive',
               'BAMStarSchema','BAMAnalysis','BAMAlertsApplication','BAMAlertsNSMain')
ORDER BY name;
```

**Confirm SQL Agent jobs on source (expect 13+ jobs):**
```sql
SELECT name, enabled FROM msdb.dbo.sysjobs
WHERE name LIKE '%BizTalk%' OR name LIKE '%DTA%' 
   OR name LIKE '%MessageBox%' OR name LIKE '%Rules%' 
   OR name LIKE '%TrackedMessages%'
ORDER BY name;
```

**Confirm SSO master secret server:**
```cmd
ssoconfig.exe -displaydb
```

### Phase 2 — Design (Weeks 2–4, ~100 hours)

**Target SQL-A readiness validation:**
- Complete all items in [new-sql-readiness-checklist.md](../reference/new-sql-readiness-checklist.md)
- All databases will land on a single instance — verify disk I/O capacity for combined workload
- Ensure MsgBox `.MDF`/`.LDF` and DTA `.MDF`/`.LDF` are on **separate physical drives** within SQL-A

**SampleUpdateInfo.xml preparation:**
- Copy [SampleUpdateInfo-template.xml](../reference/SampleUpdateInfo-template.xml) to BizTalk server
- Replace ALL `SourceServer` → actual source SQL instance name
- Replace ALL `DestinationServer` → actual target SQL-A instance name
- All entries point to the same destination server
- Uncomment BAM section if BAM is deployed
- Uncomment RulesEngine section if BRE is deployed

### Phase 3 — Build and Rehearsal (Weeks 4–8, ~96 hours)

**Script all SQL Agent jobs from source SQL-A:**
```sql
-- SSMS: Right-click each job → Script Job As → CREATE To → File
-- Minimum: Backup BizTalk Server, DTA Purge and Archive
```

**Script all SQL logins from source SQL-A:**
```sql
-- SSMS: Security → Logins → right-click each BizTalk login → Script Login As → CREATE To
-- Required logins: BizTalk Application Users, BizTalk Isolated Host Users,
-- BizTalk Server Administrators, BizTalk Server Operators, SSO Administrators
```

**Dry run restore on target SQL-A:**
- Run `Backup BizTalk Server` job on source to create current backup set
- Configure log shipping destination: `bts_ConfigureBizTalkLogShipping`
- Restore all databases to same mark using `BTS Log Shipping - Restore To Mark` job
- Verify restore with: `SELECT name, state_desc FROM sys.databases WHERE name LIKE 'BizTalk%'`
- Run `UpdateDatabase.vbs` and `UpdateRegistry.vbs` with prepared `SampleUpdateInfo.xml`
- Start host instances; verify connectivity; run smoke test

### Phase 4 — Test (Weeks 8–10, ~58 hours)

**Pre-cutover validation gates:**
- [ ] All 44 tasks in `1-server.xml` project plan marked complete through Phase 3
- [ ] CAB change request submitted and approved
- [ ] Business outage notification sent
- [ ] Freeze window confirmed with stakeholders
- [ ] Login scripts validated in lower environment
- [ ] Job scripts validated in lower environment  
- [ ] Rollback tested: repoint to source, start services, validate

**Go/No-Go 1 — Pre-freeze gate:**
```sql
-- Verify backup chain is healthy
SELECT TOP 5 database_name, backup_start_date, backup_finish_date, type
FROM msdb.dbo.backupset
ORDER BY backup_finish_date DESC;
```

### Phase 5 — Cutover (Maintenance window, ~22 hours)

#### Cutover Sequence for 1-Server Topology

| Step | Time | Action | Command / Verification |
|---|---|---|---|
| 1 | T-0 | Open change bridge; confirm attendance | Bridge roll call complete |
| 2 | T+0 | Freeze inbound: disable all receive locations | BizTalk Admin Console → Receive Locations → Disable All |
| 3 | T+15 | Stop all BizTalk host instances | Services.msc or `net stop BTSSvc$<HostName>` on all BizTalk servers |
| 4 | T+30 | Stop IIS | `iisreset /stop` on all BizTalk servers hosting HTTP/S adapters |
| 5 | T+40 | Stop SQL Server Agent on source SQL-A | `net stop SQLSERVERAGENT` |
| 6 | T+45 | Take final backup (Backup BizTalk Server job) | SSMS: manually start `Backup BizTalk Server (BizTalkMgmtDb)` job; wait for Success |
| 7 | T+60 | Restore all databases to target SQL-A | Run `BTS Log Shipping - Restore To Mark`; verify all DBs in Online state |
| 8 | T+90 | Restore SQL logins to target SQL-A | Execute scripted login `.sql` files in SSMS |
| 9 | T+100 | Detect and fix orphaned users | `EXEC sp_change_users_login 'Report';` then remap as needed |
| 10 | T+110 | Recreate SQL Agent jobs on target SQL-A | Execute all scripted job `.sql` files; configure `Backup BizTalk Server` paths |
| 11 | T+120 | Run `UpdateDatabase.vbs` on one BizTalk server | `cscript UpdateDatabase.vbs SampleUpdateInfo.xml` |
| 12 | T+125 | Run `UpdateRegistry.vbs` on every BizTalk server | `cscript UpdateRegistry.vbs SampleUpdateInfo.xml` |
| 13 | T+130 | Restart Windows Management Instrumentation service | `services.msc` → WMI → Restart |
| 14 | T+135 | Reconnect BizTalk Admin Console to new group | Right-click BizTalk Group → Remove; Connect to Existing Group → SQL-A target |
| 15 | T+140 | Start SQL Server Agent on target SQL-A | `net start SQLSERVERAGENT` |
| 16 | T+150 | Start BizTalk host instances | `net start BTSSvc$<HostName>` on all BizTalk servers |
| 17 | T+160 | Start IIS | `iisreset /start` |
| 18 | T+165 | Run smoke tests | End-to-end message flow; DTA query; Admin Console connectivity |
| 19 | T+180 | Business validation sign-off | App owner confirms transactions processing |
| 20 | T+185 | Declare go-live; close change bridge | Change Manager closes change record |

**Go/No-Go 2 — Before repoint:** All services stopped, no in-flight work, final backup complete.  
**Go/No-Go 3 — Before restart:** All databases restored, logins present, jobs recreated, pointers updated.  
**Go/No-Go 4 — Exit cutover:** Smoke tests pass, critical jobs successful.

### Phase 6 — Optional BAM Workstream

If BAM is deployed on SQL-A, after the standard restore sequence:

1. Restore `BAMAnalysis` separately (it is NOT in the BizTalk backup job chain)
2. Update BAM database reference connections: `SampleUpdateInfo.xml` already covers `BAMPrimaryImport`, `BAMStarSchema`, `BAMArchive`
3. Add `BAMAlertsApplication` and `BAMAlertsNSMain` to `SampleUpdateInfo.xml` OtherDatabases section
4. Update BAM portal web.config connection strings if applicable
5. Verify BAM portal connectivity and activity instance status
6. Run `How to Resolve Incomplete Activity Instances` procedure if needed
7. Restart BAM Notification Services application pools

### Phase 7 — Post-Cutover Stabilization (Weeks 10–12, ~54 hours)

```sql
-- Monitor SQL Agent job health daily for first 4 days
SELECT j.name, j.enabled, h.run_status, h.run_date, h.run_time, h.message
FROM msdb.dbo.sysjobs j
LEFT JOIN msdb.dbo.sysjobhistory h ON j.job_id = h.job_id
    AND h.instance_id = (SELECT MAX(instance_id) FROM msdb.dbo.sysjobhistory WHERE job_id = j.job_id)
WHERE j.name LIKE '%BizTalk%' OR j.name LIKE '%DTA%'
ORDER BY j.name;
```

---

## Rollback Procedure

If cutover fails at any step before Go/No-Go 4:

1. Keep all services stopped
2. Re-run `UpdateDatabase.vbs` with **original** `SampleUpdateInfo.xml` (source server values)
3. Re-run `UpdateRegistry.vbs` on every BizTalk server
4. Re-enable SQL Agent jobs on source SQL
5. Start BizTalk host instances and IIS against original SQL
6. Re-enable receive locations
7. Validate smoke tests on source platform
8. Notify stakeholders and declare rollback on change bridge

---

## Key Reference Docs for This Topology

| Document | Purpose |
|---|---|
| [database-catalog.md](../reference/database-catalog.md) | Complete database list and login requirements |
| [sql-agent-jobs-catalog.md](../reference/sql-agent-jobs-catalog.md) | All jobs to script, recreate, and validate |
| [SampleUpdateInfo-template.xml](../reference/SampleUpdateInfo-template.xml) | Template for pointer update — fill in one DestinationServer |
| [new-sql-readiness-checklist.md](../reference/new-sql-readiness-checklist.md) | Target SQL-A validation checklist |
| [change-plan-runbook.md](../runbook/change-plan-runbook.md) | Full cutover runbook |
