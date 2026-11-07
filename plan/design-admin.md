# IronStone BOSS — Admin design

Nov 7, 2026 — implementation plan written ([impl-admin.md](impl-admin.md)), built with Insights in one order; the corrections its P0 found are made here (impl-admin F2, F3, F5, F16, F20, F21), and those of its review the same day (the Admin seals made the framework's, the Constitution and lifecycle screens in A1, Insights' wall displays as the first device route group, owner wizards without runs; impl-admin §4, F13, F22). Nov 6, 2026 — draft; Localized Constitution and trusted references added as proposed A2 work. The Nov 1 review against research-admin.md, the reference apps and the other designs predates this addition.

IronStone Admin serves system administrators and people delegated a particular administrative responsibility. It brings together users, groups and access; organizations, settings and the shared human/agent Constitution; integrations, mail and protocol configuration; jobs and operational health; imports, exports, audit and privacy. Business applications continue to own their policies and transactions. Admin makes their configuration, readiness and recovery discoverable without becoming another editor for the same records. The first release is small: users, groups, sessions, invitations, organizations and the Constitution, the settings index, health, and the framework System screens mounted for `ADMIN` (§17.3).

**Inputs.** [research-admin.md](research-admin.md); [initial-design.md](initial-design.md); [design-doc-guide.md](design-doc-guide.md); [style-guide.md](style-guide.md); [design-crosscut.md](design-crosscut.md); [design-drawers-commons.md](design-drawers-commons.md); [design-insights.md](design-insights.md); the Sales, Marketing, Customer Service, Commerce, Products, Purchasing, Warehouse, Manufacturing, Maintenance, Accounting, People and Projects designs; [ss-inventory.md](ss-inventory.md); [usl-inventory.md](usl-inventory.md); [application practices](../../../../docs/dev/Practices-App-Dev.md); and the current [monitoring guide](../../../../docs/tools/Monitoring.md), [mail](../../../../docs/interfaces/Mail-Inbound.md), [sync](../../../../docs/interfaces/Sync.md) and [Assist](../../../../docs/ai/Assist.md) guides.

