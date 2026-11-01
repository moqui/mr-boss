# IronStone BOSS — Admin design

Oct 31, 2026 — design specification; checked against the current framework and application sources. This document specifies the final application boundary and shared contracts; it does not claim that the Admin application is implemented.

IronStone Admin serves system administrators and people delegated a particular administrative responsibility. It brings together users, groups and access; organizations and settings; integrations, mail and protocol configuration; jobs and operational health; imports, exports, audit and privacy. Business applications continue to own their policies and transactions. Admin makes their configuration, readiness and recovery discoverable without becoming another editor for the same records.

**Inputs.** [research-admin.md](research-admin.md); [initial-design.md](initial-design.md); [design-doc-guide.md](design-doc-guide.md); [style-guide.md](style-guide.md); [design-crosscut.md](design-crosscut.md); [design-drawers-commons.md](design-drawers-commons.md); [design-insights.md](design-insights.md); the Sales, Marketing, Customer Service, Commerce, Products, Purchasing, Warehouse, Manufacturing, Maintenance, Accounting, People and Projects designs; [ss-inventory.md](ss-inventory.md); [usl-inventory.md](usl-inventory.md); [application practices](../../../../docs/dev/Practices-App-Dev.md); and the current [monitoring guide](../../../../docs/tools/Monitoring.md), [mail](../../../../docs/interfaces/Mail-Inbound.md), [sync](../../../../docs/interfaces/Sync.md) and [Assist](../../../../docs/ai/Assist.md) guides.

