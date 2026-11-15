Nov 14, 2026 — gate 3 built: P14–P20 (stage S3), commercial changes and the handoffs, agreements and customer prices with their
print, recurring orders, PASS Sales' orders, forecasts and targets, reports with Insights' registrations and the quote dataset, and
the RFQ acknowledgement, each phase reviewed by a fresh agent and merged on its focused specs, with follow-up 2 (recurring orders'
invoicing, every line and retax), beside Marketing. The user's calls of the build are in §4. Sales' first release; the full suites
and the acceptance tests run once at the end of the build.
Nov 14, 2026 — gate 2 built: P7–P13 (stage S2), quote to order with public acceptance on PASS, each phase reviewed by a fresh agent
and merged on its focused specs, beside Marketing P1–P6. The user's calls of the build are in §4. Next: stage S3 (P14 beside P15, P16,
P17, P18, P19, P20).
Nov 13, 2026 — gate 1 built: P1–P6 (stage S1), a working CRM, each phase reviewed by a fresh agent and merged on its focused
specs, with follow-up 1 (a new record's organization defaults to the user's own across the apps, F111) and the basic-comms
Mail actions slot (P5). The user's calls of the build are in §4 (Nov 13). Next: Marketing's track starts beside Sales (P7 on).
# IronStone BOSS — Sales implementation

Nov 13, 2026 — P0 done: the checks left after the plan's review, F53–F73 (§6), against the code as People, Maintenance,
Admin P17–P19, Insights P11–P12, Admin's "screens down" and the runtime/components/{base,addon,dev,test} layout left it.
Sales' setup goes in its own `data/BossSetupSalesData.xml`, as Maintenance's did (F55); TeamMembers' lookup needs People's
`PEOPLE_DIRECTORY_VIEW` for the manager and administrator (F53); the lifecycle participant answers Admin's disable, not
People's access-end request, under a new `SALES_OWNER_CHANGE` (F54); OrderChangeApproval opens by recipient through
Commons' `openRecord` (F58); the report entry gets Sales' catalogue and Accounting's mount an entry of its own (F59);
X1 changes no built order or spec today (F62); the Comms hooks follow what Comms renders, and P5 makes basic-comms' Mail
render `message-actions` for a mail message's "Create lead" and "Create RFQ" (F64, the user's call); P6 builds Mantle's active-organization user-facts provider (F65) and the funnel's dashboard with a
Sales-scoped row filter (F66); P7 adds Sales' catalogue context (F67); template text renders from a stored location with
an explicit map (F70); ORG_ZIZI_SALES is the second demo organization and the storeless seller (F72). P1–P11, P14 and
P19 changed in place; P12, P13 and P15–P18 take the contracts as found. §5 Q2, Q5 and Q7 answered
as recommended; Q12 (Projects' estimate approval under the approval setting) is open for P11. Build order and the suites'
runs in §4: Sales P1–P6 first, then Marketing as a second track; at most three phase workers at once.
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
  records. A phase of a side-by-side pair that appends to the same file as the other (BossSetupSalesData.xml,
  BossUsersDemoData.xml, Sales.xml's `shell-providers`) rebases on it before merging. Marketing's track runs beside
  Sales' from P7 (§4).

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
| P0 Checks | all (read) | — | done Nov 13 (§6 F1–F73) |
| P1 Foundation | Mantle, BOSS | the Sales root and menu, Home's frame, Reports' two ported screens | built and reviewed Nov 13, merged |
| P2 Pipeline setup | Mantle, BOSS | Settings, Stages, Teams, LeadSources, TypesAndReasons | built and reviewed Nov 13, merged |
| P3 Accounts and contacts | Mantle, BOSS | Accounts, Contacts, Customer360, ContactDetail, MergeAccounts | built and reviewed Nov 13, merged |
| P4 Leads and opportunities | Mantle, BOSS | Opportunities, Leads, OpportunityDetail, WorkItemDetail | built and reviewed Nov 13, merged |
| P5 Lead intake, Comms hooks and account sync | mr-moqui, Mantle, BOSS | Leads' intake rows; the Comms actions | built and reviewed Nov 13, merged |
| P6 Home, shell, Assist and the pipeline dataset | Mantle, BOSS | Home, QuickCreate; the import mount | built and reviewed Nov 13, merged |
| P7 Quote drafts, pricing and storeless tax | Mantle, BOSS | Quotes, OrderDetail (quote), Product360, InventoryAvailability, PriceExplain | built and reviewed Nov 13, merged |
| P8 Requests for quote | Mantle, BOSS | QuoteRequests, QuoteRequestDetail | built and reviewed Nov 13, merged |
| P9 Sales defaults, approval policies and approvals | Mantle, BOSS | SalesDefaults, ApprovalPolicies, Approvals | built and reviewed Nov 13, merged |
| P10 Issue, send and the customer's response | Mantle, BOSS | OrderDetail's Issues and responses; QuoteBatch | built and reviewed Nov 14, merged |
| P11 Orders, approval and the storeless confirmation | Mantle, BOSS | Orders, OrderDetail (order) | built and reviewed Nov 14, merged |
| P12 Quote templates | Mantle, BOSS | QuoteTemplates, QuoteTemplateDetail | built and reviewed Nov 14, merged |
| P13 PASS Sales: quotes | Mantle, PASS, BOSS | PASS CustomerQuotes, CustomerQuote, QuoteResponse; Invite to Sales | built and reviewed Nov 14, merged |
| P14 Commercial changes and handoffs | Mantle, BOSS | OrderChanges, OrderChangeDetail, ShipmentDetail, InvoiceDetail | built and reviewed Nov 14, merged |
| P15 Agreements and customer prices | Mantle, BOSS | Agreements, AgreementDetail, CustomerPrices, PriceLists, PriceListDetail | built and reviewed Nov 14, merged |
| P16 Recurring orders and subscriptions | Mantle, BOSS | RecurringOrders, Subscriptions | built and reviewed Nov 14, merged |
| P17 PASS Sales: orders | Mantle, PASS | PASS CustomerOrders, CustomerOrder | built and reviewed Nov 14, merged |
| P18 Forecast and targets | Mantle, BOSS | Forecast, Targets, TargetAttainment | built and reviewed Nov 14, merged |
| P19 Reports and Insights registrations | Mantle, BOSS | Reports, SalesSummary, SalesAnalysis, PipelineAnalysis, WinLoss | built and reviewed Nov 14, merged |
| P20 Finish | all | the sweeps and the review walk (acceptance) | built and reviewed Nov 14, merged |

### P0 — Checks

Verify the design's riskiest assumptions against the code before building. Each result is a row in §6 and, where it
changes the design, an edit there. F1–F42 were found on Nov 11 while writing this plan and F43–F51 in its review; the
edits they call for in design-sales were made then. The checks below were done Nov 13, 2026 (F53–F73), against the
code as People, Maintenance, Admin P17–P19 and Insights P11–P12 left it; the design edits they call for were made the
same day. Redo the Admin P17 check only if Admin registers a business entity's projection (F57).

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
    `SALES_RECURRENCE_MANAGE`, `SALES_FORECAST_EDIT`, `SALES_REPORT_VIEW`, `SALES_CUSTOMER_INVITE`, `SALES_IMPORT`,
    `SALES_CONFIGURE` and `SALES_OWNER_CHANGE` (the lifecycle transfer, no Sales group's; P6, F54). `SALES_APPROVE` and `SALES_ORDER_CHANGE` are the two OrderChangeServices already checks
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
- **Access** (design §1.1), on Commerce's pattern (BossSetupData.xml:1903-1924), in a setup file of Sales' own,
  `data/BossSetupSalesData.xml`, as Maintenance's is (F55): `BOSS_SALES` as the root user group
  beside the artifact group of that name, and `_REP`, `_MANAGER`, `_APPROVE`, `_CHANGE`, `_AGREEMENT` and `_READ`;
  `BOSS_SALES_ADMIN` keeps its row. The ordinary groups' authz on the root with `MANTLE_USER_ORG` and
  `MANTLE_PRIVATE_CONTACT`; the `ironstone\.sales\..*` service pattern on the artifact group; `sales` added to each
  of the fifteen rows of the client deny pattern (BossSetupData.xml:461-487, :4093), none split: the longest is then
  244 characters (F25, F55). An area only some groups see (Quotes' Approvals, Orders' Changes, Agreements, Reports,
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
- **Demo data.** BossUsersDemoData gains, after Maintenance's users, `sales.rep` and `sales.rep2` (two teams of
  ORG_ZIZI_RETAIL), `sales.manager`,
  `sales.approver`, `sales.change`, `sales.agreement`, `sales.reader` and `sales.admin`, none in `ADMIN`; a rep of
  the second demo organization, ORG_ZIZI_SALES (F72), only; and a manager who works for both.
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

**Built Nov 13 (P1).** mr-mantle and mr-boss on branch `sal/p1` (hashes in the worker's reply); mr-moqui unchanged, no Rust
built.
- Checked first (the code over the plan): F1 (the root grant live for `ADMIN` and `BOSS_SALES_ADMIN`, ALWAYS with
  `MANTLE_ACTIVE_ORG`; the root's comment said otherwise), F2 (SalesSummary's four summaries refused without `ACCOUNTING_VIEW`;
  SalesAnalysis reading `OrderItemSalesSummary` with four dead links), F25 and F55 (the fifteen deny rows, the longest 238), F43
  and F54, Maintenance P1's Built and Review notes (the root's panel restriction R2, the area gates of F346) and its root,
  Maintenance.js and MaintenanceAccess.js as the pattern; `SalesAnalysis.js organizations` (the store-scoped path of Commerce
  P11) as the place of the reader rule. The code over the plan: the plan names no Mantle scope module for P1, but the report
  reader's organizations and the app's context both need the user's sales organizations, so P1 builds
  `mantle/sales/SalesAccess.js`, which P3 and P4 extend with the account and assignment scope.
- Mantle:
  - `data/MantleSetupData.xml`: the nineteen `SALES_*` permissions of design §1.1 with `SALES_OWNER_CHANGE`, each granted to
    `ADMIN`; the filter rows `MANTLE_USER_ORG_SOPP`, `_SFC`, `_AGR` and their `MANTLE_ACTIVE_ORG_*` twins (SalesOpportunity,
    SalesForecast and Agreement by `organizationPartyId`).
  - `entity/SalesEntities.xml`: `SalesOpportunity.organizationPartyId`, audit-logged, with its Organization relationship.
  - `service/mantle/sales/SalesAccess.js` (no service; tables `permissions` and `reads` for later phases): `capabilities()`
    (each permission; the reads `anyRead` of `SALES_VIEW`, `SALES_TEAM_VIEW` or `SALES_REPORT_VIEW`, `teamRead`, `reportRead`;
    an edit permission alone reads nothing), `scope()` (the caller's own organizations, the active one when it is theirs; every
    one for a system administrator only; none without a read), `covers`, `requireCapability`, `requireOrganization`
    (`ORGANIZATION_DENIED`) and `reportOrganizations` (named ones in the scope, else the scope's; `costWithheld` without
    `PRODUCT_COST_VIEW`).
  - `SalesAnalysis.js organizations`: a holder of `SALES_REPORT_VIEW` without report read, not answered as a store-scoped
    reader, is answered through `reportOrganizations`; `get#InvoicesByCustomerClass` now withholds its costs as the other three
    do (it had no store path, so no answer it gave changes); the four descriptions say so. `ACCOUNTING_VIEW`'s and
    `COMMERCE_VIEW`'s answers are unchanged.
- BOSS:
  - `data/BossSetupSalesData.xml` (new, F55): the root user group `BOSS_SALES` and `_REP`, `_MANAGER`, `_APPROVE`, `_CHANGE`,
    `_AGREEMENT`, `_READ`; on the `BOSS_SALES` artifact group (a second element) the `ironstone\.sales\..*` pattern and
    `BOSS_SALES_ROOT` (ALLOW, `MANTLE_USER_ORG`, `MANTLE_PRIVATE_CONTACT`); `BOSS_SAL_REPORTS` (Reports denied to the root user
    group, ALWAYS for the manager and the reader); design §1.1's grants but the four of F43 (`BOSS_SALES` `SALES_VIEW`, the
    approver `SALES_ORDER_APPROVE`, the change operator nothing more until P14; the manager's `SALES_IMPORT`), the
    administrator's (below); `SALES_OWNER_CHANGE` to `BOSS_ADMIN_IDENTITY` alone, in its bundle; eight capability bundles
    (1500-1570, the launcher's artifact with the root's filter sets). `data/BossSetupData.xml`: `sales` in all fifteen deny rows
    (the longest 244, none split), the registry comment and the `BOSS_SALES` group's comment.
  - `ironstone.sales.ContextServices` (`get#SharedContext`, `check#Record`, `get#Choices`, `search#Records`) over
    `service/ironstone/sales/Sales.js` (tables `mountRoots`, `areas`, `recordKinds`, `choiceSources`, `searchFinds`,
    `linkPaths`): the root grant read from the user's own groups (as Maintenance.js); a root other than `Sales` refused
    (`SALES_CONTEXT`; Marketing's joins `mountRoots` with P4); record kind organization; choices organizations; no palette source
    yet; capability `reports` (the area's grant and `SALES_REPORT_VIEW`, F346's lesson) and `reportCosts` (report read or
    `PRODUCT_COST_VIEW`, borrowed). `template/SalesParts.xml` holds `choices`.
  - Screens: the root (`get#SharedContext` in always-actions; the Chatter and RecordFiles panels of Sales' own record hosts only,
    none yet, Maintenance R2's restriction; `<shell-providers>` with the `sales` keymap, `g s`; the stale comment replaced, F1;
    Reports' `menu-include` `SALES_REPORT_VIEW`); Home's frame (HomeFilters with the organization checked by `check#Record`;
    SalesWork's five counters, AssignedWork and MyPipeline Not configured; the report reader's Sales summary shortcut; a user who
    reads nothing told so). The six placeholders removed. Reports: SalesSummary as ported over the guarded summaries, its cost
    columns, chart series and panel left out where the services withhold costs (`reportCosts`), its margin no longer 100 % on a
    withheld cost; SalesAnalysis keeps its route, loses its four dead transitions and links (names shown instead) and hides its
    cost and margin columns without `reportCosts`; menu titles in sentence case.
  - Demo: BossUsersDemoData's `sales.rep`, `.rep2`, `.manager`, `.approver`, `.change`, `.agreement`, `.reader` (agents of
    Retail), `sales.rep3` (ORG_ZIZI_SALES only), `sales.manager2` (both, a manager) and `sales.admin` (both,
    `BOSS_SALES_ADMIN` alone), each in `BOSS_USERS`, none in `ADMIN`.
- Specs:
  - Mantle `test/sales/SalesOrganizationScope` (3 features, 0.3 s): an ordinary grant (`MANTLE_USER_ORG`) finds its
    organization's opportunity, forecast and agreement only; an administrator's (`MANTLE_ACTIVE_ORG`) every organization's,
    then the active one's; SalesAccess's reader organizations, refusal of another's and an edit permission reading none.
    `SalesReports` gains one feature (0.3 s): a `SALES_REPORT_VIEW` reader's four summaries of their organization equal to a
    report reader's naming it, costs null, another organization `ORGANIZATION_DENIED`, a user with neither `ACCESS_DENIED`.
  - mr-boss `test/Sales/SalesSpecLib.js` (ids, users, `asUser`, `system`, `refusal`, `invoke`, `page`, `screenRefusal`, `hit`,
    `shell`); `SalesAccess` (7 features, 2.7 s feature time, the slowest 1.0 s): the context and its refusals; the menu, keys and
    launcher per group; each group's capabilities exactly (a custom group with the root grant and `SALES_OPPORTUNITY_EDIT` alone
    reading no organization, record or choice, and told so on Home); Retail's and Ziziwork Sales' representatives refused each
    other's organization with the same parameters, a capability named refused; the services refused without the root grant and
    a write verb of the package denied a client and admitted for a representative; Home's one qvt render, SalesSummary's one
    html render (the reader's, no cost column), Reports refused a representative, a Party's panel refused under the root; the
    bundles exactly their groups' grants, `SALES_IMPORT` the manager's and administrator's, `SALES_OWNER_CHANGE` the identity
    operator's alone. `SalesReports` (SalesAnalysis's one html render, ADMIN's, with the margin columns) unchanged in substance.
  - Acceptance, written and not run: `test/acceptance/Sales/SalesFoundationWalk` (4 features: each group's menu with each entry
    opened or refused; `sales.reader`'s SalesSummary for Retail and the refusal for Ziziwork Sales; `admin.access` granting the
    representative and launcher bundles to a custom team whose member opens Sales as a representative; a client and a PASS
    account refused the root and every `ironstone.sales` service, a representative not).
- Tests run (release binary, `--nobuild`, this worktree's runtime): mr-mantle SalesOrganizationScope, SalesReports and
  SalesReportStoreScope 11 of 11; PurchaseAgreements, SupportWarranty, Sourcing, ContentRecords, ProductPriceLists, OrderChanges,
  CalcGridSales, StaffIdentity, InternalOrganizations, RecordVisibility and AccountingStatements 73 of 73 (the filter rows and
  the seeded permissions). mr-boss SalesAccess and SalesReports 8 of 8; ProjectsAccess (the deny rows), AppOrganizationFilters,
  AdminCapabilities, AdminRegistries, AdminAccess, AdminLifecycle, AdminUsers, AdminOrganizations, AdminGroups, PeopleAccess,
  MaintenanceAccess, InsightsAccess, CommerceAccess, ManufacturingAccess, PurchasingAgreements, PurchasingAccess,
  CustomerServiceAccess and CustomerServiceWarranty with them: 170 of 170, before the cost columns change, which only Sales'
  specs read. `moqui lint --screens` (release binary): 141 flagged sites, as the main checkout, none in the Sales screens.
  Prettier clean on the new JavaScript (SalesAnalysis.js and SalesReports.spec.js were not clean before and are left so). Not
  run: ./moq test-apps, the acceptance suite.
- Inventories: ss-inventory's SalesSummary and SalesAnalysis rows and usl-inventory's four summaries name the Sales paths as
  ported; `run#SalesAnalysis` stays P19's.
- Design edits: design-sales §1.1 (as built: the scope module, the grants, the administrator, Reports, the panels) and §3 Home
  (the frame as built); design-accounting §16.2's report adapters (owner contract: the Sales reader, the answer to
  impl-accounting §5's question).
- Findings, numbered by the lead F74 to F78 in order:
  - `BOSS_SALES_ADMIN`'s grants are not in design §1.1 ("SALES_CONFIGURE plus explicit Sales view/edit capabilities"): P1 gives
    it `SALES_CONFIGURE` with the views and edits of the manager and the agreement keeper (`SALES_IMPORT` and
    `SALES_CUSTOMER_INVITE` among them) and no `SALES_ORDER_APPROVE`, `SALES_APPROVE`, `SALES_ORDER_CHANGE` or
    `SALES_OWNER_CHANGE`; Maintenance's administrator got every app permission by the user's call (impl-maintenance P1 review);
  - Sales has no all-organizations permission: the administrator's root carries `MANTLE_ACTIVE_ORG`, so its entity reads see every
    organization with none active, but SalesAccess and the services answer its own organizations only (the demo administrator
    works both); Maintenance added `MAINTENANCE_ALL_ORGANIZATIONS` by the user's call for the same gap;
  - SalesAnalysis as ported still reads `OrderItemSalesSummary` itself, with the cost in its select, under the reader's
    organization filter and no service check; P1 hides its cost and margin columns for a reader without cost rights, and P19's
    rebuild over `run#SalesAnalysis` closes the read;
  - SalesSummary's Vendors, Stores and Customers drop-downs are the ported ones (`searchPartyList`, an unscoped store list under
    the root's filter), not Sales' `choices`; P19 replaces them;
  - `BOSS_SALES_CHANGE` holds only `BOSS_SALES`' view until P14 grants its two permissions (F43), so its bundle carries none and a
    change operator's Sales is Home alone.
- For the lead:
  - budget share: mr-mantle about 0.6 s (SalesOrganizationScope 0.3 s, SalesReports' new feature 0.3 s); mr-boss server about
    2.7 s (SalesAccess); no client spec;
  - merge hot spots: mr-boss `data/BossSetupData.xml` (all fifteen deny rows; the registry comment near Admin P3's bundles; the
    `BOSS_SALES` group's comment), `data/BossUsersDemoData.xml` (appended), `data/BossSetupSalesData.xml` (new; P2 and later
    append), `screen/Sales.xml`, `plan/design-sales.md` §1.1 and §3, `plan/design-accounting.md` §16.2, the inventories' Sales
    rows; mr-mantle `data/MantleSetupData.xml` (the permissions after the warranty rows, the filter sets),
    `entity/SalesEntities.xml`, `service/mantle/sales/SalesAnalysis.js` and `SalesReportServices.xml`;
  - the user's calls: the administrator's grants and whether Sales gets an all-organizations permission (the first two
    findings); built meanwhile as above. impl-accounting §5's Sales row is answered by this phase and can be closed there.

**Review Nov 13 (P1).** A fresh review of `sal/p1` (mr-mantle 1d7e2093, mr-boss 469cda25) against P1, §2, §4 and design §1.1,
§1.2, §3 and §8.
- Checked and sound: the twenty `SALES_*` permissions each granted to `ADMIN`; the X12 rows (`SOPP`, `SFC`, `AGR` in both sets) on the
  pattern of their sets' other organization rows, Agreement's demo and service-created rows all carrying `organizationPartyId`
  (Purchasing's, Customer Service's, the price agreements), `AgreementAndTerm` aliasing it, no PASS root under `MANTLE_USER_ORG`;
  `SalesOpportunity.organizationPartyId` audited with its relationship; SalesAccess.js (capabilities from permissions only through
  `access.has`, so a Projects client holds none; an edit alone reads nothing; the own organizations as Maintenance's; refusals by
  reason code; `reportOrganizations` `_NA_` for an empty scope) as the module P3 and P4 extend; SalesAnalysis.js's new reader branch
  (after the store-scoped one, so a Commerce reader naming stores is answered as before, and `ACCOUNTING_VIEW` unchanged; costs
  withheld on the four summaries, every cost field: total, percent, the invoice summary's moving average); Sales.js (root grant read
  from the user's own rows, a root other than Sales refused, Reports needing its grant and `reportRead`, `reportCosts` borrowed,
  record and choice refusals one answer); the root's record-panel restriction (no host yet); the fifteen client deny rows (all name
  `sales`, the longest 244, the read verbs `get`, `check` and `search` of ContextServices outside them); the groups, the area deny,
  the grants without the four of F43, `SALES_OWNER_CHANGE` to the identity group alone as §4 says; the eight bundles equal to their
  grants; the demo users; Home's frame (Not configured, never zero); SalesSummary's cost columns, series and panel left out with
  `reportCosts`, and its margin null on a withheld cost.
- Fixed:
  - R1 (confidentiality, medium). SalesAnalysis as ported hid its cost and margin columns but its find still took `totalCost` from
    the request: `totalCost_from` (a having condition on the aggregate) let a reader without cost rights test each line's hidden
    cost, and `orderByField=totalCost` ranked the lines by it. The find now skips `totalCost` (`skip-fields`; no header filters on
    it), and a reader without `reportCosts` is not sorted by it. Checked that the qvt data and the csv export carry no cost value.
    SalesReports' new csv feature (the administrator, no cost rights, searching and sorting by cost) fails without the change.
  - R2 (confidentiality, low). `get#SalesTopProduct` and `get#InvoicesByCustomerClass` took an `orderByField` naming the cost
    (`productCostTotal`), ranking the top products or classes by a cost they withhold, for the Sales reader as for Commerce's store
    reader before it; a reader whose costs are withheld is now ordered by the default. No spec: the test runtime's summaries gave
    the same order either way, so a check would not fail without the change.
  - R3 (the user's call (b), Nov 13). `SALES_ALL_ORGANIZATIONS`, seeded in MantleSetupData and granted to `ADMIN`, and in
    BossSetupSalesData to `BOSS_SALES_ADMIN` alone, in its bundle (CpkEdit, as Maintenance's): SalesAccess's `scope()` makes the
    organizations every one for a system administrator or a holder, which reads nothing by itself (capability `allOrganizations`).
    Before it the administrator's root read every organization through `MANTLE_ACTIVE_ORG` while the services answered its own
    (SalesAnalysis listed Accounting's demo company's and Ziziwork Services' lines to `sales.admin`); they now agree.
    SalesOrganizationScope: a holder of A alone reads B, the permission alone nothing; SalesAccess: the administrator's context is
    every organization and its record check admits Accounting's demo company, which the representative is refused, the manager of
    both organizations is not every organization's, and the capability list carries `allOrganizations` for ADMIN and the
    administrator only. (a) kept as built. Both are §4 rows and in design §1.1.
- Findings, numbered by the lead F79 to F81 in order:
  - the ported SalesAnalysis still shows a non-cost reader "Total Cost" in its sort choices (they now sort by nothing) and its Show SQL
    dialog; P19's rebuild over `run#SalesAnalysis` removes both;
  - `SALES_OWNER_CHANGE` goes to `BOSS_ADMIN_IDENTITY` only, where every other owner change (drive, mail, calendar, contact book,
    report, People's approvals) is also `BOSS_ADMIN_ADMIN`'s; §4's row says "Admin's identity group alone", so it is kept; P6 may ask
    whether the Admin administrator should hold it too;
  - SalesSummary's top products and customer classes are called without the chosen vendors (as ported), so they answer the whole
    scope while the order and invoice summaries answer the chosen organizations; P19's rebuild.
- Tests run (release binary, `--nobuild`, this worktree's runtime): mr-mantle SalesOrganizationScope 3 of 3 (0.4 s), SalesReports 5
  of 5 (0.6 s), SalesReportStoreScope 3 of 3; mr-boss SalesAccess 7 of 7 (2.9 s), SalesReports 2 of 2 (0.4 s; the new feature
  failed on the unfixed screen), AdminCapabilities 4 of 4. `moqui lint --screens` (release binary): nothing flagged in SalesAnalysis.
  Not run: ./moq test-apps, the acceptance suite.
- For the lead: budget share about +0.1 s mr-boss (SalesReports' csv feature, 0.08 s), mantle unchanged in substance; merge hot spots
  as the Built note, with mr-mantle `data/MantleSetupData.xml` (the new permission after `SALES_OWNER_CHANGE`),
  `SalesReportServices.xml` (two order guards), mr-boss `data/BossSetupSalesData.xml` (the administrator's grant and bundle row),
  `screen/Sales/Reports/SalesAnalysis.xml`, `plan/design-sales.md` §1.1 and the two §4 rows; the user's calls (a) and (b) are
  recorded in §4, and impl-accounting §5's Sales row can be closed as the Built note says.

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
  `mantle.humanres.PeopleServices.find#Employees`' work identity, which it answers only to a People reader (F53), so
  `BOSS_SALES_MANAGER` and `BOSS_SALES_ADMIN` get People's `PEOPLE_DIRECTORY_VIEW` here, as Maintenance's planners have
  it, and a caller without it picks representatives by party; a member who is
  an employee links to `People/Employees/Employee360` for a People user and `Commons/People/Employee360` otherwise,
  for a viewer `get#Employee360` admits, through People.js `employee360Link`; Employee360 has no Sales context row
  and Sales mounts none (impl-people P2 and §7; F53). Mantle's team services read no People record: an organization without People picks members by party.
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

**Built Nov 13 (P2).** mr-mantle and mr-boss on branch `sal/p2` (hashes in the worker's reply); mr-moqui unchanged, no Rust
built.
- Checked first (the code over the plan): P1's Built and Review notes and F74–F81; SalesEntities.xml (SalesOpportunityStage with
  four fields, no status on SalesOpportunity, F4); SalesData.xml (the LEAD_SOURCE types, no DataSource row); the framework's
  DataSource and People's `Enumeration.thruDate`; Maintenance's settings (MaintenanceSettings.js, its Settings screens, its
  readiness row and ALL_USERS grant) and Customer Service's service teams (an owned OrgTeam party, PrtServiceTeam) as the
  patterns; People's UnitEmployers.js and Organization.js (a PrtOrgRollup unit is People's, so a sales team takes no rollup and no
  OrgTeam role); `find#Employees` and People.js `employee360Link` (F53); Admin.js `mountRoutes`. The code over the plan:
  - the retirement rule needs a deal's outcome, which P4 was to add, so P2 adds `SalesOpportunity.statusId` (audit-logged) with
    the outcome seed; P4 builds the lifecycle;
  - a team's "effective interval" and organization are a dated `PrtSalesTeamOf` row (team to organization) beside its
    `ownerPartyId`, and its manager is a `Manager` membership, since PartyRole has no dates;
  - the seeded default pipeline has no organization: it is the instance's shared pipeline, every organization's default until
    it sets its own, changed only by a reader of every organization;
  - the screens read through one more service than the design names, `get#SalesSetup` (the settings with ended rows, open-deal
    counts and edit flags);
  - the seed is split by kind: fixed values in a new `data/SalesCrmSeedData.xml` (type seed, named to load before SalesData.xml,
    which loads by file name), editable initial setup appended to `data/SalesData.xml` (seed-initial);
  - the demo is `data/BossZSalesDemoData.xml`, not `BossSalesDemoData.xml`: its teams name BossUsersDemoData's users, so it loads
    after them, as BossZMaintenanceDemoData does.
- Mantle:
  - `entity/SalesEntities.xml`: SalesPipeline (organization or none, name, description, team, default flag, dates, `thruDate`
    audited); SalesOpportunityStage's `salesPipelineId`, `foldFlag` and dates; SalesLeadSourceBinding (source, organization,
    dates); `SalesOpportunity.statusId`, audited.
  - `data/SalesCrmSeedData.xml` (seed): SalesOpportunityType `SotLead`, `SotOpportunity`; the outcome status type
    `SalesOpportunity` (`SalesOppOpen`, `SalesOppWon`, `SalesOppLost`, with Reopen); the SalesLostReason and SalesRecurringPlan
    types; RoleType `SalesTeam`; PartyRelationshipType `PrtSalesTeamOf`, `PrtSalesTeamMember`; get#SalesReadiness for ALL_USERS
    (it checks itself), as Maintenance's. `data/SalesData.xml` (seed-initial): the shared pipeline `SalesDefault` with Qualified
    (10 %), Discovery (25), Proposal (50) and Negotiation (75); six lost reasons; four recurring plans (enumCode months). LeadStatus
    left as is.
  - `service/mantle/sales/OpportunityServices.xml` (new) over `SalesSettings.js`: `store#Pipeline`, `store#Stage` (move up or down,
    retire with reassignment of open deals, closed deals kept), `store#SalesTeam`, `store#SalesTeamMember` (a person who works for
    the organization, now or later, once at a time, ended never deleted), `store#LeadSource` (new and offered, offer and end per
    organization, rename only within the scope: `SOURCE_SHARED`), `store#LostReason`, `get#SalesOptions` (any reader),
    `get#SalesSetup`. Configuration needs `SALES_CONFIGURE`, teams `SALES_CONFIGURE` or `SALES_TEAM_MANAGE`, each with the
    organization in the caller's scope; another organization's record answers RECORD_UNAVAILABLE; existing rows are written with
    the revision read (REVISION_CHANGED). `service/mantle/sales/SalesWorkspaceServices.xml` (new): `get#SalesReadiness` (default
    pipeline, stages, a staffed team, a source offered; fix routes `salesStages` with the pipeline, `salesTeams`,
    `salesLeadSources`).
  - `SalesAccess.js`, a P2 block: `teamRelationships`, `teamOrganization`, `memberTeams` (a person's current teams, for P4's scope).
- BOSS:
  - `data/BossSetupSalesData.xml`, a P2 block at the end: `BOSS_SAL_SETTINGS` (the root user group denied, the manager ALWAYS);
    `PEOPLE_DIRECTORY_VIEW` for `BOSS_SALES_MANAGER` and `BOSS_SALES_ADMIN`, in their bundles (F53, §4); the readiness provider
    `sales.readiness` and the settings entry `sales.settings` (viewPermission `SALES_CONFIGURE`). Two P1 comments point to it.
  - `service/ironstone/admin/Admin.js` (owner contract): `salesSettings`, `salesStages` (idParameter `salesPipelineId`),
    `salesTeams`, `salesLeadSources`. design-admin §14's Sales row says so.
  - `Sales.js`: the area `settings` (its grant and `SALES_CONFIGURE` or `SALES_TEAM_MANAGE`; `areaReads` takes a function); the
    choices `teams` and `teamMembers` (the organization's agents and employees by party, labelled with their job title from
    `find#Employees` for a holder of `PEOPLE_DIRECTORY_VIEW`); the Settings paths in `sharedLinks`. `get#Choices` and
    SalesParts' `choices` pass `organizationPartyId`.
  - Screens: `Sales.xml`'s Settings item; `Sales/Settings.xml` (the tabs, a manager landing on Teams) with Readiness
    (SalesReadiness), Stages (PipelineDefinition, PipelineStages: Up, Down, Edit, Retire with the stage the open deals move to),
    Teams (SalesTeams, TeamMembers: Add member from a date, End, Employee360 links through `get#Employee360Link`), LeadSources
    (Sources: New, Offer, Stop offering, Rename; links only to itself, reads the mounting root's `sales`) and TypesAndReasons
    (SalesTypes read only, LossReasons: Add, Edit, End).
  - Demo `data/BossZSalesDemoData.xml` (P2 block): Retail East (sales.manager, sales.rep, sales.rep2's membership ended Jul 1),
    Retail West (sales.rep2 from Jul 1, managed by sales.manager2), Ziziwork Sales Direct (sales.rep3, sales.manager2); West's
    pipeline "West key accounts" with four stages; four lead sources, the trade fair offered to Retail alone and the calls to
    Ziziwork Sales alone.
- Specs:
  - Mantle `test/sales/SalesPipelineSetup` (5 features, 1.9 s feature time alone, 6.1 s on a loaded machine): a stage in use
    retired only with a reassignment that moves the open deals and leaves the won one, the move up, a stale revision refused, the
    pipeline's end refused while in use; a membership ended never deleted, a member of another organization and a back-dated one
    refused, the team's end ending the later membership; a source offered to A and not B, the rename refused while it is offered
    to B; the settings refused without `SALES_CONFIGURE`, the shared pipeline and another organization's refused; readiness.
  - mr-boss `test/Sales/SalesSettings` (3 features, 1.1 s alone): the Settings tabs per group, Stages refused a manager, Teams a
    representative and the reader, Admin's index listing `sales.settings` for the administrator only; TeamMembers' lookup;
    Stages' one qvt render and Teams' one html render. `SalesAccess`: the managers', administrator's and ADMIN's menus gain
    Settings, the capability `settings` (`SalesSpecLib` ids `managerMenu`, `settingsMenu`).
  - Acceptance, written and not run: `test/acceptance/Sales/SalesSetupUsable` (3 features: sales.admin adds Pilot to West's
    pipeline, moves it up and retires Trial with its open deal moved, through Stages' transitions; sales.manager adds sales.rep to
    West from next week through Teams' and is refused Stages; Admin's Health names an empty pipeline of Ziziwork Sales with
    `salesStages` and its id, and Admin's settings index shows Sales settings). `SalesFoundationWalk`'s menus updated for
    Settings.
- Tests run (release binary, `--nobuild`, this worktree's runtime): mr-mantle SalesPipelineSetup 5 of 5, SalesOrganizationScope,
  SalesReports, SalesReportStoreScope, PeopleDirectory and InternalOrganizations 20 of 20; mr-boss SalesSettings 3 of 3,
  SalesAccess 7 of 7, SalesReports, AdminRegistries, AdminSettings, AdminCapabilities, PeopleAccess, PeopleAccessLater,
  MaintenanceAccess, ProjectsAccess, AdminAccess and AppOrganizationFilters, all passing. Every Settings screen rendered in qvt
  and html for the administrator without error (a one-off check, not kept). `moqui lint --screens` (release binary): 141 flagged
  sites, as before, none in Sales. Prettier clean on the new and changed JavaScript. Not run: ./moq test-apps, the acceptance
  suite.
- Inventories: no ss-inventory or usl-inventory row names a Sales settings path or these services (the baseline has no pipeline
  setup), so nothing to fill.
- Design edits: design-sales §9 Settings, Stages, Teams, LeadSources and TypesAndReasons (as built); design-admin §14's Sales
  row (owner contract).
- Findings, numbered by the lead F82 to F86 in order:
  - P4 owns the opportunity lifecycle but P2 adds `SalesOpportunity.statusId` for the retirement rule; P4 builds on it (and adds
    the pipeline, lost reason and the other fields of SAL-CRM);
  - the readiness's team and source checks are warnings and the default pipeline always passes while the shared `SalesDefault`
    is in effect, so an organization that never configured Sales reads "ready" there; a stricter rule (an organization's own
    default) would be a later call;
  - TeamMembers' lookup probes `find#Employees`, which logs an ERROR when People's scope refuses the organization (a manager of
    an organization People does not cover for them); the labels fall back to names, but the log is noise;
  - a lead source offered to an organization outside the administrator's scope cannot be renamed by them (`SOURCE_SHARED`), so a
    source shared by two organizations is renamed only by an administrator of both (the demo's `sales.admin`);
  - LeadSources reads `sales` from its mounting root, but `Sales.js mountRoots` holds only Sales until P4 adds Marketing's root,
    so Marketing's mount (impl-marketing P13) needs that row too.
- For the lead:
  - budget share: mr-mantle about 2 s (SalesPipelineSetup); mr-boss server about 1.2 s (SalesSettings 1.1 s, SalesAccess's
    menu cases unchanged in time); no client spec;
  - merge hot spots (P3 is built beside this): mr-mantle `entity/SalesEntities.xml` (SalesOpportunity's `statusId`, the new
    entities after SalesOpportunityStage), `service/mantle/sales/SalesAccess.js` (a P2 block before the export and the export
    object), `service/mantle/sales/SalesWorkspaceServices.xml` (new here, P3 adds `find#Accounts` and `get#CustomerSales` to the
    same new file: an add/add merge), `data/SalesData.xml` (appended); mr-boss `data/BossSetupSalesData.xml` (a P2 block at the
    end and two P1 comments), `data/BossZSalesDemoData.xml` (new, a P2 block; P3's customers may want the same file),
    `service/ironstone/sales/Sales.js` (areas, areaReads, linkPaths, choiceSources with a P2 block, the scope's area loop),
    `service/ironstone/sales/ContextServices.xml` (get#Choices' parameter), `template/SalesParts.xml`, `screen/Sales.xml` (the
    Settings item), `service/ironstone/admin/Admin.js`, `test/Sales/SalesSpecLib.js` and `SalesAccess.spec.js` (menus,
    capabilities), `test/acceptance/Sales/SalesFoundationWalk.spec.js`, `plan/design-sales.md` §9, `plan/design-admin.md` §14;
    MantleSetupData and BossUsersDemoData are not touched;
  - nothing needs the user's call; the findings above are for the review.

**Review Nov 13 (P2).** A fresh review of `sal/p2` (mr-mantle 16a62cbf, mr-boss 868d3c7b) against P2, §2, §4 and design §9.
- Checked and sound: every settings verb checks its permission (SALES_CONFIGURE; teams SALES_CONFIGURE or SALES_TEAM_MANAGE) and
  the organization before reading the record, and another organization's pipeline, stage, team or membership answers
  RECORD_UNAVAILABLE as a missing one; revisions on every write of an existing row (pipeline, stage, team, membership, source,
  reason); store#Stage's retirement (the revision first, the open deals those not Won or Lost or with no outcome, the target a
  current stage of the same pipeline, each deal moved through update# so its stage is audit-logged, closed deals kept, a move
  returning before any retirement) and store#Pipeline's end refused while open deals sit on its stages; the shared pipeline
  changed only by a caller of every organization (a reader with no organization has `[]`, not null, so is refused too);
  store#LeadSource across organizations (a new source and a bind or unbind for an organization of the caller's, a rename or
  type change only when the caller covers every current binding, SOURCE_SHARED; the list names an organization outside the
  scope only as "other organizations"); team membership dated, never deleted, from a person with an agent or employee
  relationship in effect to the team's own organization, never back-dated, once at a time, ended with the team; the team
  choices and TeamMembers' lookup bounded by the Sales scope (the lookup also by configure or teamManage); get#SalesReadiness
  granted to ALL_USERS but refusing a caller without SALES_CONFIGURE and an organization outside the scope, and without an
  organization answering only the caller's own internal organizations that use Sales (Admin's provider row also requires
  SALES_CONFIGURE); the Settings tabs (each tab's menu-include and always-actions agree: Readiness, Stages, Sources and Types
  and reasons SALES_CONFIGURE, Teams also SALES_TEAM_MANAGE; BOSS_SAL_SETTINGS denies the root user group and opens to the
  manager; the transitions run behind the same always-actions; a manager lands on Teams); the load order: the loader sorts a
  component's data files by name (moqui-entity `load_feed/locations.rs`), so `SalesCrmSeedData.xml` (seed: the
  SalesLostReason and SalesRecurringPlan types, the outcomes) loads before `SalesData.xml` (seed-initial: the shared pipeline,
  then its stages, the reasons and plans), whichever types a load takes, and `BossZSalesDemoData.xml` after
  `BossUsersDemoData.xml` (the reps' PrtAgent rows that the memberships assume); the demo's source types are LEAD_SOURCE's
  children. The specs test what they claim.
- Fixed:
  - R1 (confidentiality, medium). get#SalesSetup counted each stage's open deals over every organization, so on the shared
    pipeline's stages (every organization's deals) an administrator of A read B's open-deal counts on Stages. A caller of fewer
    than every organization now has the shared pipeline's stages counted for the organization read; its own pipelines and an
    every-organization caller's counts are unchanged (they match STAGE_IN_USE). SalesPipelineSetup's readiness feature: B's open
    deal on `SalesQualified` counted 1 for B's reader and 0 for A's (failed on the unfixed code, 1).
  - R2 (scope, low). store#SalesTeamMember checked the team's end only at the time of the call, so a membership could start
    after a team's scheduled end (or before a later team's start) and stay open with no end: SalesAccess `memberTeams`, which
    P4's team scope reads, reads memberships alone, so it would have kept a person on an ended team. A membership now starts at
    the team's start at the earliest, is refused from the team's end on (DATE_INVALID), and ends by the team's scheduled end.
    SalesPipelineSetup's team feature: a team ending in two days refuses a member from day three and ends a member joining now
    with it (the refusal failed on the unfixed code).
  - R3 (noise, low; the Built note's finding). TeamMembers' lookup called People's find#Employees for any holder of
    PEOPLE_DIRECTORY_VIEW, and the refused call for an organization People's scope does not reach was logged as a service ERROR
    (as the spec runs show for every refused call). Sales.js now asks People.js `scopeOf` first and calls it only for an
    organization of that scope; the labels are unchanged where it is. No spec: the demo has no Sales manager whose People scope
    differs from their Sales scope.
- Findings, numbered by the lead F87 to F90 in order:
  - lost reasons are the instance's, yet any SALES_CONFIGURE holder of one organization renames,
    reorders and ends them for every organization; the shared pipeline needs every organization's scope for the same kind of
    change. Whether store#LostReason should too (or reasons become per organization) is the user's call; kept as built, as
    design §9 says "the reasons are the instance's";
  - every configurer reads every lead source's name (get#SalesSetup lists the instance's sources, up to 500) and may offer any
    of them to an organization of theirs, and DUPLICATE_VALUE on a new name confirms another organization's source; the design
    makes sources shared, so kept; a source with no current binding (all ended) is renamed by any configurer;
  - store#SalesTeamMember's "works for the organization" is checked at the time of the call, not at the membership's start, so a
    person whose agency starts next month cannot be added from then, and an employment's end does not end the membership;
  - a new pipeline with a future fromDate and the default flag clears the organization's current default at once, leaving the
    shared one in effect until it starts.
- Tests run (release binary, `--nobuild`, this worktree's runtime): mr-mantle SalesPipelineSetup 5 of 5 (2.3 s feature time, from
  1.9 s; on the unfixed SalesSettings.js the two new checks failed); mr-boss SalesSettings 3 of 3 (1.8 s), SalesAccess 7 of 7
  (4.5 s). No screen changed, so no lint. Prettier clean on the changed JavaScript. Not run: ./moq test-apps, the acceptance
  suite.
- For the lead: budget share about +0.4 s mr-mantle (SalesPipelineSetup's added checks), mr-boss unchanged; merge hot spots as
  the Built note, with mr-mantle `service/mantle/sales/SalesSettings.js` (openOnStage, stageView, salesSetup,
  storeSalesTeamMember) and mr-boss `service/ironstone/sales/Sales.js` (teamMembers and `peopleCovers` before `salesSettings`);
  the user's call: whether a change of the instance's lost reasons needs every organization's scope.

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
  (Customer360.xml:20-28), with Sales added to the four conditions that make Accounting's the default (F68); the
  Sales context of the Commons contact record (crosscut §3.1): ContactDetail includes template/ContactRecord.xml's
  section and transitions behind a Sales gate service, as Customer Service's ContactDetail does, and Contacts is
  Sales' own list (F68); Commons Duplicates
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

**Built Nov 13 (P3).** mr-mantle and mr-boss on branch `sal/p3` (hashes in the worker's reply); mr-moqui unchanged, no Rust built.
P2 was built beside it on `sal/p2` (§1), so P3 reads no pipeline, team or source record.
- Checked first (the code over the plan): F5 (the four account services `authenticate="false"`, no organization; their callers
  CrmMiscServices, `mantle.rest.xml`'s two resources and mr-marble's EditParty), F30 and F45 (`merge#Parties` as found; its callers
  are more than three: Commons' merge, `link#PersonalContactToDirectory`, the bulk merge, and Shop's verified guest claim
  `ShopCustomer.js`, which calls it with authorization disabled, with seven Mantle specs calling it directly), F68 (Customer
  Service's ContactDetail and Customer360 branch as the pattern; the Accounting tabs' `appRoot != 'CustomerService'`
  conditions), Customer Service's `customerOf` (a customer is owned by one of the user's organizations or shared, `_NA_`), and P1's
  SalesAccess.js and Sales.js tables. The code over the plan: Mantle has no owner-organization field of an account but
  `Party.ownerPartyId`, which the organization filters already read, and no account-manager relationship, so P3 uses the first
  and adds `PrtAccountManager`; Commons' Duplicates and Compare ask for a contact administrator in the screen (`isInGroup`) and
  answer to `../Duplicates` and `../List`, so they cannot be mounted under Sales, and MergeAccounts is a Sales screen over
  Commons' services; the plan names `find#Accounts` and `get#CustomerSales` only, and Contacts, ContactDetail and Compare
  needed `find#AccountContacts`, `get#AccountDocumentCounts` and `set#AccountManager` too.
- Mantle:
  - `service/mantle/sales/SalesAccess.js` (a P3 block): `accountRoles`, `isInternal`, `visibleParty`, `accountOf` (an Account,
    Customer or Prospect role, not internal, disabled, merged or another user's personal contact, owned by an organization of the
    scope or shared), `requireAccount` (RECORD_UNAVAILABLE), `contactAccounts`, `accountOrganization` (SALES_ACCOUNT_EDIT and an
    internal organization of the scope: the one named, else the active or only one) and `mergesFor` (a Sales manager or
    administrator for an organization of the scope).
  - `service/mantle/sales/SalesAccounts.js` (new) and `AccountServices.xml` (rewritten): `create#Account` (an organization or a
    person, owned by the organization, roles Account and Customer or Prospect, parent of the scope and of the same organization or
    shared, the manager a person who works for it, else the caller), `set#AccountManager` (new; a manager changes it, a
    representative takes an account with none), `create#Contact` (the person owned by the account's organization, role Contact,
    no longer Customer), `add#Contact` (a person the caller may see; idempotent) and `delete#Contact` (ends the relationship of an
    account of the scope); all authenticated, each refusal with its reason code.
  - `SalesWorkspaceServices.xml` (new): `find#Accounts` (scoped and paged in the query over PartyDetailAndRole; role, kind,
    manager, mine, parent; each row's role, owner, managers, first contact and, for SALES_TEAM_VIEW, open orders),
    `find#AccountContacts` (over the new view `mantle.sales.SalesAccountContact`, `entity/SalesAccountViewEntities.xml`),
    `get#CustomerSales` (Customer360's summary; orders for SALES_TEAM_VIEW, invoices for ACCOUNTING_VIEW or RECEIVABLE_VIEW) and
    `get#AccountDocumentCounts` (MergeCompare's opportunity, order and agreement counts, SALES_TEAM_VIEW).
  - `data/SalesAccountData.xml` (new, seed): the `PrtAccountManager` relationship type.
  - `merge#Parties` (owner contract, Commons; `service/mantle/party/PartyMerge.js`, new): the guards of design-drawers-commons §6
    inside the service, after its own not-found and already-merged answers: who (authorization disabled or the system, as Shop's
    claim and the jobs; CONTACT_ADMIN; a personal contact's owner; a Sales manager or administrator for accounts and contacts of
    one organization of their scope) and what (one kind, one owner organization, the merged party's opportunities and agreements
    of that organization only, and a Sales merger's orders of their organizations only); it now moves ExternalAccessContact,
    agreements and AgreementParty, and an opportunity's account and parties. `check#PartyMerge` (new) answers the same without
    failing. `test/party/CrmMiscServices` passes an organization to `create#Account` (the one change to an existing spec).
- BOSS:
  - Commons (owner contract): `ContactServices` `get#ComparePair` offers the merge `check#PartyMerge` admits as Sales and shows the
    guards' refusal as its reason; `merge#Contacts` writes such a merger's field choices through `update#PartyDetail`;
    `mark#NotDuplicate` admits the same merger. Contact administrators' merges are as before but now meet the guards.
  - Shared/Customer360 (owner contract, crosscut §3.2): Sales' always-actions read (`get#CustomerSales`), its conditional default
    tab, Sales added to the four conditions of Accounting's default (F68) and to the seven Accounting tabs' conditions;
    `template/SalesCustomer360.xml` (header, New contact, More, key numbers) and the tabs SalesOverview, SalesContacts, SalesOrders
    and SalesInvoices; Files is shared.
  - Screens: the root's Accounts area (menu index 3, a Sales reader's), `Sales/Accounts/Accounts` (AccountList with its header
    find, NewAccount, NewPerson, Duplicates for a merger; links through `sharedLinks`, a row without Customer360 under the mounting
    root shown unlinked, built for Marketing's mount), Contacts, ContactDetail (the Commons record behind check#Record `contact`,
    with Sales' accounts box), MergeAccounts and MergeCompare; `template/SalesAccounts.xml` (the five account transitions); the
    root's record panels admit a Party that is an account or a contact of the scope; the palette source (accounts) and keys `g a`
    and `g c`.
  - Sales.js (P3 blocks): record kinds `account` and `contact`, choices `accounts`, `managers` and `people`, the accounts palette
    find, the Accounts link paths, capabilities `mergeAccounts` (the area's grant with SALES_ACCOUNT_EDIT and SALES_TEAM_MANAGE or
    SALES_CONFIGURE) and `financeRead`.
  - `data/BossSetupSalesData.xml` (a P3 block): `BOSS_SAL_MERGE` (MergeAccounts and MergeCompare denied to the root user group,
    ALWAYS for the manager). No new permission or bundle row.
  - Demo: `data/BossYSalesAccountsDemoData.xml` (after BossUsersDemoData, apart from P2's BossSalesDemoData): Retail's Wingtip
    Group and its child Wingtip Traders (sales.rep's), Contoso Labs (a prospect, sales.rep2's), Kim Park (an individual customer),
    the duplicate pair Adatum Corporation and Adatum Corp, Dana Morales a contact of Wingtip Traders and Contoso Labs; Ziziwork
    Sales' Fabrikam Industrial (sales.rep3's, with Lee Chen) and Tailspin Outfitters. ("Northwind" was taken by Purchasing's
    supplier pseudo id.)
- Specs:
  - Mantle `test/sales/SalesAccounts` (new, 6 features, 1.3 s): an account created in the caller's organization with its roles and
    manager, refused without the edit permission and in another organization; an anonymous call refused; another organization's
    parent refused, a shared one taken; a contact's relationship ended, the person kept, another organization's representative
    refused; the reads answering the organization's and the shared accounts; a merge across organizations refused for anyone, a
    representative refused, a manager's merge moving an opportunity's account, another organization's dependency refused.
  - mr-boss `test/Sales/SalesAccounts` (new, 4 features, 0.5 s): Customer360's one html render with its Overview (the account,
    manager, parent; no order or invoice counts for a representative), Accounts' one html render (Mine), ContactDetail's one html
    render (a contact of two accounts), MergeAccounts' and MergeCompare's html renders for the manager (Commons' Compare offering
    the merge). `SalesAccess` gains one feature (0.3 s: account and contact record kinds for Retail's and Ziziwork Sales'
    representatives, MergeAccounts a manager's only, the Accounts tabs), the panel cases of an account and another
    organization's, the two capabilities, the menu and keys; SalesSpecLib the demo ids.
  - Acceptance, written and not run: `test/acceptance/Sales/SalesAccountsUsable` (4 features: sales.rep creates an account and a
    contact and finds the shared ACME; Dana Morales under each of her accounts and nothing of the other; sales.manager merges
    Adatum from Compare and the survivor keeps both roles and its details; Invoices only for a finance reader).
- Tests run (release binary, `--nobuild`, this worktree's runtime): mr-mantle SalesAccounts 6 of 6 (1.3 s); CrmMiscServices,
  ContactBooks, Contacts, Consent, ShopCart, ShopCustomer, ShopSubscriptions, ShopOperations, SalesOrganizationScope and
  SalesReports 95 of 95 (the merge callers and P1's). mr-boss SalesAccounts 4 of 4 and SalesAccess 8 of 8 (5.9 s together);
  SalesReports, ContactsDuplicates, Contacts, AccountingCollections, AccountingReceivables, CustomerServiceOrders,
  CustomerServiceReports, CustomerServiceAccess, CustomerServiceWarranty, InsightsRecords, ProjectsAccess, AdminCapabilities,
  AppOrganizationFilters and CommerceAccess with them, 159 of 159. `moqui lint --screens` (release binary): 141 flagged sites, as
  before, none in the new or changed screens. Prettier clean on the new and changed JavaScript. Not run: ./moq test-apps, the
  acceptance suite.
- Inventories: ss-inventory's Customer, Party and FinancialInfo rows with a `Sales/Accounts` path (39) name their Sales form or
  `—` with why; usl-inventory's AccountServices, DuplicateServices rows and an "Added in the Sales build" table.
- Design edits: design-sales §4 "As built"; design-drawers-commons §6 (the merge guards as built, owner contract).
- Findings, numbered by the lead F91 to F97 in order:
  - Shared/Customer360's tab bar lists every app's tabs (Accounting's, Customer Service's, Sales') under each root: a subscreen's
    `<condition>` hides its content, not its menu item (crates/moqui-core/src/screen/menu.rs reads only `disable_when`), so Sales'
    Customer360 shows "Cases", "Credit" and the others empty, as Customer Service's shows Accounting's today; a tab's
    `menu-include` expression or a condition-aware menu is Customer360's owner's or the framework's fix;
  - ContactDetail's identity and channel edits are the Commons record's own (`check#ContactAccess`: a contact administrator or a
    personal contact's owner), so a representative reads a contact's details and cannot edit them, as Customer Service's agents;
    design §4 gives Sales "edit identity and channels": a Sales admission in `check#ContactAccess` (owner contract) or Sales
    forms of its own is the user's call;
  - Customer360's roles and classifications (F71 counted them covered in P3) are not built: an account's Customer or Prospect role
    is set when it is created; no role change, classification or later parent change (ss-inventory names each `—`);
  - AccountList's next activity and active quotes, and Customer360's Activities, wait for P4's activity scope and P7's quotes;
    Customer360's Orders tab is an organization reader's (SALES_TEAM_VIEW) until P11 builds the representative's order scope;
  - the Mantle merge guards admit a caller that disabled authorization (Shop's claim, jobs, every spec that disables it) as before,
    and the contact administrator's merges now meet the kind, owner and dependency rules; the preview step and its stamp of
    design-drawers-commons §6 are not built;
  - the merged party's rows `moveAll` moves are read under the caller's entity filters (as before for orders and invoices), so
    under a filtered root a row of another organization stays with the merged party; the guards refuse the merge when such an
    opportunity or agreement exists, but not for other kinds;
  - `find#Accounts` orders a person after the organizations (a distinct find orders by its selected fields, not a name of either
    kind).
- For the lead:
  - budget share: mr-mantle about 1.3 s (SalesAccounts); mr-boss server about 0.8 s (SalesAccounts 0.5 s, SalesAccess' new feature
    0.3 s); no client spec;
  - merge hot spots (P2 on `sal/p2` touches the same files): mr-boss `data/BossSetupSalesData.xml` (a "Sales P3" block at the end),
    `screen/Sales.xml` (the Accounts subscreens-item, the panel hosts script, the palette source and two keys), `Sales.js`
    (`areas`, capabilities, `linkPaths`, `recordKinds`, `choiceSources`, `searchFinds`, each marked P3),
    `test/Sales/SalesSpecLib.js` (`staffMenu`, `reportMenu`, `keys`, `accountsMenu`, the account ids) and `SalesAccess.spec.js`
    (capability names, the manager's and administrator's grants, the panel cases, one feature); `plan/impl-sales.md` (this note),
    `plan/design-sales.md` §4; mr-mantle `SalesAccess.js` (a P3 block before the module value). New files P2 may also create:
    `service/mantle/sales/SalesWorkspaceServices.xml` (P2's `get#SalesReadiness` goes beside P3's services; an add/add conflict
    to join). Kept apart to avoid conflicts: `data/SalesAccountData.xml` (not SalesData.xml), `entity/SalesAccountViewEntities.xml`
    (not SalesEntities.xml), `data/BossYSalesAccountsDemoData.xml` (not BossSalesDemoData.xml). BossUsersDemoData,
    MantleSetupData and the Sales.js tables' P2 rows are not touched by P3;
  - the user's calls: the contact edit for Sales (the second finding); whether the merge guard's admission of a caller with
    authorization disabled stays (Shop's claim needs it).

**Review Nov 13 (P3).** A fresh review of `sal/p3` (mr-mantle 46246c69, mr-boss 138e34d5) against P3, §2, §4, design §4 and
design-drawers-commons §6, after merging master (P2) into the branch in both repositories (`SalesWorkspaceServices.xml` joined:
P2's get#SalesReadiness, then P3's four services, under one header; the P2 and P3 blocks kept side by side in SalesAccess.js,
Sales.js `areas`, `linkPaths` and `choiceSources`, Sales.xml, BossSetupSalesData.xml, SalesSpecLib.js, where the manager's menu is
now Home, Accounts, Reports, Settings, and SalesAccess.spec.js). P2's and P3's specs passed on the merge unchanged.
- Checked and sound: every account and contact write authenticated and checking SALES_ACCOUNT_EDIT and the organization (named
  and in the scope, else the active or only one; an internal organization), the parent an account of the scope of the same
  organization or shared, the manager a person working for the organization, a contact's end only of an account of the scope
  (RECORD_UNAVAILABLE as missing), the person kept; another organization's account refused as missing on every path: find#Accounts
  and find#AccountContacts (owner in the scope's organizations or `_NA_`, the contact's owner too, in the query), the `accounts`
  and `people` choices and their selected value, the palette (find#Accounts), check#Record's `account` and `contact` kinds, the
  root's Chatter and RecordFiles hosts (a Party only through check#Record `contact`), Customer360 (get#CustomerSales'
  customerFound false; Accounting's tabs and actions kept off under Sales, Sales' tabs only under Sales), ContactDetail and
  get#AccountDocumentCounts; orders only for SALES_TEAM_VIEW and invoices only for a finance reader, both of the scope's
  organizations; MergeAccounts and MergeCompare denied to the root group and open to the manager (BOSS_SAL_MERGE) and the
  capability; Commons' get#ComparePair, merge#Contacts and mark#NotDuplicate admitting a Sales merger only through the Mantle guard
  (`admittedBy` sales), contact administrators' behaviour otherwise as before. The merge callers' specs pass unchanged (Commons'
  Contacts and ContactsDuplicates, Mantle's Contacts, ContactBooks, Consent, ContactAddresses, CrmMiscServices and the four Shop
  specs, the verified guest claim among them). The specs test what they claim.
- Fixed:
  - R1 (data integrity, medium; the Built note's sixth finding). merge#Parties read the rows it moves, and its guards read the
    dependencies they check, under the caller's entity filters: under a Sales or Commons root (MANTLE_USER_ORG) another
    organization's opportunity or agreement on the merged party was invisible to the guard, so the merge went through and left it
    (with any filtered order, invoice, payment or shipment of an organization outside the caller's) on the disabled party. The
    guards now read without the filters (PartyMerge.js `unfiltered`), and the moves run with authorization off after the guards
    pass (try/finally, restored); a Sales merger is refused (DEPENDENCY_UNAVAILABLE) when the merged party has orders, invoices
    or payments with an internal organization outside their scope, not orders alone. Mantle SalesAccounts' new feature: a manager
    under the MANTLE_USER_ORG filter is refused a merge whose merged account has another organization's opportunity, and a merge
    moves an invoice with an outside party the filters hide (failed on the unfixed code).
  - R2 (the user's call of Nov 13, §4; the Built note's second finding). Commons' check#ContactAccess (owner contract) gives
    canEdit (never canDelete) to a SALES_ACCOUNT_EDIT holder for a person who is a current contact of an account of their sales
    scope and has no user account (`isSalesEditor`), so ContactDetail's identity and channel edits work for Sales with Commons'
    forms; design-drawers-commons §6 records it. BOSS SalesAccounts' ContactDetail feature: sales.rep changes Dana Morales (a
    Retail contact) and is refused Lee Chen (Ziziwork Sales'), and the one render shows the edit dialog (failed on the unfixed
    code).
- Findings, numbered by the lead F98 to F102 in order:
  - R2's admission follows Commons' single `canEdit`, so a Sales account editor also gets the contact record's Organizations,
    Relationships, Notes and photo edits, and the contact of a shared (`_NA_`) account includes shared people such as Shop guest
    customers (a person with a user account is left out); add#Contact lets a rep make any person of the scope or shared a contact,
    and so editable. Narrowing to identity and channels needs a second flag in Commons' forms;
  - set#AccountManager and delete#Contact change existing rows without the revision read (§2 "Revisions and operations"); both are
    a single relationship's end and start, so a stale change is the last writer's;
  - SalesAccess `accountOf` treats a party with no `ownerPartyId` as shared, but find#Accounts and the Party filter
    (MANTLE_USER_ORG_9) leave such a party out; Party's default is `_NA_`, so only a row written without it differs;
  - find#Accounts lists Customer and Prospect roles, while `accountOf` also admits a party with the Account role alone;
  - mark#NotDuplicate asks the guard one way (partyId into otherPartyId), so a pair whose merge is refused that way for a
    dependency is refused "not a duplicate" to a Sales manager though the other way may be admitted.
- Tests run (release binary, `--nobuild`, this worktree's runtime): after the merge, mr-mantle SalesPipelineSetup 5 of 5 and
  SalesAccounts 6 of 6, mr-boss SalesSettings 3 of 3, SalesAccounts 4 of 4, SalesAccess 8 of 8. After the fixes: mr-mantle
  SalesAccounts 7 of 7 (the new feature 0.22 s), with Contacts, ContactBooks, Consent, CrmMiscServices, ShopCustomer, ShopCart,
  ShopOperations, ShopSubscriptions, ContactAddresses, SalesOrganizationScope and SalesPipelineSetup, 106 of 106 (44.9 s run);
  mr-boss SalesAccounts 4 of 4 (ContactDetail's feature 0.43 s, from 0.27 s), Contacts, ContactsDuplicates, SalesAccess,
  SalesSettings, CustomerServiceAccess, AccountingReceivables and CommerceAccess, 112 of 112 (49.3 s run), and QuickCreate,
  ContactImport, CommsHome, Inbox, Consent and Chatter (check#ContactAccess' other callers), 94 of 94. No screen changed, so no
  lint. Prettier clean on the changed JavaScript. Not run: ./moq test-apps, the acceptance suite.
- For the lead: budget share about +0.25 s mr-mantle (SalesAccounts' filtered-merge feature) and +0.2 s mr-boss (ContactDetail's
  edit checks); merge hot spots as the Built note, with mr-mantle `service/mantle/party/DuplicateServices.xml` (merge#Parties' move
  script wrapped in an authorization-off try/finally, its body not re-indented) and `PartyMerge.js`, and mr-boss
  `service/ironstone/commons/ContactServices.xml` check#ContactAccess; both user's calls are recorded in §4 and built (R2) or kept
  (the authorization-disabled admission).

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
- **Collaboration** (owner contracts): SalesOpportunity registered as a Chatter and files host on People's pattern
  (F69: SalesOpportunityContent and its create service, entries in `get#RecordLinkInfo`'s and RecordFiles' maps, a
  `visible()` branch over Sales' assignment scope, a Chatter title), its activities
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

**Built Nov 13 (P4).** mr-mantle and mr-boss on branch `sal/p4` (hashes in the worker's reply); mr-moqui unchanged, no Rust built.
- Checked first (the code over the plan): P1–P3's Built and Review notes and F74–F102; SalesEntities.xml (P2's `statusId`, F82), P2's
  SalesSettings.js (pipelines, stages, teams, sources; `defaultPipeline`, `worksFor`) and SalesAccess.js (`teamOrganization`,
  `memberTeams`), P3's `accountOf`, `visibleParty`, `contactAccounts`; F69's host pattern (get#RecordLinkInfo's maps and
  `visible()`, RecordFiles' map, Chatter's title; People's EmploymentContent); Shared/WorkItemDetail's app branches (Maintenance's
  `get#WorkItemContext`); Maintenance's work order list (board, calendar, bulk) and detail as the screen patterns; the framework's
  view-board (StatusServices `get#ListViewColumns`); `link#WorkEffortRecord`; EntityLib's PostingOperation helpers;
  design-marketing §2's mount paths. The code over the plan:
  - no service writes the recurring plans, so the user's call on shared reasons and plans (carry-over 1) changes `store#LostReason`
    only; the plans stay read only;
  - the framework's board labels a column by its value unless the field is a status or an enumeration, so the board groups by the
    stage's name (unique in a pipeline) and its move maps the name back to the deal's pipeline's stage (a finding);
  - the plan's verbs needed three more: `add#OpportunityActivity` (the activity on a deal), `check#OpportunityAccess` (the host's
    visibility) and `create#OpportunityContent` (its files);
  - a deal's revision is the latest stamp of the deal and its party rows, so `store#OpportunityParty` names one and the batch keys
    (`id@revision`) carry it;
  - Marketing mounts Leads at `Marketing/Leads` and LeadSources at `Marketing/Settings/LeadSources` (design-marketing §2), not
    under Sales' paths, so `mountRoots` maps each mounted Sales path to the root's own;
  - OpportunityDetail is one screen of boxes, not tabs (Overview, People, Activities, Competitors, Quotes and orders when there are
    any, Conversation, Files); returning a qualified deal to a lead (design §3, a manager's) is not built.
- Mantle:
  - `entity/SalesEntities.xml`: SalesOpportunity's `salesPipelineId`, `probabilityModeEnumId`, `lostReasonEnumId`, `recurringAmount`,
    `recurringPlanEnumId`, `createdDate`, `stageEnteredDate`, `convertedDate`/`ByUserId`, `closedDate`/`ByUserId`, the key ones
    audit-logged with `typeEnumId`, `accountPartyId` and `estimatedCloseDate` (now audited); SalesOpportunityContent (its content
    types seeded with it). `data/SalesCrmSeedData.xml`: SalesProbabilityMode (SpmStage, SpmManual), SalesCompetitorPosition.
  - `SalesAccess.js` (a P4 block): `opportunityRoles`, `assignmentParties`, `assignedOpportunityIds`, `opportunityOf` (a Sales reader of
    the organization; the deal's current owner or team row names the caller or a team of theirs, or SALES_TEAM_VIEW),
    `requireOpportunity`.
  - `SalesOpportunities.js` (new) and `OpportunityServices.xml`: `find#Opportunities` (type, organization, owner or mine, team,
    pipeline, stage, outcome, close period, account, source, campaign, text; paged in the query; the totals by currency over the
    whole result; the board's stage columns), `get#Opportunity`, `create#Opportunity`, `update#Opportunity`, `move#Opportunity` (the
    stage default copied in Stage mode only; the note in the audit log), `close#Opportunity` (Lost needs a current reason),
    `reopen#Opportunity` (a reason; the outcome's fields cleared, the audit log keeps the history), `qualify#Lead` (atomic, the same
    record; an account given, or a new prospect through `create#Account`, or the lead's own; a contact given, joined to the account
    through `add#Contact`, or a new one through `create#Contact`; its PostingOperation key answers a retry with the first result),
    `store#OpportunityParty` (one current owner, one team, contacts; dated), `store#Competitor`, `apply#OpportunityBatch` (move, assign,
    lose; each on its own, each failure with its code), `add#OpportunityActivity`, `check#OpportunityAccess`,
    `create#OpportunityContent` and `save#OpportunityContentFile`. Every write checks SALES_OPPORTUNITY_EDIT, the organization, the
    assignment and each party, account, pipeline, stage, team, source and reason given, and the revision read; a representative
    assigns only themselves or a member of their teams.
  - `party/CommunicationServices.xml` get#RecordLinkInfo (owner contract, F69): SalesOpportunity's content entity, its work effort
    join (SalesOpportunityWorkEffort, so `link#WorkEffortRecord` writes it), and a `visible()` branch over check#OpportunityAccess
    for the deal and its files, whatever the authorization.
  - Carry-over 1 (the user's call, §4 Nov 13): `store#LostReason` needs every organization's scope (`ORGANIZATION_DENIED`
    otherwise); `get#SalesSetup` answers `canEditReasons`.
  - Carry-over 3 (F99): `set#AccountManager` names the management's revision (the current manager relationship's, "0" with none;
    `get#CustomerSales` managerRevision) and `delete#Contact` the relationship's (`find#AccountContacts` and `get#CustomerSales`
    contact rows' revision, through a `relationshipStamp` alias of SalesAccountContact); both REVISION_CHANGED when stale.
    `test/party/CrmMiscServices` passes the relationship's revision to `delete#Contact` (its one change).
- BOSS:
  - Carry-over 2 (F98, the user's call; owner contract with Commons): `check#ContactAccess` answers `canEditIdentity` (`need:
    'identity'`), which `update#Contact`, `store#ContactInfo`, `store#ContactInfoPurpose` and ContactRecord's Edit, contact information
    and address forms read; `canEdit` (Organizations, Relationships, Notes, the photo, files, merge) is the contact administrator's
    and the owner's alone. The Sales editor gets `canEditIdentity` only, for a person owned by an organization of their scope (no
    `_NA_` person) who is a contact of an account owned by an organization of the scope (no shared account). design-drawers-commons §6.
  - `Sales.js`: `mountRoots` with Marketing's root (`Pipeline/Leads` → `Marketing/Leads`, `Settings/LeadSources` →
    `Marketing/Settings/LeadSources`; any other root still SALES_CONTEXT), the record kind `opportunity`, the Pipeline link paths,
    the choices `pipelines`, `stages`, `owners`, `sources`, `lostReasons`, `recurringPlans`, `competitors` and `dealContacts`, the
    palette's open leads and opportunities, `recordLink` (Commons' get#RecordLink for a SalesOpportunity, F39) and
    `workItemContext` (`ContextServices.get#WorkItemContext`). `template/SalesParts.xml` choices pass `salesPipelineId` and
    `accountPartyId`.
  - Screens: `Sales.xml` (the Pipeline item, menu index 2; the record panels admit an opportunity; keys `g o`, `g l`);
    `Sales/Pipeline.xml` (Opportunities, Leads; WorkItemDetail mounted, hidden); `Pipeline/Opportunities` (OpportunityList as board,
    list and calendar, NewOpportunity, ChangeStage on each row and card, the selection's Move, Assign and Close as lost, the totals);
    `Pipeline/Leads` (LeadList with row selection: Assign, Disqualify; NewLead; a row's QualifyLead; built for a second mount over
    `sales.sharedLinks`); `Pipeline/OpportunityDetail` (the header with the stage bar and outcome, Qualify, Close or Reopen, Schedule
    activity, More: Change stage, Disqualify, the account; Overview with Edit, People with Add contact, Change owner, Set team and End,
    Activities, Competitors, Quotes and orders, Conversation, Files); `template/SalesOpportunities.xml` (the transitions) and
    `template/SalesOpportunityForms.xml` (NewOpportunity, NewLead, QualifyLead). Shared/WorkItemDetail's Sales context (owner
    contract, crosscut §3.12): an activity of a deal the user sees, Overview, Files and Chatter, a Deals box and the way back.
    TypesAndReasons offers the reasons' actions with `canEditReasons` only. The account transitions pass the revisions (F99).
  - Owner contracts: RecordFilesServices (SalesOpportunity's content service, files changed by its editors), ChatterServices (its title
    and kind, never its amount), PaletteServices get#RecordLink.
  - Demo (`data/BossZSalesDemoData.xml`, a P4 block): Retail East's Wingtip refit (Proposal, with a contact, a competitor and an
    activity), its maintenance plan (recurring), Kim Park's renewal (won), a website lead and the trade fair lead (East's queue);
    Retail West's Contoso pilot (West's pipeline), Adatum's racks (lost to a competitor), Contoso's second site (a lead) and a partner
    referral in West's queue; Ziziwork Sales' Fabrikam upgrade and an outbound-call lead.
- Specs:
  - Mantle `test/sales/SalesOpportunities` (new, 5 features, 1.5 s): a rep finds their own and their team's deals, not another team's
    or organization's, a manager the organization's, and get#RecordLinkInfo answers the same; an ended membership ends the team's
    deals; a stale move refused naming the stamp, a manual probability kept across a move, Stage copying the default, the note in the
    audit log; Lost without a reason refused, a closed deal not moved, a reopen without a reason refused and with one keeping the close
    history; a batch naming the stale deal and moving the other. `test/sales/SalesLeadQualify` (new, 2 features, 0.6 s): one
    salesOpportunityId with a new prospect and contact, its activity kept, a retry under its key answering the first result with one
    account and a changed request refused; another organization's account refused, an existing person joined, an opportunity not
    qualified again. `SalesPipelineSetup`'s settings feature: a configurer of one organization refused a lost reason and reading
    `canEditReasons` false, one of every organization admitted. `SalesAccounts`: a stale `delete#Contact` refused; a new feature
    (0.2 s) for set#AccountManager's revision.
  - mr-boss `test/Sales/SalesOpportunities` (new, 3 features, 0.9 s): Opportunities' one qvt render (the board's stage columns, the
    rep's and team's deals, not West's or a lead, the totals, the row's Change stage) and a card moved by its column's name;
    OpportunityDetail's one qvt render (people, competitor, activity, Chatter and Files, Close, no Qualify) and "not available" for
    West's rep; Leads' one html render (the rep's and East's queue, not West's, a row's Qualify). `SalesAccess` gains one feature (0.3 s:
    the opportunity record kind for the rep, the manager and Ziziwork Sales' rep, the deal's files panel, Marketing's links, the Pipeline
    tabs; menus and keys gain Pipeline, `g o`, `g l`). `SalesAccounts`' ContactDetail feature (0.5 s, from 0.43): canEditIdentity and
    no canEdit for the rep, the organization edit refused, a shared person's edit refused, no Organizations dialog.
  - Client walk `test/client/Sales/SalesPipelineWalk` (new, registered in `test/client/suite.js`, 7.6 s): sales.rep's New lead,
    Qualify on Wingtip Traders, Change stage, Close as won.
  - Acceptance, written and not run: `test/acceptance/Sales/SalesPipelineScenarios` (3 features: scenario 1, a lead with no account
    qualified on Dana Morales' account with its activity and file kept; scenario 2, the same move through the board's card, the row's
    Change stage and the service; scenario 3, sales.rep2's West membership ended removes West's queue lead, their own kept) and
    `test/acceptance/client/Sales/SalesBoardWalk` (a card dragged and kept after a reload, the row's Change stage, the board at 390 px).
- Tests run (release binary, `--nobuild`, this worktree's runtime): mr-mantle SalesOpportunities 5 of 5, SalesLeadQualify 2 of 2;
  SalesPipelineSetup, SalesAccounts, CrmMiscServices, SalesOrganizationScope, Contacts and RecordVisibility 46 of 46; RecordLinks,
  CommonsToday, PeopleChecklists, WorkTimesheets, SupportCases, ContactBooks and MaintenanceIntake with the four Sales specs 107 of
  107. mr-boss SalesOpportunities 3 of 3; SalesAccess, SalesAccounts, SalesSettings, SalesReports, Contacts, ContactsDuplicates,
  Chatter, RecordFiles, QuickCreate, Tasks, WorkItemDetail, MaintenanceChecklists, PeopleLifecycle, ManufacturingDowntime,
  TodayPanel, CustomerServiceAccess, ProjectsAccess, ContactImport, CommsHome, Inbox, Consent and AppOrganizationFilters 258 of 258;
  client SalesPipelineWalk 1 of 1. `moqui lint --screens` (release binary): 141 flagged sites, as before, none in the new or changed
  screens. Prettier clean on the new and changed JavaScript (CrmMiscServices.spec.js was not clean before and is left so). Not run:
  ./moq test-apps, the acceptance suite.
- Inventories: no ss-inventory row names a Sales/Pipeline path (the baseline has no opportunity screens); usl-inventory's
  create#Message, get#RecordLinkInfo, get#RecordTimeline, create#Account and create#SimpleTask rows name their Sales/Pipeline
  screens, and an "Added in the Sales build: leads and opportunities" table the fourteen OpportunityServices verbs.
- Design edits: design-sales §3 "As built (impl-sales P4)", §4's as-built (F98, F99), §9 TypesAndReasons (the shared reasons);
  design-drawers-commons §6 (canEditIdentity, owner contract).
- Findings, numbered by the lead F103 to F108 in order:
  - the framework's view-board labels a column by its value unless the group field is a status or an enumeration, so a board by an
    id (a stage) shows ids for its empty columns; the board groups by the stage's name instead, unique in a pipeline. A column-label
    attribute (or a display field) on view-board is the framework's fix;
  - the recurring plans have no writer, so the user's call on shared reasons and plans changes only store#LostReason; a plan service,
    when one is built, takes the same every-organization rule;
  - `store#Competitor` changes no revision (its rows are not in the deal's revision), so a stale competitor edit is the last
    writer's; the deal's own revision is checked first;
  - returning a qualified opportunity to a lead (design §3: a manager, a reason and no placed linked order) and the duplicate
    candidates in QualifyLead (the account and contact choosers find them) are not built; RelatedSales lists linked orders for a
    SALES_TEAM_VIEW holder only until P7's and P11's scopes;
  - the owners choice offers everyone who works for the organization; `create#Opportunity` and `store#OpportunityParty` refuse a
    representative's choice outside their teams (PERMISSION_DENIED) only on submit;
  - New lead and New opportunity under Sales leave the organization empty for sales.rep (one organization) in the client, so the
    walk chooses it; the forms' `newDefaults` map is set as Accounts' is, and why the client shows it empty was not traced.
- For the lead:
  - budget share: mr-mantle about 2.4 s (SalesOpportunities 1.5 s, SalesLeadQualify 0.6 s, SalesAccounts' new feature 0.2 s, the other
    added checks); mr-boss server about 1.3 s (SalesOpportunities 0.9 s, SalesAccess' new feature 0.3 s, ContactDetail's checks
    0.07 s); client about 7.6 s (SalesPipelineWalk), within the user's 7 s client estimate for Sales only with a rounding;
  - merge hot spots: mr-mantle `entity/SalesEntities.xml` (SalesOpportunity's fields, SalesOpportunityContent),
    `data/SalesCrmSeedData.xml`, `service/mantle/sales/SalesAccess.js` (a P4 block before the module value and the export),
    `OpportunityServices.xml` (appended), `SalesSettings.js` (store#LostReason, get#SalesSetup, the export),
    `SalesAccounts.js`, `AccountServices.xml`, `entity/SalesAccountViewEntities.xml`,
    `service/mantle/party/CommunicationServices.xml` (get#RecordLinkInfo's maps and `visible()`); mr-boss `Sales.js` (mountRoots,
    linkPaths, recordKinds, the P4 choices, searchFinds, the operations and export), `ContextServices.xml`, `template/SalesParts.xml`,
    `screen/Sales.xml`, `screen/Shared/WorkItemDetail.xml` (a Sales branch beside the other apps'),
    `service/ironstone/commons/ContactServices.xml` and `template/ContactRecord.xml` (F98), `service/ironstone/shared/RecordFilesServices.xml`,
    `ChatterServices.xml`, `service/ironstone/commons/PaletteServices.xml`, `data/BossZSalesDemoData.xml` (a P4 block),
    `test/Sales/SalesSpecLib.js` (menus, keys, deals), `SalesAccess.spec.js`, `test/client/suite.js`, `test/acceptance/client/suite.js`,
    `plan/usl-inventory.md`, `plan/design-sales.md` §3, §4, §9, `plan/design-drawers-commons.md` §6. Marketing's track touches
    Sales.js mountRoots and Leads.xml (its bulk action) next;
  - the user's call: none new; the shared reasons rule is built as the §4 row says, and the client budget may need the walk's
    7.6 s counted against Sales' 7 s client estimate.

**Review Nov 13 (P4).** A fresh review of `sal/p4` (mr-mantle 587c6b0b, mr-boss 217b935f) against P4, §2, §4, design §3, §12.2 and
design-drawers-commons §6.
- Checked and sound: opportunityOf (an organization of the scope; a current owner or team row naming the caller or a team of theirs,
  or SALES_TEAM_VIEW for the organization's; never across organizations) is the one rule on every path: find#Opportunities (the
  assignment ids and the organizations in the query, so the page, the count and the totals by currency read the same rows),
  get#Opportunity (missing and unseen alike, an unseen account unnamed), the palette (find#Opportunities), check#Record and the
  record link (Sales.js recordLink, PaletteServices), get#RecordLinkInfo's `visible()` and RecordFiles' catalogCanChange
  (check#OpportunityAccess), Chatter's title (no amount), WorkItemDetail's Sales context (Commons' task rule and a deal the user sees),
  the choices (pipelines, stages, owners, sources and contacts of the organization, each selected value checked) and each batch item
  (the verb's own checks). qualify#Lead runs in one transaction (create#Account, add#Contact and create#Contact joined to it), its
  key's PostingOperation row written last, so a concurrent first try fails on the key and rolls back its account; the request hash
  leaves out the revision, so a retry answers the first result. Every change of a deal names the revision (update, move, close,
  reopen, qualify, store#OpportunityParty, store#Competitor, the batch keys); party rows are dated and ended. Marketing's mountRoots
  row adds no right: get#SharedContext gives a Marketing-root caller the same capabilities and scope as under Sales, its
  sharedLinks hold only Marketing/Leads and Marketing/Settings/LeadSources, so a lead there shows unlinked and every transition is
  Mantle's guarded service; any other root is SALES_CONTEXT. The carry-overs: store#LostReason refuses a configurer of fewer than
  every organization (ORGANIZATION_DENIED) and TypesAndReasons offers it on canEditReasons only; check#ContactAccess' canEditIdentity
  admits a Sales editor only for a person owned by an organization of the scope (no `_NA_` person) who is a contact of an
  account owned by one (no shared account), with canEdit (organizations, relationships, notes, photo, merge) the contact
  administrator's as before, Commons' specs unchanged; set#AccountManager and delete#Contact refuse a stale revision and every
  caller passes it (SalesOverview's Change and Take, ContactDetail, Contacts and Customer360's SalesContacts End, CrmMiscServices).
  The specs test what they claim.
- Fixed:
  - R1 (usability, medium; the Built note's last finding). New lead, New opportunity and New account left Organization empty for
    sales.rep, and the rep's board had no stage columns (so no empty column to drop a card on): the rep's scope is Retail and its
    rollup child Ziziwork Returns Center (BossWarehouseDemoData's PrtOrgRollup; get#PartyOrganizationInfo gives a member's direct
    rollup children), so "the scope's only one" found two. SalesAccess.js `defaultOrganization` (the active one, else the scope's
    only one, else the only one of it the user works for as an agent or employee) is used by create#Opportunity, the board's
    columns and accountOrganization (create#Account), and get#SharedContext answers it as `defaultOrganizationPartyId`, which
    Opportunities', Leads' and Accounts' new-record defaults, their team filters and the deal choices read. Mantle
    SalesOpportunities: a rollup child of A in the users' scope, a lead created with no organization is A's and the board has
    columns; BOSS SalesOpportunities' board renders with no organization asked (both failed on the unfixed code). The walk no
    longer chooses the organization and checks it is shown.
  - R2 (revision, medium; the Built note's third finding). store#Competitor checked the deal's revision but did not advance it, so
    two stale competitor or deal edits both went through. A deal's revision is now the latest stamp of the deal, its party rows and
    its competitor rows (find#Opportunities reads the page's competitor rows once); Mantle SalesOpportunities: a move at the revision
    read before a competitor's change is REVISION_CHANGED (failed on the unfixed code).
  - R3 (scope, low). find#Opportunities' board columns read any pipeline asked by id, so another organization's pipeline gave its
    stage names; a pipeline asked now gives its stages only when shared or of an organization of the scope.
  - The totals' scope had no check: Mantle SalesOpportunities now gives two deals amounts and checks the rep's USD total counts their
    own (100, one deal) and the manager's the organization's (1100, two).
- Findings, numbered by the lead F109 to F112 in order:
  - apply#OpportunityBatch items carry the revision but no operation key (§2 names a batch item among the keyed operations): a
    retried batch answers REVISION_CHANGED for the items the first try did, not their first result; no data is changed twice;
  - Marketing's mountRoots row maps Leads and LeadSources only; impl-sales §4 (Nov 11) has Marketing mount Accounts too, so
    impl-marketing P3 adds `Accounts/Accounts` (and Customer360 if it mounts it) to the row's paths;
  - other apps default a new record's organization by "the scope's only one" too (Maintenance's Procedures, Equipment and
    Facilities, Warehouse's PoolList and facility parts, People's Training and ReviewCycles, Shared InspectionTemplates), and
    Sales' settings screens take the scope's first; a user whose organization has a rollup child meets the same empty field;
  - create#OpportunityContent has no `allow-remote="false"` (it checks the caller itself, as the other content services do).
- Tests run (release binary, `--nobuild`, this worktree's runtime): mr-mantle SalesOpportunities 5 of 5 (1.6 s), with SalesLeadQualify,
  SalesAccounts, SalesPipelineSetup, SalesOrganizationScope, CrmMiscServices and RecordVisibility, 41 of 41; mr-boss
  SalesOpportunities 3 of 3, with SalesAccess, SalesAccounts, SalesSettings, Contacts and WorkItemDetail, 73 of 73; the R1 and R2
  checks failed on the unfixed code. Client SalesPipelineWalk 1 of 1: 7.86 s before the fixes, 6.77, 6.75 and 6.81 s after (the
  organization drop-down step gone; the golden path kept whole, nothing moved to SalesBoardWalk). `moqui lint --screens` (release):
  no new flagged site. Prettier clean on the changed JavaScript. Not run: ./moq test-apps, the acceptance suite.
- For the lead: budget share about +0.05 s mr-mantle (SalesOpportunities' added checks) and none in mr-boss server; the client walk
  is now within the 7 s Sales client estimate (about 6.8 s). Merge hot spots as the Built note, with mr-mantle `SalesAccess.js`
  (defaultOrganization beside accountOrganization, and the export), mr-boss `Sales.js` sharedContext and choiceOrganization,
  `ContextServices.xml` get#SharedContext's out-parameters and `screen/Sales/Accounts/Accounts.xml`'s defaults. No user's call
  needed.

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
  CustomerService.xml:68), as Comms renders them (F64): `record-lookup` for SalesOpportunity (quotes and orders join
  it in P7); `create-from` kind Lead, which Comms offers on a chat message; "Create lead" on a voicemail as a
  screen-extend transition given the voicemail (Customer Service's Voicemail.xml:21-37), making the intake from its
  transcript; "Log call on opportunity" in `call-actions` and `voicemail-actions`; `call-context` with the caller's
  open opportunities the user may see; and `contact-card`, which Comms' Mail reads, with the sender's account or
  lead. A mail message's "Create lead" is a `message-actions` action: P5 makes basic-comms' Mail render that slot
  (mr-moqui `runtime/components/base/basic-comms`, the user's call, Nov 13), with the email message's id, as Chat's
  `chat-message-actions` renders its own, and calls `create-from` with the emailMessageId it already takes; P8 adds
  "Create RFQ" to the same slot.
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

**Built Nov 13 (P5).** mr-moqui, mr-mantle and mr-boss on branch `sal/p5` (hashes in the worker's reply). The framework change is
basic-comms' Mail and its docs; base component files are read from disk by the release binary (`crates/moqui-embedded` packs only
the framework and tools components and a webroot stub, and basic-comms is neither), so the server needed no rebuild and every spec
ran on the shared release binary with `--nobuild`; the desktop client's precompiled copy of Mail.qvue
(`crates/moqui-desktop/shell/js/bundled-screens.js`) was regenerated with a Debug `UPDATE_GOLDEN=1 cargo test -p moqui-core --lib
bundled_screens_are_precompiled` in the mr-moqui worktree (`CARGO_BUILD_JOBS=4`, 4 m 21 s), no `.rs` file changed.
- Checked first (the code over the plan): P1–P4's Built and Review notes and F74–F112; how Comms consumes the hooks (F64):
  `call#Providers` (crates/moqui-core/src/service/shell.rs) answers a mutation with every provider's result in sequence order and
  Chat's createFrom takes the first, so a second `create-from` provider on the Sales root would answer (or refuse) every kind;
  Customer Service's case and People's claim and application kinds are kinds of Comms' one provider `boss.records`
  (ChatServices.create#FromChat), and Sales' lead is one too; Mail's own `createFrom` is the QuickCreate prefill through the
  inbox-source, so the slot's actions post a new `createRecord`; `contact-card` keeps the first card with a party or link, Comms'
  own party card first; People's CalendarProjection (impl-people P12) is the pattern of the projected address book; Maintenance's
  mail action and plus tag (MaintenanceIntake.js `intakeTeam`); EntityLib's PostingOperation keys check the user, which Marketing's
  job and an operator's reprocess of one capture would not share, so the intake keeps its own key. The code over the plan:
  - "Create lead" on a chat or mail message and a voicemail makes the lead at once (the user its owner, on their only team; the
    message filed on it; the same message again answers the same lead) and answers its link, rather than opening NewLead prefilled:
    create-from answers a record, as the case and task kinds do;
  - "Log call on opportunity" is a dialog (Sales/Pipeline/LogCall) over a new Mantle `log#OpportunityCall` (a Phone communication
    event filed on the deal); "the intake address shown in Settings" is LeadSources' Mail intake box over new `store#TeamIntake` and
    `find#TeamIntakes` (the team's plus tag and default source as PartySettings), so P2's store#SalesTeam is unchanged;
  - "My accounts" is the accounts the rep manages or has a deal of (assigned now to them or their team), not every account of the
    scope, which for a shared or large organization would be the whole book.
- mr-moqui (framework, basic-comms):
  - `screen/BasicComms/Inbox/Mail.qvue`: `m-ext-actions slot="message-actions"` in the thread's More menu (its last message) and each
    message's, item `{store, emailMessageId, communicationEventId}`, `@done` reloading the thread; `Mail.xml`: the `createRecord`
    transition (the message's ids and the action's kind to the `create-from` providers, as Chat's createFrom; "Nothing here makes
    records from messages" with none); `service/org/moqui/comms/ProviderInterfaces.xml` create#From takes `communicationEventId`.
  - `crates/moqui-desktop/shell/js/bundled-screens.js` regenerated (the golden).
  - Docs: `docs/tools/Comms.md` (the hook table's create-from row and Mail's slot and item beside Chat's and Voicemail's);
    `docs/security/Attack-Surface.md` (the lead intake address under Mail, the RFQ address named for P8; projected address books
    under DAV). The schema's slot list (`xml-screen-3.xsd` ext-item-attributes) and Qvt-Client's example already name
    `message-actions`, so no other doc needed the slot named.
- Mantle:
  - `entity/SalesEntities.xml`: SalesLeadIntake (unique source identity and operation key; indexes by lead and by organization and
    email) and SalesLeadSourceMap (dated, the source audit-logged); `entity/PartyEntities.xml`: ContactProjection.
  - `data/SalesIntakeData.xml` (new, seed): SalesLeadIntakeSource and SalesLeadIntakeOutcome, ErActCreateLead (`createLead`), the
    PartySettingTypes SalesIntakePlusTag and SalesIntakeSource, the ContactProjection SalesMyAccounts, the ServiceJob
    purge_SalesLeadIntakes (nightly) with its JobRegistration (SALES_CONFIGURE) and retentionDays parameter.
  - `service/mantle/sales/SalesIntake.js` (new) and OpportunityServices: `store#LeadIntake`, `create#LeadFromEmail`,
    `store#LeadSourceMapping`, `find#LeadSourceMappings`, `store#TeamIntake`, `find#TeamIntakes`, `log#OpportunityCall`,
    `purge#LeadIntakes`; SalesWorkspaceServices `get#AccountContactProjection`. find#Opportunities' rows gain intakeKindText,
    receivedText, verificationText and intakeCount, get#Opportunity `intakes`.
  - `party/ContactDavServices.xml`: `define#ProjectionOwner`, `get#ProjectionObjects`, projected collections in get#DavCollections and
    get#DavObjects, PUT and DELETE on one 403; get#ContactObjectTags takes a projection's partyIdList.
  - The contract Marketing P13 builds to: `store#LeadIntake` with organizationPartyId, sourceKind formResponse and sourceId (the
    response), operationKey (the capture's), teamPartyId (the queue), utmSource and utmMedium, marketingCampaignId, trackingCodeId
    (its campaign when none is given), defaultDataSourceId, the published submitted fields and verified; called by its job with no
    user or authorization disabled; a repeated key answers the first result (alreadyApplied) whoever runs it, another request under
    it OPERATION_KEY_CONFLICT; a duplicate answers duplicate true and the lead it joined (Marketing's "Sales' review item").
- BOSS:
  - `service/ironstone/sales/SalesComms.js` (new) and ContextServices: `create#LeadFromMessage` (mail, internal, chat or voicemail, read
    as the user may read it; Mantle's intake as the user), `lookup#Records` (record-lookup: a deal's info and card, never its amount,
    search, links), `get#CallContext` (the caller's accounts' open deals the user sees), `get#ContactCard` (an inquirer with no party
    as their open lead's card), `get#DealOptions` and `log#Call`.
  - `screen/Sales.xml`: record-lookup (sequence -5, before Comms'), call-context, contact-card (sequence 50, after Comms').
    `service/ironstone/comms/ChatServices.xml` create#FromChat: kind lead (chat, mail or internal message); chatRoomId and eventSeq
    no longer required, checked for the chat kinds.
  - `screen-extend/basic-comms`: Inbox/Mail `sales.createLead` (message-actions, createRecord, hook create-from); Chat
    `sales.createLead` (chat-message-actions); Calls/Voicemail the `createLead` transition, `sales.createLead` and `sales.logCall`;
    Calls/Call (new) `sales.logCall` (call-actions). `screen/Sales/Pipeline/LogCall.xml` (new; BOSS_SAL_LOG_CALL in
    BossSetupSalesData: denied to BOSS_USERS, always for BOSS_SALES and BOSS_SALES_ADMIN).
  - Screens: LeadSources' Tracked links (UtmSourceMap) and Mail intake boxes; LeadList's Came by, Received and Verification columns;
    OpportunityDetail's Inquiries box, and QualifyLead's new account and contact from the first inquiry.
  - Demo (`data/BossZSalesDemoData.xml`, a P5 block): Retail's intake mailbox sales@retail.example (sales.manager's, read by the reps)
    with its createLead rule, East's tag `leads` and source, West's `west`, two UTM mappings, and Northwind's inquiry made into a lead
    by the rule's service.
- Specs:
  - Mantle `test/sales/SalesLeadIntake` (new, 3 features, 1.4 s serial, up to 5.3 s on a loaded machine): a mail delivered twice
    (two rows of one Message-ID) makes one lead in the plus-tag team's queue with the team's source, read by the team's rep and not
    another team's or organization's, a rule of a user of another organization files nothing, the message filed on the lead, its
    inquiry on get#Opportunity; a call logged by the rep and refused to another team's; the UTM map (source and medium over source,
    an unmapped pair the default, MAPPING_EXISTS, a non-configurer refused), a repeated key answering the first result and another
    request under it refused, a tracking code's campaign and tracking row, the same email joining its lead, a reader without the edit
    permission and another organization's editor refused, a staff entry owned by the rep; a team's tag (TAG_TAKEN, set, a rep
    refused); the purge (an unverified unqualified intake blanked, a qualified and a verified one kept, a retry still one lead).
    `test/party/ProjectedAddressBook` (new, 1 feature, 0.34 s): My accounts read only with the managed account's and the team deal's
    account's contacts, not another team's; PUT and DELETE 403; a user without Sales has no such collection.
  - mr-boss `test/Sales/SalesIntake` (new, 3 features, 1.0 s): Create lead in Mail's ext items and posted through createRecord
    (the rep's lead, the message filed, once; another app's user refused); the record-lookup card and the contact card of the
    inquirer; Log call in a voicemail's and a call's actions for the rep only; LeadSources' one qvt render (Tracked links, Mail
    intake); Create lead on a chat message. `SalesOpportunities`' Leads render checks the demo inquiry and the intake columns.
  - basic-comms `BasicCommsInbox` gains one feature (0.03 s): Mail.qvue renders the slot in both menus with the message's ids, a
    user no app answers create-from for is told so by createRecord, and an app's action on the slot is in Mail's ext items.
  - Acceptance, written and not run: `test/acceptance/Sales/SalesIntakeScenarios` (scenario 13: the mail rule's lead in East's queue
    with its source, the same mail again none; a voicemail's Create lead once; My accounts read only).
- Tests run (release binary, `--nobuild`, this worktree's runtime): mr-mantle SalesLeadIntake 3 of 3, ProjectedAddressBook 1 of 1,
  with SalesOpportunities, SalesLeadQualify, ContactBooks, SalesPipelineSetup and SalesAccounts 46 of 46, and RecordLinks and
  CrmMiscServices 30 of 30 with the two new; mr-boss SalesIntake 3 of 3, with SalesAccess, SalesOpportunities, SalesSettings,
  SalesAccounts, Chat, Inbox, CommsHome, ChatPanel, CustomerServiceChannels, CustomerServiceAccess, MaintenanceAccess,
  PeopleExpenses, PeopleRecruiting and ProjectsAccess 133 of 133; basic-comms BasicCommsInbox and BasicCommsChat 11 of 11; the
  golden `bundled_screens_are_precompiled` (Debug). `moqui lint --screens` (release): 141 flagged sites, as before, none in the new
  or changed screens. Prettier clean on the new JavaScript (BasicCommsInbox.spec.js was not clean before and is left so). Not run:
  ./moq test-apps, test-framework, the acceptance suite.
- Findings, numbered by the lead F113 to F119 in order:
  - a second `create-from` provider breaks Chat's createFrom, which takes the first result (and a mutation stops at the first
    refusal), so every app's kind lives in Comms' one provider `boss.records`; a kind-keyed dispatch in `call#Providers` (or a
    provider declaring its kinds) is the framework's fix;
  - Customer Service's "Create a case" from a mail is a widgets-extend on MessageDetail (its F121); now that Mail renders
    message-actions it could move to the slot as Sales' Create lead did;
  - a Create lead or Create a case action (a transition with hook create-from, or none) is offered to every Comms user and refused
    on use to one without the app; an ext-action has no permission attribute, and only a screen target is left out by authorization;
  - Mantle's `call()` disables authorization, and store#LeadIntake treats a caller with authorization disabled as a vouching system
    caller (as merge#Parties' guards do, §4 Nov 13), so a BOSS screen or service must call it as the user, never through EntityLib's
    `call`; SalesComms.js does;
  - the intake's email verification (design §3 "earlier when the inquirer verifies the email") is only the caller's `verified` flag:
    Sales sends no verification mail, and a party is made only at qualification;
  - My accounts lists the contacts of accounts the rep manages or has a current deal of; a manager (SALES_TEAM_VIEW) gets the same
    personal list, not the organization's;
  - the call-actions slot's ext items come from the Call screen's path; Log call there has no caller's number or account preset (the
    call's parties are not read), the voicemail's is inbound with its transcript.
- For the lead:
  - budget share: mr-mantle about 1.8 s (SalesLeadIntake 1.4 s, ProjectedAddressBook 0.34 s); mr-boss server about 1.0 s (SalesIntake);
    basic-comms about 0.03 s (its budget 8 s, now about 1.0 s for the two specs run); no client change;
  - merge hot spots: mr-moqui `runtime/components/base/basic-comms/screen/BasicComms/Inbox/Mail.qvue`, `Mail.xml`,
    `crates/moqui-desktop/shell/js/bundled-screens.js` (regenerate after any merge touching a bundled screen), `docs/tools/Comms.md`,
    `docs/security/Attack-Surface.md`; mr-mantle `entity/SalesEntities.xml` (appended), `entity/PartyEntities.xml` (ContactProjection
    before ContactBook), `OpportunityServices.xml` (appended), `SalesOpportunities.js` (the intake reads),
    `SalesWorkspaceServices.xml` (appended), `party/ContactDavServices.xml`; mr-boss `screen/Sales.xml` (shell-providers),
    `service/ironstone/sales/ContextServices.xml` (appended), `service/ironstone/comms/ChatServices.xml` (create#FromChat),
    `screen-extend/basic-comms/screen/BasicComms/{Chat,Calls/Voicemail,Inbox/Mail}.xml`, `screen/Sales/Pipeline/{Leads,
    OpportunityDetail}.xml`, `screen/Sales/Settings/LeadSources.xml`, `data/BossSetupSalesData.xml` and `data/BossZSalesDemoData.xml`
    (P5 blocks at the end), `test/Sales/SalesOpportunities.spec.js`, `plan/usl-inventory.md`, `plan/design-sales.md` §1.4, §3, §4, §9.
    Marketing's track touches Leads.xml and LeadSources.xml (its mounts) next; P8 adds Create RFQ to the Mail screen-extend;
  - the user's call: none needed; the intake contract is built to impl-marketing §1's list.

**Review Nov 13 (P5).** A fresh review of `sal/p5` (mr-moqui e8bb55e1, mr-mantle 0556cc8c, mr-boss 9098e9a8) against P5, §2, §4,
design §1.4, §3, §4 and §9.
- Checked and sound: store#LeadIntake is `allow-remote="false"`, has no AgentToolExposure, REST or PASS path, and its one caller with
  authorization disabled is create#LeadFromEmail, which fixes every parameter from the stored message and the team (the rule's owner
  must work for the team's organization, Maintenance's and Customer Service's rule); EntityLib's `call()` reaches it from nowhere
  else, and Comms' providers run with authorization required (shell.rs call#Providers), so SalesComms.js calls it as the user and a
  caller that lost its user would fail TEAM_REQUIRED rather than act as the system. A user caller needs SALES_OPPORTUNITY_EDIT and
  the organization in their scope (another organization's ORGANIZATION_DENIED, in the spec). Create lead reads the message as the
  user before anything is written: a mail through get#Thread (the user's readable accounts; mail of no account is not found), an
  internal message through get#InternalThread, a chat message through findOrCreate#ChatCommunicationEvent (room read, not
  encrypted), a voicemail through get#Voicemail (the user's own); missing and unreadable answer alike. The offered transitions
  (Mail's createRecord and Chat's createFrom with hook create-from, Voicemail's createLead) refuse a user without Sales
  (SALES_UNAVAILABLE) and create nothing; Log call is a screen action under BOSS_SAL_LOG_CALL, so only a Sales user is offered it,
  and log#OpportunityCall checks the deal again. The framework change: Mail's two `m-ext-actions` (the thread's last message and
  each message) and `createRecord` follow Chat's createFrom (call#Providers, mutation, the first result with a record, "Nothing here
  makes records from messages"); create#From only gains `communicationEventId`; Mail's own createFrom (QuickCreate), Chat's
  createFrom and Customer Service's MessageDetail widgets-extend and voicemail createCase are unchanged; create#FromChat's other
  kinds still need a chat message. My accounts: the owner service is called as the user, its cards are the visible contacts of the
  accounts the user manages or has a deal of, `projected-` collections refuse PUT and DELETE (403) before any book check, and no
  ContactBook row is written. Revisions: the source map is ended at its revision; a team intake's PartySettings carry none (as
  P2's team settings). The specs test what they claim.
- Fixed:
  - R1 (confidentiality, medium; the lead's question). A user caller of store#LeadIntake was answered the first result of an
    operation key or a source identity whoever's lead it was, and the duplicate policy filed their inquiry on another team's open
    lead with the same email: a rep learned the id of a lead they cannot open (and, by SOURCE_TAKEN, that another organization had
    the message), and their inquiry left their sight. A user now gets a repeat's result only for a lead they see, else
    INTAKE_TAKEN naming no lead or organization, and joins only an open lead they see (otherwise their own lead is made); a system
    caller (the mail rule, Marketing's job) is unchanged. Mantle SalesLeadIntake: West's rep repeating the East rep's entry and an
    East form response is INTAKE_TAKEN without the lead's id, and the same email as East's lead makes a lead of West's (failed on
    the unfixed code).
  - R2 (failure tolerance, low). purge#LeadIntakes caught a row's failure but left its error in the message frame, so every later
    row failed too and the run's transaction rolled back; each row is now its own transaction and error frame (EntityLib `probe`).
    create#LeadFromEmail's filing of the message on the lead had the same flaw (the lead would roll back with the rule's failure);
    it now has an error frame of its own. No spec induces a row failure.
  - R3 (scope, low). My accounts took the account of any deal still assigned to the user, so a deal left in an organization they no
    longer sell for brought its shared (`_NA_`) account's shared contacts; only a deal of an organization of the scope counts now.
    Mantle ProjectedAddressBook: such a deal's shared contact is absent (failed on the unfixed code).
  - The Built note's BOSS checks did not cover a Sales user who cannot read the message: SalesIntake now has sales.rep3 (no access
    to the intake mailbox) refused on the mail with the same answer as a missing message and no intake, and sales.rep2 (not in the
    room) refused on the chat message before the rep makes the lead, nothing made.
- Findings, numbered by the lead F120 to F125 in order:
  - purge#LeadIntakes blanks the intake's submitted details, but the lead keeps its name (the mail's subject or the submitted
    organization), its description (the mail's text, which often carries the sender's phone and signature) and the mail filed on its
    conversation; whether the purge also blanks or closes an unqualified lead (design §3 "unverified intake records ... are purged")
    is the user's call;
  - createLead admits any rule owner who works for the team's organization, with no Sales permission (Maintenance's and Customer
    Service's rule), and a rule can be run on demand over a folder, so an employee files mail of their own mailbox into any team's
    queue of their organization; People's Recruiting also asks the owner to hold its edit permission. Requiring
    SALES_OPPORTUNITY_EDIT or SALES_CONFIGURE of the rule's owner is the user's call;
  - a mail's Message-ID is the sender's: a mail carrying another's Message-ID first takes that identity, and the later mail answers
    the first's lead (or SOURCE_TAKEN for another organization) and makes none;
  - TAG_TAKEN is instance-wide, so a configurer learns that another organization's team uses a plus tag;
  - with R1 a rep's inquiry from the email of another team's open lead makes a second open lead of the organization, which only the
    manager's duplicate review sees;
  - Marketing P13's capture job calls store#LeadIntake as the system, which trusts the organization, team and `verified` it is given:
    they must come from the publication and Marketing's own verification, never the submission.
- Tests run (release binary, `--nobuild`, this worktree's runtime): mr-mantle SalesLeadIntake and ProjectedAddressBook 4 of 4 (about
  2.4 s serial; SalesLeadIntake about 1.9 s, ProjectedAddressBook about 0.5 s), with SalesOpportunities, SalesLeadQualify,
  ContactBooks, CrmMiscServices and RecordLinks 55 of 55; mr-boss SalesIntake 3 of 3 (about 1.3 s), with SalesOpportunities,
  SalesAccess, Chat, Inbox, CustomerServiceChannels and ChatPanel 51 of 51; basic-comms BasicCommsInbox and BasicCommsChat 11 of 11.
  The R1 and R3 checks failed on the unfixed code. Prettier clean on the changed JavaScript. No screen or Rust changed, so no lint
  or golden. Not run: ./moq test-apps, test-framework, the acceptance suite.
- For the lead: budget share about +0.5 s mr-mantle (SalesLeadIntake's West calls, ProjectedAddressBook's second organization) and
  +0.3 s mr-boss server (SalesIntake's refusals) over the Built note's. Merge hot spots as the Built note, with mr-mantle
  `SalesIntake.js` (openLeadOf, replayOf, purge, the projection's deal filter). The user's calls: the purge's reach (the lead's name,
  description and filed mail) and the createLead rule owner's permission, above.

### P6 — Home, shell, Assist and the pipeline dataset

Design §3 Home, §12.2 QuickCreate and Palette, §1.4 (CX-ASSIST, CX-OPS-REPORTS' dataset and funnel), §3
OpportunityImport, §16 (the pipeline exports); SAL-SHELL, SAL-ASSIST, SAL-REPORT (the dataset), SAL-ANALYTICS (the
funnel). Ends stage 1.

- **Mantle.**
  - `SalesWorkspaceServices.get#SalesHome` (the counters and assigned work, each from the scoped lists; a failed
    metric unavailable, never zero).
  - The pipeline dataset, `report/mantle-sales-pipeline.json` over a DataDocument of SalesOpportunity with its stage,
    pipeline, organization, owner, source and amounts, fed as each is written, beside Mantle's sales datasets (§4).
    Its `rowFilterService` is Sales' scope, the organization and then the assignment or team (§2), not
    `get#OrganizationRowFilter` alone, which would show a rep the organization's pipeline (F66).
  - The active-organization `user-facts` provider (F65): a service implementing
    `org.moqui.agent.AgentServices.get#UserFacts` (the user's organizations and the active one), registered in Mantle's
    MoquiConf.xml `llm-facade` beside its constitution provider; the prerequisite of the Sales skills (design §1.4).
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
  - an `ironstone.admin.LifecycleParticipant` "Sales assignments" on People's row (BossSetupData.xml:5203-5209): the
    open opportunities, accounts and, from P7, quotes a departing user owns, its lookup and transfer services in
    `SalesWorkspaceServices` on the owned-resource contract (framework IdentityServices.xml:136-160), reassigning
    through `store#OpportunityParty` and the order part's party roles, its `requiredPermission` `SALES_OWNER_CHANGE`,
    granted to `BOSS_ADMIN_IDENTITY` (F54). Admin's disable or removal of the user lists and transfers them; People's
    access-end request (impl-people P7) ends the access and calls no participant;
  - the pipeline export listed as an owner export target, as Projects' work-item list is (BossSetupData.xml:4955-4957),
    its place a key of Admin.js `mountRoutes` (:404-440); Shared/DataImport's mount gains a Sales branch for the one
    target `opportunities` beside People's and Maintenance's (DataImport.js:51-85), before the catalog branch (F44, F55).
- **Shell:** QuickCreate (Lead, Opportunity, Account, Contact, Activity; Quote in P7) over the hosts' own forms; the
  palette's sources of P3 and P4 checked as one provider over `search#Records` with `recordEntity` and `recordId`;
  Today's source; Opportunities' and Leads'
  CSV and XLSX exports of the filtered result; the import opened in Shared/DataImport from Leads and Opportunities.
- **Assist** (design §1.4): the skills `sales-qualify-lead.md`, `sales-follow-up.md` and `sales-log-call.md`
  (`sales-issue-quote.md` in P10) with their `screens:`, the aliases and retrieval cases; OpportunityDetail's and
  Customer360's prompt chips; the "Log as note" and "Send as message" response actions; `AgentToolExposure` rows for
  `find#Opportunities` (Assistant and MCP) and `create#`, `move#` and `close#Opportunity` (Assistant, behind approval,
  no MCP), on Admin's rows (BossSetupData.xml:2544, 3177).
- **Screens:** Home (SalesWork, AssignedWork, MyPipeline, PipelineFunnel through `report-embed` over the funnel panel
  of `report/boss-sales-pipeline.json`, shipped here with that one panel and completed in P19, and left out of
  server-static output, where `report-embed` throws, F66); QuickCreate.
- **Specs:** Mantle `test/sales/SalesOpportunityImport` (an unknown stage a row error; a matched ID updated only under
  the update strategy; a repeat under its key answers the first result) and `SalesPipelineDataset` (another
  organization's deals not in a reader's rows); BOSS `SalesHome` (Home's one qvt render; a counter equal to its
  list's count); `test/skill-retrieval.json` gains the Sales cases.
- **Usable when** (`test/acceptance/Sales/SalesHomeUsable`; gate 1): Home's counters open the lists they count; a CSV of
  five deals, one with an unknown stage, imports four and names the one; disabling an offboarded rep in Admin lists
  their deals and moves them to a new owner; Assist qualifies a lead only after the user approves the step.

**Built Nov 13 (P6).** mr-mantle and mr-boss on branch `sal/p6` (hashes in the worker's reply); mr-moqui unchanged, no Rust built.
- Checked first (the code over the plan): P1–P5's Built and Review notes, follow-up 1 and F74–F129; the import targets of Admin P15,
  People P7 and Maintenance P18 (PartyInvitationData.xml, MaintenanceImport.js) and the framework's rows contract
  (DataTransferServices.xml validate#/apply#TargetRow, DataTransferBatch.js `itemKey`); the owned-resource contract and Admin's
  Lifecycle.js (find#OwnedResources calls each lookup as the caller with authorization on); crates/moqui-llm facts.rs and conf.rs
  (`user-facts`, fenced, called with the user's authorization); the report engine's registered scope policies and admission
  (business.rs) and Maintenance's and Customer Service's dataset rows; `report-embed` and the funnel visualization; Maintenance's
  LogNote, SendMessage, today-source and quick create; the framework's EmailRule services (no save hook for an app's action) and
  the pre-service SECA (an error stops the service). The code over the plan:
  - the framework's row operation key is `tr.` and 40 hex characters, longer than a PostingOperation key, so the import keeps the
    repeat's first result under a PostingOperation of the key hashed (`soi-…`); a deal keeps its source key in a new
    `SalesOpportunity.importSourceKey`, so a file imported again matches its deals rather than making second ones;
  - "My activities due" is not a Home counter: no Sales list of a user's due activities exists to open (they are Commons tasks, in
    Today and on each deal), so AssignedWork shows each deal's next activity; Home's counters are Leads to work, My open
    opportunities and Past their expected close, the four of later records "Not configured";
  - the funnel counts open opportunities by stage only: one funnel value cannot add currencies (amounts by currency are MyPipeline's
    and Opportunities' totals); its stage label sorts by the stage's order (`stageLabel` in the document);
  - the lifecycle transfer writes the owner and manager rows itself after checking SALES_OWNER_CHANGE and the new owner, rather than
    through store#OpportunityParty and set#AccountManager, which check a Sales editor's scope the identity operator does not have;
    the deal's team is kept; the transfer's reason is logged, as the party rows carry no reason;
  - the user-facts provider is a new `mantle.party.UserFactServices.get#OrganizationFacts` (generic, for Marketing P21 too), reading
    the active organization as get#ScopedConstitution does, never get#PartyOrganizationInfo, which clears a stale preference (a
    write the read fence refuses);
  - the rule-save half of carry-over 3 is a pre-service SECA on the framework's create#EmailRule and update#EmailRule
    (`SalesIntake.secas.xml`), as the framework has no save hook for an app's rule action;
  - the purge's "untouched since intake" is: open and unqualified, every intake of it unverified and past the retention (none
    joined since), its party rows as the intake started them (none ended, none started later), its stamp and the records filed on
    it not later than two minutes after it was made, and no activity, file, competitor or order; the purge reason
    `SlrIntakePurged` is seeded ended, so it is offered to no one;
  - QuickCreate's Account and Contact needed the Accounts and Contacts forms in a template (`template/SalesAccountForms.xml`), which
    those lists now include.
- Mantle:
  - `entity/SalesEntities.xml`: SalesOpportunity's `importSourceKey` (indexed with the organization), the `parties` and `stage`
    short aliases the document reads.
  - `SalesWorkspace.js` (new) and SalesWorkspaceServices: `get#SalesHome` (each counter find#Opportunities' count with its list's
    filters, failed alone as unavailable; the user's own open deals), `get#PipelineRowFilter` (the organizations of the scope and,
    without SALES_TEAM_VIEW, the deals assigned now to the viewer or a team of theirs; nothing for a non-reader; another user's
    refused), `find#OwnedSalesAssignments` and `transfer#SalesAssignment` (the owned-resource contract; SALES_OWNER_CHANGE; NOT_EMPLOYED,
    OWNER_INVALID, RECORD_UNAVAILABLE, RECORD_CLOSED).
  - `SalesImport.js` (new) and OpportunityServices: `validate#OpportunityImportRow`, `apply#OpportunityImportRow` and
    `find#OpportunityImportScopes` (SALES_IMPORT with SALES_OPPORTUNITY_EDIT, the organization; a named error for an unknown
    stage, currency, pipeline, account, contact, owner, team or source, a row of another organization refused whole; a match skipped
    or, under "Update matched deals", changed through qualify#Lead, update#, move#Opportunity and store#OpportunityParty; new deals
    through create#Opportunity; no account made); `check#LeadRuleOwner`.
  - `data/SalesWorkspaceData.xml` (new, seed): the TransferTarget `opportunities` (rows, keyed by source system and key, the
    duplicate strategy option, permissions SALES_IMPORT, SALES_OPPORTUNITY_EDIT and SALES_TEAM_MANAGE, view SALES_TEAM_VIEW, owner
    route salesOpportunityImport), the ReportScopePolicy MantleSalesScope, the ALL_USERS grant of the row, scope, lifecycle and
    rule-check services (each checks itself), the lost reason SlrIntakePurged. `data/SalesPipelineReportData.xml` (new,
    seed-initial): the DataDocument MantleSalesOpportunity (type, outcome, organization, pipeline, stage with name, order and label,
    account, source, campaign, amounts, dates, current owner and team) and the push feed MantleSalesPipeline. `report/
    mantle-sales-pipeline.json`: the dataset, its row filter Sales' scope.
  - `service/mantle/party/UserFactServices.xml` (new) get#OrganizationFacts, named in `MoquiConf.xml`'s llm-facade `user-facts`.
  - Carry-over 2 (the user's call of Nov 13): purge#LeadIntakes clears an untouched lead (name, description and next step blanked,
    its filed mail unlinked, Lost with SlrIntakePurged) with its intake in one transaction and error frame a row (leadsClosedCount);
    a worked lead keeps everything but the intake's details.
  - Carry-over 3: create#LeadFromEmail refuses a rule owner without SALES_OPPORTUNITY_EDIT (RULE_NOT_ALLOWED, nothing filed);
    `service/SalesIntake.secas.xml` runs check#LeadRuleOwner before create#EmailRule (a rule naming createLead) and update#EmailRule
    (its actions given or stored), so such a rule is not saved by an owner without it.
- BOSS:
  - Carry-over 1: SALES_OWNER_CHANGE to BOSS_ADMIN_ADMIN and its bundle (BossSetupSalesData's P6 block).
  - `data/BossSetupSalesData.xml` (a P6 block): the LifecycleParticipant `sales.assignments`; the dataset's artifact and document for
    every Sales user (BOSS_SALES, BOSS_SALES_ADMIN; their rows their own scope) and the Insights groups, its admission, class
    (operations), readiness and index refresh; the wizard export targets salesOpportunityList and salesLeadList; the
    AgentToolExposure rows sales_find_opportunities (Assistant and MCP) and sales_create_, sales_move_ and sales_close_opportunity
    (Assistant, AgclWrite, no MCP) with BOSS_SAL_ASSIST_TOOLS granting the four services to the Sales groups.
  - `Admin.js` mountRoutes salesOpportunityImport, salesOpportunities, salesLeads; `DataImport.js` the Sales branch (target
    opportunities; SALES_TEAM_VIEW reads, SALES_IMPORT with SALES_OPPORTUNITY_EDIT and SALES_TEAM_MANAGE runs) before the catalog's.
  - `Sales.js`: linkPaths (OpportunityImport, QuickCreate, LogNote, SendMessage), the choice `deals`, `today`; ContextServices
    `get#TodayItems`.
  - Screens: `Sales/Home.xml` rewritten (SalesWork's counter cards opening their lists, AssignedWork, MyPipeline, the funnel through
    `report-embed`, New opportunity primary, New lead, Schedule activity, Import); `Sales/QuickCreate.xml` and its NewLead,
    NewOpportunity, NewAccount, NewContact, NewActivity; `Sales/LogNote.xml`, `Sales/SendMessage.xml`;
    `Sales/Pipeline/OpportunityImport.xml` (Shared/DataImport); Opportunities and Leads: XLSX beside CSV and Import;
    `template/SalesAccountForms.xml` (NewAccount, NewPerson, NewContact, moved from Accounts and Contacts). `Sales.xml`: the five
    quick-create kinds, the today-source, four assist-prompts (OpportunityDetail's three, Customer360's) and the two response actions.
  - `report/boss-sales-pipeline.json`: the dashboard with its one funnel panel (P19 adds the others).
  - Assist: `skill/sales-qualify-lead.md` (risk confirm: Qualify is the user's), `sales-follow-up.md`, `sales-log-call.md`;
    `skill/aliases.json` (lead, opportunity, quote, rfq, account); seven cases in `test/skill-retrieval.json`.
- Specs:
  - Mantle `test/sales/SalesOpportunityImport` (new, 3 features, 0.81 s): an unknown stage, currency and another organization's account
    named, a rep and another organization refused; a row's deal with its key, a repeat under its operation key the first result and one
    deal; a match skipped, then updated only under update, by key, and an ID under another key refused. `SalesPipelineDataset` (new,
    2 features, 0.42 s): the row filter of a rep (organization and assigned ids), a manager (organization), another organization's rep,
    a non-reader (nothing) and another user's refused; the document's stage label, owner and team; through query#Documents (search
    available) each reader's own rows. `SalesWorkspace` (new, 3 features, 0.83 s): each counter equal to its list's count (2, 2, 1),
    later counters not configured, the assigned work the rep's own, another organization and a non-reader refused; the participant to
    SALES_OWNER_CHANGE only, NOT_EMPLOYED, RECORD_UNAVAILABLE, a deal and an account moved; the user facts (organizations, none
    active, the active one; another user's none). `SalesLeadIntake`: the purge feature (0.49 s) gains an untouched lead closed Lost
    and blanked and a worked one kept; a new feature (0.18 s) for the rule owner, run and save. `SalesOpportunities`: its lost reason is
    now a current one (the ended purge reason exists).
  - mr-boss `test/Sales/SalesHome` (new, 4 features, 0.7 s): Home's one qvt render (the Leads card's value equal to the Leads list's
    count, Not configured, the rep's assigned deal and pipeline, the funnel's box, no other team's deal); Today and its refusal of
    another user's; quick create's activity through its transition; the import mount for the manager, refused to the rep; Admin's
    find#OwnedResources lists the rep's deal under sales.assignments for admin.identity and admin.admin (carry-over 1).
    `SalesAccess`: the registry feature expects SALES_OWNER_CHANGE for BOSS_ADMIN_ADMIN too.
  - Skill retrieval (`./moq test mr-boss --skills`): 46 of 46.
  - Acceptance, written and not run: `test/acceptance/Sales/SalesHomeUsable` (4 features: each ready counter's list opened with its
    parameters counts the same; a five-row CSV through the wizard under Sales, four applied and the unknown stage named; a spec-local
    rep's disable in Admin, the deal's transfer step moved to sales.rep; the tools (no qualify tool, writes AgclWrite, none on MCP),
    the skill's "Do not press Qualify", and the rep's own Qualify).
- Tests run (release binary, `--nobuild`, this worktree's runtime): mr-mantle the five specs above 17 of 17; with SalesLeadQualify,
  SalesAccounts, SalesPipelineSetup, SalesOrganizationScope, CrmMiscServices, RecordVisibility, OrganizationRowFilter, BusinessEvents,
  ProjectedAddressBook, ContactBooks, WorkProjectRequests, SupportChannels, MaintenanceIntake and SalesReports 118 of 118 (one fixed
  on the way: SalesOpportunities' reason); mr-boss SalesHome and SalesAccess 13 of 13; with SalesOpportunities, SalesAccounts,
  SalesIntake, SalesSettings, SalesReports, InsightsDatasets, InsightsAccess, InsightsSettings, AdminImports, AdminAccess,
  AdminLifecycle, InsightsDelivery, InsightsAlerts, Tasks, TodayPanel, QuickCreate and Contacts 161 of 161; ProjectRequests,
  CustomerServiceChannels, MailSettings, PeopleLifecycle, MaintenanceStack, PeopleAccess, MaintenanceAccess, ContactsDuplicates,
  Chatter, RecordFiles, WorkItemDetail, CustomerServiceAccess and ProjectsAccess 206 of 206 (one spec of that run, not a Sales one,
  over 15 s at load 13: MaintenanceAccess's known overrun, follow-up 1's review). `moqui lint --screens` (release): 141 flagged
  sites, as before, none in a new or changed screen. Prettier clean on the new and changed JavaScript (SalesIntake.js, not clean
  before, now is). Not run: ./moq test-apps, the acceptance suite, the client suite (no client change; SalesPipelineWalk unchanged).
- Inventories: usl-inventory's "Added in the Sales build: Home, shell, Assist and the pipeline dataset" table; no ss-inventory row
  names Sales/Home or QuickCreate.
- Design edits: design-sales §3 Home's "As built (impl-sales P6)", OpportunityImport's as-built, Leads' purge and rule owner;
  design-admin §11.1's Sales import row and §14's Sales participant (owner contracts).
- Findings, numbered by the lead F130 to F136 in order:
  - the import's repeat key is a hash of the framework's 43-character row key, as a PostingOperation key holds 40; a framework
    row key within 40 characters (or a PostingOperation key of 64) would let an owner use it as is;
  - `docs/security/Attack-Surface.md` (mr-moqui) does not name the `opportunities` import target, the pipeline dataset's row filter
    or Mantle's user-facts provider; P6 had no mr-moqui worktree, so they are for the next framework docs pass;
  - the lifecycle transfer of a deal keeps its team: a deal of East moved to a rep of West shows to the new owner and to East, not
    West's other reps, until a manager sets its team;
  - Home's funnel counts open opportunities created in the last three years (`createdDate` is the dataset's time field); an older
    open deal is not in it, while My pipeline shows it;
  - "My activities due" is not a counter (above): a Sales list of due activities, or a Commons task filter by record kind, would let
    Home count them;
  - the purge's "untouched" margin (two minutes after the lead was made) treats an edit in the first two minutes as part of the
    intake;
  - `skill/people-policy-question.md`'s description is 201 characters, over the index's 160, so the skill is left out of the index
    (`./moq test mr-boss --skills` logs it); not Sales', seen while running the retrieval.
- For the lead:
  - budget share: mr-mantle about 2.4 s (SalesOpportunityImport 0.81 s, SalesPipelineDataset 0.42 s, SalesWorkspace 0.83 s,
    SalesLeadIntake's added feature and checks about 0.3 s); mr-boss server about 0.7 s (SalesHome); client none;
  - merge hot spots: mr-mantle `entity/SalesEntities.xml` (SalesOpportunity), `OpportunityServices.xml` and
    `SalesWorkspaceServices.xml` (appended), `SalesIntake.js` (purge, the rule owner, Prettier), `MoquiConf.xml` (llm-facade),
    `test/sales/SalesLeadIntake.spec.js`; mr-boss `screen/Sales.xml` (shell-providers), `Sales.js` (linkPaths, choices, operations),
    `ContextServices.xml`, `service/ironstone/shared/DataImport.js` and `service/ironstone/admin/Admin.js` (Marketing P4 adds its
    branch and route beside), `data/BossSetupSalesData.xml` (a P6 block at the end), `screen/Sales/Accounts/{Accounts,Contacts}.xml`
    (forms moved to a template; Marketing mounts Accounts next), `screen/Sales/Pipeline/{Leads,Opportunities}.xml`,
    `skill/aliases.json`, `test/skill-retrieval.json`, `test/Sales/SalesAccess.spec.js`, `plan/usl-inventory.md`,
    `plan/design-sales.md` §3, `plan/design-admin.md` §11.1, §14;
  - the user's call: none new. Marketing P21 can name Mantle's `get#OrganizationFacts` as the facts its skills rest on.

**Review 2026-11-13 (P6).** A fresh review of `sal/p6` (mr-mantle bd162616, mr-boss 4fe8045d) against P6, §2, §4, design §1.4, §3,
§12.2 and §16, design-admin §11.1 and §14; fixes in mr-mantle df1c5441, no mr-boss code change.
- Checked and sound:
  - The pipeline dataset's row filter. The engine calls `get#PipelineRowFilter` on every path that resolves rows (queries, panels,
    `report-embed` in qvt, tui and html, Insights' Assist query tools, alerts and scheduled deliveries as their owner: moqui-report
    lib.rs resolve), always with the signed-in viewer (none is an error), and a listing that does not resolve rows matches nothing.
    The filter is SalesAccess's own rule (the organizations of the scope, then for a reader without SALES_TEAM_VIEW the deals with a
    current owner or team row of the viewer or a team of theirs, as `opportunityOf`), nothing for a non-reader and for a reader of no
    organization, another userId refused; registered as the ReportScopePolicy MantleSalesScope, so it runs as the engine's code. The
    Insights groups' grants read only their own Sales scope (nothing without a Sales read). The index refresh rebuilds the whole index
    and filters nothing, as every dataset's does; reads filter. The two list export targets are wizard rows that dispatch nothing:
    the exports are the lists' own CSV and XLSX over the scoped find#Opportunities.
  - Assist: `sales_find_opportunities` (Assistant and MCP) is find#Opportunities as the caller, scoped in its own query; create, move
    and close are AgclWrite, Assistant only, and no Assistant policy row names them, so the framework's default asks the user before
    each (moqui-llm tools/mod.rs ToolRule default `Ask`). No exposure runs with authorization off; the services read with Mantle's
    EntityLib (authorization off on reads, as every Mantle service) after their own permission, organization and assignment checks.
    There is no qualify tool (the skill says Qualify is the user's). LogNote and SendMessage check the record through check#Record
    and file nothing until the user submits.
  - The import: SALES_IMPORT, SALES_OPPORTUNITY_EDIT and SALES_TEAM_MANAGE on the registration (all required), and each row service
    asks SALES_IMPORT with SALES_OPPORTUNITY_EDIT and the organization in the importer's scope; every deal write is Sales' own
    service as the importer (create#, update#, move#Opportunity, qualify#Lead, store#OpportunityParty), with their revisions; only
    `importSourceKey` is written directly. A row naming another organization is refused whole; an unknown stage, currency,
    pipeline, account, contact, owner, team or source is that row's named error; each row its own result (the framework's batch
    keeps going). The hashed operation key: the framework's row key is `tr.` and 40 hex characters of a SHA over the batch, item and
    values; Mantle keeps `soi-` and 36 characters of its deterministic hash, so a collision is negligible and, if one happened,
    `EntityLib.operation` refuses it as OPERATION_KEY_CONFLICT unless type, organization, user and request hash all match.
  - The lifecycle participant: both services are ALL_USERS-callable and check SALES_OWNER_CHANGE for another user's resources; the
    transfer acts only on a deal whose current owner is the leaving user and an account they manage, ends the owner rows (one owner
    at a time, as store#OpportunityParty's `setOnly`) and starts the new owner's; the stamps are the deal's revision, so an editor
    holding the old one is refused. Admin's lifecycle step row records the transfer (operator, new owner, reason); the service also
    logs it. Carry-over 1: SALES_OWNER_CHANGE for BOSS_ADMIN_ADMIN and its bundle.
  - Home: each ready counter is find#Opportunities with exactly the filters its list applies (type and the open default status come
    from Leads' and Opportunities' own defaults, the organization passed through); SalesWorkspace and SalesHome check it.
  - The purge (carry-over 2): one transaction and error frame per intake; the "untouched" test is conservative (any later party row,
    record, activity, file, competitor, order or later intake keeps the lead). The audit log is not a sounder signal: the name,
    description and next step are not audit-logged, so a rename leaves no audit row; `lastUpdatedStamp` is the deal's revision Sales
    already trusts. The intake writes the lead, its party rows, the intake and the filed mail in one transaction, so their stamps lie
    within that transaction; the two-minute margin could be the intake row's own stamp plus a second or two (a finding below).
- Fixed:
  - R1 (scope, medium; the lead's question on the SECA). check#LeadRuleOwner on update#EmailRule checked the caller and read the
    stored actions when an update gave none, so an owner who had lost SALES_OPPORTUNITY_EDIT (or a mailbox manager without it) could
    not rename or disable a createLead rule, and a manager's change of another's rule was judged by the manager, not the owner the
    rule runs as. It now looks only at a save that gives the actions and checks the rule's owner (the caller on create, the stored
    owner on update); it still refuses nothing but a createLead action. The create SECA's condition (a `JSON.stringify` of the
    action list, which a host list might not stringify) is gone, so the check always decides. Mantle SalesLeadIntake: an old
    createLead rule of an owner without the permission is disabled, and re-adding the action is refused (the disable failed on the
    unfixed code).
  - R2 (completeness, medium). find#OwnedSalesAssignments capped the owner rows at 500 before leaving out closed deals; a closed deal
    keeps its owner row, so a long-serving rep's open deals could be missing from the offboarding preview and left behind. The cap is
    now on the open deals. No spec makes 500 deals.
  - R3 (usability, low). A shared (`_NA_`) account a user manages from before (set#AccountManager refuses one) was listed
    transferable, and every transfer failed NOT_EMPLOYED; it is listed not transferable with a note. Mantle SalesWorkspace (failed on
    the unfixed code).
  - R4 (hardening, low). validate#OpportunityImportRow answered "valid" for any stored operation of the row's hashed key; now only
    for this importer's import row of this organization (the apply already refused any other).
- Findings, numbered by the lead F137 to F143 in order:
  - the purge's two-minute "untouched" margin: the intake's writes share one transaction, so the intake row's own stamp (read before
    the purge writes it) plus a second or two would treat fewer early edits as part of the intake;
  - a deal moved by the lifecycle keeps its team, as a manager's owner change does (`ownerFor` never sets the team): the new owner of
    another team sees it as owner, the old team's members still see it and the new team's do not until a manager sets the team. Keep
    (recommended: consistent with store#OpportunityParty, and a team is a queue the manager owns) or set the new owner's only team of
    the organization is the user's call;
  - the lifecycle's new owner needs only to work for the record's organization, not to hold any Sales permission, so a deal can be
    handed to someone who cannot open it (as store#OpportunityParty's `ownerFor`);
  - the import ignores a matched deal's `teamPartyId` under Update (only owner, stage and facts change), silently;
  - Home's funnel is over every organization of the scope, not Home's organization filter (report-embed is given no filter);
  - get#OrganizationFacts is `authenticate="false"`: with no user it answers the userId given. It is not remote and the facade calls
    it as the user; a caller without a user is the runtime's own;
  - the Built note's findings stand (the repeat key's hash, the funnel's three years, no due-activities counter, the
    people-policy skill's description).
- Tests run (release binary, `--nobuild`, this worktree's runtime): mr-mantle SalesWorkspace 3 of 3 (0.8 s), SalesLeadIntake 4 of 4
  (1.9 s), SalesOpportunityImport 3 of 3 (0.8 s), SalesPipelineDataset 2 of 2 (0.4 s), SalesOpportunities 5 of 5 (1.6 s); mr-boss
  SalesHome 4 of 4 (0.9 s), SalesAccess 9 of 9 (3.4 s). Prettier clean on the changed JavaScript. No screen changed, so no lint. Not
  run: ./moq test-apps, test-framework, the acceptance suite (SalesHomeUsable written, not run).
- For the lead:
  - budget share: about +0.1 s mr-mantle over the Built note's (SalesLeadIntake's two updates, SalesWorkspace's shared account);
    mr-boss unchanged;
  - merge hot spots as the Built note, with mr-mantle `SalesIntake.js` (checkLeadRuleOwner), `SalesIntake.secas.xml`,
    `SalesWorkspace.js` (ownedDeals, the shared account), `SalesImport.js` (validateRow);
  - mr-moqui `docs/security/Attack-Surface.md`, three lines for the lead to add:
    - under the import registrations (after the "Nothing is imported without a registration" bullet): "- Mantle's `opportunities`
      import target (IronStone Sales) asks `SALES_IMPORT`, `SALES_OPPORTUNITY_EDIT` and `SALES_TEAM_MANAGE`, all required, and no
      `ADMIN_*` permission; its row services (`mantle.sales.OpportunityServices` validate#/apply#OpportunityImportRow) check
      `SALES_IMPORT` with `SALES_OPPORTUNITY_EDIT` and the organization in the importer's sales scope again, and write every deal
      through Sales' own guarded services as the importer; a repeat under a row's operation key answers the first result, and any
      other use of the key is refused.";
    - beside the report authorization paragraph ("A report query is authorized on its dataset ..."): "- The Sales pipeline dataset
      (`mantle-sales-pipeline`) is filtered by the registered scope policy MantleSalesScope
      (`mantle.sales.SalesWorkspaceServices.get#PipelineRowFilter`), computed from the signed-in viewer (another userId refused): the
      organizations of their sales scope and, without `SALES_TEAM_VIEW`, only the deals assigned now to them or a team of theirs;
      nothing for a viewer who reads nothing of Sales. Not `get#OrganizationRowFilter` alone, which would show a representative the
      organization's whole pipeline.";
    - under Assist: "- Mantle's `user-facts` provider (`mantle.party.UserFactServices.get#OrganizationFacts`, named in Mantle's
      MoquiConf `llm-facade`) adds to a new conversation's prompt the names and ids of the user's internal organizations (at most
      twenty) and their active one; it reads only, answers nothing for another user, and is not remote. A tool still takes and
      checks its organization: the facts are fixed when the conversation starts.";
  - the user's calls: the lifecycle's team (above).

### P7 — Quote drafts, pricing and storeless tax

Design §5 Quotes and OrderDetail's quote context (drafts, pricing, availability), Product360, InventoryAvailability,
§7 PriceExplain, §19 item 1 (storeless freight); SAL-QUOTE (intent, drafts), CX-PRICING (X1). Starts stage 2.

- **Mantle.**
  - The order purpose values `OrpSalesQuote` and `OrpSalesOrder` beside Shop's `OrpRecurringTemplate` (F7).
  - X1: `mantle.other.TaxServices.calculate#OrderSalesTax` resolves its gateway as `SalesTax.js` `gateway()` does
    (:192), falling back to the seller's `PartyAcctgPreference.taxGatewayConfigId`, and
    `handle#OrderMajorChange` runs its tax step without a store (F8). A store order is unchanged; promotions and
    carrier estimates stay store-only, and freight on a storeless quote is a charge line (§5). This is Mantle's fix
    for every storeless sales order of a seller with a gateway, not a rule behind Sales' policy. No seller's
    preference names a gateway today, so no built order or spec changes (F62); a Projects estimate of a seller that
    sets one is taxed as its invoice already is. Marketing's storeless ticket
    order rests on it (impl-marketing P17).
  - `mantle.order.SalesQuoteServices` (Q): `find#Quotes` (sales-direction parts of the purpose SalesQuote in Open,
    Requested or Proposed, with cancelled history; never a cart or a base), `create#Quote` (over `create#Order` and
    `create#OrderPart`: one seller, one customer, one currency; account defaults; the opportunity link), `get#Quote`
    and the draft line verbs over the native item services with `check#ProductUsable`, the one price resolver and its
    provenance; a manual price or discount keeps the calculated basis, the entered value, reason and actor on the
    item; a missing price blocks, an explicit free line needs its permission.
- **Shared screens** (owner contracts, F34): the Sales quote context of Shared/OrderDetail in
  `template/SalesOrderDetail.xml`, on the pattern of the other apps' templates (OrderDetail.xml:15-53), a branch of
  its appRoot chain before Projects' default (:177) and Sales in its not-found list (:213) (F68): Overview,
  Items, Terms, History, Chatter and Files, the draft's actions, validity on the part; the Sales rows of Product360,
  InventoryAvailability (read only without a Warehouse grant) and PriceExplain (the safe selected-price explanation
  for a rep, the trace with `PRICE_VIEW`), over a `salesContext()` in Products' SharedContext.js, which refuses an
  unknown root today (:448), on Customer Service's (:236-302), and a Sales branch of PriceExplain (:43-49) (F67).
  A record link for a sales quote and order (F39; Purchasing's F46). The baseline OrderDetail forms no Sales context
  covers are marked in ss-inventory with their reason (F71).
- **Screens:** Quotes (QuoteFind, QuoteList with its saved lists, NewQuote); OrderDetail at
  `Sales/Orders/OrderDetail`, the one route; Products' Product360 and InventoryAvailability; PriceExplain. Quick
  create's Quote; OpportunityDetail's and Customer360's Quotes.
- **Demo data:** draft quotes for both organizations, one for the storeless seller ORG_ZIZI_SALES, whose accounting
  preference names the `LOCAL` gateway (F72), one with a
  customer price and one with a manual override.
- **Specs:** Mantle `test/order/StorelessOrderTax` (a storeless quote taxed through the seller's gateway and retaxed
  on a line change; a store order's tax as before; no gateway, no tax and no error) and `SalesQuoteDrafts` (a cart and
  a recurring base not among quotes; a second customer refused; an override keeps its basis; a missing price blocks;
  a rep without the assignment refused); BOSS `SalesQuotes` (OrderDetail's one qvt render in the quote context).
- **Usable when** (design §14.3 scenario 4, its price and tax half; `test/acceptance/Sales/SalesQuoteDraftUsable`): a rep
  drafts a customer-priced quote with no ProductStore, sees the price Products explains and the tax of the seller's
  gateway change with each line, an unavailable price told apart from zero, and no cost; Projects', Accounting's,
  Purchasing's, Customer Service's and Commerce's order contexts read as before.

**Built Nov 13 (P7).** mr-mantle and mr-boss on branch `sal/p7` (hashes in the worker's reply); mr-moqui unchanged, no Rust built.
- Checked first (the code over the plan): P1–P6's Built and Review notes, follow-up 1 and F53–F143; §4's Nov 13 rows (§5 Q2: freight a
  shipping-charge line taxed by X1); X1's code (TaxServices `calculate#OrderSalesTax`, OrderServices `handle#OrderItemChange`,
  `handle#OrderPartChange`, `handle#OrderMajorChange`, SalesTax.js `gateway()`, `calculate#SalesTaxLocal`); the resolver
  (PriceResolver.js, `get#StoreProductPrice`'s store authority, PriceLists.js' guard); `create#Order`, `create#OrderItem` and
  `update#OrderItem`; Purchasing's draft lines (PurchaseOrders.js) as the line pattern; Shared/OrderDetail's app branches and the
  Commerce and Purchasing templates; Products' SharedContext.js (Customer Service's context), Inventory.js and PriceExplain.xml;
  PaletteServices `get#RecordLink`; get#RecordLinkInfo's OrderHeader host. The code over the plan:
  - F62 does not hold for a BOSS install: Accounting's demo (Demo.js `taxSetup`) names `LOCAL` on BOSS_ACCT_ORG's preference with a
    Utah nexus, so X1 reaches its storeless orders; its collections order's customer has no address, and the local gateway refuses a
    taxed sale without one (TAX_ADDRESS_MISSING), which failed the Accounting demo's load on the first try. X1 therefore leaves a
    storeless part with no address yet (its own, the customer's or its facility's) untaxed until it has one, and retaxes a storeless
    order only when a part's internal seller names a gateway (`check#OrderTaxGateway`), so every other storeless order (Customer
    Service's replacements, Projects' estimates of ORG_ZIZI_SERVICES) is untouched, revision included;
  - the resolver gives a caller without PRICE_VIEW no scoped row and no price list (`readable`, `applyList`), so a rep would never get
    a customer price: a quote line is priced through a new in-process `get#SellerProductPrice`, the seller's authority after Sales'
    checks, on Shop's `get#StoreProductPrice` pattern (public rows, the seller's and the customer's own, the seller's published
    lists; no agreement row, average cost, other party or trace). Agreement prices are P15's;
  - OrderPartParty has no dates, so a quote's owner and team (design §1.1 "dated OrderPartParty roles") are plain rows;
  - no permission names a free line: an entered zero or a free line needs SALES_APPROVE until P9's policies (a finding);
  - Shared/OrderDetail already includes Accounting's `choices`, so the quote context's drop-down is `salesChoices`;
  - an accepted quote keeps its purpose, so "not placed" (`placedDate` empty) tells a quote in Quotes from an order in Customer360's
    and OpportunityDetail's order lists.
- Mantle:
  - `entity/SalesQuoteEntities.xml` (new): the purposes `OrpSalesQuote` and `OrpSalesOrder` (with the OrderPurpose type, as the file
    loads before Shop's); OrderItem's `calculatedUnitAmount` (audit-logged), `priceSource`, `priceOverrideReason` (audited),
    `priceOverrideUserId` (audited) and `priceOverrideDate`.
  - X1: `SalesTax.js` `order` and `orderTaxed`; TaxServices `calculate#OrderSalesTax` (its storeless branch; the store path as
    before) and `check#OrderTaxGateway` (new); OrderServices' three change rules run the tax step alone for a storeless order whose
    seller names a gateway (a shipping-charge line retaxes it too; promotions and carrier estimates stay store-only).
  - `PriceResolver.js` `sellerAuthority` (context, `readable`, `extras`, `applyList`) and PriceServices `get#SellerProductPrice`
    (new, `allow-remote="false"`).
  - `SalesAccess.js` (a P7 block): `quoteRoles`, `quotePurpose`, `assignedQuoteOrderIds`, `quoteOf`, `requireQuote`.
  - `service/mantle/order/SalesQuotes.js` and `SalesQuoteServices.xml` (new): `find#Quotes` (states open, draft, requested, proposed,
    cancelled before placement, all; validity expiring or expired; organization, customer, opportunity, owner or mine, team,
    currency, text; paged), `create#Quote` (one seller of the scope, an account of it or shared, the opportunity of that
    organization and account, a contact of the customer, a store of the seller or none, the currency given or the opportunity's or
    the seller's, validity, the customer's address, the owner, team and contact rows, the opportunity link), `get#Quote` (lines with
    source, basis, reason, actor and tax; totals of products, shipping and tax; the gateway note; history from the audit log; the
    customer's addresses; no cost), `update#Quote`, `store#QuoteLine`, `delete#QuoteLine`, `explain#QuoteLinePrice`. Each change
    names the order revision (REVISION_REQUIRED, REVISION_CHANGED) and refuses a quote no longer a draft (QUOTE_NOT_DRAFT); the
    refusals PRICE_UNAVAILABLE, OVERRIDE_REASON_REQUIRED, FREE_LINE_DENIED, PRODUCT_NOT_USABLE, CUSTOMER_INVALID,
    OPPORTUNITY_INVALID, CONTACT_INVALID, STORE_INVALID, ADDRESS_INVALID, ITEM_UNAVAILABLE.
  - `SalesOpportunities.js` (get#Opportunity's orders leave out a quote not placed) and `SalesAccounts.js` (`ordersOf` likewise).
- BOSS:
  - `Sales.js`: linkPaths (Quotes, Quotes/Quotes, Orders/OrderDetail, Products/Product360, Products/InventoryAvailability,
    Products/PriceExplain), the record kind `quote`, the choices `products` (the seller's and the shared catalogue's, not virtual,
    not barred from sale), `currencies` and `stores`, the palette's quotes (find#Quotes).
  - Screens: `Sales.xml` (Quotes, menu index 4; the hidden Orders and Products areas; the record panels admit a quote; quick create's
    Quote; key `g q`); `Sales/Quotes.xml`, `Sales/Quotes/Quotes.xml` (QuoteFind, QuoteList with the saved lists Open, Draft, Proposed,
    Expiring, Expired and Cancelled, NewQuote); `Sales/Orders.xml` (the one OrderDetail route); `Sales/Products.xml` (Product360,
    InventoryAvailability, PriceExplain); `Sales/QuickCreate/NewQuote.xml`; `template/SalesQuotes.xml` (createQuote, salesStoreLine,
    salesDeleteLine, salesUpdateQuote) and `template/SalesQuoteForms.xml` (NewQuote); `Sales/Pipeline/OpportunityDetail.xml` (a Quotes
    box, New quote the primary of an open opportunity with Close beside it, the Orders box); `Shared/Customer360/SalesQuotes.xml` (new
    tab, with New quote).
  - Owner contracts: `Shared/OrderDetail.xml` (the Sales branch before Projects' default, `template/SalesOrderDetail.xml`, Sales in the
    not-found list; crosscut §3.6's Sales row, F68); Products' `SharedContext.js` `salesContext()` (Summary, Features, Identifiers,
    Documents, Stock and, for a price reader, Prices; the selling organizations' facilities; no edit, cost or stock action) and
    `Inventory.js`' scoped roots (F67); `Shared/PriceExplain.xml`'s Sales branch (a quote line's safe explanation for anyone who sees
    the quote, the trace only for PRICE_VIEW); `PaletteServices` `get#RecordLink` (a sales quote opens under Sales, F39 and
    Purchasing's F46).
  - `data/BossSetupSalesData.xml` (a P7 block): PRODUCT_CATALOG_VIEW for BOSS_SALES and BOSS_SALES_ADMIN, in their bundles.
  - Demo (`data/BossZSalesDemoData.xml`, a P7 block): ORG_ZIZI_SALES' own preference naming `LOCAL` (with Ziziwork Industries'
    commercial revision and kit cost flags it inherited), its Utah nexus and 6.1 % rate, Fabrikam's Utah address, two Ziziwork Sales
    products with the seller's prices, Wingtip's own price of Demo Product One-One; Retail East's draft for Wingtip (a customer price
    line and an entered price below the calculated one, with its reason) and Ziziwork Sales' storeless draft for Fabrikam (two kits,
    installation and freight, taxed 178.73 through the seller's gateway by `handle#OrderMajorChange` at load).
- Specs:
  - Mantle `test/order/StorelessOrderTax` (new, 3 features, 0.19 s): a storeless order taxed through its seller's gateway and retaxed
    on a quantity change; a shipping-charge line taxed, a removed line's tax gone; a store order taxed through its store's gateway as
    before; a storeless order of a seller without a gateway no tax line, no error and no revision change. `test/order/SalesQuoteDrafts`
    (new, 5 features, 1.7 s warm, 3.1 s on a first run): a cart and a recurring base no quotes, the rep's and the team's quotes, the
    manager's organization, another team's and organization's not available; another organization's account and organization and
    a reader refused; the customer's price for a rep without PRICE_VIEW, an entered price keeping its basis, reason and actor, a
    stale revision refused, a quantity change keeping the entered price, the safe explanation; a missing price refused, then
    entered; a free line refused to the rep and admitted to an approver; a shipping charge; another team's rep and a reader refused a
    removal.
  - mr-boss `test/Sales/SalesQuotes` (new, 3 features, 0.5 s): OrderDetail's one qvt render in the quote context (header, lines,
    the entered price's reason, no tax note, Chatter and Files, no cost or margin) with the storeless quote's tax and total (html) and
    another organization's "not available"; Quotes' one html render; PriceExplain's one html render for a rep (the customer's own
    price, no trace form). `SalesSpecLib.js`: the menus with Quotes, the key `g q`, the demo quotes.
  - Acceptance, written and not run: `test/acceptance/Sales/SalesQuoteDraftUsable` (3 features: a storeless quote through the screens'
    transitions at Fabrikam's own price, its tax 48.80, 73.20 and 75.64 as lines and freight are added; the explanation, a zero price
    admitted and a missing one refused, no cost; the other apps' OrderDetail contexts render as before).
- Tests run (release binary, `--nobuild`, this worktree's runtime): mr-mantle StorelessOrderTax 3 of 3 and SalesQuoteDrafts 5 of 5;
  the specs that tax or price orders and the Sales ones, unchanged: AccountingReturns, ReturnPolicies, OrderToCashBasicFlow,
  ReturnToResponseBasicFlow, AccountingTax, ProductPriceLists, ShopCatalog, ProductEffectivePrices, StoreCheckout,
  WorkProjectMilestones, WorkProjectClients, ShopCheckout, OrderConfirmations, Subscriptions, OrderChanges, OrderLifecycle,
  StoreOperations, CartRecovery, StoreEmailOnce, CalcGridSales, SalesAccounts, SalesOpportunities and SalesWorkspace 200 of 200 (26
  specs with their dependencies); after the later changes SalesQuoteDrafts, StorelessOrderTax, SalesOpportunities, SalesAccounts,
  SalesLeadQualify, SalesWorkspace, CrmMiscServices, SalesOrganizationScope, SalesPipelineDataset and RecordVisibility 49 of 49.
  mr-boss SalesQuotes 3 of 3; SalesAccess, SalesAccounts, SalesOpportunities, SalesHome, SalesIntake, SalesSettings, SalesReports,
  QuickCreate, AccountingCollections, AccountingReceivables, AccountingAccess, AccountingTax, CustomerServiceOrders,
  CustomerServiceAccess, CommerceOrders, PurchasingOrders, ProductsPriceLists, ProductsSharedContext, ProductsInventory,
  InsightsRecords, ClientBilling, ManufacturingSubcontracting, MaintenancePurchasing, WarehousePicking, ProjectsAccess, Chat and
  RecordFiles 219 of 219. Client SalesPipelineWalk 1 of 1 (6.9 s). The demo loads with no data file failing (the first try's
  Accounting demo failure fixed as above). `moqui lint --screens` (release): 141 flagged sites, as before, none in a new or changed
  screen. Prettier clean on the new and changed JavaScript but Products' SharedContext.js, not clean before and left so. Not run:
  ./moq test-apps, test-framework, the acceptance suite.
- Inventories: ss-inventory's Order rows naming Sales/Orders/OrderDetail and Sales/Quotes/Quotes (FindOrder's CreateSalesOrder and
  OrderList; OrderDetail's forms, covered or "—" with their owner or phase, F71); usl-inventory's create#Order, create#OrderPart,
  create#OrderItem, add#OrderProductQuantity, handle#OrderMajorChange, calculate#OrderSalesTax, get#OrderProductPrice and
  check#ProductUsable rows, and an "Added in the Sales build: quote drafts, pricing and storeless tax" table.
- Design edits: design-sales §5 "As built (impl-sales P7)"; design-crosscut CX-PRICING (X1 as built); design-products §7
  (get#SellerProductPrice and PriceExplain's Sales branch, owner contracts).
- Findings, numbered by the lead F144 to F150 in order:
  - F62 is wrong for a BOSS install: Accounting's demo names `LOCAL` on BOSS_ACCT_ORG, so X1 taxes its storeless sales orders with an
    addressed customer from now on (none of the Accounting specs run changed); a storeless part with no address is left untaxed
    rather than refused, which an invoice from that order then carries untaxed (ORDER_TAX), as before X1;
  - no permission names a quote's free line: P7 asks SALES_APPROVE of the one who enters it (a rep cannot, an approver can); P9's
    approval policies, or a permission of its own, is the user's call;
  - Sales' lifecycle participant (P6) transfers deals and managed accounts, not open quotes as F54 and design-admin §14 say; a quote's
    owner row can follow in P10 or a follow-up;
  - get#RecordLinkInfo shows a quote's Chatter and files by its organization rule (orderVisible), wider than Sales' assignment scope;
    the Sales root admits only a quote the user sees (check#Record quote), so the gap is the other roots' and Commons';
  - a quote's owner and team are undated OrderPartParty rows (the entity has no dates), so a team change does not end a quote's team
    from a date, as it does for a deal;
  - Product360's "add to quote" (design §5's action set) is not built: a line is added from the quote;
  - `docs/security/Attack-Surface.md` (mr-moqui) does not name `get#SellerProductPrice`, the second in-process price authority beside
    Shop's; P7 had no mr-moqui worktree.
- For the lead:
  - budget share: mr-mantle about 1.9 s (StorelessOrderTax 0.19 s, SalesQuoteDrafts 1.7 s warm, up to 3.1 s cold); mr-boss server about
    0.5 s (SalesQuotes); client none (SalesPipelineWalk unchanged at 6.9 s);
  - merge hot spots: mr-mantle `service/mantle/order/OrderServices.xml` (the three change rules), `service/mantle/other/TaxServices.xml`
    and `SalesTax.js`, `service/mantle/product/PriceResolver.js` and `PriceServices.xml` (appended), `service/mantle/sales/SalesAccess.js`
    (a P7 block before the module value and the export), `SalesOpportunities.js`, `SalesAccounts.js`; mr-boss `screen/Shared/OrderDetail.xml`
    (a Sales branch, include and not-found entry beside the other apps'), `screen/Shared/PriceExplain.xml`,
    `service/ironstone/products/SharedContext.js` and `Inventory.js`, `service/ironstone/commons/PaletteServices.xml`,
    `service/ironstone/sales/Sales.js`, `screen/Sales.xml` (subscreens, shell-providers, keymap), `screen/Sales/Pipeline/OpportunityDetail.xml`,
    `data/BossSetupSalesData.xml` and `data/BossZSalesDemoData.xml` (P7 blocks at the end), `test/Sales/SalesSpecLib.js` (menus, keys),
    `plan/ss-inventory.md`, `plan/usl-inventory.md`, `plan/design-sales.md` §5, `plan/design-products.md` §7, `plan/design-crosscut.md`
    CX-PRICING. No shared file of Marketing P1's (BossSetupData's deny rows, BossUsersDemoData, MantleSetupData) is touched;
  - mr-moqui `docs/security/Attack-Surface.md`, a line for the lead to add beside Shop's store authority: "- Sales' quote lines are
    priced by `mantle.product.PriceServices.get#SellerProductPrice` (not remote), the selling organization's authority: the public
    price rows, the seller's and the customer's own, and the seller's published lists, for a caller without `PRICE_VIEW`; never an
    agreement's row, an average cost or another party's, and no trace. Only `mantle.order.SalesQuoteServices` calls it, after its own
    checks of the seller (the caller's sales scope), the customer (an account of it) and the quote (the caller's).";
  - the user's call: the free-line permission (above).

**Review 2026-11-13 (P7).** A fresh review of `sal/p7` (mr-mantle 977fc14c, mr-boss 865cc822, each with master merged in first:
Marketing P1, no conflict) against P7, §2, §4, design-sales §5 and §7 and CX-PRICING.
- Checked and sound: X1 (`calculate#OrderSalesTax`'s storeless branch, `check#OrderTaxGateway`, the three change rules): a store order
  takes the path it took before; a storeless order is retaxed only when a part's internal seller names a gateway, and then only out of
  the no-recalculation statuses and before billing, as the store path; promotions and carrier estimates stay store-only; a part with
  no address (its own, the customer's or its facility's) keeps no tax line rather than refusing the change. The only sellers with a
  gateway are ORG_ZIZI_SALES (P7's demo) and BOSS_ACCT_ORG (Accounting's demo, set at load), so only their addressed storeless orders
  change; every order-taxing spec of Shop, Commerce, Customer Service, Projects and Accounting passes unchanged. A missing address
  set later on the quote (`update#Quote`'s postalContactMechId) retaxes it through `handle#OrderPartChange`; a customer address added
  on the party is taken at the quote's next change. `get#SellerProductPrice`: `allow-remote="false"`, called only by SalesQuotes.js
  after `requireQuote` (the seller in the caller's scope, the customer an account of it, the quote assigned or the team reader's),
  `sellerAuthority` set only inside its own script (no service declares it), `readable` keeps public rows and the seller's and the
  customer's own, never an agreement row, average cost or another party's, `listEligible` keeps the seller's published non-agreement
  lists, and no trace (`traceAllowed` false). `quoteOf` on every Sales path: find (purpose and seller in the query, the assignment ids),
  get (missing and unauthorized both `quoteFound` false), the line verbs and `update#Quote` (`requireQuote` edit, the draft and the
  revision, `QUOTE_NOT_DRAFT`, `REVISION_REQUIRED`/`REVISION_CHANGED`), explain, the palette (find#Quotes), the record kind and
  `get#RecordLink` (Sales only for one who sees it), Customer360's and OpportunityDetail's lists; an entered price keeps its basis,
  reason, actor and date, and a quantity change keeps it. Products' `salesContext()` grants no edit, cost, supplier price, margin,
  method or stock action; PriceExplain's Sales branch gives a rep the line's safe explanation and no trace form. No cost or margin
  in `get#Quote`, the template or the explanation.
- Fixed:
  - R1 (high, confidentiality): `get#RecordLinkInfo` showed a draft quote's Chatter and files by the order rule (any agent of the
    seller, and the customer's party). A quote not yet placed and its OrderContent now follow Sales' scope for every caller
    (`mantle.order.SalesQuoteServices.check#QuoteAccess` over `quoteOf`, as a deal's `check#OpportunityAccess`); a placed order keeps
    the order rule. SalesQuoteDrafts checks the rep, approver and manager see it and another team's rep and another organization's do
    not (fails on the unfixed code).
  - R2 (medium, F54): the P6 lifecycle participant now lists a leaving user's open quotes (Open, Requested or Proposed, never placed;
    `quote:orderId`) and moves the owner row under `SALES_OWNER_CHANGE` to one who works for the seller, keeping team and contact;
    the owner row is undated, so the old row is removed and the move logged, as a deal's is. SalesWorkspace checks the listing, the
    move, a cancelled quote refused (RECORD_CLOSED) and a new owner elsewhere refused (NOT_EMPLOYED).
  - R3 (low): under the seller's authority a price rule based on another list read it through PricePolicy's reader check, so a rep
    without `PRICE_VIEW` was refused the line; `listOf` reads it as the seller's authority (still kept to the seller's published
    lists). SalesQuoteDrafts' base-list feature fails on the unfixed code.
  - R4 (low): `get#Quote`'s tax note tells a storeless quote with no address of its own that choosing one in Edit quote taxes it.
- Findings, numbered by the lead F151 to F155 in order:
  - X1 retaxes a storeless quote at the customer's party address only on the quote's next change: a customer address added after the
    last change leaves the draft untaxed until then (the note says so). P10's issue should recalculate tax before it issues.
  - `calculate#OrderSalesTax` itself has no status or billing guard, for a store order as before and now for a storeless one of a
    gateway seller; the change rules guard it, but mantle.rest.xml's `orders/{orderId}/salesTax/calculate` reaches it directly for a
    REST user with that grant.
  - `modify#ProductPriceList` declares `pricingContext` (a Map) and is `allow-remote="false"`: an in-process caller passing one could
    set `storeAuthority` or `sellerAuthority`; no screen or service does today (Shop's pattern, not P7's).
  - find#Quotes' `state: all` includes a quote placed later, so OpportunityDetail's Quotes box and its Orders box will both show an
    accepted quote once P11 places one; P11 to decide which list owns it.
  - The Built note's findings stand but the two fixed here (Chatter and files, R1; the lifecycle transfer, R2).
- Tests run (release binary, `--nobuild`, this worktree's runtime): mr-mantle StorelessOrderTax 3, SalesQuoteDrafts 6 (about 2.1 s),
  SalesWorkspace 4 and with them AccountingReturns, ReturnPolicies, OrderToCashBasicFlow, ReturnToResponseBasicFlow, AccountingTax,
  ProductPriceLists, ShopCatalog, ProductEffectivePrices, StoreCheckout, WorkProjectMilestones, WorkProjectClients, ShopCheckout,
  OrderConfirmations, Subscriptions, OrderChanges, OrderLifecycle, StoreOperations, CartRecovery, StoreEmailOnce, SalesAccounts,
  SalesOpportunities, RecordVisibility and SalesOrganizationScope: 216 of 216 (29 specs with dependencies, 66 s). mr-boss SalesQuotes,
  SalesAccess, SalesAccounts, SalesOpportunities, SalesHome, QuickCreate, AccountingCollections, AccountingReceivables, AccountingTax,
  CustomerServiceOrders, CommerceOrders, PurchasingOrders, ProductsPriceLists, ProductsSharedContext, ProductsInventory,
  InsightsRecords, ClientBilling, ProjectsAccess, Chat and RecordFiles: 173 of 173 (21 specs, 59 s). R1's and R3's checks were run
  against the unfixed code and failed there. Prettier clean on the changed JavaScript. Not run: test-apps, test-framework, acceptance.
- For the lead:
  - budget share: mr-mantle up about 0.3 s (SalesQuoteDrafts' sixth feature, SalesWorkspace's quote moves); mr-boss unchanged;
  - merge hot spots beside the Built note's: mr-mantle `service/mantle/party/CommunicationServices.xml` (a quote block in the
    description and in `visible`, after the deal's rule), `service/mantle/sales/SalesWorkspace.js` and `SalesWorkspaceServices.xml`,
    `service/mantle/order/SalesQuoteServices.xml` (`check#QuoteAccess`); mr-boss `plan/impl-sales.md` (§4's row, P9's text);
  - the user's call on the free line is recorded (§4 Nov 13, 2026; P9's text): P7 keeps `SALES_APPROVE` for an entered zero or free
    line; P9 makes it an approval rule;
  - Attack-Surface (mr-moqui `docs/security/Attack-Surface.md`), beside Shop's store authority: "- Sales' quote lines are priced by
    `mantle.product.PriceServices.get#SellerProductPrice` (`allow-remote="false"`), the selling organization's authority: the public
    price rows, the seller's and the customer's own, and the seller's published price lists (a rule's base list included), for a
    caller without `PRICE_VIEW`; never an agreement's row or list, an average cost or another party's row, and no trace. Only
    `mantle.order.SalesQuoteServices` calls it, after its own checks of the seller (the caller's sales scope), the customer (an
    account of it) and the quote (assigned to the caller or their team, or the organization's for `SALES_TEAM_VIEW`)."

### P8 — Requests for quote

Design §5 QuoteRequests and QuoteRequestDetail, §6's chargeable repair handoff; SAL-QUOTE, SAL-MAIL-INTAKE.

- **Mantle Q:** `find#QuoteRequests`, `create#QuoteRequest` (an `RqtQuote` Request with its RequestParty roles, over
  `create#Request`; from a message, with the message and its files linked), `create#QuoteFromRequest` (selected
  items, the request's stamp; one quote and its source links atomically, the same key returning it; an authorized
  `RqtWarranty` source keeps its decision and scope and exposes none of it), `decline#QuoteRequest`. The
  `ErActCreateQuoteRequest` mail action. The request rules type-guarded for `RqtQuote` (F31, F63): RequestTriageNotice
  and `complete#RequestFromWork`'s type list leave it out; the case rules need no guard, since a request is a case only
  in a service queue or of a type an organization service-enables.
- **Shared screens:** the Sales context of Shared/RequestDetail (crosscut §3.11's row), a branch before its Commons
  fall-through (F68), and "Create RFQ" as a `create-from` kind on a chat message and in the mail `message-actions` slot P5 made
  Mail render (§4, Nov 13).
- **Screens:** QuoteRequests (QuoteRequestFind, QuoteRequestList, NewQuoteRequest); QuoteRequestDetail.
- **Specs:** Mantle `test/order/SalesQuoteRequests` (one request for a message delivered twice; a quote from selected
  items with its links; the same key no second quote; an RqtQuote not triaged; a warranty source's diagnosis absent
  from the quote); BOSS `SalesQuoteRequests` (QuoteRequestDetail's one qvt render in the Sales context).
- **Usable when** (`test/acceptance/Sales/SalesRfqUsable`): mail to the RFQ address becomes a request with its attachment;
  a rep makes a quote from two of its three lines and a second quote later; a declined RFQ notifies the requester
  after the recipient preview; a warranty claim's chargeable lines become a quote Customer Service can read.

**Built Nov 13 (P8).** mr-mantle and mr-boss on branch `sal/p8` (hashes in the worker's reply); mr-moqui unchanged, no Rust built.
- Checked first (the code over the plan): P5 and P7 Built and Review notes, §4's Nov 13 rows, F53–F155; the request model (RequestEntities,
  `create#Request`, `create#RequestFromEmail`, `file#RequestEmail`, `send#IntakeConfirmation`, RequestTriageNotice and
  `notify#RequestTriage`, `complete#RequestFromWork`, the case rules); Purchasing's RFQs (Sourcing.js: the organization the OrgInternal
  RequestParty); Customer Service's warranty claims (Warranty.js, WarrantyDecision: a claim's order evidence is its RequestRecord to
  OrderHeader, read as the first such link); P5's createLead path (SalesIntake.js `intakeTeam`, `userHolds`, `check#LeadRuleOwner`),
  SalesComms.js and `create#FromChat`; Shared/RequestDetail's app branches (F68); the record visibility rules of
  CommunicationServices; PaletteServices `get#RecordLink`. The code over the plan:
  - a quote is linked to its request line by line (RequestItemOrder), not by a RequestRecord: on a warranty claim a RequestRecord to an
    OrderHeader would be read as the claim's order evidence (Warranty.js `evidenceOf`);
  - the RFQ's owner and team are SalesRepresentative and SalesTeam rows, as a quote's part, not the design's "assignee"; its scope is a
    quote's (SalesAccess.js `quoteRequestOf`), and the RFQ follows Sales' scope for Chatter, files and record links in every app
    (`check#QuoteRequestAccess`, a block in CommunicationServices' visibility beside the quote's);
  - the plan's four Q services needed five more for the screen and the rule: `get#QuoteRequest`, `create#QuoteRequestFromEmail` (the
    rule action), `store#QuoteRequestItem` (the lines a mailed request is given), `update#QuoteRequest` (the facts and Assign) and
    `preview#QuoteRequestDecline` (the recipient preview), with `check#QuoteRequestAccess`;
  - "the request's stamp" is the latest `lastUpdatedStamp` of the request, its lines and its parties (`requestRevision`), so a line or
    an assignment changed since the read is seen; `notify#RequestTriage` leaves RqtQuote out too (as it does RqtHrCase), beside the EECA;
  - Customer Service has no "request a sales estimate" action: a claim whose current decision has a charge estimate is the source by
    itself, listed under RFQs' "Repairs to quote".
- Mantle:
  - `service/mantle/order/SalesQuoteRequests.js` (new) and `SalesQuoteServices.xml` (a P8 block at the end): `find#QuoteRequests` (states
    awaiting, quoted, open, declined, completed, all; overdue; organization, customer, owner or mine, team, text; paged in the query; kind
    repair: the chargeable claims of the scope), `get#QuoteRequest` (a repair source answers its customer and its lines' products and
    quantities alone), `create#QuoteRequest` (from a mail, internal or chat message read as the user before anything is written; the same
    message, by its Message-ID ignoring case or its event, answers the same request, REQUEST_TAKEN to one who cannot open it; the sender
    matched to an account or to the contact of exactly one account, never a party), `create#QuoteRequestFromEmail` (the rule action: owner
    holds SALES_QUOTE_EDIT, RULE_NOT_ALLOWED; the team by value or plus tag, TEAM_UNAVAILABLE; answers stopProcessing), `store#QuoteRequestItem`,
    `update#QuoteRequest` (OWNER_INVALID, TEAM_UNAVAILABLE, CUSTOMER_INVALID, CONTACT_INVALID; replaced party rows ended),
    `create#QuoteFromRequest` (one quote through SalesQuotes.js `createQuote` and `storeLine`, each line's RequestItemOrder, atomically;
    a PostingOperation key, OPERATION_KEY_CONFLICT; REVISION_CHANGED, ITEMS_REQUIRED, ITEM_UNAVAILABLE, ITEM_PRODUCT_REQUIRED,
    CUSTOMER_REQUIRED, REQUEST_CLOSED; an RFQ's first quote puts it In progress; a claim is kept as it is, its quote "Repair estimate" with
    no line description), `preview#QuoteRequestDecline`, `decline#QuoteRequest` (REASON_REQUIRED, RECIPIENT_CHANGED, NOTIFY_UNAVAILABLE;
    a RequestNote, Cancelled with RrRejected; the mail a draft of the mailbox the RFQ came in by, answering its first message, filed on it
    and delivered), `check#QuoteRequestAccess`; `quotesOfRequest` for Customer Service.
  - `SalesAccess.js` (a P8 block after P7's): `quoteRequestType`, `quoteRequestRoles`, `requestParties`, `assignedQuoteRequestIds`,
    `quoteRequestOf`, `requireQuoteRequest`.
  - `data/SalesIntakeData.xml`: ErActCreateQuoteRequest (`createQuoteRequest`). `SalesIntake.js`: `check#LeadRuleOwner` refuses a
    createQuoteRequest action of an owner without SALES_QUOTE_EDIT; exports `intakeTeam`, `userHolds`, `subjectName`, `plainText`.
  - F31, F63: `entity/Request.eecas.xml` RequestTriageNotice and `RequestServices` `notify#RequestTriage` and `complete#RequestFromWork`
    leave RqtQuote out; the case rules unchanged.
  - `CommunicationServices.xml`: an RqtQuote request and its RequestContent seen by `check#QuoteRequestAccess` alone.
  - Owner contract with Customer Service: `Warranty.js` `get` and `get#WarrantyClaim` answer `salesQuotes` (state, total, validity).
  - `SalesWorkspace.js` `get#SalesHome`: the RFQs awaiting a response counted (the list's filter, Quotes/QuoteRequests state awaiting),
    no longer "Not configured".
- BOSS:
  - Screens: `Sales/Quotes/QuoteRequests.xml` (new: QuoteRequestFind, QuoteRequestList with the saved lists Awaiting a response, Open,
    Quoted, Overdue, Declined, Repairs to quote, NewQuoteRequest); `Sales/Quotes.xml` mounts Shared/RequestDetail as QuoteRequestDetail;
    `Shared/RequestDetail.xml` (owner contract: the Sales branch before the Commons fall-through, its transition-includes and section,
    Sales in the not-found list) over `template/SalesQuoteRequestDetail.xml` (new) and `template/SalesQuoteRequests.xml` (new: createQuoteRequest,
    rfqChoices, rfqStoreItem, rfqUpdate, rfqCreateQuote, rfqDecline); `Sales/Home.xml` (the RFQ card counted); `Sales.xml` (an RqtQuote
    request a record panel host).
  - `Sales.js`: linkPaths Quotes/QuoteRequests and Quotes/QuoteRequestDetail, the record kind `quoteRequest`, the palette's RFQs.
    `PaletteServices` `get#RecordLink`: an RqtQuote request opens under Sales for its reader, else nowhere.
  - Create RFQ (§4 Nov 13): `screen-extend/basic-comms` Inbox/Mail `sales.createRfq` (message-actions, createRecord, hook create-from) beside
    Create lead, and Chat `sales.createRfq`; `ChatServices.create#FromChat` kind quoteRequest; `ContextServices` `create#QuoteRequestFromMessage`
    over `SalesComms.js` `quoteRequestFromMessage` (Mantle's create#QuoteRequest as the user).
  - Owner contract: `CustomerService/Returns/WarrantyAssessment.xml` shows the claim's Sales quotes.
  - Demo (`data/BossZSalesDemoData.xml`, a P8 block): the RFQ rule on Retail's intake mailbox (sequence 5, sales+rfq@, East), Wingtip's
    mailed request for counters taken by it, and sales.rep's phoned Wingtip stockroom request (three lines, one with no product).
    No setup rows: the RFQ services are under the root's grants (ironstone.sales is BOSS_SALES').
- Specs:
  - Mantle `test/order/SalesQuoteRequests` (new, 4 features, 2.1 s): a mail delivered twice (two Message-ID cases) one request in the
    plus-tag team's queue with the account's contact matched, the message on it, a rule owner without SALES_QUOTE_EDIT refused, Projects'
    triage taking a support request of the organization but not the RFQ, the team's rep and the manager seeing it, another team's rep
    and another organization's not (list, detail and record link); a quote from two of three lines with RequestItemOrder links, the
    same key the same quote, a stale revision refused, a second quote later, a reader and another organization's rep refused, the RFQ In
    progress and not completed; a decline's preview, a changed recipient and no reason refused, the mail answering the first message
    and filed, Cancelled and Rejected with the reason noted, a second decline REQUEST_CLOSED; a chargeable claim's quote without its
    diagnosis or fault text in the source or the quote, the claim and decision untouched, quotesOfRequest reading it, a covered claim no
    source and another organization's rep not listing it.
  - mr-boss `test/Sales/SalesQuoteRequests` (new, 3 features, 1.2 s): Create RFQ in Mail's and Chat's ext items, posted through
    createRecord: refused to sales.rep3 (who does not read the mailbox) as for a missing message with nothing written and to another
    app's user, then the rep's request with Wingtip matched, once; QuoteRequestDetail's one qvt render (header, Create quote, lines, the
    line with no product, Decline, Chatter and Files, no Reassign), its record link under Sales and none for another organization's rep,
    who is told "Request not available" (html); RFQs' one html render. `SalesSpecLib.js`: quotesMenu, rfqs.
  - Acceptance, written and not run: `test/acceptance/Sales/SalesRfqUsable` (4 features: a mailed RFQ with its attachment; three lines added
    and two quotes through QuoteRequestDetail's transitions; a decline telling the requester at the previewed address; a chargeable
    claim's quote read back by Customer Service on get#WarrantyClaim).
- Tests run (release binary, `--nobuild`, this worktree's runtime): mr-mantle SalesQuoteRequests 4 of 4, with SalesLeadIntake,
  SalesWorkspace, SalesQuoteDrafts, SalesOpportunities, RecordVisibility, RecordLinks, WorkProjectRequests, PeopleCases, SupportWarranty,
  MaintenanceIntake, SupportCases, SupportSla, PurchaseRequests and Sourcing 117 of 117 (15 specs); mr-boss SalesQuoteRequests 3 of 3, with
  SalesHome, SalesAccess, SalesIntake, SalesQuotes, SalesOpportunities, Chat, Inbox, CommsHome, CustomerServiceChannels,
  CustomerServiceWarranty, CustomerServiceAccess, CustomerServiceCases, ProjectRequests, Requests, PurchasingRequests, MaintenanceRequests,
  ManufacturingDowntime, PeopleAccess, WarehouseTransfers and QuickCreate 177 of 177 (21 specs), and after the record link change
  PurchasingAccess, CustomerServiceAccess, CommerceAccess, PeopleAccess, CommerceOrders, ProjectRequests, AccountingAccess, ProductsAccess,
  Chatter, Requests and SalesOpportunities 150 of 150. The demo loads with no data file failing. `moqui lint --screens` (release): 141
  flagged sites, as before. Prettier clean on the new and changed JavaScript. Not run: ./moq test-apps, test-framework, the acceptance
  suite.
- Findings, numbered by the lead F170 to F178 in order:
  - the createQuoteRequest rule's owner must hold SALES_QUOTE_EDIT, when the rule is saved and when it runs, applying the user's Nov 13
    call on createLead by analogy (check#LeadRuleOwner extended); the user's to confirm;
  - a chargeable repair's claim is seen (its customer and products, under "Repairs to quote") by every holder of SALES_QUOTE_EDIT or
    SALES_TEAM_VIEW of the claim's organization, with no assignment scope (a claim has no Sales owner or team), and Customer Service is
    not told when a quote is made, nor Sales when a claim becomes chargeable (no topic); whether to narrow it to a team or add a notice is
    the user's call;
  - Create quote prices each line by the resolver: an unpriced product refuses PRICE_UNAVAILABLE and the rep enters prices on the quote;
    `create#QuoteFromRequest` takes an entered price and reason per line by its API only (a repair's charge), and a claim carries the
    faulty product, not a repair service, so a repair's line is that product at the price entered;
  - Customer Service reads a repair quote's state, total and validity on the claim (get#WarrantyClaim `salesQuotes`), not the quote:
    OrderDetail, Chatter and files of an unplaced quote follow Sales' scope (P7 review R1), and the customer's consent is still
    recorded on the decision by hand;
  - a decline is sent from the mailbox the RFQ came in by, written as the system after Sales' checks: the rep need not be a sender of
    that mailbox (as send#IntakeConfirmation); an RFQ of no mailbox cannot tell its requester from Sales;
  - an RFQ's notes (the decline's reason) are RequestNotes the Sales context does not show; Customer360's RFQs tab, OpportunityDetail's
    RFQ → quote → order strip, Quotes' "RFQ received" list and NewQuote's RFQ field (design §3, §4, §5) are not built;
  - Sales' lifecycle participant (P6) does not move a leaving user's RFQ owner rows, as it now does quotes' (P7 review R2);
  - `moqui lint --screens` counted a gstring idiom in RequestDetail's actions script because a `//` comment held apostrophes (moqui-devkit
    groovy_convert `string_spans` reads a quote in a comment as a string); the comment was reworded;
  - `docs/security/Attack-Surface.md` (mr-moqui) says the RFQ address "follows in Sales P8"; P8 had no mr-moqui worktree (the line below).
- For the lead:
  - budget share: mr-mantle about 2.1 s (SalesQuoteRequests); mr-boss server about 1.2 s (SalesQuoteRequests); client none;
  - merge hot spots (Sales P9 builds beside P8): mr-mantle `service/mantle/sales/SalesAccess.js` (a P8 block after P7's, and the export
    list), `service/mantle/order/SalesQuoteServices.xml` (a P8 block at the end), `SalesIntake.js` (check#LeadRuleOwner, the exports),
    `SalesWorkspace.js` (salesHome's counters), `CommunicationServices.xml` (the visibility block after the quote's), `RequestServices.xml`,
    `entity/Request.eecas.xml`, `Warranty.js` and `WarrantyServices.xml`; mr-boss `data/BossZSalesDemoData.xml` (a P8 block after P7's;
    no BossSetupSalesData change), `service/ironstone/sales/Sales.js` (linkPaths, recordKinds before `contact`, a searchFinds push before
    `search`), `ContextServices.xml` (a P8 block at the end), `SalesComms.js`, `screen/Sales.xml` (panelHosts only; no menu change),
    `screen/Sales/Quotes.xml` (subscreens: P9's Approvals joins this area), `screen/Sales/Home.xml`, `screen/Shared/RequestDetail.xml`,
    `service/ironstone/comms/ChatServices.xml`, `screen-extend/basic-comms/screen/BasicComms/{Inbox/Mail,Chat}.xml`,
    `service/ironstone/commons/PaletteServices.xml`, `screen/CustomerService/Returns/WarrantyAssessment.xml`, `test/Sales/SalesSpecLib.js`
    (quotesMenu, rfqs), `plan/ss-inventory.md`, `plan/usl-inventory.md`, `plan/design-sales.md` §1.4, §5, `plan/design-customer-service.md`;
  - mr-moqui `docs/security/Attack-Surface.md`, the intake paragraph's RFQ clause for the lead to replace: "the request for quote address
    (`createQuoteRequest`, Mantle `create#QuoteRequestFromEmail`) takes the team the same way, its rule's owner holding
    `SALES_QUOTE_EDIT`, and makes an RqtQuote request in that team's queue with the message and its files on it, never a party (the
    sender is matched to an account or to the contact of exactly one account of the organization); the same `Message-ID` again makes
    no second request";
  - the user's call: the rule owner's permission and the repair sources' reach (above).

**Review 2026-11-14 (P8).** A fresh review of `sal/p8` (mr-mantle f60a8505, mr-boss 3b8cea0a), with master merged in first (Marketing
P2) and again after Sales P9 merged (conflicts in SalesQuoteServices.xml, BossZSalesDemoData.xml, Sales.js, Sales.xml, SalesSpecLib.js
and usl-inventory.md, both phases' blocks kept; SalesSpecLib's approver tabs are now Quotes, RFQs, Approvals), against P8, §2, §4, design
§5 and §6.
- Checked and sound:
  - `quoteRequestOf` is the one scope on every Sales path: find#QuoteRequests (the organization filter, then the assigned ids or
    SALES_TEAM_VIEW, each page row read again through it), get#QuoteRequest (requestFound false for another team's or organization's),
    Home's count (find#QuoteRequests itself), the palette (Sales.js searchFinds over find#QuoteRequests), the record link (Sales.js
    recordLink reads recordKinds' quoteRequestOf; PaletteServices sends an RqtQuote nowhere else), the record panel host (Sales.xml
    panelHosts through recordKinds), Chatter and RecordFiles (CommunicationServices' RqtQuote block over check#QuoteRequestAccess, no
    user none) and RequestDetail's Sales branch (get#QuoteRequest; "Request not available" otherwise). Every write checks
    SALES_QUOTE_EDIT, the request's revision (request, lines and parties) and that it is open; update#QuoteRequest ends replaced party
    rows; owner and team are bounded by the caller's teams unless SALES_TEAM_MANAGE.
  - Create RFQ and the mail rule: create#QuoteRequest checks Sales, SALES_QUOTE_EDIT and the organization, then reads the message as the
    user (get#Thread, get#InternalThread, findOrCreate#ChatCommunicationEvent) before anything is written, a message they cannot read
    answering as a missing one (the BOSS spec's sales.rep3); the sender is matched to an account or the contact of exactly one account,
    never a party made; Message-ID ignoring case and the event make one request; a repeat of a request the caller cannot open is
    REQUEST_TAKEN naming none (P5 R1's lesson). create#QuoteRequestFromEmail is allow-remote false, fixes every value from the stored
    message, checks the owner's SALES_QUOTE_EDIT each run and takes only a team of an organization the owner works for.
  - The chargeable repair handoff: an RqtWarranty claim is a source only with a current chargeable decision (or a quote already made),
    answered by its customer and its lines' products and quantities; the quote is "Repair estimate" with no line description or date;
    the claim and its decision are not changed; a quote is linked by RequestItemOrder, which Warranty.js does not read (its order
    evidence is RequestRecord). Customer Service sees the quote's state, total and validity only (get#WarrantyClaim `salesQuotes`,
    WarrantyAssessment's box, no link to the quote). SupportWarranty and CustomerServiceWarranty pass unchanged.
  - F31, F63: RequestTriageNotice, notify#RequestTriage and complete#RequestFromWork leave RqtQuote out beside RqtHrCase; the case rules
    need no guard; the Mantle spec shows Projects' triage taking a support request but not the RFQ.
  - Decline: the reason is required and noted, the recipient is the first received message's Reply-To or From (else the contact's or
    customer's email) and must be the one previewed (RECIPIENT_CHANGED), the text is the rep's own, and the request closes, so one mail
    per RFQ; a send that fails waits in the Outbox.
- Fixed:
  - R1 (confidentiality, medium). An RFQ was also a Commons request: its filer or owner found it in Commons' Requests (and a Projects
    triage list of an organization triaging RqtQuote) and could cancel or edit it there, around decline's reason and Sales' rules.
    Commons' get#RequestAccess and find#RequestRows and Projects' request list now leave RqtQuote out as they do RqtPurchaseRfq. BOSS
    SalesQuoteRequests: the rep's own RFQ is not visible to Commons' access and is in no Commons list (failed on the unfixed code).
  - R2 (authority, medium). decline#QuoteRequest sent the rep's own text as the system from the mailbox of the RFQ's first received
    message, whatever the mailbox: a rep who could only read a mailbox (Create RFQ needs reading alone) could mail its correspondents
    from it. Sales now answers only from an RFQ intake mailbox (an enabled createQuoteRequest rule whose owner holds SALES_QUOTE_EDIT
    runs on it) or one the rep may send from; otherwise the preview says to tell the requester yourself and a notify is
    NOTIFY_UNAVAILABLE. Mantle SalesQuoteRequests: with the mailbox's rule off the preview cannot notify and the decline is refused.
  - R3 (scope, low). A request's quotes listed every quote made from it by title, and the list counted them: a quote of another
    assignment (a manager's, which takes no team) gave its title and count to the RFQ's team. Such a quote now shows only that it exists
    ("A quote you cannot open", no total), its id is left out of the line's "quoted in", and find#QuoteRequests counts readable quotes.
    Mantle SalesQuoteRequests: the manager's quote of the rep's RFQ (failed on the unfixed code).
  - R4 (confidentiality, low). "Repairs to quote" searched and sorted claims by their name, which is Customer Service's and often the
    fault: a search probed the claim's text. A repair is found by its id and sorted by date only. Spec: a search for the fault word finds
    nothing, the claim's id finds it.
  - R5 (low). A message on two RFQs (one of another organization's mailbox) answered REQUEST_TAKEN when the first found was not the
    caller's; the one the caller sees is answered first.
  - R6 (the user's calls of Nov 13, §4). The repair notices both ways: decide#WarrantyClaim's commit runs notify#RepairToQuote
    (service/SalesQuoteRequest.secas.xml; a replay tells nobody), which tells the current members of the organization's default team
    (P9's SalesPolicy, `SalesApprovals.js policyOf`) who work for it and hold SALES_QUOTE_EDIT or SALES_TEAM_VIEW (SalesRepairToQuote:
    claim, customer, product); no default team, no notice (logged). create#QuoteFromRequest on a claim tells its assignee, else its
    queue's team or fallback assignee, not the maker (SalesRepairQuoted: quote, claim, customer, maker; the claim as the record). Topics
    in data/SalesIntakeData.xml with TopicRegistration rows (Sales, Customer Service); links in BossSetupSalesData.xml (QuoteRequestDetail)
    and BossSetupData.xml (WarrantyAssessment); the shells' notification-topic entries. Mantle SalesQuoteRequests: the chargeable
    decision tells East's quote maker and not its SALES_VIEW member, a covered one nobody, the quote tells the claim's agent, no title
    with the fault or the amount. The rule-owner call needed no change.
- Findings, numbered by the lead F179 to F182 in order:
  - a quote made from an RFQ takes its maker's team (SalesQuotes.js teamFor), not the RFQ's: a manager's quote of a team's RFQ is no
    quote of that team, whose members see only that it exists (R3); passing the RFQ's team to createQuote is the user's call;
  - Message-ID dedupe is instance-wide, as P5's leads (F122): a mail carrying another's Message-ID makes no RFQ, and a rule on another
    organization's mailbox answers the first organization's request; a decline goes to the message's Reply-To, as forgeable as its From,
    shown in the preview;
  - with no default team in the organization's SalesPolicy a chargeable decision tells nobody (the list still shows it);
  - update#QuoteRequest given a new customer alone ends the contact row.
- Tests run (release binary, `--nobuild`, this worktree's runtime): before the P9 merge mr-mantle SalesQuoteRequests 4 of 4 (2.6 s) and
  mr-boss SalesQuoteRequests 3 of 3; after it mr-mantle SalesQuoteRequests, SalesQuoteApprovals, SalesQuoteDrafts and SupportWarranty 20
  of 20, and mr-boss SalesQuoteRequests, SalesApprovals, SalesQuotes, SalesAccess, CustomerServiceWarranty, Requests, ProjectRequests and
  SalesHome 46 of 46. R1 and R3 checks failed on the unfixed code (the stepwise spec stops at R3's feature, so R2's, R4's and R6's ran
  only on the fixed code). Prettier clean on the changed JavaScript; `moqui lint --screens` (release) flags neither Sales.xml nor
  CustomerService.xml. Not run: ./moq test-apps, test-framework, the acceptance suite.
- For the lead:
  - budget share: mr-mantle about +0.5 s on the Built note's (SalesQuoteRequests' manager quote, previews and notices); mr-boss about
    +0.1 s (the Commons checks);
  - merge hot spots: mr-mantle `SalesQuoteRequests.js`, `SalesQuoteServices.xml` (notify#RepairToQuote at the P8 block's end, before
    P9's), `data/SalesIntakeData.xml` (the two topics), `service/SalesQuoteRequest.secas.xml` (new); mr-boss
    `service/ironstone/commons/RequestServices.xml`, `service/ironstone/projects/ProjectRequestServices.xml`,
    `data/BossSetupSalesData.xml` (after P9's SalesQuoteApproval link), `data/BossSetupData.xml` (after WarrantyRepairFinished),
    `screen/Sales.xml`, `screen/CustomerService.xml`, `plan/design-sales.md` §5, `plan/design-customer-service.md` §13;
  - mr-moqui `docs/security/Attack-Surface.md`: in the intake paragraph replace "(`createLead`, Mantle `create#LeadFromEmail`; the
    request for quote address `createQuoteRequest` follows in Sales P8)" with "(`createLead`, Mantle `create#LeadFromEmail`)", and
    after "The mail text decides only the lead's name and description." add: "The request for quote address (`createQuoteRequest`,
    Mantle `create#QuoteRequestFromEmail`) takes the team the same way, its rule's owner holding `SALES_QUOTE_EDIT` when the rule is
    saved and each time it runs, and makes an `RqtQuote` request in that team's queue with the message and its files on it, never a
    party (the sender is matched to an account or to the contact of exactly one account of the organization); the same `Message-ID`
    again makes no second request. A decline is mailed as the system only from such an intake mailbox, or one the rep may send from,
    to the address the rep previewed, once per request.";
  - the user's calls are recorded in §4 (Nov 13 rows) and built (R6).

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
    the quote and no amount; BossSetupSalesData gives the topic its link to Sales' OrderDetail. OrderChangeApproval's
    link becomes Commons' `openRecord` link of the change request, and `PaletteServices.get#RecordLink`'s request
    branch opens a commercial change for a Sales approver in Sales (from P14) and in Customer Service otherwise: one
    topic, opened by recipient (F58; owner contract with Customer Service and Commons). Until an organization sets rules, a manual override on a quote made through Q needs an
    approver other than its author; the rule guards `propose#Quote`, not native order entry.
  - A free or zero-price line (§4 Nov 13, the user's call): P7's `SALES_APPROVE` check on entering one (`FREE_LINE_DENIED` in
    SalesQuotes.js `priceFields`) is replaced by a rule of SalesApprovalPolicy: the rep drafts the line with its reason, and
    `preview#Quote` names the approval it needs, decided at issue by an approver other than the author.
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
  it its detail (F58).
- **Specs:** Mantle `test/order/SalesQuoteApprovals` (an override over the rule needs the approver; self-approval
  refused; a decision at an earlier revision refused; a line change invalidates it; a file added does not; with
  the seller's approval setting off a Sales warning stops `autoApprove#Order` and not a person's `approve#Order`;
  an organization with no policy auto-approves as before); BOSS `SalesApprovals` (the list's one render with a
  quote's row and no amount in its title).
- **Usable when** (design §14.3 scenario 5, its approval half; `test/acceptance/Sales/SalesApprovalUsable`):
  `sales.admin` publishes a discount rule; a rep's override waits for `sales.approver`, who approves it from
  Approvals; the rep cannot approve their own; a direct service call cannot propose the unapproved quote.

**Built Nov 13 (P9).** mr-mantle and mr-boss on branch `sal/p9` (hashes in the worker's reply); mr-moqui unchanged, no Rust built.
- Checked first (the code over the plan): P6's and P7's Built and Review notes, §4 (the Nov 11 rows on OrderDecision, the approval
  setting and the pre-approval warnings, the acceptance threshold; the Nov 13 rows, the free line among them), F11, F14, F26, F43, F52,
  F58, F60, F61 and F144–F155; OrderDecision (OrderEntities.xml:319), `autoApprove#Order`, `approve#Order` and `check#OrderPreApprove`
  with the credit and purchase SECAs; Purchasing's approval rules (PurchaseApprovals.js: steps, `refusalFor`, `notify`,
  `clearNotices`, the `revisionChanged` SECA, the topic handlers); OrderChanges.js' deciders, notices and `decide`; the
  OrderChangeApproval topic and its BOSS link; Commons' `open#Notification` and `get#RecordLink`; Purchasing/Approvals.xml;
  SalesQuotes.js' free-line check; SalesSettings' readiness; SalesIntake's purge. The code over the plan:
  - `approve#Order` does not call `check#OrderPreApprove` (F11), so a Sales warning on that check stops `autoApprove#Order` and never
    a person's approval, with nothing more to build for "does not refuse that approval";
  - the approval verbs are a service file of their own, `mantle.order.SalesApprovalServices` (store#SalesPolicy, get#SalesPolicy,
    store#SalesCommercialRevision, store#SalesApprovalPolicy, find#SalesApprovalPolicies, preview#Quote, request#QuoteApproval,
    decide#Quote, the topic's approve#QuoteMessage and refuse#QuoteMessage, the two SECA services), so P8's quote-request verbs and
    these do not meet in SalesQuoteServices.xml; `propose#Quote` is SalesQuoteServices' (a P9 block), its approval guard built here,
    its issue checks P10's; the design's "Q." names hold as a package;
  - the plan names no request step: a notice is sent when the rep asks (`request#QuoteApproval`), not on every line change, and a
    holder of SALES_APPROVE sees a quote of their organization once its approval was asked (SalesAccess.js quoteOf, design §1.1 "an
    assigned approval grants its authorized approver the source projection");
  - the default pipeline is P2's (SalesPipeline.defaultFlag) and stays so; SalesPolicy holds the default team, not a pipeline;
  - the "approver role" is a user group holding SALES_APPROVE, as Purchasing's steps name one;
  - the commercial revision is the seller's own PartyAcctgPreference flag, which `find#PartyAcctgPreference` inherits from a parent
    organization: SalesDefaults sets it only on the seller's own row (PREFERENCE_INHERITED otherwise; the demo's Retail inherits ON from
    ORG_ZIZI_CORP);
  - SalesDefaults shows the defaults Sales reads today (validity, team, intake retention); the templates, response requirements,
    acceptance thresholds, the approval setting and the net-terms option are stored by store#SalesPolicy and join the form with P10,
    P11 and P13, which read them, so no field the user sets does nothing.
- Mantle:
  - `entity/SalesApprovalEntities.xml` (new): SalesPolicy and SalesPolicyThreshold (an organization's dated defaults, the acceptance
    thresholds per currency), SalesApprovalPolicy (dated rules: purpose SapQuote or SapOrder, type SarAmount, SarDiscount, SarPriceFloor
    or SarFreeLine, with SarOverride for the unconfigured manual-price rule; threshold and currency, discount percent, floor margin,
    approver group, self-approval), their key fields audit-logged with the change reason; OrderDecision extended with the order revision,
    organization, purpose, rule, rule type, evaluation time, result (SdrRequested, SdrApproved, SdrRefused), decider, reason text and
    operation key.
  - `service/mantle/order/SalesApprovals.js` and `SalesApprovalServices.xml` (new): policies published as dated successors (a preview
    writes nothing; REVISION_CHANGED, NO_CHANGE, DATE_INVALID, TEAM_INVALID, TEMPLATE_INVALID); rules (THRESHOLD_REQUIRED,
    PERCENT_INVALID, APPROVER_INVALID, RULE_ENDED; another organization's rule as missing); the evaluation (each rule a quote meets at
    its revision, its inputs as text, the lines and their authors; a floor's cost from the approved standard cost, else the seller's
    average cost, never answered; a currency other than an amount rule's does not meet it); the states (required, requested, approved,
    refused) from the decisions at the revision; separation (owner, requester, a priced line's actor) unless the rule allows; the
    approvers (SALES_APPROVE holders who work for the seller, in the rule's group); `decide#Quote` (SALES_APPROVE, the quote's
    organization, a draft, unexpired, the revision named, APPROVAL_NOT_NEEDED, SELF_APPROVAL, APPROVER_INVALID, the operation key);
    the notice (title of the quote, customer and the kinds of its rules, no amount) and its handlers at the message's revision;
    `freeLineCovered`; propose's guard (APPROVAL_REQUIRED, LINES_REQUIRED).
  - `service/SalesApproval.secas.xml` (new): `OrderPreApproveSales` on `check#OrderPreApprove` (Sales' warnings for a seller with a
    rule in effect: an accepted quote's open quote rules, the order rules met) and `OrderRevisionSalesApproval` on
    `increment#OrderRevision` (a quote's commercial change invalidates its earlier decisions and reads their notices; any other order
    returns at once).
  - `data/MantleSetupData.xml`: the SalesQuoteApproval topic beside OrderChangeApproval (F26).
  - `SalesQuotes.js`: the free line (P7's SALES_APPROVE check now only where no rule covers the line, the user's call), get#Quote's
    `approval` and `canFreeLine`, create#Quote's validity from the policy's days and its team falling back to the policy's default team;
    `SalesQuoteServices.xml` (get#Quote's approval, store#QuoteLine's description, `propose#Quote`); `SalesAccess.js` (a P9 block:
    `approvalAsked` in quoteOf); `SalesIntake.js` (the purge holds each intake to its organization's retention, 30 when none);
    `SalesSettings.js` (readiness `sales.defaults` and `sales.commercialRevision`, fixed at `salesDefaults`).
- BOSS:
  - Screens: `Sales/Quotes/Approvals.xml` (the Commons list with SalesQuoteApproval and OrderChangeApproval, for SALES_APPROVE);
    `Sales/Settings/SalesDefaults.xml` (in effect, publish with preview, scheduled and earlier, the commercial revision) and
    `Sales/Settings/ApprovalPolicies.xml` (rules with New, Edit as the next version and End; a named quote's preview);
    `template/SalesOrderDetail.xml`'s Approval box and `template/SalesQuotes.xml`'s salesRequestApproval and salesDecideQuote, included
    by `Shared/OrderDetail.xml` (owner contract, beside the P7 includes); `Sales.xml` (the two topics in shell-providers);
    `Sales/Settings/Readiness.xml` (the two places).
  - `Sales.js` (P9 blocks): linkPaths Quotes/Approvals, Settings/SalesDefaults and Settings/ApprovalPolicies, the choice
    `approverGroups`, the record kind `orderChange` (a commercial change of the scope for a sales approver, opening Approvals until
    P14); `Admin.js` mountRoutes `salesDefaults` and `salesApprovalPolicies`.
  - F58 (owner contracts with Customer Service and Commons): OrderChangeApproval's link (BossSetupData.xml) is Commons' `openRecord`
    link of the change request; `PaletteServices.get#RecordLink` has an order-change branch: Customer Service's OrderChangeDetail for one
    who works orders there, else Sales' Approvals for a sales approver of a commercial kind, else nothing. One topic.
  - `data/BossSetupSalesData.xml` (a P9 block): SALES_APPROVE for BOSS_SALES_APPROVE (F43) in its bundle; BOSS_SAL_APPROVALS (Approvals
    denied to the root group, ALWAYS for the approver); the SalesQuoteApproval link to Sales' OrderDetail.
  - Demo (`data/BossZSalesDemoData.xml`, a P9 block): Retail's defaults (30 days' validity, 60 days' intake retention) and its two quote
    rules, a discount of 5 % or more (the Wingtip draft's entered refit price meets it) and a free line, each for BOSS_SALES_APPROVE;
    Ziziwork Sales sets none, so its manual prices meet the unconfigured rule.
- Specs:
  - Mantle `test/order/SalesQuoteApprovals` (new, 5 features, 2.2 s): defaults published as a successor with a preview, stale and
    rep refused, a new quote's validity from them, a rule's input refused, a rep refused a rule; an entered price over the rule needs
    approval, propose refused, the approver sees the quote once asked and is notified (the rep not; the title with no amount), the rep,
    another organization's approver, a stale revision and a lead who priced the quote refused, the approval with an operation key
    answered again, the notices read; a file leaves the approval current (commercial revision on), a line change supersedes it, the
    quote proposes once approved again; a free line refused where only an amount rule is set and admitted under a free-line rule or a
    discount rule; with the approval setting off a Sales order rule stops `autoApprove#Order` (a store order with a covering
    authorization) and not a person's `approve#Order`, and an organization with no rule auto-approves as before.
    `SalesQuoteDrafts`' free-line feature now has the rep's free line admitted under the unconfigured rule, the quote needing approval.
  - mr-boss `test/Sales/SalesApprovals` (new, 2 features, 0.6 s): the rep asks for the Wingtip draft's approval, the notice's title
    names the quote and Wingtip and no amount, Approvals' one html render as the approver has its row and no amount, the approver
    decides it; OrderChangeApproval's link (openRecord) opens Customer Service's OrderChangeDetail for its order desk, Sales' Approvals
    for the approver and nothing for a rep. `SalesAccess` (a P9 feature, 0.4 s; the approver's capabilities with `approve`): Quotes'
    tabs with Approvals for the approver only, Approvals refused a rep, decide#Quote refused a rep for the permission and the approver
    for another organization's quote, with the same parameters. `SalesQuotes`' one OrderDetail render shows the Approval box.
    `SalesSpecLib.js`: the Settings tabs with Defaults and Approval rules, Quotes' tabs for an approver, Retail's rule ids.
  - Acceptance, written and not run: `test/acceptance/Sales/SalesApprovalUsable` (3 features: sales.admin publishes a discount rule
    through ApprovalPolicies; a rep's quote over it waits, the rep cannot decide and a direct propose is refused; the approver approves
    from Approvals' approve transition and the quote proposes).
- Tests run (release binary, `--nobuild`, this worktree's runtime): mr-mantle SalesQuoteApprovals, SalesQuoteDrafts, StorelessOrderTax,
  SalesWorkspace, SalesLeadIntake, SalesPipelineSetup, SalesOpportunities, SalesAccounts, SalesOrganizationScope, SalesLeadQualify,
  RecordVisibility, OrderLifecycle, OrderChanges, PurchaseApprovals, PurchaseOrders, OrderToCashBasicFlow, ShopCheckout, StoreCheckout,
  StoreFulfillment, ShopCustomer, ShopSubscriptions, Subscriptions, AccountingReturns, ReturnPolicies, OrderConfirmations,
  StoreOperations, CartRecovery, WorkProjectMilestones and AccountingCredit 220 of 220 (31 specs with their dependencies); after the
  last changes SalesQuoteApprovals, SalesQuoteDrafts, SalesLeadIntake, SalesPipelineSetup, SalesWorkspace and StorelessOrderTax 26 of
  26. mr-boss SalesAccess, SalesAccounts, SalesApprovals, SalesHome, SalesIntake, SalesOpportunities, SalesQuotes, SalesReports,
  SalesSettings, CustomerServiceAccess, CustomerServiceOrderChanges, CustomerServiceOrders, CommerceOrders, CommerceAccess,
  PurchasingOrders, PurchasingAccess, AccountingCollections, ProjectsAccess, Chat, RecordFiles, Notifications, QuickCreate,
  AdminRegistries, AdminCapabilities, AdminSettings, InsightsRecords, ProductsSharedContext, MaintenanceAccess, PeopleAccess,
  WarehouseAccess and ManufacturingAccess 283 of 283 (32 specs). The demo loads with no data file failing. `moqui lint --screens`
  (release): 141 flagged sites, as before, none in a new or changed screen. Prettier clean on the new and changed JavaScript. Not run:
  the client walk (no screen it walks changed), ./moq test-apps, test-framework, the acceptance suite.
- Inventories: usl-inventory's "Added in the Sales build: defaults, approval policies and approvals" table; ss-inventory has no
  baseline form naming Sales' approvals, defaults or rules (the order approval forms are P11's), so no row changed.
- Design edits: design-sales §5 "As built (impl-sales P9)" after Approvals and a note under §9 ApprovalPolicies; design-crosscut §3.15
  (the SalesQuoteApproval row as built, OrderChangeApproval's link per recipient, the Sales row's service), design-drawers-commons §4
  (the SalesQuoteApproval row, the link) and design-customer-service §4 (Approvals' context: the link resolved per recipient), owner
  contracts.
- Findings, numbered by the lead F156 to F164 in order:
  - the approval setting, the templates, response requirements, acceptance thresholds and net-terms option are stored by
    store#SalesPolicy but shown on SalesDefaults only when P10, P11 and P13 read them; until then a configurer sets them through the
    service alone;
  - the commercial revision is set only on a seller's own accounting preference: Retail and the other Ziziwork organizations inherit
    ORG_ZIZI_CORP's, so SalesDefaults shows where it is set and does not change it there (Accounting's settings own that row);
  - a notice is sent when the rep asks for approval; a later line change supersedes the decisions and reads the notices, and the rep
    asks again (there is no automatic resubmission, unlike Purchasing's placed orders);
  - an approval by the topic's handler without a rule named decides every open rule the approver may decide; one the approver may not
    (another group's) stays open, and a refusal from the list refuses each;
  - a SapOrder rule warns on every sales order of its seller that meets it, store orders included, so with the setting off such an order
    waits for a person as §4 says; nothing yet records an order-purpose decision (P11's `approve#Order` direction);
  - an amount rule in one currency does not meet a quote in another (no conversion), as Purchasing's bands; design §9's "missing FX
    blocks" is not built;
  - `get#RecordLink`'s order-change branch sends a Sales approver to Approvals, not to the change, until P14's OrderChangeDetail;
  - the Approvals screen's own permission check runs in its always-actions before the artifact deny is reported, so a refused
    render names PERMISSION_DENIED rather than the authorization (the deny row holds: checked by `isPermitted`);
  - `docs/security/Attack-Surface.md` (mr-moqui) does not name the Sales approval verbs; all are `allow-remote="false"` and check
    SALES_APPROVE or SALES_CONFIGURE and the organization themselves; P9 had no mr-moqui worktree.
- For the lead:
  - budget share: mr-mantle about 2.2 s (SalesQuoteApprovals; SalesQuoteDrafts unchanged in time); mr-boss server about 1.0 s
    (SalesApprovals 0.6 s, SalesAccess' P9 feature 0.4 s); client none;
  - merge hot spots (P8 is built beside P9 on sal/p8): mr-boss `data/BossSetupSalesData.xml` and `data/BossZSalesDemoData.xml` (P9
    blocks after P7's), `service/ironstone/sales/Sales.js` (linkPaths' P9 entries after P7's, the choice and record kind in their own P9
    blocks), `screen/Sales.xml` (the comment and two notification topics in shell-providers), `test/Sales/SalesAccess.spec.js` (the
    approver's capabilities and a P9 feature at the end), `test/Sales/SalesSpecLib.js` (settingsMenu, approverQuotesMenu,
    approvalRules); also `screen/Shared/OrderDetail.xml` (two includes), `template/SalesOrderDetail.xml` and `template/SalesQuotes.xml`
    (P9 blocks), `service/ironstone/commons/PaletteServices.xml`, `service/ironstone/admin/Admin.js`, `data/BossSetupData.xml` (the
    OrderChangeApproval link), `plan/usl-inventory.md`, `plan/design-sales.md`, `plan/design-crosscut.md`,
    `plan/design-drawers-commons.md`, `plan/design-customer-service.md`; mr-mantle `service/mantle/order/SalesQuoteServices.xml` (a P9
    block at the end, get#Quote's output), `SalesQuotes.js`, `service/mantle/sales/SalesAccess.js` (a P9 block before requireQuote),
    `SalesIntake.js`, `SalesSettings.js`, `data/MantleSetupData.xml` (the topic after OrderChangeApproval);
  - Attack-Surface, a line for the lead: "- Sales' approvals (`mantle.order.SalesApprovalServices`, all `allow-remote="false"`):
    `decide#Quote` and the SalesQuoteApproval handlers need SALES_APPROVE in the quote's selling organization, the revision the
    approver read and an approver other than the quote's owner, requester or a priced line's actor unless the rule allows it; the
    defaults and rules need SALES_CONFIGURE for the organization; a price floor's cost is read on the server and never answered.";
  - nothing needs the user's call; the free line's rule is the user's call of Nov 13 as recorded.

**Review 2026-11-14 (P9).** A fresh review of `sal/p9` (mr-mantle dcb31310, mr-boss f0c1843d; master merged into each first, nothing
new on it) against P9, §2, §4 (the Nov 11 rows on OrderDecision, the approval setting and the warnings; the Nov 13 free line), design
§5 and §9, F11, F14, F26, F43 and F58.
- Checked and sound:
  - The owner contract: `OrderPreApproveSales` adds nothing for a seller with no rule in effect, so every existing caller auto-approves
    as before (ShopCheckout, StoreCheckout, ShopSubscriptions, OrderLifecycle, OrderToCashBasicFlow, WorkProjectMilestones,
    AccountingCredit, CommerceOrders and CustomerServiceOrders pass unchanged). `approve#Order` does not call the check (F11), so a
    person's approval is never refused. A store order meeting a SapOrder rule loses auto-approval (Built finding 5): that is §4 Nov 11
    ("Sales' own warnings do so too ... whichever app placed it ... only for a seller with the setting on or a Sales rule set").
  - The binding: decisions are read at the current revision only, and the `increment#OrderRevision` SECA marks the earlier ones
    invalidated, never deleted (no OrderDecision is deleted anywhere). What moves a quote's revision with the commercial revision on:
    a line's quantity, price or other field, a part change (validity, address, customer), an OrderPartParty change (an owner or team
    reassignment too), a part contact or term; a file, a note and a status-only change do not. With it off every change moves it,
    so an approval falls with a file (the readiness finding says so).
  - Separation: owner, requester and a priced line's actor refused unless the rule allows; another organization's approver sees the
    quote as missing; a stale or missing revision names the current one; an expired or proposed quote refused; the operation key
    answers the first result; `propose#Quote` refuses an unapproved quote. The notice's title and messageJson carry no amount, the
    topic is private, and the rep gets no notice.
  - The free line (the user's call): a rep drafts a free or zero line where a SapQuote free-line, discount or floor rule meets it, or
    while no quote rule is set (the manual-price rule); elsewhere `SALES_APPROVE` is still needed (FREE_LINE_DENIED). A floor's cost
    is read on the server and never answered.
  - F58: the one OrderChangeApproval link resolves per recipient: Customer Service's OrderChangeDetail for its order desk, Sales'
    Approvals for a sales approver of a commercial kind, nothing for a rep (CustomerServiceOrderChanges and SalesApprovals pass).
  - The defaults and rules: SALES_CONFIGURE and the organization on every writer and reader, dated successors, audit reasons; the
    Approvals screen checks SALES_APPROVE and its artifact deny holds.
- Fixed:
  - R1 (medium, approval integrity; Built finding 4): approving or refusing from the notice (the Approvals list, the Commons inbox)
    decided every rule open at the revision, a rule set after the notice was sent among them, and only those the approver might decide,
    while the framework then reads the notice for every recipient, stranding another group's rule with no notice. The notice now
    names its rules (`ruleKeys`), `approve#QuoteMessage` and `refuse#QuoteMessage` decide those only, and `decide#Quote` refuses
    unless the approver may decide every rule chosen (one rule from OrderDetail still decides that rule alone). The request is now a
    row per rule, so a rule set after a request shows as needing approval and the rep can ask for it (the earlier code left it
    "waiting" with no notice and refused a second request), and a request after a refusal shows as waiting. SalesQuoteApprovals' new
    feature fails on the unfixed code.
  - R2 (medium, scope): a holder of `SALES_APPROVE` admitted to a quote only because its approval was asked could change it when they
    also held `SALES_QUOTE_EDIT` (a lead who drafts quotes), then approve an amount rule over their own change. `quoteOf` gives such a
    reader `canEdit` false and `requireQuote`'s edit refuses it (PERMISSION_DENIED). Fails on the unfixed code.
  - R3 (low, confidentiality): Sales' pre-approval warnings carried the rule's threshold and the order's amounts into whatever reads
    `check#OrderPreApprove` (today the server log, from P11 the order screens); they now name the rule's kind and id only.
  - R4 (low, §2 revisions): `store#SalesPolicy` and `store#SalesApprovalPolicy` accepted a replacing write that named no revision; it
    is refused REVISION_REQUIRED (the screens pass it).
- Findings, numbered by the lead F165 to F169 in order:
  - any holder of `SALES_APPROVE` in the seller sees a quote once its approval was asked, also one outside the rule's approver group
    who cannot decide it (design §1.1 "its authorized approver"); narrow it to the approvers of its rules if wanted;
  - an owner or team reassignment of a quote (OrderPartParty) moves its revision and so ends its approvals, with the commercial
    revision on too; P10 and P14 may want it counted as not commercial;
  - OrderDetail's Approve and Refuse send no operation key (a double submit writes a second, identical decision); the list's goes
    through the notice once;
  - a rule ended after a free line was drafted under it leaves that line needing no approval when other quote rules remain (the
    manual-price rule applies only while none is set);
  - the Built note's findings stand but the fourth, fixed here (R1).
- Tests run (release binary, `--nobuild`, this worktree's runtime): mr-mantle SalesQuoteApprovals 6 features (about 2.7 s, was 2.2),
  SalesQuoteDrafts, SalesLeadIntake, SalesWorkspace, SalesPipelineSetup 24 of 24 (46 s); SalesQuoteDrafts, ShopCheckout, StoreCheckout,
  OrderLifecycle, OrderChanges, PurchaseApprovals, ShopSubscriptions, WorkProjectMilestones, OrderToCashBasicFlow, AccountingCredit,
  SalesOrganizationScope and StorelessOrderTax 122 of 122 (14 specs with dependencies, 69 s). mr-boss SalesApprovals, SalesAccess,
  SalesQuotes, CustomerServiceOrderChanges, CustomerServiceOrders and CommerceOrders 24 of 24 (33 s); SalesApprovals, SalesAccess,
  SalesQuotes, SalesSettings and Notifications 28 of 28 (57 s). R1's and R2's checks were run against the unfixed code and failed
  there. Prettier clean on the changed JavaScript. Not run: test-apps, test-framework, acceptance (SalesApprovalUsable unchanged; its
  approval from the list decides the one discount rule its notice names).
- For the lead:
  - budget share: mr-mantle about 2.7 s for P9 (SalesQuoteApprovals' sixth feature, 0.3 s); mr-boss as the Built note;
  - merge hot spots beside the Built note's: mr-mantle `service/mantle/sales/SalesAccess.js` (quoteOf's P9 lines and requireQuote),
    `service/mantle/order/SalesApprovals.js`; mr-boss `plan/design-sales.md` (§5's as built);
  - Attack-Surface (mr-moqui `docs/security/Attack-Surface.md`), the line: "- Sales' approvals (`mantle.order.SalesApprovalServices`,
    all `allow-remote="false"`): `decide#Quote` and the SalesQuoteApproval handlers need `SALES_APPROVE` in the quote's selling
    organization (a quote asked for approval is readable by such a holder, never editable through that), the revision the approver
    read and an approver other than the quote's owner, requester or a priced line's actor unless the rule allows it; a notice decides
    only the rules it named, and only when the approver may decide each; `request#QuoteApproval` and `propose#Quote` need
    `SALES_QUOTE_EDIT` on an assigned quote; the defaults and rules need `SALES_CONFIGURE` for the organization and name the revision
    they replace; a price floor's cost is read on the server and never answered; the pre-approval warnings name a rule, never an
    amount.";
  - nothing new needs the user's call; R1 follows the lead's preference (the notice decides only the rules it names).

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
    their build services, as cart recovery's is (CartRecoverySetupData.xml:14); the quote and reminder EmailTemplates,
    whose cover and reminder text is a `.html.fancy-locked` resource rendered by the body's and print's script with an
    explicit map (the quote, customer and rep names, issue and validity dates, totals as text, the link), inside the
    trusted `.html.fancy` body and print, as OrderConfirmations.js:144 renders (F70); the print header's QR of the quote link from P13 (the staff path until then).
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

**Built Nov 14 (P10).** mr-mantle and mr-boss on branch `sal/p10` (hashes in the worker's reply), with master (Sales P8) merged in first;
mr-moqui unchanged, no Rust built.
- Checked first (the code over the plan): P7's and P9's Built and Review notes, P8's merged code, §4 (the commercial revision row, the
  acceptance threshold, the build order), F9, F10, F15, F16, F70, F151, F166 and F167; `increment#OrderRevision` and the revision EECAs,
  `handle#OrderPartChange`, `propose#Order`, `place#Order`, `cancel#Order`, `clone#Order`, the Proposed and Being changed transitions;
  the delivery ledger (MessageDeliveries.js), cart recovery's source; OrderConfirmations.js' stored PDF and resend; the framework's
  `send#EmailTemplate` (body, attachments) and the mail capture. The code over the plan:
  - the ledger hands `send#EmailTemplate` only body parameters, and a template with no body screen needs `body`: the ledger now passes a
    source's `body`, `bodyText` and `attachments`, and the PDF goes as bytes (the mail sender reads a file path, not the content store);
  - a send's ledger attempt in a transaction of its own cannot see the issue the send has not committed: the attempts run on the send's
    commit (`attempt#QuoteDeliveries`, `registerOnCommit`), and a failed delivery is queued again by a new ledger verb,
    `requeue#Delivery` (a failed or waiting one only; an uncertain one is reviewed, never resent);
  - `place#Order` marks a first order's part `isNewCustomer` and the customer's PO is a part field, each an OrderPart update counted as a
    commercial change, which moved an accepted quote's revision past its issue and decisions (P9's pre-approval warnings would then
    have read its quote rules as open): under the seller's commercial revision a part update changing only the customer's reference or
    the new-customer mark is a `reference` revision, not counted;
  - F166 (the lead's question): an owner or team reassignment is counted as not commercial under the flag (`OrderPartPartyRevision`
    passes `assignment` for SalesRepresentative and SalesTeam), so it keeps the issue and the approvals; the contact stays commercial;
  - recipients are parties (the customer and its current contacts, employees and representatives), each sent to at its current email,
    so a contact with no email fails and is retried once it has one; the ledger's key is the party, so two addresses of one party get
    one delivery an issue;
  - Mantle names no BOSS route, so the print's QR and the customer's link wait for P13's PASS link; the PDF carries none until then;
  - a send issues a new issue only with every approval current at its revision, since a change made after the proposal outside Sales'
    draft verbs (the native order entry) moves the revision of a proposed quote;
  - "the rep's own send through Comms Compose": the dialog sends from the owner's own mail account directly (a mail client draft with
    the PDF, `send#EmailDraft`, filed on the order), as Customer Service's confirmation resend does, rather than opening Compose;
  - the reminder job runs daily and sends nothing until an organization sets its reminder days, so reminders are off by default and the
    field SalesDefaults shows does what it says.
- Mantle:
  - `entity/SalesQuoteIssueEntities.xml` (new): SalesQuoteIssue (order, commercial revision, seller, customer, issued, issuer, validity,
    the PDF's OrderContent and location, end and reason: SqeRevised, SqeWithdrawn, SqeDeclined, SqeSuperseded) and SalesQuoteResponse
    (SqrAccept or SqrDecline of one issue, SqsStaff or SqsPortal, responded and recorded, contact, PO, evidence mail or file, reason,
    the order's status after it, operation key); SalesPolicy's `quoteTextLocation` and `reminderTextLocation` (F70).
  - `data/SalesQuoteIssueData.xml` (new): OctSalesQuoteIssued, the ledger sources MdsrcSalesQuote and MdsrcSalesQuoteReminder with their
    builds, the EmailTemplates MANTLE_SALES_QUOTE and MANTLE_SALES_QUOTE_REMINDER, the daily `send_SalesQuoteReminders` job.
  - `template/order/`: `SalesQuote.print.html.fancy` (trusted print, a draft marked so), `SalesQuoteEmail.html.fancy` (the mail body),
    `SalesQuoteText.html.fancy-locked` (the default cover and terms) and `SalesQuoteReminder.html.fancy-locked`, the locked text
    rendered with an explicit map (quote, customer, contact, seller, rep, dates, total, link; an unknown location renders empty).
  - `service/mantle/order/SalesQuoteIssues.js` and `SalesQuoteIssueServices.xml` (new): `get#QuoteIssues`, `send#Quote`
    (COMMERCIAL_REVISION_OFF, QUOTE_NOT_PROPOSED, VALIDITY_REQUIRED, QUOTE_EXPIRED, RECIPIENT_INVALID, SEND_ACCOUNT_REQUIRED, the
    approvals, the operation key; previewOnly), `attempt#QuoteDeliveries`, `build#QuoteMessage`, `build#QuoteReminderMessage`,
    `send#QuoteReminders`, `respond#Quote` (under the order's lock: ISSUE_UNAVAILABLE, RESPONSE_EXISTS, ISSUE_ENDED, ISSUE_SUPERSEDED,
    ISSUE_EXPIRED, DATE_INVALID, CONTACT_INVALID, EVIDENCE_INVALID, REASON_REQUIRED, PO_REQUIRED; a second acceptance answers the first;
    `place#Order` once, outcome placed, approved or held; a decline through Cancel Quote), `withdraw#Quote`, `revise#Quote` (Begin
    Changes and a commercial revision), `clone#Quote` (clone#Order without files, notes or payments; the caller its owner; retaxed),
    `apply#QuoteBatch` (send or withdraw, "orderId@revision", each its own transaction and key), `get#QuotePrint`,
    `get#QuoteIssueDocument`.
  - `SalesQuoteServices.xml` propose#Quote over SalesQuoteIssues.js `proposeQuote` (P9's guard after P10's checks: PARTS_INVALID,
    PRICE_UNAVAILABLE, PRODUCT_NOT_USABLE, TOTAL_INVALID, VALIDITY_REQUIRED, QUOTE_EXPIRED, VALIDITY_INVALID, F151's TAX_UPDATED and
    ADDRESS_REQUIRED); `SalesApprovals.js` (Being changed a draft, the two text locations among the policy's fields, `requireApproved`
    and `linesOf` exported, `proposeQuote` moved); `SalesQuotes.js` (Being changed a draft and in the open states; an RFQ's team).
  - Owner contracts: `entity/Order.eecas.xml` (OrderPartPartyRevision's `assignment` kind, F166), `OrderServices.xml`
    (`handle#OrderPartChange`'s `reference` kind; `increment#OrderRevision`'s description), `MessageDeliveries.js` and
    `MessageServices.xml` (a source's body and attachments; `requeue#Delivery`).
  - P8's review (the lead's note): `create#QuoteFromRequest` gives an RFQ's quote the RFQ's team (the maker stays its owner), through an
    internal value of `createQuote` that no service declares.
- BOSS:
  - `template/SalesQuotes.xml` (a P10 block: salesProposeQuote, salesRespondQuote, salesWithdrawQuote, salesReviseQuote, salesCloneQuote,
    salesQuotePrint, salesQuoteDocument, applyQuoteBatch) and F167: salesDecideQuote passes an operation key, which OrderDetail's
    Approve and Refuse forms now make, so a double submit answers the first decision.
  - `template/SalesOrderDetail.xml`: the state's one primary (Propose, Send, Record acceptance; Add line for an empty draft), More with
    Record decline, Revise, Withdraw, Copy as a new quote and Print (PDF), the commercial revision's warning, and Issues and responses;
    `screen/Shared/OrderDetail.xml` includes the transitions (owner contract, beside P7's and P9's).
  - `screen/Sales/Orders/QuoteSend.xml` (new; mounted in `Sales/Orders.xml`): the send's dialog with its preview (recipients and their
    email, from whose mail, template, the PDF's name, who has it already).
  - `screen/Sales/Quotes/Quotes.xml`: QuoteBatch (Send, Withdraw) on the rows' selection; `Sales/Settings/SalesDefaults.xml`: the PO
    requirement and the reminder days.
  - Assist: `skill/sales-issue-quote.md`, two chips on OrderDetail (`screen/Sales.xml`), and in `data/BossSetupSalesData.xml` (a P10
    block) the tools `sales_find_quotes` (Assistant and MCP), `sales_preview_quote` and `sales_send_quote` (Assistant; the send a write
    the user approves) with BOSS_SAL_QUOTE_TOOLS granting the three services to the Sales groups; `test/skill-retrieval.json` two cases.
- Specs:
  - Mantle `test/order/SalesQuoteIssue` (new, 5 features, 2.7 s): propose refused with no validity, a storeless quote taxed at the
    customer's address added since (TAX_UPDATED, then proposed) and one with no address refused; a send issues the quote at its revision
    with its PDF (OctSalesQuoteIssued), the mailed contact sent and the unmailed one failed, and a note, a file and a team row leave the
    revision (F166); a second send skips the one sent and retries the failed one, which succeeds once it has an email, one issue; the
    flag off, a rep without SALES_QUOTE_SEND, another organization's rep and a stale revision refused; revise ends the issue (SqeRevised)
    and keeps its PDF, the revised quote issued anew, a native line change supersedes that issue. `test/order/SalesQuoteResponse` (new,
    3 features, 2.6 s): one key and two keys give one response and one placed order, the PO on the part, the revision unchanged, a
    decline after it refused; a decline needs its reason, cancels the quote and ends its issue; an expired issue, a withdrawn one and
    another organization's rep refused. Shared fixtures in `test/order/SalesQuoteIssueFixtures.js`. `SalesQuoteRequests` (P8's): the
    manager's quote of the rep's RFQ is the RFQ's team's and the rep opens it.
  - mr-boss `test/Sales/SalesQuoteSend` (new, 1 feature, 1.4 s): QuoteSend's one html render after an issue (the stored PDF's name, its
    recipient, issued already). `SalesQuotes`' one OrderDetail qvt render checks Propose, Copy and Print and no Record acceptance;
    `SalesAccess` (a P10 feature, 0.1 s): the rep reaches the send's state check and Ziziwork Sales' rep is refused the quote, with the
    same parameters.
  - Acceptance, written and not run: `test/acceptance/Sales/SalesQuoteScenarios` (3 features: proposed and sent through QuoteSend to
    two contacts, the one with no email retried alone under the one issue; the acceptance with the PO through salesRespondQuote, one
    placed order, a second acceptance answering the first; a revised quote's old issue refused with its PDF kept). It places only
    through respond#Quote (place#Order).
- Tests run (release binary, `--nobuild`, this worktree's runtime): mr-mantle SalesQuoteIssue 5 of 5, SalesQuoteResponse 3 of 3,
  SalesQuoteRequests 4 of 4, and with them CartRecovery, DeliveryLedger, DropShip, OrderBulk, OrderChanges, PurchaseApprovals,
  PurchaseOrders, PurchaseRevisions, RecordVisibility, SalesQuoteApprovals, SalesQuoteDrafts, SalesWorkspace, ShopSubscriptions,
  StoreFulfillment, StoreOperations, StoreReviews, StorelessOrderTax, SupplierPortal, OrderLifecycle, OrderConfirmations, ShopCheckout,
  StoreCheckout, OrderToCashBasicFlow, WorkProjectMilestones, AccountingCredit, ReturnToResponseBasicFlow, SalesLeadIntake and
  SalesOpportunities 231 features, all passing but SalesQuoteResponse's setup (its first prefix was P8's; renamed and run again, 7 of
  7 with SalesQuoteRequests). mr-boss SalesQuotes, SalesQuoteSend, SalesAccess, SalesApprovals, SalesQuoteRequests, SalesSettings,
  SalesHome, SalesOpportunities, SalesAccounts, CustomerServiceOrders, CustomerServiceOrderChanges, CommerceOrders, PurchasingOrders,
  ProjectsAccess, AccountingCollections, AccountingReceivables, Notifications, QuickCreate, AdminRegistries, AdminCapabilities,
  InsightsRecords, ProductsSharedContext, Chat and RecordFiles 170 of 170 (25 specs). `./moq test mr-boss --skills`: recall@3 1.00 (50
  of 50). `moqui lint --screens` (release): 141 flagged sites, as before, none in a new or changed screen. Prettier clean on the new
  and changed JavaScript. Not run: the client walk (no screen it walks changed), ./moq test-apps, test-framework, the acceptance suite.
- Inventories: usl-inventory's propose#Quote row and an "Added in the Sales build: issue, send and the customer's response" table;
  ss-inventory's OrderDetail SendPlacedEmailForm, EmailMessageList and CloseOrderPartItems rows (Sales P10).
- Design edits: design-sales §5 "As built (impl-sales P10)"; design-crosscut's X2 row (the assignment and reference kinds, owner
  contract with Customer Service's proposals and Purchasing's revisions, which pass unchanged).
- Findings, numbered by the lead F183 to F191 in order:
  - F166 decided as built: an owner or team reassignment and the customer's reference or new-customer mark alone are not commercial
    changes under the seller's commercial revision; the contact, addresses, terms, lines and validity still are;
  - the rep's own send goes from the send dialog straight through their mail account (no Compose window, so the message's text is
    the dialog's message and the organization's cover); a send by anyone else, or a batch, is the organization's on the ledger;
  - recipients are the customer and its current contacts, employees and representatives, by party; one delivery an issue and party;
  - the quote PDF has no QR or customer link until P13's PASS link (Mantle names no staff route);
  - a credit-held acceptance (design scenario 7) has no regression: a hold comes only from an automatic approval on a covering
    payment, which a net-terms acceptance never has; respond#Quote reports held from the order's holds, and P11's approval path is
    where its spec belongs;
  - Quotes' "Responded" saved list and QuoteList's "last send/response" columns (design §5) are not built: an accepted quote is
    placed and a declined one is cancelled; the issues show on OrderDetail;
  - the quote and reminder templates and the stored text locations are set through store#SalesPolicy, not on SalesDefaults (the
    text has no editor yet; F156 continues for them);
  - an acceptance's evidence mail (`evidenceEmailMessageId`) is checked to exist, not to be filed on the quote; the dialog offers
    the quote's files only;
  - `docs/security/Attack-Surface.md` (mr-moqui) does not name the issue verbs; P10 had no mr-moqui worktree.
- For the lead:
  - budget share: mr-mantle about 5.3 s (SalesQuoteIssue 2.7 s, SalesQuoteResponse 2.6 s; SalesQuoteRequests unchanged in time);
    mr-boss server about 1.5 s (SalesQuoteSend 1.4 s, SalesAccess' P10 feature 0.1 s); client none;
  - merge hot spots: mr-mantle `service/mantle/order/OrderServices.xml` (handle#OrderPartChange's parameters and revision step,
    increment#OrderRevision's description), `entity/Order.eecas.xml` (OrderPartPartyRevision), `service/mantle/party/MessageDeliveries.js`
    and `MessageServices.xml` (attempt's pass-through, requeue), `service/mantle/order/SalesQuoteServices.xml` (propose#Quote's
    actions and description in P9's block), `SalesQuotes.js` (draft states, create's team), `SalesApprovals.js` (draft states, policy
    fields, exports, propose removed), `SalesQuoteRequests.js` (the RFQ's team), `test/order/SalesQuoteRequests.spec.js`; mr-boss
    `template/SalesQuotes.xml` (P10 block; salesDecideQuote's key), `template/SalesOrderDetail.xml`, `screen/Shared/OrderDetail.xml`
    (P10 includes), `screen/Sales/Quotes/Quotes.xml`, `screen/Sales/Orders.xml`, `screen/Sales.xml` (two assist-prompts),
    `screen/Sales/Settings/SalesDefaults.xml`, `data/BossSetupSalesData.xml` (P10 block at the end), `test/Sales/SalesAccess.spec.js`
    (a feature at the end), `test/Sales/SalesQuotes.spec.js`, `test/skill-retrieval.json`, `plan/usl-inventory.md`,
    `plan/ss-inventory.md`, `plan/design-sales.md` (§5 as built), `plan/design-crosscut.md` (X2's row). Marketing P3's files are not
    touched;
  - Attack-Surface (mr-moqui `docs/security/Attack-Surface.md`), the line: "- Sales' quote issue (`mantle.order.SalesQuoteIssueServices`,
    all `allow-remote="false"`): each verb needs `SALES_QUOTE_EDIT` on a quote of the caller's sales scope (another's answers as
    missing), and `send#Quote` also `SALES_QUOTE_SEND`, the seller's commercial revision on and every approval current; recipients are
    only the customer and its current contacts; `respond#Quote` locks the order and admits one response an issue, within its validity
    and at its revision, and places only through `place#Order`; sends, responses and batches carry operation keys; the ledger's
    builds read the issue alone and are suppressed once it no longer stands; the stored cover, terms and reminder text render locked
    with an explicit map.";
  - nothing needs the user's call; F166 is decided as the lead asked (counted not commercial), and the own-mail send's form (no
    Compose window) may be worth the user's look.

**Review 2026-11-14 (P10).** A fresh review of `sal/p10` (mr-mantle 582e3eca, mr-boss 37b40bd6; master had nothing newer, so no merge)
against P10, §2, §4, design §5, §13.2 and §16, F9, F16, F70, F151, F166 and F167.
- Checked and sound:
  - Owner contracts: `assignment` (OrderPartParty SalesRepresentative or SalesTeam) and `reference` are skipped only where the order
    counts commercial changes only (the seller's flag, or a buying organization's PurchasePolicy), and counted as before everywhere
    else; P9's supersession (`revisionChanged`) compares each decision's revision with the order's, so an uncounted call supersedes
    nothing. Customer Service's order changes, Purchasing's orders, approvals and revisions, Shop, Store, the storeless tax, the
    approvals and the ledger's callers pass unchanged (below). `requeue#Delivery` is `allow-remote="false"`, called only by send#Quote
    (no screen, Assist tool or job), and moves only a failed or waiting delivery: a sent, suppressed or uncertain one is left. The
    ledger's new pass-through of a build's `body`, `bodyText` and `attachments` changes nothing for a build that returns none.
  - send#Quote: SALES_QUOTE_EDIT on a quote of the caller's scope and SALES_QUOTE_SEND; the own-mail mode only for the quote's owner
    from an account `get#EmailAccountAccess` gives the caller as sendable (another's account id answers SEND_ACCOUNT_REQUIRED);
    recipients only the customer and its current contacts, employees and representatives; a second send reuses the standing issue,
    skips who has it and requeues who failed; the PDF is rendered and stored at the revision the issue binds (its OrderContent is not
    counted under the flag). The PDF's location is in no operation result, audit field, notice, preview or Assist answer;
    `salesQuoteDocument` streams it.
  - respond#Quote: one response an issue, a second acceptance answering the first and a decline after it refused; within the
    validity and at the issue's revision; a decline needs its reason and cancels through `cancel#Order`; an acceptance places once
    through `place#Order` (no other placement in the phase; the acceptance spec places only so); staff record it with SALES_QUOTE_EDIT
    and the scope; the PO goes on the part as a `reference` change.
  - Assist: `sales_send_quote` is AgclWrite on the Assistant only (the user approves it), `sales_find_quotes` is find#Quotes, scoped to
    the user's sales scope, on MCP; the skill tells the agent never to send, accept or decline for the user.
  - Screens: one html render of QuoteSend and one qvt render of OrderDetail in the regression suite; the batch keys name the revision
    listed, each quote on its own transaction; the Settings fields are those P10 reads.
- Fixed:
  - R1 (medium, sender identity): the organization's quote and reminder mail fell back to the issuer's own address when the
    organization had no primary email, so a later send or reminder by someone else went out as the rep who issued it (and the demo
    seller, Ziziwork Retail, has no primary email, so every organization send did). The build now sends from the organization's own
    email only (its primary first, else another current one) and fails, to be sent again, while it has none. Fails on the unfixed
    code (the mail went from the rep's address).
  - R2 (medium, §2 operation keys): send#Quote did not lock the order, so two sends at once could each make an issue at one
    revision; send#Quote and respond#Quote read the operation key before the lock, so a concurrent double submit with one key hit
    the key's duplicate row instead of answering the first. Both now lock the order first (a preview does not lock). No concurrent
    spec.
  - R3 (medium, owner contract): `handle#OrderPartChange` called an update `reference` (uncounted) when the reference or the
    new-customer mark changed and the address, carrier, customer, status and validity did not, so an update writing the reference
    with any other field (the vendor, facility, ship-by dates, terms) was not counted. It now compares every field of the stored part
    with its original value, the reference fields aside. Fails on the unfixed code.
  - R4 (low, failure tolerance): the reminder job queued every issue in its own try but one transaction, so a failing service call
    could roll back all the reminders (and its attempts, in transactions of their own, could not see the queued rows); each issue now
    queues in a transaction of its own. The new feature checks no reminder without the organization's days and one with them.
- Findings, numbered by the lead F192 to F196 in order:
  - an acceptance's evidence mail (`evidenceEmailMessageId`) is any existing EmailMessage, not one filed on the quote (no screen or
    tool passes it today; the Built note's finding stands);
  - the reminder job reads the oldest 500 unended unexpired issues, and an accepted issue stays unended until it expires, so with
    many open issues newer ones wait;
  - `applyQuoteBatch` makes its operation key on the server, so a double submit of the batch is two batches (the ledger and the
    states keep it from sending twice: a sent recipient is skipped, a withdrawn quote refused);
  - Marketing P3's suppression at the attempt reads the organization from the delivery's store; a quote or reminder delivery has
    none, so only blocks of every organization apply to it, not the selling organization's own;
  - the Built note's findings stand.
- Tests run (release binary, `--nobuild`, this worktree's runtime): mr-mantle SalesQuoteIssue 6 of 6 (a sixth feature, about 0.7 s)
  and SalesQuoteResponse 3 of 3 (38 s, twice more after the fixes); SalesQuoteIssue, SalesQuoteResponse, SalesQuoteRequests,
  DeliveryLedger, CartRecovery, OrderChanges, PurchaseRevisions, PurchaseOrders, PurchaseApprovals, OrderLifecycle, OrderConfirmations,
  ShopCheckout, SalesQuoteApprovals, SalesQuoteDrafts, StoreCheckout, StorelessOrderTax, OrderToCashBasicFlow, SupplierPortal, DropShip
  and OrderBulk 149 of 149 (22 specs with dependencies, 157 s). mr-boss SalesQuoteSend, SalesQuotes, SalesAccess, SalesApprovals,
  SalesSettings, CustomerServiceOrders, CustomerServiceOrderChanges, PurchasingOrders and CommerceOrders 33 of 33 (69 s). R1's and
  R3's checks were run against the unfixed code and failed there. Prettier clean. Not run: test-apps, test-framework, acceptance
  (SalesQuoteScenarios unchanged; with R1 the demo seller sends from its billing or shipping address).
- For the lead:
  - budget share: mr-mantle about 6 s for P10 (SalesQuoteIssue's sixth feature adds about 0.7 s); mr-boss as the Built note;
  - merge hot spots beside the Built note's: mr-mantle `service/mantle/order/OrderServices.xml` (handle#OrderPartChange's script),
    `test/order/SalesQuoteIssue.spec.js`. Marketing P3 (`mkt/p3`) overlaps P10 in two ledger files, and both merge without conflict
    (`git merge-tree`): `service/mantle/party/MessageDeliveries.js` attemptStep, where P3 adds the suppression line after the
    recipient's address check and P10 adds the body, bodyText and attachments to the send#EmailTemplate parameters a few lines below,
    and P10's requeue/requeueStep in the operations map (P3 adds `suppressedFor` above attemptStep and a require at the top);
    `service/mantle/party/MessageServices.xml`, where P3 edits attempt#Delivery's description and appends its suppression services
    at the end, and P10 adds requeue#Delivery and requeue#DeliveryStep after receipt#Delivery. A requeued delivery passes P3's check
    at its next attempt;
  - Attack-Surface (mr-moqui `docs/security/Attack-Surface.md`), a paragraph after Sales' approvals: "Sales' quote issue
    (`mantle.order.SalesQuoteIssueServices`, all `allow-remote="false"`): each verb needs `SALES_QUOTE_EDIT` on a quote of the
    caller's sales scope (another's answers as missing), and `send#Quote` also `SALES_QUOTE_SEND`, the seller's commercial revision
    on and every approval current; recipients are only the customer and its current contacts; only the quote's owner sends from
    their own mail account, and the organization's mail goes from the organization's own address, never a person's; `send#Quote`
    and `respond#Quote` lock the order, and `respond#Quote` admits one response an issue, within its validity and at its revision,
    and places only through `place#Order`; sends, responses and batches carry operation keys; the ledger's builds read the issue
    alone and are suppressed once it no longer stands, and `mantle.party.MessageServices.requeue#Delivery` queues again only a
    failed or waiting delivery; the stored cover, terms and reminder text render locked with an explicit map; the issued PDF is
    streamed, its location never answered.";
  - nothing new needs the user's call.

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
    P9's among them, still stops the auto-approval, as built. `autoApprove#Order` acts only on a covering
    authorization, so a net-terms order is never auto-approved (F60).
  - The manual callers (F61): Customer Service's replacement orders approve through `approve#Order` under
    `ORDER_APPROVE` (ReturnServices.xml:1094-1098, :1127-1129); for a seller with the setting on they ask
    `approve#Order`'s own check and leave the replacement placed for a Sales approver, as a settler without
    `ORDER_APPROVE` does now (owner contract). Projects' estimate approval approves outside `approve#Order`
    (ProjectServices.xml:3486-3496), as §5 Q12 answers.
  - Existing callers (owner contracts with Shop and Commerce): Shop's checkout and renewals and Commerce's orders
    are approved by that path today, on the payment authorization at placement. Their behaviour changes only for a
    seller with the setting on, whose store orders then wait in Awaiting approval, and for an order that carries
    a Sales warning under a rule its seller set (P9); with the setting off and no Sales rule their specs pass
    unchanged (mr-pass's Shop suites, mr-boss's Commerce suites, mr-mantle's order and payment specs). Written into
    design-shop and design-commerce when the phase is built.
  - Q: `create#SalesOrder` (direct entry, purpose SalesOrder), `place#SalesOrder` and `approve#SalesOrder` (the policy
    and revision guard, then the native primitive), `apply#SalesOrderBatch` (approve or close remainders, each order
    through `approve#Order`, so none skips the credit check as the baseline's bulk status change does, F12), and the
    option that approves an accepted net-terms order as the system when credit and every rule pass (through
    `approve#Order` at the acceptance, not `autoApprove#Order`, F60), which applies
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

**Built Nov 14 (P11).** mr-mantle and mr-boss on branch `sal/p11` (hashes in the worker's reply); mr-moqui and mr-pass unchanged, no
Rust built.
- Checked first (the code over the plan): P9's and P10's Built and Review notes, §4 (the Nov 11 approval-setting row, Q12), F11, F12,
  F15, F16, F43, F46, F52, F60, F61 and F78; `approve#Order`, `autoApprove#Order`, `hold#Order`, `release#OrderHold`,
  `check#OrderPreApprove` and its SECAs; PurchaseOrders.js `approveRefusal` and `holdAllowed`; the replacement orders
  (ReturnServices.xml) and Projects' estimate approval (ProjectServices.xml); OrderConfirmations.js; the delivery ledger;
  SalesApprovals.js' requirements and decisions; SalesQuotes.js and SalesQuoteIssues.js `respond#Quote`; P7's review (find#Quotes'
  "all"). The code over the plan:
  - an accepted quote keeps its purpose `OrpSalesQuote`; Sales' order is any order whose first part sells, a placed quote, a direct
    order (`OrpSalesOrder`, the plan's "purpose SalesOrder") or another app's sales order of the seller; templates, bases, open carts
    and unplaced quotes are not orders (SalesAccess.js `orderOf`, `isSalesOrder`), and find#Quotes' "all" now leaves out a placed
    quote, so OpportunityDetail shows an accepted quote once, in Orders (P7's review);
  - "a current Sales decision where a rule asks one": nothing recorded an order-purpose decision (F160), so `approve#SalesOrder`
    records an SdrApproved OrderDecision of purpose SapOrder for each order rule the order meets at its revision before calling
    `approve#Order`; with the setting on, a direct `approve#Order` without them is refused SALES_APPROVAL_REQUIRED naming the rule;
  - the approver's reach: an order approver (`SALES_ORDER_APPROVE` or `ORDER_APPROVE`) sees the organization's Placed and held sales
    orders to decide them, not to change them (design §1.1 "an assigned approval grants its authorized approver the source
    projection"), as P9's quote approver sees an asked quote;
  - Sales' approval of an accepted net-terms order "as the system" goes through `approve#Order`, whose permission check knows no
    system caller: SalesOrders.js sets a claim for the one order in `ec.context.sharedMap` (as SupplierPortal.js' claim) that
    `approveRefusal` admits for a sales part with the setting off; no request reaches it;
  - `hold#Order` and `release#OrderHold` check the organization for a user's Manual, Change or Purchase reason against the
    organizations the user works for (FacilityScope.js' member organizations, rollup children included, not narrowed to the active
    one), every organization for a system administrator, nothing for a call with no user (a job); Credit and Payment reasons stay
    their owner services'. A Purchase reason on a part that is not a purchase part is refused (HOLD_TYPE_DIRECTION);
  - the storeless confirmation is the order's event once a revision (`SalesOrderConfirmation:<order>@<revision>`), so a placement
    sends it and an approval, or a hold released back to Approved, sends none again; it is sent for Sales' own storeless orders (a
    direct order, an accepted quote), not every storeless sales order, so Projects' and Customer Service's storeless orders send
    nothing new (§2 "existing callers stay compatible"); the tx-commit rule runs on a service worker, so it is sent just after the
    placement commits;
  - Home's "Orders blocked" counts awaiting approval or held; Insights' "Quotes to send" needed find#Quotes' `issue: unsent` filter
    (a proposed quote with no issue standing) and Quotes' "To send" saved list;
  - Print of an order is not built: the confirmation as placed is Customer Service's document (resend#OrderConfirmation).
- Mantle:
  - `service/mantle/order/SalesOrders.js` and `SalesOrderServices.xml` (new): the gate (`gatedParts`, `approvalWaits`,
    `gateRefusal`), `create#SalesOrder`, `store#SalesOrderLine`, `delete#SalesOrderLine`, `place#SalesOrder` (LINES_REQUIRED,
    ORDER_NOT_DRAFT), `approve#SalesOrder` (PERMISSION_DENIED, ORDER_NOT_PLACED, REVISION_CHANGED, SELF_APPROVAL, APPROVER_INVALID,
    the operation key answering a retry once the order left the approver's sight), `hold#SalesOrder` and `release#SalesOrderHold`
    (HOLD_TYPE_INVALID, HOLD_TYPE_DENIED, HOLD_UNAVAILABLE, COMMENT_REQUIRED), `cancel#SalesOrderRemainder` (ORDER_NOT_OPEN,
    NOTHING_TO_CANCEL), `clone#SalesOrder`, `apply#SalesOrderBatch`, `get#SalesOrder`, `get#SalesWorkSummary`,
    `send#OrderConfirmation` and `build#OrderConfirmationMessage`; the net-terms option (`approveAccepted`).
  - `SalesWorkspaceServices.xml` find#SalesOrders (a P11 block at the end); `SalesWorkspace.js` (Home's quote and order counters real,
    from `get#SalesWorkSummary`); `SalesApprovals.js` (a P11 block: `orderGateOn`, the order rules' states, `orderApproveRefusal`,
    `decideOrderRules`, `orderApprovalOf`); `SalesAccess.js` (a P11 block before P8's: `orderOf`, `requireOrder`, `orderApprover`,
    `isSalesOrder`); `SalesQuotes.js` (`createDraft`, `storeLineOf`, `deleteLineOf` exported; find#Quotes' "all" and `issue`);
    `SalesQuoteIssues.js` (respond#Quote's net-terms option after `place#Order`); `OrderConfirmations.js` (`storeAsSystem` exported).
  - Owner contracts: `OrderServices.xml` (`approve#Order`'s description, `autoApprove#Order`'s gate, `hold#Order`'s and
    `release#OrderHold`'s organization and direction), `PurchaseOrders.js` (`approveRefusal`'s sales direction and the system claim,
    `holdScopeRefusal`), `ReturnServices.xml` (a replacement order of a gated seller left placed, F61), `ProjectServices.xml`
    (Projects' estimate approval leaves a gated seller's order placed, §4 Q12).
  - `service/SalesOrder.secas.xml` (new, `OrderPlacedSalesConfirmation`), `data/SalesOrderData.xml` (new: MdsrcSalesOrderConfirmation,
    MANTLE_SALES_ORDER_CONFIRMATION), `template/order/SalesOrderConfirmationEmail.html.fancy` (new).
- BOSS:
  - Screens: `Sales/Orders.xml` (Orders in the menu, the area's tabs), `Sales/Orders/Orders.xml` (new: OrderFind and OrderList with the
    saved lists, Awaiting approval with each row's warnings, New order, OrderBatch), `template/SalesOrders.xml` (new: the order
    transitions and NewSalesOrderForm), `template/SalesOrderDetail.xml` (a P11 block: the sales-order context), `Shared/OrderDetail.xml`
    (owner contract: get#SalesOrder asked before get#Quote; the P11 transitions), `Sales.xml` (Orders in the menu, `g r`, an order as a
    record panel host), `Sales/Home.xml` (the three counters real), `Sales/Quotes/Quotes.xml` (To send), `Sales/Pipeline/
    OpportunityDetail.xml` (Orders from find#SalesOrders, each opening OrderDetail).
  - `Sales.js` (P11 blocks): linkPaths Orders and Orders/Orders, record kinds `order` and `orderDocument`, the palette's orders.
  - `data/BossSetupSalesData.xml` (a P11 block at the end): `ORDER_APPROVE` for BOSS_SALES_APPROVE (F43) in its bundle; BOSS_SAL_WORK_SUMMARY
    granting get#SalesWorkSummary to the Sales groups; Insights' attention providers Sales.QuotesToSend, Sales.QuotesExpiring and
    Sales.OrdersAwaitingApproval (owner contract with Insights, in Sales' file rather than BossSetupData).
- Specs:
  - Mantle `test/order/SalesOrderApproval` (new, 4 features, 2.2 s): with the setting on ORDER_APPROVE alone refused a sales part, another
    organization's SALES_ORDER_APPROVE refused, the scope's admitted; off, ORDER_APPROVE as before and SALES_ORDER_APPROVE alone refused;
    a purchase part unchanged; with the setting on a store and a storeless order with a covering authorization stay placed with their
    payments authorized, get#SalesOrder shows the approver the order rule and its warning, `approve#Order` refused
    SALES_APPROVAL_REQUIRED, `approve#SalesOrder` decides the rule and approves (a retry answers the first, a stale revision refused);
    off, a store order auto-approves; a batch credit-holds the order over its limit and approves the other; another organization's
    user cannot release the hold natively or in Sales, a Credit hold is not Sales'; an accepted net-terms quote under the option is held
    by the credit check (the regression P10 left for P11, F187). `test/order/StorelessOrderConfirmation` (new, 1 feature, 0.8 s; 2.0 s
    on a cold PDF renderer): one confirmation at placement, sent from the seller's address with the PDF to the customer; none again at
    the approval or a hold released; none for a store order. `SalesQuoteIssueFixtures.js`: `addUser` exported, the grant covering
    SalesOrderServices and SalesWorkspaceServices. `SalesWorkspace`: the counters are counts.
  - mr-boss `test/Sales/SalesOrders` (new, 1 feature, 0.3 s): OrderDetail's one qvt render of a placed direct order as the approver (the
    order context, Approve, no edit or copy), Orders' one html render of Awaiting approval with it. `SalesAccess` (a P11 feature, 0.5 s):
    approve#SalesOrder refused the rep for the permission and Ziziwork Sales' rep as missing, the approver reaching the revision check,
    with the same parameters. `SalesSpecLib.js` (the menus with Orders, `g r`), `SalesHome`, `SalesQuotes` (the not-available text),
    `InsightsHome` (Sales' three providers).
  - Acceptance, written and not run: `test/acceptance/Sales/SalesOrderScenarios` (3 features: an accepted net-terms quote in Awaiting
    approval approved by sales.approver from OrderDetail, the quote no longer listed among the quotes; Ziziwork Sales' storeless direct
    order sends one confirmation, none at its approval, and its invoice carries the gateway's tax lines; a rep's direct order through
    NewSalesOrder and OrderDetail placed with no response). `SalesQuoteDraftUsable`'s not-available text updated.
- Tests run (release binary, `--nobuild`, this worktree's runtime): mr-mantle SalesOrderApproval, StorelessOrderConfirmation,
  SalesWorkspace, SalesQuoteResponse, SalesQuoteIssue, SalesQuoteApprovals, SalesQuoteDrafts, SalesQuoteRequests, OrderLifecycle,
  OrderChanges, PurchaseApprovals, PurchaseOrders, PurchaseHoldPermission, PurchaseRevisions, ShopCheckout, StoreCheckout,
  ShopSubscriptions, OrderToCashBasicFlow, WorkProjectMilestones, AccountingCredit, AccountingReturns, ReturnPolicies,
  OrderConfirmations, StorelessOrderTax, SalesOrganizationScope, ReturnToResponseBasicFlow, OrderBulk, DropShip, StoreOperations,
  StoreFulfillment, DeliveryLedger and CartRecovery 233 of 233 (35 specs with dependencies, 93 s); after the last changes the new
  specs with SalesWorkspace, SalesQuoteResponse, SalesQuoteIssue, SalesQuoteDrafts, SalesQuoteApprovals, PurchaseHoldPermission,
  OrderChanges and AccountingCredit 45 of 45. mr-boss SalesOrders, SalesAccess, SalesHome, SalesQuotes, SalesQuoteSend, SalesApprovals,
  SalesOpportunities, SalesAccounts, SalesSettings, SalesReports, SalesQuoteRequests, SalesIntake, InsightsHome, PeopleInsights,
  MaintenanceReports, CustomerServiceOrders, CustomerServiceOrderChanges, CustomerServiceAccess, CommerceOrders, CommerceAccess,
  PurchasingOrders, PurchasingAccess, AccountingCollections, AccountingReceivables, ProjectsAccess, InsightsRecords, Notifications,
  QuickCreate, AdminRegistries, AdminCapabilities, Chat, RecordFiles, ProductsSharedContext, MaintenanceAccess, PeopleAccess,
  WarehouseAccess and ManufacturingAccess 301 of 302 with InsightsHome's provider list then fixed and passing (37 specs, 192 s; under
  the load of the parallel workers MaintenanceAccess and CustomerServiceAccess passed 15 s, each well under it run alone, 44 s for the
  two), then SalesOrders, SalesAccess, SalesHome, SalesQuotes and SalesOpportunities again. mr-pass whole suite 190 of 190 (13.8 s of
  its 20 s), Shop's checkout and renewals unchanged. `moqui lint --screens` (release): 141 flagged sites, as before, none in a new or
  changed screen. Prettier clean on the new and changed JavaScript. Not run: the client walk (no screen it walks changed), ./moq
  test-apps, test-framework, the acceptance suite.
- Inventories: usl-inventory's hold#Order, release#OrderHold, approve#Order and autoApprove#Order rows and an "Added in the Sales build:
  orders, approval and the storeless confirmation" table; ss-inventory's FindOrder CreateSalesOrder, ApproveOrdersForm,
  CloseOrdersForm and OrderList and OrderDetail CloseOrderPartItems, AuditLogList, HeaderForm and SendPlacedEmailForm rows (Sales P11).
- Design edits: design-sales §6 "As built (impl-sales P11)". design-commerce §13 and design-crosscut (`OrderPlacedAutoApprove`,
  CX-ORDER-AUTHORITY) already say what P11 built; design-shop (mr-pass) is not edited (no mr-pass worktree; see For the lead).
- Findings, numbered by the lead F197 to F205 in order:
  - `approve#SalesOrder` records the order rules' decisions with the seller's setting off too (an ORDER_APPROVE approver, separation
    applied), while a direct `approve#Order` with the setting off ignores the order rules as before (P9); Sales' Approve is stricter
    than the native one there;
  - an order approver who is not assigned sees an order only while it is Placed or held, so cannot place a Manual hold on an approved
    order of another rep unless they also hold SALES_TEAM_VIEW (the demo's BOSS_SALES_APPROVE does not);
  - the hold organization check reads the user's own organizations (rollup children included), not the active one; a Customer
    Service operator who works for a parent organization holds a child's order as before;
  - the storeless confirmation goes only for Sales' own storeless orders (a direct order, an accepted quote); Projects' storeless
    orders and Customer Service's replacements send none; the demo seller Retail has no primary email, so its confirmations fail and
    wait until it has one (P10's R1 rule), as its quote mail does;
  - find#SalesOrders' To fulfill, Part fulfilled and To invoice read the distinct order ids of every shipment source and billing row
    before the scoped query; fine for the demo, a subquery when volumes grow; the Awaiting approval list runs check#OrderPreApprove
    for each row of its page;
  - Fulfillment and Invoices and payments list rows without links until P14 mounts ShipmentDetail and InvoiceDetail; Print of an order
    and the Agreements and Changes tabs are not built (P14, P15);
  - a placed quote opens in the order context, so its Issues and responses are no longer shown there (the accepted evidence is a line
    of the header and Overview);
  - `get#Opportunity`'s `orders` output is no longer read by OpportunityDetail (Orders from find#SalesOrders); left for other readers;
  - `docs/security/Attack-Surface.md` (mr-moqui) does not name the order verbs; P11 had no mr-moqui worktree.
- For the lead:
  - budget share: mr-mantle about 3.0 s (SalesOrderApproval 2.2 s, StorelessOrderConfirmation 0.8 s); mr-boss server about 0.8 s
    (SalesOrders 0.3 s, SalesAccess' P11 feature 0.5 s); client none;
  - merge hot spots: mr-mantle `service/mantle/order/OrderServices.xml` (approve#Order's description, hold#Order, release#OrderHold,
    autoApprove#Order), `PurchaseOrders.js` (approveRefusal, holdScopeRefusal, the salesOrders require), `ReturnServices.xml`,
    `service/mantle/work/ProjectServices.xml`, `SalesApprovals.js` (a P11 block before the operations; exports),
    `service/mantle/sales/SalesAccess.js` (a P11 block before P8's; exports), `SalesQuotes.js` (createQuote's kind, storeLine and
    deleteLine split, find#Quotes, exports), `SalesQuoteServices.xml` (find#Quotes' issue), `SalesQuoteIssues.js` (respond#Quote),
    `OrderConfirmations.js` (exports), `service/mantle/sales/SalesWorkspace.js` and `SalesWorkspaceServices.xml` (P11 block at the
    end), `test/order/SalesQuoteIssueFixtures.js`, `test/sales/SalesWorkspace.spec.js`; mr-boss `data/BossSetupSalesData.xml` (P11
    block at the end), `service/ironstone/sales/Sales.js` (linkPaths, record kinds after P9's block, the palette before search),
    `screen/Sales.xml` (panel hosts, Orders' menu row, `g r`), `screen/Shared/OrderDetail.xml` (the Sales branch and P11 includes),
    `template/SalesOrderDetail.xml`, `screen/Sales/Orders.xml`, `screen/Sales/Home.xml`, `screen/Sales/Quotes/Quotes.xml`,
    `screen/Sales/Pipeline/OpportunityDetail.xml`, `test/Insights/InsightsHome.spec.js` (registeredKeys: Marketing's providers would
    add there too), `test/Sales/SalesSpecLib.js` (the menus and keys), `test/Sales/SalesAccess.spec.js` (a feature at the end),
    `test/Sales/SalesHome.spec.js`, `test/Sales/SalesQuotes.spec.js`, `test/acceptance/Sales/SalesQuoteDraftUsable.spec.js`,
    `plan/usl-inventory.md`, `plan/ss-inventory.md`, `plan/design-sales.md` (§6 as built). MantleSetupData.xml and Admin.js (Marketing
    P4 and P5) are not touched;
  - design-shop (mr-pass `plan/design-shop.md`) should say, as design-commerce §13 does, that a store order of a seller with the approval
    setting on stays Placed for a holder of SALES_ORDER_APPROVE (the owner contract; mr-pass's suite passes unchanged);
  - Attack-Surface (mr-moqui `docs/security/Attack-Surface.md`), a paragraph after Sales' quote issue: "Sales' orders
    (`mantle.order.SalesOrderServices`, all `allow-remote="false"`): each verb needs its permission on an order of the caller's sales
    scope (another's answers as missing); an order approver (`SALES_ORDER_APPROVE` or `ORDER_APPROVE`) reads the organization's placed
    and held orders, never changes them; `approve#SalesOrder` records each order rule's decision at the revision read, the order's
    owner, enterer and placer refused unless the rule allows it, then calls `approve#Order`, whose credit check runs; where the
    seller's SalesPolicy approval setting is on, `autoApprove#Order` approves no sales part of it and `approve#Order` needs
    `SALES_ORDER_APPROVE` in the approver's sales scope and those decisions; the only system approval is Sales' own of an accepted
    net-terms order, a claim Mantle's code sets for that order, never a request value; `hold#Order` and `release#OrderHold` refuse a
    user's Manual, Change or Purchase reason on an order of an organization they do not work for, and Sales places and releases only
    Manual and Change holds; the storeless confirmation goes once for an order's revision and recipient from the organization's own
    address.";
  - nothing needs the user's call; the approver's reach (Placed and held only) and Sales' Approve recording the order rules with the
    setting off may be worth the user's look.

**Review 2026-11-14 (P11).** A fresh review of `sal/p11` (mr-mantle e8938fd9, mr-boss 897aa9ec), with master (Marketing P3) merged into
each first without conflict (mr-mantle 4a9d9ad3, mr-boss b69ab77b), against P11, §2, §4 (the Nov 11 approval-setting row, Q12), design
§5, §6, §13.1 and §16, F11, F12, F15, F52, F60, F61 and F78.
- Checked and sound:
  - Owner contracts: with the seller's setting off and no Sales rule, `approve#Order` asks ORDER_APPROVE as before (`approveRefusal`'s
    gated parts are empty), `autoApprove#Order` returns early only where `approvalWaits` finds a gated sales part, and the replacement
    orders (ReturnServices.xml, both places) and Projects' estimate approval add only that same test before their approval. Shop's
    checkout and renewals, Commerce's orders, Customer Service's orders, holds and replacements, Projects and Accounting's credit pass
    unchanged (below). With the setting on, only the documented changes: the order stays placed (payment authorized) for
    SALES_ORDER_APPROVE in the approver's sales scope with every order rule decided at the revision.
  - The net-terms system approval: the claim is `ec.context.sharedMap.SalesSystemApproval`, set only by `asSystemApproval` in
    SalesOrders.js around one `approve#Order` call, for that order id, and restored in a `finally`; the framework writes no request
    value or parameter into the shared map (only its own `telemetryPageTraceId` and form-list counters), and `approveRefusal` admits
    it only for the order it names and only for ungated parts. `approveAccepted` runs only with the setting off on every sales part,
    the seller's `approveNetTermsOrders` and no Sales pre-approval warning; `approve#Order`'s credit check still runs (the spec's
    credit hold).
  - Visibility: `orderOf` (owner or team, SALES_TEAM_VIEW, an order approver only while Placed or held and then read only:
    `canEdit` false, so line, place, cancel and clone refuse) is the one test of get#SalesOrder, every verb, the record kinds `order`
    and `orderDocument` (the root's Chatter and RecordFiles), and the palette and Home and Insights counts through the scoped
    find#SalesOrders, whose approver reach is the same organizations and statuses. Another organization's order answers as missing on
    each (RECORD_UNAVAILABLE, HOLD_UNAVAILABLE, `orderFound` false, a batch row's RECORD_UNAVAILABLE). The operation key is the
    caller's (EntityLib `operation` checks the user), so a retry answering after the approval took the order out of sight discloses
    nothing to another user.
  - hold#Order and release#OrderHold (F12, F78): the organization check reads the user's member organizations, skips Credit and
    Payment reasons and a call with no user, and answers as missing; Customer Service's specs pass unchanged.
  - approve#SalesOrder: the order is locked, then its status and revision checked, then each open order rule decided by the caller
    (separation per rule: owner, enterer, placer from the status audit log, a line's price author; the approver group), then
    `approve#Order` with its credit check. The batch runs each order in its own transaction (`lib.probe`) with its own key and names
    a refusal per row.
  - The storeless confirmation: once per order revision and recipient (the ledger's event key), only for Sales' direct orders and
    placed quotes without a store, from the organization's own address (P10 R1's rule), never failing the placement.
- Fixed:
  - R1 (medium, Marketing P3 contract): the confirmation's `queue#Delivery` named no organization, so after Marketing P3 only blocks of
    every organization applied to it, not the seller's own (a hard bounce recorded for the seller). It now passes
    `organizationPartyId` (the selling organization), as P10's quote and reminder deliveries do. StorelessOrderConfirmation checks the
    delivery's organization; fails on the unfixed code.
  - R2 (low, spec coverage): SalesOrderApproval checked neither no self-approval nor the system claim being cleared; it now checks that
    an approver who owns, entered and placed an order is refused SELF_APPROVAL by its order rule (the order stays placed), and that no
    claim is left in the shared map after the net-terms approval. The batch check names a refused row's reason.
- Findings, numbered by the lead F206 to F211 in order:
  - with the seller's setting on and no order rule the order meets, `approve#SalesOrder` and `approve#Order` admit the order's own
    owner who holds SALES_ORDER_APPROVE: separation is per rule (design §5), so the setting alone forces a manual approval but not a
    second person;
  - hold#Order's direction check (a Purchase reason only on a purchase part, HOLD_TYPE_DIRECTION) applies to a call with no user too;
    nothing places one so today;
  - the hold organization check reuses FacilityScope, so a holder of FACILITY_ALL_ORGANIZATIONS (Warehouse's) holds and releases a
    Manual or Change hold of any organization's order;
  - with the setting on, the native `approve#Order` answers an order outside the approver's sales scope ORGANIZATION_DENIED, not as
    missing (only to a holder of SALES_ORDER_APPROVE);
  - SalesOrderApproval's batch feature failed once (successCount 1) on the first run after the master merge with
    StorelessOrderConfirmation beside it, and passed in the five runs after; no cause found;
  - the Built note's findings stand. On its first two: Sales' Approve deciding the order rules with the setting off is right to
    keep (the rule is the seller's ask for separation and leaves an audit of who decided; the native path stays as built, the owner
    contract); for the unassigned approver, recommend read-only sight of an order they decided (an OrderDecision of theirs), not the
    organization's approved orders, so they can follow it without SALES_TEAM_VIEW.
- Tests run (release binary, `--nobuild`, this worktree's runtime): mr-mantle SalesOrderApproval 4 of 4 and StorelessOrderConfirmation
  1 of 1 (six runs together or alone, 27 to 62 s; the one batch failure above); SalesWorkspace, SalesQuoteResponse, SalesQuoteIssue, SalesQuoteApprovals,
  OrderLifecycle, OrderChanges, PurchaseApprovals, PurchaseHoldPermission, ShopCheckout, StoreCheckout, ShopSubscriptions,
  OrderToCashBasicFlow, WorkProjectMilestones, AccountingCredit, AccountingReturns, ReturnToResponseBasicFlow, OrderConfirmations,
  DeliveryLedger, Suppressions, Audiences and OrderBulk 180 of 180 (24 specs with dependencies, 80 s). mr-boss SalesOrders,
  SalesAccess, SalesHome, SalesQuotes, SalesQuoteSend, SalesApprovals, SalesOpportunities, InsightsHome, CustomerServiceOrders,
  CustomerServiceOrderChanges, CustomerServiceAccess, CommerceOrders, CommerceAccess, ProjectsAccess, AccountingReceivables,
  MarketingLists, RecordFiles and Chat 129 of 129 (57 s). mr-pass whole suite 190 of 190 (13.4 s of its 20 s). R1's check fails on
  the unfixed code. Prettier clean. Not run: test-apps, test-framework, acceptance (SalesOrderScenarios written, not run).
- For the lead:
  - budget share: mr-mantle about 3.2 s (R2's checks add about 0.2 s to SalesOrderApproval); mr-boss as the Built note;
  - merge hot spots beside the Built note's: mr-mantle `test/order/SalesOrderApproval.spec.js`,
    `test/order/StorelessOrderConfirmation.spec.js`, `service/mantle/order/SalesOrders.js` sendConfirmation;
  - Attack-Surface: the worker's paragraph is right but for three points; corrected: "Sales' orders
    (`mantle.order.SalesOrderServices`, all `allow-remote="false"`): each verb needs its permission on an order of the caller's sales
    scope (another's answers as missing); an order approver (`SALES_ORDER_APPROVE` or `ORDER_APPROVE`) reads the organization's placed
    and held orders to decide them, never edits, cancels or copies them, and holds or releases only a Manual or Change hold by that
    type's permission; `approve#SalesOrder` locks the order and records each order rule's decision at the revision read, the
    order's owner, enterer, placer and a line's price author refused unless the rule allows it, then calls `approve#Order`, whose
    credit check runs; where the seller's SalesPolicy approval setting is on, `autoApprove#Order` approves no order with a sales part
    of it and `approve#Order` needs `SALES_ORDER_APPROVE` in the approver's sales scope and those decisions; the only system approval
    is Sales' own of an accepted net-terms order while that setting is off, a claim Mantle's code sets in the execution context's
    shared map for that one order and clears when `approve#Order` returns, never a request value; `hold#Order` and
    `release#OrderHold` answer a user's Manual, Change or Purchase reason on an order of an organization they do not work for as
    missing, and Sales places and releases only Manual and Change holds; the storeless confirmation goes once for an order's revision
    and recipient from the organization's own address, the delivery naming the organization so its suppressions apply.";
  - the user's call, if the lead agrees: whether the approval setting with no order rule should also refuse the order's own owner,
    enterer or placer (the first finding above).

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

**Built Nov 14 (P12).** mr-mantle and mr-boss on branch `sal/p12` (hashes in the worker's reply); mr-moqui and mr-pass unchanged, no
Rust built.
- Checked first (the code over the plan): P7's, P10's and P11's Built and Review notes, §4 (the Nov 11 template row, the Nov 14 rows),
  F7 and the readers of `OrpRecurringTemplate`; `clone#Order`, `create#Order`, `update#OrderStatus`; SalesQuotes.js (createQuote, the
  line verbs, priceFields), SalesAccess.js (`orderExcludedPurposes` already named `OrpSalesQuoteTemplate`, P11), SalesAccounts.js
  (`ordersOf` already left it out), SalesOrders.js findOrders; Shared/OrderDetail's quote line editor. The code over the plan:
  - who maintains templates: design §2 gives QuoteTemplates to R, M and S and QuoteTemplateDetail to M and S, and no permission names
    templates; a template manager is SALES_QUOTE_EDIT with SALES_TEAM_MANAGE or SALES_CONFIGURE (the manager and the administrator, as
    `mergesFor`), a Sales reader sees the current templates; no new permission and no setup row;
  - "never placed and never leaves Open" is a guard in `update#OrderStatus` (QUOTE_TEMPLATE for any other status), the one status
    write behind propose, place, approve and cancel, on the header it already reads; `create#InvoiceFromSource` and Payables' order
    source refuse a template too (QUOTE_TEMPLATE);
  - the design's header fields: OrderHeader gains `templateDescription` and `templateValidityDays` (no table); the "currency policy" is
    the template's one currency (create#Order always sets one), a quote from it in that currency (TEMPLATE_CURRENCY); the "terms/print
    template" is not built (a template's own text location would be rendered into a customer's PDF from a location a manager types;
    the quote takes its organization's SalesPolicy text, as before);
  - the line editor: `store#QuoteLine` and `delete#QuoteLine` admit a template draft (SalesQuotes.js `lineTarget`), so the template's
    lines are priced, checked and free-line-ruled as a quote's; a template line has no customer, so a product with no seller's price of
    its own is admitted unpriced (create#OrderItem stores 0, no source) and priced on each quote for its customer; an entered price is
    the template's fixed price with its reason (the "authorized contractual fixed price"), kept on the quote with today's calculated
    basis beside it and its author, so the quote's manual-price, discount and free-line rules read it as entered;
  - "copied with clone#Order": `create#Quote` with `templateOrderId` clones the template (no parties, payments, notes, files or work
    efforts; the template's two header fields cleared), its parentOrderId naming the template, then reprices each product line as of
    now, deletes any tax line and runs `handle#OrderMajorChange` (X1); a line left without a price or not usable for the customer is
    named in a new `warnings` output, and propose#Quote refuses it until the rep prices it;
  - a dated successor is a draft clone of the published template (parentOrderId names it, one at a time: SUCCESSOR_EXISTS); its publish
    ends the predecessor at its start; `end#QuoteTemplate` (not in the plan's list) ends a published template or sets a draft aside;
  - the user's call of Nov 14 (P11's review): `orderOf` admits an order approver read only to an order they recorded a decision on (an
    OrderDecision of theirs, approved or refused) once it is approved, and find#SalesOrders' approver reach adds those orders; with no
    order rule met, `approve#SalesOrder` records no decision, so such an approver still loses sight of the order once approved (below).
- Mantle:
  - `entity/SalesQuoteTemplateEntities.xml` (new): the purpose `OrpSalesQuoteTemplate`; OrderHeader's `templateDescription` and
    `templateValidityDays`.
  - `service/mantle/order/SalesQuoteTemplates.js` (new) and a P12 block of `SalesQuoteServices.xml`: `find#QuoteTemplates` (a reader's
    current ones; a manager's open, current, draft, scheduled, ended or all; organization, text, product; paged), `get#QuoteTemplate`,
    `store#QuoteTemplate` (NAME_REQUIRED, CURRENCY_FIXED, TEMPLATE_DRAFT, SUCCESSOR_EXISTS, VALIDITY_INVALID, the revision),
    `publish#QuoteTemplate` (LINES_REQUIRED, DATE_INVALID, VALIDITY_INVALID, SUCCESSOR_EXISTS), `end#QuoteTemplate` (TEMPLATE_ENDED),
    `preview#QuoteTemplate` (a customer of the organization or none, a date; warnings; no tax), and `usableTemplate`, `cloneForQuote`,
    `priceCopy` for create#Quote. create#Quote's `templateOrderId` and `warnings` (RECORD_UNAVAILABLE, TEMPLATE_UNAVAILABLE,
    TEMPLATE_INVALID, TEMPLATE_CURRENCY).
  - `SalesAccess.js` (a P12 block before the module value): `templatePurpose`, `templateManager`, `templateState`, `templateOf`,
    `requireTemplate` (RECORD_UNAVAILABLE, PERMISSION_DENIED, TEMPLATE_PUBLISHED), `decidedOrderIds`; `orderOf`'s approver test.
    `SalesQuotes.js` (createQuote's template branch, `lineTarget`, priceFields' unpriced template line); `SalesOrders.js` (findOrders'
    approver reach).
  - F7's readers (owner contracts, each beside its `OrpRecurringTemplate` test): `OrderServices.xml` update#OrderStatus;
    `StoreOperations.js` withoutRecurringBases; `OrderInfoServices.xml` send#OrderStoreEmail; `SalesReportServices.xml` (the two
    summaries); `AssetServices.xml` (both reservation checks); `InvoiceServices.xml` create#InvoiceFromSource; `Payables.js`
    invoiceSource; `Credit.js` the open orders; `SubscriptionServices.xml` fulfill#OrderSubscriptions.
- BOSS:
  - Screens: `Sales/Quotes/QuoteTemplates.xml` (new, tab 3 "Quote templates": TemplateFind in the list's header, TemplateList, the
    manager's saved lists Open, Published, Drafts, Scheduled and Ended, NewTemplate); `Sales/Quotes/QuoteTemplateDetail.xml` (new, hidden
    from the menu: TemplateHeader with the state's one primary, Add line, Publish, New quote or Start successor, and More with Add
    shipping charge, Edit template, End or Set aside and the predecessor and successor; Overview; TemplateItems over the quote draft's
    salesStoreLine and salesDeleteLine; TemplatePreview; History); `template/SalesQuoteTemplates.xml` (new: createQuoteTemplate,
    salesStoreTemplate, salesSucceedTemplate, salesPublishTemplate, salesEndTemplate); `template/SalesQuoteForms.xml` (NewQuote's
    template choice) and `template/SalesQuotes.xml` (createQuote passes it and warns of the lines left for the rep); `Sales/Quotes.xml`
    (comment).
  - `Sales.js` (a P12 block after P9's choices): linkPaths Quotes/QuoteTemplates and Quotes/QuoteTemplateDetail, the choice
    `quoteTemplates` (find#QuoteTemplates' current ones of the selling organization).
  - Demo (`data/BossZSalesDemoData.xml`, a P12 block at the end): Retail's published "Store refit starter" (sales.manager's: Demo
    Product One-One priced on the quote's date, One-Two at a fixed bundle rate, an installation charge, quotes valid 45 days) and a
    draft "Yearly service visit".
- Specs:
  - Mantle `test/order/SalesQuoteTemplates` (new, 4 features, 1.6 s): a manager keeps a draft (a line priced on the quote's date, a fixed
    line with its reason, a charge, a customer-priced product admitted unpriced), refused to a rep for the permission and to B's manager
    as missing, hidden from the rep until published, previewed for the account (340), published, then refused an edit
    (TEMPLATE_PUBLISHED), listed to the rep; a quote from it after the price rose from 100 to 120 is priced 120, the fixed line 45 beside
    a 50 basis with its reason, the customer-priced line 70, 14 days valid, parentOrderId the template, the template unchanged, another
    currency and another organization refused; a successor (a second refused) with a changed quantity, published, ends the first
    (refused to the rep as missing, to the manager TEMPLATE_UNAVAILABLE), the earlier quote's lines and revision unchanged, the next
    quote of 3; neither template among find#Quotes' "all" or find#SalesOrders, not a quote (get#Quote, propose#Quote), place#Order
    refused QUOTE_TEMPLATE, no reservation. `SalesOrderApproval` (the carry-over, about 0.1 s): the approver who decided the store order
    still sees it read only once approved, and not the order of the first feature approved with no decision of theirs, in get#SalesOrder
    and find#SalesOrders.
  - mr-boss `test/Sales/SalesQuoteTemplates` (new, 1 feature, 0.25 s warm, 0.9 s cold): QuoteTemplateDetail's one qvt render as the
    manager (published, Start successor, New quote, the fixed rate's reason, the preview for Wingtip with its total, no line editing)
    and Quote templates' one html render as the rep (the published template, not the draft, no New template). `SalesAccess` (a P12
    feature, 0.19 s): the draft's change refused the rep for the permission and reaching the manager's revision check with the same
    parameters, the published template read by the rep and missing to Ziziwork Sales' rep. `SalesSpecLib.js`: the Quotes tabs with
    QuoteTemplates, the demo templates.
  - Acceptance, written and not run: `test/acceptance/Sales/SalesTemplateUsable` (3 features through the screens' transitions: the
    manager's template with a priced and a fixed line published; the rep's quote from it for Wingtip at Wingtip's price with the fixed
    line; the successor published, the first template ended, the first quote's lines and print unchanged, the next quote copying the
    successor).
- Tests run (release binary, `--nobuild`, this worktree's runtime): mr-mantle SalesQuoteTemplates, SalesQuoteDrafts, SalesQuoteIssue,
  SalesQuoteResponse, SalesQuoteApprovals, SalesQuoteRequests, SalesWorkspace, SalesOrderApproval, StorelessOrderConfirmation,
  StorelessOrderTax, StoreOperations, StoreReports, OrderLifecycle, ShopCheckout, ShopSubscriptions, Subscriptions, AccountingCredit,
  PurchaseBills, OrderToCashBasicFlow, OrderConfirmations, OrderChanges, SalesAccounts, SalesOpportunities, AccountingReturns and
  RecordVisibility 184 of 184 (27 specs with dependencies, 95 s), then SalesQuoteTemplates and SalesQuoteDrafts again after the last
  changes. mr-boss SalesQuoteTemplates, SalesAccess, SalesQuotes, SalesOrders, SalesQuoteSend, SalesHome, QuickCreate,
  SalesOpportunities, SalesAccounts, SalesApprovals, SalesQuoteRequests, CommerceOrders, CustomerServiceOrders and InsightsHome 71 of 71
  (14 specs, 47 s); a draft's qvt and tui renders, the manager's list and NewQuote's template choice were checked once by hand and not
  kept. mr-pass whole suite 190 of 190 (19.6 s of its 20 s under the parallel workers' load; 13.4 s at P11's review). `moqui lint
  --screens` (release): 141 flagged sites, as before, none in a new or changed screen. Prettier clean on the new and changed
  JavaScript. Not run: the client walk (no screen it walks changed), ./moq test-apps, test-framework, the acceptance suite.
- Inventories: usl-inventory's clone#Order and get#ProductPrice rows and an "Added in the Sales build: quote templates" table;
  ss-inventory unchanged (no baseline form maps to QuoteTemplates or QuoteTemplateDetail).
- Design edits: design-sales §5 "As built (impl-sales P12)" and §6's order scope (the approver's decided orders).
- Findings, numbered by the lead F212 to F218 in order:
  - a template's own terms and print text (design §5 TemplateHeader) is not built: a quote from a template takes its organization's
    stored text; a per-template text needs a registered text choice an administrator sets, not a location a manager types;
  - with no order rule met, `approve#SalesOrder` records no OrderDecision, so the approver who approved such an order loses sight of
    it once approved (the carry-over covers the orders they decided a rule on); recording a no-rule decision would change P9's rule
    reading (a decision with no policy is the unconfigured manual-price rule's);
  - a template's fixed line keeps the template author as `priceOverrideUserId` on the quote, so that author may not approve the
    quote's manual-price rule for it (separation by price author, P9); the rep who copied it may;
  - a template line with no seller's price is stored at 0 with no source (create#OrderItem's default), shown unpriced on the detail
    and counted 0 in its example total; the preview prices it for the customer chosen;
  - TemplateFind's category filter (design §5) is not built; a product filter is;
  - Quote templates is shown to every Sales reader (R), who sees only the published ones; drafts, scheduled and ended templates are
    the manager's and the administrator's;
  - `docs/security/Attack-Surface.md` (mr-moqui) does not name the template verbs; P12 had no mr-moqui worktree.
- For the lead:
  - budget share: mr-mantle about 1.7 s (SalesQuoteTemplates 1.6 s, SalesOrderApproval's checks about 0.1 s); mr-boss server about
    0.45 s (SalesQuoteTemplates 0.25 s warm, SalesAccess' P12 feature 0.19 s); client none;
  - merge hot spots (P13 beside it): mr-mantle `service/mantle/sales/SalesAccess.js` (orderOf's approver test in P11's block; a P12
    block before the module value; exports at the end), `service/mantle/order/SalesQuoteServices.xml` (create#Quote's parameters and
    description, store#QuoteLine's and delete#QuoteLine's descriptions, a P12 block at the end before `</services>`, the file comment),
    `SalesQuotes.js` (createQuote, storeLine and deleteLine, priceFields), `SalesOrders.js` findOrders, `OrderServices.xml`
    update#OrderStatus, `test/order/SalesOrderApproval.spec.js` (feature 2); the F7 readers above (Shop's, Accounting's, the sales
    summaries); mr-boss `service/ironstone/sales/Sales.js` (a P12 block after P9's choices, before accountContactIds),
    `data/BossZSalesDemoData.xml` (a P12 block at the end), `template/SalesQuotes.xml` (createQuote), `template/SalesQuoteForms.xml`
    (NewQuote), `screen/Sales/Quotes.xml` (comment), `test/Sales/SalesAccess.spec.js` (a feature at the end),
    `test/Sales/SalesSpecLib.js` (quotesMenu, approverQuotesMenu, templates), `plan/usl-inventory.md`, `plan/design-sales.md` (§5 as
    built, §6's order scope). BossSetupSalesData.xml, Sales.xml and SalesQuoteIssues.js are not touched;
  - Attack-Surface (mr-moqui `docs/security/Attack-Surface.md`), a paragraph after Sales' orders: "Sales' quote templates (in
    `mantle.order.SalesQuoteServices`, all `allow-remote="false"`): orders of purpose `OrpSalesQuoteTemplate`, which
    `mantle.order.OrderServices.update#OrderStatus` keeps Open and invoicing refuses; a Sales reader of the organization reads the
    current ones, and only a template manager (`SALES_QUOTE_EDIT` with `SALES_TEAM_MANAGE` or `SALES_CONFIGURE`) reads the others and
    changes a draft, at its revision; another organization's answers as missing; a template's lines go through the quote line verbs,
    priced by the seller's authority for no customer; `create#Quote` copies only a current template of the quote's organization, in its
    currency, and reprices it for the quote's customer as of the quote's date. An order approver reads an approved order only when they
    recorded a decision on it.";
  - the user's call, if the lead agrees: whether `approve#SalesOrder` should record a decision when no order rule is met, so the
    approver keeps sight of every order they approved (the second finding).

**Review 2026-11-14 (P12).** A fresh review of `sal/p12` (mr-mantle 81856f2e, mr-boss 487c9312; master had nothing newer, so no merge)
against P12, §2, §4 (the Nov 11 template row, the Nov 14 rows), F7 and design-sales §5 and §6.
- Checked and sound: the template scope (`templateOf`: a Sales reader of the organization sees current ones only, a template manager
  every one and changes a draft only; another organization, or a state the caller does not see, answers as missing; a rep's and B's
  manager's edits refused as the spec shows); every verb takes the template's organization from its own part, never a parameter;
  revisions on store, publish, end and the line verbs; publish's date window, the predecessor ended at the successor's start, one
  successor at a time; `create#Quote` copies only a current template of the quote's organization in its currency, through
  `clone#Order` with no payments, notes, files or parties, the template's two fields cleared, then prices each product line through
  `get#SellerProductPrice` for the quote's customer as of now (P7's date for every quote line; no cost, no other party's price),
  deletes copied tax and retaxes (X1); `preview#QuoteTemplate` writes nothing and prices only for an account the caller sees.
  `update#OrderStatus`'s guard: every status path (propose, place, approve, cancel, reject, the part-status checks behind
  cancel#OrderPart, bulk status changes) goes through it, and it reads only the order's own purpose, so no other order is touched.
  F7's readers in Mantle (credit, both reservation checks, invoicing and Payables' source, store mail, store worklists, the sales
  summaries, subscription fulfillment), Sales' own (find#Quotes, find#SalesOrders, ordersOf, Home) and the customer-keyed readers
  (Shop, PASS, Accounting's and Customer Service's customer lists, promotions, new-customer counts, Commerce's store-keyed lists and
  palette) leave a template out; the five report definitions whose filter names only `OrpRecurringTemplate` (mantle-sales,
  boss-commerce-store-operations, insights-suite-orders and -order-value) read the `mantle-sales-orders` dataset, whose time field
  is `placedDate`, which a template never has. Screens: one qvt render of QuoteTemplateDetail and one html render of Quote
  templates in the regression suite; the transitions call only the guarded services.
- R1 (confidentiality and F7, medium): a template was an order to every other app. Customer Service's order record kind (a part
  sold by an internal organization, every customer served: a template has none) admitted it, so an agent of Retail found the demo
  template by id or name in the order lookup and the palette and opened it in OrderDetail; and the record rule
  (`get#RecordLinkInfo`, behind Chatter, RecordFiles, Product360's connections and palette hits) fell through to the generic order
  rule, so any user of the organization with the order filter saw a draft or ended template. Fixed: `check#QuoteAccess` answers a
  template by `templateOf`, and the record rule sends a template there as it does an unplaced quote (CommunicationServices.xml);
  CustomerService.js `readOrder` and `isSalesOrder` leave the purpose out. Spec checks: Mantle SalesQuoteTemplates feature 4 (a
  clerk of A with the record rule sees no template; the rep the current one and not the ended one; the manager the ended one) and
  mr-boss SalesQuoteTemplates feature 2 (Customer Service's lookup finds neither the template's id nor its name); each failed on the
  unfixed code.
- R2 (the user's call of Nov 14, §4): `approve#SalesOrder` records a decision on every approval: with no order rule left to decide,
  one OrderDecision of purpose SapOrder with no rule (SalesApprovals.js `decideOrderRules`; decidedCount still counts rule
  decisions). No requirement reads an order decision with no policy (the policy-less "default" key is only a quote's unconfigured
  manual-price rule). Spec check: SalesOrderApproval feature 1 approves an order of A through Sales before any order rule exists
  (one decision, no policy, the approver's) and feature 2 finds it read only in get#SalesOrder and find#SalesOrders; failed on the
  unfixed code.
- R3 (separation, low; the Built note's third finding): a template's fixed line kept the template author as the quote line's price
  author, so the manager who wrote the template could never approve a quote's manual-price rule for it, while the price on this quote
  was put there by the rep who chose the template. Fixed: `priceCopy` makes the quote's maker the author (priceOverrideUserId and
  date), keeping the price and reason; the rep is refused the rule as owner and author, the template's author may decide it. Spec
  check: SalesQuoteTemplates feature 2 (the fixed line's author is the rep); failed on the unfixed code.
- Findings, numbered by the lead F219 to F222 in order:
  - the five report definitions above name only `OrpRecurringTemplate` in their "Not a recurring base order" filter; a template is
    left out by the dataset's `placedDate` time field, not by the filter, so a panel without a time range would count its lines;
  - the palette has no Sales link for a template (it falls through to no app); QuoteTemplateDetail is reached from Quote templates;
  - `decidedBy` counts any decision of the caller, a SapQuote decision on the quote before it became the order included, as the
    Nov 14 row reads ("a decision on it"); a quote approver who also approves orders keeps read-only sight of that order;
  - the Built note's other findings stand as written (no per-template terms text, no category filter, the unpriced line at 0 on
    the detail, Quote templates shown to every reader).
- Tests run (release binary, `--nobuild`, this worktree's runtime): mr-mantle SalesQuoteTemplates, SalesOrderApproval,
  SalesQuoteApprovals, SalesQuoteDrafts, SalesQuoteIssue, RecordVisibility, SalesWorkspace and StorelessOrderConfirmation 41 of 41
  (8 specs, 48 s; SalesQuoteTemplates 1.7 s, SalesOrderApproval 3.5 s); mr-boss SalesQuoteTemplates, CustomerServiceOrders,
  SalesOrders, SalesApprovals, SalesAccess and SalesQuotes 27 of 27 (35 s; SalesQuoteTemplates 0.3 s), CustomerServiceAccess and
  CommerceOrders 24 of 24 (37 s). Each new check run once against the unfixed code and failed. Prettier clean on the changed
  JavaScript. No screen changed, so no lint. Not run: test-apps, the acceptance suite (SalesTemplateUsable unchanged).
- For the lead:
  - budget share: mr-mantle about +0.1 s (feature 4's record-rule checks, feature 1's no-rule approval); mr-boss about +0.1 s
    (SalesQuoteTemplates feature 2, no render);
  - merge hot spots beyond the Built note's: mr-mantle `service/mantle/party/CommunicationServices.xml` (the quote branch of the
    record rule and its description), `SalesQuotes.js` quoteAccess, `SalesQuoteServices.xml` check#QuoteAccess's description,
    `SalesApprovals.js` decideOrderRules, `SalesOrderServices.xml` approve#SalesOrder's description; mr-boss
    `service/ironstone/customerservice/CustomerService.js` (readOrder, isSalesOrder), `plan/design-sales.md` (§5 as built, §6);
  - §4 row added (Nov 14, the user's call on the decision on every approval);
  - Attack-Surface (mr-moqui `docs/security/Attack-Surface.md`), a paragraph after Sales' orders: "Sales' quote templates (in
    `mantle.order.SalesQuoteServices`, all `allow-remote="false"`): orders of purpose `OrpSalesQuoteTemplate`, which
    `mantle.order.OrderServices.update#OrderStatus` keeps Open (so they are never proposed, placed, approved or cancelled), which
    invoicing refuses and which reservation, credit, store mail, store worklists and the sales summaries leave out; a Sales reader
    of the organization reads the current ones, and only a template manager (`SALES_QUOTE_EDIT` with `SALES_TEAM_MANAGE` or
    `SALES_CONFIGURE`) reads the others and changes a draft, at its revision, a published one only through a dated successor;
    another organization's, or one the caller may not read, answers as missing, and the record rule behind Chatter, files, product
    connections and the palette (`check#QuoteAccess`) gives the same answer in every app, while Customer Service's orders leave
    templates out; a template's lines go through the quote line verbs, priced by the seller's authority for no customer;
    `create#Quote` copies only a current template of the quote's organization, in its currency, and reprices it for the quote's
    customer as of the quote's date, a fixed line keeping its price and reason with the quote's maker as its price author;
    `preview#QuoteTemplate` writes nothing and prices only for an account the caller reads. `approve#SalesOrder` records the
    approver's decision on every approval, and an order approver reads an approved order only when they recorded a decision on
    it." (It replaces the Built note's draft of the paragraph.)

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

**Built Nov 14 (P13).** mr-mantle, mr-pass and mr-boss on branch `sal/p13` (hashes in the worker's reply), from master (P11 merged);
mr-moqui unchanged, no Rust built.
- Checked first (the code over the plan): P10's and P11's Built and Review notes, §4 (the PASS Sales, threshold and `SalesOrder`
  scope rows), F17, F18, F36, F42, F48, F73 and F186; ExternalAccess.js (the kinds, `check`, the self relationship, `invite`),
  ExternalAccessServices, PublicApps.js, AccountHub.js; SalesQuoteIssues.js (send, the ledger's build, respond, revise,
  withdraw), SalesPolicyThreshold; mr-pass README, Deployment.md ("Adding an app", Support), the Support app's pages,
  Shared/Portal.js, Facade.js, Transport.js, Schema.js and Routes.js with Mantle's copies, PassApi.js and PassAuthority.js
  (`TOKEN_WRITES`, `REASONS`, `DOWNLOADS`), SupportPortal.js (the pattern of a portal module), Headers.js; Customer Service's
  Invite to support (the BOSS pattern). The code over the plan:
  - every PASS operation is a camelCase name, so the plan's `sales.findQuotes` … `sales.getQuoteResponse` are `findSalesQuotes`,
    `getSalesQuote`, `getSalesQuoteDocument`, `respondSalesQuote` and `getSalesQuoteResponse`; the reads are GET routes with the
    token in the authority's query, as the Support app's (`getCustomerCase`, `getCaseFile`), and only `respondSalesQuote` is in
    the three `TOKEN_WRITES` lists, as the plan says; the PDF is in PassAuthority's `DOWNLOADS`;
  - the ledger keeps no token (MessageDeliveries.js: "a link's token is made for the send"), so `send#Quote` makes each
    recipient's link in the ledger's build at each attempt and in the rep's own send, not one capability at the issue; the stored
    PDF is one per issue, so it carries the quote's page with no token (`/sales/CustomerQuote?orderId=`, a signed-in contact's)
    and its QR (`ec.resource.barcodeSvg('QR', …)`), never a bearer link;
  - `create#AccessCapability` would have let a `SUPPORT_CASE_EDIT` holder mint any `SalesOrder` scope: the kind now has scope
    permissions (`SALES_QUOTE_SEND` for the quote scopes), a scope's own page and app (Sales' mount on a site targeting the
    organization; OrderView keeps Shop's page on the store's site), and bound scopes that need a `recordRevision` and are never
    mixed with an order's, so only `send#Quote` makes a quote link; the kind resolves a quote (purpose `OrpSalesQuote`, out of
    draft) for the quote scopes and an order as before for the others;
  - `respond#CustomerQuote` is "the same `respond#Quote` as the staff path" as one lifecycle, `respondTo` in SalesQuoteIssues.js,
    which `respond#Quote` now calls with its staff checks unchanged (same request hash, same refusals) and the portal calls with
    the customer's identity; the response keeps the capability, the acceptor's name and title (SalesQuoteResponse `capabilityId`,
    `acceptorName`, `acceptorTitle`, a P13 extend-entity) and source SqsPortal;
  - Mantle's readiness is where readiness lives, so "readiness for an organization with no published Sales mount" is Sales'
    `sales.publicApp` check (a warning) in SalesSettings.js, beside PASS's own `check#SalesAppReadiness` for a site;
  - Smithy reserves every PASS app's default base as a group path (SmithyCore.js `reservedNames`, its spec counting Apps.js), so
    `sales` joins it (owner contract with Smithy);
  - SalesDefaults' publish dialog lists its fields in a `field-layout`, and P10's `responsePoRequired` and `reminderDays` were in
    no row, so the dialog never showed them (an unreferenced visible field is not rendered, form.rs); they are in a row now, with
    the threshold.
- Mantle:
  - `service/mantle/order/SalesPortal.js` and `SalesPortalServices.xml` (new, P of design §12.1): `find#CustomerQuotes` (a
    signed-in account's issued quotes of the customers it acts for, each quote's latest issue, state open or all, paged),
    `get#CustomerQuote` (the offer's lines and totals as text, terms as plain text, the PDF's name, the response, what the page may
    do), `get#QuoteDocument` (the issue's PDF for the facade, its location never in a page), `respond#CustomerQuote` (the revision
    seen, the terms acknowledged, the PO, the acceptor; or a decline's reason; an operation key `sqp-<operationId>` bound to the
    capability or the signed-in party, the organization, the issue and the payload, F36; limited per requester),
    `get#QuoteResponse` (the receipt), `check#SalesAppReadiness`, `get#AccountCard` (Quotes and orders: open quotes). The asker:
    the sales mount's target on a published site; a token's capability (QuoteView or QuoteRespond) reaching the issue at its bound
    revision while it stands or once answered, an order ID beside it the token's own; or a signed-in contact grant of the `sales`
    app or the customer's own verified account (`actingParties`), reaching the latest issue. Every miss is the same NotFound.
  - The threshold: above the seller's SalesPolicyThreshold for the quote's currency a link alone gets ACCEPTANCE_SIGN_IN_REQUIRED
    (still Decline); a request signed in for the customer accepts.
  - `ExternalAccess.js` (owner contract, F17): the `SalesOrder` kind's QuoteView and QuoteRespond (above), `appOf` and `pageOf`,
    `requirePermissions` and `requireIssuer` by scope, `quoteScopes` exported; `appKinds.sales` (`SALES_CUSTOMER_INVITE`, a person
    admitted, the party a Customer). `ExternalAccessServices.xml`: `create#AccessCapability` passes its scopes to the issuer check.
  - `SalesQuoteIssues.js`: a P13 block (`quotePageUrl`, `quoteLink`, `revokeLinks`, `qrOf`), `textMap`'s link, `offerOf` taken out
    of `printOf` (the print and the PASS page read one projection), the link in the ledger's build and the own send, the links
    revoked by `revise#Quote` and `withdraw#Quote`, `respondTo`, and exports for SalesPortal.js.
  - `entity/SalesQuoteIssueEntities.xml` (a P13 extend-entity of SalesQuoteResponse); `PublicApps.js` (`sales`: organization
    target, readiness, account card); `ForumSchema.js`, `script/PassRoutes.js`, `PassApi.js`, `PassAuthority.js` (the five
    operations, `respondSalesQuote` in `TOKEN_WRITES`, `getSalesQuoteDocument` in `DOWNLOADS`, the reasons
    `acceptanceSignInRequired` and `responseRecorded`); `SalesSettings.js` (`sales.publicApp`); `SalesAccounts.js` and
    `AccountServices.xml` (a P13 block: `get#SalesInvite`, `invite#SalesContact`: `SALES_CUSTOMER_INVITE`, a customer account of
    the scope, a current contact of it or the person account itself, one of the contact's own addresses, an organization of the
    scope serving the account with a published PASS Sales site, then `invite#Contact` for the `sales` app); `SmithyCore.js`.
- PASS (F18, Deployment.md "Adding an app"):
  - `screen/Sales.xml` and `screen/Sales/`: CustomerQuotes, CustomerQuote (`respond` and `document` transitions) and QuoteResponse,
    plain HTML forms in `.html.fancy` pages over `Sales/Sales.js` and `Shared/Portal.js`, as the Support pages are; Accept (the
    revision and total stated, PO, name, title, the terms' checkbox, a request key) and Decline (a reason); the sign-in link above
    the threshold; a wrong, expired, revoked or ended link reads "This quote is not available" with the sales contact as the route.
  - Registrations: `service/pass/Apps.js`, `Pass.xml`, the header's branch (My quotes), Account › Settings' Quotes link,
    `Schema.js` and `Routes.js` (identical to Mantle's copies), `Transport.js` `TOKEN_WRITES`, `Portal.js` `reasons`,
    `Contracts.d.ts`, the test runtime's `/sales` mount, Portals' targeted apps (`billing,sales,shop,supplier,support`); the Account
    hub's card comes from PublicApps' registration (orders join with P17). `docs/Deployment.md` "Sales app"; README.
- BOSS: `template/SalesInvite.xml` (new: Invite to Sales over Mantle's two services, the link shown once), included in
  `Shared/Customer360.xml` (owner contract: the transition) through `template/SalesCustomer360.xml`'s header and in
  `Sales/Accounts/ContactDetail.xml` for a contact; `Sales/Settings/SalesDefaults.xml` (the acceptance threshold of one currency,
  the others kept; shown in In effect; P10's two fields in the dialog's layout).
- Specs:
  - Mantle `test/order/SalesPortal` (new, 4 features, 3.1 s): the quote's mail carries its recipient's link to the Sales mount and
    the print the quote's page and QR with no token; the link reads its one issue and PDF (no location in the view) and no list;
    another customer's quote, a changed order ID, a forged token, an order ID with no sign-in and a revised issue give nothing; a
    double submit gives one response (SqsPortal, the capability, no user) and one placed order, a retry answering it, another
    link's use of the key a conflict, another link's new key the same receipt, a decline after it RESPONSE_RECORDED; a contact of
    the account lists only its account's issued quotes (no draft, no other customer's), an uninvited account none; above the
    threshold a link is refused (ACCEPTANCE_SIGN_IN_REQUIRED, Decline still offered) and the signed-in contact accepts.
  - mr-pass `test/Sales/SalesPortalAccess` (new, 2 features, 0.1 s; its issue made without a PDF): CustomerQuote's one render by a
    link with Accept and Decline; a forged link, a changed ID and an early receipt read "not available" with nothing of the
    quote; My quotes asks a visitor to sign in; the five operations in both copies of the schema and routes, the response a POST
    and a bearer write in the three lists. Fixtures for the acceptance tests in `test/Sales/SalesQuoteFixtures.js`. Portals' and
    Smithy's specs follow the new app.
  - mr-boss `SalesAccess` (a P13 feature, 0.1 s): with the same parameters the manager reaches the address check, the rep is
    refused for SALES_CUSTOMER_INVITE and the manager is refused Ziziwork Sales' account as missing.
  - Acceptance, written and not run: mr-pass `test/acceptance/SalesQuoteScenarios` (3 features: the mailed link's offer, PDF,
    acceptance with a PO and the receipt twice, staff seeing the customer's response; Invite to Sales redeemed, the contact's My
    quotes and Account hub card; isolation, a revised link, the threshold) and `test/acceptance/client/SalesQuoteHttp` (2
    features: the walk at 390 px through Accept to the receipt and back; plain requests, the same through a remote frontend: the
    invited contact's My quotes, forged and crossed links and another customer's quote), with `SalesQuoteFixtures` on PASS_HTTP,
    registered in `client/suite.js`.
- Tests run (release binary, `--nobuild`, this worktree's runtime): mr-mantle SalesPortal 4 of 4 (twice), then SalesQuoteIssue,
  SalesQuoteResponse, SalesPipelineSetup, SupportPortal, CaseFeedback, SupplierPortal, ShopCheckout, ReturnPolicies,
  AccountingPortals, SupportChannels, StoreFulfillment, SalesOrderApproval, StorelessOrderConfirmation and SalesQuoteRequests 90
  of 92 run (one skipped; SalesOrderApproval's batch feature failed once beside StorelessOrderConfirmation, F210's flake, and passed
  alone, 4 of 4), and after the last changes SalesPortal, SalesQuoteIssue, SalesQuoteResponse and SalesPipelineSetup 18 of 18.
  mr-pass whole suite 191 of 192, Smithy's app count then fixed (14 of 14), 16.6 s of its 20 s under the parallel workers' load
  (P11's run read 13.4 s). mr-boss SalesAccess, SalesSettings, SalesAccounts, SalesQuotes, SalesQuoteSend, SalesOrders,
  AccountingReceivables, AdminRegistries 44 of 44, and AccountingCollections, CustomerServiceAccess, CustomerServiceOrders,
  ProjectsAccess, InsightsRecords, CommerceAccess 70 of 70. `moqui lint --screens` (release): 141 flagged sites, as before, none in
  a new or changed screen; parse failures 0. Prettier (mr-moqui's config) on the changed and new JavaScript. Not run: the client
  walk (no screen it walks changed), ./moq test-apps, test-framework, the acceptance suite.
- Inventories: usl-inventory's ExternalAccessServices rows (check, create, invite, revoke) and an "Added in the Sales build: PASS
  Sales quotes" table; ss-inventory has no row naming a PASS Sales path.
- Design edits: design-sales §10 "As built (impl-sales P13)"; design-crosscut's PASS Sales row (built) and CX-CUSTOMER-ACCOUNT
  (a quote link only from `send#Quote`).
- Findings, numbered by the lead F223 to F234 in order:
  - the PASS operations are camelCase (`findSalesQuotes` …), and the reads GET routes with the token in the authority's query, as
    Support's; design §10.1 names them `sales.*`;
  - the issued PDF carries the quote's page for a signed-in contact and its QR, not a bearer link; a forwarded PDF opens nothing,
    and a customer with no invitation reaches the quote only by the mailed link; quotes issued before P13 carry neither;
  - a link is made for each mail attempt; a retried delivery's earlier link stays valid until the validity ends or the quote is
    revised or withdrawn (it was never delivered);
  - a link ends with the quote's validity, so after an acceptance its receipt is readable by the link only until then; a contact
    signs in afterwards;
  - above the threshold the customer's own verified account (a person customer, the self relationship) accepts signed in, as an
    invited contact does; design §10 names only the invited contact;
  - a contact invited to Sales sees every issued quote of its customer at that organization (no per-contact narrowing, as Support's
    customer administrator has); `invite#Contact` takes no administrator flag for `sales`;
  - nothing tells the quote's owner of a customer's online acceptance or decline (the order is placed and listed; the response
    shows on OrderDetail);
  - the Account hub's card shows only for an account acting for a customer of the organization (Support's always shows);
  - Invite to Sales on Customer360's header says why it is not offered to an inviter (no published PASS Sales site, not a customer
    account, no address); the demo has no Sales site, so every inviter sees the reason;
  - SalesDefaults' dialog did not show P10's PO requirement and reminder days (their fields were in no row of its layout); fixed;
  - a customer's response runs below the portal's checks with artifact authorization disabled, as Support's; place#Order and P11's
    net-terms approval run with no user (the response's `recordedByUserId` empty), and the storeless confirmation still follows;
  - `docs/security/Attack-Surface.md` (mr-moqui) does not name PASS Sales; P13 had no mr-moqui worktree (the text below).
- For the lead:
  - budget share: mr-mantle about 3.1 s (SalesPortal); mr-boss server about 0.1 s (SalesAccess' P13 feature); mr-pass server about
    0.1 s (SalesPortalAccess; its fixture's quote in the spec's setup); client none;
  - merge hot spots: mr-mantle `service/mantle/party/ExternalAccess.js` (the SalesOrder kind, `requirePermissions`,
    `requireIssuer`, `create`, `check`, `appKinds`, exports), `ExternalAccessServices.xml`, `service/mantle/order/SalesQuoteIssues.js`
    (textMap's parameter, the P13 links block after it, `offerOf` taken out of `printOf`, the own send and the build, `respondQuote`
    split into `respondTo`, withdraw and revise, the exports; Sales P12's template work may touch `printOf` and clone),
    `entity/SalesQuoteIssueEntities.xml` (extend-entity at the end), `service/mantle/sales/SalesAccounts.js` (a P13 block before the
    operations map) and `AccountServices.xml` (two services at the end), `SalesSettings.js` (the readiness list's end),
    `service/mantle/public/PublicApps.js`, `service/mantle/forum/ForumSchema.js` and `script/PassRoutes.js` (after getShopFeed),
    `script/PassApi.js` and `PassAuthority.js` (the lists' ends), `service/mantle/smithy/SmithyCore.js`; mr-pass
    `service/pass/Schema.js`, `Routes.js`, `Transport.js`, `Apps.js`, `screen/Pass.xml`, `screen/Shared/Header.html.fancy`,
    `screen/Shared/Portal.js`, `screen/Account/Settings.xml`, `test/MoquiConf.xml`, `test/Billing/Portals.spec.js`,
    `test/Smithy/Smithy.spec.js`, `test/acceptance/client/suite.js`, `README.md`, `docs/Deployment.md`; mr-boss
    `screen/Shared/Customer360.xml`, `template/SalesCustomer360.xml`, `screen/Sales/Accounts/ContactDetail.xml`,
    `screen/Sales/Settings/SalesDefaults.xml`, `test/Sales/SalesAccess.spec.js` (a feature at the end), `plan/usl-inventory.md`
    (a table after P11's, where P12 appends too), `plan/design-sales.md` (§10), `plan/design-crosscut.md`. Marketing P6's files are
    not touched;
  - Attack-Surface (mr-moqui `docs/security/Attack-Surface.md`), a paragraph after Sales' orders: "PASS Sales' customer quotes
    (`mantle.order.SalesPortalServices`, all `allow-remote="false"`, `authenticate="anonymous-all"`, reached only as the PASS
    operations `findSalesQuotes`, `getSalesQuote`, `getSalesQuoteDocument`, `respondSalesQuote` and `getSalesQuoteResponse` of the
    authority's allowlist): each finds the organization from the site's `sales` mount and the customer from the bearer link's
    capability (the `SalesOrder` kind's QuoteView or QuoteRespond scope, bound to one issue's commercial revision, ending with the
    quote's validity, made only by `send#Quote` for each recipient's mail under `SALES_QUOTE_SEND`, revoked by `revise#Quote` and
    `withdraw#Quote`; `create#AccessCapability` refuses those scopes) or from a signed-in account's contact grant of the `sales` app
    or its own verified customer party, never from the request; a link reaches its one issue while it stands and its receipt after
    a response, never a list; a wrong, expired, revoked, crossed (an order ID beside another quote's token) or ended link answers the
    same NotFound; every token lookup and every response counts against the requester's limit; `respondSalesQuote` is the only
    bearer write (`TOKEN_WRITES`), runs respond#Quote's lifecycle under the order's lock (one response an issue, `place#Order` once)
    with the revision seen and the terms acknowledged, and its operation key binds the capability or the customer, the
    organization, the issue and the payload; above the seller's acceptance threshold a link alone cannot accept; answers are
    allow-listed projections and the issued PDF is streamed by the facade, its location never answered. Invite to Sales
    (`mantle.sales.AccountServices.invite#SalesContact`) needs `SALES_CUSTOMER_INVITE`, a customer account of the caller's sales
    scope, one of the contact's own addresses and an organization of the scope with a published Sales site.";
  - the user's call: whether above the threshold the customer's own verified account (a person customer) accepts as an invited
    contact does (built so), and whether a Sales contact should see only quotes addressed to them unless made a customer
    administrator (built: every issued quote of the customer).

**Review 2026-11-14 (P13).** A fresh review of `sal/p13` (mr-mantle 2c581fcb, mr-pass e582ca9, mr-boss 70f4c25d; master had nothing
newer in any of the three, so no merge; Sales P12 is not on master yet, so its `printOf` and SalesQuotes.js work meets this at the
merge) against P13, §2, §4, design §10 and §12.1, X6, F17, F18, F36 and F48, as a public, unauthenticated surface.
- Checked and sound:
  - The five services are `allow-remote="false"`, `authenticate="anonymous-all"`, reached only as the PASS operations of the
    authority's allowlist (ForumSchema.js and PassRoutes.js equal mr-pass's Schema.js and Routes.js, SalesPortalAccess checks it); the
    authority sets `siteId` from the request's site and refuses a different one in the input, and each operation takes the
    organization from that site's `sales` mount (published, an internal organization). The customer is the capability's or the
    signed-in account's (a contact grant of the `sales` app, or its own verified party), never the request's; an order ID beside a
    token must be the token's; a token of another organization, scope or record kind, a forged, expired or revoked one, an ended,
    superseded or expired issue and another customer's quote all answer the same NotFound (a token's NotFound comes from one check;
    "sign in" is answered only when no token is given, before any lookup).
  - Tokens: 48 random characters, only the digest kept; every lookup counts against the requester's limit (100 in ten minutes) and
    every response post against its own (30). QuoteView and QuoteRespond are made only by `send#Quote` (`quoteLink`, through
    ExternalAccess `create`, which has no permission check of its own and is called only from the issue's send and the ledger's build):
    `create#AccessCapability` asks SALES_QUOTE_SEND for them and then refuses them for want of a bound revision (SCOPE_INVALID; a check
    added below), a bound scope is never mixed with an order's, a token's thruDate is the issue's validity, `revise#Quote` and
    `withdraw#Quote` revoke every quote link of the order, and a native change leaves the link bound to a superseded issue. A quote
    link never opens Shop's OrderView page or the reverse (the scope is checked).
  - The retried delivery's earlier link (the Built note's finding): acceptable. Its token existed only in that attempt's message; an
    uncertain attempt may have reached the customer, so leaving it valid is right, and it is bound to the same issue and revision, ends
    with the validity and is revoked by revise and withdraw like the others.
  - respondSalesQuote is the only bearer write, in the three `TOKEN_WRITES` lists (equal); the authority's exemption from the session
    check is for a registered deployment only, and the local page posts with the session token (the transition's CSRF check). It goes
    through `respondTo`, the staff path's lifecycle: the operation key read under the order's lock, one response an issue (a repeat of
    an acceptance answers the first, any other second response RESPONSE_RECORDED), `place#Order` once, the response's source SqsPortal
    with the capability or the signed-in party, staff-only evidence and contact fields ignored, the date now. The operation key binds
    the capability or party, the organization, the issue and the payload (another link's same key is a conflict).
  - Projections: no cost, margin, price trace, internal note, other contact, approval data or PDF location (the facade streams the PDF;
    the authority strips `location`); terms as plain text; every page value HTML-escaped (`.html.fancy`).
  - Pages: no-store (the default route policy), `Referrer-Policy: same-origin` and a CSP whose `img-src` is the site and its brand
    logo's origin, so the token in a link page's URL never travels to a third party; the sign-in link from a link page returns to the
    quote by its order ID, never its token; reads are GETs a mail scanner may fetch without effect.
  - Invite to Sales: SALES_CUSTOMER_INVITE (in SalesAccess and again in `invite#Contact` with the organization), a customer account of
    the caller's sales scope (another answers as missing), a current contact of it or the person account itself, one of the contact's
    own addresses, an organization of the scope with a published Sales site. The BOSS template shows the link once.
  - The SalesDefaults threshold keeps the other currencies' thresholds; P10's two fields now show (the Built note's fix).
- Fixed (mr-mantle 6e7864fb):
  - R1 (medium, confidentiality): a signed-in contact reached the latest issue with no check that the order was still at its revision,
    so after `revise#Quote` and a new `propose#Quote` not yet sent, `getSalesQuote` showed the new revision's lines and totals (the
    seller's unissued, possibly unapproved work) and My quotes listed a revised quote with its draft total. An unanswered quote whose
    revision moved past its latest issue, or that is back in a revision's draft, is now neither shown nor listed. SalesPortal checks it
    (both checks fail on the unfixed code).
  - R2 (low): respond#CustomerQuote checked the revision, the terms and the threshold against the order read before its lock; it now
    locks first and checks the locked order and the response read under the lock (design §10: eligibility revalidated under lock). A
    request without a token, which ExternalAccess admitted as the customer's contact or own party, is now signed in for it even where
    the self party lacks the Customer role (it was taken as a bearer, its identity `party:null`).
  - R3 (low): an acceptance needed no acceptor: the page asks the name, the service did not (a remote frontend's or a scripted post
    accepted nameless). The name is required now (ACCEPTOR_REQUIRED); SalesPortal checks it (the unfixed code placed the order).
  - R4 (low, spec coverage): nothing checked that `create#AccessCapability` refuses the quote scopes; SalesPortal checks it for a quote
    sender (SCOPE_INVALID).
- Findings, numbered by the lead F235 to F239 in order:
  - a quote link's token is in the sent mail's stored body (the rep's own send saves a draft; the ledger's `send#EmailTemplate` keeps
    the message), so a reader of the organization's sent mail can open the link and, below the threshold, accept or decline as the
    customer (the response records the capability); Billing's and Support's links are kept the same way;
  - once answered, a link and a contact read the quote's lines and totals from the order as it is now (`offerOf(order)`), so a later
    commercial change of the placed order (P14) would show as the quote; the PDF stays the issued offer. For P14 or P17 to read the
    issue's own lines or show the order instead;
  - a refusal from below the checks that is not a listed code (`place#Order`, P11's net-terms approval) reaches the page with its
    text when the authority's internal-text filter passes it;
  - `invite#Contact` for `sales` (not remote) takes any address and any Customer of the organization; only invite#SalesContact narrows
    it to an account of the scope and the contact's own address. Only BOSS's template calls it for `sales` today;
  - the Built note's findings stand; the two user's calls are recorded in §4 (Nov 14) and design §10.
- Tests run (release binary, `--nobuild`, this worktree's runtime): mr-mantle SalesPortal 4 of 4 (feature time 3.7 s; 28 s with
  setup), and with each fix taken out its check fails (R1's two, R3's); mr-pass SalesPortalAccess 2 of 2 (0.1 s). Prettier (mr-moqui's
  config) on the two changed files. Not run: test-apps, test-framework, the acceptance suite; no screen changed.
- For the lead:
  - budget share: mr-mantle about 3.7 s (SalesPortal, about 0.6 s more for the review's checks); mr-pass and mr-boss as the Built note;
  - merge hot spots beside the Built note's: mr-mantle `service/mantle/order/SalesPortal.js` and `test/order/SalesPortal.spec.js`
    (only this branch); with Sales P12, SalesQuoteIssues.js `printOf` (P13 split `offerOf` out of it and adds the page link and QR)
    and the exports at its end;
  - Attack-Surface (mr-moqui `docs/security/Attack-Surface.md`): the worker's paragraph is right but for three points (a contact's
    reach, the checks under the lock and the acceptor, and the stored mail); corrected: "PASS Sales' customer quotes
    (`mantle.order.SalesPortalServices`, all `allow-remote="false"`, `authenticate="anonymous-all"`, reached only as the PASS
    operations `findSalesQuotes`, `getSalesQuote`, `getSalesQuoteDocument`, `respondSalesQuote` and `getSalesQuoteResponse` of the
    authority's allowlist): each finds the organization from the site's `sales` mount and the customer from the bearer link's
    capability (the `SalesOrder` kind's QuoteView and QuoteRespond scopes, bound to one issue's commercial revision, ending with the
    quote's validity, made only by `send#Quote` for each recipient's mail, revoked by `revise#Quote` and `withdraw#Quote`;
    `create#AccessCapability` refuses those scopes) or from a signed-in account's contact grant of the `sales` app or its own verified
    customer party, never from the request; a link reaches its one issue while it stands and its receipt after a response, never a
    list; a signed-in account sees a quote of a customer it acts for only at its issued revision or once answered; a wrong, expired,
    revoked, crossed or ended link answers the same NotFound; every token lookup and every response counts against the requester's
    limit; `respondSalesQuote` is the only bearer write (`TOKEN_WRITES`), runs respond#Quote's lifecycle under the order's lock (the
    revision seen, the terms acknowledged, the acceptor named and the threshold checked there; one response an issue, `place#Order`
    once), and its operation key binds the capability or the customer, the organization, the issue and the payload; above the
    seller's acceptance threshold a link alone cannot accept; answers are allow-listed projections and the issued PDF is streamed by
    the facade, its location never answered; link pages are no-store with a same-origin referrer policy. A link's token is in the
    sent mail the organization keeps. Invite to Sales (`mantle.sales.AccountServices.invite#SalesContact`) needs
    `SALES_CUSTOMER_INVITE`, a customer account of the caller's sales scope, one of the contact's own addresses and an organization
    of the scope with a published Sales site.";
  - the user's calls of Nov 14 are recorded (§4, design §10); none open from this review, unless the lead wants the stored-mail
    finding decided (keep, or keep links out of the stored body).

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
  Billing pay link for a holder of Accounting's issuer grant). The topic's route for a Sales approver
  (`get#RecordLink`'s branch, F26, F58), in place of P9's decision from the list; OrderChangeDetail's appRoot gate
  (:136, :149) and CustomerService.js:331-332 admit Sales' context. Customer Service's context and `CustomerServiceOrderChanges`' checks stay
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

**Built Nov 14 (P14).** mr-mantle and mr-boss on branch `sal/p14` (hashes in the worker's reply), with master (Sales P12, P13) merged
in; mr-moqui and mr-pass unchanged, no Rust built.
- Checked first (the code over the plan): P9's, P11's and P12's Built and Review notes, §4 (F43's row, the Nov 13 administrator row),
  F13, F26, F34, F43, F46, F58, F162, F202; Customer Service's OrderChangeServices.xml and OrderChanges.js, its spec and
  Shared/OrderChangeDetail; PurchaseOrders.js holdAllowed (unchanged); hold#Order, release#OrderHold, update#OrderItem and its
  reservation SECA (OrderItemUpdateCheckReserve), handle#OrderMajorChange, release#ShipmentDraftInvoice, evaluate#OrderCredit,
  get#InvoiceFinanceDetail and send#Invoice; Shared/ShipmentDetail and InvoiceDetail's contexts. The code over the plan:
  - "Warehouse's release and rebuild of open reservations" is update#OrderItem's own reservation rule (checkReserve with
    resetReservations), so apply calls no reservation service itself; "Accounting's draft-release contract" is
    `release#ShipmentDraftInvoice`, which needs RECEIVABLE_EDIT: a packed price line is applied only by a change operator who also
    holds it, else it waits (BILLING_CONFLICT naming the receivables editor), as design §6 says ("application waits for the owning
    operator");
  - a new line is priced by `get#SellerProductPrice` (the seller's authority, as a quote line's), not `get#OrderProductPrice`, which
    answers a caller without PRICE_VIEW no scoped price (the change operator holds none), the price shown at preview kept at apply;
  - an address, ship method or carrier change names its part: Request gains `orderPartSeqId` (audit-logged, in the proposal's
    revision; entity/SalesOrderChangeEntities.xml), the order's only part when empty;
  - "policy" at apply is the approval current at the proposal's and the order's revisions, unexpired, and the fiscal period open
    (OrderChanges.js' head, shared with Customer Service's kinds); the credit check runs again on a higher total
    (`evaluate#OrderCredit` with placeHold, which may leave a Credit hold that keeps the order held);
  - the plan's "Mantle `test/order/OrderChanges` gains the owner kinds" is a new spec, `test/order/SalesOrderChanges`: with them
    OrderChanges ran 19 s, over the 15-second limit;
  - a change operator needs to see the orders they change: SalesAccess.js `orderOf` and find#SalesOrders give `SALES_ORDER_CHANGE`
    read-only reach to the organization's Placed, Processing, Approved and held orders (as P11's approver reach);
  - a Sales reader who sees an order reads its changes and their prices (the order's owner, OrderDetail's Changes); `SALES_TEAM_VIEW`
    joins find#OrderChanges' read permissions for the manager's Changes list.
- Mantle:
  - `service/mantle/order/SalesOrderChanges.js` (new): `canFile`, `seesOrder`, `mayApply`, `validateSave` (PRICE_REQUIRED,
    QUANTITY_INVALID, PRODUCT_REQUIRED, DATE_REQUIRED, PART_REQUIRED, ADDRESS_REQUIRED, ADDRESS_INVALID, METHOD_INVALID,
    CARRIER_INVALID), `checkLines` (ACTIVE_PICK, ALREADY_SHIPPED, BILLING_CONFLICT, QUANTITY_INVALID, PRODUCT_NOT_USABLE,
    PRICE_UNAVAILABLE, LINE_UNAVAILABLE; its own preview version over the lines and the part's open shipments), `effects` (total
    before and after, tax estimate, freight, credit), `apply` (FORBIDDEN without SALES_ORDER_CHANGE, RECORD_UNAVAILABLE outside the
    sales scope, STOCK_CHANGED, the writes listed in design §6 "As built (P14)"), and the handoffs `getShipment` and `checkInvoice`.
  - Owner contract with Customer Service: `OrderChanges.js` (Sales' filers in save, a new line's RequestItem, readPermissions with
    SALES_TEAM_VIEW, amountRead and requireRead for a Sales reader, checkLines and applyChange delegating the commercial kinds after
    the shared head checks, apply's permission split keeping FORBIDDEN for the order desk, actionsOf.apply, get's part texts,
    preview's effects and version, find's `orderChangeKindEnumId` and `kindGroup`, storeApplied's given print lines, `salesTools`);
    `OrderChangeServices.xml` (descriptions; save's `orderPartSeqId`, find's two filters). Customer Service's specs unchanged.
  - `SalesAccess.js` (P14: `changeStatuses`, orderOf's change reach, export), `SalesOrders.js` (findOrders' change reach),
    `SalesOrderServices.xml` (a P14 block at the end: `get#SalesShipment`, `check#SalesInvoice`), `entity/SalesOrderChangeEntities.xml`.
- BOSS:
  - Screens: `Sales/Orders/OrderChanges.xml` (new, tab 2 "Changes": saved lists, ChangeList, New change), `Sales/Orders.xml`
    (OrderChanges, OrderChangeDetail, ShipmentDetail, InvoiceDetail); `Shared/OrderChangeDetail.xml` (owner contract: each
    transition and the actions check by root, Sales' check#Record for appRoot Sales; saveChange passes the part kinds' fields and a
    new line; the Sales form included; Customer Service's form, Edit and owner reminder hidden in Sales; an Effects box);
    `template/SalesOrderChanges.xml` (new: salesChangeChoices, SalesNewOrderChange); `Shared/ShipmentDetail.xml` and
    `Shared/InvoiceDetail.xml` (owner contracts: a Sales branch each), `template/SalesHandoffs.xml` (new: SalesShipment, SalesInvoice,
    salesInvoiceSend); `template/SalesOrderDetail.xml` (a P14 part of P11's context: Changes box, More › New change, the shipment and
    invoice rows' links); `template/SalesParts.xml` and `ContextServices.xml` get#Choices (`orderId`).
  - `Sales.js` (a P14 block after P12's): linkPaths, `areas.changes` and its read, recordKinds `orderChange` (now
    Orders/OrderChangeDetail, for an approver, a change operator or a reader of the order), `shipment`, `invoice`; choices
    `changeOrders`, `orderLines`, `customerAddresses`, `carriers`.
  - `PaletteServices.xml` get#RecordLink: an order change asks Sales first, then Customer Service (F58); `BossSetupData.xml` the
    topic's comment.
  - `data/BossSetupSalesData.xml` (a P14 block at the end): SALES_ORDER_CHANGE and ORDER_CHANGE_HOLD_RELEASE for BOSS_SALES_CHANGE in
    its bundle (F43); BOSS_SAL_CHANGES (deny to BOSS_SALES, ALWAYS for the change operator, approver and manager).
- Specs:
  - Mantle `test/order/SalesOrderChanges` (new, 2 features, 2.2 s): a price change Customer Service filed, decided by the sales
    approver, refused the order desk (FORBIDDEN) and another organization's operator (RECORD_UNAVAILABLE), applied once by the change
    operator under its key (retry answers alreadyApplied, price 4, PDF stored, revision moved, no hold left); an increase below the
    line refused; a quantity increase and a new line filed by the change operator applied with a Credit hold left (5 reserved, the
    line's price kept, the new line at the seller's 7, stillHeld); ACTIVE_PICK, ALREADY_SHIPPED (with BILLING_CONFLICT in the
    preview), STALE_ORDER and APPROVAL_EXPIRED refused with the order unchanged; get#SalesShipment for who sees the order and not
    another organization's; check#SalesInvoice refused without a receivable read.
  - mr-boss `test/Sales/SalesOrderChanges` (new, 1 feature, 0.35 s warm, 2.1 s cold): OrderChangeDetail's one qvt render in Sales' context as the
    change operator (Approved, Apply, Effects, the order total, Sales' wording without Customer Service's reminder); apply with the
    same parameters reaching STOCK_CHANGED for the change operator, refused the order desk and PERMISSION_DENIED for a rep; the
    approver's record link opens Sales' OrderChangeDetail. `SalesApprovals` (F58's link now Sales' OrderChangeDetail), `SalesAccess`
    (the change operator's capabilities with orderChange).
  - Acceptance, written and not run: `test/acceptance/Sales/SalesChangeScenarios` (3 features: a price change filed by the order desk,
    decided by sales.approver and applied by sales.change through OrderChangeDetail's transitions, the total down and the PDF stored;
    a ship-date change against a picked line waiting with ACTIVE_PICK; a partly shipped and invoiced order's shipped and billed
    quantities, its shipment opening under Sales).
- Tests run (release binary, `--nobuild`, this worktree's runtime): mr-mantle OrderChanges, SalesOrderChanges,
  SalesOrderApproval, SalesWorkspace, SupportPortal, SalesQuoteTemplates, PurchaseHoldPermission and SalesPortal 33 of 33 (8 specs,
  67 s) after the master merge (29 of 29 before it, without SalesPortal); Customer Service's OrderChanges unchanged and passing.
  mr-boss SalesOrderChanges, SalesApprovals, SalesOrders, SalesAccess, SalesHome, SalesQuotes, SalesQuoteTemplates, SalesOpportunities,
  SalesAccounts, CustomerServiceOrderChanges, CustomerServiceAccess, CustomerServiceOrders, AccountingReceivables, ProjectsAccess,
  Notifications, InsightsHome and PurchasingOrders 102 of 102 (17 specs, 83 s) after the merge (before it SalesAccess' capability row
  failed until the change operator's orderChange was added). `moqui lint --screens` (release): 141 flagged sites, as before, none in
  a new or changed screen. Prettier clean on the new and changed JavaScript. Not run: the client walk (no screen it walks changed),
  ./moq test-apps, test-framework, the acceptance suite.
- Inventories: usl-inventory's "Added in the Sales build: commercial changes and the fulfillment and billing handoffs" table;
  ss-inventory unchanged (no baseline form maps to OrderChanges, and its ShipmentDetail rows name no Sales path).
- Design edits: design-sales §6 "As built (impl-sales P14)"; design-customer-service §4 (the commercial kinds applied in the same
  services; OrderChangeApproval's link asked of Sales first).
- Findings, numbered by the lead F240 to F249 in order:
  - editing a filed commercial proposal is not offered in Sales: save#OrderChange's edit (`actions.save`) asks ORDER_CHANGE_REQUEST
    and Customer Service's Edit form has its own kinds' fields; a Sales filer withdraws and files again;
  - BILLING_CONFLICT for a finalized invoice is checked at apply but the spec meets it only in the preview: a shipped and invoiced
    line answers ALREADY_SHIPPED first, and a line billed but not shipped needs an invoice made outside the order's flow;
  - a packed price line's draft invoice is released only by an applier who also holds RECEIVABLE_EDIT; otherwise the change waits and
    nothing tells Accounting (no handoff notice);
  - the change operator's read-only reach shows the organization's Placed, Processing, Approved and held orders on Orders too, and a
    completed order (all shipped) leaves their sight, so a change operator cannot open the shipment of a completed order;
  - the preview's tax effect is an estimate at the order's current tax rate; a store order's shipping and promotions are recalculated
    by handle#OrderMajorChange while the order is held;
  - a price change marks the line's manual price with the applier as `priceOverrideUserId`, the change and its reason as the reason;
  - `SALES_TEAM_VIEW` among find#OrderChanges' read permissions lets a Sales manager or reader also list the organization's cancel and
    substitute proposals;
  - SalesAccess has no P14 feature: the holder and non-holder on apply are in mr-boss SalesOrderChanges and another organization's
    refusal in Mantle SalesOrderChanges (one setup each);
  - Sales' ShipmentDetail and InvoiceDetail have no regression render (their reads are Mantle-checked; the acceptance test opens the
    shipment);
  - `docs/security/Attack-Surface.md` (mr-moqui) does not name the commercial apply; P14 had no mr-moqui worktree.
- For the lead:
  - budget share: mr-mantle about 2.2 s (SalesOrderChanges, 1.0 and 1.2 s); mr-boss server about 0.4 s warm, 2.1 s cold
    (SalesOrderChanges' one feature); client none;
  - merge hot spots (P15 beside it): mr-mantle `service/mantle/order/OrderChanges.js`, `OrderChangeServices.xml`,
    `service/mantle/sales/SalesAccess.js` (orderOf's unassigned branch, changeStatuses, exports after orderApprover),
    `SalesOrders.js` findOrders, `SalesOrderServices.xml` (a P14 block at the end); mr-boss `service/ironstone/sales/Sales.js` (a P14
    block after P12's), `data/BossSetupSalesData.xml` (a P14 block at the end), `screen/Shared/OrderChangeDetail.xml`,
    `screen/Shared/ShipmentDetail.xml`, `screen/Shared/InvoiceDetail.xml`, `template/SalesOrderDetail.xml` (P11's context: actions,
    More, Fulfillment and Invoices boxes, a Changes box), `screen/Sales/Orders.xml`, `template/SalesParts.xml`,
    `service/ironstone/sales/ContextServices.xml` (get#Choices), `service/ironstone/commons/PaletteServices.xml`,
    `data/BossSetupData.xml` (the OrderChangeApproval comment), `test/Sales/SalesAccess.spec.js` (the change operator's row),
    `test/Sales/SalesApprovals.spec.js`, `plan/usl-inventory.md`, `plan/design-sales.md` (§6), `plan/design-customer-service.md` (§4).
    Sales.xml and Shared/OrderDetail.xml are not touched;
  - Attack-Surface (mr-moqui), a paragraph after Sales' quote templates: "Sales' commercial order changes (in
    `mantle.order.OrderChangeServices`, all `allow-remote="false"`; SalesOrderChanges.js): a price, quantity increase or new line,
    ship date, address, ship method or carrier change of a sales order is filed by Customer Service's `ORDER_CHANGE_REQUEST`, Sales'
    `SALES_ORDER_CHANGE` or the order's editor in Sales, decided under `SALES_APPROVE` (not by its filer unless the organization's
    policy allows), and applied only under `SALES_ORDER_CHANGE` in the seller's sales scope, under the order's lock, at the
    proposal's and the order's revisions with a current approval; an active pick, a shipped quantity or a finalized invoice refuses
    it by name, a packed line's draft invoice is released only through Accounting's `release#ShipmentDraftInvoice` (RECEIVABLE_EDIT),
    the higher total meets Accounting's credit check, and only its own Change hold is released; another organization's change
    answers as missing. A change operator reads the organization's placed, approved and held orders and never edits them; Sales'
    shipment and invoice reads answer only for an order the user sees, an invoice only for a receivable reader.";
  - nothing needs the user's call; the first and third findings may be worth the user's look.

**Review 2026-11-14 (P14).** A fresh review of `sal/p14` (mr-mantle a717108c, mr-boss 37ce50c1; master had nothing newer, so no
merge) against P14, §2, §4, design §6 (OrderChanges, OrderChangeDetail, ShipmentDetail, InvoiceDetail) and design-customer-service §4.
- Checked and sound:
  - the owner contract: OrderChanges.js keeps Customer Service's filing, decision and apply paths for cancel and substitute (apply asks
    ORDER_CHANGE_APPLY for them, PERMISSION_DENIED otherwise); a commercial kind is applied only under SALES_ORDER_CHANGE (the order desk
    FORBIDDEN, as before) and SalesOrderChanges.js `requireApply` then asks the seller's sales scope (RECORD_UNAVAILABLE); changeOf's
    facility scope answers another organization's change as missing first; Customer Service's OrderChanges and SupportPortal specs pass
    unchanged;
  - apply under the order's lock: the proposal and the order locked (changeOf lock, lockOrder), the approval current at both revisions,
    its expiry and the fiscal period checked in OrderChanges.js' shared head, then every conflict refused by name in checkLines strict
    and STOCK_CHANGED against the preview's version (which carries a new line's price); the writes in design §6's order, each through
    lib.call (one transaction: an error throws and apply#OrderChange, use-or-begin, rolls back; evaluate#OrderCredit at preview places
    no hold and writes nothing); only its own Change hold released (a Credit hold stays, stillHeld);
  - a new line at `get#SellerProductPrice` for the order's customer (no cost, no other party's price), check#ProductUsable first;
  - finding 3 judged: apply does not borrow Accounting's authority: `release#ShipmentDraftInvoice` runs under the applier's own
    RECEIVABLE_EDIT (Accounting checks it in the shipping organization); without it the change waits with BILLING_CONFLICT naming the
    receivables editor, which is design §6's "application waits for the owning operator". Routing it to Accounting is a notice, not a
    correctness gap (the finding stands as written);
  - the change operator's widened read (SalesAccess.js changeStatuses, find#SalesOrders' changeReach) is read only (approverOnly, no
    canEdit), as design §1.1 BOSS_SALES_CHANGE needs to propose and apply; orderOf's other branches unchanged;
  - OrderChangeApproval's link (F58): Sales' recordLink answers null for a cancel or substitute and for a user without Sales, so the
    order desk still opens Customer Service's OrderChangeDetail; a Sales approver gets Sales' (SalesOrderChanges' link check);
  - OrderChangeDetail's Sales branch: each transition Sales' check#Record first, Customer Service's form, Edit and reminder hidden;
    ShipmentDetail (get#SalesShipment: only the orders the user sees, other orders' lines left out, missing and unseen alike) and
    InvoiceDetail (check#SalesInvoice: a receivable reader and an order the user sees, then Accounting's own get#InvoiceFinanceDetail;
    Send with pay link on Accounting's canSend, RECEIVABLE_EDIT; the transition checks the record and send#Invoice checks again).
- Fixed:
  - R1 (medium, confidentiality): preview#OrderChange's credit effect evaluated the customer's credit for every previewer and said
    "within / near / over its credit limit now" to a change operator, a Sales rep who sees the order and Customer Service's requester,
    none of whom holds CUSTOMER_CREDIT_VIEW (Accounting's sensitive grant). The standing is now evaluated and shown only for
    CUSTOMER_CREDIT_VIEW, ACCOUNTING_VIEW or an approver (SALES_APPROVE, SALES_ORDER_APPROVE, ORDER_APPROVE, who see an order's credit
    warning when approving it, P11); others read that the check runs again at apply. Mantle SalesOrderChanges checks both (the change
    operator's preview has no standing, the approver's has).
  - R2 (low, scope; finding 7): `SALES_TEAM_VIEW` among find#OrderChanges' read permissions let a Sales manager or reader list the
    organization's cancel and substitute proposals (Customer Service's service work, case links and consent references) and get any of
    them. It is now out of readPermissions: alone it lists the organization's commercial kinds only (Sales' Changes, as design §6
    ChangeFind "commercial proposals"), and an order's own changes of every kind are read through `seesOrder` (OrderDetail's Changes,
    the order's owner). Descriptions and design §6's As built updated.
  - R3 (low): Sales.js recordKinds.shipment took the order's part "01" for the organization; now the order's first part.
  - R4 (tests): Mantle SalesOrderChanges gains a feature: a part-packed price line's draft invoice waits (BILLING_CONFLICT) for the
    change operator and is released and repriced by one who also holds RECEIVABLE_EDIT (invoice cancelled, billing gone); a failure after
    the first writes (an applier without ORDER_CHANGE_HOLD_RELEASE: hold placed, price written, release refused) leaves the price, the
    holds, the request, the PDF, the revision and the status as they were, and the change operator then applies it. mr-boss
    SalesOrderChanges gains ShipmentDetail's and InvoiceDetail's one qvt render each under Sales (finding 9: their template has its own
    logic; a spec-local Sales manager with RECEIVABLE_VIEW/EDIT sees Send with pay link), a rep refused check#SalesInvoice, and the order
    desk's apply now asserted FORBIDDEN alone (it was "FORBIDDEN or RECORD_UNAVAILABLE").
- Findings, numbered by the lead F250 to F252 in order:
  - a fully packed sales order goes Completed before it ships, so a commercial change of it is refused by hold#Order's ORDER_HOLD_STATE
    (not a named change conflict, and the preview does not show it), and it leaves the change operator's sight; met while writing R4;
  - a new line's price is the seller's price at apply; the approval binds the proposal's revision, not that price, so a price list
    change between the decision and apply is applied at the new price under the old approval (STOCK_CHANGED only against the
    applier's own preview). Storing the previewed price on the RequestItem (in the revision) would bind it;
  - save#OrderChange admits a Sales filer editing another person's commercial proposal on an order they may file on (as Customer
    Service's staff may); Sales offers no Edit, so only a direct call reaches it.
- Tests run (release binary, `--nobuild`, this worktree's runtime): mr-mantle SalesOrderChanges (3 features: 1.7, 1.1, 0.8 s),
  OrderChanges, SalesOrderApproval, SalesWorkspace, SupportPortal, PurchaseHoldPermission 26 of 26 (6 specs, 47 s); mr-boss
  SalesOrderChanges (0.9 and 0.2 s), SalesApprovals, SalesOrders, SalesAccess, CustomerServiceOrderChanges, CustomerServiceOrders,
  AccountingReceivables 38 of 38 (7 specs, 37 s). Prettier (the repository's config) on the changed JavaScript. No
  screen changed, so no screen lint. Not run: test-apps, test-framework, the acceptance suite.
- For the lead:
  - budget share: mr-mantle SalesOrderChanges about 3.6 s (was 2.2 s; the review's feature 0.8 s); mr-boss SalesOrderChanges about
    1.1 s warm (the review's renders 0.2 s); client none;
  - merge hot spots (P15, P17 beside it): as the Built note's, plus mr-mantle `OrderChanges.js` readPermissions and findChanges' head
    (R2), `SalesOrderChanges.js` effects (R1), `OrderChangeServices.xml` get's and find's descriptions;
  - Attack-Surface (mr-moqui), a paragraph after Sales' quote templates: "Sales' commercial order changes
    (`mantle.order.OrderChangeServices`, all `allow-remote="false"`, over OrderChanges.js and SalesOrderChanges.js): a price, quantity
    increase or new line, ship date, address, ship method or carrier change of a sales order is filed under Customer Service's
    `ORDER_CHANGE_REQUEST`, Sales' `SALES_ORDER_CHANGE` or as the order's editor in Sales, decided under `SALES_APPROVE` (not by its
    filer unless the organization's policy allows), and applied only under `SALES_ORDER_CHANGE` in the seller's sales scope (Customer
    Service's order desk is refused `FORBIDDEN`), under the order's lock, at the proposal's and the order's revisions with a current,
    unexpired approval and an open fiscal period, in one transaction; an active pick, a shipped quantity or a finalized invoice refuses
    it by name, a packed line's draft invoice is released only through Accounting's `release#ShipmentDraftInvoice` under the
    applier's own `RECEIVABLE_EDIT`, a new line is priced by `get#SellerProductPrice`, a higher total meets Accounting's credit check,
    and only its own Change hold is released; another organization's change answers as missing. The preview shows the customer's
    credit standing only to `CUSTOMER_CREDIT_VIEW`, `ACCOUNTING_VIEW` or an approver. A change operator reads the organization's
    placed, processing, approved and held orders and never edits them; `SALES_TEAM_VIEW` alone lists only the commercial kinds;
    Sales' shipment and invoice reads (`get#SalesShipment`, `check#SalesInvoice`) answer only for an order the user sees in Sales, an
    invoice only for a receivable reader (`ACCOUNTING_VIEW` or `RECEIVABLE_VIEW`), and a missing or unseen record alike.";
  - the user's call: none needed; the first provisional finding (a fully packed order's change refused by hold state) and the
    worker's finding 3 (no notice to Accounting when a change waits on a draft invoice) may be worth the user's look.

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

**Built Nov 14 (P15).** mr-mantle and mr-boss on branch `sal/p15` (hashes in the worker's reply), with master (Sales P12, P13) merged in
before the last runs; mr-moqui and mr-pass unchanged, no Rust built.
- Checked first (the code over the plan): P7's Built and Review notes (`get#SellerProductPrice` never read an agreement row), P12's and
  P13's notes, §4 (Q5: a Sales AgreementDetail of its own, sharing records and status flow with Purchasing's, not forms), F19, F20,
  F67, F69; Purchasing's agreements (PurchaseAgreementEntities.xml, PurchaseAgreementServices.xml, PurchaseAgreements.js, its expiry
  job); PriceResolver.js (`typed`, `readable`, `listEligible`), PricePolicy.js and PriceLists.js' agreement checks; Customer Service's
  `Sla.js` agreementsOf (an AgrService agreement with no status counts as active); Products' SharedContext.js, Pricing.js and the
  shared price screens; get#RecordLinkInfo's Agreement branch. The code over the plan:
  - Products' own spec ProductPriceLists prices an agreement with no status and no dates (a row of an agreement made outside the flow),
    as Customer Service's SLA reads its service agreements: the guard treats an agreement with no status by its dates alone, so that
    spec and Customer Service pass unchanged; every agreement this build writes has a status;
  - "for the order's parties": the agreement's organization is the price organization and, when it names one, its other party is the
    transaction's counterparty (the customer of a sale, the supplier of a purchase); AgreementParty rows are not read by the guard;
  - a rep's quote line has no agreement to name, so the seller's authority (`get#SellerProductPrice`) chooses the selling organization's
    current customer agreements with the customer itself (active, dated, not a template), ranked first, the latest first; any other
    caller still gets an agreement's row only by naming the agreement (`agreementId`), now guarded;
  - who reads agreements: design §2 gives Agreements to "app" (every Sales reader); agreements are the organization's terms, not
    assigned work, so a Sales reader of the organization reads them all, a change needs `SALES_AGREEMENT_EDIT`; no area deny, no new
    permission and no setup row (BossSetupSalesData.xml is not touched);
  - the negotiated prices are kept on the agreement by `store#AgreementItem` under `SALES_AGREEMENT_EDIT` (ProductPrice rows naming
    the agreement and item), as Purchasing keeps its own, since the agreement keeper holds no `PRICE_EDIT` (borrowed authority, §2);
    Products' editor (Customer prices) can still write a sales agreement's row for a `PRICE_EDIT` holder, and activation refuses a
    row not in the agreement's currency or parties (PRICE_INVALID);
  - "parties" for activation: the customer and a signer of the customer's (the customer or a current contact, AgreementParty);
    "evidence": an AgreementContent of type AcntDocument, or the acceptance typed at activation, kept as one; AgreementParty needs no
    dates (no succession reads them), so none were added;
  - renewal's link type: AgreementAssoc had only AatAlternate and AatAddendum; P15 seeds AatRenewal;
  - OrderDetail is boxes, not tabs: "the Agreements tab" is an Agreements box in the quote and sales-order contexts (shown when a line
    took an agreement's price); PriceExplain stays at P7's `Sales/Products/PriceExplain` (one route per screen), not the design's
    `Sales/Agreements/PriceExplain`;
  - Agreement's Chatter and files branch (F69) is kept as it is: of the user's organizations, with a customer the user may see.
- Mantle:
  - `service/mantle/party/SalesAgreementServices.xml` and `SalesAgreements.js` (new): `find#SalesAgreements` (states open, draft,
    active, expiring, ended, templates, all; organization, customer, type, text, a date range, an order's agreements; paged),
    `get#SalesAgreement` (header, activation needs, parties, terms, items with the price in effect, documents, the quote and order
    lines priced from it the caller sees, history, term types, the caller's actions), `create#SalesAgreement` (from a template's items,
    prices and terms), `store#SalesAgreement`, `store#AgreementParty`, `store#AgreementTerm`, `store#AgreementItem`,
    `activate#SalesAgreement` (PARTIES_REQUIRED, DATE_INVALID, EVIDENCE_REQUIRED, TERMS_REQUIRED, PRICE_REQUIRED, PRICE_INVALID,
    TEMPLATE_NO_ACTIVATE, STATUS_INVALID; a renewal ends its predecessor at its start), `end#SalesAgreement` (a draft cancelled, an
    active one closed now or ended at a later date, an expired one closed; REASON_REQUIRED), `renew#SalesAgreement` (SUCCESSOR_EXISTS),
    `expire#SalesAgreements`; every write at `agreementRevision` (REVISION_REQUIRED, REVISION_CHANGED). All `allow-remote="false"`.
  - `entity/SalesAgreementEntities.xml` (new: AatRenewal), `data/SalesAgreementSetupData.xml` (new: job `expire_SalesAgreements`).
  - `SalesAccess.js` (a P15 block before the module value): `agreementTypes`, `agreementOf`, `requireAgreement`.
  - The guard (Products' owner contract, F20): `PriceResolver.js` `agreementApplies`, `sellerAgreementIds`, `agreementChosen`, used in
    `readable` (the seller's authority), `typed` (the trace says "Agreement not active, outside its dates or not with these parties")
    and `listEligible`; `PriceServices.xml` get#ProductPrice's description (the obsolete TODOs removed) and get#SellerProductPrice's.
  - `SalesQuotes.js` explainLine and `SalesQuoteServices.xml` explain#QuoteLinePrice: the line's agreement, its name and dates.
- BOSS:
  - Screens: `Sales.xml` (Agreements, menu index 6; an agreement as a record panel host; key `g m`); `Sales/Agreements.xml`,
    `Sales/Agreements/Agreements.xml` (AgreementFind in the list's header, AgreementList with Open, Active, Expiring, Drafts, Ended and
    Templates, NewAgreement), `Sales/Agreements/CustomerPrices.xml` and `PriceLists.xml` (Shared/Prices, PriceLists and PriceListDetail,
    shown to a holder of PRICE_VIEW or PRICE_EDIT); `Shared/AgreementDetail.xml` (new: header with Activate, Renew or New agreement and
    More; activation needs; Overview, Parties, Items and prices, Terms, Linked quotes and orders, Documents, History, Conversation and
    Files); `Shared/Customer360/SalesAgreements.xml` (new tab); `template/SalesAgreements.xml` (transitions) and
    `template/SalesAgreementParts.xml` (OrderDetail's Agreements box), included from `template/SalesOrderDetail.xml`;
    `Shared/PriceExplain.xml` (the agreement line; the agreement passed to a price reader's trace).
  - `Sales.js` (a P15 block after P12's, and a palette block before `search`): linkPaths, recordKinds `agreement`, choices
    `agreementTemplates` and `agreementParties`, the palette's agreements.
  - Owner contract: Products' `SharedContext.js` `salesContext()` passes a holder's PRICE_EDIT through and links PriceListDetail.
  - Demo (`data/BossZSalesDemoData.xml`, a P15 block at the end): Retail East's active "Contoso supply terms" (One-One at 17.50,
    One-Two at 10,800, net 30, Dana Morales signing, the signed copy) and the draft template "Standard supply terms".
- Specs:
  - Mantle `test/party/SalesAgreements` (new, 3 features, about 2.1 s): activation refused without the customer's signer and without
    evidence, a stale revision and a reader's change refused, an outsider refused as a party, a draft's price no price; a new quote
    at the two negotiated prices, the explanation naming the agreement, the order's agreements found, End refused without a reason, then
    a new quote at the general price and the first keeping its own, the linked lines for a reader and none for the keeper (who sees
    none of the rep's quotes); a renewal a draft linked to the old with its item, price and party, a second refused, another
    organization's agreement missing to A's keeper and absent from B's list, the job expiring one past its date.
    `test/product/ProductAgreementPrices` (new, 2 features, 0.2 s): an agreement's price only while active, dated and with the customer
    (active and no-status apply; draft, closed, future, past, another customer's and a template's do not; the trace's reason); the
    seller's authority takes its current agreement, another customer's own, the later of two once both have started, none once closed;
    a reader naming no agreement gets the general price.
  - mr-boss `test/Sales/SalesAgreements` (new, 1 feature, 0.2 s warm, 0.8 s cold): AgreementDetail's one qvt render as the keeper and
    Agreements' one html render as the rep. `SalesAccess` (a P15 feature, about 0.23 s). `SalesSpecLib.js`: the menus with Agreements,
    the key `g m`, the demo agreements.
  - Acceptance, written and not run: `test/acceptance/Sales/SalesAgreementUsable` (3 features through AgreementDetail's transitions:
    the keeper's agreement for Contoso with two prices, a signer and the acceptance, activated; sales.rep2's quote at the two prices
    and PriceExplain's agreement line; the agreement ended, a new quote at the general price and the first keeping its own; the demo
    agreement ended first). The earlier order of the scenario is the earlier quote here: a quote line and an order line keep their
    price the same way.
- Tests run (release binary, `--nobuild`, this worktree's runtime), after the merge of master: mr-mantle ProductPriceLists,
  ProductEffectivePrices, ProductPricePolicy, PurchaseAgreements, PurchaseOrders, Sourcing, DropShip, ShopCatalog, StoreCheckout,
  ShopCheckout, ShopSubscriptions, Subscriptions, Promotions, StorePromotions, SalesQuoteDrafts, SalesQuoteTemplates, SalesQuoteIssue,
  SalesQuoteResponse, SalesPortal, SalesOrderApproval, SalesOrganizationScope, OrderToCashBasicFlow, CalcGridSales, SupportWarranty,
  ContentRecords, RecordVisibility, ProductAgreementPrices and SalesAgreements 194 of 194 (30 specs with dependencies, 116 s). mr-boss
  SalesAgreements, SalesAccess, SalesQuotes, SalesOrders, SalesQuoteTemplates, SalesAccounts, SalesHome, SalesOpportunities,
  SalesSettings, SalesApprovals, SalesQuoteSend, QuickCreate, PurchasingAgreements, PurchasingAccess, ProductsPriceLists,
  ProductsSharedContext, ProductsInventory, CommerceOrders, CustomerServiceOrders, Chat, RecordFiles, AdminAccess and InsightsRecords
  all passing (SalesAccess 15 of 15 after the merge's conflict, the rest 164 of 164). Client SalesPipelineWalk 1 of 1 (7.9 s, before the
  merge). OrderDetail's quote (with the Agreements box), Customer360's Agreements tab (html), Customer prices and Price lists (html, as a
  price reader), PriceExplain with an agreement, AgreementDetail in tui and the templates list were rendered once by hand without
  errors and not kept. `moqui lint --screens` (release): 141 flagged sites, as before, none in a new or changed screen. Prettier clean on
  the new and changed JavaScript. Not run: ./moq test-apps, test-framework, the acceptance suite.
- Inventories: ss-inventory's EditAgreement, FindAgreement and EditPrices rows naming Sales/Agreements; usl-inventory's
  create#AgreementContent, update#AgreementContent and get#ProductPrice rows and an "Added in the Sales build: agreements and customer
  prices" table.
- Design edits: design-sales §7 "As built (impl-sales P15)"; design-products §7 (the guard, the seller's agreements, Sales' price
  mounts; owner contract).
- Findings, numbered by the lead F253 to F258 in order:
  - the guard admits an agreement with no status by its dates alone (Products' ProductPriceLists and Customer Service's service
    agreements are made so); a raw Agreement row written without a status, by REST or an import, would price without activation;
    making the status required is the user's call (it changes Products' spec and Customer Service's SLA reading);
  - Products' price editor (Customer prices, `store#ProductPrice` with `PRICE_EDIT`) still writes a sales agreement's row directly,
    with PricePolicy checking only the agreement's organization; Purchasing refuses its agreements' rows there ("changes on the
    agreement"); Sales leaves it open (design §7 names the Products editor for AgreementPrices) and activation checks the rows'
    currency and parties, but a row added to an active agreement in Products is not checked;
  - the seller's authority with two current agreements with one customer takes the latest-started one's row first; no rule stops two
    overlapping active agreements of one customer;
  - `get#SalesAgreement`'s linked lines and `find#SalesAgreements`' orderId read the quotes and orders the caller sees, so the agreement
    keeper (no quote or order of their own) sees none; a keeper who should see them needs `SALES_TEAM_VIEW`;
  - a template's terms and print text, an agreement's print and stored approved PDF, ContractSchedules, the agreement as a Commons
    record link in the palette's other roots, and Customer Service's and Accounting's AgreementDetail contexts are not built;
  - `docs/security/Attack-Surface.md` (mr-moqui) does not name the agreement services or the guard; P15 had no mr-moqui worktree.
- For the lead:
  - budget share: mr-mantle about 2.3 s (SalesAgreements about 2.1 s, ProductAgreementPrices 0.2 s); mr-boss server about 0.45 s
    (SalesAgreements 0.2 s warm, SalesAccess' P15 feature 0.23 s); client none;
  - merge hot spots (P14 and Marketing P6 beside it): mr-mantle `service/mantle/sales/SalesAccess.js` (a P15 block after P12's end and
    exports at the end), `service/mantle/product/PriceResolver.js` and `PriceServices.xml` (get#ProductPrice's description and
    parameters, get#SellerProductPrice's description), `service/mantle/order/SalesQuotes.js` explainLine and `SalesQuoteServices.xml`
    explain#QuoteLinePrice; mr-boss `service/ironstone/sales/Sales.js` (a P15 block after P12's end, a palette block before
    `search`), `screen/Sales.xml` (the record panel hosts, the Agreements subscreen after Products, the keymap, the header comment),
    `template/SalesOrderDetail.xml` (two section-includes, after the quote's and the order's Items boxes),
    `service/ironstone/products/SharedContext.js` (salesPaths, salesContext's capabilities), `screen/Shared/PriceExplain.xml`,
    `data/BossZSalesDemoData.xml` (a P15 block at the end), `test/Sales/SalesSpecLib.js` (menus, keys, ids), `test/Sales/SalesAccess.spec.js`
    (a feature after P12's), `plan/ss-inventory.md`, `plan/usl-inventory.md`, `plan/design-sales.md` §7, `plan/design-products.md` §7.
    BossSetupSalesData.xml is not touched;
  - Attack-Surface (mr-moqui `docs/security/Attack-Surface.md`), beside Sales' quote templates: "Sales' customer agreements
    (`mantle.party.SalesAgreementServices`, all `allow-remote="false"`): AgrSales and AgrProduct agreements of a selling organization;
    a Sales reader of the organization reads them, a change needs `SALES_AGREEMENT_EDIT` and names the agreement's revision, another
    organization's answers as missing and Purchasing's agreements are not reached; activation needs the customer's signer, acceptance
    evidence and priced items. The price resolver applies an agreement's price row or list only while the agreement is active (or has
    no status) and in its dates, of the price organization and with the transaction's counterparty; `get#SellerProductPrice` reads only
    the selling organization's current agreements with the quote's customer.";
  - the user's call: whether an agreement without a status should price at all (the first finding).

**Review 2026-11-14 (P15).** A fresh review of `sal/p15` (mr-mantle 905cd118, mr-boss a70305e5 and 3a6a7412) against P15, §2, §4, F19,
F20 and design §7 and design-products §7, access, scope and the pricing of every caller first. Master (Marketing P6) merged into both
branches first, without conflict (mr-mantle 992fc867, mr-boss c59fed77); P15's specs and the pricing callers' re-run after it.
- Checked and sound:
  - The guard (`PriceResolver.js` `agreementApplies`, `agreementChosen`, `sellerAgreementIds`): a row or list naming an agreement is
    eligible only for the agreement the context names (with its item when the row names one) or, for the seller's authority alone, one
    of the selling organization's current AgrSales or AgrProduct agreements with the customer; and only while that agreement is active
    (or has no status), dated at the price date, not a template, of the price organization and with the transaction's counterparty.
    Other rows and lists are matched as before; a purchase context checks the supplier, so Purchasing's agreement rows price as they
    did (PurchaseAgreements, PurchaseOrders, Sourcing, DropShip pass unchanged). The store's authority still reads no agreement row
    (Shop and Commerce unchanged), lists still need `PRICE_VIEW` outside the seller's authority, and the trace stays a price reader's.
  - No leak to another customer: a caller without `PRICE_VIEW` reads no row naming a vendor or customer (every row Sales writes names
    both), whatever `agreementId` or `customerPartyId` it passes; a price reader naming another customer's agreement, or its own with
    another customer, gets the general price (ProductAgreementPrices; SalesAgreements now checks the rep's crafted call too).
    `get#SellerProductPrice` takes no `agreementId`, reads only the organization's current agreements with the quote's customer (the
    quote services checked the customer is an account of the caller's scope), never another party's row, a cost or a trace;
    `explain#QuoteLinePrice` names the line's agreement only to a reader of the quote, who as a Sales reader of the organization reads
    its agreements anyway.
  - SalesAgreementServices: every service checks the Sales scope and the organization (`agreementOf`: AgrSales or AgrProduct of an
    organization of the scope; another organization's, a purchase agreement and a missing one answer RECORD_UNAVAILABLE alike) and
    `SALES_AGREEMENT_EDIT` for a change; every party, template, product, term type, settlement term and customer given is checked;
    every write but create names `agreementRevision` and counts it once; an active agreement's price change, removed item and changed
    term are ended and started anew, never deleted (a draft's change in place); activation checks the customer's signer, the dates,
    the evidence, every open pricing item priced and every price row in the agreement's currency and parties; a renewal's activation
    ends its predecessor at its start; `expire#SalesAgreements` takes each agreement in its own transaction, logs a failure and goes on.
    Purchasing's services and its expiry job (AgrPurchase only) are untouched.
  - Screens: AgreementDetail's transitions call Mantle at the revision shown; Customer360's tab and the price mounts show only in Sales'
    context; `salesContext()` passes a holder's own `PRICE_EDIT` and nothing more.
- Fixed (mr-mantle, mr-boss "Sales P15 review"):
  - R1 (medium, borrowed authority; the Built note's second finding): Products' price editor (`store#ProductPrice`,
    `replace#ProductPrice`, `expire#ProductPrice`, the bulk price change, an import) could add to or change an active customer
    agreement's prices with `PRICE_EDIT` alone, past `SALES_AGREEMENT_EDIT`, the agreement's revision and activation's checks, and a
    bulk "+5 % on sales prices" would reprice agreement rows. PricePolicy's write check now refuses a row of an AgrSales or AgrProduct
    agreement ("A customer agreement's price changes on the agreement"), as it refuses Purchasing's; the bulk change fails those rows
    one by one and goes on. SalesAgreements checks it (fails on the unfixed code).
  - R2 (low, revisions): `renew#SalesAgreement` named no revision, so two renewals from one read could race past SUCCESSOR_EXISTS. It
    now takes `agreementRevision` (REVISION_REQUIRED, REVISION_CHANGED) and counts the predecessor's revision, with the reason "Renewed
    by …"; AgreementDetail's Renew passes it. SalesAgreements checks a missing and a stale one.
  - R3 (low; the Built note's third finding, judged): two active agreements of one organization with one customer pricing the same
    product in overlapping dates left the price to whichever started later, silently. Activation now refuses it (AGREEMENT_OVERLAP,
    naming the other agreement and product), as does a priced product added to an active agreement; a renewal's predecessor, which its
    activation ends, is not counted, and agreements pricing different products (a product agreement beside general terms) may overlap.
    SalesAgreements checks an overlapping activation refused and a renewal's activation ending its predecessor (that path was untested).
- Findings, numbered by the lead F259 to F262 in order:
  - the Built note's first finding stands for the user (an agreement with no status prices by its dates alone); with R1 a raw AgrSales
    row is no longer writable through Products, so the remaining path is an Agreement written by REST, an import or entity data;
  - Products' price-list editor (`store#ProductPriceList`, PriceLists.js) may still attach a price list to a customer agreement under
    `PRICE_EDIT`; the guard applies it only while the agreement is active, but the list is not on the agreement's revision or
    activation checks;
  - `salesAgreementContent` (BOSS) adds a document, which counts as acceptance evidence, to an agreement of any status and names no
    revision (it checks `agreementEdit` and the organization);
  - the Built note's fourth and fifth findings stand (the keeper sees linked lines only of quotes and orders they read; the template
    print, contract schedules and the other apps' AgreementDetail contexts are not built).
- Tests run (release binary, `--nobuild`, this worktree's runtime, after the merge): mr-mantle SalesAgreements, ProductAgreementPrices,
  ProductPriceLists, ProductEffectivePrices, ProductPricePolicy, ProductCatalogImport, ProductCatalogCsv, PurchaseAgreements,
  PurchaseOrders, Sourcing, DropShip, ShopCatalog, StoreCheckout, ShopCheckout, ShopSubscriptions, Subscriptions, Promotions,
  StorePromotions, SalesQuoteDrafts, SalesQuoteTemplates, SalesQuoteIssue, SalesQuoteResponse, SalesPortal, SalesOrderApproval,
  SalesOrganizationScope, OrderToCashBasicFlow, CalcGridSales, SupportWarranty, ContentRecords and RecordVisibility 211 of 211 (32
  specs with dependencies, 78.5 s); SalesAgreements again after Prettier 3 of 3 (feature time about 2.0 s); with the fixes taken out,
  R1's check fails. mr-boss SalesAgreements, SalesAccess, SalesQuotes, SalesOrders, ProductsPriceLists, ProductsSharedContext,
  PurchasingAgreements, PurchasingAccess, CustomerServiceOrders and CommerceOrders 72 of 72 (44 s). `moqui lint --screens` (release):
  no site flagged in Shared/AgreementDetail or the Sales templates (Purchasing's AgreementDetail as before). Prettier (mr-moqui's
  config) on the changed JavaScript. Not run: test-apps, test-framework, the acceptance suite.
- For the lead:
  - budget share: mr-mantle about 2.4 s (SalesAgreements about 2.2 s with the review's checks, ProductAgreementPrices 0.1 s); mr-boss as
    the Built note;
  - merge hot spots beside the Built note's: mr-mantle `service/mantle/product/PricePolicy.js` (the agreement write check, beside
    Purchasing's), `service/mantle/party/SalesAgreements.js` and its spec; mr-boss `template/SalesAgreements.xml` (Renew's revision);
  - Attack-Surface (mr-moqui `docs/security/Attack-Surface.md`), after Sales' quote templates: "Sales' customer agreements
    (`mantle.party.SalesAgreementServices`, all `allow-remote="false"`): AgrSales and AgrProduct agreements of a selling organization
    with its customer; a Sales reader of the organization reads them, a change needs `SALES_AGREEMENT_EDIT` and names the agreement's
    revision, another organization's answers as missing and Purchasing's agreements are not reached; activation needs the customer's
    signer, acceptance evidence, every pricing item priced in the agreement's currency and parties and no other active agreement with
    the customer pricing one of its products in its dates. Its negotiated prices change only on the agreement: Products' price editor,
    bulk changes and imports refuse a customer agreement's row, as they refuse a purchase agreement's. The price resolver applies an
    agreement's price row or list only while the agreement is active (or has no status) and in its dates, not a template, of the price
    organization and with the transaction's counterparty, and only for the agreement the caller names; a caller without the price
    permission reads no party's row whatever agreement or customer it names; `get#SellerProductPrice` reads only the selling
    organization's current agreements with the quote's customer, and the store's authority none.";
  - the user's call: the Built note's first finding (whether an agreement with no status prices at all), with the lead.

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

**Built Nov 14 (P16).** mr-mantle and mr-boss on branch `sal/p16` (hashes in the worker's reply), with master (Sales P17, P18, Marketing
P7) merged in before the last runs; mr-moqui and mr-pass unchanged, no Rust built.
- Checked first (the code over the plan): P11's, P12's and P15's Built and Review notes, §4 (Q7, the Nov 11 Subscriptions row, the
  approval-setting row), F7, F22, F23; the worker (OrderServices.xml `clone#Order`, `update#OrderRecur`, `create#RecurringOrders`,
  `create#RecurringOrder`), Shop's base and renewal (ShopSubscriptions.js `makeBase`, `prepareStep`, `stopRenewal`), Commerce's
  Subscriptions and StoreSubscriptions.js, Accounting's Recurring invoices, SalesAccess.js and the readers of `OrpRecurringTemplate`;
  a sweep of every reader of approved orders in mr-mantle, mr-boss and mr-pass for Q7. The code over the plan:
  - the worker's clone kept the base's purpose, so a native base marked `OrpRecurringTemplate` would have made children that were
    templates too (Shop clears it in its own renewal); the native child now has no purpose;
  - "a base may carry no reservation, shipment or billing source": an approved order has been reserved (and may be shipped or billed)
    by the time it is made recurring, and making the order itself the base would leave its first period unfulfilled; so, as Shop does,
    `store#SalesRecurrence` makes the base a copy of the approved order (copyPayment=false, approved, no placed or approved date,
    marked), and the order stays an ordinary order. An order made recurring before Sales (cadence, no marker) is kept in place and
    marked when it is edited;
  - Q7 confirmed against the code, not as the plan assumed: these readers counted or acted on an approved base and now leave it out
    (owner contracts, each beside its test): supply planning's demand (SupplyPlanning.js, which then pegged, reserved and routed the
    line), shipment loads (ShipmentLoads.js evaluate: RECURRING_TEMPLATE), `create#OrderPartShipment` and `add#OrderPartToShipment`
    (the TODO in `update#OrderRecur` replaced), `reserve#AssetForOrderItem` itself (its callers in planning, quality and drop ship
    reached a base past the two wrappers), the account's open-order count (SalesAccounts.js), Customer Service's order record
    (CustomerService.js readOrder and isSalesOrder, which left out only quote templates), the PASS Support portal's customer orders
    (CustomerOrders.js, which offered a base for cancel and return) and Shop's own orders (ShopCustomer.js, which hid a base only by
    its cadence, cleared when its contract is cancelled);
  - "due in the base's zone": the framework reads a cron expression in the machine's zone only; SalesRecurrence.js reads the cadence in
    the base's zone by moving a moment to the instant with the same wall clock in the machine's zone and back (exact but for the
    hour a clock change repeats or skips); no framework change;
  - "one child for an occurrence under its key": the occurrence is the latest scheduled time after the last order and resumption;
    each generated order carries it (`recurOccurrenceDate`) and the unit answers an occurrence already ordered; the operator's retry
    carries an operation key (the job has no user, so EntityLib's operation keys do not fit it);
  - "one base's failure named and the rest run": the job called each base asynchronously and recorded nothing; it now runs each
    native base in its own transaction one after another (Shop's dispatch stays asynchronous), logs a failure naming the base and keeps
    it on the base (`recurFailureDate`, `recurFailureMessage`) for RecurrenceList's "Last run failed";
  - "names its agreement": `recurAgreementId`, an active agreement of the seller with the customer; at each occurrence the agreement it
    names and those whose prices its lines took must still apply (PriceResolver.js `agreementApplies`, now exported), else the
    occurrence fails AGREEMENT_INACTIVE and nothing is repriced (design §7 "not replaced by the latest catalog price");
  - "auto-invoice needs the finance right": `RECEIVABLE_EDIT` to turn it on;
  - who repeats an order: a keeper of recurrence (SALES_RECURRENCE_MANAGE: the agreement keeper and the administrator) sees no order by
    assignment, so `store#SalesRecurrence` takes any approved sales order of the keeper's organizations (sourceOf); SALES_TEAM_VIEW
    reads the bases; no new permission and no setup row (BossSetupSalesData.xml is not touched);
  - the services are `mantle.order.SalesRecurrenceServices`, not the plan's G (SalesAgreementServices): the records are orders, beside
    the worker; Sales' Subscriptions context does not call Commerce's `find#StoreSubscriptions` (it needs COMMERCE_ORDER_VIEW) but its
    own `find#SalesSubscriptions`;
  - OrderDetail has no Recurrence form to point here: it gains Make recurring (More, an approved order, a keeper), which opens New
    recurring order with the order chosen; Accounting's Recurring invoices gains "Manage in Sales" (a literal route, as other cross-app
    links, for a holder of SALES_RECURRENCE_MANAGE).
- Mantle:
  - `entity/SalesRecurrenceEntities.xml` (new): OrderHeader's `recurTimeZone`, `recurFromDate`, `recurThruDate`, `recurPausedDate`,
    `recurAgreementId` (audited), `recurResumedDate`, `recurRevision`, `recurFailureDate`, `recurFailureMessage`,
    `recurOccurrenceDate`.
  - `service/mantle/order/SalesRecurrence.js` and `SalesRecurrenceServices.xml` (new): `find#RecurringSalesOrders` (STATE_INVALID),
    `store#SalesRecurrence` (ORDER_REQUIRED, ORDER_NOT_APPROVED, SCHEDULE_INVALID, ZONE_INVALID, DATE_INVALID, AGREEMENT_INVALID, the
    finance right, the revision), `change#SalesRecurrence` (OPERATION_INVALID, STATE_INVALID, REASON_REQUIRED, NOTHING_DUE, the
    revision, the retry's operation key), `find#SalesSubscriptions` (KIND_INVALID), `add#SubscriptionFollowUp` (OWNER_INVALID); the
    worker's `occurrenceOf`, `agreementRefusal`, `orderForOccurrence`, `runOccurrence`; Sales.js' `recurrenceSourceOptions`.
  - `SalesAccess.js` (a P16 block after P15's, before P18's): `recurringPurpose`, `recurrenceReader`, `recurrenceOf`,
    `requireRecurrence`.
  - Owner contracts: `OrderServices.xml` (`clone#Order` clears the recurrence fields on a copy; `create#RecurringOrders` and
    `create#RecurringOrder` as above; `update#OrderRecur`'s comment), `PriceResolver.js` (the export), `SupplyPlanning.js`,
    `ShipmentLoads.js`, `ShipmentServices.xml`, `AssetServices.xml`, `SalesAccounts.js`, `CustomerOrders.js`, `ShopCustomer.js`;
    `test/order/SalesQuoteIssueFixtures.js` (the spec grant covers SalesRecurrenceServices).
- BOSS:
  - Screens: `Sales/Agreements/RecurringOrders.xml` (new, tab 4 "Recurring orders", a keeper's and a team reader's: the list with its
    saved lists and header filters, New recurring order, the row's Edit and More with Make the due order now, Pause, Resume and End);
    `Shared/Subscriptions.xml` (Commerce's `Customers/Subscriptions.xml` moved, its Commerce branch unchanged, a Sales branch);
    `Sales/Agreements.xml` (tabs 4 and 5); `Commerce/Customers.xml` (the mount's location); `template/SalesRecurrence.xml` (new:
    salesRecurrenceChoices, salesStoreRecurrence, salesChangeRecurrence, salesSubscriptionFollowUp); `template/SalesOrderDetail.xml`
    (Make recurring); `Accounting/Receivables/RecurringInvoices.xml` (Manage in Sales; its texts).
  - `Sales.js` (a P16 block after P15's, before P18's): linkPaths Agreements/RecurringOrders and Agreements/Subscriptions, the choices
    `recurrenceSources`, `agreements` and `timeZones`; and P14's `changeOrders` choice called `mantle.order.SalesWorkspaceServices`,
    which does not exist (it is `mantle.sales.`), so NewChange's order drop-down was always empty; fixed.
  - `CustomerService.js` (owner contract): recurring bases left out of the order record.
- Specs:
  - Mantle `test/order/SalesRecurrence` (new, 5 features, about 2.1 s): an approved order made a monthly base in Denver's zone by the
    keeper (a reader refused for the permission, B's keeper as missing, auto-invoice refused without the finance right, a stale revision
    refused), the base approved and marked with no payment or placed date, the order untouched, invoice and shipment refused
    RECURRING_TEMPLATE, listed to the keeper and not to B's, not among find#SalesOrders, the account's open orders counting the order
    alone; two runs and the job make one order for the 1st at 07:00 Denver, placed with no payment and no purpose, the retry
    NOTHING_DUE; a paused base makes none (REASON_REQUIRED without a reason, a stale resume refused) and after resuming the paused
    occurrence is not made, an ended base none; a base whose agreement was closed fails AGREEMENT_INACTIVE on the base and in "Last run
    failed" while a third base runs, and the first base's ordered occurrence is not made again; a Shop contract's base makes nothing
    here and is not Sales' (RECORD_UNAVAILABLE), Subscriptions list a storeless subscription of a generated order (its base, "No billing
    link") beside a store contract for A's reader and neither for B's, the agreement filter, Follow up refused without SALES_ACCOUNT_EDIT
    and to B's user as missing, and made a task for the keeper.
  - mr-boss `test/Sales/SalesRecurrence` (new, 1 feature, about 0.3 s): Recurring orders' one qvt render as sales.agreement (the base,
    its zone, New recurring order, Make the due order now), Subscriptions' one html render in Sales' context as sales.rep (a storeless
    subscription, "No billing link", Follow up, none of Commerce's find form) and the three P16 choices with a selected value outside
    the page. `SalesAccess` (a P16 feature, about 0.36 s): pausing a base at a stale revision reaches the keeper's revision check, is
    refused the manager for the permission and Ziziwork Sales' rep as missing. `SalesSpecLib.js`: `recurringBase()`.
  - Acceptance, written and not run: `test/acceptance/Sales/SalesRecurrenceScenarios` (4 features through RecurringOrders' and
    Subscriptions' transitions: sales.agreement makes Wingtip's approved order a monthly base; the job places one order, a second run and
    a retry none; a paused base skips its month and resuming does not make it late; Subscriptions shows a storeless subscription beside
    a store contract of Retail's store with Follow up and no cancel or retry).
- Tests run (release binary, `--nobuild`, this worktree's runtime), after the merge of master: mr-mantle SalesRecurrence, OrderLifecycle,
  ShopSubscriptions, Subscriptions, ShopCustomer, SalesAccounts, SupplyPlanning, ShipmentLoads, ShipmentPick, SupportPortal,
  AssetReservationMisc, OrderToCashBasicFlow, SalesOrderApproval, SalesQuoteTemplates, SalesAgreements, ProductAgreementPrices,
  ReplenishmentRoutes, Sourcing, SalesOrderChanges, WarehouseShipping, SalesOrganizationScope, StoreCheckout, ShopCheckout, SalesPortal
  and SalesForecasts 202 of 202 (27 specs with dependencies, 86 s); before the merge also Replenishment, OrderChanges, CarrierServices
  and InvoiceOrderApply (217 of 217). mr-boss SalesRecurrence, SalesAccess, SalesOrders, SalesAgreements, SalesOrderChanges, SalesHome,
  SalesQuotes, SalesAccounts, SalesForecast, CommerceSubscriptions, CommerceOrders, CommerceAccess, CustomerServiceOrders,
  CustomerServiceAccess, AccountingCollections and InsightsHome 91 of 91 (55 s). mr-pass whole suite 217 of 217 (16.6 s of its 20 s;
  before the merge 11 failed against master's mr-pass, which had Marketing P7 and Sales P17 that this branch's mr-mantle lacked, and
  passed after it). Commerce's Subscriptions (qvt as the subscription operator, html as the administrator), RecurringOrders in tui,
  Sales' Subscriptions in qvt and tui, OrderDetail's Make recurring and Accounting's Manage in Sales were rendered once by hand without
  errors and not kept. `moqui lint --screens` (release): 141 flagged sites, as before, none in a new or changed screen. Prettier clean
  on the new and changed JavaScript. Not run: the client walk (no screen it walks changed), ./moq test-apps, test-framework, the
  acceptance suite.
- Inventories: usl-inventory's update#OrderRecur, create#RecurringOrders and create#RecurringOrder rows and an "Added in the Sales build:
  recurring orders and subscriptions" table; ss-inventory's OrderDetail RecurOptions row.
- Design edits: design-sales §7 "As built (impl-sales P16)"; design-commerce §6 Subscriptions "As built (Nov 14, impl-sales P16)" (owner
  contract).
- Findings, numbered by the lead F290 to F298 in order:
  - with `copyPayment=false` a native base's generated order has no payment, so it is never auto-approved and auto-invoice (which
    bills only a part approved at its placement) bills nothing; native renewals wait for an approver, and a renewal payment through
    Accounting's attempt with recorded consent (design §7) is not built for native bases;
  - the cadence is read in the base's zone by a wall-clock shift; around a clock change an occurrence at the repeated or skipped hour
    may move by that hour; a zone-aware cron reader in the framework would remove it (`ec.service.nextCronExecution` with a zone);
  - a base has no detail screen (Sales' OrderDetail does not show a template); RecurrenceList's first column is not a link, and the
    base's lines are seen only as its amount;
  - missed occurrences are not each made: as the native worker, one order for the latest due occurrence (a base down for two months
    makes one order);
  - the job now runs native bases one after another in its own call, not asynchronously; a long list of due bases lengthens the job
    run;
  - readers that still list an approved base as an order, low or display only (from the sweep): Commerce's palette and store-order
    record (Commerce.js orderSearch, readStoreOrder), Commerce's call context and store customers' counts (StoreOperations.js
    storeCallRecords, findStoreCustomers), Accounting's order detail offering Invoice (the backend refuses), `get#CustomerFinance`'s
    order list, Projects' order-line picker (BillingServices.xml), the bulk part status change (OrderBulkServices.xml), projected
    inventory (`MantleInventoryOrderItem` document, no purpose condition), `notify#OrderHighPriority` and `DropShip.js approved()` on
    a base re-approved; and readers that leave a base out only because it has no placed date (SalesAnalysis.js and its screen without
    a date filter, MarketingSegments.js, the `mantle-sales-orders` and `mantle-sales-items` datasets and the `mantle-sales-daily-floor`
    alert);
  - find#SalesSubscriptions and find#RecurringSalesOrders read up to 500 candidates and filter by scope in the script; fine for the
    demo, a joined query when volumes grow;
  - a Sales reader of the organization sees its store contracts (customer, product, paid-through, next renewal and amount) whatever
    their own assignments, as agreements are read (P15); no payment method or consent is returned;
  - `docs/security/Attack-Surface.md` (mr-moqui) does not name the recurrence services; P16 had no mr-moqui worktree.
- For the lead:
  - budget share: mr-mantle about 2.1 s (SalesRecurrence); mr-boss server about 0.7 s (SalesRecurrence 0.3 s, SalesAccess' P16 feature
    0.36 s); client none;
  - merge hot spots (P18 merged already; P17's and P19's files): mr-mantle `service/mantle/sales/SalesAccess.js` (a P16 block between
    P15's and P18's, exports at the end), `service/mantle/order/OrderServices.xml` (clone#Order, update#OrderRecur, create#RecurringOrders,
    create#RecurringOrder), `service/mantle/product/PriceResolver.js` (the module value), `SupplyPlanning.js`, `ShipmentLoads.js`,
    `shipment/ShipmentServices.xml`, `product/AssetServices.xml`, `sales/SalesAccounts.js` (findAccounts' open orders),
    `order/CustomerOrders.js`, `party/ShopCustomer.js`, `test/order/SalesQuoteIssueFixtures.js`; mr-boss `service/ironstone/sales/Sales.js`
    (a P16 block between P15's and P18's; changeOrders' service name), `screen/Sales/Agreements.xml`, `screen/Shared/Subscriptions.xml`
    (moved from Commerce), `screen/Commerce/Customers.xml`, `template/SalesOrderDetail.xml` (More), `screen/Accounting/Receivables/
    RecurringInvoices.xml`, `service/ironstone/customerservice/CustomerService.js`, `test/Sales/SalesAccess.spec.js` (a feature between
    P15's and P18's), `test/Sales/SalesSpecLib.js` (recurringBase), `plan/usl-inventory.md`, `plan/ss-inventory.md`, `plan/design-sales.md`
    §7, `plan/design-commerce.md` §6. BossSetupSalesData.xml and Sales.xml are not touched;
  - Attack-Surface (mr-moqui `docs/security/Attack-Surface.md`), after Sales' customer agreements: "Sales' recurring orders
    (`mantle.order.SalesRecurrenceServices`, all `allow-remote="false"`): a recurring base is an approved copy of a sales order marked
    `OrpRecurringTemplate`, which reservation, shipment, invoicing, planning and the order lists leave out; `SALES_RECURRENCE_MANAGE`
    keeps the bases of the caller's sales organizations and repeats an approved sales order of them, `SALES_TEAM_VIEW` reads them,
    another organization's and a Shop contract's base answer as missing; every change names the base's revision, a retry carries an
    operation key, turning auto-invoice on needs `RECEIVABLE_EDIT`, and a base's agreement must be an active one of the seller with the
    customer. The worker (`create#RecurringOrders`, `create#RecurringOrder`, anonymous) orders a base only when due in its zone, inside
    its dates and not paused, one order for an occurrence under the base's lock, copied with no payment and placed through
    `place#Order`, and fails an occurrence whose agreement no longer applies. `find#SalesSubscriptions` gives a Sales reader the
    organization's store contracts (no method or consent) and storeless subscriptions; `add#SubscriptionFollowUp` needs
    `SALES_ACCOUNT_EDIT` and assigns only a person who works for the organization.";
  - nothing needs the user's call; the first finding (native renewals never auto-approved or auto-invoiced with no payment copied) may
    be worth the user's look against design §7's renewal payment.

**Review 2026-11-14 (P16).** A fresh review of `sal/p16` (mr-mantle 691a0975, mr-boss 4da81ea2) against P16, §2, §4 (Q7, the
Subscriptions row, the approval-setting row), F22, F23 and design §7. Master (Sales P18) was already merged into both by the worker and
had nothing newer, so no merge; P16's specs were run again.
- Checked and sound:
  - the worker as an owner contract: a Shop-linked base is still dispatched only to Shop (asynchronously, before any Sales guard), and a
    Shop contract's base is refused by `create#RecurringOrder` and answers Sales as missing; every other base runs in its own
    transaction (`runOccurrence`, `requireNewTransaction`), one after another, a failure logged naming the base and kept on it, the next
    base run; under the base's lock (`for-update`) the occurrence is checked again (zone, dates, pause, anchor) and an occurrence already
    ordered answers that order (`recurOccurrenceDate`), so the job and an operator's retry make one order; the order is a copy with
    `copyPayment=false`, its purpose cleared, placed through `place#Order` (so `OrderPlacedAutoApprove`, `approvalWaits` and the seller's
    setting apply as for any sales order); the agreement guard fails an occurrence AGREEMENT_INACTIVE and reprices nothing. ShopSubscriptions,
    Subscriptions, OrderLifecycle (the native worker) and mr-pass pass unchanged;
  - the base: made by `clone#Order` (entity-create, so no approval SECA, mail, reservation or drop ship fires), marked, no placed date,
    reservations removed by `update#OrderRecur`, which also refuses a billed or shipped order, so a legacy in-place base is marked only
    when it was never billed or shipped;
  - scope: `recurrenceOf` needs a Sales reader with `SALES_RECURRENCE_MANAGE` or `SALES_TEAM_VIEW`, a selling first part of an
    organization of the scope, and no Shop contract; another organization's or a Shop contract's base answers RECORD_UNAVAILABLE, a
    reader's write PERMISSION_DENIED; every change names `recurRevision`, a retry its operation key; auto-invoice needs `RECEIVABLE_EDIT`
    to turn on (a refused store rolls back the copy it made). The keeper repeating any approved sales order of their organizations
    (`sourceOf`) is sound with no new permission: recurrence, like agreements (P15), is the organization's schedule, the keeper sees the
    bases it makes anyway, and the source must be an approved sales order sold by an organization of the scope;
  - the time zone shift (Built finding 2): exact but for an occurrence at an hour a clock change repeats or skips, in the base's zone
    or the machine's (a cadence at 01:00-03:00 on a change day may move by the hour, or be skipped when the machine's clock skips it);
    the occurrence is computed the same way on every run, so it never orders twice. Low, as a provisional finding;
  - Shared/Subscriptions: Commerce's branch is the old screen's body under `appRoot != 'Sales'`, its mount and route unchanged
    (CommerceSubscriptions passes); the Sales branch calls only `find#SalesSubscriptions` and `add#SubscriptionFollowUp`, which check
    Sales' permissions and organizations themselves, so a supplied appRoot gains nothing; Follow up only, no lifecycle action;
  - screens: RecurringOrders' one qvt render and Subscriptions' one html render in SalesRecurrence; no route fixture.
- Built finding 1 (no payment copied, so native renewals are never auto-approved and auto-invoice bills nothing): P16's text asks only
  for `copyPayment=false`; design §7's sentence says where a renewal payment may come from (Accounting's attempt, with recorded
  off-session consent), not that P16 builds it, and only Shop's contracts have consent and a renewal charge today. So nothing P16
  requires is missing; see For the lead for the consequence.
- Q7, the readers the worker left: judged by whether they could ship, reserve, invoice, count as revenue or show a base as a customer's
  order. Fixed:
  - R1 (medium): Projects' order-line picker offered a base's lines and `link#ProjectOrderItem` linked one, after which
    `create#MilestoneInvoiceItems` (which has no purpose guard) would bill the base. `link#ProjectOrderItem` refuses a recurring base or
    quote template (RECURRING_TEMPLATE) and Projects' `search#OrderLines` leaves them out. WorkProjectMilestones checks the refusal.
  - R2 (low): the bulk part status change (`change#OrderPartsStatus`) swept bases with the approved orders it cancels or completes,
    silently ending their recurrence; it now leaves bases and quote templates out. SalesRecurrence checks a bulk cancel passes the base by.
  - R3 (low): `get#CustomerFinance` listed a base (and a quote template) among the customer's orders; now left out. SalesRecurrence checks
    the list.
  - R4 (low): Commerce's store customers (their orders and last order) and the call context's open store orders
    (StoreOperations.js `findStoreCustomers`, `storeCallRecords`) counted a base made from a store order; both now use
    `withoutRecurringBases`.
  - R5 (low): the sales analysis (SalesAnalysis.js) left a base out only by its placed date, so with no period (an organization without
    a fiscal month) it counted the base as sales; it now leaves bases and quote templates out by purpose.
  - R6 (low, test): "one order for an occurrence" was checked only through `lastOrderedDate`; SalesRecurrence now moves the last order
    back and checks that a run answers the occurrence's existing order (it fails without `orderForOccurrence`).
  Left, display only or unreachable for a base: Commerce's palette and store-order record (staff search; Shop's bases were there before
  P16); Accounting's order detail offering Invoice (`create#InvoiceFromSource` refuses RECURRING_TEMPLATE); projected inventory and the
  order-item price summary (`MantleInventoryOrderItem`, a report); `notify#OrderHighPriority` and `DropShip.js approved()` on a base
  re-approved (no reservation, so no drop-ship order); MarketingSegments and the `mantle-sales-orders`, `mantle-sales-items` and
  `mantle-sales-daily-floor` reports, bounded by the placed date their time field is.
- Findings, numbered by the lead F299 to F303 in order:
  - with no payment copied a native renewal waits in Awaiting approval every period, and `recurAutoInvoice` never bills (it bills only a
    part approved at placement), while Accounting's Recurring invoices still says "Invoiced on approval"; Accounting's renewal payment
    attempt with recorded consent (design §7) is not built for native bases;
  - `clone#Order`'s `productItemsOnly` default: a base and each order made from it repeat only the product lines, so the source's
    shipping charge, discount and tax lines are not repeated and nothing computes tax at placement; a generated order's total is its
    product lines alone (the native worker had the same default; P16 newly makes Sales' bases through it);
  - a base made from a store order keeps its store, so its generated orders follow the store's rules (approval delay, store mail);
  - the clock-change hour (Built finding 2, as judged above);
  - the Built note's other findings stand: no base detail screen; missed occurrences make one order; the job runs native bases in
    series; 500-candidate reads filtered in the script; a Sales reader sees the organization's store contracts.
- Tests run (release binary, `--nobuild`, this worktree's runtime): mr-mantle SalesRecurrence 5 of 5 (2.6 s of features) and
  WorkProjectMilestones 10 of 10; OrderBulk, StoreOperations, SalesReportStoreScope, AccountingStatements, AccountingCustomerFinance,
  OrderLifecycle, ShopSubscriptions, Subscriptions, ShopCustomer, SalesAccounts, SupplyPlanning, ShipmentLoads, SupportPortal and
  SalesAgreements, 101 of 101 features (14 specs, 69 s). mr-boss SalesRecurrence (0.32 s), SalesAccess (P16's feature 0.30 s),
  CommerceSubscriptions, CommerceAccess, CustomerServiceOrders, AccountingCollections, AccountingReporting, ClientBilling, Billing,
  SalesOrders and SalesAgreements, 75 of 75 (73 s). mr-pass whole suite 217 of 217 (19.1 s of its 20 s). Each new check fails on the
  unfixed code. No screen changed, so no screen lint; Prettier clean on the changed spec (SalesAnalysis.js was not Prettier-clean before
  and was not reformatted). Not run: test-apps, test-framework, the acceptance suite.
- For the lead:
  - budget share: mr-mantle about 2.7 s (SalesRecurrence 2.6 s, WorkProjectMilestones' added check under 0.1 s); mr-boss server about
    0.6 s as built; client none. mr-pass is at 19.1 s of 20 s;
  - merge hot spots: the Built note's, and the review's mr-mantle `service/mantle/work/ProjectServices.xml` (link#ProjectOrderItem),
    `service/mantle/account/CustomerFinanceServices.xml`, `service/mantle/order/StoreOperations.js`, `service/mantle/sales/SalesAnalysis.js`,
    `service/mantle/order/OrderBulkServices.xml`, `test/work/WorkProjectMilestones.spec.js`; mr-boss `service/ironstone/projects/BillingServices.xml`
    (search#OrderLines);
  - Attack-Surface (mr-moqui `docs/security/Attack-Surface.md`), after Sales' customer agreements: "Sales' recurring orders
    (`mantle.order.SalesRecurrenceServices`, all `allow-remote="false"`): a recurring base is an approved copy of a sales order with no
    payment, marked `OrpRecurringTemplate`, which reservation, shipment, invoicing, a project's order lines, planning, the bulk part
    status change, the order lists and the sales measures leave out; `SALES_RECURRENCE_MANAGE` keeps the bases of the caller's sales
    organizations and repeats an approved sales order of them, `SALES_TEAM_VIEW` reads them, and another organization's or a Shop
    contract's base answers as missing; every change names the base's revision, a retry carries an operation key, turning auto-invoice on
    needs `RECEIVABLE_EDIT`, and a base's agreement must be an active one of the seller with the customer. The worker
    (`create#RecurringOrders`, `create#RecurringOrder`, `authenticate="anonymous-all"`, run by the `create_RecurringOrders` job) sends a
    Shop contract's base to Shop only and orders any other base only when due in its zone, inside its dates and not paused, each in its
    own transaction, one order for an occurrence under the base's lock, copied with no payment and no purpose and placed through
    `place#Order` (so it is approved as any sales order of the seller, never on a copied payment), and fails an occurrence whose agreement
    no longer applies. `find#SalesSubscriptions` gives a Sales reader the organization's store contracts (no payment method or consent)
    and storeless subscriptions; `add#SubscriptionFollowUp` needs `SALES_ACCOUNT_EDIT` and assigns only a person who works for the
    organization.";
  - the user's call: native renewals as built wait for an approver each period and are never auto-invoiced. Options: keep it (each
    renewal approved by a person, billed as any order); let auto-invoice bill a generated order when it is approved later (no payment
    needed for billing on terms); or build Accounting's renewal payment attempt with recorded consent for native bases (design §7),
    which P16 does not ask for. Also the lines a base repeats (product lines only, no tax computed at placement): keep, or copy every
    line and compute tax on the generated order.

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

**Built Nov 14 (P17).** mr-mantle, mr-pass and mr-boss on branch `sal/p17` (hashes in the worker's reply), from master (P13 merged);
mr-moqui unchanged, no Rust built.
- Checked first (the code over the plan): P11's and P13's Built and Review notes, §4 (the `SalesOrder` scope row, the Nov 14 calls),
  F17, F18, F42, F48, F73, F235 and F236; ExternalAccess.js (the `SalesOrder` kind, `pageOf`, `create`, `check`, `actingParties`),
  SalesPortal.js, SalesOrders.js `send#OrderConfirmation` and its build, OrderConfirmations.js (the stored confirmation), Shop's
  order pages (ShopCustomer.js `invoicesOf`, `shipmentsOf`, `actionsOf`; mr-pass ShopAccount.js), SupportPortal.js `askers` and
  mr-pass Support.js `orderLink`, Billing's InvoicePay and Portal.js `checkInvoice`, PublicApps.js, the schema and route copies,
  PassAuthority's lists; mr-pass README, Deployment ("Sales app", "Adding an app") and impl-shop. The code over the plan:
  - the operations are camelCase GET reads, as P13's: `findSalesOrders`, `getSalesOrder` and `getSalesOrderDocument` (the plan's
    `sales.findOrders` and `sales.getOrder`); none is a bearer write, so no `TOKEN_WRITES` list changes; the PDF is in
    PassAuthority's `DOWNLOADS`;
  - "the order's PDF" is the stored confirmation as placed (Customer Service's OctOrderConfirmation, the one the confirmation mail
    attaches; P11 built no order print); a read never makes one, so an order with none shows no PDF;
  - the OrderView page by the order's store is a `recordPage` of the `SalesOrder` kind (a storeless order's OrderView opens the Sales
    mount targeting the organization; a store order's keeps Shop's page on the store's site), and the link is made in the ledger's
    build at each attempt, as P13's quote links are (the ledger keeps no token), lasting 366 days as Shop's order link;
  - one public page an order (F42): CustomerOrders and CustomerOrder show storeless orders only, and refuse a store order's link;
  - the Billing and Support links are each app's own pages under its own access: Billing's InvoicePay by `invoiceId` for a
    signed-in account (Billing's self relationship or a Billing contact grant), and Support's NewCustomerCase and RequestReturn by
    `orderId`, which take a link's reader's order link from the session as Shop's guest's (Support.js `orderLink` reads
    `passSalesOrders:<site>` too, an owner contract); each only where the site's mount of that app serves the same organization
    (another organization's Billing would not know the invoice);
  - F236 (the P13 review: an answered quote read the order as it is now): kept simple, as the lead asked: once accepted, an order whose
    revision moved past the issue's (a commercial change; the seller counts commercial changes only, which an issue requires) shows
    no lines or totals on the quote's page, list or receipt, says the order changed and links the order's page; the PDF stays the offer;
  - master's two schema copies had diverged in order (P13's Sales block and Dogfood DG6's mailing-list block merged in opposite
    orders), failing mr-pass Forum's copies check; Mantle's ForumSchema.js is made equal to mr-pass's Schema.js.
- Mantle:
  - `service/mantle/order/SalesPortal.js` (a P17 block before the operations map): `find#CustomerOrders` (a signed-in account's
    orders of the customers it acts for; state open or all; reference the order or the PO, in the query, ignoring case; paged; each
    row's delivery and billing state), `get#CustomerOrder` (lines and totals as text, needed-by and ship-by and delivery-by dates, the
    accepted quote, shipments with carrier and tracking, a carrier's link only when https, invoices with due date and open amount,
    Billing's and Support's links as above, the PDF's name) and `get#OrderDocument`; which orders: a placed sales order of the
    organization whose every part is the seller's to the customer, storeless, not a recurring base or a template, not being changed,
    cancelled or rejected; the asker a token's OrderView (an order ID beside it its own) or the signed-in account's `actingFor`; one
    NotFound for every miss. `quoteView`'s and the list's F236 rule; `get#AccountCard` counts open orders with My orders.
  - `SalesPortalServices.xml` (three services at the end, all `allow-remote="false"`); `ExternalAccess.js` (owner contract: the
    `SalesOrder` kind's `recordPage`, `pageOf` by record, `create`'s page); `SalesOrders.js` (a P17 `orderLink` before the build;
    the build's `orderUrl`) and `template/order/SalesOrderConfirmationEmail.html.fancy` (the link); `ForumSchema.js`,
    `script/PassRoutes.js` (after the quote operations) and `PassAuthority.js` (`DOWNLOADS`).
- PASS:
  - `screen/Sales/CustomerOrders` (MyOrderFind: open or all, the order or your PO; MyOrders: reference, PO, customer when several,
    placed, total, state, delivery, billing, 20 to a page) and `screen/Sales/CustomerOrder` (OrderSummary, OrderShipments,
    OrderInvoices, the PDF through a `document` transition, Help with this order; no form), plain HTML `.html.fancy` pages over
    `Sales/Sales.js` (`download` by operation, `keepOrderLink`); CustomerQuote and QuoteResponse say when the order changed and link
    the order for a signed-in contact; `Support/Support.js` `orderLink`; the header's My orders, Account › Settings' Quotes and
    orders card; `Schema.js` and `Routes.js` (equal to Mantle's), `Apps.js` and `Sales.xml` comments; README, Deployment "Sales app".
- Specs:
  - Mantle `test/order/SalesPortal` (2 P17 features, 1.9 s of the spec's 6.5 s): the confirmation mails its recipient's link to the
    Sales mount; the link reads its one order (PO, one line, total, shipment with two tracked packages, the script URL dropped, the
    open invoice without a Billing link, the PDF, no location) and no list; a changed ID, the order token on a quote page, a quote
    link on the order page and an order ID with no sign-in give nothing; a store order's link is Shop's `/shop/Orders/Status` and the
    Sales page refuses it; a contact lists the direct order and the accepted quote and no draft, base, store order or other
    customer's, finds by PO, gets Billing's link where the site's Billing serves the organization and the accepted quote; an outsider
    none; the Account hub's card counts open orders; the accepted quote shows its lines until a commercial change and none after,
    its receipt no total.
  - mr-pass `test/Sales/SalesPortalAccess` (a P17 feature, 0.02 s; the order set placed directly, so no mail or print): CustomerOrder's
    one render by a link (the order, its PO and customer, Delivery and Invoices, no form, no cancellation link); a forged link and a
    quote link read "This order is not available" with nothing of the order; My orders asks a visitor to sign in; the three order
    reads in both copies, GETs, and in no `TOKEN_WRITES` list.
  - Acceptance, written and not run: mr-pass `test/acceptance/SalesOrderScenarios` (3 features: the confirmation's link shows that one
    order read only and its PDF, another order not; once shipped and invoiced a contact finds it under My orders, follows its tracking,
    opens the invoice in Billing (InvoicePay), and the hub counts it; no changed ID, quote link or other account shows another
    customer's order) and `test/acceptance/client/SalesOrderHttp` (2 features: the link at 390 px with tracking, the open invoice and
    no form; plain requests, also through a remote frontend: the invited contact's My orders, forged and crossed links and another
    customer's order), with `test/Sales/SalesOrderFixtures.js` and `SalesOrderFixtures` on PASS_HTTP after SalesQuoteFixtures,
    registered in `client/suite.js`.
- Tests run (release binary, `--nobuild`, this worktree's runtime): mr-mantle SalesPortal 6 of 6 (twice); mr-pass SalesPortalAccess 3 of
  3; mr-mantle and mr-pass StorelessOrderConfirmation, SalesOrderApproval, SalesQuoteIssue, SupportPortal, AccountingPortals,
  ShopCheckout, ShopCustomer, SupplierPortal, StoreFulfillment, Forum, ShopCart, Portals, SupportAccess, ShopAccount, PassAuthority and
  Transport 102 of 105, Forum's copies check failing on master's diverged schema (above) and its two later features skipped, then
  Forum 13 of 13 after the fix; mr-pass whole suite 214 of 214 (22.7 s, over its 20 s under the parallel workers' load; P13 read 16.6
  s, P11 13.4 s; P17's share 0.02 s); mr-boss CustomerServiceAccess, CustomerServiceOrders, SalesAccess, SalesOrders and
  CommerceAccess 58 of 58. `moqui lint --screens` (release): 141 flagged sites, as before, none in a new or changed screen; parse
  failures 0; the new `.html.fancy` pages compile. Prettier (mr-moqui's config) on the changed and new JavaScript. Not run: the client
  walk (no BOSS screen changed), ./moq test-apps, test-framework, the acceptance suite.
- Inventories: usl-inventory's "Added in the Sales build: PASS Sales orders" table; ss-inventory has no row naming a PASS Sales path.
- Design edits: design-sales §10 "As built (impl-sales P17)" (and P13's note's forward reference); design-crosscut CX-CUSTOMER-ACCOUNT
  (OrderView's page by the order's store). design-shop (mr-pass) unchanged: Shop's contract holds.
- Findings, numbered by the lead F263 to F272 in order:
  - the PASS operations are `findSalesOrders`, `getSalesOrder` and `getSalesOrderDocument`, GET reads; design §10.1 names them
    `sales.findOrders` and `sales.getOrder`;
  - the order's PDF is the stored confirmation as placed; an order with none (Projects' or Customer Service's storeless orders, which
    send no confirmation, P11) shows no PDF, and has no link either, though a signed-in contact sees it under My orders;
  - PASS Sales shows storeless orders only (F42): a customer who also buys in the organization's store follows those orders in Shop;
  - an order being changed (OrderBeingChanged), cancelled or rejected is not shown, so while P14's commercial change holds an order in
    a change its link and My orders show it as not available; a cancelled order disappears from My orders;
  - a contact invited to Sales reaches Billing and Support only with its own invitation to each (contact grants are per app); a person
    customer's own verified account reaches all three; the page links each only where the site's mount of it serves the same
    organization;
  - an order link lasts 366 days, as Shop's, is made at each delivery attempt (an uncertain attempt's earlier link stays valid, as P13's
    quote links), is never revoked but by the order's cancellation (resolve refuses a cancelled order), and its token stays in the
    stored confirmation mail as F235's;
  - F236 is settled by the revision: it relies on the seller counting commercial changes only (required to issue); a placement or
    approval that moved the revision would hide an accepted quote's lines too (not seen for an organization without a tax gateway;
    not checked with a storeless tax gateway);
  - master's ForumSchema.js and mr-pass Schema.js had diverged (P13 and Dogfood DG6 merged in opposite orders), failing mr-pass
    Forum's copies check; fixed here by making Mantle's copy equal;
  - My orders filters by state and by the order or PO, not by a date range (design's MyOrderFind);
  - `docs/security/Attack-Surface.md` (mr-moqui) does not name PASS Sales' orders; P17 had no mr-moqui worktree (the text below).
- For the lead:
  - budget share: mr-mantle about 1.9 s (SalesPortal's two P17 features); mr-pass server about 0.02 s (SalesPortalAccess' P17 feature);
    mr-boss none; client none. mr-pass's suite read 22.7 s of its 20 s under the parallel workers' load (see Tests run);
  - merge hot spots: mr-mantle `service/mantle/order/SalesOrders.js` (a P17 `orderLink` before `buildConfirmation`, the build's map;
    Sales P14 may touch this file), `service/mantle/party/ExternalAccess.js` (the `SalesOrder` kind's `recordPage`, `pageOf`,
    `create`), `service/mantle/order/SalesPortal.js` (header, `quoteView`, find#CustomerQuotes' total, `accountCard`, the P17 block
    before the operations map, the map), `SalesPortalServices.xml` (end), `service/mantle/forum/ForumSchema.js` (the whole file made
    equal to mr-pass's, and the P17 entries after `getSalesQuoteResponse`), `script/PassRoutes.js` (after the quote routes),
    `script/PassAuthority.js` (`DOWNLOADS`' end), `template/order/SalesOrderConfirmationEmail.html.fancy`,
    `test/order/SalesPortal.spec.js` (setupSpec, a P17 section at the end); mr-pass `service/pass/Schema.js`, `Routes.js`, `Apps.js`,
    `screen/Sales.xml`, `screen/Sales/Sales.js`, `CustomerQuote.html.fancy`, `QuoteResponse.html.fancy`, `screen/Support/Support.js`
    (`orderLink`), `screen/Shared/Header.html.fancy`, `screen/Account/Settings.xml`, `test/Sales/SalesPortalAccess.spec.js`,
    `test/acceptance/client/suite.js`, `README.md`, `docs/Deployment.md` ("Sales app"); mr-boss `plan/usl-inventory.md` (a table
    after P13's), `plan/design-sales.md` (§10), `plan/design-crosscut.md` (CX-CUSTOMER-ACCOUNT). Sales P14 and P15's own files
    (OrderChange*, agreements, BossSetupSalesData.xml, Sales.xml) are not touched;
  - Attack-Surface (mr-moqui `docs/security/Attack-Surface.md`), a paragraph after PASS Sales' customer quotes: "PASS Sales' customer
    orders (`mantle.order.SalesPortalServices` find#CustomerOrders, get#CustomerOrder and get#OrderDocument, all
    `allow-remote="false"`, `authenticate="anonymous-all"`, reached only as the PASS operations `findSalesOrders`, `getSalesOrder` and
    `getSalesOrderDocument` of the authority's allowlist, reads with no bearer write): each finds the organization from the site's
    `sales` mount and the customer from the bearer link's capability (the `SalesOrder` kind's OrderView, made for each recipient of the
    storeless confirmation at each delivery attempt, lasting a year, only its digest kept; or issued by `create#AccessCapability` under
    the kind's permission as before) or from a signed-in account's contact grant of the `sales` app or its own verified customer party,
    never from the request; a link reaches its one order and never lists, and an order ID beside it must be its own; only a placed
    storeless sales order of that organization whose every part is the seller's to that customer, not a recurring base or template and
    not being changed, cancelled or rejected, is shown; a store order's OrderView link opens Shop's page and the Sales page refuses it,
    and a quote link never opens an order nor an order link a quote; a wrong, expired, revoked or crossed link and another customer's
    order answer the same NotFound; every token lookup counts against the requester's limit; answers are allow-listed projections (no
    cost, margin, internal note or other party; a carrier's tracking link only when https); Billing and Support are linked only where
    the site mounts them for the same organization, each checking its own access (a link's reader reaches Support for that order
    through the link the page keeps in its session, never in a URL); the order's PDF, the stored confirmation as placed, is streamed by
    the facade, its location never answered. A link's token is in the sent confirmation the organization keeps.";
  - nothing needs the user's call; the storeless-only rule (F42) and hiding an order while it is being changed may be worth the user's
    look once P14's commercial change lands.

**Review 2026-11-14 (P17).** A fresh review of `sal/p17` (mr-mantle 5c2127b6, mr-pass 030b247, mr-boss ea8706dc) against P17, §2, §4,
design §10, F42, F48 and F236, as a public, unauthenticated surface with P13's review as the standard. Master (Sales P14, P15,
Marketing P6) merged into mr-mantle (clean) and mr-boss (usl-inventory: P14's and P15's tables kept before P17's); mr-pass had
nothing newer. ForumSchema.js equals mr-pass Schema.js and PassRoutes.js equals Routes.js after the merge; Dogfood DG6's four
mailing-list operations and the eight Sales operations (five quote, three order) are in both.
- Checked and sound:
  - The three services are `allow-remote="false"`, `authenticate="anonymous-all"`, reached only as `findSalesOrders`,
    `getSalesOrder` and `getSalesOrderDocument` of the authority's allowlist (GET reads, in no `TOKEN_WRITES` list; the PDF in
    `DOWNLOADS`, its location stripped). The organization is the site's `sales` mount's; the customer is the OrderView capability's
    (`check` with the scope, the kind and the organization; an order ID beside the token must be its own) or the signed-in account's
    `actingFor`, never the request's. "Sign in" is answered only with no token, before any lookup; every other miss (forged,
    expired, revoked, a crossed ID, another customer's order, a store order's link, a quote link on the order page, an order link on
    a quote page, a cancelled or rejected order, a base or template) is the one NotFound. Token lookups count in `check`, as P13's.
  - Projections: lines and totals through `offerOf` as P13's quote (no cost, margin, price trace, internal note); shipments only
    through this order's ShipmentItemSource rows, their items this order's; a tracking link only `https:` (the spec's script URL
    dropped); invoices of the order's billing, from the organization to that customer, issued only; Billing's InvoicePay only for a
    signed-in account where the site's Billing serves the organization; Support's pages only where its mount serves it. Every value
    is escaped by the `.html.fancy` pages; no form on CustomerOrder. The PDF is the earliest stored OctOrderConfirmation, streamed.
  - Support for a link's reader: Sales.js keeps the token in the session only after a successful read, never in a URL; Support's
    `askers` checks it again (OrderView, the organization, the order ID) and serves storeless orders as Shop's guests'.
  - The owner contract with Shop: `recordPage` changes the page only for a storeless order's OrderView; a store order's link stays
    `/shop/Orders/Status` (the spec checks it), and ShopCheckout, ShopCustomer (mr-mantle) and ShopAccount (mr-pass) pass unchanged.
  - Order links at each delivery attempt, 366 days, revoked only by cancelling: acceptable, as P13's per-attempt quote links. The
    token exists only in that attempt's message; an uncertain attempt may have reached the customer; 366 days is Shop's order link;
    `resolve` refuses a cancelled or rejected order; only the digest is kept. The link also admits Support requests for that one
    order (as Shop's), so F235's stored-mail point applies to it too. Not made when the site has no published Sales mount.
  - Built finding 4 against P14 as merged: not so. A placed order is never Being changed (the status flow has no Placed to Being
    changed; only Open and Proposed); P14's apply holds it with the Change reason and releases that hold inside the one transaction,
    so a pending or applied commercial change leaves the order shown; a Credit hold the change leaves shows as "Received, being
    reviewed" (OrderHold is listed). The `OrderBeingChanged` exclusion is dead for orders; design §10's "Which orders" corrected.
  - F236 against P14 and the storeless tax path: every P14 kind moves the revision where the seller counts commercial changes only
    (a line's quantity or price is `item`, a ship date, method or carrier an OrderPart update, an address an OrderPartContactMech),
    so the quote page shows "changed" after an applied change. The other way, a probe (a scratch spec, not kept) found the revision
    unmoved through acceptance (`place#Order` with the PO), the confirmation's build and stored PDF, and `approve#Order`, both for
    seller A (no gateway) and seller C (`taxGatewayConfigId` LOCAL): the storeless retax runs only on an item or address change and
    not once Approved or billed. So the accepted quote keeps its lines until a real change.
- Fixed (mr-mantle 7f67473b):
  - R1 (low, correctness): find#CustomerOrders took up to 1,000 OrderPart rows of the organization and customers in no order, before
    the store, status and placement filters, so a customer who also buys in the organization's store (or has many drafts) could see
    its recent direct orders missing from My orders and the hub's count. The candidates now come from OrderHeaderAndPart filtered by
    no store, a shown status and a placed date, newest first. No spec check (it needs over a thousand parts); the existing list checks
    pass.
- Findings, numbered by the lead F273 to F277 in order:
  - Built finding 4 (orders being changed hidden) does not hold against P14 (above); a cancelled order still leaves My orders and its
    link reads not available, which may be worth the user's look (a customer may want to see that it was cancelled);
  - an order link admits Support's request pages for that order (a cancellation request is a write by the link's reader), as Shop's
    order link does; with F235 a reader of the organization's sent mail can file one as the customer;
  - signed-in reads by order ID are not rate limited (as P13's quote reads); every token lookup is;
  - the PDF is the confirmation as placed; after a commercial change the page shows the order now and the PDF the order as placed
    (P14 stores its changed document separately), with no label saying so;
  - the Built note's other findings stand (operation names, storeless only, no date filter, contact grants per app).
- Tests run (release binary, `--nobuild`, this worktree's runtime, after the merge and R1): mr-mantle SalesPortal 6 of 6 (27.8 s with
  setup), StorelessOrderConfirmation 1 of 1, ShopCheckout 8 of 8, ShopCustomer 5 of 5, SalesOrderChanges 3 of 3; mr-pass
  SalesPortalAccess 3 of 3, Forum 13 of 13 (the schema copies check), ShopAccount 3 of 3. Prettier (mr-moqui's config) on
  SalesPortal.js. Not run: test-apps, test-framework, the acceptance suite; no screen changed in the review.
- For the lead:
  - budget share: as the Built note (mr-mantle about 1.9 s, mr-pass about 0.02 s); R1 adds none;
  - merge hot spots: as the Built note; with Marketing P7 the schema copies (both equal here, DG6's block before the Sales block in
    each; keep them equal) and mr-boss `plan/usl-inventory.md` (P14, P15, then P17 tables);
  - Attack-Surface: the worker's paragraph is right but for two points: "not being changed" (a placed order never is; drop it) and the
    link's reach into Support. Corrected: "PASS Sales' customer orders (`mantle.order.SalesPortalServices` find#CustomerOrders,
    get#CustomerOrder and get#OrderDocument, all `allow-remote="false"`, `authenticate="anonymous-all"`, reached only as the PASS
    operations `findSalesOrders`, `getSalesOrder` and `getSalesOrderDocument` of the authority's allowlist, reads with no bearer
    write): each finds the organization from the site's `sales` mount and the customer from the bearer link's capability (the
    `SalesOrder` kind's OrderView, made for each recipient of the storeless confirmation at each delivery attempt, lasting a year,
    only its digest kept, ended by the order's cancellation; or issued by `create#AccessCapability` under the kind's permission as
    before) or from a signed-in account's contact grant of the `sales` app or its own verified customer party, never from the
    request; a link reaches its one order and never lists, and an order ID beside it must be its own; only a placed storeless sales
    order of that organization whose every part is the seller's to that customer, not a recurring base or template and not cancelled
    or rejected, is shown; a store order's OrderView link opens Shop's page and the Sales page refuses it, and a quote link never
    opens an order nor an order link a quote; a wrong, expired, revoked or crossed link and another customer's order answer the same
    NotFound; every token lookup counts against the requester's limit; answers are allow-listed projections (no cost, margin,
    internal note or other party; a carrier's tracking link only when https); Billing is linked only for a signed-in account and
    Support only where the site mounts each for the same organization, each checking its own access; a link's reader reaches
    Support's requests for that one order through the link the page keeps in its session after a successful read, never in a URL;
    the order's PDF, the stored confirmation as placed, is streamed by the facade, its location never answered. A link's token is in
    the sent confirmation the organization keeps.";
  - user's calls: none required; the lead may put to the user whether a cancelled order should stay visible (as cancelled) on My
    orders and its link.

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

**Built Nov 14 (P18).** mr-mantle and mr-boss on branch `sal/p18` (hashes in the worker's reply); mr-moqui and mr-pass unchanged, no Rust
built.
- Checked first (the code over the plan): P4's, P6's and P11's Built and Review notes, §4, F53–F262; SalesForecast and
  SalesForecastDetail as ported (no basis, no uniqueness, no service, `closedAmount`, `pipelineAmount` and the percent fields
  unwritten); TimePeriod (SalesYear, SalesQuarter, SalesMonth seeded, no service that makes them for an organization but Payroll's);
  SalesAccess.js (`assignedOpportunityIds`, `assignedOrderIds`, `orderExcludedPurposes`, `memberTeams`, `teamOrganization`);
  find#Opportunities' totals by currency and find#SalesOrders' progress (never summed across currencies or units); team membership as
  Manager (PrtSalesTeamMember with fromRoleTypeId Manager); OrderPartParty (undated) for an order's representative; OrderItemBilling for
  an invoice's order. The code over the plan:
  - design §1.1 gives SALES_FORECAST_EDIT to the manager and the administrator only, while §8's SubmitForecast is "a rep's judgement" and
    the usable-when has a rep submit; P18 grants it to BOSS_SALES_REP too (BossSetupSalesData's P18 block, the bundle), and the rule
    lets a holder enter only their own key's judgement, a team they manage, or with SALES_TEAM_VIEW a team or the organization (the
    user's call, below; design §1.1's row changed);
  - a target and a forecast are one SalesForecast row a key (the target its quota and basis, the judgement its forecast and best case),
    so `store#Target` makes the row for a new key and `store#Forecast` for a key with no target; each refuses a key that has a row
    (DUPLICATE_KEY, FORECAST_EXISTS) and changes a stored one by id and revision;
  - the plan names no service that makes periods: `ensure#SalesPeriods` makes an organization's calendar-year Sales year, quarters and
    months (SALES_TEAM_MANAGE or SALES_CONFIGURE), from Targets' Add sales periods;
  - the calculated measures are never stored on the row (SalesForecast's `closedAmount`, `pipelineAmount` and percent fields stay
    unwritten): a stored number would go stale with every deal moved;
  - "manager roll-up uses unique opportunity ownership at the selected as-of date": a key's deals are those of its party and of its
    descendant forecasts' parties at the as-of time, a person's owned, a team's on the team or owned by a current member, the
    organization's all, as one set, so a deal counts once whoever owns it; only the deals the reader sees (`assignedOpportunityIds`);
  - "an unambiguous dated primary representative": OrderPartParty has no dates, so an order (and its invoices, through
    OrderItemBilling) is attributed to its part's one SalesRepresentative row, else its one SalesTeam row, else unassigned (two
    representatives are unassigned too); an invoice of no order is unassigned and read only by a SALES_TEAM_VIEW holder;
  - Forecast's measures box is number cards (quota, weighted, submitted, won) and a labelled list of every measure with its count and
    what it is; the deals list carries "Counted", "Counted, not weighted" (no probability) or "Left out" with the reason.
- Mantle:
  - `entity/SalesEntities.xml`: SalesForecast's `basisEnumId` (SalesForecastBasis seeded: SfbWonOpportunity, SfbPlacedOrder,
    SfbFinalInvoice), `forecastDate`, `forecastByUserId`; `quotaAmount`, `bestCaseAmount` and the basis audit-logged; the unique key
    `SALES_FCST_KEY` (organization, internal party, period, currency).
  - `SalesAccess.js` (a P18 block before the module value, exports at the end): `forecastBases`, `teamMemberIds`, `managedTeams`,
    `forecastSubjectKind`, `forecastSees`, `forecastSubmits`, `targetManages`, `forecastOf`, `requireForecast`.
  - `service/mantle/sales/ForecastServices.xml` and `SalesForecasts.js` (new): the interface `define#ForecastKey`; `get#Forecast` (the
    measures: quota and basis, open and weighted pipeline, open and won monthly recurring revenue from the recurring plan's months,
    submitted forecast, best case, won amount, placed orders, finalized invoices, and for the organization's key the unassigned orders
    and invoices; the deals with their reasons, paged; the children with their own judgement; the allocations; `noPeriod` when the
    organization has no period), `store#Forecast` (AMOUNT_REQUIRED, BEST_CASE_INVALID, DETAIL_OVER_FORECAST, FORECAST_EXISTS, the reason
    in the audit log), `store#ForecastDetail` (DIMENSION_REQUIRED, DETAIL_OVERLAP through ProductCategoryMember, DETAIL_OVER_FORECAST,
    FORECAST_REQUIRED), `store#Target` (DUPLICATE_KEY, BASIS_INVALID, PARENT_INVALID, HIERARCHY_CYCLE, `clearParent`), `find#Targets`,
    `get#TargetAttainment` (the actual on each target's own basis, variance, percent, source count; the unassigned apart for a team
    reader) and `ensure#SalesPeriods`; every stored write at the revision read (the row's and its details' latest stamp). All
    `allow-remote="false"`.
- BOSS:
  - Screens: `Sales/Pipeline/Forecast.xml` (new, menu index 3: ForecastFind, the measures, Deals behind the pipeline with CSV, Forecasts
    below this one, Allocation by product or category; Submit forecast, Allocate, Remove), `Sales/Settings/Targets.xml` (new, menu index
    5, SALES_TEAM_MANAGE: the targets with CSV, New target, Change, Add sales periods), `Sales/Reports/TargetAttainment.xml` (new, menu
    index 3: TargetOptions, TargetResults with CSV, With no representative). Settings' TypesAndReasons, SalesDefaults and
    ApprovalPolicies move to menu index 6, 7 and 8 (design §1.2's order); `Sales.xml`, `Pipeline.xml`, `Settings.xml` and `Reports.xml`
    comments.
  - `Sales.js` (a P18 block after P15's): linkPaths, the choices `salesPeriods`, `forecastSubjects`, `forecastParents` and
    `productCategories` (over SalesForecasts.js `periodOptions`, `subjectOptions`, `parentOptions`); `ContextServices.xml` get#Choices
    and `template/SalesParts.xml`'s choices transition pass `timePeriodId`.
  - `data/BossSetupSalesData.xml` (a P18 block at the end): SALES_FORECAST_EDIT for BOSS_SALES_REP, in its bundle.
  - Demo (`data/BossZSalesDemoData.xml`, a P18 block at the end): Ziziwork Retail's 2026 Sales year, Q4 and its months; Retail's Q4
    target (120,000 USD, won deals), Retail East's under it (50,000) and sales.rep's under East (30,000, with the rep's forecast 24,000
    and best case 40,000); sales.rep2's measured on placed orders (40,000) under Retail.
- Specs:
  - Mantle `test/sales/SalesForecasts` (new, 5 features, 1.8 s): the weighted pipeline equals its deals' (a manual probability used), an
    undated deal, a lead and a euro deal left out with their reasons, the won amount and its monthly recurring revenue, the rep's
    placed order counted and a recurring base not; a team's roll-up counting the stage deal once before and after its owner changes,
    the mate's forecast then holding it and the rep's not, the team's own judgement not the children's, a zero quota with no
    percentage; a duplicate target and forecast, a cycle, a stale revision, a rep's target and another's judgement refused, a team
    manager reading their member's and team's forecast, another team's rep and another organization's refused as missing, a best case
    under the forecast refused; allocations over the forecast and a product counted twice refused; attainment on each target's own
    basis (the order target's 250, the won target's 200), the unassigned order apart, the basis change's reason in the audit log, a rep
    refused the report.
  - mr-boss `test/Sales/SalesForecast` (new, 1 feature, 0.18 s): Forecast's one qvt render as sales.rep for Retail's 2026 Q4. `SalesAccess`
    (a P18 feature, 0.21 s: store#Target refused the rep for the permission, the manager reaching the revision check, Ziziwork Sales' rep
    refused the rep's forecast as missing; the rep's capabilities with forecastEdit). `SalesSpecLib.js` (the Pipeline, Reports and
    Settings tabs, the manager's Settings tabs, the demo period and forecasts), `SalesSettings` (the manager's tabs Teams and Targets).
  - Acceptance, written and not run: `test/acceptance/Sales/SalesForecastScenarios` (4 features: sales.rep submits through Forecast's
    transition beside an unchanged pipeline; East's roll-up drills to the rep's deals, each once, its own judgement empty and the rep's
    among its children; a manager's target through Targets' transition; attainment of the won targets equal to the won amount alone).
- Tests run (release binary, `--nobuild`, this worktree's runtime): mr-mantle SalesForecasts 5 of 5; with SalesOrganizationScope,
  SalesOpportunities, SalesPipelineSetup, SalesWorkspace, SalesPipelineDataset and SalesAccounts 31 of 31 (7 specs, 8.8 s of features).
  mr-boss SalesForecast, SalesAccess, SalesSettings, SalesReports, SalesOpportunities, SalesHome, AdminCapabilities, AdminRegistries,
  SalesQuotes, SalesOrders, SalesAgreements and SalesApprovals 47 of 47 (12 specs, 15.4 s of features). Client SalesPipelineWalk 1 of 1
  (7.1 s). Targets (html and qvt as the manager, refused to the rep), Target attainment (html as the manager and the reader), Forecast
  in tui and html (the organization's key with its children) and with no period (Ziziwork Sales) were rendered once by hand without
  errors and not kept. `moqui lint --screens` (release): 141 flagged sites, as before, none in a new or changed screen. Prettier clean
  on the new and changed JavaScript. Not run: ./moq test-apps, test-framework, the acceptance suite.
- Inventories: usl-inventory's "Added in the Sales build: forecast and targets" table; no ss-inventory row names Forecast, Targets or
  TargetAttainment (the baseline has no forecast screens).
- Design edits: design-sales §1.1's BOSS_SALES_REP row (SALES_FORECAST_EDIT, own forecast only), §8 "As built (impl-sales P18)", §9
  Targets.
- Findings, numbered by the lead F278 to F286 in order:
  - SALES_FORECAST_EDIT is granted to the representative, beside the manager and the administrator, so a rep submits their own
    forecast as design §8 and the usable-when have it; design §1.1's table did not list it for the rep (the user's call);
  - OrderPartParty carries no dates, so order and invoice attribution is the order part's current representative, not one dated at the
    order's placement; an order whose owner changes later moves its amount to the new owner, and two representative rows leave it
    unassigned;
  - an invoice is attributed only through OrderItemBilling to its order; a sales invoice of no order is unassigned and shown only to a
    SALES_TEAM_VIEW holder; a written-off invoice counts as finalized;
  - the won amount is a won deal's estimated amount (SalesOpportunity has no separate won amount), counted in the period of its latest
    close; a deal reopened and won again counts once, in its latest close's period;
  - a target's audit history (quota, basis, the reason) is kept in the audit log but no screen shows it (AuditChanges reads no
    SalesForecast projection, F57's rule);
  - `ensure#SalesPeriods` makes calendar-year periods only; an organization whose sales year is offset enters its periods otherwise
    (the forecast accepts its Fiscal periods too);
  - an allocation's overlap check reads a category's direct members, not its sub-categories (ProductCategoryRollup);
  - a deal's list is capped at 2,000 deals for one key, as are a period's orders and invoices; past that a measure would undercount
    without saying so;
  - `docs/security/Attack-Surface.md` (mr-moqui) does not name the forecast services; P18 had no mr-moqui worktree.
- For the lead:
  - budget share: mr-mantle about 1.8 s (SalesForecasts); mr-boss server about 0.4 s (SalesForecast 0.18 s, SalesAccess' P18 feature
    0.21 s); client none;
  - merge hot spots (P16 and P17 beside it): mr-mantle `entity/SalesEntities.xml` (SalesForecast), `service/mantle/sales/SalesAccess.js`
    (a P18 block after P15's end, exports at the end); mr-boss `service/ironstone/sales/Sales.js` (a P18 block after P15's first block
    end; the recordKinds comment), `service/ironstone/sales/ContextServices.xml` (get#Choices' `timePeriodId` and description),
    `template/SalesParts.xml` (the choices transition's map), `data/BossSetupSalesData.xml` (a P18 block at the end),
    `data/BossZSalesDemoData.xml` (a P18 block at the end), `screen/Sales.xml` (the header comment only), `screen/Sales/Settings/*.xml`
    (three menu indexes), `test/Sales/SalesSpecLib.js` (pipelineMenu, reportsMenu, settingsMenu, managerSettingsMenu, the P18 ids after
    templates), `test/Sales/SalesAccess.spec.js` (the rep's capabilities, a feature at the end), `test/Sales/SalesSettings.spec.js`,
    `plan/usl-inventory.md`, `plan/design-sales.md` §1.1, §8, §9;
  - Attack-Surface (mr-moqui `docs/security/Attack-Surface.md`), beside Sales' agreements: "Sales' forecasts and targets
    (`mantle.sales.ForecastServices`, all `allow-remote="false"`): a SalesForecast row a key (organization, a person, sales team or the
    organization itself, a period of the organization, a currency), unique; a Sales reader sees their own key, a team's manager their
    teams' and members', a holder of `SALES_TEAM_VIEW` the organization's, another organization's answering as missing; a judgement
    needs `SALES_FORECAST_EDIT` on one's own key, a team one manages or, with `SALES_TEAM_VIEW`, a team or the organization, never
    another person's; a target needs `SALES_TEAM_MANAGE` on a key the caller sees, its parent of the same organization, period and
    currency and never a cycle; every write names the revision read. The measures are read from the deals, orders and invoices the
    reader sees, never stored, never added across currencies, and no template or recurring base counts.";
  - the user's call: SALES_FORECAST_EDIT for the representative (the first finding).

**Review Nov 14 (P18).** A fresh reviewer, over `sal/p18` with master merged first (Sales P17, Marketing P7; one conflict in
`plan/usl-inventory.md`, both tables kept).
- Checked and sound: every ForecastServices verb is `allow-remote="false"`, reads the caller's scope and checks the organization
  again, and answers a forecast another organization's, another person's or an unseen team's as missing (RECORD_UNAVAILABLE); a judgement
  needs `SALES_FORECAST_EDIT` on one's own key, a managed team or (with `SALES_TEAM_VIEW`) a team or the organization, never another
  person's (now also checked for a team manager on their member's forecast); a target needs `SALES_TEAM_MANAGE` on a key the caller sees;
  the unique key `SALES_FCST_KEY` with FORECAST_EXISTS and DUPLICATE_KEY, the cycle check and every stored write at the revision read
  (a removed allocation can only return the revision to a state equal to the one read). The deal measures read only the deals of
  `assignedOpportunityIds`, the orders only those of `assignedOrderIds`, a roll-up's deals as one set (each once across an owner
  change), no template or recurring base (`orderExcludedPurposes`), and nothing across currencies (another currency's deal listed as
  left out; orders and invoices by the key's currency). The probability used is the stored one (stage or manual, P4 writes it). The
  unassigned orders and invoices are shown only to a `SALES_TEAM_VIEW` reader. The CSV exports read the same scoped service, capped as
  its lists are. Screens follow one render per mode (SalesForecast's qvt).
- Built finding 2 (orders attributed to the order part's current representative; two representative rows unassigned) and 3 (an invoice of
  no order unassigned): sound as provisional findings. OrderPartParty carries no dates, so the current representative is the only one
  there is; leaving an ambiguous order unassigned and showing it apart is the conservative reading of "an unambiguous primary
  representative", and an invoice of no order cannot be attributed without inventing a rule.
- Fixed:
  - R1 (medium): each measure read at most 2,000 rows (deals, placed orders, finalized invoices, Targets' forecasts) and would have counted
    short without saying so. `limitedList` reads one row past the limit and refuses (TOO_MANY_RECORDS, naming a shorter period, a team or
    a person to narrow to); Forecast and Target attainment now show a refusal's text instead of "not available". Spec: a 2,001-deal
    organization refused.
  - R2 (medium): an invoice billing several orders was attributed to an arbitrary one of them and shown to a reader who saw that one, so
    its total carried the amounts of orders the reader does not see. Now a reader without `SALES_TEAM_VIEW` counts an invoice only when
    they see every order it bills, and an invoice of differently attributed orders is unassigned. Spec: the rep's invoices 250 (not 580),
    the organization's 580 with 330 unassigned.
  - R3 (low): a target's parent could be a person's forecast (whose measures would then take in every deal below it) and the
    organization's own forecast could have a parent; now a parent is the organization's or a team's forecast and the organization's
    takes none (PARENT_INVALID). The cycle spec builds its cycle through two teams.
  - R4 (low): an allocation's overlap check missed a product counted through two categories, and accepted another organization's product
    or category (showing its name). Now two categories sharing a member overlap (DETAIL_OVERLAP) and the product or category is the
    forecast organization's or a shared one, as Sales' choices offer (PRODUCT_INVALID, CATEGORY_INVALID).
- Recorded: the user's call on `SALES_FORECAST_EDIT` for the representative (§4 row; design §1.1's row names it).
- Findings, numbered by the lead F287 to F289 in order:
  - `merge#Parties` re-points SalesForecast's `internalPartyId`; merging two people who both have a forecast for one key would fail on
    `SALES_FCST_KEY` (a person with a forecast is an internal representative, rarely merged);
  - a sales manager holding `SALES_TEAM_MANAGE` may set their own target and their organization's (no separation rule names targets);
  - Targets' list refuses past 2,000 forecasts of one organization without a screen message (find#Targets' refusal is cleared like any
    load error there).
- Tests run (release binary, `--nobuild`, this worktree's runtime, after the merge): mr-mantle SalesForecasts 7 of 7 (4.2 s of features,
  the row-limit feature 1.9 s of it), SalesOrganizationScope 3 of 3; mr-boss SalesForecast 1 of 1 (0.97 s), SalesAccess 16 of 16,
  SalesSettings 3 of 3, SalesReports 2 of 2, SalesHome 4 of 4. `moqui lint --screens` (release): 141 flagged sites, as before, none in
  P18's screens. Prettier clean on the changed JavaScript. Not run: test-apps, test-framework, the acceptance suite.
- For the lead:
  - budget share: mr-mantle about 4.2 s (SalesForecasts, 2.4 s above the Built note's for the two review features); mr-boss server
    about 0.4 s as built; client none;
  - merge hot spots as the Built note's, and `plan/usl-inventory.md` (P17's table before P18's);
  - Attack-Surface (mr-moqui `docs/security/Attack-Surface.md`), beside Sales' agreements: "Sales' forecasts and targets
    (`mantle.sales.ForecastServices`, all `allow-remote="false"`): a SalesForecast row a key (organization; a person, a sales team or the
    organization itself; a period of the organization; a currency), unique (`SALES_FCST_KEY`). A Sales reader sees their own key, a
    team's manager their teams' and current members', a holder of `SALES_TEAM_VIEW` the organization's; another organization's, another
    person's or an unseen team's answers as missing. A judgement needs `SALES_FORECAST_EDIT` on one's own key, a team one manages or,
    with `SALES_TEAM_VIEW`, a team or the organization, never another person's; a target needs `SALES_TEAM_MANAGE` on a key the caller
    sees, its parent the organization's or a team's forecast of the same organization, period and currency, never a cycle; every write
    names the revision read; an allocation names a product or category of the organization or a shared one. The measures are computed
    as read, never stored, from the deals, orders and invoices the reader sees (an invoice only when the reader sees every order it
    bills), each deal once in a roll-up, never added across currencies, no template or recurring base; a measure past 2,000 rows is
    refused, never counted short. Orders and invoices with no single representative are shown apart, to a `SALES_TEAM_VIEW` reader
    only.";
  - the user's call on the representative's `SALES_FORECAST_EDIT` is recorded (§4); nothing else waits on the user.

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
- **Insights registrations** (owner contracts, as built; F3, F24, F59): the `Sales.SalesAnalysis` entry's route moved
  to Sales' with Sales' catalogue service, `get#SalesReports` answering `reports` for the root `Sales`
  (BossSetupData.xml:3603-3609), since Accounting's catalogue refuses any root but Accounting; an entry of
  Accounting's own for its mount, under its catalogue; entries for SalesSummary, PipelineAnalysis,
  WinLoss, Forecast and TargetAttainment; metrics for open and weighted pipeline, won value and win rate beside
  `Sales.Orders` and `Sales.OrderValue`; flow targets for Leads, Opportunities, Quotes, Orders and Order changes on
  Commerce's rows (BossSetupData.xml:4545-4548), so the suite's flow-map templates' Sales steps become links; the
  `report/boss-sales-pipeline.json` dashboard's other panels (P6 shipped its funnel), the alert templates "quote expiring in N days" and "deal with
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

**Built Nov 14 (P19).** mr-mantle, mr-boss and mr-pass on branch `sal/p19` (hashes in the worker's reply); mr-moqui unchanged, no Rust
built.
- Checked first (the code over the plan): P1's, P6's, P11's and P18's Built and Review notes, §4 (the Nov 14 cancelled-order call), F2,
  F3, F24, F59, F76, F77, F79, F81; `run#SalesAnalysis` (Accounting P16's, report read only, no cost column), the summaries'
  `organizations` (SalesAnalysis.js) and their `currencyUomIds` (none on `get#InvoicesByCustomerClass`), Insights' catalogue contract
  (Registry.js: a catalogue service is called with `appRoot`, its `reports` keyed by `entryId` or `reportId`), its metrics (descriptive
  registrations), flow targets (FlowMaps.js appends the map's organization to a target's organization parameter), report-embed as Home
  uses it, the alert and digest JSON of Customer Service and Insights, the audit log (creates and updates of audited fields, one
  `changedDate` an update). The code over the plan:
  - `run#SalesAnalysis` keeps Accounting's reader as it was and adds Sales' report scope beside it (a holder of `SALES_REPORT_VIEW`, an
    organization of their sales scope, its periods the organization's own, read without Accounting's period check); the finance
    columns are the shipped value, the cost of shipped (issuances at their asset's acquire cost; unknown, named, where a cost is
    missing or in another currency) and the margin over the shipped value, for a report reader or a holder of both `PRICE_VIEW` and
    `PRODUCT_COST_VIEW`. "Accounting's finance columns" are read as these: Accounting's reader always has them;
  - the mount is Accounting/Reports.xml's subscreens-item over Sales' file (Accounting's own file removed); one screen takes the
    root's choices (its own `analysisChoices` transition calls Accounting's or Sales' get#Choices by `appRoot`) and links;
  - `get#SalesReports` is Mantle's (as the plan says) and answers the root Sales only; Forecast is every Sales reader's entry, the
    others the report reader's; the design's saved filters and last run are not kept (a list's saved finds are);
  - "deal with no activity for N days" is built as "no stage movement": the alert needs a dataset timed by the field, so Mantle ships
    `mantle-sales-pipeline-stage-age`, the pipeline's document and row filter timed by `stageEnteredDate`; a logged task does not touch
    the deal. "Quote expiring in N days" is not built: no quote dataset exists (finding);
  - the visit step of the funnel (Marketing P20) reads `mantle.marketing.MarketingReportServices.count#SalesVisits` when it exists
    (`{visitCount}` for organization, days, campaign, source), else "Not available";
  - the five panels of the P12 review are six filters in four files (mantle-sales' three, Commerce's, Insights' two), each now
    `orderPurposeEnumId in [OrpRecurringTemplate, OrpSalesQuoteTemplate]`, negated;
  - the recurrence worker's `operation` is on `create#RecurringOrders` (OrderServices.xml), where P16 works beside this phase.
- Mantle:
  - `service/mantle/sales/SalesPipelineReports.js` (new) and ForecastServices' `get#PipelineAnalysis` and `get#WinLoss` (a P19 block at
    the end, `allow-remote="false"`, read-only): a deal at a time from its audit log (a field's value then is the old value of its first
    change after it, else now; owner and team by their dated rows); open qualified deals by stage, source, owner or age band and by
    currency (count, estimated, weighted, monthly recurring, average age, missing estimates, next-activity coverage now); stage
    durations from chained audited changes, unknown where the log shows no entry or exit; conversion over a lead-created cohort
    (`convertedDate`); the funnel's counts; the close cohort in the final-outcome (default) or event mode, win rate over won and lost
    opportunities, a lead closed Lost apart, loss reasons as written with the close, cycle times, reopenings; every amount by
    currency; past 2,000 deals TOO_MANY_RECORDS.
  - `SalesAnalysis.js` `analysisReader`, `salesOptions`, the cost and margin, `costShown` and `costIncomplete`
    (`SalesReportServices.xml` run#SalesAnalysis description and out-parameters); `get#InvoicesByCustomerClass` gains `currencyUomIds`.
  - `SalesWorkspace.js` and SalesWorkspaceServices' `get#SalesReports` (P19 blocks at the end).
  - `SalesSettings.js` readiness (a P19 block after the checks): `sales.jobs` (the three Sales jobs, none missing, paused or failing on
    its last run), `sales.templates` (the organization's or Mantle's quote, reminder and confirmation templates with a from address and
    a mail server with a host), `sales.approvalPolicies` (the approval setting on with no rule; route `salesApprovalPolicies`).
  - `report/mantle-sales-pipeline-stage-age.json` (new); `report/mantle-sales.json` (quote templates excluded).
  - `operation`/`operation-ref`: `apply#OpportunityImportRow` (`sales.opportunity.import.row`, `operationKey`), `apply#QuoteBatch`
    (`operationKey` added), `create#RecurringOrders` (`sales.recurrence.run`).
  - Carry-over (the user's call, §4 Nov 14): `ExternalAccess.js` resolves a storeless order's OrderView link after its cancellation (a
    store order's link and every other scope still end with it); `SalesPortal.js` lists and opens a placed order later cancelled,
    marked Cancelled (`cancelled`), read only: Support's ask page alone, no cancellation, return or Billing pay link, never counted
    open (the account card); a rejected order stays hidden. SalesPortalServices' descriptions.
- BOSS:
  - Screens: `Sales/Reports/Catalogue.xml` (All reports, the default, menu index 0), `PipelineAnalysis.xml` (4) and `WinLoss.xml` (5),
    each with options, CSV and XLSX lists and print; `SalesAnalysis.xml` rebuilt (above; no entity read, cost search or Show SQL,
    F76, F79); `SalesSummary.xml` (one organization and currency, the base currency by default; Sales' choices for organization,
    stores, accounts and products, F77; the top products and classes for the same organization and currency, F81; the basis named);
    `Accounting/Reports.xml` (the mount; `Accounting/Reports/SalesAnalysis.xml` removed); `Sales/Reports.xml` and
    `Settings/Readiness.xml` comments.
  - `Sales.js` (a P19 block after P18's): linkPaths Catalogue, PipelineAnalysis, WinLoss.
  - Data: `BossSetupData.xml` `Sales.SalesAnalysis` at Sales' route under `get#SalesReports` and `Accounting.SalesAnalysis` under
    Accounting's catalogue (F59); `BossSetupSalesData.xml` (a P19 block at the end): the stage-age dataset's artifact, admission and
    class; catalog entries Sales.SalesSummary, .PipelineAnalysis, .WinLoss, .TargetAttainment, .Forecast; metrics Sales.OpenPipeline,
    .WeightedPipeline, .WonValue, .WinRate; flow targets Sales.Leads, .Opportunities, .Quotes, .Orders, .OrderChanges.
  - Reports: `boss-sales-pipeline.json` (panels by source, owner, open amount by currency, leads by source, outcomes),
    `boss-sales-stalled-deals.json` (alert template, 14 days), `boss-sales-weekly-digest.json` (digest of the pipeline dashboard),
    `insights-flowmap-customer.json` (the quote step opens Sales.Quotes), Commerce's and Insights' order panels (quote templates
    excluded).
- PASS (carry-over): `screen/Sales/CustomerOrder.html.fancy` (a cancelled order's note; "Ask about this order").
- Specs:
  - Mantle `test/sales/SalesPipelineReports` (new, 4 features, 0.6 s): win rate 50 % over won and lost, a disqualified lead apart, the
    reopened deal once (Lost, one reopening) in the final mode and twice as events, dollars and euros apart, the reason's count; a
    chained stage stay measured and a gap unknown, open deals by currency, a cohort's two leads (one qualified, one disqualified), the
    visit step not available; a representative and another organization refused, the catalogue by capability (six entries, the rep's
    Forecast alone) and Accounting's root refused; Sales analysis for a Sales reader without cost and with it (cost 40, margin 60,
    60 %), another organization refused. `test/order/SalesPortal` (a P19 feature, 0.68 s): a cancelled order's link not revoked, read
    marked Cancelled with no cancel, return or pay link, listed under all and not open, the account card's count down.
  - mr-boss `test/Sales/SalesReports` (rewritten, 3 features, 0.25 s): SalesAnalysis's one html render with the finance columns and no
    SQL dialog; the Sales administrator's csv with no cost or margin column; PipelineAnalysis's and WinLoss's one html render each.
    `SalesReportCatalog` (new, 2 features, 0.3 s): Sales.SalesAnalysis at Sales' route for the Sales reader (with the other five),
    the rep's Forecast alone, Accounting.SalesAnalysis alone for the Insights finance reader; All reports' one html render.
    `AccountingReporting` (its SalesAnalysis render now shows "Cost of shipped" under the mount), `InsightsCatalog` (the two
    SalesAnalysis entries), `InsightsFlowMaps` (the quote step links), `SalesSpecLib.js` (reportsMenu).
  - mr-pass `test/Sales/SalesPortalAccess` (a P19 feature, 0.04 s): a cancelled order's render by its link shows Cancelled and no
    Support change, return or Billing link.
  - Acceptance, written and not run: `test/acceptance/Sales/SalesReportsUsable` (3 features: the reader's six reports with the
    pipeline and win/loss exports equal to the services' counts; Accounting's and Sales' analysis CSV over the same rows, Accounting's
    with the finance columns; a manager given Insights' distributor grant subscribes to the weekly digest and copies the stalled-deal
    alert, which fires once a deal has sat 30 days). `test/acceptance/Insights/InsightsCatalogUsable` changed (the finance reader's
    entry is Accounting.SalesAnalysis), not run.
- Tests run (release binary, `--nobuild`, this worktree's runtime): mr-mantle SalesPipelineReports, SalesWorkspace, SalesPipelineSetup,
  SalesPortal, SalesReports, SalesReportStoreScope, SalesOpportunityImport and SalesForecasts 37 of 37; OrderLifecycle,
  ShopSubscriptions, AccountingStatements, MantleSearch, SalesQuoteIssue and SalesPipelineDataset with them 70 of 70; ShopCheckout,
  ShopCustomer, ShopOperations and ShopCart 21 of 21. mr-boss SalesReports, SalesReportCatalog, SalesAccess, SalesSettings, SalesHome,
  AccountingReporting, InsightsCatalog, InsightsFlowMaps, CommerceReports and InsightsDashboards 58 of 58; InsightsAccess,
  AdminRegistries and AccountingAccess 3 specs passing. mr-pass SalesPortalAccess 4 of 4, ShopAccount 3 of 3. Catalogue,
  PipelineAnalysis, WinLoss, SalesAnalysis, SalesSummary and Readiness rendered once by hand in qvt, tui and html-print without
  errors, not kept. `moqui lint --screens` (release): 141 flagged sites, as before, none in a new or changed screen. Prettier clean on
  the new and changed JavaScript that was clean before (SalesAnalysis.js, InsightsCatalog.spec.js, AccountingReporting.spec.js and
  ExternalAccess.js were not and are left so). Not run: ./moq test-apps, test-framework, the acceptance suite.
- Inventories: ss-inventory's SalesAnalysis and SalesSummary rows; usl-inventory's summaries, run#SalesAnalysis and the new "Added in
  the Sales build: reports and Insights registrations" table.
- Design edits: design-sales §8 "As built (impl-sales P19)", §10 a P19 bullet on cancelled orders; design-accounting §13 SalesAnalysis
  "As built (impl-sales P19)" and its Insights registration paragraph (owner contracts).
- Findings, numbered by the lead F304 to F313 in order:
  - "Quote expiring in N days" is not shipped as an alert template: an alert reads a dataset and no quote dataset exists; Home's counter
    and Insights' Sales.QuotesExpiring attention provider show them. A quote dataset (document, feed, Sales' quote row filter) would
    let it be built;
  - the stalled-deal alert measures stage movement (`stageEnteredDate`), not every activity: a logged call or task does not touch the
    deal, so a worked deal sitting in one stage still fires;
  - Pipeline analysis' next-activity coverage is of the open tasks now, not as of the report time (said on the screen);
  - a deal's past state is read from its audit log; a deal loaded with audit off (data files) reads as it is now before its first logged
    change, and a deal closed before the log counts by its stored close only;
  - Sales analysis for a Sales reader takes the organization's own fiscal and sales periods, not those of an organization it rolls up
    to (Accounting's reader keeps the rollup), and with no period or days the organization's fiscal month holding today, else the
    calendar month; an issued line's cost in another currency than the sale's is unknown, never converted;
  - the readiness checks for jobs and mail templates have no place of their own to fix them (Admin's jobs and mail relays are framework
    routes with no route key), so they point to Readiness; a development instance with no SMTP host shows the templates check as a
    warning;
  - the report catalogue keeps no saved filters or last run (design §8's SalesReportCatalogue fields); a list's saved finds are kept;
  - a flow target with an organization parameter is opened with the map's organization (FlowMaps.js), so the quote step links to
    Quotes of that organization;
  - carry-over: staff may now issue a new OrderView link for a cancelled storeless order (create resolves by the same rule); a link's
    reader can still file a Support question on a cancelled order (intended by §4); the cancelled order's PDF is the confirmation as
    placed, with no cancelled label;
  - `docs/security/Attack-Surface.md` (mr-moqui) is not updated: P19 had no mr-moqui worktree (texts below).
- For the lead:
  - budget share: mr-mantle about 1.3 s (SalesPipelineReports 0.6 s, SalesPortal's P19 feature 0.68 s); mr-boss server about 0.45 s
    (SalesReportCatalog 0.3 s, SalesReports 0.25 s for 0.1 s before); mr-pass about 0.04 s; client none;
  - merge hot spots (P16 and Marketing P8 beside it): mr-mantle `service/mantle/order/OrderServices.xml` (`create#RecurringOrders`'
    line, P16), `service/mantle/sales/SalesSettings.js` (routes and a P19 readiness block before `usesSales`), `SalesWorkspace.js` and
    `SalesWorkspaceServices.xml` (P19 blocks at the end), `ForecastServices.xml` (P19 block at the end), `SalesAnalysis.js`,
    `SalesReportServices.xml`, `OpportunityServices.xml` and `SalesQuoteIssueServices.xml` (one service line each),
    `SalesPortal.js`, `ExternalAccess.js` (the `SalesOrder` kind's resolve), `report/mantle-sales.json`; mr-boss
    `data/BossSetupSalesData.xml` (a P19 block at the end), `data/BossSetupData.xml` (the Sales.SalesAnalysis entry),
    `service/ironstone/sales/Sales.js` (a P19 block after P18's), `screen/Sales/Reports.xml`, `screen/Accounting/Reports.xml`,
    `report/insights-suite-*.json`, `report/boss-commerce-store-operations.json`, `report/insights-flowmap-customer.json`,
    `test/Sales/SalesSpecLib.js` (reportsMenu), `test/Insights/InsightsCatalog.spec.js`, `InsightsFlowMaps.spec.js`,
    `plan/design-sales.md` §8 and §10, `plan/design-accounting.md` §13, `plan/usl-inventory.md` (after P18's table),
    `plan/ss-inventory.md`; mr-pass `screen/Sales/CustomerOrder.html.fancy`, `test/Sales/SalesPortalAccess.spec.js`;
  - Marketing P20: the funnel's visit step calls `mantle.marketing.MarketingReportServices.count#SalesVisits` (in: organizationPartyId,
    fromDate, thruDate, marketingCampaignId, dataSourceId; out: visitCount) once it exists (SalesPipelineReports.js `visitService`);
  - Attack-Surface (mr-moqui `docs/security/Attack-Surface.md`): beside Sales' forecasts, "Sales' reports (`mantle.sales.ForecastServices`
    get#PipelineAnalysis and get#WinLoss, `SalesWorkspaceServices.get#SalesReports`, all `allow-remote="false"`): a Sales report reader
    (`SALES_REPORT_VIEW`) of the organizations of their scope, the deals they see (their own and their teams', the organization's with
    `SALES_TEAM_VIEW`); another organization ORGANIZATION_DENIED; amounts never added across currencies; past 2,000 deals refused. The
    catalogue answers the root Sales only. `run#SalesAnalysis` also answers a Sales report reader for an organization of their scope;
    the cost of shipped and the margin only for a report reader or a holder of both PRICE_VIEW and PRODUCT_COST_VIEW, withheld (null)
    otherwise; Accounting's Reports/SalesAnalysis is a mount of Sales' screen." And in the PASS Sales orders paragraph: "…ended by the
    order's cancellation…" becomes "…not ended by the order's cancellation (a storeless order's OrderView link opens it marked
    Cancelled, read only)…", and "…not a recurring base or template and not cancelled or rejected, is shown…" becomes "…not a recurring
    base or template and not rejected, is shown; a cancelled one is shown read only, marked Cancelled, with Support's ask page alone
    and no cancellation, return or payment link, and never counted open…";
  - nothing needs the user's call; the lead may put the quote-expiring alert (first finding) to the user.

**Review Nov 14 (P19).** Master (Sales P16, Marketing P8) merged into the three worktrees first, both sides kept: mr-mantle
`OrderServices.xml` `create#RecurringOrders` keeps P16's description with P19's `operation="sales.recurrence.run"`; `SalesAnalysis.js`
took P16 review R5's template and base exclusion beside P19's reader and cost (auto-merged); mr-boss `usl-inventory.md` has P16's table
then P19's. mr-pass had nothing to merge.
- Checked and sound:
  - `run#SalesAnalysis`: Accounting's reader path unchanged (organization, periods, rollup); a Sales report reader is answered only for
    an organization of their sales scope (`reportOrganizations`, ORGANIZATION_DENIED outside), its periods the organization's own; the
    Sales reader's cost and margin need PRICE_VIEW and PRODUCT_COST_VIEW, so P1's rule (a SALES_REPORT_VIEW holder without
    PRODUCT_COST_VIEW gets no cost) is kept and narrowed, not widened; withheld costs are null, never zero, and the assets' cost is not
    read at all for a non-cost reader. The rebuilt screen reads no entity, has no cost search, cost sort or SQL dialog (F76, F79); its
    cost columns are hidden and null for a non-cost reader in html, CSV, XLSX and saved finds (SalesReports' csv with a cost filter
    and sort as the Sales administrator).
  - SalesSummary: one organization of the scope and one currency, the four summaries asked for both (F77, F81), Sales' choices.
  - Pipeline reports: `reader` requires SALES_REPORT_VIEW and an organization of the scope; `deals` reads only the reader's
    organizations and the deals they see (`assignedOpportunityIds`; the organization's all only with SALES_TEAM_VIEW), owner and team
    filters intersected with that; every amount keyed by currency, counts apart; past 2,000 deals TOO_MANY_RECORDS before anything is
    counted; win rate over won and lost opportunities, a disqualified lead apart; stage stays unknown where the log does not chain.
  - Catalogue: `get#SalesReports` answers the root Sales only, Forecast to every Sales reader and the rest to a report reader;
    `Sales.SalesAnalysis` at Sales' route under it, `Accounting.SalesAnalysis` under Accounting's `get#Catalog` (F59); the new
    services are `allow-remote="false"` and admitted to no Assist or MCP tool.
  - Accounting's mount: a subscreens-item of Accounting/Reports.xml, so its authorization is Accounting's root (BOSS_SAL_REPORTS
    names Sales/Reports.xml only); Accounting's choices by `appRoot`; AccountingReporting unchanged in behavior.
  - Insights: the stage-age dataset is the pipeline's document with the same row filter (`get#PipelineRowFilter`, MantleSalesScope),
    in BOSS_SAL_DATASETS with the pipeline dataset's grants; metrics descriptive; the alert and digest run as their owner under the
    framework's business-schedule rule (Monitoring.md: only owner-equivalent recipients get the result); the dashboard's amount panel
    is split by currency; flow targets' routes and organization parameter.
  - The cancelled-order carry-over (§4): only a storeless order's OrderView resolves after cancellation (Download, renewal, quote
    scopes and a store order's link still end); listed under all, never open, not on the account card's count; no cancel, return or
    Billing link, the ask link alone ("Ask about this order"). Staff issuing a new OrderView link for a cancelled storeless order
    (create resolves by the same rule) only gives the customer the read-only page §4 keeps reachable: acceptable. The PDF is the
    confirmation as placed, with no cancelled mark, beside a page that says Cancelled: acceptable for now, a provisional finding.
  - `operation`/`operation-ref` on QuoteBatch, the import row and the recurrence worker.
- Fixed:
  - R1 (high, confidentiality): `run#SalesAnalysis` gave Accounting's report reader the cost of shipped and the margin with
    `ACCOUNTING_VIEW` alone (`costShown: true`), so Accounting's approvers (BOSS_ACCOUNTING_APPROVE: ACCOUNTING_VIEW, no
    PRODUCT_COST_VIEW) and a Sales report reader who also holds ACCOUNTING_VIEW saw per-product costs; design §8 says margin columns only
    where both price and cost rights permit, and design-accounting §13's "finance columns" are the ordered, shipped, invoiced and returns
    columns, not cost. Now Accounting's reader needs PRODUCT_COST_VIEW too (their report read is their read of the sales values).
    SalesPipelineReports' analysis feature checks an ACCOUNTING_VIEW and SALES_REPORT_VIEW holder without cost read (failed before:
    costShown true). Screen, Accounting's mount comment and catalog entry, design-sales §8, design-accounting §13 and the inventories say so.
  - R2 (low): readiness' scheduled jobs leave out the recurrence worker (`create_RecurringOrders`), which places Sales' recurring
    orders (P16); added.
  - R3 (low, wording): the weekly digest said each recipient's rows are their own scope's; it renders as its owner and reaches only an
    owner-equivalent recipient.
- Findings, numbered by the lead F314 to F318 in order:
  - the plan (P19's Insights registrations) and design §8 L6 ship the alert template "quote expiring in N days"; it is not built (no
    quote dataset). Building it needs a quote dataset (document, feed, Sales' quote row filter, grants and admission) beside the alert
    JSON; Home's counter and Insights' Sales.QuotesExpiring attention provider show expiring quotes now. Required by the plan, so the
    user's call: build it (a follow-up) or accept the attention provider in its place;
  - "deal with no activity for N days" is built as "no stage movement" (`stageEnteredDate`): a logged call or task does not reset it,
    so a worked deal sitting in one stage fires; the design's wording asks for activity;
  - the "weekly pipeline and forecast digest" is the pipeline dashboard alone; forecasts are not in it (no forecast dashboard exists);
  - the readiness additions (jobs, templates, approval rules) have no spec;
  - a cancelled storeless order's confirmation PDF carries no cancelled mark.
- Tests (release binary, `--nobuild`, this worktree's runtime, after the merge and the fixes): mr-mantle SalesPipelineReports,
  SalesWorkspace, SalesReports, SalesReportStoreScope, SalesPortal, SalesPipelineSetup, SalesOpportunityImport, SalesForecasts,
  SalesRecurrence, OrderLifecycle and SalesQuoteIssue 57 of 57 (52 s run; SalesPipelineReports 0.57 s of features); mr-boss SalesReports,
  SalesReportCatalog, SalesAccess, SalesSettings, AccountingReporting, InsightsCatalog, InsightsFlowMaps, CommerceReports,
  InsightsDashboards and SalesRecurrence 56 of 56 (45 s); mr-pass SalesPortalAccess 4 of 4. SalesPipelineReports with R1's check on
  the unfixed SalesAnalysis.js: 3 of 4 (the check failed, as it should). `moqui lint --screens`: nothing in Sales/Reports or
  Accounting/Reports.xml. Not run: test-apps, test-framework, the acceptance suite.
- For the lead:
  - budget share: as the Built note; R1's check adds one user and one call to an existing feature (about 0.01 s);
  - merge hot spots: as the Built note, plus mr-mantle `SalesSettings.js` (`salesJobs`), mr-boss `data/BossSetupData.xml` (the
    Accounting.SalesAnalysis entry's description) and `report/boss-sales-weekly-digest.json`;
  - the user's call: the quote-expiring alert (first finding); nothing else;
  - Attack-Surface (mr-moqui `docs/security/Attack-Surface.md`), beside Sales' forecasts: "Sales' reports
    (`mantle.sales.ForecastServices` get#PipelineAnalysis and get#WinLoss, `SalesWorkspaceServices.get#SalesReports`, all
    `allow-remote="false"`): a Sales report reader (`SALES_REPORT_VIEW`) of the organizations of their scope, over the deals they see
    (their own and their teams', the organization's with `SALES_TEAM_VIEW`); another organization ORGANIZATION_DENIED; amounts never
    added across currencies; past 2,000 deals refused (TOO_MANY_RECORDS). The catalogue answers the root Sales only.
    `run#SalesAnalysis` also answers a Sales report reader for an organization of their scope; the cost of shipped and the margin
    only for a holder of PRODUCT_COST_VIEW who is Accounting's report reader (`ACCOUNTING_VIEW`) or also holds PRICE_VIEW, withheld
    (null) otherwise, the assets' costs not read; Accounting's Reports/SalesAnalysis is a mount of Sales' screen under Accounting's
    root authorization." And in the PASS Sales orders paragraph: "…ended by the order's cancellation…" becomes "…not ended by the
    order's cancellation for a storeless order's OrderView link (it opens the order marked Cancelled, read only; Download and a store
    order's link still end)…", and "…not a recurring base or template and not cancelled or rejected, is shown…" becomes "…not a
    recurring base or template and not rejected, is shown; a cancelled one is shown read only, marked Cancelled, with Support's ask
    page alone and no cancellation, return or payment link, and never counted open…".

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

**Built Nov 14 (P20).** mr-mantle, mr-boss, mr-pass and mr-moqui (docs only) on branch `sal/p20`; master (follow-up 2) merged into
mr-mantle and mr-boss first, both sides kept (nothing conflicted). No Rust built.
- Checked first (the code over the plan): P6's and P19's Built and Review notes (the pipeline and stage-age datasets, the stalled-deal
  alert), §4's Nov 14 call on the quote-expiring alert, impl-maintenance's and impl-people's finish phases (the sweeps' helpers, the
  access walk, the inventories' bullets, the Impl column), People's qualification-expiring alert (a future window on an admitted
  dataset), the report engine's alert evaluation (one rule as its owner, a copy paused until activated) and its search mapping
  (moqui-core `search/mapping.rs`: a DataDocument field given by an expression is mapped as a number unless `fieldType` names
  another), §16's outputs against the screens. The code over the plan:
  - the pipeline document's derived `ownerPartyId`, `teamPartyId` and `stageLabel` were mapped as numbers, so a terms split on them
    answered no rows: the stalled-deal alert (split by owner, P19) could never fire and the pipeline dashboard's owner panel was
    empty. They are typed `keyword` now (SalesPipelineReportData.xml), with the new document's owner and team; a database made
    before reloads the document file and refreshes the index (mr-mantle `docs/Upgrading.md` "Sales' report datasets");
  - InsightsAlerts' list of shipped business templates had failed since P19 (it did not name `boss-sales-stalled-deals`); it names
    both Sales templates now;
  - §16: the change confirmation's mail existed (Customer Service's `send#OrderChangeConfirmation`) but refused Sales' change
    operator, who applies the change; it admits them now (below). The RFQ decline mail is P8's; the RFQ acknowledgement and the
    agreement print are not built (findings).
- Mantle:
  - The quote dataset (§4 Nov 14): `report/mantle-sales-quotes.json` (timed by `validThruDate`, business signal) over the document
    `MantleSalesQuote` (an OrderPart of an order of purpose `OrpSalesQuote`, so never a template: its vendor, customer, validity,
    total, the header's name, status, entry and placed dates, currency, grand total and purpose, its owner and team from the part's
    party rows), fed by the MantleSalesPipeline push feed, granted to ADMIN (`data/SalesPipelineReportData.xml`). Its row filter
    `SalesWorkspaceServices.get#QuoteRowFilter` (SalesWorkspace.js `quoteRowFilter`, `allow-remote="false"`), the ReportScopePolicy
    `MantleSalesQuoteScope` (`data/SalesWorkspaceData.xml`): purpose `OrpSalesQuote`, no `placedDate`, the organizations of the
    scope and, without SALES_TEAM_VIEW, the quotes assigned to the viewer or a team of theirs (SalesAccess `assignedQuoteOrderIds`);
    nothing for a non-reader, another userId refused. An approver's sight of a quote that asked them stays the quote's screen's,
    not the dataset's.
  - `OrderChanges.js` `confirm` and the change's `confirm` action: Sales' change operator (`SalesOrderChanges.js` mayApply,
    SALES_ORDER_CHANGE in the order's organization of their scope) sends the applied change's confirmation, as Customer Service's
    applier; another organization's change answers as missing. OrderChangeServices' description.
  - `docs/Upgrading.md` "Sales' report datasets (Sales P20, November 2026)".
- BOSS:
  - `report/boss-sales-quotes-expiring.json` (alert template "Quotes expiring": open quotes, Open, Being changed, Requested or
    Proposed, valid through `now` to `now+7d` as Home's counter, by owner, above 0; a manager's copy counts their organization's).
  - `data/BossSetupSalesData.xml` (a P20 block at the end): the dataset's artifact in BOSS_SAL_DATASETS (every Sales user and the
    Insights groups), its document for the same groups, admission, class (operations), readiness provider and index refresh.
  - Acceptance tests (written, not run): `test/acceptance/Sales/SalesTui.spec.js` and `SalesServerStatic.spec.js` (every screen file
    under `screen/Sales`, the eighteen Shared mounts and the tabs their menus show, 123 paths and four second records in tui, the
    plain-XML set in ServerStaticLib's check, as john.doe on the demo's Sales records and the orders, change, shipment, invoice and
    recurring base `SalesSpecLib.sweepOrders()` makes; Commons' Notifications under Approvals left out, it needs a message id), over
    SalesSpecLib's new `mountedScreens`, `mountTabs`, `sweepOrders`, `sweepRecords`, `sweepParameters` and `sweepExtras` (a P20 block
    at its end); `SalesLeadToInvoiceWalk.spec.js` (§14.3 scenario 12: a spec-local seller holding only SALES_VIEW, the opportunity,
    quote and send edits, from a lead through qualification, an RFQ, a quote under an approval rule decided by `sales.approver`, its
    send and acceptance to the order's approval; the shipment by Warehouse's users and the invoice it makes, the seller refused the
    shipment and the invoice and a spec-local billing reader seeing it); `SalesAccessWalk.spec.js` (each Sales group's user and
    `sales.rep3` of Ziziwork Sales refused the other organization's and other teams' leads, deals, quotes, RFQs and orders through 30
    routes and their CSV and print, Marketing's mount, the palette, choices, record checks and panels, Assist's seven tools, the
    Comms providers, the import, direct Mantle services, costs, finance and borrowed hold releases, with each record's owner as the
    control); `SalesHomeUsable` fixed (it expected the four opportunity tools among every `sales_` tool, stale since P10's quote
    tools).
  - Inventories: usl-inventory's 39 Sales rows with no Sales part filled (each naming the Sales screen and the Mantle Sales service
    the call goes through, or "—" with why) and the agreement and order-item rows corrected, with a header bullet; ss-inventory's
    118 Sales rows checked, three corrected (AgreementDetail's `AgreementEditForm`, QuoteRequestList's find, Customer360's Orders tab
    still read only), its Sales bullet completed.
  - design-sales: §2's Impl column names the phase that built each screen (built paths checked; PriceListDetail is at
    `Sales/Agreements/PriceLists/PriceListDetail` and PriceExplain at `Sales/Products/PriceExplain`), the later rows later, and a
    header line naming the eight built screens §2 does not list (LogNote, SendMessage, LogCall, OpportunityImport, QuoteSend,
    MergeCompare, Catalogue, Readiness). README's Sales paragraph.
- PASS: `test/acceptance/client/SalesPhonePages.spec.js` (written, not run: CustomerQuotes, CustomerQuote, QuoteResponse,
  CustomerOrders and CustomerOrder at 390 px, signed in and by a link, none scrolling sideways) with `test/acceptance/
  SalesPhoneFixtures.spec.js` (one more issued quote of the fixture's account, declined through its link) registered in
  `test/acceptance/client/suite.js`; README (the acceptance list) and `docs/Deployment.md` (a cancelled order's page).
- mr-moqui: `docs/security/Attack-Surface.md` checked against the code from Sales' quote lines through Sales' reports: added the quote
  dataset's row filter (and the stage-age dataset's), a paragraph on Sales' scope (the three reads, `SALES_ALL_ORGANIZATIONS`,
  assignment and team, records answering as missing), accounts and Commons' contact access, `merge#Parties`' guards, the lifecycle
  participant, Assist's Sales tools and the Comms hooks, and the change confirmation from Sales; follow-up 2's corrected text in the
  recurring orders paragraph (the lead's note). `plans/Remaining-Work.md`: a Sales row; the stale "Sales/Reports has no spec that
  renders it" removed from the IronStone row.
- Tests run (release binary, `--nobuild`, this worktree's runtime, after the merge): mr-mantle SalesQuoteDataset (new, 2 features,
  0.39 s), SalesPipelineDataset, SalesPipelineReports, SalesWorkspace, SalesRecurrence and SalesQuoteDrafts 23 of 23;
  SalesOrderChanges (the confirmation added to its first feature) and OrderChanges 9 of 9. mr-boss SalesQuoteAlert (new, 1
  feature, 0.15 s: sales.rep's copy evaluated as its owner fires with 1 for their quote valid through 3 days, not the one through 30;
  sales.rep2's copy has no series of it), SalesHome, SalesReportCatalog, InsightsDatasets, InsightsSettings, AdminRegistries,
  SalesSettings, InsightsDashboards, SalesRecurrence and SalesReports 38 of 38; InsightsAlerts and PeopleInsights 10 of 10;
  InsightsCatalog, InsightsAccess, SalesAccess, InsightsFlowMaps, InsightsHome and InsightsDelivery 49 of 49; SalesOrderChanges,
  SalesRecurrence and CustomerServiceOrderChanges 4 of 4. No screen changed, so no lint. Prettier on the new and changed
  JavaScript. Not run: ./moq test-apps, test-framework, the acceptance suite (the new and changed acceptance specs included).
- Findings, numbered by the lead F328 to F337 in order:
  - the RFQ acknowledgement and the agreement print of §16 (P20's list) are not built: the RFQ's decline mail is P8's, and
    AgreementDetail has no print or stored approved PDF (F257); a later row (§7) or a follow-up, for the lead or the user;
  - the pipeline document's derived owner, team and stage label were mapped as numbers from P6 on (fixed above): the stalled-deal
    alert never fired and the owner panel showed nothing; any other app's DataDocument with an expression field it splits or
    filters on as text has the same trap (not swept);
  - InsightsAlerts failed from P19 to here (fixed above): P19's runs did not include it;
  - Sales' record-lookup provider answers leads and opportunities only (SalesComms.js `lookup`), where design §1.4 also names
    quotes and orders; coverage, not a leak;
  - QuoteRequestDetail's "Create quote" (`template/SalesQuoteRequests.xml` rfqCreateQuote) passes no `salesOpportunityId`, so a quote
    made from an RFQ cannot carry its deal from the screen, though `create#QuoteFromRequest` takes one;
  - `ironstone.sales` Sales.js defines `recordKinds.orderChange` twice (P9's and P14's); the later silently replaces the first;
  - several native services the design has Sales call are not called: header, part, line, address and agreement price edits are
    written inside Sales' own services (update#Quote, store#QuoteLine, apply#OrderChange, store#AgreementItem); the inventories say
    so;
  - john.doe's Customer360 under Sales also offers Customer Service's tabs beside Sales' (Orders and SalesOrders, Agreements and
    SalesAgreements, Activities and ServiceActivities): probably ADMIN holding both apps' permissions, not checked with a plain
    Sales user;
  - `screen/Shared/Customer360/SalesOrders.xml`'s comment says the tab is SALES_TEAM_VIEW-only "until P11"; P11 did not widen it;
  - Marketing's public lead page (`PASS:Marketing/SubmitForm`, impl-marketing P13) is not built yet; the inventories say so.
- For the lead:
  - budget share: mr-mantle about 0.45 s (SalesQuoteDataset 0.39 s, SalesOrderChanges' added calls about 0.05 s); mr-boss server
    about 0.15 s (SalesQuoteAlert); mr-pass and client none;
  - merge hot spots: mr-mantle `data/SalesPipelineReportData.xml`, `service/mantle/sales/SalesWorkspace.js` and
    `SalesWorkspaceServices.xml` (a P20 block each), `data/SalesWorkspaceData.xml` (one enumeration), `service/mantle/order/
    OrderChanges.js` (`confirm`), `OrderChangeServices.xml`, `docs/Upgrading.md` (a section at the end); mr-boss
    `data/BossSetupSalesData.xml` (a P20 block at the end), `test/Sales/SalesSpecLib.js` (a P20 block at the end and its export
    line), `test/Insights/InsightsAlerts.spec.js`, `test/acceptance/Sales/SalesHomeUsable.spec.js`, `README.md`,
    `plan/design-sales.md` (§2 and the header), `plan/usl-inventory.md`, `plan/ss-inventory.md`; mr-pass `test/acceptance/client/
    suite.js`, `README.md`, `docs/Deployment.md`; mr-moqui `docs/security/Attack-Surface.md`, `plans/Remaining-Work.md`;
  - the gate 3 status line is not written: the RFQ acknowledgement and the agreement print (first finding) are on P20's list and not
    built. Once the lead moves them to §7 or a follow-up, the line can read: "Nov 14, 2026 — gate 3 built: P14–P20 (stage S3),
    commercial changes and the handoffs, agreements and customer prices, recurring orders, PASS Sales' orders, forecasts and
    targets, reports with Insights' registrations and the quote dataset, each phase reviewed by a fresh agent and merged on its
    focused specs, with follow-up 2 (recurring orders' invoicing, every line and retax), beside Marketing. The user's calls of the
    build are in §4. Sales' first release; the full suites and the acceptance tests run once at the end of the build.";
  - nothing else needs the user's call.

**Review Nov 14 (P20).** Master merged into the four worktrees first, both sides kept: mr-moqui `docs/security/Attack-Surface.md`
conflicted on the order-changes paragraph (P20's sentence on the change confirmation kept) beside Marketing P8's test message and P9's
release paragraphs (both kept, in master's order); mr-mantle and mr-boss took Marketing P9 cleanly; mr-pass had nothing. P20's specs
re-run on the merge before any change: SalesQuoteDataset, SalesPipelineDataset, SalesOrderChanges and OrderChanges 13 of 13.
- Checked and sound:
  - The quote dataset: `MantleSalesQuote` is an OrderPart of purpose `OrpSalesQuote` only (a template is left out by the document's
    condition and again by the filter), on the pipeline's push feed, granted to ADMIN in Mantle and to BOSS_SAL_DATASETS' groups in
    BOSS. `get#QuoteRowFilter` (`allow-remote="false"`) is computed for the signed-in viewer alone (another userId refused, nothing for
    an anonymous or non-Sales viewer), placed quotes out, the scope's organizations and, without SALES_TEAM_VIEW, the quotes assigned to
    the viewer or a team of theirs (SalesAccess `assignedQuoteOrderIds`, the rule of `quoteOf`); an approver's sight of a quote that
    asked them stays the quote's screen's, as the pipeline dataset leaves it (P6). Its fields are what a quote's reader already sees
    (totals in their currency; no cost); the owner and team are typed keyword. SalesQuoteDataset checks rep, team, manager, another
    organization, non-reader and another userId through the filter and the engine.
  - The quote-expiring alert evaluated as its owner (`evaluate#Alerts` one rule; SalesQuoteAlert: the owner's copy fires with 1 for the
    quote valid through 3 days and not the one through 30, another rep's copy has no series of it); open statuses only; a copy is
    paused until activated.
  - The pipeline document's keyword typing: the derived owner, team and stage label had been mapped as numbers (moqui-core
    `search/mapping.rs`), so P19's stalled-deal alert and the owner panel answered nothing; the Upgrading note reloads the document and
    refreshes both indexes.
  - `send#OrderChangeConfirmation` from Sales: the permission gate admits SALES_ORDER_CHANGE, then `mayConfirm` (Customer Service's
    ORDER_CHANGE_APPLY or SUPPORT_CASE_EDIT, else Sales' `mayApply`: the change operator in the seller's sales scope); a change of
    another organization answers RECORD_UNAVAILABLE as a missing one; the recipient rule, stored PDF and operation key unchanged.
    CustomerServiceOrderChanges and OrderChanges pass unchanged.
  - The acceptance tests (read, not run): the tui and server-static sweeps go through SalesSpecLib's route lists with no route
    fixtures, one per mode; the lead-to-invoice walk runs a spec-local seller with only the grants it needs; the access walk covers
    the organizations, teams, routes, CSV, print, palette, choices, panels, Assist tools, Comms providers, import, costs, finance and
    borrowed hold releases with each owner as the control; PASS's phone pages at 390 px with their fixture registered in the client
    suite.
  - Docs: Attack-Surface's Sales paragraphs against the code (the quote dataset, Sales' scope, accounts and Commons' contact access,
    `merge#Parties`, the lifecycle participant, Assist's tools, the Comms hooks, the change confirmation, follow-up 2's text) are
    accurate; Remaining-Work's Sales row, the READMEs (mr-boss's Sales paragraph, mr-pass's acceptance list and Deployment) and the
    inventories' Implemented-in columns match the code.
- Built in the review (the user's call, §4 Nov 14):
  - R1 (§16 RFQ acknowledgement): mr-mantle `SalesQuoteRequests.js` (a P20-review block after `quoteRequestFromEmail`) and
    `SalesQuoteServices.xml` (`create#QuoteRequestFromEmail` answers `acknowledgementDeliveryId`; new `build#QuoteRequestAcknowledgement`):
    off unless the organization's SalesPolicy has `rfqAcknowledge` Y (new SalesPolicy fields `rfqAcknowledge` and
    `rfqAcknowledgeTextLocation` in `SalesQuoteIssueEntities.xml`; `store#SalesPolicy` takes the flag; SalesDefaults' "Acknowledge a
    request for quote by mail"); a new mailed request whose sender matched a contact or account is acknowledged through the delivery
    ledger (`MdsrcSalesRfqAck`, `MANTLE_SALES_RFQ_ACK` in `SalesQuoteIssueData.xml`) as a transactional delivery naming the intake's
    organization, so its suppressions apply; at most once a request (the ledger key is the request); only to the mail's From address;
    never to automatic, list, bulk, system or own-mailbox mail (the mail client's automatic-reply rules), and marked
    `Auto-Submitted: auto-replied`; the attempt runs once the request commits; a failure to queue is logged, never the request's. The
    build renders the organization's stored `.html.fancy-locked` text (else Mantle's `template/order/SalesQuoteRequestAck`) with the
    explicit map {requestId, sellerName}, inside the quote mail's body template; the subject names the reference alone; it is
    suppressed once the request is gone or the organization turns the acknowledgement off. SalesQuoteRequests' new last feature: a
    policy without the flag sends none; turned on, one delivery of A, transactional, to the contact at the From address; the same mail
    again none; an automatic reply and an unknown sender none; the build has the reference and the seller and none of the request's
    text, and its attempt is handed off (not failed or suppressed).
  - R2 (§7, §16 agreement print): mr-mantle `SalesAgreements.js` `agreementPrint` and `get#SalesAgreementPrint`
    (`allow-remote="false"`, read-only): the agreement as it is now from its own records (header, parties, items with their negotiated
    prices, terms, text; marked a draft until active), for one who reads it (`agreementOf`; another organization's, a purchase
    agreement and a missing one RECORD_UNAVAILABLE alike), no cost, margin or linked orders, rendered by the new trusted
    `template/party/SalesAgreement.print.html.fancy` (Purchasing's agreement print's form, a seller's columns). mr-boss
    `template/SalesAgreements.xml` `salesAgreementPrint` (PDF through `xslFoTransform`, as the quote's print) and AgreementDetail's
    More › Print (PDF). SalesAgreements' new second feature: the reader's print has the agreement, customer, products, both negotiated
    prices and no draft mark, another organization's keeper is refused, and the one render to PDF starts `%PDF`.
  - R3 (low, trivial): `ironstone.sales` Sales.js defined `recordKinds.orderChange` twice (P9's Approvals destination silently
    replaced by P14's OrderChangeDetail); P9's removed, a comment kept. R4 (low, wording): Customer360's SalesOrders tab comment said
    SALES_TEAM_VIEW-only "until P11"; it stays so.
  - Docs: design-sales §5 (an as-built paragraph after QuoteRequestDetail's) and §7 (a Print bullet in P15's as-built), the inventory
    rows of the two new services, mr-mantle `docs/Upgrading.md` (a paragraph at the end of P20's section), Attack-Surface (below,
    committed in the mr-moqui worktree), Remaining-Work's Sales row (the print and the acknowledgement built; amendments' stored PDFs
    stay later), the gate 3 status line at the top and the §4 row.
- Findings, numbered by the lead F338 to F342 in order:
  - the RFQ acknowledgement answers only a sender matched to a contact or account of the organization (the ledger needs a recipient
    party, and an unknown From is the address a forged or bulk mail gives); a new prospect's first RFQ by mail gets none. A user's call
    if every sender should get one (it would need a recipient for an unknown address and a rate limit per address);
  - `get#QuoteRowFilter` does not repeat `quoteOf`'s customer-not-internal and first-part rules (a quote with an internal customer, or a
    second part, would be a dataset row its reader cannot open); `create#Quote` makes neither, so not reachable through Sales today;
  - Sales' change operator may send the confirmation of any applied change of an order of their sales scope, Customer Service's cancel
    and substitute kinds included (`mayApply` names no kind); it sends only the stored PDF to the customer's own addresses;
  - the access walk and the sweeps (acceptance, not run by the reviewer) do not cover the agreement print or the SalesDefaults field;
    SalesAccessWalk's print checks would take `Agreements/AgreementDetail/salesAgreementPrint` beside the quote's;
  - the Built note's findings stand otherwise (the record-lookup provider's leads and deals only, QuoteRequestDetail's Create quote
    without the deal, native services written inside Sales', john.doe's doubled Customer360 tabs, Marketing's public lead page).
- Tests (release binary, `--nobuild`, this worktree's runtime, after the merge and the fixes): mr-mantle SalesQuoteApprovals,
  SalesQuoteIssue, SalesQuoteRequests, SalesAgreements, SalesOrderChanges, OrderChanges, SalesQuoteDataset, SalesPipelineDataset,
  SalesPipelineReports, SalesWorkspace and DeliveryLedger 47 of 47 (67 s run, 30.4 s of features; the acknowledgement feature 0.5 to
  0.8 s, the print feature 0.8 s); mr-boss SalesAgreements, SalesApprovals, SalesSettings, SalesAccess, SalesOrderChanges,
  SalesQuoteAlert, SalesHome, InsightsAlerts, InsightsDatasets, CustomerServiceOrderChanges and SalesQuoteRequests 44 of 44 (43 s).
  `moqui lint --screens`: nothing in SalesDefaults, AgreementDetail or Customer360/SalesOrders. Prettier on the changed JavaScript.
  Not run: test-apps, test-framework, the acceptance suite.
- For the lead:
  - budget share: mr-mantle about 1.6 s more (the acknowledgement feature and the print feature, with its one PDF render); mr-boss
    none;
  - merge hot spots: mr-mantle `service/mantle/order/SalesQuoteRequests.js` (a block after `quoteRequestFromEmail`, the operations
    list), `SalesQuoteServices.xml`, `SalesApprovals.js` (`policyFields`, `flagFields`), `SalesApprovalServices.xml`,
    `entity/SalesQuoteIssueEntities.xml`, `data/SalesQuoteIssueData.xml`, `service/mantle/party/SalesAgreements.js` (before the
    operations), `SalesAgreementServices.xml`, `docs/Upgrading.md`, `test/order/SalesQuoteRequests.spec.js` (last feature),
    `test/party/SalesAgreements.spec.js` (second feature); mr-boss `screen/Sales/Settings/SalesDefaults.xml`,
    `screen/Shared/AgreementDetail.xml`, `template/SalesAgreements.xml`, `service/ironstone/sales/Sales.js`, `plan/design-sales.md`,
    `plan/usl-inventory.md`, this file's top, §4 and P20; mr-moqui `docs/security/Attack-Surface.md`, `plans/Remaining-Work.md`;
  - the user's call: whether an unknown sender's RFQ is acknowledged too (first provisional finding); nothing else;
  - Attack-Surface (committed in the mr-moqui worktree): the RFQ address sentence gains the acknowledgement (off unless the
    organization's SalesPolicy turns it on; transactional from the organization, its suppressions applied; once a request; only to a
    matched sender's From; never to automatic, list, bulk or system mail; marked an automatic reply; its locked text sees only the
    reference and the seller's name), and Sales' customer agreements gain the print (from its own records for its reader, missing
    otherwise, no cost or linked order).

### Follow-up 1 — a new record's organization default (F111)

**Built Nov 13 (follow-up 1).** mr-mantle and mr-boss on branch `fix/orgdefault` (hashes in the worker's reply); mr-moqui
unchanged, no Rust built. F111: a new record's organization defaults to the user's own when their scope holds its rollup children.
- Checked first (the code over the plan): P4's Review note R1 and SalesAccess.js `defaultOrganization`; get#PartyInternalOrgIds
  (a member's direct rollup children with OrgInternal join their userOrgIds, so a Retail user's scope is Retail and the Ziziwork
  Returns Center, BossWarehouseDemoData); each app's get#SharedContext and scope (Maintenance's MaintenanceAccess, People's
  employers, Warehouse's, Manufacturing's and Purchasing's members, Accounting's AccountingPolicy); a search of mr-boss and
  mr-mantle for "the scope's only one" (`organizationPartyIds.length == 1 ? ...[0]`) and "the scope's first" (`[0]`).
- Built: the rule is Mantle's, `FacilityScope.js defaultOrganization(scope)` beside `scope()` and `owns()`: from any app's scope
  ({activeOrganizationPartyId, organizationPartyIds, null for every one; partyId, the user's when absent}) the active one, else
  the scope's only one, else the only one of the scope the user works for as a current agent or employee (with every organization,
  an internal one); null when that leaves a choice. SalesAccess `defaultOrganization` now calls it (the same rule as P4's, moved).
  Maintenance's, People's, Warehouse's, Manufacturing's and Purchasing's get#SharedContext answer `defaultOrganizationPartyId` from
  their own scope (People's: the employers; a self-service context null), and the new-record defaults read it: Maintenance
  Procedures, Equipment and Facilities (Find), Warehouse PoolList and WarehouseFacilityParts' NewFacility, Shared
  InspectionTemplates (Warehouse's, Manufacturing's or Purchasing's context), People Training, ReviewCycles, HolidayCalendars,
  LeavePolicies, WorkingSchedules, Positions and Openings. Two services had the same fallback and use the rule: Mantle
  MaintenanceProcedures' create with no organization, and Warehouse Reports' InventoryValuation organization. Sales' settings
  screens (Teams, Stages, LeadSources, TypesAndReasons) take `sales.defaultOrganizationPartyId`, then the scope's first as
  before, since TypesAndReasons has no organization choice.
- Tests (release binary, `--nobuild`, this worktree's runtime): mr-boss MaintenanceAccess (the planner's default is Services,
  Retail's planner's Retail with the returns center in their scope), PeopleAccess (the HR officer's default employer is Retail,
  the returns center in scope) and WarehouseAccess (the reader's default is Retail, the returns center in scope), each check added
  to the context feature; the field is new, so each fails on the unfixed code (not run there). With SalesAccess,
  SalesOpportunities, SalesSettings, SalesAccounts, MaintenanceProcedures, MaintenanceEquipment, PeopleTraining, PeopleReviews,
  PeopleLeave, PeopleSchedules, PeoplePositions, PeopleRecruiting, WarehouseReports, WarehouseInspections, WarehousePolicies,
  WarehouseFacilities, ManufacturingAccess and PurchasingAccess: 135 of 135 and the three access specs 52 of 52; mr-mantle
  SalesOpportunities (its rollup-child case now through the moved rule), SalesAccounts, SalesPipelineSetup, MaintenanceProcesses,
  MaintenanceScope and WarehouseFacilities 44 of 44. MaintenanceAccess once read 17.2 s run beside two other specs while another
  worker's tests ran, and 10.7 s of features (42 s with its setup) alone and under the 15 s budget on the rerun; its added check is
  one context call (about 0.05 s). `moqui lint --screens` (release): no flagged site in a changed screen. Prettier: no new issue
  in the changed JavaScript (several of the files were not clean before and are left so). Not run: ./moq test-apps, the
  acceptance suite.
- Findings, numbered by the lead F126 to F128 in order:
  - Accounting's root sets its working organization by the active one else the scope's only one (Accounting.xml, and
    AccountingPolicy `scope()` in the services), so an accountant of Retail has none chosen; there it is a read filter too (no
    organization reads every one allowed), so defaulting it to the user's own would narrow their lists and reports. Left as is;
    the user's call whether Accounting defaults it (or gives new-record forms a default of their own);
  - Insights' report organization (Insights.js) has the same "active, else the only one" fallback for a report's organization;
    left, as a report choice rather than a new record's;
  - "the scope's first" stays in other apps' new-record defaults and services (Purchasing's new orders, bills, quotes, requests
    and agreements, Products' new categories, features and owners, Prices, People ChecklistTemplates, Maintenance WorkPolicy,
    CustomerService SavedReplies and Cases, the DataImport contexts, Mantle's catalog and price policies): the first of
    get#PartyInternalOrgIds' list is the user's own organization before its children, so the rollup case gives the right one
    there; a user of two organizations of their own gets the first rather than an empty field. Moving them to the rule (with the
    first as the fallback, as Sales' settings now do) is a consistency change, not this fix.
- For the lead: budget share about +0.1 s mr-boss server (three context calls), none in mr-mantle. Merge hot spots: mr-mantle
  `SalesAccess.js` (`defaultOrganization`'s body replaced by the call; P5 edits the file) and `FacilityScope.js` (the new
  function and its export); mr-boss `screen/Sales/Settings/{Teams,Stages,LeadSources,TypesAndReasons}.xml` (one line each), the
  five apps' get#SharedContext out-parameters and sharedContext returns (`Maintenance.js`, `People.js`, `Warehouse.js`,
  `Manufacturing.js`, `Purchasing.js`), and the three access specs. Sales.js and Sales' ContextServices.xml are unchanged. The
  Accounting finding needs the user's call.

**Review 2026-11-13 (follow-up org default).** Reviewed `fix/orgdefault` in mr-mantle and mr-boss against F111, P4's Review R1,
§2 and the apps' scopes; no fix was needed, so the branch has no review commit.
- Checked and sound:
  - The rule never answers outside the scope it is given. The active organization comes first, as each app's screens already
    did. Otherwise the answer is the scope's only one, or a `toPartyId` of the user's own current PrtAgent/PrtEmployee rows
    with `toPartyId in` the scope's ids. Only when the ids are null (every organization: Maintenance's MAINTENANCE_ALL_ORGANIZATIONS)
    is it an OrgInternal one, which that scope covers. The `partyId` fallback is the current user's own. Its disableAuthz read
    is of the user's own relationships, and it only picks one id of the scope, so it widens nothing.
  - Every app passes its own scope. Maintenance passes MaintenanceAccess' scope, People its employers, and Warehouse,
    Manufacturing and Purchasing their members (`userOrgIds`). Warehouse Reports passes the members, MaintenanceProcedures
    Mantle's maintenance scope, and Sales its own (`Sales.js` unchanged). People's self-service context answers null.
    Warehouse's write owners (filterOrgIds kept to the members) can be narrower than its members only while an organization
    is active, and then the active one answers first. Purchasing's administrator with an active non-member organization gets
    that one, the same as its `ownerIds`.
  - Every changed default is still only a form value, and its submit still checks the organization in the service.
    storeProcess still runs `requireOrganization` after the new fallback. The equipment, facility, pool, template and People
    stores are unchanged. InventoryValuation still goes through Mantle's ACCOUNTING_VIEW check, and the organization it
    defaults to is one of the user's members.
  - SalesAccess' `defaultOrganization` is a one-line delegation, the P4 rule moved unchanged: `isInternal` stays exported and
    used, and the only new behaviour is the `ec.user` partyId fallback. P5 is now merged into master. Both repositories'
    branches merge into master without conflict (`git merge-tree`); nothing was reconciled.
  - The worker's judgment calls are right:
    - Accounting's `organizationPartyId` (Accounting.xml) is the whole app's read filter, and none means every organization
      allowed. Defaulting it to the user's own would quietly drop the rollup child from an accountant's lists and reports,
      so leaving it is correct. A default for Accounting's own new-record forms is a separate, later choice.
    - Insights' organization is a report's, not a new record's.
    - "The scope's first" (Purchasing, Products, Commerce, CustomerService, Prices) always answers an organization of the
      scope and is checked on submit. For a single-employer user it equals the rule's answer, because get#PartyInternalOrgIds
      appends a member's rollup children after the member. It differs only for a user of two organizations of their own,
      who gets one pre-chosen instead of an empty field. It is not a security matter; the inconsistency is below.
- Fixed: none.
- Finding, numbered by the lead F129:
  - Low: Purchasing's get#SharedContext now answers `defaultOrganizationPartyId`, but only Shared InspectionTemplates reads it.
    Purchasing's own New forms (NewPurchaseOrder, NewQuoteRequest, NewPurchaseRequest, PurchaseOrders, BillList, Quotes,
    QuoteRequests, PurchaseRequests, AgreementList, SupplierList, MatchExceptions; Suppliers/Settings/Approvals.js) still take
    "active, else the first". The first is the first row of an unordered PartyRelationship find that also counts PrtMember
    rows, so for a user of several organizations it is not stable. When these move to the rule, put it ahead of the first,
    as Sales' settings screens do; Products, Commerce and CustomerService the same.
- Tests (release binary, `--nobuild`, this worktree's runtime):
  - The new checks fail on the unfixed rule. With FacilityScope's `defaultOrganization` cut back to master's rule (active,
    else only; restored after), each one fails on its own message:
    - MaintenanceAccess: "Retail's planner's default organization: null of ORG_ZIZI_RETAIL,BOSS_WH_RETURNS".
    - PeopleAccess: "the HR officer's default employer: null".
    - WarehouseAccess: "warehouse.read's default organization: null of ORG_ZIZI_RETAIL,BOSS_WH_RETURNS".
  - With the fix all three pass.
  - MaintenanceAccess timing (28 features). Summed feature time, run alone:
    - Load about 9.5: 14.0 s, and 15.43 s once (over budget). Its first feature took 0.67 to 0.72 s against master's 0.55 s.
    - Load about 6: 9.9 and 9.8 s, against master's spec at 10.6 and 10.7 s on the same runtime.
    - The added check is one context call (about 0.1 to 0.15 s). The overrun is the machine's load on a spec that is about
      10 s alone, so the check stays where it is.
  - mr-mantle SalesAccounts, SalesOpportunities, SalesPipelineSetup, MaintenanceProcesses, MaintenanceScope and
    WarehouseFacilities: 44 of 44 (38 s).
  - mr-boss WarehouseAccess, PeopleAccess, SalesAccounts, SalesOpportunities, WarehouseReports and WarehouseFacilities:
    64 of 64 (38 s).
  - Not run: ./moq test-apps, the acceptance suite, lint (no screen touched in review).
- For the lead:
  - Budget share: as the Follow-up note says, about +0.1 to 0.15 s for mr-boss in MaintenanceAccess. MaintenanceAccess
    sits about 10 s alone, but crossed 15 s at load ≈ 9.5 with or without this check. Splitting it is worth considering
    apart from this fix.
  - Merge hot spots: as the Follow-up note says. sal/p5 is already in master and both repositories' branches merge cleanly.
  - The user's call: Accounting's working-organization default (unchanged here).

### Follow-up 2 — recurring orders' invoicing, lines and tax

**Built Nov 14 (follow-up 2).** mr-mantle and mr-boss on branch `sal/fix2` (hashes in the worker's reply); mr-moqui and mr-pass
unchanged, no Rust built. The user's two calls of Nov 14 (§4, P16's review; F299, F300): a native recurring order generated without a
payment is invoiced when a person approves it, as its base's auto-invoice asks; a base copies the source's charge and discount lines
with its products, and tax is computed on each generated order when it is placed.
- Checked first (the code over the plan): P16's Built and Review notes, F290 to F303, §4's two Nov 14 rows; the worker
  (OrderServices.xml `clone#Order`, `create#RecurringOrder`), `handle#OrderItemChange` and `handle#OrderMajorChange` (X1's storeless
  step, the store's promotions, shipping and tax), TaxServices `calculate#OrderSalesTax` and SalesTax.js `order`, Shop's base and
  renewal (ShopSubscriptions.js `makeBase`, `prepareStep`) and its invoicing (ShopFulfillment.secas.xml, ShopFulfillment.js,
  Payables.js `fulfillmentInvoice`), the other `clone#Order` callers with `productItemsOnly: false` (SalesQuoteTemplates.js,
  SalesQuoteIssues.js `cloneQuote`, SalesOrders.js `cloneOrder`) and Accounting's Recurring invoices (Collections.js). The code over
  the plan:
  - F300's "nothing computes tax at placement" holds only for the source's other lines: a generated order of a storeless seller with
    a gateway was already taxed while it was cloned (OrderOpen; each copied line's `handle#OrderItemChange` runs X1's step), on its
    product lines alone; a store base's order the same way, by the store's path. What was missing was the lines, so tax is now figured
    on every line the order repeats;
  - `clone#Order` copied a child line's `parentItemSeqId` as it was, while the copy's line ids are sequenced afresh: the source's ids
    have gaps (each retax deletes and adds tax lines), so a discount or tax line of a copy could name the wrong parent. With
    `productItemsOnly: false` a child now keeps its own parent (the source's id mapped to the copy's); the default, product lines only
    (Shop's base and renewals, Commerce's reorder, the native worker's legacy bases), is unchanged. Sales' quote and order clones and
    template successors, which copy every line, get the right parents too;
  - "the same path Shop's renewals use": Shop invoices a renewal through Accounting's `create#FulfillmentInvoice` (the internal split
    of `create#InvoiceFromSource`: the ordered basis, a recurring base or template refused, one invoice for a source, no user
    permission asked), from a tx-commit rule on the order's approval; follow-up 2 uses both the same way. The worker's own branch that
    billed with `create#EntireOrderPartInvoice` only a part approved at placement is replaced by that one path, so an automatic and a
    person's approval bill the same way;
  - Accounting's Recurring invoices said "Invoiced on approval" for auto-invoice (now true) and "Not invoiced" otherwise, which
    misstated two cases: a base without auto-invoice has its orders invoiced as any order, by a person ("Not invoiced automatically"),
    and a Shop contract's base has its renewals invoiced by the store with their payment ("Invoiced by the store at renewal").
- Mantle:
  - `service/mantle/order/OrderServices.xml`: `clone#Order` keeps a child line under its own parent when every line is copied;
    `create#RecurringOrder`, for a Sales base (marked `OrpRecurringTemplate`), copies every line of the base (`productItemsOnly:
    false`) and retaxes the order before `place#Order` through `handle#OrderMajorChange` for each part (a storeless seller with a
    gateway: X1's `calculate#OrderSalesTax`, which replaces the copied tax lines; a store order: the store's promotions, shipping and
    tax; a storeless seller with no gateway: the copied lines as they are, its own); a base not marked (made recurring before Sales
    and never edited there) repeats its product lines as before; the auto-invoice branch removed; its description.
  - `service/mantle/order/SalesRecurrence.js`: `makeBase` copies every line of the source (`productItemsOnly: false`; the base keeps
    the source's tax lines for its amount, figured again on each order made); `invoiceRecurringOrder` (below); the header comment.
  - `service/mantle/order/SalesRecurrenceServices.xml`: `invoice#RecurringOrder` (new, `authenticate="anonymous-all"`,
    `allow-remote="false"`): an order the worker made for an occurrence (`recurOccurrenceDate`, a parent, no purpose) of a base whose
    auto-invoice is on and that is no Shop contract's has each approved sale part with nothing billed yet invoiced through
    `create#FulfillmentInvoice`, each part in its own transaction; any other order returns at once; a part that cannot be billed is
    logged naming the base and the order and never fails the approval. `store#SalesRecurrence`'s description.
  - `service/SalesRecurrence.secas.xml` (new): `SalesRecurrenceApprovedInvoice`, on `update#mantle.order.OrderHeader` at tx-commit
    when the status changes to OrderApproved, calls `invoice#RecurringOrder` in a transaction of its own, ignoring its errors (as
    Sales' storeless confirmation and Shop's fulfillment are run).
- BOSS: `service/ironstone/accounting/Collections.js` (Recurring invoices' recurring orders: the Invoice column's three texts, a Shop
  contract's base read in one query). No screen changed (RecurringOrders' "Bill each order once it is approved" now holds as written).
- Specs: Mantle `test/order/SalesRecurrence` gains a feature (6 features, about 2.8 to 3.3 s; the feature about 0.6 s): an approved
  storeless order of C (its seller's gateway, a spec-local Utah rate of 6 %) with a product line, a shipping charge and a discount of
  the product line, made a monthly base with auto-invoice by C's keeper with the finance right; the base holds the product, the
  charge and the discount, the discount and each tax line under their own lines; with the rate raised to 7 % the order made holds the
  same lines, two tax lines under its product and shipping lines, a tax larger than the source's (figured then, not copied), its total
  the lines' and placed with nothing billed; approved by a person, its lines are billed on one invoice (the approval's tx-commit rule,
  waited for), and a second `invoice#RecurringOrder` bills nothing more; a base without auto-invoice (feature 4's third) bills nothing
  when its order is approved. The base's lines and the billing each fail on the unfixed code (run there: the base held only
  "ItemProduct"; with the invoice service absent, nothing billed).
- Tests run (release binary, `--nobuild`, this worktree's runtime): mr-mantle SalesRecurrence, OrderLifecycle, SalesQuoteTemplates,
  ShopSubscriptions, Subscriptions, SalesQuoteDrafts, SalesOrderApproval, StorelessOrderTax, StorelessOrderConfirmation,
  StoreOperations, OrderToCashBasicFlow, ShopCheckout, DropShip, OrderChanges and SalesOrderChanges 120 of 120 (17 specs with
  dependencies, 34 s of features); SalesPortal and ShopOperations with SalesRecurrence again 23 of 23. mr-boss SalesRecurrence,
  AccountingCollections, CommerceSubscriptions, SalesQuotes, SalesOrders and AccountingAccess 22 of 22 (12.9 s). mr-pass
  ShopSubscriptions and ShopCheckout 6 of 6 (master's mr-pass against this branch's mr-mantle). Shop's renewals and Commerce's specs
  pass unchanged. Prettier clean on the changed JavaScript. No screen changed, so no screen lint. Not run: ./moq test-apps,
  test-framework, the acceptance suite (no acceptance test changed).
- Inventories and design: usl-inventory's "Added in the Sales build: recurring orders and subscriptions" table gains
  `invoice#RecurringOrder`; design-sales §7 "As built (impl-sales P16)" says what follow-up 2 changed.
- Findings, numbered by the lead F319 to F324 in order:
  - the invoice is left as `create#EntireOrderPartInvoice` makes it (InvoiceInProcess), as Accounting's Invoice from order and the
    worker's old branch left it; Shop finalizes its renewal's invoice after the capture, a native renewal's waits for Accounting to
    finalize it with its other drafts;
  - the trigger is the order header's approval; a generated order of several parts approved part by part (a credit hold on one part)
    is billed for the parts approved when the header becomes approved, and a part approved later only by Accounting's Invoice from
    order (`invoice#RecurringOrder` is internal); Sales' bases repeat one-part orders in practice;
  - an order whose header returns to Approved (`checkStillComplete` after a return) runs the rule again, which bills nothing (a part
    already billed is skipped, and `create#FulfillmentInvoice` keeps one invoice for a source);
  - a base made in P16 holds product lines only; it repeats them as before until it is made again from its source (editing its
    schedule does not copy lines);
  - a storeless seller with no tax gateway: its generated orders repeat the source's tax lines as they were entered (nothing
    recomputes them, as X1 leaves such an order untouched); a store with no tax gateway drops them, as the store's own path does;
  - a generated order the gateway cannot tax (TAX_ADDRESS_MISSING, TAX_RATE_MISSING) now fails its occurrence with that reason, kept
    on the base as "Last run failed"; before, X1's step during the clone would have refused it the same way.
- For the lead:
  - budget share: mr-mantle about +0.6 s (SalesRecurrence's sixth feature); mr-boss none; client none;
  - merge hot spots (Sales P19 and Marketing P9 in parallel): mr-mantle `service/mantle/order/OrderServices.xml` (`clone#Order`'s
    item loop, `create#RecurringOrder`), `service/mantle/order/SalesRecurrence.js` (header comment, `makeBase`, a block before
    `services`), `service/mantle/order/SalesRecurrenceServices.xml` (a service at the end), `test/order/SalesRecurrence.spec.js` (setup
    and a feature at the end); new `service/SalesRecurrence.secas.xml`; mr-boss `service/ironstone/accounting/Collections.js` (the
    recurring orders' rows), `plan/design-sales.md` §7, `plan/usl-inventory.md` (one row), this section;
  - Attack-Surface correction (mr-moqui `docs/security/Attack-Surface.md`, Sales' recurring orders paragraph as P16's review gave
    it): replace "copied with no payment and no purpose and placed through `place#Order` (so it is approved as any sales order of the
    seller, never on a copied payment), and fails an occurrence whose agreement no longer applies." with "copied with no payment and
    no purpose, every line of the base with each child line under its own parent, retaxed by its own path (its seller's gateway or
    its store's) and placed through `place#Order` (so it is approved as any sales order of the seller, never on a copied payment),
    and fails an occurrence whose agreement no longer applies. `invoice#RecurringOrder` (`authenticate="anonymous-all"`, internal,
    run only by the `SalesRecurrenceApprovedInvoice` tx-commit rule on an order's approval) bills, through `create#FulfillmentInvoice`
    and once, only an order the worker made for an occurrence of a base whose auto-invoice (turned on only with `RECEIVABLE_EDIT`) is
    on and that no Shop contract renews; it reads only the records.";
  - nothing needs the user's call.

**Review Nov 14 (follow-up 2).** Master (Sales P19) merged into both repositories' `sal/fix2` first, cleanly; the specs re-run on
the merge.
- Checked and sound:
  - `invoice#RecurringOrder` is reached only from the `SalesRecurrenceApprovedInvoice` tx-commit rule (`allow-remote="false"`, no
    screen, REST or Assist mount) and reads only the records. It bills only an order with a parent, no purpose and a
    `recurOccurrenceDate`, which only `create#RecurringOrder` sets (`clone#Order` clears it and every recurrence field, so a Commerce
    reorder, a Sales or Purchasing copy, a Customer Service replacement or a Shop renewal never carries it), of a base with
    `recurAutoInvoice` Y and a cron and no `StoreRecurringContract`; a normal sales order, a Shop renewal (no occurrence date, and its
    base has a contract), a Commerce order and a replacement return at once. Billing goes through `create#FulfillmentInvoice`
    (refuses a base or quote template, keeps one invoice per source key); a re-approval (hold and release, `checkStillComplete`)
    finds the part billed and bills nothing, and an invoice cancelled later keeps its billing rows, so a re-approval does not bill
    again.
  - `clone#Order`'s parent mapping applies only with `productItemsOnly: false`; the default path copies `parentItemSeqId` as before
    (Shop's base and renewals, Commerce's reorder, a legacy base). Sales' quote, order and template copies and Purchasing's copy, which
    copy every line, get correct parents; their specs pass unchanged.
  - Retax at placement: `handle#OrderMajorChange` runs on the open order before `place#Order`, so neither path's status guard skips
    it; a storeless seller with a gateway replaces the copied tax lines (X1), a store order deletes and refigures promotions, shipping
    and tax, a storeless seller with no gateway keeps the copied lines. A tax error stops `create#RecurringOrder`, whose own
    transaction rolls back; `runOccurrence` records it on the base and the job goes on to the next base.
  - Accounting's Recurring invoices' three texts are right for each kind of base; the Shop-contract read is one `in` query.
- Fixed:
  - R1 (medium, mr-mantle `SalesRecurrence.js` `invoiceRecurringOrder`): "exactly once" did not hold under concurrency. The rule runs
    on service workers after the commit, and the part's status and billing were read outside the transaction that billed it, with
    nothing locked; `create#FulfillmentInvoice` checks its source key unlocked too. Two approvals' rules at once (two approvals
    racing, or a re-approval while the first rule is still running) could both find nothing billed and make two invoices. Each part
    is now billed in a `runRequireNew` transaction that locks the `OrderPart` (`forUpdate`), reads its status and billing again, and
    invoices in that same transaction, as Shop's invoice step locks its fulfillment rows. A part must also be one the worker copied (the
    base's part of the same id and seller), so an order pointed at a base by other means bills nothing.
  - R2 (low, mr-mantle `OrderServices.xml` `clone#Order`): the line-id map was `globalThis.copiedSeqIds`, a global of the script
    realm, shared by every later script in it. It is now a `const` local of the service's action block.
  - R3 (low, test): the follow-up's spec did not check a retax failure. SalesRecurrence's sixth feature now makes a second
    auto-invoiced base of C, ends the gateway's rate and runs the job: the occurrence fails with TAX_RATE_MISSING, kept on the base
    (`recurFailureDate`, the message), and no order is made. This guards the behavior; it would pass on the worker's code too.
    R1 has no spec of its own (two workers at once cannot be driven from a spec); the single-approval billing and the second
    `invoice#RecurringOrder` that bills nothing still pass.
- Findings, numbered by the lead F325 to F327 in order:
  - R1 above (medium): a recurring order could be invoiced twice when two approvals' tx-commit rules ran at once; fixed.
  - A legacy base (made recurring before Sales, not marked `OrpRecurringTemplate`) with `recurAutoInvoice` Y is billed on approval
    too. Before, it was billed only when approved at placement, which never happened with no payment copied. That matches §4's call
    ("a native recurring order"), but its auto-invoice may have been set through Mantle's `update#OrderRecur`, without Sales'
    `RECEIVABLE_EDIT` check.
  - `clone#Order` maps a child's parent only when the parent's id sorts before it, which is how Mantle creates lines. A child listed
    before its parent keeps the source's id, as every child did before.
- Tests run (release binary, `--nobuild`, this worktree's runtime, after the merge and the fixes):
  - mr-mantle SalesRecurrence: 6 of 6. The sixth feature takes 1.38 s (the worker's was about 0.6 s; R3 adds about 0.8 s).
  - mr-mantle SalesRecurrence, OrderLifecycle, SalesQuoteTemplates, SalesQuoteIssue, SalesQuoteDrafts, SalesOrderChanges,
    SalesOrderApproval, StorelessOrderTax, StorelessOrderConfirmation, StoreOperations, OrderToCashBasicFlow, ShopCheckout,
    ShopOperations, ShopSubscriptions, Subscriptions, PurchaseOrders, OrderChanges, ReturnToResponseBasicFlow, ReturnPolicies and
    SalesPortal: 160 of 160 (23 specs with their dependencies, 58.2 s of features).
  - mr-boss SalesRecurrence, AccountingCollections, CommerceSubscriptions, SalesQuotes, SalesQuoteTemplates, SalesOrders,
    SalesOrderChanges, AccountingAccess, CustomerServiceFeedback, PurchasingOrders and PurchasingReturns: 35 of 35 (22.3 s).
  - mr-pass ShopSubscriptions and ShopCheckout: 6 of 6 (master's mr-pass).
  - Prettier is clean on the changed JavaScript. No screen changed. Not run: test-apps, test-framework, the acceptance suite.
- For the lead:
  - Budget share: mr-mantle about +1.4 s in all (SalesRecurrence's sixth feature, 1.38 s); mr-boss and client none.
  - Merge hot spots: as the Built note says, plus `invoiceRecurringOrder`'s part loop and the sixth feature's added check.
  - Attack-Surface correction: the worker's text is right except in three places. Every line is repeated only for a Sales base, not
    a legacy one. A retax failure also fails the occurrence. The billing is per part, under the part's lock (R1). Replace "copied with
    no payment and no purpose and placed through `place#Order` (so it is approved as any sales order of the seller, never on a copied
    payment), and fails an occurrence whose agreement no longer applies." with "copied with no payment and no purpose (a Sales
    base's every line, each child line under its own parent, retaxed by its own path, its seller's gateway or its store's; a base
    made recurring before Sales its product lines) and placed through `place#Order` (so it is approved as any sales order of the
    seller, never on a copied payment), and fails an occurrence whose agreement no longer applies or that cannot be taxed.
    `invoice#RecurringOrder` (`authenticate="anonymous-all"`, internal, run only by the `SalesRecurrenceApprovedInvoice` tx-commit
    rule on an order's approval) reads only the records and bills, through `create#FulfillmentInvoice` and once (each part under its
    lock), only an approved part of the base's seller of an order the worker made for an occurrence of a base whose auto-invoice is
    on and that no Shop contract renews."
  - Nothing needs the user's call.

### Follow-up 3 — SalesOrderApproval's batch flake (F210) and MaintenanceAccess's split

**Built Nov 14 (follow-up 3).** mr-mantle and mr-boss on branch `sal/fix3` (hashes in the worker's reply); mr-moqui unchanged, no
Rust built. A test-stability fix, no product code changed.
- Checked first (the code over the plan): P11's Review note (the batch feature's one failure, successCount 1, no cause found) and
  F210; `SalesOrders.js` `applyBatch` (each order through `approve#SalesOrder` at the revision of its key, `requireRevision`), the
  `OrderPlacedSalesConfirmation` rule (`SalesOrder.secas.xml`, at tx-commit), `register_tx_rules` in moqui-core `service/call.rs`
  (tx-commit rules run on a service worker after the commit, not in the caller's thread), `buildConfirmation` and
  `OrderConfirmations.js` `storeAsSystem` (the stored confirmation, an OrderContent of OctOrderConfirmation), and Order.eecas.xml
  `OrderContentRevision` with `increment#OrderRevision` (a content change counts a revision unless the seller counts commercial
  changes only; the fixtures' B and C count every change, A commercial ones only).
- The cause: a storeless direct order's placement queues its confirmation on a service worker, whose build stores the confirmation
  as an OrderContent and so raises the order's revision by one a moment after `place#SalesOrder` returns. The batch feature places
  two orders of B and then reads their revisions for the batch keys; when the worker is late (its pool busy with the other specs of
  a run, or a cold first run), a key carries the revision from before the confirmation and `approve#SalesOrder` refuses that order
  REVISION_CHANGED, so successCount is 1. A probe shows it even alone: the second order's revision read 3 just before the batch and 4
  once the worker pool was drained. No shared demo data, credit limit, open-order total, ID prefix, ordering or clock was involved
  (the spec's organizations, accounts and credit policies are its own, prefix SOA). Not a product bug: a revision that moves when
  the confirmation is stored is the revision rule as built (§2), and a person who acts on a stale revision is asked to reload.
- Built: `test/order/SalesOrderApproval.spec.js` gains `confirmed(orderId)`, which waits (up to 10 s, then fails naming the order)
  for that order's own stored confirmation before the batch feature reads its revisions; it does not wait for the shared worker pool
  to empty, which other specs keep busy. Only the batch feature uses it: feature 1's orders are A's (content not counted) or
  approved through the native `approve#Order` with no revision, and feature 2's storeless orders have no Sales purpose (no
  confirmation). No `dependsOn` is needed; the spec reads no other spec's data.
- MaintenanceAccess (mr-boss): one spec of 28 features, 10.3 s of feature time and 12.2 s of spec time alone, 17.2 s beside
  MaintenanceWorkOrders, MaintenanceScheduling and MaintenanceRequests on `--workers 4`, where the run failed it ("regression specs
  over 15 seconds"). Split along its features, none deleted: `MaintenanceAccess` keeps the app's own access (context and refusals,
  menu, keys, palette and launcher, each group's capabilities, the Retail and Services isolation of the context services, the root
  grant, the shared device and record panels, Home and Settings, Admin's registries, team defaults, custom groups: 10 features), and
  the new `test/Maintenance/MaintenanceRecordAccess.spec.js` holds each later phase's record rules (equipment write, work order,
  request and Report a problem, procedure, outage, part issue, preventive plan, booking policy and requests, generation and
  compliance, checklist, purchases, stack providers, import and readiness, customer repair, a chat message's report, costs, work
  status and reports: 18 features), with the helpers they use (`screenRefusalIn`, `shellData`, `quickCreates`, `deviceRequest`)
  and no spec state. The headers say which spec a later phase's case goes in; the regression specs whose headers named
  MaintenanceAccess for a record rule (Costs, Equipment, Parts, Plans, Reports, Requests, Settings, Stack) name MaintenanceRecordAccess.
  The acceptance specs' header mentions are left as they are.
- Tests run (release binary, `--nobuild`, this worktree's runtime): mr-mantle SalesOrderApproval 4 of 4 alone three times (spec
  feature time 3.5 to 5.8 s; the batch feature 0.9 to 1.3 s), and beside StorelessOrderConfirmation, ShopCheckout, StoreOperations,
  SalesQuoteResponse, SalesPortal, OrderLifecycle, OrderToCashBasicFlow, DeliveryLedger and StoreCheckout (12 specs with
  dependencies) 88 of 88 serially and 88 of 88 on `--workers 4`. Before the fix the set passed twice serially too: the failure is a
  race, so the probe above stands for its reproduction. mr-boss MaintenanceAccess and MaintenanceRecordAccess 28 of 28 three times
  (spec time 4.8 to 5.4 s and 6.0 to 6.9 s), and beside MaintenanceWorkOrders, MaintenanceScheduling and MaintenanceRequests on
  `--workers 4` 44 of 44 (6.4 s and 9.0 s, no spec over 15 s). The eight specs with only a header line changed once: 30 of 31,
  MaintenancePlans' "Due maintenance offers November's filter change ..." failing on `report.output.includes("33.3% on time")`; it
  fails alone and with the spec as on master (this branch's base, unchanged), so it is not this change's (below). Prettier clean on
  the changed JavaScript. No screen changed. Not run: ./moq test-apps, test-framework, the acceptance suite.
- Findings, numbered by the lead F343 to F344 in order:
  - SalesOrderApproval's batch flake (F210) was the confirmation's revision raised after placement on a service worker; fixed in the
    spec. Other specs that place a storeless direct order of a seller counting every change and then act on its revision at once
    have the same race; none was seen failing;
  - MaintenancePlans' P14 feature fails on master's mr-boss with this worktree's runtime ("33.3% on time" not in the Preventive
    compliance report), alone as well; not looked into here (out of scope).
- For the lead:
  - Budget share: mr-mantle unchanged within noise (the wait is the confirmation's own time, usually milliseconds); mr-boss
    unchanged (the same 28 features, now in two specs).
  - Merge hot spots: mr-mantle `test/order/SalesOrderApproval.spec.js` (the batch feature's first lines); mr-boss
    `test/Maintenance/MaintenanceAccess.spec.js` (a Maintenance or Marketing phase adding an access case there must put a record's
    rule in MaintenanceRecordAccess instead) and the eight Maintenance specs' header lines.
  - Nothing needs the user's call.

**Review Nov 14 (follow-up 3).** Master was not newer than `sal/fix3` in either repository; nothing merged.
- Checked and sound:
  - The diagnosis holds. `OrderPlacedSalesConfirmation` (tx-commit, on a worker) calls `send#OrderConfirmation`, whose build
    stores the confirmation once (`storeOf`: one `create#OrderContent` under the order's lock). `OrderContentRevision` raises the
    revision in that same transaction where the seller counts every change. So once the row can be seen, the bump has been
    committed with it, and the wait covers it. Nothing else the confirmation does touches the order. A second confirmation, from
    the approval's own rule, finds the stored row and adds none. Reading the revision just before approving is already what the
    feature does (the keys are read right before `apply#SalesOrderBatch`). The race is the worker landing between that read and the
    batch's check, so reading later would not close it. A retry on REVISION_CHANGED would hide a real revision bug. Waiting on the
    order's own stored row is the right fix: it is bounded (10 s, then it fails naming the order) and does not wait for the shared
    pool. When the pool is empty, `waitWorkerPoolEmpty(1)` returns at once, so a confirmation that is never stored polls the count
    for the 10 s before failing. That only happens on the failure path, and it is acceptable.
  - No product change, and no product bug hidden: with `salesCommercialRevisionOnly` N, counting a stored file is the documented
    rule. A seller who acts on a revision read before the confirmation landed is asked to reload.
  - MaintenanceAccess split: the 28 feature names are the same as master's, and each body is unchanged apart from prettier line
    wrapping (compared block by block). No feature reads another's state: no module-level `let`, and the only cache is `shellData`
    per demo user, read only. Each spec declares only the helpers it uses (`deviceRequest` is in both, as spec-local). The headers
    say where a later case goes. No screen render was added. Both specs are well under 15 s.
- Fixed:
  - R1 (low, test): MaintenancePlans' P14 feature failed on master from 09:00 America/Chicago on Nov 14, 2026. The demo's November
    filter-change obligation is due 2026-11-14 09:00 (fixed demo date). PM compliance's period defaults to now, so once that time
    has passed the obligation is outstanding rather than upcoming, and the report reads 25% (one of four) instead of 33.3%. It is
    date-dependent, not a product fault. The feature now asks for the period `thruDate` 2026-11-13, which keeps November out on any
    date. It failed before the change and passed after.
  - R2 (low, docs): the acceptance walks that named MaintenanceAccess for a record rule (Cost, CustomerRepair, Equipment, Intake,
    Parts, Plans, Preventive, Procedures, Purchase, Reports, Setup, Stack) now name MaintenanceRecordAccess, as the regression
    headers do. Only comments changed. Dispatch (P8 team defaults), Foundation and AccessWalk keep MaintenanceAccess.
  - R3 (low, comment): SalesOrderApproval's `confirmed` comment said B and C count every change. Only B does: the fixtures set C,
    like A, to commercial changes only. The Built note above has the same slip.
- Finding, numbered by the lead F345:
  - MaintenancePlans' P14 feature depended on the clock (R1). Other Maintenance specs and walks that assert outcomes around the
    demo's fixed November dates may turn the same way as the calendar moves. None other was seen failing today.
- Tests run (release binary, `--nobuild`, this worktree's runtime, machine load around 16): mr-boss MaintenanceAccess and
  MaintenanceRecordAccess 28 of 28 four times (feature time 4.9 s and 6.1 s in the measured run; 12 to 20 s for both together under
  load); MaintenancePlans 3 of 3 after R1 (2 of 3 before); mr-mantle SalesOrderApproval 4 of 4 three times (batch feature 0.9 to
  1.0 s). Prettier clean on the changed specs (three acceptance walks have earlier code-line warnings, untouched). Not run:
  test-apps, test-framework, acceptance.
- For the lead: no budget change; merge hot spots are those of the Built note plus `MaintenancePlans.spec.js`'s P14 report call and
  the twelve acceptance headers. Nothing needs the user's call.

### Follow-up 4 — regression specs near the 15 s limit before the full suites

**Built Nov 14 (follow-up 4).** mr-boss on branch `sal/fix4`; mr-mantle and mr-moqui unchanged, no Rust built. A test-timing fix
before `./moq test-apps` (4 workers), no product code changed.
- Checked first: the lead's loaded run (CustomerServiceAccess 17.7 s, PeopleAccessLater 21.6 s), how the limit is measured (a
  spec's own time, setup included, over 15 s fails the run; `./moq test <component>` runs serially, `test-apps` on 4 workers,
  docs/Build-Test.md), and follow-up 3's split of MaintenanceAccess as the pattern: the app's own access in one spec, each
  later phase's record rules in another, every feature kept unchanged, no state shared between the two.
- The scan: `./moq test mr-boss --release --nobuild` (serial, machine load 30 to 45 from the parallel work) and the same for
  mr-mantle (load 15 to 23). Specs over 10 s of feature time: mr-boss PurchasingAccess 13.6 s (25 features), PeopleAccessLater
  11.8 s (21); CustomerServiceAccess read 8.7 s there but 16.9 s and 25.1 s alone in the two runs before at load 15 to 45 (a spec
  run in a fresh process pays the first renders' compile, as each of test-apps' workers does). mr-mantle: PayConfiguration
  10.2 s (6 features; 7.8 s alone at load 5), none other over 7 s. Next in mr-boss, all under 10 s: AccountingAccess 9.5 s,
  ProductsMethods 8.6 s, SalesAccess 8.5 s, ProductsPricing 8.1 s, ProjectsAccess 7.4 s, ManufacturingAccess 6.6 s, PeopleAccess
  6.5 s.
- Built, each split along its features with every feature kept and its body unchanged (checked line for line against the
  original), the headers saying which spec a later phase's case goes in, and no state between the two specs:
  - `CustomerServiceAccess` keeps the app's own access (context, menu and providers, Home's render, capabilities, customer
    scope, the record check, record links, shipment/invoice/contact scope, guarded areas: 9 features); the new
    `test/CustomerService/CustomerServiceRecordAccess.spec.js` holds the later phases' record rules (cases, service levels,
    article feedback, case templates, channel routes, assignment rules and saved replies, merge and split, order changes,
    returns, warranty, feedback, reports, Invite to support: 13 features). Prettier reformatted the feedback feature's
    pre-existing long lines, whitespace only.
  - `PeopleAccessLater` keeps P11 to P21 and P30 (12 features, with the P14 and P15 spec-local accounts); the new
    `test/People/PeoplePayrollAccess.spec.js` holds payroll's P22 to P29 and P31 (9 features, with the P31 payroll finance
    account and P26's group, which P27's feature finalizes, so the two stay together and in order).
  - `PurchasingAccess` keeps the app's own access and P2 and P3's rules (12 features, with its spec requests); the new
    `test/Purchasing/PurchasingRecordAccess.spec.js` holds P5 on and P14a (replenishment, approval policies, receipts, bills,
    drop-ship, returns, revisions, requests, agreements, RFQs, invitations, comparisons, evaluations: 13 features; it reads
    none of the spec requests).
  - Header lines naming the old spec for a moved rule now name the new one: CustomerService Feedback, Knowledge, OrderChanges,
    Reports, Templates, Warranty; People Insights, PayAssignments, PayConfiguration, PayInputs, PayRuns, Payslips, PeopleAccess
    and the acceptance Pay*Usable, PeopleReportsUsable and PeopleReviewWalk; Purchasing Agreements, Approvals, Bills,
    Performance, Replenishment, Requests, Returns, Sourcing. Comments only.
- Times (release binary, `--nobuild`, this worktree's runtime, load 3 to 8; spec time from the JUnit files), before → after:

  | Spec | Alone | 4 workers beside three of its app |
  | --- | --- | --- |
  | CustomerServiceAccess (22 → 9 features) | 9.6 s → 5.0 s | 11.8 s → 5.9 s |
  | CustomerServiceRecordAccess (13) | — → 5.2 s | — → 6.3 s |
  | PeopleAccessLater (21 → 12) | 12.5 s → 7.6 s | 14.3 s → 9.5 s |
  | PeoplePayrollAccess (9) | — → 5.3 s | — → 6.6 s |
  | PurchasingAccess (25 → 12) | 9.5 s → 4.2 s | 10.3 s → 5.9 s |
  | PurchasingRecordAccess (13) | — → 4.6 s | — → 6.5 s |

  The 4-worker sets: Cases, Returns and Assignment; PeopleAccess, PeopleReviews and PeopleTime (PeopleAccess 9.0 s, unchanged);
  PurchasingSourcing, PurchasingOrders and PurchasingBills; after the split both halves ran in the set (5 specs). All passed.
  The 21 specs with a header line changed: 76 of 76 on 4 workers.
- Failures in the full component runs, none in a spec this change touches, each passing alone on this branch (master's code
  for them):
  - mr-boss TextFiling "a new outside number's first text is filed on the party ... once": `filed.filedDate` null in the serial
    run; 1 of 1 alone.
  - mr-mantle SalesRecurrence "an approved order becomes a monthly base": `openOrders` undefined in the serial run; 6 of 6 alone.
  - mr-mantle SmithyMirrors' setup: duplicate key `SMI_SITE` in PublicSite, which SmithyIssues also creates; it fails whenever
    SmithyIssues ran first on the same database; 5 of 5 alone.
- Not run: ./moq test-apps, test-framework, the acceptance suite. Prettier clean on the new and split specs.
- Findings, numbered by the lead F346 to F348 in order:
  - SmithyMirrors and SmithyIssues (mr-mantle) both create PublicSite `SMI_SITE`, so the second to run on one database fails its
    setup; a spec-own site id in one of them fixes it (not changed here: out of this follow-up's scope);
  - TextFiling (mr-boss) and SalesRecurrence's base feature (mr-mantle) failed in a serial run of their whole component and pass
    alone: order or timing dependent, not looked into;
  - PayConfiguration (mr-mantle, 10.2 s in a loaded serial run, 7.8 s alone) and AccountingAccess (mr-boss, 9.5 s) are the next
    nearest the limit; not split (under 12 s).
- For the lead:
  - Budget share: none (the same features, six specs instead of three; the setup of each new spec is a few rows). The loaded
    serial runs read mr-boss 420.6 s of 338 and mr-mantle 655.5 s of 555, over budget and under 1.5 times it, by load.
  - Merge hot spots: the six access specs (a phase adding an access case to CustomerServiceAccess, PeopleAccessLater or
    PurchasingAccess must now put a record's or payroll's rule in the new spec) and the header lines above. Marketing P12, merged to
    master since this branch was made, touches none of them (MarketingAccess only).
  - Nothing needs the user's call.

**Review Nov 14 (follow-up 4).** Master was newer in both repositories (Marketing P12 and its numbering); merged into `sal/fix4`
without conflicts.
- Checked and sound:
  - The three splits: every feature name of master's CustomerServiceAccess (22), PeopleAccessLater (21) and PurchasingAccess (25)
    is in exactly one of the two halves, none added, and each body is master's apart from prettier's wrapping of the feedback
    feature (compared block by block with whitespace removed). The top-level helpers and constants each half uses are declared in
    it (the names a moved feature uses that the old spec declared at top level are its own locals); nothing unused is left. The
    spec-local accounts moved with their features (P14's and P15's stay in PeopleAccessLater, P31's payroll finance account and
    P26's `state26` went to PeoplePayrollAccess with P26 and P27 together and in order), and each half's cleanup removes only its own
    accounts. PurchasingAccess keeps its spec requests and the features that read them; PurchasingRecordAccess reads none.
    No module-level state is shared, and each pair passes in either order on one database.
  - The headers say which spec a later phase's case goes in; the 21 changed header lines are comments only.
- Fixed (the order-dependent failures of the full runs; each spec passed alone):
  - R1 (low, test, mr-mantle): SmithyMirrors and SmithyIssues both made PublicSite `SMI_SITE` and the accounts `SMI_OWNER` and
    `SMI_MAINT` (SmithyIssues through `lib.tracker(SITE, "SMI", ...)`), so SmithyMirrors' setup failed on the duplicate key
    whenever SmithyIssues ran first on the database. SmithyMirrors' site, accounts, handles, group path and operation ids are now its
    own (`SPM_`, `spm`); no other Smithy spec shares a site id. The two run together failed before and pass after.
  - R2 (low, test, mr-mantle): SalesRecurrence's base feature read the account's open orders from find#Accounts' first page:
    20 rows by name, holding the organization's accounts and every shared one (owner `_NA_`). In the full serial run, 22 shared
    accounts from the Accounting specs (`ACCT_..._CUSTOMER`) sort before "Account a" (a probe read index 22 of 125), so the row
    was missing and `openOrders` was undefined. Not a worker race. The feature now asks for its account by id (`text`). The
    product's paging is correct.
  - R3 (low, test, mr-boss): TextFiling's outside party was the demo's Mary, and Commons' Contacts changes her mobile from
    010-0161 to 010-0162 (it sorts first in a serial run). get#CallContext then found no party for the number, and nothing was
    filed (`filedDate` null). Not a post-commit race: receive#Sms files synchronously. TextFiling now makes its own personal contact
    of John's with its own number (+1 555 010-4161), as Contacts' spec-local contact does. Contacts then TextFiling failed before
    and passes after.
- Finding, numbered by the lead F349:
  - Two specs used the same spec-local ids (R1), and two read shared demo or list data that other specs change or grow (R2, R3).
    These pass alone and fail only in a full serial run. A spec-local id prefix, and a lookup by id rather than a first page,
    keep them apart.
- Tests run (release binary, `--nobuild`, this worktree's runtime, load about 4):
  - Each split pair, three times on one database (both orders): CustomerService 22 of 22 (32 s a run), People 21 of 21
    (34 to 36 s), Purchasing 25 of 25 (32 to 33 s).
  - SmithyMirrors, SalesRecurrence and TextFiling, each three times alone: all pass.
  - The neighbour groups: SmithyMirrors with SmithyIssues, GithubImport, DevAide, HeldReports and MergeRequests (38 of 38).
    SalesRecurrence with the 15 Accounting specs that make shared customers, SalesAccounts and SalesWorkspace (153 of 153).
    TextFiling with Contacts, ContactImport, EventDetail, CallTarget, Chat, Compose, Consent, Inbox and CommsHome (138 of 138).
  - The whole mr-mantle run, serial: 2650 of 2650, 583.2 s of feature time against a budget of 555 (by load: the same run read
    655.5 s at load 15 to 23).
  - The whole mr-boss run, serial: 1665 of 1665, 287.1 s of 338. In it the halves' feature times were CustomerServiceAccess 3.6 s,
    CustomerServiceRecordAccess 4.5 s, PeopleAccessLater 5.8 s, PeoplePayrollAccess 4.1 s, PurchasingAccess 3.3 s and
    PurchasingRecordAccess 3.6 s; the highest was AccountingAccess at 8.4 s.
  - Not run: test-apps, test-framework, acceptance.
- For the lead:
  - Budget: no change. mr-mantle ran over its budget at load 4 (583 s of 555), as the Built note's loaded run did. Whether to cut
    it or raise it is the user's call.
  - Merge hot spots: those of the Built note, plus SmithyMirrors' ids, SalesRecurrence's account lookup and TextFiling's setup.

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
| Nov 13, 2026 | §5 Q2, Q5 and Q7 are answered as recommended: storeless freight is a shipping-charge line the rep enters, taxed by X1, a carrier rate without a store waiting for Warehouse (P7); the customer and supplier AgreementDetail screens share Mantle's records and status flow, not form definitions (P15); a native recurring base stays an Approved order marked `OrpRecurringTemplate` (P16) | The user's call |
| Nov 13, 2026 | The build order: Sales P1–P6 first, then Marketing as a second track beside Sales. Marketing P13 waits for Sales P5, Marketing P17 for Sales P7, P9 and P11, and Marketing P20 for Sales P19. At most three phase workers run at once; each phase is reviewed by a fresh agent and merged on its focused specs | The user's call. Sales keeps its own order (§1) and side-by-side pairs; impl-marketing §4 needs the same row, for its owner |
| Nov 13, 2026 | The full suites run once at the end of the build, then Sales' and Marketing's acceptance tests once | The user's call, as People's and Maintenance's builds did; a phase's Done (§2) is its focused specs and their suites' budgets, and its acceptance tests are written, not run |
| Nov 13, 2026 | §5 Q12 answered as recommended: with a seller's approval setting on, Projects' estimate approval places the estimate's sales orders and leaves them in Awaiting approval for a holder of `SALES_ORDER_APPROVE`, as every other sales order of that seller; with the setting off it approves them as today (P11) | The user's call; F61 |
| Nov 13, 2026 | The permission changes of P0 are confirmed: `PEOPLE_DIRECTORY_VIEW` for `BOSS_SALES_MANAGER` and `BOSS_SALES_ADMIN` (P2, F53), and the new `SALES_OWNER_CHANGE`, held by Admin's identity group alone, for Sales' lifecycle participant (P1, P6; F54) | The user's call |
| Nov 13, 2026 | "Create lead" and "Create RFQ" on a mail message are built, not left for later: P5 makes basic-comms' Mail render the `message-actions` slot (a framework change in mr-moqui's `runtime/components/base`, P5 working in an mr-moqui worktree too), and P8 adds the RFQ action | The user's call; F64 had moved them to §7 |
| Nov 13, 2026 | `SALES_OWNER_CHANGE` is held by Admin's administrator group `BOSS_ADMIN_ADMIN` too, beside `BOSS_ADMIN_IDENTITY`, as every other owner change is (F80); built in P6 with the lifecycle participant | The user's call |
| Nov 13, 2026 | Changing the instance's shared lost reasons and recurring plans needs every-organization scope (`SALES_ALL_ORGANIZATIONS` or `ADMIN`), as the shared default pipeline does; a configurer of one organization reads them only. Built in P4 | The user's call (P2's review); design §9 "the reasons are the instance's" holds |
| Nov 13, 2026 | The purge of unverified lead intakes also clears the lead it made, when that lead is still unqualified and untouched since intake: its name and description blanked, the filed mail unlinked, and the lead closed Lost with a purge reason; a lead someone worked on is kept. Built in P6 | The user's call (P5's review) |
| Nov 13, 2026 | A mail rule's "Create lead" action requires its owner to hold `SALES_OPPORTUNITY_EDIT` (beside working for the team's organization), when the rule is saved and when it runs, as People's Recruiting requires its edit permission. Built in P6 | The user's call (P5's review) |
| Nov 13, 2026 | A lifecycle transfer of a leaving rep's deals keeps each deal's team, as a manager's owner change does; a manager sets the team afterwards | The lead's call, as P6's review recommended: changing the team would widen or narrow who sees the deal without a Sales decision |
| Nov 14, 2026 | With the seller's approval setting on and no order rule matching, the order's owner, enterer or placer who holds `SALES_ORDER_APPROVE` may approve it: the setting forces a manual approval, and separation applies per order rule | The user's call (P11's review) |
| Nov 14, 2026 | An order approver keeps read-only sight of an order on which they recorded a decision, after it is approved; not of the organization's other approved orders. Built in P12 | The user's call (P11's review) |
| Nov 14, 2026 | A quote link's token stays in the stored body of the sent mail, as Billing's and Support's links do; a cross-app redaction of stored links is later (§7) | The user's call (P13's review) |
| Nov 14, 2026 | An agreement with no status keeps pricing by its dates alone, as Products' price lists and Customer Service's service agreements rely on; Sales' own agreements always carry a status. A raw Agreement row written by REST or an import is the remaining gap (F-row of P15) | The user's call (P15) |
| Nov 14, 2026 | `SALES_FORECAST_EDIT` is granted to `BOSS_SALES_REP` (in its bundle) beside the manager and the administrator, so a representative submits their own forecast (design §8 SubmitForecast); Mantle confines it: a holder enters the judgement of their own key, a team they manage or, with `SALES_TEAM_VIEW`, a team or the organization, never another person's (SalesAccess.js `forecastSubmits`) | The user's call (the P18 Built note's first finding); design-sales §1.1 changed |
| Nov 14, 2026 | A cancelled order stays on the customer's My orders and opens from its link, marked Cancelled and read only, instead of disappearing (the order link is no longer revoked by the cancellation; a Support request on it stays the customer's way to ask). Built in P19 | The user's call (P17's review) |
| Nov 14, 2026 | A native recurring order generated without a payment is invoiced when a person approves it, as its base's auto-invoice asks; Accounting's renewal payment with recorded consent stays later (§7). Built in follow-up 2 | The user's call (P16's review) |
| Nov 14, 2026 | A recurring base copies the source's charge and discount lines with its products, and tax is computed on each generated order when it is placed (X1 for a storeless seller). Built in follow-up 2 | The user's call (P16's review) |
| Nov 14, 2026 | The "quote expiring in N days" alert template is built in P20, over a new quote dataset of Mantle's with Sales' scope filter (P19's review found it required and not built) | The user's call |
| Nov 14, 2026 | The RFQ acknowledgement goes only to a sender matched to a known contact or account; an unknown or possibly forged address gets none | The user's call (P20's review) |
| Nov 14, 2026 | The two §16 outputs P20's Built note left unbuilt are built in P20's review, not moved to §7: the RFQ acknowledgement (an automatic reply to a request made from mail, through the delivery ledger from the intake's organization as a transactional delivery naming it, at most once a request, only to the address it came from, its stored locked text seeing only the request's reference; off unless the organization's SalesPolicy turns it on) and the agreement print (AgreementDetail's Print from the agreement's own records through Mantle's print templates, for who reads the agreement, no cost) | The user's call (P20's review) |
| Nov 14, 2026 | `approve#SalesOrder` records a decision on every approval, rule or not: with no order rule left to decide it records one OrderDecision of purpose `SapOrder` with no rule, so an approver keeps sight of every order they approved. Built in P12's review | The user's call (the P12 Built note's second finding); no requirement reads an order decision with no policy |
| Nov 13, 2026 | `BOSS_SALES_ADMIN`'s grants stay as P1 built them: `SALES_CONFIGURE` with the views and edits of the manager and the agreement keeper (`SALES_IMPORT` and `SALES_CUSTOMER_INVITE` among them), and no `SALES_ORDER_APPROVE`, `SALES_APPROVE`, `SALES_ORDER_CHANGE`, `ORDER_APPROVE`, `ORDER_CHANGE_HOLD_RELEASE` or `SALES_OWNER_CHANGE` (P1) | The user's call (the P1 Built note's first finding); unlike Maintenance's administrator, who holds every app permission. A later phase grants the administrator only the views and edits it builds, never an approval |
| Nov 13, 2026 | `SALES_ALL_ORGANIZATIONS`, seeded in Mantle and granted to `ADMIN`, and in BOSS to `BOSS_SALES_ADMIN` alone (in its bundle): SalesAccess's organizations are every internal organization for a holder, as a system administrator's; it reads nothing by itself (P1 review) | The user's call (the P1 Built note's second finding), as People's `PEOPLE_ALL_ORGANIZATIONS` and Maintenance's `MAINTENANCE_ALL_ORGANIZATIONS` (impl-maintenance P1 review R3); the administrator's root keeps `MANTLE_ACTIVE_ORG`, so its entity reads and its services now agree |
| Nov 13, 2026 | Sales edits a contact's identity and channels through Commons: `check#ContactAccess` (owner contract) also admits a holder of `SALES_ACCOUNT_EDIT` for a person who is a current contact of an account of their sales scope (`Party.ownerPartyId` in SalesAccess's organizations, or a shared `_NA_` account), with Commons' own forms (P3 review) | The user's call (the P3 Built note's second finding); a person with a user account stays the contact administrator's, and no delete; written into design-drawers-commons §6 |
| Nov 13, 2026 | `merge#Parties`' guards keep admitting a caller that disabled authorization or runs as the system (jobs, Shop's verified guest claim) (P3) | The user's call (the P3 Built note's last question) |
| Nov 13, 2026 | An entered zero price or a free quote line keeps requiring `SALES_APPROVE` of the one who enters it until P9 (P7); in P9 a free or zero line becomes a rule in Sales' approval policies, so a rep can draft it and the approver decides at issue (P7, P9) | The user's call (the P7 Built note's free-line finding) |
| Nov 13, 2026 | A mail rule's `createQuoteRequest` action (Create RFQ from mail) needs its owner to hold `SALES_QUOTE_EDIT`, when the rule is saved (`check#LeadRuleOwner`) and each time it runs (`create#QuoteRequestFromEmail`), as built (P8) | The user's call (the P8 Built note's first finding), by analogy with createLead's owner |
| Nov 13, 2026 | A chargeable repair's warranty claim stays visible to Sales as built (holders of `SALES_QUOTE_EDIT` or `SALES_TEAM_VIEW` in the claim's organization, its customer and products only, under RFQs' "Repairs to quote"), with notices both ways: Customer Service's chargeable decision tells the organization's default Sales team (P9's SalesPolicy; topic SalesRepairToQuote), and a repair quote made tells the claim's assignee or queue (SalesRepairQuoted); neither title carries fault text or an amount (P8 review) | The user's call (the P8 Built note's second finding); written into design-sales §5 and design-customer-service §13 |
| Nov 14, 2026 | Above the seller's acceptance threshold, a person customer's own verified account (the self relationship) may accept signed in, beside an invited contact of a company customer. Built in P13 | The user's call (P13's Built note) |
| Nov 14, 2026 | A contact invited to PASS Sales sees every issued quote of its customer at that organization, not only the quotes addressed to it; `invite#Contact` takes no administrator flag for `sales`. Built in P13 | The user's call (P13's Built note) |

## 5. Open questions

Each has the plan's recommended answer; the phases are written to it.

| Question | Decides | Notes |
| --- | --- | --- |
| Q2. (answered Nov 13, §4) Storeless freight (design §19 item 1) | P7 | As recommended, the design's answer: an explicit shipping-charge line the rep enters, taxed by the X1 path; a carrier rate without a store waits for a Warehouse rating service (§7) |
| Q4. Commissions, now that People is built before Sales | §7 or a phase after gate 3 | Recommend it stays later: it is a `later` row whose other gate, the calculation and earning-basis rules (design §19 item 4), is open. When taken it is a phase of its own over People's PayrollInputSource type `SalesCommission` and Accounting's payable intake |
| Q5. (answered Nov 13, §4) Do the customer and supplier AgreementDetail screens share form definitions (design §19 item 5, X13)? | P15 | As recommended, not now: Purchasing's screen is built around releases, caps and approved revisions (F19); Sales builds `Shared/AgreementDetail` for customer agreements, and the two share Mantle's status flow and records. Sharing forms is a later refactor of both |
| Q7. (answered Nov 13, §4) Does a native recurring base stay an Approved order, as the worker asks today? | P16 | As recommended, yes, marked `OrpRecurringTemplate` so every exclusion holds (F7, F22), since Shop's bases already work so; the phase confirms no reader counts an approved base |
| Q9. The public lead form before Marketing is built | §7 | Recommend none: `store#LeadIntake` is built in P5 with the mail and Comms sources; the one public lead page is Marketing's, built by its plan. Design §14.3 scenario 13's form part is Marketing's acceptance test |
| Q10. (answered Nov 11, §4) Who may run an app's own import? | P6; impl-people P7 and P13, impl-maintenance P18, impl-marketing P4 | A holder of the app's own import permission, here `SALES_IMPORT`, with the app's permissions its target names. Nothing is open |
| Q11. Preventive maintenance of customer-owned equipment under a service agreement (design-maintenance §15, R-MNT-F01) | §7 | Not this plan's to answer: it is later and Maintenance's to design, after P15's AgreementDetail, and the question is impl-maintenance §5 Q8. Design-sales has no screen or need for it, and its billing is the later ContractSchedules |
| Q12. (answered Nov 13, §4) With a seller's approval setting on, does Projects' estimate approval still approve the estimate's sales orders? | P11 | It places and then approves them with a direct status write, outside `approve#Order`'s credit check and the Sales guard (F61). Recommend not: with the setting on it places them and leaves them in Awaiting approval for a holder of `SALES_ORDER_APPROVE`, as every other sales order of that seller; with it off, as today (an owner contract with Projects, its specs unchanged) |
| Further issues discovered during implementation | the affected phase | Record findings and decisions here |

## 6. Findings

Design assumptions found wrong or unstated in the code, with the resolution. Where a resolution changes the design, it
is written there too; an edit a finding calls for in a shared file is named for its owner. F1–F42 were found on Nov
11, 2026, while writing this plan, and F43–F51 in its review the same day; F53–F73 are P0's remaining checks, Nov 13.
Paths without a component are mr-boss's; Mantle's start `mr-mantle/`, PASS's `mr-pass/`, the framework's `framework/`
(runtime/components/base/framework) or `crates/`.

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
| F53 | P0 (Nov 13): `find#Employees` (mr-mantle service/mantle/humanres/PeopleServices.xml:143-189; Employees.js:259) reads by People's scope (People.js:287-327) and refuses `PERMISSION_DENIED` a caller with no People read (Employees.js:286); a staff read is `PEOPLE_DIRECTORY_VIEW` or an HR, recruit, develop, case or configure permission (People.js:67). It answers the work identity (name, job title, manager, work email and phone, location), never private contacts or pay, and takes `organizationPartyId`. Employee360 is mounted at `People/Employees/Employee360` and `Commons/People/Employee360` (screen/People/Employees.xml:32; screen/Commons/People.xml:27), and Insights and Maintenance mount it too; `get#Employee360` admits by the same scope, so a Sales user with no People permission sees "not available". People.js's `employee360Apps` (:1643-1669) names Sales as an app with no row, linked by `employee360Link` (:1737-1749). Maintenance gave its planners `PEOPLE_DIRECTORY_VIEW` for a custodian's card (data/BossSetupMaintenanceData.xml:86-100) | P2: `BOSS_SALES_MANAGER` and `BOSS_SALES_ADMIN` get `PEOPLE_DIRECTORY_VIEW` for TeamMembers' lookup and the link; a rep sees a teammate's card only with it. Design §1.1 changed. P2 changed |
| F54 | P0 (Nov 13): the participant is still `ironstone.admin.LifecycleParticipant` (entity/AdminEntities.xml:140: lookup, transfer and pause services, `resourceParameter`, `requiredPermission`). `request#AccessEnd` (service/ironstone/admin/LifecycleServices.xml:107; Provisioning.js:104-116, to Mantle's `request#AccessEnd`, mr-mantle service/mantle/party/Lifecycle.js:1255) calls no participant: Admin's `find#OwnedResources` and the disable and removal operations do (service/ironstone/admin/Lifecycle.js:89-146, :192-212), as the identity operator, on the contract of framework service/org/moqui/admin/IdentityServices.xml:136-160 (lookup: `userId` to `resourceList`; transfer: `fromUserId`, `toUserId`, `reason` and the resource parameter, to `transferred`). People's row names a Mantle service and an owner-change permission of its own granted to `BOSS_ADMIN_IDENTITY` (data/BossSetupData.xml:5203-5209); Projects' names `ADMIN_IDENTITY_VIEW` over a BOSS service (:4068) | P1 seeds `SALES_OWNER_CHANGE`; P6's participant follows People's row, `SalesWorkspaceServices`' lookup and transfer checking it, granted to `BOSS_ADMIN_IDENTITY`; its usable-when walks Admin's disable. Design §1.1 changed. P1, P6 changed |
| F55 | P0 (Nov 13): the deny pattern's fifteen rows (data/BossSetupData.xml:461-487, :4093) name `people` and `maintenance` and not `marketing`; the longest is 238 characters, 244 with `sales` and 254 with `marketing` too, so none splits (the comment at :458-459 says so). Maintenance put its setup in a file of its own, data/BossSetupMaintenanceData.xml, "so that its appends and People's do not meet" (:14-17); People's is at BossSetupData.xml:5054-5753, and the demo users end with Maintenance's (data/BossUsersDemoData.xml:1343-1478). The registries are `moqui.server.SettingsEntry`, `ReadinessProvider` and `TransferTarget` and `moqui.security.CapabilityBundle`; the owner routes are Admin.js `mountRoutes` (service/ironstone/admin/Admin.js:404-440); Shared/DataImport has People's and Maintenance's branches (service/ironstone/shared/DataImport.js:51-66, :70-85), and any other root falls through to the catalog branch (:87-99) rather than a refusal; People's and Maintenance's targets name their import permission with the app's own (mr-mantle data/PeopleLifecycleSetupData.xml:43; MaintenanceSettingsData.xml:44) | F25 settled: P1 adds `sales` to each row, no split. Sales' setup is `data/BossSetupSalesData.xml` (loading after BossSetupData), so its appends and Marketing's track do not meet; demo users after Maintenance's. P6's DataImport branch goes before the catalog branch. §1, P1, P6 changed |
| F56 | P0 (Nov 13): the budgets as People and Maintenance left them: mr-boss 338 s server and 77 s client (test/budget:8-20; People's 28 specs 55.3 s, Maintenance's share 26.3 s and its walk 8.1 s), mr-mantle 555 s (test/budget:11-16; People's 39 specs 111.8 s, Maintenance's 47.6 s), mr-pass 20 s and 9 s, the framework 17 s and 6 s. F37's figures are superseded | §4's estimates stand as raises on these: about 50 s mr-mantle, 20 s and 7 s mr-boss, a second or two mr-pass |
| F57 | P0 (Nov 13): Admin P17's audit reader reads only fields with a `moqui.server.AuditProjection` row (framework entity/ServerEntities.xml:818-850), shows a value only for `valueMode` `show` and never an encrypted or secret-named field (framework service/org/moqui/admin/Audit.js:57-62, :118, :127, :431-434), and lists nothing unregistered (:516-520). Only framework data and mr-mantle data/PartyAuditData.xml register rows; no order, agreement, opportunity or forecast entity is registered, and the raw log is the instance administrator's (tools screen/System/Audit/AuditChanges.xml:28-31). An issue's token is stored as a digest only (mr-mantle entity/ExternalAccessEntities.xml:33). P18's `moqui.security.DeviceRouteGroup` (framework entity/SecurityEntities.xml:472) is seeded only by Insights and People (BossSetupData.xml:5033, :5677) | Sales registers no projection and no device route group: its audited fields stay in OrderDetail's, OpportunityDetail's and the policies' History, as People's do (impl-people F56); whether a business entity belongs in AuditChanges is Admin's F257, the user's call. §7 changed |
| F58 | P0 (Nov 13): a notification has one link for every recipient: `NotificationTopic.linkTemplate` (framework entity/SecurityEntities.xml:699) expanded once into `NotificationMessage.linkText` (crates/moqui-core/src/notify/message.rs:317-323, :606). Commons' `open#Notification` opens an approval topic's own `/qapps` link first (service/ironstone/commons/CommonsServices.xml:311-313), but resolves a `/qapps/Commons/openRecord?` link per user through `PaletteServices.get#RecordLink` (:322-336), as People's timesheet topics do; OrderChangeApproval's link is Customer Service's OrderChangeDetail (data/BossSetupData.xml:1912-1913), and that screen and its access answer only the CustomerService root (screen/Shared/OrderChangeDetail.xml:136, :149; service/ironstone/customerservice/CustomerService.js:331-332) | P9: OrderChangeApproval's link becomes the `openRecord` link of the change request; `get#RecordLink`'s request branch (PaletteServices.xml:88, :108) opens a commercial-kind change in Sales for a Sales approver from P14, in Customer Service otherwise. No second topic. Design §§1.3 and 5 changed; crosscut §3.15 and design-customer-service §4 need the same line, for their owners. P9, P14 changed |
| F59 | P0 (Nov 13): `ironstone.insights.ReportCatalogEntry`'s `catalogueService` is called as the viewer with `appRoot` the route's first segment (entity/AdminEntities.xml:46-49; service/ironstone/insights/Registry.js:93-128), answers `reports` [{entryId or reportId}], and a refusal hides the entry. `Sales.SalesAnalysis` (data/BossSetupData.xml:3603-3609) names Accounting's `ReportServices.get#Catalog`, which refuses any root but Accounting (service/ironstone/accounting/AccountingLib.js:16-20) and admits a ledger report reader (Reports.js:24-28, :47-60) | P19: the moved entry names Sales' `get#SalesReports` on that contract for the root `Sales`, refusing by reason code a user with no Sales report scope; Accounting's mount gets an entry of its own under its catalogue (owner contract). Design-insights §6's Sales row for its owner. P19 changed |
| F60 | P0 (Nov 13): `autoApprove#Order` (mr-mantle service/mantle/order/OrderServices.xml:1495-1539) acts only on a Placed order whose authorized, delivered or confirmed payments cover its total, never approved before, with no `check#OrderPreApprove` warning; its callers are F52's four and no other. Besides the credit (AccountingCredit.secas.xml:20) and purchase (Purchase.secas.xml:22) SECAs, `check#OrderPreApprove` (order/OrderInfoServices.xml:861-1110) warns on an open hold, a payment in another currency, payments promised or authorized short, a part with no vendor or customer, a store's ProductStoreApprove validators, and, for an internal seller, a new customer, a missing, untrusted or listed shipping address and differing billing and shipping addresses, each switched off only by a store setting. The seller is the part's `vendorPartyId` with the OrgInternal role (:898-900); `approveRefusal` tells a purchase part by its customer (order/PurchaseOrders.js:442-456); a storeless part has its vendor alone | P9: Sales' SECA adds warnings only for an order that meets a Sales rule, so an organization without rules sees none. P11: the setting's rule reads each part's vendor; a net-terms order is never auto-approved today, so the accepted net-terms option approves through `approve#Order` at acceptance. P11 changed |
| F61 | P0 (Nov 13): the manual approvals of a sales order outside Sales: Customer Service's replacement orders call `approve#Order` under `ORDER_APPROVE` (mr-mantle service/mantle/order/ReturnServices.xml:1094-1098, :1127-1129), and so do the order import (OrderServices.xml:3137), the bulk status change (OrderBulkServices.xml:322) and the demo loaders (service/ironstone/accounting/Demo.js:906 and six more; customerservice/Demo.js:59). Projects' estimate approval places and approves the estimate's open or proposed orders with `update#OrderStatus` (mr-mantle service/mantle/work/ProjectServices.xml:3486-3496), outside `approve#Order`, its credit check and any Sales guard. Shop's base and the drop-ship order write Approved directly too (product/ShopSubscriptions.js:676-681; order/DropShip.js:320), a recurring base and a purchase order | P11: with the setting on, a replacement order is left placed for a Sales approver (the return services ask `approve#Order`'s check, as they skip it for a settler without `ORDER_APPROVE`); the other callers are unchanged with it off. Projects' estimate is §5 Q12, the user's call before P11. P11 changed |
| F62 | P0 (Nov 13): X1's reach today. `calculate#OrderSalesTax` reads the store's gateway alone (mr-mantle service/mantle/other/TaxServices.xml:85-100) and `handle#OrderMajorChange`'s tax step runs only with a store (OrderServices.xml:2779); X1's fallback is the seller's `PartyAcctgPreference.taxGatewayConfigId`, which no install or demo data sets (the one gateway is a store's, data/ZcaProductDemoData.xml:196; ORG_ZIZI_CORP's preference names none). Customer Service's replacement orders are storeless and priced at zero (ReturnServices.xml:1056-1061, :1074-1076); Projects' estimates are storeless orders of ORG_ZIZI_SERVICES; the one spec that sets a seller's gateway, AccountingTax (test/other/AccountingTax.spec.js:201-205), does so on its own fixture organization for an invoice | P7: X1 changes no built order and no spec; P7's own spec and demo set a gateway. P7 changed |
| F63 | P0 (Nov 13): RequestTriageNotice still leaves out only `RqtPurchaseRfq` and `RqtHrCase` (mr-mantle entity/Request.eecas.xml:22-25). `complete#RequestFromWork` (service/mantle/request/RequestServices.xml:1546-1600), run by WorkEffortRequestFromWork (entity/Work.eecas.xml:39-41), moves a request only for a task of a project with WstRequestFromWork or the Requests module, and skips `RqtPurchaseRfq`, `RqtInventory`, `RqtHrCase`, an organization's purchase request and a case; an RqtQuote linked to a project task would be completed. SupportCaseRule queues every request but `ensure#CaseProfile` makes a case only of one in a service queue or of a type an organization's request type service-enables (service/mantle/request/SupportCases.js:111, :165-189) | P8: RqtQuote added to RequestTriageNotice's exclusion and `complete#RequestFromWork`'s type list; the case rules need no guard. P8 changed |
| F64 | P0 (Nov 13): Comms as it consumes the hooks. `contact-card` is read by Mail alone (basic-comms screen/BasicComms/Inbox/Mail.xml:98-104; service/org/moqui/comms/InboxServices.xml:424-449, called with address, partyId and name), with Comms' own provider (screen/Comms.xml:67). Of the `ext-action` slots in the schema only `chat-message-actions` (Chat.qvue:500: chatRoomId, eventSeq), `voicemail-actions` (Calls/Voicemail.qvue:61-63: voicemailId, fromNumber, callSessionId) and `call-actions` (webroot js/WebrootCall.js:1486: callSessionId) render; Mail renders none. `create-from` is called by Chat alone, with kind, emailMessageId, chatRoomId and eventSeq (ProviderInterfaces.xml:83-91; Chat.xml:332); a voicemail's action is a screen-extend transition given the voicemail (screen-extend/basic-comms/screen/BasicComms/Calls/Voicemail.xml:21-37, Customer Service's `createCase`, which reads the transcript) | P5: `create-from` Lead on a chat message, the voicemail's "Create lead" a transition, "Log call on opportunity" in the call and voicemail slots, and a `contact-card` provider; a mail message's "Create lead" and "Create RFQ" wait for Comms (§7), a mail's lead and RFQ coming from the intake addresses. Design §§1.4, 3 and 12.2 changed. P5, P8 changed |
| F65 | P0 (Nov 13): no component registers a `user-facts` provider: the only `llm-facade` blocks are Mantle's constitution provider (mr-mantle MoquiConf.xml:9) and the demo's, and the framework's conf holds a commented example (framework conf/MoquiDefaultConf.xml:1058-1060). The built-in facts are the user's name, username, id, locale and time zone (crates/moqui-llm/src/prompt.rs:951-972); a provider implements `org.moqui.agent.AgentServices.get#UserFacts` (crates/moqui-llm/src/facts.rs:15-29), and the facts are fixed in a conversation's prefix | P6 builds Mantle's provider (the user's organizations and the active one), the design's prerequisite; a Sales tool still takes and checks its organization, since the active one may change mid-conversation. Design §1.4 changed. P6 changed |
| F66 | P0 (Nov 13): `report-embed` (framework xsd/xml-screen-3.xsd:1491-1511; template/screen/ScreenSupport.js:85-106) renders a dashboard's panel through `render#Dashboard` as the viewer; a funnel is a client visualization (webroot js/WebrootReport.js:1530-1532) drawn in qvt, as text bars in tui (crates/moqui-tui/src/components/report/visual.rs:42), as a plain table in html and print (ScreenSupport.js:177), and server-static throws (ScreenQvtStatic.js:2574). The dataset's row filter applies for the viewer (crates/moqui-report/src/lib.rs:184-186, :293-330); Mantle's sales datasets use `get#OrganizationRowFilter` (report/mantle-sales-orders.json:9), the organization alone. No dashboard has a funnel panel today, and Insights admits a dataset to Assist or MCP only in the operations or cost class (impl-people F70) | P6: the pipeline dataset's row filter is Sales' scope; `report/boss-sales-pipeline.json` ships in P6 with the funnel panel and P19 adds its other panels; Home's and PipelineAnalysis' funnel are left out of server-static output. Design §§3 and 8 changed. P6, P19 changed |
| F67 | P0 (Nov 13): Product360, InventoryAvailability, Prices, PriceLists, PriceListDetail and PriceExplain take their scope from `ironstone.products.CatalogServices.get#SharedContext` (e.g. screen/Shared/Prices.xml:32; PriceExplain.xml:34), whose `context()` knows Maintenance, Commerce, CustomerService, Warehouse, Manufacturing, Purchasing and Products and throws for any other root (service/ironstone/products/SharedContext.js:440-448); the pricing services route each call through the root too (Pricing.js:5; ProductsLib.js:89-90). Price read is `PRICE_VIEW` or `PRICE_EDIT` (Pricing.js:20-31). PriceExplain branches Purchasing and CustomerService (PriceExplain.xml:42-49) | P7 adds `salesContext()` on Customer Service's (:236-302: catalogue read, availability read only, price by Products' permissions, no cost) and PriceExplain's Sales branch; P15 extends it for price lists. P7 changed |
| F68 | P0 (Nov 13): how the shared screens choose a context. The Commons contact record has no app table: an app includes template/ContactRecord.xml's section and transitions behind its own gate, as Customer Service's ContactDetail does (screen/CustomerService/Customers/ContactDetail.xml:27-62, gate `check#ServiceContact`, service/ironstone/customerservice/CustomerServices.xml:77-89); no app mounts Commons' list. Customer360 shows Accounting's context to any root but CustomerService and Commerce (screen/Shared/Customer360.xml:71, :86, :92, :106). OrderDetail is an appRoot chain whose default is Projects' (:126-196, :177; not-found list :213). RequestDetail and WorkItemDetail fall through to Commons' detail for an unknown root (RequestDetail.xml:401-402; WorkItemDetail.xml:437-471), with no refusal | P3: ContactDetail by include with a Sales gate, Contacts Sales' own list, Customer360's four conditions; P7, P11: OrderDetail's branch; P4, P8: their branches before the fall-through. P3, P7, P8 changed |
| F69 | P0 (Nov 13): a Chatter and files host is an entry in `get#RecordLinkInfo`'s literal maps (mr-mantle service/mantle/party/CommunicationServices.xml:2146-2208), a branch of its `visible()` check (about :2600-2720) when the entity filters are not enough, an entry in RecordFiles' map with its content service (service/ironstone/shared/RecordFilesServices.xml:43-81) and a Chatter title (ChatterServices.xml:94-151); People added each host so (CommunicationServices.xml:2194-2208, :2652-2677). Agreement is a host already, visible to a user of its organization who may see the other party (:2171, :2643-2650; RecordFilesServices.xml:46); SalesOpportunity is in none and has no content entity | P4 builds SalesOpportunityContent and the four entries on People's pattern; P15 keeps Agreement's branch. P4 changed |
| F70 | P0 (Nov 13): `fancy-locked-html` (crates/moqui-core/src/script/template.rs:100-127, :343-353; framework conf/MoquiDefaultConf.xml:930-931, extension `html.fancy-locked`) runs in a sandbox that sees only the map it is given (template.rs:17-22, :1437-1483: no `ec`, no service or entity, dates and decimals as text). It renders only by location, through `ec.resource.template(location, map)` (crates/moqui-core/src/script/host/globals.rs:699-711); a screen's text include passes no map (crates/moqui-core/src/screen/sri/sections.rs:660), so an EmailTemplate body screen or html-print including such a file renders every field empty. Only storefront themes use it; Mantle's prints render a trusted `.html.fancy` with an explicit map (mr-mantle service/mantle/order/OrderConfirmations.js:144) | P10 (and P12's templates, P11's confirmation text): the cover, terms and reminder text are `.html.fancy-locked` resources, rendered by the mail body's and print's script with an explicit map that is the list of fields they may use. Design §§1.4 and 5 changed. P10 changed |
| F71 | P0 (Nov 13): the baseline forms ss-inventory maps to a Sales path (ss-inventory.md:650-688 Order, :694-734 Party, :874-891 Request) against the planned contexts. Covered: OrderDetail's header, audit, part edit, lines, close, send and mail list (P7, P11), notes and files (Chatter, RecordFiles); Customer360's roles, classifications, accounts and contacts (P3); ContactDetail's person and organization, notes, contact details and content by the contact record (P3, F68); RequestDetail's header, parties and items (P8). Not covered by a Sales context: the promotion codes (:656-658; promotions are store-only, P7), the payment and gateway forms (:673-676; Accounting's, read only by capability, P11), AddPartForm (:652; one part), ItemLimitForm (:659), SystemMessageList (:666), ChildOrderList (:667), AddOrderPartToShipmentForm (:668) and ReserveItem (:682; Warehouse's), CreateOrderPartParty (:671; parties by role), EditOrderItem on a placed order (:681; a commercial change, P14), RecurOptions (:653; P16), and RequestDetail's tasks and users (:882, :887-891) | Each phase marks its forms in ss-inventory's **Implemented in** with the reason, the uncovered ones as "—" with their owner or phase. P7 changed |
| F72 | P0 (Nov 13): the demo's internal organizations without a store are ORG_ZIZI_CORP, ORG_ZIZI_SALES ("Ziziwork Sales", OrgInternal and Vendor, rolling up to ORG_ZIZI_CORP, mr-mantle data/ZbaOrganizationDemoData.xml:33-39) and ORG_ZIZI_HR; ORG_ZIZI_SERVICES has Commerce's store (data/BossCommerceDemoData.xml:53) and Projects' orders. ORG_ZIZI_SALES has no customers or orders and appears only in People's demo (data/BossPeopleDemoData.xml:241); no preference names a tax gateway (F62); `LOCAL` is Mantle's gateway (mr-mantle entity/AccountingOtherEntities.xml:306) | ORG_ZIZI_SALES is the second demo organization and the storeless seller: P1's users, P2's team, P3's customers, P7's preference naming `LOCAL`. P1, P7 changed |
| F73 | P0 (Nov 13): PASS's copies as Deployment says (mr-pass docs/Deployment.md:392-402): `service/pass/Schema.js` and `Routes.js` with Mantle's `ForumSchema.js` and `script/PassRoutes.js`, kept identical by mr-pass test/Forum/Forum.spec.js; the three `TOKEN_WRITES` lists (mr-pass service/pass/Transport.js:57; mr-mantle script/PassApi.js:6, PassAuthority.js:9) hold the same 46 operations, kept equal by mr-pass test/Shop/ShopCart.spec.js:157-159 | P13, P17 as written |
| F74 | P1 (Built Nov 13): `BOSS_SALES_ADMIN`'s grants are not in design §1.1 ("SALES_CONFIGURE plus explicit Sales view/edit capabilities"): P1 gives it `SALES_CONFIGURE` with the views and edits of the manager and the agreement keeper (`SALES_IMPORT` and `SALES_CUSTOMER_INVITE` among them) and no `SALES_ORDER_APPROVE`, `SALES_APPROVE`, `SALES_ORDER_CHANGE` or `SALES_OWNER_CHANGE`; Maintenance's administrator got every app permission by the user's call (impl-maintenance P1 review) | P1: as its Built note says |
| F75 | P1 (Built Nov 13): Sales has no all-organizations permission: the administrator's root carries `MANTLE_ACTIVE_ORG`, so its entity reads see every organization with none active, but SalesAccess and the services answer its own organizations only (the demo administrator works both); Maintenance added `MAINTENANCE_ALL_ORGANIZATIONS` by the user's call for the same gap | P1: as its Built note says |
| F76 | P1 (Built Nov 13): SalesAnalysis as ported still reads `OrderItemSalesSummary` itself, with the cost in its select, under the reader's organization filter and no service check; P1 hides its cost and margin columns for a reader without cost rights, and P19's rebuild over `run#SalesAnalysis` closes the read | P1: as its Built note says |
| F77 | P1 (Built Nov 13): SalesSummary's Vendors, Stores and Customers drop-downs are the ported ones (`searchPartyList`, an unscoped store list under the root's filter), not Sales' `choices`; P19 replaces them | P1: as its Built note says |
| F78 | P1 (Built Nov 13): `BOSS_SALES_CHANGE` holds only `BOSS_SALES`' view until P14 grants its two permissions (F43), so its bundle carries none and a change operator's Sales is Home alone | P1: as its Built note says |
| F79 | P1 (Review Nov 13): the ported SalesAnalysis still shows a non-cost reader "Total Cost" in its sort choices (they now sort by nothing) and its Show SQL dialog; P19's rebuild over `run#SalesAnalysis` removes both | P1: as its Review note says |
| F80 | P1 (Review Nov 13): `SALES_OWNER_CHANGE` goes to `BOSS_ADMIN_IDENTITY` only, where every other owner change (drive, mail, calendar, contact book, report, People's approvals) is also `BOSS_ADMIN_ADMIN`'s; §4's row says "Admin's identity group alone", so it is kept; P6 may ask whether the Admin administrator should hold it too | P1: as its Review note says |
| F81 | P1 (Review Nov 13): SalesSummary's top products and customer classes are called without the chosen vendors (as ported), so they answer the whole scope while the order and invoice summaries answer the chosen organizations; P19's rebuild | P1: as its Review note says |
| F82 | P2 (Built Nov 13): P4 owns the opportunity lifecycle but P2 adds `SalesOpportunity.statusId` for the retirement rule; P4 builds on it (and adds the pipeline, lost reason and the other fields of SAL-CRM) | P2: as its Built note says |
| F83 | P2 (Built Nov 13): the readiness's team and source checks are warnings and the default pipeline always passes while the shared `SalesDefault` is in effect, so an organization that never configured Sales reads "ready" there; a stricter rule (an organization's own default) would be a later call | P2: as its Built note says |
| F84 | P2 (Built Nov 13): TeamMembers' lookup probes `find#Employees`, which logs an ERROR when People's scope refuses the organization (a manager of an organization People does not cover for them); the labels fall back to names, but the log is noise | P2: as its Built note says |
| F85 | P2 (Built Nov 13): a lead source offered to an organization outside the administrator's scope cannot be renamed by them (`SOURCE_SHARED`), so a source shared by two organizations is renamed only by an administrator of both (the demo's `sales.admin`) | P2: as its Built note says |
| F86 | P2 (Built Nov 13): LeadSources reads `sales` from its mounting root, but `Sales.js mountRoots` holds only Sales until P4 adds Marketing's root, so Marketing's mount (impl-marketing P13) needs that row too | P2: as its Built note says |
| F87 | P2 (Review Nov 13): lost reasons are the instance's, yet any SALES_CONFIGURE holder of one organization renames, reorders and ends them for every organization; the shared pipeline needs every organization's scope for the same kind of change. Whether store#LostReason should too (or reasons become per organization) is the user's call; kept as built, as design §9 says "the reasons are the instance's" | P2: as its Review note says |
| F88 | P2 (Review Nov 13): every configurer reads every lead source's name (get#SalesSetup lists the instance's sources, up to 500) and may offer any of them to an organization of theirs, and DUPLICATE_VALUE on a new name confirms another organization's source; the design makes sources shared, so kept; a source with no current binding (all ended) is renamed by any configurer | P2: as its Review note says |
| F89 | P2 (Review Nov 13): store#SalesTeamMember's "works for the organization" is checked at the time of the call, not at the membership's start, so a person whose agency starts next month cannot be added from then, and an employment's end does not end the membership | P2: as its Review note says |
| F90 | P2 (Review Nov 13): a new pipeline with a future fromDate and the default flag clears the organization's current default at once, leaving the shared one in effect until it starts | P2: as its Review note says |
| F91 | P3 (Built Nov 13): Shared/Customer360's tab bar lists every app's tabs (Accounting's, Customer Service's, Sales') under each root: a subscreen's `<condition>` hides its content, not its menu item (crates/moqui-core/src/screen/menu.rs reads only `disable_when`), so Sales' Customer360 shows "Cases", "Credit" and the others empty, as Customer Service's shows Accounting's today; a tab's `menu-include` expression or a condition-aware menu is Customer360's owner's or the framework's fix | P3: as its Built note says |
| F92 | P3 (Built Nov 13): ContactDetail's identity and channel edits are the Commons record's own (`check#ContactAccess`: a contact administrator or a personal contact's owner), so a representative reads a contact's details and cannot edit them, as Customer Service's agents; design §4 gives Sales "edit identity and channels": a Sales admission in `check#ContactAccess` (owner contract) or Sales forms of its own is the user's call | P3: as its Built note says |
| F93 | P3 (Built Nov 13): Customer360's roles and classifications (F71 counted them covered in P3) are not built: an account's Customer or Prospect role is set when it is created; no role change, classification or later parent change (ss-inventory names each `—`) | P3: as its Built note says |
| F94 | P3 (Built Nov 13): AccountList's next activity and active quotes, and Customer360's Activities, wait for P4's activity scope and P7's quotes; Customer360's Orders tab is an organization reader's (SALES_TEAM_VIEW) until P11 builds the representative's order scope | P3: as its Built note says |
| F95 | P3 (Built Nov 13): the Mantle merge guards admit a caller that disabled authorization (Shop's claim, jobs, every spec that disables it) as before, and the contact administrator's merges now meet the kind, owner and dependency rules; the preview step and its stamp of design-drawers-commons §6 are not built | P3: as its Built note says |
| F96 | P3 (Built Nov 13): the merged party's rows `moveAll` moves are read under the caller's entity filters (as before for orders and invoices), so under a filtered root a row of another organization stays with the merged party; the guards refuse the merge when such an opportunity or agreement exists, but not for other kinds | P3: as its Built note says |
| F97 | P3 (Built Nov 13): `find#Accounts` orders a person after the organizations (a distinct find orders by its selected fields, not a name of either kind) | P3: as its Built note says |
| F98 | P3 (Review Nov 13): R2's admission follows Commons' single `canEdit`, so a Sales account editor also gets the contact record's Organizations, Relationships, Notes and photo edits, and the contact of a shared (`_NA_`) account includes shared people such as Shop guest customers (a person with a user account is left out); add#Contact lets a rep make any person of the scope or shared a contact, and so editable. Narrowing to identity and channels needs a second flag in Commons' forms | P3: as its Review note says |
| F99 | P3 (Review Nov 13): set#AccountManager and delete#Contact change existing rows without the revision read (§2 "Revisions and operations"); both are a single relationship's end and start, so a stale change is the last writer's | P3: as its Review note says |
| F100 | P3 (Review Nov 13): SalesAccess `accountOf` treats a party with no `ownerPartyId` as shared, but find#Accounts and the Party filter (MANTLE_USER_ORG_9) leave such a party out; Party's default is `_NA_`, so only a row written without it differs | P3: as its Review note says |
| F101 | P3 (Review Nov 13): find#Accounts lists Customer and Prospect roles, while `accountOf` also admits a party with the Account role alone | P3: as its Review note says |
| F102 | P3 (Review Nov 13): mark#NotDuplicate asks the guard one way (partyId into otherPartyId), so a pair whose merge is refused that way for a dependency is refused "not a duplicate" to a Sales manager though the other way may be admitted | P3: as its Review note says |
| F103 | P4 (Built Nov 13): the framework's view-board labels a column by its value unless the group field is a status or an enumeration, so a board by an id (a stage) shows ids for its empty columns; the board groups by the stage's name instead, unique in a pipeline. A column-label attribute (or a display field) on view-board is the framework's fix | P4: as its Built note says |
| F104 | P4 (Built Nov 13): the recurring plans have no writer, so the user's call on shared reasons and plans changes only store#LostReason; a plan service, when one is built, takes the same every-organization rule | P4: as its Built note says |
| F105 | P4 (Built Nov 13): `store#Competitor` changes no revision (its rows are not in the deal's revision), so a stale competitor edit is the last writer's; the deal's own revision is checked first | P4: as its Built note says |
| F106 | P4 (Built Nov 13): returning a qualified opportunity to a lead (design §3: a manager, a reason and no placed linked order) and the duplicate candidates in QualifyLead (the account and contact choosers find them) are not built; RelatedSales lists linked orders for a SALES_TEAM_VIEW holder only until P7's and P11's scopes | P4: as its Built note says |
| F107 | P4 (Built Nov 13): the owners choice offers everyone who works for the organization; `create#Opportunity` and `store#OpportunityParty` refuse a representative's choice outside their teams (PERMISSION_DENIED) only on submit | P4: as its Built note says |
| F108 | P4 (Built Nov 13): New lead and New opportunity under Sales leave the organization empty for sales.rep (one organization) in the client, so the walk chooses it; the forms' `newDefaults` map is set as Accounts' is, and why the client shows it empty was not traced | P4: as its Built note says |
| F109 | P4 (Review Nov 13): apply#OpportunityBatch items carry the revision but no operation key (§2 names a batch item among the keyed operations): a retried batch answers REVISION_CHANGED for the items the first try did, not their first result; no data is changed twice | P4: as its Review note says |
| F110 | P4 (Review Nov 13): Marketing's mountRoots row maps Leads and LeadSources only; impl-sales §4 (Nov 11) has Marketing mount Accounts too, so impl-marketing P3 adds `Accounts/Accounts` (and Customer360 if it mounts it) to the row's paths | P4: as its Review note says |
| F111 | P4 (Review Nov 13): other apps default a new record's organization by "the scope's only one" too (Maintenance's Procedures, Equipment and Facilities, Warehouse's PoolList and facility parts, People's Training and ReviewCycles, Shared InspectionTemplates), and Sales' settings screens take the scope's first; a user whose organization has a rollup child meets the same empty field | P4: as its Review note says |
| F112 | P4 (Review Nov 13): create#OpportunityContent has no `allow-remote="false"` (it checks the caller itself, as the other content services do) | P4: as its Review note says |
| F113 | P5 (Built Nov 13): a second `create-from` provider breaks Chat's createFrom, which takes the first result (and a mutation stops at the first refusal), so every app's kind lives in Comms' one provider `boss.records`; a kind-keyed dispatch in `call#Providers` (or a provider declaring its kinds) is the framework's fix | P5: as its Built note says |
| F114 | P5 (Built Nov 13): Customer Service's "Create a case" from a mail is a widgets-extend on MessageDetail (its F121); now that Mail renders message-actions it could move to the slot as Sales' Create lead did | P5: as its Built note says |
| F115 | P5 (Built Nov 13): a Create lead or Create a case action (a transition with hook create-from, or none) is offered to every Comms user and refused on use to one without the app; an ext-action has no permission attribute, and only a screen target is left out by authorization | P5: as its Built note says |
| F116 | P5 (Built Nov 13): Mantle's `call()` disables authorization, and store#LeadIntake treats a caller with authorization disabled as a vouching system caller (as merge#Parties' guards do, §4 Nov 13), so a BOSS screen or service must call it as the user, never through EntityLib's `call`; SalesComms.js does | P5: as its Built note says |
| F117 | P5 (Built Nov 13): the intake's email verification (design §3 "earlier when the inquirer verifies the email") is only the caller's `verified` flag: Sales sends no verification mail, and a party is made only at qualification | P5: as its Built note says |
| F118 | P5 (Built Nov 13): My accounts lists the contacts of accounts the rep manages or has a current deal of; a manager (SALES_TEAM_VIEW) gets the same personal list, not the organization's | P5: as its Built note says |
| F119 | P5 (Built Nov 13): the call-actions slot's ext items come from the Call screen's path; Log call there has no caller's number or account preset (the call's parties are not read), the voicemail's is inbound with its transcript | P5: as its Built note says |
| F120 | P5 (Review Nov 13): purge#LeadIntakes blanks the intake's submitted details, but the lead keeps its name (the mail's subject or the submitted organization), its description (the mail's text, which often carries the sender's phone and signature) and the mail filed on its conversation; whether the purge also blanks or closes an unqualified lead (design §3 "unverified intake records ... are purged") is the user's call | P5: as its Review note says |
| F121 | P5 (Review Nov 13): createLead admits any rule owner who works for the team's organization, with no Sales permission (Maintenance's and Customer Service's rule), and a rule can be run on demand over a folder, so an employee files mail of their own mailbox into any team's queue of their organization; People's Recruiting also asks the owner to hold its edit permission. Requiring SALES_OPPORTUNITY_EDIT or SALES_CONFIGURE of the rule's owner is the user's call | P5: as its Review note says |
| F122 | P5 (Review Nov 13): a mail's Message-ID is the sender's: a mail carrying another's Message-ID first takes that identity, and the later mail answers the first's lead (or SOURCE_TAKEN for another organization) and makes none | P5: as its Review note says |
| F123 | P5 (Review Nov 13): TAG_TAKEN is instance-wide, so a configurer learns that another organization's team uses a plus tag | P5: as its Review note says |
| F124 | P5 (Review Nov 13): with R1 a rep's inquiry from the email of another team's open lead makes a second open lead of the organization, which only the manager's duplicate review sees | P5: as its Review note says |
| F125 | P5 (Review Nov 13): Marketing P13's capture job calls store#LeadIntake as the system, which trusts the organization, team and `verified` it is given: they must come from the publication and Marketing's own verification, never the submission | P5: as its Review note says |
| F126 | Follow-up 1 (Built Nov 13): Accounting's root sets its working organization by the active one else the scope's only one (Accounting.xml, and AccountingPolicy `scope()` in the services), so an accountant of Retail has none chosen; there it is a read filter too (no organization reads every one allowed), so defaulting it to the user's own would narrow their lists and reports. Left as is; the user's call whether Accounting defaults it (or gives new-record forms a default of their own) | Follow-up 1: as its Built note says |
| F127 | Follow-up 1 (Built Nov 13): Insights' report organization (Insights.js) has the same "active, else the only one" fallback for a report's organization; left, as a report choice rather than a new record's | Follow-up 1: as its Built note says |
| F128 | Follow-up 1 (Built Nov 13): "the scope's first" stays in other apps' new-record defaults and services (Purchasing's new orders, bills, quotes, requests and agreements, Products' new categories, features and owners, Prices, People ChecklistTemplates, Maintenance WorkPolicy, CustomerService SavedReplies and Cases, the DataImport contexts, Mantle's catalog and price policies): the first of get#PartyInternalOrgIds' list is the user's own organization before its children, so the rollup case gives the right one there; a user of two organizations of their own gets the first rather than an empty field. Moving them to the rule (with the first as the fallback, as Sales' settings now do) is a consistency change, not this fix | Follow-up 1: as its Built note says |
| F129 | Follow-up 1 (Review Nov 13): Low: Purchasing's get#SharedContext now answers `defaultOrganizationPartyId`, but only Shared InspectionTemplates reads it. Purchasing's own New forms (NewPurchaseOrder, NewQuoteRequest, NewPurchaseRequest, PurchaseOrders, BillList, Quotes, QuoteRequests, PurchaseRequests, AgreementList, SupplierList, MatchExceptions; Suppliers/Settings/Approvals.js) still take "active, else the first". The first is the first row of an unordered PartyRelationship find that also counts PrtMember rows, so for a user of several organizations it is not stable. When these move to the rule, put it ahead of the first, as Sales' settings screens do; Products, Commerce and CustomerService the same | Follow-up 1: as its Review note says |
| F130 | P6 (Built Nov 13): the import's repeat key is a hash of the framework's 43-character row key, as a PostingOperation key holds 40; a framework row key within 40 characters (or a PostingOperation key of 64) would let an owner use it as is | P6: as its Built note says |
| F131 | P6 (Built Nov 13): `docs/security/Attack-Surface.md` (mr-moqui) does not name the `opportunities` import target, the pipeline dataset's row filter or Mantle's user-facts provider; P6 had no mr-moqui worktree, so they are for the next framework docs pass | P6: as its Built note says |
| F132 | P6 (Built Nov 13): the lifecycle transfer of a deal keeps its team: a deal of East moved to a rep of West shows to the new owner and to East, not West's other reps, until a manager sets its team | P6: as its Built note says |
| F133 | P6 (Built Nov 13): Home's funnel counts open opportunities created in the last three years (`createdDate` is the dataset's time field); an older open deal is not in it, while My pipeline shows it | P6: as its Built note says |
| F134 | P6 (Built Nov 13): "My activities due" is not a counter (above): a Sales list of due activities, or a Commons task filter by record kind, would let Home count them | P6: as its Built note says |
| F135 | P6 (Built Nov 13): the purge's "untouched" margin (two minutes after the lead was made) treats an edit in the first two minutes as part of the intake | P6: as its Built note says |
| F136 | P6 (Built Nov 13): `skill/people-policy-question.md`'s description is 201 characters, over the index's 160, so the skill is left out of the index (`./moq test mr-boss --skills` logs it); not Sales', seen while running the retrieval | P6: as its Built note says |
| F137 | P6 (Review Nov 13): the purge's two-minute "untouched" margin: the intake's writes share one transaction, so the intake row's own stamp (read before the purge writes it) plus a second or two would treat fewer early edits as part of the intake | P6: as its Review note says |
| F138 | P6 (Review Nov 13): a deal moved by the lifecycle keeps its team, as a manager's owner change does (`ownerFor` never sets the team): the new owner of another team sees it as owner, the old team's members still see it and the new team's do not until a manager sets the team. Keep (recommended: consistent with store#OpportunityParty, and a team is a queue the manager owns) or set the new owner's only team of the organization is the user's call | P6: as its Review note says |
| F139 | P6 (Review Nov 13): the lifecycle's new owner needs only to work for the record's organization, not to hold any Sales permission, so a deal can be handed to someone who cannot open it (as store#OpportunityParty's `ownerFor`) | P6: as its Review note says |
| F140 | P6 (Review Nov 13): the import ignores a matched deal's `teamPartyId` under Update (only owner, stage and facts change), silently | P6: as its Review note says |
| F141 | P6 (Review Nov 13): Home's funnel is over every organization of the scope, not Home's organization filter (report-embed is given no filter) | P6: as its Review note says |
| F142 | P6 (Review Nov 13): get#OrganizationFacts is `authenticate="false"`: with no user it answers the userId given. It is not remote and the facade calls it as the user; a caller without a user is the runtime's own | P6: as its Review note says |
| F143 | P6 (Review Nov 13): the Built note's findings stand (the repeat key's hash, the funnel's three years, no due-activities counter, the people-policy skill's description) | P6: as its Review note says |
| F144 | P7 (Built Nov 13): F62 is wrong for a BOSS install: Accounting's demo names `LOCAL` on BOSS_ACCT_ORG, so X1 taxes its storeless sales orders with an addressed customer from now on (none of the Accounting specs run changed); a storeless part with no address is left untaxed rather than refused, which an invoice from that order then carries untaxed (ORDER_TAX), as before X1 | P7: as its Built note says |
| F145 | P7 (Built Nov 13): no permission names a quote's free line: P7 asks SALES_APPROVE of the one who enters it (a rep cannot, an approver can); P9's approval policies, or a permission of its own, is the user's call | P7: as its Built note says |
| F146 | P7 (Built Nov 13): Sales' lifecycle participant (P6) transfers deals and managed accounts, not open quotes as F54 and design-admin §14 say; a quote's owner row can follow in P10 or a follow-up | P7: as its Built note says |
| F147 | P7 (Built Nov 13): get#RecordLinkInfo shows a quote's Chatter and files by its organization rule (orderVisible), wider than Sales' assignment scope; the Sales root admits only a quote the user sees (check#Record quote), so the gap is the other roots' and Commons' | P7: as its Built note says |
| F148 | P7 (Built Nov 13): a quote's owner and team are undated OrderPartParty rows (the entity has no dates), so a team change does not end a quote's team from a date, as it does for a deal | P7: as its Built note says |
| F149 | P7 (Built Nov 13): Product360's "add to quote" (design §5's action set) is not built: a line is added from the quote | P7: as its Built note says |
| F150 | P7 (Built Nov 13): `docs/security/Attack-Surface.md` (mr-moqui) does not name `get#SellerProductPrice`, the second in-process price authority beside Shop's; P7 had no mr-moqui worktree | P7: as its Built note says |
| F151 | P7 (Review Nov 13): X1 retaxes a storeless quote at the customer's party address only on the quote's next change: a customer address added after the last change leaves the draft untaxed until then (the note says so). P10's issue should recalculate tax before it issues | P7: as its Review note says |
| F152 | P7 (Review Nov 13): `calculate#OrderSalesTax` itself has no status or billing guard, for a store order as before and now for a storeless one of a gateway seller; the change rules guard it, but mantle.rest.xml's `orders/{orderId}/salesTax/calculate` reaches it directly for a REST user with that grant | P7: as its Review note says |
| F153 | P7 (Review Nov 13): `modify#ProductPriceList` declares `pricingContext` (a Map) and is `allow-remote="false"`: an in-process caller passing one could set `storeAuthority` or `sellerAuthority`; no screen or service does today (Shop's pattern, not P7's) | P7: as its Review note says |
| F154 | P7 (Review Nov 13): find#Quotes' `state: all` includes a quote placed later, so OpportunityDetail's Quotes box and its Orders box will both show an accepted quote once P11 places one; P11 to decide which list owns it | P7: as its Review note says |
| F155 | P7 (Review Nov 13): The Built note's findings stand but the two fixed here (Chatter and files, R1; the lifecycle transfer, R2) | P7: as its Review note says |
| F156 | P9 (Built Nov 13): the approval setting, the templates, response requirements, acceptance thresholds and net-terms option are stored by store#SalesPolicy but shown on SalesDefaults only when P10, P11 and P13 read them; until then a configurer sets them through the service alone | P9: as its Built note says |
| F157 | P9 (Built Nov 13): the commercial revision is set only on a seller's own accounting preference: Retail and the other Ziziwork organizations inherit ORG_ZIZI_CORP's, so SalesDefaults shows where it is set and does not change it there (Accounting's settings own that row) | P9: as its Built note says |
| F158 | P9 (Built Nov 13): a notice is sent when the rep asks for approval; a later line change supersedes the decisions and reads the notices, and the rep asks again (there is no automatic resubmission, unlike Purchasing's placed orders) | P9: as its Built note says |
| F159 | P9 (Built Nov 13): an approval by the topic's handler without a rule named decides every open rule the approver may decide; one the approver may not (another group's) stays open, and a refusal from the list refuses each | P9: as its Built note says |
| F160 | P9 (Built Nov 13): a SapOrder rule warns on every sales order of its seller that meets it, store orders included, so with the setting off such an order waits for a person as §4 says; nothing yet records an order-purpose decision (P11's `approve#Order` direction) | P9: as its Built note says |
| F161 | P9 (Built Nov 13): an amount rule in one currency does not meet a quote in another (no conversion), as Purchasing's bands; design §9's "missing FX blocks" is not built | P9: as its Built note says |
| F162 | P9 (Built Nov 13): `get#RecordLink`'s order-change branch sends a Sales approver to Approvals, not to the change, until P14's OrderChangeDetail | P9: as its Built note says |
| F163 | P9 (Built Nov 13): the Approvals screen's own permission check runs in its always-actions before the artifact deny is reported, so a refused render names PERMISSION_DENIED rather than the authorization (the deny row holds: checked by `isPermitted`) | P9: as its Built note says |
| F164 | P9 (Built Nov 13): `docs/security/Attack-Surface.md` (mr-moqui) does not name the Sales approval verbs; all are `allow-remote="false"` and check SALES_APPROVE or SALES_CONFIGURE and the organization themselves; P9 had no mr-moqui worktree | P9: as its Built note says |
| F165 | P9 (Review Nov 13): any holder of `SALES_APPROVE` in the seller sees a quote once its approval was asked, also one outside the rule's approver group who cannot decide it (design §1.1 "its authorized approver"); narrow it to the approvers of its rules if wanted | P9: as its Review note says |
| F166 | P9 (Review Nov 13): an owner or team reassignment of a quote (OrderPartParty) moves its revision and so ends its approvals, with the commercial revision on too; P10 and P14 may want it counted as not commercial | P9: as its Review note says |
| F167 | P9 (Review Nov 13): OrderDetail's Approve and Refuse send no operation key (a double submit writes a second, identical decision); the list's goes through the notice once | P9: as its Review note says |
| F168 | P9 (Review Nov 13): a rule ended after a free line was drafted under it leaves that line needing no approval when other quote rules remain (the manual-price rule applies only while none is set) | P9: as its Review note says |
| F169 | P9 (Review Nov 13): the Built note's findings stand but the fourth, fixed here (R1) | P9: as its Review note says |
| F170 | P8 (Built Nov 13): the createQuoteRequest rule's owner must hold SALES_QUOTE_EDIT, when the rule is saved and when it runs, applying the user's Nov 13 call on createLead by analogy (check#LeadRuleOwner extended); the user's to confirm | P8: as its Built note says |
| F171 | P8 (Built Nov 13): a chargeable repair's claim is seen (its customer and products, under "Repairs to quote") by every holder of SALES_QUOTE_EDIT or SALES_TEAM_VIEW of the claim's organization, with no assignment scope (a claim has no Sales owner or team), and Customer Service is not told when a quote is made, nor Sales when a claim becomes chargeable (no topic); whether to narrow it to a team or add a notice is the user's call | P8: as its Built note says |
| F172 | P8 (Built Nov 13): Create quote prices each line by the resolver: an unpriced product refuses PRICE_UNAVAILABLE and the rep enters prices on the quote; `create#QuoteFromRequest` takes an entered price and reason per line by its API only (a repair's charge), and a claim carries the faulty product, not a repair service, so a repair's line is that product at the price entered | P8: as its Built note says |
| F173 | P8 (Built Nov 13): Customer Service reads a repair quote's state, total and validity on the claim (get#WarrantyClaim `salesQuotes`), not the quote: OrderDetail, Chatter and files of an unplaced quote follow Sales' scope (P7 review R1), and the customer's consent is still recorded on the decision by hand | P8: as its Built note says |
| F174 | P8 (Built Nov 13): a decline is sent from the mailbox the RFQ came in by, written as the system after Sales' checks: the rep need not be a sender of that mailbox (as send#IntakeConfirmation); an RFQ of no mailbox cannot tell its requester from Sales | P8: as its Built note says |
| F175 | P8 (Built Nov 13): an RFQ's notes (the decline's reason) are RequestNotes the Sales context does not show; Customer360's RFQs tab, OpportunityDetail's RFQ → quote → order strip, Quotes' "RFQ received" list and NewQuote's RFQ field (design §3, §4, §5) are not built | P8: as its Built note says |
| F176 | P8 (Built Nov 13): Sales' lifecycle participant (P6) does not move a leaving user's RFQ owner rows, as it now does quotes' (P7 review R2) | P8: as its Built note says |
| F177 | P8 (Built Nov 13): `moqui lint --screens` counted a gstring idiom in RequestDetail's actions script because a `//` comment held apostrophes (moqui-devkit groovy_convert `string_spans` reads a quote in a comment as a string); the comment was reworded | P8: as its Built note says |
| F178 | P8 (Built Nov 13): `docs/security/Attack-Surface.md` (mr-moqui) says the RFQ address "follows in Sales P8"; P8 had no mr-moqui worktree (the line below) | P8: as its Built note says |
| F179 | P8 (Review Nov 13): a quote made from an RFQ takes its maker's team (SalesQuotes.js teamFor), not the RFQ's: a manager's quote of a team's RFQ is no quote of that team, whose members see only that it exists (R3); passing the RFQ's team to createQuote is the user's call | P8: as its Review note says |
| F180 | P8 (Review Nov 13): Message-ID dedupe is instance-wide, as P5's leads (F122): a mail carrying another's Message-ID makes no RFQ, and a rule on another organization's mailbox answers the first organization's request; a decline goes to the message's Reply-To, as forgeable as its From, shown in the preview | P8: as its Review note says |
| F181 | P8 (Review Nov 13): with no default team in the organization's SalesPolicy a chargeable decision tells nobody (the list still shows it) | P8: as its Review note says |
| F182 | P8 (Review Nov 13): update#QuoteRequest given a new customer alone ends the contact row | P8: as its Review note says |
| F183 | P10 (Built Nov 14): F166 decided as built: an owner or team reassignment and the customer's reference or new-customer mark alone are not commercial changes under the seller's commercial revision; the contact, addresses, terms, lines and validity still are | P10: as its Built note says |
| F184 | P10 (Built Nov 14): the rep's own send goes from the send dialog straight through their mail account (no Compose window, so the message's text is the dialog's message and the organization's cover); a send by anyone else, or a batch, is the organization's on the ledger | P10: as its Built note says |
| F185 | P10 (Built Nov 14): recipients are the customer and its current contacts, employees and representatives, by party; one delivery an issue and party | P10: as its Built note says |
| F186 | P10 (Built Nov 14): the quote PDF has no QR or customer link until P13's PASS link (Mantle names no staff route) | P10: as its Built note says |
| F187 | P10 (Built Nov 14): a credit-held acceptance (design scenario 7) has no regression: a hold comes only from an automatic approval on a covering payment, which a net-terms acceptance never has; respond#Quote reports held from the order's holds, and P11's approval path is where its spec belongs | P10: as its Built note says |
| F188 | P10 (Built Nov 14): Quotes' "Responded" saved list and QuoteList's "last send/response" columns (design §5) are not built: an accepted quote is placed and a declined one is cancelled; the issues show on OrderDetail | P10: as its Built note says |
| F189 | P10 (Built Nov 14): the quote and reminder templates and the stored text locations are set through store#SalesPolicy, not on SalesDefaults (the text has no editor yet; F156 continues for them) | P10: as its Built note says |
| F190 | P10 (Built Nov 14): an acceptance's evidence mail (`evidenceEmailMessageId`) is checked to exist, not to be filed on the quote; the dialog offers the quote's files only | P10: as its Built note says |
| F191 | P10 (Built Nov 14): `docs/security/Attack-Surface.md` (mr-moqui) does not name the issue verbs; P10 had no mr-moqui worktree | P10: as its Built note says |
| F192 | P10 (Review Nov 14): an acceptance's evidence mail (`evidenceEmailMessageId`) is any existing EmailMessage, not one filed on the quote (no screen or tool passes it today; the Built note's finding stands) | P10: as its Review note says |
| F193 | P10 (Review Nov 14): the reminder job reads the oldest 500 unended unexpired issues, and an accepted issue stays unended until it expires, so with many open issues newer ones wait | P10: as its Review note says |
| F194 | P10 (Review Nov 14): `applyQuoteBatch` makes its operation key on the server, so a double submit of the batch is two batches (the ledger and the states keep it from sending twice: a sent recipient is skipped, a withdrawn quote refused) | P10: as its Review note says |
| F195 | P10 (Review Nov 14): Marketing P3's suppression at the attempt reads the organization from the delivery's store; a quote or reminder delivery has none, so only blocks of every organization apply to it, not the selling organization's own | P10: as its Review note says |
| F196 | P10 (Review Nov 14): the Built note's findings stand | P10: as its Review note says |
| F197 | P11 (Built Nov 14): `approve#SalesOrder` records the order rules' decisions with the seller's setting off too (an ORDER_APPROVE approver, separation applied), while a direct `approve#Order` with the setting off ignores the order rules as before (P9); Sales' Approve is stricter than the native one there | P11: as its Built note says |
| F198 | P11 (Built Nov 14): an order approver who is not assigned sees an order only while it is Placed or held, so cannot place a Manual hold on an approved order of another rep unless they also hold SALES_TEAM_VIEW (the demo's BOSS_SALES_APPROVE does not) | P11: as its Built note says |
| F199 | P11 (Built Nov 14): the hold organization check reads the user's own organizations (rollup children included), not the active one; a Customer Service operator who works for a parent organization holds a child's order as before | P11: as its Built note says |
| F200 | P11 (Built Nov 14): the storeless confirmation goes only for Sales' own storeless orders (a direct order, an accepted quote); Projects' storeless orders and Customer Service's replacements send none; the demo seller Retail has no primary email, so its confirmations fail and wait until it has one (P10's R1 rule), as its quote mail does | P11: as its Built note says |
| F201 | P11 (Built Nov 14): find#SalesOrders' To fulfill, Part fulfilled and To invoice read the distinct order ids of every shipment source and billing row before the scoped query; fine for the demo, a subquery when volumes grow; the Awaiting approval list runs check#OrderPreApprove for each row of its page | P11: as its Built note says |
| F202 | P11 (Built Nov 14): Fulfillment and Invoices and payments list rows without links until P14 mounts ShipmentDetail and InvoiceDetail; Print of an order and the Agreements and Changes tabs are not built (P14, P15) | P11: as its Built note says |
| F203 | P11 (Built Nov 14): a placed quote opens in the order context, so its Issues and responses are no longer shown there (the accepted evidence is a line of the header and Overview) | P11: as its Built note says |
| F204 | P11 (Built Nov 14): `get#Opportunity`'s `orders` output is no longer read by OpportunityDetail (Orders from find#SalesOrders); left for other readers | P11: as its Built note says |
| F205 | P11 (Built Nov 14): `docs/security/Attack-Surface.md` (mr-moqui) does not name the order verbs; P11 had no mr-moqui worktree | P11: as its Built note says |
| F206 | P11 (Review Nov 14): with the seller's setting on and no order rule the order meets, `approve#SalesOrder` and `approve#Order` admit the order's own owner who holds SALES_ORDER_APPROVE: separation is per rule (design §5), so the setting alone forces a manual approval but not a second person | P11: as its Review note says |
| F207 | P11 (Review Nov 14): hold#Order's direction check (a Purchase reason only on a purchase part, HOLD_TYPE_DIRECTION) applies to a call with no user too; nothing places one so today | P11: as its Review note says |
| F208 | P11 (Review Nov 14): the hold organization check reuses FacilityScope, so a holder of FACILITY_ALL_ORGANIZATIONS (Warehouse's) holds and releases a Manual or Change hold of any organization's order | P11: as its Review note says |
| F209 | P11 (Review Nov 14): with the setting on, the native `approve#Order` answers an order outside the approver's sales scope ORGANIZATION_DENIED, not as missing (only to a holder of SALES_ORDER_APPROVE) | P11: as its Review note says |
| F210 | P11 (Review Nov 14): SalesOrderApproval's batch feature failed once (successCount 1) on the first run after the master merge with StorelessOrderConfirmation beside it, and passed in the five runs after; no cause found | P11: as its Review note says |
| F211 | P11 (Review Nov 14): the Built note's findings stand. On its first two: Sales' Approve deciding the order rules with the setting off is right to keep (the rule is the seller's ask for separation and leaves an audit of who decided; the native path stays as built, the owner contract); for the unassigned approver, recommend read-only sight of an order they decided (an OrderDecision of theirs), not the organization's approved orders, so they can follow it without SALES_TEAM_VIEW | P11: as its Review note says |
| F212 | P12 (Built Nov 14): a template's own terms and print text (design §5 TemplateHeader) is not built: a quote from a template takes its organization's stored text; a per-template text needs a registered text choice an administrator sets, not a location a manager types | P12: as its Built note says |
| F213 | P12 (Built Nov 14): with no order rule met, `approve#SalesOrder` records no OrderDecision, so the approver who approved such an order loses sight of it once approved (the carry-over covers the orders they decided a rule on); recording a no-rule decision would change P9's rule reading (a decision with no policy is the unconfigured manual-price rule's) | P12: as its Built note says |
| F214 | P12 (Built Nov 14): a template's fixed line keeps the template author as `priceOverrideUserId` on the quote, so that author may not approve the quote's manual-price rule for it (separation by price author, P9); the rep who copied it may | P12: as its Built note says |
| F215 | P12 (Built Nov 14): a template line with no seller's price is stored at 0 with no source (create#OrderItem's default), shown unpriced on the detail and counted 0 in its example total; the preview prices it for the customer chosen | P12: as its Built note says |
| F216 | P12 (Built Nov 14): TemplateFind's category filter (design §5) is not built; a product filter is | P12: as its Built note says |
| F217 | P12 (Built Nov 14): Quote templates is shown to every Sales reader (R), who sees only the published ones; drafts, scheduled and ended templates are the manager's and the administrator's | P12: as its Built note says |
| F218 | P12 (Built Nov 14): `docs/security/Attack-Surface.md` (mr-moqui) does not name the template verbs; P12 had no mr-moqui worktree | P12: as its Built note says |
| F219 | P12 (Review Nov 14): the five report definitions above name only `OrpRecurringTemplate` in their "Not a recurring base order" filter; a template is left out by the dataset's `placedDate` time field, not by the filter, so a panel without a time range would count its lines | P12: as its Review note says |
| F220 | P12 (Review Nov 14): the palette has no Sales link for a template (it falls through to no app); QuoteTemplateDetail is reached from Quote templates | P12: as its Review note says |
| F221 | P12 (Review Nov 14): `decidedBy` counts any decision of the caller, a SapQuote decision on the quote before it became the order included, as the Nov 14 row reads ("a decision on it"); a quote approver who also approves orders keeps read-only sight of that order | P12: as its Review note says |
| F222 | P12 (Review Nov 14): the Built note's other findings stand as written (no per-template terms text, no category filter, the unpriced line at 0 on the detail, Quote templates shown to every reader) | P12: as its Review note says |
| F223 | P13 (Built Nov 14): the PASS operations are camelCase (`findSalesQuotes` …), and the reads GET routes with the token in the authority's query, as Support's; design §10.1 names them `sales.*` | P13: as its Built note says |
| F224 | P13 (Built Nov 14): the issued PDF carries the quote's page for a signed-in contact and its QR, not a bearer link; a forwarded PDF opens nothing, and a customer with no invitation reaches the quote only by the mailed link; quotes issued before P13 carry neither | P13: as its Built note says |
| F225 | P13 (Built Nov 14): a link is made for each mail attempt; a retried delivery's earlier link stays valid until the validity ends or the quote is revised or withdrawn (it was never delivered) | P13: as its Built note says |
| F226 | P13 (Built Nov 14): a link ends with the quote's validity, so after an acceptance its receipt is readable by the link only until then; a contact signs in afterwards | P13: as its Built note says |
| F227 | P13 (Built Nov 14): above the threshold the customer's own verified account (a person customer, the self relationship) accepts signed in, as an invited contact does; design §10 names only the invited contact | P13: as its Built note says |
| F228 | P13 (Built Nov 14): a contact invited to Sales sees every issued quote of its customer at that organization (no per-contact narrowing, as Support's customer administrator has); `invite#Contact` takes no administrator flag for `sales` | P13: as its Built note says |
| F229 | P13 (Built Nov 14): nothing tells the quote's owner of a customer's online acceptance or decline (the order is placed and listed; the response shows on OrderDetail) | P13: as its Built note says |
| F230 | P13 (Built Nov 14): the Account hub's card shows only for an account acting for a customer of the organization (Support's always shows) | P13: as its Built note says |
| F231 | P13 (Built Nov 14): Invite to Sales on Customer360's header says why it is not offered to an inviter (no published PASS Sales site, not a customer account, no address); the demo has no Sales site, so every inviter sees the reason | P13: as its Built note says |
| F232 | P13 (Built Nov 14): SalesDefaults' dialog did not show P10's PO requirement and reminder days (their fields were in no row of its layout); fixed | P13: as its Built note says |
| F233 | P13 (Built Nov 14): a customer's response runs below the portal's checks with artifact authorization disabled, as Support's; place#Order and P11's net-terms approval run with no user (the response's `recordedByUserId` empty), and the storeless confirmation still follows | P13: as its Built note says |
| F234 | P13 (Built Nov 14): `docs/security/Attack-Surface.md` (mr-moqui) does not name PASS Sales; P13 had no mr-moqui worktree (the text below) | P13: as its Built note says |
| F235 | P13 (Review Nov 14): a quote link's token is in the sent mail's stored body (the rep's own send saves a draft; the ledger's `send#EmailTemplate` keeps the message), so a reader of the organization's sent mail can open the link and, below the threshold, accept or decline as the customer (the response records the capability); Billing's and Support's links are kept the same way | P13: as its Review note says |
| F236 | P13 (Review Nov 14): once answered, a link and a contact read the quote's lines and totals from the order as it is now (`offerOf(order)`), so a later commercial change of the placed order (P14) would show as the quote; the PDF stays the issued offer. For P14 or P17 to read the issue's own lines or show the order instead | P13: as its Review note says |
| F237 | P13 (Review Nov 14): a refusal from below the checks that is not a listed code (`place#Order`, P11's net-terms approval) reaches the page with its text when the authority's internal-text filter passes it | P13: as its Review note says |
| F238 | P13 (Review Nov 14): `invite#Contact` for `sales` (not remote) takes any address and any Customer of the organization; only invite#SalesContact narrows it to an account of the scope and the contact's own address. Only BOSS's template calls it for `sales` today | P13: as its Review note says |
| F239 | P13 (Review Nov 14): the Built note's findings stand; the two user's calls are recorded in §4 (Nov 14) and design §10 | P13: as its Review note says |
| F240 | P14 (Built Nov 14): editing a filed commercial proposal is not offered in Sales: save#OrderChange's edit (`actions.save`) asks ORDER_CHANGE_REQUEST and Customer Service's Edit form has its own kinds' fields; a Sales filer withdraws and files again | P14: as its Built note says |
| F241 | P14 (Built Nov 14): BILLING_CONFLICT for a finalized invoice is checked at apply but the spec meets it only in the preview: a shipped and invoiced line answers ALREADY_SHIPPED first, and a line billed but not shipped needs an invoice made outside the order's flow | P14: as its Built note says |
| F242 | P14 (Built Nov 14): a packed price line's draft invoice is released only by an applier who also holds RECEIVABLE_EDIT; otherwise the change waits and nothing tells Accounting (no handoff notice) | P14: as its Built note says |
| F243 | P14 (Built Nov 14): the change operator's read-only reach shows the organization's Placed, Processing, Approved and held orders on Orders too, and a completed order (all shipped) leaves their sight, so a change operator cannot open the shipment of a completed order | P14: as its Built note says |
| F244 | P14 (Built Nov 14): the preview's tax effect is an estimate at the order's current tax rate; a store order's shipping and promotions are recalculated by handle#OrderMajorChange while the order is held | P14: as its Built note says |
| F245 | P14 (Built Nov 14): a price change marks the line's manual price with the applier as `priceOverrideUserId`, the change and its reason as the reason | P14: as its Built note says |
| F246 | P14 (Built Nov 14): `SALES_TEAM_VIEW` among find#OrderChanges' read permissions lets a Sales manager or reader also list the organization's cancel and substitute proposals | P14: as its Built note says |
| F247 | P14 (Built Nov 14): SalesAccess has no P14 feature: the holder and non-holder on apply are in mr-boss SalesOrderChanges and another organization's refusal in Mantle SalesOrderChanges (one setup each) | P14: as its Built note says |
| F248 | P14 (Built Nov 14): Sales' ShipmentDetail and InvoiceDetail have no regression render (their reads are Mantle-checked; the acceptance test opens the shipment) | P14: as its Built note says |
| F249 | P14 (Built Nov 14): `docs/security/Attack-Surface.md` (mr-moqui) does not name the commercial apply; P14 had no mr-moqui worktree | P14: as its Built note says |
| F250 | P14 (Review Nov 14): a fully packed sales order goes Completed before it ships, so a commercial change of it is refused by hold#Order's ORDER_HOLD_STATE (not a named change conflict, and the preview does not show it), and it leaves the change operator's sight; met while writing R4 | P14: as its Review note says |
| F251 | P14 (Review Nov 14): a new line's price is the seller's price at apply; the approval binds the proposal's revision, not that price, so a price list change between the decision and apply is applied at the new price under the old approval (STOCK_CHANGED only against the applier's own preview). Storing the previewed price on the RequestItem (in the revision) would bind it | P14: as its Review note says |
| F252 | P14 (Review Nov 14): save#OrderChange admits a Sales filer editing another person's commercial proposal on an order they may file on (as Customer Service's staff may); Sales offers no Edit, so only a direct call reaches it | P14: as its Review note says |
| F253 | P15 (Built Nov 14): the guard admits an agreement with no status by its dates alone (Products' ProductPriceLists and Customer Service's service agreements are made so); a raw Agreement row written without a status, by REST or an import, would price without activation; making the status required is the user's call (it changes Products' spec and Customer Service's SLA reading) | P15: as its Built note says |
| F254 | P15 (Built Nov 14): Products' price editor (Customer prices, `store#ProductPrice` with `PRICE_EDIT`) still writes a sales agreement's row directly, with PricePolicy checking only the agreement's organization; Purchasing refuses its agreements' rows there ("changes on the agreement"); Sales leaves it open (design §7 names the Products editor for AgreementPrices) and activation checks the rows' currency and parties, but a row added to an active agreement in Products is not checked | P15: as its Built note says |
| F255 | P15 (Built Nov 14): the seller's authority with two current agreements with one customer takes the latest-started one's row first; no rule stops two overlapping active agreements of one customer | P15: as its Built note says |
| F256 | P15 (Built Nov 14): `get#SalesAgreement`'s linked lines and `find#SalesAgreements`' orderId read the quotes and orders the caller sees, so the agreement keeper (no quote or order of their own) sees none; a keeper who should see them needs `SALES_TEAM_VIEW` | P15: as its Built note says |
| F257 | P15 (Built Nov 14): a template's terms and print text, an agreement's print and stored approved PDF, ContractSchedules, the agreement as a Commons record link in the palette's other roots, and Customer Service's and Accounting's AgreementDetail contexts are not built | P15: as its Built note says |
| F258 | P15 (Built Nov 14): `docs/security/Attack-Surface.md` (mr-moqui) does not name the agreement services or the guard; P15 had no mr-moqui worktree | P15: as its Built note says |
| F259 | P15 (Review Nov 14): the Built note's first finding stands for the user (an agreement with no status prices by its dates alone); with R1 a raw AgrSales row is no longer writable through Products, so the remaining path is an Agreement written by REST, an import or entity data | P15: as its Review note says |
| F260 | P15 (Review Nov 14): Products' price-list editor (`store#ProductPriceList`, PriceLists.js) may still attach a price list to a customer agreement under `PRICE_EDIT`; the guard applies it only while the agreement is active, but the list is not on the agreement's revision or activation checks | P15: as its Review note says |
| F261 | P15 (Review Nov 14): `salesAgreementContent` (BOSS) adds a document, which counts as acceptance evidence, to an agreement of any status and names no revision (it checks `agreementEdit` and the organization) | P15: as its Review note says |
| F262 | P15 (Review Nov 14): the Built note's fourth and fifth findings stand (the keeper sees linked lines only of quotes and orders they read; the template print, contract schedules and the other apps' AgreementDetail contexts are not built) | P15: as its Review note says |
| F263 | P17 (Built Nov 14): the PASS operations are `findSalesOrders`, `getSalesOrder` and `getSalesOrderDocument`, GET reads; design §10.1 names them `sales.findOrders` and `sales.getOrder` | P17: as its Built note says |
| F264 | P17 (Built Nov 14): the order's PDF is the stored confirmation as placed; an order with none (Projects' or Customer Service's storeless orders, which send no confirmation, P11) shows no PDF, and has no link either, though a signed-in contact sees it under My orders | P17: as its Built note says |
| F265 | P17 (Built Nov 14): PASS Sales shows storeless orders only (F42): a customer who also buys in the organization's store follows those orders in Shop | P17: as its Built note says |
| F266 | P17 (Built Nov 14): an order being changed (OrderBeingChanged), cancelled or rejected is not shown, so while P14's commercial change holds an order in a change its link and My orders show it as not available; a cancelled order disappears from My orders | P17: as its Built note says |
| F267 | P17 (Built Nov 14): a contact invited to Sales reaches Billing and Support only with its own invitation to each (contact grants are per app); a person customer's own verified account reaches all three; the page links each only where the site's mount of it serves the same organization | P17: as its Built note says |
| F268 | P17 (Built Nov 14): an order link lasts 366 days, as Shop's, is made at each delivery attempt (an uncertain attempt's earlier link stays valid, as P13's quote links), is never revoked but by the order's cancellation (resolve refuses a cancelled order), and its token stays in the stored confirmation mail as F235's | P17: as its Built note says |
| F269 | P17 (Built Nov 14): F236 is settled by the revision: it relies on the seller counting commercial changes only (required to issue); a placement or approval that moved the revision would hide an accepted quote's lines too (not seen for an organization without a tax gateway; not checked with a storeless tax gateway) | P17: as its Built note says |
| F270 | P17 (Built Nov 14): master's ForumSchema.js and mr-pass Schema.js had diverged (P13 and Dogfood DG6 merged in opposite orders), failing mr-pass Forum's copies check; fixed here by making Mantle's copy equal | P17: as its Built note says |
| F271 | P17 (Built Nov 14): My orders filters by state and by the order or PO, not by a date range (design's MyOrderFind) | P17: as its Built note says |
| F272 | P17 (Built Nov 14): `docs/security/Attack-Surface.md` (mr-moqui) does not name PASS Sales' orders; P17 had no mr-moqui worktree (the text below) | P17: as its Built note says |
| F273 | P17 (Review Nov 14): Built finding 4 (orders being changed hidden) does not hold against P14 (above); a cancelled order still leaves My orders and its link reads not available, which may be worth the user's look (a customer may want to see that it was cancelled) | P17: as its Review note says |
| F274 | P17 (Review Nov 14): an order link admits Support's request pages for that order (a cancellation request is a write by the link's reader), as Shop's order link does; with F235 a reader of the organization's sent mail can file one as the customer | P17: as its Review note says |
| F275 | P17 (Review Nov 14): signed-in reads by order ID are not rate limited (as P13's quote reads); every token lookup is | P17: as its Review note says |
| F276 | P17 (Review Nov 14): the PDF is the confirmation as placed; after a commercial change the page shows the order now and the PDF the order as placed (P14 stores its changed document separately), with no label saying so | P17: as its Review note says |
| F277 | P17 (Review Nov 14): the Built note's other findings stand (operation names, storeless only, no date filter, contact grants per app) | P17: as its Review note says |
| F278 | P18 (Built Nov 14): SALES_FORECAST_EDIT is granted to the representative, beside the manager and the administrator, so a rep submits their own forecast as design §8 and the usable-when have it; design §1.1's table did not list it for the rep (the user's call) | P18: as its Built note says |
| F279 | P18 (Built Nov 14): OrderPartParty carries no dates, so order and invoice attribution is the order part's current representative, not one dated at the order's placement; an order whose owner changes later moves its amount to the new owner, and two representative rows leave it unassigned | P18: as its Built note says |
| F280 | P18 (Built Nov 14): an invoice is attributed only through OrderItemBilling to its order; a sales invoice of no order is unassigned and shown only to a SALES_TEAM_VIEW holder; a written-off invoice counts as finalized | P18: as its Built note says |
| F281 | P18 (Built Nov 14): the won amount is a won deal's estimated amount (SalesOpportunity has no separate won amount), counted in the period of its latest close; a deal reopened and won again counts once, in its latest close's period | P18: as its Built note says |
| F282 | P18 (Built Nov 14): a target's audit history (quota, basis, the reason) is kept in the audit log but no screen shows it (AuditChanges reads no SalesForecast projection, F57's rule) | P18: as its Built note says |
| F283 | P18 (Built Nov 14): `ensure#SalesPeriods` makes calendar-year periods only; an organization whose sales year is offset enters its periods otherwise (the forecast accepts its Fiscal periods too) | P18: as its Built note says |
| F284 | P18 (Built Nov 14): an allocation's overlap check reads a category's direct members, not its sub-categories (ProductCategoryRollup) | P18: as its Built note says |
| F285 | P18 (Built Nov 14): a deal's list is capped at 2,000 deals for one key, as are a period's orders and invoices; past that a measure would undercount without saying so | P18: as its Built note says |
| F286 | P18 (Built Nov 14): `docs/security/Attack-Surface.md` (mr-moqui) does not name the forecast services; P18 had no mr-moqui worktree | P18: as its Built note says |
| F287 | P18 (Review Nov 14): `merge#Parties` re-points SalesForecast's `internalPartyId`; merging two people who both have a forecast for one key would fail on `SALES_FCST_KEY` (a person with a forecast is an internal representative, rarely merged) | P18: as its Review note says |
| F288 | P18 (Review Nov 14): a sales manager holding `SALES_TEAM_MANAGE` may set their own target and their organization's (no separation rule names targets) | P18: as its Review note says |
| F289 | P18 (Review Nov 14): Targets' list refuses past 2,000 forecasts of one organization without a screen message (find#Targets' refusal is cleared like any load error there) | P18: as its Review note says |
| F290 | P16 (Built Nov 14): with `copyPayment=false` a native base's generated order has no payment, so it is never auto-approved and auto-invoice (which bills only a part approved at its placement) bills nothing; native renewals wait for an approver, and a renewal payment through Accounting's attempt with recorded consent (design §7) is not built for native bases | P16: as its Built note says |
| F291 | P16 (Built Nov 14): the cadence is read in the base's zone by a wall-clock shift; around a clock change an occurrence at the repeated or skipped hour may move by that hour; a zone-aware cron reader in the framework would remove it (`ec.service.nextCronExecution` with a zone) | P16: as its Built note says |
| F292 | P16 (Built Nov 14): a base has no detail screen (Sales' OrderDetail does not show a template); RecurrenceList's first column is not a link, and the base's lines are seen only as its amount | P16: as its Built note says |
| F293 | P16 (Built Nov 14): missed occurrences are not each made: as the native worker, one order for the latest due occurrence (a base down for two months makes one order) | P16: as its Built note says |
| F294 | P16 (Built Nov 14): the job now runs native bases one after another in its own call, not asynchronously; a long list of due bases lengthens the job run | P16: as its Built note says |
| F295 | P16 (Built Nov 14): readers that still list an approved base as an order, low or display only (from the sweep): Commerce's palette and store-order record (Commerce.js orderSearch, readStoreOrder), Commerce's call context and store customers' counts (StoreOperations.js storeCallRecords, findStoreCustomers), Accounting's order detail offering Invoice (the backend refuses), `get#CustomerFinance`'s order list, Projects' order-line picker (BillingServices.xml), the bulk part status change (OrderBulkServices.xml), projected inventory (`MantleInventoryOrderItem` document, no purpose condition), `notify#OrderHighPriority` and `DropShip.js approved()` on a base re-approved; and readers that leave a base out only because it has no placed date (SalesAnalysis.js and its screen without a date filter, MarketingSegments.js, the `mantle-sales-orders` and `mantle-sales-items` datasets and the `mantle-sales-daily-floor` alert) | P16: as its Built note says |
| F296 | P16 (Built Nov 14): find#SalesSubscriptions and find#RecurringSalesOrders read up to 500 candidates and filter by scope in the script; fine for the demo, a joined query when volumes grow | P16: as its Built note says |
| F297 | P16 (Built Nov 14): a Sales reader of the organization sees its store contracts (customer, product, paid-through, next renewal and amount) whatever their own assignments, as agreements are read (P15); no payment method or consent is returned | P16: as its Built note says |
| F298 | P16 (Built Nov 14): `docs/security/Attack-Surface.md` (mr-moqui) does not name the recurrence services; P16 had no mr-moqui worktree | P16: as its Built note says |
| F299 | P16 (Review Nov 14): with no payment copied a native renewal waits in Awaiting approval every period, and `recurAutoInvoice` never bills (it bills only a part approved at placement), while Accounting's Recurring invoices still says "Invoiced on approval"; Accounting's renewal payment attempt with recorded consent (design §7) is not built for native bases | P16: as its Review note says |
| F300 | P16 (Review Nov 14): `clone#Order`'s `productItemsOnly` default: a base and each order made from it repeat only the product lines, so the source's shipping charge, discount and tax lines are not repeated and nothing computes tax at placement; a generated order's total is its product lines alone (the native worker had the same default; P16 newly makes Sales' bases through it) | P16: as its Review note says |
| F301 | P16 (Review Nov 14): a base made from a store order keeps its store, so its generated orders follow the store's rules (approval delay, store mail) | P16: as its Review note says |
| F302 | P16 (Review Nov 14): the clock-change hour (Built finding 2, as judged above) | P16: as its Review note says |
| F303 | P16 (Review Nov 14): the Built note's other findings stand: no base detail screen; missed occurrences make one order; the job runs native bases in series; 500-candidate reads filtered in the script; a Sales reader sees the organization's store contracts | P16: as its Review note says |
| F304 | P19 (Built Nov 14): "Quote expiring in N days" is not shipped as an alert template: an alert reads a dataset and no quote dataset exists; Home's counter and Insights' Sales.QuotesExpiring attention provider show them. A quote dataset (document, feed, Sales' quote row filter) would let it be built | P19: as its Built note says |
| F305 | P19 (Built Nov 14): the stalled-deal alert measures stage movement (`stageEnteredDate`), not every activity: a logged call or task does not touch the deal, so a worked deal sitting in one stage still fires | P19: as its Built note says |
| F306 | P19 (Built Nov 14): Pipeline analysis' next-activity coverage is of the open tasks now, not as of the report time (said on the screen) | P19: as its Built note says |
| F307 | P19 (Built Nov 14): a deal's past state is read from its audit log; a deal loaded with audit off (data files) reads as it is now before its first logged change, and a deal closed before the log counts by its stored close only | P19: as its Built note says |
| F308 | P19 (Built Nov 14): Sales analysis for a Sales reader takes the organization's own fiscal and sales periods, not those of an organization it rolls up to (Accounting's reader keeps the rollup), and with no period or days the organization's fiscal month holding today, else the calendar month; an issued line's cost in another currency than the sale's is unknown, never converted | P19: as its Built note says |
| F309 | P19 (Built Nov 14): the readiness checks for jobs and mail templates have no place of their own to fix them (Admin's jobs and mail relays are framework routes with no route key), so they point to Readiness; a development instance with no SMTP host shows the templates check as a warning | P19: as its Built note says |
| F310 | P19 (Built Nov 14): the report catalogue keeps no saved filters or last run (design §8's SalesReportCatalogue fields); a list's saved finds are kept | P19: as its Built note says |
| F311 | P19 (Built Nov 14): a flow target with an organization parameter is opened with the map's organization (FlowMaps.js), so the quote step links to Quotes of that organization | P19: as its Built note says |
| F312 | P19 (Built Nov 14): carry-over: staff may now issue a new OrderView link for a cancelled storeless order (create resolves by the same rule); a link's reader can still file a Support question on a cancelled order (intended by §4); the cancelled order's PDF is the confirmation as placed, with no cancelled label | P19: as its Built note says |
| F313 | P19 (Built Nov 14): `docs/security/Attack-Surface.md` (mr-moqui) is not updated: P19 had no mr-moqui worktree (texts below) | P19: as its Built note says |
| F314 | P19 (Review Nov 14): the plan (P19's Insights registrations) and design §8 L6 ship the alert template "quote expiring in N days"; it is not built (no quote dataset). Building it needs a quote dataset (document, feed, Sales' quote row filter, grants and admission) beside the alert JSON; Home's counter and Insights' Sales.QuotesExpiring attention provider show expiring quotes now. Required by the plan, so the user's call: build it (a follow-up) or accept the attention provider in its place | P19: as its Review note says |
| F315 | P19 (Review Nov 14): "deal with no activity for N days" is built as "no stage movement" (`stageEnteredDate`): a logged call or task does not reset it, so a worked deal sitting in one stage fires; the design's wording asks for activity | P19: as its Review note says |
| F316 | P19 (Review Nov 14): the "weekly pipeline and forecast digest" is the pipeline dashboard alone; forecasts are not in it (no forecast dashboard exists) | P19: as its Review note says |
| F317 | P19 (Review Nov 14): the readiness additions (jobs, templates, approval rules) have no spec | P19: as its Review note says |
| F318 | P19 (Review Nov 14): a cancelled storeless order's confirmation PDF carries no cancelled mark | P19: as its Review note says |
| F319 | Follow-up 2 (Built Nov 14): the invoice is left as `create#EntireOrderPartInvoice` makes it (InvoiceInProcess), as Accounting's Invoice from order and the worker's old branch left it; Shop finalizes its renewal's invoice after the capture, a native renewal's waits for Accounting to finalize it with its other drafts | Follow-up 2: as its Built note says |
| F320 | Follow-up 2 (Built Nov 14): the trigger is the order header's approval; a generated order of several parts approved part by part (a credit hold on one part) is billed for the parts approved when the header becomes approved, and a part approved later only by Accounting's Invoice from order (`invoice#RecurringOrder` is internal); Sales' bases repeat one-part orders in practice | Follow-up 2: as its Built note says |
| F321 | Follow-up 2 (Built Nov 14): an order whose header returns to Approved (`checkStillComplete` after a return) runs the rule again, which bills nothing (a part already billed is skipped, and `create#FulfillmentInvoice` keeps one invoice for a source) | Follow-up 2: as its Built note says |
| F322 | Follow-up 2 (Built Nov 14): a base made in P16 holds product lines only; it repeats them as before until it is made again from its source (editing its schedule does not copy lines) | Follow-up 2: as its Built note says |
| F323 | Follow-up 2 (Built Nov 14): a storeless seller with no tax gateway: its generated orders repeat the source's tax lines as they were entered (nothing recomputes them, as X1 leaves such an order untouched); a store with no tax gateway drops them, as the store's own path does | Follow-up 2: as its Built note says |
| F324 | Follow-up 2 (Built Nov 14): a generated order the gateway cannot tax (TAX_ADDRESS_MISSING, TAX_RATE_MISSING) now fails its occurrence with that reason, kept on the base as "Last run failed"; before, X1's step during the clone would have refused it the same way | Follow-up 2: as its Built note says |
| F325 | Follow-up 2 (Review Nov 14): R1 above (medium): a recurring order could be invoiced twice when two approvals' tx-commit rules ran at once; fixed | Follow-up 2: as its Review note says |
| F326 | Follow-up 2 (Review Nov 14): A legacy base (made recurring before Sales, not marked `OrpRecurringTemplate`) with `recurAutoInvoice` Y is billed on approval too. Before, it was billed only when approved at placement, which never happened with no payment copied. That matches §4's call ("a native recurring order"), but its auto-invoice may have been set through Mantle's `update#OrderRecur`, without Sales' `RECEIVABLE_EDIT` check | Follow-up 2: as its Review note says |
| F327 | Follow-up 2 (Review Nov 14): `clone#Order` maps a child's parent only when the parent's id sorts before it, which is how Mantle creates lines. A child listed before its parent keeps the source's id, as every child did before | Follow-up 2: as its Review note says |
| F328 | P20 (Built Nov 14): the RFQ acknowledgement and the agreement print of §16 (P20's list) are not built: the RFQ's decline mail is P8's, and AgreementDetail has no print or stored approved PDF (F257); a later row (§7) or a follow-up, for the lead or the user | P20: as its Built note says |
| F329 | P20 (Built Nov 14): the pipeline document's derived owner, team and stage label were mapped as numbers from P6 on (fixed above): the stalled-deal alert never fired and the owner panel showed nothing; any other app's DataDocument with an expression field it splits or filters on as text has the same trap (not swept) | P20: as its Built note says |
| F330 | P20 (Built Nov 14): InsightsAlerts failed from P19 to here (fixed above): P19's runs did not include it | P20: as its Built note says |
| F331 | P20 (Built Nov 14): Sales' record-lookup provider answers leads and opportunities only (SalesComms.js `lookup`), where design §1.4 also names quotes and orders; coverage, not a leak | P20: as its Built note says |
| F332 | P20 (Built Nov 14): QuoteRequestDetail's "Create quote" (`template/SalesQuoteRequests.xml` rfqCreateQuote) passes no `salesOpportunityId`, so a quote made from an RFQ cannot carry its deal from the screen, though `create#QuoteFromRequest` takes one | P20: as its Built note says |
| F333 | P20 (Built Nov 14): `ironstone.sales` Sales.js defines `recordKinds.orderChange` twice (P9's and P14's); the later silently replaces the first | P20: as its Built note says |
| F334 | P20 (Built Nov 14): several native services the design has Sales call are not called: header, part, line, address and agreement price edits are written inside Sales' own services (update#Quote, store#QuoteLine, apply#OrderChange, store#AgreementItem); the inventories say so | P20: as its Built note says |
| F335 | P20 (Built Nov 14): john.doe's Customer360 under Sales also offers Customer Service's tabs beside Sales' (Orders and SalesOrders, Agreements and SalesAgreements, Activities and ServiceActivities): probably ADMIN holding both apps' permissions, not checked with a plain Sales user | P20: as its Built note says |
| F336 | P20 (Built Nov 14): `screen/Shared/Customer360/SalesOrders.xml`'s comment says the tab is SALES_TEAM_VIEW-only "until P11"; P11 did not widen it | P20: as its Built note says |
| F337 | P20 (Built Nov 14): Marketing's public lead page (`PASS:Marketing/SubmitForm`, impl-marketing P13) is not built yet; the inventories say so | P20: as its Built note says |
| F338 | P20 (Review Nov 14): the RFQ acknowledgement answers only a sender matched to a contact or account of the organization (the ledger needs a recipient party, and an unknown From is the address a forged or bulk mail gives); a new prospect's first RFQ by mail gets none. A user's call if every sender should get one (it would need a recipient for an unknown address and a rate limit per address) | P20: as its Review note says |
| F339 | P20 (Review Nov 14): `get#QuoteRowFilter` does not repeat `quoteOf`'s customer-not-internal and first-part rules (a quote with an internal customer, or a second part, would be a dataset row its reader cannot open); `create#Quote` makes neither, so not reachable through Sales today | P20: as its Review note says |
| F340 | P20 (Review Nov 14): Sales' change operator may send the confirmation of any applied change of an order of their sales scope, Customer Service's cancel and substitute kinds included (`mayApply` names no kind); it sends only the stored PDF to the customer's own addresses | P20: as its Review note says |
| F341 | P20 (Review Nov 14): the access walk and the sweeps (acceptance, not run by the reviewer) do not cover the agreement print or the SalesDefaults field; SalesAccessWalk's print checks would take `Agreements/AgreementDetail/salesAgreementPrint` beside the quote's | P20: as its Review note says |
| F342 | P20 (Review Nov 14): the Built note's findings stand otherwise (the record-lookup provider's leads and deals only, QuoteRequestDetail's Create quote without the deal, native services written inside Sales', john.doe's doubled Customer360 tabs, Marketing's public lead page) | P20: as its Review note says |
| F343 | Follow-up 3 (Built Nov 14): SalesOrderApproval's batch flake (F210) was the confirmation's revision raised after placement on a service worker; fixed in the spec. Other specs that place a storeless direct order of a seller counting every change and then act on its revision at once have the same race; none was seen failing | Follow-up 3: as its Built note says |
| F344 | Follow-up 3 (Built Nov 14): MaintenancePlans' P14 feature fails on master's mr-boss with this worktree's runtime ("33.3% on time" not in the Preventive compliance report), alone as well; not looked into here (out of scope) | Follow-up 3: as its Built note says |
| F345 | Follow-up 3 (Review Nov 14): MaintenancePlans' P14 feature depended on the clock (R1). Other Maintenance specs and walks that assert outcomes around the demo's fixed November dates may turn the same way as the calendar moves. None other was seen failing today | Follow-up 3: as its Review note says |
| F346 | Follow-up 4 (Built Nov 14): SmithyMirrors and SmithyIssues (mr-mantle) both create PublicSite `SMI_SITE`, so the second to run on one database fails its setup; a spec-own site id in one of them fixes it (not changed here: out of this follow-up's scope) | Follow-up 4: as its Built note says |
| F347 | Follow-up 4 (Built Nov 14): TextFiling (mr-boss) and SalesRecurrence's base feature (mr-mantle) failed in a serial run of their whole component and pass alone: order or timing dependent, not looked into | Follow-up 4: as its Built note says |
| F348 | Follow-up 4 (Built Nov 14): PayConfiguration (mr-mantle, 10.2 s in a loaded serial run, 7.8 s alone) and AccountingAccess (mr-boss, 9.5 s) are the next nearest the limit; not split (under 12 s) | Follow-up 4: as its Built note says |
| F349 | Follow-up 4 (Review Nov 14): Two specs used the same spec-local ids (R1), and two read shared demo or list data that other specs change or grow (R2, R3). These pass alone and fail only in a full serial run. A spec-local id prefix, and a lookup by id rather than a first page, keep them apart | Follow-up 4: as its Review note says |

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
  funnel with Insights' later funnel. Sales registers no audit projection (F57): whether a business entity belongs in
  Admin's AuditChanges is Admin's F257, the user's call.
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
