# IronStone BOSS — Marketing design

Oct 31, 2026 — design specification; Marketing application implementation remains future.

IronStone Marketing serves marketing staff, campaign managers, audience stewards and event
organizers. It brings together campaigns and budgets, segments and lists, email/newsletters and
SMS, experiments and drip sequences, promotions, content, events, surveys, lead capture and
campaign analytics. It works without a store; store promotions and paid ticket orders use the
appropriate commerce services when configured. Public participation uses IronStone PASS over
Mantle, without a BOSS runtime dependency.

**Inputs:** [marketing research](research-marketing.md), [initial decisions](initial-design.md),
[design guide](design-doc-guide.md), [style guide](style-guide.md),
[crosscut](design-crosscut.md), [Commons and Comms](design-drawers-commons.md),
[Sales](design-sales.md), [Commerce](design-commerce.md),
[Customer Service](design-customer-service.md), [Products](design-products.md),
[Accounting](design-accounting.md), [PASS foundation](../../mr-pass/plan/design-forum.md),
[Shop](../../mr-pass/plan/design-shop.md), [screen inventory](ss-inventory.md) and
[service inventory](usl-inventory.md). The [shared ground rules](impl-drawers-commons.md#4-ground-rules)
and [application practices](../../../../docs/dev/Practices-App-Dev.md) govern implementation.

**Sections:** [1 shell](#1-shell) · [2 screens](#2-screens) · [3 campaigns](#3-home-and-campaigns) ·
[4 audiences](#4-audiences) · [5 sends](#5-sends-templates-and-experiments) ·
[6 automation](#6-automation) · [7 promotions](#7-promotions) · [8 content](#8-content-and-tracking) ·
[9 events](#9-events) · [10 surveys and leads](#10-surveys-leads-and-engagement) ·
[11 reports](#11-reports) · [12 settings](#12-settings) · [13 public access](#13-pass-marketing-participation) ·
[14 contracts](#14-data-service-and-shared-screen-contracts) · [15 operations](#15-automation-and-operations) ·
[16 acceptance](#16-coverage-and-acceptance) · [17 delivery](#17-delivery-stages) ·
[18 outputs](#18-documents-and-outputs) · [19 needs](#19-framework-and-data-needs) ·
[20 decisions](#20-decided) · [21 open](#21-open).

**Source convention.** Third-party patterns are attributed to the research sections, which describe
its inspected checkouts; they are not claims about current third-party releases. Baseline screen
names are relative to `mr-marble/screen/SimpleScreens/`. Current local XML governs implementation
claims. Abbreviations in form tables are defined in §14.2; their operations are **proposed** except
where explicitly marked existing. Proposed records below are contracts, not implemented schema.

**Current-source boundary.** `screen/Marketing.xml` and its section placeholders exist, with icon
`sym_o_campaign`; the app authorization entries are commented out. Mantle already has
`MarketingCampaign`, its `MKTG_CAMP_*` flow and dated campaign parties, the native segment and
tracking entities, and the store promotion model. It has no campaign lifecycle, campaign-send,
segment evaluation or marketing attribution service family. The research's statement that no
service uses contact lists is obsolete: `mantle.marketing.ContactListServices` implements list and
mailbox operations and `send#ContactListEmail`; `mantle.party.ConsentServices` implements consent
history, subscriptions and hashed unsubscribe tokens. These need scoped Marketing extensions,
not replacements. Existing list-send selection is permissive when consent is unspecified and
is not a durable campaign dispatch queue. Non-MAILBOX list operations do not yet enforce the
organization/capability boundary required here. `org.moqui.SmsServices.send#SmsMessage` is a
warning/error stub, not an available SMS channel. Commons calendar, wiki review/publication,
Chatter and record files exist; their broader designed contexts are not automatically implemented.

## 1. Shell

### 1.1 Root, roles and authority

Keep root `Marketing`, `screen/Marketing.xml`, `sym_o_campaign` and existing
`mantle.party.PartyServices.setup#UserOrganizationInfo`. Proposed
`ironstone.marketing.ContextServices.get#SharedContext` supplies capabilities, authorized
organization choices, same-app links, readiness and shell providers. Every Mantle operation checks
its permission and record scope independently, including searches, choices, reports, exports,
previews and batch items. Shell context is presentation, not authorization.

Ordinary groups use `MANTLE_USER_ORG` and `MANTLE_PRIVATE_CONTACT`; the app admin uses the
established active-organization admin filters. Campaign organizations are dated
`MarketingCampaignParty` rows with proposed role `MarketingOrganization`; managers/contributors
use their own role rows, never overloaded ownership fields. One effective owning organization is
required. Lists/segments use their existing `ownerPartyId`; `_NA_`/unowned legacy records are
unassigned, not globally writable. Adoption requires an authorized explicit assignment before use.
Campaign-related records inherit the owning organization and reject mismatched source records.

All groups and permissions below are proposed except the existing admin group shell declaration.
The letters are used in the screen table; a narrower permission composes with view and scope.

| Group / shorthand | Permissions and boundary |
| --- | --- |
| BOSS_MARKETING / app | MARKETING_VIEW; app entry and organization-authorized campaign summaries |
| BOSS_MARKETING_AUTHOR / A | MARKETING_CAMPAIGN_EDIT, MARKETING_SEND_EDIT, MARKETING_CONTENT_EDIT; draft work, preview and test to approved test recipients |
| BOSS_MARKETING_AUDIENCE / U | MARKETING_AUDIENCE_VIEW, MARKETING_AUDIENCE_EDIT, MARKETING_CONSENT_EDIT, MARKETING_AUDIENCE_EXPORT; person-level lists, segments, imports and evidenced consent changes |
| BOSS_MARKETING_APPROVER / V | MARKETING_APPROVE; campaign, send and sequence approval; no dispatch grant implied |
| BOSS_MARKETING_DISPATCH / D | MARKETING_DISPATCH; release approved sends, choose/release an experiment winner, activate an approved sequence, pause/cancel and recover permitted deliveries |
| BOSS_MARKETING_EVENTS / E | MARKETING_EVENT_MANAGE; registration setup, capacity and attendee operations; event/calendar and financial permissions still apply |
| BOSS_MARKETING_ANALYST / R | MARKETING_REPORT_VIEW; aggregate measures; person-level drill-down additionally requires MARKETING_AUDIENCE_VIEW and source access |
| BOSS_MARKETING_READ / read | MARKETING_VIEW and MARKETING_REPORT_VIEW; no mutations or audience addresses |
| BOSS_MARKETING_ADMIN / S | MARKETING_CONFIGURE plus explicit view/edit grants; no implicit approval, dispatch, finance or infrastructure authority |

The proposed shared permissions are MESSAGE_TEMPLATE_VIEW, MESSAGE_TEMPLATE_EDIT,
MESSAGE_SENDING_CONFIGURE and MESSAGE_SUPPRESSION_REVIEW. Comms owns their group bindings;
Marketing authors receive template-view, designated template editors receive template-edit, and
sending configuration/suppression review are explicit grants rather than consequences of app admin.

Grant template editing/sending-profile selection through shared Comms capabilities, promotion
writes through Commerce's scoped promotion permission and page publication through the content
owner's capability. A Marketing launcher grant never grants Sales pipeline, Accounting ledger,
private contact, mail account or public-site administration access. A source projection omits
restricted fields before serialization, including charts, counts and exported rows. Organization
scope is checked before looking up an address or returning a duplicate-match result.

### 1.2 Navigation and common behavior

- Home — `Home`; calendar shortcut — `Calendar`
- Campaigns — `Campaigns`; approvals — `Campaigns/Approvals`
- Audiences — `Audiences/Lists`, `Audiences/Segments`, `Audiences/Consent`, `Audiences/Suppressions`
- Sends — `Sends`; templates — `Sends/Templates`; automation — `Automations`
- Promotions — `Promotions`; codes — `Promotions/PromoCodes`
- Content — `Content`; landing pages — `Content/LandingPages`; links — `Content/TrackingLinks`
- Events — `Events`; attendees within each event
- Surveys and leads — `Surveys`; leads — `Leads`; lead rules — `Leads/LeadRules`
- Reports — `Reports`
- Settings — `Settings`

The old Segments, Newsletters and Reports placeholders gain the routes above; preserve incoming
`Marketing/Segments` and `Marketing/Newsletters` links as redirects to the new lists. No implemented
business editor is being replaced. The menu exposes built areas only during delivery.

Record headers, one status-dependent primary action, More menus, named confirmations and
not-available states follow the style guide. Lists have service pagination, selectable columns,
server-search record choices and two useful phone columns. Filters are applied before pagination.
Dates use the user's zone, schedule entry shows the selected zone, and currencies come from the
organization/user rather than a fixed default. XML board/calendar views are used where sufficient;
Commons' calendar and knowledge editor retain their existing `.qvue` and terminal counterparts.
No new visual journey canvas or block-email builder is required for the first release.

## 2. Screens

Paths are under BOSS unless prefixed `PASS:`. `app` means the root read scope, subject to field-level
capabilities; other role letters refer to §1. `N` in main records means proposed, not a Scope value.
Shared forms have one definition at the cited owner; each mounted route is counted separately.

| Screen | Path | Archetype | Impl | Purpose | Main record | Reused | Roles | Scope | Context |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home | Marketing/Home | landing | xml | Running work, upcoming activity and attention | W.get#Home | own | app | new | organization and period |
| Calendar | Marketing/Calendar | calendar | qvue | Campaign and participation schedule | WorkEffort; campaign/send projections | Commons §7, crosscut §3.13 | app | new | authorized date range |
| Campaigns | Marketing/Campaigns | list | xml | Find campaigns and compare budgets | MarketingCampaign | own | app | new | filters and campaign rows |
| CampaignDetail | Marketing/Campaigns/CampaignDetail | detail | xml | Plan and operate a campaign | MarketingCampaign | own | app | new | campaign ID |
| Approvals | Marketing/Campaigns/Approvals | list | xml | Decide assigned Marketing approvals | NotificationMessage; N MarketingDecision | Commons §4, crosscut §3.15 | V | new | recipient and topics |
| Lists | Marketing/Audiences/Lists | list | xml | Manage distribution lists | ContactList | own | U | new | list filters |
| ListDetail | Marketing/Audiences/Lists/ListDetail | detail | xml | Maintain list policy and members | ContactList | own | U | new | list ID |
| MemberDetail | Marketing/Audiences/Lists/MemberDetail | detail | xml | Inspect membership and evidence | ContactListParty | own | U | new | list, party, membership date |
| AudienceImport | Marketing/Audiences/Import | wizard | xml | Preview and import contacts/members | N AudienceImport | own | U | new | import ID; no raw file in shell |
| AudienceMerge | Marketing/Audiences/Merge | task | xml | Consolidate lists without changing consent | ContactList | own | U | new | source/target lists |
| Segments | Marketing/Audiences/Segments | list | xml | Find rule and curated audiences | MarketSegment | own | U | new | segment filters |
| SegmentDetail | Marketing/Audiences/Segments/SegmentDetail | detail | xml | Define and explain segment membership | MarketSegment | own | U | new | segment and as-of |
| AudiencePreview | Marketing/Audiences/Preview | task | xml | Explain eligible and excluded recipients | Q.preview#Audience | own | A, U, D | new | source IDs; aggregate counts |
| Consent | Marketing/Audiences/Consent | list | xml | Inspect and manage consent | PartyConsent | Comms §16 | U | new | authorized party filters |
| ConsentDetail | Marketing/Audiences/Consent/Contact | detail | xml | Inspect purpose/list consent history | PartyConsent; PartyContactMech | Comms §16 | U | new | party ID |
| Suppressions | Marketing/Audiences/Suppressions | list | xml | Inspect channel blocks and evidence | N MarketingSuppression | own, shared Comms context §4 | U, S | new | channel/reason filters |
| Sends | Marketing/Sends | list | xml | Find email and SMS sends | N CampaignSend | own | app | new | campaign/channel/state filters |
| SendDetail | Marketing/Sends/SendDetail | detail | xml | Review and release a send | N CampaignSend | own | app | new | send ID |
| Compose | Marketing/Sends/Compose | editor | xml | Author campaign email or SMS | N CampaignSend; EmailTemplate | own | A | new | send ID; no recipient body data |
| Templates | Marketing/Sends/Templates | list | xml | Choose reusable channel templates | EmailTemplate; N MessageTemplate | Comms-owned, defined §5 | A, S | new | kind/channel filters |
| TemplateDetail | Marketing/Sends/Templates/TemplateDetail | detail | xml | Edit a safe shared template | EmailTemplate; N MessageTemplate | Comms-owned, defined §5 | template editors | new | template ID |
| ExperimentDetail | Marketing/Sends/ExperimentDetail | task | xml | Review variants and release a winner | N CampaignExperiment | own | A, V, D | new | experiment ID |
| Delivery | Marketing/Sends/Delivery | list | xml | Inspect delivery and exclusions | N CampaignRecipient; ContactListCommStatus | own, shared Comms projection §5 | D; U for PII | new | send and state filters |
| RecipientDetail | Marketing/Sends/RecipientDetail | detail | xml | Explain one delivery attempt history | N CampaignRecipient | own | D and U | new | recipient ID |
| Automations | Marketing/Automations | list | xml | Find campaigns' drip sequences | N MarketingAutomation | own | app | new | sequence filters |
| AutomationDetail | Marketing/Automations/AutomationDetail | detail | xml | Author, simulate and activate ordered steps | N MarketingAutomation | own | A, V, D | new | automation ID |
| EnrollmentDetail | Marketing/Automations/EnrollmentDetail | detail | xml | Inspect one participant's execution | N AutomationEnrollment | own | D and U | new | enrollment ID |
| Promotions | Marketing/Promotions | list | xml | Find store promotions linked to campaigns | ProductStorePromotion | Commerce §7, crosscut §3.28 | promotion readers | parity | store/campaign filters |
| PromotionDetail | Marketing/Promotions/PromotionDetail | detail | xml | Edit one store rule and campaign links | ProductStorePromotion | Commerce §7, crosscut §3.28 | promotion editors | parity | store promotion ID |
| PromoCodes | Marketing/Promotions/PromoCodes | list | xml | Find/generate store promotion codes | ProductStorePromoCode | Commerce §7, crosscut §3.28 | promotion editors | parity | promotion and selection |
| PromoCodeDetail | Marketing/Promotions/PromoCodes/PromoCodeDetail | detail | xml | Inspect code limits and use | ProductStorePromoCode | Commerce §7, crosscut §3.28 | promotion readers/editors | parity | code ID |
| Content | Marketing/Content | list | xml | Plan campaign assets and publication links | N CampaignContent | own | app | new | campaign/type filters |
| ContentDetail | Marketing/Content/ContentDetail | detail | xml | Link approved content to campaign outputs | N CampaignContent; WikiPage/WikiBlog | own | A | new | content association ID |
| LandingPages | Marketing/Content/LandingPages | list | xml | Find campaign landing pages | Commerce page binding | Commerce §5 | content readers | new | site and campaign |
| PageDetail | Marketing/Content/LandingPages/PageDetail | editor | xml | Author a campaign landing page | Commerce page binding; WikiPage | Commerce §5 | content editors | new | site/page ID |
| Knowledge | Marketing/Content/Knowledge | editor | qvue | Author/review the linked wiki page | WikiPage | Commons §10 | content editors | parity | authorized wiki page |
| TrackingLinks | Marketing/Content/TrackingLinks | list | xml | Find campaign links and QR targets | TrackingCode | own | app | new | campaign/source filters |
| TrackingLinkDetail | Marketing/Content/TrackingLinks/TrackingLinkDetail | detail | xml | Maintain and inspect a tracking link | TrackingCode | own | A, R | new | tracking code ID |
| Events | Marketing/Events | list | xml | Find campaign events and registrations | WorkEffort WetEvent | own | app | new | campaign/event filters |
| EventDetail | Marketing/Events/EventDetail | detail | xml | Edit the common calendar event | WorkEffort | Commons §7 | E and event rights | parity | event and campaign |
| RegistrationSetup | Marketing/Events/RegistrationSetup | settings | xml | Set tickets, capacity, forms and notices | N EventRegistrationPolicy | own | E | new | event ID |
| Registrations | Marketing/Events/Registrations | list | xml | Operate attendees and waitlist | N EventRegistration | own | E | new | event and states |
| RegistrationDetail | Marketing/Events/RegistrationDetail | detail | xml | Inspect ticket, payment, answers and attendance | N EventRegistration | own | E | new | registration ID |
| CheckIn | Marketing/Events/CheckIn | task | xml | Check in an eligible attendee | N EventRegistration | own | E | new | event; no token in shell |
| Surveys | Marketing/Surveys | list | xml | Find shared survey definitions | DbForm | Commons owner; Customer Service §9 | survey readers/editors | parity | purpose/organization filters |
| SurveyDetail | Marketing/Surveys/SurveyDetail | detail | xml | Edit shared questions and access | DbForm | Commons owner; Customer Service §9 | survey editors | parity | form ID and effective time |
| SurveyDistribution | Marketing/Surveys/Distribution | detail | xml | Publish/share a campaign survey | N MarketingFormPublication | own | A | new | publication ID |
| Responses | Marketing/Surveys/Responses | report | xml | Inspect scoped responses and aggregates | FormResponse | Commons owner; Customer Service §5 | U, R | parity | form/publication/date filters |
| ResponseDetail | Marketing/Surveys/ResponseDetail | detail | xml | Read one historical response | FormResponse | Commons owner; Customer Service §5 | authorized response readers | parity | response ID |
| Leads | Marketing/Leads | list | xml | Follow campaign lead handoff | SalesOpportunity | Sales §3 | Sales readers | new | campaign/source filters |
| LeadRules | Marketing/Leads/LeadRules | settings | xml | Route explicitly captured interest | N MarketingLeadRule | own | A, S; Sales routing grant | new | rule ID |
| Customer360 | Marketing/Customers/Customer360 | 360 | xml | Inspect authorized engagement | Party | crosscut §3.2 | U | parity | party ID |
| ContactDetail | Marketing/Contacts/ContactDetail | detail | xml | Inspect contact data and subscription links | Party | crosscut §3.1, Commons §6 | U | parity | party ID |
| Reports | Marketing/Reports | landing | xml | Choose measures and drill-downs | R.get#ReportCatalog | own | R | new | organization/period |
| CampaignPerformance | Marketing/Reports/CampaignPerformance | report | xml | Compare plans, reach and outcomes | R.get#CampaignPerformance | own | R | new | campaign/period/currency |
| DeliveryAnalysis | Marketing/Reports/DeliveryAnalysis | report | xml | Explain delivery and observed engagement | R.get#DeliveryAnalysis | own | R | new | send/channel/cohort |
| AudienceGrowth | Marketing/Reports/AudienceGrowth | report | xml | Explain subscriptions and withdrawals | R.get#AudienceGrowth | own | R | new | list/purpose/period |
| Attribution | Marketing/Reports/Attribution | report | xml | Reconcile source links to business outcomes | R.get#Attribution | own | R and source rights | new | campaign/basis/period |
| Settings | Marketing/Settings | settings | xml | Find Marketing and shared settings | W.get#Settings | own | S | new | organization |
| CampaignDefaults | Marketing/Settings/CampaignDefaults | settings | xml | Set operational defaults and approvals | N MarketingPolicy | own | S | new | organization/effective time |
| Vocabularies | Marketing/Settings/Vocabularies | settings | xml | Maintain offered channel/source values | Enumeration; N MarketingVocabulary | own | S | new | organization/type |
| LeadSources | Marketing/Settings/LeadSources | settings | xml | Edit shared Sales lead sources | Sales source records | Sales §9 | Sales source editors | new | organization |
| SendingProfiles | Marketing/Settings/SendingProfiles | settings | xml | Select approved senders and readiness | N MessageSendingProfile | Comms-owned, defined §12 | shared sending-config grant | new | organization/profile |
| QuickCreate | Marketing/QuickCreate | dialog | xml | Start authorized Marketing work | campaign/send/list/event | shell provider, defined §14 | by operation | new | authorized host |
| Subscribe | PASS:Marketing/Subscribe | task | xml | Request a published list subscription | N SubscriptionRequest | own public §13 | public publication | new | none |
| VerifySubscription | PASS:Marketing/VerifySubscription | task | xml | Confirm address control and subscription intent | N SubscriptionRequest | own public §13 | bearer token | new | none |
| Preferences | PASS:Marketing/Preferences | task | xml | Change the recipient's permitted preferences | ContactListToken; PartyConsent | existing Unsubscribe contract, §13 | bearer token | new | none |
| SubmitForm | PASS:Marketing/SubmitForm | task | xml | Submit a published survey or lead form | DbForm; FormResponse | own public §13 | published access policy | new | none |
| Event | PASS:Marketing/Event | detail | xml | View a published event's registration offer | WorkEffort; N EventRegistrationPolicy | own public §13 | public publication | new | none |
| Register | PASS:Marketing/Register | wizard | xml | Reserve and complete registration | N EventRegistration | own public §13 | published access policy | new | none |
| Registration | PASS:Marketing/Registration | detail | xml | Read or cancel one's registration | N EventRegistration | own public §13 | verified owner/capability | new | none |

## 3. Home and campaigns

### Home

Landing cards show running campaigns, pending approvals, due sends, failed/uncertain deliveries,
registration capacity and audience changes. Each card links to the corresponding filtered list.
Upcoming activity combines campaign windows, sends, events and known approved publication dates;
an unavailable provider shows its own unavailable state, leaving other providers usable.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| HomeScope | find | Choose business context | organization, period, mine/team | date-period | — | Sales Home; research §1 |
| MarketingCards | display | Show actionable totals | campaigns, approvals, due, failed, registrations, subscribers | number cards | W.get#Home | Odoo mailing calendar; research §1 |
| Upcoming | list | Show planned activity | kind, title, date/zone, state, owner | same-app links | W.get#Upcoming | Commons Today |
| Attention | list | Resolve exceptions | record, reason, age, allowed action | status chips | W.get#Attention | Twenty campaign counters; research §1 |

**Actions:** New campaign is primary for A; other shortcuts require their own grants. Empty state
links to campaign and sending-profile setup. **Source:** research §1. **Needs:** MKT-ACCESS, MKT-SHELL, MKT-REPORT.

### Calendar — Context passed

Mount Commons Calendar with authorized campaign IDs and its own event permissions. Add read-only
providers for campaign from/thru windows, send schedules, sequence milestones and approved public
release dates; only event drag/resize uses existing `mantle.work.EventServices.update#EventOccurrence`.
Moving a send opens SendDetail and requires a new approved schedule; the calendar never bypasses
release checks. Existing `get#FullCalendarData` and `get#EventInstances` supply event rows; proposed
W.get#CalendarItems supplies the other types. The terminal counterpart is the dated agenda.
**Source:** research §§1, 11; Commons §7. **Needs:** MKT-SHELL.

### Campaigns

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| CampaignFind | find | Narrow campaigns | text, owner/team, status, date range, parent | server-search | — | Odoo campaign filters; research §2 |
| CampaignList | list | Compare activity | name, status, dates, budget/actual/currency, manager | list/board by status; calendar by dates | C.find#Campaigns | Odoo campaign kanban; native MarketingCampaign |
| NewCampaign | dialog | Start a plan | name, summary, organization, manager, parent, dates, currency, budget | organization and parent choices | C.create#Campaign | native fields; research §2 |

**Actions:** New, duplicate as a new Planned campaign, archive completed/cancelled records; bulk
owner/date changes preview each result and never approve implicitly. **Needs:** MKT-CAMPAIGN.

**Source:** research §§1–2; Odoo campaign list/kanban and native MarketingCampaign.

### CampaignDetail

Detail with Summary and budget, Audience, Sends, Automation, Content, Promotions, Events, Results
and Activity tabs. The header names the organization and native status. Related tabs query their
own bounded lists; inaccessible source areas are omitted, not fetched and hidden in the browser.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| CampaignHeader | single | Maintain the plan | name, parent, summary, from/thru/start, expected response/revenue, currency | status bar, date range | C.store#Campaign | MarketingCampaign; Odoo campaign form |
| CampaignParties | list, editable rows | Assign responsibility | party, role, from/thru | scoped party choices | C.store#CampaignParty | MarketingCampaignParty |
| Budget | single | Set target and expected spend | budgetedCost, estimatedCost, costUomId, explanation | currency amounts | C.store#CampaignBudget | native campaign fields; research §2 |
| CostEntries | list, editable rows | Reconcile actual spend | source, date, amount/currency, description, excluded/accepted | authorized Accounting source lookup | C.store#CampaignCost, C.find#CampaignCosts | new; fields here plus campaign, cost-entry ID, expected stamp and operation key |
| RelatedWork | list | Inspect audience and campaign assets | type, name, state, dates, relationship purpose | per-tab context | C.get#Campaign | research candidate campaign tabs |
| Decisions | list, read | Explain approvals and invalidation | target, effective time, decision, approver, reason | source links | C.get#Decisions | Commons approvals |

Campaign flow remains Planned → Approved → In Progress → Completed, with the existing cancellation
paths. Approval validates organization, dates, budget currency and required responsible parties.
Start requires a valid approval; completion does not silently discard pending sends/enrollments.
It either refuses with pending-work counts or follows an explicit confirmed stop-then-complete
command. Cancellation stops pending operations and leaves sent/registered facts intact.

Budget approval is not a spend reservation or an automatic Accounting posting. Proposed
CampaignCost rows record independently identified expense allocations or manual non-ledger costs.
Source-line allocations are unique, cannot exceed the eligible amount and follow corrections by
reversal/successor entries. A cost may be linked manually or sourced from Accounting, never both.
`actualCost` is a reconciled summary in campaign currency, with rate/date evidence; inaccessible
source details stay masked. No implicit aggregation of child and parent totals doubles the cost.
`numSent` and the report's `qualifiedLeadCount` are derived summaries with a defined basis (§11),
not editable results. Native `convertedLeads` is currently an `id` field; retain it as legacy data,
not a numeric authority or a value to cast silently. Campaign policies/parties are effective-dated and key fields audit-logged.

**Actions:** Save while editable; Approve for V; Start for authorized managers with approval;
Complete/Cancel confirm record and pending counts. Material changes invalidate affected approvals;
sent messages and accepted registrations remain historical facts. **Source:** research §§2, 12.
**Needs:** MKT-CAMPAIGN, MKT-APPROVAL, MKT-COLLAB, MKT-REPORT.

### Approvals — Context passed

Mount Commons Notifications/Approvals with proposed MarketingCampaignApproval, MarketingSendApproval
and MarketingAutomationApproval topics, current recipient and authorized source. Decisions call
C.decide#MarketingApproval against the target's current effective time/stamp, never a generic status
write. A single draft cannot be approved twice by concurrent actions. The configured separation
policy prevents self-approval when required. **Needs:** MKT-APPROVAL, MKT-SHELL.

## 4. Audiences

### Lists

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ListFind | find | Find distribution lists | name, type, channel, campaign, archived | scoped choices | — | research §3, Odoo Mailing Lists |
| ContactLists | list | Inspect list readiness | name, type, owner, subscribed/pending, last send | state counts | existing mantle.marketing.ContactListServices.find#ContactLists, extended | native ContactList |
| NewList | dialog | Create a distribution list | name, description, type, channel, organization, campaign | no MAILBOX choice | existing create#ContactList, extended | Odoo list form; native fields |

Marketing excludes MAILBOX lists and forum delivery preferences. Creating a marketing list does
not automatically subscribe its creator or expand staff members into recipients; that existing
mailbox behavior is retained only for MAILBOX. List public discoverability is distinct from PASS
publication. **Actions:** New, Import, Merge and Archive with list-specific scope. **Needs:** MKT-AUDIENCE, MKT-ACCESS.

**Source:** research §3; Odoo Mailing Lists and native ContactList.

### ListDetail

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ListHeader | single | Maintain list identity | name, type, channel, owner, campaign, description, single use | archive action | existing ContactListServices.update#ContactList, extended | ContactList; Odoo list form |
| SubscriptionPolicy | single | Define subscriptions | public offer, confirmation required, purpose, evidence text, confirmation/notice templates | shared template choices | L.store#SubscriptionPolicy | ContactListEmail and research §3 |
| Members | list | Inspect every membership state | party, address masked, state, since/until, consent evidence | state filters, member link | existing ContactListServices.find#ContactListParties, extended | ContactListParty; Odoo contacts |
| AddMembers | dialog | Record evidenced intent | selected parties, address/channel, purpose, evidence source/date, evidence text | duplicate/eligibility preview | L.request#Subscriptions | Twenty Add to Message List; research §3 |
| ListTemplates | list, editable rows | Bind outgoing/notice templates | email type, template, wiki category, from/thru | typed template choice | L.store#ContactListEmail | ContactListEmail; native CONT_* types |

The existing member query only returns accepted/pending mailbox-style membership; extend it with
bounded Marketing status filters. Add/import defaults to Pending until confirmation or a privileged,
audited evidence-based acceptance. Pending-unsubscribe is never sendable. Archive prevents new
subscriptions/dispatch, preserves history and leaves unsubscribe working. A single-use list is reserved atomically by the first released send; a second send cannot claim
it concurrently. Preview does not consume it. Cancellation before any provider handoff releases
the reservation; any accepted or uncertain handoff keeps it bound to that send, whose retries
resume the same execution. Completion consumes it.
**Source:** research §§3–4. **Needs:** MKT-AUDIENCE, MKT-CONSENT, MKT-TEMPLATE.

### MemberDetail

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Membership | display | Explain current and past rows | list, party, address, status, from/thru, purpose, evidence | history list | L.get#Member | native ContactListParty |
| SubscriptionAction | dialog | Confirm, withdraw or request verification | action, evidence/source/date, reason | named confirmation | L.request#Subscriptions; existing mantle.party.ConsentServices.subscribe#ContactListParty and unsubscribe#ContactListParty through scoped guard | Comms Consent |
| ConsentHistory | list, read | Review evidence | date, purpose/list, grant/withdrawal, source, actor | existing consent component | existing get#PartyConsentHistory | Comms §16 |

A staff member cannot undo a complaint/hard bounce by editing membership. Re-subscription records
new evidence and only clears the matching consent withdrawal; channel suppression has its own
review (§Suppression screen below). **Source:** research §3. **Needs:** MKT-CONSENT.

### AudienceImport

Wizard: upload/mapping → matching → subscription evidence → preview → results. Reuse existing
`mantle.party.ContactImportServices.parse#ContactFile`, `preview#Contacts` and `import#Contacts`
behind an organization-scoped Marketing adapter; do not invent another CSV parser or party merger.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ImportFile | wizard step | Stage input and map columns | file, encoding, name/address columns, target list, organization | file picker; bounded sample | L.preview#AudienceImport | Commons ContactImport |
| ImportEvidence | wizard step | Classify consent evidence | source, original date, purpose, evidence column/text, accept-or-request | explicit consent choice | L.preview#AudienceImport | research §3 |
| ImportMatches | list | Resolve permitted matches | row, normalized address, existing party, duplicate, proposed action, exclusions | scoped choice; no external private matches | L.preview#AudienceImport | Commons match preview |
| ImportResults | list | Report independent outcomes | row, party/member, applied/skipped/failed, reason | download error rows, retry failures | L.apply#AudienceImport, L.get#AudienceImport | Commons ContactImport |

A selected list does not supply consent evidence. Retrying a row uses its import/row identity and
cannot resubscribe a later withdrawal or replay confirmation mail. Bad rows do not roll back good
rows. Imports expire under the organization's retention policy; raw addresses are not shell context.
**Source:** research §3; Commons §6. **Needs:** MKT-AUDIENCE, MKT-CONSENT.

### AudienceMerge

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| MergeSelection | single | Choose lists and target | source lists, target, retain/archive sources | same-org/channel choices | L.preview#ListMerge | Odoo Merge Mailing Lists |
| MergePreview | list | Explain membership decisions | party/address, source states, target state, consent conflicts | totals and conflicts | L.preview#ListMerge | research §3 |
| ApplyMerge | dialog | Apply reviewed membership links | preview ID, source/target stamps, counts, reason | confirmation | L.merge#Lists | Odoo merge; native dated membership |

Merge is membership consolidation, not party merge. It preserves source rows and never promotes
pending/withdrawn membership to accepted. Target-list consent is required independently; evidence
for another topic is not transferred as a grant. Later withdrawals win over preview. Historical
send/attribution links retain original lists. **Needs:** MKT-AUDIENCE, MKT-CONSENT.

**Source:** research §3; Odoo Merge Mailing Lists and native dated list membership.

### Segments

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| SegmentFind | find | Find audiences | text, parent, type, owner, store | server-search | — | Odoo Dynamic Lists |
| SegmentList | list | Inspect segment definitions | description, kind, parent, last evaluated, eligible count | freshness label | Q.find#Segments | native MarketSegment |
| NewSegment | dialog | Start a definition | name/description, organization, kind, parent, optional store | rule or explicit-member kind | Q.store#Segment | research §3 |

**Actions:** New, duplicate, evaluate, archive; evaluations do not subscribe anyone.
**Source:** research §3. **Needs:** MKT-SEGMENT.

### SegmentDetail

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| SegmentHeader | single | Maintain scope | description, type, parent, store, owner | tree parent lookup | Q.store#Segment | MarketSegment |
| NativeRules | list, editable rows | Define native criteria | classification, geo, dimension/unit, min/max | typed choices | Q.store#SegmentRules | MarketSegmentClassification/Geo/Dimension |
| SavedFilter | single | Define additional business criteria | source, field, operator, value, all/any groups | bounded condition rows | Q.store#SegmentFilter | Odoo dynamic domain; Dolibarr saved filters |
| ExplicitMembers | list, editable rows | Curate membership | party, role, include/exclude, effective dates | server search | Q.store#SegmentMember | MarketSegmentParty, extended |
| Evaluation | list, read | Explain current matches | party, matched rule, excluded reason, evaluated at | preview drill-down | Q.evaluate#Segment | research §3 |

Within a native family, classification/geography rows are alternatives; dimension constraints are
conjoined, as are populated families. Min/max are inclusive after compatible unit conversion.
Parent scope intersects a child; cyclic parents are refused. Explicit exclusion wins, explicit
inclusion joins the rule match within parent/organization scope. Saved predicates compose with the
native rules by AND; nested ALL/ANY groups are typed, bounded and limited to authorized Party,
contact, purchase, engagement and registration projections. No arbitrary entity name, SQL or script
is accepted. Missing/unauthorized values do not become matches through negation. Definitions are
effective-dated; evaluation previews are not durable subscription or send authority.
**Source:** research §§3, 12. **Needs:** MKT-SEGMENT, MKT-ACCESS.

### AudiencePreview

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| AudienceSelection | single | Compose a send audience | lists, segments, exclusions, purpose/topic, channel, as-of | scoped selectors | Q.preview#Audience | Twenty CampaignAudiencePreview; research §3 |
| Eligibility | display | Explain counts | matched, distinct, eligible, exclusion buckets, untracked eligible | number cards plus reasons | Q.preview#Audience | Twenty exclusion counts |
| RecipientPreview | list, read | Inspect permitted examples | masked contact, eligibility, reason, source membership | U-only address detail | Q.preview#Audience | research §§3–4 |

Every send selects a subscription topic represented by a non-MAILBOX ContactList. Segments narrow
or supplement discovery, but a match still needs that topic's accepted membership and applicable
channel/purpose grant. The default Marketing policy requires affirmative, evidenced consent;
legacy unspecified consent is shown as needing review, not silently grandfathered. Imported
proof may establish it through the audited acceptance path. Transactional event receipts use their
own purpose and never enroll the attendee into marketing.

Deduplicate by normalized destination within the owning organization and channel. Choose one
recipient deterministically and retain all source memberships for explanation. Any applicable
withdrawal or suppression on that destination blocks it; duplicates with conflicting identity or
consent require review. Buckets are mutually exclusive by precedence: inaccessible/inactive party,
invalid/missing destination, suppressed, withdrawn/pending topic or purpose, missing evidence,
duplicate, then eligible. Tracking refusal is a flag on an otherwise eligible recipient, not an
exclusion from delivery. No aggregate exposes unauthorized source counts. Approval fixes the
recipient execution set; dispatch may remove recipients but never adds newly matched ones.
**Needs:** MKT-AUDIENCE, MKT-SEGMENT, MKT-CONSENT, MKT-SEND.

**Source:** research §§3–4; Twenty CampaignAudiencePreview exclusion buckets.

### Consent and ConsentDetail — Context passed

Mount Comms Consent list/contact definitions with permitted organizations, non-MAILBOX lists,
selected campaign/list/party and MARKETING_CONSENT_EDIT. Reuse existing
`mantle.party.ConsentServices.find#Consents`, `get#PartyConsentState`, `get#PartyConsentHistory`,
`store#PartyConsent`, `subscribe#ContactListParty`, `unsubscribe#ContactListParty` and
`unsubscribe#ContactListParties`, after their Marketing organization and permission extensions.
The existing `mantle.party.ContactServices.store#PartyContactMech` solicitation flag remains an
input, never a substitute for purpose evidence. The same extensions protect direct service calls,
not only these mounts. Broader legacy Comms behavior is not switched by a BOSS caller-name guard.
**Source:** research §§3, 11; Comms §16. **Needs:** MKT-ACCESS, MKT-CONSENT.

### Suppressions

Comms owns this reusable definition; Marketing supplies organization/channel scope.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| SuppressionFind | find | Narrow blocks | channel, reason, active, changed period | typed reasons | — | Odoo blacklist; Twenty suppression reasons |
| SuppressionList | list | Explain blocked delivery | masked destination, reason, source event, since/until, review state | history link | G.find#Suppressions | research §§3–4 |
| SuppressionChange | dialog | Add or review a block | destination, channel, reason, source evidence, effective dates, action | named confirmation; privileged clear | G.store#Suppression | research §3 |

Complaint/hard-bounce suppression is destination-scoped, independent of list membership. A new
subscription does not clear it. Only a shared suppression-review permission with new evidence can
end a block; the original delivery fact remains. Provider-level blocks apply across authorized
profiles without revealing another organization's campaign details. Soft failure retries are
bounded by sending policy and can produce a temporary suppression. **Needs:** MKT-CONSENT, MKT-TRANSPORT.

**Source:** research §§3–4, 10; Odoo blacklist and Twenty suppression reasons.

## 5. Sends, templates and experiments

### Sends

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| SendFind | find | Narrow sends | campaign, channel, state, owner, scheduled period | date range | — | Odoo Mailings; Twenty campaigns |
| SendList | list | Inspect work and results | name, campaign, subject, channel, state, schedule, eligible/accepted/failed | board by state; calendar by schedule | D.find#Sends | research §4 |
| NewSend | dialog | Start a mailing | campaign, name, channel, topic list, template, sending profile | template picker | D.create#Send | Odoo mailing form; Twenty composer |

**Actions:** New, duplicate into a new draft, open delivery or experiment; bulk cancellation is
previewed with counts and per-send outcomes. Duplication never copies recipients, approval or
execution identity. **Source:** research §§2, 4. **Needs:** MKT-SEND, MKT-TEMPLATE.

### SendDetail

Summary, Content preview, Audience, Schedule, Experiment, Delivery and Activity tabs. Draft,
Awaiting approval, Approved, Scheduled, Sending, Paused, Completed, Completed with failures and
Cancelled are **proposed send states**, separate from campaign and communication statuses.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| SendSummary | display | Review dispatch intent | campaign, channel, topic, sender, subject, content effective time, approval | readiness findings | D.get#Send | Odoo mailing form; Twenty envelope |
| SendAudience | display | Review approved population | source lists/segments, evaluated date, included/excluded counts, tracking flag | AudiencePreview link | Q.preview#Audience, D.prepare#Send | Twenty audience preview |
| SendSchedule | dialog | Choose dispatch time | now/at, date and zone, profile, frequency-cap findings | date-time with zone | D.schedule#Send | Odoo schedule wizard |
| SendDecision | dialog | Request/record approval | target stamp, preview identity, decision, reason | confirmation with recipient count | C.request#MarketingApproval, C.decide#MarketingApproval | Commons approvals |
| SendControl | dialog | Release, pause, cancel or recover | operation, send stamp, reason, affected counts | confirmation | D.release#Send, D.pause#Send, D.cancel#Send, D.retry#Recipients | Twenty commands; Odoo retry |

Prepare creates recipient execution records and records the effective content/policy time. The
approved body is retained as a rendered resource with safe variable definitions, not a second
configuration-version database. Any edit to subject, template/body, sender, audience or schedule
invalidates the affected send approval and requires preparation/review again before release.
Already attempted recipients/content remain immutable; further content changes create a new send.
A recipient whose chosen destination changes after approval is skipped for review, never silently
sent at an unreviewed substitute address. Empty eligible audiences cannot be released.

Campaign approval, content approval and dispatch permission are separate. An approved campaign is
required for promotional sends; a sending profile must be ready. Pause/cancel stops new claims;
claimed/in-flight messages may finish and the UI states their count. Retry targets only known
retryable failures with unchanged approved content and current eligibility. Unknown transport
outcomes stay in reconciliation, never the ordinary Retry selection. **Source:** research §§2, 4.
**Needs:** MKT-SEND, MKT-APPROVAL, MKT-TRANSPORT, MKT-CONSENT.

### Compose

XML editor with From/topic, subject/preheader, body, text alternative, approved assets, variables,
preview and test regions. Use existing rich-text/HTML editor support with sanitized output and
simple template choices; no executable body screen or script can be entered by a marketer. An SMS
body uses text and shows encoding, segment count and configured cost estimate before approval.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| MessageContent | single | Write one channel's content | sender/profile, reply-to, subject, preheader, HTML/text or SMS body, locale | rich text; variable picker; SMS counter | D.store#SendContent | Twenty CampaignComposer; research §4 |
| MessageAssets | list | Select authorized inline assets/attachments | file, usage, label/alt text, public delivery eligibility | shared file picker | D.store#SendAssets | Comms AttachFromFiles |
| MessagePreview | display | Inspect personalization | sample recipient or synthetic values, rendered content, missing-variable findings | phone-width and text previews | D.preview#Send | Odoo preview; Twenty variables |
| TestSend | dialog | Test approved sender/content | approved test destination, channel, sample values, note | clear TEST label | D.test#Send | Odoo mailing test wizard |

Variables use an allowlisted, escaping renderer; no arbitrary template evaluation, service call,
record access or caller-provided bodyParameters map. Required unknown variables block preparation;
optional ones have declared safe fallbacks. Personalized preview requires audience-data rights;
authors without those rights use synthetic samples. Test sends use an explicit, bounded test
recipient allowlist and never consume the live audience, experiment or conversion counts.
Attachments are checked for authorization, scanning and recipient access; a private staff URL
cannot be inserted as a publicly retrievable asset. Stored body/subject changes are audit-logged.
**Actions:** Save, Preview, Test, Request approval. **Devices:** XML terminal fields provide plain
text and structured HTML/source editing with the same validation. **Needs:** MKT-TEMPLATE, MKT-SEND.

**Source:** research §4; Twenty CampaignComposer, Odoo preview/test and shared Comms rich-text controls.

### Templates

Comms owns one shared template library, mounted here with campaign/channel filters. These are the
first full form summaries for that library; Comms Settings links to this canonical definition.
Transactional and promotional templates are different kinds of the same governed library, not
interchangeable delivery permissions. Existing `moqui.basic.email.EmailTemplate` remains the
framework email definition; proposed Mantle MessageTemplate metadata binds organization, channel,
purpose, safe variables, content and effective dates, and references its EmailTemplate for email.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| TemplateFind | find | Choose reusable content | organization, channel, purpose, locale, active | thumbnail/text list | — | Odoo Template Library |
| TemplateList | list | Inspect template readiness | name, kind, locale, effective date, review state | Use template action | G.find#Templates | research §4 |
| NewTemplate | dialog | Create or copy | name, channel, purpose, locale, source template | permission-filtered choices | G.create#Template | Odoo reusable mailing |

**Actions:** Use makes a draft send; Copy creates an unpublished template. Existing transactional
bindings and arbitrary body-screen templates are selectable only by their permitted callers; the
campaign editor does not gain infrastructure template control. **Needs:** MKT-TEMPLATE.

**Source:** research §4; Odoo Template Library, Frappe Email Template and framework EmailTemplate.

### TemplateDetail

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| TemplateHeader | single | Maintain reusable identity | name, channel, purpose, organization, locale, from/thru | typed kind | G.store#Template | EmailTemplate; research §4 |
| TemplateContent | single | Author safe reusable content | subject/preheader, body, text alternative, allowed variables and fallbacks | same editor as Compose | G.store#TemplateContent | Odoo templates; Frappe Email Template |
| TemplatePreview | display | Validate content | sample values, rendered output, missing variables, channel limits | synthetic test data | G.preview#Template | Twenty preview pattern |
| TemplateRelease | dialog | Start/end effective content | effective date, review, reason, expected stamp | confirmation | G.publish#Template, G.end#Template | Commons review and dated policy pattern |

Template publication does not authorize a send or overwrite content of existing recipient
executions. Shared template editing requires its own capability across Comms/Marketing mounts.
Keep user text blocks in existing Comms TextBlocks; selecting a block copies authored text and
never enrolls recipients. **Source:** research §§4, 10. **Needs:** MKT-TEMPLATE, MKT-APPROVAL.

### ExperimentDetail

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ExperimentSetup | single | Define the experiment | parent send, variants, total sample %, equal allocation, measure, observation period | sample-size/result preview | D.store#Experiment | Odoo A/B testing; research §2 |
| Variants | list, editable rows | Prepare compared messages | name, subject/body or sender variant, template, approval | preview/test per variant | D.store#ExperimentVariant | Odoo mailing variants |
| ExperimentResults | list, read | Compare observations | assigned, accepted, confirmed delivered, unique clicks, conversions, untracked | denominator labels | D.get#Experiment | Odoo mailing analysis |
| ReleaseWinner | dialog | Release the untouched remainder | winner, reason, excluded/suppressed since sample, remaining count | explicit approval/release | D.choose#ExperimentWinner, D.release#ExperimentWinner | Odoo winner action |

An experiment fixes the prepared audience and records one variant assignment per normalized
recipient. Sampling is stable across retry, disjoint between variants and disjoint from the
remainder; each recipient is sent at most one variant. The entered percentage is the **total**
sample across variants. Refuse a sample too small to allocate at least one recipient to each
variant and one to the remainder. Initial experiments compare two variants, with equal samples;
more variants are later. Scheduling either sample or remainder requires D and current approvals.

Default decision measure is observed unique click rate among accepted, tracking-enabled sample
recipients. The UI also shows raw denominators, tracking coverage, confirmed conversions and
observation age; it makes no statistical-significance claim. Open rate is informational, never
auto-selects the winner. After the configured observation period, a human explicitly chooses a
winner with a reason; ties, no observations or incomplete coverage remain reviewable. Withdrawal
or suppression excludes a remainder recipient at dispatch. A second winner release reuses the
same release identity, even with a new request key. **Needs:** MKT-EXPERIMENT, MKT-SEND, MKT-REPORT.

**Source:** research §2; Odoo A/B sample/variant/winner workflow.

### Delivery

This Marketing-owned execution projection is also mountable from Comms with organization/send
scope; it does not replace the personal mailbox's message reader or outbox.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| DeliveryFind | find | Narrow outcomes | send, variant, state, reason, period, channel | status chips | — | Odoo mailing traces |
| DeliveryRows | list | Inspect executions | masked recipient, queued/accepted/delivered/failed, latest event, attempts, reason | selected failures and detail links | D.find#Recipients | ContactListCommStatus; Odoo traces |
| RetryRecipients | list, bulk | Retry known failures | selected recipients, eligibility changes, count | result preview/confirmation | D.retry#Recipients | Odoo retry failed |

Transport acceptance, delivery, open and click are distinct facts; an open does not overwrite a
bounce state. Unknown outcomes have Reconcile, not Retry. Non-PII operators see opaque execution
identities/reasons and aggregate counts. **Source:** research §4. **Needs:** MKT-SEND, MKT-TRANSPORT.

### RecipientDetail

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Recipient | display | Explain selected identity and eligibility | topic, party/address, selected at, consent decision, variant, current state | authorized links | D.get#Recipient | native ContactListCommStatus; research §4 |
| Attempts | list, read | Inspect immutable transport facts | attempt, claim, submitted, provider/message ID, receipt, error, uncertain | chronological trace | D.get#Recipient | Odoo mailing trace |
| ResolveDelivery | dialog | Record authoritative recovery evidence | outcome, provider reference, evidence, reason, expected stamp | confirmation | D.reconcile#Recipient | new; fields here plus recipient, actor/time and operation key |

Reconciliation requires provider-query evidence or operator-confirmed investigation; it never
claims exactly-once SMTP delivery. Body access is separately controlled and token URLs/secrets are
redacted from logs and trace exports. **Needs:** MKT-SEND, MKT-TRANSPORT.

**Source:** research §4; Odoo per-recipient traces and current ContactListCommStatus.

## 6. Automation

### Automations

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| AutomationFind | find | Find sequences | campaign, state, owner, channel | — | — | ERPNext Email Campaign |
| AutomationList | list | Inspect enrollment work | name, state, active/completed/stopped, next due, failures | detail links | N.find#Automations | research §2 |
| NewAutomation | dialog | Start a sequence | name, campaign, topic, trigger, description | bounded trigger choices | N.create#Automation | ERPNext campaign schedules |

**Needs:** MKT-AUTOMATION. **Source:** research §2, ERPNext schedules and Frappe workflow run history.

### AutomationDetail

XML detail with Definition, Ordered steps, Simulation, Enrollments and History. States are proposed
Draft, Approved, Active, Paused and Ended. An active definition changes by effective-dated steps;
enrollments retain their definition's effective time. Editing does not rewrite existing executions.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| EnrollmentRule | single | Define admission and exit | trigger, source list/segment/form/event, topic, eligibility, goal, reentry | typed source/predicate picker | N.store#EnrollmentRule | ERPNext Email Campaign; Frappe workflow |
| Steps | list, editable rows | Author a bounded sequence | order, kind, template/channel, delay, condition, action on false | move up/down; typed form | N.store#Steps | ERPNext Campaign Email Schedule |
| Simulation | list, read | Explain a sample execution | sample input, step, eligibility, due time/zone, predicted action | dry run, no messages | N.preview#Automation | Frappe workflow trial run |
| EnrollmentList | list | Inspect participants | participant masked, admitted, step, due, state, stop reason | scoped detail link | N.find#Enrollments | Frappe Workflow Runs |
| AutomationControl | dialog | Approve/activate/pause/end | action, effective time, active/due counts, reason | confirmation | C.decide#MarketingApproval; N.activate#Automation, N.pause#Automation, N.end#Automation | research §2 |

First-release step kinds are Send email, Send SMS, Wait and Condition. Condition either continues,
skips the next send step or ends the enrollment; there are no loops or arbitrary jumps. A sequence
has a bounded maximum step count from configuration. Triggers are confirmed subscription, newly
eligible segment member, explicit published form submission, registration/attendance, or staff
enrollment with evidence. Segment admission runs on a scheduled difference scan. Source event IDs
and a unique automation/party/trigger identity prevent duplicate enrollments.

Default reentry is once per automation/party; a manager may configure once per new source event
with a cooldown, never concurrent active enrollments for the same topic/automation/party. Goal
conditions use the same allowlisted projections as segments. Unsubscribe, suppression, campaign
cancellation, goal completion or explicit stop ends pending promotional work. A channel-specific
withdrawal blocks that channel; a topic/global withdrawal stops the enrollment. Goal evaluation
and enrollment checks repeat before every step.

Waits are elapsed durations; optional business-day delays use the existing event calendar service
with explicit organization/holiday policy. Scheduling retains the rule's zone and uses the next
valid local instant across a DST gap; ambiguous times show the chosen offset before approval.
Profile quiet hours/frequency caps may postpone work, with a visible next-due time, never bypass
consent. Pause allows in-flight work to settle. Resume processes overdue work under current caps,
not as an unbounded burst. Send steps create ordinary CampaignSend/recipient executions so they
share approval, receipt, retry and suppression behavior. The automation approval authorizes only
its effective step content, sender, topic and eligibility rule; generated sends reference that
decision instead of requiring a human approval per participant. A changed template/profile or
policy that falls outside the decision pauses affected steps for renewed approval. **Needs:** MKT-AUTOMATION, MKT-SEND, MKT-APPROVAL.

**Source:** research §2; ERPNext Campaign Email Schedule and Frappe workflow simulation/run history.

### EnrollmentDetail

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Enrollment | display | Explain admission and current step | participant, source event, effective definition time, goal, state, next due | source access checks | N.get#Enrollment | ERPNext Email Campaign |
| StepHistory | list, read | Explain execution | step, evaluated time, condition result, send link, outcome | ordered trace | N.get#Enrollment | Frappe run history |
| StopEnrollment | dialog | End pending work | reason, pending steps, expected stamp | confirmation | N.stop#Enrollment | research §2 |

A completed send step is not replayed on restart; a stopped enrollment is not edited back to
active. An authorized new enrollment follows configured reentry and current consent.
**Needs:** MKT-AUTOMATION.

**Source:** research §2; ERPNext Email Campaign and Frappe Workflow Runs.

## 7. Promotions

### Promotions, PromotionDetail, PromoCodes and PromoCodeDetail — Context passed

Mount Commerce's canonical Shared promotion/code screens at the four paths in §2. Pass the
selected campaign, permitted stores, source return link and Commerce promotion capabilities.
Forms, registered service selection, parameters, product restrictions, batch code generation and
redemption history stay defined in [Commerce §7](design-commerce.md#7-promotions).

Marketing adds a campaign-link section through C.store#CampaignAssociation: campaign, promotion,
purpose and from/thru dates, with the same organization check. A link is attribution/planning
context, not another promotion rule, shared usage ceiling or authorization grant. Existing
`mantle.product.PromotionServices.apply#OrderPromotions`, `add#OrderPromoCode` and
`remove#OrderPromoCode` remain order/checkout actions, not Marketing edit-form calls. Promotion
evaluation remains distinct from the Products base-price resolver.

Codes keep Commerce's atomic committed-use rules. Campaign spend is not automatically equal to
discount face value; reporting shows discount adjustments separately from costs/revenue. A program
across stores, a shared redemption budget, loyalty points and referral rewards are later. Gift
cards remain Accounting liabilities; Marketing may link an authorized offer, never maintain a
parallel balance. **Source:** research §5; baseline ProductStore/Promotion and PromoCode forms.
**Needs:** MKT-CAMPAIGN; existing COM-PROMO and SHOP-CHECKOUT contracts are dependencies.

## 8. Content and tracking

### Content

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ContentFind | find | Find campaign assets | campaign, kind, author, review/publication state, scheduled period | scoped source choices | — | Odoo content curation; research §6 |
| CampaignContent | list | Inspect release readiness | title, kind, source, approved/public version, intended date, campaign | owner-app links | T.find#CampaignContent | research §6; WikiBlog metadata |
| LinkContent | dialog | Bind an existing asset | campaign, source kind/ID, use, intended date, owner | authorized page/blog/file selector | T.store#CampaignContent | new; fields here plus association ID, from/thru, expected stamp |

The list includes existing WikiBlog metadata and planned/approved pages, but it is not the full
Blog/Publishing article library. Creation of publications, article taxonomy and the full editorial
workspace remains the future PASS Publishing design. Marketing's first release can author landing
pages and Commons wiki content and link already authorized articles. **Needs:** MKT-CONTENT.

**Source:** research §6; Odoo content curation and current WikiBlog/WikiPage metadata.

### ContentDetail

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ContentLink | single | Maintain campaign use | campaign, source, purpose, intended date, effective dates | source record link | T.store#CampaignContent | research §6 |
| PublicationReadiness | display | Explain usable content | title/summary, review state, approved version, public binding, schedule, audience | read-only owner projection | T.get#CampaignContent | Commons review; PASS Forum §13.3 |
| Distribution | list | Connect content to delivery | send, template, list/topic, scheduled date, completion | create draft send | D.create#Send; T.get#CampaignContent | ContactListEmail/WikiBlogCategory hook |

Edit body opens the shared Knowledge mount; page properties open Commerce PageDetail. Request
review uses the existing wiki review flow; only the owner-approved version may be publicly bound.
A planned date is not a release instruction. Campaign sends neither set WikiBlog.publishDate nor
WikiPage.publishedVersionName. The existing WikiBlogCategory.sentDate is not a sufficient delivery
ledger for retries or multiple audiences; record content/send association and recipient outcomes.
Newsletter assembly chooses approved category content as of preparation and retains its source
version references. **Source:** research §§6, 12; PASS publishing contract.
**Needs:** MKT-CONTENT, MKT-SEND.

### LandingPages and PageDetail — Context passed

Mount Commerce Pages/PageDetail with permitted PublicSite, campaign content association, return
link and publication capabilities. Reuse its WikiPage body, version-bound page binding, sanitized
renderer, SEO fields, navigation and isolated previews. The shared page contract gains a typed
Marketing publication target for storeless campaign landing pages; the first release must not
require a ProductStore merely to collect a lead or subscriber. Existing Shop bindings retain their
store scope. A page embeds a published Marketing form/list/event component by registered ID,
never a raw service/entity endpoint. Theme editing stays Commerce-owned and needs its own grant.
**Source:** research §6; Commerce §5. **Needs:** MKT-CONTENT, MKT-PUBLIC.

### Knowledge — Context passed

Mount Commons Knowledge with the authorized wiki page/space, selected campaign content link and
existing wiki author/reviewer permissions. Use current `org.moqui.impl.WikiServices.get#WikiPageInfo`,
`update#WikiPage`, `request#WikiPageReview` and `decide#WikiPageReview` through the Commons owner.
Marketing cannot publish a private space merely by linking it. The existing terminal editor and
file access rules apply. Full WikiBlogs/EditWikiBlog baseline forms remain assigned to future
Publishing, not claimed by this context-only design. **Needs:** MKT-CONTENT, MKT-COLLAB.

### TrackingLinks

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| LinkFind | find | Find links | campaign, type, source, medium, active dates | typed filters | — | Odoo Link Tracker |
| LinkList | list | Inspect targets and observations | description, destination, campaign, code, visits/clicks | copy public URL/QR | T.find#TrackingLinks | native TrackingCode; research §9 |
| NewLink | dialog | Create a campaign link | description, registered destination, campaign, type, source, medium, content tag, dates | URL preview | T.store#TrackingLink | Odoo link builder |

**Needs:** MKT-TRACKING. **Source:** research §§6, 9.

### TrackingLinkDetail

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| LinkDefinition | single | Maintain target and validity | description, URL, campaign, type, group/subgroup, UTM fields, lifetimes, dates | explicit destination validation | T.store#TrackingLink | TrackingCode; Odoo Link Tracker |
| LinkOutput | display | Distribute the link | canonical public URL, QR, campaign/source labels | downloadable QR | T.get#TrackingLink | Odoo QR download |
| LinkObservations | list, read | Explain observations | period, unique observed clicks/visits, consent coverage, suspect automation | authorized aggregates | R.get#TrackingLinkResults | research §9 |

Use registered HTTPS destinations or same-site published paths, with a privileged external-domain
allowlist; public requests cannot supply an arbitrary redirect URL. Disabled/expired links show a
neutral unavailable state or their explicitly configured safe destination, not a caller-provided
fallback. Generic campaign links never contain party IDs. Personalized opaque link tokens carry
recipient/link scope through server lookup, are redacted from logs and expire under policy.

Tracking requires applicable tracking consent; a no-tracking recipient receives direct links and
no pixel. Public page visits honor site tracking choices independently of mailing consent. A
fetch by a scanner is not a form submission, consent grant, order or verified human conversion.
Store observed clicks separately from confirmed outcomes, identify known automated requests when
possible and label the residual uncertainty. Capture uses native TrackingCodeVisit/order/return
joins subject to their cardinality (§14); it never invents a full third-party analytics platform.
**Needs:** MKT-TRACKING, MKT-CONSENT, MKT-PUBLIC.

**Source:** research §§6, 9; Odoo Link Tracker/QR and native TrackingCode.

## 9. Events

### Events

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| EventFind | find | Find campaign events | campaign, date, host, registration state, location | date range | — | Odoo Events; research §7 |
| EventList | list | Inspect capacity and readiness | name, date/zone, confirmed/held/waitlisted, capacity, publication | list/calendar views | E.find#Events | Commons Calendar; Odoo event list |
| NewEvent | dialog | Create an event and campaign link | title, organization, campaign, calendar, start/end/zone, location | existing calendar controls | existing mantle.work.EventServices.create#Event; C.store#CampaignAssociation | Commons EventDetail |

**Actions:** New, Registration setup, Attendees and Check in. **Needs:** MKT-EVENT, MKT-CAMPAIGN.

**Source:** research §7; Odoo Events and Commons Calendar/MyCalendar NewEventForm.

### EventDetail — Context passed

Include Commons EventDetail, fixing WorkEffort WetEvent and campaign scope, with original calendar
visibility, recurrence, facilities, equipment and attendee permissions. Existing
`mantle.work.EventServices.check#EventAccess`, `update#EventOccurrence`, `cancel#EventOccurrence`,
`send#EventInvitations`, `respond#EventInvitation`, `book#Resource` and the WorkEffortParty operations
remain its services. Marketing adds tabs linking RegistrationSetup, Registrations and CheckIn,
not copies of the calendar forms. Event cancellation invokes the registration policy's cancellation
workflow once; attendee invitations are not paid-registration confirmations. Registration capacity
applies to a specific event occurrence; recurring series require explicit eligible occurrence
selection, never one seat count silently shared across every date. **Needs:** MKT-EVENT, MKT-COLLAB.

### RegistrationSetup

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| RegistrationPolicy | single | Define admission | occurrence, opening/closing dates, total seats, hold duration, waitlist, cancellation terms, public site | date-time and capacity preview | E.store#RegistrationPolicy | Odoo event; Frappe LMS batch |
| TicketTypes | list, editable rows | Offer free/paid places | ticket product, price source/currency, capacity, sales dates, per-order limit | product/server-search, authorized price explanation | E.store#TicketType | WorkEffortProduct; Odoo tickets |
| RegistrationQuestions | single | Choose shared questions | DbForm, effective time, attendee/buyer scope, required consent text | shared survey builder | E.store#RegistrationForm | ProductDbForm/OrderItemFormResponse; Odoo questions |
| EventCommunications | list, editable rows | Schedule relevant notices | trigger/offset, template, channel, recipient scope, transactional/promotional kind | preview recipients | E.store#CommunicationSchedule | Odoo event mail schedulers |
| PublishRegistration | dialog | Publish the reviewed offer | occurrence, site, readiness, terms, effective time | preview and confirmation | E.publish#Registration | Odoo website_event |

Free events need no store/order. Paid tickets use native ticket products and order lines with
WorkEffortProduct and OrderItemWorkEffort links; price, payment, tax and refunds use the Commerce/
Sales/Accounting authorities, not Marketing amount fields. Each attendee has an EventRegistration,
while one purchaser/order can cover multiple attendees. A form response belongs to that attendee
registration; payer data and one order-line answer cannot stand in for every attendee.

A held/confirmed place consumes both occurrence and ticket capacity atomically. Unique reservations
and consistent locks enforce capacity across staff and public callers. Waitlist entries consume no
seat and advance in requested-time/ID order; promotion offers have an expiring hold. Reducing
capacity below held+confirmed is refused. Payment acceptance confirms exactly the held allocation;
a late success after expiry enters paid-unallocated review/refund, never oversells the event.
Changes to sold terms preserve the accepted effective policy; materially changed event dates notify
registrants and offer the configured cancellation path. **Needs:** MKT-EVENT, MKT-FORMS, MKT-PUBLIC.

**Source:** research §7; Odoo tickets/questions/mail schedulers, Frappe LMS batch and native event/product/order joins.

### Registrations

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| RegistrationFind | find | Find attendees | event/occurrence, ticket, state, buyer/attendee, paid, checked in | scoped search | — | Odoo attendees |
| Attendees | list | Operate attendance | attendee, ticket, hold/confirmed/waitlisted, payment state, checked-in time | phone columns, row actions | E.find#Registrations | Odoo registration desk; research §7 |
| StaffRegistration | dialog | Enter a registration | occurrence, ticket, attendee, buyer, questions, consent choices | same capacity/price preview | E.reserve#Registration, E.confirm#Registration | Dolibarr attendee form |
| RegistrationBatch | list, bulk | Notify or cancel selected attendees | action, selected IDs, reason, impact counts | confirmation/results | E.change#Registrations | research §7 |

Marketing messages use promotional consent; receipt, schedule-change and cancellation notices use
registration authority and cannot carry unrelated promotions. Staff entries follow the same holds,
consent and payment checks as public entries. **Needs:** MKT-EVENT, MKT-CONSENT.

**Source:** research §7; Odoo attendees and Dolibarr event registration.

### RegistrationDetail

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Registration | display | Explain entitlement | attendee/buyer, occurrence, ticket, accepted terms, seat state, payment, source | native order/payment links by rights | E.get#Registration | Odoo registration; Frappe LMS enrollment |
| Answers | display | Read submitted answers | form/effective time, answers, consent evidence | shared historical response renderer | F.get#Response | DbForm and FormResponse |
| Attendance | list, read | Inspect check-in history | actor, time, action, credential revision, correction reason | audit timeline | E.get#Registration | Odoo desk; Frappe attendance |
| RegistrationChange | dialog | Cancel or request correction/refund | action, reason, capacity/payment impact, expected stamp | confirmation | E.cancel#Registration, E.correct#Registration | research §7 |

Cancellation releases capacity once. A refund request is handed to the existing financial service
and stays pending until its result; a cancelled registration does not imply refunded money.
Attendee substitution requires explicit permission, updates the entitled party, revokes old entry
credentials and records the reason; no silent overwriting of historical check-in. **Needs:** MKT-EVENT.

**Source:** research §7; Odoo registration record and Frappe LMS enrollment/attendance.

### CheckIn

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| EntryLookup | single | Locate the entry credential | selected event/occurrence, scanned code or attendee lookup | keyboard/scanner input; optional camera | E.preview#CheckIn | Odoo registration desk |
| EntryDecision | display | Explain eligibility | attendee, ticket, event, confirmed/paid/used/cancelled | clear eligible/blocked state | E.preview#CheckIn | research §7 |
| RecordEntry | single | Confirm attendance | registration, credential, expected stamp, operation key | primary Check in | E.checkIn#Registration | Odoo barcode check-in |

Check-in is online in the first release; offline mode is explicitly deferred. Duplicate scans
return the first attendance result. Wrong-event, cancelled, expired or unconfirmed tickets cannot
enter; manager overrides require a reason and never fabricate payment. TUI supports typed/scanned
codes; phone layout shows the action and attendee without horizontal scrolling. **Needs:** MKT-EVENT.

**Source:** research §7; Odoo registration desk/barcode interaction.

## 10. Surveys, leads and engagement

### Surveys and SurveyDetail — Context passed

Commons owns one DbForm survey builder. Its current canonical form summaries are Customer Service's
FeedbackForms/FeedbackFormDetail in [§9](design-customer-service.md#feedbackforms); Marketing mounts
them at the two paths in §2 with organization, marketing purpose, author/read grants and campaign
return link. Keep NewSurveyForm, SurveyList, EditSurveyForm, group grants, fields, options and
preview behavior from the SimpleScreens Survey baseline. The Marketing default is an empty survey,
not Customer Service's required CSAT scale. Existing
`org.moqui.impl.ScreenServices.update#DbFormField` and `delete#DbFormField` are used only through
the shared guarded definition service; answered fields/options are ended rather than deleted.

Published fields/options/dependencies are effective-dated; responses read the form as of submission.
There is no cloned DbForm per version. Public conditions are typed, bounded, cycle-checked and
re-evaluated server-side, never the arbitrary script expression allowed by a legacy internal form.
Sections, public sharing, safe conditions and optional numeric scoring are shared form-engine needs,
not a second Marketing form schema. Explicit numeric option-score mapping supports survey summary scoring: sum the selected option
values for answered scored questions, show the answered-question count and available maximum
separately, and leave unscored/unanswered questions out rather than treating them as zero. Negative
or multi-select scores require declared aggregation limits in the shared form definition;
certification, timed exams, random quizzes and live sessions are later People/Commons capabilities.
**Source:** research §8; baseline Survey forms. **Needs:** MKT-FORMS; shared CS-FEEDBACK/CS-FORM-ELEMENTS.

### SurveyDistribution

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| FormPublication | single | Configure campaign distribution | form, purpose survey/lead/registration, campaign, site, open/close, anonymous/invited/account, repeat policy | typed publication policy | F.store#Publication | Frappe Web Form; research §8 |
| FormSharing | display | Review public presentation | title/intro, effective form, completion message, canonical URL/QR, consent text | isolated preview and public-link copy | F.preview#Publication | Nextcloud Forms sharing |
| PublishForm | dialog | Open or close submissions | effective date, readiness, response policy, expected stamp | confirmation | F.publish#Publication, F.close#Publication | Dolibarr OpenSurvey |
| Invitations | list | Distribute eligible invitations | send, topic, invitation count, delivered/responded, expires | create send from audience | F.create#Invitations, D.create#Send | Odoo survey Share |

Invitations use scoped opaque capabilities; anonymous public forms disclose no response list or
party search. Anonymous repeat policy can limit a session/token, but does not claim to identify
unique people. A one-response-per-person requirement selects invited or verified-account access.
Marketing invitations require promotional eligibility unless the form is a specific transactional
registration/service follow-up. Field publication does not authorize direct entity writes.
**Needs:** MKT-FORMS, MKT-PUBLIC, MKT-CONSENT.

**Source:** research §8; Frappe Web Form gating, Nextcloud sharing/QR and Odoo survey Share.

### Responses and ResponseDetail — Context passed

Mount the Commons-owned response list/detail/statistics vocabulary, initially described by Customer
Service's SatisfactionResults and ResponseDetail, with Marketing publication/campaign scope instead
of case scope. F.find#Responses, F.get#Response and F.get#ResponseStats guard existing
`org.moqui.impl.ScreenServices.get#FormResponse`, `get#FormResponseStats` and authorized FormResponse
queries. Display publication, form/effective time, submitted date, invited/responded denominators,
answers and authorized attribution. A response may remain anonymous; a marketing grant cannot be
inferred from the answers or from a typed email address.

Response correction/withdrawal retains an audit and superseding result, applying the shared form
history contract. Existing `update#FormResponse`/`delete#FormResponse` must refuse direct mutation
of linked published responses except the governed correction/retention path, also when called
outside Marketing. No case feedback becomes visible through a Marketing form mount merely because
the same DbForm is reused. **Source:** research §8; all Survey response/stat forms.
**Needs:** MKT-FORMS, MKT-REPORT, MKT-ACCESS.

### Leads — Context passed

Mount Sales Leads with authorized campaign/source filters and the user's Sales visibility. Columns
emphasize source form/event/send, intake date, qualification state and owner; actions remain Sales'
lead/opportunity actions. MARKETING_VIEW alone gives aggregate handoff counts, not a pipeline or
account-edit grant. Leads use Sales' proposed `mantle.sales.OpportunityServices`; no Marketing lead
entity duplicates SalesOpportunity. A successful qualification is not a newsletter subscription.
**Source:** research §§9, 11; Sales §3. **Needs:** MKT-LEAD, MKT-REPORT.

### LeadRules

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| LeadRuleList | list | Inspect capture routing | source kind/record, campaign, trigger, team/queue, effective dates, enabled | scoped source links | F.find#LeadRules | Odoo event_crm and survey_crm |
| LeadRule | single | Define explicit interest handoff | registration/submission/attendance trigger, allowed condition, Sales source, team/queue, field mapping, consent text | published-field allowlist | F.store#LeadRule | Frappe CRM Forms; research §§7, 9 |
| LeadRulePreview | list, read | Explain prospective routing | source sample, mapped values, duplicate outcome, target queue, reason | synthetic or authorized sample | F.preview#LeadRule | Frappe workflow trial run |
| ReprocessCapture | dialog | Retry failed handoff | failed source IDs, target, counts, reason | confirmation/results | F.process#LeadCaptures | new; fields here plus rule effective time and operation key |

One durable capture result per rule/source event prevents duplicate leads on resubmission or job
retry. Match through Sales' authorized duplicate policy; a conflict becomes a Sales review item,
not an automatic merge or disclosure to the public visitor. Failed handoff leaves a successful
form/registration intact and is retryable independently. Only explicitly published inquiry fields
enter Sales; sensitive survey answers do not enter a lead by default.

Marketing's first release advances the shared public lead-intake capability that Sales §11 leaves
later for its standalone app. Reuse proposed `mantle.sales.OpportunityServices.store#LeadIntake`
and `mantle.order.SalesPortalServices.submit#LeadIntake` for the Sales-owned definition/submission
boundary, extended to accept a validated Marketing publication/source. Marketing owns distribution
and rule scheduling; Sales owns opportunity creation, routing, duplicate policy and outcomes.
**Needs:** MKT-LEAD, MKT-FORMS, MKT-PUBLIC; SAL-CRM/SAL-LATER intake dependency.

**Source:** research §§7, 9; Odoo event_crm/survey_crm rules and Frappe CRM public forms; shared Sales intake.

### Customer360 and ContactDetail — Context passed

Use crosscut Customer360 with Engagement primary: campaigns, list/segment membership, sends and
observed engagement, survey submissions, registrations, promotion use and consent. W.get#Engagement
returns only source-authorized facts; lists/segments alone never grant read access to finance or
Sales records. With no source grant show the authorized aggregate or omit the region. Native
`mantle.party.ConsentServices.get#PartyConsentState` supplies the consent projection after scope
checks; Edit consent links to Marketing's Comms mount. ContactDetail mounts Commons' normal contact
form with Add to list invoking the evidenced subscription request, not raw member creation. Native
`mantle.party.PartyServices.update#PartyDetail` and `create#PartyContent`, and
`mantle.party.ContactServices.get#PartyContactInfo`, `store#PartyContactInfo`, `store#PartyContactMech`
and `delete#PartyContactMech` retain the shared party-write/file permissions. Baseline contact,
channel-purpose, expired-channel and relationship forms are inherited rather than redesigned.

Tracking refusal removes tracking observations, not the basic fact that an authorized send was
attempted. Contact/party merges use Commons/Mantle duplicate services extended to preserve new
Marketing execution/consent links and exclusions; Marketing's list merge does not merge parties.
**Source:** research §11; crosscut §§3.1–3.2. **Needs:** MKT-REPORT, MKT-CONSENT, MKT-COLLAB.

## 11. Reports

### Reports

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ReportCatalog | list | Select a report | report name, description, available scope/readiness | links to reports below | R.get#ReportCatalog | Sales Reports; research §9 |
| ReportDefaults | find | Carry common context | organization, date range, campaign, currency, as-of | date-period | — | shared report options |

Marketing supplies read models and widgets that Insights can consume; it does not require the
future Insights app for these operational reports. All reports offer accessible tables, charts
when existing widgets suffice and exports from the identical authorized query. No arbitrary pivot
query engine is introduced. **Needs:** MKT-REPORT.

**Source:** research §9; Odoo reporting hubs and ERPNext Campaign Efficiency.

### CampaignPerformance

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| PerformanceFind | find | Define the comparison | organization, campaigns, period, currency, include children, as-of | explicit basis labels | — | research §9 |
| Performance | list, read | Compare plans and facts | budget/estimate/actual, distinct reach, accepted sends, leads, orders, invoiced net | source drill-down; grouped currency | R.get#CampaignPerformance | Odoo campaign counters; ERPNext Campaign Efficiency |
| PerformanceChart | display | Show changes over time | period, sends, confirmed leads/orders, costs | table-backed chart | same report result | research §1 |

`numSent` summarizes transport-accepted promotional recipient executions, excluding tests and
transactional receipts; distinct people/destinations is a separate reach metric. `qualifiedLeadCount`
summarizes unique Sales-confirmed lead qualifications, not clicks and not the legacy id-typed
`convertedLeads` field.
Parent rollups count each descendant source once. ROI is shown only with defined net revenue and
reconciled cost in the same currency; zero/missing cost produces unavailable ROI, not infinity.
**Needs:** MKT-REPORT, MKT-CAMPAIGN.

**Source:** research §§1, 9; Odoo campaign CRM/Sales counters and ERPNext Campaign Efficiency.

### DeliveryAnalysis

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| DeliveryCohort | find | Choose an execution cohort | prepared/released period, channel, send, variant, profile | send-time versus event-time selector | — | Odoo Mailing Analysis |
| DeliveryMeasures | list, read | Explain outcomes | prepared, eligible, attempted, accepted, confirmed delivered, failed, uncertain, withdrawn | explicit denominators | R.get#DeliveryAnalysis | Odoo traces; Twenty counters |
| EngagementMeasures | list, read | Show observed engagement | tracking-enabled accepted, observed unique open/click, confirmed conversion, suspect automation | coverage label | same report result | research §4 |

An accepted result is transport acceptance; confirmed delivered requires a receipt and may be
unavailable for SMTP. Delivery rate is confirmed-delivered / accepted with receipt-coverage shown;
open/click rate uses accepted tracking-enabled recipients. Null/unavailable is distinct from zero.
One recipient counts once for unique engagement regardless of retries/events. SMS has no open
rate. Event-time reports can show late receipts; send-cohort reports reconcile back to the same
recipient set. **Needs:** MKT-REPORT, MKT-TRACKING.

**Source:** research §§4, 9; Odoo Mailing Analysis and Twenty delivery counters.

### AudienceGrowth

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| AudiencePeriod | find | Choose membership scope | list/topic, purpose, channel, period, organization | explicit as-of boundaries | — | Odoo Opt-Out Report |
| AudienceChanges | list, read | Reconcile the population | opening accepted, grants, withdrawals, expiries, closing accepted, pending, suppressed | movement drill-down | R.get#AudienceGrowth | research §§3, 9 |

Membership and suppression are separate measures. A list merge is a movement, not net audience
acquisition; a double opt-in request is pending, not a subscriber. Organization-wide reach deduplicates
contacts and does not sum membership counts across lists. **Needs:** MKT-REPORT, MKT-CONSENT.

**Source:** research §§3, 9; Odoo Opt-Out Report and native dated membership/consent.

### Attribution

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| AttributionBasis | find | Choose the outcome basis | campaigns, outcome type, event period, currency, primary/influenced, as-of | explicit labels | — | Odoo campaign CRM/Sales links |
| OutcomeRows | list, read | Reconcile each outcome | outcome, primary campaign/source, evidence time, amount/currency, refund/credit, missing attribution | permission-filtered source links | R.get#Attribution | native SalesOpportunityTracking and TrackingCodeOrder |
| AttributionSummary | display | Show nonduplicated totals | leads/qualifications, orders, invoiced net, returns/credits, unattributed | table-backed chart | same report result | research §9 |

First-release attribution is **recorded primary source**, with secondary influence listed separately.
An explicit validated form/event source sets the opportunity's primary campaign at capture. At order
placement, choose the most recent eligible consented tracking touch within its trackable lifetime;
ties use tracking code ID. If none exists, use the explicit source opportunity's campaign. Persist
the decision and its evidence time; later campaign/link edits do not rewrite accepted outcomes.
Staff correction requires a reason and an audited successor decision. Affiliate billable lifetime
and `isBillable` remain separate from this marketing credit, never imply an affiliate payment.

Respect TrackingCodeOrder's existing one-row-per-order/type key; do not write multiple rows to
simulate multi-touch. Proposed MarketingOutcomeLink records the single primary reporting campaign
for each outcome and its evidence, while existing native tracking rows retain type-specific facts.
Invoice-line attribution follows native order-item allocations; refunds/credits reduce the linked
source once. Split lines allocate their amounts once, with rounding in source currency and a
reconciled residual. Orders, invoiced revenue and receipts are separate measures, never summed.
Storeless orders remain eligible. Unknown consent/identity produces unattributed outcomes rather
than inferred cross-device joins. Currency totals are grouped unless an explicit reporting currency
and documented exchange-rate date are selected. **Needs:** MKT-TRACKING, MKT-REPORT.

**Source:** research §9; Odoo campaign lead/quotation/invoice links and native SalesOpportunityTracking/TrackingCodeOrder.

## 12. Settings

### Settings

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| SettingsIndex | list | Find owned/shared configuration | category, owner, readiness, authorized link | app-independent mounts | W.get#Settings | crosscut shared configuration |

Links to CampaignDefaults, Vocabularies, LeadSources, SendingProfiles, Templates, Consent and
Suppressions. Infrastructure configuration links to Admin under its own permission. Marketing
can mount shared settings without another app's launcher grant. **Needs:** MKT-ACCESS.

**Source:** research §10; shared configuration ownership in crosscut §5.

### CampaignDefaults

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| MarketingPolicy | single | Set organization defaults | currency source, default roles, consent policy, approval/separation policy, audience limit, retention, frequency caps | effective dates; policy explanation | C.store#MarketingPolicy | native campaign defaults; shared policy pattern |
| PolicyPreview | display | Explain impacts | affected drafts/approvals, missing prerequisites, effective date | bounded preview | C.preview#MarketingPolicy | Accounting effective policy pattern |

Approval thresholds may choose assigned approvers; all live promotional sends require approval,
including the defined content of automated steps. Admin cannot relax withdrawn consent or provider
suppression. Unknown data defaults to review. Retention settings distinguish recipient/address
information, aggregate statistics, consent evidence and financial/registration sources; expiry jobs
remove/anonymize eligible data without corrupting required native source records. **Needs:** MKT-APPROVAL, MKT-CONSENT.

**Source:** research §§2, 10; native campaign budget/lifecycle fields and the shared effective-policy pattern.

### Vocabularies

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Vocabulary | list, editable rows | Offer shared values | kind, code, label, channel, organization, sequence, from/thru | closed kinds | C.store#Vocabulary, C.find#Vocabulary | native enums; Odoo UTM dictionaries |

Use existing ContactListType and TrackingCodeType enumerations, with dated organization bindings
for offered values. UTM medium/source/content tags are explicit fields/bindings, not overloaded
TrackingCode.groupId/subgroupId; preserve those native fields. Seeded lifecycle IDs are not editable
labels pretending to define a new workflow. **Needs:** MKT-CAMPAIGN, MKT-TRACKING.

**Source:** research §§9–10; Odoo UTM dictionaries, native ContactListType/TrackingCodeType and Sales lead sources.

### LeadSources — Context passed

Mount Sales LeadSources, preserving its single editor and effective organization/source bindings.
Marketing offers permitted campaign/TrackingCode references, and the shared Sales source editor
supplies permitted Sales lead sources. Campaign dictionaries never create duplicate Sales sources
by matching labels. **Source:** research §§9–10; Sales §9. **Needs:** MKT-LEAD.

### SendingProfiles

Comms owns this shared business settings surface; this section defines its additional form summaries.
Admin alone manages domains, DNS, relay/gateway credentials, callback endpoints and secrets. A profile
refers to operator-approved infrastructure and exposes readiness, not editable secrets or host URLs.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Profiles | list | Inspect approved senders | name, channel, sender, organization, purpose, readiness, limits | readiness details | G.find#SendingProfiles | Twenty emailing domains; Comms identities |
| SendingProfile | single | Bind permitted business use | name, organization, channel, infrastructure binding, sender/reply-to, purpose, throttle, quiet hours/zone, tracking policy, dates | allowlisted infrastructure choice | G.store#SendingProfile | research §10 |
| SenderReadiness | display | Explain dispatch blockers | domain/sender verification, transport available, receipt support, unsubscribe endpoint, permitted site, last check | refresh through Admin-owned checker | G.check#SendingProfile | Twenty DNS verification |

Unverified or unavailable channels cannot release live sends. Email supports configured direct SMTP
or relay through existing framework transport; the domain/signing/readiness checks are a framework/
Admin extension, not an assumption that a configured From is verified. SMS requires a real framework
adapter, canonical phone normalization, segment/cost estimation, receipt verification and STOP-style
withdrawal mapping. Country code comes from the actual address/configuration, not the stub's default.
Provider selection is deployment configuration; this design imposes one channel contract rather than
a mandatory vendor. **Needs:** MKT-TRANSPORT, MKT-CONSENT, MKT-TEMPLATE.

**Source:** research §10; Twenty sending-domain readiness and shared Comms sender configuration.

## 13. PASS Marketing participation

### 13.1 Mount and public boundary

Register proposed PASS app `Marketing` with an internal-organization target under PublicSiteApp,
using the existing PublicApps registry and readiness model. A site can enable it without Forum,
Shop, Publishing or BOSS. Each public record also needs an explicit site/publication binding and
opening interval; ContactList.isPublic, an event's calendar visibility or a WikiPage publication
alone does not expose a registration/form/list to the internet. Public pages use accessible HTML
and share the existing PASS local/remote `pass.Facade.call#Operation` path and allowlisted schemas.

Proposed operations are `marketing.getPublication`, `marketing.requestSubscription`,
`marketing.verifySubscription`, `marketing.getPreferences`, `marketing.applyPreferences`,
`marketing.getForm`, `marketing.submitForm`, `marketing.getEvent`, `marketing.reserveRegistration`,
`marketing.completeRegistration`, `marketing.startRegistrationPayment`, `marketing.getRegistration`, `marketing.cancelRegistration` and
`marketing.getPaymentResult`. They map to P in §14.2. Marketing landing-page rendering uses the
shared registered page renderer. Tracking redirect/pixel and signed provider callbacks are narrow
registered HTTP handlers, not an unrestricted facade operation or a BOSS screen.

The authority derives organization, site, allowed form fields, campaign and destination from its
publication/credential. Requests never select arbitrary party IDs, service names, backend URLs,
email templates or native entity writes. Registered deployment authentication protects remote
operations, while public publication/token/account authority protects each action. Host/canonical
URL checks, rate limits, request keys, safe assets, neutral receipts and source-scoped capabilities
reuse PASS. Bearer GET is read-only; scanners cannot confirm subscription or consume tickets.

### Subscribe and VerifySubscription

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| SubscriptionRequest | single | Request published subscriptions | address, display name optional, offered topic choices, channel/purpose consent, request key | accessible choices | P.request#Subscription | research §3; ridgecrest mailing lists |
| SubscriptionReceipt | display | Acknowledge without enumeration | neutral confirmation instructions | no membership/address echo | same result | existing unsubscribe privacy pattern |
| VerifyIntent | single | Confirm the requested choices | token, masked destination, topics, consent text, action | explicit Confirm button | P.get#SubscriptionRequest, P.verify#Subscription | double opt-in statuses |

The request makes an expiring hashed SubscriptionRequest token and pending membership, not an
accepted subscriber. Confirmation checks purpose, address, list, site and request identity, records
new evidence and accepts only the requested topics. Replays return the same result without
resending or regranting a later withdrawal; a new request is needed after withdrawal. Existing
`optInVerifyCode` alone is not exposed as a durable public bearer secret. Confirmation messages
are rate-limited verification traffic, not a way to send arbitrary promotional content.
**Needs:** MKT-AUDIENCE, MKT-CONSENT, MKT-PUBLIC.

**Source:** research §3; double opt-in list statuses and ridgecrest public mailing-list subscription; existing consent-token patterns.

### Preferences — Context passed

Reuse existing unsubscribe token semantics and `mantle.party.ConsentServices.check#UnsubscribeToken`,
`resolve#UnsubscribeToken`, `apply#UnsubscribePreferences` and `unsubscribe#ContactListParty` through
the registered PASS operations. The existing `/u/<token>` and one-click POST continue to work;
Marketing messages use operator-configured canonical public routes. Extend organization/topic/channel
scope for SMS and configured Marketing policy without invalidating legacy email tokens. GET reveals
only a masked destination and offered preferences, never grants or withdraws consent. One-click
POST is idempotent and takes effect immediately. A pending confirmation-based legacy unsubscribe
already blocks dispatch. These operations never leave a Forum/MAILBOX membership on the recipient's
behalf. **Source:** Comms §16; current ConsentServices. **Needs:** MKT-CONSENT, MKT-PUBLIC.

### SubmitForm

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| PublicForm | single | Submit permitted answers | publication, invitation/account when required, visible fields, separate consent choices, request key | server-rendered safe DbForm | P.get#Form, P.submit#Form | Frappe Web Form; Nextcloud Submit |
| FormReceipt | display | Acknowledge submission | opaque receipt, configured next step | neutral receipt, safe registered URL | same result | research §8 |

Server checks publication/effective form, size/types, required and hidden fields, response/repeat
policy and request identity. Hidden answers are discarded/refused rather than trusted; no expression
from the browser executes. An email field does not identify an existing Party without verification.
Lead handoff and optional follow-up subscription run as separate, replay-safe effects after response
acceptance. **Needs:** MKT-FORMS, MKT-LEAD, MKT-PUBLIC.

**Source:** research §§6, 8; Frappe Web Form and Nextcloud public Submit.

### Event

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| PublicEvent | display | Present the published offer | title, approved description, dates/zone, location, ticket prices/currency, availability, terms | accessible ticket choices | P.get#Event | Odoo website_event; research §7 |

No staff attendee list, private calendar resources or internal campaign budget is public. Availability
is advisory until reservation. **Needs:** MKT-EVENT, MKT-PUBLIC.

**Source:** research §7; Odoo website_event and Frappe LMS published batches.

### Register

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| RegistrationChoice | wizard step | Request places | published occurrence/ticket, quantity, attendee details, buyer, request key | price/seat preview | P.reserve#Registration | Odoo tickets; Frappe batches |
| RegistrationAnswers | wizard step | Accept terms and answer | required questions per attendee, accepted terms, optional marketing choices | safe shared form | P.complete#Registration | ProductDbForm and research §7 |
| RegistrationPayment | wizard step | Pay the held order | hold expiry, native order, amount/currency, configured gateway | existing hosted/tokenized payment flow | P.start#RegistrationPayment, P.get#PaymentResult via E.start#RegistrationPayment and native financial services | Shop/Accounting payment contracts |
| RegistrationReceipt | display | Explain the result | opaque registration reference, pending/confirmed/waitlisted, next step | capability link | P.get#Registration | research §7 |

A browser success redirect never confirms payment; the authority's verified financial result does.
Free registration confirms atomically with capacity; paid registration uses the native order and
payment operation identity. A user can refresh/retry without a second charge or seat. Verification
of attendee address can be required by publication policy; payment alone does not prove control of
all attendee addresses. **Needs:** MKT-EVENT, MKT-PUBLIC.

**Source:** research §7; Odoo event tickets, Dolibarr public registration and native order/form records.

### Registration

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| MyRegistration | display | Inspect the permitted attendee/order view | event, ticket, attendee, entry credential, state, cancellation terms | downloadable ticket/receipt | P.get#Registration | Odoo event registration |
| CancelRegistration | single | Request permitted cancellation | registration capability, reason, refund expectation, request key | explicit confirmation | P.cancel#Registration | research §7 |

Use verified account ownership or an ExternalAccess capability scoped to registration and action.
Buyer access to an order does not reveal another attendee's private survey answers. Entry credentials
are opaque, revocable and event-bound. Expired/unknown capabilities return the same unavailable
response; staff correction remains an internal action. **Needs:** MKT-EVENT, MKT-PUBLIC.

**Source:** research §7; Odoo attendee receipt and shared PASS source-bound access.

## 14. Data, service and shared-screen contracts

### 14.1 Existing foundations and proposed additions

Existing definitions were checked in Mantle MarketingEntities, PartyEntities, WorkEffortEntities,
SalesEntities, OrderEntities and ProductStoreEntities, framework ScreenEntities/ResourceEntities,
and their current service XML. Native campaign statuses are `MKTG_CAMP_PLANNED`,
`MKTG_CAMP_APPROVED`, `MKTG_CAMP_INPROGRESS`, `MKTG_CAMP_COMPLETED`, `MKTG_CAMP_CANCELLED`.
Native membership states remain `CLPT_PENDING`, `CLPT_ACCEPTED`, `CLPT_REJECTED`, `CLPT_IN_USE`,
`CLPT_INVALID`, `CLPT_UNSUBS_PENDING`, `CLPT_UNSUBSCRIBED`. None is repurposed as a send state.

New business artifacts belong in Mantle, not BOSS entities. Names in this table are proposed;
normal audit fields are implicit. Effective-dated configuration uses the project's from/thru and
audit-log pattern. A stored execution/content reference identifies an actual decision or send;
there is no parallel Marketing version/snapshot system for configuration history.

| Artifact / owner | Essential identity, fields and relationships | Invariants / purpose |
| --- | --- | --- |
| MarketingCampaign and MarketingCampaignParty, extended | Existing campaign fields; seeded organization/manager/contributor roles and audited key fields | Exactly one effective organization; parents and associations share authorized scope; native lifecycle retained |
| MarketingPolicy / MarketingVocabulary | organization, policy/value kind, effective interval, declared settings | Policy resolution is explicit, historical and permission checked; no deployment credentials |
| CampaignAssociation | campaign, typed source kind/ID, purpose, from/thru, actor | Links permitted promotion, event, form, segment/list and source records; validates target organization; does not override source authority |
| CampaignCost | cost ID, campaign, source type/line or manual evidence, amount/currency, rate/date, reversal link | Independent expense allocation facts; source allocation cannot be counted twice |
| MarketingDecision | decision ID, target kind/ID and effective stamp, decision, policy effective time, actor/time/reason | Approval facts survive invalidation; campaign/send/automation approval are distinct purposes |
| ContactList / ContactListParty / ContactListEmail, extended | Existing identities; organization-scoped marketing policy and dated template/topic bindings | Preserve MAILBOX/Forum semantics; distinguish subscription intent from membership administration; do not send from raw auto-services |
| SubscriptionRequest | request ID, site/list/party-or-provisional-address, channel/purpose, evidence/text reference, token digest, requested/expired/confirmed times, request key | Address-bound double opt-in; expiry/replay protected; provisional identity not publicly enumerable |
| AudienceImport and item results | import ID, organization/list, staged-file reference/hash, mapping/evidence, expiry; row number and result | Resumable import facts; per-row idempotence, confidential error downloads and retention |
| MarketSegment and rule entities, extended | Existing hierarchy/native criteria; dated kind/filter and explicit include/exclude membership | Typed bounded conditions, organization-scoped evaluation; native product/price segment uses remain compatible |
| PartyConsent, extended | Existing party/address/list/purpose/evidence; add explicit organization scope where required by marketing policy | Legacy global withdrawals remain blocking; scoped grants cannot cancel a global withdrawal; scope migration/adoption is explicit |
| MarketingSuppression | suppression ID, organization/profile scope, normalized destination key, channel, reason, source event, from/thru, reviewer evidence | Independent of membership; complaints/hard bounces require review to end; no raw address in generic logs |
| MessageTemplate / MessageSendingProfile | template/profile ID, organization, channel/purpose, effective dates, safe content/variable fields, EmailTemplate or operator binding | Comms-owned configuration; binds existing email infrastructure and new SMS adapter; no arbitrary executable template fields |
| CampaignSend | send ID, campaign, topic list, channel, name, sender/profile, schedule/zone, effective content/policy reference, rendered resource, state, approval decision | One prepared promotional delivery intent; immutable content once attempted; operator release is separate from approval |
| CampaignRecipient | recipient ID, send, party/contact mechanism and normalized destination, selected time, variant, tracking policy, eligibility/state, next attempt | Unique send/channel/destination; recipient execution is a fact, not mutable live query membership |
| CampaignDeliveryAttempt / CampaignDeliveryEvent | recipient/attempt ID, stable transport key, claim lease, submitting/result times, provider/message ID, outcome; unique provider event identity | Durable execution and receipt facts; uncertain submission never auto-retries; out-of-order receipts are reconciled without state regression |
| CampaignExperiment / CampaignExperimentVariant | experiment ID/send, sample %, measure/window, chosen variant/release; variant ID, approved content reference | One assignment per recipient and one winner release; variant content uses the same send/template history rules |
| MarketingAutomation / MarketingAutomationStep | automation ID/campaign/topic, effective admission/goal/reentry policy; step order, kind and typed payload with dates | Ordered bounded steps; no scripts, cycles or arbitrary branches; activation approved at an effective time |
| AutomationEnrollment / AutomationStepExecution | enrollment ID/party/source-event/effective definition, current step/state; unique enrollment+step execution and send-recipient link | Independent runs and effects survive restart; once-per-source admission and no repeat completed step |
| CampaignContent | campaign-content ID, campaign, typed WikiPage/WikiBlog/page/file reference, use, intended date, from/thru | Content body and publication stay with their owner; distribution joins to actual CampaignSend |
| MarketingCampaignContent / CampaignSendContent / EventRegistrationContent | host ID plus content ID/type, resource reference, from/thru and audit fields | Native-style host file associations for shared RecordFiles; campaign asset planning stays CampaignContent |
| TrackingCode, extended; MarketingTrackingEvent | Native redirect/campaign/type/lifetimes, typed UTM fields and organization; event ID, code/recipient when permitted, timestamp, observed kind and automation evidence | Native visit/order/return joins retained; consent-aware observations are distinct from confirmed outcomes |
| MarketingOutcomeLink | organization/outcome type/native key/model key, primary campaign, evidence source/time, decision/correction metadata | One primary credit per outcome; source allocations and native order/invoice links prevent duplicate revenue |
| EventRegistrationPolicy / EventTicketType | event occurrence, effective offer/terms, site, registration window, capacity/hold/waitlist, ticket product and pricing source | One authoritative capacity domain per occurrence and per ticket; accepted terms referenced by registrations |
| EventRegistration | registration ID, occurrence/ticket, attendee/buyer party, hold expiry/state, native order/item/payment references, source campaign, response ID, entry credential digest/revision | Attendee identity separate from payer/order; unique source/request allocation; financial facts remain in native records |
| EventRegistrationAction / EventCommunicationSchedule | action ID, registration, action/actor/time/reason; event effective trigger/offset/template/purpose | Check-in/correction/cancellation evidence and one notice per registration/schedule/trigger; no duplicate event store |
| MarketingFormPublication / MarketingSubmission | publication ID, DbForm, site/campaign/purpose/access/effective interval; submission ID/request identity, response, verified party if any, source/effects status | Framework owns form/answers; publication controls exposure; submission is an acceptance/integration fact, not a copy of answers |
| MarketingLeadRule / MarketingLeadCapture | dated source/trigger/allowed mapping and Sales routing target; unique rule/source event, opportunity/result/error | Reusable Sales intake; retries never create duplicate opportunities or grant consent |

Keep WorkEffortParty for calendar invitation/attendance roles; EventRegistration is justified by
its independent ticket, buyer, payment, capacity and attendee entitlement. Calendar RSVP does not
confirm the registration. Paid answers can retain ProductDbForm/OrderItemFormResponse links, but
the attendee registration and FormResponse link is authoritative for per-attendee questions.

### 14.2 Service families and operation contracts

Each abbreviation below is used only for the named package. All are proposed; the existing
ContactListServices, ConsentServices, EventServices, framework services and owner-app services
are explicitly named at their use sites. Implement XML Actions first and cohesive JavaScript
modules for complex selection/evaluation, never a second BOSS business-rule layer.

| Prefix / package | Public service responsibility | Main inputs → outputs |
| --- | --- | --- |
| W — mantle.marketing.MarketingWorkspaceServices | Scoped home, settings, engagement and cross-record projections | organization, authorized filters/record, as-of, paging → display rows, counts, capabilities, readiness and page metadata |
| C — mantle.marketing.CampaignServices | Campaign lifecycle/parties/budgets/cost links, approvals, policies and vocabularies | campaign/source, allowed values, expected stamp, action and operation identity → record/decision/reconciliation or named conflict |
| L — mantle.marketing.AudienceServices | Marketing subscription policy, evidenced requests, imports/merge and list template bindings over existing list/consent services | organization/list, permitted parties/address evidence, preview and source stamps → pending/accepted/skipped membership or per-item results |
| Q — mantle.marketing.SegmentServices | Native/saved segment definition, bounded evaluation and shared audience eligibility | segment/as-of or sources/topic/channel/purpose → authorized matches, mutually exclusive reasons, tracking flags and preview identity |
| D — mantle.marketing.CampaignSendServices | Content/prepare/test/approve binding, release/schedule, experiment, recipient attempts and reconciliation | send/recipient/experiment, expected stamp, approved content/policy, operation identity → prepared/released execution, status or recovery findings |
| G — mantle.marketing.MessageServices | Shared Comms template/profile/suppression configuration and readiness | organization, typed template/profile/suppression values, effective time, capability → safe projections, validation or saved policy |
| N — mantle.marketing.AutomationServices | Ordered definitions, simulation, activation, enrollment and step workers | definition/effective time, source event, enrollment/step key → trace, due step or stopped/completed result |
| T — mantle.marketing.MarketingContentServices | Campaign content bindings and tracking links/capture | campaign/typed source, authorized target, tracking consent/context → association, public-safe link or recorded observation |
| E — mantle.work.EventRegistrationServices | Offers, holds/waitlist, tickets, registrations/check-in, financial handoff and notices | occurrence/registration, accepted offer, attendee facts, expected stamp and operation key → held/confirmed/waitlisted registration or explicit payment/capacity conflict |
| F — mantle.marketing.MarketingFormServices | Shared form adapters, publication/invitations, responses and Sales lead handoff | authorized DbForm/publication/response/rule, effective time, submission source → safe form/result or unique capture outcome |
| R — mantle.marketing.MarketingReportServices | Named authorized measures and reconciled outcome reports | organization, cohort/basis, filters, currency/rate date, as-of → measures with denominators, freshness, exclusions and source rows |
| P — mantle.marketing.MarketingPortalServices | PASS-safe participation over L/F/E and existing consent/external access | checked site/mount/publication, verified identity/token, bounded input and request key → allowlisted public view/receipt |
| ironstone.marketing.ContextServices | BOSS app entry, display context, links, choices and shell registrations | current app/user and authorized record → sharedMountContext, choices and same-app links |

These interfaces are scoped service calls, not unrestricted HTTP exposure. `find#`/choice reads
return calculated pagination and the authorized selected value even outside the first page. Unknown
choice sources fail. Exports share query predicates and field masking. Material writes require
`lastUpdatedStamp` or the source's expected revision. Multi-record decisions validate every source
and effective stamp; stale previews are refused with a refreshed preview, never silently applied.

Operation keys bind principal/capability, organization, action, target and payload hash. Returning
a stored result rechecks current access. An identical retry returns the original outcome; changed
payload or a key reused by another principal fails. Native financial operations keep their existing
PostingOperation/payment identities; Marketing execution records provide their own unique natural
effect keys, not a new universal operation ledger. Public requests use PASS's request contract and
source execution uniqueness, including anonymous token identity. New random keys cannot repeat a
winner release, registration payment or completed enrollment step.

Stable reasons include NotAvailable, Forbidden, StaleRecord, ApprovalRequired, ApprovalInvalidated,
ConsentRequired, Withdrawn, Suppressed, MissingDestination, DuplicateDestination, ChannelUnavailable,
CapacityUnavailable, HoldExpired, PaymentPending, DeliveryUncertain and OperationKeyConflict. Public
responses collapse private lookup/authorization distinctions into NotAvailable or neutral receipts.

### 14.3 Shared-screen and shell contracts

| Shared surface | Fixed context and permitted behavior |
| --- | --- |
| Comms Consent/Preferences | Organization/topic/channel and current subject; existing token scopes and mailbox separation preserved; shared consent edit capability required |
| Templates, SendingProfiles, Suppressions | One Comms-owned definition in §§4–5, 12; Marketing mounts promotional/channel context; Admin controls transport secrets/domain configuration |
| Campaign delivery trace | §5 owns one projection for Marketing and Comms; current send/organization fixed; person/body visibility requires separate rights |
| Promotions and codes | Commerce §7 owns forms; Marketing adds dated campaign links, never another evaluator or global usage budget |
| Surveys and responses | Commons owns DbForm editor/response forms, with Customer Service's initial summaries; Marketing supplies campaign/publication scope, not case response access |
| Calendar and EventDetail | Commons owns times/resources/RSVP; Marketing supplies campaign projections and links to registration extension screens |
| Page authoring and Knowledge | Commerce owns generic page/theme editor and shared storeless target extension; Commons owns wiki body/review; PASS Publishing keeps the complete article/editorial design |
| Leads and LeadSources | Sales owns opportunity/source/routing forms; Marketing supplies explicit source/campaign and source-bound capture; no implicit lead subscription |
| Customer360/ContactDetail | Crosscut/Commons own identity/forms; engagement source providers mask consent, response, Sales and finance data independently |
| Chatter and RecordFiles | Register MarketingCampaign, CampaignSend and EventRegistration hosts with organization/source checks; reuse CommunicationEventRecord/WorkEffortRecord and existing files mechanisms; native MarketingCampaignNote history remains readable |
| Approvals | Commons recipient-filtered provider with Marketing topics and source-stamp decisions; no generic approval bypass |
| Today, palette, notifications | W providers return authorized due sends, approvals, failures and registrations with same-app links; no recipient addresses, raw tokens or secret content in shell context |

Add proposed MarketingCampaignContent, CampaignSendContent and EventRegistrationContent host-file
associations for the existing shared file services (each host has a single-field ID); do not create
Marketing-only Chatter, task or notification engines.
Independent shell providers fail visibly by name while other sources continue.

### QuickCreate

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| QuickCampaign | dialog | Start a campaign | same NewCampaign fields in §3 | scoped organization | C.create#Campaign | Campaigns NewCampaign |
| QuickSend | dialog | Start a related draft | same NewSend fields in §5; host campaign fixed | template choice | D.create#Send | Sends NewSend |
| QuickList | dialog | Start a distribution list | same NewList fields in §4 | no membership implicit | existing ContactListServices.create#ContactList, extended | Lists NewList |
| QuickEvent | dialog | Start a campaign event | same NewEvent fields in §9 | calendar choice | existing mantle.work.EventServices.create#Event; C.store#CampaignAssociation | Events NewEvent |

These are shell provider mounts of the original forms, not independently maintained copies.
**Source:** Commons QuickCreate; research §§1, 11. **Needs:** MKT-SHELL.

## 15. Automation and operations

### 15.1 Existing rules and disposition

The following rules were inspected in current source. Their scope is preserved while new execution
paths add explicit orchestration. Existing automation is not silently removed by a new screen.

| Existing rule or path | Disposition on Marketing's path |
| --- | --- |
| `ListUnsubscribeMailto`, `service/MantleConsent.emecas.xml` → `mantle.party.ConsentServices.process#UnsubscribeEmail` | **Kept.** Inbound unsubscribe mail remains idempotent; new list/channel scope is validated and invalid tokens are logged without stopping other messages. Dispatch observes the resulting withdrawal. |
| `ForumUpdateContactListVisibility`, `ForumJoinContactListVisibility`, `ForumLeaveContactListVisibility`, `ForumEndContactListPartyVisibility`, `ForumAddContactListPartyVisibility`, `ForumRemoveContactListPartyVisibility`, `ForumDeclineContactListPartyVisibility`, `service/Forum.secas.xml` | **Kept.** Shared list writes still call the Forum visibility hook; its no-binding path does nothing. Marketing neither converts MAILBOX lists nor bypasses Forum access. |
| `EmailMessageFiling`, `entity/EmailMessage.eecas.xml` → `mantle.party.CommunicationServices.handle#EmailMessageFiling` | **Kept with existing condition.** It applies to account-associated email. Campaign sends use registered organization sender profiles and explicitly link communication/delivery records; deduplicate by EmailMessage/message ID if account filing also sees one. No per-recipient activity fan-out solely for a tracking pixel. |
| Existing `ContactListServices.send#ContactListEmail` / `send#ContactListPartyEmail` (explicit calls, not ECAs) | **Extended/conditioned.** Retain legacy callers and per-item failure tolerance; extract shared eligibility/render/token primitives. Campaign workers use durable per-recipient execution and dispatch-time checks, never call the legacy whole-list loop again on retry. |
| Existing `ConsentServices` subscribe/unsubscribe/token paths | **Extended.** Preserve legacy routes/mailboxes and history; Marketing policy adds evidence, purpose/channel/organization scope and dispatch invalidation. Staff subscribe cannot silently clear global/provider suppression. |
| Existing EventServices invitations and due-reminder jobs | **Kept.** Calendar RSVP/reminders remain calendar-owned. Registration confirmation/event schedules are distinct effects, keyed once per registration/trigger; setup detects equivalent configured notices to avoid duplicate reminders. |
| Existing order promotion, payment, order/invoice and subscription rules | **Kept under owner contracts.** Paid tickets enter native order/payment paths with Commerce/Shop/Accounting guards; Marketing adds source/capacity adapters, not another invoice, capture, tax or refund processor. See crosscut §1.3 and Commerce §11 for those rules' existing dispositions. |

### 15.2 Durable dispatch and recovery

Preparation persists the send intent, approved content reference and eligible recipient execution
set before any provider call. A due worker claims a bounded page of recipients with a lease and
checks organization, campaign/send state, topic membership, purpose/address consent, suppression,
frequency caps and sender readiness immediately before handoff. The accepted address/content is
fixed; missing data is skipped with a named reason. Receipt or unsubscribe workers may stop remaining
work; already submitted messages cannot be recalled and the UI exposes them as in flight.

Commit the attempt identity before the network call; do not hold a database transaction open for
SMTP/SMS. Supply a stable provider idempotency key where supported. After submission, record the
provider result and link EmailMessage/CommunicationEvent/ContactListCommStatus in a short transaction.
A crash between submission and recording creates an uncertain attempt. Query by provider key when
possible; otherwise require operator reconciliation. Lease expiry alone does not prove no message
was sent. The current list-send subject input changes the CommunicationEvent subject, while the template
controls the actual email subject; the new prepared-content handoff must explicitly bind both
envelope subject and body to the approved intent. A failed recipient never aborts unrelated recipients; selection/authorization corruption
blocks that execution before any external effect.

Signed/authenticated provider callbacks are bounded, replay-deduplicated and routed only to known
profile/attempt IDs. Receipt order cannot regress accepted/delivered facts; bounce/complaint facts
remain separately visible and apply suppression once. Unknown callback IDs are quarantined with a
safe diagnostic. Framework transport handles providers, signing and normalized receipts; Mantle
maps them to recipient/consent facts. Raw provider URLs, tokens and subscriber addresses are not logs.

### 15.3 Job catalogue and operational measures

| Proposed job | Work and recovery boundary |
| --- | --- |
| Due campaign dispatch | Claim due approved send/recipient pages; per-recipient transactions; retry known transient failure within policy; uncertain work remains blocked for review |
| Automation admission/steps | Cursor by source event or segment difference; unique enrollment/step effects; bounded due processing; current exit/consent checks before each effect |
| Registration expiry/waitlist | Expire holds and release capacity once, then offer FIFO waitlist places under locks; paid-unallocated outcomes remain explicit review work |
| Event communications | One effect per registration/schedule/trigger; cancelled/changed events suppress obsolete notices; promotional notices use normal consent |
| Capture handoff | Process accepted form/event source facts into Sales once; failed capture is visible without rolling back the response/registration |
| Delivery reconciliation | Query known provider attempts/events, update named uncertain results; never blind resend |
| Reporting and retention | Incremental source/event aggregation with watermark and freshness; rebuildable totals; policy-approved expiration/anonymization without deleting needed financial evidence |

ServiceJobs provide scheduling; no new workflow engine. Record backlog/oldest due, accepted/failed/
uncertain recipients, suppressed/skipped reasons, webhook failures, enrollment stalls, held/expired/
paid-unallocated registrations and report watermark. Show these in the relevant app lists; Admin
retains transport/job diagnostics. Throttling is per provider/profile and organization, with bounded
batch sizes and backoff. Secrets remain in operator configuration. Alert only on actionable failures
or materially overdue work, not one notification per recipient.

### 15.4 Compatibility and adoption

No migration is executed by this design. Implementation adds nullable associations/metadata first,
then explicitly adopts existing lists/templates/campaigns into organization policy. Unknown historical
consent is not a grant; historical accepted membership can be reviewed with evidence. New guards
must protect public/direct service callers while preserving declared internal MAILBOX and Forum
contracts. Legacy unscoped consent withdrawals retain their broad blocking effect; organization-scoped
grants cannot undo them. Adoption previews affected records and records each result independently.
Historical sends cannot be reconstructed into verified delivery or attribution simply from counts.

Register new public operations and readiness before enabling a PASS mount. Enable Marketing areas
only after their required services and scope checks are available. An unavailable SMS adapter blocks
SMS readiness and leaves functioning email campaigns usable. No change to existing inventory
Implemented in cells is warranted until application implementation actually lands.

## 16. Coverage and acceptance

### 16.1 Research disposition

| Research candidate / area | First-release disposition |
| --- | --- |
| Home/calendar/KPIs/attention | Home and shared Calendar; Marketing report providers work before Insights |
| Campaign list/detail/budget/approvals | Campaigns, CampaignDetail, Commons Approvals; native campaign flow and dated roles |
| Lists/members/import/merge | Lists, ListDetail, MemberDetail, AudienceImport and AudienceMerge; existing list services extended |
| Native rules/explicit/saved-query segments | Segments/SegmentDetail with typed bounded predicates and shared AudiencePreview |
| Consent/suppression/audience exclusions | Comms Consent and shared Suppressions; purpose-specific evidence, dispatch recheck and explicit exclusion counts |
| Email/newsletter/SMS/templates/test/schedule/traces | Sends, Compose, shared Templates/Profile configuration and durable Delivery; SMS transport is a required new capability |
| A/B testing | ExperimentDetail, two disjoint samples and explicit winner release; no automatic open-rate winner |
| Drip/nurture | Automations, ordered steps, simulation/enrollments and restart-safe execution; visual graph/loops deferred |
| Promotion programs/rules/codes/redemption/store binding | Shared store promotion/code screens; campaign links only; cross-store budgets/programs, loyalty and referrals deferred |
| Blogs/categories/wiki | Campaign content list/links and shared Knowledge authoring; complete article metadata/taxonomy/editorial baseline remains future PASS Publishing |
| Landing pages/web forms | Commerce shared page authoring extended for storeless Marketing; published DbForm/lead/subscription components through PASS |
| Tracking links/QR | TrackingLinks/TrackingLinkDetail and guarded capture; no automatic personal tracking without consent |
| Events/tickets/attendees/check-in/communications | Shared EventDetail plus registration setup/records, paid/free tickets, waitlist and notices; booths, conference tracks and offline check-in deferred |
| Lead list/source/lead-generation rules | Sales Leads/LeadSources mounts and source-bound LeadRules; Marketing brings shared lead capture into its first release |
| Survey builder/share/results/scoring | Shared DbForm editor/response views, Marketing distribution, explicit option scoring; timed exams/certification/live quiz sessions deferred |
| Performance/visits/opportunities/orders/revenue | Four named reports with recorded primary attribution; advanced multi-touch/funnels later Insights work |
| Customer 360 engagement | Shared Customer360/ContactDetail with independently authorized source projections |
| Settings/shell providers | Owned policy/vocabularies and shared Comms/Sales settings; palette, Today, quick create and approvals |
| External-platform sync/social/referrals | No first-release campaign sync, social scheduling or reward platform; channel provider adapters are transport, not an external campaign database |

Deferred capabilities have no fake working menu entries. Their eventual design must retain shared
promotion evaluation/ledger ownership, source permissions and public publication boundaries.

### 16.2 Baseline forms and service coverage

| Baseline / existing service area | Mapping and boundary |
| --- | --- |
| ProductStore/Promotion FindPromotion and EditPromotion | All existing create/list/header/parameter/product forms map additively to Marketing promotion mounts of Commerce's definitions |
| ProductStore/Promotion/PromoCode FindPromoCode and EditPromoCode | All create/list/header/party restriction forms map to Marketing code mounts; order code-entry forms stay with OrderDetail |
| Survey FindSurvey, EditSurvey, Fields | All list/create/header/group/field/option/preview forms map to Surveys/SurveyDetail; no new form engine |
| Survey Responses, ResponseDetails, ResponseStats | Response list/detail and both statistics forms map to Responses/ResponseDetail with publication scope |
| Calendar MyCalendar/EventDetail | Existing creation/event/update/party/equipment forms map to EventDetail; note forms map to its shared Chatter; registration is new |
| Wiki EditWikiPage | Body edit maps to Knowledge; WikiBlogs/AddBlogPage/AddBlogText/WikiBlogList and EditWikiBlog metadata/category forms stay with future Publishing |
| Store emails / party emails / financial accounts / system visits | Store template assignments remain Commerce; personal mail remains Comms; gift-card balances remain Accounting; raw system visit tools remain Admin. Marketing uses scoped template/report projections |
| ContactListServices | Map directly used list find/create/update/member queries; legacy membership/whole-list send helpers are discussed as dependencies, not invented screen calls |
| ConsentServices / ContactServices | Map consent list/state/history/store/subscribe/unsubscribe/bulk and public preference/token operations actually called by mounts |
| EventServices / WorkEffortServices | Map existing calendar/event calls from shared mounts; registration/worker-only helpers are proposed or dependencies, not implementation claims |
| ContactImportServices | Map existing parser/preview/import reached by AudienceImport; row workers and internal matching helpers are not extra form calls |
| Proposed Marketing families and framework services | Proposed packages stay here; the Mantle inventory does not acquire fictional service rows. Framework service use is recorded here and in form summaries, outside the Mantle inventory |

Screen and service inventory Designed in entries are additive. Preserve existing app mappings and
all Implemented in values. When an existing active service is missing from the older inventory,
add only a source-verified row and identify the addition; do not count XML-comment definitions.

### 16.3 Implementation acceptance scenarios

These are requirements for the implementation plan, not test runs required for this documentation
change. Use fast isolated fixtures and Moqui server/client specs, never Node as a test runner.
Slow scenario tests require the user's explicit permission under AGENTS.md.

1. **Organization and private contacts:** two organizations plus a private contact; permitted
   read/edit/preview/export succeeds, identical parameters for an unauthorized user fail for the
   permission/scope reason. IDs, counts, choices and cached report results do not leak records.
2. **Adoption and mailbox compatibility:** adopt an evidenced marketing list; unknown consent stays
   pending/review. Existing Comms MAILBOX and Forum membership, visibility invalidation and delivery
   preferences retain their original behavior. List creation never auto-subscribes staff.
3. **Audience explanation:** mixed missing addresses, duplicate destinations, conflicting consent,
   pending/unsubscribed memberships, suppression and tracking refusal reconcile to exact bucket
   totals. Segment changes do not subscribe anyone or add recipients to an already prepared send.
4. **Import and merge:** malformed rows fail independently; restart applies each good row once.
   A withdrawal after preview survives apply/retry; list merge neither merges parties nor transfers
   consent across topics. Contact preview cannot match another user's private contact.
5. **Subscription and unsubscribe:** GET/scanner visits change nothing; confirm POST grants only the
   intended topic/address. Replay after withdrawal does not regrant. One-click and mailto unsubscribe
   act once; expired/foreign tokens disclose nothing and MAILBOX membership is unaffected.
6. **Approval and dispatch:** author, approver and dispatcher exercise distinct grants. Content,
   sender, recipient or schedule changes invalidate approval. Withdrawal, new suppression or changed
   address after preparation removes delivery at dispatch; other eligible recipients still send.
7. **Transport recovery:** crash before handoff, after acceptance and before recording; known
   failures retry safely, uncertain outcomes require provider evidence/reconciliation, and duplicate/
   out-of-order callbacks do not duplicate messages, counters or suppressions. In-flight cancellation
   is shown accurately. Verify unsubscribe headers/body on email and opt-out handling for SMS.
8. **A/B isolation:** stable disjoint variant samples/remainder, retry without reassignment, no
   recipient receives two variants, manual winner release once, withdrawal before remainder dispatch,
   and honest zero/tie/low-coverage reporting. Tests do not enter experiment statistics.
9. **Automation:** duplicate admission event, segment scan restart, pause/resume during a wait,
   restart after a completed send, consent withdrawal, goal completion, quiet hours and DST. Each
   enrollment/step effect occurs once and stopped work cannot silently resume.
10. **Content safety:** malicious variables/HTML/URLs and unauthorized attachments are rejected;
    approved content remains reproducible. Private drafts/preview URLs do not become public through
    a campaign link, template or a list's public flag. Storeless landing pages work.
11. **Public forms and Sales:** hidden/invalid fields, token replay and changed request payload are
    rejected; neutral receipts reveal no existing contact. A successful response survives a failed
    lead handoff, which retries into one Sales outcome and never auto-subscribes the respondent.
12. **Historical responses:** change labels/options/conditions after submission; old responses render
    with their effective definition. Shared form access does not grant access to case responses.
13. **Event capacity and payment:** concurrent last-seat reservations, hold expiry, waitlist promotion,
    duplicate payment callbacks, late payment after expiry, cancellation/refund and attendee transfer.
    No oversell, duplicate charge or reused entry credential; RSVP alone grants no paid seat.
14. **Check-in and notices:** repeated/wrong-event/cancelled scans and a manager correction retain
    audit history. Event cancellation stops obsolete notices; configured calendar and registration
    notifications do not send the same intended reminder twice.
15. **Report reconciliation:** recipient/variant counts reconcile; accepted differs from delivered;
    untracked recipients do not depress a tracking rate; primary versus influenced outcomes do not
    double count. Split invoices, partial refunds, parent campaigns, multiple currencies and missing
    evidence show explicit, source-reconciled results.
16. **Devices and surfaces:** every screen renders in qvt and tui; public HTML is accessible; phone
    lists/check-in fit at 390 px. Check real action presence for allowed roles and absence for readers,
    empty states, stale-write recovery and not-available links. All new routes join structure/TUI specs.

## 17. Delivery stages

All stages below belong to the broad first release. Dependencies are explicit so a convenient early
screen is not mistaken for a safe, complete sender. No application code is changed by this design.

| Stage | Deliverable and exit condition |
| --- | --- |
| M0 — Scope and shared foundations | Permissions, organization adoption, consent/purpose policy, shared form/public-site agreements and source guards; fast cross-org/direct-service tests |
| M1 — Campaigns and audiences | Shell, campaign lifecycle/budget, lists/import/merge, segment evaluation, shared consent/suppression; evidence and exclusion scenarios pass |
| M2 — Shared content and channel readiness | Templates/profiles, safe composer, existing email transport integration, real SMS adapter/receipts/withdrawals and public subscription pages; both channels have verified readiness gates |
| M3 — Durable sends and experiments | Prepared recipients, separate approval/release, jobs, traces, unknown-outcome recovery and manual A/B winner release; failure/replay/withdrawal tests pass |
| M4 — Structured automation | Approved ordered steps, admission/due jobs, simulation, enrollment trace, caps and stop/restart behavior; no duplicate step effects |
| M5 — Public forms and campaign content | Shared surveys/results, publication/gating, storeless landing pages, tracking links, Sales lead capture; public replay and content/access tests pass |
| M6 — Events | Commons context, registration/tickets, free and paid flows, capacity/waitlist, entry credentials and transactional schedules; capacity/payment/cancellation cases pass |
| M7 — Integration and reporting | Shared promotion/customer/source contexts, complete shell providers, reconciled reports, documentation/coverage and fast end-to-end walks |

Existing capabilities and new dependencies are named again in the needs register. A deployment may
disable unused channels/events, but first-release delivery is not complete by dropping those stages.
Later work: cross-store program/loyalty/referrals, full Publishing editorial screens, social/channel
campaign sync, branching journey canvas, advanced attribution, conference tracks/booths, offline
check-in and certification/live quizzes.

## 18. Documents and outputs

| Output | Kind | From screen | Derived from |
| --- | --- | --- | --- |
| Campaign plan/budget and approval history | html-print/PDF | CampaignDetail | native campaign fields, decisions and authorized cost allocations |
| Audience import preview/error rows and membership export | import/export CSV | AudienceImport, ListDetail | shared ContactImport and scoped membership query; explicit export permission |
| Personalized email/text alternative and SMS | message | Compose/SendDetail | effective safe template, approved recipient execution, unsubscribe/withdrawal contract |
| Test message | message | Compose | clearly marked test with synthetic/authorized sample values; excluded from live metrics |
| Delivery/reconciliation report | CSV/html-print | Delivery/RecipientDetail | attempt/event ledger with redacted tokens and permission-masked destinations |
| Subscription verification and preference notices | message/public receipt | Subscribe/VerifySubscription/Preferences | existing consent/token paths extended for the published request |
| Tracking URL and QR | link/image | TrackingLinkDetail | validated canonical redirect, no embedded plain party identifier |
| Survey invitation, public form and results | message/HTML/CSV | SurveyDistribution/SubmitForm/Responses | shared DbForm and effective response definition |
| Event offer, registration receipt/ticket and entry QR | HTML/html-print/PDF | Event/Register/RegistrationDetail | accepted ticket offer and opaque event-bound entry capability |
| Event change/cancellation/payment status notice | message | RegistrationDetail | source registration action and authoritative financial outcome |
| Event calendar file | ICS | EventDetail | existing EventServices event/occurrence export |
| Campaign/delivery/growth/attribution reports | CSV/html-print | Reports and children | the identical authorized report query, basis, currency and as-of watermark |

Prints retain effective date/time and authorized source references. Exports omit token secrets,
provider credentials and inaccessible fields. Public tickets/receipts contain the minimum attendee
and event data; a registration email is not permission to include the attendee in a campaign.

## 19. Framework and data needs

These are additions/extensions, not claims of missing foundations that now exist. The IDs are
rolled into crosscut §7.9. Shared dependencies such as COM-PROMO, SHOP-CHECKOUT, CS-FEEDBACK,
CS-FORM-ELEMENTS and SAL-CRM retain their owning designs and are not duplicated here.

| Need | Kind | Proposed as | Used by | Stub spec |
| --- | --- | --- | --- | --- |
| MKT-ACCESS | Mantle/BOSS permissions and scope | Organization/role associations; guarded direct list/consent/template/report operations, confidential projections and legacy adoption | all staff/public surfaces | Allowed operation succeeds; identical foreign/private operation fails without data; MAILBOX contracts remain intact |
| MKT-CAMPAIGN | Mantle data/services | C over native campaign flow, parties, associations, policies/vocabularies and independently sourced cost allocations | Campaigns, promotions, content/events, settings | Native transitions, stale edits, same-org links, cost reversals and nonduplicated child rollups |
| MKT-APPROVAL | Mantle decision/provider | MarketingDecision and effective approval rules; Commons topics; distinct author/approver/dispatch rights | campaigns, sends, automation, templates | Changed intent invalidates approval; assigned source-scoped approver cannot release without dispatch grant |
| MKT-AUDIENCE | Mantle data/services | L and existing ContactListServices extensions, SubscriptionRequest, import item results and evidence-preserving list merge | lists, import/merge, public subscribe | Pending/grant/withdrawal, independent row failure, replay after withdrawal and list single-use behavior |
| MKT-SEGMENT | Mantle query/model extensions | Q with native criteria, dated explicit membership and bounded typed saved predicates | segments, audience preview, admission | Parent intersection, exclusions, unit bounds, access under negation and stable pagination |
| MKT-CONSENT | Mantle shared policy and Comms surfaces | Existing PartyConsent/token/solicitation extended with scoped evidence, shared MarketingSuppression and tracking/channel policy | audiences, sends, public preferences | Current consent at handoff, scoped grant versus global withdrawal, complaint persistence, read-only GET and idempotent one-click |
| MKT-TEMPLATE | Mantle shared configuration; framework safe rendering | MessageTemplate metadata over EmailTemplate, shared library/editor, declared variables/content and effective bindings | Comms/Marketing templates and composer | No arbitrary screen/service execution; safe variables/HTML, historical prepared body and test isolation |
| MKT-TRANSPORT | framework tool/service extension; Mantle adapter | Verified sending-profile readiness, stable handoff/receipt contract, real SMS adapter/segment estimate/STOP and normalized verified callbacks | SendingProfiles, sends, events | Missing adapter blocks channel; timeout ambiguity, duplicate receipts, phone normalization and sender verification |
| MKT-SEND | Mantle durable execution | CampaignSend/Recipient/Attempt/Event and D orchestration extending existing list-send primitives | sends, delivery, all automated promotional mail | Durable prepare/claim/handoff/result, bounded failures, destination changes, retry/uncertain separation |
| MKT-EXPERIMENT | Mantle execution/services | Two variants, stable disjoint assignments, observation window and unique explicit winner release | ExperimentDetail | Remainder disjoint, no reassignment, withdrawal before release and honest denominator/tie results |
| MKT-AUTOMATION | Mantle dated definition and jobs | Ordered MarketingAutomation steps, enrollment/step facts, typed triggers/conditions, simulation and bounded scheduler | automation, event follow-up | Duplicate admission/restart, stop/goal/consent, effective definition and quiet-hours/DST behavior |
| MKT-CONTENT | Mantle bindings; shared owner screen extension | CampaignContent over wiki/blog/page/file; Commerce storeless publication target and safe embedded participation components | Content, landing pages, Knowledge | Linking never publishes a draft; standalone campaign site without a store; approved-version rendering |
| MKT-TRACKING | Mantle capture/reporting; framework HTTP hooks | TrackingCode UTM/scope extension, consent-aware event capture, safe redirect/pixel and primary MarketingOutcomeLink | links, sends, reports | Redirect target allowlist, no tracking after refusal, native key limits, fixed accepted outcome attribution |
| MKT-EVENT | Mantle registration domain over native events/orders | E and offer/ticket/registration/action/schedule records, capacity holds, waitlist, entry credentials and payment adapters | Events and PASS participation | Last-seat concurrency, late payment, cancellation/refund boundary, repeated scan and recurring occurrence isolation |
| MKT-FORMS | shared framework/Commons extensions; Mantle publication | Safe dated DbForm fields/options/sections, response guard, MarketingFormPublication/Submission and invitations | surveys, lead capture, registration | Typed conditional/required fields, response history, scoped invitations and immutable accepted response |
| MKT-LEAD | Mantle/Sales integration | MarketingLeadRule/Capture over shared Sales intake with deterministic effect identity and authorized mappings | LeadRules, public forms, events | One source creates one handoff; failed Sales work preserves submission and never grants consent |
| MKT-PUBLIC | PASS registration/operations; Mantle projections | Independent organization-bound Marketing mount, publication/token/site checks, shared page renderer, registered handlers | public subscription/forms/events | Local/remote without BOSS, explicit publication, request replay, no enumeration and canonical URLs |
| MKT-REPORT | Mantle report services and projections | R measures, eligibility/receipt denominators, native source allocation, currency/as-of evidence and rebuildable watermarks | Home, Customer360, reports | Totals reconcile to source facts, privacy coverage and partial refund/credit/currency behavior |
| MKT-COLLAB | Mantle host/content support | Authorized campaign/send/registration host registration, MarketingCampaignContent/CampaignSendContent/EventRegistrationContent and shared Chatter/files/activity links | detail screens, events, Customer360 | Same host authority on direct content/search/activity reads; native campaign notes preserved |
| MKT-SHELL | BOSS providers over existing shell | App context, palette, Today, quick-create, calendar overlays, approvals and notification topics | shell, Home and Calendar | Provider failure isolated; no private recipient/token data in context; every link resolves to an authorized mount |

## 20. Decided

| Decision | Notes |
| --- | --- |
| Broad first release | Email/SMS, A/B, structured drip automation and event registration are first-release work; §17 stages do not quietly defer them. |
| Research: template library | One Comms-owned library with channel/purpose kinds over existing EmailTemplate plus safe business metadata; Marketing has its own campaign composer, not the personal mail composer. §§5, 12. |
| Research: campaign send record | A distinct CampaignSend with durable recipient/attempt/event facts. Existing CommunicationEvent and ContactListCommStatus remain linked delivery foundations, not an overloaded parent/child scheduling engine. §§5, 14–15. |
| Research: promotion scope | Reuse Commerce's store promotions/codes and evaluator. Campaign associations do not create cross-store limits or programs; loyalty and referrals are later. §7. |
| Research: event registration record | EventRegistration is independent entitlement/payment/capacity evidence linked to WorkEffort and native order/form records. WorkEffortParty remains calendar participation. §9. |
| Research: blog screens | Commons owns wiki body/review, Commerce owns shared page authoring and future PASS Publishing owns complete editorial/article/taxonomy screens. Marketing owns campaign content use and distribution; no duplicate blog editor. §8. |
| Source truth over historical gaps | List sends, consent/history/tokens, calendar and wiki review now exist. SMS send is still a stub. Explicit extensions and new records are marked accordingly. |
| Consent | Marketing requires evidenced affirmative topic/channel eligibility; import, segment match, lead creation and registration are not consent. Existing withdrawals and suppressions remain effective. |
| Organization and role scope | Native dated campaign parties own organization/responsibility; scoped services authorize independently of BOSS. MAILBOX/Forum behavior remains distinct. |
| Automation | Ordered Send/Wait/Condition steps and ServiceJobs; explicit admission/exit/reentry rules; no visual branching engine. §6. |
| A/B | Two variants, stable disjoint total sample, human winner release and tracking-aware measures; no auto winner from opens. §5. |
| Scheduling and recovery | Approved intent, durable recipient facts, short transactions, explicit uncertain transport outcome and no blind retries. §15. |
| Public capability | PASS Marketing mounts independently, uses explicit publication and scoped operations and has no BOSS dependency. Legacy unsubscribe links remain usable. §13. |
| Shared lead intake | Marketing's first release consumes and advances the Sales-owned intake contract; standalone Sales routing/territory expansion remains later. §10. |
| Attribution | Recorded primary campaign plus separately labelled influence; source/time evidence fixed at the business event, revenue and cash distinct, returns/credits reconciled. §11. |
| Baseline not carried here | WikiBlogs/EditWikiBlog full forms stay assigned to future Publishing; transactional store-email assignments, gift-card accounting and raw visit administration stay with their owners. §16.2. |
| Shared ownership | Register Templates, TemplateDetail, SendingProfiles and Suppressions as Comms-owned canonical summaries here, registration extensions as Marketing-owned over Commons events, and safe surveys as Commons-owned. No duplicate editors. |
| Histories | Effective-dated settings/associations and audit logs, with independently identified approval/send/enrollment/registration facts; no parallel configuration-version store. |
| Documentation-only delivery | Designs and Designed in inventories are reconciled; implementation claims, schemas, services, screens and tests are unchanged by this pass. |

## 21. Open

No blocking product or ownership decision remains for this design. Deployment selects its approved
SMS/SMTP providers, sending domains, retention intervals, organization approval assignments and
financial ticket gateways through the defined configuration. Those choices must satisfy the
readiness/transport contracts; an unconfigured channel cannot claim to work. They are implementation
configuration, not a reason to weaken consent, scope, replay or capacity requirements.

The explicitly deferred capabilities in §16.1/§17 need their own later designs before implementation.
The full public Publishing screen design remains future; Marketing does not mark its baseline forms
covered merely by linking or reading an article.
