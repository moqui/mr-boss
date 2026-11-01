# IronStone BOSS — Sales design

Oct 31, 2026 — design specification; Sales application implementation remains future.

IronStone Sales serves representatives, account managers and sales managers: leads and opportunities,
accounts and contacts, requests for quote, quotations and orders, customer agreements and prices,
forecasts and sales reporting. An organization can use Sales without Commerce or a ProductStore.
Its customer quote pages form an independent **Sales app in IronStone PASS**, over the same Mantle
records, without a runtime dependency on BOSS.

**Inputs:** [sales research](research-sales.md), [initial decisions](initial-design.md),
[design guide](design-doc-guide.md), [style guide](style-guide.md),
[crosscut](design-crosscut.md), [Commons and Comms](design-drawers-commons.md),
[Projects](design-projects.md), [Products](design-products.md),
[Customer Service](design-customer-service.md), [Purchasing](design-purchasing.md),
[Warehouse](design-warehouse.md), [Accounting](design-accounting.md),
[Commerce](design-commerce.md), [Shop](../../mr-pass/plan/design-shop.md),
[PASS foundation](../../mr-pass/plan/design-forum.md),
[screen inventory](ss-inventory.md) and [service inventory](usl-inventory.md).
The [shared ground rules](impl-drawers-commons.md#4-ground-rules) and
[application practices](../../../../docs/dev/Practices-App-Dev.md) govern ownership,
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
patterns are attributed to the corresponding research section, not claims that those products'
current releases were re-researched. Current local XML and scripts govern implementation claims.
Service abbreviations in form tables are defined in §12.1; every abbreviated Sales service is
**proposed** unless explicitly marked existing.

**Current-source boundary.** The Sales root, section placeholders and SalesSummary/SalesAnalysis
screens exist; the root's grant is commented out. There is no implemented CRM or quote application.
`SalesEntities.xml` has opportunities, dated parties, stages, order/work/tracking joins and forecasts,
but no opportunity lifecycle services, seeded opportunity types or default stages.
`AccountServices.xml` supplies account/contact operations; their authentication and organization
guards must be extended before exposing them through Sales.
Agreement status items are still missing. Conversely, the Products price resolver now implements
customer/agreement/list matching and explanation despite obsolete TODO comments in PriceServices;
the research's missing-pricing claim is historical. XML board/calendar views, generic record/activity
links, shared files and Accounting's credit, posting-operation and external-access services exist.
Shared OrderDetail currently implements Projects and Accounting contexts; the full crosscut screen
and its Sales context are specifications, not a ready-made Sales editor.

## 1. Shell

### 1.1 Root and authority

Keep `screen/Sales.xml`, app path `Sales`, icon `sym_o_handshake` and
`mantle.party.PartyServices.setup#UserOrganizationInfo`. Proposed
`ironstone.sales.ContextServices.get#SharedContext` returns capabilities, authorized organization
choices, `appRoot` and `sharedLinks`. Ordinary groups use `MANTLE_USER_ORG` and
`MANTLE_PRIVATE_CONTACT`; `BOSS_SALES_ADMIN` uses the established admin organization filters.
All reads, searches, exports, choices, batch operations and mutations independently check their
permission and record organization in Mantle. App context adds filters and presentation, never authority.

The following groups/permissions are proposed. **R** means representative, **M** manager,
**A** sales approver, **P** price editor, **C** commercial-change operator, **S** administrator,
**V** reader and **E** external customer. Groups compose permissions; an edit permission alone
does not confer unrestricted read access.

| Group | Permissions and boundary |
| --- | --- |
| BOSS_SALES | Root entry and SALES_VIEW for authorized Sales records |
| BOSS_SALES_REP | SALES_OPPORTUNITY_EDIT, SALES_ACCOUNT_EDIT, SALES_QUOTE_EDIT, SALES_QUOTE_SEND, SALES_ORDER_EDIT; assigned/team opportunities, own/team quotes/orders, permitted organization accounts |
| BOSS_SALES_MANAGER | SALES_TEAM_VIEW, SALES_TEAM_MANAGE, SALES_FORECAST_EDIT, SALES_REPORT_VIEW, SALES_OPPORTUNITY_EDIT, SALES_ACCOUNT_EDIT, SALES_QUOTE_EDIT, SALES_QUOTE_SEND, SALES_ORDER_EDIT and SALES_CUSTOMER_INVITE; all Sales records of permitted organizations |
| BOSS_SALES_APPROVE | SALES_APPROVE; decide policy exceptions for permitted records; does not grant credit-hold release or price-list editing |
| BOSS_SALES_CHANGE | SALES_ORDER_CHANGE; propose/apply approved commercial changes; approval requires SALES_APPROVE separately |
| BOSS_SALES_AGREEMENT | SALES_AGREEMENT_EDIT, SALES_RECURRENCE_MANAGE; scoped agreement/recurrence management |
| BOSS_SALES_READ | SALES_VIEW, SALES_TEAM_VIEW, SALES_REPORT_VIEW; permitted organization reports and records, no mutation |
| BOSS_SALES_ADMIN | SALES_CONFIGURE plus explicit Sales view/edit capabilities; configuration does not confer finance, cost, stock or deployment authority |

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
The palette indexes authorized opportunities, accounts, quotes/orders and agreements. Record context
identifies the host and source selection; Today reuses WorkEffort activities rather than
`nextStep` text. Approval notifications use SalesQuoteApproval and the shared OrderChangeApproval
topic. All providers use the same domain filters as lists. Chatter, files, mail composition,
calendar and reminders retain their existing owners. **Needs:** SAL-ACCESS, SAL-SHELL, SAL-COLLAB.

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
| MergeAccounts | Sales/Accounts/MergeAccounts | wizard | xml | Review duplicate parties | Party | own §4 | M,S | parity | selected source/survivor |
| Quotes | Sales/Quotes/Quotes | list | xml | Draft, proposed and expired offers | OrderHeader | own §5 | R,M,V | parity | rows; quote filters |
| QuoteRequests | Sales/Quotes/QuoteRequests | list | xml | Customer RFQ intake | Request | own §5 | R,M | parity | RqtQuote rows |
| QuoteRequestDetail | Sales/Quotes/QuoteRequestDetail | detail | xml | RFQ lines, evidence and quote creation | Request | Projects RequestDetail; CX §3.11 | R,M,V | parity | requestId |
| QuoteTemplates | Sales/Quotes/QuoteTemplates | list | xml | Reusable standard offers | proposed SalesQuoteTemplate | own §5 | R,M,S | new | template rows |
| QuoteTemplateDetail | Sales/Quotes/QuoteTemplateDetail | detail | xml | Maintain template lines and terms | proposed SalesQuoteTemplate | own §5 | M,S | new | quoteTemplateId |
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
| RecurringOrders | Sales/Agreements/RecurringOrders | list | xml | Monitor native recurring bases | OrderHeader | own §7 | recurrence capability | parity | baseOrderId; filters |
| Subscriptions | Sales/Agreements/Subscriptions | list | xml | Access periods and renewal sources | Subscription | own §7 | app | new | subscription rows |
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
| ContractSchedules | Sales/Agreements/ContractSchedules | detail | xml | Advanced contract amendments/billing | Agreement | own §11 | agreement/finance | later | agreementId |
| Commissions | Sales/Reports/Commissions | report | xml | Explain source-earned commission | Agreement, AgrCommission | own §11 | M; restricted rep self | later | period; payee scope |
| Territories | Sales/Settings/Territories | tree list | xml | Effective coverage assignments | proposed SalesTerritory | own §11 | M,S | later | territory |
| AssignmentRules | Sales/Settings/AssignmentRules | settings | xml | Explain automatic routing | proposed SalesAssignmentRule | own §11 | M,S | later | organization/team |
| LeadIntakeForms | Sales/Settings/LeadIntakeForms | settings | xml | Publish bounded lead forms | DbForm | own §11 | S | later | form/publication scope |
| LeadIntake | PASS:Sales/LeadIntake | wizard | xml | Submit public interest | proposed intake submission | own §11 | public scoped form | later | form token; no internal context |
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
| OpportunityImport | wizard step | Preview and import lead/deal rows | file/source, column mapping, duplicate strategy, preview, selected rows | per-row errors and confirmation | O.preview#OpportunityImport, O.apply#OpportunityImport | new; complete fields and behavior in §16 |

**Actions.** Stage moves are not closure. The service checks pipeline membership and refuses stale
writes; failed dragging restores the original lane and explains why. Won/Lost are explicit detail
actions. Bulk operations commit each independent deal separately and report denied/stale rows.
**Source:** research §§1, 3. **Needs:** SAL-ACCESS, SAL-CRM.

### Leads

**Layout.** Same opportunity list definition with lead type fixed and qualification columns.
No duplicate Lead entity or second Party is created just to capture an inquiry. A lead may have
an optional account and contact; intake contact information uses existing Party/contact mechanisms
and Prospect/AccountLead roles where supplied, not shadow address fields on the deal.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| LeadFind | find | Triage incoming leads | text, owner/team, source/campaign, age, qualification | saved filters | — | Frappe CRM Leads |
| LeadList | list | Qualify or reject interest | name, account/contact if known, source, owner, age, next activity | row Convert; duplicate suggestions | O.find#Opportunities with lead type | Odoo lead list |
| NewLead | dialog | Capture interest without a customer account | name, organization, team/owner, optional existing prospect/contact, source/campaign, description | person/org chooser; create contact via Commons | O.create#Opportunity with lead type | Frappe lead intake; research §2 |
| QualifyLead | dialog | Promote same record | expected stamp, existing/new account and contact, pipeline/stage, owner, amount/currency, close date | duplicate candidates before creation | O.qualify#Lead | Frappe ConvertToDeal; Odoo conversion |

**Actions.** Qualification is atomic: validate or create/link parties, set opportunity type and
conversion time/actor, retain source and all joins. Retry returns the same record. A bulk
qualification invokes the same operation per lead. Disqualify records an explicit lost outcome
and reason. Reopen restores an open lead; returning a qualified opportunity to lead requires a
manager, reason and no placed linked order. Conversion history remains audit-readable.
**Source:** research §2. **Needs:** SAL-CRM, SAL-ACCOUNTS.

### OpportunityDetail

**Layout.** Record header with type, outcome, stage, account, amount/currency and expected close.
Tabs: Overview, Contacts/team, Competitors, Quotes/orders, Activities, Files and History.
A document strip shows RFQ → quote → order from real linked records, without inventing a second
document status. New quote is primary for an open qualified opportunity; otherwise Schedule activity.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Opportunity | single | Maintain deal facts | name, account, amount/currency, probability/mode, close date, nextStep, source/campaign | stage bar; server-search | O.get#Opportunity, O.update#Opportunity | Moqui Sales ViewOpportunity; Odoo lead form |
| OpportunityParties | list; dialog | Assign owner/team/contact roles | party, role, from/thru dates | dated party lookup | O.store#OpportunityParty | SalesOpportunityParty; Moqui Sales team/contact sections |
| Competitors | list; dialog | Record competitive context | competitor, position, strengths, weaknesses | scoped party chooser | O.store#Competitor | SalesOpportunityCompetitor; ERPNext opportunity |
| RelatedSales | list, read | Trace RFQs, quotes and orders | document, date, state, amount/currency, response | same-app links; accepted flag | O.get#Opportunity | Carbon document pipeline; existing opportunity joins |
| CloseOpportunity | dialog | Explicitly record business outcome | expected stamp, won/lost, close date, lost reason, note | confirmation | O.close#Opportunity | Odoo/Frappe lost wizard |
| ReopenOpportunity | dialog | Resume closed work | expected stamp, reason, target stage, expected close | confirmation | O.reopen#Opportunity | ERPNext reopen |
| Collaboration | component | Activities, conversation and files | host record, audience, task/file | Chatter; RecordFiles | existing shared services, extended host registration | Odoo chatter; Commons §§9, 15 |

**Outcome rules.** Proposed Open, Won and Lost status items are separate from stages. Lost requires
a reason; Won records a close time and may reference accepted documents without requiring an order
(for example a won service engagement). Closed deals leave open forecasts. Accepted quotes display
“Accepted — review outcome”; they never automatically mark a deal won. Several quotes/orders may
belong to a deal. Linked order totals are supplementary facts, not added again to estimated revenue.

Probability is a decimal percent 0–100. A stage default is copied on creation/move only when
probability mode is Stage; an explicit manual value remains until the rep selects Stage again.
Stage age and conversion history come from audited changes. Missing estimates are unestimated,
not zero-value deals. The primary owner is one active SalesRepresentative association; teams,
contacts and internal organization use separate roles.

**Navigation.** Account to Customer360; documents to canonical OrderDetail/QuoteRequestDetail;
tasks to WorkItemDetail. **States.** An unauthorized linked record contributes no title, amount
or count. **Source:** research §§3, 8. **Needs:** SAL-CRM, SAL-COLLAB, SAL-QUOTE.

### WorkItemDetail — Context passed

Mount Projects' shared WorkItemDetail with the authorized opportunity/order/account host,
WorkEffort ID and activity emphasis. Creation uses Commons' task/activity service with
`WorkEffortRecord` and retains `SalesOpportunityWorkEffort` compatibility. Completing an activity
does not qualify or close a deal. Normal task access and assignment checks remain authoritative.

## 4. Accounts and contacts

### Accounts

**Layout.** Account list with customer/prospect role, account manager, next activity and permitted
commercial summary. It includes individual customers as well as organizations; the label Accounts
does not force a person into an Organization record.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| AccountFind | find | Find scoped parties | text, role, classification, owner/team, parent account | server-search; saved finds | — | Customer/FindCustomer OuterSearchForm |
| AccountList | list | Open commercial records | name, party type, contact, owner, active quotes, next activity | select-columns; phone name/state | S.find#Accounts | Customer/FindCustomer CustomerListForm; Customer/CustomerData CustomerDataList |
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

Use the Commons contact record with account relationship context and permitted channel/consent
editing. Sales may maintain identity, contact purposes and account assignments; user passwords,
group membership and tax/bank administration stay with their owners. Source forms are
Party/EditParty identity/contact forms. Invite to Sales requires the Sales external-access issuer
capability and binds the invitation to the account and organization. **Needs:** SAL-ACCOUNTS, SAL-PORTAL.

### MergeAccounts

**Layout.** Wizard: candidates → compare → impact → confirm/result. Both source parties must be
visible and of compatible person/organization type. Merging contacts and accounts uses the same wizard.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| DuplicateCandidates | list | Review likely matches | party/name, matched fields, relationship | side-by-side selection | existing mantle.party.DuplicateServices.find#PartyDuplicates | Party/FindDuplicates DupPartyList |
| MergePreview | wizard step | Choose survivor and review effects | source/survivor, retained fields, relationships, document counts, restricted-link blockers | compare table | S.preview#AccountMerge | Twenty duplicate merge; research §4 |
| MergeConfirm | wizard step | Apply reviewed merge | preview stamp, survivor, source, reason, operation key | named confirmation | S.merge#Accounts using existing mantle.party.DuplicateServices.merge#Parties | baseline duplicate finder |

The proposed guard checks both owners, private contacts, unique identifiers and dependent access.
Refuse a cross-organization or inaccessible dependency rather than broadening authority. Recheck
the preview before the existing merger; preserve audit/provenance and return the survivor link.
No automatic merge on email/name similarity. **Needs:** SAL-ACCOUNTS, SAL-ACCESS.

**Source:** research §4; Party/FindDuplicates and Twenty side-by-side duplicate review.

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

A quote can be created without an opportunity. Existing stores supply applicable price/tax/email
context but are optional; non-store quote rendering/sending is explicitly supplied by Q.
Initial Sales issuance requires all order parts to have one authorized seller, customer and
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
creating a quote does not silently complete the inquiry. **Needs:** SAL-QUOTE.

**Source:** research §§2, 5; Carbon RFQs and Request/FindRequest.

### QuoteRequestDetail — Context passed

Mount Projects' shared RequestDetail, fixed to `RqtQuote` and the authorized selling organization.
Show Overview, Items, Parties, linked Quotes, Activities and Files. Reuse Request/EditRequest,
EditRequestItems, EditTasks and existing request content forms; use normal RequestRecord links
for opportunity/order provenance. Primary Create quote invokes Q.create#QuoteFromRequest with
selected request items, quantities and expected request timestamp. It creates one native quote
and its source links atomically; the same operation key returns it. Decline RFQ records reason and
notifies the requester only after recipient preview. No extraction or AI mapping runs implicitly.

### OrderDetail — Quote context passed

This is the **quote context of the one OrderDetail** defined in crosscut §3.6, reached at
`Sales/Orders/OrderDetail`. Customer, seller, currency, parties, terms, items, pricing/availability,
history, Chatter and Files are its shared forms; do not create a second QuoteDetail editor.
The crosscut receives the added QuoteOffer/QuoteSend/QuoteResponse forms and actions summarized here.

- Draft items use existing OrderServices line/product APIs, Products usability checks, decimal quantities,
  the one price resolver and canonical tax/promotion services. They keep price provenance and customer
  PO in `OrderPart.otherPartyOrderId`. Part validity uses `validFromDate`/`validThruDate`.
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
  revision/time as OrderContent, issues a revision-bound PASS link, and queues deduplicated email
  through existing `mantle.party.CommunicationServices.send#EmailDraft`. An accepted delivery is not
  proof of customer acceptance. Partial recipient failure remains visible and retryable.
- Editing an issued quote starts a deliberate revision on the same order, invalidates its pending
  approvals/capabilities and requires reproposal/resend. History reconstructs audited fields and
  retains the exact earlier PDF. Clone uses `clone#Order` for a separate opportunity/offer.
  This action is limited to unaccepted offers; accepted orders change through §6 and cannot be
  reopened as an offer to erase the customer's response.
- Staff Record acceptance captures the customer/contact, acceptance time, customer PO and evidence
  attachment/message, reason/source and exact offered revision. Q.respond#Quote validates and records
  the same response as PASS; it never merely edits status. Decline records evidence/reason and rejects
  the eligible quote through `reject#Order`. Expiry is derived from validity, not an invented
  OrderExpired status.

Customer acceptance checks an issued, unexpired, current offer; records the customer response;
and calls existing `place#Order` atomically for the native sales order. Its result distinguishes
Placed, Approved and Held according to native policy. Sales approval and credit gates still run;
a held accepted order retains the valid acceptance and shows the outstanding internal action.
A validation/conflict failure before placement leaves no successful acceptance fact.
Payments are not collected by the quote page; authorized invoice payment links go to PASS Billing.

**Approval binding.** Extend existing OrderDecision/OrderDecisionReason with offered revision and
evaluated policy reference/time, decision purpose and exception result where needed. Quote/discount
approval and final order approval are distinct purposes. A material revision invalidates earlier
decisions; the shared approval center and direct service call use the same guard.
**Source:** research §§5–6; Order/OrderDetail and Order/OrderItems; Carbon quote history.
**Needs:** SAL-QUOTE, SAL-APPROVAL, SAL-PORTAL; CX-PRICING, CX-CREDIT, CX-POSTING.

### QuoteTemplates

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| TemplateFind | find | Find reusable offers | organization, name, effective state, product/category | filters | — | Odoo quotation templates |
| TemplateList | list | Open/copy permitted templates | name, organization, interval, lines, state | state chip | Q.find#QuoteTemplates | Odoo quotation templates |
| NewTemplate | dialog | Start a template | name, organization, description, currency policy | named choices | Q.store#QuoteTemplate | Odoo sale order template |

**Source:** research §5; Odoo quotation templates.

### QuoteTemplateDetail

**Layout.** Header, fixed product/charge lines, terms/text, default validity, preview and history.
Templates are proposed SalesQuoteTemplate and SalesQuoteTemplateItem records, not live orders;
they cannot reserve, invoice or become public merely by existing.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| TemplateHeader | single | Maintain reusable defaults | name, organization, description, effective dates, default validity interval, currency policy, terms/print template | date and registered-template choices | Q.store#QuoteTemplate | Odoo sale order template |
| TemplateItems | list, editable rows | Define fixed suggested lines | sequence, product or charge type, quantity/UOM, description, pricing mode | catalog choices | Q.store#QuoteTemplateItem | Odoo template lines; OrderItems |
| TemplatePreview | display | Resolve an example quote | customer, currency, effective date, products, quantities, resulting prices/warnings | shared pricing/availability links | Q.preview#QuoteTemplate | Products price preview |

Publishing starts a dated template and ends the replaced row; published templates are not edited in
place. New quotes copy defaults and resolve current prices unless an authorized contractual fixed
price is explicitly part of the template. Existing quotes retain their terms when a template changes.
Optional upsell/configuration belongs to §11. **Source:** research §5. **Needs:** SAL-TEMPLATE.

### Approvals — Context passed

Mount Commons' approval list filtered to SalesQuoteApproval and OrderChangeApproval; do not replace
the suite inbox. It opens the source quote/change at the requested revision. Approve/Refuse calls
Q.decide#Quote or C.decide#OrderChange, checks the approver and separation-of-duty policy, and returns
stale/expired decisions without changing the source. Notifications are pointers, never authority.
**Source:** research §§5, 11; Commons approvals. **Needs:** SAL-APPROVAL, SAL-SHELL.

## 6. Orders and commercial changes

### Orders

**Layout.** Saved lists Awaiting approval, Held, To fulfill, Part fulfilled, To invoice and Recent.
Resolve sale direction from each OrderPart's internal vendor/external customer; never infer it from
an order-wide purchase flag. Filter mixed-direction parts and totals by access. Recurring bases
and open Shop carts have their own worklists.

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
existing primitive. Guards also cover direct/native entry points when Sales policy is enabled;
the UI wrapper is not the security boundary. Existing Accounting
`mantle.account.CreditServices.evaluate#OrderCredit` participates in
`mantle.order.OrderInfoServices.check#OrderPreApprove`. A Sales permission never releases Credit
or another domain's hold. Fulfillment and invoice creation remain capability-gated shared actions.

Editing a placed/approved order's commercial facts opens OrderChangeDetail. No hidden direct-edit
route bypasses that proposal. Existing Projects estimate approvals and project billing shares
remain under their owning contract; merely linking an order to an opportunity does not convert a
project estimate to a Sales offer. The source kind determines which approval service applies.
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
those kinds. A new line is a quantity-increase proposal with a product/UOM and no prior item,
validated against the same product/pricing rules.

The shared preview names the old and proposed values, freight/tax/credit effects, quantities
already picked/shipped/billed, affected shipments/invoices, customer consent and the exact source
revision. An address/method change applies to a selected part; it cannot affect hidden mixed parts.
Approval binds both proposal timestamp and source order revision. Apply locks both and rechecks
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
Q.create#QuoteFromRequest also accepts an authorized RqtWarranty source without changing its type:
use selected chargeable RequestItems and RequestRecord/source links, retain the warranty decision
and scope, and send/accept through the same Sales offer contract. Customer Service reads the
result and records any required coverage/repair-consent decision through its own service; quote
acceptance cannot approve warranty coverage or release Maintenance work by itself. Public quote
access exposes only commercial terms, never the internal claim or diagnosis.

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

Seed proposed Agreement states Draft, Active, Expired and Cancelled after checking existing
installation status customizations. Draft→Active requires parties, valid dates, required acceptance
evidence and authorized prices/terms. End dates stop future applicability; expiry may be derived
until a lifecycle job records it. Historical orders/prices and subscription entitlements are not
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

Use existing create_RecurringOrders job and OrderServices.create#RecurringOrders/create#RecurringOrder,
with a proposed guard for timezone, end date, pause and due occurrence. Do not add a second scheduler.
The native base must have no shipment/billing sources, and remains a template: prevent reservations,
shipments, invoices and entitlement activation against it. Generated children alone fulfill.
The current worker's base lock/due recheck is retained and extended to make operator/job retries
deduplicate the same due occurrence; independent base failures do not stop other customers.
Auto-invoice needs finance authority at configuration and existing billing guards at execution.
Fixed agreement prices are not replaced by the latest catalog price without a reviewed change.

StoreRecurringContract-linked bases dispatch to Shop's occurrence coordinator and are managed through
its lifecycle, not the legacy clone loop. Recurrence alone is not off-session payment consent and
does not authorize a gateway charge. **Needs:** SAL-RECURRENCE; SHOP-SUBSCRIPTION.

**Source:** research §7; baseline OrderDetail RecurOptions and the native recurring-order worker.

### Subscriptions

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| SubscriptionFind | find | Locate access/renewal records | customer, agreement, resource/product, active/expiry, source order | scoped selectors | — | Mantle Subscription; research §7 |
| SubscriptionList | list, read | Explain entitlement and source | subscriber, resource, dates, use limits, source order, recurring owner | separate billing/access states | G.find#SalesSubscriptions | Moqui Sales agreement subscriptions; Commerce Subscriptions |
| SubscriptionFollowUp | dialog | Schedule commercial follow-up | subscription/source, assignee, due, summary | shared activity | existing Commons activity service | research §8 activities |

No direct checkbox grants access or marks an invoice paid. Change/cancel/restore actions route to
the owning Subscription/Commerce/Accounting lifecycle with its permissions. Ending a sales agreement
does not end already paid access; a subscription with no billing link is shown as such.
**Needs:** SAL-RECURRENCE, SAL-COLLAB.

**Source:** research §§7–8; Moqui Sales agreement subscriptions and Commerce subscription worklists.

## 8. Reports and forecasts

### Forecast

**Layout.** Period/organization/currency and owner/team selector, metrics, opportunity drill-down,
then the representative's forecast and manager review. Reuse SalesForecast/SalesForecastDetail,
not a spreadsheet snapshot subsystem. A forecast is a submitted judgement; pipeline is calculated.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ForecastFind | find | Select a reporting slice | organization, internal party/team, period, currency, as-of | time-period choices | — | Mantle SalesForecast; Odoo forecast |
| ForecastMetrics | display | Explain pipeline/commitment | quota, open amount, weighted amount, submitted forecast, best case, won amount, actual orders/invoices | clearly labelled measures | F.get#Forecast | Odoo forecast; SalesForecast fields |
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

Report definitions/saved filters are shared with Insights; Sales owns its domain query definitions.
Exports use the same scope, field permissions, parameters and source basis as the visible result.
**Needs:** SAL-REPORT.

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
columns are omitted unless both price and cost rights permit them. **Needs:** SAL-REPORT.

**Source:** research §9; baseline Accounting/Reports/SalesAnalysis and the current Sales route.

### PipelineAnalysis

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| PipelineReportOptions | single | Define cohort and dimensions | organization/team, as-of, close period, source/campaign, stage, currency | saved report | F.get#PipelineAnalysis | Odoo pipeline; ERPNext funnel |
| PipelineMeasures | list, read | Explain open work and movement | stage/source, count, estimated/weighted amount, age, missing estimates, next-activity coverage | chart with exact table | same query | Odoo CRM reports |

Stage durations use audited transitions, including reopenings; historical gaps are reported as
unknown. Lead-to-opportunity conversion uses conversion events over an explicit lead-created cohort,
not current type counts. **Needs:** SAL-FORECAST, SAL-REPORT, SAL-ANALYTICS.

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

### LeadSources

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Sources | list; dialog | Maintain shared acquisition choices | source ID, description, source type, active selection state | DataSourceType dropdown | O.store#LeadSource with shared-source permission | SalesData LEAD_SOURCE types; Odoo UTM source |

`SalesOpportunity.dataSourceId` names `moqui.basic.DataSource`, not a DataSourceType enum.
Existing LEAD_SOURCE descendants classify source rows; seed/select actual DataSource records.
[Marketing §12](design-marketing.md#12-settings) mounts this same editor and owns campaign configuration; Sales selects
authorized MarketingCampaign/TrackingCode references. A proposed effective organization/source
binding controls offered choices without deleting global sources. **Needs:** SAL-CRM.

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

**Source:** research §§2–3, 10; Odoo lost reasons and Mantle opportunity type discriminator.

### SalesDefaults

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| SalesPolicy | single | Set effective operational defaults | organization, dates, default pipeline/team, validity days, templates, customer response requirements, reminder policy | preview and publish | Q.store#SalesPolicy | Odoo Sales settings; Carbon sales configuration |

Currency and units resolve from organization/customer/product and then user preferences; never
hard-code USD or each. Default quote validity is 30 calendar days in the seller's zone, visible
and editable on each draft; expiry stores an explicit timestamp. Default reminders are off.
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
placement and approval; decisions bind the source revision and policy row. Business chooses
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
than creating a second token system. Proposed QuoteView and QuoteRespond scopes bind the issued
order revision, customer and seller, expire no later than the offer, and can be revoked. Existing
scope support is limited to Accounting/Supplier records; Sales registration is required.
Authenticated access checks the contact/account relationship and organization. Bearer access
reaches one issued offer/response only; it never enables CustomerQuotes enumeration.

Proposed public operations `sales.findQuotes`, `sales.getQuote`, `sales.getQuoteDocument`,
`sales.respondQuote` and `sales.getQuoteResponse` map to
`mantle.order.SalesPortalServices` (§12.1). PASS adds them to its registered operation schema and
route allowlist. The server derives actor/customer/organization from the checked capability,
not a submitted party ID. Documents stream through protected media with the same checks;
an internal content location or general file-browser URL is never returned.

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

P delegates to the same guarded Q response lifecycle as staff acceptance. The server checks the
issued revision/state/expiry under lock and revalidates acceptance eligibility. A price or term
change requires a new offer, not silent repricing at Accept. Security/product/credit checks
still apply: an internal approval or credit hold may leave the accepted order awaiting processing;
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

## 11. Later capabilities

These screens are designed extensions, absent from initial menus. Each has a named delivery gate;
none is an implementation claim or prerequisite for S1–S3.

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
No employee advance or payroll record represents a customer entitlement. This corrects Projects'
earlier handoff to People; it does not claim that entitlement balances or drawdown are implemented.
Gate: Accounting schedule/recognition contract and customer amendment acceptance. No second invoice
worker or revenue ledger. **Source:** research §7. **Needs:** SAL-LATER.

### Commissions

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| CommissionOptions | single | Select earning basis and payee | AgrCommission agreement, representative/partner, period, currency, order/invoice/payment basis | explicit source basis | proposed mantle.sales.CommissionServices.preview#Commissions | ERPNext Sales Partner; AgrCommission/AitCommissionRate |
| CommissionLines | list, read | Explain provisional earnings | source/line, attributable basis, rate, amount, reversal, prior settlement | source-linked trace | same proposed preview | ERPNext commission report |
| ApproveCommission | dialog | Approve source-bound earning input | period, selected sources, rule dates, approver, operation key | totals/duplicate check | proposed mantle.sales.CommissionServices.approve#Commissions | People approved payroll inputs; Accounting payable source |

Commission rules use dated AgrCommission/AitCommissionRate terms and explicit attribution.
Approval creates a unique source-bound earning fact; employee payout goes to People's approved
payroll input contract, external partner payout to Accounting payable intake. Credits/cancellations
create linked adjustments, not edits to settled earnings. Rep self-view cannot expose other payees.
Gate: approved calculation/basis rules and the owning payout integration. **Needs:** SAL-LATER.

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
unassigned queue. Retry does not advance the cursor twice. Gate: dated membership, schedule and
assignment audit. **Needs:** SAL-LATER.

**Source:** research §§2, 10; Frappe CRM assignment rules.

### LeadIntakeForms

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| IntakeDefinition | single | Configure a public form | DbForm, organization/site, allowed fields, consent text, source, queue/team, publication interval | shared form-builder mount | proposed O.store#LeadIntake | Frappe CRM web forms; shared DbForm |
| IntakePreview | display | Preview public submission | published fields, labels, validation, privacy/consent | public-safe preview | proposed O.preview#LeadIntake | Frappe form preview |

**Source:** research §2; Frappe CRM Web Form and shared DbForm.

### LeadIntake

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| PublicLead | wizard step | Submit bounded interest | published form fields, contact details, inquiry, consent choices, request key | accessible HTML inputs | proposed sales.submitLead → P.submit#LeadIntake | Odoo website_crm; Frappe Web Form |
| IntakeReceipt | display | Confirm receipt without enumeration | opaque receipt, next steps | neutral result | same submission result | PASS intake pattern |

The two intake screens share the published DbForm contract.
[Marketing §§10, 13](design-marketing.md#10-surveys-leads-and-engagement) advances the shared
intake/publication dependency for Marketing's first release: its distribution/forms/events call the
same Sales-owned intake, duplicate and routing services with a validated source and campaign.
MarketingLeadCapture records one handoff per rule/source event; it is not another lead store.
These standalone Sales screens remain later; the shared service contract is no longer blocked
on their delivery. Separate transactional contact from
marketing consent; do not auto-subscribe a lead. No public party search, direct record ID selection,
arbitrary service/field execution or internal duplicate result. Gate: PASS registered intake,
throttling, media scanning and consent-aware routing. **Needs:** SAL-LATER, SAL-PORTAL.

**Source:** research §2; Odoo website_crm and Frappe Web Form.

### QuoteExtraction

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ExtractEvidence | wizard step | Select authorized source | request/file, extractor, language | scanned file picker | proposed Q.extract#QuoteRequest | Carbon RFQ document drop |
| MapExtractedLines | wizard step | Review every proposed match | source page/row, text, product, quantity/UOM, confidence, ignored rows | side-by-side evidence | proposed Q.apply#ExtractedRequestLines | Carbon MapExtractedLinesModal |

Extraction returns proposals only. Untrusted document instructions never trigger services.
Human review and normal item validation precede writes; independent row failures are named.
Gate: operator-approved extractor and audited mapping. **Needs:** SAL-LATER.

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
| O — mantle.sales.OpportunityServices | Lead/opportunity lifecycle, dated participation, pipeline/settings and batch actions | organization, authorized record/filter, declared fields, expected stamp → scoped record/rows/options or changed record/reason code |
| S — mantle.sales.SalesWorkspaceServices | Authorized home, account/customer projections, duplicate guard, report catalogue and readiness | organization, filters/record, pagination → display values, capabilities, counts, links and page metadata |
| F — mantle.sales.ForecastServices | Forecast keys, targets, explicit analytic cohorts and source reconciliation | organization, party/team, period/as-of, currency, basis, expected stamp → measures, source rows, exclusions and persisted judgement |
| Q — mantle.order.SalesQuoteServices | Quote intent/templates, native-order preparation, approvals, issuance, responses, guarded sales transitions and sending | order/part/source, expected revision, action data, operation key → native order, current revision, issue/response/decision or named conflict |
| C — mantle.order.OrderChangeServices | Shared Customer Service/Sales proposal, preview, decision and atomic application | request/proposal stamp, order revision, changed fields, preview, operation key → impact, decision, applied revision and dependent work |
| G — mantle.party.SalesAgreementServices | Customer agreement lifecycle and authorized recurrence/subscription projections | agreement/base order, dates/terms, expected stamp, operation key → agreement, recurrence result or subscription/source rows |
| P — mantle.order.SalesPortalServices | Checked customer projections and quote responses over Q | checked PASS identity/token, organization target, quote/issue, request key → allowlisted view/receipt; no internal entity maps |
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
| Approvals | Existing Commons provider filtered to SalesQuoteApproval and OrderChangeApproval; original source-policy actions, revision and recipient checks |
| Palette | Scoped O/S/Q/G searches; selected destination is a same-app record route. Hidden field data is never indexed into a readable snippet |

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
source eligibility and duplicate guards. Sales calls the current Mantle services rather than
copying older proposed ironstone finance wrappers from historical design text.

**Source:** research §§1, 8; Commons quick-create contract and the source forms in §§3–5.

## 13. Automation and operations

### 13.1 Existing rules and their disposition

These IDs/files are verified in current Mantle. A proposed extension belongs to Mantle and is
scoped by effective Sales policy/record purpose; plain Mantle behavior stays compatible.
Financial changes follow Accounting's existing flags and contracts rather than introducing
Sales-specific copies of those flags.

| Rule / job | Disposition for Sales | Owner and guard |
| --- | --- | --- |
| OrderPlacedAutoApprove — service/OrderReturn.secas.xml | Condition through check#OrderPreApprove; an unresolved Sales approval/price warning prevents auto-approval | Q approval hook, beside Accounting credit checks; no bypass by directly placing or approving |
| OrderPlacedReserveAssets, OrderApprovedReserveAssets — service/ProductAsset.secas.xml | Keep normal native-order reservation; exclude recurring templates and unplaced quotes | Native stock rules; do not reserve twice in Q |
| OrderItemCreateCheckReserve, OrderItemUpdateCheckReserve — same file | Keep, with native lifecycle/recurring-template guard | Native reservations and guarded commercial changes |
| OrderItemHandleChange — entity/Order.eecas.xml | Keep totals/revision/invalidation behavior; audit coverage and issued-line retention extended | Revisions invalidate offer approval/access; Q/C never reset to Placed just to rerun effects |
| OrderPlacedAuthorizePayments — service/AccountingPayment.secas.xml | Keep for eligible native payment records | Accounting; public quote response adds no card/gateway fields or implicit recurring consent |
| OrderPlacedSendEmail, OrderApprovedSendEmail — service/OrderReturn.secas.xml | Keep confirmation semantics; extend deduplication where Q sends the same event | Store and non-store delivery share event/revision/recipient identity; quote issuance and placed confirmation are distinct events |
| OrderApprovedNotify — same file | Keep existing priority notification | Do not use it as acceptance or as a second approval decision |
| ShipmentOutgoingPackedCreateInvoices — service/AccountingInvoice.secas.xml | Keep under Accounting's configured pack/ship policy | Sales reads the resulting invoice; changes use Accounting's draft-release contract and cannot invoice the same source twice |
| InvoiceFinalizedSendEmail — same file | Keep Accounting's invoice-delivery deduplication | Sales quote email does not replace invoice sending |
| OrderApprovedFulfillSubscriptions — service/ProductSubscription.secas.xml | Retain native fulfillment for existing policies; condition paid-access/recurring-template paths as specified by Commerce/Shop | Billing/access owner; approval alone cannot activate a template or extend paid access before required settlement |
| create_RecurringOrders — data/MantleSetupData.xml | Keep one job, extend due/end/pause/retry guards | Native bases through existing worker; StoreRecurringContract bases dispatch once to Shop occurrence coordinator |
| ShipmentShippedSendEmail, ShipmentDeliveredSentEmail — service/Shipment.secas.xml | Keep shipment notices | Warehouse; Sales displays delivery state without resending automatically |

Native order rejection/cancellation, inventory and ledger side effects remain under their existing
services. Response or change orchestration never manually writes their results as a substitute.
Re-read this register against current code at implementation: several older shared-design service
names have since moved from BOSS into Mantle.

### 13.2 Jobs and recovery

Use existing ServiceJobs and communication delivery records for configured quote-expiry reminders,
agreement expiry/follow-up and recurrence. Reminder policy is off initially. When enabled, each
recipient/issue/reminder interval is deduplicated, checked for current consent/contact policy and
suppressed after response/revocation. Transactional quote mail and marketing subscription are distinct.

After source commit, delivery/index failures log record/job identity and remain retryable without
undoing a successful acceptance/change. Setup readiness shows failed jobs, unavailable public app,
unconfigured templates and unresolved policy. Operator queues identify the record, failed step,
last attempt and next action; no silent “sent” or “renewed” state. Retention/redaction follows the
suite's contact, file and communication controls; avoid logging bearer tokens or whole private PDFs.

## 14. Coverage and acceptance

### 14.1 Research disposition

| Research area / candidate | Designed disposition |
| --- | --- |
| §1 home/pipeline | Home plus one Opportunities dataset with board/list/calendar (§3); charts in §8; generic pivot/graph extension SAL-ANALYTICS |
| §2 leads/conversion/dedupe | Leads and OpportunityDetail (§3), existing party duplicate review (§4); public intake/routing (§11 later) |
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
| Party/FindDuplicates DupPartyList | MergeAccounts; guarded preview before existing merge |
| Party/FinancialInfo customer orders, invoices and receipts | Customer360 with finance view; payable/supplier rows remain Purchasing/Accounting |
| Party/PartyAgreements find/create/header/terms/items/content | Agreements/AgreementDetail with dated lifecycle and price mounts |
| Order/FindOrder sales create/list/approve/close | Quotes or Orders as appropriate; purchase creation remains Purchasing |
| Order/OrderDetail header/parts/items/quick items, promo codes, history, recurrence and communication/content | One Sales/Orders/OrderDetail with context-dependent action set; RecurringOrders exposes the same recurrence contract |
| Order/ItemReserve, OrderDetail shipment/payment/gateway forms | Shared OrderDetail only under borrowed Warehouse/Accounting rights; no automatic grants from Sales entry |
| Order/ReturnItem | Hand off to Customer Service return authorization; do not claim Sales implements a second return editor |
| Request find/edit/items/parties/tasks/notes/content | QuoteRequests/QuoteRequestDetail; common RequestDetail forms and guarded RqtQuote context |
| Request EditUsers/EditWikiPages | Existing request participant forms stay on QuoteRequestDetail; linked wiki editing stays in Commons, with no Sales wiki-editor parity claim |
| Accounting/Reports SalesSummary/SalesAnalysis | Existing Sales report routes, extended service-level access and explicit measurement basis (§8) |
| Catalog/Product/EditPrices | Products-owned customer/agreement price forms mounted as CustomerPrices (§7) |

Moqui Sales is reference material, not a baseline parity claim: its unmounted QVue screens,
SalesOpportunityNote and placeholder quote controls are not copied. No existing business data is
deleted to make the new navigation fit.
OrderDetail's ItemLimitForm becomes the native paginated item list's page-size control. Duplicate
deal suggestions open the existing opportunity; first-release destructive merge is limited to the
guarded party merge. A duplicate deal can be explicitly closed with a duplicate reason and a
Chatter link to the surviving deal, preserving each record's history and audience.

### 14.3 Implementation acceptance scenarios

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
5. Apply a template, change its published successor, and show that the earlier quote's terms/PDF
   remain unchanged. An override triggers the configured approver; a self-approval or stale decision
   fails. Direct service calls cannot bypass the guard.
6. Send an offer to two recipients, fail one delivery, retry only that result and preserve one issued
   revision/PDF. Revising terms invalidates old response authority while retaining historical print.
7. Accept the current quote through PASS and staff paths. Concurrent/double submits produce one
   response and native order; a conflicting decline or stale/expired/revoked issue is refused.
   An accepted credit-held order reports acceptance plus pending processing, not a false failure.
8. A bearer can view only the issued quote and receipt; changing customer/order/site/organization
   IDs, using another capability or accessing arbitrary files yields no data. Signed-in list access
   requires the correct contact relationship. Run the same contract locally and through remote PASS.
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

Implementation specs live with the owner: Mantle rules/authorization without BOSS, BOSS screens/
providers, and PASS public/remote contracts. Use Moqui server/client spec runners, not Node.
Every permission-negative case reuses valid positive-case parameters. No slow suite is authorized
by this design; obtain explicit permission only for a needed slow scenario. Writing this design
requires documentation/source checks, not application test runs.

## 15. Delivery stages

| Stage | Deliverable | Gate |
| --- | --- | --- |
| S1 — CRM foundation | Scoped root/context; account/contact reuse; pipeline/leads/opportunity lifecycle, team/stage/source settings, activities/files | Permission/organization isolation, conversion identity, source preservation, board/list/TUI equivalence; complete SAL-ACCESS/CRM/ACCOUNTS/COLLAB/SHELL foundations |
| S2 — Quote to order | RFQs, native quote editor, fixed templates, pricing/discount approval, audited issuance/history, staff and PASS acceptance | Native side-effect audit; no-store quote; stale/expired/revoked/concurrent response tests; registered PASS local/remote operations; shared OrderDetail preserves existing consumers |
| S3 — Sales operations | Commercial changes, fulfillment/finance handoffs, agreements, simple recurrence/subscription view, forecast/targets and core reports | Cross-app source locks and conflicts, recurrence ownership, currency/cohort reconciliation and complete end-to-end walks |
| Later | §11 named capabilities and generic analytical view widgets | Each screen's owner/prerequisite gate; no hidden placeholder menu or claimed implementation coverage |

S1–S3 together are the initial Sales release, including public quote acceptance. Development may
overlap independent areas, but root grants and public publication enable only usable, tested flows.
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
| Quote / order | html-print/PDF | OrderDetail | baseline Order/PrintOrder and organization OrgTemplateOrderPrint setting; as-of revision plus stored issuance PDF |
| Quote proposal and response receipt | email/PDF | OrderDetail, CustomerQuote, QuoteResponse | registered EmailTemplate and native communication send; public-safe terms and exact issued content |
| RFQ acknowledgement/decline | email/PDF | QuoteRequestDetail | shared request content and registered templates |
| Agreement / amendment | html-print/PDF | AgreementDetail, later ContractSchedules | Agreement text/terms/items and stored approved content |
| Change confirmation | html-print/PDF/email | OrderChangeDetail | shared before/after, decision and applied native order; no internal cost data |
| Pipeline / forecasts / reports | authorized CSV/XLSX, html-print | Opportunities, Forecast, Reports | shared export/renderers over the same filtered service results; currency/UOM and date basis retained |
| Account/contact import | previewed existing import workflow | Accounts/Contacts | Commons party import; existing identity/organization/duplicate guards, no unreviewed mass merge |
| Lead/opportunity import | preview and per-row results | Leads/Opportunities | proposed O.preview#OpportunityImport, O.apply#OpportunityImport using the same create/update/qualification services; explicit ID/source and field mapping |
| Price import | owner-provided preview/import | CustomerPrices/PriceLists | Products' existing price import contract and permissions |
| Expiry/renewal reminders | configured email/activity | Quote/Agreement/RecurringOrders | existing jobs/communications; effective policy, per-recipient deduplication |

Imports are dialogs/wizards on their source list, not new unrestricted entity endpoints.
The opportunity import steps select file/source, map type/party/stage/amount/currency/date fields,
preview matches/errors and confirm valid rows with operation identities. Unknown currency,
organization, party or stage is an explicit row error. No default generates arbitrary accounts.
New import form fields are file, source namespace, column mapping, duplicate strategy (skip/update
matched authorized ID), preview token, selected valid rows and confirmation; audit retains source
row identity. Attachments are scanned through existing file/media handling.

## 17. Framework and data needs

All additions below are **proposed** unless marked existing. This is the Sales-owned register,
indexed by crosscut; exact primitive types/complete auto-parameters follow current Mantle entities
during implementation. A new identity is justified only for a separate business fact, not a
snapshot of another record.

| Need | Kind | Proposed as | Used by | Stub spec |
| --- | --- | --- | --- | --- |
| SAL-ACCESS | service type, seed data | Mantle permission/organization/assignment checks; ironstone.sales.ContextServices; BOSS group mappings | every surface | Distinct read/edit/approval/finance rights; organization from native parties/parts; shared mounts and public services cannot add authority; guard existing AccountServices and report entrypoints |
| SAL-CRM | data model, seed data, service type | OpportunityServices; SalesPipeline; extend SalesOpportunity and SalesOpportunityStage; existing Party roles/relationships | §§3, 9 | Opportunity gets outcome status, lostReasonEnumId, conversion/close time and actor evidence, probabilityMode and pipelineId; lifecycle fields audit-logged. Stage adds pipeline, fold and effective applicability. Internal organization/owner/team/contact use dated SalesOpportunityParty roles. Source choice is DataSource with effective org binding, not an enum ID masquerading as dataSourceId |
| SAL-ACCOUNTS | service type | Extend existing AccountServices/party/duplicate APIs with scope; SalesWorkspaceServices projections and merge guard | §4 | Reuse Party identity/contact mechanisms; assign owner organization; safe hierarchy/contact links; preflight dependency/access checks on merge; no duplicate customer master |
| SAL-COLLAB | data model, service type, seed data | SalesOpportunityContent; existing host registry, Chatter/RecordFiles, generic record joins | opportunities, agreements, quotes | Single-field opportunity host key; content ID/type/location/dates using existing Content conventions; per-host access in search, followers, activities and files; no parallel note/activity tables |
| SAL-QUOTE | data model, service type, seed data | SalesQuoteServices; OrderHeader purpose marker; SalesQuoteIssue and SalesQuoteResponse | §§5–6, 10 | Proposed orderPurposeEnumId distinguishes SalesQuote/SalesOrder from unclassified legacy drafts and other owners. Issue is an issuance fact: ID, order/revision, seller/customer, issue time, validity, issuer, PDF content and terms references, revocation/supersession; no copied item ledger. Response is customer action evidence: ID, issue, action/time, actor/contact/capability, PO, acknowledgement/evidence, resulting order and operation key. At most one effective response per issue; resending same issue is recipient delivery, not another issuance |
| SAL-TEMPLATE | data model, service type | SalesQuoteTemplate and SalesQuoteTemplateItem | QuoteTemplates/Detail | Effective organization-scoped header/name/description, validity and template/terms defaults; child sequence/product-or-charge/quantity/UOM/text/pricing mode; published rows immutable by dated successor; no native order side effects |
| SAL-APPROVAL | data model, service type, seed data | SalesPolicy/SalesApprovalPolicy; extend OrderDecision/OrderDecisionReason; preapprove hook | quotes, order transitions, settings, inbox | Effective policy and threshold/purpose; decisions record order revision, policy/time and purpose; stale decisions invalidated; explicit manual override provenance on OrderItem; same checks on native/direct writes |
| SAL-CHANGE | service type, data model | Shared mantle.order.OrderChangeServices over Customer Service's existing proposed Request/RequestItem/OrderChangeDecision contract | §6; Customer Service | Same shared screen/proposal; Sales commercial kinds, Customer Service cancel/substitute kinds; exact source/proposal revisions, consent, stock/finance impact and atomic apply; no new change/application ledger |
| SAL-AGREEMENT | data model, seed data, service type | SalesAgreementServices; existing Agreement family and ProductPrice | §7 | Seed compatible agreement flow; validated parties/type/dates and acceptance evidence, dated successor/association, participant dating where absent; reuse implemented agreement pricing and extend lifecycle eligibility in its canonical guard |
| SAL-RECURRENCE | data model, service type | Extend native recurrence guards/settings and worker; SalesAgreementServices reads | RecurringOrders/Subscriptions | Explicit timezone, end/pause and occurrence identity using shared operation convention; base excluded from fulfillment; one worker owner, no duplicate order/invoice/access; Shop bases dispatch to its coordinator |
| SAL-FORECAST | data model, service type | ForecastServices over SalesForecast/Detail with target-basis metadata | Forecast/Targets/reports | Unique scoped key and parent roll-up; decimal percent/amount, explicit currency/basis/cohort, audit dates; actual source attribution and exclusions; no additive parent/child double count |
| SAL-REPORT | service type | Guard/extend current SalesReportServices and SalesWorkspaceServices | Home/Reports/Customer360 | Same authorized filters for measures, drill-down/export; precise native date/status basis; source links and missing-data states; restricted costs omitted |
| SAL-PORTAL | service type, seed data, data model | PASS Sales registration/operations; SalesPortalServices; extend ExternalAccessServices and PostingOperation public identity binding | §10 | Organization-targeted local/remote app; issued-revision capability, narrow safe projections/files, immutable response evidence, expiry/revocation, conflict-safe replay; no BOSS or store dependency |
| SAL-SHELL | shell item, service type, seed data | Existing palette/quick-create/Today/approval provider contracts | Home/QuickCreate/record screens | Context, same-app links, scoped search and counts; SalesQuoteApproval/OrderChangeApproval topics use source decision services |
| SAL-ANALYTICS | XML Form element, service type | Existing chart/report widgets now; later generic view-pivot/view-graph extension | PipelineAnalysis/Reports | Server-aggregated authorized dataset with declared measures/dimensions, bounded query and source drill-down; native list/table and TUI fallback; framework widget work follows style-guide §8.1 |
| SAL-LATER | data model, service type, seed data | Named §11 domain extensions | later screens | Territory/routing, intake/extraction, configuration/costing, commission earning facts and contract/rental coordination; gates and owning ledger/custody services in §11 |

**Audit and adoption detail.** Audit all keys needed to reconstruct issued terms: header revision/
purpose/currency, part parties/addresses/terms/validity, item product/quantity/UOM/amount/tax/
provenance, required dates and template/discount references. Retain issued line structure; a
revision ends/cancels earlier issued lines rather than physically deleting the only historical
source. The stored PDF is the exact delivered evidence; do not claim current header fields alone
can reprint an old offer. Adoption adds no fabricated historical audit rows.

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
| Recurrence and subscriptions | Native recurring worker, one dispatch owner per base; Commerce/Shop contract/entitlement machinery for store-backed subscriptions; no local billing ledger |
| Excluded baseline administration | Party user/group/password/type-conversion and supplier/payable/return execution stay with their owning apps; no Sales parity claim for those editors |
| Framework scope | Use existing XML list/board/calendar/chart and TUI facilities; generic pivot/graph is later, not a prerequisite for initial reporting |
| Delivery evidence | Publication/acceptance and send outcomes are separate; retry does not repeat placement, charge, invoice or customer response |

## 19. Open

No initial-release product choice remains open. Organization thresholds, team membership,
currencies, terms, branding, enabled reminder policies and public hosts are deployment data
selected through the defined forms and owning administration tools. Provider-specific signature
certification, advanced configuration, territory routing, commissions, rentals and contract billing
are the bounded later capabilities in §11; each requires its named owner/gate before implementation.

