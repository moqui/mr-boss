# IronStone BOSS — Admin implementation

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

Framework paths are under the mr-moqui checkout (`crates/`, `runtime/base-component/`), Mantle paths under
`runtime/component/mr-mantle/`.

Sections: [1 scope](#1-scope-and-order) · [2 rules](#2-ground-rules) · [3 phases](#3-phases) ·
[4 decisions](#4-decisions) · [5 open](#5-open-questions) · [6 findings](#6-findings) · [7 later](#7-later) ·
[8 verification](#8-verification)

---

## 1. Scope and order

- **Repositories.** Each is its own git repo:
  - `mr-moqui` (`crates/`, `runtime/base-component`): the `org.moqui.admin` service families (identity guards and
    sessions, access, configuration and connections, operations, data transfer, backups, audit, devices), the
    InstancePreference, transfer and registry records, the session refresh check (F4), the `authz` elements by which a
    component adds to the seal lists (F5, §4), the framework seals of `ADMIN_IDENTITY_GLOBAL`, `ADMIN_ACCESS_MANAGE`
    and `ADMIN_BACKUP_DOWNLOAD` (§4), the owner-change services of drives and shared mail accounts (F31) and the
    device credential (CX-DEVICE);
  - `runtime/component/mr-mantle`: `mantle.party.IdentityServices` with `UserInvitation` and `UserLifecycleOperation`,
    the staff invitation template, the organization services, the owner-change services of calendars and contact
    books (F31), and the gateway connection adapters;
  - `runtime/component/mr-boss`: the Admin app, AcceptInvitation, Shared/DataImport, `ironstone.admin`
    (ContextServices, RegistryServices, LifecycleServices) and its registry entities (F32), the registrations of the
    built apps, Admin's `report/` and `skill/` files.

  `runtime/component/mr-marble` is read only, for the baseline Gateway, Vendor and Party/EditParty forms that
  ss-inventory maps. mr-pass is not changed: the PASS Account privacy page is later (§7).
- **Scope.**
  - Every `parity` and `new` row of design §2 and the §17 needs they use, A1 and A2 of design §17.3, as changed by §6,
    except what waits on People, Maintenance, Sales and Marketing (§4, the user's call):
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
  - BOSS `ironstone.admin`: ContextServices (scope, choices, links), RegistryServices (readiness, refresh, settings,
    tool links) and LifecycleServices (the lifecycle coordinator's participants and transfers), and the screens.

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
  Users, Groups and Sessions for the delegated roles, and does not re-specify a Tools form it mounts.
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
      `runtime/base-component/framework/test` (or the tools component's, for a Tools screen), Mantle's in mr-mantle,
      BOSS's in mr-boss;
    - `./moq test-framework` for a phase that touches `crates/` or a base component, and `./moq test-apps`, each suite
      within its budget, raised by the phase's measured share with the user's agreement (§4);
    - `moqui lint --screens` clean for BOSS with the Debug binary;
    - the inventories' **Implemented in** columns;
  - an access rule the phase adds checked in `AdminAccess` (one holder and one non-holder on one verb, and another
    organization's identity refused), not every service and mount; ProjectsAccess passing with the new package (F14);
  - its row and **Built** note here.

  No route fixtures: a screen sweep is an acceptance test, one per app per mode. The phase's "usable when" and its §8
  scenario are acceptance tests to write (`acceptance/Admin/`, `acceptance/client/Admin/`), named in the phase; running
  them is not part of Done.

## 3. Phases

| Phase | Repos | Screens | Status |
| --- | --- | --- | --- |
| P0 Checks | all (read) | — | partly done Nov 7 (§6 F1–F33; F2's check settled in P1, F-P1-1); the other checks below left |
| P1 Foundation | mr-moqui, BOSS | the Admin root and menu, Home, System, Monitoring, AgentsHome, DeveloperHome | built Nov 7 (adm/p1) |
| P2 Registries, Health and the settings index | BOSS | Home, Health, SettingsHome | — |
| P3 Groups and grants | mr-moqui, BOSS | Groups, GroupDetail | — |
| P4 Users and sessions | mr-moqui, Mantle, BOSS | Users, UserDetail, Sessions; Commons Account's sign-in list | — |
| P5 Invitations | Mantle, BOSS | Invitations, AcceptInvitation | — |
| P6 Lifecycle and offboarding | mr-moqui, Mantle, BOSS | UserDetail's Lifecycle, LifecycleOperations, LifecycleDetail | — |
| P7 Organizations and the Constitution | Mantle, BOSS | Organizations, OrganizationDetail, Constitution | — |
| P8 Instance settings, localization and reference data | mr-moqui, BOSS | InstanceSettings, Localization, ReferenceData | — |
| P9 Capabilities and row rules | mr-moqui, BOSS | Capabilities, RowRules | — |
| P10 Sign-in policy and identity providers | mr-moqui, BOSS | SignInPolicy, IdentityProviders, IdentityProviderDetail | — |
| P11 Connections and mail relays | mr-moqui, Mantle, BOSS | Connections, ConnectionDetail, MailRelays, MailRelayDetail | — |
| P12 Protocols and the mail queue | mr-moqui, BOSS | ProtocolsHome, ServerConfiguration, MailQueue | — |
| P13 System messages and recovery | mr-moqui, BOSS | MessageTypes, MessageTypeDetail, SystemMessages, SystemMessageDetail | — |
| P14 Jobs and topics | mr-moqui, BOSS | Jobs, JobDetail, JobRuns, JobRunDetail, Topics, TopicDetail | — |
| P15 Imports | mr-moqui, Mantle, BOSS | Imports, DataImport, ImportDetail; Products' import mount | — |
| P16 Exports and backups | mr-moqui, BOSS | Exports, DataExport, Backups | — |
| P17 Audit and access evidence | mr-moqui, BOSS | AuditChanges, AccessLog | — |
| P18 Shared devices | mr-moqui, BOSS | Devices | — |
| P19 Finish | all | the sweeps and the review walk (acceptance) | — |

### P0 — Checks

Verify the design's riskiest assumptions against the code before building. Each result is a row in §6 and, where it
changes the design, an edit there. F1–F30 were found on Nov 7 while writing this plan and F31–F33 in its review the
same day; the design edits they call for were made then. Still to check:

- **Admin › System for `ADMIN` only** (F2; settled in P1, F-P1-1): which change keeps `SYSTEM_APP`'s own check on the mounted
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
- **Usable when** (an acceptance test to write, `acceptance/Admin/AdminFoundationWalk`): the menu renders for each
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
    the links stay under Admin › System (F-P1-1).
  - Docs: Attack-Surface's `user-facade` paragraph (the three seals, `ADMIN_CONSTITUTION_GLOBAL`, the elements);
    Remaining-Work's framework-asks row.
- BOSS access (`MoquiConf.xml`; `data/BossSetupData.xml`, appended but for F1's comment, F2's row and F14's rows):
  - `BOSS_ADMIN_ACCESS`, `BOSS_ADMIN_BACKUP` and `BOSS_ADMIN_ADMIN` as `privileged-group` elements, no seals;
  - the groups `BOSS_ADMIN` (root user group) and `_READ`, `_IDENTITY`, `_ACCESS`, `_CONFIGURE`, `_INTEGRATIONS`,
    `_OPERATIONS`, `_DATA`, `_AUDIT`, `_PRIVACY`, `_BACKUP`; on the `BOSS_ADMIN` artifact group (a second element of the
    same id) the `ironstone\.admin\..*` service pattern and the root authz `BOSS_ADMIN_ROOT` (`MANTLE_USER_ORG`,
    `MANTLE_PRIVATE_CONTACT`); `BOSS_ADMIN_APPADMIN` now `AUTHZT_ALLOW` (F2, F-P1-1) and the stale comment replaced (F1);
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
  Settings › Index links Admin Home in place of the removed Users placeholder (F-P1-3).
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
  `acceptance/Admin/AdminFoundationWalk` (3 features: every area per user; the delegate through Admin › System, Tools
  System, the entity-auto service and a direct entity call, and no Admin user granting `ADMIN_BACKUP_DOWNLOAD`; the reader
  and the refused Projects client and PASS account).
- Tests run (Debug binary, `--nobuild`): AdminAccess 7 of 7; with CommerceAccess (15 of 15), CustomerServiceAccess (22 of
  22) and ProjectsAccess (8: 4 passed, among them the deny-pattern feature; 4 fail the same without P1's mr-boss changes,
  F-P1-4). Cargo: moqui-core's conf, confcache, security_checks and eca tests 37 of 37; the whole moqui-core lib 1528 of
  1529, the one failure at e3360436 too (F-P1-5). `moqui lint --screens` (Debug): no idiom or hazard site in the Admin
  screens or the three Tools screens (132 sites in all, as before). Prettier clean on the new JavaScript. Not run:
  `./moq test-apps`, `./moq test-framework`, the acceptance suite, AppStructure (acceptance; its placeholder list is found
  by label, so the removed placeholders need no change).
- Budget: mr-boss's measured share is AdminAccess's 3.3 s server (no client spec); the framework's none.
- Inventories: no ss-inventory or usl-inventory row is implemented by P1 (usl-inventory's SetupServices row names Health,
  P2's).
- Findings (provisional, numbered by the lead):
  - **F-P1-1** (P0's F2 check) An inheritable `AUTHZT_ALLOW` on the Admin root also opens a child with no grant of its
    own (authz.rs's last-frame fallback, about line 527), so making `BOSS_ADMIN_ADMIN` ALLOW alone would still open
    System; and mounting System outside the root's path is not possible for a subscreen. P1 sets the administrator's
    root grant to ALLOW (no inheritable ALWAYS that skips the child's check) and denies `System.xml` by its location to
    `BOSS_ADMIN` and `BOSS_ADMIN_ADMIN` (`BOSS_ADM_SYSTEM`); `ADMIN`'s ALWAYS, on the root or Tools' `SYSTEM_APP`, still
    opens it, there and at `/qapps/system`. A group an installation gives an ALLOW on the Admin root needs the same deny.
    Links: three transitions (Security/ActiveUsers, Visit/VisitList, Visit/VisitDetail) went to `//system/Security/UserAccountDetail`,
    Tools' own mount; now relative. The others leave for Monitor, Dashboards and Tools (`//apps/...`) under their own
    grants, as designed. Design §13 changed.
  - **F-P1-2** `ec.artifactExecution.isPermitted` checks against the top of the stack, so under the Admin root (or the
    `ironstone\.admin` service pattern, inheritable) every Tools screen reads as permitted, and it records an
    authorization failure for each refusal. Admin.js reads the user's own groups' grants (`ArtifactAuthzCheckView`), as
    Commerce.js does, for the root, the areas and the framework apps. Likewise the root's inheritable grant reaches the
    services an Admin screen calls, so Monitoring and AgentsHome call only services that check their own grant
    (`get#SourceStatus`'s `authorize_own`, `list#Incidents`' `MONITOR_INCIDENT`, AgentAdminServices' AgentAdmin).
  - **F-P1-3** Projects' Settings › Index linked `/qapps/Admin/Users`, a removed placeholder; it links Admin Home until
    P4's `Users/Users` (P4 repoints it).
  - **F-P1-4** On the Debug binary ProjectsAccess fails four client features with "Maximum call stack size exceeded" in
    nested scripts (entity filters, record paths), the same with P1's mr-boss changes stashed: the script stack budget
    (`script/runtime.rs` `stack_budget`) is fixed while a debug build's frames are larger. Its deny-pattern feature (F14)
    passes. A run on a release binary should pass them.
  - **F-P1-5** moqui-core's `the_wrapped_ec_takes_probes_and_leaves_the_framework_the_real_one` fails at e3360436 without
    P1 (`ec.entity` refused in the nested read); not P1's.
  - **F-P1-6** With `Admin.xml` as a spec's render root, `//Admin/...` links resolve to nothing and render disabled (as
    every app's `page` helper does), so specs check a shortcut's label, not its URL.
  - **F-P1-7** `ORG_ZIZI_RETAIL` has a child organization, `BOSS_WH_RETURNS` (PrtOrgRollup); `get#PartyInternalOrgIds`
    counts it, so a Retail administrator administers it too, as `MANTLE_USER_ORG` filters.
- Decisions (§4 rows added): the administrator's grants; opening Admin with the root grant alone; the P1 areas by group;
  the Privacy team's group through its member.
- For the lead:
  - the framework budget needs no change; mr-boss's share is AdminAccess's 3.3 s;
  - ProjectsAccess on a release binary (F-P1-4) before the merge, and F-P1-5 for the framework;
  - the demo component's lock-down (`runtime/dev-component/demo`) ends some of `ADMIN`'s sealed permissions on the demo
    server; whether it ends `ADMIN_IDENTITY_GLOBAL`, `ADMIN_ACCESS_MANAGE` and `ADMIN_BACKUP_DOWNLOAD` too is the
    framework's call (Demo.spec.js lists the ended ones);
  - P4 repoints Projects' Settings link (F-P1-3); Insights P1 needs no deny-pattern change (F14 done).

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

### P19 — Finish

- The tui and server-static screen sweeps of Admin, one acceptance test per mode (each screen's twin is built in its
  phase).
- The design §15.3 review, acceptance tests (§8): a user of each Admin group with no other launcher is refused other
  organizations' identities, secrets, sealed rights, privileged memberships and the System mount, through URLs,
  transitions, imports, SSO, exports, the palette, choices, Assist tools and direct services.
- The §16 outputs not built earlier: the readiness and support summary (print and redacted JSON).
- The inventories' **Implemented in** columns, the design's Impl column, and Remaining-Work; the mr-boss README's
  Admin line.

## 4. Decisions

These are made before and during the build. Each one that changes the design is also written into design-admin.md or
the owner's design.

| Date | Decision | Notes |
| --- | --- | --- |
| Nov 7, 2026 | Admin and Insights are the next apps built, after Commerce | The user's call (the planning request): people trying the BOSS apps need them, and much of what they bring together is built |
| Nov 7, 2026 | What depends on People, Maintenance, Sales and Marketing is left out (§1 scope, §7): People's provisioning entry and SECA, Employee360 links, their import targets, settings rows, readiness providers, lifecycle participants, device route groups and privacy providers, and the payroll export | The user's call. Admin's own lifecycle (P6) covers disablement and organization removal without People |
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

## 5. Open questions

| Question | Decides | Notes |
| --- | --- | --- |
| Further issues discovered during implementation | the affected phase | Record findings and decisions here; the open questions of the plan as written (Q1–Q5) were answered on Nov 7 and are in §4 |

## 6. Findings

Design assumptions found wrong or unstated in the code, with the resolution. Where a resolution changes the design, it
is written there too. F1–F30 were found on Nov 7, 2026, while writing this plan, and F31–F33 in its review the same
day.

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
- **What waits on Sales, Marketing and Maintenance:** the opportunity, audience and equipment import targets; their
  settings rows and readiness providers; Marketing's CheckIn and Maintenance's TechnicianKiosk route groups; their
  privacy providers; Marketing's consent rules in TopicDetail's audience.
- **The framework's agent screens** (ADM-AGENTS): the AgentDefinition editor, A2A tasks and the gateway key shown once;
  AgentsHome links them when they exist.
- **Owners' later work found here:** run records for Commons' contact import and Projects' work-item import, so Imports
  lists their runs (F13); CX-MAPS's settings entry with the framework Maps configuration (F22); Manufacturing's ShopFloor
  as a device route group, with its shared-station operator switch (impl-manufacturing §7).
- **Design §17.4 and §19:** LDAP and SCIM provisioning, a custom-field editor, workflow automation, DMARC and TLS
  reports, passkeys, event-condition notification rules; the per-group inactivity timeout, a runtime password policy,
  saved export profiles, connection and protocol checks as Monitor synthetic checks.

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