**Sections.** [1 shell](#1-shell) · [2 screens](#2-screens) · [3 home](#3-home) · [4 users](#4-users-and-lifecycle) · [5 access](#5-groups-and-access) · [6 sign-in](#6-security-and-sign-in) · [7 settings](#7-organizations-and-settings) · [8 integrations](#8-integrations-and-system-messages) · [9 protocols](#9-mail-and-protocols) · [10 operations](#10-operations-notifications-and-jobs) · [11 data](#11-import-export-and-backups) · [12 audit](#12-audit-retention-and-privacy) · [13 agents](#13-agents-system-and-developer-tools) · [14 contracts](#14-shared-registration-contracts) · [15 acceptance](#15-coverage-and-acceptance) · [16 outputs](#16-documents-and-outputs) · [17 needs](#17-framework-and-data-needs) · [18 decided](#18-decided) · [19 open](#19-open)

## 1. Shell

### 1.1 Root, authority and presentation

Root `screen/Admin.xml`, route `Admin`, keeps icon `sym_o_admin_panel_settings`. `BOSS_ADMIN` is the existing artifact group, and `BOSS_ADMIN_ADMIN` is an existing setup user group. `BOSS_ADMIN` is also the root user group (impl-admin P1, Commerce's pattern): every ordinary Admin user is in it and a capability group, and an area only some groups see denies it and allows theirs. The root's comment saying its grants are commented out is stale: setup has framework ADMIN and app-admin authorizations with `MANTLE_ACTIVE_ORG` and `MANTLE_PRIVATE_CONTACT`. The root and Home placeholder are not the workflows specified here.

The root continues `mantle.party.PartyServices.setup#UserOrganizationInfo`. Internal organizations are multiple parties in one instance, not separate installations. Ordinary delegated groups take the existing user-organization and private-contact filters; the administrator setup group keeps its established filters. Every read and action independently checks its permission and target scope. An account belongs to one identity even when that identity works for several organizations. Authority to manage one organization's memberships does not authorize disabling that person's entire account, inspecting another organization's membership or granting instance-wide access.

Groups are assignment bundles. Services use `ec.user.hasPermission` and domain scope, never literal BOSS group checks, calling-screen names or a supplied `appRoot`. A write permission is not a view permission. The framework seeds the `ADMIN_*` permissions, each granted to `ADMIN`, and BossSetupData gives the proposed groups below their listed permissions (impl-admin §4); an installation may assign the permissions through its own groups. A root grant only opens navigation. Framework privileged-group and sealed-permission enforcement remains in force even for an app administrator.

| Role | Proposed group | Permissions and boundary |
| --- | --- | --- |
| administrative reader (R) | BOSS_ADMIN_READ | `ADMIN_OVERVIEW_VIEW`; safe setup/health summaries and authorized owner links only |
| identity operator (U) | BOSS_ADMIN_IDENTITY | `ADMIN_IDENTITY_VIEW`, `ADMIN_IDENTITY_MANAGE`; permitted staff identity and organization-membership work; global disable/revoke additionally needs `ADMIN_IDENTITY_GLOBAL` (sealed) |
| access administrator (A) | BOSS_ADMIN_ACCESS (privileged) | `ADMIN_ACCESS_VIEW`, `ADMIN_ACCESS_MANAGE` (sealed); registered grant bundles within explicit delegation; no implicit right to grant sealed permissions or privileged membership |
| configuration administrator (C) | BOSS_ADMIN_CONFIGURE | `ADMIN_SETTINGS_VIEW`, `ADMIN_SETTINGS_MANAGE`; nonsecret instance presentation and permitted organization setup, including organization Constitution edits; global Constitution edits additionally need `ADMIN_CONSTITUTION_GLOBAL`; domain settings still require their own permissions |
| integration administrator (I) | BOSS_ADMIN_INTEGRATIONS | `ADMIN_CONNECTION_VIEW`, `ADMIN_CONNECTION_MANAGE`; masked infrastructure configuration, credential replacement and organization availability; business gateway actions remain domain-owned |
| operations operator (O) | BOSS_ADMIN_OPERATIONS | `ADMIN_OPERATION_VIEW`, `ADMIN_OPERATION_MANAGE`; registered jobs, queues and safe recovery actions; Monitor permissions are granted separately |
| data operator (D) | BOSS_ADMIN_DATA | `ADMIN_TRANSFER_VIEW`, `ADMIN_TRANSFER_RUN`; transfer coordination, plus every target import/export domain permission |
| audit reader (V) | BOSS_ADMIN_AUDIT | `ADMIN_AUDIT_VIEW`; scoped, redacted changes and access evidence; no implicit business-record, replay or message-body access |
| privacy administrator (P) | BOSS_ADMIN_PRIVACY | `ADMIN_PRIVACY_VIEW`, `ADMIN_PRIVACY_MANAGE`, `ADMIN_RETENTION_MANAGE`; reviewed requests and hold/policy coordination; domain execution checks still apply |
| backup operator (B) | BOSS_ADMIN_BACKUP (privileged) | `ADMIN_BACKUP_VIEW`, `ADMIN_BACKUP_RUN`; archive download (later) additionally needs `ADMIN_BACKUP_DOWNLOAD` (sealed), an instance-wide disclosure permission |
| app administrator | BOSS_ADMIN_ADMIN (existing, privileged) | All Admin permissions above but the sealed ones the identity and backup operators additionally need (`ADMIN_IDENTITY_GLOBAL`, `ADMIN_BACKUP_DOWNLOAD`), which stay the instance administrators' with `ADMIN_CONSTITUTION_GLOBAL` (impl-admin §4); only a member can add a member, and only a holder of each sealed permission can grant it |
| agent administrator | existing permission assignment | `AgentAdmin`; separate runtime, content and gateway checks of the existing framework remain intact |
| advanced tools operator | existing permission assignment | Existing Tools access and sealed permissions; no new BOSS substitute |

These groups and permissions are rows of crosscut §1.4's capability table, beside every other app's. `ADMIN_CONSTITUTION_GLOBAL`, built with the Constitution and sealed by the framework, is a separate sealed permission for instance-wide Constitution save/reset, granted to instance administrators; neither `AgentAdmin` nor an organization configuration delegation implies it. Organization save/reset uses `ADMIN_SETTINGS_MANAGE` with independently checked organization scope. Constitution reading is available to signed-in users for the global document and to members or authorized administrators for their organizations, without general Admin or AgentAdmin access (§7).

`ADMIN_LOGIN_AS`, `ADMIN_PASSWORD`, `SQL_RUNNER_WEB`, `GROOVY_SHELL_WEB`, `SSH_SHELL`, `SERVICE_LOAD_RUNNER`, `SearchRemote`, `DashboardRemote`, `REST_SCHEMA`, `LlmGatewayUse`, `COMPONENT_DEPLOY`, `DATABASE_ADMIN`, `DATABASE_EXTERNAL`, `ADMIN_CONSTITUTION_GLOBAL` and Admin's `ADMIN_IDENTITY_GLOBAL`, `ADMIN_ACCESS_MANAGE` and `ADMIN_BACKUP_DOWNLOAD` are the framework's sealed permissions, and `ADMIN`, `ADMIN_ADV` and `SYSMSG_RECEIVE` its privileged groups (`user-facade` `authz` in `MoquiDefaultConf.xml`; [Attack-Surface](../../../../docs/security/Attack-Surface.md)). mr-boss adds `BOSS_ADMIN_ACCESS`, `BOSS_ADMIN_BACKUP` and `BOSS_ADMIN_ADMIN` to the privileged groups with `authz` `privileged-group` elements in its `MoquiConf.xml`, which the conf merge adds to the framework's list rather than replacing it (impl-admin P1). The framework EECAs `UserGroupPermissionSealed` and `UserGroupMemberPrivileged` call `crates/moqui-core/src/service/security_checks.rs`: only a holder of a sealed permission may write a `UserGroupPermission` row for it, and only a member of a privileged group may change its membership; `UserGroupMemberSealed` (impl-admin F-P3-3, review R1) lets only a holder of each sealed permission a group grants give a membership in it, so a sealed grant is not passed on through a group that is not privileged.

**Sealed Admin grants** (proposed, ADM-ACCESS). The framework seeds `ADMIN_BACKUP_DOWNLOAD`, `ADMIN_IDENTITY_GLOBAL` and `ADMIN_ACCESS_MANAGE` and adds them to `MoquiDefaultConf.xml`'s `sealed-permissions`, beside its `ADMIN_CONSTITUTION_GLOBAL`, so a framework-only instance keeps them sealed (decided Nov 7, 2026; [impl-admin](impl-admin.md) §4). mr-boss `MoquiConf.xml` adds `BOSS_ADMIN_ACCESS`, `BOSS_ADMIN_BACKUP` and `BOSS_ADMIN_ADMIN` to the privileged groups.

A component's `authz` attribute replaces the framework's value (`merge_user_facade` merges the element), so a component's lists would have to repeat the framework IDs. Instead the framework gains child elements of `authz`, `sealed-permission` and `privileged-group`, that each component adds to the lists without replacing the framework's defaults, and mr-boss names only its own groups that way (decided Nov 7, 2026; impl-admin §4). The framework's sealed list now also holds `COMPONENT_DEPLOY`, `DATABASE_ADMIN`, `DATABASE_EXTERNAL` and `ADMIN_CONSTITUTION_GLOBAL` (impl-admin F5). Bounded delegation is then enforced below Admin: an access administrator grants only registered bundles, can never grant a sealed permission it does not hold, and cannot add anyone to a privileged group it is not in. The same rules hold for direct service calls, imports and SSO role mappings. Admin also protects the last usable administration path when a login policy or membership changes: framework `org.moqui.admin.IdentityServices.check#AdministrationPath` (built in impl-admin P3), called by every grant, membership and group-flag change, and by the provider, factor and lifecycle changes of later phases. A usable path is a date-valid member of `ADMIN` (the framework names no app's administrator group, and after impl-admin F34 no BOSS group holds `ALWAYS` on the Admin root) who is not permanently disabled or terminated, can authenticate, holds a date-valid factor where any of its groups requires one and is admitted by its own and its groups' `ipAllowed` from the acting administrator's address, now and at each later date the change names (impl-admin F41, F-P3-1). A change that would leave none where there was one is refused with a reason.

XML widgets are the default. Every designed screen renders in `qvt` and `tui`; lists have paging, saved filters, useful phone columns and names instead of unlabelled IDs. Detail screens use the shared record header, one primary action by state, a More menu and named confirmations. Destructive, bulk, credential and external-send actions show the target/count and consequences. Phones support triage, identity disablement with confirmation, invitation status and incident links; wide matrices have an equivalent filtered list. Secrets, private report bodies and sensitive HR details never enter shell context or a hidden client column.

### 1.2 Menu and shell contributions

- Home — `Home`.
- Users — `Users/Users`.
  - Invitations — `Users/Invitations`; sessions — `Users/Sessions`; lifecycle operations — `Users/LifecycleOperations`.
- Access — `Access/Groups`.
  - App capabilities — `Access/Capabilities`; access inspector — `Access/AccessInspector` (later); row rules — `Access/RowRules`.
- Security — `Security/SignInPolicy`.
  - Identity providers — `Security/IdentityProviders`; shared devices — `Security/Devices`.
- Settings — `Settings/Home`.
  - Organizations — `Settings/Organizations`; Constitution — `Settings/Constitution` (A1; localized rules and reference links); instance — `Settings/InstanceSettings`; localization — `Settings/Localization`; reference data — `Settings/ReferenceData`.
- Integrations — `Integrations/Connections`.
  - Webhooks — `Integrations/Webhooks` (later); message types — `Integrations/MessageTypes`; system messages — `Integrations/SystemMessages`.
- Mail and protocols — `Protocols/Home`.
  - Mail relays — `Protocols/MailRelays`; mail domains — `Protocols/MailDomains` (later); mail queue — `Protocols/MailQueue`; server configuration — `Protocols/ServerConfiguration`.
- Operations — `Operations/Health`.
  - Jobs — `Operations/Jobs`; runs — `Operations/JobRuns`; monitoring — `Operations/Monitoring`; notification topics — `Operations/Topics`.
- Data — `Data/Imports`.
  - Import — `Data/DataImport`; exports — `Data/Exports`; backups — `Data/Backups`.
- Audit and privacy — `Audit/AuditChanges`.
  - Access evidence — `Audit/AccessLog`; retention — `Audit/Retention` (later); privacy requests — `Audit/PrivacyRequests` (later).
- Agents — `Agents/Home`.
- System — `System` (the framework Tools System screens, `ADMIN` only).
- Developer tools — `Developer/Home`.

Record, wizard and reused routes below are contextual, not additional menu levels. Entries marked later are absent from the menu until they ship.

**Shell providers.** The `admin` keymap opens Home, Monitoring, Agents, System and Developer tools (`g a`, `g o`, `g n`, `g y`, `g d`), each key shown only to a user the screen opens to. The palette contributes authorized users, groups, connections and jobs, and actions Invite users and Open settings. Quick create contributes Invite users only. Today shows assigned lifecycle/privacy exceptions and actionable operational notices, with minimal metadata. Existing ReportAlert, Monitor and agent notifications retain their owners; proposed invitation, lifecycle, new-device sign-in and privacy topics use canonical operation IDs and no tokens, with lock-screen-safe push titles. Opening or acting on a notification always rechecks authority. Commons owns the shell and approvals inbox.

**Stack contributions** (crosscut §1.5):
- **Assist (CX-ASSIST).**
  - mr-boss `skill/` procedure skills `invite-staff`, `offboard-user` and `reset-factor`, with `screens:` on Invitations, UserDetail and LifecycleDetail. In BOSS they replace the framework `create-user-account` skill's direct creation on System › Security, which bypasses the invitation default.
  - The Admin root's `shell-providers` declare `assist-prompt` chips on UserDetail ("Why can't this user sign in?"), Health ("What is failing?") and GroupDetail, and a "Log as note" `response-action`.
  - `AgentToolExposure` READ rows, for questions no single screen answers:
    - proposed `mantle.party.IdentityServices.find#Users`: `exposeAssistant` Y, `exposeMcp` N, because it lists staff personal data;
    - `ironstone.admin.RegistryServices.get#Readiness`: Y and Y;
    - `org.moqui.admin.AccessServices.explain#Access`, when AccessInspector ships: Y and N.

  All three run with the user's own permissions. The prerequisite is the Mantle active-organization user-facts provider ([Remaining-Work](../../../../plans/Remaining-Work.md) "Apps").
- **Shared devices (CX-DEVICE).** Admin registers and revokes shared-device credentials (Devices, §6). Insights' wall displays are the first route group, in its second release; People owns kiosk identity once it is built.
- **Shipped reports (CX-OPS-REPORTS).** mr-boss ships `report/admin-*.json`:
  - an alert template for failing or late job runs on job-run telemetry, instead of new Admin job topics;
  - the AccessLog dataset (§12).
- **Comms hooks, Sync and mail intake.** None: Admin has no business record kinds for them.

### 1.3 Current source baseline

| Verified source | Consequence for this design |
| --- | --- |
| Framework `entity/SecurityEntities.xml`; `service/org/moqui/impl/UserServices.xml` | Active UserAccount, dated groups/permissions, factors, SSO flows, UserLoginKey, UserAppPassword and UserSshKey. Access-token, app-password and SSH-key services already exist. The research's “no credential services” implication is obsolete. |
| Mantle `service/mantle/party/PartyServices.xml`; `entity/PublicEntities.xml` | Party account/organization/settings services exist. PASS has PublicSiteInvitation and its own guarded public identity flow; it must not become a staff-grant shortcut. |
| Framework `entity/BasicEntities.xml`; `EmailServices.xml`, `EmailClientServices.xml` | EmailServer and EmailTemplate are in `moqui.basic.email`, not `moqui.basic`. Account/OAuth/sync/rules/draft services and `test#EmailServer` are implemented. Comms remains their account UI owner. |
| Framework `conf/MoquiDefaultConf.xml` | SMTP listener trust (`smtp_allowed_addresses`, `smtp_authserv_id`), RTC/TURN, recording and related protocol settings already exist. Deployment configuration stays configuration; this design adds effective-state views and readiness checks. |
| BasicComms `screen/System/Voice`, framework Voice services/entities | Existing System > Voice owns trunks, numbers, caller IDs, fraud/emergency settings, phones, ring groups, schedules, IVR and queues. Admin links this owner with `VoiceAdmin`; credentials remain encrypted and absent from service projections. Personal calling/voicemail remains Comms. |
| [Monitoring guide](../../../../docs/tools/Monitoring.md); framework `MonitorEntities.xml`, `ReportEntities.xml`, `monitor/MonitorServices.xml` | Monitor/Dashboards, telemetry, checks, alerts, regressions, incidents and guarded recovery are built. Admin composes them. ArtifactHit/ArtifactHitBin and old hit/log screens are retired; Visit/Visitor stay and requests come from spans. |
| Framework `LlmEntities.xml`, `AgentEntities.xml`; Tools `System/Llm` | Current LlmEndpoint/Model/Call/UsageDaily and AgentDefinition/Conversation/Run/ToolPolicy/Approval/Skill records and administrative screens supersede research-era LlmConversation/LlmCallLog/A2ATask proposals. Reuse their services and `AgentAdmin`. |
| Framework `SpreadsheetServices.xml` | `read#Spreadsheet` parses sheets. `load#SpreadsheetEntity` stops at the first error in the caller's transaction; it is not the executor for independent business import rows. |
| Framework `ServerServices.xml`, `MoquiSetupData.xml` | `backup#EmbeddedDatabase` and its scheduled job exist. External database coverage and archive browsing/download need explicit adapters and checks. |
| Accounting's implemented-contract addendum | Admin provisions active `PaymentGatewayOrganization` bindings. Finance selects those bindings and cannot change credentials or executable gateway configuration. |
| Mantle `service/mantle/product/ProductImportServices.xml`; BOSS `screen/Shared/ProductImport.xml` (built Products P12) | The staged import already exists for catalogs: `stage#`, `configure#`, `validate#`, `apply#` and `get#CatalogImport`, kinds in `ProductCatalogImportKind`, runs and rows in `ProductCatalogOperation`/`ProductCatalogOperationItem`. Shared/DataImport generalizes it (§11.1). |
| Tools `screen/System/` | ServiceJob Jobs/JobRuns, SystemMessage Type/Message/Remote, Localization Messages/EntityFields, AuditLog, Security ActiveUsers and Print Printer are full administration screens for `ADMIN` today. Admin mounts them in the first release (§13 System) and builds delegated versions only for the non-`ADMIN` roles named there. |

Proposed service families and records are in §17.

## 2. Screens

Paths are relative to the BOSS root. `N` means a proposed model or projection defined in §17. Roles are the permission bundles in §1.1. A framework destination named in a form's navigation is a link, not an invented Admin alias. Shared import has one definition at `Shared/DataImport.xml`. Rows are grouped by menu area. Within the rows that are not `later`, §17.3 orders the work: phase A1 is the first release, and phase A2 follows it.

| Screen | Path | Archetype | Impl | Purpose | Main record | Reused | Roles | Scope | Context |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home | Admin/Home | landing | xml | Show work and setup requiring attention | N readiness projection | own | scoped R | new | organization, authorized filters |
| Users | Admin/Users/Users | list | xml | Find staff and explicitly permitted account identities | UserAccount, Party | own | U | parity | filters, user selection |
| UserDetail | Admin/Users/UserDetail | detail | xml | Administer one account without duplicating its person | UserAccount | own shared owner | U,A by action | parity | userId, partyId; no credentials |
| Invitations | Admin/Users/Invitations | list | xml | Invite staff and follow acceptance | N UserInvitation | own | U,A for grants | new | invitation filters/selection |
| AcceptInvitation | `/i/<token>` (token route; `screen/AcceptInvitation.xml`) | wizard | xml | Let an invited person prove the address, sign in or create the account, and accept | N UserInvitation | own | holder of the invitation token (anonymous until sign-in) | new | none |
| Sessions | Admin/Users/Sessions | list | xml | Inspect and revoke authorized sessions | HttpSession, Visit | own | U; global action explicit | parity | userId, safe session identity |
| LifecycleOperations | Admin/Users/LifecycleOperations | list | xml | Follow provisioning and offboarding outcomes | N UserLifecycleOperation | own | U,O scoped | new | operation filters/selection |
| LifecycleDetail | Admin/Users/LifecycleDetail | task | xml | Review and complete account lifecycle steps | N UserLifecycleOperation | own | U plus step authority | new | lifecycleId |
| Groups | Admin/Access/Groups | list | xml | Find grant bundles and their use | UserGroup | own | A | parity | group filters |
| GroupDetail | Admin/Access/GroupDetail | detail | xml | Manage dated membership and supported grants | UserGroup | own | A | parity | userGroupId |
| Capabilities | Admin/Access/Capabilities | settings | xml | Compare groups, launcher gates and domain permissions | N capability registry | own | A | new | app, group, permission filters |
| AccessInspector | Admin/Access/AccessInspector | task | xml | Explain a permission decision without performing it | N access explanation | own | A, scoped V | later | target identity and operation; no record body |
| RowRules | Admin/Access/RowRules | settings | xml | Inspect supported organization and private-record restrictions | EntityFilterSet, ArtifactAuthzFilter | own | A | parity | rule set and authorized scope |
| SignInPolicy | Admin/Security/SignInPolicy | settings | xml | Explain sign-in requirements and edit supported group flags | UserGroup, effective conf | own | A,C | new | group/policy identity |
| IdentityProviders | Admin/Security/IdentityProviders | list | xml | Find configured OAuth/OIDC/SAML sign-in providers | AuthFlow | own | I,A | new | provider filters |
| IdentityProviderDetail | Admin/Security/IdentityProviderDetail | settings | xml | Configure a provider and guarded mappings | AuthFlow and subtype/maps | own | I,A | new | authFlowId |
| Devices | Admin/Security/Devices | list | xml | Register shared devices and revoke their credentials | N device credential (CX-DEVICE) | own | A | new | device filters/selection |
| SettingsHome | Admin/Settings/Home | landing | xml | Find the sole editor for each setting | N settings registry | own shared index | scoped app | new | organization, area filters |
| Organizations | Admin/Settings/Organizations | tree list | xml | Find internal organizations and create authorized profiles | Party with PartyRole OrgInternal | own | C | parity | organization filters/selection |
| OrganizationDetail | Admin/Settings/OrganizationDetail | detail | xml | Maintain an internal organization's identity and links | Party, Organization | own with shared profile | C,U by action | parity | partyId, organization context |
| InstanceSettings | Admin/Settings/InstanceSettings | settings | xml | Maintain nonsecret instance presentation defaults | N InstancePreference, effective conf | own | C | new | settings scope |
| Constitution | Admin/Settings/Constitution | settings | xml | Read localized human/agent guidelines and trusted references; edit authorized global or organization customizations | localized JSON document; PartyContent override | own | scoped reader; C for organization edits; global edits additionally sealed | new | authorized organization or global scope; effective source/hash |
| Localization | Admin/Settings/Localization | settings | xml | Maintain supported translations | LocalizedMessage, LocalizedEntityField | own | C | parity | locale, message/entity field |
| ReferenceData | Admin/Settings/ReferenceData | landing | xml | Route vocabulary and policy changes to their owners | N settings registry | own | scoped app | parity | kind/owner |
| Connections | Admin/Integrations/Connections | list | xml | Find gateway, remote, OAuth, relay and printer configuration and readiness | PaymentGatewayConfig, ShippingGatewayConfig, TaxGatewayConfig, SystemMessageRemote, EmailOAuthProvider, NetworkPrinter | own | I | parity | kind, organization, connection key |
| ConnectionDetail | Admin/Integrations/ConnectionDetail | settings | xml | Configure one connection's endpoint and credentials and its organization availability | native connection record | own shared owner | I | parity | provider kind/key, organization |
| Webhooks | Admin/Integrations/Webhooks | list | xml | Find registered outbound event subscriptions | N EventSubscription | own | I | later | event/provider/scope filters |
| WebhookDetail | Admin/Integrations/WebhookDetail | detail | xml | Configure event delivery and inspect safe outcomes | N EventSubscription, SystemMessage | own | I,O by action | later | subscriptionId |
| MessageTypes | Admin/Integrations/MessageTypes | list | xml | Inspect supported message contracts | SystemMessageType | own | I,O | parity | type filters |
| MessageTypeDetail | Admin/Integrations/MessageTypeDetail | settings | xml | Configure registered message handling | SystemMessageType | own | I; executable changes advanced | parity | systemMessageTypeId |
| SystemMessages | Admin/Integrations/SystemMessages | list | xml | Triage incoming and outgoing transport outcomes | SystemMessage | own | O scoped | parity | type/remote/status/correlation |
| SystemMessageDetail | Admin/Integrations/SystemMessageDetail | detail | xml | Inspect evidence and request owner-approved recovery | SystemMessage, SystemMessageError | own | O; payload separately checked | parity | systemMessageId, operation identity |
| ProtocolsHome | Admin/Protocols/Home | landing | xml | Show configured protocol availability and owner links | effective configuration | own | I,O | new | protocol/provider |
| MailRelays | Admin/Protocols/MailRelays | list | xml | Find outgoing relays: mail servers no mail account owns | EmailServer not owned by an EmailAccount | own | I | new | server/organization filters |
| MailRelayDetail | Admin/Protocols/MailRelayDetail | settings | xml | Configure and test an outgoing mail relay | EmailServer | own | I | new | emailServerId |
| MailDomains | Admin/Protocols/MailDomains | list | xml | Find verified sending and hosted-mail domains | N MailDomain | own | I | later | domain/organization filters |
| MailDomainDetail | Admin/Protocols/MailDomainDetail | settings | xml | Verify ownership and publish domain readiness | N MailDomain | own | I | later | mailDomainId |
| MailQueue | Admin/Protocols/MailQueue | list | xml | Triage transport submissions without opening private inboxes | EmailMessage, draft/send outcomes | own | O,I scoped | new | status, account binding, correlation |
| ServerConfiguration | Admin/Protocols/ServerConfiguration | settings | xml | Inspect effective protocol settings and run diagnostics | effective conf/capabilities | own | I,O | new | protocol, instance |
| Health | Admin/Operations/Health | list | xml | Explain setup and operational readiness | N readiness projection | own | R plus source rights | new | provider/filter/selection |
| Topics | Admin/Operations/Topics | list | xml | Find registered notification topics | NotificationTopic | own | C,O | parity | topic filters |
| TopicDetail | Admin/Operations/TopicDetail | settings | xml | Maintain allowed delivery defaults and subscriptions | NotificationTopic, NotificationTopicUser | own | C; subscription authority separate | parity | topic |
| Jobs | Admin/Operations/Jobs | list | xml | Find schedules, owners and unhealthy work | ServiceJob | own | O | parity | job filters |
| JobDetail | Admin/Operations/JobDetail | settings | xml | Configure a registered job and request safe execution | ServiceJob and parameters | own | O plus owner rights | parity | jobName |
| JobRuns | Admin/Operations/JobRuns | list | xml | Find completed and active execution outcomes | ServiceJobRun | own | O | parity | job/status/date filters |
| JobRunDetail | Admin/Operations/JobRunDetail | detail | xml | Inspect a run and its domain recovery links | ServiceJobRun | own | O | parity | jobRunId, traceId |
| Monitoring | Admin/Operations/Monitoring | landing | xml | Open existing observability, alerts and recovery tools | Monitor/report projections | own navigation | existing Monitor/report grants | parity | service/job/incident filters |
| Imports | Admin/Data/Imports | list | xml | Find authorized business imports and outcomes | the target's owner batch; N TransferBatch only for a target without one | own | D plus target rights | new | target/batch/status filters |
| DataImport | Admin/Data/DataImport | wizard | xml | Stage, map, validate and apply a registered import | the target's owner batch; N TransferBatch only for a target without one | Shared/DataImport, §11 | D plus target rights | new | targetId, batchId, narrowing context |
| ImportDetail | Admin/Data/ImportDetail | detail | xml | Review row outcomes and retry only eligible failures | the target's owner batch; N TransferBatch only for a target without one | own shared results | D plus target rights | new | batchId |
| Exports | Admin/Data/Exports | list | xml | Find authorized exports and delivery status | report/export outcomes | own | D plus export rights | new | owner/provider/status filters |
| DataExport | Admin/Data/DataExport | wizard | xml | Export a registered domain format (vCard, payroll exchange, ledger) | registered domain exporter | own composition | D plus export rights | new | target/provider, authorized filters |
| Backups | Admin/Data/Backups | list | xml | Inspect database backup coverage and request a backup | backup provider and job outcomes | own | B | new | instance/provider/archive key |
| AuditChanges | Admin/Audit/AuditChanges | list | xml | Inspect permitted field-change and administration evidence | EntityAuditLog, audit events | own | V | parity | actor/record/date filters |
| AccessLog | Admin/Audit/AccessLog | list | xml | Inspect sensitive access and output evidence | shipped dataset over `otel_logs` audit targets | own | V plus source rights | new | actor/action/date/correlation |
| Retention | Admin/Audit/Retention | settings | xml | Explain policy, holds and eligible cleanup | N retention registration/holds | own | P | later | policy/provider/scope |
| PrivacyRequests | Admin/Audit/PrivacyRequests | list | xml | Look up a person's data and track verified personal-data requests | N PrivacyRequest | own | P | later | request/type/status filters |
| PrivacyRequestDetail | Admin/Audit/PrivacyRequestDetail | task | xml | Review domain dispositions and execute authorized steps | N PrivacyRequest and outcomes | own | P plus domain rights | later | privacyRequestId |
| AgentsHome | Admin/Agents/Home | landing | xml | Open the existing agent/model administration | agent/LLM safe summary | own navigation | AgentAdmin | parity | agent/provider identifiers |
| System | Admin/System | landing | xml | Mount the framework System screens for `ADMIN` | Tools `screen/System.xml` | Tools System (framework) | ADMIN | parity | none |
| DeveloperHome | Admin/Developer/Home | landing | xml | Open authorized advanced framework tools | effective tool catalog | own navigation | existing tool permissions | parity | none |

SettingsHome, ProtocolsHome, AgentsHome and DeveloperHome are named for their area because their path segment, `Home`, would repeat Admin/Home (guide §4).

## 3. Home

### Home

**Layout:** landing with Needs attention first, setup progress, safe operational number cards and Monitor / Manage / Configure shortcuts. Each count opens the same filtered authorized list; setup cards distinguish absent optional features from a failing required dependency.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Attention | list, read | Show assigned failures and review work | source, summary, severity, age, owner link | state chips; no raw payload | proposed `ironstone.admin.RegistryServices.get#Overview` | Frappe System Health Report; Zimbra Home |
| SetupChecks | list, read | Explain first-run readiness | check, ready/warning/failed/unavailable, checked time, fix link | grouped checklist | proposed `ironstone.admin.RegistryServices.get#Readiness` | Nextcloud setup checks; OpenProject Information |
| HealthCards | component | Show authorized operational counts | failed/late jobs, unresolved transports, backup coverage, login failures | dashboard/number-card | proposed `ironstone.admin.RegistryServices.get#Overview` | Tools System/dashboard; crosscut §3.17 |

**First-release setup checks.** Admin's own readiness providers, each with a fix link:
- the SYSTEM `EmailServer` has no `smtpHost`;
- `backup_EmbeddedDatabase_daily` is paused, or the `EmbeddedDbBackup` remote has no `sendUrl` (no off-site mirror);
- the report email template has no SMTP server;
- the `ReportAlert` topic has `receiveNotifications` N;
- a member of `ADMIN` or of a `*_ADMIN` group has no authentication factor;
- job runs are failing or late;
- a `ClusterMember` heartbeat is stale;
- `MonitorServices.get#SourceStatus` reports telemetry loss.

Domain providers (Accounting, Products, Commerce, People and the rest) join through the readiness contract (§14).

**Actions and states:** Open health is primary for established instances; first-run setup links retain each owner's permission. One provider's failure leaves the rest visible and names the failed provider without its sensitive diagnostics. No generic Fix all action. **Source:** research §§1, 18. **Needs:** ADM-OPERATIONS, ADM-SETTINGS, ADM-SHELL.

## 4. Users and lifecycle

### 4.1 Identity contract

The canonical identity is UserAccount linked to Party. Admin handles staff account administration; Commons handles the user's own preferences, factors and credentials; People owns employment and confidential personnel information. UserDetail links Employee360 for its authorized audience; Admin does not mount Employee360. Employee360 links here with `partyId`/`userId` and returns to its authorized host. The Contact record links the same account forms for an authorized identity operator. These links convey no authority and expose no HR details by default.

**Service placement.** Identity work scoped to an organization uses Mantle's PartyRelationship and PartyRole, so it lives in proposed Mantle `mantle.party.IdentityServices`: users in scope, invitations, organization membership and lifecycle operations. The framework keeps only generic guards, in proposed `org.moqui.admin.IdentityServices`:
- `check#AdministrationPath`;
- `revoke#AccountAccess`, which revokes sessions, login keys, app passwords and SSH keys;
- `find#Sessions` and `revoke#Sessions`.

These framework services do not depend on Mantle. Group and grant governance stays in framework `org.moqui.admin.AccessServices`, since UserGroup is a framework record.

**Invitations.** Staff invitations are proposed Mantle `mantle.party.UserInvitation` records, separate from PASS PublicSiteInvitation. They bind a verified destination, party, organization membership and approved grant proposal to a single-use hashed token with expiry. Sending, resending and revoking are audited; a resend invalidates the previous token. The invitation email is an EmailTemplate of the existing EmailType `EMT_ACCOUNT_INVITE`; its link opens AcceptInvitation (`/i/<token>`). Acceptance requires proof of the invited address (the mailed token) and either an authenticated matching account or controlled account creation. Existing identities are matched explicitly; a similar name is never sufficient. Acceptance rechecks inviter delegation, target scope and current group grants. Invitation metadata cannot assign ADMIN, sealed rights or a new organization through a public redemption request. Tokens never appear in lists, logs, shell context or exported error files. When the instance cannot send mail (no SMTP host), InviteStaff's or a resend's result shows the acceptance link once, as plain text with a copy control rather than a link, for the inviter to pass on; showing it is audited, and the token is never stored in plain text or shown again (decided Nov 7, 2026; impl-admin §4).

Account-wide login/email changes, factor resets and credential revocation on an existing identity require identity-global authority (`ADMIN_IDENTITY_GLOBAL`, sealed) as well as the action's own permission. A delegated organization operator manages that organization's relationship and approved grants only. The account's owner may still perform the separately guarded Commons self-service actions. This prevents one employer's administrator from taking over an identity shared with another organization.

**Provisioning from People.** People commits a hire or employment change first. A proposed mr-boss SECA (`when="tx-commit"`) on proposed `mantle.humanres.PeopleServices.hire#Employee` and `apply#EmploymentChange` then calls proposed `ironstone.admin.LifecycleServices.request#Provisioning` or `request#AccessEnd`. The SECA lives in mr-boss, so Mantle does not depend on BOSS.
- **Key.** The request is keyed by partyId, organizationPartyId, employment key (the employment PartyRelationship), the approved grant proposal and the People operationKey. A retry with the same key returns the same operation, so it cannot create a second identity or invitation.
- **Steps.** The operation (proposed `mantle.party.UserLifecycleOperation`) records independent steps: account or invitation, organization membership, approved grants and notifications.
- **IT checklist task.** People's IT checklist task carries the lifecycle `operationId`, so completing the task links the account outcome.

Direct account creation remains for explicitly authorized service accounts and exceptional administration; it is not the default hire path.

**The BOSS users group.** Every BOSS app requires a UserGroup; `ALL_USERS` grants none (crosscut §1.4). Provisioning an internal user, by a staff invitation, a People hire or NewStaffAccount, adds `BOSS_USERS` ("IronStone BOSS users", which opens Commons, Comms and the Records drive) with the app groups of the approved grant proposal, and offboarding ends it with them; a PASS or e-commerce public account never receives it. Until Admin's Users screens are built, the paths are the tools' UserAccount screens (add the group membership there) and Mantle's `mantle.party.PartyServices.create#PartyUserAccount` with `userGroupId` `BOSS_USERS`, followed by the app groups.

**Passwords.** Admin never sets or mails a password an administrator chose. A reset uses existing `org.moqui.impl.UserServices.reset#Password`:
- it mails a random reset password through the `PASSWORD_RESET` template;
- that password can only be used to change the password, and the current password stays valid;
- it expires after `user-facade` `password` `email-expire-hours` (48 by default).

Setting another user's password needs the sealed `ADMIN_PASSWORD`.

**Offboarding.** Ending access to one organization differs from globally disabling the identity.
- **Preview.** It names grants, credentials, sessions, owned reports/alerts/jobs/agent triggers, shared mail resources and outstanding assignments.
- **Global disable.** It blocks authentication at once and revokes sessions, login keys, app passwords and SSH access through `revoke#AccountAccess`. A future effective date is written to `UserAccount.terminateDate`, so sign-in stops at that date without a job.
- **Organization removal.** It ends that organization's relationships and grants without touching unrelated access.

Pending runs and deliveries recheck authority. Audit and history stay. Owned report schedules and alert rules are paused through the Insights participant's admin-callable proposed `org.moqui.report.ReportServices.pause#OwnedSchedules(userId)`. They stay visibly paused until a qualified new owner accepts them through proposed `transfer#DefinitionOwner` (Insights INS-06/INS-07). Admin sees safe status only. Other resources move through their domain's registered participant service, never through generic Party reassignment. Disablement never authorizes deletion of personal contacts, messages, financial history or HR evidence; §12 applies.

### Users

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| UserFind | find | Find permitted accounts | name/email, organization, group, active/disabled/locked, invitation state | server search | — | Tools UserAccountList; Nextcloud users |
| UserList | list, read | Show identity and access summary | name, login, organizations in scope, account state, last login, invitations | useful mobile identity/state columns | proposed `mantle.party.IdentityServices.find#Users` | Tools UserAccountList; Odoo Users |
| NewStaffAccount | dialog | Create an exceptional direct account | party, login, email, organization, approved bundle, reason | existing-party picker; explicit confirmation | proposed `mantle.party.IdentityServices.create#StaffAccount`, which calls `mantle.party.PartyServices.create#PartyUserAccount` | Party/EditParty CreateUserAccount; Carbon employee users |

**Actions:** Invite users is primary; selecting an account opens UserDetail. Bulk disable opens a lifecycle preview and checks each identity independently. Public identities are visible only under explicit account authority and are labelled as site relationships, not internal app roles. **Source:** research §2. **Needs:** ADM-ACCESS, ADM-LIFECYCLE.

### UserDetail

**Layout:** account record header; Account, Access, Credentials, Sessions/history and Lifecycle tabs. The person/profile action opens the shared Contact record; Employee360 is offered only to its authorized audience.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Account | single | Maintain permitted identity fields | login, email, enabled state, scheduled end (`terminateDate`), allowed IPs (`ipAllowed`), require password change, locale/time zone, linked party | party link; state actions outside save | `mantle.party.PartyServices.update#PartyUserAccount`; proposed `mantle.party.IdentityServices.get#Account` | Party/EditParty UpdateUserAccount; Tools UserAccountDetail |
| Memberships | list; dialog | Review or change dated grants | group, organization context, from/thru, grant source | permitted bundle picker; expiry | proposed `org.moqui.admin.AccessServices.store#Membership`, `end#Membership` | Party/EditParty AddGroupForm, GroupsForm; Tools UserAccountDetail |
| Authentication | list, read; dialog | Reset or revoke permitted factors | factor kind, verified state, created/used dates | masked metadata; explicit reset | proposed `mantle.party.IdentityServices.reset#Authentication`, which checks scope and calls existing `org.moqui.impl.UserServices.reset#Password` or `invalidate#UserAuthcFactorEntry` | Tools UserAccountDetail factor/reset forms |
| AccessCredentials | list, read; dialog | Inspect and revoke credentials | credential kind, description, fingerprint, validity/last use | no secret recovery | proposed framework `org.moqui.admin.IdentityServices.revoke#AccountAccess`, for one credential or all; the existing UserServices `revoke#UserAccessToken`, `revoke#UserAppPassword` and `delete#UserSshKey` act only on the caller (impl-admin F3) | Commons Account and Projects GitAccess; Tools account detail |
| AccountHistory | list, read | Show relevant access events | event, actor, time, reason, safe link | bounded list; Monitor/Visit links | proposed `mantle.party.IdentityServices.get#AccountHistory` over UserLoginHistory, Visit and audit records | Tools UserAccountDetail login/history/tarpit sections |
| LifecycleActions | dialog | Preview disablement, organization removal or restoration | operation kind, scope, reason, effective date | consequences and per-step outcomes | proposed `mantle.party.IdentityServices.preview#Lifecycle`, `start#Lifecycle` | Tools enable/disable; People onboarding/offboarding |

**Actions and states:** Ordinary administration sends a reset request: the user receives the change-only reset password that `reset#Password` mails (§4.1). Setting a password for someone else requires the sealed `ADMIN_PASSWORD`. Login as requires `ADMIN_LOGIN_AS`, confirmation, recorded initiating/target actors and a visible impersonation indicator; it never bypasses the target's scope. Existing `enable#UserAccount`/`disable#UserAccount` are used inside the proposed lifecycle coordinator. Tarpit release is a separately guarded action naming the lock. Creating another user's reusable credentials requires explicit credential authority and a secure one-time handoff; default UI directs the user to self-service creation. No factor secret or recovery code is listed. **Source:** research §§2–4; People §4. **Needs:** ADM-ACCESS, ADM-LIFECYCLE, ADM-AUDIT.

### Invitations

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| InvitationFind | find | Narrow invitations | organization, invited email/name, state, expiry | safe search | — | Carbon resend/revoke invite; Twenty members |
| InvitationList | list; row actions | Track staff acceptance | recipient, party, organization, bundle summary, expiry, pending/accepted/revoked/expired | resend/revoke confirmation | proposed `mantle.party.IdentityServices.find#Invitations`, `resend#Invitation`, `revoke#Invitation` | Carbon invitations; OpenProject invited users |
| InviteStaff | dialog | Send one staff invitation | email, existing party, display name if new, organization, approved bundle, expiry, message | verified address; permission-limited bundles | proposed `mantle.party.IdentityServices.invite#User` | Twenty invitation; Nextcloud new-user dialog |

Bulk invite opens DataImport with the staff-invitations target (§11.1). Its fields are exactly email, optional existing-party match, display name, organization and approved bundle; expiry/message are batch options. Passwords, arbitrary permission IDs and privileged grants are rejected. Each row has an independent outcome and operation identity. **Source:** research §§2, 11. **Needs:** ADM-LIFECYCLE, ADM-IMPORT.

### AcceptInvitation

**Layout:** wizard on a token route, mr-boss `MoquiConf.xml` `<token-route name="i" screen-location="component://mr-boss/screen/AcceptInvitation.xml" token-service="mantle.party.IdentityServices.check#InvitationToken" title="Accept invitation"/>`, beside the existing `s`, `u`, `cal` and `r` routes. The token check runs before the screen and again in every transition. Steps: Invitation (who invited, organization, what access is proposed), Account (sign in to the matching account, or create one), Factor (when the bundle's groups require one), Done (opens the app the bundle grants).

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| InvitationSummary | display | Show what is being accepted | inviter, organization, invited address, bundle summary, expiry | no grant IDs | proposed `mantle.party.IdentityServices.get#InvitationSummary` | Twenty invite acceptance; OpenProject account activation |
| AccountChoice | wizard step | Sign in to the matching account or create one | sign in (existing account with the invited address); or username, display name, password, password verify | framework login transition; password policy hints | framework Login `login` transition; proposed `mantle.party.IdentityServices.accept#Invitation` (creates the account through `org.moqui.impl.UserServices.create#UserAccount` when none matches) | Carbon invite redemption; Nextcloud set-password page |
| FactorSetup | wizard step | Enrol a required factor | factor kind, verification code | TOTP enrolment of the framework SecondFactor screen | existing `org.moqui.impl.UserServices.create#UserAuthcFactorTotp`, `setup#UserAuthcFactorTotp`, `validate#UserAuthcFactorCode` | framework SecondFactor |

New-account fields are exactly username, display name, password and password verify; the email is the invited address and cannot be changed here. The token is single use: an accepted, revoked, expired or resent token shows "This invitation is no longer valid" with no detail. An existing account with a different address cannot redeem it. **States:** a wrong signed-in user is told to sign out first. **Source:** research §2; review R-ADM-04. **Needs:** ADM-LIFECYCLE.

### Sessions

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| SessionFind | find | Narrow session activity | user, organization, active/recent, date | user lookup | — | Tools ActiveUsers; Odoo devices |
| SessionList | list, read; bulk | Inspect and revoke authorized sessions | user, started/last seen, client summary, session state | opaque UI identity; revoke confirmation | proposed `org.moqui.admin.IdentityServices.find#Sessions`, `revoke#Sessions` | Tools ActiveUsers; Frappe active sessions |

One session definition serves Admin and Commons: proposed `find#Sessions`/`revoke#Sessions` join `moqui.server.HttpSession` to `moqui.server.Visit`. Commons Account "Where I am signed in" calls them self-scoped (the caller's own userId); Admin calls them with a target user under identity authority. Session cookies, tokens and serialized session contents are never returned. Revocation includes active browser connections through the framework; a stale websocket or job does not retain revoked authority.

**New-device sign-in notice.** A successful sign-in from a client (user-agent family and network) not seen in the user's UserLoginHistory and Visit records for 90 days sends a notice on a proposed private `AccountSignIn` NotificationTopic and by email, with time, client summary and a "Sign out that session" link to Commons Account. Proposed framework `org.moqui.admin.IdentityServices.notify#NewDeviceSignIn` runs after the login commits. It ships in A2. **Source:** research §§2, 4; Odoo `auth_totp_mail` (review ADM-F03). **Needs:** ADM-LIFECYCLE, ADM-AUDIT.

### LifecycleOperations

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| LifecycleFind | find | Narrow operations | account, organization, kind, state, date | scoped choices | — | Frappe background tasks; People checklists |
| LifecycleList | list, read | Show completed and blocked work | target, provisioning/offboarding, requester, source (People operation or Admin), progress, failures, next owner | detail link | proposed `mantle.party.IdentityServices.find#LifecycleOperations` | Frappe background tasks; new lifecycle composition |

**Source:** research §§2, 10; People hire contract (§4.1). **Needs:** ADM-LIFECYCLE.

### LifecycleDetail

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| LifecycleSummary | display | Explain the exact requested scope | target, kind, organization/global, requester, People operation key, reason, revision, state | immutable request summary | proposed `mantle.party.IdentityServices.get#Lifecycle` | People onboarding tasks; new orchestration |
| LifecycleSteps | list, read; row actions | Finish independent work | owner, step, target, outcome, retry/reassign link, reason | no payload; named confirmation | proposed `mantle.party.IdentityServices.retry#LifecycleStep`, which calls the step's Lifecycle participant action (§14) | Frappe task outcomes; existing job runs |
| TransferOwnership | dialog | Request an authorized replacement owner | step, new owner, reason | qualified-user lookup | proposed `ironstone.admin.LifecycleServices.transfer#OwnedResource`, which calls the participant's transfer service (Insights `org.moqui.report.ReportServices.transfer#DefinitionOwner`) | Insights schedule ownership; Commons shared resources |

The new lifecycle request's complete fields are target user/party, operation kind, scope organization or explicit global, effective date, reason, approved grant proposal, source reference/operation key and expected revision. Steps retain target identity, provider/action, state, attempt and reason, never duplicate domain records or secrets. Failed independent steps remain visible; access revocation does not roll back because an assignment transfer failed. Restoration does not reactivate old credentials or resume schedules automatically. **Source:** research §§2, 10, 13. **Needs:** ADM-LIFECYCLE, ADM-RETENTION.

## 5. Groups and access

### Groups

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| GroupFind | find | Find supported groups | name, app, permission, type | registered options | — | Tools UserGroupList |
| GroupList | list, read | Show grant bundles | name, description, members, app gates, privileged marker, sealed-permission marker | detail link; no misleading “administrator” shortcut | `org.moqui.admin.AccessServices.find#Groups` | Tools UserGroupList; OpenProject roles |
| CreateGroup | dialog | Create a custom nonprivileged group | identifier, description, registered purpose | unique identifier and purpose options | `org.moqui.admin.AccessServices.create#Group` | Tools group form; Dolibarr groups |

The privileged marker reads the effective `privileged-groups` list and the sealed marker the effective `sealed-permissions` list (§1.1; `UserSecurityChecks.privilegedGroups()` and `sealedPermissions()`), so the list shows why an Add member or Grant action is refused. A registered purpose is a `UserGroupType` Enumeration with `optionIndicator` Y (the framework seeds Team, Job role and Project or initiative); a group of one is a custom group, which takes memberships and grants beside the registered bundles (built in impl-admin P3). In the first release `ADMIN` users can also use Tools System › Security for anything this delegated screen does not offer. **Source:** research §3. **Needs:** ADM-ACCESS.

### GroupDetail

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| GroupProfile | single | Maintain safe metadata/policy | description, purpose, factor required, allowed IPs | policy validation | `org.moqui.admin.AccessServices.store#Group` | Tools UserGroupDetail |
| GroupMembers | list; dialog | Assign dated memberships | user, from/thru, scope, source | server-search users; bulk preview | AccessServices `store#Membership`, `end#Membership` | Tools GroupUsers |
| GroupCapabilities | list; dialog | Assign supported named permissions and app gates | app, permission/bundle, dates, scope dependencies | effective changes preview | `org.moqui.admin.AccessServices.preview#Grants`, `apply#Grants` | Frappe Role Permission Manager; Tools group permissions/authz |
| GroupPreferences | list; dialog | Maintain registered group defaults | key, typed value, effective source | definition-driven input | AccessServices `store#GroupPreference` | Tools UserGroupDetail preferences |

A grant change rechecks delegation and current revision, records before/after and invalidates the affected authorization caches. The actor cannot remove the final usable administration route or smuggle a sealed permission through a bundle: a membership in a group that grants a sealed permission is given only by a holder of it. Direct user edits, imports and SSO role mappings use the same guards. As built (impl-admin P3): the screen reads the group with `get#Group` after the Admin record check; GroupMembers lists the members who work for the organizations the user administers, counting and never naming the others, and checks each added or ended member as an Admin member record before `store#Membership` or `end#Membership`; GroupCapabilities grants from a registered bundle (the whole bundle, one permission or its launcher binding; a privileged group's bundle only for a member of that group, so `BOSS_ADMIN_BACKUP`'s or `BOSS_ADMIN_ACCESS`'s powers are not copied to a custom group) and shows `preview#Grants`' effect, applied as one change at the previewed grant revision; a preference key is a `UserPreferenceKey` Enumeration whose `optionValue` types it (indicator, boolean, number, text). The Access area opens to the access administrator and the administrator (`BOSS_ADM_ACCESS`). **Source:** research §§3–4. **Needs:** ADM-ACCESS, ADM-AUDIT.

### Capabilities

**Layout:** app/capability rows with selected groups as columns; a list view carries the same editable choices for small devices and TUI. Launcher, record view, mutation, export and sensitive-field permissions are distinct rows. Unsupported artifact rules appear as advanced/read-only entries rather than lossy checkboxes.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| CapabilitySelection | find | Select apps, groups and actions | app, groups, domain, grant kind | bounded group selection | — | OpenProject permissions report |
| CapabilityMatrix | list, editable rows | Propose supported grant changes | capability, permission, group, current/proposed grant, scope dependency | list/matrix views | AccessServices `preview#Grants`, `apply#Grants` | Frappe permission manager; Redmine matrix |

The registry is descriptive metadata over existing permissions/artifacts, not another evaluator. Checkboxes never infer CRUD rights from a launcher grant or infer view from edit. Effective access may still be refused by record policy, an explicit deny, factor/IP constraints or organization scope; the Inspector explains that distinction. **Source:** research §§3, 6. **Needs:** ADM-ACCESS.

### AccessInspector

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| InspectAccess | single | Ask a bounded authorization question | user, registered operation or screen, action, organization, optional target key, effective time | permitted operation picker | proposed `org.moqui.admin.AccessServices.explain#Access` | Frappe Permission Inspector |
| AccessReasons | list, read | Explain evaluated and unresolved checks | permission/grant, validity, artifact result, row/domain restriction, final verdict | safe reason codes and source links | `explain#Access` (same call) | Frappe inspector; Moqui artifact authorization |

AccessInspector is `later` (review Z5); until it ships, Capabilities and GroupDetail show grants and the sealed and privileged markers. The inspector performs no target operation and returns no target record data. Use the actual framework evaluator plus a registered nonmutating domain explanation hook; where a dynamic business rule cannot be evaluated safely, label it “requires the record operation” rather than claiming allow. Inspecting another user's access requires target/delegation scope and is audited. **Source:** research §3. **Needs:** ADM-ACCESS, ADM-AUDIT.

### RowRules

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ScopeRules | list, read | Explain effective restrictions | filter set, app binding, organization/private-contact meaning, source | owner/source links | proposed AccessServices `get#ScopeRules` | Tools ArtifactGroupDetail; EntityFilterSet |
| SupportedScopeBinding | dialog | Bind a registered scope policy | group, app/artifact group, approved filter set, revision | fixed registry options | AccessServices `preview#Grants`, `apply#Grants` | Tools artifact-authz filters |

Arbitrary filter expressions, disabling security filters and raw entity-rule editing remain advanced Tools/deployed configuration. Insights dataset row filters are separately explicit: entity filters are not automatically translated into indexed report queries. **Source:** research §3; Insights INS-03. **Needs:** ADM-ACCESS.

## 6. Security and sign-in

### SignInPolicy

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| EffectiveSignInPolicy | display | Explain effective password/session/lockout settings | rule, value, configuration source, runtime/restart effect | masked effective-config view | proposed `org.moqui.admin.ConfigurationServices.get#EffectiveSettings` | Frappe System Settings; Moqui user-facade conf |
| GroupSignInRules | list, editable rows | Manage supported group requirements | group, require factor, allowed IPs | validation and lockout preview | AccessServices `store#Group` | Nextcloud group 2FA; UserGroup flags |

Password/session/listener policies are not silently copied to database rows. Read-only conf values include the configuration key and operator instructions. A runtime-editable password policy and a per-group inactivity timeout are not designed here; both are in Open (§19). Validate an available administration path before restrictive changes. Factors remain managed on UserDetail or Commons self-service. **Source:** research §4. **Needs:** ADM-ACCESS, ADM-SETTINGS.

### IdentityProviders

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ProviderList | list, read | Show sign-in providers | name, OAuth/OIDC/SAML, enabled, callback, readiness | detail/status link | proposed `org.moqui.admin.ConfigurationServices.find#IdentityProviders` | Frappe Social Login Key; AuthFlow |
| NewProvider | dialog | Start a supported provider | name, type, description | fixed supported types | proposed ConfigurationServices `store#IdentityProvider` | Carbon SAML setup |

**Source:** research §4. **Needs:** ADM-ACCESS, ADM-CONNECTIONS.

### IdentityProviderDetail

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ProviderConfiguration | single | Configure subtype fields | issuer/metadata, client ID, callback, endpoints, signature requirements, disabled | subtype form; write-only credential replacement | ConfigurationServices `store#IdentityProvider` | AuthFlow/OidcFlow/OauthFlow/SamlFlow; Carbon SAML |
| IdentityMappings | list, editable rows | Map identity claims | remote claim, local allowed field, matching rule | no arbitrary expressions | `store#IdentityProvider` over AuthFlowFieldMap | Frappe login field mapping |
| RoleMappings | list, editable rows | Map approved remote roles to staff grants | remote role, approved group, organization policy | delegated-group picker; privilege preview | `AccessServices.preview#Grants`, then `store#IdentityProvider` over AuthFlowRoleMap | AuthFlowRoleMap; OpenProject SSO roles |
| ProviderCheck | display; dialog | Verify configuration without broad provisioning | metadata/connectivity result, callback, test identity, mapped grant preview | explicit test, no hidden account creation | proposed ConfigurationServices `test#IdentityProvider` | Carbon connection checks; Nextcloud LDAP wizard pattern |

Saving a provider cannot bypass privileged membership or assignment delegation. Linking an existing user requires controlled matching and verified identity, not trusting an arbitrary remote email claim. Changing an issuer, metadata URL, endpoint or client ID follows the connection rule of §8.1: the client secret must be entered again and the provider stays disabled until ProviderCheck passes against the new endpoint. Test errors omit tokens and assertions. LDAP/directory provisioning is later; the existing OAuth/OIDC/SAML runtime is the scope. **Source:** research §4. **Needs:** ADM-ACCESS, ADM-CONNECTIONS, ADM-AUDIT.

### Devices

**Layout:** list of shared devices (kiosks, shop-floor tablets, check-in stations) with the route group each may open, its site, last seen and state. The device credential is a framework need (CX-DEVICE): a revocable credential tied to one browser and limited to one route group, which app passwords cannot do because they never sign in to the web. Devices ships with that need in Insights' second release, for Insights' wall displays (Playlists; impl-admin §4); People ClockingKiosk, Maintenance TechnicianKiosk, Marketing CheckIn and Manufacturing ShopFloor register their route groups when their apps, or Manufacturing's shared-station operator switch, are built.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| DeviceFind | find | Narrow devices | site/facility, route group, state, last seen | — | — | Odoo IoT boxes; Frappe POS profiles |
| DeviceList | list, read; row actions | Show and revoke devices | name, route group, facility, registered by, registered, last seen, state | revoke confirmation | proposed `org.moqui.admin.DeviceServices.find#Devices`, `revoke#Device` | Odoo devices; Nextcloud devices |
| RegisterDevice | dialog | Register one device | name, route group (registered by the owning app: Insights wall display first; later People kiosk, Maintenance kiosk, Marketing check-in, Manufacturing shop floor), the playlist a wall display plays, facility, idle timeout | registration code shown once, entered on the device | proposed `org.moqui.admin.DeviceServices.register#Device` | Frappe POS opening; Odoo IoT pairing |

The registration code is shown once and never stored in plain text. A device credential opens only its route group and identifies no person. Each action on the device identifies its person by badge `scan-input` and PIN, as the owning app designs it (People PE-05 owns kiosk identity). A wall display takes no action but reads as someone; that principal is open (§19 item 7). Registering and revoking a device need `ADMIN_ACCESS_MANAGE`, the access administrator's (§2). Revoking a device ends its sessions at once. **Source:** review L5 (CX-DEVICE). **Needs:** ADM-DEVICES.

## 7. Organizations and settings

**Maps configuration (proposed, CX-MAPS):** register the canonical Tools Maps configuration screen in SettingsHome,
linking [framework Maps](../../../../plans/Maps.md) rather than copying its provider/layer/postal-import forms.
Installation administrators manage global profiles, OpenFreeMap/self-hosted resources, outgoing-service policy and
dataset readiness; users manage their own permitted preferences. Organization delegates may select an authorized
profile for their app context without changing installation policy or reading provider secrets. Organization contact
addresses gain the shared **View map** action under [crosscut §3.32](design-crosscut.md#332-maps-and-record-location-dialogs).
Maps keeps its own view/configuration grants, separate from Monitor and the Admin launcher. Both wait for the framework Maps configuration screen, which is not built (impl-admin F22).

### SettingsHome

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| SettingsFind | find | Find a setting by purpose | text, organization, app, configure/read | authorized choices | — | Carbon settings hub |
| SettingsIndex | list, read | Open canonical owner forms | title, owner, scope, effective source, readiness, link | Company / Applications / Instance groups | proposed `ironstone.admin.RegistryServices.find#Settings` | Carbon Modules/System; Nextcloud registered sections |

**Context passed:** every app may link this index with a fixed app filter. Its entries are the seed table of §14.2. Registry visibility requires the destination's own view permission: an entry shows only when the viewer's own groups open its destination screen path, as the framework decides it, and its view permission, if any, holds (impl-admin P2). Enabling an app is granting supported access, not installing a module. A destination must be mounted or linked so the appropriate domain permission can open it without requiring another launcher grant.

**Reached without Admin (impl-admin F46).** `BOSS_USERS` has a non-inheritable `AUTHZT_ALLOW` on SettingsHome alone (with the root's context service, which answers such a user the index's link and no capability, and `find#Settings`), so a warehouse manager in no Admin group opens the index and, from it, Warehouse's settings. The grant is not inheritable, so it opens nothing below or beside SettingsHome (impl-admin F34); the Admin root, Home, the other areas and every other `ironstone.admin` service still refuse that user, and the launcher shows no Admin. **Source:** research §§5–6, 16; crosscut §5. **Needs:** ADM-SETTINGS, ADM-SHELL.

### Organizations

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| OrganizationFind | find | Find internal organizations | name, identifier, parent, active | tree/list switch | — | Vendor/FindVendor FindVendor |
| OrganizationList | list, read | Show permitted internal organizations | name, parent, readiness | record link | proposed `mantle.party.IdentityServices.find#InternalOrganizations` | Vendor/FindVendor VendorList |
| CreateOrganization | dialog | Create an internal organization profile | name, parent, tax identifier where relevant, locale, contact | parent lookup; no accounting side effect | `mantle.party.PartyServices.create#Organization`, `ensure#PartyRole` (OrgInternal); proposed `mantle.party.IdentityServices.store#OrganizationParent` | Vendor/FindVendor CreateVendor |

Organizations lists parties with PartyRole `OrgInternal` only: legal internal organizations. A parent link joins two OrgInternal parties. Departments (`OrgDepartment`) and teams (`OrgTeam`) are People's, in its OrgStructure. Creation does not initialize accounting, grant memberships, clone secrets or rewrite currency automatically. Those steps are separately authorized owner actions in setup readiness. **Source:** research §5. **Needs:** ADM-SETTINGS, ADM-ACCESS.

### OrganizationDetail

**Layout:** shared organization/Contact profile with Identity, Contacts, Members, Defaults and Setup links. Defaults includes a scoped link to [Constitution](#constitution), showing whether the organization inherits the global document or has a customization; it opens the canonical settings screen, not another editor. Financial settings, balances and People structure are owner links, not implicitly visible tabs.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| OrganizationProfile | single | Maintain identity and approved roles | name, tax identifier, parent, logo, internal role | shared Contact widgets | `mantle.party.PartyServices.update#PartyDetail`, `ensure#PartyRole`; `store#OrganizationParent` | Vendor/EditVendor EditVendor, RoleList; shared Contact |
| OrganizationContacts | single; dialog | Maintain registered addresses/contact points | purpose, postal/telecom/email details, validity | shared contact forms | `mantle.party.ContactServices.get#PartyContactInfo`, `store#PartyContactInfo` | Vendor/EditVendor PaymentInfo, BillingInfo; Party contact forms |
| OrganizationMembers | list; dialog | Maintain authorized staff relationships | user/party, role, from/thru, representative | user lookup; dated changes | proposed `mantle.party.IdentityServices.store#OrganizationMembership`, which writes dated PartyRelationship rows | Vendor/EditUsers AddUserRelationshipForm, UpdateUserRelForm; EditVendor SetVendorRepForm |
| OrganizationDefaults | list; dialog | Maintain registered organization defaults | setting type, typed value, current source, revision | definition-driven inputs; owner links for dated policies | `mantle.party.PartyServices.get#PartySettingValue`, `store#PartySetting`, `validate#PartySetting` | Party/EditParty AddSettingForm, AddSettingTextForm, SettingsForm; typed PartySettingType |
| SetupLinks | list, read | Reach accounting, workforce and operational setup | owner, readiness, action, scope | registry links | `ironstone.admin.RegistryServices.get#Readiness` | Vendor/EditVendor initialize-accounting link; domain settings |

**Context passed:** the Contact profile receives canonical `partyId`, internal-organization context and permitted profile actions. Financial address forms remain contact purposes; payment instruments and actual bank values stay Accounting. The existing `mantle.ledger.LedgerServices.init#PartyAccountingConfiguration` is reached through Accounting's reviewed setup action, not triggered by an Admin save. Organization structure/employee assignments remain People-owned. **Source:** research §§5, 16–17. **Needs:** ADM-SETTINGS, ADM-ACCESS.

User-organization membership and the `RepVendor` representative are dated PartyRelationship records; they are not UserGroupMember rows. Current PartySetting is keyed by party and setting type and has no effective dates. This form edits registered current defaults with concurrency/audit checks; a setting with dated business meaning links its owner's effective-dated policy editor instead of pretending PartySetting already carries that history.

### Constitution

**Nov 7, 2026:** the runtime, Mantle's organization services and the framework's base screen are built
([mr-moqui docs/ai/Constitution.md](../../../../docs/ai/Constitution.md)). System › Constitution administers the global
(instance) document and the trusted origins; this Admin screen extends it for organization scope, calling Mantle's
`mantle.party.ConstitutionServices` (`get#`, `store#`, `reset#OrganizationConstitution`) directly and reusing the
framework's `edit#ConstitutionDocument`, `validate#Constitution`, `preview#ConstitutionPrompt` and
`tools/template/ConstitutionParts.xml`. Permissions as built: global changes need the sealed `ADMIN_CONSTITUTION_GLOBAL`;
organization changes need Mantle's `ORG_CONSTITUTION_EDIT` within the organization's scope, with Admin's
`ADMIN_SETTINGS_MANAGE` as its screen check. An organization's JSON is in the resource `contentLocation` names, not
`description`.

**A1 (ADM-CONSTITUTION).** The [Assist Constitution design](../../../../plans/LLM-A2A-Assist.md#710-constitution-proposed-1315) owns the JSON format, inheritance, agent behavior and run lifecycle. Its [shipped default](../../../base-component/framework/docs/Constitution.json) contains en/es/zh text and 37 anchored references for review; the loader, writer, reference service and viewer and System › Constitution are built (Nov 7), and this Admin screen is A1 (impl-admin P7). This is shared guidance for people and agents, so Admin owns this screen while framework agent configuration stays in System/Llm.

**Layout:** an XML settings screen with an authorized Global / Internal organization scope selector, an effective-source banner, a language selector, a readable rule/reference list, and a localized agent-instructions preview. The active internal organization is selected initially when authorized. OrganizationDetail supplies that organization's scope; AgentsHome links the same canonical screen. Signed-in users may read the global document; organization members and authorized organization administrators may read their effective document. The screen has a scoped read entry independent of the general Admin launcher grant, so people can read their Constitution without acquiring administration privileges. Services enforce the same read boundary for direct calls.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ConstitutionScope | single, read | Choose authorized scope and show the effective source | global/organization, name, inherited/customized, source/hash, last change attribution, fallback diagnostic | authorized organization choices; source banner | framework `ConstitutionServices.get#Constitution` (global); Mantle `get#OrganizationConstitution` | InstanceSettings ConfigurationSources; OrganizationDetail |
| ConstitutionLanguage | single, read/edit | Select reading/editing language | requested locale, document default locale, translation completeness and actual fallback locales | locale selector; missing-translation indicators | framework localized document resolver; draft preview | mr-l10n locale/voice conventions; text stays in JSON |
| ConstitutionRead | list, read | Read the guidelines that apply | localized document title/provenance; ordered rule ID, title, human description and references | readable text; trusted reference dialog links | resolved document from ConstitutionScope | new; shared JSON contract |
| ConstitutionEdit | single | Edit one complete document in the selected scope | default locale, localized document title/provenance/shared agent instructions, expected revision/hash | Customize, Save; validation messages; draft initialized from effective source | framework `store#Constitution` (global); Mantle `store#OrganizationConstitution`; framework `edit#ConstitutionDocument`, `validate#Constitution` | OrganizationDefaults; new document editor |
| ConstitutionRules | list; rule dialog | Add, edit, remove and reorder rules in that draft | stable ID, localized title/human description/agent instructions, order | Edit rule dialog; move/add/remove actions; one identity across languages | same document save; no independent per-rule persistence | XML list/dialog conventions; new |
| ConstitutionReferences | list; reference dialog | Edit supporting links for a rule | stable reference ID, localized title, shared URL, order | add/edit/remove/move; destination validation; preserve fragments | same whole-document validation/save; read-only `get#ConstitutionReferences` for Assist | shared framework reference contract; no per-reference persistence |
| ConstitutionReferenceViewer | dialog, read | Read approved supporting content in the app | localized title, source, iframe, unavailable/help state | shared framework dialog; Escape/Close and focus restoration | server-resolved authorized reference metadata; current origin and scope checks | Assist §7.10; reusable outside this screen |
| ConstitutionPromptPreview | read | Show exactly the proposed localized system-prompt section | shared instructions, ordered rule IDs/titles/instructions and retrieval hint; actual fallback locales, character and byte counts | preview refreshed from draft/language; human prose/provenance/reference catalogue excluded | framework `ConstitutionServices.preview#ConstitutionPrompt` | Assist §7.10 deterministic rendering |
| ConstitutionReset | dialog | Remove the customization and resume inheritance | target scope, expected revision/hash, resulting source | named confirmation: Use global Constitution / Use shipped Constitution | framework `reset#Constitution` (global); Mantle `reset#OrganizationConstitution` | settings reset confirmation; new |

**Storage and inheritance:** Global edits create/update `runtime/conf/Constitution.json` relative to the active runtime; the shipped `component://framework/docs/Constitution.json` remains unchanged. Organization edits use one `mantle.party.PartyContent` row of type `PcntConstitution`, the full JSON in the resource its `contentLocation` names (as built Nov 7; impl-admin F20). An organization customization starts as a copy of the effective global document and replaces it in full; later global edits do not merge into it. Reset removes only that scope's customization. Preserve all locale maps, both text variants, references and extension metadata; titles, descriptions and instructions are ordinary text, never executable content. English, Spanish and Simplified Chinese are complete in the shipped schema-version-1 document. Each language shares rule/reference IDs, ordering and URLs; translating does not create another rule or document. Stable IDs remain with their rules through edits and moves; new rules and references receive fresh IDs, and deletion does not renumber the others. The complete default text lives only in the JSON, not in this design or seed data.

**Languages and references:** initially read in the user's locale, with exact normalized locale → base language → document default fallback as specified in Assist §7.10. Show each fallback's source language and translation completeness; never merge translations from an overridden global source. Editing selects actual locale fields, not the displayed fallback values: a missing translation is visibly missing and may be added or removed without overwriting the default language. Require complete default-language text; optional translations may be absent. Preserve other languages and unknown fields on save, and call attention to translations that need review after default text changes without automatically rewriting them. The locale selector also controls prompt preview; changing it does not edit the user's account locale. These long texts do not use `LocalizedMessage` rows or require installed mr-l10n packs.

References have localized descriptive titles and shared URLs; the default supplies two or three per rule, but editors may remove all references from a custom rule. The framework-owned Assist Constitution / Rules view is another primary reading/reference surface, independent of this Admin screen and its editing permissions (Assist §4.11/§7.10). Open recognized links through the shared framework iframe dialog, including links in that panel view and links Assist cites from a run snapshot. It preserves the fragment and the app route, shows title/source, supports keyboard close/focus restoration, and displays unavailable content without automatically navigating away. The destination retains its own language selection. Internal references must be authorized and explicitly frameable read-only content; being same-origin does not authorize another organization's content. Historical links retain their reference metadata but are subject to current permissions and origin policy.

The instance reference-origin allowance initially contains exactly `https://grok-the-rock.org`; same-origin internal references are separately supported. Show policy status alongside reference validation. Organization editors cannot add trusted origins, and this screen links System › Constitution's Origins (`get#`/`store#ReferenceOrigins`) rather than editing them. Instance policy changes require `ADMIN_SETTINGS_MANAGE` and sealed `ADMIN_CONSTITUTION_GLOBAL`, expected policy revision and change attribution. Policy persistence belongs to framework instance configuration, outside the Constitution file and PartyContent, and survives a document reset. This is not CORS `allow-origins` or the generated-canvas external-content flag. The viewer, host CSP integration and target framing requirements follow Assist §7.10; source anchors are prepared in the separate personal repository, but live publication/embedding remain deployment checks.

**Authority and writes:** organization save/reset requires `ADMIN_SETTINGS_MANAGE` plus target-organization authority; global save/reset additionally requires the separate sealed `ADMIN_CONSTITUTION_GLOBAL`. A reader sees the effective document and preview without editing controls. `AgentAdmin` alone grants no Constitution editing rights. Framework `org.moqui.admin.ConstitutionServices` owns localized document validation, prompt preview, global get/store/reset and read-only `get#ConstitutionReferences`, plus the shared reference viewer and separate instance origin policy. Mantle `mantle.party.ConstitutionServices` owns organization get/store/reset and supplies the runtime provider, reusing the framework format validator and existing PartyContent operations. These service families are built (Nov 7; mr-moqui `docs/ai/Constitution.md`). BOSS calls them directly after its screen context checks, with no pass-through writer.

Validate a whole document before saving; reject duplicate/missing rule/reference IDs, incomplete default-locale text, malformed locale maps/URLs and unsupported versions with field/rule/locale-specific feedback. A new or changed destination outside the instance origin allowance needs a field-specific error, not an automatic trust grant. Missing optional translations use visible fallback. An unreachable link or subsequently revoked origin is unavailable without invalidating usable guidance; no save depends on fetching an external site. Use expected revision/content hash for both save and reset. A stale editor reloads/reconciles the current document instead of overwriting it. Keep the previous document intact on validation or write failure; use an atomic instance-file replacement and transactional organization writes. Record actor, scope, time and before/after hashes through existing administrative audit facilities. Show the effective source and any invalid-source fallback diagnostic, including when an existing customization was skipped; never present fallback as a successful save. The preview shows the full text and size, without silently truncating instructions.

**Agent meaning:** describe the rule-specific acknowledgement behavior beside the preview: Assist cites the affected rules and proposes an alternative; the requesting human can explicitly reference each rule and direct that particular action anyway. A generic confirmation, tool result or another agent's consent claim does not suffice. Existing permissions and tool approvals still apply. Document and initiating-locale changes become effective on the next agent run; the current run retains its scope, locale and snapshot. Reference retrieval uses that same snapshot; opening its links still requires current access and origin approval. This screen configures guidance, not a deterministic moral enforcement engine. **Source:** the approved Constitution extension, Assist §7.10. **Needs:** ADM-CONSTITUTION, CX-ASSIST.

### InstanceSettings

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| InstancePresentation | single | Maintain nonsecret instance presentation defaults | display name, approved theme/logo, locale, time zone, date/number format | existing theme/locale choices | proposed ConfigurationServices `get#EffectiveSettings`, `store#InstancePreference` | Nextcloud theming; OpenProject System settings |
| ConfigurationSources | list, read | Explain inherited and locked values | key, effective value, source, override allowed, restart needed | source labels | ConfigurationServices `get#EffectiveSettings` | Twenty config view; current agent effective config pattern |

New InstancePreference fields are registered key, typed value, expected revision and change reason; the record adds changed-by/time. The registry fixes scope, type, allowed values and default. No arbitrary key or JSON/code editor. Organization currency, workweek and fiscal meaning come from their owning policies, not a global currency here. User locale/time zone overrides presentation only; business dates retain owner semantics. TLS/master secrets and executable endpoints are never instance preferences. **Source:** research §5. **Needs:** ADM-SETTINGS.

### Localization

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| LocalizationFind | find | Select translation work | locale, message/entity, text, missing | server search | — | Tools Localization/Messages, EntityFields |
| MessageTranslations | list, editable rows | Maintain localized messages | original, locale, translation | multiline text | proposed `org.moqui.admin.ConfigurationServices.store#LocalizedMessage` | Tools Messages forms |
| EntityTranslations | list, editable rows | Maintain supported entity labels | entity, field, key, locale, translation | registered label targets | proposed `ConfigurationServices.store#LocalizedEntityField` | Tools EntityFields forms |

This delegated screen is for the configuration administrator (C) without `ADMIN`; in the first release `ADMIN` uses Tools System › Localization (§13 System). Translation access does not grant arbitrary access to sensitive entity values. Only registered translatable labels are offered; placeholders are validated before save. **Source:** research §5. **Needs:** ADM-SETTINGS, ADM-AUDIT.

### ReferenceData

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ReferenceOwners | list, read | Route reference changes correctly | kind, owner, scope, view/edit eligibility, link | categorized owner links | RegistryServices `find#Settings` | Dolibarr dictionaries; Tools StatusFlows |

Products owns noncurrency UOM editing with framework ADMIN writes; Accounting owns currencies, tax/posting and numbering policy; apps own their statuses/types/approval rules. Generic status-flow/Enumeration/DbForm/DbView editors remain Tools destinations where authorized. This screen does not allow changing a posted transaction's meaning by editing its status or unit. Custom fields and layout authoring remain later owner-defined capabilities, not a generic model editor promised here. **Source:** research §§5, 7. **Needs:** ADM-SETTINGS.

## 8. Integrations and system messages

### 8.1 Connection and recovery boundary

**Ownership (review Z4).** Admin Connections owns the gateway, remote and OAuth configuration records: their endpoints, service names and credentials. These are the native `PaymentGatewayConfig`, `ShippingGatewayConfig`, `TaxGatewayConfig`, `SystemMessageRemote`, EmailOAuthProvider and NetworkPrinter records, used directly rather than copied into a universal Connection entity. A registry gives them a common list/detail presentation and registered operations. New fields are added to the native record only when necessary.

Accounting, Warehouse and Commerce own the bindings and the selection:
- Accounting: the payment method and gateway binding (PaymentMethods), the tax gateway selection (Tax), and payment and tax business rules;
- Warehouse: carrier and shipment-method bindings, and facility printer bindings (FacilityPrinter);
- Commerce: store options. It offers only the store organization's enabled `PaymentGatewayOrganization` rows.

Provider URLs and executable service names are configuration authority, never inputs on a finance, warehouse or store form.

**Organization availability.** Admin provisions `PaymentGatewayOrganization`, the only organization-availability record that exists, and OrganizationAvailability covers payment gateways only. Shipping, tax, mail and remote connections are available to every organization the binding owner permits; a general availability record for them is later, if a deployment needs one.

**Credentials.** Reads return masked credentials, provider identity, allowed organization use and readiness. A credential replacement is write-only and audited, and an explicit test follows it. Existing encrypted connection fields remain encrypted. Deployment keys remain configuration/environment; this is not a new credential-vault implementation.

**Endpoint change (review Z1).** A change to any endpoint, host, URL, port or auth-type field of a connection clears the stored secrets that depend on it, or requires them to be entered again in the same save. Examples: a gateway's endpoint, a remote's `sendUrl`, a relay's `smtpHost`/`smtpPort`/`authTypeEnumId`, a provider's issuer. The connection is saved disabled and stays disabled until an explicit test against the new endpoint passes. The audit records before and after values, with secrets masked. Without this rule an administrator could point a stored password or token at a host of their choosing without ever reading it.

SystemMessage/job retry is an owner action, not permission to repeat a business effect. A registered recovery descriptor names original operation identity, evidence, eligible states, required permission, reconciliation action and safe retry action. Payments, carrier labels, stock postings, promotional submissions and external channel imports retain their domain rules. Unknown external outcomes must be reconciled before resubmission. Transport attempts, business acceptance and settlement are separate states. Independent items continue after a named failure; a dependent posting remains atomic.

### Connections

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ConnectionFind | find | Find permitted infrastructure | kind, provider, organization, readiness | registry choices | — | SimpleScreens Gateway find screens; Carbon integrations |
| ConnectionList | list, read | Show native configuration records | name, kind (payment, shipping, tax gateway, remote, OAuth provider, printer), organizations, endpoint summary, last check, status | masked data | proposed `org.moqui.admin.ConfigurationServices.find#Connections` | Gateway PaymentGatewaysForm, ShippingGatewaysForm; MessageRemoteList |
| NewConnection | dialog | Start a registered provider configuration | kind, name, approved provider type, organization | registered adapters only | proposed ConfigurationServices `store#Connection` | Gateway NewPaymentGatewayForm, NewShippingGatewayForm |

Network printers (`moqui.basic.print.NetworkPrinter`) are a connection kind with a test print of a fixed page through `org.moqui.impl.PrintServices.print#Document`. Today they are reachable only in Tools System › Print. Warehouse binds them to facilities. **Source:** research §8; Accounting implemented gateway boundary. **Needs:** ADM-CONNECTIONS.

### ConnectionDetail

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| NativeConnection | single | Edit the native registered configuration | provider-specific endpoint, account, transport, enabled, credential replacement | adapter form; masked/write-only secrets; endpoint change asks for the secret again | ConfigurationServices `get#Connection`, `store#Connection` invoking native guarded writers | EditPaymentGatewayForm; EditShippingGatewayForm; MessageRemoteDetail |
| OrganizationAvailability | list; dialog | Permit a payment gateway's use by an organization | organization, gateway, effective dates, enabled | organization lookup; no arbitrary party grant; shown for payment gateways only | proposed ConfigurationServices `store#PaymentGatewayOrganization` over `PaymentGatewayOrganization` | Accounting implemented-contract addendum; new binding UI |
| ConnectionChecks | list, read; dialog | Test infrastructure without business mutation | check, time, result, safe diagnostics, trace link | explicit external-test confirmation | proposed ConfigurationServices `test#Connection` | Carbon integration checks; EmailServices test |
| Consumers | list, read | Explain where this configuration is used | owner, record, use, readiness, link | permission-aware references | proposed ConfigurationServices `find#ConnectionConsumers` | Carbon sync activity; settings index |

The new availability form's full inputs are gateway config key, organization, from/thru, enabled flag, expected revision and reason. Changing credentials or availability does not silently alter a store or payment method. In-use removal is refused or ended prospectively; unresolved operations keep their original binding reference for reconciliation. A failed `test#Connection` after an endpoint change leaves the connection disabled. **Source:** research §§8–9; crosscut §5. **Needs:** ADM-CONNECTIONS, ADM-AUDIT.

### Webhooks

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| WebhookFind | find | Find subscriptions | event, owner, organization, enabled, delivery state | registered event choices | — | OpenProject webhooks |
| WebhookList | list, read | Show outbound subscriptions | name, event, scope, destination summary, status, last outcome | detail link | proposed `org.moqui.admin.IntegrationServices.find#Subscriptions` | Frappe Webhook; Carbon webhooks |
| NewWebhook | dialog | Start a supported event subscription | name, event type, scope, approved remote | constrained selectors | proposed IntegrationServices `store#Subscription` | OpenProject outgoing webhook form |

Webhooks and WebhookDetail are `later` (review Z5). Repository webhooks remain Projects-owned; agent push callbacks remain framework-owned. They may appear as read-only registered entries with owner links, not converted into new generic subscriptions.

**Event source.** An event is a registered DataDocument with a real-time push DataFeed (`DTFDTP_RT_PUSH`, after commit, `feedReceiveServiceName`). The feed's receive service writes one SystemMessage per matching subscription. This replaces the framework's commented-out `SystemMessageHook` sketch in `ServiceEntities.xml`. The first events are order placed, order approved, invoice finalized, shipment shipped and payment received. Each owner registers its event's DataDocument and the fields a subscriber may receive. **Source:** research §8. **Needs:** ADM-CONNECTIONS.

### WebhookDetail

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Subscription | single | Maintain supported event delivery | event, organization/record scope, registered condition, remote, enabled, retry policy | no script/SQL condition | IntegrationServices `store#Subscription` | Frappe Webhook; OpenProject webhook form |
| DeliveryList | list, read | Show transport outcomes | event identity, message, attempt, time, response class, state | redacted headers/body; owner link | proposed IntegrationServices `get#Subscription`; native SystemMessage projection | OpenProject deliveries |
| WebhookTest | dialog | Send an explicit harmless test event | test type, selected endpoint, confirmation | fixed sample with no production payload | proposed IntegrationServices `test#Subscription` | Carbon webhook test |

The proposed EventSubscription fields are subscriptionId, name, eventProvider/type, narrowing scope, registered condition parameters, native remote/type keys, enabled, retry policy, revision and changed-by/time. No inline executable code or arbitrary entity-event selector. Events are registered after the source transaction commits with durable source/event identity; a unique subscription/event delivery prevents duplicate production. Delivery uses SystemMessage and registered signing/transport behavior, not a second queue. Secrets/signing references are native connection configuration. Retain current Git/agent transport models through adapters. **Source:** research §8. **Needs:** ADM-CONNECTIONS, ADM-OPERATIONS.

### MessageTypes

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| MessageTypeList | list, read | Find message contracts | name, content type, direction, registered handler, owner | owner/detail links | proposed `org.moqui.admin.ConfigurationServices.find#MessageTypes` | Tools MessageTypeList |

The delegated MessageTypes screens are for the integration administrator (I) without `ADMIN`; in the first release `ADMIN` uses Tools System › SystemMessage › Type. **Source:** research §§8–9. **Needs:** ADM-CONNECTIONS.

### MessageTypeDetail

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| MessageContract | single | Maintain allowed transport options | content type, paths/patterns, registered handler, retry settings | approved handler choices | proposed ConfigurationServices `store#MessageType` over SystemMessageType | Tools MessageTypeDetail |
| MessageContractUse | list, read | Explain producers/consumers and recovery | owner, registered action, scope, idempotency contract | owner links | proposed ConfigurationServices `get#MessageTypeUse` | Tools message type; new owner registration |

Ordinary integration administrators select deployed, registered handlers; they cannot type executable service names or disable authorization. Raw handler authoring stays advanced Tools/deployment work. `send#SystemMessage` and `consume#SystemMessage` are interfaces; actual execution uses `send#ProducedSystemMessage` and `consume#ReceivedSystemMessage`. **Source:** research §§8–9; active SystemMessageServices. **Needs:** ADM-CONNECTIONS, ADM-OPERATIONS.

### SystemMessages

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| MessageFind | find | Find failed or pending work | type, remote, direction, status, dates, operation reference | safe query; bounded range | — | Tools SystemMessageList |
| MessageList | list, read; bulk | Triage permitted transport outcomes | ID, type, remote, state, age, attempt, owner/correlation | eligible recovery preview | proposed `org.moqui.admin.OperationServices.find#Messages`, `preview#Recovery` | Tools SystemMessageList |

Bulk recovery has per-item eligibility/results; it does not call an unrestricted send-all/consume-all for selected business messages. The delegated SystemMessages screens are for the operations operator (O) without `ADMIN`; in the first release `ADMIN` uses Tools System › SystemMessage › Message. **Source:** research §§8–10. **Needs:** ADM-OPERATIONS, ADM-AUDIT.

### SystemMessageDetail

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| MessageEvidence | display | Explain transport and business state | direction, type/remote, timestamps, error class, original operation, trace | masked diagnostics; owner links | proposed OperationServices `get#Message` | Tools SystemMessageDetail |
| MessageAttempts | list, read | Show attempt evidence | attempt, response class, timing, acknowledgement, correlation | no credentials | OperationServices `get#Message` | SystemMessageError; Tools detail |
| MessageRecovery | dialog | Reconcile, retry or cancel an eligible operation | registered action, target, reason, expected revision | consequences confirmation | proposed OperationServices `execute#Recovery`; registered owner services | Tools reset/send/consume/cancel actions |

The recovery adapter retains `org.moqui.impl.SystemMessageServices.reset#SystemMessageInError`, `cancel#SystemMessage`, `send#ProducedSystemMessage`, `consume#ReceivedSystemMessage` where their native action is safe. It never resets a business operation key or rewrites a sent payload to conceal history. Payload viewing/downloading needs the source's data permission; safe transport metadata can be visible without it. Editing message text remains advanced troubleshooting with immutable original evidence, not a normal retry step. **Source:** research §§8–9. **Needs:** ADM-OPERATIONS, ADM-AUDIT.

## 9. Mail and protocols

### ProtocolsHome

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ProtocolReadiness | list, read | Explain protocol availability | protocol, built/enabled, listener/readiness, source, check time, owner link | distinguish absent, disabled, failing | ConfigurationServices `get#EffectiveSettings`; `ironstone.admin.RegistryServices.get#Readiness` | Nextcloud Groupware/Talk; Zimbra service status |

Links cover mail relays/domains/queue, hosted SMTP trust, IMAP/POP and OAuth, DAV, SSH/SFTP/Git, chat, RTC/TURN/SIP, recordings/captions, and WOPI. Personal/shared mail accounts and templates link to Comms. This is a composition over built capabilities and explicitly proposed checks; an unbuilt feature is not advertised as operational. **Source:** research §§9, 16. **Needs:** ADM-PROTOCOLS, ADM-SETTINGS.

**Context passed:** phone administration opens the existing `System/Voice` owner in BasicComms, registered in the settings index, with `VoiceAdmin` checked by the existing Voice services. Its Status, Trunks, Numbers, CallerIds, Fraud, Emergency, Phones, RingGroups, Schedules, IvrMenus and Queues retain one definition. `VoiceTrunk.authJson` stays encrypted; listing/status services never return it. Admin does not copy those forms or infer that a provider is verified from a configured trunk. Comms keeps the caller's dialer, call handling and personal voicemail.

### MailRelays

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| RelayList | list, read | Find approved outgoing servers | name, host, transport, purpose/organization, readiness | masked metadata | ConfigurationServices `find#Connections` (kind relay) | Nextcloud email server; EmailServer baseline |
| NewRelay | dialog | Start an outgoing relay | name, SMTP host/port, TLS mode, permitted organization | registered secure choices | ConfigurationServices `store#Connection` (kind relay) | Odoo outgoing mail server |

**What a relay is (review Z1).** A relay is an `EmailServer` that no `EmailAccount` owns: no EmailAccount names it with `ownsEmailServer` Y. Examples are `SYSTEM` and relays Admin registers. The server of a personal, hosted or shared mail account belongs to that account and stays in Comms MailAccounts. It never appears in this list and cannot be opened, tested or edited here, because it carries the account's `mailPassword` and OAuth refresh token. Admin sees mail-account readiness only through a Comms projection. The relay adapter refuses an `emailServerId` that an account owns, on direct calls too. **Source:** research §9. **Needs:** ADM-CONNECTIONS, ADM-PROTOCOLS.

### MailRelayDetail

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| RelayConfiguration | single | Configure server transport | SMTP host/port/TLS, auth type/user, write-only credential, allowed domains | secret replacement and current source; a host, port or auth-type change asks for the credential again | ConfigurationServices `store#Connection` (kind relay) | Nextcloud AdminMailServer; active EmailServer |
| RelayTest | dialog; display | Test connection or send a named test | test kind, authorized recipient, result, trace | distinguish connect test from send | existing `org.moqui.impl.EmailServices.test#EmailServer`; proposed ConfigurationServices `test#Connection` for the named test message | Nextcloud send test; current EmailServices |
| RelayConsumers | list, read | Show approved uses | sending profile, template, organization, readiness | Comms/owner links | ConfigurationServices `find#ConnectionConsumers` | Comms SendingProfiles |

A relay whose host, port or auth type changed stays disabled until RelayTest passes against the new host (§8.1). Tests neither alter a business sending profile nor send real campaign content. Destination and sender restrictions still apply. OAuth uses existing EmailOAuthProvider/token mechanisms; password and refresh-token values never return to the browser. **Source:** research §9. **Needs:** ADM-CONNECTIONS, ADM-PROTOCOLS, ADM-AUDIT.

### MailDomains

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| DomainList | list, read | Find approved domains | domain, organization, sending/hosted purpose, verification, readiness | detail/status link | proposed `org.moqui.admin.MailDomainServices.find#Domains` | Frappe suite Domains; Zimbra Domains |
| NewDomain | dialog | Claim an authorized domain | DNS name, organization, intended use | canonical DNS-name validation | proposed MailDomainServices `store#Domain` | Frappe suite domain wizard |

**Source:** research §9. **Needs:** ADM-PROTOCOLS.

### MailDomainDetail

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| DomainConfiguration | single | Maintain use and routing bindings | DNS name, organization, enabled uses, approved relay/edge binding | no listener setting duplication | MailDomainServices `store#Domain` | Frappe suite DomainView; Zimbra domain form |
| DomainVerification | list, read; dialog | Verify control and expected DNS | proof record, MX/SPF/DKIM/DMARC expectations, observed state, checked time | copyable public DNS values; check action | proposed MailDomainServices `verify#Domain` | Frappe suite DNS checklist |
| DomainAddresses | list, read | Inspect hosted account and alias claims | address, account, active, owner link | permissions on account projection | proposed `org.moqui.admin.MailDomainServices.find#AddressClaims` | Comms MailAccounts; Zimbra aliases |

MailDomains and MailDomainDetail are `later` (review Z5).

**Aliases and hosted addresses (review Z6).** Comms creates them; Admin verifies the domain. Comms Identities, when it adds an alias, and the Comms hosted-account step both call proposed `org.moqui.admin.MailDomainServices.check#AddressClaim(address, emailAccountId)`. The check refuses an address whose domain is not verified for hosted use, or that another account already claims. DomainAddresses only lists the claims. Until MailDomains ships, Comms creates hosted accounts and aliases as it does today: the domain's routing and trust are configured at the mail gateway.

Proposed MailDomain fields are ID, normalized domain, owning organization, permitted sending/hosted purposes, proof hash/challenge state, verified-at, expected DNS policy, approved infrastructure references, disabled state and revision. A verification result records check kind, observed public value, state and time; private signing keys remain at the edge/provider. Verification means demonstrated control and readiness, not a guarantee of deliverability. It cannot make the SMTP listener an open relay or trust arbitrary Authentication-Results headers. Domain aliases and sender claims are unique, validated by `check#AddressClaim`. Detailed DMARC/TLS aggregate-report ingestion is later; do not claim it from these checks. **Source:** research §§9, 18. **Needs:** ADM-PROTOCOLS, ADM-CONNECTIONS.

### MailQueue

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| MailQueueFind | find | Narrow transport outcomes | binding, direction, state, dates, owner reference | no arbitrary mailbox search | — | Zimbra mail queues |
| MailQueueList | list, read; row actions | Reconcile failures without exposing inboxes | message/operation ID, transport, time, safe recipient count, outcome, retry eligibility | owner/reconciliation links | proposed `org.moqui.admin.OperationServices.find#MailOutcomes` over EmailMessage send outcomes | Zimbra queue; Comms send outcome; EmailClientServices |

Personal message subjects/bodies/addresses are absent unless independently authorized. Known failure may retry through the owner; an uncertain SMTP/provider submission requires reconciliation and does not become a fresh send. The Comms delivery ledger (review X8) owns delivery attempts and receipts, Comms owns suppression, and Marketing owns campaign re-entry; a generic queue action cannot bypass them. **Source:** research §9; Marketing transport contract. **Needs:** ADM-OPERATIONS, ADM-PROTOCOLS.

### ServerConfiguration

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| EffectiveProtocolSettings | display | Explain effective deployment configuration | protocol, build availability, bind/public address, TLS/trust, limits, source, restart requirement | masked values and key names | ConfigurationServices `get#EffectiveSettings` | Zimbra server settings; Nextcloud Talk checks |
| ProtocolChecks | list, read; dialog | Run supported diagnostics | check, target, expected behavior, result, time | confirmation for external probe | proposed ConfigurationServices `test#Protocol` | Nextcloud WebServerSetupChecks; framework protocol guides |

SMTP uses existing `smtp_allowed_addresses` and `smtp_authserv_id`; TLS/listener ports are conf-owned. DAV and SFTP use current app-password and resource authorization; SSH host keys are shown by fingerprint, not disclosed. RTC/TURN/SIP, recording, captions and WOPI display actual configured providers and feature availability. A WebRTC test does not turn on recording; recording/retention/consent retain the protocol owner's enforcement. No arbitrary shell, filesystem path editor or automatic server restart is added. Running HTTP-shaped connection and protocol checks as Monitor synthetic checks is in Open (§19). **Source:** research §9; current Mail-Inbound, Sync, WebRTC/TURN and SIP guides. **Needs:** ADM-PROTOCOLS, ADM-AUDIT.

## 10. Operations, notifications and jobs

### Health

**Layout:** list grouped by identity, business setup, transport, storage/backup and observability, with organization and provider filters.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ReadinessFind | find | Narrow checks | organization, area, state, owner | permitted choices | — | OpenProject Information |
| Readiness | list, read | Show evidence and owner actions | check, result, checked time, freshness (watermark, expected frequency, lag), explanation, owner/fix link | retry-check row action; refresh where a refresh operation is registered | proposed `ironstone.admin.RegistryServices.get#Readiness`, `request#Refresh` | Frappe System Health Report; Products CatalogChecks; People SetupReadiness |

**Actions:** Refresh performs registered nonmutating checks. Request refresh runs a registered refresh operation (§14), the same one Insights DataReadiness uses. Deliberate external tests belong to their owner forms and confirm their effect. A search outage, missing telemetry or unconfigured external backup is unknown/unavailable, not green. A provider is read as the viewer, by the permission its registration names: Admin's own checks and the Constitution's need `ADMIN_OVERVIEW_VIEW`, Accounting's `ACCOUNTING_VIEW`, Products' `PRODUCT_CATALOG_VIEW`; Commerce's store readiness needs `ADMIN_OVERVIEW_VIEW` and answers a Commerce reader the findings and an administrative reader, who opens no store, Commerce's summary of each store of the organizations it administers (the checks by name, no messages; impl-admin P2). Domain checks are the registered providers of §14.2: Accounting setup (existing `mantle.ledger.SetupServices.get#Readiness`; its `check#Readiness` is the activation check of setup, impl-admin F16), Products catalog quality (CatalogChecks, `mantle.product.CatalogCheckServices.validate#Catalog`), Commerce store readiness (existing `mantle.product.StoreAdminServices.check#StoreReadiness`), People setup (proposed `mantle.humanres.PeopleServices.get#Readiness`), Sales, Maintenance and the rest, without exposing underlying confidential values. Health is first-release (A1). **Source:** research §§1, 18 and domain readiness screens. **Needs:** ADM-OPERATIONS, ADM-SHELL.

### Topics

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| TopicList | list, read | Find registered topics | title, owner, purpose, delivery defaults, push policy, actionable | owner/detail links | proposed OperationServices `find#Topics` | NotificationTopic; Frappe Notification |

**Source:** research §9. **Needs:** ADM-OPERATIONS.

### TopicDetail

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| TopicDefaults | single | Maintain allowed delivery settings | title, persist, alert, approved template, defaults | owner-registered mutable fields | proposed OperationServices `store#TopicDefaults` | NotificationTopic; Frappe notification settings |
| TopicSubscriptions | list; dialog | Review eligible subscriptions | user, receive/opt-out state, dates, source | authorized users only | proposed OperationServices `store#TopicSubscription` | Tools UserAccountDetail subscriptions; Commons Notifications |

Approval service bindings, record classification and audience rules are registered by the owning app and cannot be replaced here. Admin may set operational defaults but cannot manufacture consent, override promotional suppression or expose an HR/private approval to a broader group. Personal preferences remain Commons. **Source:** research §9; crosscut approvals and Marketing consent. **Needs:** ADM-OPERATIONS, ADM-ACCESS.

### Jobs

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| JobFind | find | Find operational work | owner app, state, late/failing/paused, organization | registered scope | — | Tools ServiceJobList |
| JobList | list, read | Explain schedules and recent outcome | name, description, registered owner, next/last run, state, failure age | detail/run links | proposed OperationServices `find#Jobs` | Tools ServiceJobList; Frappe failing jobs |

Report schedules and agent triggers are linked owner records, not duplicated ServiceJobs. The runner jobs that dispatch them remain visible as infrastructure. The delegated Jobs and JobRuns screens are for the operations operator (O) without `ADMIN`; in the first release `ADMIN` uses Tools System › ServiceJob. Failing and late jobs alert through the shipped `report/admin-job-runs` alert template on job-run telemetry (`otel_spans`, `moqui.job.runs`), with the framework's silences and repeat timing, instead of new Admin job topics. **Source:** research §10. **Needs:** ADM-OPERATIONS, ADM-REPORTS.

### JobDetail

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| JobConfiguration | single | Maintain allowed scheduling controls | schedule, paused, priority, retry/lock settings, owner | next-run/time-zone preview | proposed OperationServices `store#Job` over ServiceJob | Tools ServiceJobForm |
| JobParameters | list, editable rows | Edit registered safe parameters | name, typed value, source, scope | definition-driven widgets; secret references | OperationServices `store#Job` | Tools CreateJobParameter, UpdateJobParameter |
| JobNotifications | list; dialog | Maintain permitted operational recipients | user, receive notifications | no report-data sharing implied | OperationServices `store#Job` over ServiceJobUser | Tools CreateJobUser, UpdateJobUser |
| JobExecution | dialog | Request eligible run/pause/recovery | action, scope, expected revision, reason | exact effect confirmation | OperationServices `preview#Recovery`, `execute#Recovery`; existing `ec.service.job(jobName).run()` when eligible | Tools runJob |

The service name and execution identity are fixed by the registered job owner; ordinary scheduling does not let an operator execute arbitrary services or impersonate a broader user. Domain schedule policies may disallow a manual run. Locks are not simply deleted to make a stuck job appear idle. Cancellation/retry is cooperative and owner-defined. **Source:** research §10. **Needs:** ADM-OPERATIONS, ADM-AUDIT.

### JobRuns

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| RunFind | find | Find outcomes | job, state, organization, time | bounded ranges | — | Tools JobRunList |
| RunList | list, read | Show run evidence | job/run, start/end, duration, status, result counts, trace | owner/detail links | proposed OperationServices `find#JobRuns` | Tools JobRunList |

**Source:** research §10. **Needs:** ADM-OPERATIONS.

### JobRunDetail

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| RunEvidence | display | Explain one execution | job, actor/owner, timing, outcome, safe counts, trace, original operation | masked parameters | proposed OperationServices `get#JobRun` | Tools JobRunDetail |
| RunItems | list, read | Show independent outcomes and next actions | item key, state, reason, owner detail, eligible recovery | no successful-item replay | proposed OperationServices `get#JobRunItems`, which calls the job owner's registered Operational recovery provider (§14) | Frappe job logs; domain transfer/payroll outcomes |

A successful job wrapper with failed items is not displayed as an entirely successful business operation. Detailed payroll, campaign recipients and report bodies remain behind their source permissions. Monitor traces/logs retain Monitor grants; a job-page link does not grant them. **Source:** research §10. **Needs:** ADM-OPERATIONS, ADM-AUDIT.

### Monitoring

**Layout:** authorized owner links and registered summary panels, not a second incident or alert application.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| MonitoringDestinations | list, read | Open existing operational tools | overview, operations, traces, logs, errors, sources, checks, releases, incidents, recovery, alerts | current owner routes with narrowing filters | existing `org.moqui.monitor.MonitorServices.get#SourceStatus`, `list#Incidents`; existing report queries | Tools Monitor and Dashboards |

**Context passed:** Monitor receives only service, job, trace, incident or time-range filters already authorized. `MONITOR_APP`, `MONITOR_INCIDENT`, `MONITOR_RECOVER`, `MONITOR_RECOVER_ADMIN` and `MONITOR_REPLAY` remain independent. Existing report alert definitions/contact points/silences own alerting; checks own synthetic probes and scrape targets. Existing MonitorIncident/Regression/RecoveryPolicy/Action/Verification and emergency stop own operational incidents and recovery. Default recovery remains advisory; no recovery reverses committed business transactions. Agent traces and session replay stay under their specific guards.

Domain readiness may supply a registered metric/dataset to this existing machinery; it does not introduce ServiceJobMonitor records. Business value-bearing alerts follow Insights INS-07: personal or owner-equivalent group alerts in the first release, recipient-scoped evaluation later. Technical notifications may link a permitted redacted incident without its sensitive payload. **Source:** research §§1, 10, 12; current Monitoring guide. **Needs:** ADM-OPERATIONS; reuse INS-07.

### 10.1 Existing automation retained

| Automation/path | Verdict | Admin behavior |
| --- | --- | --- |
| Mantle `service/Party.secas.xml` `UserAccountCreatePerson`, post-service on `org.moqui.impl.UserServices.create#UserAccount` | kept with its current condition `userId && !partyId && !deferIdentityLink` | Calls `mantle.party.PartyServices.create#UserAccountPerson` only when needed. Staff provisioning with an existing Party passes its partyId and does not create a second person. Any deliberate deferred identity link completes within the authorized identity workflow. |
| Mantle `service/Party.secas.xml` `UserInitialAdminCreatePerson`, post-service on `org.moqui.impl.UserServices.create#InitialAdminAccount` | kept with its current condition `userId && !partyId` | Initial-admin bootstrap retains its native identity creation; ordinary staff invitation does not call this bootstrap service. Both account SECAs have `run-on-error="false"`. |
| Native UserServices/password/factor hooks and organization membership setup | kept; administrative guards added at their public service boundaries | Never direct-write password hashes or mint group membership through raw account imports. |
| Framework `entity/Security.eecas.xml` `UserGroupMemberPrivileged` (run-before, every UserGroupMember write) and `UserGroupPermissionSealed` (run-before, every UserGroupPermission write) | kept; they enforce the §1.1 seals | With the framework's three Admin seals and mr-boss's `privileged-group` elements (proposed, ADM-ACCESS), a membership change in BOSS_ADMIN_ACCESS, BOSS_ADMIN_BACKUP or BOSS_ADMIN_ADMIN needs a member, and a grant of ADMIN_BACKUP_DOWNLOAD, ADMIN_IDENTITY_GLOBAL or ADMIN_ACCESS_MANAGE needs a holder. Admin shows the refusal as a reason, not an error. |
| Mantle `entity/ForumTracking.eecas.xml` `ForumTrackingGroupChange` (every UserGroupMember create, update or delete) | kept | Calls `mantle.forum.TrackingServices.refresh#Mode` for the user. Bulk disable and membership import fire it once per user; Admin runs each user as an independent item so one failure does not stop the rest. |
| Mantle `entity/ForumTracking.eecas.xml` `ForumTrackingAccountChange` (UserAccount update when partyId, disabled or terminateDate changes) | kept | Global disable and a scheduled `terminateDate` refresh the user's Forum tracking mode through `refresh#Mode`. |
| Proposed mr-boss SECA (`when="tx-commit"`) on proposed `mantle.humanres.PeopleServices.hire#Employee` and `apply#EmploymentChange` | new | Calls `ironstone.admin.LifecycleServices.request#Provisioning` or `request#AccessEnd` after People's commit (§4.1); a failure is logged by name and leaves the People transaction committed, with the lifecycle request retryable by key. |
| SystemMessage send/consume jobs, native retries, acknowledgements and reset/cancel services | kept with domain eligibility before manual recovery | Correlate original operation; unknown external results require owner reconciliation. |
| EmailClientServices due drafts/account sync, rules and mail polling | kept | Queue operations call owners; no parallel mail sender or second subscription/consent policy. |
| `backup_EmbeddedDatabase_daily` → `org.moqui.impl.ServerServices.backup#EmbeddedDatabase` | kept | Run/status adapter preserves skip/failure/coverage and independent cluster outcomes. |
| `clean_TelemetryData_daily`, `rollup_TelemetryMetrics_hourly`, scrape/check jobs | kept | Configure only supported owner settings; display stale/missing telemetry honestly. |
| `detect_Regressions_5min`, `run_Recovery_minute` | kept | Existing Monitor evidence, permissions, leases and emergency stop remain authoritative. |
| `evaluate_ReportAlerts_minute`, report schedules and current ScreenScheduled leases | kept, extended by Insights INS-06/INS-07 | Business delivery is personal or owner-equivalent group delivery in the first release; offboarding pauses and transfers through `pause#OwnedSchedules` and `transfer#DefinitionOwner`. |
| LLM usage/content-cleanup jobs and AgentTrigger processing | kept | Agent administration remains framework-owned; no copied trigger/approval engine. |
| Native domain SECAs/EECAs called by import writers | kept or conditioned only as the owning design specifies | Admin never disables audit, feeds or automation globally to make an import pass. |
| Retired `clean_ArtifactData_daily` and old ElasticSearch log cleanup jobs | remain paused as current framework upgrade behavior | Do not restore old ArtifactHit/ArtifactHitBin/log stores or invent their replacements. |

These are owner interactions; the People lifecycle SECA is the only new rule, and it names two services. Proposed invitation/lifecycle/transfer dispatch uses registered ServiceJobs or existing queued execution, with one transaction per independent item and durable outcomes. No wildcard service/entity ECA is introduced for administrative convenience. The crosscut §1.3 register gains these rows.

## 11. Import, export and backups

### 11.1 Shared transfer contract

**Generalized from Products (review Z2).** Shared/DataImport is the built Products import made general. That import is `Shared/ProductImport.xml`, mounted at Products/ProductImport (P12), over Mantle `mantle.product.ProductImportServices`:
- `stage#CatalogImport`, `configure#CatalogImport`, `validate#CatalogImport`, `apply#CatalogImport` and `get#CatalogImport`, with `get#CatalogImportReport` and `get#CatalogImportSample`;
- kinds registered in `ProductCatalogImportKind`;
- each run and its rows in `ProductCatalogOperation`/`ProductCatalogOperationItem`.

A target registers the same five steps for its own records. Shared/DataImport calls them through proposed `org.moqui.admin.DataTransferServices`, which dispatches by the target registration and never by a service name from the request. Each domain keeps its own batch entity and its own write services. A target with domain-specific steps, such as consent evidence, bank statement formats, a SystemMessage intake or an accounting cutover, keeps its owner wizard and registers only its result contract, so Imports lists every run; an owner wizard with no run record yet (Commons' contacts, Projects' work items) is listed with a link and no runs until it keeps one (impl-admin F13).

Proposed `TransferBatch`/`TransferItem` exist only for a target with no owner batch; there is no TransferBatch where an owner batch exists.

**Import targets.**

| Owner | Target | Existing batch entity or services | Wizard |
| --- | --- | --- | --- |
| Products | catalog: products, prices, supplier prices (kinds in `ProductCatalogImportKind`) | `mantle.product.ProductCatalogOperation`/`ProductCatalogOperationItem`; `mantle.product.ProductImportServices` | Products/ProductImport becomes the Products mount of Shared/DataImport (target `catalog`); its screen is the source of the generalization |
| Admin | staff invitations | proposed TransferBatch (no owner batch); one `mantle.party.UserInvitation` per accepted row through `invite#User` | Shared/DataImport at Admin/Data/DataImport |
| People | employees | proposed `mantle.humanres.PeopleServices.preview#Hire` per row and `hire#Employee` to apply it (People's target adapter); proposed TransferBatch (no owner batch) | Shared/DataImport mounted by People (target `employees`) |
| People | time and attendance | existing `mantle.work.TimeServices.import#TimeEntryCsv`; proposed `mantle.humanres.AttendanceServices.import#Records` | owner wizard People/Time/TimeImport, registered |
| Maintenance | equipment | proposed `mantle.product.MaintenanceImportServices` `preview#MaintenanceImport`, `apply#MaintenanceImport`; Shared/DataImport holds the batch and result (no own run) | Shared/DataImport mounted at Maintenance/Equipment/EquipmentImport (target `equipment`) |
| Sales | leads and opportunities | proposed `mantle.sales.OpportunityServices.preview#OpportunityImport`, `apply#OpportunityImport`; proposed TransferBatch (no owner batch) | Shared/DataImport mounted by Sales (target `opportunities`) |
| Marketing | audience members | proposed AudienceImport over existing `mantle.party.ContactImportServices` | owner wizard Marketing/Audiences/AudienceImport (consent-evidence step), registered |
| Commons | contacts (vCard, CSV) | existing `mantle.party.ContactImportServices.preview#Contacts`, `import#Contacts` | owner wizard Commons/Contacts/Import, registered |
| Projects | work items | built `mantle.work.WorkItemImportServices` (P4c) | owner wizard Projects/WorkItems/Import (built), registered |
| Commerce | channel orders | SystemMessage intake plus proposed `mantle.product.StoreChannelServices.prepare#ChannelImport`, `commit#ChannelImport` | owner wizard Commerce/Integrations/ChannelImport, registered |
| Accounting | bank statements | `mantle.account.method.StatementImport`; `mantle.account.ReconciliationServices.review#StatementImport`, `commit#StatementImport` | owner wizard Accounting/Banking/StatementImport (built P9), registered |
| Accounting | opening open items | `mantle.ledger.SetupServices.import#OpenItems` | step of Accounting/Settings/Setup (built P19), registered |

Each app's import row in its own design says either "mounts Shared/DataImport (target X)" or "registers its owner wizard", as this table does. A target that mounts Shared/DataImport and whose design names other verbs (`preview#`, `import#`) provides the five steps under those names, so its services follow Products'. A registered owner wizard provides only `get#` for its runs, once it keeps a run record.

**Contract.** Admin supplies a catalog, staging UI and consistent results envelope. Each registered target names:
- its owning services and the view, import and export permissions it requires;
- the supported format and version, and the permitted fields;
- the organization or record scope, and the matching and replay rules;
- nonmutating validation, the apply action, the error projection and the canonical result route.

A target wraps its domain batch; it does not copy that batch's rows into a second ledger.

The sequence is Upload → select sheet/header/options → map → validate/preview → confirm → apply → results. File size/row limits and permitted types are target-specific and shown before upload. CSV and supported spreadsheets use existing parsers, including `org.moqui.impl.SpreadsheetServices.read#Spreadsheet`. Each domain write calls its real business service, preserving permission, effective-date, accounting, stock and automation rules. `load#SpreadsheetEntity` remains an advanced generic loader, not the business executor.

Validation is nonmutating. It reports unknown fields, ambiguous identities, missing references, scope violations, conflicts and anticipated side effects. A preview records file/mapping/target version and relevant source revisions; apply refuses a stale preview and reruns validation. Never run “test” by sending email or a payment and rolling back database rows. Independent rows commit separately; dependent document lines form an explicitly declared atomic unit. Source key plus target/organization and operation identity makes retry deterministic; identical retries return the prior result and changed content under that identity is refused. Historical imports do not generate new obligations, stock or messages unless the selected domain import mode explicitly authorizes them.

Secrets, password hashes, arbitrary groups, privileged authz, executable service names and raw policy expressions are not business-import columns. People protects payroll history, Accounting protects posted meaning, Products protects catalog revisions, Warehouse protects stock posting, and Commerce channel sync retains its SystemMessage intake. Error downloads are permission-checked and redact inaccessible/secret fields. Retention removes staged files only under the registered retention policy.

### Imports

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ImportFind | find | Find authorized runs | target, owner, organization, state, date | catalog options | — | Frappe Data Import |
| ImportList | list, read | Show transfer outcomes from every target, owner wizards included | target, file label, organization, state, rows accepted/failed/skipped, owner | detail/retry links | proposed `org.moqui.admin.DataTransferServices.find#Transfers` | Frappe import history; Products ProductImport |
| ImportTarget | dialog | Start an allowed import | registered target, organization, mode | target description and effects | proposed DataTransferServices `find#ImportTargets` | Odoo import-from-list; Dolibarr datasets |

**Source:** research §11; domain import designs. **Needs:** ADM-IMPORT.

### DataImport

**Context passed:** `Admin/Data/DataImport` and a domain's import route mount one `Shared/DataImport.xml`, generalized from `Shared/ProductImport.xml`, with targetId, appRoot, narrowing organization/record context and a registered return link. A mount cannot add columns or permissions the target does not allow. A target listed in §11.1 with an owner wizard keeps that wizard and registers the same result/operation contract.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ImportUpload | wizard step | Stage permitted content | target, organization, mode, file, format, encoding/delimiter | file upload and size limit; sample download | proposed DataTransferServices `stage#Import`, calling the target's `stage#` (Products: `mantle.product.ProductImportServices.stage#CatalogImport`) | Products ProductImport ImportUpload; Odoo Upload; Twenty sheet/header selection |
| ImportMapping | wizard step | Map columns and approved values | sheet, header, source column, target field, conversion/match option | sample rows and typed choices | proposed DataTransferServices `configure#Import`, calling the target's `configure#` | Products ProductImport ImportMapping; Twenty match columns; Frappe value mapping |
| ImportPreview | wizard step | Review validation and effects | valid/error/skipped counts, sample outcomes, conflicts, policy/side-effect summary | grouped row errors | proposed DataTransferServices `validate#Import`, calling the target's `validate#` | Products ProductImport ImportValidation; Odoo Test |
| ImportApply | wizard step | Confirm the validated scope | target, organization, row/unit count, preview revision, reason | named confirmation | proposed DataTransferServices `apply#Import`, calling the target's `apply#` | Products ProductImport ImportApply; Frappe import; Dolibarr simulate/import |

Full new common inputs are targetId, organization/context, file resource, parser options, sheet/header, field/value mapping, registered import mode, source namespace, expected preview revision and confirmation reason. Domain fields come exclusively from the target schema; no arbitrary entity name is accepted. **States:** partial success is a first-class result; cancel stops unclaimed units and leaves committed units visible. **Source:** research §11. **Needs:** ADM-IMPORT, ADM-ACCESS.

### ImportDetail

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ImportSummary | display | Explain the exact applied run | target/version, file/map hash, organization, mode, counts, actor, period | source provenance | proposed DataTransferServices `get#Transfer`, calling the target's `get#` | Frappe Data Import; Products ImportResults |
| ImportResults | list, read; row actions | Reconcile row/document outcomes | source key, target link, accepted/failed/skipped/uncertain, reason, attempt | error export; eligible retry selection | proposed DataTransferServices `retry#ImportItems`, which re-runs the target's `apply#` for the selected failed rows | Frappe import log/skipped rows |

Correction creates a new validated revision linked to the original unit; successful rows are never blindly replayed. A receipt/charge/message with uncertain outcome routes to its owner instead of reimporting it. **Source:** research §11. **Needs:** ADM-IMPORT, ADM-AUDIT.

### Exports

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ExportFind | find | Find permitted export outcomes | provider, owner, organization, status, date | safe metadata filters | — | Frappe Access Log; Dolibarr exports |
| ExportList | list, read | Show export and delivery status | definition/target, owner, created, state, expiry, authorized download | payload separate from status | proposed DataTransferServices `find#Transfers`; proposed `org.moqui.report.ReportServices.find#ReportOccurrences` (Insights INS-06) | Frappe export history; Insights delivery history |

Administrative status visibility is not permission to download the output. Recipient-specific report artifacts are visible only to the authorized recipient under Insights' current-access checks. **Source:** research §§11–12. **Needs:** ADM-EXPORT, ADM-AUDIT; INS-06.

### DataExport

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ExportSelection | wizard step | Select a registered domain format | registered export target, organization, dates, filters | registered target choices | proposed DataTransferServices `find#ExportTargets`, `preview#Export` | Dolibarr export wizard; Odoo fields export |
| ExportFields | wizard step | Select permitted output | authorized columns, format, labels | permission-filtered fields | proposed DataTransferServices `get#ExportFields` from the target schema | Odoo export field picker |
| ExportReview | wizard step | Confirm scope and obtain output | source/version, filters, counts if permitted, classification, format | preview under caller only | proposed DataTransferServices `run#Export`, calling the owner's exporter | Dolibarr review; Insights Export |

DataExport covers domain-format exporters only: vCard (`mantle.party.ContactImportServices.export#Contacts`), work-item CSV, payroll exchange and ledger exports, each through its owner's exporter. Dataset and report exports are Insights' (DatasetView ExportDocuments, report outputs); DataExport links there instead of offering a second surface. No free SQL, arbitrary entity export or owner-data-to-recipient forwarding. Saved export profiles are in Open (§19). CSV spreadsheet-formula escaping and file naming are shared output policy. **Source:** research §11; Insights output contract. **Needs:** ADM-EXPORT; INS-11.

### Backups

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| BackupCoverage | list, read | Explain what is protected | database/provider, last success, job paused or running, retained archives, off-site mirror (the `EmbeddedDbBackup` remote's SFTP `sendUrl`, or none), verification evidence, not included (`.env`, field-encryption key, resource files) | unknown/partial/success distinctions; a fixed warning that `.env` and the field-encryption key are not in the archive and must be kept with it | proposed `org.moqui.admin.BackupServices.get#Coverage` | OpenProject backups; current embedded backup job; Run-Deploy "Backups" |
| BackupArchives | list, read | Browse approved archive metadata | archive key, kind, database, created, size, checksum/verification, expiry | no arbitrary path input; Download only when it ships (later) | proposed BackupServices `find#Archives`, `download#Archive` | Frappe backups; OpenProject token-guarded download |
| BackupNow | dialog | Request an authorized backup | provider, approved mode, scope, reason | explicit instance-wide confirmation | proposed BackupServices `run#Backup`; existing `org.moqui.impl.ServerServices.backup#EmbeddedDatabase` | current backup service; OpenProject request backup |

Archive download is `later` (review Z5); until it ships, BackupArchives lists metadata only. Download then requires fresh authentication, the sealed `ADMIN_BACKUP_DOWNLOAD`, audited access and a server-resolved archive key restricted to approved storage. Never expose an arbitrary resource path or public bearer URL. An external PostgreSQL installation gets its registered operator/provider status; the embedded service's skipped result is not success. Database-only backup does not imply resource files, deployment secrets or external stores are covered. Display the scope and restore-verification evidence honestly. Restore and raw DataSnapshot import remain separately privileged maintenance operations outside this first-release Admin UI; no in-place restore button beside ordinary downloads. **Source:** research §11. **Needs:** ADM-OPERATIONS, ADM-AUDIT; backup adapter in ADM-EXPORT.

## 12. Audit, retention and privacy

### AuditChanges

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| AuditFind | find | Find permitted change evidence | actor, date, entity/record, action, organization | safe target search | — | Tools AuditLog |
| AuditList | list, read | Show protected before/after evidence | actor, target, field/action, time, reason, correlation | mask classified values; authorized owner link | proposed `org.moqui.admin.AuditServices.find#Changes` over EntityAuditLog and owner audit sources | Tools AuditLog; Carbon audit details |

The audit reader sees only registered safe projections. Secrets are never logged as before/after values, and payroll, private contacts or message bodies are not disclosed just because their entity was changed. Existing audit records remain authoritative; administrative events fill missing action/reason evidence without copying all business changes to a new universal history table. The delegated AuditChanges screen is for the audit reader (V) without `ADMIN`; in the first release `ADMIN` uses Tools System › AuditLog. **Source:** research §12. **Needs:** ADM-AUDIT.

### AccessLog

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| AccessFind | find | Narrow sensitive-access evidence | actor, action, source, date, correlation | no query-content search by default | — | Frappe Access Log |
| AccessEvidence | list, read | Show who requested or received an output | actor, purpose, source, permission result, safe filter summary, format, result, time | Monitor/source links | existing `org.moqui.report.ReportServices.query#Documents` over the shipped `admin-access-log` dataset | Frappe Access Log; current moqui.report.audit |

AccessLog reads a dataset that mr-boss ships as `report/admin-access-log.json`: `otel_logs` narrowed by a server-side row filter to the `moqui.report.audit` and `moqui.monitor.audit` targets. The dataset artifact is granted to `BOSS_ADMIN_AUDIT`, so the audit reader needs no `MONITOR_APP` and sees no other log lines. It is not a new `find#AccessEvidence` service. Add only missing administrative events, on the same targets, with common correlation metadata. Visit/Visitor remain; requests are spans. Raw log/trace/replay access requires its existing permissions, and replay is not a report dataset. An export history row contains safe metadata, not another copy of its report. **Source:** research §12; current Monitoring guide. **Needs:** ADM-AUDIT; INS-11.

### Retention

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| RetentionPolicies | list, read; dialog | Explain and maintain supported policy | category, organization/instance, keep period, source, cleanup owner, holds | typed values; impact preview | proposed `org.moqui.admin.PrivacyServices.get#Retention`, `preview#Retention`, `store#Retention` | Frappe Log Settings; domain retention policies |
| RetentionHolds | list; dialog | Protect identified records/scope | hold reason, scope/target, authority, starts/ends, owner | scoped lookup; audited release | proposed PrivacyServices `place#Hold`, `release#Hold` | People purpose-specific retention; new coordination |
| CleanupEvidence | list, read | Review eligible and completed cleanup | provider, run, eligible/protected/skipped/error counts, time | job/owner links | proposed PrivacyServices `find#CleanupResults` over the registered Retention/privacy providers (§14) | seeded cleanup jobs; Dolibarr retention |

Retention is `later` (review Z5). The new hold form's full fields are category/provider, organization or explicit instance scope, registered target selector/record identities, reason, authority reference, starts/ends, expected revision and release reason. Holds are metadata enforced by every registered cleanup/export-erasure path, not merely a banner on Admin. A provider that cannot enforce them is shown unsupported and cannot be advertised as safely erasable. Existing telemetry retention remains conf-owned and uses `clean#TelemetryData`; job/LLM/resource retention uses its existing owner mechanism. Policies do not erase accounting history or remove the evidence of a privacy decision. No jurisdictional retention duration is hard-coded in the suite. **Source:** research §§12–13; People and Commons lifecycle reconciliation. **Needs:** ADM-RETENTION, ADM-AUDIT.

### PrivacyRequests

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| PrivacyFind | find | Find authorized requests | subject, organization, kind, state, assigned owner | scoped subject lookup | — | Odoo privacy lookup; Frappe personal-data requests |
| PrivacyList | list, read | Track reviewed requests | subject, verified request kind, received/due, state, assigned owner | case/detail link | proposed PrivacyServices `find#Requests` | Frappe request list |
| NewPrivacyRequest | dialog | Record a request with verification | subject party, request kind, organization scope, verification evidence, received/due, assignee, reason | private evidence attachment | proposed `org.moqui.admin.PrivacyServices.create#Request` | Odoo privacy wizard; People private case intake |
| PrivacyLookup | dialog | Find where an email or person appears before a formal request | email or party, organization | read-only provider counts and categories; no record bodies | proposed PrivacyServices `lookup#Subject` over the registered providers' preview | Odoo `privacy_lookup` wizard |

PrivacyRequests and PrivacyRequestDetail are `later` (review Z5). Requests are access/export, correction or erasure review. An email string alone cannot authorize a data disclosure. PrivacyLookup runs the same provider previews as PrivacyInventory, ad hoc and read-only, for a privacy administrator answering "do we hold anything on this person". It records the lookup in the audit trail and creates no request.

**One intake (review X15).** A data subject asks through one page: the PASS Account privacy page. It calls `PrivacyServices.create#Request` through PASS's facade with the signed-in party as subject and the verified account email as evidence, and the request arrives unverified for staff review. Staff record phone or letter requests with NewPrivacyRequest. Forum's own intake becomes this page. Each customer-side and staff design registers a Retention/privacy provider (§14):
- Sales: leads and opportunities;
- Marketing: consent, audience membership, registrations and attribution;
- Commerce and Shop: carts and checkouts, recovery sends, reviews, download grants and recurring contracts;
- Customer Service: cases and returns;
- Forum: posts and tracking;
- Commons and Comms: contacts and mail;
- People: personnel records under its protected rules.

The common form's full fields are those listed plus source reference and expected revision on edit; evidence uses a protected canonical request host. **Source:** research §13; review R-SC-10. **Needs:** ADM-RETENTION, ADM-ACCESS.

Register the proposed framework `moqui.admin.PrivacyRequest` host and `moqui.admin.PrivacyRequestContent` association with BOSS shared RecordFiles. The association binds request ID, content sequence/ID, purpose, resource reference, original filename/type, created-by/time and current state; storage uses the existing framework resource/content facilities. PrivacyServices owns upload, read/download, export and retirement independently of the BOSS presentation, checking `ADMIN_PRIVACY_VIEW`/`ADMIN_PRIVACY_MANAGE` as appropriate and the request's organization/participant scope, including direct resource requests. Evidence is never attached to a generally readable Party or ordinary Chatter host. Request holds and retention govern the association and stored resource; no unregistered generic attachment path or framework dependency on Mantle/BOSS is introduced.

### PrivacyRequestDetail

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| PrivacySummary | display | Explain verified request and scope | subject, kind, verification, organization, state, assignee, due | protected record header | proposed PrivacyServices `get#Request` | Frappe personal-data request |
| PrivacyInventory | list, read | Review owner-provided disposition | provider/category, safe record count, hold, proposed retain/correct/redact/erase/export, reason | no unguarded record bodies | proposed PrivacyServices `preview#Request`; registered domain providers | Odoo privacy lookup |
| PrivacyDecision | dialog | Approve a bounded disposition | selected provider units, action, reason, expected preview revision | consequence confirmation | proposed PrivacyServices `approve#Request`, `execute#Request` | Odoo privacy action; domain approval practices |
| PrivacyResults | list, read | Track independent execution evidence | unit, decision, outcome, target link, attempt, exception | authorized retry/owner link | PrivacyServices `get#Request` (results), `execute#Request` (retry of a failed unit) | Frappe partial outcomes; domain transfers |

This is a reviewed workflow, not a cascade delete of every Party relationship. Domain providers enforce holds, document history, private content, publication status and accounting/payroll retention. Export is delivered only to the verified entitled subject through an authenticated protected channel; an administrator's preview contains metadata unless separately entitled to the data. Correction routes to the owning record; completed financial facts require owner correction/reversal, not rewriting. Independent provider failures continue and remain unresolved until reviewed. The request's decision/audit trail persists under its own retention policy. **Source:** research §13. **Needs:** ADM-RETENTION, ADM-AUDIT, ADM-EXPORT.

## 13. Agents, system and developer tools

### AgentsHome

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| AgentAdminLinks | list, read | Open existing administrative owners | models/endpoints, bindings, usage/calls, skills/lessons, tools/policies, runs, approvals, triggers, remote MCP/A2A, gateway | existing canonical destinations; an absent destination shows as unavailable | existing `org.moqui.agent.AgentAdminServices.get#EffectiveConfig`, `get#DashboardTotals` | Tools System/Llm |
| ConstitutionLink | read, link | Open shared human/agent guidance | effective scope/source, canonical localized Constitution/reference view link | shown when the destination exists | Constitution read contract (§7) | Admin Settings/Constitution |

**Framework screens it links (review Z5).** Tools System/Llm has Models, Tools, Skills, Lessons, Runs, Approvals, Triggers, Remote, Gateway, Calls, Usage and Conversations. It lacks three administration screens, which are framework needs (ADM-AGENTS) listed in mr-moqui [Remaining-Work](../../../../plans/Remaining-Work.md):
- an AgentDefinition editor: surfaces, instructions, `runAsUserId`, `roleGroupId`, `maxCost`, `exposeMcp`/`exposeA2a`, `canvasDialects`, disabled;
- an A2A tasks screen;
- making a gateway client key in the admin screen, shown once.

Admin owns no agent-runtime configuration screens. AgentsHome links those three only when they exist and shows them as unavailable until then. It also links [Settings → Constitution](#constitution) when built, preserving authorized organization scope and the Constitution screen's own read/edit checks; this shared human/agent policy screen is Admin's.

**Context passed:** links preserve permitted agent/model/run IDs only; the framework `System/Llm` root and its service checks retain `AgentAdmin` and other permissions. Admin does not define new LlmConversation, LlmCallLog or A2ATask records. The current AgentToolPolicy/Exposure/Approval model governs tool classifications, approvals and exposure on top of domain artifact/service authorization. Changing a tool exposure keeps its version check and pending-approval invalidation. Model/provider tests are explicit operations that may make a provider call. Agent administration is not permission to read every conversation, report attachment or private business record. Insights consumes approved usage/cost datasets, not raw prompts by default. **Source:** research §15 superseded by current Agent/Llm sources. **Needs:** ADM-SETTINGS, ADM-AUDIT, ADM-AGENTS, ADM-CONSTITUTION.

### System

**Context passed:** `Admin/System` mounts the framework `component://tools/screen/System.xml` for `ADMIN` only, so an instance administrator has full parity from the first release:
- ServiceJob Jobs and JobRuns;
- SystemMessage Type, Message and Remote;
- Localization Messages and EntityFields;
- AuditLog;
- Security UserAccount, UserGroup, ArtifactGroup and ActiveUsers;
- Print Printer.

Admin does not re-specify these forms. Their own artifact authorization and sealed permissions apply unchanged, and the mount adds no grant: Tools' `SYSTEM_APP` check still applies under the Admin root. `BOSS_ADMIN_ADMIN`'s root grant is `AUTHZT_ALLOW`, not an inheritable `AUTHZT_ALWAYS` that would skip it, and the Admin groups (`BOSS_ADMIN`, `BOSS_ADMIN_ADMIN`) are denied `System.xml` by its location, so only an `ALWAYS` of Tools' own (`ADMIN`'s) opens it; its links stay under Admin › System but those into Monitor, Dashboards and Tools, which keep their own grants (impl-admin F2, F-P1-1). Admin builds a delegated BOSS screen only where a role without `ADMIN` needs the function:
- Jobs and JobRuns, and SystemMessages, for the operations operator (O);
- MessageTypes for the integration administrator (I);
- Localization for the configuration administrator (C);
- AuditChanges for the audit reader (V);
- Users, Groups and Sessions for the identity operator (U) and access administrator (A).

The settings index is the one Admin screen granted beyond the Admin groups: `BOSS_USERS`' non-inheritable `AUTHZT_ALLOW` on SettingsHome (§7, impl-admin F46), which, not being inheritable, opens neither System nor any other Admin screen.

**Source:** research §§7, 10–12; review R-ADM-L01.

### DeveloperHome

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ToolLinks | list, read | Open authorized advanced tools | tool, purpose, permission, environment, link | omit unauthorized actions | proposed `ironstone.admin.RegistryServices.find#ToolLinks` over the framework tool routes, each checked with its own permission | Tools/System dashboards |

Destinations include raw entity import/export/snapshots, data edit/views/documents, status flows, SQL/script/service runners, cache, resource/print configuration and host instance tools. They retain their actual framework permission checks and environment restrictions. Admin does not add a raw shell, arbitrary service-run field, generic code automation designer or browser database restore. Public sites expose none of these through Admin links. Self-hosted instance management is an operations concern; a multi-tenant hosting control plane remains outside BOSS. **Source:** research §§7, 11, 14–15. **Needs:** ADM-ACCESS, ADM-SHELL.

## 14. Shared registration contracts

Registrations are trusted component definitions, validated at load. They are not arbitrary service names entered by an administrator. Missing optional providers are omitted with a safe diagnostic; one malformed provider does not remove independent registrations. Existing shell-provider and framework report/monitor registries are extended or referenced rather than replaced.

| Contract | Minimum information | Execution and ownership |
| --- | --- | --- |
| Settings entry | stable key/version, title/description, owner app, instance/organization/store/facility/user scope, canonical editor, view/configure permissions, narrowing parameters, effective-source/readiness provider | BOSS index composes owner entries. Owner resolves scope and executes writes; route context grants nothing. |
| Capability description | app/domain, named permission, launcher artifact gate where relevant, display grouping, view/edit/export distinction, supported scope dependencies, delegated assignment policy | Existing Moqui permissions/artifact rules remain authoritative; grants are dated native rows. Built (impl-admin P3) as the framework's `moqui.security.CapabilityBundle` (group, app, description, scope dependency, delegable permission), `CapabilityBundlePermission` (kind view, edit, export or sensitive) and `CapabilityBundleArtifact` (a launcher binding with its filter sets); BossSetupData fills the built apps' rows. |
| Readiness provider | stable check key/version, owner, required capability, permitted scope, nonmutating read, state/checked-at/reason and authorized fix link; a **freshness facet** for data sources: last successful watermark, expected frequency, lag, coverage | Source owner calculates; `ironstone.admin.RegistryServices.get#Readiness` aggregates. Admin Health and Insights DataReadiness read the same providers, with no second readiness registry. Insights may trend permitted values. No generic repair service. Commerce `check#StoreReadiness` registers here. |
| Refresh operation | key, owner service, source it refreshes (index, feed, projection), required permission, scope parameters, operation identity, safe result | Proposed `ironstone.admin.RegistryServices.request#Refresh(refreshKey, organizationPartyId, scopeParameters, reason, operationKey)` checks the registration's own permission and calls the owner's service. Admin Health and Insights RefreshRequest use it. It never takes a service or index name from the request. The Insights steward's `index#BusinessDataset` registers here. |
| Connection adapter | native kind/key, projection, credential classification, permissible mutable fields, the endpoint fields that clear dependent secrets, organization-binding rules, explicit test, consumer/readiness provider | Framework or Mantle native services enforce writes. Admin supplies the sole credential/infrastructure UI. A change to an endpoint, host, URL, port or auth-type field clears or requires re-entry of its secrets in the same save and leaves the connection disabled until a test against the new endpoint passes (§8.1). |
| Lifecycle participant | domain, affected ownership/resource lookup, supported revoke/pause/transfer action, eligibility, operation identity and safe results | Entry: People's hire and employment-change commits reach `ironstone.admin.LifecycleServices.request#Provisioning` and `request#AccessEnd` (key: partyId, organizationPartyId, employment key, grant proposal, operationKey; §4.1). The coordinator then calls each participant's action, and each independent step has a durable outcome. Participants: Insights proposed `org.moqui.report.ReportServices.pause#OwnedSchedules(userId)` and `transfer#DefinitionOwner`; Commons shared resources (drives, contact books, calendars); Comms shared mail accounts; Projects assignments. |
| Operational recovery | source kind/key, business operation identity, observed state/revision, evidence, permitted reconciliation/retry/cancel actions, required authority, owner route | Admin dispatches only eligible owner actions. Commerce `retry#StoreMessages` registers here. Monitor incident recovery remains the existing separate operational engine. |
| Import/export target | target/version, formats, allowed fields, the five steps `stage#`, `configure#`, `validate#`, `apply#`, `get#` (as Products' `ProductImportServices`) or an owner wizard's result contract, source/replay key rules, scope and permissions, atomic-unit rule, safe result schema, retention owner | Shared DataImport and Admin export composition call domain writers/exporters; owner batches remain owners (§11.1). |
| Retention/privacy provider | category/version, canonical host, classification, policy source, hold support, authorized search/preview (also used by PrivacyLookup), permitted dispositions, executor and audit/result route | Domain owner decides what can be retained/changed/deleted; coordination cannot bypass domain protection. Providers are listed in §12 (review X15). |
| Assist registration (CX-ASSIST) | component `skill/*.md` procedure skills with `screens:` and `skill/aliases.json`; `assist-prompt` and `response-action` in each app root's `shell-providers`; `AgentToolExposure` rows (tool name, service, classification, `exposeAssistant`, `exposeMcp`) | Rows exist only where no screen does the job. `exposeMcp` is decided by data class: HR, payroll and grievance services get N, and `data-entity` patterns never name HR or payroll packages. Exposures are stored with `org.moqui.agent.AgentAdminServices.store#AgentToolExposure` and listed read-only in AgentsHome. Prerequisites: the framework per-field AI opt-out for confidential text and the Mantle active-organization user-facts provider. |
| Shared-device registration (CX-DEVICE) | route group key and owning app, device-credential policy (idle timeout, allowed facility), per-action person identification (badge `scan-input` plus PIN) | The owning app registers its route group, Insights' Playlists first; Admin Devices registers and revokes device credentials for it (§6). The credential itself is a framework need. |
| Shipped report definitions (CX-OPS-REPORTS) | component `report/*.json` datasets, one dashboard and alert templates; `operation` and `operation-ref` on long-running services | The framework loads them read-only with save-as-copy. Insights admits the business datasets (Insights §5), and Admin ships its own (§1.2). |

Safe result envelopes carry provider/key, canonical source identity, state, reasonCode, user-safe message, revision, checked/completed time, authorized link and counts only when permitted. Never include credentials, arbitrary code, hidden HR columns or another recipient's report body. Service implementations declare out-parameters. All operations revalidate current permission and scope, and mutating ones use expected revision plus stable operation identity where retries can repeat effects.

### 14.1 Suite ownership matrix

| Concern | Owner and Admin use |
| --- | --- |
| Accounts and grants | Admin account lifecycle; framework security enforces; Commons self-service and People employment link the same identity. |
| Internal organization profile | Admin/shared Contact; People structure and Accounting accounting configuration remain owner sections. |
| Constitution | Framework localized document/instance file/prompt and reference services, shared viewer and separate instance origin policy; Mantle organization scope and inline PartyContent; Admin canonical translation/reference editor and scoped human reading (§7). |
| Catalog/pricing/units | Products; Admin settings index only. Noncurrency global UOM writes remain framework ADMIN. |
| Stock/carrier/facility policy | Warehouse; Admin infrastructure credentials and readiness only. |
| Production and resource policies | Manufacturing and Maintenance; shared availability/process contracts remain their owners. |
| Buying, sales and service policy | Purchasing, Sales and Customer Service; Admin points to their approved settings/recovery actions. |
| Payment/tax/gateway use | Admin Connections owns gateway, remote and OAuth configuration records and their credentials, and PaymentGatewayOrganization availability. Accounting owns payment methods, gateway binding and the tax gateway selection; Warehouse carrier bindings; Commerce offers the store organization's enabled PaymentGatewayOrganization rows (review Z4). |
| Stores, promotions and public presentation | Commerce; PASS is independent, with its own public accounts/sites and published grants. Admin does not turn a staff record public. |
| Communications and participation | Comms accounts/templates/sending profiles/suppressions; Marketing campaigns/consent/events; Admin domains/relay/transport trust. |
| Reporting and delivery | Insights domain catalog on framework reports; personal and owner-equivalent group delivery first, recipient execution later; safe outcomes. Admin lifecycle/pause/ownership, not report bodies. |
| Operational telemetry and agents | Framework Monitor and System/Llm; Admin links/composes existing owners and retains their permissions. |
| Files, collaboration and approvals | Commons/shared canonical hosts and owner decisions; Admin never attaches private credentials to general Chatter. |

### 14.2 Settings registry seed

SettingsHome is filled from these registrations, one per owner settings index, derived from crosscut §5 and each design's Settings section (review Z6). Each owner adds its row to its own seed data; a deep link inside an index (a single policy screen) is a further entry with the same permission. Personal settings (Commons Settings, Comms personal mail settings) are the user's own and are not in the index.

| App | Settings entry (path) | Records | Configure permission | Readiness provider |
| --- | --- | --- | --- | --- |
| Sales | Sales/Settings (Stages, Teams, LeadSources, Targets, TypesAndReasons, SalesDefaults, ApprovalPolicies) | SalesOpportunityStage; team PartyRelationship; DataSource (lead sources, shared with Marketing); SalesForecast; proposed SalesPolicy, SalesApprovalPolicy | `SALES_CONFIGURE` | proposed `mantle.sales.SalesWorkspaceServices.get#SalesReadiness` |
| Marketing | Marketing/Settings (CampaignDefaults, Vocabularies; LeadSources mounts Sales'; SendingProfiles mounts Comms') | proposed MarketingPolicy; Enumeration | `MARKETING_CONFIGURE` | — |
| Customer Service | CustomerService/Settings (Queues, AgentTeams, AssignmentRules, ServiceLevelPolicies, StatusCategories, CaseTypes, CaseTemplates, SavedReplies, ChannelRouting, ReturnPolicies, KnowledgeSources, FeedbackForms) | RequestCategory; EmailRule; DbForm; proposed ServiceQueue, ServiceLevelPolicy, ReturnPolicy | Customer Service administrator (Customer Service §1) | — |
| Commerce | Commerce/Settings/CheckoutSettings (Carriers, PaymentMethods and TaxAuthorities are read-only mounts of their owners) | ProductStore and store options | store manager (Commerce §1) | existing `mantle.product.StoreAdminServices.check#StoreReadiness` |
| Products | Products/Settings (VariantSettings, PricingSettings, IdentificationTypes); Products Units | proposed ProductCatalogSetting, ProductVariantSetting; noncurrency Uom and UomConversion (framework `ADMIN` writes) | catalog administrator (Products §1) | CatalogChecks |
| Purchasing | Purchasing/Settings (PurchasePolicy, ApprovalPolicies, ScorecardPolicies) | proposed PurchasePolicy, PurchaseApprovalPolicy, SupplierScorecardPolicy | purchase administrator (Purchasing §1) | — |
| Warehouse | Warehouse/Settings (StockPolicies, ReservationPolicies, AssetPools); Warehouse Carriers and Printers | Facility; proposed WarehousePolicy; ProductFacility policy; CarrierShipmentMethod and ShippingGatewayConfig bindings; FacilityPrinter | warehouse manager (Warehouse §1) | — |
| Manufacturing | Manufacturing/Settings (ProductionSettings, ReasonCodes) | proposed ProductionPolicy; work centers | production/resource administrator (Manufacturing §1) | — |
| Maintenance | Maintenance/Settings (Teams, Lookups) | proposed MaintenancePolicy; teams; lookups | maintenance administrator (Maintenance §1) | proposed `mantle.work.MaintenanceSettingsServices.check#MaintenanceReadiness` |
| Accounting | Accounting/Settings/Settings (Setup, AccountingPreferences, PostingDefaults, PaymentTerms, Currencies, PaymentMethods, CollectionPolicies, DocumentSettings, MatchPolicies); Accounting Tax | PartyAcctgPreference; `mantle.ledger.config` records; PaymentMethod and gateway binding; TaxAuthority and tax gateway selection; currency Uom | finance administrator (Accounting §1) | existing `mantle.ledger.SetupServices.get#Readiness` |
| People | People/Settings (LeavePolicies, HolidayCalendars, PayComponents, PayStructures, PayGroups, ApprovalPolicies, ChecklistTemplates, Lookups, Forms) | proposed LeavePolicy, PayrollComponent, PayrollStructure, PayrollGroup, PeopleApprovalPolicy | `PEOPLE_CONFIGURE`; payroll entries the payroll configuration permission | proposed `mantle.humanres.PeopleServices.get#Readiness` |
| Projects | Projects/Settings (WorkItemTypes, Workflows, Labels, Templates, Time, Billing, Code, Intake) | Enumeration; StatusFlow; WorkEffortCategory; PartySetting; RequestCategory | Projects managers (Projects §1) | — |
| Comms | Comms/Consent (consent and list subscriptions; impl-admin F44: Comms/Settings is personal and not in the index; shared templates, text blocks, sending profiles and suppressions are Comms' later work, each a further entry when built) | ContactListParty consent; later EmailTemplate, EmailTextBlock, proposed MessageSendingProfile | `CONTACT_ADMIN` (contact admins) | — (a shared mail-account readiness projection is Comms' later work) |
| Insights | Insights/Settings (DataReadiness) | organization analytics defaults | `INSIGHTS_SETTINGS_EDIT` | Insights data sources through the freshness facet |
| Voice | System/Voice (BasicComms) | trunks, numbers, caller IDs, ring groups, IVR menus, queues | `VoiceAdmin` | Voice Status |
| Admin | Admin/Settings (Organizations, InstanceSettings, Constitution, Localization, ReferenceData); Admin/Integrations/Connections; Admin/Protocols/MailRelays; Admin/Operations/Topics | internal organizations; InstancePreference; gateway, remote, OAuth and printer configuration; relays; NotificationTopic | `ADMIN_SETTINGS_MANAGE`, `ADMIN_CONNECTION_MANAGE` | Admin's own checks (§3) |
| Admin | Admin/Settings/Constitution | localized shipped/instance JSON; organization PartyContent (the reference-origin policy stays System › Constitution's) | `ADMIN_SETTINGS_MANAGE` with organization scope; global save/reset additionally `ADMIN_CONSTITUTION_GLOBAL` | effective source/locale, fallback and reference-policy diagnostics from Constitution services |

## 15. Coverage and acceptance

### 15.1 Research inventory disposition

| Research candidate | Disposition |
| --- | --- |
| Admin home, setup checks, health widgets | Home/Health; reuse existing report widgets and Monitor; proposed domain readiness aggregation only. |
| Users, invite single/CSV, account/Employee360 details | Users/UserDetail/Invitations/AcceptInvitation/Sessions/Lifecycle; account owner is Admin, People/Commons link or include authorized portions; no copied HR profile. |
| Groups, capabilities, matrix, row rules, access inspector | Access screens; named permissions with existing artifact/row policy, no new authorization engine. AccessInspector is later. |
| Security policy, SSO and IP restrictions | SignInPolicy, IdentityProviderDetail and UserDetail `ipAllowed`; conf-owned policy remains effective-state read; group flags editable through guards; LDAP/SCIM later. |
| Organization profile, instance settings, localization, dictionaries/status flows | Settings screens and owner index; shared Contact profile; raw model/status editors remain Tools. |
| Apps/modules | Capability launcher gates and settings index. Fixed BOSS applications are not an install/uninstall marketplace. |
| Webhooks, remotes/types, keys, gateways | Integrations screens; credential lifecycle on UserDetail; gateway, remote and OAuth configuration and organization availability Admin-owned; bindings and selection stay Accounting/Warehouse/Commerce. Webhooks later. |
| Relay, SMTP trust, domains, protocol servers, queues | Protocol screens over current facilities; MailDomain/readiness additions explicit (MailDomains later); no protocol runtime claimed missing because the research predates it. |
| Mail accounts and templates | Canonical Comms screens linked from ProtocolsHome/consumer lists; no duplicate forms. |
| Notification topics/subscriptions | Topics/TopicDetail; personal preferences Commons, approval/consent behavior stays owner. |
| Jobs, job monitors, alerts | Tools System › ServiceJob for `ADMIN`, delegated Jobs/runs for O, plus existing Monitor/report alert/check/incident/recovery tools and the shipped job-run alert template. No new ServiceJobMonitor subsystem. |
| Import/export, profiles, snapshots and backups | Shared/DataImport generalized from Products with registered targets, domain-format DataExport, Insights for dataset exports, Backups; raw snapshots/restore and arbitrary entity operations stay Tools. Saved export profiles are Open. |
| Audit, visits/hits, errors, access evidence | AuditChanges/AccessLog and existing Monitor destinations. ArtifactHit/ArtifactHitBin are retired; no resurrected store. |
| Retention/privacy | Reviewed provider-based retention/holds, PrivacyLookup and PrivacyRequest flow (later); no global Party cascade deletion. |
| Assist, models/skills/tools/usage/A2A | Existing System/Llm administration; current Agent and Llm models, permissions and tool policy, not research-era entities. The missing agent editor, A2A tasks screen and gateway key are framework needs (ADM-AGENTS). |
| Developer/hosting/customization | System mount and DeveloperHome links with existing sealed rights; generic customization and multi-instance hosting deferred/outside BOSS. |

### 15.2 Baseline form traceability

The inventories add **Designed in** mappings only. Framework forms are cited here because `ss-inventory`/`usl-inventory` track Marble/Mantle, not all Tools services.

| Baseline | Designed destination/disposition |
| --- | --- |
| Gateway Payment: EditPaymentGatewayForm, NewPaymentGatewayForm, PaymentGatewaysForm | Admin/Integrations/ConnectionDetail and Connections; gateway configuration and credentials, plus Accounting's binding-selection owner links. |
| Gateway Shipping: EditShippingGatewayForm, NewShippingGatewayForm, ShippingGatewaysForm | Admin/Integrations/ConnectionDetail and Connections for configuration and credentials; Warehouse retains carrier/method business bindings. |
| Vendor FindVendor: FindVendor, CreateVendor, VendorList | Admin/Settings/Organizations (OrgInternal parties). |
| Vendor EditVendor: EditVendor, RoleList | Admin/Settings/OrganizationDetail shared identity/role profile, with guarded internal-role editing. |
| Vendor EditVendor: PaymentInfo, BillingInfo | OrganizationDetail shared contact-purpose forms; actual payment instruments stay Accounting. |
| Vendor EditVendor: SetVendorRepForm; EditUsers AddUserRelationshipForm, UpdateUserRelForm | OrganizationDetail OrganizationMembers with dated/authorized relationship semantics. |
| Vendor initialize-accounting link | Accounting-owned setup action linked from OrganizationDetail; no new unconditional initialization on create/save. |
| Party/EditParty CreateUserAccount | Admin/Users/Users NewStaffAccount; direct creation is an authorized exception to the invitation default. |
| Party/EditParty UpdateUserAccount, AddGroupForm, GroupsForm | Admin/Users/UserDetail Account and Memberships; preserve Commons/People/shared Contact mappings already present. |
| Party/EditParty AddSettingForm, AddSettingTextForm, SettingsForm | Admin/Settings/OrganizationDetail OrganizationDefaults for registered internal-organization defaults; preserve other context mappings. |
| Tools UserAccount/UserGroup/ArtifactGroup, SSO entities, jobs, messages, localization, audit | Mounted unchanged for `ADMIN` at Admin/System; the delegated BOSS forms above adapt their functions with scoped service guards for the roles named in §13 System. |

### 15.3 Acceptance scenarios

Each scenario is an acceptance test to write (`acceptance/Admin/`, `acceptance/client/Admin/`), named in the
implementation plan; the rules it relies on get their own regression tests. No route fixtures: a screen sweep is an
acceptance test, one per app per mode.

| Scenario | Required evidence |
| --- | --- |
| Delegated administration | An organization identity operator can invite/end membership there, cannot inspect another organization's details, disable a multi-organization identity globally, assign privileged/sealed rights or infer them from a launcher grant. Direct service/import/SSO attempts obey the same rules. |
| Escalation through grants | An access administrator who holds `ADMIN_ACCESS_MANAGE` through a delegated group but is not in `BOSS_ADMIN_ACCESS` cannot add anyone to `BOSS_ADMIN_ACCESS`, `BOSS_ADMIN_BACKUP` or `BOSS_ADMIN_ADMIN`; a user without `ADMIN_BACKUP_DOWNLOAD` cannot write a UserGroupPermission granting it, through Admin, Tools, an import or a direct entity call. The refusal comes from the framework EECAs under the framework's seals and mr-boss's privileged groups. |
| Last administration path | A group/provider/factor change that would remove all usable instance administration is refused with a reason; a permitted change records before/after and takes effect in subsequent requests. |
| Relay scope | MailRelays lists SYSTEM and Admin relays and no account-owned EmailServer; a direct `store#Connection` or `test#Connection` on an account-owned server is refused. |
| Endpoint change | Changing a gateway endpoint, a remote `sendUrl` or a relay host without re-entering the secret clears it; the connection is disabled and no test or send goes to the new host with the old secret. A passing test against the new endpoint enables it. |
| Hire and invitation | People hire commits once; the tx-commit SECA calls `request#Provisioning` once per operation key, and failed invitation transport does not roll back employment. Retry keeps one account/invitation operation. The IT checklist task shows the lifecycle operation. Resend revokes the prior token; expired/revoked/wrong-address/public tokens cannot grant internal access. AcceptInvitation creates or links exactly one account. |
| Offboarding | Global disable revokes sessions/keys/app passwords/SSH access and stops pending privileged work; a future effective date sets `terminateDate`. One-org removal preserves unrelated access. Owned schedules pause through `pause#OwnedSchedules` and resume only after `transfer#DefinitionOwner` to a qualified owner; disabled-user contact books and historical financial/HR records survive until reviewed retention permits action. |
| Access explanation (later) | Inspector identifies grant, row and domain restrictions without executing the action or revealing a denied record; unsupported dynamic checks are unresolved, not an invented allow. |
| Settings ownership | Authorized finance config works without another app's launcher. Admin provisions PaymentGatewayOrganization; finance can select it but cannot change credentials. Products owns global units; domain policy retains its effective date/source. Every §14.2 entry opens its owner screen with that owner's permission only. |
| Protocol readiness | Built-but-disabled, unbuilt, missing trust/TLS, failed test and ready states differ. An SMTP allowlist/authserv mismatch never reports trusted reception. Domain proof does not enable open relay; secrets stay masked. |
| Unknown provider outcome | A timed-out charge, label, campaign submission or mail send is reconciled through its owner. Bulk queue recovery never repeats successful business effects or fabricates acknowledgement. |
| Independent failure | One failed readiness provider, transfer row, lifecycle step or job item is named while independent work continues; dependent postings remain atomic. |
| Import preview/retry | Stale mappings/source revisions are refused. A retry cannot duplicate successful rows, bypass payroll/stock/financial writers or import passwords/groups. Corrected rows carry new reviewed revisions. The Products catalog target behaves through Shared/DataImport as it does through the built ProductImport. |
| Export and recipient delivery | A group report reaches only recipients whose scope equals the owner's, each in a separate message; Admin sees status but cannot read another recipient's payload. Duplicate selection sends once; uncertain delivery needs reconciliation. |
| Monitor reuse | Job trace links open current Monitor, alerts use existing definitions, incidents/recovery use existing permissions. Missing/degraded telemetry is not healthy. No ArtifactHit table or new incident engine is required. |
| Backup scope | Embedded success, external-provider unknown, skipped, partial and failed outcomes differ; the mirror and the not-included warning show. Once download ships, archive keys cannot escape approved storage and download needs fresh authentication and `ADMIN_BACKUP_DOWNLOAD`, and logs access. |
| Privacy hold (later) | Preview separates retain/redact/export/erase by owner; active holds and posted accounting/payroll history block prohibited actions. One provider failure leaves other outcomes and unresolved work visible. PrivacyLookup shows counts without record bodies. |
| Agent policy | Admin opens existing System/Llm with AgentAdmin; source data permissions and tool approval/version rules still apply. Usage summaries do not reveal prompts or report bodies. Admin's exposed READ tools answer through the user's own permissions; `find#Users` is not offered to MCP clients. |
| Constitution reading, customization and reset (A1) | An organization member reads localized rules, provenance, references and the agent preview without general Admin access. Check en/es/zh and missing-translation fallback. Its delegate edits human/agent translations and reference titles/URLs, adds/reorders rules/references without changing IDs, preserves other locales, and resets to global; cannot write another organization, the global file or origin policy. An instance editor customizes/resets the file without changing the shipped default or resetting origin policy. Stale saves/resets and invalid JSON preserve the previous document; invalid-source diagnostics, attribution and source/locale remain visible. |
| Constitution reference dialog (A1) | A reference from the human view or Assist chat opens the same iframe dialog at the specified fragment and preserves the app route/chat. Check title/source, keyboard focus, Escape/Close and restored focus; external blocking/unreachable content and manual unavailable help; internal read authorization and denied cross-organization content; revoked origins/access on historical links. Embedded content cannot navigate the parent or invoke Assist tools. Deployed Grok headers and published anchors are a separate release check. |
| Output/UI parity | Every screen table row has a defined form/context, source and need; phone/TUI can complete its supported task; zero, absent, failure and denied states remain distinguishable. |

Constitution service rules get focused future regression checks in their owning framework/Mantle layer: inheritance/reset, one-row organization storage, scope isolation, locale-map validation/fallback and preservation, reference identity/URL/origin validation, concurrent document/policy saves/resets and failure diagnostics. Prompt inclusion, source/revision/locale refresh, authorized snapshot reference retrieval and multilingual model behavior belong to Assist §7.10. Its live-model acknowledgement evaluations are separate from deterministic service checks and the future acceptance walk above. This design/default-JSON change adds no runtime or acceptance test.

## 16. Documents and outputs

| Output | Kind | From screen | Derived from |
| --- | --- | --- | --- |
| Staff invitation and acceptance notice | email | Invitations/UserDetail | an EmailTemplate of the existing EmailType `EMT_ACCOUNT_INVITE`, linking AcceptInvitation (`/i/<token>`); single-use token never in logs |
| Password reset | email | UserDetail Authentication | existing `PASSWORD_RESET` template sent by `reset#Password`: a random change-only reset password |
| New-device sign-in notice | notification/email | Sessions (sign-in hook) | proposed `AccountSignIn` topic; time, client summary, sign-out link; no IP detail beyond network |
| Lifecycle completion/exception notice | notification/email | LifecycleDetail | registered minimal topic; safe target/operation links |
| Access/grant review | html-print, CSV | GroupDetail/Capabilities | same authorized grant projection and effective dates; sealed/secret values excluded |
| Readiness/support summary | html-print, redacted JSON | Health/ServerConfiguration | provider results, effective nonsecret configuration and version/freshness; no environment dump |
| Import template, preview/error rows and result manifest | CSV/XLSX where available | DataImport/ImportDetail | registered target schema and protected source keys; row identities and safe reasons |
| Business export | domain format (vCard, CSV, payroll exchange, ledger) | DataExport | the owner's exporter; same caller authority and authorized fields |
| Internal scheduled report/digest and alert | email/notification with protected artifact | Insights owner screen linked from Exports/Jobs | INS-06/INS-07; personal or owner-equivalent group delivery, one message per recipient; Admin sees delivery status only |
| Backup archive (later) | protected download | Backups | existing backup provider archive, sealed `ADMIN_BACKUP_DOWNLOAD` and audit |
| Privacy inventory/decision evidence | html-print/protected export | PrivacyRequestDetail | safe coordination projection; actual subject data via verified owner export |
| Audit evidence | CSV/html-print | AuditChanges/AccessLog | authorized redacted records with correlation/source/freshness |

Prints use `html-print`; PDFs use the existing renderer. File generation does not weaken row/field restrictions. Downloads recheck current authorization, are scoped to authenticated users and expire with their retention policy. Recipients never receive an owner's broader report because their address was added to a schedule. General external report distribution, public dashboard sharing and business-data webhook reports are later.

## 17. Framework and data needs

### 17.1 Needs register

These IDs are the crosscut roll-up keys. **Existing** identifies reusable facilities; **proposed** identifies the work still needed. The Layer names where the work goes: framework (mr-moqui, linked from [Remaining-Work](../../../../plans/Remaining-Work.md)), Mantle, or mr-boss. Implementations extend the lowest owning layer, keeping Mantle independent of BOSS.

| ID / need | Kind | Existing foundation and proposed addition | Screens | Boundary |
| --- | --- | --- | --- | --- |
| ADM-ACCESS — delegated administrative access | service type, seed data | Existing permissions/artifacts/filters and the `user-facade` `authz` seals. Proposed: the framework's `authz` `sealed-permission` and `privileged-group` elements and its three Admin seals, and mr-boss's three privileged groups (§1.1); administrative permission bundles; framework `AccessServices` grant preview/apply and `IdentityServices.check#AdministrationPath`; later `explain#Access`. Layer: framework services, mr-boss seed and conf | Users, Access, Security, all shared mounts | No BOSS group checks or second authorization evaluator; guards apply to direct services/imports/SSO too. |
| ADM-LIFECYCLE — staff identity lifecycle | data model, service type, seed data | Existing accounts/factors/keys/sessions, `reset#Password`, `EMT_ACCOUNT_INVITE` and Party services. Proposed: Mantle `IdentityServices`, `UserInvitation` and `UserLifecycleOperation`; the `/i` token route and AcceptInvitation; BOSS `LifecycleServices.request#Provisioning`/`request#AccessEnd` and the People tx-commit SECA; framework `find#Sessions`/`revoke#Sessions` (shared with Commons), `revoke#AccountAccess` and `notify#NewDeviceSignIn`. Layer: Mantle, mr-boss, framework | Users, UserDetail, Invitations, AcceptInvitation, Sessions, LifecycleOperations, LifecycleDetail | PASS invitations stay distinct; People commits hire first; revoke access without deleting data. |
| ADM-SETTINGS — owner settings and typed defaults | seed data, service type, data model | Existing PartySettingType/PartySetting, themes/localization and conf. Proposed: BOSS settings index and its §14.2 seed rows (each owner seeds its own); framework effective-config projection and typed nonsecret InstancePreference where no owner store applies. Layer: mr-boss, framework | Settings, Health, AgentsHome | One editor per configuration record; no secret/configuration blob or copied domain defaults. |
| ADM-CONSTITUTION — shared human and agent guidelines | localized JSON document, service type, seed data, shared dialog and instance policy | Built Nov 7: the default en/es/zh JSON and 37 references, framework locale/format validation, global file services, prompt integration, snapshot reference lookup and trusted viewer/origin policy (System › Constitution), Mantle's scoped provider over PartyContent `PcntConstitution`, and the sealed global/policy edit grant. Proposed: the BOSS canonical translation/reference editor (A1). Layer: framework, Mantle, mr-boss | Constitution (A1); OrganizationDetail and AgentsHome links | Whole-document inheritance; visible locale fallback; shared stable identities; scoped/concurrent/audited edits; current trust/access checks on links; acknowledged exceptions do not bypass permissions/approvals. |
| ADM-CONNECTIONS — connection configuration | service type, seed data, data model | Existing gateway configs, remotes, EmailServer, EmailOAuthProvider, NetworkPrinter and PaymentGatewayOrganization. Proposed: framework connection adapters with the endpoint-change rule (secrets cleared or re-entered, disabled until tested), relay scope (EmailServer no account owns), consumer readiness; later EventSubscription over DataDocument RT-push feeds. Layer: framework, Mantle gateway adapters | Connections, Webhooks (later), IdentityProviders, MessageTypes, MailRelays | Admin owns configuration and credentials; Accounting, Warehouse and Commerce own bindings and selection; no second queue or executable admin input. |
| ADM-PROTOCOLS — protocol and domain readiness | service type, data model, seed data | Existing SMTP trust, mail client, DAV/SSH/RTC/TURN/SIP/WOPI facilities. Proposed: framework effective-state checks and `test#Protocol`; later MailDomain verification and `check#AddressClaim`, which Comms calls. Layer: framework | Protocols | Conf remains deployment truth; DNS verification does not bypass edge trust or promise delivery. |
| ADM-OPERATIONS — safe operational composition | service type, seed data | Existing ServiceJob/SystemMessage/mail outcomes and Monitor/report incident/alert/recovery engines. Proposed: framework scoped projections and recovery dispatch; BOSS readiness aggregation with the freshness facet and the refresh-operation contract (`get#Readiness`, `request#Refresh`). Layer: framework, mr-boss | Home, Health, queues, Jobs, Monitoring | Preserve operation identity and uncertain-result reconciliation; never generic retry-all over business effects. |
| ADM-IMPORT — business transfer staging | data model, service type, XML Screen element | Existing parsers, the built Products import (`ProductImportServices`, `Shared/ProductImport.xml`, `ProductCatalogOperation`) and domain imports. Proposed: Shared/DataImport generalized from it; framework `DataTransferServices` target registry and dispatch; TransferBatch/TransferItem only for targets without an owner batch. Layer: mr-boss screen, framework services | Imports, DataImport, ImportDetail, bulk invite; each app's import mount | Validate without effects; recheck preview; independent units continue; native domain writers enforce invariants. |
| ADM-EXPORT — export/backup adapters | service type, seed data | Existing domain exporters and embedded backups. Proposed: framework transfer status, registered domain-format export dispatch, backup coverage; later archive download. Layer: framework | Exports, DataExport, Backups, privacy export | No arbitrary entity/path export; dataset and report exports are Insights'; backup download is sealed and instance-wide. |
| ADM-RETENTION — reviewed privacy coordination | data model, service type, seed data | Existing cleanup mechanisms and domain retention. Proposed (later): hold registration/enforcement, PrivacyRequest/result records, PrivacyLookup, the PASS Account intake and registered domain providers. Layer: framework, each domain | Retention, PrivacyRequests, lifecycle | Domain owners enforce history/holds; disabled users are not automatically purged; unsupported erasure stays unsupported. |
| ADM-AUDIT — administrative evidence | service type, data model | Existing EntityAuditLog, report/monitor/agent audit and telemetry. Proposed: missing administrative action/reason/correlation events on the existing audit targets, scoped projections. Layer: framework | access/credential changes, transfers, backups, privacy | No duplicate business history or retired hit store; redact before logging and before output. |
| ADM-SHELL — administrative shell/context | shell item, service type, seed data | Existing shell-provider/context/dashboard widgets. Proposed: Admin palette/Today/quick-create/topic/readiness registrations, push policy per topic. Layer: mr-boss | all | Safe identifiers and authorized summaries only; provider failures isolated. |
| ADM-AGENTS — agent administration screens | tool, service type | Existing System/Llm screens and `AgentAdminServices`. Proposed framework screens in Tools System/Llm: an AgentDefinition editor (surfaces, instructions, `runAsUserId`, `roleGroupId`, `maxCost`, `exposeMcp`/`exposeA2a`, `canvasDialects`, disabled), an A2A tasks screen, and making a gateway client key in the admin screen, shown once. Layer: framework | AgentsHome links | Admin owns no agent screens; it links these once they exist. |
| ADM-DEVICES — shared-device registration | data model, service type | Proposed framework device credential (crosscut CX-DEVICE): revocable, tied to one browser, limited to one route group, with an idle timeout; framework `DeviceServices` register, find and revoke. Layer: framework | Devices; Insights Playlists (wall displays, first); later People ClockingKiosk, Maintenance TechnicianKiosk, Marketing CheckIn, Manufacturing ShopFloor | The credential identifies no person; badge and PIN identify the person per action; a wall display's principal is open (§19 item 7). |
| ADM-ASSIST — Admin Assist contributions | seed data | Existing skills, `shell-providers` `assist-prompt`/`response-action` and `AgentToolExposure`. Proposed: mr-boss `skill/invite-staff.md`, `offboard-user.md`, `reset-factor.md`, `skill/aliases.json`; prompt chips; READ exposures of `find#Users` (MCP N), `get#Readiness` (MCP Y), later `explain#Access` (MCP N). Layer: mr-boss; prerequisite the Mantle active-organization user-facts provider | UserDetail, Health, GroupDetail, Invitations | Tools answer through the user's own permissions; no exposure where a screen does the job. |
| ADM-REPORTS — shipped Admin report definitions | seed data | Existing report definitions, alert rules and job-run telemetry. Proposed: mr-boss `report/admin-job-runs.json` (failing or late job alert template) and `report/admin-access-log.json` (AccessLog dataset over `otel_logs` audit targets, granted to `BOSS_ADMIN_AUDIT`). Layer: mr-boss | Jobs, AccessLog | Shipped read-only; alerts run only when copied to an owner. |

### 17.2 Proposed service families and minimum records

The first fully qualified names below establish the namespace for shortened names in form tables. These are **proposed** interfaces, not existing service claims. A new method is justified by validation, composition, scope or lifecycle behavior; do not add BOSS pass-through wrappers around existing Mantle/framework methods.

| Layer and family | Contract |
| --- | --- |
| BOSS `ironstone.admin.ContextServices` | Resolve app/shared context, authorized options and canonical owner links; no business/security-policy implementation. |
| BOSS `ironstone.admin.RegistryServices` | `get#Overview`, `get#Readiness` (with the freshness facet), `request#Refresh`, `find#Settings`, `find#ToolLinks`; aggregate authorized source results with isolated failures. |
| BOSS `ironstone.admin.LifecycleServices` | `request#Provisioning`, `request#AccessEnd` (called by the People tx-commit SECA, keyed by party, organization, employment key, grant proposal and operationKey) and `transfer#OwnedResource`; they call Mantle `IdentityServices` and the registered Lifecycle participants. |
| Mantle `mantle.party.IdentityServices` | Organization-scoped identity (review Z5): `find#Users`, `get#Account`, `get#AccountHistory`, `create#StaffAccount`, `reset#Authentication`, `invite#User`, `find#Invitations`, `resend#Invitation`, `revoke#Invitation`, `check#InvitationToken`, `get#InvitationSummary`, `accept#Invitation`, `store#OrganizationMembership`, `find#InternalOrganizations`, `store#OrganizationParent`, `preview#Lifecycle`, `start#Lifecycle`, `get#Lifecycle`, `find#LifecycleOperations`, `retry#LifecycleStep`. They use PartyRelationship and PartyRole and call the framework guards. |
| Framework `org.moqui.admin.IdentityServices` | Generic guards only: `check#AdministrationPath`, `revoke#AccountAccess`, `find#Sessions`/`revoke#Sessions` over HttpSession and Visit (Admin and Commons), `notify#NewDeviceSignIn`. No dependency on Mantle or BOSS. |
| Framework `org.moqui.admin.AccessServices` | Native group/membership/grant governance (`find#Groups`, `get#Group`, `create#Group`, `store#Group`, `store#Membership`, `end#Membership`, `preview#Grants`, `apply#Grants`, `store#GroupPreference`, built in impl-admin P3; `get#ScopeRules`, P9) and, later, `explain#Access`; the framework evaluator remains authoritative. Registered bundles are the framework's `moqui.security.CapabilityBundle` with its permissions and artifact bindings, which each component seeds. |
| Framework `org.moqui.admin.ConfigurationServices` | Effective nonsecret configuration, typed instance preferences, localization writes, guarded connection/provider adapters (`find#Connections`, `get#Connection`, `store#Connection`, `test#Connection`, `find#ConnectionConsumers`, `store#PaymentGatewayOrganization`, `find#MessageTypes`, `store#MessageType`, `get#MessageTypeUse`, identity provider services) and explicit diagnostics. Mantle gateway adapters supply their domain validation. |
| Framework `org.moqui.admin.ConstitutionServices`; Mantle `mantle.party.ConstitutionServices` | Built Nov 7 (ADM-CONSTITUTION): framework `get#Constitution`, `validate#Constitution`, `edit#ConstitutionDocument`, `preview#ConstitutionPrompt`, `store#Constitution`, `reset#Constitution` for the localized document/global file and READ `get#ConstitutionReferences` for authorized run snapshots; framework shared viewer and separate instance reference-origin policy (`get#`/`store#ReferenceOrigins`); Mantle `get#OrganizationConstitution`, `store#OrganizationConstitution`, `reset#OrganizationConstitution` for scoped organization content and the registered runtime provider. One JSON document and existing PartyContent, no new Constitution entity. §7 defines the editor contract; Assist §7.10 defines resolution and run snapshots. |
| Framework `org.moqui.admin.DeviceServices` | `register#Device`, `find#Devices`, `revoke#Device` over the CX-DEVICE credential. |
| Framework `org.moqui.admin.IntegrationServices`, `MailDomainServices` (later) | Registered event subscriptions over DataDocument RT-push feeds and SystemMessage; domain proof/readiness, `find#AddressClaims` and `check#AddressClaim` for Comms. |
| Framework `org.moqui.admin.OperationServices` | Scoped registered job/message/mail projections (`find#Jobs`, `find#JobRuns`, `get#JobRun`, `get#JobRunItems`, `find#Messages`, `get#Message`, `find#MailOutcomes`, topics) and recovery dispatch; no replacement scheduler, queue, monitor or alert evaluator. |
| Framework `org.moqui.admin.DataTransferServices`, `BackupServices` | Import dispatch to each target's `stage#`/`configure#`/`validate#`/`apply#`/`get#` (the Products pattern), transfer status, domain-format export dispatch, backup coverage and, later, archive download. Domain services remain the executors. |
| Framework `org.moqui.admin.AuditServices`, `PrivacyServices` | Safe multi-source evidence; later, retention/privacy coordination (`create#Request` also from the PASS Account page, `lookup#Subject`, `find#CleanupResults`). Domain providers, including Mantle party/HR/financial/content services, retain record discovery and disposition authority. |

Minimum proposed records, only where current native records do not already represent the fact:

- **UserInvitation** (Mantle): invitationId, destination, target party/account reference, organization/participant scope, approved grant proposal reference/version, token hash, expires/accepted/revoked times, inviter, state and revision. Grant proposal is validated structured metadata, never executable input; no plaintext token retained.
- **UserLifecycleOperation / step** (Mantle): operationId/key, target, kind/scope, reason, source reference (People operation key and employment key), requested/effective time, actor, revision/state; step identity/provider/action/target, attempt, outcome/reason and completion time. Domain records are linked, not copied.
- **Device credential** (framework, CX-DEVICE): deviceId, name, route group, facility, credential hash, registered by/at, last seen, idle timeout, revoked at.
- **InstancePreference:** registered key, typed nonsecret value, revision, updated-by/time. Definitions fix type/scope/default; there is no arbitrary-setting escape hatch.
- **Constitution uses existing content:** one PartyContent per organization with `partyContentTypeEnumId=PcntConstitution`, the JSON in the resource its `contentLocation` names (as built); seed only the new type and access grants when implementing. The localized default JSON stays outside entity `data/`; text is stored as locale maps, not `LocalizedMessage` rows. Global customization is an instance file, not InstancePreference; no new Constitution entity. Reference origins are separate framework instance policy and never inherited from an organization document or erased by Constitution reset.
- **EventSubscription:** fields specified in WebhookDetail; delivery identity references existing SystemMessage and source event identity. Existing Git/agent subscriptions stay native.
- **MailDomain / verification evidence:** fields specified in MailDomainDetail; proof/check history excludes private signing material.
- **TransferBatch / TransferItem:** only for a target with no owner batch (staff invitations, employees, opportunities in §11.1). Batch identity/provider/version, source resource/hash, mapping/options hash, organization, actor, preview revision, state/counts/retention; item source identity/atomic-unit key, target reference, operation key, state, attempt, safe error and result. A target with an owner batch (Products' `ProductCatalogOperation`, Accounting's `StatementImport`, Maintenance's run) registers it instead.
- **RetentionHold / PrivacyRequest / PrivacyRequestContent / request result:** registered category and scoped target, authority/reason/dates/revision; verified subject/request type/scope/evidence reference/assignee/state/dates; the protected content association and direct resource guard specified in §12; provider-unit decision/revision/operation identity/outcome. Exact domain retention rules remain in their owner records.

New states/kinds use registered StatusItem/Enumeration values and audited transitions. No free-text state machines, universal version store or copied snapshots are introduced. Changes to native configuration use expected revision or lastUpdatedStamp; changes to effective-dated business settings use the owner's dated rows.

### 17.3 Phases

| Phase | Screens | Services and records |
| --- | --- | --- |
| A1, the first release | Home, Health, Users, UserDetail, Invitations, AcceptInvitation, Sessions, Groups, GroupDetail, LifecycleOperations, LifecycleDetail, Organizations, OrganizationDetail, Constitution, SettingsHome, System (Tools mount for `ADMIN`), Monitoring, AgentsHome, DeveloperHome (Nov 7, 2026: the lifecycle screens, Organizations, OrganizationDetail and Constitution moved here from A2; impl-admin §4) | the framework's Admin seals and mr-boss's privileged groups (`authz` elements); Mantle `IdentityServices` for users, memberships, invitations, acceptance, organizations and lifecycle, with `UserInvitation` and `UserLifecycleOperation`; BOSS `LifecycleServices` participants and transfers; framework `AccessServices` grants, sessions, `revoke#AccountAccess`, `check#AdministrationPath`; `RegistryServices` readiness with the freshness facet, the refresh-operation contract and the settings index (Insights DataReadiness uses the first two); the Constitution editor over the ADM-CONSTITUTION services built Nov 7; ADM-ASSIST. People's provisioning entry (`LifecycleServices.request#Provisioning`/`request#AccessEnd` and the People SECA) waits for People (Nov 7, 2026; impl-admin §4, §7). |
| A2 | Capabilities, RowRules, SignInPolicy, IdentityProviders, IdentityProviderDetail, InstanceSettings, Localization, ReferenceData, Connections, ConnectionDetail, MessageTypes, MessageTypeDetail, SystemMessages, SystemMessageDetail, ProtocolsHome, MailRelays, MailRelayDetail, MailQueue, ServerConfiguration, Topics, TopicDetail, Jobs, JobDetail, JobRuns, JobRunDetail, Imports, DataImport, ImportDetail, Exports, DataExport, Backups (coverage, BackupNow), AuditChanges, AccessLog | The remaining framework families; ADM-REPORTS (the job-run alert template and the AccessLog dataset); the new-device sign-in notice; Shared/DataImport generalized from Products, which the domain import mounts then use. Until A2, existing system workflows remain in the System mount for `ADMIN`. Devices (with CX-DEVICE) ships with Insights' second release, for its wall displays (Nov 7, 2026; impl-admin §4). |
| later | AccessInspector, Webhooks, WebhookDetail, MailDomains, MailDomainDetail, Retention, PrivacyRequests, PrivacyRequestDetail; backup archive download | EventSubscription, MailDomain and `check#AddressClaim`, RetentionHold, PrivacyRequest and the PASS Account privacy intake, `explain#Access`, `download#Archive`. |

### 17.4 Later capabilities

LDAP/SCIM/directory provisioning, a generic custom-field/layout editor, visual arbitrary workflow automation, full DMARC/TLS-report ingestion and multi-instance hosting are later/outside this application release. Their present disposition is owner links or absence, not dead menu placeholders. Custom model/editor work must first establish its own security, migration and domain constraints. Existing framework agent triggers, service jobs, registered webhooks and domain automations already cover the supported automation paths. Browser database restore remains an advanced maintenance operation rather than an unguarded future button.

Two reference features are later (review §6):
- **Passkeys.** A WebAuthn factor type in the framework, beside TOTP, single-use, email and SMS, with Commons and UserDetail forms (Odoo `auth_passkey`).
- **Event-condition notification rules.** Send on a record condition or a date offset, over DataFeed RT push and NotificationTopic (Frappe Notification, Odoo `base_automation`).

## 18. Decided

| Decision | Notes |
| --- | --- |
| Admin is a composed administration app | It owns identity lifecycle, infrastructure administration and coordination; domain apps keep business policies/transactions and canonical editors. |
| Capabilities are existing permissions with presentation metadata | This resolves research §18's bundle question. Groups assign native permissions/artifact gates; service scope is separate. No new evaluator and no literal group-name authorization. |
| Hire normally invites after commit | Shared identity, explicit grant proposal and independent outcomes; direct create is an authorized exception/service-account path. |
| Multiple internal organizations per instance | Current Mantle scope is retained. Hosting multiple installations is not an alternate organization model inside Admin. |
| Deployment configuration remains configuration | Effective settings are inspected; only existing/proposed typed runtime setters are editable. Listener/master keys never become generic instance preferences. |
| Instance presentation has a typed nonsecret home | Use existing owner stores first; only truly instance-wide presentation preferences use the proposed minimal registry/record. Currency/fiscal/workweek policy stays domain-owned. |
| Mail domains belong to Admin | Domain control, relay, transport credentials and callback/trust readiness are Admin; account experience, templates/sending profiles and suppression are Comms; campaign consent is Marketing. |
| Current Assist policy is reused | The framework now has tool policy/exposure/approval records and services; these supplement domain authorization. No duplicate BOSS tool-policy engine. |
| Constitution is shared human/agent guidance (Nov 6, 2026) | The en/es/zh default JSON with 37 references is reviewable; the runtime and viewer were built Nov 7 and the editor is A1. Locale fallback stays within the selected whole document; references are loaded on demand for agents and shown in an instance-approved iframe dialog for browser users. Active organization override → instance JSON → shipped default, with a complete document at each level. Admin owns the A1 editor and separate scoped/global editing rights; framework owns prompting and Mantle owns organization PartyContent. Rule-specific human acknowledgement is advisory behavior, not a permission bypass (§7; Assist §7.10). |
| Tools remain separately privileged | Root administration does not grant shell/SQL/impersonation/password/gateway permissions. Existing sealed rights and environment restrictions stay authoritative. |
| Current telemetry, reports and monitoring are reused | Monitor/incident/recovery, report alerts and schedules already exist. Research-era missing-platform statements and retired ArtifactHit references are superseded by §1.3 and §10. |
| Business transfer goes through domain services | Shared envelope and UI, not arbitrary entity loading; independent items have durable outcomes and safe replay. |
| Disablement is not erasure | Revoke access immediately; transfers and retention/holds are reviewed owner operations. No automatic purge of disabled users' personal books or protected history. |
| A missing provider is visible | A provider that is not built or not configured shows as unavailable, or is omitted where optional; it is never shown as succeeding. |
| Admin grants are sealed (Nov 1, 2026; review Z1) | mr-boss MoquiConf adds `ADMIN_BACKUP_DOWNLOAD`, `ADMIN_IDENTITY_GLOBAL` and `ADMIN_ACCESS_MANAGE` to `sealed-permissions` and `BOSS_ADMIN_ACCESS`, `BOSS_ADMIN_BACKUP` and `BOSS_ADMIN_ADMIN` to `privileged-groups`, repeating the framework IDs (§1.1). Superseded Nov 7: the three seals are the framework's and the groups are added by `authz` elements (the row below). |
| A relay is a server no account owns (Nov 1, 2026; review Z1) | MailRelays lists EmailServer rows that no EmailAccount owns; account servers stay in Comms MailAccounts (§9). |
| Endpoint change clears the secret (Nov 1, 2026; review Z1) | Changing an endpoint, host, URL, port or auth type clears or requires re-entry of the stored secret, and the connection stays disabled until a test against the new endpoint passes (§8.1, §14). |
| Staff invitations have an acceptance route (Nov 1, 2026; review Z1) | AcceptInvitation on the `/i/<token>` token route; the email is a template of EmailType `EMT_ACCOUNT_INVITE` (§4). |
| Reset text matches `reset#Password` (Nov 1, 2026; review Z1) | A reset mails a random change-only reset password through `PASSWORD_RESET`, valid for `email-expire-hours`; Admin never sets or mails a chosen password (§4.1). |
| Shared/DataImport is the Products import made general (Nov 1, 2026; review Z2) | Each domain import is a registered target that keeps its own batch entity or owner wizard; TransferBatch only where no owner batch exists. §11.1 lists the targets. |
| People provisioning calls Admin after commit (Nov 1, 2026; review Z3) | A mr-boss tx-commit SECA on People's hire and employment-change services calls `ironstone.admin.LifecycleServices.request#Provisioning`/`request#AccessEnd`, keyed by party, organization, employment and operation key; the IT checklist task carries the operation ID. Insights `pause#OwnedSchedules` and `transfer#DefinitionOwner` are lifecycle participants (§4.1, §14). |
| Connection configuration ownership (Nov 1, 2026; review Z4) | Admin Connections owns gateway, remote and OAuth configuration records and secrets. Accounting, Warehouse and Commerce own bindings and selection, including the tax gateway selection. Commerce offers the store organization's enabled PaymentGatewayOrganization rows. OrganizationAvailability covers PaymentGatewayOrganization only in the first release (§8.1). |
| Phasing and placement (Nov 1, 2026; review Z5) | The first release is Users, Groups, Sessions, Invitations, the Settings index, Health and the Tools System screens mounted for `ADMIN`. AccessInspector, Webhooks, MailDomains, Retention, PrivacyRequests, backup archive download and EventSubscription are `later` (§17.3). Organization-scoped identity services are Mantle's; the framework keeps generic guards (§4.1). The agent editor, A2A tasks and gateway keys are framework needs (ADM-AGENTS). |
| Smaller Admin calls (Nov 1, 2026; review Z6) | Comms creates mail aliases and Admin verifies them through `check#AddressClaim` (§9). One sessions service over HttpSession and Visit serves Commons and Admin (§4). Organizations lists OrgInternal parties only; departments and teams stay People's (§7). §14.2 is the Settings registry seed. |
| Report delivery in the first release (Nov 1, 2026; review Z7) | Insights delivers personal schedules and alerts, and group delivery only to recipients whose scope equals the owner's, as separate messages; full recipient execution is later. Admin shows status and handles ownership only. |
| One readiness provider and a refresh contract (Nov 1, 2026; review Z9) | Admin §14's readiness provider gains a freshness facet and a refresh-operation contract; Insights DataReadiness and Commerce readiness use them. |
| Employee360 has no Admin row (Nov 1, 2026; review Z10) | UserDetail links Employee360 for its authorized audience; Admin does not mount it, and the owner tables drop the Admin row. |
| One privacy intake (Nov 1, 2026; review X15) | The PASS Account privacy page calls `PrivacyServices.create#Request`; each domain registers a privacy provider (§12). |
| Stack contributions (Nov 1, 2026; review L1, L5, L6) | Admin registers Assist skills, prompts and READ tool exposures; registers and revokes shared-device credentials; ships a job-run alert template and the AccessLog dataset (§1.2, §14). |
| Delegated screens only for non-`ADMIN` roles (Nov 1, 2026; review R-ADM-L01) | `ADMIN` uses the mounted Tools System screens; delegated Jobs, SystemMessages, MessageTypes, Localization and AuditChanges serve O, I, C and V (§13). |
| Exports have one surface each (Nov 1, 2026; review R-ADM-20) | DataExport covers domain formats; dataset and report exports are Insights' (§11). |
| Reference features (Nov 1, 2026; review §6) | New-device sign-in notice (§4 Sessions) and PrivacyLookup (§12) are added; passkeys and event-condition notification rules are later (§17.4); session lock, runtime password policy and export profiles are Open. |
| Release order and the plan's answers (Nov 7, 2026) | Admin is built with Insights in one order ([impl-admin](impl-admin.md) §1): the first release adds Organizations, OrganizationDetail and the Constitution, and the lifecycle screens; Devices ships with Insights' second release; components add to the framework's seal lists by `authz` elements; with no mail server InviteStaff shows the acceptance link once for copy. People's provisioning entry and the other parts that wait on People, Sales, Marketing and Maintenance are later (impl-admin §7). |
| Admin seals are the framework's (Nov 7, 2026) | The framework seeds and seals `ADMIN_BACKUP_DOWNLOAD`, `ADMIN_IDENTITY_GLOBAL` and `ADMIN_ACCESS_MANAGE` beside `ADMIN_CONSTITUTION_GLOBAL`, all in Admin's first phase; mr-boss's `authz` elements add only `BOSS_ADMIN_ACCESS`, `BOSS_ADMIN_BACKUP` and `BOSS_ADMIN_ADMIN` (§1.1; impl-admin §4). |

## 19. Open

Installation-specific delegation bundles, provider credentials, organization memberships, mail-domain records, policy durations, backup destinations and enabled protocol ports are configuration inputs chosen through the guarded owner workflows above. The review's Open items on phasing, import strategy, agent screens, the invitation route, webhook scope, Tools screens for `ADMIN` and archive download are decided in §18 (review Z1, Z2, Z5).

1. **Per-group session lock and inactivity timeout** (review ADM-F02). *Recommendation:* add framework UserGroup flags beside `requireAuthcFactor`: an inactivity timeout and a re-authentication interval for members. The strictest of a user's groups applies. Edit them in SignInPolicy GroupSignInRules in A2, with `check#AdministrationPath` refusing a change that locks out every administrator. This is a framework need; until it exists, the `user-facade` session settings apply to everyone.
2. **Runtime-editable password policy** (review ADM-F04). *Recommendation:* keep `user-facade` `password` in conf for the first release. Later, a framework typed runtime setter over the same attributes, bounded below by the conf values so a runtime edit can only tighten them, audited and shown in EffectiveSignInPolicy. No database copy of conf.
3. **Saved export profiles** (review ADM-F06). *Recommendation:* later, after DataExport. A profile per export target stores fields and filters only, never grants. It is owned by its creator and shared through a group, and running it rechecks the caller's fields and rows.
4. **Connection and protocol checks on Monitor** (review R-ADM-L02). *Recommendation:* register the HTTP-shaped checks as Monitor synthetic checks, so they get schedules, history, traces and alerting with no Admin scheduler: gateway endpoints, identity-provider metadata URLs and remote `sendUrl`s. TCP, DNS and certificate-expiry checks stay `test#Protocol` until Monitor gains those check kinds; that is a framework ask for Remaining-Work (checks are HTTP only today).
5. **Privacy intake before PrivacyRequests ships.** *Recommendation:* the PASS Account privacy page ships with PrivacyRequests (later). Until then a data-subject request arrives as a Customer Service case of a privacy type, restricted to the privacy administrator. It is recorded as a PrivacyRequest, with the case as its source reference, when that screen ships.
6. **New-device sign-in window.** *Recommendation:* 90 days without a matching client in UserLoginHistory and Visit, as an instance setting. A shorter window is noisy for roaming users; a longer one keeps more history than login records need.
7. **What a wall display reads as** (CX-DEVICE). A display device acts for no person, but each dashboard it plays is read as someone. *Recommendation:* impl-admin P18's display account: a UserAccount with no password or sign-in of its own, a Person party with a member relationship to each organization it shows (so organization filters scope it), and groups its registrar may grant; the device's requests run as it, only within its route group. design-insights §4 Playlists already has a wall screen sign in as a user whose grants fit the room. P18 settles it against CX-DEVICE and writes the answer here, in §6 and in crosscut CX-DEVICE.