**Sections.** [1 shell](#1-shell) · [2 screens](#2-screens) · [3 home](#3-home-and-health) · [4 users](#4-users-and-lifecycle) · [5 access](#5-groups-and-access) · [6 sign-in](#6-security-and-sign-in) · [7 settings](#7-organizations-and-settings) · [8 integrations](#8-integrations-and-system-messages) · [9 protocols](#9-mail-and-protocols) · [10 jobs](#10-notifications-and-jobs) · [11 data](#11-import-export-and-backups) · [12 audit](#12-audit-retention-and-privacy) · [13 agents](#13-agents-and-developer-tools) · [14 contracts](#14-shared-registration-contracts) · [15 outputs](#15-documents-and-outputs) · [16 needs](#16-framework-and-data-needs) · [17 acceptance](#17-coverage-and-acceptance) · [18 decided](#18-decided) · [19 open](#19-open)

## 1. Shell

### 1.1 Root, authority and presentation

Root `screen/Admin.xml`, route `Admin`, keeps icon `sym_o_admin_panel_settings`. `BOSS_ADMIN` is the existing artifact group, and `BOSS_ADMIN_ADMIN` is an existing setup user group. The root's comment saying its grants are commented out is stale: setup has framework ADMIN and app-admin authorizations with `MANTLE_ACTIVE_ORG` and `MANTLE_PRIVATE_CONTACT`. The root and Home placeholder are not the workflows specified here.

The root continues `mantle.party.PartyServices.setup#UserOrganizationInfo`. Internal organizations are multiple parties in one instance, not separate installations. Ordinary delegated groups take the existing user-organization and private-contact filters; the administrator setup group keeps its established filters. Every read and action independently checks its permission and target scope. An account belongs to one identity even when that identity works for several organizations. Authority to manage one organization's memberships does not authorize disabling that person's entire account, inspecting another organization's membership or granting instance-wide access.

Groups are assignment bundles. Services use `ec.user.hasPermission` and domain scope, never literal BOSS group checks, calling-screen names or a supplied `appRoot`. A write permission is not a view permission. Proposed groups below receive their listed permissions in setup data; an installation may assign the permissions through its own groups. A root grant only opens navigation. Framework privileged-group and sealed-permission enforcement remains in force even for an app administrator.

| Role | Proposed group | Permissions and boundary |
| --- | --- | --- |
| administrative reader (R) | BOSS_ADMIN_READ | `ADMIN_OVERVIEW_VIEW`; safe setup/health summaries and authorized owner links only |
| identity operator (U) | BOSS_ADMIN_IDENTITY | `ADMIN_IDENTITY_VIEW`, `ADMIN_IDENTITY_MANAGE`; permitted staff identity and organization-membership work; global disable/revoke additionally needs `ADMIN_IDENTITY_GLOBAL` |
| access administrator (A) | BOSS_ADMIN_ACCESS | `ADMIN_ACCESS_VIEW`, `ADMIN_ACCESS_MANAGE`; registered grant bundles within explicit delegation; no implicit right to grant sealed permissions or privileged membership |
| configuration administrator (C) | BOSS_ADMIN_CONFIGURE | `ADMIN_SETTINGS_VIEW`, `ADMIN_SETTINGS_MANAGE`; nonsecret instance presentation and permitted organization setup; domain settings still require their own permissions |
| integration administrator (I) | BOSS_ADMIN_INTEGRATIONS | `ADMIN_CONNECTION_VIEW`, `ADMIN_CONNECTION_MANAGE`; masked infrastructure configuration, credential replacement and organization availability; business gateway actions remain domain-owned |
| operations operator (O) | BOSS_ADMIN_OPERATIONS | `ADMIN_OPERATION_VIEW`, `ADMIN_OPERATION_MANAGE`; registered jobs, queues and safe recovery actions; Monitor permissions are granted separately |
| data operator (D) | BOSS_ADMIN_DATA | `ADMIN_TRANSFER_VIEW`, `ADMIN_TRANSFER_RUN`; transfer coordination, plus every target import/export domain permission |
| audit reader (V) | BOSS_ADMIN_AUDIT | `ADMIN_AUDIT_VIEW`; scoped, redacted changes and access evidence; no implicit business-record, replay or message-body access |
| privacy administrator (P) | BOSS_ADMIN_PRIVACY | `ADMIN_PRIVACY_VIEW`, `ADMIN_PRIVACY_MANAGE`, `ADMIN_RETENTION_MANAGE`; reviewed requests and hold/policy coordination; domain execution checks still apply |
| backup operator (B) | BOSS_ADMIN_BACKUP | `ADMIN_BACKUP_VIEW`, `ADMIN_BACKUP_RUN`; archive download additionally needs `ADMIN_BACKUP_DOWNLOAD`, an instance-wide disclosure permission |
| agent administrator | existing permission assignment | `AgentAdmin`; separate runtime, content and gateway checks of the existing framework remain intact |
| advanced tools operator | existing permission assignment | Existing Tools access and sealed permissions; no new BOSS substitute |

`ADMIN_LOGIN_AS`, `ADMIN_PASSWORD`, `SQL_RUNNER_WEB`, `GROOVY_SHELL_WEB`, `SSH_SHELL`, `SERVICE_LOAD_RUNNER`, `SearchRemote`, `DashboardRemote`, `REST_SCHEMA` and `LlmGatewayUse` are current sealed permission names. Admin never offers a grant it cannot legitimately assign. It also protects the last usable instance-administration path when changing login policy or membership; this is a proposed service guard, not a claim that existing generic entity CRUD provides it.

XML widgets are the default. Every designed screen renders in `qvt` and `tui`; lists have paging, saved filters, useful phone columns and names instead of unlabelled IDs. Detail screens use the shared record header, one primary action by state, a More menu and named confirmations. Destructive, bulk, credential and external-send actions show the target/count and consequences. Phones support triage, identity disablement with confirmation, invitation status and incident links; wide matrices have an equivalent filtered list. Secrets, private report bodies and sensitive HR details never enter shell context or a hidden client column.

### 1.2 Menu and shell contributions

- Home — `Home`.
  - Health and setup — `Operations/Health`.
- Users — `Users/Users`.
  - Invitations — `Users/Invitations`; sessions — `Users/Sessions`; lifecycle operations — `Users/LifecycleOperations`.
- Access — `Access/Groups`.
  - App capabilities — `Access/Capabilities`; access inspector — `Access/AccessInspector`; row rules — `Access/RowRules`.
- Security — `Security/SignInPolicy`.
  - Identity providers — `Security/IdentityProviders`.
- Settings — `Settings/Home`.
  - Organizations — `Settings/Organizations`; instance — `Settings/Instance`; localization — `Settings/Localization`; reference data — `Settings/ReferenceData`.
- Integrations — `Integrations/Connections`.
  - Webhooks — `Integrations/Webhooks`; message types — `Integrations/MessageTypes`; system messages — `Integrations/SystemMessages`.
- Mail and protocols — `Protocols/Home`.
  - Mail relays — `Protocols/MailRelays`; mail domains — `Protocols/MailDomains`; mail queue — `Protocols/MailQueue`; server configuration — `Protocols/ServerConfiguration`.
- Operations — `Operations/Jobs`.
  - Runs — `Operations/JobRuns`; monitoring — `Operations/Monitoring`; notification topics — `Notifications/Topics`.
- Data — `Data/Imports`.
  - Exports — `Data/Exports`; backups — `Data/Backups`.
- Audit and privacy — `Audit/Changes`.
  - Access evidence — `Audit/AccessLog`; retention — `Audit/Retention`; privacy requests — `Audit/PrivacyRequests`.
- Agents — `Agents/Home`.
- Developer tools — `Developer/Home`.

Record, wizard and reused routes below are contextual, not additional menu levels. The palette contributes authorized users, groups, connections and jobs, and actions Invite users and Open settings. Quick create contributes Invite users only. Today shows assigned lifecycle/privacy exceptions and actionable operational notices, with minimal metadata. Existing ReportAlert, Monitor and agent notifications retain their owners; proposed invitation/lifecycle/privacy topics use canonical operation IDs and no tokens. Opening or acting on a notification always rechecks authority. Commons owns the shell and approvals inbox.

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

All proposed API families and needs are identified in §16. References to existing capabilities do not assert that all new BOSS mounts or fine-grained guards already exist.

## 2. Screens

Paths are relative to the BOSS root. `N` means a proposed model or projection defined in §16; `parity` retains a baseline function, not an implementation claim. Roles are the permission bundles in §1.1. A framework destination named in a form's navigation is a link, not an invented Admin alias. Shared import has one definition at `Shared/DataImport.xml`.

| Screen | Path | Archetype | Impl | Purpose | Main record | Reused | Roles | Scope | Context |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home | Admin/Home | landing | xml | Show work and setup requiring attention | N readiness projection | own | scoped R | new | organization, authorized filters |
| Health | Admin/Operations/Health | list | xml | Explain setup and operational readiness | N readiness projection | own | R plus source rights | new | provider/filter/selection |
| Users | Admin/Users/Users | list | xml | Find staff and explicitly permitted account identities | UserAccount, Party | own | U | parity | filters, user selection |
| UserDetail | Admin/Users/UserDetail | detail | xml | Administer one account without duplicating its person | UserAccount | own shared owner | U,A by action | parity | userId, partyId; no credentials |
| Invitations | Admin/Users/Invitations | list | xml | Invite staff and follow acceptance | N UserInvitation | own | U,A for grants | new | invitation filters/selection |
| Sessions | Admin/Users/Sessions | list | xml | Inspect and revoke authorized sessions | HttpSession, UserLoginHistory | own | U; global action explicit | parity | userId, safe session identity |
| LifecycleOperations | Admin/Users/LifecycleOperations | list | xml | Follow provisioning and offboarding outcomes | N UserLifecycleOperation | own | U,O scoped | new | operation filters/selection |
| LifecycleDetail | Admin/Users/LifecycleDetail | task | xml | Review and complete account lifecycle steps | N UserLifecycleOperation | own | U plus step authority | new | lifecycleId |
| Groups | Admin/Access/Groups | list | xml | Find grant bundles and their use | UserGroup | own | A | parity | group filters |
| GroupDetail | Admin/Access/GroupDetail | detail | xml | Manage dated membership and supported grants | UserGroup | own | A | parity | userGroupId |
| Capabilities | Admin/Access/Capabilities | settings | xml | Compare groups, launcher gates and domain permissions | N capability registry | own | A | new | app, group, permission filters |
| AccessInspector | Admin/Access/AccessInspector | task | xml | Explain a permission decision without performing it | N access explanation | own | A, scoped V | new | target identity and operation; no record body |
| RowRules | Admin/Access/RowRules | settings | xml | Inspect supported organization and private-record restrictions | EntityFilterSet, ArtifactAuthzFilter | own | A | parity | rule set and authorized scope |
| SignInPolicy | Admin/Security/SignInPolicy | settings | xml | Explain sign-in requirements and edit supported group flags | UserGroup, effective conf | own | A,C | new | group/policy identity |
| IdentityProviders | Admin/Security/IdentityProviders | list | xml | Find configured OAuth/OIDC/SAML sign-in providers | AuthFlow | own | I,A | new | provider filters |
| IdentityProviderDetail | Admin/Security/IdentityProviderDetail | settings | xml | Configure a provider and guarded mappings | AuthFlow and subtype/maps | own | I,A | new | authFlowId |
| SettingsHome | Admin/Settings/Home | landing | xml | Find the sole editor for each setting | N settings registry | own shared index | scoped app | new | organization, area filters |
| Organizations | Admin/Settings/Organizations | tree list | xml | Find internal organizations and create authorized profiles | Party, Organization | own | C | parity | organization filters/selection |
| OrganizationDetail | Admin/Settings/OrganizationDetail | detail | xml | Maintain an internal organization's identity and links | Party, Organization | own with shared profile | C,U by action | parity | partyId, organization context |
| InstanceSettings | Admin/Settings/Instance | settings | xml | Maintain nonsecret instance presentation defaults | N InstancePreference, effective conf | own | C | new | settings scope |
| Localization | Admin/Settings/Localization | settings | xml | Maintain supported translations | LocalizedMessage, LocalizedEntityField | own | C | parity | locale, message/entity field |
| ReferenceData | Admin/Settings/ReferenceData | landing | xml | Route vocabulary and policy changes to their owners | N settings registry | own | scoped app | parity | kind/owner |
| Connections | Admin/Integrations/Connections | list | xml | Find infrastructure bindings and readiness | existing gateway/remote/provider records | own | I | parity | kind, organization, connection key |
| ConnectionDetail | Admin/Integrations/ConnectionDetail | settings | xml | Provision credentials and approved organization availability | native connection record | own shared owner | I | parity | provider kind/key, organization |
| Webhooks | Admin/Integrations/Webhooks | list | xml | Find registered outbound event subscriptions | N EventSubscription | own | I | new | event/provider/scope filters |
| WebhookDetail | Admin/Integrations/WebhookDetail | detail | xml | Configure event delivery and inspect safe outcomes | N EventSubscription, SystemMessage | own | I,O by action | new | subscriptionId |
| MessageTypes | Admin/Integrations/MessageTypes | list | xml | Inspect supported message contracts | SystemMessageType | own | I,O | parity | type filters |
| MessageTypeDetail | Admin/Integrations/MessageTypeDetail | settings | xml | Configure registered message handling | SystemMessageType | own | I; executable changes advanced | parity | systemMessageTypeId |
| SystemMessages | Admin/Integrations/SystemMessages | list | xml | Triage incoming and outgoing transport outcomes | SystemMessage | own | O scoped | parity | type/remote/status/correlation |
| SystemMessageDetail | Admin/Integrations/SystemMessageDetail | detail | xml | Inspect evidence and request owner-approved recovery | SystemMessage, SystemMessageError | own | O; payload separately checked | parity | systemMessageId, operation identity |
| ProtocolHome | Admin/Protocols/Home | landing | xml | Show configured protocol availability and owner links | effective configuration | own | I,O | new | protocol/provider |
| MailRelays | Admin/Protocols/MailRelays | list | xml | Find outgoing relay bindings | EmailServer | own | I | new | server/organization filters |
| MailRelayDetail | Admin/Protocols/MailRelayDetail | settings | xml | Configure and test an outgoing mail relay | EmailServer | own | I | new | emailServerId |
| MailDomains | Admin/Protocols/MailDomains | list | xml | Find verified sending and hosted-mail domains | N MailDomain | own | I | new | domain/organization filters |
| MailDomainDetail | Admin/Protocols/MailDomainDetail | settings | xml | Verify ownership and publish domain readiness | N MailDomain | own | I | new | mailDomainId |
| MailQueue | Admin/Protocols/MailQueue | list | xml | Triage transport submissions without opening private inboxes | EmailMessage, draft/send outcomes | own | O,I scoped | new | status, account binding, correlation |
| ServerConfiguration | Admin/Protocols/ServerConfiguration | settings | xml | Inspect effective protocol settings and run diagnostics | effective conf/capabilities | own | I,O | new | protocol, instance |
| Topics | Admin/Notifications/Topics | list | xml | Find registered notification topics | NotificationTopic | own | C,O | parity | topic filters |
| TopicDetail | Admin/Notifications/TopicDetail | settings | xml | Maintain allowed delivery defaults and subscriptions | NotificationTopic, NotificationTopicUser | own | C; subscription authority separate | parity | topic |
| Jobs | Admin/Operations/Jobs | list | xml | Find schedules, owners and unhealthy work | ServiceJob | own | O | parity | job filters |
| JobDetail | Admin/Operations/JobDetail | settings | xml | Configure a registered job and request safe execution | ServiceJob and parameters | own | O plus owner rights | parity | jobName |
| JobRuns | Admin/Operations/JobRuns | list | xml | Find completed and active execution outcomes | ServiceJobRun | own | O | parity | job/status/date filters |
| JobRunDetail | Admin/Operations/JobRunDetail | detail | xml | Inspect a run and its domain recovery links | ServiceJobRun | own | O | parity | jobRunId, traceId |
| Monitoring | Admin/Operations/Monitoring | landing | xml | Open existing observability, alerts and recovery tools | Monitor/report projections | own navigation | existing Monitor/report grants | parity | service/job/incident filters |
| Imports | Admin/Data/Imports | list | xml | Find authorized business imports and outcomes | N TransferBatch or owner batch | own | D plus target rights | new | target/batch/status filters |
| DataImport | Admin/Data/Import | wizard | xml | Stage, map, validate and apply a registered import | N TransferBatch or owner batch | Shared/DataImport, §11 | D plus target rights | new | targetId, batchId, narrowing context |
| ImportDetail | Admin/Data/ImportDetail | detail | xml | Review row outcomes and retry only eligible failures | N TransferBatch or owner batch | own shared results | D plus target rights | new | batchId |
| Exports | Admin/Data/Exports | list | xml | Find authorized exports and delivery status | report/export outcomes | own | D plus export rights | new | owner/provider/status filters |
| DataExport | Admin/Data/Export | wizard | xml | Export a governed report or registered business dataset | existing report definition or exporter | own composition | D plus export rights | new | definition/provider, authorized filters |
| Backups | Admin/Data/Backups | list | xml | Inspect database backup coverage and approved archives | backup provider and job outcomes | own | B | new | instance/provider/archive key |
| AuditChanges | Admin/Audit/Changes | list | xml | Inspect permitted field-change and administration evidence | EntityAuditLog, audit events | own | V | parity | actor/record/date filters |
| AccessLog | Admin/Audit/AccessLog | list | xml | Inspect sensitive access and output evidence | existing audit logs/spans | own | V plus source rights | new | actor/action/date/correlation |
| Retention | Admin/Audit/Retention | settings | xml | Explain policy, holds and eligible cleanup | N retention registration/holds | own | P | new | policy/provider/scope |
| PrivacyRequests | Admin/Audit/PrivacyRequests | list | xml | Track verified personal-data requests | N PrivacyRequest | own | P | new | request/type/status filters |
| PrivacyRequestDetail | Admin/Audit/PrivacyRequestDetail | task | xml | Review domain dispositions and execute authorized steps | N PrivacyRequest and outcomes | own | P plus domain rights | new | privacyRequestId |
| AgentAdministration | Admin/Agents/Home | landing | xml | Open the existing agent/model administration | agent/LLM safe summary | own navigation | AgentAdmin | parity | agent/provider identifiers |
| DeveloperTools | Admin/Developer/Home | landing | xml | Open authorized advanced framework tools | effective tool catalog | own navigation | existing tool permissions | parity | none |

## 3. Home and health

### Home

**Layout:** landing with Needs attention first, setup progress, safe operational number cards and Monitor / Manage / Configure shortcuts. Each count opens the same filtered authorized list; setup cards distinguish absent optional features from a failing required dependency.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Attention | list, read | Show assigned failures and review work | source, summary, severity, age, owner link | state chips; no raw payload | proposed `ironstone.admin.RegistryServices.get#Overview` | Frappe System Health Report; Zimbra Home |
| SetupChecks | list, read | Explain first-run readiness | check, ready/warning/failed/unavailable, checked time, fix link | grouped checklist | proposed `ironstone.admin.RegistryServices.get#Readiness` | Nextcloud setup checks; OpenProject Information |
| HealthCards | component | Show authorized operational counts | failed/late jobs, unresolved transports, backup coverage, login failures | dashboard/number-card | existing report queries and registered domain providers through Overview | Tools System/dashboard; crosscut §3.17 |

**Actions and states:** Open health is primary for established instances; first-run setup links retain each owner's permission. One provider's failure leaves the rest visible and names the failed provider without its sensitive diagnostics. No generic Fix all action. **Source:** research §§1, 18. **Needs:** ADM-OPERATIONS, ADM-SETTINGS, ADM-SHELL.

### Health

**Layout:** list grouped by identity, business setup, transport, storage/backup and observability, with organization and provider filters.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ReadinessFind | find | Narrow checks | organization, area, state, owner | permitted choices | — | OpenProject Information |
| Readiness | list, read | Show evidence and owner actions | check, result, checked time, freshness, explanation, owner/fix link | retry-check row action | proposed `ironstone.admin.RegistryServices.get#Readiness` | Frappe System Health Report; Products CatalogChecks; People SetupReadiness |

**Actions:** Refresh performs registered nonmutating checks; deliberate external tests belong to their owner forms and confirm their effect. A search outage, missing telemetry or unconfigured external backup is unknown/unavailable, not green. Domain checks include Accounting posting setup, Products catalog quality, Commerce publication readiness and People payroll setup without exposing underlying confidential values. **Source:** research §§1, 18 and domain readiness screens. **Needs:** ADM-OPERATIONS, ADM-SHELL.

## 4. Users and lifecycle

### 4.1 Identity contract

The canonical identity is UserAccount linked to Party. Admin handles staff account administration; Commons handles the user's own preferences, factors and credentials; People owns employment and confidential personnel information. Employee360 links here with `partyId`/`userId` and returns to its authorized host. The Contact record links the same account forms for an authorized identity operator. These links convey no authority and expose no HR details by default.

Internal invitations are proposed framework records, separate from existing PASS PublicSiteInvitation. They bind a verified destination, party, organization membership and approved grant proposal to a single-use hashed token with expiry. Sending, resending and revoking are audited; a resend invalidates the previous token. Acceptance requires proof of the invited address and an authenticated matching account or controlled account creation. Existing identities are matched explicitly; a similar name is never sufficient. Recheck inviter/delegation, target scope and current group grants at acceptance. Invitation metadata cannot assign ADMIN, sealed rights or a new organization through a public redemption request. Tokens never appear in lists, logs, shell context or exported error files.

Account-wide login/email changes, factor resets and credential revocation on an existing identity require identity-global authority as well as the action's own permission; a delegated organization operator manages that organization's relationship and approved grants only. The account's owner may still perform the separately guarded Commons self-service actions. This prevents one employer's administrator from taking over an identity shared with another organization.

People commits a hire before requesting account provisioning. Provisioning stores a durable operation identity and independent steps for account/invitation, organization membership, approved grants and notifications. The same operation cannot create a second identity or invitation on retry. Direct account creation remains available for explicitly authorized service accounts and exceptional administration; it is not the default hire path. No plaintext password is mailed. A request to create credentials uses the existing password/factor services and their policies.

Offboarding distinguishes ending access to one organization from globally disabling the identity. A preview names grants, credentials, sessions, owned reports/alerts/jobs/agent triggers, shared mail resources and outstanding assignments. Global disable immediately blocks authentication and revokes sessions, login keys, app passwords and SSH access through guarded services; organization removal ends that organization's relationships/grants without destroying unrelated access. Pending runs and deliveries recheck authority. Preserve audit/history and place owned schedules into a visible paused/unassigned state until a qualified new owner accepts them. Owners of reports/alerts use Insights INS-06/INS-07; Admin sees safe status only. Resource ownership transfer uses the domain's service, not generic Party reassignment. Disablement never authorizes deletion of personal contacts, messages, financial history or HR evidence; §12 applies.

### Users

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| UserFind | find | Find permitted accounts | name/email, organization, group, active/disabled/locked, invitation state | server search | — | Tools UserAccountList; Nextcloud users |
| UserList | list, read | Show identity and access summary | name, login, organizations in scope, account state, last login, invitations | useful mobile identity/state columns | proposed `org.moqui.admin.IdentityServices.find#Users` | Tools UserAccountList; Odoo Users |
| NewStaffAccount | dialog | Create an exceptional direct account | party, login, email, organization, approved bundle, reason | existing-party picker; explicit confirmation | extended `mantle.party.PartyServices.create#PartyUserAccount` under IdentityServices governance | Party/EditParty CreateUserAccount; Carbon employee users |

**Actions:** Invite users is primary; selecting an account opens UserDetail. Bulk disable opens a lifecycle preview and checks each identity independently. Public identities are visible only under explicit account authority and are labelled as site relationships, not internal app roles. **Source:** research §2. **Needs:** ADM-ACCESS, ADM-LIFECYCLE.

### UserDetail

**Layout:** account record header; Account, Access, Credentials, Sessions/history and Lifecycle tabs. The person/profile action opens the shared Contact record; Employee360 is offered only to its authorized audience.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Account | single | Maintain permitted identity fields | login, email, enabled state, locale/time zone, linked party | party link; state actions outside save | `mantle.party.PartyServices.update#PartyUserAccount`; proposed IdentityServices read/guard | Party/EditParty UpdateUserAccount; Tools UserAccountDetail |
| Memberships | list; dialog | Review or change dated grants | group, organization context, from/thru, grant source | permitted bundle picker; expiry | proposed `org.moqui.admin.AccessServices.store#Membership`, `end#Membership` | Party/EditParty AddGroupForm, GroupsForm; Tools UserAccountDetail |
| Authentication | list, read; dialog | Reset or revoke permitted factors | factor kind, verified state, created/used dates | masked metadata; explicit reset | existing `org.moqui.impl.UserServices.reset#Password`, `invalidate#UserAuthcFactorEntry`; proposed IdentityServices scoped reset guard | Tools UserAccountDetail factor/reset forms |
| AccessCredentials | list, read; dialog | Inspect and revoke credentials | credential kind, description, fingerprint, validity/last use | no secret recovery | existing UserServices `revoke#UserAccessToken`, `revoke#UserAppPassword`, `delete#UserSshKey` extended only where administrative targeting is needed | Commons Account and Projects GitAccess; Tools account detail |
| AccountHistory | list, read | Show relevant access events | event, actor, time, reason, safe link | bounded list; Monitor/Visit links | proposed IdentityServices account projection; existing history records | Tools UserAccountDetail login/history/tarpit sections |
| LifecycleActions | dialog | Preview disablement, organization removal or restoration | operation kind, scope, reason, effective date | consequences and per-step outcomes | proposed `org.moqui.admin.IdentityServices.preview#Lifecycle`, `start#Lifecycle` | Tools enable/disable; People onboarding/offboarding |

**Actions and states:** Ordinary administration sends a reset request; setting a password for someone else requires existing `ADMIN_PASSWORD`. Login as requires `ADMIN_LOGIN_AS`, confirmation, recorded initiating/target actors and a visible impersonation indicator; it never bypasses the target's scope. Existing `enable#UserAccount`/`disable#UserAccount` are used inside the proposed lifecycle coordinator. Tarpit release is a separately guarded action naming the lock. Creating another user's reusable credentials requires explicit credential authority and a secure one-time handoff; default UI directs the user to self-service creation. No factor secret or recovery code is listed. **Source:** research §§2–4; People §4. **Needs:** ADM-ACCESS, ADM-LIFECYCLE, ADM-AUDIT.

### Invitations

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| InvitationFind | find | Narrow invitations | organization, invited email/name, state, expiry | safe search | — | Carbon resend/revoke invite; Twenty members |
| InvitationList | list; row actions | Track staff acceptance | recipient, party, organization, bundle summary, expiry, pending/accepted/revoked/expired | resend/revoke confirmation | proposed `org.moqui.admin.IdentityServices.find#Invitations`, `resend#Invitation`, `revoke#Invitation` | Carbon invitations; OpenProject invited users |
| InviteStaff | dialog | Send one staff invitation | email, existing party, display name if new, organization, approved bundle, expiry, message | verified address; permission-limited bundles | proposed `org.moqui.admin.IdentityServices.invite#User` | Twenty invitation; Nextcloud new-user dialog |

Bulk invite opens DataImport with the staff-invitations target. Its fields are exactly email, optional existing-party match, display name, organization and approved bundle; expiry/message are batch options. Passwords, arbitrary permission IDs and privileged grants are rejected. Each row has an independent outcome and operation identity. **Source:** research §§2, 11. **Needs:** ADM-LIFECYCLE, ADM-IMPORT.

### Sessions

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| SessionFind | find | Narrow session activity | user, organization, active/recent, date | user lookup | — | Tools ActiveUsers; Odoo devices |
| SessionList | list, read; bulk | Inspect and revoke authorized sessions | user, started/last seen, client summary, session state | opaque UI identity; revoke confirmation | proposed `org.moqui.admin.IdentityServices.find#Sessions`, `revoke#Sessions` | Tools ActiveUsers; Frappe active sessions |

Session cookies, tokens and serialized session contents are never returned. Revocation includes active browser connections through the framework; a stale websocket or job does not retain revoked authority. **Source:** research §§2, 4. **Needs:** ADM-LIFECYCLE, ADM-AUDIT.

### LifecycleOperations

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| LifecycleFind | find | Narrow operations | account, organization, kind, state, date | scoped choices | — | Frappe background tasks; People checklists |
| LifecycleList | list, read | Show completed and blocked work | target, provisioning/offboarding, requester, progress, failures, next owner | detail link | proposed `org.moqui.admin.IdentityServices.find#LifecycleOperations` | Frappe background tasks; new lifecycle composition |

**Source:** research §§2, 10; People hire contract. **Needs:** ADM-LIFECYCLE.

### LifecycleDetail

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| LifecycleSummary | display | Explain the exact requested scope | target, kind, organization/global, requester, reason, revision, state | immutable request summary | proposed `org.moqui.admin.IdentityServices.get#Lifecycle` | People onboarding tasks; new orchestration |
| LifecycleSteps | list, read; row actions | Finish independent work | owner, step, target, outcome, retry/reassign link, reason | no payload; named confirmation | proposed `org.moqui.admin.IdentityServices.retry#LifecycleStep`; registered domain actions | Frappe task outcomes; existing job runs |
| TransferOwnership | dialog | Request an authorized replacement owner | step, new owner, reason | qualified-user lookup | registered owner service through lifecycle adapter | Insights schedule ownership; Commons shared resources |

The new lifecycle request's complete fields are target user/party, operation kind, scope organization or explicit global, effective date, reason, approved grant proposal, source reference/operation key and expected revision. Steps retain target identity, provider/action, state, attempt and reason, never duplicate domain records or secrets. Failed independent steps remain visible; access revocation does not roll back because an assignment transfer failed. Restoration does not reactivate old credentials or resume schedules automatically. **Source:** research §§2, 10, 13. **Needs:** ADM-LIFECYCLE, ADM-RETENTION.

## 5. Groups and access

### Groups

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| GroupFind | find | Find supported groups | name, app, permission, type | registered options | — | Tools UserGroupList |
| GroupList | list, read | Show grant bundles | name, description, members, app gates, privileged marker | detail link; no misleading “administrator” shortcut | proposed `org.moqui.admin.AccessServices.find#Groups` | Tools UserGroupList; OpenProject roles |
| CreateGroup | dialog | Create a custom nonprivileged group | identifier, description, registered purpose | unique identifier and purpose options | proposed `org.moqui.admin.AccessServices.create#Group` | Tools group form; Dolibarr groups |

**Source:** research §3. **Needs:** ADM-ACCESS.

### GroupDetail

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| GroupProfile | single | Maintain safe metadata/policy | description, purpose, factor required, allowed IPs | policy validation | proposed `org.moqui.admin.AccessServices.store#Group` | Tools UserGroupDetail |
| GroupMembers | list; dialog | Assign dated memberships | user, from/thru, scope, source | server-search users; bulk preview | AccessServices `store#Membership`, `end#Membership` | Tools GroupUsers |
| GroupCapabilities | list; dialog | Assign supported named permissions and app gates | app, permission/bundle, dates, scope dependencies | effective changes preview | proposed `org.moqui.admin.AccessServices.preview#Grants`, `apply#Grants` | Frappe Role Permission Manager; Tools group permissions/authz |
| GroupPreferences | list; dialog | Maintain registered group defaults | key, typed value, effective source | definition-driven input | proposed AccessServices `store#GroupPreference` | Tools UserGroupDetail preferences |

A grant change rechecks delegation and current revision, records before/after and invalidates the affected authorization caches. The actor cannot remove the final usable administration route or smuggle a sealed permission through a bundle. Direct user edits, imports and SSO role mappings use the same guards. **Source:** research §§3–4. **Needs:** ADM-ACCESS, ADM-AUDIT.

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
| AccessReasons | list, read | Explain evaluated and unresolved checks | permission/grant, validity, artifact result, row/domain restriction, final verdict | safe reason codes and source links | same explanation result | Frappe inspector; Moqui artifact authorization |

The inspector performs no target operation and returns no target record data. Use the actual framework evaluator plus a registered nonmutating domain explanation hook; where a dynamic business rule cannot be evaluated safely, label it “requires the record operation” rather than claiming allow. Inspecting another user's access requires target/delegation scope and is audited. **Source:** research §3. **Needs:** ADM-ACCESS, ADM-AUDIT.

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

Password/session/listener policies are not silently copied to database rows. Read-only conf values include the configuration key and operator instructions; editing requires an explicit runtime facility, listed as a future extension if absent. Validate an available administration path before restrictive changes. Factors remain managed on UserDetail or Commons self-service. **Source:** research §4. **Needs:** ADM-ACCESS, ADM-SETTINGS.

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
| IdentityMappings | list, editable rows | Map identity claims | remote claim, local allowed field, matching rule | no arbitrary expressions | same service over AuthFlowFieldMap | Frappe login field mapping |
| RoleMappings | list, editable rows | Map approved remote roles to staff grants | remote role, approved group, organization policy | delegated-group picker; privilege preview | AccessServices grant validation plus provider service | AuthFlowRoleMap; OpenProject SSO roles |
| ProviderCheck | display; dialog | Verify configuration without broad provisioning | metadata/connectivity result, callback, test identity, mapped grant preview | explicit test, no hidden account creation | proposed ConfigurationServices `test#IdentityProvider` | Carbon connection checks; Nextcloud LDAP wizard pattern |

Saving a provider cannot bypass privileged membership or assignment delegation. Linking an existing user requires controlled matching and verified identity, not trusting an arbitrary remote email claim. Test errors omit tokens and assertions. LDAP/directory provisioning is later; the existing OAuth/OIDC/SAML runtime is the first-release scope. **Source:** research §4. **Needs:** ADM-ACCESS, ADM-CONNECTIONS, ADM-AUDIT.

## 7. Organizations and settings

### SettingsHome

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| SettingsFind | find | Find a setting by purpose | text, organization, app, configure/read | authorized choices | — | Carbon settings hub |
| SettingsIndex | list, read | Open canonical owner forms | title, owner, scope, effective source, readiness, link | Company / Applications / Instance groups | proposed `ironstone.admin.RegistryServices.find#Settings` | Carbon Modules/System; Nextcloud registered sections |

**Context passed:** every app may link this index with a fixed app/organization filter. Registry visibility requires the destination's own view permission; enabling an app is granting supported access, not installing a module. A destination must be mounted or linked so the appropriate domain permission can open it without requiring another launcher grant. **Source:** research §§5–6, 16; crosscut §5. **Needs:** ADM-SETTINGS, ADM-SHELL.

### Organizations

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| OrganizationFind | find | Find internal organizations | name, identifier, parent, active | tree/list switch | — | Vendor/FindVendor FindVendor |
| OrganizationList | list, read | Show permitted organizations | name, parent, role, readiness | record link | scoped native Party/Organization query | Vendor/FindVendor VendorList |
| CreateOrganization | dialog | Create an internal organization profile | name, parent, tax identifier where relevant, locale, contact | parent lookup; no accounting side effect | `mantle.party.PartyServices.create#Organization`, `ensure#PartyRole`, extended scoped parent association | Vendor/FindVendor CreateVendor |

Creation does not initialize accounting, grant memberships, clone secrets or rewrite currency automatically. Those steps are separately authorized owner actions in setup readiness. **Source:** research §5. **Needs:** ADM-SETTINGS, ADM-ACCESS.

### OrganizationDetail

**Layout:** shared organization/Contact profile with Identity, Contacts, Members, Defaults and Setup links. Financial settings, balances and People structure are owner links, not implicitly visible tabs.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| OrganizationProfile | single | Maintain identity and approved roles | name, tax identifier, parent, logo, internal role | shared Contact widgets | `mantle.party.PartyServices.update#PartyDetail`; guarded `create#mantle.party.PartyRole` and relationship writers | Vendor/EditVendor EditVendor, RoleList; shared Contact |
| OrganizationContacts | single; dialog | Maintain registered addresses/contact points | purpose, postal/telecom/email details, validity | shared contact forms | `mantle.party.ContactServices.get#PartyContactInfo`, `store#PartyContactInfo` | Vendor/EditVendor PaymentInfo, BillingInfo; Party contact forms |
| OrganizationMembers | list; dialog | Maintain authorized staff relationships | user/party, role, from/thru, representative | user lookup; dated changes | proposed IdentityServices `store#OrganizationMembership`, using guarded `create#mantle.party.PartyRelationship`, `update#mantle.party.PartyRelationship` | Vendor/EditUsers AddUserRelationshipForm, UpdateUserRelForm; EditVendor SetVendorRepForm |
| OrganizationDefaults | list; dialog | Maintain registered organization defaults | setting type, typed value, current source, revision | definition-driven inputs; owner links for dated policies | `mantle.party.PartyServices.get#PartySettingValue`, `store#PartySetting`, `validate#PartySetting` | Party/EditParty AddSettingForm, AddSettingTextForm, SettingsForm; typed PartySettingType |
| SetupLinks | list, read | Reach accounting, workforce and operational setup | owner, readiness, action, scope | registry links | RegistryServices `get#Readiness` | Vendor/EditVendor initialize-accounting link; domain settings |

**Context passed:** the Contact profile receives canonical `partyId`, internal-organization context and permitted profile actions. Financial address forms remain contact purposes; payment instruments and actual bank values stay Accounting. The existing `mantle.ledger.LedgerServices.init#PartyAccountingConfiguration` is reached through Accounting's reviewed setup action, not triggered by an Admin save. Organization structure/employee assignments remain People-owned. **Source:** research §§5, 16–17. **Needs:** ADM-SETTINGS, ADM-ACCESS.

User-organization membership and the `RepVendor` representative are dated PartyRelationship records; they are not UserGroupMember rows. Current PartySetting is keyed by party and setting type and has no effective dates. This form edits registered current defaults with concurrency/audit checks; a setting with dated business meaning links its owner's effective-dated policy editor instead of pretending PartySetting already carries that history.

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
| MessageTranslations | list, editable rows | Maintain localized messages | original, locale, translation | multiline text | guarded native LocalizedMessage CRUD | Tools Messages forms |
| EntityTranslations | list, editable rows | Maintain supported entity labels | entity, field, key, locale, translation | registered label targets | guarded LocalizedEntityField CRUD | Tools EntityFields forms |

Translation access does not grant arbitrary access to sensitive entity values. Only registered translatable labels are offered; placeholders are validated before save. **Source:** research §5. **Needs:** ADM-SETTINGS, ADM-AUDIT.

### ReferenceData

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ReferenceOwners | list, read | Route reference changes correctly | kind, owner, scope, view/edit eligibility, link | categorized owner links | RegistryServices `find#Settings` | Dolibarr dictionaries; Tools StatusFlows |

Products owns noncurrency UOM editing with framework ADMIN writes; Accounting owns currencies, tax/posting and numbering policy; apps own their statuses/types/approval rules. Generic status-flow/Enumeration/DbForm/DbView editors remain Tools destinations where authorized. This screen does not allow changing a posted transaction's meaning by editing its status or unit. Custom fields and layout authoring remain later owner-defined capabilities, not a generic model editor promised here. **Source:** research §§5, 7. **Needs:** ADM-SETTINGS.

## 8. Integrations and system messages

### 8.1 Connection and recovery boundary

Admin owns infrastructure availability, credentials, transport trust and diagnostics. It uses native `PaymentGatewayConfig`, `ShippingGatewayConfig`, `TaxGatewayConfig`, `SystemMessageRemote`, EmailOAuthProvider and agent/provider records rather than copying their secrets into a universal Connection entity. A registry provides their common list/detail presentation and registered operations. New fields are added to the native owner only when necessary.

Admin provisions active `PaymentGatewayOrganization` rows and approved transport-to-organization availability. Accounting owns payment method selection, payment/tax business rules and finance operations; Warehouse owns carrier/method bindings; Commerce owns store options. Provider URLs and executable service bindings are configuration authority, not finance-form inputs. Reads return masked credentials, provider identity, allowed organization use and readiness; a credential replacement is write-only, audited and followed by an explicit test. Existing encrypted connection fields remain encrypted. Deployment keys remain configuration/environment; this is not a new credential-vault implementation.

SystemMessage/job retry is an owner action, not permission to repeat a business effect. A registered recovery descriptor names original operation identity, evidence, eligible states, required permission, reconciliation action and safe retry action. Payments, carrier labels, stock postings, promotional submissions and external channel imports retain their domain rules. Unknown external outcomes must be reconciled before resubmission. Transport attempts, business acceptance and settlement are separate states. Independent items continue after a named failure; a dependent posting remains atomic.

### Connections

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ConnectionFind | find | Find permitted infrastructure | kind, provider, organization, readiness | registry choices | — | SimpleScreens Gateway find screens; Carbon integrations |
| ConnectionList | list, read | Show native bindings | name, kind, organizations, endpoint summary, last check, status | masked data | proposed `org.moqui.admin.ConfigurationServices.find#Connections` | Gateway PaymentGatewaysForm, ShippingGatewaysForm; MessageRemoteList |
| NewConnection | dialog | Start a registered provider binding | kind, name, approved provider type, organization | registered adapters only | proposed ConfigurationServices `store#Connection` | Gateway NewPaymentGatewayForm, NewShippingGatewayForm |

**Source:** research §8; Accounting implemented gateway boundary. **Needs:** ADM-CONNECTIONS.

### ConnectionDetail

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| NativeConnection | single | Edit the native registered configuration | provider-specific endpoint, account, transport, enabled, credential replacement | adapter form; masked/write-only secrets | ConfigurationServices `get#Connection`, `store#Connection` invoking native guarded writers | EditPaymentGatewayForm; EditShippingGatewayForm; MessageRemoteDetail |
| OrganizationAvailability | list; dialog | Permit infrastructure use by an organization | organization, binding, effective dates, enabled | organization lookup; no arbitrary party grant | same guarded adapter; active PaymentGatewayOrganization | Accounting implemented-contract addendum; new binding UI |
| ConnectionChecks | list, read; dialog | Test infrastructure without business mutation | check, time, result, safe diagnostics, trace link | explicit external-test confirmation | proposed ConfigurationServices `test#Connection` | Carbon integration checks; EmailServices test |
| Consumers | list, read | Explain where this binding is used | owner, record, use, readiness, link | permission-aware references | registered consumer provider | Carbon sync activity; settings index |

The new availability form's full inputs are native connection kind/key, organization, from/thru, enabled flag, expected revision and reason. Changing credentials or availability does not silently alter a store or payment method. In-use removal is refused or ended prospectively; unresolved operations keep their original binding reference for reconciliation. **Source:** research §§8–9; crosscut §5. **Needs:** ADM-CONNECTIONS, ADM-AUDIT.

### Webhooks

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| WebhookFind | find | Find subscriptions | event, owner, organization, enabled, delivery state | registered event choices | — | OpenProject webhooks |
| WebhookList | list, read | Show outbound subscriptions | name, event, scope, destination summary, status, last outcome | detail link | proposed `org.moqui.admin.IntegrationServices.find#Subscriptions` | Frappe Webhook; Carbon webhooks |
| NewWebhook | dialog | Start a supported event subscription | name, event type, scope, approved remote | constrained selectors | proposed IntegrationServices `store#Subscription` | OpenProject outgoing webhook form |

Repository webhooks remain Projects-owned; agent push callbacks remain framework-owned. They may appear as read-only registered entries with owner links, not converted into new generic subscriptions. **Source:** research §8. **Needs:** ADM-CONNECTIONS.

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
| MessageTypeList | list, read | Find message contracts | name, content type, direction, registered handler, owner | owner/detail links | ConfigurationServices registered native projection | Tools MessageTypeList |

**Source:** research §§8–9. **Needs:** ADM-CONNECTIONS.

### MessageTypeDetail

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| MessageContract | single | Maintain allowed transport options | content type, paths/patterns, registered handler, retry settings | approved handler choices | ConfigurationServices `store#MessageType` proposed guard over native record | Tools MessageTypeDetail |
| MessageContractUse | list, read | Explain producers/consumers and recovery | owner, registered action, scope, idempotency contract | owner links | registry projection | Tools message type; new owner registration |

Ordinary integration administrators select deployed, registered handlers; they cannot type executable service names or disable authorization. Raw handler authoring stays advanced Tools/deployment work. `send#SystemMessage` and `consume#SystemMessage` are interfaces; actual execution uses `send#ProducedSystemMessage` and `consume#ReceivedSystemMessage`. **Source:** research §§8–9; active SystemMessageServices. **Needs:** ADM-CONNECTIONS, ADM-OPERATIONS.

### SystemMessages

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| MessageFind | find | Find failed or pending work | type, remote, direction, status, dates, operation reference | safe query; bounded range | — | Tools SystemMessageList |
| MessageList | list, read; bulk | Triage permitted transport outcomes | ID, type, remote, state, age, attempt, owner/correlation | eligible recovery preview | proposed `org.moqui.admin.OperationServices.find#Messages`, `preview#Recovery` | Tools SystemMessageList |

Bulk recovery has per-item eligibility/results; it does not call an unrestricted send-all/consume-all for selected business messages. **Source:** research §§8–10. **Needs:** ADM-OPERATIONS, ADM-AUDIT.

### SystemMessageDetail

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| MessageEvidence | display | Explain transport and business state | direction, type/remote, timestamps, error class, original operation, trace | masked diagnostics; owner links | proposed OperationServices `get#Message` | Tools SystemMessageDetail |
| MessageAttempts | list, read | Show attempt evidence | attempt, response class, timing, acknowledgement, correlation | no credentials | same result | SystemMessageError; Tools detail |
| MessageRecovery | dialog | Reconcile, retry or cancel an eligible operation | registered action, target, reason, expected revision | consequences confirmation | proposed OperationServices `execute#Recovery`; registered owner services | Tools reset/send/consume/cancel actions |

The recovery adapter retains `org.moqui.impl.SystemMessageServices.reset#SystemMessageInError`, `cancel#SystemMessage`, `send#ProducedSystemMessage`, `consume#ReceivedSystemMessage` where their native action is safe. It never resets a business operation key or rewrites a sent payload to conceal history. Payload viewing/downloading needs the source's data permission; safe transport metadata can be visible without it. Editing message text remains advanced troubleshooting with immutable original evidence, not a normal retry step. **Source:** research §§8–9. **Needs:** ADM-OPERATIONS, ADM-AUDIT.

## 9. Mail and protocols

### ProtocolHome

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ProtocolReadiness | list, read | Explain protocol availability | protocol, built/enabled, listener/readiness, source, check time, owner link | distinguish absent, disabled, failing | ConfigurationServices `get#EffectiveSettings`; RegistryServices readiness | Nextcloud Groupware/Talk; Zimbra service status |

Links cover mail relays/domains/queue, hosted SMTP trust, IMAP/POP and OAuth, DAV, SSH/SFTP/Git, chat, RTC/TURN/SIP, recordings/captions, and WOPI. Personal/shared mail accounts and templates link to Comms. This is a composition over built capabilities and explicitly proposed checks; an unbuilt feature is not advertised as operational. **Source:** research §§9, 16. **Needs:** ADM-PROTOCOLS, ADM-SETTINGS.

**Context passed:** phone administration opens the existing `System/Voice` owner in BasicComms, registered in the settings index, with `VoiceAdmin` checked by the existing Voice services. Its Status, Trunks, Numbers, CallerIds, Fraud, Emergency, Phones, RingGroups, Schedules, IvrMenus and Queues retain one definition. `VoiceTrunk.authJson` stays encrypted; listing/status services never return it. Admin does not copy those forms or infer that a provider is verified from a configured trunk. Comms keeps the caller's dialer, call handling and personal voicemail.

### MailRelays

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| RelayList | list, read | Find approved outgoing servers | name, host, transport, purpose/organization, readiness | masked metadata | ConfigurationServices `find#Connections` for EmailServer | Nextcloud email server; EmailServer baseline |
| NewRelay | dialog | Start an outgoing binding | name, SMTP host/port, TLS mode, permitted organization | registered secure choices | ConfigurationServices `store#Connection` EmailServer adapter | Odoo outgoing mail server |

**Source:** research §9. **Needs:** ADM-CONNECTIONS, ADM-PROTOCOLS.

### MailRelayDetail

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| RelayConfiguration | single | Configure server transport | SMTP host/port/TLS, auth type/user, write-only credential, allowed domains | secret replacement and current source | ConfigurationServices native EmailServer adapter | Nextcloud AdminMailServer; active EmailServer |
| RelayTest | dialog; display | Test connection or send a named test | test kind, authorized recipient, result, trace | distinguish connect test from send | existing `org.moqui.impl.EmailServices.test#EmailServer`; `send#Email` through approved test adapter | Nextcloud send test; current EmailServices |
| RelayConsumers | list, read | Show approved uses | sending profile/account, organization, readiness | Comms/owner links | registered consumer projection | Comms SendingProfiles |

Tests neither alter a business sending profile nor send real campaign content. Destination and sender restrictions still apply. OAuth uses existing EmailOAuthProvider/token mechanisms; password and refresh-token values never return to the browser. **Source:** research §9. **Needs:** ADM-CONNECTIONS, ADM-PROTOCOLS, ADM-AUDIT.

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
| DomainAddresses | list, read | Inspect hosted account and alias claims | address, account, active, owner link | permissions on account projection | existing EmailClientServices access/read plus domain registry | Comms MailAccounts; Zimbra aliases |

Proposed MailDomain fields are ID, normalized domain, owning organization, permitted sending/hosted purposes, proof hash/challenge state, verified-at, expected DNS policy, approved infrastructure references, disabled state and revision. A verification result records check kind, observed public value, state and time; private signing keys remain at the edge/provider. Verification means demonstrated control and readiness, not a guarantee of deliverability. It cannot make the SMTP listener an open relay or trust arbitrary Authentication-Results headers. Domain aliases and sender claims are unique/validated through the account adapter. Detailed DMARC/TLS aggregate-report ingestion is later; do not claim it from these checks. **Source:** research §§9, 18. **Needs:** ADM-PROTOCOLS, ADM-CONNECTIONS.

### MailQueue

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| MailQueueFind | find | Narrow transport outcomes | binding, direction, state, dates, owner reference | no arbitrary mailbox search | — | Zimbra mail queues |
| MailQueueList | list, read; row actions | Reconcile failures without exposing inboxes | message/operation ID, transport, time, safe recipient count, outcome, retry eligibility | owner/reconciliation links | proposed OperationServices mail adapter over existing draft/message results | Zimbra queue; Comms send outcome; EmailClientServices |

Personal message subjects/bodies/addresses are absent unless independently authorized. Known failure may retry through the owner; an uncertain SMTP/provider submission requires reconciliation and does not become a fresh send. Marketing owns delivery receipts, suppression and campaign re-entry; generic queue action cannot bypass them. **Source:** research §9; Marketing transport contract. **Needs:** ADM-OPERATIONS, ADM-PROTOCOLS.

### ServerConfiguration

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| EffectiveProtocolSettings | display | Explain effective deployment configuration | protocol, build availability, bind/public address, TLS/trust, limits, source, restart requirement | masked values and key names | ConfigurationServices `get#EffectiveSettings` | Zimbra server settings; Nextcloud Talk checks |
| ProtocolChecks | list, read; dialog | Run supported diagnostics | check, target, expected behavior, result, time | confirmation for external probe | proposed ConfigurationServices `test#Protocol` | Nextcloud WebServerSetupChecks; framework protocol guides |

SMTP uses existing `smtp_allowed_addresses` and `smtp_authserv_id`; TLS/listener ports are conf-owned. DAV and SFTP use current app-password and resource authorization; SSH host keys are shown by fingerprint, not disclosed. RTC/TURN/SIP, recording, captions and WOPI display actual configured providers and feature availability. A WebRTC test does not turn on recording; recording/retention/consent retain the protocol owner's enforcement. No arbitrary shell, filesystem path editor or automatic server restart is added. **Source:** research §9; current Mail-Inbound, Sync, WebRTC/TURN and SIP guides. **Needs:** ADM-PROTOCOLS, ADM-AUDIT.

## 10. Notifications and jobs

### Topics

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| TopicList | list, read | Find registered topics | title, owner, purpose, delivery defaults, actionable | owner/detail links | proposed OperationServices `find#Topics` | NotificationTopic; Frappe Notification |

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

Report schedules and agent triggers are linked owner records, not duplicated ServiceJobs. The runner jobs that dispatch them remain visible as infrastructure. **Source:** research §10. **Needs:** ADM-OPERATIONS.

### JobDetail

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| JobConfiguration | single | Maintain allowed scheduling controls | schedule, paused, priority, retry/lock settings, owner | next-run/time-zone preview | proposed OperationServices `store#Job` over ServiceJob | Tools ServiceJobForm |
| JobParameters | list, editable rows | Edit registered safe parameters | name, typed value, source, scope | definition-driven widgets; secret references | same service | Tools CreateJobParameter, UpdateJobParameter |
| JobNotifications | list; dialog | Maintain permitted operational recipients | user, receive notifications | no report-data sharing implied | same service over ServiceJobUser | Tools CreateJobUser, UpdateJobUser |
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
| RunItems | list, read | Show independent outcomes and next actions | item key, state, reason, owner detail, eligible recovery | no successful-item replay | registered domain result adapter | Frappe job logs; domain transfer/payroll outcomes |

A successful job wrapper with failed items is not displayed as an entirely successful business operation. Detailed payroll, campaign recipients and report bodies remain behind their source permissions. Monitor traces/logs retain Monitor grants; a job-page link does not grant them. **Source:** research §10. **Needs:** ADM-OPERATIONS, ADM-AUDIT.

### Monitoring

**Layout:** authorized owner links and registered summary panels, not a second incident or alert application.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| MonitoringDestinations | list, read | Open existing operational tools | overview, operations, traces, logs, errors, sources, checks, releases, incidents, recovery, alerts | current owner routes with narrowing filters | existing `org.moqui.monitor.MonitorServices.get#SourceStatus`, `list#Incidents`; existing report queries | Tools Monitor and Dashboards |

**Context passed:** Monitor receives only service, job, trace, incident or time-range filters already authorized. `MONITOR_APP`, `MONITOR_INCIDENT`, `MONITOR_RECOVER`, `MONITOR_RECOVER_ADMIN` and `MONITOR_REPLAY` remain independent. Existing report alert definitions/contact points/silences own alerting; checks own synthetic probes and scrape targets. Existing MonitorIncident/Regression/RecoveryPolicy/Action/Verification and emergency stop own operational incidents and recovery. Default recovery remains advisory; no recovery reverses committed business transactions. Agent traces and session replay stay under their specific guards.

Domain readiness may supply a registered metric/dataset to this existing machinery; it does not introduce ServiceJobMonitor records. Business value-bearing alerts follow Insights INS-07, evaluated in each recipient's authorized scope. Technical notifications may link a permitted redacted incident without its sensitive payload. **Source:** research §§1, 10, 12; current Monitoring guide. **Needs:** ADM-OPERATIONS; reuse INS-07.

### 10.1 Existing automation retained

| Automation/path | Verdict | Admin behavior |
| --- | --- | --- |
| Mantle `service/Party.secas.xml` `UserAccountCreatePerson`, post-service on `org.moqui.impl.UserServices.create#UserAccount` | kept with its current condition `userId && !partyId && !deferIdentityLink` | Calls `mantle.party.PartyServices.create#UserAccountPerson` only when needed. Staff provisioning with an existing Party passes its partyId and does not create a second person. Any deliberate deferred identity link completes within the authorized identity workflow. |
| Mantle `service/Party.secas.xml` `UserInitialAdminCreatePerson`, post-service on `org.moqui.impl.UserServices.create#InitialAdminAccount` | kept with its current condition `userId && !partyId` | Initial-admin bootstrap retains its native identity creation; ordinary staff invitation does not call this bootstrap service. Both account SECAs have `run-on-error="false"`. |
| Native UserServices/password/factor hooks and organization membership setup | kept; administrative guards added at their public service boundaries | Never direct-write password hashes or mint group membership through raw account imports. |
| SystemMessage send/consume jobs, native retries, acknowledgements and reset/cancel services | kept with domain eligibility before manual recovery | Correlate original operation; unknown external results require owner reconciliation. |
| EmailClientServices due drafts/account sync, rules and mail polling | kept | Queue operations call owners; no parallel mail sender or second subscription/consent policy. |
| `backup_EmbeddedDatabase_daily` → `org.moqui.impl.ServerServices.backup#EmbeddedDatabase` | kept | Run/status adapter preserves skip/failure/coverage and independent cluster outcomes. |
| `clean_TelemetryData_daily`, `rollup_TelemetryMetrics_hourly`, scrape/check jobs | kept | Configure only supported owner settings; display stale/missing telemetry honestly. |
| `detect_Regressions_5min`, `run_Recovery_minute` | kept | Existing Monitor evidence, permissions, leases and emergency stop remain authoritative. |
| `evaluate_ReportAlerts_minute`, report schedules and current ScreenScheduled leases | kept, extended by Insights INS-06/INS-07 | Internal business delivery uses recipient execution; offboarding pauses/transfers through owner services. |
| LLM usage/content-cleanup jobs and AgentTrigger processing | kept | Agent administration remains framework-owned; no copied trigger/approval engine. |
| Native domain SECAs/EECAs called by import writers | kept or conditioned only as the owning design specifies | Admin never disables audit, feeds or automation globally to make an import pass. |
| Retired `clean_ArtifactData_daily` and old ElasticSearch log cleanup jobs | remain paused as current framework upgrade behavior | Do not restore old ArtifactHit/ArtifactHitBin/log stores or invent their replacements. |

These are owner interactions, not a new global SECA. Proposed invitation/lifecycle/transfer dispatch uses registered ServiceJobs or existing queued execution, with one transaction per independent item and durable outcomes. No wildcard service/entity ECA is introduced for administrative convenience.

## 11. Import, export and backups

### 11.1 Shared transfer contract

Admin supplies a catalog, staging UI and consistent results envelope. Each registered target names its owning services, required view/import/export permissions, supported format/version, permitted fields, organization/record scope, matching/replay rules, nonmutating validation, apply action, error projection and canonical result route. A target can wrap an existing domain batch; it does not copy that batch's rows into a second ledger. New generic staging records are used only where no owner batch exists.

The sequence is Upload → select sheet/header/options → map → validate/preview → confirm → apply → results. File size/row limits and permitted types are target-specific and shown before upload. CSV and supported spreadsheets use existing parsers, including `org.moqui.impl.SpreadsheetServices.read#Spreadsheet`. Each domain write calls its real business service, preserving permission, effective-date, accounting, stock and automation rules. `load#SpreadsheetEntity` remains an advanced generic loader, not the business executor.

Validation is nonmutating. It reports unknown fields, ambiguous identities, missing references, scope violations, conflicts and anticipated side effects. A preview records file/mapping/target version and relevant source revisions; apply refuses a stale preview and reruns validation. Never run “test” by sending email or a payment and rolling back database rows. Independent rows commit separately; dependent document lines form an explicitly declared atomic unit. Source key plus target/organization and operation identity makes retry deterministic; identical retries return the prior result and changed content under that identity is refused. Historical imports do not generate new obligations, stock or messages unless the selected domain import mode explicitly authorizes them.

Secrets, password hashes, arbitrary groups, privileged authz, executable service names and raw policy expressions are not business-import columns. People protects payroll history, Accounting protects posted meaning, Products protects catalog revisions, Warehouse protects stock posting, and Commerce channel sync retains its SystemMessage intake. Error downloads are permission-checked and redact inaccessible/secret fields. Retention removes staged files only under the registered retention policy.

### Imports

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ImportFind | find | Find authorized runs | target, owner, organization, state, date | catalog options | — | Frappe Data Import |
| ImportList | list, read | Show transfer outcomes | target, file label, organization, state, rows accepted/failed/skipped, owner | detail/retry links | proposed `org.moqui.admin.DataTransferServices.find#Transfers` | Frappe import history; Products ProductImport |
| ImportTarget | dialog | Start an allowed import | registered target, organization, mode | target description and effects | RegistryServices target catalog | Odoo import-from-list; Dolibarr datasets |

**Source:** research §11; domain import designs. **Needs:** ADM-IMPORT.

### DataImport

**Context passed:** `Admin/Data/Import` and a domain's Import route mount one `Shared/DataImport.xml`, with targetId, appRoot, narrowing organization/record context and a registered return link. A mount cannot add columns or permissions the target does not allow. Existing specialized Commons/Projects/domain import screens may retain their owner interaction and register the same result/operation contract.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ImportUpload | wizard step | Stage permitted content | target, organization, mode, file, format, encoding/delimiter | file upload and size limit | proposed DataTransferServices `stage#Import` | Odoo Upload; Twenty sheet/header selection |
| ImportMapping | wizard step | Map columns and approved values | sheet, header, source column, target field, conversion/match option | sample rows and typed choices | proposed DataTransferServices `map#Import` | Twenty match columns; Frappe value mapping |
| ImportPreview | wizard step | Review validation and effects | valid/error/skipped counts, sample outcomes, conflicts, policy/side-effect summary | grouped row errors | proposed DataTransferServices `preview#Import`; registered validator | Odoo Test; Products ProductImport |
| ImportApply | wizard step | Confirm the validated scope | target, organization, row/unit count, preview revision, reason | named confirmation | proposed DataTransferServices `apply#Import`; registered owner writer | Frappe import; Dolibarr simulate/import |

Full new common inputs are targetId, organization/context, file resource, parser options, sheet/header, field/value mapping, registered import mode, source namespace, expected preview revision and confirmation reason. Domain fields come exclusively from the target schema; no arbitrary entity name is accepted. **States:** partial success is a first-class result; cancel stops unclaimed units and leaves committed units visible. **Source:** research §11. **Needs:** ADM-IMPORT, ADM-ACCESS.

### ImportDetail

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ImportSummary | display | Explain the exact applied run | target/version, file/map hash, organization, mode, counts, actor, period | source provenance | proposed DataTransferServices `get#Transfer` | Frappe Data Import; Products staged results |
| ImportResults | list, read; row actions | Reconcile row/document outcomes | source key, target link, accepted/failed/skipped/uncertain, reason, attempt | error export; eligible retry selection | proposed DataTransferServices `retry#ImportItems`; owner adapter | Frappe import log/skipped rows |

Correction creates a new validated revision linked to the original unit; successful rows are never blindly replayed. A receipt/charge/message with uncertain outcome routes to its owner instead of reimporting it. **Source:** research §11. **Needs:** ADM-IMPORT, ADM-AUDIT.

### Exports

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ExportFind | find | Find permitted export outcomes | provider, owner, organization, status, date | safe metadata filters | — | Frappe Access Log; Dolibarr exports |
| ExportList | list, read | Show export and delivery status | definition/target, owner, created, state, expiry, authorized download | payload separate from status | proposed DataTransferServices `find#Transfers`; existing report outcome services extended by INS-06 | Frappe export history; Insights delivery history |

Administrative status visibility is not permission to download the output. Recipient-specific report artifacts are visible only to the authorized recipient under Insights' current-access checks. **Source:** research §§11–12. **Needs:** ADM-EXPORT, ADM-AUDIT; INS-06.

### DataExport

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ExportSelection | wizard step | Select a governed source | registered target/definition, organization, dates, filters | registered report/dataset choices | report registry; proposed DataTransferServices `preview#Export` for domain exporters | Dolibarr export wizard; Odoo fields export |
| ExportFields | wizard step | Select permitted output | authorized columns, format, labels, profile | permission-filtered fields | existing report/export engine or registered domain schema | Odoo export field picker |
| ExportReview | wizard step | Confirm scope and obtain output | source/version, filters, counts if permitted, classification, format | preview under caller only | proposed DataTransferServices `run#Export` dispatching owner | Dolibarr review; Insights Export |

General reports use the existing framework report/export engine and Insights INS-03/INS-11. Domain formats such as vCard, work-item CSV and payroll exchange call their owner's exporter. No free SQL, arbitrary entity export or owner-data-to-recipient forwarding. Scheduled business delivery opens Insights and uses internal recipient execution; a saved profile grants no additional fields/rows. CSV spreadsheet-formula escaping and file naming are shared output policy. **Source:** research §11; Insights output contract. **Needs:** ADM-EXPORT; INS-06, INS-11.

### Backups

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| BackupCoverage | list, read | Explain what is protected | database/provider, last success, retained archives, verification evidence, missing files/config coverage | unknown/partial/success distinctions | proposed `org.moqui.admin.BackupServices.get#Coverage` | OpenProject backups; current embedded backup job |
| BackupArchives | list, read | Browse approved archive metadata | archive key, kind, database, created, size, checksum/verification, expiry | no arbitrary path input | proposed BackupServices `find#Archives`, `download#Archive` | Frappe backups; OpenProject token-guarded download |
| BackupNow | dialog | Request an authorized backup | provider, approved mode, scope, reason | explicit instance-wide confirmation | proposed BackupServices `run#Backup`; existing `org.moqui.impl.ServerServices.backup#EmbeddedDatabase` | current backup service; OpenProject request backup |

Archive retrieval requires fresh authentication, `ADMIN_BACKUP_DOWNLOAD`, audited access and a server-resolved archive key restricted to approved storage. Never expose an arbitrary resource path or public bearer URL. An external PostgreSQL installation gets its registered operator/provider status; the embedded service's skipped result is not success. Database-only backup does not imply resource files, deployment secrets or external stores are covered. Display the scope and restore-verification evidence honestly. Restore and raw DataSnapshot import remain separately privileged maintenance operations outside this first-release Admin UI; no in-place restore button beside ordinary downloads. **Source:** research §11. **Needs:** ADM-OPERATIONS, ADM-AUDIT; backup adapter in ADM-EXPORT.

## 12. Audit, retention and privacy

### AuditChanges

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| AuditFind | find | Find permitted change evidence | actor, date, entity/record, action, organization | safe target search | — | Tools AuditLog |
| AuditList | list, read | Show protected before/after evidence | actor, target, field/action, time, reason, correlation | mask classified values; authorized owner link | proposed `org.moqui.admin.AuditServices.find#Changes` over EntityAuditLog and owner audit sources | Tools AuditLog; Carbon audit details |

The audit reader sees only registered safe projections. Secrets are never logged as before/after values, and payroll, private contacts or message bodies are not disclosed just because their entity was changed. Existing audit records remain authoritative; administrative events fill missing action/reason evidence without copying all business changes to a new universal history table. **Source:** research §12. **Needs:** ADM-AUDIT.

### AccessLog

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| AccessFind | find | Narrow sensitive-access evidence | actor, action, source, date, correlation | no query-content search by default | — | Frappe Access Log |
| AccessEvidence | list, read | Show who requested or received an output | actor, purpose, source, permission result, safe filter summary, format, result, time | Monitor/source links | proposed AuditServices `find#AccessEvidence`; existing report/monitor/agent audit targets | Frappe Access Log; current moqui.report.audit |

Use current `moqui.report.audit`, `moqui.monitor.audit`, agent audit and telemetry records. Add only missing administrative events with common correlation metadata. Visit/Visitor remain; requests are spans. Raw log/trace/replay access requires its existing permissions, and replay is not a report dataset. An export history row contains safe metadata, not another copy of its report. **Source:** research §12; current Monitoring guide. **Needs:** ADM-AUDIT; INS-11.

### Retention

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| RetentionPolicies | list, read; dialog | Explain and maintain supported policy | category, organization/instance, keep period, source, cleanup owner, holds | typed values; impact preview | proposed `org.moqui.admin.PrivacyServices.get#Retention`, `preview#Retention`, `store#Retention` | Frappe Log Settings; domain retention policies |
| RetentionHolds | list; dialog | Protect identified records/scope | hold reason, scope/target, authority, starts/ends, owner | scoped lookup; audited release | proposed PrivacyServices `place#Hold`, `release#Hold` | People purpose-specific retention; new coordination |
| CleanupEvidence | list, read | Review eligible and completed cleanup | provider, run, eligible/protected/skipped/error counts, time | job/owner links | registered cleanup result provider | seeded cleanup jobs; Dolibarr retention |

The new hold form's full fields are category/provider, organization or explicit instance scope, registered target selector/record identities, reason, authority reference, starts/ends, expected revision and release reason. Holds are metadata enforced by every registered cleanup/export-erasure path, not merely a banner on Admin. A provider that cannot enforce them is shown unsupported and cannot be advertised as safely erasable. Existing telemetry retention remains conf-owned and uses `clean#TelemetryData`; job/LLM/resource retention uses its existing owner mechanism. Policies do not erase accounting history or remove the evidence of a privacy decision. No jurisdictional retention duration is hard-coded in the suite. **Source:** research §§12–13; People and Commons lifecycle reconciliation. **Needs:** ADM-RETENTION, ADM-AUDIT.

### PrivacyRequests

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| PrivacyFind | find | Find authorized requests | subject, organization, kind, state, assigned owner | scoped subject lookup | — | Odoo privacy lookup; Frappe personal-data requests |
| PrivacyList | list, read | Track reviewed requests | subject, verified request kind, received/due, state, assigned owner | case/detail link | proposed PrivacyServices `find#Requests` | Frappe request list |
| NewPrivacyRequest | dialog | Record a request with verification | subject party, request kind, organization scope, verification evidence, received/due, assignee, reason | private evidence attachment | proposed PrivacyServices `create#Request` | Odoo privacy wizard; People private case intake |

Requests are access/export, correction or erasure review. An email string alone cannot authorize a data disclosure. The common form's full fields are those listed plus source reference and expected revision on edit; evidence uses a protected canonical request host. **Source:** research §13. **Needs:** ADM-RETENTION, ADM-ACCESS.

Register the proposed framework `moqui.admin.PrivacyRequest` host and `moqui.admin.PrivacyRequestContent` association with BOSS shared RecordFiles. The association binds request ID, content sequence/ID, purpose, resource reference, original filename/type, created-by/time and current state; storage uses the existing framework resource/content facilities. PrivacyServices owns upload, read/download, export and retirement independently of the BOSS presentation, checking `ADMIN_PRIVACY_VIEW`/`ADMIN_PRIVACY_MANAGE` as appropriate and the request's organization/participant scope, including direct resource requests. Evidence is never attached to a generally readable Party or ordinary Chatter host. Request holds and retention govern the association and stored resource; no unregistered generic attachment path or framework dependency on Mantle/BOSS is introduced.

### PrivacyRequestDetail

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| PrivacySummary | display | Explain verified request and scope | subject, kind, verification, organization, state, assignee, due | protected record header | proposed PrivacyServices `get#Request` | Frappe personal-data request |
| PrivacyInventory | list, read | Review owner-provided disposition | provider/category, safe record count, hold, proposed retain/correct/redact/erase/export, reason | no unguarded record bodies | proposed PrivacyServices `preview#Request`; registered domain providers | Odoo privacy lookup |
| PrivacyDecision | dialog | Approve a bounded disposition | selected provider units, action, reason, expected preview revision | consequence confirmation | proposed PrivacyServices `approve#Request`, `execute#Request` | Odoo privacy action; domain approval practices |
| PrivacyResults | list, read | Track independent execution evidence | unit, decision, outcome, target link, attempt, exception | authorized retry/owner link | same owner-coordinated execution | Frappe partial outcomes; domain transfers |

This is a reviewed workflow, not a cascade delete of every Party relationship. Domain providers enforce holds, document history, private content, publication status and accounting/payroll retention. Export is delivered only to the verified entitled subject through an authenticated protected channel; an administrator's preview contains metadata unless separately entitled to the data. Correction routes to the owning record; completed financial facts require owner correction/reversal, not rewriting. Independent provider failures continue and remain unresolved until reviewed. The request's decision/audit trail persists under its own retention policy. **Source:** research §13. **Needs:** ADM-RETENTION, ADM-AUDIT, ADM-EXPORT.

## 13. Agents and developer tools

### AgentAdministration

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| AgentAdminLinks | list, read | Open existing administrative owners | models/endpoints, bindings, usage/calls, skills/lessons, tools/policies, runs, approvals, triggers, remote MCP/A2A, gateway | existing canonical destinations | existing `org.moqui.agent.AgentAdminServices.get#EffectiveConfig`, `get#DashboardTotals` | Tools System/Llm |

**Context passed:** links preserve permitted agent/model/run IDs only; the framework `System/Llm` root and its service checks retain `AgentAdmin` and other permissions. Admin does not define new LlmConversation, LlmCallLog or A2ATask records. The current AgentToolPolicy/Exposure/Approval model governs tool classifications, approvals and exposure on top of domain artifact/service authorization. Changing a tool exposure keeps its version check and pending-approval invalidation. Model/provider tests are explicit operations that may make a provider call. Agent administration is not permission to read every conversation, report attachment or private business record. Insights consumes approved usage/cost datasets, not raw prompts by default. **Source:** research §15 superseded by current Agent/Llm sources. **Needs:** ADM-SETTINGS, ADM-AUDIT; existing framework reuse.

### DeveloperTools

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ToolLinks | list, read | Open authorized advanced tools | tool, purpose, permission, environment, link | omit unauthorized actions | registered canonical tool routes; existing guards | Tools/System dashboards |

Destinations include raw entity import/export/snapshots, data edit/views/documents, status flows, SQL/script/service runners, cache, resource/print configuration and host instance tools. They retain their actual framework permission checks and environment restrictions. Admin does not add a raw shell, arbitrary service-run field, generic code automation designer or browser database restore. Public sites expose none of these through Admin links. Self-hosted instance management is an operations concern; a multi-tenant hosting control plane remains outside BOSS. **Source:** research §§7, 11, 14–15. **Needs:** ADM-ACCESS, ADM-SHELL.

## 14. Shared registration contracts

Registrations are trusted component definitions, validated at load. They are not arbitrary service names entered by an administrator. Missing optional providers are omitted with a safe diagnostic; one malformed provider does not remove independent registrations. Existing shell-provider and framework report/monitor registries are extended or referenced rather than replaced.

| Contract | Minimum information | Execution and ownership |
| --- | --- | --- |
| Settings entry | stable key/version, title/description, owner app, instance/organization/store/facility/user scope, canonical editor, view/configure permissions, narrowing parameters, effective-source/readiness provider | BOSS index composes owner entries. Owner resolves scope and executes writes; route context grants nothing. |
| Capability description | app/domain, named permission, launcher artifact gate where relevant, display grouping, view/edit/export distinction, supported scope dependencies, delegated assignment policy | Existing Moqui permissions/artifact rules remain authoritative; grants are dated native rows. |
| Readiness provider | stable check key/version, owner, required capability, permitted scope, nonmutating read, state/checked-at/freshness/reason and authorized fix link | Source owner calculates; Admin aggregates, Insights may trend permitted values. No generic repair service. |
| Connection adapter | native kind/key, projection, credential classification, permissible mutable fields, organization-binding rules, explicit test, consumer/readiness provider | Framework or Mantle native services enforce writes. Admin supplies the sole credential/infrastructure UI. |
| Lifecycle participant | domain, affected ownership/resource lookup, supported revoke/pause/transfer action, eligibility, operation identity and safe results | Identity coordinator invokes owner actions after source employment commit. Each independent step has a durable outcome. |
| Operational recovery | source kind/key, business operation identity, observed state/revision, evidence, permitted reconciliation/retry/cancel actions, required authority, owner route | Admin dispatches only eligible owner actions. Monitor incident recovery remains the existing separate operational engine. |
| Import/export target | target/version, formats, allowed fields, source/replay key rules, scope and permissions, parser/validator/preview/apply or export, atomic-unit rule, safe result schema, retention owner | Shared DataImport and Admin export composition call domain writers/exporters; existing batches remain owners. |
| Retention/privacy provider | category/version, canonical host, classification, policy source, hold support, authorized search/preview, permitted dispositions, executor and audit/result route | Domain owner decides what can be retained/changed/deleted; coordination cannot bypass domain protection. |

Safe result envelopes carry provider/key, canonical source identity, state, reasonCode, user-safe message, revision, checked/completed time, authorized link and counts only when permitted. Never include credentials, arbitrary code, hidden HR columns or another recipient's report body. Service implementations declare out-parameters. All operations revalidate current permission and scope, and mutating ones use expected revision plus stable operation identity where retries can repeat effects.

### 14.1 Suite ownership matrix

| Concern | Owner and Admin use |
| --- | --- |
| Accounts and grants | Admin account lifecycle; framework security enforces; Commons self-service and People employment link the same identity. |
| Internal organization profile | Admin/shared Contact; People structure and Accounting accounting configuration remain owner sections. |
| Catalog/pricing/units | Products; Admin settings index only. Noncurrency global UOM writes remain framework ADMIN. |
| Stock/carrier/facility policy | Warehouse; Admin infrastructure credentials and readiness only. |
| Production and resource policies | Manufacturing and Maintenance; shared availability/process contracts remain their owners. |
| Buying, sales and service policy | Purchasing, Sales and Customer Service; Admin points to their approved settings/recovery actions. |
| Payment/tax/gateway use | Accounting business policy and instruments; Admin credentials and approved gateway-to-organization infrastructure availability. |
| Stores, promotions and public presentation | Commerce; PASS is independent, with its own public accounts/sites and published grants. Admin does not turn a staff record public. |
| Communications and participation | Comms accounts/templates/sending profiles/suppressions; Marketing campaigns/consent/events; Admin domains/relay/transport trust. |
| Reporting and delivery | Insights domain catalog on framework reports; internal recipient execution and safe outcomes. Admin lifecycle/pause/ownership, not report bodies. |
| Operational telemetry and agents | Framework Monitor and System/Llm; Admin links/composes existing owners and retains their permissions. |
| Files, collaboration and approvals | Commons/shared canonical hosts and owner decisions; Admin never attaches private credentials to general Chatter. |

## 15. Documents and outputs

| Output | Kind | From screen | Derived from |
| --- | --- | --- | --- |
| Staff invitation and acceptance notice | email | Invitations/UserDetail | existing EmailTemplate transport; new staff invitation purpose, single-use token never in logs |
| Lifecycle completion/exception notice | notification/email | LifecycleDetail | registered minimal topic; safe target/operation links |
| Access/grant review | html-print, CSV | GroupDetail/Capabilities | same authorized grant projection and effective dates; sealed/secret values excluded |
| Readiness/support summary | html-print, redacted JSON | Health/ServerConfiguration | provider results, effective nonsecret configuration and version/freshness; no environment dump |
| Import template, preview/error rows and result manifest | CSV/XLSX where available | DataImport/ImportDetail | registered target schema and protected source keys; row identities and safe reasons |
| Business export | CSV/XLSX/PDF or domain format | DataExport | current framework reporting/owner exporter; same caller authority and authorized fields |
| Internal scheduled report/digest and alert | email/notification with protected artifact | Insights owner screen linked from Exports/Jobs | INS-06/INS-07; recipient evaluates their own authorized result; Admin sees delivery status only |
| Backup archive | protected download | Backups | existing backup provider archive, explicit instance-wide download permission and audit |
| Privacy inventory/decision evidence | html-print/protected export | PrivacyRequestDetail | safe coordination projection; actual subject data via verified owner export |
| Audit evidence | CSV/html-print | AuditChanges/AccessLog | authorized redacted records with correlation/source/freshness |

Prints use `html-print`; PDFs use the existing renderer. File generation does not weaken row/field restrictions. Downloads recheck current authorization, are scoped to authenticated users and expire with their retention policy. Recipients never receive an owner's broader report because their address was added to a schedule. General external report distribution, public dashboard sharing and business-data webhook reports remain outside this first-release design.

## 16. Framework and data needs

### 16.1 Needs register

These IDs are the crosscut roll-up keys. **Existing** identifies reusable facilities; **proposed** identifies the work still needed. Implementations extend the lowest owning layer, keeping Mantle independent of BOSS.

| ID / need | Kind | Existing foundation and proposed addition | Screens | Boundary |
| --- | --- | --- | --- | --- |
| ADM-ACCESS — delegated administrative access | service type, seed data | Existing permissions/artifacts/filters; proposed administrative permission bundles, bounded delegation, grant preview/apply, last-admin protection, access explanation and administrative target checks | Users, Access, Security, all shared mounts | No BOSS group checks or second authorization evaluator; guards apply to direct services/imports/SSO too. |
| ADM-LIFECYCLE — staff identity lifecycle | data model, service type, seed data | Existing accounts/factors/keys/sessions and Party services; proposed staff invitation and lifecycle operation/step records, revocation, provisioning and owner-transfer coordination | Users, Invitations, Sessions, LifecycleDetail | PASS invitations stay distinct; People commits hire first; revoke access without deleting data. |
| ADM-SETTINGS — owner settings and typed defaults | seed data, service type, data model | Existing PartySettingType/PartySetting, themes/localization and conf; proposed BOSS settings index, safe effective-config projection and typed nonsecret InstancePreference where no owner store applies | Settings, Health, AgentAdministration | One editor per configuration record; no secret/configuration blob or copied domain defaults. |
| ADM-CONNECTIONS — native connection administration | service type, seed data, data model | Existing remotes/gateways/EmailServer/OAuth and PaymentGatewayOrganization; proposed adapter guards/consumer readiness and registered EventSubscription using SystemMessage | Connections, Webhooks, IdentityProviders, MessageTypes | Native records retain credentials; domains select approved use; no second queue or executable admin input. |
| ADM-PROTOCOLS — protocol and domain readiness | service type, data model, seed data | Existing SMTP trust, mail client, DAV/SSH/RTC/TURN/SIP/WOPI facilities; proposed effective-state checks, MailDomain verification and approved-domain/account claim binding | Protocols | Conf remains deployment truth; DNS verification does not bypass edge trust or promise delivery. |
| ADM-OPERATIONS — safe operational composition | service type, seed data | Existing ServiceJob/SystemMessage/mail outcomes and Monitor/report incident/alert/recovery engines; proposed scoped projections and domain recovery/health adapters | Home, Health, queues, Jobs, Monitoring | Preserve operation identity and uncertain-result reconciliation; never generic retry-all over business effects. |
| ADM-IMPORT — business transfer staging | data model, service type, XML Screen element | Existing parsers and domain imports; proposed target registry, Shared/DataImport and TransferBatch/TransferItem only for targets without an owner batch | Imports, DataImport, ImportDetail, bulk invite | Validate without effects; recheck preview; independent units continue; native domain writers enforce invariants. |
| ADM-EXPORT — export/backup adapters | service type, seed data | Existing framework report outputs, domain exporters and embedded backups; proposed safe transfer status, registered domain export dispatch, archive/coverage adapters | Exports, DataExport, Backups, privacy export | No arbitrary entity/path export; INS-06 owns recipient delivery; backup permission is instance-wide. |
| ADM-RETENTION — reviewed privacy coordination | data model, service type, seed data | Existing cleanup mechanisms and domain retention; proposed hold registration/enforcement, PrivacyRequest/result records and coordinated previews/decisions | Retention, PrivacyRequests, lifecycle | Domain owners enforce history/holds; disabled users are not automatically purged; unsupported erasure stays unsupported. |
| ADM-AUDIT — administrative evidence | service type, data model | Existing EntityAuditLog, report/monitor/agent audit and telemetry; proposed missing administrative action/reason/correlation evidence and scoped projections | access/credential changes, transfers, backups, privacy | No duplicate business history or retired hit store; redact before logging and before output. |
| ADM-SHELL — administrative shell/context | shell item, service type, seed data | Existing shell-provider/context/dashboard widgets; proposed Admin palette/Today/quick-create/topic/readiness registrations | all | Safe identifiers and authorized summaries only; provider failures isolated. |

### 16.2 Proposed service families and minimum records

The first fully qualified names below establish the namespace for shortened names in form tables. These are **proposed** interfaces, not existing service claims. A new method is justified by validation, composition, scope or lifecycle behavior; do not add BOSS pass-through wrappers around existing Mantle/framework methods.

| Layer and family | Contract |
| --- | --- |
| BOSS `ironstone.admin.ContextServices` | Resolve app/shared context, authorized options and canonical owner links; no business/security-policy implementation. |
| BOSS `ironstone.admin.RegistryServices` | `get#Overview`, `get#Readiness`, `find#Settings`, and registered target/owner catalogs; aggregate authorized source results with isolated failures. |
| Framework `org.moqui.admin.IdentityServices` | Account/session projections; guarded staff invitations and lifecycle preview/start/read/retry; scoped organization-membership coordination calls Mantle's registered participant. Generic framework services do not depend on BOSS or Mantle. |
| Framework `org.moqui.admin.AccessServices` | Native group/membership/grant governance, explanation and registered scope/policy projection; framework evaluator remains authoritative. |
| Framework `org.moqui.admin.ConfigurationServices` | Effective nonsecret configuration, typed instance preferences, guarded registered connection/provider adapters and explicit diagnostics. Mantle gateway adapters supply their domain validation. |
| Framework `org.moqui.admin.IntegrationServices`, `MailDomainServices` | Registered event subscription coordination using SystemMessage, and domain proof/readiness with mail account/provider adapters. |
| Framework `org.moqui.admin.OperationServices` | Scoped registered job/message projections and recovery dispatch; no replacement scheduler, queue, monitor or alert evaluator. |
| Framework `org.moqui.admin.DataTransferServices`, `BackupServices` | Common staged envelope/result UI, registered business import/export dispatch and archive/coverage operations. Domain services remain the executors. |
| Framework `org.moqui.admin.AuditServices`, `PrivacyServices` | Safe multi-source evidence and registered retention/privacy coordination. Domain providers, including Mantle party/HR/financial/content services, retain record discovery and disposition authority. |

Minimum proposed records, only where current native records do not already represent the fact:

- **UserInvitation:** invitationId, destination, target party/account reference, organization/participant scope, approved grant proposal reference/version, token hash, expires/accepted/revoked times, inviter, state and revision. Grant proposal is validated structured metadata, never executable input; no plaintext token retained.
- **UserLifecycleOperation / step:** operationId/key, target, kind/scope, reason, source reference, requested/effective time, actor, revision/state; step identity/provider/action/target, attempt, outcome/reason and completion time. Domain records are linked, not copied.
- **InstancePreference:** registered key, typed nonsecret value, revision, updated-by/time. Definitions fix type/scope/default; there is no arbitrary-setting escape hatch.
- **EventSubscription:** fields specified in WebhookDetail; delivery identity references existing SystemMessage and source event identity. Existing Git/agent subscriptions stay native.
- **MailDomain / verification evidence:** fields specified in MailDomainDetail; proof/check history excludes private signing material.
- **TransferBatch / TransferItem:** batch identity/provider/version, source resource/hash, mapping/options hash, organization, actor, preview revision, state/counts/retention; item source identity/atomic-unit key, target reference, operation key, state, attempt, safe error and result. Existing owner batches register an adapter rather than duplicate these rows.
- **RetentionHold / PrivacyRequest / PrivacyRequestContent / request result:** registered category and scoped target, authority/reason/dates/revision; verified subject/request type/scope/evidence reference/assignee/state/dates; the protected content association and direct resource guard specified in §12; provider-unit decision/revision/operation identity/outcome. Exact domain retention rules remain in their owner records.

New states/kinds use registered StatusItem/Enumeration values and audited transitions. No free-text state machines, universal version store or copied snapshots are introduced. Changes to native configuration use expected revision or lastUpdatedStamp; changes to effective-dated business settings use the owner's dated rows. Current framework record/service names must be verified again when implementing a specific phase.

### 16.3 Later capabilities

LDAP/SCIM/directory provisioning, a generic custom-field/layout editor, visual arbitrary workflow automation, full DMARC/TLS-report ingestion and multi-instance hosting are later/outside this application release. Their present disposition is owner links or absence, not dead menu placeholders. Custom model/editor work must first establish its own security, migration and domain constraints. Existing framework agent triggers, service jobs, registered webhooks and domain automations already cover the supported automation paths. Browser database restore remains an advanced maintenance operation rather than an unguarded future button.

## 17. Coverage and acceptance

### 17.1 Research inventory disposition

| Research candidate | Final disposition |
| --- | --- |
| Admin home, setup checks, health widgets | Home/Health; reuse existing report widgets and Monitor; proposed domain readiness aggregation only. |
| Users, invite single/CSV, account/Employee360 details | Users/UserDetail/Invitations/Sessions/Lifecycle; account owner is Admin, People/Commons link or include authorized portions; no copied HR profile. |
| Groups, capabilities, matrix, row rules, access inspector | Access screens; named permissions with existing artifact/row policy, no new authorization engine. |
| Security policy, SSO and IP restrictions | SignInPolicy and IdentityProviderDetail; conf-owned policy remains effective-state read; group flags editable through guards; LDAP/SCIM later. |
| Organization profile, instance settings, localization, dictionaries/status flows | Settings screens and owner index; shared Contact profile; raw model/status editors remain Tools. |
| Apps/modules | Capability launcher gates and settings index. Fixed BOSS applications are not an install/uninstall marketplace. |
| Webhooks, remotes/types, keys, gateways | Integrations screens; credential lifecycle on UserDetail; native gateway/organization availability Admin-owned; business choices stay Accounting/Warehouse/Commerce. |
| Relay, SMTP trust, domains, protocol servers, queues | Protocol screens over current facilities; MailDomain/readiness additions explicit; no protocol runtime claimed missing because the research predates it. |
| Mail accounts and templates | Canonical Comms screens linked from ProtocolHome/consumer lists; no duplicate forms. |
| Notification topics/subscriptions | Topics/TopicDetail; personal preferences Commons, approval/consent behavior stays owner. |
| Jobs, job monitors, alerts | Jobs/runs plus existing Monitor/report alert/check/incident/recovery tools. No new ServiceJobMonitor subsystem. |
| Import/export, profiles, snapshots and backups | Registered common business transfer UI, existing report/domain outputs, Backups; raw snapshots/restore and arbitrary entity operations stay Tools. |
| Audit, visits/hits, errors, access evidence | AuditChanges/AccessLog and existing Monitor destinations. ArtifactHit/ArtifactHitBin are retired; no resurrected store. |
| Retention/privacy | Reviewed provider-based retention/holds and PrivacyRequest flow; no global Party cascade deletion. |
| Assist, models/skills/tools/usage/A2A | Existing System/Llm administration; current Agent and Llm models, permissions and tool policy, not research-era entities. |
| Developer/hosting/customization | DeveloperTools links with existing sealed rights; generic customization and multi-instance hosting deferred/outside BOSS. |

### 17.2 Baseline form traceability

The inventories add **Designed in** mappings only; no **Implemented in** claim changes. Framework forms are cited here because `ss-inventory`/`usl-inventory` track Marble/Mantle, not all Tools services.

| Baseline | Designed destination/disposition |
| --- | --- |
| Gateway Payment: EditPaymentGatewayForm, NewPaymentGatewayForm, PaymentGatewaysForm | Admin/Integrations/ConnectionDetail and Connections; native credentials/infrastructure, plus Accounting's binding-selection owner links. |
| Gateway Shipping: EditShippingGatewayForm, NewShippingGatewayForm, ShippingGatewaysForm | Admin/Integrations/ConnectionDetail and Connections for credentials/native infrastructure; Warehouse retains carrier/method business bindings. |
| Vendor FindVendor: FindVendor, CreateVendor, VendorList | Admin/Settings/Organizations. |
| Vendor EditVendor: EditVendor, RoleList | Admin/Settings/OrganizationDetail shared identity/role profile, with guarded internal-role editing. |
| Vendor EditVendor: PaymentInfo, BillingInfo | OrganizationDetail shared contact-purpose forms; actual payment instruments stay Accounting. |
| Vendor EditVendor: SetVendorRepForm; EditUsers AddUserRelationshipForm, UpdateUserRelForm | OrganizationDetail OrganizationMembers with dated/authorized relationship semantics. |
| Vendor initialize-accounting link | Accounting-owned setup action linked from OrganizationDetail; no new unconditional initialization on create/save. |
| Party/EditParty CreateUserAccount | Admin/Users/Users NewStaffAccount; direct creation is an authorized exception to the invitation default. |
| Party/EditParty UpdateUserAccount, AddGroupForm, GroupsForm | Admin/Users/UserDetail Account and Memberships; preserve Commons/People/shared Contact mappings already present. |
| Party/EditParty AddSettingForm, AddSettingTextForm, SettingsForm | Admin/Settings/OrganizationDetail OrganizationDefaults for registered internal-organization defaults; preserve other context mappings. |
| Tools UserAccount/UserGroup/ArtifactGroup, SSO entities, jobs, messages, localization, audit | BOSS forms above adapt their functions with scoped service guards; advanced raw configuration remains Tools. |

### 17.3 Acceptance scenarios

These are design walkthroughs and future focused implementation checks. Documentation work requires no build or slow test. Implementation uses fast meaningful server/client cases; slow scenarios require explicit user permission under repository policy.

| Scenario | Required evidence |
| --- | --- |
| Delegated administration | An organization identity operator can invite/end membership there, cannot inspect another organization's details, disable a multi-organization identity globally, assign privileged/sealed rights or infer them from a launcher grant. Direct service/import/SSO attempts obey the same rules. |
| Last administration path | A group/provider/factor change that would remove all usable instance administration is refused with a reason; a permitted change records before/after and takes effect in subsequent requests. |
| Hire and invitation | People hire commits once; failed invitation transport does not roll back employment. Retry keeps one account/invitation operation. Resend revokes the prior token; expired/revoked/wrong-address/public tokens cannot grant internal access. |
| Offboarding | Global disable revokes sessions/keys/app passwords/SSH access and stops pending privileged work. One-org removal preserves unrelated access. Schedule transfer checks the new owner; disabled-user contact books and historical financial/HR records survive until reviewed retention permits action. |
| Access explanation | Inspector identifies grant, row and domain restrictions without executing the action or revealing a denied record; unsupported dynamic checks are unresolved, not an invented allow. |
| Settings ownership | Authorized finance config works without another app's launcher. Admin provisions PaymentGatewayOrganization; finance can select it but cannot change credentials. Products owns global units; domain policy retains its effective date/source. |
| Protocol readiness | Built-but-disabled, unbuilt, missing trust/TLS, failed test and ready states differ. An SMTP allowlist/authserv mismatch never reports trusted reception. Domain proof does not enable open relay; secrets stay masked. |
| Unknown provider outcome | A timed-out charge, label, campaign submission or mail send is reconciled through its owner. Bulk queue recovery never repeats successful business effects or fabricates acknowledgement. |
| Independent failure | One failed readiness provider, transfer row, lifecycle step or job item is named while independent work continues; dependent postings remain atomic. |
| Import preview/retry | Stale mappings/source revisions are refused. A retry cannot duplicate successful rows, bypass payroll/stock/financial writers or import passwords/groups. Corrected rows carry new reviewed revisions. |
| Export and recipient delivery | Two report recipients with different scope receive different authorized results; revoked recipient/owner stops pending delivery. Admin sees status but cannot read another recipient's payload. Duplicate selection sends once; uncertain delivery needs reconciliation. |
| Monitor reuse | Job trace links open current Monitor, alerts use existing definitions, incidents/recovery use existing permissions. Missing/degraded telemetry is not healthy. No ArtifactHit table or new incident engine is required. |
| Backup scope | Embedded success, external-provider unknown, skipped, partial and failed outcomes differ. Archive keys cannot escape approved storage; download needs fresh permission/authentication and logs access. |
| Privacy hold | Preview separates retain/redact/export/erase by owner; active holds and posted accounting/payroll history block prohibited actions. One provider failure leaves other outcomes and unresolved work visible. |
| Agent policy | Admin opens existing System/Llm with AgentAdmin; source data permissions and tool approval/version rules still apply. Usage summaries do not reveal prompts or report bodies. |
| Output/UI parity | Every screen table row has a defined form/context, source and need; phone/TUI can complete its supported task; zero, absent, failure and denied states remain distinguishable. |

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
| Gateway infrastructure and business selection differ | Admin provisions credentials and approved organization availability, including PaymentGatewayOrganization; Accounting/Warehouse/Commerce retain their established choices. |
| Current Assist policy is reused | The framework now has tool policy/exposure/approval records and services; these supplement domain authorization. No duplicate BOSS tool-policy engine. |
| Tools remain separately privileged | Root administration does not grant shell/SQL/impersonation/password/gateway permissions. Existing sealed rights and environment restrictions stay authoritative. |
| Current telemetry, reports and monitoring are reused | Monitor/incident/recovery, report alerts and schedules already exist. Research-era missing-platform statements and retired ArtifactHit references are superseded by §1.3 and §10. |
| Business transfer goes through domain services | Shared envelope and UI, not arbitrary entity loading; independent items have durable outcomes and safe replay. |
| Business report delivery executes per internal recipient | Insights INS-06/INS-07 owns the framework extension; Admin handles ownership/status only. External business delivery remains deferred. |
| Disablement is not erasure | Revoke access immediately; transfers and retention/holds are reviewed owner operations. No automatic purge of disabled users' personal books or protected history. |
| Final design does not mean all features are built | Existing, proposed and later work are explicit. A missing provider is visible as unavailable or omitted where optional, never silently successful. |

## 19. Open

No research open question remains a blocking product-design choice. Installation-specific delegation bundles, provider credentials, organization memberships, mail-domain records, policy durations, backup destinations and enabled protocol ports are configuration inputs, chosen through the guarded owner workflows above. They are not hard-coded defaults or unfinished architecture decisions.

The later capabilities in §16.3 require their own implementation-ready design before being scheduled. None delays the first-release identity, configuration, transport, transfer and operational composition described here.
