# IronStone BOSS — Sales implementation

Nov 11, 2026 — the open questions answered (§4): the budgets may rise by the plan's estimates as its phases land, the
import target names `SALES_IMPORT`, a quote template is an order of purpose `OrpSalesQuoteTemplate`, approvals extend
OrderDecision, a high-value acceptance needs PASS sign-in above a threshold unset by default, and a seller's approval
setting stops every auto-approval of its sales orders, whichever app placed them; a pre-approval warning, Sales' own
too, stops auto-approval as built, and with the setting on the warnings are shown to the approver only.
Nov 11, 2026 — reconciled with impl-people, impl-maintenance and impl-marketing: the deny pattern's long rows are split
by Maintenance's P1 (F25); the import target names Sales' permissions alone, with Q10 open for the user on behalf of
the four plans; Q11 points to impl-maintenance's Q8; and what People's plan gives P2 and P6 and what Marketing's P3,
P13, P15, P17 and P20 take from Sales are named in the phases, §2 and §7 under one set of names.
Nov 11, 2026 — reviewed against the code, the design and the other three plans (F43–F51, §6): the permissions that built
Mantle services already check are granted by the phase that builds their screens, not P1; what Marketing's plan expects
of Sales is named in the phases under the design's paths; the import's permission, the merge guard's callers, the
storeless order link's page and the Maintenance links are settled or made open questions (§5 Q10, Q11); F41 withdrawn.
Nov 11, 2026 — plan, before Sales starts. Written against mr-moqui 16828c5f, mr-boss f1bf2a95, mr-mantle 0048667f,
mr-pass 4a93c4d and mr-marble 8b90aeb, while Admin P17–P19 and Insights P11–P12 are not built. P0 partly done: F1–F42
found while writing it, from the code as Commerce, Shop, Customer Service, Purchasing, Admin P1–P16 and Insights P1–P10
left it (§6); the design edits they call for in design-sales were made the same day, and those in shared files are
listed in §6 for their owners. Sales is the third of four apps built next, People, Maintenance, Sales and Marketing,
each with its own plan and order (§4); this plan was written beside the other three, unseen, and a review reconciles
them. Its open questions are in §5, each with the plan's recommended answer.

How [design-sales.md](design-sales.md) gets built, in phases from the foundation to reports, each ending tested and
usable, with the PASS Sales customer pages of design §10 in this same file (§4). This file is kept at a high level,
as [impl-admin.md](impl-admin.md), [impl-commerce.md](impl-commerce.md) and the other app plans are: each phase names
its scope by the design's sections and §17 needs rather than restating them, and the design stays the place for
screen and record detail. During the build this file is the log: phase status and what each built, the decisions made,
open questions, findings against the code, and what is deferred.

Today `screen/Sales/` holds seven flat placeholders (Home, Pipeline, Accounts, Quotes, Orders, Agreements, Settings)
and a Reports area with two screens ported in the first port, SalesSummary and SalesAnalysis, which no plan built: the
first is refused to everyone but `ADMIN`, the second reads an entity directly and links to routes that do not exist
(F2). The root mounts only Chatter and RecordFiles and has no `<shell-providers>`; the `BOSS_SALES` artifact group is
live for `ADMIN` and `BOSS_SALES_ADMIN` (F1). Mantle has the opportunity, forecast and agreement entities, four
unguarded account services and the sales report services, and no opportunity, quote, agreement or forecast service
(F4, F5). Sales is built on what is there (as found in the code, §6):
- from the framework: the board, list and calendar widgets; the shell providers (palette, quick create, Today, the
  Comms hooks, Assist prompts and response actions); mail rules with app actions; `report-embed` and the funnel panel;
  `fancy-locked-html`; token routes and the notification approval handlers; and Admin's `org.moqui.admin` families
  (the capability registry, DataTransferServices with `moqui.server.TransferTarget`, recovery descriptors);
- from Mantle: `OrderServices` (create, propose, place, approve, hold, cancel, clone, the recurring worker) with the
  commercial revision (X2, built), the hold-type permissions (X4, built in part) and the order purpose marker (X5,
  built by Shop); `OrderChangeServices` and `OrderConfirmationServices` (Customer Service); the price resolver and price
  lists (Products); `CreditServices.evaluate#OrderCredit`, `InvoiceServices.get#InvoiceFinanceDetail` and
  `create#InvoiceFromSource`, `CustomerFinanceServices` and the posting operation (Accounting); the agreement status
  flow and audited agreement fields (Purchasing); `ExternalAccessServices` with the `SalesOrder` kind and the self
  relationship (Shop, Customer Service); the delivery ledger `MessageServices` (Shop); FormPublication (Customer
  Service); `DuplicateServices`, `ContactDavServices`, `RequestServices` and the request rules;
- from the built apps: Shared/OrderDetail, Customer360, OrderChangeDetail, InvoiceDetail, ShipmentDetail, RequestDetail,
  WorkItemDetail, Product360, InventoryAvailability, Prices, PriceLists, PriceListDetail and PriceExplain, each without
  a Sales context yet (F34); Commons' contact record, Duplicates, Notifications list, tasks and events; Comms Compose;
  Commerce's Subscriptions list; Admin's registries (settings, readiness, capabilities, lifecycle participants, import
  and export targets) and Shared/DataImport; Insights' catalog, metrics, attention providers, flow targets and dataset
  admission, with the rows it registered for Sales ahead of Sales (F3);
- from PASS: sites with targeted app mounts, public accounts and the Account hub, the facade with Mantle's PassApi for a
  remote frontend, protected media, and the Billing, Support and Shop apps as the pattern for a new app (F18);
- from People and Maintenance, built before Sales under their own plans (§4): employees and Employee360, and the
  offboarding entry into Admin's lifecycle. What this plan assumes of them is in P0 and §4, to check when they land.

