# IronStone BOSS — Maintenance implementation

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
| P0 Checks | all (read) | — | partly done Nov 11 (§6 F1–F57); the checks below left |
| P1 Foundation | Mantle, BOSS | the Maintenance root and menu, Home (its frame), Settings (its frame) | — |
| P2 Equipment and facilities | Mantle, BOSS | Equipment, EquipmentDetail, Product360, Employee360, Facilities, FacilityDetail | — |
| P3 Work orders | Mantle, BOSS | WorkOrders, WorkOrderDetail (Overview, Time, Files, Conversation, History), Home, Settings' work policy | — |
| P4 Requests and intake | Mantle, BOSS | Requests, RequestDetail, Report a problem | — |
| P5 Downtime and restoration | Mantle, BOSS | Downtime, WorkOrderDetail's Downtime | — |
| P6 Procedures | Mantle, BOSS | Procedures, ProcedureDetail | — |
| P7 Execution checklists and evidence | Mantle, BOSS | WorkOrderDetail's Procedure, WorkItemDetail | — |
| P8 Dispatch: teams, skills and qualifications | Mantle, BOSS | WorkOrders' AssignSchedule and BulkWork, Teams | — |
| P9 Parts and stock | Mantle, BOSS | WorkOrderDetail's Parts, MaterialIssueReceipt, InventoryAvailability; Accounting's PostingMappings row | — |
| P10 Purchasing and outside service | Mantle, BOSS | WorkOrderDetail's Purchasing, OrderDetail; Purchasing's RequestDetail line | — |
| P11 Costs | Mantle, BOSS | WorkOrderDetail's Costs, MaintenanceCostReport | — |
| P12 Customer repair | Mantle, BOSS | WorkOrderDetail's repair context; Customer Service's RepairLinks | — |
| P13 Preventive plans and due maintenance | Mantle, BOSS | Plans, PlanDetail | — |
| P14 Generation, occurrences and compliance | Mantle, BOSS | DueMaintenance, PreventiveComplianceReport | — |
| P15 Resource policy and blackouts | Mantle, BOSS | Resources, ResourcePolicyDetail, Blackouts | — |
| P16 Booking requests and the resource calendar | Mantle, BOSS | BookingRequests, ResourceCalendar; Commons' approvals | — |
| P17 Reports and Insights | Mantle, BOSS | Reports, WorkStatusReport | — |
| P18 Settings, lookups, readiness and import | Mantle, BOSS | Settings, Lookups, EquipmentImport | — |
| P19 Assist, Comms, sync and outputs | Mantle, BOSS | the prints and exports; no new screen | — |
| P20 Finish | all | the sweeps and the review walk (acceptance) | — |

### P0 — Checks

Verify the design's riskiest assumptions against the code before building. Each result is a row in §6 and, where it
changes the design, an edit there. F1–F48 were found on Nov 11 while writing this plan and F49–F57 in its review;
F12, F16, F17, F31 and F36 changed design-maintenance the same day. Still to check:

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
  (Manufacturing.xml:46-82); quick create, Today and the notification topics arrive with their records.
- **Admin's settings index** (owner contract; impl-admin §7): a `SettingsEntry` `maintenance.settings` to
  `Maintenance/Settings`, group Applications, scope organization, as Manufacturing's row is
  (BossSetupData.xml:2592-2595); its readiness provider key is set in P18.
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
- Findings (provisional):
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

### P2 — Equipment and facilities

Design §6 Equipment, Facilities and the shared master records' context table (EquipmentDetail, FacilityDetail,
Product360, Employee360), crosscut §3.10's Maintenance forms, design §12 asset tag labels; MT-06, MT-01. The maps
dialog of crosscut §3.32 is not built by the framework and is left out (§7).

