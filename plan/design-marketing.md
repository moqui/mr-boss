# IronStone BOSS — Marketing design

Nov 13, 2026 — impl-marketing's P0 checks done (its F64–F89): Sales' Accounts mounted at Marketing/Leads/Accounts for
the bulk action (§§2, 10); a campaign cost cites a purchase invoice item or a ledger entry of the campaign's
organization, and no Accounting budget applies (§3); the shared door tablet is registered with CheckIn, Admin's
shared devices being built (§9); a public tracking route reaches the authority through PASS's transport (§13.1).

Nov 11, 2026 — implementation plan written ([impl-marketing.md](impl-marketing.md)) and its questions answered;
the decisions of its §4 and the findings of its §6 are stated here: the audience import's own permission
`MARKETING_AUDIENCE_IMPORT` (§§1.1, 4), the one-person-team self-approval flag (§§3, 5, 12), SMS in the build, last
(§§12, 17), a ticket order under the seller's Sales approval setting (§§9, 13), store-sold tickets later (§§20, 21),
Marketing's own readiness provider
and lifecycle participant (§14.3), the order-placed handler `handle#OrderPlaced` (§§6, 11, 15), a public subscriber
as a Party from the request (§§13, 14.1), the registered metric IDs (§§11, 16.1), the approval topics seeded with
Marketing's data (§3), Comms' own mounts of the shared sending screens and the privacy provider later (§§4, 5, 10,
12, 14.3), and the survey builder's per-app registration (§10). Earlier the same day the plan's P0 corrections
were made (impl-marketing F4, F12, F18, F19, F25, F26, F29, F55, F56).
Nov 1, 2026 — draft; reviewed against research-marketing.md, the reference apps and the other designs (the suite-app review, since removed from the tree; read it with `git show bd74564^:plan/review-suite-apps.md`).

IronStone Marketing serves marketing staff, campaign managers, audience stewards and event
organizers. It brings together campaigns and budgets, segments and lists, email/newsletters and
SMS, experiments and drip sequences, promotions, content and blog posts, events, surveys, lead
capture and campaign analytics. It works without a store: a paid ticket is a storeless sales order
taxed through the organization's tax gateway (X1) and paid through Accounting's payment
coordinator (X9); store promotions apply only when a store is configured. Public participation
uses IronStone PASS over Mantle, without a BOSS runtime dependency.

