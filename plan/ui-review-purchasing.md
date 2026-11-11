# IronStone BOSS — UI review: Purchasing

Contents: [scope and sources](#1-purpose-scope-and-sources) · [method](#2-review-method-and-refinement-criteria) ·
[screen inventory](#3-screen-and-surface-inventory) · [activities](#4-end-to-end-activities) ·
[verification](#5-existing-checks-and-future-verification) · [running record](#6-coverage-findings-and-running-record) ·
[decisions](#7-decisions).

## 1. Purpose, scope and sources

Review and refine Purchasing through the work of requesters, buyers, planners and approvers: identify a need, choose
a supplier, obtain and compare offers, authorize a commitment, communicate the current order, resolve receipt and
bill exceptions, and explain the result. Follow the same demand through requests, RFQs, awards, purchase orders,
receipts, returns and financial handoffs. The workspace should make the buying organization, supplier, document
revision, quantity basis, currency, authority and next useful action clear without requiring knowledge of the data
model. Substantial navigation and layout refinements may be proposed where they improve an implemented workflow.

This follows [Products](ui-review-products.md), [Accounting](ui-review-accounting.md) and the
[document convention](design-doc-guide.md#ui-review-and-refinement-phase). Research records reference patterns,
design specifies behavior, implementation records construction, and this document plans and records review of the
implemented experience. Keep its inventory, activities, findings, coverage, decisions and bounded execution notes
together.

**Status: planning only, 2026-11-10 America/Chicago.** This document was researched and written as part of the four-app
documentation batch. All live activity and mode coverage starts pending. No runtime, browser walkthrough, output
generation, test run or business mutation was performed to write it. Prior implementation results and available
tests identify useful starting points; they do not establish a passed Purchasing review. This document does not
authorize acceptance runs or construction of absent features.

### Inputs and reference patterns

Other review plans in this batch: [Warehouse](ui-review-warehouse.md),
[Manufacturing](ui-review-manufacturing.md) and [Customer Service](ui-review-customer-service.md).

- [Purchasing design](design-purchasing.md), [implementation](impl-purchasing.md) and
  [research](research-purchasing.md). Historical design-review decisions are traced through these current records;
  removed review files are not required inputs.
- [Accounting review](ui-review-accounting.md), [Products review](ui-review-products.md),
  [Projects review](ui-review-projects.md), [drawers, Commons and Comms review](ui-review-drawers-commons.md),
  [framework UI review guide](../../../../docs/dev/UI-Review.md),
  [application practices](../../../../docs/dev/Practices-App-Dev.md), [style guide](style-guide.md) and
  [crosscut design](design-crosscut.md).
- Current `screen/Purchasing.xml`, `screen/Purchasing/`, mounted `screen/Shared/` definitions and their descendants,
  `template/Purchasing*.xml`, `service/ironstone/purchasing/`, the catalog shared-context implementation, and
  `MoquiConf.xml`. Shared source ownership and app context matter more than the physical filename.
- `data/BossSetupData.xml`, `BossUsersDemoData.xml`, `BossPurchasingDemoData.xml`,
  `BossZPurchasingPortalDemoData.xml`, the existing Warehouse/Accounting/Manufacturing demo families, and
  `service/ironstone/purchasing/SupplierPortalDemo.js`.
- Current BOSS Purchasing regression, acceptance and client registrations; Mantle purchase, sourcing, supplier,
  agreement, replenishment, receipt, return and portal services and specs; PASS Supplier pages and registrations.
  Relevant baseline services remain Mantle's, not a new Purchasing implementation beside them.
- Neighboring [Warehouse](design-warehouse.md), [Manufacturing](design-manufacturing.md),
  [Customer Service](design-customer-service.md) and [Accounting](design-accounting.md) contracts, plus
  [PASS deployment](../../mr-pass/docs/Deployment.md) for the bounded external-supplier handoff.

Use the existing research as a comparison lens: ERPNext's requests, quotations and supplier scorecards; Carbon's
supplier/order continuity and revisions; Odoo's receipt/bill navigation and procurement actions; and the Moqui
baseline's record and service contracts. These are previously researched patterns, not fresh claims about current
third-party products or a request to reproduce their feature inventories.

### Ownership and boundaries

| Surface | Owner and review boundary |
| --- | --- |
| Purchasing shell, lists, sourcing, settings and app context | BOSS Purchasing screens/services and `Purchasing*.xml` templates |
| Purchase rules, commercial revisions, approval decisions, supplier policy, requests and awards | Mantle; business rules and their regression checks remain usable without BOSS |
| Supplier360 | Shared BOSS parent with Purchasing's profile, approval, quote, agreement, receipt, bill, return, drop-ship and performance consumers; Accounting has a different Supplier360 |
| Product360, SupplierPrices, PriceExplain, stock and method reads | Products-owned shared screens under Purchasing context; sales prices, master edits, standard costs and methods retain their separate permissions |
| Receipts, stock and quality | Warehouse/Mantle owns physical movement and inspection; Purchasing reads progress and offers operations only to holders of the relevant grants |
| Subcontract service orders | Purchasing owns commercial order, approval, supplier communication and bill follow-up; Manufacturing owns operation/output facts, Warehouse owns custody movements |
| Bills, matching, holds, prepayment and supplier credit | Accounting/Mantle owns finance; Purchasing imports, reads and asks for resolution within its grants. Match, AP approval, payment and settlement remain distinct |
| Requests, approvals, Chatter, RecordFiles and notifications | Existing shared/Commons owners; review Purchasing identity, audience, decisions and return paths without another full Commons review |
| SupplierHome, QuoteResponse, OrderAcknowledgement and BillUpload | PASS over Mantle; local public-site fixture and record-scoped supplier access, never internal BOSS authority |
| Layout widgets, dialogs, charts, print/PDF, upload/download and TUI | Framework and client owners; a shared correction needs a representative second consumer |

Preserve routes, native record keys, saved finds/columns, preferences, revision and operation identity, effective
dates and entity/service contracts. Record unavoidable compatibility changes before implementing them. App context
selects a presentation; it does not grant authority. Restricted money, supplier bank/tax information, another
organization's demand and competing suppliers' offers must not enter unauthorized responses, choices or output bytes.

Do not build absent features to complete the review. Lease administration, draft-order merging, vendor consignment,
purchase promotions, recurring agreement releases and other unimplemented design items remain separate. Review
current cross-app consumers even where the older implementation's “Later” table still calls them future work.
Actual supplier communication, carrier operations and financial settlement are not fixtures: later execution uses
disposable records, captured mail and local/synthetic external outcomes.

## 2. Review method and refinement criteria

### Environment and fixtures

For later execution, follow the framework UI review guide and repository building/testing skills. Use an isolated
runtime with individually linked Mantle and BOSS components and a disposable database. The guide's framework-only
bootstrap leaves `component/` empty; it must be adapted explicitly for Purchasing. Add PASS only for the supplier
handoff. Copy mutable configuration; keep uploaded quotes, bills, agreement files, issued documents and captured mail
apart from working data. A new port does not isolate a database, and browser cookies are not isolated by port.

One coordinator owns runtime lifecycle and shared files. Record actual loaded source and binary revisions,
components, runtime/database paths, hostnames, listener ports, date/zone, fixture setup and evidence directory at the
first execution batch. Confirm browser and terminal access before delegating live work. A linked component is still
source, not disposable storage. Follow the guide's whole-runtime relocation procedure when retaining a runner's
runtime across restarts; restore temporary grants, policies and preferences and stop review listeners afterward.

Reuse a suitable binary for XML/script work. Rebuild only when the changed Rust or embedded renderer requires it,
and confirm loaded assets before diagnosing stale markup. Establish Chromium/PDF, upload and mail-capture
availability before claiming the corresponding outputs. A missing provider, public mount or terminal capability
leaves that branch unverified. A success message or filename alone does not prove a correct issued document.

The ordinary Purchasing demo buys for **`ORG_ZIZI_RETAIL`**, usually into **`ZIRET_WH`**. This is not Accounting's
separate `BOSS_ACCT_ORG`. **`ORG_ZIZI_SERVICES`** and its purchasing reader provide a foreign-scope counterpart.
`ZiddlemanInc` and `BOSS_PUR_SUP_C` are shared suppliers with owner `_NA_`; other Retail suppliers are owned by Retail.
A shared supplier does not make the other organization's orders, bills or profile rows shared. Verify the currently
loaded organization relationships and effective policies before interpreting a refusal as a role result.

| Actor | Existing starting point and purpose |
| --- | --- |
| Requester | `purchasing.requester`: own/assigned requests, Home and request creation, without the buying lists |
| Buyer | `purchasing.buyer`: supplier profile, requests/RFQs/quotes/orders/returns and authorized report work |
| Planner | `purchasing.planner`: supply runs and stock policy; reading a suggestion does not grant purchase conversion |
| Purchase approver | `purchasing.approve`: current approval steps and purchase-hold release; separate from the author |
| Reader | `purchasing.read`: useful read-only navigation, no other business launcher and withheld sensitive values |
| Purchasing administrator | `purchasing.admin`: policies and reference settings; unrestricted active-organization scope makes it unsuitable as an isolation negative |
| Buyer plus receiver | `purchasing.buyreceive`: receive from Purchasing with Warehouse's receive grant, without treating every buyer as a receiver |
| Buyer plus matcher | `purchasing.buymatch`: matching from Purchasing with `INVOICE_MATCH`, without AP approval/payment authority |
| Other organization | `purchasing.services`: Services purchases/suppliers; use otherwise-valid corresponding records |
| Additional narrow pairs | Buyer with supplier-price edit; purchaser with inspect/verify/dispose/template grants; AP intake/approver, GL, treasury; Manufacturing operator; external supplier contact |

Current capabilities derive from permissions and area authorizations in `Purchasing.js`. Relevant distinctions
include `PURCHASE_ORDER_EDIT`, `PURCHASE_APPROVE`, `PURCHASE_ORDER_APPROVE`, `PURCHASE_HOLD_RELEASE`,
`SUPPLY_PLAN_RUN`, `STOCK_POLICY_PLAN`, `SUPPLIER_PROFILE_EDIT`, `SUPPLIER_SCORECARD_EDIT`, `PURCHASE_POLICY_EDIT`,
`SUPPLIER_PRICE_VIEW/EDIT`, `PAYABLE_IMPORT`, `PAYABLE_VIEW/EDIT`, `INVOICE_MATCH`, `STOCK_RECEIVE`,
`QUALITY_INSPECT/VERIFY/DISPOSE/TEMPLATE_EDIT`, `ACCOUNTING_VIEW`, `ACCOUNTING_GL_POST` and `RETURN_AUTHORIZE`.
Verify the exact composed user's grants; a demo username is not an authority contract. A requester cannot obtain a
buyer's list through a shared mount, and a buyer must not obtain financial detail by asking for an export.

Useful existing fixture families are `BOSS_PUR_PO_A`, the foreign `BOSS_PUR_PO_SVC`, `BOSS_WH_PO`, the shared and
Retail supplier set, `BOSS_PUR_REQ_A`, `BOSS_PUR_AGR_A`, `BOSS_PUR_AGR_TPL` and `BOSS_PUR_AGR_SVC`. Scenario specs
create additional records; inspect their setup and dependencies rather than assuming that a similarly named record
is already in the ordinary demo. Preserve a separate baseline for flows that consume demand, receipts or approvals.

For PASS, inspect `ZIZI_PORTAL`, the Accounting portal fixture and the Purchasing portal loader. The loader makes
`BOSS_PUR_PORTAL_RFQ` and `BOSS_PUR_PORTAL_QUOTE`, uses the portal's shelving-restock order and creates capability
links when the site exists. It returns without creating them if that prerequisite is absent. Use locally generated
links and redact tokens in evidence; do not copy demonstration tokens into the review record.

Prepare deliberate variants before a wave:

- Two buying organizations and independent identities; a shared supplier, a private contact, disabled supplier,
  pending/blocked/suspended supplier and one that becomes unavailable after a preview.
- Empty, populated, filtered and paged lists; long names, localized labels, large/fractional quantities, two rows
  for repeated dialogs, selected options outside the first result page and inaccessible/deleted records.
- An approved request with partly sourced lines; mixed suppliers and a missing supplier; a demand also selected by
  another buyer; a planning suggestion already covered by a draft PO or request.
- RFQs with two comparable offers and one incomparable/expired offer; packs and stock units, declared substitutes,
  two currencies and dated rates, missing freight, and a quote answering an earlier sent RFQ revision.
- Draft, placed, approved, sent, held, partially received and completed orders; distinct approval authors; a changed
  receipt after revision preview; multiple recipients with one invalid address and captured successful delivery.
- Receipt quantities that separate expected, received, accepted, rejected, held, released, billed and returned.
  Include a stock line, non-stock service line and subcontract line with actual dispatch/output evidence.
- Bill price/quantity exceptions, a duplicate supplier reference, accepted service evidence, an ambiguous legacy
  match and an independently failing reevaluation member; finance authority supplied separately.
- Current, future and expired policies/agreements/prices, approval amount-band boundaries and a date boundary in two
  user zones. Old fixed demo dates are not evidence of a currently due, stale or expired condition.
- Local supplier portal contact/capability access, revoked and superseded links, quarantined/accepted files and a
  second supplier; a drop-ship report which has not yet been confirmed by a buyer.

### Visual and interaction review

- Material `/qapps` is the visual target: default light and dark at **1920×1080**, selected **1280px** and **390px**
  layouts, keyboard-only tasks and actual **200% browser zoom**. Record measured dimensions and any tool limitation.
- Inspect actual embedded TUI launch, light/dark switching, menu/default routes, lists, tabs, row choices, dialogs,
  confirmations and saved outcomes. Source JSON and a terminal helper opened in a browser are supporting evidence,
  not an exercised terminal task. Give Standard `/apps` a brief functional/output/fallback check.
- Record headers retain the document key/name, supplier, buying organization, revision, state and next action.
  Distinguish Requested quote, Proposed offer, Placed PO, Approved, Sent, acknowledged, received and settled.
- Apply contrast criteria to the painted background: ordinary text **4.5:1**, qualifying large text **3:1**, meaningful
  controls/states **3:1**. Inspect status chips, missing-price warnings, held quantities, disabled fields and focus
  in both themes; color is never the only explanation of approval or comparison status.
- Review list filters through saved-find create/update/default/reset, supported sorting/views/columns, pagination,
  bulk selection, detail and Back. A changed organization, supplier or facility clears incompatible selections;
  reset actually clears inherited parameters. Empty, inaccessible and withheld are distinct from zero.
- Use actual search choices and selected labels, including values outside the first page. Dependent receipt
  locations, agreement items, suppliers and product options must track the selected record and scope.
- Open two different row dialogs; cancel, reopen, submit invalid data, fix it and return focus to the opener. Only
  explicit confirmation executes a send, approval, award, conversion, closure or cancellation. Selection changes
  while confirmation is open invalidate the old action rather than silently acting on new rows.
- Follow the same quantity through demand, purchase pack, stock unit, partial delivery, rejection, service
  acceptance, bill match and return. Show the unit and conversion basis; a display rounding must not change a
  submitted quantity. Price ranking never silently chooses a supplier or treats unknown freight as zero.
- Dates and as-of prints use the user's zone with a clear basis. Revisions preserve prior issued documents.
  Scheduled-plan status identifies its last run and error; a due time does not prove execution.
- Inspect actual CSV/XLSX/PDF/HTML bytes where supported and captured mail attachments. Report filters, currencies, as-of basis and
  withheld values survive export. Document content belongs to the current record and authorized supplier.
- Follow each handoff to its result and return: receiving, inspection, stock reservation, supplier return, financial
  matching/settlement, subcontract operation and external supplier response. A visible link alone is insufficient.
- Partial batch outcomes name the failed supplier/order/row and retain successes. Retry the unresolved member with
  the operation's actual contract; do not assume one idempotency rule covers sends, award groups and reminders alike.

### Waves

These are future execution waves, not work performed by this documentation batch. Pair role/scope refusals with
otherwise-valid successful requests throughout; PUR-30 reconciles remaining gaps, not a new role×route×mode matrix.

| Wave | Activities and purpose | Prerequisites / handoff |
| --- | --- | --- |
| P0 — Context and supplier basis | PUR-01–04, 27: shell, supplier, approval and purchase-price context | Scoped identities, policies, catalog and shared suppliers |
| P1 — Request and source | PUR-05–10: request, sourcing, RFQ, offer, comparison and award | Independent approver, multiple suppliers/currencies and captured mail |
| P2 — Commit and communicate | PUR-11–16: PO, approvals, issue, holds, revisions and agreements | Approval bands, budget counterpart, prior issued revisions and PDF |
| P3 — Replenish and receive | PUR-17–21: supply plan, rules, receipt, quality and service acceptance | Facility stock, planner/buyer/receiver/quality pairs and subcontract evidence |
| P4 — Resolve obligations | PUR-22–24: bills/matching, drop-ship and supplier returns | AP/matcher, customer demand, return shipment and finance handoff |
| P5 — Explain and collaborate | PUR-25–29: performance, reports, policy consumers, supplier portal and evidence | Historical score evidence, scoped reports, isolated PASS site |
| P6 — Reconcile coverage | PUR-30–31: remaining boundaries, modes and cross-app continuity | Earlier activities' unresolved branches and selected second consumers |

Do not consume the same receipt or demand in two concurrent waves. Record each fixture's owner and baseline; use
separate records for award conversion, return settlement, revision races and drop-ship delivery. A blocked external
branch need not prevent independent internal activities, but remains unresolved in the ledger.

## 3. Screen and surface inventory

Routes are relative to `/qapps/`. **B** means this component's `screen/`; append `.xml` to local names for the
source. Current source contains **54 local XML definitions**, `Purchasing.xml` and 53 below `Purchasing/`, with no
local `.qvue` or `.tui.json`. Recursively following physical children and explicit mounts yields **129 route
instances**, including the 54 locals, 74 Shared-source instances and Commons Notifications. These are source
inventory counts, not evidence that every descendant is admitted to every Purchasing user or visible in its menu.

### Local routes and defaults

| Route prefix / source directory | Local definitions | Activities |
| --- | --- | --- |
| root | `Purchasing` | PUR-01, 30–31 |
| `Purchasing/` | `Home` | PUR-01, 12, 15, 25–26 |
| `Purchasing/` | `Suppliers`, `Requests`, `Sourcing`, `Orders`, `Approvals`, `Agreements`, `Replenishment`, `Receiving`, `Returns`, `Bills`, `Performance`, `Settings`, `Products` | Containers/defaults below; PUR-01, 30–31 |
| `Purchasing/` | `NewPurchaseOrder`, `NewPurchaseRequest`, `NewQuoteRequest` | PUR-01, 05, 07, 11 |
| `Purchasing/Suppliers/` | `SupplierList` | PUR-02–04 |
| `Purchasing/Requests/` | `PurchaseRequests`, `RequestSourcing` | PUR-05–07, 17, 23 |
| `Purchasing/Sourcing/` | `QuoteRequests`, `QuoteRequestDetail`, `Quotes`, `QuoteDetail`, `QuoteComparison`, `Award` | PUR-07–10, 13, 28–29 |
| `Purchasing/Orders/` | `PurchaseOrders`, `OrderChanges`, `Acknowledgements` | PUR-11–15, 19, 21–24 |
| `Purchasing/Agreements/` | `AgreementList`, `AgreementDetail` | PUR-16, 29 |
| `Purchasing/Replenishment/` | `ReorderRules` | PUR-18 |
| `Purchasing/Replenishment/ReorderRules/` | `Rules`, `SuggestLevels`, `PlanSchedule` | PUR-18 |
| `Purchasing/Receiving/` | `Receipts`, `Inspections` | PUR-19–21 |
| `Purchasing/Returns/` | `SupplierReturns`, `ReturnAuthorization` | PUR-24 |
| `Purchasing/Bills/` | `BillList`, `MatchExceptions` | PUR-22 |
| `Purchasing/Performance/` | `Scorecards`, `ScorecardDetail`, `Spend`, `Commitments`, `ProcurementTracker`, `PurchaseHistory`, `SupplierStatement` | PUR-25–26 |
| `Purchasing/Settings/` | `SettingsHome`, `PurchasePolicy`, `ApprovalPolicies`, `ScorecardPolicies` | PUR-03, 12, 25, 27 |
| `Purchasing/Products/` | `ProductFind` | PUR-04 |

| Container | Default child | Activities |
| --- | --- | --- |
| Purchasing | Home | PUR-01 |
| Suppliers / Requests / Sourcing / Orders | SupplierList / PurchaseRequests / QuoteRequests / PurchaseOrders | PUR-02, 05, 07, 11 |
| Approvals / Agreements | Notifications / AgreementList | PUR-03, 10, 12, 16 |
| Replenishment / ReorderRules | SupplyPlanning / Rules | PUR-17–18 |
| Receiving / Returns / Bills | Receipts / SupplierReturns / BillList | PUR-19–24 |
| Performance / Settings / Products | Scorecards / SettingsHome / ProductFind | PUR-04, 25–27 |
| Supplier360 / Product360 | Overview / Summary | PUR-02–04 |
| InventoryAvailability / Product360/Stock / Product360/BOM | Summary / Summary / Overview | PUR-04, 17–18 |

### Shared mounts and inherited descendants

| Route under `Purchasing/` | Source under B | Activities / context |
| --- | --- | --- |
| `Chatter`, `Chatter/ChatterTui` | `Shared/Chatter.xml`, `Shared/ChatterTui.xml` | PUR-29–31; record identity/audience and terminal helper |
| `RecordFiles`, `RecordFiles/RecordFilesTui` | `Shared/RecordFiles.xml`, `Shared/RecordFilesTui.xml` | PUR-29–31; authorized files and terminal helper |
| `Approvals/Notifications` | `Commons/Notifications.xml` | PUR-03, 05, 10, 12, 16; source record decides |
| `Suppliers/Supplier360` | `Shared/Supplier360.xml` | PUR-02–03, 16, 19, 22–25, 28–29 |
| `Suppliers/SupplierPrices`, `Suppliers/PriceExplain` | Matching `Shared/*.xml` | PUR-04, 08, 16; purchase direction and separate price grants |
| `Products/Product360` | `Shared/Product360.xml` | PUR-04, 17–18, 26 |
| `Requests/RequestDetail` | `Shared/RequestDetail.xml`, `PurchasingRequestDetail.xml` template | PUR-05–07, 26, 29 |
| `Orders/OrderDetail` | `Shared/OrderDetail.xml`, Purchasing order templates | PUR-11–16, 19, 21–24, 29 |
| `Replenishment/SupplyPlanning` | `Shared/SupplyPlanning.xml` | PUR-17; Purchasing facility scope and buy/outside conversion |
| `Replenishment/InventoryAvailability` | `Shared/InventoryAvailability.xml` and six children | PUR-17–18; stock reading and permitted reorder policy |
| `Receiving/ShipmentDetail` | `Shared/ShipmentDetail.xml`, `PurchasingReceiptDetail.xml` template | PUR-19, 21–22; purchase receipt context |
| `Receiving/QualityInspection`, `Receiving/InspectionTemplates` | Matching `Shared/*.xml` | PUR-20; receipt quality, action by grant |
| `Returns/ReturnDetail` | `Shared/ReturnDetail.xml`, `PurchasingReturnDetail.xml` template | PUR-24; supplier direction, RMA, receipt quantities, replacement and financial handoff |
| `Bills/InvoiceDetail`, `Bills/InvoiceMatch` | Matching `Shared/*.xml`, `PurchasingInvoiceDetail.xml` template | PUR-22; supplier bill and matching, not Accounting's full AP workspace |

The following child paths complete the recursive inventory. Follow the consuming Purchasing route for both normal
activity and excluded-context probes. Physical availability does not mean the parent advertises or permits it.

| Parent / descendants | Purchasing presentation or boundary | Activities |
| --- | --- | --- |
| Supplier360: `Overview`, `Buying`, `Prices`, `Finance` | Contacts, organization-specific buying profile, supplier offers and separately permitted finance details | PUR-02–04, 30 |
| Supplier360: `PurchasingQuotes`, `PurchasingAgreements`, `PurchasingReceipts`, `PurchasingReturns`, `Bills` | Quote, agreement, receipt/quality, supplier return and bill continuity | PUR-07–08, 16, 19–20, 22, 24 |
| Supplier360: `PurchasingDropShip`, `PurchasingPerformance` | Supplier facility/integration metadata and latest evaluation/risks | PUR-23, 25 |
| Supplier360: `Documents`, `Conversation`, `InsightsRecord` | Evidence and discussion, hidden linked insight helper | PUR-26, 29–31 |
| Supplier360: `Receiving`, `SubcontractOrders` | Warehouse/Manufacturing-specific inherited children; inspect direct access/omission and owning-app counterpart | PUR-21, 30–31 |
| Product360: `Summary`, `Identifiers`, `Dimensions`, `Packaging`, `Suppliers`, `Stock`, `Documents`, `BOM`, `PurchaseHistory` | Purchasing's admitted tab set; Suppliers needs supplier-price read, BOM method read; master edits disabled by Purchasing context | PUR-04, 17–18, 26, 30 |
| Product360: `Features`, `Categories`, `Prices`, `Costs`, `KitComponents`, `Equipment`, `Associations`, `Parties`, `Connections`, `History`, `Replenishment`, `PaidAccess` | Inherited physical/mounted sources outside Purchasing's declared tab set; record direct-request behavior without granting catalog, sales-price or cost authority | PUR-04, 30–31 |
| Product360: `InsightsRecord` | Hidden shared insight helper; authorized link and return only | PUR-26, 30–31 |
| Product360/Documents: `Index` | `Shared/Documents.xml`; file list, upload/download and record permission | PUR-04, 29 |
| Product360/BOM: `Overview`, `BillOfMaterialsExplosion`, `BillOfMaterialsCompare`, `WhereUsed`, `RoutingDetail` | Shared method read and excluded edit/approve operations under Purchasing context | PUR-04, 21, 30 |
| Product360/Stock and Replenishment/InventoryAvailability: `Summary`, `Projection`, `Policy`, `Locations`, `Movements`, `Reservations` | Same sources through two consuming paths; scope/context retained, stock policy only where granted | PUR-04, 17–18, 30–31 |

`OrderDetail`, `InvoiceDetail`, `RequestDetail`, `ShipmentDetail` and `ReturnDetail` use inline/template sections for
these contexts rather than child routes for every design “tab.” Do not invent paths from their section titles.
Retest a shared correction through an appropriate second consumer: Products for prices/catalog, Warehouse for
receipts/quality/returns, Manufacturing for planning/subcontracting, Accounting for matching, or another authorized
Commons record for evidence. A source file used twice is two contexts to inspect, not automatic duplicate regression
renders.

### Dialogs, helpers, custom modes and outputs

All families below are part of their named activities. Inspect row identity, selected-value labels, invalid input,
cancel/reopen and confirmation in the actual owning route, including transitions shared from a template.

| Surface / source family | Supporting inspection | Activities |
| --- | --- | --- |
| SupplierList | New supplier organization/person, duplicate candidates and Create anyway; selected-row bulk category/buyer/block operations and per-row results | PUR-02–03 |
| Supplier360 Buying/approval/portal templates | Change profile/buyer/category; submit, approve/refuse/suspend; invite supplier contact | PUR-02–03, 28 |
| SupplierPrices and PriceExplain | Authorized add/edit/end offer, purchase pack/UOM, tier/effective dates and explanation basis; forbidden sales/cost fields | PUR-04, 08 |
| SupplierPrices CSV/XLSX | `Suppliers/SupplierPrices`, `Suppliers/Supplier360/Prices` and `Products/Product360/Suppliers` share `Shared/SupplierPrices.xml`'s declared exports; inspect actual rows, selected columns, filters, amounts/currencies and withheld fields | PUR-04, 29–31 |
| Inherited Product360/Prices CSV/XLSX | `Shared/Prices.xml` declares both exports even though Prices is outside Purchasing's advertised tab set; pair authorized owning-context output with Purchasing direct-request refusal/omission checks, without granting new price authority | PUR-30–31 |
| RequestDetail and RequestSourcing | Add/edit/remove line, choose supplier, submit/decide/cancel/complete, supplier/drop-ship selection, source request rows and result/retry | PUR-05–07, 23 |
| QuoteRequestDetail / Quotes / QuoteDetail | Create RFQ/offer, edit RFQ/item, invite/decline supplier, send, as-of print; answer, quote-line price, publish price and freight estimate | PUR-07–08, 13 |
| QuoteComparison / Award | Basis/line/quantity selection, allocations, CSV/print, preview/commit, result and close/regret; these are page states, not additional child screens | PUR-09–10 |
| PurchaseOrders and NewPurchaseOrder | Draft creation and selected-order bulk actions; requester/reader omission and source-record context on quick create | PUR-01, 11–12, 14 |
| PurchasingOrderDetail / OrderApprovals | Add/edit/delete line; place, approve/refuse, send, edit header, hold/release, cancel, clone, close remainder, accept service, as-of/issued content | PUR-11–15, 21 |
| OrderReceipts / OrderBills / OrderReturns / OrderSources / OrderAgreements | Receipt, bill, source request/plan/agreement and return links; draft bill/upload/prepayment; quantity and amount permissions | PUR-06, 16–17, 19, 22–24 |
| OrderRevisions / OrderChanges / Acknowledgements | Start change, line/part proposal, preview/apply/let go, record acknowledgement, line promise and reminders | PUR-15 |
| AgreementList / AgreementDetail / AgreementRelease | New/template, edit, dated items/terms/signers, submit/approve/refuse/cancel/status, upload, release and as-of/issued print | PUR-16, 29 |
| SupplyPlanning / ReplenishmentParts | Run/refresh scope, suggestion selection, demand/supply detail, source choice, buy/request/drop-ship/outside conversion and conversion result | PUR-17, 23 |
| ReorderRules Rules/SuggestLevels/PlanSchedule | New/change rule, snooze, history preview, selected application with reason, save schedule and explicit preview run | PUR-18 |
| ReceiptDetail / ReceiptPegs | Expected receipt (ASN), receive row/all expected, finish remainder, draft bill and reserve received stock for linked customer demand | PUR-19, 22 |
| QualityInspection / InspectionTemplates | Receipt measurement/result/verify/disposition, files and template maintenance by separate grants; inspect actual print destination | PUR-20 |
| BillList / InvoiceDetail / MatchExceptions / InvoiceMatch | Upload, duplicate-reference response, ask hold release, reevaluate selection, receipt/service matching and legacy preview/apply | PUR-22 |
| Supplier360/PurchasingDropShip and OrderDropShip | Add/change supplier facility metadata, route customer line, confirm delivery/line and tracking; report versus confirmation | PUR-23, 28 |
| SupplierReturns / ReturnDetail / ReturnAuthorization | New return, eligible receipt selection, RMA/authorize, cancel, add line, replacement; printable supplier authorization | PUR-24 |
| Scorecards / ScorecardDetail | Evaluate selected suppliers, recalculate retained evaluation, metric drill, record/end risk and CSV | PUR-25 |
| Performance report pages | Filtered CSV and html-print; committed versus billed, reserved versus actual, withheld money and currency basis | PUR-26 |
| Settings pages | Purpose/category edit; dated defaults/controls; approval step add/change/end and amount preview; score basis/criteria/response rules | PUR-27 |
| Shared evidence | Chatter/RecordFiles QVue, terminal helpers, authorized upload/download, original/issued records, scan failures and audience | PUR-29 |
| Inline authored render sections | qvt/tui status, actions and evidence links in local/shared/templates; distinguish actual native terminal output from markup fallback | Each owning activity; PUR-31 |

Hidden helpers include the three quick-create pages, ProductFind, RequestSourcing, OrderChanges, QuoteComparison,
Award, ReturnAuthorization, detail pages and the shared evidence/insight helpers. Direct reads and transitions must
retain the same record checks as their normal entry action. Record keys include `vendorPartyId` on Supplier360,
`productId` on Product360, `requestId` on requests/RFQs, `orderId` on quotes/orders/revisions, `agreementId`,
`shipmentId`, `inspectionId`, `invoiceId`, `returnId`, `supplierScorecardId`, and `planFacilityId` for Purchasing
planning. Read the current declaration before constructing a direct probe; do not replace these with one generic ID.

The shell provides Purchasing records search, quick creates for request/RFQ/PO, `g b`, approval/request/RFQ/
acknowledgement Today sources, and PurchaseLateReceipt, PurchaseMatchException and PurchaseSupplierResponse topics.
Approval notifications use the source's revision-bound decision. Inspect alert→record→Back and quick-create
cancel/reopen, including entry from an unrelated record, in PUR-01 and its owning workflow.

PASS surfaces are a separate browser mount: SupplierHome, QuoteResponse, OrderAcknowledgement and BillUpload with
their `.html.fancy` templates. Include external upload staging, captured invitations, contact versus capability
access, response receipt and internal buyer follow-up in PUR-28. The public app is not a Material/TUI variant of
Purchasing and does not inherit its internal tabs or competitor data.

### Design-to-code reconciliation

| Design or historical item | Current review disposition |
| --- | --- |
| Root placeholders and proposed P1 permissions | Purchasing is built; inventory and current grants take precedence over historical introductions |
| Requests/Suppliers/Agreements design paths | Containers resolve to PurchaseRequests, SupplierList and AgreementList; retain actual detail/helper paths |
| Purchasing “all XML” | Local files are XML; shared Chatter/RecordFiles have QVue and terminal helpers, and authored inline modes remain in scope |
| Supplier prices and catalog editing | Separate supplier-price edit is not seeded merely by being a buyer; Purchasing Product360 deliberately restricts the master and sales-price action set |
| “Other apps' contexts” in impl Later | Customer Service, Sales and other consumers now exist; use current shared context/ownership, bounded handoffs and same-record return |
| Supplier portal described as future | PASS Supplier is built. Quote response, PO acknowledgement, bill upload and drop-ship report are distinct scoped external operations |
| SupplyPlanning buy/make/transfer design | Purchasing converts buy and outside suggestions. Manufacturing owns make; transfer capability must be established from the current Warehouse contract, not inferred from a shared plan row |
| Service versus subcontract receipt | Non-stock service acceptance uses `OrderServices.accept#ServiceItem`; subcontract acceptance is recorded through Manufacturing output receipt, not a second manual PO acceptance |
| LeaseOverview / MergeDraftPurchaseOrders | Unmounted future work; excluded from completion criteria |
| Recurring agreement release / purchase promotion tiers / consignment / rebates | Do not infer built schedules, a purchase-store promotion engine or stock ownership from a design paragraph; ordinary price-row tiers and manual agreement releases are current paths |
| RFQ contact/channel/deadline per invitation, quote tax/MOQ/increment/warranty | Historical deferrals; inspect available fields and describe the actual shared deadline/recipient and freight behavior without inventing controls |
| Substitute acceptance and manufacturing change referral | Current award uses buyer's explicit substitute choice; a separate requester-acceptance or released-BOM change workflow is not established by it |
| Quote revision warning and published offer after award | Historical F176/F189 require current source/runtime investigation: answered sent revision, comparison basis and a previously published price may differ; no new observed defect is claimed |
| Receiving checklist / Purchasing inspection report / bill and match explanation print | These Purchasing outputs are not established by the current local/mount inventory. Inspect actual offered links and owner permissions; do not call Accounting's output a Purchasing print |
| Supplier-price/reorder import under Purchasing | No corresponding Purchasing import mount is established; Products' importer and its permissions are a separate handoff |
| OCR, NCR/CAPA, external risk feeds, arbitrary score formulas and EDI | Remain separate capability work. Existing warnings, risk records and receipt inspections are reviewed as implemented |
| Supplier delivery report prefilling confirmation / subcontract dispatch-inspection portal evidence | Inspect actual supplied content; supplier reporting itself ships/posts nothing. Do not assume a report replaces the buyer's confirmation |
| Historical verification totals and end-to-end instructions | Current specs/registrations and §5 govern; old results do not establish this review's coverage or authorize acceptance |

## 4. End-to-end activities

Each activity is executed through visible controls with intermediate state, actual confirmation, saved result and
relevant recovery checked. A service call, rendered page or HTTP 200 alone does not complete it. “Browser” below
means Material light/dark; TUI means the actual supported terminal interaction; Standard is the brief functional/
output check. Apply selected narrow, keyboard and zoom variants where layout or input can differ, and record all
unattempted variants explicitly in §6.

### PUR-01 — Start a purchasing workday in the right scope

- **Actor/start:** requester, buyer, planner, approver and reader with populated and empty organizations.
- **Objective/steps:** open Purchasing → inspect Home's work cards, due requests/RFQs/acknowledgements and authorized
  spend summary → open a filtered work list → record → Back. Use Purchasing search, `g b`, Today and notifications;
  open/cancel/reopen request, RFQ and PO quick creates where permitted. Save, change, reset and revisit a main find.
- **Expected:** cards and destination records agree on organization and authority; the requester sees their work;
  sensitive amounts are withheld explicitly; default routes, list context and useful empty states are coherent.
  New opens a fresh record even after following a record notification.
- **Recovery:** no organization, no matches, unavailable recent record, changed active organization, one independently
  failed Home source and a selected filter no longer permitted. Unavailable information is not shown as zero.
- **Screens/modes:** Home, section defaults, three quick creates, shell/search/find controls; browser/TUI/Standard,
  selected narrow/keyboard/zoom cases and actual theme switching.

### PUR-02 — Create and maintain a supplier without losing its scope

- **Actor/start:** buyer, reader and foreign-organization reader; shared and organization-owned supplier examples.
- **Objective/steps:** SupplierList → New supplier/New individual supplier → inspect duplicate candidates → choose
  existing or deliberately Create anyway → Supplier360 → contacts, buying profile, assigned buyer and categories.
  Change one dated field with a reason; reload and inspect history. Select two suppliers for a supported bulk change.
- **Expected:** person versus organization input is clear; duplicates are explained before creation; supplier owner,
  buying organization and effective profile are distinct. Changes affect the intended records and preserve prior
  rows. Maintaining a contact uses the existing Commons route only where authorized.
- **Recovery:** duplicate name/contact/external ID, incomplete required input, canceled duplicate decision, stale dated
  profile, invalid buyer/category, inaccessible supplier and a failed member of a bulk action. Keep successful rows.
- **Screens/modes:** SupplierList, Supplier360/Overview/Buying and shared choices; browser/TUI/Standard, two row dialogs,
  phone name/state columns and selected labels outside the current choice page.

### PUR-03 — Approve a supplier and understand a buying restriction

- **Actor/start:** buyer, separate purchase approver and administrator; pending, blocked and suspended suppliers.
- **Objective/steps:** Supplier360 → inspect policy explanation → submit for approval → follow Approvals/Today to the
  pending step → approve or refuse with reason → return to supplier. Apply a dated block or suspension through its
  offered control and attempt a valid RFQ/PO consumer under Warn and Stop policies.
- **Expected:** approval state, dated purchase block and suspension are distinguishable; approver sees the current
  source and step; warning names its effect; Stop prevents the protected purchase operation. Existing orders remain
  visible and are not described as canceled merely because future buying is blocked.
- **Recovery:** self-approval/separation refusal, stale source or expired decision, missing eligible approver/policy,
  canceled suspension and supplier state changing after preview. Compare valid holder and non-holder requests.
- **Screens/modes:** Supplier360 approval controls, Approvals/Notifications, PurchasePolicy/ApprovalPolicies and
  consuming RFQ/PO; browser/TUI/Standard with clear text in both theme states.

### PUR-04 — Explain the product and supplier price used for a purchase

- **Actor/start:** buyer and reader, plus a separately granted supplier-price editor/method reader; pack and stock unit.
- **Objective/steps:** ProductFind or purchase line → Product360 → identifiers, dimensions, packaging, suppliers,
  stock, documents and permitted BOM/history → SupplierPrices → PriceExplain. Choose organization, supplier,
  quantity, date, currency and agreement basis; an editor adds/changes/ends a dated offer and checks a consuming PO.
  Export the permitted SupplierPrices list as CSV and XLSX through its standalone, supplier and product contexts;
  inspect the workbook's actual rows, headers/selected columns, active filters, quantity units and amount/currency values.
- **Expected:** product identity and usable-for-buying reason remain visible; displayed purchase and stock units are
  understandable; selected tier/agreement/offer and rejected alternatives explain the price. Read-only master tabs
  stay useful; supplier-price edit, standard cost and method actions do not appear through inferred authority.
  Exported rows match the selected supplier/product/organization and filter basis, and no restricted money or
  action-only columns appear in the workbook or CSV.
- **Recovery:** no price, expired/overlapping offer, unavailable supplier/product, missing conversion, pack quantity,
  selected value outside the current search page and permission removed after opening a dialog.
- **Screens/modes:** ProductFind/Product360 admitted tabs and BOM/Stock descendants, SupplierPrices/PriceExplain;
  browser/TUI/Standard, comparison-style narrow layout, actual CSV/XLSX and document downloads, with excluded-child
  output probes in PUR-30. Terminal export delegation must identify the actual supported action.

### PUR-05 — File, approve and complete a purchase request

- **Actor/start:** requester, buyer and separate approver; organization/facility, purpose and three request lines.
- **Objective/steps:** NewPurchaseRequest/list → RequestDetail → add/edit/remove lines, quantity/unit, needed date and
  permitted supplier/cost basis → submit → approval decision → follow the resulting requirements and sourcing links.
  After supply is arranged, use Complete request with its reason; inspect a linked work item's completion separately.
- **Expected:** requester ownership and buying organization are clear; request approval is not PO approval; approved
  quantities become sourceable requirements and later source links account for them. Completing a related Projects
  work item does not silently complete an unsatisfied purchase request.
- **Recovery:** no line, invalid product/unit, missing purpose/date, refusal and resubmission, other requester's record,
  repeated completion, canceled request and lost authority. Retain editable submitted values after a refusal.
- **Screens/modes:** PurchaseRequests, NewPurchaseRequest, shared RequestDetail and Notifications; browser/TUI/Standard,
  repeated line dialogs, long descriptions and requester-only navigation.

### PUR-06 — Source approved request quantities and recover partial conversion

- **Actor/start:** buyer with an approved partly sourced request, two suppliers and one unsourced line without a supplier.
- **Objective/steps:** PurchaseRequests row selection or RequestDetail → RequestSourcing → inspect uncovered quantities
  and supplier grouping → choose missing suppliers/source route → preview and convert → inspect each resulting draft
  order and request links. Correct the failed group and retry only its unresolved quantity.
- **Expected:** approved demand, already covered quantity and new allocation stay separate; every result identifies its
  supplier/source line; successful groups survive another group's failure. An operation retry recovers the recorded
  outcome, and another conversion cannot buy the same demand twice.
- **Recovery:** missing/blocked supplier, stale request or concurrently covered quantity, invalid selected line,
  canceled conversion and incompatible customer line for drop-ship. Preserve explicit source selection after error.
- **Screens/modes:** RequestSourcing, PurchaseRequests/RequestDetail, OrderDetail and source links; browser/TUI/Standard,
  bulk selection confirmation and narrow supplier/result grouping. RFQ sourcing continues in PUR-07.

### PUR-07 — Prepare and send an RFQ to several suppliers

- **Actor/start:** buyer with an approved request or new demand, three supplier invitations and captured mail.
- **Objective/steps:** NewQuoteRequest or RequestSourcing → QuoteRequestDetail → maintain specification, response date,
  product/description lines and units → invite suppliers → review recipients → send → inspect per-supplier result,
  retained RFQ PDF and response links. Record a supplier's decline through the internal Declined action. Edit material
  content and issue the new revision; view the old as-of print.
- **Expected:** the RFQ is distinct from an internal request and from each supplier's quote; send results identify
  successful and failed suppliers. Stored issued content reflects what that supplier was sent, and resending a
  changed revision is distinguishable from retrying an unchanged send.
- **Recovery:** missing address, one invalid recipient, blocked supplier, canceled invite/send, no line, expired or
  revoked response link and an edit after issue. Independent recipient failures leave the other sends available.
- **Screens/modes:** QuoteRequests, NewQuoteRequest, QuoteRequestDetail and Requests sourcing action; browser/TUI/
  Standard, PDF/captured attachments and portal continuation in PUR-28.

### PUR-08 — Record an offer and publish an authorized supplier price

- **Actor/start:** buyer, supplier-price editor and reader; requested and standalone quotes, offer validity and freight.
- **Objective/steps:** Quotes → QuoteDetail → record supplier reference, answer/validity, line price/unit, promised date
  and supported substitute → add/edit freight estimate → review the answer → publish a selected price/tier only with
  supplier-price edit → follow SupplierPrices and a later order's price explanation.
- **Expected:** recorded response, proposed offer and published reusable price are distinct; the original quote basis
  and currency remain visible. A freight estimate is labeled as an estimate. Supplier attachments stay on that quote;
  the price publication has its own effective dates and does not silently follow later award edits.
- **Recovery:** negative/invalid values, invalid dates, wrong source item, quote already awarded/closed, unsupported
  substitute and publication without permission. A buyer who can enter an offer is not thereby a price editor.
- **Screens/modes:** Quotes, QuoteDetail, Supplier360/PurchasingQuotes and SupplierPrices; browser/TUI/Standard, two line
  dialogs, localized amount input and actual authorized quote-content download.

### PUR-09 — Compare offers on an intelligible common basis

- **Actor/start:** buyer/approver with two comparable offers, one expired offer and a missing-rate or missing-unit case.
- **Objective/steps:** QuoteRequestDetail → QuoteComparison → choose demand line, quantity, display currency and FX day
  → compare original quote basis, normalized unit price, promised date and estimated landed cost → inspect ranking
  explanations → choose allocations explicitly → export CSV/print and compare the bytes to the visible basis.
- **Expected:** ranking chooses nothing. Incomparable and expired offers are not ranked; a comparable offer may have
  the lowest unit price while its landed cost remains Unknown because freight is missing. Unknown freight must not
  become zero or a lowest-landed-cost claim. Pack conversion and currency/date basis are explicit. Allocated and
  still-uncovered demand reconcile, and a substitute needs explicit acceptance rather than a hidden comparison default.
- **Recovery:** missing rate/conversion/price, invalid quantity/currency, offer changed after comparison, long supplier
  names and a quote answering an older issued RFQ revision. Record whether the latter is actually warned about.
- **Screens/modes:** QuoteComparison and QuoteDetail return path; browser/TUI/Standard, keyboard, 390px stacking and
  actual CSV/print. A design split is not evidence that the implemented page preserves selection on Back.

### PUR-10 — Award selected quantities and close the losing invitations

- **Actor/start:** buyer and independent award approver; split allocations with one valid and one blocked supplier group.
- **Objective/steps:** comparison → Award preview → inspect groups, quantities, budget visibility and warnings → commit
  or request approval → follow pending notification → inspect durable per-group results and resulting orders → retry
  unchanged result → preview closing RFQ, review regret text/recipients → confirm close → inspect revoked losing links.
- **Expected:** each quote group has its own result; valid groups can place despite a failed group; award approval and
  purchase-order approval remain distinct. A placed quote becomes the order with its identity/source links retained,
  not an unexplained duplicate. Closing leaves awarded orders and uncovered demand intact.
- **Recovery:** stale request/quote basis, over-allocation, blocked supplier, budget refusal, missing policy/rate,
  canceled commit, lost response and award pending at close. Name failed regret recipients and preserve other sends.
- **Screens/modes:** Award states, QuoteComparison, Notifications, QuoteDetail/OrderDetail and RFQ detail; browser/TUI/
  Standard with group result inspection and explicit confirmation counts.

### PUR-11 — Create a correctly priced purchase order

- **Actor/start:** buyer and reader; usable stock product, pack product and non-stock service example.
- **Objective/steps:** PurchaseOrders/NewPurchaseOrder → select organization, supplier and receiving facility → create
  draft → add two lines, inspect resolved supplier price and unit → edit quantity/date/cost center → remove a line →
  review totals and source/terms → Place → reopen from list and inspect status/approval requirement.
- **Expected:** one purchase part identifies external supplier and internal buyer; defaults derive from policy/profile,
  not a prior record. Price/currency/unit and totals are clear; product usability is checked before purchase. Placement
  respects the approval policy even for a prepaid or zero-total order.
- **Recovery:** no price, unusable product, invalid facility/cost center, empty order, supplier blocked since draft,
  invalid quantity, canceled place and reader attempting mutation. Keep draft values and offer a useful correction.
- **Screens/modes:** PurchaseOrders, NewPurchaseOrder, shared OrderDetail and PurchasingOrderDetail; browser/TUI/Standard,
  repeated line dialogs, quick-create context and meaningful phone columns.

### PUR-12 — Decide current purchase approvals and understand budget effects

- **Actor/start:** author and independent approvers; two-step band, no-policy fallback and stale selected order.
- **Objective/steps:** placed OrderDetail → inspect approval preview/step and visible budget basis → Approvals/Today →
  decide current revision → complete remaining step → inspect approved state and budget commitment. Select several
  valid orders for bulk approval with one deliberately stale member; review each result.
- **Expected:** approvers see why their action is available or refused, which revision it covers and who acts next.
  Request reservation, PO commitment and later actual are not counted twice. Budget detail withheld from a buyer is
  not a zero allowance. Overrides require their own grant and reason.
- **Recovery:** self-approval, separation/quorum, stale revision, uncovered policy band, expired step, missing rate,
  budget Stop, refusal reason and independent failed bulk member. No successful order is hidden by another failure.
- **Screens/modes:** OrderDetail approval section, Approvals/Notifications, PurchaseOrders bulk result and approval
  policies preview; browser/TUI/Standard. Reuse the existing source decision, not a second generic approval action.

### PUR-13 — Issue the current order and retain the evidence

- **Actor/start:** buyer with approved order, valid and invalid recipients, PDF support and captured mail.
- **Objective/steps:** OrderDetail → inspect revision and recipient selection → Send → read per-recipient result → open
  issued document/content → compare to current and earlier as-of print → repeat unchanged send → inspect recipient
  history. Follow the supplier's acknowledgement link in the local PASS fixture.
- **Expected:** sent revision and approved revision agree; each recipient receives the intended PDF and the record
  retains it. Already-sent recipients are distinguished from new delivery, and a failed recipient does not undo
  successful independent sends. Issued content remains identifiable after later commercial edits.
- **Recovery:** stale revision, missing/invalid address, PDF unavailable, canceled send, response lost after success and
  expired content link. Distinguish recorded send, queued delivery and actual captured message; inspect unknowns.
- **Screens/modes:** OrderDetail send/as-of/print/content, linked RFQ and agreement output patterns; browser/TUI/Standard,
  actual bytes and captured attachments. Terminal delegation to a browser/download must be truthful.

### PUR-14 — Hold, cancel or close the remaining commitment

- **Actor/start:** buyer and purchase-hold releaser; untouched draft, sent order and partly received/billed order.
- **Objective/steps:** OrderDetail → Hold with reason → inspect current hold and next action → release with the permitted
  identity → cancel an untouched order with reason; separately close a partly received order's remainder → inspect
  canceled quantity, expected receipt and history. Clone an eligible order and review the new draft's lines.
- **Expected:** hold, cancellation and closing a remainder describe different effects. Closing preserves receipts,
  bills and audit history; unrelated holds remain. Clone creates a draft without carrying payments, files or notes,
  and identifies any now-unusable product that must be corrected before placement.
- **Recovery:** buyer without hold release, received/billed order cancellation, missing reason, no remaining quantity,
  canceled confirmation and changed source state. A failure leaves the original order and posted facts intact.
- **Screens/modes:** OrderDetail More/actions and PurchaseOrders views/bulk result; browser/TUI/Standard, explicit record
  identity in confirmation and list/Back context after closure.

### PUR-15 — Revise an order and reconcile the supplier's promise

- **Actor/start:** buyer and approver; sent partly received order with a retained old issue and second receiver identity.
- **Objective/steps:** OrderDetail → Change order → inspect Change hold → propose line/part changes → review old/new
  values, received/billed/returned/accepted quantities and effects → apply with reason → approve new revision → resend.
  Record supplier acknowledgement and line promise → inspect Acknowledgements/Today → send captured reminders.
- **Expected:** revision preview explains what changes and what prevents it; applying binds to the reviewed receipt
  basis and updates expected receipt/budget/match effects coherently. Acknowledgement is a claim about the current
  revision, not an unreviewed price/quantity edit. As-of print recovers the earlier commercial content.
- **Recovery:** cut below received quantity, concurrent receipt, stale order, invalid substitution, canceled change,
  supplier accepting with changes/rejecting, superseded acknowledgement and one failed reminder recipient.
  Historical reminder-after-send/write-failure behavior needs explicit investigation, not a promised exactly-once send.
- **Screens/modes:** OrderChanges, OrderDetail revision/acknowledgement sections, Acknowledgements and output links;
  browser/TUI/Standard, keyboard grid, long-form/narrow and lost-response scenarios.

### PUR-16 — Approve an agreement and release against its remaining allowance

- **Actor/start:** buyer and approver; active blanket, draft template, dated terms and capped item quantity/amount.
- **Objective/steps:** AgreementList → create from template or new → maintain items, terms and signers → upload evidence
  → submit → approve/activate through offered actions → inspect retained print → release selected quantity to PO →
  follow order/source links and return → change a cap/term with reason and inspect revision/approval implications.
- **Expected:** agreement, item and term dates are legible; approved revision and remaining allowance are distinct from
  ordered, received and billed totals. Release respects price, quantity/amount cap and tolerance and creates a draft
  order. A template is clearly a starting point rather than an active commercial authorization.
- **Recovery:** expired/inactive agreement, excess cap, invalid unit/date, stale approval, missing signer/evidence,
  canceled release and already-consumed quantity. Existing released orders remain available after agreement expiry.
- **Screens/modes:** AgreementList/AgreementDetail, Supplier360/PurchasingAgreements, agreement release on OrderDetail;
  browser/TUI/Standard, row dialogs, files and current/as-of PDF. Recurring releases are outside this activity.

### PUR-17 — Turn a supply shortage into authorized buying work

- **Actor/start:** planner and buyer with facility scope, mixed buy/make/transfer/outside suggestions and customer demand.
- **Objective/steps:** Replenishment → SupplyPlanning → select `planFacilityId` and horizon → run/read current plan →
  inspect demand/supply, held pending-release lines, exception and freshness → choose supplier/source → select eligible
  buy/outside suggestions → convert to draft orders or purchase requests under policy → follow result and refresh plan.
- **Expected:** the plan identifies its facility set and timestamp; draft converted orders count as supply and the same
  demand is not bought twice. Purchasing's conversion does not create make work orders; Manufacturing and Warehouse
  continuations preserve source identity. A planner who can run need not be allowed to buy.
- **Recovery:** stale/superseded run, no source, missing method read, snoozed rule, held stock, blocked supplier, concurrent
  converter, already-covered demand and canceled selection. Partial results name the suggestion and continuation.
- **Screens/modes:** SupplyPlanning, InventoryAvailability, RequestSourcing/OrderDetail source links; browser/TUI/
  Standard, selected-row confirmation and narrow demand/supply detail. Customer drop-ship route continues PUR-23.

### PUR-18 — Set reorder levels and a schedule with visible effects

- **Actor/start:** planner/stock-policy holder and reader; one item with history and one without it at an authorized facility.
- **Objective/steps:** ReorderRules/Rules → create/change min/max or fixed-quantity rule and supplier → inspect equivalent
  InventoryAvailability/Policy → snooze rule → SuggestLevels choose history/lead/safety/cover basis → preview → apply
  selected suggestions with reason → PlanSchedule save timing and preview a run → revisit plan and schedule result.
- **Expected:** rule, suggestion and applied value are distinct; missing demand/lead time is named, not zero demand;
  selected valid rows can apply despite another refusal. Snoozing remains visible in shortage planning. The schedule
  identifies whose permissions execute it and the actual last result rather than implying that saving ran a plan.
- **Recovery:** invalid min/max/day values, unavailable facility/product, no history, no reason, canceled apply,
  revoked scheduler authority and one failed scheduled scope. Existing values persist after an invalid submission.
- **Screens/modes:** all three ReorderRules children, InventoryAvailability/Policy and SupplyPlanning; browser/TUI/
  Standard, large localized quantity edits, selected-value labels, dates and keyboard/narrow forms.

### PUR-19 — Receive a purchase and reserve the right accepted stock

- **Actor/start:** buyer, buyer-receiver and quality counterpart; approved PO, partial receipt and a customer-demand peg.
- **Objective/steps:** OrderDetail → Expected receipt (ASN) → open ShipmentDetail → inspect lines and locations → receive
  partial quantity or a permitted Receive all as expected → inspect accepted/rejected/held amounts → finish only the
  intended remainder → follow quality outcome → reserve eligible received stock for its linked sales demand.
- **Expected:** expected receipt retry opens the same receipt; receiving uses Warehouse's stock service and facility
  authority. Expected, received, accepted, rejected, held and released amounts are separate. Reservation consumes
  only eligible stock and names the customer order line; a receiving confirmation is not bill approval.
- **Recovery:** buyer without receive grant, wrong location/facility, over-receipt, tracking/inspection requirement,
  stale row, canceled finish, locked posting date and a demand already reserved elsewhere. Preserve unrelated receipts.
- **Screens/modes:** Receipts, OrderDetail receipt section, Purchasing ShipmentDetail and ReceiptPegs; browser/TUI/
  Standard, row entry and actual saved stock/result. Warehouse handheld execution is a bounded owner handoff.

### PUR-20 — Explain an inspection and complete its permitted disposition

- **Actor/start:** buyer reader and separately granted inspector, verifier, disposer/template editor; quarantined receipt.
- **Objective/steps:** Receipts or Supplier360 receipts → Inspections → QualityInspection → inspect source quantity and
  template → record permitted results/evidence → verify → dispose accepted/rejected units → return to receipt and
  available stock. Open InspectionTemplates through the current entry and maintain a disposable receipt template.
- **Expected:** inspect, verify and disposition remain separate actions; accepted result alone does not imply released
  stock. Supplier quality context links to the right order/receipt and displays remaining held quantity. Template
  changes do not silently rewrite a completed inspection's recorded evidence.
- **Recovery:** missing sample/result, invalid quantity, wrong source type, missing grant, stale result, canceled
  disposition and an inspection file unavailable to the actor. Verify any offered certificate's actual owner route.
- **Screens/modes:** Inspections, QualityInspection, InspectionTemplates, Supplier360/PurchasingReceipts and receipt
  return; browser/TUI/Standard, two result rows, file delegation and narrow/keyboard samples.

### PUR-21 — Accept purchased services and reconcile subcontract output

- **Actor/start:** buyer/receiver with a non-stock service PO; Manufacturing operator and Warehouse counterpart for a
  separately dispatched subcontract order.
- **Objective/steps:** OrderDetail → Record acceptance on the non-stock line → quantity/date/acceptor/evidence → confirm
  → inspect acceptance and bill eligibility. For subcontracting, follow the PO's source operation to dispatch/custody
  and Manufacturing output receipt, then return to the PO's existing acceptance and matching evidence.
- **Expected:** ordinary acceptance uses `mantle.order.OrderServices.accept#ServiceItem`, requiring purchase-edit or
  stock-receive authority and organization scope. Subcontract acceptance comes from
  `mantle.work.ProductionServices.receive#SubcontractOutput`; vendor-custody issue, production-valued output and
  service-acceptance/accrual evidence stay associated. Do not accept the subcontract line again or value output at
  the service PO price. Financial production close remains Accounting's separate operation.
- **Recovery:** stock line submitted as service, over-acceptance, canceled PO, missing evidence, same-operation retry,
  wrong organization and missing subcontract dispatch/output prerequisites. A missing physical step remains pending.
- **Screens/modes:** OrderDetail acceptance/source/receipt/bill sections, Manufacturing subcontract/work-order and
  Warehouse custody handoffs; browser/TUI/Standard on the built routes, including useful read-only buyer presentation.

### PUR-22 — Resolve a supplier bill's match exception without crossing finance authority

- **Actor/start:** buyer, buyer-matcher, AP intake/approver and reader; partial accepted receipt, price variance and duplicate bill.
- **Objective/steps:** Bills/PO → Upload supplier bill or permitted Create draft bill → InvoiceDetail → inspect source,
  holds and exception lines → InvoiceMatch choose accepted receipt/service evidence → apply → reevaluate selected
  exceptions → Ask to release with reason → finance continuation → reopen bill and PO. Preview/apply a bounded legacy
  match batch with one ambiguous row and inspect its named result.
- **Expected:** bill quantity cannot be justified by merely received or rejected stock; service acceptance is explicit.
  Buyer import, matching, finance hold release, approval and payment are separate. Buyer sees useful status while
  restricted payment/GL detail is withheld. A duplicate supplier reference identifies the existing bill.
- **Recovery:** invalid/quarantined file, duplicate reference, no match grant, over-match, ambiguous legacy receipt,
  price/quantity hold, stale receipt/acceptance and independently failed reevaluation. Preserve successful members.
- **Screens/modes:** BillList, InvoiceDetail, InvoiceMatch, MatchExceptions, PO bill/prepayment and supplier Bills;
  browser/TUI/Standard with actual upload/content handling. Landed cost/AP payment outputs are bounded owner handoffs.

### PUR-23 — Confirm a drop-ship delivery from its commercial evidence

- **Actor/start:** buyer and supplier contact; valid drop-ship facility, customer demand, price and synthetic delivery report.
- **Objective/steps:** Supplier360/Drop-ship inspect facility/integration → route an eligible customer shortage from
  RequestSourcing, SupplyPlanning or the shared order action → inspect resulting purchase and linked sales lines →
  approve/send as required → read supplier report → buyer Confirm delivery/Confirm line with quantity/tracking →
  inspect purchase delivery, sales shipment, invoice and remaining quantity → repeat the completed confirmation.
- **Expected:** report receipt and buyer confirmation are visibly distinct. `report#DropShipDelivery` ships/posts
  nothing; `finalize#DropShipPurchaseOrder` performs the authorized delivery and linked customer fulfillment.
  Drop-ship purchase delivery is not received into the local warehouse. Partial quantities and tracking reconcile.
- **Recovery:** missing price, blocked supplier, order waiting approval, wrong sales line/facility, ambiguous product,
  excessive quantity, canceled confirmation and uncertain response. A repeated completed outcome creates no new delivery.
- **Screens/modes:** Supplier360/PurchasingDropShip, PurchaseOrders Drop-ship view, OrderDetail/OrderDropShip and source
  routes; browser/TUI/Standard; external report through PUR-28 and financial outcome through the authorized owner.

### PUR-24 — Return received goods to a supplier and follow credit or replacement

- **Actor/start:** buyer with return authorization, Warehouse shipper and AP counterpart; rejected and released receipt units.
- **Objective/steps:** SupplierReturns or receipt/order → New supplier return → select exact eligible receipt quantities
  and response → record supplier RMA → Authorize → inspect ReturnAuthorization → follow Warehouse dispatch → reopen
  ReturnDetail → finance settles eligible supplier credit or buyer creates replacement → inspect linked PO/expected receipt.
- **Expected:** receipt provenance and returned/shipped/credited/replaced quantities remain clear. Warehouse
  `ship#SupplierReturn` moves stock and settles nothing. Accounting/Mantle `settle#Return` supplier credit requires AP
  authority and shipped-back/billed limits; replacement excludes its quantity from credit. Physical return is not an
  automatic promise to refund unbilled stock. Customer Service's original case may link this result without owning it.
- **Recovery:** wrong return direction, excess receipt quantity, missing RMA/evidence, canceled authorization, unshipped
  or unbilled credit, repeated replacement operation and unavailable supplier. Retain original receipt quantities/history.
- **Screens/modes:** SupplierReturns, ReturnDetail, ReturnAuthorization, Supplier360/PurchasingReturns, order links and
  Warehouse/Accounting continuations; browser/TUI/Standard, actual printable authorization and repeat-result inspection.

### PUR-25 — Evaluate supplier performance and record a risk with evidence

- **Actor/start:** buyer/scorecard editor and reader; sufficient and insufficient receipt history, policy and active risk.
- **Objective/steps:** Scorecards → evaluate selected suppliers for stated period → inspect per-supplier results →
  ScorecardDetail metric drill to original promise, receipt, rejection and other evidence → recalculate → compare
  retained evaluations → record/end a risk → follow Supplier360/Performance and a buying-policy consumer.
- **Expected:** denominators, period, policy version and evidence distinguish a poor score from insufficient data.
  Recalculation retains the previous evaluation. Any Warn/Stop effect is explained separately from manual risk text
  and from supplier approval; a short sample does not silently become a buying ban.
- **Recovery:** missing/invalid evidence, unsupported metric, empty period, one failed supplier evaluation, no edit grant,
  stale policy/risk and canceled action. Date changes should not restate a retained evaluation without recalculation.
- **Screens/modes:** Scorecards/ScorecardDetail, Supplier360/PurchasingPerformance and ScorecardPolicies;
  browser/TUI/Standard, metric drill/Back, two risk rows and actual export contents.

### PUR-26 — Explain procurement progress and spending from source to report

- **Actor/start:** buyer, reader and separately authorized finance/budget reader; linked request/order/receipt/bill/payment.
- **Objective/steps:** Home/Performance → Spend, Commitments, ProcurementTracker, PurchaseHistory and SupplierStatement
  → choose organization/supplier/product/date/currency/stage basis → drill to source and return → export CSV/print →
  compare values and restrictions with Supplier360 and Product360 history.
- **Expected:** committed, billed, reserved and actual are labeled and not summed indiscriminately. The tracker shows
  missing steps as such; bill/payment details depend on grants. Currency/date/filter basis survives output. Supplier
  statement balance is explained from its actual bill/credit/payment inclusion, not assumed to be only applications.
- **Recovery:** no rows, mixed currencies, unavailable source, amount withheld, boundary dates, historical corrected
  record and export error. A restricted drill must not leak identity or amounts in CSV/print or the response payload.
- **Screens/modes:** all seven Performance pages, Home spend summary, supplier/product consumer tabs and linked
  InsightsRecord helper where authorized; browser/TUI/Standard with actual downloaded bytes and narrow tables.

### PUR-27 — Change purchasing policies and prove the intended consumer

- **Actor/start:** purchasing administrator with captured baseline, narrow operator and separate approval/score fixtures.
- **Objective/steps:** SettingsHome → purpose/category add/edit → PurchasePolicy defaults/controls change with effective
  date/reason → ApprovalPolicies add/change/end step and preview amount/source type → ScorecardPolicies change basis,
  criterion/response rule → reload → exercise one intended consumer per change → restore disposable fixture baseline.
- **Expected:** inherited/default versus dated local values are clear; one form preserves unrelated policy fields.
  Required reasons, effective dates, eligible approvers and amount-band boundaries are understandable. A configured
  option whose consumer is not built is recorded as a limit, not counted as a working workflow.
- **Recovery:** overlapping approval bands, no eligible quorum, invalid percentages/dates, stale expected row, wrong
  organization, missing edit grant and canceled end. A refused update preserves the form and previously effective policy.
- **Screens/modes:** SettingsHome, PurchasePolicy, ApprovalPolicies, ScorecardPolicies and consumers in PUR-03/05/10–12/
  17/25; browser/TUI/Standard, keyboard, long labels, localized numeric edit and 200% zoom samples.

### PUR-28 — Receive a supplier response through the public handoff

- **Actor/start:** buyer and external supplier contact/capability, second supplier and scoped local PASS Supplier site.
- **Objective/steps:** Supplier360 Invite → captured invitation/contact access → SupplierHome → open only sent RFQ →
  QuoteResponse enter offer → Save draft → reopen private draft → Send quote with supported file → inspect receipt and
  internal quote/notification. Open current PO
  → OrderAcknowledgement accept/change/reject and line promises → buyer review; submit BillUpload → internal bill
  intake. For drop-ship, submit delivery report and confirm separately in PUR-23.
- **Expected:** external pages show the supplier's published document and its sent revision, no competitor quote,
  internal request, unrelated organization or internal navigation. The saved draft remains private until sent;
  the public quote page offers Save draft and Send quote, while internal Declined is covered in PUR-07.
  Acknowledgement changes neither ordered price/
  quantity nor stock/payment. Scanned attachments and repeated response receipts stay attached to the right record.
- **Recovery:** wrong contact/site, revoked/expired link, superseded revision, unsent RFQ, canceled quote/order,
  throttled request, upload scan failure, duplicate bill and lost response. Record missing download/control support
  honestly rather than manufacturing it from the public design.
- **Screens/modes:** PASS SupplierHome/QuoteResponse/OrderAcknowledgement/BillUpload and internal return points;
  public browser desktop/390px/keyboard plus BOSS buyer modes. Local and remote PASS authority are separate variants;
  do not claim remote coverage from a local success or start another runtime without its explicit execution scope.

### PUR-29 — Keep discussion, files and issued documents with the correct record

- **Actor/start:** buyer, reader and restricted counterpart on supplier, request, RFQ, quote, PO, agreement and return.
- **Objective/steps:** owning record → Chatter/Files or named content control → inspect existing evidence → upload a
  permitted local file → post permitted discussion → reload/follow notification → download original and issued content
  → compare record identity and access after navigation to another record and Back.
- **Expected:** files distinguish original supplier evidence from generated issue revisions; discussion audience and
  record identity remain visible. Read-only users get useful readable content without write controls. Async completion
  after navigation cannot attach the upload or message to the destination record.
- **Recovery:** missing/deleted file, denied record, invalid/oversized/quarantined file, failed upload, lost grant,
  canceled dialog and same-named files on two records. Error recovery retains the intended record and entered message.
- **Screens/modes:** Chatter/RecordFiles with their TUI helpers, Supplier360 Documents/Conversation, Product360/Documents/
  Index and record-specific `rfqContent`, `quoteContent`, `orderContent`, `agreementContent`; browser/TUI/Standard,
  inspected bytes and explicit terminal upload/download delegation.

### PUR-30 — Reconcile permission, organization and context boundaries

- **Actor/start:** narrow holder/non-holder pairs and Retail/Services counterparts with otherwise-valid matching inputs.
- **Objective/steps:** reconcile refusals collected in earlier activities → inspect outstanding direct routes,
  transitions, choices, palette/record links, inherited children, exports and content download → repeat with rightful
  holder → verify requester's own/assigned scope, shared supplier with private organization records, and external supplier.
  Include the inherited Product360/Prices CSV/XLSX endpoints: compare an authorized owning-context output with the
  Purchasing context's actual refusal or omission rather than inferring authority from declared export controls.
- **Expected:** root and area authorizations, record ownership and service permission all hold. Forged `appRoot`,
  organization, supplier, facility or source IDs do not widen access; no restricted money is sent then hidden. A buyer
  with receiver or matcher grant can perform the admitted Purchasing action without an unrelated app launcher.
- **Recovery:** expired grant/relationship, foreign active organization, missing record, private supplier contact,
  unavailable choice selection and permission lost after preview. Distinguish validation failure from the intended refusal.
- **Screens/modes:** remaining inventory boundaries across Material/TUI/Standard and output endpoints; this is a
  targeted access/isolation activity. If automated later, broad coverage belongs in acceptance, not repeated regressions.

### PUR-31 — Reconcile cross-app continuity and remaining modes

- **Actor/start:** selected owner/consumer pairs and the unresolved mode/branch ledger from PUR-01–30.
- **Objective/steps:** trace source→Purchasing→owner→Purchasing with one record identity for receiving, inspection,
  subcontract acceptance, supplier return/credit, AP matching, product price and supply planning; exercise Back and
  direct bookmark after a fresh app navigation. Finish remaining TUI, Standard, narrow, zoom and output samples.
- **Expected:** app context supplies the appropriate actions and return path without changing the record or authority.
  Purchasing's money/stock/quality handoffs agree with the owning review, and later shared corrections work for a
  representative second consumer. Unimplemented transfer or external dependency is an explicit unresolved branch.
- **Recovery:** missing owner launcher, inaccessible counterpart, stale origin URL, changed selected record, lost
  browser state and unsupported terminal action. Preserve the first meaningful refusal and a useful way back.
- **Screens/modes:** every remaining mapped inspection, defaults, helpers and outputs; observed modes recorded by
  activity. Stop only with passed evidence or a named blocked/deferred/failed continuation, never an inferred all-pass.

## 5. Existing checks and future verification

This is a source inventory of available checks, not a report of new execution. There are **14 Purchasing server
regression specs**, **one Purchasing browser regression walk**, and **18 Purchasing server acceptance specs**.
The identically named `PurchasingOrdersWalk` exists in both server acceptance and browser regression; distinguish
the suite and path in any command/result. There is no Purchasing-specific acceptance client directory at this
snapshot; PASS's supplier browser walks are in that component.

| Current coverage | Source / what it establishes when run | Activities / remaining review |
| --- | --- | --- |
| BOSS access rules | `test/Purchasing/PurchasingAccess.spec.js`: root/area/capability/scope, selected choices, direct operations and composed receiving/matching access | PUR-01, 30; live discoverability, direct descendant and mode gaps still pending |
| Supplier and app presentation | `PurchasingSuppliers`, `PurchasingApprovals`, `PurchasingOrders`: scoped rows, controls, preview/Today and independent bulk outcomes | PUR-02–03, 11–14 |
| Requests and sourcing | `PurchasingRequests`, `PurchasingSourcing`: requester scope, source preview, RFQ/quote reads, comparison and work cues | PUR-05–10 |
| Supply and agreements | `PurchasingAgreements`, `PurchasingReplenishment`: app reads, agreement release and stock/planning controls | PUR-16–18 |
| Receipt, finance and return context | `PurchasingReceiving`, `PurchasingBills`, `PurchasingReturns`, `PurchasingDropShip`, `PurchasingRevisions` | PUR-15, 19–24; server presentation/transition checks are not observed browser flows |
| Performance | `PurchasingPerformance`: commitments, spend/tracker restrictions and evaluation presentation | PUR-25–27 |
| Single browser golden path | `test/client/Purchasing/PurchasingOrdersWalk.spec.js`, registered in `test/client/suite.js`: buyer creates/places, approver approves, buyer sends at 1280×1000 | PUR-11–13; does not cover all modes, recovery, outputs or purchasing workflows |
| Acceptance foundation/access | `acceptance/Purchasing/PurchasingFoundationWalk.spec.js`, `PurchasingAccessWalk`: groups, scope, direct surfaces, outputs, supplier access and standalone receive/match | PUR-01, 28, 30–31; authorization required to run |
| Acceptance supplier/order/approval | `PurchasingSuppliersWalk`, `PurchasingOrdersWalk`, `PurchasingApprovalsWalk`, `PurchasingRevisionsWalk` | PUR-02–03, 11–15, 27; source scenarios include partial failures and as-of content |
| Acceptance demand/source/award | `PurchasingRequestsWalk`, `PurchasingSourcingWalk`, `PurchasingAwardWalk` | PUR-05–10; mixed groups, repeated operations and losing quote closure |
| Acceptance agreement/planning | `PurchasingAgreementsWalk`, `PurchasingReplenishmentWalk`, `PurchasingReplenishmentRoutesWalk` | PUR-16–18; request/buy/drop-ship routes and pegged receipt reservation |
| Acceptance physical/financial handoffs | `PurchasingReceivingWalk`, `PurchasingBillsWalk`, `PurchasingReturnsWalk`, `PurchasingDropShipWalk` | PUR-19–24; actual scoped UI execution remains separate |
| Acceptance performance and source sweep | `PurchasingPerformanceWalk`, `PurchasingServerStatic` | PUR-25–26, 31; ServerStatic inspects source cleanliness, not a browser journey |

All BOSS names above without another directory are under `test/Purchasing/` for regression or
`acceptance/Purchasing/` for the explicitly marked acceptance rows. Shared helpers include `PurchasingSpecLib.js`
and `PurchasingDropShipLib.js`. Inspect setup/`dependsOn` and fixture ownership before selecting a future run; a
dependency that creates scenario records is not permission to execute the acceptance suite while planning.

| Owning component checks | Actual rule/contract and review use |
| --- | --- |
| Mantle `test/order/PurchasePolicy`, `PurchaseOrders`, `PurchaseApprovals`, `PurchaseHoldPermission` | Buying policy, ordered product/price, approval gate/steps, holds and source authority; PUR-03, 11–14, 27 |
| Mantle `PurchaseRequests`, `Sourcing`, `SourcingAwards`, `PurchaseRevisions` | Request demand, issue/offer/award operations, revision/receipt race and retries; PUR-05–10, 15 |
| Mantle `PurchaseReceipts`, `PurchaseBills`, `PurchaseReturns`, `DropShip` | Physical/commercial handoff and bill/return/delivery rules; PUR-19–24 |
| Mantle `test/party/PurchaseAgreements`, `SupplierScorecards` | Agreement version/cap/release and evidence-based evaluations; PUR-16, 25–27 |
| Mantle `test/product/SupplyPlanning`, `Replenishment`, `ReplenishmentRoutes` | Netting, conversion, repeated demand, stock policy and source routes; PUR-17–18, 23 |
| Mantle `test/order/SupplierPortal` | Published revision, external scope, repeated response, revocation and supplier delivery report; PUR-28 |
| Mantle acceptance `order/PurchaseApprovalBudgetWalk`, `party/PurchaseAgreementWalk` | Complete owner scenarios; future requested selection only, not implied by this document |
| PASS `test/Supplier/SupplierPages`, `test/Billing/Portals`, `test/client/PortalHttp` | Page/operation projection and existing portal baseline; inspect exact asserted branches before relying on them |
| PASS `acceptance/client/SupplierPortalHttp`, `acceptance/SupplierPortalFixtures`, relevant remote-authority acceptance | Public quote/acknowledgement flow and required setup; local and remote outcomes are distinct |
| Existing Warehouse/Manufacturing/Accounting rule and acceptance families | Reuse owner checks for stock/quality, subcontract output, close and finance settlement; do not duplicate those rules in BOSS Purchasing |

The implementation record's verification table is useful provenance, but some of its “future” contexts and test
paths predate the current app/suite layout. Verify actual filenames and scenario assertions. No historical passed
count closes a present review activity, and a rendered source sweep never proves visible navigation or output bytes.

### Verification rules for later refinements

- Read the [testing skill](../../../../.agents/skills/testing/SKILL.md) before writing or running tests. Use the owning
  component's focused regression checks for a changed rule or bug, on an appropriate existing binary for XML/script
  work. For example, from the framework root: `./moq test mr-boss --spec PurchasingRevisions --nobuild`.
- Browser specs run through Moqui, not Node. The existing golden path can be selected explicitly with
  `./moq test-client mr-boss --serve --spec PurchasingOrdersWalk --nobuild`; its setup and mail/PDF prerequisites
  must be established. Do not add another general purchasing golden path.
- Follow supplied pre-commit rules for later implementation: `./moq test-apps` for application work;
  `./moq test-framework` for framework work. Do not inherit another review's exception or run framework specs,
  `cargo test` or `test-all` merely because an application changed. This documentation batch includes no commit.
- **Acceptance runs require the user's request or an added/changed acceptance test.** Then run the requested
  selection, or the added/changed test and its component's acceptance suite once written. A review activity,
  dependency, shared-code correction or completion checkpoint does not authorize acceptance. No `accept-all` is
  part of this plan. An explicitly requested receipt walk could select `./moq accept mr-boss --spec PurchasingReceivingWalk`.
- Full scenarios, phone/access/isolation walks and screen sweeps belong in acceptance. Across regression, render a
  screen at most once per mode with its checks together; a second mode needs a custom template. Do not add a sweep,
  users×modes matrix or duplicate Mantle business-rule tests through BOSS wrappers.
- Respect current BOSS `test/budget`: **264 seconds server / 57 seconds client**, and the **15-second** individual
  regression spec limit. Observe each other component's current budget. Remove duplication or move complete
  scenarios to acceptance rather than raising a budget without the user's agreement.
- Lint later changed screens with `moqui lint --screens <report-file>`: the argument is an overwritten output report,
  never the screen path. Compare baseline parse/idiom counts. No screen lint or application tests are necessary for
  this Markdown-only document.
- Keep later evidence in ignored framework `plans/ui-refinement-evidence/boss-purchasing/` or an explicit equivalent
  outside tracked source. Inspect matching before/after geometry/data/themes, relevant console/network/DOM results,
  persisted outcomes, captured messages and redacted artifact bytes. Do not commit screenshots, credentials or tokens.
- Re-exercise corrected activities and their relevant recovery branches, including a second shared consumer where
  appropriate. Record tool limitations, missing prerequisites and reproduced baseline failures separately from
  product defects. An unsupported route or external dependency stays unresolved, not silently skipped as passed.

## 6. Coverage, findings and running record

### Activity coverage ledger

**Pending** means not reviewed; **inspected** means source/render/visual inspection only; **exercised** means steps
executed with an explicit pass/fail/partial outcome; **blocked** means a missing prerequisite; **deferred** means
deliberately postponed with reason and follow-up. Exercised alone does not mean passed. Source research for this
document does not advance live activity coverage. Record mode/recovery gaps and actual results, not only test names.

| Activity | Status | Outcome / recovery / mode gaps | Evidence / findings |
| --- | --- | --- | --- |
| PUR-01 — Workday and scope | pending | All live variants unreviewed | — |
| PUR-02 — Supplier identity/profile | pending | All live variants unreviewed | — |
| PUR-03 — Supplier approval/restriction | pending | All live variants unreviewed | — |
| PUR-04 — Product/price explanation | pending | All live variants unreviewed | — |
| PUR-05 — Purchase request | pending | All live variants unreviewed | — |
| PUR-06 — Request sourcing | pending | All live variants unreviewed | — |
| PUR-07 — RFQ issue | pending | All live variants unreviewed | — |
| PUR-08 — Supplier quote/price | pending | All live variants unreviewed | — |
| PUR-09 — Offer comparison | pending | All live variants unreviewed | — |
| PUR-10 — Award/losing invitations | pending | All live variants unreviewed | — |
| PUR-11 — Purchase order | pending | All live variants unreviewed | — |
| PUR-12 — Approval/budget | pending | All live variants unreviewed | — |
| PUR-13 — Issue and retained evidence | pending | Requires local PDF/mail prerequisites | — |
| PUR-14 — Hold/cancel/remainder/clone | pending | All live variants unreviewed | — |
| PUR-15 — Revision/acknowledgement | pending | All live variants unreviewed | — |
| PUR-16 — Agreement/release | pending | All live variants unreviewed | — |
| PUR-17 — Supply plan/conversion | pending | All live variants unreviewed | — |
| PUR-18 — Reorder/schedule | pending | All live variants unreviewed | — |
| PUR-19 — Receipt/reservation | pending | All live variants unreviewed | — |
| PUR-20 — Quality/disposition | pending | All live variants unreviewed | — |
| PUR-21 — Service/subcontract acceptance | pending | Requires owner-side physical evidence | — |
| PUR-22 — Bill/match resolution | pending | All live variants unreviewed | — |
| PUR-23 — Drop-ship delivery | pending | Synthetic external evidence and customer outcome required | — |
| PUR-24 — Supplier return/settlement | pending | Warehouse and finance continuations pending | — |
| PUR-25 — Scorecard/risk | pending | All live variants unreviewed | — |
| PUR-26 — Reports and source trace | pending | All live variants unreviewed | — |
| PUR-27 — Policy consumers | pending | All live variants unreviewed | — |
| PUR-28 — PASS Supplier handoff | pending | Requires explicitly configured local public-site fixture | — |
| PUR-29 — Evidence/discussion | pending | All live variants unreviewed | — |
| PUR-30 — Access/isolation | pending | Paired checks throughout; no matrix inferred | — |
| PUR-31 — Continuity/mode reconciliation | pending | Depends on earlier unresolved continuations | — |

### Findings register

No runtime/UI defects have been established by this documentation task. Number later findings **PUR-UI-001** onward.
Distinguish observed failures, source suspicions and design judgments. P1 blocks work or makes essential information
unusable; P2 causes substantial friction or misleading presentation; P3 is a localized refinement. Data corruption
or unauthorized disclosure takes priority regardless of appearance.

| ID | Severity / status | Actor, activity and step | Route / mode / theme / viewport | Reproduction, impact and evidence | Owner / correction / retest |
| --- | --- | --- | --- | --- | --- |
| — | No observed findings yet | — | — | Source concerns below are investigation inputs | — |

Source concerns to carry into later execution, without treating them as newly observed defects:

- Shared catalog and supplier descendants exist physically beyond the admitted tab set. Inspect direct routes,
  helper choices and outputs alongside an authorized owning-app counterpart; menu omission is not a security result.
- Shared Supplier360 profiles are organization-specific while the supplier itself may be shared. Inspect organization
  switching, finance omission, duplicate candidates and current selected labels for stale or foreign context.
- RFQ sent revision, offer revision and published supplier-price dates are different histories. Reconcile historical
  F176/F189 with current service basis and actual controls before reporting stale-comparison behavior.
- Approval, award, reminder, issue and conversion retries have different persisted receipts. Historical reminder
  send/write ambiguity must not become a generic “retry is safe” promise in the UI or the review record.
- Receipt quality, service acceptance, subcontract output and bill match use different quantity/evidence bases.
  Trace the original record rather than equating accepted, released, billed and settled quantities.
- The implementation's older deferrals mention now-built neighboring apps and omit some current supplier tabs.
  Keep current mounts and authority as truth; absent Purchasing prints/imports remain capability limits.
- Reports deliberately withhold some amounts and use different commitment, bill and payment bases. Confirm the
  explanation in visible text and exported bytes instead of inferring one shared “spend” total.

### Bounded batch record

| Batch | Scope | Evidence / verification | Outcome / continuation |
| --- | --- | --- | --- |
| Plan — 2026-11-10 | Dedicated Purchasing author in the coordinated four-app batch; current local/shared inventory, workflows, grants, fixtures, outputs and test coverage | Source/document inspection only; no runtime, tests, outputs or business mutations | Initial review plan written; all PUR activities pending |
| Independent document review corrections — 2026-11-10 | Separate reviewer checked inventory, activities, contracts, roles, fixtures and test coverage; author corrected PUR-09 unit-price ranking versus unknown landed cost and PUR-28 private draft/send flow, retaining internal decline in PUR-07 | Independent reviewer rechecked Mantle `Awards.js`, PASS `QuoteResponse.xml`/`.html.fancy` and the internal BOSS decline action; Markdown edits only; no builds, runtime, tests, walkthroughs or commits | Both required corrections resolved; independent recheck passed with no new contradiction; all live PUR coverage remains pending |
| Inherited output addendum — 2026-11-10 | Coordinator identified omitted CSV/XLSX variants on the three SupplierPrices mounts and inherited Product360/Prices; author added inventory, workbook-content checks and paired authorization/output inspection | Independent reviewer confirmed `Shared/SupplierPrices.xml` and `Shared/Prices.xml` declarations, mounts and authority distinctions; Markdown edits only; no builds, runtime, tests, walkthroughs or commits | Earlier independent review remains passed; this addendum passed independent recheck; all live PUR coverage remains pending |
| Coordinator reconciliation — 2026-11-10 | Reconciled Warehouse receipt/quality/return, Manufacturing subcontract acceptance, Accounting match/credit and PASS Supplier handoffs with the companion reviews and current sources | Independent reviews/rechecks complete; source inventories, relative links/anchors, activity IDs/ledgers and Markdown whitespace checked; only four new review documents changed | Documentation batch complete; source concerns remain investigation inputs and all live activities remain pending |

At research start the coordinator recorded framework `73c8a8945abff9709260e922b4ba6c348ee903b3`, BOSS
`1f6fde4e450a1e4b79773e4a4e5d8de3dad0eebf` and Mantle `aa702d05da2b12932abf788a7c12a428b388ced6`. These are source
provenance, not a tested deployment. Independent document review and coordinator reconciliation are recorded when
completed; neither changes the live coverage statuses.

For later execution append the actor/fixture identities; actual source/binary/runtime/clock/modes; activities and
branches attempted; findings and owning layer; before/after evidence; saved outcomes and inspected artifacts;
checks/results and skips; design/implementation updates; commits when made; restored temporary state; unresolved
continuations. Keep notes bounded and link evidence instead of copying logs.

## 7. Decisions

- **Current task:** documentation only. One author researches/writes Purchasing, a separate reviewer checks it, and
  the coordinator reconciles it with the other core-app plans. No build, runtime, walkthrough, test, implementation
  or commit is part of this batch; existing documents remain unchanged.
- **Pattern:** retain Accounting's seven-part structure, source inventory, complete activities, pending ledger,
  findings and bounded notes. Do not inherit completed statuses, suite selections or execution exceptions from
  another review.
- **Source of truth:** current routes, shared contexts, services and grants govern scope. Historical placeholder/
  proposed/deferred prose is reconciled here without rewriting the older design or implementation records.
- **Business continuity:** keep organization, supplier, demand source, revision, quantity/UOM, currency/date and
  operation identity explicit. Follow the resulting physical/financial/public record through its owner and back.
- **Authority:** request, buy, approve, receive, inspect, match, pay and settle are separate capabilities. App context,
  a visible tab or another group's launcher cannot supply a missing grant. Narrow composed users exercise admitted
  shared actions without pretending to be an administrator.
- **Modes:** Material is the visual target; actual TUI and brief Standard/output checks remain explicit. PASS is a
  bounded public browser handoff. Shared custom modes and inherited helper paths remain in the inventory even
  though Purchasing has no local QVue file.
- **Verification:** use §5 and the repository rules. This plan authorizes no acceptance selection, new test, budget
  increase or exception to pre-commit requirements. Record later user-directed execution scope and cadence here.
- **Completion:** documentation completion means independent review, corrected required findings and consistent
  inventories/contracts. Later UI review completion requires observed results for selected activities and a candid
  ledger of remaining modes, recovery branches, blockers and deferred work; source inspection alone cannot establish
  a usable purchasing process.