**Inputs.**
- Designs:
  - [design-sales.md](design-sales.md), with §10 (PASS Sales), §12 (contracts), §13 (automation), §14.3 (the acceptance
    scenarios) and §15 (delivery stages)
  - [design-crosscut.md](design-crosscut.md) §1.3 (the automation register), §1.4 (capability groups; X4's hold and
    approval table), §1.5 (the stack contracts, Sales' row), §3.1, §3.2, §3.5–§3.8, §3.11, §3.12, §3.14–§3.16, §3.21
    (the Sales rows of the shared screens), §4.7 (quoting and commercial changes), §5 and §5.1 (external access, PASS)
    and §7.8 (Sales' needs)
  - [design-products.md](design-products.md) §7 (prices and price lists), [design-commerce.md](design-commerce.md) §6
    (Subscriptions), [design-customer-service.md](design-customer-service.md) §4 (OrderChangeDetail, the chargeable
    repair) and §8 (the Support pages PASS Sales links), [design-accounting.md](design-accounting.md) (credit, the
    invoice projection, the PASS Billing pay link, recurring invoices), [design-warehouse.md](design-warehouse.md)
    (reservation and shipment), [design-drawers-commons.md](design-drawers-commons.md) §4, §6, §9, §15 and §16
    (topics, contacts and duplicates, Chatter, files, consent)
  - [design-admin.md](design-admin.md) §11.1 and §14 (the `opportunities` import target, Sales' settings row and
    readiness provider, lifecycle participants, the privacy provider) and [design-insights.md](design-insights.md) §6
    (catalog and metric owners) and §9 (flow targets)
  - [design-marketing.md](design-marketing.md) §10–§13 (the lead handoff Marketing builds over what Sales exposes) and
    [design-people.md](design-people.md) (employees; PayrollInput for the later commissions)
  - `mr-pass/plan/design-forum.md` §13 (how a PASS app registers) and `mr-pass/plan/design-shop.md` §4 and §9 (the one
    customer account and its hub)
- Plans:
  - [impl-admin.md](impl-admin.md): the pattern of this file (as it stood at mr-boss c25c4864), §2 for the rules, the
    Built and Review notes of P2, P3, P6, P13, P15 and P16 for the registries, and its §7 rows for Sales.
  - [impl-insights.md](impl-insights.md) P3–P5, P8–P10 and its §7 rows for Sales (F18, F61).
  - [impl-commerce.md](impl-commerce.md) and `mr-pass/plan/impl-shop.md`: an app with a PASS side; Shop P5–P7
    (the `SalesOrder` kind, the Account hub, the delivery ledger, RecurringTemplate) and their §7 rows for Sales.
  - [impl-customer-service.md](impl-customer-service.md) P3, P10, P11 and F78, F158;
    [impl-accounting.md](impl-accounting.md) P10, P16 and its two open questions for Sales;
    [impl-purchasing.md](impl-purchasing.md) P3, P4, P13 and F46;
    [impl-products.md](impl-products.md) P5 and its §7; [impl-drawers-commons.md](impl-drawers-commons.md) §4 (the
    shared rules).
  - The plans of People, Maintenance and Marketing (`impl-people.md`, `impl-maintenance.md`, `impl-marketing.md`),
    written beside this one.
- The suite-app design review, which explains the design's X, Z, L and R-SAL IDs, was removed from the tree (mr-boss
  bd74564); read it with `git show bd74564^:plan/review-suite-apps.md` (§3 decisions, §4 one owner per step).
- Guides and rules: [design-doc-guide.md](design-doc-guide.md), [style-guide.md](style-guide.md) §8, mr-moqui
  `AGENTS.md`, `docs/dev/Practices-App-Dev.md`, `docs/Build-Test.md`, `.agents/skills/testing/SKILL.md`,
  `docs/security/Attack-Surface.md`, and mr-pass `README.md` and `docs/Deployment.md` ("Adding an app").
- Inventories: [ss-inventory.md](ss-inventory.md) (118 lines naming a Sales path: the Customer, Party, Order, Request
  and PartyAgreements forms) and [usl-inventory.md](usl-inventory.md), which carry the design's **Designed in** paths;
  design §14.2 traces the baseline forms.
- mr-moqui: `plans/Remaining-Work.md` (its IronStone row on Sales/Reports is stale, F2).

Framework paths are under the mr-moqui checkout (`crates/`, `runtime/components/base/`), Mantle paths under
`runtime/components/addon/mr-mantle/`, PASS paths under `runtime/components/addon/mr-pass/`, baseline paths under
`runtime/components/addon/mr-marble/screen/SimpleScreens/`.

Sections: [1 scope](#1-scope-and-order) · [2 rules](#2-ground-rules) · [3 phases](#3-phases) ·
[4 decisions](#4-decisions) · [5 open](#5-open-questions) · [6 findings](#6-findings) · [7 later](#7-later) ·
[8 verification](#8-verification)

---

## 1. Scope and order

- **Repositories.** Each is its own git repo:
  - `runtime/components/addon/mr-mantle`: the Sales business services, `mantle.sales.OpportunityServices`,
    `SalesWorkspaceServices` and `ForecastServices`, `mantle.order.SalesQuoteServices` and `SalesPortalServices`,
    `mantle.party.SalesAgreementServices`, the commercial kinds of `mantle.order.OrderChangeServices`; their records
    (SalesPipeline, SalesLeadIntake, the lead-source map, SalesOpportunityContent, SalesPolicy, SalesApprovalPolicy,
    SalesQuoteIssue, SalesQuoteResponse) and the fields added to SalesOpportunity, its stage, OrderHeader, OrderDecision
    and SalesForecast; the X1 storeless tax and the sales direction of `approve#Order`; the `SALES_*` permissions and
    the organization filter rows; ExternalAccess's `sales` app kind and quote scopes; the pipeline dataset; the PASS
    authority's copies of the Sales operations;
  - `runtime/components/addon/mr-boss`: the Sales app, `ironstone.sales.ContextServices`, the Sales contexts of the shared
    screens, `Shared/AgreementDetail` and `Shared/Subscriptions`, Sales' registrations with Admin and Insights (its
    branch of Shared/DataImport's mount and its owner routes among them, F44), its `report/` and `skill/` files;
  - `runtime/components/addon/mr-pass`: the PASS Sales app, `screen/Sales.xml` and its pages, its operations in the schema and
    route lists, its mount in the test runtime (P13, P17);
  - `mr-moqui` (`crates/`, `runtime/components/base`): nothing is planned. A framework change found needed is a finding
    first; `docs/security/Attack-Surface.md` gains the PASS Sales operations and `plans/Remaining-Work.md` Sales' row.

  `runtime/components/addon/mr-marble` is read only, for the baseline Customer, Party, Order, Request and PartyAgreements
  forms that ss-inventory maps.
- **Scope.**
  - Every `parity` and `new` row of design §2 and the §17 needs they use, as changed by §6, PASS Sales among them. The
    one `new` row left out is PASS:Marketing/SubmitForm, Marketing's page (§4, §7).
  - What the built apps left waiting on Sales, each in the phase where its records exist:
    - Customer Service: the commercial order-change kinds applied by the order's owner and the groups that decide them
      (its F158, §7), the Sales rows of the screens it mounts, and the chargeable repair's sales quote (P8, P14);
    - Accounting: the permission that opens the sales summaries to Sales and the order approvals that bypass the credit
      check (its two open questions; P1, P11), and Sales' row on Customer360 (P3);
    - Purchasing: a record link for a sales order (its F46; P7), and the unguarded `hold#Order` and `release#OrderHold`
      (Customer Service F78; P11);
    - Products: the Sales rows of the price screens (P15);
    - Commerce and Shop: Sales' mount of Subscriptions (P16), the quote scopes of the `SalesOrder` kind and Sales' card
      on the PASS Account hub (P13);
    - Admin: the `opportunities` import target (P6), Sales' settings row and `get#SalesReadiness` provider (P2), its
      capability bundles (P1) and its lifecycle participant for owned accounts, opportunities and open quotes (P6);
    - Insights: SalesSummary and Sales' own catalog entries, the pipeline and forecast measures, Sales' attention
      providers and flow targets, and SalesAnalysis moving to Sales' route with Accounting mounting it (P6, P19).
  - The connections to the two apps built before Sales (§4): with People, TeamMembers' employee lookup over
    `mantle.humanres.PeopleServices.find#Employees` and its Employee360 link (P2), and Sales' participant in
    Admin's lifecycle, which People's access-end entry starts (P6); with Maintenance, none in design-sales but the
    chargeable repair's quote, which is Customer Service's handoff (P8). The other two things impl-maintenance §7
    names are not built here (§7).
  - Shared screens: Sales builds `Shared/AgreementDetail` (P15) and makes Commerce's Subscriptions list
    `Shared/Subscriptions` (P16), and adds its context to the shared screens the other apps built (F34). Leads,
    Accounts and LeadSources are Sales' own screens, built so Marketing's root can mount them (§2, §7).
  - §7 holds the design's `later` rows and §11, the §19 open items, and the connections Marketing's plan builds over
    what Sales exposes.
- **Order** (§4). Sales has its own order, in the design's three stages (design §15), each ending at a gate.
  Mantle work goes in the phase that first needs it; a PASS phase sits at the design's stage for its pages.

  | # | Phase | Stage |
  | --- | --- | --- |
  | 1 | P1 Foundation | S1 |
  | 2 | P2 Pipeline setup: stages, teams, sources and reasons | |
  | 3 | P3 Accounts and contacts | |
  | 4 | P4 Leads and opportunities | |
  | 5 | P5 Lead intake, Comms hooks and account sync | |
  | 6 | P6 Home, shell, Assist and the pipeline dataset | gate 1: a working CRM |
  | 7 | P7 Quote drafts, pricing and storeless tax | S2 |
  | 8 | P8 Requests for quote | |
  | 9 | P9 Sales defaults, approval policies and approvals | |
  | 10 | P10 Issue, send and the customer's response | |
  | 11 | P11 Orders, approval and the storeless confirmation | |
  | 12 | P12 Quote templates | |
  | 13 | P13 PASS Sales: quotes | gate 2: quote to order, with public acceptance |
  | 14 | P14 Commercial changes and the fulfillment and billing handoffs | S3 |
  | 15 | P15 Agreements and customer prices | |
  | 16 | P16 Recurring orders and subscriptions | |
  | 17 | P17 PASS Sales: orders | |
  | 18 | P18 Forecast and targets | |
  | 19 | P19 Reports and Insights registrations | |
  | 20 | P20 Finish | gate 3: Sales' first release |

  Each phase starts after the one above it, except these, which run side by side because neither uses the other's
  work: P2 beside P3; P8 beside P9; P12 beside P13; P15 beside P14; P17, which needs only P11 and P13, beside P14 to
  P16; P18 beside P16 and P17. The dependencies that fix
  the rest: P4 needs P2's pipelines and teams and P3's account scope; P5's intake creates P4's leads; P6's import and
  lifecycle participant move P4's records; P7 needs P3's customers; P9's preview reads P7's lines; P10 issues what P9
  approved; P11 places what P10 accepted; P13 answers through P10's response service; P14 changes P11's orders; P16's
  bases are P11's orders and may name P15's agreements; P17 shows P11's orders; P18 and P19 read P4's and P11's
  records. A phase of a side-by-side pair that appends to the same file as the other (BossSetupData.xml,
  BossUsersDemoData.xml, Sales.xml's `shell-providers`) rebases on it before merging.

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
  - organization filters;
  - changes by effective date and the audit log;
  - demo data;
  - builds and commits.

  The walks are on Commerce's pattern: one golden-path walk in `test/client/Sales/`, `SalesPipelineWalk` (P4),
  registered in `test/client/suite.js`; the others are acceptance tests. PASS Sales adds no regression walk to mr-pass.
- **Layers, as design §12.1 places them.**
  - Mantle holds every Sales rule: the O, S, F, Q, C, G and P packages of design §12.1, their permission and
    organization checks, their records. Mantle specs prove them; they are not tested again through the app.
  - BOSS `ironstone.sales.ContextServices`: `get#SharedContext` (capabilities from the permissions, organization
    choices, `appRoot`, `sharedLinks`), `check#Record`, `get#Choices`, `search#Records` and the provider answers
    (Today, call context, record lookup), over one module `Sales.js` whose tables later phases extend, as
    `ironstone.commerce` and `ironstone.admin` have. The screens call Mantle directly.
  - PASS `screen/Sales/`: pages over `pass.Facade.call#Operation`, which reach `mantle.order.SalesPortalServices`
    locally or through the authority; no `ironstone` service and no BOSS screen.

  No same-named `ironstone` pass-through over a Mantle service is built.
- **Permissions, not group names.** Services check `ec.user.hasPermission`, the record's selling organization and its
  dated assignments, never a BOSS group name, a calling screen or a supplied `appRoot`; an edit permission is not a
  view permission. Mantle seeds design §1.1's `SALES_*` permissions, each granted to `ADMIN`, beside the
  `PURCHASE_*` and `ORDER_CHANGE_*` it seeds now; BossSetupData grants them to the groups of design §1.1. Mantle specs
  grant them to spec-local groups, never a `BOSS_*` group.
- **Scope in three steps** (design §1.1). The organization filter (X12) bounds what a root's user reads; the service
  checks the organization again; and inside it a representative sees the opportunities, quotes and orders assigned to
  them or their dated team, a holder of `SALES_TEAM_VIEW` the organization's. Lists, counts, totals, choices, the
  palette, exports, Chatter, files and Assist tools use the one scoped query. An unreadable linked record gives no
  title, amount or count.
- **Borrowed authority stays borrowed.** Price, cost, credit, receivable, payment, reservation and shipment actions
  keep their owners' permissions (design §1.1); a Sales group gets none of them, and a mount shows such an action only
  to a holder. Sales releases a Manual or a Change hold only.
- **One order document.** A quote and a sales order are the native OrderHeader, OrderPart and OrderItem; their state
  is the native status, their kind the order purpose (F7), their history the audit log and the stored PDFs. No quote
  table, item copy, revision table or Sales status. An issue, a response, a decision, a lead intake and a policy are
  records of their own because each is a fact with its own identity (design §17).
- **Native rules run once.** Tax, reservation, credit, payment authorization, invoicing and store mail stay with their
  Mantle rules (design §13.1); a Sales service calls the native primitive and never writes its result. A Sales guard
  is in Mantle, on the native entry point, so a direct call or another app's action meets it too. Every placement, an
  acceptance by staff or on PASS and a direct order alike, goes through `mantle.order.OrderServices.place#Order`, the
  status change Shop's checkout makes, so one rule on an order placed (Marketing's attribution, §7) sees them all.
- **Screens another root mounts.** Leads, Accounts and LeadSources take their context from
  `get#SharedContext` by the root's `appRoot`, link through `sharedLinks` and name no app root, so Marketing's plan
  mounts them with its filters and the user's own Sales rights (design-marketing §10, §12). A row whose detail the
  host root does not mount is shown without a link. LeadList has row selection (P4), and LeadList and AccountList
  take a bulk action from another app's context; the action itself, "Add to list (evidenced)", and AccountList's
  row selection are impl-marketing P3's, as owner contracts (§7).
- **Public pages add no authority.** PASS Sales derives the customer and organization from the checked capability or
  the signed-in relationship, never from a submitted party; a bearer link reaches one issue or one order; documents
  stream through protected media; a private refusal is shown as "not available". Tokens are never listed or logged.
- **Records follow the shared rules** (impl-drawers-commons §4; §4 here):
  - opportunity parties, team memberships, pipeline stages, source bindings, policies and approval rules are dated
    rows, ended, never deleted;
  - the audit log on the key fields the build adds or relies on: SalesOpportunity's type, status, stage, pipeline,
    organization, account, amount, probability and its mode, close date, lost reason and recurring amount;
    OrderPart's validity; OrderItem's override basis; SalesForecast's quota and basis; the policies' key fields;
  - prints and exports take an effective date and time; an issued quote and an applied change store their PDF.
- **Revisions and operations.** Every write names the revision it read (`lastUpdatedStamp`, the order's commercial
  revision) and is refused naming the current one when stale; a qualification, an intake, a send, a response, a change
  application, a batch item and a recurrence occurrence carry an operation key, so a retry answers the first result
  (the posting operation, design §12.1). A batch names each failure and goes on.
- **Owner contracts.** A context, registration or change built here in another app's screen, service or record follows
  that app's design and is written into it. The owner's forms stay the owner's; a Sales context adds its filters and
  action set and no right.
- **Existing callers stay compatible.** Shop's checkout and renewals, Commerce's order and subscription screens,
  Customer Service's order, change and confirmation services, Purchasing's `approve#Order` direction and revisions,
  Projects' estimates, Accounting's credit and invoicing, Warehouse's reservation and picking, and plain Mantle order
  entry. A new Sales rule is behind Sales' policy for the selling organization, off until it is set. The regression
  suites of mr-mantle, mr-pass and the earlier BOSS apps pass unchanged.
- **Order approval follows the seller's policy** (§4). Where a seller's SalesPolicy has its approval setting on, no
  sales order of that seller is approved automatically on a payment authorization, whichever app placed it (Shop's
  checkout and renewals, Commerce, Marketing's ticket order, a direct Mantle call): it stays placed until a holder of
  `SALES_ORDER_APPROVE` approves it. The setting is off by default, and with it off every caller approves as today.
  A pre-approval warning blocks auto-approval, as built (`autoApprove#Order` refuses on any warning of
  `check#OrderPreApprove`), Sales' own warnings as Accounting's and Purchasing's. Only with the setting on, when no
  auto-approval is left for them to block, are they shown on the screen alone: they tell the person approving and
  do not refuse that approval.
- **Done for a phase** means all of these:
  - impl-drawers-commons §4 "Done":
    - the regression tests for the rules the phase adds passing: Mantle's in mr-mantle, BOSS's in mr-boss, PASS's in
      mr-pass;
    - `./moq test-apps`, each suite within its budget; a budget is raised by the phase's measured share, up to
      the plan's estimate for the suite, which the user approved (§4); a raise beyond the estimate needs the user's
      agreement again, and until it is given a phase that would pass the budget cuts a duplicate or moves a scenario
      to acceptance; no spec passes 15 seconds; `./moq test-framework` and cargo tests only for a phase that touches
      `crates/` or a base component;
    - `moqui lint --screens` clean for BOSS and PASS with the Debug binary;
    - the inventories' **Implemented in** columns;
  - an access rule the phase adds checked in `SalesAccess` (one holder and one non-holder on one verb, and another
    organization's record refused), not every service and mount; ProjectsAccess passing with the new package (F25);
  - a screen rendered at most once in each mode across the suite, with all of its checks on that render, and in a
    second mode only where it has its own qvt or tui template;
  - its row and **Built** note here.

  No route fixtures: a screen sweep is an acceptance test, one per app per mode. The phase's "usable when" and its §8
  scenario are acceptance tests to write (`test/acceptance/Sales/`, `test/acceptance/client/Sales/`, and mr-pass `test/acceptance/`
  for the PASS phases), named in the phase; running them is not part of Done.

## 3. Phases

| Phase | Repos | Screens | Status |
| --- | --- | --- | --- |
| P0 Checks | all (read) | — | partly done Nov 11 (§6 F1–F51); the checks below left |
| P1 Foundation | Mantle, BOSS | the Sales root and menu, Home's frame, Reports' two ported screens | — |
| P2 Pipeline setup | Mantle, BOSS | Settings, Stages, Teams, LeadSources, TypesAndReasons | — |
| P3 Accounts and contacts | Mantle, BOSS | Accounts, Contacts, Customer360, ContactDetail, MergeAccounts | — |
| P4 Leads and opportunities | Mantle, BOSS | Opportunities, Leads, OpportunityDetail, WorkItemDetail | — |
| P5 Lead intake, Comms hooks and account sync | Mantle, BOSS | Leads' intake rows; the Comms actions | — |
| P6 Home, shell, Assist and the pipeline dataset | Mantle, BOSS | Home, QuickCreate; the import mount | — |
| P7 Quote drafts, pricing and storeless tax | Mantle, BOSS | Quotes, OrderDetail (quote), Product360, InventoryAvailability, PriceExplain | — |
| P8 Requests for quote | Mantle, BOSS | QuoteRequests, QuoteRequestDetail | — |
| P9 Sales defaults, approval policies and approvals | Mantle, BOSS | SalesDefaults, ApprovalPolicies, Approvals | — |
| P10 Issue, send and the customer's response | Mantle, BOSS | OrderDetail's Issues and responses; QuoteBatch | — |
| P11 Orders, approval and the storeless confirmation | Mantle, BOSS | Orders, OrderDetail (order) | — |
| P12 Quote templates | Mantle, BOSS | QuoteTemplates, QuoteTemplateDetail | — |
| P13 PASS Sales: quotes | Mantle, PASS, BOSS | PASS CustomerQuotes, CustomerQuote, QuoteResponse; Invite to Sales | — |
| P14 Commercial changes and handoffs | Mantle, BOSS | OrderChanges, OrderChangeDetail, ShipmentDetail, InvoiceDetail | — |
| P15 Agreements and customer prices | Mantle, BOSS | Agreements, AgreementDetail, CustomerPrices, PriceLists, PriceListDetail | — |
| P16 Recurring orders and subscriptions | Mantle, BOSS | RecurringOrders, Subscriptions | — |
| P17 PASS Sales: orders | Mantle, PASS | PASS CustomerOrders, CustomerOrder | — |
| P18 Forecast and targets | Mantle, BOSS | Forecast, Targets, TargetAttainment | — |
| P19 Reports and Insights registrations | Mantle, BOSS | Reports, SalesSummary, SalesAnalysis, PipelineAnalysis, WinLoss | — |
| P20 Finish | all | the sweeps and the review walk (acceptance) | — |

### P0 — Checks

Verify the design's riskiest assumptions against the code before building. Each result is a row in §6 and, where it
changes the design, an edit there. F1–F42 were found on Nov 11 while writing this plan and F43–F51 in its review; the
edits they call for in design-sales were made then. Still to check:

- **People and Maintenance as built** (they are built before Sales, §4): the route and grant of Employee360 for a
  team member's link (impl-people P2 mounts it at `People/Employees/Employee360` and `Commons/People/Employee360`,
  with no Sales context row; Sales mounts none); `mantle.humanres.PeopleServices.find#Employees`' public work
  projection for TeamMembers' lookup; People's access-end entry into Admin's lifecycle
  (`ironstone.admin.LifecycleServices.request#AccessEnd`, impl-people P7), which Sales' participant (P6) answers;
  the packages they added to the client deny pattern and the two rows Maintenance's P1 split (F25); their rows in
  BossSetupData, BossUsersDemoData, the capability registry, Data.js's owner routes and Shared/DataImport's mount
  (F44) that Sales appends after; and the budgets as they left them (F37).
- **Admin P17–P19 and Insights P11–P12, when they land.** P17's registered safe projections for the audit reader:
  which of Sales' audited fields (an override's basis, a policy threshold, a quote's amounts) need a projection, and
  that no issue token or PDF location is ever a before or after value. P18's device route groups: Sales registers
  none. Redo this check at each of those phases' Built notes.
- **A topic opened from two apps** (F26, F43), before P9: how `OrderChangeApproval`, whose link BOSS sets to Customer
  Service's OrderChangeDetail, opens Sales' mount for a Sales approver of a commercial kind: a link by the
  recipient's capability in the topic's handler, or a second topic for the commercial kinds.
- **The catalogue service of a report entry** (`ReportCatalogEntry.catalogueService` and `catalogueKey`, which decide
  who reads `Sales.SalesAnalysis` through Accounting's catalogue today, F3): its contract, for `get#SalesReports`.
- **`approve#Order` and auto-approval:** what `autoApprove#Order` (F52) and `check#OrderPreApprove`
  (OrderInfoServices.xml:861) check today besides credit and purchase approval, and every caller of
  `autoApprove#Order`, so P11's rule in it and its sales direction change no result for a seller whose approval
  setting is off, and P9's warnings none for an order that meets no Sales rule; how the seller of a sales order is
  read where a part has a store and where it has none; and Projects' estimate approval, which approves an order
  outside `approve#Order` (impl-accounting §5).
- **X1's reach** (F8): which storeless sales-direction orders the built apps make today (Projects' estimates,
  Customer Service's replacement orders) gain tax lines once `calculate#OrderSalesTax` falls back to the seller's
  gateway, as their invoices already do, and which of their specs assert an untaxed total.
- **The request rules for a quote request:** whether `complete#RequestFromWork`, called by the unguarded
  WorkEffortRequestFromWork (Work.eecas.xml:39-41), completes an RqtQuote from linked work, and which case rules of
  Customer Service's D23 guards read the request type (F31).
- **The Comms hooks as consumed:** whether Comms reads a `contact-card` provider yet (the element exists, F28), the
  slots an `ext-action` may name, and what `create-from` passes for a voicemail.
- **Assist's organization facts:** that a Mantle `user-facts` provider gives the active organization (F49: the
  framework reads the providers, and no component registers one), which design §1.4 makes a prerequisite of the
  Sales skills.
- **The funnel panel through `report-embed`** in qvt, tui and server-static output, over a dataset with a row filter.
- **The shared screens' context services:** how Prices, PriceLists and PriceListDetail take their pricing scope
  (`ironstone.products.CatalogServices.get#SharedContext`, impl-commerce F4), how another app mounts the Commons
  contact list and record (template/ContactRecord.xml), and how a Chatter and files host is registered
  (`CommunicationServices.get#RecordLinkInfo`, :2005) for SalesOpportunity and Agreement.
- **`fancy-locked-html`** from an email template body and a printed PDF, with the fields a quote's cover text may use.
- **The baseline forms** of Order/OrderDetail, Party/EditParty and Request/EditRequest that ss-inventory maps to a Sales
  path, form by form, against the Sales contexts of P3, P7, P8 and P11.
- **The demo's storeless seller:** an internal organization of the demo with no ProductStore and a tax gateway
  preference, for design §14.3's scenario 4; and customers of both demo organizations.
- **PASS's two copies:** the Mantle copies of the operation schema and route list (`ForumSchema.js`,
  `script/PassRoutes.js`) and the three `TOKEN_WRITES` lists a bearer write is added to (Deployment.md:397-400).

### P1 — Foundation

Design §1.1 (groups, permissions, the X12 organization filter), §1.2 (the menu), §3 Home (its frame), §8 SalesSummary
and SalesAnalysis (kept reachable); SAL-ACCESS, SAL-SHELL.

- **Mantle.**
  - The permissions of design §1.1 seeded in MantleSetupData, each granted to `ADMIN`: `SALES_VIEW`, `SALES_TEAM_VIEW`,
    `SALES_TEAM_MANAGE`, `SALES_OPPORTUNITY_EDIT`, `SALES_ACCOUNT_EDIT`, `SALES_QUOTE_EDIT`, `SALES_QUOTE_SEND`,
    `SALES_ORDER_EDIT`, `SALES_ORDER_APPROVE`, `SALES_ORDER_CHANGE`, `SALES_APPROVE`, `SALES_AGREEMENT_EDIT`,
    `SALES_RECURRENCE_MANAGE`, `SALES_FORECAST_EDIT`, `SALES_REPORT_VIEW`, `SALES_CUSTOMER_INVITE`, `SALES_IMPORT`
    and `SALES_CONFIGURE`. `SALES_APPROVE` and `SALES_ORDER_CHANGE` are the two OrderChangeServices already checks
    (F13). `SALES_IMPORT` is the app's own import permission, which the `opportunities` import target names (P6;
    §4); BossSetupData grants it to `BOSS_SALES_MANAGER`, who run the import, and it is in that group's bundle.
    `ORDER_APPROVE` and `ORDER_CHANGE_HOLD_RELEASE`, which design §1.1 also maps to Sales groups, exist.
  - The organization filter (X12): `SalesOpportunity.organizationPartyId`, audit-logged, and filter rows for
    SalesOpportunity, SalesForecast and Agreement in `MANTLE_USER_ORG` and `MANTLE_ACTIVE_ORG` (none exists, F4, F19),
    on the pattern of UserInvitation's rows (PartyInvitationData.xml:36-39). P4's services keep the field equal to the
    effective internal-organization party row. Existing agreements of Purchasing read as before under its own root.
  - `SalesReportServices`' summaries accept `SALES_REPORT_VIEW` as report read for the organizations of the user,
    costs withheld without `PRODUCT_COST_VIEW`, as they accept a store-scoped `COMMERCE_VIEW` now (F2; owner contract:
    the answer to Accounting's open question, written into design-accounting; `ACCOUNTING_VIEW`'s and Commerce's
    answers unchanged, with `test/sales/SalesReports` and `SalesReportStoreScope` passing as they are).
- **Access** (design §1.1), on Commerce's pattern (BossSetupData.xml:1903-1924): `BOSS_SALES` as the root user group
  beside the artifact group of that name, and `_REP`, `_MANAGER`, `_APPROVE`, `_CHANGE`, `_AGREEMENT` and `_READ`;
  `BOSS_SALES_ADMIN` keeps its row. The ordinary groups' authz on the root with `MANTLE_USER_ORG` and
  `MANTLE_PRIVATE_CONTACT`; the `ironstone\.sales\..*` service pattern on the artifact group; `sales` added to each
  row of the client deny pattern as Maintenance's P1 left them, a row split only if it would pass 255 characters,
  which none should (F25). An area only some groups see (Quotes' Approvals, Orders' Changes, Agreements, Reports,
  Settings) is an artifact group that denies the root group and allows its capability groups, added by the phase
  that builds the area. The permissions granted by design §1.1's table, except the four a built Mantle service
  already checks, which a group gets with the phase that builds its screens (F43): `SALES_APPROVE` in P9,
  `ORDER_APPROVE` in P11, `SALES_ORDER_CHANGE` and `ORDER_CHANGE_HOLD_RELEASE` in P14. The price, cost, credit and
  finance permissions go to no Sales group.
- **The capability registry** (Admin P3's, as built): a `moqui.security.CapabilityBundle` for each Sales group with its
  permissions and, for the root group, its launcher binding, on Commerce's rows (BossSetupData.xml:2728-2770), so an
  access administrator can assign them. A phase that grants a group a permission adds it to the group's bundle.
- **`ironstone.sales.ContextServices`** (design §12.1) and `Sales.js`: `get#SharedContext`, `check#Record`,
  `get#Choices` and `search#Records`, their tables empty but for the organization and the reports.
- **The Sales root** (design §1.2): the areas Home and Reports; the other areas are added by the phases that build
  them, and `later` entries stay absent. The seven placeholders are removed (each area's phase builds its real
  screens); the stale grant comment fixed (F1). `<shell-providers>` with the `sales` keymap; the palette, quick create,
  Today and Comms providers arrive with their records.
- **Reports, as ported:** SalesSummary opens for a holder of `SALES_REPORT_VIEW` over the guarded summaries;
  SalesAnalysis keeps its route and loses its four dead links (F2). Both are rebuilt in P19.
- **Home** (design §3): its frame, with SalesWork, AssignedWork and MyPipeline showing "Not configured" until P4 and P6.
- **Demo data.** BossUsersDemoData gains `sales.rep` and `sales.rep2` (two teams of ORG_ZIZI_RETAIL), `sales.manager`,
  `sales.approver`, `sales.change`, `sales.agreement`, `sales.reader` and `sales.admin`, none in `ADMIN`; a rep of
  the second demo organization only; and a manager who works for both.
- **Specs.**
  - `test/Sales/SalesSpecLib.js` (ids, users, `shell`, `page`).
  - `SalesAccess`: the app's one access spec, with authorization on: each group's permissions, the menu per group,
    the root refused to a Projects client and to a user of no Sales group, a write verb of `ironstone.sales` denied a
    client, and Home's one qvt render. A later phase adds a case only for an access rule it adds.
  - Mantle `test/sales/SalesOrganizationScope` (an opportunity, a forecast and an agreement of another organization
    not found under `MANTLE_USER_ORG`; found by the administrator's active organization); `SalesReports` gains the
    `SALES_REPORT_VIEW` reader and its refusal for another organization. The existing `test/Sales/SalesReports` render
    stays the one html render of SalesAnalysis.
- **Usable when** (an acceptance test to write, `test/acceptance/Sales/SalesFoundationWalk`): the menu renders for each
  group; `sales.reader` opens SalesSummary for ORG_ZIZI_RETAIL and is refused the other organization's; an access
  administrator assigns the Sales representative bundle from Admin; a Projects client and a PASS public account are
  refused the root and every `ironstone.sales` service.

### P2 — Pipeline setup: stages, teams, sources and reasons

Design §9 Settings, Stages, Teams, LeadSources (the source list and its organization binding; the UTM map is P5) and
TypesAndReasons; SAL-CRM (its settings part), SAL-ACCESS.

- **Mantle records:** SalesPipeline (organization, name, applicable team, dated); SalesOpportunityStage gains its
  pipeline, fold flag and dates; the seeds design §9 names as initial setup, not demo: the SalesOpportunityType type
  with Lead and Opportunity, the opportunity status type with Open, Won and Lost, the SalesLostReason type, the
  recurring-plan type (enumCode its months), a SalesTeam role type, and a default pipeline with Qualified, Discovery,
  Proposal and Negotiation. The unused LeadStatus items (SalesData.xml:19-24) are left as they are (F4).
- **`mantle.sales.OpportunityServices`** (O), its settings verbs: `store#Pipeline`, `store#Stage` (a used stage is
  retired with a reassignment of its open deals, never deleted), `store#SalesTeam` and `store#SalesTeamMember` (a team
  is an Organization party with the SalesTeam role; membership a dated PartyRelationship), `store#LeadSource` (a
  DataSource row under a LEAD_SOURCE type, and its dated binding to an organization), `store#LostReason` and
  `get#SalesOptions`. Each checks `SALES_CONFIGURE` (Teams also `SALES_TEAM_MANAGE`) and the organization.
- **`mantle.sales.SalesWorkspaceServices.get#SalesReadiness`** (S): findings for a missing default pipeline, a pipeline
  without stages, no team, no source; later phases add theirs (templates, policies, the commercial revision, the
  public app).
- **Admin's registries** (owner contract, as built): a `SettingsEntry` for Sales/Settings and a `ReadinessProvider`
  over `get#SalesReadiness`, on Commerce's rows (BossSetupData.xml:2569-2575); since Nov 11, 2026 the framework's
  `moqui.server` entities, a place named as a route key of Admin's mount (impl-admin §9).
- **People** (§4, the connection built here): TeamMembers' lookup offers the organization's employees, from
  `mantle.humanres.PeopleServices.find#Employees`' public work projection, and its representatives; a member who is
  an employee links to `People/Employees/Employee360` for a People user and `Commons/People/Employee360` otherwise,
  for a viewer `get#Employee360` admits; Employee360 has no Sales context row and Sales mounts none (impl-people P2
  and §7; P0). Mantle's team services read no People record: an organization without People picks members by party.
- **Screens:** Settings (SalesReadiness); Stages (PipelineStages, PipelineDefinition); Teams (SalesTeams, TeamMembers);
  LeadSources at `Sales/Settings/LeadSources` (Sources), built for a second mount (§2); TypesAndReasons (SalesTypes,
  LossReasons). The Settings area for `BOSS_SALES_ADMIN`, Teams also for the manager.
- **Demo data** (`data/BossSalesDemoData.xml`): two teams of ORG_ZIZI_RETAIL with the demo reps, one of the second
  organization, an ended membership, and a second pipeline for one team.
- **Specs:** Mantle `test/sales/SalesPipelineSetup` (a stage in use retired only with a reassignment; a membership
  ended, never deleted; a source bound to one organization not offered to another; a setting refused without
  `SALES_CONFIGURE`); BOSS `SalesSettings` (Stages' one qvt render; the settings entry hidden without its permission).
- **Usable when** (`test/acceptance/Sales/SalesSetupUsable`): `sales.admin` adds a stage, reorders the pipeline and retires
  a stage; `sales.manager` adds a rep to a team from a date; Admin's Health names a pipeline without stages with its
  fix link, and Admin's settings index opens Sales' settings.

### P3 — Accounts and contacts

Design §4 Accounts, Contacts, Customer360, ContactDetail and MergeAccounts; SAL-ACCOUNTS, SAL-ACCESS. The maps note of
design §4 waits for the framework's Maps work, as Admin's did (§7).

- **Mantle.**
  - `mantle.sales.AccountServices`: `create#Account`, `create#Contact`, `add#Contact` and `delete#Contact` require a
    signed-in holder of `SALES_ACCOUNT_EDIT`, take and check the owner organization, and validate the parent and
    contact they are given (F5); `delete#Contact` ends the relationship.
  - `SalesWorkspaceServices` `find#Accounts` (customers and prospects of the organization with owner, next activity
    and counts the caller may read) and `get#CustomerSales` (Customer360's Sales summary and lists).
  - `mantle.party.DuplicateServices.merge#Parties` (owner contract, Commons): its guards of design §4 inside the
    service, since today it checks only the internal-organization role and private contacts (F30): both parties
    visible and of one kind, one owner organization, and the caller a contact administrator (`CONTACT_ADMIN`, whom
    Commons admits today) or, for an account of their organization, a holder of `SALES_ACCOUNT_EDIT` with
    `SALES_TEAM_MANAGE` or `SALES_CONFIGURE` (design §2: M, S); the rows it leaves behind moved or the merge refused
    (ExternalAccessContact, Agreement parties, SalesOpportunity's account and parties). Its three callers keep
    working (F45), with `test/party/Contacts` and BOSS `ContactsDuplicates` passing as they are.
- **Shared screens** (owner contracts, F34): the Sales context of Customer360 (crosscut §3.2's row: the tabs of
  design §4, with Opportunities, RFQs, Quotes, Orders and Agreements filling in as their phases land) in
  `template/SalesCustomer360.xml`, as Customer Service's and Commerce's branches are built
  (Customer360.xml:20-28); the Sales context of the Commons contact record and list (crosscut §3.1); Commons Duplicates
  and Compare mounted as MergeAccounts with the Sales document counts, Commons' merge service admitting the Sales
  merger the Mantle guard admits (F45).
- **Screens:** Accounts at `Sales/Accounts/Accounts` (AccountFind, AccountList, NewAccount, NewPerson), built for a
  second mount (§2), AccountList's row selection and bulk action left to impl-marketing P3; Contacts; Customer360;
  ContactDetail (consent read only, with the link to the Comms Consent mount; Marketing's plan points it at its
  own, §7); MergeAccounts for the manager and administrator. The palette provider, with accounts its first source.
- **Demo data:** customers and prospects of both demo organizations, a parent account, a contact of two accounts, and
  a duplicate pair.
- **Specs:** Mantle `test/sales/SalesAccounts` (an account created in the caller's organization only; an anonymous
  call refused; another organization's parent refused; a contact's relationship ended, the person kept; a merge
  across organizations refused, and one moving an opportunity's account); BOSS `SalesAccounts` (Customer360's one qvt
  render in the Sales context).
- **Usable when** (`test/acceptance/Sales/SalesAccountsUsable`): `sales.rep` creates an account and a contact and finds a
  shared account of the organization; a contact of two accounts shows each account's documents only under that
  account; `sales.manager` merges the duplicate pair and the survivor keeps both histories; a finance tab shows only
  for a finance reader.

### P4 — Leads and opportunities

Design §3 Opportunities, Leads, OpportunityDetail and WorkItemDetail, §12.2 (Chatter and RecordFiles, Calendar and
Today); SAL-CRM, SAL-COLLAB. The opportunity import is P6; the Comms intake P5.

- **Mantle records:** SalesOpportunity gains its status (Open, Won, Lost), lost reason, pipeline, probability mode,
  conversion and close time and actor, `recurringAmount` and recurring plan, audit-logged with its type, account and
  close date (F4); SalesOpportunityContent for its files.
- **`mantle.sales.OpportunityServices`** (O): `find#Opportunities` (the one scoped query of board, list, calendar,
  Home and the palette, filtered by type, owner or team, pipeline and stage, outcome, close period, source
  (`dataSourceId`) and campaign (`marketingCampaignId`), with totals over the whole filtered result by currency),
  `get#Opportunity`,
  `create#Opportunity` (a lead or an opportunity), `update#Opportunity`, `move#Opportunity` (pipeline membership, the
  stage default copied only in Stage mode), `qualify#Lead` (atomic: parties linked or created, the type and
  conversion set, joins kept; the same key returns the same record), `close#Opportunity` (Lost needs a reason) and
  `reopen#Opportunity`, `store#OpportunityParty` (one active primary representative; dated team and contact roles; the
  organization field kept equal, P1), `store#Competitor` and `apply#OpportunityBatch` (each deal on its own). Each
  checks its permission, the organization and the assignment, and the revision it was given.
- **Collaboration** (owner contracts): SalesOpportunity registered as a Chatter and files host (P0), its activities
  through `mantle.work.TaskServices.create#SimpleTask` and Commons events with `WorkEffortRecord`, keeping
  SalesOpportunityWorkEffort; a meeting is a Commons Event with a CallLink (L7); the Sales context of
  Shared/WorkItemDetail (crosscut §3.12's row); a record link for SalesOpportunity (F39).
- **Screens:** Opportunities (OpportunityFind, OpportunityList as board, list and calendar, NewOpportunity,
  ChangeStage, OpportunityBatch); Leads at `Sales/Pipeline/Leads` (LeadFind, LeadList with row selection, NewLead,
  QualifyLead), built for a second mount and a bulk action from another app (§2), a lead's campaign shown and
  filtered where it is set and chosen only once Marketing offers its campaigns (§7); OpportunityDetail (Opportunity,
  OpportunityParties, Competitors, RelatedSales, CloseOpportunity, ReopenOpportunity, Collaboration; Quotes/orders
  fills in from P7); WorkItemDetail. The palette's opportunities source, Today's activities.
- **Demo data:** leads and opportunities in each stage for both teams, won and lost deals with reasons, a recurring
  deal, a lead with no account.
- **Specs:** Mantle `test/sales/SalesOpportunities` (a rep finds their own and their team's deals and not another
  team's; a manager the organization's; a stale move refused naming the stamp; a manual probability kept across a
  move; Lost without a reason refused; a reopen keeps the close history; a batch names the stale row and moves the
  rest) and `SalesLeadQualify` (one salesOpportunityId kept; a retry under its key makes no second account; a
  cross-organization account refused); BOSS `SalesOpportunities` (OpportunityDetail's one qvt render and the board's
  one render with its ChangeStage dialog); the golden walk `SalesPipelineWalk` (a lead, qualified, moved a stage,
  closed won).
- **Usable when** (design §14.3 scenarios 1 and 2; `test/acceptance/Sales/SalesPipelineScenarios`, and
  `test/acceptance/client/Sales/SalesBoardWalk` for the board, the row action and the phone width): a rep creates a lead
  with no account, finds an existing contact at qualification and keeps the one record with its activities and
  files; the same move through the board, the row action and the terminal gives the same result; ending a rep's
  team membership removes the team's deals from their list from that date (scenario 3).

### P5 — Lead intake, Comms hooks and account sync

Design §3 Leads (intake), §9 LeadSources' UtmSourceMap, §1.4 (Comms hooks, CX-MAIL-INTAKE, CX-SYNC), §4 Contacts'
"My accounts"; SAL-CRM (`store#LeadIntake`), SAL-MAIL-INTAKE, SAL-SHELL (the Comms providers), SAL-SYNC.

- **Mantle.**
  - SalesLeadIntake (design §17) and the lead-source map (organization, UTM source, optional medium, DataSource,
    dated).
  - `OpportunityServices.store#LeadIntake`: a validated submission from a mail rule, a Comms `create-from` action, a
    staff entry or, later, Marketing's form and lead rules (§7). Its inputs are the organization, the source kind and
    ID (form response, email message, communication event, staff), the submitted name, organization, email and
    phone, the UTM source and medium, a campaign, a tracking code, the default source, the team queue its caller
    names and an operation key. It writes the intake record, applies the duplicate policy and the source map, sets
    the lead's `marketingCampaignId` when a campaign is given and writes SalesOpportunityTracking when a tracking code
    is, creates the lead and routes it to that queue; one lead for one source identity, and a repeated key answers
    the first result.
    `store#LeadSourceMapping`; `purge#LeadIntakes`, a ServiceJob that removes the submitted details of unverified
    intakes that never qualified after the retention days (30 until P9's SalesDefaults sets them).
  - The mail actions, beside Mantle's two (MantleSetupData.xml:464-467, F27): `ErActCreateLead` (`createLead`, a
    wrapper giving the message to `store#LeadIntake`) now and `ErActCreateQuoteRequest` in P8.
  - `mantle.party.ContactDavServices.get#DavCollections` and its object services gain projected collections: a
    registered provider's read-only address book beside the user's contact books (F29); `SalesWorkspaceServices`
    answers "My accounts" with the contacts of the accounts the rep may see, computed per request; a device write is
    refused.
- **The Sales root's providers** (design §1.4, on Comms' and Customer Service's rows, Comms.xml:56-58,
  CustomerService.xml:68): `record-lookup` for SalesOpportunity (quotes and orders join it in P7); `create-from` kind
  Lead; the `ext-action`s "Create lead" on a chat message, a mail message and a voicemail and "Log call on
  opportunity" on a call and a voicemail; `call-context` with the caller's open opportunities the user may see; and
  `contact-card` if P0 finds Comms reads it.
- **Screens:** LeadSources' UtmSourceMap; LeadList's intake columns (source, received, verification) and NewLead
  prefilled from a message; the intake address shown in Settings.
- **Specs:** Mantle `test/sales/SalesLeadIntake` (one lead for a message delivered twice; a mapped source and medium
  wins over the source alone, an unmapped pair keeps the default; the lead lands in the named team's queue; an
  unverified, unqualified intake purged after its days and a qualified one kept) and `test/party/ProjectedAddressBook`
  (the rep's accounts' contacts listed, another team's absent, a write refused); BOSS `SalesIntake` (a "Create lead"
  from a message keeps the message as its source). `docs/security/Attack-Surface.md` gains the lead and RFQ intake
  addresses (mail from anyone makes an intake record, never a party) and the projected address book.
- **Usable when** (design §14.3 scenario 13, its mail and voicemail parts; `test/acceptance/Sales/SalesIntakeScenarios`):
  mail to the leads address and a voicemail's "Create lead" each make one lead in the named team's queue with the
  mapped source; the same message again makes none; a phone's address book shows the rep's account contacts read only.

### P6 — Home, shell, Assist and the pipeline dataset

Design §3 Home, §12.2 QuickCreate and Palette, §1.4 (CX-ASSIST, CX-OPS-REPORTS' dataset and funnel), §3
OpportunityImport, §16 (the pipeline exports); SAL-SHELL, SAL-ASSIST, SAL-REPORT (the dataset), SAL-ANALYTICS (the
funnel). Ends stage 1.

- **Mantle.**
  - `SalesWorkspaceServices.get#SalesHome` (the counters and assigned work, each from the scoped lists; a failed
    metric unavailable, never zero).
  - The pipeline dataset, `report/mantle-sales-pipeline.json` over a DataDocument of SalesOpportunity with its stage,
    pipeline, organization, owner, source and amounts, fed as each is written, with the organization row filter
    (§4), beside Mantle's sales datasets.
  - The `opportunities` import target (design §3, §16; F24): a `moqui.server.TransferTarget` in rows mode on the
    staff invitations' pattern (PartyInvitationData.xml:48-61), with `validate#OpportunityImportRow`,
    `apply#OpportunityImportRow` (the create, update and qualify services, one row a transaction, its key the source
    row) and `find#OpportunityImportScopes`; its import permissions Sales' own, `SALES_IMPORT` with
    `SALES_OPPORTUNITY_EDIT` and `SALES_TEAM_MANAGE`, and no `ADMIN_*` permission (§4: the registration's
    permissions are all required, F44), each row service checking `SALES_OPPORTUNITY_EDIT` and the organization
    besides;
    an unknown currency, organization, party or stage a row error; no account made by default.
- **Admin and Insights registrations** (owner contracts, as built):
  - the dataset admitted with its class, readiness provider and index refresh, on the rows of Customer Service's
    datasets (BossSetupData.xml:3200, 3283, 4790) and Insights' own (3345-3353, 3385-3392);
  - a `LifecycleParticipant` "Sales assignments" on Projects' row (BossSetupData.xml:4060-4064): the open
    opportunities, accounts and, from P7, quotes a departing user owns, its lookup and transfer services in
    `SalesWorkspaceServices` on the owned-resource contract, reassigning through `store#OpportunityParty` and the
    order part's party roles; an access end People asks for (impl-people P7) reaches it through Admin's lifecycle;
  - the pipeline export listed as an owner export target, as Projects' work-item list is (BossSetupData.xml:4955-4957),
    its place a key added to Admin's owner routes; Shared/DataImport's mount gains a Sales branch for the one target
    `opportunities` (F44).
- **Shell:** QuickCreate (Lead, Opportunity, Account, Contact, Activity; Quote in P7) over the hosts' own forms; the
  palette's sources of P3 and P4 checked as one provider over `search#Records` with `recordEntity` and `recordId`;
  Today's source; Opportunities' and Leads'
  CSV and XLSX exports of the filtered result; the import opened in Shared/DataImport from Leads and Opportunities.
- **Assist** (design §1.4): the skills `sales-qualify-lead.md`, `sales-follow-up.md` and `sales-log-call.md`
  (`sales-issue-quote.md` in P10) with their `screens:`, the aliases and retrieval cases; OpportunityDetail's and
  Customer360's prompt chips; the "Log as note" and "Send as message" response actions; `AgentToolExposure` rows for
  `find#Opportunities` (Assistant and MCP) and `create#`, `move#` and `close#Opportunity` (Assistant, behind approval,
  no MCP), on Admin's rows (BossSetupData.xml:2544, 3177).
- **Screens:** Home (SalesWork, AssignedWork, MyPipeline, PipelineFunnel through `report-embed`); QuickCreate.
- **Specs:** Mantle `test/sales/SalesOpportunityImport` (an unknown stage a row error; a matched ID updated only under
  the update strategy; a repeat under its key answers the first result) and `SalesPipelineDataset` (another
  organization's deals not in a reader's rows); BOSS `SalesHome` (Home's one qvt render; a counter equal to its
  list's count); `test/skill-retrieval.json` gains the Sales cases.
- **Usable when** (`test/acceptance/Sales/SalesHomeUsable`; gate 1): Home's counters open the lists they count; a CSV of
  five deals, one with an unknown stage, imports four and names the one; an offboarded rep's deals wait in Admin's
  lifecycle for a new owner; Assist qualifies a lead only after the user approves the step.

### P7 — Quote drafts, pricing and storeless tax

Design §5 Quotes and OrderDetail's quote context (drafts, pricing, availability), Product360, InventoryAvailability,
§7 PriceExplain, §19 item 1 (storeless freight); SAL-QUOTE (intent, drafts), CX-PRICING (X1). Starts stage 2.

- **Mantle.**
  - The order purpose values `OrpSalesQuote` and `OrpSalesOrder` beside Shop's `OrpRecurringTemplate` (F7).
  - X1: `mantle.other.TaxServices.calculate#OrderSalesTax` resolves its gateway as `SalesTax.js` `gateway()` does
    (:192), falling back to the seller's `PartyAcctgPreference.taxGatewayConfigId`, and
    `handle#OrderMajorChange` runs its tax step without a store (F8). A store order is unchanged; promotions and
    carrier estimates stay store-only, and freight on a storeless quote is a charge line (§5). This is Mantle's fix
    for every storeless sales order of a seller with a gateway, not a rule behind Sales' policy: the orders P0 found
    are taxed as their invoices are, and their owners' specs are updated with them. Marketing's storeless ticket
    order rests on it (impl-marketing P17).
  - `mantle.order.SalesQuoteServices` (Q): `find#Quotes` (sales-direction parts of the purpose SalesQuote in Open,
    Requested or Proposed, with cancelled history; never a cart or a base), `create#Quote` (over `create#Order` and
    `create#OrderPart`: one seller, one customer, one currency; account defaults; the opportunity link), `get#Quote`
    and the draft line verbs over the native item services with `check#ProductUsable`, the one price resolver and its
    provenance; a manual price or discount keeps the calculated basis, the entered value, reason and actor on the
    item; a missing price blocks, an explicit free line needs its permission.
- **Shared screens** (owner contracts, F34): the Sales quote context of Shared/OrderDetail in
  `template/SalesOrderDetail.xml`, on the pattern of the other apps' templates (OrderDetail.xml:15-53): Overview,
  Items, Terms, History, Chatter and Files, the draft's actions, validity on the part; the Sales rows of Product360,
  InventoryAvailability (read only without a Warehouse grant) and PriceExplain (the safe selected-price explanation
  for a rep, the trace with `PRICE_VIEW`). A record link for a sales quote and order (F39; Purchasing's F46).
- **Screens:** Quotes (QuoteFind, QuoteList with its saved lists, NewQuote); OrderDetail at
  `Sales/Orders/OrderDetail`, the one route; Products' Product360 and InventoryAvailability; PriceExplain. Quick
  create's Quote; OpportunityDetail's and Customer360's Quotes.
- **Demo data:** draft quotes for both organizations, one for the storeless seller with a tax gateway (P0), one with a
  customer price and one with a manual override.
- **Specs:** Mantle `test/order/StorelessOrderTax` (a storeless quote taxed through the seller's gateway and retaxed
  on a line change; a store order's tax as before; no gateway, no tax and no error) and `SalesQuoteDrafts` (a cart and
  a recurring base not among quotes; a second customer refused; an override keeps its basis; a missing price blocks;
  a rep without the assignment refused); BOSS `SalesQuotes` (OrderDetail's one qvt render in the quote context).
- **Usable when** (design §14.3 scenario 4, its price and tax half; `test/acceptance/Sales/SalesQuoteDraftUsable`): a rep
  drafts a customer-priced quote with no ProductStore, sees the price Products explains and the tax of the seller's
  gateway change with each line, an unavailable price told apart from zero, and no cost; Projects', Accounting's,
  Purchasing's, Customer Service's and Commerce's order contexts read as before.

### P8 — Requests for quote

Design §5 QuoteRequests and QuoteRequestDetail, §6's chargeable repair handoff; SAL-QUOTE, SAL-MAIL-INTAKE.

- **Mantle Q:** `find#QuoteRequests`, `create#QuoteRequest` (an `RqtQuote` Request with its RequestParty roles, over
  `create#Request`; from a message, with the message and its files linked), `create#QuoteFromRequest` (selected
  items, the request's stamp; one quote and its source links atomically, the same key returning it; an authorized
  `RqtWarranty` source keeps its decision and scope and exposes none of it), `decline#QuoteRequest`. The
  `ErActCreateQuoteRequest` mail action. The request rules type-guarded for `RqtQuote` (F31, P0): no triage notice,
  no case rules and no completion from linked work unless it is in a service queue.
- **Shared screens:** the Sales context of Shared/RequestDetail (crosscut §3.11's row) and "Create RFQ" as a Comms
  message action and `create-from` kind.
- **Screens:** QuoteRequests (QuoteRequestFind, QuoteRequestList, NewQuoteRequest); QuoteRequestDetail.
- **Specs:** Mantle `test/order/SalesQuoteRequests` (one request for a message delivered twice; a quote from selected
  items with its links; the same key no second quote; an RqtQuote not triaged; a warranty source's diagnosis absent
  from the quote); BOSS `SalesQuoteRequests` (QuoteRequestDetail's one qvt render in the Sales context).
- **Usable when** (`test/acceptance/Sales/SalesRfqUsable`): mail to the RFQ address becomes a request with its attachment;
  a rep makes a quote from two of its three lines and a second quote later; a declined RFQ notifies the requester
  after the recipient preview; a warranty claim's chargeable lines become a quote Customer Service can read.

### P9 — Sales defaults, approval policies and approvals

Design §9 SalesDefaults and ApprovalPolicies, §5 Approvals and the approval binding, §13.1 (OrderPlacedAutoApprove,
OrderPreApproveCredit); SAL-APPROVAL, CX-ORDER-AUTHORITY (X4).

- **Mantle.**
  - SalesPolicy (an organization's dated defaults: pipeline and team, validity days, templates, response
    requirements, the acceptance threshold per currency, unset by default, approve accepted net-terms orders,
    intake retention, reminders, and the approval setting: whether the seller's sales orders wait for a Sales
    approver, off by default, §4) and SalesApprovalPolicy (dated rules: purpose, threshold and currency
    or discount percent, price floor, approver role, self-approval), their key fields audit-logged;
    `store#SalesPolicy` and `store#SalesApprovalPolicy` (`SALES_CONFIGURE`; published rows changed by a dated
    successor).
  - OrderDecision gains the order revision, purpose, policy row and time, result and operation key (F14, §4);
    `preview#Quote` (the rules a draft meets, each input, the approver needed; cost inputs checked on the server and
    never returned), `decide#Quote` (the approver, not the author unless the rule allows; the revision bound; a stale
    or expired decision refused naming the current revision) and the `SalesQuoteApproval` topic seeded in Mantle
    beside OrderChangeApproval (MantleSetupData.xml:750, F26) with its approve and refuse handlers and a title naming
    the quote and no amount; BossSetupData gives the topic its link to Sales' OrderDetail, as it does
    OrderChangeApproval's. Until an organization sets rules, a manual override on a quote made through Q needs an
    approver other than its author; the rule guards `propose#Quote`, not native order entry.
  - Sales' pre-approval warnings (an unresolved Sales approval, a price under its floor; §4): a SECA on
    `check#OrderPreApprove` adds them to its `approveWarnings`, as Accounting's credit warning and Purchasing's
    approval warning are added (AccountingCredit.secas.xml:20, Purchase.secas.xml:22). With the seller's approval
    setting off they block `autoApprove#Order` like the others, as built (OrderServices.xml:1520-1533), and the
    order waits for a person to approve it. With the setting on no auto-approval happens (P11), so nothing is left
    for them to block: OrderDetail's approval section and the Awaiting approval list show them to the person
    approving, and they do not refuse that approval. An order that meets no Sales rule gets no Sales warning.
- **Screens:** SalesDefaults (SalesPolicy with preview and publish); ApprovalPolicies (ApprovalRules,
  ApprovalPreview); Approvals, the Commons Notifications list mounted with Sales' topics as Purchasing mounts it
  (Purchasing/Approvals.xml:15-26), for `BOSS_SALES_APPROVE`, which gets `SALES_APPROVE` here (F43); OrderDetail's
  approval section. The readiness findings for no policy and the commercial revision off (F9). From this grant a
  commercial order change that Customer Service files notifies the Sales approver: Approvals lists
  `OrderChangeApproval` too and the change is decided from the list, its row opening as P0 settles, until P14 gives
  it its detail.
- **Specs:** Mantle `test/order/SalesQuoteApprovals` (an override over the rule needs the approver; self-approval
  refused; a decision at an earlier revision refused; a line change invalidates it; a file added does not; with
  the seller's approval setting off a Sales warning stops `autoApprove#Order` and not a person's `approve#Order`;
  an organization with no policy auto-approves as before); BOSS `SalesApprovals` (the list's one render with a
  quote's row and no amount in its title).
- **Usable when** (design §14.3 scenario 5, its approval half; `test/acceptance/Sales/SalesApprovalUsable`):
  `sales.admin` publishes a discount rule; a rep's override waits for `sales.approver`, who approves it from
  Approvals; the rep cannot approve their own; a direct service call cannot propose the unapproved quote.

### P10 — Issue, send and the customer's response

Design §5 OrderDetail's quote context (propose, send, revision binding, revise, clone, record acceptance, decline and
withdrawal), Quotes' QuoteBatch, §13.2 (reminders), §16 (the quote PDF and mail); SAL-QUOTE (issue and response),
CX-DELIVERY (X8), X2, X3.

- **Mantle.**
  - SalesQuoteIssue and SalesQuoteResponse (design §17), with one effective response to an issue.
  - Q: `propose#Quote` (parts, products, totals, dates and approvals current, then `propose#Order`); `send#Quote`
    (recipients and template previewed; the PDF rendered and stored as OrderContent at the offered revision; the issue
    with its validity; a rep's own send through Comms Compose with the PDF attached and the order as its filing
    record; a send for another or in a batch through `send#EmailTemplate` on the delivery ledger); `respond#Quote`
    (the staff's record of an acceptance or decline with its evidence: the issue current and unexpired under lock,
    the response written, `place#Order` called once, the result Placed, Approved or Held; a decline cancels through
    Cancel Quote, OrderEntities.xml:200); `withdraw#Quote` (the same cancel and the issue revoked); `revise#Quote`
    (Proposed to Being changed and back, the earlier approvals and issue ended, the earlier PDF kept);
    `apply#QuoteBatch`; the reminder job over the ledger, off by default.
  - The commercial revision (F9): an issue binds `orderRevision` only where the seller's
    `salesCommercialRevisionOnly` is on; `send#Quote` refuses otherwise with the readiness finding, and SalesDefaults
    sets it (§4).
  - The delivery ledger sources (F16): quote sends, reminders and batch sends as `MessageDeliverySource` rows with
    their build services, as cart recovery's is (CartRecoverySetupData.xml:14); the quote and reminder EmailTemplates
    with `fancy-locked-html` text; the print header's QR of the quote link from P13 (the staff path until then).
- **Screens:** OrderDetail's Issues and responses (QuoteOffer, QuoteSend, QuoteResponse), Propose, Send, Record
  acceptance, Record decline, Withdraw, Revise and Clone by state; QuoteBatch on Quotes; the quote's html-print and
  PDF. Assist's `sales-issue-quote.md`, the quote context's chips, and the `preview#Quote` and `send#Quote`
  exposures (behind approval, no MCP) with `find#Quotes`.
- **Specs:** Mantle `test/order/SalesQuoteIssue` (storing the PDF, a note, a file and proposing leave the bound
  revision; a line change ends the issue; a send to two with one failure retries only that one and keeps one issue)
  and `SalesQuoteResponse` (two acceptances under one key and under two give one response and one order; a decline
  after it refused; an expired and a revoked issue refused; a credit-held acceptance is accepted and held; a decline
  cancels the quote with its reason); BOSS `SalesQuoteSend` (the send dialog's preview with the stored PDF's name).
- **Usable when** (design §14.3 scenarios 6 and 7, the staff path; `test/acceptance/Sales/SalesQuoteScenarios`): a rep
  sends an approved quote to two recipients, retries the one that failed, records the customer's acceptance with
  their PO and sees one placed order, read only at the one OrderDetail route until P11 gives it its actions;
  revising the quote ends the old issue's authority and keeps its PDF.

### P11 — Orders, approval and the storeless confirmation

Design §6 Orders and OrderDetail's sales-order context, §5 (acceptance and approval), §13.1 (the store and storeless
mail), §16 (the storeless confirmation); SAL-QUOTE (guarded transitions, `send#OrderConfirmation`), CX-ORDER-HOLD,
CX-CREDIT, X1, X4.

- **Mantle.**
  - `mantle.order.OrderServices.approve#Order`'s sales direction (F11), on the purchase direction's pattern: where
    the seller's approval setting is on, a sales part needs `SALES_ORDER_APPROVE` and a current Sales decision
    where a rule asks one; elsewhere `ORDER_APPROVE` as today. P9's pre-approval warnings are shown to the approver
    and do not refuse the person approving (§4). The credit check stays in it. `hold#Order` and
    `release#OrderHold` check the order's organization and direction (Customer Service's F78).
  - The approval setting, respected globally (§4; F52): `autoApprove#Order`
    (service/mantle/order/OrderServices.xml:1495-1539) approves no sales part whose seller has the setting on, so
    the order stays placed for a holder of `SALES_ORDER_APPROVE`, whichever app placed it. The rule is in that one
    service because every automatic approval comes through it: the order-placed SECAs `OrderPlacedAuthorizePayments`
    (service/AccountingPayment.secas.xml:17-20, to `authorize#OrderPayments`, which calls it at
    account/PaymentServices.xml:1689-1691) and `OrderPlacedAutoApprove` (service/OrderReturn.secas.xml:50-59), the
    delayed job `autoApprove#OrdersDelayed` (OrderServices.xml:1463-1494) and the credit hold's release
    (account/Credit.js:305-306). The payment is still authorized; only the approval waits. A purchase part and a
    seller with the setting off, its default, approve as today: there any warning of `check#OrderPreApprove`,
    P9's among them, still stops the auto-approval, as built.
  - Existing callers (owner contracts with Shop and Commerce): Shop's checkout and renewals and Commerce's orders
    are approved by that path today, on the payment authorization at placement. Their behaviour changes only for a
    seller with the setting on, whose store orders then wait in Awaiting approval, and for an order that carries
    a Sales warning under a rule its seller set (P9); with the setting off and no Sales rule their specs pass
    unchanged (mr-pass's Shop suites, mr-boss's Commerce suites, mr-mantle's order and payment specs). Written into
    design-shop and design-commerce when the phase is built.
  - Q: `create#SalesOrder` (direct entry, purpose SalesOrder), `place#SalesOrder` and `approve#SalesOrder` (the policy
    and revision guard, then the native primitive), `apply#SalesOrderBatch` (approve or close remainders, each order
    through `approve#Order`, so none skips the credit check as the baseline's bulk status change does, F12), and the
    option that approves an accepted net-terms order as the system when credit and every rule pass, which applies
    only while the seller's approval setting is off: with it on, that order waits for a holder too.
    `SalesWorkspaceServices.find#SalesOrders` (direction from each part; holds and shipped and billed progress by line
    unit and currency; carts and bases excluded).
  - `send#OrderConfirmation` (X1): for a storeless placed or approved order, Customer Service's stored confirmation
    as placed (`store#PlacedOrderConfirmation`, F15) sent with the SalesDefaults template as a delivery-ledger source,
    once for an event, revision and recipient; a store order keeps its store mail (OrderInfoServices.xml:1424).
- **Shared screens:** the Sales order context of Shared/OrderDetail (crosscut §3.6's second Sales row): Overview,
  Items, Fulfillment, Invoices/payments by capability, Changes (P14), History, Chatter and Files; Place, Approve,
  hold and release of Manual and Change holds, Cancel remainder, Clone, Print; invoice creation and reservation only
  with their owners' grants. Until P14 mounts ShipmentDetail and InvoiceDetail, Fulfillment and Invoices/payments
  list their rows without links.
- **Screens:** Orders (OrderFind, OrderList with its saved lists, Awaiting approval for `BOSS_SALES_APPROVE`, which
  gets `ORDER_APPROVE` here (F43), NewSalesOrder, OrderBatch); OrderDetail. Home's blocked-orders counter; the
  palette's orders.
- **Insights** (owner contract): attention providers "Quotes to send", "Quotes expiring" and "Orders awaiting
  approval" on Commerce's rows (BossSetupData.xml:3863-3868).
- **Specs:** Mantle `test/order/SalesOrderApproval` (with the guard on, `ORDER_APPROVE` alone refused a sales part and
  `SALES_ORDER_APPROVE` admitted; with it off as before; a purchase part unchanged; with the setting on a store
  order and a storeless order with a covering authorization both stay placed, the payment authorized, and each is
  approved by a holder, a pre-approval warning on it shown and refusing nothing; with it off the same orders
  auto-approve, and one with a pre-approval warning does not; a batch approval credit-holds the order over its
  limit and approves the rest; another organization's hold not released) and
  `StorelessOrderConfirmation` (one confirmation for a placement; none for a store order; a second approve sends
  none); BOSS `SalesOrders` (OrderDetail's one qvt render in the order context; the Awaiting approval list).
- **Usable when** (design §14.3 scenarios 4 and 7, their order halves; `test/acceptance/Sales/SalesOrderScenarios`): an
  accepted net-terms quote waits in Awaiting approval and `sales.approver` approves it past the credit and Sales
  checks; a storeless order's placement sends one confirmation and its invoice carries the gateway's tax; a rep
  enters a direct order with no quote.

### P12 — Quote templates

Design §5 QuoteTemplates and QuoteTemplateDetail, §19 item 2; SAL-TEMPLATE.

- **Mantle Q** (§4): a template uses the order entities, an OrderHeader of the distinguishing purpose
  `OrpSalesQuoteTemplate` that is never placed and never leaves Open, its published interval the part's validity
  dates, copied into a quote with `clone#Order` (`copyPayment=false`) and then priced as of the quote's date:
  `find#QuoteTemplates`,
  `store#QuoteTemplate`, `publish#QuoteTemplate` (a dated successor; a published one is not edited),
  `preview#QuoteTemplate` and NewQuote's template choice. Every reader that leaves out `OrpRecurringTemplate` (F7)
  leaves this purpose out too. No SalesQuoteTemplate table is built; design-sales §5 is changed to say so.
- **Screens:** QuoteTemplates (TemplateFind, TemplateList, NewTemplate); QuoteTemplateDetail (TemplateHeader,
  TemplateItems, TemplatePreview), its line editor the quote draft's.
- **Specs:** Mantle `test/order/SalesQuoteTemplates` (a quote from a template priced as of its own date; a published
  successor leaves the earlier quote's terms; a template never reserved, placed, counted as an order or offered as a
  quote); BOSS `SalesQuoteTemplates` (QuoteTemplateDetail's one qvt render).
- **Usable when** (design §14.3 scenario 5, its template half; `test/acceptance/Sales/SalesTemplateUsable`): a manager
  publishes a template, a rep starts a quote from it, the manager publishes a successor, and the first quote and its
  PDF are unchanged.

### P13 — PASS Sales: quotes

Design §10.1, CustomerQuotes, CustomerQuote and QuoteResponse, §4's Invite to Sales, §12.1 (public operation
identity); SAL-PORTAL (its quote part), X6. Ends stage 2.

- **Mantle.**
  - ExternalAccess (owner contract, F17): the `sales` app kind (`SALES_CUSTOMER_INVITE`; a person admitted, as
    `support` admits one); on the `SalesOrder` kind the scopes QuoteView and QuoteRespond, which resolve a proposed
    quote of an internal seller to an outside customer, bind the issue's revision, end no later than the offer and
    are issued under `SALES_QUOTE_SEND`; a page per scope, so a quote's link opens the organization's Sales mount
    while OrderView keeps Shop's page (a storeless order's link moves to Sales' page in P17, F48). `send#Quote`
    issues one capability a recipient with the issue; `revise#Quote` and `withdraw#Quote` revoke them.
  - `mantle.order.SalesPortalServices` (P): `find#CustomerQuotes`, `get#CustomerQuote`, `get#QuoteDocument`,
    `respond#CustomerQuote` (the same `respond#Quote` as the staff path) and `get#QuoteResponse`, each taking PASS's
    `input` map, deriving the customer and organization from the capability or the contact or self relationship and
    answering an allowlisted projection; `check#SalesAppReadiness` and `get#AccountCard`.
  - The posting operation bound to the capability or verified customer as well as the organization, action, issue
    and payload (F36), so a bearer's retry answers its own first result and no one else's.
  - The acceptance threshold of SalesDefaults (§4), per currency and unset by default: above it a bearer link alone
    cannot accept, and acceptance needs PASS sign-in as an invited contact; with none set every acceptance is as
    below it.
- **PASS** (Deployment.md "Adding an app", F18): `sales` in the authority's PublicApps (target organization,
  readiness, account card) and in `service/pass/Apps.js`; `screen/Sales.xml` under Pass.xml with CustomerQuotes,
  CustomerQuote and QuoteResponse as plain HTML forms, as the Support pages are; the operations `sales.findQuotes`,
  `sales.getQuote`, `sales.getQuoteDocument`, `sales.respondQuote` and `sales.getQuoteResponse` in the schema and
  route lists and Mantle's copies; `respondQuote` among the bearer writes; the refusal reasons; the test runtime's
  mount and Portals' spec's list of targeted apps; the header's branch; the Quotes and Orders card on the Account
  hub (quotes now, orders in P17); Deployment's "Sales app" section.
- **BOSS:** Invite to Sales on Customer360 and ContactDetail (`invite#Contact` for the `sales` app, bound to the
  account and organization); the PASS link and its QR on the quote's print and mail; readiness for an organization
  with no published Sales mount.
- **Specs:** Mantle `test/order/SalesPortal` (a bearer reads its one issue and receipt and no list; another customer's
  quote, a changed order ID and a revised issue give nothing; a contact lists only its account's issued quotes; a
  double submit gives one response; above the threshold a bearer is refused and the signed-in contact admitted);
  mr-pass `test/Sales/SalesPortalAccess` (the pages' refusals read "not available"; the schema's and routes' copies
  agree); `docs/security/Attack-Surface.md` gains the five operations, the bearer write and the two scopes.
- **Usable when** (design §14.3 scenarios 7 and 8; mr-pass `test/acceptance/SalesQuoteScenarios` and
  `test/acceptance/client/SalesQuoteHttp`, locally and through a remote frontend; gate 2): a customer opens the mailed
  link at 390 px, reads the offer and its PDF, accepts with a PO and sees the receipt; a second click shows the same
  receipt; an invited contact signs in and finds the quote under My account; no ID change or other capability shows
  another customer's quote.

### P14 — Commercial changes and the fulfillment and billing handoffs

Design §6 OrderChanges, OrderChangeDetail, ShipmentDetail and InvoiceDetail; SAL-CHANGE, CX-POSTING. Starts stage 3.

- **Mantle** `mantle.order.OrderChangeServices` (owner contract with Customer Service, F13): `apply#OrderChange` for
  the owner kinds (price, quantity increase and a new line, ship date, address, ship method, carrier) under
  `SALES_ORDER_CHANGE` after a current `SALES_APPROVE` decision: the proposal's and the order's revisions locked and
  rechecked with policy, price, allocations and billing state; the Change hold used, not Being changed; Warehouse's
  release and rebuild of open reservations and Accounting's draft-release contract called, an active pick, a shipped
  quantity or a finalized invoice answered as the named conflict; the changed document's PDF stored; only its own
  hold released; obsolete approvals ended. `preview#OrderChange` gains the commercial kinds' tax, freight and credit
  effects. The hold-placing check in `PurchaseOrders.js` (:455-470) is unchanged. `BOSS_SALES_CHANGE` gets
  `SALES_ORDER_CHANGE` and `ORDER_CHANGE_HOLD_RELEASE` here (F43).
- **Shared screens** (owner contracts): the Sales context of Shared/OrderChangeDetail, which answers "not available"
  to every root but Customer Service's today (OrderChangeDetail.xml:15-18): the commercial kinds' proposal, impact,
  decision and apply; the Sales rows of ShipmentDetail (read only) and InvoiceDetail (a receivable reader; the PASS
  Billing pay link for a holder of Accounting's issuer grant). The topic's route for a Sales approver (P0, F26), in
  place of P9's decision from the list. Customer Service's context and `CustomerServiceOrderChanges`' checks stay
  as they are.
- **Screens:** OrderChanges (ChangeFind, ChangeList, NewChange) for the change operator, approver and manager;
  OrderChangeDetail; OrderDetail's Changes tab and New change; ShipmentDetail and InvoiceDetail under Orders, with
  OrderDetail's shipment and invoice rows linking to them.
- **Specs:** Mantle `test/order/OrderChanges` gains the owner kinds (a price change applied once under its key; a
  quantity increase adds the line at the resolver's price; a stale order revision, an expired approval, an active
  pick and a finalized invoice each refused by name; another hold left in place; Customer Service's two kinds as
  before); BOSS `SalesOrderChanges` (OrderChangeDetail's one qvt render in the Sales context).
- **Usable when** (design §14.3 scenario 9; `test/acceptance/Sales/SalesChangeScenarios`): a price change filed in Customer
  Service is approved by `sales.approver` and applied by `sales.change`, the order's PDF and totals follow, and a
  change against a picked line waits with its conflict; a partly shipped and invoiced order's remaining quantities
  reconcile with its shipments and invoices.

### P15 — Agreements and customer prices

Design §7 Agreements, AgreementDetail, CustomerPrices, PriceLists, PriceListDetail and PriceExplain (the agreement
scope), §19 item 5; SAL-AGREEMENT, SAL-COLLAB, PRD-PRICE.

- **Mantle.**
  - `mantle.party.SalesAgreementServices` (G) over the built status flow (PurchaseAgreementEntities.xml:102-117, F19):
    `find#SalesAgreements`, `get#SalesAgreement`, `create#SalesAgreement` (AgrSales or AgrProduct, a template),
    `store#SalesAgreement`, `store#AgreementParty`, `store#AgreementTerm`, `store#AgreementItem`,
    `activate#SalesAgreement` (parties, dates, evidence and prices checked), `end#SalesAgreement` and renewal as a
    dated successor through AgreementAssoc; `expire#SalesAgreements` beside Purchasing's job; Agreement guarded as a
    Chatter and files host by its parties and organization (design §12.2, P0). AgreementParty gains
    dates only if a succession needs them (PartyEntities.xml:1078-1085). Each checks `SALES_AGREEMENT_EDIT` and the
    selling organization; Purchasing's agreements and services are untouched.
  - The resolver's agreement guard (F20; Products' owner contract): a price row naming an agreement applies only
    while that agreement is active and in its dates for the order's parties; other rows as before.
- **Shared screens:** `Shared/AgreementDetail`, the customer agreement's definition (§5's question on sharing forms
  with Purchasing's screen); the Sales rows of Prices (as CustomerPrices), PriceLists, PriceListDetail and
  PriceExplain (impl-products §7), for holders of Products' price permissions.
- **Screens:** Agreements (AgreementFind, AgreementList, NewAgreement); AgreementDetail (the forms of design §7);
  CustomerPrices; PriceLists; PriceListDetail; OrderDetail's Agreements tab; Customer360's Agreements.
- **Specs:** Mantle `test/party/SalesAgreements` (activation refused without parties or evidence; an ended agreement's
  price not offered to a new quote and an earlier order unchanged; a renewal a new agreement linked to the old;
  another organization's agreement refused); `test/product/` the resolver's guard beside its price-list spec; BOSS
  `SalesAgreements` (AgreementDetail's one qvt render).
- **Usable when** (design §14.3 scenarios 4 and 10, their agreement halves; `test/acceptance/Sales/SalesAgreementUsable`):
  an agreement manager activates an agreement with two negotiated prices, a rep's quote for that customer takes
  them and PriceExplain says why, and after the agreement is ended a new quote does not, while the earlier order
  keeps its price.

### P16 — Recurring orders and subscriptions

Design §7 RecurringOrders and Subscriptions, §13.1 (`create_RecurringOrders`); SAL-RECURRENCE, CX-RECURRING (X5).

- **Mantle** (F22): OrderHeader gains the recurrence's time zone, start and end and pause; G
  `find#RecurringSalesOrders`, `store#SalesRecurrence` (over `update#OrderRecur`; a base is marked
  `OrpRecurringTemplate`, may carry no reservation, shipment or billing source, and names its agreement;
  auto-invoice needs the finance right) and `change#SalesRecurrence` (pause, end, retry). The worker's guards: the
  occurrence due in the base's zone and inside its dates, not paused; the clone made with `copyPayment=false`; one
  child for an occurrence under its key, for the job and an operator alike; one base's failure named and the rest
  run; a Shop-linked base still only dispatched to Shop (OrderServices.xml:2597-2604). Whether a native base stays
  Approved, as the worker asks today (:2591), is settled in the phase against the base's exclusions (F22).
- **Shared screens** (owner contracts): Commerce's Subscriptions list becomes `Shared/Subscriptions` with Commerce's
  route as its mount (F23) and a Sales context: seller, customer and agreement filters, the store optional, storeless
  Subscription rows from native orders beside store contracts, Follow up and the link to the base's row; lifecycle
  actions only with Commerce's or Accounting's grants. OrderDetail's Recurrence form and Accounting's
  RecurringInvoices link here.
- **Screens:** RecurringOrders (RecurrenceFind, RecurrenceList, RecurrenceSettings, RecurrenceAction); Subscriptions.
- **Specs:** Mantle `test/order/SalesRecurrence` (a base never reserved, shipped or invoiced; two runs of one due
  occurrence make one child; a paused base and one past its end make none; a failing base does not stop the next; a
  Shop base only dispatched; no payment copied); BOSS `SalesRecurrence` (RecurringOrders' one qvt render).
  Mantle's Subscriptions and Shop's subscription specs and BOSS `CommerceSubscriptions` pass unchanged; the move
  is written into design-commerce §6.
- **Usable when** (design §14.3 scenario 10, its recurrence half; `test/acceptance/Sales/SalesRecurrenceScenarios`): an
  agreement manager makes an approved order a monthly base, the job places next month's order once, a paused base
  skips its month, and Sales' Subscriptions shows a storeless subscription beside a store contract it can only follow
  up.

### P17 — PASS Sales: orders

Design §10 CustomerOrders and CustomerOrder; SAL-PORTAL (SAL-R01).

- **Mantle P:** `find#CustomerOrders` (placed sales orders of the verified account and the contact's accounts; no
  quote in progress, base, note or other customer) and `get#CustomerOrder` (lines, totals, promised dates, the
  accepted quote, shipments with tracking, invoices with their open amount); the order's PDF through protected media.
- **PASS:** CustomerOrders and CustomerOrder; the operations `sales.findOrders` and `sales.getOrder`; the storeless
  confirmation's order link: `send#OrderConfirmation` issues the `SalesOrder` OrderView capability, as Shop's
  checkout issues its own, and OrderView's page goes by the order's store, a storeless order opening this page and
  a store order Shop's as before (F42, F48); links to PASS Support
  with the order selected for a change, cancel or return, and to PASS Billing's InvoicePay for an invoice, each under
  its own capability and only where the site mounts that app. The Account hub card's orders.
- **Specs:** Mantle `test/order/SalesPortal` gains the order cases (a bearer's one order; a contact's accounts only;
  a base and a draft absent; a store order's link still Shop's); mr-pass `SalesPortalAccess` gains the order pages;
  Attack-Surface gains the two operations.
- **Usable when** (design §14.3 scenario 8, its order half; mr-pass `test/acceptance/SalesOrderScenarios` and
  `test/acceptance/client/SalesOrderHttp`): a contact follows a direct order's shipment and opens its invoice in Billing;
  the confirmation's link shows that one order; the page offers no edit, cancel or payment.

### P18 — Forecast and targets

Design §8 Forecast and TargetAttainment, §9 Targets; SAL-FORECAST.

- **Mantle** `mantle.sales.ForecastServices` (F): SalesForecast gains its measurement basis, with the quota and basis
  audit-logged; `get#Forecast` (quota, open and weighted pipeline, open and won monthly recurring revenue, the
  entered forecast and best case, won amount, actual orders and invoices by their named dates; the deals behind each
  with the reason one is left out; no percentage on a zero quota; no total across currencies),
  `store#Forecast` and `store#ForecastDetail` (the key organization, party, period and currency, unique; details
  reconciled to their parent), `store#Target` (`SALES_TEAM_MANAGE`; no duplicate key or hierarchy cycle) and
  `get#TargetAttainment` (quota against the one basis the target names; unassigned amounts apart).
- **Screens:** Forecast (ForecastFind, ForecastMetrics, ForecastDeals, SubmitForecast, ForecastDetail); Targets
  (SalesTargets); TargetAttainment (TargetOptions, TargetResults); their exports.
- **Specs:** Mantle `test/sales/SalesForecasts` (the weighted amount equals its deals'; a deal with no date left out
  with its reason; a manual probability used; a parent's roll-up counts a deal once across a team change; a zero
  quota gives no percent; a second forecast for one key refused); BOSS `SalesForecast` (Forecast's one qvt render).
- **Usable when** (design §14.3 scenario 11; `test/acceptance/Sales/SalesForecastScenarios`): a rep submits a forecast for
  the quarter beside the calculated pipeline, the manager's roll-up drills to the same deals, and attainment against
  a won-deal target never adds order or invoice amounts to it.

### P19 — Reports and Insights registrations

Design §8 Reports, SalesSummary, SalesAnalysis, PipelineAnalysis and WinLoss, §1.4 (CX-OPS-REPORTS), §13.2, §16;
SAL-REPORT, SAL-ANALYTICS.

- **Mantle:** `ForecastServices.get#PipelineAnalysis` (stage, source, age and activity over the scoped deals as of a
  date; stage durations from the audit log, gaps unknown; conversion over a lead-created cohort) and `get#WinLoss`
  (the close cohort, reasons, cycle time, reopen count; one deal once); `SalesWorkspaceServices.get#SalesReports`;
  `run#SalesAnalysis` read under Sales' report scope with margin columns only for a price and cost reader.
- **Screens:** Reports (SalesReportCatalogue); SalesSummary rebuilt over the guarded summaries with their basis
  named; SalesAnalysis rebuilt at its route over `run#SalesAnalysis`, replacing the entity read (F2), and
  `Accounting/Reports/SalesAnalysis` made a mount of it with Accounting's finance columns (Z10; owner contract);
  PipelineAnalysis (with the funnel) and WinLoss; their CSV, XLSX and print.
- **Insights registrations** (owner contracts, as built; F3, F24): the `Sales.SalesAnalysis` entry's route moved to
  Sales' with Sales' catalogue service (BossSetupData.xml:3594-3601); entries for SalesSummary, PipelineAnalysis,
  WinLoss, Forecast and TargetAttainment; metrics for open and weighted pipeline, won value and win rate beside
  `Sales.Orders` and `Sales.OrderValue`; flow targets for Leads, Opportunities, Quotes, Orders and Order changes on
  Commerce's rows (BossSetupData.xml:4545-4548), so the suite's flow-map templates' Sales steps become links; the
  shipped `report/boss-sales-pipeline.json` dashboard, the alert templates "quote expiring in N days" and "deal with
  no activity for N days", and the weekly pipeline and forecast digest, on the files Customer Service and Insights
  ship (`report/boss-service-sla-breach.json`, `report/insights-weekly-digest.json`). The `operation` marks on
  QuoteBatch, the import rows and the recurrence worker.
- **Settings:** `get#SalesReadiness` complete (failed jobs, templates, the public app, policies), and Settings' links.
- **Specs:** Mantle `test/sales/SalesPipelineReports` (a reopened deal counted once in the final-outcome mode; win
  rate over won and lost only; a stage duration with a gap unknown); BOSS `SalesReportCatalog` (SalesAnalysis one
  entry at Sales' route, read by Sales' report readers and Accounting's; margin columns absent without cost read).
  The `test/Sales/SalesReports` render is the rebuilt screen's one html render; AccountingReporting passes with the
  mount.
- **Usable when** (`test/acceptance/Sales/SalesReportsUsable`): `sales.reader` opens each report for their organization
  with its drill-down and export agreeing with the screen; Accounting's SalesAnalysis shows its finance columns over
  the same rows; a manager subscribes to the weekly digest and copies the stalled-deal alert so it fires.

### P20 — Finish

- The tui and server-static screen sweeps of Sales, one acceptance test per mode (each screen's twin is built in its
  phase), and PASS Sales' pages at 390 px.
- The design §14.3 review, acceptance tests (§8): scenario 12's walk from a lead to an invoice with a user holding
  only the grants it needs; and the access walk, a user of each Sales group and of a second organization refused
  other organizations' and other teams' records, costs, finance and borrowed actions, through URLs, shared mounts,
  record panels, exports, the palette, choices, imports, Assist tools, the Comms providers and direct services.
- The §16 outputs not built earlier: the RFQ acknowledgement, the agreement print, the change confirmation's mail.
- The inventories' **Implemented in** columns, the design's Impl column, Remaining-Work, the mr-boss README's Sales
  line, and mr-pass's README and Deployment for the Sales app.

## 4. Decisions

These are made before and during the build. Each one that changes the design is also written into design-sales.md or
the owner's design.

| Date | Decision | Notes |
| --- | --- | --- |
| Nov 11, 2026 | The four apps are built People, Maintenance, Sales, Marketing, each with its own plan and order, not one shared order as Admin and Insights had. Sales is third | The user's call (the planning request) |
| Nov 11, 2026 | A connection between two of the four apps is built in the plan of the app built later; the earlier app's plan lists it in §7, naming the plan that picks it up. So Sales builds its links to People (team members as employees with the Employee360 link, the offboarding participant) and Marketing builds the lead handoff, attribution and the audience action over what Sales exposes (§7) | The user's call |
| Nov 11, 2026 | PASS Sales (design §10) is planned in this file, with mr-pass among the repositories and its own phases at the design's stages (P13 quotes in S2, P17 orders in S3); there is no mr-pass plan or design for it. It runs over Mantle with no runtime dependency on BOSS | The user's call; unlike Commerce's Shop |
| Nov 11, 2026 | Sales' plan picks up everything the built apps left waiting on Sales, each in the phase where its records exist (§1 scope) | The user's call |
| Nov 11, 2026 | Scope is every `parity` and `new` row of design §2 and the needs they use; `later` rows and §11 go to §7 | The user's call |
| Nov 11, 2026 | The order of §1 follows design §15's stages S1–S3 as three gates. Within them the plan puts pipeline settings before the pipeline (P2) and the Orders list and the order context, which design §15 names in no stage, in S2 (P11), because an acceptance places an order the staff must see and approve. The fulfillment and billing mounts stay with commercial changes in S3 (P14), as design §15 has them, so P11's order lists its shipments and invoices without links until P14 | The plan's choice; F46 |
| Nov 11, 2026 | A permission a built Mantle service already checks is granted to a Sales group by the phase that builds its Sales screens, not by P1: `SALES_APPROVE` in P9, `ORDER_APPROVE` in P11, `SALES_ORDER_CHANGE` and `ORDER_CHANGE_HOLD_RELEASE` in P14. Mantle seeds them all in P1 | Review, F43: design §15 "root grants enable only usable flows" |
| Nov 11, 2026 | Leads (`Sales/Pipeline/Leads`), Accounts (`Sales/Accounts/Accounts`) and LeadSources (`Sales/Settings/LeadSources`) stay Sales' own screens at the design's paths and are built for a second mount (§2); Marketing's plan mounts them and adds its bulk action and AccountList's row selection (impl-marketing P3, P13). They are not moved under `Shared/` | Review, F47; design-marketing §10, §12 "mount Sales Leads" |
| Nov 11, 2026 | `merge#Parties` admits a contact administrator, as Commons does today, or a Sales manager or administrator for an account of their organization; no new permission | Review, F45; design §2's roles of MergeAccounts |
| Nov 11, 2026 | Sales is built against the registries as Admin and Insights built them, not the designs' earlier wording: BOSS `ironstone.admin` and `ironstone.insights` seed rows in BossSetupData, the framework's CapabilityBundle and TransferTarget; the opportunity import is a rows-mode target with row services | F24; design §3 changed |
| Nov 11, 2026 | Each app gets an import permission of its own, and its import targets name that, with the app's own permissions the target already names, and no `ADMIN_*` permission. Sales' is `SALES_IMPORT`: the `opportunities` target asks `SALES_IMPORT` with `SALES_OPPORTUNITY_EDIT` and `SALES_TEAM_MANAGE`. Mantle seeds it, BossSetupData grants it to `BOSS_SALES_MANAGER`, and it is in that group's capability bundle (P1, P6) | The user's call, for the four apps: People's `PEOPLE_IMPORT`, Maintenance's `MAINTENANCE_IMPORT` and Marketing's `MARKETING_AUDIENCE_IMPORT` are in their plans' §4. A target's permissions are all required (framework service/org/moqui/admin/DataTransferImports.js:37-41, DataTransferBatch.js:82; F44), so `ADMIN_TRANSFER_RUN` beside them would shut Sales' own users out; Admin's Imports lists a run for a data operator who also holds the app's view permission |
| Nov 11, 2026 | Mantle seeds the `SALES_*` permissions, each granted to `ADMIN`; BossSetupData grants them to the groups of design §1.1 | The plan's choice: Mantle's services check them, two are checked already (F13), and Mantle may not depend on BOSS data |
| Nov 11, 2026 | The order purpose values are `OrpSalesQuote` and `OrpSalesOrder`, beside the built `OrpRecurringTemplate` | F7; design starting point changed |
| Nov 11, 2026 | A quote template uses the same order entities with a distinguishing purpose, `OrpSalesQuoteTemplate`, and is never placed (P12). No SalesQuoteTemplate table is built | The user's call. Its published interval is the part's validity dates and it is copied with `clone#Order`; it reuses P7's line editor, pricing and print. Every order reader that leaves out `OrpRecurringTemplate` leaves this purpose out too (F7). Design-sales §5, §17 SAL-TEMPLATE and §18 changed, §19 item 2 moved to §18 |
| Nov 11, 2026 | A Sales approval decision extends the existing OrderDecision (P9); no decision record on Purchasing's pattern is added | The user's call. It follows the rules Purchasing's approvals proved (revision binding, supersession, separation); OrderDecision has no service using it today (F14) |
| Nov 11, 2026 | A high-value quote acceptance needs PASS sign-in as an invited contact above a SalesDefaults threshold per currency, which is unset by default (P9, P13) | The user's call, as recommended (design §19 item 3). The one-time code to a verified email is later (§7) |
| Nov 11, 2026 | A quote is issued only where the seller's `PartyAcctgPreference.salesCommercialRevisionOnly` is on; SalesDefaults sets it and readiness names it. No `get#OrderCommercialSnapshot` is built | F9: X2's flag is built and off by default; an issue bound to a counter that a stored PDF moves would end itself |
| Nov 11, 2026 | The seller's SalesPolicy approval setting is respected globally: where it is on, no sales order of that seller is auto-approved on a payment authorization, whichever app placed it; it waits for a holder of `SALES_ORDER_APPROVE`. The rule is in `autoApprove#Order` and in the sales direction of `approve#Order` (P11). A pre-approval warning blocks auto-approval, as built (`autoApprove#Order` refuses on any warning of `check#OrderPreApprove`), and Sales' own warnings do so too, as Accounting's credit warning and Purchasing's approval warning do (P9). Only with the setting on, when approval is always manual and no auto-approval is left to block, are the warnings shown in the UI only: they tell the person approving and do not refuse that approval. With the setting off, its default, and no Sales rule set, Mantle behaves as today | The user's call. Shop's checkout and renewals, Commerce's orders and Marketing's ticket order (impl-marketing P17) are existing or later callers whose behaviour changes only for a seller with the setting on or a Sales rule set, as owner contracts with their specs passing unchanged otherwise (F52). The user corrected this row's first wording the same day, which had the warnings on a screen only in every case: the setting is added to the plan's earlier choice, in which an unresolved Sales approval stops auto-approval as a `check#OrderPreApprove` warning, and does not replace it (F11) |
| Nov 11, 2026 | The storeless confirmation sends Customer Service's stored confirmation as placed through the delivery ledger; no second confirmation document | F15, F16 |
| Nov 11, 2026 | The pipeline dataset and its document and feed are Mantle's (`mantle-sales-pipeline`), beside its sales datasets; the dashboard, alert templates and digest are mr-boss `report/` files | The plan's choice: the records and the row filter are Mantle's, and Mantle stands without BOSS; design §8 says "beside Mantle's" |
| Nov 11, 2026 | The projected address book "My accounts" (SAL-SYNC) is built in P5; design §15 names no stage for it | The plan's choice: it needs P3's account scope and nothing later; F29 |
| Nov 11, 2026 | The `SalesOrder` external-access kind gains QuoteView and QuoteRespond and a page per scope; a quote's link opens the organization's Sales mount from P13. OrderView's page goes by the order's store from P17, when Sales' order page exists: a storeless order's link opens the Sales mount, a store order's keeps Shop's page | F17, F42, F48; design §10.1 holds, Shop's contract unchanged |
| Nov 11, 2026 | `Shared/Subscriptions` replaces Commerce's own list, Commerce's route kept as its mount | F23; design §7's "mount Commerce's Subscriptions list"; owner contract with Commerce |
| Nov 11, 2026 | The Sales privacy provider (design §12.2) waits for Admin's PrivacyServices, which is later; the purge of unverified lead intakes is built in P5 | impl-admin §7; §7 here |
| Nov 11, 2026 | The regression budgets may be raised by this plan's estimates as its phases land, each raise by the phase's measured share: about 50 s on mr-mantle, 20 s on mr-boss's server budget, 7 s on its client budget and a second or two on mr-pass's. A raise beyond an estimate needs the user's agreement again. No spec may pass 15 seconds, as before. The phase order of §1 stands as written | The user's call (AGENTS.md: a budget is raised only with the user's agreement). The estimate: about twenty-four Mantle specs, seventeen BOSS specs, one client walk and one mr-pass spec, at the earlier apps' measure (about two seconds a Mantle spec: Purchasing's seventeen 32.5 s, Customer Service's fifteen 34.2 s; about 20 s server and 5 to 7 s client in mr-boss). Today's budgets are mr-boss 264 s server and 57 s client, mr-mantle 393 s and mr-pass 20 s and 9 s (F37, F51), before People's and Maintenance's shares. A phase that would pass an estimate cuts a duplicate or moves a scenario to acceptance |

## 5. Open questions

Each has the plan's recommended answer; the phases are written to it.

| Question | Decides | Notes |
| --- | --- | --- |
| Q2. Storeless freight (design §19 item 1) | P7 | Recommend the design's answer: an explicit shipping-charge line the rep enters, taxed by the X1 path; a carrier rate without a store waits for a Warehouse rating service (§7) |
| Q4. Commissions, now that People is built before Sales | §7 or a phase after gate 3 | Recommend it stays later: it is a `later` row whose other gate, the calculation and earning-basis rules (design §19 item 4), is open. When taken it is a phase of its own over People's PayrollInputSource type `SalesCommission` and Accounting's payable intake |
| Q5. Do the customer and supplier AgreementDetail screens share form definitions (design §19 item 5, X13)? | P15 | Recommend not now: Purchasing's screen is built around releases, caps and approved revisions (F19); Sales builds `Shared/AgreementDetail` for customer agreements, and the two share Mantle's status flow and records. Sharing forms is a later refactor of both |
| Q7. Does a native recurring base stay an Approved order, as the worker asks today? | P16 | Recommend yes, marked `OrpRecurringTemplate` so every exclusion holds (F7, F22), since Shop's bases already work so; the phase confirms no reader counts an approved base |
| Q9. The public lead form before Marketing is built | §7 | Recommend none: `store#LeadIntake` is built in P5 with the mail and Comms sources; the one public lead page is Marketing's, built by its plan. Design §14.3 scenario 13's form part is Marketing's acceptance test |
| Q10. (answered Nov 11, §4) Who may run an app's own import? | P6; impl-people P7 and P13, impl-maintenance P18, impl-marketing P4 | A holder of the app's own import permission, here `SALES_IMPORT`, with the app's permissions its target names. Nothing is open |
| Q11. Preventive maintenance of customer-owned equipment under a service agreement (design-maintenance §15, R-MNT-F01) | §7 | Not this plan's to answer: it is later and Maintenance's to design, after P15's AgreementDetail, and the question is impl-maintenance §5 Q8. Design-sales has no screen or need for it, and its billing is the later ContractSchedules |
| Further issues discovered during implementation | the affected phase | Record findings and decisions here |

## 6. Findings

Design assumptions found wrong or unstated in the code, with the resolution. Where a resolution changes the design, it
is written there too; an edit a finding calls for in a shared file is named for its owner. F1–F42 were found on Nov
11, 2026, while writing this plan, and F43–F51 in its review the same day. Paths without a component are mr-boss's;
Mantle's start `mr-mantle/`.

| # | Finding | Resolution |
| --- | --- | --- |
| F1 | P0: `screen/Sales/` has seven flat placeholders and Reports; the root mounts only Chatter and RecordFiles (Sales.xml:36-37) and has no `<shell-providers>`. Its comment says the grant is commented out (Sales.xml:15-17); in fact `BOSS_SALES` (data/BossSetupData.xml:130-137) gives `ADMIN` and `BOSS_SALES_ADMIN` `AUTHZT_ALWAYS` on the root with `MANTLE_ACTIVE_ORG`, and the app is in the menu (MoquiConf.xml:53). There is no root user group or other Sales group | P1 |
| F2 | P0: the two Reports screens were ported in the first port (Sales/Reports.xml:15-16) and built by no plan. SalesSummary calls four Mantle summaries (Reports/SalesSummary.xml:25-38) that refuse a user without `ACCOUNTING_VIEW` (mr-mantle service/mantle/sales/SalesReportServices.xml:18-20), so `BOSS_SALES_ADMIN` is refused it (impl-accounting §5's open question). SalesAnalysis reads `OrderItemSalesSummary` directly (Reports/SalesAnalysis.xml:37) and its four transitions name routes that do not exist (:18-21). `test/Sales/SalesReports.spec.js` is one html render of it, added Nov 10 with a decimal fix (cc80139d). Accounting P16 built `run#SalesAnalysis` and its own screen. Remaining-Work's row that no spec renders Sales/Reports is stale | P1 (the read permission, the dead links), P19 (rebuilt); Remaining-Work's row for its owner |
| F3 | P0: Insights registered Sales' rows ahead of Sales: the entry `Sales.SalesAnalysis` routed to `Accounting/Reports/SalesAnalysis` and read through Accounting's catalogue (data/BossSetupData.xml:3594-3601), the metrics `Sales.Orders` and `Sales.OrderValue` (:3741-3766) where design §8 says `orders.placed`, and the dataset classes of Mantle's sales datasets with Sales as domain owner (:4783-4784) | P19 moves the entry; design §8 changed to the built IDs |
| F4 | P0: SalesOpportunity (mr-mantle entity/SalesEntities.xml:29-52) has no status, organization, pipeline, lost reason, probability mode or recurring fields, and audits only amount, probability and stage; SalesOpportunityStage (:64-69) has four fields. No SalesOpportunityType, stage or outcome is seeded: SalesData.xml seeds only the unused LeadStatus (:19-24) and the LEAD_SOURCE DataSourceType values (:27-41), and no DataSource row. `service/mantle/sales/` holds AccountServices and the report services only | P1 (the organization), P2, P4, as designed |
| F5 | P0: the four account services are `authenticate="false"` and take no organization (mr-mantle service/mantle/sales/AccountServices.xml:16, 43, 72, 93) | P3, as design §4 says |
| F6 | P0: the roles Prospect, Account, Contact, SalesRepresentative and Competitor exist (mr-mantle entity/PartyEntities.xml:604-650), and the relationships PrtContact and PrtSalesAffiliate (:551, :560); there is no sales team role | P2 seeds SalesTeam |
| F7 | P0: `OrderHeader.orderPurposeEnumId` was built by Shop P7 with the one value `OrpRecurringTemplate` (mr-mantle entity/ShopSubscriptionEntities.xml:10-21, which leaves Sales' values to Sales); the exclusions read that ID in credit (service/mantle/account/Credit.js:53-59), reservation (product/AssetServices.xml:686-687, 756-757), invoicing (account/InvoiceServices.xml:1038-1039), the sales summaries (sales/SalesReportServices.xml:118-119, 477-478), store worklists (order/StoreOperations.js:337-345) and store mail (order/OrderInfoServices.xml:1421) | P7 seeds `OrpSalesQuote` and `OrpSalesOrder` (§4); design changed |
| F8 | P0: X1 is not built. `calculate#OrderSalesTax` finds its gateway through the store alone and logs when there is none (mr-mantle service/mantle/other/TaxServices.xml:94-98); `handle#OrderMajorChange` runs promotions, shipping and tax only with a store (order/OrderServices.xml:2779); `send#OrderStoreEmail` returns without one (order/OrderInfoServices.xml:1424). The fallback to reuse is `SalesTax.js` `gateway()` (:192) | P7 (tax), P11 (confirmation) |
| F9 | P0: X2 is built: `increment#OrderRevision` counts only commercial changes for a sales order whose seller sets `PartyAcctgPreference.salesCommercialRevisionOnly` (mr-mantle service/mantle/order/OrderServices.xml:2935-2967; entity/Order.eecas.xml:26-38), off by default; Customer Service's proposals bind it | §4: an issue needs the flag on (P10); design changed |
| F10 | P0: the quote transitions exist: Begin Changes, Place from Quote and Cancel Quote from OrderProposed (mr-mantle entity/OrderEntities.xml:198-200) | P10, as X3 says |
| F11 | P0: X4 is built in part. The hold types carry their release permissions (mr-mantle entity/OrderHoldEntities.xml:44-59; data/MantleSetupData.xml:76-81; data/ShopCheckoutSetupData.xml:10). `approve#Order` goes by direction for a purchase part only: a sales part needs `ORDER_APPROVE` (order/OrderServices.xml:1229-1240), and it calls the credit check itself (:1263), not `check#OrderPreApprove`. `SALES_ORDER_APPROVE` is named nowhere in code | P9 (Sales' warnings on `check#OrderPreApprove`, which block auto-approval and, with the seller's approval setting on, are shown to the approver only), P11 (the sales direction and the rule in `autoApprove#Order`, §4, F52); crosscut §1.4's X4 text for its owner |
| F12 | P0: `hold#Order` and `release#OrderHold` check neither organization nor direction (impl-customer-service F78); order status writes that bypass `approve#Order` skip the credit check (impl-accounting §5), and the baseline's ApproveOrdersForm is such a write (mr-marble Order/FindOrder.xml:137) | P11: the checks, and OrderBatch through `approve#Order` |
| F13 | P0: Customer Service P10 built `mantle.order.OrderChangeServices` with the commercial kinds marked `owner`: filed, decided under `SALES_APPROVE`, never applied (mr-mantle service/mantle/order/OrderChangeServices.xml:15-23; OrderChanges.js:33, 63-69, 185; entity/SupportOrderChangeEntities.xml:101-116). Neither `SALES_APPROVE` nor `SALES_ORDER_CHANGE` is seeded, and no BOSS group holds them (impl-customer-service F158). Shared/OrderChangeDetail answers "not available" to every root but Customer Service's (screen/Shared/OrderChangeDetail.xml:15-18) | P1 seeds and grants them; P14 |
| F14 | P0: OrderDecision and OrderDecisionReason exist (mr-mantle entity/OrderEntities.xml:319-342: order, decision date, party, status, amount) and no service uses them; Purchasing built its own policy and decision records (entity/PurchaseApprovalEntities.xml:22, :91) | P9, §4: OrderDecision is extended |
| F15 | P0: Customer Service P3 built the order confirmation as placed, a PDF stored once and resent from a mail draft, under `SUPPORT_CASE_EDIT` or `ORDER_APPROVE` (mr-mantle service/mantle/order/OrderConfirmationServices.xml:15-23, :53-108), stored at placement when the organization's `orderConfirmationOnPlace` is on (service/OrderReturn.secas.xml:27) | P11's `send#OrderConfirmation` sends that document (§4) |
| F16 | P0: the delivery ledger is built (mr-mantle entity/MessageDeliveryEntities.xml:3-30; service/mantle/party/MessageServices.xml:6-109); a source is a `MessageDeliverySource` enumeration whose `enumCode` is its build service (data/CartRecoverySetupData.xml:14) | P10, P11 register Sales' sources |
| F17 | P0: ExternalAccess as built (mr-mantle service/mantle/party/ExternalAccess.js): the `SalesOrder` kind has the scopes OrderView, Download and RenewalAction, is issued under `SUPPORT_CASE_EDIT`, opens Shop's page on the order's store's site, and resolves no Open, Requested or Proposed order (:143-160); the self relationship exists (:278, :329); the app kinds are billing, supplier and support (:405-410), and an invitation admits a person only for an app that says so (:415-417) | P13 (§4); design starting point changed |
| F18 | P0: a PASS app registers in the authority's `PublicApps.js` (mr-mantle service/mantle/public/PublicApps.js:8-38: target, readiness, account card), PASS's `Apps.js` (mr-pass service/pass/Apps.js:8-18), Pass.xml, the header, the schema and route lists with Mantle's copies, and the test runtime (mr-pass docs/Deployment.md:392-402). Its pages are a screen, an `.html.fancy` template and a script (mr-pass screen/Support/), not XML forms as design §2's Impl column reads | P13, P17 |
| F19 | P0: Purchasing P13 seeded the agreement statuses and transitions (mr-mantle entity/PurchaseAgreementEntities.xml:102-117), audit-logged the agreement's key fields and added its revision (:27-41) and item dates (:43-53), with purchase-only services and expiry job (service/mantle/party/PurchaseAgreementServices.xml:22-220; data/PurchaseAgreementSetupData.xml:20). AgreementParty has no dates (entity/PartyEntities.xml:1078-1085); Agreement has `organizationPartyId` (:969) and no filter row. Purchasing's AgreementDetail is its own screen (screen/Purchasing/Agreements/AgreementDetail.xml), not shared | P1 (filter), P15; design starting point changed |
| F20 | P0: the price resolver matches a row's agreement by ID and ranks it (mr-mantle service/mantle/product/PriceResolver.js:167-168, 223-230, 412-413) without reading the agreement's status or dates; the obsolete TODOs are still in PriceServices.xml (:186-187) | P15's guard, as design §7 allows |
| F21 | P0: of the shared price screens only PriceExplain has app branches (Purchasing's and Customer Service's); Products and Commerce mount Prices and PriceLists through Products' context | P15 adds the Sales rows (impl-products §7); P0 reads the context service |
| F22 | P0: recurrence is `recurCronExpression`, `lastOrderedDate` and `recurAutoInvoice` (mr-mantle entity/OrderEntities.xml:98-100), with no zone, start, end or pause; `update#OrderRecur` still carries its TODO on base sources (service/mantle/order/OrderServices.xml:2551-2585). The worker takes Approved bases (:2591), dispatches a Shop-linked base to Shop (:2597-2604) and clones the rest with `clone#Order`'s default, which copies payments (:2426, :2643) | P16, §5 Q7 |
| F23 | P0: Commerce's Subscriptions is its own screen over `find#StoreSubscriptions`, which needs `COMMERCE_ORDER_VIEW` and the store scope (screen/Commerce/Customers/Subscriptions.xml:15-20); a storeless Subscription is not in it, and it is not under Shared | P16 (§4); design-commerce §6 for its owner |
| F24 | P0: the registries as built. Settings and readiness rows are `ironstone.admin.SettingsEntry` and `ReadinessProvider` (data/BossSetupData.xml:2569-2575; since Nov 11, 2026 the framework's `moqui.server` entities, impl-admin §9); capability bundles `moqui.security.CapabilityBundle`, from which Sales was left out as unbuilt (:2665-2672); a lifecycle participant names a lookup and a transfer service (:4060-4064); an import target is a `moqui.server.TransferTarget`, in rows mode with `validateRowService`, `applyRowService` and `scopeService` (mr-mantle data/PartyInvitationData.xml:48-61; framework entity/ServerEntities.xml:690), not a preview and apply pair; an owner's route is a key of Admin's table (service/ironstone/admin/Data.js:15-24; now `mountRoutes` in service/ironstone/admin/Admin.js); attention providers, flow targets, dataset classes and admissions are rows too (:3863-3868, :4545-4548, :4783-4790, :3280-3283) | P1, P2, P6, P11, P19; design §3 changed; design-admin §11.1's Sales row for its owner |
| F25 | P0: the client deny pattern names the app packages and `sales` is not among them (data/BossSetupData.xml:438-462); its rows were split in Admin P1 to stay under 255 characters. Its two longest are 237 and 233 characters: `people` takes them to 244 and 240, `maintenance` to 256 and 252, `sales` the second to 258 | P1 adds `sales`, after People's and Maintenance's. Maintenance's P1 splits both long rows as it adds its name (impl-maintenance P1, its F50), so Sales splits a row only if it would pass 255, and none should: the longest is then 244 with `sales` and 254 with `marketing` |
| F26 | P0: there is no Commons approvals screen; Purchasing mounts the Commons Notifications list with its topics (screen/Purchasing/Approvals.xml:15-26). `SalesQuoteApproval` is seeded nowhere, though design §1.3 said Commons §4 seeds it; `OrderChangeApproval` is Mantle's (mr-mantle data/MantleSetupData.xml:750) and BOSS links it to Customer Service's OrderChangeDetail (data/BossSetupData.xml:1884-1887) | P9 seeds the topic in Mantle; P0 and P14 settle the link; design §1.3 changed; design-drawers-commons §4 and crosscut §3.15 for their owner |
| F27 | P0: mail rules run an app action by an EmailRuleAction enumeration whose `optionValue` is its service (framework entity/BasicEntities.xml:1189; mr-mantle data/MantleSetupData.xml:462-467) | P5, P8, as designed |
| F28 | P0: `record-lookup` and `create-from` are registered by Comms alone (screen/Comms.xml:56-58), `call-context` by Comms, Customer Service and Commerce (screen/Comms.xml:63; screen/CustomerService.xml:68; screen/Commerce.xml:56). The `contact-card` element, which design §1.4 calls planned, is in the schema (framework xsd/xml-screen-3.xsd:571, :608); no BOSS screen registers one | P5; P0 checks that Comms reads it |
| F29 | P0: `get#DavCollections` lists the user's contact books only (mr-mantle service/mantle/party/ContactDavServices.xml:85-103); there is no projected collection | P5 adds the provider (§4) |
| F30 | P0: `merge#Parties` checks only the internal-organization role and private contacts (mr-mantle service/mantle/party/DuplicateServices.xml:773-793) and no permission, organization or party kind. It now moves UserAccount (:947), PartyConsent (:1015) and Shop's records (:1052-1067), which design §4 lists as left behind, but not ExternalAccessContact, agreements or an opportunity's account and parties. Commons' Duplicates and Compare are built (screen/Commons/Contacts/) | P3 |
| F31 | P0: `RqtQuote`, `RqtWarranty` and `RqtOrderChange` are seeded; RequestTriageNotice leaves out only `RqtPurchaseRfq` (mr-mantle entity/Request.eecas.xml:19-23), so an RqtQuote is queued for triage | P8; P0 for the other rules |
| F32 | P0: skills are `skill/*.md` with `screens:` in their front matter (skill/case-reply.md:1-8); tool exposures are `moqui.agent.AgentToolExposure` rows (data/BossSetupData.xml:2544, :3177) | P6, P10 |
| F33 | P0: Mantle ships `mantle-sales-orders`, `mantle-sales-items`, the `mantle-sales` dashboard and one alert (mr-mantle report/). A BOSS dataset is a DataDocument and feed (data/BossCustomerServiceReportData.xml:17), a `report/` file, its artifact grants (data/BossSetupData.xml:3200, :3270) and its admission; an alert template and a digest are `report/` files of type alert and report (report/boss-service-sla-breach.json:3; report/insights-weekly-digest.json:3-6) | P6, P19 (§4) |
| F34 | P0: no shared screen has a Sales context. OrderDetail has Projects', Accounting's, Warehouse's, Manufacturing's, Purchasing's, Customer Service's and Commerce's, each in its own template (screen/Shared/OrderDetail.xml:15-53); Customer360 has Accounting's, Customer Service's and Commerce's (screen/Shared/Customer360.xml:15-28); InvoiceDetail, ShipmentDetail, RequestDetail, WorkItemDetail, Product360 and InventoryAvailability none for Sales | P3, P4, P7, P8, P11, P14 |
| F35 | P0: nothing of Marketing's that the design names exists: `service/mantle/marketing/` holds ContactListServices only, FormPublication has no lead purpose (mr-mantle entity/FormPublicationEntities.xml:58-59), and there is no attribution SECA | §7: Marketing's plan |
| F36 | P0: a posting operation is keyed by its operation key with the user (mr-mantle entity/AssetBookEntities.xml:57-70) and carries no capability or customer identity | P13 |
| F37 | P0: the regression budgets are mr-boss's 264 s server and 57 s client, mr-mantle's 393 s, mr-pass's 20 s and 9 s, the framework's 12 s and 6 s | §4: the user approved raises up to the plan's estimates |
| F38 | P0: the baseline duplicates form is `Party/EditParty/FindDuplicates.xml` (mr-marble, :34), not `Party/FindDuplicates` as design §4 and §14.2 cite | Design §4 changed |
| F39 | P0: the palette's record link gives none for a sales order (impl-purchasing F46) or an opportunity (service/ironstone/commons/PaletteServices.xml:28) | P4, P7 |
| F40 | P0: Customer Service records the chargeable repair's estimate and consent on the warranty decision and left its sales quote to Sales (impl-customer-service §4, §7) | P8 |
| F41 | Withdrawn in review: Mantle's `mantle-sales` dashboard already leaves out recurring base orders, in its three panels (mr-mantle report/mantle-sales.json:44-46, :93-95, :150-152; impl-insights F61, done in mr-mantle c7f2e989) | Nothing to build; P19's line removed |
| F42 | P0: design §2 gives every PASS page the roles "E signed in" or "scoped bearer"; the built `SalesOrder` OrderView link of a store order opens Shop's order page (F17), so one order has one public page by its store, not two | P13, P17 (§4) |
| F43 | P0 (review): four permissions design §1.1 gives Sales groups are checked by built services, so granting them changes behavior at once. Filing a commercial order change notifies every `SALES_APPROVE` holder of the organization (mr-mantle service/mantle/order/OrderChangeServices.xml:34-38) with a link to Customer Service's OrderChangeDetail (data/BossSetupData.xml:1884-1888), which answers "not available" under any other root (F13); `SALES_ORDER_CHANGE` lets its holder place a Change hold (service/mantle/order/PurchaseOrders.js:455-470); `ORDER_APPROVE` approves any sales part (F11) and `ORDER_CHANGE_HOLD_RELEASE` releases a Change hold (entity/OrderHoldEntities.xml:48-49) | §4: each granted by the phase that builds its Sales screens (P9, P11, P14); P9 lists and decides the change notices a Sales approver gets before P14 |
| F44 | P0 (review): a transfer target's `importPermission` names permissions that are all required (framework service/org/moqui/admin/DataTransferBatch.js:82, :493; DataTransferImports.js:39, :86), so "`SALES_OPPORTUNITY_EDIT` with Admin's transfer permission" would refuse a Sales user who is not Admin's data operator. Shared/DataImport's mount knows Admin and the catalog apps and refuses any other root (service/ironstone/shared/DataImport.js:5-9, :36-44), and an owner's place is a key of Admin's table (service/ironstone/admin/Data.js:15-24) | §4: the target names `SALES_IMPORT` with Sales' permissions and no Admin permission. P6 adds Sales' mount branch and owner route as owner contracts with Admin |
| F45 | P0 (review): `merge#Parties` has three callers: Commons' merge, which admits only a contact administrator at the BOSS layer (service/ironstone/commons/ContactServices.xml:57, :1105), the link of a personal contact to a directory party (mr-mantle service/mantle/party/ContactBookServices.xml:1094) and the bulk merge of `DuplicateServices` (:766). Design §1.1 names no merge permission, and a Sales manager holds no `CONTACT_ADMIN` | §4: the Mantle guard admits a contact administrator or a Sales manager or administrator for an account of their organization; P3 keeps the three callers and their specs |
| F46 | P0 (review): design §15 puts "commercial changes, fulfillment/finance handoffs" in S3 and names the Orders list and the sales-order context in no stage; S2's gate asks staff and PASS acceptance and X4 approval, which need them. So Orders in S2 is the plan's one addition to a stage, and ShipmentDetail and InvoiceDetail in S3 is the design's own order | §4; P11 lists shipments and invoices without links until P14 |
| F47 | P0 (review): impl-marketing §1 expects of Sales `store#LeadIntake` with a campaign, tracking code, UTM source and medium, team queue and operation key, `find#Opportunities` filtered by campaign and source, placement through one order status change, and the screens `Sales/Leads`, `Sales/Accounts` and `Sales/Settings/LeadSources` mounted by a second root. The design's paths are `Sales/Pipeline/Leads` and `Sales/Accounts/Accounts` (design §2), and this plan named the inputs and the mounting only in §7. impl-marketing F30 says X1's storeless order tax is built; it is not (F8: `calculate#OrderSalesTax` reads the store alone, mr-mantle service/mantle/other/TaxServices.xml:94-98; the fallback of `SalesTax.js`, :192-197, serves an invoice's tax and the rate sample, :245, :324, not an order's) | P2, P3, P4, P5 and §2 name each under the design's paths; Marketing's ticket order rests on P7's X1; impl-marketing §1, P3, P13, P17 and its F30 were corrected in the reconciliation |
| F48 | P0 (review): P13 sent a storeless order's OrderView link to the Sales mount, where no order page exists until P17 | §4: quote scopes get the Sales page in P13; OrderView's page goes by the order's store from P17, and P11's confirmation carries no order link until then |
| F49 | P0 (review): the framework reads `user-facts` providers from `llm-facade` (crates/moqui-llm/src/conf.rs:654, :799), not at conf.rs:538 as P0 cited; no component's MoquiConf registers one | P0's check stands: the active-organization provider is a prerequisite of P6's skills |
| F50 | P0 (review): the other two earlier plans. impl-people provides what Sales uses (`find#Employees` and `Shared/Employee360` in its P2, the access-end entry in its P7) and its §7 lists both with the phases here that use them (P2, P6), and the commission input and customer retainers as later. impl-maintenance §7 leaves three links to this plan: the chargeable repair's quote (P8, Customer Service's handoff, F40); customer-equipment maintenance under a service agreement, an open item of design-maintenance §15 that design-sales does not have; and supplier warranty terms as an Agreement "when Sales has adopted the shared agreement states", which is a purchase-direction agreement on statuses Purchasing already seeded (F19) | §1, §7; the question on customer-equipment maintenance is impl-maintenance §5 Q8 (§5 Q11 points to it); both plans' §7 were reconciled with this one |
| F51 | P0 (review): the plan's spec count and cost were low. It names about twenty-four new Mantle specs, not sixteen, and a Mantle spec of this kind is not "well under a second": Purchasing's seventeen measured 32.5 s and Customer Service's fifteen 34.2 s (mr-mantle test/budget), with 20.3 s and 18.2 s server in mr-boss (test/budget) | §4: the estimate the user approved is the corrected one |
| F52 | Nov 11 (the user's answer on order approval): every automatic approval goes through `mantle.order.OrderServices.autoApprove#Order` (mr-mantle service/mantle/order/OrderServices.xml:1495-1539), which approves a Placed order whose authorized, delivered or confirmed payments cover its total, with no `check#OrderPreApprove` warning and no earlier approval. Its callers: `authorize#OrderPayments` (service/mantle/account/PaymentServices.xml:1689-1691), run on placement by the SECA `OrderPlacedAuthorizePayments` (service/AccountingPayment.secas.xml:17-20); the SECA `OrderPlacedAutoApprove` (service/OrderReturn.secas.xml:50-59) for a store with no approval delay; the job `autoApprove#OrdersDelayed` (OrderServices.xml:1463-1494); and the credit hold's release (service/mantle/account/Credit.js:305-306). Shop's and Commerce's store orders are approved by this path, and nothing in it reads a seller's policy | P11: the seller's approval setting is checked in `autoApprove#Order`, so all four callers meet it; off by default, so Shop's and Commerce's specs pass unchanged; P9's warnings join those of the check it already refuses on (§4) |

## 7. Later

Designed, not in this build:

- **The design's later rows** (§2, §11): ContractSchedules and amendments (with customer retainers and prepaid hours,
  which impl-people §7 leaves here), Commissions (§5 Q4; its `SalesCommission` PayrollInputSource type is this
  plan's to add over People's payroll input when taken, impl-people §7), Territories, AssignmentRules,
  LeadIntakeForms, QuoteExtraction, QuoteConfiguration, ManufacturingEstimate and Rentals, each behind its named
  gate; the lead response target, activity plans and the partner channel (SAL-R05–R07); the generic pivot and graph
  of SAL-ANALYTICS.
- **What Marketing's plan builds over what Sales exposes** (§4; impl-marketing P3, P5, P11, P13, P15, P17 and P20 pick
  each up, and this plan builds none of them): the lead rules, the capture job and the public lead page
  (PASS:Marketing/SubmitForm, the FormPublication purpose lead) calling `store#LeadIntake`; the
  `OrderPlacedRecordAttribution` SECA and campaign attribution of orders and opportunities; Marketing's mounts of Leads
  and LeadSources; the bulk "Add to list (evidenced)" action on LeadList and AccountList, with AccountList's row
  selection; Marketing's vocabulary as the choices of UtmSourceMap's source and medium, and its campaigns and tracking
  codes as the choices on a lead; ContactDetail's Consent link pointed at Marketing's Consent mount; segments over
  Sales' records; Sales' reports citing Marketing's visit and attribution metrics; the funnel's visit step. Sales
  exposes for them, under these names: `mantle.sales.OpportunityServices.store#LeadIntake` with the inputs of P5 and
  SalesLeadIntake; the lead-source map and `store#LeadSourceMapping`; `find#Opportunities` filtered by source and
  campaign (P4) with SalesOpportunity's `marketingCampaignId` and SalesOpportunityTracking kept; `Sales/Pipeline/Leads`,
  `Sales/Accounts/Accounts` and `Sales/Settings/LeadSources` built for a second mount, LeadList and AccountList taking a
  bulk action (§2); every placement through `mantle.order.OrderServices.place#Order` (§2); X1's storeless order tax
  (P7), on which Marketing's ticket order rests (its P17); the seller's approval setting in `autoApprove#Order`
  (P11) and the pre-approval warnings it refuses on (P9), which that ticket order meets, its registration and
  ticket following the approval (its P17); consent read only on ContactDetail.
- **What waits on Admin and Insights:** the Sales privacy provider with Admin's PrivacyServices (design §12.2); the
  audit reader's projections of Sales' fields with Admin P17 (P0); the funnel with Insights' later funnel.
- **Links to Maintenance** (F50; impl-maintenance §7 says the same): the chargeable repair's sales quote is built
  here (P8), from Customer Service's warranty decision. Preventive maintenance of customer-owned equipment under a
  service agreement (design-maintenance R-MNT-F01) is later and Maintenance's to design, after P15's AgreementDetail
  (impl-maintenance §5 Q8; §5 Q11). Supplier warranty terms as an Agreement linked to an asset are not Sales' to
  pick up: the agreement is in the purchase direction, on statuses Purchasing seeded (F19), so it is Maintenance's
  or Purchasing's later work and waits on nothing here.
- **Other owners' later work found here:** a carrier rate lookup without a store (Warehouse; §5 Q2); a project from
  an order line and agreements and opportunities on a project's Money tab (impl-projects §7); Shop's quote from a
  cart (impl-shop §7); the account and contact maps of design §4 with the framework's Maps work; Commons' record
  tags for deal tags (design §19 item 9).
- **Design §19:** the one-time code for high-value acceptance (§4), reorder from the PASS order page and a public
  RFQ form (items 6, 10), lead scoring (item 7), customer blanket orders (item 8), call summaries, a booking link and
  co-authored proposal text (item 10).

## 8. Verification

- **Per phase,** the "Done" rule of §2.
- **End to end,** run `./moq run`, sign in as each demo Sales user, and walk each built phase's "usable when" in
  order; open a quote's link in a private browser window.
- **Design §14.3 scenarios,** each an acceptance test (`./moq accept mr-boss`, `./moq accept mr-pass`, when asked):

| Scenario | Phase |
| --- | --- |
| 1 Lead to qualified deal, one record | P4 |
| 2 Stage moves, probability, outcome | P4; P10 (an accepted quote suggests Won) |
| 3 Team membership and agreeing access | P2, P4; P20's access walk |
| 4 Customer and agreement prices, storeless tax and confirmation | P7 (price, tax), P15 (agreement), P11 (confirmation, invoice) |
| 5 Template, override approval | P12, P9 |
| 6 Send, partial failure, bound revision | P10 |
| 7 Acceptance through PASS and staff | P10 (staff), P13 (PASS), P11 (awaiting approval) |
| 8 Bearer and signed-in isolation, local and remote | P13, P17 |
| 9 Partial fulfillment and a commercial change | P14 |
| 10 Agreement lifecycle and recurrence | P15, P16 |
| 11 Forecast reconciliation | P18 |
| 12 The whole walk with minimal grants, phone and terminal | P20 |
| 13 Lead intake from a form, mail and a voicemail | P5 (mail, voicemail); the form with Marketing (§7) |

- **Walks.** One golden-path client walk for Sales in the regression suite (SalesPipelineWalk, from P4); the others
  are acceptance tests. No screenshots.