- **Mantle records.** `Asset.warrantyThruDate` and `warrantyPartyId` (F20); ProductAssocType `PatSparePart` (F20);
  `Facility.timeZone`, inherited from the nearest ancestor that has one (F16, §5 Q9); a dated room feature record
  `mantle.facility.FacilityFeature` (facility, feature enumeration, from and thru) with a seeded `RoomFeature`
  type; a cumulative flag on ProductMeter if P0 finds none.
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
    People's or Warehouse's does, and a dated end keeps that (P0);
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
    F23) with catalog authority unchanged, and a spare-parts pane of `PatSparePart` associations.
  - Employee360 at `Maintenance/Equipment/Employee360`: People's screen (impl-people P2) with Maintenance's row of
    its context table (public work identity, AssignedEquipment, qualification validity; no HR action), which this
    phase adds to People's screen and design as an owner contract.
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
    tasks. WorkOrderDetail's Assignments form writes through `schedule#MaintenanceWorkOrder`;
  - BOSS `get#TaskAccess` and `check#TaskUpdate` treat a managed root and its steps as not a task, as they do a
    production operation (commons/TaskServices.xml:85-90), with a message that opens WorkOrderDetail;
  - `WorkEffortPartyAssignedNotify` is conditioned to leave managed records to the `MaintenanceWork` topic; managed
    records carry no recurrence fields; `WorkEffortPartyDocsUsers` is conditioned to project roots;
  - CalDAV: `get#TaskObjectTags` leaves templates and steps out and marks a managed root read only, beside what
    People left out of it (P0); a PUT or DELETE on one answers 403 (DELETE today ends the assignment with a direct
    update).
- **Time** (MT-08): the timer and `store#TimeEntry` admit an assigned technician's own time on a managed root or
  step in progress and refuse a template (P0's access check); root totals sum distinct TimeEntry rows of the tree.
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
  host through `ironstone.maintenance.AccessServices.check#Record` (P0); old AssetMaintenance hosts stay readable.
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
  WorkEffortAssetNeeded and WorkEffortSkillStandard rows with People's `minimumSkillLevel`),
  `request#WorkProcessApproval`, `approve#WorkProcess` (not the last author unless the policy allows it; the decision a
  WorkEffortApproval row, F44), `retire#WorkProcess`, `find#ProcessExecutions`, and People's `store#ProcessStep` and
  `instantiate#WorkProcess` extended, not replaced: a process whose policy guards execution takes the checked path of
  design §4.2 (approval and effectivity checked and the extended step policies carried, over People's clone with its ID
  map, remapped dependencies and one `WeatBasedOn` link per node); a People checklist, whose policy does not guard, is
  instantiated as People built it. The module stays its own, leaving `clone#WorkEffort` and `clone#Project` as they
  are (F5, §4). From this phase a procedure and its steps are managed work by the flag, as a template and as executed
  (§4). Approved instructions are content rows the execution can still resolve (P0: the `WectInstruction` rule), and
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
  file screens call (P0), not by caller.
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
  cost, never more than the net issued). A customer's asset under repair is never issued as a spare.
- **Accounting** (owner contract, AC-24): the issuance posting of a managed maintenance work effort takes the
  expense account of the cost policy with the facility, cost centre and project dimensions, instead of the
  same-owner WIP account (AssetAutoPostServices.xml:267-277); a return posts back with the original dimensions; no
  mapping is a named posting exception. The policy's rows are edited in Accounting's PostingMappings. Only an
  issuance to a managed maintenance root or step is routed: production, project and every other issuance post as
  today, and Accounting's and Manufacturing's ledger specs pass unchanged. Built here following design-accounting
  (§4), and written into design-accounting §18 and impl-accounting §7.
