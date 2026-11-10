# IronStone BOSS — Admin implementation

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
  `acceptance/Admin/AdminFoundationWalk` (3 features: every area per user; the delegate through Admin › System, Tools
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
  - the demo component's lock-down (`runtime/dev-component/demo`) ends some of `ADMIN`'s sealed permissions on the demo
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
  Acceptance, written and not run: `acceptance/Admin/AdminRegistriesWalk` (4 features, the "usable when" above).
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
  `acceptance/Admin/AdminGroupsWalk` (3 features, the "usable when").
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
  run: `acceptance/Admin/AdminUsersUsable` (2 features, the "usable when").
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
  `acceptance/Admin/AdminInvitationsUsable` (3 features, the "usable when").
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
  not run: `acceptance/Admin/AdminLifecycleUsable` (2 features, the "usable when").
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
  `acceptance/Admin/AdminConstitutionUsable` (3 features, the "usable when").
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
  AdminConfiguration. Acceptance, written and not run: `acceptance/Admin/AdminSettingsUsable` (3 features, the "usable when").
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
  not run: `acceptance/Admin/AdminCapabilitiesUsable` (4 features, the "usable when").
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

## 5. Open questions

| Question | Decides | Notes |
| --- | --- | --- |
| Further issues discovered during implementation | the affected phase | Record findings and decisions here; the open questions of the plan as written (Q1–Q5) were answered on Nov 7 and are in §4 |

## 6. Findings

Design assumptions found wrong or unstated in the code, with the resolution. Where a resolution changes the design, it
is written there too. F1–F30 were found on Nov 7, 2026, while writing this plan, F31–F33 in its review the same
day, F34–F40 in P1, F41–F46 in P0's remaining checks, F47–F54 in P2, F55–F64 in P3 and the provisional F65–F76 in P4 (Nov 7; numbered by the lead, in P4's Built note); P6's provisional F91 to F101 are in its Built note, P7's F103 to F109 and P8's F110 to F118 (Nov 10) in theirs. P9's F119 to F131 (Nov 10, 2026) are in its Built and Review notes.

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
