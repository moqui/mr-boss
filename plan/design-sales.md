# IronStone BOSS — Sales design

Nov 13, 2026 — impl-sales P0's remaining checks written in (impl-sales F53–F73): the Comms hooks as Comms renders them
(Mail's `message-actions` slot made to render in P5, a voicemail's action a transition, the `contact-card` read by Mail; §§1.4, 3, 12.2);
template text rendered by `fancy-locked-html` from a stored location with an explicit map (§§1.4, 5); the
OrderChangeApproval link resolved per recipient (§§1.3, 5); the funnel's row filter and its static output (§§3, 8); the
borrowed `PEOPLE_DIRECTORY_VIEW` and the lifecycle's `SALES_OWNER_CHANGE` (§1.1); the active-organization user-facts
provider built by Sales (§1.4).
Nov 11, 2026 — the plan's decisions written in (impl-sales §4): a seller's SalesPolicy approval setting stops every
automatic approval of its sales orders; a pre-approval warning, Sales' own too, blocks auto-approval as built, and with
the setting on the warnings are shown to the approver only (§§1.1, 5, 6, 9, 13.1);
a quote template is an order of purpose `OrpSalesQuoteTemplate` (§5, SAL-TEMPLATE); approvals extend OrderDecision; a
high-value acceptance needs PASS sign-in above a threshold unset by default (§§9, 10); the import target names
`SALES_IMPORT` (§§1.1, 3, 16); §19 items 2 and 3 moved to §18.
Nov 11, 2026 — implementation plan written ([impl-sales.md](impl-sales.md)); the corrections its P0 found are made here
(impl-sales F3, F7, F9, F11, F17, F19, F24, F26, F38): what the apps built since Nov 1 already provide, and the
built names. Its review the same day finished them (the topic's seeding in §§5, 12.2 and 17, the X4 text of §1.1, the
revision fallback of §5, the baseline path in §14.2) and added the merge guard's callers to §4 (impl-sales F45).
Nov 1, 2026 — draft; reviewed against research-sales.md, the reference apps and the other designs (the suite-app review, since removed from the tree; read it with `git show bd74564^:plan/review-suite-apps.md`).

IronStone Sales serves representatives, account managers and sales managers: leads and opportunities,
accounts and contacts, requests for quote, quotations and orders, customer agreements and prices,
forecasts and sales reporting. An organization can use Sales without Commerce or a ProductStore:
a storeless quote or order is taxed through the organization's tax gateway, has no store promotions,
and gets its confirmation mail from Sales (§5, X1). Its customer quote and order pages form an
independent **Sales app in IronStone PASS**, over the same Mantle records, without a runtime
dependency on BOSS.

