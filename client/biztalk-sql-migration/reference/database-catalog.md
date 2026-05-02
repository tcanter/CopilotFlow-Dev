# BizTalk Server Database Catalog

**Source:** Microsoft Learn — [Databases in BizTalk Server](https://learn.microsoft.com/en-us/biztalk/core/databases-in-biztalk-server)  
**Source:** Microsoft Learn — [Database Structure and Jobs](https://learn.microsoft.com/en-us/biztalk/core/database-structure-and-jobs)

---

## Overview

BizTalk Server can create up to 13 separate databases in SQL Server. The first four are required for core runtime operations. The remaining databases are feature-conditional. All databases must be moved as a consistent set during SQL Server migration.

> **Critical migration rule:** All databases must be restored to the **same transaction mark** to ensure a consistent transactional state. You cannot restore databases independently to different points in time.

---

## Core Runtime Databases (Always Required)

| Database Name | Default Name | Purpose | I/O Profile |
|---|---|---|---|
| BizTalk Management | `BizTalkMgmtDb` | Central meta-information store for all BizTalk group configuration — applications, ports, adapters, pipelines, orchestrations. Contains the `SampleUpdateInfo.xml` target records. | Moderate read-heavy |
| BizTalk MessageBox | `BizTalkMsgBoxDb` | Runtime messaging engine: routing, queuing, instance management, subscription management. Highest I/O database in the group. Can be scaled out to multiple MessageBox databases. | Very high read/write |
| BizTalk Tracking | `BizTalkDTADb` | Health monitoring data: tracked messages, service instances, port activity, shape tracking. Write-intensive during normal operation; archiving required. | High write |
| Enterprise Single Sign-On | `SSODB` | Stores encrypted configuration for receive locations and send port credentials. Required for host instance startup. | Low-moderate |

---

## Feature-Conditional Databases

These databases are only present if the corresponding features were configured.

| Database Name | Default Name | Feature Required | Notes |
|---|---|---|---|
| Rule Engine | `BizTalkRuleEngineDb` | Business Rules Engine (BRE) | Repository for policies (rule sets) and vocabularies. Present in most BizTalk installations that use BRE. Rule Engine Update Service account requires `RE_HOST_USERS` role here. |
| BAM Primary Import | `BAMPrimaryImport` | Business Activity Monitoring (BAM) | Raw BAM tracking data from business processes. Written to by BAM interceptors. Part of the coordinated backup chain. |
| BAM Archive | `BAMArchive` | BAM | Archives old BAM Primary Import data to prevent unbounded growth. Must be restored from a backup **older than** the BAM Primary Import backup. |
| BAM Star Schema | `BAMStarSchema` | BAM | Staging table + OLAP dimension/measure tables for BAM analysis. |
| BAM Analysis | `BAMAnalysis` | BAM (OLAP cubes) | OLAP cubes for online and offline BAM analysis. **Requires SQL Server Enterprise Edition** for BAM RTA. Backed up separately — not in the BizTalk backup job chain. |
| BAM Notification Services Application | `BAMAlertsApplication` | BAM Notification Services | Alert definitions, conditions, and event data for BAM portal alerts. Must be added manually to `SampleUpdateInfo.xml` OtherDatabases section. |
| BAM Notification Services Instance | `BAMAlertsNSMain` | BAM Notification Services | Instance metadata for how Notification Services connects to the BAM monitoring system. Must be added manually to `SampleUpdateInfo.xml` OtherDatabases section. |
| Windows SharePoint Services Configuration | User-defined | WSS adapter | Global settings for the WSS integration. Only present if WSS adapter is configured. |
| Windows SharePoint Services Content | User-defined | WSS adapter | Site content (list items, documents) for WSS integration. |

---

## SQL Server Login Groups and Required Roles

These SQL Server login groups are created by BizTalk configuration and must be scripted and re-created on the target SQL instance before restoring databases.

| Login Group | Database Roles Required |
|---|---|
| BizTalk Application Users | `BTS_HOST_USERS` on: BizTalkMgmtDb, BizTalkMsgBoxDb, BizTalkRuleEngineDb, BizTalkDTADb, BAMPrimaryImport. Also `BAM_EVENT_WRITER` on BAMPrimaryImport. |
| BizTalk Isolated Host Users | `BTS_HOST_USERS` on: BizTalkMgmtDb, BizTalkMsgBoxDb, BizTalkRuleEngineDb, BizTalkDTADb, BAMPrimaryImport. |
| BizTalk Server Administrators | `BTS_ADMIN_USERS` on: BizTalkMgmtDb, BizTalkMsgBoxDb, BizTalkRuleEngineDb, BizTalkDTADb, BAMPrimaryImport. `db_owner` on: BAMStarSchema, BAMPrimaryImport, BAMArchive, BAMAlertsApplication, BAMAlertsNSMain. `NSAdmin` on: BAMAlertsApplication, BAMAlertsNSMain, BizTalkDTADb, BizTalkMgmtDb. OLAP Administrators on BAMAnalysis host. |
| BizTalk Server Operators | `BTS_OPERATORS` on: BizTalkDTADb, BizTalkMgmtDb, BizTalkMsgBoxDb, BizTalkRuleEngineDb. |
| SSO Administrators | `db_owner` on SSODB. `securityadmin` server role on the SQL instance hosting SSO. |
| Rule Engine Update Service account | `RE_HOST_USERS` on BizTalkRuleEngineDb. |
| BAM Notification Services User account | `NSRunService` on BAMAlertsApplication and BAMAlertsNSMain. `BAM_ManagementNSReader` on BAMPrimaryImport. |
| BAM Management Web Service user account | `NSSubscriberAdmin` on BAMAlertsApplication and BAMAlertsNSMain. `BAM_ManagementWS` on BAMPrimaryImport. |

---

## Database Placement by Topology

| Database | 1 Server | 2 Servers | 3 Servers | 4 Servers |
|---|---|---|---|---|
| BizTalkMgmtDb | SQL-A | SQL-A | SQL-C | SQL-C |
| BizTalkMsgBoxDb | SQL-A | SQL-B | SQL-A | SQL-A |
| BizTalkDTADb | SQL-A | SQL-B | SQL-B | SQL-B |
| SSODB | SQL-A | SQL-A | SQL-C | SQL-C |
| BizTalkRuleEngineDb | SQL-A | SQL-A | SQL-C | SQL-C |
| BAMPrimaryImport | SQL-A | SQL-A | SQL-C | SQL-D |
| BAMArchive | SQL-A | SQL-A | SQL-C | SQL-D |
| BAMStarSchema | SQL-A | SQL-A | SQL-C | SQL-D |
| BAMAnalysis | SQL-A | SQL-A | SQL-C | SQL-D |
| BAMAlertsApplication | SQL-A | SQL-A | SQL-C | SQL-D |
| BAMAlertsNSMain | SQL-A | SQL-A | SQL-C | SQL-D |

**Rationale for separation:**
- **MsgBox on its own server** — Highest I/O; isolation prevents contention with DTA archiving jobs.
- **DTA on its own server** — DTA Purge and Archive job is write-intensive; isolation reduces impact on runtime.
- **BAM on its own server** — OLAP cubes require Enterprise Edition; BAM Analysis writes are separate from OLTP patterns.
- **Admin/SSO/Rules together** — Low I/O; these are configuration-read-dominant databases that co-locate efficiently.

---

## Backup Chain Requirements

BizTalk uses a **coordinated marked transaction backup** strategy via the `Backup BizTalk Server (BizTalkMgmtDb)` SQL Agent job:

- The backup job writes a named mark into the transaction log of every BizTalk database simultaneously.
- All databases must be restored to the **same mark** — this is the transactional consistency gate.
- The `adm_BackupHistory` table in `BizTalkMgmtDb` is the central record of all backup history.
- `BAMAnalysis` is **not** included in the standard BizTalk backup job — it must be backed up separately.
- BAM Archive and BAM Star Schema must be restored from backups **older than** the BAM Primary Import backup.

---

## Sources

- [Databases in BizTalk Server](https://learn.microsoft.com/en-us/biztalk/core/databases-in-biztalk-server)
- [Database Structure and Jobs](https://learn.microsoft.com/en-us/biztalk/core/database-structure-and-jobs)
- [Backing Up and Restoring BizTalk Server](https://learn.microsoft.com/en-us/biztalk/core/backing-up-and-restoring-biztalk-server)
- [Planning for Database Performance](https://learn.microsoft.com/en-us/biztalk/technical-guides/planning-for-database-performance)
- [Windows Groups and User Accounts in BizTalk Server](https://learn.microsoft.com/en-us/biztalk/core/windows-groups-and-user-accounts-in-biztalk-server)