**Inputs:** [marketing research](research-marketing.md), [initial decisions](initial-design.md),
[design guide](design-doc-guide.md), [style guide](style-guide.md),
[crosscut](design-crosscut.md), [Commons and Comms](design-drawers-commons.md),
[Sales](design-sales.md), [Commerce](design-commerce.md),
[Customer Service](design-customer-service.md), [Products](design-products.md),
[Accounting](design-accounting.md), [Admin](design-admin.md), [Insights](design-insights.md),
[PASS foundation](../../mr-pass/plan/design-forum.md),
[Shop](../../mr-pass/plan/design-shop.md), [screen inventory](ss-inventory.md) and
[service inventory](usl-inventory.md). The [shared ground rules](impl-drawers-commons.md#4-ground-rules)
and [application practices](../../../../../docs/dev/Practices-App-Dev.md) govern implementation.
Decisions marked X, Z or L cite §3 of the suite-app review (see above).

**Sections:** [1 shell](#1-shell) · [2 screens](#2-screens) · [3 campaigns](#3-home-and-campaigns) ·
[4 audiences](#4-audiences) · [5 sends](#5-sends-templates-and-experiments) ·
[6 automation](#6-automation) · [7 promotions](#7-promotions) · [8 content](#8-content-and-tracking) ·
[9 events](#9-events) · [10 surveys and leads](#10-surveys-leads-and-engagement) ·
[11 reports](#11-reports) · [12 settings](#12-settings) · [13 public access](#13-pass-marketing-participation) ·
[14 contracts](#14-data-service-and-shared-screen-contracts) · [15 operations](#15-automation-and-operations) ·
[16 acceptance](#16-coverage-and-acceptance) · [17 delivery](#17-delivery-stages) ·
[18 outputs](#18-documents-and-outputs) · [19 needs](#19-framework-and-data-needs) ·
[20 decisions](#20-decided) · [21 open](#21-open).

**Source convention.** Third-party patterns are attributed to the research sections. Baseline
screen names are relative to `mr-marble/screen/SimpleScreens/`. Abbreviations in form tables are
defined in §14.2; their operations are **proposed** except where marked existing.

**Starting point.** `screen/Marketing.xml` and its section placeholders exist, with icon
`sym_o_campaign`; the root grants `ADMIN` and `BOSS_MARKETING_ADMIN`. Mantle already has
`MarketingCampaign`, its `MKTG_CAMP_*` flow and dated campaign parties, the native segment and
tracking entities, and the store promotion model. It has no campaign lifecycle, campaign-send,
segment evaluation or marketing attribution service family. The research's statement that no
service uses contact lists is obsolete: `mantle.marketing.ContactListServices` implements list and
mailbox operations and `send#ContactListEmail`; `mantle.party.ConsentServices` implements consent
history, subscriptions and hashed unsubscribe tokens. These need scoped Marketing extensions,
not replacements. Existing list-send selection is permissive when consent is unspecified and
is not a durable campaign dispatch queue. Non-MAILBOX list operations do not yet enforce the
organization/capability boundary required here. `org.moqui.SmsServices.send#SmsMessage` is built on
Comms C1 and C4-SMS (impl-marketing F19): a promotional text needs a yes from an `sms-consent`
provider, which Mantle does not answer yet. Nothing reads bounces or complaints for direct SMTP; mail
relayed by an edge node already has a VERP sender and a DSN reader that marks `ES_BOUNCED`
(impl-marketing F18), and the email ECA mechanism exists. Comms' delivery ledger is built
(impl-marketing F12).
Nothing writes `TrackingCodeVisit`, `TrackingCodeOrder` or an attribution record. The framework's
`WikiBlog` and `org.moqui.resource.WikiServices.create#WikiBlog`/`update#WikiBlog` exist with no BOSS
screen. Commons calendar, wiki review/publication, Chatter and record files exist.

## 1. Shell

### 1.1 Root, roles and authority

Keep root `Marketing`, `screen/Marketing.xml`, `sym_o_campaign` and existing
`mantle.party.PartyServices.setup#UserOrganizationInfo`. Proposed
`ironstone.marketing.ContextServices.get#SharedContext` supplies capabilities, authorized
organization choices, same-app links, readiness and shell providers. Every Mantle operation checks
its permission and record scope independently, including searches, choices, reports, exports,
previews and batch items. Shell context is presentation, not authorization.

Ordinary groups use `MANTLE_USER_ORG` and `MANTLE_PRIVATE_CONTACT`; the app admin uses
`MANTLE_ACTIVE_ORG`. Campaign organizations are dated `MarketingCampaignParty` rows with proposed
role `MarketingOrganization`; managers/contributors use their own role rows, never overloaded
ownership fields. One effective owning organization is required.

**Organization filter (X12).** An entity filter cannot follow a dated role row, so the proposed
`MarketingCampaign.organizationPartyId` is a denormalized, audit-logged copy of the effective
MarketingOrganization row, kept equal to it by C. MarketSegment already has an audit-logged
`ownerPartyId` (default `_NA_`; impl-marketing F4), which is its filter field, as ContactList's
existing `ownerPartyId` is. Proposed filter rows in both `MANTLE_USER_ORG` and `MANTLE_ACTIVE_ORG`
cover MarketingCampaign by `organizationPartyId` and MarketSegment and ContactList by
`ownerPartyId`. TrackingCode is scoped through its campaign by the K services. `_NA_`/unowned legacy
lists and segments are unassigned, not globally writable; adoption requires an authorized explicit
assignment before use. Campaign-related records inherit the owning organization and reject
mismatched source records.

All groups and permissions below are proposed except the existing admin group shell declaration.
The letters are used in the screen table; a narrower permission composes with view and scope.

| Group / shorthand | Permissions and boundary |
| --- | --- |
| BOSS_MARKETING / app | MARKETING_VIEW; app entry and organization-authorized campaign summaries |
| BOSS_MARKETING_AUTHOR / A | MARKETING_CAMPAIGN_EDIT, MARKETING_SEND_EDIT, MARKETING_CONTENT_EDIT; draft work, preview and test to approved test recipients |
| BOSS_MARKETING_AUDIENCE / U | MARKETING_AUDIENCE_VIEW, MARKETING_AUDIENCE_EDIT, MARKETING_AUDIENCE_IMPORT, MARKETING_CONSENT_EDIT, MARKETING_AUDIENCE_EXPORT; person-level lists, segments, imports and evidenced consent changes |
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

MARKETING_AUDIENCE_IMPORT is the app's own import permission (impl-marketing §4, Nov 11): the
audience import target names it and no `ADMIN_*` permission, because a transfer target's
permissions are all required and an Admin permission beside it would shut Marketing's own users
out (§4 AudienceImport). Mantle seeds the `MARKETING_*` permissions; BOSS grants them by the table
above and puts each in its group's capability bundle.

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
- Sends — `Sends`; templates — `Sends/MessageTemplates`; delivery — `Sends/CampaignDelivery`; automation — `Automations`
- Promotions — `Promotions`; codes — `Promotions/PromoCodes`
- Content — `Content`; blog posts — `Content/BlogPosts`; landing pages — `Content/LandingPages`; links — `Content/TrackingLinks`
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

### 1.3 Stack contributions

Marketing plugs into the framework through the crosscut §1.5 contracts (L1–L9). What is not built is
a need in §19.

| Contract | Marketing entries |
| --- | --- |
| CX-ASSIST (L1) | Procedure skills in mr-boss `skill/`: `marketing-campaign-summary.md`, `marketing-prepare-send.md`, `marketing-audience-check.md`, with `screens:`, `skill/aliases.json` (campaign, send, list, segment) and `test/skill-retrieval.json`. `assist-prompt` chips: CampaignDetail "Summarize this campaign's results", SendDetail "Why were recipients excluded?", SegmentDetail "Explain this segment". `response-action`s "Log as note" and "Send as message". Compose and the template editor use the built inline text actions (Rewrite, Shorten, Translate, Grammar) rather than a new drafting feature; any generated subject or body is a draft that still needs approval. `AgentToolExposure` rows only for read verbs no screen answers in one step (R.get#CampaignPerformance, Q.preview#Audience aggregates), `exposeMcp` N; no exposure for dispatch, consent or audience-address services. Prerequisite: the Mantle active-organization user-facts provider. **Needs:** MKT-ASSIST |
| Meetings (L7) | An online event occurrence is a Commons Event with a CallLink; the registration confirmation carries the link and invitations go by iMIP (`send#EventInvitations`). Attendance from call legs is later (§9) |
| CX-SYNC (L2) | The campaign calendar (campaign windows, scheduled sends, events, publication dates) reaches phones as a read-only projected CalDAV collection answered by W with the user's scope (§3). **Needs:** MKT-SYNC |
| CX-MAIL-INTAKE (L3) | No business intake action. Bounce and complaint reports and `ListUnsubscribeMailto` are email ECAs, because their address is the identity: the per-execution VERP Return-Path and the unsubscribe mailto (§15) |
| CX-DELIVERY (L4, X8) | CampaignSend and CampaignRecipient are the intent and selection; attempts, receipts, retry and the uncertain outcome live on the one Comms delivery ledger. Event notices and automation sends are ledger sources too (§§5, 15) |
| CX-DEVICE (L5) | CheckIn runs under the staff user's sign-in on a phone; a shared check-in tablet uses the CX-DEVICE device credential limited to the CheckIn route group. `scan-input` and `density="handheld"` are built; offline check-in is later (§9) |
| CX-OPS-REPORTS (L6) | Shipped delivery and audience datasets, a campaign dashboard and alert templates (failure or complaint spike, bounce rate over threshold, uncertain-outcome backlog), a weekly campaign digest schedule, and `operation`/`operation-ref` on the dispatch, automation and registration-expiry jobs; these replace the bespoke operational-measures list (§§11, 15). **Needs:** MKT-REPORT |
| Comms hooks (L8) | `record-lookup` for MarketingCampaign, CampaignSend and EventRegistration; `call-context` answers with the caller's upcoming registrations. Lead creation from chat, mail and voicemail is Sales' `create-from` (Sales §1.4) |
| Templates (L9) | MessageTemplate and send content render with the built `fancy-locked-html` renderer over the allowlisted variables (§5) |

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
| Approvals | Marketing/Campaigns/Approvals | list | xml | Decide assigned Marketing approvals | NotificationMessage; N MarketingDecision | Commons Notifications (§4), crosscut §3.15 | V | new | recipient and topics |
| Lists | Marketing/Audiences/Lists | list | xml | Manage distribution lists | ContactList | own | U | new | list filters |
| ListDetail | Marketing/Audiences/Lists/ListDetail | detail | xml | Maintain list policy and members | ContactList | own | U | new | list ID |
| MemberDetail | Marketing/Audiences/Lists/MemberDetail | detail | xml | Inspect membership and evidence | ContactListParty | own | U | new | list, party, membership date |
| AudienceImport | Marketing/Audiences/AudienceImport | wizard | xml | Preview and import contacts/members | N AudienceImport | own; owner wizard registered in Admin §11's import targets (Z2) | U with MARKETING_AUDIENCE_IMPORT | new | import ID; no raw file in shell |
| AudienceMerge | Marketing/Audiences/AudienceMerge | task | xml | Consolidate lists without changing consent | ContactList | own | U | new | source/target lists |
| Segments | Marketing/Audiences/Segments | list | xml | Find rule and curated audiences | MarketSegment | own | U | new | segment filters |
| SegmentDetail | Marketing/Audiences/Segments/SegmentDetail | detail | xml | Define and explain segment membership | MarketSegment | own | U | new | segment and as-of |
| AudiencePreview | Marketing/Audiences/AudiencePreview | task | xml | Explain eligible and excluded recipients | Q.preview#Audience | own | A, U, D | new | source IDs; aggregate counts |
| Consent | Marketing/Audiences/Consent | list | xml | Inspect and manage consent | PartyConsent | Comms §16 | U | new | authorized party filters |
| ConsentDetail | Marketing/Audiences/Consent/ConsentDetail | detail | xml | Inspect purpose/list consent history | PartyConsent; PartyContactMech | Comms §16 | U | new | party ID |
| Suppressions | Marketing/Audiences/Suppressions | list | xml | Inspect channel blocks and evidence | N MessageSuppression | Suppressions, crosscut §3.29 (Comms owner; defined §4) | U, S | new | channel/reason filters |
| Sends | Marketing/Sends | list | xml | Find email and SMS sends | N CampaignSend | own | app | new | campaign/channel/state filters |
| SendDetail | Marketing/Sends/SendDetail | detail | xml | Review and release a send | N CampaignSend | own | app | new | send ID |
| Compose | Marketing/Sends/Compose | editor | xml | Author campaign email or SMS | N CampaignSend; EmailTemplate | own | A | new | send ID; no recipient body data |
| MessageTemplates | Marketing/Sends/MessageTemplates | list | xml | Choose reusable channel templates | EmailTemplate; N MessageTemplate | MessageTemplates, crosscut §3.29 (Comms owner; defined §5) | A, S | new | kind/channel filters |
| MessageTemplateDetail | Marketing/Sends/MessageTemplates/MessageTemplateDetail | detail | xml | Edit a safe shared template | EmailTemplate; N MessageTemplate | MessageTemplateDetail, crosscut §3.29 (Comms owner; defined §5) | template editors | new | template ID |
| ExperimentDetail | Marketing/Sends/ExperimentDetail | task | xml | Review variants and release a winner | N CampaignExperiment | own | A, V, D | new | experiment ID |
| CampaignDelivery | Marketing/Sends/CampaignDelivery | list | xml | Inspect delivery and exclusions | N CampaignRecipient; Comms delivery ledger | own, defined §5; registered Shared/CampaignDelivery, crosscut §3.29 | D; U for PII | new | send and state filters |
| RecipientDetail | Marketing/Sends/RecipientDetail | detail | xml | Explain one delivery attempt history | N CampaignRecipient; Comms delivery ledger | own | D and U | new | recipient ID |
| Automations | Marketing/Automations | list | xml | Find campaigns' drip sequences | N MarketingAutomation | own | app | new | sequence filters |
| AutomationDetail | Marketing/Automations/AutomationDetail | detail | xml | Author, simulate and activate ordered steps | N MarketingAutomation | own | A, V, D | new | automation ID |
| EnrollmentDetail | Marketing/Automations/EnrollmentDetail | detail | xml | Inspect one participant's execution | N AutomationEnrollment | own | D and U | new | enrollment ID |
| Promotions | Marketing/Promotions | list | xml | Find store promotions linked to campaigns | ProductStorePromotion | Commerce §7, crosscut §3.28 | promotion readers | parity | store/campaign filters |
| PromotionDetail | Marketing/Promotions/PromotionDetail | detail | xml | Edit one store rule and campaign links | ProductStorePromotion | Commerce §7, crosscut §3.28 | promotion editors | parity | store promotion ID |
| PromoCodes | Marketing/Promotions/PromoCodes | list | xml | Find/generate store promotion codes | ProductStorePromoCode | Commerce §7, crosscut §3.28 | promotion editors | parity | promotion and selection |
| PromoCodeDetail | Marketing/Promotions/PromoCodes/PromoCodeDetail | detail | xml | Inspect code limits and use | ProductStorePromoCode | Commerce §7, crosscut §3.28 | promotion readers/editors | parity | code ID |
| Content | Marketing/Content | list | xml | Plan campaign assets and publication links | N CampaignContent | own | app | new | campaign/type filters |
| ContentDetail | Marketing/Content/ContentDetail | detail | xml | Link approved content to campaign outputs | N CampaignContent; WikiPage/WikiBlog | own | A | new | content association ID |
| BlogPosts | Marketing/Content/BlogPosts | list | xml | Find and start blog posts | WikiBlog | own | app; A to create | parity | wiki space, category and date filters |
| BlogPostDetail | Marketing/Content/BlogPosts/BlogPostDetail | detail | xml | Maintain one post's metadata, categories and campaign use | WikiBlog | own | A | parity | wikiBlogId |
| LandingPages | Marketing/Content/LandingPages | list | xml | Find campaign landing pages | PublicSitePage, extended (X14) | Commerce §5 Pages (Shared, X14) | content readers | new | site and campaign |
| PageDetail | Marketing/Content/LandingPages/PageDetail | editor | xml | Author a campaign landing page | PublicSitePage, extended (X14); WikiPage | Commerce §5 PageDetail (Shared, X14) | content editors | new | site/page ID |
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
| SurveyDistribution | Marketing/Surveys/SurveyDistribution | detail | xml | Publish/share a campaign survey or lead form | N FormPublication; N FormInvitation | Commons form publication (X16); first summaries §10 | A | new | publication ID |
| Responses | Marketing/Surveys/Responses | report | xml | Inspect scoped responses and aggregates | FormResponse | Commons owner; Customer Service §7 | U, R | parity | form/publication/date filters |
| ResponseDetail | Marketing/Surveys/ResponseDetail | detail | xml | Read one historical response | FormResponse | Commons owner; Customer Service §7 | authorized response readers | parity | response ID |
| Leads | Marketing/Leads | list | xml | Follow campaign lead handoff | SalesOpportunity | Sales §3 | Sales readers | new | campaign/source filters |
| Accounts | Marketing/Leads/Accounts | list | xml | Add a Sales account's contacts to a list with evidence | Party (account) | Sales §4 | Sales readers; Add to list with A-audience | new | Sales scope |
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
| EmailPreferences | PASS:Account/EmailPreferences | task | xml | Change the recipient's list, topic, channel and forum mail preferences | ContactListToken; PartyConsent | Commons §16, the one PASS Account page (X15); Marketing context §13 | bearer token or signed-in | new | none |
| SubmitForm | PASS:Marketing/SubmitForm | task | xml | Submit a published survey or lead form; the one public lead page | DbForm; FormResponse | own public §13; Sales LeadIntake context | published access policy | new | none |
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
W.get#CalendarItems supplies the other types. The terminal counterpart is the dated agenda. The same
W provider answers a read-only projected CalDAV collection, "Campaign calendar", so the schedule
reaches phones without copying rows into a personal calendar (L2). Mounted at `Marketing/Calendar`;
crosscut §3.13 row:

| App | Tabs or panes shown | Filters fixed | Action set | Emphasis |
| --- | --- | --- | --- | --- |
| Marketing | Campaign windows, scheduled sends, sequence milestones, events and approved publication dates | authorized campaigns and date range | event drag/resize through EventServices; sends open SendDetail for a new approved schedule; read-only projected collection on devices | the campaign schedule |

**Source:** research §§1, 11; Commons §7. **Needs:** MKT-SHELL, MKT-SYNC.

### Campaigns

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| CampaignFind | find | Narrow campaigns | text, owner/team, status, date range, parent | server-search | — | Odoo campaign filters; research §2 |
| CampaignList | list | Compare activity | name, status, dates, budget/actual/currency, manager | list/board by status; calendar by dates | C.find#Campaigns | Odoo campaign kanban; native MarketingCampaign |
| NewCampaign | dialog | Start a plan | name, summary, organization, manager, parent, dates, currency, budget | organization and parent choices | C.create#Campaign | native fields; research §2 |

**Actions:** New, duplicate as a new Planned campaign, archive completed/cancelled records; bulk
owner/date changes preview each result and never approve implicitly. A campaign template is a
campaign duplicated this way: no separate template record. **Needs:** MKT-CAMPAIGN.

**Source:** research §§1–2; Odoo campaign list/kanban and native MarketingCampaign.

### CampaignDetail

Detail with Summary and budget, Audience, Sends, Automation, Content, Tracking links, Promotions,
Events, Results and Activity tabs. The header names the organization and native status. Related
tabs query their own bounded lists; inaccessible source areas are omitted, not fetched and hidden
in the browser. The Tracking links tab is the TrackingLinks list (§8) fixed to the campaign, with
New link.

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
An Accounting source is a purchase invoice item or a ledger entry of the campaign's organization, read
with the reader's own Accounting permission (ACCOUNTING_VIEW, or PAYABLE_VIEW for a payable); neither
carries a campaign today, so the link is the CampaignCost row alone. Accounting's budgets are by GL
account and period and do not apply to a campaign: the campaign budget stays Marketing's own
(impl-marketing F81).
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
write. A single draft cannot be approved twice by concurrent actions. The separation policy
refuses an author's decision on their own draft, with one exception: where MarketingPolicy's
one-person-team flag is on (off by default, §12), an author may approve their own send to fewer
than 500 recipients, and the decision is recorded as a self-approval; at 500 recipients or more
the separation holds (impl-marketing §4, Nov 11). The three topics are seeded with Marketing's
setup data, as the built apps seed theirs, each with a topic registration naming MARKETING_APPROVE
as its audience (impl-marketing F42); their push titles name the campaign or send and never an
audience address. Mounted at
`Marketing/Campaigns/Approvals`; crosscut §3.15 row:

| App | Tabs or panes shown | Filters fixed | Action set | Emphasis |
| --- | --- | --- | --- | --- |
| Marketing | Campaign, send and sequence approvals | MarketingCampaignApproval, MarketingSendApproval and MarketingAutomationApproval of the authorized organizations; current target stamp | approve or refuse through C.decide#MarketingApproval; self-approval only under the one-person-team flag and below 500 recipients (§12) | what will be sent, to how many, and when |

**Needs:** MKT-APPROVAL, MKT-SHELL.

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
AudienceImport is an owner wizard registered in [Admin §11's import targets](design-admin.md#111-shared-transfer-contract)
(Marketing, audience members; Z2): it keeps this wizard and its AudienceImport batch record because
the consent-evidence step is its own, provides `get#` for its runs, and Admin Imports lists them
beside the other domain imports; there is no second transfer batch. The target is `marketingAudience`,
a wizard-mode transfer target with a runs finder and the owner route `marketingAudienceImport`. Its
import permission is MARKETING_AUDIENCE_IMPORT and no `ADMIN_*` permission (impl-marketing §4, Nov
11): L.preview#AudienceImport and L.apply#AudienceImport check it beside MARKETING_AUDIENCE_EDIT
and the organization, so an audience editor without it cannot import; the runs finder answers by
MARKETING_AUDIENCE_VIEW and the organization, and Admin's Imports lists a run for a data operator
who also holds that view permission. The membership export is a rows-mode export target that asks
MARKETING_AUDIENCE_EXPORT alone.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ImportFile | wizard step | Stage input and map columns | file, encoding, name/address columns, target list, organization | file picker; bounded sample | L.preview#AudienceImport | Commons ContactImport |
| ImportEvidence | wizard step | Classify consent evidence | source, original date, purpose, evidence column/text, accept-or-request | explicit consent choice | L.preview#AudienceImport | research §3 |
| ImportMatches | list | Resolve permitted matches | row, normalized address, existing party, duplicate, proposed action, exclusions | scoped choice; no external private matches | L.preview#AudienceImport | Commons match preview |
| ImportResults | list | Report independent outcomes | row, party/member, applied/skipped/failed, reason | download error rows, retry failures | L.apply#AudienceImport, L.get#AudienceImport, L.find#AudienceImportRuns | Commons ContactImport |

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

Comms owns this reusable definition (registry `Shared/Suppressions`); Marketing supplies
organization/channel scope. The record is the proposed Comms `MessageSuppression`, and G is the
Comms package `mantle.party.MessageServices` (§14.2), not a Marketing one. Marketing builds the
`Shared/` file for Comms and has the only mount at first: Comms has no settings area yet, so its
own mount comes later with one (impl-marketing §4, F16). The same holds for MessageTemplates,
MessageTemplateDetail, SendingProfiles and CampaignDelivery (§§5, 12).

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| SuppressionFind | find | Narrow blocks | channel, reason, active, changed period | typed reasons | — | Odoo blacklist; Twenty suppression reasons |
| SuppressionList | list | Explain blocked delivery | masked destination, reason, source event, since/until, review state | history link | G.find#Suppressions | research §§3–4 |
| SuppressionChange | dialog | Add or review a block | destination, channel, reason, source evidence, effective dates, action | named confirmation; privileged clear | G.store#Suppression | research §3 |

Complaint/hard-bounce suppression is destination-scoped, independent of list membership. A new
subscription does not clear it. Only a shared suppression-review permission with new evidence can
end a block; the original delivery fact remains. Provider-level blocks apply across authorized
profiles without revealing another organization's campaign details. Soft failure retries are
bounded by sending policy and can produce a temporary suppression. Blocks come from three sources:
provider callbacks, the bounce and complaint email ECA that reads DSN (RFC 3464) and ARF
(RFC 5965) reports arriving at the per-execution VERP Return-Path (§15), and staff entry with
evidence. **Needs:** MKT-CONSENT, MKT-TRANSPORT.

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
execution identity. The SMS channel is offered only once the SMS stage has shipped and a sending
profile reports SMS ready (§17). **Source:** research §§2, 4. **Needs:** MKT-SEND, MKT-TEMPLATE.

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

Campaign approval, content approval and dispatch permission are separate. Under the one-person-team
flag (§12) the author of a self-approved send to fewer than 500 recipients may also release it;
with the flag off, or at 500 recipients or more, approval and release stay with other people. An
approved campaign is required for promotional sends; a sending profile must be ready. Pause/cancel stops new claims;
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

Variables render with the built framework `fancy-locked-html` renderer over a plain snapshot of the
allowlisted values; no arbitrary template evaluation, service call, record access or
caller-provided bodyParameters map. The editor offers the built inline text actions (Rewrite,
Shorten, Translate, Grammar); generated text is a draft like any other and still needs approval.
Required unknown variables block preparation;
optional ones have declared safe fallbacks. Personalized preview requires audience-data rights;
authors without those rights use synthetic samples. Test sends use an explicit, bounded test
recipient allowlist and never consume the live audience, experiment or conversion counts.
Attachments are checked for authorization, scanning and recipient access; a private staff URL
cannot be inserted as a publicly retrievable asset. Stored body/subject changes are audit-logged.
**Actions:** Save, Preview, Test, Request approval. **Devices:** XML terminal fields provide plain
text and structured HTML/source editing with the same validation. **Needs:** MKT-TEMPLATE, MKT-SEND.

**Source:** research §4; Twenty CampaignComposer, Odoo preview/test and shared Comms rich-text controls.

### MessageTemplates

Comms owns one shared template library (registry `Shared/MessageTemplates`), mounted here at
`Marketing/Sends/MessageTemplates` with campaign/channel filters. These are the first full form
summaries for that library; Comms Settings mounts the same definition later, when Comms has a
settings area (§4 Suppressions). Content renders with `fancy-locked-html`.
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

### MessageTemplateDetail

Registry `Shared/MessageTemplateDetail`, mounted at `Marketing/Sends/MessageTemplates/MessageTemplateDetail`.

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

### CampaignDelivery

This Marketing-owned execution projection is registered as `Shared/CampaignDelivery` and mounted
here at `Marketing/Sends/CampaignDelivery`; Comms mounts it with organization/send scope later
(§4 Suppressions).
It does not replace the personal mailbox's message reader or outbox. Its rows join CampaignRecipient
(the selection) to the one Comms delivery ledger (X8), which holds every attempt, receipt and
outcome; Marketing keeps no attempt or receipt store of its own.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| DeliveryFind | find | Narrow outcomes | send, variant, state, reason, period, channel | status chips | — | Odoo mailing traces |
| DeliveryRows | list | Inspect executions | masked recipient, queued/accepted/delivered/failed, latest event, attempts, reason | selected failures and detail links | D.find#Recipients | ContactListCommStatus; Odoo traces |
| RetryRecipients | list, bulk | Retry known failures | selected recipients, eligibility changes, count | result preview/confirmation | D.retry#Recipients | Odoo retry failed |

Transport acceptance, delivery, open and click are distinct facts; an open does not overwrite a
bounce state. Unknown outcomes have Reconcile, not Retry. D.retry#Recipients asks the ledger to retry
its known retryable attempts; the ledger's one retry rule applies. Non-PII operators see opaque
execution identities/reasons and aggregate counts. **Source:** research §4.
**Needs:** MKT-SEND, MKT-TRANSPORT; CX-DELIVERY.

### RecipientDetail

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Recipient | display | Explain selected identity and eligibility | topic, party/address, selected at, consent decision, variant, current state | authorized links | D.get#Recipient | native ContactListCommStatus; research §4 |
| Attempts | list, read | Inspect immutable transport facts from the delivery ledger | attempt, claim, submitted, provider/message ID, receipt or DSN/ARF report, error, uncertain | chronological trace | D.get#Recipient | Odoo mailing trace |
| ResolveDelivery | dialog | Record authoritative recovery evidence | outcome, provider reference, evidence, reason, expected stamp | confirmation | D.reconcile#Recipient, which records the outcome on the ledger attempt | new; fields here plus recipient, actor/time and operation key |

Reconciliation requires provider-query evidence or operator-confirmed investigation; SMTP delivery
is never exactly-once. Body access is separately controlled and token URLs/secrets are
redacted from logs and trace exports. **Needs:** MKT-SEND, MKT-TRANSPORT; CX-DELIVERY.

**Source:** research §4; Odoo per-recipient traces and current ContactListCommStatus.

## 6. Automation

### Automations

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| AutomationFind | find | Find sequences | campaign, state, owner, channel | — | — | ERPNext Email Campaign |
| AutomationList | list | Inspect enrollment work | name, state, active/completed/stopped, next due, failures | detail links | N.find#Automations | research §2 |
| NewAutomation | dialog | Start a sequence | name, campaign, topic, trigger (including order placed and cart abandoned), description | bounded trigger choices | N.create#Automation | ERPNext campaign schedules; Commerce CartRecovery |

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

First-release step kinds are Send email, Wait and Condition; Send SMS joins with the SMS stage
(§17). Condition either continues, skips the next send step or ends the enrollment; there are no
loops or arbitrary jumps. A sequence has a bounded maximum step count from configuration. Triggers
are confirmed subscription, newly eligible segment member, explicit published form submission,
registration/attendance, staff enrollment with evidence, and two commerce triggers (MKT-R03):
order placed (first or repeat order of a consented customer, from the `OrderPlacedRecordAttribution`
SECA's one handler, K `handle#OrderPlaced`, which files the admission event and records the
attribution, §11) and cart abandoned (the same source event Commerce cart recovery uses). A store's
recovery policy names one sender per cart, Commerce's built-in recovery or a Marketing automation;
both are sources of the Comms delivery ledger, which deduplicates by cart and recipient, so a cart
never gets two recovery mails. Segment admission runs on a scheduled difference scan. Source event
IDs and a unique automation/party/trigger identity prevent duplicate enrollments.

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
not as an unbounded burst. Send steps create ordinary CampaignSend/recipient executions on the
delivery ledger, so they share approval, receipt, retry and suppression behavior. The automation approval authorizes only
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

The list shows every asset a campaign uses: blog posts, landing pages, wiki pages and files.
Marketing authors blog posts itself (BlogPosts, BlogPostDetail below) over the framework WikiBlog,
landing pages through the shared Pages screens, and wiki bodies through Commons Knowledge. The
future PASS Publishing app adds the editorial workflow (assignments, stages, scheduled release),
article taxonomy and public blog rendering; it reuses these records. **Needs:** MKT-CONTENT.

**Source:** research §6; Odoo content curation and current WikiBlog/WikiPage metadata.

### ContentDetail

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ContentLink | single | Maintain campaign use | campaign, source, purpose, intended date, effective dates | source record link | T.store#CampaignContent | research §6 |
| PublicationReadiness | display | Explain usable content | title/summary, review state, approved version, public binding, schedule, audience | read-only owner projection | T.get#CampaignContent | Commons review; PASS Forum §13.3 |
| Distribution | list | Connect content to delivery | send, template, list/topic, scheduled date, completion | create draft send | D.create#Send; T.get#CampaignContent | ContactListEmail/WikiBlogCategory hook |

Edit body opens the shared Knowledge mount; a blog post opens BlogPostDetail; page properties open
the shared PageDetail. Request review uses the existing wiki review flow; only the owner-approved
version may be publicly bound.
A planned date is not a release instruction. Campaign sends neither set WikiBlog.publishDate nor
WikiPage.publishedVersionName. The existing WikiBlogCategory.sentDate is not a sufficient delivery
ledger for retries or multiple audiences; record content/send association and recipient outcomes.
Newsletter assembly chooses approved category content as of preparation and retains its source
version references. **Source:** research §§6, 12; PASS publishing contract.
**Needs:** MKT-CONTENT, MKT-SEND.

### BlogPosts

**Layout.** List of WikiBlog posts in the wiki spaces the user may read, newest first, with a
Campaign filter that narrows to posts linked through CampaignContent. Two creation dialogs as in
the baseline: a post with new text, which creates its wiki page, and a post from an existing page.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| BlogPostFind | find | Narrow posts | title, author, wiki space, category, publish period, campaign | date-period; category and space choices | — | Wiki/WikiBlogs WikiBlogList header fields |
| BlogPostList | list | Open and compare posts | publish date, title, author, categories, wiki space, campaign uses, public link | title links to BlogPostDetail; wiki page link; public link when the space has a `publicBlogUrl` | T.find#BlogPosts over `moqui.resource.wiki.WikiBlogFindView`, limited to spaces from existing `org.moqui.resource.WikiServices.get#UserWikiSpaces` | Wiki/WikiBlogs WikiBlogList |
| NewBlogPost | dialog | Start a post with its text | wiki space, title, publish date, author, summary, small image, body | Knowledge body editor for the body; image upload | existing `org.moqui.resource.WikiServices.create#WikiBlog` with `blogText` | Wiki/WikiBlogs AddBlogText |
| NewBlogPostFromPage | dialog | Make a post from an existing page | wiki space, wiki page, title, publish date, author, summary, small image | page lookup with server search within the space | existing `create#WikiBlog` with `wikiPageId` | Wiki/WikiBlogs AddBlogPage |

`create#WikiBlog` needs either body text or a page and refuses a title outside its allowed
characters; the dialogs show that rule. Creating a post needs MARKETING_CONTENT_EDIT and write
access to the wiki space; reading follows the space's access. **Actions:** New post (primary for
A), New from page, open, Link to campaign. **Source:** research §6; baseline Wiki/WikiBlogs.
**Needs:** MKT-CONTENT.

### BlogPostDetail

**Layout.** Detail; header with title, publish date, author and the public link; sections Post,
Body, Categories and Campaign use. Body is the Commons Knowledge editor mounted on the post's wiki
page, so writing, co-editing, history and review are the wiki's, and the published version of the
page is what a public blog shows.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| BlogPost | single | Maintain post metadata | title, publish date, author, summary, meta keywords, meta description (160 characters), small image, wiki space, wiki page | image upload with thumbnail; page lookup by space | existing `org.moqui.resource.WikiServices.update#WikiBlog` | Wiki/EditWikiBlog EditBlogForm |
| BlogPostBody | component | Write and review the body | page body, version, review state | Commons Knowledge editor (`.qvue`, co-editing) | existing `update#WikiPage`, `request#WikiPageReview`, `decide#WikiPageReview` | Commons Knowledge; Wiki/EditWikiPage EditPageForm |
| AddCategory | dialog | Put the post in a category | category | WikiPageCategory choice | T.add#BlogCategory over `create#moqui.resource.wiki.WikiBlogCategory` | Wiki/EditWikiBlog AddCategory |
| Categories | list | Show and remove categories | category, sent date | remove with confirmation | T.remove#BlogCategory over `delete#moqui.resource.wiki.WikiBlogCategory` | Wiki/EditWikiBlog CategoriesForm |
| CampaignUse | list | Link the post to campaigns and sends | campaign, use, intended date, linked send and its state | create draft send from the post | T.store#CampaignContent; D.create#Send | ContentDetail LinkContent and Distribution |

The T category services check write access to the post's wiki space before the entity write,
which the baseline's raw entity transitions did not. Public listings (the space's blog URL now,
PASS Publishing later) show a post only from its publish date, and the page's review decides which
body version is public. A campaign
send never sets `publishDate` or the page's published version, and `WikiBlogCategory.sentDate` is
not a delivery record: the newsletter send and its recipients are. **Source:** research §6;
baseline Wiki/EditWikiBlog. **Needs:** MKT-CONTENT, MKT-COLLAB.

### LandingPages and PageDetail — Context passed

Mount the shared Pages and PageDetail screens (Commerce §5 defines them; registered as `Shared/`
screens, X14) with permitted PublicSite, campaign content association, return link and publication
capabilities. They work over the extended `PublicSitePage` and `get#SitePage`/`publish#SitePage`,
which gain a mount, route, locale and publication window (role optional), so a storeless campaign
landing page is an ordinary site page: no store, no Shop-named page record. Reuse the WikiPage body,
version-bound binding, sanitized renderer, SEO fields, navigation and isolated previews. The first
release never requires a ProductStore to collect a lead or subscriber. A page embeds a published
Marketing form/list/event component by registered ID, never a raw service/entity endpoint. Theme
editing stays Commerce-owned and needs its own grant. Crosscut row:

| App | Tabs or panes shown | Filters fixed | Action set | Emphasis |
| --- | --- | --- | --- | --- |
| Marketing | Pages of permitted sites with a campaign link; page body, SEO, route and window | permitted sites; campaign when opened from one | create, edit, preview, request review, publish with the content grant; no theme edits | storeless campaign pages that convert |

**Source:** research §6; Commerce §5. **Needs:** MKT-CONTENT, MKT-PUBLIC.

### Knowledge — Context passed

Mount Commons Knowledge with the authorized wiki page/space, selected campaign content link and
existing wiki author/reviewer permissions. Use current `org.moqui.resource.WikiServices.get#WikiPageInfo`,
`update#WikiPage`, `request#WikiPageReview` and `decide#WikiPageReview` through the Commons owner.
Marketing cannot publish a private space merely by linking it. The existing terminal editor and
file access rules apply. Blog post bodies use this same mount from BlogPostDetail.
**Needs:** MKT-CONTENT, MKT-COLLAB.

### TrackingLinks

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| LinkFind | find | Find links | campaign, type, source, medium, active dates | typed filters | — | Odoo Link Tracker |
| LinkList | list | Inspect targets and observations | description, destination, campaign, code, visits/clicks | copy public URL/QR | K.find#TrackingLinks | native TrackingCode; research §9 |
| NewLink | dialog | Create a campaign link | description, registered destination, campaign, type, source, medium, content tag, dates | URL preview | K.store#TrackingLink | Odoo link builder |

**Needs:** MKT-TRACKING. **Source:** research §§6, 9.

### TrackingLinkDetail

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| LinkDefinition | single | Maintain target and validity | description, URL, campaign, type, group/subgroup, UTM fields, lifetimes, dates | explicit destination validation | K.store#TrackingLink | TrackingCode; Odoo Link Tracker |
| LinkOutput | display | Distribute the link | canonical public URL, QR, campaign/source labels | downloadable QR from the built barcode helper (`ec.resource.barcodeSvg('QR', …)`) | K.get#TrackingLink | Odoo QR download |
| LinkObservations | list, read | Explain observations | period, unique observed clicks/visits, consent coverage, suspect automation | authorized aggregates | R.get#TrackingLinkResults | research §9 |

Use registered HTTPS destinations or same-site published paths, with a privileged external-domain
allowlist; public requests cannot supply an arbitrary redirect URL. Disabled/expired links show a
neutral unavailable state or their explicitly configured safe destination, not a caller-provided
fallback. Generic campaign links never contain party IDs. Personalized opaque link tokens carry
recipient/link scope through server lookup, are redacted from logs and expire under policy.

Tracking requires applicable tracking consent, recorded under a proposed `PcpTracking` value of
PartyConsentPurpose (today PcpMarketingEmail, PcpSms, PcpPhone and PcpDataProcessing exist, with
Commerce's store purposes PcpCartReminder and PcpReviewRequest, which stay Commerce's topics and
are not Marketing topics; impl-marketing F10);
a no-tracking recipient receives direct links and no pixel. Public page visits honor site tracking
choices independently of mailing consent. A fetch by a scanner is not a form submission, consent
grant, order or verified human conversion. Store observed clicks separately from confirmed
outcomes, identify known automated requests when possible and label the residual uncertainty.

**Capture on the authority (X10).** A remote PASS keeps its sessions and `moqui.server.Visit` rows on
the frontend, so `TrackingCodeVisit` (keyed on `visitId`) cannot be the basis. The redirect, the
pixel and every PASS page with a tracking code call `K.record#TrackingEvent` through the PASS facade
on the authority, with the tracking code and an opaque visitor key (a first-party cookie value,
never a party ID); it writes the proposed MarketingTrackingEvent. `TrackingCodeVisit` is still
written when the request has a local visit. Marketing owns the `Marketing.Visits` metric over these events.
The redirect, pixel and signed provider-callback handlers are web scripts of mr-pass, on the
framework's web-script mechanism ([Web-Scripts](../../../../../docs/interfaces/Web-Scripts.md)), that
call K; they are not framework files, since the framework names no Mantle service, and not BOSS
screens (impl-marketing §4, F55). At order
placement the attribution writer of §11 reads these events. **Needs:** MKT-TRACKING, MKT-CONSENT, MKT-PUBLIC.

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
selection, never one seat count silently shared across every date. An online occurrence gets a
CallLink through EventDetail's "Add video call" (L7); registration confirmations carry the link,
and `send#EventInvitations` invites by iMIP. Attendance from the call's legs is later; check-in
stays the attendance fact. Crosscut §3.13 row for this mount at `Marketing/Events/EventDetail`:

| App | Tabs or panes shown | Filters fixed | Action set | Emphasis |
| --- | --- | --- | --- | --- |
| Marketing | Event, occurrences, location or video link, plus Registration setup, Registrations and Check in tabs | WetEvent linked to an authorized campaign | Commons event actions under their permissions; registration actions under MARKETING_EVENT_MANAGE | capacity and attendance |

**Needs:** MKT-EVENT, MKT-COLLAB.

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

**Ticket orders are storeless by default.** A paid registration places a native sales order whose
seller is the event's organization, with no ProductStore: tax comes from the organization's tax
gateway through the X1 fallback, and no store promotion applies. When RegistrationPolicy names a
store, the order is a store order and takes that store's tax gateway and promotions. Payment goes
through Accounting's typed PortalPaymentAttempt coordinator with purpose `eventRegistration` (X9);
E.start#RegistrationPayment is a thin wrapper that creates the attempt for the held order and
returns the hosted-payment step. The rules on that order:

| Rule | On a ticket order |
| --- | --- |
| `OrderPlacedAutoApprove` (`service/OrderReturn.secas.xml`) | Kept. It and the attempt's own authorization both approve through `mantle.order.OrderServices.autoApprove#Order`, never a status write: the order approves once the attempt's authorized payment covers the total, unless the seller's Sales approval setting is on (below) |
| `OrderPlacedStoreConfirmation` (same file) | Kept: it stores the order confirmation as placed where the organization's `orderConfirmationOnPlace` is on (impl-marketing F29); Marketing's registration receipt is separate |
| `OrderPlacedAuthorizePayments` (`service/AccountingPayment.secas.xml`) | Kept, no effect on a storeless ticket order: `authorize#OrderPayments` returns for an order with no store, so the attempt's own authorization approves it (impl-marketing F29); on a store ticket order it authorizes the payment the attempt created |
| `OrderApprovedFulfillSubscriptions` (`service/ProductSubscription.secas.xml`) | Kept, no effect: ticket products carry no ProductSubscriptionResource |
| `OrderPlacedSendEmail`, `OrderApprovedSendEmail` (same file as auto-approve) | No-op on a storeless ticket order (`send#OrderStoreEmail` returns without a store); a store ticket order sends the store's order mail. Either way Marketing's registration receipt, a delivery-ledger source, carries the entry credential |
| `OrderPlacedReserveAssets`, `OrderApprovedReserveAssets` (`service/ProductAsset.secas.xml`) | No effect: ticket products are not inventoried; capacity is the registration hold |
| proposed `OrderPlacedRecordAttribution` | Runs: the registration's campaign is the attribution evidence (§11) |

**Where the seller's approval setting is on.** The organization's SalesPolicy approval setting is
respected for a ticket order as for every sales order of that seller, whichever app placed it
(impl-marketing §4, impl-sales §4, Nov 11; [Sales §5](design-sales.md#5-quotes-and-requests-for-quote)). The
check is in `autoApprove#Order`, so the paid order is not auto-approved: it stays Placed, in Sales'
Awaiting approval list, until a holder of `SALES_ORDER_APPROVE` approves it. The registration and
the ticket follow the approval, not the payment. The verified payment keeps the held place, which
no longer expires, and the registration stays pending; the registrant sees it as pending, payment
received and awaiting the organizer's confirmation, with the receipt and with no ticket, entry QR
or event link. The order's approval confirms the registration and sends the ticket and its notice,
once. An order cancelled instead cancels the registration, releases its capacity once and hands
the refund to Accounting, shown pending. With the setting on, pre-approval warnings are shown to
the person approving in the UI only. With the setting off, its default, the attempt's authorization
approves and confirms at once, unless the order carries a pre-approval warning, which blocks the
auto-approval as for any order: the registration then waits for the approval in the same way. A
free registration places no order and confirms as before.

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
| EntryLookup | single | Locate the entry credential | selected event/occurrence, scanned code or attendee lookup | built `scan-input` (keyboard-wedge or typed) on a `density="handheld"` screen | E.preview#CheckIn | Odoo registration desk |
| EntryDecision | display | Explain eligibility | attendee, ticket, event, confirmed/paid/used/cancelled | clear eligible/blocked state | E.preview#CheckIn | research §7 |
| RecordEntry | single | Confirm attendance | registration, credential, expected stamp, operation key | primary Check in | E.checkIn#Registration | Odoo barcode check-in |

Check-in is online in the first release; offline mode is later, on moqui-browser under CX-DEVICE.
There is no camera scanning: `scan-input` takes a keyboard-wedge scanner or typed code, and the
framework has no camera decoder, so a phone without a wedge scanner uses attendee lookup. Staff
check in under their own sign-in; a shared door tablet uses the CX-DEVICE device credential limited
to the CheckIn route group, with an idle timeout: a display account holding only the check-in
permission of a device group, on People's clocking kiosk pattern (impl-marketing F83). Duplicate scans return the first attendance
result. Wrong-event, cancelled, expired or unconfirmed tickets cannot enter; manager overrides
require a reason and never fabricate payment. TUI supports typed/scanned codes; phone layout shows
the action and attendee without horizontal scrolling. **Needs:** MKT-EVENT; CX-DEVICE.

**Source:** research §7; Odoo registration desk/barcode interaction.

## 10. Surveys, leads and engagement

### Surveys and SurveyDetail — Context passed

Commons owns one DbForm survey builder. Its current canonical form summaries are Customer Service's
FeedbackForms/FeedbackFormDetail in [§9](design-customer-service.md#feedbackforms); Marketing mounts
them at the two paths in §2 with organization, marketing purpose, author/read grants and campaign
return link. The four shared survey screens read a per-app context registration, and the form
definition services are `mantle.party.FormDefinitionServices`; People, the second app to mount the
builder, makes both (impl-people P16), and Marketing adds its own registration, the public
purposes lead and registration, and option scores (impl-marketing §4, Nov 11). Keep NewSurveyForm, SurveyList, EditSurveyForm, group grants, fields, options and
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

There is one form publication and invitation model, the proposed Commons-owned FormPublication and
FormInvitation over `ExternalAccessCapability` (X16); Customer Service's case surveys use the same
records with case scope. These are their first full form summaries; Marketing supplies campaign,
site and audience context, and its F services are thin wrappers that add the campaign and
promotional-eligibility checks.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| FormPublication | single | Configure campaign distribution | form, purpose survey/lead/registration, campaign, site, open/close, anonymous/invited/account, repeat policy; for lead: default source and team queue | typed publication policy | F.store#Publication | Frappe Web Form; research §8 |
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
Marketing adds one bulk action on Sales Leads and Accounts (mounted at Marketing/Leads and
Marketing/Leads/Accounts, and on Sales' own), "Add to list (evidenced)", which files
L.request#Subscriptions for each selected contact with the chosen topic and evidence; it shows only
with MARKETING_AUDIENCE_EDIT and never subscribes directly. Crosscut §3.29 row:

| App | Tabs or panes shown | Filters fixed | Action set | Emphasis |
| --- | --- | --- | --- | --- |
| Marketing | Sales Leads list with source form, event or send | authorized campaign/source and the user's Sales visibility | Sales' lead actions by Sales grant; Add to list (evidenced) | campaign handoff into the pipeline |

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

The handoff calls Sales' proposed `mantle.sales.OpportunityServices.store#LeadIntake`, which Sales
builds in its first stage (Sales S1, X16) with first-release routing to the fixed team queue the
rule or publication names; rule-based assignment is Sales later work. Marketing owns distribution
and rule scheduling; Sales owns the intake record, opportunity creation, routing, duplicate policy
and outcomes. The one public lead page is PASS SubmitForm (§13); Sales' LeadIntake is a context of
it (X15). **Needs:** MKT-LEAD, MKT-FORMS, MKT-PUBLIC; SAL-CRM.

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
attempted. Party merges go through Commons Duplicates and Mantle `merge#Parties`, whose guards
(X15) move or refuse PartyConsent, list membership, registrations and Marketing execution links;
Marketing adds no merge path, and its list merge does not merge parties. Marketing registers a
privacy provider with Admin's privacy coordination (X15), later, when Admin's PrivacyServices and
the PASS Account privacy page exist (impl-marketing §4, F37), for consent and membership history,
suppressions, recipient executions, tracking events, form submissions and registrations: it finds
and exports a subject's records and anonymizes what policy allows, while consent evidence and paid
registrations keep what the law and Accounting require. Requests arrive through the one PASS
Account privacy page. **Source:** research §11; crosscut §§3.1–3.2. **Needs:** MKT-REPORT, MKT-CONSENT, MKT-COLLAB.

## 11. Reports

### Reports

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ReportCatalog | list | Select a report | report name, description, available scope/readiness | links to reports below | R.get#ReportCatalog | Sales Reports; research §9 |
| ReportDefaults | find | Carry common context | organization, date range, campaign, currency, as-of | date-period | — | shared report options |

Marketing supplies read models and widgets that Insights can consume and registers these reports
with the Insights catalog (Z10); it does not require Insights for them. All reports offer
accessible tables, charts when existing widgets suffice and exports from the identical authorized
query. No arbitrary pivot query engine is introduced.

**Metric owners (X11).** Marketing defines the registry metrics `Marketing.Visits`
(MarketingTrackingEvent on the authority, §8) and `Marketing.AttributedOrders` (the primary
attribution of an outcome). Orders are Sales' `Sales.Orders` and `Sales.OrderValue` and invoiced
revenue Accounting's `Accounting.InvoicedRevenue`, the IDs Insights registered (impl-marketing
F34; they replace the `orders.placed` and `revenue.invoicedNet` this file cited); Marketing
reports cite those IDs and never redefine them. The campaign → visit → lead → opportunity → order → revenue funnel is Insights'. The
attribution model is Marketing's, including a later multi-touch model over the same tracking events.

**Shipped definitions (L6).** Marketing ships delivery and audience datasets, a campaign dashboard,
alert-rule templates (failure or complaint spike, bounce rate over a threshold, uncertain-outcome
backlog older than N hours) and a weekly campaign digest schedule; dispatch, automation and
registration-expiry jobs declare `operation`/`operation-ref`. These replace a bespoke
operational-measures list (§15.3). **Needs:** MKT-REPORT.

**Source:** research §9; Odoo reporting hubs and ERPNext Campaign Efficiency.

### CampaignPerformance

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| PerformanceFind | find | Define the comparison | organization, campaigns, period, currency, include children, as-of | explicit basis labels | — | research §9 |
| Performance | list, read | Compare plans and facts | budget/estimate/actual, distinct reach, accepted sends, visits, leads, orders (`Sales.Orders`), invoiced net (`Accounting.InvoicedRevenue`) | source drill-down; grouped currency | R.get#CampaignPerformance | Odoo campaign counters; ERPNext Campaign Efficiency |
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
| OptOutReasons | list, read | Explain why people leave | reason, count, share of withdrawals, list/topic | table-backed chart | R.get#AudienceGrowth | Odoo mailing opt-out reasons |

Membership and suppression are separate measures. Opt-out reasons come from the reason a recipient
picks on the Email preferences page, stored in the existing `PartyConsent.comments` of the
withdrawal. A list merge is a movement, not net audience
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
An explicit validated form/event source sets the opportunity's primary campaign at capture, and
Sales intake writes the native SalesOpportunityTracking join. **The writer (X10):** a proposed
Mantle SECA `OrderPlacedRecordAttribution` (tx-commit, on order placement, registered in crosscut
§1.3) calls its one handler, Marketing's proposed `mantle.marketing.TrackingServices.handle#OrderPlaced`,
for every placed sales order, whether from Shop checkout, Sales acceptance, direct entry or a
ticket. The handler files the automation's order-placed admission event (§6) and calls
`record#OrderAttribution`; the SECA never calls the writer directly (impl-marketing §4, Nov 11).
The writer chooses the most recent eligible consented tracking event for the order's visitor key or party
within its trackable lifetime; ties use tracking code ID. If none exists, it uses the explicit source
opportunity's campaign. It writes TrackingCodeOrder and the MarketingOutcomeLink; a failure is
logged and retried by the job, never undoing the placement. Persist
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
| MarketingPolicy | single | Set organization defaults | currency source, default roles, consent policy, approval/separation policy, one-person-team self-approval flag, audience limit, retention, frequency caps | effective dates; policy explanation | C.store#MarketingPolicy | native campaign defaults; shared policy pattern |
| PolicyPreview | display | Explain impacts | affected drafts/approvals, missing prerequisites, effective date | bounded preview | C.preview#MarketingPolicy | Accounting effective policy pattern |

Approval thresholds may choose assigned approvers; all live promotional sends require approval,
including the defined content of automated steps. The one-person-team flag, off by default, lets
an author approve and release their own send to fewer than 500 recipients, recorded as a
self-approval; at 500 or more, and with the flag off, the author never decides their own
(impl-marketing §4, Nov 11; §3 Approvals). Admin cannot relax withdrawn consent or provider
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
TrackingCode.groupId/subgroupId; preserve those native fields. Sales' UtmSourceMap maps these
source and medium values to a lead DataSource at intake (Sales §9, X10). Seeded lifecycle IDs are
not editable labels pretending to define a new workflow. **Needs:** MKT-CAMPAIGN, MKT-TRACKING.

**Source:** research §§9–10; Odoo UTM dictionaries, native ContactListType/TrackingCodeType and Sales lead sources.

### LeadSources — Context passed

Mount Sales LeadSources, preserving its single editor, effective organization/source bindings and
its UtmSourceMap. Marketing offers permitted campaign/TrackingCode references and its UTM
vocabulary, and the shared Sales source editor supplies permitted Sales lead sources. Campaign
dictionaries never create duplicate Sales sources by matching labels. **Source:** research §§9–10;
Sales §9. **Needs:** MKT-LEAD.

### SendingProfiles

Comms owns this shared business settings surface; this section defines its additional form summaries.
Marketing builds it as a `Shared/` file with its own mount; Comms' mount waits for a Comms settings
area (§4 Suppressions). Sending-profile readiness is one of the checks of Marketing's readiness
provider (§14.3).
Admin alone manages domains, DNS, relay/gateway credentials, callback endpoints and secrets. A profile
refers to operator-approved infrastructure and exposes readiness, not editable secrets or host URLs.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Profiles | list | Inspect approved senders | name, channel, sender, organization, purpose, readiness, limits | readiness details | G.find#SendingProfiles | Twenty emailing domains; Comms identities |
| SendingProfile | single | Bind permitted business use | name, organization, channel, infrastructure binding, sender/reply-to, purpose, throttle, quiet hours/zone, tracking policy, dates | allowlisted infrastructure choice | G.store#SendingProfile | research §10 |
| SenderReadiness | display | Explain dispatch blockers | domain/sender verification, transport available, receipt support, bounce address (VERP domain and mailbox), unsubscribe endpoint, permitted site, last check | refresh through Admin-owned checker | G.check#SendingProfile | Twenty DNS verification |

Unverified or unavailable channels cannot release live sends. Email supports configured direct SMTP
or relay through existing framework transport; the domain/signing/readiness checks are a framework/
Admin extension, not an assumption that a configured From is verified. An email profile names its
bounce domain: each recipient execution sends with a VERP Return-Path (`bounces+<execution key>@`
that domain), which reaches a hosted bounce account through the SMTP listener's plus-tag lookup,
and readiness checks that the account exists. SMS is not an adapter of Marketing's: it is the
framework's C4-SMS in `moqui-channels`, built with Comms C1
([Comms-Framework §7](../../../../../plans/archive/Comms-Framework.md#7-order)), with STOP and START kept by
the framework; SMS is in the build as its last stage (M8, §17). An SMS profile is bound to one of
the organization's messaging numbers and reports ready only with a messaging bridge. The ledger's
attempt checks `PcpSms` consent on the send's topic and the suppression before the call, as for
email; the framework's `sms-consent` hook carries only the two numbers, so Mantle's answer to it
is yes only for a number whose party holds `PcpSms` consent with the organization that owns the
sending number and has no suppression (impl-marketing F57). A STOP becomes a `PcpSms` withdrawal
and a suppression; a START ends neither without new evidence. Segment and cost estimates show
before approval; a receipt after the hand-off is recorded where the bridge reports one. Country
code comes from the actual address/configuration, not a default. Provider selection is deployment configuration; the channel stays a Comms
provider, so WhatsApp and other C4 channels can join later without a Marketing change.
**Needs:** MKT-TRANSPORT, MKT-CONSENT, MKT-TEMPLATE.

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
`marketing.verifySubscription`, `marketing.getForm`, `marketing.submitForm`, `marketing.getEvent`,
`marketing.reserveRegistration`, `marketing.completeRegistration`,
`marketing.startRegistrationPayment`, `marketing.getRegistration` and
`marketing.cancelRegistration`. They map to P in §14.2. Preferences and unsubscribe are not
Marketing operations: the one PASS Account Email preferences page serves them (X15). The payment
result is read through `marketing.getRegistration`, which reports the attempt's state from
Accounting's coordinator; there is no Marketing payment-result operation (X9). Marketing
landing-page rendering uses the shared registered page renderer. Tracking redirect/pixel and
signed provider callbacks are web scripts (the framework's mechanism; the scripts are mr-pass's,
registered by a conf of mr-pass's own, impl-marketing F55, F79) calling K, not BOSS screens or operations a
page offers (§8). A remote frontend has no Mantle, so a script reaches K through PASS's transport as
pages do, by two schema operations of its own whose only fields are the code or token, the visitor key,
the site and the kind; the destination always comes from the authority.

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
accepted subscriber. A public subscriber is a Party from the request: it makes or matches one
without disclosing which, because list membership and a ledger delivery are keyed by party
(impl-marketing §4, F43); there is no address-only subscriber. Confirmation checks purpose, address, list, site and request identity, records
new evidence and accepts only the requested topics. Replays return the same result without
resending or regranting a later withdrawal; a new request is needed after withdrawal. Existing
`optInVerifyCode` alone is not exposed as a durable public bearer secret. Confirmation messages
are rate-limited verification traffic, not a way to send arbitrary promotional content.

The Shop checkout opt-in records through the same `P.request#Subscription` (X15): Shop's
`shop.submitCheckout` calls it with source checkout (a proposed `PcsCheckout` value of
PartyConsentSource) for the separate, unchecked marketing choice. A guest's request is pending
until verified like any other; a signed-in account with a verified email is accepted at once with
the checkout as evidence. As built the opt-in is on the consent services (impl-marketing F26);
Marketing moves the store-news choice onto L's `request#Subscriptions`, the receipt's link staying
its verification. **Needs:** MKT-AUDIENCE, MKT-CONSENT, MKT-PUBLIC.

**Source:** research §3; double opt-in list statuses and ridgecrest public mailing-list subscription; existing consent-token patterns.

### EmailPreferences — Context passed

There is one unsubscribe and preferences page, the PASS Account "Email preferences" page owned by
Comms ([Commons §16](design-drawers-commons.md#16-consent-and-unsubscribe), X15). It combines list
unsubscribe, topic preferences and the Forum opt-out. As built, a list email's link and
List-Unsubscribe headers name it on its canonical PASS host when the site the token is made for
mounts Account, so a remote PASS deployment serves them; a campaign send makes each token for the
sending organization's site (impl-marketing F56). An instance with no such mount keeps the BOSS
`/u/<token>` page, which is not a redirect (impl-marketing F25).
Marketing supplies its context: the organization's published topics and channels, SMS scope once
SMS ships, and an optional opt-out reason (too frequent, not relevant, never signed up, other),
stored in the withdrawal's `PartyConsent.comments` and counted in AudienceGrowth. It reuses
`mantle.party.ConsentServices.check#UnsubscribeToken`, `resolve#UnsubscribeToken`,
`apply#UnsubscribePreferences` and `unsubscribe#ContactListParty`, extended for
organization/topic/channel scope without invalidating legacy email tokens. GET reveals only a
masked destination and offered preferences, never grants or withdraws consent. One-click POST is
idempotent and takes effect immediately. A pending confirmation-based legacy unsubscribe already
blocks dispatch. The page never leaves a Forum/MAILBOX membership on the recipient's behalf.

| App | Tabs or panes shown | Filters fixed | Action set | Emphasis |
| --- | --- | --- | --- | --- |
| Marketing | The organization's topics by channel, with the recipient's state | the token's or signed-in user's destinations; the sending organization | unsubscribe from one, all marketing, change topics, give a reason | leaving cleanly |

**Source:** Comms §16; current ConsentServices; Odoo mailing opt-out reasons. **Needs:** MKT-CONSENT, MKT-PUBLIC.

### SubmitForm

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| PublicForm | single | Submit permitted answers | publication, invitation/account when required, visible fields, separate consent choices, request key | server-rendered safe DbForm | P.get#Form, P.submit#Form | Frappe Web Form; Nextcloud Submit |
| FormReceipt | display | Acknowledge submission | opaque receipt, configured next step | neutral receipt, safe registered URL | same result | research §8 |

Server checks publication/effective form, size/types, required and hidden fields, response/repeat
policy and request identity. Hidden answers are discarded/refused rather than trusted; no expression
from the browser executes. An email field does not identify an existing Party without verification.
Lead handoff and optional follow-up subscription run as separate, replay-safe effects after response
acceptance. This is the one public lead page: a publication with purpose lead is Sales'
LeadIntake context, and its handoff calls Sales' `store#LeadIntake` (X15, X16). **Needs:** MKT-FORMS, MKT-LEAD, MKT-PUBLIC.

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
| RegistrationPayment | wizard step | Pay the held order | hold expiry, native order, amount/currency | the hosted payment step of Accounting's coordinator | P.start#RegistrationPayment via E.start#RegistrationPayment, a thin wrapper over Accounting's typed PortalPaymentAttempt coordinator, purpose `eventRegistration` (X9) | Shop/Accounting payment contracts |
| RegistrationReceipt | display | Explain the result | opaque registration reference, pending/confirmed/waitlisted, next step | capability link | P.get#Registration | research §7 |

A browser success redirect never confirms payment; the authority's verified financial result does.
Where the seller's Sales approval setting is on, that result holds the place and RegistrationReceipt
shows the registration pending, payment received, with no ticket until the order is approved (§9).
Free registration confirms atomically with capacity; paid registration uses the native (storeless
by default, §9) order and the coordinator's attempt key, `PaymentGatewayResponse.operationKey`;
gateway webhooks land as SystemMessage receipts on Accounting's side. A user can refresh/retry without a second charge or seat. Verification
of attendee address can be required by publication policy; payment alone does not prove control of
all attendee addresses. **Needs:** MKT-EVENT, MKT-PUBLIC.

**Source:** research §7; Odoo event tickets, Dolibarr public registration and native order/form records.

### Registration

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| MyRegistration | display | Inspect the permitted attendee/order view | event, ticket, attendee, entry credential, state, cancellation terms | downloadable ticket/receipt | P.get#Registration | Odoo event registration |
| CancelRegistration | single | Request permitted cancellation | registration capability, reason, refund expectation, request key | explicit confirmation | P.cancel#Registration | research §7 |

Use verified account ownership or an ExternalAccess capability scoped to registration and action.
A registration whose paid order awaits the seller's approval shows as pending, payment received
and awaiting the organizer's confirmation, with the receipt and no ticket, entry QR or event link
(§9).
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
| MarketingCampaign and MarketingCampaignParty, extended | Existing campaign fields plus a denormalized, audit-logged `organizationPartyId` (X12); seeded organization/manager/contributor roles and audited key fields | Exactly one effective organization, mirrored in `organizationPartyId` for the entity filters; parents and associations share authorized scope; native lifecycle retained |
| MarketingPolicy / MarketingVocabulary | organization, policy/value kind, effective interval, declared settings | Policy resolution is explicit, historical and permission checked; no deployment credentials |
| CampaignAssociation | campaign, typed source kind/ID, purpose, from/thru, actor | Links permitted promotion, event, form, segment/list and source records; validates target organization; does not override source authority |
| CampaignCost | cost ID, campaign, source type/line or manual evidence, amount/currency, rate/date, reversal link | Independent expense allocation facts; source allocation cannot be counted twice |
| MarketingDecision | decision ID, target kind/ID and effective stamp, decision, policy effective time, actor/time/reason | Approval facts survive invalidation; campaign/send/automation approval are distinct purposes |
| ContactList / ContactListParty / ContactListEmail, extended | Existing identities; organization-scoped marketing policy and dated template/topic bindings | Preserve MAILBOX/Forum semantics; distinguish subscription intent from membership administration; do not send from raw auto-services |
| SubscriptionRequest | request ID, site/list/party (made or matched at the request, impl-marketing F43), channel/purpose, evidence/text reference, token digest, requested/expired/confirmed times, request key | Address-bound double opt-in; expiry/replay protected; whether the party was made or matched is never disclosed |
| AudienceImport and item results | import ID, organization/list, staged-file reference/hash, mapping/evidence, expiry; row number and result | Resumable import facts; per-row idempotence, confidential error downloads and retention |
| MarketSegment and rule entities, extended | Existing hierarchy/native criteria; the existing audit-logged `ownerPartyId` as the organization (X12; impl-marketing F4); dated kind/filter and explicit include/exclude membership | Typed bounded conditions, organization-scoped evaluation and filter rows; native product/price segment uses remain compatible |
| PartyConsent, extended | Existing party/address/list/purpose/evidence/comments; add explicit organization scope where required by marketing policy; seed `PcpTracking` (PartyConsentPurpose) and `PcsCheckout` (PartyConsentSource) | Legacy global withdrawals remain blocking; scoped grants cannot cancel a global withdrawal; scope migration/adoption is explicit; an opt-out reason goes in `comments` |
| MessageSuppression (Comms) | suppression ID, organization/profile scope, normalized destination key, channel, reason, source event (provider callback, DSN/ARF report or staff), from/thru, reviewer evidence | Comms-owned in `mantle.party`; independent of membership; complaints/hard bounces require review to end; no raw address in generic logs |
| MessageTemplate / MessageSendingProfile | template/profile ID, organization, channel/purpose, effective dates, safe content/variable fields, EmailTemplate or operator binding | Comms-owned configuration; binds existing email infrastructure and the framework's SMS channel; no arbitrary executable template fields |
| CampaignSend | send ID, campaign, topic list, channel, name, sender/profile, schedule/zone, effective content/policy reference, rendered resource, state, approval decision | One prepared promotional delivery intent; immutable content once attempted; operator release is separate from approval |
| CampaignRecipient | recipient ID, send, party/contact mechanism and normalized destination, selected time, variant, tracking policy, eligibility/state, execution key (the VERP key), delivery-ledger reference | Unique send/channel/destination; recipient selection is a fact, not mutable live query membership; attempts, receipts and outcomes are on the ledger |
| Comms delivery ledger (X8, CX-DELIVERY) | Not a Marketing record: Comms' one Mantle attempt and receipt ledger (event, recipient, channel and template key, consent snapshot, outcome), built with Shop and extended for a campaign, not wrapped: a suppression check, a sending profile and receipt facts, source-given subject and body, the organization and the topic's consent, and the SMS channel (impl-marketing §4, F13, F14) | Durable execution and receipt facts; uncertain submission never auto-retries; out-of-order receipts and DSN/ARF reports are reconciled without state regression |
| CampaignExperiment / CampaignExperimentVariant | experiment ID/send, sample %, measure/window, chosen variant/release; variant ID, approved content reference | One assignment per recipient and one winner release; variant content uses the same send/template history rules |
| MarketingAutomation / MarketingAutomationStep | automation ID/campaign/topic, effective admission/goal/reentry policy; step order, kind and typed payload with dates | Ordered bounded steps; no scripts, cycles or arbitrary branches; activation approved at an effective time |
| AutomationEnrollment / AutomationStepExecution | enrollment ID/party/source-event/effective definition, current step/state; unique enrollment+step execution and send-recipient link | Independent runs and effects survive restart; once-per-source admission and no repeat completed step |
| CampaignContent | campaign-content ID, campaign, typed WikiPage/WikiBlog/page/file reference, use, intended date, from/thru | Content body and publication stay with their owner (WikiBlog posts authored in §8); distribution joins to actual CampaignSend |
| CampaignAsset / CampaignSendContent / EventRegistrationContent | host ID plus content ID/type, resource reference, from/thru and audit fields | Native-style host file associations for shared RecordFiles (CampaignAsset is the campaign's, named apart from CampaignContent); campaign asset planning stays CampaignContent |
| TrackingCode, extended; MarketingTrackingEvent | Native redirect/campaign/type/lifetimes, typed UTM fields and organization; event ID, code, opaque visitor key, recipient when permitted, site, timestamp, observed kind and automation evidence | Captured on the authority through the PASS facade (X10); native visit/order/return joins retained; consent-aware observations are distinct from confirmed outcomes |
| MarketingOutcomeLink | organization/outcome type/native key/model key, primary campaign, evidence source/time, decision/correction metadata | One primary credit per outcome; source allocations and native order/invoice links prevent duplicate revenue |
| EventRegistrationPolicy / EventTicketType | event occurrence, effective offer/terms, site, registration window, capacity/hold/waitlist, ticket product and pricing source | One authoritative capacity domain per occurrence and per ticket; accepted terms referenced by registrations |
| EventRegistration | registration ID, occurrence/ticket, attendee/buyer party, hold expiry/state, native order/item/payment references, source campaign, response ID, entry credential digest/revision | Attendee identity separate from payer/order; unique source/request allocation; financial facts remain in native records |
| EventRegistrationAction / EventCommunicationSchedule | action ID, registration, action/actor/time/reason; event effective trigger/offset/template/purpose | Check-in/correction/cancellation evidence and one notice per registration/schedule/trigger, sent as a delivery-ledger source; no duplicate event store |
| FormPublication / FormInvitation / FormSubmission (Commons, X16) | publication ID, DbForm, site/campaign or case/purpose/access/effective interval; invitation over `ExternalAccessCapability`; submission ID/request identity, response, verified party if any, source/effects status | One model for Marketing, Customer Service and Sales lead forms, owned by Commons; framework owns form/answers; publication controls exposure; submission is an acceptance/integration fact, not a copy of answers |
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
| W — mantle.marketing.MarketingWorkspaceServices | Scoped home, settings, readiness (`get#Readiness`), engagement and cross-record projections | organization, authorized filters/record, as-of, paging → display rows, counts, capabilities, readiness and page metadata |
| C — mantle.marketing.CampaignServices | Campaign lifecycle/parties/budgets/cost links, approvals, policies and vocabularies | campaign/source, allowed values, expected stamp, action and operation identity → record/decision/reconciliation or named conflict |
| L — mantle.marketing.AudienceServices | Marketing subscription policy, evidenced requests, imports/merge and list template bindings over existing list/consent services | organization/list, permitted parties/address evidence, preview and source stamps → pending/accepted/skipped membership or per-item results |
| Q — mantle.marketing.SegmentServices | Native/saved segment definition, bounded evaluation and shared audience eligibility | segment/as-of or sources/topic/channel/purpose → authorized matches, mutually exclusive reasons, tracking flags and preview identity |
| D — mantle.marketing.CampaignSendServices | Content/prepare/test/approve binding, release/schedule, experiment, recipient selection and handoff to the Comms delivery ledger, ledger retry and reconciliation requests | send/recipient/experiment, expected stamp, approved content/policy, operation identity → prepared/released execution, ledger status or recovery findings |
| G — mantle.party.MessageServices (Comms) | Shared Comms template/profile/suppression configuration and readiness, including the bounce-report intake that writes MessageSuppression | organization, typed template/profile/suppression values, effective time, capability → safe projections, validation or saved policy |
| N — mantle.marketing.AutomationServices | Ordered definitions, simulation, activation, enrollment and step workers | definition/effective time, source event, enrollment/step key → trace, due step or stopped/completed result |
| T — mantle.marketing.MarketingContentServices | Campaign content bindings and blog posts (`find#BlogPosts`, `add#BlogCategory`, `remove#BlogCategory` over the framework WikiServices) | campaign/typed source, authorized target or wiki space → association or post projection |
| K — mantle.marketing.TrackingServices | Tracking links, authority capture (`record#TrackingEvent`), the order-placed handler (`handle#OrderPlaced`, the one service the `OrderPlacedRecordAttribution` SECA calls) and order attribution (`record#OrderAttribution`, called by the handler) | tracking code, opaque visitor key, consent/context, order → public-safe link, recorded observation or attribution decision |
| E — mantle.work.EventRegistrationServices | Offers, holds/waitlist, tickets, registrations/check-in, the thin payment wrapper over Accounting's coordinator (X9) and notices | occurrence/registration, accepted offer, attendee facts, expected stamp and operation key → held/confirmed/waitlisted registration or explicit payment/capacity conflict |
| F — mantle.marketing.MarketingFormServices | Marketing wrappers over the Commons FormPublication/FormInvitation services (X16), responses and the Sales lead handoff | authorized DbForm/publication/response/rule, effective time, submission source → safe form/result or unique capture outcome |
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
| Comms Consent and PASS Account Email preferences | Organization/topic/channel and current subject; existing token scopes and mailbox separation preserved; shared consent edit capability required; one public preferences page (X15) |
| MessageTemplates, SendingProfiles, Suppressions | One Comms-owned definition in §§4–5, 12 (registry `Shared/` rows), built by Marketing as `Shared/` files; Marketing mounts promotional/channel context; Comms' own mounts come later, with a Comms settings area (impl-marketing F16); Admin controls transport secrets/domain configuration |
| CampaignDelivery | §5 owns one projection (registry `Shared/CampaignDelivery`) for Marketing and, later, Comms over CampaignRecipient and the Comms delivery ledger; current send/organization fixed; person/body visibility requires separate rights |
| Promotions and codes | Commerce §7 owns forms; Marketing adds dated campaign links, never another evaluator or global usage budget |
| Surveys, publications and responses | Commons owns DbForm editor/response forms, with Customer Service's initial summaries, and the one FormPublication/FormInvitation model (X16) whose first summaries are §10; Marketing supplies campaign/publication scope, not case response access |
| Calendar and EventDetail | Commons owns times/resources/RSVP; Marketing supplies campaign projections and links to registration extension screens |
| Page authoring, blog posts and Knowledge | Commerce defines the shared Pages/PageDetail over extended PublicSitePage (X14) and owns themes; Commons owns wiki body/review; Marketing owns BlogPosts/BlogPostDetail over WikiBlog; future PASS Publishing adds editorial workflow, taxonomy and public blog rendering |
| Leads and LeadSources | Sales owns opportunity/source/routing forms, the UTM source map and `store#LeadIntake`; Marketing supplies explicit source/campaign, source-bound capture and the one public lead page; no implicit lead subscription |
| Customer360/ContactDetail | Crosscut/Commons own identity/forms; engagement source providers mask consent, response, Sales and finance data independently |
| Chatter and RecordFiles | Register MarketingCampaign, CampaignSend and EventRegistration hosts with organization/source checks; reuse CommunicationEventRecord/WorkEffortRecord and existing files mechanisms; native MarketingCampaignNote history remains readable |
| Comms, Sync, Assist and privacy | §1.3 entries: `record-lookup` and `call-context` providers, the projected campaign calendar, skills and prompts; the privacy provider (§10) is registered later, with Admin's PrivacyServices |
| Admin's registries | Marketing's settings entry (MARKETING_CONFIGURE); its own readiness provider `marketing.setup` over W.get#Readiness, organization scope, fix path Marketing/Settings, whose checks grow as areas are built (unowned lists and segments, no policy, no ready sending profile, a mount with nothing published, failed jobs and captures); a lifecycle participant `marketing.campaigns` over C.find#OwnedCampaignRoles and C.transfer#CampaignRole, which ends a departing user's manager and contributor rows on open campaigns and gives them to the named successor; approvals and scheduled sends are not a person's and are not moved (impl-marketing §4, F59). A readiness provider owned by Comms waits for Comms' settings area |
| Approvals | Commons recipient-filtered provider with Marketing topics and source-stamp decisions; no generic approval bypass |
| Today, palette, notifications | W providers return authorized due sends, approvals, failures and registrations with same-app links; palette rows carry `recordEntity` and `recordId`; topic push titles name the campaign or send only; no recipient addresses, raw tokens or secret content in shell context |

Add proposed CampaignAsset, CampaignSendContent and EventRegistrationContent host-file
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
| `OrderPlacedAutoApprove`, `OrderPlacedStoreConfirmation`, `OrderPlacedAuthorizePayments`, `OrderApprovedFulfillSubscriptions`, `OrderPlacedSendEmail`, `OrderApprovedSendEmail`, `OrderPlacedReserveAssets` on a paid ticket order | **Named per rule in §9.** Paid tickets enter native order/payment paths, storeless by default, with Accounting's payment coordinator; approval goes through `autoApprove#Order`, which holds the order Placed where the seller's Sales approval setting is on; Marketing adds source/capacity adapters, not another invoice, capture, tax or refund processor. |
| proposed `OrderPlacedRecordAttribution` (Mantle SECA on order placement, tx-commit) → `mantle.marketing.TrackingServices.handle#OrderPlaced` | **New (X10), Marketing-owned,** registered in crosscut §1.3. Runs for every placed sales order; the one handler files the automation admission event (§6) and calls `record#OrderAttribution` (§11); a failure is logged and retried by the attribution job, never undoing placement. |
| proposed `DeliveryReportIntake` (email ECA on the bounce accounts) → G `process#DeliveryReport` | **New (R-MKT-03).** Mail to a VERP Return-Path (`bounces+<execution key>@` the profile's bounce domain) is parsed as a DSN (RFC 3464, `multipart/report; report-type=delivery-status`) or an ARF complaint (RFC 5965, `report-type=feedback-report`). The execution key finds the ledger attempt; a permanent failure or complaint becomes a delivery event and a MessageSuppression once, a transient one a soft failure under the sending policy. An unknown key or unparsable report is logged and left in the mailbox; other messages continue. Same email ECA mechanism as `ListUnsubscribeMailto`; Comms owns it because every ledger source can bounce. |

### 15.2 Durable dispatch and recovery

Marketing owns the intent and the selection; Comms owns delivery (X8). Preparation persists the
send intent, approved content reference and eligible CampaignRecipient set before any provider
call. A due worker claims a bounded page of recipients with a lease and checks organization,
campaign/send state, topic membership, purpose/address consent, suppression, frequency caps and
sender readiness immediately before handing each recipient to the one Comms delivery ledger, with
the recipient's execution key as the ledger key and VERP Return-Path. The accepted address/content
is fixed; missing data is skipped with a named reason. Receipt or unsubscribe workers may stop
remaining work; already submitted messages cannot be recalled and the UI exposes them as in flight.

The ledger commits the attempt identity before the network call, holds no database transaction
open for SMTP/SMS, supplies a stable provider idempotency key where supported, and records the
provider result on `send#EmailMessage`'s retryable, permanent and uncertain outcomes with the
SystemMessage retry jobs, linking EmailMessage/CommunicationEvent/ContactListCommStatus. A crash
between submission and recording leaves an uncertain attempt, queried by provider key when
possible and otherwise reconciled by an operator from CampaignDelivery. Lease expiry alone does not
prove no message was sent. Marketing keeps no attempt or receipt store of its own. The current list-send subject input changes the CommunicationEvent subject, while the template
controls the actual email subject; the new prepared-content handoff must explicitly bind both
envelope subject and body to the approved intent. A failed recipient never aborts unrelated recipients; selection/authorization corruption
blocks that execution before any external effect.

Signed/authenticated provider callbacks (web scripts, §8) and DSN/ARF reports are bounded,
replay-deduplicated and routed only to known profile/attempt IDs. Receipt order cannot regress accepted/delivered facts; bounce/complaint facts
remain separately visible and apply suppression once. Unknown callback IDs are quarantined with a
safe diagnostic. Framework transport handles providers, signing and normalized receipts; Mantle
maps them to recipient/consent facts. Raw provider URLs, tokens and subscriber addresses are not logs.

### 15.3 Job catalogue and shipped alerts

| Proposed job | Work and recovery boundary |
| --- | --- |
| Due campaign dispatch | Claim due approved send/recipient pages and hand them to the delivery ledger; per-recipient transactions; the ledger retries known transient failures within policy; uncertain work remains blocked for review |
| Attribution | Retry `record#OrderAttribution` for placed orders whose SECA call failed; one decision per order |
| Automation admission/steps | Cursor by source event or segment difference; unique enrollment/step effects; bounded due processing; current exit/consent checks before each effect |
| Registration expiry/waitlist | Expire holds and release capacity once, then offer FIFO waitlist places under locks; paid-unallocated outcomes remain explicit review work |
| Event communications | One effect per registration/schedule/trigger, handed to the delivery ledger; cancelled/changed events suppress obsolete notices; promotional notices use normal consent |
| Capture handoff | Process accepted form/event source facts into Sales once; failed capture is visible without rolling back the response/registration |
| Delivery reconciliation | The Comms ledger queries known provider attempts and updates named uncertain results; Marketing shows them in CampaignDelivery; never blind resend |
| Reporting and retention | Incremental source/event aggregation with watermark and freshness; rebuildable totals; policy-approved expiration/anonymization without deleting needed financial evidence |

ServiceJobs provide scheduling; no new workflow engine. Each job declares `operation` and
`operation-ref`, so backlog, oldest due, failures and duration are framework telemetry, and the
shipped Marketing dashboard and alert-rule templates (§11, L6) cover what a bespoke measures list
would: failed and uncertain recipients, bounce and complaint spikes, webhook failures, enrollment
stalls, held/expired/paid-unallocated registrations and report watermark lag. Admin retains
transport/job diagnostics. Throttling is per provider/profile and organization, with bounded batch
sizes and backoff. Secrets remain in operator configuration. Alert only on actionable failures or
materially overdue work, not one notification per recipient.

### 15.4 Compatibility and adoption

Adoption adds nullable associations/metadata first, then explicitly adopts existing
lists/templates/campaigns into organization policy. Unknown historical
consent is not a grant; historical accepted membership can be reviewed with evidence. New guards
must protect public/direct service callers while preserving declared internal MAILBOX and Forum
contracts. Legacy unscoped consent withdrawals retain their broad blocking effect; organization-scoped
grants cannot undo them. Adoption previews affected records and records each result independently.
Historical sends cannot be reconstructed into verified delivery or attribution simply from counts.

Register new public operations and readiness before enabling a PASS mount. Enable Marketing areas
only after their required services and scope checks are available. An unavailable SMS channel blocks
SMS readiness and leaves functioning email campaigns usable.

## 16. Coverage and acceptance

### 16.1 Research disposition

| Research candidate / area | First-release disposition |
| --- | --- |
| Home/calendar/KPIs/attention | Home and shared Calendar; Marketing report providers work before Insights |
| Campaign list/detail/budget/approvals | Campaigns, CampaignDetail, Commons Approvals; native campaign flow and dated roles |
| Lists/members/import/merge | Lists, ListDetail, MemberDetail, AudienceImport and AudienceMerge; existing list services extended |
| Native rules/explicit/saved-query segments | Segments/SegmentDetail with typed bounded predicates and shared AudiencePreview |
| Consent/suppression/audience exclusions | Comms Consent and shared Suppressions; purpose-specific evidence, dispatch recheck and explicit exclusion counts |
| Email/newsletter/SMS/templates/test/schedule/traces | Sends, Compose, shared MessageTemplates/SendingProfiles and CampaignDelivery over the Comms delivery ledger; bounce and complaint intake by VERP and DSN/ARF; SMS is its own stage, last in the build, on framework C4-SMS |
| A/B testing | ExperimentDetail, two disjoint samples and explicit winner release; no automatic open-rate winner |
| Drip/nurture | Automations, ordered steps, simulation/enrollments and restart-safe execution; visual graph/loops deferred |
| Promotion programs/rules/codes/redemption/store binding | Shared store promotion/code screens; campaign links only; cross-store budgets/programs, loyalty and referrals deferred |
| Blogs/categories/wiki | BlogPosts and BlogPostDetail over WikiBlog with categories, campaign links and the Knowledge body editor; editorial workflow, taxonomy and public blog rendering are future PASS Publishing |
| Landing pages/web forms | Commerce shared page authoring extended for storeless Marketing; published DbForm/lead/subscription components through PASS |
| Tracking links/QR | TrackingLinks/TrackingLinkDetail, a Tracking links tab on CampaignDetail, and capture on the authority with an opaque visitor key; no personal tracking without `PcpTracking` consent |
| Events/tickets/attendees/check-in/communications | Shared EventDetail plus registration setup/records, paid/free tickets on storeless orders through Accounting's coordinator, waitlist, notices and video links for online occurrences; booths, conference tracks, camera scanning and offline check-in deferred |
| Lead list/source/lead-generation rules | Sales Leads/LeadSources mounts and source-bound LeadRules; Marketing brings shared lead capture into its first release |
| Survey builder/share/results/scoring | Shared DbForm editor/response views, Marketing distribution, explicit option scoring; timed exams/certification/live quiz sessions deferred |
| Performance/visits/opportunities/orders/revenue | Four named reports with recorded primary attribution written at placement; registry metrics `Marketing.Visits` and `Marketing.AttributedOrders` (Marketing), `Sales.Orders` and `Sales.OrderValue` (Sales), `Accounting.InvoicedRevenue` (Accounting); the funnel is Insights'; the multi-touch model, later, is Marketing's |
| Customer 360 engagement | Shared Customer360/ContactDetail with independently authorized source projections |
| Settings/shell providers | Owned policy/vocabularies and shared Comms/Sales settings; palette, Today, quick create, approvals and the §1.3 stack contributions |
| Campaign templates, tags | A campaign template is a duplicated campaign; campaign tags are Open with deal tags (a generic record tag) |
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
| Wiki EditWikiPage, WikiBlogs, EditWikiBlog | Body edit maps to Knowledge. WikiBlogs AddBlogText, AddBlogPage and WikiBlogList map to BlogPosts (NewBlogPost, NewBlogPostFromPage, BlogPostList); EditWikiBlog EditBlogForm, AddCategory and CategoriesForm map to BlogPostDetail (BlogPost, AddCategory, Categories) |
| Store emails / party emails / financial accounts / system visits | Store template assignments remain Commerce; personal mail remains Comms; gift-card balances remain Accounting; raw system visit tools remain Admin. Marketing uses scoped template/report projections |
| ContactListServices | Map directly used list find/create/update/member queries; legacy membership/whole-list send helpers are discussed as dependencies, not invented screen calls |
| ConsentServices / ContactServices | Map consent list/state/history/store/subscribe/unsubscribe/bulk and public preference/token operations actually called by mounts |
| EventServices / WorkEffortServices | Map existing calendar/event calls from shared mounts; registration/worker-only helpers are proposed or dependencies |
| ContactImportServices | Map existing parser/preview/import reached by AudienceImport; row workers and internal matching helpers are not extra form calls |
| Proposed Marketing families and framework services | Proposed packages stay here, not in the Mantle inventory. Framework services (WikiServices for blog posts, EmailServices) are named in form summaries and recorded here |

Screen and service inventory Designed in entries are additive. Preserve existing app mappings and
all Implemented in values. When an existing active service is missing from the older inventory,
add only a source-verified row and identify the addition; do not count XML-comment definitions.

### 16.3 Implementation acceptance scenarios

Each scenario is an acceptance test to write (`test/acceptance/Marketing/`, `test/acceptance/client/Marketing/`), named in the
implementation plan; the rules it relies on get their own regression tests. No route fixtures: a screen sweep is an
acceptance test, one per app per mode.

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
6. **Approval and dispatch:** author, approver and dispatcher exercise distinct grants; under the
   one-person-team flag an author's own send is admitted below 500 recipients, recorded as a
   self-approval, and refused at 500 or with the flag off. Content,
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
    No oversell, duplicate charge or reused entry credential; RSVP alone grants no paid seat. For
    an organization whose Sales approval setting is on, a paid registration shows pending with its
    place held until the order is approved from Sales' Awaiting approval list, then shows its ticket.
14. **Check-in and notices:** repeated/wrong-event/cancelled scans and a manager correction retain
    audit history. Event cancellation stops obsolete notices; configured calendar and registration
    notifications do not send the same intended reminder twice.
15. **Report reconciliation:** recipient/variant counts reconcile; accepted differs from delivered;
    untracked recipients do not depress a tracking rate; primary versus influenced outcomes do not
    double count. Split invoices, partial refunds, parent campaigns, multiple currencies and missing
    evidence show explicit, source-reconciled results.
16. **Devices and surfaces:** one sweep of the app per mode (qvt and tui); public HTML is accessible;
    phone lists/check-in fit at 390 px. Check real action presence for allowed roles and absence for
    readers, empty states, stale-write recovery and not-available links.
17. **Bounces and complaints:** a hard-bounce DSN and an ARF complaint to a VERP address each
    suppress the destination once and mark the ledger attempt; a duplicate report changes nothing;
    a soft bounce follows the retry policy; an unknown key is logged and other reports continue.
18. **Attribution at placement:** a Shop checkout, a Sales quote acceptance, a direct order and a
    paid ticket each get one attribution decision from the SECA; a remote-PASS visit counts through
    its visitor key; a failed attribution call leaves the order placed and is retried once.
19. **Blog posts:** create a post with text and one from an existing page, add and remove a
    category, link it to a campaign and send it in a newsletter; the send sets neither
    `publishDate` nor the page's published version, and a user without space write access cannot
    change the post or its categories.

## 17. Delivery stages

All stages below belong to the broad first release except M8, which follows it: SMS is in the
build, last, after the first release's gate (impl-marketing §4, Nov 11). Neither M3 nor M8 waits on
framework work any more: the delivery ledger, Comms C1 and C4-SMS are built (impl-marketing F12,
F19). The shell's frame arrives with M1 and each §1.3 contribution with its records, the calendar,
the remaining providers and Assist completing before M8; M7's privacy provider waits for Admin's
PrivacyServices.
Dependencies are explicit so a convenient early screen is not mistaken for a safe, complete sender.

| Stage | Deliverable and exit condition |
| --- | --- |
| M0 — Scope and shared foundations | Permissions and the X12 organization filters, organization adoption, consent/purpose policy (with `PcpTracking`), shared form/public-site agreements and source guards; fast cross-org/direct-service tests |
| M1 — Campaigns and audiences | Shell and §1.3 contributions, campaign lifecycle/budget, lists/import (the `marketingAudience` import target under MARKETING_AUDIENCE_IMPORT)/merge, segment evaluation, shared consent/suppression; evidence and exclusion scenarios pass |
| M2 — Shared content and email readiness | MessageTemplates/SendingProfiles, safe composer, email transport through the Comms delivery ledger, VERP bounce addresses and DSN/ARF intake, and public subscription pages; email has a verified readiness gate. Email alone completes M2 |
| M3 — Durable sends and experiments | Prepared recipients handed to the delivery ledger, separate approval/release, jobs, CampaignDelivery, unknown-outcome recovery and manual A/B winner release; failure/replay/withdrawal tests pass. Over the Comms delivery ledger (X8), which is built |
| M4 — Structured automation | Approved ordered steps (email, wait, condition), admission/due jobs including order and cart triggers, simulation, enrollment trace, caps and stop/restart behavior; no duplicate step effects |
| M5 — Public forms and campaign content | Commons form publication with Marketing context, surveys/results, blog posts, storeless landing pages on the shared Pages, tracking links with authority capture, Sales lead capture through `store#LeadIntake`; public replay and content/access tests pass |
| M6 — Events | Commons context, registration/tickets, free and paid flows on storeless orders through Accounting's coordinator, capacity/waitlist, entry credentials, video links and transactional schedules; capacity/payment/cancellation cases pass |
| M7 — Integration and reporting | Shared promotion/customer/source contexts, attribution writer, complete shell providers, reconciled reports with shipped definitions and alerts registered with Insights, and fast end-to-end walks; the privacy provider later, with Admin's PrivacyServices |
| M8 — SMS | SMS sends, Send SMS automation steps and SMS preferences on framework C4-SMS, built with Comms C1 ([Comms-Framework §7](../../../../../plans/archive/Comms-Framework.md#7-order)); in the build, last; topic consent checked in the ledger, STOP mapping and segment estimates pass, receipts where the messaging bridge reports them |

Existing capabilities and new dependencies are named again in the needs register. A deployment may
disable unused channels/events, but first-release delivery is not complete by dropping M0–M7.
Later work: cross-store program/loyalty/referrals, Publishing editorial workflow and taxonomy,
social/channel campaign sync, branching journey canvas, advanced attribution, conference
tracks/booths, attendance from call legs, camera check-in, offline check-in and
certification/live quizzes.

## 18. Documents and outputs

| Output | Kind | From screen | Derived from |
| --- | --- | --- | --- |
| Campaign plan/budget and approval history | html-print/PDF | CampaignDetail | native campaign fields, decisions and authorized cost allocations |
| Audience import preview/error rows and membership export | import/export CSV | AudienceImport, ListDetail | shared ContactImport and scoped membership query; MARKETING_AUDIENCE_IMPORT to import, MARKETING_AUDIENCE_EXPORT to export |
| Personalized email/text alternative and SMS | message | Compose/SendDetail | effective safe template, approved recipient execution, unsubscribe/withdrawal contract |
| Test message | message | Compose | clearly marked test with synthetic/authorized sample values; excluded from live metrics |
| Delivery/reconciliation report | CSV/html-print | CampaignDelivery/RecipientDetail | the Comms delivery ledger with redacted tokens and permission-masked destinations |
| Subscription verification and preference notices | message/public receipt | Subscribe/VerifySubscription/EmailPreferences | existing consent/token paths extended for the published request |
| Tracking URL and QR | link/image | TrackingLinkDetail | validated canonical redirect, no embedded plain party identifier |
| Survey invitation, public form and results | message/HTML/CSV | SurveyDistribution/SubmitForm/Responses | shared DbForm and effective response definition |
| Event offer, registration receipt/ticket and entry QR | HTML/html-print/PDF | Event/Register/RegistrationDetail | accepted ticket offer and opaque event-bound entry capability; the video link for an online occurrence; QR from the built barcode helper |
| Event change/cancellation/payment status notice | message | RegistrationDetail | source registration action and authoritative financial outcome |
| Event calendar file | ICS | EventDetail | existing EventServices event/occurrence export |
| Campaign/delivery/growth/attribution reports | CSV/html-print | Reports and children | the identical authorized report query, basis, currency and as-of watermark |
| Weekly campaign digest; failure, complaint, bounce and uncertain-backlog alerts | scheduled report (PDF/CSV); alert | Reports, Home | shipped datasets, dashboard and alert-rule templates (L6) |
| Blog post | wiki page (public through the space's `publicBlogUrl`; PASS rendering is Publishing's) | BlogPostDetail | WikiBlog metadata and the page's published version |

Prints retain effective date/time and authorized source references. Exports omit token secrets,
provider credentials and inaccessible fields. Public tickets/receipts contain the minimum attendee
and event data; a registration email is not permission to include the attendee in a campaign.

## 19. Framework and data needs

These are additions and extensions to what exists. The IDs are rolled into crosscut §7.9. Shared
dependencies such as COM-PROMO, SHOP-CHECKOUT, CS-FEEDBACK, CS-FORM-ELEMENTS and SAL-CRM retain their
owning designs, and the cross-app contracts Marketing depends on are crosscut needs cited where
used: CX-DELIVERY (X8), CX-ORG-SCOPE (X12), CX-DEVICE (L5) and the other §1.5 contracts.

| Need | Kind | Proposed as | Used by | Stub spec |
| --- | --- | --- | --- | --- |
| MKT-ACCESS | service type, seed data, data model | Organization/role associations; `MarketingCampaign.organizationPartyId` and the existing `MarketSegment.ownerPartyId` with filter rows (X12); guarded direct list/consent/template/report operations, confidential projections and legacy adoption | all staff/public surfaces | Denormalized, audit-logged organization kept equal to the effective role row; `MANTLE_USER_ORG` and `MANTLE_ACTIVE_ORG` rows for MarketingCampaign (`organizationPartyId`), MarketSegment and ContactList (`ownerPartyId`); allowed operation succeeds, identical foreign/private operation fails without data; MAILBOX contracts remain intact |
| MKT-CAMPAIGN | data model, service type | C over native campaign flow, parties, associations, policies/vocabularies and independently sourced cost allocations | Campaigns, promotions, content/events, settings | Native transitions, stale edits, same-org links, cost reversals and nonduplicated child rollups; a campaign template is a duplicate |
| MKT-APPROVAL | data model, service type, seed data | MarketingDecision and effective approval rules; three topics seeded with Marketing's data; distinct author/approver/dispatch rights, with the one-person-team self-approval flag | campaigns, sends, automation, templates | Changed intent invalidates approval; assigned source-scoped approver cannot release without dispatch grant; self-approval only under the flag and below 500 recipients; lock-screen-safe push titles |
| MKT-AUDIENCE | data model, service type | L and existing ContactListServices extensions, SubscriptionRequest (including source checkout from Shop), import item results as an owner wizard registered in Admin §11's import targets (Z2) under the seeded MARKETING_AUDIENCE_IMPORT, and evidence-preserving list merge | lists, import/merge, public subscribe, Shop checkout | Pending/grant/withdrawal, independent row failure, replay after withdrawal and list single-use behavior |
| MKT-SEGMENT | data model, service type | Q with native criteria, dated explicit membership and bounded typed saved predicates | segments, audience preview, admission | Parent intersection, exclusions, unit bounds, access under negation and stable pagination |
| MKT-CONSENT | data model, seed data, service type | Existing PartyConsent/token/solicitation extended with scoped evidence; Comms `MessageSuppression` in `mantle.party.MessageServices`; seeds `PcpTracking` and `PcsCheckout`; Marketing context of the one PASS Account Email preferences page (X15) | audiences, sends, public preferences | Current consent at handoff, scoped grant versus global withdrawal, complaint persistence, read-only GET, idempotent one-click, opt-out reason in `PartyConsent.comments` |
| MKT-TEMPLATE | data model, service type | MessageTemplate metadata over EmailTemplate, shared library/editor, declared variables/content and effective bindings, rendered by the built `fancy-locked-html` | MessageTemplates and composer | No arbitrary screen/service execution; safe variables/HTML, historical prepared body and test isolation |
| MKT-TRANSPORT | service type, seed data | Verified sending-profile readiness with a bounce domain; per-execution VERP Return-Path; the `DeliveryReportIntake` email ECA and G `process#DeliveryReport` parsing DSN (RFC 3464) and ARF (RFC 5965) into ledger events and suppression; SMS through the built framework C4-SMS, not a Marketing adapter, with `PcpSms` topic consent checked in the ledger and Mantle's answer to the `sms-consent` hook | SendingProfiles, sends, events | Missing channel blocks it; bounce account exists before release; one suppression per report; timeout ambiguity, duplicate receipts and reports; phone normalization and sender verification when SMS ships |
| MKT-SEND | data model, service type | CampaignSend and CampaignRecipient as intent and selection, with D orchestration extending existing list-send primitives and handing each recipient to the Comms delivery ledger (X8) | sends, delivery, all automated promotional mail | Durable prepare/claim/handoff, bounded failures, destination changes; attempts, receipts, retry and uncertain outcomes on the ledger, no Marketing attempt store |
| MKT-EXPERIMENT | data model, service type | Two variants, stable disjoint assignments, observation window and unique explicit winner release | ExperimentDetail | Remainder disjoint, no reassignment, withdrawal before release and honest denominator/tie results |
| MKT-AUTOMATION | data model, service type | Ordered MarketingAutomation steps, enrollment/step facts, typed triggers (including order placed and cart abandoned) and conditions, simulation and bounded scheduler | automation, event follow-up | Duplicate admission/restart, stop/goal/consent, effective definition, one recovery sender per cart, and quiet-hours/DST behavior |
| MKT-CONTENT | data model, service type | CampaignContent over wiki/blog/page/file; T blog-post services over the framework WikiServices; the shared Pages over extended PublicSitePage (X14) and safe embedded participation components | Content, BlogPosts, landing pages, Knowledge | Linking never publishes a draft; category writes check wiki space access; standalone campaign site without a store; approved-version rendering |
| MKT-TRACKING | data model, service type | TrackingCode UTM/scope extension; K `record#TrackingEvent` on the authority with an opaque visitor key; mr-pass web-script redirect, pixel and callback handlers; `OrderPlacedRecordAttribution` SECA → K `handle#OrderPlaced`, which calls `record#OrderAttribution`; primary MarketingOutcomeLink | links, sends, reports, every order placement | Redirect target allowlist, no tracking without `PcpTracking` consent, works for a remote PASS, native key limits, one fixed attribution decision per order |
| MKT-EVENT | data model, service type | E and offer/ticket/registration/action/schedule records, capacity holds, waitlist, entry credentials; storeless ticket orders and the thin wrapper over Accounting's PortalPaymentAttempt coordinator, purpose `eventRegistration` (X9) | Events and PASS participation | Last-seat concurrency, late payment, cancellation/refund boundary, repeated scan, recurring occurrence isolation and the named order rules on a ticket order |
| MKT-FORMS | data model, service type | Safe dated DbForm fields/options/sections and response guard; Marketing context and wrappers over the Commons FormPublication/FormInvitation/FormSubmission (X16) | surveys, lead capture, registration | Typed conditional/required fields, response history, scoped invitations and immutable accepted response |
| MKT-LEAD | data model, service type | MarketingLeadRule/Capture over Sales `store#LeadIntake` with deterministic effect identity and authorized mappings | LeadRules, public forms, events | One source creates one handoff; failed Sales work preserves submission and never grants consent |
| MKT-PUBLIC | service type, seed data | Independent organization-bound PASS Marketing mount, publication/token/site checks, shared page renderer, registered operations | public subscription/forms/events | Local/remote without BOSS, explicit publication, request replay, no enumeration and canonical URLs |
| MKT-REPORT | service type, seed data | R measures and registry metrics `Marketing.Visits` and `Marketing.AttributedOrders` (X11); shipped `report/*.json` datasets, dashboard, alert-rule templates and digest schedule (L6); Insights catalog registration (Z10) | Home, Customer360, reports | Totals reconcile to source facts; orders and revenue cite Sales' and Accounting's metric IDs; privacy coverage and partial refund/credit/currency behavior; `operation`/`operation-ref` on jobs |
| MKT-COLLAB | data model, service type | Authorized campaign/send/registration host registration, CampaignAsset/CampaignSendContent/EventRegistrationContent and shared Chatter/files/activity links; a privacy provider (X15), registered later with Admin's PrivacyServices | detail screens, events, Customer360 | Same host authority on direct content/search/activity reads; native campaign notes preserved; privacy find/export/anonymize per policy |
| MKT-SHELL | shell item, service type | App context, palette, Today, quick-create, calendar overlays, approvals and notification topics; `record-lookup` and `call-context` providers (L8); the readiness provider `marketing.setup` and the lifecycle participant `marketing.campaigns` in Admin's registries (§14.3) | shell, Home and Calendar | Provider failure isolated; no private recipient/token data in context; every link resolves to an authorized mount |
| MKT-ASSIST | seed data, tool | mr-boss `skill/` Marketing skills, aliases and retrieval cases; `assist-prompt` and `response-action` in the Marketing root `shell-providers`; read-only `AgentToolExposure` rows (L1) | CampaignDetail, SendDetail, SegmentDetail | No exposure of dispatch, consent or address services; `exposeMcp` N; depends on the Mantle active-organization user-facts provider |
| MKT-SYNC | protocol server, service type | A read-only projected calendar kind in `mantle.work.CalendarDavServices.get#DavCollections`, answered by W (L2, CX-SYNC) | Calendar | "Campaign calendar" collection of authorized campaign windows, sends, events and publication dates; device writes refused; no copied rows |

## 20. Decided

| Decision | Notes |
| --- | --- |
| Broad first release | Email, A/B, structured drip automation, blog posts and event registration are first-release work (M0–M7); §17 stages do not quietly defer them. SMS is its own stage, M8, after them; C1 and C4-SMS, which it was gated on, are built (R-MKT-11; impl-marketing F19). |
| Research: template library | One Comms-owned library with channel/purpose kinds over existing EmailTemplate plus safe business metadata, rendered with `fancy-locked-html`; Marketing has its own campaign composer, not the personal mail composer. §§5, 12. |
| Research: campaign send record | A distinct CampaignSend and CampaignRecipient as intent and selection; attempts and receipts are on the Comms delivery ledger (X8 below). Existing CommunicationEvent and ContactListCommStatus remain linked delivery foundations. §§5, 14–15. |
| Research: promotion scope | Reuse Commerce's store promotions/codes and evaluator. Campaign associations do not create cross-store limits or programs; loyalty and referrals are later. A storeless ticket order has no promotions (X1). §7. |
| Research: event registration record | EventRegistration is independent entitlement/payment/capacity evidence linked to WorkEffort and native order/form records. WorkEffortParty remains calendar participation. §9. |
| Research: blog screens; blog posts now (Nov 1, 2026; user decision, review R-MKT-04) | Marketing designs BlogPosts and BlogPostDetail now, over the framework WikiBlog with the existing `create#WikiBlog`/`update#WikiBlog`, category rows and the Knowledge body editor; they map the baseline WikiBlogs and EditWikiBlog forms. Commons owns wiki body/review, Commerce the shared page authoring; the future PASS Publishing app adds the editorial workflow, taxonomy and public blog rendering. This replaces the earlier deferral of blogs to Publishing. §8. |
| Source truth over historical gaps | List sends, consent/history/tokens, calendar and wiki review now exist. SMS send is built on C4-SMS (Nov 11, 2026; impl-marketing F19). Explicit extensions and new records are marked accordingly. |
| Consent | Marketing requires evidenced affirmative topic/channel eligibility; import, segment match, lead creation and registration are not consent. Existing withdrawals and suppressions remain effective. Tracking needs its own proposed `PcpTracking` purpose (R-MKT-14). |
| Organization and role scope | Native dated campaign parties own organization/responsibility, mirrored for filters (X12 below); scoped services authorize independently of BOSS. MAILBOX/Forum behavior remains distinct. |
| Automation | Ordered Send/Wait/Condition steps and ServiceJobs; explicit admission/exit/reentry rules; order-placed and cart-abandoned triggers on the delivery ledger (MKT-R03); no visual branching engine. §6. |
| A/B | Two variants, stable disjoint total sample, human winner release and tracking-aware measures; no auto winner from opens. §5. |
| Scheduling and recovery | Approved intent, durable recipient facts, short transactions, explicit uncertain transport outcome and no blind retries. §15. |
| Public capability | PASS Marketing mounts independently, uses explicit publication and scoped operations and has no BOSS dependency. Legacy `/u/` unsubscribe links keep their own BOSS page where no PASS Account is mounted (Nov 11, 2026; impl-marketing F25). §13. |
| Attribution | Recorded primary campaign plus separately labelled influence; source/time evidence fixed at the business event, revenue and cash distinct, returns/credits reconciled. §11. |
| Baseline not carried here | Transactional store-email assignments, gift-card accounting and raw visit administration stay with their owners. §16.2. |
| Shared ownership | Register MessageTemplates, MessageTemplateDetail, SendingProfiles and Suppressions as Comms-owned canonical summaries here, CampaignDelivery as Marketing-owned and registered `Shared/`, registration extensions as Marketing-owned over Commons events, and safe surveys and form publication as Commons-owned. Screen names follow the registry and their path segments (R-MKT-07, R-MKT-16). No duplicate editors. |
| Histories | Effective-dated settings/associations and audit logs, with independently identified approval/send/enrollment/registration facts; no parallel configuration-version store. |
| Campaign templates, tags and tracking links (review R-MKT-12) | A campaign template is a duplicated campaign; CampaignDetail gains a Tracking links tab; campaign tags are Open, with Sales' deal tags. |
| Bounce and complaint intake (Nov 1, 2026; review R-MKT-03) | A per-execution VERP Return-Path and the `DeliveryReportIntake` email ECA parse DSN (RFC 3464) and ARF (RFC 5965) reports into ledger events and suppression, beside provider callbacks. §§4, 12, 15. |
| CheckIn scanning (Nov 1, 2026; review §3.4) | No camera: the framework has no camera decoder, so CheckIn uses the built `scan-input` (wedge scanner or typed code) and attendee lookup on a `density="handheld"` screen; a camera mode is not a Marketing need. §9. |
| Storeless order effects (Nov 1, 2026; review X1) | Paid tickets are storeless sales orders by default, taxed through the organization's gateway by Mantle's fallback; promotions stay store-only; a store order only when the registration policy names a store. §9. |
| One delivery ledger (Nov 1, 2026; review X8) | Comms owns the one Mantle attempt and receipt ledger; Marketing keeps CampaignSend and CampaignRecipient as intent and selection and drops its own attempt/event store; event notices and automation sends are ledger sources. §§5, 14, 15. |
| One payment coordinator (Nov 1, 2026; review X9) | Registration payment is a thin wrapper over Accounting's typed PortalPaymentAttempt coordinator, purpose `eventRegistration`; no Marketing payment-result operation. §§9, 13. |
| Tracking and attribution (Nov 1, 2026; review X10) | Marketing owns capture on the authority (tracking code plus opaque visitor key, not `moqui.server.Visit`) and `record#OrderAttribution`, called by `handle#OrderPlaced`, the one handler of the Mantle SECA `OrderPlacedRecordAttribution` registered in crosscut §1.3 (Nov 11, 2026; impl-marketing §4); the redirect and pixel are mr-pass web scripts (impl-marketing F55); Sales maps UTM source and medium to the lead DataSource. §§8, 11. |
| Metric owners (Nov 1, 2026; review X11) | Marketing owns `Marketing.Visits` and `Marketing.AttributedOrders` and the attribution model, including the later multi-touch model; Sales `Sales.Orders` and `Sales.OrderValue`, Accounting `Accounting.InvoicedRevenue`, Insights the funnel (the registered IDs, Nov 11, 2026; impl-marketing F34). §11. |
| Organization scoping (Nov 1, 2026; review X12) | Denormalized, audited `organizationPartyId` on MarketingCampaign; MarketSegment's and ContactList's existing `ownerPartyId`; filter rows for the three in both organization filter sets (Nov 11, 2026: MarketSegment already had an owner field, impl-marketing F4). §1.1. |
| Public site pages (Nov 1, 2026; review X14) | Landing pages use the shared Pages/PageDetail over `PublicSitePage` extended with mount, route, locale and publication window; no PublicShopPage. §8. |
| Identity hygiene (Nov 1, 2026; review X15) | Merges go through Commons and the guards in `merge#Parties`; one PASS Account Email preferences page replaces Marketing Preferences, with `/u/` kept where no PASS Account is mounted (impl-marketing F25); Shop's checkout opt-in, built on the consent services, records through `request#Subscriptions` once Marketing builds it (impl-marketing F26); SubmitForm is the one public lead page; Marketing registers a privacy provider when Admin's PrivacyServices exist (impl-marketing §4). §§10, 13. |
| Smaller ownership calls (Nov 1, 2026; review X16) | One FormPublication/FormInvitation owned by Commons, with Marketing's first summaries; lead intake is Sales' `store#LeadIntake` in Sales S1 with fixed-queue routing. §10. |
| Import (Nov 1, 2026; review Z2) | AudienceImport is an owner wizard registered in Admin §11's import targets; it keeps its consent-evidence wizard and batch record. §4. |
| Import permission (Nov 11, 2026; impl-marketing §4, the user's call) | The `marketingAudience` target names the app's own MARKETING_AUDIENCE_IMPORT, checked by the wizard services beside MARKETING_AUDIENCE_EDIT, and no `ADMIN_*` permission; granted to BOSS_MARKETING_AUDIENCE and in its capability bundle; the membership export asks MARKETING_AUDIENCE_EXPORT alone. One answer for People, Maintenance, Sales and Marketing. §§1.1, 4. |
| Store-sold tickets later (Nov 11, 2026; impl-marketing §4, the user's call; was Open 4) | This build sells tickets on PASS Register only, storeless unless the event's policy names a store; a ticket bought in a Shop cart with other products waits for a later Shop design. X9 settles payment. §§9, 13. |
| One-person team approval (Nov 11, 2026; impl-marketing §4, the user's call; was Open 5) | A MarketingPolicy flag, off by default, lets an author approve and release their own send to fewer than 500 recipients, recorded as a self-approval; at 500 or more the normal separation holds. §§3, 5, 12. |
| SMS in the build, last (Nov 11, 2026; impl-marketing §4, the user's call; was Open 2) | SMS is M8, built after the first release's gate on the built C4-SMS; a deployment still needs a messaging bridge; the ledger checks `PcpSms` consent on the topic, and Mantle answers the `sms-consent` hook for the number and organization (impl-marketing F57). §§12, 17. |
| Delivery ledger (Nov 11, 2026; impl-marketing §4, F12–F14; was Open 1) | The ledger was built with Shop; M3 extends it for a campaign (suppression, profile and receipt facts, source-given content, organization and topic consent) and builds no attempt store; a Marketing send registers no mail outcome owner of its own. §§5, 14.1, 15. |
| Ticket order approval (Nov 11, 2026; impl-marketing §4 and impl-sales §4, the user's call) | The seller's SalesPolicy approval setting is respected for a ticket order: with it on the paid order stays Placed until a holder of `SALES_ORDER_APPROVE` approves it, the registration pending, payment received, with no ticket meanwhile; off by default, when the attempt's authorization approves and confirms at once through `autoApprove#Order`. §§9, 13. |
| Readiness and lifecycle (Nov 11, 2026; impl-marketing §4, F59) | Marketing registers its own readiness provider `marketing.setup` and a lifecycle participant for a departing user's campaign manager and contributor rows; a Comms-owned provider waits for Comms' settings area. §14.3. |
| Public subscriber (Nov 11, 2026; impl-marketing §4, F43) | `request#Subscription` makes or matches a Party without disclosing which, with a pending membership; no provisional address. §§13, 14.1. |
| Comms mounts later (Nov 11, 2026; impl-marketing §4, F16) | MessageTemplates, SendingProfiles, Suppressions and CampaignDelivery are `Shared/` files Marketing builds with Marketing's mounts only; Comms' own mounts wait for a Comms settings area. §§4, 5, 12. |
| Approval topics and survey builder (Nov 11, 2026; impl-marketing F42, §4) | The three approval topics are seeded with Marketing's data, not in a Commons file; the survey builder's per-app registration and `mantle.party.FormDefinitionServices` are People's build, to which Marketing adds its registration and the public purposes. §§3, 10. |
| Store purposes (Nov 11, 2026; impl-marketing F10) | Commerce's PcpCartReminder and PcpReviewRequest stay Commerce's store topics and are not Marketing topics; Marketing seeds `PcpTracking` and `PcsCheckout`. §8. |
| Report owners (Nov 1, 2026; review Z10) | Marketing registers its reports with the Insights catalog. §11. |
| Stack contributions (Nov 1, 2026; review L1–L9) | Assist skills, prompts and read-only exposures; meetings as Events with a CallLink; the projected campaign calendar; bounce and unsubscribe email ECAs instead of a mail-intake action; delivery-ledger sources; CheckIn on a CX-DEVICE session; shipped report definitions and alerts replacing the operational-measures list; Comms providers; `fancy-locked-html`. §1.3. |
| Reference features (Nov 1, 2026; review §6) | Added: order and cart triggers on the delivery ledger (MKT-R03, §6). Open: block email builder, campaign stages and tags. Later: social share cards (MKT-R02); live-chat-to-lead beyond Sales' `create-from` on a chat message (MKT-R05). |

## 21. Open

Deployment selects its SMTP providers, sending and bounce domains, retention intervals, approval
assignments and payment gateways through the defined configuration; an unconfigured channel cannot
claim to work. These choices remain, each with the recommended answer; items 1, 2, 4 and 5 are
answered and keep their numbers so that references to the others hold:

1. **Delivery ledger timing (X8).** Decided, §20 "Delivery ledger" (impl-marketing §4, Nov 11).
2. **SMS scope (R-MKT-11).** Decided, §20 "SMS in the build, last" (impl-marketing §4, Nov 11).
3. **Block email builder (MKT-R01).** Recommend later: a block mode of the Commons editor that
   saves safe HTML as MessageTemplate content, with a small theme set; the first release keeps the
   rich-text composer.
4. **Store-sold tickets.** Decided as recommended, §20 "Store-sold tickets later" (impl-marketing
   §4, Nov 11).
5. **One-person team approval policy.** Decided as recommended, §20 "One-person team approval"
   (impl-marketing §4, Nov 11).
6. **Attribution model (X10 residual).** Marketing owns the attribution model, multi-touch
   included; Insights owns the funnel. Recommend the first release stays primary-source, and a
   later multi-touch model is Marketing's, over the same MarketingTrackingEvent rows, which
   Insights then reads like any registered metric.
7. **Campaign stages and tags (MKT-R04).** Recommend a board by native campaign status now, and
   tags through one generic record-tag model owned by Commons and shared with Sales' deal tags;
   later.
8. **Publishing (amended).** Blog posts are designed here; recommend the PASS Publishing design
   take the editorial workflow (assignments, stages, scheduled release), taxonomy and public blog
   rendering over the same WikiBlog records, and that the deferred capabilities of §16.1/§17 get
   their own designs before they are built.
