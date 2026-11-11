# IronStone BOSS — UI review: Customer Service

Contents: [scope and sources](#1-purpose-scope-and-sources) · [method](#2-review-method-and-refinement-criteria) ·
[screen inventory](#3-screen-and-surface-inventory) · [activities](#4-end-to-end-activities) ·
[verification](#5-existing-checks-and-future-verification) · [running record](#6-coverage-findings-and-running-record) ·
[decisions](#7-decisions).

## 1. Purpose, scope and sources

Review and refine Customer Service through the work of agents, order-desk operators, managers, return authorizers,
knowledge authors and customers: understand the customer's situation, respond with the right audience, keep a
promise or explain why it cannot be made, resolve the operational problem and retain a clear history. Follow cases
through orders, shipments, returns, warranty work, financial outcomes and customer feedback. The workspace should
make the customer, service organization, current obligation, next action and audience clear without requiring an
agent to understand the implementation beneath them.

This follows [Products](ui-review-products.md), [Accounting](ui-review-accounting.md) and the
[document convention](design-doc-guide.md#ui-review-and-refinement-phase). Research records comparison patterns,
design specifies behavior, implementation records construction, and this file is the review plan and its future
running record. Keep scope, inventory, activities, findings and bounded execution notes together here.

**Status: planning only, 2026-11-10 America/Chicago.** This document is part of the four-app documentation batch.
Source research informs the plan; all live activity and mode coverage starts pending. No runtime, browser or terminal
walkthrough, test, build, application change or commit was performed to write it. Existing implementation results and
tests do not establish live review outcomes. Independent document review is recorded only after it occurs.

### Inputs and reference patterns

Other review plans in this batch: [Warehouse](ui-review-warehouse.md),
[Manufacturing](ui-review-manufacturing.md) and [Purchasing](ui-review-purchasing.md).

- [Customer Service design](design-customer-service.md), [implementation](impl-customer-service.md) and
  [research](research-customer-service.md). There is no separate CustomerServiceImplementation guide in `docs/`.
- [Accounting review](ui-review-accounting.md), [Products review](ui-review-products.md),
  [Projects review](ui-review-projects.md), [drawers, Commons and Comms review](ui-review-drawers-commons.md),
  [framework UI review guide](../../../../docs/dev/UI-Review.md) and
  [framework review](../../../../plans/UI-Refinement.md).
- [Application practices](../../../../docs/dev/Practices-App-Dev.md), [style guide](style-guide.md),
  [crosscut design](design-crosscut.md), and the current Warehouse, Accounting, Products, Purchasing, Sales,
  Commerce, Projects, Commons and PASS contracts at the bounded handoffs below.
- `screen/CustomerService.xml`, `screen/CustomerService/`, mounted Shared/Commons sources and inherited children,
  `template/CustomerService*.xml`, relevant shared templates, `service/ironstone/customerservice/`,
  `MoquiConf.xml`, `data/BossSetupData.xml`, `data/BossUsersDemoData.xml`,
  `data/BossCustomerServiceDemoData.xml` and its later case/demo loader data files.
- Current BOSS regression and acceptance specs, their helpers and client registrations; Mantle's support, SLA,
  assignment, templates, replies, relations, knowledge, feedback, warranty, order-change and return services/rule
  tests; PASS `screen/Support.xml`, `screen/Support/`, its facade and Support fixtures/access/HTTP coverage.

Use the earlier research as a comparison lens: Frappe Helpdesk for conversation, queues, assignment and feedback;
ERPNext for issue/service-level and warranty continuity; Dolibarr for intake and customer-facing case context;
Redmine for threaded mail; and the Moqui baseline for records and service contracts. These are the recorded research
patterns, not fresh claims about third-party products or a requirement to copy their feature inventories.

### Ownership and boundaries

| Surface | Owner and review boundary |
| --- | --- |
| Staff shell, cases, customers, lists, settings and app context | BOSS Customer Service, including queue/team/customer scope and the capability projection in `CustomerService.js` |
| Case lifecycle, templates, assignment, clocks, replies, relations, knowledge and feedback | Mantle request services/entities; business rules must work without BOSS |
| Case detail and follow-up work | Shared RequestDetail/WorkItemDetail; Customer Service supplies its case presentation, status rules and record access; finishing work does not itself resolve the case |
| Customers, contacts, orders, shipments and invoices | Shared screens and Customer Service templates; inspect the service context and its safe financial projection, not another complete Sales or Accounting review |
| Order changes | Mantle OrderChangeServices; Customer Service applies supported cancel/substitute changes, while commercial kinds go to the order owner's current authority and workflow |
| Return authorization, policy, warranty and customer evidence | Mantle ReturnPolicyServices and WarrantyServices; Customer Service owns the agent-facing process |
| Physical return receipt, inspection and disposition | Mantle Warehouse/quality guards, also reachable through Customer Service's permitted shared actions; owning rules remain Warehouse/quality rules |
| Credit, replacement and gateway refund | Mantle ReturnServices/Accounting payment services; Customer Service exposes settlement only to the borrowed financial capability |
| Product identity, stock, history and price explanation | Shared Products/Warehouse sources with the Customer Service context; quantity is not a delivery promise and a service role does not grant supplier prices or costs |
| Chatter, files, mail, calls, forum, Knowledge and surveys | Existing Commons/Comms/Shared components and their owning services; inspect case identity, audience and return path |
| Public Support and feedback pages | PASS over Mantle through `pass.Facade`; local or remote authority remains separate from BOSS staff access |
| Widgets, layout, print/PDF and terminal rendering | Framework/client and output services; fix shared causes at their owner and verify a second relevant consumer |

Preserve routes, record identity, revisions, operation keys, saved finds, preferences, dated policy/form history and
service/entity contracts. Record unavoidable compatibility changes before later implementation. Hidden tabs and app
context do not grant authority. Restricted cases, private messages, internal template answers, customer identifiers,
costs, supplier prices and financial details must be absent from unauthorized responses, choices, search counts,
files and exported bytes, not merely hidden in a widget.

Do not build absent features to complete this review. ChannelAutomation, a new telephony adapter, case time billing,
general external knowledge connectors, a chargeable-repair sales quote, an on-site intervention report and PASS TUI
remain separate work. Current Sales/Commerce/Admin integrations must be checked where actually linked rather than
treated as absent because an older implementation paragraph says so. Real customer mail, calls, public forum
publication, carrier purchases and gateway payments are not review fixtures; later execution uses disposable local
records and captured or synthetic integrations.

## 2. Review method and refinement criteria

### Environment and fixtures

For later execution, follow the UI review guide and repository building/testing skills. Use an isolated runtime and
fresh disposable database, with Mantle and BOSS linked individually; add PASS for the public handoff. The guide's
framework-only bootstrap leaves addon components out and is not an application fixture by itself. Copy mutable
configuration and isolate database, uploaded evidence, captured mail, public capabilities and output files from
working data. A different port does not isolate a database or browser cookies. Use separate hostnames for independent
browser identities. A symlink to a component still targets its source directory.

One coordinator owns runtime lifecycle and shared settings. Record source/binary revisions, actual components,
runtime/database paths, hostnames/ports, clock/zone, fixture setup and evidence directory in the first execution
batch. Establish browser, actual terminal, Chromium/PDF, mail capture and required PASS authority availability before
delegating live work. Reuse a suitable binary for screen/script work; embedded renderer changes are a separate build
concern. Verify loaded assets before diagnosing an old page. If retaining a fixture runtime across restarts, follow
the guide's whole-runtime relocation procedure. Restore temporary grants, policies and preferences and stop review
listeners when finished.

The main service organization is **`ORG_ZIZI_RETAIL`**, with **`ZIRET_WH`** and the store **`POPC_DEFAULT`**.
**`CustJqp`** and **`JoeDist`** are its customer examples; **`ORG_ACME`** is a shared customer, whose other
organizations' records must stay out of the current context. **`ORG_ZIZI_SERVICES`**, **`BOSS_CS_CUST_OTHER`** and
their cases/orders supply the foreign-scope counterpart. Accounting's dedicated `BOSS_ACCT_ORG` is not Retail;
do not use an Accounting demo user's refusal on a Retail return as proof of financial role separation.

| Actor/fixture | Existing starting point and limitation |
| --- | --- |
| Service agent | `customerservice.agent`: intake and work on visible cases; no implicit stock or settlement rights |
| Service manager | `customerservice.manager`: team work, assignment, merge/decisions and reporting; restricted Privacy remains a distinct team boundary |
| Order desk | `customerservice.orderdesk`: order-change work; inspect request/approve/apply grants separately |
| Return authorizer | `customerservice.returns`: policy decision and authorization, not physical receipt or financial settlement |
| Knowledge author | `customerservice.knowledge`: knowledge authoring/feedback; case access still applies |
| Service administrator | `customerservice.admin`: configuration and active-organization scope; the demo also belongs to Privacy, so it is not a narrow-role isolation negative |
| Stock-capable agent | `customerservice.agentwh`: agent plus receive/inspect capabilities without a Warehouse launcher; add a separate explicit dispose holder for disposal checks |
| Receivables-capable authorizer | `customerservice.returnsar`: return authorizer plus AR; this does not establish treasury refund or receiptless-credit approval |
| Reader / foreign agent | `customerservice.read`, `customerservice.services`; reader does not inherit every queue, Reports or Returns area |
| Public contacts | `joe@public.com`, `dana@joesdist.example.com` and `morgan@joesdist.example.com` in the Support demo; distinguish own-contact from customer-administrator visibility |
| Guest order holder | Separate unsigned-in browser session with a valid `SalesOrder` / `OrderView` capability retained by Shop for one order and site; this grants the bounded order requests in CS-32–33, not general Support case/return-list access |
| Additional paired actors | A same-organization refund holder, receiptless-credit approver, quality disposer, non-holder, expired team member and a Projects client contact; give each only the rule under examination |

Check actual loaded grants, dated team/customer relationships, queue visibility and organization membership before
using these identities. Root entry is a navigation grant. `SUPPORT_CASE_EDIT`, `SUPPORT_CASE_MANAGE`,
`ORDER_CHANGE_REQUEST/APPROVE/APPLY`, `RETURN_AUTHORIZE`, `WARRANTY_APPROVE`, `STOCK_RECEIVE`,
`QUALITY_INSPECT/DISPOSE`, `RECEIVABLE_EDIT`, `PAYMENT_EDIT` and `RETURN_CREDIT_APPROVE` are separate authorities.
Pair a refused operation with an otherwise-valid successful holder request, not a request that fails validation for
everyone. Never use ADMIN as the ordinary case worker or as evidence of an organization boundary.

Use the current `CustomerServiceSpecLib.js` and demo-loader sources to prepare only the records each wave needs:

- Support, Privacy and Services queues/teams; cases `BOSS_CS_CASE_THERMO`, `BOSS_CS_CASE_FILTERS`,
  `BOSS_CS_CASE_PICK`, `BOSS_CS_CASE_PRIVACY` and `BOSS_CS_CASE_OTHER`; retain an untouched baseline because later
  merge, resolve and assignment actions consume or move them.
- Sales orders `BOSS_CS_SO_DELIVERED`, `BOSS_CS_SO_PICK`, `BOSS_CS_SO_PACKED`, `BOSS_CS_SO_HELD` and
  `BOSS_CS_SO_OTHER`; delivered thermostat/serial, stocked filter and its substitute. Derive the delivered serial
  from its issuance as the helper does rather than hard-coding which demo serial was shipped.
- Dated service/SLA/assignment/return policies, queue template `BOSS_CS_TPL_DEFECTIVE`, warranty template,
  `BOSS_CS_SERVICE_MAIL`, mail/form routes, saved replies and a copied return fixture; inspect current loader dates.
- English/Spanish published help, draft and internal articles; a public feedback form, invitation, answer and low
  score follow-up; `ZIZI_PORTAL` and an explicitly configured Support mount for the public branches.
- A disposable guest order with an open cancellation remainder and a delivered, self-service-returnable line; enter
  its Shop confirmation or emailed order link so the session retains the capability under `passShopOrders:<siteId>`.
  Prepare a second order, a different site's session/mount and expired/revoked capability variants. Do not paste
  capability values into the review record or substitute signed-in contact grants for this branch.

The guest handoff starts at the established Shop order link and follows only its Support case, cancellation and
return actions; it is not a full Shop review. `Support/Support.js` retrieves the capability for the requested site
and order only when unsigned in. Mantle `SupportPortal.askers` checks `SalesOrder` / `OrderView`, the served
organization and the exact order, then supplies that order's customer without administrator authority.
`NewCustomerCase` and `RequestReturn` keep guest submission outcomes on their request pages; inspect the receipt or
state notice and the staff-side result separately. The capability does not confer MyCases, MyReturns or arbitrary
CustomerCase/CustomerReturn access. A queue form token is a separate intake contract.

Prepare empty/populated/filtered lists, long/localized subjects and customer names, duplicate-looking cases,
restricted/private content and files, inaccessible/deleted records, two rows per repeated dialog, and a choice whose
selected value is outside the current page. Include a stale revision, changed stock, expired token, duplicate
operation, revoked role and independent failed batch member.

Clock-sensitive scenarios need a recorded date and zone: Friday/holiday working hours, daylight/offset boundaries,
paused and breached SLA episodes, different reopen windows, current/future/ended policies, warranty expiry, RMA
expiry and delayed feedback. An old demo date must not silently turn a live obligation into an irrelevant historical
one. Separate current balances, historical snapshots and per-currency amounts. Use local synthetic rejected/unknown
delivery, carrier and payment outcomes; a missing provider leaves the affected activity unverified.

### Visual and interaction review

- Material `/qapps` is the visual target: default light/dark at **1920×1080**, selected **1280px**, **390px**,
  keyboard-only and actual **200% browser zoom** cases. Record measured dimensions and actual tool capability;
  exclusions from earlier app reviews do not transfer automatically.
- Inspect actual embedded TUI launch, theme changes, list/board equivalents, tabs, pickers, row dialogs, confirmation,
  errors and saved results. Rendered JSON alone is supporting evidence. Give Standard `/apps` a brief functional,
  output and fallback check. PASS Support is a separate browser surface, not a promised terminal application.
- Keep the case/customer/organization, assignee, queue, obligation, status and audience legible. Distinguish internal
  note, customer reply, public forum response and saved-reply action; a send button must not conceal who receives it.
- Apply the guide's composited-background contrast criteria: ordinary text **4.5:1**, qualifying large text **3:1**,
  meaningful controls/states **3:1**. Inspect overdue/paused clocks, priority/status chips, disabled actions, validation,
  focus and customer/internal labels in both themes. Color alone cannot convey a breach or a private audience.
- Use the archetype's identity/status header, one primary action and coherent read-only state. Inspect long case
  conversation/sidebar layouts, preview/confirmation dialogs and form dependencies at narrow widths and zoom.
- Follow finds through saved find/default/reset, paging, columns, sorting, supported list/board views, selection,
  detail and Back. Check board changes against the equivalent row action; no drag-only terminal workflow.
- Test cancel/reopen and stale forms, expected revisions, operation identity, selected-value labels, Enter/Escape,
  focus return and navigation away from asynchronous work. Independent batches name failures and retain successes.
- Review evidence and output contents: customer copy versus internal summary, stored order confirmation, RMA,
  change confirmation, report CSV and captured mail. A download name, queued message or HTTP 200 is not proof of
  correct bytes or delivery. File and export access use the same audience and organization rules as the screen.

### Waves

| Wave | Review work and prerequisite | Activities |
| --- | --- | --- |
| 1 — Foundation and intake | Isolated fixtures, role/scope contrast, shell, customer lookup, case creation and configuration | CS-01–04, 09, 13–14 |
| 2 — Daily service | Conversation, assignment, replies, clocks, merge/split and completion; retain source messages/episodes | CS-05–12, 29–30 |
| 3 — Order continuity | Customer-safe records, availability and controlled changes, with stock/finance fixtures | CS-15–18 |
| 4 — Returns and warranty | Policy, RMA, partial boxes, quality, settlement and warranty with separate authorities | CS-19–23 |
| 5 — Knowledge and feedback | Published/internal/draft knowledge, dated forms, invitations, follow-up and reports | CS-24–28 |
| 6 — Customer handoff | Published disposable PASS site, contact identities and local delivery; bounded Support journeys | CS-31–33 |
| 7 — Reconciliation | Resolve remaining shared-context, mode, access, output and recovery gaps using earlier receipts | CS-34–35 |

Access and audience checks run beside each relevant activity; the last wave closes their gaps instead of replacing
them with a final all-roles/all-modes sweep. One pass can span several bounded batches. This plan does not select
acceptance runs, authorize implementation or change the supplied pre-commit cadence.

## 3. Screen and surface inventory

Routes are relative to `/qapps/`. **B** means this component's `screen/`. Append a local name to its directory and
`.xml` for its source. Current source contains **49 local XML definitions**: the root and 48 below CustomerService.
Recursive physical children plus explicit mounts produce **135 route instances**, including 80 from Shared and six
from Commons. These are inventory candidates, not proof that every route is reachable by every actor. Customer
Service has no app-local `.qvue` or `.tui.json`; inline variants and mounted custom components remain in scope.

### Local routes

| Route prefix / source directory | XML definitions | Activities |
| --- | --- | --- |
| root | `CustomerService` | CS-01, 34–35 |
| `CustomerService/` | `Home` | CS-01, 06, 08, 20, 27–28 |
| `CustomerService/` | `Cases`, `Customers`, `Orders`, `Returns`, `Approvals`, `Availability`, `Knowledge`, `Reports`, `Settings` | Containers/defaults below and their activities |
| `CustomerService/Cases/` | `Cases`, `NewCase`, `ChannelSessions`, `BulkReply` | CS-03–09, 12 |
| `CustomerService/Cases/` | `MergeCases`, `SplitCase`, `CaseSummary` | CS-10–12, 29 |
| `CustomerService/Customers/` | `Customers`, `ContactDetail` | CS-02, 15, 30–31 |
| `CustomerService/Orders/` | `Orders`, `OrderChanges` | CS-15, 17–18 |
| `CustomerService/Returns/` | `Returns`, `NewReturn`, `ReturnAuthorization`, `WarrantyClaims`, `WarrantyAssessment` | CS-19–23 |
| `CustomerService/Availability/` | `Products` | CS-16 |
| `CustomerService/Knowledge/` | `ArticleFeedback`, `CaseToArticle` | CS-24–25 |
| `CustomerService/Reports/` | `ReportsHome`, `ServiceLevelCompliance`, `ResponseTimes`, `CaseVolumes`, `ReturnAnalysis`, `CaseAnalytics` | CS-08, 28 |
| `CustomerService/Settings/` | `SettingsHome`, `ServiceDefaults`, `Queues`, `CaseTypes`, `StatusCategories` | CS-13, 26, 31 |
| `CustomerService/Settings/` | `AgentTeams`, `AssignmentRules`, `SavedReplies`, `ServiceLevelPolicies`, `ChannelRouting`, `CaseTemplates` | CS-06–09, 14 |
| `CustomerService/Settings/` | `ReturnPolicies`, `KnowledgeSources` | CS-19–20, 24–25 |

### Defaults and shared mounts

| Container | Default child | Activities |
| --- | --- | --- |
| CustomerService | Home | CS-01 |
| Cases / Customers / Orders / Returns | Cases / Customers / Orders / Returns | CS-02–04, 15, 19–23 |
| Approvals / Availability / Knowledge | Notifications / Products / Knowledge | CS-17, 20, 16, 24 |
| Reports / Settings | ReportsHome / SettingsHome | CS-13, 28 |
| Customer360 | Context-dependent default; service context opens ServiceOverview | CS-02, 15, 23, 28 |
| Product360 / InventoryAvailability / StockAtDate | Summary / Summary / Places | CS-16, 34–35; confirm the consuming context and actual default navigation |

The routes below mount existing sources. CaseDetail tabs are selected with `tab`, not physical child screens.
ServiceBilling is not a generic payment-maintenance route, and shared Product360's physical children do not make
catalog maintenance part of Customer Service.

| Route under `CustomerService/` | Source under B and context | Activities |
| --- | --- | --- |
| `Chatter`, `Chatter/ChatterTui` | Shared Chatter and terminal helper | CS-05, 30, 34–35 |
| `RecordFiles`, `RecordFiles/RecordFilesTui` | Shared files and terminal helper | CS-30, 34–35 |
| `Approvals/Notifications` | Commons Notifications; decisions return to their source records | CS-17–18, 20, 27, 34 |
| `Cases/CaseDetail` | Shared RequestDetail with CustomerServiceCaseDetail and included reply/channel/knowledge/lineage templates | CS-03–12, 19, 23–25, 29–30 |
| `Cases/WorkItemDetail` | Shared WorkItemDetail, only linked follow-up work the case user may see | CS-04, 23, 30, 34 |
| `Customers/Customer360` | Shared Customer360 with CustomerServiceCustomer360; service tabs below | CS-02, 15, 19, 23, 28, 30–31 |
| `Orders/OrderDetail`, `Orders/ShipmentDetail`, `Orders/InvoiceDetail` | Shared record sources, Customer Service template sections and audience-specific projection | CS-15, 17–22, 30, 34 |
| `Orders/OrderChangeDetail` | Shared OrderChangeDetail; `requestId` identifies the proposal | CS-17–18, 33–34 |
| `Returns/ReturnDetail`, `Returns/QualityInspection` | Shared ReturnDetail/QualityInspection in the service context; W/F operations by their grants | CS-19–22, 34 |
| `Availability/Product360` | Shared Product360 in the customer-safe service context | CS-16, 23, 34 |
| `Availability/InventoryAvailability`, `Availability/StockAtDate`, `Availability/PriceExplain` | Shared stock/current-history/price explanation, each with its own read authority and scope | CS-16–18, 34–35 |
| `Knowledge/Knowledge`, `Knowledge/KnowledgeTui` | Commons Knowledge and terminal sibling, service source selection and case context | CS-24–25, 35 |
| `Knowledge/Knowledge/{Spaces,SpaceDetail,Review}` | Physical Commons Knowledge descendants; wiki permission/context inspection | CS-24–25, 34–35 |
| `Settings/FeedbackForms`, `Settings/FeedbackFormDetail` | Shared SurveyForms/SurveyFormDetail with service feedback context | CS-26–27, 34–35 |
| `Reports/SatisfactionResults`, `Reports/ResponseDetail` | Shared SurveyResponses/SurveyResponseDetail with invitation/case association checks | CS-27–28, 34–35 |

Account for inherited children explicitly; hidden or excluded variants belong to CS-34 supporting inspections with
an authorized counterpart, not to invented service workflows:

| Parent / descendant set | Service presentation or inspection boundary |
| --- | --- |
| Customer360 service children | `ServiceOverview`, `ServiceCases`, `ServiceOrders`, `ServiceBilling`, `ServiceActivities`, `ServiceStatistics`, `ServiceDeliveredItems`, `ServiceReturns`: customer-safe contact, case/order/billing/activity, measures, serial/warranty and return work in CS-02/15/19/23/28 |
| Customer360 other children | `Contact`, `Orders`, `Money`, `Credit`, `Agreements`, `Activities`, `FinanceDetails`, `Files`, hidden `InsightsRecord`: inspect current tab admission, direct requests and their separate read/write rules; no payment credentials or another organization's records |
| Product360 physical children | `Summary`, `Features`, `Categories`, `Identifiers`, `Dimensions`, `Documents`, `Equipment`, `Associations`, `Parties`, `Connections`, `History`, `Replenishment`, `PurchaseHistory`, `PaidAccess`, `KitComponents`, hidden `InsightsRecord`: inspect advertised service tabs and excluded direct children separately |
| Product360 mounted children | `Packaging`, `Prices`, `Suppliers`, `Costs`, `Stock`, `BOM`: Shared Packaging/Prices/SupplierPrices/StandardCosts/InventoryAvailability/BillOfMaterialsDetail; service read never implies cost/supplier-price or method-edit authority |
| Product360 nested children | `Documents/Index`; Stock's `Summary`, `Projection`, `Policy`, `Locations`, `Movements`, `Reservations`; BOM's `Overview`, `BillOfMaterialsExplosion`, `BillOfMaterialsCompare`, `WhereUsed`, `RoutingDetail`; include choices/helpers and denied-context inspection |
| Independent InventoryAvailability | The same six stock children at `Availability/InventoryAvailability`; inspect both consuming paths without treating one success as proof of the other's context |
| StockAtDate | `Places`, `History`; cutoff date, customer-serving facility and drill-back in CS-16 |
| Knowledge and record helpers | Knowledge's three children and terminal sibling, ChatterTui, RecordFilesTui, shared choice/file/print/preview endpoints; no extra authority from a helper URL |

### Dialogs, custom modes, outputs and embedded surfaces

| Surface family | Supporting inspection and recovery | Activities |
| --- | --- | --- |
| Case creation and template inputs | Identify customer/contact/type/queue; duplicate/articles; dependent fields and submit; cancel/back after a source change | CS-03, 14 |
| Case record | Resolve/Reopen, Assign, status move, priority, queue, tags, follow-up work, SLA correction; Conversation, Saved reply, Overview, Work, Files, Service level, Knowledge tabs | CS-04–08, 12, 24, 30 |
| Case bulk/relations | List/board status action, bulk assignment/status/tag/reply, Merge preview/confirm, Split message selection, follow-up dialog | CS-06–07, 10–12 |
| Channels and replies | Call log, public forum preview/publish, saved-reply preview/actions, send/retry and message/file audience | CS-05, 07, 09 |
| Customer and commercial records | Contact/consent inputs, Support invitation, stored confirmation download/resend, link case, invoice copy, order-change proposal/preview/decision/apply/withdraw/send | CS-02, 15, 17–18, 31 |
| Returns | Source/lines/preview, authorize/exception, line edit, assign, label, close remainder, cancel, RMA send/print, receive each box, settle preview/confirm | CS-19–22 |
| Warranty | Evidence/coverage trace, decision, goodwill override, repair link/update, customer consent and replacement handoff | CS-23 |
| Knowledge | Search/link/unlink/send/rate/suggest edit; CaseToArticle answer selection/redacted preview; ArticleFeedback review; source change/end | CS-24–25 |
| Feedback | Shared form create/copy/publish/dated question edits, invitation policy, results/detail and follow-up; public answer page | CS-26–27 |
| Configuration | Queue/team/membership/hours/participation, assignment rule/conditions/preview, status mapping/moves, case types/defaults, SLA simulation, template dependencies/preview, channel token/held intake and return-policy preview | CS-06–09, 13–14, 19, 26, 31 |
| Physical/retained outputs | CaseSummary customer/internal, ReturnAuthorization, stored confirmation/change/RMA/summary files, captured mail and label bytes | CS-15, 17, 20, 22, 29–30 |
| Analytical outputs | Four explicit report CSVs; CaseAnalytics event-list CSV; survey results/detail as currently offered; inspect data and audience, not only download success | CS-27–28 |
| Shared stock outputs | StockAtDate/Places and StockAtDate/History expose CSV and XLSX; inspect workbook cells, filters, columns, cutoff and restricted values through this service mount | CS-16, 28, 34–35 |
| Inherited price outputs | Product360/Prices and Product360/Suppliers inherit Shared Prices/SupplierPrices CSV and XLSX controls; inspect direct denied-context output with an authorized owning-app counterpart, not a promise of service pricing authority | CS-16, 34–35 |
| Shell and adjacent entries | Case/RMA quick create, case/customer/order/RMA palette, Today, assignment/SLA/reply/order-change/return/warranty/feedback topics, call-context provider and `g v/c/u/o/r` shortcuts | CS-01, 05, 08–09, 17, 20, 23, 27 |

There are authored inline qvt/tui/html sections in Cases, BulkReply, ChannelSessions, Customers, Orders,
OrderChanges, Returns, WarrantyClaims, WarrantyAssessment, ArticleFeedback, AssignmentRules, CaseTemplates,
CaseTypes, ChannelRouting, KnowledgeSources, SavedReplies, ServiceLevelPolicies and SettingsHome. CaseSummary and
ReturnAuthorization additionally author html-print content. Inspect these and their shared/template counterparts
at the relevant activities; common XML rendering alone does not establish parity.

The four owned reporting services have explicit `exportCsv` endpoints; CaseAnalytics uses its event-list CSV
control. The shared StockAtDate and inherited Prices/SupplierPrices workbook variants above need their own inspected
XLSX receipt: a CSV result does not establish correct workbook rows, typed quantities/dates or restricted-value
omission. Inspect generic list exports only where the actual rendered control offers them.

Commons Knowledge, Chatter and RecordFiles bring custom browser components and terminal alternatives. Shared survey
screens and form previews bring their own response/dependency behavior. PASS Support has nine XML child screens with
`.html.fancy` templates: `SupportHome`, `MyCases`, `NewCustomerCase`, `CustomerCase`, `MyReturns`, `RequestReturn`,
`CustomerReturn`, `CustomerArticle`, `Feedback`; the root defaults to SupportHome. Include reply/reopen/cancel/file,
case submit/order-cancel, return submit/evidence/withdraw/label, article rating and feedback submit endpoints in the
public activity. Include the guest Shop order-link entry to `NewCustomerCase` and `RequestReturn` under CS-32–33,
with its one-order capability and receipt/state-notice outcomes. These are routes under the configured Support
mount, not `/qapps/CustomerService` children.

### Design-to-code reconciliation

| Design or historical statement | Current review treatment |
| --- | --- |
| Pre-build placeholders, proposed groups, statuses and case rules | Historical introductions; actual roots, grants, Mantle services and seeded workflow/status mappings govern this plan |
| CaseDetail pictured as independent screen with child tabs | Shared RequestDetail's Customer Service section; tab query values select its embedded panels; there is no physical CaseDetail child tree |
| Reports/Settings named as same-name list routes | Actual defaults are `Reports/ReportsHome`, `Settings/SettingsHome`; feedback forms/results are explicit shared mounts |
| CaseDetail Items and internal-summary template answers in implementation §7 | Treat the current absence/limited output as an explicit inspection boundary; do not promise an Items tab or internal answer export without checking source |
| CustomerServiceImplementation notes | No such separate current guide; use design/impl/research, sources and current specs |
| Other app contexts/callers listed as future | Sales, Commerce, Insights and Admin have since changed; inspect current bounded links and permissions, preserving Customer Service's own apply restrictions |
| Availability projection beyond older Products/Warehouse baseline | Read current readiness/provenance; unready is not zero, and quantity is not a reservation or ship-date promise |
| Knowledge suggestions and external sources | Current service wiki sources, multilingual suggestions, draft/internal labels and feedback are built; new external connector/ranking features remain separate |
| ResponseTimes next-response clock; ReturnAnalysis shipped-denominator/refund metrics; historical backlog | Keep actual implemented measures and basis explicit; old desired metrics do not become claims of current completeness |
| Presence/typing, case time logging, ChannelAutomation and repair quote/intervention report | Inspect only any current supplied widget; dedicated unbuilt workflows are not completion requirements |
| PASS Support terminal and generic public case access | Support is browser/facade based; public form submission, signed-in contact/customer-admin access, feedback tokens and return capabilities have different contracts |
| Older fixture/walk names and totals | Use §5's current file/registration inventory; previous passes do not establish this review's results |

## 4. End-to-end activities

These are instructions for later authorized review, not records of executed work. Follow visible navigation and
controls, inspect intermediate states and persisted outcomes, and keep recovery and mode gaps in §6. Browser means
Material light/dark; actual TUI and Standard checks follow §2. Apply selected narrow, keyboard and zoom checks where
interaction/layout differs. A source inspection, service call or successful render cannot close a user activity.

### CS-01 — Start a service workday in the right scope

- **Actor/start:** agent, manager and reader, with populated/empty queues and a multi-organization counterpart.
- **Objective/steps:** open Customer Service → inspect organization and Home's period/basis → follow My cases,
  team queues, returns awaiting approval and permitted metric links → record → Back. Open Today and a notification,
  search the palette, use a visible shortcut and open/cancel/reopen New case and Request return where offered.
- **Expected:** Home and destination rows use the same scope; missing configuration is distinct from zero activity;
  denominators and read time explain measures; readers retain useful navigation without acquiring another area's
  actions. A quick create starts clean rather than inheriting the previous record's identity.
- **Recovery:** no service organization, no matching queue/cases, unavailable record, changed active organization,
  denied area and one failing independent aggregate. Record whether other panels remain usable.
- **Screens/modes:** root/Home, section defaults, shell providers and representative lists; browser/TUI/Standard,
  keyboard, 390px and zoom samples. CS-28 supplies the detailed metric reconciliation.

### CS-02 — Identify the customer and reach the right contact record

- **Actor/start:** agent and contact editor where separately permitted; individual, company/shared customer and
  another organization's customer, with similar names and one email/phone matching several contacts.
- **Objective/steps:** Customers → search by customer name, email, phone and exact identifier → Customer360 →
  ServiceOverview/contact details → ContactDetail → inspect permitted contact and consent actions → return to the
  customer's cases and orders. Follow the same customer from a case and an order to compare context.
- **Expected:** names disambiguate results; company/customer/contact identities remain distinct; a shared customer
  shows only current service organizations' records. Contact editing and Support invitation are separate grants;
  consent explains its purpose and existing state rather than implying blanket permission to send.
- **Recovery:** no match, stale contact, private contact field, denied edit, wrong customer, canceled dialog and
  selected choice outside the first result page. A foreign and a nonexistent record have equally limited answers.
- **Screens/modes:** Customers, Customer360/ServiceOverview, ContactDetail and contact/consent templates;
  browser/TUI/Standard, long names and keyboard/narrow forms. Invitation continues in CS-31.

### CS-03 — Create a case with the right source and template

- **Actor/start:** agent with a customer/contact, queue/type and published template; existing similar cases and
  suggested articles, plus a warranty-type alternative.
- **Objective/steps:** quick create, Customers or a source record → NewCase → identify customer and source → inspect
  duplicates/articles → choose offered organization/type/queue/template → enter subject, channel, description and
  dependent fields → submit → open CaseDetail and confirm customer, source links, assignment and template values.
- **Expected:** duplicate information helps a decision without blocking a distinct case; validation explains the
  field required by the chosen template; a successful create has the intended Request/profile/parties and no partial
  case from a refused template. Warranty intake uses its current type/template rather than a generic field set.
- **Recovery:** missing required conditional value, queue not offering the type, foreign customer, unavailable
  template, changing customer after choosing a source and invalid delivered serial. Preserve useful inputs and
  inspect the historical warranty-intake limitation before classifying any source concern as reproduced.
- **Screens/modes:** NewCase, duplicate/article lists, template preview/render and CaseDetail; browser/TUI/Standard,
  keyboard and 390px dependency/validation sample. Template maintenance is CS-14.

### CS-04 — Work a case and coordinate its follow-up tasks

- **Actor/start:** case editor, reader and assigned worker; open case with linked order, files and a follow-up task.
- **Objective/steps:** Cases → find/list/board → CaseDetail → inspect header, Overview and related records → change
  priority, queue, tags and permitted status with reason → Work → create/open/complete a follow-up task → return.
  Compare the status action with the corresponding board move and test Back to the retained list filter.
- **Expected:** the next action and customer-facing state are understandable; record changes preserve the case's
  organization/customer and revision; work completion notifies the case owner but does not silently resolve the
  case. Shared task/request context does not bypass service status or due-date rules.
- **Recovery:** stale case revision, unavailable queue/assignee, prohibited transition, canceled edit, removed task
  link and another app opening the same case with fewer rights. A rejected board move returns to the actual state.
- **Screens/modes:** Cases, CaseDetail Overview/Work, WorkItemDetail, Commons/Projects bounded request counterpart;
  browser/TUI/Standard, keyboard equivalent to drag and two-row action/dialog checks.

### CS-05 — Reply, note and log a conversation with the correct audience

- **Actor/start:** agent on a case with customer mail, internal notes, attachments and a local call/forum example;
  customer contact and non-holder as audience counterparts.
- **Objective/steps:** CaseDetail → Conversation → inspect thread/source/time → add internal note → prepare a
  customer reply with permitted attachment → confirm recipient/audience → send through local capture → reopen the
  message and its status. Log a call from the case or ChannelSessions; for an escalated forum topic preview the
  public reply and explicitly publish to the disposable local topic.
- **Expected:** internal, customer and public content remain distinguishable; the sent message is on the original
  case/thread; only an accepted outward reply satisfies first response. Call outcome/duration and forum source are
  retained. A general comment or private note never becomes a public forum response.
- **Recovery:** failed local send, unknown outcome, inaccessible attachment, missing account/recipient, canceled
  public preview, changed case and duplicate retry. Inspect the existing message identity before retrying a send.
- **Screens/modes:** CaseDetail Conversation, Chatter/Compose, ChannelSessions/call log and forum preview;
  browser/TUI/Standard with truthful rich-editor/delegation limits and inspected captured recipients/content.

### CS-06 — Assign work fairly and explain an unassigned case

- **Actor/start:** manager/configurator, two eligible team agents with different working hours/load, expired member
  and a queue with no eligible agent; current and future assignment rules.
- **Objective/steps:** Settings → AgentTeams → inspect/edit permitted membership, participation, capacity and hours
  → AssignmentRules → add/change condition and preview eligible candidates → publish/save as offered → create
  controlled intakes → inspect assignment and its explanation. Reassign a case and run a mixed-validity bulk assign.
- **Expected:** active memberships, hours, capacity and rule order explain the chosen agent; no eligible agent
  leaves explicit unassigned work and a manager notice. Reassignment retains the SLA history. Each bulk member has
  a result; a foreign/refused case does not erase successful assignments.
- **Recovery:** overlapping/ended membership, invalid rule, unavailable selected agent, two simultaneous intakes,
  stale case, canceled rule/assignment and no eligible candidate. Prepare concurrent intake locally when authorized.
- **Screens/modes:** AgentTeams, AssignmentRules, Cases, CaseDetail Assign and Home queues;
  browser/TUI/Standard, preview readability, row-specific dialogs and keyboard/narrow sample.

### CS-07 — Preview and apply saved replies, singly and in a batch

- **Actor/start:** agent owning a personal reply, team-shared and organization-shared replies, cases with different
  recipients/revisions, and one deliberately invalid or inaccessible selected case.
- **Objective/steps:** Settings/SavedReplies → create/edit text and permitted tag/status actions → preview on a
  case → CaseDetail Saved reply → choose reply → inspect expanded subject, recipient, text, actions and problems
  → confirm apply/send → inspect message and case result. Select several cases → BulkReply → review per-case
  previews → confirm → inspect successes, refusals and the offered retry route for a failed message.
- **Expected:** text sharing follows actual group membership and ownership; variables/actions are checked per
  case; confirmation applies the previewed revision. Batch replies remain separate customer threads, and operation
  retries do not reapply an action or send the same recorded message twice.
- **Recovery:** missing variable, disallowed transition, changed revision, expired team share, another owner's edit,
  canceled preview and a delivery failure after a case action. The result must explain partial outcomes truthfully.
- **Screens/modes:** SavedReplies, CaseDetail Saved reply, BulkReply and captured mail;
  browser/TUI/Standard, long text, preview/confirm focus and selected-count checks.

### CS-08 — Explain service clocks, pauses and a corrected obligation

- **Actor/start:** service administrator/manager and agent; first-response/resolution clocks across a holiday,
  a paused case, an overdue clock, a reopened episode and a future policy row.
- **Objective/steps:** ServiceLevelPolicies → inspect targets/calendar → simulate intake and due times → save the
  dated policy → create a consuming case → inspect header clock cards and Service level tab → send a real captured
  reply → wait for customer → resume → resolve/reopen. Use a separately permitted correction with reason and read
  CaseAnalytics/events; follow the SLA warning/breach notice back to the case.
- **Expected:** business versus elapsed time, timezone/calendar and policy basis are explicit; an internal note or
  failed send does not meet first response; customer waiting and internal hold differ as the current policy says.
  Reopen retains earlier breach history, and a later policy does not rewrite an existing episode.
- **Recovery:** missing calendar, invalid targets, boundary dates, canceled correction, wrong case/clock and an
  independent scan failure. Use controlled due fixtures; do not infer all clocks worked from one notification.
- **Screens/modes:** ServiceLevelPolicies/simulation, CaseDetail Service level, CaseAnalytics and Home;
  browser/TUI/Standard, long clock labels, contrast, keyboard and date-zone samples.

### CS-09 — Route intake and recover held channel submissions

- **Actor/start:** administrator and agent, known/unknown customer senders, local mail/chat/forum fixtures and
  a disposable public form token; preserve the existing non-service request counterpart.
- **Objective/steps:** ChannelRouting → inspect routes and owning organization/queue/type → add/change/end a route
  → test its resolution → issue token → submit a local form → revoke token → inspect refusal. Deliver controlled
  customer mail/reply/auto-submitted mail; review an unknown sender held for triage → accept or dismiss → inspect
  case source/time/acknowledgment. Escalate a local chat/forum item and follow ChannelSessions/call-context links.
- **Expected:** intake lands in the chosen service queue with original provenance and received time; acknowledgments
  are not duplicated; auto-replies do not trigger reply loops. Public form submission reads no existing case. Ordinary
  employee/project requests retain their own behavior, and a held record exposes no other customer's content.
- **Recovery:** revoked/expired token, unknown sender, disabled route, unsupported type, duplicate delivery, malformed
  input and failed independent item. Distinguish a local integration limitation from an observed routing defect.
- **Screens/modes:** ChannelRouting and held/token forms, ChannelSessions, CaseDetail, bounded Comms/Forum source;
  browser/TUI/Standard for staff, browser/HTTP public handoff and captured messages.

### CS-10 — Merge duplicate cases without losing their history

- **Actor/start:** manager with two same-customer cases, messages/files and distinct SLA history; different-customer
  and unavailable cases as negative counterparts.
- **Objective/steps:** source CaseDetail → Merge cases → choose kept case → preview comparison, carried clocks and
  problems → cancel/reopen → confirm at the shown revisions → inspect source's merged destination, retained
  histories and kept case's conversation/work/records. Follow both old record links and customer-facing views.
- **Expected:** confirmation names source and kept case; content/history remains attributable; the source's breach
  does not disappear, and the kept case's active obligation remains intelligible. Merged intake is not counted twice
  in backlog or used to expose private evidence to a different customer.
- **Recovery:** different customer/organization, stale source or target, unsupported state, target selected as itself,
  canceled confirmation and same-key retry. A refused merge leaves both cases and their histories intact.
- **Screens/modes:** MergeCases and both CaseDetail records, report and public lineage checks;
  browser/TUI/Standard with comparison at narrow width and keyboard focus return.

### CS-11 — Split a distinct issue into a linked case

- **Actor/start:** case editor on a case with several inbound/outward/internal messages and existing work;
  a selected message with a different received time.
- **Objective/steps:** CaseDetail → Split into a new case → select permitted messages → preview the new issue →
  choose subject/queue and confirm → inspect new and original case, linked lineage, message attribution, customer,
  assignment and clock start. Return through each case link and the original queue filter.
- **Expected:** the new case records why and where it came from, starts its clock from the selected source as the
  rule defines, and retains the same customer boundary; the original stays open unless separately resolved.
  Attachments and message audience follow their actual association rather than a blanket public copy.
- **Recovery:** no messages, foreign/unavailable message, changed revision, invalid destination queue, canceled
  preview and retry. Verify what remains on the original and what the new case actually carries.
- **Screens/modes:** SplitCase, both CaseDetail records, lineage and Service level panels;
  browser/TUI/Standard, selection/count wording, long previews and keyboard/narrow layout.

### CS-12 — Resolve, reopen, close and follow up with a clear history

- **Actor/start:** agent and customer contact, cases within/outside the configured reopen window, a resolved case
  awaiting auto-close, and incomplete follow-up work.
- **Objective/steps:** CaseDetail → Resolve with required explanation → inspect state and customer label → customer
  reply inside the window → inspect reopened episode → resolve another case and exercise a prepared reply outside
  the window → inspect linked follow-up. Observe an eligible auto-close and its repeat, then use the explicit
  Follow-up action where offered. Inspect feedback invitation consequences without assuming delivery occurred.
- **Expected:** resolution, closed date and new follow-up are distinct; case history and prior SLA breach remain;
  customer communication finds the correct active case. Auto-close is repeatable and does not falsely change the
  business status or discard outstanding evidence; completing a task alone does not resolve the case.
- **Recovery:** missing resolution, canceled resolve, stale case, customer outside scope, changed window and failure
  in one independent due item. Record any still-open work and why it does or does not block the current action.
- **Screens/modes:** CaseDetail, Cases, lineage, customer Support view and notification/feedback handoff;
  browser/TUI/Standard for staff, public browser and controlled clock fixtures.

### CS-13 — Configure service defaults, queues and status vocabulary

- **Actor/start:** service administrator with a disposable organization and agent/manager consumers; existing
  organization configuration saved for restoration.
- **Objective/steps:** SettingsHome → select organization → ServiceDefaults → inspect/change default queue,
  workflow, unknown-sender handling and resolution/reopen/close policies → Queues → tree/visibility/type choices →
  CaseTypes and StatusCategories → edit customer labels and permitted moves → create or move a consuming case.
- **Expected:** settings describe the resulting customer/agent behavior; dated changes retain prior facts and the
  active organization is clear. Queue visibility, responsible team and offered types are separate choices. Status
  labels shown to customers can differ from internal labels without changing the underlying case unexpectedly.
- **Recovery:** no configured service policy, invalid/default queue, incompatible transition, missing reason,
  foreign team/type, canceled edit and changed organization with unsaved fields. The first service policy's effect
  on intake must be deliberate; restore configuration after the disposable verification.
- **Screens/modes:** SettingsHome, ServiceDefaults, Queues, CaseTypes, StatusCategories and consuming case;
  browser/TUI/Standard with long forms, two-row dialogs and dependent-choice checks.

### CS-14 — Publish a case template and preserve earlier answers

- **Actor/start:** administrator/author, internal agent and customer-facing fixture; draft/published template,
  conditional required field and an earlier submitted response.
- **Objective/steps:** CaseTemplates → new/copy as offered → add/edit/end fields and conditions → preview agent and
  customer variants → check invalid/missing values → publish from a date → assign to queue/type → submit through
  NewCase and Support → change a field with a successor date → reopen the earlier response.
- **Expected:** the dependency explanation and required state are understandable; cycles are refused; internal
  fields never enter customer-facing inputs or answers. Earlier answers retain the effective form at submission,
  and ending a field does not destroy recorded data. A queue uses only the appropriate published template.
- **Recovery:** dependency cycle, impossible required value, draft/unavailable template, missing server-required
  value, canceled publication and concurrent edit. Record the known browser `require-when` limitations separately
  from server validation; do not infer browser completeness from a refused server submit.
- **Screens/modes:** CaseTemplates field/condition/previews, NewCase, CaseDetail values and Support input;
  browser/TUI/Standard for staff, 390px/keyboard and public browser counterparts.

### CS-15 — Explain an order, shipment and invoice to the customer

- **Actor/start:** agent, price reader, receivables reader and invoice-copy holder; delivered, awaiting-pick, packed,
  held and inaccessible sales records with stored confirmation and captured sender accounts.
- **Objective/steps:** Orders or Customer360 ServiceOrders → find exact order/email → OrderDetail → read hold,
  line/fulfillment status and linked case → link to case → inspect shipment/packages/tracking and delivery update →
  InvoiceDetail → inspect permitted amount/payment state → send copy if authorized. Download/resend the stored
  order confirmation, inspect each send record and return to the original case/filter.
- **Expected:** fulfillment, invoicing and payment are distinguishable; a stored confirmation remains the issued
  version even after later operational changes. Order amounts, invoice amounts and credit status use their actual
  separate grants; missing authority withholds values rather than displaying zero. Shipment context has no stock action.
- **Recovery:** missing stored document, invalid recipient, foreign or missing record, denied amount/copy, failed
  captured send, canceled resend and retry. A second deliberate resend is a recorded send of the same stored version,
  while retrying one operation must not create an accidental duplicate.
- **Screens/modes:** Orders, Customer360 service tabs, OrderDetail, ShipmentDetail, InvoiceDetail and output;
  browser/TUI/Standard, long item/customer names, masked details and actual retained/captured bytes.

### CS-16 — Explain availability and product alternatives without inventing a promise

- **Actor/start:** agent and price reader; stocked/short/held product, unready projection, multiple serving
  facilities, dated history and equivalent/replacement product with usability restrictions.
- **Objective/steps:** Availability/Products → Product360 → inspect identifiers, warranty, stock and permitted
  customer-facing product information → InventoryAvailability Summary/Projection/Locations/Movements/Reservations
  → StockAtDate Places/History with cutoff → follow permitted PriceExplain for a specific customer/order basis.
  Return to the case/order with product and facility context intact.
- **Expected:** on hand, available, reserved, expected and held quantities and readiness/provenance are intelligible;
  unknown is never zero or a confirmed delivery date. Price explanation retains date, customer, currency and unit;
  no cost or supplier-price data appears merely because the actor can read a sales price.
- **Recovery:** projection unavailable, foreign facility, expired/unusable substitute, missing unit conversion,
  no price permission, invalid historical date and stale record. A historical quantity is not an available allocation.
- **Screens/modes:** Products/Product360, both inherited and direct stock mounts, StockAtDate, PriceExplain;
  browser/TUI/Standard, selected-value choice, date/unit and phone column checks. Export both StockAtDate Places
  and History to CSV and XLSX; inspect actual headers, filtered rows, typed values, cutoff and scope. Inherited
  Prices/SupplierPrices exports belong to CS-34's denied-context/owning-holder pair.

### CS-17 — Apply a controlled cancellation or short-pick substitution

- **Actor/start:** order desk/requester, independent change approver, stock counterpart and a customer-consent
  reference; short pick and packed-but-not-shipped fixtures with a current commercial revision.
- **Objective/steps:** OrderDetail or case → Propose change → choose cancel/substitute lines and quantities → read
  impact/consent → submit → approver decides → return to OrderChangeDetail → preview current effects → explicitly
  confirm Apply → inspect reservations/picks, reopened package if relevant, replacement line, held state and stored
  confirmation. Follow resulting Warehouse/Accounting records only for the necessary outcome.
- **Expected:** the confirmed proposal/revision and actual stock/billing inputs agree; the original short remainder
  is handled once and the replacement is priced/reserved through the order rules. Between pack and ship the current
  package/draft invoice is adjusted through existing guarded operations; unrelated Credit holds remain in force.
- **Recovery:** changed pick/reservation, stale order/proposal, finalized billing conflict, shipped quantity, closed
  period, invalid substitute, canceled apply and same-key retry. Refusal preserves the order and explains the next
  useful action; it does not quietly repeat reservation, invoice or customer-mail side effects.
- **Screens/modes:** OrderDetail, OrderChanges, OrderChangeDetail and bounded pick/package/invoice handoff;
  browser/TUI/Standard, quantity/consent preview, keyboard confirm and retained output inspection.

### CS-18 — Route a commercial change and preserve independent holds

- **Actor/start:** service requester, same-organization commercial approver with `SALES_APPROVE`, order owner and
  ordinary service manager; price/quantity-increase/date/address/shipping proposal and an independently held order.
- **Objective/steps:** file the supported commercial-kind proposal with reason and source revision → inspect its
  approval notice and impact → qualified approver decides → inspect the owning-order handoff and why Customer
  Service cannot apply that kind. Separately withdraw a proposal or inspect an offered hold-release action using
  its dedicated grant; follow the current owner route only for this bounded continuation.
- **Expected:** approval is not application, service-manager authority is not commercial approval, and a proposal's
  state and next responsible party are clear. Withdrawing/releasing the change's hold does not clear a Credit or
  other independent hold. Where the owner continuation is not available, record the gap honestly.
- **Recovery:** stale revision, expired approval, wrong kind/authority, changed order state, canceled withdrawal and
  a holder lacking the destination app root. Customer Service must not claim an approved price change was applied.
- **Screens/modes:** OrderChanges, OrderChangeDetail, source OrderDetail, Notifications and current owner handoff;
  browser/TUI/Standard and context-preserving Back. This is not a full Sales review.

### CS-19 — Request a return under an explainable policy

- **Actor/start:** agent/return authorizer, delivered order with partly returnable lines, existing RMA, receiptless
  request and a customer/order with no applicable published policy.
- **Objective/steps:** case, customer or order → Request return → identify source/customer → select eligible lines,
  quantities, reason and proposed remedy → preview policy/window/evidence → submit → inspect linked ReturnDetail
  and case. In a separate configuration fixture use ReturnPolicies to preview a dated rule and its reason/remedy
  labels, save/end a rule and verify the intended future request without rewriting the earlier decision.
- **Expected:** shipped, previously returned and currently eligible quantities are clear; policy explains window,
  evidence, fee/remedy and manual-review needs. The customer's requested remedy is not an approved refund. Two
  drafts cannot collectively authorize more than the permitted source quantity.
- **Recovery:** excess quantity, other customer's order, missing evidence, expired window, wrong/changed policy,
  duplicate submit and no applicable policy. Preserve entered reason and identify the need for manual review rather
  than silently inventing an authorization.
- **Screens/modes:** NewReturn, Returns, ReturnPolicies and ReturnDetail; browser/TUI/Standard,
  line selection, fractional quantity, dated-rule and keyboard/narrow checks.

### CS-20 — Authorize an RMA, resolve an exception and issue its evidence

- **Actor/start:** return authorizer, independent exception approver and ordinary agent; requested/exception/expired
  returns, local carrier response and captured sender, with known initial financial balances.
- **Objective/steps:** Returns or Home → ReturnDetail → inspect policy/line evidence → request exception if needed
  → approver decides at its revision → authorize → inspect shipment, expiry, decision and stored RMA → assign,
  request label → print/download/send authorization → inspect bytes and captured recipient. Exercise batch
  authorize/cancel with an independent refused member; close a remainder or cancel an untouched return separately.
- **Expected:** authorization creates the authorized state and shipment, not a credit or replacement. Immediate
  response flags require their policy/financial checks but do not themselves settle here. Repeated label/operation
  requests retain one recorded result; render/send failures do not falsely imply the authorization rolled back.
- **Recovery:** stale exception/return revision, missing manual reason, denied decision, carrier/print failure,
  unknown send outcome, canceled action, same-key retry and cancel after a physical/financial effect. Explain what
  is complete and what still needs attention.
- **Screens/modes:** Returns, ReturnDetail dialogs, ReturnAuthorization, Notifications and captured files/mail;
  browser/TUI/Standard with confirmation identity, row-specific actions and actual label/RMA content type.

### CS-21 — Receive partial boxes and record the quality disposition

- **Actor/start:** `STOCK_RECEIVE` agent, inspector, separate disposer and plain service reader; authorized return
  in an organization using separate settlement, return shipment and multiple boxes including a rejection.
- **Objective/steps:** ReturnDetail → Receive a box of an item → enter accepted/rejected quantities, reason and
  tracking identity → confirm → inspect receipt, received quantity, quarantine and inspection → receive the next
  box → open QualityInspection → record readings → submit/verify/dispose as authorized → return to the RMA.
- **Expected:** authorized, physically received, accepted, rejected, held and settled quantities stay distinct.
  `receive#ReturnItems` records physical receipt without changing the authorization or settling a response; accepted
  receipts enter quarantine with inspection under the keyed Warehouse path. Release/scrap/other disposition is a
  quality decision, not a consequence of merely choosing Receive. The service reader sees progress without actions.
- **Recovery:** over-receipt, duplicate serial, missing rejection reason, wrong facility, stale/closed return,
  closed posting day, canceled action and same-key retry. Pair borrowed stock/quality grants with equivalent
  non-holders; no Warehouse launcher is needed for the authorized service-context action.
- **Screens/modes:** ReturnDetail, QualityInspection and resulting Warehouse-owned records;
  browser/TUI/Standard, phone/manual/scan equivalents actually offered, clear posting and quantity outcomes.

### CS-22 — Settle a return and distinguish a pending refund

- **Actor/start:** same-organization AR holder, separate treasury/refund holder and receiptless-credit approver;
  partially received return, original invoice/payment, open book day and synthetic gateway outcomes.
- **Objective/steps:** ReturnDetail → inspect settlement summary/eligibility → preview → confirm the current version
  → inspect credit, replacement or original-payment refund result → reload the return and appropriate financial
  record. Use separate fixtures for receiptless credit, stale receipt and a declined or pending gateway outcome.
- **Expected:** financial authority is independent of return authorization and receipt; customer credit/replacement
  requires `RECEIVABLE_EDIT`, refund also `PAYMENT_EDIT`, receiptless credit also `RETURN_CREDIT_APPROVE`.
  Settlement is recorded once before individual gateway attempts; an external refund failure does not imply every
  settled credit rolled back. Pending/declined outcomes name the real state and supported next action.
- **Recovery:** changed receipt/preview, cap exceeded, closed period, refund pending, wrong original payment,
  canceled confirmation and duplicate operation. Inspect original-payment/gateway history before retrying; the
  service UI's success text alone does not establish that money moved.
- **Screens/modes:** ReturnDetail settlement dialog, Accounting return/credit/payment counterpart and output;
  browser/TUI/Standard, withheld versus zero amounts, currency and actual persisted/synthetic gateway evidence.

### CS-23 — Assess warranty coverage and follow the repair or replacement

- **Actor/start:** agent and warranty approver, delivered serialized product, valid/expired coverage and service
  agreement, prior claim, ordinary repair and goodwill/chargeable alternative with customer consent.
- **Objective/steps:** Customer360 Delivered items or NewCase warranty type → WarrantyAssessment → record evidence
  → inspect ship date, term/agreement, coverage end and trace → decide covered/partial/rejected or authorized
  goodwill override with reason → add/update repair → inspect task/result notice → return to the case. For a
  replacement follow NewReturn and its existing authorization/receipt/settlement flow.
- **Expected:** coverage states its source rather than a bare yes/no; decision binds claim revision and retains
  previous decisions. A repair completion tells the case owner but leaves case resolution explicit. A charge estimate
  and consent are not a completed sales quote or payment, and replacement does not bypass return controls.
- **Recovery:** another customer's or resold serial, missing issuance/term, changed evidence, expired coverage,
  denied goodwill, canceled repair/decision and retry. Check the historical NewCase serial limitation against the
  current behavior without calling it newly reproduced from source alone.
- **Screens/modes:** WarrantyClaims, WarrantyAssessment, CaseDetail, ServiceDeliveredItems and repair task/RMA;
  browser/TUI/Standard with long coverage trace, date boundary and confirmation/consent readability.

### CS-24 — Find and send a useful published answer

- **Actor/start:** agent and knowledge reader with English/Spanish customer cases, published customer article,
  internal article, draft, ended source and a customer-facing counterpart.
- **Objective/steps:** CaseDetail Knowledge → search suggestions → inspect language/state/audience → open Commons
  Knowledge with case context → link an article → Send to customer → inspect the public address in Compose and
  captured message → return. Inspect permitted rating, unlink and Suggest an edit actions; change KnowledgeSources
  only in a separate authorized fixture and verify its consumer.
- **Expected:** suggestions are useful and visibly distinguish draft/internal material; sending uses the current
  published customer/public link and preserves case association. A draft or internal article cannot be sent through
  the public-link action. Wiki access is still checked independently of service source membership.
- **Recovery:** unpublished/ended source, missing language, denied wiki page, stale article, canceled send and
  another customer's case. An unavailable search/source should not masquerade as authoritative absence of help.
- **Screens/modes:** CaseDetail Knowledge, Knowledge/Knowledge and KnowledgeTui, KnowledgeSources, Compose;
  browser/TUI/Standard, selected narrow/keyboard reading and bounded public article follow-through.

### CS-25 — Turn a resolved answer into a draft and review article feedback

- **Actor/start:** knowledge author/manager with a case containing outward answers, internal notes, private fields,
  personal data and an article's helpful/unhelpful feedback from multiple cases.
- **Objective/steps:** CaseDetail → Make an article → select permitted answers → inspect redacted preview and target
  draft space → create → open the unpublished draft and its case link. ArticleFeedback → filter → inspect article
  version/context → record review/action and optional task → return to the article/case.
- **Expected:** the author sees and approves what will become knowledge; internal notes are excluded from offered
  source answers, redaction is visible and draft creation does not publish. Feedback retains the version and permitted
  case context; review/task creation does not silently rewrite the article. Independent failures are named.
- **Recovery:** no useful outward answer, remaining personal data, foreign draft space/feedback, changed source,
  canceled preview and mixed-validity feedback selection. Keep denied case identity out of feedback details.
- **Screens/modes:** CaseToArticle, ArticleFeedback, Commons Knowledge draft/review and linked task;
  browser/TUI/Standard, long redacted text, keyboard selection and inspected saved draft audience.

### CS-26 — Publish a feedback form and schedule its invitation policy

- **Actor/start:** service administrator, existing published feedback form with answers, draft copy and a resolved
  case eligible under a controlled future/current delivery policy.
- **Objective/steps:** Settings/FeedbackForms → create/copy form → FeedbackFormDetail → edit questions/options and
  dependencies → preview → publish from a date → ServiceDefaults feedback delivery → choose form, case types/queues,
  delay/frequency, expiry/reminders and low-score follow-up team → resolve a consuming case → inspect invitation
  creation and delayed local send → revise/end policy and verify earlier invitation basis remains intelligible.
- **Expected:** the form is owned by the intended organization; edits to answered questions use dated successors
  or ending, not destructive replacement. Invitation timing/frequency and recipient are explicit; resolving the same
  case or rerunning a due job does not create unintended duplicate invitations or mail.
- **Recovery:** draft/unavailable form, invalid dependency/date, unsupported question, no customer recipient,
  failed independent invitation, canceled publish/end and changed policy before due send. Inspect retained state
  rather than treating a scheduled/queued notice as delivered.
- **Screens/modes:** FeedbackForms/FeedbackFormDetail, ServiceDefaults, consuming CaseDetail and captured mail;
  browser/TUI/Standard for staff, dynamic-form/keyboard/390px and dated-answer checks.

### CS-27 — Receive feedback and complete an accountable follow-up

- **Actor/start:** invited customer, service manager and non-holder; valid/expired/withdrawn invitation, a low score,
  duplicate submit and a prior response whose form later changed.
- **Objective/steps:** open captured feedback invitation → inspect only the offered form/context → submit score and
  comment → retry the same response → manager opens SatisfactionResults → choose period/queue/team/customer →
  ResponseDetail → inspect the historical answer and permitted case link → record follow-up → return to results.
- **Expected:** the token grants the answer form, not access to the case or internal content; one submission is
  retained and cannot be edited into a different historical response. Results state count/rating basis; follow-up
  records who acted and what happened without changing the customer's answer.
- **Recovery:** forged/expired/withdrawn token, already answered link, missing required response, denied comment or
  case, unavailable historical question and canceled follow-up. Bad links provide useful guidance without disclosing
  whether another customer's case exists.
- **Screens/modes:** PASS Feedback, SatisfactionResults, ResponseDetail, Home CSAT and notification;
  browser/TUI/Standard for staff, public browser/390px/keyboard and inspected response/notice evidence.

### CS-28 — Explain service performance from measure to source and export

- **Actor/start:** team manager, administrator and narrower reader; known met/missed/open/paused/cancelled clocks,
  resolved/reopened/merged/split cases, returns in multiple currencies and an empty period.
- **Objective/steps:** ReportsHome → select period, as-of, organization/queue/team and grouping → read ServiceLevelCompliance,
  ResponseTimes, CaseVolumes and ReturnAnalysis → compare totals/denominators → follow offered case/analytics/customer
  drill → Back with options → export CSV and inspect actual rows. Inspect CaseAnalytics clock facts/events and its
  event-list CSV; compare ServiceStatistics and Home against the corresponding scope/basis.
- **Expected:** SLA rate handles open-overdue and cancelled clocks as stated; response metrics identify business
  versus elapsed time, median/p90/mean and sample counts; merged cases are not duplicated in backlog. Requested,
  received, credited/replaced and monetary return measures remain distinct and currencies are not added together.
- **Recovery:** no qualifying data, incomplete historical basis, restricted queue, unconfigured measure, wrong
  cutoff, denied drill and export failure. Document missing next-response/refund/denominator metrics as limitations,
  and verify current implementation before inheriting historical §7 claims.
- **Screens/modes:** six local report definitions, SatisfactionResults, Customer360 ServiceStatistics and Home;
  browser/TUI/Standard, contrast/labels/phone/zoom and exact CSV headers, rows, currency and scope.

### CS-29 — Produce and send the appropriate case summary

- **Actor/start:** case editor, reader and customer contact; outward/customer messages, private notes, internal and
  customer-shared files, template answers and linked orders/returns.
- **Objective/steps:** CaseDetail More → CaseSummary → inspect default Customer copy → switch to Internal summary
  → print each → compare actual content and labels → Send to the customer → choose permitted sender/recipient →
  inspect retained RequestContent and captured attachment → reopen the stored copy from Files.
- **Expected:** the audience is explicit on screen and output; customer summary contains only customer-safe content
  and links. Sending always uses the customer variant even when the staff member was viewing the internal summary.
  Stored output is attributable to the case and send; printing by itself changes no case state.
- **Recovery:** wrong/foreign case, unapproved recipient, missing PDF runtime, empty/failed output, canceled send,
  duplicate operation and source change before generation. Compare actual bytes; do not promise internal template
  answers if the current summary contract omits them.
- **Screens/modes:** CaseSummary qvt/tui/html/html-print, CaseDetail Files and captured email;
  browser/TUI/Standard, multipage/long-message output and customer-versus-internal counterpart.

### CS-30 — Keep files and discussion attached to the right record

- **Actor/start:** case/return editor, reader, public contact and foreign-scope non-holder; ordinary file, internal
  file, customer evidence and an issued RMA/summary/confirmation.
- **Objective/steps:** case, customer, order, return and warranty record → Files/Conversation → add permitted
  evidence or note → inspect its record association and audience → reload → download as holder → inspect public
  counterpart where shared → open a linked record and Back. Follow Chatter/RecordFiles terminal helpers explicitly.
- **Expected:** each file/message retains original record identity, provenance and audience; an issued document
  is distinct from a mutable attachment. Read-only users do not inherit upload/change operations, and public/customer
  evidence is not relabelled as internal or made visible to another contact merely through a shared screen.
- **Recovery:** failed/oversized/unsupported upload, failed scan, stale selection, removed membership, foreign file
  identifier, canceled note and unavailable referenced record. Inspect original download bytes and denied responses.
- **Screens/modes:** shared Chatter/RecordFiles with helpers and app-specific evidence/file sections;
  browser/TUI/Standard, selected phone/keyboard upload/download delegation and public browser boundary.

### CS-31 — Invite a contact and configure the bounded Support handoff

- **Actor/start:** `SUPPORT_CONTACT_INVITE` holder, service administrator and ordinary agent; existing customer
  contact/address, published disposable Support site and a separate customer-administrator identity.
- **Objective/steps:** ContactDetail → Invite to support → select organization/contact-owned address and intended
  customer-administrator option → create → inspect the one-time link using local delivery → complete public
  account handoff. ServiceDefaults → Support mount settings → choose offered queues, types and knowledge spaces
  from a date → verify the intended SupportHome/NewCustomerCase consumer.
- **Expected:** invitation targets one customer/contact and the configured authority/site; customer administrator
  is deliberate and distinct from staff service administrator. The link is shown once for the agent to send; creating
  it does not itself prove mail delivery. Configuration cannot smuggle an arbitrary backend or another org's queue.
- **Recovery:** unpublished/missing site, address not the contact's, denied inviter, expired/reused invitation,
  changed relationship and canceled setting. Record provisioning prerequisites instead of inventing a working URL.
- **Screens/modes:** ContactDetail invite, ServiceDefaults Support settings, PASS account/site handoff;
  staff browser/TUI/Standard as offered and actual public browser; no public TUI claim.

### CS-32 — Let a customer find help, submit and follow their own case

- **Actor/start:** anonymous visitor, signed-in contact, customer administrator and another customer; configured
  Support mount with customer/public/draft/internal help, offered queue/template and locally scanned file. Separately
  use the unsigned-in guest order holder from §2 with its same-site Shop session capability.
- **Objective/steps:** SupportHome → search/open CustomerArticle → rate where permitted → NewCustomerCase →
  choose topic/type/customer as offered → enter customer-visible template values/evidence → submit → MyCases →
  CustomerCase → read outward conversation/files → reply → ask to reopen or cancel when offered → inspect staff
  case result. Separately submit through a queue's public form token, whose response does not read a case.
  For the guest branch, open the established Shop order → follow its Support request link to NewCustomerCase →
  confirm that one order and its offered queue/template → submit → inspect the returned receipt/notice on the
  intake page and the staff-side order-linked case; do not continue through MyCases as if the guest were a contact.
- **Expected:** contact sees only their cases and customer administrator the permitted customer's cases; staff
  labels, notes and internal fields remain absent. Outside-hours guidance and closed-case follow-up-on-reply are
  clear. Article rating, reply and case submission use their recorded operation/view identity without duplication.
  Guest submission is receipt-only public intake for the capability's order; it grants no general case list or
  case-detail read. Inspect the actual redirect and retained order context as well as the created record.
- **Recovery:** unavailable queue/type, invalid dependency/file, expired capability, other customer's ID, stale
  cancellation, missing authority and local remote-authority outage. Public form intake is not signed-in read access.
  Retry the guest entry with another order ID, a site without its session capability, a mount serving another
  organization and an expired/revoked capability; show the actual sign-in/not-available recovery without disclosing
  another order or granting general case access.
- **Screens/modes:** SupportHome, CustomerArticle, NewCustomerCase, MyCases and CustomerCase and their
  `.html.fancy` forms, the bounded Shop order entry and staff CaseDetail continuation;
  browser with 390px/keyboard, JavaScript-disabled/basic-form path where supported, local and configured remote
  authority variants only when the required runtime exists.

### CS-33 — Let a customer request a return or cancellation and understand its result

- **Actor/start:** signed-in customer/contact and customer administrator, eligible shipped lines, open unshipped
  order remainder, current RMA capability and a return already affected physically or financially. Separately use
  the unsigned-in guest order fixture with its same-site `SalesOrder` / `OrderView` session capability.
- **Objective/steps:** Support MyReturns → RequestReturn → choose source lines, reason/remedy and evidence → submit
  → CustomerReturn → read authorization/receipt/remedy progress → add evidence → download available label →
  withdraw an untouched return. From CustomerCase/order context open NewCustomerCase's order-cancel section → select
  open quantities and consent → Ask to cancel → inspect requested versus immediately cancelled result and staff proposal.
  For the guest branch, follow the established Shop order's Support return link directly to RequestReturn → select
  only that order's eligible lines/reason/remedy → submit → inspect the receipt on RequestReturn and staff RMA.
  Independently follow its Support cancellation entry to NewCustomerCase → select open lines and consent → Ask to
  cancel → inspect the returned state notice and that order's cancellation history. No general order picker, MyReturns
  or automatic CustomerReturn detail access is conferred by the guest order link.
- **Expected:** a requested remedy is not an approved refund; withdrawal respects current revision and effect
  boundaries. Order cancellation is immediate only under the current `customerImmediateCancel` rule and eligible
  unreserved/unapproved conditions; otherwise a proposal waits for staff. The public page offers no stock/financial
  controls, internal policy decisions or another customer's identifiers.
  Guest return submission remains receipt-only; cancellation returns “Cancellation requested” or “Cancelled” under
  the same current rule and does not turn the guest into a signed-in contact. Verify the persisted RMA/change only
  through an independently authorized staff continuation.
- **Recovery:** duplicate submit, excess/shipped quantity, closed or already affected return, stale revision,
  expired/forged token, unavailable label and server refusal after a previously enabled control. Inspect the actual
  CustomerReturn evidence/withdraw/label controls rather than inferring a UI from a Mantle operation alone.
  Repeat guest return/cancellation with a wrong order, missing session entry on another site, a foreign-organization
  mount and an expired/revoked order capability; verify refusal and safe re-entry without general list/detail access.
- **Screens/modes:** MyReturns, RequestReturn, CustomerReturn, NewCustomerCase/cancelOrder and staff RMA/change
  continuation; public browser/390px/keyboard and local synthetic carrier results, no public TUI.

### CS-34 — Reconcile permission, organization, queue and audience boundaries

- **Actor/start:** the narrow roles and positive/negative pairs in §2, foreign organization, restricted queue,
  expired team/customer relation, public contact and a Projects client contact.
- **Objective/steps:** follow each permitted activity's normal entry, then its relevant direct route/transition,
  selected-value choice, palette/record link, notification, file and export. Compare a valid holder request with the
  same meaningful request by a non-holder; inspect hidden inherited children and cross-app `appRoot` claims.
- **Expected:** launcher/menu, organization/customer/queue visibility and business capability are separate checks.
  Hidden Privacy cases do not leak through counts, search or files; shared customer records do not join another
  organization's history. Borrowed W/F permissions work on their authorized Customer Service mounts without
  granting Warehouse/Accounting roots. A public contact gets no staff BOSS surface.
- **Recovery:** access revoked between preview and confirm, nonexistent versus foreign record, expired membership,
  wrong token scope and a permission grant without app entry. A refusal must be due to the targeted rule, not an
  unrelated missing field or missing fixture.
- **Screens/modes:** all relevant mounts/helpers from §3, paired within earlier activities; browser/TUI/Standard,
  exported/downloaded bytes and PASS public endpoints, including inherited Product360 Prices/SupplierPrices CSV
  and XLSX. Inspect actual workbook columns/values and refusal under the service context, paired with the owning
  app's authorized output. This is later access review, not a new regression matrix.

### CS-35 — Reconcile shared handoffs and remaining interaction modes

- **Actor/start:** staff participants from completed activity receipts, authorized counterpart consumers and actual
  browser/terminal access; retain the source list/query and record identities for each continuation.
- **Objective/steps:** follow selected cold and warm cross-app links and Back: order change to its owner, RMA to
  Warehouse/Accounting, repair task to its owner, knowledge to Commons, report/attention to Insights where admitted,
  and customer handoff to PASS. Revisit outstanding terminal, Standard, narrow, keyboard/zoom and output variants;
  compare a representative second consumer of any later shared correction.
- **Expected:** route/default/tab context and history are predictable; one Back returns to origin without stale
  form/source parameters. Supported terminal actions work in the actual client; unsupported upload/rich editing/
  public-site paths explain delegation. Tool limitations and missing prerequisites remain explicit in the ledger.
- **Recovery:** no destination launcher despite a business permission, removed linked record, stale asynchronous
  response, failed provider, canceled confirmation and navigation while a draft is unsaved. Do not turn an unbuilt
  neighboring workflow into a requirement to implement it in this review.
- **Screens/modes:** shared sources, helpers, shell providers, record/output/public continuations and unresolved
  variants from CS-01–34; record exact evidence and remaining gaps rather than a blanket parity claim.

## 5. Existing checks and future verification

This is an inventory of source coverage, not a record of tests run for this document. Current paths matter more
than old implementation totals. BOSS has **13 Customer Service server regression specs**, **one browser regression
walk**, **18 server acceptance specs**, and no CustomerService subdirectory in `acceptance/client/`. A server
acceptance walk that posts transitions or renders qvt/TUI is not observed browser interaction.

| Current BOSS regression source under `test/CustomerService/` | What it supplies to the review | Activities |
| --- | --- | --- |
| `CustomerServiceAccess.spec.js` | Root/menu/provider/record-choice boundaries, actual capabilities and Home projection; positive/negative cases remain useful fixtures | CS-01, 02, 34 |
| `CustomerServiceCases.spec.js` | Demo profiles/Privacy, scoped finds/counts, independent bulk assignment/retry, Today and shared case guards; selected CaseDetail/NewCase render logic | CS-03–04, 06, 12–13 |
| `CustomerServiceOrders.spec.js` | Customer/order lookup, shared-customer scoping, amount/credit projections, case links and customer-safe Product360 context | CS-02, 15–16 |
| `CustomerServiceAssignment.spec.js` | Team/rule context, saved-reply ownership/sharing/actions and per-case bulk preview; related form render checks | CS-06–07 |
| `CustomerServiceChannels.spec.js` | Route/held-input context, mail-to-case scope, ChannelSessions and caller case projection | CS-05, 09 |
| `CustomerServiceTemplates.spec.js` | Queue template selection and case-template fields/conditions/agent/customer preview | CS-03, 14 |
| `CustomerServiceRelations.spec.js` | Merge/split capability and preview surfaces | CS-10–12 |
| `CustomerServiceReturns.spec.js` | Return preparation/list/batch and audience/capability projections; selected return screen logic | CS-19–22 |
| `CustomerServiceOrderChanges.spec.js` | Approved proposal/impact/apply presentation and change list | CS-17–18 |
| `CustomerServiceWarranty.spec.js` | Claim coverage/decision projection, claims/delivered-items and intake template | CS-03, 23 |
| `CustomerServiceKnowledge.spec.js` | Suggestions/audience, source mount, send-to-customer refusal, feedback and redacted draft preparation | CS-24–25 |
| `CustomerServiceFeedback.spec.js` | Published form/policy, response/results/history and Home CSAT projection | CS-26–28 |
| `CustomerServiceReports.spec.js` | Scoped measures/exports/catalog/dataset, hand-computed response metrics and selected report render logic | CS-08, 28 |

`test/CustomerService/CustomerServiceSpecLib.js` holds IDs, role usernames, authorized call helpers and route
fixtures. It is a helper, not a fourteenth spec. The one registered browser regression is
`test/client/CustomerService/CustomerServiceCasesWalk.spec.js`: at 1280px an agent identifies Joe, sees possible
duplicates, creates a distinct case and resolves it with Reopen offered. It does not establish the rest of these
activities, a phone layout, all themes or public Support.

| Current BOSS acceptance source under `acceptance/CustomerService/` | Existing scenario/supporting coverage | Activities |
| --- | --- | --- |
| `CustomerServiceFoundationWalk.spec.js` | Role menu/root/provider checks and demo commercial records | CS-01–02, 15, 34 |
| `CustomerServiceCasesWalk.spec.js` | Case creation/intake, board/row moves, bulk result, follow-up work and restricted Privacy | CS-03–04, 06, 12, 34 |
| `CustomerServiceOrdersWalk.spec.js` | Customer/order continuity, stored confirmation, stock readiness/history and product amount boundaries | CS-02, 15–16 |
| `CustomerServiceSlaWalk.spec.js` | Calendar/holiday simulation, outward response, pauses, reopen, independent scan failure and retained policy | CS-08, 12 |
| `CustomerServiceAssignmentWalk.spec.js` | Hours/round robin/concurrent intake, no eligible agent, saved reply and mixed-delivery batch | CS-06–07 |
| `CustomerServiceChannelsWalk.spec.js` | Mail threading/acknowledgment/held sender/token, chat/call and local Forum escalation/public reply | CS-05, 09 |
| `CustomerServiceTemplatesWalk.spec.js` | Conditional server validation, internal audience, authoring/cycles, dated answers and render variants | CS-03, 14 |
| `CustomerServiceRelationsWalk.spec.js` | Merge, split, reopen/follow-up and auto-close retention | CS-10–12 |
| `CustomerServiceReturnsWalk.spec.js` | Policy/RMA/label, partial boxes/rejection/disposition, overlapping eligibility and receiptless authority | CS-19–22 |
| `CustomerServiceOrderChangesWalk.spec.js` | Short-pick substitution, stale stock/cancel, packed correction, immediate-cancel policy and commercial/hold refusal | CS-17–18, 33 |
| `CustomerServiceWarrantyWalk.spec.js` | Delivery-based coverage, expiry/goodwill, repair notification and return replacement | CS-23 |
| `CustomerServiceKnowledgeWalk.spec.js` | Language/audience/send, redacted draft, independent feedback review and customer-visible exclusion | CS-24–25 |
| `CustomerServiceFeedbackWalk.spec.js` | Dated forms/policy, delayed invitation, answer retry/bad links and immutable follow-up | CS-26–27 |
| `CustomerServiceReportsWalk.spec.js` | Clock/case denominator semantics, response metrics, return currency and manager/export scope | CS-28 |
| `CustomerServiceSupportWalk.spec.js` | Public-contact/customer-admin authority, help/rating/public form and staff invitation/settings through operations | CS-31–33 |
| `CustomerServiceSummaryWalk.spec.js` | Customer/internal summary content, retained output/send and recipient/reader refusals | CS-29 |
| `CustomerServiceAccessWalk.spec.js` | Cross-organization/shared route/helper/output isolation, borrowed W/F without launchers and public contact excluded from BOSS | CS-21–22, 30, 34 |
| `CustomerServiceServerStatic.spec.js` | Supporting XML/server-static structural inspection; no live journey or visual result | CS-35 |

Keep the same-named server acceptance and browser regression `CustomerServiceCasesWalk` distinct by runner and
path. Current BOSS `acceptance/client/suite.js` does not register a Customer Service browser walk. Do not relabel
the existing transition walks as browser coverage or create another regression golden path to fill the gap.

| Owning component/source | Existing coverage to reuse and limitation |
| --- | --- |
| Mantle `test/request/` | `SupportCases`, `SupportSla`, `SupportAssignment`, `SupportReplies`, `SupportChannels`, `SupportTemplates`, `SupportRelations`, `SupportKnowledge`, `SupportWarranty`, `CaseFeedback`, `SupportPortal`: business rules and refusals, not BOSS usability evidence |
| Mantle `test/order/`, `test/shipment/` | `OrderChanges`, `ReturnPolicies`, `AccountingReturns`, `WarehouseReturns` and relevant shipment/return rules; match the changed rule's owner instead of duplicating it through BOSS |
| Mantle `acceptance/order/SupportImmediateCancelWalk.spec.js` | Full policy-sensitive customer cancellation; acceptance permission is still required |
| PASS `test/Support/SupportAccess.spec.js` | Support access contract; `SupportFixtures.js` is its shared helper |
| PASS `acceptance/SupportFixtures.spec.js`, `SupportIsolation.spec.js` | Explicit public fixture setup and customer isolation; fixture dependencies are not permission to run acceptance |
| PASS `acceptance/client/SupportPagesHttp.spec.js`, `SupportFeedbackHttp.spec.js` | Actual public-page forms, responsive/feedback behavior against a configured fixture; registered in PASS's acceptance client suite |
| PASS remote/authority coverage | Consult current transport/remote tests and deployment configuration for the required authority arrangement; a successful local facade call does not establish a remote browser handoff |
| Commons/Projects/Products/Warehouse/Accounting/Insights | Existing shared component, task, stock, quality, finance and dataset checks; choose a representative second consumer only for the shared behavior later changed |

### Verification rules for later refinements

- Read the [testing skill](../../../../.agents/skills/testing/SKILL.md) before writing or running tests. Commands
  run from the mr-moqui root with a suitable binary. A later affected-rule check could use
  `./moq test mr-boss --spec CustomerServiceReturns --nobuild`; use the owning Mantle rule spec when its rule
  changes. The browser golden path uses Moqui's client runner, for example
  `./moq test-client mr-boss --serve --spec CustomerServiceCasesWalk --nobuild`, not Node.
- **Acceptance runs require the user's request or an added/changed acceptance test.** When one is added/changed,
  run that test and its component's acceptance suite once written. An explicitly authorized existing scenario might
  use `./moq accept mr-boss --spec CustomerServiceReturnsWalk`; a public HTTP scenario belongs to mr-pass. This
  document, its fixture references and a shared-source change do not authorize those runs. No `accept-all` is planned.
- Business-rule regressions belong in Mantle and app context/projection checks in BOSS. Keep the single browser
  golden path. Full activities, responsive/access walks and screen sweeps belong in acceptance. Across regression,
  render a screen at most once per mode with all checks together; a second mode needs its own authored template.
  Do not add a screen-by-mode or role-by-route matrix to complete this review.
- BOSS's current regression budget is **264 seconds server / 57 seconds client**; a regression spec over
  **15 seconds** fails. Observe each other component's current budget. Remove duplication or place a full scenario
  in acceptance rather than raising a budget; no budget increase is authorized.
- Follow the supplied pre-commit rules for later implementation: `./moq test-apps` for application work,
  `./moq test-framework` for framework work. Do not inherit a special cadence from earlier Products/Projects
  execution notes. This documentation-only batch includes no commit or test run.
- Lint later changed screens with `moqui lint --screens <report-file>`; that argument is an overwritten output
  report, never the input screen. Markdown-only work does not require screen lint. Rust/embedded renderer fixes
  follow their own building guidance; application documentation does not justify `cargo test` or `test-all`.
- Keep evidence in ignored framework `plans/ui-refinement-evidence/boss-customer-service/` or a named equivalent
  outside tracked source. Compare important before/after captures at the same data, geometry and theme. Include
  relevant console/network observations, persisted case/order/return outcomes, inspected CSV/XLSX/PDF bytes and
  redacted captured message/recipient evidence. Do not commit screenshots, tokens or customer/private data.
- For each correction re-exercise the affected activity and meaningful recovery branch, with a second consumer
  for a shared change. Separate missing fixtures/providers, tool limits and reproduced baseline failures from new
  product defects. A silent skip or passing source/render check cannot close an unobserved customer journey.

## 6. Coverage, findings and running record

### Activity coverage ledger

**Pending** means not reviewed; **inspected** means source/render/visual inspection only; **exercised** means the
steps ran with explicit pass/fail/partial outcome; **blocked** means a missing prerequisite; **deferred** means a
deliberate postponement with reason/follow-up. Exercised does not by itself mean passed. Name unresolved continuations
for partial work. Source research and independent document review do not advance this live-activity ledger.

| Activity | Status | Outcome / recovery / mode gaps | Evidence / findings |
| --- | --- | --- | --- |
| CS-01 — Workday/scope | pending | All live variants unreviewed | — |
| CS-02 — Customer/contact lookup | pending | All live variants unreviewed | — |
| CS-03 — New case/template | pending | All live variants unreviewed | — |
| CS-04 — Case work/status/task | pending | All live variants unreviewed | — |
| CS-05 — Conversation/audience | pending | Local mail/call/forum fixtures required | — |
| CS-06 — Team assignment | pending | Concurrent intake/hours branch unreviewed | — |
| CS-07 — Saved/bulk replies | pending | Delivery/retry branches unreviewed | — |
| CS-08 — Service clocks | pending | Clock/calendar/zone branches unreviewed | — |
| CS-09 — Intake/held submissions | pending | Explicit local channel/token fixtures required | — |
| CS-10 — Merge | pending | All live variants unreviewed | — |
| CS-11 — Split | pending | All live variants unreviewed | — |
| CS-12 — Resolve/reopen/follow-up | pending | Controlled window/job fixture required | — |
| CS-13 — Defaults/queues/statuses | pending | All live variants unreviewed | — |
| CS-14 — Template authoring/history | pending | Browser and customer variants unreviewed | — |
| CS-15 — Order/shipment/invoice | pending | Retained/captured output unreviewed | — |
| CS-16 — Product/availability | pending | Readiness/history/CSV/XLSX unreviewed | — |
| CS-17 — Cancel/substitute | pending | Stock/pack/billing continuation unreviewed | — |
| CS-18 — Commercial handoff/holds | pending | Owner continuation and refusal unreviewed | — |
| CS-19 — Return request/policy | pending | All live variants unreviewed | — |
| CS-20 — RMA/exception/label | pending | Local carrier/output fixtures required | — |
| CS-21 — Return receipt/quality | pending | W/inspect/dispose pairs unreviewed | — |
| CS-22 — Settlement/refund | pending | Same-org F/refund/receiptless pairs required | — |
| CS-23 — Warranty/repair | pending | All live variants unreviewed | — |
| CS-24 — Knowledge/send | pending | Audience/public-link variants unreviewed | — |
| CS-25 — Article draft/feedback | pending | Redaction/history variants unreviewed | — |
| CS-26 — Feedback form/policy | pending | Delayed send and dated form unreviewed | — |
| CS-27 — Response/follow-up | pending | Public token/immutable response unreviewed | — |
| CS-28 — Reports/exports | pending | Measures/as-of/CSV bytes unreviewed | — |
| CS-29 — Case summary | pending | Customer/internal/PDF/send unreviewed | — |
| CS-30 — Files/discussion | pending | Audience/download/terminal unreviewed | — |
| CS-31 — Support invite/settings | pending | Published isolated PASS fixture required | — |
| CS-32 — Public help/case | pending | Public browser/local/remote and guest order-link variants unreviewed | — |
| CS-33 — Public return/cancel | pending | Signed-in/guest public browser and staff continuation unreviewed | — |
| CS-34 — Access/isolation | pending | Paired checks throughout; no matrix inferred | — |
| CS-35 — Cross-app/mode reconciliation | pending | Depends on earlier activity receipts | — |

### Findings register

No runtime/UI defects have been established by writing this plan. Number later findings **CS-UI-001** onward.
Distinguish an observed failure, a static concern and a design judgment. P1 blocks work or makes essential information
unusable; P2 causes substantial friction or misleading presentation; P3 is a localized refinement. A private-data,
authority or transaction-integrity failure takes priority regardless of the screen's visual quality.

| ID | Severity / status | Actor, activity and step | Route / mode / theme / viewport | Reproduction, observed impact and evidence | Owner / correction / retest |
| --- | --- | --- | --- | --- | --- |
| — | No observed findings yet | — | — | Source concerns below are investigation inputs | — |

Source concerns to carry into later execution, without presenting them as newly reproduced defects:

- Current shared RequestDetail/Customer360/Product360 sources include other app contexts and hidden/inherited
  helpers. Compare direct requests and output endpoints with real owning-app positives; menu absence is not proof
  of omission or refusal. Customer-safe stock and price workbook routes need the same scope check as HTML.
- Implementation §7 records case-clock query/scan limitations, limited knowledge ranking, missing report measures
  and historical backlog concerns. Reconcile each with current code and controlled data before assigning a finding.
- Historical F185/F218/F219 concern warranty intake/resold serial choice, CaseDetail Items and internal template
  answers in summaries; F213 includes Support-link preview, label content type and public paging. These are targeted
  investigation inputs, not authority to expand the app or claim the old problem still occurs.
- Historical F217 concerns ignored service-call error detection. Inspect not-available states, failed independent
  panels and retained form inputs rather than relying on `errorMessages` alone.
- Return settlement and captured mail/label/summary actions may retain a successful inner business result when
  a later output/provider action fails. Inspect actual records and messages before interpreting an overall success
  label or retrying the whole operation.
- Public field dependencies, audience labels, expiry/reopen guidance and remote-authority failures need actual
  browser checks; operation-level support does not prove the expected control is present or usable.

### Bounded batch record

| Batch | Scope | Evidence / verification | Outcome / continuation |
| --- | --- | --- | --- |
| Authoring — 2026-11-10 | Dedicated Customer Service author in the four-app batch: current source/mounts, roles, fixtures, workflows, outputs, test registrations and historical reconciliation | Source/document inspection and Markdown consistency checks only; no application/test/build/runtime/commit work | Initial document written; all CS live activities pending; independent reviewer and coordinator reconciliation follow |
| Independent-review corrections — 2026-11-10 | Addressed required P2 guest Shop order capability coverage in fixtures/method and CS-32–33, and P3 Support case/help page count | Independent reviewer rechecked PASS/Mantle guest-order contracts, receipt/state notices, refusal and access limits, five case/help pages and EOF cleanup; documentation only | Both required corrections resolved; independent recheck passed with no further required corrections or contradictions in the revised areas; all 35 live activities remain pending |
| Coordinator reconciliation — 2026-11-10 | Reconciled Warehouse physical/quality, Accounting settlement, shared order/customer context and PASS Support signed-in/guest handoffs with the companion reviews and current sources | Independent reviews/rechecks complete; source inventories, relative links/anchors, activity IDs/ledgers and Markdown whitespace checked; only four new review documents changed | Documentation batch complete; source concerns remain investigation inputs and all live activities remain pending |

For later execution append a bounded entry: actor/fixture identities; source/binary/runtime and clock/modes; activity
steps and recovery branches attempted; findings/owners; before/after evidence; persisted results and inspected
artifacts; exact checks/results/skips; design/implementation updates; commits if made; temporary configuration/grants
restored; remaining continuations. Refer to evidence files rather than pasting logs or tokens into this document.

## 7. Decisions

- **Current task:** create this documentation only, with an author and a separate independent reviewer. The review
  of the document is source-based; all live activities remain pending. No implementation, build, runtime, test run,
  acceptance selection or commit is part of this batch.
- **Pattern and scope:** use Accounting's seven-part structure at Customer Service's actual depth. Every local
  route, shared mount/inherited child, dialog/helper, custom mode and output is mapped to an activity or explicit
  supporting inspection. Earlier reviews' completed statuses and execution exceptions do not transfer.
- **Current-source authority:** actual mounts/services/grants control scope. Reconcile stale planned/deferral
  entries here without editing the other documents or building missing features. Source concerns remain separate
  from observed findings and from a deliberate future capability.
- **Audience and authority:** case/queue/customer scope, app entry and business capabilities are distinct. Public
  contact, customer administrator and staff roles are not interchangeable. Stock receipt/quality and financial
  settlement can be offered inside Customer Service under their own grants without granting another app root.
- **Operational handoffs:** preserve cancellation/substitution, package/billing, physical return/quality,
  settlement/refund and warranty task boundaries. Approval, authorization, receipt, credit, gateway outcome and case
  resolution each need their own visible state and evidence; none is inferred from the preceding action alone.
- **Modes and outputs:** Material is the visual target, with actual TUI and brief Standard/output coverage. Support
  is a bounded public browser handoff. Inspect CSV/XLSX/PDF and captured messages where offered; a render or download
  event alone proves neither correct audience nor correct contents.
- **Testing/cadence:** reuse current coverage under §5 and the supplied repository instructions. No budget increase,
  new regression sweep, extra golden path or acceptance-run exception is authorized by this plan. Record any later
  user-directed execution scope and cadence when the actual review starts.
- **Completion:** later live review needs evidence for the selected activities, resolved or explicitly accepted
  findings and a candid ledger of unfinished modes, recovery branches, providers and handoffs. A source inventory,
  independent document review or passing suite alone does not establish a usable end-to-end service experience.
