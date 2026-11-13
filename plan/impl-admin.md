# IronStone BOSS — Admin implementation

Nov 11, 2026 — screens moved to the framework (§9): after gate 5 the generic screens of Admin became the framework's
System screens, which Admin shows under its root, and the readiness, refresh and settings registries the framework's
(mr-moqui `plans/archive/Admin-Screens-Down.md`, phases A0 to A6). The phase entries below stay as the record of the build;
§9 says where a file or a service they name is now.
Nov 11, 2026 — gate 5 built: every phase of both plans (Admin P1–P19, Insights P1–P12), each reviewed by a fresh agent
and merged on its focused specs. Next: the full suites and the acceptance suite, run once (the user's call); their
results go in a Final suites note under P19.
Nov 11, 2026 — gate 4 built: P15–P17 (stage 4), Admin's data and audit, each phase reviewed by a fresh agent and merged on
its focused specs. Next: stage 5: P18 (shared devices), Insights P11 (wall displays) and the two Finish phases, then the
full suites.
Nov 10, 2026 — gate 3 built: P8–P14 (stage 3), Admin's configuration and operations, beside Insights' stage 2 (impl-insights
P6–P10, gate 2), each phase reviewed by a fresh agent and merged on its focused specs; the full suites run once at the end
of the build (the user's call). Next: stage 4 (P15–P17), Admin's data and audit.
Nov 7, 2026 — gate 1 built: P1–P7 with Insights P1–P5 in the one build order of §1 (stage 1), each phase reviewed by a fresh
agent and its fixes committed apart, merged in waves with the full suites after each (the Wave lines under the phases)
and the gate's suites under P7. Next: stage 3 (P8–P14) beside Insights' stage 2.
Nov 7, 2026 — plan, before Admin starts. P0 partly done: F1–F33 found while writing and reviewing it, from the code as
Commerce, Customer Service and the framework's Constitution (mr-moqui 07a315d4) left it (§6). Admin and Insights are the
next two apps built, after Commerce, in one build order (§1); Insights' phases are in
[impl-insights.md](impl-insights.md). The parts of design-admin that wait on People, Maintenance, Sales and Marketing,
which are not built, are left out of this build (§4, §7). The plan's open questions were answered the same day (§4:
Organizations and the Constitution in Admin's first release, shared devices in a second Insights release, the budgets
raised per phase, components adding to the framework's seal lists, the acceptance link shown for copy when mail cannot
be sent, recipient caps of 50 and 200).

How [design-admin.md](design-admin.md) gets built, in phases from the foundation to devices, each ending tested and
usable. This file is kept at a high level, as [impl-commerce.md](impl-commerce.md) and the other core-app plans are:
each phase names its scope by the design's sections and §17 needs rather than restating them, and the design stays the
place for screen and record detail. During the build this file is the log: phase status and what each built, the
decisions made, open questions, findings against the code, and what is deferred.

Today `screen/Admin/` holds six flat placeholders (Home; Users "Users, groups & permissions"; Organizations;
Integrations "Integrations & system messages"; Data "Data import & export"; Settings), and the root mounts only Chatter
and RecordFiles. The `BOSS_ADMIN` artifact group is live for `ADMIN` and `BOSS_ADMIN_ADMIN` (F1); P1 adds the root user
group and the ordinary groups. People who try the BOSS apps today manage users, groups, jobs and messages in Tools
System, as `ADMIN`. The framework has no `org.moqui.admin` service family but the Constitution's, and Mantle has no
identity, invitation or lifecycle services (F3, F4, F11). Admin is built on what is there (as found in the code, §6):
- from the framework: the Tools System screens (Security, ServiceJob, SystemMessage, Localization, AuditLog, Print,
  Constitution, and BasicComms' Voice), UserServices' account, factor and reset services, the sealed-permission and
  privileged-group EECAs, token routes, Monitor (source status, incidents, checks, alerts, recovery, the Business
  operations dashboard), report datasets and alert templates, the embedded database backup, and the Constitution
  runtime with System › Constitution and its parts (built Nov 7);
- from Mantle: `PartyServices` (user accounts, organizations, party settings), `ConstitutionServices` for an
  organization's document, the gateway configurations and `PaymentGatewayOrganization`, and `ProductImportServices` with
  its kind registry and operation records;
- from the apps: Accounting's `SetupServices.get#Readiness`, Products' catalog checks, Commerce's
  `check#StoreReadiness`, `retry#StoreMessages` and ChannelImport (left to Admin in impl-commerce §7), Accounting's
  StatementImport and opening open items, Products' Shared/ProductImport, Commons' contact import and export, Projects'
  work-item import, Commons Account's sign-in list, Customer Service's restricted Privacy queue (its F80), and each
  built app's settings screens for the settings index;
- from Insights, built beside it (impl-insights): `pause#OwnedSchedules` and `transfer#DefinitionOwner` for offboarding,
  report occurrences for Exports, and the refresh and readiness registrations of dataset indexes.

**Inputs.**
- Designs:
  - [design-admin.md](design-admin.md)
  - [design-insights.md](design-insights.md): §7 (ownership transfer), §11 (DataReadiness over Admin's readiness and
    refresh contracts) and its first-release delivery, which Admin's lifecycle and Exports use
  - [design-crosscut.md](design-crosscut.md) §1.3's automation register (Admin's rows), §1.4 (capability groups, the
    Admin and Insights rows), §1.5 (CX-ASSIST, CX-DEVICE, CX-OPS-REPORTS), §3.32 (maps), §5 (settings ownership), §7.1
    (CX-ACCESS) and §7.10 (Admin's needs)
  - the built apps' designs for the rows Admin registers: [design-accounting.md](design-accounting.md) (setup readiness,
    StatementImport, open items, PaymentMethods and the gateway boundary), [design-products.md](design-products.md)
    (CatalogChecks, ProductImport), [design-commerce.md](design-commerce.md) (store readiness, channel recovery and
    import), [design-customer-service.md](design-customer-service.md) §8 (the interim privacy cases),
    [design-drawers-commons.md](design-drawers-commons.md) (Account, contacts import and export, shared resources),
    [design-projects.md](design-projects.md) (work-item import), [design-warehouse.md](design-warehouse.md) and
    [design-manufacturing.md](design-manufacturing.md) (settings, ShopFloor)
  - mr-moqui `plans/LLM-A2A-Assist.md` §7.10 and `docs/ai/Constitution.md` (what is built of the Constitution)
- Plans:
  - [impl-insights.md](impl-insights.md), its companion.
  - [impl-commerce.md](impl-commerce.md): the pattern, and its §7 rows for Admin (readiness, recovery, import target).
  - [impl-customer-service.md](impl-customer-service.md) P2 and F80, F211 (the Privacy queue and the privacy provider).
  - [impl-products.md](impl-products.md) P12 (ProductImport), [impl-accounting.md](impl-accounting.md) P9 and P19
    (StatementImport, open items), [impl-drawers-commons.md](impl-drawers-commons.md) §4 (the shared rules).
- The suite-app design review, which explains the design's X, Z, L and R-ADM IDs, was removed from the tree (mr-boss
  bd74564); read it with `git show bd74564^:plan/review-suite-apps.md` (§3 decisions, §4 one owner per step).
- Guides and rules: [design-doc-guide.md](design-doc-guide.md), [style-guide.md](style-guide.md) §8,
  mr-moqui `docs/dev/Practices-App-Dev.md`, `docs/security/Attack-Surface.md`, `docs/tools/Monitoring.md`.
- Inventories: [ss-inventory.md](ss-inventory.md) (the Gateway, Vendor and Party/EditParty rows) and
  [usl-inventory.md](usl-inventory.md), which carry the design's **Designed in** paths; design §15.2 traces the
  framework forms.
- mr-moqui: `plans/Remaining-Work.md` ("IronStone framework asks": the `org.moqui.admin.*` families, the device
  credential, the agent screens) and `docs/Build-Test.md`.

Framework paths are under the mr-moqui checkout (`crates/`, `runtime/components/base/`), Mantle paths under
`runtime/components/addon/mr-mantle/`.

Sections: [1 scope](#1-scope-and-order) · [2 rules](#2-ground-rules) · [3 phases](#3-phases) ·
[4 decisions](#4-decisions) · [5 open](#5-open-questions) · [6 findings](#6-findings) · [7 later](#7-later) ·
[8 verification](#8-verification) · [9 moved to the framework](#9-screens-moved-to-the-framework-nov-11-2026)

---

## 1. Scope and order

- **Repositories.** Each is its own git repo:
  - `mr-moqui` (`crates/`, `runtime/components/base`): the `org.moqui.admin` service families (identity guards and
    sessions, access, configuration and connections, operations, data transfer, backups, audit, devices), the
    InstancePreference, transfer and registry records, the session refresh check (F4), the `authz` elements by which a
    component adds to the seal lists (F5, §4), the framework seals of `ADMIN_IDENTITY_GLOBAL`, `ADMIN_ACCESS_MANAGE`
    and `ADMIN_BACKUP_DOWNLOAD` (§4), the owner-change services of drives and shared mail accounts (F31) and the
    device credential (CX-DEVICE);
  - `runtime/components/addon/mr-mantle`: `mantle.party.IdentityServices` with `UserInvitation` and `UserLifecycleOperation`,
    the staff invitation template, the organization services, the owner-change services of calendars and contact
    books (F31), and the gateway connection adapters;
  - `runtime/components/addon/mr-boss`: the Admin app, AcceptInvitation, Shared/DataImport, `ironstone.admin`
    (ContextServices, RegistryServices, LifecycleServices) and its registry entities (F32), the registrations of the
    built apps, Admin's `report/` and `skill/` files. Since Nov 11 the readiness, refresh and settings registry
    records and the generic screens are the framework's (§9).

  `runtime/components/addon/mr-marble` is read only, for the baseline Gateway, Vendor and Party/EditParty forms that
  ss-inventory maps. mr-pass is not changed: the PASS Account privacy page is later (§7).
- **Scope.**
  - Every `parity` and `new` row of design §2 and the §17 needs they use, A1 and A2 of design §17.3, as changed by §6,
    except what waits on People, Maintenance, Sales and Marketing (§4, the user's call; §7 names the plans that now
    pick each piece up):
    - People's provisioning entry: `ironstone.admin.LifecycleServices.request#Provisioning` and `request#AccessEnd`, the
      tx-commit SECA on `PeopleServices.hire#Employee` and `apply#EmploymentChange`, and the IT checklist task's link;
    - UserDetail's Employee360 link, and the People employee and time-and-attendance import targets;
    - the Sales opportunity, Maintenance equipment and Marketing audience import targets; the payroll exchange export;
    - the People, Sales, Marketing and Maintenance rows of the settings index (§14.2), readiness providers, lifecycle
      participants and device route groups (People ClockingKiosk, Maintenance TechnicianKiosk, Marketing CheckIn).
  - The §14 contracts as registries, filled with the rows of the apps that are built (§4): readiness and refresh,
    settings, capabilities, lifecycle participants, operational recovery, import and export targets, shared devices.
  - What other apps left to Admin: Commerce's readiness registration, `retry#StoreMessages` as a recovery action and
    ChannelImport as an import target (impl-commerce §7); Customer Service's `BOSS_ADMIN_PRIVACY` group (its F80);
    Products' ProductImport becoming the Products mount of Shared/DataImport (design §11.1); Commons Account's
    sign-in list over the one sessions service (design §4 Sessions).
  - Shared screens: Admin builds `Shared/DataImport` (P15), generalized from `Shared/ProductImport`, with Admin's and
    Products' mounts.
  - §7 holds the design's `later` rows (AccessInspector, Webhooks, MailDomains, Retention, PrivacyRequests, backup
    archive download), the §17.4 later capabilities, the §19 open items, and the parts waiting on unbuilt apps.
- **Order** (decided Nov 7, §4). Admin and Insights are built together, in five stages, each ending at a gate. A phase
  lives in the plan of the app whose screens it builds; framework and Mantle work goes in the phase that first needs
  it. This list is the one order of both plans; impl-insights §1 points here.

  | # | Phase | Stage |
  | --- | --- | --- |
  | 1 | Admin P1 Foundation | 1 |
  | 2 | Insights P1 Foundation | |
  | 3 | Admin P2 Registries, Health and the settings index | |
  | 4 | Insights P2 Dashboards and Explore in Insights | |
  | 5 | Admin P3 Groups and grants | |
  | 6 | Insights P3 Dataset admission | |
  | 7 | Admin P4 Users and sessions | |
  | 8 | Insights P4 Report catalog and metrics | |
  | 9 | Admin P5 Invitations | |
  | 10 | Insights P5 Home and attention | |
  | 11 | Admin P6 Lifecycle and offboarding | |
  | 12 | Admin P7 Organizations and the Constitution | gate 1: Admin's first release, Insights browsable |
  | 13 | Insights P6 Analysis, drill and record contexts | 2 |
  | 14 | Insights P7 Scheduled delivery and digests | |
  | 15 | Insights P8 Business alerts | |
  | 16 | Insights P9 Flow maps | |
  | 17 | Insights P10 Settings, data readiness and Assist | gate 2: Insights' first release |
  | 18 | Admin P8 Instance settings, localization and reference data | 3 |
  | 19 | Admin P9 Capabilities and row rules | |
  | 20 | Admin P10 Sign-in policy and identity providers | |
  | 21 | Admin P11 Connections and mail relays | |
  | 22 | Admin P12 Protocols and the mail queue | |
  | 23 | Admin P13 System messages and recovery | |
  | 24 | Admin P14 Jobs and topics | gate 3: Admin's configuration and operations |
  | 25 | Admin P15 Imports | 4 |
  | 26 | Admin P16 Exports and backups | |
  | 27 | Admin P17 Audit and access evidence | gate 4: Admin's data and audit |
  | 28 | Admin P18 Shared devices | 5 |
  | 29 | Insights P11 Wall displays on shared devices | |
  | 30 | Admin P19 and Insights P12 Finish | gate 5: Insights' second release; both apps built |

  Each phase starts after the one above it, except these, which run side by side because neither uses the other's
  work: Admin P2 beside Insights P2; Admin P3 beside Insights P3; Admin P4 beside Insights P4; Admin P5 beside Insights
  P5; and stage 3 (Admin P8–P14, in order) beside stage 2 (Insights P6–P10, in order), stage 4 starting when both have
  reached their gates. The dependencies that fix the rest: Insights P1 uses Admin P1's deny-pattern split (F14); Admin
  P3 fills Insights' capability rows for the groups Insights P1 created; Insights P3 registers its index refresh and
  freshness provider in Admin P2's registries; Insights P7 registers its schedule ownership as a lifecycle participant
  of Admin P6 and reads Admin P8's instance ceiling, which until Admin P8 is the cap's built-in default of 200 (§4);
  Insights P10's DataReadiness reads Admin P2's readiness; Admin P16's Exports list reads Insights P7's occurrences;
  Insights P11 plays playlists on Admin P18's device credential. A phase of a side-by-side pair that appends to the same
  file as the other (BossSetupData.xml, BossUsersDemoData.xml, mr-boss MoquiConf.xml) rebases on it before merging.

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
  - changes by effective date and the audit log;
  - demo data;
  - builds and commits.

  The walks are on Commerce's pattern: one golden-path walk in `test/client/Admin/`, `AdminUsersWalk` (P4), registered
  in `test/client/suite.js`; the others are acceptance tests.
- **Three layers, as design §4.1 and §17.2 place them.**
  - Framework `org.moqui.admin.*`: the generic guards and administration of framework records (UserAccount, UserGroup,
    sessions, configuration, SystemMessage, ServiceJob, NotificationTopic, EntityAuditLog, transfers, backups,
    devices), with no Mantle or BOSS dependency.
  - Mantle `mantle.party.IdentityServices`: identity scoped to an organization through PartyRelationship and PartyRole
    (users in scope, invitations, organization membership, lifecycle operations), calling the framework guards.
  - BOSS `ironstone.admin`: ContextServices (scope, choices, links, the mount's routes), RegistryServices (the
    readiness contract over the owners' services for the viewer's organizations, and which places open to the
    viewer; the registries themselves are the framework's `org.moqui.admin.ReadinessServices` since Nov 11, §9) and
    LifecycleServices (the lifecycle coordinator's participants and transfers), and the screens.

  No same-named `ironstone` pass-through over a framework or Mantle service is built.
- **Permissions, not group names.** Services check `ec.user.hasPermission` and scope, never a BOSS group name, a calling
  screen or a supplied `appRoot`; a write permission is not a view permission. The framework seeds design §1.1's
  `ADMIN_*` permissions, each granted to `ADMIN`, as it seeds `ADMIN_PASSWORD` and `ADMIN_CONSTITUTION_GLOBAL` today,
  and seals `ADMIN_IDENTITY_GLOBAL`, `ADMIN_ACCESS_MANAGE` and `ADMIN_BACKUP_DOWNLOAD`; BossSetupData grants them to the
  groups of design §1.1 (§4). Mantle specs and framework specs grant them to spec-local groups, never a `BOSS_*` group.
- **Bounded delegation everywhere** (design §1.1). The sealed-permission and privileged-group EECAs hold for Admin
  screens, Tools, imports, SSO role mappings and direct entity calls alike; an access administrator grants only
  registered bundles (the capability registry, P3); `check#AdministrationPath` guards every grant, membership, factor,
  provider and lifecycle change. A refusal is shown as a reason, not an error.
- **Scope through services.** UserAccount, UserGroup, UserGroupMember and the security records carry no organization;
  identity work is scoped by the target's organization relationships (Mantle IdentityServices), and an
  account-wide change of a shared identity needs `ADMIN_IDENTITY_GLOBAL` (design §4.1). The `BOSS_ADMIN_*` groups get no
  artifact authorization for the raw framework security entities, `org.moqui.impl.UserServices`' administrative
  services or their REST paths; `ADMIN` keeps Tools.
- **Secrets stay on the server.** Credentials are masked on read and replaced write-only; tokens and registration codes
  are stored hashed and never listed, logged, put in shell context, exported or given to Assist; an endpoint change
  clears or re-asks for the secrets that depend on it and leaves the connection disabled until a test against the new
  endpoint passes (design §8.1); safe result envelopes per design §14.
- **Records follow the shared rules** (impl-drawers-commons §4; §4 here):
  - memberships and grants are dated rows (UserGroupMember, UserGroupPermission and organization PartyRelationship
    rows), ended, never deleted;
  - the audit log on the key fields of the security records the build changes (F23): UserAccount's `disabled`, login,
    email and `terminateDate` (already audit-logged) and its allowed IPs and password-change flag; UserGroupMember's
    and UserGroupPermission's dates; ArtifactAuthz's type; UserGroup's factor and IP flags; and
    PaymentGatewayOrganization (already audit-logged);
  - records of their own where a fact has its own identity: a staff invitation (a single-use token), a lifecycle
    operation and its steps (an operation with independent outcomes), a transfer batch where a target has no owner
    batch, a device credential, an instance preference;
  - prints and exports take an effective date and time.
- **Revisions and operations.** Every write names the revision it read (`lastUpdatedStamp`, a document hash for the
  Constitution) and is refused naming the current one when stale; an invitation, a lifecycle operation, a transfer
  item and a recovery action carry an operation key, so a retry answers the first result. A batch (bulk disable, bulk
  membership, an import, bulk recovery, a refresh of many sources) names each failure and goes on.
- **Delegated screens only where a role without `ADMIN` needs them** (design §13). `ADMIN` keeps the Tools System
  screens through Admin › System; Admin builds Jobs, JobRuns, SystemMessages, MessageTypes, Localization, AuditChanges,
  Users, Groups and Sessions for the delegated roles, and does not re-specify a Tools form it mounts. Since Nov 11
  the two are one set of screens, the framework's, which Admin shows without the instance administrator's parts
  (§9; design §1.4).
- **Owner contracts.** A registration or change built here for another app (§1 scope; the registries' rows) follows
  that app's design and is written into it. The owner's screens and services stay the owner's; a registration names
  them and adds no right.
- **Existing callers stay compatible.** `create#PartyUserAccount` and the account SECAs of design §10.1; UserServices'
  self-service callers (Commons Account, PASS accounts, the mobile and desktop key flows); `end#UserVisit`; the Forum
  tracking EECAs; Tools System and Dashboards; Products' import (its spec and ProductImport behavior through the new
  mount); Commerce's and Accounting's reads of PaymentGatewayOrganization; the Constitution's System screen and Mantle
  services. The framework regression suite, Mantle's PartyServices, Constitution, PassAuthority and Forum specs,
  mr-pass's suite and the earlier apps' BOSS regression suite pass unchanged.
- **Done for a phase** means all of these:
  - impl-drawers-commons §4 "Done" (as impl-projects §2 applies it):
    - cargo tests for the touched crates, with goldens reviewed;
    - the regression tests for the rules the phase adds passing: the framework's in
      `runtime/components/base/framework/test` (or the tools component's, for a Tools screen), Mantle's in mr-mantle,
      BOSS's in mr-boss;
    - `./moq test-framework` for a phase that touches `crates/` or a base component, and `./moq test-apps`, each suite
      within its budget, raised by the phase's measured share with the user's agreement (§4);
    - `moqui lint --screens` clean for BOSS with the Debug binary;
    - the inventories' **Implemented in** columns;
  - an access rule the phase adds checked in `AdminAccess` (one holder and one non-holder on one verb, and another
    organization's identity refused), not every service and mount; ProjectsAccess passing with the new package (F14);
  - its row and **Built** note here.

  No route fixtures: a screen sweep is an acceptance test, one per app per mode. The phase's "usable when" and its §8
  scenario are acceptance tests to write (`test/acceptance/Admin/`, `test/acceptance/client/Admin/`), named in the phase; running
  them is not part of Done.

## 3. Phases

| Phase | Repos | Screens | Status |
| --- | --- | --- | --- |
| P0 Checks | all (read) | — | done Nov 7 (§6 F1–F33; F2's check in P1, F34; the others F41–F46) |
| P1 Foundation | mr-moqui, BOSS | the Admin root and menu, Home, System, Monitoring, AgentsHome, DeveloperHome | built and reviewed Nov 7, merged |
| P2 Registries, Health and the settings index | BOSS | Home, Health, SettingsHome | built and reviewed Nov 7, merged |
| P3 Groups and grants | mr-moqui, BOSS | Groups, GroupDetail | built and reviewed Nov 7, merged |
| P4 Users and sessions | mr-moqui, Mantle, BOSS | Users, UserDetail, Sessions; Commons Account's sign-in list | built and reviewed Nov 7, merged |
| P5 Invitations | Mantle, BOSS | Invitations, AcceptInvitation | built and reviewed Nov 7, merged |
| P6 Lifecycle and offboarding | mr-moqui, Mantle, BOSS | UserDetail's Lifecycle, LifecycleOperations, LifecycleDetail | built and reviewed Nov 7, merged |
| P7 Organizations and the Constitution | Mantle, BOSS | Organizations, OrganizationDetail, Constitution | built and reviewed Nov 7, merged |
| P8 Instance settings, localization and reference data | mr-moqui, BOSS | InstanceSettings, Localization, ReferenceData | built and reviewed Nov 10, merged |
| P9 Capabilities and row rules | mr-moqui, BOSS | Capabilities, RowRules | built and reviewed Nov 10, merged |
| P10 Sign-in policy and identity providers | mr-moqui, BOSS | SignInPolicy, IdentityProviders, IdentityProviderDetail | built and reviewed Nov 10, merged |
| P11 Connections and mail relays | mr-moqui, Mantle, BOSS | Connections, ConnectionDetail, MailRelays, MailRelayDetail | built and reviewed Nov 10, merged |
| P12 Protocols and the mail queue | mr-moqui, BOSS | ProtocolsHome, ServerConfiguration, MailQueue | built and reviewed Nov 10, merged |
| P13 System messages and recovery | mr-moqui, BOSS | MessageTypes, MessageTypeDetail, SystemMessages, SystemMessageDetail | built and reviewed Nov 10, merged |
| P14 Jobs and topics | mr-moqui, BOSS | Jobs, JobDetail, JobRuns, JobRunDetail, Topics, TopicDetail | built and reviewed Nov 10, merged |
| P15 Imports | mr-moqui, Mantle, BOSS | Imports, DataImport, ImportDetail; Products' import mount | built and reviewed Nov 11, merged |
| P16 Exports and backups | mr-moqui, BOSS | Exports, DataExport, Backups | built and reviewed Nov 11, merged |
| P17 Audit and access evidence | mr-moqui, BOSS | AuditChanges, AccessLog | built and reviewed Nov 11, merged |
| P18 Shared devices | mr-moqui, BOSS | Devices | built and reviewed Nov 11, merged |
| P19 Finish | all | the sweeps and the review walk (acceptance) | built and reviewed Nov 11, merged |

### P0 — Checks

Verify the design's riskiest assumptions against the code before building. Each result is a row in §6 and, where it
changes the design, an edit there. F1–F30 were found on Nov 7 while writing this plan and F31–F33 in its review the
same day; the design edits they call for were made then. Still to check:

- **Admin › System for `ADMIN` only** (F2; settled in P1, F34): which change keeps `SYSTEM_APP`'s own check on the mounted
  `System.xml` for every BOSS group, given that an inheritable `AUTHZT_ALWAYS` on the Admin root skips it
  (authz.rs:450-456): `BOSS_ADMIN_ADMIN` and the ordinary groups on `AUTHZT_ALLOW`, or the System mount outside the
  inherited path; and that its links and transitions stay under Admin/System (Insights F3 found the Dashboards screens'
  links hard-coded to `//apps/dashboards`).
- **The administration path:** what `check#AdministrationPath` counts as a usable path against the login rules
  (an enabled, unexpired, unlocked member of `ADMIN` or a `BOSS_*_ADMIN` group whose factor requirement and allowed IPs
  it can meet), and how it answers a cluster with a stale member.
- **Ending a session:** what `end_user_visit`'s SESSION_END (session.rs:558-631) reaches: the notification socket,
  Comms' call and chat connections, a running job's or agent run's identity, and a cluster member's cache; what P4's
  revocation must add for each.
- **Projects' work-item import:** whether it keeps a run record (Commons' does not, F13); and the domain exporters
  DataExport registers beside Commons' built vCard export (`ContactImportServices.export#Contacts`): a work-item CSV
  and Accounting's ledger exports.
- **Comms' settings and readiness:** where its shared templates, text blocks, sending profiles and suppressions are
  edited (Comms has no Settings area) and whether a mail-account readiness projection exists, for the §14.2 row.
- **The shipped report sources:** that job-run telemetry (`otel_spans`, `moqui.job.runs`) and the `moqui.report.audit`
  and `moqui.monitor.audit` log targets carry what `admin-job-runs` and `admin-access-log` need.
- **Admin › Settings without the Admin launcher:** how a BOSS user who is not in an Admin group reaches SettingsHome
  (P2: a warehouse manager opening Warehouse's settings from the index) and Settings › Constitution (P7: a member
  reading its organization's document), given that the root's grant is what opens its subscreens: screens of their
  own outside the Admin root, a narrow grant on those two, or the Assist drawer's Rules pane linked for the
  Constitution.

### P1 — Foundation

Design §1.1, §1.2, §3 Home (its frame), §13 System, AgentsHome and DeveloperHome, §10 Monitoring; ADM-ACCESS (groups,
permissions and seals), ADM-SHELL.

- **Access** (design §1.1).
  - The groups of design §1.1 on Commerce's pattern (impl-commerce F45): `BOSS_ADMIN` as the root user group beside the
    artifact group of that name, and `_READ`, `_IDENTITY`, `_ACCESS`, `_CONFIGURE`, `_INTEGRATIONS`, `_OPERATIONS`,
    `_DATA`, `_AUDIT`, `_PRIVACY` and `_BACKUP`; `BOSS_ADMIN_ADMIN` keeps its row with the change F2 calls for. An area
    only some groups see is an artifact group that denies the root group and allows its capability groups.
    `BOSS_ADMIN_PRIVACY` has no permissions until PrivacyServices (§7); Customer Service's Privacy team gains it (its
    F80, owner contract).
  - The permissions: the framework seeds `ADMIN_OVERVIEW_VIEW`, `ADMIN_IDENTITY_VIEW`, `_MANAGE`, `_GLOBAL`,
    `ADMIN_ACCESS_VIEW`, `_MANAGE`, `ADMIN_SETTINGS_VIEW`, `_MANAGE`, `ADMIN_CONNECTION_VIEW`, `_MANAGE`,
    `ADMIN_OPERATION_VIEW`, `_MANAGE`, `ADMIN_TRANSFER_VIEW`, `_RUN`, `ADMIN_AUDIT_VIEW`, `ADMIN_BACKUP_VIEW`, `_RUN`
    and `_DOWNLOAD`, each granted to `ADMIN` (§4); BossSetupData grants them by design §1.1's table.
    `ADMIN_BACKUP_DOWNLOAD` is seeded and sealed now, for design §15.3's escalation rule, though no screen uses it
    until the archive download (§7); the privacy and retention permissions come with their later screens (§7).
  - The seals (design §1.1, F5, §4). The framework: `user-facade` `authz` gains child elements `sealed-permission` and
    `privileged-group` (each with a `name`) in `moqui-conf-3.xsd`; the conf merge adds each component's elements to
    the list, never replacing it; `security_checks.rs` reads the attribute lists (the framework's defaults, as today)
    joined with every element; and MoquiDefaultConf's `sealed-permissions` gains `ADMIN_IDENTITY_GLOBAL`,
    `ADMIN_ACCESS_MANAGE` and `ADMIN_BACKUP_DOWNLOAD`, beside `ADMIN_CONSTITUTION_GLOBAL`. Then mr-boss MoquiConf adds
    `BOSS_ADMIN_ACCESS`, `BOSS_ADMIN_BACKUP` and `BOSS_ADMIN_ADMIN` as `privileged-group` elements, and no seals.
  - The ordinary groups' authz on the root with `MANTLE_USER_ORG` and `MANTLE_PRIVATE_CONTACT`, the
    `ironstone\.admin\..*` service pattern on the artifact group, and `admin` and `insights` added to the client deny
    pattern, its rows that pass 255 characters split (F14; Insights P1 then needs no deny-pattern change).
  - `ironstone.admin.ContextServices` (design §17.2): `get#SharedContext` (capabilities from the permissions, the
    organizations the user may administer, `appRoot`, `sharedLinks`), `check#Record`, `get#Choices` and
    `search#Records`, over one module `Admin.js` whose tables later phases extend (capability permissions, areas,
    record kinds, choice sources, link paths).
- **The Admin root** (design §1.2): the areas Home, Agents, System and Developer tools, and Operations with Monitoring;
  the other areas of design §1.2 are added by the phases that build them, and `later` entries stay absent. The six
  placeholders are removed (each area's phase builds its real screens); the stale grant comment fixed (F1).
  `<shell-providers>` with the `admin` keymap; the palette, quick create and Today sources arrive with their records.
- **Admin › System** (design §13): the Tools `System.xml` mounted for `ADMIN` only (F2), adding no grant; BOSS groups
  without `ADMIN` see no System entry.
- **Link landings** (design §10 Monitoring, §13 AgentsHome and DeveloperHome): Monitoring over
  `MonitorServices.get#SourceStatus` and `list#Incidents` with links into Monitor under its own grants; AgentsHome over
  `AgentAdminServices.get#EffectiveConfig` and `get#DashboardTotals`, the agent screens of ADM-AGENTS shown as
  unavailable until the framework builds them (§7), the Constitution link from P7; DeveloperHome over
  `RegistryServices.find#ToolLinks` (P1 starts `ironstone.admin.RegistryServices` with it; P2 adds the rest), each
  Tools route checked with its own permission.
- **Home** (design §3): its frame with the Attention, SetupChecks and HealthCards forms showing "Not configured" until
  P2, and Monitor / Manage / Configure shortcuts for the areas built.
- **Demo data.** BossUsersDemoData gains a user per group (`admin.reader`, `.identity`, `.access`, `.configure`,
  `.integrations`, `.operations`, `.data`, `.audit`, `.privacy`, `.backup`, `.admin`, none in `ADMIN`); an identity
  operator delegated for ORG_ZIZI_RETAIL only; a shared identity who works for ORG_ZIZI_RETAIL and
  ORG_ZIZI_SERVICES, for design §15.3's delegated-administration scenario; and a delegated access administrator
  holding `ADMIN_ACCESS_MANAGE` through a custom group, not in `BOSS_ADMIN_ACCESS`, for its escalation scenario.
- **Specs.**
  - `test/Admin/AdminSpecLib.js` (ids, users, `shell`, `page`).
  - `AdminAccess`: the app's one access spec, about seven features with authorization on: each group's permissions,
    the menu and providers per group, Admin › System refused to `BOSS_ADMIN_ADMIN` and admitted to `ADMIN`, the seals
    (a non-member refused a `BOSS_ADMIN_ACCESS` membership and a non-holder a grant of `ADMIN_ACCESS_MANAGE`, through
    a direct entity call), Home's one qvt render, and the refused raw security mutators. A later phase adds a case only
    for an access rule it adds.
  - Framework: the conf tests for the new elements (a component's element adds to the lists and keeps every default;
    two components' elements both apply; a component that still sets the attribute replaces the defaults as before),
    a privileged-group check on an element-added group, and the three new framework seals.
- **Usable when** (an acceptance test to write, `test/acceptance/Admin/AdminFoundationWalk`): the menu renders for each
  group; the delegated access administrator, holding `ADMIN_ACCESS_MANAGE` but not in `BOSS_ADMIN_ACCESS`, cannot add
  anyone to it through Tools or a direct entity call, and no one without `ADMIN_BACKUP_DOWNLOAD` can grant it;
  `admin.reader` opens Home but not System; a Projects client and a PASS public account are refused the root and every
  `ironstone.admin` service.

**Built Nov 7 (P1).**
- Framework (mr-moqui):
  - `moqui-conf-3.xsd`: `user-facade` `authz` takes any number of `privileged-group` and `sealed-permission` children
    (each a `name`). `conf.rs` `merge_authz`: a component's `authz` attributes replace the base's as before, and its
    children are added to every other component's by `name`, never replacing them. `confcache.rs` keeps the children's
    names by element (`authz_names`, `ExecutionContextFactory::authz_names`); `security_checks.rs` joins the attribute
    list (or the framework's default when it is empty) with every element (`conf_ids`, `join_ids`).
  - MoquiDefaultConf's `sealed-permissions` (and `DEFAULT_SEALED_PERMISSIONS`) gain `ADMIN_IDENTITY_GLOBAL`,
    `ADMIN_ACCESS_MANAGE` and `ADMIN_BACKUP_DOWNLOAD`; its comment says how a component adds to the lists.
  - `SecurityTypeData.xml`: design §1.1's eighteen `ADMIN_*` permissions (§3 P1's list), each granted to `ADMIN`, beside
    `ADMIN_PASSWORD`.
  - Tools: ActiveUsers, VisitList and VisitDetail link UserAccountDetail by a relative path, not `//system/...`, so
    the links stay under Admin › System (F34).
  - Docs: Attack-Surface's `user-facade` paragraph (the three seals, `ADMIN_CONSTITUTION_GLOBAL`, the elements);
    Remaining-Work's framework-asks row.
- BOSS access (`MoquiConf.xml`; `data/BossSetupData.xml`, appended but for F1's comment, F2's row and F14's rows):
  - `BOSS_ADMIN_ACCESS`, `BOSS_ADMIN_BACKUP` and `BOSS_ADMIN_ADMIN` as `privileged-group` elements, no seals;
  - the groups `BOSS_ADMIN` (root user group) and `_READ`, `_IDENTITY`, `_ACCESS`, `_CONFIGURE`, `_INTEGRATIONS`,
    `_OPERATIONS`, `_DATA`, `_AUDIT`, `_PRIVACY`, `_BACKUP`; on the `BOSS_ADMIN` artifact group (a second element of the
    same id) the `ironstone\.admin\..*` service pattern and the root authz `BOSS_ADMIN_ROOT` (`MANTLE_USER_ORG`,
    `MANTLE_PRIVATE_CONTACT`); `BOSS_ADMIN_APPADMIN` now `AUTHZT_ALLOW` (F2, F34) and the stale comment replaced (F1);
  - the area groups `BOSS_ADM_OPERATIONS` (the reader, operations operator, administrator), `BOSS_ADM_AGENTS` and
    `BOSS_ADM_DEVELOPER` (the administrator), each denying `BOSS_ADMIN` (impl-commerce F45), and `BOSS_ADM_SYSTEM`,
    which denies Tools' `System.xml` to `BOSS_ADMIN` and `BOSS_ADMIN_ADMIN`;
  - the `UserGroupPermission` grants of design §1.1's table (§4); `BOSS_ADMIN_PRIVACY` none;
  - `admin` and `insights` in the client deny pattern, the two rows they took past 255 characters split (F14: twelve
    rows, the same 102 verbs, the longest 237).
  No authz for the raw security entities, UserServices' administrative services or their REST paths.
- `ironstone.admin.ContextServices` (`get#SharedContext`, `check#Record`, `get#Choices`, `search#Records`,
  `get#AppAccess`) and `RegistryServices.find#ToolLinks`, over `service/ironstone/admin/Admin.js`, whose tables later
  phases extend: `capabilityPermissions` (the eighteen, `ADMIN_CONSTITUTION_GLOBAL` and `AgentAdmin`), `areas`
  (operations, agents, developer; `system` from Tools' own grant), `recordKinds` (organization; user, read with
  `identityView`, in scope when its party works for one of the user's organizations, the detail naming only those, and
  `sharedBeyondScope` for P4's global rule), `searchFinds` (none yet), `choiceSources` (organizations), `linkPaths` and
  `toolRoutes` (nineteen Tools and System routes, each by its app's own grant and its screen's permission). Opening
  Admin is the root grant read from the user's own groups (no permission: the root opens navigation, §4); a Projects
  client and a PASS account never.
- Screens: the root (`screen/Admin.xml`: `get#SharedContext` and `sharedLinks` in always-actions; the System mount of
  `component://tools/screen/System.xml`; `<shell-providers>` with the `admin` keymap, g a, g o, g n, g y, g d); the six
  placeholders removed (Home rewritten); `Admin/Home.xml` (the shortcuts by area, one primary; Needs attention, Setup
  checks and Health's four cards "Not configured" for an `ADMIN_OVERVIEW_VIEW` holder); `Admin/Operations.xml` with
  `Operations/Monitoring.xml` (MonitoringDestinations by the user's Monitor and Dashboards grants; telemetry sources and
  open incidents for those Monitor opens); `Admin/Agents.xml` with `Agents/AgentsHome.xml` (the effective configuration
  and today's totals for an AgentAdmin holder; thirteen destinations under Admin › System, the three missing framework
  screens "Not available", F19); `Admin/Developer.xml` with `Developer/DeveloperHome.xml` (ToolLinks). Projects'
  Settings › Index links Admin Home in place of the removed Users placeholder (F36).
- Demo (`data/BossUsersDemoData.xml`): `admin.reader`, `.identity` (the operator delegated for ORG_ZIZI_RETAIL only),
  `.access`, `.configure`, `.integrations`, `.operations`, `.data`, `.audit`, `.privacy`, `.backup` (each in
  `BOSS_USERS`, `BOSS_ADMIN` and its group, an agent of Retail), `admin.admin` (`BOSS_ADMIN_ADMIN` alone),
  `admin.delegate` (`ADMIN_ACCESS_VIEW` and `ADMIN_ACCESS_MANAGE` through `BOSS_ADMIN_DEMO_DELEGATE`, not in
  `BOSS_ADMIN_ACCESS`) and `shared.staff` (Retail and Services, `BOSS_USERS` alone); none in `ADMIN`.
  customerservice.admin, the Privacy team's member, is in `BOSS_ADMIN_PRIVACY` (F80, owner contract; design-customer-service
  §8 changed).
- Specs: `test/Admin/AdminSpecLib.js` (ids, users, `asUser`, `system`, `refusal`, `invoke`, `page`, `shell`) and
  `AdminAccess` (7 features, 3.3 s feature time, the slowest the context at 0.8 s: the context and its refusals, a Projects
  client and a PASS account refused every `ironstone.admin` service and Home; the menu and keys of the reader and the
  administrator and ADMIN's menu with System, the launcher; Home's one qvt render; the capabilities of every group, the
  delegate and ADMIN; Admin › System refused to `admin.admin` and opened to ADMIN, with the tool links of each; the seals
  through direct entity creates (the delegate refused `BOSS_ADMIN_ACCESS`, `_BACKUP` and `_ADMIN` memberships and the
  `ADMIN_BACKUP_DOWNLOAD` and `ADMIN_IDENTITY_GLOBAL` grants, admitted the `ADMIN_ACCESS_MANAGE` grant the reader is
  refused; `admin.access` adds to its own group) and the refused entity-auto security mutators; organization scope of
  identities: a Retail operator gets a Retail identity and the shared one by Retail alone, refused Services' and a forged
  one alike, the reader refused for `ADMIN_IDENTITY_VIEW`, the administrator every organization). Framework (cargo,
  moqui-core): `conf_tests` `each_component_adds_authz_elements_and_keeps_the_defaults`, `confcache`
  `authz_children_are_listed_by_element_beside_the_attributes`, `security_checks`
  `the_listed_ids_or_the_defaults_are_joined_with_every_added_id` and `the_framework_seals_the_admin_grants_that_widen_access`,
  `eca_tests` `a_group_and_a_permission_a_conf_adds_by_element_are_guarded_beside_the_defaults` (a runtime conf's elements
  through the EECAs) and the three seals in `sealed_permission_create_is_denied_without_the_permission`. No framework JS
  spec added, so the framework's budget is unchanged. Acceptance, written and not run:
  `test/acceptance/Admin/AdminFoundationWalk` (3 features: every area per user; the delegate through Admin › System, Tools
  System, the entity-auto service and a direct entity call, and no Admin user granting `ADMIN_BACKUP_DOWNLOAD`; the reader
  and the refused Projects client and PASS account).
- Tests run (Debug binary, `--nobuild`): AdminAccess 7 of 7; with CommerceAccess (15 of 15), CustomerServiceAccess (22 of
  22) and ProjectsAccess (8: 4 passed, among them the deny-pattern feature; 4 fail the same without P1's mr-boss changes,
  F37). Cargo: moqui-core's conf, confcache, security_checks and eca tests 37 of 37; the whole moqui-core lib 1528 of
  1529, the one failure at e3360436 too (F38). `moqui lint --screens` (Debug): no idiom or hazard site in the Admin
  screens or the three Tools screens (132 sites in all, as before). Prettier clean on the new JavaScript. Not run:
  `./moq test-apps`, `./moq test-framework`, the acceptance suite, AppStructure (acceptance; its placeholder list is found
  by label, so the removed placeholders need no change).
- Budget: mr-boss's measured share is AdminAccess's 3.3 s server (no client spec); the framework's none.
- Inventories: no ss-inventory or usl-inventory row is implemented by P1 (usl-inventory's SetupServices row names Health,
  P2's).
- Findings (provisional, numbered by the lead):
  - **F34** (P0's F2 check) An inheritable `AUTHZT_ALLOW` on the Admin root also opens a child with no grant of its
    own (authz.rs's last-frame fallback, about line 527), so making `BOSS_ADMIN_ADMIN` ALLOW alone would still open
    System; and mounting System outside the root's path is not possible for a subscreen. P1 sets the administrator's
    root grant to ALLOW (no inheritable ALWAYS that skips the child's check) and denies `System.xml` by its location to
    `BOSS_ADMIN` and `BOSS_ADMIN_ADMIN` (`BOSS_ADM_SYSTEM`); `ADMIN`'s ALWAYS, on the root or Tools' `SYSTEM_APP`, still
    opens it, there and at `/qapps/system`. A group an installation gives an ALLOW on the Admin root needs the same deny.
    Links: three transitions (Security/ActiveUsers, Visit/VisitList, Visit/VisitDetail) went to `//system/Security/UserAccountDetail`,
    Tools' own mount; now relative. The others leave for Monitor, Dashboards and Tools (`//apps/...`) under their own
    grants, as designed. Design §13 changed.
  - **F35** `ec.artifactExecution.isPermitted` checks against the top of the stack, so under the Admin root (or the
    `ironstone\.admin` service pattern, inheritable) every Tools screen reads as permitted, and it records an
    authorization failure for each refusal. Admin.js reads the user's own groups' grants (`ArtifactAuthzCheckView`), as
    Commerce.js does, for the root, the areas and the framework apps. Likewise the root's inheritable grant reaches the
    services an Admin screen calls, so Monitoring and AgentsHome call only services that check their own grant
    (`get#SourceStatus`'s `authorize_own`, `list#Incidents`' `MONITOR_INCIDENT`, AgentAdminServices' AgentAdmin).
  - **F36** Projects' Settings › Index linked `/qapps/Admin/Users`, a removed placeholder; it links Admin Home until
    P4's `Users/Users` (P4 repoints it).
  - **F37** On the Debug binary ProjectsAccess fails four client features with "Maximum call stack size exceeded" in
    nested scripts (entity filters, record paths), the same with P1's mr-boss changes stashed: the script stack budget
    (`script/runtime.rs` `stack_budget`) is fixed while a debug build's frames are larger. Its deny-pattern feature (F14)
    passes. A run on a release binary should pass them.
  - **F38** moqui-core's `the_wrapped_ec_takes_probes_and_leaves_the_framework_the_real_one` fails at e3360436 without
    P1 (`ec.entity` refused in the nested read); not P1's.
  - **F39** With `Admin.xml` as a spec's render root, `//Admin/...` links resolve to nothing and render disabled (as
    every app's `page` helper does), so specs check a shortcut's label, not its URL.
  - **F40** `ORG_ZIZI_RETAIL` has a child organization, `BOSS_WH_RETURNS` (PrtOrgRollup); `get#PartyInternalOrgIds`
    counts it, so a Retail administrator administers it too, as `MANTLE_USER_ORG` filters.
- Decisions (§4 rows added): the administrator's grants; opening Admin with the root grant alone; the P1 areas by group;
  the Privacy team's group through its member.
- For the lead:
  - the framework budget needs no change; mr-boss's share is AdminAccess's 3.3 s;
  - ProjectsAccess on a release binary (F37) before the merge, and F38 for the framework;
  - the demo component's lock-down (`runtime/components/dev/demo`) ends some of `ADMIN`'s sealed permissions on the demo
    server; whether it ends `ADMIN_IDENTITY_GLOBAL`, `ADMIN_ACCESS_MANAGE` and `ADMIN_BACKUP_DOWNLOAD` too is the
    framework's call (Demo.spec.js lists the ended ones);
  - P4 repoints Projects' Settings link (F36); Insights P1 needs no deny-pattern change (F14 done).

**Review Nov 7 (P1).** Checked the mr-moqui and BOSS diffs against this section, §2, §4, §6, design §1.1, §1.2 and §13,
AGENTS.md, Practices-App-Dev, Practices-Rust and Attack-Surface:
- Seals (framework): `merge_authz` copies a component's `authz` attributes over the base's (a set attribute still
  replaces its list) and adds its `privileged-group` and `sealed-permission` children by `name`; `join_ids` takes the
  attribute or the framework default when it is missing or blank, joined with every element. Cargo covers each rule
  the Specs bullet asks for: `each_component_adds_authz_elements_and_keeps_the_defaults` (an element adds, defaults kept,
  two components both apply, a set attribute replaces), `authz_children_are_listed_by_element_beside_the_attributes`,
  `the_listed_ids_or_the_defaults_are_joined_with_every_added_id`, the three seals in
  `sealed_permission_create_is_denied_without_the_permission` and `the_framework_seals_the_admin_grants_that_widen_access`,
  and `a_group_and_a_permission_a_conf_adds_by_element_are_guarded_beside_the_defaults` (the EECAs on an element-added
  group and permission). No other reader of the `authz` lists. AdminAccess checks the delegate (`ADMIN_ACCESS_MANAGE`
  through a custom group) refused `BOSS_ADMIN_ACCESS`, `_BACKUP` and `_ADMIN` memberships and the `ADMIN_BACKUP_DOWNLOAD`
  and `ADMIN_IDENTITY_GLOBAL` grants by direct entity creates, and the reader (a non-holder) refused the
  `ADMIN_ACCESS_MANAGE` grant.
- F34: authz.rs requires authorization on the last screen of a path only, with a deny on any frame above it
  refusing an ALLOW there (`ancestor_deny`) and only an `ALWAYS` passing. `BOSS_ADM_SYSTEM` denies `System.xml` to
  `BOSS_ADMIN` and `BOSS_ADMIN_ADMIN`, the only groups with a grant on the Admin root besides `ADMIN`; no BOSS group has
  any grant on a Tools screen (only `SYSTEM_APP`, `ADMIN`'s ALWAYS), no Tools System screen relaxes
  `require-authentication`, and System's transitions are refused the same (`AT_XML_SCREEN_TRANS`). The three Tools links
  made relative also fix a broken target (`//system/Security/UserAccountDetail` has no screen; it is
  `Security/UserAccount/UserAccountDetail`); System has no other absolute link to itself. No BOSS group is authorized for
  the `moqui.security` entities, `org.moqui.impl.UserServices` or a REST path.
- BossSetupData: the groups and grants match design §1.1's table, the administrator as §4 decided; the area groups deny
  `BOSS_ADMIN` and allow their groups with `ALWAYS` (needed to beat the deny, as F45); the deny pattern has twelve rows
  with master's same 102 verbs, `admin` and `insights` added, the longest 237 characters.
- ContextServices and Admin.js: scope from `MANTLE_USER_ORG` organizations (only `MANTLE_ACTIVE_ORG` on the root grant
  is unrestricted, so a grant without filters fails closed); a forged or out-of-scope id refused alike
  (`RECORD_UNAVAILABLE`); a Projects client (`PROJECT_CLIENT`) and a PASS account refused every service; capabilities
  from permissions; no service names a BOSS group.
- Screens: `moqui lint --screens` (Debug) shows no idiom, hazard or parse failure in the Admin screens or the three Tools
  screens (132 sites, as before); no placeholder left; the shortcuts and keys follow the capabilities. Specs: Home
  rendered once in qvt (the html renders are refusals); AdminAccess 7 features, each under 0.8 s on Debug.
- Demo: the eleven users and the delegate, none in `ADMIN`, every internal one in `BOSS_USERS`; appends only.
- Fixes: **R1** (low, test gap) AdminAccess checked only `BOSS_ADMIN_ADMIN` on System and one subscreen; the root user
  group's deny (`BOSS_ADM_SYSTEM_DENY`) had no regression check. The reader joins, with a transition below System
  (`System/Cache/CacheList/cacheElements`) (mr-boss 001d6d58). **R2** (low, docs) design §1.1's list of the framework's
  sealed permissions stopped at `LlmGatewayUse`; it names the whole list, Admin's three seals and the privileged groups
  mr-boss adds by element (mr-boss d3c0bc79).
- Tests run: AdminAccess 7 of 7 (Debug, 3.4 s); CommerceAccess and CustomerServiceAccess 37 of 37 (Debug); ProjectsAccess
  8 of 8 with master's release binary on this worktree's runtime (F37: the four Debug failures are the debug stack
  budget; that binary lacks the `authz` elements, which ProjectsAccess does not touch); cargo moqui-core
  `context::conf`, `context::confcache`, `service::security_checks`, `service::eca` 38 of 38. Prettier clean on the
  spec. Not run: `./moq test-apps`, `./moq test-framework`, the acceptance walk.
- For the lead:
  - `access.has` (ProductAccess.js) is true for any `ADMIN` member, so Admin's capabilities show the sealed ones to
    `ADMIN` even where a grant is ended (the demo lock-down); later phases' services must check sealed permissions with
    `ec.user.hasPermission`, not `access.has`;
  - the root's inheritable ALLOW now opens the hidden Chatter and RecordFiles mounts to every `BOSS_ADMIN` member, as
    each app's root does for its users (IronStone R5), with `MANTLE_USER_ORG` filters; worth a look in P3 or P4, when
    Admin's records arrive;
  - the earlier items stand: the demo lock-down of the three new seals (framework's call), F38, and the budget
    share (AdminAccess about 3.4 s).

- **Wave 1 suites (Nov 7, on master after P1 merged and the release binary rebuilt; the Insights P1 worker ran at the same
  time):** `./moq test-framework` passed but for cargo's `the_wrapped_ec_takes_probes_and_leaves_the_framework_the_real_one`
  (F38, failing on master before P1); the framework's specs 9.7 of 12 s, tools 2.6 of 3 s; webroot's client (45.9 of 44 s)
  and dev-aide (30.4 of 30 s) over budget under the worker's load, neither touched by P1. Standalone mr-mantle 1,902
  passed, 2 failed (the baseline WorkTimeEntries and WorkTimesheets), 11 skipped. `mail_capture_sends=true ./moq
  test-apps`: 3,316 server features passed, 2 failed in the full run only: AdminAccess compared the administrator's
  organization choices, a page, with organizations other specs add (now asked for by selection), and
  AppOrganizationFilters required every app administrator's root grant to be ALWAYS (Admin's and Insights' are ALLOW by
  F34); both fixed and passing; 17 client features passed. Feature time mr-mantle 341.9 of 393 s, mr-boss 195.2 of 264 s
  server and 49.3 of 57 s client, mr-pass 14.3 of 20 s. `moqui lint --screens` 132 sites, as before. No budget raised.

### P2 — Registries, Health and the settings index

Design §3 Home, §10 Health, §7 SettingsHome, §14 (readiness provider, refresh operation, settings entry) and §14.2;
ADM-OPERATIONS (its readiness part), ADM-SETTINGS (the index), ADM-SHELL.

- **The registries** (§4): BOSS seed records `ironstone.admin.ReadinessProvider` (key, version, owner app, service,
  required permission, scope kind, fix route, freshness facet: watermark, expected frequency, lag, coverage),
  `ironstone.admin.RefreshOperation` (key, owner service, source, permission, scope parameters) and
  `ironstone.admin.SettingsEntry` (design §14 settings entry). Each owner's rows are in its own seed data; a row naming
  a missing service or permission is logged by name when read and left out.
- **`ironstone.admin.RegistryServices`**: `get#Readiness` (each provider called as the viewer, one failing provider
  named and the rest shown, a provider the viewer cannot read omitted, unavailable never shown as ready),
  `request#Refresh` (the registration's own permission; never a service or index name from the request), `get#Overview`
  and `find#Settings` (an entry shown only when its destination's view permission holds).
- **Admin's own providers** (design §3): the eight first-release checks (the SYSTEM EmailServer's host, the embedded
  backup job and its mirror, the report template's server, the `ReportAlert` topic, administrators without a factor,
  failing or late job runs, stale cluster heartbeats, telemetry loss), as functions of RegistryServices reading the
  framework's own records and services; on a fresh instance the backup job is paused and its remote has no `sendUrl`,
  so the backup check warns of both (F9).
- **The built apps' providers** (owner contracts, F16): Accounting's `mantle.ledger.SetupServices.get#Readiness`,
  Products' `CatalogCheckServices.validate#Catalog`, Commerce's `StoreAdminServices.check#StoreReadiness` (impl-commerce
  §7) and the Constitution's source diagnostics (the framework's `ConstitutionServices.get#Constitution` for the global
  document, Mantle's `get#OrganizationConstitution` for each organization's).
- **The settings index** (§14.2): seed rows to the built paths (F21) for Customer Service, Commerce, Products,
  Purchasing, Warehouse, Manufacturing, Accounting, Projects, Comms (P0) and Voice (BasicComms System/Voice,
  `VoiceAdmin`); Admin's entries are added by the phases that build their destinations (P7, P8, P11, P14), and Insights
  adds its own in Insights P10. CX-MAPS's entry waits for the framework's Maps configuration screen, which is not built
  (F22).
- **Screens:** Home (Attention, SetupChecks, HealthCards over `get#Overview` and `get#Readiness`); Health
  (ReadinessFind, Readiness with refresh and request refresh); SettingsHome (SettingsFind, SettingsIndex in Company /
  Applications / Instance groups).
- **Assist:** the `get#Readiness` exposure (Assistant and MCP, design §1.2) and Health's "What is failing?" prompt.
- **Specs:** BOSS `AdminRegistries` (a failing provider named while the others answer; an unreadable provider omitted;
  a refresh refused without its registration's permission; an entry hidden without its destination's permission;
  Home's one qvt render).
- **Usable when:** on the demo instance Home names the SMTP and backup warnings with their fix links; a finance reader
  with no Admin group sees Accounting's readiness only through Accounting; a Commerce store's readiness findings appear
  on Health for `admin.reader`, who opens no store; SettingsHome, reached as P0 settles, opens Warehouse's settings for
  a warehouse manager without the Admin launcher's other areas.

**Built Nov 7 (P2).**
- Records (F32): `entity/AdminEntities.xml`, mr-boss's first entity file: `ironstone.admin.ReadinessProvider` (key, version,
  owner app, title, Health group, scope, service, required permission, fix path, freshness facet: expected frequency and
  allowed lag, sequence, disabled), `RefreshOperation` (key, version, owner app, title, service, source kind and name,
  required permission, scope parameters, the provider it refreshes) and `SettingsEntry` (key, version, owner app, title,
  description, group, scope, screen path, view permission, who configures it, readiness provider), each `use="configuration"`
  with its Enumeration relationships (`AdminHealthGroup`, `AdminRegistryScope`, `AdminSettingsGroup`,
  `AdminRefreshSource`). Insights P4 extends the file.
- `ironstone.admin.RegistryServices` (over `service/ironstone/admin/Registry.js`): `get#Readiness` (each provider whose
  required permission the viewer holds, called as the viewer in its own transaction and read by its adapter; a provider
  that fails is named in `failedProviders` and shown unavailable without its diagnostics, one the viewer cannot read is
  omitted, an organization an owner refuses is left out; the freshness facet's watermark, frequency and lag, stale past the
  lag; the fix link only when the viewer opens it; the refresh registered for the check when the viewer may run it;
  narrowed by provider, owner, group, organization, refused outside the viewer's scope, and state), `request#Refresh`
  (REFRESH_UNAVAILABLE, REFRESH_DENIED without the registration's permission, RECORD_UNAVAILABLE outside the scope; the
  owner's service called with the organization, operation key, reason and only the registered scope parameters; a safe
  result), `get#Overview` (Needs attention, the worst ten non-ready checks; the four health cards with links when they
  open), `find#Settings` (an entry only when its destination screen path opens to the viewer's own groups, checked as
  authz.rs decides a path, and its view permission holds; text in the query ignoring case, app, group) and
  `check#AdminSetup` (Admin's own checks, the readiness contract). A registration naming a missing service or permission
  is logged by name when read and left out. Admin.js gains `destinationOpens` (a framework app's route by its own grant,
  a BOSS path screen by screen: ALWAYS opens below, a DENY refuses an ALLOW below it, the last screen needs its own or an
  inherited grant), `settingsIndexOnly` and the links `Operations/Health` and `Settings/SettingsHome`.
- Admin's eight providers (`data/BossSetupData.xml`, `check#AdminSetup`, `ADMIN_OVERVIEW_VIEW`): outgoing mail (the SYSTEM
  EmailServer's host), database backup (two checks: the paused job, F9, and the mirror without `sendUrl`; coverage and the
  last finished run as its watermark, daily, stale after two days), report mail (DASHBOARD_REPORT's server), report alerts
  (`ReportAlert`'s `receiveNotifications`), administrator factors (enabled members of `ADMIN` and `*_ADMIN` groups without a
  factor in date, counted), job runs (failed in the last day; late waits for F45), cluster (heartbeats older than ten
  minutes), telemetry (`get#SourceStatus` read with authorization off: loss warns, off or unsearchable is unavailable). None
  names a host, address or person.
- The built apps' providers (owner contracts, F16, F27): `accounting.setup` (`SetupServices.get#Readiness`, `ACCOUNTING_VIEW`,
  per organization: unconfigured and not activated warn, each finding fails), `products.catalogChecks` (`validate#Catalog`,
  `PRODUCT_CATALOG_VIEW`, counts only), `commerce.storeReadiness` (`check#StoreReadiness`, `ADMIN_OVERVIEW_VIEW`, each store of
  the organizations administered: the findings for a Commerce reader, the PASS summary for an administrative reader,
  F48), `constitution.global` (framework `get#Constitution`, the sources passed over counted) and
  `constitution.organization` (Mantle `get#OrganizationConstitution`, an invalid own document fails). No owner service changed.
- The settings index (F21, F44, F22): Accounting (Company), Customer Service, Commerce's CheckoutSettings, Products,
  Purchasing, Warehouse, Manufacturing's ProductionSettings, Projects, Comms › Consent (`CONTACT_ADMIN`) (Applications) and
  Voice (`system/Voice`, `VoiceAdmin`) (Instance), each owner's block in BossSetupData; no CX-MAPS entry (F22).
- F46: `BOSS_ADM_SETTINGS_INDEX` gives `BOSS_USERS` a non-inheritable `AUTHZT_ALLOW` (with `MANTLE_USER_ORG` and
  `MANTLE_PRIVATE_CONTACT`) on SettingsHome, `get#SharedContext` and `find#Settings` (F47); `get#SharedContext` answers
  such a user `{read: false, settingsIndex: true}`, their organizations and the index's link alone. The root, Home, the
  other areas, the other `ironstone.admin` services and the launcher still refuse them (AdminAccess).
- Screens: `Admin/Home.xml` (shortcuts Health, the primary, Monitoring, Settings, Agents, System, Developer tools; Attention,
  SetupChecks of Admin's own checks, HealthCards, the providers that could not be checked named); `Admin/Operations.xml`
  (Health the default); `Admin/Operations/Health.xml` (ReadinessFind: organization, area, state, owner; Readiness: state chip,
  explanation, freshness, checked time, Fix, Check again, Request refresh dialog with `requestRefresh`); `Admin/Settings.xml`
  (menu index 5, every Admin user's) with `Settings/SettingsHome.xml` (SettingsFind: text, app, group, options from the
  service; SettingsIndex with readiness links into Health). `Admin.xml`: Health's "What is failing?" `assist-prompt`.
- Assist: `AgentToolExposure` `admin_get_readiness` over `get#Readiness`, READ, `exposeAssistant` Y, `exposeMcp` Y (design
  §1.2); Health's prompt in the root's shell providers.
- Specs: `test/Admin/AdminRegistries` (4 features, 0.7 s feature time, each under 0.25 s: a failing spec provider named and
  shown unavailable while the others answer, F9's two backup warnings, a provider naming a missing service left out,
  Accounting's omitted for the reader and read by ADMIN for an organization, Retail's store summary for the reader with no
  fix link and not Services', another organization refused; a refresh refused to the reader (REFRESH_DENIED) and run by the
  operations operator, refused for Services and for an unregistered key, offered with its check to the administrator and not
  the reader; the settings index for the warehouse manager (Warehouse's, not Accounting's, Products', Commerce's, Voice or
  Consent), the reader (none), ADMIN (all), text and group search, a Projects client refused; Home's one qvt render, moved
  here from AdminAccess). `AdminAccess` gains one feature (0.4 s), a BOSS user without Admin opening SettingsHome alone (its
  one render, html), and loses its Home render; its menus gain Settings; `customerservice.read` gets the index's context.
  `AdminSpecLib.outsiders` holds the warehouse manager and finance reader, outside `users`, which AdminFoundationWalk walks.
  Acceptance, written and not run: `test/acceptance/Admin/AdminRegistriesWalk` (4 features, the "usable when" above).
- Tests run (release binary, `--nobuild`, this worktree's runtime): AdminRegistries 4 of 4, AdminAccess 7 of 7 (2.8 s),
  InsightsAccess 6 of 6, ProjectsAccess 8 of 8, AppOrganizationFilters passed. `moqui lint --screens`: 132 sites, as before,
  none in the Admin screens. Prettier clean on the new JavaScript. Health (qvt, tui, html), SettingsHome (qvt, tui) and Home
  (tui) rendered once by hand without errors, not kept. Not run: `./moq test-apps`, the acceptance suite.
- Budget: mr-boss's measured share is about 0.9 s (AdminRegistries 0.7 s, AdminAccess's new feature 0.4 s, less its moved
  Home render 0.2 s).
- Inventories: usl-inventory's `SetupServices.get#Readiness` and `CatalogCheckServices.validate#Catalog` rows implemented in
  Admin Health and Home; `check#Readiness` loses its Admin Health path (F16). No ss-inventory row.
- Design edits: design-admin §7 (the destination rule; F46's paragraph), §10 (each provider's permission; Commerce's summary),
  §13 (the settings index's grant opens nothing else), §14.2's Comms row (F44); design-commerce's readiness registration.
- Findings (provisional, numbered by the lead):
  - **F47** The root's always-actions run under the root's frame only (render.rs `render_screens`), before the target's
    grant applies, so a non-inheritable grant on SettingsHome does not reach the root's `get#SharedContext` call, and
    SettingsHome's own service calls and entity-options inherit nothing either. The grant names `get#SharedContext` and
    `find#Settings` too, `get#SharedContext` answers the index's context to a user holding that grant, and SettingsHome takes
    its options from `find#Settings` rather than an entity find. `setup#UserOrganizationInfo` needed nothing.
  - **F48** `check#StoreReadiness` needs `COMMERCE_VIEW` in the store's organization, so called as `admin.reader` it refuses,
    against the "usable when"; its anonymous PASS shape (`input.targetId`) answers each check by name and readiness without
    messages. The adapter gives a Commerce reader the findings and an administrative reader that summary, for the stores of
    the organizations it administers; no Commerce change.
  - **F49** `ADMIN` holds no `ACCOUNTING_VIEW` or `PRODUCT_CATALOG_VIEW` row; the owners read their permissions through
    ProductAccess `has`, which counts `ADMIN` for all, so the registries do too (none of their permissions is sealed).
  - **F50** No refresh operation exists to register in P2 (Insights P3 registers `index#BusinessDataset`); the spec
    registers its own. Nothing in BOSS keeps a refresh's result, so `operationKey` is passed to the owner's service, whose
    retry answers it.
  - **F51** No Tools screen edits an EmailServer, an EmailTemplate or a NotificationTopic, and none shows ClusterMember: the
    mail, report and topic fix links open Tools' entity grid (ADMIN's) until P11's MailRelays and P14's Topics, and the cluster
    check links Monitoring.
  - **F52** `get#OrganizationConstitution` refuses a reader who is neither a member nor an editor of the organization, so the
    organization Constitution check lists only the viewer's own organizations, the administrator's included.
  - **F53** Insights' DataReadiness and RefreshRequest (Insights P3, P10) call `get#Readiness` and `request#Refresh`, which
    `BOSS_ADMIN`'s `ironstone\.admin\..*` pattern authorizes for Admin users only; Insights grants its groups those two when it
    builds them.
  - **F54** AdminFoundationWalk (acceptance) walks a fixed list of areas without Settings; AdminRegistriesWalk walks the
    index. Left unchanged, so it is not rerun.
- Decisions (§4 rows added): the registry rows in BossSetupData; registration permissions as the owners read theirs;
  destinations by screen path; Home's Attention and SetupChecks; refresh identity with the owner.
- For the lead:
  - mr-boss's share about 0.9 s; no budget raised;
  - Insights P2 appends to BossSetupData too: both blocks are at the end of the file;
  - F53 for Insights P3 and P10; P11 and P14 repoint the fix links (F51); P7 adds a fix link to the organization
    Constitution check and Admin's Settings entries;
  - the acceptance AdminRegistriesWalk to run when asked.

**Review Nov 7 (P2).** Checked the BOSS diff against this section, §2, §4, §6 (F9, F16, F21, F32, F34, F35, F41–F46),
design §3, §7, §10, §13, §14 and §14.2, AGENTS.md, Practices-App-Dev and the testing skill:
- F46 grant: `BOSS_ADM_SETTINGS_INDEX` is `inheritAuthz="N"` on SettingsHome, `get#SharedContext` and `find#Settings`;
  every other Admin service (`request#Refresh`, `get#Overview`, `check#AdminSetup`, `get#Readiness`, `get#AppAccess`,
  `get#Choices`, `check#Record`, `find#ToolLinks`) refuses the warehouse manager by service authorization, the root, Home,
  Health and Monitoring refuse the render, and all are `allow-remote="false"` (no REST). SettingsHome renders for them in
  qvt, tui and html without errors (by hand, not kept), `Admin/Settings` lands on it; a PASS account and a Projects client
  are refused `find#Settings` and the screen. `get#SharedContext` gives such a user no organizations (`memberIds` is
  empty without the root, as it reads `get#PartyOrganizationInfo` only for Admin users), which the index does not use.
- `destinationOpens`/`pathOpens` against authz.rs `is_permitted` and render.rs `enter_screen` (authorization on the last
  screen only): ALWAYS beats DENY beats ALLOW on a screen; an inheritable ALWAYS opens below; a deny anywhere above stops an
  ALLOW below (`ancestor_deny`) but not an inherited inheritable non-deny; a non-inheritable grant above drops out. Every
  registered screen path and fix path is a file at that path under mr-boss's screens (none mounted from elsewhere), the
  framework routes by their app root's own grant. Not modelled, none in use: `anonymous-view` screens on a path, an
  authz record's `authzServiceName`, grants on the screens above an app root.
- Readiness: each provider by its registration's permission, `requireNewTransaction` in its own error frame, failures
  logged and shown unavailable without diagnostics, refusals omitted, an unknown state unavailable, stale only from ready.
  F48's summary is check#StoreReadiness's existing `anonymous-all` PASS shape (each check's label and ready flag, no
  messages), already open to any caller for any store id; Admin shows it only to `ADMIN_OVERVIEW_VIEW` holders for the
  stores of the organizations they administer, with no StoreDetail link unless it opens: fine for `admin.reader`.
  F49's `access.has` widens only for `ADMIN` members and refuses a Projects client; it only filters, the owner's service
  checks again, and no registration names a sealed permission.
- Registries: per-row try/catch, missing service and permission logged by name and skipped; the entity file, its
  Enumerations and relationships match Practices-App-Dev; the rows are in seed-initial BossSetupData, appended at its end.
  Admin's eight checks name no host, address or person (job names and counts only); F9's two warnings hold on a fresh
  instance. `admin_get_readiness` (READ, Assistant and MCP) returns no secret.
- Specs: AdminRegistries 4 features, each under 0.3 s; Home rendered once in qvt (AdminRegistries); lint 132 sites as
  before, none in the Admin screens.
- Fixes: **R1** (medium, security) `request#Refresh` passed `scopeParameters.organizationPartyId` to the owner unchecked
  when a registration listed it, so an operator could name another organization past the scope check; the organization
  is checked wherever the request names it and the organization, operation key and reason never pass as scope parameters;
  AdminRegistries covers it (failed before the fix) (mr-boss 58c32f90). **R2** (low) a provider failing for one
  organization or store showed its unavailable row but was missing from `failedProviders`, so Home and Health did not name
  it; the comment on `organizationsOf` said a caller without the Admin root covers their own organizations, where it covers
  none (mr-boss de1c4da5). **R3** (low, docs) design §10 and §14.2 still called `check#StoreReadiness` proposed
  (mr-boss 4964f16b).
- Tests run (release binary, `--nobuild`, this worktree's runtime): AdminRegistries, AdminAccess, InsightsAccess,
  ProjectsAccess and AppOrganizationFilters 32 of 32; `moqui lint --screens` clean as above; Prettier clean on the changed
  JavaScript. Not run: `./moq test-apps`, the acceptance AdminRegistriesWalk.
- For the lead:
  - Home reads Admin's checks twice (get#Overview's readiness and SetupChecks' own get#Readiness); fine at eight checks,
    worth one call when Home grows;
  - F53: a caller Insights grants `get#Readiness` without the Admin root gets no organization-scoped checks
    (`organizationsOf` answers none), so Insights P3 needs the viewer's organizations passed or a scope rule of its own;
  - the refusal heuristic (`refusalText`, "is not available" among them) omits rather than names an owner failure worded
    that way; owners should answer reason codes;
  - the earlier items stand (F51's fix links, the acceptance walk to run when asked, no budget raised).

- **Wave 3 suites (Nov 7, on master after Admin P2 and Insights P2 merged and the release binary rebuilt; the Admin P3
  reviewer and the Insights P3 worker ran and built at the same time, load average about 7):** `./moq test-framework`:
  every feature passed; cargo failed only F38's known test (impl-admin); the framework's server specs (15.9 of 12 s),
  webroot's client (50.5 of 44 s) and basic-comms' client (7.2 of 7 s) over budget under the load (Wave 1 had the
  framework at 9.7 s; P2's ReportMounts adds 0.1 s), to be measured on a quiet run before any raise. Standalone mr-mantle
  1,902 passed, 2 failed (the baseline WorkTimeEntries and WorkTimesheets), 11 skipped. `mail_capture_sends=true ./moq
  test-apps` 3,331 server and 18 client features passed, none failed; mr-mantle 389.1 of 393 s, mr-boss 223.4 of 264 s
  server and 53.1 of 57 s client (InsightsDashboardsWalk 3.0 s), mr-pass within budget. `moqui lint --screens` 132 sites.
  No budget raised.

### P3 — Groups and grants

Design §5 Groups and GroupDetail; ADM-ACCESS (AccessServices, the administration path, the capability registry).

- **Framework `org.moqui.admin.AccessServices`** (design §17.2): `find#Groups`, `create#Group` (a custom group that is
  never privileged), `store#Group` (description, purpose, `requireAuthcFactor`, `ipAllowed`), `store#Membership` and
  `end#Membership` (dated UserGroupMember rows), `preview#Grants` and `apply#Grants` (UserGroupPermission rows and
  registered artifact bindings) and `store#GroupPreference`. Each rechecks delegation and the revision, goes through the
  EECAs, records before and after in the audit log (F23), and clears the authorization caches across the cluster.
- **`org.moqui.admin.IdentityServices.check#AdministrationPath`**, called by every grant, membership, group-flag and
  (later) provider, factor and lifecycle change (P0's definition).
- **The capability registry** (§4): a framework seed record, filled by BossSetupData from crosscut §1.4's rows for the
  built apps (app, group, permissions, view / edit / export / sensitive, delegable by), which `apply#Grants` and
  `store#Membership` take as the registered bundles; Insights' rows are among them, its groups created in Insights P1.
  The Capabilities matrix is P9.
- **Screens:** Groups (GroupFind, GroupList with the privileged and sealed markers read from the effective lists,
  CreateGroup); GroupDetail (GroupProfile, GroupMembers, GroupCapabilities with its effective-change preview,
  GroupPreferences); GroupDetail's Assist prompt.
- **Specs:** framework `AdminAccessServices` (a sealed grant refused to a non-holder; a privileged membership refused to
  a non-member; an unregistered bundle refused; the last administration path refused; caches cleared); BOSS
  `AdminGroups` (GroupDetail's one qvt render; a delegated member change within the bundle).
- **Usable when** (design §15.3 "Escalation through grants" and "Last administration path"): `admin.access` adds a
  user to a registered Purchasing group from a date and ends it later, and is refused `BOSS_ADMIN_BACKUP` with the
  reason shown; removing the last factor-meeting member of `ADMIN` is refused; a permitted change shows before and
  after in the audit log and holds on the member's next request.

**Built Nov 7 (P3).**
- Framework (mr-moqui):
  - `org.moqui.admin.AccessServices` (`service/org/moqui/admin/AccessServices.xml`, bodies `Access.js`): `find#Groups`, `get#Group`
    (added: GroupDetail's one read, with `includeOptions` the registered bundles a grant may come from), `create#Group`, `store#Group`,
    `store#Membership`, `end#Membership`, `preview#Grants`, `apply#Grants`, `store#GroupPreference`. Reads need `ADMIN_ACCESS_VIEW`,
    changes the sealed `ADMIN_ACCESS_MANAGE` (`ec.user.hasPermission`). Each change rechecks delegation and answers a refusal as a reason
    (`applied` false, `reasonCode`, `reason`), never written: `UNREGISTERED_BUNDLE` (a membership outside a registered bundle or a custom
    group), `UNREGISTERED_GRANT` (a permission or binding no registered bundle the actor may assign offers), `SEALED_PERMISSION` (a sealed
    grant added or ended by a non-holder, or a membership in a group that grants one, F57), `PRIVILEGED_GROUP` (a privileged group or
    its members changed by a non-member, a custom group named after one), `NOT_DELEGABLE`, `GROUP_EXISTS`, `MEMBERSHIP_EXISTS`,
    `REVISION_CHANGED` (a row's or group's `lastUpdatedStamp`; for grants the grant revision `preview#Grants` gives) and
    `ADMINISTRATION_PATH`; a missing permission or a malformed request is an error. Writes go through the entity facade with authorization
    on, so the sealed-permission and privileged-group EECAs decide each row (F56) and the authorization caches move here and on every
    live cluster member (F59). Memberships and grants are ended, never deleted; a registered artifact binding is added with its bundle's
    filter sets and removed only when registered (never a deny), with an explicit audit row (F60). `apply#Grants` applies the previewed
    change as one (§4).
  - `org.moqui.admin.IdentityServices.check#AdministrationPath` (`IdentityServices.xml`, `Identity.js`): F41's definition as built (F55):
    at least one date-valid member of `ADMIN`, not permanently disabled or terminated, with a password or an external identity and an
    enabled sign-in flow, a date-valid validated factor where any of its groups requires one, admitted by its own and its groups'
    `ipAllowed` from the caller's address; now and at each later date the change names; counted with authorization off; a change on an
    instance with no path is not refused for it. Every membership, group-flag and grant change calls it; the answer is a reason.
  - The capability registry (`SecurityEntities.xml`): `moqui.security.CapabilityBundle` (group, app, description, delegable permission,
    scope dependency, sequence, disabled), `CapabilityBundlePermission` (kind: `CapabilityKind` view, edit, export, sensitive) and
    `CapabilityBundleArtifact` (artifact group, type, action, filter sets). A row naming a missing group is logged and left out.
  - F23's audit log: `UserGroupMember`'s and `UserGroupPermission`'s dates (`fromDate` on create, `thruDate` always), `ArtifactAuthz`'s
    `authzTypeEnumId`, `UserGroup`'s `requireAuthcFactor` and `ipAllowed`, and `UserGroupPreference`'s value; the services pass the reason
    as `{field}_changeReason`.
  - `SecurityTypeData.xml`: `AdminAccessServices` (the two families, `ALL_USERS`, an inheritable ALLOW); the custom-group purposes
    `UgtCustomTeam`, `UgtCustomRole`, `UgtCustomProject` (`UserGroupType` with `optionIndicator` Y, F58).
  - Rust (moqui-core): `UserSecurityChecks.privilegedGroups()` and `sealedPermissions()` (`ec_extra.rs`, over `security_checks.rs`'
    `privileged_groups`/`sealed_permissions`, now `pub(crate)`), the effective lists for markers and reasons; cargo:
    `a_group_and_a_permission_a_conf_adds_by_element_are_guarded_beside_the_defaults` checks the lists with a conf's elements,
    `encode_html_is_null_safe` the binding.
  - Docs: Attack-Surface (the access services, their refusals, the path, the audit log); Remaining-Work's `org.moqui.admin` row.
- BOSS:
  - `data/BossSetupData.xml` (appended): `BOSS_ADM_ACCESS` (the Access area: denies `BOSS_ADMIN`, ALWAYS for `BOSS_ADMIN_ACCESS` and
    `BOSS_ADMIN_ADMIN` with the root's filter sets); the capability rows of the built apps from crosscut §1.4 (105 bundles: Commons and
    Comms, Customer Service, Commerce, Products, Purchasing, Warehouse, Manufacturing, Accounting, Projects, Insights, Admin), each with the
    permissions its group holds and, for an app's root user group, its launcher binding (Commerce's with `COMMERCE_STORE`, Accounting's on
    `BOSS_ACCOUNTING_ACCESS`); left out the unbuilt apps' groups, `BOSS_PROJECT_CLIENT` and the service teams.
  - `data/BossUsersDemoData.xml`: `BOSS_ADMIN_DEMO_DELEGATE` a custom group (`UgtCustomRole`) with the Access area (appended).
  - `Admin.js`: the `access` area; record kinds `group` (instance-wide, `accessView`) and `member` (a user an access administrator reads in
    the organizations administered); the `members` choice; the palette's groups (`searchFinds`, a kind searched only for its capability's
    holder); `get#MemberScope` (`ContextServices`); links `Access/Groups`, `Access/GroupDetail`.
  - Screens: `Admin/Access.xml` (menu index 3); `Access/Groups.xml` (GroupFind, GroupList with the privileged and sealed markers,
    CreateGroup); `Access/GroupDetail.xml` (header with markers; GroupProfile; GroupMembers in scope, others counted; Capabilities with the
    grant dialog, the effective-change preview and Apply at its revision, End per grant and registered binding; GroupPreferences).
    `Admin.xml`: GroupDetail's "What can members do?" `assist-prompt` and the palette source.
- Specs: framework `test/AdminAccessServices` (6 features, 0.62 s in the full framework run on Debug: a custom group never privileged and
  the markers; grants only from a registered bundle, a sealed one only by its holder (john.doe grants and ends it), a stale preview
  refused; memberships only in registered bundles and custom groups, a privileged one only by a member, a sealed-carrying one only by a
  holder, ended and kept with audit rows; the last administration path refused (`ADMIN`'s factor flag; every `ADMIN` membership ended) and
  a non-member refused `ADMIN`; a membership change seen at once by the session it changes; group flags, preferences, revisions and the
  audit log). BOSS `test/Admin/AdminGroups` (2 features, 0.64 s: GroupDetail's one qvt render with a bundle grant's preview; admin.delegate
  adds a Retail member to `BOSS_PURCHASING_BUYER` through GroupDetail's transition and ends it, refused a Services user and
  `BOSS_ADMIN_BACKUP` with its reason). `AdminAccess` (the new access rule): the Access area in the administrator's and ADMIN's menus and
  the `access` capability of `admin.access`, `admin.delegate` and the administrator. Acceptance, written and not run:
  `test/acceptance/Admin/AdminGroupsWalk` (3 features, the "usable when").
- Tests run (Debug binary, `--nobuild`, unless noted): AdminAccessServices 6 of 6; the framework and tools server suites 275 of 275 (time
  over budget on Debug, below); AdminGroups, AdminAccess, AdminRegistries 13 of 13; InsightsAccess 6 of 6; ProjectsAccess and
  AppOrganizationFilters 15 of 15 on the main checkout's release binary with this runtime (F37); cargo moqui-core `service::eca`,
  `script::runtime::ec_extra`, `service::security_checks` 24 of 24, clippy moqui-core (lib and tests) clean. Groups (qvt, tui, html) and GroupDetail (tui, html; the delegate on a
  privileged group in qvt) rendered once by hand, no errors, not kept; the reader is refused Groups. `moqui lint --screens` (Debug): 132
  flagged sites as before, none in the Admin screens. Prettier clean on the JavaScript; rustfmt on the touched Rust. Not run:
  `./moq test-apps`, `./moq test-framework`, the acceptance suite.
- Inventories: no ss-inventory or usl-inventory row is implemented by P3 (the forms derive from Tools screens, outside both).
- Design edits: design-admin §1.1 (the path as built), §5 Groups and GroupDetail (as built: purposes, members in scope, the sealed
  membership rule, grants from bundles, preference keys, the area), §14's capability description and §17.2's AccessServices; crosscut
  §1.4 (the registry holds its rows).
- Findings (provisional, numbered by the lead):
  - **F55** F41 counts "a member of `ADMIN` or a group with ALWAYS on the Admin root"; the framework cannot name a BOSS screen, and after
    F34 no BOSS group holds ALWAYS on the root (`BOSS_ADMIN_ADMIN` is ALLOW) and none repairs `ADMIN`. The path counts `ADMIN` members.
  - **F56** The sealed-permission and privileged-group EECAs pass any write with authorization disabled, and the `BOSS_ADMIN_*` groups have
    no entity authorization for the security records (§2). The services are granted to `ALL_USERS` by an inheritable ALLOW and check their
    permission themselves; their entity writes inherit it with authorization on, so the EECAs fire. A caller that disables authorization
    skips them, as a data load does.
  - **F57** A group that grants a sealed permission is not privileged, so with only the EECAs a holder of `ADMIN_ACCESS_MANAGE` could give a
    membership in a custom group an instance administrator granted, say, `ADMIN_BACKUP_DOWNLOAD`, smuggling it. AccessServices refuses such
    a membership to a non-holder; the framework EECAs do not, so Tools or a direct entity write by an entity-authorized writer still can.
    For the framework: a `UserGroupMember` EECA check of the group's sealed grants.
  - **F58** `UserGroup` has no purpose field. A registered purpose is a `UserGroupType` Enumeration with `optionIndicator` Y, and a group
    of one is a custom group.
  - **F59** Writes of `UserGroupMember`, `ArtifactAuthz` and the filter tables already move the authorization generation at once and on
    commit (`authz.rs` `note_entity_write`) and post a cluster invalidation to the live peers; `UserGroupPermission` is read uncached by
    `has_permission`. No explicit clear is needed; the spec shows a session sees its own membership change in the same request.
  - **F60** The audit log keeps no delete, and `ArtifactAuthz` has no dates: a removed binding, and a removed group default, get an explicit
    `EntityAuditLog` row (the type or value before, none after).
  - **F61** The brief named the reader for the Access area; design §1.1 gives the reader `ADMIN_OVERVIEW_VIEW` alone and §2 Groups to the
    access administrator (A). The area opens to `BOSS_ADMIN_ACCESS` and `BOSS_ADMIN_ADMIN` (and the demo delegate's group), not the reader.
  - **F62** With the dates audit-logged, loading the demo writes an audit row for each `UserGroupMember` and `UserGroupPermission` it
    creates (about 1,500 in mr-boss's demo); the load time was not measured apart.
- Decisions (§4 rows added): the path through `ADMIN`; refusals as reasons; a grant change applied as one; the registry rows; ending any
  group's membership; the Access area; members in scope; preference keys.
- For the lead:
  - budget shares: framework server about 0.6 s (AdminAccessServices, Debug); mr-boss server about 0.7 s (AdminGroups 0.64 s, AdminAccess's
    added checks negligible); no client spec;
  - on Debug the framework server suite ran 17.9 s of 12 s and tools 7.5 s of 3 s (both inflated by the debug build; Wave 1's release run was
    9.7 s and 2.6 s); a release run decides the budgets;
  - F57 for the framework (a `UserGroupMember` EECA on sealed grants);
  - Insights P2 appends to BossSetupData too: P3's block is at the end of the file (after the settings index rows);
  - `rustfmt` on `service/mod.rs` reorders its pre-existing module list and reformats `http_fixtures.rs` and `shell.rs`; left unformatted;
  - the acceptance AdminGroupsWalk to run when asked.

**Review Nov 7 (P3).**
- Checked: AccessServices and check#AdministrationPath line by line (every entry point checks `ADMIN_ACCESS_VIEW`/`MANAGE` as its first
  statement, before any read or write; delegation, `NOT_DELEGABLE`, sealed and privileged refusals, revisions, dated rows ended never
  deleted, the audit rows and reasons); the EECAs and `security_checks.rs`; `AdminAccessServices` (`ALL_USERS`, inheritable ALLOW);
  REST exposure; F41 as built (F55) at future dates; organization scope (GroupDetail's members, `get#MemberScope`, `check#Record` on
  `addMember` and `endMember`); the 105 capability rows against crosscut §1.4; the specs, the lint and the docs.
- Fixes:
  - **R1 (High, F57; mr-moqui 2942bd04)** A membership in a group that grants a sealed permission passed the grant on through Tools or
    a direct entity write. New framework EECA `UserGroupMemberSealed` (`Security.eecas.xml`, beside `UserGroupMemberPrivileged`;
    `assert_sealed_group_membership` in `security_checks.rs`, `UserSecurityChecks.assertSealedGroupMembership`): a create or update of a
    `UserGroupMember` in a group with a sealed grant not ended (open or starting later) needs a holder of each such permission; an update
    that only ends the membership sooner passes (the rule reads the stored row, `get-original-value`), so `end#Membership` and offboarding
    stay open to any access administrator; authorization disabled (a load) passes as before; it runs while the message facade has errors.
    The converse, a sealed grant to a group with members, stays `UserGroupPermissionSealed`. Cargo:
    `a_membership_in_a_group_granting_a_sealed_permission_needs_its_holder` (refused; an ended grant not carried; ending passes, reopening
    refused; a holder gives it) and `a_membership_ends_sooner_only_by_an_update_to_an_earlier_set_end`.
  - **R2 (Medium; mr-moqui 2942bd04)** A registered privileged group's bundle was delegable by `ADMIN_ACCESS_MANAGE` alone, so a non-member
    could grant `BOSS_ADMIN_BACKUP`'s `ADMIN_BACKUP_RUN`, or (as a holder) `BOSS_ADMIN_ACCESS`'s `ADMIN_ACCESS_MANAGE`, to a custom group
    and join it: the privileged group without its membership rule. `Access.js` `delegable` now counts a privileged group's bundle only for
    a member of it (grants, the grant dialog's options, `NOT_DELEGABLE`); `AdminAccessServices` checks a non-member is refused a
    permission only `ADMIN_ADV`'s bundle offers. Attack-Surface and design §1.1, §5 say so.
- Assessed, no change:
  - F56: the inheritable `ALL_USERS` ALLOW reaches only the ten named services' own call trees; each refuses without its permission
    before touching a row, all are `allow-remote="false"`, no REST file names them, and their bodies call no caller-named service or
    entity. No framework group could replace `ALL_USERS` (an installation's own groups hold the permissions), so it stays.
  - F55: counting `ADMIN` alone is right. A BOSS administrator can still lock the BOSS groups out of Admin (the last
    `BOSS_ADMIN_ADMIN` member ending their own membership), which `ADMIN` repairs in Tools System; a BOSS administrator cannot end an
    `ADMIN` membership (privileged) and every group-flag or membership change reaching an `ADMIN` member is path-checked, now and at the
    dates it names. Acceptable.
  - F61: agreed; the reader holds `ADMIN_OVERVIEW_VIEW` alone (design §1.1).
  - Organization scope holds: `get#Group` returns every member to the screen's actions, which show only those `get#MemberScope` admits;
    both transitions check the member as an Admin record with `accessManage` first (AdminGroups covers the Services user refused).
  - The registry's 105 bundles are crosscut §1.4's built apps (Maintenance, People and Sales left out, unbuilt) plus the built apps'
    existing groups; no bundle offers a sealed permission to a non-holder or, after R2, a privileged group's powers to a non-member.
- Tests (Debug, `--nobuild`, unless noted): cargo moqui-core `service::eca`, `service::security_checks`, `script::runtime::ec_extra` 26
  of 26; clippy moqui-core (lib and tests) clean; rustfmt on the touched Rust, Prettier on the touched JavaScript. AdminAccessServices 6 of
  6; framework, tools and basic-comms server suites 327 of 342 passed, 12 skipped, 3 failed in basic-comms (`BasicCommsChat`,
  `BasicCommsComposeRef`, `BasicCommsSync`: F37's "Maximum call stack size exceeded" on Debug, not this change); AdminGroups, AdminAccess,
  AdminRegistries, InsightsAccess 19 of 19; ProjectsAccess and AppOrganizationFilters 15 of 15 on the main checkout's release binary with
  this runtime and the new EECA left out for the run (that binary has no `assertSealedGroupMembership`, so with it every membership write,
  data load included, fails "not a function"). `moqui lint --screens`: 132 flagged sites as before, none in the Access screens.
- For the lead:
  - the unsealed Admin bundles (`BOSS_ADMIN_IDENTITY`, `_CONFIGURE`, `_INTEGRATIONS`, `_OPERATIONS`, `_DATA`, `_AUDIT`, `_PRIVACY`) name
    no `delegablePermissionId`, so any access administrator (the demo delegate included) may add themselves to them or grant their
    permissions to a custom group. Design §1.1 lets the access administrator assign registered bundles, so it is left; if it is not
    meant, give each its own `*_MANAGE` as the delegable permission (only `BOSS_ADMIN_ADMIN` holds them all);
  - the framework binary and `Security.eecas.xml` ship together: an older binary with this runtime fails every `UserGroupMember` write;
  - `UserGroupMemberSealed` reads the stored row on each `UserGroupMember` update (one primary-key read);
  - budget shares unchanged in kind: framework server 0.5 s (AdminAccessServices), mr-boss about 0.4 s (AdminGroups); framework 13.6 s of
    12 s and tools 6.1 s of 3 s on Debug, as before; `./moq test-framework` not run.

- **Wave 4 suites (Nov 7, on master after Admin P3 and Insights P3 merged and the release binary rebuilt; the Admin P4
  reviewer and the Insights P4 worker ran at the same time):** `./moq test-framework`: every spec feature passed; cargo
  failed F38's known test and `loader_filters_types_holds_services_and_reads_zip` (the EntityAuditLog sequence on the
  test's empty driver, from Admin P3's audit log on UserGroupPermission); framework 10.7 of 12 s, webroot's client 46.4 of
  44 s under the load. Standalone mr-mantle 1,906 passed, 3 failed: the baseline two and SitePages' scheduled publication
  (`update#UserGroupPermission` with `fromDate: 0` on Postgres, the same audit log's read of the epoch key); a framework
  follow-up fixes both. `mail_capture_sends=true ./moq test-apps` 3,341 server features passed, 2 failed: SitePages as
  above and ProjectsAccess (Insights P3's `refresh#DatasetIndex` verb not in the client deny pattern; `refresh` added,
  mr-boss 7fc702b6); 18 client features passed. mr-mantle 407.6 of 393 s and mr-boss 261.6 of 264 s server under the two
  agents' load (Wave 2: 344.5 and 197.3 s), mr-boss client 52.3 of 57 s; measured on a quiet run before any raise.
  `moqui lint --screens` 132 sites.

### P4 — Users and sessions

Design §4.1, §4 Users, UserDetail (Account, Access, Credentials, Sessions/history) and Sessions; ADM-LIFECYCLE (the
identity and session parts).

- **Mantle `mantle.party.IdentityServices`** (design §17.2): `find#Users` (the users with a current relationship to an
  organization the caller administers; public identities only under explicit account authority, labelled as site
  relationships), `get#Account`, `get#AccountHistory` (UserLoginHistory, Visit and audit rows),
  `store#OrganizationMembership` (dated PartyRelationship rows to an internal organization, the `RepVendor`
  representative among them; here rather than P7 because a staff account and an accepted invitation each write one),
  `create#StaffAccount` (over `PartyServices.create#PartyUserAccount`, with its organization membership and the grant
  proposal BOSS supplies, F11) and `reset#Authentication` (scope, and `ADMIN_IDENTITY_GLOBAL` for an account-wide
  change of a shared identity; over `reset#Password` and `invalidate#UserAuthcFactorEntry`).
- **Framework `org.moqui.admin.IdentityServices`**: `find#Sessions` and `revoke#Sessions` over HttpSession and Visit,
  self-scoped or for a target under identity authority, ending the sessions everywhere P0 found they reach;
  `revoke#AccountAccess`, which revokes another user's sessions, login keys, access tokens, app passwords, device keys
  and SSH keys (UserServices' key services act only on the caller, F3); and the per-request session refresh checking
  `disabled` and `terminateDate` as login does (F4, F6).
- **Commons Account** (owner contract): "Where you are signed in" reads `find#Sessions` and gains Sign out for another
  session (F17).
- **Login as and tarpit release** on UserDetail use the existing guarded framework actions (`ADMIN_LOGIN_AS`, named
  confirmation, the impersonation indicator); setting another user's password stays `ADMIN_PASSWORD`'s.
- **Screens:** Users (UserFind, UserList, NewStaffAccount as the exception to invitations); UserDetail with the record
  header and the tabs Account, Access (Memberships through P3's services), Credentials (Authentication,
  AccessCredentials), Sessions/history (AccountHistory and the account's sessions); Sessions (SessionFind,
  SessionList with bulk revoke). The palette's users source.
- **Assist:** the `find#Users` exposure (Assistant Y, MCP N), the `reset-factor` skill, UserDetail's "Why can't this
  user sign in?" prompt and the root's "Log as note" response action.
- **Specs:** Mantle `test/party/StaffIdentity` (an ORG_ZIZI_RETAIL operator finds its users and not a user of
  ORG_ZIZI_SERVICES only; the shared identity's account-wide change refused without `ADMIN_IDENTITY_GLOBAL`; a reset
  sends `reset#Password` and sets no password; a membership dated and ended, never deleted); framework `AdminSessions`
  (a revoked session refused on its next request; a disabled account's live session ended; self scope); BOSS
  `AdminUsers` (UserDetail's one qvt render); the golden walk `AdminUsersWalk` (find a user, end a membership, revoke a
  session).
- **Usable when** (design §15.3 "Delegated administration", its account half): the ORG_ZIZI_RETAIL operator resets the
  shared identity's factor only for its own relationship, is refused disabling it globally, and cannot open an
  ORG_ZIZI_SERVICES-only user; a revoked session's next request goes to the login screen; Commons Account signs out the
  user's other browser.

**Built Nov 7 (P4).**
- Framework (mr-moqui):
  - `org.moqui.admin.IdentityServices` (`IdentityServices.xml`, `Identity.js`): `find#Sessions` (an account's visits, live ones those with a
    web session, each named by its visit with a client summary, address, place, state and current flag, never a cookie, token, user
    agent or contents; the caller's own with no permission, another's, a list of users' or all with `ADMIN_IDENTITY_VIEW`),
    `revoke#Sessions` (by visit, or every other session; the caller's own but the current one, another user's with
    `ADMIN_IDENTITY_MANAGE`; a visit of another account is refused and counted), `get#AccountCredentials` (added: factors and
    credentials, metadata only) and `revoke#AccountAccess` (another user's sessions on every server and `hasLoggedOut`, login keys,
    app passwords, SSH keys, SIP phones, the agent triggers that run as the user paused with their cron jobs, the user's open agent
    runs asked to cancel; or one credential; each kind on its own, a failure named; the account stays enabled; `ADMIN_IDENTITY_MANAGE`,
    the caller scoping the target and asking for `ADMIN_IDENTITY_GLOBAL` where shared). `check#AdministrationPath` takes
    `endedFactorIds` and an account's `ipAllowed`. All under `AdminAccessServices`' `ALL_USERS` grant.
  - `AccessServices.check#GrantProposal` and `apply#GrantProposal` (added, §4's grant proposal): registered bundles only, by
    `store#Membership`'s delegation rules for the actor, applied with authorization on, refused whole; `ADMIN_ACCESS_MANAGE` or
    `ADMIN_IDENTITY_MANAGE` to apply.
  - Rust (moqui-core, moqui-host): `user::end_user_sessions` (a user's sessions by visit or all, retiring live copies and publishing
    the session end to the cluster, keeping the caller's own; `end_user_visit` now shares it) bound as
    `UserSecurityChecks.endUserSessions`; `login::account_closed`, `user_account_closed`, `username_account_closed` (disabled with no
    `disabledDateTime`, or past `terminateDate`); the per-request session refresh clears such a login (F4, F6); notws's 60 s
    session check refuses such an account (F42); `run_job` records a refusal and does not run a job whose run-as user is closed or
    gone (F42). SipDevices.js `revokeUserDevices`.
  - F23: `UserAccount.ipAllowed` and `requirePasswordChange` audit-logged (`true`, F67).
  - Docs: Attack-Surface (sessions, credentials, the refresh, jobs, grant proposals), Remaining-Work's `org.moqui.admin` row.
- Mantle: `mantle.party.IdentityServices` (`IdentityServices.xml`, `Identity.js`; `ALL_USERS` grant `MantleIdentityServices` in
  PartyAccessData): `find#Users`, `get#Account`, `get#AccountHistory` (sign-ins and the audit log of the account, its memberships and
  the organization relationships in scope, dates shown as times), `store#OrganizationMembership`, `create#StaffAccount`, `store#Account`
  (added, F68) and `reset#Authentication` (`resetKind` password, factor, lock; F66, F70). Scope: the internal organizations
  the caller's party works for, every one for `ADMIN` (F65). `PartyRelationship.thruDate` audit-logged (F67).
- BOSS:
  - `Admin.js`: the `users` area; links `Users/Users`, `Users/UserDetail`, `Users/Sessions`; the user record kind's destination; the
    palette's users (`searchFinds`, the staff of the organizations administered); the `bundles` choice (registered bundles the user may
    assign, through `check#GrantProposal`, `BOSS_USERS` first); `check#Record` with `accountWide` (IDENTITY_GLOBAL for a shared
    identity) and `loginAs` (ADMIN_LOGIN_AS, refused for a target holding a privileged membership or sealed permission the caller lacks).
  - Screens: `Admin/Users.xml` (menu index 2, `BOSS_ADM_USERS`: the identity operator and the administrator); `Users/Users.xml` (UserFind,
    UserList, NewStaffAccount); `Users/UserDetail.xml` (record header with state chips and Login as; Account, Organizations, Access,
    Credentials, Sessions and history boxes); `Users/Sessions.xml` (SessionFind, SessionList with bulk revoke); `Admin/LogNote.xml`;
    Home's Users shortcut. `Admin.xml`: UserDetail's "Why can't this user sign in?" prompt, the root's "Log as note" response action,
    the palette source "Admin users and groups".
  - Commons Account (owner contract, F17): "Where you are signed in" reads `find#Sessions` and signs another session out.
  - Projects Settings › Index links `Admin/Users/Users` (F36).
  - `data/BossSetupData.xml` (appended): `BOSS_ADM_USERS`; `AgentToolExposure` `admin_find_users` (Assistant Y, MCP N). `skill/reset-factor.md`.
- Specs: framework `test/AdminSessions` (3 features, 0.1 s); Mantle `test/party/StaffIdentity` (5 features, 0.8 s); BOSS `test/Admin/AdminUsers`
  (2 features, 0.5 s: UserDetail's one qvt render; the Retail operator signs a Retail user out, refused the shared identity's session,
  a Services identity and Login as), `AdminAccess` (the Users area in the identity operator's, administrator's and ADMIN's menus),
  `CommonsSettings` (one feature, 0.07 s: my other session signed out, another user's not), `test/Admin/AdminClientFixtures` and the
  golden walk `test/client/Admin/AdminUsersWalk` (3.1 s on Debug: find a user, end a membership, sign a session out), registered in
  `test/client/suite.js`. Cargo (moqui-core): `every_session_of_a_user_ends_and_a_disabled_account_signs_out`. Acceptance, written and not
  run: `test/acceptance/Admin/AdminUsersUsable` (2 features, the "usable when").
- Tests run (Debug, `--nobuild`, unless noted): AdminSessions, AdminAccessServices, RecentAuth, SipDevice 21 of 21; StaffIdentity,
  PartyServices, PartyAccounts 18 of 18; AdminGroups, AdminRegistries, AdminUsers, AdminAccess, AdminClientFixtures, InsightsAccess 22 of
  22; CommonsSettings 9 of 9; AdminUsersWalk 1 of 1; ProjectsAccess and AppOrganizationFilters 15 of 15 on the main checkout's release
  binary with this runtime (F37); cargo moqui-core `user::`, `service::jobs`, `script::runtime::ec_extra` 113 of 113 and moqui-host `notws` 3 of 3, clippy moqui-core and moqui-host (lib) clean, rustfmt on the touched Rust;
  `moqui lint --screens` 132 flagged sites, as before. Prettier clean on the changed JavaScript. Not run: `./moq test-apps`,
  `./moq test-framework`, the acceptance suite.
- Inventories: ss-inventory EditParty CreateUserAccount (Users), UpdateUserAccount, AddGroupForm, GroupsForm (UserDetail).
- Design edits: design-admin §4.1 (scope and the account-wide rule as built), §4 Users, UserDetail, Sessions (as built), §1.2 (the
  skill and exposure), §17.2 (store#Account, get#AccountCredentials, grant proposals); design-drawers-commons Account's Sessions row.
- Findings (provisional, numbered by the lead):
  - **F65** Mantle cannot see Admin's unrestricted scope (the administrator's `MANTLE_ACTIVE_ORG` root grant): Mantle's identity
    scope is the caller's own internal organizations (every one for `ADMIN`), so `admin.admin` sees Retail's staff in Users while
    Admin's context (GroupDetail, choices) offers every organization. A permission for "every organization" (or `ADMIN_IDENTITY_GLOBAL`
    meaning it) is the lead's call.
  - **F66** "Resets the shared identity's factor only for its own relationship": a factor is account-wide. Built: a password reset
    request (the change-only reset password; nothing changes until its owner acts) is sent for any identity in scope; a factor or
    lock reset, account fields and revoking sessions or credentials of a shared identity need `ADMIN_IDENTITY_GLOBAL`.
  - **F67** `enable-audit-log="update"` skips a first value (Purchasing's F57), so `ipAllowed`, `requirePasswordChange` and
    `PartyRelationship.thruDate` (newly audited, for ended organization memberships) use `true`; every PartyRelationship created with
    an end or ended now writes an audit row.
  - **F68** `update#PartyUserAccount` takes every UserAccount field (disabled, terminateDate, ...); UserDetail's Account goes through
    the new `store#Account` (its fields only, scope, revision, path) rather than calling it with the operator's authority.
  - **F69** The framework has no impersonation indicator: Tools' Login as replaces the session's user. UserDetail's Login as is the
    same guarded action (`ADMIN_LOGIN_AS`, which no BOSS group holds, ADMIN_ADV's), a named confirmation and a log line, refusing a
    target in a privileged group or holding a sealed permission the caller lacks. The indicator is the framework's later work.
  - **F70** Tarpit release in Tools is the entity-auto update (ADMIN's); built as `reset#Authentication` `lock`: the failed-login lock and
    the artifact velocity locks, never a permanent disable.
  - **F71** The session refresh and notws end live sessions of an account disabled for good or past its end date, not of a tarpit lock
    (disabled with a time), so failed logins by someone else cannot sign the owner out; login still refuses during the lock.
  - **F72** Ending another user's session is treated as account-wide: a shared identity's sessions need `ADMIN_IDENTITY_GLOBAL`.
  - **F73** The framework knows no organization: `apply#GrantProposal` and `revoke#AccountAccess` accept any account from a holder of
    `ADMIN_IDENTITY_MANAGE` (as `store#Membership` does from `ADMIN_ACCESS_MANAGE`); none is remote, and BOSS and Mantle scope first. With
    grant proposals an identity operator can now give a new staff account the unsealed Admin bundles (F64 widens to the identity operator).
  - **F74** The Users area is the identity operator's and the administrator's; UserDetail's group memberships change only for an
    `ADMIN_ACCESS_MANAGE` holder (the identity operator reads them), the access administrator keeping GroupDetail.
  - **F75** "Log as note" files a Chatter note on a UserAccount or UserGroup (a generic CommunicationEventRecord); those entities have no
    entity filter, so who reads the note is who opens that record's Chatter. Worth the review's look.
  - **F76** AdminClientFixtures runs in the regular mr-boss suite too, as InsightsClientFixtures does, adding the Retail identity
    "Walk Staff" with a session.
- Decisions (§4 rows added): identity scope in Mantle; the account-wide rule; the reset request; `store#Account`; grant proposals through
  the framework; the Users area; tarpit locks and sessions.
- For the lead:
  - budget shares: framework server about 0.1 s (AdminSessions); mr-mantle about 0.8 s (StaffIdentity); mr-boss server about 0.6 s (AdminUsers
    0.5 s, CommonsSettings' feature, AdminClientFixtures); mr-boss client about 3.1 s (AdminUsersWalk, Debug); no budget raised;
  - F65 and F64 (now reaching the identity operator) are the user's calls;
  - the Rust changes (session end, refresh, notws, jobs) need the release binary rebuilt before the merge runs the suites; a binary
    without `endUserSessions` fails `revoke#Sessions` and `revoke#AccountAccess`;
  - BossSetupData and BossUsersDemoData: P4's block is appended at the end of BossSetupData; BossUsersDemoData unchanged;
  - the acceptance AdminUsersUsable to run when asked.

**Review Nov 7 (P4).**
- Checked: session revocation (by visit, own or with ADMIN_IDENTITY_MANAGE, a visit of another account refused and counted,
  the current one kept; cluster publish; `hasLoggedOut` for sessions no row names yet); the refresh and notws closing an
  account disabled for good or past its end date, not a tarpit lock; revoke#AccountAccess's kinds against F42's list (sessions,
  login, device and token keys, app passwords, SSH keys, SIP `dropDevice`, triggers with their cron jobs, open agent runs);
  `run_job`'s refusal recorded; no self-lockout (revoke#AccountAccess refuses the caller, revoke#Sessions keeps the current
  session); every BOSS path to the framework's revoke services (UserDetail revokeAccess and revokeSession, Sessions'
  bulk revoke) checks the account as an Admin record with `accountWide` first, Commons Account names `ec.user.userId`, and no
  REST or Assist exposure reaches them (all `allow-remote="false"`; only `admin_find_users`, Mantle-scoped, is exposed);
  visit ids are sequenced but every key is checked against its owner; Mantle scope, the account-wide rule, reset#Password
  (a change-only reset password, no password set), store#Account's fields, grant proposals (registered bundles only by
  store#Membership's delegation rules; no ADMIN, sealed or privileged grant), dated memberships; Login as.
- Fixes:
  - **R1 (high)** An identity operator could take over an administrator in its organization: store#Account changed the email
    or username of any non-shared identity in scope, an ADMIN or BOSS_ADMIN_ADMIN member included, and reset#Authentication then
    mailed the reset password to the new address; factor and lock resets and the framework's session and access revocation
    likewise reached accounts holding more than the caller. Now the framework's `Identity.js` `heldBeyond(userId)` (a
    privileged group the caller is not in, or a sealed permission through a current group the caller lacks) refuses
    revoke#AccountAccess and another user's revoke#Sessions (counted), Mantle's store#Account and factor and lock resets
    (`IDENTITY_PRIVILEGED`; get#Account's `canChangeAccount` false with the reason), and BOSS's Login as check reuses it.
    Password reset requests stay allowed (they go to the account's own address). mr-moqui 1aafb9e3, mr-mantle fd496ef8,
    mr-boss (the review commit).
  - **R2 (high)** store#OrganizationMembership related any person to an organization in scope, so an operator could pull a
    site identity (an account of no internal organization: a customer, an administrator of no organization) wholly into its
    scope and then change its email and reset it. A person with an account and no internal organization now needs
    `ADMIN_IDENTITY_GLOBAL` (`IDENTITY_GLOBAL`); a person of another organization stays shared, so its account-wide changes
    still need it. mr-mantle fd496ef8.
  - **R3 (medium, F75)** "Log as note" filed Chatter on UserAccount and UserGroup, which had only their entity filters in
    get#RecordLinkInfo, so any user an app root lends entity authorization (any BOSS user in its screens) could read and add
    them. Now an account's notes are an ADMIN_IDENTITY_VIEW holder's within Mantle's identity scope, a group's an
    ADMIN_ACCESS_VIEW holder's. mr-mantle fd496ef8 (CommunicationServices), LogNote's text in mr-boss.
  - Docs: Attack-Surface, design-admin §4.1.
- Tests (Debug, `--nobuild`): AdminSessions (the sealed holder's access and session refused), AdminAccessServices, RecentAuth,
  SipDevice 21 of 21; StaffIdentity (2 features added, R1–R3), PartyServices, PartyAccounts 20 of 20 (the R1/R2 feature fails
  without the fix); AdminUsers, AdminGroups, AdminAccess, AdminRegistries, CommonsSettings, AdminClientFixtures 25 of 25;
  AdminUsersWalk 1 of 1 (3.0 s); cargo moqui-core `user::`, `service::jobs`, `script::runtime::ec_extra` 113 of 113 (no Rust
  changed in review); `moqui lint --screens` 132 flagged sites, as before; Prettier on the changed JavaScript. Specs stay lean
  (AdminSessions 0.04 s, StaffIdentity 0.9 s, AdminUsers 0.3 s); AdminClientFixtures 0.02 s.
- For the lead:
  - F65 left for the user: Mantle cannot read BOSS's "unrestricted" (BOSS reads the `MANTLE_ACTIVE_ORG` filter on its own
    root grant as every organization, while Mantle's meaning of that filter set is the active organization or the user's own),
    and BOSS_ADMIN_ADMIN does not hold `ADMIN_IDENTITY_GLOBAL`, so reusing it would not help. The clean choices are a new
    unsealed framework permission (say `ADMIN_IDENTITY_ALL_ORGS`) that Mantle honours and BossSetupData grants
    BOSS_ADMIN_ADMIN, or BOSS's Admin scope narrowing to Mantle's for identities;
  - store#OrganizationMembership still lets an operator relate another organization's staff to its own (as the spec's
    covering agent), which makes that identity readable (find#Users, get#Account, sessions, history) though still shared for
    changes; whether adding an existing account of another organization needs `ADMIN_IDENTITY_GLOBAL` too is a design call;
  - Login as is audited by a log line only (F69), and F64 still reaches the identity operator through grant proposals.

**Built Nov 7 (P4 follow-up).** Identity scope reworked to §4's last four rows (the user's calls of Nov 7).
- Mantle:
  - Views (`entity/PartyViewEntities.xml`): `mantle.party.UserAccountOrganization` (UserAccount → PartyRelationship, a current
    `PrtAgent`, `PrtEmployee` or `PrtMember`, → the `OrgInternal` PartyRole; one row for each of an account's internal organizations,
    the organization aliased `organizationPartyId`) and `mantle.party.InternalOrganization` (the internal organizations with their
    names). EntityFilter rows for both in `MANTLE_USER_ORG` (`organizationPartyId` in `filterOrgIds`) and `MANTLE_ACTIVE_ORG`
    (`organizationPartyId` = `activeOrgId`, the set applying only with one active) in MantleSetupData. A view's member filters
    apply as well; none of its members (UserAccount, PartyRelationship, PartyRole) has an active one.
  - `Identity.js` scope is the filtered find: `scope()` the find on InternalOrganization, `inScope(userId)` and
    `scopedOrganizations(userIds)` the find on UserAccountOrganization, `scopedAccounts()` that find for a caller's own conditions,
    each run with the caller's authorization, after `setup#UserOrganizationInfo` (authorization off) puts `filterOrgIds` and
    `activeOrgId` in the user context. A call whose authorization names neither filter set (authorization disabled, a grant without
    them) has nothing in scope, but for `ADMIN` (every organization): fail closed, as Admin.js's `rootGrants` does. `identity`,
    find#Users, get#Account, get#AccountHistory, store#Account, reset#Authentication, store#OrganizationMembership and
    create#StaffAccount use it; an identity's other organizations (for "shared") are still read without filters. Kept: R1
    (`heldBeyond`), R2 (a site identity into an organization needs `ADMIN_IDENTITY_GLOBAL`), F66 and F72 (a shared identity's
    account-wide change needs `ADMIN_IDENTITY_GLOBAL`), public identities in find#Users only with `includePublic` and
    `ADMIN_IDENTITY_GLOBAL`, an identity of no organization readable by `ADMIN` only. `scope` and `identity` keep their names
    and shapes for P5 and P6.
  - Where the filters come from: a BOSS screen's inheritable ALWAYS grant passes its own to the services below it (ADMIN's root
    and the Users and Access areas: `MANTLE_ACTIVE_ORG` for ADMIN and `BOSS_ADMIN_ADMIN`, `MANTLE_USER_ORG` for the identity
    operator and the access administrator). Elsewhere a service's own grant decides (authz.rs takes a frame's own ALLOW before an
    inherited one), so the identity services' `ALL_USERS` grant (PartyAccessData) now carries `MANTLE_USER_ORG`: an Assistant
    call of `admin_find_users`, or a direct call, sees the caller's own organizations (ADMIN's too). Admin.js's own services run
    under the `BOSS_ADMIN` artifact group's grants (`MANTLE_USER_ORG` for the root user group, `MANTLE_ACTIVE_ORG` for the
    administrators).
  - F75: get#RecordLinkInfo finds an account (UserAccount, no filter of its own) through Identity.js `identity`, the
    UserAccountOrganization find under the caller's filters, in place of R3's `ADMIN_IDENTITY_VIEW` check: an account's notes are
    seen where the account's organization filters reach it, by no one when the authorization names no organization filter
    (authorization off), an account of no organization by ADMIN only. A group (UserGroup) has no organization and none to join:
    its notes stay an `ADMIN_ACCESS_VIEW` holder's, as the Access area's reader sees groups.
- BOSS `Admin.js`: the user and member record kinds read Mantle's `identity` (owners and the organizations in scope from the
  filtered find; `sharedBeyondScope` from them); the palette's users and GroupMembers' member choices are `scopedAccounts()`
  with their text; no organization math for users (`staffPartyIds` removed). Organizations, the shared context and the other
  record kinds keep Admin's own scope (the administrator's every organization, the active one when set), which matches the
  filters' meaning.
- Specs: Mantle `StaffIdentity` 8 features, 0.97 s (added: a grant naming `MANTLE_ACTIVE_ORG` sees another organization's staff
  with none active and not with one, F65; reworked: an account's notes by the organization filters, refused with authorization
  off, F75); BOSS `AdminUsers` 3 features, 0.46 s (added: ADMIN's check of a Services-only identity with none active and refused
  with Retail active, the administrator's Users list showing it (Users/Users' one qvt render), the palette finding it for the
  administrator and not the Retail operator).
- Tests run (Release, `--nobuild`): StaffIdentity, PartyServices, PartyAccounts, RecordLinks 40 of 40; AdminUsers, AdminAccess,
  AdminGroups, AdminRegistries, CommonsSettings, AppOrganizationFilters, ProjectsAccess, AdminClientFixtures 41 of 41;
  AdminUsersWalk 1 of 1 (2.9 s); `moqui lint --screens` 132 flagged sites, as before; Prettier on the changed JavaScript.
- Decisions: §4's four Nov 7 rows, as built here. Findings: F65 and F75 done.
- For the lead:
  - an ACCOUNTING_ADMIN (not ADMIN) may choose any internal organization as active (get#PartyOrganizationInfo), and under
    `MANTLE_USER_ORG` that organization is then its `filterOrgIds`, so it would see that organization's staff in identity scope as
    it sees its other filtered records; Mantle's pattern, unchanged here;
  - with no organization active `BOSS_ADMIN_ADMIN` now administers every internal organization's staff, so no identity is
    shared beyond its scope and its account-wide changes need no `ADMIN_IDENTITY_GLOBAL` (as ADMIN before); R1's `heldBeyond`
    still refuses ADMIN members and sealed holders;
  - a call with authorization disabled now has nothing in identity scope but for ADMIN: P5's and P6's code should call the
    services and the scope functions with authorization on.

**Review Nov 7 (P4 follow-up).** Checked against §4's Nov 7 rows and the framework's grant resolution (crates
`user/authz.rs` `is_permitted`, `user/filter.rs`): the filters are the authorizing record's of the top frame; an inheritable
ALWAYS on the parent covers a child frame before anything else, then the frame's own ALLOW (the last in group-name order), then
an inherited ALLOW.
- Holds: the views join only current `PrtAgent`, `PrtEmployee` and `PrtMember` relationships to `OrgInternal` parties (an
  organization with two such relationships gives two rows; every reader de-duplicates); the filter rows' `organizationPartyId`
  matches the aliases; `MANTLE_USER_ORG`'s maps append `_NA_`, so an empty `filterOrgIds` matches nothing (fails closed);
  `MANTLE_ACTIVE_ORG` applies only with an organization active (its `applyCond`); the commented-out PartyRelationship filters
  (`_8`) leave the views' members unfiltered. Under the Admin root ADMIN's inheritable ALWAYS (`MANTLE_ACTIVE_ORG`) covers every
  screen and service; the Users and Access areas' ALWAYS grants cover theirs; Admin.js's own services run under ADMIN's
  ALWAYS, `BOSS_ADMIN_APPADMIN` (sorted after `BOSS_ADMIN`, so the administrator gets `MANTLE_ACTIVE_ORG`) or `BOSS_ADMIN_ROOT`.
  The `ALL_USERS` grant lets any signed-in account reach the services, each of which asks `ADMIN_IDENTITY_VIEW` or
  `_MANAGE` first through ProductAccess `has` (a Projects client never; a PASS account holds neither); `identity`, `inScope`
  and `scopedOrganizations` ask no permission and are for callers that do (Admin.js's record checks, get#RecordLinkInfo). The
  `ADMIN` exception is `isInGroup("ADMIN")`, a membership, not a parameter. No other organization is named: `scope()` and
  `scopedOrganizations` return only filtered ids, `identity`'s owners (read unfiltered for "shared") reach callers only as
  `otherOrganizationCount` and `sharedBeyondScope`; palette, member choices and record links name in-scope organizations only.
  R1 (`heldBeyond`), R2, F66 and F72 are intact. `BOSS_ADMIN_ADMIN` administering every organization with none active (so no
  `ADMIN_IDENTITY_GLOBAL` for a multi-organization identity) follows from its existing `MANTLE_ACTIVE_ORG` grants and §4's row;
  site identities stay ADMIN's. Account notes without `ADMIN_IDENTITY_VIEW` (any user whose filters reach the account, e.g. a
  Commons user of the same organization) are §4's row replacing R3, as decided; group notes stay `ADMIN_ACCESS_VIEW`'s.
- Fixed (Mantle):
  - ADMIN calling the identity services under no screen grant (the Assistant's `admin_find_users`, a direct call) ran under the
    `ALL_USERS` grant's `MANTLE_USER_ORG` and saw only the organizations its own party works for, against §4 ("an ADMIN member
    sees every user with no active organization"). PartyAccessData adds `MantleIdentityServicesADMIN`: ADMIN, ALWAYS (an ALLOW
    would lose to `ALL_USERS` in group-name order), `MANTLE_ACTIVE_ORG`. StaffIdentity's F65 feature checks it.
  - F78 (the user's call, Nov 7): `store#OrganizationMembership` refuses (`IDENTITY_GLOBAL`) relating a person whose account
    works for an organization outside the caller's scope without `ADMIN_IDENTITY_GLOBAL`; R2's site-identity rule kept.
    StaffIdentity's membership feature: the operator refused relating the other organization's staff, `sid.global` allowed.
- Built note correction: "a direct call sees the caller's own organizations (ADMIN's too)" now reads ADMIN's every organization
  (the active one when set).
- For the lead: a find on the views under `MANTLE_USER_ORG` with more than 5,000 account-organization rows truncates find#Users
  (its `limit(5000)`), and its paging stops at 1,000 accounts (unchanged from P4).
- Tests run (Release, `--nobuild`): StaffIdentity 8 (1.2 s), PartyServices 8, PartyAccounts 5, RecordLinks 19; AdminUsers 3,
  AdminAccess 7, AdminGroups 2, AdminRegistries 4, CommonsSettings 9, AppOrganizationFilters 7, ProjectsAccess 8,
  AdminClientFixtures 1, all passed; AdminUsersWalk 1 of 1 (2.9 s); `moqui lint --screens` 132 sites, as before; Prettier.

- **Wave 5 suites (Nov 7, on master after Admin P4, Insights P4, the audit fix (F79) and Mantle's F61 merged and the
  release binary rebuilt; Admin P5's and the P4 follow-up's reviewers and the Insights P5 worker ran at the same time):**
  `./moq test-framework`: every spec feature passed; cargo failed F38's known test and
  `chat_tests::an_agent_member_gets_each_message_through_its_entry_point` (passed in Wave 4; under investigation in the
  adm/fw1 follow-up); webroot's client 45.9 of 44 s under the load. Standalone mr-mantle: the baseline two and
  WorkPlanToCashBasicFlow (10 features: its expected audit rows meet P4's audited `requirePasswordChange`, F67), fixed in
  adm/fw1. `mail_capture_sends=true ./moq test-apps` 3,348 server features passed, 10 failed (WorkPlanToCashBasicFlow
  only); the client run's mr-marble BrowserSmoke server did not start behind that failure, 16 client features passed.
  mr-mantle 428.2 of 393 s, mr-boss 250.0 of 264 s server and 58.5 of 57 s client (AdminUsersWalk 3.1 s added) under the
  load; the budgets are measured on a quiet run at gate 1 before any raise. `moqui lint --screens` 132 sites.

### P5 — Invitations

Design §4.1 Invitations, §4 Invitations and AcceptInvitation, §16 (the invitation email); ADM-LIFECYCLE (invitations).

- **Mantle `UserInvitation`** (`mantle.party`, the fields of design §17.2, statuses pending, accepted, revoked, expired)
  and IdentityServices `invite#User`, `find#Invitations`, `resend#Invitation` (invalidating the earlier token),
  `revoke#Invitation`, `check#InvitationToken` (the token route's service: `valid` and `routeContext`, F7),
  `get#InvitationSummary` and `accept#Invitation` (an explicit match of a verified address, or controlled account
  creation through `create#UserAccount`; the inviter's delegation, the target's scope and the current grants rechecked;
  the organization membership written through P4's `store#OrganizationMembership`, then the grants; never ADMIN, a
  sealed right or a new organization from the invitation).
- **The invitation email:** an EmailTemplate of `EMT_ACCOUNT_INVITE` seeded in mr-mantle (F8) with its template
  screen, linking `/i/<token>`.
- **When the instance cannot send mail** (no SMTP host, Admin's first setup check; §4): InviteStaff's and a resend's
  result shows the acceptance link once, as plain text with a copy control, not as a link, for the inviter to pass on;
  showing it is audited (the invitation, not the token), and the token is never stored in plain text, listed, logged or
  shown again (a resend makes a new one).
- **AcceptInvitation** (`screen/AcceptInvitation.xml`) on the mr-boss token route `i` (F7), its steps Invitation,
  Account, Factor (the framework's TOTP services when a group of the bundle requires a factor) and Done; one message,
  "This invitation is no longer valid", for every spent token.
- **Screens:** Invitations (InvitationFind, InvitationList with resend and revoke, InviteStaff); quick create and a
  palette action Invite users. Bulk invite is P15's staff-invitations target.
- **Assist:** the `invite-staff` skill, which replaces the framework's `create-user-account` skill in BOSS (design
  §1.2).
- **Specs:** Mantle `test/party/StaffInvitation` (single use; a resend invalidates the earlier token; expired, revoked
  and wrong-address tokens refused; no ADMIN, sealed right or new organization from metadata; acceptance links or makes
  exactly one account; a retry with the same key answers the same invitation; with no mail server the link comes back
  once and no row keeps the token); BOSS `AdminInvitations` (AcceptInvitation's one qvt render, its stale-token page;
  InviteStaff's copy-only link with no mail server).
- **Usable when** (design §15.3 "Hire and invitation", its invitation half): an identity operator invites a new staff
  member with a Purchasing bundle; the email's link creates the account, asks for a factor when the bundle requires
  one, and opens Commons with `BOSS_USERS` and the Purchasing group; the resent invitation's first link no longer works;
  a PASS account holding the invited address cannot redeem it for internal access without the token.

**Built Nov 7 (P5).**
- Mantle:
  - `entity/IdentityEntities.xml`: `mantle.party.UserInvitation` (address, a new person's name or the party, the organization and
    relationship, the grant proposal as bundle ids, note, status, token hash with a unique index, expiry, sends, `mailSent`,
    `linkShownDate`, accepted and revoked times, the pending factor, inviter, operation key with a unique index; status, expiry,
    sent, link-shown, accepted and revoked dates audit-logged, never the hash). `data/PartyInvitationData.xml` (seed, named to load
    after MantleSetupData): StatusType `UserInvitation` (`UinvPending`, `UinvAccepted`, `UinvRevoked`; `UinvExpired` read from the
    expiry), EmailTemplate `MANTLE_STAFF_INVITATION` of `EMT_ACCOUNT_INVITE` (F8) with `template/party/StaffInvitation.xml`, and
    the `MANTLE_USER_ORG` and `MANTLE_ACTIVE_ORG` filters of UserInvitation by its organization.
  - `IdentityServices.xml` (appended) over a module of its own, `Invitations.js`: `invite#User`, `find#Invitations`,
    `resend#Invitation`, `revoke#Invitation`, `reveal#InvitationLink` (added), `check#InvitationToken`, `get#InvitationSummary`,
    `accept#Invitation`, `confirm#InvitationFactor` (added). The inviter's side checks `ADMIN_IDENTITY_MANAGE` (`_VIEW` to read)
    and the organization through Identity.js's `scope()`, called by name (for the merge with the scope rework: `scopedInvitation`,
    `inviteUser`, `findInvitations`; `find#Invitations` also reads with authorization as the caller has it, so the UserInvitation
    filters apply under the Users area's grant), and the proposal as the caller through `check#GrantProposal`; the token holder's
    side is `anonymous-view`/`anonymous-all` and checks the token first. Tokens: 43 characters of `[A-Za-z0-9_-]`, kept as
    `singleUseCodeHash`. Mail: sent when the template's server has an SMTP host, with `createEmailMessage` false; otherwise
    `linkPending`, and `reveal#InvitationLink` makes the token at the moment it is shown, once, to whoever issued it, within
    fifteen minutes (F85). Acceptance: the signed-in account with the invited address, else a new account
    (`create#PartyUserAccount`; `ACCOUNT_EXISTS` when an account has the address), the inviter's authority rechecked from the
    records, then the relationship and memberships written with authorization on and, for a bundle group requiring a factor, an
    authenticator factor to confirm (F82, F89); one transaction.
- BOSS:
  - `MoquiConf.xml`: token route `i` (`screen/AcceptInvitation.xml`, `check#InvitationToken`) and the `invitation-accept` rate limit
    (ten posts a minute under `/i/`).
  - `screen/AcceptInvitation.xml`: Invitation, Account (`stage=account`), Factor and Done by the summary's step; one message for
    every spent or unknown token; its forms are qvt markup posting under the route (F81).
  - `Admin/Users/Invitations.xml` (InvitationFind, InvitationList with Resend and Revoke, the link shown once with a copy button,
    F87) and `Admin/Users/InviteStaff.xml` (menu-include false); Users' tab Invitations (index 2) and Users' Invite users link;
    `Admin.xml` quick create `adminInviteUsers` and palette action Invite users, both InviteStaff. `Admin.js`: links
    `Users/Invitations`, `Users/InviteStaff`; the `invitationBundles` choice (bundles less privileged and sealed groups).
  - `skill/invite-staff.md` (F86); `test/skill-retrieval.json` three cases (recall@3 17 of 17).
  - No new `ironstone` service, so the client deny pattern (BOSS_PROJECTS_INTERNAL) is unchanged; no BossSetupData,
    BossUsersDemoData or MantleSetupData change (the Users area's grant opens the new screens).
- Specs: Mantle `test/party/StaffInvitation` (7 features, 1.0 s: no mail server, the link once and no row or audit row with the
  token; no ADMIN, sealed group or other organization, the email's link; one account in the invitation's organization with its
  bundles whatever the request says, single use; a resend invalidates the first token, revoked, expired and wrong-account refused;
  an existing account linked after it signs in, a proposal changed to name ADMIN refused with nothing written; the factor step);
  BOSS `test/Admin/AdminInvitations` (2 features, 0.3 s: InviteStaff with no mail server and Invitations' copy-only link shown once;
  AcceptInvitation's qvt render of the account step under the route and the revoked token's page), `AdminAccess` (Invite users in
  quick create for the identity operator and the administrator, not the reader). Acceptance, written and not run:
  `test/acceptance/Admin/AdminInvitationsUsable` (3 features, the "usable when").
- Tests run (release binary, `--nobuild`): StaffInvitation, StaffIdentity, PartyServices 22 of 22 (mr-mantle 1.7 s); AdminInvitations,
  AdminUsers, AdminAccess, AdminGroups, ProjectsAccess 21 of 21 (mr-boss 8.0 s, AdminAccess's menu feature among them);
  `moqui test mr-boss --skills` 17 of 17; `moqui lint --screens` 132 flagged sites, as before, no TUI-text warning of P5's. Not run:
  `./moq test-apps`, the acceptance suite.
- Inventories: no ss-inventory or usl-inventory row names an invitation form or a baseline service P5 calls (the new services are
  Mantle's own); Implemented in unchanged.
- Design edits: design-admin §1.2 (the skill), §4.1 Invitations, §4 Invitations and AcceptInvitation (as built), §16 (the
  template), §17.2 (the two added services).
- Findings (provisional, numbered by the lead):
  - **F81** (framework) A form-single on a token route's screen posts to `/<transition>`: its URL is built from the screen
    tree's root, the route's screen, with an empty web base (render.rs `web::base_url`, never set for a token route), so it leaves
    the route. AcceptInvitation writes its three forms as qvt `m-form` markup with the route's `basePath`. A framework fix: the
    token route's dispatch sets the base to `/<name>/<token>`, after which they can be form-singles again.
  - **F82** The framework checks only as the current user (no run-as), and the invitee holds no permission, so acceptance
    cannot call `check#GrantProposal`, `apply#GrantProposal` or P4's `store#OrganizationMembership` (each needs the caller's
    `ADMIN_IDENTITY_MANAGE` and scope). Invitations.js rechecks the inviter from the records (account usable, permission through
    current groups with ADMIN holding all, organization through `get#PartyInternalOrgIds`, each bundle registered and delegable by
    them, never privileged or sealed) and writes the relationship and memberships itself with authorization on. A
    `check#GrantProposal` taking an actor would remove the copy of the delegation rule.
  - **F83** The token route's own page reads "This link has expired or was not found", and a resent token matches no hash, so
    `check#InvitationToken` lets every well-formed token through (`open` in routeContext) and the page says "This invitation is
    no longer valid" for spent and unknown tokens alike.
  - **F84** (framework) Request telemetry records `url.path` unredacted (http.rs), so every token route's token (`/i`, `/s`, `/u`,
    `/cal`, `/r`, `/call`) reaches traces; the sign-in step's `returnTo` carries the path too. Redacting the token segment of a
    token route's path is the framework's.
  - **F85** Session attributes are stored (HttpSession.attributes), so Git access's pattern (a secret in a session attribute until
    the next render) would store the link; `reveal#InvitationLink` makes the token at the render that shows it instead.
  - **F86** A component's skill file cannot replace a framework skill of the same name (the sync leaves out a later file;
    `overrides` is for site rows), so `create-user-account` stays beside `invite-staff`, which takes its terms. A component-level
    override is the framework's.
  - **F87** XML widgets have no copy control for plain text (`markdown copy` copies Markdown and the URL becomes a link): the link
    is a read-only `q-input` with a copy button in qvt markup.
  - **F88** Inviting the address of a site identity (an account of no internal organization) and its owner accepting brings that
    identity wholly into the operator's scope, which P4's R2 asks `ADMIN_IDENTITY_GLOBAL` for when an operator relates it directly.
    Here the owner consents by signing in with the token; whether inviting such an address also needs it is the review's call.
  - **F89** Sign-in never completes for an account in a factor-requiring group without a factor (F41), so the acceptance makes an
    authenticator factor the token holder confirms within a day; an unconfirmed factor still validates at sign-in once scanned.
  - **F90** (framework docs) Attack-Surface's token-route table needs the `i` row and the `invitation-accept` rate limit.
- Decisions (§4 rows added): the link made at its showing; every well-formed token through the route; acceptance's own writes after
  rechecking the inviter; no privileged or sealed group in an invitation; the factor made at acceptance.
- For the lead:
  - budget shares: mr-mantle about 1.0 s (StaffInvitation); mr-boss about 0.3 s (AdminInvitations; AdminAccess unchanged in
    cost); no budget raised;
  - framework asks: F81 (token-route base URL), F82 (an actor for check#GrantProposal), F84 (token paths in telemetry),
    F86 (component skill override), F90 (Attack-Surface);
  - the scope rework: Invitations.js calls `identityLib.scope()` in the four places above and reads the inviter's organizations
    through `get#PartyInternalOrgIds`; the UserInvitation filters are appended EntityFilter rows of the two Mantle sets;
  - BossSetupData, BossUsersDemoData and MantleSetupData unchanged;
  - the acceptance AdminInvitationsUsable to run when asked.

**Review Nov 7 (P5).**
- Checked: tokens (43 characters, 256 bits, kept only as `singleUseCodeHash` under a unique index; never in a log line, a
  list, `find#Invitations`, an audit row or an EmailMessage: `createEmailMessage` false, mail only with an SMTP host); single
  use, a resend's new hash, expiry, revoke; `reveal#InvitationLink` (its issuer only, once by `linkShownDate`, within fifteen
  minutes of the issue, the token made at that call, audited without it); F83 (every well-formed token reaches only the
  "no longer valid" page: a 256-bit token cannot be guessed, each transition's service checks it again, posts under `/i/*/*`
  are rate limited); acceptance (a signed-in account must have the invited address and, for a chosen person, be theirs;
  `ACCOUNT_EXISTS` otherwise; nothing of the request names organization or access; no privileged or sealed group, whoever
  sent it, rechecked at acceptance); F82's copy of the delegation rule against `Access.js` `proposalBundles`
  (registered and enabled, the delegable permission held with ADMIN holding all, and stricter than F57 and F63: no sealed or
  privileged group at all); the EECAs (they run as the invitee, or anonymous for a new account, so a privileged or sealed
  membership fails closed; they cannot wrongly pass for the invitee except for one who already holds the right, and the
  invitation's own refusal covers that); the UserInvitation filters and `find#Invitations`' scope; AcceptInvitation's steps,
  the one spent message and the qvt forms under `/i/<token>`.
- Fixes:
  - **R1 (high, F88)** An identity operator could pull a site identity or another organization's staff into its scope by
    inviting the address (no check unless a partyId was chosen, and none for a site identity), the owner's acceptance then
    giving account-wide memberships. Now `invite#User` and `resend#Invitation` refuse (`IDENTITY_GLOBAL`) an invited person
    (the one chosen, or the owner of the address's account) with an account and no internal organization, or working for an
    organization outside the caller's scope, unless the caller holds `ADMIN_IDENTITY_GLOBAL` (P4 R2, F78's decision), and
    `accept#Invitation` rechecks it for the inviter from the records against the redeeming account's person. A chosen person
    whose address belongs to another person's account is refused (`ADDRESS_IN_USE`) instead of making a dead invitation.
    mr-mantle 31d3519f.
  - **R2 (medium, F89)** The factor step showed the new account's authenticator key to any holder of the link for a day
    after acceptance (a forwarded or later-read email). The factor step and `confirm#InvitationFactor` now answer only the
    session that accepted (`UserInvitation.acceptVisitId`; the acceptance post carries the session cookie the route's
    no-store page set) or the account signed in; another holder sees the done step. mr-mantle 31d3519f.
  - **R3 (low)** `accept#Invitation`, `confirm#InvitationFactor` and `reveal#InvitationLink` read the invitation for update,
    so two concurrent requests on one invitation cannot both pass the single-use or show-once check. AcceptInvitation is
    `history="false"`, keeping the token's path off the stored screen history. mr-mantle 31d3519f, mr-boss (the review
    commit).
  - Docs: design-admin §4.1 Invitations and §4 AcceptInvitation, `skill/invite-staff.md`, IdentityServices descriptions.
- Tests (release binary, `--nobuild`): StaffInvitation (a feature added: the rule at invitation and acceptance; the factor
  feature checks the key is withheld from another holder), StaffIdentity, PartyServices 23 of 23 (mr-mantle 1.6 s);
  AdminInvitations, AdminUsers, AdminAccess, AdminGroups, ProjectsAccess 21 of 21; `moqui test mr-boss --skills` 17 of 17;
  `moqui lint --screens` 132 flagged sites, as before. Acceptance `AdminInvitationsUsable` changed (the site account is
  invited by the instance administrator after the identity operator is refused; the factor key read as the account) and run,
  3 of 3; the rest of mr-boss's acceptance suite not run (other agents on the machine). Specs stay lean (each feature under
  0.2 s).
- For the lead:
  - the scope rework (adm/p4fix): Invitations.js calls `identityLib.scope()` in `scopedInvitation` (resend, revoke, reveal),
    `inviteUser` (twice), `findInvitations` and now `resendInvitation`; each is the inviter's call from a screen or the spec's
    `as()`, all with authorization on, none with it disabled. Acceptance never calls `scope()`: it reads the inviter's
    organizations through `get#PartyInternalOrgIds` from the records (no active-organization narrowing), which the rework
    should align with its own definition if that changes;
  - Invitations.js's `holds()` reads the inviter's permissions from current memberships (ADMIN holding all), without the
    factor or allowed-IP conditions a live session's `hasPermission` applies, as there is no inviter session at acceptance;
    a `check#GrantProposal` taking an actor (F82) would remove it;
  - framework (with F84): the sign-in step's `returnTo` carries `/i/<token>`, and Login saves it as the screen last info,
    a stored session attribute (F85), until it is used; redacting or not persisting a token route's path is the framework's;
  - `reveal#InvitationLink` runs on Invitations' render (a GET): a reload or a client prefetch spends the showing, and a
    resend gives a new link; acceptable, as the link is never shown twice.

### P6 — Lifecycle and offboarding

Design §4.1 Offboarding, UserDetail's LifecycleActions, LifecycleOperations and LifecycleDetail, §14 lifecycle
participant; ADM-LIFECYCLE (lifecycle).

- **Mantle `UserLifecycleOperation`** and its steps (`mantle.party`, design §17.2) and IdentityServices
  `preview#Lifecycle` (grants, credentials, sessions, owned resources and outstanding work, from the participants),
  `start#Lifecycle` (global disable through `revoke#AccountAccess`, a future date written to `terminateDate`;
  organization removal ending that organization's relationships and grants only; restoration reactivating no
  credential or schedule), `get#Lifecycle`, `find#LifecycleOperations` and `retry#LifecycleStep`.
- **The participants** (BOSS seed `ironstone.admin.LifecycleParticipant`, §4) and `LifecycleServices`'
  `transfer#OwnedResource`: Commons' shared drives, contact books and calendars, Comms' shared mail accounts and
  Projects' assignments, each through its owner's service; Insights registers `pause#OwnedSchedules` and
  `transfer#DefinitionOwner` in Insights P7. A failed step leaves the revocation in place and stays visible for retry.
- **The owners' services** (owner contracts, F31): Projects' assignments move through the built
  `TaskServices.reassign#Task`, `WorkItemServices.bulk#WorkItems` and `RequestServices.reassign#Request`. Nothing
  changes the owner of a drive (framework `FileServices`), a shared mail account (framework `EmailClientServices`), a
  calendar (Mantle `CalendarServices`) or a contact book's owning user (Mantle `ContactBookServices`); P6 adds an
  owner change to each, with its own permission and the new owner's eligibility checked by the owner.
- **Bulk disable** from Users runs one operation per identity, each checked on its own.
- **Screens:** UserDetail's Lifecycle tab (LifecycleActions, the account's operations); LifecycleOperations
  (LifecycleFind, LifecycleList); LifecycleDetail (LifecycleSummary, LifecycleSteps, TransferOwnership).
- **Assist:** the `offboard-user` skill.
- **Specs:** Mantle `test/party/UserLifecycle` (global disable revokes access at once; a future end date stops sign-in
  at that date with no job; one organization's removal keeps the other's access; a failing participant step does not
  undo the revocation; restoration reactivates no key); BOSS `AdminLifecycle` (LifecycleDetail's one qvt render).
- **Usable when** (design §15.3 "Offboarding"; its schedules half with Insights P7): removing the shared identity from
  ORG_ZIZI_RETAIL leaves its ORG_ZIZI_SERVICES access and Commons books; a global disable signs it out everywhere and
  revokes its app passwords; a shared drive it owned waits in LifecycleDetail for a new owner.

**Built Nov 7 (P6).**
- Framework (mr-moqui):
  - `org.moqui.admin.IdentityServices`: the owned-resource contract, interfaces `define#OwnedResourceLookup` (userId to
    resourceList), `define#OwnedResourceTransfer` (the owner's resource id, fromUserId, toUserId to transferred) and
    `define#OwnedResourcePause` (userId to pausedCount).
  - Owner changes (F31): `FileServices.find#OwnedDrives` and `transfer#DriveOwner` (a shared drive, not personal, records,
    mirror or archived; the new owner enabled, not ended, not `EXTERNAL_USER`, its member row ended) and
    `EmailClientServices.find#OwnedEmailAccounts` and `transfer#EmailAccountOwner` (a shared account, `EakShared`; both mail
    change cursors reset), each by the owner or with `DRIVE_OWNER_CHANGE` / `EMAIL_ACCOUNT_OWNER_CHANGE` (seeded, granted to
    `ADMIN`), each implementing the contract, under the `ResourceOwnerServices` `ALL_USERS` ALLOW, `allow-remote="false"`.
  - Docs: Attack-Surface (owned resources and the contract), Revision-Management's drive services, Remaining-Work's
    `org.moqui.admin` row. No Rust.
- Mantle:
  - `entity/IdentityEntities.xml`: `mantle.party.UserLifecycleOperation` (operation key unique, account, kind
    `UlkDisable`/`UlkOrgRemoval`/`UlkRestore`, global or the organization it was requested for, effective date, reason, source
    reference, state `UlopCompleted`/`UlopScheduled`/`UlopAttention` audit-logged, the account revision named, requester) and
    `UserLifecycleOperationStep` (kind, provider, owner app, title, resource, the participant's action service and resource
    parameter, new owner, state `UlstDone`/`UlstWaiting`/`UlstFailed`/`UlstSkipped` audit-logged, attempts, reason).
    `data/PartyLifecycleData.xml` (seed, after MantleSetupData): the kinds and states, the `MANTLE_USER_ORG` and
    `MANTLE_ACTIVE_ORG` filters of UserLifecycleOperation by its organization, `CALENDAR_OWNER_CHANGE` and
    `CONTACT_BOOK_OWNER_CHANGE` (granted to `ADMIN`) and the `MantleResourceOwnerServices` `ALL_USERS` ALLOW.
  - `IdentityServices.xml` (appended) over `Lifecycle.js`: `preview#Lifecycle`, `start#Lifecycle`, `get#Lifecycle`,
    `find#LifecycleOperations`, `retry#LifecycleStep`. A disable at once: `revoke#AccountAccess` in its own transaction, then
    `disabled` Y with no `disabledDateTime` (F92); with a future date `terminateDate` only (state Scheduled, no job). A
    removal: that organization's relationships end (now or at the date); with no internal organization left, the account is
    signed out (F100) and its memberships end (authorization on, the EECAs deciding each); otherwise nothing else changes and
    no participant step is recorded. A restore: enabled, end date cleared, nothing revoked brought back. Participant steps
    (a disable, or a removal leaving no organization) from the app: a pause runs now, a transfer waits; a service without the
    contract's parameters is a failed step, never called (F91). Global operations account-wide (`accountWideRefusal`,
    `heldBeyondRefusal`, now exported by Identity.js), a removal ending memberships `heldBeyond`-checked, self refused, the
    administration path checked (F99), the operation key answering a retry, `expectedRevision` checked when given (F97).
    Scope: Identity.js `identity`, `scope`, `inScope`, all with the caller's authorization.
  - Owner changes (F31): `CalendarServices.find#OwnedCalendars` and `transfer#CalendarOwner` (a shared or resource calendar the
    leaver's person owns gets the new owner's party; an organization's calendar they alone manage gets a new manager, who must
    work for that organization; a personal calendar stays) and `ContactBookServices.find#OwnedContactBooks` and
    `transfer#ContactBookOwner` (a shared book the leaver alone manages gets a new manager, of its organization when it has one;
    a personal book and its contacts stay, F93), each by the owner or with the new permission, implementing the contract.
- BOSS:
  - `entity/AdminEntities.xml`: `ironstone.admin.LifecycleParticipant` (key, owner app, title, resource kind, lookup, transfer
    and pause services, resource parameter, the owner's permission). `data/BossSetupData.xml` (appended P6 block): the
    participants `commons.drives`, `commons.calendars`, `commons.contactBooks`, `comms.mailAccounts`, `projects.assignments`;
    the four owner-change permissions to `BOSS_ADMIN_IDENTITY` and `BOSS_ADMIN_ADMIN` with their CapabilityBundlePermission rows
    (F95); the client deny pattern's `transfer` verb (a second `BOSS_PROJECTS_INTERNAL` element, 205 characters).
  - `service/ironstone/admin/LifecycleServices.xml` over `Lifecycle.js`: `find#OwnedResources` (each participant's lookup as the
    caller; unavailable without the owner's permission, failed named without diagnostics, F98; the steps for
    `start#Lifecycle`), `transfer#OwnedResource` (the step's service and parameter must be what its participant registered,
    `NOT_REGISTERED`; the new owner a staff identity in scope who can sign in; then Mantle's `retry#LifecycleStep`), and Projects'
    participant `find#Assignments` (counts of open tasks, project work items and requests) and `transfer#Assignments` (through
    `TaskServices.reassign#Task`, `WorkItemServices.bulk#WorkItems` assign and `RequestServices.reassign#Request`, F94).
    `Admin.js`: links `Users/LifecycleOperations`, `Users/LifecycleDetail`; the `lifecycleUsers` choice (staff in scope who can
    sign in, `exclude` added to `get#Choices`).
  - Screens: `Users/LifecycleOperations.xml` (Users' tab Lifecycle, index 4: LifecycleFind, LifecycleList);
    `Users/LifecycleDetail.xml` (record header, LifecycleSummary, LifecycleSteps with Retry and the TransferOwnership dialog);
    UserDetail's Lifecycle box (Disable, Remove from organization, Restore dialogs opening a review on the page by `previewKind`,
    whose confirmation runs `start#Lifecycle` with the participants' steps and an operation key and opens LifecycleDetail; the
    account's operations); Users' Disable users (a review of each identity's preview, then one operation per identity, each in
    its own transaction, the refused named).
  - `skill/offboard-user.md` (risk `confirm`); `test/skill-retrieval.json` three cases (recall@3 20 of 20).
- Specs: framework `test/ResourceOwners` (2 features, 0.01 s: a shared drive moves only with `DRIVE_OWNER_CHANGE` to an enabled
  internal account, a personal drive stays; a shared mail account likewise, a personal account stays; both carry the contract);
  Mantle `test/party/UserLifecycle` (6 features, 0.46 s: a global disable revokes sessions, app password and SSH key at once and
  disables for good, refused for the shared identity without `ADMIN_IDENTITY_GLOBAL` and for oneself; a future end date is
  `terminateDate` with no job; one organization's removal keeps the other's relationship, membership and resources, the operation
  still read there; a participant step without the contract is never called and a refused transfer does not undo the revocation,
  the retry to a colleague moves the calendar through Mantle's owner change; restoration reactivates no key, the operation key
  answers the first operation), `ContactBooks` (a feature, 0.15 s: the shared book its only manager owns listed and handed to a
  colleague; a personal book stays; refused without `CONTACT_BOOK_OWNER_CHANGE`); BOSS `test/Admin/AdminLifecycle` (3 features,
  0.3 s: the operator's confirmation through UserDetail revokes at once and leaves the drive waiting; LifecycleDetail's one qvt
  render; TransferOwnership refuses a step naming another service and a new owner outside Retail, a Retail colleague takes the
  drive), `AdminAccess` (what an identity owns by the same scope: Services' refused, the reader refused). Acceptance, written and
  not run: `test/acceptance/Admin/AdminLifecycleUsable` (2 features, the "usable when").
- Tests run (the main checkout's release binary on this worktree's runtime, `--nobuild`; no Rust changed): ResourceOwners,
  AdminSessions, AdminAccessServices 11 of 11; UserLifecycle, StaffIdentity, StaffInvitation, PartyServices, ContactBooks,
  CalendarServices 71 of 71; AdminLifecycle, AdminUsers, AdminAccess, AdminGroups, AdminInvitations, AdminRegistries,
  ProjectsAccess, Files, Calendar, ContactBookSettings, MailAccounts, Tasks, Requests, WorkItems, CommonsSettings 128 of 128;
  `moqui test mr-boss --skills` 20 of 20; `moqui lint --screens` 132 flagged sites, as before; Prettier on the changed
  JavaScript. Not run: `./moq test-apps`, `./moq test-framework`, the acceptance suite.
- Inventories: usl-inventory's four Mantle owner-change rows (CalendarServices and ContactBookServices `find#Owned…` on
  UserDetail, `transfer#…Owner` on LifecycleDetail); no ss-inventory row names a lifecycle form.
- Design edits: design-admin header, §1.2 (the skill), §4.1 Offboarding, §4 Users, UserDetail, LifecycleOperations and
  LifecycleDetail (as built), §14's lifecycle participant row, §17.2 (the services, the contract and the records);
  design-drawers-commons (Drives, ContactBooks, MailAccounts, the calendar services row: the owner changes); design-projects
  (a leaver's assignments).
- Findings (provisional, numbered by the lead):
  - **F91** (framework) A script's `getServiceDefinition` has no `implements`, and the identity services' `ALL_USERS` grant
    is inheritable, so a stored step's service would run with that grant whatever it is. Mantle calls only a service carrying
    the contract's parameters (in `fromUserId`, `toUserId`, out `transferred`; in `userId`, out `pausedCount`), which an
    implementing service gets from the interface, and BOSS's `transfer#OwnedResource` also checks the step against the
    registry; `start#Lifecycle` is `allow-remote="false"` and BOSS builds the steps from its registry. Exposing `implements` in
    `service_definition_info` would make the check exact.
  - **F92** The framework's `disable#UserAccount` sets `disabledDateTime`, which login reads as a tarpit lock that expires
    (F41); the lifecycle writes `disabled` Y with no time, the disable for good the session refresh and notws end (F71).
  - **F93** F31's "contact book's owning user": `ownerUserId` is a personal book's, whose personal contacts design §4.1 and
    drawers-commons §21 keep with their user. Built as a shared book's manager change; personal books, calendars, drives and
    mail accounts are never handed on (a reviewed disposition is the retention work, §7).
  - **F94** Projects' reassign services refuse an administrator without Projects authority (`reassign#Request` by the
    assignee only; `reassign#Task` and `bulk#WorkItems` by the owner, an assignee or a manager), so the assignments step fails
    for an identity operator, named, and waits for someone with that authority to retry it. A lifecycle reassign right is
    Projects' call.
  - **F95** Drives, mail accounts, calendars and contact books have no organization, so the owner-change permissions are
    instance-wide for a direct call (as F73); BOSS scopes the leaver and the new owner first. Granted to the identity operator
    and the administrator.
  - **F96** An operation carries one organization (§4): a global disable of a shared identity is listed under the
    organization it was requested for; the other organization's administrators see the account disabled and its audit rows,
    not the operation.
  - **F97** `expectedRevision` is optional: Users' bulk disable runs on each identity's current revision after its review
    (find#Users carries none); UserDetail names it.
  - **F98** A participant the caller may not read (no owner permission) or whose lookup fails is shown in the review and
    records no step (Mantle takes pause and transfer steps only), so its resources stay with the leaver without a row in
    LifecycleDetail; an "unread participant" step to retry is a later addition.
  - **F99** The administration path's moments come from memberships only, so a future-dated disable is checked as if the
    account were disabled now (stricter, never looser).
  - **F100** A removal that leaves no organization also signs the identity out, so its ended memberships apply at once
    (a live session keeps the groups it read); with a future date, only the dated ends.
  - **F101** Insights P7's `pause#OwnedSchedules` and `transfer#DefinitionOwner` must carry the contract's parameters (or
    Insights registers an adapter service that does) to be a participant.
- Decisions (§4 rows added): the owned-resource contract and its check; the owner changes and their permissions; the operation's
  organization; disable, removal and restore as built; reviews on the page.
- For the lead:
  - budget shares: framework about 0.01 s (ResourceOwners); mr-mantle about 0.6 s (UserLifecycle 0.46 s, the ContactBooks
    feature 0.15 s); mr-boss about 0.35 s (AdminLifecycle 0.3 s, AdminAccess's case); no budget raised;
  - no Rust changed: the release binary serves; SecurityTypeData gains its P6 block after AdminAccessServices'; BossSetupData's
    P6 block is appended at the end (BossUsersDemoData and MantleSetupData unchanged; Mantle's rows are a new seed file);
  - Insights P7 registers its participant on the contract (F101); F91 (`implements` for scripts) and F94 (a Projects
    reassign right) are owners' calls;
  - the acceptance AdminLifecycleUsable to run when asked.

**Review Nov 7 (P6).** A fresh review of the three repositories' P6 diffs, security first; fixes committed apart per repository
("Admin P6 review: …").
- **F91, closed.** Mantle's identity services' `ALL_USERS` ALLOW is inheritable, so whatever a lifecycle step called ran
  under it without its own authorization: an identity operator through Mantle alone (`ADMIN_IDENTITY_MANAGE`, no Admin group;
  an Assistant tool, another app's service) retrying a stored step naming Admin's `LifecycleServices.transfer#Assignments` ran it
  (reproduced, step Done). Mantle reads no registry, so any service carrying the contract's parameters passed. Fixed in the
  framework: `IdentityServices.call#OwnedResourceService` (refuses a service without the contract, then calls it) under
  `OwnedResourceCall`, an `ALL_USERS` ALLOW that is **not** inheritable, so the coordinator's inheritable ALLOW stops there and
  the owner service is authorized on its own records, as a direct call is (authz.rs: a frame's own non-inheritable ALLOW wins
  over the parent's inheritable one; an app screen's inheritable ALWAYS, which BOSS's Users area grants, still covers it, as it
  covers every service below that screen). Mantle's pause and transfer steps call through it. Through BOSS the steps come from
  the registry (startOperation passes no request steps), `transfer#OwnedResource` checks the registration, and the parameters
  are the operation's (`fromUserId` the operation's account, the resource from the owner's lookup, `resourceParameter` never a
  contract name); the request names only the new owner. Mantle alone still refuses no contract-carrying service by name: it now
  runs only with the caller's own right to it. Specs: framework `ResourceOwners` (a service without the contract never called,
  the drive moved through the call), BOSS `AdminLifecycle` (the Mantle-only operator refused Admin's transfer, the step Failed).
- **New owner.** Mantle's `transfer#CalendarOwner` and `transfer#ContactBookOwner` took an external user (`EXTERNAL_USER`) as a
  person-owned calendar's owner or an unowned book's manager; both now refuse one, as the framework's drive and mail changes do.
  `retry#LifecycleStep` refuses the caller as the new owner (`SELF_OWNER`; BOSS's choice already left them out), so an operator
  holding the owner-change permissions cannot hand a leaver's shared mailbox or drive to themselves. Spec: `UserLifecycle`.
- **Retry of an account step.** A removal's account step (`revokeSessions`, `endMemberships`, `endRelationships`) required the
  identity in scope, which a removal leaving no organization takes away, so its operator could not retry it; it now needs the
  operation's organization in scope (as reading it does), and `heldBeyond` again for `revokeSessions` and `endMemberships`. A
  retried `disableAccount` or `endMemberships` is checked against the administration path again (it was only at the start).
  Not covered by a spec (no step of a removal can be made to fail deterministically).
- Checked and left: disable now revokes first (its own transaction) and writes `disabled` through the entity facade with
  `disabled_changeReason` (audit-logged, `enable-audit-log="update"`), as P4's lock does; a future date writes `terminateDate`
  only; a removal ends only that organization's relationships and signs out only when none is left (F100); restore brings
  nothing back; `heldBeyond` refuses an identity operator a global operation on an ADMIN member or a sealed-permission holder;
  the operation key answers a retry; `retry#LifecycleStep` runs only failed or waiting steps and a transfer only its stored
  service; the operation's organization filters and scope (F96: a global operation is under the one organization, no
  leak); Projects' refusals are the step's named failure (F94); LifecycleDetail's one qvt render; specs under 0.2 s each; the
  deny pattern's `transfer` element is 166 characters (the Built note said 205); lint 132 flagged sites, as before.
- Later (provisional): a future-dated disable (or removal) runs its participants' pauses at once, before the date, and its
  transfers may be done before it (none pauses until Insights P7, F101); a Scheduled operation stays Scheduled after its date
  until a step is retried (refreshStatus runs only then); BOSS's Retry transition calls Mantle's retry directly, so a pause step
  is not re-checked against the registry (it runs under its own authorization).
- Tests run (the release binary, `--nobuild`): ResourceOwners, AdminSessions, AdminAccessServices 11 of 11; UserLifecycle,
  StaffIdentity, StaffInvitation, PartyServices, ContactBooks, CalendarServices 71 of 71; AdminLifecycle, AdminUsers,
  AdminAccess, AdminGroups, AdminInvitations, AdminRegistries, ProjectsAccess, Files, MailAccounts, Tasks 81 of 81; lint as
  above; Prettier on the changed JavaScript. Not run: `./moq test-apps`, `./moq test-framework`, the acceptance suite.

### P7 — Organizations and the Constitution

Design §7 Organizations, OrganizationDetail and Constitution (its maps note waits for the framework Maps screen, F22,
§7); ADM-SETTINGS, ADM-CONSTITUTION. In Admin's first release (§4); ends stage 1.

- **IdentityServices** `find#InternalOrganizations` (OrgInternal parties only) and `store#OrganizationParent` (a dated
  PartyRelationship between OrgInternal parties), over `PartyServices.create#Organization`, `ensure#PartyRole`,
  `update#PartyDetail`, ContactServices and the party-setting services; memberships through P4's
  `store#OrganizationMembership`; creating an organization initializes no accounting, membership or secret
  (Accounting's setup action is a SetupLink).
- **The Constitution screen** (design §7, F20): Admin › Settings › Constitution over the built
  `mantle.party.ConstitutionServices` and the framework's `ConstitutionServices` (`edit#ConstitutionDocument`,
  `validate#Constitution`, `preview#ConstitutionPrompt`) and `tools/template/ConstitutionParts.xml`, with the scope
  selector (global for holders of the sealed `ADMIN_CONSTITUTION_GLOBAL`, an internal organization by
  `ORG_CONSTITUTION_EDIT` and Admin's `ADMIN_SETTINGS_MANAGE`), language selector, rules, references, prompt preview
  and reset; the read entry P0 settles; links from OrganizationDetail's Defaults and AgentsHome. The trusted origins
  stay System › Constitution's.
- **Screens:** Organizations (OrganizationFind, OrganizationList, CreateOrganization); OrganizationDetail
  (OrganizationProfile, OrganizationContacts, OrganizationMembers, OrganizationDefaults with registered setting types
  only, SetupLinks from `get#Readiness`); Constitution.
- **Specs:** Mantle `test/party/InternalOrganizations` (a parent only between OrgInternal parties, dated);
  BOSS `AdminConstitution` (an ORG_ZIZI_RETAIL member reads its document without Admin; its delegate edits it and is
  refused ORG_ZIZI_SERVICES' and the global document; a stale hash refused; the one qvt render).
- **Usable when** (design §15.3 "Constitution reading, customization and reset"): ORG_ZIZI_RETAIL's delegate customizes
  its Constitution in Spanish, adds and moves a rule without changing its ID, resets it to the global document, and the
  next Assist run of a member uses each in turn; a member reads it with no Admin group.

**Built Nov 7 (P7).**
- Mantle (`IdentityServices.xml`, appended, over a module of its own, `Organizations.js`; the services fall under the identity
  services' grants, `ALL_USERS` with `MANTLE_USER_ORG` and ADMIN's ALWAYS with `MANTLE_ACTIVE_ORG`):
  - `find#InternalOrganizations` (the OrgInternal parties in scope: Identity.js `scope()`, the find on `mantle.party.InternalOrganization`
    under the call's organization filters, so a delegate's organizations and their child organizations, the administrator's every one with
    none active; text in the query ignoring case, parent; each with its current parent and child count; `everyOrganization`, `canManage`);
  - `get#InternalOrganization` (added: profile and revision, roles, dated parent rows, children, members named for an
    `ADMIN_IDENTITY_VIEW` holder and counted otherwise, registered defaults);
  - `create#InternalOrganization` (added, F103: `PartyServices.create#Organization` with the OrgInternal role, owning itself, and its parent
    from now; the parent in scope, or none only for a caller administering every internal organization, `PARENT_REQUIRED`; no accounting,
    membership, secret or currency);
  - `store#InternalOrganization` (added: name and identifier at the revision read, over `update#PartyDetail` with those fields alone);
  - `store#OrganizationParent` (a dated `PrtOrgRollup` from child to parent, both OrgInternal, `NOT_INTERNAL`, and in scope; `PARENT_CYCLE`;
    the current parent ended at the new one's start and kept; no parent ends it; `PARENT_UNCHANGED`);
  - `store#OrganizationDefault` (added, F104: a setting type registered for OrgInternal (`PartySettingTypeRole`) that is typed or validated
    against the organization's records, at its revision, through `validate#`/`store#PartySetting`; empty removes the organization's own;
    `NOT_REGISTERED`, `OWNER_SETTING`, `VALUE_INVALID`).
  Reads `ADMIN_SETTINGS_VIEW`, changes `ADMIN_SETTINGS_MANAGE` (design §1.1's configuration administrator), each through ProductAccess `has`;
  memberships stay `store#OrganizationMembership`'s.
- BOSS:
  - Screens: `Admin/Settings.xml` gains Organizations (menu 2), Constitution (menu 3) and OrganizationDetail (contextual);
    `Settings/Organizations.xml` (OrganizationFind, OrganizationList with each organization's setup checks to do from `get#Readiness`,
    CreateOrganization); `Settings/OrganizationDetail.xml` (record header with the Constitution link; Profile with Change parent and the
    parent history; Contacts, the primary address, phone and email through `get#`/`store#PartyContactInfo` after `check#Record` with
    `settingsManage`, the contact ids read on the server; Members, named and changed for an identity operator, counted for others; Defaults
    with the organization's Constitution source and where members read it; Setup, `get#Readiness` for the organization with fix links);
    `Settings/Constitution.xml` (scope and language, source banner with hash and last change, `m-constitution-view`, Customize and Reset,
    the document, rules, references and languages editors on `edit#ConstitutionDocument` saved whole with the hash read, the prompt
    preview, the Origins link for ADMIN; the instance scope's source is `ConstitutionParts.xml`'s `ConstitutionSource`).
  - `Admin.js`: the `organizations` area (`Settings/Organizations`); links `Settings/Organizations`, `Settings/OrganizationDetail`,
    `Settings/Constitution`; the organization record kind's destination; the palette's organizations (the organizations administered, by
    name or identifier, for `settingsView`; a search find may now name its own capability); the `staffPeople` choice (the staff in identity
    scope, for AddMember). `Registry.js`: the organization Constitution check's fix link opens Settings › Constitution in that scope.
  - `Admin.xml`: the palette source is "Admin users, groups and organizations". AgentsHome: the Constitution row first in its links.
  - `data/BossSetupData.xml` (appended): `BOSS_ADM_ORGANIZATIONS` (the three screens; DENY `BOSS_ADMIN`, ALWAYS `BOSS_ADMIN_CONFIGURE` with
    `MANTLE_USER_ORG` and `BOSS_ADMIN_ADMIN` with `MANTLE_ACTIVE_ORG`, each with `MANTLE_PRIVATE_CONTACT`); `ORG_CONSTITUTION_EDIT` to
    `BOSS_ADMIN_CONFIGURE` and `BOSS_ADMIN_ADMIN` with their bundle rows (design §1.1: organization Constitution edits are the
    configuration administrator's); the settings index entries `admin.organizations` and `admin.constitution` (Company,
    `ADMIN_SETTINGS_VIEW`). No new `ironstone` service, so the client deny pattern is unchanged; BossUsersDemoData unchanged:
    `admin.configure` (a Retail agent) is Retail's Constitution delegate.
- Members read their organization's document in the Assist drawer's Rules pane (F46); no read entry is built in Admin. OrganizationDetail and
  the Constitution screen say so, as the pane has no link that opens it (F106).
- Specs: Mantle `test/party/InternalOrganizations` (4 features, 0.5 s: the operator creates a child of its organization and finds both, not
  another, is refused a top-level one and one under another organization, a member without the permission refused; a parent only between
  internal organizations, never a cycle, dated with the earlier one ended and kept, the moved child out of the operator's scope; the profile
  and the invoice store default at their revision, an unregistered and an owner's default refused). BOSS `test/Admin/AdminConstitution`
  (3 features, 0.4 s: Retail's delegate saves Retail's own document through the screen's transition, a second change with the earlier hash
  refused, Services' document (screen `RECORD_UNAVAILABLE`, Mantle `ORG_CONSTITUTION_EDIT`) and the instance's (`ADMIN_CONSTITUTION_GLOBAL`)
  refused; a Retail member in no Admin group reads it as the Rules pane does, without agent instructions, and is refused the screen; the
  screen's one qvt render), `test/Admin/AdminOrganizations` (2 features, 0.5 s: OrganizationDetail's one qvt render as Retail's
  configuration administrator; its organizations and palette Retail's, never Services', whose detail is not available; the reader opens
  neither; a contact change on Retail's child organization stored and on Services' refused), `AdminAccess` (the `organizations` capability:
  the configuration administrator, the administrator and ADMIN, no one else). Acceptance, written and not run:
  `test/acceptance/Admin/AdminConstitutionUsable` (3 features, the "usable when").
- Tests run (release binary, `--nobuild`, this worktree's runtime): InternalOrganizations, PartyServices, Constitution, StaffIdentity,
  StaffInvitation 33 of 33 (mr-mantle 3.5 s); AdminConstitution, AdminOrganizations, AdminAccess, AdminRegistries, AdminUsers, AdminGroups,
  ProjectsAccess 29 of 29; `moqui lint --screens` 132 flagged sites, as before. Organizations (qvt, tui), OrganizationDetail (tui; qvt and
  html as the administrator, Services' included), Constitution (tui, html; the instance scope in qvt as the configuration administrator and
  in qvt and tui (es) as ADMIN; Services' scope not available), AgentsHome and SettingsHome (html) rendered once by hand without errors, not
  kept. Prettier clean on the new and changed JavaScript. Not run: `./moq test-apps`, the acceptance suite.
- Inventories: ss-inventory FindVendor (FindVendor, CreateVendor, VendorList), EditVendor (EditVendor, PaymentInfo, BillingInfo,
  SetVendorRepForm; RoleList not carried), EditUsers (AddUserRelationshipForm, UpdateUserRelForm) and EditParty (EditOrganizationForm,
  AddSettingForm, AddSettingTextForm, SettingsForm) implemented in Admin › Settings.
- Design edits: design-admin §7 Organizations, OrganizationDetail and Constitution (as built), §13 AgentsHome (the Constitution row), §17.2
  (the four added Mantle services).
- Findings (provisional, numbered by the lead):
  - **F103** A parent relationship gives scope: `get#PartyInternalOrgIds` counts a member organization's direct children, so setting
    the parent of an organization the caller does not administer would adopt it (and its records) into the caller's scope, and a new
    organization with no parent would be outside the delegate's. Built: `store#OrganizationParent` needs both organizations in scope, and
    creation is one Mantle service (`create#InternalOrganization`) that writes the party and its parent together; a top-level organization
    only for a caller administering every internal organization.
  - **F104** No setting type registered for internal organizations is a plain typed default: the print template locations name server
    resources the printer runs (ADMIN's, in Tools), the gateway configuration ids are Connections' (P11), Projects' are JSON its Settings
    validates, and the invoice store must be one of the organization's stores. OrganizationDefaults lists them all and changes the typed
    ones and the invoice store (validated in Mantle); the others are "set where they are used".
  - **F105** Mantle's Constitution access is membership (`get#PartyInternalOrgIds`), not §4's entity filters: the administrator
    (`MANTLE_ACTIVE_ORG`, every organization) reads and changes only the documents of organizations it works in, and the Constitution screen's
    scopes and OrganizationDetail's Constitution source show only those (as F52 for Health). Aligning Mantle's organization Constitution
    access with the filters (as identity scope was) is the user's call.
  - **F106** (framework) The Assist drawer opens on `?assist=<conversationId>` only; nothing opens its Constitution / Rules pane from a
    link, so OrganizationDetail cannot link "read it as members do". An ask: a parameter or link action opening the pane.
  - **F107** (framework) `ConstitutionParts.xml`'s ConstitutionLanguage form submits the language alone to `.` and ConstitutionSource
    describes only the instance document, so a screen with its own scope cannot reuse them; Admin's Constitution has one scope-and-language
    form and its own organization banner, reusing ConstitutionSource for the instance scope.
  - **F108** `get#PartyContactInfo` finds an email, phone or address only for a purpose named in the call (`defaultToPrimaryPurpose`
    applies only then); OrganizationDetail names PostalPrimary, PhonePrimary and EmailPrimary.
  - **F109** Mantle's `mantle.party.ConstitutionServices` have no service grant of their own, so they are reached under a screen's
    inherited grant (Admin's) or with authorization off; a direct call with authorization on is "not authorized". Readers use the framework's
    `get#Constitution` and its provider, so nothing is affected; noted for other callers.
- Decisions (§4 rows added): organizations by `ADMIN_SETTINGS_VIEW`/`_MANAGE`; creation and parents in Mantle with both ends in scope;
  registered defaults; the three screens in one area group with `ORG_CONSTITUTION_EDIT` for the configuration administrator and the
  administrator; members read in the Rules pane.
- For the lead:
  - budget shares: mr-mantle about 0.5 s (InternalOrganizations); mr-boss about 0.9 s (AdminConstitution 0.4 s, AdminOrganizations 0.5 s;
    AdminAccess unchanged in cost); no budget raised;
  - merge with P6: `IdentityServices.xml` and `BossSetupData.xml` appended at their ends; `Admin.js` gains rows in `areas`, `linkPaths`,
    `recordKinds.organization`, `searchFinds` and `choiceSources` (and `search` reads a find's own `need`); `Admin.xml` changes its comment
    and the palette source's label; `Settings.xml` its subscreens; BossUsersDemoData and MantleSetupData unchanged;
  - F105 is the user's call; F106 and F107 are framework asks;
  - the acceptance AdminConstitutionUsable to run when asked.

**Review Nov 7 (P7).**
- Checked: Mantle `Organizations.js` and the six services against §4's Nov 7 rows (visibility by screen authz and the organization
  entity filters through views); F103 (both organizations in scope for a parent, cycle refused, the earlier parent ended and kept,
  never deleted; top-level creation only for a caller administering every organization); `store#OrganizationDefault` (registered
  OrgInternal types only, typed or record-validated, `store#PartySetting` running `validate#PartySetting`; template locations and
  gateway configuration ids are not typed, so they stay `OWNER_SETTING`); OrganizationContacts (the contact ids read on the server
  after `check#Record` with `settingsManage`); members named only for `ADMIN_IDENTITY_VIEW`; the Constitution screen (the instance
  document editable only with `ADMIN_SETTINGS_MANAGE` and the sealed `ADMIN_CONSTITUTION_GLOBAL`, which the framework's
  `store#`/`reset#Constitution` check again; a stale hash refused on save, customize and reset; the trusted origins only linked to
  System's Origins); the prompt preview (the framework's `preview#ConstitutionPrompt` answers any signed-in user for a scope they can
  resolve, so the screen shows nothing the viewer could not get from the service; an organization's only when Mantle lets the viewer
  read it); `BOSS_ADM_ORGANIZATIONS` (ALWAYS, inheritable, on three screens whose transitions call fixed services; the `choices`
  transition's sources each check their own capability, F-P2-7's pattern holds); the `ORG_CONSTITUTION_EDIT` grants and bundle rows;
  the settings index entries; specs and docs.
- Fixes:
  - **R1 (F105, F52; following §4's Nov 7 decision)** Mantle's organization Constitution access was membership alone, so the
    administrator read and changed only the documents of organizations it works in. `check#OrganizationConstitutionAccess` now also
    reads for an organization the caller administers: in the find on `mantle.party.InternalOrganization` under the organization filters
    of the call's authorization (Identity.js `administered()`, the same find as identity scope), so the administrator
    (`MANTLE_ACTIVE_ORG`) has every organization with none active and the active one with one, the configuration administrator
    (`MANTLE_USER_ORG`) its organizations and their child organizations. Changing needs `ORG_CONSTITUTION_EDIT` for an organization so
    administered when the call carries organization filters (an `ADMIN_CONSTITUTION_GLOBAL` holder or member with another organization
    active is refused it), and the earlier membership rule only when it carries none (a direct call). The Admin screens' own checks
    (`ADMIN_SETTINGS_MANAGE`, `check#Record` organization) are unchanged. Members' reading (the provider `get#ScopedConstitution`, the
    Rules pane) keeps membership; the provider passes `readOnly`, so under the agent read fence the filtered find uses the organization
    context already in the user context and never sets it up (which may clear a stale active-organization preference, a write). F52's
    organization Constitution check in Health and OrganizationDetail's Constitution source follow with no Registry change: under an
    Admin screen's grant Mantle answers for every organization the viewer administers. mr-mantle fcdea9c3.
  - **R2 (medium, F103)** `store#OrganizationParent` with no parent let a delegate make its child organization top-level, out of the
    scope of the parent's administrators (the same effect creation refuses). Ending a parent now needs a caller administering every
    internal organization (`PARENT_REQUIRED`). A change while a later-dated parent row exists is refused (`PARENT_SCHEDULED`) instead
    of leaving two parents from that date. mr-mantle fcdea9c3.
  - OrganizationDetail's "not readable" text no longer says membership; the Constitution screen's, Registry's and design §7's as-built
    notes say the filters; the InternalOrganizations spec's Run line.
- Tests (release binary, `--nobuild`, this worktree's runtime): AdminConstitution gains a feature (the administrator, an agent of
  Retail alone, changes Services' document through the screen's transition with no active organization and is refused it with Retail
  active; it fails without R1), InternalOrganizations a case (the operator refused ending its child's parent). InternalOrganizations,
  PartyServices, Constitution, StaffIdentity, StaffInvitation 33 of 33 (mr-mantle 4.6 s); AdminConstitution, AdminOrganizations,
  AdminAccess, AdminRegistries, AdminUsers, AdminGroups, AdminInvitations, ProjectsAccess, AppOrganizationFilters 39 of 39 (P7's features
  each under 0.3 s; AdminAccess's and ProjectsAccess's slower features are earlier phases'); `moqui lint --screens` 132 flagged sites,
  as before. Not run: `./moq test-apps`, the acceptance suite.
- For the lead:
  - mr-moqui `docs/ai/Constitution.md` (the table's "an organization the user works in") should add the administrative path
    (not in this worktree);
  - the Constitution screen asks `check#OrganizationConstitutionAccess` once per organization administered, each setting up the
    organization context and running the filtered find: fine for a handful, worth one batched call if an instance has many;
  - Admin.js `scope()` (`ownerIds`: filterOrgIds kept to the user's organizations) and Mantle's filtered find can differ for a delegate
    with child organizations; the palette's organizations and the Constitution screen's scopes use the former, the services the latter.

- **Gate 1 suites (Nov 7, on master after Admin P1–P7, Insights P1–P5, the framework follow-ups and every review merged,
  the release binary rebuilt; nothing else running):** `./moq test-framework`: every spec feature passed; cargo failed
  only F38's known test (failing on master before this build); the framework's server specs 10.8 of 12 s, tools 2.6 of
  3 s, basic-comms 5.0 of 8 s; webroot's client specs 46.9 of 44 s, over its budget on a quiet run too (it was 45.9 s in
  Wave 1, before any Admin or Insights change reached webroot; Insights P2 added one browser case), so the budget is the
  user's call and not raised here. Standalone mr-mantle 1,934 passed, 2 failed (the baseline WorkTimeEntries and
  WorkTimesheets), 11 skipped. `mail_capture_sends=true ./moq test-apps` 3,394 server and 19 client features passed, none
  failed; feature time mr-mantle 353.0 of 393 s, mr-boss 206.2 of 264 s server and 54.9 of 57 s client, mr-pass 14.4 of
  20 s, within every budget, so none raised. `moqui lint --screens` 132 sites, as before. The acceptance tests each
  phase wrote are not run (two were changed and run alone in review: AdminInvitationsUsable, InsightsHomeUsable with
  InsightsDatasetsUsable); `./moq accept mr-boss` is owed for them when asked.

- **Acceptance (Nov 7, after gate 1):** `mail_capture_sends=true ./moq accept mr-boss` on master (branch `adm/accept`), the
  first run of the acceptance tests the Admin and Insights phases wrote: server 517 features, 68 passed, 52 failed, 397
  skipped, 105 setup or cleanup failures; client 172, 170 passed, 2 failed. The cascade: AdminGroupsWalk's last feature
  gave john.doe a TOTP factor and set ADMIN's `requireAuthcFactor` and then signed in again with a password, which a
  factor refuses, so its cleanup (also a password login first) never put them back and every later spec's
  `login("john.doe")` failed with "a second factor is required"; the walk now signs in by `internalLoginUser` (as one who
  passed the factor) and restores the factor state in a `finally` and in a cleanup that restores before it logs in. With
  that, the rest were spec bugs, none a product bug but Insights F74: AdminGroupsWalk's second feature began with the
  first's membership still current (ended tomorrow by design), so it now starts from none; AdminFoundationWalk took the
  palette source's outright refusal for a failure (refused or no rows now both pass); AdminUsersUsable signed shared.staff
  in by password after giving it a factor (now `internalLoginUser`), found its users in an unfiltered page of 50 by name
  (now by username) and reset a demo identity with no email address (Identity.js NO_EMAIL; the spec gives it one and
  takes it back); AppStructure's placeholder floor 39 to 30 (Admin's Home, Users, Settings, Data, Integrations and
  Organizations, Insights' Home, Settings and FlowMap replaced); InsightsFoundationWalk read P1's Home empty text, which
  P5 replaced, and found insights.admin's Report builder failing (F74, fixed); InsightsDashboardsUsable expected no
  "No data" anywhere though P3 admitted the Commerce panels' datasets (now the orders panel alone, which says not
  available), could not save its copy because the served demo leaves `mantle-sales-orders` waiting for review (F41: the
  steward now admits it in the walk) and filled "Copy title" for "Title" (exact label). Two were time of day, not this
  build: CustomerServiceAssignmentWalk's agents work on the team's weekday hours (CS P4), so on a Saturday evening neither
  was in hours (the walk now gives them an around-the-clock calendar and puts them back), and CustomerServiceOrdersWalk
  computed StockAtDate's day under two users' zones, a day apart after 18:00 Chicago (now once). ManufacturingScheduleWalk's
  drag (the dialog still fading in when its buttons were counted) failed once and passed on both reruns, unchanged.
  Fixed in mr-boss on `adm/accept` (one commit, "Admin and Insights acceptance: ..."). Final: server 517 of 517 passed,
  client 172 of 172; the regression InsightsAccess and InsightsDashboards pass; `mail_capture_sends=true ./moq
  test-apps` 3,394 server and 19 client features passed; `moqui lint --screens` flags nothing in Insights.

### P8 — Instance settings, localization and reference data

Design §7 InstanceSettings, Localization and ReferenceData; ADM-SETTINGS.

- **Framework `org.moqui.admin.ConfigurationServices`'** settings part: `get#EffectiveSettings` (masked effective
  configuration with its key, source and restart effect) and `store#InstancePreference` over a new framework
  `InstancePreference` record (registered keys only, each with its type, allowed values, default and scope; changed by
  and when; no arbitrary key, JSON or secret); `store#LocalizedMessage` and `store#LocalizedEntityField` (registered
  label targets, placeholders validated).
- **The first registered preferences:** design §7's presentation defaults, the new-device sign-in window (design §19
  Q6, used by P10) and the group-recipient ceiling Insights reads (design-insights §7.1).
- **Screens:** InstanceSettings (InstancePresentation, ConfigurationSources); Localization (LocalizationFind,
  MessageTranslations, EntityTranslations) for the configuration administrator without `ADMIN`; ReferenceData (the
  settings index's reference kinds, as owner links).
- **Specs:** framework `AdminConfiguration` (an unregistered key refused; a value outside its allowed set refused; a
  secret-classified key never returned); BOSS `AdminSettings` (InstanceSettings' one qvt render).
- **Usable when:** `admin.configure` sets the instance display name and time zone and sees which values come from
  configuration and need a restart; translates a message with its placeholder kept; ReferenceData sends a unit change
  to Products.

**Built Nov 10 (P8).**
- mr-moqui (no Rust; the shared release binary):
  - `entity/ServerEntities.xml` (appended): `moqui.server.InstanceSetting` (the registry: key, title, group, value type, allowed values,
    limits, default, conf property, editable, secret, restart, manage permission, operator note; the `InstanceSettingValueType`
    enumerations), `moqui.server.InstancePreference` (the value, audit-logged, with who, when and why) and
    `moqui.basic.LocalizedLabelTarget` (a label that may be translated).
  - `service/org/moqui/admin/ConfigurationServices.xml`, organized in parts for P10 to P13 to append: a section per part, its bodies
    in a module of its own beside `ConfigurationLib.js` (finds, revision, permission checks, refusals, the audit row, paging).
    - Settings (`ConfigurationSettings.js`): `get#EffectiveSettings` (each registered setting with its value, source: preference,
      configuration or default, whether it is changed here and by the caller, restart effect, operator note, and a preference's
      revision and last change; a secret masked, only `valueSet`; `ADMIN_SETTINGS_VIEW`); `get#InstancePreference` (added: one
      registered preference's effective value and `numberValue`, for the code that uses it; no permission, a preference being
      nonsecret by registration; the module also exposes `value(key)` to scripts); `store#InstancePreference` (a registered
      preference only, typed and within its allowed values and limits, at the revision read, empty removing it;
      `NOT_REGISTERED`, `VALUE_INVALID`, `STALE_REVISION`; `ADMIN_SETTINGS_MANAGE` and the setting's own permission).
    - Localization (`ConfigurationLocalization.js`): `find#LocalizedMessages` and `find#LocalizedEntityFields` (added: a page by
      locale and text, or what is missing in a locale), `store#LocalizedMessage` and `store#LocalizedEntityField` (exactly the
      original's `${}` placeholders, a locale that is one, the revision read, empty removing it; a label only for a registered
      target the definitions bear out; `PLACEHOLDER_MISMATCH`, `LOCALE_INVALID`, `NOT_REGISTERED`, `LABEL_UNAVAILABLE`,
      `STALE_REVISION`); each change writes its own audit row.
  - `data/AdminConfigurationData.xml` (new, named in MoquiDefaultConf's `load-data`): `AdminConfigurationServices` (ALL_USERS, an
    inheritable ALLOW naming the seven services); the preferences `instance.displayName`, `instance.defaultLocale`,
    `instance.defaultTimeZone`, `signin.newDeviceWindowDays` (90, 1 to 730) and `report.groupRecipientCeiling` (200, 1 to 500);
    eight deployment values shown read only (purpose, locale, server and database zones, public host, HTTPS, largest upload,
    telemetry); the label targets (enumeration, status, unit and place names and their types).
  - `docs/security/Attack-Surface.md`: the configuration services' paragraph.
- BOSS:
  - Screens: `Admin/Settings.xml` gains InstanceSettings (menu 4), Localization (5) and ReferenceData (6).
    `Settings/InstanceSettings.xml` (InstancePresentation: the preferences, each with its Change dialog, a drop-down from the
    `valueOptions` transition for a choice, locale or time zone; ConfigurationSources: every setting with its key, value, source,
    where it is changed, when it takes effect and the operator's note; Open the conf for `ADMIN`); `Settings/Localization.xml`
    (LocalizationFind: messages or labels, kind of label, locale, text, missing; MessageTranslations and EntityTranslations with a
    dialog per row, New translation, paging by the service); `Settings/ReferenceData.xml` (ReferenceFind, ReferenceOwners over
    `find#Settings` for the Reference data group). Home shows the instance name when one is set.
  - `Admin.js`: links `Settings/InstanceSettings`, `Settings/Localization`, `Settings/ReferenceData`. No new `ironstone` service,
    so the client deny pattern is unchanged.
  - `data/BossSetupData.xml` (appended): InstanceSettings and Localization added to `BOSS_ADM_ORGANIZATIONS`; the index entries
    `admin.instanceSettings`, `admin.localization` (`ADMIN_SETTINGS_VIEW`) and `admin.referenceData`; the index group
    `AdmSgReference` and eleven reference kinds (Products' units and identification types; Accounting's currencies, payment terms
    and tax; Customer Service's case types and status categories; Projects' work item types and workflows; Manufacturing's reason
    codes; Tools' status flows). BossUsersDemoData unchanged.
- Specs: framework `test/AdminConfiguration` (4 features, 0.2 s: an unregistered key, a configuration key, a value outside its
  allowed set or limits refused and nothing written; a stale revision refused; each value and the removal in the audit log; a
  secret-classified setting never returned, a secret made editable left out; a deployment value with its source and restart
  effect; a user without the permissions refused every read and change but `get#InstancePreference`; a translation that drops or
  adds a placeholder refused; a label only for a registered target the definitions bear out). BOSS `test/Admin/AdminSettings`
  (3 features, 0.6 s: InstanceSettings' one qvt render as the configuration administrator; a preference and a translation
  changed through the transitions, an unregistered key and a dropped placeholder written nowhere, the reader opening neither
  screen; ReferenceData linking Products' units for ADMIN and not for the configuration administrator). `AdminRegistries`
  changed: the reader's index now holds `admin.referenceData`, and the Instance group Admin's three entries. Access: the
  screens fall under P7's `organizations` capability (AdminAccess unchanged); the holder and non-holder are in AdminSettings and
  AdminConfiguration. Acceptance, written and not run: `test/acceptance/Admin/AdminSettingsUsable` (3 features, the "usable when").
- Tests run (release binary, `--nobuild`, this worktree's runtime): framework AdminConfiguration, AdminAccessServices, AdminSessions
  13 of 13; mr-boss AdminSettings, AdminAccess, AdminRegistries, AdminOrganizations, AdminConstitution, AdminUsers, AdminGroups,
  ProjectsAccess 34 of 35, the one failure AdminRegistries' two index expectations, then AdminRegistries and AdminSettings 8 of 8
  with them changed; `moqui lint --screens` 132 flagged sites, as before. InstanceSettings
  (qvt, tui), Localization (qvt with missing labels, tui), ReferenceData (qvt, tui), Home and SettingsHome (html) and the
  `valueOptions` transition rendered once by hand without errors, not kept. Prettier clean on the new JavaScript. Not run:
  `./moq test-framework`, `./moq test-apps`, the acceptance suite; no cargo test (no Rust changed).
- Inventories: none (design §15.2 traces Tools' Localization forms; ss-inventory and usl-inventory have no row for them).
- Design edits: design-admin §7 InstanceSettings, Localization and ReferenceData (as built), §17.2 (the ConfigurationServices
  row, the InstancePreference record), §19 Q6; design-insights §7.1 (the ceiling's key and how it is read).
- Findings (provisional, numbered by the lead):
  - **F110** The conf's own view (`org.moqui.dev.ComponentServices.get#ConfView`: file, line and live/apply/restart class of each
    value) is Rust and for the `ADMIN` group alone, and scripts read a property's value only (`System.getProperty`). Built:
    deployment values are registered rows (`InstanceSetting`, `editable` N) naming a `default-property`, their restart effect and
    operator note registered, their source "default" when the value equals the shipped MoquiDefaultConf's and "configuration"
    otherwise (not which file or the environment); `ADMIN` is linked to System › Conf. P10's EffectiveSignInPolicy needs conf
    attributes (`user-facade` `password`, `login`), which a property registration cannot name: a framework ask (a masked
    projection of named conf attributes for `ADMIN_SETTINGS_VIEW`), or P10 registers what it shows another way.
  - **F111** Nothing reads an instance default for a person with none: the session's locale and time zone fall back to the conf
    properties read at start (l10n.rs `server_time_zone`, also the zone the server reads timestamps in), and Mantle's
    `create#StaffAccount` and invitation acceptance set neither. `instance.defaultLocale` and `instance.defaultTimeZone` are
    registered, stored and shown, and read by nothing yet; applying them (new accounts, or the session fallback apart from the
    server's zone) is a framework and Mantle follow-up. `instance.displayName` is read by Admin Home only.
  - **F112** Design §7's approved theme and logo and date and number formats are not registered: the shell reads no instance
    value of them (themes are `UserGroupScreenTheme` rows, an owner store), so a preference would do nothing.
  - **F113** Framework seed data is loaded only when MoquiDefaultConf's `load-data` names its file; the new file adds a line
    there (the plan's "append to framework seed data" would otherwise have meant SecurityTypeData).
  - **F114** `LocalizedMessage` and `LocalizedEntityField` are not audit-logged, and turning the audit log on would write a row
    for each of the thousands a data load (mr-l10n) writes; the services write the audit row of each delegated change, and
    Tools' direct writes stay unaudited.
  - **F115** Scripts cannot list the localized fields of every entity cheaply (`getEntityDefinition` builds the whole definition,
    about 6 ms each), and a localized field may be on a business entity (Mantle's `ProductFeature`, owner-scoped). Built: label
    targets are registered rows checked against the definition (localized, unencrypted, a configuration entity, one key), so
    translation access never reads a business record; Products' features stay Products › Translations'.
  - **F116** A translation is shown wherever its original is, and where the original's `${}` is expanded the translation's
    would be too (not traced through every widget), so a translator adding one could run an expression: the stores require the
    placeholder sets to be equal (stricter than "kept").
  - **F117** ReferenceData's kinds are settings entries, so they also show in SettingsHome under a fourth group, and the reader's
    index is no longer empty (it holds Admin's reference data landing, which lists the reader no kind).
- Decisions: settings are seed rows of two kinds in one registry, with secrets refused by flag and by name; a preference falls
  back to the conf property it names, then its default; `get#InstancePreference` needs no permission; an empty value removes a
  preference or a translation; label targets are registered and checked against the definitions; InstanceSettings and
  Localization join `BOSS_ADM_ORGANIZATIONS` (no new capability), ReferenceData is every Admin user's; reference kinds are a
  fourth group of the settings index.
- For the lead:
  - budget shares: framework about 0.2 s (AdminConfiguration); mr-boss about 0.6 s (AdminSettings); no budget raised;
  - merge: mr-moqui `ServerEntities.xml` appended at its end, one `load-data` line added after SftpDemoData's in
    MoquiDefaultConf, the rest new files; mr-boss `BossSetupData.xml` appended at its end (Insights P6 appends there too),
    `Admin.js` `linkPaths` rows, `Settings.xml` subscreens, `Home.xml` (one service call and a label), `AdminRegistries.spec.js`
    (two expectations), `design-insights.md` §7.1 (one sentence, the other app's design, as the phase's ceiling calls for);
  - Insights P7 reads the ceiling with `org.moqui.admin.ConfigurationServices.get#InstancePreference`
    (`settingKey: "report.groupRecipientCeiling"`, `numberValue`), from Rust by a service call or by the two rows
    (`InstancePreference.preferenceValue`, else `InstanceSetting.defaultValue`); P10 reads `signin.newDeviceWindowDays` the same way;
  - P10 to P13 append a section to `ConfigurationServices.xml`, a module beside `ConfigurationLib.js`, their services' names to
    a grant of their own in `AdminConfigurationData.xml` (never a pattern over the file) and their settings rows there;
  - the user's call: F111 (where the default locale and time zone apply) and F112 (theme, logo and formats: build with a
    reader, or drop from design §7); whether reference kinds belong in SettingsHome's list (F117); F110's framework ask;
  - the acceptance AdminSettingsUsable to run when asked.

**Review Nov 10 (P8).** A fresh review of both repositories' P8 diffs, security first; fixes committed apart per repository
("Admin P8 review: …").
- Checked: `get#EffectiveSettings` (`ADMIN_SETTINGS_VIEW` or `_MANAGE`, checked in the service; each row a registered
  `InstanceSetting`; a value read only through the property its registration names; a secret answered as `value` null,
  `defaultValue` null and `valueSet`; the eight registered deployment values against MoquiDefaultConf: purpose, locale, the two
  zones, public host, HTTPS, largest upload and telemetry, none marked `is-secret` or holding a credential); `get#InstancePreference`
  (no permission: only a registered row with `editable` Y, which the registry refuses for a secret by flag or name, so nothing
  but a nonsecret registered preference; not remote, and an anonymous caller has no authorization for it);
  `store#InstancePreference` (`ADMIN_SETTINGS_MANAGE` and the setting's own permission; registered and editable only; type,
  allowed values and limits; the revision before any write; who and when on the row, each value and the removal in the audit
  log; a stored value a narrowed registration no longer accepts passed over); the localization stores (a registered target
  the definitions bear out: localized, unencrypted, a `use="configuration"` entity with one key; the label read only by that
  key; the finds under `ADMIN_SETTINGS_VIEW` and only over registered targets); the `AdminConfigurationServices` grant (the
  seven services by name, never a pattern over the file; inheritable as gate 1's, the bodies calling fixed entities only); the
  BOSS screens (`BOSS_ADM_ORGANIZATIONS` denies the root group and allows the configuration administrator and the
  administrator; `storePreference`, `storeMessage`, `storeLabel` and `valueOptions` each call one fixed framework service that
  checks its own permission; ReferenceData reads `find#Settings`, which shows an entry only to a viewer its destination opens
  to, and changes nothing; Home's `get#InstancePreference` of the display name); the eleven reference kinds' screen paths
  (each exists); the `load-data` line and the seed file (no Mantle or BOSS entity, service or group; the plan references are
  comments, as gate 1's); the specs' renders.
- Fixes:
  - **R1 (medium, security)** A translation is expanded wherever its original is (`expand_localized`: the text is localized,
    then run as a template literal), and the stores compared placeholders found by a pattern (`${` to the first `}`), which is
    not how the expander finds them (`scan_expression`: strings, nested braces, templates, comments, regular expressions).
    For an original whose value has a `}` inside it (`${ok ? '}' : no}`), a translation could keep "the same" placeholder and
    add an expression after it that the server would run as whoever reads the screen. `ConfigurationLocalization.js`
    `placeholders` now reads the values as the expander does for plain ones (names, paths, calls, quoted text, balanced `(`
    and `[`; an escaped `\${` is text) and refuses a text with any other (`PLACEHOLDER_UNSUPPORTED` for the original, which
    stays Tools'; `PLACEHOLDER_MISMATCH` for the translation).
  - **R2 (medium, security)** The framework localizes a link's `url` and `url-type` before it expands them (urls.rs
    `make_url_by_type`, `url_type_of`, as Java), so a translator could "translate" `${url}` or `transition` and send every
    such link of a locale elsewhere. The stores refuse an original that is a link, a path or a link type, and a translation
    that is a link or a path (`://`, a leading `/`, `\`, `./` or a scheme). A translation of a relative url that holds words
    can still be changed to another relative path: see For the lead.
  - **R3 (low, secrets)** A setting was secret by its own flag or by its property's name (pass, pw, key, secret, token,
    credential), but the conf marks secrets whose names do not read as one (`fcm_service_account`, `cluster_tls_cert`), which
    a registration naming them would have returned. `ConfigurationSettings.js` now also reads the shipped conf's `is-secret`
    marks (one parse with the shipped values, attributes in any order) and masks those properties.
  - **R4 (low)** A text preference with `${` in it is refused (`VALUE_INVALID`): the value is shown, never run, whatever
    screen shows it later.
  - **R5 (low)** `find#LocalizedEntityFields` read at most 2,000 translations and did not say when it stopped; it sets
    `truncated` now, as the "missing" search does. The services file's comment named the wrong data file; a comment in the
    framework seed file named Insights.
  - **R6 (spec leanness)** `AdminSettings` rendered ReferenceData twice in html; the configuration administrator's case now
    reads the list's service (`find#Settings`, the Reference data group), one render left.
- Tests (release binary, `--nobuild`, this worktree's runtime): framework `AdminConfiguration` 4 of 4 (0.2 s; added cases: the
  kept-and-extended placeholder, an unsupported original, a link as a translation, the conf-marked secret, `${` in a text
  preference); mr-boss `AdminSettings` and `AdminRegistries` 8 of 8 (AdminSettings 0.7 s). Prettier clean. Not run: the full
  suites, the acceptance suite.
- For the lead:
  - **F118 (framework ask, the user's call)** The sound fix of R2 is in the framework: do not localize a link's `url` and
    `url-type` (or localize only texts), which departs from Java; until then a holder of `ADMIN_SETTINGS_MANAGE` can still
    retarget, within the app, a relative url whose text has words (`editItem?id=${id}`), for one locale. Tools' Localization
    (`ADMIN`) writes any translation, as before.
  - F114 stands: translations written by Tools or a data file are not audited; only the delegated services' changes are.
  - `InstanceSetting`, `InstancePreference` and `LocalizedLabelTarget` are plain entities: whoever may write them directly
    (`ADMIN`, Tools' entity screens, a data load) registers settings and targets; the services trust the registry and check
    each row against the definitions and the secret rules when read.
  - A reason code was added (`PLACEHOLDER_UNSUPPORTED`); design-admin §7 Localization says so. No budget raised.

### P9 — Capabilities and row rules

Design §5 Capabilities and RowRules; ADM-ACCESS.

- **Capabilities** over P3's registry: the matrix with a list twin for phones and the terminal, launcher, view,
  mutation, export and sensitive-field rows apart, through `preview#Grants` and `apply#Grants`; unsupported artifact
  rules read only.
- **`AccessServices.get#ScopeRules`** (EntityFilterSet and ArtifactAuthzFilter, with their source) and the
  SupportedScopeBinding through `apply#Grants`, registered filter sets only; arbitrary filter expressions stay Tools.
- **The access and grant review** (design §16): print and CSV from the same projection, sealed and secret values left
  out.
- **Specs:** BOSS `AdminCapabilities` (a launcher grant implies no view or edit; the matrix and its list agree).
- **Usable when:** `admin.access` gives a custom group the Warehouse reader bundle with its organization filter and
  prints the review; an unsupported artifact rule shows read only.

**Built Nov 10 (P9).**
- mr-moqui (no Rust; the shared release binary):
  - `service/org/moqui/admin/AccessServices.xml` (appended) with a new module `AccessCapabilities.js` beside `Access.js`, which now
    gives it its helpers (`lib`): three read projections, each `ADMIN_ACCESS_VIEW`, writing and evaluating nothing.
    - `get#Capabilities` (added: the matrix's one read; the design names only `preview#Grants` and `apply#Grants`): the registered
      capabilities of an app as rows, one per launcher binding and per permission by its kind (launcher, view, edit, export,
      sensitive), against at most 8 groups (an app's first 6 registered bundles when none are named); each cell granted,
      scheduled, none or advanced (another authorization type on the artifact group), a launcher's bound filter sets and whether
      a registered one is missing, whether the actor may grant or end it and why not, and the change proposed for it; `cellList`
      the same cells one a row (the list twin); `unsupportedList` what the groups hold that no registered bundle describes.
    - `get#ScopeRules`: each `EntityFilterSet` bound to a group's `ArtifactAuthz` with its source (`registered`: the group's own
      bundle; `bundle`: another registered bundle names it, as a grant copies it; `configuration`: seed data or Tools), a page by
      group, artifact group, filter set, state and source; the registered sets a registered binding lacks (`missing`, with
      `canBind` and the group's grant revision); every filter set with the entities it narrows. No `filterMap` or `applyCond`.
    - `get#GrantReview` (added): up to 60 groups (named, or an app's bundles) as of a date and time: permission grants open
      then, app gates with their filter sets (as now), members then; sealed permissions left out and counted.
  - `Access.js`: `preview#Grants` and `apply#Grants` take a row rule (`artifactGroupId` with `entityFilterSetId`): a filter set a
    registered bundle the actor may assign names for that artifact group, added to the group's bindings of the registered type;
    refused as `UNREGISTERED_SCOPE`, `SCOPE_UNBOUND` (no such binding, unless the request adds it), `SCOPE_CONFIGURED` (the
    binding carries a filter set of its own) and `SCOPE_REMOVAL` (an end); an explicit audit row per bound rule. The grant
    revision now covers each binding's filter sets.
  - `data/SecurityTypeData.xml`: a second `AdminAccessServices` member row naming the three reads (the first row's name is its
    key, so an installed database gets the new one beside it).
  - Docs: Attack-Surface (the projections and the row-rule refusals); Remaining-Work's `org.moqui.admin` row.
- BOSS:
  - `service/ironstone/admin/CapabilityServices.xml` with `Capabilities.js` (new): `get#MatrixContext` (the screen's context over
    `get#Capabilities`: columns, matrix rows and list rows with each cell's text and next proposal, the proposal's effect per
    group from `preview#Grants`, the revisions to apply at), `apply#MatrixChanges` (the proposal group by group through
    `apply#Grants`, each group as one change at its previewed revision in its own transaction, a refused or failed group named
    and left proposed) and `get#AccessReview` (the review's one list, members by `get#MemberScope`, the others counted). `apply`
    is in the client deny pattern already; no data change.
  - Screens: `Admin/Access.xml` gains Capabilities (menu 2), RowRules (3) and AccessReview (contextual).
    `Access/Capabilities.xml` (CapabilitySelection; ProposedChanges with Apply and its confirmation; CapabilityMatrix, a form-list
    of up to eight group columns; CapabilityList, its twin, in place of the matrix below the `md` width and in the terminal;
    Advanced rules, read only); `Access/RowRules.xml` (ScopeRuleFind, ScopeRules with SupportedScopeBinding's Bind dialog on a
    missing rule, paging by the service, the filter sets); `Access/AccessReview.xml` (ReviewDate, AccessReviewList with its CSV,
    Print in html-print). GroupDetail's header links Access review and Compare.
  - `Admin.js`: links `Access/Capabilities`, `Access/RowRules`, `Access/AccessReview`. BossSetupData and BossUsersDemoData unchanged.
- Specs: framework `test/AdminAccessCapabilities` (3 features, 0.25 s: a launcher granted alone leaves view and edit none, the
  list holds the matrix's cells, an unregistered rule and permission and a sealed grant listed read only, more than 8 groups and
  a user without the permission refused; a row rule bound only as a registered set on a registered binding at the revision,
  with its audit row, the unregistered, removal, unbound, configured and stale cases refused, no expression in the answer; the
  review as of now and of twenty days ago, the sealed grant left out and counted). BOSS `test/Admin/AdminCapabilities` (4
  features, 0.6 to 0.8 s: Capabilities' one qvt render with a proposal, and the matrix context's cells equal to its list rows; a
  launcher granted through the `applyChanges` transition with its two row rules and no permission, a privileged group of the
  same proposal named and not changed, the identity operator and the reader refused; RowRules' one qvt render with the rule's
  source; AccessReview's one html-print render, the sealed grant not in it, and another organization's member counted and not
  named). Access: the screens fall under P3's `access` area (`BOSS_ADM_ACCESS`; AdminAccess unchanged). Acceptance, written and
  not run: `test/acceptance/Admin/AdminCapabilitiesUsable` (4 features, the "usable when").
- Tests run (release binary, `--nobuild`, this worktree's runtime): framework AdminAccessCapabilities, AdminAccessServices,
  AdminSessions 12 of 12 (0.4 s); mr-boss AdminCapabilities, AdminGroups, AdminAccess, AdminUsers, AdminInvitations, ProjectsAccess
  27 of 27; `moqui lint --screens` 132 flagged sites, as before, none in the new screens. Capabilities (qvt, tui, html; the list
  view; no selection; the Admin app with privileged groups), RowRules (qvt, tui, html), AccessReview (qvt, tui, html,
  html-print, csv; no selection) and GroupDetail (html) rendered once by hand without errors, not kept. Prettier clean on the
  JavaScript. Not run: `./moq test-framework`, `./moq test-apps`, the acceptance suite; no cargo test (no Rust changed); no
  browser (the group multi-select's post is read as a list or a comma separated text, not seen in a browser).
- Inventories: none (the forms derive from Tools' Security screens, outside ss-inventory and usl-inventory).
- Design edits: design-admin §2 (the AccessReview row), §5 Capabilities and RowRules (as built) and AccessReview (new), §16
  (the review's row), §17.2 (AccessServices); design-crosscut §1.4 (one clause).
- Findings (provisional, numbered by the lead):
  - **F119** The design gives the matrix no read (only `preview#Grants` and `apply#Grants`) and the review no service. Built:
    `get#Capabilities` and `get#GrantReview` in the framework, beside `get#ScopeRules`.
  - **F120** The grant revision did not cover a binding's filter sets, so a row rule had no revision. It does now; a preview
    taken before the change is stale once.
  - **F121** Three demo bindings are of the registered launcher's type with another row rule: `BOSS_ADMIN_ADMIN` on
    `BOSS_ADMIN` and `BOSS_INSIGHTS_ADMIN` on `BOSS_INSIGHTS` (ALLOW with `MANTLE_ACTIVE_ORG`, F34) and `BOSS_PROJECT_CLIENT`
    on `BOSS_PROJECTS` (its client filter). Read as "lacking `MANTLE_USER_ORG`", Bind would have narrowed the administrator to
    its own organizations (against §4's Nov 7 rows on F65). A binding that carries a filter set the registry does not name
    for its artifact group is scoped on purpose: not listed as missing, `SCOPE_CONFIGURED` when asked. So no demo row offers
    Bind; it serves an app gate granted in Tools without its rules.
  - **F122** `ArtifactAuthzFilter` has no dates and no audit log, and removing one widens what members read: a row rule is
    only added, with an explicit audit row; removal stays Tools'.
  - **F123** `ArtifactAuthz` has no dates: the review's date and time apply to grants and memberships, app gates are shown as
    they are now (the print says so).
  - **F124** "Sealed and secret values left out" is read as: the review lists no sealed permission (counted per group), no
    allowed IPs, preference values or filter expressions. The screens still show sealed grants, marked.
  - **F125** A form-list's export menu (`show-csv-button`) is drawn only with a list header (pagination, `select-columns`, a
    header dialog or saved finds); the review's list sets `select-columns`.
  - **F126** A permission is in bundles of several apps (`PRODUCT_CATALOG_VIEW` in Products' and Warehouse's): the matrix has
    a row per app and capability, and the grant is one row whatever app shows it. A cell is offered when any registered
    bundle the actor may assign carries it, as `preview#Grants` decides.
  - **F127** The registry has no "Warehouse reader" bundle; `BOSS_WAREHOUSE` (the launcher with `MANTLE_USER_ORG` and
    `MANTLE_PRIVATE_CONTACT`, and `PRODUCT_CATALOG_VIEW`) is what the "usable when" grants.
  - **F128** `get#GrantReview` returns every member of a group, as `get#Group` does; BOSS's `get#AccessReview` names only
    those in the user's organizations. A direct framework caller with `ADMIN_ACCESS_VIEW` reads them all, as before.
- Decisions: the matrix is XML (a form-list with eight hidden-when-unused columns), not a `.qvue`, and its changes are a
  proposal carried in the screen's `changes` parameter (at most 40), previewed per group and applied per group, a refused
  group named and left proposed (§2's batch rule; within a group P3's all-or-nothing holds); the list twin replaces the matrix
  below `md` and in the terminal; a row rule is add-only and never completes a binding scoped on purpose; the review is one
  flat list (permissions, app gates, members) so its print and CSV are the same rows, with members scoped as GroupDetail's;
  the review is a screen of its own (AccessReview), linked from Capabilities and GroupDetail; no new capability or area.
- For the lead:
  - budget shares: framework about 0.25 s (AdminAccessCapabilities); mr-boss about 0.7 s (AdminCapabilities); no budget raised;
  - merge: mr-moqui `SecurityTypeData.xml` (one member row right after the `AdminAccessServices` block, not at the file's end),
    `AccessServices.xml` (appended; three descriptions changed), `Access.js` (the scope change, the revision, `lib`),
    Attack-Surface and Remaining-Work (one paragraph, one clause); mr-boss `Admin.js` `linkPaths` rows after P8's,
    `Access.xml` subscreens, `GroupDetail.xml` (two header links), `design-admin.md`, `design-crosscut.md` §1.4 (one clause);
    `BossSetupData.xml`, `BossUsersDemoData.xml` and `MoquiConf.xml` are not touched, so nothing meets Insights P6 there;
  - the user's call: F124 (should the review list sealed grants for a reviewer who holds them, or keep them out of every
    print and export); whether the review should name members at all (built: yes, in scope); F122 (a delegated removal of a
    row rule, refused here);
  - for P17 (audit and access evidence): the review is a current projection, not kept; a kept, signed-off review would be
    its record;
  - the acceptance AdminCapabilitiesUsable to run when asked.

**Review Nov 10 (P9).** A fresh review of both repositories' P9 diffs, access and scope first; fixes committed apart per repository
("Admin P9 review: …").
- Checked: the row rule in `preview#Grants` and `apply#Grants` (the set must exist and be named for that artifact group by a
  registered bundle the actor may assign; only added; only on a binding of the registered type; the group refusals of P3
  first, so a privileged group by its members only, an unregistered group and a non-delegable bundle refused; the revision
  over each binding's filter sets, the group row locked before the preview is taken again; the audit row per bound rule; the
  administration path as P3 counts it, through `ADMIN` membership alone, which a row rule does not touch); that a bound rule
  only narrows (filter.rs: a find takes every filter set of the one record that authorized it, joined with AND, and a write
  to `ArtifactAuthzFilter` moves the authorization generation); the seed and demo bindings on the twelve registered artifact
  groups (39 rows, read from a loaded database: `ADMIN`'s and each app administrator group's are `AUTHZT_ALWAYS`, so
  `SCOPE_UNBOUND`; `BOSS_ADMIN_ADMIN`, `BOSS_INSIGHTS_ADMIN` and `BOSS_PROJECT_CLIENT` carry a set of their own, so
  `SCOPE_CONFIGURED`; the rest carry every registered set), and that neither the access administrator, the administrator
  nor an `ADMIN` member is offered or allowed a Bind on any of them; `get#Capabilities`, `get#ScopeRules` and
  `get#GrantReview` (`ADMIN_ACCESS_VIEW` in each; nothing written; no `filterMap` or `applyCond`, only whether a condition
  applies; sealed grants out of the review and counted; no allowed IP or preference value read); BOSS `apply#MatrixChanges`
  (Admin and `ADMIN_ACCESS_MANAGE`; the tokens by a pattern, at most 40, in `apply` as in the read; each group through
  `apply#Grants` with authorization on and the caller's own authority, in its own transaction, a refused, failed or unknown
  group named and left proposed; a client-made `revisions` only ever a stale revision); `get#AccessReview` (members through
  `get#MemberScope` as GroupDetail, the others counted; no user id, no sealed grant; the print and the CSV the one list:
  the CSV rendered by hand); the screens (`applyChanges` and `bindScope` each reach a service with its own check; the
  identity operator is refused the three screens and the reader `apply#MatrixChanges`); `ironstone.admin.*` in the
  client deny pattern; the second `AdminAccessServices` member row; the specs (one render a screen a mode, the transition in
  `html` as gate 1's).
- Fixes:
  - **R1 (low, scope)** A row rule asked for beside the launcher it belongs to (one request, the group with no binding yet)
    previewed as bound and was then left to the launcher's own bundle: when that bundle is another one, registering the
    artifact group without the set or with another type, the rule was not bound though the preview said so. Now the rule is
    a change of its own, applied after the request's bindings (`apply#Grants` writes row rules last), counted only when it
    binds, and `SCOPE_UNBOUND` when the binding the request adds is of another type. No seed row has two bundles on one
    artifact group; the framework spec has the case.
  - **R2 (low)** `ignore-error` clears a refused call's message, so the three screens' `failure` was never set: more than 8
    groups, more than 40 changes or more than 60 reviewed groups drew an empty matrix or review with no reason, and a
    proposal over 40 could not be cleared from the screen. `get#MatrixContext` and `get#AccessReview` answer their bounds
    as `failure` (the proposal kept), the screens show it, with Clear on Capabilities, and read any other failed call as
    "not available". The same dead `failure` lines are in gate 1's screens (GroupDetail and others), which show a "not
    available" state from the missing record: see For the lead.
- Tests (release binary, `--nobuild`, this worktree's runtime): framework AdminAccessCapabilities (3 features, 0.36 s, with
  R1's case) and AdminAccessServices 9 of 9; mr-boss AdminCapabilities (4 features, 0.6 s, with R2's bound), AdminGroups,
  AdminAccess and ProjectsAccess 22 of 22. By hand, not kept: Capabilities with 41 changes and with 9 groups, AccessReview
  with 61 groups (each its reason), AccessReview as CSV, the three screens as the identity operator (refused). Prettier clean.
  Not run: `moqui lint --screens` (no Debug binary; the screen edits are three `set` lines and one link), the full suites,
  the acceptance spec.
- For the lead:
  - findings: **F129** `ignore-error="true"` clears the message, so `ec.message.hasError()` after it is always false: the
    `failure` capture gate 1's screens copy (GroupDetail, Constitution, InstanceSettings and others) is dead code; they fall
    back to a "not available" state, so nothing is exposed, but a refusal's reason is not shown there. **F130** Ending a
    registered launcher of a group whose binding is scoped on purpose (P3's rule, now one click in the matrix: End on
    `BOSS_INSIGHTS_ADMIN`'s Insights launcher, or on `BOSS_ADMIN_ADMIN`'s by a member) deletes the binding with its own filter
    sets, and the audit row keeps the type only; granting it again gives the registry's sets (`MANTLE_USER_ORG` for
    `MANTLE_ACTIVE_ORG`). Within the access administrator's delegated authority (the same members could be given the
    registered bundle), so left as P3 decided; refusing the end as `SCOPE_CONFIGURED`, or recording the sets in the audit
    row, is the user's call. **F131** A binding of the registered type with no filter set at all reads as "missing"
    and may be bound by an access administrator (it narrows a non-privileged group to its organizations); a group left
    unfiltered on purpose in Tools is not told apart from one granted without its rules;
  - merge: mr-moqui `Access.js` and `AdminAccessCapabilities.spec.js` only; mr-boss `Capabilities.js`,
    `CapabilityServices.xml` (a `failure` out-parameter on two services), the three P9 screens and the spec;
  - budget: unchanged shares (framework about 0.36 s, mr-boss about 0.6 s).

### P10 — Sign-in policy and identity providers

Design §6 SignInPolicy, IdentityProviders and IdentityProviderDetail, §4 Sessions' new-device notice; ADM-ACCESS,
ADM-CONNECTIONS, ADM-LIFECYCLE (the notice).

- **SignInPolicy:** EffectiveSignInPolicy over `get#EffectiveSettings`; GroupSignInRules over `store#Group` with the
  administration-path check and a lockout preview.
- **ConfigurationServices** `find#IdentityProviders`, `store#IdentityProvider` and `test#IdentityProvider` over AuthFlow
  and its OIDC, OAuth and SAML subtypes, AuthFlowFieldMap and AuthFlowRoleMap: role maps through `preview#Grants` (no
  privileged membership or sealed permission by SSO); an issuer, metadata URL, endpoint or client ID change asks for the
  secret again and leaves the provider disabled until a test passes (design §8.1); existing users linked only by a
  verified match.
- **The new-device notice:** `IdentityServices.notify#NewDeviceSignIn` after the login commits, against
  UserLoginHistory joined to Visit (F15) over P8's window, on a private `AccountSignIn` topic and by email, with a
  sign-out link to Commons Account.
- **Screens:** SignInPolicy; IdentityProviders (ProviderList, NewProvider); IdentityProviderDetail
  (ProviderConfiguration, IdentityMappings, RoleMappings, ProviderCheck).
- **Specs:** framework `AdminIdentityProviders` (an SSO role map to a privileged group refused; an endpoint change
  clears the secret and disables the provider); framework `AdminNewDevice` (one notice for a new client, none for a
  known one).
- **Usable when:** an OIDC provider is configured, tested and enabled, maps a remote role to a Projects bundle, and is
  disabled again by a changed issuer until retested; a sign-in from a new browser sends one notice.

**Built Nov 10 (P10).**
- mr-moqui (Rust changed: a Debug binary built in the worktree; the shared release binary does not carry it):
  - Rust, `crates/moqui-core/src/service/sso.rs` (the sign-in's account sync, which writes with authorization off, so the security
    EECAs skip it): an existing account with no provider id is linked only under the flow's rule (`link_allowed`: `AflVerifiedEmail`,
    the provider's verified email equal to the account's; never the username alone; never an account in a privileged group or in a
    group granting a sealed permission); a role map or default group never gives such a group (`sso_may_give`, logged and passed
    over); the sync ends only memberships in the groups the flow's role maps name. `check#Flow` (new, `org.moqui.sso.AuthServices`):
    the start of a login for a flow enabled or not, nothing kept, for `ADMIN_CONNECTION_MANAGE` or `ADMIN_ACCESS_MANAGE`.
    `service/sign_in_policy.rs` (new): `ConfigurationServices.get#SignInPolicyValues`, a fixed list of 13 nonsecret conf attributes
    as the server runs with them. `moqui-host` `test_cmd/fixture.rs`: `moqui test` installs the SSO client as a server does.
  - `entity/SecurityEntities.xml`: `AuthFlow` gains `accountLinkEnumId` (the `AuthFlowAccountLink` enumerations `AflNever`,
    `AflVerifiedEmail`), `testedConfigHash`, `testedDate`, `testedByUserId`; the audit log on `AuthFlow.defaultUserGroupId` and
    `accountLinkEnumId`, the client id and endpoints of `OidcFlow`, `OauthFlow` and `SamlFlow`, and `AuthFlowRoleMap.userGroupId`.
    `entity/ServerEntities.xml`: `InstanceSetting.confAttribute`. `entity/Security.eecas.xml` (appended): `UserLoginHistoryNewDevice`.
  - `service/org/moqui/admin/ConfigurationServices.xml` (appended, its bodies in the new `ConfigurationProviders.js`):
    - `find#IdentityProviders` (the list with type, readiness and callback; with `authFlowId` the provider's configuration, each
      secret as `secretSet` only, its mappings, its revision and its forms' options);
    - `store#IdentityProvider` (a new OIDC or OAuth provider, saved disabled, or changes at the revision read: the configuration
      with `ADMIN_CONNECTION_MANAGE`; the role mappings, the default group, the link rule and enabling with `ADMIN_ACCESS_MANAGE`;
      a mapped group by the grant proposal's rules for the actor and never privileged or granting a sealed permission; the
      endpoint-change rule; enabling only with a passing test of the configuration as it is, role mappings that hold and no linked
      account holding access beyond the actor's; disabling keeps the administration path; `STALE_REVISION`, `PRIVILEGED_GROUP`,
      `SEALED_PERMISSION`, `UNREGISTERED_BUNDLE`, `NOT_DELEGABLE`, `TEST_REQUIRED`, `HELD_BEYOND`, `ADMINISTRATION_PATH`,
      `UNSUPPORTED_TYPE`, `UNSUPPORTED_PROVIDER`, `ADVANCED_MAPPING`);
    - `test#IdentityProvider` (the configuration is complete, the mapped groups still hold, a sign-in can start through
      `check#Flow`; a pass marked for the configuration's fingerprint, a failure clears it; a test identity's roles previewed).
    `ConfigurationSettings.js`: a setting naming a `confAttribute` takes its value from `get#SignInPolicyValues`;
    `get#EffectiveSettings` gives an `ADMIN_ACCESS_VIEW` holder the sign-in groups only.
  - `AccessServices.xml` (appended) with `AccessSignIn.js` (new): `preview#GroupSignInRules`, the lockout preview (members, members
    with no confirmed factor, whether the actor's address is admitted, the administration path; counts only). `Access.js`:
    `find#Groups` rows gain `ipAllowed` and `canChange`; `lib` gains `proposalBundles`, `validIpAllowed`, `find`, `identity`.
  - `IdentityServices.xml` (appended) with `IdentityNewDevice.js` (new): `notify#NewDeviceSignIn`. `Identity.js`: the
    administration path takes `disabledFlowIds`, and an inbound flow is no sign-in path.
  - Data: `AdminConfigurationData.xml` (appended: the `AdminIdentityProviderServices` grant naming the three services; 13
    `InstanceSetting` rows of the group Sign-in policy); `SecurityTypeData.xml` (a third `AdminAccessServices` member row,
    `preview#GroupSignInRules`); `MoquiSetupData.xml` (appended: the `AccountSignIn` topic and the `ACCOUNT_SIGN_IN` template);
    `screen/AccountSignInEmail.xml` (new).
  - Docs: Attack-Surface (the provider services, the sign-in's bounds, the policy values, the notice); Parity-Diffs (P8c-18,
    P8c-19); Remaining-Work's `org.moqui.admin` row.
- BOSS:
  - Screens: `Admin/Security.xml` (new area, menu 4: SignInPolicy, IdentityProviders, IdentityProviderDetail);
    `Security/SignInPolicy.xml` (EffectiveSignInPolicy; GroupSignInRules with Change opening the group's rules, the review and
    Save with its confirmation); `Security/IdentityProviders.xml` (ProviderFind, ProviderList, NewProvider);
    `Security/IdentityProviderDetail.xml` (record header with one primary by state: Test, then Enable, Disable under More;
    ProviderConfiguration, a form per type; IdentityMappings with the link rule; RoleMappings with the default group;
    ProviderCheck). `Settings/InstanceSettings.xml`: a conf attribute shown as a setting's key.
  - `Admin.js`: the `security` area and the three link paths. No new `ironstone` service, so the client deny pattern is unchanged.
  - `data/BossSetupData.xml` (appended): `BOSS_ADM_SECURITY` (denied to the root group; the access, configuration and integration
    administrators and the administrator) and the `AccountSignIn` topic's link to Commons Account. BossUsersDemoData unchanged.
- Specs: framework `test/AdminIdentityProviders` (3 features, 0.6 s on the Debug binary: a role mapping to a privileged group, by
  a member too, to a sealed grant, to an unregistered group and as the default group refused and nothing written, by the
  integration administrator an error, a registered bundle mapped and its removal audited; a changed endpoint clears the secret
  and disables, the secret re-entered kept, enabling refused untested, by the integration administrator and while a linked
  administrator signs in by a provider, a passing test then enabling, the provider in the administration path, no answer holding
  the secret; the policy's 13 rules read only, for the access administrator the sign-in groups only, and the lockout preview);
  `test/AdminNewDevice` (1 feature, 0.07 s: through the EECA, none for a failed sign-in or a known client, one for a new client,
  none again from its network, another network new, a first sign-in none, a client from before the window new, another
  account's visit refused, the service not callable by a user). BOSS `test/Admin/AdminSecurity` (3 features, 1.2 s on the Debug
  binary: SignInPolicy's one qvt render with the review of a change; a provider started, configured, mapped, tested and enabled
  through the transitions, each administrator refused the other's part and the reader the area; IdentityProviders' and
  IdentityProviderDetail's one qvt render each, the secret in neither). `AdminAccess` changed: the `security` capability for the
  three administrators and the administrator, and Security in the administrator's and ADMIN's menus. Cargo: `service::sso`
  (two new tests: linking, and the groups a sign-in gives and ends; the fixture links by verified email) and
  `service::sign_in_policy`. Acceptance, written and not run: `test/acceptance/Admin/AdminSecurityUsable` (4 features, the "usable
  when"; its OIDC test reads a public discovery document, so it needs the network).
- Tests run (the worktree's Debug binary and runtime): framework AdminIdentityProviders, AdminNewDevice, AdminConfiguration,
  AdminAccessServices, AdminAccessCapabilities, AdminSessions 20 of 20; mr-boss AdminSecurity, AdminAccess, AdminSettings,
  AdminRegistries, AdminGroups, AdminCapabilities, AdminUsers, ProjectsAccess 36 of 36; `cargo test -p moqui-core --lib` for
  `service::sso` and `service::sign_in_policy` 14 of 14; `cargo test -p moqui-host --test it -- sso` 2 of 2; `moqui lint --screens`
  132 flagged sites, as master. By hand, not kept: SignInPolicy (qvt, tui, html; with a review; as the configuration and the
  integration administrator), IdentityProviders (tui, html; as the configuration administrator, not available),
  IdentityProviderDetail (qvt, tui, html; an OIDC and a SAML provider; as the integration administrator; a missing one), an OIDC
  test against an unreachable issuer and a SAML test (each failed with its reason), the notice's email body, and three real
  sign-ins as john.doe on a served test database (Firefox, a first sign-in: none; Chrome a minute later: one notice; Chrome
  again: none). Prettier and rustfmt clean on the changed files. Not run: `./moq test-framework`, `./moq test-apps`, the
  acceptance suite, the rest of cargo; no browser.
- Inventories: none (the forms derive from Tools' Security screens and the framework's AuthFlow records, outside ss-inventory
  and usl-inventory).
- Design edits: design-admin §1.1 (the provider change in the administration path), §4 Sessions (the notice as built), §6
  SignInPolicy, IdentityProviders and IdentityProviderDetail (as built), §16 (the notice's row), §17.2 (IdentityServices,
  AccessServices, ConfigurationServices, the provider records), §19 Q6.
- Findings (provisional, numbered by the lead):
  - **F132** The sign-in's account sync (sso.rs, as Java's) writes with authorization off, which the privileged-group and
    sealed-permission EECAs skip: it linked an existing account by the provider's username alone, gave any group a role map
    named, and ended every current group no mapped role named at each sign-in, an administrator's `ADMIN` membership included.
    Done in Rust (above; Parity-Diffs P8c-18, P8c-19), so the rules hold whoever wrote the rows, Tools included.
  - **F133** `UserAccount.externalUserId` is not scoped to a provider: every enabled provider signs in every linked account
    whose id it asserts, so whoever configures or runs one provider speaks for all linked accounts. Built: enabling is the access
    administrator's and refused while a linked account holds access beyond the actor's. A link record per provider is a
    framework ask.
  - **F134** The server signs in by OpenID Connect and OAuth 2; a SAML flow answers "not available in this port". SAML rows are
    listed and their fields kept (passwords write-only), cannot pass a test or be enabled, and NewProvider offers no SAML.
  - **F135** (F110) The sign-in policy is literal conf attributes: `InstanceSetting.confAttribute` and a Rust read of a fixed
    list. A general masked projection of conf attributes stays unbuilt.
  - **F136** The plan's "role maps through `preview#Grants`": a role map gives a membership, so it is checked by the grant
    proposal's rules (as P4's comment foresaw), and never a privileged or sealed-granting group even for a member or a holder
    (as invitations, P5).
  - **F137** A test cannot prove the client secret: no token is asked for without a person signing in. An OAuth provider with
    its endpoints given starts with no request at all, so its test checks completeness only; an OIDC test reads the discovery
    document (the request a sign-in makes, to a URL the integration administrator chose: `https` only, an internal host
    accepted, the answer pass or fail with the host's text).
  - **F138** `AuthFlowFieldMap.srcFieldName` is evaluated as an expression by the sign-in, as `dstFieldExpression` and a mapping
    service are. A delegated mapping is a plain claim name (letters, digits, underscores) onto four account fields; a
    namespaced claim (a URL, a dotted path) and anything computed stay Tools', and such a provider's mappings are read only.
  - **F139** Login history is one row a minute for a user (login.rs), so a second sign-in within the minute is not checked;
    a key sign-in writes history too and is checked as any other.
  - **F140** A notification whose email cannot be sent marks its sender's transaction rollback-only (the mail service's error),
    though the notification itself is kept. The notice runs in a transaction of its own; on an instance with no sender address
    each notice logs an error. The framework's (open).
  - **F141** The framework has no account screen, so its topic has no link; mr-boss sets it to Commons Account, which lists
    the last ten sessions of thirty days with Sign out, not the one session.
  - **F142** Removing a role mapping leaves the memberships it gave (the group is the provider's no more); the confirmation
    says so and an access administrator ends them.
  - **F143** One artifact group for the Security area: an integration administrator opens SignInPolicy and a configuration
    administrator IdentityProviders, each told it is not available to them. The reader holds none of it.
  - **F144** `moqui test` installed no SSO client (only a server did), so a spec could test no provider; the fixture
    installs it now. F37 (ProjectsAccess on a Debug binary) did not recur: 8 of 8.
  - **F145** InstanceSettings' ConfigurationSources also lists the 13 sign-in policy rows, since it lists every setting.
- Decisions: the parts of a provider by permission (configuration the integration administrator's; role mappings, link rule,
  default group and enabling the access administrator's); a provider is tested, then enabled, as two acts; the link rule defaults
  to never; an account in a privileged or sealed-granting group is linked by an administrator only; a change of the token
  signature or the nonce also needs a new test, the secret kept; a secret replaced alone leaves the provider enabled; `http`
  only for the server's own machine on an instance that is not production; a client is the browser and system with an IPv4 /24
  or IPv6 /48 network; an account's first sign-in sends no notice; the notice's topic and template are seed-initial rows an
  installation may change; Security is one area for three administrator groups; the rule change is reviewed on the page
  (`reviewGroupId`), as P6's lifecycle review.
- For the lead:
  - the shared release binary needs a rebuild after the merge: AdminIdentityProviders, AdminSecurity and SignInPolicy need
    P10's Rust (`check#Flow`, `get#SignInPolicyValues`, the fixture's SSO client), and the new `AuthFlow` and `InstanceSetting`
    fields a fresh database;
  - budget shares (Debug binary; a release binary is faster): framework about 0.7 s (AdminIdentityProviders 0.6,
    AdminNewDevice 0.07); mr-boss about 1.2 s (AdminSecurity); no budget raised;
  - merge: mr-moqui `SecurityEntities.xml` (fields and audit attributes inside the `AuthFlow` family), `ServerEntities.xml` (one
    field in `InstanceSetting`), `Security.eecas.xml`, `AdminConfigurationData.xml` and `MoquiSetupData.xml` (appended at their
    ends), `SecurityTypeData.xml` (one member row after P9's), `ConfigurationServices.xml` (appended; one service before the
    Localization section; two descriptions), `AccessServices.xml` and `IdentityServices.xml` (appended), `Access.js`
    (`groupSummary`, `lib`), `Identity.js`, `ConfigurationSettings.js`, the Rust files above, Attack-Surface, Parity-Diffs and
    Remaining-Work; mr-boss `BossSetupData.xml` appended at its end (Insights appends there too), `Admin.js` (`areas`, `linkPaths`
    after P9's), `AdminAccess.spec.js` (the capability rows and two menus), `InstanceSettings.xml` (one attribute),
    `design-admin.md`; P11 appends its connection part after the identity providers' in `ConfigurationServices.xml` and may
    reuse the endpoint-change shape (a fingerprint of the endpoint fields, the test mark);
  - the user's call: who enables a provider (built: `ADMIN_ACCESS_MANAGE`, never the integration administrator alone) and
    the `HELD_BEYOND` rule; the link rule's default (never) and that no username-only rule is offered; F133 (a link per
    provider); F134 (SAML: a client in the framework, or the type dropped from the design); the notice's network (/24, /48)
    and no notice on a first sign-in; F140 (the mail failure marking the transaction); F143 (one area, or one per
    audience);
  - the acceptance AdminSecurityUsable to run when asked (it needs the network).

**Review Nov 10 (P10).** A fresh review of both repositories' P10 diffs, security first (the Rust and the provider services read
line by line); fixes committed apart per repository ("Admin P10 review: …"). Rust changed again (`moqui-core` `service/sso.rs`
and `sso.rs`, `moqui-host` `sso.rs`, `moqui-lib` `http.rs`), and two entity fields are new.
- Checked and found sound: `sso_may_give` (the effective privileged and sealed lists, grants in date, read uncached) on every
  group a sign-in gives, whatever wrote the role map or the default group; the sync ending only groups a role map names that it
  may give, so `ADMIN` and every privileged or sealed-granting membership is never ended; `link_allowed` (the rule, the
  `email_verified` claim true and the `email` equal to the account's, the provider's name equal to the account's too, never a
  privileged or sealed-granting account); a new account gets the mapped fields, the provider's id and name, the bounded mapped
  groups and the bounded default group, nothing else (`externalUserId`, `userId` and `username` set after the mapped fields,
  so no mapping overrides them); `check#Flow` (its own permission check, nothing kept, no secret in its answer; the client
  follows no redirect, reads 1 MiB at most and waits 30 seconds); `get#SignInPolicyValues` (13 literal attributes, no hash
  type, key or seal list; its own permission check); `store#IdentityProvider` (secrets never read back, the endpoint-change
  rule over every field a secret is sent to, the retest of the signature and nonce, enabling only with `ADMIN_ACCESS_MANAGE`,
  a passing test of the fingerprint and groups that hold for the enabling actor, the revision over the flow, its type row and
  both mappings with the flow row locked, disabling and an endpoint change through the administration path); the identity
  mappings on the one path that writes them (a name of letters, digits and underscores onto four account fields; a provider
  with an advanced row refused whole); `store#Group` (P3's) behind SignInPolicy with the path check, and the preview's counts
  only; the new-device notice (the history row is written by a worker after the sign-in, the EECA catches everything, the
  service runs in its own transaction with no group authorized to call it, a visit of another account is refused, the summary
  is a fixed vocabulary and never the user agent, the link is the topic's static one); the Security area (one inheritable
  grant, nine transitions each reaching a service with its own check or, for `reviewRule`, none; the reader and the other
  groups hold nothing: AdminAccess); the specs (one qvt render a screen, the transitions in `html`, no request leaves the
  machine; the acceptance one reads a public discovery document).
- Fixes:
  - **R1 (high, F133).** A provider's id was the whole link: any enabled provider that asserted an id signed in the account
    carrying it. That is not only a second provider's operator or configurer taking another provider's accounts (the
    `HELD_BEYOND` check at enabling bounded privileged accounts linked then, not ones linked or promoted later, and no
    ordinary account); an id is unique at its provider only, so two providers' users with the same id shared an account with
    nobody at fault. Fixed in the sign-in: `UserAccount.externalAuthFlowId` (new) names the provider the id is of, set when a
    sign-in makes or links an account; an account another provider is named on is never found (`linked_account`), and by its
    name is refused. An account with an id and no provider named (linked by hand, or before this) is taken by the provider that
    first signs in with it, and with several providers enabled never an account in a privileged or sealed-granting group
    (`unscoped_link_allowed`: an administrator names the provider). `HELD_BEYOND` now counts the accounts the provider signs in
    (named on it, or naming none), and the administration path counts an administrator with no password only through the
    provider it names (or, naming none, the one enabled provider). Parity-Diffs P8c-20.
  - **R2 (medium).** A provider started through Admin could be pointed at an internal address: the discovery URL and the
    endpoints are the integration administrator's, the server fetched them from inside the network and a test answered what
    it found (status, and the JSON parser's text, which quotes the body). Fixed: `AuthFlow.allowPrivateNetwork` (new); a
    provider started by `store#IdentityProvider` on a production instance is saved `N` and the service never changes it; the
    sign-in's client then sends no request of that flow to a loopback, private or link-local address, by name (the resolver
    `moqui_lib::http::PublicOnly`, as the framework's other outbound guards) or written out. A flow without the flag (Tools',
    or a non-production instance's) is as before, so an existing provider on the instance's own network keeps working. A
    discovery document that does not parse is reported by the kind of error and its position. The detail screen says so.
  - **R3 (medium).** The sync linked a closed account, changed its fields and gave it groups before the login refused it.
    Fixed: an account disabled for good or ended is refused before anything is written.
  - **R4 (low, F138).** A plain claim name was still evaluated as an expression by the sign-in, so a name of the script
    context or of the engine (`ec`, `globalThis`) gave its text as the account field. Fixed: a source that is a plain name,
    with no expression, is the claim of that name and nothing else; only an expression (Tools') is evaluated.
  - **R5 (low).** The grant cache's key left the secret out (the configuration's `Debug` redacts it), so a replaced secret was
    not used for up to six hours, which the delegated "replace the secret" made reachable. Fixed: the key carries a hash of it.
- Tests (the worktree's Debug binary, rebuilt): `cargo test -p moqui-core --lib` for `service::sso`, `service::sign_in_policy`
  and `sso::tests` 16 of 16 (one new: a provider signs in only its own accounts, an account naming none, a closed account, a
  plain name); `cargo test -p moqui-host --lib sso` 2 of 2 (one new: nothing sent to an internal address) and `--test it -- sso`
  2 of 2; framework AdminIdentityProviders (extended in its second feature: an account named on another provider is not this
  one's, the path, a private-network refusal), AdminNewDevice, AdminAccessServices, AdminSessions, AdminConfiguration,
  AdminAccessCapabilities 20 of 20; mr-boss AdminSecurity, AdminAccess, AdminUsers, AdminGroups 15 of 15. Clippy clean on the
  three crates; rustfmt and Prettier clean on the changed files. Not run: the full suites, the acceptance suite, the rest of
  cargo.
- For the lead:
  - merge: `SecurityEntities.xml` gains `UserAccount.externalAuthFlowId` and `AuthFlow.allowPrivateNetwork` (a database made before needs
    the two columns); `moqui-lib` `http.rs` makes `PublicOnly` public; the shared release binary needs these too;
  - F133 is closed by R1 rather than left as a framework ask; what is left of it for the user: an account that names no
    provider is still taken by the first provider that signs in with its id (ordinary accounts with several providers, any
    account with one), so an administrator who links an account by hand in Tools should set both fields, and Admin has no
    screen for that yet (UserDetail shows no link);
  - F137 changes with R2: on a production instance a delegated provider cannot be on the instance's own network until an
    instance administrator sets `allowPrivateNetwork` in Tools (Admin offers no control for it, by design). The user's call:
    whether that default is right for a non-production instance too (built: allowed there, as the worker's `http` rule);
  - still open, not changed: whoever enables a provider vouches for its endpoint over every account it signs in that is not
    beyond them, their own included (the integration administrator chooses the endpoint, the access administrator enables
    it: the worker's user's-call item stands); a test passes from the client's cached grant for up to six hours without
    asking the provider again; `store#IdentityProvider` takes no operation key, so a repeated NewProvider with no id makes
    two disabled providers (as gate 1's creates); an email address mapped from a claim is not checked as verified (it is
    refused when another account has it); F134, F140 and F143 as the Built note has them.

### P11 — Connections and mail relays

Design §8.1, Connections, ConnectionDetail, §9 MailRelays and MailRelayDetail; ADM-CONNECTIONS.

- **ConfigurationServices** `find#Connections`, `get#Connection`, `store#Connection`, `test#Connection` and
  `find#ConnectionConsumers` over registered connection adapters (§4): the framework's for SystemMessageRemote,
  EmailOAuthProvider, NetworkPrinter (a test print through `print#Document`) and the relay (an EmailServer no
  EmailAccount owns, `test#EmailServer`, F18), and Mantle's for the payment, shipping and tax gateway configurations,
  which supply their own validation. Masked reads, write-only secrets, the endpoint-change rule, before and after in the
  audit log with secrets masked; an account-owned EmailServer refused on every path (design §9).
- **`store#PaymentGatewayOrganization`**, the first service to write it (F10): organization, gateway, dates, enabled,
  revision and reason; removal in use ended prospectively. Commerce's checkout choices and Accounting's PaymentMethods
  read it as they do now.
- **Screens:** Connections (ConnectionFind, ConnectionList, NewConnection); ConnectionDetail (NativeConnection,
  OrganizationAvailability for payment gateways, ConnectionChecks, Consumers); MailRelays (RelayList, NewRelay);
  MailRelayDetail (RelayConfiguration, RelayTest, RelayConsumers).
- **Specs:** framework `AdminConnectionServices` (an endpoint change without the secret clears it and disables the
  connection; a test against the new endpoint enables it; an account-owned server refused by `store#` and
  `test#Connection`); Mantle `test/account/GatewayConnections` (the gateway adapters' validation;
  PaymentGatewayOrganization's dated change); BOSS `AdminRelays` (MailRelays lists SYSTEM only; ConnectionDetail's one
  qvt render).
- **Usable when** (design §15.3 "Relay scope", "Endpoint change" and "Settings ownership", its gateway half): MailRelays
  lists SYSTEM and not Comms' account servers; changing the demo payment gateway's endpoint without its key leaves it
  disabled with no request sent; enabling it for ORG_ZIZI_SERVICES makes it a choice in that store's checkout settings
  and in Accounting's PaymentMethods, neither of which can change its credentials.

**Built Nov 10 (P11).**
- mr-moqui (Rust changed: a Debug binary built in the worktree; the shared release binary does not carry it):
  - Rust. `moqui-lib` `net.rs` (new, std only: `internal_address`, moved from `http.rs`, which re-exports it, and
    `public_addresses`, the one lookup that refuses an internal address). `moqui-mail` `implementation.rs` `smtp_transport`,
    where every SMTP connection starts: a server with `disabled` Y sends nothing (`test#EmailServer` still tries it), and one
    with `allowPrivateNetwork` N is looked up once and connected to at the address found, an internal one refused, TLS still
    verifying the name. `moqui-core` `service/system_sync/message.rs` `send_rest`: a `disabled` remote refused,
    `deny_internal` from `allowPrivateNetwork`, and the send's sign-in read from `sendAuthEnumId` then `messageAuthEnumId`, its
    HMAC secret from `sendSharedSecret` then `sharedSecret`. `service/tools.rs`: a `disabled` printer takes no job but
    `print#Document`'s `connectionTest`; `print.rs` `PrintServer.deny_internal`, which `moqui-host` `ipp.rs` obeys with a
    second client (the `PublicOnly` resolver, an address written out refused, no redirect).
  - `entity/ServiceEntities.xml`, `BasicEntities.xml`: `disabled` and `allowPrivateNetwork` (both audit-logged) on
    `SystemMessageRemote`, `EmailServer` and `NetworkPrinter`. `entity/ServerEntities.xml` (appended):
    `moqui.server.ConnectionAdapter` (the registry), `ConnectionConsumerProvider` and `ConnectionCheck` (the last test, the
    mark of a passing one, whether the connection waits for a test and whether a cleared secret is still missing).
  - `service/org/moqui/admin/ConfigurationServices.xml` (appended, its bodies in the new `ConfigurationConnections.js`):
    `find#Connections`, `get#Connection`, `store#Connection`, `test#Connection`, `find#ConnectionConsumers`, and the interfaces a
    component's kind implements, `run#ConnectionAdapter` and `find#AdapterConsumers`. One engine takes a kind's definition
    (its parts, fields with kinds and validation, endpoint fields, secrets, what makes it incomplete, read only or not this
    kind's, its test and its consumers) and gives the list, the detail (secrets as `secretSet`), the save (declared fields
    only; the revision; the endpoint-change rule; the audit rows, a secret as replaced or cleared) and the test (nothing sent
    while incomplete or while a cleared secret is missing; a pass marked for the fingerprint and enabling a connection that
    waited for it; the checks kept as safe text). The framework's kinds: remote (an `https` address with the sender's three
    `${}` names only, user, sign-in when sending, signature header, usage; its test one HEAD with no credentials and no body),
    relay (an `EmailServer` no `EmailAccount` owns; SMTP host, port, TLS, users, allowed domains, link base; TLS required when
    it signs in; its test `test#EmailServer` and, asked, one fixed message to the caller's own address), mailOAuth
    (`EmailOAuthProvider`'s client id, tenant and secret; no request) and printer (server, port, printer name; a fixed test
    page). `ConfigurationLib.js` gains `plainText`, `urlText`, `enumValue` and `write`, moved from `ConfigurationProviders.js`
    (P10's, which now takes them from the lib).
  - `impl/SystemMessageServices.xml` `send#ProducedSystemMessage`: a message of a `disabled` remote waits, tried again after
    the retry time, its failures not counted. `impl/PrintServices.xml`: `connectionTest`.
  - Data: `AdminConfigurationData.xml` (appended: the `AdminConnectionServices` grant naming the five services, and the four
    `ConnectionAdapter` rows).
  - Docs: Attack-Surface (the connections paragraph), Parity-Diffs (P8c-22, P8c-23), Remaining-Work's `org.moqui.admin` row.
- mr-mantle:
  - `service/mantle/account/GatewayConnectionServices.xml` with `GatewayConnections.js` (new): `run#GatewayConnectionAdapter`
    (the kinds paymentGateway: `PaymentGatewayConfig` with its type's options and its `SystemMessageRemote`; shippingGateway:
    `ShippingGatewayConfig` with its remote; taxGateway: `TaxGatewayConfig`; each a definition for the framework's engine),
    with Mantle's own validation: a gateway is started only as a registered provider type (Authorize.Net, PayTrace, Shippo),
    whose service names are the type's and never entered; on a production instance its address is one of its provider's; its
    usage agrees with the address and, for shipping, with its test mode; the type's options are typed.
    `store#PaymentGatewayOrganization` (F10: the one writer; organization in the caller's scope, gateway, from, thru, enabled,
    the revision, the reason; never deleted: `remove` ends it now, one in use is ended from now on at the earliest and says
    who still names it; enabling one that had ended starts a new period). `find#RemoteConsumers` and `find#PrinterConsumers`
    (the gateways and store integration of a remote; the facilities of a printer).
  - `data/PaymentGatewayConnectionData.xml` (new, seed): the three `ConnectionAdapter` rows, the two consumer providers, and the
    grant of `store#PaymentGatewayOrganization` (ALL_USERS with `MANTLE_USER_ORG`, ADMIN with `MANTLE_ACTIVE_ORG`, as the
    identity services'); the adapter and consumer services are in no grant.
  - `ext/account/gateway/AuthorizeNet.js`, `PayTrace.js`, `ext/shipment/Shippo.js`: a `disabled` connection is the gateway's
    problem, and a connection with `allowPrivateNetwork` N is called with `denyInternal()`.
- BOSS:
  - Screens: `Admin/Integrations.xml` (new area, menu 6: Connections, ConnectionDetail) and `Admin/Protocols.xml` (new area
    "Mail and protocols", menu 7: MailRelays, MailRelayDetail). `Integrations/Connections.xml` (ConnectionFind,
    ConnectionList, NewConnection); `Integrations/ConnectionDetail.xml` (the record header with Test as its primary action,
    Enable and Disable; NativeConnection, the kind's own form as one multi-row form of its declared fields and secrets;
    OrganizationAvailability for payment gateways, with Permit an organization, End and Permit again; ConnectionChecks;
    Consumers); `Protocols/MailRelays.xml` (RelayFind, RelayList, NewRelay); `Protocols/MailRelayDetail.xml`
    (RelayConfiguration, RelayTest with the choice of the named test message, RelayConsumers). The two detail screens share
    `template/AdminConnectionParts.xml` (the transitions `storeConnection`, `testConnection` and `setEnabled` and the sections,
    whose first prepares the record), each fixing its kind in `always-actions`: MailRelayDetail is the relay's alone and
    ConnectionDetail answers no relay.
  - `Admin.js`: the `integrations` and `protocols` areas and the four link paths. No new `ironstone` service, so the client
    deny pattern is unchanged.
  - `data/BossSetupData.xml` (appended): `BOSS_ADM_INTEGRATIONS` and `BOSS_ADM_PROTOCOLS` (denied to the root group; the
    integration administrator with `MANTLE_USER_ORG`, the administrator with `MANTLE_ACTIVE_ORG`) and the settings index entries
    `admin.connections` and `admin.mailRelays` (`ADMIN_CONNECTION_VIEW`). BossUsersDemoData unchanged.
- Specs: framework `test/AdminConnectionServices` (3 features, 0.3 s on the Debug binary: a read with no secret; an undeclared
  field, a `${}` of its own, plain `http` and a stale revision refused; a moved address clearing every secret, disabling and
  audited with no value; a test with the secret missing sending nothing, counted by the HTTP fixtures; the secret entered
  again, then a passing test, one HEAD with no credentials, enabling it; no internal address for a connection that may not
  use the private network, a remote and a relay; a new remote receiving from an authorized user only; a received-message
  secret and the backup mirror's remote not changed here; a kind with no request enabled by its test, an administrator's
  disable kept; an account-owned server on no path; a relay without TLS refused; a printer whose page is not taken left
  disabled; the reader and a user without the permission). Mantle `test/account/GatewayConnections` (2 features, 0.3 s: the
  kinds registered with their provider types; a test gateway type and an entered service name refused or ignored; the usage
  and option validation; the live address without the key clearing it, no request; a local gateway with nothing to test; the
  adapter not callable; the binding permitted, stale, clamped to now when in use, started again, not started later, ended
  with its reason and its audit rows, never before its start, and refused outside the caller's organizations). BOSS
  `test/Admin/AdminRelays` (2 features, 0.9 s: a relay started, given its sign-in and repointed through the transitions; the
  Integrations mount not the relay's; a mail account's server changed and tested on no path; a gateway permitted for the
  administrator's own organization, not another's, not by the reader; MailRelays' and ConnectionDetail's one qvt render each,
  no secret). `AdminAccess` changed: the `integrations` and `protocols` capabilities for the integration administrator and
  the administrator, and the two areas in the administrator's and ADMIN's menus. `AdminRegistries` changed: the Instance group
  holds Admin's two new entries. Cargo: `moqui-lib` `net::tests`, `moqui-mail`
  `a_disabled_server_and_an_internal_address_are_refused_before_a_connection`, `moqui-core`
  `a_disabled_printer_takes_only_its_connection_test`. Acceptance, written and not run:
  `test/acceptance/Admin/AdminConnectionsUsable` (3 features, the "usable when", with the HTTP fixtures: no network).
- Tests run (the worktree's Debug binary and runtime): framework AdminConnectionServices, AdminIdentityProviders,
  AdminConfiguration 10 of 10; mr-mantle GatewayConnections 2 of 2; mr-boss AdminRelays, AdminAccess, AdminRegistries,
  AdminSecurity, AdminSettings, ProjectsAccess 29 of 29 (AdminRegistries after its expectation changed); `cargo test` for
  `moqui-lib` (`net::`, `http::`, 13), `moqui-mail` (3), `moqui-core` (`service::tools`, `service::system_sync`, 22) and
  `moqui-host` (`ipp`, 8); `moqui lint --screens` 132 flagged sites, as master. By hand, not kept: Connections, ConnectionDetail
  (a payment gateway with its organizations as the administrator, a gateway started here, a remote, the tax gateway, a relay
  refused), MailRelays and MailRelayDetail in qvt, tui and html, the reader refused both areas, and the lists as the
  services answer them on the demo. Prettier clean on the new JavaScript; rustfmt and clippy clean on the changed Rust files
  and their four crates. Not run: `./moq test-framework`, `./moq test-apps`, the acceptance suite, the rest of cargo; no
  browser; no request to a real
  host (a test run is closed to the network), so the SMTP sign-in, the test page and the HEAD are proven against fixtures,
  refusals and the unit tests only.
- Inventories: ss-inventory's six Gateway forms (Implemented in).
- Design edits: design-admin §8 Connections and ConnectionDetail, §9 MailRelays and MailRelayDetail (as built), §14 (the
  connection adapter row), §17.2 (ConfigurationServices; `store#PaymentGatewayOrganization` is Mantle's); design-accounting
  (Shared settings access) and design-commerce (Payment choices): who writes the binding.
- Findings (provisional, numbered by the lead):
  - **F146** No native connection record had a disabled state or a test mark (only `EmailOAuthProvider.disabled`), and
    nothing a sender obeys could be kept beside them. Built: `disabled` and `allowPrivateNetwork` on the three native records,
    enforced where each is sent through (Rust and `send#ProducedSystemMessage`; Mantle's three gateways for their connection);
    the mark in `ConnectionCheck`. A remote's own send service is stopped by `send#ProducedSystemMessage` when `disabled`, and
    reads `allowPrivateNetwork` only where this phase changed it (`send#SystemMessageRest`, Authorize.Net, PayTrace, Shippo).
  - **F147** `/rest/sm/{type}/{remote}` takes a message of any type from whoever satisfies the remote's own
    `messageAuthEnumId` (`SmatNone`: anyone), so an administrator who could choose how a remote receives, or set the secret it
    verifies by, could send the instance messages of any type. Built: that field is never changed here; a remote or gateway
    started here receives from a signed-in, authorized user only (`SmatLogin`), so a gateway started in Admin takes no
    provider webhooks until an instance administrator sets their verification; the shared secret of a remote that verifies
    received messages by it is not entered here (`SECRET_NOT_DELEGATED`). A framework ask: bind a remote's inbound to its
    message type, then delegate the webhook key.
  - **F148** The backup mirror's remote (`EmbeddedDbBackup`) is a `SystemMessageRemote` whose address is an SFTP target:
    repointed, the database archives go elsewhere, which `ADMIN_BACKUP_DOWNLOAD` is sealed to prevent. Built: a remote with a
    send service of its own, of a message type with a file path or a send service, or not posting over `https`, is read only
    here.
  - **F149** `send#SystemMessageRest` expands a remote's `sendUrl` as a template, so a stored `${}` is an expression run at
    each send. The address may hold the three names the sender gives and no other.
  - **F150** `send#SystemMessageRest` read only `messageAuthEnumId` and `sharedSecret`: `sendAuthEnumId` and
    `sendSharedSecret`, whose descriptions say they are the send's, were not read. They are now read first (P8c-23), which is
    what lets the send's sign-in be chosen without touching how the remote receives.
  - **F151** "MailRelays lists SYSTEM only" (the plan's spec line): by the design's definition (no mail account owns it)
    the demo lists SYSTEM, the framework's `MOQUI_LOCAL` and the servers the apps' demo templates send through; a mailbox an
    instance polls without an account would be listed too. The specs check SYSTEM in and an account's server out.
  - **F152** The entity audit log's `update` mode writes no row for a value set where there was none (an end date, a first
    address). The services write those rows themselves (the engine for every audit-logged field; the binding's dates).
  - **F153** A remote's or gateway's test proves the address, not the credentials (as P10's F137): one request with none.
    A relay's test does sign in. A provider's own authenticated check (Authorize.Net's) is the gateways' later work.
  - **F154** The demo's payment gateways are local test gateways with no connection, and `BOSS_COM_HOSTED` is already
    permitted for ORG_ZIZI_SERVICES; the gateway with an address is Mantle's `AuthorizeNetDemo`, which the acceptance uses.
  - **F155** The organizations of a payment gateway are read and permitted under the organization filters of the
    authorization the call runs under (the Admin screens' grants): outside a screen a delegated administrator is answered
    none (an instance administrator every one), as Mantle's identity scope.
  - **F156** The design's NewRelay "permitted organization" and NewConnection "organization" are not built: only
    `PaymentGatewayOrganization` exists (design §8.1), and a relay has no purpose record.
  - **F157** The shipping gateway's carriers, methods, box types and options (`ShippingGatewayOption` rows) are not in its
    form: Warehouse's Carriers owns the bindings, and the option rows stay Tools'.
  - **F158** Consumers links a gateway or a remote to its own detail; links into the owners' apps (PaymentMethods, a
    store's checkout, Warehouse's printers) are not built, and records of organizations the administrator does not
    administer are counted or left out.
  - **F159** The HTTP fixtures answer before the transport's internal-address guard, so the framework spec turns them off
    for the one call that shows the guard.
  - **F160** `store#Connection` takes no operation key: a repeated New connection with an id is refused (`KEY_IN_USE`), a
    printer started with no id twice is two printers (as P10's providers).
- Decisions: the state a sender obeys is on the native record, the test mark beside it; one engine with a definition a kind,
  a component's kind one adapter service with an operation; a passing test enables a connection the endpoint rule (or its
  creation) disabled, and an administrator's own Disable stays until Enable, which needs that test; an endpoint change
  clears every stored secret of the connection; a gateway is a registered provider type, its address its provider's on a
  production instance; a binding is ended, never deleted, and enabled again starts a new period; a relay that signs in needs
  TLS; a mail sign-in provider's endpoints are not changed here; Integrations and Mail and protocols are two areas of the
  integration administrator and the administrator; the kind's form is one multi-row form of what it declares.
- For the lead:
  - the shared release binary needs a rebuild after the merge (the Rust above), and a database made before needs the six new
    columns and three new tables;
  - budget shares (Debug binary): framework about 0.3 s (AdminConnectionServices); mr-mantle about 0.3 s
    (GatewayConnections); mr-boss about 0.9 s (AdminRelays); no budget raised;
  - merge: mr-moqui `ServerEntities.xml` and `AdminConfigurationData.xml` appended at their ends, `ConfigurationServices.xml`
    appended, `ServiceEntities.xml` and `BasicEntities.xml` (two fields in each of three entities), `ConfigurationLib.js` and
    `ConfigurationProviders.js` (four helpers moved), `SystemMessageServices.xml` and `PrintServices.xml`, the Rust files
    above, Attack-Surface, Parity-Diffs, Remaining-Work (the `org.moqui.admin` row only); mr-mantle all new files but three
    gateway modules (two small hunks each); mr-boss `BossSetupData.xml` appended at its end (Insights appends there too),
    `Admin.js` (`areas`, `linkPaths` after P10's), `AdminAccess.spec.js`, `AdminRegistries.spec.js` (one expectation),
    `design-admin.md`, `design-accounting.md` and `design-commerce.md` (one sentence each, the other apps' designs, as the
    phase's binding calls for), `ss-inventory.md`; P12 adds ProtocolsHome as the Protocols area's default and P13 MessageTypes
    and SystemMessages to Integrations;
  - the user's call: F147 (bind a remote's inbound to its type in the framework, then delegate webhook keys and let a
    gateway started in Admin take its provider's webhooks); whether a passing test alone should enable a repointed connection
    (built: yes, by the integration administrator who repointed it, so a printer, relay or remote sends what it carries to an
    address of that administrator's choosing once their own test passes; P10 held enabling apart) or a second person;
    whether a production gateway's address is its provider's hosts only (built) or any public `https` address; F151
    (whether the apps' sending servers and `MOQUI_LOCAL` belong in MailRelays); F156 (an organization or purpose record
    for relays and other kinds: later, if a deployment needs one);
  - by mistake `./moq run lint --screens --debug --nobuild` (the options after the command) started a release build in this
    worktree: it was stopped at once and its `target/release` removed; the options go before `lint`;
  - the acceptance AdminConnectionsUsable to run when asked.

**Review Nov 10 (P11).** A fresh review of the three repositories' P11 diffs, existing behavior and secrets first (the Rust,
the engine and Mantle's adapter read line by line); fixes committed apart per repository ("Admin P11 review: …"). Rust
changed again (`moqui-mail` `implementation.rs` only: the Debug binary of the worktree was rebuilt).
- Checked and found sound:
  - Existing rows. Every new check is an equality with `Y` (`disabled`) or `N` (`allowPrivateNetwork`): a row with neither
    (demo data, an upgraded instance, Tools' rows, a mail account's server, the backup mirror's remote, Commerce's channel
    remotes, Mantle's gateways' remotes) takes the same path as before in `send_rest`, `send#ProducedSystemMessage`,
    `smtp_transport`, `send_job` (one more read of the printer), the IPP client (the same client; the public-only one is a
    second) and the three gateway modules, loopback and private addresses included. `internal_address` moved unchanged, and
    the HTTP resolver's refusal reads the same. No view entity joins two of the three entities' new names. P8c-23: no seed
    or demo row sets `sendAuthEnumId` or `sendSharedSecret`; a row where an instance administrator set one in Tools now
    sends by it, as its description says (before, it was not read). An empty `sendAuthEnumId` is exactly the old read.
  - The Rust guards. SMTP with `N`: one lookup, every address checked, the connection made to the address found with TLS
    still verifying the name; a literal, `localhost` and a name are refused alike. IPP with `N`: a literal refused before
    the request, a name by the `PublicOnly` resolver, which also pins the address, no redirect followed. HTTP: P10's client
    (resolver and each redirect hop). `test#EmailServer` ignores `disabled` on its own copy of the row only.
  - Secrets. `get` and `list` answer `secretSet` only; the engine's own audit rows hold "(set)", "(replaced)" or
    "(cleared…)"; the entity audit log writes an encrypted field's old and new value encrypted (as before this phase); a
    test's text is one of a fixed list with the stored secrets struck out, a relay's and a printer's failure a kind, never
    the server's words; errors name labels, never values. The endpoint rule clears every stored secret of the connection
    not entered in the same save, fixed ones too (a webhook key, a private key), and the receive path refuses an HMAC or
    URL-token remote with no secret, so a cleared inbound secret closes the remote. No request while a cleared secret is
    missing or the configuration is incomplete (counted by the fixtures).
  - `test#Connection`: the manage permission, hidden and read-only records refused before anything is sent, one HEAD with
    no credentials for a remote or gateway (ten seconds, status only), the relay's and the printer's own clients' limits;
    `sendUrl` is expanded as a template literal in which only `${` opens an expression, and the validation refuses every
    `${` but the three names. Design §8.1 and §15.3 "Endpoint change" say a passing test against the new endpoint enables
    the connection, with no second person: built as designed (P10 held enabling apart because enabling a provider needs
    `ADMIN_ACCESS_MANAGE`). On an instance that is not production a test may reach an internal `https` address, as P10's.
  - Scope of what is editable: an account-owned `EmailServer` on list, get, store, test and consumers; the backup mirror's
    remote, a remote with a send service or message type of its own or not over `http(s)`; `messageAuthEnumId` in no
    definition and the inbound secret refused; adapters reached only by `ConnectionAdapter` rows, the client's `adapterKey`
    looked up among them by own name; Mantle's adapter and consumer services in no grant. Commerce's channel remotes are
    listed as remotes: their inbound sign-in and secret are not changed here, and nothing of Commerce's sends to their
    address.
  - `store#PaymentGatewayOrganization`: the manage permission, the organization among the filtered internal organizations
    (no organization filter and not an instance administrator: none, so a call outside a screen by a delegate without the
    grant's filter fails closed), an internal organization only, the row locked, the revision, never a delete, the audit
    rows; Commerce's and Accounting's reads are untouched files; a binding gives no read of the connection.
  - BOSS: two inheritable area grants, each transition reaching a framework or Mantle service with its own check
    (`choices` is `ContextServices.get#Choices`); ConnectionDetail answers no relay and MailRelayDetail only relays
    (`always-actions`); one qvt render a screen in AdminRelays, the transitions in `html`, no request leaves the machine.
- Fixes:
  - **R1 (high).** A gateway's connection is a plain `SystemMessageRemote`, which the remote kind listed and changed like
    any other: an integration administrator on a production instance could repoint Authorize.Net's remote to any public
    `https` host there, enter a key of their own, pass the test and have the gateway post payment requests to it, past
    `PROVIDER_ADDRESS`. Fixed: a consumer a provider answers may say `ownsConnection` (Mantle's `find#RemoteConsumers` does
    for a payment or shipping gateway), and the remote kind is then read only (`store#` and `test#Connection` answer
    `READ_ONLY`, naming the gateway), as it is when a provider cannot be asked. The remote is changed as the gateway's
    connection only.
  - **R2 (medium).** NativeConnection posts every setting, and the engine validated and compared each: a stored host in
    capitals (normalized to lower case) or a port with a leading zero was an endpoint change that cleared the stored
    secrets and disabled the connection on any save, and a stored value today's validation refuses (an `http` address
    from Tools on a production instance) refused every save. Fixed: a value given as it was read is no change.
  - **R3 (medium).** `disabled` and `allowPrivateNetwork` are audit-logged for updates, which write no row for a first
    value (F152), and the engine wrote its own rows for declared fields only: an administrator's Disable of a connection
    never disabled before, the endpoint rule's disabling and the first `allowPrivateNetwork` N left no audit row and lost
    the reason. Fixed: the engine writes those rows.
  - **R4 (medium).** The secret of NativeConnection was posted as `fieldValue_N`: a refused save keeps the request's
    parameters in the session for the form, all but names holding "password", and request details strike out by name
    too. Fixed: a secret row's input is `secretPassword_N`. P10's IdentityProviderDetail posts its `secret` field the same
    way (for the lead).
  - **R5 (low).** A mail server refused before any connection (disabled, or an internal address with `N`) gave the
    delivery outcome "uncertain" (possibly sent), which Mantle's delivery ledger does not retry. Fixed: "retryable"
    (`moqui-mail` `delivery_outcome`), so mail waits for the relay's test as a system message waits for its remote's.
  - **R6 (low).** A connection an administrator had disabled was enabled by the test that followed a later endpoint
    change. Fixed: the test enables what the change disabled (or a new one); one disabled before stays so until Enable.
  - **R7 (low).** A URL an instance administrator wrote with credentials in it (`https://user:password@host`) was read
    whole by `get#Connection`: it is now read as `(credentials)@host` (saved back so, it is no change). The consumer
    providers were asked about a record that is not the kind's (an account-owned server's id): no longer. A binding's first
    end date was audited as a number of milliseconds. `send#SystemMessageRest`'s description said `messageAuthEnumId` only.
- Tests (the worktree's Debug binary, rebuilt): framework AdminConnectionServices (3 features, 0.4 s: adds the legacy
  remote saved as read with its credentials masked, the audit row of the disabling, the repoint of a disabled provider),
  AdminIdentityProviders, AdminConfiguration 10 of 10; mr-mantle GatewayConnections 2 of 2 (adds the gateway's remote read
  only as a remote, no request); mr-boss AdminRelays, AdminAccess, AdminRegistries 14 of 14 (AdminRelays posts secrets as
  the form does and checks the secret input's name); `cargo test -p moqui-mail` 150 passed (the transport test adds the
  delivery outcomes); clippy clean on `moqui-mail`; Prettier clean; `moqui lint --screens` 132 flagged sites, as master.
  Not run: the full suites, the acceptance test (its `rows` helper changed with the form's), a browser.
- For the lead:
  - the release binary needs the rebuild the Built note asks for, now with `moqui-mail`'s change too;
  - `find#AdapterConsumers` gains `ownsConnection` (an owner that names a connection its own kind administers); another
    component with a kind over a remote answers it the same way;
  - open, not built: `sendUrl`'s query is read whole (a key an operator put in it would be shown to a reader of
    connections; masking it would make the address write-only); `smtpStartTls` is opportunistic in the transport, as Java
    (a relay with STARTTLS signs in without TLS when the server offers none, so "a relay that signs in needs TLS" holds
    for TLS from the start only; requiring it for `allowPrivateNetwork` N servers is a small Rust change); a disabled
    printer still answers status and cancel requests for its earlier jobs; `print#Document`'s `connectionTest` is open to
    every caller of that service (a test print to a printer that waits for its test, nothing more); P10's `secret` form
    field (R4);
  - the user's call stays as the Built note has it; on "a passing test alone enables": the design says so (§8.1, §15.3).

### P12 — Protocols and the mail queue

Design §9 ProtocolsHome, MailQueue and ServerConfiguration; ADM-PROTOCOLS.

- **ConfigurationServices `test#Protocol`** (the supported diagnostics, an external probe confirmed) and the protocol
  readiness over `get#EffectiveSettings` and `get#Readiness`: built, enabled, failing and absent told apart; SMTP trust
  from `smtp_allowed_addresses` and `smtp_authserv_id`, never reported trusted on a mismatch.
- **`org.moqui.admin.OperationServices.find#MailOutcomes`** over EmailMessage send outcomes: safe recipient counts, no
  subject, body or address unless separately authorized; a retry through the owner, an uncertain submission sent to
  reconciliation, never a fresh send.
- **Screens:** ProtocolsHome (ProtocolReadiness, with links to Comms' accounts and templates and BasicComms' System ›
  Voice); ServerConfiguration (EffectiveProtocolSettings, ProtocolChecks); MailQueue (MailQueueFind, MailQueueList).
- **Specs:** framework `AdminProtocols` (a disabled listener and an unbuilt feature differ; an allowlist mismatch is not
  trusted); BOSS `AdminMailQueue` (a failed send listed with its owner link and no body; ProtocolsHome's one qvt
  render).
- **Usable when** (design §15.3 "Protocol readiness"): ProtocolsHome on the demo shows SMTP reception disabled, DAV
  ready and RTC absent apart; a failed mail send shows in MailQueue with its owner link and no body.

**Built Nov 10 (P12).**
- Checked first (the code over the plan): no script could read what a listener did at startup or a literal conf attribute
  (F161); `EmailMessage` kept no send outcome, so "known failure" and "uncertain" could not be told apart from the
  record (F162); most mail is sent by services with no ledger while Mantle's delivery ledger keeps and retries its own
  attempts (F163); P0's "Comms' settings and readiness" was answered by F44 in P2 and still holds (F170).
- mr-moqui (Rust changed: a Debug binary built in the worktree; the shared release binary does not carry it):
  - Rust. `moqui-core` `service/protocol_admin.rs` (new, std only): `get#ProtocolFacts` (the build's package and features,
    the startup report's entries for a fixed list of listeners and integrations with their state on, off, failed, skipped
    or notBuilt and its detail, whether the process opened its listeners, and a fixed list of nonsecret attributes of
    `smtp-server`, `ssh-server` and `git-server`) and `probe#ProtocolTarget` (one TCP connection, closed at once, to a
    target named by key whose host and port are the conf's own properties: five listeners' bound addresses and four public
    names; a public one only with `confirmed`); each checks its own permission and takes no address from the request.
    `moqui-mail` `implementation.rs` `record_send_failure`: a delivery that fails keeps its `deliveryOutcome` as the stored
    message's `sendOutcome`, with the error as `sendError` for a message that is not a mail account's, in a transaction of
    its own; the Sent status clears it (P8c-24).
  - `entity/BasicEntities.xml`: `EmailMessage.sendOutcome`. `entity/ServerEntities.xml` (appended):
    `moqui.server.MailOutcomeOwner` (the registry of owners of send outcomes) and `OperationResult` (an operation key's first
    answer); `ConnectionCheck` also keeps a protocol check's last result (adapter key `protocol`).
  - `service/org/moqui/admin/ConfigurationServices.xml` (appended, bodies in the new `ConfigurationProtocols.js`):
    `get#ProtocolReadiness` (fourteen protocols, each a row of one table: its build feature, its startup entry and how the
    conf turns it on; state absent, disabled, failing, untrusted, notStarted or ready, with the reason, the listener, the
    settings group, the owner key and its checks with their last results; SMTP reception's trust) and `test#Protocol`
    (configuration, listener, public address; the last only confirmed; NOT_BUILT and NOT_ENABLED send nothing), and the two
    Rust services' definitions. `ConfigurationSettings.js`: `get#EffectiveSettings` answers the groups named "Protocols: ..."
    to a holder of `ADMIN_CONNECTION_VIEW` or `ADMIN_OPERATION_VIEW` alone, as P10's sign-in groups to the access
    administrator (one table of group readers).
  - `service/org/moqui/admin/OperationServices.xml` (new family, organized as ConfigurationServices: a module a part beside
    `OperationLib.js`, which takes `ConfigurationLib.js`'s helpers and adds the operation permissions, the required reason,
    the operation key with `once`, a registered service called apart, and paging): the mail part, `OperationMail.js`:
    `find#MailOutcomes`, `retry#MailOutcome`, `reconcile#MailOutcome`, the internal `claim#MailOutcomeRetry`, and the owner
    contract's interfaces `find#MailOutcomeOwners` and `recover#OwnedMailOutcome`. P13 and P14 append their sections and
    modules.
  - `mail/EmailClientServices.xml`: `record#SendResult` takes and keeps `deliveryOutcome`; a send claimed again or a
    message taken back to Drafts clears it.
  - Data: `AdminConfigurationData.xml` (appended: the `AdminProtocolServices` and `AdminOperationServices` grants, each naming
    its services, and thirty-three read-only settings of five Protocols groups).
  - Docs: Attack-Surface (the protocols and mail queue paragraph), Parity-Diffs (P8c-24), Remaining-Work's `org.moqui.admin`
    row.
- mr-mantle (not in the plan's repositories: a worktree on `adm/p12` was added for F163):
  - `service/mantle/party/MessageServices.xml`, `MessageDeliveries.js`: `find#MailOutcomeOwners` and
    `recover#OwnedMailOutcome`, the ledger as a registered owner (it claims the stored message of each attempt, offers no
    retry since it tries a waiting delivery itself, and reconciles the last attempt of an uncertain delivery through
    `resolve#Delivery` with `MESSAGE_DELIVERY_REVIEW`); a failed attempt now keeps its `emailMessageId`, as a sent and an
    uncertain one did. `data/ShopFulfillmentSetupData.xml` (appended): the `MailOutcomeOwner` row.
- BOSS:
  - Screens: `Admin/Protocols.xml` (Home the default; MailRelays, MailQueue, ServerConfiguration; MailRelayDetail
    contextual). `Protocols/Home.xml` (ProtocolsHome: four number cards, ProtocolReadiness with each protocol's state chip,
    reason, listener and owner link, links to MailQueue, Comms' mail accounts and text blocks and, when it opens, Voice;
    TransportHealth from `get#Readiness`). `Protocols/ServerConfiguration.xml` (ProtocolFind; ProtocolChecks with Run, and
    for a public address a dialog that says what leaves the server; EffectiveProtocolSettings). `Protocols/MailQueue.xml`
    (MailQueueFind; MailQueueList with Send again behind a confirmation naming the message and its recipient count, and
    Settle or Close in a dialog with the reason). No new `ironstone` service, so the client deny pattern is unchanged.
  - `Registry.js`: the adapter of the protocols as a readiness provider. `Admin.js`: three link paths.
  - `data/BossSetupData.xml` (appended): `BOSS_ADM_PROTOCOLS_OPS` (the operations operator on the area's screen itself, not
    inherited, and on Home, MailQueue and ServerConfiguration), the readiness provider `admin.protocols` (Transport) and the
    settings index entry `admin.protocols`. BossUsersDemoData unchanged.
  - P11 review's R4 in P10's code: `Security/IdentityProviderDetail.xml` posts the client secret as `secretPassword` (both
    forms and the transition's mapping to the service's `secret`), a name the session's saved parameters and request
    details leave out; AdminSecurity and the acceptance AdminSecurityUsable post it so.
- Specs: framework `test/AdminProtocols` (3 features, 0.05 s on the Debug binary: off, absent, failed, skipped, ready and
  not started read apart from given facts and through the service; the trust cases, a mismatch never ready or trusted,
  internet mail never trusted; an unconfirmed public check refused in the script and in the Rust service, an off protocol
  sent nothing, one result kept with its runner, the viewer and a user without the permission) and
  `test/AdminMailOutcomes` (3 features, 0.2 s: the list with counts, owner and no subject, body or address, the states'
  filters, the relays' keeper reading the instance's mail only; a retry sending the same message once for its key, a
  server not reached leaving it retryable, an uncertain or account message never sent, the reconciliation with its audit
  rows, a close; an owner that cannot be asked holding everything). Mantle `test/party/DeliveryLedger` (one feature added,
  0.05 s: the ledger's message claimed, no retry here, an uncertain one reconciled through the ledger). BOSS
  `test/Admin/AdminMailQueue` (2 features, 1.0 s: MailQueue's, ProtocolsHome's and ServerConfiguration's one qvt render
  each; the transitions as the operator, the integration administrator and the reader; the operator refused MailRelays).
  `AdminAccess` changed: the operator's `protocols` capability. `AdminRegistries` changed: the Instance group's new entry.
  Cargo: `moqui-core` `service::protocol_admin::tests` (2), `moqui-mail`
  `a_failed_delivery_keeps_its_outcome_on_the_message`; `rust_services_tests`' list of registered services gains P12's two
  and the two P10 left out (F172). Acceptance, written and not run: `test/acceptance/Admin/AdminProtocolsUsable` (2 features,
  the "usable when"; mail captured, no network).
- Tests run (the worktree's Debug binary and runtime): framework AdminProtocols, AdminMailOutcomes, AdminConfiguration,
  AdminConnectionServices, AdminIdentityProviders 16 of 16; basic-comms BasicCommsComposeRef, BasicCommsSync 21 of 21 (the
  mail client's send result); mr-mantle DeliveryLedger, GatewayConnections 6 of 6; mr-boss AdminMailQueue, AdminAccess,
  AdminRegistries, AdminSecurity, AdminSettings, AdminRelays 22 of 22; ProjectsAccess 8 of 9, its deny-pattern feature
  failing on master too for `ironstone.insights` services (F173); `cargo test -p moqui-mail` 151 passed, `-p moqui-core`
  `service::protocol_admin` and `rust_services`; clippy clean on `moqui-core` and `moqui-mail`; rustfmt clean on the new file;
  `moqui lint --screens` 132 flagged sites, as master. By hand, not kept: the three screens and Health's Transport group in
  qvt, tui and html as the administrator. Prettier clean on the new and changed JavaScript. Not run: `./moq test-framework`,
  `./moq test-apps`, the acceptance suite, the rest of cargo; no browser and no running server, so the states of a server
  that opened its listeners are proven from given facts and the Rust unit tests, and no probe connected to anything (a
  refusal and an unconfigured target only).
- Inventories: none of ss-inventory's or usl-inventory's rows is P12's (design §15.2: the protocol screens have no Marble or
  Mantle baseline form).
- Design edits: design-admin §9 ProtocolsHome, MailQueue and ServerConfiguration (as built), §14 (Operational recovery: the
  mail owner registry and the operation results), §14.2 (Admin's row), §17.2 (OperationServices); design-crosscut CX-DELIVERY
  (the ledger as a registered owner: the owner's design, as the registration calls for).
- Findings (provisional, numbered by the lead):
  - **F161** What each listener did at startup lived only in the server's log (`moqui_core::startup`), and the conf's
    literal attributes are no property. Built: `get#ProtocolFacts`, a fixed list, as P10's `get#SignInPolicyValues`.
  - **F162** `deliveryOutcome` was an answer of the send and nowhere on the message; a template's failed message stayed
    Ready with no error at all. Built: `EmailMessage.sendOutcome` and the error (P8c-24). A Ready message with no outcome (an
    older failure, a send that stopped) is read as uncertain.
  - **F163** A retry here beside Mantle's ledger would send a notice twice (the ledger tries a waiting delivery again
    itself), and the ledger's failed attempts did not name their stored message. Built: the owner registry, the ledger as
    its first owner, and the attempt's `emailMessageId`. Other senders with attempts of their own (the report engine's
    deliveries, which keep no stored message; a later Marketing send) register the same way.
  - **F164** "RTC absent" (the plan's usable-when): the demo's package builds call media, so it reads off, not absent;
    absent on every package are local speech to text and office documents (WOPI), and call media on a Lite build. The
    acceptance checks call media by the build.
  - **F165** "DAV ready" holds on a running server: a command-line run (every spec) opens no listeners, so a protocol
    that is turned on reads "Configured" there. The acceptance takes either by `serverStarted`.
  - **F166** MailQueueFind's direction and owner-reference filters are not built: only outgoing mail has a stored
    outcome, and an owner's reference is its own record's. Nor is a view of subjects or addresses "independently
    authorized": the service returns none.
  - **F167** `EmailMessage` carries no organization, so the queue is not scoped by organization: an operations operator
    sees the transport outcomes (ids, counts, servers, struck-out errors) of every organization's mail on the instance.
  - **F168** Design §2 gives MailQueue to "O, I scoped". Built: the operator reads all of it; the integration
    administrator, with `ADMIN_CONNECTION_VIEW` alone, the instance's own mail (what goes through the relays she keeps),
    never a mail account's, and no action.
  - **F169** The area was the integration administrator's whole (P11). The operator opens three of its screens by a
    second group granted narrowly (the pitfall of an inherited grant), which the spec holds: MailRelays is refused him.
  - **F170** P0's Comms check: as F44. Comms' Settings are personal; ProtocolsHome links its MailAccounts and
    TextBlocks; there is no shared templates screen and no mail-account readiness projection, so a shared mailbox's sync
    state is not in ProtocolsHome (Comms' later work, §7).
  - **F171** The checks are a TCP connection and the configuration: no certificate expiry, DNS record, SSH host key
    fingerprint, UDP (call media, TURN, SIP) or WebRTC test (§7 with the Monitor checks; Remaining-Work).
  - **F172** `moqui-core`'s `registry_keys_are_the_function_paths` failed on master: P10's `get_sign_in_policy_values`
    and `sso::check_flow` were not in its list. Added with P12's.
  - **F173** ProjectsAccess's "every IronStone write service is in the client's deny pattern" fails on master for
    `ironstone.insights.AlertServices` and `DeliveryServices` (the Insights track's; not touched here).
  - **F174** The thirty-three protocol settings are instance settings like the others, so InstanceSettings'
    "Where each value comes from" lists them too for the configuration administrator.
  - **F175** A mail account's failed message can only be sent again or taken back by its sender; for an account whose
    owner has left, that is the lifecycle's owner change of a shared account (P6), and nothing for a personal one.
  - **F176** `retry#MailOutcome` holds the request for the SMTP session (up to the mail service's two minutes); a bulk
    retry is not built.
- Decisions: a protocol is a row of one table in the framework, and its state is read from the startup report and the
  build, a probe only on request; a trust mismatch is its own state, never ready; a check's target is the conf's own; the
  outcome of a failed send is kept on the message; a message belongs to its sender (a mail account, a registered owner,
  else the mail service) and only its owner's path sends it again; retryable, refused (permanent) and bounced messages may
  be sent again, an uncertain one never until someone settles it; Settle marks Sent by a person's word with the reason in
  the audit log, and a closed message is Cancelled; an owner that cannot be asked holds every message of the instance;
  an operation key keeps only an applied result; the queue reads the last fourteen days unless dates are given;
  protocol check results reuse `ConnectionCheck`.
- For the lead:
  - the shared release binary needs a rebuild after the merge (the Rust above), and a database made before needs the new
    column `EmailMessage.sendOutcome` and the tables of `MailOutcomeOwner` and `OperationResult`;
  - mr-mantle has a branch `adm/p12` to merge too (its worktree is `adm-p12/mr-mantle`, the runtime's `component/mr-mantle`
    repointed to it);
  - budget shares (Debug binary): framework about 0.3 s (AdminProtocols, AdminMailOutcomes); mr-mantle about 0.05 s; mr-boss
    about 1.0 s (AdminMailQueue); no budget raised;
  - merge: mr-moqui `ServerEntities.xml` and `AdminConfigurationData.xml` appended at their ends,
    `ConfigurationServices.xml` appended, `ConfigurationSettings.js` (the group readers), `BasicEntities.xml` (one field),
    `EmailClientServices.xml` (five small hunks), `service/mod.rs`, `rust_services.rs` and `rust_services_tests.rs` (a line
    or four each), `moqui-mail` `implementation.rs` and its tests, Attack-Surface, Parity-Diffs, Remaining-Work (the
    `org.moqui.admin` row only), the rest new files; mr-mantle `ShopFulfillmentSetupData.xml` appended, `MessageServices.xml`
    appended, `MessageDeliveries.js`, `DeliveryLedger.spec.js` appended; mr-boss `BossSetupData.xml` appended at its end
    (Insights appends there too), `Admin.js` (`areas`' comment, `linkPaths` after P11's), `Registry.js` (one adapter),
    `Protocols.xml`, `Admin.xml` (its comment), `AdminAccess.spec.js`, `AdminRegistries.spec.js` (one expectation),
    `design-admin.md`, `design-crosscut.md` (CX-DELIVERY, five lines: the ledger's owner design, as the registration calls
    for); P13 appends to `OperationServices.xml`, `OperationLib.js`'s users and the `AdminOperationServices` grant's pattern;
  - the user's call: F168 (whether the integration administrator reads the queue at all, and whether an operator should
    see a mail account's outcomes, which today show an id, a count and a struck-out error); whether a refused (permanent)
    and a bounced message may be sent again here (built: yes) or only a retryable one; Settle's "sent" marking the message
    Sent by a person's word (built, audited) or keeping a separate reconciled state; F167 (no organization scope on the
    queue); F174 (the protocol settings also listed in InstanceSettings);
  - to confirm a failure was not this phase's, ProjectsAccess was run once from the main checkout with its own runtime
    (`--nobuild`, the shared binary): F173; nothing was built or changed there;
  - the acceptance AdminProtocolsUsable to run when asked, and ProtocolsHome to look at once on a running server (F165).

**Review Nov 10 (P12).**
- Checked (the code paths, not the Built note): `moqui-mail`'s two send paths (only a failed delivery writes `sendOutcome` and
  `sendError`, in a transaction of its own; a client message's result stays `record#SendResult`'s; statuses, the answers and
  `deliveryOutcome` as before, so the ledger, the report engine's read, P11's retryable outcomes, PASS and invitations are
  untouched); `retry#MailOutcome` (the claim locks the row at the revision read and marks it uncertain before anything is
  sent, so a second request, a stopped server and a send that fails before the session all leave it held or uncertain,
  never sent twice; an uncertain or outcome-less message only through `reconcile#MailOutcome`; an operation key keeps an
  applied result only, for one user and target); `reconcile#MailOutcome` (ADMIN_OPERATION_MANAGE, a required reason, sent
  and notSent only from uncertain, the audit rows through `statusId`'s audit log and `auditRow`); every caller of
  `send#EmailTemplate` and `send#EmailMessage` for a sender that tries again on its own (below); `find#MailOutcomes`' answer
  (no subject, body, header or address; the relays' keeper forced to the instance's mail); `get#ProtocolFacts` and
  `probe#ProtocolTarget` (fixed lists, the target's host and port only from the conf's properties, one connection, a kind
  of failure and no text of the other side; no request value reaches an address); the group readers of
  `get#EffectiveSettings` (the filter is on the registered group before any narrowing; the 33 settings are ports, addresses,
  names, switches and one certificate file path); the SMTP trust logic against `moqui-host`'s `smtp.rs`;
  `rust_services_tests`' list (passes; P10's two and P12's two are the registered paths); the three screens and
  `BOSS_ADM_PROTOCOLS_OPS` (the area's screen not inherited, each transition to a framework service with its own check,
  MailRelays refused the operator in the spec); IdentityProviderDetail's `secretPassword` (both forms, the map and the
  transition); Mantle's ledger change (the attempt's `emailMessageId` only added; `resolve#Delivery`'s permission checked
  by the recover service); the specs (one render per screen, mail captured).
- Fixes:
  - **R1 (high: a notice sent twice).** Two senders that try a failed mail again on their own left a stored message the
    queue offered "Send again" for, as the mail service's own: the forum's delivery worker (`ForumDelivery`, retry with
    backoff) and the report engine's alert mail (tried again at the next evaluation). The forum now registers as an owner
    (`forumDeliveries`, `mantle.forum.DeliveryWorkerServices.find#MailOutcomeOwners`: every stored message of a site's
    `ForumMailSettings` template is the forum's, no retry and no reconciliation here); alert mail keeps no stored message
    (`createEmailMessage` false in `moqui-report` `alert.rs`, as a scheduled report's mail). The other callers were read:
    none tries a refused or unreached send again by itself (they read a Ready message as handed off), but for
    `send#CustomerPastDueEmail` if its job, shipped paused, is turned on.
  - **R2 (medium).** Sign-in mail (PASSWORD_RESET, SINGLE_USE_CODE, ADDED_EMAIL_AUTHC_FACTOR, EMAIL_AUTHC_FACTOR_SENT,
    ACCOUNT_SIGN_IN and the `pass_verification_template`) holds a reset password, a code or a link of its moment: it is
    not sent again from the queue (SIGN_IN_MAIL), only closed.
  - **R3 (medium, disclosure).** A mail account's message answered its error text (struck out), which can name an
    attachment or quote a server's words about the message: an account's row now answers no error, only its id, count
    and state.
  - **R4 (medium).** SMTP trust: two halves of every address (`0.0.0.0/1 128.0.0.0/1`) read as trusted; a range wider than
    /8 is now a mismatch. A listener bound to this machine behind the PROXY protocol with no allowed address on it read as
    trusted though the server refuses the proxy's own address: the exemption is removed. A bracketed IPv6 entry, which the
    server takes, read as a bad entry.
  - **R5 (low).** A message sent by a retry kept the claim's text as its `sendError`: the release clears it.
- Tests (the worktree's Debug binary, rebuilt for `alert.rs`): framework AdminProtocols, AdminMailOutcomes 6 of 6 (0.3 s;
  the trust cases and the sign-in and account rows added); mr-mantle DeliveryLedger 4 of 4 (a forum notice added to P12's
  feature); mr-boss AdminMailQueue, AdminAccess, AdminRegistries 14 of 14; `cargo test -p moqui-report alert` 11 passed,
  `-p moqui-core rust_services` passed. Not run: the suites, the acceptance tests, `lint --screens` (no screen changed).
- For the lead:
  - `crates/moqui-report/src/alert.rs` is Insights P8's file (three lines added in `send_contact`'s email parameters); the
    release binary needs the rebuild the Built note already asks for;
  - open, not fixed: a sender registered later that tries again on its own must register as an owner or keep no stored
    message (the past-due invoice job if it is ever turned on; a Marketing send); a Ready message with no outcome
    (`send#EmailTemplate` stopped before the delivery: no server, no SMTP host, no recipient in an allowed domain, which is
    every template mail on an instance with no SMTP host) reads "May have been sent" and waits for a person, where
    "Not sent" would be truer (it needs the mail service to keep an outcome for those returns); an earlier attempt's
    message of a ledger delivery stays in "Needs attention" for the fourteen days with no way to close it; a reconciliation
    whose owner applied and whose message then changed leaves the message uncertain with the owner refusing a repeat
    (no double send); if the ledger's attempt transaction fails after a failed send, its message is unowned while the
    delivery is still due; BasicComms' MessageDetail `resend` (ADMIN, before this phase) sends any stored message again
    with none of these checks;
  - the user's calls of the Built note stand; R2 and R3 are defaults built here that belong with them (whether an operator
    sees an account message's error; whether sign-in mail may ever be sent again);
  - `AdminMailOutcomes` and `DeliveryLedger` look up `mail.nowhere.invalid` once each with capture off (a resolver
    question, no connection).

**Follow-up Nov 10 (P12: settlement apart from the sent state).**
- The user's decision (Nov 10, §4): a person never sets a message's sent state; settling an uncertain send records the
  settlement apart and takes the message out of Needs attention, and does not mark it Sent. As built, `reconcile#MailOutcome`
  wrote `ES_SENT` for "sent" and `sendOutcome` retryable for "notSent" on the operator's word; every reader of the status
  then took it for a delivery.
- mr-moqui (no Rust; the shared release binary):
  - `entity/BasicEntities.xml`: `EmailMessage.sendSettlement` (delivered or notDelivered; audit logged),
    `sendSettledByUserId`, `sendSettledDate`, `sendSettledReason`, beside `sendOutcome`. No new entity.
  - `OperationMail.js`: `reconcile#MailOutcome` takes `delivered`, `notDelivered` or `abandon` and, for the first two, writes
    only the four settlement fields (the reason also as the audit row's): `statusId`, `sendOutcome`, `sendError`, `sentDate`
    and the claim stay as the transport left them. A new state `settled` (stateOf: a settlement over a send that is
    uncertain; text "Settled: reported delivered" or "Settled: reported not delivered"), answered with `settlement`,
    `settlementText`, `settledByUserId`, `settledByName`, `settledDate` and `settledReason`. Filters: `attention` and
    `uncertain` leave a settled message out, `settled` is new ("Settled by a person"), `sent` is `ES_SENT` alone, which now
    only a send writes. A settled message is not settled again (`ALREADY_SETTLED`; its operation key answers the first
    result) and offers no Settle or Close. Reported delivered is never sent again (`SETTLED`). Reported not delivered is
    eligible for Send again as a failed message is (not sign-in mail, not an owner's, not while an owner cannot be asked):
    `retry#MailOutcome` goes through `claim#MailOutcomeRetry`, which now also takes that state and clears the settlement
    with the claim (it was of the send before; the audit log keeps it), and the send's result is the state. A registered
    owner's message: the owner's service is called as before (the contract's words `sent` and `notSent` unchanged), then
    the settlement is recorded here the same way, the message never marked Sent.
  - `OperationServices.xml`: the descriptions of `find#MailOutcomes`, `retry#MailOutcome`, `reconcile#MailOutcome` (and its
    four new out-parameters) and one line of `claim#MailOutcomeRetry`'s.
  - `docs/security/Attack-Surface.md`: the mail queue's line.
- mr-mantle: `test/party/DeliveryLedger.spec.js` only (its queue feature expected the message `ES_SENT`). No service changed.
- BOSS: `Protocols/MailQueue.xml`: the dialog's options are "Reported delivered" and "Reported not delivered", its text says
  the record is kept beside the message and does not mark it sent, the button is Record; the answers "Settled as reported
  delivered. The message is not marked sent." and "Settled as reported not delivered. It can be sent again from the Settled
  list."; a "Settled by" column (who, when, the reason, through `display`, so escaped); the state chip's own color; the
  caption says Sent is only what a send succeeded in. The State filter's options are the service's (`stateList`), so
  "Settled by a person" is there in qvt and tui. ProtocolsHome's cards and the `admin.protocols` readiness provider count
  no message, so neither changed.
- Readers checked (what would have counted an operator-marked Sent, and no longer can): Mantle's `EmailMessageFiling` EECA
  (a mail account's message only, which is never settled here), `Sourcing`, `Awards`, `PurchaseOrderDocuments`,
  `PurchaseRevisions`, `SupplierScorecards`, `Sla`, `SavedReplies`, `SupportPortal`, `InvoiceServices` and `CollectionServices`
  (`sendStatus`), `OrderInfoServices`, the communication event status map (`ES_SENT` to `CeSent`), BOSS `Receivables.js`. None
  reads the settlement fields; none changed.
- Specs (adjusted, no render added): framework `AdminMailOutcomes` 3 of 3 (0.13 s: the settled message stays `ES_READY` and
  uncertain with no status audit row to `ES_SENT`, the settlement's four fields and its audit row, the state and its name in
  the list, the key's repeat, `ALREADY_SETTLED`, `SETTLED`, the four filters, the not-delivered one sent again once with its
  settlement cleared and the audit log keeping it); mr-mantle `DeliveryLedger` 4 of 4 (0.1 s); mr-boss `AdminMailQueue` 2
  of 2 (0.84 s: the one qvt render now of every state, with a settled row, its reason and no Settle on it; the transition
  leaves the message `ES_READY` and uncertain with the settlement). `lint --screens`: MailQueue's three `container` sites, as
  before. Acceptance `AdminProtocolsUsable` changed to expect the same, written and not run. Prettier clean. Not run: the
  suites, the acceptance tests, a tui or browser render.
- Design edits: design-admin §9 MailQueue (as built), design-crosscut CX-DELIVERY (one clause).
- Findings (provisional):
  - **F177** Mantle's ledger marks its own delivery `MdsSent` on a person's word (`resolve#Delivery` with
    `MESSAGE_DELIVERY_REVIEW`, from before this build), and the queue's Settle of a ledger message reaches it. Left as it is:
    the owner's record is the owner's. The stored message is no longer marked Sent with it. The user's call whether the
    ledger gets a settled state of its own.
  - **F178** Close (`abandon`) still writes `ES_CANCELLED` by a person, with the reason in the status audit row. It is
    not a sent state, so it is left.
  - **F179** A settlement holds for the send it was made for, and only the queue's claim clears it. A send of a settled
    message from outside the queue (BasicComms MessageDetail `resend`, ADMIN, the Review's open item) leaves it on the row:
    a result of Sent, refused or not sent reads as that, but if that send is lost part way the message still reads
    settled. To close it the mail service clears the settlement when it begins a send (Rust), or that resend goes through
    `retry#MailOutcome`.
  - **F180** A message reported not delivered leaves Needs attention like one reported delivered (the decision's
    words) and waits in the Settled list with Send again; it is not offered Close, and sign-in mail settled so has no
    action left.
  - **F181** Many readers take `ES_READY` for "queued" or "went" (`Collections`, `CaseFeedback`, `PurchaseOrderDocuments`,
    `Sourcing`, `SupplierPortal`, BOSS `Receivables` "Queued for delivery"): a failed, an uncertain and a settled message all
    read so there, as before P12. Not changed.
  - **F182** The resolution values are renamed (`sent`, `notSent` to `delivered`, `notDelivered`); the old ones are
    refused as malformed. The only callers were the screen and the specs.
- Decisions: the settlement is fields on the message row, not a record of its own (the filters stay conditions of one
  find; the audit log is the history); one settlement for a send, and a later send that is uncertain again may be settled
  again; a settlement is read only over an uncertain send, so a stale one never hides a known failure or a bounce; the
  settlement itself is the decision that lets a not-delivered message be sent again; who settled is answered by name to
  every reader of the queue.
- For the lead:
  - a database made before needs the four new `EmailMessage` columns (as `sendOutcome` did); no Rust, no rebuild;
  - shared lines with P13: `OperationServices.xml` only inside the mail section (the three services' descriptions,
    `reconcile#MailOutcome`'s out-parameters, one description line of `claim#MailOutcomeRetry`); the file's head comment and
    the two interface services at its end are untouched, and so is `OperationLib.js`;
  - mr-mantle has a commit (the spec's expectation only);
  - the user's calls: F177, F179 (whether to close it in Rust), F180;
  - budget shares unchanged (no feature added).

**Review Nov 10 (P12 follow-up).**
- Checked (the code paths, not the note): `reconcile#MailOutcome` writes only the four settlement fields for `delivered`
  and `notDelivered` (no `statusId`, `sendOutcome`, `sendError`, `sentDate` or claim), and `abandon` is P12's; Send again of
  one reported not delivered goes through `claim#MailOutcomeRetry` (its own transaction, the row locked, the revision
  compared), so of two requests one is refused, a settle and a retry cannot both pass (each compares the revision under
  the lock), and a server that stops after the claim leaves the message uncertain with no settlement; reported delivered
  is refused by the retry and by the claim; a second settlement is `ALREADY_SETTLED` or its key's first answer; sign-in
  mail and an owner's message are still never sent from here, and an owner that cannot be asked still holds a settled
  one. `stateOf` and the filters agree (`sent` is `ES_SENT`; `settled` is out of `attention`, `uncertain` and `bounced`;
  the count is the same find). `ES_BOUNCED` is only written over `ES_SENT`, so a bounce never lands on a settled message.
  The settlement fields have no writer but this service and the claim (no screen, entity-auto transition or mail client
  service names them); the reason is `plainText` (255, no `${`, no control characters) and shown through `display`. An
  owner's message: the owner's contract words unchanged, refused means nothing recorded; the ledger gives each attempt
  its own message and offers no retry here, so a settlement never goes stale on one. One qvt render of MailQueue still.
- Fixes:
  - **R1 (low, hardening)** a mail account's row answers no settled-by user, time or reason: such a message is never
    settled here (`OWNER_ONLY` comes before the write), so fields found on one were written by something else, and the
    row keeps to its state (P12 review R3). `OperationMail.js`.
- Tests: framework `AdminMailOutcomes` and `AdminProtocols` 6 of 6, mr-mantle `DeliveryLedger` 4 of 4, mr-boss
  `AdminMailQueue` and `AdminAccess` 9 of 9, on the shared release binary. R1 has no case of its own (the state it
  guards cannot be reached through a service).
- For the lead (open):
  - F179 stands and is the one way round the rule: a send of a settled message from outside the queue (BasicComms
    `resend`, ADMIN only) that is lost part way leaves the old settlement on the row, and one reported not delivered is
    then offered Send again without a new decision. That resend already sends an uncertain message with no decision
    (P12's open item); closing both is the mail service clearing the settlement when a send begins (Rust), or the
    resend going through `retry#MailOutcome`.
  - An owner's message: the owner's action commits in its own transaction before the message is locked, so a change of
    the message in between (`STALE_REVISION`) leaves the owner resolved and no settlement recorded, the row then in
    Needs attention with "Its owner reconciles it". As P12 built it; only a send's late result can cause it, and that
    result is then the state.
  - F177 and F180 are the user's calls, as the worker says.

**Follow-up Nov 10 (P12: a settlement cleared when a send begins, F179).**
- The user's instruction (Nov 10): look up whether there is a standard approach; "Off the top of my head I'd say clear
  the settlement when the send begins"; adjust the Rust as needed.
- The lookup (web search, about ten minutes; read from the search results' summaries, the pages not opened one by one).
  Established delivery systems keep the delivery state per attempt, written by the system alone, and a person's handling
  of one attempt neither changes that state nor carries to the next attempt: Stripe lists each event's delivery attempts
  with their results, a manual resend is one more delivery, and an event a person processed by hand is still held
  undelivered and retried (https://docs.stripe.com/workbench/webhooks,
  https://edge-docs.stripe.com/webhooks/process-undelivered-events); Postfix keeps per-recipient status of why mail is
  delayed and a requeue (`postsuper -r`) puts the message through again as a new pass
  (https://manpages.debian.org/testing/postfix/qmgr.8.en.html, https://leancrew.com/all-this/man/man1/postsuper.html).
  A send under way is marked before the transport is contacted, and a result that was not recorded is unknown, never
  the state before: the outbox pattern's `in_progress` with a lock time, a failure after the publish and before the mark
  being ambiguous (https://levelup.gitconnected.com/transactional-outbox-with-rabbitmq-part-2-handling-retries-dead-letter-queues-and-observability-d53217cf45e9,
  https://oneuptime.com/blog/post/2026-07-22-transactional-outbox-duplicate-events/view), and Stripe's word for such a
  result, "indeterminate" (https://docs.stripe.com/error-low-level). Nothing found keeps a manual resolution of one
  attempt over a later attempt. So the user's instinct is the standard one for a record with no attempt rows: the
  settlement is of one send and ends when the next begins. The fuller form of the principle is an attempt record per
  send that carries its own settlement (Mantle's ledger has one, which is why a ledger message never had F179); not
  built, F199.
- Decided and built: the mail service clears the settlement when a send of a stored message begins, and in the same
  write marks a message that was known not sent uncertain, for every caller. The send begins when the letter is handed to
  the transport: a refusal before that (no body, no address, no server, a host not allowed, no recipient in an allowed
  domain, an attachment that cannot be read) is no send and leaves the settlement, since nothing superseded the person's
  conclusion. A transport that refuses before it connects (a disabled server, a name not found) comes after the begin:
  the settlement is cleared and the outcome the transport gives (retryable) is the state.
- mr-moqui (Rust changed: a Debug binary built in the worktree; the shared release binary does not carry it):
  - `moqui-mail` `implementation.rs`: `begin_send`, called by `send_message` (`send#EmailMessage`) after its checks and the
    stored attachments and before `deliver`, for a message that is not a mail account's; in a transaction of its own (as
    the Sent status and the failed outcome are), one update, and none when there is nothing to supersede
    (`superseded_by_send`): the four settlement fields cleared when a settlement is there, whatever the status (the audit
    log of `sendSettlement` keeps what was reported, by whom and that it was cleared); `sendOutcome` set to uncertain for a
    Ready message whose outcome was retryable or permanent and for a Bounced one, so a send lost part way never reads "Not
    sent" or "Bounced" and is not offered Send again without a decision. A Ready message with no outcome already reads
    uncertain and gets no write (a first send costs nothing more). If the write fails the message is not sent (an error:
    nothing went out). `send#EmailTemplate` makes a new message and is unchanged. A mail account's message is left to the
    mail client, which claims it itself (`claim#DraftSend`), may hold its row, and is never settled.
  - `OperationMail.js`: `claim#MailOutcomeRetry` no longer clears the settlement (one mechanism, the mail service's): the
    claim still marks the message uncertain with its time before anything is sent, and a claim whose send never began
    leaves a "reported not delivered" as the person left it. Comments. `OperationServices.xml`: one sentence each in
    `retry#MailOutcome`'s and `claim#MailOutcomeRetry`'s descriptions. `BasicEntities.xml`: the settlement's comment and a
    sentence of `sendOutcome`'s description.
  - Callers found (all through `send#EmailMessage`, so all covered; none changed): the queue's retry; BasicComms'
    MessageDetail `resend`; Marble's SimpleScreens `sendEmailMessage` transitions (PartyEmails, EditInvoice, OrderDetail,
    ShipmentDetail); the relay test message, voicemail and call mail (new messages); the mail client (its own claim).
  - Docs: Attack-Surface (the mail queue's line), Parity-Diffs (P8c-24's row: the start of a send).
- BasicComms' `resend` is left as it is (ADMIN only, no settlement asked first, the operator's responsibility, as the
  user's Nov 10 call on sending again): the state after it is now truthful whatever happens to the send.
- BOSS: no code. design-admin §9 MailQueue (as built).
- Specs: `cargo test -p moqui-mail` 153 passed, 1 ignored (new: `a_send_that_begins_clears_the_settlement_of_the_send_before`:
  the table of what a send supersedes; the start alone, as a send lost part way leaves it, uncertain with no settlement
  and the audit row; a whole send from outside the queue, Sent with no settlement; a send refused before any attempt,
  the settlement kept); clippy clean on `moqui-mail` (all targets); rustfmt clean on the two files. Framework
  `AdminMailOutcomes` 3 of 3 (no feature added: the second feature gains a message settled and then sent by
  `send#EmailMessage` directly, as the resend does, Sent with its settlement cleared and the audit rows; its queue retry
  of one reported not delivered now proves the claim relies on the mail service) and `AdminProtocols` 3 of 3, 0.4 s
  together; mr-mantle `DeliveryLedger` 4 of 4; mr-boss `AdminMailQueue` 2 of 2 (1.3 s), all on the worktree's Debug
  binary. The spec's two checks of the settlement's audit rows no longer depend on the rows' order (the settlement's
  row and the clearing's can carry one timestamp, which failed on master among the other Admin and Report specs): run
  with AdminAccessCapabilities, AdminAccessServices, AdminConfiguration, AdminConnectionServices, AdminIdentityProviders,
  AdminNewDevice, AdminProtocols, AdminSessions, BusinessAlerts, BusinessDatasets, ReportAnnotations, ReportAudience and
  ReportDrill, 52 of 52 (7.2 s). Prettier clean on the two JavaScript files. BasicComms has no spec of `resend`. Not run: the suites, the
  acceptance tests, `moqui-host`'s SMTP and edge integration tests (they call `send#EmailMessage` on new messages).
- Findings (provisional):
  - **F199** The settlement is fields on the message, so only the last one is on the row and the earlier ones are
    in the audit log. The established form is a record per attempt with its own outcome and settlement (the ledger's
    shape). Not built: one clear at the start of a send gives the same truth on the row for far less; the user's call if
    the queue should ever show a message's attempts.
  - **F200** A send from outside the queue (BasicComms' resend, Marble's `sendEmailMessage` transitions) still asks
    for no decision on an uncertain or settled message, and may send one reported delivered. Left open by the user's
    Nov 10 call; what changed is the state afterwards.
  - **F201** `begin_send` leaves `sendError` as the last failure's text, so a message resent from outside the queue
    and lost part way reads "May have been sent" beside the error of the send before; and a retry whose send is refused
    before it begins keeps the claim's text ("A retry of this message began...") beside "Settled: reported not
    delivered". Cosmetic; a text of the mail service's own at the start of a send, cleared with Sent, would close both.
  - **F202** A mail account's message is outside this (the mail client's claim is its start, and it is never
    settled here): settlement fields found on one, which no service writes, would not be cleared by a send.
  - **F203** A message already Sent that is sent again from outside the queue and fails keeps `ES_SENT` with a
    `sendOutcome` (as before this change); the queue reads it as Sent. Its settlement, if any, is cleared.
- Decisions: clear at the start, not with the result; the start is the hand-over to the transport, so a refusal before
  it keeps the settlement; one mechanism, in the mail service, and the queue's claim relies on it; the same write marks
  a known "not sent" uncertain; a failed start write refuses the send; the resend is not restricted.
- For the lead:
  - the shared release binary needs a rebuild after the merge (`moqui-mail`); until then `AdminMailOutcomes` fails on it
    (the claim no longer clears the settlement); no schema change;
  - shared lines with P13: `OperationServices.xml` only inside the mail section (one sentence in `retry#MailOutcome`'s
    description, one in `claim#MailOutcomeRetry`'s); `OperationLib.js` untouched; `OperationMail.js` (the head comment,
    the claim's comment and its `setFields`);
  - other files: `crates/moqui-mail/src/implementation.rs` and `implementation_tests.rs`, `BasicEntities.xml` (the
    `EmailMessage` comment and one description), `AdminMailOutcomes.spec.js`, Attack-Surface, Parity-Diffs (one row);
    mr-boss `plan/design-admin.md` (§9 MailQueue, one sentence replaced) and this note;
  - the user's calls: F199 (attempt records), F200 (stands as decided), F201 (whether to tidy the texts);
  - budget shares unchanged (no feature added).

**Review Nov 10 (P12 follow-up, F179).**
- Checked, sound. Ordinary mail: `send#EmailTemplate` is untouched, and `send#EmailMessage` of a Ready message with no
  outcome and no settlement returns from `begin_send` before any transaction (`superseded_by_send` reads the row the send
  already read): no write, no lock, no new outcome on any path. The begin writes only for a message sent again (a kept
  retryable or permanent outcome, a Bounced status, a settlement). Its transaction is separate, so it blocks only if the
  caller's own transaction holds the row; the send's result writes (`update_sent`, `record_send_failure`) have always
  been separate in the same way, and no caller writes the row before the call (the queue's claim commits first;
  BasicComms' resend and Marble's four transitions only call the service). A failed begin write is a service error
  before the transport: nothing went out and the row is as it was (not sent, or settled), so it can be sent again; only
  a resend can meet it, never a first send, so no mail is lost by it. Refusals before the begin (no body or address, no
  server, no host, a host not allowed, no recipient allowed, an attachment) keep the settlement; a transport refusal
  after it leaves the transport's outcome. The queue: claim, then begin: two Send agains (the second finds the revision
  changed), a stop after the claim (held, then settled as it was: nothing reached the transport, since the begin always
  precedes it), a stop after the begin (uncertain, unsettled, RECONCILE_REQUIRED). A mail account's message never
  reaches the begin. Rust: no `unwrap` on a database path, the test covers the table, the begin alone with its audit
  row, a whole send and a refusal; clippy clean. The spec's audit checks are order-free.
- Fix (medium, of P12 itself, not of this change): `stateOf` read a claimed Bounced message as uncertain, not as
  sending, so it could be settled while its retry was under way; the begin had read no settlement and the message ended
  Sent, or Bounced and not sent, with a settlement on it. A claim now holds a Bounced message as it holds a Ready one;
  `AdminMailOutcomes` checks it (an assertion in its second feature).
- Tests: `cargo test -p moqui-mail` 152 passed, 1 ignored (the note above says 153); framework AdminMailOutcomes,
  AdminProtocols, AdminConfiguration, AdminConnectionServices, ReportAudience, BusinessAlerts 28 of 28 (3.9 s); mr-mantle
  DeliveryLedger, StaffInvitation 12 of 12; mr-boss AdminMailQueue, AdminInvitations, InsightsDelivery 13 of 13; Debug
  binary.
- For the lead, open:
  - a send from outside the queue takes no claim, so a person can settle an uncertain message in the queue while
    BasicComms' resend of it is in the transport: the begin read no settlement and the row keeps one of the send before
    (read as Sent if it went; as settled if that send ended uncertain). Part of F200; closing it needs the resend to
    take the queue's claim, or the settlement cleared with the result too.
  - two sends of one message at once from outside the queue can leave `sendOutcome` uncertain on a Sent row (the
    second's begin after the first's result); the queue reads Sent. With F203.
  - a queue retry of a message that was retryable and is refused before the begin (its server removed since) is left
    uncertain with the claim's text, though nothing was sent (as before this change; F201).

### P13 — System messages and recovery

Design §8 MessageTypes, MessageTypeDetail, SystemMessages and SystemMessageDetail, §14 operational recovery;
ADM-OPERATIONS.

- **OperationServices** `find#Messages`, `get#Message` (masked evidence; payloads behind the source's data permission),
  `preview#Recovery` and `execute#Recovery` over registered recovery descriptors (a framework seed record, §4) that
  name the eligible states, permission, reconciliation and retry actions; the native `reset#SystemMessageInError`,
  `cancel#SystemMessage`, `send#ProducedSystemMessage` and `consume#ReceivedSystemMessage` only where their action is
  safe; bulk recovery with a result per message.
- **ConfigurationServices** `find#MessageTypes`, `store#MessageType` (registered handlers only) and
  `get#MessageTypeUse`.
- **Commerce's `retry#StoreMessages`** registered as a recovery action (impl-commerce §7, owner contract).
- **Screens:** MessageTypes, MessageTypeDetail (MessageContract, MessageContractUse), SystemMessages (MessageFind,
  MessageList with bulk recovery), SystemMessageDetail (MessageEvidence, MessageAttempts, MessageRecovery).
- **Specs:** framework `AdminRecovery` (an ineligible message refused; an uncertain outcome offered reconciliation, not
  retry; a failed item does not stop the batch); BOSS `AdminSystemMessages` (SystemMessageDetail's one qvt render).
- **Usable when** (design §15.3 "Unknown provider outcome", "Independent failure"): `admin.operations` retries a failed
  Commerce channel message through Commerce's action, keeping its identity; a message whose provider outcome is
  unknown is offered reconciliation, not retry; and a batch of three with one ineligible names it and retries the
  others.

**Built Nov 10 (P13).**
- Checked first (the code over the plan): a system message keeps no outcome of its last send (only a status, a count and
  error rows), so "unknown" is read from a send or consume that never answered, or is its owner's word (F184); the
  framework's own send of a message in Error could not go back to Error (F183); `SystemMessageType` has no retry
  settings (F185); Commerce's `retry#StoreMessages` takes a binding, a list and a required operation key and checks
  Commerce's permission and store scope, so its registration needs an adapter in Mantle and adds no right (F187,
  F190); no Tools SystemMessage form is in ss-inventory or usl-inventory.
- mr-moqui (no Rust changed: everything ran on the shared release binary; no Debug build was made):
  - `entity/ServerEntities.xml` (appended): `moqui.server.RecoveryDescriptor` (general over kinds of record: target kind and
    key, a direction for a message, a mode for each of retry, reconciliation and cancellation, native, owner or none, the
    states a retry is offered in, the owner's permission, the permission that reads a payload, the owner's describe and
    recover services, the idempotency contract in words, the key of the owner's own place) and `moqui.server.MessageHandler`
    (a handler its owner registers for one message type and one role, send or consume). `entity/ServiceEntities.xml`: the
    seed status flow gains `SmsgSending` to `SmsgError` (F183, Parity-Diffs P8c-25).
  - `service/org/moqui/admin/OperationServices.xml` (appended, bodies in two new modules beside `OperationLib.js`).
    `OperationRecovery.js`, the engine: `preview#Recovery` and `execute#Recovery` over the descriptors, with a table of
    kinds (`SystemMessage` now; P14 adds job runs as one more module and one more row) and the owner contract's interfaces
    `find#RecoveryTargets` and `recover#OwnedTarget`. Eligibility in order: a registration, the action offered by it, the
    owner's permission, the kind's baseline (an unknown outcome is reconciled, never retried; one in progress is left),
    then the owner's own answer for the record. A batch (at most 25) takes each record on its own: read again, refused when
    stale or ineligible, claimed in a transaction of its own, then the native action or the owner's service, with one audit
    row for what was asked and why; a result per record, and an operation key answering a repeat by the same user with the
    first results (kept in a short form that fits `OperationResult`). `OperationMessages.js`: `find#Messages` (state,
    type, remote, direction, a whole reference, dates; each row with its state, the class of its last error, its owner and
    what may be done), `get#Message` (the row, attempts, status history from the audit log, each action's preview, and the
    payload only by the owner's registered permission and word), the internal `apply#MessageRecovery` (the locked step) and
    the message kind: retry (the framework's `send#ProducedSystemMessage` or `consume#ReceivedSystemMessage` for the same
    stored message, once), requeue (`reset#SystemMessageInError`), cancel (`cancel#SystemMessage`, of a message in Error
    only) and the reconciliation of a message whose outcome is unknown (Sent or Consumed by a person's word, or Error);
    a message of a `disabled` remote (P11) is not sent. `OperationLib.js` `once` takes an optional short form to keep.
  - `service/org/moqui/admin/ConfigurationServices.xml` (appended, bodies in the new `ConfigurationMessageTypes.js`):
    `find#MessageTypes`, `get#MessageTypeUse` and `store#MessageType` (a type's send or consume service set only to a
    handler registered for that type and role, by key; never cleared; the receive service never chosen; a type with no
    registered handler read only; name, content type and file transport options validated as their expander reads them; a
    revision and an audit row per field).
  - Data: `AdminConfigurationData.xml` (appended: a second member row of `AdminOperationServices` naming the four operation
    services, and the `AdminMessageTypeServices` grant naming the three). The framework registers no descriptor or handler of
    its own.
  - Docs: Attack-Surface (the system messages, recovery and message types paragraph), Parity-Diffs (P8c-25), Remaining-Work's
    `org.moqui.admin` row.
- mr-mantle (not in the plan's repositories: a worktree on `adm/p13` was added for the registration, F190):
  - `service/mantle/product/StoreChannelServices.xml`, `StoreChannels.js`: `find#MessageRecoveryTargets` (which system
    messages are a store integration's and what `retry#StoreMessages` would take now, answered only within the caller's
    own `COMMERCE_VIEW`, `COMMERCE_CHANNEL_OPERATE` and store scope; a message of a store outside it is answered as held,
    with no state, reference or detail) and `recover#StoreMessage` (a retry is `retry#StoreMessages` for that one message
    with the reason and the operation key; nothing else is offered). `data/StoreChannelSetupData.xml` (appended): the two
    descriptors (`storeChannelOrders`, `storeChannelEdi`: retry by the owner, the owner's permission, no reconciliation,
    no cancellation, no payload permission, the owner's place as the key `storeIntegration`).
- BOSS:
  - Screens (four, in the Integrations area): `Integrations/MessageTypes.xml` (MessageTypeFind, MessageTypeList) and
    `MessageTypeDetail.xml` (MessageContract as a form where the type is changed here and as a read-only list where it is
    not, with why; MessageContractUse with the handlers, the remotes, the registered recovery and the messages by status);
    `SystemMessages.xml` (MessageFind; MessageList; Recover several, which reviews each chosen message's own preview
    before `recoverMessages` runs the batch) and `SystemMessageDetail.xml` (Recovery with a dialog per eligible action and
    the reasons of the others; MessageEvidence; MessageAttempts with the status history; Content, shown only by the owner's
    permission and word). `Integrations.xml`: the four subscreens, and the operations operator lands on SystemMessages
    (`conditional-default`). No new `ironstone` service, so the client deny pattern is unchanged.
  - `Admin.js`: four link paths. `data/BossSetupData.xml` (appended): `BOSS_ADM_INTEGRATIONS_OPS` (the operations operator on
    the area's screen itself, not inherited, and on SystemMessages and SystemMessageDetail) and the settings index entry
    `admin.messageTypes`. BossUsersDemoData unchanged.
- Specs: framework `test/AdminRecovery` (3 features, 0.2 s on the release binary: the list and the evidence with no text,
  remote answer or token, the payload only with the registered permission and only when asked, nothing without a
  registration, a registration naming a missing service left out, an owner that cannot be asked, an owner's permission;
  a batch of eight with one sent, one failing again, and the unregistered, unknown, stale, disabled-remote, unanswered and
  unpermitted ones each named, the repeat under its key sending nothing, the unknown one settled as not sent and then
  retryable, cancel and requeue of a message in Error only, a consume retried once its registered handler is chosen;
  a type given only a handler registered for it and its role, `${}` and `..` refused in paths, the revision, the audit
  row, the operations permissions reading no type). Mantle `test/product/StoreChannels` (one feature extended, under
  half a second, not measured apart: the retry offered through the framework's recovery to the store's own operator, held from another organization's
  with no state, reference or error, refused an administrator without the channel permission, failing again while the
  product is not sold and then making the order once, the key's repeat answered). BOSS `test/Admin/AdminSystemMessages`
  (2 features, 0.8 s: SystemMessages', SystemMessageDetail's, MessageTypes' and MessageTypeDetail's one qvt render each;
  the batch of three with one ineligible, the settled unknown one and the handler through the transitions as the
  operator, the integration administrator and the reader; the operator refused Connections and MessageTypes).
  `AdminAccess` changed: the operator's `integrations` capability. `AdminRegistries` changed: the Instance group's new
  entry. Acceptance, written and not run: `test/acceptance/Admin/AdminRecoveryUsable` (3 features, the "usable when", with
  the HTTP fixtures: no network).
- Tests run (the shared release binary, this phase's runtime): framework AdminRecovery, AdminMailOutcomes,
  AdminProtocols, AdminConnectionServices, AdminConfiguration 16 of 16; mr-mantle StoreChannels, DeliveryLedger 8 of 8;
  mr-boss AdminSystemMessages, AdminAccess, AdminRegistries, AdminMailQueue, AdminRelays, ProjectsAccess,
  CommerceChannels 29 of 29; `moqui lint --screens` 132 flagged sites, as master (with the release binary: no Debug
  binary was built). By hand, not kept: the four screens in qvt, tui and html as the administrator on the demo (which
  has no system message yet: the lists empty, the twelve types with Store channel orders' registration and the backup
  mirror's read only), and Integrations as the operator, who lands on SystemMessages. Prettier clean on the new and
  changed JavaScript. Not run: `./moq test-framework`, `./moq test-apps`, the acceptance suite, cargo (no Rust changed);
  no browser; no request to a real host.
- Inventories: none of ss-inventory's or usl-inventory's rows is P13's.
- Design edits: design-admin §8 MessageTypes, MessageTypeDetail, SystemMessages and SystemMessageDetail (as built), §14
  (Operational recovery: the descriptor), §17.2 (ConfigurationServices, OperationServices); design-commerce ("Readiness and
  recovery registration" and Integrations' retry: the registration as built, the owner's design, as the owner contract
  calls for).
- Findings (provisional, numbered by the lead):
  - **F183** `send#ProducedSystemMessage` takes a message in Error, sets it Sending and on a failed send sets it back
    to the status it had; the seed status flow had no `SmsgSending` to `SmsgError`, so that update was refused and the
    message stayed Sending for good (in Tools too). Built: the transition in the seed data (P8c-25). An instance loaded
    before needs that seed row; without it a retry that fails again reads as outcome unknown, which is the safe side.
  - **F184** A system message keeps no outcome of its last send or consume (as `EmailMessage` did not before P12): a
    send that timed out after the request went reads as failed, like one that was refused. Built: "outcome unknown" is a
    message Sending or Consuming for longer than such a call may take (15 and 35 minutes), or its owner's word
    (`find#RecoveryTargets` `uncertain`); a retry of a failed message is offered only where a descriptor registers it,
    which is the owner saying a repeat is safe (the receiver or the consuming service answers the same message once).
    A send outcome on the message is a framework ask (Remaining-Work).
  - **F185** The design's MessageContract "retry settings": `SystemMessageType` has none; the retry minutes and limits
    are parameters of the scheduled send and consume jobs (P14's Jobs). Not built here.
  - **F186** No owner registers a second handler for a type, so on the demo every type is read only in
    MessageTypeDetail and `store#MessageType` is exercised by the specs alone. A type is changed here only when its owner
    seeds a `MessageHandler` row for it.
  - **F187** The "usable when" has `admin.operations` retry a Commerce channel message. Commerce's action checks
    `COMMERCE_VIEW`, `COMMERCE_CHANNEL_OPERATE` and the store scope, and the owner contract adds no right, so the demo's
    operations operator, who holds none of Commerce's, is told which permission is missing. The acceptance gives the
    operator Commerce's channel groups for the walk and takes them back.
  - **F188** A system message carries no organization, so the queue is not scoped by organization (as the mail
    queue, F167): an operations operator reads the transport rows of every organization's messages. Where a type's owner
    answers per message (Commerce), the references and the error line are shown only with the owner's word; for the
    other types the operator reads the correlation ids and a masked error line of every message.
  - **F189** Only Commerce's two descriptors exist. The other types of the demo (the payment and shipping gateways'
    webhooks, Accounting's bank files, the Git webhook deliveries, the backup mirror, the channel import batch) are read
    only in SystemMessages until their owners register a recovery; a native consume retry of a webhook would need its
    owner's word that the event is applied once.
  - **F190** The registration of `retry#StoreMessages` needed Mantle: the descriptor rows are the owner's seed data
    (§4), and the framework's contract is one record with a reason and a key while Commerce's takes a binding and a list.
    A worktree of mr-mantle was added.
  - **F191** Reading a payload leaves no access record (AccessLog is P17), and its masking is by field name
    (password, secret, token, key, authorization, signature), not by what a value is.
  - **F192** The scheduled send or consume job and an operator's retry of a message that is "failed, tried again on
    its own" can both take it (as the job and Tools can): the claim makes the job pass it over for its retry interval,
    but a job run already under way is not stopped. A registered native retry is by its registration safe to repeat.
  - **F193** MessageEvidence's "original operation, trace" is the message's own references; a link into Monitor's
    trace is not built (a message keeps the visit that triggered it, not a trace id).
  - **F194** A batch is at most 25 records, so its results fit `OperationResult` in a short form (each record's
    outcome and a cut reason); the design names no limit.
  - **F195** The integration administrator's area grant is inheritable, so she opens SystemMessages and
    SystemMessageDetail and is told they are not available to her (the services check `ADMIN_OPERATION_VIEW`); the
    operator's group is granted the two screens narrowly, which the spec holds (Connections and MessageTypes refused).
  - **F196** Commerce's descriptor for `EdiX12` answers only the interchanges of a store's partner; another EDI
    connection's messages are not owned here (`NOT_OWNED`) and stay the EDI administrator's.
- Decisions: nothing is recovered without a registration, and a registration is its owner's seed row; one descriptor
  record for every kind of recovery target, a kind being a module with its states, baseline and native actions; a native
  mode is the owner's word that a repeat is safe; an unknown outcome is never retried, queued again or cancelled, only
  settled by a person's word, after which a message known not done is failed and may be retried; a retry that fails
  again leaves the message failed with its attempt counted; cancel and requeue take a message in Error only; every action
  needs a reason and leaves one audit row beside the status rows the framework's services write; a batch that applied
  anything is kept for its key, one that applied nothing may be corrected and repeated; a payload is shown only by the
  owner's registered permission and, where the owner answers per message, the owner's word; a message type's receive
  service and a handler's clearing are never offered; a type with no registered handler is read only; SystemMessages and
  SystemMessageDetail are in the Integrations area, the operator's by a narrow group.
- For the lead:
  - no Rust changed, so the shared release binary needs no rebuild for this phase; a database made before needs the tables
    of `RecoveryDescriptor` and `MessageHandler` and the seed data loaded again (the status transition, the grants,
    Mantle's two descriptors, BossSetupData's group and entry);
  - mr-mantle has a branch `adm/p13` to merge too (its worktree is `adm-p13/mr-mantle`, the runtime's
    `component/mr-mantle` repointed to it);
  - budget shares (release binary): framework about 0.2 s (AdminRecovery); mr-mantle under 0.5 s (StoreChannels'
    extended feature, not measured apart); mr-boss about 0.8 s (AdminSystemMessages); no budget raised;
  - merge: mr-moqui `ServerEntities.xml` and `AdminConfigurationData.xml` appended at their ends, `OperationServices.xml`
    and `ConfigurationServices.xml` appended (and a line of each header comment), `ServiceEntities.xml` (one seed row),
    `OperationLib.js` (`once`'s optional fifth parameter), Attack-Surface, Parity-Diffs, Remaining-Work (the
    `org.moqui.admin` row only), the rest new files; mr-mantle `StoreChannelSetupData.xml` appended,
    `StoreChannelServices.xml` (two services after `retry#StoreMessage`, one sentence of `retry#StoreMessages`'
    description), `StoreChannels.js` (a section before `operations`), `StoreChannels.spec.js`; mr-boss `BossSetupData.xml`
    appended at its end (Insights appends there too), `Admin.js` (`areas`' comment, `linkPaths` after P12's),
    `Integrations.xml`, `AdminAccess.spec.js` and `AdminRegistries.spec.js` (one expectation each), `design-admin.md`,
    `design-commerce.md` (two passages, the owner's design); P14 adds job runs as a kind (`kindModules` in
    `OperationRecovery.js`, a module like `OperationMessages.js`) and its own member row of `AdminOperationServices`;
  - the user's call: F187 (whether the demo's operations operator should also hold Commerce's channel capability, so
    the queue's retry of a store message works for that user as shipped; built: no, the owner's permission is asked
    for); F188 (whether an operator may read the references and error lines of every organization's messages of the
    types no owner answers for); F189 (which owners register next: the gateways' webhooks and Accounting's bank
    files); whether the message service's own reconciliation (marking a message Sent or Consumed by a person's word) is
    wanted at all, or only an owner's (built: where a descriptor registers it; Commerce registers none); whether
    MessageTypeDetail should change file paths for a delegated administrator (built: yes, for a type its owner
    registered a handler for; the paths are on the type's remote file server); F184 (a send outcome on the message);
  - `test/acceptance/Admin/AdminRecoveryUsable` was written and not run, as the brief asks (AGENTS.md would have a new
    acceptance test run once): it leans on the demo store's channel intake and on the operator's organization scope
    outside a screen, which no regression spec here proves, so run it when asked and expect to adjust it.

**Review Nov 10 (P13).**
- Checked (the code paths, not the Built note): `preview#Recovery` and `execute#Recovery` (the kind from a fixed table by
  own name; no service, status or descriptor named by a request; a descriptor read and checked each time; eligibility in
  `evaluate` for the preview and again per record at execute, after the revision read is compared, then once more under
  the row's lock in `apply#MessageRecovery`; `ADMIN_OPERATION_MANAGE` and the descriptor's `managePermission` both by
  `ec.user.hasPermission`; nothing runs with authorization off: an owner's service is called as the operator, under the
  inherited grant of `execute#Recovery`, and Commerce's `retry#StoreMessages` and `retry#StoreMessage` each compute
  `COMMERCE_VIEW`, `COMMERCE_CHANNEL_OPERATE` and the store scope from the user's permissions, organizations and StoreStaff
  rows, not from a filter set of the grant, so the registration adds no right); the native actions (only under a
  descriptor's native mode; a disabled remote held in the baseline for retry and requeue, whatever the mode, and again by
  `send#ProducedSystemMessage`; an unknown outcome held before the mode is read; cancel and requeue of Error only); the
  batch (a result per record, `executeOne` never throws, each step and each action a transaction of its own, 25 at most,
  the key by user, kind, action and the ids' digest; `OperationLib.once`'s fifth parameter defaults to the whole result,
  so P12's three mail callers store what they stored); `find#Messages` and `get#Message` (no message text; a payload only
  with a descriptor's `dataPermission`, held, asked for and, where the owner answers, its word: no descriptor registers one
  today; `safeText` on every error line, owner text and failure); `store#MessageType` (a handler only by a registered key
  of that type and role, never cleared, the receive service never written; the three paths are paths on the type's remote
  file server, read by `sftp.rs` and `backup.rs` and expanded as a script template: `${` refused but for the sender's six
  names in the send path, a `..` segment and control characters refused; no path is a local file or a resource location, so
  a scheme in one names nothing here); the seed transition (the flow already let Sending go to Sent, Produced and
  Cancelled; Error is one more, used by the framework's own revert); Mantle's adapter (one message, the caller's own scope,
  an out-of-scope store's message answered with no state, reference or integration; the EDI descriptor answers only a
  store partner's interchanges); `BOSS_ADM_INTEGRATIONS_OPS` (the area's screen not inherited; the two screens' transitions
  each reach `execute#Recovery`); F195 (the integration administrator's renders of SystemMessages and
  SystemMessageDetail call `find#Messages` and `get#Message` only, which refuse her: the screens then say "not available"
  and compute nothing else); the specs (one qvt render per screen; the refused opens are not renders).
- Fixes:
  - **R1 (high: a message sent or consumed twice; F192).** `send#ProducedSystemMessage` and
    `consume#ReceivedSystemMessage` read the status and then set Sending or Consuming unconditionally, so the scheduled job
    (whose async call for a "failed, tried again on its own" message was already queued) and an operator's retry could both
    pass the check and both send, or both run the consuming service; the queue's own claim only pushed the next job run
    away. Fixed in the framework's services, for every caller (the job, Tools, Admin): `claim#SystemMessage`, in a
    transaction of its own with the row locked, sets Sending or Consuming only while the message is still in the status
    read; the loser returns an error and sends nothing, and the queue answers it as IN_PROGRESS. Parity-Diffs P8c-26.
  - **R2 (high: against the Nov 10 decision).** The native reconciliation set `SmsgSent` or `SmsgConsumed` (with a
    processed date) or `SmsgError` on a person's word, which every reader of the status, a status hook or a rule takes for
    a delivery. Made a settlement apart, as mail's: `SystemMessage.outcomeSettlement` (done, notDone; audit logged) with
    `outcomeSettledByUserId`, `outcomeSettledDate` and `outcomeSettledReason`; the status, the processed date and the
    attempts stay as the transport left them. A settled message is its own state (`settled`, "Settled: reported sent" and
    the like, with `settlement`, `settlementText`, `settledByName`, `settledDate`, `settledReason`), out of Needs attention
    and of the unknown and done lists, with its own filter ("Settled by a person"). One reported done is never sent or
    consumed again (SETTLED) and is not settled twice (ALREADY_SETTLED); one reported not done may be retried: the retry's
    claim moves it to Error and clears the settlement, and the send's own result is its state. The framework's claim (R1)
    clears a settlement too, so a send from outside the queue never leaves a stale one (mail's F179 does not arise here).
    An owner's reconciliation records the same settlement beside the message where its transport outcome is unknown.
    Screens, the audit text ("Settle (reported done): reason"), design-admin §8 and §14, Attack-Surface changed.
  - **R3 (medium: an owner's reconciliation or cancellation could never run).** Every owner action was claimed first with
    the retry's claim, which takes only a failed message, so a registered owner reconciliation of an unknown outcome (or
    of a message only the owner calls unknown) answered STALE_REVISION for good. Only an owner's retry is claimed now; its
    settlement and cancellation are guarded by the owner's own state and the operation key. No descriptor registers one
    yet.
  - **R4 (medium, disclosure).** A message its owner holds from the reader (another organization's store, or an owner that
    cannot be asked) still answered its remote's id and name (a store binding's remote names the store and the channel)
    and, in the detail, who changed its status and the reasons they typed. Neither is answered now; the row keeps its id,
    type, direction, status, times, attempts and the class of its error.
- Tests (the shared release binary, this phase's runtime): framework AdminRecovery 3 of 3 (0.2 s; changed: the settlement
  beside a message left Sending, no status row to Sent, the lists, SETTLED and ALREADY_SETTLED, the not-done one sent again
  with its settlement cleared, two claims of one status of which one is taken, a held message's row), AdminMailOutcomes,
  AdminConnectionServices, AdminProtocols, AdminConfiguration 16 of 16; mr-mantle StoreChannels, EdiX12, GatewayContracts,
  AuthorizeNetGateway, PayTraceGateway, ShippoGateway, BankFileServices, BankOutputFiles, StoreFeeds, DeliveryLedger 105 of
  105 (every spec that sends or consumes a system message, for R1); mr-boss AdminSystemMessages 2 of 2 (0.8 s; the list's
  one render now of every state with a settled row, the transition leaves the message Sending with its settlement),
  AdminAccess, AdminRegistries, AdminMailQueue, ProjectsAccess, CommerceChannels 27 of 27. Prettier clean. Acceptance
  `AdminRecoveryUsable` changed to expect the settlement, not run. Not run: the suites, cargo (no Rust changed, but
  `moqui-core` `system_sync` tests, `moqui-git` hosting tests and `moqui-host` `ssh.rs` call `send#ProducedSystemMessage`
  from the runtime's XML and so run R1's claim: they are the final suite's to confirm), `lint --screens` (no widget
  changed), a tui or browser render.
- For the lead:
  - a database made before needs `SystemMessage`'s four new columns; no Rust changed, so no rebuild;
  - merge: `impl/SystemMessageServices.xml` (one new service before `send#ProducedSystemMessage`, and the two claim calls),
    `entity/ServiceEntities.xml` (four fields after `triggerVisitId`), Parity-Diffs (P8c-26 after P8c-25); master's P12
    follow-up touched `OperationServices.xml`'s mail section and `OperationMail.js`, which this review did not;
  - F188, as it is now, for the user's call: for a type no owner answers per message (every type but Commerce's two
    today) an `ADMIN_OPERATION_VIEW` holder reads, of every organization's messages: the id, type, remote (id and name),
    direction, status, times and attempts, the envelope id, the other system's id and the document type, the class and
    one masked line (200 characters; addresses, URL paths, credentials and long tokens struck out, a remote's answer cut
    to its status) of the last twenty failures, the status history with who and the reasons typed, the text's length and
    the count of messages split from it. Never the text. An error line is whatever the consuming service wrote, so it can
    name an order, a customer or an amount. Commerce's messages of a store outside the operator's scope answer the
    transport row only (R4). A whole reference still finds a held message by its envelope id (an oracle for a guessed id);
  - F191 stands: masking is by pattern and field name. No payload is readable today (no `dataPermission` is
    registered); an owner that registers one should know a value is hidden only when its field is named like a
    credential;
  - the user's call on MessageTypeDetail's file paths stands with one thing to weigh: there is no allowed root, so for a
    type its owner registered a handler for, a `ADMIN_CONNECTION_MANAGE` holder may point the receive path at any directory
    the remote's account reads, and with the delete response the poll then removes what it took there. P11 keeps a
    remote of a file type read only in Connections. No type is changeable on the demo (F186);
  - a settled message reported done stays Sending or Consuming for good, as evidence: nothing here closes it (mail has
    Close); cancel takes a message in Error only. The user's call whether a settled one may be cancelled;
  - a native retry passes `willRetry` false also for a message the job will try again, so its business operation records a
    rollback, not a retry (low; left);
  - Mantle's StoreChannels feature the worker extended runs 3.2 s as a whole (within the spec limit; not measured against
    master);
  - provisional findings: **F197** the framework's send and consume were not atomic for any caller (R1); **F198**
    a status hook or rule on Sent or Consumed would have fired on an operator's word (R2).

### P14 — Jobs and topics

Design §10 Jobs, JobDetail, JobRuns, JobRunDetail, Topics and TopicDetail; ADM-OPERATIONS, ADM-REPORTS.

- **OperationServices** `find#Jobs`, `store#Job` (schedule, pause, priority, registered safe parameters and recipients;
  the service and run-as identity fixed by the owner), `find#JobRuns`, `get#JobRun`, `get#JobRunItems` (the owner's
  registered recovery provider), `find#Topics`, `store#TopicDefaults` and `store#TopicSubscription`; JobExecution
  through `preview#Recovery` and `execute#Recovery`, a manual run where the owner allows it.
- **`report/admin-job-runs.json`**, the failing-or-late alert template on job-run telemetry (P0), shipped read only.
- **Screens:** Jobs (JobFind, JobList), JobDetail (JobConfiguration, JobParameters, JobNotifications, JobExecution),
  JobRuns (RunFind, RunList), JobRunDetail (RunEvidence, RunItems), Topics (TopicList), TopicDetail (TopicDefaults,
  TopicSubscriptions).
- **Specs:** framework `AdminJobs` (an arbitrary service refused; a lock not deleted to idle a job; a wrapper with
  failed items not shown as success); BOSS `AdminJobRuns` (JobRunDetail's one qvt render).
- **Usable when** (design §15.3 "Monitor reuse"): `admin.operations` pauses and resumes a job with its next run shown in
  the job's zone, opens a run's trace in Monitor only with Monitor's grant, and copies the job-run alert template to an
  owner so it fires.

**Built Nov 10 (P14).**
- Checked first (the code over the plan): Monitor is now a section of System (`system/Monitor/...`, opened by System's
  grant; `MONITOR_APP` is gone), so "Monitor's grant" is System's (F204); P0's shipped report source holds: a job run's
  root span carries `moqui.job.root`, `moqui.job.name`, `moqui.job.run.id` and an error status, `moqui.job.runs` counts
  outcomes only, and nothing signals a late run (F205, as F45); Tools' "Run Job" (`ec.service.job(name).run()`,
  jobs.rs `run_job_now`) runs the job as its caller and takes no lock, so it can run beside a scheduled run (F206); a
  job's notifications carry the run's errors, parameters and results unmasked (F209); `allNotifications` on a private
  topic is how the framework's own job error and web error topics reach administrators, so refusing it in the
  notification resolution does not fit (F210); `ServiceJob` and `NotificationTopic` have no owner and
  `ServiceJobRun` no organization (F208, F212); the retry limits of a message are parameters of the two message jobs
  (F185).
- mr-moqui (no Rust changed: everything ran on the shared release binary; no Debug build was made):
  - `entity/ServerEntities.xml` (appended): `moqui.server.JobRegistration` (a job its owner registers: owner, title, which
    of schedule, pause, priority and wait after an error may be changed, the shortest interval of a schedule set here, the
    owner's permission, the permission a notification recipient must hold), `JobParameterDefinition` (a parameter safe to
    change: integer, decimal, boolean, option or text, with bounds) and `TopicRegistration` (a topic its owner registers:
    the delivery settings that may be changed and the permission that is its audience); `RecoveryDescriptor` gains
    `itemsService`.
  - `service/org/moqui/admin/OperationServices.xml` (appended, bodies in two new modules). `OperationJobs.js`: `find#Jobs`
    (every job but the queued calls: schedule in words, state, next and last run in the machine's time zone, owner),
    `get#Job`, `store#Job` (only a registered job, only what was registered; no parameter for the service, the run-as
    identity, the topic, the time limits, the lock expiry or the dates; a cron expression that parses and is no more
    frequent than registered; a parameter of its registered type and bounds, a text of plain words only; a recipient by
    username, only an account that holds the registered permission, one answer for an unknown name and an outsider; a
    revision over the job, its parameters and its recipients; an audit row per change), `find#JobRuns` and `get#JobRun`
    (a bounded range; the class of an error and masked lines; the numbers among the results; parameter names with a value
    only where it is a number, a yes or no, or registered; a run without an error whose results or owner's items count
    failures is `itemsFailed`), `get#JobRunItems` (the owner's registered `itemsService`, the interface
    `find#JobRunItems`, called as the reader and read as data), the internal `apply#JobRecovery`, the framework's own
    provider `find#MessageJobRunItems`, and jobs as the recovery kind `ServiceJob` (one more row of `kindModules` in
    `OperationRecovery.js`): its one action, a run outside the schedule, natively marks the job due under its lock row
    (locked, at the revision read, only while no run holds the lock) so the scheduler's own claim starts it, as itself.
    `OperationTopics.js`: `find#Topics`, `get#Topic`, `store#TopicDefaults` (`ADMIN_SETTINGS_MANAGE`; only the registered
    delivery settings) and `store#TopicSubscription` (`ADMIN_OPERATION_MANAGE`; only an account of the topic's registered
    audience; `allNotifications` never set, only ended).
  - Data: `AdminConfigurationData.xml` (appended: a third member row of `AdminOperationServices` naming the ten services;
    the framework's own registrations: the two system message jobs with `retryMinutes` and `retryLimit` as registered
    parameters, a native run and their items; `clean_ServiceJobRun_daily` with `daysToKeep`; the `ServiceJobError`
    topic with its audience).
  - Docs: Attack-Surface (the jobs and notification topics paragraph), Remaining-Work's `org.moqui.admin` row. No
    Parity-Diffs entry: no existing behavior changed.
- BOSS:
  - Screens (six, in the Operations area): `Operations/Jobs.xml` (JobFind, JobList, the counts, the alert template's
    line), `JobDetail.xml` (Run: JobExecution in a dialog per registered action, and why not otherwise; Configuration:
    the facts and JobConfiguration; JobParameters as editable rows for the registered ones; JobNotifications with a
    dialog), `JobRuns.xml` (RunFind, RunList), `JobRunDetail.xml` (RunEvidence with the masked error lines and the
    parameters; RunItems; the trace link only by System's grant), `Topics.xml` (TopicFind, TopicList) and
    `TopicDetail.xml` (TopicDefaults as a form where a setting is changed here; TopicSubscriptions with a dialog).
    `Operations.xml`: the six subscreens, and the configuration administrator lands on Topics (`conditional-default`). No
    new `ironstone` service, so the client deny pattern is unchanged.
  - `report/admin-job-runs.json`: the alert template "Failing job runs" on `otel_spans` (root spans of job runs with an
    error status, by job, in the last hour), with no contact point; a template until copied to an owner.
  - `Admin.js`: six link paths. `data/BossSetupData.xml` (appended): `BOSS_ADM_OPERATIONS_TOPICS` (the configuration
    administrator on the area's screen itself, not inherited, and on Topics and TopicDetail) and the settings index entry
    `admin.topics`. BossUsersDemoData unchanged.
- Specs: framework `test/AdminJobs` (4 features, 0.1 s on the release binary: an unregistered job and an arbitrary
  service, user, topic or time limit refused or never written, an unregistered and an undeclared parameter, an expression,
  a path, a URL, an address and out-of-bounds values, a schedule that is too frequent, unreadable or cleared, a stale
  revision, then the registered changes with their audit row, pause and resume with the next run in the machine's zone,
  a recipient of the audience only; a run asked of the scheduler: refused for a job a run holds, whose lock and run row
  are left as they were, for an unregistered, a paused and a stale one, taken once, the lock left free and due with no
  run row made, the key's repeat and a second request, two requests at one revision; a run with failed items by its
  results and one by its owner's items not a success, errors and parameters masked; a topic's registered default only,
  private and the title template never written, an approval kept, nobody subscribed to a private topic without an
  audience or outside one, `allNotifications` never set and ended, names only within the audience). BOSS
  `test/Admin/AdminJobRuns` (2 features, 1.2 s: JobRunDetail's, Jobs', JobDetail's, JobRuns', Topics' and TopicDetail's
  one qvt render each; pause, resume, a run asked for, a default and a subscription through the transitions as the
  operator, the configuration administrator and the reader; the configuration administrator refused Jobs and Health).
  `AdminAccess` changed: the configuration administrator's `operations` capability. `AdminRegistries` changed: the
  Instance group's new entry. Acceptance, written and not run: `test/acceptance/Admin/AdminJobsUsable` (3 features, the
  "usable when"; its third needs the telemetry store).
- Tests run (the shared release binary, this phase's runtime, the branches rebased on master's P12 follow-up): framework
  AdminJobs, AdminRecovery, AdminMailOutcomes, AdminConfiguration, AdminProtocols, AdminConnectionServices 20 of 20;
  mr-boss AdminJobRuns, AdminAccess, AdminRegistries, ProjectsAccess, AdminSystemMessages, AdminMailQueue 27 of 27.
  `moqui lint --screens` 132 flagged sites, as master, no parse failure (with the release binary: no
  Debug binary was built). By hand, not kept: the six screens in qvt, tui and html on the test load as the operator and
  the configuration administrator (Jobs' hundred jobs with the three registered, JobDetail of the send job, TopicDetail
  of the job error topic for each of the two, the configuration administrator's landing on Topics). Prettier clean on
  the new and changed JavaScript. Not run: `./moq test-framework`, `./moq test-apps`, the acceptance suite, cargo (no
  Rust changed); no browser.
- Inventories: none of ss-inventory's or usl-inventory's rows is P14's.
- Design edits: design-admin §8 (MessageTypeDetail: the retry settings are the jobs' parameters), §10 Topics and
  TopicDetail, Jobs, JobDetail, JobRuns and JobRunDetail (as built) and Monitoring (Monitor under System's grant), §14
  (Operational recovery: the `ServiceJob` kind and the job and topic registrations), §17.2 (OperationServices).
- Findings (provisional, numbered by the lead):
  - **F204** Monitor is a section of System: the trace link is `system/Monitor/TraceDetail`, shown only to a user
    System's grant opens (`ContextServices.get#AppAccess`); the operator sees the trace id alone. The design said
    `MONITOR_APP`; edited.
  - **F205** Job-run telemetry is enough for a failing-runs alert and not for a late one (no lag signal): the template
    is failing runs only; Jobs reads "late" from the lock and the schedule (due for more than ten minutes, not started,
    not waiting out a retry). On an instance whose scheduler does not run (a spec's load) every due job reads late.
  - **F206** `ec.service.job(name).run()` runs a job as its caller (authorization off) and claims no lock, so Tools'
    Run Job can run beside a scheduled run, under an administrator's identity. Built without it: a native run marks the
    job due and the scheduler runs it. What follows from that: it starts at the next pass, not at once; only a scheduled,
    unpaused job within its dates can be asked for; after a failed run the scheduler still waits the job's retry time;
    and the lock's last run time is set just before the schedule's last occurrence, so a service that reads its
    `lastRunTime` parameter as a window sees that time, not its true last run (its owner registers the run as safe to
    repeat). A claim on an explicit run is a framework ask (Remaining-Work).
  - **F207** A job run has no "unknown outcome" to settle here: a run whose server stopped is ended with an error by
    the scheduler when it takes the lock over, and the job is due again by the framework's own rule. No settlement is
    kept on `ServiceJobRun`; a run that never ended and is not what the lock holds is listed as not ended. An owner's
    word that its last run's outcome is unknown (`find#RecoveryTargets`) holds the run (`OWNER_RECONCILES`). Cancelling a
    run under way is not offered: no owner registers one, and nothing here stops a worker.
  - **F208** A job run carries no organization, so the queue of runs is not scoped (as the mail queue, F167, and
    system messages, F188): an operator reads the masked evidence of every organization's jobs. JobFind and RunFind have
    no organization filter.
  - **F209** A job's notification (its topic's, and `ServiceJobError`'s) carries the run's errors, parameters and
    results unmasked, more than JobRunDetail shows. Built: a recipient is added only where the owner registered the
    permission a recipient must hold; the framework's three jobs name `ADMIN_OPERATION_MANAGE`. `ServiceJobError`'s
    default is not to notify, so a recipient is told only with a setting of their own on that topic (JobDetail says so;
    the operator sets it in TopicDetail, whose audience is the same permission).
  - **F210** The contained framework fix for `allNotifications` on a private topic was not made: `WebServletError` and
    `ServiceJobError` are private topics with no default delivery, and reach an administrator only through
    `allNotifications` (Tools' UserAccountDetail sets it; moqui-mail's sender tests rely on it), so refusing it in the
    resolution would silence them. It is guarded at the write instead: `store#TopicSubscription` has no parameter that
    turns it on and only ends it, and subscribes nobody outside a topic's registered audience. Tools and mr-marble's
    MyAccount/User/Notifications (Insights P8's finding, unchanged, read only here) still set it. An audience on a topic
    that the resolution itself honors is a framework ask.
  - **F211** F185 is answered here: `retryMinutes` and `retryLimit` are registered parameters of the framework's send
    and consume jobs, for every type at once, not per message type.
  - **F212** `ServiceJob` and `NotificationTopic` have no owner: the registrations give them one. Only the
    framework's three jobs and one topic are registered, so on the demo the other hundred jobs and every other topic are
    read only in Admin until their owners (Mantle, the BOSS apps) seed their rows.
  - **F213** `NotificationTopic.receiveNotifications`' description says it defaults to N; the resolution delivers when
    it is not set (notify/message.rs `receives`). Topics shows "Yes (not set)".
  - **F214** A subscription is listed by name only for a user of the topic's registered audience, to a holder of
    `ADMIN_OPERATION_VIEW`; the framework knows no organization of an account, so those names are not scoped by
    organization (the audiences registered today are operators'). Every other setting is counted.
  - **F215** The Operations area's grant is inheritable for the administrative reader, who therefore opens Jobs,
    JobRuns and Topics and is told they are not available (the services check their permissions), as F195. The
    configuration administrator's group is granted the two topic screens narrowly, which the spec holds.
  - **F216** Not built of the design's forms: JobParameters' "secret references" (a secret is never a registered
    parameter), JobFind's and RunFind's organization, and a change of the lock expiry or the time limit (shown, never
    changed: lowering either can start a second run of a long job).
  - **F217** A job's zone is the machine's time zone (jobs.rs `job_time_zone`), not the instance's default time zone
    or the viewer's: Jobs, JobDetail and the run screens name it and show times in it.
- Decisions: nothing of a job or a topic is changed without its owner's registration; the registrations are seed
  records of the layer that reads them (framework), one per job and per topic; a job's service, run-as identity, topic,
  limits and dates are never parameters of the service; a text parameter is plain words; a run outside the schedule is
  the scheduler's own run, asked for by marking the job due, with a reason and an audit row; no lock is cleared or
  deleted; a run's values are shown only where they are numbers, yes or no, or registered; a run with failed items is
  its own state; the recovery kind is the job (`ServiceJob`), a run being evidence; topic defaults are the configuration
  administrator's and subscriptions the operations operator's; a subscription is set only within the registered
  audience and `allNotifications` never; Topics and TopicDetail are in the Operations area; the alert template carries no
  contact point and Jobs links Alerts only by Dashboards' own grant.
- For the lead:
  - no Rust changed, so the shared release binary needs no rebuild for this phase; a database made before needs the
    tables of `JobRegistration`, `JobParameterDefinition` and `TopicRegistration`, `RecoveryDescriptor`'s new column and
    the seed data loaded again (the grant row, the framework's registrations, BossSetupData's group and entry);
  - master moved while this was built (the P12 follow-up, with Rust in moqui-mail): on the branch as first cut,
    AdminMailOutcomes' second feature failed on the shared binary against the branch's older XML; both branches were
    then rebased on master, where it passes;
  - budget shares (release binary): framework about 0.1 s (AdminJobs); mr-boss about 1.2 s (AdminJobRuns); no budget
    raised;
  - merge: mr-moqui `ServerEntities.xml` (three entities appended at its end, one field and one sentence in
    `RecoveryDescriptor`), `AdminConfigurationData.xml` (appended, and one comment line of P13's), `OperationServices.xml`
    (appended, two lines of its header comment and two of `preview#Recovery`'s description), `OperationRecovery.js`
    (`kindModules` and one comment line), Attack-Surface, Remaining-Work (the `org.moqui.admin` row only), the rest new
    files; mr-boss `BossSetupData.xml` appended at its end (Insights appends there too), `Admin.js` (`areas`' comment,
    `linkPaths` after P13's), `Operations.xml`, `AdminAccess.spec.js` and `AdminRegistries.spec.js` (one expectation
    each), `design-admin.md`, the rest new files;
  - the user's call: F206 (a run asked of the scheduler, not started at once, against a claim on explicit runs in the
    framework's Rust); F208 (whether an operator may read every organization's job runs, masked, for now as the mail
    queue and the messages); F209 (who may be a recipient of the framework's jobs: built `ADMIN_OPERATION_MANAGE`
    holders, since the notification is unmasked); F210 (whether the resolution should get an audience rule for
    `allNotifications`, and mr-marble's notification screen); F212 (which owners register their jobs and topics
    next: Mantle's and the apps' jobs are read only until then); F215 (whether the reader should be shown tabs that
    answer "not available"); whether the configuration administrator should also read a topic's subscribers by name
    (built: no, counts only);
  - `test/acceptance/Admin/AdminJobsUsable` was written and not run, as the brief asks: its second feature starts a failing job
    by hand as an instance administrator and its third evaluates the copied alert over `otel_spans`, which no regression
    spec here proves, so run it when asked and expect to adjust it.

**Review Nov 10 (P14).**
- Checked (the code paths of `git diff master...adm/p14` in both repositories, with the scheduler's Rust, jobs.rs
  `readiness`, `dispatch` and `LockPlan`, and the notification resolution, notify/message.rs `resolve_users`):
  - `store#Job`: nothing without a `JobRegistration`; the service has no parameter for the service name, the run-as
    identity, the topic, the limits, the lock expiry or the dates, and writes the job's row only through the fields it
    built (`cronExpression`, `paused`, `priority`, `minRetryTime`). A parameter is taken by its own name among the
    registered definitions (`parameterMap` posted whole is read by its own keys, one unregistered name refuses the whole
    change before anything is written; a name differing in case and an inherited name such as `constructor` find no
    definition; an empty value clears only a registered parameter that is not required); a definition named like a secret
    or not declared by the job's service is left out. The cron expression is of its own characters, parsed by the
    scheduler's parser, and its next thirty occurrences are no closer than the registration's minimum (at least a
    minute, so a schedule of every second is refused; a cron expression is a product of field sets, so a close pair
    shows within the first few occurrences). Pause, priority (0 to 999) and the wait (1 to 1440); `paused` is
    audit-logged by the entity, the rest by audit rows; the two message jobs' `retryMinutes` (1 to 1440) and
    `retryLimit` (1 to 100) are declared by their services.
  - Run now (F206) is safe against the scheduler as built. The scheduler claims by one conditional update (`jobRunId`
    null, or the expired holder's id) that also sets `lastRunTime`; the request holds the lock row `for update`, refuses
    a lock that holds any run (an expired one too: the scheduler takes that over itself), and writes only
    `lastRunTime`. A claim that came first leaves the request reading a held lock (not taken); one that comes after
    waits on the row, then claims and overwrites the time, which is one run. Only a job that is scheduled or failing and
    not due is marked, so no regular run is missed (the job was not due; after the run its time is now) and a paused,
    unscheduled, ended or already due job is refused. It runs once: a success sets the time to now; a failure restores
    the marked time, so the job is retried after its wait as every failing job is, to its `repeatCount`. Nothing clears
    or deletes a lock. No framework Rust is needed for this; a claim on `ec.service.job(name).run()` (Tools' Run Job)
    stays the framework ask.
  - Job runs: `find#JobRuns`, `get#JobRun` and `get#JobRunItems` answer, to any holder of `ADMIN_OPERATION_VIEW` and for
    every organization's jobs (F208): the job, times, host, instance and thread, the trace id, the class of an error
    and its masked lines (one in the list, five in the detail; addresses, URL paths, credentials and long tokens struck
    out), the numbers and yes-or-noes among the results by name, the count of an array result, the names of the other
    results and of every parameter, a parameter's value where it is a short number, a yes or no, or registered, and the
    count of message lines. Never the messages, a result's text or another value. An error line is what the job's
    service wrote, so it can name a customer, an order or an amount, as a system message's can (F188). Items come only
    from the `itemsService` of the job's registered descriptor, called under the reader's own identity (the service
    checks its permission itself: the framework's checks `ADMIN_OPERATION_VIEW`), each answer cut and masked. A run
    without an error whose results or items count failures is `itemsFailed` in the list and the detail.
  - Recovery: `ServiceJob` only by a registered descriptor, eligibility read again at execute, `ADMIN_OPERATION_MANAGE`
    and the descriptor's own permission both required, the operation key answering a repeat, the claim as above.
  - Topics: `store#TopicDefaults` writes only the registered fields of a registered topic (never `isPrivate`, a
    template, an approval service or the inbox); `store#TopicSubscription` only for an open account that holds the
    registered audience, and has no parameter that sets `allNotifications`. By the resolution, a subscription row adds
    nobody to a message: it only decides whether a user a message was already sent to receives it, so subscribing a user
    gives them nothing they were not sent; only `allNotifications` adds a reader, and it is never set here. An email goes
    to the account's own address. The configuration administrator reads counts only; an operator reads the subscribers
    within the audience by name, username and whether the account is open, not scoped by organization (F214).
  - F210's reasoning holds: `WebServletError` and `ServiceJobError` are private with `receiveNotifications` N, the
    first is sent to nobody by name, so `allNotifications` is the only way either reaches an administrator, and a rule in
    the resolution refusing it on a private topic would silence both. What stays exposed, outside this phase: Tools'
    UserAccountDetail sets it for any user (ADMIN only), and mr-marble's MyAccount/User/Notifications `topicSubscriptions`
    passes the whole request to `store#NotificationTopicUser` with the caller's own id, so any user who opens that screen
    can post `allNotifications` Y for any topic, a private one too, and then receives every job error notification with
    its unmasked errors, parameters and results.
  - `report/admin-job-runs.json`: as the framework's own shipped alert rules (`system-disk-space-low.json`): read only,
    no owner, so never evaluated, no contact point. It reads `otel_spans`, a technical dataset, so a copy is **not**
    paused `not-validated` (that is the engine's rule for a rule over business data): the copy is active at once,
    evaluated as its owner, and tells nobody until its owner adds a contact point. Copying needs Dashboards' own grant,
    which the operations operator does not hold (the acceptance test expects the refusal), and whoever holds it reads
    `otel_spans` in Dashboards already: the template gives no telemetry.
  - BOSS grants: `BOSS_ADM_OPERATIONS_TOPICS` is the area's screen not inherited and the two topic screens; the six
    screens' own actions call only the framework's services (each refuses without its permission) and
    `get#AppAccess`, so the reader is shown "not available" and nothing else; every transition reaches a service with
    its own check and passes named parameters only (no `parameterMap` from a request); the trace link is rendered only
    when `get#AppAccess` says System opens. Spec leanness: each of the six screens rendered once in qvt; the transitions
    posted in html and Jobs once more in html for the reader (it has a `render-mode` section).
- Fixes (mr-moqui 1825a4aa):
  - **R1 (medium, secrets).** A value that reads as a number was shown whatever its name: a job's deployed parameter
    named like a secret (`get#Job`), and a run's result named like one (`find#JobRuns`, `get#JobRun`; a run's parameter
    was already held by its name). And a stored text of up to fifteen digits counted as a number, which an account, card
    or phone number is. Now nothing named like a secret is shown as a value or a count, a stored text is a number only up
    to nine digits, and the secret names take a pass code, a pass phrase and a PIN too.
  - **R2 (medium, a rule on one path).** `apply#JobRecovery` (in no group's grant, but run by whatever calls it under an
    inherited grant or with authorization off) marked any scheduled job due, registered or not. The step now reads the
    job's registered native run itself and takes nothing without one; it locks the job's row with the lock row, so a
    pause or a schedule change is not made between its read and its mark.
  - **R3 (low, revision).** `store#Job` read the revision and then locked the job's row, so two changes at one revision
    could both be written. The row is locked before the job is read.
  - **R4 (low).** JobConfiguration posts the wait after an error back as the framework's default when the job has none
    set, which `store#Job` took as a change (an audit row from nothing to 5). The default is no change.
- Tests (the shared release binary, this phase's runtime): framework AdminJobs 4 of 4 (0.1 s; added: the secret-named
  and the long numbers, the step on an unregistered job, the default wait; three of the four features fail on the
  worker's module), AdminRecovery, AdminMailOutcomes 6 of 6; mr-boss AdminJobRuns, AdminAccess, AdminRegistries,
  ProjectsAccess 23 of 23. Prettier clean. Not run: the suites, the acceptance test, cargo (no Rust changed),
  `lint --screens` (no screen changed).
- For the lead:
  - no Rust and no entity changed by the review; no rebuild;
  - the lead's brief said the copied template is paused `not-validated`: it is not, being a technical rule (above). If
    it should be, that is the report engine's rule to widen (a copy of any shipped rule paused), not this phase's;
  - F209 for the user's call, as it stands: a recipient must hold `ADMIN_OPERATION_MANAGE` when added, and that
    permission does not itself make a run's unmasked parameters and results readable anywhere else (JobRunDetail masks
    them for its holders too); a recipient who later loses the permission stays one until removed (JobDetail marks them
    "no longer holds", the scheduler does not check), and the job error notification's link opens Tools' JobRunDetail,
    which an operator cannot open;
  - `store#TopicSubscription` cannot end `allNotifications` or remove a setting for a user outside the audience or a
    closed account (the eligibility check comes first, and names outside the audience are never shown): those are
    counted on TopicDetail for an instance administrator. Ending it there by username would tell whether a name has a
    setting; left as built, the user's call;
  - mr-marble's `topicSubscriptions` transition (above) is the open exposure of F210 and wants its own fix in
    mr-marble (take only `receiveNotifications` and `emailNotifications`, and only for a topic that is not private);
  - provisional findings: **F218** a number-shaped secret was shown (R1); **F219** the recovery step marked an
    unregistered job due when called apart from `execute#Recovery` (R2).

### P15 — Imports

Design §11.1, Imports, DataImport and ImportDetail, Invitations' bulk invite; ADM-IMPORT.

- **Framework `org.moqui.admin.DataTransferServices`**: `find#ImportTargets`, `stage#Import`, `configure#Import`,
  `validate#Import`, `apply#Import`, `get#Transfer`, `find#Transfers` and `retry#ImportItems`, dispatching by a target
  registration (a framework seed record, §4) and never by a service name from the request; `TransferBatch` and
  `TransferItem` for a target with no owner batch.
- **Shared/DataImport** (F12): Shared/ProductImport made general, its context, labels and steps from the target
  registration; Products/ProductImport becomes its Products mount (target `catalog`, Products' kinds unchanged), and
  its spec and walk pass through the new screen.
- **The targets:** Products' catalog (mount); Admin's staff invitations (one `invite#User` per accepted row, its fields
  exactly design §4's); and the owner wizards, each registering its result contract: Commerce's ChannelImport
  (impl-commerce §7), Accounting's StatementImport and opening open items, and Commons' contact import and Projects'
  work-item import, listed as targets with a link and no runs until they keep a run record (F13, §7).
- **Screens:** Imports (ImportFind, ImportList of every target's runs, ImportTarget); DataImport (ImportUpload,
  ImportMapping, ImportPreview, ImportApply) at Admin/Data/DataImport; ImportDetail (ImportSummary, ImportResults with
  error export and retry of failed rows).
- **Specs:** framework `AdminDataTransfer` (dispatch only by registration; a stale preview refused; an identical retry
  answers the first result and changed content under its key is refused; only failed rows retried); BOSS `AdminImports`
  (the catalog target through Shared/DataImport as through ProductImport; a bulk invite with a password column
  refused).
- **Usable when** (design §15.3 "Import preview/retry"): a CSV of five staff invitations, one a duplicate and one with
  an unknown bundle, sends three invitations and names the two; a catalog price import through Admin gives the result
  Products' mount gives; Accounting's statement imports appear in Imports with links to their owner.

**Built Nov 10 (P15).**
- Checked first (the code over the plan): P0's check is F43's (Projects' work-item import keeps per-user drafts and no run
  record, as Commons'); `ADMIN_TRANSFER_VIEW` and `ADMIN_TRANSFER_RUN` are seeded and held by `BOSS_ADMIN_DATA` and the
  administrator, and there was no Data area; `Shared/ProductImport` was referenced only by Products' mount, its spec, its
  walk, AppStructure and one grant pattern (mr-pass names it nowhere); `ProductImportServices`' five steps carry one
  parameter list, which is taken as the import contract; `invite#User` adds nothing of BOSS's (InviteStaff adds
  `BOSS_USERS` in its transition); Mantle's identity scope is the caller's organization filters, so it follows the grant a
  call runs under (F221); ChannelImport's batch is a SystemMessage with no stager and no counts before its commit, and
  the opening open items keep one result on the setup run (F225, F226); the framework had no delimited-text reader
  outside Mantle's catalog one.
- mr-moqui (no Rust changed: everything ran on the shared release binary; no Debug build was made):
  - `entity/ServerEntities.xml` (appended): `moqui.server.TransferTarget` (a registered target: direction, title,
    description, what applying it does, owner, version, mode, and by mode the five step services with an optional report,
    sample and kinds service, or the fields, key fields, batch options, refused columns, row services, scope service, bounds
    and retention; the find service of its runs, the import and view permissions asked besides, fixed values, the key of the
    owner's place), `TransferBatch` and `TransferItem` (an import of a target with no owner batch: the key, target, scope,
    user, state, file name and content hash, the mapping request, the validation's fingerprint; per row the source, the
    preview, the result, the reason, the owner's reference, the row's operation key and the attempts).
  - `service/org/moqui/admin/DataTransferServices.xml` (new, a module per part as the operation services).
    `DataTransferLib.js`: the registrations as they are used (checked when read, a malformed one logged and left out), the
    contracts of each step (the parameters a registered service must carry and the only ones it is given),
    `call#TargetService` (the service read from the registration by the step's name, called as the caller), the bounded
    delimited reader and the writer that writes a formula cell as text. `DataTransferImports.js`: `find#ImportTargets`
    (`ADMIN_TRANSFER_VIEW`), `get#ImportTarget` (one target as its wizard needs it, for any signed-in user: no service
    name), `stage#Import`, `configure#Import`, `validate#Import`, `apply#Import` and `get#Transfer` (the dispatch: an
    owner's step for a steps target, the batch for a rows target, an error for a wizard), `get#ImportReport`,
    `get#ImportSample`, `retry#ImportItems` (for an owner's batch: the rows chosen must read failed there, then the owner
    validates and applies only those) and `find#Transfers` (every target's runs the caller may view, an owner's read as
    data, an owner that does not answer named). `DataTransferBatch.js`: the batch of a rows target (stage with the file's
    checks and the refused columns; configure at the mapping revision; validate through the owner's row validator, apart;
    apply and retry, each row locked, validated again and applied apart under its own key; the report; the runs; the
    retention). The interfaces `define#ImportStep`, `validate#TargetRow`, `apply#TargetRow`, `find#TargetScopes` and
    `find#TargetRuns`; the internal `apply#TransferItem`, `fail#TransferItem` and `clean#TransferBatches`.
  - `ConfigurationServices.xml` and `ConfigurationLocalization.js` (appended): `validate#MessageTranslationRow` and
    `apply#MessageTranslationRow`, the row services of the framework's own target (a translation by
    `store#LocalizedMessage`'s rules at the revision its preview read; an import removes none).
  - Data: `AdminConfigurationData.xml` (appended: `AdminTransferServices`, an inheritable `ALL_USERS` ALLOW naming the
    eleven services; `AdminTransferCall`, the not inheritable ALLOW of `call#TargetService`; the two row services added to
    `AdminConfigurationServices`; the target `messageTranslations`; the job `clean_TransferBatches_daily`).
  - Docs: Attack-Surface (the business imports paragraph), Remaining-Work's `org.moqui.admin` row. No Parity-Diffs entry:
    no existing behavior changed.
- Mantle:
  - `service/mantle/party/Invitations.js` and `IdentityServices.xml`: `invite#User`'s checks are now one function
    (`invitationProposal`, no behavior changed), which `validate#InvitationImportRow` runs for a row without writing;
    `apply#InvitationImportRow` is `invite#User` itself with the row's operation key and the batch's options;
    `find#InvitationImportScopes` answers the organizations the caller administers. A row's organization is the batch's
    only; a name is plain text; the bundles are ids, with those the registration always includes first.
  - Owners' runs: `ProductImportServices.find#CatalogImportRuns` (CatalogImport.js: a user's own imports, every one for a
    system administrator), `ReconciliationServices.find#StatementImportRuns` (BankReconciliation.js: the organizations of
    the caller's accounting scope, for who may read a bank), `SetupServices.find#OpenItemImportRuns`
    (AccountingActivation.js: the latest import of each organization, finance administration) and
    `StoreChannelServices.find#ChannelImportRuns` (StoreChannels.js: the batches of the stores the caller operates).
  - Data: the targets `staffInvitations` (PartyInvitationData.xml; rows; `ADMIN_TRANSFER_RUN` with
    `ADMIN_IDENTITY_MANAGE`), `catalog` (ProductImportData.xml; steps; no permission of its own), `statementImports` and
    `openingOpenItems` (AccountingSetupData.xml; wizard) and `channelOrders` (StoreChannelSetupData.xml; wizard).
- BOSS:
  - `screen/Shared/DataImport.xml` replaces `Shared/ProductImport.xml` (moved, F12): its mount, target, words, kinds,
    organizations, bounds and options from `ironstone.shared.DataImportServices` (`get#ImportMount`, `get#ImportContext`,
    `map#Import`, `find#ImportRuns`; `shared/DataImport.js`) over the framework's services, nothing called with
    authorization off. `Products/ProductImport.xml` mounts it as before (same route and transitions).
    `ironstone.products.ImportServices` keeps only the result notice.
  - The Data area: `Admin/Data.xml` with `Data/Imports.xml` (ImportFind, ImportList, ImportTargets), the mount
    `Data/DataImport` and `Data/ImportDetail.xml` (ImportSummary, ImportResults with the two files and Retry failed rows).
    Invitations gains Invite from a file. `Admin.js`: the `data` area and three link paths.
  - `data/BossSetupData.xml` (appended): `BOSS_ADM_DATA` (the area denied to the root group, opened to the data operator
    and the administrator), `staffInvitations`' fixed value (`BOSS_USERS` in every row), the wizard targets
    `commonsContacts` and `projectsWorkItems` (a place, no runs); the catalog screens' grant pattern names DataImport in
    place of ProductImport. BossUsersDemoData unchanged. No new write verb, so the client deny pattern is unchanged.
- Specs: framework `test/AdminDataTransfer` (3 features, 0.15 s: an unknown target, a registration without its contract
  and a wizard never dispatched, a step named and never a service, names a request carries never read, an unregistered and
  an inherited field name refused, a password and a token column refused whole with nothing kept, a file that is not text,
  the import permission and the transfer permission each alone, a reader of the target, another importer and a stranger;
  the same file and the same key answer the same import, other content under the key refused, a stale mapping, a preview
  that writes nothing, a stale preview, the apply and its repeat with one audit row, a formula cell written as text; a
  repeated key, a placeholder lost, a link and a bad locale named, a source changed after the preview not written, the
  retry of that row only, an applied, an invalid and an unknown row named, the retry's key). Mantle
  `test/party/StaffInvitationImport` (2 features, 0.4 s: the password, group and permission columns, another
  organization's scope, an option out of bounds, the identity operator without the transfer permission; ten rows with a
  repeat, a sealed-granting bundle, ADMIN, an unregistered bundle, another organization, another organization's staff, an
  expression as a name; the two invitations as the importer with the batch's options; a row whose result was lost
  answered and not invited again; another organization's importer and the organization's identity operator reading
  nothing), and one assertion each in StoreChannels, AccountingSetup and AccountingBankReconciliation for the owners'
  runs. BOSS `test/Admin/AdminImports` (3 features, 1.7 s: the catalog through Admin's mount and Products', the Products
  mount the catalog whatever is asked, the data operator and a catalog editor outside Admin importing nothing; the bulk
  invite through the wizard's transitions, its refusals, `BOSS_USERS` always, a privileged group and ADMIN never; Imports'
  and ImportDetail's one qvt render; an owner's run with its place and no row, not shown to who may not read it).
  `AdminAccess` changed: the `data` capability and the two menus. `ProductsImport` changed in four lines (the mapping and
  context services are the shared ones, F230). Acceptance, written and not run: `test/acceptance/Admin/AdminImportsUsable`
  (3 features, the "usable when"); `ProductsImportWalk` (three form ids) and `AppStructure` (the screen's name) edited,
  not run.
- Tests run (the shared release binary, this phase's runtime): framework AdminDataTransfer, AdminConfiguration 7 of 7;
  mr-mantle StaffInvitationImport, StaffInvitation, ProductCatalogImport, StoreChannels, AccountingSetup,
  AccountingBankReconciliation 42 of 42; mr-boss AdminImports, AdminAccess, ProjectsAccess, AdminInvitations,
  ProductsImport, ProductsAccess, CommerceChannels, AdminRegistries 41 of 41. `moqui lint --screens` 132 flagged sites, as
  master, no parse failure (the release binary). By hand, not kept: DataImport under Admin in qvt, tui and html for a
  staged and validated staff-invitation batch (its options), with no batch, for the catalog, for an owner wizard's target
  and with no target; Imports and ImportDetail in the three modes; Invitations' link shown to the administrator and not to
  the identity operator. Prettier clean on the new JavaScript and on the changed files that were clean. Not run:
  `./moq test-framework`, `./moq test-apps`, the acceptance suite, cargo (no Rust changed); no browser.
- Inventories: usl-inventory's `ProductImportServices` and `CatalogRecordServices` rows name Shared/DataImport with its
  two mounts; none of ss-inventory's rows is P15's.
- Design edits: design-admin §4 Invitations (the bulk invite as built), §11.1, Imports, DataImport and ImportDetail (as
  built), §14 (Import/export target) and §17.2; the owners' designs, one sentence each: design-products (the wizard is
  Shared/DataImport), design-crosscut (its row), design-commerce (ChannelImport registered), design-accounting (the two
  registered), design-drawers-commons and design-projects (registered with no runs).
- Findings (provisional, numbered by the lead):
  - **F220** A target with no owner batch has no five steps to register: it registers a validate and an apply service
    for one row (`validate#TargetRow`, `apply#TargetRow`), and the framework's batch answers the five steps' contract for
    it, so one wizard serves both. The design's contract said only the five steps; §11.1 and §14 edited.
  - **F221** The framework knows no organization. A batch's scope is the target's word: its scope service says which
    scopes a caller has (Mantle's identity scope for invitations, which follows the organization filters of the grant
    the call runs under: the Data area's, or the identity services' own `MANTLE_USER_ORG`). A rows target with no scope
    service (message translations) is read by every holder of its view permissions.
  - **F222** The catalog registers no permission of Admin's, so a Products user imports through Products' mount with
    the catalog's permissions alone, as before. Admin's mount asks `ADMIN_TRANSFER_RUN` itself (the wizard's transitions
    and `map#Import`); the framework's services, called directly, ask only what the registration and the owner ask.
  - **F223** `BOSS_ADMIN_DATA` holds the two transfer permissions and no target's domain permission, so the demo
    data operator alone starts no import: staff invitations also need `ADMIN_IDENTITY_MANAGE`, the catalog its own
    permissions. P1's note read "each data target's domain permission on BOSS_ADMIN_DATA, P15"; not done: it would make
    the data operator an identity operator and a catalog editor of its organizations.
  - **F224** `staffInvitations` asks `ADMIN_TRANSFER_RUN` besides `ADMIN_IDENTITY_MANAGE`, so the identity operator
    alone invites one at a time; Invite from a file shows to a user who holds both and opens the Data area.
  - **F225** The opening open items keep the latest import's result on the setup run, not a history: an organization
    is listed with at most one run.
  - **F226** A channel import batch records no stager and no counts before its commit: it is listed with its
    committer and the count the commit kept.
  - **F227** A catalog import is its importer's (Mantle: "Open your own catalog import", but for a system
    administrator), so Imports shows a data operator only their own catalog imports.
  - **F228** The catalog import's result notice (the SECA on `apply#CatalogImport`) checks the Products launcher and
    links Products' mount: an import through Admin by a user without Products sends no notice.
  - **F229** Shared/DataImport is rendered by ProductsImport's spec (three modes, twice, from before this phase), so
    AdminImports renders it in no mode and reads the wizard's context through its service; the Admin mount and the options
    section were rendered by hand.
  - **F230** ProductsImport's spec called `ironstone.products.ImportServices.map#CatalogImport` and
    `get#ImportContext`, which are now the shared screen's services (`ironstone.shared.DataImportServices.map#Import` and
    `get#ImportContext`, with `appRoot`): the spec names them in four lines, its assertions unchanged. The walk's three form
    ids are ImportUpload, ImportPreview and ImportApply.
  - **F231** Not built of the design's forms: spreadsheet files and sheet or header selection (delimited text
    only), a registered import mode and source namespace beyond the catalog's own update mode, a confirmation reason at
    apply, cancelling an apply under way, ImportTarget as a dialog (it is a list below the runs) and a corrected row as a
    linked revision.
  - **F232** The framework registers a target of its own, message translations, which the plan did not name: it is
    the rows contract's framework example (its spec's target, with no Mantle) and a use of its own for the configuration
    administrator who also holds the transfer permission. Its place is Settings › Localization.
  - **F233** Outside an app screen an owner's service needs the caller's own artifact authorization (that is the
    point of `call#TargetService`), so a direct call of `find#Transfers` by a user with no grant for an owner's find
    service names that owner as not answered rather than listing none.
  - **F234** When the instance cannot send mail a bulk invitation's row reads "resend it from Invitations": the link
    shown once is the single invitation's, and nothing reveals many.
  - **F235** `clean_TransferBatches_daily` has no `JobRegistration`, so it is read only in Admin's Jobs; a target's
    retention is its registration's.
  - **F236** A spec assertion that begins with a regular expression literal reads to Prettier as a division of the
    line above and can fail its parse, though the runner takes it: the new specs use a `has(value, pattern)` helper.
- Decisions: three modes of a registration (steps, rows, wizard) in one framework record; the import contract is
  Products' parameter list, unchanged; an owner's service is called by the step's name through a call whose grant is not
  inheritable; Admin's own targets ask the transfer permission and the owner's, the catalog none of Admin's; a batch kept
  by the framework is read by who staged it and by a holder of the target's view permission its scope service admits,
  and changed and applied only by who staged it; a file with a column named like a secret is refused whole; an import of
  invitations is for one organization; `BOSS_USERS` in every invited row is a value the registration fixes, set by BOSS on
  Mantle's target; retention 30 days by default (a batch never applied removed, an applied one keeps its outcomes);
  owner wizards without a run record are BOSS's seed rows, the others their Mantle owners'; the data operator's group is
  given no domain permission; ImportDetail is Admin's alone and Products' mount keeps its own rows and files; times in
  Imports are the server's zone.
- For the lead:
  - no Rust changed, so the shared release binary needs no rebuild; a database made before needs the three new tables
    and the seed data loaded again (the two grants, the targets of the framework, Mantle and BOSS, the area's group, the
    cleanup job);
  - budget shares (release binary): framework about 0.15 s (AdminDataTransfer); mr-mantle about 0.4 s
    (StaffInvitationImport) and under 0.1 s in three touched features; mr-boss about 1.7 s (AdminImports); no budget raised;
  - merge: mr-moqui `ServerEntities.xml` (three entities appended at its end), `AdminConfigurationData.xml` (appended),
    `ConfigurationServices.xml` (appended), `ConfigurationLocalization.js` (two functions and the operations list),
    Attack-Surface, Remaining-Work (the `org.moqui.admin` row only), the rest new files; mr-mantle `Invitations.js`
    (`inviteUser` split in two, three functions appended), `IdentityServices.xml`, `ProductImportServices.xml`,
    `ReconciliationServices.xml`, `SetupServices.xml` and `StoreChannelServices.xml` (one service appended each, three for
    identity), `CatalogImport.js`, `BankReconciliation.js`, `AccountingActivation.js` and `StoreChannels.js` (one function
    and the operations list each), four data files appended, three specs with one assertion block each; mr-boss
    `BossSetupData.xml` appended at its end (Insights appends there too) and one grant pattern changed
    (`...|CatalogChecks|DataImport`), `Admin.js` (`areas`, `linkPaths` after P14's), `Shared/ProductImport.xml` moved to
    `Shared/DataImport.xml`, `products/Imports.js` and `ImportServices.xml` cut to the notice, `Users/Invitations.xml` (one
    link), `AdminAccess.spec.js`, `ProductsImport.spec.js`, the six designs, `usl-inventory.md`, the rest new files;
  - other plans: none edited (impl-commerce §7's "registration later" for ChannelImport is done here; its owner's
    design says so);
  - P16 adds exports to the same family: `DataTransferLib.js` is shared, `TransferTarget.direction` is `import` today and
    `targetsOf("export")` reads the others; `find#Transfers` lists imports only until then;
  - the user's call: F223 (whether `BOSS_ADMIN_DATA` should carry any target's domain permission; built: none);
    F224 (whether the identity operator alone may invite from a file; built: the transfer permission too); F232
    (whether the framework keeps its message translations target); F231 (spreadsheet files, and a reason at apply);
    F227 (whether a catalog import should be readable by its organization's other catalog administrators, so Imports
    shows more than one's own); F225 and F226 (a history of opening imports and a stager on a channel batch, their
    owners' later work, §7);
  - the acceptance AdminImportsUsable, ProductsImportWalk and AppStructure to run when asked.

**Review Nov 11 (P15).** A fresh review of the three repositories' P15 diffs, the write path first (the three framework
modules, Mantle's invitation rows and BOSS's mount read line by line; the authorization rule read in
`moqui-core/src/user/authz.rs`); fixes committed apart per repository ("Admin P15 review: …"). No Rust changed.
- Checked and found sound:
  - Dispatch. The service called is `target[contracts[step].field]` of the registration read by `targetId`; the step is
    an own name of the contracts (`constructor` refused), the parameters the step's allowed names that the service
    declares, `fixedValues` set from the registration after them; an unknown, disabled or malformed target and a step the
    mode does not have fail closed; a wizard target is never dispatched; `map#Import` takes only the file's headers, the
    target's fields and a well-formed option name, and `configure` refuses any other by own name.
  - How an owner's service is authorized (the Built note and the comments said "as a direct call is"; that is half of
    it). `call#TargetService`'s own ALLOW is not inheritable, so outside a screen the dispatching service's grant does
    not carry and the caller needs the owner's own artifact grant (Mantle's identity services have one, the catalog's
    have none: F233 is this). Below an app screen the area's inheritable ALWAYS (`BOSS_ADM_DATA`, as every BOSS
    area's) is taken before any record of the artifact's own (`is_permitted`), so it covers `call#TargetService` and the
    owner's service after it: there the only wall is the owner's service checking the caller itself. Tried through the
    Admin mount's `stage` transition (a scratch spec, not kept): the data operator alone is refused by the catalog
    ("Catalog read authority"), the invitations (`ADMIN_IDENTITY_MANAGE`) and the translations
    (`ADMIN_SETTINGS_MANAGE`); a data operator who is also the identity operator by the catalog, the translations and
    another organization's scope; one who is also a catalog editor by the invitations; the identity operator, a reader
    and a catalog editor without the area get no mount; nothing was staged by any of them. Every registered service
    checks the caller (the nine catalog steps by kind and owner, the three invitation services, the two translation
    services, the four find-runs by their owners' policy). The comments and Attack-Surface now say so.
  - Staff invitations. `invitationProposal` is `invite#User`'s checks moved unchanged (the same order, refusals and
    errors; `requirePermission` first in both); a row is the batch's organization only, the registration's bundles and
    the row's go through `check#GrantProposal` and `invitationRefusal` as the importer; ADMIN, a privileged group, a
    sealed-granting and an unregistered bundle are named and not invited; an existing identity outside the importer's
    scope needs `ADMIN_IDENTITY_GLOBAL`; each row in its own transaction under a key of the batch, the row and its
    values, which `invite#User` answers on a resumed apply (one invitation); with no mail server a row reads "resend it
    from Invitations" and no link is shown or kept.
  - The mounts. `appRoot` is the root screen's (a request's `appRoot=Admin` under Products staged a catalog import, and
    `appRoot=Products` under Admin stayed Admin's); the Products mount's target is `catalog` in every transition; the
    Admin mount asks `ADMIN_TRANSFER_RUN` in each writing transition and the view or run permission to open. The
    widened pattern (`…|CatalogChecks|DataImport`) is a member of `BOSS_PROJECTS_INTERNAL`, a DENY for client contacts:
    it grants nothing, and now denies them the screen under Admin too. Nothing else names the old location.
  - `messageTranslations` (F232): its apply is `storeLocalizedMessage` itself (`ADMIN_SETTINGS_MANAGE`, P8 R1's
    placeholder and expression rules, R2's link rule, the revision, the audit row), its validation the same checks
    without the write, and an import removes none. Kept.
  - Owners' runs: the four find services answer by their owners' capabilities and organization policy and return
    nothing on a refusal; `ownerRun` cuts every text to a line, takes six short parameters by name, and the link is one
    of BOSS's fixed routes; no row content.
  - Files: bounded before reading (bytes, rows, 50 columns, 2000 characters a cell), UTF-8 by content, a file's name
    without `${`; the result file writes `= + - @`, a tab and a carriage return as text; labels expand a stored value
    once. Retention: the job runs with authorization off as every job; only batches past their days.
  - Concurrency: an apply claims each row with a row lock and reads its result under it, so two applies of one batch
    apply a row once; the batch's fingerprint is compared with the stored one in each row's transaction.
  - Specs: AdminImports renders Imports and ImportDetail once each (qvt) and Shared/DataImport never (its transitions
    answer a redirect or a file); 3 features in 1.7 s.
- Fixes:
  - **R1 (medium).** `retry#ImportItems` applied a failed row without the stale-source check, so the row an apply had
    refused because its source changed after the preview (`STALE_SOURCE`, "validate and review it again") was written
    over the other change by a retry, unreviewed. A retry now writes only if the source is as the row's preview read
    it; a stale row is validated and reviewed again.
  - **R2 (medium).** A batch was read by who staged it for as long as it was kept, whatever they held: a former
    identity operator, or one moved out of the organization, still read the names and addresses and what was invited.
    Read now needs the target's import or view permission and its scope for who staged it too (`get#Transfer`,
    `get#ImportReport`, the runs list).
  - **R3 (medium).** A validation after a partial apply did not count the applied rows' keys, so a row repeating an
    applied row (refused as a repeat in the first preview) became valid and would be applied over it.
  - **R4 (low).** A row with nothing left to do at its apply (already so: another's change, or the row's own apply
    whose result was not kept, for a target that answers `skip`) was marked failed; it is skipped.
  - **R5 (low).** `clean#TransferBatches` left a batch in `applying` for ever, so an apply that stopped kept its
    staged file past the retention. It is left alone only while it was written within a day.
  - **R6 (low).** `staffInvitations` refuses a user id column too (`userid` in `refusedColumns`).
  - Comments and Attack-Surface: the ALWAYS rule above, who reads a batch, the retry and the repeat rules.
- Tests (the shared release binary, this phase's runtime): framework AdminDataTransfer, AdminConfiguration 7 of 7
  (AdminDataTransfer 0.15 s; added: the stale retry, the repeat after a partial apply, the former importer's read);
  mr-mantle StaffInvitationImport, StaffInvitation, ProductCatalogImport (added: the user id column); mr-boss
  AdminImports, AdminAccess, AdminInvitations, ProductsImport, ProjectsAccess 28 of 28 (AdminImports reads the wizard's
  context as the instance administrator: with authorization off the importer has no organization scope, so R2 refuses
  the read there). Prettier clean. Not run: the suites, the acceptance test (AdminImportsUsable is unchanged and goes
  through the screens), cargo, `lint --screens` (a comment only).
- For the lead:
  - no Rust and no entity changed by the review; Mantle's seed row `staffInvitations` changed (`refusedColumns`): load
    the seed data again;
  - the refusal of a column is a list of names, not an allowlist: only mapped, registered fields reach an owner, but a
    staged file is kept whole (the columns no field was mapped from too) and shown on ImportDetail and in the result
    file to its readers until the retention. A secret or a personal column under a name the list does not know is kept
    30 days. The user's call: refuse a file with a column that maps to no field, or drop unmapped columns at the apply;
  - a repeat of the same apply request (the fingerprint the first one named) is answered `STALE_PREVIEW` with the
    import as it stands once the first has finished, since the finish rewrites the fingerprint: nothing is applied
    twice, but it is not "the first result" for a client that resends blindly. A repeat with the fingerprint read after
    is answered `repeated`;
  - a validation or a mapping change made while the same batch is being applied marks the rows not yet reached as
    failed ("The validation changed"): fails closed, and they are retried or validated again;
  - F229 stands and is older than this phase: ProductsImport renders Shared/DataImport twice in each of three
    modes (empty and with an import), against "once per mode";
  - provisional findings: **F237** a retry wrote over a source changed after the preview; **F238** a batch
    stayed readable by who staged it after they lost the permission or the organization; **F239** a repeat of an
    applied row became valid on a second validation.

### P16 — Exports and backups

Design §11 Exports, DataExport and Backups; ADM-EXPORT.

- **DataTransferServices** `find#ExportTargets`, `preview#Export`, `get#ExportFields` and `run#Export` over registered
  domain exporters: Commons' vCard (`ContactImportServices.export#Contacts`), Projects' work-item CSV and Accounting's
  ledger exports (P0 names them); dataset and report exports link to Insights. `find#Transfers` lists exports beside
  Insights' report occurrences (`ReportServices.find#ReportOccurrences`, Insights P7), status only.
- **Framework `org.moqui.admin.BackupServices`** `get#Coverage` (database, last success, paused or running, retained
  archives, the off-site mirror or none, what is not included: `.env`, the field-encryption key, resource files),
  `find#Archives` (metadata only) and `run#Backup` over `backup#EmbeddedDatabase`; an external database shows its
  provider's status or unknown, never success.
- **Screens:** Exports (ExportFind, ExportList); DataExport (ExportSelection, ExportFields, ExportReview); Backups
  (BackupCoverage with the fixed not-included warning, BackupArchives, BackupNow).
- **Specs:** framework `AdminBackups` (embedded success, skipped and failed differ; no path input); BOSS
  `AdminExports` (an export with a field the caller may not read leaves it out; a report occurrence's status without
  its content).
- **Usable when** (design §15.3 "Backup scope", "Export and recipient delivery", its Admin half): `admin.backup` runs a
  backup and sees it covered with no mirror and the warning; `admin.data` exports a contact book as vCard and sees an
  Insights schedule's delivery status but cannot open its report.

**Built Nov 11 (P16).**
- Checked first (the code over the plan):
  - P0's check is F43's and still holds: there is no work-item and no ledger export service. Commons' vCard export
    (`mantle.party.ContactImportServices.export#Contacts`) is the one business exporter with a service of its own to
    dispatch; Accounting's `mantle.other.TaxServices.export#Statement` writes on the statement it exports (who exported
    it and when, which keeps it) and its billing batch's CSV is a screen's transition over a BOSS context service, each on
    the record it is of. Those, Projects' list CSV and Insights' dataset and report exports are registered as places, not
    dispatched (F240).
  - P15 left `TransferTarget.direction` and `targetsOf("export")` for this phase; `find#Transfers` listed imports only.
    `call#TargetService`, the scopes contract, the option checks and the delimited writer are reused as they are.
  - The backup: `backup#EmbeddedDatabase` takes a `backupDir`, a mode, the counts and a remote's id as parameters, is
    `authenticate="false"`, reports `skipped` where the process runs no embedded cluster and adds an error for a cluster
    or a mirror that failed while the others' archives are in place. Its seeded job is paused, and its remote has no
    `sendUrl` (F9). Upstream's Tools reorganization shows only whether a backup job is scheduled (System › Home's
    database row, Tools › Database › Overview's sentence, System's attention list): no screen lists archives, coverage
    or the last outcome, so nothing is repeated and nothing was there to link but the job itself, which stays Tools'.
  - A job's run is recorded in `ServiceJobRun` (results as JSON: `archivePath`, `skipped`, `mirrored`), which is what
    coverage reads; P14's run outside the schedule does not start a paused job, so it could not be BackupNow (F242).
  - Insights P7's `find#ReportOccurrences` and P8's `find#AlertDeliveries`, each with `administrative: true`, answer
    ids, states and counters to a holder of `ADMIN_TRANSFER_VIEW`; the occurrence states are `RptOcc*`.
- mr-moqui (no Rust changed: everything ran on the shared release binary; no Debug build was made):
  - `entity/ServerEntities.xml`: `TransferTarget` gains `exportService` and `exportPermission` and its description the
    export modes; `TransferBatch`'s description says it is also the record of one export (state `exported`). No new
    entity.
  - `service/org/moqui/admin/DataTransferServices.xml`: the interface `run#TargetExport` (an export target's one
    service: the scope, the registered selection, the fields already cut to those the caller may read, `countOnly`,
    `maxRows`; `rowList` or `fileText`), `find#ExportTargets`, `get#ExportFields`, `preview#Export` and `run#Export`, and
    `find#Transfers` gains `direction` and `kind` (import stays the default, unchanged).
  - `DataTransferExports.js` (new): the catalog of export targets, what a caller may choose of one (scopes, options,
    fields with `allowed`), the request as the registration admits it (a scope the caller has; only registered options
    and field names, by own name; a wanted field the caller may not read named as left out), the owner's answer
    (refused whole past the rows or the bytes), the file (written here for a rows target from the given fields only; the
    owner's for a file target, its type one of six and its name made here), the record and the audit row, the operation
    key, the records a caller may read, and the report engine's two administrative reads as status rows.
  - `DataTransferLib.js`: a registration's direction and, for an export, its modes (file, rows, wizard), its fields
    (`columnsJson` with `permission`, `required`, `selected`; a field naming an unknown permission logged and left out)
    and the `export` step of `call#TargetService` (an import target has no export step and an export target no other).
    `DataTransferImports.js`: `find#Transfers` hands direction export to the export module. `DataTransferBatch.js`:
    `optionsOf` shared; the retention removes an export's record after its target's days (366 when none).
  - `service/org/moqui/admin/BackupServices.xml` and `Backups.js` (new): `get#Coverage`, `find#Archives`, `run#Backup`
    and the internal `start#BackupRun`. `OperationLib.js` exports the result entity's name.
  - `ConfigurationServices.xml` and `ConfigurationLocalization.js` (appended): `export#MessageTranslationRows`, the
    export service of the framework's own export target.
  - Data: `AdminConfigurationData.xml` (appended: the four export services added to `AdminTransferServices`; the export
    service to `AdminConfigurationServices`; the target `messageTranslationsExport`; `AdminBackupServices`, an
    inheritable `ALL_USERS` ALLOW naming the three backup services).
  - Docs: Attack-Surface (the business exports and the backups paragraphs), Run-Deploy "Backups" (one sentence),
    Remaining-Work's `org.moqui.admin` row. No Parity-Diffs entry: no existing behavior changed.
- Mantle (a worktree added for it, branch `adm/p16`):
  - `service/mantle/party/ContactImportServices.xml`: `export#Contacts` takes an optional `fieldList` (only the named
    groups of a card's fields are written beside the name; without it every field, as before);
    `find#ContactExportScopes` (the books the caller owns or is given a share of) and `export#ContactBookTransfer` (a
    book the caller may view, or its favorites, as vCard 4.0 with the field groups asked for; the count alone with
    `countOnly` or past `maxRows`), each checking the caller's own permission on the book.
  - Data: `data/PartyContactExportData.xml` (new, seed): the target `contactBookVCard` (file; nine field groups, the
    name required, birthdays and notes only when asked for; one option, every contact or the favorites; 5000 rows and
    2 MiB; `ADMIN_TRANSFER_RUN` to export and `ADMIN_TRANSFER_VIEW` to read others' records).
- BOSS:
  - `service/ironstone/admin/DataServices.xml` and `admin/Data.js` (new): `find#ExportRuns`, `get#ExportContext` and
    `run#AdminExport` over the framework's services, nothing called with authorization off: they add the owners' places
    as routes (a registration names a key) and the wizard's form values, and ask `ADMIN_TRANSFER_RUN` under Admin.
  - Screens `Admin/Data/Exports.xml` (ExportFind, ExportList, ExportTargets), `Data/DataExport.xml` (ExportSelection,
    ExportFields, ExportReview, with the owners' places below; `download`, a posted form whose response is the file)
    and `Data/Backups.xml` (BackupCoverage with the fixed warning above it and the not-included list, BackupArchives,
    BackupNow as a dialog with a reason). `Data.xml` mounts the three, and the area starts at Backups for the backup
    operator. `Admin.js`: three link paths.
  - `data/BossSetupData.xml` (appended): `BOSS_ADM_DATA_BACKUPS` (the area's screen, not inherited, and Backups, for the
    backup operator), and the five export targets exported in their owners' places (`insightsDatasetRows`,
    `insightsReports`, `accountingTaxStatements`, `accountingInvoiceBatch`, `projectsWorkItemList`). BossUsersDemoData
    unchanged. `run#AdminExport`'s verb is in the client deny pattern already.
- Specs: framework `test/AdminBackups` (2 features, 0.03 s: reading and asking each need their permission; never run,
  a success, a skipped run, a failed one, an archive written with a failure after it, a run that never ended and one
  that named no archive are seven states and only one is a success, with the last success kept through them and the
  warning with each; no parameter of the three services names where, what or how; a request carrying a directory, a
  mode, a remote and a job starts one run with the job's stored parameters; its repeat under the key, a second request
  and the start called directly start nothing; the archives as two names with sizes and no path; three requests in a
  day; a run ten minutes ago) and `test/AdminDataExport` (2 features, 0.15 s: an unknown target, an import target, a
  step of the other direction, an unregistered, an inherited and a dropped field name, an unregistered option, an
  expression as an option, a scope where there is none; a field asked for by name left out and named, in the preview
  and in the file, and given to a holder of its permission, whose name is never answered; a formula cell as text; too
  many rows refused whole and not recorded; the transfer permission, the owner's and neither; one record and one audit
  row with no content, the repeat under the key, another request and another user under it; who reads the record; the
  imports' list as it was). Mantle `test/party/ContactBooks` (1 feature added, 0.15 s: the caller's books as scopes,
  another user's book refused, the count alone, the field groups asked for and no other). BOSS
  `test/Admin/AdminExports` (3 features, 0.9 s: the vCard through the mount's transition and one record of each export;
  a field marked as not the caller's to read left out and named, through the real exporter; the data operator, who may
  view no such book, exporting and listing nothing of it; a user outside the area posting nothing; a scheduled report's
  delivery as its id, state and counters with its definition never named, and the recipient's copy refused; one qvt
  render each of Exports, DataExport and Backups; the backup operator opening only Backups and the data operator told
  it is not available). `AdminAccess` changed: the backup operator's `data` capability. Acceptance, written and not
  run: `test/acceptance/Admin/AdminExportsUsable` (3 features, the "usable when").
- Tests run (the shared release binary, this phase's runtime): framework AdminBackups, AdminDataExport,
  AdminDataTransfer, AdminConfiguration, AdminJobs, AdminMailOutcomes, AdminRecovery 21 of 21; mr-mantle ContactBooks,
  StaffInvitationImport 24 of 24; mr-boss AdminExports, AdminAccess, ProjectsAccess, AdminImports, AdminSettings,
  AdminJobRuns, Contacts 70 of 70. `moqui lint --screens` 133 flagged sites, as master now, no parse failure; `moqui
  lint` on the five changed service files and `moqui check` on the new files clean. By hand, not kept: Backups in qvt,
  tui and html as the backup operator, the administrator and the data operator; Exports as the data operator, and
  refused to the backup operator; DataExport with no target, with an owner's-place target named, for the contact book
  without a book and for the translations with a review (22,311 rows of `es`), in the three modes; the area's default
  for the backup operator. Prettier clean on the new JavaScript and on the changed files that were clean. Not run:
  `./moq test-framework`, `./moq test-apps`, the acceptance suite, cargo (no Rust changed); no browser, and no backup of
  a running server's embedded database (a spec's process runs none: F245).
- Inventories: usl-inventory's `ContactImportServices.export#Contacts` row names Admin/Data/DataExport as implemented;
  none of ss-inventory's rows is P16's.
- Design edits: design-admin §11 Exports, DataExport and Backups (as built), §14 (Import/export target), §16 (Business
  export) and §17.2; the owners' designs, one sentence each: design-drawers-commons (the contact book's export
  registered), design-projects, design-accounting and design-insights (listed with their places; Insights' two
  administrative finds read here).
- Findings (provisional, numbered by the lead):
  - **F240** Of the plan's exporters only Commons' vCard has a service to dispatch. Accounting's tax statement data and
    billing batch CSV, Projects' work-item CSV and Insights' dataset and report exports are registered as an owner's
    place (mode wizard, as P15's owner wizards) and never dispatched: each is tied to a record or a list on its owner's
    screen, and the statement's export writes on it. A work-item and a ledger export service stay their owners' (§7).
  - **F241** No registered exporter has a field with a permission of its own: what a viewer of a contact book reads
    of a contact is the whole card, and Commons' own export gives the same. The rule (a field the caller may not read is
    left out) is the framework's, tested with a restriction the specs set on a registration; birthdays and notes are
    left out unless asked for, which is a default and not a restriction.
  - **F242** BackupNow is a run of the seeded job by `ec.service.job(name).run()`: the scheduler's run outside the
    schedule (P14) does not start a paused job, and the job is paused on a fresh instance. Such a run takes no lock, so
    a scheduled run can start beside it (the request is refused while the lock is held, not the other way round).
  - **F243** `ec.service.job(name).run()` writes the run's row in the caller's transaction and hands the run to a
    worker at once: called inside a transaction (a service, a transition: Tools' Run Job too) the worker's record of the
    run's start is lost ("could not record a service job run ... does not exist", seen in the spec) and a run shorter
    than the caller's commit loses its end. `run#Backup` starts the run through `start#BackupRun`, which has no
    transaction and is called as a future, so the row is committed first. The framework's to fix (the run's row in a
    transaction of its own; `ServiceJobRun` has a foreign key to its job, so a caller may not hold the job's row for
    update): Remaining-Work says so.
  - **F244** Nothing registers a provider's status for an external database, a restore's verification, an archive's
    checksum or its expiry: coverage says unknown for an external database, "no archive has been verified" always, and
    retention as the job's counts in words; a physical backup's size is not summed. The design's fields for them are
    not built.
  - **F245** A spec's process reports its data sources embedded and runs no embedded cluster, so a backup there is
    skipped: the specs and the acceptance walk check the truthful states (skipped is not a success), and a real archive
    is §8's walk by hand on a running server.
  - **F246** The export bounds are their own (5000 rows and 2 MiB by default, at most 50000 and 16 MiB), not the
    import's: the demo's Spanish translations alone are 22,311 rows.
  - **F247** ExportList's expiry and authorized download are not built: an export's file is the response of the
    request that asked and is kept nowhere, so there is nothing to expire or to download later. Its record is kept 366
    days by default and removed by P15's cleanup job; the audit log row stays.
  - **F248** The engine's administrative alert list answers a rule's id, which carries its title's words (Insights P8
    noted it): Admin shows a digest of it, and of an occurrence only its own id.
  - **F249** The data operator exports only a contact book they may themselves view (their own, or one shared with
    them): `BOSS_ADMIN_DATA` holds no domain permission (F223), and no organization-wide contact export exists. The
    record of an export is likewise listed only to who may view its book.
  - **F250** Commons' own CSV contact export writes a cell beginning with `=` as it is (and a phone number begins with
    `+`): Admin registers the vCard only; the CSV writer is Commons' later work.
  - **F251** The mirror's address is not shown on Backups (it is the read-only remote of Connections, F148): only
    whether one is set and whether the last archive written reached it.
  - **F252** DataExport's form shows a target's first three options; a fourth would keep its default (none registered
    has more than one).
  - **F253** `moqui lint --screens` counts 133 flagged sites on master now (132 at P15): upstream's Tools changes.
- Decisions: an export target is the same registration record with a direction, in three modes; the record of an
  export is a `TransferBatch` row and an audit log row, never the file; an operation key's repeat makes the file again
  and keeps nothing more; a field's permission is the registration's, and one that does not exist drops the field for
  everyone; Admin's export of a target asks `ADMIN_TRANSFER_RUN` with the owner's own check, and `ADMIN_TRANSFER_VIEW`
  reads others' records within the reader's own scope; the framework keeps an export target of its own (message
  translations, as its import, F232); a delivery's state is the engine's, and by its counters never "delivered" with a
  failed or an uncertain recipient; coverage is read from the backup job's runs and the archive directory and from
  nothing a person enters; the seeded job is the backup (another job running the service, or the seeded job repointed,
  reads as no backup job); a backup may be asked for 30 minutes after the last and three times a day; the Data area is
  opened to the backup operator for Backups alone.
- For the lead:
  - no Rust changed, so the shared release binary needs no rebuild; a database made before needs `TransferTarget`'s two
    new columns and the seed data loaded again (the framework's grants and target, Mantle's new data file, BOSS's area
    group and five targets);
  - mr-mantle has a branch `adm/p16` to merge and a worktree at `adm-p16/mr-mantle` (this phase's runtime points at it);
  - budget shares (release binary): framework about 0.2 s (AdminBackups, AdminDataExport); mr-mantle about 0.15 s
    (ContactBooks' new feature); mr-boss about 0.9 s (AdminExports); no budget raised;
  - merge: mr-moqui `ServerEntities.xml` (two fields and two descriptions of P15's entities),
    `AdminConfigurationData.xml` (appended), `DataTransferServices.xml` (a section appended before the internal
    services, an interface before `call#TargetService`, `find#Transfers`' parameters), `DataTransferLib.js`,
    `DataTransferImports.js`, `DataTransferBatch.js` (two lines and the exports), `ConfigurationServices.xml` and
    `ConfigurationLocalization.js` (appended), `OperationLib.js` (one name), Attack-Surface, Run-Deploy, Remaining-Work
    (the `org.moqui.admin` row only), the rest new files; mr-mantle `ContactImportServices.xml` (a parameter, a block
    and two services appended), `ContactBooks.spec.js` (one feature), one new data file; mr-boss `BossSetupData.xml`
    appended at its end (Insights appends there too), `Admin.js` (`areas`' comment, `linkPaths` after P15's),
    `Data.xml`, `AdminAccess.spec.js` (one row), the five designs, `usl-inventory.md`, the rest new files;
  - other plans: none edited;
  - P17 reads: an export's `EntityAuditLog` row (`moqui.server.TransferBatch`, field `export`, the transfer id, the
    target id, "N rows of ...; fields: ...") and its `TransferBatch` record; a backup request's row
    (`moqui.service.job.ServiceJob`, field `backupRequest`, the job, the run id, the reason);
  - the user's call: F241 (whether a contact's birthday and notes, or any registered field, should need a permission
    in an export); F249 (whether the data operator should export a book they may not view: built, never); the bounds
    of asking for a backup (30 minutes, three a day) and of an export (F246); F242 (whether BackupNow should instead
    wait for the scheduler, which would need the job resumed first); F247 (whether a stored download with an expiry is
    wanted at all); F240 (whether Accounting's and Projects' exports should become services Admin dispatches);
    whether the framework keeps its message translations export;
  - the brief had the acceptance test written and not run, AGENTS.md has a new one run once: AdminExportsUsable is
    not run, to run when asked.

**Review Nov 11 (P16).** A fresh review of the three repositories' P16 diffs, the read path first (the export module, the
backup module, Mantle's exporter and BOSS's mount read line by line; the job runner and the backup read in
`crates/moqui-core/src/service/jobs.rs`, `service/backup.rs` and `crates/moqui-drivers/src/backup.rs`); fixes committed
apart per repository ("Admin P16 review: …"). No Rust changed.
- Checked and found sound:
  - Export dispatch. The target is read by id with direction `export` (an unknown, disabled, malformed or import target
    fails closed; `constructor` is no target); a wizard-mode target is refused before anything is called; the service is
    the registration's `exportService` through `call#TargetService`, whose step table for an export target holds only
    `export` and `scopes`. A request's scope must be one the scope service gave this caller; its options are the
    registration's by own name and checked by `optionsOf`; its fields are registered names only. No entity, filter,
    expression, address or path is read from a request (`run#Export` takes five parameters).
  - Fields (F241). A field's permission is the registration's; the list given to the owner is cut to the allowed ones,
    a rows target's answer is written from those names only, and a wanted field the caller may not read is named as
    left out, never by its permission. A field naming an unknown permission is dropped for everyone. No registered
    exporter has a restricted field; birthdays and notes are `selected: false`, a default and not a restriction.
    `export#Contacts`' new `fieldList` only removes groups of fields: no caller and no request can use it to add one.
  - The contact book (F249, confirmed by the user Nov 11). `export#ContactBookTransfer` calls
    `check#ContactBookAccess` (view) on the book as the caller before anything, whatever grant the call runs under, and
    the framework has already refused a scope `find#ContactExportScopes` (the caller's own and shared-with-them books)
    did not give; `export#Contacts` leaves out a contact another user owns privately. So on every path (the framework's
    service called directly, Admin's `download` transition, the preview) the data operator exports only a book they
    may themselves view; another user's personal book and another organization's read as not available. The record of
    an export is listed by the same scopes.
  - Bounds. The owner is given `maxRows` and answers a count alone past it (the translations count to one past it and
    read no rows; the contact book counts before it builds); the answer is refused whole past the rows or the bytes,
    never cut. The file is only `run#Export`'s answer: nothing stores, mails or addresses it. The delimited writer
    (P15's) writes `= + - @`, a tab and a carriage return as text, headers too.
  - `find#Transfers` with direction export: an occurrence as its sequence id, its engine state, sanitized reason code,
    counters and its schedule's owner's name; an alert rule as a digest of its id (the id carries title words), with
    counters; no title, recipient, value, parameter or content, and nothing opens. Occurrences and rules carry no
    organization, so a holder of `ADMIN_TRANSFER_VIEW` sees every organization's as these counters (as the engine's
    administrative read was built, Insights P7 and P8); noted, not changed.
  - Backups. No parameter of the three services names a path, a name, a destination or a job; the archive directory is
    the job's stored parameter, the property or the default; an archive is answered only when its name matches the
    backup's own pattern, as that name, with no path and no download; the mirror as set or not (F251);
    `ADMIN_BACKUP_DOWNLOAD` is used nowhere and stays sealed. The bounds (30 minutes, three a day: BOSS's rule for the
    delegated backup operator, the user's decision of Nov 11) are in the service, under a ledger row locked for the
    request, so two requests at once are taken one after the other. The run is the job's stored parameters only
    (`run_job_now`), under the operator's user with authorization off as every job run is; the service it calls is
    `authenticate="false"` and reads nothing of the user. `start#BackupRun` has no grant, asks `ADMIN_BACKUP_RUN` and
    refuses inside a transaction; starting it with no transaction (F243) is sound.
  - BOSS. `BOSS_ADM_DATA_BACKUPS` gives the backup operator the area's screen without inheritance and Backups alone;
    Data.xml has no transition of its own. Each transition reaches a service that checks the caller (`run#Backup`,
    `run#AdminExport` with the mount's `ADMIN_TRANSFER_RUN`); the five owner's-place targets are links from a fixed
    route table. AdminExports renders each of the three screens once (qvt); no spec takes a real backup.
- Fixes:
  - **R1 (medium, F254).** Two runs of the backup beside each other are not safe: each begins by removing every
    unfinished archive in the directory (`sweep_partials`), the other's too, so the first fails at its publish (a dump)
    or is removed while it is written (a physical backup), and each renames and removes archives by its own plan. The
    request was refused while a scheduled run held the lock, but a run asked for took no lock, so the schedule could
    start beside it. The run now takes the job's lock for itself once it has its run id (`hold#BackupLock`, internal, a
    transaction of its own), and the job runner releases it at the run's end as it does a scheduled run's (its release
    names the run). A run that ended before the lock named it is settled at once, and a lock naming a run that ended is
    read as free and taken over. Script and service definition only.
  - **R2 (medium, F255).** A repeat under an export's operation key made the file again from the data as it then was
    and wrote nothing: with one key a user could take the data every day under one audit row. Every file made is now an
    audit log row (`repeat: N rows of …`); the record stays one.
  - **R3 (low).** The record and the audit row of an export were written in the caller's transaction, so a response
    that failed after the file left could roll them back: `run#Export` now has a transaction of its own.
  - **R4 (low, F256).** Coverage said success for a job that is paused or has no schedule (the seeded job is paused):
    a success that nothing follows now reads `unscheduled` ("No next backup is scheduled …"), and a first run under way
    reads `running`, not "No backup has run yet".
  - **R5 (low).** An export's byte bound counted characters: it counts UTF-8 bytes.
  - The user's decision of Nov 11 on the export bounds: the review and the refusal at the bound say that larger volumes
    are not a BOSS export and a system administrator has tools for volume (Data.js, DataExport, design-admin §11).
  - Comments, Attack-Surface and design-admin §11 say the above.
- Tests (the shared release binary, this phase's runtime): framework AdminBackups, AdminDataExport, AdminDataTransfer,
  AdminConfiguration, AdminJobs 13 of 13 (AdminBackups 0.05 s; added: the lock after a request, the lock service
  refused directly, a lock of an ended run and of a live one, the paused success); mr-mantle ContactBooks 22 of 22;
  mr-boss AdminExports, AdminAccess, ProjectsAccess, AdminImports 22 of 22. Prettier clean. Not run: the suites, the
  acceptance test (unchanged; its `running` state now exists), cargo, `lint --screens` (a label and a color only).
- For the lead:
  - no Rust and no entity changed by the review; no seed data changed (a service definition added: `hold#BackupLock`);
  - R1's rest: between a run's release of a lock that did not yet name it and the write of its end there is an instant
    in which the settle can read the run as not ended; the lock is then left until the next request (which takes it
    over) or the job's `expireLockTime` (a day by default), and the schedule waits that long. It needs a run that ends
    within milliseconds of starting. The framework's own fix closes it and Tools' Run Job besides: `run_job_now` taking
    the job's lock, or the backup runner refusing a second run in the process (Remaining-Work with F243);
  - a run of the backup job from Tools still takes no lock (an instance administrator's);
  - coverage does not say a scheduled backup is overdue (a success three weeks old with the job running reads
    success with its date), and does not read the job's from and thru dates;
  - `get#ExportFields` answers a target's words and registered permission names to any signed-in user, as P15's target
    reads do;
  - provisional findings: **F254** two backups at once remove each other's unfinished archive, and the schedule could
    start beside a requested run; **F255** a repeat under an export's key read the data again unaudited; **F256**
    coverage read a paused job's old success as covered.

### P17 — Audit and access evidence

Design §12 AuditChanges and AccessLog, §16 audit evidence; ADM-AUDIT, ADM-REPORTS.

- **`org.moqui.admin.AuditServices.find#Changes`** over EntityAuditLog and owner audit sources, with registered safe
  projections (secrets never before or after values; payroll, private contacts and message bodies not disclosed by
  their entity changing); the administrative events the earlier phases lacked, on the existing audit targets with
  correlation.
- **`report/admin-access-log.json`**, the AccessLog dataset over `otel_logs` narrowed to the `moqui.report.audit` and
  `moqui.monitor.audit` targets, its artifact and document granted to `BOSS_ADMIN_AUDIT` (P0), read by
  `ReportServices.query#Documents`.
- **Screens:** AuditChanges (AuditFind, AuditList) for the audit reader without `ADMIN`; AccessLog (AccessFind,
  AccessEvidence); the CSV and print of each.
- **Specs:** BOSS `AdminAudit` (a masked credential change; the audit reader reads the dataset without `MONITOR_APP` and
  no other log line).
- **Usable when:** `admin.audit` follows a grant change and a relay credential replacement with the actor and reason
  and no secret, and sees who exported a report.

**Built Nov 11 (P17).**
- Checked first (the code over the plan):
  - `EntityAuditLog` (create-only) holds the old and new value of every audit-logged field: about 105,000 rows after
    the demo load, of about 240 entities, most of them business records of Mantle's (invoices, payments, supplier profiles,
    party identifications). Encrypted fields are audit-logged too (`EmailServer`'s and `SystemMessageRemote`'s
    passwords and keys, `PartyIdentification.idValue`): the entity audit log keeps their values encrypted. Tools'
    System › Audit log reads all of it by entity and field name, for `ADMIN`.
  - Upstream's Tools reorganization: Monitor is a section of System and `MONITOR_APP` is gone, so the plan's "without
    `MONITOR_APP`" is "without System's grant" (`SYSTEM_APP`); the telemetry datasets (`org.moqui.report.dataset.otel_.*`)
    are Tools' grant, `ADMIN`'s.
  - The report engine (`crates/moqui-report/src/lib.rs` `resolve_dataset`): a dataset definition may alias a telemetry
    index only with a server-owned row filter (`rowFilter`, `contextFilters` or a `rowFilterService`), and the filter is
    part of the dataset's resolution, ANDed before the request's query, query text, filters and time range in
    `constraints`, so no request can remove it (as P6 to P10's reviews established for business datasets). The
    dataset's artifact is checked with `authorize_own`: the viewer's own grant, never one inherited from the screen or
    service that asks. A dataset has no field list: a hit is the whole document.
  - The audit targets. `moqui.report.audit` now carries P7's and P8's lines besides exports and deletes (a schedule or a
    rule stored, paused, transferred, delivered, retried, reconciled); `moqui.monitor.audit` carries incidents, recovery,
    runtime settings, conf reloads and edits, component loads and Constitution changes. A line's attributes are its
    structured fields; two of them hold values: `recipients` of a scheduled export (addresses) and `value` of a runtime
    setting. F45 stands: the lines are kept `log-retention-days` (seven by default), only what was done is logged (no
    refused read, no purpose), and a line carries no organization.
  - What earlier phases wrote, read from their notes and their code: every change the Admin services make to a field
    the entity audits, or to one they record themselves, is in `EntityAuditLog` with its reason. Left with a log line
    or nothing (the gaps, below): another user's sessions ended and access revoked (P4, the framework), a password reset
    sent, a factor reset and a lock released that was no disable (P4, Mantle), an import applied (P15), a mail message
    closed or sent again from the queue (P12: the close was only in the message's own state rows, which are every send
    of every user), and Login as (F69). `auditRow` wrote no session.
- mr-moqui (no Rust changed: everything ran on the shared release binary; no Debug build was made):
  - `entity/ServerEntities.xml`: `moqui.server.AuditProjection` (a registration: entity, field or `*`, category,
    description, `valueMode`, `sourceService`, `viewPermission`, the key values' kinds and titles, `linkKey`).
  - `service/org/moqui/admin/AuditServices.xml` and `Audit.js` (new): `find#Changes`; the owner contract
    `find#OwnedChanges` (an interface: ids only) and `call#ChangeSource` (not inheritable, as `call#TargetService`).
    Registered projections only; a value shown only by registration; an encrypted or secret-named field a marker
    whatever its row says (a flag, a date or an event about a secret, such as `requirePasswordChange`, is not one); `*` for every other field of a configuration entity, never a value and never a field
    registered on its own; a request narrows by a projection's id or a category, a whole key value, an actor, a session
    and dates; 2,000 rows deep, 100 a page, an export of 1,000; a source that fails named and the others answered; the
    registry checked once a request.
  - `ConfigurationLib.js` `auditRow` writes the session (`changedInVisitId`), for every service's own audit rows.
    `Identity.js`: another user's sessions ended and `revoke#AccountAccess` each leave a row on the account (kinds and
    counts, the reason). `DataTransferBatch.js`: an apply that took rows leaves one on its batch. `OperationMail.js`: a
    close and a retry from the queue leave one each (`queueClose`, `queueRetry`).
  - Data: `data/AdminAuditData.xml` (new, named in `MoquiDefaultConf.xml`'s `load-data` list): the two services' grants
    and 36 projections of the framework's own records, all of the whole instance (grants and app gates, row rules,
    group flags, sign-in providers, instance settings, translations, message types, relays, connections, printers,
    jobs, topics, a message's state and settlement, the mail queue's actions, exports, imports, backup requests).
  - Docs: Attack-Surface ("Change evidence"), Remaining-Work's `org.moqui.admin` row. No Parity-Diffs entry.
- Mantle (a worktree added for it, branch `adm/p17`): the framework knows no organization, so the records that
  belong to one are Mantle's to find (§4, the decisions of Nov 7).
  - `entity/IdentityEntities.xml`: seven view entities that join the audit log's rows back to an internal organization
    (`AuditLogAccountOrganization`, `…Member…`, `…Actor…`, `AuditLogOrganization`, `…Relationship…`, `…Invitation…`,
    `…Lifecycle…`), each with the row's id, what it is of, who and when, never a value.
  - `service/mantle/party/IdentityServices.xml` `find#IdentityChanges` and `IdentityAudit.js` (new): the audit source,
    by the organization entity filters of the authorization the call runs under (Identity.js `scopedFind`, now
    exported); ids only; an entity it does not know answered nothing; an instance administrator with no organization
    active reads the log's rows of these entities as they are. `Identity.js` `reset#Authentication`: a row on the
    account for a reset password sent, a factor ended and a lock released.
  - `data/PartyAuditData.xml` (new, seed): the views' filters in `MANTLE_USER_ORG` and `MANTLE_ACTIVE_ORG`, 29
    projections (a user's account and what was done to it, group memberships, a user's topic subscription, an
    organization membership's end, invitations, lifecycle operations and steps, an organization's own record and its
    gateways), and the framework's export and import projections given Mantle's source, by who made them.
- BOSS:
  - `report/admin-access-log.json` (new): the dataset, an alias of `otel_logs` with the fixed `rowFilter` of the two
    audit targets and the row-filter service below.
  - `service/ironstone/admin/AuditServices.xml` and `admin/Audit.js` (new): `find#ChangeEvidence` (the framework's find
    with a record's place as a route, only when that screen opens to the user; people's changes unless asked for a data
    load's too), `get#AccessLog` (the engine's `query#Documents` as the user, structured filters only, each line as its
    safe fields: addresses counted, values left out) and `get#AccessLogRowFilter` (a reader of every organization
    every line; another reader the lines written under a user of an organization they administer, at most 5,000
    accounts; anyone else nothing). `Admin.js`: the `audit` area and two link paths.
  - Screens `Admin/Audit.xml` (the area: Changes and Access log, menu index 10), `Audit/AuditChanges.xml` (AuditFind,
    AuditList) and `Audit/AccessLog.xml` (AccessFind, AccessEvidence), each with its print (the screen in html-print)
    and its CSV (the list's export), one bounded page of the same projection.
  - `data/BossSetupData.xml` (appended): `BOSS_ADM_AUDIT` (the area, for the audit reader and the administrator, with
    the root's filter sets) and `BOSS_ADM_ACCESS_LOG` (the dataset's artifact, view, for the two). No new permission, no
    client deny pattern change (`find#` and `get#` only). BossUsersDemoData unchanged (`admin.audit` was P1's).
- Specs: framework `test/AdminAuditChanges` (2 features, 0.15 s: only the registered fields of a record found and
  counted, not an unregistered entity's, not a field whose permission the reader lacks though its entity has a `*`
  registration, not one whose source is undefined or lacks the contract; an encrypted field a marker though registered
  to show, its stored values nowhere, as a field named like a secret is while an event about one is shown; the
  services' own markers as they are; a shown value with the actor, the reason
  without control characters, the record's name and link key; by projection, category and actor; an unregistered or
  unreadable projection, an inherited category name and a named entity refused or ignored; the page, the depth bound
  and the export; the permission; `revoke#AccountAccess`'s row with the actor, the session and the reason);
  `AdminMailOutcomes` and `AdminDataTransfer` (a check each of the new rows). Mantle `test/party/IdentityAudit` (2
  features, 0.27 s: through the framework's service an audit reader of one organization reads its staff's account
  change with its values and reason, allowed addresses as a marker, the membership, a membership's end, the
  organization's own record and an export its person made, and nothing of another organization's by key, category or
  count; the source called directly answers ids only, of the
  entity it knows, in scope; the instance administrator reads both; a lock release leaves its row). BOSS
  `test/Admin/AdminAudit` (3 features, 1.1 s: the audit reader, with no System or other area, follows a grant change
  and a credential's replacement with the actor and the reason, the encrypted values nowhere, no link into a screen it
  cannot open, the data operator refused; its own organization's person's change and not Services'; the access log as
  the lines of its own people with the addresses counted and a setting's value left out, never another organization's
  line or a line of another target, with the engine asked directly four ways to widen it, the telemetry dataset
  refused and the row filter the viewer's own; one html render each of AuditChanges and AccessLog). `AdminAccess`
  changed: the audit capability and the menus. Acceptance, written and not run:
  `test/acceptance/Admin/AdminAuditUsable` (3 features, the "usable when").
- Tests run (the shared release binary, this phase's runtime): framework AdminAuditChanges, AdminDataExport,
  AdminDataTransfer, AdminMailOutcomes, AdminSessions, AdminJobs, AdminRecovery, AdminConfiguration,
  AdminConnectionServices, AdminBackups, AdminAccessServices 35 of 35; mr-mantle IdentityAudit, StaffIdentity,
  UserLifecycle, StaffInvitation, InternalOrganizations 28 of 28; mr-boss AdminAudit, AdminAccess, ProjectsAccess,
  AdminUsers, AdminImports, AdminMailQueue, AdminExports, AdminLifecycle, AdminRegistries, AdminGroups,
  AdminInvitations, AdminJobRuns 45 of 45. `moqui lint --screens` 133
  flagged sites, as master, no parse failure; `moqui lint` on the three changed service files clean. Prettier clean on
  the new JavaScript and the changed files. By hand, not kept: the two screens as the audit reader in qvt, tui,
  html-print and csv (a reason beginning with `=` written `'=…` in the file), the area's landing, and both refused to
  the data operator, as Tools' audit log is to the audit reader. Not run: `./moq test-framework`, `./moq test-apps`,
  the acceptance suite, cargo (no Rust changed); no browser.
- Inventories: none of ss-inventory's or usl-inventory's rows is P17's (their AuditLogList rows are the business
  records' own histories).
- Design edits: design-admin §12 AuditChanges and AccessLog (as built), §14 (an Audit projection row), §16 (Audit
  evidence), §17.1 (ADM-AUDIT, ADM-REPORTS) and §17.2.
- Findings (provisional, numbered by the lead):
  - **F257** The audit log is read only by registration. Of about 240 audited entities 32 are registered: the
    administrative records. A business entity (an invoice, a payment, a supplier's terms, an employee's identification)
    has no projection and is not in AuditChanges: its history is its owner's screen's. An owner that wants one in
    Admin seeds a projection with its own source.
  - **F258** A value is shown only where a row says `show`, and never for an encrypted or secret-named field: the
    entity audit log's own rows of a relay's or a remote's password hold the encrypted values, which are not answered.
    Every other field of a connection, a provider, a job, a topic, a message type and a printer is registered as `*`:
    named, never shown (their columns are their adapters' and change with them).
  - **F259** The framework knows no organization, so it registers its own records as the whole instance's and
    Mantle registers the identity records with its source. A framework-only instance has no account or membership
    changes in `find#Changes` (Tools has them, for `ADMIN`).
  - **F260** Identity scope is the current relationship, as Users (P4): once a person's memberships have all ended,
    their account's later changes are in no organization's AuditChanges. What ended them is: the membership's end and
    the lifecycle operation are found by their own organization. An instance administrator with no organization
    active reads every account's.
  - **F261** The administrator's every-organization reading comes from the Audit area's grant
    (`MANTLE_ACTIVE_ORG`), as in Users (F65): `find#ChangeEvidence` called outside the screen answers the
    administrator their own organizations only.
  - **F262** A group's grants, a connection and a job carry no organization, so every audit reader reads their
    changes, with an actor who may work for another organization (the usable-when's grant change and relay are such).
    An export or an import a person made is scoped by its maker's organizations.
  - **F263** A data load writes audit rows with no user (the demo load about 1,500 of app gates and grants alone):
    AuditChanges lists people's changes unless asked for a load's too.
  - **F264** The access log is log lines: kept seven days by default, nothing for a refused read or export, no
    purpose, no organization (F45 stands). AccessEvidence has no "permission result" and no "purpose" column, and says
    how long lines are kept. A durable evidence store is the framework's (Remaining-Work).
  - **F265** A dataset has no field list, so the dataset answers a line whole: `recipients` (a scheduled export's
    addresses, `audit_export`) and a runtime setting's `value` (`live_settings`) are in it. The screen and its file
    leave them out; a reader who also holds an Insights group reads them through the engine, within the dataset's two
    filters. Closing it is Rust: the lines written without the values (Remaining-Work).
  - **F266** The design scoped the access log by its two targets only. Built with a row-filter service besides: a
    reader of some organizations reads the lines written under those organizations' people (the line's `user.id`), so
    lines no user wrote (a schedule's run, another server's change) are read only by a reader of every organization.
    Past 5,000 accounts in scope nothing is answered.
  - **F267** A line's attributes are searchable only through the pairs the telemetry ingest keeps beside them
    (`__attributes`): the specs index their lines with those pairs, as the ingest does; a spec's process exports no
    log lines, so no test reads a line a real export wrote (the framework's report tests do).
  - **F268** Evidence added where an action changed no audited field: sessions ended, access revoked, a password,
    factor or lock reset, an import applied, a mail message closed or sent again. Left as they are: Login as (a log
    line, F69, Tools'); a group's creation and description; an organization's name and defaults (Mantle's
    `PartySetting` is not audited); an owner's own import batch (Products' operation record); a self-service
    revocation; a Constitution change (a line on `moqui.monitor.audit`, so in AccessLog for as long as lines are kept).
  - **F269** The services' own audit rows now carry the session; rows written before this phase have none, and a
    job's or a load's have none by nature. The session is the correlation: a row's link lists everything changed in it.
  - **F270** `EntityAuditLog` has no index on its second key value or its actor: a membership's and a maker's
    rows are found by the entity and field index first. Fast on the demo's 105,000 rows; an index is the framework's
    to add when a log grows (Remaining-Work).
  - **F271** No user picker in the finds: the audit reader holds no identity permission, so a find narrows to an
    actor, a record or a session by the links of a row, not by a typed id.
- Decisions: the registry is a framework record its owners seed; a request names a projection or a category, never an
  entity or a field; `marker` is the default and `show` the exception; a secret-named or encrypted field is a marker
  whatever is registered; a `*` registration never shows a value and never covers a field registered on its own; an
  owner's source answers ids only and the framework reads and masks the rows; instance records need
  `ADMIN_AUDIT_VIEW` alone, organization records the reader's scope; a mail message's own state rows are not
  registered and the queue's actions are rows of their own; AuditChanges and AccessLog are one area of their own
  (Audit) for the audit reader and the administrator; the access log is scoped by its lines' users as well as by its
  targets; the audit reader is given no link into a screen it cannot open.
- For the lead:
  - no Rust changed, so the shared release binary needs no rebuild; a database made before needs the new table
    `AUDIT_PROJECTION` and the seed data loaded again (the framework's new data file, Mantle's, BOSS's two groups);
  - `MoquiDefaultConf.xml` gains one `load-data` line (after `AdminConfigurationData.xml`);
  - mr-mantle has a branch `adm/p17` to merge and a worktree at `adm-p17/mr-mantle` (this phase's runtime points at it);
  - budget shares (release binary): framework about 0.2 s (AdminAuditChanges); mr-mantle about 0.3 s (IdentityAudit);
    mr-boss about 1.1 s (AdminAudit); no budget raised;
  - merge: mr-moqui `ServerEntities.xml` (an entity appended), `MoquiDefaultConf.xml` (one line), `ConfigurationLib.js`
    (`auditRow`), `Identity.js`, `DataTransferBatch.js`, `OperationMail.js`, two specs (a check each), Attack-Surface,
    Remaining-Work (the `org.moqui.admin` row only), the rest new files; mr-mantle `IdentityEntities.xml` (views
    appended), `IdentityServices.xml` (a service appended), `Identity.js` (three rows and an export), the rest new
    files; mr-boss `BossSetupData.xml` appended at its end, `Admin.js` (`areas`, `linkPaths`), `AdminAccess.spec.js`
    (the menus and a capability row), design-admin, the rest new files;
  - other plans: none edited;
  - the user's call: F266 (the access log scoped by its lines' users: built; the design had the two targets only);
    F262 (every audit reader reads the changes of the instance's shared records, whoever made them); F260
    (whether a leaver's account changes should stay readable to the organization they left); F265 and F264
    (framework work on the audit lines: no values in them, a durable store, refused reads); F257 (whether any
    business entity's changes belong in Admin's AuditChanges at all); whether `BOSS_ADMIN_ADMIN` should read the access
    log (built: yes, as it holds `ADMIN_AUDIT_VIEW`);
  - the brief had the acceptance test written and not run, AGENTS.md has a new one run once: AdminAuditUsable is not
    run, to run when asked.

**Review Nov 11 (P17).** A fresh review of the three repositories' P17 diffs, the read paths line by line (the framework's
`Audit.js`, Mantle's `IdentityAudit.js` and its seven views, BOSS's `Audit.js`, and the report engine's
`resolve_dataset`, `authorize_own` and definition save in `crates/moqui-report` and `crates/moqui-core/src/user/authz.rs`);
fixes committed apart per repository ("Admin P17 review: …"). No Rust changed.
- Checked and found sound:
  - `find#Changes`. Nothing of a request names an entity or a field: a projection id must be one the caller may read
    (an unknown one and an unreadable one are the same refusal), a category an own name of the fixed list. The filters
    are whole values of the actor, either key value, the session and the dates; there is no sort, no text search and no
    filter on a value, so a count cannot be probed for a value. A row is shown only through `projectionOf` of the
    projections asked for, whatever a find or a source answered. A `*` registration: `show` is false whatever its row
    says, so `before` and `after` are null but for the services' three fixed texts (`(set)`, `(replaced)`,
    `(cleared…)`); the same object is the CSV's and the print's; the error texts carry no row. An encrypted field
    (`getFieldInfo().encrypt`) and a secret-named one are markers though registered to show.
  - The framework's 36 projections, all of the whole instance. Values shown: a group permission's dates, an app gate's
    type, a row rule's id, a group's factor flag, a provider's disabled flag, default group and role-to-group map, an
    instance setting (five editable ones are registered: display name, locale, time zone, a recipient ceiling, a
    window of days; a secret is refused as a preference at registration), a translation's text, a relay's and a
    connection's disabled flag, a job's paused flag and its run and backup requests (fixed state texts), a message's
    state and settlement words, the mail queue's close and retry words, an export's and an import's counts and field
    names (these two are Mantle's to find once Mantle loads). Markers: a group's allowed addresses and defaults, and
    every `*` (a provider's endpoints and client id, a field mapping, a message type, a relay's and a connection's
    host, user name and URL, a printer, a job's parameters and recipients, a topic). So no address list, URL, client id,
    job parameter or Constitution text is a shown value. What every row does show: the key values (a job's
    `recipient.<userId>` and `parameter.<name>` as field names), the actor's username and name, and the reason an
    administrator typed.
  - `call#ChangeSource` and Mantle's `find#IdentityChanges` (the P15 lesson). The framework reads the source's
    projections from the registry, never the request. Mantle's source checks `ADMIN_AUDIT_VIEW` itself and takes its
    scope from the organization entity filters of the authorization the call runs under (`scopedFind`: nothing when
    that authorization names no organization filter set, but for an instance administrator), so the area's inheritable
    ALWAYS grants no row. Called directly with a made-up projection list it answers ids and a count of the entities in
    its own table only.
  - Organization scope. Each view joins the audit row to an internal organization and the filters of
    `MANTLE_USER_ORG` and `MANTLE_ACTIVE_ORG` are seeded for all seven; the actor, key, session and date filters are
    conditions on the same filtered find, so none of them reaches another organization's row. Key orders checked
    against the entities (a membership's and a subscription's user is the second key, a gateway's organization the
    first). F261 confirmed by reading: outside the area the administrator's call runs under the root group's
    `MANTLE_USER_ORG`, their own organizations. F260 as written. A person of two organizations is read by both
    (as Users, P4).
  - F262, exactly: every audit reader reads the framework's projections above but the export and the import. None
    carries a user as its record; what they reveal of another organization is the actor of a change to a shared record
    (username and name), a user id inside a job's recipient field name, and the ids and states of system and mail
    messages (no address, subject or body). A group's membership rows and a transfer's rows are scoped (by the member,
    by who made it).
  - The access log's fixed filter. `resolve_dataset` builds the dataset's `rowFilter` and the row-filter service's
    answer into the dataset's own filter, and `constraints` ANDs a request's time range, query, query text and filters
    to it: asked four ways by a holder of the artifact, only the two targets' lines come back (the spec).
    The row-filter service decides by the signed-in user's own Admin scope and permission, whoever calls it.
  - The evidence rows: counts, kinds, fixed words and ids only; written by `auditRow` in the action's own transaction
    (rolled back with it); the session recorded is the visit's sequenced id, not `Visit.sessionId` or a token.
  - Screens and grants: `BOSS_ADM_AUDIT` is the area's screen for the two groups; no transition writes; the lists are
    display fields (escaped by the renderer; read, not rendered again); the CSV is the framework's render, which guards a formula cell
    (`csv_guards_formula_text_and_quotes_a_carriage_return`). AdminAudit renders each screen once in html, and
    AuditChanges once more as a refusal.
- Fixes:
  - **R1 (High).** F265 was wider than a note: the dataset's artifact was granted to `BOSS_ADMIN_AUDIT` and
    `BOSS_ADMIN_ADMIN`, and a dataset has no field list, so a holder who may also call the engine (with any Insights
    group) read each line whole: the addresses scheduled exports went to and runtime settings' values (the first build's
    own spec read whole documents so; an aggregate of an attribute and an agent's report tools resolve the dataset the
    same way, by the engine's code). Now the artifact is
    granted to no group; `get#AccessLog` checks `ADMIN_AUDIT_VIEW` under Admin and reads the one dataset with
    authorization off, under the dataset's two filters, answering its safe fields. The engine refuses the dataset to
    the audit reader (documents and aggregate: the spec). Left: an instance administrator reads the lines in Tools, as
    they read the log index.
  - **R2 (Medium).** F266's bound was silent: past 5,000 accounts in a reader's organizations the row filter
    matched nothing and the screen said "No line matches", which reads as nothing having happened. The bound stays
    (fail closed); `get#AccessLog` now answers `unavailable` with the reason, and the screen shows it.
  - **R3 (Low).** Mantle: an instance administrator with no organization active read the audit log as it is, so every
    party's `disabled` change (a customer's, a supplier's) was listed as "Organization disabled" and every
    relationship's end as an organization membership's. Those two stay on their views, which say what the row is.
  - **R4 (Low).** A `*` registration found through a source counted, and spent its page on, the fields registered on
    their own (the framework dropped the rows after the count): the contract's projections now carry
    `exceptFieldNames` and Mantle's source honors it.
  - **R5 (Low).** `revoke#Sessions` wrote "sessions ended" on an account whose sessions could not be ended: the row is
    written only for the accounts ended.
- Tests (the shared release binary, this phase's runtime): framework AdminAuditChanges, AdminSessions,
  AdminAccessServices 11 of 11; mr-mantle IdentityAudit, StaffIdentity 10 of 10 (IdentityAudit gains the person's party
  and the gateway's own field; the party check fails without R3: run); mr-boss AdminAudit, AdminAccess, AdminUsers 13
  of 13, InsightsAccess, InsightsDatasets 10 of 10; AdminAudit 1.2 s. Prettier clean on the changed JavaScript. Not
  run: the acceptance walk, the full suites. Not tested: the 5,000-account answer (it needs that many accounts) and
  R5's failure path (read only); the screens were not rendered again by hand in csv and html-print (the same service
  answers them).
- For the lead:
  - **Open, High, the Insights track's and Rust (found here, confirmed by running it):** a holder of
    `org.moqui.report.dataset` update (the dataset steward, `BOSS_INSIGHTS_DATA`) saves a dataset `insights-…` with
    `indexName: otel_logs` and `rowFilter: {match_all: {}}` and reads every log line through it: the engine asks a
    telemetry alias only for some row filter, and the steward's own pattern grant (`insights-.*`) is its artifact. As
    `insights.steward`: saved, one hit of an ordinary log line of another target. Sharing the definition would open it
    to the other Insights groups. No data change closes it without taking the steward's save; the engine should ask an
    alias's reader (or its saver) for the index's own artifact. Attack-Surface says so.
  - decisions for §4: the access log dataset is granted to no group and read by Admin's service after its own check
    (the plan and design §12 had it granted to `BOSS_ADMIN_AUDIT`; design §12 edited); the audit reader therefore
    cannot chart it in Insights;
  - F265 as it now stands: only an instance administrator reads the addresses and values; the lines written
    without them is still the framework's;
  - F266: a scoped reader with more than 5,000 accounts in their organizations is answered no line and is told;
    widening it (a filter by organization on the line) needs the lines to carry an organization (F45);
  - the user's call, unchanged: F262 (actor names of shared records to every audit reader), F260, F257;
  - merge: this review touches only P17's own files, Attack-Surface (one bullet) and `Identity.js` (`revokeSessions`).

### P18 — Shared devices

Design §6 Devices, §14 shared-device registration; CX-DEVICE, ADM-DEVICES. Stage 5, with Insights P11: Insights'
second release (§4).

- **The framework device credential** (CX-DEVICE): revocable, tied to one browser, limited to one registered route
  group (an artifact group), with an idle timeout; it identifies no person. `org.moqui.admin.DeviceServices`
  `register#Device` (the registration code shown once, stored hashed), `find#Devices` and `revoke#Device` (its sessions
  ended at once), checking `ADMIN_ACCESS_VIEW` and `ADMIN_ACCESS_MANAGE` (design §2 makes the registrar the access
  administrator; no device permission is designed, §4); the route-group registration a framework seed record.
- **What a device reads as:** a device identifies no person, but the dashboards it plays are read as someone. The
  registration names a display account (a UserAccount with no password or sign-in of its own, in groups the registrar
  may grant under P3's delegation rules), under which the device's requests run, only within its route group. The
  display account has a Person party with a member relationship to each organization it shows, written through P4's
  `store#OrganizationMembership`; without one `setup#UserOrganizationInfo` gives it no organization, and
  `MANTLE_USER_ORG` and Insights' row filter show it nothing (F33). This is the plan's proposal for CX-DEVICE, which
  names no principal (design-admin §19 holds the question); the phase checks it against the credential's design before
  building, and the answer is written into design-admin §6 and crosscut CX-DEVICE, which already name the Playlists
  route group.
- **The route groups registered now:** Insights' Playlists, for its wall displays (Insights P11). Manufacturing's
  ShopFloor waits for its shared-station operator switch, which identifies each action's person by badge and PIN
  (impl-manufacturing §7); People's, Maintenance's and Marketing's kiosks for those apps (§7).
- **Screens:** Devices (DeviceFind, DeviceList with revoke, RegisterDevice).
- **Specs:** framework `DeviceCredential` (a device opens only its route group, as its display account; a revoked
  device's next request refused; the code works once and is never stored in plain text); BOSS `AdminDevices`.
- **Usable when:** `admin.access` registers a browser for the Playlists route group with a display account holding only
  the Insights reader bundle for ORG_ZIZI_RETAIL; its code works once; the browser opens nothing outside the route
  group; revoking the device ends its session at once.

**Built Nov 11 (P18).**
- Checked first (the plan's proposal against CX-DEVICE and the code, as the phase asks; the answer is in design-admin §6 and
  §19 item 7 and crosscut CX-DEVICE):
  - The proposal stands, with one change of substance. A device identifies no person and reads as a display account: a
    UserAccount nothing signs in, with a Person party that is a member of each organization it shows
    (`store#OrganizationMembership`, so `setup#UserOrganizationInfo`, `MANTLE_USER_ORG` and Insights' row filter scope
    it, F33) and the registered bundles its registrar could assign. The change: the plan had "its requests run as it"
    and "its sessions ended at once", which reads as a signed-in session of the display account. The code says no to
    that. The framework's nearest credentials (an API or device key, `login.rs` `check_login_key`; an app password) all
    end by making their account the web session's user, and three places outside the screens read a session's user
    from its row or live copy (the notification socket, the terminal socket, the Assistant's event stream), and many
    paths ask only for a signed-in user. So the display account is the user of a device's request only, held in the
    request's context and never written to the session (F278); there is no session of it to end, and revocation is
    the device row, read on every request (F281).
  - Artifact authorization cannot confine a device: `ALL_USERS` holds an inheritable ALLOW on the Admin service
    families (each refuses by permission), the app list and shell transitions, and a display account's own bundle
    reaches more than one screen. And the display account's own authorization cannot be cut down to the route group
    either: a dataset's artifact is checked with `authorize_own` under its own grant, which a playlist's panels need
    (F279, F280). So the route group is an allow-list of the request's target, checked by the framework before
    the target runs, and what it admits is authorized as the display account as ever.
  - A display account must be refused by every sign-in. Beside the password and key logins, a dozen entry points check
    a credential of their own and then call `internal_login_user` (SSH keys, SFTP, XMPP, the terminal, git, the report
    schedules), so the refusal is in `internal_login` itself, with one named exception for the work a request queued
    (`service/pool.rs`), which a worker runs as its user with no client attached (F282).
  - `create#PartyUserAccount` requires an email address, unique among accounts: a display account has none, so Mantle
    creates its account itself (F283). P4's `store#OrganizationMembership` needs `ADMIN_IDENTITY_MANAGE` and P3's
    grant proposal `ADMIN_ACCESS_MANAGE` or `ADMIN_IDENTITY_MANAGE`; the identity operator opens no Security area and
    the access administrator no Users area (F284).
  - Upstream's `/qapps` shell: a browser's page under `/qapps` is the shell screen itself, which then asks for the
    menu, the shell data, notifications and each screen. None of that is in a route group, so a device cannot load the
    BOSS shell: Insights P11's display needs a page of its own or members for what it loads (F285).
- mr-moqui (Rust changed: a Debug build in the worktree; no release build):
  - `crates/moqui-core/src/user/device.rs` (new): the credential. `begin_request` (the cookie `moqui.device`,
    `<deviceId>.<secret>`; the secret compared first, by its SHA-256, so a request without it learns nothing; then
    revoked, stopped, the end date, the idle timeout, `ipAllowed`, the display account's fitness, the route group; no
    cache), `enter`/`leave` of the request's identity, the daily replacement of the secret with the ten-minute grace
    and the stop of a device whose earlier secret comes back (`copied`), last seen at most once a minute, `redeem` (the
    code once, the write holding only while unredeemed; the session's user signed out), `check_route` (the gate),
    `display_account_refusal` (displayAccount, not closed, no password or external identity, no privileged group, no
    sealed permission), and the evidence rows.
  - `user/session.rs`: a device's hold in the context's session memory; `thread_view` stores the session's own
    identity whatever the context's user is, so no flush, sync or guard order can write the display account.
    `user/login.rs`: the display-account refusals (password, `internal_login`), `internal_login_queued_user` for
    `service/pool.rs`, and no login at all inside a device's request.
  - `screen/mod.rs` `handle`: the device begins after the session is bound; a refused one is 403 (its cookie removed
    when the refusal is final); the registration's fixed parameter replaces the request's; `authenticate` is skipped;
    a script servlet is refused. `screen/render.rs`: the gate before anything of the target, and a screen test's
    render with a device cookie header is that device's request. `token_route.rs`: `Device` reserved.
  - `script/host/globals.rs`: `UserSecurityChecks.newDeviceCode`, `redeemDeviceCode` (the cookie goes on the response,
    never to the script), `displayAccountRefusal`, `currentDevice`.
  - Entities (`SecurityEntities.xml`): `UserAccount.displayAccount` (audit-logged), `moqui.security.DeviceRouteGroup`
    (the registry row) and `DeviceCredential`.
  - `service/org/moqui/admin/DeviceServices.xml` and `Devices.js` (new): `find#RouteGroups`, `find#Devices`,
    `register#Device`, `issue#DeviceCode`, `revoke#Device`, and the public page's `redeem#Device` and
    `get#DeviceStatus`. `webroot/screen/webroot/Device.xml` (new): the `/Device` page.
  - Data: `SecurityTypeData.xml` (the `AdminDeviceServices` grant, appended). No route group is seeded by the
    framework: each owner seeds its own.
  - Docs: `docs/security/Shared-Devices.md` (new), Attack-Surface ("Shared devices"), the webroot README's row,
    Remaining-Work (the device-credential ask rewritten as built with what is left; the `org.moqui.admin` row).
- Mantle: `service/mantle/party/SharedDevices.js` (new) and five services appended to `IdentityServices.xml` (the
  package's existing grant covers them): `create#DisplayAccount` (`ADMIN_IDENTITY_MANAGE`: the party, the member
  relationship through `store#OrganizationMembership`, the account, the grant proposal, all or nothing, and the account
  must come out fit for a device), `find#DisplayAccounts`, `find#SharedDevices`, `register#SharedDevice`,
  `reveal#SharedDeviceCode` and `revoke#SharedDevice`, each within the caller's identity scope (the organization entity
  filters, as every find of the package): another organization's display account and device are not available and
  are counted, a display account that also shows an organization out of scope needs `ADMIN_IDENTITY_GLOBAL`, and the
  site is a Facility the caller reads. `find#Users` names a display account as one. `data/PartyAuditData.xml`: six
  projections (the `displayAccount` flag and the five device events), by Mantle's audit source.
- BOSS:
  - `screen/Admin/Security/Devices.xml` (new, the Security area's third tab): DeviceFind, DeviceList with Revoke,
    RegisterDevice, and the code shown once at the render (`revealDeviceId`). `screen/Admin/Users/Users.xml`:
    NewDisplayAccount. `Admin.js`: the route row, and Login as refused for a display account with its reason.
  - `data/BossSetupData.xml` (appended): the route group `INSIGHTS_PLAYLISTS` (owner Insights, parameter
    `definitionId`, a week's idle timeout) and its artifact group `BOSS_DEV_INS_PLAYLISTS`: the Playlists screen and
    its `data` transition, no more. Insights P11 adds what its play needs and sets the home path.
- Specs (feature time on the Debug binary):
  - cargo `user::device::tests` (3 tests, 0.3 s): the code once and nothing stored in plain text; the request-only
    identity and the session that never holds it; the daily replacement, the grace and the copy; the idle stop; the
    sign-ins a display account never passes and the queued work it does; the privileged group, the address and the
    disabled account.
  - framework `DeviceCredential` (3 features, 0.5 s): registering and its refusals, the code through `/Device`, the
    gate beside an instance administrator's own session, revocation, the evidence.
  - framework client `SecurityDevice` (4 features, 0.1 to 0.4 s; over real HTTP, with fixtures in `ClientFixtures`): the
    cookie's flags, a second redemption, the device refused another screen, a transition, a REST path with a login key
    and the REST login (403), its session cookie alone signing no one in, no notification socket, and a forged and a
    revoked cookie refused and removed.
  - Mantle `party/SharedDevices` (2 features, 0.8 s): a display account's making and its refusals; a device
    registered, its code shown once, listed and revoked only within the registrar's organizations.
  - BOSS `Admin/AdminDevices` (3 features, 0.6 to 1.1 s): the transitions as each role, Devices' one qvt render, the code
    redeemed and the device refused Admin, Insights' other screens, its account's notifications and Playlists' own
    editing transition, and its admitted request decided as the display account. `AdminAccess` gains the rule's case
    (0.3 s): one holder, one non-holder, another organization's display account, a privileged bundle, Login as.
  - Acceptance, written and not run: `test/acceptance/Admin/AdminDevicesUsable.spec.js` (the "usable when", with the audit
    reader's view of it).
- Tests run: the specs above; framework `AdminSessions`, `PushDevice`, `AdminAccessServices`, `RecentAuth`,
  `AdminAuditChanges`; the framework's client `SecurityAuthn`, `SecurityAccess`, `SecurityScreens`, `SecurityRest`;
  Mantle `StaffIdentity`, `IdentityAudit`, `UserLifecycle`; BOSS `AdminUsers`, `AdminSecurity`, `AdminAudit`,
  `ProjectsAccess`; cargo `-p moqui-core --lib` for `user::`, `screen::`, `service::pool` and `script::host` (583
  tests), clippy for the crate; `moqui lint --screens` (no parse failure, nothing flagged in the new screens). No
  suite, no acceptance test.
- Rendered by hand (a throwaway spec, not kept): Devices in tui, html and qvt as the access administrator and the
  administrator, as the configuration administrator ("not available to you") and the reader (refused the area);
  Users in tui and html with NewDisplayAccount; `/Device`. No server was run by hand: the worktree's path is too long
  for the embedded database's socket (117 bytes), so the HTTP path was proved by the client spec instead.
- Inventories: none names Devices (design §2's row is "new"); nothing to mark.
- Design edits: design-admin (the head line, §6 Devices with "What a device reads as" and "As built", §14's row,
  §17.1 ADM-DEVICES, §17.2's DeviceServices row and the device record, §19 item 7 settled); design-crosscut (CX-DEVICE
  in §1.5, its need row and the L5 remainder row); design-insights §4 Playlists (the display account, one sentence).
- Findings:
  - F278: a signed-in session of the display account would be a general session to the sockets and to every path
    that asks only for a user. Resolved: the display account is a request's user, never a session's.
  - F279: `ALL_USERS` grants and login-only paths make artifact authorization no fence for a device. Resolved: the
    route group is an allow-list of the request's target, deny by default, in the framework.
  - F280: cutting the display account's authorization down to the route group would refuse the dataset grants a
    playlist reads by. Resolved: what the gate admits is authorized as the display account, unchanged.
  - F281: "its sessions ended at once" has no sessions to end. Resolved: every request reads the device; a
    revocation holds from the next one on every server, and the cookie is removed.
  - F282: a dozen sign-ins end in `internal_login_user` after a check of their own. Resolved: the refusal is there,
    with `internal_login_queued_user` for queued work.
  - F283: `create#PartyUserAccount` needs an email. Resolved: `create#DisplayAccount` writes the account.
  - F284: no one delegated role both makes an account and registers a device. Built: the identity operator makes
    the display account in Users, the access administrator registers the device. Open (the user's call, below).
  - F285: the `/qapps` shell is outside every route group. Open, Insights P11's: a page for the display, or the
    members it loads. A screen's own server-side render of another screen is gated too.
  - F286: the Insights reader bundle alone opens nothing: the Insights root is the launcher group's
    (`BOSS_INSIGHTS`). The "usable when" display account "holding only the reader bundle" is refused its own route
    group by authorization (the spec shows exactly that). Open, Insights P11's: which bundles a display holds.
  - F287: a copy of the cookie used within the day of the copying is not detected; the replacement catches it
    after. Said in design §6 and the docs; a bound credential is in Remaining-Work.
  - F288: a browser that loses the response carrying its new secret is stopped ten minutes later and must be
    registered again. Kept: re-issuing the secret would let a copy keep up.
  - F289: a refused device gets a bare 403. Open, with P11's page (Remaining-Work).
  - F290: the framework's client budget is 6 s and five of its six specs with `SecurityDevice` take 6.4 s on the
    Debug binary (the failing line is 9 s).
  - F291: `apps/ScreenTree` fails in a screen test (`sri.getRootScreenDef` is not a function). Not this phase's.
- Decisions made here:
  - The display account is the user of a device's request only; revocation is the next request refused.
  - A route group's artifact group is an allow-list and grants nothing: a screen member admits its render, an
    inheritable one its transitions and what is below, a transition member that transition; `/Device` and the files
    anyone may have are always admitted.
  - The code is about 99 bits, made at the render that shows it (as P5's link), entered at `/Device` within 15 minutes;
    every refusal of a code gets one answer.
  - The cookie is `HttpOnly`, `SameSite=Strict`, `Secure` on https; the secret is replaced daily, the one before it
    works ten minutes and then stops the device.
  - A wall display's idle timeout is a week by default (5 minutes to 30 days), a registration lasts 365 days (at most
    730), and a device may be held to addresses.
  - A display account that stops being fit refuses its devices until it is put right; it does not stop them for good.
  - A device's evidence is on its display account, so the organization scope of an account's evidence is its scope.
  - Revoking takes no revision: it only ends, and a second one answers the first (last seen rewrites the row a minute).
  - Nothing signs in as a display account, Login as included.
  - Mantle's device services are in `mantle.party.IdentityServices`, bodies in a module of their own.
- For the lead:
  - Budgets (Debug feature time): framework server +0.5 s, framework client +0.4 s (see F290), Mantle +0.8 s,
    BOSS +1.4 s.
  - Merge: appended at the end of `BossSetupData.xml`, the framework's `SecurityTypeData.xml`, Mantle's
    `PartyAuditData.xml` and `IdentityServices.xml`, and `ClientFixtures.spec.js`; one row in `Admin.js`'s route list and
    two lines in its `loginAsCheck`; `AdminAccess.spec.js` one feature before the last; `Remaining-Work.md` the two
    rows named. The `crates/moqui-report` work on another branch touches none of these files.
  - For Insights P11: the route group row and its artifact group are in BossSetupData's last block (add members, set
    `homePath`); Devices opens RegisterDevice's values from `newRouteGroupId` and `newParameterValue`;
    `find#SharedDevices` takes `routeGroupId` and `parameterValue` for "the devices showing each playlist";
    `UserSecurityChecks.currentDevice()` says whether a request is a device's; a refused device gets 403 JSON; see
    F285 and F286.
  - The user's call: who makes a display account (built: the identity operator; the access administrator alone
    cannot set a display up, F284); whether Login as a display account should be allowed to an `ADMIN_LOGIN_AS`
    holder (built: refused); the defaults (a week idle, 365 days, a daily replacement, 15 minutes for a code).
  - Not verified: the acceptance test was not run; a real browser (the client spec proves the cookie and the gate over
    HTTP, not a browser's handling of `SameSite=Strict`); two servers (nothing is cached per server, but no cluster
    was run); the secret's replacement over HTTP (cargo only).

**Review Nov 11 (P18).** A fresh review of the three repositories' P18 diffs, the Rust line by line (`user/device.rs`,
`user/session.rs`, `user/login.rs`, `screen/mod.rs` `handle` and `dispatch_request`, `screen/render.rs`, `token_route.rs`,
`script/host/globals.rs`, `service/pool.rs`), then `Devices.js`, Mantle's `SharedDevices.js` and BOSS's screens and seed;
the gate probed with a throwaway spec (deleted): as a device, 33 paths. Fixes committed apart in mr-moqui ("Admin P18
review: …"); Mantle and BOSS unchanged.
- Checked and found sound:
  - Confinement. Every HTTP request with a device cookie passes `handle`, and the gate is in `run_job_now` before the
    redirects, the authentication check, any action and any file: deny unless a member admits the target screen (a
    non-inheritable screen member admits its render only, not its transitions, its implicit ones such as `actions`, or
    a subscreen) or the transition; a missing or disabled route group refuses the device (`Account`), a missing artifact
    group admits nothing. Probed and refused with "This device opens only …": other screens and app transitions (GET
    and POST), `rest/s1`, `rest/e1`, `rest/m1`, `rest/login`, `Login` and its transitions, `ChangePassword`,
    `SecondFactor`, `ReAuth`, `sso`, `assist`, `rum`, `WebPush`, `ChatKeys`, `emailOAuth`, `PublicShell`, `echopath`,
    `status`, `error`, `qapps/<member>` (the shell's mount, not the member), a script servlet; admitted: the member, its
    `.xml` render mode, `/Device`, `favicon.ico`. `/fop` renders through the same `run_job_now`. The host's own routes
    (`/notws`, `/termws`, `/xmpp-websocket`, `/callws`, `/git`, `/dav`, `/llm/v1`) never read the device cookie and see
    the browser's session, which holds no user. A nested render inside an admitted screen is gated too; what the
    screen itself includes is the screen author's, and its services run with the display account's own authorization,
    which is right (F280). `before-request` actions and filters run as the display account before the gate: conf
    code, not the request's.
  - Identity. `enter_device` swaps the context's user and `thread_view` stores the held identity, so no flush, sync or
    `restore_identity` writes the display account to the session row or live session; a visit is made at the bind,
    before the device, with no user; no login history is written. `finish_login` refuses any sign-in under a device
    (password, `internal_login_user`, a service's `authUsername`, which `login_user_local` checks through it);
    `internal_login` refuses a display account everywhere but `pool.rs`'s three queued paths, whose user is the
    caller's own at queue time (or a persisted queue row's, writable only by an entity administrator who could name any
    user). Login as: the framework (`internal_login`) and BOSS refuse. A display account has no email, so no reset,
    invitation or SSO link reaches it; a password or external id makes its devices refuse.
  - Privileged groups and sealed permissions are not refused on the grant paths (P3's `store#Membership`,
    `apply#Grants`, imports, Tools, direct writes): a display account may come to hold one, and then every device of
    it refuses, from the next request, until it is removed; nothing else signs it in, so holding one opens nothing.
  - The credential. The code is 20 of 31 symbols (about 99 bits, unbiased), single-use-hashed, unique-indexed, good
    once (the write guarded on `redeemedDate` null), 15 minutes by default; the secret 43 base64url characters (258
    bits), kept as `hash_login_key`; the secret checked first so a request without it learns nothing; every refusal of
    a code or secret is `note_auth_failure` for the web protection. No secret in a log line (device ids only), URL,
    error or audit row. `ipAllowed` against `web::client_ip`, the configured proxy header. Rotation race: the write is
    guarded on the current hash, the loser's request goes on with no cookie, the old secret works the grace.
  - Revocation and fitness: the device row is `cache="never"` and read with `use_cache(false)`; the display account's
    groups, grants and the route group are cached entities the cluster invalidates, as every user's authorization is.
    The cost on an ordinary request is one cookie header scan. Removing the display account's organization membership
    does not refuse the device: it then shows that organization nothing (the row filters), which fails safe.
  - Registration: `register#Device` needs `ADMIN_ACCESS_MANAGE` and a display account whose every current or future
    group the registrar could assign; Mantle adds the identity scope (another organization's display account and device
    not available, counted), `ADMIN_IDENTITY_GLOBAL` for one shown beyond it, a Facility the caller reads.
    `create#DisplayAccount` checks `ADMIN_IDENTITY_MANAGE` and the organization, writes the party, the membership
    through `store#OrganizationMembership`, the account (no password, email or external id, `displayAccount` Y) and the
    grant proposal in one transaction, and refuses an account a device could not run as. The framework's
    `DeviceServices` know no organization and are granted to `ALL_USERS` (`allow-remote` false), as `AccessServices`
    are: scope is Mantle's, as in gate 1.
  - The fixed parameter is put last over the query, the form, a JSON body and the saved parameters in `handle` (and in
    a screen test's render), and a path's inline parameters yield to it in `run_job_now`.
  - Audit: registered, redeemed, revoked, refused (throttled to one each ten minutes), stopped; never a code or secret;
    Mantle's six projections. The daily replacement is not audited (a row a day per device would be noise; a copy's
    use is, as `deviceStopped` `copied`).
  - Regression: the non-device path of `handle`, `login.rs` and `session.rs` is unchanged but for one cookie scan;
    `pool.rs`'s queued login differs only for a display account.
- Fixes (mr-moqui):
  - R1 (High): the daily new secret was written in `begin_request` and its cookie put in the web slot, which every
    answer built outside it dropped (a route refusal, a 404, a render error, the error page), so a display whose first
    request of the day was refused, or failed, was stopped ten minutes later as a copy, with a false `copied` row; and
    a static answer marked `Cache-Control: public` carried the new secret where a shared cache may keep it. Now
    `DeviceGuard::rotate` makes the secret at the end of `handle`, on an answer that will carry it (any whole answer, a
    refusal too); a streamed or public one leaves it to the next request. cargo (`rotate`, nothing made when not
    called) and `SecurityDevice` (the new secret on a 403, which then works).
  - R2 (Low): a token route ran its token service as the display account before the gate refused its shell: refused
    first now. R3 (Low): a device held to addresses passed a request with no known address: it fails closed (cargo).
    R4 (Low): the refusal throttle's count did not use `ENTAUDLOG_FLD1PK` whole (no display account): it does.
  - R5 (Low): a refused device request left the live session minted for a cookieless request in the table until its
    idle timeout, one per request: it is discarded (`SecurityDevice` checks no session cookie).
  - R6 (Low): a screen test's render inside a device's request began the device again, and its guard's drop ended the
    outer scope: not begun again.
  - Shared-Devices.md: the replacement's timing, the token route, the unknown address.
- F291 is master's: `ScreenTree.xml` calls `sri.getRootScreenDef()`, which no Rust on master or this branch
  implements, and the branch does not touch the screen.
- F290: on the shared release binary with this runtime the six client specs other than `SecurityDevice` take 4.6 s
  of 6 s; `SecurityDevice` is 0.4 s on Debug, so the suite is about 5 s on release: the overrun is Debug's. No budget
  raised.
- Tests: cargo `user::device` (3) and `-p moqui-core --lib screen:: user::` (565 passed), clippy and fmt of the files
  touched; framework `DeviceCredential`, `AdminSessions`, `RecentAuth`; client `SecurityDevice` (5 features, 0.4 s on
  Debug), `SecurityAuthn`; BOSS `AdminDevices`; all pass on the rebuilt Debug binary. No suite, no acceptance test.
- For the lead:
  - Budget: framework client +0.02 s (the rotation feature); nothing else.
  - Open, the user's call or a later phase's: F288 stands (a lost answer still stops the display after the grace;
    R1 removed the far commoner cause); whether a grant path should refuse a privileged group to a display account
    rather than leave its devices refusing; F285 (the `/qapps` shell) is now also the reason a qvt client asking
    `actions` or `qapps/<member>` is refused.

### P19 — Finish

- The tui and server-static screen sweeps of Admin, one acceptance test per mode (each screen's twin is built in its
  phase).
- The design §15.3 review, acceptance tests (§8): a user of each Admin group with no other launcher is refused other
  organizations' identities, secrets, sealed rights, privileged memberships and the System mount, through URLs,
  transitions, imports, SSO, exports, the palette, choices, Assist tools and direct services.
- The §16 outputs not built earlier: the readiness and support summary (print and redacted JSON).
- The inventories' **Implemented in** columns, the design's Impl column, and Remaining-Work; the mr-boss README's
  Admin line.

**Built Nov 11 (P19).**
- Checked first: the phase's loose ends against the code as it is now (the Built and Review notes' "For the lead" items of
  P1–P18). What changed from the plan: the readiness and support summary is a screen of its own under Operations (no
  owner screen of design §16's two held room for a print and a file); F129's sites were 23 reads in 18 Admin screens, not
  only gate 1's; the notification-title hazard reached past BOSS into the framework's job error and agent inbox notices
  (Rust), Voice's alerts and Mantle's approval notices.
- mr-moqui:
  - Rust: `moqui-core` `notify/message.rs` (`service_job_error`: the job's name and errors taken into the title from the
    message by name, `${jobName}` and `${errors}`, so an error that quotes stored or entered text runs nothing) with its
    test `job_error_publishes_danger_with_job_name` given an error holding an expression; `moqui-llm` `trigger.rs`
    (`inbox`: the title is put in the message as `inboxTitle` and the template is `${inboxTitle}`, for an approval's
    model-written summary and an agent or trigger id).
  - `service/org/moqui/call/Voice.js`: the emergency call, trunk and blocked-source alerts pass their caller, location
    name, trunk name and source address in the message and a fixed title template (they were expanded once by
    `ec.resource.expand` and then again as the title). `test/Voice.spec.js` checks the blocked source's title.
  - `plans/Remaining-Work.md`: the `org.moqui.admin.*` row (P19's titles; the identity provider link rule, below); the
    security list (mr-marble's `topicSubscriptions`); the tests list (`apps/ScreenTree`).
- Mantle: `service/mantle/order/PurchaseApprovals.js` (`notify`: a source's own wording, which quotes a supplier's name, is
  put in the message as `noticeTitle` and the title is `${noticeTitle}`); `test/party/PurchaseAgreements.spec.js` checks
  the notices' title.
- BOSS:
  - `service/ironstone/admin/AdminCalls.js` (new): `read(service, parameters, fallback)` answers `{out, failure}` with a
    refusal's own words ("CODE: words", or "PERMISSION is required" as the framework's administration services refuse) and
    otherwise the screen's own text (F129). The 23 reads that captured a failure after `ignore-error="true"` (Home,
    Groups, GroupDetail and its grant preview, Users, UserDetail and its lifecycle preview, Sessions (two), Invitations,
    LifecycleOperations, LifecycleDetail, SettingsHome, Organizations, OrganizationDetail, InstanceSettings, Localization,
    ReferenceData, Constitution, Health, SystemMessages' bulk review) read through it; GroupDetail no longer reads a
    group its record check refused. The other `ignore-error` calls of Admin's screens keep a "not available" state
    and capture nothing, as before.
  - `RegistryServices.get#SupportSummary` (new, `Registry.js` `supportSummary`) and `screen/Admin/Operations/SupportSummary.xml`
    (new, hidden, menu-include false; linked from Health's header and ServerConfiguration for an `ADMIN_OVERVIEW_VIEW`
    holder): design §16's readiness and support summary, html-print and redacted JSON (`summaryJson`). Holds the
    instance's display name, version and package, the readiness checks the viewer may read (state, reason code, message,
    freshness, checked time; failed providers named), the protocols' states with their last checks, and the effective
    settings (a secret only set or not); each section read with the viewer's own permissions and marked unavailable with
    its reason. Never: the environment, host facts, listeners, paths, users, fix links, refresh keys or diagnostics. The
    JSON is always redacted: who prepared it left out, an email address in any text written `[address]`. `Admin.js`
    `linkPaths` gains `Operations/SupportSummary`. A `get` verb: the client deny pattern is unchanged.
  - Acceptance, written and not run (the lead runs the suite): `test/acceptance/Admin/AdminTui.spec.js` (1 feature: every
    Admin screen, 66 with the Data area's `Shared/DataImport` mount, in tui as admin.admin with authorization on: a TUI
    document, no error node; System is Tools' and left out); `test/acceptance/Admin/AdminServerStatic.spec.js` (1 feature:
    ServerStaticLib's full check of each, no verdict an error; none is marked server-static); and
    `test/acceptance/Admin/AdminReviewWalk.spec.js` (4 features, design §15.3 as §8 sets it: each of the eleven Admin group
    users (admin.reader to admin.backup and admin.delegate) is refused another organization's identity by URL,
    UserDetail's `storeAccount`, the palette, three drop-downs, Assist's `admin_find_users` (not exposed to MCP), direct
    services, a shared identity's account-wide change, another organization's OrganizationDetail and its member's contact
    book through `run#AdminExport`; is given no secret (a relay password and a provider client secret set by the walk) on
    eight pages, the summary's print, its JSON and four services; gains no privileged membership or sealed grant through
    GroupDetail's `addMember`, `store#Membership`, a grant proposal, `invite#User` (the rules a bulk invitation import
    applies to each row), an SSO role mapping or direct entity writes, and nothing is written; and opens no System
    screen). `test/Admin/AdminSpecLib.js` gains `sweepScreens` and `sweepParameters` for the sweeps (their output was
    checked once by a throwaway spec: 66 screens, every detail screen's demo record or `NONE`).
  - Specs: `AdminGroups` (+1 feature, 0.12 s: a refused read answers its reason, an allowed one its result, a malformed
    one the screen's own words, and no error is left behind); `AdminRegistries` (+1 feature, 0.34 s: the summary as the
    reader, redacted, and as the administrator; no fix link, refresh key or address in the redacted one; a secret
    setting never a value; the privacy administrator refused; SupportSummary's one qvt render and the JSON download).
  - Records: design-admin §2 (the Impl column of every built row, `xml (built Pn)` with its path where it differs, and the
    new SupportSummary row), §10 TopicDetail (mr-marble's exposure and the proposed fix), §16 (the summary as built);
    ss-inventory (the Admin header note: its rows were already filled phase by phase) and usl-inventory (the Admin header
    note and ten rows: `get#`/`store#PartyContactInfo`, `create#`/`update#PartyUserAccount`, `create#Organization`,
    `update#PartyDetail`, `ensure#PartyRole`, `get#PartySettingValue`, `store#PartySetting`, `validate#PartySetting`); §7
    (mr-marble's finding, ScreenTree, the lifecycle notice); the README's Admin paragraph.
- Tests run (the shared release binary, `--nobuild`, this phase's runtime; Rust in the worktree's Debug build): mr-boss
  AdminGroups, AdminUsers, AdminSettings, AdminOrganizations, AdminConstitution, AdminRegistries, AdminLifecycle,
  AdminInvitations, AdminSystemMessages, AdminAccess and ProjectsAccess 46 of 46; mr-mantle PurchaseAgreements 3 of 3; framework
  Voice 13 of 13; `cargo test -p moqui-core --lib job_error` 3 of 3; `cargo clippy -p moqui-core -p moqui-llm --lib -D
  warnings` clean; rustfmt and Prettier clean on what changed (Voice.js and Voice.spec.js were not Prettier-clean before
  and are left so); `moqui lint --screens` no Admin file flagged, 0 parse failures. By hand, not kept: SupportSummary in
  html-print, tui and html as the administrator. Not run: the acceptance tests written here, the full suites, the rest of
  cargo, the moqui-host integration test of the agent inbox.
- Loose ends:
  - **F129** done (above). A screen whose area the user cannot open still says so by its screen grant first; the reason
    shows where the area opens and the service refuses (the configuration administrator in Operations, the reader on a
    list its permission does not cover).
  - **F-P10's open item** (an organization-scoped `ADMIN_ACCESS_MANAGE` holder administers identity providers, which are
    instance-wide): checked, recorded, not bounded. An access administrator of Ziziwork Retail (or the delegate) enables a
    provider an integration administrator of Retail configured; with the link rule `AflVerifiedEmail` that provider then
    signs in any account of any organization (Services' staff, a PASS customer) whose verified email and name it asserts,
    privileged and sealed-granting accounts excepted (P10 R1); with `AflNever` it signs in the accounts it made or that
    name it, and one with an id naming no provider. `HELD_BEYOND` at enabling counts the accounts linked then, not those a
    later sign-in links. The framework's provider records know no organization, so a bound there is either the link rule
    `AflVerifiedEmail` (and enabling a provider with it) kept for `ADMIN_IDENTITY_GLOBAL`, which would change P10's
    usable-when (the Retail access administrator sets it in AdminSecurityUsable), or an organization on the provider that
    the sign-in's link honors (Rust, a framework ask; in Remaining-Work). The user's call: F292.
  - **The notification-title hazard** (Insights P8 R1): every caller searched in mr-moqui (Rust and scripts), Mantle,
    BOSS, mr-pass and mr-marble. Fixed: the job error notice and the agent inbox (Rust), Voice's three alerts (an
    emergency location's or trunk's name, a source address; each was expanded twice), Mantle's approval notices with
    their own wording (a supplier's name). Left as they are, each an administrator's template by design: a DataDocument's
    `documentTitle` used as a topic's title when no topic exists (`service/tools.rs`, PartyServices' data-feed notice; as
    Java), a topic's `titleTemplate` (Tools'; Admin never writes it, P14), Chat's localized mention (P8 R1 validates a
    translation's expressions). Safe: the database job notice (generated id, fixed status), the report alert (P8 R1).
  - **mr-marble's subscription screen**: not changed (read only); the finding and the proposed fix are in §7,
    design-admin §10 TopicDetail and Remaining-Work's security list.
  - **`apps/ScreenTree`**: not one line (it needs a host member for screen definitions); in Remaining-Work's tests list
    and §7.
- Findings (provisional, numbered by the lead):
  - **F292** (high, the user's call) The identity provider link rule is instance-wide while its enabler may be
    organization-scoped (above).
  - **F293** (medium, fixed) A notification title quoting stored or model-written text ran it as a script: the job
    error notice (its errors), the agent inbox (an approval's summary, which a model writes), Voice's alerts and Mantle's
    approval notices with their own wording (a supplier's name).
  - **F294** (low, fixed) F129's dead `failure` captures were in 18 Admin screens (23 reads), P8–P16's too, so a
    refused list read as empty ("No groups yet.") and a refused record as missing.
  - **F295** (low, open) design §16's lifecycle completion and exception notice was never built (§7).
  - **F296** (low, open) F73 stands as designed: the framework's `org.moqui.admin` identity services
    (`revoke#AccountAccess`, `revoke#Sessions`) take any account from a holder of their permission and know no
    organization; they are not remote services, and BOSS's and Mantle's record checks come first on every Admin path.
    The review walk checks the record check, not a direct framework call.
- Decisions: the support summary is its own screen under Operations, the screen and print unredacted for the viewer and
  the JSON always redacted; a screen's refusal shows the service's words only when they are a refusal's (a coded reason or
  a missing permission), never an exception's text; the review walk's users are the demo's group users as they are (each
  in `BOSS_ADMIN` and one group, so no other app's launcher), not users made for it.
- For the lead:
  - the shared release binary needs a rebuild for the two Rust changes (notification titles); nothing else needs it, and
    no entity changed;
  - budget shares: mr-boss about 0.46 s (AdminGroups 0.12, AdminRegistries 0.34); mr-mantle and the framework unchanged
    (an assertion each);
  - merge: mr-boss `README.md` (the Admin paragraph is now its own; the Insights paragraph starts on the next line,
    unchanged: the Insights worker's line may conflict on that boundary), `Admin.js` (`linkPaths`, one line after P17's),
    `Operations.xml`, `test/Admin/AdminSpecLib.js` (appended), design-admin, the two inventories (an Admin header note
    after Purchasing's, away from the Insights note), impl-admin §7 and this note; nothing in the shared acceptance files
    (AppStructure, TuiRender), BossSetupData or the sweep helper ServerStaticLib; mr-moqui `Remaining-Work.md` (the
    `org.moqui.admin` row's end, one row in the security list, one in the tests list), Voice.js, the two Rust files;
    Mantle PurchaseApprovals.js;
  - the Apps row "Admin and Insights" of Remaining-Work still says gate 1 and "Next: Admin P8–P14": it is shared with
    Insights and left to the lead;
  - the phase table's P19 row and §6 (F292 to -5) are the lead's;
  - the user's call: F292 (bound the verified-email link rule to `ADMIN_IDENTITY_GLOBAL`, or an organization on the
    provider in the framework, or accept it as built); whether to build the lifecycle notice (F295).

**Review Nov 11 (P19).**
- Checked: `git diff master...adm/p19` in mr-moqui, mr-mantle and mr-boss against the phase's text, §2, §4, design §1.1,
  §15.3 and §16.
  - Notification titles (F293): sound. The job error notice takes `${jobName}` and `${errors}` from its message (the
    job's own message map is extended after them, under its own keys); the agent inbox puts the title in the message as
    `inboxTitle`; Voice's three alerts carry their names in the message and expand once; Mantle's approval notice sends
    `${noticeTitle}`. Searched again (`.title(`, `NotificationMessage::new`, `makeNotificationMessage`, `send#Notification`,
    `titleTemplate`, `documentTitle`) across mr-moqui (Rust and scripts), Mantle, BOSS, mr-pass and mr-marble: no other
    caller passes stored or written text as a title. The rest set no title (the topic's `titleTemplate` over the message) or
    a fixed one (the database job notice: a generated id and a fixed status; the report alert, P8 R1). The administrator
    templates are as described: a DataDocument's `documentTitle` (`service/tools.rs`, PartyServices' feed notice) and a
    topic's `titleTemplate` are written only through seed data and Tools' entity screens (`ADMIN`); no Admin, Insights or
    Mantle service writes either; Chat's mention title is `ec.l10n.localize` of a fixed template whose translation an
    administrator stores, validated by P8 R1.
  - F129 and `AdminCalls.read`: the 23 reads in 18 screens answer `out` null on any failure, so no screen renders a record
    after a refused read; before, every `failure` was null (cleared) and a refused check let the next read run (GroupDetail).
    Constitution's `failure` is now its `get#Constitution` read's only (the other reads were cleared before too). The fallback
    texts quote only the screen's own parameter, and every label shows it once (no second expansion). qvt, html and tui render
    the same label. One defect (R1).
  - SupportSummary: `ADMIN_OVERVIEW_VIEW` (the reader and the administrator; the operations operator opens the screen and is
    shown the refusal, as on Health); each section read with the viewer's permissions through `AdminCalls.read`; a masked
    setting only set or not; bounded (the registered settings, the protocol list, the readiness checks). One defect (R2).
  - The acceptance specs (read, not run): the sweeps render each `screen/Admin` file and Data's `Shared/DataImport` once per
    mode as admin.admin (tui with authorization on, as Commerce's) and check errors, not content; System is left out (Tools'
    file, ADMIN's). AdminReviewWalk's calls use the services' real parameter names (`get#Choices`' choices, `search#Records`,
    `store#Membership`, `check#GrantProposal`, `invite#User`'s `bundleGroupIdList`, `store#IdentityProvider` with the revision
    from `find#IdentityProviders`' `provider`), so its refusals are not vacuous, and each write feature also counts the rows
    written since it started.
  - F292 checked against P10's code (framework `ConfigurationProviders.js` `storeIdentityProvider`, `linkedBeyond`;
    `moqui-core` `service/sso.rs` `link_allowed`, `linked_account`, `unscoped_link_allowed`): the worker's description holds.
    Two facts for the user's decision: (a) the link rule is an access part (`ADMIN_ACCESS_MANAGE` alone): changing it on a
    provider already enabled needs no new test and no `HELD_BEYOND` count, so an organization's access administrator can turn
    `AflVerifiedEmail` on for a provider an instance administrator enabled; (b) an account carrying an id with no provider
    named is taken by the first provider that signs in with that id under either rule, and while that provider is the only
    one enabled even a privileged or sealed-granting account (`unscoped_link_allowed`); `HELD_BEYOND` counts such accounts at
    enabling. Not changed.
  - Mantle's approval notice and its assertion, the Rust test (an error holding `${...}` shows as it is): sound.
  - Records: design §2's Impl column, §16, the inventories' notes and Remaining-Work's rows match the code; the README's Admin
    paragraph is short.
- Fixes:
  - **R1** (medium) `AdminCalls.reasonOf` took any `UPPER: text` in an error as a refusal's reason, so an exception's text
    with such a prefix (a database's `ERROR: ...`, the framework's `URL: ...` or `JSON: ...` errors) reached the screen whole.
    A code now needs an underscore or is one of the seven single-word codes the services use, and a reason longer than 300
    characters is not shown (the screen's own words instead). AdminGroups' F129 feature checks both.
  - **R2** (low) the redacted JSON, meant for someone outside, held the addresses the listeners bind
    (`protocol.*.host`, `listenHost`, `mediaHost`), the gateway addresses admitted (`smtp.allowedAddresses`) and the SMTP
    certificate's path, against "no listeners, paths". Redacted, each is `[internal] (set)` or not set (`internal` true, value
    null); the screen and print keep them for the viewer, who reads them in InstanceSettings anyway. AdminRegistries checks
    it as the administrator; design §16 says so.
- Tests: mr-boss AdminGroups and AdminRegistries 9 of 9 on the shared release binary with this runtime (`--nobuild`). Not
  run: the acceptance specs (the lead's), the Rust (unchanged by the review).
- For the lead: budget share unchanged in substance (AdminRegistries' feature 0.44 s); F292's two facts above go with the
  user's call; nothing else open from the review.

- **Acceptance Nov 11 (after gate 5).** `mail_capture_sends=true ./moq accept mr-boss` on master, the first run after the
  whole Admin and Insights build: eight Admin specs failed (the Insights and sweep failures are the other track's,
  `acc/insights`). None was a product defect; each was a spec bug, fixed in mr-boss on `acc/admin`. AdminReviewWalk's
  grant proposal check, taken first as a possible escalation: `check#GrantProposal` allowed admin.access BOSS_ADMIN_ACCESS
  because admin.access is a member of it, the framework's rule for a privileged group (only a member changes its
  members; design §1.1 "cannot add anyone to a privileged group it is not in", the UserGroupMemberPrivileged EECA, and
  `store#Membership` the same); every non-member, admin.delegate among them, is refused every privileged group, and
  invitations (the bulk import's rows too), SSO role mappings and display accounts refuse a privileged group even for a
  member. The walk now flags an allowed privileged group only when the user is not in it; the proposal's rule had no
  regression check, so the framework's AdminAccessServices now asks `check#GrantProposal` for a bundle, the privileged
  ADMIN_ADV and an unregistered group as its non-member (allowed, PRIVILEGED_GROUP, UNREGISTERED_BUNDLE). The others:
  AdminAuditUsable made a relay with no TLS and set its password, which `store#Connection` refuses (INSECURE_TRANSPORT,
  a warning, not an error); the relay now has STARTTLS. AdminConnectionsUsable read the gateway's revision inside
  `asUser("commerce.services")`, whom `get#Connection` refuses; it is read first. AdminDevicesUsable looked for
  "Shared device's code redeemed" in html, which escapes the apostrophe. AdminGroupsWalk counted every membership of
  commerce.manager in BOSS_PURCHASING_BUYER, AdminAuditUsable's ended one among them; it counts its own rows (from its
  start). AdminImportsUsable compared decimals with `Number()`, which the JS API now refuses; `toDecimal(...).eq`.
  AdminJobsUsable: its cleanup read the job `forUpdate` with no transaction (dropped); and the alert copy had no data, as a
  spec's process exports no spans (`moqui test` attaches search but not the telemetry exporter), so the failed run's root
  span is written to `otel_spans` as the exporter writes it (AdminAuditUsable's pattern for its log line); and in `then`,
  `Array.from` of `get#AlertState`'s instances gave `[]` (so the template's "no instances" held vacuously), read now as
  plain rows. AdminProtocolsUsable expected call media off, but every test run merges basic-comms'
  `test/MoquiConf.xml`, which sets `rtc_media_port`, so where the build has rtc it is configured and not started in a
  command-line run. Final: each spec alone and all 21 of `test/acceptance/Admin/` together (`--spec` with a comma list),
  61 of 61 features passed; framework AdminAccessServices 6 of 6. For the lead: several `--spec` flags run only the last;
  the `Array.from` behaviour of a service's list in `then` is worth a look in the testkit.

- **Final suites (Nov 11, on master after Admin P1–P19, Insights P1–P12, both acceptance fix branches, the framework
  follow-ups and the upstream pulls merged; the release binary rebuilt; nothing else running).** Run once, at the end of
  the build (the user's call: no full suites per wave after gate 1).
  - `./moq test-framework`: the moq script tests, the demo specs and every client suite passed (webroot 423, dev-aide 48,
    framework, basic-comms and example 155). The framework specs passed 516 of 517: the one failure is the tools
    component's LoadRunner (`cannot compare null with 0` on a server sample), failing since the upstream Tools-apps pull
    and not this build's. Cargo passed in the first final run (F38's long-failing test is gone upstream); in the
    rerun one moqui-git test, `large_objects_are_content_blobs_streamed_in_and_out`, failed on a reset local
    connection (`curl 56 Recv failure`) and passed alone. Feature time: framework 16.8 s of 12 s (this build's
    eighteen framework specs 4.4 s; gate 1 measured 10.8 s, the rest is upstream's), tools 4.1 s of 4 s and dev-aide 41.6 s
    of 30 s (neither this build's), basic-comms 6.0 of 8 s, webroot client 43.2 of 44 s. The user agreed (Nov 11) to raise the framework server budget by this build's 4.4 s, rounded up: 12 to 17 s (mr-moqui framework test/budget).
  - `mail_capture_sends=true ./moq test-apps`: 3,526 server and 35 client features, all passed (after the two full-run
    order dependences the first final run found were fixed in their specs: IdentityAudit matched an instance-level
    SystemMessage row whose sequenced id equals the spec's user id, mr-mantle 08448e42; AdminGroups' member choice is one
    page of 30, filled by other specs' staff, mr-boss 68c2212d; neither a product defect). Feature time mr-mantle 362.8 of
    393 s, mr-boss 239.5 of 264 s server and 59.9 of 57 s client (no mr-boss client spec changed in this build; Admin's
    and Insights' walks 2.9 s each, as at gate 1), mr-pass 13.6 of 20 s server and 6.7 of 9 s client. No budget raised.
  - `moqui lint --screens`: clean of this build's screens.
  - `mail_capture_sends=true ./moq accept mr-boss`, after the two acceptance fix branches: server 600 of 602, client 174 of
    175. Failing: WarehouseServerStatic (AssetDetail's Move link made a screen path from an expression by mr-boss
    35223fd6, Nov 10, before this build; the user's call: keep the screen path and unmark Files and Notes, or a plain link
    again); ManufacturingScheduleWalk's drag (the one that failed once at gate 1 and passed on reruns; not this build's);
    InsightsCatalogUsable's order count against OnlineSales in the full run only: a stale sales item document (the search feed kept an order item at OrderOpen after its header and part were completed milliseconds later, framework), fixed in the spec by reindexing the month (mr-boss f49c227b) and recorded for the framework (impl-insights P12's acceptance note).

## 4. Decisions

These are made before and during the build. Each one that changes the design is also written into design-admin.md or
the owner's design.

| Date | Decision | Notes |
| --- | --- | --- |
| Nov 7, 2026 | Admin and Insights are the next apps built, after Commerce | The user's call (the planning request): people trying the BOSS apps need them, and much of what they bring together is built |
| Nov 7, 2026 | What depends on People, Maintenance, Sales and Marketing is left out (§1 scope, §7): People's provisioning entry and SECA, Employee360 links, their import targets, settings rows, readiness providers, lifecycle participants, device route groups and privacy providers, and the payroll export; §7 now names the plans that pick these up (Nov 11, 2026) | The user's call. Admin's own lifecycle (P6) covers disablement and organization removal without People |
| Nov 7, 2026 | Two plans, one order: this file holds the order of both; a phase lives in the plan of the app whose screens it builds; framework and Mantle work goes in the phase that first needs it | The plan's choice, as impl-commerce and impl-shop |
| Nov 7, 2026 | The order of §1, with Organizations and the Constitution (P7) in Admin's first release, stage 1: Admin's first release with Insights' browsing release; Insights' first release beside Admin's configuration and operations; Admin's data and audit | The user's call (answer 1), over the plan's draft, which had P7 in stage 3. Design §17.3 changed: A1 gains Organizations, OrganizationDetail and Constitution |
| Nov 7, 2026 | Shared devices (P18) are built in a second Insights release, stage 5, with Insights' wall displays on them (Insights P11); the route groups registered are Insights' Playlists only, ShopFloor's waiting for Manufacturing's operator switch | The user's call (answer 2). A device runs as a display account its registrar names (P18's proposal, checked against CX-DEVICE there). Design §17.3 changed |
| Nov 7, 2026 | The regression budgets are raised per phase by its measured share, with the user's agreement each time, as Purchasing's, Customer Service's and Commerce's were; each spec stays well under a second | The user's call (answer 3). The framework's is 12 s server and 6 s client, the tools component's 3 s (F30); Admin adds about twelve framework specs, five Mantle and seventeen BOSS, Insights about six framework, one Mantle and eleven BOSS |
| Nov 7, 2026 | The framework lets a component add to the seal lists: `user-facade` `authz` gains `sealed-permission` and `privileged-group` child elements that every component's conf adds to, the attributes keeping the framework's defaults; mr-boss adds its three privileged groups as elements (P1), the three Admin seals being the framework's (the row below) | The user's call (answer 4), so a framework seal added later is never dropped by a component's repeated list (F5); design §1.1 changed |
| Nov 7, 2026 | The framework seals `ADMIN_IDENTITY_GLOBAL`, `ADMIN_ACCESS_MANAGE` and `ADMIN_BACKUP_DOWNLOAD` in MoquiDefaultConf, as it seals `ADMIN_CONSTITUTION_GLOBAL`; all three are seeded and sealed in P1, `ADMIN_BACKUP_DOWNLOAD` before its download screen (§7), so design §15.3's escalation rule holds from P1 | The user's call (the plan review): the framework seeds and checks them, and a framework-only instance keeps them sealed; design §1.1, §10.1, §15.3, §17.1, §18 and crosscut §1.4 changed |
| Nov 7, 2026 | When the instance cannot send mail, InviteStaff and a resend show the acceptance link once, as plain text with a copy control rather than a link; showing it is audited, and the token is never stored in plain text, listed or shown again (P5) | The user's call (answer 5); design §4 Invitations changed |
| Nov 7, 2026 | The group recipient cap is 50 per business schedule or alert rule by default (Insights Settings), under an instance ceiling of 200 (Admin's InstancePreference, P8; 200 until it exists) | The user's call (impl-insights answer 1, design-insights §17 Q5) |
| Nov 7, 2026 | The framework seeds design §1.1's `ADMIN_*` permissions, each granted to `ADMIN`, beside `ADMIN_PASSWORD` and `ADMIN_CONSTITUTION_GLOBAL` (`ADMIN_LOGIN_AS` is `ADMIN_ADV`'s); BossSetupData grants them to the groups of design §1.1 | The plan's choice: framework `org.moqui.admin` services check most of them, the family is the framework's, and the framework may not depend on BOSS data; design §1.1 changed |
| Nov 7, 2026 | The §14 registries are seed records in the layer that reads them: BOSS `ironstone.admin` ReadinessProvider, RefreshOperation, SettingsEntry and LifecycleParticipant; framework records for the capability registry, connection adapters, recovery descriptors, transfer targets and device route groups. Each owner seeds its own rows; a row naming a missing service or permission is logged by name when read and left out. The BOSS records are mr-boss's first entities, in an entity file Admin P2 creates and Insights P4 extends | The plan's choice under design §14's "trusted component definitions, validated at load"; F32 (Practices-App-Dev allows BOSS entities as rare) |
| Nov 7, 2026 | A grant proposal (invitation, staff account, SSO role map) is a list of registered bundles BOSS supplies; Mantle validates each through the capability registry and names no BOSS group; BOSS always includes `BOSS_USERS` for an internal user | F11; design §4.1's "The BOSS users group" |
| Nov 7, 2026 | Admin's lifecycle coordinator is built in P6 for Admin's own operations (disable, organization removal, restoration), with LifecycleOperations and LifecycleDetail moved from A2 into it | The plan's choice: design §17.3 put the coordinator in A1 and its screens in A2; without People's entry the screens are the coordinator's only view beyond UserDetail. Design §17.3 changed |
| Nov 7, 2026 | Shared/DataImport replaces Shared/ProductImport: one definition, Products' route kept as its mount | Design §11.1 (review Z2); F12 |
| Nov 7, 2026 | Owner-wizard targets without a run record (Commons' contacts, Projects' work items) are registered with a link and no runs | F13; a run record is their owners' later work (§7); design §11.1 changed |
| Nov 7, 2026 | `BOSS_ADMIN_PRIVACY` is created in P1 with no permissions, so Customer Service's Privacy team can hold it; PrivacyServices and its permissions stay later | Design §1.1 and §17.3; impl-customer-service F80 |
| Nov 7, 2026 | Admin P3 fills Insights' capability rows, beside the other built apps', for the groups Insights P1 creates | The plan's choice (the plan review): the registry is Admin P3's and BossSetupData fills it from crosscut §1.4; Insights P1 runs before it |
| Nov 7, 2026 | `store#OrganizationMembership` is built in P4 rather than P7 | The plan's choice (the plan review): `create#StaffAccount` (P4) and `accept#Invitation` (P5) each write a membership |
| Nov 7, 2026 | DeviceServices checks `ADMIN_ACCESS_VIEW` and `ADMIN_ACCESS_MANAGE`; no device permission is added | The plan's choice (the plan review): design §2 makes the access administrator the registrar, and §1.1 names no device permission |
| Nov 7, 2026 | P6 adds an owner change to the framework's drives and shared mail accounts and to Mantle's calendars and contact books, each the owner's service | F31: the lifecycle participants need them, and only Projects' reassign services exist |
| Nov 7, 2026 | `BOSS_ADMIN_ADMIN` holds every Admin group's permission but `ADMIN_IDENTITY_GLOBAL` and `ADMIN_BACKUP_DOWNLOAD`, which the identity and backup operators "additionally need", and `ADMIN_CONSTITUTION_GLOBAL`; those stay `ADMIN`'s, granted only by a holder | P1's reading of design §1.1's "all Admin permissions above"; design §1.1 changed |
| Nov 7, 2026 | Opening Admin needs the root grant alone, no permission: the root opens navigation (design §1.1) and each read checks its own, so `BOSS_ADMIN_PRIVACY`'s members open it with nothing to read yet | P1; unlike Commerce, whose reader needs `COMMERCE_VIEW` |
| Nov 7, 2026 | P1's areas: Home every Admin user's; Operations (Monitoring) the reader's, operations operator's and administrator's; Agents and Developer tools the administrator's (AgentsHome and DeveloperHome then check AgentAdmin and each tool's own grant); System Tools' own grant's (`ADMIN`). A later phase opening an area to another group adds its row | P1 |
| Nov 7, 2026 | Customer Service's Privacy team holds `BOSS_ADMIN_PRIVACY` through its member (customerservice.admin in the demo); the queue stays restricted to its team, Mantle naming no BOSS group | P1, impl-customer-service F80 |
| Nov 7, 2026 | The registries' rows are in BossSetupData (seed-initial), each owner's in a block of its own, Accounting's too: BossAccountingSetupData is demo data | P2 |
| Nov 7, 2026 | A registration's permission is read as the owners read theirs (ProductAccess `has`, `ADMIN` holding all); Commerce's store readiness needs `ADMIN_OVERVIEW_VIEW` and answers a Commerce reader the findings, an administrative reader Commerce's summary | P2, F48, F49; design §10 changed |
| Nov 7, 2026 | A settings entry or fix link shows when its destination screen path opens to the viewer's own groups, decided as authz.rs decides a path, and its view permission holds; the index links readiness into Health rather than calling providers per entry | P2; design §7 changed |
| Nov 7, 2026 | Home's Needs attention is the worst ten non-ready checks of every readable provider; Setup checks are Admin's own first-run checks | P2 |
| Nov 7, 2026 | `request#Refresh` passes its operation key to the owner's service, whose retry answers it; BOSS keeps no refresh record | P2, F50 |
| Nov 7, 2026 | The administration path is counted through `ADMIN` alone: a date-valid member who can sign in as login decides | P3, F41, F55; design §1.1 changed |
| Nov 7, 2026 | AccessServices answer a delegation, revision or path refusal as a reason (`applied` false, `reasonCode`, `reason`), never written; a missing permission or a malformed request is an error | P3; design §1.1's "a refusal is shown as a reason" |
| Nov 7, 2026 | A group's grant change is previewed and applied as one change at the previewed grant revision, refused whole when any part is refused, not as a batch of independent items | P3: a partial grant set would leave a group neither as it was nor as previewed |
| Nov 7, 2026 | The registry's rows are each built app's groups with the permissions they hold (kind by name: view, export, sensitive for costs, supplier prices, pay and credit, else edit) and each root user group's launcher binding; unbuilt apps' groups, `BOSS_PROJECT_CLIENT` and service teams are left out; the privileged groups are registered and still refused to non-members | P3; crosscut §1.4 |
| Nov 7, 2026 | `store#Membership` takes registered bundles and custom groups only; `end#Membership` ends any group's (a privileged one by its members), so `ADMIN`'s last path is guarded | P3 |
| Nov 7, 2026 | The Access area opens to the access administrator and the administrator; the reader holds no `ADMIN_ACCESS_VIEW` | P3, F61; design §2 |
| Nov 7, 2026 | GroupDetail lists and changes only the members who work for the organizations the administrator administers, counting the others; the framework services know no organization | P3; design §1.1 |
| Nov 7, 2026 | A group default's key is a `UserPreferenceKey` Enumeration, typed by its `optionValue` (indicator, boolean, number, text) | P3; design §5 GroupPreferences |
| Nov 7, 2026 | Mantle's identity scope is the internal organizations the caller's party works for (the active one when set), every one for `ADMIN`; an identity is readable when one of its organizations is in scope, others counted, never named | P4, F65; Admin's own context keeps the administrator's unrestricted scope |
| Nov 7, 2026 | An account-wide change (account fields, a factor or lock reset, revoking sessions or credentials) of an identity that also works for an organization outside the caller's scope needs `ADMIN_IDENTITY_GLOBAL`; a password reset request, which changes nothing until its owner acts, is sent for any identity in scope | P4, F66, F72; design §4.1 changed |
| Nov 7, 2026 | UserDetail's Account saves through Mantle `store#Account` (its fields only, scope, revision, the administration path); enabling, disabling and the end date are the lifecycle's | P4, F68; design §4 UserDetail and §17.2 changed |
| Nov 7, 2026 | A grant proposal is checked and applied by the framework's `AccessServices.check#GrantProposal` and `apply#GrantProposal`, by `store#Membership`'s delegation rules for the actor, for an access administrator or an identity operator | P4, §4's grant proposal row, F73; design §17.2 changed |
| Nov 7, 2026 | The Users area opens to the identity operator and the administrator; group memberships on UserDetail change only for an `ADMIN_ACCESS_MANAGE` holder | P4, F74 |
| Nov 7, 2026 | The session refresh, the notification socket's check and job runs stop an account disabled for good or past its end date, not a tarpit lock | P4, F71 |
| Nov 7, 2026 | Administrative actions on an account (a factor or lock reset, account fields, revoking sessions and credentials) may require permissions like the System app's (`ADMIN_IDENTITY_GLOBAL` for a shared identity, F66, F72): they are there for convenience, not as the permission boundary | The user's call (Nov 7, on P4's review) |
| Nov 7, 2026 | Who sees user records follows the existing authorization patterns: the screens' authz, then the active and available organization entity filters (`MANTLE_ACTIVE_ORG`, `MANTLE_USER_ORG`) applied through a view entity joining the account to its organizations. An `ADMIN` member sees every user with no active organization and only that internal organization's users with one active; other users the same pattern with more restriction. Mantle's identity scope is that filtered find, not a separate scope computation | The user's call (Nov 7), resolving F65; reworked in the P4 follow-up |
| Nov 7, 2026 | A record with no organization filter of its own (Chatter notes on UserAccount or UserGroup, F75) is found through a view entity that joins back to the organization, so the entity filters apply; this is the general pattern for such records | The user's call (Nov 7); replaces review R3's permission check in the P4 follow-up |
| Nov 7, 2026 | Relating staff of another organization to one's own needs `ADMIN_IDENTITY_GLOBAL` (ADMIN's by default) | The user's call (Nov 7), F78 |
| Nov 7, 2026 | F64 stays as design §1.1 reads: the registered unsealed Admin bundles are assignable by an access administrator (and through grant proposals, F73) | The user's call (Nov 7): noted |
| Nov 7, 2026 | The acceptance link of an invitation the instance cannot mail is made at the render that shows it (`reveal#InvitationLink`, once, to its issuer, within fifteen minutes), so no session or row holds it | P5, F85 |
| Nov 7, 2026 | The `i` route lets every well-formed token through and AcceptInvitation says "This invitation is no longer valid" for a spent or unknown one | P5, F83 |
| Nov 7, 2026 | Acceptance rechecks the inviter's authority from the records and writes the organization relationship and memberships itself, with authorization on; an invitation never carries a privileged group or a group granting a sealed permission | P5, F82; design §4.1 changed |
| Nov 7, 2026 | When a bundle's group requires a factor and the account has none, the acceptance makes an authenticator factor its holder confirms within a day | P5, F89; design §4 AcceptInvitation changed |
| Nov 7, 2026 | An owner of a resource a user can own answers the framework's owned-resource contract (`org.moqui.admin.IdentityServices.define#OwnedResourceLookup`, `Transfer`, `Pause`); Mantle's lifecycle calls only a service carrying the contract's parameters, and BOSS's `transfer#OwnedResource` checks a step against its participant's registration | P6, F91; design §14 and §17.2 changed |
| Nov 7, 2026 | The owner changes are their owners': `FileServices.transfer#DriveOwner`, `EmailClientServices.transfer#EmailAccountOwner`, `CalendarServices.transfer#CalendarOwner`, `ContactBookServices.transfer#ContactBookOwner`, each by the owner or with its own permission (`DRIVE_OWNER_CHANGE`, `EMAIL_ACCOUNT_OWNER_CHANGE`, `CALENDAR_OWNER_CHANGE`, `CONTACT_BOOK_OWNER_CHANGE`, granted to `ADMIN`, and by BossSetupData to the identity operator and the administrator), the new owner checked by the owner; personal drives, mail accounts, calendars and contact books stay with their user | P6, F31, F93, F95; drawers-commons changed |
| Nov 7, 2026 | A lifecycle operation carries the organization it was requested for (the one removed, or the target's organization in the requester's scope), and the organization entity filters apply to it | P6, the user's pattern of Nov 7; F96 |
| Nov 7, 2026 | A disable revokes access first, in its own transaction, then disables for good (no `disabledDateTime`); a future date writes `terminateDate` alone; a removal ends memberships (and signs out) only when no organization is left, and only then do owned resources move; a restore brings nothing revoked back | P6, F92, F100; design §4.1 changed |
| Nov 7, 2026 | LifecycleActions open a review on UserDetail (`previewKind`) rather than computing previews at every render; Users' bulk disable reviews each identity the same way | P6; design §4 changed |
| Nov 7, 2026 | Internal organizations are read with `ADMIN_SETTINGS_VIEW` and changed with `ADMIN_SETTINGS_MANAGE` (design §1.1's configuration administrator), in Mantle's identity scope (the `InternalOrganization` find under the organization filters); their memberships stay the identity permissions' (`store#OrganizationMembership`) | P7 |
| Nov 7, 2026 | Creating an organization and setting its parent are Mantle services that need both organizations in scope (`create#InternalOrganization` writes the party and its parent together; a top-level organization only for a caller administering every one), so a parent never adopts an organization into the caller's scope | P7, F103 |
| Nov 7, 2026 | OrganizationDefaults are the setting types registered for OrgInternal (`PartySettingTypeRole`); Admin changes the typed ones and those Mantle validates against the organization's records, and their owners the rest | P7, F104 |
| Nov 7, 2026 | An organization's Constitution is read and changed in Admin by the organization entity filters, as identity scope: `check#OrganizationConstitutionAccess` reads for an organization in the filtered find on `InternalOrganization` (ADMIN every one with none active, the active one with one; a delegate its organizations and their children) and changes it with `ORG_CONSTITUTION_EDIT` only so; membership only for a call with no organization filter and for members' reading in the Rules pane | Follows the user's Nov 7 decision on visibility (rows above), settling F105 and F52 (P7 review) |
| Nov 7, 2026 | Organizations, OrganizationDetail and Constitution are one area group (`BOSS_ADM_ORGANIZATIONS`) for the configuration administrator and the administrator, who hold `ORG_CONSTITUTION_EDIT`; members read their organization's Constitution in the Assist drawer's Rules pane, and no read entry is built in Admin | P7, F46 |
| Nov 10, 2026 | The access and grant review lists no sealed permission in any print or export; each group's sealed grants are counted (the screens still show them, marked) | The user's call (Nov 10), F124; design §16 |
| Nov 10, 2026 | The access review names only the members who work for the reviewer's organizations and counts the others | The user's call (Nov 10), P9; as GroupDetail (P3) |
| Nov 10, 2026 | A row rule is add-only for a delegated administrator: `apply#Grants` binds a registered filter set and refuses a removal (`SCOPE_REMOVAL`), which would widen access; removing one stays Tools' | The user's call (Nov 10), F122; design §5 RowRules |
| Nov 10, 2026 | Ending a launcher binding that was scoped on purpose stays within the access administrator's delegated authority, as P3 decided: the end removes the binding's own filter sets and a later grant gives the registry's | The user's call (Nov 10), F130 |
| Nov 10, 2026 | Admin never changes a remote's inbound authentication or inbound secret: a remote or gateway started in Admin receives by login only and takes no provider webhooks until an instance administrator sets its verification in Tools | The user's call (Nov 10), F147 (P11): the inbound route accepts any message type from whoever satisfies the remote's auth |
| Nov 10, 2026 | A passing test of the new endpoint alone enables a repointed connection, run by the administrator who repointed it; no second person is asked for | The user's call (Nov 10), P11; design §15.3 "Endpoint change" |
| Nov 10, 2026 | On a production instance a gateway's address must be one of its provider's hosts | The user's call (Nov 10), P11 |
| Nov 10, 2026 | MailRelays lists every EmailServer no EmailAccount owns, so on the demo `MOQUI_LOCAL` and the apps' sending servers beside SYSTEM | The user's call (Nov 10), F151 (P11); design §9 |
| Nov 10, 2026 | An organization or purpose record for relays and the other connection kinds waits (§7) | The user's call (Nov 10), F156 (P11) |
| Nov 10, 2026 | Who reads the mail queue stays as P12 built it, for now: the operations operator reads the transport outcomes of every organization's mail (EmailMessage carries no organization) and acts on them; the integration administrator reads the instance's own mail only, with no actions; a mail account's row gives id, count and state only | The user's call (Nov 10), F167, F168 (P12 and its review R3); design §9 MailQueue |
| Nov 10, 2026 | A refused (permanent) or bounced message may be sent again from the queue, as a retryable one may: left open on purpose, the operator's responsibility, for the valid uses it has. Sign-in mail is still only closed, and an owner's messages are still its owner's (P12 review R1, R2) | The user's call (Nov 10), P12 |
| Nov 10, 2026 | A person never sets a message's sent state: a stored message's status and outcome are what the transport knows. Settling an uncertain send records the settlement apart (who, when, the reason and what they concluded) and takes the message out of Needs attention; it does not mark the message Sent | The user's call (Nov 10), over P12's built `reconcile#MailOutcome`, which marked it Sent on the operator's word; changed in the P12 follow-up |
| Nov 10, 2026 | The read-only protocol settings stay listed in InstanceSettings' sources, for now; to be reviewed | The user's call (Nov 10), F174 (P12) |
| Nov 11, 2026 | Admin's backup request is bounded (30 minutes after the last run or request, three requests a day): a BOSS rule for its delegated backup operator. System and Tools generally carry no restriction of this kind for the instance administrator | The user's call (Nov 11), P16; design §11 Backups |
| Nov 11, 2026 | Admin's export bounds stand (5,000 rows and 2 MiB by default, at most 50,000 rows and 16 MiB). Larger volumes are not a BOSS export: in the BOSS apps that is "contact a system administrator", who has the tools for volume (Tools' ETL, snapshots and data export, and for some a direct database connection) | The user's call (Nov 11), F246 (P16); design §11 DataExport |
| Nov 11, 2026 | In BOSS the data operator exports only a contact book they may themselves view: an export target adds no right to read | The user's call (Nov 11), confirming F249 (P16) |
| Nov 11, 2026 | The access log dataset's artifact is granted to no group: `ironstone.admin.AuditServices.get#AccessLog` checks `ADMIN_AUDIT_VIEW` and reads the one dataset itself, under both row filters, so a line is never read whole through the engine (a dataset has no field list, and a holder with an Insights group read recipient addresses and setting values). The audit reader therefore cannot chart the access log in Insights | P17 review, F272; over the plan's and design §12's grant to `BOSS_ADMIN_AUDIT`; design §12 changed |
| Nov 11, 2026 | An app's own import target names an import permission of that app (`PEOPLE_IMPORT`, `MAINTENANCE_IMPORT`, `SALES_IMPORT`, `MARKETING_AUDIENCE_IMPORT`) beside the app's edit permission, and no `ADMIN_*` permission. Admin's Imports lists such a run for a data operator who also holds the app's view permission | The user's call (Nov 11; impl-sales §4, and §4 of impl-people, impl-maintenance and impl-marketing). A rows-mode target requires every permission it lists (framework service/org/moqui/admin/DataTransferImports.js:37-41, DataTransferBatch.js:82), so `ADMIN_TRANSFER_RUN` beside them, as staff invitations have, would shut the app's own users out of their import; a wizard-mode target's permission is checked by its owner's wizard services. Design §11.1 |
| Nov 11, 2026 | The generic screens of Admin are the framework's System screens, which Admin mounts by location, wraps, or builds its own screens around; the readiness, refresh and settings registries are framework records and `org.moqui.admin.ReadinessServices`, with `check#OwnerReadiness` and its organization scope kept here; the Developer tools area is removed | The user's call (Nov 11). It reverses the Nov 7 row on the §14 registries for these three (LifecycleParticipant stays a BOSS record); §9; mr-moqui `plans/archive/Admin-Screens-Down.md`; design §1.4, §13, §14 and §18 changed |
| Nov 12, 2026 | Owner contract built by impl-maintenance P3 (F46, F56): Maintenance registers its lifecycle participant `maintenance.assignments` (a leaver's open work orders and the equipment they hold, counts under ADMIN_IDENTITY_VIEW, moved through Mantle's schedule#MaintenanceWorkOrder and change#MaintenanceCustody, which check the caller's maintenance permissions), and Projects' participant (Lifecycle.js `openAssignments`) leaves managed work out, since the generic services it reassigns through refuse it. AdminLifecycle passes unchanged |
| Nov 12, 2026 | Owner contract built by impl-maintenance P19 (F53, F117): Maintenance's list exports are `wizard` export targets in their owner's place, `maintenanceWorkOrderList` and `maintenanceBookingList`, with the `mountRoutes` keys `maintenanceWorkOrders` and `maintenanceBookingRequests` in Admin.js; nothing dispatched; the PM list's joins with Maintenance's DueMaintenance (its P14) | design-admin's header |

## 5. Open questions

| Question | Decides | Notes |
| --- | --- | --- |
| Further issues discovered during implementation | the affected phase | Record findings and decisions here; the open questions of the plan as written (Q1–Q5) were answered on Nov 7 and are in §4 |
| Should a contact's birthday and notes, or any registered export field, need a permission of its own? Built: none; they are off unless asked for | a later review of exports | P16, F241; left open by the user on Nov 11 |
| Should Accounting's and Projects' exports become services Admin dispatches, rather than links to their owners' places? | a later review of exports, with their owners | P16, F240; left open by the user on Nov 11 |
| Is a stored export download with an expiry wanted at all? Built: the file is only ever the response, and the record is kept 366 days | a later review of exports | P16, F247; left open by the user on Nov 11 |
| Does the framework keep its message-translations import and export targets? | a later review of the transfer family | P15 F232, P16; left open by the user on Nov 11 |
| Should Backup now wait for the scheduler (the job resumed first) rather than run the job directly? | a later review of backups | P16, F242 and its review; left open by the user on Nov 11 |

## 6. Findings

Design assumptions found wrong or unstated in the code, with the resolution. Where a resolution changes the design, it
is written there too. F1–F30 were found on Nov 7, 2026, while writing this plan, F31–F33 in its review the same
day, F34–F40 in P1, F41–F46 in P0's remaining checks, F47–F54 in P2, F55–F64 in P3 and the provisional F65–F76 in P4 (Nov 7; numbered by the lead, in P4's Built note); P6's provisional F91 to F101 are in its Built note, P7's F103 to F109 and P8's F110 to F118 (Nov 10) in theirs. P9's F119 to F131 (Nov 10, 2026) are in its Built and Review notes. P10's F132 to F145 (Nov 10, 2026) are in its Built and Review notes. P11's F146 to F160 (Nov 10, 2026) are in its Built and Review notes. P12's F161 to F176 (Nov 10, 2026) are in its Built and Review notes. F177 to F182 are in P12's Follow-up note and F199 to F203 in its second (a settlement cleared when a send begins). P13's F183 to F198 (Nov 10, 2026) are in its Built and Review notes. P14's F204 to F219 (Nov 10, 2026) are in its Built and Review notes. P15's F220 to F239 (Nov 11, 2026) are in its Built and Review notes. P16's F240 to F256 (Nov 11, 2026) are in its Built and Review notes. P17's F257 to F271 (Nov 11, 2026) are in its Built and Review notes. P18's F278 to F291 (Nov 11, 2026) are in its Built and Review notes. P19's F292 to F296 (Nov 11, 2026) are in its Built and Review notes.

| # | Finding | Resolution |
| --- | --- | --- |
| F1 | P0: `screen/Admin/` has six flat placeholders (Home; Users; Organizations; Integrations; Data; Settings), the root mounts only Chatter and RecordFiles and has no `<shell-providers>`. Its comment says the grant is commented out; in fact `BOSS_ADMIN` (BossSetupData.xml:254-261) gives `ADMIN` and `BOSS_ADMIN_ADMIN` `AUTHZT_ALWAYS` on the root. There is no root user group or other Admin group | P1 |
| F2 | P0: Tools System is guarded only by `SYSTEM_APP` (ToolsSecurityData.xml:32-36: `System.xml`, inheritable, `AUTHZT_ALWAYS` for `ADMIN`); an inheritable `AUTHZT_ALWAYS` on a parent skips the child's check (authz.rs:450-456), so mounted under the Admin root it would open to `BOSS_ADMIN_ADMIN` | P1 keeps the mount `ADMIN`-only (P0 settles how); design §13 changed |
| F3 | P0: UserServices' key, token, app-password, device-key and SSH-key services (Rust, user_keys.rs:89) act only on the caller; nothing revokes another user's credentials or all of a user's access at once | P4's `revoke#AccountAccess` (framework); design §4 UserDetail's AccessCredentials row changed |
| F4 | P0: no service lists or ends another user's sessions; `end#UserVisit` (UserServices.xml:29, session.rs:558-631) ends only the caller's other visits; the per-request session refresh (session.rs:1571-1619) checks only `hasLoggedOut`, so `disable#UserAccount` leaves live web sessions working | P4: `find#`/`revoke#Sessions` and the refresh checking `disabled` and `terminateDate` |
| F5 | P0: a component's `user-facade` `authz` replaces the framework's attribute (conf.rs:316, node/mod.rs:493-505); the framework lists (MoquiDefaultConf.xml:834-835) now also seal `COMPONENT_DEPLOY`, `DATABASE_ADMIN`, `DATABASE_EXTERNAL` and `ADMIN_CONSTITUTION_GLOBAL`, which design §1.1 does not list; `ADMIN_CONSTITUTION_GLOBAL` is already the framework's | §4: components add to the lists by elements (P1); the framework seals `ADMIN_IDENTITY_GLOBAL`, `ADMIN_ACCESS_MANAGE` and `ADMIN_BACKUP_DOWNLOAD` beside its own, and mr-boss adds only its three privileged groups; design §1.1 changed |
| F6 | P0: login honors `terminateDate` (login.rs:1351, from the password and login-key paths), `ipAllowed` (:1286) and `requireAuthcFactor` (factor.rs:63); notifications check `terminateDate` (notify/message.rs:491) | P6 writes a future end date as designed; P4 adds the session-refresh check (F4) |
| F7 | P0: there is no `i` token route; `i` is not a reserved name (token_route.rs:107-110); the token service gets `token` and `routeName` and returns `valid` and `routeContext` (:186-205); a token is 8-128 characters of `[A-Za-z0-9_-]` (:156); mr-boss has `s`, `u`, `cal` and `r` | P5 |
| F8 | P0: Enumeration `EMT_ACCOUNT_INVITE` is seeded (BasicEntities.xml:679), with no EmailTemplate | P5 seeds it in mr-mantle |
| F9 | P0: `backup_EmbeddedDatabase_daily` is seeded paused and its `EmbeddedDbBackup` remote has no `sendUrl` (MoquiSetupData.xml:73-89) | P2's backup check warns of both on a fresh instance |
| F10 | P0: `PaymentGatewayOrganization` (AccountingControlEntities.xml:217; organization, gateway, dates, enabled, audit-logged) has no production writer: it is read by SetupServices, PaymentServices, StoreAdminServices, ShopCheckout.js and Portal.js and written only by BOSS demo code and Mantle tests | P11's `store#PaymentGatewayOrganization` |
| F11 | P0: there is no `mantle.party.IdentityServices`, `UserInvitation` or `UserLifecycleOperation`; `PartyServices.create#PartyUserAccount` (:797) takes one `userGroupId` (and `groupTypeEnumIdList`); Mantle cannot name `BOSS_USERS` | P4–P6; §4's grant proposal |
| F12 | P0: Shared/ProductImport (560 lines, mounted only by Products/ProductImport) is catalog-specific throughout (its always-actions require `CatalogServices.get#SharedContext`; `ImportServices` and `get#CatalogOptions`; its labels); Mantle's `ProductCatalogImportKind` is already a kind registry (permission, validator, store, columns, key fields) and ProductCatalogOperation and its items the run records | P15 takes Shared/DataImport's context and steps from the target registration; Products' kinds stay its own |
| F13 | P0: Commons' contact import keeps per-user drafts in `dbresource://ironstone/ContactImport/{userId}/{importId}/` and no run record (Contacts/Import.xml); Projects' work-item import is P0's to check | §4: registered with a link and no runs; a run record later (§7) |
| F14 | P0: adding `admin` and `insights` to the client deny pattern (BOSS_PROJECTS_INTERNAL's ten AT_SERVICE rows, BossSetupData.xml:437-456) takes rows 441 (253 characters) and 443 (243) past 255; ProjectsAccess.spec.js:625-667 fails on any `ironstone.admin` or `ironstone.insights` write verb the pattern does not deny | P1 splits the two rows and adds both packages |
| F15 | P0: UserLoginHistory (SecurityEntities.xml:469) has no device field; a new-device check joins Visit's `initialUserAgent` and `clientIpAddress` | P10 |
| F16 | P0: design §10 and §14.2 name Accounting's provider `check#Readiness`; built are `SetupServices.get#Readiness` (finance readers: findings and setupStatus) and `check#Readiness` (the activation rows, for setup); Products' checks are `CatalogCheckServices.validate#Catalog` with `get#CatalogChecks` for its options | P2 registers `get#Readiness` and `validate#Catalog`; design §10 and §14.2 changed |
| F17 | P0: Commons Account lists "Where you are signed in" from Visit rows (Account.xml:178-207, 406-414) with no sign-out | P4 (owner contract) |
| F18 | P0: `test#EmailServer` (EmailServices.xml:65), `print#Document` (PrintServices.xml:49), `read#Spreadsheet` (SpreadsheetServices.xml:20) exist; NetworkPrinter is in `moqui.basic.print`; EmailAccount has `ownsEmailServer` (BasicEntities.xml:869) | P11, P15 as designed |
| F19 | P0: `AgentToolExposure` and `AgentAdminServices.store#AgentToolExposure`, `get#EffectiveConfig` and `get#DashboardTotals` exist; the agent editor, A2A tasks and gateway key screens do not | P1's AgentsHome shows them unavailable; ADM-AGENTS is the framework's (§7) |
| F20 | P0: the Constitution's runtime, `org.moqui.admin.ConstitutionServices`, Mantle's `get#`/`store#`/`reset#OrganizationConstitution` (`ORG_CONSTITUTION_EDIT`) and System › Constitution with `ConstitutionParts.xml` were built Nov 7; an organization's JSON is in the resource its PartyContent's `contentLocation` names, not `description` as design §7's storage paragraph says | P7 builds only the Admin screen; design §7 changed |
| F21 | P0: the built Settings areas match design §14.2's paths, each with its own landing (Customer Service's and Purchasing's `SettingsHome`, Products', Warehouse's and Projects' `Index`, Accounting's `Settings`), apart from Manufacturing's `ProductionSettings`, which the row does not list, and Comms, which has no Settings area (P0) | P2 seeds each area's landing; design §14.2's Manufacturing row changed |
| F22 | P0: no Tools Maps configuration screen exists (the framework Maps plan is not built) | CX-MAPS's settings entry waits for it (§7) |
| F23 | P0: UserGroupMember, UserGroupPermission and ArtifactAuthz have no `enable-audit-log` field (SecurityEntities.xml); UserAccount already audits `username`, `userFullName`, `disabled`, `terminateDate` and `emailAddress`, and UserGroup nothing | P3 adds the audit log on their key fields and UserGroup's flags, P4 on UserAccount's `ipAllowed` and `requirePasswordChange` |
| F24 | P0: ADMIN_LOGIN_AS is used by Tools' UserAccountDetail, the one login-as path | P4 reuses it |
| F25 | P0: NotificationTopic has the delivery fields design §10 names; `ReportAlert` is seeded private in Updates (ReportSetupData.xml:5) | P14 as designed |
| F26 | P0: Monitor's `get#SourceStatus` and `list#Incidents` exist (MonitorServices.xml:3, :50); ClusterMember has `heartbeat` (ServerEntities.xml:100) | P1, P2 as designed |
| F27 | P0: Commerce left Admin its readiness registration, `retry#StoreMessages` as a recovery action and ChannelImport as an import target (impl-commerce §7, F23) | P2, P13, P15 |
| F28 | P0: Customer Service's Privacy queue is restricted to its team because `BOSS_ADMIN_PRIVACY` did not exist (impl-customer-service F80); its privacy provider waits for PrivacyServices (F211) | P1 creates the group (§4); the provider stays later (§7) |
| F29 | P0: no People, Sales, Marketing or Maintenance service the design names exists (`hire#Employee`, `apply#EmploymentChange`, `get#SalesReadiness`, `check#MaintenanceReadiness`, the import previews); their screens are placeholders | §4, §7 |
| F30 | P0: the regression budgets are the framework's 12 s server and 6 s client, the tools component's 3 s, mr-boss's 264 s and 57 s, mr-mantle's 393 s | §4: raised per phase |
| F31 | P0 (review): no service changes the owner of a drive (`FileServices.update#Drive` has no owner; only `add#`/`remove#DriveMember`), a shared mail account (`EmailClientServices.update#EmailAccount`), a calendar (`mantle.work.CalendarServices.update#Calendar`) or a contact book's owning user (`ContactBookServices.update#ContactBook` takes only `ownerPartyId`); Projects' assignments move through `TaskServices.reassign#Task`, `WorkItemServices.bulk#WorkItems` and `RequestServices.reassign#Request` | P6 adds an owner change to each owner (§4) |
| F32 | P0 (review): mr-boss defines no entities and has no `entity/` directory; Practices-App-Dev.md:36 says BOSS entities are rare, the data model being Mantle's | §4: the BOSS registries are its first entity file (Admin P2) |
| F33 | P0 (review): organization scope needs a party: `setup#UserOrganizationInfo` returns early with no `partyId` (PartyServices.xml:533-534), and `get#PartyInternalOrgIds` (:563-603) counts only PrtAgent, PrtEmployee and PrtMember relationships to OrgInternal parties, which `MANTLE_USER_ORG` uses | P18's display account has a party and a membership |
| F34 | P1 (P0's F2 check): an inheritable `AUTHZT_ALLOW` on the Admin root also opens a child with no grant of its own (authz.rs's last-frame fallback); System cannot be mounted outside the root's path | Done in P1: the administrator's root grant is ALLOW and `BOSS_ADM_SYSTEM` denies `System.xml` to `BOSS_ADMIN` and `BOSS_ADMIN_ADMIN`; a group an installation allows on the root needs the same deny; three Tools links made relative |
| F35 | P1: `ec.artifactExecution.isPermitted` answers from the top of the stack and records a failure per refusal, so it cannot tell whether a user may open a Tools screen; the root's inheritable grant reaches the services an Admin screen calls | Admin.js reads the user's own grants (ArtifactAuthzCheckView), as Commerce.js; landings call only services that check their own grant |
| F36 | P1: Projects' Settings › Index linked the removed Users placeholder | Links Admin Home; done in P4: it links `Admin/Users/Users` |
| F37 | P1: on a Debug binary ProjectsAccess fails four client features with "Maximum call stack size exceeded" (the fixed script stack budget against larger debug frames); 8 of 8 pass on a release binary | Framework's (Debug stack budget); open |
| F38 | P1: moqui-core's `the_wrapped_ec_takes_probes_and_leaves_the_framework_the_real_one` fails at e3360436 without P1 | Framework's; open |
| F39 | P1: with `Admin.xml` as a spec's render root, `//Admin/...` links render disabled | Specs check labels, as every app's `page` helper |
| F40 | P1: ORG_ZIZI_RETAIL's child organization `BOSS_WH_RETURNS` is in a Retail administrator's scope (`get#PartyInternalOrgIds`) | Accepted, as `MANTLE_USER_ORG` filters |
| F41 | P0: the login rules a path must meet: permanent disable (a tarpit lock with `disabledDateTime` expires, login.rs:1389-1398), `terminateDate` (:1400), `ipAllowed` of the account or any date-valid group (:1284-1310), a required factor with none in date never completes (factor.rs:47-67, 284-317); `requirePasswordChange` does not block (:1168-1180); only live cluster peers get invalidations (cluster/mod.rs:87-95), so a stale member can only over-grant | P3's `check#AdministrationPath`: at least one account, after the change, not permanently disabled, unterminated, with a password or an enabled linked provider, a date-valid membership in `ADMIN` or a group with ALWAYS on the Admin root, a date-valid factor where any group requires one, and an `ipAllowed` admitting the acting administrator's address; counted from the database with authorization off; nothing cluster-specific (P4's refresh covers a stale member) |
| F42 | P0: `end_user_visit` (session.rs:558-676) ends the Visit and HttpSession and publishes session-end; the notification socket rechecks every 60 s (notws.rs:425-433) and closes, ending RTC and collab; termws rechecks; Assist SSE only at connect. Not reached: XMPP (app passwords, rechecked per tick), SIP devices (`dropDevice`), notws login keys, a ServiceJob's user (jobs.rs:796-800 warns and runs), agent runs and triggers running as the user; notws's check ignores `disabled` (:357-375) | P4's `revoke#AccountAccess` ends every visit and session, revokes app passwords, login keys and device keys, drops SIP devices, pauses triggers and agents run as the user; `run_job` refuses a user failing the login gate; the session refresh and notws's tick check `disabled` and `terminateDate` |
| F43 | P0: Projects' work-item and time imports keep per-user drafts and no run record (WorkItemImportServices.xml:17-18, async); exporters: Commons `ironstone.commons.ContactServices.export#ContactFile` over `export#Contacts`, `mantle.other.TaxServices.export#Statement`, InvoiceBatch's `exportInvoices`; no work-item or ledger export service (form CSV buttons only) | P15 registers the imports with a link and no runs (F13); P16 registers Commons, the tax statement and the invoice batch as exporters; a work-item CSV and a ledger export service are their owners' later work (§7) |
| F44 | P0: F21 corrected: Comms mounts basic-comms' Settings (Comms.xml:39), all personal, which §14.2 leaves out; no screen edits shared EmailTemplates, there is no sending profile, suppressions are only Consent's CSV, and mail-account status is per user (`get#MailAccountList`) | P2's Comms row opens Comms › Consent; shared templates, sending profiles, suppressions and a shared-account readiness provider are Comms' later work (§7); design §14.2 changed |
| F45 | P0: `moqui.job.runs` carries only the outcome (jobs.rs:900-905); job root spans keep `moqui.job.name` and error status (sdk.rs:733-740, jobs.rs:788-790); nothing signals a late run. `moqui.report.audit` is written for exports and definition deletes only (lib.rs:124, definitions.rs:641); `otel_logs` keeps 7 days (telemetry/maintenance.rs:32) | P14's template groups job root spans by name for failing runs; late waits for a framework lag signal (§7). P17 adds the denied and purpose fields and a longer retention or an audit index for the access log |
| F46 | P0: screen authorization is checked on a path's last screen only, an ancestor's deny blocking (render.rs:1495-1507); the Assist drawer's Rules pane serves every signed-in user their organization's Constitution (assist.xml `constitution`, `get#Constitution` checking read access) | P2 grants `BOSS_USERS` a non-inheritable ALLOW on SettingsHome alone; members read the Constitution through the Rules pane, linked from OrganizationDetail; P7's Admin › Constitution is for its editors; design §7 and §13 changed when P2 and P7 build them |
| F47 | P2: the root's always-actions run under the root's frame before the target's grant applies, so a non-inheritable grant on SettingsHome does not reach the root's `get#SharedContext` call, nor SettingsHome's own service calls and entity options | Done in P2: the SettingsHome grant names `get#SharedContext` and `find#Settings`, and SettingsHome takes its options from `find#Settings` |
| F48 | P2: `check#StoreReadiness` needs `COMMERCE_VIEW`; its anonymous shape answers each check by name and readiness, without messages | The adapter gives a Commerce reader the findings and an Admin reader that summary for the stores of organizations it administers; no Commerce change |
| F49 | P2: `ADMIN` holds no `ACCOUNTING_VIEW` or `PRODUCT_CATALOG_VIEW` row; the owners read theirs through ProductAccess `has`, which counts `ADMIN` | The registries read registration permissions the same way (none sealed); the owner's service checks again |
| F50 | P2: no refresh operation exists to register yet; BOSS keeps no refresh record | Insights P3 registers `index#BusinessDataset`; `operationKey` passes to the owner's service |
| F51 | P2: no Tools screen edits EmailServer, EmailTemplate or NotificationTopic, or shows ClusterMember | Fix links open Tools' entity grid (ADMIN's) until P11 and P14; the cluster check links Monitoring |
| F52 | P2: `get#OrganizationConstitution` refuses a reader who is neither member nor editor | The organization Constitution check lists the viewer's own organizations; settled in the P7 review: Mantle reads for the organizations the call's organization filters find (§4) |
| F53 | P2: `get#Readiness` and `request#Refresh` are authorized for Admin users only (the `ironstone\.admin\..*` pattern), and organization-scoped checks cover no organization for a user without the Admin root (review) | Insights P3 and P10 grant their groups the two services and pass or scope the viewer's organizations |
| F54 | P2: the acceptance AdminFoundationWalk does not walk Settings | AdminRegistriesWalk walks the index; left unchanged |
| F55 | P3: F41's "a group with ALWAYS on the Admin root" cannot be named by the framework, and after F34 no BOSS group holds ALWAYS there | `check#AdministrationPath` counts `ADMIN` members only; BOSS administrators may lock the BOSS groups out of Admin, which `ADMIN` repairs in Tools (review: agreed) |
| F56 | P3: the sealed-permission and privileged-group EECAs skip writes made with authorization disabled | AccessServices write with authorization on, through an inheritable `ALL_USERS` ALLOW on its ten services, each checking VIEW or MANAGE first, none remote (review: no wider reach) |
| F57 | P3: a group granting a sealed permission is not privileged, so a membership in it passed the sealed grant on through Tools or a direct entity write | Done in review (R1): the framework EECA `UserGroupMemberSealed` needs a holder of each sealed permission the group grants; ending a membership sooner passes. The binary and `Security.eecas.xml` ship together |
| F58 | P3: UserGroup has no purpose field | Purposes are `UserGroupType` enumerations with `optionIndicator` Y |
| F59 | P3: entity writes of the security rows already move the authorization generation and send cluster invalidations | No explicit cache clear |
| F60 | P3: the audit log keeps no delete | A removed binding or group default writes an explicit audit row |
| F61 | P3: the brief named the reader for the Access area; design §1.1 and §2 give Groups to the access administrator only | The reader is left out (review: agreed) |
| F62 | P3: with the security dates audit-logged, the demo load writes about 1,500 more audit rows | Accepted; the load time to be watched in the wave suites |
| F63 | P3 (review): a privileged group's registered bundle could be granted from with `ADMIN_ACCESS_MANAGE` alone, copying its powers onto a custom group a non-member then joins | Done in review (R2): a privileged group's bundle is delegable only by a member of that group |
| F64 | P3 (review): the unsealed Admin bundles (`BOSS_ADMIN_IDENTITY`, `_CONFIGURE`, `_INTEGRATIONS`, `_OPERATIONS`, `_DATA`, `_AUDIT`, `_PRIVACY`) name no delegable permission, so any access administrator, the demo delegate included, may assign them, themselves included | §4 (the user's call, Nov 7): as design §1.1 reads |
| F65 | P4: Mantle cannot see Admin's unrestricted scope for `BOSS_ADMIN_ADMIN` (its `MANTLE_ACTIVE_ORG` root grant), so in Users the administrator sees only its own organizations' staff while Admin's context offers every organization | §4 (the user's call, Nov 7). Done in the P4 follow-up: user records by the screens' authorization and the organization entity filters through `mantle.party.UserAccountOrganization`; the administrator's `MANTLE_ACTIVE_ORG` sees every organization's staff with none active |
| F66 | P4: a factor is account-wide, so "reset the shared identity's factor only for its own relationship" cannot be literal | A password reset request works for any identity in scope; factor and lock resets, account fields and revocations of a shared identity need `ADMIN_IDENTITY_GLOBAL` |
| F67 | P4: `enable-audit-log="update"` skips a field's first value (Purchasing F57) | The newly audited fields use `true` |
| F68 | P4: `update#PartyUserAccount` takes every UserAccount field | UserDetail saves through Mantle's `store#Account` |
| F69 | P4: the framework has no impersonation indicator; Login as is audited by a log line only | Login as is Tools' guarded action, refusing a target holding privileged memberships or sealed permissions the caller lacks; an indicator and audit row are the framework's (§7) |
| F70 | P4: Tools releases a tarpit lock with an entity-auto update only `ADMIN` runs | `reset#Authentication`'s `lock` kind; a permanent disable is never lifted there |
| F71 | P4: a tarpit lock does not end live sessions (else failed logins could sign the owner out) | Only a disable for good or a past end date signs out |
| F72 | P4: ending another user's sessions is account-wide | A shared identity's sessions need `ADMIN_IDENTITY_GLOBAL` |
| F73 | P4: the framework services know no organization; grant proposals let an identity operator give a new account the unsealed Admin bundles (F64) | BOSS and Mantle check scope before every framework call; F64's choice covers identity operators too |
| F74 | P4: the Users area is the identity operator's and the administrator's; memberships on UserDetail change only with `ADMIN_ACCESS_MANAGE` | As designed |
| F75 | P4: "Log as note" notes on UserAccount and UserGroup had only entity filters, so any BOSS user with an inherited root grant could read and add them | Done in review (R3), then reworked in the P4 follow-up (§4): an account is found for its notes through `mantle.party.UserAccountOrganization` under the caller's organization filters (no one's with none named); a group, with no organization, stays `ADMIN_ACCESS_VIEW`'s |
| F76 | P4: AdminClientFixtures runs in the regular suite, adding the Retail identity "Walk Staff" | Accepted |
| F77 | P4 (review): an identity operator could change the email of an `ADMIN` or `BOSS_ADMIN_ADMIN` member in its organization and mail the reset to the new address; factor and lock resets and revocations also reached accounts holding more access than the caller | Done in review (R1): the framework's `heldBeyond` refuses a target in a privileged group the caller is not in or holding a sealed permission the caller lacks, in `revoke#AccountAccess`, another user's `revoke#Sessions`, `store#Account`, factor and lock resets and Login as |
| F78 | P4 (review): `store#OrganizationMembership` related any person to an organization in scope, pulling a site identity (no internal organization) into scope | Done in review (R2): relating a person with an account and no internal organization needs `ADMIN_IDENTITY_GLOBAL`. Done in the P4 follow-up review (§4, the user's call): relating a person whose account works for an organization outside the caller's scope (another organization's staff) needs `ADMIN_IDENTITY_GLOBAL` too |
| F79 | Wave 4: Admin P3's audit log made an update of a security row read the stored row first, by a key built from the unconverted values, so `update#UserGroupPermission` with `fromDate: 0` failed on Postgres (SitePages); the same for any entity reading before update (optimistic lock, create-only, defaults). The loader test's empty driver could not refill the EntityAuditLog sequence | Fixed (mr-moqui 1d596b26): `write_update` converts the key first, with a cargo test; the loader test turns the audit log off as `testing::open` does |
| F80 | Wave 4: moqui-entity's `a_new_llm_or_agent_entity_is_in_the_sim_list_or_named_absent` fails on master since 07a315d4 (`moqui.agent.AgentConstitutionSnapshot` in neither list) | The framework's (Constitution work); open |
| F81 | P5: an XML `form-single` on a token-route screen posts to `/<transition>`, outside the route, because token-route dispatch sets no web base URL | AcceptInvitation's forms are qvt markup posting under `/i/<token>`; done in the framework (adm/fw1, mr-moqui 7a677993): token-route dispatch prefixes links, forms and redirects with `/<name>/<token>` (not a cached server-static template) |
| F82 | P5: the framework checks a grant proposal only as the current user, and the invitee holds no permission | Acceptance rechecks the inviter from the records and writes the relationship and memberships itself (stricter: no privileged or sealed group at all); an actor parameter on `check#GrantProposal` is a framework ask (§7) |
| F83 | P5: the token route's own failure page says "expired or not found", and a resent token matches no hash | `check#InvitationToken` passes every well-formed token and AcceptInvitation gives one message; 256-bit tokens, every transition rechecks, posts rate-limited |
| F84 | P5: request telemetry records `url.path` unredacted, so every token route's token reaches traces; the sign-in step's `returnTo` carries it into a stored session attribute | Done (adm/fw1, mr-moqui 7a677993, 65c24efc): a registered route's token is redacted to `:token` in request spans (path, query, Referer), refusal logs, Visit's initial request and referrer, browser telemetry and replay; the session keeps a sign-in step's `returnTo` (Attack-Surface) |
| F85 | P5: session attributes are stored in the database (`HttpSession.attributes`) | The no-mail link is made at the render that shows it, never held in a session |
| F86 | P5: a component skill cannot replace a framework skill of the same name | `create-user-account` stays beside `invite-staff`, which carries its terms |
| F87 | P5: XML widgets have no copy control for plain text | The link and its copy button are qvt markup |
| F88 | P5: inviting the address of a site identity or another organization's staff pulled it into the operator's scope on acceptance | Done in review (R1): `invite#User` and `resend#Invitation` need `ADMIN_IDENTITY_GLOBAL` for such an address (P4 R2, F78), rechecked at acceptance; a chosen person whose address is another account's is refused |
| F89 | P5: an account in a factor-requiring group cannot sign in without a factor (F41), and the acceptance link showed the new authenticator key to any holder for a day | Acceptance makes the factor; review (R2): only the accepting session or the account itself sees the key |
| F90 | P5: Attack-Surface's token-route table lacks the `i` row and its rate limit | Done (adm/fw1): Attack-Surface's `i` row and its rate limit |
| F91 | P6: the identity services' inheritable `ALL_USERS` ALLOW reached any service a lifecycle step named, and scripts cannot see a service's `implements` | Done in review: the framework's `call#OwnedResourceService` refuses a service without the owned-resource contract and calls it under a non-inheritable grant, so the owner service is checked as a direct call; BOSS also checks each step against its registration |
| F92 | P6: `disable#UserAccount` sets a time, making the disable an expiring lock | The lifecycle writes `disabled` through the entity facade with its audited reason |
| F93 | P6: F31's "contact book's owning user" | Read as who manages a shared book; personal books, calendars, drives and mail accounts stay with their user |
| F94 | P6: Projects' reassign services refuse an administrator without Projects authority | The assignments step fails with the reason and waits for someone who holds it |
| F95 | P6: the owner-change permissions act instance-wide on a direct call | BOSS scopes the leaver and the new owner first; the owners refuse an external, ended or disabled new owner (review: calendars and contact books too) and a retry refuses the caller as new owner |
| F96 | P6: a global operation is listed under the organization it was requested for | Accepted; nothing leaks |
| F97 | P6: bulk disable has no revision per identity | `expectedRevision` is optional |
| F98 | P6: a participant that cannot be read is shown in the review with no step recorded | Accepted |
| F99 | P6: a future-dated disable is checked against the administration path as if now; its participants' pauses run at once (none until Insights P7) | Stricter, accepted; noted for Insights P7 |
| F100 | P6: a removal that leaves no organization also signs the user out | As designed; a retry of its account steps requires the operation's organization in scope and rechecks `heldBeyond` and the administration path (review) |
| F101 | P6: Insights P7's `pause#OwnedSchedules` and `transfer#DefinitionOwner` | Must carry the owned-resource contract's parameters to register |
| F102 | Wave 5: `chat_tests::an_agent_member_gets_each_message_through_its_entry_point` failed once and passed in 14 reruns; nothing of P4 is on its path | Flaky; its assertion now prints the transaction, member row and errors (adm/fw1) |

## 7. Later

Designed, not in this build:

- **The design's later rows** (§17.3): AccessInspector and `explain#Access` (with its Assist exposure); Webhooks,
  WebhookDetail and EventSubscription over DataDocument real-time feeds; MailDomains, MailDomainDetail and
  `check#AddressClaim` for Comms; Retention and holds; PrivacyRequests, PrivacyRequestDetail, PrivacyLookup and the PASS
  Account privacy page, with the privacy providers of Customer Service (its F211), Commerce and Shop, Forum, Commons
  and Comms, and `BOSS_ADMIN_PRIVACY`'s permissions; the backup archive download, under the `ADMIN_BACKUP_DOWNLOAD`
  P1 seals.
- **What waits on People** (§4): `LifecycleServices.request#Provisioning` and `request#AccessEnd`, the tx-commit SECA on
  `hire#Employee` and `apply#EmploymentChange`, the IT checklist task's operation link; UserDetail's Employee360 link;
  the employee and time-and-attendance import targets; the payroll exchange export; People's settings row, readiness
  provider, lifecycle participant, ClockingKiosk route group and privacy provider.
  - Picked up by [impl-people.md](impl-people.md) (Nov 11, 2026): `request#Provisioning` and `request#AccessEnd`, the
    SECA and the IT checklist task's operation link, its P7; UserDetail's Employee360 link, P2; the `employees` import
    target, P7, and the time-and-attendance target, P13; the payroll exchange export, P28; the settings row, the
    readiness provider (`people.setup`) and the capability bundles, P1; the lifecycle participant, P5; the
    ClockingKiosk route group, P30 (after P18 here).
  - People's privacy provider still waits, on Admin's PrivacyServices (the design's later rows, above).
- **What waits on Sales, Marketing and Maintenance:** the opportunity, audience and equipment import targets; their
  settings rows and readiness providers; Marketing's CheckIn and Maintenance's TechnicianKiosk route groups; their
  privacy providers; Marketing's consent rules in TopicDetail's audience.
  - Sales, picked up by [impl-sales.md](impl-sales.md) (Nov 11, 2026): the `opportunities` import target, its P6; the
    settings row and the readiness provider over `get#SalesReadiness`, P2; the capability bundles, P1; the lifecycle
    participant (a leaver's accounts, opportunities and quotes), P6.
  - Marketing, picked up by [impl-marketing.md](impl-marketing.md) (Nov 11, 2026): the audience import target
    (`marketingAudience`, wizard mode), its P4; the settings row, the readiness provider (`marketing.setup`) and the
    capability bundles, P1; the lifecycle participant, P2; the CheckIn route group, P18 (after P18 here).
  - Maintenance, picked up by [impl-maintenance.md](impl-maintenance.md) (Nov 11, 2026): the `equipment` import target
    and the readiness provider (`maintenance.readiness`, on `check#MaintenanceReadiness`), its P18; the settings row
    and the capability bundles, P1; the lifecycle participant, P3. TechnicianKiosk's route group stays later (its §7).
  - Still waiting: the three privacy providers, on Admin's PrivacyServices (the design's later rows, above), and
    Marketing's consent rules in TopicDetail's audience, which no phase of impl-marketing builds.
  - A Marketing send registers no mail outcome owner, though F163 (P12) expected one: it is a delivery of the Comms
    delivery ledger, which is registered (impl-marketing §4 and its F15).
- **The framework's agent screens** (ADM-AGENTS): the AgentDefinition editor, A2A tasks and the gateway key shown once;
  AgentsHome links them when they exist.
- **Owners' later work found here:** run records for Commons' contact import and Projects' work-item import, so Imports
  lists their runs (F13); CX-MAPS's settings entry with the framework Maps configuration (F22); Manufacturing's ShopFloor
  as a device route group, with its shared-station operator switch (impl-manufacturing §7).
- **Design §17.4 and §19:** LDAP and SCIM provisioning, a custom-field editor, workflow automation, DMARC and TLS
  reports, passkeys, event-condition notification rules; the per-group inactivity timeout, a runtime password policy,
  saved export profiles, connection and protocol checks as Monitor synthetic checks.
- **Found outside Admin's repositories, not changed here (P19):**
  - mr-marble's MyAccount/User/Notifications (`screen/SimpleScreens/MyAccount/User/Notifications.xml`, its
    `topicSubscriptions` transition) stores `moqui.security.user.NotificationTopicUser` from the whole request with the
    caller's own user id, so any signed-in user can post `allNotifications=Y` for any topic, a private one too
    (`ServiceJobError`, `WebServletError`, `ReportAlert`), and then receives every message of it: other users' private
    messages and the job error notifications' unmasked errors, parameters and results (F209, F210; Insights P8 R2 closed it
    for business alerts only, by sending them direct-only). Proposed fix, mr-marble's: the transition passes only the
    delivery choices it shows (`receiveNotifications`, `emailNotifications` and the like) and never `allNotifications`, and
    refuses a private topic; with the framework ask (mr-moqui `plans/Remaining-Work.md`) that the recipient resolution honor
    `allNotifications` on a private topic only for the topic's registered audience. Written into design-admin §10 TopicDetail
    and Remaining-Work's security list.
  - The framework's `apps/ScreenTree` (the Site Map) fails a screen render (`sri.getRootScreenDef` is not a function; the P18
    review): it needs a host member for screen definitions or a rewrite over the menu data. In Remaining-Work's tests list.
- **The lifecycle completion and exception notice** (design §16): not built. A lifecycle operation's outcome is on
  LifecycleOperations and LifecycleDetail only; a registered private topic with a link to LifecycleDetail (Mantle sends,
  BOSS seeds the link, as the `AccountSignIn` topic) is the remaining work.

## 8. Verification

- **Per phase,** the "Done" rule of §2.
- **End to end,** run `./moq run`, sign in as each demo Admin user, and walk each built phase's "usable when" in order;
  accept an invitation in a private browser window.
- **Design §15.3 scenarios,** each an acceptance test (`./moq accept mr-boss`, when asked):

| Scenario | Phase |
| --- | --- |
| Delegated administration | P4, P5, P6; P15 (imports), P10 (SSO); P19's walk |
| Escalation through grants | P1, P3; P10 and P15 for SSO and imports |
| Last administration path | P3; P10 (group flags and providers), P6 |
| Relay scope | P11 |
| Endpoint change | P10 (providers), P11 |
| Hire and invitation | P5 (its invitation half); the People half later (§7) |
| Offboarding | P6; Insights P7 (owned schedules) |
| Access explanation | later (§7) |
| Settings ownership | P2 (the index), P11 (gateways) |
| Protocol readiness | P12 |
| Unknown provider outcome | P12 (mail), P13 |
| Independent failure | P2, P6, P13, P15 |
| Import preview/retry | P15 |
| Export and recipient delivery | Insights P7; P16 (status) |
| Monitor reuse | P1, P14 |
| Backup scope | P16 |
| Privacy hold | later (§7) |
| Agent policy | P1, P2, P4 (the exposures) |
| Constitution reading, customization and reset | P7 |
| Constitution reference dialog | the framework's (built Nov 7); P7 opens it from Admin |
| Output/UI parity | each phase; P19's sweeps |

- **Walks.** One golden-path client walk for Admin in the regression suite (AdminUsersWalk, from P4); the others are
  acceptance tests. No screenshots.

## 9. Screens moved to the framework (Nov 11, 2026)

After gate 5 the screens of Admin that have no business model in them moved to the framework's System app
(`runtime/components/base/tools/screen/System/`), with the old raw System screens folded in as parts for the instance
administrator, and Admin shows them under its own root. The plan and the record of each phase, with its findings and
tests, are mr-moqui's [plans/archive/Admin-Screens-Down.md](../../../../../plans/archive/Admin-Screens-Down.md) (Track A, phases A0 to
A6). How an app mounts the screens is in the tools component's
[README](../../../../../runtime/components/base/tools/README.md#mounting-the-administration-screens), and what each Admin
screen is now in [design-admin §1.4](design-admin.md#14-screens-that-are-the-frameworks). The phase entries of §3 are
left as the record of the build as it was; this section says where what they name is now.

| Phase | Moved to the framework | In mr-boss after it |
| --- | --- | --- |
| A0 Contract | `AdminCalls.js`; the mount contract (`adminMount`, read by `tools/template/AdminMount.js`) | `get#SharedContext` answers `mount` and `Admin.xml` sets `adminMount`; `get#AppAccess`, `find#ToolLinks`, the Developer tools area and `BOSS_ADM_DEVELOPER` are removed |
| A1 Operations | Jobs, JobDetail, JobRuns, JobRunDetail, Topics, TopicDetail | Jobs, JobRuns and JobRunDetail mounted by location; JobDetail, Topics and TopicDetail wrappers |
| A2 Integrations, Mail | Connections, ConnectionDetail, MessageTypes, MessageTypeDetail, SystemMessages, SystemMessageDetail; Protocols › Home, MailRelays, MailRelayDetail, MailQueue, ServerConfiguration; the connection parts | MailRelays and MailRelayDetail by location; the four message screens, MailQueue and ServerConfiguration wrappers; Connections, ConnectionDetail and Protocols › Home Admin's own screens around the framework's sections |
| A3 Access, Security | Groups, GroupDetail, Capabilities, RowRules, AccessReview; SignInPolicy, IdentityProviders, IdentityProviderDetail, Sessions; the matrix services | Capabilities, RowRules and the three sign-in screens by location; Groups a wrapper; GroupDetail, AccessReview and Users › Sessions Admin's own screens |
| A4 Settings, Audit | InstanceSettings, Localization, AuditChanges | InstanceSettings and Localization wrappers; AuditChanges by location |
| A5 Data | Imports, ImportDetail, Exports, DataExport, Backups; the lists' and the export wizard's services | Exports and DataExport by location; Backups a wrapper; Imports and ImportDetail Admin's own screens; the shared wizard stays here |
| A6 Registries | the readiness, refresh and settings records and services; Health, SupportSummary, SettingsHome | SupportSummary by location; SettingsHome a wrapper; Health Admin's own screen; the rows re-seeded with route keys |

What the phase entries name, and where it is now:

| Named in the phases | Phase | Now |
| --- | --- | --- |
| `Admin/Developer.xml`, `Developer/DeveloperHome.xml`, `RegistryServices.find#ToolLinks`, `BOSS_ADM_DEVELOPER` | P1 | removed: Tools' own home lists the tools, and Admin's Home links Tools for a user whose own grant opens it |
| `ContextServices.get#AppAccess` | P1, P14 | removed: a screen asks `ec.artifactExecution.isPermittedOwn` of an app's root |
| `ironstone.admin.ReadinessProvider`, `RefreshOperation`, `SettingsEntry` in `entity/AdminEntities.xml` | P2 | the framework's `moqui.server.ReadinessProvider`, `RefreshOperation` and `SettingsEntry`; a `fixPath` is `fixRoute` and `fixId`, a `screenPath` is `destinationRoute` and `screenLocation`. `AdminEntities.xml` keeps `LifecycleParticipant` and Insights' records |
| `RegistryServices.get#Readiness`, `request#Refresh`, `get#Overview`, `find#Settings`, `get#SupportSummary`; the eight setup checks in `Registry.js` | P2, P19 | `org.moqui.admin.ReadinessServices` (`Readiness.js`), with `check#InstanceSetup` for the instance's own checks, now the framework's providers. `RegistryServices` keeps `check#OwnerReadiness` (the Accounting, Products, Commerce and organization Constitution adapters) and gains `get#OpenPaths`; Admin's screens read through `template/AdminRegistry.js` |
| `Admin/Operations/SupportSummary.xml` | P19 | the framework's `System/Operations/SupportSummary.xml`, mounted by location |
| `service/ironstone/admin/AdminCalls.js` | P19 | the framework's `service/org/moqui/admin/AdminCalls.js` |
| `CapabilityServices.get#MatrixContext`, `apply#MatrixChanges` (`Capabilities.js`) | P9 | `org.moqui.admin.AccessServices` (`AccessMatrix.js`); `CapabilityServices` keeps `get#AccessReview` |
| `template/AdminConnectionParts.xml` | P11 | the framework's `tools/template/ConnectionParts.xml` |
| `AuditServices.find#ChangeEvidence` and the record routes of `Audit.js` | P17 | gone: the screen reads the framework's `find#Changes`, which carries the organization scope, and the routes are `mountRoutes` in `Admin.js`. `AuditServices` and `Audit.js` keep the access log |
| `service/ironstone/admin/DataServices.xml`, `Data.js` | P16 | deleted: `org.moqui.admin.DataTransferServices.find#ExportRuns`, `get#ExportContext` and `run#ExportRequest` |
| `DataImportServices.find#ImportRuns`; the owners' places in `Data.js` and `DataImport.js` | P15, P16 | the framework's `find#ImportRuns` and `get#ImportDetail`; the places are `mountRoutes` entries. `DataImportServices` keeps `get#ImportMount`, `get#ImportContext` and `map#Import` |
| The Admin screen files of Jobs, JobRuns, JobRunDetail, MailRelays, MailRelayDetail, Capabilities, RowRules, SignInPolicy, IdentityProviders, IdentityProviderDetail, AuditChanges, Exports and DataExport | P9 to P17 | deleted: the area files name the System screens |
| Tools `System/ServiceJob`, `System/SystemMessage`, `System/Localization`, `System/AuditLog`, `Security/UserGroup`, `Security/ArtifactGroup`, `Security/ActiveUsers` | P0, P1 | deleted or moved: their functions are the instance administrator's parts of System › Operations, Integrations, Settings, Audit, Access (with ArtifactGroups and ArtifactGroupDetail) and Security › Sessions |

Where the rules are tested now: the mount's rules in the tools component's `test/AdminMounts.spec.js`; the matrix, the
export list and wizard, the import list and detail, and the registries' generic rules in the framework's
`AdminAccessCapabilities`, `AdminDataExport`, `AdminDataTransfer` and `AdminReadiness` specs. The `test/Admin/` specs
keep Admin's part: each moved screen's one render through Admin's route, the organization scope, and posts of
transitions Admin does not take in (a job's, a message's, a group's and a translation's direct change), which change
nothing for a delegate and for `ADMIN`.
