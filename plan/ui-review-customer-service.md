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

This follows [Products](ui-review-products.md) and the
[document convention](design-doc-guide.md#ui-review-and-refinement-phase); it is the plan and running record of the
Customer Service review: inventory, activities, coverage, findings, decisions and bounded execution notes.

**Status: planning only, 2026-11-10 America/Chicago; checked against current source 2026-11-11 (§6 batch record).**
All live activity and mode coverage is pending. No runtime, browser or terminal walkthrough, test, build,
application change or commit was performed to write or check it. Existing implementation results and tests do not
establish live review outcomes.

### Inputs and reference patterns

- [Customer Service design](design-customer-service.md), [implementation](impl-customer-service.md) (P0–P16 built,
  §7 Later) and [research](research-customer-service.md). There is no CustomerServiceImplementation guide in
  `docs/` as there is for Products, Accounting, Warehouse and Manufacturing.
- Companion reviews [Accounting](ui-review-accounting.md), [Warehouse](ui-review-warehouse.md),
  [Manufacturing](ui-review-manufacturing.md) and [Purchasing](ui-review-purchasing.md);
  [Products review](ui-review-products.md), [Projects review](ui-review-projects.md),
  [drawers, Commons and Comms review](ui-review-drawers-commons.md),
  [framework UI review guide](../../../../../docs/dev/UI-Review.md) and
  [framework review](../../../../../plans/archive/UI-Refinement.md).
- [Application practices](../../../../../docs/dev/Practices-App-Dev.md), [style guide](style-guide.md),
  [crosscut design](design-crosscut.md), and the current Warehouse, Accounting, Products, Purchasing, Commerce,
  Projects, Commons and PASS contracts at the bounded handoffs below. Sales is not built (its plan,
  [impl-sales](impl-sales.md), has not started; `screen/Sales/` holds placeholders).
- `screen/CustomerService.xml`, `screen/CustomerService/`, the mounted Shared/Commons sources and inherited
  children, `template/CustomerService*.xml` (17 templates), `service/ironstone/customerservice/` (its capability
  map is `CustomerService.js`), `data/BossSetupData.xml`, `data/BossUsersDemoData.xml`, and the Customer Service
  demo files `BossCustomerServiceDemoData.xml`, `BossXCustomerServiceHoursDemoData.xml`,
  `BossYCustomerServiceCasesDemoData.xml`, `BossZCustomerServiceDemoData.xml`,
  `BossZZCustomerServiceChannelDemoData.xml`, `BossZZCustomerServiceFeedbackDemoData.xml`,
  `BossZZZCustomerServiceSupportDemoData.xml` and the dataset file `BossCustomerServiceReportData.xml`.
- Current BOSS regression and acceptance specs, their helper and client registrations; Mantle's request, order and
  return rule specs; PASS `screen/Support.xml`, `screen/Support/`, `Support/Support.js` and its Support fixtures,
  access and HTTP coverage (§5).

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
| Order changes | Mantle `OrderChangeServices`: Customer Service applies cancel and substitute under `ORDER_CHANGE_APPROVE`/`ORDER_CHANGE_APPLY`; the commercial kinds (price, quantity increase, ship date, address, ship method, carrier) are filed here, decided only under `SALES_APPROVE` and applied only by the order's owner, Sales, which is not built (impl-customer-service F158, §7; impl-sales P9/P14) |
| Return authorization, policy, warranty and customer evidence | Mantle `ReturnPolicyServices` and `WarrantyServices`; Customer Service owns the agent-facing process |
| Physical return receipt, inspection and disposition | Warehouse's `receive#ReturnItems` and the quality services, offered on Customer Service's ReturnDetail to a `STOCK_RECEIVE`/`QUALITY_*` holder only when the return's organization settles returns separately; owning rules remain Warehouse/quality rules |
| Credit, replacement and gateway refund | Mantle `ReturnServices` (`preview#ReturnSettlement`, `settle#Return`) and Accounting payment services; Customer Service exposes settlement only to the borrowed financial capability |
| Product identity, stock, history and price explanation | Shared Products/Warehouse sources in Products' Customer Service context (cost, supplier price and policy off); quantity is not a delivery promise |
| Chatter, files, mail, calls, forum, Knowledge and surveys | Existing Commons/Comms/Shared components and their owning services; inspect case identity, audience and return path |
| Public Support and feedback pages | PASS over Mantle through `pass.Facade`; local or remote authority remains separate from BOSS staff access |
| Widgets, layout, print/PDF and terminal rendering | Framework/client and output services; fix shared causes at their owner and verify a second relevant consumer |

Preserve routes, record identity, revisions, operation keys, saved finds, preferences, dated policy/form history and
service/entity contracts. Record unavoidable compatibility changes before later implementation. Hidden tabs and app
context do not grant authority. Restricted cases, private messages, internal template answers, customer identifiers,
costs, supplier prices and financial details must be absent from unauthorized responses, choices, search counts,
files and exported bytes, not merely hidden in a widget.

Do not build absent features to complete this review: ChannelAutomation, telephony adapters, case time logging,
external knowledge sources, the chargeable-repair sales quote, the on-site intervention report, presence/typing,
PASS Support terminal pages and the Sales application of commercial order changes remain impl-customer-service §7
work. Check current Commerce, Insights, Projects and Admin links where they exist. Real customer mail, calls,
public forum publication, carrier purchases and gateway payments are not review fixtures; later execution uses
disposable local records and captured or synthetic integrations.

## 2. Review method and refinement criteria

The generic method is the [UI review guide](../../../../../docs/dev/UI-Review.md):
[preparing an isolated review](../../../../../docs/dev/UI-Review.md#prepare-an-isolated-review), activities and coverage,
[judging the result](../../../../../docs/dev/UI-Review.md#judge-the-result) (viewports, themes, keyboard, contrast,
terminal) and [recording, fixing and verifying](../../../../../docs/dev/UI-Review.md#record-fix-and-verify). Products
shows it executed: its [§2](ui-review-products.md#2-review-method-and-refinement-criteria) and
[execution setup dispositions](ui-review-products.md#execution-setup-dispositions). This section keeps only what is
specific to Customer Service.

### Environment and execution setup

- **Bootstrap.** Link Mantle, BOSS and PASS (`mr-pass`) individually into an isolated runtime with copied
  configuration, a fresh disposable database, captured mail and local outputs; the guide's framework-only bootstrap
  leaves `component/` empty and is not enough. A linked component is source: uploads, issued files and exports land in
  the disposable runtime. Fixture specs beyond demo data (BOSS acceptance walks, PASS `SupportFixtures`/
  `RemoteFixtures`) run as focused acceptance runs (§5). Use the release binary and embedded Postgres; the coordinator
  starts further instances as needed (§7).
- **Prerequisites seen in executed reviews.** Embedded Postgres may need host (unsandboxed) shared memory, with every
  runner at one process-visibility level; delegated agents may have no browser tools; an isolated runtime may need
  webroot assets materialized before the terminal works; an automated tool-approval review may block a posting or
  send. Choose a free non-default port (another local Moqui may hold the defaults and is not stopped; Products used
  57820) and a hostname per browser identity: staff agent, staff manager/authorizer, the PASS public site and the
  unsigned-in guest session. Record which apply in the first batch.
- **Shared runtime and concurrency.** The coordinating agent decides whether the five companion reviews share one
  runtime and manages the concurrent review agents (user decision, 2026-11-11). In a shared one it owns the lifecycle,
  no demo record is consumed by two reviews, and Retail-wide changes (PUR-27's purchasing policy rows, CS-21/22's
  `returnSettlementRequired`, MFG-06's production policy, MFG-17's forward repost flags) stay in their own batch and
  are restored, or isolated in another organization, before another review's dependent activity. In separate runtimes
  a review prepares the other side of a handoff as setup without reviewing it. Orderings: "Fixtures" below.
- **Support site.** The demo `ZIZI_PORTAL` site (Accounting's portal demo) mounts Support at `/support` for
  `ORG_ZIZI_RETAIL`, and `load#SupportDemo` sets the mount's settings. Serving it needs a PASS `<public-site>` for a
  `portal.zizi.localhost`-style hostname ([mr-pass Deployment](../../mr-pass/docs/Deployment.md)); a remote frontend
  needs its own authority configuration. Record which arrangement ran; a missing one leaves CS-31–33's affected
  branches blocked.
- **Mail.** The service mailbox `BOSS_CS_SERVICE_MAIL` (`service@retail.example`, send users agent, manager and
  admin) sends through `BOSS_CS_DEMO_MAIL` at 127.0.0.1:9, so every send fails unless the runtime captures mail
  (`mail_capture_sends`, as the guide's bootstrap sets). Run with capture and use the failure only as a deliberate
  recovery branch. No inbound mailbox is configured: the acceptance walk files mail by running Comms' mail rules on a
  stored message, so inbound intake in CS-05/09 is a prepared message, not a delivered one; record it so.
- **Carrier and payments.** Return labels come only from Mantle's test carrier (see the Warehouse review's carrier
  note). The demo delivered order was paid by company check (`PiCompanyCheck`), so no gateway refund exists to
  observe: a refund, pending or declined gateway outcome needs a prepared order paid through a local test gateway,
  or stays unverified.
- **Scheduled jobs.** Mantle runs `scan_CaseSla` every 5 minutes, `send_CaseFeedbackInvitations` every 15 minutes
  and `close_ResolvedCases` hourly at :20 (all unpaused). SLA notices, delayed invitations, reminders and auto-close
  depend on them: confirm whether the review runtime's scheduler runs, and record each run observed or triggered.
- **Posting and settings extent.** Return receipt, settlement and order-change apply post stock and ledger entries;
  CS-21/22 also need Retail's `returnSettlementRequired` changed (below) and temporary grants. Both are allowed
  (user decision, 2026-11-11); the coordinator sequences them and restores each change afterwards.

### Organizations, customers and dates

- **Retail is the service organization.** `ORG_ZIZI_RETAIL` (warehouse `ZIRET_WH`, store `POPC_DEFAULT`) has
  service policy `BOSS_CS_POLICY_RETAIL` (workflow `CwfDefault`, unknown senders held for review, 14-day reopen
  window, resolution required, `customerImmediateCancel="N"`), queues `BOSS_CS_Q_SUPPORT` (team-visible, Support
  team) and `BOSS_CS_Q_PRIVACY` (restricted, Privacy team, the only queue offering `RqtPrivacy`), and the types
  `RqtSupport`, `RqtPrivacy` and `RqtWarranty`.
- **Teams.** Support team `BOSS_CS_TEAM_SUPPORT`: `customerservice.agent`, `.agentwh` and `.knowledge` as agents,
  `customerservice.manager` as manager; Privacy team: `customerservice.admin` only. No seeded user is in both
  organizations.
- **Customers.** `CustJqp` (Joe Q Public, a person) and `JoeDist` (Joe's Distributing, a company with contacts) are
  Retail's; `ORG_ACME` is shared (owner `_NA_`), so another organization's records about it must stay out.
- **Foreign scope.** `ORG_ZIZI_SERVICES` has its own queue, team, policy, agent `customerservice.services`,
  customer `BOSS_CS_CUST_OTHER`, order `BOSS_CS_SO_OTHER` and case `BOSS_CS_CASE_OTHER`; it has no service levels or
  channel routes (F82).
- **Returns are not settled separately in Retail.** Retail inherits no `returnSettlementRequired`, so its
  ReturnDetail offers no Receive or Settle: it says Mantle receives the return when its shipment is delivered and
  the return SECAs respond. The acceptance Returns walk sets the flag to `Y` through Accounting's
  `store#Preferences` and restores it. CS-21/22 need the same prepared change or a separately
  settling organization in the service user's scope. Warehouse's `BOSS_WH_RETURNS` is one: it settles separately and,
  as a direct rollup child of Retail, is among every Retail agent's organizations (Mantle `get#PartyInternalOrgIds`)
  unless the user's active organization narrows it to Retail; but its `BOSS_WH_RMA` is WH-26's, so a return of it
  would be prepared. Accounting's `BOSS_ACCT_ORG` is not Retail: an Accounting user's refusal there is not evidence
  about Retail's financial role separation.
- **Dates.** Use the real clock in the review machine's current zone (America/Chicago on current machines; it will
  vary) and record both; no DST or second-zone checks (user decision, 2026-11-11). The demo cases are fixed at
  2026-11-02 to 2026-11-04, so their clocks are long overdue by execution; prepare fresh cases for live clocks. The
  demo orders (and the held order) are made when the demo loads, so the return window (365 days from delivery) and the
  thermostat's 12-month warranty from its ship date stay current; an expired window or coverage must be prepared.
  Working hours are Monday to Friday 9:00–17:00 America/Chicago and no holiday is seeded (the SLA walk prepares one).
  Feedback links last 14 days, the public form route's tokens 90 days, an RMA authorization 14 days.

### Actors

Every seeded Customer Service user is an agent (`PrtAgent`) of Retail, the foreign agent of Services. All but the
administrator are in the root user group `BOSS_CUSTOMER_SERVICE` (launcher, `PRODUCT_CATALOG_VIEW`) plus at most one
capability group (the W agent and F authorizer also borrow another app's group). Home, Cases,
Customers, Orders, Availability and Knowledge are every user's; Returns admits agent, manager, return authorizer
and administrator; Reports the same; Approvals manager, return authorizer and administrator; Settings the
administrator and (read, own teams' members and hours) the manager; SavedReplies also the agent; NewCase agent,
manager and administrator; CaseToArticle the knowledge author and administrator; ArticleFeedback those and the
manager. Each write also checks its Mantle permission (`CustomerService.js` maps them to capabilities).

| Role term in §4 | Username | Grants beyond the root | Refusal it supplies |
| --- | --- | --- | --- |
| agent | `customerservice.agent` | `SUPPORT_CASE_EDIT`, `ORDER_CHANGE_REQUEST`, `CUSTOMER_CREDIT_VIEW`, `PRICE_VIEW`; Support team | merge and SLA correction (`SUPPORT_CASE_MANAGE`), decisions, apply, authorize, settings saves, invitation, CaseToArticle |
| manager | `customerservice.manager` | `SUPPORT_CASE_EDIT`, `SUPPORT_CASE_MANAGE`, `RETURN_EXCEPTION_APPROVE`, `ORDER_CHANGE_APPROVE`, `WARRANTY_APPROVE`, `SUPPORT_CONTACT_INVITE`, `PRICE_VIEW`; Support team manager | policy, rule, route and template saves (`SUPPORT_POLICY_EDIT`), apply, authorize; the Privacy queue |
| order desk | `customerservice.orderdesk` | `ORDER_CHANGE_APPLY`, `ORDER_CHANGE_HOLD_RELEASE`, `PRICE_VIEW`; no team | filing or deciding a change, NewCase, case edits, Returns/Approvals/Reports |
| return authorizer | `customerservice.returns` | `RETURN_AUTHORIZE` | exception decision, case edits, NewCase, receive, settle |
| knowledge author | `customerservice.knowledge` | `SUPPORT_KNOWLEDGE_EDIT`; Support team member | case edits, NewCase, Returns, Reports |
| service administrator | `customerservice.admin` | `BOSS_CUSTOMER_SERVICE_ADMIN` alone (ALWAYS authz, active-organization filter): every Customer Service permission plus `SUPPORT_POLICY_EDIT`, `RETURN_POLICY_EDIT`, `WORKING_HOURS_EDIT`; Privacy team | none useful: sees Privacy and every area, so never a narrow-role or isolation negative |
| W agent | `customerservice.agentwh` | agent grants plus `BOSS_WAREHOUSE_RECEIVE` (`STOCK_RECEIVE`) and `BOSS_WAREHOUSE_INSPECT` (`QUALITY_INSPECT`); no `BOSS_WAREHOUSE` root | Warehouse root; dispose and verify |
| F authorizer | `customerservice.returnsar` | return authorizer plus `BOSS_ACCOUNTING_AR` (`RECEIVABLE_EDIT`, `RECEIVABLE_VIEW`, `PAYMENT_VIEW`, `CUSTOMER_CREDIT_VIEW`); no Accounting root | refund (`PAYMENT_EDIT`), receiptless credit (`RETURN_CREDIT_APPROVE`), Accounting root |
| reader | `customerservice.read` | none | every write, NewCase, Returns/Approvals/Reports/Settings, prices, credit status |
| foreign agent | `customerservice.services` | agent grants in `ORG_ZIZI_SERVICES`; Services team | every Retail record |
| Projects client contact | `sheldon.acme` | none in Customer Service | the root and every `ironstone.customerservice` service (FoundationWalk) |
| public contacts | `dana@joesdist.example.com`, `morgan@joesdist.example.com`, `joe@public.com` (demo password `moqui`) | PASS accounts on `ZIZI_PORTAL`: Joe's Distributing contact, its customer administrator, Joe Q Public's own account (self relationship) | staff BOSS surfaces; a colleague's case for the contact |
| guest order holder | unsigned-in session | `SalesOrder`/`OrderView` capability Shop keeps under `passShopOrders:<siteId>` for one order and site | MyCases, MyReturns, other orders and general case/return detail |
| prepared | — | disposer (`BOSS_WAREHOUSE_QUALITY_MANAGER` added to `agentwh`, as the Returns walk does); refund holder and receiptless approver: `customerservice.returnsar` with temporary `BOSS_ACCOUNTING_TREASURY` / `BOSS_ACCOUNTING_APPROVE`, as listed with the shared [prepared Retail finance identities](ui-review-accounting.md#prepared-retail-finance-identities); a `SALES_APPROVE` holder only if the user authorizes it; an expired team member; a multi-organization service user | — |

Verify loaded memberships, permissions and organizations before interpreting a refusal. Pair each refusal with an
otherwise-valid success by a holder and name the grant the refused fixture lacks; a validation error is not
permission evidence. Warehouse's own `warehouse.quality` cannot serve as the disposer here: it has no
Customer Service root. Never use ADMIN (`john.doe`) as the case worker or as organization-boundary evidence.

### Fixtures

Use the current `test/CustomerService/CustomerServiceSpecLib.js` ids and the demo loaders; prepare only what a wave
needs and inspect each record's current state first.

| Fixture family | Starting evidence and variations |
| --- | --- |
| Cases | `BOSS_CS_CASE_THERMO` (Joe, assigned to the agent, linked to the delivered order, with a reply and an internal note), `BOSS_CS_CASE_FILTERS` (Joe), `BOSS_CS_CASE_PICK` (JoeDist, waiting, assigned to `agentwh`), `BOSS_CS_CASE_PRIVACY`, `BOSS_CS_CASE_OTHER`; the feedback demo's resolved "Replacement filter arrived damaged" and the Support demo's "Order of filters short by one box" (filed by Dana) |
| Orders and products | `BOSS_CS_SO_DELIVERED` (Joe: one thermostat `BOSS_CS_THERMOSTAT`, two filters `BOSS_CS_FILTER`; invoiced, paid by check), `BOSS_CS_SO_PICK` (JoeDist, four filters, reserved), `BOSS_CS_SO_PACKED` (JoeDist, two filters, pack invoice final at pack), `BOSS_CS_SO_HELD` (Joe, a manual hold, not a credit hold), `BOSS_CS_SO_OTHER`; substitute `BOSS_CS_FILTER_PLUS` (`PatEquivalent`); thermostat serials `CS-THERMO-1001/1002`, the shipped one derived from its issuance as the helper does |
| Service levels and assignment | `BOSS_CS_SLA_RETAIL` (team hours, Normal band 4 business hours to first response and 24 to resolution, no hold pause, reopen starts a new episode), `BOSS_CS_SLA_PRIVACY` (around the clock); rule `BOSS_CS_RULE_SUPPORT` (manual distribution) |
| Replies and templates | saved replies `BOSS_CS_REPLY_DETAILS` (team-shared, manager-owned; tag and Waiting for customer), `BOSS_CS_REPLY_FILTERS` (Retail-wide; assign to me), `BOSS_CS_REPLY_PATIENCE` (the agent's own); templates `BOSS_CS_TPL_DEFECTIVE` (serial shown and required for equipment; internal assessment) and `BOSS_CS_TPL_WARRANTY` (the `RqtWarranty` type's, taken before the queue's) |
| Channels | routes `BOSS_CS_ROUTE_MAIL` (acknowledgement `BOSS_CS_ACK_SUPPORT`) and `BOSS_CS_ROUTE_FORM` (20 per hour, 90-day tokens); the Support demo's intake token (`SupportDemo.js` `SUPPORT_TOKENS`); no forum site of Customer Service's own (the Channels walk creates one) |
| Returns and warranty | policy `BOSS_CS_RPOL_RETAIL` (365 days from delivery, 14-day authorization, defect/damage/mis-ship for credit, refund or replacement, evidence required for defect and damage, no receiptless credit, other reasons by exception) with reason rows `BOSS_CS_RRSN_DEFECT/_DAMAGED`; the Warehouse demo's requested return `BOSS_WH_RETURN` (WH-26's refusal case; read it only); warranty feature `BOSS_CS_WARRANTY_12`; no demo claim |
| Knowledge and feedback | articles in `ZZW_RETAIL` (English and Spanish published help, a draft) and the internal `ZZW_SVC` article; form "Retail case feedback" (60-minute delay, once per case, one reminder after 3 days, score ≤ 2 followed up by the Support team within 2 days) with one answered invitation (rated 4) |

**Consumption.** Each record exists once, and the acceptance walks consume or move most of them:

- Merge (CS-10) ends one of Joe's two open cases; resolve, reopen and auto-close (CS-12) and assignment (CS-06)
  move others. Work on copies and keep an untouched baseline for CS-01/28 counts.
- `BOSS_CS_SO_PICK` takes CS-17's short pick and substitution once; a second branch (stale stock, cancel of the
  remainder) needs another awaiting-pick order. `BOSS_CS_SO_PACKED` answers only `BILLING_CONFLICT`; the
  reopen-after-pack branch needs an in-process copy, as the Order changes walk makes.
- `BOSS_CS_SO_DELIVERED` has one thermostat and two filters: CS-23's warranty claim, CS-19–22's partial boxes and
  CS-33's customer return would compete for it. Give CS-19–22 their own delivered order of several units (the
  Returns walk ships three filters) and keep the demo order for CS-15, CS-23 and CS-33.
- The answered demo invitation cannot be answered again; CS-27 needs a fresh invitation from CS-26's resolved case.
- Across reviews: CS-17's short pick on a shipment of `BOSS_CS_SO_PICK` is made by `warehouse.pick` in WH-19 (a
  shared runtime) or prepared here as the Order changes walk does; CS-21's default observation and WH-26's
  `RETURN_SETTLEMENT_OFF` branch run before CS-21/22 set Retail's flag or after it is restored; `BOSS_WH_RMA` is
  WH-26's, not CS-21's.
- The guest branch needs a disposable Shop order with an open remainder and a delivered self-service-returnable
  line, entered through its Shop confirmation or emailed link, plus a second order, another site and
  expired/revoked capability variants. Do not paste capability values into the record.

Prepare empty/populated/filtered lists, long/localized subjects and customer names, duplicate-looking cases,
restricted/private content and files, two rows per repeated dialog, a choice whose selected value is outside the
current page, a stale revision, changed stock, an expired token, a duplicate operation, a revoked role and an
independent failed batch member.

### Area criteria

Apply the guide's [judgment criteria](../../../../../docs/dev/UI-Review.md#judge-the-result) (1920×1080 light/dark,
1280px, 390px, keyboard, contrast; actual TUI; bounded Standard `/apps` check). Customer Service adds:

- **Audience is the first thing to read.** Internal note, customer reply, public forum response, saved-reply
  action, customer copy and internal summary must be distinguishable by text, not color; a send button must say who
  receives it. Customer labels of statuses and template fields differ from the agent's and must never leak internal
  ones.
- **Clocks and obligations.** Business versus elapsed time, the calendar and zone, paused, overdue, breached and
  reopened episodes are explicit in the header cards, Service level tab, Home and reports; check their chip and
  warning contrast in both themes.
- **Withheld is not zero.** Order, invoice and return amounts, credit status, cost and supplier price are absent
  for a non-holder; check headers, totals, choices, counts and exports, not only the visible cell.
- **States do not imply the next step.** Approved is not applied, authorized is not received, received is not
  settled, settled is not refunded, resolved is not closed; each has its own visible state.
- **Boards and bulk.** The Cases board's move (`changeCaseStatus`) has a row-action and keyboard equivalent; a
  refused move returns to the actual state. Bulk assign, status, tag and reply name each case's outcome.
- **Mode variants.** Twenty local screens carry `render-mode` sections (§3); no local `.qvue` or `.tui.json`.
  Chatter, RecordFiles and Knowledge are QVue components with Tui siblings. PASS Support is a browser surface with
  `.html.fancy` pages, not a terminal application.
- **Outputs.** Inspect the bytes: the four report CSVs, CaseAnalytics' event CSV, StockAtDate CSV/XLSX,
  InventoryAvailability Locations/Movements CSV, html-print CaseSummary and ReturnAuthorization, the stored order
  confirmation, change confirmation and RMA, the return label, and captured mail with its recipients. A download
  name, queued message or HTTP 200 is not proof of content or delivery.

### Waves

| Wave | Activities | Exit evidence for later execution |
| --- | --- | --- |
| W1 — Foundation and intake | CS-01–04, 13–14; CS-34's positive/negative pairs established | Actor grants, scope and navigation baseline; customer lookup; case creation and case work; configuration consumers |
| W2 — Conversation, routing and clocks | CS-05–09 | Audiences and captured sends, assignment explanations, saved/bulk replies, clocks and intake provenance |
| W3 — Relations, closure and records | CS-10–12, 29–30 | Merge/split lineage, resolve/reopen/auto-close, summaries and files on the right record |
| W4 — Order continuity | CS-15–18 | Order/shipment/invoice projection, availability, applied cancel/substitute, routed commercial change |
| W5 — Returns and warranty | CS-19–23 | Policy, RMA and label, partial receipt and quality, settlement, warranty decision and repair |
| W6 — Knowledge, feedback and reports | CS-24–28 | Published/internal knowledge, drafts, dated forms, invitations, follow-up and reconciled measures |
| W7 — Customer handoff | CS-31–33 | Invitation and Support settings, signed-in and guest Support journeys with staff continuations |
| W8 — Reconciliation | CS-34–35 | Remaining access, handoff, mode and output gaps closed from earlier receipts |

Cross-wave continuations (record each open one in the originating ledger row):

- CS-03 cases → CS-04–12; CS-12 resolution → CS-26 invitation → CS-27 answer; CS-10/11 lineage → CS-28 counts.
- WH-19's short pick on a `BOSS_CS_SO_PICK` shipment (or the prepared one, above) → CS-17; CS-16 availability →
  CS-17.
- CS-19 → CS-20 → CS-21 → CS-22 on one return; CS-23's replacement → that same return flow.
- CS-19–22 returns, CS-26–27 responses and CS-10–12 relations → CS-28 measures.
- CS-31 invitation → CS-32's signed-in contact; CS-32/33's staff continuations → CS-04, CS-17 and CS-20.
- Every hidden or inherited route, file and export → CS-34; every cross-app handoff → CS-35.

Access and audience checks run beside each activity; the last wave closes their gaps instead of replacing them with
a final all-roles/all-modes sweep. One wave can span several bounded batches. Corrections wait for the refinement
pass (below); acceptance runs and the commit cadence follow §5, and this plan
does not authorize feature construction.

### Review and refinement phases

Execution runs as the guide's [two separate passes](../../../../../docs/dev/UI-Review.md#record-fix-and-verify)
(user decision, 2026-11-11):

1. **Review pass.** Concurrent review agents under one coordinating agent execute every activity in the waves above
   and record each outcome, its evidence and every finding in §6. They change no source and no design or
   implementation record, and they correct nothing. A defect that stops a step is recorded; the walk continues from a
   disposable workaround named in the finding, or the step is marked blocked. The coordinator assigns activities,
   owns the runtime or runtimes, sequences fixture consumption and temporary setting changes, and restores them (§2).
   The pass ends when every activity of this review and of its companion reviews has a ledger outcome.
2. **Refinement pass.** Only after the review pass ends, the coordinator triages the whole findings register together
   with the companion reviews' registers: merge duplicates and shared causes, assign the owning layer (BOSS, Mantle or
   framework) and order by severity. Findings are then addressed in bounded batches: correct → rerun the affected
   activities → verify (§5) → record the retest in the finding. A deferred or accepted finding keeps its reason.

## 3. Screen and surface inventory

Routes are relative to `/qapps/`. **B** means this component's `screen/`. Append a local name to its directory and
`.xml` for its source. Current source has **49 local XML definitions**: the root, Home, nine containers and 38
children. Recursive physical children plus explicit mounts give **135 route instances**: the 49 local ones, 80 from
Shared and six from Commons. These are inventory candidates, not proof that every route is reachable by every actor.
Customer Service has no app-local `.qvue` or `.tui.json`; inline variants and mounted custom components remain in
scope.

### Local routes

| Route prefix / source directory | XML definitions | Activities |
| --- | --- | --- |
| root | `CustomerService` | CS-01, 34–35 |
| `CustomerService/` | `Home` | CS-01, 06, 08, 20, 27–28 |
| `CustomerService/` | `Cases`, `Customers`, `Orders`, `Returns`, `Approvals`, `Availability`, `Knowledge`, `Reports`, `Settings` | Containers; defaults below |
| `CustomerService/Cases/` | `Cases`, `NewCase`, `ChannelSessions`, `BulkReply` | CS-03–09 |
| `CustomerService/Cases/` | `MergeCases`, `SplitCase`, `CaseSummary` | CS-10–11, 29 |
| `CustomerService/Customers/` | `Customers`, `ContactDetail` | CS-02, 31 |
| `CustomerService/Orders/` | `Orders`, `OrderChanges` | CS-15, 17–18 |
| `CustomerService/Returns/` | `Returns`, `NewReturn`, `ReturnAuthorization`, `WarrantyClaims`, `WarrantyAssessment` | CS-19–23 |
| `CustomerService/Availability/` | `Products` | CS-16 |
| `CustomerService/Knowledge/` | `ArticleFeedback`, `CaseToArticle` | CS-25 |
| `CustomerService/Reports/` | `ReportsHome`, `ServiceLevelCompliance`, `ResponseTimes`, `CaseVolumes`, `ReturnAnalysis`; `CaseAnalytics` (also an explicit hidden mount of its own file, opened from a case) | CS-08, 28 |
| `CustomerService/Settings/` | `SettingsHome`, `ServiceDefaults`, `Queues`, `CaseTypes`, `StatusCategories` | CS-13, 26, 31 |
| `CustomerService/Settings/` | `AgentTeams`, `AssignmentRules`, `SavedReplies`, `ServiceLevelPolicies`, `ChannelRouting`, `CaseTemplates` | CS-06–09, 14 |
| `CustomerService/Settings/` | `ReturnPolicies`, `KnowledgeSources` | CS-19, 24 |

### Defaults and shared mounts

| Container | Default child | Activities |
| --- | --- | --- |
| CustomerService | Home | CS-01 |
| Cases / Customers / Orders / Returns | Cases / Customers / Orders / Returns | CS-02–04, 15, 19 |
| Approvals | Notifications (Commons, filtered to `ReturnExceptionApproval` and `OrderChangeApproval`) | CS-17, 20 |
| Availability | Products (local) | CS-16 |
| Knowledge | Knowledge (Commons) | CS-24 |
| Reports / Settings | ReportsHome / SettingsHome | CS-28 / CS-13 |
| Customer360 | `Contact`, with `conditional-default` `ServiceOverview` when `appRoot` is CustomerService | CS-02, 15 |
| Product360 / InventoryAvailability / StockAtDate / Product360's BOM | Summary / Summary / Places / Overview | CS-16, 34 |

The routes below mount existing sources. CaseDetail tabs are selected with `tab` (`conversation`, `overview`,
`work`, `files`, `sla`, `knowledge`, `reply`), not physical child screens. ServiceBilling is not a generic
payment-maintenance route, and shared Product360's physical children do not make catalog maintenance part of
Customer Service.

| Route under `CustomerService/` | Source under B and context | Activities |
| --- | --- | --- |
| `Chatter`, `Chatter/ChatterTui` | Shared Chatter and terminal helper | CS-05, 30, 34–35 |
| `RecordFiles`, `RecordFiles/RecordFilesTui` | Shared files and terminal helper | CS-30, 34–35 |
| `Approvals/Notifications` | Commons Notifications; approve/refuse call the topics' handlers and decide at the message's revision | CS-17–18, 20 |
| `Cases/CaseDetail` | Shared RequestDetail with `CustomerServiceCaseDetail` and its reply, call-log, channel, knowledge and lineage templates | CS-03–12, 19, 23–25, 29–30 |
| `Cases/WorkItemDetail` | Shared WorkItemDetail, only linked follow-up work the case user may see | CS-04 |
| `Customers/Customer360` | Shared Customer360 with `CustomerServiceCustomer360`; service tabs below | CS-02, 15, 23, 28 |
| `Orders/OrderDetail`, `Orders/ShipmentDetail`, `Orders/InvoiceDetail` | Shared record sources with the Customer Service sections (`linkOrderCase`, `resendConfirmation`, `confirmationFile`, `serviceInvoiceCopy`) | CS-15, 17–18 |
| `Orders/OrderChangeDetail` | Shared OrderChangeDetail; `requestId` identifies the proposal, `orderId`/`pickExceptionId` start one | CS-17–18 |
| `Returns/ReturnDetail`, `Returns/QualityInspection` | Shared ReturnDetail/QualityInspection with `CustomerServiceReturnDetail` (`cs*` transitions); W/F operations by their grants | CS-19–22 |
| `Availability/Product360` | Shared Product360 in the customer-safe service context | CS-16 |
| `Availability/InventoryAvailability`, `Availability/StockAtDate`, `Availability/PriceExplain` | Shared stock, stock-at-date and price explanation, each with its own read authority and scope | CS-16 |
| `Knowledge/Knowledge`, `Knowledge/KnowledgeTui` | Commons Knowledge (with `inCustomerService`) and its terminal sibling | CS-24–25, 35 |
| `Knowledge/Knowledge/{Spaces,SpaceDetail,Review}` | Physical Commons Knowledge descendants; wiki permission/context inspection | CS-24–25, 34 |
| `Settings/FeedbackForms`, `Settings/FeedbackFormDetail` | Shared SurveyForms/SurveyFormDetail with the service feedback context | CS-26 |
| `Reports/SatisfactionResults`, `Reports/ResponseDetail` | Shared SurveyResponses/SurveyResponseDetail, out of the menu; ReportsHome offers them to service management only (F186) | CS-27–28 |

Account for inherited children explicitly; hidden or excluded variants belong to CS-34 supporting inspections with
an authorized counterpart, not to invented service workflows:

| Parent / descendant set | Service presentation or inspection boundary |
| --- | --- |
| Customer360 service children | `ServiceOverview`, `ServiceCases`, `ServiceOrders`, `ServiceBilling`, `ServiceActivities`, `ServiceStatistics`, `ServiceDeliveredItems`, `ServiceReturns`: customer-safe contact, case/order/billing/activity, measures, serial/warranty and return work in CS-02/15/19/23/28 |
| Customer360 other children | `Contact`, `Orders`, `Money`, `Credit`, `Agreements`, `Activities`, `FinanceDetails`, `Files`, hidden `InsightsRecord`: inspect current tab admission, direct requests and their separate read/write rules; no payment credentials or another organization's records |
| Product360 physical children | `Summary`, `Features`, `Categories`, `Identifiers`, `Dimensions`, `Documents` (with `Documents/Index`, Shared Documents), `Equipment`, `Associations`, `Parties`, `Connections`, `History`, `Replenishment`, `PurchaseHistory`, `PaidAccess`, `KitComponents`, hidden `InsightsRecord`: inspect advertised service tabs and excluded direct children separately |
| Product360 mounted children | `Packaging`, `Prices`, `Suppliers`, `Costs`, `Stock`, `BOM`: Shared Packaging/Prices/SupplierPrices/StandardCosts/InventoryAvailability/BillOfMaterialsDetail; the service context turns cost, supplier price and policy off, and a price read never implies cost or method authority |
| Product360 nested children | Stock's `Summary`, `Projection`, `Policy`, `Locations`, `Movements`, `Reservations`; BOM's `Overview`, `BillOfMaterialsExplosion`, `BillOfMaterialsCompare`, `WhereUsed`, `RoutingDetail` |
| Independent InventoryAvailability | The same six stock children at `Availability/InventoryAvailability`; inspect both consuming paths without treating one success as proof of the other's context |
| StockAtDate | `Places`, `History`; cutoff date, customer-serving facility and drill-back in CS-16 |
| Knowledge and record helpers | Knowledge's three children and terminal sibling, ChatterTui, RecordFilesTui, shared choice/file/print/preview endpoints; no extra authority from a helper URL |

### Dialogs, custom modes, outputs and embedded surfaces

| Surface family | Supporting inspection and recovery | Activities |
| --- | --- | --- |
| Case creation and template inputs | Identify customer/contact/type/queue; duplicates/articles; dependent fields and submit; cancel/back after a source change | CS-03, 14 |
| Case record | Resolve/Reopen/Hold, Assign, priority, queue, tags, follow-up work, SLA Correct; Conversation, Saved reply, Overview, Work, Files, Service level, Knowledge tabs; Recent cases pane; More → CaseSummary, Merge, Split | CS-04–08, 10–12, 24, 29–30 |
| Case bulk/relations | Board status move, bulk assignment/status/tag/reply, Merge preview/confirm, Split message selection, follow-up case | CS-06–07, 10–12 |
| Channels and replies | Call log, public forum preview/publish, saved-reply preview/apply, send/retry and message/file audience | CS-05, 07, 09 |
| Customer and commercial records | ContactDetail channels/consent/notes/avatar/export/delete under the record's own party checks, Invite to support, stored confirmation download/resend, link case, invoice copy, order-change propose/preview/decide/apply/withdraw/send | CS-02, 15, 17–18, 31 |
| Returns | Source/lines/preview, authorize/exception, line edit, assign, label, close remainder, cancel, RMA send/print, receive each box, settle preview/confirm, batch authorize/cancel | CS-19–22 |
| Warranty | Evidence/coverage trace, decision, goodwill override, repair link/update, customer consent and replacement handoff | CS-23 |
| Knowledge | Search/link/unlink/send/rate/suggest edit; CaseToArticle answer selection/redacted preview; ArticleFeedback review; source save/end | CS-24–25 |
| Feedback | Shared form create/copy/publish/dated question edits, delivery policy save/end, results/detail and follow-up; public answer page | CS-26–27 |
| Configuration | Team/membership/hours/participation, assignment rule/conditions/preview, status mapping/moves, case types/defaults, SLA simulation, template fields/conditions/preview/publish/use for queue, route test/token issue and removal/held review, return-policy preview, Support mount settings | CS-06–09, 13–14, 19, 26, 31 |
| Physical/retained outputs | CaseSummary customer/internal (html-print), ReturnAuthorization (html-print), stored confirmation/change/RMA/summary files, captured mail and label bytes | CS-15, 17, 20, 29 |
| Analytical outputs | Four report CSVs (`exportCsv`); CaseAnalytics' event-list CSV; survey results/detail as offered | CS-27–28 |
| Shared stock outputs | StockAtDate Places/History CSV and XLSX; InventoryAvailability Locations/Movements CSV, under both stock paths | CS-16 |
| Inherited denied-context outputs | Product360 Prices (CSV, XLSX), Suppliers (CSV, XLSX), Packaging, Costs and BOM Explosion/Compare/Where used (CSV); inspect each direct request in the service context against an authorized owning-app counterpart, not as a promise of service pricing or cost authority | CS-34 |
| Shell and adjacent entries | Quick create Case (NewCase groups) and Return (Returns groups); palette (orders, customers by email/phone, cases, RMAs); Today's own due cases; topics `SupportCaseAssigned`, `SupportCaseCustomerReply`, `SupportCaseSlaWarning`, `SupportCaseSlaBreach`, `OrderChangeApproval`, `ReturnExceptionApproval`, `ReturnDecision`, `WarrantyRepairFinished`, `CaseFeedbackFollowUp`; call context `boss.cases` in Comms; shortcuts `g v/c/u/o/r` | CS-01, 05, 08–09, 17, 20, 23, 27 |

Authored `render-mode` sections: qvt, tui and html in Cases (two), BulkReply, ChannelSessions, Customers, Orders,
OrderChanges, Returns, WarrantyClaims, WarrantyAssessment, ArticleFeedback, AssignmentRules, CaseTemplates (four),
CaseTypes, ChannelRouting, KnowledgeSources, SavedReplies, ServiceLevelPolicies and SettingsHome; CaseSummary and
ReturnAuthorization have one html/html-print/qvt section and a tui one. Inspect these and their shared/template
counterparts at the relevant activities; common XML rendering alone does not establish parity.

PASS Support has nine XML child screens with `.html.fancy` templates: `SupportHome` (the default), `MyCases`,
`NewCustomerCase`, `CustomerCase`, `MyReturns`, `RequestReturn`, `CustomerReturn`, `CustomerArticle`, `Feedback`.
Their endpoints are CustomerCase `reply`/`reopen`/`cancel`/`file`, NewCustomerCase `submit`/`cancelOrder`,
RequestReturn `submit`, CustomerReturn `evidence`/`withdraw`/`label`, CustomerArticle `rate` and Feedback `submit`.
The guest Shop order link enters `NewCustomerCase` and `RequestReturn` (CS-32–33). These are routes under the
configured Support mount, not `/qapps/CustomerService` children.

### Design-to-code reconciliation

| Design or historical statement | Current review treatment |
| --- | --- |
| Pre-build placeholders, proposed groups, statuses and case rules | Historical introductions; actual roots, grants, Mantle services and seeded workflow/status mappings govern this plan |
| CaseDetail pictured as an independent screen with child tabs | Shared RequestDetail's Customer Service section; `tab` values select its panels; there is no physical CaseDetail child tree |
| Menu: Availability → InventoryAvailability, StockAtDate, Product360 | Availability's default is the local Products list; Product360 and PriceExplain are hidden mounts reached from it |
| Menu: Reports → CSAT results | SatisfactionResults/ResponseDetail are out of the menu; ReportsHome's catalogue offers them to service management (F186) |
| Approvals as an app area | Commons Notifications filtered to the two decision topics; it holds no decision of its own |
| CaseDetail Items tab and internal template answers in the internal summary (impl §7, F218, F219) | Inspect the current absence or limited output as a boundary; do not promise either |
| Commercial order-change kinds applied by the order owner | Sales is not built and no BOSS group holds `SALES_APPROVE` (F158); Customer Service files and routes them only (CS-18) |
| Other app contexts listed as future in impl §7 | Commerce's ReturnDetail opens Customer Service; Insights reads the service-clock datasets and InsightsRecord; inspect current bounded links |
| Availability projection beyond the older Products/Warehouse baseline (CX-AVAILABILITY, F31) | Read current readiness/provenance; unready is not zero, and quantity is not a reservation or ship-date promise |
| Knowledge suggestions and external sources | Wiki sources, multilingual suggestions, draft/internal labels and feedback are built; index ranking (F107) and external sources remain §7 |
| ResponseTimes next-response clock (F193); ReturnAnalysis shipped denominator and refunded amounts (F195); past-as-of backlog (F212) | Keep the implemented measures and their basis explicit; old desired metrics are not claims of completeness |
| Presence/typing, case time logging, ChannelAutomation, repair quote/intervention report, Support terminal pages | §7 work; inspect only a currently supplied widget |
| PASS Support terminal and generic public case access | Support is browser/facade based; public form submission, signed-in contact/customer-admin access, feedback tokens and return/order capabilities have different contracts |

## 4. End-to-end activities

The §6 ledger holds status and evidence. Use visible controls and inspect intermediate states, confirmations,
persisted results and a second identity where relevant; a render, HTTP 200 or service-only mutation does not complete
an activity. Browser means Material light/dark; TUI means actual supported terminal operations; Standard means the
brief functional/output/fallback check. Record unattempted modes and recovery branches in §6. Role terms are §2's
actor table.

### CS-01 — Start a service workday in the right scope

- **Actor/start:** agent, manager, reader and foreign agent, with populated/empty queues; a prepared
  multi-organization service user for the organization switch.
- **Objective/steps:** open Customer Service → inspect organization and Home's period/basis → follow My cases,
  team queues, approvals waiting and permitted metric links → record → Back. Open Today and a notification,
  search the palette, use a visible shortcut and open/cancel/reopen New case and Request return where offered.
- **Expected:** Home and destination rows use the same scope; missing configuration is distinct from zero activity;
  denominators and read time explain measures. The reader keeps Home, Cases, Customers, Orders, Availability and
  Knowledge without Returns, Approvals, Reports, Settings or either quick create. A quick create starts clean rather
  than inheriting the previous record's identity.
- **Recovery:** no service organization, no matching queue/cases, unavailable record, changed active organization,
  denied area and one failing independent aggregate. Record whether other panels remain usable.
- **Screens/modes:** root/Home, section defaults, shell providers and representative lists; browser/TUI/Standard,
  keyboard and 390px samples. CS-28 supplies the detailed metric reconciliation.

### CS-02 — Identify the customer and reach the right contact record

- **Actor/start:** agent, reader and foreign agent; `CustJqp`, `JoeDist` with its contacts, shared `ORG_ACME`
  and `BOSS_CS_CUST_OTHER`, with similar names and one email/phone matching several contacts.
- **Objective/steps:** Customers → search by customer name, email, phone and exact identifier → Customer360 →
  ServiceOverview/contact details → ContactDetail → inspect contact channels, consent, notes and export/delete as
  offered → return to the customer's cases and orders. Follow the same customer from a case and an order.
- **Expected:** names disambiguate results; company/customer/contact identities remain distinct; a shared customer
  shows only Retail's records. Contact maintenance follows the record's own party checks and Support invitation its
  own grant; consent explains its purpose and state rather than implying permission to send.
- **Recovery:** no match, stale contact, private contact field, denied edit, wrong customer, canceled dialog and
  selected choice outside the first result page. A foreign (`customerservice.services`) and a nonexistent record
  get the same "not available" answer.
- **Screens/modes:** Customers, Customer360/ServiceOverview, ContactDetail and contact/consent templates;
  browser/TUI/Standard, long names and keyboard/narrow forms. Invitation continues in CS-31.

### CS-03 — Create a case with the right source and template

- **Actor/start:** agent with a customer/contact, the Support queue and `BOSS_CS_TPL_DEFECTIVE`; Joe's two open
  cases as duplicates and a suggested article; the `RqtWarranty` type with `BOSS_CS_TPL_WARRANTY`. Reader, order
  desk and knowledge author as NewCase refusals.
- **Objective/steps:** quick create, Customers or a source record → NewCase → identify customer and source → inspect
  duplicates/articles → choose offered organization/type/queue/template → enter subject, channel, description and
  dependent fields (equipment → serial) → submit → open CaseDetail and confirm customer, source links, assignment
  and template values.
- **Expected:** duplicate information helps a decision without blocking a distinct case; validation explains the
  field required by the chosen template; a successful create has the intended Request/profile/parties and no partial
  case from a refused template. Warranty intake uses the type's template before the queue's.
- **Recovery:** missing required conditional value, queue not offering the type, foreign customer, unavailable
  template, changing customer after choosing a source and a serial not the customer's. Preserve useful inputs, and
  check F185 (the whole case refused for such a serial; a resold serial offered) against current behavior before
  classifying it.
- **Screens/modes:** NewCase, duplicate/article lists, template preview and CaseDetail; browser/TUI/Standard,
  keyboard and 390px dependency/validation sample. Template maintenance is CS-14.

### CS-04 — Work a case and coordinate its follow-up tasks

- **Actor/start:** agent, reader and the assigned worker; an open case with linked order, files and a follow-up
  task; the same case through Commons' request view and Projects' triage as fewer-rights counterparts.
- **Objective/steps:** Cases → find/list/board → CaseDetail → inspect header, Overview and related records → change
  priority, queue, tags and permitted status with reason → Work → create/open/complete a follow-up task → return.
  Compare the status action with the board move and test Back to the retained list filter.
- **Expected:** the next action and customer-facing state are understandable; record changes preserve the case's
  organization/customer and revision; work completion tells the case owner but does not resolve the case. Commons'
  Resolve/Cancel are hidden without `SUPPORT_CASE_EDIT`, and Commons' due-date edit is refused on a case.
- **Recovery:** stale case revision, unavailable queue/assignee, prohibited transition, canceled edit, removed task
  link and the reader's attempt. A rejected board move returns to the actual state.
- **Screens/modes:** Cases, CaseDetail Overview/Work, WorkItemDetail, bounded Commons/Projects counterpart;
  browser/TUI/Standard, keyboard equivalent to drag and two-row action/dialog checks.

### CS-05 — Reply, note and log a conversation with the correct audience

- **Actor/start:** agent on a case with customer mail, internal notes, attachments and a call; a local forum
  topic escalated through PASS (prepared, as the Channels walk does); the customer contact and reader as audience
  counterparts. Mail capture on (§2).
- **Objective/steps:** CaseDetail → Conversation → inspect thread/source/time → add internal note → prepare a
  customer reply with permitted attachment → confirm recipient/audience → send from `BOSS_CS_SERVICE_MAIL` → reopen
  the message and its status. Log a call from the case or ChannelSessions; for the escalated topic preview the
  public reply and publish to the disposable local topic.
- **Expected:** internal, customer and public content remain distinguishable; the sent message is on the original
  case/thread; only an accepted outward reply satisfies first response. Call outcome/duration and forum source are
  retained. A private note never becomes a public forum response, and ChannelSessions' customer view omits an
  internal call.
- **Recovery:** failed send (capture off, the 127.0.0.1:9 sink), unknown outcome, inaccessible attachment, missing
  account/recipient, canceled public preview, changed case and duplicate retry. Inspect the existing message
  identity before retrying a send.
- **Screens/modes:** CaseDetail Conversation, Chatter/Compose, ChannelSessions/call log and forum preview;
  browser/TUI/Standard with truthful rich-editor/delegation limits and inspected captured recipients/content.

### CS-06 — Assign work fairly and explain an unassigned case

- **Actor/start:** service administrator (rules, any team's hours), manager (own team's members and hours),
  agent and W agent as eligible members with different hours, a prepared expired member, a queue with no
  eligible agent; `BOSS_CS_RULE_SUPPORT` (manual) and a future-dated round-robin successor.
- **Objective/steps:** Settings → AgentTeams → inspect/edit membership, participation, capacity and hours as each
  role permits → AssignmentRules → add/change condition and preview eligible candidates → save from a date →
  create controlled intakes → inspect assignment and its explanation. Reassign a case and run a mixed-validity bulk
  assign including another organization's case.
- **Expected:** active memberships, hours, capacity and rule order explain the chosen agent; no eligible agent
  leaves explicit unassigned work and a `SupportCaseUnassigned` notice to the team's managers. Reassignment keeps
  the SLA history. Each bulk member has a result; the foreign case is named Forbidden and the others are assigned.
- **Recovery:** overlapping/ended membership, invalid rule, unavailable selected agent, two simultaneous intakes,
  stale case, canceled rule/assignment, and the manager's refused rule save (`SUPPORT_POLICY_EDIT`). Prepare
  concurrent intake locally.
- **Screens/modes:** AgentTeams, AssignmentRules, Cases, CaseDetail Assign, Notifications and Home queues;
  browser/TUI/Standard, preview readability, row-specific dialogs and keyboard/narrow sample.

### CS-07 — Preview and apply saved replies, singly and in a batch

- **Actor/start:** agent (owner of `BOSS_CS_REPLY_PATIENCE`), manager (owner of the team-shared
  `BOSS_CS_REPLY_DETAILS` and Retail-wide `BOSS_CS_REPLY_FILTERS`), cases of three customers with different
  recipients/revisions and one inaccessible selected case.
- **Objective/steps:** Settings/SavedReplies → create/edit text and permitted tag/status/assign actions → preview on
  a case → CaseDetail Saved reply → choose reply → inspect expanded subject, recipient, text, actions and problems →
  confirm apply → inspect message and case result. Select several cases → BulkReply → review per-case previews →
  confirm → inspect successes, refusals and the retry of a failed message by its message ID.
- **Expected:** only the owner changes a reply and only a team's manager shares it with the team; variables and
  actions are checked per case; confirmation applies the previewed revision. Batch replies stay separate customer
  threads, and a retry sends no second reply nor reapplies an action.
- **Recovery:** missing variable, disallowed transition, changed revision, ended team share, another owner's edit,
  canceled preview and a delivery failure after a case action. The result explains partial outcomes truthfully.
- **Screens/modes:** SavedReplies, CaseDetail Saved reply, BulkReply and captured mail; browser/TUI/Standard,
  long text, preview/confirm focus and selected-count checks.

### CS-08 — Explain service clocks, pauses and a corrected obligation

- **Actor/start:** service administrator (policy, `SUPPORT_POLICY_EDIT`), manager (Correct, `SUPPORT_CASE_MANAGE`)
  and agent (refused both); `BOSS_CS_SLA_RETAIL` and `BOSS_CS_SLA_PRIVACY`; a prepared holiday, fresh cases for
  a Friday-afternoon intake, a paused case, an overdue clock, a reopened episode and a future policy row.
- **Objective/steps:** ServiceLevelPolicies → inspect targets/calendar → simulate intake and due times → save the
  dated policy → create a consuming case → inspect header clock cards and Service level tab → send a captured
  reply → wait for customer → resume → resolve/reopen. Correct a clock with reason and read CaseAnalytics; follow
  the SLA warning/breach notice (`tab=sla`) back to the case after a `scan_CaseSla` run.
- **Expected:** business versus elapsed time, zone/calendar and policy basis are explicit; an internal note or failed
  send does not meet first response; waiting for the customer pauses resolution and an internal hold does not
  (`holdPauses="N"`). Reopen keeps the earlier breach in a new episode, and a later policy row does not rewrite an
  open case's clocks.
- **Recovery:** missing calendar, invalid targets, boundary dates, canceled correction, wrong case/clock and a scan
  with one failing clock (named, the rest warned). Use controlled due fixtures; do not infer all clocks worked from
  one notification.
- **Screens/modes:** ServiceLevelPolicies/simulation, CaseDetail Service level, CaseAnalytics and Home;
  browser/TUI/Standard, long clock labels, contrast, keyboard and date-zone samples.

### CS-09 — Route intake and recover held channel submissions

- **Actor/start:** administrator (routes, tokens), manager (held review), agent; `BOSS_CS_ROUTE_MAIL`,
  `BOSS_CS_ROUTE_FORM`, a prepared stored message from a known and an unknown sender, an Auto-Submitted reply, a
  chat message, and a disposable public form token; an employee's Commons request and a project's intake token as
  non-service counterparts.
- **Objective/steps:** ChannelRouting → inspect routes and owning organization/queue/type → add/change/end a route
  → test its resolution → issue a token → submit a local form → remove the token → inspect refusal. File the
  prepared mail through the mail rules; review the unknown sender held for triage → accept or dismiss → inspect case
  source/time/acknowledgment. Follow a chat-made case and ChannelSessions/call-context links.
- **Expected:** intake lands in the chosen queue with its original provenance and received time; one
  acknowledgment; an Auto-Submitted reply attaches and sends nothing. Public form submission reads no existing case.
  The employee's request and the project token keep their own behavior, and a held record exposes no other
  customer's content.
- **Recovery:** removed/expired token, rate limit, unknown sender, ended route, unsupported type, duplicate delivery,
  malformed input and a failed independent item. Distinguish the prepared-message limitation from a routing defect.
- **Screens/modes:** ChannelRouting and held/token forms, ChannelSessions, CaseDetail, bounded Comms/Forum source;
  browser/TUI/Standard for staff, browser/HTTP public handoff and captured messages.

### CS-10 — Merge duplicate cases without losing their history

- **Actor/start:** manager with two of Joe's cases (copies), with messages/files and distinct SLA history;
  different-customer and unavailable cases as negative counterparts; agent as the Merge refusal.
- **Objective/steps:** source CaseDetail → Merge cases → choose kept case → preview comparison, carried clocks and
  problems → cancel/reopen → confirm at the shown revisions → inspect source's merged destination, retained
  histories and kept case's conversation/work/records. Follow both old record links and customer-facing views.
- **Expected:** confirmation names source and kept case; content/history remains attributable with its audience;
  the source's breach does not disappear and the kept case carries the source's clock. Merged intake is not counted
  twice in backlog or used to expose private evidence to a different customer.
- **Recovery:** different customer/organization, stale source or target, unsupported state, target chosen as itself,
  canceled confirmation and same-key retry. A refused merge leaves both cases and their histories intact.
- **Screens/modes:** MergeCases and both CaseDetail records, report and public lineage checks;
  browser/TUI/Standard with comparison at narrow width and keyboard focus return.

### CS-11 — Split a distinct issue into a linked case

- **Actor/start:** agent on a case with several inbound/outward/internal messages and existing work; a selected
  message with a different received time; reader as refusal.
- **Objective/steps:** CaseDetail → Split into a new case → select permitted messages → preview the new issue →
  choose subject/queue and confirm → inspect new and original case, linked lineage, message attribution, customer,
  assignment and clock start. Return through each case link and the original queue filter.
- **Expected:** the new case records where it came from, starts its clock at the selected message's receipt and
  keeps the customer boundary; the original stays open unless separately resolved. Attachments and message audience
  follow their actual association rather than a blanket public copy.
- **Recovery:** no messages, foreign/unavailable message, changed revision, invalid destination queue, canceled
  preview and retry. Verify what remains on the original and what the new case carries.
- **Screens/modes:** SplitCase, both CaseDetail records, lineage and Service level panels;
  browser/TUI/Standard, selection/count wording, long previews and keyboard/narrow layout.

### CS-12 — Resolve, reopen, close and follow up with a clear history

- **Actor/start:** agent and customer contact; cases inside and outside the 14-day reopen window, a resolved case
  awaiting auto-close and incomplete follow-up work.
- **Objective/steps:** CaseDetail → Resolve with the required resolution → inspect state and customer label →
  customer reply inside the window → inspect reopened episode → resolve another case and exercise a prepared reply
  outside the window → inspect the linked follow-up case. Observe `close_ResolvedCases` close an eligible case and a
  rerun change nothing; use the explicit Follow-up action. Inspect the feedback invitation's creation without
  assuming delivery.
- **Expected:** resolution, closed date and follow-up are distinct; case history and prior breach remain; customer
  communication finds the correct active case. Auto-close sets the closed date without discarding outstanding
  evidence; completing a task alone does not resolve the case.
- **Recovery:** missing resolution, canceled resolve, stale case, customer outside scope, changed window and failure
  in one independent due item. Record any open work and why it does or does not block the action.
- **Screens/modes:** CaseDetail, Cases, lineage, customer Support view and notification/feedback handoff;
  browser/TUI/Standard for staff, public browser and controlled clock fixtures.

### CS-13 — Configure service defaults, queues and status vocabulary

- **Actor/start:** service administrator, with manager (reads Settings, saves refused) and agent (Settings refused)
  as counterparts; Retail's configuration recorded for restoration.
- **Objective/steps:** SettingsHome → select organization → ServiceDefaults → inspect/change default queue,
  workflow, unknown-sender handling and resolution/reopen policies → Queues → visibility/team/offered types →
  CaseTypes and StatusCategories → edit customer labels and permitted moves → create or move a consuming case.
- **Expected:** settings describe the resulting customer/agent behavior; dated changes retain prior facts and the
  active organization is clear. Queue visibility, responsible team and offered types are separate choices. Customer
  status labels differ from internal labels without changing the underlying case.
- **Recovery:** no service policy, invalid default queue, incompatible transition, missing reason, foreign
  team/type, canceled edit and changed organization with unsaved fields. Restore configuration after verifying.
- **Screens/modes:** SettingsHome, ServiceDefaults, Queues, CaseTypes, StatusCategories and consuming case;
  browser/TUI/Standard with long forms, two-row dialogs and dependent-choice checks.

### CS-14 — Publish a case template and preserve earlier answers

- **Actor/start:** service administrator, agent and a signed-in customer contact; `BOSS_CS_TPL_DEFECTIVE`
  (published, conditional serial, internal assessment), a new draft and an earlier submitted case.
- **Objective/steps:** CaseTemplates → create/copy → add/edit/end fields and conditions → preview agent and
  customer variants → check sample values → publish from a date → use for a queue → submit through NewCase and
  Support → change a field with a successor date → reopen the earlier case's values.
- **Expected:** the dependency and required state are understandable; cycles are refused; internal fields never
  enter customer-facing inputs or answers. Earlier answers keep the form as it was at submission, and ending a field
  keeps recorded data. A queue uses only a published template.
- **Recovery:** dependency cycle, impossible required value, draft template, missing server-required value, canceled
  publication and concurrent edit. Qvt's browser-side `require-when` on drop-down, text-area, radio and check is a
  known framework gap (impl §7); record it apart from server validation.
- **Screens/modes:** CaseTemplates fields/conditions/previews, NewCase, CaseDetail values and Support input;
  browser/TUI/Standard for staff, 390px/keyboard and public browser counterparts.

### CS-15 — Explain an order, shipment and invoice to the customer

- **Actor/start:** agent (prices, credit status), reader (neither), F authorizer (receivables read and the only
  seeded invoice-copy holder: `serviceInvoiceCopy` needs `RECEIVABLE_EDIT`), foreign agent; `BOSS_CS_SO_DELIVERED`,
  `_PICK`, `_PACKED`, `_HELD` and `BOSS_CS_SO_OTHER` with the stored confirmation; mail capture on.
- **Objective/steps:** Orders or Customer360 ServiceOrders → find exact order/email → OrderDetail → read hold,
  line/fulfillment status and linked case → link to case → inspect shipment/packages/tracking → InvoiceDetail →
  inspect permitted amount/payment state → send a copy as the F authorizer. Download/resend the stored order
  confirmation, inspect each send record and return to the original case/filter.
- **Expected:** fulfillment, invoicing and payment are distinguishable; the stored confirmation stays the issued
  version after later changes, and a second resend is a second record of it, not a re-render. Order amounts, invoice
  amounts and credit status follow `PRICE_VIEW`, `RECEIVABLE_VIEW` and `CUSTOMER_CREDIT_VIEW`; missing authority
  withholds values rather than showing zero. No payment details; shipment context has no stock action.
- **Recovery:** missing stored document, invalid recipient, foreign or missing record (the same answer), denied
  amount/copy, failed send, canceled resend and same-operation retry.
- **Screens/modes:** Orders, Customer360 service tabs, OrderDetail, ShipmentDetail, InvoiceDetail and output;
  browser/TUI/Standard, long item/customer names, masked details and actual retained/captured bytes.

### CS-16 — Explain availability and product alternatives without inventing a promise

- **Actor/start:** agent and reader (no price read); the filter and its substitute, an unready projection, the
  thermostat's serials, dated history and a product with usability restrictions.
- **Objective/steps:** Availability/Products → Product360 → inspect identifiers, warranty, substitutes and permitted
  customer-facing information → Stock and InventoryAvailability Summary/Projection/Locations/Movements/Reservations →
  StockAtDate Places/History with cutoff → PriceExplain for a customer/order basis. Return to the case/order with
  product and facility context intact.
- **Expected:** on hand, available, reserved, expected and held quantities and readiness/provenance are intelligible;
  unknown is never zero or a confirmed delivery date. Price explanation keeps date, customer, currency and unit and
  is absent for the reader. No cost, supplier price or stock policy appears in this context.
- **Recovery:** projection unavailable, foreign facility, unusable substitute, missing unit conversion, no price
  permission, invalid historical date and stale record. A historical quantity is not an available allocation.
- **Screens/modes:** Products/Product360, both stock paths, StockAtDate, PriceExplain; browser/TUI/Standard,
  selected-value choice, date/unit and phone column checks. Export StockAtDate Places and History to CSV and XLSX
  and Locations/Movements to CSV; inspect headers, filtered rows, typed values, cutoff and scope.

### CS-17 — Apply a controlled cancellation or short-pick substitution

- **Actor/start:** agent files (`ORDER_CHANGE_REQUEST`), manager decides (`ORDER_CHANGE_APPROVE`), order desk
  applies (`ORDER_CHANGE_APPLY`) and releases a Change hold; each refused the others' step. `warehouse.pick`'s short
  pick (resolution Substitute) on a `BOSS_CS_SO_PICK` shipment, from WH-19 or prepared (§2), substitute
  `BOSS_CS_FILTER_PLUS`, the customer's consent;
  an in-process packed copy and `BOSS_CS_SO_PACKED`.
- **Objective/steps:** OrderDetail, the case or the pick exception → Propose change → choose cancel/substitute lines
  and quantities → read impact/consent → submit → manager decides from Approvals or the notice → order desk opens
  OrderChangeDetail → preview current effects → confirm Apply → inspect reservations/picks, reopened package if
  relevant, replacement line, hold release and stored confirmation → send it. Follow the resulting Warehouse and
  invoice records only as far as the outcome.
- **Expected:** the confirmed proposal/revision and actual stock/billing inputs agree; the short remainder is
  handled once and the substitute is priced and reserved by the order rules. Between pack and ship the package and
  its invoice are adjusted through guarded operations; a finalized pack invoice answers `BILLING_CONFLICT`. Apply
  places and releases only the Change hold; the manual hold on `BOSS_CS_SO_HELD` (and a credit hold, only if one is
  prepared) stays.
- **Recovery:** changed pick/reservation (`STOCK_CHANGED`), stale order/proposal, shipped quantity, closed period,
  invalid substitute, canceled apply and same-key retry. Refusal preserves the order and explains the next useful
  action without repeating reservation, invoice or mail side effects.
- **Screens/modes:** OrderDetail, OrderChanges, OrderChangeDetail, Approvals and bounded pick/package/invoice
  handoff; browser/TUI/Standard, quantity/consent preview, keyboard confirm and retained output inspection.

### CS-18 — Route a commercial change and preserve independent holds

- **Actor/start:** agent (files), manager (`ORDER_CHANGE_APPROVE` only), order desk (withdraw/hold release as
  offered); a price, quantity-increase, ship-date, address or shipping proposal on a Retail order with an
  independent hold. No seeded user holds `SALES_APPROVE` and Sales is not built (F158).
- **Objective/steps:** file the commercial kind with reason and source revision → inspect its impact, state, the
  `OrderChangeApproval` routing and the stated next responsible party → as manager attempt the decision and read the
  refusal → withdraw the proposal or release its Change hold with the dedicated grant. With a temporary prepared
  `SALES_APPROVE` holder in Retail (allowed, §7), decide it and confirm Customer Service still offers no apply.
- **Expected:** approval is not application, service-manager authority is not commercial approval, and the
  proposal's state and owner are clear. Withdrawing or releasing the Change hold does not clear another hold.
  Customer Service never claims a commercial change was applied; the missing owner continuation is recorded as a
  boundary (impl-sales P14), not a defect of this app.
- **Recovery:** stale revision, wrong kind/authority, changed order state, canceled withdrawal. A notice nobody can
  act on (no seeded `SALES_APPROVE` holder) is recorded as observed before the temporary holder is prepared.
- **Screens/modes:** OrderChanges, OrderChangeDetail, source OrderDetail and Notifications; browser/TUI/Standard
  and context-preserving Back. This is not a Sales review.

### CS-19 — Request a return under an explainable policy

- **Actor/start:** agent requests (case edit), return authorizer as the second entrant, reader/order desk/knowledge
  author refused the Returns area; a prepared delivered order of several units, an existing RMA, a receiptless
  request and a reason outside the policy; service administrator for ReturnPolicies (`RETURN_POLICY_EDIT`).
- **Objective/steps:** case, customer or order → Request return → identify source/customer → select eligible lines,
  quantities, reason and proposed remedy → preview policy/window/evidence → submit → inspect linked ReturnDetail
  and case. In a separate configuration fixture use ReturnPolicies to preview a dated rule and its reason/remedy
  labels, save/end it and verify the intended future request without rewriting the earlier decision.
- **Expected:** shipped, previously returned and currently eligible quantities are clear; the policy explains window,
  evidence, remedy and manual-review needs (a reason it does not allow needs an exception). The requested remedy is
  not an approved refund. Two drafts cannot together return more than was shipped.
- **Recovery:** excess quantity, another customer's order, missing evidence for a defect or damage, expired window
  (prepared), changed policy, duplicate submit and no applicable policy. Preserve the entered reason and show the
  manual review rather than inventing an authorization.
- **Screens/modes:** NewReturn, Returns, ReturnPolicies and ReturnDetail; browser/TUI/Standard, line selection,
  fractional quantity, dated-rule and keyboard/narrow checks.

### CS-20 — Authorize an RMA, resolve an exception and issue its evidence

- **Actor/start:** return authorizer, manager (exception decision), agent (requests an exception; refused
  authorization); requested, exception and expired returns, the test carrier and mail capture.
- **Objective/steps:** Returns or Home → ReturnDetail → inspect policy/line evidence → request exception → manager
  decides from Approvals at the return's revision → authorize → inspect shipment, expiry, decision and stored RMA →
  assign, issue label → print/download/send the authorization → inspect bytes and captured recipient. Batch
  authorize/cancel with an independent forged member; close a remainder or cancel an untouched return separately.
  Follow Commerce ReturnDetail's "Open in Customer Service" once into this screen.
- **Expected:** authorization makes the authorized state and return shipment, not a credit or replacement. A repeated
  label request answers the same label; a render or send failure does not imply the authorization rolled back.
- **Recovery:** stale exception/return revision (the refusal names the current revision), missing manual reason,
  denied decision, carrier/print failure, unknown send outcome, canceled action, same-key retry and cancel after a
  physical or financial effect. Explain what is complete and what still needs attention.
- **Screens/modes:** Returns, ReturnDetail dialogs, ReturnAuthorization, Approvals/Notifications and captured
  files/mail; browser/TUI/Standard with confirmation identity, row-specific actions and label content type (F213).

### CS-21 — Receive partial boxes and record the quality disposition

- **Actor/start:** W agent (receive, inspect), prepared disposer, agent (no W: progress only); CS-20's authorized
  return of several units with an open return shipment, in an organization that settles returns separately (Retail
  with `returnSettlementRequired` set for the batch, or a prepared `BOSS_WH_RETURNS` return, §2).
- **Objective/steps:** first, with Retail's default, open an authorized return and record the "Mantle receives at
  delivery" note instead of Receive. Then, with the prepared setting: ReturnDetail → Receive a box → enter accepted
  and rejected quantities, rejection reason and serials → confirm → inspect receipt, received quantity, quarantine and
  inspection → receive the next box → open QualityInspection → record readings → dispose as the disposer → return to
  the RMA.
- **Expected:** authorized, received, accepted, rejected, held and settled quantities stay distinct.
  `receive#ReturnItems` records physical receipt without changing the authorization or settling; accepted receipts
  enter quarantine with inspection on the keyed Warehouse path. Release/scrap is a quality decision, not a result of
  Receive. The plain agent sees progress without actions; the W agent needs no Warehouse launcher.
- **Recovery:** over-receipt, duplicate serial, missing rejection reason, closed return, closed posting day, canceled
  action and same-key retry. Pair each borrowed grant with the plain agent as non-holder.
- **Screens/modes:** ReturnDetail, QualityInspection and the resulting Warehouse-owned records (WH-26 holds the
  Warehouse-context receipt); browser/TUI/Standard, clear posting and quantity outcomes.

### CS-22 — Settle a return and distinguish a pending refund

- **Actor/start:** F authorizer (credit or replacement, `RECEIVABLE_EDIT`); the prepared refund holder
  (`PAYMENT_EDIT`) and receiptless approver (`RETURN_CREDIT_APPROVE`) of §2; the return authorizer without F as
  non-holder; CS-21's partially received return, a prepared gateway-paid order for a refund, an open book day, and
  the settlement setting of CS-21.
- **Objective/steps:** ReturnDetail → inspect settlement summary/eligibility → preview → confirm the current version
  → inspect credit, replacement or original-payment refund → reload the return and open the financial record once
  (Accounting's own settlement review is ACC-28, on `BOSS_ACCT_RETURN`). Use separate fixtures for a receiptless credit, a stale receipt and a pending or
  declined gateway outcome.
- **Expected:** financial authority is independent of authorization and receipt; only what was received is
  credited, and a second credit beyond it is refused. Settlement is recorded once before gateway attempts; a pending
  refund says "its refund waits for the gateway" (`REFUND_PENDING`), and a failed refund does not imply the credit
  rolled back. Amounts are withheld from non-holders.
- **Recovery:** changed receipt/preview, cap exceeded, closed period, refund pending, wrong original payment,
  canceled confirmation and duplicate operation. Inspect payment history before retrying; success text alone does
  not establish that money moved. Without a gateway fixture the refund branches stay unverified.
- **Screens/modes:** ReturnDetail settlement dialog, bounded Accounting counterpart and output;
  browser/TUI/Standard, withheld versus zero amounts, currency and persisted evidence.

### CS-23 — Assess warranty coverage and follow the repair or replacement

- **Actor/start:** agent (evidence, covered/rejected decision), manager (goodwill, `WARRANTY_APPROVE`); the
  delivered thermostat's serial with `BOSS_CS_WARRANTY_12`, a prepared expired claim, a prior claim and a
  chargeable alternative with customer consent.
- **Objective/steps:** Customer360 Delivered items or NewCase with the warranty type → WarrantyAssessment → record
  evidence → inspect ship date, term/agreement, coverage end and trace → decide covered/partly covered/rejected, or
  goodwill with a coverage end and reason as manager → Add repair → update it to completed → inspect the
  `WarrantyRepairFinished` notice → return to the case. For a replacement follow Request return into CS-19–22.
- **Expected:** coverage states its source rather than a bare yes/no; a decision binds the claim revision and keeps
  earlier decisions with their approver. A finished repair tells the agent and leaves the case open. An estimate and
  consent are not a sales quote or payment, and a replacement does not bypass return controls.
- **Recovery:** another customer's or resold serial, missing issuance/term, changed evidence, expired coverage,
  denied goodwill (agent), canceled repair/decision and retry. Check F185 against current behavior.
- **Screens/modes:** WarrantyClaims, WarrantyAssessment, CaseDetail, ServiceDeliveredItems and repair/RMA links;
  browser/TUI/Standard with long coverage trace, date boundary and confirmation/consent readability.

### CS-24 — Find and send a useful published answer

- **Actor/start:** agent on English and Spanish cases (a Spanish-reading JoeDist contact); the `ZZW_RETAIL`
  published, Spanish and draft articles and the internal `ZZW_SVC` article; administrator for KnowledgeSources.
- **Objective/steps:** CaseDetail Knowledge → search suggestions → inspect language/state/audience → open Commons
  Knowledge with case context → link an article → Send to customer → inspect the public address in Compose and the
  captured message → return. Inspect rate, unlink and Suggest an edit; change a KnowledgeSources row only in a
  separate authorized fixture and verify its consumer.
- **Expected:** the requester's language comes first and draft/internal material is labelled; sending uses the
  current published public link and keeps the case association. A draft or internal article is refused by Send.
  Wiki access is checked independently of service source membership.
- **Recovery:** ended source, missing language, denied wiki page, stale article, canceled send and another customer's
  case. An unavailable search should not read as an authoritative absence of help.
- **Screens/modes:** CaseDetail Knowledge, Knowledge/Knowledge and KnowledgeTui, KnowledgeSources, Compose;
  browser/TUI/Standard, narrow/keyboard reading and bounded public article follow-through.

### CS-25 — Turn a resolved answer into a draft and review article feedback

- **Actor/start:** knowledge author (CaseToArticle, ArticleFeedback review), manager (reads ArticleFeedback), agent
  (refused both); a case with outward answers, internal notes, private fields and personal data; demo feedback from
  several cases and one forged item.
- **Objective/steps:** CaseDetail → Make an article → select answers → inspect redacted preview and target draft
  space → create → open the unpublished draft and its case link. ArticleFeedback → filter → inspect article
  version/context → review and optional task → return to the article/case.
- **Expected:** the author sees what will become knowledge; internal notes are not offered, redaction is visible and
  the draft is not published. Feedback keeps the version and permitted case context; review and task leave the
  article unchanged; the forged item is named among the results.
- **Recovery:** no outward answer, remaining personal data, foreign draft space/feedback, changed source, canceled
  preview and mixed-validity selection. Keep a denied case's identity out of feedback details.
- **Screens/modes:** CaseToArticle, ArticleFeedback, Commons Knowledge draft/review and linked task;
  browser/TUI/Standard, long redacted text, keyboard selection and inspected saved draft audience.

### CS-26 — Publish a feedback form and schedule its invitation policy

- **Actor/start:** service administrator (manager reads Settings only); "Retail case feedback" with its answer, a
  copy, and a resolved case under the delivery policy; mail capture and the invitation job (§2).
- **Objective/steps:** Settings/FeedbackForms → copy the form → FeedbackFormDetail → edit questions/options and
  rules → preview → publish from a date → ServiceDefaults Feedback delivery → choose form, case types/queues,
  delay/frequency, link days, reminders and low-score follow-up team → resolve a consuming case → inspect the
  invitation and its delayed send → revise/end the policy and verify the earlier invitation's basis.
- **Expected:** the form is the intended organization's; an answered question is ended or succeeded from a date,
  never deleted. Timing, frequency and recipient are explicit; resolving the same case again or a rerun of the send
  job makes no second invitation or mail.
- **Recovery:** draft form, invalid rule/date, no customer recipient, failed independent invitation, canceled
  publish/end and changed policy before the send. A scheduled or queued invitation is not a delivered one.
- **Screens/modes:** FeedbackForms/FeedbackFormDetail, ServiceDefaults, consuming CaseDetail and captured mail;
  browser/TUI/Standard for staff, dynamic-form/keyboard/390px and dated-answer checks.

### CS-27 — Receive feedback and complete an accountable follow-up

- **Actor/start:** invited customer (captured link), manager (results and follow-up), agent (no CSAT results);
  valid, expired and withdrawn links, a low score, a repeat submit and a response whose form later changed.
- **Objective/steps:** open the captured invitation → inspect only the offered form and the customer's label →
  submit score and comment → retry → manager opens SatisfactionResults from ReportsHome → choose
  period/queue/team/customer → ResponseDetail → inspect the historical answer and permitted case link → record the
  `CaseFeedbackFollowUp` → return to results.
- **Expected:** the link grants the answer form, never the case or internal content; one submission is kept and a
  repeat answers the first. Results state their count/rating basis; follow-up records who acted without changing
  the answer, whose update and delete are refused.
- **Recovery:** forged/expired/withdrawn link, already answered link, missing required response, denied case,
  ended historical question and canceled follow-up. Bad links give guidance without revealing another case.
- **Screens/modes:** PASS Feedback, SatisfactionResults, ResponseDetail, Home CSAT and notification;
  browser/TUI/Standard for staff, public browser/390px/keyboard and inspected response/notice evidence.

### CS-28 — Explain service performance from measure to source and export

- **Actor/start:** manager (Support queues only), administrator (Privacy too), agent and return authorizer
  (Reports without CSAT), reader (refused); known met/missed/open/paused/cancelled clocks, resolved, reopened,
  merged and split cases, returns in two currencies and an empty period.
- **Objective/steps:** ReportsHome → choose period, as-of, organization/queue/team and grouping →
  ServiceLevelCompliance, ResponseTimes, CaseVolumes and ReturnAnalysis → compare totals/denominators → follow
  offered drills → Back with options → export CSV and inspect rows. Inspect CaseAnalytics clock facts/events and its
  CSV; compare Customer360 ServiceStatistics and Home on the same scope/basis.
- **Expected:** the SLA rate keeps an open overdue clock in and a cancelled clock apart, and never a clock a merge
  ended; response metrics give business and elapsed median/p90 with counts; merged intake counts once in backlog.
  Requested, received, credited/replaced and monetary return measures stay apart, per currency, and only for a
  price or accounting reader. The export has the screen's rows.
- **Recovery:** no data, incomplete historical basis, restricted queue, wrong cutoff, denied drill and export failure.
  Record F193, F195 and F212 as current limitations after checking them, not as findings.
- **Screens/modes:** the six local report screens, SatisfactionResults, Customer360 ServiceStatistics and Home;
  browser/TUI/Standard, contrast/labels/phone and exact CSV headers, rows, currency and scope.

### CS-29 — Produce and send the appropriate case summary

- **Actor/start:** agent, reader (refused send) and Joe as customer; outward messages, an internal note, internal
  and customer-shared files, template answers and linked orders/returns; mail capture and Chromium for PDF.
- **Objective/steps:** CaseDetail More → CaseSummary → inspect the Customer copy → switch to Internal summary →
  print each → compare content and labels → Send to the customer → choose sender/recipient → inspect the stored
  RequestContent and captured attachment → reopen the stored copy from Files.
- **Expected:** the audience is explicit on screen and output; the customer copy holds only outward content. Send
  always uses the customer variant, even from the internal view; a same-operation retry answers the first; printing
  changes no case state.
- **Recovery:** foreign case, an address that is not the customer's, missing PDF runtime, failed output, canceled
  send, duplicate operation and a source change before generation. Compare bytes; F219 (internal template answers)
  is a known limitation to check.
- **Screens/modes:** CaseSummary qvt/tui/html/html-print, CaseDetail Files and captured email;
  browser/TUI/Standard, multipage/long-message output and customer-versus-internal counterpart.

### CS-30 — Keep files and discussion attached to the right record

- **Actor/start:** agent, reader, a public contact and the foreign agent; an ordinary file, an internal file,
  customer evidence and an issued RMA/summary/confirmation.
- **Objective/steps:** case, customer, order, return and warranty record → Files/Conversation → add permitted
  evidence or note → inspect its record association and audience → reload → download → inspect the public
  counterpart where shared → open a linked record and Back. Follow the Chatter/RecordFiles terminal helpers.
- **Expected:** each file/message keeps its record identity, provenance and audience; an issued document is
  distinct from a mutable attachment. The reader gets no upload/change operations, and customer evidence is not
  relabelled internal or shown to another contact through a shared screen.
- **Recovery:** failed/oversized/unsupported upload, stale selection, removed membership, foreign file identifier,
  canceled note and unavailable referenced record. Inspect original download bytes and denied responses.
- **Screens/modes:** shared Chatter/RecordFiles with helpers and the app's evidence/file sections;
  browser/TUI/Standard, phone/keyboard upload/download delegation and the public browser boundary.

### CS-31 — Invite a contact and configure the bounded Support handoff

- **Actor/start:** manager (`SUPPORT_CONTACT_INVITE`), agent (refused), service administrator (Support mount
  settings); a prepared JoeDist contact without an account, its address, and `ZIZI_PORTAL`'s `/support` mount served (§2).
- **Objective/steps:** ContactDetail → Invite to support → choose the contact-owned address and the
  customer-administrator option → create → inspect the one-time link → complete the public account handoff in the
  PASS browser identity. ServiceDefaults → Support mount settings → offered queues, types and knowledge spaces from a
  date → verify SupportHome/NewCustomerCase.
- **Expected:** the invitation targets one customer/contact and the configured site; customer administrator is
  deliberate and distinct from a staff administrator. The link is shown once for the agent to send; creating it is
  not delivery. Settings cannot name another organization's queue or an arbitrary backend.
- **Recovery:** unserved site, address not the contact's, denied inviter, expired/reused invitation, changed
  relationship and canceled setting. Record provisioning prerequisites instead of inventing a working URL.
- **Screens/modes:** ContactDetail invite, ServiceDefaults Support settings, PASS account handoff; staff
  browser/TUI/Standard as offered and the public browser; no public TUI claim.

### CS-32 — Let a customer find help, submit and follow their own case

- **Actor/start:** an anonymous visitor, Dana (contact), Morgan (customer administrator), Joe (his own account) as
  the other customer; the configured mount with customer, draft and internal help, the Support queue's template and
  a locally scanned file; the public form token; separately the guest order holder (§2).
- **Objective/steps:** SupportHome → search/open CustomerArticle → rate → NewCustomerCase → choose topic/type as
  offered → enter customer-visible template values/evidence → submit → MyCases → CustomerCase → read outward
  conversation/files → reply → ask to reopen or cancel when offered → inspect the staff case. Separately submit
  through the public form token, whose response reads no case. Guest branch: the Shop order's Support request link
  → NewCustomerCase → confirm the one order and its queue/template → submit → inspect the receipt/notice on the
  intake page and the staff-side order-linked case; do not continue through MyCases.
- **Expected:** Dana sees her own cases, Morgan the customer's, Joe only his; a visitor reads no customer help. Staff
  labels, notes and internal fields are absent. Outside-hours guidance and closed-case follow-up-on-reply are clear.
  An article is rated once per view; reply and submit do not duplicate. Guest submission is receipt-only intake for
  the capability's order, with no case list or detail read; inspect the actual redirect and retained order context.
- **Recovery:** unavailable queue/type, invalid dependency/file, expired capability, another customer's ID, stale
  cancellation and remote-authority outage. Retry the guest entry with another order, a site without the session
  capability, a mount serving another organization and an expired/revoked capability; show the sign-in or
  not-available recovery without revealing another order.
- **Screens/modes:** SupportHome, CustomerArticle, NewCustomerCase, MyCases, CustomerCase, the bounded Shop order
  entry and staff CaseDetail; browser at 390px/keyboard, a JavaScript-disabled basic-form path where supported, and
  remote authority only where that runtime exists.

### CS-33 — Let a customer request a return or cancellation and understand its result

- **Actor/start:** Joe and Morgan signed in, eligible delivered lines (the demo order), an open unshipped order,
  a current RMA and a return already affected physically or financially; Retail's `customerImmediateCancel="N"` and
  a prepared policy with it on; separately the guest order holder.
- **Objective/steps:** MyReturns → RequestReturn → choose lines, reason/remedy and evidence → submit →
  CustomerReturn → read authorization/receipt/remedy progress → add evidence → download the label → withdraw an
  untouched return. From the order context open NewCustomerCase's order-cancel section → select open quantities and
  consent → Ask to cancel → inspect "Cancellation requested" and the staff proposal; repeat under the prepared
  immediate-cancel policy for "Cancelled". Guest branch: the Shop order's return link → RequestReturn → that
  order's lines only → submit → receipt and staff RMA; its cancellation link → NewCustomerCase → Ask to cancel →
  the state notice and that order's history. No order picker, MyReturns or CustomerReturn access is conferred.
- **Expected:** a requested remedy is not an approved refund; withdrawal respects revision and effect boundaries.
  Cancellation is immediate only under an immediate-cancel policy with nothing reserved or approved; otherwise a
  proposal waits for staff (CS-17). The page shows no stock/financial controls, internal policy decisions or another
  customer's identifiers. Verify the persisted RMA/change through an authorized staff continuation.
- **Recovery:** duplicate submit, excess/shipped quantity, closed or affected return, stale revision, forged token,
  unavailable label and a server refusal after an enabled control. Inspect the actual CustomerReturn controls rather
  than inferring them from a Mantle operation. Repeat the guest branch with a wrong order, another site's session,
  a foreign-organization mount and an expired/revoked capability.
- **Screens/modes:** MyReturns, RequestReturn, CustomerReturn, NewCustomerCase/cancelOrder and staff RMA/change
  continuation; public browser/390px/keyboard and the test carrier's label, no public TUI.

### CS-34 — Reconcile permission, organization, queue and audience boundaries

- **Actor/start:** every §2 actor pair; the foreign agent, the Privacy queue, a prepared expired team/customer
  relation, public contacts and `sheldon.acme`.
- **Objective/steps:** follow each permitted activity's normal entry, then its direct route/transition,
  selected-value choice, palette/record link, notification, file and export. Compare a valid holder request with the
  same meaningful request by the non-holder; inspect hidden inherited children, the inherited denied-context outputs
  (§3) and a forged `appRoot`.
- **Expected:** launcher/menu, organization/customer/queue visibility and business capability are separate checks.
  Privacy cases do not leak through counts, search or files to the Support team; a shared customer does not join
  another organization's history. Borrowed W/F permissions work on their Customer Service mounts without granting
  Warehouse/Accounting roots. A public contact and `sheldon.acme` get no staff BOSS surface. Inherited Prices,
  Suppliers, Costs, Packaging and BOM outputs are absent or refused here and present for their owning app's holder.
- **Recovery:** access revoked between preview and confirm, nonexistent versus foreign record, expired membership,
  wrong token scope and a permission without app entry. A refusal must come from the targeted rule.
- **Screens/modes:** the relevant mounts/helpers of §3 within earlier activities; browser/TUI/Standard, exported
  bytes and PASS endpoints. This is later access review, not a new regression matrix.

### CS-35 — Reconcile shared handoffs and remaining interaction modes

- **Actor/start:** actors with only the needed app and operation grants, matched organization fixtures, and the
  receipts of completed activities.
- **Objective/steps:** follow each handoff below from cold entry, with Back/Forward, deep links and reopen; open the
  counterpart side only as far as the handoff. Revisit outstanding terminal, Standard, narrow, keyboard and
  output variants; compare a second consumer of any shared correction.
- **Expected:** each app keeps its own ownership and actions; source/operation identity survives the handoff; one
  Back returns to the origin; supported terminal actions work, and unsupported upload/rich-editing/public paths say
  where to go. Tool limits and missing prerequisites stay explicit in the ledger.
- **Recovery:** no destination launcher despite a business permission, removed linked record, stale asynchronous
  response, failed provider, canceled confirmation and navigation with an unsaved draft. An unbuilt neighbouring
  workflow is recorded, not implemented.
- **Screens/modes:** shared sources, helpers, shell providers, record/output/public continuations and the unresolved
  variants of CS-01–34; record exact evidence and gaps rather than a blanket parity claim.

| Handoff | Counterpart side (review) | Customer Service side |
| --- | --- | --- |
| Short pick to substitution (`record#ShortPick`, `apply#OrderChange`) | Warehouse WH-19: `warehouse.pick`'s Pick screen and the short pick on a `BOSS_CS_SO_PICK` shipment | CS-17: agent files, manager decides, order desk applies |
| Return authorization of a return Warehouse requests | Warehouse WH-26 (NewReturn as receiver) | CS-20 authorization and label |
| Return receipt and quality | Warehouse WH-26: Warehouse-context receipt of `BOSS_WH_RMA` and read-only settlement | CS-21: receipt of CS-20's return on ReturnDetail by `customerservice.agentwh` |
| Return settlement and refund (`settle#Return`) | Accounting ACC-28 on its own `BOSS_ACCT_RETURN` (`finance.ar`/`finance.approve`) | CS-22: `customerservice.returnsar` and the prepared refund/receiptless holders |
| Commercial change decision and application | Sales (not built; impl-sales P9 decides, P14 applies) | CS-18 files and routes only |
| Customer-safe product, stock and price | Products Product360 stock and price explanation (PRD-12, PRD-09) | CS-16 |
| Case through Commons request view and Projects triage | Commons/Projects reviews | CS-04 |
| Mail-to-case, chat-to-case, call context | Comms/Chat (drawers-commons review) | CS-05, CS-09 |
| Forum escalation and public reply | PASS Forum | CS-05, CS-09 |
| Commerce return opened in Customer Service | Commerce ReturnDetail "Open in Customer Service" | CS-20 |
| Guest Shop order link into Support | PASS Shop order confirmation/link | CS-32, CS-33 |
| Service-clock datasets and InsightsRecord | Insights | CS-28, CS-34 |
| Warranty repair task | the repair's AssetMaintenance/work item owner (to verify at execution) | CS-23 |

## 5. Existing checks and future verification

This is an inventory of source coverage, not a record of tests run for this document. BOSS has **13 Customer
Service server regression specs**, **one browser regression walk**, **18 server acceptance specs**, and no
`test/acceptance/client/CustomerService/`. A server acceptance walk that posts transitions or renders qvt/TUI is not
observed browser interaction.

| Current BOSS regression source under `test/CustomerService/` | What it supplies to the review | Activities |
| --- | --- | --- |
| `CustomerServiceAccess.spec.js` | Root/menu/provider/launcher per group, Home's render, own and borrowed capabilities, area guards, record checks against forged and foreign ids, paths around the Mantle services | CS-01, 02, 34 |
| `CustomerServiceCases.spec.js` | Demo cases, scoped finds/counts, `apply#CaseBatch` outcomes, Today, Commons/Projects paths around a case; CaseDetail and NewCase renders | CS-03–04, 06, 12–13 |
| `CustomerServiceOrders.spec.js` | Order lookup, shared-customer scoping, amount/credit projections, case links and the customer-safe Product360 context | CS-02, 15–16 |
| `CustomerServiceAssignment.spec.js` | Rule list and participation, saved-reply ownership/sharing/actions, per-case bulk preview | CS-06–07 |
| `CustomerServiceChannels.spec.js` | Routes and held input, mail-to-case scope, ChannelSessions' audience and render, call context | CS-05, 09 |
| `CustomerServiceTemplates.spec.js` | Queue template selection, template fields/conditions/audience and preview | CS-03, 14 |
| `CustomerServiceRelations.spec.js` | Merge/split actions by capability and their preview renders (nothing merged) | CS-10–11 |
| `CustomerServiceReturns.spec.js` | Returns scope (closed to the reader), NewReturn lines and policy preview, batch authorization, the W/F audience on ReturnDetail | CS-19–22 |
| `CustomerServiceOrderChanges.spec.js` | OrderChangeDetail render of an approved proposal for the order desk and the OrderChanges list | CS-17 |
| `CustomerServiceWarranty.spec.js` | WarrantyAssessment/WarrantyClaims renders, Delivered items, the warranty type's template | CS-03, 23 |
| `CustomerServiceKnowledge.spec.js` | Suggestions/audience, the Knowledge mount, Send's refusals, ArticleFeedback and CaseToArticle renders | CS-24–25 |
| `CustomerServiceFeedback.spec.js` | Demo form/policy, FeedbackFormDetail/ServiceDefaults/SatisfactionResults renders, ResponseDetail as of the answer, Home CSAT | CS-26–28 |
| `CustomerServiceReports.spec.js` | Compliance/response measures by hand, export rows, amount audience, CSAT catalogue audience, the dataset and alert template, each report's render | CS-08, 28 |

`test/CustomerService/CustomerServiceSpecLib.js` holds ids, role usernames, the delivered-serial helper and route
fixtures; it is a helper, not a spec. The one registered browser regression is
`test/client/CustomerService/CustomerServiceCasesWalk.spec.js`: at 1280px the agent finds Joe, sees possible
duplicates, creates a distinct case and resolves it with Reopen offered. It establishes none of the other
activities, a phone layout, the themes or public Support.

| Current BOSS acceptance source under `test/acceptance/CustomerService/` | Existing scenario/supporting coverage | Activities |
| --- | --- | --- |
| `CustomerServiceFoundationWalk.spec.js` | Menus/areas/quick create per group, palette scope, forged ids, `sheldon.acme` refused; the demo orders | CS-01–02, 15, 34 |
| `CustomerServiceCasesWalk.spec.js` | NewCase with duplicates, chat-made case, employee request, board and row moves, bulk result, work completion, Commons' hidden actions, Privacy | CS-03–04, 06, 09, 34 |
| `CustomerServiceOrdersWalk.spec.js` | Customer by email, held reason, linked case, confirmation resend records, unready stock, stock at date, no cost/supplier price/PriceExplain for the reader | CS-02, 15–16 |
| `CustomerServiceSlaWalk.spec.js` | Friday intake with a Monday holiday, outward response, pauses, Projects triage, reopen episode, dated policy, failing scan | CS-08, 12 |
| `CustomerServiceAssignmentWalk.spec.js` | Hours/round robin/concurrent intake, no eligible agent, saved replies, mixed-delivery bulk reply | CS-06–07 |
| `CustomerServiceChannelsWalk.spec.js` | Mail threading/acknowledgment/Auto-Submitted, held sender, tokens, chat/call, Forum escalation and public reply | CS-05, 09 |
| `CustomerServiceTemplatesWalk.spec.js` | Conditional server validation, internal audience, authoring/cycles, dated answers, preview variants | CS-03, 14 |
| `CustomerServiceRelationsWalk.spec.js` | Merge, split, reopen/follow-up and auto-close rerun | CS-10–12 |
| `CustomerServiceReturnsWalk.spec.js` | Policy/RMA/label, two boxes with a rejection, disposition, received-only credit, receiptless refusal, overlapping drafts; sets and restores Retail's settlement flag and a temporary disposer grant | CS-19–22 |
| `CustomerServiceOrderChangesWalk.spec.js` | Short-pick substitution, `STOCK_CHANGED`, remainder cancel, packed correction and `BILLING_CONFLICT`, customer cancel policy, commercial/hold refusal | CS-17–18, 33 |
| `CustomerServiceWarrantyWalk.spec.js` | Delivery-based coverage, expiry/goodwill, repair notification and return replacement | CS-23 |
| `CustomerServiceKnowledgeWalk.spec.js` | Language/audience/send, redacted draft, feedback review with a forged item, internal exclusion | CS-24–25 |
| `CustomerServiceFeedbackWalk.spec.js` | Dated forms/policy, delayed single invitation, retry/bad links, follow-up and refused response edits | CS-26–27 |
| `CustomerServiceReportsWalk.spec.js` | Clock/case denominators, response metrics, return currency, manager vs administrator scope and export | CS-28 |
| `CustomerServiceSupportWalk.spec.js` | Contact/customer-admin/own-account visibility, help and rating, public form, invitation offered to the manager, Support settings render | CS-31–32 |
| `CustomerServiceSummaryWalk.spec.js` | Customer/internal summary content, stored output and send, retry, recipient and reader refusals | CS-29 |
| `CustomerServiceAccessWalk.spec.js` | Cross-organization route/helper/output isolation, cost/supplier price, borrowed W/F without launchers, public contact refused BOSS | CS-21–22, 30, 34 |
| `CustomerServiceServerStatic.spec.js` | Server-static qvt structure of each plain screen; no journey or visual result | CS-35 |

Keep the same-named server acceptance and browser regression `CustomerServiceCasesWalk` distinct by runner and
path. BOSS `test/acceptance/client/suite.js` registers no Customer Service browser walk; do not relabel the transition
walks as browser coverage or add a second regression golden path to fill the gap.

| Owning component/source | Existing coverage to reuse and limitation |
| --- | --- |
| Mantle `test/request/` | `SupportCases`, `SupportSla`, `SupportAssignment`, `SupportReplies`, `SupportChannels`, `SupportTemplates`, `SupportRelations`, `SupportKnowledge`, `SupportWarranty`, `CaseFeedback`, `SupportPortal`: business rules and refusals, not BOSS usability evidence |
| Mantle `test/order/` | `OrderChanges`, `OrderConfirmations`, `ReturnPolicies`, `AccountingReturns`, `WarehouseReturns`; match a changed rule's owner instead of duplicating it through BOSS |
| Mantle `test/acceptance/order/SupportImmediateCancelWalk.spec.js` | Policy-sensitive customer cancellation; acceptance authorization still required |
| PASS `test/Support/SupportAccess.spec.js` | Support access contract; `SupportFixtures.js` is its helper |
| PASS `test/acceptance/SupportFixtures.spec.js`, `SupportIsolation.spec.js` | Public fixture setup and customer isolation |
| PASS `test/acceptance/client/SupportPagesHttp.spec.js`, `SupportFeedbackHttp.spec.js` | Public-page forms and feedback against a configured fixture, registered in PASS's acceptance client suite |
| PASS `test/acceptance/RemoteFixtures.spec.js`, `test/acceptance/client/RemoteHttp.spec.js` | The remote frontend in general; whether they cover Support pages is to verify; a local facade call does not establish a remote browser handoff |
| Commons/Projects/Products/Warehouse/Accounting/Insights | Existing shared component, task, stock, quality, finance and dataset checks; choose a second consumer only for a shared behavior later changed |

### Verification rules for later refinements

These rules govern the refinement pass, and the commit rule applies in both; the review pass corrects nothing and
commits no source (§2). The suite rules are the [testing skill](../../../../../.agents/skills/testing/SKILL.md) and
[Build-Test](../../../../../docs/Build-Test.md#the-two-suites) with [rendering screens in
tests](../../../../../docs/Build-Test.md#rendering-screens-in-tests). Customer Service specifics:

- **While working.** From the mr-moqui root on a built binary: `./moq test mr-boss --spec CustomerServiceReturns
  --nobuild`, the owning Mantle rule spec when its rule changes, and the golden path
  `./moq test-client mr-boss --serve --spec CustomerServiceCasesWalk --nobuild`. Support page changes are mr-pass's
  (`SupportAccess`).
- **Before a commit (user decision, 2026-11-11).** Before each commit, in either pass, run only the local, focused
  checks for what changed: the specs it touched, the owning Mantle spec, the golden path and lint, as listed here. Run
  `./moq test-apps` once at the end of the refinement pass, and `./moq test-framework` as well if the pass changed
  framework code (a shared renderer/widget correction, under the building skill). Never `cargo test`, framework specs
  or `test-all` for application work. Commits follow the user's execution authorization.
- **Acceptance (user decision, 2026-11-11).** Along the way, in either pass, run the focused acceptance walks and
  fixture specs of what is being reviewed or changed; an added or changed acceptance test always runs, then its
  component's acceptance suite. At the end, after the final `./moq test-apps`, run the full acceptance suites of the
  application components (`./moq accept mr-mantle mr-boss mr-pass mr-marble`), or `./moq accept-all` if framework
  code changed. A focused walk runs as
  `./moq accept mr-boss --spec CustomerServiceReturnsWalk`; public HTTP scenarios belong to mr-pass.
- **Rendering.** Business rules stay in Mantle, app context and projection in BOSS, and the single browser golden
  path stays. Across regression a screen renders at most once per mode with all its checks, in a second mode only
  for its own `render-mode` section. No regression screen sweep, role × route × mode matrix, second golden path or
  screenshot baseline; full journeys and access/phone walks belong in acceptance.
- **Budgets.** BOSS `test/budget` 264 s server / 57 s client, Mantle 393 s server, PASS 20 s / 9 s; a component
  over 1.5 times its budget or one regression spec over 15 s fails the run. Cut duplication or move a scenario to
  acceptance; no budget is raised without the user's agreement.
- **Lint.** `moqui lint --screens <report-file>` for changed screens (the argument is an overwritten output report,
  never a screen path), compared with the baseline; Markdown-only edits need none.
- **Evidence** stays in ignored `plans/ui-refinement-evidence/boss-customer-service/` in the framework repository,
  with redacted captured mail and recipients, inspected CSV/XLSX/PDF bytes and persisted case/order/return outcomes;
  never tokens, capability values or customer data in the plan.

## 6. Coverage, findings and running record

### Activity coverage ledger

**Pending** means not reviewed; **inspected** means source/render/visual inspection only; **exercised** means steps
executed with an explicit pass/fail/partial outcome; **blocked** means a missing prerequisite; **deferred** means
deliberately postponed with reason and follow-up. Exercised does not by itself mean passed: use `exercised / partial`
and name the open continuations, recovery and mode gaps. Blocked and deferred coverage remains unresolved. Source
research and document review do not advance this ledger; record actual modes and results, not only a test name.

| Activity | Status | Outcome / recovery / mode gaps | Evidence / findings |
| --- | --- | --- | --- |
| CS-01 — Workday/scope | pending | Multi-organization user to prepare | — |
| CS-02 — Customer/contact lookup | pending | All live variants unreviewed | — |
| CS-03 — New case/template | pending | All live variants unreviewed; F185 to check | — |
| CS-04 — Case work/status/task | pending | Commons/Projects counterparts unreviewed | — |
| CS-05 — Conversation/audience | pending | Mail capture and local forum site required | — |
| CS-06 — Team assignment | pending | Concurrent intake/hours and expired member to prepare | — |
| CS-07 — Saved/bulk replies | pending | Delivery/retry branches unreviewed | — |
| CS-08 — Service clocks | pending | Holiday, fresh cases and scan job required | — |
| CS-09 — Intake/held submissions | pending | Inbound mail is a prepared message; token fixtures required | — |
| CS-10 — Merge | pending | Consumes one of Joe's cases: use copies | — |
| CS-11 — Split | pending | All live variants unreviewed | — |
| CS-12 — Resolve/reopen/follow-up | pending | Reopen-window and auto-close job fixtures required | — |
| CS-13 — Defaults/queues/statuses | pending | Configuration restore required | — |
| CS-14 — Template authoring/history | pending | Browser and customer variants unreviewed | — |
| CS-15 — Order/shipment/invoice | pending | Retained/captured output unreviewed | — |
| CS-16 — Product/availability | pending | Readiness/history/CSV/XLSX unreviewed | — |
| CS-17 — Cancel/substitute | pending | Short pick (WH-19 or prepared) and in-process packed copy required | — |
| CS-18 — Commercial handoff/holds | pending | No `SALES_APPROVE` holder seeded; decision branch needs the temporary holder | — |
| CS-19 — Return request/policy | pending | Own delivered order of several units required | — |
| CS-20 — RMA/exception/label | pending | Test carrier and mail capture required | — |
| CS-21 — Return receipt/quality | pending | Settlement flag change and disposer grant need agreement | — |
| CS-22 — Settlement/refund | pending | Refund/receiptless holders and a gateway-paid order to prepare | — |
| CS-23 — Warranty/repair | pending | Expired coverage to prepare | — |
| CS-24 — Knowledge/send | pending | Audience/public-link variants unreviewed | — |
| CS-25 — Article draft/feedback | pending | Redaction/history variants unreviewed | — |
| CS-26 — Feedback form/policy | pending | Invitation job and mail capture required | — |
| CS-27 — Response/follow-up | pending | Needs CS-26's fresh invitation | — |
| CS-28 — Reports/exports | pending | Depends on W3–W6 data; F193/F195/F212 to check | — |
| CS-29 — Case summary | pending | Chromium/PDF and mail capture required | — |
| CS-30 — Files/discussion | pending | Audience/download/terminal unreviewed | — |
| CS-31 — Support invite/settings | pending | Served PASS public site required | — |
| CS-32 — Public help/case | pending | Public browser, remote and guest order-link variants unreviewed | — |
| CS-33 — Public return/cancel | pending | Immediate-cancel policy and guest order to prepare | — |
| CS-34 — Access/isolation | pending | Paired checks throughout; no matrix inferred | — |
| CS-35 — Cross-app/mode reconciliation | pending | Depends on earlier activity receipts | — |

### Findings register

No runtime/UI defect has been established by this planning work. The review pass records findings with Owner /
correction / retest empty; the refinement pass fills them in. Number later findings **CS-UI-001** onward with the
guide's fields and severities ([record, fix and verify](../../../../../docs/dev/UI-Review.md#record-fix-and-verify)): P1
blocks work or makes essential information unusable, P2 causes substantial friction or misleading presentation, P3 is
a localized refinement. Distinguish observed failures, source suspicions and design judgments. A private-data,
authority or transaction-integrity failure takes priority regardless of visual quality.

| ID | Severity / status | Actor, activity and step | Route / mode / theme / viewport | Reproduction, observed impact and evidence | Owner / correction / retest |
| --- | --- | --- | --- | --- | --- |
| — | No observed findings yet | — | — | Source concerns below are investigation inputs | — |

Source concerns to carry into later execution, none of them reproduced:

- Shared RequestDetail/Customer360/Product360 sources serve other app contexts and inherited helpers. Compare direct
  requests and output endpoints with owning-app positives; menu absence is not proof of refusal.
- impl-customer-service §7 records the case-clock query/scan limits (F112), knowledge ranking (F107), missing report
  measures (F193, F195, F212), warranty intake and resold serials (F185), the Items tab (F218), internal template
  answers in summaries (F219), the Support-link preview, label content type and MyCases paging (F213), and screens
  testing `hasError` after an ignored service call (F217). Reconcile each with current code and controlled data
  before assigning a finding.
- Return settlement and captured mail/label/summary actions may keep a successful inner business result when a later
  output or provider action fails; inspect records and messages before reading an overall success label or retrying.
- Suspicion, from source: `SupportCaseUnassigned` has a link template (`BossSetupData.xml`) but no
  `notification-topic` in `CustomerService.xml`'s shell providers, so the open Notifications tab may not reload live
  for it (docs/ui/Qvt-Client.md). Check in CS-06.
- Suspicion, from source: commercial order-change proposals notify `SALES_APPROVE` holders, of whom none is seeded
  (F158, open until Sales grants it); check in CS-18 what the filing agent is told and whether anything lingers
  without an owner.
- Public field dependencies, audience labels, expiry/reopen guidance and remote-authority failures need actual
  browser checks; operation-level support does not prove the control is present or usable.

### Bounded batch record

| Batch | Scope | Evidence / verification | Outcome / continuation |
| --- | --- | --- | --- |
| Authoring and document review — 2026-11-10 | Dedicated Customer Service author in the four-app batch: source/mounts, roles, fixtures, workflows, outputs, test registrations and historical reconciliation; an independent reviewer added guest Shop order capability coverage (fixtures, CS-32–33) and corrected the Support page count; the coordinator reconciled the Warehouse, Accounting, shared order/customer and PASS Support handoffs | Source/document inspection, independent rechecks of the PASS/Mantle guest-order contracts and Markdown checks only | Initial document written and corrected; all activities pending |
| Source check — 2026-11-11 | Every count, route, default, mount, grant, fixture id, spec and link rechecked against current source; method condensed to the guide and Products | Read-only source, data and git inspection; route count by script (135 = 49 + 80 + 6); no runtime, test or application change | Corrected actor grants (order desk, invoice copy, invite, disposer), the commercial-change boundary (F158), Retail's settlement default, defaults and outputs; added actor and fixture-consumption tables, scheduled jobs, the handoff table; split Wave 2; all activities pending |
| Cross-review reconciliation — 2026-11-11 | The five companion reviews reconciled with one another and with source: handoff sides, shared fixtures, prepared identities, the shared-runtime disposition and the method wording | Source and document inspection only; `BOSS_WH_RETURNS` read as a rollup child in every Retail agent's organizations (Mantle `get#PartyInternalOrgIds`, `CustomerService.js` `scope`); no record kind links a case to a supplier return (`readReturn`) | `BOSS_WH_RMA` left to WH-26, the supplier-return row removed, cross-review orderings added; all activities pending |

For each execution batch append: its pass (review or refinement); actor and fixture identities; source and binary
revisions; runtime, clock and modes; activities and branches attempted; findings and owning layer; important
before/after evidence; persisted outcomes and inspected artifacts; exact checks, results and skips;
design/implementation updates; commits when made; temporary grants, settings and policy rows restored; unresolved
continuations. Keep notes bounded and refer to evidence files rather than pasting logs or tokens.

## 7. Decisions

- **Planning record and method:** planning only, written 2026-11-10, checked against source and reconciled with the
  four companion reviews on 2026-11-11; no runtime, walkthrough, test, build, application change or commit, and every
  activity pending. Products' seven-part structure; §2 and §5 keep only Customer Service specifics and link the guide
  and Products for the generic method (user decision, 2026-11-11); earlier reviews' statuses, authorizations and
  exceptions do not carry over.
- **Source and handoffs:** current mounts, services and grants govern scope, and older records are reconciled here
  without being rewritten. Each side of a cross-app handoff is exercised once, by the activity the handoff tables name
  (CS-35 here); the other review opens it only as far as the handoff.
- **Actors are named by grant:** §2's table supplies each role term, its exact grants and the refusal it supplies.
  The order desk applies but does not file or decide; the manager invites and decides but cannot save policies; the
  administrator is never a narrow negative. Missing holders (disposer, refund, receiptless, `SALES_APPROVE`) are
  prepared as temporary grants (allowed, §7), not assumed.
- **Commercial order changes are a boundary:** with Sales unbuilt and no `SALES_APPROVE` holder (F158), CS-18 checks
  filing, routing, refusal and holds; the decision branch runs on a temporary prepared grant, and no apply is
  expected anywhere.
- **Retail settlement default:** Retail does not settle returns separately, so CS-21/22 first observe the default
  (no Receive or Settle; Mantle receives at delivery) and then the prepared
  `returnSettlementRequired` setting the Returns walk uses, restored afterwards, or a prepared return of the
  separately settling `BOSS_WH_RETURNS`.
- **Waves follow dependencies:** the original Wave 2 (CS-05–12, 29–30) was too broad for bounded batches and
  overlapped Wave 1 at CS-09; it is split into conversation/routing/clocks (CS-05–09) and relations/closure/records
  (CS-10–12, 29–30), and CS-28 sits after returns and feedback, whose data it reconciles.
- **Audience and authority:** case/queue/customer scope, app entry and business capabilities are distinct. Public
  contact, customer administrator, guest order holder and staff roles are not interchangeable. Borrowed stock,
  quality and financial grants work inside Customer Service without another app root.
- **Modes and completion:** Material is the visual target; actual TUI and brief Standard/output checks stay explicit.
  Support is a bounded public browser handoff. Completion needs evidence for the selected activities, resolved or
  accepted findings and a candid ledger of what remains; a source inventory or passing suite is not a usable workflow.
- **Phases (user decision, 2026-11-11):** a complete review pass with concurrent agents comes first and corrects
  nothing; all findings are triaged together and addressed in a separate refinement pass (§2).

### Execution setup dispositions

The user decided every setup question on 2026-11-11. Record the actual values (instances, paths, ports, hostnames and
dates) in the first live batch and whenever an instance is added, as Products did:

- **Bootstrap and instances (decided):** the release binary, embedded Postgres and disposable databases throughout.
  The coordinator decides which agents share an instance and which get their own, and when (major data staging or a
  conflicting setup), and starts further instances on the fly on free non-default ports with their own hostnames (user
  decision, 2026-11-11). Record each instance's runtime and database paths, linked components (PASS), loaded demo data
  and any selected fixture specs; listener ports and hostnames, the PASS `<public-site>` and whether a remote frontend
  runs.
- **Shared runtime (decided):** the coordinating agent decides whether the five reviews share one runtime and
  manages the concurrent agents, the cross-review order and the restore of Retail-wide changes (§2).
- **Dates and zones (decided):** the real clock in the machine's current zone, recorded with the execution date, and
  no DST or second-zone checks (user decision, 2026-11-11); fresh cases, expired windows and coverage prepared
  relative to it; whether the scheduler runs the three Mantle jobs.
- **Tool capability:** measured viewports, terminal keyboard and Chromium/PDF. 200% browser zoom is not checked
  (user decision, 2026-11-11).
- **Posting and mutation extent (decided):** postings and temporary setting, grant and policy changes in the
  disposable runtime are allowed (user decision, 2026-11-11); the coordinator sequences them and restores the changes.
- **Prepared fixtures (decided):** prepared users and records may be created for testing (user decision, 2026-11-11):
  the disposer, refund and receiptless grants, a temporary `SALES_APPROVE` holder, a gateway-paid order, an expired
  team member and a multi-organization service user.
- **Automation selection (decided):** focused acceptance walks and fixture specs along the way, and the full
  application acceptance run after the final `./moq test-apps` (§5; user decision, 2026-11-11).
- **Test cadence (decided):** local, focused checks before each commit in either pass, and one `./moq test-apps`
  (with `./moq test-framework` if framework code changed) at the end of the refinement pass (§5; user decision,
  2026-11-11).
