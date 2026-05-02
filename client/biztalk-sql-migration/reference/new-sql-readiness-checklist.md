# New SQL Server Readiness Checklist

**Purpose:** Validate the target SQL Server instance before migration begins.  
Run this checklist during the **Design phase** (Weeks 2–4) for every target SQL server instance.

**Sources:**  
- [Checklist: Configuring SQL Server](https://learn.microsoft.com/en-us/biztalk/technical-guides/checklist-configuring-sql-server)  
- [Planning for Database Performance](https://learn.microsoft.com/en-us/biztalk/technical-guides/planning-for-database-performance)  
- [How to Configure the Destination System for Log Shipping](https://learn.microsoft.com/en-us/biztalk/core/how-to-configure-the-destination-system-for-log-shipping)

---

## Pre-Checklist: Log Shipping Prerequisites

These must be met before the destination system can be configured for log shipping restore.

| # | Requirement | Validation Method | Pass/Fail |
|---|---|---|---|
| LS-1 | Same SQL Server version on source and destination | `SELECT @@VERSION` on both; compare major/minor build | |
| LS-2 | SQL Server installed in same relative path on source and destination | Check `%ProgramFiles%\Microsoft SQL Server\` on both | |
| LS-3 | Transaction log file directories (.LDF paths) exist on destination with same names and permissions as source | Compare directory listing from source; create missing paths on destination | |
| LS-4 | BizTalkMgmtDb source system is reachable from destination via linked server or direct query | Run `bts_ConfigureBizTalkLogShipping` stored procedure; verify no linked server errors | |

---

## Section 1: SQL Server Edition and Licensing

| # | Requirement | Notes | Pass/Fail |
|---|---|---|---|
| ED-1 | SQL Server Enterprise Edition if BAM RTA (Real-Time Aggregation) is required | BAM RTA requires Enterprise Edition; Standard Edition is insufficient | |
| ED-2 | SQL Server Enterprise Edition if more than 2-node Windows Server Failover Clustering is required | Standard Edition supports 2-node clustering only | |
| ED-3 | SQL Server 64-bit edition | 32-bit SQL Server has limited database lock count; high-volume MsgBox workloads require 64-bit | |
| ED-4 | SQL Server version matches or is within supported upgrade path from source | Validate against BizTalk Server compatibility matrix | |

---

## Section 2: Disk and I/O Configuration

| # | Requirement | Validation Query / Method | Pass/Fail |
|---|---|---|---|
| IO-1 | Data files (.MDF) and transaction log files (.LDF) on separate physical drives | Review drive mapping for each database filegroup | |
| IO-2 | MessageBox database files on dedicated drives, separate from DTA | Required to reduce disk I/O contention between runtime and tracking | |
| IO-3 | DTA database files on dedicated drives, separate from MessageBox | DTA Purge and Archive job is write-intensive | |
| IO-4 | Disk partitions are properly aligned | Use `DISKPART` or storage vendor tools to verify 4KB alignment | |
| IO-5 | Drive letters and directory paths match source system OR restore paths are documented and scripts updated | Pre-validate before restore; update `WITH MOVE` clauses in restore scripts if paths differ | |
| IO-6 | Sufficient disk space for all databases at projected size + 30% growth headroom | `SELECT name, size * 8 / 1024 AS size_mb FROM sys.databases` on source | |

---

## Section 3: SQL Server Configuration

| # | Requirement | T-SQL to Validate/Set | Pass/Fail |
|---|---|---|---|
| SC-1 | SQL Server Agent service is enabled and set to Automatic startup | `SELECT servicename, status_desc FROM sys.dm_server_services WHERE servicename LIKE '%Agent%'` | |
| SC-2 | Max Degree of Parallelism (MDOP) set to 1 for BizTalk workloads | `EXEC sp_configure 'max degree of parallelism'; -- should be 1` | |
| SC-3 | SQL Server max server memory and min server memory set to equal values (fixed allocation) | `EXEC sp_configure 'max server memory (MB)'; EXEC sp_configure 'min server memory (MB)'` | |
| SC-4 | tempdb has one data file per CPU core (max 8) with equal file sizes | `SELECT name, size FROM sys.master_files WHERE database_id = 2` | |
| SC-5 | Trace Flag 1118 (TF1118) enabled as SQL Server startup parameter | Check SQL Server Configuration Manager → SQL Server → Properties → Startup Parameters for `-T1118` | |
| SC-6 | SQL Server collation matches source instance collation | `SELECT SERVERPROPERTY('Collation')` on both source and target — must match | |
| SC-7 | Auto-growth configured as fixed MB (not percentage) for MsgBox and DTA databases | Set post-restore: `ALTER DATABASE BizTalkMsgBoxDb MODIFY FILE (NAME = ..., FILEGROWTH = 500MB)` | |
| SC-8 | SQL Server service account and BizTalk service accounts are present as SQL logins | Check Security → Logins in SSMS | |
| SC-9 | Linked server to source not required for production workload (log shipping only) | Verify no production BizTalk queries require cross-server links | |

---

## Section 4: Security and Identity

| # | Requirement | Validation Method | Pass/Fail |
|---|---|---|---|
| SEC-1 | BizTalk SQL login groups exist or are scripted and ready to create: BizTalk Application Users, BizTalk Isolated Host Users, BizTalk Server Administrators, BizTalk Server Operators, SSO Administrators | `SELECT name FROM sys.server_principals WHERE name LIKE '%BizTalk%'` | |
| SEC-2 | Service accounts for host instances are Active Directory accounts reachable from target SQL server | Verify AD membership and connectivity from target SQL server | |
| SEC-3 | BizTalk host instance service accounts have `sysadmin` during migration only — revoke after | Grant temporarily for restore; configure proper roles post-restore | |
| SEC-4 | SQL Server sysadmin account available for migration engineer | Required by Microsoft documented procedures | |
| SEC-5 | SPNs (Service Principal Names) for SQL Server registered in AD for Kerberos | `setspn -L <sqlservicaccount>` — verify MSSQLSvc SPNs exist for correct port | |
| SEC-6 | Windows Firewall rules allow BizTalk server(s) to connect to target SQL on required port (default 1433) | Test-NetConnection or `telnet <sqlserver> 1433` from each BizTalk server | |

---

## Section 5: High Availability and Backup

| # | Requirement | Validation Method | Pass/Fail |
|---|---|---|---|
| HA-1 | Windows Server Failover Cluster configured if FCI topology is required | Failover Cluster Manager — verify node health | |
| HA-2 | SQL Server Always On or FCI listener name and port configured if applicable | `SELECT name, dns_name FROM sys.availability_group_listeners` | |
| HA-3 | Backup destination UNC path reachable from target SQL server | `Test-Path \\backupserver\share` from target SQL server | |
| HA-4 | `Backup BizTalk Server` job backup path exists and SQL service account has write access | Test directory write from SQL service account | |
| HA-5 | DTC (Distributed Transaction Coordinator) service is running | `sc query MSDTC` — verify Running state | |
| HA-6 | DTC network access enabled for cross-server transactions (required for multi-MsgBox topologies) | Component Services → Computers → My Computer → DTC Properties → Security | |

---

## Section 6: Connectivity from BizTalk Servers

Run these tests from **each BizTalk application server** in the group:

| # | Test | Command | Expected Result |
|---|---|---|---|
| CN-1 | TCP connectivity to target SQL on port 1433 | `Test-NetConnection -ComputerName <sqlserver> -Port 1433` | TcpTestSucceeded = True |
| CN-2 | SQL Server authentication with BizTalk service account | Connect via SSMS using service account credentials | Successful login |
| CN-3 | BizTalkMgmtDb database access | `sqlcmd -S <sqlserver> -d BizTalkMgmtDb -Q "SELECT TOP 1 * FROM sys.tables"` | Returns results without error |
| CN-4 | Named pipe or TCP protocol enabled on target SQL | SQL Server Configuration Manager → Protocols for <instance> | TCP/IP = Enabled |

---

## Section 7: Dry Run Restore Validation

Before production cutover, complete a full dry run restore of all databases and verify:

| # | Validation | Pass/Fail |
|---|---|---|
| DR-1 | All databases restore successfully with `WITH RECOVERY` and `STOPAT MARK` | |
| DR-2 | All databases are in Online state post-restore | `SELECT name, state_desc FROM sys.databases WHERE name LIKE 'BizTalk%'` |
| DR-3 | `UpdateDatabase.vbs SampleUpdateInfo.xml` runs without errors | |
| DR-4 | `UpdateRegistry.vbs SampleUpdateInfo.xml` runs without errors on every BizTalk server | |
| DR-5 | BizTalk Admin Console connects to BizTalkMgmtDb on target SQL and enumerates the group | |
| DR-6 | All host instances start successfully | |
| DR-7 | `Backup BizTalk Server` job runs successfully with output files written to backup share | |
| DR-8 | `DTA Purge and Archive` job runs without errors | |
| DR-9 | All other SQL Agent jobs are enabled and show Success status on first run | |
| DR-10 | Smoke test transactions flow end-to-end | |

---

## Validation Queries Reference

```sql
-- Check SQL Server version
SELECT @@VERSION;

-- Check current MAXDOP setting
EXEC sp_configure 'max degree of parallelism';

-- Check memory settings
EXEC sp_configure 'max server memory (MB)';
EXEC sp_configure 'min server memory (MB)';

-- Check collation
SELECT SERVERPROPERTY('Collation') AS Collation, SERVERPROPERTY('Edition') AS Edition;

-- List all databases and states
SELECT name, state_desc, recovery_model_desc, log_reuse_wait_desc
FROM sys.databases
ORDER BY name;

-- Check tempdb file count and sizes
SELECT name, type_desc, size * 8 / 1024 AS size_mb, growth, is_percent_growth
FROM sys.master_files
WHERE database_id = 2
ORDER BY type_desc, name;

-- Check SQL Agent service status
SELECT servicename, status_desc, startup_type_desc
FROM sys.dm_server_services;

-- Verify backup history is accessible
SELECT TOP 5 database_name, backup_start_date, backup_finish_date, type
FROM msdb.dbo.backupset
ORDER BY backup_finish_date DESC;
```
