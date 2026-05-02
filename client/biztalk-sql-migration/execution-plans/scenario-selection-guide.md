# BizTalk SQL Server Topology Scenario Selection Guide

**Purpose:** Decision framework for selecting the correct SQL Server topology for a BizTalk SQL migration.  
**Sources:**  
- [Scaling Your Solutions](https://learn.microsoft.com/en-us/biztalk/core/scaling-your-solutions)  
- [Planning for Database Performance](https://learn.microsoft.com/en-us/biztalk/technical-guides/planning-for-database-performance)  
- [Checklist: Configuring SQL Server](https://learn.microsoft.com/en-us/biztalk/technical-guides/checklist-configuring-sql-server)  
- [Databases in BizTalk Server](https://learn.microsoft.com/en-us/biztalk/core/databases-in-biztalk-server)

---

## Scenario Overview

| Scenario | SQL Servers | Best For | Approx. Total Duration | Execution Plan |
|---|---|---|---|---|
| [1-Server](#scenario-1-single-sql-server) | 1 | Dev/Test, small-volume, consolidation | ~136 hours | [1-server.xml](1-server.xml) |
| [2-Servers](#scenario-2-two-sql-servers) | 2 | Mid-tier production, balanced I/O separation | ~148 hours | [2-servers.xml](2-servers.xml) |
| [3-Servers](#scenario-3-three-sql-servers) | 3 | Production, MsgBox isolation + combined admin | ~128 hours | [3-servers.xml](3-servers.xml) |
| [4-Servers](#scenario-4-four-sql-servers) | 4 | High-volume enterprise production, full isolation | ~variable | [4-servers.xml](4-servers.xml) |

---

## Decision Tree

```
Is this a dev/test or proof-of-concept environment?
├─ YES → Scenario 1 (Single Server)
└─ NO ↓

Is message volume low-to-moderate (< 100 msg/sec sustained) 
AND budget/infrastructure limits available SQL servers to 2?
├─ YES → Scenario 2 (Two Servers)
└─ NO ↓

Is message volume moderate-to-high (> 100 msg/sec) 
AND BAM is not active or can share the admin server?
├─ YES → Scenario 3 (Three Servers)
└─ NO ↓

Is message volume high (> 500 msg/sec) OR BAM Active 
Real-Time Aggregation (RTA) is required?
├─ YES → Scenario 4 (Four Servers)
└─ DISCUSS with BizTalk architect: custom topology may be needed
```

---

## Scenario 1: Single SQL Server

### Database Placement

| Database | Server |
|---|---|
| BizTalkMgmtDb | SQL-A |
| BizTalkMsgBoxDb | SQL-A |
| BizTalkDTADb | SQL-A |
| SSODB | SQL-A |
| BizTalkRuleEngineDb | SQL-A |
| BAMPrimaryImport | SQL-A |
| BAMArchive | SQL-A |
| BAMStarSchema | SQL-A |
| BAMAnalysis | SQL-A |
| BAMAlertsApplication | SQL-A |
| BAMAlertsNSMain | SQL-A |

### When to Use
- Development, test, or QA environments
- Small business / departmental integration (low message volume)
- Proof-of-concept migrations
- Infrastructure cost constraints require minimal SQL servers
- Total message throughput under 20–30 messages/second sustained

### Key Constraints
- **All I/O contention is on a single server** — MessageBox and DTA compete for the same disk subsystem
- Disk I/O contention between `BizTalkMsgBoxDb` and `BizTalkDTADb` is the primary performance risk
- Mitigation: place `.MDF` and `.LDF` files on separate physical disks within the single server
- `DTA Purge and Archive` job runs on the same server as the MessageBox runtime

### SQL Configuration Requirements
- At minimum: SQL Server Standard Edition (BAM RTA not available without Enterprise Edition)
- All BizTalk SQL Agent jobs run on SQL-A
- `Backup BizTalk Server` job runs on SQL-A with single backup destination
- tempdb: one data file per CPU core (max 8), equal sizes, on dedicated drive

### Migration Notes
- Single `SampleUpdateInfo.xml` with all entries pointing to the same `DestinationServer`
- Single set of SQL Agent jobs to script and recreate
- Single set of logins to transfer
- Simplest topology — lowest migration risk

---

## Scenario 2: Two SQL Servers

### Database Placement

| Database | Server | Rationale |
|---|---|---|
| BizTalkMgmtDb | SQL-A | Admin — low I/O; configuration reads |
| SSODB | SQL-A | SSO — low I/O; configuration reads |
| BizTalkRuleEngineDb | SQL-A | Rules — low I/O; infrequent writes |
| BAMPrimaryImport | SQL-A | BAM — separate from OLTP runtime |
| BAMArchive | SQL-A | BAM — archive writes |
| BAMStarSchema | SQL-A | BAM — OLAP staging |
| BAMAnalysis | SQL-A | BAM — OLAP cubes |
| BAMAlertsApplication | SQL-A | BAM Notification Services |
| BAMAlertsNSMain | SQL-A | BAM Notification Services |
| BizTalkMsgBoxDb | SQL-B | **Isolated** — highest I/O, runtime critical |
| BizTalkDTADb | SQL-B | Tracking — same server as MsgBox reduces network hop for TrackedMessages_Copy job |

### When to Use
- Production environments with moderate message volume
- I/O separation between admin/BAM functions and runtime messaging is required
- Budget or infrastructure supports exactly two SQL servers
- Organization standard requires admin/config databases separated from runtime

### Key Constraints
- `TrackedMessages_Copy_BizTalkMsgBoxDb` job copies from SQL-B (MsgBox) to SQL-B (DTA) — same-server, minimal network overhead
- `DTA Purge and Archive` job I/O impact falls on SQL-B — monitor for contention with MsgBox runtime
- BAM OLAP cube processing on SQL-A — does not impact runtime on SQL-B
- DTC is required if orchestrations span databases across SQL-A and SQL-B

### SQL Configuration Requirements
- SQL-B requires Enterprise Edition only if BAM RTA is used (BAM is on SQL-A in this topology)
- SQL-B should have dedicated high-I/O disks for MsgBox data and log files
- Both servers require SQL Server Agent running
- `Backup BizTalk Server` job runs on SQL-A (where BizTalkMgmtDb resides) and backs up all databases on both servers

### Migration Notes
- `SampleUpdateInfo.xml` entries split across two destination servers
- Two sets of SQL Agent jobs — verify correct job runs on correct server
- Two sets of logins to script and restore
- DTC network access must be enabled and tested between SQL-A and SQL-B

---

## Scenario 3: Three SQL Servers

### Database Placement

| Database | Server | Rationale |
|---|---|---|
| BizTalkMsgBoxDb | SQL-A | **Dedicated MsgBox server** — maximum I/O for runtime |
| BizTalkDTADb | SQL-B | **Dedicated DTA server** — isolates archive I/O from runtime |
| BizTalkMgmtDb | SQL-C | Admin/BAM server — low I/O |
| SSODB | SQL-C | Co-located with MgmtDb |
| BizTalkRuleEngineDb | SQL-C | Low I/O; configuration reads |
| BAMPrimaryImport | SQL-C | BAM — write from BAM interceptors |
| BAMArchive | SQL-C | BAM — archive jobs |
| BAMStarSchema | SQL-C | BAM — OLAP staging |
| BAMAnalysis | SQL-C | BAM — OLAP cubes |
| BAMAlertsApplication | SQL-C | BAM Notification Services |
| BAMAlertsNSMain | SQL-C | BAM Notification Services |

### When to Use
- Production environments with high message volume
- DTA Purge and Archive job is causing I/O contention on MsgBox server (this fixes that)
- Organization requires MessageBox fully isolated from all analytics/admin writes
- Three SQL servers are available or provisioned

### Key Constraints
- `TrackedMessages_Copy_BizTalkMsgBoxDb` job copies data from SQL-A → SQL-B across the network — latency must be low (< 1ms LAN)
- `DTA Purge and Archive` on SQL-B — isolated from MsgBox I/O
- BAM on SQL-C — fully separated from runtime tier
- DTC required for cross-server transactions (SQL-A ↔ SQL-B, SQL-A ↔ SQL-C)

### SQL Configuration Requirements
- SQL-A (MsgBox): Enterprise or Standard; highest-I/O storage; 64-bit required
- SQL-B (DTA): Standard Edition sufficient; moderate I/O; dedicated drives for DTA data and log
- SQL-C (Admin/BAM): Enterprise Edition required if BAM RTA is used; otherwise Standard is sufficient
- All three servers need SQL Server Agent running
- `Backup BizTalk Server` job runs on SQL-C and backs up databases on all three servers

### Migration Notes
- `SampleUpdateInfo.xml` with entries across three destination servers
- Three sets of SQL Agent jobs — carefully validate job-to-server mapping
- Three sets of logins to script and restore
- DTC network access tested between all three server pairs
- Network latency between SQL-A and SQL-B is critical — validate with `ping` and SQL Server latency tests

---

## Scenario 4: Four SQL Servers

### Database Placement

| Database | Server | Rationale |
|---|---|---|
| BizTalkMsgBoxDb | SQL-A | **Dedicated MsgBox** — maximum I/O isolation |
| BizTalkDTADb | SQL-B | **Dedicated DTA** — archive I/O fully isolated |
| BizTalkMgmtDb | SQL-C | Admin server — configuration reads only |
| SSODB | SQL-C | Co-located with MgmtDb |
| BizTalkRuleEngineDb | SQL-C | Co-located with MgmtDb |
| BAMPrimaryImport | SQL-D | **Dedicated BAM server** — BAM interceptors don't touch runtime |
| BAMArchive | SQL-D | BAM archive |
| BAMStarSchema | SQL-D | OLAP staging |
| BAMAnalysis | SQL-D | OLAP cubes — **requires Enterprise Edition on SQL-D** if BAM RTA |
| BAMAlertsApplication | SQL-D | BAM Notification Services |
| BAMAlertsNSMain | SQL-D | BAM Notification Services |

### When to Use
- High-volume enterprise production environments (> 500 msg/sec sustained)
- BAM Real-Time Aggregation (RTA) is actively used — requires Enterprise Edition
- BAM OLAP cube processing would impact runtime if co-located
- Organization has resources to manage four dedicated SQL Server instances
- Maximum isolation between all BizTalk I/O tiers is required

### Key Constraints
- `TrackedMessages_Copy_BizTalkMsgBoxDb` job copies SQL-A → SQL-B — network latency critical
- BAM interceptors write to SQL-D independently from MsgBox runtime on SQL-A
- DTC required for cross-server transactions (all four server pairs where transactions span)
- `Backup BizTalk Server` job runs on SQL-C and backs up all four servers
- Four independent SQL Agent job sets to manage
- SQL-D **must** be Enterprise Edition if BAM RTA features are used

### SQL Configuration Requirements
- SQL-A (MsgBox): 64-bit, Enterprise or Standard, highest-I/O storage, dedicated tempdb
- SQL-B (DTA): Standard Edition sufficient, dedicated archive drives
- SQL-C (Admin): Standard Edition sufficient, low I/O
- SQL-D (BAM): **Enterprise Edition required for BAM RTA**; OLAP services (SSAS) required for BAMAnalysis
- All four servers require SQL Server Agent running
- DTC network access validated between all server pairs

### Migration Notes
- Most complex migration: four SQL instances, four job sets, four login sets
- `SampleUpdateInfo.xml` with entries across four destination servers
- BAM databases have additional migration steps (see runbook Section 4H)
- BAMAnalysis backed up separately — NOT in the BizTalk backup chain
- Highest total migration effort but maximum operational isolation post-migration

---

## Topology Comparison Summary

| Factor | 1 Server | 2 Servers | 3 Servers | 4 Servers |
|---|---|---|---|---|
| **Migration complexity** | Low | Medium | Medium-High | High |
| **Post-migration I/O isolation** | None | MsgBox+DTA / Admin+BAM | MsgBox / DTA / Admin+BAM | Full isolation |
| **DTC required** | No | Yes (if multi-host) | Yes | Yes |
| **Enterprise SQL required** | No (unless BAM RTA) | No (unless BAM RTA) | SQL-C if BAM RTA | SQL-D if BAM RTA |
| **SQL Agent job sets** | 1 | 2 | 3 | 4 |
| **SampleUpdateInfo entries** | All on 1 server | 2 servers | 3 servers | 4 servers |
| **Recommended for production** | No | Small-medium | Yes | Large enterprise |
| **Estimated migration duration** | ~136 hrs | ~148 hrs | ~128 hrs | ~136+ hrs |

---

## Topology-Specific Execution Guides

For step-by-step execution guidance for each topology, see:

- [1-Server Execution Guide](1-server-guide.md)
- [2-Servers Execution Guide](2-servers-guide.md)
- [3-Servers Execution Guide](3-servers-guide.md)
- [4-Servers Execution Guide](4-servers-guide.md)
