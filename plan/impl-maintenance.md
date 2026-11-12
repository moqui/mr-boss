# IronStone BOSS — Maintenance implementation

Nov 12, 2026 — gate 1 built: P1–P5 (corrective maintenance from a report to a restored resource), each phase reviewed by a fresh agent and merged on its focused specs; the full suites and the acceptance suite run once at the end of the build (the user's call). P6 and P15 are built or building; only P8 waits on People (P18).
Nov 11, 2026 — P0 done (§6 F58–F75), at mr-moqui 5d83f22d, mr-boss 9c7e87e4 and mr-mantle 61e5ae33, with People P1–P7
and Admin P17–P18 built. People P7 built the managed-work refusal in the generic task services already, reading the
work order by the name P3 gives it (F59); the instantiation copies no content, requirements or skills (F58); a dated
custody end may not be later than now (F61); Employee360 needs a Maintenance row and its own equipment read (F62);
the time services check no work access, so Maintenance has its own time entry points (F66); `get#RecordLinkInfo`
admits a work effort by organization in every app, so P3 adds a Maintenance rule there (F69). P8, P11, P12, P19 and
P17's cost entry wait for People P9, P10, P12 and P18 (§4); the items of P0 on those People phases are left open
(F64, F75). Design §1.3 and §13.2 are corrected for the time services (F66).
Nov 11, 2026 — the open questions answered (§4): the budgets may rise by the plan's estimates as its phases land, the
equipment import names `MAINTENANCE_IMPORT`, labor is priced from the one costing purpose `RaprCost` through
`get#CostingRate`, P9 builds AC-24, gate 1 is released on its own, and the planned-work approval threshold compares
estimated hours (P3) and an estimated cost computed from the planned parts and labor, never stored (P11).
Nov 11, 2026 — reconciled with impl-people, impl-sales and impl-marketing: People's P7 builds both process policy
records, minimal, and P6 here extends them and sets their guards-execution flag (the review below read an earlier
impl-people with no policy record); the return task is completed by People's rule on the assignment's end; Q1 is a
decision in §4, Q2 points to impl-people's Q2, Q8 is the one question on customer-equipment PM and Q11 points to
impl-sales' import question; supplier warranty terms are no link to Sales.
Nov 11, 2026 — reviewed against the designs, the code and the other three plans: what People builds is named by its
phase and the process engine's split follows impl-people (no policy record there; P6 builds it); the Mantle guard on
production equipment, Admin's job, topic and export registrations and the import target's permissions are in their
phases; the lifecycle participant moved to P3; the links to Sales say who builds each (F49–F57, §6). Q1 and Q2 are
answered by impl-people (§5), and design-maintenance is corrected for F12, F16 and F17.
Nov 11, 2026 — plan, before Maintenance starts. Written against mr-moqui 16828c5f, mr-boss f1bf2a95 and mr-mantle
0048667f, with Admin P1–P16 and Insights P1–P10 built and Admin P17–P19 and Insights P11–P12 not. P0 partly done:
F1–F48 found while writing it (§6); two of them changed design-maintenance (F31, F36). Maintenance is the second of
the four apps built next (People, Maintenance, Sales, Marketing), each on its own plan and order (§4). People is
built before it, so its links to People are built here; its links to Sales and Marketing are left to their plans
(§7). The open questions of the plan as written are in §5, each with the answer the plan recommends.

How [design-maintenance.md](design-maintenance.md) gets built, in phases from the foundation to the finish, each
ending tested and usable. This file is kept at a high level, as [impl-admin.md](impl-admin.md) and the core-app plans
are: each phase names its scope by the design's sections and §13 needs rather than restating them, and the design
stays the place for screen and record detail. During the build this file is the log: phase status and what each
built, the decisions made, open questions, findings against the code, and what is deferred.

Today `screen/Maintenance/` holds six flat placeholders (Home, WorkOrders, Equipment, Facilities, Scheduling,
Settings), and the root mounts only Chatter and RecordFiles and has no shell providers. The `BOSS_MAINTENANCE`
artifact group is live for `ADMIN` and `BOSS_MAINTENANCE_ADMIN` (F1); P1 adds the root user group and the ordinary
groups. None of the design's proposed Mantle service families, records or seeds exists beyond what Manufacturing and
Customer Service built on the way (F3). Maintenance is built on what is there (as found in the code, §6):
- from the framework: the list views (`view-board`, `view-calendar`, `view-tree`), `scan-input` and
  `density="handheld"`, the shell providers (palette, quick create, Today, notification topics, `record-lookup`,
  `create-from`, `call-context`, `assist-prompt`, `response-action`), `ec.resource.barcodeSvg`, the speech and call
  services, the report engine with its datasets and alert templates, operation telemetry, and Admin's
  `org.moqui.admin.DataTransferServices` with its transfer targets (F36, F38);
- from Mantle: WorkEffort with its template flag, tree, associations, requirements, content, parties and status flows;
  `clone#WorkEffort`; Asset, AssetMaintenance, AssetMeter, AssetRegistration, AssetPartyAssignment, ProductMeter and
  ProductMaintenance with `EquipmentServices`; Facility with `FacilityServices.store#Facility`; `EventServices`'
  booking, free/busy, reminders, business days and iCalendar; the timer, time entry and timesheet services;
  Measurement; Request with its record links and mail intake; `AssetServices`' issue, receive and move;
  `OrderServices.accept#ServiceItem`; `AssetBookServices`; the CalDAV services with the review Y1 fix (F4–F12, F15,
  F19, F27, F39, F43, F45);
- from Manufacturing: the minimal `ResourceUnavailability` and `record#ResourceUnavailability`, `RqtMaintenance` and
  `MntTpCorrective`, `request#ProductionMaintenance` with its AssetMaintenance and Request, the planned offline blocks
  of work centers, and the Manufacturing contexts of EquipmentDetail, FacilityDetail, RequestDetail and
  WorkItemDetail (F12–F14, F25, F26);
- from Customer Service: `WarrantyServices.link#WarrantyWork` and `update#WarrantyWork`, which already make a repair
  an AssetMaintenance with a `WepMaintenance` task, and the `WarrantyWorkFinished` rule (F12);
- from Warehouse, Products, Purchasing, Accounting and Projects: FacilityDetail and the facility scope,
  MaterialIssueReceipt and InventoryAvailability, the stock posting guard and return provenance; Product360 with its
  equipment templates; purchase requests and service acceptance; EquipmentDetail's Book, the posting operation record
  and the cost-centre dimension; RequestDetail, WorkItemDetail, OrderDetail, the timers and timesheets (F21–F26,
  F30–F32);
- from Commons and Comms: the shell, the approvals inbox over notification topics, Chatter, RecordFiles, Calendar and
  Schedules, the request intake and the mail rules (F15, F39, F40);
- from Admin and Insights: the settings index, readiness and refresh providers, the capability registry, lifecycle
  participants, recovery descriptors, import and export targets with `Shared/DataImport`, and the report catalog,
  metrics, attention providers, dataset classes and flow targets (F35–F37);
- from People, built before it (as [impl-people.md](impl-people.md) plans it, checked against the code in P0): teams,
  skills and qualifications, capacity with schedules and leave, holiday calendars, the costing rate, the equipment
  return task, Employee360, the projected calendar collections, and the first part of the shared process engine (§1).

**Inputs.**
- Designs:
  - [design-maintenance.md](design-maintenance.md)
  - [design-crosscut.md](design-crosscut.md): §1.3's automation register (Maintenance's rows), §1.4 (capability
    groups, the Maintenance rows), §1.5 (CX-ASSIST, CX-SYNC, CX-MAIL-INTAKE, CX-OPS-REPORTS, CX-DEVICE), §3.4–§3.7,
    §3.9–§3.14, §3.27, §3.32, §4.6 and §7.6
  - [design-drawers-commons.md](design-drawers-commons.md): Calendar and schedules, the approval kinds
    `ResourceBooking` and `WorkProcessApproval`, intake and the projected collections
  - [design-people.md](design-people.md): §4 (Employee360's Maintenance row, teams, lifecycle checklists), §10
    (skills and qualifications), PE-02, PE-03, PE-05, PE-14, PE-22 and PE-23
  - the built apps' designs for the contracts Maintenance joins: [design-manufacturing.md](design-manufacturing.md)
    §6 (Downtime, Equipment, D24), [design-customer-service.md](design-customer-service.md) (RepairLinks, warranty),
    [design-warehouse.md](design-warehouse.md) (MaterialIssueReceipt, equipment),
    [design-products.md](design-products.md) (Product360), [design-purchasing.md](design-purchasing.md)
    (maintenance purchases, service acceptance),
    [design-accounting.md](design-accounting.md) (AC-22, AC-24, EquipmentDetail's Book),
    [design-projects.md](design-projects.md) (RequestDetail, WorkItemDetail, time),
    [design-admin.md](design-admin.md) §11.1 and §14.2 and [design-insights.md](design-insights.md) §9 and §10
- Plans:
  - [impl-admin.md](impl-admin.md): the pattern; P2, P3, P6, P13, P15 and P16's Built notes for the registries; §7
    for what waits on Maintenance (the equipment import target, the settings row, the readiness provider, the
    TechnicianKiosk route group, the privacy provider).
  - [impl-insights.md](impl-insights.md) §7 (WorkStatus, PreventiveCompliance and cost entries and their metrics,
    Maintenance's step of the internal flow map).
  - [impl-manufacturing.md](impl-manufacturing.md) P11 and P12 (the outage fact, the maintenance request, offline
    blocks), F18, F38, F98 and §7 ("the Maintenance app adopting the AssetMaintenance records").
  - [impl-customer-service.md](impl-customer-service.md) P11, F51, F67 and F167 (the repair record) and §7 (the
    intervention report).
  - [impl-warehouse.md](impl-warehouse.md) P12 and P16, [impl-purchasing.md](impl-purchasing.md),
    [impl-accounting.md](impl-accounting.md) §7 ("Maintenance on EquipmentDetail"), [impl-projects.md](impl-projects.md)
    and [impl-drawers-commons.md](impl-drawers-commons.md) §4 (the shared rules).
  - [impl-people.md](impl-people.md) (P2, P3, P7, P9, P10, P12, P18, P30, §4 and §7: what Maintenance uses and what
    People leaves to it), [impl-sales.md](impl-sales.md) (P8, P15, §7) and [impl-marketing.md](impl-marketing.md)
    (nothing joins it to Maintenance), written beside this plan and read in its review (F54, F55).
- The suite-app design review, which explains the design's Y, Z, L and R-MNT IDs, was removed from the tree (mr-boss
  bd74564); read it with `git show bd74564^:plan/review-suite-apps.md`.
- Guides and rules: [design-doc-guide.md](design-doc-guide.md), [style-guide.md](style-guide.md) §8, mr-moqui
  `AGENTS.md`, `docs/dev/Practices-App-Dev.md`, `.agents/skills/testing/SKILL.md` and `docs/Build-Test.md` ("The two
  suites", "The regression budget", "Rendering screens in tests").
- Inventories: [ss-inventory.md](ss-inventory.md) (61 rows name a Maintenance path, F42) and
  [usl-inventory.md](usl-inventory.md).
- mr-moqui: `plans/Remaining-Work.md` (the device credential, the wasm host's login flow and tab lock).

Framework paths are under the mr-moqui checkout (`crates/`, `runtime/base-component/`), Mantle paths under
`runtime/component/mr-mantle/`, and baseline paths under `runtime/component/mr-marble/`.

Sections: [1 scope](#1-scope-and-order) · [2 rules](#2-ground-rules) · [3 phases](#3-phases) ·
[4 decisions](#4-decisions) · [5 open](#5-open-questions) · [6 findings](#6-findings) · [7 later](#7-later) ·
[8 verification](#8-verification)

---

## 1. Scope and order

- **Repositories.** Each is its own git repo:
  - `mr-moqui` (`crates/`, `runtime/base-component`): nothing is planned beyond what a phase finds missing. The one
    known gap is an audio capture input (F38), which the plan does not build. The projected collection kind of
    `get#DavCollections` is Mantle's and People's (impl-people P12).
  - `runtime/component/mr-mantle`: the maintenance work order, the process policies, checks and evidence, the
    schedules and occurrences, the booking policy and the extended unavailability, their services
    (`mantle.work.MaintenanceServices`, `ProcessServices`, `MaintenancePlanServices`, `ResourceBookingServices`,
    `MaintenanceExecutionServices`, `MaintenanceReportServices`, `MaintenanceSettingsServices`,
    `mantle.product.MaintenanceResourceServices` and `MaintenanceImportServices`), the permissions, status flows,
    lookups and topics, the managed-work refusals in the task and work-effort services, the changes to
    `EventServices` and the CalDAV services, and Accounting's maintenance expense routing (AC-24).
  - `runtime/component/mr-boss`: the Maintenance app, `ironstone.maintenance` (AccessServices, ContextServices,
    HomeServices, MaterialServices and the screens' reads), the Maintenance contexts of the shared screens, the
    registrations in Admin's and Insights' registries, Maintenance's `report/` and `skill/` files, and the owner
    contracts with Manufacturing, Warehouse, Customer Service, Purchasing, Accounting, Projects, Commons, Admin and
    People named in the phases.

  `runtime/component/mr-marble` is read only, for the baseline Asset, AssetMaintenance and Facility forms that
  ss-inventory maps (F42). mr-pass is not changed.
- **Scope.**
  - Every `parity` and `new` row of design §2 and the §13 needs they use, MT-01 to MT-12, MT-15 and MT-16, as
    changed by §6.
  - What the built apps left waiting on Maintenance, each in the phase where its records exist:
    - Admin: the capability bundles (P1), the settings row (P1), the lifecycle participant (P3, the approver roles
      in P15), the topics' registrations (with each topic), the PM generation job's registration and recovery
      descriptor (P14), the equipment import target and its mount (P18), the readiness provider
      `check#MaintenanceReadiness` (P18), the list exports as export targets (P19);
    - Insights: the WorkStatus, PreventiveCompliance and cost catalog entries with their metrics and attention
      providers, the shipped datasets and alert templates, the flow target of the internal flow map's Maintenance
      step, and Maintenance's context on EquipmentDetail (P2, P17);
    - Manufacturing: adoption of the AssetMaintenance records and requests its downtime makes, triage of
      `RqtMaintenance` requests (its F98), restoration of the outage it records, and its and Warehouse's
      availability read (P3, P4, P5);
    - Customer Service: the warranty repair as a managed work order and the intervention report (P12);
    - Purchasing: the originating work order on its RequestDetail and outside-service acceptance from CompleteWork
      (P10);
    - Accounting: maintenance expense routing, AC-24, which impl-accounting did not build (F32; P9), and
      Maintenance's context on EquipmentDetail with the Book for a finance reader (P2);
    - Projects: a repair charged to a project (P9, P11).
  - What People left to Maintenance (impl-people §7; the later plan builds a connection): the rest of MT-03 on
    People's two policy records and `ProcessServices`, which is publication, approval and effectivity, evidence,
    readings, waivers and the guards-execution flag set for procedures (P6, P7); the Maintenance row of Employee360
    and the guard and effective date of the custody change, which closes a separation's return task through
    People's rule (P2); the Teams screen with dispatch defaults, skills, capacity and the qualification check in
    assignment (P8); labor priced at the costing rate (P11); the two projected calendars (P19); and
    TechnicianKiosk (§7).
  - Shared screens: Maintenance builds no new shared screen. WorkOrderDetail and ProcedureDetail are its own (crosscut
    §3.27); it adds its context to EquipmentDetail, FacilityDetail, Product360, RequestDetail, WorkItemDetail,
    MaterialIssueReceipt, InventoryAvailability, OrderDetail, DataImport, Chatter and RecordFiles, and mounts People's
    Employee360 and Commons' resource calendar.
  - §7 holds the design's `later` rows (Calibration, CalibrationDetail, ReliabilityReport and its proxy card,
    FleetContracts, FleetLogs, TechnicianKiosk, OfflineExecution), MT-13 and MT-14, the `later` parts of MT-16, the
    §15 open items, and the links to Sales.
- **What this plan takes from People**, by the phase of impl-people that builds it (F54; P0 rechecks the code):
  - P7: `WorkEffortProcessPolicy` and `WorkEffortStepPolicy`, minimal (the using policy and a guards-execution
    flag, false for People's checklists; a step's role, due offset and required flag), and
    `mantle.work.ProcessServices.store#ProcessStep` and `instantiate#WorkProcess` over a template WorkEffort tree:
    the two-pass clone with its ID map, remapped dependencies and one `WeatBasedOn` link per node, due dates from
    offsets, assignees by role, once per key (impl-people §4). It has no approval, evidence, readings or waivers:
    P6 extends the two records and services and sets the flag for procedures. People's checklists keep their
    behavior, and its `test/work/WorkProcess` passes unchanged.
  - P7: one return task for each current AssetPartyAssignment at a separation, and the Mantle rule on the end of an
    AssetPartyAssignment that completes the return task naming it, whoever ends it; `get#AssignedEquipment`;
    People's own mount of EquipmentDetail (`People/Employees/EquipmentDetail`), which needs nothing of Maintenance;
    People's protected tasks left out of `get#TaskObjectTags`, the service P3 changes too.
  - P2: `Shared/Employee360` with its per-app context, Maintenance's row left to this plan.
  - P3: `mantle.humanres.OrganizationServices.store#Unit` and `store#Membership` for `OrgTeam` teams with dated
    `PrtMember` rows, and OrgStructure's TeamMembers (PE-03); the from-role of a membership is settled there.
  - P9: `ResourceServices.get#PartyCapacity` reading People's schedules first, and HolidayCalendars
    (`ScheduleServices.get#Holidays`, `store#Holiday`) over the `WepHoliday` events that
    `EventServices.get#NextBusinessDay` reads; approved leave in P12, shifts in P14.
  - P10: RatePurpose `RaprCost`, the one labor costing purpose (§4), and
    `mantle.humanres.RateServices.get#CostingRate`, with Accounting's LaborCostingRates form (PE-23) and
    Manufacturing's rows and lookup moved to the purpose.
  - P12: the read-only projected collection kind of `get#DavCollections` (PE-24), generic over an owner service,
    on which P19 registers two collections.
  - P18: `WorkEffortSkillStandard.minimumSkillLevel` and `mantle.humanres.DevelopmentServices.check#Qualifications`
    (PE-14).
  - Not taken: the kiosk identity (P30, which waits on Admin P18); TechnicianKiosk is later (§7).

  Where P0 finds one of these missing or under another contract, the phase that uses it takes the built contract,
  or builds the piece under the design's name and says so in §6.
- **Order** (decided Nov 11, §4). Six stages, each ending at a gate that is usable on its own. Framework and Mantle
  work goes in the phase that first needs it.

  | # | Phase | Stage |
  | --- | --- | --- |
  | 1 | P1 Foundation | 1 |
  | 2 | P2 Equipment and facilities | |
  | 3 | P3 Work orders | |
  | 4 | P4 Requests and intake | |
  | 5 | P5 Downtime and restoration | gate 1: corrective maintenance, from a report to a restored resource |
  | 6 | P6 Procedures | 2 |
  | 7 | P7 Execution checklists and evidence | |
  | 8 | P8 Dispatch: teams, skills and qualifications | gate 2: procedures executed by qualified people |
  | 9 | P9 Parts and stock | 3 |
  | 10 | P10 Purchasing and outside service | |
  | 11 | P11 Costs | |
  | 12 | P12 Customer repair | gate 3: parts, purchases, cost and repairs for customers |
  | 13 | P13 Preventive plans and due maintenance | 4 |
  | 14 | P14 Generation, occurrences and compliance | gate 4: preventive maintenance |
  | 15 | P15 Resource policy and blackouts | 5 |
  | 16 | P16 Booking requests and the resource calendar | gate 5: scheduling administration |
  | 17 | P17 Reports and Insights | 6 |
  | 18 | P18 Settings, lookups, readiness and import | |
  | 19 | P19 Assist, Comms, sync and outputs | |
  | 20 | P20 Finish | gate 6: Maintenance built |

  Each phase starts after the one above it, except these, which run side by side because neither uses the other's
  work: P4 beside P5; stage 4 (P13, P14) beside stage 3 (P9–P12), once gate 2 is reached; stage 5 (P15, P16) beside
  stages 3 and 4, once P5 is built; P18 and P19 beside P17. The dependencies that fix the rest: P3's lifecycle is what
  P4's triage, P5's outage links and every later phase write through; P6's instantiation is what P7 executes and
  P14 generates; P8 reads the steps' skills that P6 defines; P11 prices what P3 (time), P9 (parts) and P10 (outside
  service) recorded; P12 needs P9's parts and P11's cost summary for the intervention report; P14's compliance needs
  P13's due projection; P15's policy is what P16's decisions check; P17's cost and compliance entries need P11 and
  P14. A phase that appends to the same file as one beside it (BossSetupData.xml, BossUsersDemoData.xml,
  BossMaintenanceDemoData.xml, the Maintenance root, `MaintenanceServices` and `ResourceBookingServices`) rebases on
  it before merging.

  While People is built (§4, Nov 11): P8, P11, P12, P19 and P17's cost entry wait for People P9 and P18, P10, and
  P12. Every other phase is built now: stage 3 (P9, P10), stage 4 (P13, P14) and stage 5 (P15, P16) start after P7,
  since they use P3 and P6 and not P8, and P15 may start after P5, beside P7. Gate 2 is reached with P8, gate 3 with
  P11 and P12; P17 builds its other entries.

  Gate 1 is released on its own (§4): corrective work with equipment, intake and downtime replaces the baseline's
  maintenance forms for a small organization, and each later gate adds an area to the menu.

## 2. Ground rules

- **The Commons rules hold.** These are impl-drawers-commons §4:
  - failure tolerance;
  - the Mantle-free framework;
  - Mantle stands without BOSS;
  - business logic leans to Mantle;
  - the new XML element checklist of style-guide §8.1;
  - libraries through `libs/refresh.mjs`, and crates against `deny.toml`;
  - the `.qvue` gallery pattern;
  - parties by role;
  - organization filters;
  - changes by effective date and the audit log;
  - demo data;
  - builds and commits.

  The walks are on Commerce's pattern: one golden-path walk in `test/client/Maintenance/`,
  `MaintenanceWorkOrdersWalk` (P3), registered in `test/client/suite.js`; the others are acceptance tests.
- **Two layers, as design §13 places them.**
  - Mantle: the records, the lifecycle, the process engine, due and booking rules, the guards and the report
    projections, in the package of the records they change, each checking its own permission and scope and passing
    under `./moq test mr-mantle` alone.
  - BOSS `ironstone.maintenance`: AccessServices (the app's capabilities from permissions, `check#Record`),
    ContextServices (`get#SharedContext`, choices, links, `search#Records`), the screens' reads and shapes, the
    settings forms, the shell providers and the shared screens' Maintenance contexts.

  No same-named `ironstone` pass-through over a Mantle service is built; a screen calls the Mantle service after the
  app's check.
- **Permissions, not group names** (design §1.1). Mantle seeds the `MAINTENANCE_*`, `WORK_PROCESS_*`,
  `RESOURCE_BOOKING_*` and `RESOURCE_POLICY_*` permissions its services check (§4); BossSetupData grants them to the
  groups of design §1.1, and `FACILITY_EDIT` to `BOSS_MAINTENANCE_RESOURCE_ADMIN`. A service checks
  `ec.user.hasPermission` and scope, never a BOSS group, a calling screen or a supplied `appRoot`. Broad view,
  assigned-work view and own-request view are separate permissions; a write permission alone opens no list.
  `BOSS_MAINTENANCE_ADMIN`'s root authorization is no exemption from a service's check. Mantle specs grant the
  permissions to spec-local groups, never a `BOSS_*` group.
- **Work rows through services.** No entity filter covers WorkEffort, Asset or AssetMaintenance (F2), so nothing
  scopes a work order, step, template or equipment by organization. Maintenance reads and writes them only through
  services that check the service organization, the facility or asset, the assignment and the action; `entity` in a
  design form summary means that guarded path. The Maintenance groups get no artifact authorization for raw
  `update#WorkEffort`, `update#AssetMaintenance` or the `/mantle` REST work and asset paths.
- **One lifecycle** (design §3). `transition#MaintenanceWorkOrder` is the only path to a managed root's status,
  `schedule#MaintenanceWorkOrder` the only path to its assignments, and `record#ProcessStep`, `waive#ProcessStep`
  and the root's close the only paths to a step's status. The generic task and work-effort services refuse a managed
  record by a data check (§4, F8), so Commons, Projects, Today, the palette, bulk actions, imports, Admin's
  offboarding and CalDAV cannot move it. A linked AssetMaintenance follows its root and is never the authority.
- **Templates do nothing** (design §4.1). A template takes no time, stock, booking, assignment notice, PM credit or
  place in a Tasks collection or report; every list of live work leaves templates out by purpose and flag (F4).
- **Restricted values stay on the server.** Costs, supplier prices and rates are left out of an answer the caller may
  not read, including exports, prints, shell context, notifications and Assist; a requester's view of a request shows
  no cost, employee detail or other report on the asset; a busy interval the caller may not open carries no title or
  attendee.
- **Records follow the shared rules** (impl-drawers-commons §4; §4 here):
  - policies, schedule terms, booking policy, team defaults and lookups are dated rows, ended, never overwritten;
  - the audit log on the key fields the build adds: the work order's target, kind, priority, cost centre and
    project; a step policy's requirement fields; a schedule term's trigger fields; an unavailability's interval;
  - records of their own where a fact has its own identity, each named in its phase: the work order extension, a
    check and its evidence link, a waiver, a due occurrence, an unavailability, a booking decision;
  - no version or snapshot tree beside WorkEffort: an execution's own rows are the record of what was done;
  - prints and exports take an effective date and time, and an approved procedure and a closed checklist are stored
    as WorkEffortContent.
- **Revisions and operations.** Every write names the revision it read and is refused naming the current one when
  stale; create, triage, generate, issue, return, decide and restore carry an operation key, so a retry answers the
  first result and changed input under the key is refused. A batch (bulk assign, generate, bulk decide, an import)
  names each failure and goes on; one execution tree, one booking decision and one stock operation stay atomic.
- **Owner contracts.** A change built here in another app's screen or service (§1 scope) follows that app's design and
  is written into it and into its plan's log. The owner's screens and services stay the owner's; stock actions need
  Warehouse's stock permission for the facility, buying stays Purchasing's, book and posting actions Accounting's,
  coverage and consent Customer Service's, membership and qualifications People's. Each such change is limited to
  managed maintenance records or to the Maintenance mount, so the owner's behavior for its own records is as it was,
  and the owner's regression specs pass unchanged unless the phase names the change: Manufacturing's and Warehouse's
  equipment availability (P3, P5, P15), Accounting's issuance posting (P9), Purchasing's request (P10), Customer
  Service's warranty repair (P12), Admin's offboarding (P3), People's process services and custody (P2, P6).
- **Existing callers stay compatible.** Manufacturing's downtime, maintenance request and equipment availability;
  Customer Service's warranty repair (`link#WarrantyWork`, `update#WarrantyWork`, the finished notice); Commons'
  tasks, requests, booking and schedules; Projects' work items, time and timesheets; Products' equipment templates;
  Warehouse's equipment and facility screens; ordinary `clone#WorkEffort` and `clone#Project`; the CalDAV task and
  event paths for unmanaged records. Unmanaged legacy AssetMaintenance and bookings of a resource with no policy
  keep today's behavior. The regression suites of mr-mantle and of the earlier apps in mr-boss pass unchanged except
  where a phase names the change.
- **Done for a phase** means all of these:
  - impl-drawers-commons §4 "Done":
    - the regression tests for the rules the phase adds passing, Mantle's in mr-mantle and BOSS's in mr-boss, with
      cargo tests and `./moq test-framework` only for a phase that touches `crates/` or a base component;
    - `./moq test-apps`, each suite within its budget; a budget is raised by the phase's measured share, up to
      the plan's estimate for the suite, which the user approved (§4); a raise beyond the estimate needs the user's
      agreement again, and until it is given a phase that would pass the budget cuts a duplicate or moves a scenario
      to acceptance; no spec passes 15 seconds;
    - `moqui lint --screens` clean for BOSS with the Debug binary;
    - the inventories' **Implemented in** columns;
  - an access rule the phase adds checked in `MaintenanceAccess` (one holder and one non-holder on one verb, and
    another organization's record refused), not every service and mount; ProjectsAccess passing with the new
    package (F50);
  - each screen with logic of its own rendered once in qvt across the regression suite, with all of its checks on
    that render, and in a second mode only where it has its own template. A later phase that adds a tab or pane to
    a screen already rendered (WorkOrderDetail, EquipmentDetail, FacilityDetail, Home, Settings) adds its checks to
    that render in the spec that holds it, and renders nothing again; a shared screen is rendered here only for
    Maintenance's own context of it;
  - its row and **Built** note here.

  No route fixtures: a screen sweep is an acceptance test, one per app per mode. The phase's "usable when" and its §8
  scenario are acceptance tests to write (`acceptance/Maintenance/`, `acceptance/client/Maintenance/`), named in the
  phase; running them is not part of Done.

## 3. Phases

| Phase | Repos | Screens | Status |
| --- | --- | --- | --- |
| P0 Checks | all (read) | — | done Nov 11 (§6 F1–F75); items waiting on People P9/P10/P12/P18 left open |
| P1 Foundation | Mantle, BOSS | the Maintenance root and menu, Home (its frame), Settings (its frame) | built and reviewed Nov 11, merged |
| P2 Equipment and facilities | Mantle, BOSS | Equipment, EquipmentDetail, Product360, Employee360, Facilities, FacilityDetail | built and reviewed Nov 11, merged |
| P3 Work orders | Mantle, BOSS | WorkOrders, WorkOrderDetail (Overview, Time, Files, Conversation, History), Home, Settings' work policy | built and reviewed Nov 12, merged |
| P4 Requests and intake | Mantle, BOSS | Requests, RequestDetail, Report a problem | built and reviewed Nov 12, merged |
| P5 Downtime and restoration | Mantle, BOSS | Downtime, WorkOrderDetail's Downtime | built and reviewed Nov 12, merged |
| P6 Procedures | Mantle, BOSS | Procedures, ProcedureDetail | built and reviewed Nov 12, merged |
| P7 Execution checklists and evidence | Mantle, BOSS | WorkOrderDetail's Procedure, WorkItemDetail | — |
| P8 Dispatch: teams, skills and qualifications | Mantle, BOSS | WorkOrders' AssignSchedule and BulkWork, Teams | — |
| P9 Parts and stock | Mantle, BOSS | WorkOrderDetail's Parts, MaterialIssueReceipt, InventoryAvailability; Accounting's PostingMappings row | built and reviewed Nov 12, merged |
| P10 Purchasing and outside service | Mantle, BOSS | WorkOrderDetail's Purchasing, OrderDetail; Purchasing's RequestDetail line | — |
| P11 Costs | Mantle, BOSS | WorkOrderDetail's Costs, MaintenanceCostReport | — |
| P12 Customer repair | Mantle, BOSS | WorkOrderDetail's repair context; Customer Service's RepairLinks | — |
| P13 Preventive plans and due maintenance | Mantle, BOSS | Plans, PlanDetail | built and reviewed Nov 12, merged |
| P14 Generation, occurrences and compliance | Mantle, BOSS | DueMaintenance, PreventiveComplianceReport | — |
| P15 Resource policy and blackouts | Mantle, BOSS | Resources, ResourcePolicyDetail, Blackouts | built and reviewed Nov 12, merged |
| P16 Booking requests and the resource calendar | Mantle, BOSS | BookingRequests, ResourceCalendar; Commons' approvals | — |
| P17 Reports and Insights | Mantle, BOSS | Reports, WorkStatusReport | — |
| P18 Settings, lookups, readiness and import | Mantle, BOSS | Settings, Lookups, EquipmentImport | — |
| P19 Assist, Comms, sync and outputs | Mantle, BOSS | the prints and exports; no new screen | — |
| P20 Finish | all | the sweeps and the review walk (acceptance) | — |

### P0 — Checks

Verify the design's riskiest assumptions against the code before building. Each result is a row in §6 and, where it
changes the design, an edit there. F1–F48 were found on Nov 11 while writing this plan and F49–F57 in its review;
F12, F16, F17, F31 and F36 changed design-maintenance the same day.

**Done Nov 11 (§6 F58–F75); items waiting on People P9/P10/P12/P18 left open.** Read in the code with People P1–P7 and
Admin P17–P18 built: the process records, services and clone as People built them (F58) and its managed-work refusal,
already in the generic services (F59); the team membership's from-role (F60); the return task's rule and a dated end
(F61); Employee360's context (F62); what People left out of the Tasks collection (F63); capacity and holidays as they
are (F64); the status check by flow (F65); time on work (F66); the catalog context (F67); the instruction rule (F68);
files and conversation (F69); meters (F70); stock (F71); exports (F72); Admin P17's audit registry (F73) and P18's
route groups (F74). Left open, with the phases the user deferred (§4): `minimumSkillLevel` and `check#Qualifications`
(People P18), capacity's schedule read and HolidayCalendars (People P9), `get#CostingRate` (People P10) and the
projected collection kind (People P12) (F64, F75). The phases changed say so (P1, P2, P3, P6, P7, P9, P13, P17, P19,
§7); design-maintenance §1.3 and §13.2 changed (F66). Phone width is P20's walk, not a check. The list as it was:

- **After People is built** (it is not at the commits above): what People built of each item §1 takes, read from
  the code. For each, the phase that uses it takes the built name and contract, or builds the piece under the
  design's name when People left it out:
  - the two policy records with their guards-execution flag, the process services and the clone, as built (P6);
  - `minimumSkillLevel` and what `check#Qualifications` answers for a party, a qualification type and a date (P8);
  - the from-role `store#Membership` writes on a `PrtMember` row, which `find#MaintenanceTeams` reads (impl-people
    F13; P8);
  - capacity and the holiday events (P8, P13);
  - `get#CostingRate`'s parameters and its unpriced answer (P11);
  - the rule on the end of an AssetPartyAssignment that completes its return task, so a dated end keeps it (P2);
  - Employee360's context branch and what a mounting app supplies (P2);
  - the projected collection kind and what an owner service answers for it (P19);
  - what People left out of `get#TaskObjectTags`, so P3's filter is added to it and replaces nothing.
- **When Admin P17 lands** (audit, not built): which registered safe projections and audit sources
  `AuditServices.find#Changes` wants from an owner, for the work order, check, waiver, schedule term and booking
  decision changes this build audit-logs; planned from design-admin §12 until then.
- **When Admin P18 lands** (shared devices, not built): the route-group registration record and what a kiosk route
  group must provide. TechnicianKiosk stays later (§7); the check is only that nothing built here blocks it.
- **Status checks by flow:** whether the framework's status check still matches a transition by its from and to
  alone, ignoring `statusFlowId` (impl-manufacturing F9), so that a maintenance flow cannot by itself stop a
  transition another flow allows (P3 relies on the service, not the flow).
- **Time on work:** what `TimeServices.store#TimeEntry`, `TimesheetServices.start#Timer` and the timesheet access
  check for the work effort (design §13.2: "extend their work-access check for maintenance"), and where a template
  is refused today (seen only in the time import).
- **Catalog context for a new app root:** what `ironstone.products.CatalogServices.get#SharedContext` asks of an
  app root before Product360 and InventoryAvailability open under Maintenance (F23, F24).
- **Instruction content:** what `OperationTemplates.js` `guardInstruction` enforces for `WectInstruction` content
  (F28), and whether an approved procedure's instructions can use the same content type and rule.
- **Files and conversation:** how RecordFiles deletes and replaces a file of a WorkEffort host, for the protection
  of accepted evidence (P7); which Mantle content services Maintenance's hosts use (the AssetMaintenance host is
  registered, service/ironstone/shared/RecordFilesServices.xml:47); and how Chatter and RecordFiles check a host
  under an app root, so a work order, step, template, asset or facility host is admitted by Maintenance's
  `check#Record` and by nothing wider (P3).
- **Meters:** the values of AssetMeter's `readingReasonEnumId`, and that no field says a ProductMeter is cumulative
  (P2 adds what `record#MaintenanceMeter` needs).
- **Stock:** what Warehouse's posting guard and `issue#AssetToWorkEffort` ask of a new caller, and that
  `AssetReceipt.sourceAssetIssuanceId` (Warehouse P6) carries the original cost on a return (P9).
- **Exports:** whether a report's CSV needs its own export target or the app's one row covers its lists and
  reports (Admin P16's Built and Review notes; F53), for design §12 (P17, P19).
- **Phone width:** WorkOrderDetail, Report a problem, meters and booking decisions at 390 px, a walk to write in
  P20, not a regression test.

### P1 — Foundation

Design §1.1, §1.2 (the menu), §1.3; MT-01 (groups, permissions and the access guard).

- **Mantle.**
  - The permissions of design §1.1 as UserPermission seed rows in a new `data/MaintenanceSetupData.xml`:
    `MAINTENANCE_VIEW`, `_ASSIGNED_VIEW`, `_REQUEST`, `_REQUEST_VIEW_OWN`, `_PLAN`, `_EXECUTE`, `_SUPERVISE`,
    `_COST_VIEW`, `_RESOURCE_VIEW`, `_RESOURCE_EDIT`, `_SETTINGS_EDIT`, `_IMPORT` (the app's own import
    permission, which the equipment import target names, P18; §4); `WORK_PROCESS_VIEW`, `_EDIT`, `_APPROVE`;
    `RESOURCE_BOOKING_VIEW_ASSIGNED`, `_APPROVE`; `RESOURCE_POLICY_VIEW`, `_EDIT`. Each is granted to `ADMIN`
    there, as `FACILITY_EDIT` is (data/MantleSetupData.xml:115-116); `FACILITY_EDIT` exists.
  - `mantle/work/MaintenanceAccess.js`, the one scope module the later services call: the user's organizations
    (`FacilityScope.js`'s and `get#PartyInternalOrgIds`'), a facility's and an asset's organization, a root's service
    organization, assignment to a root or step, and reason codes (`denied(reason, message)` as
    `mantle/ledger/EntityLib.js` has them).
- **BOSS access** (design §1.1).
  - The groups on Manufacturing's pattern (BossSetupData.xml:204-219): `BOSS_MAINTENANCE` as the root user group
    beside the artifact group of that name, and `_READ`, `_REQUEST`, `_PLAN`, `_EXECUTE`, `_SUPERVISE`,
    `_PROCEDURE`, `_PROCEDURE_APPROVE`, `_BOOKING_APPROVE`, `_RESOURCE_ADMIN` and `_COST`; `BOSS_MAINTENANCE_ADMIN`
    keeps its rows. `BOSS_MAINTENANCE_REQUEST` does not hold the root group: a requester reports from Commons (P4).
  - The ordinary groups' authz on the root with `MANTLE_USER_ORG` and `MANTLE_PRIVATE_CONTACT`, and the
    `ironstone\.maintenance\..*` service pattern on the artifact group.
  - `PEOPLE_DIRECTORY_VIEW` for `_PLAN`, `_SUPERVISE` and `_RESOURCE_ADMIN`, so Employee360's public work card opens
    for them under Maintenance (P0, F62).
  - `maintenance` added to the client deny pattern of `BOSS_PROJECTS_INTERNAL`, after People's `people` (F50). An
    `artifactName` holds 255 characters: the first row (the verbs `add` to `clockOut`) reaches 256 with the two
    names and is split in two; the row of `record` to `reply` reaches 252 and is split now too, so that Sales and
    Marketing add their names to rows that hold them. ProjectsAccess must pass with the new package: a write verb of
    an `ironstone.maintenance` service that the rows lack is added to them.
  - The UserGroupPermission rows of design §1.1's table, with `MAINTENANCE_IMPORT` to
    `BOSS_MAINTENANCE_RESOURCE_ADMIN`, who run the import, and in that group's bundle (§4).
  - The capability registry rows crosscut §1.4 names for Maintenance, which Admin P3 left out as unbuilt
    (impl-admin.md:932): a `CapabilityBundle` for each group with
    its `CapabilityBundlePermission` rows by kind and the launcher's `CapabilityBundleArtifact`, as Manufacturing's
    are (BossSetupData.xml:2916-2938).
  - `ironstone.maintenance.AccessServices` (`get#Capabilities`, `check#Record` by record type and capability) and
    `ContextServices` (`get#SharedContext` with capabilities, organizations, `appRoot` and `sharedLinks`;
    `get#Choices` as a table of named sources; `search#Records`), over one module `Maintenance.js` whose tables the
    later phases extend.
- **The Maintenance root** (design §1.2): Home and Settings now; the other areas are added by the phases that build
  them, and `later` entries stay absent. The six placeholders are removed, and the root's stale grant comment fixed
  (F1). `<shell-providers>` with the `maintenance` keymap and the palette source, on Manufacturing's pattern
  (Manufacturing.xml:46-82); quick create, Today and the notification topics arrive with their records. (P0, F74:
  as Insights' root does, no context service and no Chatter or RecordFiles mount for a device's request, so a later
  TechnicianKiosk is not blocked.)
- **Admin's settings index** (owner contract; impl-admin §7): a `SettingsEntry` `maintenance.settings` to
  `Maintenance/Settings`, group Applications, scope organization, as Manufacturing's row is
  (BossSetupData.xml:2592-2595); its readiness provider key is set in P18. Since Nov 11, 2026 the row is the
  framework's `moqui.server.SettingsEntry`, its place a `destinationRoute` key (`settingsRoutes` in `Admin.js`)
  with its `screenLocation` (impl-admin §9).
- **Screens:** Home's frame (HomeFilters, the counters as "Not configured" until P3, the shortcuts for the areas
  built); Settings' frame, a landing whose forms the phases add.
- **Demo data.** BossUsersDemoData gains a user per group (`maint.reader`, `.requester`, `.planner`, `.tech`,
  `.tech2`, `.supervisor`, `.author`, `.approver`, `.booking`, `.resources`, `.cost`, `.admin`, none in `ADMIN`), the
  planner, technicians and supervisor in ORG_ZIZI_SERVICES, and one planner of ORG_ZIZI_RETAIL only, for the
  isolation checks. `data/BossMaintenanceDemoData.xml` starts empty of records; each phase adds its own.
- **Specs.**
  - `test/Maintenance/MaintenanceSpecLib.js` (ids, users, `shell`, `page`).
  - `MaintenanceAccess`: the app's one access spec, about seven features with authorization on: each group's
    permissions and capabilities, the menu and providers per group, the root refused to a requester and to a
    Projects client, `ironstone.maintenance` services refused without the root grant, Home's one qvt render. A later
    phase adds a case only for an access rule it adds.
- **Usable when** (an acceptance test to write, `acceptance/Maintenance/MaintenanceFoundationWalk`): the menu
  renders for each group with only its areas; `maint.requester` has no Maintenance launcher; Admin's Capabilities
  shows the Maintenance bundles and an access administrator grants the planner bundle to a custom group; SettingsHome
  lists Maintenance settings for `maint.admin` and not for `maint.reader`.

**Built Nov 11 (P1).** mr-mantle f4266912, mr-boss f03ebeb3 (branch `mnt/p1`); mr-moqui unchanged, no Rust built.
- Checked first (the code over the plan): F1 (the root grant live for `ADMIN` and `BOSS_MAINTENANCE_ADMIN`, ALWAYS; the root's
  comment said otherwise), F35 (SettingsEntry and CapabilityBundle as built; Admin's registry comment listed Maintenance as left
  out), F50 (the deny rows: thirteen with Admin P6's transfer row; with `maintenance` the add row reached 256 and the record row
  252), FacilityScope.js and `get#PartyInternalOrgIds` (organizations), EntityLib.js `denied`, People P1's root, People.js,
  PeopleSpecLib and PeopleAccess (the model), and the lead's two P0 notes: F62 (`PEOPLE_DIRECTORY_VIEW` for the planner,
  supervisor and resource administrator) and F74 (the root as Insights' for a shared device).
- Mantle:
  - `data/MaintenanceSetupData.xml`: the eighteen permissions of design §1.1 (`MAINTENANCE_VIEW`, `_ASSIGNED_VIEW`, `_REQUEST`,
    `_REQUEST_VIEW_OWN`, `_PLAN`, `_EXECUTE`, `_SUPERVISE`, `_COST_VIEW`, `_RESOURCE_VIEW`, `_RESOURCE_EDIT`, `_SETTINGS_EDIT`,
    `_IMPORT`; `WORK_PROCESS_VIEW`, `_EDIT`, `_APPROVE`; `RESOURCE_BOOKING_VIEW_ASSIGNED`, `_APPROVE`; `RESOURCE_POLICY_VIEW`,
    `_EDIT`), each granted to `ADMIN`; `FACILITY_EDIT` is MantleSetupData's.
  - `mantle/work/MaintenanceAccess.js` (no service yet; tables `permissions` and `reads` for later phases): `capabilities()`
    (each permission and `FACILITY_EDIT`; the reads `workRead` = view or assigned view, `resourceRead` = those or resource view,
    `anyRead` = any view permission; an edit permission alone reads nothing), `scope()` (capabilities, the caller's party, the
    organizations of FacilityScope.js, null for every organization (ADMIN, `FACILITY_ALL_ORGANIZATIONS`), none without a read),
    `covers`, `requireCapability`, `requireOrganization` (`ORGANIZATION_DENIED`), `facilityOrganization` (the nearest owning
    ancestor, twelve levels), `assetOrganization` (an internal owner, else the holding facility's: a customer's asset in
    custody), `rootOf`, `rootOrganization` (the root's owner, else its facility's; P3 may read its MaintenanceWorkOrder instead),
    `assignment` (a current WorkEffortParty of the caller's party on the root, or on the step or its root), `requireFacility`,
    `requireAsset` and `requireWork` (missing and outside alike `RECORD_UNAVAILABLE`; `PERMISSION_DENIED` without the read; an
    assigned-view caller `NOT_ASSIGNED` on work in scope that is not theirs).
- BOSS:
  - `data/BossSetupData.xml` (appended but for the deny rows and the registry comment): the groups `BOSS_MAINTENANCE` (root
    user group) and `_READ`, `_REQUEST`, `_PLAN`, `_EXECUTE`, `_SUPERVISE`, `_PROCEDURE`, `_PROCEDURE_APPROVE`,
    `_BOOKING_APPROVE`, `_RESOURCE_ADMIN`, `_COST`; on the `BOSS_MAINTENANCE` artifact group (a second element) the
    `ironstone\.maintenance\..*` pattern and `BOSS_MAINTENANCE_ROOT` (ALLOW, `MANTLE_USER_ORG`, `MANTLE_PRIVATE_CONTACT`);
    `BOSS_MAINTENANCE_ADMIN` keeps its ALWAYS; `_REQUEST` has no root grant; `BOSS_MNT_SETTINGS` denies Settings to the root
    user group; design §1.1's grants, `MAINTENANCE_IMPORT` to the resource administrator, `PEOPLE_DIRECTORY_VIEW` to the
    planner, supervisor and resource administrator (F62), and to the administrator `MAINTENANCE_SETTINGS_EDIT` with the views
    `MAINTENANCE_VIEW`, `WORK_PROCESS_VIEW`, `MAINTENANCE_RESOURCE_VIEW`, `RESOURCE_POLICY_VIEW`; `maintenance` in all thirteen
    deny rows, the add row split at `book`/`bulk` and the record row at `release`/`remove` (fifteen rows; the longest 238, so
    `sales` and `marketing` fit every row); twelve capability bundles (1300-1410; the launcher's artifact with the root's
    filter sets; cost sensitive) and the settings entry `maintenance.settings` (Maintenance/Settings, view
    `MAINTENANCE_SETTINGS_EDIT`, sequence 75; its provider key is P18's).
  - `ironstone.maintenance.AccessServices` (`get#Capabilities`, `check#Record`) and `ContextServices` (`get#SharedContext`,
    `get#Choices`, `search#Records`) over `service/ironstone/maintenance/Maintenance.js` (tables `areas`, `recordKinds`,
    `choiceSources`, `searchFinds`, `linkPaths`): the root grant read from the user's own groups (as People.js); record kinds
    organization, facility and asset (through MaintenanceAccess; their screens are P2's), choices organizations and facilities
    (one organization's with `organizationPartyId`), no palette source yet. `template/MaintenanceParts.xml` holds `choices`.
  - Screens: the root (`get#SharedContext` in always-actions, and for a shared device's request no context service and a
    refusal of Chatter and RecordFiles, F74; `<shell-providers>` with the palette source and the `maintenance` keymap, `g m`;
    the stale comment replaced, F1); Home (HomeFilters: organization, facility and as-of, each checked by `check#Record`;
    Counters, the six of design §3 as Not configured; the administrator's Settings shortcut; a user who reads nothing told so);
    Settings with SettingsHome (an organization find and the settings to come, Not yet available). WorkOrders, Equipment,
    Facilities and Scheduling placeholders removed. Menus: Home for every group, Home and Settings for the administrator and
    `ADMIN`.
  - Demo: `data/BossMaintenanceDemoData.xml` (empty); BossUsersDemoData's `maint.reader`, `.requester`, `.planner`, `.tech`,
    `.tech2`, `.supervisor`, `.author`, `.approver`, `.booking`, `.resources`, `.cost` (agents of Services), `maint.retail` (a
    planner of Retail only) and `maint.admin` (Services and Retail, `BOSS_MAINTENANCE_ADMIN` alone), each in `BOSS_USERS`, none
    in `ADMIN`; the requester in `BOSS_MAINTENANCE_REQUEST` alone.
- Specs:
  - Mantle `test/work/MaintenanceScope` (3 features, 1.2 s feature time, not in the plan's list: the module has no service to
    test it through and Mantle's rules are tested in Mantle): capabilities and organizations (a plan permission alone reads
    nothing, `FACILITY_ALL_ORGANIZATIONS` every organization); a facility's, an owner-less room's, an asset's and a customer
    asset's organization, another organization's and a missing record refused alike; work read broadly by its root's
    organization and by a technician only where assigned (step or root; an ended assignment not counted).
  - `test/Maintenance/MaintenanceSpecLib.js` (ids, users, `asUser`, `system`, `refusal`, `invoke`, `page`, `screenRefusal`,
    `hit`, `shell`); `MaintenanceAccess` (7 features, 2.4 s feature time, the slowest 0.7 s): the context and its refusals
    (another root, the requester, another app's user, a client, a PASS account); the menu, key, palette and launcher per group;
    each group's capabilities exactly (context and `get#Capabilities` alike; a spec-local user holding `MAINTENANCE_PLAN` alone
    reading no organization, facility or choice; the requester refused); Retail's planner refused Services' organization and
    plant and Services' planner Retail's organization, warehouse and forklift with the same parameters, a capability named
    refused; the services refused without the root grant; Home's one qvt render as the planner and Settings' one html render as
    the administrator (the reader's a refusal); every Maintenance bundle carrying exactly its group's grants, the import
    permission the resource administrator's bundle alone, `maintenance.settings` the administrator's and not the reader's.
  - Acceptance, written and not run: `acceptance/Maintenance/MaintenanceFoundationWalk` (4 features: each group's menu with each
    entry opened or refused; the requester, a client and a PASS account refused the root and every `ironstone.maintenance`
    service, no launcher for the requester; Capabilities showing the bundles and `admin.access` granting the planner bundle to a
    custom team whose member opens Maintenance as a planner; the settings index for `maint.admin` and not `maint.reader`).
- Tests run (release binary, `--nobuild`, this worktree): MaintenanceScope 3 of 3 (1.2 s); in mr-boss MaintenanceAccess,
  ProjectsAccess (the deny rows), AdminAccess, AdminRegistries, AdminCapabilities, AdminGroups, AdminOrganizations, AdminUsers,
  AdminLifecycle, AppOrganizationFilters, InsightsAccess, PeopleAccess, CommerceAccess, ManufacturingAccess, Contacts, Resources,
  Schedules (Commons' "Open in Maintenance") and QuickCreate: 170 of 170 features, 34.5 s feature time. `moqui lint --screens`
  (release binary): 136 flagged sites against 135 in the main checkout; the one new is the root's
  `UserSecurityChecks.currentDevice()` (static-class), the same call Insights' root has flagged, which F74 asks for; none else
  in the Maintenance screens. Prettier clean on the new JavaScript. Not run: ./moq test-apps, the acceptance suite.
- Inventories: no ss-inventory or usl-inventory row is implemented by P1.
- Design edits: design-maintenance §1.1 (as built: the permissions, the scope module, the root user group, the Settings area,
  the administrator's views, `PEOPLE_DIRECTORY_VIEW`, the device's request), §1.2 (the menu, keymap and palette source), §3
  Home (the filters and counters as built).
- Findings, numbered by the lead F76 to F80 in order:
  - the administrator's grants are not in design §1.1 ("operational permissions granted explicitly in data"); P1 gives
    `MAINTENANCE_SETTINGS_EDIT` and the four views and no plan, supervise or edit permission. Maintenance has no
    all-organizations permission of its own: `FACILITY_ALL_ORGANIZATIONS` (FacilityScope.js) widens it, as it does facility and
    stock work, and the demo administrator is an agent of Services and Retail (People got `PEOPLE_ALL_ORGANIZATIONS` by the
    user's call);
  - Commons' Schedules ResourceDetail links "Open in Maintenance" to `//Maintenance/Facilities` and `//Maintenance/Equipment`
    (screen/Commons/Calendar/Schedules/ResourceDetail.xml:60); with the placeholders removed the link is hidden (its
    `buildUrl` is in a try) until P2 builds those areas, which should keep the paths or change the link;
  - a requester's `get#Capabilities` is refused by the service grant (the pattern is on the root's artifact group), so Commons'
    intake (P4) cannot ask Maintenance's capabilities of a requester; P4 reads Mantle's MaintenanceAccess or adds its own grant;
  - the technicians are agents, not People employees: P8's skills, capacity and qualifications need them employed (or other
    demo technicians), and People's Services employees (Kenji's technician seat) are candidates;
  - Maintenance's Chatter and RecordFiles under the root open no Maintenance host yet; the hosts and a panel restriction like
    People's are P3's.
- For the lead:
  - budget share: mr-mantle MaintenanceScope 1.2 s; mr-boss MaintenanceAccess about 2.4 s server; no client spec;
  - merge hot spots: mr-boss `data/BossSetupData.xml` (all fifteen deny rows, the registry comment near Admin P3's bundles,
    the Maintenance block appended at the end), `data/BossUsersDemoData.xml` (appended), `screen/Maintenance.xml`,
    `plan/design-maintenance.md` §1.1, §1.2, §3 Home; mr-mantle only new files;
  - the user's calls: the administrator's grants and whether Maintenance gets its own all-organizations permission (the
    first finding); built meanwhile: the settings permission and views, `FACILITY_ALL_ORGANIZATIONS` as the widening.

**Review Nov 11 (P1).** mr-mantle aacf3103, mr-boss 82690cf9 (branch `mnt/p1`), over the worker's f4266912, f03ebeb3 and
45b45561. Reviewed `git diff master...mnt/p1` in both repos against P1's text, §2, master's P0 notes F62 and F74, design §1.1,
§1.2 and §3 Home, and AGENTS.md; lint re-run with the Debug binary; the device branch and the deny rows checked by measure.
- Checked and found sound:
  - the eighteen permissions seeded in Mantle, each granted to `ADMIN`; MaintenanceAccess.js checks permissions only, never a
    group, a screen or `appRoot`; a write permission alone reads nothing and has no organization (the plan-only user, Mantle
    and BOSS alike); a missing record and one outside the scope are refused alike; an ended assignment is not counted;
  - Maintenance.js reads the root grant from the user's own groups (ALWAYS over DENY over ALLOW, as People.js), refuses a
    Projects client and another root, and its choices and `check#Record` admit only the scope's organizations and facilities;
  - the client deny rows: fifteen (fourteen with the add and record rows split, and Admin P6's transfer row), the longest 238
    characters (every row at or under 255, and 254 with `sales|marketing|` added), the 107 verbs of master's thirteen rows all
    kept and none added; `ironstone.maintenance`'s five services are reads; ProjectsAccess passes (9 of 9);
  - F62: `PEOPLE_DIRECTORY_VIEW` granted to the planner, supervisor and resource administrator and in their bundles (kept, the
    user's call (c)); F74: the root calls no context service for a device's request;
  - the twelve bundles carry exactly their groups' grants; the settings entry is the administrator's; Settings is denied to the
    root user group and opened by the administrator's and `ADMIN`'s ALWAYS; Home renders once in qvt, Settings once in html.
- Fixes:
  - R1 (access, missing test; F74). A device's request was never exercised: no Maintenance route group exists, so it is refused
    before the root today. MaintenanceAccess now registers a spec-local route group inheriting the whole root and a display
    account holding the root grant: Home opens with no capability, and Chatter's and RecordFiles' data are refused
    (`RECORD_PANEL_UNAVAILABLE`), with a record and without; the case fails with the root's refusal removed (checked).
  - R2 (access, medium). Under the root's inheritable grant the Chatter and RecordFiles mounts served the notes and files of any
    record `get#RecordLinkInfo` admits to a user given Maintenance without Commons (People P2's and Insights P12's lesson). The
    root now serves only Maintenance's own record hosts' panels, as People's root does, and a request naming no record; the
    host list is empty in P1. MaintenanceAccess checks a facility's panel refused to the planner and a record-less one served.
  - R3 (the user's call (a), Nov 11). `MAINTENANCE_ALL_ORGANIZATIONS`, seeded in MaintenanceSetupData and granted to `ADMIN`:
    MaintenanceAccess.scope() now reads the caller's own organizations (get#PartyOrganizationInfo, as FacilityScope.js) and
    makes them every organization only for a system administrator or a holder of it, which reads nothing by itself (capability
    `allOrganizations`). Went the recommended way: `FACILITY_ALL_ORGANIZATIONS` no longer widens Maintenance, as People reads
    only its own, so the Warehouse and Manufacturing administrators' grant does not reach maintenance work. Granted only to
    `BOSS_MAINTENANCE_ADMIN` and in that bundle alone. MaintenanceScope: a holder reads another organization's site, a holder of
    `FACILITY_ALL_ORGANIZATIONS` its own organizations only, the permission alone nothing.
  - R4 (the user's call (b), Nov 11). `BOSS_MAINTENANCE_ADMIN` holds every `MAINTENANCE_*`, `WORK_PROCESS_*` and `RESOURCE_*`
    permission (twenty, `MAINTENANCE_ALL_ORGANIZATIONS` among them; not `FACILITY_EDIT`), and its bundle follows (cost view
    sensitive, the views view, the rest edit). MaintenanceAccess: the administrator's capabilities exactly, its context every
    organization, `MAINTENANCE_IMPORT` in the resource administrator's and the administrator's bundles.
  - Design §1.1 (the administrator's row and the as-built text: the scope, the grants, the panels) and the setup comments.
- Findings, numbered by the lead F81 to F84 in order:
  - the Built note's lint was run with the release binary; the Debug binary gives the same 136 sites (the one new is the root's
    `UserSecurityChecks.currentDevice()`, static-class, as Insights' root), before and after R2;
  - P2 mounts the shared EquipmentDetail and FacilityDetail, whose `record-files` and `chatter` name `mantle.product.asset.Asset`
    and `mantle.facility.Facility`: P2 adds them to the root's `panelHosts` with their checks, or those panels are refused
    under Maintenance (R2); P3 adds the work order and step;
  - with MAINTENANCE_ALL_ORGANIZATIONS the administrator's scope is every organization even with an active one chosen
    (FacilityScope's rule), where People narrows its holder to the active organization; P3's lists may want People's rule;
  - the root's ALWAYS gives the administrator and `ADMIN` every area; with R4 the administrator holds what each area reads.
- Tests (release binary, `--nobuild`, this worktree): mr-mantle MaintenanceScope 3 of 3 (1.4 s feature time); mr-boss
  MaintenanceAccess 8 of 8 (2.5 s, the new device and panel feature 0.19 s), with ProjectsAccess, AdminAccess,
  AdminCapabilities, AdminRegistries, AdminGroups, AdminUsers, AdminDevices, PeopleAccess, InsightsAccess, InsightsWallDisplay,
  ManufacturingAccess and AppOrganizationFilters: 80 of 80 features, 25.1 s feature time. `moqui lint --screens` with
  `target/debug/moqui`: 136 sites, none new beyond the one above. Prettier clean on the changed JavaScript. Not run:
  ./moq test-apps, the acceptance suite (MaintenanceFoundationWalk unchanged by the fixes: the administrator's menu is the same).
- For the lead: budget share mr-mantle +0.2 s (MaintenanceScope 1.4 s), mr-boss +0.2 s (MaintenanceAccess 2.5 s); merge hot
  spots as the Built note's, plus mr-mantle `data/MaintenanceSetupData.xml` and `MaintenanceAccess.js`, mr-boss
  `screen/Maintenance.xml` (the panel hosts); the user's calls (a), (b) and (c) built as R3, R4 and kept, their §4 rows yours;
  no call left open.

### P2 — Equipment and facilities

Design §6 Equipment, Facilities and the shared master records' context table (EquipmentDetail, FacilityDetail,
Product360, Employee360), crosscut §3.10's Maintenance forms, design §12 asset tag labels; MT-06, MT-01. The maps
dialog of crosscut §3.32 is not built by the framework and is left out (§7).

- **Mantle records.** `Asset.warrantyThruDate` and `warrantyPartyId` (F20); ProductAssocType `PatSparePart` (F20);
  `Facility.timeZone`, inherited from the nearest ancestor that has one (F16, §5 Q9); a dated room feature record
  `mantle.facility.FacilityFeature` (facility, feature enumeration, from and thru) with a seeded `RoomFeature`
  type; `ProductMeter.isCumulative` and an `AssetMeterReadingReason` enumeration type with AssetMeter's relationship
  (P0, F70: neither exists).
- **Mantle `mantle.product.MaintenanceResourceServices`** (design §13.2):
  - `find#MaintenanceEquipment` and `find#MaintenanceFacilities`, scoped in the query before paging, the facility
    tree with hidden ancestors as unnamed nodes;
  - `store#MaintenanceEquipment`, the equipment writer under `MAINTENANCE_RESOURCE_EDIT` and the asset's
    organization: registration through `EquipmentServices.create#Equipment`, which checks nothing itself (F11);
    identity, name, comments, parent (cycles refused), class and the supplier warranty through
    `AssetServices.update#Asset`. It does not call `update#AssetMetadata`, which is Warehouse's and needs
    `STOCK_ADJUST` (F17); it never writes quantity, owner, cost or book fields;
  - `record#MaintenanceMeter`, the one meter writer: an increasing cumulative reading, the unit, a distinct
    observation time (AssetMeter's key is the asset and the time, F19), an audited reset or correction with its
    reason, the step in `workEffortId` when taken in work;
  - `store#MaintenanceRegistration` over AssetRegistration;
  - a guarded custody change: scope and permission checked, then `AssetServices.replace#AssetPartyAssignment`,
    which itself checks nothing (F18) and gains an optional effective date. This phase adds only that guard and
    date: People's Mantle rule on the end of an AssetPartyAssignment completes the return task that names it
    (impl-people P7, review Y6), so a change from Maintenance's EquipmentDetail closes the task as one from
    People's or Warehouse's does, and a dated end keeps that (P0, F61: the effective date is now or earlier, never
    later, since the rule completes the task when the end is written);
  - a move of equipment through `AssetServices.move#Asset` under Warehouse's stock movement guard and stock
    permission for both facilities, with the effect on the old and new facility shown first.
- **`FacilityServices.store#Facility`** gains `bookable`, `capacity`, `capacityUomId` and `timeZone` (F16); its
  checks are unchanged, and Maintenance adds only the preview of what a move or a close changes (the bookings of
  the facility and its rooms now, its open work from P3); a close keeps history. Room features through a small
  `store#FacilityFeature` under `FACILITY_EDIT`.
- **Shared screens' Maintenance context.**
  - EquipmentDetail: a `Maintenance` branch beside the Accounting, Warehouse and Manufacturing ones
    (EquipmentDetail.xml:77-92), read by `ironstone.maintenance.EquipmentServices.get#Equipment`, with its panes
    as tab files in a new `Shared/EquipmentDetail/` on FacilityDetail's pattern (F21, §4): Identity (with supplier
    warranty), Hierarchy, Assignments, Meters, Registrations, Files, Conversation now; Maintenance history and
    plans in P3 and P13, Schedule in P15; the Book pane only for a caller Accounting's `get#AssetBook` admits, its
    dialogs Accounting's. Old AssetMaintenance files stay on their host and are listed, not copied.
  - FacilityDetail: Maintenance's tab set (Overview, Children, Rooms and features, Equipment, Certifications, Files,
    Conversation now; Work orders in P3, Schedules in P15) read by `ironstone.maintenance.FacilityServices`, with the
    update transition checking the mounting app's own record check instead of Warehouse's for every app (F22);
    Locations and stock tabs only with Warehouse's permissions.
  - Product360 at `Maintenance/Equipment/Product360`: the built Equipment tab (meters and maintenance defaults,
    F23) with catalog authority unchanged, and a spare-parts pane of `PatSparePart` associations. Products'
    SharedContext.js gains a `maintenanceContext()` branch, as an owner contract (P0, F67).
  - Employee360 at `Maintenance/Equipment/Employee360`: People's screen (impl-people P2) with Maintenance's row of
    its context table (public work identity, AssignedEquipment, qualification validity; no HR action), which this
    phase adds to People's screen and design as an owner contract (P0, F62: a row of People.js `employee360Apps` with
    the Overview read only; AssignedEquipment read by Maintenance's own service, since People's answers only the
    person and HR; qualification validity waits for People P18).
- **Screens:** Equipment (EquipmentFind with the tag `scan-input` and the supplier warranty filter, EquipmentRows,
  CreateEquipment, AssetTags with the html-print label of `ec.resource.barcodeSvg`); Facilities (FacilityFind,
  FacilityTree with its list twin, NewFacility). The palette's equipment and facility sources.
- **Insights** (owner contract, impl-insights §7): Maintenance's context on the Insights record mount of
  EquipmentDetail is the owner link to `Maintenance/Equipment/EquipmentDetail`.
- **Demo data:** a site, building, two floors and four rooms of ORG_ZIZI_SERVICES, two with capacity and features;
  an equipment model with an hour meter, a maintenance default and two spare parts; six pieces of equipment
  (a compressor with a child motor, a forklift already in Manufacturing's demo, a vehicle with a registration and an
  odometer, an instrument, one with a warranty ending this month, one of ORG_ZIZI_RETAIL), custodians, and meter
  readings.
- **Specs:** Mantle `test/product/MaintenanceResources` (a decreasing reading refused and a reset accepted with its
  reason; two readings at one time refused, not overwritten; a parent cycle refused; another organization's asset
  refused; a custody change dated and the earlier row ended); BOSS `MaintenanceEquipment` (EquipmentDetail's one
  qvt render under Maintenance: no book value for the resource administrator, the Book pane for a finance reader;
  the facility tree's hidden ancestor unnamed).
- **Usable when** (`acceptance/Maintenance/MaintenanceEquipmentWalk`): `maint.resources` registers a compressor
  under a room, records its hour meter, moves a room under another floor with the effect preview, changes a
  custodian from a date, and prints two asset tags; a scanned tag opens EquipmentDetail for a reader; the
  ORG_ZIZI_RETAIL planner sees none of it; Warehouse's and Manufacturing's EquipmentDetail are unchanged.

**Built Nov 11 (P2).** mr-mantle 90b107c2 and 4afa75a6, mr-boss 6801f484 (branch `mnt/p2`); mr-moqui unchanged, no Rust built.
- Checked first (the code over the plan): F16 (Facility's bookable and capacity, no zone, no feature record; `store#Facility` takes
  none of them, and FacilitySetup.js owns a facility by its own `ownerPartyId` only), F17 (`update#AssetMetadata` Warehouse's under
  `STOCK_ADJUST`), F18 and F61 (`replace#AssetPartyAssignment` checks nothing and ends at now; the return-task EECA fires on any
  `thruDate`), F19 and F70 (AssetMeter's key, no reason relationship or type, no cumulative field), F20 (no warranty fields, no
  `PatSparePart`; the catalog row writer keeps only substitutes, CatalogRecords.js), F21 (EquipmentDetail one screen of sections by
  `appRoot`), F22 (FacilityDetail's tabs by directory, Warehouse's check in `updateFacility`), F23 and F67 (Product360's Equipment
  tab and Products' SharedContext.js `context()`), F62 (People.js `employee360Apps`, `showsEquipment` People's only), F77 (Commons'
  ResourceDetail link), F82 (the root's empty `panelHosts`), F83 (People's narrowing), `move#Asset` (a facility change makes a new
  asset), Warehouse's `move#Stock` (refuses equipment, `NOT_STOCK`), `get#AssetBook` (Accounting read in the owner organization,
  fixed asset types only; `AstTpEquipment` is one), and P1's MaintenanceAccess.js, Maintenance.js, the root and MaintenanceSpecLib.
- Mantle:
  - Records: `Asset.warrantyThruDate` and `warrantyPartyId` (audit-logged on update, a Warranty party relationship);
    `ProductMeter.isCumulative`; the `AssetMeterReadingReason` enumeration (`AmrReading`, `AmrWork`, `AmrReset`, `AmrCorrection`) with
    AssetMeter's ReadingReason relationship, and `AssetMeter.meterValue` audit-logged on create too (a reset's reason is kept with its
    value); ProductAssocType `PatSparePart`; `Facility.timeZone`; `mantle.facility.FacilityFeature` (facility, feature, from, thru,
    comments; the thru audit-logged) with the `RoomFeature` enumeration (projector, display, video conference, whiteboard, step-free
    access).
  - `mantle.product.MaintenanceResourceServices` over `MaintenanceResources.js`: `find#MaintenanceEquipment` (not stock; owned by the
    scope's organizations, or held at their facilities for an owner that is no internal organization; scoped in the query before
    paging; text over id, name, serial, soft identifier and registration numbers; facility with those inside it, custodian,
    warranty expiring within 30 days or expired; rows with names, custodian and warranty state, no cost),
    `find#MaintenanceFacilities` (the scope's facilities by owner or ownerless descendants; filters; `roots` and `parentFacilityId`
    levels; a parent outside the scope one unnamed node `hidden-n` per page, never its name or id; zone own or inherited, counts,
    features), `store#MaintenanceEquipment` (`MAINTENANCE_RESOURCE_EDIT`; a new one through `create#Equipment` with an internal owner
    of the scope, a facility of the scope, a type that is not stock; a change through `update#Asset` with only the identity, name,
    comments, class, parent (`PARENT_CYCLE`) and warranty; `expectedRevision`, `RECORD_CHANGED`), `record#MaintenanceMeter` (resource
    edit, or execute with the work assigned; the model's meter or a meter type; unit; `DATE_FUTURE`; `READING_EXISTS`;
    `READING_DECREASING` on a counting meter against the reading before and after unless a reset; corrections of a reading taken;
    `REASON_REQUIRED`), `store#MaintenanceRegistration`, `change#MaintenanceCustody` (`DATE_FUTURE`, `DATE_BEFORE_HOLDING`,
    `PARTY_UNAVAILABLE`; then `replace#AssetPartyAssignment`), `move#MaintenanceEquipment` (preview: facilities, organizations, zones,
    parts that stay, bookings to come; the move needs `STOCK_MOVE` and both facilities in FacilityScope; `ORGANIZATION_CHANGE`,
    `SAME_LOCATION`, `LOCATION_UNAVAILABLE`; writes the asset's facility and location directly) and
    `preview#MaintenanceFacilityChange` (organization and zone before and after, facilities inside, equipment, bookings to come,
    counted; `PARENT_CYCLE`). The lists of a holder of `MAINTENANCE_ALL_ORGANIZATIONS` narrow to a chosen active organization (F83).
  - `AssetServices.replace#AssetPartyAssignment` gains `effectiveDate` (default now) for the ended rows and the new one (its callers
    unchanged); `FacilityServices.store#Facility` takes `bookable`, `capacity`, `capacityUomId` and `timeZone`, checked in
    FacilitySetup.js (`VALUE_INVALID`); `store#FacilityFeature` (FACILITY_EDIT, the store#Facility scope; `FEATURE_EXISTS`, ended by
    `end`); CatalogRecords.js keeps `PatSparePart` beside the substitutes.
- BOSS:
  - Services: `ironstone.maintenance.EquipmentServices` `get#Equipment` and `get#AssignedEquipment`, `FacilityServices.get#FacilityDetail`
    (Resources.js, each after `check#Record`), `AccessServices.resolve#EquipmentScan` (a tag's EquipmentDetail link or a typed id or
    serial); Maintenance.js gains the P2 `linkPaths`, record kinds' destinations, the palette's equipment and facility finds, and the
    choices `facilityTypes`, `equipmentTypes`, `equipmentClasses`, `roomFeatures`, `custodyRoles`, `readingReasons`, `parties`,
    `people`, `equipmentModels`, `equipment`, `meters`, `timeZones` and `parentFacilities` (each a resource reader's).
    template/MaintenanceParts.xml gains the write transitions (`storeEquipment`, `changeCustody`, `recordMeter`,
    `storeRegistration`, `moveEquipment`, `createMaintenanceFacility`, `storeFeature`, each `check#Record` with its capability first)
    and the NewMaintenanceFacility dialog.
  - Screens: the root's Equipment and Facilities (menu-include for a view, assigned view or resource view permission; keys `g e`,
    `g f`) and its panels for Asset and Facility, each checked by `check#Record` (F82); Equipment/Find and Equipment/AssetTags (html-print
    labels with a QR or Data Matrix of the EquipmentDetail link, size and code chosen), Facilities/Find (tree first, list twin).
    EquipmentDetail under Maintenance: its header (template/MaintenanceEquipment.xml) and the tab directory `Shared/EquipmentDetail/`
    (Identity with Edit and Move after its effect; Hierarchy; Assignments with Change custodian; Meters with Record a reading;
    Registrations; Book for an Accounting reader, read only; Files with the old maintenance records' files listed; Conversation),
    every tab rendering nothing outside Maintenance. FacilityDetail under Maintenance: its context, tabs Overview, Children
    (Maintenance's New facility inside), Rooms & features (new), Equipment (new), Certifications (new, read only), Files and
    Conversation, Edit facility with zone, capacity and booking through the mounting app's own check (F22), and Move after
    `preview#MaintenanceFacilityChange`. Product360 at `Maintenance/Equipment/Product360` (SharedContext.js `maintenanceContext()`,
    F67; Catalog.js `sparePartRows`; the Spare parts tab; Product360 asks `get#CatalogOptions` for Maintenance's context under
    Maintenance only) and Employee360 at `Maintenance/Equipment/Employee360` (People.js's Maintenance row; AssignedEquipment from
    `get#AssignedEquipment` under Maintenance). Commons' Open in Maintenance opens the resource's FacilityDetail or EquipmentDetail
    (F77); Insights' Records owners name Maintenance's EquipmentDetail and FacilityDetail.
  - Demo: BossMaintenanceDemoData's Services Campus (America/Chicago), Service Center, two floors, Rooms 101 (8, bookable, display and
    video conference), 102 (mechanical), 201 (9, bookable, projector, whiteboard, step-free) and 202 (store); the AC-200 model with its
    counting run-hour meter, a 500-hour oil service and two spare parts; Compressor C-1 with its motor, Service van 3 (a registration,
    an odometer reading), Multimeter M-7 and Air handler AHU-2 (warranty ending this month), with three compressor readings;
    BossZMaintenanceDemoData (loading after People's and Purchasing's) holds the custodians Kenji and Sofia and the warrantor
    BOSS_PUR_SUP_B.
- Specs:
  - Mantle `test/product/MaintenanceResources` (4 features, 1.2 s): a counting meter's lower reading refused and a reset taken with
    its reason in the audit log, one reading per time (the first kept), a correction, a future reading, a meter the model lacks; the
    writer's parent cycle, another organization's equipment with the parameters that change one's own, a write permission alone,
    a new piece and another organization as owner, the list's scope and an every-organization reader narrowed to the active one; a
    dated custody change ending the earlier holding at that date, a later date and one before the holding refused, another
    organization's equipment; store#Facility's capacity, booking and zone, the inherited zone, a feature added, twice and ended.
  - mr-boss `MaintenanceEquipment` (4 features, 1.2 s): EquipmentDetail's header and Identity tab under Maintenance (one render
    each, qvt) as the resource administrator (identity, serial, warranty, zone, Edit, the tab bar without Book, no book value), the
    Book in a finance reader's context and Retail's planner refused; Equipment/Find (the expiring warranty filter, New equipment for
    the resource administrator only, the planner's custodian column, no forklift) and AssetTags (labels, the left-out count) and a
    scanned link resolved; the tree's hidden ancestor unnamed (no Retail name or id), the roots' zone, Retail's planner seeing none,
    Facilities/Find, FacilityDetail with the move's effect and Rooms & features; Product360's Spare parts and Employee360's work card
    with the equipment held. `MaintenanceAccess` gains the equipment write (the resource administrator's, the planner refused,
    Retail's forklift refused) and the panels (Services' facility and compressor served, Retail's and a product refused), with the
    menu, keys and palette for P2 (9 features, 2.9 s).
  - Acceptance, written and not run: `acceptance/Maintenance/MaintenanceEquipmentWalk` (5 features: register a compressor in a
    room and record its hour meter, a lower reading refused; move a room under the other floor after its effect; change a custodian
    from a date, a later one refused, and print two tags; a scanned tag opens EquipmentDetail for the reader and Retail's planner sees
    none of it; Warehouse's and Manufacturing's EquipmentDetail with no Maintenance tab).
- Tests run (release binary, `--nobuild`, this worktree): mr-mantle MaintenanceResources, MaintenanceScope, PeopleChecklists,
  WarehouseFacilities, ContactAndFacilityServices, WorkProcess, ProductCatalogServices and AssetReservationMisc (11 specs with their
  fixtures, 103 of 103 features, 9.8 s; after the F83 change MaintenanceResources and MaintenanceScope 7 of 7); mr-boss the 107
  regression specs of Warehouse, Accounting, Insights, Products, Commons, Manufacturing and People (867 of 867 features, 135.4 s),
  then MaintenanceAccess, MaintenanceEquipment, ProjectsAccess, AccountingFixedAssets, ManufacturingDowntime, ManufacturingWorkCenters,
  ManufacturingAccess, ManufacturingSchedule, PeopleLifecycle, PeopleEmployees, PeopleAccess, WarehouseFacilities, WarehouseInventory,
  WarehouseAccess, WarehousePolicies, WarehouseShipping, WarehousePacking, ProductsSharedContext, ProductsAccess, Schedules,
  InsightsRecords, InsightsAccess and AppOrganizationFilters after the last screen changes (182 features, all passing once a decimal
  in FacilityDetail's caption was fixed; MaintenanceEquipment and WarehouseFacilities rerun 30 of 30), and MaintenanceEquipment with
  MaintenanceAccess last (13 of 13, 4.2 s). `moqui lint --screens` (release binary): 136 flagged sites, as before P2; none in the
  new or changed screens. Prettier clean on the new and changed JavaScript. Not run: ./moq test-apps, the acceptance suite.
- Inventories: ss-inventory's EditAsset, AssetMeters, AssetParties, AssetRegistrations, CreateEquipment, ListAssets,
  EnterMoveAssetForm, the four Product360 equipment forms, EditFacilityForm, ChildListForm, the facility notes, NewFacilityForm and
  FacilityListForm name their Maintenance screens; usl-inventory's update#Asset, replace#AssetPartyAssignment, create#Equipment and
  store#Facility, and an Added table for MaintenanceResourceServices and store#FacilityFeature.
- Design edits: design-maintenance §1.1 (the panels), §1.2 (the menu, keys, palette and mounts), §6 Equipment, Facilities and the
  shared records as built (and the move's direct write); design-people §4 Employee360's Maintenance row; design-products Product360's
  Maintenance mount; impl-people §7's Employee360 row and custody guard marked built.
- Findings, numbered by the lead F85 to F92 in order:
  - `AssetServices.move#Asset` makes a new asset whenever the facility changes (a stock rule), and Warehouse's `move#Stock` refuses
    equipment (`NOT_STOCK`), so P2's equipment move writes the asset's facility and location directly after its own checks (design §6
    and §13.2 said through `move#Asset`); design §6 changed.
  - FacilitySetup.js owns a facility by its own `ownerPartyId` only, while MaintenanceAccess reads an ownerless room by its nearest
    owning ancestor: `store#Facility` and `store#FacilityFeature` refuse an ownerless room (`FACILITY_UNAVAILABLE`) that Maintenance
    lists. The demo's rooms name their owner; a later phase (or Warehouse's owner) may make the facility writes follow the ancestor.
  - The plan's "forklift already in Manufacturing's demo" is Warehouse's and Retail's (`BOSS_WH_FORKLIFT`); it serves as Retail's
    equipment.
  - BossMaintenanceDemoData loads before People's and Purchasing's demo (by file name), so its links to their records are in
    BossZMaintenanceDemoData.xml; Commons' bookable-room list shows Maintenance's bookable rooms, and its Schedules spec's seats
    filter expects one room of ten or more, so Room 201 holds nine.
  - Product360 asked `get#CatalogOptions` with no `appRoot` (Products' context), which a Maintenance user without catalog read is
    refused; it now passes Maintenance's root under Maintenance only, the other mounts as before.
  - Mantle's maintenance services are reached under the Maintenance root's inheritable grant; they are not on the `BOSS_MAINTENANCE`
    artifact group, so a direct call with authorization on is refused, and specs call them with the artifact check aside (their own
    checks decide), as for the other apps' Mantle services.
  - The menu condition of Equipment and Facilities names the view permissions (`hasPermission`), a copy of MaintenanceAccess.js's
    `resourceRead`, since a menu item's expression has no capability to read.
  - Built only partly: the facility close's preview (`preview#MaintenanceFacilityChange` takes `closedDate`, but Edit facility's close
    shows none; the move's does), Certifications read only (no guarded writer), Employee360's return task link (WorkItemDetail is
    mounted in P3), the equipment list's availability and next PM (P5, P13); a technician's reading in work is in Mantle with no screen
    until P7.
- For the lead:
  - budget share: mr-mantle MaintenanceResources 1.2 s; mr-boss MaintenanceEquipment 1.2 s and MaintenanceAccess +0.5 s (2.9 s); no
    client spec; budgets not changed;
  - merge hot spots: mr-boss `screen/Maintenance.xml` (subscreens, panel hosts, keys), `service/ironstone/maintenance/Maintenance.js`
    (linkPaths, recordKinds, searchFinds, choiceSources, operations), `template/MaintenanceParts.xml`, `data/BossMaintenanceDemoData.xml`,
    `test/Maintenance/MaintenanceSpecLib.js` (ids, menus) and `MaintenanceAccess.spec.js`, `screen/Shared/EquipmentDetail.xml` and
    `FacilityDetail.xml` (and its tabs), `Product360.xml`, `Employee360.xml`, People.js, SharedContext.js, Catalog.js, Records.js,
    `plan/design-maintenance.md` §1.1, §1.2, §6, the inventories; mr-mantle `AssetServices.xml` (replace), `FacilityServices.xml`,
    FacilitySetup.js, CatalogRecords.js and the entity files;
  - the user's calls: none needed; the facility writers' ownerless rooms (the second finding) may want one later.

**Review Nov 11 (P2).** mr-mantle 9f37ac4f and e8127b63 (R7, R8), mr-boss 7d039285 and the note's commits (branch `mnt/p2`), over the worker's
90b107c2, 4afa75a6, 6801f484 and 97aaa2de. Reviewed `git diff master...mnt/p2` in both repos against P2's text, §2, §4, F16–F23,
F61, F62, F67, F70, F77, F82 and F83, design §6 and §13.2, AGENTS.md and Practices-App-Dev; read the owners' code each change
reaches (move#Asset, Warehouse's StockPosting and InventoryCounts, AssetBooks, the return-task EECA, FacilitySetup.js,
FacilityScope.js, People.js `employers()`, Products' Catalog.js options); lint re-run with the Debug binary.
- Checked and found sound:
  - `move#MaintenanceEquipment` moves equipment only: `equipmentOf` refuses stock (`AstTpInventory`, `AstTpSupplies`) and an asset
    with no type, as Warehouse's own guards count an untyped asset as stock; it needs `MAINTENANCE_RESOURCE_EDIT`, `STOCK_MOVE` and
    both facilities in FacilityScope, and refuses an organization change. `Asset.facilityId` and `locationSeqId` are audit-logged
    (`enable-audit-log="true"`), so the direct write is audited. No ledger posting is bypassed: move#Asset itself posts nothing (an
    AssetDetail quantity pair only, for stock), AssetBooks reads a facility only for inventory standard costs, and a fixed asset's
    book is by owner organization, which the move never changes; the status SECAs on update#Asset do not fire (no status change);
  - the hidden-ancestor tree: `hidden-n` is an index into the scope's sorted out-of-scope parents, the node's name is "" and its label
    fixed, `parentName` is "" and `parentFacilityId` the key for a row under it; a real out-of-scope id given as `parentFacilityId`
    answers only the scope's children; FacilityDetail's header, Children and Rooms, EquipmentDetail and the equipment rows name no
    facility outside the scope (the rows' `facilityShown`); the palette and the choices now drop the node (R2);
  - the scoped finds filter in the query before `count()` and paging (scope, text, registrations, facility subtree, custodian,
    warranty, features, organization); F83's narrowing (an every-organization holder with an active internal organization) is
    People's `employers()` rule for lists, with the record check left at every organization, as the worker recorded;
  - EquipmentDetail and FacilityDetail outside Maintenance: every new part is conditioned on `appRoot == 'Maintenance'` (the tabs
    render nothing elsewhere; Edit facility's time zone, capacity and bookable are `ignored` elsewhere, so Warehouse's store#Facility
    call gets none of them and changes none); F22's update check keeps Warehouse's `check#Record` in the `else` branch unchanged, for
    Warehouse and Manufacturing alike. Warehouse's, Manufacturing's and Accounting's EquipmentDetail rendered in qvt (an ad-hoc
    render, not kept): 200, no errors, no Maintenance tab or supplier warranty;
  - Products: `maintenanceContext()` is reached only for `appRoot == 'Maintenance'`; catalogEdit and catalogAdmin are the user's own
    catalog capabilities (and store#CatalogRow checks CatalogPolicy again), every price, cost, method and stock capability false;
    Product360 passes Maintenance's root to `get#CatalogOptions` under Maintenance only, the other mounts `null` as before;
  - People.js's Maintenance row: regions `overview` only, no own-only regions, edits false; AssignedEquipment under Maintenance is
    `get#AssignedEquipment` (Resources.js), each holding checked with `requireAsset` in Maintenance's scope; People's
    `showsEquipment` stays People's;
  - the Book: `bookOf` calls Accounting's `get#AssetBook` as the user (its own Accounting read in the owner organization), the tab
    bar drops Book without it, and Book.xml shows a book only from that answer; MaintenanceEquipment checks the resource
    administrator gets no book and a finance reader gets the net book value;
  - replace#AssetPartyAssignment's `effectiveDate` defaults to now, so People's `return#Equipment` (no date) is unchanged; the
    return-task EECA fires on the update that sets an empty `thruDate`, whatever its date, so a dated Maintenance change completes the
    task as People's does (PeopleChecklists and PeopleScheduledChanges pass);
  - "Mantle maintenance services are reached only under the root's grant": right per §2 and as every other app does it. No BOSS
    group has artifact authorization for an app's Mantle services (BossSetupData lists only four report or price services); People's
    `mantle.humanres.PeopleServices` are reached the same way under People's root. Each of the eight services checks its own
    permission and scope (`scopeWith`, `recordMeter`'s own check), so the inherited grant decides nothing;
  - the owner-less-room finding is right: FacilitySetup.js's `facilityOf` owns a facility by its own `ownerPartyId`, and store#Facility
    requires an owner (`OWNER_REQUIRED`), so only loaded data has ownerless facilities; Maintenance reads them by the nearest owning
    ancestor and its Edit facility was then refused (`FACILITY_UNAVAILABLE`; R8 builds the user's call). `move#MaintenanceEquipment` checks FacilityScope by
    the nearest owning ancestor too (`facilityOrganization`), where Warehouse's own stock guards use the facility's owner; for owned
    facilities they agree.
- Fixes:
  - R1 (access, medium). The `parties` and `people` choices offered every person and organization in the system (any enabled,
    non-private party) to any resource reader, a technician with the assigned view among them: other organizations' employees,
    customers' contacts. Other apps scope theirs (Warehouse's by role, People's by employer). Now `custodians` (Change custodian, the
    list's custodian filter) offers the scope's organizations and their current employees (PrtEmployee), and `parties` (warrantor,
    agency, the warranty filter) organizations only, of the internal ones only the scope's; `people` is gone (unused).
    MaintenanceAccess: the planner's custodians hold Kenji, Retail's planner's do not, and the planner's parties offer no person
    and not Retail; it fails with the old choices.
  - R2 (correctness, low; leak checked). find#MaintenanceFacilities adds the unnamed node to any page that is not a level, so the
    palette showed a blank row opening `FacilityDetail?facilityId=hidden-1` and the parent choice offered `hidden-1` with no label
    (no name or id leaked). Both drop the node now; MaintenanceEquipment checks the palette and the parent choice for the leased bay
    under Retail's warehouse; it fails without the filter.
  - R3 (correctness, medium; F83). An every-organization holder with an active organization opening a facility of another
    organization (the record check admits it) got an empty header, no children and no equipment: FacilityDetail's reads went through
    the narrowed lists. A list anchored on a record (find#MaintenanceFacilities' new `facilityId` and a real `parentFacilityId`,
    find#MaintenanceEquipment's `facilityId`) is now read in the record check's scope; the roots and unanchored lists stay narrowed,
    and `hidden-n` levels keep the list's scope so their numbering holds. FacilityDetail's header reads by `facilityId` (it searched
    the id as text, 100 to a page). MaintenanceResources checks the other organization's site and its pump for the narrowed holder
    while its roots stay the active organization's; it fails without the change.
  - R4 (hardening, low; F61). `replace#AssetPartyAssignment` itself refuses an effective date later than now (`DATE_FUTURE`, a
    minute's skew allowed): it is on the `/mantle` REST asset path (mantle.rest.xml), so the new parameter could end a holding in the
    future, and the return-task rule completes the task when the end is written. MaintenanceResources checks it; fails without.
  - R5 (correctness, low). `change#MaintenanceCustody` checked a back-dated change only against the current holders, so a date inside
    another holder's ended holding made two holders at once. It now refuses that too (`DATE_BEFORE_HOLDING`); MaintenanceResources
    checks an Operator held January to March refused from February and accepted from March 2; fails without.
  - R6 (correctness, low; missing test). The equipment move left the asset's `containerId`, so a later move of the container
    (ContainerAssetLocation) would carry the equipment back; it now clears it, as move#Asset's whole move does. The move had no
    regression case at all (only the acceptance walk): MaintenanceResources now checks the preview, `STOCK_MOVE` refused, stock
    refused, another organization's site refused, and the move with its audit row and no container; the container check fails
    without the change.
  - Design §6 (the move cell said `move#Asset`; the move's equipment-only rule, container and ledger; the anchored lists; the custody
    overlap and drop-downs; replace's refusal of a later date) and the Mantle service descriptions.
  - R7 (the user's call, Nov 11; access). `change#MaintenanceCustody` accepts as the new holder only one of the scope's internal
    organizations, a person one of them employs now (PrtEmployee), or the equipment's own owner organization (a customer's
    equipment in its custody); anything else is `HOLDER_UNAVAILABLE`. MaintenanceResources: an outsider, another internal
    organization and a customer on the organization's own equipment refused; the organization and the customer on its own
    equipment accepted (the spec's holders are now the organization's employees); fails without the check.
  - R8 (the user's call, Nov 11; an owner contract with Warehouse). Mantle's facility checks read a facility that names no owner by
    its nearest owning ancestor, as Maintenance does: FacilityScope.js gains `facilityOrganization` and `ownsFacility`, and
    FacilitySetup.js's `facilityOf` (facility, location and room-feature saves) uses it; store#Facility keeps such a facility
    ownerless when no owner is given, naming the organization it already takes needs no reason, and a new facility still names
    its owner. Owned facilities are unchanged. `move#MaintenanceEquipment` checks both facilities with `ownsFacility`. The stock
    guards (StockPosting, Putaway, InventoryCounts, Printing, ShipmentLoads) keep reading the facility's own owner, because their
    postings name it as the organization: stock at an ownerless facility stays refused there (fails closed). WarehouseFacilities
    gains the case (the editor renames and adds a location to an ownerless room under its warehouse and owns it without a reason;
    an ownerless room under another organization's site refused); fails without the change. Written into design-warehouse §1 and
    impl-warehouse §4's log.
- Findings, numbered by the lead F93 to F96 in order (after the note on the calls):
  - (The two user's calls, the custody holder Mantle admits and the ownerless facility's organization, are built as R7 and R8.)
  - With R8, an ownerless facility moved under another organization's facility changes organization with it and no owner-change
    reason is asked (store#Facility asks one only for a change of the stored owner); Maintenance's
    `preview#MaintenanceFacilityChange` shows the change first, Warehouse's own edit does not.
  - `record#MaintenanceMeter` in work checks the work is assigned to the caller but not that the equipment is the work's target; P7
    (the technician's reading in a step) should tie them.
  - EquipmentDetail's new `subscreens` (default Identity) apply under every mount, so its URL gains `/Identity` in the other apps; it
    renders nothing there (checked above), but a bookmark or test that compares the path would see it.
  - The equipment and facility lists' rows each read the organization, time zone, child and equipment counts with their own queries
    (a few per row, pages of 20 to 100); acceptable now, a candidate for batching with P3's work-order counts.
- Tests after R7 and R8: mr-mantle MaintenanceResources and WarehouseFacilities 21 of 21 (3.2 s feature time), then with
  ContactAndFacilityServices, MaintenanceScope, PeopleChecklists and AssetReservationMisc 90 of 90, and WarehouseOperationPolicy,
  WarehousePolicy and WarehousePutaway 35 of 35; mr-boss WarehouseFacilities, WarehouseInventory, WarehouseAccess, WarehousePolicies,
  WarehouseMoves, WarehousePutaway, MaintenanceEquipment and MaintenanceAccess 86 of 86 features. Each new case failed without its
  change. Prettier clean.
- Tests (release binary, `--nobuild`, this worktree): mr-mantle MaintenanceResources 5 of 5 (1.6 s feature time; the new move
  feature 0.20 s), then with MaintenanceScope, PeopleChecklists, PeopleScheduledChanges, AssetReservationMisc, WorkProcess and
  WarehouseFacilities 89 of 89 features (12.5 s); mr-boss MaintenanceEquipment 4 of 4 and MaintenanceAccess 9 of 9 (4.4 s alone), then
  with ProjectsAccess and WarehouseFacilities 48 of 48 features. Each new case was run against the code without its fix and failed
  (R1–R6 as above). `moqui lint --screens` with `target/debug/moqui`: 136 flagged sites, as before P2, none in the changed screens.
  Prettier clean on the changed JavaScript. Not run: ./moq test-apps, the acceptance suite (MaintenanceEquipmentWalk passes no
  party choice and is unchanged by the fixes).
- For the lead: budget share mr-mantle MaintenanceResources 1.6 s (+0.4 s over the Built note), mr-boss unchanged in effect (+0.1 s);
  merge hot spots as the Built note's, plus mr-mantle `MaintenanceResources.js`, `MaintenanceResourceServices.xml` and
  `AssetServices.xml` (replace), mr-boss `Maintenance.js` (choiceSources, resourceChoices), Resources.js, `Assignments.xml` and
  Equipment/Find.xml (the custodians choice), design §6; with R7 and R8 also mr-mantle FacilityScope.js, FacilitySetup.js and
  WarehouseFacilities.spec.js (+0.1 s), mr-boss design-warehouse §1 and impl-warehouse §4's log; no user's call left open.

### P3 — Work orders

Design §3 Home, WorkOrders and WorkOrderDetail (WorkHeader, Assignments, WorkTime, WorkConversationFiles, the
lifecycle table and record shape), §9 Settings (the work policy fields), §13.3; MT-02, MT-01 (the generic paths and
CalDAV), MT-08 (time), MT-11 (Home, Today, the palette and notices).

- **Mantle records.** `mantle.work.maintenance.MaintenanceWorkOrder` keyed by the root's `workEffortId` (design §3
  "Record shape"), key fields audit-logged; `mantle.work.maintenance.MaintenancePolicy`, dated by organization, with the
  fields this phase reads (default type and team, the planned-work approval threshold, the closure policy, and whether
  the organization's production requests and warranty repairs become managed work, off by default); the lookups of
  design §9 as enumerations (maintenance kind corrective and preventive above the existing MaintenanceType values,
  source, severity, hold and cancel reasons, failure mode as a seeded type); the `MaintenanceWork` topic with its
  `TopicRegistration` (F52); the maintenance status flow over the existing WorkEffort statuses with WeApproved ↔
  WeOnHold as Manufacturing seeded them; and the AssetMaintenance transitions the synchronization needs and the Default
  flow lacks: in process to cancelled, completed back to in process, scheduled back to created (F10).
- **Mantle `mantle.work.MaintenanceServices`:** `find#MaintenanceWorkOrders`, `get#MaintenanceWorkOrder`,
  `create#MaintenanceWorkOrder` (an ad hoc root now; from a template in P6), `store#MaintenanceWorkOrder`,
  `schedule#MaintenanceWorkOrder` (one order's team, people and window; the ranked picker is P8),
  `transition#MaintenanceWorkOrder` and `act#MaintenanceWorkOrders`, with the gates of design §3's table. The root is
  a `WetTask` of purpose `WepMaintenance` with no project root, so the project rules do nothing to it (F27, F28).
  - The planned-work approval threshold (§4; design §9) is by estimated duration or estimated cost, and this
    phase builds the duration half: MaintenancePolicy carries a threshold in hours, zero by default, so all
    template, PM and planned work needs a supervisor, and the Approve gate compares the root's
    `WorkEffort.estimatedWorkTime` (entity/WorkEffortEntities.xml:235; in `timeUomId`, hours by default), which
    WorkHeader gains as estimated hours; a template's steps add theirs from P6. Work with no estimated hours is
    over the threshold. The cost half is P11's, where its inputs exist (P9's planned parts, People's costing
    rate); until then the hours threshold alone decides. No estimated cost is stored on the work effort.
  - Status is written by the service's own `update#WorkEffort`, with the entered actual start and finish in the
    same update: `set#TaskStatus` would write now as the completion time (F7).
  - Equipment work has one primary AssetMaintenance, created through `create#AssetMaintenance` with a status, the
    planned start as its date and no `intervalQuantity` (F11), or an open one adopted; facility work has none. The
    AssetMaintenance follows the root; a direct edit of a managed one is refused.
  - **Adoption** (design §6, §13.2; impl-manufacturing §7): `adopt#MaintenanceRecord` gives an open, unlinked
    AssetMaintenance (Manufacturing's, or the baseline's) a managed root, source-keyed and retryable, refusing one
    with conflicting linked work; completed history stays unmanaged and readable. A repair Customer Service made
    keeps its own path until P12.
- **The generic paths** (design §13.2, §13.3; F8, F9, F28, F29):
  - `TaskServices.update#Task`, `set#TaskStatus`, `set#TaskDates`, `move#Task`, `set#TaskRecurrence`,
    `WorkEffortServices.delete#WorkEffort` and the WorkEffortParty writers (`add#`, `replace#`,
    `remove#WorkEffortParty`) refuse managed work with the reason `MANAGED_WORK`, by a data check on the record
    (§4): a root that has a MaintenanceWorkOrder row and its steps, and work whose process policy guards
    execution, which none does until P6 sets the flag for procedures; People's checklist tasks stay ordinary
    tasks (P0, F59: People P7 built these refusals, reading the entity by name; defining
    `mantle.work.maintenance.MaintenanceWorkOrder` turns them on, and P3 asserts them rather than rewriting them). WorkOrderDetail's Assignments form writes through `schedule#MaintenanceWorkOrder`;
  - BOSS `get#TaskAccess` and `check#TaskUpdate` treat a managed root and its steps as not a task, as they do a
    production operation (commons/TaskServices.xml:85-90), with a message that opens WorkOrderDetail;
  - `WorkEffortPartyAssignedNotify` is conditioned to leave managed records to the `MaintenanceWork` topic; managed
    records carry no recurrence fields; `WorkEffortPartyDocsUsers` is conditioned to project roots;
  - CalDAV: `get#TaskObjectTags` leaves templates and steps out and marks a managed root read only, beside what
    People left out of it (P0, F63: `ChecklistStep.isProtected`); a PUT or DELETE on one answers 403 (DELETE today ends the assignment with a direct
    update).
- **Time** (MT-08): the timer and `store#TimeEntry` admit an assigned technician's own time on a managed root or
  step in progress and refuse a template (P0, F66: the time services check no work access, so `MaintenanceServices`'
  own time entry points check and then call them unchanged); root totals sum distinct TimeEntry rows of the tree.
- **Manufacturing and Warehouse** (owner contracts, F13, F49): "in maintenance" is an AssetMaintenance in process,
  not any open one, in Mantle's `store#ProductionEquipment` guard (`EQUIPMENT_BLOCKED`) and in the two apps'
  equipment reads, so a planned work order and a request not yet started block nothing; the outage is P5's. No
  spec of either owner asserts the open-maintenance half today; their specs pass unchanged, and the new rule is
  checked in `MaintenanceWorkOrders`. Written into design-manufacturing and both plans' logs.
- **Admin** (owner contract, F56): a `LifecycleParticipant` `maintenance.assignments` (a user's open work order and
  step assignments and equipment custody), with its lookup and transfer services in
  `ironstone.maintenance.LifecycleServices` over `schedule#MaintenanceWorkOrder` and the custody change, as
  Projects' is registered (BossSetupData.xml:4060-4064); Admin's `find#Assignments` leaves managed work out of
  Projects' participant, whose reassignment would be refused. Booking approver roles join it in P15.
- **Chatter and RecordFiles** under the Maintenance root admit a work order, step, asset, facility or request
  host through `ironstone.maintenance.AccessServices.check#Record`; old AssetMaintenance hosts stay readable. (P0,
  F69: Mantle's `get#RecordLinkInfo` admits a work effort by organization in every app, so its work effort branch
  gains a Maintenance rule beside People's `protectedHidden`: a managed root and its steps only as MaintenanceAccess
  admits them.)
- **BOSS:** `ironstone.maintenance.WorkOrderServices` (the list's shapes, saved filters, board and calendar data);
  `HomeServices.get#TodayItems`; the root's quick create "Work order" for a planner, the `MaintenanceWork` topic
  and the palette's work-order source.
- **Screens:** WorkOrders (FindWork, WorkRows with `view-board` by status and `view-calendar` by the planned window,
  NewWork, a plain AssignSchedule); WorkOrderDetail with the record header and the tabs Overview (WorkHeader,
  Assignments), Time, Files, Conversation, History, and CompleteWork with its blocker list; Home's Counters, MyWork
  and TeamWork over `mantle.work.MaintenanceReportServices.get#MaintenanceHome`; EquipmentDetail's Maintenance
  history pane and FacilityDetail's Work orders tab, with Create work and Adopt; Settings' MaintenanceSettings form
  with this phase's fields.
- **Demo data:** eight work orders across the states, two unassigned, one overdue, one on a room, one adopted from
  Manufacturing's demo downtime, with time entries.
- **Specs:** Mantle `test/work/MaintenanceWorkOrders` (a planner's corrective order approved on create and planned
  work held for a supervisor; Start refused to an unassigned technician; Complete refused with a running timer and
  writing the entered finish; Cancel keeping time and files; a second primary AssetMaintenance refused; a retried
  create answering the first root) and `test/work/MaintenanceManagedWork` (`set#TaskStatus`, `update#Task` and
  `delete#WorkEffort` refused with `MANAGED_WORK` and an ordinary task unchanged; the Tasks collection without steps
  and a PUT on a root refused; adoption once); BOSS `MaintenanceWorkOrders` (WorkOrderDetail's one qvt render: a
  technician sees an assigned order and not a team total; Commons' task check answering not a task; Admin's
  offboarding listing a leaver's work order under Maintenance's participant and not Projects'); the golden walk
  `test/client/Maintenance/MaintenanceWorkOrdersWalk` (create, assign, start, log time, complete, close).
- **Usable when** (`acceptance/client/Maintenance/MaintenanceCorrectiveWalk`; design §11.2 "Facility/equipment
  identity", "Phones and CalDAV", "Device/access paths" in part): a planner creates a corrective order on the
  compressor and one on a room with no asset, assigns a technician, who starts it on a phone, logs time and
  completes it with an explicit finish; the supervisor closes it; Commons' Today cannot mark it done; Manufacturing's
  equipment page shows the compressor available while the order is only planned; offboarding the technician in
  Admin lists their open work orders for reassignment.

**Built Nov 12 (P3).** mr-mantle 0fcc36bd, mr-boss e1e085a3 (branch `mnt/p3`); mr-moqui unchanged, no Rust built (an aborted
`./moq run lint` began a debug build and was stopped: WT holds a partial `target/debug`, untracked, which the lead may delete).
- Checked first (the code over the plan): F59 (`check#ManagedWork` reads `mantle.work.maintenance.MaintenanceWorkOrder` by name, its
  callers in TaskServices and WorkEffortServices; not `create#WorkEffortContent`), F63 (`get#TaskObjectTags`' `protectedIds`; a PUT
  answers 409 through `update#Task`, DELETE ends the assignment directly), F65 (call.rs `check_status`: a move is admitted where any
  flow's row admits the user), F66 (`start#Timer`, `stop#Timer`, `store#TimeEntry` check no work), F69 (`get#RecordLinkInfo`'s work
  effort branch and `protectedHidden`), F82 (the root's `panelHosts`), F83 (People's and P2's `listScope`), F96, F6–F10, F13
  (WorkCenters.js, Facilities.js), F27 (`complete#RequestFromWork` moves nothing for a root with no project), F28 (Work.eecas.xml),
  F29, F46–F49 (`openMaintenance` in ProductionOrders.js), F56 (Admin's Lifecycle.js `openAssignments`), Manufacturing's
  `WorkEffortProduction` flow, Commons' `get#TaskAccess`, `find#TaskRows`, `check#TaskUpdate`, Mantle's `get#UserTodayItems` and
  `notify#TaskAssigned`, PaletteServices' `get#RecordLink`, and Admin's participant contract (`define#OwnedResourceLookup`).
- Mantle:
  - Records (`entity/MaintenanceEntities.xml`): `MaintenanceWorkOrder` keyed by the root's `workEffortId` (target asset, primary
    AssetMaintenance, kind, type, source, severity, failure mode, hold and cancel reasons and the status a hold came from, outcome,
    disposition, cost centre and project audited, revision, operation key and hash); the view `MaintenanceWorkOrderDetail` (the row
    with its root); `MaintenancePolicy`, dated by organization (threshold in hours, closure policy, default type and team, whether
    production requests and warranty repairs become managed work). Offline intent and procedure effective time are P5's and P6's.
  - Seed (`data/MaintenanceWorkData.xml`): the enumerations MaintenanceKind (corrective, preventive; MntTpPreventive and
    MntTpInspection added to MaintenanceType), MaintenanceSource, Severity, HoldReason, CancelReason, FailureMode, Outcome,
    Disposition, ClosurePolicy; the `WorkEffortMaintenance` flow, its WeApproved ↔ WeOnHold rows needing `MAINTENANCE_SUPERVISE`
    (see the findings); the AssetMaintenance transitions in process → cancelled, completed → in process, scheduled → created (F10);
    the `MaintenanceWork` topic and its `TopicRegistration` (F52, audience MAINTENANCE_EXECUTE).
  - `mantle.work.MaintenanceServices` over `MaintenanceWork.js`: `find#MaintenanceWorkOrders` (scoped in the query before paging, an
    every-organization holder narrowed to the active organization, F83; assigned view only the caller's; saved-find filters; names,
    assignees and teams read once per page, F96), `get#MaintenanceWorkOrder` (header, assignments, time with a technician's own only
    and no team total, the caller's timer, the actions with why not, blockers, history from the audit log), `create#MaintenanceWorkOrder`
    (one target, the root a `WetTask` of `WepMaintenance` owned by its service organization with no project, the AssetMaintenance through
    `create#AssetMaintenance` with the planned start and no interval, F11; approved on create for corrective work, a supervisor's, or
    within the hours threshold; operation key retry and `OPERATION_KEY_CONFLICT`), `adopt#MaintenanceRecord` (once; `RECORD_CLOSED`,
    `OWNER_PATH` for a warranty repair, `LINKED_WORK`), `store#MaintenanceWorkOrder`, `schedule#MaintenanceWorkOrder` (team, technicians
    as employees or agents of the organization, `ASSIGNEE_UNAVAILABLE`, window; MaintenanceWork to new technicians),
    `transition#MaintenanceWorkOrder` (the gates of design §3; status and the entered dates in its own update, F7; the AssetMaintenance
    synchronized), `act#MaintenanceWorkOrders` (one transaction per work order), and the time entry points `start#` and
    `stop#MaintenanceTimer` and `record#MaintenanceTime` (assigned, in progress, no template; then the time services unchanged, F66).
    `MaintenanceSettingsServices` get# and store#MaintenancePolicy; `MaintenanceReportServices.get#MaintenanceHome`.
  - The generic paths: no change to the refusals People built (F59); `WorkProcesses.js` gains `managedIds` (the same rule over a list).
    `get#TaskObjectTags` leaves templates and managed steps out and marks a work order `readOnly`; `put#` and `delete#DavObject` answer
    403 for it before any change (F63). `get#RecordLinkInfo` gains `maintenanceHidden` beside `protectedHidden` (F69). `get#UserTodayItems`
    and `notify#TaskAssigned` leave managed work to Maintenance. `store#ProductionEquipment`'s guard reads an AssetMaintenance in
    process (F13, F49).
- BOSS:
  - Services: `ironstone.maintenance.WorkOrderServices.find#WorkOrderRows`, `HomeServices.get#TodayItems`, `LifecycleServices` find# and
    transfer#Assignments (WorkOrders.js); Maintenance.js's `workOrder` record kind (a step read as its work order), the work choices
    (kinds, types, sources, severities, failure modes, reasons, outcomes, dispositions, closure policies, `teams`, `workPeople`,
    `workFacilities`), the palette's work orders and `recordLink`; Resources.js's equipment `maintenanceRecords`.
  - Screens: the root (Work orders, `g w`, the work order panel host, F82; quick create, the MaintenanceWork topic, the Today source);
    WorkOrders (Find; NewWorkOrder; WorkOrderDetail with its tabs Overview, Time, Files, Conversation, History) and
    `template/MaintenanceWorkOrderParts.xml`; Home's counters, My work and Team work; Settings' Work policy; EquipmentDetail's
    Maintenance tab and FacilityDetail's Work orders tab (Maintenance only).
  - Owner contracts: Commons (`get#TaskAccess` answers not found with `MANAGED_WORK` and the work order's link; Tasks' rows and
    `check#TaskUpdate` refuse a change; `get#RecordLink` opens a work order under Maintenance), Admin (`maintenance.assignments`;
    Projects' participant leaves managed work out, F56), Manufacturing (WorkCenters.js) and Warehouse (Facilities.js availability; the
    summary's open-job count unchanged): "in maintenance" is in process (F13). Written into design-drawers-commons, design-admin and the
    logs of impl-manufacturing, impl-warehouse and impl-admin; design-manufacturing had it.
  - Demo (BossZMaintenanceDemoData.xml, as it names the demo users): the team Facilities maintenance (maint.tech and maint.tech2 as
    members) and eight work orders: the air handler's leak in progress with time, the compressor's oil service approved for next week,
    the van's service waiting for a supervisor, Room 201's bracket (facility work, unassigned), the overdue multimeter check, the
    compressor's belt complete and Room 102's light closed with time, and the motor's request adopted and held for parts.
- Specs:
  - Mantle `test/work/MaintenanceWorkOrders` (7 features, 1.9 s): a planner's corrective order approved on create, planned work held
    for a supervisor, the threshold and the policy; a retried create answering the first root, changed input, a stale write and
    another organization's work refused; Start refused to an unassigned technician, assignment and time in progress only; Complete
    refused with a running timer and writing the entered finish, Close a supervisor's; Cancel keeping time and files; hold and resume
    of approved work; adoption once, closed history, another work order's primary record and linked work.
  - Mantle `test/work/MaintenanceManagedWork` (3 features, 0.6 s): set#TaskStatus, update#Task, delete#WorkEffort and
    add#WorkEffortParty refused on a work order and its step, an ordinary task unchanged; CalDAV without the step and template, the
    work order read only, a PUT and a DELETE refused (403); get#RecordLinkInfo and Today. Adoption once is in MaintenanceWorkOrders.
  - BOSS `test/Maintenance/MaintenanceWorkOrders` (6 features, about 1.2 s): WorkOrderDetail's header and Time tab as the technician
    (their time, no team total), WorkOrders/Find as the planner and the saved finds; Commons' task check, check#TaskUpdate and
    complete#TodayItem `MANAGED_WORK`, Maintenance's Today item and the palette; Admin's offboarding under Maintenance and not
    Projects; Manufacturing's equipment read; the equipment's Maintenance tab, the facility's Work orders, History and Work policy
    (each rendered once). `MaintenanceAccess` gains the work order rule (planner and technician read, resource administrator, another
    technician and Retail refused) and the WorkEffort panel host, the P3 menu, key and Settings tab, and Home's new content (10
    features, 4.4 s).
  - Client `test/client/Maintenance/MaintenanceWorkOrdersWalk` (1 feature, 8.5 s), registered in `test/client/suite.js`.
  - Acceptance, written and not run: `acceptance/client/Maintenance/MaintenanceCorrectiveWalk` (5 features, registered in
    `acceptance/client/suite.js`).
- Tests run (release binary, `--nobuild`, this worktree): mr-mantle MaintenanceWorkOrders and MaintenanceManagedWork 10 of 10; with
  WorkProcess, PeopleChecklists, Dav, CommonsToday, ProductionOrders, WorkTimeEntries, WorkTimesheets, MaintenanceScope,
  MaintenanceResources, SupportWarranty, ProductionDowntime, WorkMyTasks and CalendarServices 97 features (one ProductionOrders failure,
  the flow permission, fixed and rerun with ProductionOrders 21 of 21), and last MaintenanceWorkOrders, MaintenanceManagedWork,
  MaintenanceScope, MaintenanceResources, WorkProcess and PeopleChecklists 26 of 26 (8.8 s). mr-boss Tasks, TodayPanel, QuickCreate,
  Schedules, TimeEntries, PeopleTime, WorkItems, WorkItemDetail, ProjectsAccess, ManufacturingWorkCenters, ManufacturingDowntime,
  ManufacturingWorkOrders, WarehouseFacilities, AdminLifecycle, AdminRegistries, AdminAccess, PeopleLifecycle, MaintenanceAccess,
  MaintenanceEquipment and MaintenanceWorkOrders: 174 features, one failure (WarehouseFacilities' "1 maintenance jobs open": the open
  count was the availability's, now apart), then WarehouseFacilities 26 of 26 and the three Maintenance specs 20 of 20. Client
  MaintenanceWorkOrdersWalk 1 of 1 (8.5 s feature time). `moqui lint --screens` (release binary): 136 flagged sites, as before P3,
  none in the new or changed screens. Prettier clean on the new and changed JavaScript (it also reformatted P2's Maintenance.js and
  Resources.js lines over 130; MaintenanceScope.spec.js, P1's, is still unformatted). Not run: ./moq test-apps, the acceptance suite.
- Inventories: ss-inventory's UpdateMaintenanceForm, the AssetMaintenance content forms, AddOtherMaintenance, MaintenanceListForm and
  EditRun's assignment forms name their Maintenance screens; usl-inventory's start#Timer, stop#Timer and store#TimeEntry rows, and an
  Added table for MaintenanceServices, MaintenanceSettingsServices and MaintenanceReportServices.
- Design edits: design-maintenance's header, §1.1 (the work order panel and record check), §1.2, §3 Home, WorkOrders, WorkOrderDetail and
  the record shape as built, §9 Settings, §13.2's time row, §13.3's CalDAV and notice rows; design-drawers-commons and design-admin's
  header lines.
- Findings, numbered by the lead F97 to F108 in order:
  - Manufacturing's WeApproved ↔ WeOnHold rows need `PRODUCTION_SUPERVISE`, and the framework admits a move only where some flow's
    row admits the user (F65), so a maintenance flow row with no permission let anyone hold an approved production run through raw
    `update#WorkEffort` (ProductionOrders' "seeded transitions carry their permission" failed). The maintenance rows need
    `MAINTENANCE_SUPERVISE`, so holding and resuming approved maintenance work is a supervisor's (a planner holds planned work and
    anyone assigned work in progress). The plan's "WeApproved ↔ WeOnHold as Manufacturing seeded them" could not be reused.
  - "A second primary AssetMaintenance refused": no path attaches a second record to a work order; the spec checks that adopting
    another work order's primary record answers that work order, and that a record linked to other work is `LINKED_WORK`.
  - "A direct edit of a managed AssetMaintenance is refused": there is no guarded AssetMaintenance writer to refuse in (entity-auto
    `update#AssetMaintenance` and Customer Service's `update#WarrantyWork`, whose records adoption refuses); the Maintenance groups
    have no grant on the raw path (§2). A guard on the entity would be a self-guarding EECA; left as is.
  - `WorkEffortPartyDocsUsers` is not conditioned: `sync#ProjectDocsSpaceUsers` does nothing for a work effort without a
    `WstDocsWikiSpace` setting, which no maintenance root has.
  - Manufacturing's demo downtime is Retail's, a planned changeover with no AssetMaintenance; the demo's adopted work order (the
    motor's) is data with the source "Production request".
  - The quick create's New work order shows for every Maintenance user (a quick-create item follows the screen's grant, and a DENY to
    the root group cannot be lifted by an ALLOW to the planner); NewWorkOrder tells a user who may not create work so, and Mantle
    refuses them.
  - Admin's identity operator lists a leaver's work orders (ADMIN_IDENTITY_VIEW) but moving them needs `MAINTENANCE_PLAN` or
    `_SUPERVISE` in the organization (schedule#MaintenanceWorkOrder) and custody `MAINTENANCE_RESOURCE_EDIT`; the operator holds
    neither, so the step fails with its reason for them (ADMIN and BOSS_MAINTENANCE_ADMIN move them).
  - Commons' `get#TaskAccess` now answers not found for managed work in Commons too (a production operation is read only there): a
    technician's link to a work order from Commons opens nothing; the palette and Today open WorkOrderDetail.
  - `create#WorkEffortContent` still checks only `check#WorkEffortOpen` (F59); files on a work order are RecordFiles' under the root's
    panel check, and accepted evidence is P7's.
  - Maintenance's Today lists due work orders only (a planned finish or start), as Manufacturing's source does; an in-progress work
    order with no dates is not in Today.
  - The approval threshold reads the root's estimate only; P6 adds the steps'.
- For the lead:
  - budget share: mr-mantle MaintenanceWorkOrders 1.9 s and MaintenanceManagedWork 0.6 s (2.5 s); mr-boss server MaintenanceWorkOrders
    about 1.2 s and MaintenanceAccess +0.3 s; mr-boss client MaintenanceWorkOrdersWalk 8.5 s, over the plan's 8 s client estimate for
    the whole build by 0.5 s (the user's agreement, or a cut: the walk's Record time is its slowest step); budgets not changed;
  - merge hot spots: mr-mantle `CommunicationServices.xml` (get#RecordLinkInfo), `CalendarDavServices.xml`, `WorkEffortServices.xml`
    (Today), `TaskServices.xml` (notify), `WorkProcesses.js`, `ProductionOrders.js`; mr-boss `screen/Maintenance.xml`, `Maintenance.js`
    (formatted whole), `Resources.js` (formatted whole), `data/BossSetupData.xml` (appended), `data/BossZMaintenanceDemoData.xml`,
    `screen/Shared/EquipmentDetail.xml` (tab indexes), `FacilityDetail.xml` (tabs), Commons' `TaskServices.xml`, `CommonsServices.xml`,
    `PaletteServices.xml`, Admin's `Lifecycle.js`, `test/Maintenance/MaintenanceSpecLib.js` (menus, keys, ids), `MaintenanceAccess.spec.js`,
    `test/client/suite.js`, `acceptance/client/suite.js`, the inventories and design-maintenance;
  - the user's calls: the client budget (above); whether the identity operator should move maintenance assignments (a permission for
    the participant's transfer); built meanwhile: listing only for the operator, moving for a Maintenance planner or administrator.

**Review Nov 12 (P3).** mr-mantle 3028a6f9, mr-boss b8b22800 and this note's commit (branch `mnt/p3`), over the worker's 0fcc36bd,
e1e085a3 and 3df7b504. Reviewed `git diff master...mnt/p3` in both repos against P3's text, §2, §4, F6–F13, F27–F29, F46–F49, F56,
F59, F63, F65, F66, F69, F82, F83 and F96, design §3 (the lifecycle table and record shape), §1.1 and §13.2–13.3, AGENTS.md and
Practices-App-Dev; read the generic paths the guard must cover (TaskServices, WorkEffortServices, CalendarDavServices, Commons'
task and Today services, PaletteServices, Projects' time entry, RecordFiles, Admin's Lifecycle.js, `search#Universal`) and the
framework's `check_status` (call.rs). The phase table row is back to "—" (the lead's). The worker's partial `target/debug` was
removed and `target/debug/moqui` linked to the main checkout's Debug binary for lint.
- Checked and found sound:
  - The managed-work refusal: People's `check#ManagedWork` in `update#Task`, `set#TaskStatus`, `set#TaskDates`, `move#Task`,
    `set#TaskRecurrence`, `create#Task` (a step under a work order), `delete#WorkEffort` and the WorkEffortParty writers turns on
    with the entity, by data. Commons: `get#TaskAccess` answers not found with `MANAGED_WORK`, so TaskDetail, clock in, Projects'
    `check#TimeItem` (timer, weekly time) and the bulk actions (each through `update#Task`/`set#TaskStatus`) refuse; Tasks' rows and
    `check#TaskUpdate` take no change; Today leaves managed work to Maintenance's source; the palette opens WorkOrderDetail only
    for a user Maintenance admits (`recordLink`). CalDAV leaves templates and steps out and answers 403 for a PUT or DELETE of a
    root before any change. Admin's Projects participant leaves managed work out (F56). Projects' work item import writes only into a
    project the user may update; its time import refuses a work order (no project root).
  - `create#WorkEffortContent` needs no guard: its only BOSS caller is RecordFiles, whose host check is `get#RecordLinkInfo`
    (now admitting a work order only as Maintenance does), and a file is retained evidence, not a status or assignment; guarding
    it would refuse the work order's own Files tab. The project-model writers (`set#TaskPlanItem`, `add#TaskDependency`, labels,
    ranks, `move#TaskSubtreeProject`) have no guard either; they are reached from Projects' screens over tasks `get#TaskAccess`
    admits, which a managed one is not (a finding below).
  - The lifecycle against design §3's table: approve (a supervisor; a planner for corrective work or within the hours threshold;
    no estimate is over it), start only from Approved and only by an assigned technician or a supervisor, hold with a reason
    and no running timer, resume to where it was, complete from In progress with no running timer, the outcome, the disposition
    for equipment and the entered finish written in the same `update#WorkEffort` (never later than now or before the start),
    close a supervisor's or the `MclOnComplete` policy's, cancel with a reason, started work a supervisor's, time and files kept.
    The AssetMaintenance follows (created/scheduled by the approved window, in process, completed through in process, cancelled,
    held keeps it). Every write names the revision it read; create's operation key answers the first root and refuses changed
    input (`OPERATION_KEY_CONFLICT`); `act#MaintenanceWorkOrders` runs each in its own transaction (`probe`).
  - The status flow: Manufacturing's `WorkEffortProduction` rows are unchanged. With the framework's any-flow rule (F65), the
    maintenance rows that repeat a Default row (approve, start, complete, cancel, close, the in-progress hold and resume) widen
    nothing; WeApproved ↔ WeOnHold need MAINTENANCE_SUPERVISE as the worker built; WeInPlanning ↔ WeOnHold, which no other flow
    had, were open to everyone (R2). Generic `set#TaskStatus` and CalDAV move along the record's own flow before the update.
  - Time (F66): `start#`/`stop#MaintenanceTimer` and `record#MaintenanceTime` admit only the caller's own time, assigned to the
    root or the step, on work in progress, never a template, then call the time services unchanged (one timer a person, the
    timesheet lock); the generic paths to a work order's time (Commons' clock in, Projects' timer and weekly time) refuse through
    `get#TaskAccess`. A technician's Time tab shows their own entries and hours, no team total (`totalHours` null without
    MAINTENANCE_VIEW); Home's TeamWork is for a broad reader only; a write permission alone opens no list (`workRead` first).
  - "In maintenance" (F13, F49): Mantle's `store#ProductionEquipment` guard, Manufacturing's `WorkCenters.js` and Warehouse's
    availability read an AssetMaintenance in process; Warehouse's open-job count is unchanged. Manufacturing's and Warehouse's
    own records otherwise behave as before (ProductionOrders, WarehouseFacilities, ManufacturingWorkCenters pass).
  - `get#RecordLinkInfo`'s rule (F69) is ahead of the staff rule, so an organization role or an entity grant alone opens no work
    order or step in Commons, Chatter or files; a party of the work, a maintenance reader of its organization or its technician do.
- Fixes:
  - **R1 (high, confidentiality; F69).** `search#Universal` limits MantleTask by owner organization and parties only, and a work
    order is owned by its service organization: anyone of the organization with a task view found a work order and opened its
    title and status from search. `MaintenanceAccess.js` gains `workHidden` (the F69 rule, now shared by `get#RecordLinkInfo`), and
    search drops a hidden hit. MaintenanceManagedWork's new feature: the organization's member finds neither the work order nor its
    step, the planner the work order, the technician both; it fails without the change.
  - **R2 (medium, access; F65).** The maintenance flow's WeInPlanning → WeOnHold and WeOnHold → WeInPlanning had no permission and
    no other flow has them, so any user could hold any work effort in planning (a production run, a project task) through a raw
    `update#WorkEffort` (the `/mantle` REST path among them). They need MAINTENANCE_PLAN, and a second flow
    `WorkEffortMaintenanceSupervise` carries the same moves for MAINTENANCE_SUPERVISE (one permission a row; no record names it).
    MaintenanceManagedWork: a member's raw hold of an ordinary task is refused (fails without); MaintenanceWorkOrders: a planner
    and a supervisor each hold and resume planned work.
  - **R3 (low, correctness).** History read the audit log of WorkEffort's priority and estimate, which WorkEffort does not audit,
    so a priority or estimate change never showed, nor a facility work order's change of room. `store#MaintenanceWorkOrder`
    writes the audit rows for priority, estimated hours and facility with the user (as `set#TaskSprint` writes its own), and
    History names the facility. MaintenanceWorkOrders: the planner's priority change shows with its author; fails without.
  - **R4 (low, correctness).** The Unassigned filter read the first 5000 current Assignee rows of every work effort in the system
    (Projects' tasks among them) as a `not-in` list, so past that many any work order could list as unassigned. It now reads the
    assignee rows (not declined or unassigned) of the filter's own work orders, up to Home's limit. No spec (the cap needs 5000
    rows); the saved find's case passes.
  - **R5 (the user's call, Nov 12; owner contract with Admin).** Offboarding stays with Maintenance's staff, no new permission:
    `find#Assignments` marks a kind transferable only for a caller who may move it (MAINTENANCE_PLAN or _SUPERVISE for work
    orders, MAINTENANCE_RESOURCE_EDIT for custody) and otherwise names who moves it ("Open work orders (2), moved in Maintenance by
    a Maintenance planner or supervisor"), so an identity operator sees the items, gets no transfer step and nothing fails for
    them. MaintenanceWorkOrders: the identity operator's listing (fails without). design-maintenance §13's leavers row.
  - **R6 (the user's call, Nov 12; tests).** The client estimate is 9 s. The walk opens the Time tab in the page instead of a
    reload: 8.45 s → 8.16 s, the golden path whole (create, assign, start, log time, complete, close).
  - Design: §1.1 (search), §3's as-built flow rows, §13's leavers row.
- Findings, numbered by the lead F109 to F115 in order:
  - Commons' `get#TaskAccess` answers not found for managed work, so a technician's own work order in Commons' or Projects' task
    lists opens only a "open it in Maintenance" message; the palette and Today open WorkOrderDetail (as the worker noted).
  - The project-model task writers (plan items, dependencies, labels, ranks, `move#TaskSubtreeProject`, `clone#WorkEffort`, the
    task comments and time of `add#TaskTime`) have no managed-work guard; their screens reach only tasks `get#TaskAccess` admits.
    `clone#WorkEffort` is also on the `/mantle` REST path; P6 (steps) should decide whether the guard belongs there.
  - Projects' time import (`import#TimeEntryCsv`) admits an item whose root is a visible project or, for an every-project reader,
    any root: a work order's step (P6) would then take imported time outside F66's check. P6 should refuse a managed item there.
  - The operation key's index is not unique: two concurrent creates under one key can both make a root (the retry is safe).
  - Admin's Maintenance participant counts root assignments only; a step's assignee (P6/P7) is in neither participant until then.
  - With R2, holders of MAINTENANCE_PLAN (planned ↔ held) and MAINTENANCE_SUPERVISE (also approved ↔ held) can still make those
    moves on other work through a raw update, where they have that path; no BOSS group of theirs has it (§2).
  - `assignedTo` (MaintenanceAccess) counts any current WorkEffortParty row, declined or unassigned ones too; the lists' and
    schedule's read leaves those out. Harmless while only schedule writes the rows.
- Tests (release binary, `--nobuild`, this worktree): mr-mantle MaintenanceWorkOrders and MaintenanceManagedWork 11 of 11 (3.0 s
  feature time, +0.5 s), then with RecordVisibility, UniversalSearch, ProductionOrders, WorkProcess, PeopleChecklists, Dav,
  MaintenanceScope and MaintenanceResources 64 of 64 (17.1 s); mr-boss MaintenanceWorkOrders, MaintenanceAccess, AdminLifecycle,
  MaintenanceEquipment, Tasks and TodayPanel 49 of 49, MaintenanceWorkOrders 6 of 6 (about 1.3 s) after R5; client
  MaintenanceWorkOrdersWalk 1 of 1 (8.16 s feature time; 8.45 s before R6). Each new case was run against the code without its
  fix and failed (R1, R2, R3, R5). `./moq run --debug --nobuild lint --screens` (the Debug binary): 136 flagged sites, as before P3; the review changed no screen. Prettier clean on the changed JavaScript. Not run: ./moq test-apps, the acceptance
  suite.
- For the lead: `./moq run lint --screens --nobuild` (moq's options after the subcommand) ignores `--nobuild` and builds the release
  binary: it is what left the worker's partial build, and here it finished one and replaced WT's `target/release/moqui` symlink,
  which is restored to the main checkout's (mr-moqui is unchanged on `mnt/p3`; every spec above ran before it). moq's options go
  first: `./moq run --debug --nobuild lint --screens`.
- Budget share mr-mantle +0.5 s (3.0 s for the two specs), mr-boss server unchanged in effect, mr-boss client
  8.2 s under the user's 9 s; merge hot spots as the Built note's plus mr-mantle `MaintenanceAccess.js` (workHidden),
  `UniversalSearchServices.xml`, `CommunicationServices.xml` (the rule now a call), `MaintenanceWorkData.xml` (the second flow),
  mr-boss `WorkOrders.js` (findAssignments) and design-maintenance §1.1, §3, §13; both user's calls of P3 decided (Nov 12) and
  built as R5 and R6; no user's call left open.

### P4 — Requests and intake

Design §3 Requests and the RequestDetail mount row, §1.2 (quick create, `create-from`), §1.4 Mail intake; MT-02
(intake), MT-10 (the production handoff), MT-15.

- **Mantle `MaintenanceServices`:** `report#MaintenanceProblem` over `RequestServices.create#Request` (exactly one
  Asset or Facility target as a RequestRecord, the reporter the authenticated party, an operation key),
  `find#MaintenanceRequests` (own requests for `MAINTENANCE_REQUEST_VIEW_OWN`, the organization's for a planner),
  `triage#MaintenanceRequest` (create or link work, or reject with a reason; several reports to one order; a
  retry creates nothing more) and `create#MaintenanceRequestFromEmail` on the pattern of
  `create#RequestFromEmail` (RequestServices.xml:946), with the `EmailRuleAction` `ErActCreateMaintenanceRequest`
  beside the two seeded (F39). The one-target rule is also checked in `link#RequestRecord` for an `RqtMaintenance`
  request.
- **The production handoff** (design §13.2; owner contract with Manufacturing): `request#ProductionMaintenance`
  keeps creating its AssetMaintenance and Request (ProductionServices.xml:1218) and then, when the organization's
  MaintenancePolicy manages work, ensures the linked root through `adopt#MaintenanceRecord`; a retry makes no second
  root. Its unlinked open records show in Requests' adoption queue. With the policy off it does what it does today,
  and Manufacturing's ProductionDowntime spec passes unchanged.
- **Request rules** (design §13.3): `complete#RequestFromWork` moves nothing for a maintenance root, which is no
  project's item (F27), and the spec keeps that; `RequestTriageNotice` routes an `RqtMaintenance` request to the
  maintenance planners with the target's name only.
- **RequestDetail's Maintenance context** (crosscut §3.11): a branch beside Manufacturing's (RequestDetail.xml:304-
  351) read by `ironstone.maintenance.RequestServices.get#RequestContext`: the reported fault, the linked work order,
  Triage, Assign and Comment for a planner (closing impl-manufacturing F98). A requester has no Maintenance root:
  they follow a report in Commons' RequestDetail, which shows the reporter's safe summary (its state and the linked
  work order's name and status) from `find#MaintenanceRequests`, an owner contract with Commons.
- **Commons** (owner contract): "Report a problem" in quick create for a holder of `MAINTENANCE_REQUEST`, with no
  Maintenance launcher, at a screen behind its own artifact group as Manufacturing's ReportDowntime is; the
  `create-from` provider that prefills it from a chat message, a voicemail or a mail; a scanned asset tag opening it
  with the asset filled in for a requester.
- **Screens:** Requests (FindRequests, RequestRows, ReportProblem, Triage, the adoption queue).
- **Specs:** Mantle `test/work/MaintenanceIntake` (a requester reads only their own; two targets refused; triage
  twice links one order; a rejected report keeps its reason; a mail to the team's plus-tag address makes one
  request with the sender as reporter and an unknown asset left for triage; `request#ProductionMaintenance` twice
  makes one root); BOSS `MaintenanceRequests` (RequestDetail's one qvt render under Maintenance: no cost and no
  other report for the requester).
- **Usable when** (`acceptance/Maintenance/MaintenanceIntakeWalk`; design §11.2 "Request and customer repair", its
  request half): `maint.requester` reports a leaking compressor from Commons with a photo and follows it; a second
  person's report of the same fault is linked to the same order at triage; an operator's equipment-fault stop in
  Manufacturing appears in Requests and is adopted into one work order; the requester never sees the order's time.

**Built Nov 12 (P4).** mr-mantle c5d4fd0d, mr-boss 8cbed205 (branch `mnt/p4`); mr-moqui unchanged, no Rust built.
- Checked first (the code over the plan): F25 (RequestDetail's app branches, Manufacturing's context, Commons' comment and task rules:
  `comment#Request` admits whoever sees the request, and an organization's OrgInternal party makes it visible to its members), F27
  (`complete#RequestFromWork` moves nothing for a root with no project; kept, with a spec), F39 (`create#RequestFromEmail`,
  `findOrCreate#EmailSender`, `file#RequestEmail`, `find#EmailRequest` reused as they are), F78 (`MaintenanceAccess.scope()` gives a
  requester no organization; `ironstone.maintenance` is the root group's only), F104/F109 (Commons answers not found for a work
  order), `request#ProductionMaintenance` and `ProductionDowntime.js requestMaintenance` (the request's OrgInternal party and its
  links to the stop, the equipment, the AssetMaintenance and the work), `notify#RequestTriage`, `link#RequestRecord`, Manufacturing's
  ReportDowntime grant pattern, the shell's quick create (gathered from the roots a user opens, shown by the screen's grant),
  `scan-input`, the Comms `create-from` hook and `ext-action`s, and P3's `adopt#MaintenanceRecord`.
- Mantle:
  - No record of its own: a maintenance request is a Request of type RqtMaintenance (Manufacturing's), its organization an
    OrgInternal RequestParty (as Manufacturing's are), its reporter the filer and Reporter, its one target a RequestRecord, its team
    an OrgTeam RequestParty (mail), its work order a RequestWorkEffort. The view `MaintenanceRequestDetail` (entity
    `MaintenanceIntakeEntities.xml`: the request with its OrgInternal party) scopes the list in the query. Seed
    (`MaintenanceIntakeData.xml`): `ErActCreateMaintenanceRequest` beside the two rule actions (F39) and the PartySettingType
    `MntIntakePlusTag`, a team's intake plus tag.
  - `MaintenanceServices` over `MaintenanceIntake.js` (new module, appended to the services file): `report#MaintenanceProblem`
    (MAINTENANCE_REQUEST; one target of the reporter's own organizations, `ONE_TARGET`, `TARGET_REQUIRED`, `RECORD_UNAVAILABLE`; the
    reporter the user; the observed time written into the description; a photo as RequestContent; an operation key through
    PostingOperation), `find#MaintenanceReportTargets` and `resolve#MaintenanceReportScan` (Commons' drop-down and asset tag scan),
    `find#MaintenanceRequests` (a planner's or supervisor's organizations, or with MAINTENANCE_REQUEST_VIEW_OWN alone the requests
    the user filed: state with the rejection's reason, target, the work order's name and status, the reporter's name for a planner
    only), `triage#MaintenanceRequest` (create: corrective, source Reported problem, the request's target or one given and
    recorded, adopting the request's open AssetMaintenance when Manufacturing made one; link: an open work order of the same
    organization; reject: a request resolution and a comment, cancelled; assign: the request's Assignee; once: create again answers
    the work order, another decision `REQUEST_TRIAGED`, a closed request `REQUEST_CLOSED`), `find#UnmanagedMaintenance` (the
    adoption queue: open AssetMaintenance with no work of the organizations, not a warranty repair, each with its request) and
    `create#MaintenanceRequestFromEmail` (the team by the rule's value or a `+tag` address, only for a rule owner who works for its
    organization; the sender the reporter; the message and its files on the request; a target only when the subject names one
    equipment id of the organization; a reply joins its request; no team, an ordinary request).
  - `MaintenanceAccess.requesterOrganizations` (F78): a request holder's own organizations, which a Maintenance read does not need.
  - Owner contracts: `link#RequestRecord` refuses a second Asset or Facility on an RqtMaintenance request (`ONE_TARGET`);
    `request#ProductionMaintenance` adopts its AssetMaintenance under the policy's `productionRequestsManaged` (MaintenanceWork.js
    `adoptForOwner`: a planner's scope of that organization alone, after Manufacturing's own checks; a failure is logged, not the
    stop's) and links its request; `notify#RequestTriage` sends an RqtMaintenance request to the organization's MAINTENANCE_PLAN
    holders, titled "Problem reported on" its target, and never to Projects' triage.
- BOSS:
  - Services: `ironstone.maintenance.RequestServices` find#RequestRows and get#RequestContext (Requests.js); Maintenance.js's
    `request` record kind (a planner's or supervisor's of its organization), the choices `openWorkOrders` and `rejectReasons`, the
    links Requests/Find and Requests/RequestDetail.
  - Screens: the root (Requests for a planner or supervisor, `g r`, the request panel host); Requests (Find with the adoption
    queue's Make a work order; RequestDetail, the shared screen) and `template/MaintenanceRequestParts.xml` (triageRequest; the
    Maintenance box with Create work order, Add to a work order, Assign and Reject; the reporter's summary).
  - Owner contracts with Commons: `Commons/ReportProblem`, quick create `maintenanceReportProblem` in Commons' providers, behind
    `BOSS_MNT_REPORT_PROBLEM` (denied to BOSS_USERS, always for the requesters and the Maintenance administrator), calling Mantle
    only; Commons' RequestDetail shows a maintenance request's reporter its Maintenance box and lists a work order among its tasks
    only for a user `workHidden` admits; the `RequestTriage` link opens Maintenance's RequestDetail for a maintenance request.
    Written into design-drawers-commons; Manufacturing's in design-manufacturing and impl-manufacturing's log.
  - Demo (BossZMaintenanceDemoData.xml): maint.requester's air handler report triaged into its work order with maint.reader's report
    of the same fault, the compressor's oil leak untriaged, and the team's plus tag `facilities`.
- Specs:
  - Mantle `test/work/MaintenanceIntake` (7 features, 1.6 s): a requester reports with one target and reads only their own, a
    safe summary; two targets refused in the report and in link#RequestRecord; triage creates one order, twice links one, a second
    report joins it, another organization and a requester refused; a rejected report keeps its reason; a mail to the team's plus tag
    makes one request with the sender as reporter and no target, a named equipment id its target; `request#ProductionMaintenance`
    twice makes one root under the policy, its request linked and out of the queue; the triage notice to the planners only, and a
    work order's completion moving no request (F27).
  - BOSS `test/Maintenance/MaintenanceRequests` (4 features, 0.6 s): Requests/Find's one qvt render (the planner's requests, work
    orders and reporters; Retail's none); RequestDetail's one qvt render under Maintenance (the Maintenance box and triage dialogs;
    Retail refused); Commons' RequestDetail rendered once for the reporter (the summary; no time, technician or other report); Report
    a problem in the requester's + menu and not the planner's, its one qvt render and a report through its transition.
    `MaintenanceAccess` gains the request rule (planner reads, technician and Retail refused, the request panel, Report a problem the
    requester's and not the planner's; +0.4 s) and the P4 menu and key (MaintenanceSpecLib).
  - Acceptance, written and not run: `acceptance/Maintenance/MaintenanceIntakeWalk` (4 features).
- Tests run (release binary, `--nobuild`, this worktree): mr-mantle MaintenanceIntake 7 of 7; with ProductionDowntime, RecordLinks,
  WorkProjectRequests, SupportChannels, SupportRelations, MaintenanceWorkOrders, MaintenanceManagedWork and MaintenanceScope 75 of 75
  (14.2 s); after Prettier MaintenanceIntake, ProductionDowntime and MaintenanceWorkOrders 21 of 21. mr-boss Requests, QuickCreate,
  Notifications, ProjectRequests, PurchasingRequests, ManufacturingDowntime, CustomerServiceChannels, CustomerServiceWarranty,
  MaintenanceWorkOrders, MaintenanceEquipment, MaintenanceRequests, ProjectsAccess and TodayPanel 103 of 103 (16.1 s);
  MaintenanceRequests and MaintenanceAccess 14 of 15: MaintenanceAccess's "Admin's registries" fails with or without P4 (it fails
  with master's BossSetupData too; see For the lead). Client MaintenanceWorkOrdersWalk 1 of 1 (8.12 s). `./moq run --debug --nobuild
  lint --screens`: 136 flagged sites, as before P4, none in the new or changed screens; the symlinked binaries unchanged. Prettier
  clean on the new and changed JavaScript (MaintenanceWork.js only in P4's lines). Not run: ./moq test-apps, the acceptance suite.
- Inventories: usl-inventory's create#Request and link#RequestRecord rows and an Added table for P4's MaintenanceServices; ss-inventory's
  EditRequest and FindRequest forms that name Maintenance/Requests.
- Design edits: design-maintenance's header, §1.1, §1.2, §3 Requests and the RequestDetail mount row, §13.2's production handoff,
  §13.3's RequestTriageNotice and complete#RequestFromWork rows; design-drawers-commons' and design-manufacturing's header lines.
- Findings, numbered by the lead F134 to F141 in order:
  - Report a problem is Commons' screen (`Commons/ReportProblem`), not under Maintenance: a quick create needs a root the requester
    opens, and a requester opens Commons only; Requests links to it.
  - The `create-from` provider of design §1.4 (a chat message, a voicemail or a mail prefilling Report a problem) is not built: the
    Comms hook creates a record and answers its url, and the prefill path is a Comms `ext-action` with a `screen` target, which would
    read the message's text under the Comms read check; left as a seam (ReportProblem takes summary and description values).
  - The asset tag's QR (P2) holds EquipmentDetail's link under Maintenance, which a requester cannot open; a requester scans the tag
    into Report a problem's scan input instead. A tag link to Report a problem would need a print change in AssetTags.
  - A maintenance request is visible in Commons to its organization's members by its id (the OrgInternal party, as Manufacturing's
    requests already are), though Commons lists only one's own; Requests is the planners'.
  - The request has no observed-time field; report#MaintenanceProblem writes "Observed <time>" into the description.
  - Design §13.3's "completion notifies the responsible requester" is not built: a work order's completion moves no request and
    tells no one; the reporter sees the work order's status in Commons.
  - Triage's operation key and report's use PostingOperation (EntityLib.operation, 40 characters, the user's); the create of a
    production handoff is retried by Manufacturing's own key.
  - The Requests screen opens for any Maintenance user (its menu item is a planner's or supervisor's, as Work orders' is a work
    reader's); Mantle lists nothing to another user.
- For the lead:
  - budget share: mr-mantle MaintenanceIntake 1.6 s; mr-boss server MaintenanceRequests 0.6 s and MaintenanceAccess +0.4 s; client
    unchanged; budgets not changed.
  - merge hot spots: mr-mantle `MaintenanceServices.xml` (appended), `MaintenanceWork.js` (adoptRecord split into `adoptWith`,
    `adoptForOwner` before `operations`, the export), `MaintenanceAccess.js` (requesterOrganizations), `RequestServices.xml`
    (link#RequestRecord, notify#RequestTriage), `ProductionServices.xml` (request#ProductionMaintenance); mr-boss
    `screen/Maintenance.xml` (Requests item, `g r`, the panel host), `Maintenance.js` (request kind, choices, links),
    `data/BossSetupData.xml` (the RequestTriage link at :524 and the appended BOSS_MNT_REPORT_PROBLEM group),
    `BossZMaintenanceDemoData.xml` (appended), `screen/Shared/RequestDetail.xml`, `screen/Commons.xml`, Commons'
    `RequestServices.xml`, `test/Maintenance/MaintenanceSpecLib.js` (ids, menus, keys), `MaintenanceAccess.spec.js`, the
    inventories and design-maintenance.
  - Pre-existing, not P4's: MaintenanceAccess's "Admin's registries" feature fails on this branch with master's BossSetupData as well
    ("the administrator has no maintenance.settings": it asks `ironstone.admin.RegistryServices.find#Settings`, which Admin Screens
    Down replaced by the framework's `moqui.server.SettingsEntry`, F116); the acceptance MaintenanceFoundationWalk expects
    `staffMenu` for every Maintenance group, which now has Requests that only planners and supervisors see (not run, not changed).
  - the user's calls: none needed; the create-from seam above is for the lead to schedule (P19's Comms work, or here).

**Review Nov 12 (P4).** mr-mantle b60c08db, mr-boss caf6cc77 and this note's commit (branch `mnt/p4`), over the worker's c5d4fd0d,
8cbed205 and 360e0432. Reviewed `git diff master...mnt/p4` in both repos against P4's text, §2, §4, F25, F27, F39, F69, F78, F104,
F109, design §1.1, §1.2, §3 Requests and the RequestDetail mount row, §13.2–13.3, AGENTS.md and Practices-App-Dev; read the paths a
request is reached by outside Maintenance (Commons' `get#RequestAccess`, `get#RequestDetail`, `link#`/`unlink#RequestRecord`,
Mantle's `get#RecordLinkInfo` request rule, `search#Universal`'s MantleRequest filter, Chatter and RecordFiles), the mail path
(`findOrCreate#EmailSender`, `find#EmailRequest`, `create#RequestFromEmail`), Manufacturing's request context (Downtime.js) and the
Comms `create-from` hook (Chat's `createFrom`, `ChatServices.create#FromChat`). mr-moqui unchanged, no Rust built.
- Checked and found sound:
  - The requester's own reads: `find#MaintenanceRequests` with MAINTENANCE_REQUEST_VIEW_OWN alone lists the requests the user filed
    (the condition in the query), each a safe row (state with the rejection's reason, target, the work order's name and status, no
    reporter name, no cost or time); Commons' RequestDetail lists a maintenance work order among the tasks only for one `workHidden`
    admits, so the reporter sees neither the order's time nor its technician; Commons' own Requests list is the user's slice
    (raised, assigned, watching), never the organization's; the palette and search reach a request through `search#Universal` (now
    with R1's rule); the triage notice goes to planners only.
  - The one-target rule: `report#MaintenanceProblem` refuses both (`ONE_TARGET`) and none (`TARGET_REQUIRED`) before any write, and
    a target outside the reporter's organizations as a missing one; `link#RequestRecord` (Mantle's, and Commons' which calls it)
    refuses a second Asset or Facility on an RqtMaintenance request after its visibility check, relinking the same one is a no-op;
    triage's create refuses a target other than the recorded one and records one for a request that has none.
  - Triage: the operation key answers a retry with the first answer; without one, create on a linked request answers its order
    (`repeated`), link to the same order is a no-op, another decision `REQUEST_TRIAGED`, a closed request `REQUEST_CLOSED`; a second
    report links to the same open order of the same organization (`WORK_CLOSED`, `ORGANIZATION_MISMATCH` otherwise); a request with
    Manufacturing's open AssetMaintenance adopts it (one root, `adopt#MaintenanceRecord`'s own once rule); the requester and another
    organization's planner are refused.
  - Mail intake: the sender becomes the filer and Reporter (`findOrCreate#EmailSender`: an existing party with the address, else a
    new Customer person), the team only by the rule's value or a plus tag of a team whose organization the rule's owner works for, the
    target only when the subject names exactly one equipment id of that organization, else none (left for triage); a reply joins its
    thread's request as Projects' intake does. A spoofed sender gains nothing: no confirmation is sent, nothing is readable by the
    sender address, and a spoofed internal address only files the request as that person (as `create#RequestFromEmail` already
    does); a spoofed To/Cc plus tag selects among the rule owner's organizations' teams only.
  - `request#ProductionMaintenance`: with no policy row, or `productionRequestsManaged` N, `productionHandoff` returns the result
    untouched (ProductionDowntime passes unchanged); with it on, a retry under the operation key answers the first result with its
    `workEffortId` (Manufacturing's `posting.previous`), and `adopt#MaintenanceRecord`'s once rule holds without one.
  - `notify#RequestTriage`: an RqtMaintenance request goes to the users holding MAINTENANCE_PLAN through a current group membership
    who are employees or agents of its organization, never the changer, titled by its target only, and never to Projects' triage;
    its link opens Maintenance's RequestDetail.
  - Report a problem (`BOSS_MNT_REPORT_PROBLEM`): denied to BOSS_USERS, ALWAYS for BOSS_MAINTENANCE_REQUEST and
    BOSS_MAINTENANCE_ADMIN, and ADMIN through its ALWAYS on Commons' root; Mantle checks MAINTENANCE_REQUEST again, so a Commons
    administrator who sees the + item is refused at the service. A planner, technician or supervisor holds no MAINTENANCE_REQUEST
    (design §1.1's table), so they do not have it (a finding below).
- Fixes:
  - **R1 (high, confidentiality; design §3 "States", §1.1).** A maintenance report was visible by its id to every member of its
    organization: `get#RecordLinkInfo` admits a request whose RequestParty is one of the user's organizations (the OrgInternal row) or
    whose facility they own, and `search#Universal` matches MantleRequest by `parties.partyId` and the facility owner. So a colleague
    (another requester, a technician, any BOSS user of the organization) opened a requester's report in Commons' RequestDetail with
    its description, reporter, photo and comments, and found it in search. Mantle's `MaintenanceAccess.requestHidden` now decides a
    reported problem (an RqtMaintenance request with no AssetMaintenance of Manufacturing's linked): its filer, a party of it in
    person (Reporter, Assignee, Watcher), a maintenance planner, supervisor or reader of its organization, or one Maintenance admits to
    its work order (`workHidden`); `get#RecordLinkInfo` (ahead of the staff rule, as F69's) and `search#Universal` apply it. Manufacturing's
    production request keeps its owner's rule (its plant's users reach it as before). MaintenanceIntake: a colleague requester and an
    operator of the organization are hidden from the report, its reporter, a reader and the planner are not, another organization's
    planner is, and the production request stays the operator's; MaintenanceAccess: the requester and planner see the demo's untriaged
    report through Commons' files panel, the technician of its organization does not (fails without the change).
  - **R2 (medium, access; the lead's item).** Requests opened for any Maintenance user; only its menu item was the planner's and
    supervisor's. It is now its own artifact group `BOSS_MNT_REQUESTS` (denied to BOSS_MAINTENANCE, ALWAYS for BOSS_MAINTENANCE_PLAN
    and _SUPERVISE, as Manufacturing's areas), so RequestDetail under Maintenance is the planners' too; Mantle answered nothing to
    another user already. MaintenanceAccess: the technician and the reader are refused the screen (the planner's render is
    MaintenanceRequests').
  - **R3 (low, tests; the lead's item).** MaintenanceAccess's "Admin's registries" asked the removed
    `ironstone.admin.RegistryServices.find#Settings`; it asks `org.moqui.admin.ReadinessServices.find#Settings` and passes (P5 has
    the same one-line change).
  - **R4 (low, tests; the lead's item).** The acceptance MaintenanceFoundationWalk expected `staffMenu` for every group; it now expects
    each group's own menu (Requests for the planner, supervisor and Retail's planner; Home alone for the procedure author, approver
    and booking approver; Equipment and Facilities for the resource administrator). Not run.
  - Design: design-maintenance §3's as-built (R1, R2); design-drawers-commons' P4 line (R1).
- Findings, numbered by the lead F142 to F149 in order:
  - The `create-from` seam stays unbuilt: design §1.4 says a chat message or voicemail *prefills* Report a problem, while the hook
    (`create#From`) makes a record and answers its link; a prefill needs a Comms `ext-action` with a screen target that reads the
    message under Chat's room check (and the voicemail slot), and making the request directly needs an organization and a target the
    message does not carry. Not small: schedule it with P19's Comms work (see the call below).
  - A reporter can take their report off its work order or its target through Commons' `unlink#RequestRecord` (Mantle's unlink checks
    no visibility of the record; the reporter is the request's party): the request then looks untriaged. Nothing leaks; triage's
    traceability does. A guard (a managed work order or the target of an RqtMaintenance request unlinked only by its triager) would
    sit in Mantle's unlink.
  - The capability bundles carry no area grants: a custom group given the planner bundle in Admin opens Requests (it is not in
    BOSS_MAINTENANCE), but one given the requester bundle has no Report a problem; Manufacturing's areas are the same.
  - `productionHandoff` catches the adoption's failure and logs it, relying on its refusals coming before any write; a failure after
    a write (in `makeOrder`) would leave that write in the stop's transaction, and whether the framework marks it rollback-only on a
    nested service error was not checked. No spec makes the adoption fail.
  - The triage notice reaches ADMIN members who work for the organization (ADMIN holds MAINTENANCE_PLAN), and it is sent for a
    production request the policy adopts at once (not checked whether the notice reads the request before or after the handoff).
  - `find#MaintenanceRequests`' "untriaged" drops linked rows after paging, so its count can exceed the page; harmless while triage
    moves a linked request to Reviewed.
  - BossSetupMaintenanceData.xml (F118) is master's since this branch: P4's two artifact groups (`BOSS_MNT_REPORT_PROBLEM`,
    `BOSS_MNT_REQUESTS`) are together at the end of BossSetupData.xml and move there at the merge.
  - MaintenanceFoundationWalk's "the others are refused" holds for Requests and Settings by their artifact groups; for a Home-only
    user's Work orders or Equipment it relies on the screens' services refusing (not run).
- Tests (release binary, `--nobuild`, this worktree): mr-mantle MaintenanceIntake 8 of 8 (about 2.1 s feature time, +0.3 s), with
  ProductionDowntime, RecordLinks, MaintenanceManagedWork, MaintenanceScope, WorkProjectRequests and UniversalSearch 61 of 61 (14.6 s);
  mr-boss MaintenanceRequests, MaintenanceAccess, ManufacturingDowntime, MaintenanceWorkOrders, MaintenanceEquipment, Requests,
  ProjectRequests, Notifications and QuickCreate 87 of 87 (21.1 s; MaintenanceAccess 11 of 11, the registries feature passing).
  R1's MaintenanceAccess case failed with the `get#RecordLinkInfo` call removed. `./moq run --debug --nobuild lint --screens`: 136
  flagged sites, as before, none in P4's screens; the symlinked binaries unchanged. Prettier clean on the changed JavaScript. Not
  run: ./moq test-apps, the acceptance suite.
- For the lead:
  - Budget share: mr-mantle +0.3 s (MaintenanceIntake), mr-boss server +0.2 s (MaintenanceAccess); client unchanged.
  - Merge hot spots, beyond the Built note's: mr-mantle `CommunicationServices.xml` (the request rule beside F69's work rule),
    `UniversalSearchServices.xml` (beside the work filter), `MaintenanceAccess.js` (requestHidden at the end); mr-boss
    `data/BossSetupData.xml`'s end (the two P4 groups, to move into BossSetupMaintenanceData.xml, F118),
    `MaintenanceAccess.spec.js` (P5 changes the registries line too), the acceptance MaintenanceFoundationWalk.
  - The user's calls, decided Nov 12 (the lead's message):
    - `create-from`: a Comms screen-target action prefills Report a problem; P19 builds it. Nothing built here.
    - The assignee: the reporter sees the assignee's name, as built; design §3 says so.
    - Report a problem: every Maintenance group (reader, planner, technician, supervisor, procedure author and approver, booking
      approver, resource administrator, cost reader) holds MAINTENANCE_REQUEST and `BOSS_MNT_REPORT_PROBLEM` (an ALWAYS each), and
      every Maintenance bundle carries the permission and the screen (CapabilityBundleArtifact), the requester's and the
      administrator's too, so a group given a bundle in Admin has it (closing the finding above for this screen).
      MAINTENANCE_REQUEST_VIEW_OWN stays the requester's: another group's reporter opens their report in Commons as its filer but
      sees the Maintenance box only as a planner or supervisor (extended below). MaintenanceAccess: each group's
      capabilities include `request`, every group's user has Report a problem in the + menu, another app's user has neither the
      item nor the screen; MaintenanceRequests no longer expects the planner without it. Design §3.
    - Then (the lead, Nov 12): MAINTENANCE_REQUEST_VIEW_OWN to every group with MAINTENANCE_REQUEST and in their bundles, so a reporter follows their own report; MaintenanceAccess: the technician reports and finds their own report, not the requester's (MaintenanceAccess and MaintenanceRequests 16 of 16).
- Merged master into `mnt/p4` (Nov 12, both repos; P5 and F118 among it). mr-mantle merged cleanly. mr-boss: P4's two artifact groups
  (`BOSS_MNT_REPORT_PROBLEM`, `BOSS_MNT_REQUESTS`) moved from the end of BossSetupData.xml into BossSetupMaintenanceData.xml (the
  bundle artifacts after them, so the group exists first); `Maintenance.js` linkPaths, MaintenanceSpecLib's ids, the demo data,
  design-maintenance's header and §1.2, impl-manufacturing's log and usl-inventory kept both phases' lines; MaintenanceAccess's
  registries line was the same fix on both sides.
- Tests after the merge and the calls (the main checkout's release binary of Nov 12 03:11, `--nobuild`): mr-mantle MaintenanceIntake,
  ProductionDowntime, RecordLinks, UniversalSearch, MaintenanceOutages, MaintenanceWorkOrders, MaintenanceManagedWork and
  MaintenanceScope 60 of 60 (10.6 s); mr-boss MaintenanceRequests, MaintenanceAccess, MaintenanceDowntime, MaintenanceWorkOrders,
  MaintenanceEquipment, ManufacturingDowntime and Requests 43 of 43 (10.0 s). Prettier clean on the changed specs. Not run:
  ./moq test-apps, the acceptance suite.

### P5 — Downtime and restoration

Design §6 Downtime, §3 WorkDowntime and the completion disposition, §7.1's unavailability paragraphs; MT-07 (the
outage part), MT-10.

- **Mantle records.** `ResourceUnavailability` extended from Manufacturing's minimal record (F14): a reason
  enumeration with its planned or unplanned classification, the source work order and step, the correction chain
  (superseded and superseding row), a revision, the ending actor and disposition; fields audit-logged. No second
  outage record.
- **Mantle `mantle.work.ResourceBookingServices`:** `record#ResourceUnavailability` gains Maintenance's entry
  point (`MAINTENANCE_EXECUTE` on assigned work, `MAINTENANCE_SUPERVISE` or `MAINTENANCE_RESOURCE_EDIT`), a
  facility resource and the work link, keeping the internal call Manufacturing makes; `find#`,
  `correct#` (supersession with a reason) and `end#ResourceUnavailability` (the only restoration: a supervisor or
  resource administrator, after the readiness checks, with the disposition). A real fault is recorded although
  bookings exist; they are kept and listed for their owners (the notices are P16's).
- **The work order** (design §3): Start with offline intent records or links the outage; Complete asks for the
  resource disposition and may leave the resource down with a follow-up order; Cancel does not clear an outage; two
  orders on one resource cannot each end the other's.
- **Manufacturing and Warehouse** (owner contracts): equipment availability reads the one open outage, as
  Manufacturing's does already (WorkCenters.js:108-113), and Manufacturing's Downtime shows Maintenance's
  restoration; `store#WorkCenterOffline`'s planned blocks are left to P15.
- **Screens:** Downtime under Equipment (DowntimeFind, DowntimeRows with the production source, RecordDowntime,
  RestoreResource); WorkOrderDetail's Downtime tab; EquipmentDetail's and FacilityDetail's current state; Home's
  counter of resources down.
- **Specs:** Mantle `test/work/MaintenanceOutages` (a second fault links the open outage; closing the production
  downtime restores nothing and `end#` does; a technician not on the work refused; a correction keeps the original
  interval; an overlapping order cannot restore).
- **Usable when** (`acceptance/Maintenance/MaintenanceOutageWalk`; design §11.2 "Outages" and "Outage shared with
  Manufacturing"): an equipment-fault stop in Manufacturing shows once in Downtime with its production context; the
  work order completes with the compressor still down and a follow-up; the supervisor restores it from Downtime,
  and Manufacturing shows it available. **Gate 1.**

**Built Nov 12 (P5).** mr-mantle 5dbdca39, mr-boss 6979a0cc (branch `mnt/p5`); mr-moqui unchanged, no Rust built.
- Checked first (the code over the plan): F14 (Manufacturing's minimal ResourceUnavailability and its internal `record#`, called only by
  ProductionDowntime.js `outageOf`), F13 and F49 as P3 left them (Mantle's `store#ProductionEquipment` guard and WorkCenters.js,
  Facilities.js), the other readers of the outage (ProductionShopFloor's start checks, ProductionCalendar, ProductionSchedule's move
  conflicts, WorkCenters' `outOfService`), ProductionDowntime's correction pattern and its spec, P3's lifecycle (`MaintenanceWork.js`
  `transitionWorkOrder`, `makeOrder`, `actionsFor`, the disposition enumeration), the booking views (`WorkEffortAndAssetBooking`,
  `WorkEffortAndFacilityBooking`) and the demo data loader (an upsert of the given columns only).
- Mantle:
  - Record (`entity/ResourceBookingEntities.xml`, F14): ResourceUnavailability gains the reason (`ResourceUnavailabilityReason`, its
    `optionIndicator` Y a planned reason) and `plannedOutage`, the work order and step, a revision, the correction chain
    (`originalUnavailabilityId`, `correctionOfUnavailabilityId`, `supersededByUnavailabilityId`, `changeReason`, who and when) and the
    restoration (`endedByUserId`, `endedDate`, `dispositionEnumId`, `endComments`); reason, interval, supersession and disposition
    audit-logged. MaintenanceWorkOrder gains `offlineIntent` and `resourceUnavailabilityId` (the outage it recorded or linked). Seed
    `data/MaintenanceWorkOutageData.xml`: the six reasons and the source `MsrcFollowUp`.
  - `mantle.work.ResourceBookingServices` over the new `ResourceOutages.js`: `record#` (an asset or a facility; the resource locked, its
    open outage in force linked, else a new one, or a past one ended by a supervisor or resource administrator; the caller checked by
    data: Manufacturing's equipment-fault stop of the asset in an organization the user operates, or a Maintenance supervisor or
    resource administrator of the resource's organization, or the technician assigned to the work order on it; the work order linked;
    the bookings over it kept and answered by id), `find#` (the scope's outages in force, filters, production and work context,
    restoration and the linked work still open, the correction chain), `correct#` (a new row in force, the corrected one superseded,
    the work orders' links moved) and `end#` (the only restoration: a supervisor or resource administrator, available or usable with
    restrictions; as the review's R1 made it, the user's call of Nov 12: linked work orders still open are listed and stay open, and
    a reason is needed while any is, `OPEN_WORK` without one).
  - The work order (`MaintenanceWork.js`, one grouped hook, `downtimeOf`): Start with offline intent (the order's or the form's) records
    the target's outage as planned maintenance or links the open one; Complete with equipment still unavailable records its outage when
    none is open, and `followUpName` makes a corrective follow-up (source Follow-up, `WeatCausedBy`) linked to the open outage; the
    answer names the outage and the follow-up; `get#` gives the offline intent and the outage; Home's `downResourceCount`.
  - Owner contracts: `store#ProductionEquipment` refuses equipment with an open outage (`EQUIPMENT_BLOCKED`, F49 completed); ProductionShopFloor,
    ProductionCalendar and ProductionSchedule read the row in force; ProductionDowntime's rows show the restoration through the chain.
- BOSS:
  - Screens: Equipment's Downtime tab (DowntimeFind, DowntimeRows, RecordDowntime, RestoreResource, Correct, the correction history)
    and WorkOrderDetail's Downtime tab (index 3; Files, Conversation and History moved to 4, 5 and 6; the review spaced them by ten,
    Downtime 60), sharing
    `template/MaintenanceDowntimeParts.xml`; the Lifecycle's Start asks whether the target goes out of service and Complete takes a
    follow-up name; NewWorkOrder's offline intent; the header's out-of-service line; EquipmentDetail's and FacilityDetail's Maintenance
    headers show "Out of service since …" linking to Downtime; Home's Unavailable resources counted, opening Downtime.
  - Maintenance.js: the link `Equipment/Downtime`, the choices `downtimeReasons` and `restoreDispositions`. Resources.js: the state.
  - Owner contracts: WorkCenters.js reads the outage in force; Manufacturing's Downtime shows the outage's restoration; Warehouse's
    equipment read (Facilities.js) shows "Out of service". Written into design-manufacturing and the logs of impl-manufacturing and
    impl-warehouse.
  - Demo (BossZMaintenanceDemoData.xml, appended): Room 201 out of service (a safety stop linked to its work order, offline intent)
    and the compressor's October belt failure restored by the supervisor, available.
- Specs:
  - Mantle `test/work/MaintenanceOutages` (5 features, 1.9 s): a stop's outage and a second fault linked, the stop's equipment only; a
    technician only from assigned work, a planner and another organization refused; closing the stop restores nothing, end# does
    with its disposition and Manufacturing's stop shows it; a correction keeps the original interval and the row in force is linked
    and counted; two work orders on one outage, a follow-up linked (the review: listed at restoration and left open), completion
    still unavailable recording an outage.
  - BOSS `test/Maintenance/MaintenanceDowntime` (2 features, about 0.8 s): Downtime's one qvt render as the supervisor and
    WorkOrderDetail's Downtime tab's one; Home's count; Manufacturing's and Warehouse's equipment reads out of service until restored.
    `MaintenanceAccess` gains the outage rule (supervisor links, planner refused, Retail's forklift refused, a technician's restore
    refused; 0.15 s).
  - Acceptance, written and not run: `acceptance/Maintenance/MaintenanceOutageWalk` (4 features).
- Tests run (release binary, `--nobuild`, this worktree): mr-mantle MaintenanceOutages, ProductionDowntime, ProductionShopFloor,
  ProductionOrders, ProductionReports, ProductionSchedule, MaintenanceWorkOrders, MaintenanceManagedWork, MaintenanceScope,
  MaintenanceResources and WorkProcess 69 of 69, and after prettier MaintenanceOutages, ProductionDowntime and MaintenanceWorkOrders 19
  of 19; mr-boss MaintenanceDowntime, MaintenanceAccess, MaintenanceWorkOrders, MaintenanceEquipment, ManufacturingDowntime,
  ManufacturingWorkCenters, ManufacturingShopFloor, ManufacturingSchedule and WarehouseFacilities 70 of 70, then the four Maintenance
  specs 23 of 23 after NewWorkOrder's field; client MaintenanceWorkOrdersWalk 1 of 1 (7.87 s). MaintenanceAccess's registry case
  failed before the change below (the settings index's old service). `./moq run --debug --nobuild lint --screens`: 136 flagged sites, as
  before P5, none in the new or changed screens. Prettier clean on the new and changed JavaScript (MaintenanceWork.js still holds one
  P3 line prettier would rewrap). Not run: ./moq test-apps, the acceptance suite.
- Inventories: usl-inventory's Added table for ResourceBookingServices (record#, find#, correct#, end#); ss-inventory has no baseline
  form for downtime (no row).
- Design edits: design-maintenance's header, §1.2, §3 (Home, WorkOrderDetail as built, the record shape) and §6 Downtime as built;
  design-manufacturing §6 Downtime (the restoration and the guard).
- Findings, numbered by the lead F119 to F128 in order:
  - A correction is a new row (ProductionDowntime's pattern), so a superseded row with no end would read as an open outage: every read
    of current availability now takes the row in force (`supersededByUnavailabilityId` empty), Manufacturing's three Mantle readers and
    WorkCenters.js among them. A later reader of ResourceUnavailability (P15's blackouts, P16's booking checks, P17's reports) must too.
  - `record#` checked no permission; it now checks its caller by data, with no caller flag: Manufacturing's entry is the stop it names
    (an equipment fault of the asset, in an organization the user operates), Maintenance's the permission, scope and assignment.
  - "An overlapping order cannot restore" holds because no work order ends an outage (completion and cancel restore nothing); the
    worker built `end#` also waiting for every open linked work order (`OPEN_WORK`), which the review replaced by the user's call
    (R1): `end#` lists them, leaves them open, and needs a reason while any is.
  - Complete with equipment "Still unavailable" records an outage when none is open (reason equipment fault), so the disposition is the
    availability fact and not a label only.
  - Production downtime now needs the seed reason `RurEquipmentFault`: a seed file that sorts before `MaintenanceWorkData.xml` and adds a
    `MaintenanceSource` value fails its load (foreign key), which is why the file is `MaintenanceWorkOutageData.xml`; while it was
    skipped, every equipment-fault stop failed.
  - MaintenanceAccess's "Admin's registries" case called `ironstone.admin.RegistryServices.find#Settings`, gone with Admin Screens Down,
    and failed on master; it now calls `org.moqui.admin.ReadinessServices.find#Settings` (F116).
  - A technician (assigned view) reads the organization's outages in Downtime (a resource read), not only those of their work.
  - Home's count is of outages in force in the scope; a facility down and equipment inside it count as two resources.
  - Services' demo has no equipment-fault production reason; the acceptance walk adds one in its setup.
  - WorkOrderDetail's tabs were numbered 1 to 5 with no gaps: P5 moved Files, Conversation and History; P6, P9 and P10 will move them
    again unless the lead respaces them.
- For the lead:
  - budget share: mr-mantle +1.9 s (MaintenanceOutages); mr-boss server about +1.0 s (MaintenanceDowntime 0.8 s, MaintenanceAccess
    +0.15 s); mr-boss client unchanged; budgets not changed.
  - merge hot spots: mr-mantle `MaintenanceWork.js` (header comment, `outages` import, `requestHash`, `makeOrder`'s row, `storeWorkOrder`'s
    offline intent, the transition's `downtimeOf` call and return, `downtimeOf` after it, `actionsFor`'s flags, `getWorkOrder`'s two
    fields, Home's count), `MaintenanceServices.xml` (create#, store#, transition# parameters), `MaintenanceEntities.xml` (two fields, an
    index), ProductionDowntime.js, ProductionOrders.js, ProductionShopFloor.js, ProductionCalendar.js, ProductionSchedule.js; mr-boss
    `Maintenance.js` (linkPaths, resourceChoices, choiceSources), `BossZMaintenanceDemoData.xml` (appended), `MaintenanceSpecLib.js` (ids),
    `MaintenanceAccess.spec.js` (appended; the registry line), `template/MaintenanceWorkOrderParts.xml` (createWorkOrder and
    lifecycleAction in-maps, the message, two fields), `WorkOrderDetail.xml` (comment, header line) and its tab indexes,
    `NewWorkOrder.xml`, `Home.xml`, `Shared/FacilityDetail.xml`, `template/MaintenanceEquipment.xml`, Resources.js, WorkCenters.js,
    Facilities.js, Manufacturing's Downtime screen, design-maintenance, and the plans' logs. No change to BossSetupData,
    BossMaintenanceDemoData or screen/Maintenance.xml.
  - the user's calls: whether a supervisor may restore a resource (usable with restrictions) while a follow-up work order linked to
    its outage is still open; decided Nov 12 (yes, listed and with a reason) and built in the review as R1.

**Review Nov 12 (P5).** mr-mantle 7eefd7a1, mr-boss 1af3123e and this note's commit (branch `mnt/p5`), over the worker's 5dbdca39, 6979a0cc
and 15b56435. Reviewed `git diff master...mnt/p5` in both repos against P5's text, §2, §4, F13, F14 and F49, design §3 (WorkDowntime,
the completion disposition), §6 Downtime and §7.1, design-manufacturing's Downtime ("One equipment outage fact"), AGENTS.md and
Practices-App-Dev; read every reader of ResourceUnavailability in mr-mantle and mr-boss (ProductionShopFloor, ProductionCalendar,
ProductionPlanning's OPEN_OUTAGE, ProductionSchedule's move conflicts and offline withdraw, ProductionOrders, ProductionDowntime,
WorkCenters.js, Facilities.js, Resources.js, Home's count; the other components have none) and the data loader's inputs (mr-mantle's
seed files by name, BossManufacturingDemoData, BossZMaintenanceDemoData).
- Checked and found sound:
  - Who records, corrects and ends. `record#`: a supervisor or resource administrator of the resource's organization
    (`requireAsset`/`requireFacility` cover the scope), or a technician only with a work order on that resource that is assigned
    to them (`WORK_REQUIRED`, `NOT_ASSIGNED`); a planner, another organization's supervisor and a technician's past (ended) outage
    are refused. `correct#` and `end#` are a supervisor's or resource administrator's in the outage's organization. The BOSS
    transitions pass no `sourceProductionDowntimeId`, so Manufacturing's entry is reachable only from Mantle
    (`ProductionDowntime.js` `outageOf`); `record#` is `allow-remote="false"`.
  - Manufacturing's entry needs PRODUCTION_OPERATE or _SUPERVISE in the stop's organization and an equipment-fault stop of that
    very asset (`SOURCE_INVALID`); a Maintenance user without them cannot pass it. What it still allowed is R2.
  - Two orders on one resource: no work order ends an outage. Complete and Cancel only record or link (`downtimeOf`), and only
    `end#` writes `thruDate` on an actual outage; closing a production stop updates the stop alone. Cancelling a work order leaves
    its link and the outage open (the spec's cancel case).
  - A correction is a new row; the corrected row keeps its interval, reason and recorder and gains only `supersededByUnavailabilityId`
    and a revision; the work orders' links move to the row in force, and Manufacturing's stop reads it through the chain
    (`current`).
  - Superseded rows: every reader of current availability skips them: Mantle's `openOutage` (EquipmentDetail, FacilityDetail,
    Complete's open outage), `scopedQuery` (Downtime, Home's count), ProductionShopFloor's start checks, ProductionCalendar (and
    through it ProductionPlanning's `OPEN_OUTAGE`), ProductionSchedule's conflicts, ProductionOrders' guard, WorkCenters.js and
    Facilities.js. ProductionSchedule's withdraw reads planned blocks only, which R3 keeps from being superseded.
  - `store#ProductionEquipment` refuses only a new assignment of equipment out of service; ending an assignment of broken
    equipment is unchanged, and Manufacturing's specs pass (Tests).
  - Seeds on a fresh database: `MaintenanceWorkOutageData.xml` sorts after `MaintenanceWorkData.xml` (whose `MaintenanceSource`
    type `MsrcFollowUp` needs) and declares its enumeration type before its values; nothing loading earlier writes an outage with a
    reason (Manufacturing's demo has one planned stop, no outage; Maintenance's demo rows load from mr-boss after mr-mantle's
    seed). Every spec run here starts from a fresh database.
  - WorkOrderDetail's tabs: Overview, Time, Downtime, Files, Conversation and History in design §3's order, no duplicate index;
    respaced in R6.
- Fixes:
  - **R1 (the user's call, Nov 12; lifecycle).** `end#ResourceUnavailability` restores while linked work orders are still open:
    it lists them in its answer (`openWorkList`) and find#'s rows give them to the RestoreResource dialog (`openWorkList`,
    `openWorkText`, Restore shown), they stay open, and a reason is required while any is (`openWorkReason`, a new field kept on
    the row and carried by a correction; `OPEN_WORK` names them without one). It replaces the built `OPEN_WORK` refusal. The
    dialog shows "Work orders on this outage still open, which stay open" and asks "Why restore it while that work is open";
    the rows say "Open work on it" and, once restored, "Restored with work open: …". MaintenanceOutages' last feature: the first
    work order's completion and a third's cancel restore nothing, the follow-up is listed, a restore without a reason is
    `OPEN_WORK`, with it `RESTORED` (restricted) and the follow-up still open (fails without the reason check);
    MaintenanceDowntime's render checks the Room 201 row's open work and the reason field; the acceptance walk now restores
    right after completion with the follow-up open. Design §3 and §6, the entity, service and screen texts and the Built note
    follow.
  - **R2 (medium, access; F14).** Manufacturing's entry to `record#` checked the stop's kind and the operator's organization but
    not that it was the stop's own recording: an operator could name an old equipment-fault stop again to open a new outage
    after a restoration, or record an ended outage with any interval and reason (the production path skipped the supervisor
    check for `thruDate`). It now admits only a stop not corrected and with no outage yet, from the stop's start, open, an
    equipment fault (`SOURCE_INVALID`), which is exactly what `outageOf` sends. MaintenanceOutages: the restored stop named again,
    open and ended, is refused and the press keeps one outage (fails without).
  - **R3 (medium, owner contract with Manufacturing).** `correct#` accepted any kind, so a Maintenance supervisor could supersede
    Manufacturing's planned offline block of a work center (`store#WorkCenterOffline`'s RukPlanned row), which its withdraw would
    then end as a superseded row. It refuses a planned block (`KIND_INVALID`) and find#'s rows offer Correct on actual outages only.
    MaintenanceOutages: a planned block of the line is refused (fails without).
  - **R4 (medium, confidentiality; F69).** find#'s rows named every linked work order with its title and status, so a resource
    administrator and a technician not on the work (both readers of Downtime) read work order titles that P3's rule hides from
    them. A work order the caller may not read (`requireWork`) shows its id and status only, with no link; `end#`'s list does the
    same. MaintenanceOutages: the supervisor sees the title, the resource administrator and the second technician do not (fails
    without).
  - **R5 (low, correctness).** A technician assigned to a step only (P6) was refused because the assignment was read on the root;
    `record#` now reads it on the step named. No spec until P6 assigns steps. `store#ProductionEquipment`'s refusal said "is
    Available" for equipment out of service; it says "in maintenance or out of service", and ProductionOrders gains the guard's
    case: equipment with an open outage is refused, one whose open row was superseded by an ended correction is assigned (fails
    without the outage half of the guard).
  - **R6 (low, merge).** WorkOrderDetail's tabs are spaced by ten in design §3's order (Overview 10, Time 30, Downtime 60, Files 70,
    Conversation 80, History 90), leaving Procedure 20, Parts 40, Purchasing 50 and Costs 100, so P6, P9, P10 and P11 add a file
    each and renumber nothing. Written into WorkOrderDetail.xml's comment and design §3.
  - Texts: the template's header (only recordDowntime calls check#Record; restore and correct rely on Mantle's outage scope), the
    follow-up's tooltip, WorkOrderDetail's Downtime tab, Equipment/Downtime's comment, impl-manufacturing's log line.
- Findings, numbered by the lead F129 to F133 in order:
  - An existing database needs `MaintenanceWorkOutageData.xml` loaded before an equipment-fault stop works: without
    `RurEquipmentFault` every such stop fails (`REASON_INVALID`) and is rolled back with its outage. A fresh database is fine.
  - `record#` reads no work status: a technician may record an outage from a work order assigned to them that is completed,
    closed or cancelled (the screen offers it only on open work). A status check must still admit Complete's own recording, which
    runs after the status change.
  - A correction may move an ended outage over another outage of the same resource; nothing checks the overlap (P17's union
    counts it once).
  - `record#` locks the resource row before checking the caller, so a refused caller briefly holds the lock.
  - Production context (the run's name, the stop reason) shows to every Downtime reader, a technician with the assigned view
    included; it is Manufacturing's data read through Maintenance's resource scope.
- Tests (release binary, `--nobuild`, this worktree): mr-mantle MaintenanceOutages, ProductionDowntime, ProductionShopFloor,
  ProductionOrders, ProductionReports, ProductionSchedule, MaintenanceWorkOrders, MaintenanceManagedWork, MaintenanceScope,
  MaintenanceResources and WorkProcess 69 of 69 (MaintenanceOutages 5 features, 2.3 s alone, 3.9 s in the serial run; ProductionOrders
  13.6 s); mr-boss MaintenanceDowntime, MaintenanceAccess, MaintenanceWorkOrders, MaintenanceEquipment, ManufacturingDowntime,
  ManufacturingWorkCenters, ManufacturingShopFloor, ManufacturingSchedule and WarehouseFacilities 70 of 70 (MaintenanceDowntime 0.8 s);
  client MaintenanceWorkOrdersWalk 1 of 1 (8.84 s, the worker's 7.87 s; the review changed only its tab indexes and a tooltip).
  Each new case was run against the code without its fix and failed (R1's reason check, R2, R3, R4, R5's outage guard).
  `./moq run --debug --nobuild lint --screens`: 136 flagged sites, as before; none new in the changed screens. Prettier clean on the
  changed JavaScript (MaintenanceWork.js keeps the P3 line the worker named). Not run: ./moq test-apps, the acceptance suite; the
  changed `acceptance/Maintenance/MaintenanceOutageWalk` (AGENTS.md runs a changed acceptance test) is left to the lead, as the
  brief says.
- For the lead:
  - budget share: mr-mantle about +0.4 s over the worker's (MaintenanceOutages 1.9 s → 2.3 s alone; ProductionOrders' added
    assignments a few hundredths); mr-boss server unchanged; mr-boss client unchanged in content (8.8 s this run, near the 9 s
    estimate); budgets not changed.
  - merge hot spots, beyond the Built note's: mr-mantle `ResourceOutages.js` (header, `productionAuthority`, `workReader`,
    `openWorkOf`, `end`, `correct`, `displayRows`), `ResourceBookingEntities.xml` (`openWorkReason`), `ResourceBookingServices.xml`
    (record#, find#, correct#, end# texts and end#'s parameters), `ProductionOrders.js` (the guard's messages) and
    `test/work/ProductionOrders.spec.js` (setup and the equipment feature); mr-boss the six WorkOrderDetail tab files (indexes
    10–90), `template/MaintenanceDowntimeParts.xml`, design-maintenance's header, §3 and §6.
  - the user's calls: the only one of P5 is decided and built (R1). None open.

### P6 — Procedures

Design §4.1, §4.2, Procedures and ProcedureDetail, §12 (the published procedure); MT-03.

- **Mantle records.** People's `WorkEffortProcessPolicy` and `WorkEffortStepPolicy` (impl-people P7; design §4.1)
  extended, not replaced: on the process, publication, approval, effectivity and applicability, and Maintenance's
  using policy, which sets the guards-execution flag; on the step, the response kind, measurement, evidence and
  waiver fields that P7 here reads. The template status flow (draft, approved, retired); the `WorkProcessApproval`
  topic with its approve and refuse services and its `TopicRegistration`. The template flag's description is made
  general (F4).
- **Mantle `mantle.work.ProcessServices`:** `find#WorkProcesses`, `get#WorkProcess`, `store#WorkProcess`,
  `move#ProcessStep`, `store#ProcessDependency` (same tree, no cycle), `store#ProcessRequirements` (WorkEffortProduct,
  WorkEffortAssetNeeded and WorkEffortSkillStandard rows; People's `minimumSkillLevel` joins in P8, F75),
  `request#WorkProcessApproval`, `approve#WorkProcess` (not the last author unless the policy allows it; the decision a
  WorkEffortApproval row, F44), `retire#WorkProcess`, `find#ProcessExecutions`, and People's `store#ProcessStep` and
  `instantiate#WorkProcess` extended, not replaced: a process whose policy guards execution takes the checked path of
  design §4.2 (approval and effectivity checked and the extended step policies carried, over People's clone with its ID
  map, remapped dependencies and one `WeatBasedOn` link per node); a People checklist, whose policy does not guard, is
  instantiated as People built it. The module stays its own, leaving `clone#WorkEffort` and `clone#Project` as they
  are (F5, §4). From this phase a procedure and its steps are managed work by the flag, as a template and as executed
  (§4). (P0, F58: the policy's own edit and instantiation permissions in WorkProcesses.js' policies table; People's
  instantiation copies no content, requirements or skills, so the checked path copies the requirements after it.)
  Approved instructions are content rows the execution can still resolve (P0, F68: `WectInstruction` rows written at
  publication by ProcessServices in the rule's shape, resolved through the `WeatBasedOn` link, not copied), and
  the published procedure is stored as a PDF.
- **`create#MaintenanceWorkOrder`** takes a template and instantiates it in its transaction; a retired or
  unapproved template is refused for new work.
- **Products** (owner contract): Product360's maintenance default takes only a template the process applicability
  check admits.
- **Screens:** Procedures (FindProcedures, ProcedureRows, NewProcedure, Use procedure); ProcedureDetail with the
  record header and Overview, Steps (StepTree with the up and down actions), StepRequirements, Dependencies,
  Resources and materials, Instructions, Approval and history, Usage. The approval card in Commons' approvals inbox
  calls `approve#WorkProcess`. The palette's procedure source. Settings gains procedure self-approval.
- **Demo data:** three procedures (a compressor service with nested groups, a dependency and a reading; a room
  inspection; a draft), one retired.
- **Specs:** Mantle `test/work/MaintenanceProcesses` (two instantiations of a procedure with distinct ids, their
  step policies carried and one source link each; changed input under a key refused; a draft, a retired and a
  not-yet-effective template refused; the author refused approval; a cycle refused; a procedure template refused
  time, a Tasks listing and `update#Task`, and a People checklist task still completed as a task), with People's
  `test/work/WorkProcess`, which holds the clone's own cases, passing unchanged; BOSS `MaintenanceProcedures`
  (ProcedureDetail's one qvt render: read only for a technician).
- **Usable when** (`acceptance/Maintenance/MaintenanceProceduresWalk`; design §11.2 "Repeat a procedure",
  "Interrupted creation/retry", "Template isolation", "Publication and amendment" in its publication half): an
  author builds the compressor service, an approver publishes it from the approvals inbox, a planner creates two
  work orders from it, and editing the procedure afterwards changes neither.

**Built Nov 12 (P6).** mr-mantle 625a52f3, mr-boss 6d65180d (branch `mnt/p6`); mr-moqui unchanged, no Rust built.
- Checked first (the code over the plan): F58 (WorkProcesses.js' `policies`, `requirePolicy`, `storeStep` and `instantiate`, People's
  Checklists.js calling them directly), F59 and P3's `managedIds`, F68 (`guardInstruction`, `store#OperationInstruction`, the EECA), F44
  (WorkEffortApproval and Projects' reads of it, by work effort or approver), F75 (no `minimumSkillLevel`), F4 and F5, F107, F110
  (the project-model writers, `clone#WorkEffort` and `add#TaskTime` on the `/mantle` REST API), F111 (`import#TimeEntryCsv`'s
  `itemOf`), F113 (WorkOrders.js `openAssignments` and the transfer), the framework's `approve#NotificationMessage` (the topic's
  service called as the user with the record and message), Budgets.js' stored PDF (`xslFoTransform`), Product360's maintenance
  default (Mantle CatalogRecords.js), the status flows over WeInPlanning, WeApproved and WeClosed (F65), and §4 and P3's notes.
- Mantle:
  - Records (`entity/WorkProcessEntities.xml`, extended, not replaced): WorkEffortProcessPolicy gains `effectiveFromDate`,
    `effectiveThruDate`, `approvedByUserId`, `approvedDate`, `lastAuthorUserId`, `lastAuthoredDate`, the applicability
    (`maintenanceTypeEnumId`, `applicableProductId`, `applicableAssetClassEnumId`, `applicableFacilityTypeEnumId`),
    `sourceWorkEffortId` and `publishedContentId`; WorkEffortStepPolicy `responseKindEnumId` (the new WorkStepResponseKind: check off,
    pass or fail, reading), `measurementTypeId`, `measurementUomId`, `minimumValue`, `maximumValue`, `evidenceRequired`,
    `commentRequired`, `waiverAllowed`, `changeReason`; the policy `WppMaintenanceProcedure`; the content types `WectProcedureDraft`
    and `WectPublishedProcedure`. MaintenanceWorkOrder gains `procedureWorkEffortId` and `procedureDate`, MaintenancePolicy
    `procedureSelfApproval`. `isTemplate`'s description made general (F4). `data/MaintenanceProcedureData.xml`: the
    `WorkEffortProcedure` flow (Approve, Amend with WORK_PROCESS_EDIT, Retire; see the findings) and the `WorkProcessApproval` topic
    (approve and refuse services, a refusal's reason required) with its `TopicRegistration` (audience WORK_PROCESS_APPROVE).
  - WorkProcesses.js (People's module): the `policies` table gains WppMaintenanceProcedure with its edit permission, its instantiation
    permissions and its checked path; `store#ProcessStep` and `instantiate#WorkProcess` run a policy's checked path when it has one,
    else People's as before; `storeStep` carries the step fields (`stepFields`; a change starts the next row) and `instantiate` copies
    them, empty for People's checklists. People's `test/work/WorkProcess` passes unchanged.
  - `mantle/work/MaintenanceProcedures.js` (the checked path, design §4.1, §4.2) over ProcessServices' new services: `find#WorkProcesses`
    (the scope's procedures in every state; `usable`: approved, in effect and applicable to a target, also for a planner),
    `get#WorkProcess` (header, steps in order with depth and group flag, requirements, instructions, the WorkEffortApproval history, the
    findings, what the caller may do; a technician assigned to work made of it reads it read only), `store#WorkProcess` (a draft of the
    organization, or a copy of another's tree with new ids and no approval), `store#ProcessStep`'s checked path (the response policy
    checked, VALUE_INVALID), `move#ProcessStep`, `store#ProcessDependency` (People's same-tree and cycle check), `store#ProcessRequirements`
    (WorkEffortProduct consumed and dated, WorkEffortAssetNeeded, WorkEffortSkillStandard with no level, F75), `store#ProcessInstruction`
    (a draft), `find#ProcessInstructions` (an execution node's through its WeatBasedOn link, the instruction in effect when it was made),
    `request#WorkProcessApproval` (the findings first, PUBLICATION_INVALID; the organization's approvers told, not the last author),
    `approve#WorkProcess` (WORK_PROCESS_APPROVE in the organization; SELF_APPROVAL unless the policy allows it; APPROVAL_NOT_REQUESTED;
    an effective time now or later; the drafts published as WectInstruction rows in the rule's shape, F68; the definition as a PDF,
    template/work/Procedure.print.html.fancy, logged and the approval kept when it cannot be made), `refuse#WorkProcess` (a reason),
    `retire#WorkProcess`, `find#ProcessExecutions` and `check#ProcessApplicability`. An author's change of an approved procedure takes
    it back to Draft and cancels the request waiting. Instantiation: the caller's MAINTENANCE_PLAN or _SUPERVISE in the organization,
    Approved (PROCESS_NOT_APPROVED, PROCESS_RETIRED), in effect (PROCESS_NOT_EFFECTIVE), applicable (PROCESS_NOT_APPLICABLE), then People's
    `instantiate`, then each template node's requirements copied to its new node (F58).
  - MaintenanceWork.js: `create#MaintenanceWorkOrder` takes `templateWorkEffortId` and `roleParties` (the organization's people) and makes
    the root and steps through the checked path in its transaction, the procedure of the work's organization; its work is never approved
    on create as corrective work is; the threshold reads the steps' estimates (F107, `treeHours`; see the findings);
    `schedule#MaintenanceWorkOrder` takes `replacePartyId` and `withPartyId` (the root and each step of its tree, F113); `get#` names the
    procedure and the steps' estimate; the policy's `procedureSelfApproval`; the create's request hash fixed (a finding).
  - The generic paths (F110, F111): `clone#WorkEffort` (also on `/mantle`), `add#TaskTime` (on `/mantle`), `add#` and
    `remove#TaskDependency` call `check#ManagedWork`; `import#TimeEntryCsv` names a managed item not available. The plan items, labels,
    ranks, `move#TaskSubtreeProject` and task comments stay unguarded: Projects reaches them only over tasks `get#TaskAccess` admits, a
    managed one not, and none is on the REST API (P3 review's note). Products (owner contract): CatalogRecords.js' maintenance default
    takes only a work template `check#ProcessApplicability` admits for the model; ProductsCatalog passes unchanged.
- BOSS:
  - Services: Maintenance.js's `procedure` record kind (check#Record through Mantle's read), the palette's procedures, the procedure
    choices (`procedures`, types, models, classes, facility types, steps, response kinds, measurement types and units, skills, parts;
    get#Choices' new parameters), the link paths; WorkOrders.js' participant counts a step's assignee as its work order and moves a
    leaver through `replacePartyId` (F113).
  - Screens: the root (Procedures at index 4 for a reader of procedures or a planner or supervisor, `g p`, the WorkProcessApproval topic),
    Procedures/Find (New procedure, Use procedure), Procedures/ProcedureDetail (header: Request approval, Approve, Use procedure, More:
    Retire, Copy as a new draft, the approved PDF) with Overview, Steps (Up and Down, Edit with the response policy, Waits for, Remove),
    Resources, Instructions, Approval and Usage, and `template/MaintenanceProcedureParts.xml`; NewWorkOrder's procedure; Work policy's
    procedure self-approval; WorkOrderDetail's Overview facts (no new tab; its indexes untouched). `data/BossSetupMaintenanceData.xml`
    holds the topic's link (F118; see For the lead).
  - Demo (BossZMaintenanceDemoData.xml): the AC-200 compressor service (approved; a Prepare group of two steps, the oil change waiting
    for it, the filter with its part, a pressure reading 7–9 bar a supervisor may waive), the room inspection (approved, for rooms), the
    van's pre-trip check (a draft), the old compressor checklist (retired), and the AC-200 model's maintenance default naming the
    service. No instruction is seeded (a WectInstruction is a stored file written by approval).
- Specs:
  - Mantle `test/work/MaintenanceProcesses` (6 features, 4.2 s): a procedure with a nested group, a dependency and a reading; a cycle,
    a bad response kind and a group's response refused (the last at the request); a reader refused authoring, another organization
    refused; a request answered once; a planner refused a draft; the approver approves (an instruction published, the PDF stored);
    self-approval refused and then allowed by the policy; two work orders with distinct trees, the step policies and requirements
    carried, one source link a node, the dependency remapped, waiting for a supervisor by the steps' hours; a retry answering the first
    and changed input refused; another model and another organization refused; a change back to Draft, new work refused, the earlier
    work's instruction kept after re-approval; draft, retired, not yet effective and inapplicable refused; usable list and usage; the
    template refused update#Task, time, add#TaskTime, clone#WorkEffort, add#TaskDependency, the Tasks collection and the time import;
    a technician reading the procedure of their work only; a People checklist task completed by set#TaskStatus.
  - BOSS `test/Maintenance/MaintenanceProcedures` (4 features, about 2.0 s): ProcedureDetail's one qvt render as the technician of work
    made of it (read only, no author or approver action), Find, Steps, Resources, Instructions, Approval and Usage each rendered once;
    the approval card through `approve#NotificationMessage` (the approver told and the author not; the author refused); a step's
    assignee counted by Admin's participant and replaced on the step; Product360's default (an applicable procedure, a room's, a
    retired one and a work order). `MaintenanceAccess` gains the procedure rule (author, approver and planner read; resource
    administrator, an unassigned technician and Retail refused; a work order no procedure; an author's change, a planner's and
    Retail's refused) and the P6 menus and key; `MaintenanceWorkOrders`' Work policy render checks the new field.
  - Acceptance, written and not run: `acceptance/Maintenance/MaintenanceProceduresWalk` (4 features: build on ProcedureDetail, publish
    from Commons' approvals inbox, two work orders from NewWorkOrder with a resubmit, a later edit changing neither).
- Tests run (release binary, `--nobuild`, this worktree): mr-mantle WorkProcess, PeopleChecklists, MaintenanceWorkOrders,
  MaintenanceManagedWork, MaintenanceProcesses, WorkTimeEntries, MethodTemplates, ProductionShopFloor, WorkPlanToCashBasicFlow,
  WorkProjectFoundation, WorkProjectHub, WorkProjectItems, WorkProjectPlan, WorkProjectServices, ProductCatalogImport, Dav, TimeImports,
  MaintenanceScope and MaintenanceResources: 187 of 187 (24 specs, 38.7 s feature time); after the last changes MaintenanceProcesses,
  WorkProcess, PeopleChecklists, MaintenanceWorkOrders, MaintenanceManagedWork, WorkTimeEntries and ProductCatalogImport 43 of 43.
  mr-boss MaintenanceProcedures, MaintenanceAccess, MaintenanceWorkOrders, MaintenanceEquipment, ProductsCatalog, ProductsAccess,
  ManufacturingMethods, AdminLifecycle, Notifications, TimeEntries, Tasks, PeopleLifecycle and AdminRegistries: 98 features, 94 passed;
  two failures: MaintenanceProcedures' author refusal (the message is "not addressed to you"; the assertion fixed, then 4 of 4), and
  MaintenanceAccess' registry feature, which fails on this branch before P6 (it calls `ironstone.admin.RegistryServices.find#Settings`,
  gone with Admin Screens Down; master's copy of the spec calls `org.moqui.admin.ReadinessServices.find#Settings`, F116). Client
  MaintenanceWorkOrdersWalk 1 of 1 (8.3 s). `./moq run --debug --nobuild lint --screens`: 136 flagged sites, as before; the new screens
  appear only in the information list of unnamed containers; the release symlink intact. Prettier clean on the new JavaScript and on
  Maintenance.js; MaintenanceWork.js and MaintenanceWorkOrders.spec.js were not prettier-clean before P6 and are left so (P5 edits the
  first). Not run: ./moq test-apps, the acceptance suite.
- Inventories: usl-inventory's ProcessServices and MaintenanceServices rows, check#ManagedWork's new callers, and an Added table for
  ProcessServices' P6 services; ss-inventory's CreateProductMaintenance and a P6 line (no baseline form maps to Procedures).
- Design edits: design-maintenance's header, §1.2, §4.1, §4.2, Procedures, ProcedureDetail and §9 as built; design-drawers-commons'
  WorkProcessApproval row.
- Findings, numbered by the lead F150 to F157 in order:
  - The threshold double-counted: Mantle's WorkEffortUpdateProject EECA rolls every task's estimate up onto its root
    (`update#ProjectTimeFromTask`), so a procedure's root already holds its steps' sum. `treeHours` reads the steps' sum when a step has
    an estimate, else the root's own; a root's own estimate entered on a procedure's work is overwritten by the rollup at the next step
    write.
  - P3's `requestHash` hashed every text field as `NaN` (`String(ms(text) ?? text)`, Date.parse of a name), so changed input under an
    operation key went unseen except for numbers and dates; fixed (P6's spec failed without it).
  - The `WorkEffortProcedure` flow's Amend (WeApproved → WeInPlanning) is held otherwise only by Manufacturing's production flow, so its
    row needs WORK_PROCESS_EDIT; a holder of WORK_PROCESS_EDIT can now make that move on other work through a raw `update#WorkEffort`
    where they have that path (none of the BOSS groups does), as P3's review noted for its flow rows.
  - An approved procedure's change goes back to Draft (amended) rather than a dated amendment of the approved definition: new work
    waits for the next approval; work made earlier keeps its rows and resolves its instructions as made. The design's "approved content
    is amended by a new effective change" is met for instructions (dated WectInstruction rows) and step policies (dated rows), not for
    the WorkEffort fields (names, descriptions, order), which have no history beyond the audit log.
  - Commons' `approve#NotificationMessage` calls the topic's service as the user under the calling screen's grant; outside a screen
    (a spec, an API) the user needs the service's artifact grant, so the spec runs it with the artifact check aside and the decision
    is approve#WorkProcess' own permission and scope check.
  - The project-model writers stay unguarded (F110): plan items, labels, ranks, `move#TaskSubtreeProject`, comments; guarding them would
    change no reachable path today.
  - Demo instructions are not seeded: a `WectInstruction` row needs its file in the resource store with a checksum (the EECA rule).
  - Not on the forms yet: a step's role and due offset, the change reason, and a retirement dated later (Retire is from now).
- For the lead:
  - budget share: mr-mantle MaintenanceProcesses about 4.2 s; mr-boss server MaintenanceProcedures about 2.0 s and MaintenanceAccess
    +0.4 s; client unchanged (MaintenanceWorkOrdersWalk 8.3 s); budgets not changed.
  - merge hot spots: mr-mantle `entity/MaintenanceEntities.xml` (MaintenanceWorkOrder's and MaintenancePolicy's fields, P5 extends
    them too), `MaintenanceWork.js` (create, schedule, approve, get, the hash), `MaintenanceServices.xml`, `MaintenanceSettingsServices.xml`,
    `WorkProcesses.js`, `TaskServices.xml`, `WorkEffortServices.xml`, `TimeServices.xml`, `CatalogRecords.js`; mr-boss
    `data/BossSetupMaintenanceData.xml` (created here, add/add with master's F118 file: keep master's and append P6's one row, the
    topic's link), `data/BossZMaintenanceDemoData.xml` (appended), `screen/Maintenance.xml` (subscreens, topics, keys beside P4's
    Requests), `Maintenance.js` (linkPaths, recordKinds, choices, palette; prettier-formatted), `ContextServices.xml`,
    `template/MaintenanceParts.xml` (the choices transition), `MaintenanceWorkOrderParts.xml`, `NewWorkOrder.xml`, `WorkPolicy.xml`,
    `WorkOrderDetail/Overview.xml`, `WorkOrders.js`, `test/Maintenance/MaintenanceSpecLib.js` (ids, menus, keys: P4 adds Requests to
    the same lists), `MaintenanceAccess.spec.js`, `MaintenanceWorkOrders.spec.js`, the inventories and design-maintenance.
  - the user's calls: whether an approved procedure's change should go back to Draft (built) or keep the approved definition in effect
    for new work until the change is approved (a versioned definition, which the design rules out beside the WorkEffort tree); built
    meanwhile: back to Draft.

**Review Nov 12 (P6).** mr-mantle 8b105d3c, mr-boss 3766af0e and this note's commit (branch `mnt/p6`), over the worker's 625a52f3,
6d65180d and 40f725fe, after "Merge master into mnt/p6" (mr-mantle 44ae143b, mr-boss b78fa5c6; mr-moqui's `mnt/p6` fast-forwarded to
master 4994093f). Reviewed `git diff master...mnt/p6` in both repos against P6's text, §2, §4, F4, F5, F44, F58, F68, F75, F107,
F110, F111, F113 and F118, design §4.1, §4.2, Procedures, ProcedureDetail and §12, AGENTS.md and Practices-App-Dev; read People's
WorkProcesses.js and Checklists.js callers, Manufacturing's `guardInstruction` and its EECA, the framework's
`decide#NotificationMessage` and Commons' Notifications transitions, Mantle's `update#ProjectTimeFromTask` rollup and `mantle.rest.xml`.
- The merge: `data/BossSetupMaintenanceData.xml` is master's file with P6's one row (the WorkProcessApproval topic's link) appended (no P6
  row was at the end of BossSetupData.xml); MaintenanceEntities.xml keeps both indexes (P5's outage, P6's procedure); MaintenanceWork.js
  requires both modules and `requestHash` is P6's fixed value function with P5's offline flag appended; the root's menu, keys, link paths
  and record kinds hold P4's Requests (index 3, `g r`) before P6's Procedures (index 4, `g p`); MaintenanceSpecLib's menus and keys are
  the union (the planner's Home, WorkOrders, Requests, Procedures, Equipment, Facilities); NewWorkOrder's create passes `offlineIntent`
  and `templateWorkEffortId`; the demo, inventories and design keep both phases' text (P6's design header line first, newest).
- Checked and found sound:
  - People unaffected. `store#ProcessStep` and `instantiate#WorkProcess` take the checked path only for a policy with `checkedPath`
    (WppMaintenanceProcedure); Checklists.js calls `storeStep` and `instantiate` directly on its own ChecklistTemplate rows, and the step
    fields are copied only when set. `test/work/WorkProcess` and `PeopleChecklists` pass unchanged (no People spec is changed on the branch).
  - The checked path. Instantiation needs MAINTENANCE_PLAN or _SUPERVISE in the procedure's organization, then refuses Retired
    (PROCESS_RETIRED), Draft (PROCESS_NOT_APPROVED), not in effect (PROCESS_NOT_EFFECTIVE) and inapplicable (PROCESS_NOT_APPLICABLE);
    `create#MaintenanceWorkOrder` also refuses another organization's procedure. Approval: WORK_PROCESS_APPROVE in the organization,
    SELF_APPROVAL for the last author unless MaintenancePolicy allows it; every author's write (step, move, dependency, requirement,
    instruction, header) goes through `touch`, which takes an approved procedure back to Draft, cancels the waiting request and names the
    caller the last author, so an approver cannot approve a change they made. The user's call (back to Draft; existing work keeps what it
    was made from) is built: executions copy the tree, and an execution resolves its instruction through its WeatBasedOn link at the time
    it was made.
  - Instantiation: distinct ids per work order, the step policies with P6's fields, one `WeatBasedOn` per node, the dependency remapped,
    the requirements copied after People's clone (F58), the policy's guard on the execution; the operation key answers the first root and
    changed input is OPERATION_KEY_CONFLICT (the `requestHash` NaN fix holds after the merge with P5's flag).
  - The threshold: Mantle's rollup writes the sum of every task of a root (groups included, no per-group rollup) onto the root, so
    `treeHours` taking the steps' sum when any step has an estimate, else the root's, counts nothing twice; the planner's approve and the
    create agree.
  - The managed guard (F110, F111): `clone#WorkEffort`, `add#TaskTime` and `add#`/`remove#TaskDependency` call `check#ManagedWork`;
    the time import names a managed item not available. The unguarded writers are acceptable: none is called by a BOSS screen over a
    managed task, and the `/mantle` REST API is granted to ADMIN alone (MantleSetupData MANTLE_API). Correction to the Built note: some
    are on that API (`add#TaskComment`, `set#TaskMilestone`, `add#WorkEffortProduct`, `store#WorkEffortPartyTime`, `store#TimeEntry`,
    `create#TimeEntryClockIn`); see the findings.
  - Instructions in Manufacturing's shape: a WectInstruction row under `dbresource://mantle/content/workEffort/`, its sha256 and from date,
    the one before ended by thruDate only; `guardInstruction`, its EECA and OperationTemplates.js are unchanged on the branch;
    MethodTemplates (mr-mantle) and ManufacturingMethods (mr-boss) pass.
  - The stored PDF: `Procedure.print.html.fancy` is HTML-escaped (a `.html.fancy`), no cost; a PDF that cannot be made is logged and the
    approval kept (failure tolerance); the spec finds the WectPublishedProcedure row.
  - Product360 (owner contract): CatalogRecords.js' maintenance default calls `check#ProcessApplicability` (a data check, allow-remote
    false) and refuses a non-procedure, a retired one or another model's; ProductsCatalog passes.
  - The approval card. A real click from Commons' Notifications screen, with artifact authorization on, approves under the screen's grant
    (the topic's service is called inside the transition); a recipient who holds no WORK_PROCESS_APPROVE is refused by
    `approve#WorkProcess` and `refuse#WorkProcess` (PERMISSION_DENIED) and the procedure stays a draft (R1 makes this the spec).
  - Admin's participant: a step's current assignee counts as its open work order (the root's), and the transfer calls
    `schedule#MaintenanceWorkOrder` with `replacePartyId`/`withPartyId`, which ends only the leaver's Assignee rows on the root and its steps
    and adds the successor where not already assigned; the other assignees are untouched.
  - Access: list, read, choices and palette are scoped by `maintenanceAccess.covers`; a technician reads only a procedure of work assigned
    to them, read only; ProcessServices are allow-remote false and no BOSS group is granted them directly.
- Fixes:
  - R1 (tests, medium): the approval card feature ran `approve#NotificationMessage` with the artifact check off, so the screen grant the
    finding relies on was never exercised and a non-approver's refusal by Mantle was untested (the author's refusal is the framework's "not
    addressed to you"). MaintenanceProcedures now posts Commons' `Notifications/approve` and `refuse` as each user with authorization on:
    the author refused, a planner made a recipient refused (PERMISSION_DENIED, still a draft), the approver's click approves.
  - R2 (correctness, medium): an approval effective before an instruction an earlier approval published for later (approve effective in two
    days, change, approve now) published the new text from now while the older WectInstruction stayed open from its later start, so the
    older approved text took over then; with an earlier instruction ended at that later date, Manufacturing's guard ("ended stays ended")
    failed the approval instead. `approve#WorkProcess` now refuses DATE_INVALID when a node's instruction starts after the requested
    effective time; a later date ends the earlier one at its start. MaintenanceProcesses gains the case (it fails without the fix:
    the early approval succeeded).
- Findings, numbered by the lead F158 to F161 in order:
  - `instantiate#WorkProcess` called directly for a procedure (outside `create#MaintenanceWorkOrder`) makes a guarded execution tree with
    no work order, and with no target its applicability is not checked. No screen or grant reaches it (allow-remote false, no BOSS grant);
    a later phase that calls it should go through the work order, or the checked path could refuse a call without one.
  - The `/mantle` REST writers left unguarded (above) include `add#WorkEffortProduct`, which would change a procedure step's parts with
    no `touch` (no return to Draft, no new author). ADMIN only; recorded for a consistent rule (guard every REST writer of a task, or rely
    on the grant, as P3 did).
  - A completed step's assignee still counts its open work order in Admin's participant and is replaced on that step; P7, which completes
    steps, should end or skip those rows.
  - Prettier was not run by this review (no local prettier); the changed JavaScript was kept to its 130 columns by hand.
- Tests (release binary 03:39, `--nobuild`, this worktree, after the merge and the fixes): mr-mantle MaintenanceProcesses, WorkProcess,
  PeopleChecklists, MaintenanceWorkOrders, MaintenanceManagedWork, MaintenanceIntake, MaintenanceOutages, MaintenanceScope,
  WorkTimeEntries, TimeImports, ProductCatalogImport, MethodTemplates: 71 of 71 (12 specs, 19.8 s feature time; MaintenanceProcesses
  7 features, about 4.7 s). mr-boss MaintenanceProcedures, MaintenanceAccess, MaintenanceWorkOrders, MaintenanceEquipment,
  MaintenanceRequests, MaintenanceDowntime, ProductsCatalog, ManufacturingMethods, AdminLifecycle, Notifications, Tasks, PeopleLifecycle:
  86 of 86 (12 specs, 19.5 s feature time; MaintenanceProcedures 4 features, about 1.7 s). Before the fixes, the merged branch passed
  70 of 70 and 86 of 86. Lint not re-run (no screen changed by the review). Not run: ./moq test-apps, the acceptance suite.
- For the lead:
  - Budget share: mr-mantle MaintenanceProcesses +0.5 s for R2's case; mr-boss unchanged (R1 swaps calls for renders of a transition).
  - Merge hot spots: mr-mantle MaintenanceProcedures.js (approve), MaintenanceProcesses.spec.js (appended feature); mr-boss
    MaintenanceProcedures.spec.js, and this plan.
  - The user's calls: none open from P6 (the Nov 12 call is built). For a decision: whether the `/mantle` REST task writers should refuse
    managed work like `add#TaskTime` (recommended for `add#WorkEffortProduct` and `store#TimeEntry`, which change a procedure or take time
    on one; the grant is ADMIN's alone today).

### P7 — Execution checklists and evidence

Design §4.3, §3 ProcedureSteps, StepResponse and ExecutionAmendment, the WorkItemDetail mount row, §12 (the
completed checklist); MT-04.

- **Mantle records.** `WorkEffortCheck` and `WorkEffortCheckEvidence`, the response kind enumerations, the waiver
  as its own decision record; readings as Measurement rows (F43), a counter reading through
  `record#MaintenanceMeter` with the Measurement linked.
- **Mantle `ProcessServices`:** `get#ProcessExecution`, `record#ProcessStep` (the input of design §4.3; a failed
  observation saved with the step unresolved; a recheck appended), `waive#ProcessStep` (only where the execution's
  policy allows, by a supervisor), `amend#ProcessExecution` with its preview. The root's Complete reads the gate:
  required leaves complete or waived, dependencies met. Accepted evidence is protected in the content services the
  file screens call, not by caller (P0, F69: RecordFiles' `get#ContentType` takes `catalogCanChange` for a managed
  work effort from a Mantle evidence policy, which removal and new versions obey).
- **The step guard** (design §4.3): the P3 refusals cover steps; a step's status moves only by its response, waiver,
  skip with a reason, or the root's close.
- **WorkItemDetail's Maintenance context** (crosscut §3.12): follow-up tasks linked to a root, on Manufacturing's
  pattern (WorkItemDetail.xml:430-475); a process step opened there shows its link to WorkOrderDetail and no
  Complete.
- **Voice note.** A voice note is an audio file attached as evidence, transcribed by
  `SpeechServices.transcribe#Audio` into the check's notes; the XSD has no audio capture input (F38), and none is
  built (§5 Q10).
- **Screens:** WorkOrderDetail's Procedure tab (ProcedureSteps as a tree, StepResponse, the waiver and amendment
  dialogs), leading on a phone with the next actionable step; the completed checklist and exception record print,
  stored at close.
- **Specs:** Mantle `test/work/ProcessChecks` (a missing file, a wrong unit and an out-of-range reading leave the
  step open; a waiver keeps the failure and is refused where the policy forbids it and to a technician; a blocked
  predecessor refused through `record#ProcessStep` and through `set#TaskStatus`; independent leaves in progress
  together; deleting accepted evidence refused; an amendment invalidating an acceptance; a group complete only by
  its children).
- **Usable when** (`acceptance/client/Maintenance/MaintenanceChecklistWalk`; design §11.2 "Nested and concurrent
  steps", "Evidence/checks", "Publication and amendment" in its amendment half): a technician works the compressor
  service on a phone, fails a pressure reading, attaches a photo and rechecks; the supervisor waives one allowed
  step with a reason and closes; the printed checklist shows the failure, the recheck and the waiver.

**Built Nov 12 (P7).** mr-mantle 54eaa9e3, mr-boss 389626d0 and this note's commit (branch `mnt/p7`); mr-moqui unchanged, no Rust built.
- Checked first (the code over the plan): P6's step policy fields and MaintenanceProcedures.js (instructions through the WeatBasedOn
  link, `responseText`), P3's lifecycle in MaintenanceWork.js (`refusalOf`, `transitionWorkOrder`, the time entry points, `schedule`'s
  `replacePartyId`) and P5's downtime hooks; F69 and F105 (RecordFiles' `get#ContentType` WorkEffort branch, `get#RecordFile`'s per-row
  immutability, `check#RecordDrivePath`'s immutable paths for new and restored versions, `remove#RecordFile`; `update#WorkEffortContent`
  rewrites a file); F43 (Measurement's work, asset, meter and AssetMaintenance fields; MeasurementType.productMeterTypeId names a counter);
  F94 (`record#MaintenanceMeter` took any workEffortId); F113 and F160 (WorkOrders.js `openAssignments`, the replacement in `schedule`);
  F159 (the `/mantle` REST writers; `start#Timer` calls `create#TimeEntryClockIn`, `stop#Timer` calls `store#TimeEntry` with the
  entry's id); F26 (WorkItemDetail's Manufacturing context; Commons' `get#TaskAccess` answers a managed record not found); F38
  (`transcribe#Audio` is internal, answers a reason rather than failing, and leaves consent to its caller); F128 (Procedure at 20);
  F118 (no setup row is needed: the tab, its template and WorkItemDetail's mount inherit the root's grants); the Default status flow
  (a step carries no flow; every step move is one of its rows).
- Mantle:
  - Records (`entity/WorkProcessEntities.xml`, appended): `WorkEffortCheck` (step, root, response kind, outcome WcoDone, WcoPass,
    WcoFail or WcoSkipped, the Measurement and the value and unit as entered, observed and recorded time, who, notes, transcript,
    findings, superseded check and correction reason, state WcsAccepted, WcsUnresolved, WcsSuperseded or WcsInvalidated, the
    amendment that invalidated it, an operation key), `WorkEffortCheckEvidence` (a check's file or voice note), `WorkEffortWaiver`
    (the step, the failed check it answers, the reason and who; ended by an amendment) and `WorkEffortExecutionAmendment` (root,
    reason, effective time, what changed and what it invalidated, operation key); the content types WectCheckEvidence, WectVoiceNote
    and WectCompletedChecklist.
  - `mantle/work/ProcessChecks.js` over ProcessServices' new services: `get#ProcessExecution` (a reader of the work: the tree with
    depth, groups, state, policy, the dependencies not done, assignees, instruction, the current check and failures, the waiver, what
    the caller may do, a reading's units; the checks newest first, waivers, amendments, the next actionable step, the gate and the
    stored checklist), `record#ProcessStep` (start, respond, skip; the root in progress, a leaf, the assigned technician with
    MAINTENANCE_EXECUTE or a supervisor, the step's and its groups' dependencies; a missing file or comment, another unit, an
    out-of-range reading and a failure saved as an unresolved check; a recheck appended; a correction superseding a check; an
    accepted check completes the step; every reading a Measurement, a counter reading also through `record#MaintenanceMeter` with
    its meter linked; files uploaded with the response stored on the root named for the step; the operation key answering a
    retry), `transcribe#CheckVoiceNote`, `waive#ProcessStep` (a supervisor, the step's policy, a reason; the failure stays),
    `amend#ProcessExecution` (a supervisor on open work; the policy fields from now and the dependencies; the preview naming the
    acceptances it invalidates and the complete steps waiting for a reopened one), `get#ProcessChecklist`
    (template/work/Checklist.print.html.fancy), `get#EvidencePolicy` and `check#EvidenceChange`. Groups follow their children.
  - MaintenanceWork.js: Complete refused while a required leaf is open (`STEPS_OPEN`; `get#` lists it among the blockers); Close moves
    complete nodes to Closed, cancels the open ones and stores the completed checklist (a PDF that cannot be made is logged); Cancel
    cancels the open nodes; `schedule`'s replacement leaves a done step's assignee (F160); the three time entry points call the time
    services inside `asManagedOwner`.
  - The generic writers (F159): `add#WorkEffortProduct` and `create#TimeEntryClockIn` call `check#ManagedWork`; `store#TimeEntry` calls
    it for a new entry and for one moved onto other work. WorkProcesses.js `asManagedOwner(workEffortIds, body)` is the owner's way
    through: it holds the roots in the execution context's user map for the call (no parameter reaches it) and `managedReason`
    admits their work. `update#WorkEffortContent` refuses a check's evidence (`EVIDENCE_PROTECTED`). `record#MaintenanceMeter` in work
    refuses equipment that is not the work order's target (`WORK_TARGET_MISMATCH`, F94). MaintenanceProcedures.js exports
    `executionInstruction` and `responseText`.
- BOSS:
  - Screens: WorkOrderDetail/Procedure (index 20): the next step first (its instruction, Start, the response form), the steps with
    Start, Respond, Skip, Waive, Correct, the checks, waivers and amendments, Amend (preview, then the reason) and Print checklist;
    `template/MaintenanceChecklistParts.xml` (the transitions and StepResponseForm: Pass or Fail, a reading in a unit of its kind,
    notes, a photo or file, a voice note, the observed time, a correction's reason). Overview lists the work's follow-up tasks.
    WorkItemDetail's Maintenance context (owner contract, on Manufacturing's pattern): mounted at Maintenance/WorkOrders/WorkItemDetail,
    a follow-up task (an ordinary task with a current Caused By or Relates To link to a root the user reads) with a Work orders box
    and the way back; a work order's root or step is not available there and links to its WorkOrderDetail, with no Complete
    (`ironstone.maintenance.WorkItemServices` get#WorkItemContext and find#FollowUpTasks, WorkItems.js). WorkOrderDetail's comment.
  - Services: RecordFilesServices' `get#ContentType` takes Mantle's evidence policy for a work effort (no new file on closed or
    cancelled work; a check's evidence immutable in the list, refused by `remove#RecordFile`, new and restored versions); WorkOrders.js'
    participant counts an open step's assignee only (F160) and `amendmentChange` (the amendment form as one change); Maintenance.js'
    link path.
  - Demo (BossZMaintenanceDemoData.xml): the air handler's follow-up task (maint.tech's, Caused By its work order). No execution of the
    AC-200 service is seeded (see the findings).
- Specs:
  - Mantle `test/work/ProcessChecks` (5 features, about 2.4 s): a blocked step refused through `record#ProcessStep` and through
    `set#TaskStatus` (MANAGED_WORK), a group's response refused, another technician and another organization refused, independent leaves
    in progress together, the group complete only by its children; a missing file, another unit, an out-of-range reading, a missing
    comment and a failure leaving the step open, a recheck appended, a retry under its key answered and changed input refused, a
    Measurement for each reading, Complete refused (STEPS_OPEN) and the gate and next step read; a waiver refused to a technician, where
    the policy forbids it and without a reason, the failures kept, the evidence policy protecting the photo and `update#WorkEffortContent`
    refused, a required step's skip refused and an optional one skipped; an amendment refused to a technician, previewed, applied
    (the check invalidated, the step and its group reopened), Complete refused again then done, Close closing the steps and storing the
    checklist, an amendment of closed work refused, no file added to it; new time, a clock-in and a part refused on managed work while
    `record#MaintenanceTime` passes, a reading in work of other equipment refused, a done step keeping its assignee when a leaver's work
    moves.
  - BOSS `test/Maintenance/MaintenanceChecklists` (4 features, about 0.5–1.2 s): the Procedure tab's one qvt render as the technician
    (the next step, the group, the failed reading's finding, the blocked step, the progress, no supervisor action), RecordFiles keeping a
    check's evidence and removing a file no check names, Admin's participant (an open step's assignee counted, a done one's not), and
    the Overview's one render (the follow-up task), WorkItemDetail's Maintenance render of the follow-up task and a step's context (not
    available, its link). A spec-local technician with maint.tech2's groups works it and the work order is cancelled at the end, so the
    demo technicians' counts other specs read are unchanged. `MaintenanceAccess` gains the checklist rule (its technician reads, another
    technician NOT_ASSIGNED, Retail RECORD_UNAVAILABLE; a waiver refused to the technician, the supervisor passing the permission).
  - Acceptance, written and not run: `acceptance/client/Maintenance/MaintenanceChecklistWalk` (5 features: the planner makes the
    service from the procedure and the supervisor approves it; the technician on a phone works the group, the oil change with a photo
    and the filter; the pressure fails and a recheck with a photo fails again; the supervisor amends the filter step to need a photo and
    the technician answers it again; the supervisor waives the pressure step, completes and closes; the checks and waiver stay and the
    printed checklist is a PDF).
- Tests run (release binary 03:39, `--nobuild`, this worktree): mr-mantle ProcessChecks, MaintenanceProcesses, WorkProcess,
  PeopleChecklists, MaintenanceWorkOrders, MaintenanceManagedWork, MaintenanceIntake, MaintenanceOutages, MaintenanceScope,
  MaintenanceResources, WorkTimeEntries, TimeImports, WorkTimesheets, WorkProjectServices, WorkProjectBilling, WorkProjectMilestones,
  WorkProjectReports, ProductionShopFloor, AccountingProjectCost, MethodTemplates, ProductCatalogImport, Dav: 144 of 144 (22 specs,
  33.9 s feature time). mr-boss MaintenanceChecklists, MaintenanceAccess, MaintenanceWorkOrders, MaintenanceProcedures,
  MaintenanceDowntime, MaintenanceRequests, MaintenanceEquipment, RecordFiles, WorkItemDetail, Tasks, TimeEntries, AdminLifecycle,
  PeopleLifecycle, ManufacturingDowntime, ManufacturingShopFloor, PeopleTime, Billing, ProjectsAccess, Chatter, AccountingIssuedFiles,
  AccountingPaymentFiles: 157 of 157 (21 specs, 31.3 s feature time). Client MaintenanceWorkOrdersWalk 1 of 1 (7.9 s).
  `./moq run --debug --nobuild lint --screens`: 136 flagged sites, the baseline (the Overview's new condition was flagged and fixed);
  the new screens appear only in the information list of unnamed containers; the release symlink intact. Prettier (3.10.1, the repo's
  .prettierrc.json) on the new JavaScript and on WorkProcesses.js, MaintenanceProcedures.js, WorkOrders.js and MaintenanceSpecLib.js;
  MaintenanceWork.js, MaintenanceResources.js, Maintenance.js and MaintenanceAccess.spec.js were not prettier-clean before P7 and are
  left so. Not run: ./moq test-apps, the acceptance suite.
- Inventories: usl-inventory's Added table for ProcessServices' P7 services, find#ProcessInstructions, check#ManagedWork's new callers,
  store#TimeEntry, update#WorkEffortContent and record#MaintenanceMeter; ss-inventory's P7 line (no baseline form maps to the checklist).
- Design edits: design-maintenance's header, §3 WorkOrderDetail (the Procedure tab and follow-up tasks), the WorkItemDetail mount row,
  §4.3 and §12's completed checklist, as built.
- Findings (provisional, for the lead to number):
  - A step's moves (planned to in progress, complete or cancelled; complete back to in progress for an invalidation) are all rows of
    the Default status flow, which steps follow (instantiation sets no flow); no flow row is added.
  - `store#TimeEntry`'s guard is for a new entry and an entry moved onto managed work; an entry already on it keeps its timesheet
    rules, so a maintenance timer still stops from the shell's timer and when another timer starts (`start#Timer` stops it through
    `store#TimeEntry`), and Projects' TimeEntries still corrects one.
  - The owner's way through is `asManagedOwner`, in the execution context's user map; only `check#ManagedWork` honors it (the lists'
    `managedIds` do not). P9's planned parts on a managed step go through it if they call `add#WorkEffortProduct`, or write
    WorkEffortProduct directly as the procedure requirements do.
  - Evidence uploaded with a response is stored on the work order's root, named for the step, so Files shows it and RecordFiles
    protects it there; a file on the step is accepted too. Every file a check names is protected, an unresolved check's included (a
    waiver keeps the failure), and the stored checklist.
  - The `.fancy` templates take JavaScript expressions: FreeMarker's `?has_content` fails to compile; the checklist template uses
    `.length`.
  - StepResponse's "expected update time" is not taken: the step is read for update, a done step is refused (STEP_DONE) and the
    operation key answers a retry.
  - The amendment changes a step's policy fields and dependencies; adding or removing an open execution's steps is not built.
  - WorkOrderDetail's Overview tab had no render in the regression suite; MaintenanceChecklists renders it once.
  - No execution of the AC-200 service is seeded: MaintenanceProcedures' spec reads that maint.tech has no work of it and counts
    maint.tech2's open work orders, so a seeded one would change both; the specs and the walk make their own.
- For the lead:
  - Budget share: mr-mantle ProcessChecks about 2.4 s; mr-boss server MaintenanceChecklists about 1 s and MaintenanceAccess +0.2 s;
    client unchanged (MaintenanceWorkOrdersWalk 7.9 s); budgets not changed.
  - Merge hot spots: mr-mantle `entity/WorkProcessEntities.xml` and `ProcessServices.xml` (appended), `MaintenanceWork.js` (two requires
    at the top, the three time entry points, `schedule`'s replacement, `refusalOf`'s complete, the close hook after the closure
    policy, `get#`'s blockers), `WorkProcesses.js` (`managedReason`, the export), `MaintenanceProcedures.js` (an export before approval),
    `TimeServices.xml`, `WorkEffortServices.xml` (`add#WorkEffortProduct`: P9 may meet it), `MaintenanceResources.js`; mr-boss
    `screen/Shared/WorkItemDetail.xml`, `RecordFilesServices.xml`, `WorkOrders.js`, `Maintenance.js` (one link path after P6's),
    `screen/Maintenance/WorkOrders.xml` (the mount), `WorkOrderDetail.xml` (its comment), `WorkOrderDetail/Overview.xml` (actions and an
    appended box), `BossZMaintenanceDemoData.xml` (appended), `MaintenanceSpecLib.js` (one id after P6's), `MaintenanceAccess.spec.js`
    (an appended feature), the inventories and design-maintenance. Not touched: MaintenanceEntities.xml, screen/Maintenance.xml,
    BossSetupMaintenanceData.xml.
  - The user's calls: whether a technician's voice note may be sent to the transcription model without an organization consent
    setting (`transcribe#Audio` leaves consent to its caller; built meanwhile: transcribed when a model is bound, the audio kept either
    way); whether an amendment should add or remove an open execution's steps (built meanwhile: policy fields and dependencies only).

**Review Nov 12 (P7).** mr-mantle 25d1c7b8, mr-boss e8f31e1a and this note's commit (branch `mnt/p7`), over the worker's 54eaa9e3,
389626d0 and f8e7d89a, after "Merge master into mnt/p7" (mr-mantle 167aa3e6, mr-boss 9508b5d9; mr-moqui's `mnt/p7` already at master
4994093f). Reviewed `git diff master...mnt/p7` in both repos against P7's text, §2, §4, F26, F38, F43, F69, F94, F113, F159 and F160,
design §3 (ProcedureSteps, StepResponse, ExecutionAmendment, the WorkItemDetail row), §4.3, §9 and §12, AGENTS.md and Practices-App-Dev;
read the generic content services (`create#`, `update#`, `save#WorkEffortContentFile`), Manufacturing's instruction EECA, RecordFiles'
`get#ContentType`, `get#RecordFile`, `remove#RecordFile` and `check#RecordDrivePath`, TaskServices' guarded writers, CalDAV's task
collection, Commons' `get#TaskAccess`, the timer and time services, the Rust `ec.user.context` (moqui-core `context/factory.rs`,
`script/host/user.rs`), and P9's `MaintenanceMaterials.js` on `mnt/p9`.
- The merge: master's P15 came in. mr-mantle merged clean. mr-boss: `BossZMaintenanceDemoData.xml` keeps P7's follow-up task and then
  P15's room policy and blackout; design-maintenance's header has P7's line above P15's; `MaintenanceAccess.spec.js` names both phases in
  its header and keeps P15's feature, then P7's.
- Checked and found sound:
  - The step guard. A step's status moves only through `record#ProcessStep` (start, respond, skip with a reason), `waive#ProcessStep` and
    the root's close or cancel (`closeExecution`): `set#TaskStatus`, `update#Task`, `move#Task`, `delete#WorkEffort` and the party writers
    call `check#ManagedWork` (MANAGED_WORK, the spec's `set#TaskStatus` case); CalDAV leaves a managed step out of the collection and
    lists the root read only; Commons' `get#TaskAccess` answers a managed record MANAGED_WORK; WorkItemDetail's Maintenance context shows a
    step as not available, with its work order's link and no Complete.
  - Gates. A blocked step (its own or a group's dependency) is refused by `record#ProcessStep` (DEPENDENCY_OPEN) and by `set#TaskStatus`;
    independent leaves are in progress together; a group takes no response and follows its children (`rollUp`); Complete is refused while a
    required leaf is open (STEPS_OPEN, and the blockers list); Close closes complete nodes and cancels open ones.
  - `asManagedOwner`. `ec.user.context` is a map of the execution context (`ContextState.user_context`, made empty per context, never filled
    from request parameters, a screen field or the session); a service called inside the body shares it (the intended call and its own
    nested calls), an async call or job gets a new context; the value is restored or removed in `finally`. Only `managedReason` reads it;
    the time entry points wrap exactly the one time call after their own checks; `start#Timer`/`stop#Timer`/`store#TimeEntry` change no
    status inside it (the `TimeEntryUpdateTask` EECA writes actuals only).
  - F159's guards. `add#WorkEffortProduct` and `create#TimeEntryClockIn` refuse managed work; `store#TimeEntry` refuses a new entry and an
    entry moved onto managed work, an entry already there keeping its rules (so a timer stops). Projects' and Commons' time specs pass
    (WorkTimeEntries, TimeImports, WorkTimesheets, WorkProject*, TimeEntries, PeopleTime, Billing). P9: `MaintenanceMaterials.js` writes
    planned parts with entity-auto `create#`/`update#WorkEffortProduct` and issues through `issue#AssetToWorkEffort`, neither guarded, so
    its path survives; were it to call `add#WorkEffortProduct` it would need `asManagedOwner` (see For the lead).
  - Waivers. MAINTENANCE_SUPERVISE in the work order's organization only (a technician PERMISSION_DENIED, another organization
    RECORD_UNAVAILABLE), the step's execution policy (WAIVER_NOT_ALLOWED), a reason; the failed checks stay Unresolved beside the waiver.
  - The checklist PDF: `Checklist.print.html.fancy` is HTML-escaped, no cost; stored at Close as the root's WectCompletedChecklist under
    `dbresource://mantle/content/workEffort/`, served by `printChecklist` for a reader (check#Record, then `get#ProcessChecklist`'s scope).
  - WorkItemDetail (owner contract): every Maintenance branch is behind `mntTask` (`appRoot === 'Maintenance'`); Manufacturing's,
    Projects', People's and Customer Service's sections and conditions are unchanged; WorkItemDetail, Tasks and ManufacturingShopFloor pass.
  - The participant (F160): `openAssignments` counts a step's assignee only while the step is open; `schedule`'s replacement leaves a done
    step's assignee; AdminLifecycle, PeopleLifecycle and the spec's participant feature pass.
  - Access: the Procedure tab's transitions call `check#Record` and then Mantle, which checks permission, scope and assignment again;
    ProcessServices are allow-remote false with no BOSS grant; `get#EvidencePolicy` is a data check read by RecordFiles only after its own
    record check.
- Fixes:
  - R1 (the user's call, Nov 12; feature): a voice note is transcribed only when the organization turns transcription on.
    `MaintenancePolicy.voiceNoteTranscription` (off by default) through `get#`/`store#MaintenancePolicy` and Settings' Work policy ("Transcribe
    technicians' voice notes"); `transcribe#CheckVoiceNote` answers TRANSCRIPTION_OFF and sends nothing when it is off; the audio stays
    the check's evidence either way, and the response says the organization does not transcribe. ProcessChecks' voice note feature (off by
    default: TRANSCRIPTION_OFF; turned on, the speech model is asked; the audio row kept); MaintenanceWorkOrders' Work policy render
    checks the setting.
  - R2 (the user's call, Nov 12; feature): an amendment adds or removes steps of an open execution. `amend#ProcessExecution` takes an action
    per change: add (under the root or a group, GROUP_REQUIRED under a step; a complete group it joins reopens and is named among the
    invalidations) and remove (a step, or a group with its steps, not started and with no check; STEP_STARTED otherwise; cancelled and
    named in the amendment's `removedList`, the dependencies on and of it ended, so what waited for it no longer does, a finding of the
    preview). The gate leaves a cancelled leaf out (a required step is never skipped, so only a removed one is cancelled before close);
    the tab and print say "Removed"; the amendment's summary lists what was added and removed. The Procedure tab's Amend dialog takes
    Change, Add a step (name, under, response) or Remove a step not started; WorkOrders.js `amendmentChange` builds each. ProcessChecks'
    amendment feature (a started step, a completed step and a started group refused; a technician refused; a step under a leaf refused;
    the preview naming the reopened group and the removed step and writing nothing; applied: the group reopened, the new step planned in
    the tree, the removed step cancelled, the gate with the new step and without the removed one; the new step answered completes the
    group) and MaintenanceChecklists' dialog feature (the form's add and remove reaching the preview; a started group refused).
  - R3 (security, high): the evidence guard was only in `update#WorkEffortContent` and RecordFiles: entity-auto `delete#` and `update#`
    (the entity REST, any server path) removed or changed a check's evidence and the stored checklist, `save#WorkEffortContentFile` wrote new
    bytes over evidence, `check#EvidenceChange` did not cover the stored checklist, a check's evidence link could be deleted to unprotect
    the file, a closed or cancelled work order took new files through `create#WorkEffortContent`, and anyone could store a
    WectCompletedChecklist. Now an entity guard (Work.eecas.xml `WorkEffortEvidenceProtected`, run before, on Manufacturing's pattern)
    refuses the update or delete of evidence and a stored checklist (EVIDENCE_PROTECTED) and a new file on closed or cancelled managed work
    (WORK_CLOSED), and admits a completed checklist only under the close's `asManagedOwner`; `WorkEffortEvidenceLinkKept` refuses changing
    or deleting a WorkEffortCheckEvidence row; `save#WorkEffortContentFile` calls `check#EvidenceChange`. ProcessChecks' evidence feature
    (each path refused; an ordinary task's file still deleted). RecordFiles (11 features) passes unchanged.
  - R4 (correctness, medium): a waiver completed a step whose dependencies were open, so a step could be complete before its predecessor.
    `waive#ProcessStep` now refuses DEPENDENCY_OPEN as a response does, and `canWaive` waits for them. In ProcessChecks' amendment feature.
  - R5 (failure tolerance, low): a stored checklist that failed after a service error left the error in the close's messages, failing the
    close the comment says stands. `storeChecklist` makes the PDF first and isolates its messages (pushErrors, clear, pop).
- Findings (for the lead to number):
  - `find#FollowUpTasks` (the Overview's box) lists the names of the tasks linked to a work order without checking the reader may see each
    task in Commons; WorkItemDetail itself does (Commons' visibility). Linking needs a writer who sees both, so the exposure is small.
  - A supervisor may amend a step's `waiverAllowed` to Y and then waive it; both are the supervisor's, each with its reason on record.
  - `issue#AssetToWorkEffort` and entity-auto WorkEffortProduct writes are not guarded by F159 (P9's path relies on this).
  - The evidence guard runs on every WorkEffortContent write: one root read on create, one evidence-link count on update or delete.
  - A service failure inside the close's transaction may still mark it rollback-only; with R5 the likely failure (the PDF) happens before
    any service call.
  - Correction to the Built note: adding and removing an open execution's steps is now built (R2).
  - Prettier 3.10.1 was run on ProcessChecks.js, WorkProcesses.js, WorkOrders.js and the three changed specs (ProcessChecks.js and the
    specs were not prettier-clean before; the diff includes that reformatting).
- Tests (release binary 03:39, `--nobuild`, this worktree, after the merge and the fixes): mr-mantle ProcessChecks, MaintenanceProcesses,
  WorkProcess, PeopleChecklists, MaintenanceWorkOrders, MaintenanceManagedWork, MaintenanceIntake, MaintenanceOutages, MaintenanceScope,
  MaintenanceResources, WorkTimeEntries, TimeImports, WorkTimesheets, WorkProjectServices, WorkProjectBilling, WorkProjectMilestones,
  WorkProjectReports, ProductionShopFloor, AccountingProjectCost, MethodTemplates, ProductCatalogImport, Dav, ResourceBookingPolicy:
  156 of 156 (23 specs, 46.0 s feature time; ProcessChecks 8 features, about 4.0 s). mr-boss MaintenanceChecklists, MaintenanceAccess,
  MaintenanceWorkOrders, RecordFiles, WorkItemDetail, MaintenanceProcedures, MaintenanceDowntime, MaintenanceRequests, MaintenanceEquipment,
  Tasks, TimeEntries, AdminLifecycle, PeopleLifecycle, ManufacturingDowntime, ManufacturingShopFloor, PeopleTime, Billing, ProjectsAccess,
  Chatter, AccountingIssuedFiles, AccountingPaymentFiles: 159 of 159 (21 specs, 50.8 s feature time; MaintenanceChecklists 5 features, about
  1.3 s); MaintenanceScheduling 3 of 3. Before the fixes, the merged branch passed ProcessChecks 5 of 5 and MaintenanceChecklists,
  MaintenanceAccess and RecordFiles 30 of 30. `./moq run --debug --nobuild lint --screens`: 136 flagged sites, the baseline, none in the
  changed screens; the release symlink intact. Not run: ./moq test-apps, the acceptance suite (MaintenanceChecklistWalk not changed).
- For the lead:
  - Budget share: mr-mantle ProcessChecks +1.6 s (three features); mr-boss MaintenanceChecklists +0.1 s; budgets not changed.
  - Merge hot spots: mr-mantle `entity/Work.eecas.xml` (two EECAs appended), `entity/MaintenanceEntities.xml` (a MaintenancePolicy field),
    `MaintenanceWork.js` (the policy's default, read and store), `MaintenanceSettingsServices.xml`, `WorkEffortServices.xml`
    (`save#WorkEffortContentFile`), `ProcessChecks.js`, `ProcessServices.xml`, `WorkProcesses.js` (one export); mr-boss
    `Settings/WorkPolicy.xml` (P13 or P18 may add settings beside it), `Procedure.xml`, `MaintenanceChecklistParts.xml`, `WorkOrders.js`,
    the design header and §9, usl-inventory.
  - P9's merge: its planned parts and issues survive F159's guard (entity-auto writes, `issue#AssetToWorkEffort`); a planned part added
    through `add#WorkEffortProduct` would be refused MANAGED_WORK unless wrapped in `asManagedOwner`. A part file on closed work would be
    refused by R3's guard (WORK_CLOSED).
  - The user's calls: both of Nov 12 are built (R1, R2). None open from P7.

### P8 — Dispatch: teams, skills and qualifications

Design §3 AssignSchedule and BulkWork, §9 Teams, review Y4 and Y8; MT-01, MT-02. People's services are used as
built (impl-people P3, P9, P12, P14, P18; P0).

- **Mantle.** `MaintenanceTeamDefaults`, dated by team (resource scope, default assignee, the plus-tag intake
  address, a project link); `MaintenanceSettingsServices.find#MaintenanceTeams` over People's teams and
  `store#MaintenanceTeamDefaults`. `schedule#MaintenanceWorkOrder` ranks candidates from
  `ResourceServices.find#StaffingCandidates`, which takes one skill and weekly hours today (F34) and gains a list of
  skills with minimum levels and a window in hours, and from `get#PartyCapacity`; it calls People's
  `check#Qualifications` for each step's required qualification and answers a warning, or a refusal when the policy
  blocks. Start rechecks. `act#MaintenanceWorkOrders` assigns, schedules or cancels each selected root on its own.
- **Screens:** WorkOrders' AssignSchedule with the ranked picker and the qualification state, BulkWork with the
  count confirmation and a result per order; Teams (TeamList, TeamMembers read only with a link to People's
  OrgStructure, TeamDefaults); Settings gains the qualification check (warn or block).
- **Demo data:** a maintenance team of three in ORG_ZIZI_SERVICES with skills, one with an expired qualification
  and one on leave next week.
- **Specs:** Mantle `test/work/MaintenanceDispatch` (the expired qualification warns, and blocks under the policy;
  a person on leave ranks below a free one; team membership grants no permission; one refused order in a bulk
  assignment names itself and the rest go on).
- **Usable when** (`acceptance/Maintenance/MaintenanceDispatchWalk`; design §11.2 "Labor cost and qualification",
  its qualification half): the planner assigns the compressor service, sees the technician on leave ranked last and
  a warning on the expired qualification, and under the block policy cannot assign them. **Gate 2.**

### P9 — Parts and stock

Design §3 PlannedParts and PartsUsed, the InventoryAvailability and MaterialIssueReceipt mount rows, "Charging a
project", §13.2's stock and ledger bullets; MT-08, MT-09 (Accounting's AC-24).

- **Mantle records.** WorkEffortProduct gains a unit, a required date and a source facility, and its existing key
  (work effort, product, from date) is the planned line's identity (F30, §4); AssetIssuance gains the cost centre
  and the project it is charged to (F30); `mantle.ledger.config.MaintenanceCostPolicy`, dated by organization,
  maintenance purpose and facility (AC-24, F32).
- **Mantle `mantle.work.MaintenanceExecutionServices`:** `store#MaintenanceMaterial`, `issue#MaintenanceMaterial`
  (a new issuance each time, to the step, under Warehouse's posting guard and `STOCK_ISSUE` for the source facility
  as well as the maintenance grant) and `return#MaintenanceMaterial` (a new receipt naming its issuance, at its
  cost, never more than the net issued). (P0, F71: Production's issue and return are the pattern; the cost a return
  carries is the returned asset's `acquireCost`; a supplies part would post as a fixed asset, so it is refused or
  routed explicitly.) A customer's asset under repair is never issued as a spare.
- **Accounting** (owner contract, AC-24): the issuance posting of a managed maintenance work effort takes the
  expense account of the cost policy with the facility, cost centre and project dimensions, instead of the
  same-owner WIP account (AssetAutoPostServices.xml:267-277); a return posts back with the original dimensions, its
  receipt's credit routed as the issuance's debit was, not to WIP (AssetAutoPostServices.xml:73, :91; F71); no
  mapping is a named posting exception. The policy's rows are edited in Accounting's PostingMappings. Only an
  issuance to a managed maintenance root or step is routed: production, project and every other issuance post as
  today, and Accounting's and Manufacturing's ledger specs pass unchanged. Built here following design-accounting
  (§4), and written into design-accounting §18 and impl-accounting §7.
- **Shared screens.** MaterialIssueReceipt at `Maintenance/WorkOrders/MaterialIssueReceipt`: a `Maintenance` branch
  with `ironstone.maintenance.MaterialServices.get#MaterialSource` and `get#MaterialAction` after its
  `check#Record`, as Manufacturing's is (MaterialIssueReceipt.xml:40-64; F31), with Issue, Return unused and
  History. InventoryAvailability at `Maintenance/WorkOrders/InventoryAvailability`, once the catalog context admits
  the app root (P0, F67: P2's `maintenanceContext()` gains the Stock tab and the facilities the user reads).
- **Screens:** WorkOrderDetail's Parts tab (PlannedParts with "Add suggested parts" from the model's `PatSparePart`
  rows, PartsUsed); WorkHeader gains the cost centre and the project.
- **Demo data:** spare stock at the services warehouse, an order with a planned and an issued part and a return,
  and the cost policy for ORG_ZIZI_SERVICES.
- **Specs:** Mantle `test/work/MaintenanceMaterials` (an assigned technician without the stock permission refused;
  a second issue is a second issuance; a return above the net issued refused and a partial one at the original
  cost) and `test/ledger/MaintenanceExpenseRouting` (the issue posts to the mapped expense with its dimensions and
  not to WIP; no mapping is an exception and no posting; the return reverses the same dimensions; one operation
  posts once).
- **Usable when** (`acceptance/Maintenance/MaintenancePartsWalk`; design §11.2 "Time and stock", "Financial
  routing"): the planner adds the suggested filter, a technician with the stock grant issues two and returns one,
  the work order shows one used, and Accounting's journal shows maintenance expense with the facility and cost
  centre; with the mapping removed the issue stops with the named exception.

**Built Nov 12 (P9).** mr-mantle and mr-boss on branch `mnt/p9` (hashes in the lead's reply); mr-moqui unchanged, no Rust built.
- Checked first (the code over the plan): F30 (WorkEffortProduct's key and fields; AssetIssuance's `facilityId`, `assetMaintenanceId`,
  no cost centre or project), F31 (MaterialIssueReceipt's sources and its `materialAction`), F32 and F71 (AssetAutoPostServices'
  WIP rule for an issuance and a receipt with a work effort; StockPosting.js begin, scope, stock, period, complete; Production.js
  issuePlan and returnPlan; `issue#AssetToWorkEffort`'s `issuanceFields`; `receive#Asset` posting inside the call, before the
  caller can name the issuance), F67 and F24 (SharedContext.js `maintenanceContext()`, Inventory.js' scoped roots and
  InventoryAvailability's `capabilities.read` and Stock tab), F96, F118, F128, P6's `store#ProcessRequirements` and `copyRequirements`
  (dated WorkEffortProduct rows of a node), MaintenanceWorkOrder's existing `costCenterId` and `projectWorkEffortId` (audited, never
  written before), AccountingPolicy.js `dimensions` (a facility dimension must be the posting organization's own, a cost centre an
  internal organization rolling up to it), AccountingSetup.js' mapping kinds, and `AcctgTrans.workEffortId` as the project
  (ProjectCosts.js).
- Mantle:
  - Records (`entity/MaintenanceMaterialEntities.xml`, a file of its own): WorkEffortProduct gains `quantityUomId`, `requiredDate`,
    `sourceFacilityId`; AssetIssuance `costCenterId` and `projectWorkEffortId`; `mantle.ledger.config.MaintenanceCostPolicy` (surrogate
    key; organization, maintenance kind or any, facility or every facility, GL account, from and thru, all audited).
  - `mantle.work.MaintenanceExecutionServices` over `MaintenanceMaterials.js`: `get#MaintenanceMaterials` (planned lines with step,
    unit, required date, source facility, issued, returned, used, left; issues and returns once each; used net of returns; the model's
    PatSparePart suggestions not yet planned; the nodes to plan on; free stock per line with `withStock`; values only with
    MAINTENANCE_COST_VIEW; each list one query, F96), `store#MaintenanceMaterial` (plan or supervise, open work; a change ends the
    open row and starts the next, naming the row read, RECORD_CHANGED; remove; `addSuggested`; a supplies part SUPPLIES_REFUSED; a
    source facility of the work's organization), `issue#MaintenanceMaterial` (StockPosting.js begin with STOCK_ISSUE and the
    operation key, the assigned technician of the root or step or a supervisor, approved or started work, the stock locked in the
    user's facilities, inventory only, the planned product, available, the work organization's own, free, the cost policy for an
    organization that posts (COST_POLICY_MISSING), the period; then `issue#AssetToWorkEffort` with `issuanceFields` (cost centre,
    project, primary AssetMaintenance): a new issuance each time to the root or step) and `return#MaintenanceMaterial` (the issuance
    locked, never more than is left of it, into the original asset or a location of the same owner at its `acquireCost`; the receipt
    names its issuance). The work order's charge: `store#MaintenanceWorkOrder` takes `costCenterId` and `projectWorkEffortId`
    (validated, VALUE_INVALID) and `get#` names them (`chargeFields`, `chargeOf`; two grouped lines in MaintenanceWork.js).
  - AC-24 (owner contract with Accounting): `MaintenanceCostRouting.js`, called from `post#AssetIssuance` (an inventory issuance to a
    managed root or step, not a template: the most specific policy row in effect for the asset owner, kind and the work's facility or
    nearest ancestor with a row; the expense entry carries the facility, the nearest of the chain the organization owns, and the cost
    centre; the transaction the project; no row: error journal, `MAINTENANCE_COST_UNMAPPED` with what to map) and `post#AssetReceipt`
    (a return of such an issuance credited to the account and dimensions of the issuance's own debit). `receive#Asset` posts the
    receipt before the return names its issuance, so a receipt with a managed work effort and no source is routed by the policy at
    once (never WIP), and the return reposts it the issuance's way only when the two differ (`settleReturnPosting`, as repost does:
    one transaction remains). Every other issuance and receipt posts as before. Posting defaults: the mapping kind `maintenance`
    (Maintenance expense) in AccountingSetup.js' table, its key text, its checks (an account, a MaintenanceKind, a facility of the
    organization), an existing row only ended, and a clone copying only the rows of every facility.
- BOSS:
  - Services: `ironstone.maintenance.MaterialServices` get#MaterialSource and get#MaterialAction (`Materials.js`, F31); Maintenance.js'
    choices `costCenters`, `projects`, `stockParts`, `partFacilities` and link paths `WorkOrders/MaterialIssueReceipt` and
    `WorkOrders/InventoryAvailability`; Products' `maintenanceContext()` gains the Stock tab and `facilityIds` (the facilities of the
    scope's organizations that hold stock), and Inventory.js scopes to them as for Warehouse (F67); Accounting's choices gain
    `enum:MaintenanceKind`.
  - Screens: WorkOrderDetail's Parts tab at 40 (F128): Planned parts with Add part, Add suggested parts, Edit and Remove, each line's
    Stock link, Issue and return for a stock issuer, Parts used (net totals and the movements, value for a cost reader);
    `WorkOrders/MaterialIssueReceipt` and `WorkOrders/InventoryAvailability` mounted (hidden); Overview's facts and Edit gain the cost
    centre and project (the template's storeWorkOrder passes them). Shared/MaterialIssueReceipt (owner contract with Warehouse and
    Manufacturing): a `Maintenance` branch in `materialAction` and the actions, the `workEffortId` parameter declared, the Unused
    returns box moved into its own section shown for a production run (as before) or a maintenance work order, the history's asset
    plain text under Maintenance. Accounting's PostingDefaults: the kind's fields (maintenance kind, facility, from, until) and its
    precedence note.
  - Demo (BossZMaintenanceDemoData.xml): maint.tech in BOSS_WAREHOUSE_ISSUE (STOCK_ISSUE; maint.tech2 has none); the AHU-2 coil gasket;
    filter, belt and gasket stock in Services' stock warehouse; the air handler's leak with three gaskets planned, two issued, one
    returned (rows as the services write them; demo rows post nothing); the compressor's oil service with its filter planned; Services'
    MaintenanceCostPolicy (613200000, every facility and kind). No setup rows were needed (F118: none added).
- Specs:
  - Mantle `test/work/MaintenanceMaterials` (3 features, 0.8 s): suggestions added, a change ending the line, a stale change, supplies
    and a technician's plan refused; an assigned technician without STOCK_ISSUE refused, a second issue a second issuance, a retry
    answering the first, supplies, another organization's stock and another product refused; a return above what is left refused, a
    partial one at the original cost naming its issuance, the used total.
  - Mantle `test/ledger/MaintenanceExpenseRouting` (5 features, 0.6 s): the issue to the site's row (the room's nearest) with the room,
    cost centre and project, not WIP, posted once on a retry, a cost centre of another organization refused; an ordinary task of the
    same owner still to WIP; no mapping refused by name and the backstop to the error journal unposted (`MAINTENANCE_COST_UNMAPPED`); the
    return credited to the issuance's account and dimensions after the policy changed, one transaction; Posting defaults' kind (another
    organization's facility refused, a rewrite refused, an end allowed, the list's key text).
  - BOSS `test/Maintenance/MaintenanceParts` (4 features, 0.3 s): the Parts tab's one qvt render (planner), MaterialIssueReceipt's
    Maintenance render (the technician's Issue, Return unused, History), InventoryAvailability under Maintenance (Services' warehouse,
    not Retail's), the compressor's suggestion and the charge's choices. `MaintenanceAccess` gains the issue rule (maint.tech issues;
    maint.tech2 and the planner refused PERMISSION_DENIED; Retail's stock in Services' warehouse OWNER_MISMATCH; 0.2 s).
  - Acceptance, written and not run: `acceptance/Maintenance/MaintenancePartsWalk` (4 features: create, charge and add suggested parts;
    issue two and return one through MaterialIssueReceipt's transition; the journal's expense with the room and cost centre and the
    return; the mapping ended in Posting defaults refusing the next issue by name, a new mapping letting it go).
- Tests run (release binary, `--nobuild`, this worktree): mr-mantle every ledger spec (19, Accounting's and Manufacturing's
  ProductionCostClose among them), the twelve Production specs, WarehouseProduction, the Warehouse stock specs (shipment and product,
  17), the Maintenance specs, MaintenanceResources and WorkProcess: 486 of 486 (58 specs, 125.9 s feature time); after the last changes
  MaintenanceMaterials, MaintenanceExpenseRouting, AccountingSetup, AccountingControls, MaintenanceWorkOrders and MaintenanceProcesses
  63 of 63. mr-boss MaintenanceParts, MaintenanceAccess, MaintenanceWorkOrders, MaintenanceEquipment, MaintenanceProcedures,
  MaintenanceRequests, MaintenanceDowntime, ProductsSharedContext, ProductsInventory, ManufacturingMaterials, ManufacturingAccess,
  WarehouseInventory, WarehousePacking, WarehouseAccess, PurchasingReplenishment, CustomerServiceOrders, CommerceAccess, AccountingAccess,
  AccountingValuation, AccountingProductionCostClose: 135 of 135 (20 specs, 39.5 s); a first run failed two MaintenanceParts checks
  that depended on MaintenanceAccess' issue running first (fixed: the demo plans three gaskets). Client MaintenanceWorkOrdersWalk 1 of
  1 (8.26 s). `./moq run --debug --nobuild lint --screens`: 136 flagged sites, as before; the changed screens appear only in the
  information list of unnamed containers; both target symlinks intact. Prettier (`npx prettier --config` from inside each component:
  from mr-moqui's root it skips the components, which its .gitignore lists) clean on the new JavaScript and on AccountingSetup.js and
  Inventory.js; MaintenanceWork.js, Maintenance.js, SharedContext.js and MaintenanceAccess.spec.js were not prettier-clean before P9 and
  are left so. Not run: ./moq test-apps, the acceptance suite.
- Inventories: ss-inventory's RunProducts and RunConsumed forms and a P9 line; usl-inventory's post#AssetIssuance, post#AssetReceipt,
  issue#AssetToWorkEffort and receive#Asset rows, and an Added table for MaintenanceExecutionServices, the charge, the Posting defaults
  kind and MaterialServices.
- Design edits: design-maintenance's header, §3 PlannedParts, PartsUsed, "Charging a project", the InventoryAvailability and
  MaterialIssueReceipt mount rows, MT-08, MT-09 and §13.2's stock and ledger bullets as built; design-accounting's header,
  PostingDefaults' "Maintenance expense routing" and §18's AC-24 row; impl-accounting §7's note of other plans' builds.
- Findings, numbered by the lead F195 to F202 in order:
  - `receive#Asset` posts the receipt inside the call (AssetReceiptGlPost), before a caller can name its issuance, so Production's
    return posts to WIP by the work effort and a maintenance return could not be routed by its source at posting. Built: a receipt to
    managed work is routed by the policy at once and reposted the issuance's way only when they differ.
  - Supplies are refused rather than routed: Mantle's TODOs (AssetAutoPostServices) still post a supplies issuance as a fixed asset; a
    supplies route is Accounting's to design.
  - A facility dimension must be owned by the posting organization (AccountingPolicy.js `dimensions`), so an ownerless room carries
    its nearest owned ancestor; the policy itself matches the room's ancestors.
  - The policy's "maintenance purpose" is built as the work's MaintenanceKind (corrective, preventive), with any kind as the fallback;
    MaintenanceType rows would be a finer key if Accounting wants one.
  - Missing mappings are not yet listed in Posting defaults' MissingMappings nor in Maintenance's readiness (P18).
  - The plan's planned line is per node and product (one open row); Issue on MaterialIssueReceipt is from planned lines only, an
    unplanned part is planned first.
  - Demo issuances and returns are rows, not postings (data load runs no SECA), so the demo journal holds no maintenance expense until a
    part is issued in the app.
  - maint.tech is now in BOSS_WAREHOUSE_ISSUE (a capability group with no Warehouse root) for the demo; no spec run here checks it against Admin's matrix.
- For the lead:
  - Budget share: mr-mantle +1.4 s (MaintenanceMaterials 0.8 s, MaintenanceExpenseRouting 0.6 s); mr-boss server +0.5 s
    (MaintenanceParts 0.3 s, MaintenanceAccess +0.2 s); client unchanged; budgets not changed.
  - Merge hot spots: mr-mantle `AssetAutoPostServices.xml` (two inserts each in post#AssetIssuance and post#AssetReceipt),
    `AccountingSetup.js` (prettier-formatted), `MaintenanceWork.js` (one require line, two lines in storeWorkOrder and getWorkOrder),
    `MaintenanceServices.xml` (store#'s parameters); mr-boss `screen/Shared/MaterialIssueReceipt.xml`, `screen/Maintenance/WorkOrders.xml`,
    `WorkOrderDetail.xml` (comment), `WorkOrderDetail/Overview.xml`, `template/MaintenanceWorkOrderParts.xml` (storeWorkOrder),
    `Maintenance.js` (workChoices, linkPaths, choiceSources' end), `SharedContext.js`, `Inventory.js`, `Accounting.js`, `PostingDefaults.xml`,
    `data/BossZMaintenanceDemoData.xml` (appended), `MaintenanceSpecLib.js` (ids), `MaintenanceAccess.spec.js` (appended feature), the
    inventories, design-maintenance, design-accounting and impl-accounting. No edit to `MaintenanceEntities.xml`, `screen/Maintenance.xml`
    or `BossSetupMaintenanceData.xml`. P7's guard on `add#WorkEffortProduct` does not touch this path (store#MaintenanceMaterial writes the
    entity after its own checks).
  - The user's calls: none blocking. For a decision: whether the maintenance purpose key of MaintenanceCostPolicy should be the kind
    (built) or the MaintenanceType; and whether a supplies part should get a route of its own (refused meanwhile).

**Review Nov 12 (P9).** mr-mantle 4ea88788 and 51d5426f (R3), mr-boss c4aed074 and this note's commit (branch `mnt/p9`), over the worker's ae1ad9ce
and c47ce459, after merging master (Maintenance P15) in both repos: mr-mantle 2bb8c441 (clean), mr-boss f701867e
(BossZMaintenanceDemoData's appended rows, design-maintenance's header and MaintenanceAccess' header and appended feature, each keeping
both sides; mr-moqui's `mnt/p9` already at master 4994093f). Reviewed `git diff master...mnt/p9` in both repos against P9's text, §2,
§4, design §3 PlannedParts and PartsUsed, the two mount rows, "Charging a project", MT-08, MT-09, §13.2, design-accounting's
PostingMappings and §18 (AC-24), F30, F31, F32, F67, F71, AGENTS.md and Practices-App-Dev; read AssetAutoPostServices' post#,
repost# of AssetIssuance and AssetReceipt and their SECAs, StockPosting.js, Production's return#UnusedMaterial (the pattern),
MaintenanceAccess.js' assignment and requireWork, AccountingSetup.js' mapping and clone, Shared/MaterialIssueReceipt's three branches,
SharedContext.js' contexts and Inventory.js.
- Checked and found sound:
  - AC-24 as an owner contract: `MaintenanceCostRouting.js` routes only an issuance (and a receipt) whose work effort is a managed
    MaintenanceWorkOrder root or a step under one, never a template; a production run, a project task and any other work effort
    finds no MaintenanceWorkOrder and posts as before (an ordinary task of the same owner still to WIP, in the spec). Every ledger,
    Production, Warehouse stock and Maintenance spec passes unchanged (below). No mapping: the issuance's account is left empty, the
    transaction goes to the error journal named `MAINTENANCE_COST_UNMAPPED` with what to map and does not post, and the issue entry
    point refuses before it (`COST_POLICY_MISSING`) for an organization that posts and a cost to post. One operation posts once:
    the operation key answers a retry with the first issuance or receipt.
  - The receipt's posting order: `receive#Asset` posts in AssetReceiptGlPost before the return names its issuance. Built, such a
    receipt was credited to WIP and `settleReturnPosting` unposted, deleted and reposted it the issuance's way (one transaction left,
    never committed with WIP); R2 routes it to the policy at once, so the repost runs only when the policy or the charge changed since
    the issue. A return cannot post twice: post#AssetReceipt refuses a receipt already posted, the repost deletes before posting, and
    the operation key answers a retry. A return is at the original cost: into the original asset at its `acquireCost`, or a new asset
    copying it; the credit takes the account, facility and cost centre of the issuance's own debit and its project, read from the
    issuance's posting (else the policy as of the issue date), so a policy ended between issue and return does not move it (spec).
  - Stock authority: `issue#` and `return#` begin with `STOCK_ISSUE` (StockPosting's begin), lock the stock in a facility of the
    user's organizations (the posting guard's scope, as Warehouse and Production), then require the technician assigned to the root
    or the step with MAINTENANCE_EXECUTE, or a supervisor, on a work order the user reads. An assigned technician without the stock
    grant is refused PERMISSION_DENIED (MaintenanceMaterials, MaintenanceAccess); another owner's stock is refused (RECORD_UNAVAILABLE
    outside the user's facilities, OWNER_MISMATCH inside them); the equipment under repair is NOT_STOCK, and a customer's asset is
    another owner's.
  - Returns never exceed the net issued: the issuance is locked and its receipts summed before the receipt is written
    (QUANTITY_EXCEEDS_ISSUED, spec).
  - MaterialIssueReceipt and InventoryAvailability: Warehouse's and Manufacturing's branches are unchanged; the Unused returns box,
    moved into its own section, shows for a production run as before (ManufacturingMaterials, WarehousePacking, WarehouseInventory
    and the access specs pass). The Maintenance branch's `clearErrors` after its own check does not hide a posting's refusal (the
    error response redirects): MaintenanceParts now posts a refused issue through `materialAction` and reads the reason.
  - `maintenanceContext()`'s Stock tab and InventoryAvailability: there is no stock read permission; they read the facilities of the
    organizations the user reads in Maintenance that hold those organizations' stock (as Customer Service's and Commerce's mounts
    scope theirs), quantities only. `costRead` and every price, cost and method capability are false in the context, so Inventory.js
    shows no value and neither do its exports.
  - Restricted values: `get#MaintenanceMaterials` gives a value only with MAINTENANCE_COST_VIEW (the Parts tab and MaterialIssueReceipt's
    History hide the column without it, `financialRead` from it); stock options carry quantities, not costs (MaintenanceParts: no
    value for the planner).
  - The demo grant: `BOSS_WAREHOUSE_ISSUE` carries only STOCK_ISSUE and opens no Warehouse screen; Manufacturing's demo already puts
    its material operator in it for the same purpose. A reasonable demo grant: maint.tech issues parts in Services' facilities only,
    and every other stock posting needs its own app's record check as well.
  - The charge: `store#MaintenanceWorkOrder` validates the cost centre (an internal organization rolling up to the work's) and the
    project (a project of the work's organization), VALUE_INVALID otherwise (spec); the choices are the work organization's only.
  - Posting defaults' `maintenance` kind: ACCOUNTING_ADMIN of the organization, a facility of the organization, a row ended not
    rewritten, a clone copying only the rows of every facility under new ids.
- Fixes:
  - **R1 (the user's call of Nov 12; accounting).** A supplies part issued to managed maintenance work is routed to the cost policy's
    expense too, overriding Mantle's fixed-asset posting for that case only: `MaintenanceCostRouting.js` routes inventory and supplies;
    for supplies the policy's expense replaces the `GatUnissuedFixedAsset` debit and the credit stays the asset account the supplies
    were received into, and a return reverses it with the issuance's dimensions. Supplies issued anywhere else post as before.
    `store#` and `issue#MaintenanceMaterial` plan and issue supplies (`SUPPLIES_REFUSED` removed; equipment stays NOT_STOCK),
    `get#MaintenanceMaterials` offers supplies stock and Maintenance.js' `stockParts` choice supplies parts. Specs:
    MaintenanceExpenseRouting's supplies feature (the issue on the site's row with the room, cost centre and project; the same
    supplies issued to an ordinary task posted as a fixed asset, the same asset account credited; the return), MaintenanceMaterials
    (supplies planned and issued); they fail on the code as built. design-maintenance §13.2 and MT-09, design-accounting's
    "Maintenance expense routing" and usl-inventory as built.
  - **R2 (medium, accounting; the Built note's claim).** The Built note says a receipt to managed work naming no issuance yet is
    routed by the policy at once; the code returned no route without `sourceAssetIssuanceId`, so every return first posted Cr WIP and
    was always reposted. `receipt()` now routes such a receipt by the policy as of its date (inventory or supplies, the work order's
    cost centre and project), never WIP; post#AssetReceipt names `MAINTENANCE_COST_UNMAPPED` as post#AssetIssuance does. Spec:
    MaintenanceExpenseRouting's receipt feature (receive#Asset to the work order credits the site's expense with its dimensions, not
    WIP); it fails on the code as built.
  - **R3 (low, accounting; the lead's call on the review's recommendation, under §2's dated rows).** A policy row's end could be set
    before issues already posted under it (`maintenanceMapping` checked only that it followed its start), so a later
    `repost#AssetIssuance` would take another row. Posting defaults' maintenance kind now refuses an end earlier than now, on a new
    row or an existing one, with `DATE_INVALID` (an end already stored is left as it is). Spec: MaintenanceExpenseRouting's Posting
    defaults feature (a backdated end and a new row ended in the past refused); MaintenanceExpenseRouting, AccountingSetup and
    AccountingControls 48 of 48 after it. design-accounting's Maintenance expense routing as built.
- Findings, numbered by the lead F203 to F207 in order:
  - A clone run twice copies the every-facility rows twice (the rows have a surrogate key, so no conflict is found); harmless for
    routing (the first in effect wins) but untidy.
  - An issue checks the work order's status, not the step's: a part may be issued to a completed step of started work.
  - `maintenanceFacilities` reads the distinct facilities of the organizations' stock on every Maintenance catalog context; cheap at
    the demo's size, a facility-owner query would scale better.
  - The demo's cost policy (613200000 for ORG_ZIZI_SERVICES) is exercised only by the acceptance MaintenancePartsWalk (not run): no
    regression spec checks that Services posts to that account.
  - P7's `check#ManagedWork` guard (on master after P7): `store#MaintenanceMaterial` writes WorkEffortProduct directly after its own
    checks and `issue#` calls `issue#AssetToWorkEffort` with `noConsumeProduct: ignore`, so neither reaches `add#WorkEffortProduct`;
    to be confirmed by MaintenanceMaterials and MaintenanceExpenseRouting after the merge.
- Tests (release binary, `--nobuild`, this worktree):
  - mr-mantle MaintenanceExpenseRouting and MaintenanceMaterials 10 of 10 (0.73 s and 0.92 s); then every ledger spec
    (AccountingActivities, AccountingApplicationRules, AccountingBookDates, AccountingControls, AccountingCurrency,
    AccountingFiscalPeriodDays, AccountingFixedAssets, AccountingPaymentCorrections, AccountingPeriodClose, AccountingProjectCost,
    AccountingReceivables, AccountingReports, AccountingSetup, AccountingValuation, FinancialReports, LedgerMaintenance,
    MaintenanceExpenseRouting, ProductionCostClose, ReceiptAdjustments), the Production specs (Changes, Costs, Downtime, Materials,
    Orders, Policy, Quality, Quantities, Reports, Schedule, ShopFloor, Subcontract), WarehouseProduction, WorkProcess, the Maintenance
    specs (Intake, ManagedWork, Materials, Outages, Processes, Scope, WorkOrders), AccountingInternalTransfers, WarehouseReturns,
    WarehouseTransfers, WarehouseReceiving, WarehouseAdjustments, WarehousePacking and PurchaseReceipts: 417 of 417 (50 specs,
    164.9 s).
  - mr-boss MaintenanceParts, MaintenanceAccess, MaintenanceWorkOrders, MaintenanceEquipment, ProductsSharedContext,
    ProductsInventory, ManufacturingMaterials, ManufacturingAccess, WarehouseInventory, WarehousePacking, WarehouseAccess,
    CustomerServiceOrders, CommerceAccess, AccountingAccess, AccountingValuation, AccountingProductionCostClose: 123 of 123 (16 specs,
    88.2 s; MaintenanceParts 0.42 s).
  - Lint not run (the review changed no screen). Prettier clean on MaintenanceCostRouting.js, MaintenanceMaterials.js, the two Mantle
    specs and MaintenanceParts.spec.js. The target symlink is intact. Not run: ./moq test-apps, the acceptance suite.
- For the lead:
  - Budget share: mr-mantle +0.25 s over the Built note (MaintenanceExpenseRouting 0.73 s, MaintenanceMaterials 0.92 s); mr-boss
    MaintenanceParts +0.1 s (0.42 s); budgets not changed.
  - Merge hot spots added by the review: mr-mantle `AssetAutoPostServices.xml` (post#AssetReceipt's result block), mr-boss
    `Maintenance.js` (`productOptions`), design-accounting's "Maintenance expense routing", design-maintenance's header. When P7 lands,
    merge master again and run MaintenanceMaterials, MaintenanceExpenseRouting and WorkProcess.
  - The user's calls: none open; both of Nov 12 are built (the kind with the any-kind fallback as built, supplies routed by R1), and
    the backdated end is R3.

### P10 — Purchasing and outside service

Design §3 PurchaseLinks, CompleteWork's outside-service line and the OrderDetail mount row; MT-10.

- **Mantle `MaintenanceServices.link#MaintenancePurchase`:** an `RqtPurchase` request through
  `RequestServices.create#Request` with its link to the work, and `AssetMaintenanceOrderItem` rows for the order
  lines that fulfil it (F45); never an OrderItemWorkEffort. It places and approves nothing.
- **Completion:** CompleteWork's "Accept outside service" calls `OrderServices.accept#ServiceItem`
  (OrderServices.xml:3233) with the work's evidence, under Purchasing's own check.
- **Purchasing** (owner contract, design-purchasing "Maintenance purchases"): its RequestDetail Overview shows the
  originating work order with a link, which impl-purchasing did not build (F45); a read added to its context, with
  its request services and specs unchanged.
- **Screens:** WorkOrderDetail's Purchasing tab; OrderDetail at `Maintenance/WorkOrders/OrderDetail`, a read-only
  `Maintenance` branch of the shared screen for the linked orders of the work.
- **Specs:** Mantle `test/work/MaintenancePurchases` (completing the work completes no order item; the acceptance
  recorded once under its key; a planner without Purchasing's grant links and cannot place).
- **Usable when** (`acceptance/Maintenance/MaintenancePurchaseWalk`): a planner requests a motor rewind from the
  work order, Purchasing sources it to a PO, the work order shows the PO line, and at completion the supervisor
  accepts the service with the technician's photo.

### P11 — Costs

Design §3 WorkCosts, §8 MaintenanceCostReport, review Y2, "Charging a project"; MT-08 (labor price), MT-09, MT-11.

- **Mantle `mantle.work.MaintenanceReportServices.get#MaintenanceCosts`:** parts at issued cost less linked returns;
  labor as approved hours at the costing rate People's `get#CostingRate` (impl-people P10) answers for the technician's
  position class and the entry's work type, never `vendorHourRate`, with unapproved and unpriced hours apart (P0, F33);
  an entry takes the cost centre and project of its root, and TimeEntry gains no field; outside service from its
  acceptance or its bill, once; grouped by currency, and by project where orders name one; answered only to
  `MAINTENANCE_COST_VIEW`.
- **The approval threshold's cost half** (§4; P3): MaintenancePolicy gains an estimated-cost threshold with its
  currency, unset by default and compared only where set. The Approve gate computes the work's estimated cost when
  it is asked and stores nothing: each planned part of the root and its steps (P9's WorkEffortProduct rows) as its
  `estimatedQuantity` at the product's approved standard cost for the organization
  (`mantle.product.CostServices.get#ApprovedStandardCost`), plus P3's estimated hours at the rate `get#CostingRate`
  answers for the work type and the assigned technician's position class. A part with no approved cost, hours
  with no rate or with no one assigned, or an amount in another currency leaves the estimate unknown, and unknown
  is over the threshold. Outside service is not in it: its request and order have Purchasing's approval (P10).
  The planner is told that the work needs a supervisor and never the amount. MaintenanceSettings gains the field.
- **Projects** (owner contract): a repair charged to a project shows in the project's money as a cost, read from
  the issuances and time that carry the project.
- **Screens:** WorkOrderDetail's Costs tab for the cost reader; MaintenanceCostReport (CostOptions, CostTotals,
  CostSources) with its CSV and print.
- **Specs:** Mantle `test/work/MaintenanceCosts` (labor priced at the class rate and an entry with no rate shown
  unpriced; root and step time not counted twice; two currencies not summed; an estimate and its bill counted once;
  a planner without the cost permission answered no amount; planned work over the cost threshold held for a
  supervisor, one with an unpriced part held too, and one under both thresholds approved on create).
- **Usable when** (`acceptance/Maintenance/MaintenanceCostWalk`; design §11.2 "Labor cost and qualification", its
  cost half, and "Reports and scope" in part): `maint.cost` reads the compressor repair's parts, labor and outside
  service with their sources and no pay rate; the planner's WorkOrderDetail has no Costs tab; the project shows the
  repair.

### P12 — Customer repair

Design §3 (the customer repair context, the consent recheck), §12 (the intervention report), crosscut §4.6
"Customer repair"; MT-10. Customer Service's repair record is built (F12); this phase makes it a managed work order.

- **Mantle.** `adopt#MaintenanceRecord` admits a repair `link#WarrantyWork` made: its `WepMaintenance` task becomes
  the managed root, the asset stays the customer's, and the service organization on the work order is authoritative.
  `WarrantyServices.link#WarrantyWork` ensures the root when the organization's policy manages work, and
  `update#WarrantyWork` (WarrantyServices.xml:271) calls `transition#MaintenanceWorkOrder` for a managed repair
  instead of moving the AssetMaintenance itself. Start and a parts issue recheck the claim's decision and consent
  through `WarrantyServices`; a missing or changed consent is a blocker. Completion sets AsMntCompleted, so the
  built `WarrantyWorkFinished` rule tells the agent; nothing closes the case or bills.
- **Access:** a customer-owned asset is read through the repair link, never by changing its owner (design §1.1).
- **Customer Service** (owner contract; F57): RepairLinks shows the safe repair summary, opens WorkOrderDetail for
  a user with maintenance scope, and gains "Send intervention report", which sends the stored report through
  Customer Service's own mail draft. With the organization's policy off, `link#WarrantyWork` and
  `update#WarrantyWork` do what they do today (§5 Q5), and Customer Service's warranty specs pass unchanged.
- **Screens:** WorkOrderDetail's case and custody links with the coverage and consent summary; the customer
  service and intervention report (html-print and PDF: work done, parts and labor where permitted, outcome, the
  acknowledgment attachment), stored on the work order and sent only by Customer Service's action, which
  impl-customer-service §7 left to this plan.
- **Specs:** Mantle `test/request/WarrantyManagedRepair` (a claim's repair linked twice has one root; Start refused
  after consent is withdrawn; completing the work leaves the case open; the asset's owner unchanged).
- **Usable when** (`acceptance/Maintenance/MaintenanceCustomerRepairWalk`; design §11.2 "Request and customer
  repair", its repair half): an agent approves a warranty repair and links work; the technician executes it as a
  work order with a part; the agent is told when it finishes, sends the intervention report, and closes the case
  herself. **Gate 3.**

### P13 — Preventive plans and due maintenance

Design §5.1 (schedule and due semantics), Plans and PlanDetail; MT-05 (schedules and the due projection).

- **Mantle records.** `MaintenanceSchedule` and `MaintenanceScheduleTerm` (design §5.1 and PlanDetail's field
  list), one trigger a schedule, dated terms.
- **Mantle `mantle.work.MaintenancePlanServices`:** `find#MaintenanceSchedules`, `get#MaintenanceSchedule`,
  `store#MaintenanceSchedule` (activation refused with no time zone, P2's field, or a named procedure that does not
  qualify, each a named finding; a procedure is optional, the user's call of Nov 12, replacing the built
  `PROCEDURE_REQUIRED` refusal: with none, P14 generates an ad hoc work order with the plan's name and estimate; a
  draft's terms are edited in place until activation, dated rows from it, the user's call of Nov 12 as built), `get#MaintenanceDue` and `find#MaintenanceDue`: calendar cadence in the resource's zone with
  month-end clamping and the business-day move by `EventServices.get#NextBusinessDay`, which keeps the obligation
  date; meter thresholds from accepted completion readings only; missing or stale readings answered as unknown.
  `get#AssetMaintenanceNeeded` is left as it is for the baseline (F11) and is not called.
- **Screens:** Plans (FindPlans, PlanRows, NewPlan); PlanDetail (ScheduleTerms, DueExplanation, PlanAction; the
  occurrence history and generated work in P14); EquipmentDetail's plans pane.
- **Demo data:** a monthly calendar plan on a room, a 250-hour plan on the compressor from its model default with
  an asset override, a plan whose meter is stale.
- **Specs:** Mantle `test/work/MaintenanceDue` (the 31st clamps in a short month and returns to the 31st; a
  daylight-saving change keeps the local due time; a holiday (a `WepHoliday` event, read through
  `get#NextBusinessDay`, F64) moves the planned day and not the due date; a planned or
  cancelled maintenance and a synthetic threshold advance nothing; a stale meter answers unknown, not "not due"; a
  term change leaves earlier executions alone).
- **Usable when** (`acceptance/Maintenance/MaintenancePlansWalk`; design §11.2 "PM chronology"): the planner
  activates the three plans; DueExplanation names the last accepted reading, the increment and the next threshold
  for the compressor, and "reading older than 30 days" for the stale one.

**Built Nov 12 (P13).** mr-mantle b074f1d8, mr-boss 88aaf9a2 and this note's commit (branch `mnt/p13`); mr-moqui unchanged, no Rust built.
- Checked first (the code over the plan): P2's `Facility.timeZone` and `facilityTimeZone` (MaintenanceResources.js, inherited), `record#MaintenanceMeter`
  and its reasons (AmrReading, AmrWork, AmrReset, AmrCorrection), `ProductMeter.isCumulative`, AssetMeter's key and `workEffortId`; P3's work order
  record, the AssetMaintenance synchronization (no `productMaintenanceId`, no interval on a work order's maintenance record) and `requestHash`;
  P6's `procedureOf`, `effectiveAt` and `applicabilityRefusal` (MaintenanceProcedures.js); F11 (`create#AssetMaintenance` writes an AssetMeter
  reading of a nonzero `intervalQuantity` with the record's id and no reason; `get#AssetMaintenanceNeeded` left alone and not called); F64 with
  People P9 merged (`EventServices.get#NextBusinessDay` reads WepHoliday events owned by the organization or in the categories named; People's
  holiday calendars are WcatHoliday categories whose holidays have no owner, written by `ScheduleServices.store#Holiday`; `get#Holidays` needs a
  People staff read, so Maintenance does not call it); F16 and §5 Q9; F118 (no setup row needed: the screens inherit the root's grant and the
  Mantle services check themselves); F119 (no availability row is read). People P9's `get#PartyCapacity` is P8's.
- Mantle:
  - Records (`entity/MaintenancePlanEntities.xml`, a file of its own): `MaintenanceSchedule` (one asset or one facility, an optional
    ProductMaintenance of the asset's model, the target's organization, the `MaintenanceSchedule` status Draft, Active, Ended with its flow, from
    and thru, the end's reason, a revision, the operation key and hash) and `MaintenanceScheduleTerm` (dated by fromDate; trigger
    `MaintenanceScheduleTrigger` MstCalendar or MstMeter, cadence `MaintenanceScheduleCadence` MscFixed or MscCompletion, interval and unit
    TF_day/wk/mon/yr, `firstDueLocal` (the first obligation's local date and time in the target's zone, text, see the findings), meter, baseline
    value and date, `maxReadingAgeDays`, `businessDaysOnly`, `holidayCategoryId` (a People holiday calendar), `leadDays`, procedure, maintenance
    type, team, the change's reason and who; the trigger fields audit-logged); `MaintenanceWorkOrder.maintenanceScheduleId` by `extend-entity`
    in the same file (the plan a work order executes; P14's generation sets it).
  - `mantle.work.MaintenancePlanServices` (`MaintenancePlans.js`): `find#MaintenanceSchedules` (scoped in the query before paging: text,
    organization, equipment, facility with those inside it, model, state, trigger, procedure, team; each row's next due and data age, F83's
    active organization for an all-organizations holder), `get#MaintenanceSchedule` (the terms resolved with each value's origin, plan or model
    default, the stored terms, the history, the due, the findings, canEdit/canActivate/canEnd), `store#MaintenanceSchedule` (MAINTENANCE_PLAN or
    _SUPERVISE in the target's organization: create under an operation key, OPERATION_KEY_CONFLICT; TARGET_REQUIRED, TARGET_INVALID; terms in
    place for a draft, for an active plan from an effective time with a reason (REASON_REQUIRED, DATE_INVALID), the earlier term ended and
    kept; RECORD_CHANGED, PLAN_ENDED; activate with the findings ZONE_REQUIRED, PROCEDURE_REQUIRED, PROCEDURE_NOT_QUALIFIED, INTERVAL_REQUIRED,
    FIRST_DUE_REQUIRED, METER_REQUIRED, METER_NOT_COUNTING, BASELINE_REQUIRED; end with a reason), `get#MaintenanceDue` and `find#MaintenanceDue`
    (the active plans' due, a failing plan named in `failures` and the rest listed, at most 500 plans, paged in memory). MAINTENANCE_VIEW reads.
  - The projection: a fixed cadence's obligations from `firstDueLocal`, months and years from the first date's day clamped to a short month and
    back; each instant read in the zone (`ec.l10n.parseTimestamp`), so 09:00 stays 09:00 across daylight saving; a completion covers the earliest
    obligation not yet covered that falls before the next obligation after it (an early completion covers its due date), and the obligations
    passed and not covered are overdue; a completion cadence one interval after the last completion. The planned day is the next business day
    through `get#NextBusinessDay` (the organization's holidays and the term's People holiday calendar) when the term asks for business days, the
    due date kept; lead days give the day work is made from. A meter: a counting meter of the model; the baseline the reading taken in the last
    counted completion (in its work tree or on its maintenance record), else the plan's; the usage since then summed across a reset; the next
    threshold; a reading older than the maximum age (30 days unless set) answers unknown (READING_STALE), as does no baseline. A counted
    completion is a work order of the plan complete or closed, or a completed AssetMaintenance of the plan's model default; a planned or
    cancelled one counts nothing, and a reading `create#AssetMaintenance` made for a record not completed is no observation.
- BOSS:
  - Services: Maintenance.js' `plan` record kind (check#Record through Mantle's `requireSchedule`), the link paths `Preventive/Plans/Find` and
    `Preventive/Plans/PlanDetail`, the choices `planDefaults` (the model's maintenance defaults), `planMeters` (its counting meters) and
    `holidayCalendars` (People's calendars of the scope's organizations and the shared ones), answered to a reader of work or a planner or
    supervisor.
  - Screens: the root (Preventive at index 5 for MAINTENANCE_VIEW, _PLAN or _SUPERVISE, `g l`); `Maintenance/Preventive.xml` (a tab area, Plans;
    P14 adds DueMaintenance), `Preventive/Plans.xml` (Find, PlanDetail hidden), `Preventive/Plans/Find.xml` (FindPlans in the list's header,
    PlanRows, NewPlan), `Preventive/Plans/PlanDetail.xml` (header with Activate and More › End plan, the activation findings, tabs) and its
    `Schedule` tab (DueExplanation, ScheduleTerms with origins and Edit terms, the earlier terms); `template/MaintenancePlanParts.xml` (storePlan,
    planAction); EquipmentDetail's Maintenance tab gains Preventive plans (no new tab). No change to BossSetupData or BossSetupMaintenanceData.
  - Demo (BossZMaintenanceDemoData.xml, appended): Room 201's monthly inspection from November 30 at 09:00 (business days, 7 days ahead), the
    compressor's oil service every 250 hours over the AC-200 model's 500-hour default (baseline 1200 on September 1: last reading 1420, next
    threshold 1450), and the compressor's contactor check every 500 starts on a second counting meter of the model, `Starts`, last read on
    August 15 (stale), all drafts for the walk to activate.
- Specs:
  - Mantle `test/work/MaintenanceDue` (5 features, about 1.5 s): activation refused with no zone (ZONE_REQUIRED), no procedure and a draft one,
    a reader refused, another organization refused, the operation key's retry and conflict; the 31st on January 31, February 28 and March 31 with
    an early completion covering its due date and the overdue count; 09:00 Central before and after March 14, 2027 (15:00 and 14:00 UTC); Memorial
    Day in a People calendar moving May 31 to June 1, the due date kept, another organization's calendar refused; a planned AssetMaintenance with
    a synthetic 1600 reading and a cancelled work order advancing nothing, a completed one's reading the new baseline, a reset counted across, a
    stale reading unknown; an active plan's change refused without a reason or at a stale revision, the next term with its reason, the earlier
    one kept with 250, the completed work and its baseline unchanged, an end refused without a reason. Run with the synthetic-reading and the
    completion-status checks taken out, the meter feature fails.
  - BOSS `test/Maintenance/MaintenancePlans` (2 features, about 0.5 s): Plans/Find's qvt render (the three plans, the model default, 1450 hr,
    "Unknown: stale reading", New plan), PlanDetail's own level (`lastStandalone -3`: the name, "Follows ...", Activate) and its Schedule tab
    (the last accepted reading, the increment over the default, the next threshold, Model default, Edit terms), a reader's read with no write, the
    stale plan's due; the choices (the model's default, its two counting meters, Retail's calendar to Retail's planner with a selected value not
    found by the term and not to Services' planner, none to a technician). `MaintenanceAccess` gains the plan rule (reader and planner read; the
    resource administrator, a technician and Retail refused; the planner makes a draft for the van, the reader is PERMISSION_DENIED and Retail's
    planner RECORD_UNAVAILABLE with the same parameters) and the P13 menus and key; `MaintenanceWorkOrders`' equipment Maintenance tab render
    checks the plans pane.
  - Acceptance, written and not run: `acceptance/Maintenance/MaintenancePlansWalk` (4 features: the planner activates the three plans from
    PlanDetail and a reader may not; DueExplanation's reading, increment and threshold for the compressor and "Reading older than 30 days" for the
    contactor check until the resource administrator records a reading; the room's due date; a term change needing its reason with the earlier
    term kept; a new van plan refused activation until it names a procedure).
- Tests run (release binary 03:39, `--nobuild`, this worktree): mr-mantle MaintenanceDue, MaintenanceWorkOrders, MaintenanceScope,
  MaintenanceProcesses, MaintenanceResources, MaintenanceOutages, MaintenanceManagedWork, MaintenanceIntake: 44 of 44 (8 specs, 16.8 s feature
  time). mr-boss MaintenancePlans, MaintenanceAccess, MaintenanceWorkOrders, MaintenanceEquipment, MaintenanceProcedures, MaintenanceDowntime,
  MaintenanceRequests: 36 of 36 (7 specs, 11.6 s feature time). Client MaintenanceWorkOrdersWalk 1 of 1 (8.0 s). `./moq run --debug --nobuild lint
  --screens`: 136 flagged sites, as before; the new screens appear only in the information list of unnamed containers; the release symlink
  intact. Prettier (`npx prettier`, the repository's config) on MaintenancePlans.js, both new specs, the walk and MaintenanceSpecLib.js;
  Maintenance.js and MaintenanceAccess.spec.js were not prettier-clean before P13 (F161), so only P13's hunks are in its style. Not run:
  ./moq test-apps, the acceptance suite.
- Inventories: usl-inventory's `get#AssetMaintenanceNeeded` (not used, F11) and `get#NextBusinessDay` rows and an Added table for
  MaintenancePlanServices; ss-inventory's ProductMaintenanceList and a P13 line (AddPlannedMaintenance stays P14's).
- Design edits: design-maintenance's header, §1.2, §5.1, Plans and PlanDetail and §13.2 as built.
- Findings, numbered by the lead F177 to F185 in order:
  - Design §5.1 has generation make an ad hoc root when no procedure is configured; this phase's text and the lead's brief have activation need a
    qualifying procedure, which is built (PROCEDURE_REQUIRED, PROCEDURE_NOT_QUALIFIED). A plan without a procedure stays a draft.
  - The first due date is kept as the local date and time in the target's zone (`firstDueLocal`, text), not a timestamp: a timestamp read in the
    planner's zone would move the obligation for a target in another zone, and a draft may have no zone yet. `baselineDate` is an instant.
  - A completion counts for a plan only through `MaintenanceWorkOrder.maintenanceScheduleId` (added here by `extend-entity`; P14's generation
    must set it, and P14's occurrence may then cover the coverage rule) or a completed AssetMaintenance of the plan's model default (the
    baseline's records). Until P14 nothing in the screens links a work order to a plan.
  - A draft's terms change in place (no dated row before activation); from activation they are dated rows, ended, never overwritten.
  - `get#NextBusinessDay` finds People's holidays only through the calendar the term names (they have no owner) and skips Saturday and Sunday
    only; design §5.1's weekday set and a default calendar from People's working schedule of the organization are not built.
  - The meter units are the Uom abbreviations (`hr`, so "1450 hr"); a count meter with no unit reads in its name ("500 starts").
  - A qvt render of a record of a three-level area (`Preventive/Plans/PlanDetail`) needs `lastStandalone: "-3"` to start at the record's own
    level (`-2` starts at Plans, whose `m-subscreens-active` is empty); P14's specs of DueMaintenance and PlanDetail's tabs meet the same.
  - The demo's stale plan needed a second counting meter of the AC-200 model (`Starts`, PdMtrUseCount, no unit): P2's demo has no other
    counting meter with an old reading. The compressor's 250-hour plan reads stale too from December 1, 2026 (its last reading is November 1);
    its explanation still names the reading, increment and threshold.
  - Equipment's EquipmentRows "next PM" column (design §6) is not built; EquipmentDetail's Maintenance tab lists the plans.
- For the lead:
  - Budget share: mr-mantle MaintenanceDue about 1.5 s; mr-boss server MaintenancePlans about 0.5 s and MaintenanceAccess +0.3 s; client
    unchanged (MaintenanceWorkOrdersWalk 8.0 s); budgets not changed.
  - Merge hot spots: mr-mantle none beyond new files (the extend-entity is in MaintenancePlanEntities.xml, not MaintenanceEntities.xml); mr-boss
    `Maintenance.js` (the `plans` module line, linkPaths' end, the `plan` record kind before `asset`, `planChoices` before `workChoices`, three
    choice sources before `procedureSteps`, one gate line in `choices`), `screen/Maintenance.xml` (the Preventive item before the Equipment
    comment, `g l` after `g p`, the providers comment), `screen/Shared/EquipmentDetail/Maintenance.xml` (actions and a section before
    EquipmentRecords), `data/BossZMaintenanceDemoData.xml` (appended at the end), `MaintenanceSpecLib.js` (ids after retiredProcedureId; menus and
    keys), `MaintenanceAccess.spec.js` (header line, appended feature), `MaintenanceWorkOrders.spec.js` (three lines), the inventories,
    design-maintenance and this plan.
  - The user's calls: (1) whether a plan with no procedure may be activated and generate an ad hoc root (design §5.1) or needs a qualifying
    procedure (built, as the phase says); (2) whether a draft's terms should also be dated rows (built: in place until activation).

**Review Nov 12 (P13).** mr-mantle d7380256, mr-boss 51362d5b and this note's commit (branch `mnt/p13`), over the worker's b074f1d8,
88aaf9a2 and ab0be7bb, after merging master (P15) into both (mr-mantle 515a60f5, clean; mr-boss ff3b89c0: the demo data, design header
and menu paragraph, `MaintenanceAccess`' header and features, `MaintenanceSpecLib`'s admin menu, each keeping both sides: Preventive at
index 5 between Procedures and Equipment, Scheduling at 8); mr-moqui unchanged (already at master), no Rust built.
- Reviewed: `git diff master...mnt/p13` of both repos against the phase text, §2, design §5.1, Plans, PlanDetail and §13.2, AGENTS.md
  and Practices-App-Dev, with the lead's points first (due semantics, `firstDueLocal`, scope, activation's findings, the extend-entity,
  the meter unit) and the user's two calls of Nov 12.
- Checked and found sound:
  - The 31st: obligations are always stepped from the anchor (`stepDay(anchor, n)`), so January 31, February 28 and March 31 follow; a
    daylight-saving change keeps 09:00 (each obligation is the local day and time read in the zone, `ec.l10n.parseTimestamp`); a holiday
    moves the planned day only, the due date and state read from the obligation (`plannedDay` is display and the lead day's base).
  - Holidays: `get#NextBusinessDay` over the organization's WepHoliday events (`WorkEffortAndCategoryAppl` joins the category
    optionally, so an uncategorized holiday of the organization counts) and the term's People calendar (WcatHoliday, written by People
    P9's `store#Holiday` with no owner on the holiday, matched by the category). People keeps a calendar per employment schedule, not
    per organization, so the term naming one is right; the choice and the store admit the organization's and shared calendars only.
  - Counted completions: a work order of the plan complete or closed, or a completed AssetMaintenance of the model default the plan's
    orders do not carry; a cancelled order and a planned record count nothing, and `create#AssetMaintenance`'s reading of a record not
    completed is no observation (no reason, its record not completed). A stale reading (older than `maxReadingAgeDays`, 30) answers
    Unknown with READING_STALE, a missing baseline BASELINE_REQUIRED; a reset (AmrReset) is counted across, the threshold read on the
    new meter. A term change ends the term in effect at the effective time, keeps it, and touches no work or reading.
  - `firstDueLocal` as `yyyy-MM-dd HH:mm` text: every comparison goes through `instantIn` in the target's zone, never the text, so a
    target in another zone than the planner keeps its wall time, a draft may have no zone, and a facility's zone change keeps the local
    time (as the design wants). A time in a spring-forward gap resolves an hour later (the lenient parse); not worth a rule.
  - Scope: reads need MAINTENANCE_VIEW and cover the plan's organization (RECORD_UNAVAILABLE alike for missing and foreign), lists and
    the due list query the scope's organizations before paging (F83's active organization for an all-organizations holder), writes
    need MAINTENANCE_PLAN or _SUPERVISE and `targetOf` checks the target's organization on create; the choices check the asset's
    record or the organization; Maintenance.js' `plan` record kind goes through Mantle's `requireSchedule`. No BOSS group name.
  - Activation's refusals are named (the first finding's code, every finding's text; the same list `get#MaintenanceSchedule` shows).
  - `MaintenanceWorkOrder.maintenanceScheduleId` (extend-entity in MaintenancePlanEntities.xml, one-nofk, indexed): no writer accepts it
    from a caller (create#, store# and `bump` of MaintenanceWork.js name their fields), so only P14's generation will set it; P14 should
    pass it as an option of create#MaintenanceWorkOrder's own path, as the operation key is (the P14 text says so now).
  - The unit: "hr" is the Uom abbreviation of TF_hr (framework UnitData), shown as "1450 hr", "every 250 hr"; kept.
- Fixes:
  - R1 (the user's call, Nov 12; design): a procedure is optional on a plan. Activation needs the target's time zone; a procedure named,
    by the plan or its model default, must qualify (PROCEDURE_NOT_QUALIFIED); with none, P14 generates an ad hoc work order with the
    plan's name and estimate: `MaintenanceScheduleTerm.estimatedWorkTime` (hours, new; NewPlan, Edit terms and the Schedule tab show
    it, "None: ad hoc work from the plan" for the procedure). Replaces the built PROCEDURE_REQUIRED refusal. MaintenanceDue (a plan
    with no procedure has no findings and is activated, its estimate read back; the draft procedure still refused), the walk, the
    service description, the design (header, §5.1, Plans, PlanDetail, §13.2) and the P13 and P14 phase texts.
  - The user's second call (a draft's terms in place until activation, dated rows from it) holds as built; §5.1 and the entity say so.
  - R2 (high, correctness): a fixed cadence's completion counted however old: a completed AssetMaintenance of the model default from
    before the plan covered the first due date (so a new plan's first obligation read as done). A completion now counts once it is
    later than the obligation one interval before the first. MaintenanceDue's 31st case (a work order done in November 2026).
  - R3 (high, correctness): a meter's baseline was the last counted completion's reading even when older than the plan's own baseline
    (a model default's record from years ago moved the threshold back). It is the later of the two. MaintenanceDue's meter case (a
    completed record at 800 sixty days back).
  - R4 (medium, scope): a draft could store another organization's procedure, whose name the plan's rows and terms then showed; a
    procedure stored on a plan is a maintenance procedure of its organization (VALUE_INVALID). MaintenanceDue.
  - R5 (medium, correctness): `firstDueLocal` matched a prefix, so "2027-01-31T15:00:00Z" was kept as 15:00 local; the whole text must
    be a date and a time with no zone or offset (DATE_INVALID). MaintenanceDue.
  - R6 (medium, scope): a plan whose target moved to another organization (an asset's new owner) stayed changeable and activatable by
    the old organization; it is now refused (TARGET_MOVED) and may only be ended. MaintenanceDue (a new feature).
  - R7 (medium, correctness): a change before a term already planned for later ended that term before it began (thru before from); it
    is refused (DATE_INVALID). MaintenanceDue.
  - R8 (medium, contract): a call naming no term field (a rename) compared empty terms with the stored ones: a draft's terms were
    cleared, an active plan's change asked for a reason. A call naming no term field renames only. MaintenanceDue.
  - R9 (low, display): the terms' history showed a count meter's interval as "500 " (the Uom only) while the due said "500 starts";
    one `meterUnit` for the due, the terms and the baseline row. MaintenancePlans (the stale plan's terms and due).
  - R10 (low, efficiency): `find#MaintenanceDue` projected each plan twice (the row and the due); once now.
  Each new check fails with its fix taken out (six mutation runs of MaintenanceDue, one per fix; R4 seen failing in the first).
- Findings, numbered by the lead F186 to F194 in order:
  - The projection reads every obligation with the term in effect at the as-of time: after a change of the interval, the obligations
    before the change (and the overdue count) follow the new interval. Records are untouched, but P14's occurrences should fix past
    obligations under the term they fell in (recommended there, not changed here).
  - A completion that took no meter reading leaves the baseline at the previous reading (or the plan's), silently; P14's completion of
    a meter plan's work should require the reading (design §5.1 "capture actual readings at execution") or the explanation should say
    the last completion took none.
  - A planned AssetMaintenance later completed by the baseline's screens turns `create#AssetMaintenance`'s planned threshold into a
    valid reading at its maintenance date (F11's legacy semantics); Maintenance's own work never makes one.
  - An in-place AmrCorrection lower than the reading before it makes the next increase count from the lower value (a decrease without a
    reset is not added and becomes the base).
  - A plan cannot say "no procedure" over a model default that names one (an empty field inherits); if the default's procedure does not
    qualify, the plan cannot be activated until the default changes. A user's call if it matters (below).
  - The draft's one term keeps its creation time as fromDate after activation, so the history says "From" the day the draft was made.
  - `find#MaintenanceDue` reads at most 500 active plans and `find#MaintenanceSchedules`' model filter 1000 assets, with no truncation
    flag; fine for now, P14's due list should say when it stops.
  - The worker's MaintenancePlans.js and MaintenanceDue spec were not prettier-clean; both are formatted now (with the BOSS plan specs).
  - AGENTS.md has a changed acceptance test run; the lead's brief forbids it, so MaintenancePlansWalk (feature 4 rewritten) is
    syntax-checked only.
- Tests (release binary, `--nobuild`, this worktree): mr-mantle MaintenanceDue (6 features, 2.1 s), MaintenanceWorkOrders,
  MaintenanceProcesses, MaintenanceScope, ResourceBookingPolicy: 31 of 31 (5 specs, 14.5 s feature time). mr-boss MaintenancePlans,
  MaintenanceAccess, MaintenanceWorkOrders, MaintenanceScheduling, MaintenanceEquipment: 30 of 30 (5 specs, 10.2 s feature time).
  `./moq run --debug --nobuild lint --screens`: 136 sites, as before; the release symlink intact. Prettier on MaintenancePlans.js,
  MaintenanceDue, MaintenancePlans and MaintenancePlansWalk. Not run: ./moq test-apps, the acceptance suite.
- For the lead:
  - Budget share: mr-mantle MaintenanceDue 1.5 s to 2.1 s; mr-boss unchanged.
  - Merge hot spots: mr-mantle `MaintenancePlans.js` (prettier reformatted the whole file), `MaintenanceDue.spec.js`; mr-boss the plan
    screens, `MaintenancePlanParts.xml`, the design's §5.1 paragraph and header, this plan's P13 and P14 texts. P7 and P9 merging first
    touch `MaintenanceAccess.spec.js`, `MaintenanceSpecLib.js` (menus) and the design header the same way P15 did.
  - The user's calls (none decided here): (1) whether activation of a plan with no procedure needs an estimate (built: optional; I
    recommend optional, P14 making the order without one); (2) whether a plan may say "no procedure" over its model default's (built:
    it inherits; I recommend a "none" choice only if a default's legacy template blocks a real plan).

### P14 — Generation, occurrences and compliance

(F117: the job's and recovery descriptor's `ownerRoute` are route keys in Admin.js `mountRoutes`.)

Design §5.1 (occurrences, catch-up), DueMaintenance, PlanDetail's OccurrenceHistory, §8
PreventiveComplianceReport, §1.4 (the job's operation marks); MT-05, MT-11.

- **Mantle records.** `MaintenanceOccurrence`, unique by schedule and obligation; the `MaintenanceDue` topic.
- **Mantle `MaintenancePlanServices`:** `find#MaintenanceOccurrences`, `generate#MaintenanceWorkOrders` (one
  unresolved execution a schedule; a procedure through `instantiate#WorkProcess`, else an ad hoc root with the plan's
  name and estimate (`MaintenanceScheduleTerm.estimatedWorkTime`, P13 review); `maintenanceScheduleId` set on the
  `MaintenanceWorkOrder` through an option of create#MaintenanceWorkOrder's own path (no caller supplies it); each
  schedule on its own with a named outcome; marked `operation` with its `operation-ref`),
  `reconcile#MaintenanceSchedule` (coalesce, skip, correct a counted completion; reasoned and non-destructive), and
  the ServiceJob that calls the same generation in bounded batches, seeded paused. Completion of generated work
  advances the baseline once; a reopened order generates nothing again. Reminders for assigned PM work through
  `EventServices.store#WorkEffortReminders`.
- **`MaintenanceReportServices.get#MaintenanceCompliance`:** obligations as the denominator; on time, late,
  outstanding, skipped and unknown apart.
- **Admin** (owner contract, F52): the job's `JobRegistration` (pause and schedule editable, the batch size a
  `JobParameterDefinition`, `MAINTENANCE_SETTINGS_EDIT` as its manage permission) and a `RecoveryDescriptor` of kind
  `ServiceJob` for a run outside its schedule, seeded in mr-mantle as the framework's message jobs are (framework
  data/AdminConfigurationData.xml:376-403); the `MaintenanceDue` topic's `TopicRegistration`. A failed schedule is
  retried by generating it again, which the occurrence key makes safe.
- **Screens:** DueMaintenance (DueFind, DueRows with the dated calendar view, GenerateWork with its preview,
  ResolveDue); PlanDetail's Due history and Generated work; PreventiveComplianceReport; Home's overdue PM and
  unknown-meter counters; Settings gains the due job and lead defaults.
- **Specs:** Mantle `test/work/MaintenanceGeneration` (the job and a planner at once make one occurrence and one
  order; one failing schedule in a batch named and the rest generated; a cancelled order counts as no completion; a
  coalesced catch-up records the covered occurrences and is not on time; a reopened order makes no second next
  job).
- **Usable when** (`acceptance/Maintenance/MaintenancePreventiveWalk`; design §11.2 "PM concurrency and missed
  work"): the planner generates this month's work for the three plans and sees the stale-meter plan blocked with
  "request a reading"; after two missed months on the room plan she coalesces them into one catch-up, and the
  compliance report shows two late obligations, not one compliant order. **Gate 4.**

### P15 — Resource policy and blackouts

Design §7.1 (policy, availability and blocks), Resources, ResourcePolicyDetail and Blackouts; MT-07 (policy and
the availability read).

- **Mantle records.** `ResourceBookingPolicy`, dated, for one asset or facility (design §7.1 and
  ResourcePolicyDetail's field list).
- **Mantle `ResourceBookingServices`:** `find#BookableResources`, `get#`, `store#` and
  `preview#ResourceBookingPolicy`, `store#ResourceApprover` over FacilityParty and AssetPartyAssignment
  `BookingApprover` rows, planned blocks through `record#` and `correct#ResourceUnavailability` (`RukPlanned`, an
  end required), and one availability read (policy, bookings, blocks and outages, a facility's blocks covering its
  descendants) that answers a busy interval with a safe reason.
- **`EventServices`** (design §7.1, §13.2): `book#Resource`, `check#ResourceBookings`, `update#EventOccurrence`,
  `create#Event`, `get#FreeBusy`, `get#FullCalendarData` and the CalDAV event PUT call that read for a managed
  resource, with the resource locked for the write: an outage or hard block is never overridden, `allowConflicts`
  alone is no authority for a managed resource (it needs the policy's override permission and a reason), the whole
  recurrence range is checked within the horizon and a range past it refused, and overlap within one series is
  refused. Today nothing reads an outage, so a down asset can be booked (F15). A resource with no policy keeps the
  approver fallback.
- **Manufacturing** (owner contract): `store#WorkCenterOffline`'s planned blocks (ProductionSchedule.js:878-1028)
  go through `record#ResourceUnavailability`, and its planning reads the same availability; its ProductionSchedule
  spec passes unchanged.
- **Admin** (owner contract): Maintenance's lifecycle participant (P3) gains a leaver's `BookingApprover` roles,
  ended or handed over through `store#ResourceApprover`.
- **Screens:** Resources (ResourceFind, ResourceRows, Bookability); ResourcePolicyDetail (BookingPolicy,
  BookingApprovers, PolicyImpact); Blackouts (BlockFind, BlockRows with the calendar view, StoreBlock);
  EquipmentDetail's Schedule pane and FacilityDetail's Schedules tab under Maintenance.
- **Demo data:** a managed room with an approver and a two-hour maximum, an unmanaged room, a blackout next week
  over an existing booking.
- **Specs:** Mantle `test/work/ResourceBookingPolicy` (a booking over an outage refused with `allowConflicts`;
  adjacent intervals accepted; a hidden event answered as busy with no title; a booking past the horizon and one
  over the maximum duration refused; a required approval with no approver blocks; an unmanaged room behaves as
  before; a new blackout flags the approved booking and cancels nothing).
- **Usable when** (`acceptance/Maintenance/MaintenanceResourcePolicyWalk`; design §11.2 "Privacy and policy"):
  `maint.resources` makes the room managed with an approver, plans a blackout and reviews the two bookings it
  touches; a Commons user booking the down compressor is refused with "out of service" and no other detail.

**Built Nov 12 (P15).** mr-mantle 193f1559, mr-boss 3d8ffbbd (branch `mnt/p15`); mr-moqui unchanged, no Rust built.
- Checked first (the code over the plan): P5's ResourceOutages.js and its four services, the correction chain and every reader of the
  row in force (F119); EventServices' `book#Resource`, `check#ResourceBookings`, `update#EventOccurrence`, `create#Event` (equipment
  assigned at once with no check), `get#FreeBusy`, `get#FullCalendarData` (a resource's events carry their titles whoever asks; Commons'
  ScheduleServices masks them itself) and `check#EventAccess`; CalendarDavServices' event PUT (a check-only `check#ResourceBookings`, a
  conflict answering 409); ProductionSchedule.js `store#WorkCenterOffline` (a direct create of the RukPlanned row, then each move in a
  transaction of its own) and its withdraw, ProductionCalendar's `offlineOf`; the seeded `RESOURCE_*` permissions and groups, the
  BookingApprover role and rows (Commons' demo), Maintenance's lifecycle participant (WorkOrders.js), and Commons' `book#ResourceSlot`.
- Mantle:
  - Record (`entity/ResourceBookingEntities.xml`): `ResourceBookingPolicy`, dated, one resource (asset or facility), with bookable,
    `approvalModeEnumId` (RbamAutomatic, RbamApprovers), `bookingHorizonDays`, `maximumDurationMinutes`, `timeZone`,
    `softConflictOverride`, the change reason, a revision and who; audit-logged. Seeds `data/MaintenanceWorkResourceData.xml` (the
    approval modes and the planned reasons RurClosure and RurOffline, after the P5 file whose type they are of) and
    `RESOURCE_BOOKING_OVERRIDE` in MaintenanceSetupData (to ADMIN).
  - `mantle.work.ResourceBookingServices` over the new `ResourcePolicy.js`: `find#BookableResources` (bookable equipment and open
    facilities of the scope, an approver only theirs, paged before the per-row reads), `get#`, `store#` (from a date never past, the one
    in force ended then, a later one withdrawn, the expected revision and a reason for a change, or `endPolicy`) and
    `preview#ResourceBookingPolicy` (the bookings of 180 days the rules no longer allow, kept, with safe labels), `store#ResourceApprover`
    (add, or end with a hand-over person or the reason, APPROVER_PENDING) and `get#ResourceAvailability` (assigned, requested, planned
    and actual intervals, safe labels, a facility's blocks with those above it). Writers need RESOURCE_POLICY_EDIT in the resource's
    organization; readers a policy or resource read there, or a current approver with RESOURCE_BOOKING_VIEW_ASSIGNED.
  - The guard (`ResourcePolicy.js guard`), called with the resource row locked by `book#Resource` (which now locks it itself before its
    conflict read), `check#ResourceBookings` (locks unless check-only; a refusal is a hard conflict in check-only, so the CalDAV PUT
    answers 409) and `create#Event`'s equipment (a managed asset goes through `book#Resource`, any other is refused only by a block):
    an outage or planned block over the booking refuses it for every resource whatever allowConflicts ("… is out of service then",
    "… is not available then (closed (blackout))"); a managed resource refuses not bookable, over the maximum, past the horizon, a
    recurring range past the horizon (365 days when unset) or self-overlapping, approval with no approver; allowConflicts books over a
    conflict only with the policy's override, RESOURCE_BOOKING_OVERRIDE and `overrideReason` (kept as "Override: …" in the booking's
    comments; `book#`, `check#` and `update#EventOccurrence` take it); approval follows the mode. A conflict with an event the user may
    not see is "Busy" with no id, for every resource. `get#FreeBusy` adds blocks (status down, blocked); `get#FullCalendarData` answers
    them apart as `unavailableList`.
  - Planned blocks (`ResourceOutages.js`): `record#` with kind RukPlanned (an end required, a future start allowed, at most a year),
    Maintenance's entry a resource administrator (RESOURCE_POLICY_EDIT) or supervisor of the scope, Manufacturing's a scheduler or method
    engineer of a work center of their organization, by data; Maintenance's locks the resource, Manufacturing's does not (its moves run
    in their own transactions after it and waited on the lock: the ProductionSchedule spec's apply hung 60 s until this). `correct#`
    supersedes a block by either entry point and `end#` ends it now or withdraws it (its end at its start). find# with kind RukPlanned
    gives each block's state (planned, in effect, ended, withdrawn, corrected), source and the bookings it covers until it ends;
    `affectedBookings` counts a facility's and those inside it.
  - Owner contracts: `store#WorkCenterOffline` writes its block through `record#` (reason RurOffline) and its withdraw ends the row in
    force; R3's KIND_INVALID is replaced (MaintenanceOutages' case now expects the correction); ProductionCalendar's offline time
    includes a block or outage of a facility above the center. ProductionSchedule and the Calendar, Dav and Production specs pass
    unchanged.
- BOSS:
  - Screens: the Scheduling area (menu index 8, for RESOURCE_POLICY_VIEW, RESOURCE_BOOKING_VIEW_ASSIGNED, MAINTENANCE_SUPERVISE or
    MAINTENANCE_RESOURCE_VIEW): Resources (ResourceFind, ResourceRows, Bookability), ResourcePolicyDetail at
    `Scheduling/ResourcePolicyDetail` (not under Resources; BookingPolicy, BookingApprovers, PolicyImpact as the rules in force's
    preview, availability, history) and Blackouts (BlockFind, BlockRows with `view-calendar` and no drag transition, StoreBlock, Correct,
    End), over `template/MaintenanceSchedulingParts.xml`; EquipmentDetail's Schedule tab (index 10) and FacilityDetail's Schedules tab's
    Maintenance branch (after check#Record), both the `ResourceSchedule` section.
  - Maintenance.js: the three links, the choices `blockReasons`, `approvalModes` and `approvers` (the people of the scope, as a work
    order's). WorkOrders.js and LifecycleServices: the participant's third kind `bookingApprovals` (current BookingApprover rows), moved by
    a RESOURCE_POLICY_EDIT holder through `store#ResourceApprover` with the new person as hand-over.
  - Setup (BossSetupMaintenanceData.xml, F118): RESOURCE_BOOKING_OVERRIDE to BOSS_MAINTENANCE_RESOURCE_ADMIN and BOSS_MAINTENANCE_ADMIN,
    in their bundles.
  - Demo (BossZMaintenanceDemoData.xml, appended): Room 101 managed (approval by maint.booking, two hours, 90 days), Room 103 Focus new
    and not managed, the planner's vendor walkthrough in Room 101 on Nov 17 approved, and the carpet replacement's blackout over it
    that morning.
- Specs:
  - Mantle `test/work/ResourceBookingPolicy` (8 features, 2.2 s): the policy set by its editor and refused to others; adjacent bookings
    accepted, three hours and 40 days ahead refused, an unbounded daily series refused and a three-day one accepted; a hidden event Busy
    in the conflict and the availability read, allowConflicts refused, the override with permission and reason accepted; a booking and
    `create#Event` over an outage refused with allowConflicts, no description, FreeBusy "down"; approval with no approver blocked, an
    approver makes it requested, ending them with it waiting refused, the hand-over accepted; an unmanaged room as before; a building's
    blackout flags the rooms' bookings, cancels nothing and refuses a booking under it; Manufacturing's offline time through `record#`,
    corrected by a supervisor and withdrawn as the row in force.
  - BOSS `test/Maintenance/MaintenanceScheduling` (3 features, about 0.4 s): Resources', ResourcePolicyDetail's and Blackouts' one qvt
    render each, EquipmentDetail/Schedule's and FacilityDetail/Schedules' under Maintenance, the participant's booking approvals and their
    hand-over. `MaintenanceAccess` gains the policy and blackout case (the resource administrator's preview, the planner refused,
    Retail's facility refused, an approver reading only the room they approve; 0.26 s) and `adminMenu` gains Scheduling.
  - Acceptance, written and not run: `acceptance/Maintenance/MaintenanceResourcePolicyWalk` (4 features).
- Tests run (release binary, `--nobuild`, this worktree): mr-mantle ResourceBookingPolicy, MaintenanceOutages, CalendarServices,
  CalendarChanges, Dav, CommonsToday, ProductionSchedule, ProductionDowntime, ProductionShopFloor, ProductionOrders, ProductionReports,
  ProductionPolicy, ManufacturingServices, WorkCenters, MaintenanceWorkOrders, MaintenanceManagedWork, MaintenanceScope,
  MaintenanceResources and WorkProcess 150 of 150 (69.4 s); after prettier ResourceBookingPolicy, MaintenanceOutages, ProductionSchedule
  and CalendarServices 40 of 40; mr-boss MaintenanceAccess, MaintenanceDowntime, MaintenanceWorkOrders, MaintenanceEquipment,
  MaintenanceScheduling, Schedules, EventDetail, Calendar, QuickCreate, PublishedCalendar, WarehouseFacilities, ManufacturingWorkCenters,
  ManufacturingDowntime, ManufacturingSchedule, AdminLifecycle, PeopleLifecycle and PeopleSchedules 149 of 149 (47.6 s), then
  MaintenanceScheduling and MaintenanceAccess 15 of 15 after prettier. `./moq run --debug --nobuild lint --screens`: 136 flagged sites,
  as before; none in the new or changed screens. Prettier clean on the new and changed JavaScript. Not run: ./moq test-apps, the
  acceptance suite.
- Inventories: usl-inventory's P5 rows name P15's uses, and a new Added table for find#BookableResources, get#, store#, preview#
  ResourceBookingPolicy, store#ResourceApprover and get#ResourceAvailability; ss-inventory has no baseline form for a policy or a
  blackout (no row).
- Design edits: design-maintenance's header, §1.2, §2 (ResourcePolicyDetail's path), §7.1, Resources, ResourcePolicyDetail and Blackouts
  as built; impl-manufacturing's log (the owner contract).
- Findings, numbered by the lead F162 to F170 in order:
  - `get#FullCalendarData` returns a resource's events with their titles to anyone who asks by facility or asset; Commons'
    ScheduleServices masks them, the Mantle read does not. P15 masks them in the guard's conflicts and the availability read only; the
    eventList is unchanged, so Commons' specs pass.
  - `create#Event` assigned equipment at once with no check at all; it now goes through `book#Resource` for a managed asset, and is
    refused by a block for any other.
  - Manufacturing's offline time locked nothing before; locking the work center in `record#` deadlocked its moves (their own transactions
    after it), so Manufacturing's entry does not lock. A Maintenance blackout does.
  - An unmanaged resource's recurring booking is still checked on its first instance only (as before); only a managed one is checked
    over its range.
  - Allowed hours, a booking calendar and people capacity against attendees are not built (the policy keeps a time zone for them).
  - `affectedBookings` reads estimated dates only: a recurring booking's later instances under a block are not counted.
  - A facility block covers its descendants; equipment located in a blacked-out room is not blocked (design §7.1: an explicit
    relationship would be needed).
  - MaintenanceFoundationWalk (acceptance) expects the staff menu for every group user, though since P2 the author, approver and booking
    approver have Home alone; with Scheduling the supervisor, resource administrator and booking approver now also differ. Not changed
    here (not run).
  - An existing database needs `MaintenanceWorkResourceData.xml` loaded before Manufacturing's offline change works (RurOffline), as
    F129 for P5's file.
- For the lead:
  - budget share: mr-mantle +2.2 s (ResourceBookingPolicy); mr-boss server about +0.7 s (MaintenanceScheduling 0.4 s, MaintenanceAccess
    +0.26 s); mr-boss client unchanged; budgets not changed.
  - merge hot spots: mr-mantle `EventServices.xml` (book#, check#, update#EventOccurrence, create#Event, get#FreeBusy, get#FullCalendarData),
    `ResourceOutages.js` (header, record's dispatch, affectedBookings, correct and end's dispatch, the planned-block section, displayRows,
    findOutages' canRecord, exports), `ResourceBookingServices.xml`, `ResourceBookingEntities.xml`, `ProductionSchedule.js`,
    `ProductionCalendar.js`, `ProductionPlanningServices.xml`, `MaintenanceSetupData.xml`, `test/work/MaintenanceOutages.spec.js`; mr-boss
    `screen/Maintenance.xml` (one subscreens item), `Maintenance.js` (linkPaths, resourceChoices, choiceSources), `WorkOrders.js` and
    `LifecycleServices.xml`, `Shared/EquipmentDetail.xml` (a subscreen and equipmentTabs), `Shared/FacilityDetail.xml` (facilityTabs),
    `Shared/FacilityDetail/Schedules.xml`, `BossSetupMaintenanceData.xml` (appended before the settings row), `BossZMaintenanceDemoData.xml`
    (appended), `MaintenanceSpecLib.js` (ids, adminMenu), `MaintenanceAccess.spec.js` (appended), design-maintenance, usl-inventory and
    impl-manufacturing's log. No change to BossSetupData.xml or P4's and P6's files.
  - the user's calls: none needed; built as the plan has it. Open to the user if they want them: whether an unmanaged resource's
    recurring booking should also be checked over its range, and who besides the resource administrator holds the override.

**Review Nov 12 (P15).** mr-mantle d1092e9f, mr-boss 50f25b02 and this note's commit (branch `mnt/p15`), over the worker's 193f1559,
3d8ffbbd and 3a1135a4, after merging master (Maintenance P4, People P13, the framework's quick-create condition) in both repos:
mr-mantle a147bbc3 (clean), mr-boss 524ecf78 (BossSetupMaintenanceData, design-maintenance's header and §1.2, MaintenanceAccess'
header and MaintenanceSpecLib's adminMenu, each keeping both sides; mr-moqui fast-forwarded to 4994093f). Reviewed
`git diff master...mnt/p15` in both repos against P15's text, §2, §4, design §7.1, Resources, ResourcePolicyDetail and Blackouts,
P5's review (R3), AGENTS.md and Practices-App-Dev; read every booking path of EventServices (book#, check#ResourceBookings,
update#EventOccurrence, create#Event, store#EventRecurrence, get#FreeBusy, get#FullCalendarData), CalendarDavServices' event PUT and
store#CalendarFeedEvents, ResourceOutages.js' planned blocks, ProductionSchedule's offline apply and withdraw, ProductionCalendar's
offline read, Commons' ScheduleServices and Warehouse's Facilities.js (the two BOSS callers of get#FullCalendarData for a resource),
and the framework's DAV status mapping (moqui-dav `status_of_error`).
- Checked and found sound:
  - The guard's hard refusals: an outage or planned block (an asset's own; a facility's own or one above it) refuses every resource
    whatever allowConflicts, naming only "out of service" or the block's reason; a managed resource's not bookable, maximum, horizon,
    series range and self-overlap are refused, and approval by approvers with none named is refused (APPROVER_REQUIRED). An unmanaged
    resource keeps its approver fallback and allowConflicts (ResourceBookingPolicy's unmanaged case). The behavior an unmanaged
    resource does change, all by design: a block refuses it, its row is locked for the write, and a conflict with an event the user
    may not see is "Busy" in the error (Commons' specs pass; none asserted a title).
  - `create#Event`'s new check: a managed asset through book#Resource, any other refused only by a block. Commons' calendar, quick
    create, EventDetail, Schedules and PublishedCalendar specs pass; Room 101's demo policy breaks none of them.
  - The CalDAV PUT: the check-only call gets a guard refusal as a hard conflict (409, nothing stored); after storing, the moved
    bookings' allowConflicts recheck runs locked, and for a managed resource allowConflicts without a reason is refused, so a race
    between the two calls rolls back.
  - Blocks: a facility's block covers it and its descendants and nothing else (blocksOver walks up from the resource; a room's block
    never reaches its building or siblings; equipment in a room is not covered, design §7.1); affectedBookings counts the subtree; a new
    blackout flags the approved booking and cancels nothing (spec).
  - Manufacturing's owner contract: store#WorkCenterOffline writes through record# (RurOffline) and its withdraw ends the row in
    force; ProductionSchedule, ProductionShopFloor, ProductionDowntime, ProductionOrders, ProductionReports, ProductionPolicy,
    ManufacturingServices and WorkCenters pass unchanged; a plant's blackout is the line's offline time (now in the spec).
  - The replaced R3: correct# dispatches to the block path only for a RukPlanned row, correctBlock always writes a RukPlanned row of
    the same resource, and the withdraw follows the chain and refuses anything but a RukPlanned row of its own center, so neither entry
    point can supersede or end an equipment-fault outage through a block.
  - Admin's participant: `bookingApprovals` lists current BookingApprover rows by id only, moved through store#ResourceApprover
    (RESOURCE_POLICY_EDIT in the resource's organization, the leaver ended, the new person approving from then; AdminLifecycle and
    PeopleLifecycle pass).
  - RESOURCE_BOOKING_OVERRIDE: Mantle seeds it to ADMIN; BOSS grants it to BOSS_MAINTENANCE_RESOURCE_ADMIN and BOSS_MAINTENANCE_ADMIN
    in their bundles (MaintenanceAccess' bundle check passes after the merge with P4's request rows).
  - Seeds: MaintenanceWorkResourceData.xml sorts after MaintenanceWorkOutageData.xml (whose enumeration type RurClosure and
    RurOffline are of) on a fresh load.
  - The screens: every write goes to Mantle after check#Record; EquipmentDetail's Schedule and FacilityDetail's Schedules under
    Maintenance read get#ResourceAvailability (hidden events Busy, no id); Warehouse's branch of Schedules is unchanged.
- Privacy (the lead's question): the titles in get#FullCalendarData's eventList are a Commons read older than P15 (any caller asking by
  facility, asset or party got every booking's title and organizer; Commons' ScheduleServices masks them itself, Warehouse's
  FacilityDetail Schedules shows them). P15's own reads (the guard's conflicts, get#ResourceAvailability, preview's impact, the
  blackout rows) mask correctly. But the phase names get#FullCalendarData among the reads that "call that read for a managed
  resource", and Warehouse's Schedules tab of Room 101 (managed by P15's demo) showed hidden bookings' titles and organizers: fixed for
  a managed resource (R1); an unmanaged resource's eventList is as before, so no Commons spec changed.
- Fixes:
  - **R1 (medium, confidentiality; §2).** get#FullCalendarData answered a managed resource's bookings with their titles, links, places
    and organizers to any caller. A booking of an asked managed resource the user may not open (check#EventAccess, read once per
    event) is now free/busy: title Busy, freeBusyOnly, no url, location or organizer. ResourceBookingPolicy: Bob's read of the managed
    room shows Ann's event as Busy with no organizer and his own by its title (fails without).
  - **R2 (medium, access; organization isolation).** The override checked `RESOURCE_BOOKING_OVERRIDE` with no organization, so a
    resource administrator of Retail could book over a Services room's booking. It now needs the holder to work for the resource's
    organization (their maintenance scope, or their own organizations for a holder with no Maintenance read; every organization for a
    system administrator or an every-organization holder). MaintenanceAccess exports `ownOrganizations`. Spec: another
    organization's holder with a reason is refused (fails without).
  - **R3 (medium, correctness).** seriesInstances expanded a series from its first meeting, so a series begun long ago counted its
    past meetings toward the 500-instance bound and was refused HORIZON_EXCEEDED on any booking or move. It is decided from now (the
    meeting in progress included). Spec: a daily series begun 600 days ago and ending in 9 days books the managed room (fails without).
  - **R4 (medium, correctness; "the whole recurrence is checked").** The range was checked only when the booking was made or moved:
    a booked three-day series made unbounded afterwards (Commons' EventDetail repeat, store#EventRecurrence) or by a phone (the CalDAV
    PUT writes the rule directly, with no new time) kept its booking past the horizon. store#EventRecurrence now runs
    check#ResourceBookings (reapprove false) for an event booking a managed resource, and the CalDAV PUT does the same for the series
    after storing (a refusal rolls the change back; the DAV server answers it 409). create#Event stores the rule before booking its
    equipment. Specs: ResourceBookingPolicy's extended rule refused and kept as it was, and an unbounded projector series refused at
    creation; Dav's phone rule refused, the event keeping no rule (each fails without its fix; the creation case is caught by either
    the reorder or the recheck).
  - **R5 (low, concurrency).** A booking locks its own resource, a blackout of a building locked only the building, so a room's
    booking and its building's new blackout could each pass unseen by the other. Maintenance's record# and correct# of a facility's
    block now lock the bookable facilities inside it in id order (a booking locks only its own row, so no cycle). Not covered by a
    spec (two transactions).
  - **R6 (low, robustness).** blockFor read a missing id as a TypeError; it is RECORD_UNAVAILABLE.
  - **R7 (low, style).** The worker's note says prettier was clean; ResourcePolicy.js, ResourceOutages.js, ProductionSchedule.js,
    ProductionCalendar.js, ResourceBookingPolicy.spec.js, MaintenanceScheduling.spec.js and MaintenanceResourcePolicyWalk.spec.js were
    not (with the repository's .prettierrc.json); formatted.
- Findings, numbered by the lead F171 to F176 in order:
  - Locking with Manufacturing: store#WorkCenterOffline's record# does not lock, so a booking of the work center (or of a facility
    inside a plant being taken offline) can pass beside a new offline block. The hang the worker met is not a lock-order problem: the
    offline call holds its transaction open while each move runs in a transaction of its own, which waits on the row the outer one
    locked; no ordering fixes that. A fix is to lock a row the moves never write (for example the WorkCenter row, with the guard
    locking it for a work center's booking) or to record the block in its own transaction before the moves, at the cost of the
    offline call's single retry key. Work centers are seldom bookable and the result is a booking under a block, flagged in Blackouts
    as one made before it would be; left for the lead.
  - The guard's resourceOf refuses a stock asset, so book#Resource and create#Event of an inventory or supplies asset, which worked
    before, now fail. Nothing in BOSS books one; left as is.
  - A managed resource's Busy event in get#FullCalendarData keeps its id (FullCalendar needs one); EventDetail refuses it on open.
  - ProductionCalendar shows a Maintenance blackout's description to Manufacturing's schedulers as the offline reason.
  - The recurrence recheck (R4) runs check#ResourceBookings over every resource of the event once one is managed, so an unmanaged
    room on the same event is checked too; and it does not ask an approved booking again (reapprove false: the booking decisions are
    P16's).
  - An existing database needs `MaintenanceWorkResourceData.xml` loaded (seed) before Manufacturing's offline change works: record#
    refuses an unknown reason (REASON_INVALID), so until then store#WorkCenterOffline fails. A release note, as F129.
- Tests (release binary, `--nobuild`, this worktree): mr-mantle ResourceBookingPolicy, MaintenanceOutages, CalendarServices,
  CalendarChanges, Dav, CommonsToday, ProductionSchedule, ProductionDowntime, ProductionShopFloor, ProductionOrders, ProductionReports,
  ProductionPolicy, ManufacturingServices, WorkCenters, MaintenanceWorkOrders, MaintenanceManagedWork, MaintenanceScope, WorkResources,
  WorkProcess and MaintenanceIntake 160 of 160 (63.2 s); then ResourceBookingPolicy 8 of 8 (2.6 s of features) and Dav 9 of 9 after
  the last spec changes. mr-boss MaintenanceAccess, MaintenanceDowntime, MaintenanceWorkOrders, MaintenanceEquipment,
  MaintenanceScheduling, MaintenanceRequests, Schedules, EventDetail, Calendar, QuickCreate, PublishedCalendar, WarehouseFacilities,
  ManufacturingWorkCenters, ManufacturingDowntime, ManufacturingSchedule, AdminLifecycle, PeopleLifecycle and PeopleSchedules 154 of 154
  (44.4 s). Each new case run against the code without its fix failed (R1, R2, R3, R4's recheck, the plant's offline time without
  ProductionCalendar's walk up). `./moq run --debug --nobuild lint --screens`: 136 flagged sites, as before; the review changed no
  screen; both binaries still symlinks. Not run: ./moq test-apps, the acceptance suite.
- For the lead:
  - budget share: mr-mantle about +2.7 s (ResourceBookingPolicy 2.6 s, Dav's case 0.05 s); mr-boss unchanged from the worker's
    (about +0.7 s server); budgets not changed.
  - merge hot spots (added by the review): mr-mantle `EventServices.xml` (get#FullCalendarData's members and loop, create#Event's
    order, store#EventRecurrence), `CalendarDavServices.xml` (put#DavObject after the moved loop), `ResourcePolicy.js` and
    `ResourceOutages.js` (prettier: whole-file reformatting), `MaintenanceAccess.js` (exports), `ProductionSchedule.js` and
    `ProductionCalendar.js` (prettier, a few lines), `test/work/Dav.spec.js` (appended); mr-boss design-maintenance (header, §7.1's
    as-built paragraph), usl-inventory (the Added paragraph).
  - the user's calls (optional, not built):
    1. Unmanaged recurring bookings over their whole range: recommend yes for blocks only (an outage or blackout over any meeting
       of the series, bounded at 365 days as for a managed resource), since the rule "an outage or blackout is never overridden" is
       for every resource and a weekly series otherwise walks through a planned closure; keep conflicts on the first instance for an
       unmanaged resource, so Commons' booking behaves as today.
    2. Who holds the override besides the resource administrator: recommend keeping it to the resource administrator, the
       Maintenance administrator and ADMIN, scoped to their organizations (R2); not supervisors (who plan blackouts) or booking
       approvers (who decide requests, P16). If an office manager or front desk should override room bookings, grant it through a
       Commons-side group of its own rather than widening a Maintenance group.

### P16 — Booking requests and the resource calendar

Design BookingRequests, the ResourceCalendar mount row, §7.1 (approval), design-drawers-commons' `ResourceBooking`
approval kind; MT-07 (decisions), MT-01, MT-11.

- **Mantle `ResourceBookingServices`:** the `ResourceBooking` topic with its approve and refuse services and its
  `TopicRegistration`; `find#ResourceBookingRequests`, `decide#ResourceBooking` and
  `decide#ResourceBookings`: a current `BookingApprover` of the resource with `RESOURCE_BOOKING_APPROVE`, the
  expected span and state, the availability rechecked under the resource lock, a reason on denial. Nothing decides
  a requested booking today (F15). A moved booking returns to requested; the `ResourceBooking` topic tells the
  approvers and, after a decision or a conflicting fault, the organizer.
- **Commons** (owner contract): the approvals inbox card for `ResourceBooking` calls the same decision; Schedules'
  "Scheduling admin" link opens Maintenance.
- **Screens:** BookingRequests (BookingFind, BookingRows, BookingDecision, BulkBookingDecision);
  ResourceCalendar at `Maintenance/Scheduling/ResourceCalendar`, Commons' Schedules component with the
  availability intervals and its terminal twin; no maintenance interval is edited by dragging.
- **Specs:** Mantle `test/work/ResourceBookingDecisions` (two approvers of overlapping requests cannot both
  assign; approval after a move rechecks the new span; a non-approver refused; a denial needs its reason; the
  availability read answering planned, requested, assigned and down intervals apart and no title of a hidden
  event); BOSS `MaintenanceScheduling` (BookingRequests' one qvt render for an approver of one resource). The
  ResourceCalendar mount is Commons' Schedules, whose `.qvue` and terminal twin Commons' spec renders; it is
  rendered again here only if Maintenance's context adds a template section of its own, and then once for that
  section.
- **Usable when** (`acceptance/client/Maintenance/MaintenanceBookingWalk`; design §11.2 "Booking concurrency"):
  two people request the managed room for overlapping times; `maint.booking` approves one from Commons' inbox on a
  phone and the other is answered a conflict; the organizer moves the approved meeting and it waits for approval
  again. **Gate 5.**

### P17 — Reports and Insights

(F117: dataset readiness and refresh rows are `moqui.server.ReadinessProvider` and `RefreshOperation` with `fixRoute="insightsDataset"`; Insights' registries are unchanged.)

Design §8 Reports and WorkStatusReport, §1.4 Shipped reports, §12 (report exports); MT-11.

- **Mantle `MaintenanceReportServices.get#MaintenanceStatusReport`:** backlog, completions, cancellations, overdue
  and unassigned by the definitions of design §8, over execution roots only.
- **Shipped definitions** (CX-OPS-REPORTS), on Customer Service's pattern (BossCustomerServiceReportData.xml:15-25):
  DataDocuments and feeds for work orders and due occurrences, carrying their organization and no cost or rate;
  `report/boss-maintenance-work-status.json`, `boss-maintenance-pm-compliance.json`, a Maintenance dashboard, and
  alert templates for overdue PM, a resource down past its threshold and a failed generation batch. The design's
  `report/maintenance-*.json` names follow the built `boss-<area>-` convention (F37).
- **Insights** (owner contracts, impl-insights §7), each as Manufacturing's rows are (BossSetupData.xml:3621-3655,
  :3818, :3983-3989; the flow targets at :4545-4590): `ReportCatalogEntry` rows `Maintenance.WorkStatus`,
  `Maintenance.PreventiveCompliance` and `Maintenance.Cost` (the last needing `MAINTENANCE_COST_VIEW`),
  `MetricRegistration` rows for backlog, overdue PM and on-time PM, `AttentionProvider` rows for unassigned work,
  overdue PM and resources down, `DatasetClass` rows (operations), the datasets' admission with their readiness and
  refresh registrations, and a `FlowTarget` `Maintenance.WorkOrders` with the internal flow map's Maintenance step
  pointed at it.
- **Screens:** Reports (ReportOptions, ReportLinks); WorkStatusReport (StatusOptions, StatusTotals, StatusRows)
  with CSV and print; Downtime opens from Reports. (P0, F72: the CSV is the form-list's own, with `select-columns`;
  Reports is listed in Admin's Exports by one `wizard` export target with its owner route, not one per report.)
- **Specs:** Mantle `test/work/MaintenanceReports` (templates and steps not counted; an order completed, reopened
  and completed counts once; overdue is past due, not unscheduled; another organization's roots left out); BOSS
  `MaintenanceReports` (the catalog entries listed for a reader and the cost entry only for the cost reader; the
  datasets carry no amount).
- **Usable when** (`acceptance/Maintenance/MaintenanceReportsWalk`; design §11.2 "Reports and scope"): the
  supervisor reads this month's backlog by team and drills to the orders; Insights' catalog opens the same report
  with the same numbers; an overdue-PM alert copied from the template tells its subscribers once.

### P18 — Settings, lookups, readiness and import

(F117: the readiness provider is a `moqui.server.ReadinessProvider` with `fixRoute`, its service answering `subject`, `scope` and `fixRoute` as People's `get#Readiness`; the import's owner route is a `mountRoutes` key in Admin.js; Data.js and DataImport.js no longer hold owner routes.)

Design §9 Settings and Lookups, §6 EquipmentImport, §12 (the import and outcome file); MT-12, MT-11. Teams is P8's.

- **Mantle `MaintenanceSettingsServices`:** `get#` and `store#MaintenancePolicy` (dated; the whole policy, of which
  earlier phases built their fields), `find#MaintenanceLookups` and `store#MaintenanceLookup` (the fixed kinds and
  failure modes, dated, with applicability), and `check#MaintenanceReadiness`: templates, resource approvers, stock
  grants, the cost policy's mappings, costing rates and the generation job's last result, each a named finding with
  its owner's link.
- **Mantle `mantle.product.MaintenanceImportServices`** (F36): `validate#EquipmentImportRow`,
  `apply#EquipmentImportRow` and `find#EquipmentImportScopes`, calling `store#MaintenanceEquipment` and
  `record#MaintenanceMeter`; one external source and key to one asset; a retried row idempotent; no posting.
- **Admin** (owner contracts, impl-admin §7):
  - the `equipment` `TransferTarget`, a `rows` target seeded in mr-mantle as staff invitations are
    (mr-mantle `data/PartyInvitationData.xml:48-61`). Its import permissions are `MAINTENANCE_IMPORT` and
    `MAINTENANCE_RESOURCE_EDIT`, its view permission `MAINTENANCE_RESOURCE_VIEW`, and it names no `ADMIN_*`
    permission: the framework asks for every permission a target names (F51), so naming `ADMIN_TRANSFER_RUN`
    beside them would refuse the resource administrator in Maintenance's own mount (§4);
  - `Shared/DataImport`'s mount gains a Maintenance branch for that one target, checked by Maintenance's
    capabilities, and the owner route `maintenanceEquipmentImport` (DataImport.js:18-27, :38-67);
  - a `ReadinessProvider` `maintenance.readiness` on `check#MaintenanceReadiness`, as Accounting's is
    (BossSetupData.xml:2550-2552), named by the settings entry of P1; since Nov 11, 2026 the framework's
    `moqui.server.ReadinessProvider`, its fix place a `fixRoute` key (impl-admin §9).
- **Screens:** Settings (MaintenanceSettings complete, Readiness); Lookups (MaintenanceLookups, FailureModes,
  CanonicalEditors as links to Product360, Accounting's asset classes and Products' Units); EquipmentImport at
  `Maintenance/Equipment/EquipmentImport`.
- **Specs:** Mantle `test/product/MaintenanceImport` (a row for another organization's asset refused; a holder of
  `MAINTENANCE_RESOURCE_EDIT` without `MAINTENANCE_IMPORT` refused; the same file and row applied twice makes one
  asset; a failing row does not stop the next; a baseline that decreases
  refused); BOSS `MaintenanceSettings` (a readiness finding named with its link and Admin's Health showing it; a
  policy change dated, the earlier row ended).
- **Usable when** (`acceptance/Maintenance/MaintenanceSetupWalk`): `maint.admin` raises the planned-work threshold
  from next month and sees the missing costing rate in Readiness; `maint.resources` imports twelve pieces of
  equipment with starting meters, one row refused and downloadable, and Admin's Imports lists the run for a data
  operator who also holds the resource view permission.

### P19 — Assist, Comms, sync and outputs

(F117: export targets' `ownerRoute` are route keys in Admin.js `mountRoutes`.)

Design §1.4 (Assist, Comms hooks, Sync, Meetings), §12 (the outputs not built earlier); MT-16, MT-12.

- **Assist:** `skill/maintenance-report-problem.md`, `maintenance-close-work-order.md` and
  `maintenance-equipment-history.md` with their `skill/aliases.json` entries; the `assist-prompt` chips on
  EquipmentDetail, WorkOrderDetail and Home; the `response-action`s "Log as note" and "Send as message". No
  `AgentToolExposure` row.
- **Comms:** `record-lookup` for work orders, equipment and facilities; `call-context` answering the caller
  organization's open work orders and equipment under repair, with no cost.
- **Sync:** two projected, read-only calendar collections answered by `MaintenanceServices` (my work orders by
  planned window, due PM for my teams), registered on the projected kind of `get#DavCollections`, which is not
  built at the commits above (F38) and which People builds generic over an owner service (impl-people P12; P0).
- **Meetings and calendar files:** "Add video call" on WorkOrderDetail (a Commons Event with a CallLink, the vendor
  invited through `send#EventInvitations`); "Add to calendar (.ics)" on a work order and a due PM through
  `get#EventIcsMaps`.
- **Outputs:** the work order and technician instructions print with the QR of its link; the list exports (work,
  PM, bookings) with the current filters and no hidden column, each listed in Admin's Exports as a `wizard` export
  target with its owner route, as Projects' work item list is (BossSetupData.xml:4955-4957; F53).
- **Specs:** BOSS `MaintenanceStack` (the call context names open work and no cost; a projected collection refuses a
  PUT; the skills resolve by their aliases, added to `test/skill-retrieval.json`).
- **Usable when** (`acceptance/Maintenance/MaintenanceStackWalk`): Assist summarizes the compressor's history from
  its page and drives Report a problem through the terminal UI; a phone's calendar shows next week's assigned work
  orders and cannot change them; a vendor joins a call from the invitation.

### P20 — Finish

- The tui and server-static screen sweeps of Maintenance, one acceptance test per mode (each screen's twin is built
  in its phase).
- The design §11.2 review, acceptance tests (§8): `MaintenanceAccessWalk`, a user of each Maintenance group with no
  other launcher refused other organizations' work, equipment and requests, costs, another person's rate, hidden
  bookings and templates' authoring, through URLs, transitions, shared mounts, the palette, choices, files, prints,
  exports, CalDAV, Assist and direct services; and `MaintenancePhoneWalk` at 390 px over WorkOrderDetail, Report a
  problem, a meter reading and a booking decision.
- The checks P0 left open on People P9, P10, P12 and P18 (F64, F75), with the phases deferred on them; Admin P17
  and P18 were checked in P0 (F73, F74).
- The inventories' **Implemented in** columns, the design's Impl column and status line, crosscut's rows that this
  build changed, Remaining-Work, and the mr-boss README's Maintenance line.

## 4. Decisions

These are made before and during the build. Each one that changes the design is also written into
design-maintenance.md or the owner's design.

| Date | Decision | Notes |
| --- | --- | --- |
| Nov 11, 2026 | The four apps are built People, Maintenance, Sales, Marketing, each with its own plan and order; Maintenance is second | The user's call (the planning request). People is built before it, so the technician skills, availability, time and labor links to People are built here, in the phase that needs them; Sales and Marketing are not built |
| Nov 11, 2026 | A connection between two of the four apps is built in the plan of the app built later; the earlier app's plan lists it in its §7, naming the plan that picks it up | The user's call. Maintenance builds its links to People (§1). Of its links to Sales, the chargeable repair's quote is impl-sales P8's, and customer-equipment PM under a service agreement is later and Maintenance's to design after impl-sales P15 (§5 Q8); supplier warranty terms are no link to Sales (§7, F55); it has none to Marketing |
| Nov 11, 2026 | Maintenance's plan picks up everything the built apps left waiting on Maintenance, each in the phase where its records exist (§1 scope) | The user's call |
| Nov 11, 2026 | Scope is every `parity` and `new` row of design §2 and the needs they use; `later` rows and design §10 go to §7 | The user's call |
| Nov 11, 2026 | The order of §1: six stages and gates, corrective work first, then procedures, parts and money, preventive, scheduling, and reports with the registrations | The plan's choice: each gate is usable alone, and a work order must exist before anything is executed, issued, generated or reported against it. Equipment and facilities come before work orders so work has targets; downtime is in stage 1 because completion asks for the resource's disposition |
| Nov 11, 2026 | Mantle seeds the maintenance, process and resource permissions; BossSetupData grants them | The plan's choice: the Mantle services check them and Mantle stands without BOSS (impl-drawers-commons §4) |
| Nov 11, 2026 | Managed work is refused by a data check in Mantle (`MANAGED_WORK`). The rule, in the same words in impl-people §4: the generic task and work-effort services refuse a root that has a MaintenanceWorkOrder row and its steps, and work whose process policy guards execution; People's checklist tasks stay ordinary tasks. The flag is on People's `WorkEffortProcessPolicy`, false for its checklists; P6 sets it for procedures | The plan's choice under design §13.3 ("permission and data checks in Mantle, not caller-stack tests"); F8, F54. Not behind a setting: the row and the set flag exist only where Maintenance made them. BOSS also treats managed work as not a task, as it does production operations |
| Nov 11, 2026 (reconciled) | People's P7 builds both MT-03 records, minimal, under MT-03's names: `WorkEffortProcessPolicy` (the using policy, the guards-execution flag) and `WorkEffortStepPolicy` (role, due offset, required flag), with `store#ProcessStep` and the two-pass `instantiate#WorkProcess` (ID map, remapped dependencies, one `WeatBasedOn` link per node). P6 extends the records (evidence, readings, waivers, publication, the checked path of design §4.2) and the two services, and sets the flag for its procedures | Both plans say the same (impl-people P7 and §4; F54); this was §5 Q1. It is as Manufacturing P11 built Maintenance's minimal ResourceUnavailability, which P5 extends. People's `test/work/WorkProcess` must pass unchanged; Maintenance's cases are `test/work/MaintenanceProcesses` |
| Nov 11, 2026 | A managed work order's assignments are written by `schedule#MaintenanceWorkOrder`; the generic WorkEffortParty writers refuse a managed record as the other generic paths do | The plan's choice (review). Design §3's Assignments row names the generic writers "with MT-02 guards"; the guard is this refusal; design §3's Assignments row and §13 changed (Nov 11) |
| Nov 11, 2026 | Maintenance's lifecycle participant is registered in P3, with the refusal, and Admin's `find#Assignments` leaves managed work out of Projects' participant | Review (F56): from P3 Projects' reassignment of a leaver's work orders would be refused |
| Nov 11, 2026 | `instantiate#WorkProcess` is its own module; `clone#WorkEffort` and `clone#Project` are not changed | The plan's choice, over design §13.2's "extended": the two-pass clone shares almost nothing with a single-pass copy of every field (F5), and Projects' callers stay as they are |
| Nov 11, 2026 | A planned part is a WorkEffortProduct row of the step, with a unit, a required date and a source facility added; its key is the line's identity. No maintenance material record | The plan's choice under design §4.1 ("add only the fields they lack"); F30. Manufacturing's ProductionRunLine stays its own |
| Nov 11, 2026 | Accounting's AC-24 (MaintenanceCostPolicy, the issuance routing and the PostingMappings rows) is built in P9, as an owner contract following design-accounting | The user's call: there is an Accounting app, but accounting functionality is in practice spread among the other apps, so the app that needs a piece builds it, as an owner contract following design-accounting. impl-accounting's scope ended at AC-22 (F32), and a maintenance issue must not post to WIP from the first part issued. People builds AC-23 on the same ground (impl-people §4) |
| Nov 11, 2026 | Settings is built by the phases that use its fields (P3 the work policy, P6 self-approval, P8 the qualification check, P14 the job), and completed with Lookups and Readiness in P18; the lookups' core values are seeded in P3 | The plan's choice: the policy must be changeable from the gate that first reads it |
| Nov 11, 2026 | EquipmentDetail gains a tab directory for the Maintenance context, as FacilityDetail has; the other apps' contexts keep their templates | The plan's choice (F21): nine panes do not fit one page of sections, and a tab reads its own data when rendered alone |
| Nov 11, 2026 | `Facility.timeZone`, inherited from the nearest ancestor; equipment takes its facility's; no zone blocks a plan's activation | The plan's choice (F16), under design §5.1 |
| Nov 11, 2026 | The equipment import is a `rows` target of the built DataTransferServices, with row services and a scope service. It names the app's own import permission, `MAINTENANCE_IMPORT`, with Maintenance's permissions and no `ADMIN_*` permission: `MAINTENANCE_IMPORT` and `MAINTENANCE_RESOURCE_EDIT` to import and `MAINTENANCE_RESOURCE_VIEW` to view. Mantle seeds the permission, BossSetupData grants it to `BOSS_MAINTENANCE_RESOURCE_ADMIN`, and it is in that group's capability bundle (P1) | The user's call, one answer for the four apps (impl-sales §4): each app has an import permission of its own. A target's permissions are all required (framework service/org/moqui/admin/DataTransferImports.js:37-41, DataTransferBatch.js:82; F36, F51), so `ADMIN_TRANSFER_RUN` beside them would shut the resource administrator out; Admin's Imports lists a run for a data operator who also holds `MAINTENANCE_RESOURCE_VIEW`. Design §6 and §13.2 changed |
| Nov 11, 2026 | The PM generation job and the four topics are registered for Admin's Jobs and Topics; the job's run outside its schedule is its recovery | Review (F52): Admin P14's built contract; without a row a job or topic is read only there |
| Nov 11, 2026 | MaterialIssueReceipt's Maintenance context is its own pair of BOSS services, as Manufacturing's is, not a source type of Warehouse's | F31; design §3 changed |
| Nov 11, 2026 | Manufacturing's and Warehouse's "in maintenance" reads an AssetMaintenance in process, and from P5 the one outage; a planned work order blocks nothing. The same in Mantle's `store#ProductionEquipment` guard | The plan's choice (F13, F49), an owner contract with both, under the design's "Down is separate operational availability" and "An urgent report does not itself block equipment". A maintenance request for equipment with no stop no longer blocks it until work starts or an outage is recorded |
| Nov 11, 2026 | The shipped report files are `report/boss-maintenance-*.json` | F37: the built convention of mr-boss; design §1.4, §8 and MT-16 changed (Nov 11) |
| Nov 11, 2026 | A voice note is an audio file with a transcript; no audio capture element is built | The plan's choice (F38); a recorder in the page is later (§7) |
| Nov 11, 2026 | TechnicianKiosk stays later though Admin's device credential (P18) may land during this build | Design §2 has it `later`; it also needs People's kiosk identity (PE-05). §7 |
| Nov 11, 2026 | One access spec, `MaintenanceAccess`; one golden-path walk, `MaintenanceWorkOrdersWalk` (P3); every other walk and both sweeps are acceptance tests | The testing skill and Build-Test "The two suites" |
| Nov 11, 2026 | The regression budgets may be raised by this plan's estimates as its phases land, each raise by the phase's measured share: about 40 s on mr-mantle, 20 s on mr-boss's server budget and 8 s on its client budget. A raise beyond an estimate needs the user's agreement again. No spec may pass 15 seconds, as before | The user's call (AGENTS.md: a budget is raised only with the user's agreement). The estimate: nineteen Mantle specs, nine BOSS specs and one client walk, at the earlier apps' measure (about two seconds a Mantle spec: Purchasing's seventeen 32.5 s, Customer Service's fifteen 34.2 s). Today's budgets are mr-boss 264 s server and 57 s client and mr-mantle 393 s (F41), before People's share. A phase that would pass an estimate cuts a duplicate or moves a scenario to acceptance |
| Nov 11, 2026 | Maintenance labor is priced from the one labor costing purpose, `RaprCost`: Maintenance only reads `mantle.humanres.RateServices.get#CostingRate` (P11) and adds no rate purpose; an entry with no rate shows as unpriced | The user's call (impl-people §4): impl-people P10 seeds `RaprCost`, builds `get#CostingRate` and moves Manufacturing's built `RaprProductionCost` rows and lookup to it (F33) |
| Nov 11, 2026 | The planned-work approval threshold is by estimated duration or estimated cost, as design §9 has it, from what exists, with no stored estimated-cost field. Duration is the root's `WorkEffort.estimatedWorkTime` with its steps', against a threshold in hours, zero by default (P3). Cost is computed at the Approve gate: the planned parts' `WorkEffortProduct.estimatedQuantity` at the product's approved standard cost, plus the estimated hours at `get#CostingRate`, against a threshold unset by default; an estimate that cannot be priced is over it, and the planner sees no amount (P11, once P9's planned parts and impl-people P10's rate exist) | The user's call: as the design has it, estimated cost or duration, using features that exist; a piece count could be a third measure later, not for now (§7). WorkEffort has no estimated cost field (mr-mantle entity/WorkEffortEntities.xml:254) and none is added; `estimatedWorkTime` (:235), WorkEffortProduct's `estimatedQuantity` (:919) and `get#ApprovedStandardCost` (service/mantle/product/CostServices.xml:176) exist, and `get#CostingRate` is impl-people P10's |
| Nov 11, 2026 | Gate 1 is released on its own. The phase order of §1 stands as written | The user's call, as recommended: corrective work with equipment, intake and downtime replaces the baseline's maintenance forms for a small organization; each later gate adds an area to the menu |
| Nov 11, 2026 | P8, P11, P12, P19 and P17's cost entry wait for People P9 and P18, P10, and P12; the other phases are built now, stages 3, 4 and 5 starting after P7 (P15 after P5, beside P7) | The user's call (the build request): People is being built at the same time; P8 needs People P9's capacity and P18's `minimumSkillLevel` and `check#Qualifications`, P11 People P10's `RaprCost` and `get#CostingRate`, P12 P11's cost summary, P17's cost entry P11, and P19 People P12's projected collection kind. Stages 3 to 5 use P3 and P6, not P8. A phase built now that touches one of those pieces leaves a seam and says so: P6's skill standards carry no level (F75) |
| Nov 11, 2026 | Maintenance has its own all-organizations permission, `MAINTENANCE_ALL_ORGANIZATIONS`, granted to `BOSS_MAINTENANCE_ADMIN` alone; `FACILITY_ALL_ORGANIZATIONS` no longer widens Maintenance's scope | The user's call (P1, F76), as People's `PEOPLE_ALL_ORGANIZATIONS`; built in P1's review (R3) |
| Nov 11, 2026 | `BOSS_MAINTENANCE_ADMIN` holds every `MAINTENANCE_*`, `WORK_PROCESS_*` and `RESOURCE_*` permission, and its bundle follows | The user's call (P1, F76); design §1.1 named none; built in P1's review (R4) |
| Nov 11, 2026 | The planner, supervisor and resource administrator groups hold `PEOPLE_DIRECTORY_VIEW`, so Employee360's public work card opens under Maintenance | The user's call (P0's F62), kept after P1 |
| Nov 11, 2026 | A custodian Maintenance names is one of the scope's internal organizations, a person one of them employs now, or the equipment's own owner organization for a customer's equipment (`HOLDER_UNAVAILABLE`), in Mantle | The user's call (P2 review), as People's return; built as R7 |
| Nov 11, 2026 | An ownerless facility belongs to its nearest owning ancestor in Warehouse's facility checks too (FacilityScope.js, FacilitySetup.js), as in Maintenance's; owned facilities unchanged; the stock guards still read the facility's own owner | The user's call (P2 review), an owner contract with Warehouse (design-warehouse §1, impl-warehouse §4); built as R8 |
| Nov 12, 2026 | The client budget estimate for this build is 9 s (was 8 s) | The user's call (P3): MaintenanceWorkOrdersWalk took 8.5 s, 8.16 s after the review's trim |
| Nov 12, 2026 | A leaver's work orders and custody are moved by Maintenance staff (a planner, supervisor, resource or Maintenance administrator); Admin's identity operator sees them in offboarding with who moves them, and holds no transfer permission | The user's call (P3); built as the review's R5 |
| Nov 12, 2026 | Admin's settings registry is the framework's `moqui.server.SettingsEntry` (mr-moqui Admin-Screens-Down); Maintenance's row has the route `maintenanceSettings` in Admin.js, and P18's readiness provider goes where the framework's registry has it | Found at the P3 merge (F116) |
| Nov 12, 2026 | People P8–P12 are merged (`RaprCost` and `get#CostingRate`, capacity from schedules, holidays, the projected collection kind), so P11, P12, P17's cost entry and P19 are built in their order; only P8 waits, for People P18 (`minimumSkillLevel`, `check#Qualifications`) | Updates the deferral row above (the pulls of Nov 12) |
| Nov 12, 2026 | A resource is restored while linked work orders are still open: `end#ResourceUnavailability` lists them, leaves them open and needs a reason while any is (`openWorkReason`) | The user's call (P5); built as the review's R1, replacing the worker's `OPEN_WORK` refusal |
| Nov 12, 2026 | `create-from` (a chat message, voicemail or mail) opens Report a problem prefilled, through a Comms screen-target action, built in P19 | The user's call (P4) |
| Nov 12, 2026 | A reporter sees the assignee's name on their report; design §3 says so | The user's call (P4) |
| Nov 12, 2026 | Every Maintenance group holds `MAINTENANCE_REQUEST` and `MAINTENANCE_REQUEST_VIEW_OWN` and Report a problem (`BOSS_MNT_REPORT_PROBLEM`), in their bundles too | The user's call (P4): every Maintenance user reports a problem and follows their own report |
| Nov 12, 2026 | An approved procedure that is edited returns to Draft: new work waits for its next approval; existing work keeps what it was made from | The user's call (P6) |
| Nov 12, 2026 | P7: a voice note is transcribed only when the organization's MaintenancePolicy turns transcription on (off by default); the audio is kept either way | The user's call (P7) |
| Nov 12, 2026 | P7: an amendment may add or remove not-yet-started steps of an open execution, with the invalidations previewed | The user's call (P7) |
| Nov 12, 2026 | P9: MaintenanceCostPolicy's purpose is the maintenance kind (corrective or preventive) with an any-kind fallback | The user's call (P9), as built |
| Nov 12, 2026 | P9: a supplies part issued to managed maintenance work is routed to the cost policy's expense account; supplies elsewhere post as today | The user's call (P9) |
| Nov 12, 2026 | P13: a procedure is optional on a plan; one named (or the model default's) must qualify; with none P14 generates an ad hoc work order with the term's estimate; activation needs a time zone. A draft's terms change in place until activation, dated rows from it | The user's calls (P13); the estimate optional and the model default inherited, as the review recommended |
| Nov 12, 2026 | P16: an approver sees a meeting's title only when it is shared with them; Commons' own Rooms and equipment are unchanged (blackouts shown later, in a Commons change) | The lead's acceptance of the worker's recommendations (P16) |

## 5. Open questions

| Question | Decides | Notes |
| --- | --- | --- |
| Q1 (answered Nov 11; now a decision in §4) Who builds the first part of the shared process engine (MT-03)? | P6 | People's P7 builds both policy records, minimal, and the two services; P6 extends them and sets the guards-execution flag. Nothing is open |
| Q2 (answered Nov 11, §4) Which costing rate prices maintenance labor? | P11 | The one purpose, `RaprCost`, through `get#CostingRate` (impl-people P10 and §4). Nothing is open |
| Q5 Does the managed-work refusal apply to Customer Service's warranty repairs before P12? | P3, P12 | Recommended: no. A repair becomes managed only when P12's adapter gives it a root under the organization's policy; until then `update#WarrantyWork` moves it as today |
| Q7 (answered Nov 11, §4) The planned-work approval threshold: by estimated cost or duration? | P3, P11 | Both, from what exists: estimated hours in P3, and in P11 a cost computed from the planned parts and labor, never stored and never shown to a planner. Nothing is open |
| Q8 Customer-equipment PM under service agreements (design §15, R-MNT-F01) | after impl-sales P15 | Recommended: later, as the design recommends, and Maintenance's to design: a MaintenanceSchedule linked to Sales' AgreementDetail once impl-sales P15 has built it, its visits under the customer repair rules of P12. It is in neither build (§7, F55); impl-sales §5 Q11 points here |
| Q9 Where does a resource's time zone come from when no facility in its ancestry has one? | P2, P13 | Recommended: nowhere. The plan cannot be activated until a zone is set, as design §5.1 says; P2's import and NewFacility ask for it on a top-level facility |
| Q10 Is an in-page voice recorder wanted for step responses? | P7 | Recommended: not now. A phone's file input records audio; the transcript is the searchable part |
| Q11 (answered Nov 11, §4) Who may run the equipment import? | P18 | A holder of `MAINTENANCE_IMPORT` with the resource edit permission. Nothing is open |
| Q12 Further issues discovered during implementation | the affected phase | Record findings and decisions here |

## 6. Findings

Design assumptions found wrong or unstated in the code, with the resolution. Where a resolution changes the design,
it is written there too. F1–F48 were found on Nov 11, 2026, while writing this plan, and F49–F57 in its review the
same day, at mr-moqui 16828c5f, mr-boss f1bf2a95 and mr-mantle 0048667f; F58–F75 are P0's, at mr-moqui 5d83f22d,
mr-boss 9c7e87e4 and mr-mantle 61e5ae33. Mantle paths are under `mr-mantle/`, BOSS
paths under `mr-boss/`.

| # | Finding | Resolution |
| --- | --- | --- |
| F1 | P0: `screen/Maintenance/` has six flat placeholders (Home, WorkOrders, Equipment, Facilities, Scheduling, Settings); the root mounts only Chatter and RecordFiles and has no `<shell-providers>`. Its comment says the grant is commented out (screen/Maintenance.xml:15-17); in fact `BOSS_MAINTENANCE` (data/BossSetupData.xml:221-228) gives `ADMIN` and `BOSS_MAINTENANCE_ADMIN` `AUTHZT_ALWAYS` on the root, as design §1.1 says. `BOSS_MAINTENANCE_ADMIN` (:29) is the only Maintenance group; there is no `ironstone.maintenance` service, `test/Maintenance` or `acceptance/Maintenance` | P1 |
| F2 | P0: no entity filter covers WorkEffort, Asset or AssetMaintenance (impl-manufacturing F3, impl-customer-service F67), so `MANTLE_USER_ORG` scopes none of Maintenance's main records | §2: work rows through services |
| F3 | P0: none of the design's proposed Mantle families exists (`service/mantle/work` and `service/mantle/product` hold no MaintenanceServices, ProcessServices, MaintenancePlanServices, MaintenanceResourceServices, MaintenanceExecutionServices, MaintenanceReportServices, MaintenanceSettingsServices or MaintenanceImportServices); `ResourceBookingServices` has one service, `record#ResourceUnavailability` (ResourceBookingServices.xml:21) | The phases; P5 extends the one |
| F4 | P0: `WorkEffort.isTemplate` is described as a project kept as a template for `clone#Project` (entity/WorkEffortEntities.xml:192-193), and Manufacturing's routing and operation templates also set it (service/mantle/work/Routings.js:215, :287). `WepMaintenance` (:380), `WeatDependsOn` (:593), `WeatBasedOn` (:595) and `WeatClone` (:596) are seeded, as design §1.3 says | P6: a maintenance template is `WetTask`, `WepMaintenance` and has a process policy that guards execution; every template list filters on all three; the description made general |
| F5 | P0: `clone#WorkEffort` (service/mantle/work/WorkEffortServices.xml:63) is as design §1.3 says: every non-key field copied, `clearDates` touching four dates, `copyAssoc` keeping the source's targets, content rows copied as they are, no ID map. `clone#Project` (ProjectServices.xml:17) is Projects' copy | P6, §4: instantiation is its own module |
| F6 | P0: the Default WorkEffort flow allows In Planning → In Progress and → Complete, Complete → In Progress and Closed → In Planning (WorkEffortEntities.xml:414-430), and the framework's status check ignored `statusFlowId` when Manufacturing checked it (impl-manufacturing F9) | P3: the service is the gate, not the flow; P0 rechecks the framework |
| F7 | P0: `TaskServices.set#TaskStatus` writes now as `actualCompletionDate` on Complete (TaskServices.xml:755-800), and `WorkEffortStartCompleteDates` fills a date only when empty (service/WorkEffort.secas.xml:17-29). Design §3 and §13.3 are right only if the transition does not go through `set#TaskStatus` | P3: the transition writes status and the entered dates in its own update |
| F8 | P0: `update#Task` (TaskServices.xml:212-250) and `set#TaskStatus` check no type or purpose; `delete#WorkEffort` (WorkEffortServices.xml:213) and the WorkEffortParty writers (:269-320) neither. BOSS keeps production operations out of its own task checks (service/ironstone/commons/TaskServices.xml:85-90, CommonsServices.xml:185-186; impl-manufacturing F38), with no Mantle refusal | P3, §4: the `MANAGED_WORK` refusal in Mantle, and the BOSS check as for production |
| F9 | P0: the review Y1 fix is built: a VTODO PUT goes through `update#Task` and `set#TaskStatus`, and an event PUT checks its bookings (service/mantle/work/CalendarDavServices.xml:21-22, :246-252). `get#TaskObjectTags` still lists every assigned `WetTask` that is not cancelled, with no purpose or template filter (:97-133), and `delete#DavObject` ends a task's assignment with a direct update (:440-448). Crosscut §1.3's row for these services still describes the PUT as a direct update | P3; crosscut §1.3's row changed (Nov 11) |
| F10 | P0: AssetMaintenance has `taskWorkEffortId`, `purchaseOrderId` and an audit-logged status (entity/ProductAssetEntities.xml:730-748). Its flow has six transitions (:773-778): none from in process to cancelled, none back from completed, none from scheduled to created | P3 seeds the three the synchronization needs |
| F11 | P0: `create#AssetMaintenance` (service/mantle/product/EquipmentServices.xml:79-114) checks no permission or organization, defaults `maintenanceDate` to now (:88), sets no status, and creates an AssetMeter reading for a nonzero `intervalQuantity` (:108-112); `get#AssetMaintenanceNeeded` (:29-77) takes the highest meter value and the latest maintenance by date whatever its status; `create#Equipment` (:17-27) is an unchecked entity create. As design §1.3 and §5.1 say | P2 (the guarded equipment writer), P3 (controlled inputs), P13 (the helper not called) |
| F12 | P0: two apps already write AssetMaintenance and its task. Manufacturing's `request#ProductionMaintenance` (ProductionServices.xml:1218) makes one as created and corrective, with an optional `RqtMaintenance` Request. Customer Service's `link#WarrantyWork` (service/mantle/request/WarrantyServices.xml:240) makes one with a `WepMaintenance` task in `taskWorkEffortId`, and `update#WarrantyWork` (:271) moves its status with the task following (impl-customer-service F167); the rule `WarrantyWorkFinished` fires on completed (entity/SupportWarranty.eecas.xml:22). Design §1.3 and §13.2 called both adapters proposed | P3 (adoption), P4 (production), P12 (warranty); design §1.3 and §13.2 changed (Nov 11, review) |
| F13 | P0: Manufacturing shows equipment as "In maintenance" and blocked when it has any open AssetMaintenance dated now, earlier or undated (service/ironstone/manufacturing/WorkCenters.js:94-121), and Warehouse shows any open AssetMaintenance, whatever its date, as "In maintenance", a warning with no block (service/ironstone/warehouse/Facilities.js:435-438, :471-477). With F11's default date, a work order merely planned would block its equipment in Manufacturing | P3, §4: both read in process only (F49 for Mantle's guard); P5 the outage |
| F14 | P0: `ResourceUnavailability` is Manufacturing P11's minimal record (entity/ResourceBookingEntities.xml:21-47): kind, asset or facility, organization, interval, description and the source production downtime; no reason, work or step source, correction chain or revision. `record#ResourceUnavailability` (ResourceBookingServices.xml:21-74) is internal, checks no permission, and refuses anything but an actual outage of an asset. Manufacturing P12 writes planned blocks of a facility itself (service/mantle/work/ProductionSchedule.js:878-1028) | P5 extends the record and the service; P15 takes the planned blocks |
| F15 | P0: booking is as design §1.3 says: `book#Resource` (service/mantle/work/EventServices.xml:1896-1993) and `check#ResourceBookings` (:2028-2125) request approval when the resource has a current `BookingApprover` and accept a caller's `allowConflicts`. Two things the design does not say: nothing in Mantle or BOSS moves a requested booking to assigned or denied (the statuses are written only there and read by Commons, service/ironstone/commons/ScheduleServices.xml:114, CalendarServices.xml:481-482), and EventServices reads no ResourceUnavailability, so a down asset can be booked | P15 (the availability read), P16 (`decide#ResourceBooking` is the first decision path) |
| F16 | P0: Facility has `bookable`, `capacity` and `capacityUomId` (entity/FacilityEntities.xml:32-34) and Asset `bookable` and capacity (ProductAssetEntities.xml:70), as design §1.3 says; neither has a time zone, and there is no room feature record. `store#Facility` (service/mantle/facility/FacilityServices.xml:350-393) takes none of bookable, capacity or a zone, though design NewFacility sets them through it | P2 adds the field, the feature record and the parameters; §4, §5 Q9; design §6 Facilities says so (Nov 11, review) |
| F17 | P0: `AssetRecordServices.update#AssetMetadata` needs `STOCK_ADJUST` and the stock scope (service/mantle/product/AssetRecordServices.xml:19-45); design §6 and MT-06 have the resource administrator, who holds `MAINTENANCE_RESOURCE_EDIT`, change equipment metadata through it | P2: `store#MaintenanceEquipment` writes equipment's name and comments under its own check; design §6, MT-06 and §13.2 changed (Nov 11, review); crosscut §7.6's row and §3.10's custody and room forms changed (Nov 11) |
| F18 | P0: `replace#AssetPartyAssignment` (service/mantle/product/AssetServices.xml:3232-3254) checks no permission or scope and takes no date: it ends every current row of the role now | P2: a guarded custody change calls it; it gains an optional effective date |
| F19 | P0: AssetMeter's key is the asset and the reading time, with `workEffortId`, `readingReasonEnumId` and `assetMaintenanceId` (ProductAssetEntities.xml:821-831), as design §5.1 says; ProductMeter has no field saying a meter is cumulative (:851-857) | P2; P0 checks the reason values |
| F20 | P0: Asset has no `warrantyThruDate` or `warrantyPartyId` (ProductAssetEntities.xml:28-100), and ProductAssocType has `PatAccessory` and `PatRepairService` (entity/ProductDefinitionEntities.xml:236, :238) but no `PatSparePart`; both are proposed in the design | P2 as designed |
| F21 | P0: EquipmentDetail is one screen of 865 lines that branches on `appRoot`, each app's context a template (screen/Shared/EquipmentDetail.xml:15-26, :77-92), with the Book transitions on it; it has no tabs. Design §6 gives Maintenance nine panes | P2, §4: a tab directory for Maintenance's context |
| F22 | P0: FacilityDetail's tabs are files admitted by `appRoot` (screen/Shared/FacilityDetail.xml:21-27, :73); its update transition calls Warehouse's `check#Record` for every app (:38-42), and the Schedules tab reads Warehouse's service (FacilityDetail/Schedules.xml:24-33). The design's Rooms and features, Equipment, Work orders and Certifications tabs do not exist | P2, P3, P15 |
| F23 | P0: Product360 has an Equipment tab for an equipment model's meters and maintenance defaults, written through Products' `store#CatalogRow` (screen/Shared/Product360/Equipment.xml:16-33; service/ironstone/products/Catalog.js:136-138), and its always-actions ask Products' catalog context for the app root (Product360.xml:33) | P2 mounts it and adds spare parts; P6 the template check; P0 the catalog context |
| F24 | P0: InventoryAvailability asks the same catalog context (screen/Shared/InventoryAvailability.xml:25) | P9; P0 |
| F25 | P0: RequestDetail branches by app (screen/Shared/RequestDetail.xml:304-351); Manufacturing's context shows an `RqtMaintenance` request of the user's plants (:44-50; service/ironstone/manufacturing/Downtime.js:49-57), and Commons lets only the request's own people comment and add tasks, so triage waits for Maintenance (impl-manufacturing F98) | P4 |
| F26 | P0: WorkItemDetail passes `projects` or `commons` to Commons' task services (screen/Shared/WorkItemDetail.xml:79-186); Manufacturing's context shows a follow-up task and refuses production work (:430-475, :633-635) | P7 on that pattern |
| F27 | P0: `complete#RequestFromWork` moves a request only for a project's item under the project's setting; a task with no project moves nothing (service/mantle/request/RequestServices.xml:1499-1513). A maintenance root is no project, so its completion closes no request today; the type-aware guard design §13.3 asks for is already the behavior | P4 keeps it with a spec; no change |
| F28 | P0: the rules of entity/Work.eecas.xml run for every `WetTask`: `WorkEffortTaskDefault` (:27-30) only zeroes actual time and sets remaining time (TaskServices.xml:1238-1249); `WorkEffortUpdateProject` (:22-25) rolls a rooted task's time to its root; `WorkEffortPartyDocsUsers` (:33-36) runs for every WorkEffortParty. `WorkEffortInstructionImmutable` (:46-58), Manufacturing's guard of `WectInstruction` content, is not in design §13.3 | P3 conditions the docs rule and checks the rollup against double counting; P6 and P0 for the instruction rule |
| F29 | P0: `WorkEffortPartyAssignedNotify` fires for every new Assignee row and `WorkEffortRecurringTaskNext` for every completed or cancelled work effort (service/WorkEffort.secas.xml:33-41), as design §13.3 says | P3 |
| F30 | P0: WorkEffortProduct's key is the work effort, product and from date, with no unit, required date or source facility (WorkEffortEntities.xml:912-919); WorkEffortAssetNeeded's is the work effort and product (:552-558); WorkEffortSkillStandard has no level (:1057-1062); Manufacturing keeps its lines in its own ProductionRunLine (entity/ProductionMaterialEntities.xml:22). AssetIssuance has `workEffortId`, `facilityId` and `assetMaintenanceId` and no cost centre or project (ProductAssetEntities.xml:649-693) | P9, §4 |
| F31 | P0: MaterialIssueReceipt takes its source from the mounting app's own services: Warehouse's PackingServices by `sourceType`, Manufacturing's `MaterialServices.get#MaterialSource` and `get#MaterialAction` by the run, each after its own `check#Record`, and any other app is refused (screen/Shared/MaterialIssueReceipt.xml:40-64, :79-93). Design §3 had Maintenance add a source type to Warehouse's | P9: Maintenance's own pair; design §3's mount row changed (Nov 11) |
| F32 | P0: an issuance to a work effort with the asset's owner posts to WIP (service/mantle/ledger/AssetAutoPostServices.xml:267-277, :309). Nothing in Mantle names `MaintenanceCostPolicy`, and impl-accounting's scope is AC-01 to AC-14 and AC-18 to AC-22 (impl-accounting.md:71), so AC-24 is not built | P9, §4 |
| F33 | P0: the RatePurpose values are `RaprClient` and `RaprVendor` (entity/HumanResourcesEntities.xml:1058-1059) and Manufacturing's `RaprProductionCost` (data/ProductionShopFloorData.xml:27); there is no `RaprCost` and no `RateServices.get#CostingRate` | P11; impl-people P10 builds both and moves Manufacturing's rows and lookup to `RaprCost` (§4) |
| F34 | P0: of People's pieces, Mantle has PartySkill with a rating and level and PartyQualification (HumanResourcesEntities.xml:29-58), the `OrgTeam` role (entity/PartyEntities.xml:727) and `PrtMember` (:556); it has no DevelopmentServices, OrganizationServices or ProcessServices. `find#StaffingCandidates` takes one skill and weekly hours or a percent and ranks people who keep time (service/mantle/work/ResourceServices.xml:1087-1110); `get#PartyCapacity` already counts holidays and leave (:16-24, :41) | P8; P0 after People (F54 for the phases) |
| F35 | P0: Admin's registries as built: ReadinessProvider, RefreshOperation, SettingsEntry and LifecycleParticipant are BOSS entities (entity/AdminEntities.xml:21, :53, :79, :225; since Nov 11, 2026 the first three are the framework's `moqui.server` entities, impl-admin §9) seeded in BossSetupData (Accounting's provider and entry :2550-2556, Manufacturing's entry :2592-2595, Projects' participant :4060-4064); the capability registry is the framework's CapabilityBundle with its artifact and permission rows (Manufacturing's :2916-2938), and Maintenance's bundles were left out as unbuilt (impl-admin.md:932) | P1, P3, P18 |
| F36 | P0: an import target is a `moqui.server.TransferTarget`. Staff invitations are a `rows` target with a row validator, a row applier and a scope service, the framework keeping the batch (mr-mantle data/PartyInvitationData.xml:48-61); the catalog is a `steps` target with its own batch (data/ProductImportData.xml:13-26). Shared/DataImport's mount knows Admin and a catalog app only, and owner routes are a fixed table (service/ironstone/shared/DataImport.js:18-27, :38-67). Design §6 and design-admin §11.1 name `preview#` and `apply#MaintenanceImport` | P18; design §6 and §13.2 changed (Nov 11); design-admin §11.1's row changed (Nov 11) |
| F37 | P0: Insights' registries are BOSS entities (AdminEntities.xml:112, :146, :192, :261, :287) with Manufacturing's rows as the pattern (BossSetupData.xml:3621-3655, :3818, :3983-3989) and dataset classes at :4783-4785. A shipped dataset is a DataDocument, a feed and `report/boss-<area>-*.json` (data/BossCustomerServiceReportData.xml:15-25), not `report/maintenance-*.json`. The internal flow map has Maintenance's step as information (impl-insights.md:2062) | P17, §4 |
| F38 | P0: the framework pieces the design uses exist: `scan-input` (framework/xsd/xml-form-3.xsd:1368), `view-tree` (:350), `view-board` (:247), `view-calendar` (:306), `density` (xml-screen-3.xsd:120), `assist-prompt` (:762), `response-action` (:774), `record-lookup` (:600), `create-from` (:604), `call-context` (:612), `quick-create` (:681), `transcribe#Audio` (framework/service/org/moqui/call/SpeechServices.xml:22), `create#CallLink` (CallServices.xml:304) and `run#Extract` (agent/AiTaskServices.xml:85). Neither XSD has an audio capture input, which StepResponse names, and `get#DavCollections` (CalendarDavServices.xml:137) has no projected kind | P7 (§4, §5 Q10); P19 on impl-people P12's kind |
| F39 | P0: the `EmailRuleAction` values are `ErActCreateRequest` and `ErActCreateWorkItem` (data/MantleSetupData.xml:464-466) over `create#RequestFromEmail` (RequestServices.xml:946), with `findOrCreate#EmailSender` (:1194) and `file#RequestEmail` (:1237) to reuse | P4 |
| F40 | P0: an app's shell contributions are its root's `<shell-providers>` (screen/Manufacturing.xml:46-82: palette source, quick create, notification topics, Today source, keymap); Commons' approvals inbox reads notification topics | P1, P3, P6, P16 |
| F41 | P0: the regression budgets are mr-boss's 264 s server and 57 s client (test/budget), last raised for Commerce by its comments, and mr-mantle's 393 s | §4: the user approved raises up to the plan's estimates |
| F42 | P0: the baseline forms design §11.1 maps exist in mr-marble: FindAsset CreateEquipment and ListAssets (screen/SimpleScreens/Asset/Asset/FindAsset.xml:68, :91), AssetMeters (AssetMeters.xml:30, :46), AssetParties (AssetParties.xml:31, :51), AssetRegistrations (AssetRegistrations.xml:29, :44), AssetCalendar NewEventForm (AssetCalendar.xml:34), FindAssetMaintenance's four forms (AssetMaintenance/FindAssetMaintenance.xml:31, :54, :91, :131) and EditAssetMaintenance's three (EditAssetMaintenance.xml:55, :101, :118). ss-inventory names a Maintenance path in 61 rows, the maintenance forms' **Implemented in** empty (ss-inventory.md:299-311) | Each phase fills its rows |
| F43 | P0: Measurement carries a work effort, asset, facility, product meter, AssetMaintenance and reason (WorkEffortEntities.xml:1430-1444); MeasurementServices has only a unit lookup (service/mantle/work/MeasurementServices.xml:17) | P7 as designed |
| F44 | P0: WorkEffortApproval is Projects' milestone gate: an approver party, a status, a file, who requested and who decided (WorkEffortEntities.xml:1139-1157) | P6 uses it for a procedure's publication decision |
| F45 | P0: `accept#ServiceItem` is built (service/mantle/order/OrderServices.xml:3233); AssetMaintenanceOrderItem exists with no service that writes it (ProductAssetEntities.xml:810-814); impl-purchasing does not mention Maintenance, so its RequestDetail's originating work order is not built | P10 |
| F46 | P0: Admin's `projects.assignments` participant reassigns a user's open tasks through the generic services (BossSetupData.xml:4060-4064), which after P3 refuse managed work | P3 registers Maintenance's participant (F56); P15 adds the approver roles |
| F47 | P0: `check#WorkEffortOpen` (WorkEffortServices.xml:17-56) is the planning guard the task services share: it refuses a change in a closed project and knows nothing of maintenance | P3's refusal sits beside it in the same services |
| F48 | P0: the timer and time services exist as design §1.3 says (`get#Timer`, `start#Timer`, `stop#Timer`, service/mantle/work/TimesheetServices.xml:1238-1307; `store#TimeEntry`, TimeServices.xml:17); a template is refused by name only in the time import (TimeServices.xml:1872) | P3; P0 for the access check |
| F49 | P0 (review): the block on equipment in maintenance is also in Mantle: `store#ProductionEquipment` refuses, with `EQUIPMENT_BLOCKED`, equipment that has any open AssetMaintenance dated now, earlier or undated (service/mantle/work/ProductionOrders.js:1031-1045, :1089-1090). No spec asserts that half: ProductionOrders.spec.js:712 blocks on the asset's status | P3 changes the guard with the two apps' reads; §4 |
| F50 | P0 (review): an `artifactName` holds 255 characters and the client deny pattern's rows name every app package (BossSetupData.xml:445-467). With People's `people` the longest row is 244; `maintenance` takes it to 256 and the row of `record` to `reply` to 252, which `sales` would take to 258 (impl-people F26, impl-sales F25) | P1 splits both rows; with them split every row holds all four names |
| F51 | P0 (review): a transfer target's `importPermission` and `viewPermission` are comma lists of which the caller must hold every one (framework service/org/moqui/admin/DataTransferImports.js:37-41, DataTransferBatch.js:82, :845); staff invitations name `ADMIN_TRANSFER_RUN` because Admin runs them | P18: the equipment target names `MAINTENANCE_IMPORT` with Maintenance's permissions and no Admin permission (§4) |
| F52 | P0 (review): Admin P14 built the delegated job and topic contract in the framework: without a `moqui.server.JobRegistration` a job, and without a `TopicRegistration` a topic, is read only in Admin, and a job's run outside its schedule is a `RecoveryDescriptor` of kind `ServiceJob` (framework entity/ServerEntities.xml:560-581, :620-680; data/AdminConfigurationData.xml:376-407). The store channel's descriptors are for system messages (mr-mantle data/StoreChannelSetupData.xml:42-48), not the pattern for a job | P14 registers the job and its recovery; P3, P6, P14 and P16 register their topics |
| F53 | P0 (review): an export an owner makes in its own place is listed in Admin's Exports by a `wizard` export target with an owner route (BossSetupData.xml:4937-4957; service/ironstone/admin/Data.js:15-23), with nothing dispatched; Projects' work item list is one | P19 on that pattern; P0 for the reports' CSV |
| F54 | P0 (review, reconciled): impl-people builds what Maintenance uses in these phases: both MT-03 policy records, minimal, with a guards-execution flag that is false for its checklists, and `store#ProcessStep` and the two-pass `instantiate#WorkProcess` (P7, §4, its F14 and F54); the return task and the Mantle rule on the end of an AssetPartyAssignment that completes it (P7); Employee360 (P2); teams and membership (P3); capacity and holidays (P9); `RaprCost` and `get#CostingRate` (P10); the generic projected collection kind (P12); `minimumSkillLevel` and `check#Qualifications` (P18); the kiosk identity (P30). This plan's review read an earlier impl-people, which had no policy record | §1, P2, P6, §4 |
| F55 | P0 (review): impl-sales builds the chargeable repair's sales quote in its P8, over Customer Service's decision; it lists customer-equipment PM under a service agreement in its §7 as Maintenance's to design after its P15, and says supplier warranty terms as an Agreement are not Sales': the agreement is in the purchase direction, on statuses Purchasing seeded | §7: the second is later and Maintenance's to design (§5 Q8); the third is no link to Sales |
| F56 | P0 (review): Admin's `find#Assignments` lists every open `WetTask` assignment of a user and reassigns through Projects' and Commons' services (service/ironstone/admin/Lifecycle.js:252-270, :301-325), which treat managed work as not a task from P3 | P3 registers Maintenance's participant and leaves managed work out of Projects'; §4 |
| F57 | P0 (review): Customer Service built no action that sends an intervention report: impl-customer-service §7 left the report to Sales and Maintenance (impl-customer-service.md:3683) | P12 adds the send action to RepairLinks, as an owner contract |
| F58 | P0: People P7's process records and services as built: `WorkEffortProcessPolicy` (policy, `guardsExecution` default N, `operationKey`, indexed) and `WorkEffortStepPolicy` (`isRequired`, `roleTypeId`, `dueOffsetDays`), both dated (entity/WorkProcessEntities.xml:25-64), with `WppPeopleChecklist` the one policy value; `store#ProcessStep`, `instantiate#WorkProcess` and `check#ManagedWork` (service/mantle/work/ProcessServices.xml:22-97) over WorkProcesses.js. One permission per policy, the same for changing and instantiating a process (WorkProcesses.js:34, :71-77). The instantiation copies the definition fields only (:36-51): every node In Planning with the start as its estimated start (:247-270), the in-tree `WeatDependsOn` edges remapped, one `WeatBasedOn` link, the step policies, Assignee rows by role, and the process policy with its flag (:272-317); no WorkEffortContent, WorkEffortProduct, WorkEffortAssetNeeded or WorkEffortSkillStandard row is copied. People's Checklists.js calls `storeStep` and `instantiate` directly after its own check (Checklists.js:264, :282, :413; WorkProcesses.js:362-372) | P6: `WppMaintenanceProcedure` joins the policies table with its own edit permission (`WORK_PROCESS_EDIT`) and instantiation permission (`MAINTENANCE_PLAN`, through `create#MaintenanceWorkOrder`), and its checked path (approval, effectivity) runs before People's `instantiate`, then copies what a procedure carries (requirements and skill standards from the template steps; instructions are resolved, not copied, F68); People's path and `test/work/WorkProcess` unchanged |
| F59 | P0: People P7 built the managed-work refusal in Mantle already: `check#ManagedWork` (WorkProcesses.js:323-349) refuses with `MANAGED_WORK` work whose own, parent's or root's process policy guards execution, and a root, or work under a root, that has a `mantle.work.maintenance.MaintenanceWorkOrder` row once that entity is defined (:32, :338-342). It is called by `create#Task` for a parent or root (TaskServices.xml:175-180), `update#Task` (:245), `set#TaskDates` (:603), `set#TaskStatus` (:791), `move#Task` (:841), `set#TaskRecurrence` (:1082), `delete#WorkEffort` (WorkEffortServices.xml:225) and `add#`, `remove#` and `replace#WorkEffortParty` (:286, :312, :336); People's WorkProcess.spec.js:285-292 asserts it. Not covered: BOSS `get#TaskAccess` and `check#TaskUpdate` (no reference to it in mr-boss), CalDAV (F63), `create#WorkEffortContent` (WorkEffortServices.xml:964-990 checks only `check#WorkEffortOpen`) and the time services (F66) | P3 defines `MaintenanceWorkOrder` under that exact name, keyed by `workEffortId`, which turns the built refusal on for work orders; it does not change the generic services' calls, and `MaintenanceManagedWork` asserts them for a work order. P3 adds the BOSS, CalDAV and time halves |
| F60 | P0: People P3's `store#Membership` writes a team membership as a dated `PrtMember` PartyRelationship from the person (from role `Assignee` for a member, `Manager` for the lead) to the unit (to role `OrgTeam`), a new lead's predecessor staying a member (service/mantle/humanres/Organization.js:12-16, :525-545); a department's members are the same relationship to an `OrgDepartment` (Employment.js writes them with an assignment); a unit's employer is its `ownerPartyId` (Organization.js:406). Writes need `PEOPLE_HR_VIEW` and `PEOPLE_HR_EDIT` (OrganizationServices.xml:119-130) | P8 (deferred): `find#MaintenanceTeams` reads `PrtMember` rows to role `OrgTeam` only, both from roles as members, dated, the team's organization its `ownerPartyId`; Teams stays read only with the link to People, as design §9 Teams has it |
| F61 | P0: the return task's rule fires on any update that sets an empty `thruDate`, whatever its value (entity/PeopleChecklist.eecas.xml:21-26), and completes the open return tasks of the asset, holder and role through `set#TaskStatus` at once, logging a failure (PeopleServices.xml:994-1008; Checklists.js:557-607); `replace#AssetPartyAssignment` ends the other holders now (AssetServices.xml:3239-3253). A custody change ending a holding on a later date would complete its return task when entered, before the equipment is back; an earlier date completes it now | P2: the guarded custody change takes an effective date of now or earlier (a later one refused, `DATE_FUTURE`); the ended row and the new one share it, and the rule then holds as for People's and Warehouse's changes |
| F62 | P0: Employee360's per-app table is People.js `employee360Apps` (service/ironstone/people/People.js:650-669): People, Commons and Insights; another app root is refused (`PEOPLE_CONTEXT`, :675-676). A row names its regions, own-only regions, edits and return. Mantle's `get#Employee360` admits a person by People's scope (self, team or staff; PeopleServices.xml:183-213), a staff admission needing `PEOPLE_DIRECTORY_VIEW` (mr-mantle service/mantle/humanres/People.js:36), which only `BOSS_PEOPLE_READ` holds in BOSS (BossSetupData.xml:5080). AssignedEquipment is People's mount only (`showsEquipment`, People.js:716) and `get#AssignedEquipment` answers the person and HR (PeopleServices.xml:1040-1054). Qualification validity is People P18's, not built | P2: Maintenance's row is the Overview, read only, returning to Equipment; its AssignedEquipment pane reads current AssetPartyAssignment rows through Maintenance's own service, in its scope, not People's; P1 grants `PEOPLE_DIRECTORY_VIEW` to the planner, supervisor and resource administrator groups so the public work card opens for them; qualification validity waits for People P18 (P8) |
| F63 | P0: People left its protected tasks (`ChecklistStep.isProtected`) out of `get#TaskObjectTags` (CalendarDavServices.xml:97-141, :124-129); there is no template filter and no read-only mark. A PUT on a work order root would now reach `update#Task` and fail with `MANAGED_WORK`, which the DAV server answers 409, not 403 (:259-261, :307-330); DELETE still ends the assignment with a direct update (:449-455) | P3 adds its filter beside `protectedIds` (templates and the steps of managed work left out, a managed root marked read only) and answers 403 for a PUT or DELETE on a managed root before any update |
| F64 | P0: capacity and holidays as they are: `get#PartyCapacity` (ResourceServices.xml:41) counts `WepHoliday` work efforts owned by the organization (:21, :123-125) and leave; `get#NextBusinessDay` reads the same events (EventServices.xml:2377-2426). People P9 (schedules first, HolidayCalendars' `get#Holidays` and `store#Holiday`) is not built | P13 reads holidays through `get#NextBusinessDay` and the `WepHoliday` events as they are, which People P9 keeps writing; P8 (deferred) uses `get#PartyCapacity` as People P9 leaves it. The schedule read stays open until People P9 |
| F65 | P0: the framework's status check still matches a `StatusFlowTransition` by `statusId` and `toStatusId` alone, over every flow, ignoring `statusFlowId`; a transition's `userPermissionId` refuses only when every matching row needs a permission the user lacks (crates/moqui-core/src/service/call.rs:1702-1760) | P3 as planned: the service is the gate. A maintenance flow is seeded for its labels and `get#TaskStatusFlow`; a permission on its transition gates nothing, since the Default flow's row admits the same move |
| F66 | P0: the time services check no work access: `store#TimeEntry` (TimeServices.xml:17-135) checks an active party and the timesheet lock (`check#TimeEntryTimesheet`, :410), `create#TimeEntryClockIn` (:391-409) and `start#Timer` (TimesheetServices.xml:1266-1306) the same; nothing reads the work effort's status, assignment, template flag or managed state. `get#TimesheetAccess` (:441) is the timesheet's. The work check is BOSS's, Commons' `clockIn#Task` through `get#TaskAccess` (commons/TaskServices.xml:1190-1207). A template is refused only in the time import (TimeServices.xml:1872) and left out of the timesheet's people (TimesheetServices.xml:984). All are `allow-remote="false"` (the default) | P3: there is no Mantle work-access check to extend. `MaintenanceServices` gains the time entry points of a work order (start and stop the timer, record time on a root or step): each checks the assigned person, a step in progress and no template, then calls `start#Timer`, `stop#Timer` or `store#TimeEntry` unchanged; Commons' clock-in refuses managed work through `get#TaskAccess`. Design §1.3's time row and §13.2 corrected |
| F67 | P0: `ironstone.products.CatalogServices.get#SharedContext` is SharedContext.js `context()` (service/ironstone/products/SharedContext.js:379-386), which knows Commerce, CustomerService, Warehouse, Manufacturing, Purchasing and Products and refuses any other root. Each app's branch checks its own scope's read, narrows `get#CatalogAccess`' capabilities, and names its tabs, `sharedLinks` and organizations (Manufacturing's :107-149), Warehouse's also `facilityIds` (:66-105). Product360's Equipment tab shows when the tabs include `Equipment` (screen/Shared/Product360/Equipment.xml:34) and writes through `store#CatalogRow`, which checks catalog edit again; InventoryAvailability needs `capabilities.read` (InventoryAvailability.xml:25-26) | P2 adds `maintenanceContext()` to SharedContext.js as an owner contract: Maintenance's read scope, catalog writes as the user's catalog capabilities give them, tabs Summary, Identifiers, Equipment, Documents and the spare parts, links to `Maintenance/Equipment/Product360`; Products' specs unchanged. P9 adds Stock and the facilities the user reads stock in |
| F68 | P0: `guardInstruction` (service/mantle/work/OperationTemplates.js:354-379; entity/Work.eecas.xml:43-58) holds for every `WectInstruction` row of any WorkEffort: created only with a checksum, a location under `dbresource://mantle/content/workEffort/` and a from date, never deleted, and changed only to end it. The one writer is Manufacturing's `store#OperationInstruction` (OperationTemplates.js:225-270) under a routing template's edit check, so a procedure cannot call it; RecordFiles refuses to remove an instruction (RecordFilesServices.xml:505-506) | P6: an approved procedure's instructions are `WectInstruction` rows written at publication by ProcessServices' own publisher in the same shape (the file stored once, its sha256, the from date, the one before ended); a draft's files are other content types until then. An execution step resolves its instruction through its `WeatBasedOn` link to the template step's row in effect when it was made (F58: nothing is copied). The rule is not changed |
| F69 | P0: Chatter and RecordFiles admit a host by Mantle's `get#RecordLinkInfo` (CommunicationServices.xml:2005; ChatterServices.xml:56-90), not by app root: a work effort is visible when it or its root is owned by the user's party or organization, names them as a party, or is in a calendar they view (CommunicationServices.xml:2283-2290), so a work order of ORG_ZIZI_SERVICES would open in Commons' Chatter to any user of that organization. People's protected tasks are the precedent for narrowing it (`protectedHidden`, :2279-2282, :2691). A file is removed by whoever added it, or a user the host entity's update authorization admits, unless it is an instruction or `catalogCanChange` is false (RecordFilesServices.xml:504-507); a new or restored version obeys the same flag (:577). The content services: `create#WorkEffortContent`, `create#AssetContent` (no check), `create#RequestContent`, `create#AssetMaintenanceContent`, and a facility's file written by RecordFiles itself (:43-67) | P3 adds a Maintenance rule to `get#RecordLinkInfo`'s work effort branch beside `protectedHidden`: a managed root and its steps (and from P6 a maintenance template) are visible only as MaintenanceAccess admits them (the service organization's maintenance readers, the work's parties), for every app; Maintenance's `check#Record` guards its own mounts. P7: `get#ContentType`'s work effort branch takes `catalogCanChange` from a Mantle evidence policy, as payments do (:83-96), so accepted evidence is neither removed nor replaced. Asset and facility hosts stay by ownership |
| F70 | P0: `AssetMeter.readingReasonEnumId` has no relationship and no enumeration type, and nothing writes it (entity/ProductAssetEntities.xml:821-836; `create#AssetMaintenance`'s reading has no reason, EquipmentServices.xml:108-112); AssetMeter carries a note to deprecate it for Measurement (:822), whose `MeasurementReason` type has no values (WorkEffortEntities.xml:1463-1466). ProductMeter has no cumulative field (ProductAssetEntities.xml:851-861) | P2 seeds an `AssetMeterReadingReason` enumeration type (reading, work, reset, correction) with the relationship on AssetMeter, adds `ProductMeter.isCumulative`, and `record#MaintenanceMeter` writes the reason; AssetMeter stays the counter record (design §5.1), Measurement P7's |
| F71 | P0: Warehouse's posting guard is StockPosting.js: `begin` (a permission, then the operation key, :76-85), `scope` and `stock` (the asset locked, stock types `AstTpInventory` and `AstTpSupplies`, in a facility of the user's organizations, :94-122), `period` (:204) and `complete` (:233). Production's issue calls it with `STOCK_ISSUE`, then `issue#AssetToWorkEffort` with authorization disabled (ProductionServices.xml:167-232, :200, :214), which itself checks only expiry, on-hand and the work effort's consume product and facility (AssetServices.xml:2357-2420). `AssetReceipt.sourceAssetIssuanceId` (entity/WarehouseTaskEntities.xml:28) is provenance only: the original cost is the returned asset's `acquireCost`, which Production's return copies from the source (ProductionServices.xml:298), and a receipt with a `workEffortId` credits WIP (AssetAutoPostServices.xml:73, :91). Supplies post as fixed assets on issue and receipt (the TODOs at :76, :279) | P9 follows Production's pair: `posting.begin` with `STOCK_ISSUE`, `issue#AssetToWorkEffort` with the planned line's product, the return a receipt naming its issuance with the source's `acquireCost`. AC-24 routes the return receipt's credit to the issuance's expense and dimensions as well as the issuance; spare parts are `AstTpInventory` in the demo, and a supplies part is refused or routed explicitly, not posted as a fixed asset |
| F72 | P0: Admin P16 registers an owner's export tied to a list or record as a `wizard` export target with an owner route, never dispatched; Insights' dataset and report exports are such places (impl-admin.md:4164-4171, F240 :4273-4276; BossSetupData.xml:4937-4957). A form-list's CSV menu is drawn only with a list header, such as `select-columns` (impl-admin F125) | P17 and P19: one `wizard` export target per Maintenance place (the work, PM and booking lists, and Reports), not one per report; each report's and list's CSV is its form-list's own, the screen's projection, with `select-columns` set |
| F73 | P0: Admin P17 is built: `AuditServices.find#Changes` reads only entities with a registered `moqui.server.AuditProjection` (entity, field, category, value mode, source service, view permission, key kinds, link; framework entity/ServerEntities.xml:816-847), an organization's records through an owner source implementing `find#OwnedChanges` (ids only, the owner checking `ADMIN_AUDIT_VIEW` and its scope; framework service/org/moqui/admin/AuditServices.xml:31-56). A business entity is registered only if its owner seeds a projection, and its history is otherwise its owner's screen's (impl-admin F257); People registers none (impl-people F56) | Maintenance registers no projection: the work order, check, waiver, schedule term and booking decision histories are WorkOrderDetail's History and its owners' screens (P3, P7, P13, P16), read from EntityAuditLog by Maintenance's services in its scope. Whether they belong in AuditChanges is F257, the user's call (§7) |
| F74 | P0: Admin P18 is built: a route group is a `moqui.security.DeviceRouteGroup` its owner seeds (framework entity/SecurityEntities.xml:472-497: an artifact group as an allow-list, `homePath`, one fixed parameter, idle timeout, lifetime); a device's request runs as a display account and cannot load the `/qapps` shell, so a kiosk is a page of its own, and Insights' root calls no context service for a device's request (screen/Insights.xml:44-56, `UserSecurityChecks.currentDevice()`); People P30 is replanned on it (impl-people F55) | Nothing built here blocks TechnicianKiosk if P1's root does as Insights' does: no context service and no Chatter or RecordFiles for a device's request. TechnicianKiosk stays later (§7), a page of its own with Maintenance's route group |
| F75 | P0: still not in the code, as the user deferred them (§4): `WorkEffortSkillStandard.minimumSkillLevel` and `check#Qualifications` (People P18), `RaprCost` and `get#CostingRate` (People P10; no match in mr-mantle's entities, services or data), the schedule read of `get#PartyCapacity` and HolidayCalendars (People P9) and a projected kind in `get#DavCollections` (People P12; CalendarDavServices.xml:143). P6's `store#ProcessRequirements` names `minimumSkillLevel` | Left open: rechecked when those People phases land, for P8, P11, P12, P19 and P17's cost entry. P6 writes skill standards without a level and P8 adds it |
| F76 | P1: design §1.1 lists no grants for the administrator, and Maintenance had no all-organizations permission (FACILITY_ALL_ORGANIZATIONS widened it) | §4: the user's calls; P1's review R3, R4 |
| F77 | P1: Commons' Schedules ResourceDetail links "Open in Maintenance" to `//Maintenance/Facilities` and `//Maintenance/Equipment` (screen/Commons/Calendar/Schedules/ResourceDetail.xml:60), hidden while those areas are absent | P2 keeps the paths or changes the link |
| F78 | P1: a requester holds no Maintenance root, so `ironstone.maintenance` services (`get#Capabilities`) are refused to them | P4: Commons' intake reads Mantle's MaintenanceAccess or adds its own grant |
| F79 | P1: the demo technicians are agents, not People employees | P8 (deferred): skills, capacity and qualifications need employed technicians |
| F80 | P1: Chatter and RecordFiles under the root opened no Maintenance host | P1's review R2 restricts the panels; P2 and P3 add their hosts (F82) |
| F81 | P1 review: the Built note's lint was on the release binary; the Debug binary gives the same 136 sites (one new, the root's `currentDevice()`, as Insights') | None |
| F82 | P1 review: the root serves Chatter and RecordFiles only for the entities in its `panelHosts`, empty in P1 | P2 adds Asset and Facility with their checks; P3 the work order and step |
| F83 | P1 review: a holder of `MAINTENANCE_ALL_ORGANIZATIONS` sees every organization even with an active one chosen (FacilityScope's rule); People narrows to the active one | P3's lists decide; People's rule recommended |
| F84 | P1 review: the root's ALWAYS gives the administrator and `ADMIN` every area | With F76's grants the administrator holds what each area reads |
| F85 | P2: `move#Asset` makes a new asset when the facility changes and `move#Stock` refuses equipment | P2's equipment move writes the facility and location itself after its checks; design §6 changed |
| F86 | P2: FacilitySetup.js owned a facility by its own owner only, so ownerless rooms Maintenance lists were not editable | §4: Warehouse follows the ancestor (P2 review R8) |
| F87 | P2: the plan's forklift is Warehouse's and Retail's (`BOSS_WH_FORKLIFT`) | Serves as Retail's equipment |
| F88 | P2: BossMaintenanceDemoData loads before People's and Purchasing's demo; Commons' Schedules seats filter expects one room of ten or more | Links in BossZMaintenanceDemoData.xml; Room 201 holds nine |
| F89 | P2: Product360 asked `get#CatalogOptions` with no `appRoot` | Maintenance's root passed under Maintenance only |
| F90 | P2: Mantle maintenance services are reached under the root's inheritable grant, as other apps' | None; each checks its own permission and scope (P2 review) |
| F91 | P2: the Equipment and Facilities menu conditions repeat MaintenanceAccess.js's view permissions | None |
| F92 | P2: built in part: the facility close preview on screen, Certifications writer, Employee360's return-task link, the list's availability and next PM, the reading screen | P3, P5, P7, P13 |
| F93 | P2 review: an ownerless facility moved under another organization's facility changes organization with no reason asked; Maintenance previews it, Warehouse's edit does not | Later, Warehouse's |
| F94 | P2 review: `record#MaintenanceMeter` in work does not check the equipment is the work's target | P7 |
| F95 | P2 review: EquipmentDetail's subscreens add `/Identity` to its URL under every mount | None; nothing renders there outside Maintenance |
| F96 | P2 review: list rows read counts with per-row queries | Batch with P3's work-order counts |
| F97 | P3: Manufacturing's WeApproved ↔ WeOnHold rows need `PRODUCTION_SUPERVISE`; the maintenance rows need `MAINTENANCE_SUPERVISE` (planned ↔ held `MAINTENANCE_PLAN`, P3 review R2) | Built |
| F98 | P3: no path attaches a second AssetMaintenance; adoption of another order's record answers that order, a record linked elsewhere is `LINKED_WORK` | Built |
| F99 | P3: no guarded AssetMaintenance writer exists; the raw path is not granted (§2) | None |
| F100 | P3: `WorkEffortPartyDocsUsers` does nothing for a maintenance root | Not conditioned |
| F101 | P3: Manufacturing's demo downtime has no AssetMaintenance; the adopted demo order is data | None |
| F102 | P3: quick create's New work order shows to every Maintenance user | NewWorkOrder and Mantle refuse a non-planner |
| F103 | P3: the identity operator lists but does not move a leaver's maintenance work | §4 (the user's call); review R5 |
| F104 | P3: Commons answers not found for managed work | Palette and Today open WorkOrderDetail |
| F105 | P3: `create#WorkEffortContent` checks only `check#WorkEffortOpen` | Its caller RecordFiles is gated by `get#RecordLinkInfo` (P3 review); evidence is P7's |
| F106 | P3: Maintenance's Today lists dated work only | None |
| F107 | P3: the approval threshold reads the root's estimate only | P6 adds the steps' |
| F108 | P3: the client walk took 8.5 s | §4: estimate 9 s; 8.16 s after review R6 |
| F109 | P3 review: a technician's work order in Commons' or Projects' lists opens only a message | None |
| F110 | P3 review: the project-model task writers and `clone#WorkEffort` (also on REST) have no managed-work guard | P6 decides for steps |
| F111 | P3 review: Projects' time import admits any root for an every-project reader | P6 refuses a managed item there |
| F112 | P3 review: the operation key's index is not unique; two concurrent creates under one key can both make a root | Later (as People's F148) |
| F113 | P3 review: Admin's Maintenance participant counts root assignments only | P6/P7 add steps |
| F114 | P3 review: holders of `MAINTENANCE_PLAN`/`_SUPERVISE` could make the held moves on other work through a raw update where they have that path | No BOSS group has it (§2) |
| F115 | P3 review: `assignedTo` counts declined and unassigned rows | Harmless while only schedule writes them |
| F116 | P3 merge: master moved Admin's settings registry to the framework (`moqui.server.SettingsEntry`, `destinationRoute`, `screenLocation`) | P1's row moved at the merge; P18 follows the framework's readiness registry |
| F117 | Pull of Nov 12: mr-moqui's Admin Screens Down (plans/archive/Admin-Screens-Down.md A0–A6, I0–I4) moved Admin's generic screens to the framework's System and Tools apps and three registries to the framework: `moqui.server.SettingsEntry` (`destinationRoute` + `screenLocation`), `moqui.server.ReadinessProvider` (`fixRoute` + `fixId` + `scopeParameters`, was `fixPath`; services `org.moqui.admin.ReadinessServices`) and `moqui.server.RefreshOperation`. Owner routes are keys in mr-boss `service/ironstone/admin/Admin.js` `settingsRoutes` and `mountRoutes` (Data.js's and DataImport.js's tables are gone) or the framework's in tools `template/AdminMount.js`; `ownerRoute`, `fixRoute` and `linkKey` name one. Unchanged: `ironstone.admin.LifecycleParticipant`, the framework's CapabilityBundle, TopicRegistration, JobRegistration, RecoveryDescriptor, TransferTarget and AuditProjection, `Shared/DataImport` with `get#ImportMount`, and Insights' ironstone.insights registries (still `routePath`). Dataset readiness and refresh rows are `moqui.server.*` with `fixRoute="insightsDataset"`. System screens renamed with no aliases (SystemMessageDetail under Integrations, Jobs and JobDetail under Operations, Groups under Access, AuditChanges under Audit; Admin mounts the same names under its own areas) | P1's settings row moved (F116); P14 registers the job's `ownerRoute` and recovery as route keys; P17's dataset readiness and refresh are `moqui.server` rows; P18's readiness provider is a `moqui.server.ReadinessProvider` with `fixRoute`, and the equipment import's owner route a `mountRoutes` key; P19's export targets name route keys |
| F118 | Pull of Nov 12: Maintenance's appends at the end of BossSetupData.xml met People's at each pull | Moved to `data/BossSetupMaintenanceData.xml` (seed-initial, loading after BossSetupData); later phases append there; the client deny rows stay in BossSetupData |
| F119 | P5: a correction is a new row; every reader of current availability takes the row in force (`supersededByUnavailabilityId` empty) | P15, P16, P17 must too |
| F120 | P5: `record#ResourceUnavailability` checks its caller by data: Manufacturing's equipment-fault stop, or Maintenance's permission, scope and assignment | Built; review R2 narrowed Manufacturing's entry |
| F121 | P5: no work order ends an outage | Built; §4 (restore with open work) |
| F122 | P5: Complete "Still unavailable" records an outage when none is open | Built |
| F123 | P5: production downtime needs the seed reason `RurEquipmentFault`, hence `MaintenanceWorkOutageData.xml`'s name | F129 |
| F124 | P5: MaintenanceAccess called the removed `RegistryServices.find#Settings` | Fixed (F116) |
| F125 | P5: a technician reads the organization's outages in Downtime | None |
| F126 | P5: Home counts a facility and equipment inside it as two resources down | None |
| F127 | P5: Services' demo has no equipment-fault production reason | The acceptance walk adds one |
| F128 | P5: WorkOrderDetail's tabs had no gaps | Review R6 respaced by ten (Procedure 20, Parts 40, Purchasing 50, Costs 100 free) |
| F129 | P5 review: an existing database needs `MaintenanceWorkOutageData.xml` loaded, or every equipment-fault stop fails (`REASON_INVALID`) | Load it on upgrade |
| F130 | P5 review: `record#` reads no work status; a technician may record from closed work assigned to them | Later; must admit Complete's own recording |
| F131 | P5 review: a correction may move an outage over another of the same resource | P17's union counts it once |
| F132 | P5 review: `record#` locks the resource row before checking the caller | None |
| F133 | P5 review: production context shows to every Downtime reader | None |
| F134 | P4: Report a problem is Commons' screen (`Commons/ReportProblem`), since a requester opens no other root | Built |
| F135 | P4: `create-from` not built | §4: P19 |
| F136 | P4: the asset tag's QR opens EquipmentDetail, which a requester cannot open; they scan into ReportProblem | None |
| F137 | P4: a maintenance request was visible in Commons to its organization by id | P4 review R1 (`requestHidden`) |
| F138 | P4: requests have no observed-time field; written into the description | None |
| F139 | P4: design §13.3's "completion notifies the requester" not built | Later (P19's Comms) |
| F140 | P4: triage and report keys use PostingOperation | None |
| F141 | P4: the Requests screen opened for any Maintenance user | P4 review R2 (`BOSS_MNT_REQUESTS`) |
| F142 | P4 review: `create-from` is no small build | §4: P19 |
| F143 | P4 review: a reporter can unlink their report from its work order or target through Commons' `unlink#RequestRecord` | P20's access walk; a Mantle guard later |
| F144 | P4 review: capability bundles carry no area grants (Requests, Settings) | As Manufacturing's; later |
| F145 | P4 review: `productionHandoff` relies on refusals before any write | Unchecked; later |
| F146 | P4 review: the triage notice reaches ADMIN members of the organization and production requests adopted at once | None |
| F147 | P4 review: the untriaged filter drops linked rows after paging | Harmless while triage links few |
| F148 | P4 review: P4's artifact groups moved to BossSetupMaintenanceData.xml at the merge (F118) | Done |
| F149 | P4 review: MaintenanceFoundationWalk's refusals hold by artifact groups | None |
| F150 | P6: Mantle's rollup writes the steps' estimates onto the root, so adding them counted twice | The threshold reads the rolled-up sum |
| F151 | P6: P3's `requestHash` hashed text fields as NaN | Fixed in P6 |
| F152 | P6: the procedure flow's Amend move is held otherwise only by Manufacturing's flow | It needs `WORK_PROCESS_EDIT` |
| F153 | P6: an approved procedure's change goes back to Draft | §4 (the user's call) |
| F154 | P6: `approve#NotificationMessage` runs under the calling screen's grant | P6 review R1 tests it through Commons' screen |
| F155 | P6: the project-model task writers stay unguarded | No BOSS screen reaches them on managed work; REST is ADMIN's (F159) |
| F156 | P6: demo instructions not seeded (a `WectInstruction` needs a stored file) | Later |
| F157 | P6: a step's role and due offset, the change reason and a later retirement are not on the forms | Later |
| F158 | P6 review: `instantiate#WorkProcess` called directly makes an execution with no work order or applicability check | Not reachable today (no remote call, no grant) |
| F159 | P6 review: the `/mantle` REST task writers (`add#WorkEffortProduct`, `store#TimeEntry`, `create#TimeEntryClockIn`, `add#TaskComment`, `set#TaskMilestone`, `store#WorkEffortPartyTime`) do not refuse managed work; REST is ADMIN's | P7 guards `add#WorkEffortProduct`, `store#TimeEntry` and `create#TimeEntryClockIn` with `check#ManagedWork` (the managed-work rule of §4) |
| F160 | P6 review: a completed step's assignee still counts in Admin's participant | P7 |
| F161 | P6 review: Prettier not installed in the review's environment | Lead runs it before the end |
| F162 | P15: `get#FullCalendarData` returned a resource's event titles to anyone | P15 review R1 masks a managed resource's bookings the caller may not open; unmanaged as before |
| F163 | P15: `create#Event` assigned equipment with no check | Through `book#Resource` for a managed asset |
| F164 | P15: locking the work center in `record#` hung Manufacturing's moves | Manufacturing's offline path takes no lock (F171) |
| F165 | P15: an unmanaged resource's recurring booking is checked on its first instance only | P16: outages and blackouts over the whole range, up to 365 days; conflicts as today (review's recommendation) |
| F166 | P15: allowed hours, a booking calendar and people capacity not built | Later |
| F167 | P15: `affectedBookings` reads estimated dates only | Later |
| F168 | P15: equipment in a blacked-out room is not blocked | As design §7.1 |
| F169 | P15: MaintenanceFoundationWalk's menus are stale since P2 | P20 updates the acceptance walks before running them |
| F170 | P15: an existing database needs `MaintenanceWorkResourceData.xml` (`RurOffline`) | Load on upgrade, as F129 |
| F171 | P15 review: `store#WorkCenterOffline`'s record# takes no lock, so a booking can land under a new offline block (flagged, not refused) | P16: lock a row the moves never write (the WorkCenter row) in both the offline path and a work center's booking |
| F172 | P15 review: the guard's `resourceOf` refuses a stock asset, so booking an inventory or supplies asset, which worked, now fails | P16 restores it for an unmanaged asset |
| F173 | P15 review: a Busy event keeps its id | EventDetail refuses it on open |
| F174 | P15 review: Manufacturing's schedulers see a blackout's description as the offline reason | None |
| F175 | P15 review: the recurrence recheck runs over every resource of an event once one is managed | None |
| F176 | P15 review: (F170) a release note for the seed | P20's Remaining-Work and README |
| F177 | P13: design §5.1 allows an ad hoc root with no procedure | §4 (the user's call); P13 review R1 |
| F178 | P13: the first due date is local text (`firstDueLocal`) in the target's zone | Sound (review R5 tightened the format) |
| F179 | P13: a completion counts through `MaintenanceWorkOrder.maintenanceScheduleId` (extend-entity) | P14 sets it |
| F180 | P13: a draft's terms change in place | §4 |
| F181 | P13: `get#NextBusinessDay` reads People's holidays through the calendar the term names | None |
| F182 | P13: meter units are Uom abbreviations | Review R9 for count meters |
| F183 | P13: a three-level area's record render needs `lastStandalone: "-3"` in qvt specs | P14's PlanDetail specs |
| F184 | P13: the stale demo plan needed a second counting meter | None |
| F185 | P13: Equipment's next-PM column not built | P14 or later |
| F186 | P13 review: the projection reads past obligations under the term in effect now | P14's occurrences fix each obligation under its own term |
| F187 | P13 review: a completion with no meter reading leaves the baseline silently | P14's completion credit |
| F188 | P13 review: a planned AssetMaintenance completed by the baseline's screens turns its synthetic threshold into a reading | Later |
| F189 | P13 review: an in-place lower correction counts later usage from the lower value | Later |
| F190 | P13 review: no "no procedure" over a model default | §4 (inherits) |
| F191 | P13 review: a draft's term keeps its creation time as fromDate after activation | None |
| F192 | P13 review: caps of 500 plans in `find#MaintenanceDue` and 1000 assets in the model filter | P14 or later |
| F193 | P13 review: P13's JS formatted by Prettier in the review | None |
| F194 | P13 review: MaintenancePlansWalk feature 4 rewritten, not run | P20 / the final acceptance run |
| F195 | P9: `receive#Asset` posts the receipt inside the call (AssetReceiptGlPost), before a caller can name its issuance, so Production's return posts to WIP by the work effort and a maintenance return could not be routed by its source at posting. | P9's Built note |
| F196 | P9: Supplies are refused rather than routed | P9's Built note |
| F197 | P9: A facility dimension must be owned by the posting organization (AccountingPolicy.js `dimensions`), so an ownerless room carries its nearest owned ancestor | P9's Built note |
| F198 | P9: The policy's "maintenance purpose" is built as the work's MaintenanceKind (corrective, preventive), with any kind as the fallback | P9's Built note |
| F199 | P9: Missing mappings are not yet listed in Posting defaults' MissingMappings nor in Maintenance's readiness (P18). | P9's Built note |
| F200 | P9: The plan's planned line is per node and product (one open row) | P9's Built note |
| F201 | P9: Demo issuances and returns are rows, not postings (data load runs no SECA), so the demo journal holds no maintenance expense until a part is issued in the app. | P9's Built note |
| F202 | P9: maint.tech is now in BOSS_WAREHOUSE_ISSUE (a capability group with no Warehouse root) for the demo | P9's Built note |
| F203 | P9 review: A clone run twice copies the every-facility rows twice (the rows have a surrogate key, so no conflict is found) | P9's Review note |
| F204 | P9 review: An issue checks the work order's status, not the step's | P9's Review note |
| F205 | P9 review: `maintenanceFacilities` reads the distinct facilities of the organizations' stock on every Maintenance catalog context | P9's Review note |
| F206 | P9 review: The demo's cost policy (613200000 for ORG_ZIZI_SERVICES) is exercised only by the acceptance MaintenancePartsWalk (not run) | P9's Review note |
| F207 | P9 review: P7's `check#ManagedWork` guard (on master after P7) | P9's Review note |


## 7. Later

Designed, not in this build:

- **The design's later rows** (§2, §10): Calibration and CalibrationDetail over Manufacturing's shared GaugeCalibration;
  ReliabilityReport and the ReliabilityProxy card of EquipmentDetail; FleetContracts and FleetLogs (MT-13).
  TechnicianKiosk, which waits on Admin's device credential and route-group registration (Admin P18) and People's kiosk
  identity (PE-05, impl-people P30), with Maintenance supplying only the work scope. OfflineExecution (MT-14), which
  waits on moqui-browser's login flow and tab lock (Remaining-Work).
- **The later parts of MT-16 and design §14:** drafting procedure steps from a manual through `run#Extract`; meter
  readings from equipment telemetry into `record#MaintenanceMeter`; monitoring alerts that raise a maintenance
  request.
- **Links to Sales** (F55):
  - the chargeable repair's sales quote is built by impl-sales P8, over Customer Service's warranty decision; P12
    here only rechecks that decision's consent;
  - preventive maintenance of customer-owned equipment under a service agreement (a MaintenanceSchedule linked to
    Sales' AgreementDetail, design §15) is later and Maintenance's to design, after impl-sales P15 has built
    AgreementDetail (§5 Q8; impl-sales §7 and its §5 Q11 say the same);
  - supplier warranty terms as an Agreement linked to the asset, with an expiry notice (design §15), are no link to
    Sales: the agreement is in the purchase direction, on the statuses Purchasing seeded, so it is Maintenance's or
    Purchasing's later work and waits on nothing in Sales' plan.

  Maintenance has no link to Marketing.
- **Shared designs corrected** (Nov 11, 2026, with the decisions of §4): crosscut §1.3's CalDAV row (F9), crosscut
  §7.6's MT-06 row (F17), design-admin §11.1's equipment row (F36), design-maintenance §1.4's and §8's
  `report/boss-maintenance-*.json` (F37) and §3's Assignments row (§4) are changed; nothing waits for a phase.
- **Framework and Admin pieces not built:** the maps dialog and the lists' map layers of crosscut §3.32
  (CX-MAPS); Maintenance's privacy provider, with Admin's PrivacyServices (impl-admin §7); audit evidence beyond the
  audit log's own rows: Admin P17 is built and reads a business entity only by its owner's projection (F73); whether
  Maintenance's histories join AuditChanges is impl-admin F257, the user's call; an in-page audio recorder for voice notes.
- **Design §15's other open items:** attributes per equipment category; listing steps read-only in the Tasks
  collection if technicians ask. A piece count as a third measure of the planned-work approval threshold (§4).
- **Owners' later work found here:** a Measurement migration of AssetMeter history (design §14); the legacy due
  helper `get#AssetMaintenanceNeeded` under an opt-in corrected contract; Projects' cost reports on the costing
  rate. Manufacturing's rows and lookup move to the one costing purpose, `RaprCost`, in impl-people P10 (its §4; F33).

## 8. Verification

- **Per phase,** the "Done" rule of §2.
- **End to end,** run `./moq run`, sign in as each demo Maintenance user, and walk each built phase's "usable when"
  in order, in the browser, at phone width and in the terminal.
- **Design §11.2 scenarios,** each an acceptance test (`./moq accept mr-boss`, when asked):

| Scenario | Phase |
| --- | --- |
| Repeat a procedure | P6 |
| Nested and concurrent steps | P7 |
| Publication and amendment | P6 (publication), P7 (amendment) |
| Evidence/checks | P7 |
| Interrupted creation/retry | P6; P14 (the batch) |
| Template isolation | P6; P3 (the Tasks collection), P14 (PM credit), P17 (reports) |
| Facility/equipment identity | P2, P3; P12 (customer ownership), P18 (import) |
| Request and customer repair | P4 (requests), P12 (repair) |
| Time and stock | P3 (time), P9 |
| Financial routing | P9 |
| PM chronology | P13 |
| PM concurrency and missed work | P14 |
| Booking concurrency | P16 |
| Privacy and policy | P15; P16 (the approver paths in Commons and Maintenance) |
| Outages | P5; P15 (bookings flagged) |
| Reports and scope | P11 (costs), P17 |
| Device/access paths | each phase; P20's access and phone walks |
| Phones and CalDAV | P3; P15 (an event's booking check), P19 (the projected calendars) |
| Labor cost and qualification | P8 (qualification), P11 (cost) |
| Outage shared with Manufacturing | P5 |

- **Walks.** One golden-path client walk for Maintenance in the regression suite (`MaintenanceWorkOrdersWalk`, from
  P3); the others are acceptance tests. No screenshots.