- **Shared screens.** MaterialIssueReceipt at `Maintenance/WorkOrders/MaterialIssueReceipt`: a `Maintenance` branch
  with `ironstone.maintenance.MaterialServices.get#MaterialSource` and `get#MaterialAction` after its
  `check#Record`, as Manufacturing's is (MaterialIssueReceipt.xml:40-64; F31), with Issue, Return unused and
  History. InventoryAvailability at `Maintenance/WorkOrders/InventoryAvailability`, once the catalog context admits
  the app root (P0).
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
  `store#MaintenanceSchedule` (activation refused with no time zone, P2's field, or no qualifying procedure, each
  a named finding), `get#MaintenanceDue` and `find#MaintenanceDue`: calendar cadence in the resource's zone with
  month-end clamping and the business-day move by `EventServices.get#NextBusinessDay`, which keeps the obligation
  date; meter thresholds from accepted completion readings only; missing or stale readings answered as unknown.
  `get#AssetMaintenanceNeeded` is left as it is for the baseline (F11) and is not called.
- **Screens:** Plans (FindPlans, PlanRows, NewPlan); PlanDetail (ScheduleTerms, DueExplanation, PlanAction; the
  occurrence history and generated work in P14); EquipmentDetail's plans pane.
- **Demo data:** a monthly calendar plan on a room, a 250-hour plan on the compressor from its model default with
  an asset override, a plan whose meter is stale.
- **Specs:** Mantle `test/work/MaintenanceDue` (the 31st clamps in a short month and returns to the 31st; a
  daylight-saving change keeps the local due time; a holiday moves the planned day and not the due date; a planned or
  cancelled maintenance and a synthetic threshold advance nothing; a stale meter answers unknown, not "not due"; a
  term change leaves earlier executions alone).
- **Usable when** (`acceptance/Maintenance/MaintenancePlansWalk`; design §11.2 "PM chronology"): the planner
  activates the three plans; DueExplanation names the last accepted reading, the increment and the next threshold
  for the compressor, and "reading older than 30 days" for the stale one.

### P14 — Generation, occurrences and compliance

Design §5.1 (occurrences, catch-up), DueMaintenance, PlanDetail's OccurrenceHistory, §8
PreventiveComplianceReport, §1.4 (the job's operation marks); MT-05, MT-11.

- **Mantle records.** `MaintenanceOccurrence`, unique by schedule and obligation; the `MaintenanceDue` topic.
- **Mantle `MaintenancePlanServices`:** `find#MaintenanceOccurrences`, `generate#MaintenanceWorkOrders` (one
  unresolved execution a schedule; a procedure through `instantiate#WorkProcess`, else an ad hoc root; each
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
  with CSV and print; Downtime opens from Reports.
- **Specs:** Mantle `test/work/MaintenanceReports` (templates and steps not counted; an order completed, reopened
  and completed counts once; overdue is past due, not unscheduled; another organization's roots left out); BOSS
  `MaintenanceReports` (the catalog entries listed for a reader and the cost entry only for the cost reader; the
  datasets carry no amount).
- **Usable when** (`acceptance/Maintenance/MaintenanceReportsWalk`; design §11.2 "Reports and scope"): the
  supervisor reads this month's backlog by team and drills to the orders; Insights' catalog opens the same report
  with the same numbers; an overdue-PM alert copied from the template tells its subscribers once.

### P18 — Settings, lookups, readiness and import

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
    (BossSetupData.xml:2550-2552), named by the settings entry of P1.
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
- The checks P0 left for Admin P17 and P18, redone if those phases have landed.
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
same day, at mr-moqui 16828c5f, mr-boss f1bf2a95 and mr-mantle 0048667f. Mantle paths are under `mr-mantle/`, BOSS
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
| F35 | P0: Admin's registries as built: ReadinessProvider, RefreshOperation, SettingsEntry and LifecycleParticipant are BOSS entities (entity/AdminEntities.xml:21, :53, :79, :225) seeded in BossSetupData (Accounting's provider and entry :2550-2556, Manufacturing's entry :2592-2595, Projects' participant :4060-4064); the capability registry is the framework's CapabilityBundle with its artifact and permission rows (Manufacturing's :2916-2938), and Maintenance's bundles were left out as unbuilt (impl-admin.md:932) | P1, P3, P18 |
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
  audit log's own rows, when Admin P17 is built (P0); an in-page audio recorder for voice notes.
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