**Inputs:** [sales research](research-sales.md), [initial decisions](initial-design.md),
[design guide](design-doc-guide.md), [style guide](style-guide.md),
[crosscut](design-crosscut.md), [Commons and Comms](design-drawers-commons.md),
[Projects](design-projects.md), [Products](design-products.md),
[Customer Service](design-customer-service.md), [Purchasing](design-purchasing.md),
[Warehouse](design-warehouse.md), [Accounting](design-accounting.md),
[Commerce](design-commerce.md), [Marketing](design-marketing.md), [People](design-people.md),
[Insights](design-insights.md), [Admin](design-admin.md), [Shop](../../mr-pass/plan/design-shop.md),
[PASS foundation](../../mr-pass/plan/design-forum.md),
[screen inventory](ss-inventory.md) and [service inventory](usl-inventory.md).
Decisions marked X, Z or L cite §3 of the suite-app review (see above).
The [shared ground rules](impl-drawers-commons.md#4-ground-rules) and
[application practices](../../../../../docs/dev/Practices-App-Dev.md) govern ownership,
permissions, dated associations, audit history, XML screens and service implementation.

**Sections:** [1 shell](#1-shell) · [2 screens](#2-screens) ·
[3 pipeline](#3-home-and-pipeline) · [4 accounts](#4-accounts-and-contacts) ·
[5 quotes](#5-quotes-and-requests-for-quote) · [6 orders](#6-orders-and-commercial-changes) ·
[7 agreements](#7-agreements-pricing-and-recurrence) · [8 reports](#8-reports-and-forecasts) ·
[9 settings](#9-settings) · [10 customer access](#10-pass-sales-customer-access) ·
[11 later](#11-later-capabilities) · [12 contracts](#12-service-and-shared-screen-contracts) ·
[13 automation](#13-automation-and-operations) · [14 coverage](#14-coverage-and-acceptance) ·
[15 delivery](#15-delivery-stages) · [16 outputs](#16-documents-and-outputs) ·
[17 needs](#17-framework-and-data-needs) · [18 decisions](#18-decided) · [19 open](#19-open).

**Source convention.** Baseline screen names are relative to
`mr-marble/screen/SimpleScreens/`; Mantle paths are relative to `mr-mantle/`. Third-party
patterns are attributed to the corresponding research section. Service abbreviations in form
tables are defined in §12.1; every abbreviated Sales service is **proposed** unless marked existing.

**Starting point.** The Sales root, section placeholders and SalesSummary/SalesAnalysis
screens exist; the root grants `ADMIN` and `BOSS_SALES_ADMIN`. There is no CRM or quote application yet.
`SalesEntities.xml` has opportunities, dated parties, stages, order/work/tracking joins and forecasts,
but no opportunity lifecycle services, seeded opportunity types or default stages.
`AccountServices.xml` supplies account/contact operations; their authentication and organization
guards must be extended before exposing them through Sales. The agreement statuses (AgmSt*) are seeded
by Purchasing, whose services are purchase-only. Built since this design was written (impl-sales §6):
`OrderHeader.orderPurposeEnumId` with the one value `OrpRecurringTemplate` (Shop; Sales seeds `OrpSalesQuote`
and `OrpSalesOrder`, the IDs of the SalesQuote and SalesOrder values named below); the commercial revision
behind `PartyAcctgPreference.salesCommercialRevisionOnly` (X2); the hold-type release permissions and the
purchase direction of `approve#Order` (X4; the sales direction and the seller's approval setting are not, §1.1);
`mantle.order.OrderChangeServices` with the commercial kinds filed and decided but applied by no one;
ExternalAccess's `SalesOrder` kind (OrderView for a placed order, opening Shop's page), the self
relationship and the `support` app kind (X6; the `sales` app kind and the quote scopes are not); the Comms
delivery ledger (X8); and Customer Service's stored order confirmation (`mantle.order.OrderConfirmationServices`).
The Products price resolver implements customer/agreement/list matching and explanation despite
obsolete TODO comments in PriceServices. XML board/calendar views, generic record/activity links,
shared files and Accounting's credit, posting-operation and external-access services exist.
Shared OrderDetail implements the Projects and Accounting contexts; this file adds the Sales ones.
Today a storeless order gets no tax, carrier estimate, promotion or confirmation mail:
`mantle.order.OrderServices.handle#OrderMajorChange` runs only with a store,
`mantle.other.TaxServices.calculate#OrderSalesTax` finds its gateway only through the store, and
`mantle.order.OrderInfoServices.send#OrderStoreEmail` returns without one. X1 fixes tax in Mantle;
Sales owns the storeless confirmation (§5).

## 1. Shell

### 1.1 Root and authority

Keep `screen/Sales.xml`, app path `Sales`, icon `sym_o_handshake` and
`mantle.party.PartyServices.setup#UserOrganizationInfo`. Proposed
`ironstone.sales.ContextServices.get#SharedContext` returns capabilities, authorized organization
choices, `appRoot` and `sharedLinks`. Ordinary groups use `MANTLE_USER_ORG` and
`MANTLE_PRIVATE_CONTACT`; `BOSS_SALES_ADMIN` uses `MANTLE_ACTIVE_ORG`.
All reads, searches, exports, choices, batch operations and mutations independently check their
permission and record organization in Mantle. App context adds filters and presentation, never authority.

**Organization filter (X12).** An entity filter cannot follow a dated role row, so the proposed
`SalesOpportunity.organizationPartyId` is a denormalized, audit-logged copy of the effective
internal-organization SalesOpportunityParty row, kept equal to it by O. Proposed filter rows in
both `MANTLE_USER_ORG` and `MANTLE_ACTIVE_ORG` cover SalesOpportunity, SalesForecast and Agreement
by `organizationPartyId` (the last two already have the field). Owner, team and contact remain
dated party roles; they narrow visibility inside the organization and never widen it.

**Order approval and holds (X4).** As built (impl-sales F11): the hold-type seed below and the purchase
direction of `approve#Order` are done, and `approve#Order` calls the credit check itself; the sales direction,
`SALES_ORDER_APPROVE` and the seller's approval setting are Sales' to build (impl-sales P9, P11).
The hold types carry their release permissions through `Enumeration.enumCode` (crosscut §1.4): OhtChange
`ORDER_CHANGE_HOLD_RELEASE`, OhtPurchase `PURCHASE_HOLD_RELEASE`, OhtManual `ORDER_APPROVE`, OhtCredit
`CREDIT_HOLD_RELEASE`, and OhtPayment `PAYMENT_HOLD_RELEASE`, released by an Accounting payment
operator. `approve#Order` goes by direction: a part whose customer is internal needs
`PURCHASE_ORDER_APPROVE`; a part whose vendor is internal needs `ORDER_APPROVE` as today, or, where
the seller's approval setting is on, proposed `SALES_ORDER_APPROVE` and a current Sales decision
where a rule asks one. Sales maps `SALES_ORDER_APPROVE` and `ORDER_APPROVE` to BOSS_SALES_APPROVE
and `ORDER_CHANGE_HOLD_RELEASE` to BOSS_SALES_CHANGE, and never maps Purchase, Credit or Payment
release.

**The seller's approval setting (impl-sales §4, Nov 11, 2026).** SalesPolicy (§9) has an approval
setting: whether the seller's sales orders wait for a Sales approver. It is off by default, and
with it off Mantle approves as today. Where it is on, no sales order of that seller is approved
automatically on a payment authorization, whichever app placed it (Sales, Shop's checkout and
renewals, Commerce's staff orders, Marketing's ticket order): the order stays Placed, its payment
authorized, until a holder of `SALES_ORDER_APPROVE` approves it. The rule is in
`mantle.order.OrderServices.autoApprove#Order`, through which every automatic approval goes
(`authorize#OrderPayments` at placement, the `OrderPlacedAutoApprove` SECA, the delayed-approval
job and the credit hold's release; impl-sales F52), and in the sales direction of `approve#Order`.
A pre-approval warning blocks auto-approval, as built: `autoApprove#Order` refuses on any warning
of `mantle.order.OrderInfoServices.check#OrderPreApprove`. Sales' pre-approval warnings (an
unresolved Sales approval, a price under its floor) are added to that check as Accounting's credit
warning and Purchasing's approval warning are, so with the setting off a Sales warning keeps its
order from automatic approval like the others. Only with the setting on, when approval is always
manual and no automatic path is left for them to block, are the warnings shown in the UI only:
OrderDetail's approval section and the Awaiting approval list show them to the person approving,
and they do not refuse that approval.

The following groups/permissions are proposed. **R** means representative, **M** manager,
**A** sales approver, **P** price editor, **C** commercial-change operator, **S** administrator,
**V** reader and **E** external customer. Groups compose permissions; an edit permission alone
does not confer unrestricted read access.

| Group | Permissions and boundary |
| --- | --- |
| BOSS_SALES | Root entry and SALES_VIEW for authorized Sales records |
| BOSS_SALES_REP | SALES_OPPORTUNITY_EDIT, SALES_ACCOUNT_EDIT, SALES_QUOTE_EDIT, SALES_QUOTE_SEND, SALES_ORDER_EDIT; assigned/team opportunities, own/team quotes/orders, permitted organization accounts |
| BOSS_SALES_MANAGER | SALES_TEAM_VIEW, SALES_TEAM_MANAGE, SALES_FORECAST_EDIT, SALES_REPORT_VIEW, SALES_OPPORTUNITY_EDIT, SALES_ACCOUNT_EDIT, SALES_QUOTE_EDIT, SALES_QUOTE_SEND, SALES_ORDER_EDIT, SALES_CUSTOMER_INVITE and SALES_IMPORT (the opportunity import, §3); all Sales records of permitted organizations |
| BOSS_SALES_APPROVE | SALES_APPROVE, proposed SALES_ORDER_APPROVE (approve#Order on sales parts of a seller whose approval setting is on, X4) and ORDER_APPROVE (sales parts elsewhere, and Manual holds); decide policy exceptions and own the Awaiting approval queue for permitted records; does not grant credit, purchase or payment hold release or price-list editing |
| BOSS_SALES_CHANGE | SALES_ORDER_CHANGE and proposed ORDER_CHANGE_HOLD_RELEASE (OhtChange, X4); propose/apply approved commercial changes; approval requires SALES_APPROVE separately (`OrderChangeServices` checks by change kind, §6) |
| BOSS_SALES_AGREEMENT | SALES_AGREEMENT_EDIT, SALES_RECURRENCE_MANAGE; scoped agreement/recurrence management |
| BOSS_SALES_READ | SALES_VIEW, SALES_TEAM_VIEW, SALES_REPORT_VIEW; permitted organization reports and records, no mutation |
| BOSS_SALES_ADMIN | SALES_CONFIGURE plus explicit Sales view/edit capabilities; configuration does not confer finance, cost, stock or deployment authority |

BOSS_SALES_MANAGER and BOSS_SALES_ADMIN also hold People's `PEOPLE_DIRECTORY_VIEW`, so TeamMembers' employee lookup
and an employee's work card open for those who manage teams, as Maintenance's planners hold it (impl-sales F53). Mantle
also seeds `SALES_OWNER_CHANGE`, which no Sales group holds: Admin's identity group gets it for the Sales lifecycle
participant's transfer of a departing user's opportunities, accounts and open quotes (impl-sales F54).

As built (impl-sales P1 and its review): Mantle seeds the twenty `SALES_*` permissions, each granted to `ADMIN`, and reads them in one scope
module, `mantle/sales/SalesAccess.js` (the capabilities, the reads `anyRead` of `SALES_VIEW`, `SALES_TEAM_VIEW` or
`SALES_REPORT_VIEW`, `teamRead` and `reportRead`, an edit permission alone reading nothing; the caller's own organizations, the
active one when it is theirs, every one for a system administrator or a holder of `SALES_ALL_ORGANIZATIONS`, which reads nothing by
itself). The setup is mr-boss `data/BossSetupSalesData.xml`:
every ordinary group's user is in `BOSS_SALES`, which carries `SALES_VIEW`; the table's grants but the four a built service checks
(`SALES_APPROVE`, `ORDER_APPROVE`, `SALES_ORDER_CHANGE`, `ORDER_CHANGE_HOLD_RELEASE`, granted with their screens, F43), so
BOSS_SALES_APPROVE holds `SALES_ORDER_APPROVE` and BOSS_SALES_CHANGE nothing beyond the view until then; BOSS_SALES_ADMIN holds
`SALES_CONFIGURE` with the manager's and the agreement keeper's views and edits (`SALES_IMPORT` among them) and no approval or
owner change (the user's call, Nov 13), and `SALES_ALL_ORGANIZATIONS` alone of the groups (the user's call, Nov 13; Mantle seeds it,
granted to `ADMIN`), so its Sales scope is every internal organization, as its root's `MANTLE_ACTIVE_ORG` is while none is active; `SALES_OWNER_CHANGE` is BOSS_ADMIN_IDENTITY's. Reports is an area of its own (`BOSS_SAL_REPORTS`: the root user
group denied, the manager and the reader allowed) and is shown to a holder of `SALES_REPORT_VIEW`. The root serves the Chatter and
RecordFiles panels of Sales' own record hosts only, which join with their records (P3, P4, P7, P11, P15).

A rep sees shared accounts in the permitted organization and opportunities assigned to them or
their dated team; managers/readers with team-view authority see the organization-wide pipeline.
Order/quote access additionally requires the permitted selling organization and its record assignments;
unassigned intake is a team queue available to that team's members. Customer links do not widen
opportunity visibility. Organization administration does not expose another user's private contacts.
An assigned approval grants its authorized approver the source projection needed to decide that
request, not an unrestricted team pipeline. Native order assignment uses dated OrderPartParty roles.
SALES_QUOTE_SEND permits issuing one reviewed offer and its scoped link; SALES_CUSTOMER_INVITE
permits an account-bound PASS Sales invitation and is also granted explicitly to Sales admins.
SALES_ORDER_EDIT covers draft entry and permitted native lifecycle actions, while changes after
placement require SALES_ORDER_CHANGE and approval. Party-role writes are limited to the offered
commercial roles/relationships; they cannot assign internal-organization, employment or security roles.

**Borrowed capabilities.** Existing Products `PRICE_VIEW`/`PRICE_EDIT` and cost-view permissions
govern shared price screens and margin; their BOSS groups remain Products-owned. Existing Accounting
receivable/payment/credit permissions govern money actions; Warehouse capabilities govern reservation
and fulfillment. Source services supply masked financial summaries only when permitted. Sales may
show an actionable credit-block reason without disclosing the customer's ledger or bank details.
Public customers have PASS identities/capabilities, never a BOSS role.

### 1.2 Menu

- Home — `Home`
- Pipeline
  - Opportunities — `Opportunities`, board default
  - Leads — `Leads`; Forecast — `Forecast`
- Accounts
  - Accounts — `Accounts`; Contacts — `Contacts`
- Quotes
  - Quotes — `Quotes`; RFQs — `QuoteRequests`
  - Quote templates — `QuoteTemplates`; Approvals — `Approvals`
- Orders
  - Orders — `Orders`; Changes — `OrderChanges`
- Agreements and prices
  - Agreements — `Agreements`; Customer prices — `CustomerPrices`
  - Price lists — `PriceLists`; Recurring orders — `RecurringOrders`; Subscriptions — `Subscriptions`
- Reports
  - Sales summary — `SalesSummary`; Sales analysis — `SalesAnalysis`
  - Pipeline analysis — `PipelineAnalysis`; Win/loss — `WinLoss`; Target attainment — `TargetAttainment`
- Settings
  - Stages — `Stages`; Teams — `Teams`; Sources — `LeadSources`
  - Targets — `Targets`; Types and reasons — `TypesAndReasons`
  - Defaults — `SalesDefaults`; Approval policies — `ApprovalPolicies`

Detail, shared-record, print, import and quick-create routes are hidden from the menu. Later
screens (§11) are absent until their capability ships. Home puts due work and quote/order
exceptions above a compact My pipeline view; every counter opens the same scoped list.

### 1.3 Interaction and shell providers

Use XML screens and native list/board/calendar widgets. Pipeline drag has a visible Change stage
dialog calling the same service, including on a phone and in TUI. New record is the list's primary
action; a detail header chooses one action from its state and puts others in More. Confirm
conversion, merge, send, accept/decline, approve, cancellation and bulk actions with record/count.

Every list has search, pagination, saved filters and two useful phone columns. Money includes
currency; quantities include UOM. Dates use the user's zone. Empty, denied and failed data are
distinguishable without leaking inaccessible record identity: “No opportunities” offers Create;
“Not available” links back; a failed metric is unavailable, never zero. A custom chart has a
tabular TUI equivalent and its underlying authorized data/export.

QuickCreate offers Lead, Opportunity, Account, Contact, Quote and Activity by capability.
The palette indexes authorized opportunities, accounts, quotes/orders and agreements; each row
carries `recordEntity` and `recordId` so Assist's `search` tool can open it. Record context
identifies the host and source selection; Today reuses WorkEffort activities rather than
`nextStep` text. Approval notifications use the SalesQuoteApproval topic, seeded in Mantle beside
the built OrderChangeApproval topic (no topic of that name is seeded yet; impl-sales P9); its push
title names the quote, never the amount. A notification has one link for all its recipients, so OrderChangeApproval's link
is Commons' `openRecord` link of the change request, which opens Sales' OrderChangeDetail for a Sales approver of a
commercial kind and Customer Service's otherwise (impl-sales F58).
All providers use the same domain filters as lists. Chatter, files, mail composition,
calendar and reminders retain their existing owners. **Needs:** SAL-ACCESS, SAL-SHELL, SAL-COLLAB.

### 1.4 Stack contributions

Sales plugs into the framework through the crosscut §1.5 contracts (L1–L9). What is not built is a
need in §17.

| Contract | Sales entries |
| --- | --- |
| CX-ASSIST (L1) | Procedure skills in mr-boss `skill/`: `sales-qualify-lead.md`, `sales-issue-quote.md`, `sales-follow-up.md`, `sales-log-call.md`, each with `screens:` so they show as chips, `skill/aliases.json` (quote, RFQ, deal, account) and `test/skill-retrieval.json`. `assist-prompt` chips: OpportunityDetail "Summarize this deal", "Draft a follow-up", "What changed since the last activity"; OrderDetail quote context "Explain this price", "Draft a cover note"; Customer360 "Open work for this account". `response-action`s "Log as note" (a Chatter note on the host) and "Send as message" (opens Comms Compose). `AgentToolExposure` rows only for O/Q verbs no single screen does: O.create#Opportunity, O.move#Opportunity, O.close#Opportunity, Q.preview#Quote and Q.send#Quote, every mutating one behind an Assist approval; `exposeMcp` is Y for O.find#Opportunities and Q.find#Quotes and N for mutating verbs. Prerequisite: the Mantle active-organization user-facts provider (crosscut CX-ASSIST), which no component registers yet, so Sales builds it (impl-sales P6, F65); the facts are fixed when a conversation starts, so a tool still takes its organization. **Needs:** SAL-ASSIST |
| Comms hooks (L8) | As Comms renders them (impl-sales F64): `record-lookup` for SalesOpportunity and quote/order OrderHeader; `create-from` kinds Lead and QuoteRequest, which Comms offers on a chat message; `ext-action`s "Create lead" in `chat-message-actions` and `voicemail-actions` (a voicemail's action is a transition given the voicemail, on Customer Service's pattern) and "Log call on opportunity" in `call-actions` and `voicemail-actions`; `call-context` answers with the caller's open opportunities and quotes the user may see, for the ring bar and the call; `contact-card`, which Comms' Mail reads, answers with the sender's account or lead card. "Create lead" and "Create RFQ" are in Mail's `message-actions` slot, which Sales P5 makes basic-comms render (impl-sales §4, Nov 13). As built (P5): create-from kind lead is a kind of Comms' one provider `boss.records` (ChatServices.create#FromChat, as Customer Service's case and People's kinds are), since a second create-from provider would answer every kind; Mail's slot posts the framework's `createRecord` transition with the message's ids; `record-lookup` comes before Comms' own (Sales' link), `contact-card` after it (a lead's card for an inquirer who is no party yet), and "Log call on opportunity" is a dialog (Sales/Pipeline/LogCall) mounted in Calls/Call and Calls/Voicemail. **Needs:** SAL-SHELL |
| Meetings (L7) | A meeting activity is a Commons Event with a CallLink ("Add video call" on EventDetail); prospects are invited by iMIP through `mantle.work.EventServices.send#EventInvitations` and join by the link as guests, without an account (§3) |
| CX-SYNC (L2) | Activities are events and tasks in the user's own CalDAV calendar already. Account contacts appear on reps' phones as a read-only projected CardDAV address book, "My accounts", answered by S with the rep's account scope (§4). **Needs:** SAL-SYNC |
| CX-MAIL-INTAKE (L3) | `EmailRuleAction` actions `createLead` (O.store#LeadIntake) and `createQuoteRequest` (Q.create#QuoteRequest), reached by plus-tag intake addresses such as `sales+leads@` and `sales+rfq@` (§§3, 5). **Needs:** SAL-MAIL-INTAKE |
| CX-DELIVERY (L4, X8) | Storeless order confirmation, quote reminders and QuoteBatch sends are sources of the one Comms delivery ledger (§13) |
| CX-OPS-REPORTS (L6) | A shipped pipeline dataset, dashboard and alert templates ("quote expiring", "deal stalled") and a weekly pipeline/forecast digest schedule beside Mantle's `report/mantle-sales*.json`; `operation`/`operation-ref` on QuoteBatch, opportunity import and the recurrence guard (§8). These replace bespoke operational-measure lists. **Needs:** SAL-REPORT |
| Templates and extraction (L9) | Quote cover text, terms and reminder templates render with the built `fancy-locked-html` renderer (§5): stored at a resource location and rendered by the mail's and print's script with an explicit map of the fields they may use, inside the trusted mail body and print (impl-sales F70); QuoteExtraction uses `org.moqui.agent.AiTaskServices.run#Extract` and returns proposals reviewed before any write (§11) |

## 2. Screens

Paths are relative to the BOSS root unless prefixed `PASS:`. `app` means the appropriate scoped
view permission, not every user of the launcher. S1–S3 are delivery stages (§15); Scope retains
the guide's parity/new/later meaning. All initial screens are XML; PASS pages also render HTML.
Dialogs with a single form stay on their host. Quote and order links use one canonical
`Sales/Orders/OrderDetail` route, with mode derived from the record.

| Screen | Path | Archetype | Impl | Purpose | Main record | Reused | Roles | Scope | Context |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home | Sales/Home | landing | xml | Due work and sales health | SalesOpportunity/OrderHeader | own §3 | app | new | organization; scoped lists |
| Opportunities | Sales/Pipeline/Opportunities | list | xml | One pipeline in board/list/calendar views | SalesOpportunity | own §3 | R,M,V | new | rows; find parameters |
| Leads | Sales/Pipeline/Leads | list | xml | Qualify incoming interest | SalesOpportunity | own §3 | R,M | new | lead rows; filters |
| OpportunityDetail | Sales/Pipeline/OpportunityDetail | detail | xml | Work a lead or opportunity | SalesOpportunity | own §3 | R,M,V | new | salesOpportunityId |
| Forecast | Sales/Pipeline/Forecast | report | xml | Commit forecasts against pipeline | SalesForecast | own §8 | R,M,V | new | organization, party, period, currency |
| WorkItemDetail | Sales/Pipeline/WorkItemDetail | detail | xml | Follow linked activity/task | WorkEffort | Projects §5; CX §3.12 | app | parity | workEffortId |
| Accounts | Sales/Accounts/Accounts | list | xml | Find/create customer accounts | Party | own §4 | app | parity | Party rows; filters |
| Contacts | Sales/Accounts/Contacts | list | xml | Find/create account contacts | Party | Commons contacts; context §4 | app | parity | party/account filters |
| Customer360 | Sales/Accounts/Customer360 | 360 | xml | Customer's commercial work | Party | CX §3.2; context §4 | app | parity | customerPartyId |
| ContactDetail | Sales/Accounts/ContactDetail | detail | xml | Maintain a person and channels | Party | Commons contact; CX §3.1 | app | parity | partyId |
| MergeAccounts | Sales/Accounts/MergeAccounts | list | xml | Review and merge duplicate parties | Party | Commons §6 Duplicates; context §4 | M,S | parity | selected source/survivor |
| Quotes | Sales/Quotes/Quotes | list | xml | Draft, proposed and expired offers | OrderHeader | own §5 | R,M,V | parity | rows; quote filters |
| QuoteRequests | Sales/Quotes/QuoteRequests | list | xml | Customer RFQ intake | Request | own §5 | R,M | parity | RqtQuote rows |
| QuoteRequestDetail | Sales/Quotes/QuoteRequestDetail | detail | xml | RFQ lines, evidence and quote creation | Request | Projects RequestDetail; CX §3.11 | R,M,V | parity | requestId |
| QuoteTemplates | Sales/Quotes/QuoteTemplates | list | xml | Reusable standard offers | OrderHeader (purpose `OrpSalesQuoteTemplate`) | own §5 | R,M,S | new | template rows |
| QuoteTemplateDetail | Sales/Quotes/QuoteTemplateDetail | detail | xml | Maintain template lines and terms | OrderHeader (purpose `OrpSalesQuoteTemplate`) | own §5 | M,S | new | orderId |
| Approvals | Sales/Quotes/Approvals | list | xml | Sales exceptions awaiting decision | OrderDecision/NotificationMessage | Commons approvals; context §5 | A | new | topics; source revision |
| Orders | Sales/Orders/Orders | list | xml | Commitments and fulfillment | OrderHeader | own §6 | app | parity | sales-part rows; filters |
| OrderDetail | Sales/Orders/OrderDetail | detail | xml | Quote and sales-order action sets | OrderHeader | CX §3.6; contexts §§5–6 | app | parity | orderId; part/item selection |
| OrderChanges | Sales/Orders/OrderChanges | list | xml | Commercial proposals awaiting action | Request | own §6 | C,A,M | new | RqtOrderChange rows |
| OrderChangeDetail | Sales/Orders/OrderChangeDetail | detail | xml | Compare, decide and apply a change | Request/OrderChangeDecision | Customer Service §4; context §6 | C,A,M | new | requestId; orderRevision |
| ShipmentDetail | Sales/Orders/ShipmentDetail | detail | xml | Follow shipment and tracking | Shipment | CX §3.8; §12.2 | app | parity | shipmentId |
| InvoiceDetail | Sales/Orders/InvoiceDetail | detail | xml | Permitted invoice and settlement facts | Invoice | Accounting; CX §3.16; §12.2 | finance view | parity | invoiceId |
| Agreements | Sales/Agreements/Agreements | list | xml | Customer terms and contracts | Agreement | own §7 | app | parity | sales agreement rows |
| AgreementDetail | Sales/Agreements/AgreementDetail | detail | xml | Parties, terms, prices and evidence | Agreement | own §7; reusable | agreement capability | parity | agreementId |
| CustomerPrices | Sales/Agreements/CustomerPrices | list | xml | Scoped customer/agreement price rows | ProductPrice | Products Prices; context §7 | price view/edit | parity | seller, customer, agreement |
| PriceLists | Sales/Agreements/PriceLists | list | xml | Sales lists and rules | ProductPriceList | Products §7; CX §3.21 | price view/edit | new | pricing scope |
| PriceListDetail | Sales/Agreements/PriceListDetail | detail | xml | Maintain authorized list/rules | ProductPriceList | Products §7; CX §3.21 | price view/edit | new | priceListId |
| PriceExplain | Sales/Agreements/PriceExplain | report | xml | Explain transaction pricing | PriceServices.get#ProductPrice | Products §7; CX §3.21 | price view | new | price context |
| RecurringOrders | Sales/Agreements/RecurringOrders | list | xml | The one editor of native recurring bases | OrderHeader | own §7 | recurrence capability | parity | baseOrderId; filters |
| Subscriptions | Sales/Agreements/Subscriptions | list | xml | Access periods and renewal sources | Subscription; StoreRecurringContract | Commerce §6 Subscriptions; context §7 | app | new | subscription rows |
| Product360 | Sales/Products/Product360 | 360 | xml | Product, variants and permitted prices | Product | CX §3.5; §12.2 | app | parity | productId; sale context |
| InventoryAvailability | Sales/Products/InventoryAvailability | list | xml | Stock and promise evidence | Product/Asset | CX §3.7; §12.2 | app | parity | product, facility, quantity/date |
| Reports | Sales/Reports | landing | xml | Report catalogue | report definitions | own §8 | report view | new | organization |
| SalesSummary | Sales/Reports/SalesSummary | report | xml | Orders, invoices and top customers/products | SalesReportServices | own §8 | report view | parity | report filters |
| SalesAnalysis | Sales/Reports/SalesAnalysis | report | xml | Sales dimensions and drill-down | OrderItemSalesSummary | own §8 | report view | parity | report filters |
| PipelineAnalysis | Sales/Reports/PipelineAnalysis | report | xml | Stage, source, age and activity analysis | SalesOpportunity | own §8 | report view | new | filters; as-of |
| WinLoss | Sales/Reports/WinLoss | report | xml | Outcomes and loss reasons | SalesOpportunity | own §8 | report view | new | filters; period |
| TargetAttainment | Sales/Reports/TargetAttainment | report | xml | Targets, forecast and actuals | SalesForecast | own §8 | report view | new | party, period, currency |
| Settings | Sales/Settings | settings | xml | Sales configuration index | — | own §9 | S | new | organization |
| Stages | Sales/Settings/Stages | settings | xml | Pipeline ordering and defaults | SalesOpportunityStage | own §9 | S | new | pipeline scope |
| Teams | Sales/Settings/Teams | settings | xml | Dated sales teams and members | Party/PartyRelationship | own §9 | M,S | new | team party |
| LeadSources | Sales/Settings/LeadSources | settings | xml | Shared acquisition sources | moqui.basic.DataSource | own §9; shared with Marketing | S | new | dataSourceId |
| Targets | Sales/Settings/Targets | settings | xml | Period quotas by party | SalesForecast | own §9 | M,S | new | forecast key |
| TypesAndReasons | Sales/Settings/TypesAndReasons | settings | xml | Types and structured outcomes | Enumeration | own §9 | S | new | enum type |
| SalesDefaults | Sales/Settings/SalesDefaults | settings | xml | Effective organization defaults | proposed SalesPolicy | own §9 | S | new | organization; effective date |
| ApprovalPolicies | Sales/Settings/ApprovalPolicies | settings | xml | Discount/amount exception rules | proposed SalesApprovalPolicy | own §9 | S | new | policy rows |
| QuickCreate | Sales/QuickCreate | panel | xml | Shell quick-create provider | selected record kind | own §12.2 | by action | new | source context |
| CustomerQuotes | PASS:Sales/CustomerQuotes | list | xml | Find own issued quotes | OrderHeader | own §10 | E signed in | new | self; organization |
| CustomerQuote | PASS:Sales/CustomerQuote | detail | xml | Review and respond to issued offer | OrderHeader | own §10 | E or scoped bearer | new | safe quote projection |
| QuoteResponse | PASS:Sales/QuoteResponse | detail | xml | Acceptance/decline receipt | proposed SalesQuoteResponse | own §10 | E or scoped bearer | new | response-scoped projection |
| CustomerOrders | PASS:Sales/CustomerOrders | list | xml | Find own accounts' orders, shipments and invoices | OrderHeader | own §10 | E signed in | new | self; organization |
| CustomerOrder | PASS:Sales/CustomerOrder | detail | xml | Follow one order's delivery and billing | OrderHeader | own §10 | E signed in or scoped bearer | new | safe order projection |
| ContractSchedules | Sales/Agreements/ContractSchedules | detail | xml | Advanced contract amendments/billing | Agreement | own §11 | agreement/finance | later | agreementId |
| Commissions | Sales/Reports/Commissions | report | xml | Explain source-earned commission | Agreement, AgrCommission | own §11 | M; restricted rep self | later | period; payee scope |
| Territories | Sales/Settings/Territories | tree list | xml | Effective coverage assignments | proposed SalesTerritory | own §11 | M,S | later | territory |
| AssignmentRules | Sales/Settings/AssignmentRules | settings | xml | Explain automatic routing | proposed SalesAssignmentRule | own §11 | M,S | later | organization/team |
| LeadIntakeForms | Sales/Settings/LeadIntakeForms | settings | xml | Publish bounded lead forms | DbForm; proposed FormPublication | Commons form publication (X16); context §11 | S | later | form/publication scope |
| SubmitForm | PASS:Marketing/SubmitForm | task | xml | Submit public interest (the lead context of Marketing's one public form page) | DbForm; FormResponse; proposed SalesLeadIntake | Marketing §13 SubmitForm; lead context §11 (X15) | public published form | new | publication; no internal context |
| QuoteExtraction | Sales/Quotes/QuoteExtraction | wizard | xml | Map extracted RFQ lines | Request/RequestItem | own §11 | R,M | later | requestId; evidence |
| QuoteConfiguration | Sales/Quotes/QuoteConfiguration | wizard | xml | Select optional/configured products | OrderHeader | own §11 | R,M; E projection later | later | order/revision |
| ManufacturingEstimate | Sales/Quotes/ManufacturingEstimate | task | xml | Request and consume approved costing | OrderItem | own §11; Manufacturing costs | cost/estimate grant | later | quote item; method |
| Rentals | Sales/Agreements/Rentals | detail | xml | Coordinate rental terms and custody | Agreement/Asset | own §11 | agreement/asset capability | later | agreement, asset scope |

Prints and exports are render modes/transitions on their source screens (§16), not additional
application pages. Shared Chatter/RecordFiles/Calendar and the existing Comms composer retain their
canonical screen definitions; their providers are specified in §12.2.

## 3. Home and pipeline

### Home

**Layout.** A compact counter strip (RFQs awaiting response, quotes to send/expiring, orders blocked),
My activities due, Assigned to me, then My pipeline. The same query powers the compact board and
Opportunities; changing organization clears incompatible filters. Previous-period comparisons
state their period and denominator. Empty pipeline offers New lead and New opportunity.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| SalesWork | display | Counts and links to work | organization, period, RFQs, quotes, blocked orders, activity count | number-card; scoped drill-down | S.get#SalesHome | Carbon sales dashboard; Marble dashboard |
| AssignedWork | list, read | Next commercial action | record/name, customer, state, owner, due/expiry, action | record links; status chip | S.get#SalesHome | Carbon assigned documents |
| MyPipeline | list, read | Compact open pipeline | opportunity, account, amount/currency, stage, next activity | native board/list | O.find#Opportunities | Odoo My Pipeline; research §1 |
| PipelineFunnel | component | Stage conversion at a glance | stage, count, amount | framework funnel panel through `report-embed`, left out of server-static output, which cannot hold a viewer's data | the pipeline dataset (L6), whose row filter is Sales' scope (organization, then assignment or team) | framework Monitoring funnel panel |

As built (impl-sales P1): Home's frame, an organization filter of the user's sales scope (checked by `check#Record`) above
SalesWork's five counters, AssignedWork and MyPipeline, each "Not configured" until P4 and P6 answer them, never zero; a
report reader gets a Sales summary shortcut, and a user who reads nothing of Sales is told so.

**Actions.** New opportunity is primary; New lead, quote and activity are contextual shortcuts.
An unavailable metric leaves other independent panels usable. **Source:** research §1, §8, §13.
**Needs:** SAL-CRM, SAL-SHELL, SAL-REPORT.

### Opportunities

**Layout.** Board default; list/calendar alternatives share filters, sort, page and saved find.
Group board by stage sequence within one pipeline, including empty stages. Calendar uses expected
close date; unscheduled records remain available in the list. Terminal lists group by stage.
Totals are computed over the authorized filtered result, not just the rendered page, per currency.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| OpportunityFind | find | Narrow work | text, account, owner/team, pipeline/stage, outcome, close period, source/campaign | saved finds; server-search | — | Odoo pipeline views; research §1 |
| OpportunityList | list | Work and compare deals | name/account, amount/currency, probability, expected close, stage age, next activity | board/list/calendar; select-columns | O.find#Opportunities | Odoo/Frappe CRM deal index |
| NewOpportunity | dialog | Create a qualified deal | name, account/contact, organization, pipeline/stage, owner/team, amount/currency, expected close | choice lookups | O.create#Opportunity | Moqui Sales FindOpportunity; research §3 |
| ChangeStage | dialog | Move with current source state | opportunity, expected stamp, target stage, probability mode, note | row action and board transition | O.move#Opportunity | Odoo stage movement |
| OpportunityBatch | list, bulk | Assign or move independent deals | selection, operation, target, reason | count confirmation; per-row results | O.apply#OpportunityBatch | Frappe CRM bulk actions |
| OpportunityImport | wizard step | Preview and import lead/deal rows | file/source, column mapping, duplicate strategy, preview, selected rows | per-row errors and confirmation | O.validate#OpportunityImportRow, O.apply#OpportunityImportRow | Admin Shared/DataImport with Admin §11's `opportunities` target (Z2); complete fields in §16 |

Import runs in Admin's Shared/DataImport (stage, configure, validate, apply, result) with Sales'
registered target `opportunities` ([Admin §11](design-admin.md#111-shared-transfer-contract)); no
Sales-only wizard (Z2). As built (impl-admin P15), such a target is a `moqui.server.TransferTarget`
in rows mode: its `validateRowService` and `applyRowService` are `validate#OpportunityImportRow` and
`apply#OpportunityImportRow`, with a `scopeService` for the organization, and the framework keeps
the batch. The target's import permission is `SALES_IMPORT` with `SALES_OPPORTUNITY_EDIT` and
`SALES_TEAM_MANAGE`, all required, and no `ADMIN_*` permission (impl-sales §4, Nov 11, 2026): each
app has an import permission of its own, so a Sales manager runs the import from Sales' mount
without being Admin's data operator, and Admin's Imports lists the run for a data operator who
also holds Sales' view permission.

**Actions.** Stage moves are not closure. The service checks pipeline membership and refuses stale
writes; failed dragging restores the original lane and explains why. Won/Lost are explicit detail
actions. Bulk operations commit each independent deal separately and report denied/stale rows.
**Source:** research §§1, 3. **Needs:** SAL-ACCESS, SAL-CRM.

### Leads

**Layout.** Same opportunity list definition with lead type fixed and qualification columns.
No duplicate Lead entity is created. A lead may have an optional account and contact. A rep
entering a lead links or creates the Party through Commons. An inquiry that arrives from a public
form, an intake address, a chat or a voicemail goes through O.store#LeadIntake (S1, X16), which
holds the inquirer's submitted name, organization, email and phone on a proposed SalesLeadIntake
record, not on the deal and not as a new Party. A Party with the Prospect role is created or linked
at qualification, or earlier when the inquirer verifies the email. Intake maps the UTM source and
medium of a tracked link to the lead's DataSource (§9, X10) and routes to the fixed team queue
named by the intake publication or mail rule; rule-based assignment is §11 later. Unverified
intake records that never qualify are purged after the SalesDefaults retention period.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| LeadFind | find | Triage incoming leads | text, owner/team, source/campaign, age, qualification | saved filters | — | Frappe CRM Leads |
| LeadList | list | Qualify or reject interest | name, account/contact if known, source, owner, age, next activity | row Convert; duplicate suggestions; bulk "Add to list (evidenced)" | O.find#Opportunities with lead type; proposed Marketing `mantle.marketing.AudienceServices.request#Subscriptions` for the bulk action | Odoo lead list |
| NewLead | dialog | Capture interest without a customer account | name, organization, team/owner, optional existing prospect/contact, source/campaign, description | person/org chooser; create contact via Commons | O.create#Opportunity with lead type | Frappe lead intake; research §2 |
| QualifyLead | dialog | Promote same record | expected stamp, existing/new account and contact, pipeline/stage, owner, amount/currency, close date | duplicate candidates before creation | O.qualify#Lead | Frappe ConvertToDeal; Odoo conversion |

**Actions.** Qualification is atomic: validate or create/link parties, set opportunity type and
conversion time/actor, retain source and all joins. Retry returns the same record. A bulk
qualification invokes the same operation per lead. Disqualify records an explicit lost outcome
and reason. Reopen restores an open lead; returning a qualified opportunity to lead requires a
manager, reason and no placed linked order. Conversion history remains audit-readable.
"Create lead" also appears on a chat message and a voicemail in Comms (`create-from` and `ext-action`,
§1.4); it opens NewLead prefilled from the message, and the lead keeps the message as its source. On a mail message
the same action is in Mail's `message-actions` slot, which Sales P5 makes basic-comms render (impl-sales §4, Nov 13).
The bulk "Add to list (evidenced)" action, shown with Marketing's audience capability, files an
evidenced subscription request per lead contact through Marketing; it never subscribes directly.

As built (impl-sales P5, Nov 13, 2026): SalesLeadIntake holds the inquiry (source kind and id, the submitted name,
organization, email and phone, the UTM pair, campaign, tracking code, source, team queue, received, verified and purged
dates, and whether it made its lead or joined one); `store#LeadIntake` takes an operation key of its own (a repeat answers
the first result whoever calls, as Marketing's capture job and an operator's reprocess both do) and one source identity per
intake (a mail by its Message-ID). The duplicate policy joins an open lead of the organization that an intake with the same
submitted email made or joined (a review item on that lead, shown as "Joined this lead"), never a merge. A user caller assigns
as `create#Opportunity`; a system caller (the mail rule, Marketing's job) names a team as the queue. "Create lead" on a chat
or mail message and a voicemail makes the lead at once (the user its owner, the message filed on it) rather than opening a
prefilled NewLead; OpportunityDetail's Inquiries box shows what came in, and QualifyLead starts its new account and contact
from the first inquiry. LeadList's intake columns are Came by, Received and Verification. The inquirer's email verification
is the caller's (`verified`); Sales sends no verification mail.
**Source:** research §2. **Needs:** SAL-CRM, SAL-ACCOUNTS, SAL-SHELL, SAL-MAIL-INTAKE.

### OpportunityDetail

**Layout.** Record header with type, outcome, stage, account, amount/currency and expected close.
Tabs: Overview, Contacts/team, Competitors, Quotes/orders, Activities, Files and History.
A document strip shows RFQ → quote → order from real linked records, without inventing a second
document status. New quote is primary for an open qualified opportunity; otherwise Schedule activity.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Opportunity | single | Maintain deal facts | name, account, amount/currency, recurring amount and plan, probability/mode, close date, nextStep, source/campaign | stage bar; server-search | O.get#Opportunity, O.update#Opportunity | Moqui Sales ViewOpportunity; Odoo lead form and recurring plans |
| OpportunityParties | list; dialog | Assign owner/team/contact roles | party, role, from/thru dates | dated party lookup | O.store#OpportunityParty | SalesOpportunityParty; Moqui Sales team/contact sections |
| Competitors | list; dialog | Record competitive context | competitor, position, strengths, weaknesses | scoped party chooser | O.store#Competitor | SalesOpportunityCompetitor; ERPNext opportunity |
| RelatedSales | list, read | Trace RFQs, quotes and orders | document, date, state, amount/currency, response | same-app links; accepted flag | O.get#Opportunity | Carbon document pipeline; existing opportunity joins |
| CloseOpportunity | dialog | Explicitly record business outcome | expected stamp, won/lost, close date, lost reason, note | confirmation | O.close#Opportunity | Odoo/Frappe lost wizard |
| ReopenOpportunity | dialog | Resume closed work | expected stamp, reason, target stage, expected close | confirmation | O.reopen#Opportunity | ERPNext reopen |
| Collaboration | component | Activities, conversation and files | host record, audience, task/file | Chatter; RecordFiles | existing `mantle.party.CommunicationServices.get#RecordTimeline`, `create#Message`, `get#RecordLinkInfo` and `mantle.work.TaskServices.create#SimpleTask`, with SalesOpportunity host registration | Odoo chatter; Commons §§9, 15 |

**Outcome rules.** Proposed Open, Won and Lost status items are separate from stages. Lost requires
a reason; Won records a close time and may reference accepted documents without requiring an order
(for example a won service engagement). Closed deals leave open forecasts. Accepted quotes display
“Accepted — review outcome”; they never automatically mark a deal won. Several quotes/orders may
belong to a deal. Linked order totals are supplementary facts, not added again to estimated revenue.

A recurring deal carries proposed `recurringAmount` and a recurring plan (an Enumeration whose
`enumCode` is its length in months: monthly, quarterly, yearly). The estimated amount stays the
first-term value; Forecast and PipelineAnalysis show monthly recurring revenue (recurring amount
divided by the plan's months) as its own measure, never added to the one-time amount.

A meeting activity is a Commons Event: "Add video call" gives it a CallLink, and Invite sends the
prospect an iMIP invitation carrying the link, which a guest opens without an account (L7).

Probability is a decimal percent 0–100. A stage default is copied on creation/move only when
probability mode is Stage; an explicit manual value remains until the rep selects Stage again.
Stage age and conversion history come from audited changes. Missing estimates are unestimated,
not zero-value deals. The primary owner is one active SalesRepresentative association; teams,
contacts and internal organization use separate roles.

**Navigation.** Account to Customer360; documents to canonical OrderDetail/QuoteRequestDetail;
tasks to WorkItemDetail. **States.** An unauthorized linked record contributes no title, amount
or count. **Source:** research §§3, 8. **Needs:** SAL-CRM, SAL-COLLAB, SAL-QUOTE.

### As built (impl-sales P4, Nov 13, 2026)

- **One record.** A lead and an opportunity are one `SalesOpportunity`, its type SotLead or SotOpportunity; its outcome
  (`statusId`: Open, Won, Lost), lost reason, pipeline, probability mode (SpmStage, SpmManual), recurring amount and plan, the
  conversion and close time and actor, its creation and its stage's entry (stage age) are fields of it, the key ones
  audit-logged with the type, account and close date. Its people are dated `SalesOpportunityParty` rows: the organization
  (OrgInternal, kept equal to `organizationPartyId`), one current owner (SalesRepresentative), one current team (SalesTeam) and
  contacts. A deal's revision is the latest stamp of the deal and its party rows, so a change of its people is a change of it.
- **Scope** (Mantle `SalesAccess.js opportunityOf`): a Sales reader of the organization sees the deals whose current owner or team
  row names them or a team of theirs (an unowned lead in a team's queue among them), a holder of `SALES_TEAM_VIEW` the
  organization's; a customer link never widens it. A representative assigns a deal only to themselves or a member of one of their
  teams; a manager (`SALES_TEAM_MANAGE`) anyone of the organization.
- **Services** (`mantle.sales.OpportunityServices`, `SalesOpportunities.js`): `find#Opportunities`, `get#Opportunity`,
  `create#Opportunity`, `update#Opportunity`, `move#Opportunity`, `close#Opportunity`, `reopen#Opportunity`, `qualify#Lead`
  (its operation key a PostingOperation), `store#OpportunityParty`, `store#Competitor`, `apply#OpportunityBatch` (move, assign,
  lose; keys `id@revision`), and beyond the design's list `add#OpportunityActivity` (a Commons task linked through
  `link#WorkEffortRecord`, which writes `SalesOpportunityWorkEffort`, the opportunity's own join), `check#OpportunityAccess` and
  `create#OpportunityContent`.
- **The board** groups by the stage's name (`stageText`), not its id: the framework's board labels a column by the value unless
  it is a status or an enumeration, and a stage's name is unique in its pipeline; `moveCard` maps the name back to the stage of
  the deal's own pipeline. Its columns are the stages of the pipeline filtered, else the organization's default, empty ones too;
  each card carries Change stage. The totals are over the whole filtered result, by currency.
- **OpportunityDetail** is one screen of boxes (Overview, People, Activities, Competitors, Quotes and orders when there are any,
  Conversation, Files), not tabs. Its primary action is Qualify for an open lead, Close for an open opportunity until P7's New
  quote, Reopen for a closed one; Schedule activity beside it; Change stage, Disqualify and the account in More. Returning a
  qualified opportunity to a lead is not built.
- **Leads** is built for a second mount: Marketing's root (`Sales.js mountRoots`) mounts it at `Marketing/Leads` and LeadSources
  at `Marketing/Settings/LeadSources`, its `sharedLinks` naming only those, so a lead's OpportunityDetail shows without a link
  there; any other root is refused. LeadList has row selection (Assign, Disqualify); Marketing's bulk action joins it as an
  owner contract.
- **Home**'s MyPipeline stays "Not configured" until P6 builds Home over `find#Opportunities`.

### WorkItemDetail — Context passed

Mount Projects' shared WorkItemDetail with the authorized opportunity/order/account host,
WorkEffort ID and activity emphasis. Creation uses Commons' task/activity service with
`WorkEffortRecord` and retains `SalesOpportunityWorkEffort` compatibility. Completing an activity
does not qualify or close a deal. Normal task access and assignment checks remain authoritative.
Mounted at `Sales/Pipeline/WorkItemDetail`; crosscut §3.12 row:

| App | Tabs or panes shown | Filters fixed | Action set | Emphasis |
| --- | --- | --- | --- | --- |
| Sales | Overview, Activity, Files, linked opportunity/quote/order | authorized Sales host and organization | complete, reschedule, reassign within team; no qualify or close | next commercial step |

## 4. Accounts and contacts

**Shared maps (proposed, CX-MAPS):** readable account/contact addresses and Customer360 use
[crosscut §3.32](design-crosscut.md#332-maps-and-record-location-dialogs), inherited from the shared contact template.
The dialog offers local geographic context and full-screen Maps with permitted account layers. Address lookup,
postal fallback and coordinate selection retain source/precision and party authority. Quotes/orders map their own
address snapshots; choosing a new point does not bypass the commercial order-change workflow.

### Accounts

**Layout.** Account list with customer/prospect role, account manager, next activity and permitted
commercial summary. It includes individual customers as well as organizations; the label Accounts
does not force a person into an Organization record.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| AccountFind | find | Find scoped parties | text, role, classification, owner/team, parent account | server-search; saved finds | — | Customer/FindCustomer OuterSearchForm |
| AccountList | list | Open commercial records | name, party type, contact, owner, active quotes, next activity | select-columns; phone name/state; bulk "Add to list (evidenced)" | S.find#Accounts; proposed Marketing `mantle.marketing.AudienceServices.request#Subscriptions` for the bulk action | Customer/FindCustomer CustomerListForm; Customer/CustomerData CustomerDataList |
| NewAccount | dialog | Create or use existing organization | organization name, parent account, owner organization, contact | duplicate suggestions | existing mantle.sales.AccountServices.create#Account, extended guard | Customer/FindCustomer CreateAccountForm, CreateOrganizationForm |
| NewPerson | dialog | Create individual customer | name, permitted contact details, owner organization | shared person form | existing mantle.party.PartyServices.create#Person, extended Sales guard | Customer/FindCustomer CreatePersonForm |

Source services must assign an authorized owner organization and validate existing parent/contact
records; existing `authenticate="false"` account helpers are not a sufficient public or staff boundary.
Reuse existing parties when duplicate review identifies the same customer. **Source:** research §4.
**Needs:** SAL-ACCOUNTS, SAL-ACCESS.

### Contacts — Context passed

Mount the Commons contact-list forms with the current account and commercial Contact/PrtContact
relationship filter. Use existing `mantle.sales.AccountServices.create#Contact`, `add#Contact` and
`delete#Contact` behind the same organization/party guard. Delete expires the relationship;
it does not delete the person. Derive from Customer/FindCustomer CreateContactForm and
Party/EditParty AddSalesAccount, AccountRelList, AddContactAssignForm, CreateContactForm and
ContactRelList. Contacts may belong to several accounts; one account's Sales role grants no access
to another account's documents.

Account contacts reach reps' phones as a read-only CardDAV address book, "My accounts", a projected
collection that Mantle `mantle.party.ContactDavServices.get#DavCollections` lists and S answers with
the contacts of the accounts the rep may see (L2). Phone edits are refused; the contact is edited
here. As built (impl-sales P5): the projection is Mantle's `ContactProjection` (the contacts counterpart of People's
CalendarProjection, `projected-SalesMyAccounts`), and "the rep's accounts" are those they manage or that are the account of a
deal assigned now to them or their team, not every account of the scope. **Needs:** SAL-SYNC.

### Customer360 — Context passed

Use crosscut §3.2 at `Sales/Accounts/Customer360`, fixed to the authorized customer and selling
organization. Tabs: Overview, Contacts, Opportunities, RFQs, Quotes, Orders, Agreements, permitted
Invoices/payments, Activities and Files. Overview adds account manager/team, negotiated-price
references and defaults for new documents; it does not retroactively change orders.

Crosscut owns the added CustomerSalesSummary and CustomerOpportunities/Quotes/Agreements forms.
The summary comes from S.get#CustomerSales; drill-down uses the same filters as the list.
Contacts/hierarchy reuse Party/EditParty relationship forms. Customer/FinancialInfo order and
receivable forms remain finance-gated. Primary New opportunity/New quote appears by capability;
Edit identity, Schedule activity, Merge and Invite to Sales are secondary. Invite uses the extended
Mantle ExternalAccessServices invitation contract (§10), not user/group administration.

### ContactDetail — Context passed

Use the Commons contact record with account relationship context and permitted channel editing.
Sales may maintain identity, contact purposes and account assignments; user passwords,
group membership and tax/bank administration stay with their owners. Consent is read-only here,
as Commons §16 gives Sales, with a link to the Comms Consent mount (Marketing's when installed).
The shared record's Call, Video and Chat buttons (`place#PhoneCall`, `create#CallLink`, chat) come
from the Commons definition. Source forms are Party/EditParty identity/contact forms. Invite to
Sales requires the Sales external-access issuer capability and binds the invitation to the account
and organization. Mounted at `Sales/Accounts/ContactDetail`; crosscut §3.1 row:

| App | Tabs or panes shown | Filters fixed | Action set | Emphasis |
| --- | --- | --- | --- | --- |
| Sales | Identity, contact methods, accounts, opportunities, quotes, activities, consent (read-only) | permitted organization/private-contact scope | edit identity and channels, assign to account, invite to PASS Sales, new lead/opportunity | the person as a buyer contact |

**Needs:** SAL-ACCOUNTS, SAL-PORTAL.

### MergeAccounts — Context passed

Mount the Commons Duplicates screen ([Commons §6](design-drawers-commons.md#6-contacts)) at
`Sales/Accounts/MergeAccounts` (X15). Its forms, `mantle.party.DuplicateServices.find#PartyDuplicates`
and `merge#Parties` stay Commons-owned; there is no Sales merge service. The merge guards live inside
Mantle `merge#Parties`, so every path is guarded: both parties visible and of compatible
person/organization type, the same owner organization, private contacts protected, unique
identifiers kept, and the rows `merge#Parties` leaves behind today (ExternalAccessContact, PASS
UserAccount, PartyConsent, StoreRecurringContract) moved or refused. A cross-organization or
inaccessible dependency is refused, never broadened. The caller is a contact administrator, as
Commons' merge asks today, or for an account of their organization a Sales manager or administrator
(impl-sales F45); the service's other callers keep working. Sales adds to the Compare dialog a read-only
count of the opportunities, quotes, orders and agreements each party carries. No automatic merge on
email or name similarity. Crosscut §3.1 row:

| App | Tabs or panes shown | Filters fixed | Action set | Emphasis |
| --- | --- | --- | --- | --- |
| Sales | Duplicate pairs and Compare with Sales document counts | permitted organization; accounts and their contacts | merge (M, S), not a duplicate | commercial history kept on the survivor |

**Source:** research §4; Party/EditParty/FindDuplicates DupPartyList; Twenty side-by-side duplicate review.
**Needs:** SAL-ACCOUNTS, SAL-ACCESS.

### As built (impl-sales P3, Nov 13, 2026)

- **An account** is a party with the Account role and a Customer or Prospect role, not an internal organization, owned by
  the organization it was created for (`Party.ownerPartyId`, which the organization filters read); a party owned by none
  (`_NA_`) is a shared account every organization sees, as Customer Service's shared customers are. A contact is a person with a
  current `PrtContact` relationship to an account, owned by the account's organization, with the Contact role (no longer
  Customer, so a contact is not listed as an account). The account manager is a dated `PrtAccountManager` relationship from the
  representative (Mantle `data/SalesAccountData.xml`); `mantle.sales.AccountServices.set#AccountManager` changes it. Mantle's
  `SalesAccess.js` holds the account scope (`accountOf`, `contactAccounts`, `accountOrganization`, `mergesFor`).
- **NewPerson** calls `create#Account` with a person (`partyTypeEnumId` PtyPerson), not `create#Person`, so one guarded entry
  creates every account. `create#Account` takes the owner organization, parent, manager, email and phone.
- **Customer360** in Sales has Overview (managers, contact details, hierarchy, notes), Contacts, Orders (a `SALES_TEAM_VIEW`
  holder's, until P11's order scope), Invoices (a finance reader's) and Files; Opportunities, RFQs, Quotes, Agreements and
  Activities join with P4, P8, P7 and P15. AccountList's next activity and active quotes join with P4 and P7.
- **Contacts** is Sales' own list (`find#AccountContacts`); **ContactDetail** includes the Commons contact record behind
  Sales' record check, with a Sales box of the person's accounts (Add to an account, End). Identity and channels are edited
  under the record's own party checks, so a representative who is no contact administrator reads them only (impl-sales P3
  findings).
- **MergeAccounts** is a Sales screen over Commons' services (`get#DuplicatePairs` narrowed to the pairs `check#PartyMerge`
  admits, `get#ComparePair`, `merge#Contacts`, `mark#NotDuplicate`) with a Compare of its own (MergeCompare) carrying the
  opportunity, order and agreement counts (`get#AccountDocumentCounts`); Commons' Duplicates asks for a contact administrator,
  so it is not mounted. The guards are design-drawers-commons §6's as built.
- **Since P4** (F98, F99): a representative edits a contact's identity and channels through Commons' `canEditIdentity`, not its
  organizations, relationships, notes or photo, and only for a person of an organization of their scope who is a contact of an
  account of such an organization (design-drawers-commons §6); `set#AccountManager` names the management's revision
  (`get#CustomerSales` managerRevision) and `delete#Contact` the relationship's (`find#AccountContacts` revision).

## 5. Quotes and requests for quote

### Quotes

**Layout.** Saved lists Draft, RFQ received, Proposed, Expiring, Expired and Responded.
Quote candidates are sales-direction `OrderPart` records under `OrderOpen`, `OrderRequested` or
`OrderProposed`, plus explicit rejected/cancelled history. `OrderOpen` alone is not proof of a
sales quote: exclude Shop carts and recurring bases; an explicit quote intent/source association
identifies drafts. Accepted quotes remain reachable by their response/history and appear in Orders.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| QuoteFind | find | Select offers | customer, opportunity, owner/team, state, validity, currency | saved filters | — | Order/FindOrder OrderList; research §5 |
| QuoteList | list | Work quotations | order/name, customer, amount/currency, validity, revision, last send/response | expiry indicator; source links | Q.find#Quotes | Odoo quotations dashboard |
| NewQuote | dialog | Create scoped native order | customer/contact, selling organization, opportunity/RFQ, currency, optional template/store, validity | account defaults; template chooser | Q.create#Quote using existing mantle.order.OrderServices.create#Order, create#OrderPart | Order/FindOrder CreateSalesOrder |
| QuoteBatch | list, bulk | Send or withdraw eligible offers | selection, operation, template/recipient preview, reason | count and per-row outcomes | Q.apply#QuoteBatch | Dolibarr proposal mass actions |

A quote can be created without an opportunity, and with or without a store (X1). With a store,
the store supplies its tax gateway, promotions and store mail. Without one, Mantle
`calculate#OrderSalesTax` resolves the gateway as `SalesTax.js` `gateway()` already does for
invoices, falling back to the seller's `PartyAcctgPreference.taxGatewayConfigId`, and
`handle#OrderMajorChange` runs its tax step without a store, so every draft change of a storeless
quote is retaxed and the invoice made from it carries that tax. Promotions stay store-only: a
storeless quote has none. There is no carrier estimate without a store; freight is an explicit
charge line (Open). Q renders and sends storeless quotes and Q.send#OrderConfirmation sends the
storeless placed/approved confirmation (§13). Initial Sales issuance requires all order parts to have one authorized seller, customer and
currency; several delivery destinations are allowed. Mixed-customer/seller legacy orders may be
read by authorized part but cannot be issued or accepted as one Sales quote. Split them into
separate source-linked offers first, so a customer response never places hidden parts.
**Source:** research §5. **Needs:** SAL-QUOTE, SAL-APPROVAL.

### QuoteRequests

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| QuoteRequestFind | find | Narrow customer RFQs | customer, owner/team, state, required date, source | saved finds | — | Request/FindRequest ListRequests |
| QuoteRequestList | list | Track requested quotes | request/name, customer, due date, assignee, state, linked quote | overdue flag | Q.find#QuoteRequests | Carbon RFQs |
| NewQuoteRequest | dialog | Capture inquiry | customer/contact, subject, required date, description, source | record/file choices | Q.create#QuoteRequest using existing mantle.request.RequestServices.create#Request | Request/FindRequest NewRequestForm |

Internal organization/customer/contact/assignee are RequestParty roles. Customer RFQs use
`RqtQuote`; purchase RFQs retain Purchasing's separate type. A request may yield several quotes;
creating a quote does not silently complete the inquiry. Mail to the RFQ intake address becomes a
request through the `createQuoteRequest` `EmailRuleAction`, with the message and its files linked
as evidence (§1.4); "Create RFQ" does the same from a message in Comms. **Needs:** SAL-QUOTE, SAL-MAIL-INTAKE.

**Source:** research §§2, 5; Carbon RFQs and Request/FindRequest.

### QuoteRequestDetail — Context passed

Mount Projects' shared RequestDetail, fixed to `RqtQuote` and the authorized selling organization.
Show Overview, Items, Parties, linked Quotes, Activities and Files. Reuse Request/EditRequest,
EditRequestItems, EditTasks and existing request content forms; use normal RequestRecord links
for opportunity/order provenance. Primary Create quote invokes Q.create#QuoteFromRequest with
selected request items, quantities and expected request timestamp. It creates one native quote
and its source links atomically; the same operation key returns it. Decline RFQ records reason and
notifies the requester only after recipient preview. No extraction or AI mapping runs implicitly.
`RequestTriageNotice` and `WorkEffortRequestFromWork` are type-guarded (D23): an RqtQuote request is
not triaged as a case or completed from linked work unless it is placed in a service queue.
Mounted at `Sales/Quotes/QuoteRequestDetail`; crosscut §3.11 row:

| App | Tabs or panes shown | Filters fixed | Action set | Emphasis |
| --- | --- | --- | --- | --- |
| Sales | Overview, Items, Parties, Quotes, Activities, Files | RqtQuote; authorized selling organization | create quote from items, decline RFQ, assign; no case or SLA actions | turning the request into an offer |

### OrderDetail — Quote context passed

This is the **quote context of the one OrderDetail** defined in crosscut §3.6, reached at
`Sales/Orders/OrderDetail`. Customer, seller, currency, parties, terms, items, pricing/availability,
history, Chatter and Files are its shared forms; do not create a second QuoteDetail editor.
The crosscut receives the added QuoteOffer/QuoteSend/QuoteResponse forms and actions summarized here.

- Draft items use existing OrderServices line/product APIs, Products usability checks, decimal quantities,
  the one price resolver and the X1 tax path; store promotions apply only to a store quote. They keep
  price provenance and customer PO in `OrderPart.otherPartyOrderId`. Part validity uses
  `validFromDate`/`validThruDate`. The proposed `OrderHeader.orderPurposeEnumId` marks a Sales order
  SalesQuote when it starts as an offer and SalesOrder when entered directly; status, not purpose,
  shows whether it was placed. RecurringTemplate marks a recurring base (X5).
- Availability is dated evidence, not a reservation or unconditional promise. An unavailable projection
  is shown as unavailable; a valid zero stock result is distinct. Reservation occurs only on the
  existing native lifecycle paths or an independently authorized explicit reservation action.
- Manual unit-price/discount overrides retain calculated basis, entered price, reason and actor.
  Q.preview#Quote evaluates effective SalesApprovalPolicy; warnings requiring approval cannot be
  acknowledged away. Missing price is blocked; an authorized explicit free line is permitted.
  Cost/margin checks run server-side, returning a reason without disclosing restricted costs.
- Q.propose#Quote validates current parts, products, totals, dates and approvals, then uses existing
  `mantle.order.OrderServices.propose#Order`. It creates no stock or financial posting itself.
- Q.send#Quote previews named recipients and locale/template, stores the rendered PDF at the offered
  revision/time as OrderContent and records the SalesQuoteIssue with a revision-bound PASS link.
  Sending by a rep opens Comms Compose with the PDF attached and the order as the filing record, so
  the mail goes from the rep's own account through `mantle.party.CommunicationServices.send#EmailDraft`.
  QuoteBatch, reminders and any send on behalf of another rep use the framework
  `org.moqui.mail.EmailServices.send#EmailTemplate` with a registered template, recorded on the Comms
  delivery ledger (X8) and filed by `EmailMessageFiling`. Template text renders with
  `fancy-locked-html` from its stored location with an explicit map (§1.4 L9). The PDF print header carries a QR of the PASS quote link. An accepted delivery
  is not proof of customer acceptance. Partial recipient failure remains visible and retryable.
- **Revision binding (X2).** Issue, approval, the PASS capability and the shared change proposal bind
  to the Mantle `orderRevision` counter, which X2 narrows to commercial changes: OrderContent and
  OrderNote changes and status-only OrderPart updates stop incrementing it, behind a CX-AUTOMATION
  flag, so storing the issued PDF, a RecordFiles upload or `propose#Order` no longer invalidates the
  offer. If the flag is refused, all three bind to one proposed
  `mantle.order.OrderInfoServices.get#OrderCommercialSnapshot` hash instead; Sales keeps no hash of
  its own. As built (impl-sales F9) the flag is `PartyAcctgPreference.salesCommercialRevisionOnly`, off by
  default: a quote is issued only where the seller has it on, and no snapshot hash is built.
- Editing an issued quote starts a deliberate revision on the same order through the native
  OrderProposed → OrderBeingChanged → OrderProposed transitions, which advance the commercial
  revision, invalidate pending approvals and capabilities and require reproposal and resend. History
  reconstructs audited fields and retains the exact earlier PDF. Clone uses `clone#Order` for a
  separate opportunity/offer. This action is limited to unaccepted offers; accepted orders change
  through §6 and cannot be reopened as an offer to erase the customer's response.
- Staff Record acceptance captures the customer/contact, acceptance time, customer PO and evidence
  attachment/message, reason/source and exact offered revision. Q.respond#Quote validates and records
  the same response as PASS; it never merely edits status.
- **Decline and withdrawal (X3).** A customer decline records SalesQuoteResponse with its reason and
  evidence, then cancels the quote with `mantle.order.OrderServices.cancel#Order` through the existing
  Cancel Quote transition (OrderProposed → OrderCancelled). A seller withdrawal is the same cancel
  plus revocation of the SalesQuoteIssue. `reject#Order` is not used: Mantle has no transition from
  OrderProposed to OrderRejected, and OrderRejected means rejected by the vendor. Expiry is derived
  from validity, not an invented OrderExpired status.

Customer acceptance checks an issued, unexpired, current offer; records the customer response;
and calls existing `place#Order` atomically for the native sales order. Its result distinguishes
Placed, Approved and Held according to native policy. The credit gate and the seller's approval
setting (§1.1) still apply;
a held accepted order retains the valid acceptance and shows the outstanding internal action.
A validation/conflict failure before placement leaves no successful acceptance fact.
Payments are not collected by the quote page; authorized invoice payment links go to PASS Billing.
Native `autoApprove#Order` needs authorized payments covering the grand total, so an accepted
net-terms order stays Placed in the Awaiting approval queue of BOSS_SALES_APPROVE (§6). A SalesDefaults
option, off by default, has acceptance call Q.approve#SalesOrder as the system actor when credit
and every Sales policy pass, recording that decision. The option applies only while the seller's
approval setting is off: with the setting on, that order waits for a holder of
`SALES_ORDER_APPROVE` too. Placement also fires Marketing's
`OrderPlacedRecordAttribution` SECA (X10), which records the order's campaign attribution.

**Approval binding.** Extend existing OrderDecision/OrderDecisionReason with offered revision and
evaluated policy reference/time, decision purpose and exception result where needed; no decision
record on Purchasing's pattern is added (impl-sales §4, Nov 11, 2026), and the decision follows
the rules Purchasing's approvals proved (revision binding, supersession, separation). Quote/discount
approval and final order approval are distinct purposes. A material revision invalidates earlier
decisions. The quote rule guards Q.propose#Quote, so a direct service call cannot propose an
unapproved quote. On a sales order the guard is the seller's approval setting (§1.1): where it is
on, `approve#Order` asks `SALES_ORDER_APPROVE` and a current decision where a rule asks one, from
the approval list and from a direct call alike. An unresolved Sales warning blocks
`autoApprove#Order`, as every pre-approval warning does; with the setting on it is shown to the
approver and does not refuse that approval (X4 as decided Nov 11).
**Source:** research §§5–6; Order/OrderDetail and Order/OrderItems; Carbon quote history.
**Needs:** SAL-QUOTE, SAL-APPROVAL, SAL-PORTAL; CX-PRICING, CX-CREDIT, CX-POSTING, CX-ORDER-HOLD, CX-DELIVERY.

### Product360 — Context passed

Mount crosscut §3.5 Product360 at `Sales/Products/Product360`, reached from quote and order lines,
the RFQ items and the palette. Sales sees product and variant identity, permitted customer and
agreement prices through Products' price mounts, documents and availability; product edits need
Products permission, and supplier cost, BOM and routing tabs are absent without their grants.
Crosscut §3.5 row:

| App | Tabs or panes shown | Filters fixed | Action set | Emphasis |
| --- | --- | --- | --- | --- |
| Sales | Overview, variants, customer/agreement prices, documents, availability | selling organization; customer and agreement when opened from a quote | add to quote, explain price; no product or cost edits | what the customer can buy and at what price |

### InventoryAvailability — Context passed

Mount crosscut §3.7 InventoryAvailability at `Sales/Products/InventoryAvailability` with product,
quantity/UOM, required date and the authorized facilities fixed. Read only for Sales unless a
separate Warehouse grant is held; it reports readiness, as-of time and shortfall and never
promises unknown stock or reserves. Crosscut §3.7 row:

| App | Tabs or panes shown | Filters fixed | Action set | Emphasis |
| --- | --- | --- | --- | --- |
| Sales | Available, promised and projected by facility and date | product, quantity/UOM, required date, permitted facilities | read only; reserve only with a Warehouse grant | a promise date the rep can quote |

### QuoteTemplates

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| TemplateFind | find | Find reusable offers | organization, name, effective state, product/category | filters | — | Odoo quotation templates |
| TemplateList | list | Open/copy permitted templates | name, organization, interval, lines, state | state chip | Q.find#QuoteTemplates | Odoo quotation templates |
| NewTemplate | dialog | Start a template | name, organization, description, currency policy | named choices | Q.store#QuoteTemplate | Odoo sale order template |

**Source:** research §5; Odoo quotation templates.

### QuoteTemplateDetail

**Layout.** Header, fixed product/charge lines, terms/text, default validity, preview and history.
A template uses the order entities (impl-sales §4, Nov 11, 2026): an OrderHeader whose
`orderPurposeEnumId` is `OrpSalesQuoteTemplate`, with its parts and items, and no SalesQuoteTemplate
table. It is never placed and never leaves Open, and every order reader that leaves out
`OrpRecurringTemplate` (credit, reservation, invoicing, the sales summaries, store worklists and
store mail) leaves this purpose out too, so a template cannot reserve, invoice, count as an order,
be offered as a quote or become public merely by existing. Its line editor, pricing and print are
the quote draft's.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| TemplateHeader | single | Maintain reusable defaults | name, organization, description, published interval (the part's validity dates), default validity interval, currency policy, terms/print template | date and registered-template choices | Q.store#QuoteTemplate, Q.publish#QuoteTemplate | Odoo sale order template |
| TemplateItems | list, editable rows | Define fixed suggested lines | sequence, product or charge type, quantity/UOM, description, pricing mode | catalog choices; the quote draft's line editor | the quote draft's item services (existing `OrderServices` item writes) | Odoo template lines; OrderItems |
| TemplatePreview | display | Resolve an example quote | customer, currency, effective date, products, quantities, resulting prices/warnings | shared pricing/availability links | Q.preview#QuoteTemplate | Products price preview |

Q.publish#QuoteTemplate starts a dated successor and ends the replaced template; the published
interval is the part's validity dates, and a published template is not edited in place. A new
quote is a copy made with `mantle.order.OrderServices.clone#Order` (`copyPayment=false`), given
the quote purpose and priced as of the quote's own date, unless an authorized contractual fixed
price is explicitly part of the template. Existing quotes retain their terms when a template changes.
Template text renders with `fancy-locked-html`. Optional upsell/configuration belongs to
§11. **Source:** research §5. **Needs:** SAL-TEMPLATE.

### Approvals — Context passed

Mount Commons' approval list filtered to SalesQuoteApproval and OrderChangeApproval; do not replace
the suite inbox. It opens the source quote/change at the requested revision. Approve/Refuse calls
Q.decide#Quote or C.decide#OrderChange, checks the approver and separation-of-duty policy, and returns
stale/expired decisions without changing the source. Notifications are pointers, never authority.
The SalesQuoteApproval topic is seeded in Mantle beside OrderChangeApproval (impl-sales F26, P9); OrderChangeApproval's
link opens by the recipient through Commons' `openRecord` (impl-sales F58). Mounted at
`Sales/Quotes/Approvals`;
crosscut §3.15 row:

| App | Tabs or panes shown | Filters fixed | Action set | Emphasis |
| --- | --- | --- | --- | --- |
| Sales | Quote/discount exceptions and commercial order changes | SalesQuoteApproval and OrderChangeApproval of the selling organization; current source revision | approve or refuse through Q.decide#Quote or C.decide#OrderChange; no self-approval unless policy allows | price and margin exceptions |

**Source:** research §§5, 11; Commons approvals. **Needs:** SAL-APPROVAL, SAL-SHELL.

## 6. Orders and commercial changes

### Orders

**Layout.** Saved lists Awaiting approval, Held, To fulfill, Part fulfilled, To invoice and Recent.
Awaiting approval is BOSS_SALES_APPROVE's queue: placed sales orders, including accepted net-terms
quotes that `autoApprove#Order` leaves Placed (§5) and, for a seller whose approval setting is on
(§1.1), every placed sales order of that seller, store orders with an authorized payment among them.
Resolve sale direction from each OrderPart's internal vendor/external customer; never infer it from
an order-wide purchase flag. Filter mixed-direction parts and totals by access. Orders whose
`orderPurposeEnumId` is RecurringTemplate (X5), quote templates (`OrpSalesQuoteTemplate`, §5) and open
Shop carts are excluded and have their own worklists.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| OrderFind | find | Find commitments | customer/PO, order ID, owner/team, status, promised period, product, store | saved find; server-search | — | Order/FindOrder OrderList |
| OrderList | list | Follow delivery and billing | order, customer, total/currency, holds, due, shipped/billed progress | named status/progress | S.find#SalesOrders | Order/FindOrder OrderList; ERPNext percentages |
| NewSalesOrder | dialog | Start direct order entry | customer, seller, currency, required date, store if applicable | defaults; optional opportunity | Q.create#SalesOrder using existing OrderServices.create#Order/create#OrderPart | Order/FindOrder CreateSalesOrder |
| OrderBatch | list, bulk | Approve or close eligible remainders | selection, operation, reason, preview | per-order result; confirmation | Q.apply#SalesOrderBatch through shared guards | Order/FindOrder ApproveOrdersForm, CloseOrdersForm |

Progress shows source quantities per line/UOM and amounts per currency; aggregate percentages use a
declared denominator and do not sum incompatible units. Cancellations reduce outstanding commitments,
not the historical shipped or invoiced quantity. Direct orders need no fake customer quote acceptance.
**Source:** research §6. **Needs:** SAL-QUOTE, SAL-CHANGE, SAL-REPORT.

### OrderDetail — Sales-order context passed

Use CX §3.6 with fixed authorized seller/customer parts. Tabs: Overview, Items, Fulfillment,
Invoices/payments by capability, Agreements, Changes, History, Chatter and Files. Header shows
customer PO, confirmed dates, accepted quote evidence where present and each outstanding hold.
Primary action follows state: Place draft, Resolve approval, or the next authorized operational
action. New change, cancel remainder, clone, print and recurrence live in More.

Existing `mantle.order.OrderServices.place#Order`, `approve#Order`, `hold#Order`,
`release#OrderHold`, `cancel#Order` and `clone#Order` remain native lifecycle primitives.
Q.place#SalesOrder and Q.approve#SalesOrder add the Sales policy/source-revision guard before the
existing primitive. The guard that covers direct and native entry points is the seller's approval
setting (§1.1), checked in `autoApprove#Order` and in the sales direction of `approve#Order`; the UI
wrapper is not the security boundary. Existing Accounting
`mantle.account.CreditServices.evaluate#OrderCredit` participates in
`mantle.order.OrderInfoServices.check#OrderPreApprove` for the automatic path, and `approve#Order`
calls the credit check itself on the manual path. The approval section shows Sales' pre-approval
warnings to the person approving, whom they do not refuse; with the setting off they block the
automatic path as the credit warning does (§1.1). OrderBatch approves each order through
`approve#Order`, so none skips the credit check. Hold and release follow §1.1: a Sales user releases
a Manual hold with `ORDER_APPROVE` and a Change hold with `ORDER_CHANGE_HOLD_RELEASE`, never a
Credit, Purchase or Payment hold. Fulfillment and invoice creation remain capability-gated shared
actions.

Editing a placed/approved order's commercial facts opens OrderChangeDetail. No hidden direct-edit
route bypasses that proposal. Existing Projects estimate approvals and project billing shares
remain under their owning contract; merely linking an order to an opportunity does not convert a
project estimate to a Sales offer. The source kind determines which approval service applies.
Mounted at `Sales/Orders/OrderDetail`; crosscut §3.6 rows (one record, two action sets):

| App | Tabs or panes shown | Filters fixed | Action set | Emphasis |
| --- | --- | --- | --- | --- |
| Sales (quote) | Overview, Items, Terms, Issues and responses, History, Chatter, Files | sales parts of the authorized seller; one customer and currency | edit draft, preview, propose, send, record acceptance or decline, withdraw, revise, clone | price, validity and the issued revision |
| Sales (order) | Overview, Items, Fulfillment, Invoices/payments by capability, Agreements, Changes, History, Chatter, Files | sales parts of the authorized seller | place, approve, hold/release Manual and Change holds, new change, cancel remainder, clone, print, recurrence | promise dates, holds and source progress |

**Needs:** SAL-QUOTE, SAL-CHANGE; CX-ORDER-HOLD, CX-CREDIT, CX-POSTING.

### OrderChanges

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ChangeFind | find | Find commercial proposals | organization, customer/order, kind, state, assignee, due | saved filters | — | Customer Service OrderChanges |
| ChangeList | list | Review owner work | request, order/revision, kind, customer consent, decision, conflict | before/after summary | C.find#OrderChanges | Customer Service ChangeList |
| NewChange | dialog | Start a source-bound proposal | order, expected revision, kind, reason, customer/contact, evidence | source chooser | C.save#OrderChange | Customer Service ChangeProposal |

The queue includes proposals received from Customer Service; it does not copy them into a Sales
case table. **Source:** research §6; Customer Service D9. **Needs:** SAL-CHANGE.

### OrderChangeDetail — Context passed

Reuse Customer Service §4's canonical forms at `Sales/Orders/OrderChangeDetail`, implemented as
one shared screen. The business services are proposed `mantle.order.OrderChangeServices`,
consumed by both apps; Customer Service retains its service-desk presentation and narrower actions.
The proposal is an existing Request with proposed `RqtOrderChange` type, RequestItems and
RequestItemOrder links; its decision is the already-designed OrderChangeDecision fact.
Do not add a SalesChange or another application ledger.

Sales applies **price, quantity increase, required date, address, shipping method and carrier**
changes with SALES_ORDER_CHANGE after a current approval. Customer Service's remainder cancellation
and short-pick substitution remain its capabilities; Sales users need those capabilities to apply
those kinds. The shared `decide#OrderChange` and `apply#OrderChange` check permission by the
change's kind: SALES_APPROVE and SALES_ORDER_CHANGE for the commercial kinds, ORDER_CHANGE_APPROVE
and ORDER_CHANGE_APPLY for cancel and substitute. A new line is a quantity-increase proposal with a
product/UOM and no prior item, validated against the same product/pricing rules.

The shared preview names the old and proposed values, freight/tax/credit effects, quantities
already picked/shipped/billed, affected shipments/invoices, customer consent and the exact source
revision. An address/method change applies to a selected part; it cannot affect hidden mixed parts.
Approval binds both proposal timestamp and the narrowed commercial order revision (X2), so the
Change hold the proposal places no longer bumps the revision it is checked against. Apply locks both and rechecks
policy, price, current allocations and financial state. It uses the existing Change hold mechanism,
not OrderBeingChanged. A stale or unauthorized change leaves the order unchanged.

Warehouse releases/rebuilds affected open reservations and explicitly puts back picked stock;
an active pick or shipped quantity blocks an unsafe change. Between pack and ship, Accounting's
shipment-draft release contract must succeed before affected lines change. A finalized invoice
or shipped quantity requires linked returns/credits or finance correction, not in-place repricing.
Payment reduction is a separate authorized refund/reallocation; Sales cannot perform it implicitly.
If such a consequence cannot be completed in the guarded workflow, preview reports BillingConflict
and application waits for the owning operator. Successful application stores the changed document
PDF and operation result, releases only its own Change hold, and invalidates obsolete approvals.
Notification failure leaves Applied with delivery pending. **Needs:** SAL-CHANGE, CX-POSTING.

**Chargeable repair handoff.** A Customer Service WarrantyDecision may request a sales estimate.
Q.create#QuoteFromRequest also accepts an authorized `RqtWarranty` source (proposed, Customer
Service) without changing its type:
use selected chargeable RequestItems and RequestRecord/source links, retain the warranty decision
and scope, and send/accept through the same Sales offer contract. Customer Service reads the
result and records any required coverage/repair-consent decision through its own service; quote
acceptance cannot approve warranty coverage or release Maintenance work by itself. Public quote
access exposes only commercial terms, never the internal claim or diagnosis.

### ShipmentDetail — Context passed

Mount crosscut §3.8 ShipmentDetail at `Sales/Orders/ShipmentDetail` for the shipments of permitted
sales order parts. Sales follows sources, packages, carrier tracking and delivery state; pack, ship
and receive actions need Warehouse authority and are absent without it. Shipment notices stay with
Warehouse's `ShipmentShippedSendEmail` and `ShipmentDeliveredSentEmail`; Sales never resends them.
Derived from the baseline Shipment screens through crosscut §3.8. Crosscut §3.8 row:

| App | Tabs or panes shown | Filters fixed | Action set | Emphasis |
| --- | --- | --- | --- | --- |
| Sales | Overview, Items and sources, Packages and tracking | shipments of permitted sales parts | read only; open the order or the customer | delivery against the customer's promise |

### InvoiceDetail — Context passed

Mount crosscut §3.16 InvoiceDetail at `Sales/Orders/InvoiceDetail`, the Accounting financial
projection read through `mantle.account.InvoiceServices.get#InvoiceFinanceDetail`, with the source
order and customer fixed. A receivable view grant is required to open it; finance actions
(finalize, credit memo, payment application) keep their Accounting grants and are absent
otherwise; no unguarded entity read. Crosscut §3.16 row:

| App | Tabs or panes shown | Filters fixed | Action set | Emphasis |
| --- | --- | --- | --- | --- |
| Sales | Overview, Items and source lines, Payments and settlement (by grant) | invoices of permitted sales orders; receivable view | read only; send a PASS Billing pay link when the Accounting issuer grant is held | what the customer was billed and still owes |

## 7. Agreements, pricing and recurrence

### Agreements

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| AgreementFind | find | Find customer terms | customer, type, state, date range, expiring, template | saved find | — | Party/PartyAgreements/FindAgreement AgreementList |
| AgreementList | list | Open agreements | name/type, customer, seller, dates, status, renewal action | expiry badge | G.find#SalesAgreements | same baseline |
| NewAgreement | dialog | Start from terms/template | seller/customer, type, name, currency, interval, template | party/template choices | G.create#SalesAgreement | Party/PartyAgreements/FindAgreement NewAgreement |

Sales manages customer-side AgrSales/AgrProduct agreements and their templates; commission plans
are a later restricted context. Purchasing owns supplier negotiation, Accounting settlement/revenue
policy, and People employment agreements. **Needs:** SAL-AGREEMENT.

**Source:** research §7; Party/PartyAgreements/FindAgreement and Moqui Sales agreements.

### AgreementDetail

**Layout.** Header with parties, state and interval; tabs Overview, Parties, Terms, Items/prices,
Linked orders/subscriptions, Activities, Files and History. This is a domain-owned reusable screen:
Accounting/Customer Service may mount it with read or financial-term capabilities.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| AgreementHeader | single | Maintain customer agreement | type, description/text, seller/customer, currency, dates, template | party choices | G.get#SalesAgreement, G.store#SalesAgreement | Party/PartyAgreements/EditAgreement EditAgreement |
| AgreementParties | list; dialog | Additional participants and roles | party, role | scoped chooser | G.store#AgreementParty | AgreementParty; Moqui Sales agreements |
| AgreementTerms | list; dialog | Settlement and other terms | type, settlement term or value/text, item scope | owning-domain term choice | G.store#AgreementTerm | AddSettlementTerm, AddOtherTerm, AgreementTermList |
| AgreementItems | list; dialog | Product/service and pricing commitments | type, product, quantity/UOM where supported, dates, description | product lookup; linked price editor | G.store#AgreementItem | AddAgreementItem, AgreementItemList |
| AgreementPrices | component | Edit negotiated price rows | agreement/item, customer, product, currency/UOM, quantity band, dates | Products CustomerPrices mount | existing mantle.product.PriceServices.find#ProductPrices, store#ProductPrice, replace#ProductPrice, expire#ProductPrice | Catalog/Product/EditPrices; Moqui Sales AitPricing |
| AgreementConnections | list, read | Follow native commercial sources | order/item, subscription/base order, dates, status | scoped document links | G.get#SalesAgreement | research §7 contract source links |
| ActivateAgreement | dialog | Validate and activate exact terms | expected stamp, start date, acceptance evidence, confirmation | readiness/result | G.activate#SalesAgreement | ERPNext Contract; research §7 |
| EndAgreement | dialog | End future applicability | expected stamp, end date, reason, customer notice | named confirmation | G.end#SalesAgreement | Dolibarr contract service closure |
| AgreementCollaboration | component | Conversation and typed evidence | agreementId, audience, file/type | Chatter and RecordFiles | existing shared services; mantle.party.AgreementServices.create#AgreementContent, update#AgreementContent | NewContentForm, UpdateContentForm; Commons |

Agreement status uses the one Mantle seed that Purchasing proposes in PUR-AGREEMENT (X13):
AgmStDraft → AgmStActive → AgmStExpired or AgmStClosed, plus AgmStCancelled. Sales adds no states of
its own. ActivateAgreement moves Draft → Active, which requires parties, valid dates, required
acceptance evidence and authorized prices/terms; EndAgreement before the end date moves Active →
Closed; the lifecycle job moves Active → Expired at the end date; a draft that never starts is
Cancelled. Sales owns the customer AgreementDetail (crosscut `Shared/AgreementDetail`) and
Purchasing its supplier one; whether the two share header, parties, terms and items form
definitions is Open. Historical orders/prices and subscription entitlements are not
rewritten or revoked just because an agreement ends. Renewal starts a dated successor linked through
AgreementAssoc; amendments retain audited fields and saved approved PDFs, without a parallel version
table. AgreementParty lacks dates today: add dates only where participant succession requires them,
with a compatibility migration preserving existing participants.

Initial agreements provide negotiated prices, text/settlement terms and simple service commitments.
Advanced billing schedules/revenue recognition are §11; an agreement's quoted value is not a ledger.
**Source:** research §7; baseline party agreements. **Needs:** SAL-AGREEMENT, SAL-COLLAB.

### CustomerPrices, PriceLists, PriceListDetail and PriceExplain — Context passed

Use Products' canonical forms (§7) with sales direction, authorized internal seller, external
customer and optional agreement/item fixed. CustomerPrices reuses the ProductPrice row editor;
lists/rules use the existing Shared PriceLists/PriceListDetail; PriceExplain passes product,
quantity/UOM, currency, as-of date, store, parties and agreement to the one resolver.

Simple negotiated customer rows and contractual agreement rows coexist under the resolver's
documented precedence. Sales does not invent another precedence or silently reprice historical
orders. Pricing policy rights are separate from quote-price override rights. New negotiated prices
must be inside the agreement's applicable interval and parties; enforce agreement lifecycle in
the shared resolver/guard if current code lacks it, not just in the Sales editor.

A business using only Sales can receive Products' pricing capabilities without the Products
launcher. Read-only quote users get a safe selected-price explanation; full trace requires PRICE_VIEW,
and cost/margin additionally requires cost authority. Promotion editing remains Commerce-owned.
**Source:** research §§5, 7; Products §7; CX §3.21. **Needs:** SAL-AGREEMENT; PRD-PRICE, PRD-ACCESS.

### RecurringOrders

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| RecurrenceFind | find | Find base orders | customer, agreement, state, next due, last result | saved filters | — | baseline OrderDetail RecurOptions |
| RecurrenceList | list | Monitor scheduled orders | base order, cadence/zone, next due, last child, amount/currency, failure | result links | G.find#RecurringSalesOrders | Accounting recurring invoices; research §7 |
| RecurrenceSettings | dialog | Configure an eligible base | base order, cadence, zone, start/end, automatic invoice choice, reason | human schedule editor, cron advanced option | G.store#SalesRecurrence using existing mantle.order.OrderServices.update#OrderRecur | OrderDetail RecurOptions |
| RecurrenceAction | dialog | Pause/end or retry due work | base order, expected stamp, operation, reason | named confirmation; next-occurrence preview | G.change#SalesRecurrence | existing recurring order worker; research §7 |

RecurringOrders is the one editor of recurrence (X5). Crosscut OrderDetail's Recurrence form uses
the same G.store#SalesRecurrence and fields, and Accounting's RecurringInvoices list links here
instead of editing. Owners: Sales owns the worker guards and the recurrence fields, Shop the
dispatch of store-backed bases, and Accounting the monitoring and the auto-invoice right.

A base order carries `orderPurposeEnumId` RecurringTemplate, the one marker every exclusion reads:
`CreditOpenOrderSum` leaves it out of open-order credit exposure, the approved-email and reservation
SECAs skip it, and the Commerce, Warehouse and Insights order queries exclude it. Use the existing
`create_RecurringOrders` job and `mantle.order.OrderServices.create#RecurringOrders`/`create#RecurringOrder`,
with a proposed guard for timezone, start/end date, pause and due occurrence. Do not add a second
scheduler. The base must have no shipment/billing sources and stays a template: no reservations,
shipments, invoices or entitlement activation against it. Generated children alone fulfill.
A renewal clones with `clone#Order` `copyPayment=false`, so `OrderPlacedAuthorizePayments` finds
no copied Promised payment; a renewal payment is created only by Accounting's payment attempt, and
only with recorded off-session consent. The worker's base lock and due recheck are retained and
extended so operator and job retries deduplicate the same due occurrence; independent base failures
do not stop other customers. Auto-invoice needs finance authority at configuration and existing
billing guards at execution. Fixed agreement prices are not replaced by the latest catalog price
without a reviewed change.

StoreRecurringContract-linked bases dispatch to Shop's occurrence coordinator and are managed through
its lifecycle, not the legacy clone loop. Recurrence alone is not off-session payment consent and
does not authorize a gateway charge. **Needs:** SAL-RECURRENCE; SHOP-SUBSCRIPTION, CX-RECURRING.

**Source:** research §7; baseline OrderDetail RecurOptions and the native recurring-order worker.

### Subscriptions — Context passed

Mount Commerce's Subscriptions list ([Commerce §6](design-commerce.md#6-orders-carts-and-customers))
at `Sales/Agreements/Subscriptions` with a Sales context (X5): customer, agreement and seller
filters; the store filter optional, so storeless Subscription rows from native orders appear beside
store contracts. Sales adds a Follow up row action that schedules a Commons activity
(`mantle.work.TaskServices.create#SimpleTask`) and a link to the base order's RecurringOrders row.
No direct checkbox grants access or marks an invoice paid; change, cancel and restore route to the
owning Subscription, Commerce or Accounting lifecycle with its permissions. Ending a sales agreement
does not end already paid access; a subscription with no billing link is shown as such.

| App | Tabs or panes shown | Filters fixed | Action set | Emphasis |
| --- | --- | --- | --- | --- |
| Sales | Subscription list with source order, agreement and recurring owner | permitted seller; customer and agreement when opened from them; store optional | follow up, open base order; lifecycle actions only with Commerce or Accounting grants | renewals as account work |

**Source:** research §§7–8; Commerce Subscriptions. **Needs:** SAL-RECURRENCE, SAL-COLLAB; COM-SUBSCRIPTION.

## 8. Reports and forecasts

### Forecast

**Layout.** Period/organization/currency and owner/team selector, metrics, opportunity drill-down,
then the representative's forecast and manager review. Reuse SalesForecast/SalesForecastDetail,
not a spreadsheet snapshot subsystem. A forecast is a submitted judgement; pipeline is calculated.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ForecastFind | find | Select a reporting slice | organization, internal party/team, period, currency, as-of | time-period choices | — | Mantle SalesForecast; Odoo forecast |
| ForecastMetrics | display | Explain pipeline/commitment | quota, open amount, weighted amount, open and won monthly recurring revenue, submitted forecast, best case, won amount, actual orders/invoices | clearly labelled measures | F.get#Forecast | Odoo forecast and recurring plans; SalesForecast fields |
| ForecastDeals | list, read | Trace the calculation | deal, stage, probability, amount, expected close, included/reason | drill-down | F.get#Forecast | Odoo forecast list |
| SubmitForecast | single | Save a rep's judgement | forecast key, forecastAmount, bestCaseAmount, reason, expected stamp | decimal inputs | F.store#Forecast | SalesForecast; ERPNext targets |
| ForecastDetail | list, editable rows | Allocate product/category judgement | product or category, amount, quantity/UOM | dimension chooser | F.store#ForecastDetail | SalesForecastDetail |

Calculated open pipeline includes only qualified Open opportunities with expected close inside the
period. Weighted amount is Σ(amount × probability / 100), rounded for display in its currency.
Missing date/amount/probability are separately counted and excluded with reason. Won amount is
opportunity value closed won during the period; it is not invoiced revenue. Rep forecast/best case
are entered judgements. Actual order and invoice measures use their named event date and native
document definitions, not opportunity sums. A zero quota shows no percentage, not division by zero.

One forecast key is organization + internal party + time period + currency. Use the existing parent
forecast relationship for team hierarchy and do not add a parent's entered total to its child totals.
Manager roll-up uses unique opportunity ownership at the selected as-of date; additional participants
do not duplicate amounts. Detail allocations reconcile to their parent and cannot count a product
both directly and through its category. No mixed-currency grand total is shown; a future FX view must
name rate/date/source separately. **Source:** research §§1, 9. **Needs:** SAL-FORECAST, SAL-REPORT.

### Reports

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| SalesReportCatalogue | list, read | Open available analyses | name, description, saved filters, last run | report links | S.get#SalesReports | Accounting report catalogue; research §9 |

Report definitions/saved filters are shared with Insights; Sales owns its domain query definitions
and registers its reports with the Insights catalog. Exports use the same scope, field permissions,
parameters and source basis as the visible result.

**Metric owners (X11).** Sales defines the registry metric `orders.placed`: sales orders by
`placedDate`, excluding OrderOpen, OrderProposed and RecurringTemplate bases, over
`mantle.sales.SalesReportServices`. As registered (impl-insights P4) it is two metrics, `Sales.Orders` (a
count) and `Sales.OrderValue` (the value by currency), and Accounting's is `Accounting.InvoicedRevenue`;
these IDs replace `orders.placed` and `revenue.invoicedNet` wherever this file names them;
visits and attribution are Marketing's; the campaign → visit → lead → opportunity → order → revenue
funnel is Insights'. Sales reports and Home cite these IDs instead of defining their own.

**Shipped definitions (L6).** Beside Mantle's `report/mantle-sales*.json`, Sales ships a pipeline
dataset, a pipeline dashboard and alert-rule templates "quote expiring in N days" and "deal with no
activity for N days", plus a weekly pipeline/forecast digest as a report schedule a manager can
subscribe to. QuoteBatch, opportunity import and the recurrence guard declare `operation` and
`operation-ref`. These replace any Sales-specific operational counters. **Needs:** SAL-REPORT.

**Source:** research §9; Accounting report catalogue.

### SalesSummary

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| SummaryOptions | single | Choose scope and dates | organization, date range, customer/product, currency, comparison | date-period | existing mantle.sales.SalesReportServices summary APIs below | Accounting/Reports/SalesSummary SummaryOptions; existing Sales report |
| SalesOrderSummaryList | list, read | Explain native order measures | period, state, count, amount/currency | chart plus table | existing get#SalesOrderSummary | same baseline form |
| SalesInvoiceSummaryList | list, read | Explain billed measures | period, invoice state, amount/currency | separate from orders | existing get#SalesInvoiceSummary | same baseline form |
| TopProductList | list, read | Compare product sales | product, quantity/UOM, amount/currency | authorized drill-down | existing get#SalesTopProduct | same baseline form |
| TopCustomerClassList | list, read | Compare customer classes | classification, count, amount/currency | table/chart | existing get#InvoicesByCustomerClass | same baseline form |

Extend existing queries with service-level Sales authorization and explicit currency/date/status
basis where missing; read permissions cannot be assumed from app entry. Retain the current Sales
report path. Financial revenue is labelled invoiced/posted according to its actual source, never
presented as cash collected. **Source:** research §9 and baseline. **Needs:** SAL-REPORT.

### SalesAnalysis

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| AnalysisOptions | single | Choose native dimensions | period, seller/customer, product/category, currency, grouping | authorized choices | existing mantle.sales.SalesReportServices.run#SalesAnalysis, extended Sales read scope | Accounting/Reports/SalesAnalysis |
| SalesAnalysis | list, read | Explain order-item results | dimensions, quantity/UOM, subtotal, discounts, tax basis, currency | column selection; export; source links | same service | Accounting/Reports/SalesAnalysis SalesAnalysis |

Keep the existing route; replace unguarded report reads with the shared query service. Margin
columns are omitted unless both price and cost rights permit them. Sales owns the SalesAnalysis
catalog entry (Z10); Accounting's Reports/SalesAnalysis becomes a mount of this definition with
Accounting's finance columns. **Needs:** SAL-REPORT.

**Source:** research §9; baseline Accounting/Reports/SalesAnalysis and the current Sales route.

### PipelineAnalysis

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| PipelineReportOptions | single | Define cohort and dimensions | organization/team, as-of, close period, source/campaign, stage, currency | saved report | F.get#PipelineAnalysis | Odoo pipeline; ERPNext funnel |
| PipelineMeasures | list, read | Explain open work and movement | stage/source, count, estimated/weighted amount, recurring amount, age, missing estimates, next-activity coverage | chart with exact table | same query | Odoo CRM reports |
| PipelineFunnel | component | Show stage conversion now | stage, count, amount, share of the first stage | framework funnel panel through `report-embed` | the pipeline dataset (L6) | framework Monitoring funnel panel; ERPNext funnel |

Stage durations use audited transitions, including reopenings; historical gaps are reported as
unknown. Lead-to-opportunity conversion uses conversion events over an explicit lead-created cohort,
not current type counts. The funnel and stage chart use the built framework funnel panel through
`report-embed` on this screen and on Home (a table in html and print, text bars in tui, none in server-static; the
dataset's row filter is Sales' scope, impl-sales F66), with no wait for SAL-ANALYTICS; only a generic pivot
remains later. **Needs:** SAL-FORECAST, SAL-REPORT, SAL-ANALYTICS.

**Source:** research §§1, 9; Odoo CRM reports and ERPNext funnel.

### WinLoss

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| OutcomeOptions | single | Choose close-event cohort | period, owner/team, account/source, currency, reason | saved report | F.get#WinLoss | Odoo lost analysis; ERPNext opportunity reports |
| OutcomeResults | list, read | Explain results and reasons | won/lost counts/amounts, loss reason, cycle time, reopen count | linked cohorts | same query | research §9 |

Win rate is won / (won + lost) for the stated close cohort; leads disqualified before qualification
are separate. Reopened records retain past close events; the report states event-based versus
current-outcome mode and defaults to current final outcome as of the report date, one deal once.
**Needs:** SAL-CRM, SAL-REPORT.

**Source:** research §§3, 9; Odoo lost analysis and ERPNext opportunity reporting.

### TargetAttainment

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| TargetOptions | single | Select party/period/basis | organization, party/team, period, currency, actual basis | explicit basis selector | F.get#TargetAttainment | ERPNext salesperson target variance |
| TargetResults | list, read | Compare like measures | quota, submitted forecast, actual, variance, percent, source count | drill-down; no mixed currencies | same query | SalesForecast and ERPNext targets |

Target configuration names its measurement basis (won opportunity value, placed sales order value,
or finalized sales invoice value). Only the same basis is compared to quota; defaults use won
opportunity value. Order/invoice attribution must have an unambiguous dated primary representative;
unassigned amounts appear separately. **Needs:** SAL-FORECAST, SAL-REPORT.

**Source:** research §9; ERPNext salesperson target variance and SalesForecast.

## 9. Settings

### Settings

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| SalesReadiness | display | Explain missing setup | organization, stages, assignment, currency, templates, approvals, public site | actionable links | S.get#SalesReadiness | Commerce/Accounting readiness |

Link the same settings from Admin's index. External hosts, credentials, gateways, mail transport,
and tax/currency masters retain their existing owners. **Needs:** SAL-ACCESS, SAL-QUOTE.

As built (impl-sales P2): Settings is an area (`BOSS_SAL_SETTINGS`: the root user group denied, the manager allowed) with the
tabs Readiness (the landing, SalesReadiness), Stages, Teams, Sources (`LeadSources`) and Types and reasons, each gated by
permission as the menu is; the administrator (`SALES_CONFIGURE`) opens them all, a manager (`SALES_TEAM_MANAGE`) Teams alone. The
O verbs are `mantle.sales.OpportunityServices` `store#Pipeline`, `store#Stage`, `store#SalesTeam`, `store#SalesTeamMember`,
`store#LeadSource`, `store#LostReason`, `get#SalesOptions` (what an organization offers now, to any Sales reader) and
`get#SalesSetup` (the settings read, with ended rows, open-deal counts and edit flags, which the design did not name), over
`mantle/sales/SalesSettings.js`; S's `get#SalesReadiness` answers the framework's readiness contract as `sales.readiness`
(a default pipeline, stages for every pipeline in effect, a staffed team, a lead source offered; fix places `salesStages`,
`salesTeams`, `salesLeadSources`), with the settings entry `sales.settings` in Admin's index. Every write of an existing row
names the revision it read.

**Source:** research §10; consolidated Odoo/Frappe settings and current Accounting readiness.

### Stages

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| PipelineStages | list, editable rows | Configure stages | pipeline, description, sequence, default probability, folded flag, effective interval | reorder plus numeric sequence | O.store#Stage | SalesOpportunityStage; Odoo CRM stages |
| PipelineDefinition | single | Scope a pipeline | name, organization, applicable team, effective interval | team lookup | O.store#Pipeline | Odoo teams pipeline |

Proposed SalesPipeline owns stage scope; SalesOpportunityStage gains pipeline and presentation
metadata. Seed Qualified (10%), Discovery (25%), Proposal (50%), Negotiation (75%) as editable
initial setup, not demo-only rows. Won/Lost are outcomes, not seeded closed stages. A lead uses an
intake pipeline and may have no stage until qualified. Retiring a used stage retains history and
requires an explicit reassignment for open deals; it does not rewrite closed deals.
**Needs:** SAL-CRM.

As built (impl-sales P2): SalesPipeline has an organization, name, description, optional team, default flag and dates; a pipeline
with no organization is the instance's shared pipeline, offered to every organization until it sets a default of its own, and
changed only by a reader of every organization (the seeded `SalesDefault`, "Sales pipeline", with `SalesQualified`,
`SalesDiscovery`, `SalesProposal` and `SalesNegotiation`, initial setup in mr-mantle `data/SalesData.xml`). One default per
organization. A stage gains `salesPipelineId`, `foldFlag` and dates; the order is the numeric sequence with Up and Down, which
renumber the current stages 10, 20, 30; a stage is retired by its `thruDate`, and one holding open deals (outcome not Won or Lost)
only with another current stage of the same pipeline, to which they move, audit-logged. A pipeline is ended only when no open
deal is on its stages. SalesOpportunity gains its outcome `statusId` (`SalesOppOpen`, `SalesOppWon`, `SalesOppLost`, seeded in
`data/SalesCrmSeedData.xml`) here, for the retirement rule; P4 builds the lifecycle.

**Source:** research §§1, 10; Mantle SalesOpportunityStage and Odoo pipeline configuration.

### Teams

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| SalesTeams | list; dialog | Identify team parties | name, parent organization, manager, effective interval | Party chooser | O.store#SalesTeam | Mantle Party/PartyRelationship; Odoo team |
| TeamMembers | list, editable rows | Assign dated membership | person, team role, dates | employee/representative lookup | O.store#SalesTeamMember | same relationships; Moqui Sales team |

Use team Organization parties with a proposed SalesTeam role and dated relationships; do not add
another person/team identity table. Expiring membership changes access prospectively and prompts
reassignment of open work. It does not rewrite historical attribution. **Needs:** SAL-CRM.

**Source:** research §§3, 10; Moqui Sales team participation and Odoo teams.

As built (impl-sales P2): a team is an Organization party with the `SalesTeam` role, owned by its organization, whose dated
`PrtSalesTeamOf` relationship to the organization is its effective interval; a member is a dated `PrtSalesTeamMember` row from a
person who works for the organization (an agent or employee in effect) as `SalesRepresentative` or `Manager`, so the manager is a
membership. Joining and leaving are now or later, never back-dated; a person has one membership of a team at a time; ending a team
ends its memberships; nothing is deleted. TeamMembers' lookup offers the organization's people by party, labelled with their job
title from People's `find#Employees` for a holder of `PEOPLE_DIRECTORY_VIEW`, and a member links to Employee360 through People's
`get#Employee360Link`. `SalesAccess.js` reads a team's organization and a person's current teams for P4's scope.

### LeadSources

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Sources | list; dialog | Maintain shared acquisition choices | source ID, description, source type, active selection state | DataSourceType dropdown | O.store#LeadSource with shared-source permission | SalesData LEAD_SOURCE types; Odoo UTM source |
| UtmSourceMap | list, editable rows | Give a tracked-link lead its source | organization, UTM source, UTM medium (optional), DataSource, from/thru | Marketing vocabulary choices for source and medium | O.store#LeadSourceMapping | new; fields here plus mapping ID and audit fields |

`SalesOpportunity.dataSourceId` names `moqui.basic.DataSource`, not a DataSourceType enum.
Existing LEAD_SOURCE descendants classify source rows; seed/select actual DataSource records.
[Marketing §12](design-marketing.md#12-settings) mounts this same editor and owns campaign configuration; Sales selects
authorized MarketingCampaign/TrackingCode references. A proposed effective organization/source
binding controls offered choices without deleting global sources. UtmSourceMap is the X10 binding:
O.store#LeadIntake looks up the intake's UTM source and medium (from Marketing's tracking event
or the published form's link) and sets the lead's DataSource; source plus medium wins over source
alone, and an unmapped pair leaves the publication's default source. The intake also writes the
existing SalesOpportunityTracking join to the tracking code. **Needs:** SAL-CRM.

As built (impl-sales P5): UtmSourceMap is `SalesLeadSourceMap` (organization, UTM source and medium lower-cased, a source the
organization is offered, dated; ended, never changed), on LeadSources with its Map a source and End, the source and medium typed
until Marketing offers its vocabulary. LeadSources also shows Mail intake: each team's plus tag (`sales+tag@` the intake mailbox,
whose rule's action is Make a sales lead) and the source its mail takes, PartySettings of the team (`store#TeamIntake`).

As built (impl-sales P2): the binding is `SalesLeadSourceBinding` (dataSourceId, organization, dates); a new source is offered to
its organization at once, an offer is added or ended per organization of the caller's, and a source's name or type is changed
only by one whose scope covers every organization it is offered to (`SOURCE_SHARED`); another organization is named on the list
only when it is in the reader's scope. The screen links only to itself and reads the mounting root's `sales` context, for
Marketing's mount.

**Source:** research §§2, 10; SalesData source types, framework DataSource and Odoo UTM.

### Targets

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| SalesTargets | list; dialog | Set quotas and hierarchy | organization, representative/team, TimePeriod, currency, basis, quota, parent forecast | scoped period and party choices | F.store#Target | SalesForecast; ERPNext Sales Person |

Past targets retain audit history; changing a target never changes measured actuals. Duplicate
forecast keys and hierarchy cycles are refused. **Needs:** SAL-FORECAST.

**Source:** research §9; SalesForecast and ERPNext Sales Person targets.

### TypesAndReasons

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| SalesTypes | list, read | Show supported record types | Lead, Opportunity, description | fixed semantic IDs | O.get#SalesOptions | SalesOpportunity.typeEnumId |
| LossReasons | list; dialog | Maintain structured reasons | description, sequence, effective selection state | enum choice | O.store#LostReason | Odoo lost reasons |

Seed proposed Lead/Opportunity values under SalesOpportunityType and loss-reason values under a
new SalesLostReason type. Do not attach the unused legacy LeadStatus flow to a nonexistent Lead
entity. Reason retirement hides future selection, retaining old labels/history. **Needs:** SAL-CRM.

As built (impl-sales P2): the types are `SotLead` and `SotOpportunity`, the reasons `SalesLostReason` values (`SlrPrice`,
`SlrCompetitor`, `SlrNoBudget`, `SlrNoDecision`, `SlrTiming`, `SlrOther`, initial setup) ended by `Enumeration.thruDate`, and
the recurring plans `SalesRecurringPlan` (`SrpMonthly` 1, `SrpQuarterly` 3, `SrpHalfYearly` 6, `SrpYearly` 12); SalesTypes
lists the types and plans read only. Since P4 (the user's call, impl-sales §4 Nov 13): the reasons and plans are the instance's,
so `store#LostReason` needs every organization's scope (`SALES_ALL_ORGANIZATIONS` or a system administrator, `ORGANIZATION_DENIED`
otherwise), as the shared pipeline does, and LossReasons offers its actions only then (`get#SalesSetup` canEditReasons); a
configurer of one organization reads them. No service writes the recurring plans yet.

**Source:** research §§2–3, 10; Odoo lost reasons and Mantle opportunity type discriminator.

### SalesDefaults

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| SalesPolicy | single | Set effective operational defaults | organization, dates, default pipeline/team, validity days, templates (quote, confirmation, reminder), customer response requirements, high-value acceptance threshold per currency, the approval setting (sales orders wait for a Sales approver), approve accepted net-terms orders, intake retention days, reminder policy | preview and publish | Q.store#SalesPolicy | Odoo Sales settings; Carbon sales configuration |

Currency and units resolve from organization/customer/product and then user preferences; never
hard-code USD or each. Default quote validity is 30 calendar days in the seller's zone, visible
and editable on each draft; expiry stores an explicit timestamp. Default reminders are off.
The approval setting is off by default; on, no sales order of the seller is approved
automatically, whichever app placed it, and each waits for a holder of `SALES_ORDER_APPROVE`
(§1.1). "Approve accepted net-terms orders" is off by default and applies only while the approval
setting is off (§5). The confirmation template is the
registered EmailTemplate Q.send#OrderConfirmation uses for storeless orders. The high-value
acceptance threshold is per currency and unset by default; above it a bearer link cannot accept on
its own, and acceptance needs PASS sign-in as an invited contact (§10). Unqualified, unverified intake
records are purged after the intake retention days (§3).
Published policies are effective-dated and audit-logged. Selection of a finance-owned settlement
term is allowed; editing its financial policy is not. **Needs:** SAL-QUOTE, SAL-APPROVAL.

**Source:** research §§5, 10; Odoo Sales settings and Carbon configuration.

### ApprovalPolicies

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ApprovalRules | list, editable rows | Define price/amount exceptions | organization, interval, purpose, threshold/currency or discount %, price-floor rule, approver role, self-approval restriction | bounded rule types; no arbitrary scripts | Q.store#SalesApprovalPolicy | OrderDecision; Carbon sales-rule severity |
| ApprovalPreview | display | Explain required decisions | quote/revision, rule, inputs, required approver, result | confidential-input redaction | Q.preview#Quote | shared approval preview |

Discount basis is the selected resolver price before explicit manual discount, with separate
promotion/tax components; the design does not silently use list price when contractual price
exists. Missing FX/cost inputs block a rule needing them. Policies are evaluated before proposal,
placement and approval; decisions are OrderDecision rows that bind the source revision and policy row. Business chooses
thresholds explicitly; installation seeds no permissive monetary threshold. Until configured,
manual price overrides require an approver distinct from their author. **Needs:** SAL-APPROVAL.

**Source:** research §§5, 10; OrderDecision and Carbon sales-rule guardrails.

## 10. PASS Sales customer access

### 10.1 Mount, identity and transport

Propose `mr-pass/screen/Sales.xml`, registered app type Sales with mount `sales` and internal
organization target. It is independent of Shop/ProductStore and coexists with Billing, Supplier
and Support. PASS's configured hosts, PublicSiteApp publication and request contract apply.
Remote frontends use the operator-configured Mantle authority through `pass.Facade.call#Operation`;
neither local nor remote pages call ironstone services or mount BOSS XML.

Extend existing `mantle.party.ExternalAccessServices` and its scope/record registration rather
than creating a second token system (X6). Today its registry knows only Invoice and the supplier
Order, `appKinds` only billing and supplier, and `invite#Contact` refuses any party that is not an
organization. X6 adds: one customer-direction record kind, proposed `SalesOrder` (the existing
`Order` kind requires an internal customer), which Sales uses for QuoteView, QuoteRespond and
OrderView and Shop for its order, download and renewal links; `sales` and `support` in `appKinds`;
and a self relationship in `check`, under which the record's party is the signed-in user's party
with a verified email, so an individual customer reaches PASS Sales without a contact grant. A
business customer's contacts still come from an account-bound invitation. Proposed QuoteView and
QuoteRespond scopes bind the issued order revision (the narrowed commercial counter, X2), customer
and seller, expire no later than the offer, and can be revoked. Bearer access reaches one issued
offer/response or one order only; it never enables CustomerQuotes or CustomerOrders enumeration.
"My account" is the PASS Account hub; PASS Sales contributes a Quotes and Orders card to it, beside
Billing's, Support's and Shop's.

Proposed public operations `sales.findQuotes`, `sales.getQuote`, `sales.getQuoteDocument`,
`sales.respondQuote`, `sales.getQuoteResponse`, `sales.findOrders` and `sales.getOrder` map to
`mantle.order.SalesPortalServices` (§12.1). PASS adds them to its registered operation schema and
route allowlist. The server derives actor/customer/organization from the checked capability,
not a submitted party ID. Documents stream through protected media with the same checks;
an internal content location or general file-browser URL is never returned. Sales registers a
privacy provider for the records PASS Sales exposes (§12.2, X15).

### CustomerQuotes

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| MyQuoteFind | find | Narrow own issued offers | reference, state, date/validity | bounded filters | — | Odoo portal quotations |
| MyQuotes | list, read | Open current/historical offers | reference, seller, issued date, total/currency, expiry, response | mobile document links | sales.findQuotes → P.find#CustomerQuotes | Odoo customer quotation list |

Only issued documents for the verified account are listed; drafts, template/base orders,
internal notes, restricted parts and other customers are absent. Pagination counts obey the
same filter. **Needs:** SAL-PORTAL.

**Source:** research §§5, 11; Odoo portal quotations and the current PASS identity contract.

### CustomerQuote

**Layout.** Seller/customer identity, reference/revision, validity, fixed offered lines/taxes/
freight/total, terms, PDF, then Accept or Decline. No BOSS sidebar, chatter stream, prices/cost
trace or arbitrary order edit controls. Initial acceptance covers the entire issued offer;
line-by-line negotiation and optional-product configuration are later.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| QuoteOffer | display | Review exact offered terms | reference/revision, parties, lines/UOM, totals/currency, validity, terms | responsive table; PDF link | sales.getQuote → P.get#CustomerQuote; sales.getQuoteDocument → P.get#QuoteDocument | Odoo portal; Carbon digital quote |
| AcceptQuote | single | Record informed acceptance | offer revision, customer PO, acceptor name/title, terms acknowledgement, request key | explicit total/revision confirmation | sales.respondQuote → P.respond#CustomerQuote | Carbon QuoteToOrderDrawer; ERPNext contract signature audit |
| DeclineQuote | dialog | Decline issued offer | offer revision, reason/comment, request key | explicit Decline confirmation | same public operation with decline action | Odoo portal quote |

Acceptor name/title is evidence supplied by the customer, not a claim of independently verified
signature authority. Store authenticated identity or capability identity, action/time, offered
revision, terms/PDF reference and customer PO; do not claim a certified digital signature.
Public submission cannot change products, price, taxes, address, seller or contact relationship.
The customer requests changed terms through the displayed sales contact; staff revises the offer.

**High-value acceptance (impl-sales §4, Nov 11, 2026).** SalesDefaults holds an acceptance threshold
per currency, unset by default (§9). Where the offer's total is above the threshold for its
currency, a bearer link shows the quote and declines but cannot accept: acceptance needs PASS
sign-in as a contact invited for the customer, and the page says so with the sign-in link. Below
the threshold, or with none set, the bearer link accepts. A one-time code to the contact's
verified email as a second way is later (§11).

P delegates to the same guarded Q response lifecycle as staff acceptance. The server checks the
issued revision/state/expiry under lock and revalidates acceptance eligibility. A price or term
change requires a new offer, not silent repricing at Accept. Security/product/credit checks
still apply: the seller's approval setting (§1.1) or a credit hold may leave the accepted order awaiting processing;
invalid or stale terms require customer re-review. TUI staff acceptance uses the same fields and
service; the public HTML form works without a canvas/signature drawing requirement.
**Needs:** SAL-PORTAL, SAL-QUOTE, SAL-APPROVAL.

**Source:** research §5; Odoo/Carbon customer quotes and ERPNext contract acceptance evidence.

### QuoteResponse

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ResponseReceipt | display | Show durable response and next action | reference/revision, accepted/declined, time, customer PO, order reference, fulfillment/approval message | receipt/PDF; seller contact | sales.getQuoteResponse → P.get#QuoteResponse | PASS Billing result; Carbon accepted quote |

A repeated request returns the same response/order after authorization, even if the successful
placement advanced the native order revision. This replay check precedes the “offer is no longer
open” error, but never precedes identity/revocation checks. Conflicting second responses are refused.
After response, the issued capability permits only its original offer and response receipt until
its expiry; a successful status transition does not revoke receipt access. Material revision or
explicit revocation does. Further identical response retries resolve to the receipt, not a new write.
There is at most one effective response to an issued revision; concurrency uses native order/issue
locks and the shared PostingOperation identity. Expired/revoked access shows a neutral unavailable
state and contact route without leaking record details. Email failure does not undo acceptance.
Billing/Support links appear only for separately permitted published records; no quote token is
reused as a payment or support grant. **Needs:** SAL-PORTAL, SAL-QUOTE.

**Source:** research §5; Carbon quote acceptance and PASS Billing result handling.

### CustomerOrders

B2B order self-service without Shop (SAL-R01): a customer contact follows the orders of the
accounts it may see, including direct orders that never had a quote.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| MyOrderFind | find | Narrow own orders | reference, customer PO, state, date range | bounded filters | — | Odoo portal orders |
| MyOrders | list, read | Open current and past orders | reference, customer PO, order date, total/currency, delivery state, billing state | mobile document links | sales.findOrders → P.find#CustomerOrders | Odoo portal sales orders; ERPNext portal orders |

Only placed sales orders of the verified account and the contact's permitted accounts are listed;
quotes in progress, RecurringTemplate bases, internal notes, restricted parts and other customers
are absent. **Needs:** SAL-PORTAL.

**Source:** reference SAL-R01, Odoo `sale` portal controller; current PASS identity contract.

### CustomerOrder

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| OrderSummary | display | Show what was ordered | reference/revision, parties, lines/UOM, totals/currency, customer PO, promised dates, accepted quote reference | responsive table; order PDF | sales.getOrder → P.get#CustomerOrder | Odoo portal order page |
| OrderShipments | list, read | Follow delivery | shipment, ship date, carrier, tracking link, delivered state | carrier tracking link | same operation | Odoo portal delivery |
| OrderInvoices | list, read | Find what to pay | invoice, date, due, total, open amount | PASS Billing InvoicePay link per invoice | same operation | PASS Billing InvoicePay |

Read only: no edit, cancel or reorder controls. A change or cancellation request opens PASS Support
with the order selected (X7): NewCustomerCase's OrderCancelRequest files the Customer Service cancel
proposal through the `requestOrderCancel` operation
(`mantle.order.OrderChangeServices.request#CustomerCancel`, over `save#OrderChange`), and a return
goes through RequestReturn. Invoice links open PASS Billing InvoicePay through its own capability;
the order page never takes payment.
A bearer link from the confirmation mail reaches this one order only. **Needs:** SAL-PORTAL.

**Source:** reference SAL-R01; Odoo `sale` portal; PASS Billing InvoicePay.

## 11. Later capabilities

These screens are designed extensions, absent from initial menus. Each has a named delivery gate;
none is a prerequisite for S1–S3. Three reference features are later without a screen yet: a
first-response target on lead queues (lead response SLA, SAL-R05), activity plans and cadences as
WorkEffort activity templates (SAL-R06), and a partner/reseller channel with lead forwarding over
PrtSalesAffiliate (SAL-R07). A one-time code to an invited contact's verified email, as a second
way to accept a quote above the high-value threshold (§10), is later too.

### ContractSchedules

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ContractSchedule | list; dialog | Propose contractual billing milestones | agreement, service period, milestone/cadence, amount/currency, advance/arrears, acceptance requirement | schedule preview | proposed G.preview#ContractSchedule, G.propose#ContractAmendment | Carbon service contracts; ERPNext subscriptions |
| Amendment | wizard step | Review effective commercial change | agreement timestamp, changed terms, start date, customer acceptance, billing impact | before/after and evidence | proposed G.apply#ContractAmendment | Carbon ContractAmendments |

Accounting owns approved billing/revenue schedules and native invoice generation; Sales authors
commercial terms and receives the finance result. Recurring orders remain the default where they
express the contract; Accounting's non-order schedule handles only obligations outside that model.
Customer retainers and prepaid service hours use this same later contract boundary. Sales defines the
purchased allowance, period, unit, rollover/expiry, overage and effective amendment terms; Projects
records approved usage and linked drawdown/correction facts; Accounting owns invoice, settlement and
recognition treatment. Consumption has a stable source identity and cannot be counted again on retry.
No employee advance or payroll record represents a customer entitlement, and People takes no
part in customer retainers. Gate: Accounting schedule/recognition contract and customer amendment
acceptance. No second invoice
worker or revenue ledger. **Source:** research §7. **Needs:** SAL-LATER.

### Commissions

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| CommissionOptions | single | Select earning basis and payee | AgrCommission agreement, representative/partner, period, currency, order/invoice/payment basis | explicit source basis | proposed mantle.sales.CommissionServices.preview#Commissions | ERPNext Sales Partner; AgrCommission/AitCommissionRate |
| CommissionLines | list, read | Explain provisional earnings | source/line, attributable basis, rate, amount, reversal, prior settlement | source-linked trace | same proposed preview | ERPNext commission report |
| ApproveCommission | dialog | Approve source-bound earning input | period, selected sources, rule dates, approver, operation key | totals/duplicate check | proposed mantle.sales.CommissionServices.approve#Commissions | People PayrollInput; Accounting payable intake |

Commission rules use dated AgrCommission/AitCommissionRate terms and explicit attribution.
Approval creates a unique source-bound earning fact and hands it on by payee (X16). An employee's
commission becomes a People PayrollInput whose PayrollInputSource type is proposed `SalesCommission`,
keyed by the earning fact so it is paid once; People's payroll approval and run take it from there.
A partner's or reseller's commission goes to Accounting payable intake as a payable source line
for that partner, never through payroll. Credits/cancellations create linked adjustments, not
edits to settled earnings. Rep self-view cannot expose other payees. The default earning basis is
Open. Gate: approved calculation/basis rules and the People and Accounting intake contracts.
**Needs:** SAL-LATER.

**Source:** research §9; ERPNext sales-partner commissions and Mantle AgrCommission.

### Territories

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| TerritoryTree | list, editable rows | Define coverage hierarchy | name, parent, organization, geography/classification, effective dates | native tree; explicit parent action | proposed O.store#Territory | ERPNext Territory |
| TerritoryAssignments | list; dialog | Allocate coverage | territory, team/representative, interval, priority | dated party links | proposed O.store#TerritoryAssignment | ERPNext Sales Person |

Territory is a new classification/routing record, not a Party identity. Explicit priority resolves
overlap; equal-priority ambiguity blocks auto-routing and enters a review queue. Gate: routing
policy and ownership migration preview. Existing assignments never silently migrate. **Needs:** SAL-LATER.

**Source:** research §§9–10; ERPNext Territory and sales-person hierarchy.

### AssignmentRules

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| RoutingRules | list, editable rows | Configure deterministic routing | organization, source/territory, priority, eligible team, schedule, round-robin choice | bounded predicates | proposed O.store#AssignmentRule | Frappe CRM assignment rules |
| RoutingPreview | display | Explain proposed allocation | lead, candidates, availability, matching rule, selected owner/reason | dry-run trace | proposed O.preview#Assignment | Frappe assignment configuration |

Use an atomic cursor per rule/team for round-robin; no eligible assignee leaves an explicit
unassigned queue. Retry does not advance the cursor twice. Until these rules ship, every intake
routes to the fixed team queue its publication or mail rule names (§3, X16). Gate: dated
membership, schedule and assignment audit. **Needs:** SAL-LATER.

**Source:** research §§2, 10; Frappe CRM assignment rules.

### LeadIntakeForms

The intake **service** is first-release work (S1, X16): proposed
`mantle.sales.OpportunityServices.store#LeadIntake` takes a validated submission from a published
form, a mail rule, a Comms `create-from` action or a Marketing lead rule, writes the SalesLeadIntake
record, applies Sales' duplicate policy and the UTM source map, creates the lead and routes it to
the fixed team queue the source names. Marketing's first release calls it. This screen, a Sales
context of the Commons form-publication editor (one FormPublication and FormInvitation over
ExternalAccess, owned by Commons, X16), is later; until it ships, lead publications are made in
Marketing's SurveyDistribution with purpose lead.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| IntakeDefinition | single | Configure a public lead form | DbForm, organization/site, allowed fields, consent text, default source, team queue, publication interval | shared form-builder mount | proposed Commons FormPublication services, purpose lead (X16) | Frappe CRM web forms; shared DbForm |
| IntakePreview | display | Preview public submission | published fields, labels, validation, privacy/consent | public-safe preview | proposed O.preview#LeadIntake | Frappe form preview |

**Source:** research §2; Frappe CRM Web Form and shared DbForm.

### SubmitForm — Context passed

There is one public lead page, Marketing's PASS SubmitForm
([Marketing §13](design-marketing.md#13-pass-marketing-participation)); Sales LeadIntake is its
lead context, not a second page or a `sales.submitLead` operation (X15). A publication with purpose
lead submits through `marketing.submitForm` → `mantle.marketing.MarketingPortalServices.submit#Form`,
which accepts the response and then calls O.store#LeadIntake as a separate, replay-safe effect.
Transactional contact stays separate from marketing consent; a lead is never auto-subscribed. No
public party search, direct record ID selection, arbitrary service/field execution or internal
duplicate result. A Sales-only organization enables the PASS Marketing app for its lead pages; it
needs no BOSS Marketing.

| App | Tabs or panes shown | Filters fixed | Action set | Emphasis |
| --- | --- | --- | --- | --- |
| Sales | Published lead form and neutral receipt | publication with purpose lead; its organization, default source and team queue | submit only | a qualified handoff into the lead queue |

**Source:** research §2; Odoo website_crm and Frappe Web Form. **Needs:** SAL-CRM, SAL-PORTAL; MKT-FORMS, MKT-PUBLIC.

### QuoteExtraction

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ExtractEvidence | wizard step | Select authorized source | request/file, language | scanned file picker | proposed Q.extract#QuoteRequest over existing `org.moqui.agent.AiTaskServices.run#Extract` | Carbon RFQ document drop |
| MapExtractedLines | wizard step | Review every proposed match | source page/row, text, product, quantity/UOM, confidence, ignored rows | side-by-side evidence | proposed Q.apply#ExtractedRequestLines | Carbon MapExtractedLinesModal |

Q.extract#QuoteRequest calls the built `run#Extract` AI task with an RFQ line schema; document text
is wrapped as untrusted, and the result is a proposal only. Untrusted document instructions never
trigger services. Human review and normal item validation precede writes; independent row
failures are named. Gate: a model bound to the `extract` feature and audited mapping (L9).
**Needs:** SAL-LATER.

**Source:** research §§2, 5; Carbon RFQ extraction and reviewed line mapping.

### QuoteConfiguration

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ConfigureOffer | wizard step | Select compatible options | base product, variants, optional lines, bundle quantities, customer context | Products variant/bundle selectors | proposed Q.preview#QuoteConfiguration | Odoo configurator/optional products; ERPNext bundles |
| ConfirmConfiguration | wizard step | Apply one reviewed selection | selected lines, price/tax/availability, expected revision | delta/totals confirmation | proposed Q.apply#QuoteConfiguration | same references |

Do not clone a product configurator into Sales. Gate: Products configuration/compatibility
contract and reproducible pricing. Public selection must produce a newly priced/reviewed offer
before acceptance; it cannot mutate an already accepted document. **Needs:** SAL-LATER.

**Source:** research §5; Odoo optional/configurable products and ERPNext bundles.

### ManufacturingEstimate

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| RequestCostEstimate | single | Request method-specific costing | quote item, quantity/UOM, method revision, facility, required date | approved method chooser | proposed Q.request#ManufacturingEstimate consuming Manufacturing cost services | Carbon quote make/buy costing |
| EstimateResult | display | Use approved cost evidence | material/labor/overhead, lead time, cost date/source, approved amount | restricted trace; apply suggestion | proposed Q.get#ManufacturingEstimate | Manufacturing estimate; Carbon price trace |

Manufacturing owns BOM/routing, estimation and cost approval. Applying a sale price requires Sales
authority and policy review; restricted cost data never enters a customer PDF. Gate: approved
estimate and date/capacity semantics. **Needs:** SAL-LATER.

**Source:** research §5; Carbon make/buy quote costing and Manufacturing estimates.

### Rentals

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| RentalTerms | single | Agree dated use of units | customer, agreement, asset/product, dates, rate/currency, deposit terms, return condition | availability calendar plus list | proposed G.store#RentalTerms | Carbon rental agreement |
| RentalExecution | list, read | Follow custody and settlement | assigned serial, checkout/return, inspection, damage, deposit/invoice | owning-app links | proposed G.get#RentalExecution | Carbon rental units; Warehouse custody |

Warehouse/Maintenance own unit custody, inspection and availability; Accounting owns deposits,
lease classification and settlement. Gate: those contracts and rental-specific cancellation/return
rules. Sales never creates an asset ledger or a local deposit balance. **Needs:** SAL-LATER.

**Source:** research §7; Carbon rental agreements and unit custody.

## 12. Service and shared-screen contracts

### 12.1 Service ownership and interfaces

The abbreviations below denote proposed packages, not existing APIs. Their verbs in the form
tables specify public service contracts for implementation. Existing services are named in full
where first used; extending them preserves their native business rules and non-Sales callers.
Service implementations use inline XML Actions first and cohesive JavaScript modules where needed.
No BOSS pass-through simply renames a Mantle call.

| Prefix / package | Responsibility | Main inputs → outputs |
| --- | --- | --- |
| O — mantle.sales.OpportunityServices | Lead/opportunity lifecycle, lead intake (`store#LeadIntake`: SalesLeadIntake record, duplicate policy, UTM source map, fixed-queue routing), dated participation, pipeline/settings and batch actions | organization, authorized record/filter or validated intake source, declared fields, expected stamp → scoped record/rows/options or changed record/reason code |
| S — mantle.sales.SalesWorkspaceServices | Authorized home, account/customer projections, duplicate guard, report catalogue and readiness | organization, filters/record, pagination → display values, capabilities, counts, links and page metadata |
| F — mantle.sales.ForecastServices | Forecast keys, targets, explicit analytic cohorts and source reconciliation | organization, party/team, period/as-of, currency, basis, expected stamp → measures, source rows, exclusions and persisted judgement |
| Q — mantle.order.SalesQuoteServices | Quote intent/templates, native-order preparation, approvals, issuance, responses (decline through `cancel#Order`), guarded sales transitions, sending and the storeless order confirmation (`send#OrderConfirmation` over the Comms delivery ledger) | order/part/source, expected revision, action data, operation key → native order, current revision, issue/response/decision or named conflict |
| C — mantle.order.OrderChangeServices | Shared Customer Service/Sales proposal, preview, decision and atomic application | request/proposal stamp, order revision, changed fields, preview, operation key → impact, decision, applied revision and dependent work |
| G — mantle.party.SalesAgreementServices | Customer agreement lifecycle and authorized recurrence/subscription projections | agreement/base order, dates/terms, expected stamp, operation key → agreement, recurrence result or subscription/source rows |
| P — mantle.order.SalesPortalServices | Checked customer projections of quotes and orders, and quote responses over Q | checked PASS identity/token, organization target, quote/issue or order, request key → allowlisted view/receipt; no internal entity maps |
| ironstone.sales.ContextServices | BOSS entry, same-app links, screen options and providers | app/user context → sharedMountContext, choices and links |

`find#` queries return service-calculated pagination and scoped totals; choose-record queries
filter in the database, include the selected authorized value outside the first page and reject
unknown choice sources. Export is a representation of the same authorized query. Read and write
responses declare out-parameters and omit restricted fields before serialization.

Material updates carry `lastUpdatedStamp` or the native expected revision; financial/commercial
commands, qualification, merge, send, response and batch items carry operation identity.
Use existing `mantle.ledger.transaction.PostingOperation` and its request-hash/result convention;
do not add SalesOperation. Public retries need an extension that binds the operation to the
verified customer/capability identity as well as organization, action, issue and payload hash:
the current internal helper's userId check alone does not isolate anonymous bearer requests.
Authorization is rechecked before returning a stored result. Operation-key collision or changed
payload is refused; locks and a unique issue/response constraint prevent a second order response
even under different request keys.

Suggested reason codes, stable across UI and public calls: Forbidden/NotAvailable, StaleRecord,
StaleOrder, OfferExpired, OfferRevoked, AlreadyResponded, ApprovalRequired, ApprovalExpired,
PriceUnavailable, StockChanged, BillingConflict and OperationKeyConflict. Public projections map
private denial details to NotAvailable. Independent batch items return their own outcome; one
conversion/response/change with its related writes is atomic.

### 12.2 Shared-screen and shell contexts

Full forms stay with the named owner. The following contracts supplement the detailed contexts
in §§3–7 and are registered in crosscut, rather than copied into Sales.

| Surface | Context and allowed behavior |
| --- | --- |
| Customer360 / ContactDetail | Authorized customer/seller; sales summary, pipeline, quotes/orders, agreements, contacts and activities; finance fields only by their view rights (§4) |
| OrderDetail | One route for draft quote and accepted/direct order; source-derived action set, source revision and explicit part filtering; native Projects/Accounting contexts preserved (§§5–6) |
| OrderChangeDetail | Canonical Customer Service forms with Sales commercial-kind apply capability; shared Mantle services and the same proposal/decision (§6) |
| Product360 | Sales product/variant identification, permitted customer prices, documents and availability; product edits require Products permission; no implicit supplier cost or BOM access |
| InventoryAvailability | Product, quantity/UOM, required date and authorized facilities; read only for Sales unless a separate warehouse action grant is present; report readiness/as-of and shortfall without promising unknown stock |
| ShipmentDetail | Shipment sources/tracking for permitted order parts; no pack/ship/receive action without Warehouse authority; derives from baseline Shipment screens and CX §3.8 |
| InvoiceDetail | Existing Accounting shared financial projection, source order/customer fixed; receivable view required, finance actions separately gated; derive from Accounting invoice forms, never an unguarded entity read |
| AgreementDetail | Sales owns the definition; Customer Service reads coverage/terms and Accounting gets its own term/finance actions, with customer/seller fixed (§7) |
| Prices | Products-owned row/list/rule/explanation forms with sales/customer/agreement scope and existing price/cost permissions (§7) |
| RFQ and work item | Projects RequestDetail/WorkItemDetail with host links, authorized parties and normal task/case behavior; RqtQuote and RqtOrderChange do not inherit support SLA rules unless explicitly placed in a service queue |
| Chatter / RecordFiles | Extend authorized host registration for SalesOpportunity and guard Agreement by parties/organization. Use CommunicationEventRecord, WorkEffortRecord and RequestRecord; add SalesOpportunityContent for opportunity files, not SalesOpportunityNote or another generic link system |
| Calendar and Today | Existing Commons calendar/activity screens, assignee and permitted host fixed; no Sales scheduler; nextStep remains free text rather than a due activity |
| Approvals | Existing Commons provider filtered to SalesQuoteApproval and OrderChangeApproval (both Mantle topics; impl-sales F26); original source-policy actions, revision and recipient checks |
| Palette | Scoped O/S/Q/G searches; selected destination is a same-app record route; rows carry `recordEntity` and `recordId`. Hidden field data is never indexed into a readable snippet |
| Comms providers | `record-lookup`, `create-from` (Lead, QuoteRequest), `ext-action`s in the chat, voicemail and call slots, `contact-card` in Mail, and `call-context` answering with the caller's open opportunities and quotes the user may see (§1.4) |
| Meetings | Commons EventDetail with a CallLink and iMIP invitations for prospect meetings (L7); no Sales guest-link mechanism |
| Sync | Read-only projected CardDAV address book of the rep's account contacts (§4); no writes from devices |
| Mail intake | `createLead` and `createQuoteRequest` EmailRuleAction rows on the Sales intake addresses (§§3, 5) |
| Merge | Commons Duplicates mounted as MergeAccounts; guards inside Mantle `merge#Parties` (§4, X15) |
| Privacy provider | Registered with Admin's privacy coordination (X15) for leads and SalesLeadIntake records, opportunities, quote issues and responses, and PASS Sales access grants; it finds a subject's records, exports them, and redacts intake details of an unqualified lead, while orders, invoices and agreements stay under their retention rules |

### QuickCreate

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| SalesQuickCreate | component | Offer source-aware creation | kind and the corresponding NewLead, NewOpportunity, NewAccount, Contact or NewQuote fields | shared forms; no copied business logic | same services as §§3–5; Commons activity service | Commons quick create |

The panel delegates to the existing host form definitions; it does not persist partial records
merely because the drawer opens. Selected customer/opportunity is a suggested, revalidated context.
**Needs:** SAL-SHELL, SAL-COLLAB.

Current financial readers used by these mounts are
`mantle.account.InvoiceServices.get#InvoiceFinanceDetail` and
`mantle.account.CustomerFinanceServices.get#CustomerFinance`. Invoice creation from the order
uses `mantle.account.InvoiceServices.create#InvoiceFromSource` with the finance permission,
source eligibility and duplicate guards.

**Source:** research §§1, 8; Commons quick-create contract and the source forms in §§3–5.

## 13. Automation and operations

### 13.1 Existing rules and their disposition

These IDs/files are verified in current Mantle. A proposed extension belongs to Mantle and is
scoped by effective Sales policy/record purpose; plain Mantle behavior stays compatible.
Financial changes follow Accounting's existing flags and contracts rather than introducing
Sales-specific copies of those flags.

| Rule / job | Disposition for Sales | Owner and guard |
| --- | --- | --- |
| OrderPlacedAutoApprove — service/OrderReturn.secas.xml | Keep. It calls `autoApprove#Order`, which approves no sales part whose seller has the SalesPolicy approval setting on; the same holds for that service's other callers (`authorize#OrderPayments` from OrderPlacedAuthorizePayments, the delayed-approval job, the credit hold's release). With the setting off, a Sales pre-approval warning on `check#OrderPreApprove` stops it as the credit and purchase-approval warnings do, as built; with it on no automatic approval is left to stop and the warnings are shown to the approver only | The setting, checked in `autoApprove#Order` and the sales direction of `approve#Order` (§1.1); off by default, so a seller without it approves as today |
| OrderPreApproveCredit — service/AccountingCredit.secas.xml | Keep as built: it adds the credit warning on `check#OrderPreApprove` for the automatic path; the manual `approve#Order` calls the credit check itself | Accounting credit (D7); a RecurringTemplate base is left out of `CreditOpenOrderSum` (X5) |
| OrderPlacedReserveAssets, OrderApprovedReserveAssets — service/ProductAsset.secas.xml | Keep normal native-order reservation; behind a CX-AUTOMATION flag skip a RecurringTemplate base (X5); unplaced quotes never reserve | Native stock rules; do not reserve twice in Q |
| OrderItemCreateCheckReserve, OrderItemUpdateCheckReserve — same file | Keep, with the same RecurringTemplate guard | Native reservations and guarded commercial changes |
| OrderItemHandleChange — entity/Order.eecas.xml | Keep totals and revision; audit coverage and issued-line retention extended | Item changes are commercial and advance the revision, invalidating offer approval and access; Q/C never reset to Placed just to rerun effects |
| OrderPartHandleChange — entity/Order.eecas.xml | Conditioned (X2): behind a CX-AUTOMATION flag a status-only OrderPart update no longer increments the revision; major changes and other part edits still do | Mantle; so `propose#Order`, a hold and placement do not invalidate the offer they act on |
| OrderContentRevision, OrderNoteRevision — entity/Order.eecas.xml | Conditioned (X2): behind the same flag they stop incrementing | Storing the issued PDF, a RecordFiles upload or a note no longer invalidates the issue or approval |
| OrderPartPartyRevision, OrderPartContactMechRevision, OrderPartTermRevision — entity/Order.eecas.xml | Keep: parties, addresses and terms are commercial | They advance the revision Sales issue, approval and the shared change proposal bind to |
| OrderPlacedAuthorizePayments — service/AccountingPayment.secas.xml | Keep for eligible native payment records; a renewal clones with `copyPayment=false`, so it finds no copied Promised payment (X5) | Accounting; public quote response adds no card/gateway fields or implicit recurring consent |
| OrderPlacedSendEmail, OrderApprovedSendEmail — service/OrderReturn.secas.xml | Keep for store orders. Without a store `send#OrderStoreEmail` returns, so these are a no-op; the storeless placed/approved confirmation is Q.send#OrderConfirmation, a source of the Comms delivery ledger (X1, X8). Skip a RecurringTemplate base (X5) | Store and storeless delivery share event/revision/recipient identity; quote issuance and placed confirmation are distinct events |
| OrderApprovedNotify — same file | Keep existing priority notification | Do not use it as acceptance or as a second approval decision |
| OrderPlacedRecordAttribution (proposed, Marketing) | New (X10): a tx-commit SECA on order placement calls Marketing's `record#OrderAttribution`; it runs for Sales acceptance and direct orders as for Shop checkout | Marketing owns the service; a failure is logged and leaves the order and acceptance intact |
| ShipmentOutgoingPackedCreateInvoices — service/AccountingInvoice.secas.xml | Keep under Accounting's configured pack/ship policy | Sales reads the resulting invoice; changes use Accounting's draft-release contract and cannot invoice the same source twice |
| ShipmentShippedFinalizeInvoices — service/AccountingInvoice.secas.xml | Keep, conditioned by Accounting's pack/ship policy (D3, including `salesInvoiceFinalizedAtShip`) | Accounting; a Sales change between pack and ship waits on the draft-release contract (§6) |
| InvoiceFinalizedSendEmail — same file | Keep Accounting's invoice-delivery deduplication | Sales quote email does not replace invoice sending |
| OrderApprovedFulfillSubscriptions — service/ProductSubscription.secas.xml | Retain native fulfillment for existing policies; condition paid-access/recurring-template paths as specified by Commerce/Shop | Billing/access owner; approval alone cannot activate a template or extend paid access before required settlement |
| create_RecurringOrders — data/MantleSetupData.xml | Keep one job; Sales extends its due/end/pause/retry guards and recurrence fields (X5) | Native bases through the existing worker with `copyPayment=false`; StoreRecurringContract bases dispatch once to Shop's occurrence coordinator; Accounting monitors |
| RequestTriageNotice — entity/Request.eecas.xml; WorkEffortRequestFromWork — entity/Work.eecas.xml | Type-guarded (D23, CX-REQUEST): an RqtQuote request is not triaged or completed from linked work unless it is in a service queue | Crosscut request policy; an RFQ is completed by its own quote outcome |
| EmailMessageFiling — entity/EmailMessage.eecas.xml | Keep: quote mail sent from Compose or by template is filed on the order and the opportunity by the account's filing policy | Comms; no second filing path in Q |
| ShipmentShippedSendEmail, ShipmentDeliveredSentEmail — service/Shipment.secas.xml | Keep shipment notices | Warehouse; Sales displays delivery state without resending automatically |

Native order rejection/cancellation, inventory and ledger side effects remain under their existing
services. Response or change orchestration never manually writes their results as a substitute.

### 13.2 Jobs and recovery

Use existing ServiceJobs for configured quote-expiry reminders, agreement expiry/follow-up and
recurrence. Every Sales send that is not a rep's own Compose (reminders, QuoteBatch, the storeless
confirmation) is a source of the one Comms delivery ledger (X8): it records the event, recipient,
channel and template key, and the ledger owns retry, the uncertain outcome and the receipt, on
`send#EmailTemplate` and the SystemMessage retry jobs. Reminder policy is off initially. When
enabled, each recipient/issue/reminder interval is deduplicated by its ledger key, checked for
current consent/contact policy and suppressed after response/revocation. Transactional quote mail
and marketing subscription are distinct.

After source commit, delivery/index failures log record/job identity and remain retryable without
undoing a successful test/acceptance/change. Setup readiness shows failed jobs, unavailable public app,
unconfigured templates and unresolved policy. The shipped alert templates (§8) tell a manager when
quotes are about to expire unsent or unanswered and when deals stall; the jobs' `operation` marks
give their duration and failures to the framework dashboards. Operator queues identify the record, failed step,
last attempt and next action; no silent “sent” or “renewed” state. Retention/redaction follows the
suite's contact, file and communication controls; avoid logging bearer tokens or whole private PDFs.

## 14. Coverage and acceptance

### 14.1 Research disposition

| Research area / candidate | Designed disposition |
| --- | --- |
| §1 home/pipeline | Home plus one Opportunities dataset with board/list/calendar (§3); funnel panel now and charts in §8; generic pivot/graph extension SAL-ANALYTICS |
| §2 leads/conversion/dedupe | Leads and OpportunityDetail (§3), Commons duplicate review (§4); intake service with fixed-queue routing in S1 and the one public lead page in Marketing (§§3, 11); rule-based routing later |
| §3 opportunities | Record, team/contact roles, competitors, explicit outcome, document roll-up and collaboration (§3) |
| §4 accounts/contacts | Accounts, Commons contacts, Customer360 sales context and MergeAccounts (§4) |
| §5 quotations/product selection/pricing | Shared OrderDetail quote context, templates, guarded discount/approval, send/history/accept (§5); variants/bundles use Products; advanced optional configuration/costing/extraction (§11) |
| §6 orders/fulfillment | Shared order actions, source progress and domain handoffs; Sales commercial changes settle Customer Service D9 (§6) |
| §7 agreements/subscriptions | Dated sales agreements, customer/agreement prices, native recurrence and subscription source view (§7); advanced schedule/rental/recognition boundaries (§11) |
| §8 activities | Commons WorkEffort activities, Calendar/Today, Chatter and typed host files (§§3, 12); no Sales-specific call/chat/mail client |
| §9 reports/targets/commissions | Existing summaries/analysis, forecasts, pipeline/outcomes/targets (§8); commissions with People/Accounting handoff (§11) |
| §10 configuration | Stages, team parties, DataSource rows, targets, types/reasons, defaults and approval policies (§9); territory/assignment/intake (§11) |
| §11 shared surfaces | Context contracts §§4–7, 12; independent PASS Sales (§10); original owners retained |
| §12 baseline and §13 open questions | Current-source boundary, mappings below, needs and Decided tables; no research-era missing-pricing or revision-clone assumption retained |

### 14.2 Baseline forms and service coverage

Inventory mappings are additive **Designed in** entries. Existing **Implemented in** cells stay
unchanged. Public pages use `PASS:Sales/...`. New service packages are not added as existing services.

| Baseline | Sales destination and disposition |
| --- | --- |
| Customer/FindCustomer person, organization, account, contact, search/list; CustomerData | Accounts and Contacts; individual customers retained; same source-guarded creation (§4) |
| Party/EditParty identity, contact purposes, sales-account/contact/hierarchy, roles/classifications, notes/content | Customer360/ContactDetail and Commons shared forms with restricted capabilities; account security, group assignment and type conversion are not Sales features |
| Party/EditParty/FindDuplicates DupPartyList | MergeAccounts, a Sales mount of Commons Duplicates; guards inside `merge#Parties` (X15) |
| Party/FinancialInfo customer orders, invoices and receipts | Customer360 with finance view; payable/supplier rows remain Purchasing/Accounting |
| Party/PartyAgreements find/create/header/terms/items/content | Agreements/AgreementDetail with dated lifecycle and price mounts |
| Order/FindOrder sales create/list/approve/close | Quotes or Orders as appropriate; purchase creation remains Purchasing |
| Order/OrderDetail header/parts/items/quick items, promo codes, history, recurrence and communication/content | One Sales/Orders/OrderDetail with context-dependent action set; RecurringOrders exposes the same recurrence contract |
| Order/ItemReserve, OrderDetail shipment/payment/gateway forms | Shared OrderDetail only under borrowed Warehouse/Accounting rights; no automatic grants from Sales entry |
| Order/ReturnItem | Hand off to Customer Service return authorization; Sales has no return editor |
| Request find/edit/items/parties/tasks/notes/content | QuoteRequests/QuoteRequestDetail; common RequestDetail forms and guarded RqtQuote context |
| Request EditUsers/EditWikiPages | Existing request participant forms stay on QuoteRequestDetail; linked wiki editing stays in Commons |
| Accounting/Reports SalesSummary/SalesAnalysis | Existing Sales report routes, extended service-level access and explicit measurement basis (§8); Sales owns the SalesAnalysis catalog entry and Accounting mounts it (Z10) |
| Catalog/Product/EditPrices | Products-owned customer/agreement price forms mounted as CustomerPrices (§7) |

Moqui Sales is reference material, not a baseline: its unmounted QVue screens,
SalesOpportunityNote and placeholder quote controls are not copied. No existing business data is
deleted to make the new navigation fit.
OrderDetail's ItemLimitForm becomes the native paginated item list's page-size control. Duplicate
deal suggestions open the existing opportunity; first-release destructive merge is limited to the
guarded party merge. A duplicate deal can be explicitly closed with a duplicate reason and a
Chatter link to the surviving deal, preserving each record's history and audience.

### 14.3 Implementation acceptance scenarios

Each scenario is an acceptance test to write (`test/acceptance/Sales/`, `test/acceptance/client/Sales/`), named in the
implementation plan; the rules it relies on get their own regression tests. No route fixtures: a screen sweep is an
acceptance test, one per app per mode.

1. A rep creates a lead without a customer account, finds an existing contact during qualification
   and preserves one salesOpportunityId, attribution, activities and files. Retry creates no second
   account/deal. A stale conversion and a cross-organization account selection are refused.
2. Move a deal through board, row action and TUI with identical validation. Manual probability
   survives stage moves; Stage mode follows defaults. A lost deal requires a reason; reopening
   retains history. Accepted linked quotes suggest Won but leave the decision to the rep.
3. A team member loses future access when dated membership ends; managers still see their scoped
   queue. Lists, search, selected-value choices, counts, exports, Chatter and files agree on access.
4. Create a customer-priced and an agreement-priced quote without a ProductStore. Explain the same
   amount as Products, keep provenance, distinguish unavailable and zero prices, and omit cost data
   from an ordinary rep/public response. Expired/inactive agreements cannot authorize a new price.
   The storeless quote is taxed through the seller's tax gateway, retaxed on every line change,
   the invoice made from the accepted order carries that tax, and placement sends one storeless
   confirmation through the delivery ledger (X1).
5. Apply a template, change its published successor, and show that the earlier quote's terms/PDF
   remain unchanged. An override triggers the configured approver; a self-approval or stale decision
   fails. Direct service calls cannot bypass the guard.
6. Send an offer to two recipients, fail one delivery, retry only that result and preserve one issued
   revision/PDF. Storing the PDF, adding a note or file and proposing do not change the bound
   revision; revising terms invalidates old response authority while retaining historical print.
7. Accept the current quote through PASS and staff paths. Concurrent/double submits produce one
   response and native order; a conflicting decline or stale/expired/revoked issue is refused.
   A decline cancels the quote through Cancel Quote with the reason recorded. An accepted
   credit-held order reports acceptance plus pending processing, not a false failure; an accepted
   net-terms order waits in Awaiting approval, and a manual approve runs the credit and Sales checks.
8. A bearer can view only the issued quote and receipt, or the one linked order; changing
   customer/order/site/organization IDs, using another capability or accessing arbitrary files
   yields no data. Signed-in list access requires the correct contact relationship or the self
   relationship. Run the same contract locally and through remote PASS.
9. Partially fulfill/invoice an order; remaining quantities and source links reconcile. Submit a
   commercial change from Customer Service and apply it in Sales. Concurrent picking, shipment,
   expired approval, another hold and finalized billing produce the specified conflict or owning
   workflow, with no deleted stock/financial history.
10. Activate an agreement with prices/terms, end it prospectively, and retain historical orders
    and already paid access. The recurring base never reserves/ships/invoices; duplicate due jobs
    produce one child. A failed customer recurrence leaves other bases running; a Shop-linked base
    enters only its occurrence coordinator.
11. Reconcile forecast drill-down to weighted open deals and targets by period/currency, including
    manual probability, missing estimates, zero quota, team changes, reopenings and parent/child
    totals. Order, invoice and won-deal bases are separately labelled and never added together.
12. Walk creation→RFQ→quote→approval→send→accept→order→shipment/invoice with a user holding only
    necessary grants. Verify phone overflow at 390 px, readable lists, TUI alternatives, one primary
    action and partial-failure states. Preserve existing Projects/Accounting shared-record behavior.
13. A public lead form submission, an intake-address mail and a voicemail "Create lead" each make
    one lead in the named team queue, with the UTM-mapped source; a repeated submission makes no
    second lead, and an unverified unqualified intake is purged after its retention period.

Specs live with each owner: Mantle rules and authorization, BOSS screens and providers, and PASS
public and remote contracts. Every permission-negative case reuses valid positive-case parameters.

## 15. Delivery stages

| Stage | Deliverable | Gate |
| --- | --- | --- |
| S1 — CRM foundation | Scoped root/context with the X12 organization filter; account/contact reuse; pipeline/leads/opportunity lifecycle, team/stage/source settings with the UTM map, activities/files; the lead intake service with fixed-queue routing and the `createLead` mail action, which Marketing's first release calls; Comms hooks, Assist skills and the pipeline funnel | Permission/organization isolation, conversion identity, intake replay and purge, source preservation, board/list/TUI equivalence; complete SAL-ACCESS/CRM/ACCOUNTS/COLLAB/SHELL/ASSIST foundations |
| S2 — Quote to order | RFQs with the `createQuoteRequest` mail action, native quote editor, fixed templates, pricing/discount approval, audited issuance/history, staff and PASS acceptance, storeless tax and confirmation | Mantle X1 tax fallback, X2 narrowed revision, X3 decline and X4 approval in place; native side-effect audit; no-store quote; stale/expired/revoked/concurrent response tests; registered PASS local/remote operations; shared OrderDetail preserves existing consumers; the confirmation waits on the Comms delivery ledger (X8) |
| S3 — Sales operations | Commercial changes, fulfillment/finance handoffs, agreements on the AgmSt* seed, recurrence with the RecurringTemplate marker, the Commerce Subscriptions mount, PASS CustomerOrders/CustomerOrder, forecast with recurring revenue, targets and core reports with shipped definitions | Cross-app source locks and conflicts, recurrence ownership (X5), currency/cohort reconciliation and complete end-to-end walks |
| Later | §11 named capabilities and generic analytical view widgets | Each screen's owner/prerequisite gate; no hidden placeholder menu |

S1–S3 together are the initial Sales release, including public quote acceptance. Development may
overlap independent areas, but root grants and public publication enable only usable flows.
Sales can run without Shop; the store-backed subscription extension remains dependent on its owner.

Adoption is a scoped preview: identify organization/owner associations, classify lead/opportunity
and draft-quote intent, map existing stages and agreement statuses, show missing/ambiguous records,
then apply approved mappings. Do not infer won/lost solely from an arbitrary stage name, reclassify
all OrderOpen rows as quotes, or expose historical records with unresolved ownership. Existing
orders stay valid under their native services until explicitly adopted. Existing estimates keep
Projects' lifecycle. Add audit coverage before new issuance; old documents lacking history retain
their original evidence and cannot claim a reconstructed exact revision.

## 16. Documents and outputs

| Output | Kind | From screen | Derived from |
| --- | --- | --- | --- |
| Quote / order | html-print/PDF | OrderDetail | baseline Order/PrintOrder and organization OrgTemplateOrderPrint setting; as-of revision plus stored issuance PDF; print header with a QR of the PASS quote or order link (`ec.resource.barcodeSvg('QR', …)`) |
| Quote proposal and response receipt | email/PDF | OrderDetail, CustomerQuote, QuoteResponse | Comms Compose from the rep's account, or registered EmailTemplate through `send#EmailTemplate` on the delivery ledger for batch and reminders; `fancy-locked-html` text; public-safe terms and exact issued content |
| Storeless order confirmation | email | OrderDetail (on place/approve) | Q.send#OrderConfirmation with the SalesDefaults confirmation template, a delivery-ledger source (X1, X8); store orders keep `OrderPlacedSendEmail`/`OrderApprovedSendEmail` |
| Weekly pipeline/forecast digest; quote-expiring and deal-stalled alerts | scheduled report (PDF/CSV); alert | Reports, Forecast | shipped pipeline dataset and alert-rule templates (L6) |
| RFQ acknowledgement/decline | email/PDF | QuoteRequestDetail | shared request content and registered templates |
| Agreement / amendment | html-print/PDF | AgreementDetail, later ContractSchedules | Agreement text/terms/items and stored approved content |
| Change confirmation | html-print/PDF/email | OrderChangeDetail | shared before/after, decision and applied native order; no internal cost data |
| Pipeline / forecasts / reports | authorized CSV/XLSX, html-print | Opportunities, Forecast, Reports | shared export/renderers over the same filtered service results; currency/UOM and date basis retained |
| Account/contact import | previewed existing import workflow | Accounts/Contacts | Commons party import; existing identity/organization/duplicate guards, no unreviewed mass merge |
| Lead/opportunity import | Shared/DataImport with Admin §11's `opportunities` target (Z2) | Leads/Opportunities | proposed O.validate#OpportunityImportRow, O.apply#OpportunityImportRow as the rows-mode target's row services, using the same create/update/qualification services; explicit ID/source and field mapping; run under `SALES_IMPORT` with the target's Sales permissions (§3) |
| Price import | owner-provided preview/import | CustomerPrices/PriceLists | Products' existing price import contract and permissions |
| Expiry/renewal reminders | configured email/activity | Quote/Agreement/RecurringOrders | existing jobs and registered templates on the Comms delivery ledger; effective policy, per-recipient deduplication |

Imports run on their source list or in Shared/DataImport, never through unrestricted entity endpoints.
The opportunity import steps select file/source, map type/party/stage/amount/currency/date fields,
preview matches/errors and confirm valid rows with operation identities. Unknown currency,
organization, party or stage is an explicit row error. No default generates arbitrary accounts.
New import form fields are file, source namespace, column mapping, duplicate strategy (skip/update
matched authorized ID), preview token, selected valid rows and confirmation; audit retains source
row identity. Attachments are scanned through existing file/media handling.

## 17. Framework and data needs

All additions below are **proposed** unless marked existing. This is the Sales-owned register,
indexed by crosscut §7.8; exact primitive types/complete auto-parameters follow current Mantle
entities. A new identity is justified only for a separate business fact, not a snapshot of another
record. Cross-app Mantle changes Sales depends on are crosscut needs, cited where used: CX-PRICING
(X1 storeless tax), CX-AUTOMATION and CX-ORDER-AUTHORITY (X2 revision, X4 approval), CX-ORDER-HOLD
(X4 seed), CX-RECURRING (X5), CX-DELIVERY (X8), CX-ORG-SCOPE (X12) and the stack contracts of
crosscut §1.5.

| Need | Kind | Proposed as | Used by | Stub spec |
| --- | --- | --- | --- | --- |
| SAL-ACCESS | service type, seed data, data model | Mantle permission/organization/assignment checks; ironstone.sales.ContextServices; BOSS group mappings; `SalesOpportunity.organizationPartyId` and filter rows (X12); X4 permission mapping; `SALES_IMPORT` | every surface | Distinct read/edit/approval/finance rights; organization from native parties/parts; the denormalized, audit-logged opportunity organization kept equal to the effective role row; `MANTLE_USER_ORG` and `MANTLE_ACTIVE_ORG` rows for SalesOpportunity, SalesForecast and Agreement; BOSS_SALES_APPROVE gets `SALES_ORDER_APPROVE` and `ORDER_APPROVE`, BOSS_SALES_CHANGE `ORDER_CHANGE_HOLD_RELEASE`, BOSS_SALES_MANAGER `SALES_IMPORT` (the `opportunities` target's permission beside `SALES_OPPORTUNITY_EDIT` and `SALES_TEAM_MANAGE`, no `ADMIN_*`); shared mounts and public services cannot add authority; guard existing AccountServices and report entrypoints |
| SAL-CRM | data model, seed data, service type | OpportunityServices; SalesPipeline; extend SalesOpportunity and SalesOpportunityStage; SalesLeadIntake; lead-source mapping; existing Party roles/relationships | §§3, 9, 11, 12 | Opportunity gets outcome status, lostReasonEnumId, conversion/close time and actor evidence, probabilityMode, pipelineId, `recurringAmount` and a recurring-plan Enumeration (enumCode = months; SAL-R03); lifecycle fields audit-logged. Stage adds pipeline, fold and effective applicability. Internal organization/owner/team/contact use dated SalesOpportunityParty roles. Source choice is DataSource with effective org binding, not an enum ID masquerading as dataSourceId. SalesLeadIntake: intake ID, lead, source kind and ID (form response, email message, communication event, staff), submitted name/organization/email/phone, verification state, received and purge dates, operation key. `store#LeadIntake` in S1 with duplicate policy and fixed-queue routing (X16). Lead-source mapping: organization, UTM source, optional medium, DataSource, from/thru (X10). A registered privacy provider for leads, intake records, opportunities and quote responses (X15) |
| SAL-ACCOUNTS | service type | Extend existing AccountServices/party APIs with scope; SalesWorkspaceServices projections; Commons Duplicates mount | §4 | Reuse Party identity/contact mechanisms; assign owner organization; safe hierarchy/contact links; merge guards live in Mantle `merge#Parties` (Commons-owned, X15), not in Sales; no duplicate customer master |
| SAL-COLLAB | data model, service type, seed data | SalesOpportunityContent; existing host registry, Chatter/RecordFiles, generic record joins | opportunities, agreements, quotes | Single-field opportunity host key; content ID/type/location/dates using existing Content conventions; per-host access in search, followers, activities and files; no parallel note/activity tables |
| SAL-QUOTE | data model, service type, seed data | SalesQuoteServices; OrderHeader purpose marker; SalesQuoteIssue and SalesQuoteResponse | §§5–6, 10 | Proposed `orderPurposeEnumId` with seeded SalesQuote, SalesOrder, SalesQuoteTemplate (SAL-TEMPLATE) and RecurringTemplate values distinguishes them from unclassified legacy drafts and other owners (X5 reads RecurringTemplate). Issue is an issuance fact: ID, order and commercial revision (X2), seller/customer, issue time, validity, issuer, PDF content and terms references, revocation/supersession; no copied item ledger. Response is customer action evidence: ID, issue, action (accept, decline)/time, reason, actor/contact/capability, PO, acknowledgement/evidence, resulting order and operation key; a decline cancels through `cancel#Order` (X3). At most one effective response per issue; resending same issue is recipient delivery, not another issuance. `send#OrderConfirmation` for storeless orders as a delivery-ledger source (X1, X8) |
| SAL-TEMPLATE | seed data, service type | The order purpose value `OrpSalesQuoteTemplate` on OrderHeader, OrderPart and OrderItem; Q.find#QuoteTemplates, store#QuoteTemplate, publish#QuoteTemplate, preview#QuoteTemplate; no SalesQuoteTemplate table (impl-sales §4) | QuoteTemplates/Detail | An order that is never placed and never leaves Open; organization-scoped name/description, validity and template/terms defaults on the header and part; lines as order items; the published interval is the part's validity dates, a published template immutable by dated successor; copied into a quote with `clone#Order` (`copyPayment=false`) and priced as of the quote's date; left out by every reader that leaves out `OrpRecurringTemplate`, so no native order side effects; template and terms text rendered with the built `fancy-locked-html` (L9) |
| SAL-APPROVAL | data model, service type, seed data | SalesPolicy/SalesApprovalPolicy; extend OrderDecision/OrderDecisionReason; the seller's approval setting in `autoApprove#Order` and the sales direction of `approve#Order`; Sales' pre-approval warnings on `check#OrderPreApprove` | quotes, order transitions, settings, inbox | Effective policy and threshold/purpose; decisions record order revision, policy/time and purpose; stale decisions invalidated; explicit manual override provenance on OrderItem; with the setting on no sales order of the seller is auto-approved, whichever app placed it, and each waits for `SALES_ORDER_APPROVE`; off by default; Sales' warnings block auto-approval as the built ones do and, with the setting on, are shown to the approver only and refuse nothing; the acceptance threshold per currency, unset by default |
| SAL-CHANGE | service type, data model | Shared mantle.order.OrderChangeServices over Customer Service's existing proposed Request/RequestItem/OrderChangeDecision contract | §6; Customer Service | Same shared screen/proposal; Sales commercial kinds, Customer Service cancel/substitute kinds; exact source/proposal revisions, consent, stock/finance impact and atomic apply; no new change/application ledger |
| SAL-AGREEMENT | data model, service type | SalesAgreementServices; existing Agreement family and ProductPrice; the AgmSt* status seed of PUR-AGREEMENT (X13) | §7 | Adopt Purchasing's AgmStDraft/Active/Expired/Closed/Cancelled flow, seeded once in Mantle; validated parties/type/dates and acceptance evidence, dated successor/association, participant dating where absent; reuse implemented agreement pricing and extend lifecycle eligibility in its canonical guard |
| SAL-RECURRENCE | data model, service type | Extend native recurrence guards/settings and worker; SalesAgreementServices reads; Commerce Subscriptions mount | RecurringOrders/Subscriptions | RecurringTemplate purpose on the base (CX-RECURRING exclusions); explicit timezone, start/end/pause and occurrence identity using shared operation convention; renewals with `copyPayment=false` and payment only by the Accounting attempt with recorded consent; base excluded from fulfillment; Sales owns guards and fields, Shop dispatch, Accounting monitoring; no duplicate order/invoice/access |
| SAL-FORECAST | data model, service type | ForecastServices over SalesForecast/Detail with target-basis metadata | Forecast/Targets/reports | Unique scoped key and parent roll-up; decimal percent/amount, explicit currency/basis/cohort, audit dates; open and won monthly recurring revenue as its own measure; actual source attribution and exclusions; no additive parent/child double count |
| SAL-REPORT | service type, seed data | Guard/extend current SalesReportServices and SalesWorkspaceServices; shipped `report/*.json` pipeline dataset, dashboard and alert templates; registry metrics `Sales.Orders` and `Sales.OrderValue`; Insights catalog registration | Home/Reports/Customer360 | Same authorized filters for measures, drill-down/export; precise native date/status basis; the order metrics exclude OrderOpen, OrderProposed and RecurringTemplate (X11); SalesAnalysis owned here and mounted by Accounting (Z10); "quote expiring" and "deal stalled" alert templates and a weekly digest schedule; `operation`/`operation-ref` on QuoteBatch, import and the recurrence guard (L6); source links and missing-data states; restricted costs omitted |
| SAL-PORTAL | service type, seed data, data model | PASS Sales registration/operations; SalesPortalServices; extend ExternalAccessServices (customer-direction `SalesOrder` record kind, `sales` app kind, self relationship, X6) and PostingOperation public identity binding | §10 | Organization-targeted local/remote app; issued-revision capability, narrow safe quote and order projections/files (CustomerOrders/CustomerOrder, SAL-R01), immutable response evidence, expiry/revocation, conflict-safe replay; a Quotes and Orders card in the PASS Account hub; no BOSS or store dependency |
| SAL-SHELL | shell item, service type, seed data | Existing palette/quick-create/Today/approval provider contracts; Comms providers | Home/QuickCreate/record screens; Comms | Context, same-app links, scoped search and counts; palette rows carry `recordEntity`/`recordId`; SalesQuoteApproval topic seeded in Mantle (impl-sales F26) with a lock-screen-safe push title; `record-lookup`, `create-from` (Lead, QuoteRequest), `ext-action`s in the chat, message, voicemail and call slots, and `call-context` with the caller's open opportunities and quotes (L8) |
| SAL-ASSIST | seed data, tool | mr-boss `skill/` Sales skills, `skill/aliases.json` and `test/skill-retrieval.json`; `assist-prompt` and `response-action` in the Sales root `shell-providers`; `AgentToolExposure` rows (L1) | OpportunityDetail, OrderDetail, Customer360 | Skills qualify-lead, issue-quote, follow-up, log-call; prompt chips per §1.4; exposure only for O.create/move/close#Opportunity and Q.preview/send#Quote, mutating verbs behind Assist approval and `exposeMcp` N; read verbs O.find#Opportunities and Q.find#Quotes `exposeMcp` Y; depends on the Mantle active-organization user-facts provider |
| SAL-SYNC | protocol server, service type | A read-only projected address-book kind in `mantle.party.ContactDavServices.get#DavCollections`, answered by a SalesWorkspaceServices provider (L2) | §4 Contacts | "My accounts" collection of the contacts of the accounts a rep may see, computed per request with Sales scope; device writes refused; no copied ContactBook rows |
| SAL-MAIL-INTAKE | seed data | `EmailRuleAction` enumerations `createLead` (optionValue O.store#LeadIntake) and `createQuoteRequest` (Q.create#QuoteRequest) (L3) | §§3, 5 | Reached by plus-tag intake addresses; the message is the intake source and its files are linked as evidence; one lead or request per message ID |
| SAL-ANALYTICS | XML Form element, service type | The built framework funnel panel and `report-embed` now; later generic view-pivot/view-graph extension | PipelineAnalysis/Reports/Home | Funnel and stage chart through `report-embed` over the shipped pipeline dataset in the first release; later a server-aggregated authorized pivot with declared measures/dimensions, bounded query and source drill-down; native list/table and TUI fallback; framework widget work follows style-guide §8.1 |
| SAL-LATER | data model, service type, seed data | Named §11 domain extensions | later screens | Territory/routing, extraction over `run#Extract`, configuration/costing, commission earning facts handed to a People PayrollInputSource type `SalesCommission` or Accounting payable intake (X16), and contract/rental coordination; gates and owning ledger/custody services in §11 |

**Audit and adoption detail.** Audit all keys needed to reconstruct issued terms: header revision/
purpose/currency, part parties/addresses/terms/validity, item product/quantity/UOM/amount/tax/
provenance, required dates and template/discount references. Retain issued line structure; a
revision ends/cancels earlier issued lines rather than physically deleting the only historical
source. The stored PDF is the exact delivered evidence; current header fields alone cannot
reprint an old offer. Adoption adds no fabricated historical audit rows.

Existing OrderHeader/OrderPart/OrderItem, Agreement, ProductPrice/List/Rule, Subscription,
SalesForecast and shared record/communication joins remain authoritative. SalesQuoteIssue and
SalesQuoteResponse have identity because issuance and customer response are distinct events;
they are not alternative quote/order or revision tables. Approval and response are also distinct:
one is internal authority, the other a customer's action. Where a proposed issue references a
revision, the source data is read as-of through the audit log with its stored PDF.

## 18. Decided

| Decision | Notes |
| --- | --- |
| Full design, phased delivery | Every research candidate is owned, merged or staged. S1–S3 are the initial release; §11 specifies later screens and gates |
| Lead model — research open question | One SalesOpportunity with type discriminator; qualification preserves identity and joins; no separate Lead master |
| Opportunity outcome — research open question | Explicit outcome/status and required lost reason, independent of stage; rep confirms Won even after quote acceptance |
| Quote revisions — research open question | Audit history, native revision/time and stored PDF; clones are separate documents, not historical versions |
| Customer prices — research open question | Both customer rows and negotiated agreement prices, resolved by Products' existing canonical resolver |
| Teams/territories — research open question | Team parties/dated relationships now; territory is later classification/routing, not a competing party identity |
| Quote portal — research open question | Independent organization-scoped PASS Sales in initial scope; no Shop or BOSS runtime prerequisite |
| Native quote/order document | Shared OrderDetail and native lifecycle; explicit purpose distinguishes quotes from carts and recurring bases |
| Customer response versus internal approval | Same source-bound acceptance service for staff and PASS; native approval, credit, stock and payment rules still apply |
| Order owner | Sales applies commercial price/quantity/date/address/method/carrier proposals through shared OrderChangeServices; Customer Service keeps its existing narrower apply kinds |
| Reuse current implementation | Agreement pricing, XML views, activity links, Accounting guard/operation/capability services are existing foundations; Sales-specific extensions are labelled |
| Shared configuration/screens | Products owns price editors, Commons collaboration, Projects request/task, Accounting finance and Warehouse stock; Sales owns customer agreement and CRM definitions |
| Forecast basis | Separate calculated weighted open pipeline, entered forecast/best case, won outcomes and native order/invoice actuals, per currency and stated cohort |
| Recurrence and subscriptions | Native recurring worker, one dispatch owner per base; Commerce/Shop contract/entitlement machinery for store-backed subscriptions; no local billing ledger. Refined by X5 below |
| Excluded baseline administration | Party user/group/password/type-conversion and supplier/payable/return execution stay with their owning apps; Sales has no editors for them |
| Framework scope | Use existing XML list/board/calendar/chart and TUI facilities and the built funnel panel with `report-embed`; generic pivot/graph is later, not a prerequisite for initial reporting |
| Delivery evidence | Publication/acceptance and send outcomes are separate; retry does not repeat placement, charge, invoice or customer response |
| Storeless order effects (Nov 1, 2026; review X1) | Mantle `calculate#OrderSalesTax` resolves its gateway as `SalesTax.js` `gateway()` does, falling back to `PartyAcctgPreference.taxGatewayConfigId`; `handle#OrderMajorChange` runs its tax step without a store; promotions stay store-only; Sales owns the storeless placed/approved confirmation, `send#OrderConfirmation`, over the delivery ledger. No organization default store (§5) |
| Commercial revision (Nov 1, 2026; review X2) | Quote issue, approval, capabilities and the shared change proposal bind to the Mantle `orderRevision`, narrowed to commercial changes behind the built flag `PartyAcctgPreference.salesCommercialRevisionOnly`, off by default; a quote is issued only where the seller has it on, and no `get#OrderCommercialSnapshot` hash is built (§5; impl-sales §4, F9) |
| Quote decline and withdrawal (Nov 1, 2026; review X3) | `cancel#Order` through the existing Cancel Quote transition with the reason on SalesQuoteResponse; withdrawal adds SalesQuoteIssue revocation; no OrderProposed→OrderRejected transition (§5) |
| Approval and hold authority (Nov 1, 2026; review X4) | Per-hold-type release permissions through `enumCode` seed; direction-aware `approve#Order`; Sales maps `SALES_ORDER_APPROVE`, `ORDER_APPROVE` and `ORDER_CHANGE_HOLD_RELEASE` only (§1.1). Net-terms acceptances wait in BOSS_SALES_APPROVE's Awaiting approval queue, with an optional policy approval (R-SAL-10). Refined by the next row |
| The seller's approval setting (Nov 11, 2026; impl-sales §4) | SalesPolicy's approval setting, off by default, is respected globally: where it is on, no sales order of that seller is auto-approved on a payment authorization, whichever app placed it; it waits for a holder of `SALES_ORDER_APPROVE`. The rule is in `autoApprove#Order` and the sales direction of `approve#Order`. A pre-approval warning blocks auto-approval, as built, Sales' own as Accounting's credit warning and Purchasing's approval warning on `check#OrderPreApprove`; only with the setting on, when no auto-approval is left to block, are the warnings shown to the person approving in the UI only, without refusing that approval (the user's correction the same day). The net-terms "approve as the system" option applies only while the setting is off (§§1.1, 5, 6, 9, 13.1) |
| Recurring model (Nov 1, 2026; review X5) | RecurringTemplate value of `orderPurposeEnumId` marks bases for every exclusion; renewals clone with `copyPayment=false` and charge only through Accounting's attempt with recorded consent; Sales owns worker guards and recurrence fields, Shop dispatch, Accounting monitoring and auto-invoice; RecurringOrders is the one editor and Commerce Subscriptions is mounted with a Sales context (§7, R-SAL-13) |
| One customer account (Nov 1, 2026; review X6) | Customer-direction `SalesOrder` record kind, `sales` app kind and the self relationship in ExternalAccess `check`; PASS Account is the "My account" hub (§10) |
| One delivery ledger (Nov 1, 2026; review X8) | Storeless confirmations, reminders and QuoteBatch are sources of the Comms delivery ledger; no Sales delivery records (§13). Rep sends go through Comms Compose; jobs and batch through `send#EmailTemplate` (R-SAL-16) |
| Tracking and attribution (Nov 1, 2026; review X10) | Marketing's `OrderPlacedRecordAttribution` SECA records attribution on every placement, including Sales acceptance; Sales maps UTM source and medium to the lead's DataSource at intake (§§5, 9; R-SAL-15) |
| Metric owners (Nov 1, 2026; review X11) | Sales owns `Sales.Orders` and `Sales.OrderValue`; Accounting `Accounting.InvoicedRevenue`, Marketing visits and attribution, Insights the funnel (§8) |
| Organization scoping (Nov 1, 2026; review X12) | Denormalized, audited `SalesOpportunity.organizationPartyId` and filter rows for SalesOpportunity, SalesForecast and Agreement in both organization filter sets (§1.1) |
| Agreement states (Nov 1, 2026; review X13) | Sales adopts Purchasing's AgmSt* seed; two AgreementDetail screens by design; sharing their forms is Open (§7) |
| Identity hygiene (Nov 1, 2026; review X15) | Merge guards in Mantle `merge#Parties`; MergeAccounts mounts Commons Duplicates; Sales registers a privacy provider; one public lead page (Marketing SubmitForm) with Sales LeadIntake as its context; consent is read-only on Sales' ContactDetail (§§4, 11, 12; R-SAL-11) |
| Lead intake, form publication and commissions (Nov 1, 2026; review X16) | `mantle.sales.OpportunityServices.store#LeadIntake` ships in S1 with fixed-queue routing; inquirer details wait on SalesLeadIntake until qualification or verified email (R-SAL-17); lead forms use the Commons FormPublication; employee commission is a People PayrollInputSource type `SalesCommission`, partner commission goes to Accounting payable intake (§§3, 11; R-SAL-08, R-SAL-14) |
| Import (Nov 1, 2026; review Z2) | Lead/opportunity import is Admin §11's `opportunities` Shared/DataImport target, in rows mode with the O validate and apply row services; no Sales-only import wizard (§3) |
| Import permission (Nov 11, 2026; impl-sales §4) | Each app has an import permission of its own. Sales' is `SALES_IMPORT`, held by BOSS_SALES_MANAGER: the `opportunities` target asks it with `SALES_OPPORTUNITY_EDIT` and `SALES_TEAM_MANAGE`, and no `ADMIN_*` permission (§§1.1, 3) |
| Quote template as an order (Nov 11, 2026; impl-sales §4; R-SAL-12) | A template is an OrderHeader of purpose `OrpSalesQuoteTemplate`, never placed, published by its part's validity dates and copied with `clone#Order` (`copyPayment=false`); it reuses the line editor, pricing and print, and every reader that leaves out `OrpRecurringTemplate` leaves it out. No SalesQuoteTemplate table (§5, SAL-TEMPLATE) |
| Approval decisions (Nov 11, 2026; impl-sales §4) | A Sales approval decision extends the existing OrderDecision and OrderDecisionReason, on the rules Purchasing's approvals proved (revision binding, supersession, separation); no decision record on Purchasing's pattern is added (§5) |
| High-value acceptance (Nov 11, 2026; impl-sales §4) | Above a SalesDefaults threshold per currency, unset by default, a quote acceptance needs PASS sign-in as an invited contact; below it, or with none set, the bearer link suffices. A one-time code to a verified email is later (§§9, 10, 11) |
| Report owners (Nov 1, 2026; review Z10) | Sales owns the SalesAnalysis catalog entry; Accounting mounts it; Sales registers its reports with Insights (§8) |
| Stack contributions (Nov 1, 2026; review L1–L9) | Assist skills, prompts and gated tool exposure; Comms hooks; meetings as Events with a CallLink; projected CardDAV account contacts; `createLead`/`createQuoteRequest` mail intake; delivery-ledger sources; shipped report definitions and alerts; `fancy-locked-html` templates and `run#Extract` (§1.4) |
| Reference features (Nov 1, 2026; review §6) | Added: B2B order self-service in PASS Sales (SAL-R01, §10) and recurring revenue on opportunities (SAL-R03, §3). Later: lead response SLA (SAL-R05), activity plans (SAL-R06), partner channel (SAL-R07) (§11). Open: lead scoring, blanket orders, deal tags |

## 19. Open

Deployment data (organization thresholds, team membership, currencies, terms, branding, reminder
policies and public hosts) is set through the defined forms. The later capabilities in §11 keep
their named gates. These choices remain, each with the recommended answer. Items 2 (quote template
as an order) and 3 (high-value acceptance authentication) were decided on Nov 11, 2026 and are in
§18; the other items keep their numbers, which impl-sales cites.

1. **Storeless freight.** X1 settles tax, but without a store there is no carrier estimate.
   Recommend: freight on a storeless quote is an explicit shipping-charge line the rep enters,
   shown as its own line on the quote and taxed by the X1 path; a carrier rate lookup without a
   store waits for a Warehouse rating service.
4. **Commission earning basis (R-SAL-14 after X16).** Recommend paid invoice as the default basis
   (commission earned when the customer's invoice is paid), with order and invoice bases as
   explicit per-plan choices; reversals follow credits and refunds.
5. **Shared agreement forms (X13).** Recommend one set of header, parties, terms and items form
   definitions with a direction context, used by both the customer and supplier AgreementDetail
   screens, which keep their own action sets (prices for Sales, releases for Purchasing).
6. **B2B self-service scope (SAL-R01).** Designed read-only for S3. Recommend reorder ("copy to a
   new quote request") as a later action, and returns and cancellations through PASS Support (X7)
   rather than on the order page.
7. **Lead scoring (SAL-R02).** Recommend a later rules-based score on intake and qualification
   (source, completeness, engagement), with an optional `run#Classify` suggestion behind review;
   not first release.
8. **Customer blanket orders (SAL-R04).** Recommend reusing Purchasing's agreement release pattern
   on AgrSales items once PUR-AGREEMENT lands; later.
9. **Deal tags (SAL-R08).** Recommend one generic record-tag model owned by Commons for every app
   (no Mantle entity exists), with Marketing's campaign tags on the same model; later.
10. **Later stack leverage (R-SAL-L01, L04, L05, L06).** Recommend later rows: call and voicemail
    summaries with a next-step draft from `CallTranscript` through the LLM gateway; a public RFQ
    form generalized from RequestIntake; a prospect booking link over PublishedCalendar and
    `get#FreeBusy`; co-authored proposal narrative from a co-edited wiki page bound into the quote
    PDF.

