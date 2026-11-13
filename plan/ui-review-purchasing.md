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

This follows [Products](ui-review-products.md) and the
[document convention](design-doc-guide.md#ui-review-and-refinement-phase); it is the plan and running record of the
Purchasing review: inventory, activities, coverage, findings, decisions and bounded execution notes.

**Status: planning only, 2026-11-10 America/Chicago; source recheck and revision 2026-11-11.** Written as part of the
four-app documentation batch. All live activity and mode coverage starts pending. No runtime, browser walkthrough,
output generation, test run or business mutation was performed to write or revise it. Prior implementation results
and available tests identify useful starting points; they do not establish a passed Purchasing review. This document
does not authorize construction of absent features; acceptance runs follow §5.

### Inputs and reference patterns

- [Purchasing design](design-purchasing.md), [implementation](impl-purchasing.md) (P0–P17 built Nov 4, 2026; what is
  left is its §7) and [research](research-purchasing.md). Historical design-review decisions are traced through
  these current records; removed review files are not required inputs.
- Companion reviews [Accounting](ui-review-accounting.md), [Warehouse](ui-review-warehouse.md),
  [Manufacturing](ui-review-manufacturing.md) and [Customer Service](ui-review-customer-service.md);
  [Products review](ui-review-products.md), [Projects review](ui-review-projects.md),
  [drawers, Commons and Comms review](ui-review-drawers-commons.md),
  [framework UI review guide](../../../../../docs/dev/UI-Review.md),
  [application practices](../../../../../docs/dev/Practices-App-Dev.md), [style guide](style-guide.md) and
  [crosscut design](design-crosscut.md).
- Current `screen/Purchasing.xml`, `screen/Purchasing/`, mounted `screen/Shared/` definitions and their descendants,
  `template/Purchasing*.xml` (21 files), `service/ironstone/purchasing/` (`Purchasing.js` maps permissions and area
  authorizations to capabilities), `service/ironstone/products/SharedContext.js` (Purchasing's Product360 tabs) and
  `MoquiConf.xml`. Shared source ownership and app context matter more than the physical filename.
- `data/BossSetupData.xml` (groups, permissions, area authorizations), `BossUsersDemoData.xml` (users and
  `BOSS_PUR_REQ_A`), `BossPurchasingDemoData.xml`, `BossZPurchasingPortalDemoData.xml` (runs
  `service/ironstone/purchasing/SupplierPortalDemo.js`) over Accounting's `BossZPortalDemoData.xml`, and the existing
  Warehouse/Accounting/Manufacturing demo families.
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
| Purchase rules, commercial revisions, approval decisions, supplier policy, requests and awards | Mantle (`mantle.order.PurchaseServices`, `OrderServices`, `SourcingServices`, `mantle.request.RequestServices`, `mantle.party.AgreementServices`/`SupplierServices`); business rules and their regression checks remain usable without BOSS |
| Supplier360 | Shared BOSS parent with Purchasing's profile, approval, quote, agreement, receipt, bill, return, drop-ship and performance consumers; Accounting has a different `Payables/Supplier360` |
| Product360, SupplierPrices, PriceExplain, stock and method reads | Products-owned shared screens under Purchasing context; sales prices, master edits, standard costs and methods retain their separate permissions |
| Receipts, stock and quality | Warehouse/Mantle owns physical movement and inspection; Purchasing reads progress and offers operations only to holders of the relevant grants |
| Subcontract service orders | Purchasing owns commercial order, approval, supplier communication and bill follow-up; Manufacturing owns operation/output facts, Warehouse owns custody movements |
| Bills, matching, holds, prepayment and supplier credit | Accounting/Mantle owns finance; Purchasing imports, reads and asks for resolution within its grants. Match, AP approval, payment and settlement remain distinct |
| Requests, approvals, Chatter, RecordFiles and notifications | Existing shared/Commons owners; review Purchasing identity, audience, decisions and return paths without another full Commons review |
| SupplierHome, QuoteResponse, OrderAcknowledgement and BillUpload | PASS Supplier app (`mr-pass/screen/Supplier/`) over Mantle `SupplierPortalServices`; public accounts with no user group and record-scoped capabilities, never internal BOSS authority. BillUpload is Accounting's (impl-accounting P18) |
| Layout widgets, dialogs, charts, print/PDF, upload/download and TUI | Framework and client owners; a shared correction needs a representative second consumer |

Preserve routes, native record keys, saved finds/columns, preferences, revision and operation identity, effective
dates and entity/service contracts. Record unavoidable compatibility changes before implementing them. App context
selects a presentation; it does not grant authority. Restricted money, supplier bank/tax information, another
organization's demand and competing suppliers' offers must not enter unauthorized responses, choices or output bytes.

Do not build absent features to complete the review. Lease administration, draft-order merging, vendor consignment,
purchase-promotion quantity tiers (F140), recurring agreement releases (F134) and the other impl §7 items remain
separate. Review current cross-app consumers even where the implementation's §7 still calls them later (Customer
Service is built; Sales is still mostly placeholders). Actual supplier communication, carrier operations and
financial settlement are not fixtures: later execution uses disposable records, captured mail and local/synthetic
external outcomes.

## 2. Review method and refinement criteria

The generic method is the [UI review guide](../../../../../docs/dev/UI-Review.md):
[preparing an isolated review](../../../../../docs/dev/UI-Review.md#prepare-an-isolated-review), activities and coverage,
[judging the result](../../../../../docs/dev/UI-Review.md#judge-the-result) (viewports, themes, keyboard, contrast,
terminal) and [recording, fixing and verifying](../../../../../docs/dev/UI-Review.md#record-fix-and-verify). Products
shows it executed: its [§2](ui-review-products.md#2-review-method-and-refinement-criteria) and
[execution setup dispositions](ui-review-products.md#execution-setup-dispositions). This section keeps only what is
specific to Purchasing.

### Environment and execution setup

- **Bootstrap.** Link Mantle, BOSS and, for PUR-28 only, PASS individually into an isolated runtime with copied
  configuration, a fresh disposable database, captured mail and local outputs; the guide's framework-only bootstrap
  leaves `component/` empty and is not enough. A linked component is source: uploads, issued files and exports land in
  the disposable runtime. Fixture specs beyond demo data run as focused acceptance runs (§5); no Purchasing fixture
  spec exists, and the acceptance walks create their own users and orders. Use the release binary and embedded
  Postgres; the coordinator starts further instances as needed (§7).
- **PASS site.** The Supplier pages need a `<public-site>` for `portal.zizi.localhost` mounting `/supplier` in the
  review runtime's copied configuration ([PASS deployment](../../mr-pass/docs/Deployment.md)); Accounting's
  `ZIZI_PORTAL` site must load first, or the Purchasing portal loader makes nothing (logged warning). Local and remote
  PASS authority are separate variants; remote is out of scope unless the user adds it.
- **Mail.** `MANTLE_PURCHASE_ORDER_EMAIL`, `_REMINDER`, `MANTLE_RFQ_EMAIL` and `MANTLE_RFQ_REGRET_EMAIL` all use the
  demo server `BOSS_PURCHASING_DEMO` at 127.0.0.1:9. Run with `mail_capture_sends` so sends are captured; whether an
  uncaptured send against port 9 gives a usable failed-recipient branch is to verify at execution, otherwise prepare
  an invalid address.
- **Outputs.** Order, RFQ, agreement and comparison prints are PDFs (`xslFoTransform`) kept on the record for issued
  revisions; reports and ReturnAuthorization print as `renderMode=html-print`. Verify Chromium/PDF availability first;
  do not inherit an earlier PDF result.
- **Posting and Retail-wide changes.** Receipts, returns, drop-ship finalization, bills and supplier credits post
  stock or ledger entries and are allowed (user decision, 2026-11-11). Purchasing policy changes are Retail-wide:
  turning on the approval gate or Stop, adding award steps or `planBuyToRequest` changes the Retail orders the
  Warehouse (fresh orders for WH-10–12 and WH-36) and Manufacturing (MFG-25's service PO) reviews use. Use dated rows,
  record and restore them.
- **Prerequisites seen in executed reviews.** Embedded Postgres may need host (unsandboxed) shared memory, with every
  runner at one process-visibility level; delegated agents may have no browser tools; an isolated runtime may need
  webroot assets materialized before the terminal works; an automated tool-approval review may block a posting or
  send. Choose a free non-default port (another local Moqui may hold the defaults and is not stopped; Products used
  57820) and a hostname per browser identity, plus `portal.zizi.localhost` for the supplier. Record which apply in
  the first batch.
- **Shared runtime and concurrency.** The coordinating agent decides whether the five companion reviews share one
  runtime and manages the concurrent review agents (user decision, 2026-11-11). In a shared one it owns the lifecycle,
  no demo record is consumed by two reviews, and Retail-wide changes (PUR-27's purchasing policy rows, CS-21/22's
  `returnSettlementRequired`, MFG-06's production policy, MFG-17's forward repost flags) stay in their own batch and
  are restored, or isolated in another organization, before another review's dependent activity. In separate runtimes
  a review prepares the other side of a handoff as setup without reviewing it. Orderings: "Fixtures" below.

### Organizations, policies and dates

- **Retail buys.** Every seeded Purchasing user but `purchasing.services` is a `PrtAgent` of `ORG_ZIZI_RETAIL`,
  buying into `ZIRET_WH`. Accounting's `BOSS_ACCT_ORG` is outside this hierarchy, and every `finance.*` user is an
  agent of it only, so no seeded finance user can act on a Retail bill or return: use the prepared Retail finance
  identities of [Accounting §2](ui-review-accounting.md#prepared-retail-finance-identities).
- **Services is the foreign side.** `ORG_ZIZI_SERVICES` has only the reader `purchasing.services` and the records
  `BOSS_PUR_PO_SVC`, `BOSS_PUR_AGR_SVC` and supplier `BOSS_PUR_SUP_SVC_ORG`. No Services buyer is seeded; prepare one
  only if a positive Services write is needed.
- **Suppliers.** Shared (`_NA_` owner): `ZiddlemanInc`, `BOSS_PUR_SUP_C` (Common Fasteners). Retail-owned:
  `BOSS_PUR_SUP_B` (Brightline), `BOSS_PUR_SUP_SERVICE` (Precision Calibration, the service supplier),
  `BOSS_PUR_SUP_PENDING` (Northwind, SupaPending), `BOSS_PUR_SUP_BLOCKED` (Halvorsen, approved but blocked from
  2026-11-01 with no end). Retail SupplierProfiles exist only for Ziddleman, Brightline, Northwind and Halvorsen; no
  profile is required to buy (impl §4). Only Ziddleman and Brightline have an order email, so the others are natural
  missing-address cases. `purchasing.buyer` is the dated buyer of Brightline and Ziddleman. A shared supplier does not
  make another organization's orders, bills or profile rows shared.
- **Retail buying policy** (from 1265184000000): approval gate **off** (`approvalGateEnabled=N`, F34), supplier
  approval required with an unapproved supplier **warned** (`PusWarn`), self-approval off, commercial revisions only,
  RFQ response 5 days, quote-expiry warning 7 days, reminders after 3 days. Approval steps exist only for orders
  (`PasOrder`): below $5,000 one purchase approver (`BOSS_PUR_APR_SMALL`); from $5,000 the approver group, then
  `purchasing.admin` as a separate approver (`_LARGE_1/_2`). There are no supplier, request or award rows, so one
  purchase approver decides a supplier or request under the no-policy rule and an award places at once.
- **Dates.** Use the real clock in the review machine's current zone (America/Chicago on current machines; it will
  vary) and record both; no DST or second-zone checks (user decision, 2026-11-11). Fixed demo dates are already past
  or close: `BOSS_PUR_PO_RCV` was required 2026-10-25 (Home's late receipts and PurchaseLateReceipt);
  `BOSS_PUR_PO_ACK` was approved 2026-10-29, is sent and required 2026-11-20, and is unacknowledged; `BOSS_PUR_REQ_A`
  is required 2026-11-25; `BOSS_PUR_AGR_A` runs 2026-10-01 to 2027-10-01. The portal RFQ's response date (+10 days)
  and capability expiry (+366 days) are relative to data load. Create current, future and expired policy, price and
  agreement rows relative to the execution date, and check an exclusive end boundary in the current zone.

### Actors

The root group `BOSS_PURCHASING` opens Home and Requests. Areas are narrower (`BOSS_PUR_<Area>`, each denying the
root group): the buying lists (Suppliers, Sourcing, Orders, Agreements, Receiving, Returns, Bills, Performance,
Products) admit every group but the requester's; Replenishment the planner, buyer, reader and administrator;
Approvals the approver and administrator; Settings the administrator. Quick creates: NewPurchaseOrder and
NewQuoteRequest for the buyer and administrator, NewPurchaseRequest also for the requester. Purchasing's Product360
tab set is Summary, Identifiers, Dimensions, Packaging, Suppliers (needs SUPPLIER_PRICE_VIEW), Stock, Documents,
BOM (needs METHOD_VIEW) and PurchaseHistory; a Replenishment-only reader sees only Stock (`SharedContext.js`).

| Role term in §4 | Username | Grants beyond the root (PRODUCT_CATALOG_VIEW except the requester) | Refusal it supplies |
| --- | --- | --- | --- |
| requester | `purchasing.requester` | none; NewPurchaseRequest | buying lists, Replenishment, the other quick creates, another requester's request |
| buyer | `purchasing.buyer` | PURCHASE_ORDER_EDIT, SUPPLIER_PROFILE_EDIT, SUPPLIER_SCORECARD_EDIT, SUPPLIER_PRICE_VIEW, PAYABLE_IMPORT, RETURN_AUTHORIZE | approve, hold release, plan run, stock policy, supplier-price edit, receive, match, policy edit, Approvals/Settings, BOM tab |
| planner | `purchasing.planner` | SUPPLY_PLAN_RUN, STOCK_POLICY_PLAN, METHOD_VIEW | conversion and every order write (no PURCHASE_ORDER_EDIT), quick creates, Suppliers tab |
| approver | `purchasing.approve` | PURCHASE_APPROVE, PURCHASE_ORDER_APPROVE, PURCHASE_HOLD_RELEASE | order/supplier edits, Replenishment area |
| reader | `purchasing.read` | SUPPLY_PLAN_VIEW | every write, quick creates, Approvals/Settings, Suppliers tab |
| administrator | `purchasing.admin` | not in the root group: ALWAYS authz on the root and every area with `MANTLE_ACTIVE_ORG`; the buyer's, approver's and planner's permissions plus PURCHASE_POLICY_EDIT | the self-approval refusal (holds submit and approve); second step of the $5,000 band; never an isolation negative; lacks supplier-price edit, receive, match and quality |
| buyer-matcher | `purchasing.buymatch` | buyer plus `BOSS_ACCOUNTING_MATCH` (INVOICE_MATCH, PAYABLE_VIEW); no Accounting root | hold release, AP approval, payment |
| buyer-receiver | `purchasing.buyreceive` | buyer plus `BOSS_WAREHOUSE` root and `BOSS_WAREHOUSE_RECEIVE` (STOCK_RECEIVE) | holds the Warehouse launcher, so it is not the standalone case |
| other organization | `purchasing.services` | reader of `ORG_ZIZI_SERVICES` | every Retail record |
| buyer without the root | `manufacturing.buyer` | `BOSS_PURCHASING_BUYER` plus Manufacturing read; no `BOSS_PURCHASING` | Purchasing root; positive on Manufacturing's mounts (MFG-24/25) |
| supplier contact | `ziddleman.billing` | PASS public account of ZiddlemanInc (Accounting's invited contact), no user group | other suppliers' records, unsent documents |
| neighbours | `warehouse.receive`, `warehouse.quality`, `manufacturing.material`, `finance.*` | their own apps' grants; no Purchasing root | used only on their side of a handoff |
| prepare (Retail) | — | a standalone buyer with receive and match groups but no other root (as PurchasingAccessWalk's `purchasing.p17standalone`); a buyer with `BOSS_PRODUCTS_SUPPLIER_PRICE_EDIT` (`catalog.supplier.price.edit` is a Services user); a buyer with Warehouse's inspect or quality-manager group; a second supplier contact; and the shared Retail finance identities `retail.finance.ap` (AP intake, supplier credit), `retail.finance.approve` (hold release, bill approval) and `retail.finance.gl` (landed costs) | each names the grant its counterpart lacks |

Verify loaded memberships, permissions and organizations before interpreting a refusal. Pair each refusal with an
otherwise-valid success by a holder and name the grant the refused fixture lacks; a validation error is not
permission evidence. `john.doe` is ADMIN and drives the render/static acceptance checks, so its results are never
least-privilege evidence.

### Fixtures

| Family | Starting evidence and variations |
| --- | --- |
| Orders | `BOSS_PUR_PO_A` (draft, Brightline, 25 `DEMO_1_1` at 10.00); `BOSS_PUR_PO_RCV` (approved, Ziddleman, 10 due 2026-10-25, ASN `BOSS_PUR_RCV_SHIP` with nothing received); `BOSS_PUR_PO_ACK` (sent revision 1, Brightline, unacknowledged); `BOSS_PUR_PO_SVC` (Services, foreign); Warehouse's `BOSS_WH_PO` (PurchasingSpecLib's approved order) and service PO `BOSS_WH_SUB_PO` |
| Requests | `BOSS_PUR_REQ_A` (requester's, approved, one 12-unit Ziddleman line, requirement `BOSS_PUR_REQ_A_01`, nothing sourced); prepare multi-line, partly sourced, mixed-supplier and no-supplier requests |
| Agreements | `BOSS_PUR_AGR_A` (active revision 1, 100 ea / $1,000 cap, 5% tolerance, price row $9.00, Net 30); template `BOSS_PUR_AGR_TPL`; Services draft `BOSS_PUR_AGR_SVC` |
| Prices | Ziddleman's `DEMO_1_1` tiers (`DEMO_1_1_CS1`, `_CS100`) and the agreement price; verify values at execution; prepare a pack product, two currencies with dated rates and missing-freight offers |
| Drop-ship | facility `BOSS_PUR_DROPSHIP` (Ziddleman, no integration, so orders are emailed); `DEMO_3_1_CS` marked `canDropShip`; prepare a Retail sales line of `DEMO_3_1` |
| Portal | `ZIZI_PORTAL` on `portal.zizi.localhost`; RFQ `BOSS_PUR_PORTAL_RFQ` (25 `DEMO_1_1`) with requested quote `BOSS_PUR_PORTAL_QUOTE` and capability `ZIZI_PORTAL_QUOTE_LINK`; `ZIZI_PORTAL_ACK_LINK` (OrderAcknowledgement and BillUpload) on Accounting's "Portal demo shelving restock" order. Tokens are fixed in source: use newly issued links and redact tokens in evidence |
| Prepare | approval-band orders either side of $5,000; a quote answering an earlier sent RFQ revision; a receipt with accepted, rejected and held quantities; bill price/quantity exceptions and a duplicate supplier reference; a Retail budget (the budget demo is `BOSS_ACCT_ORG`'s); a second pending supplier; inaccessible/deleted records, long names, two rows per repeated dialog and choices outside the first page |

**Consumption.** Each demo record exists once; a live run on it consumes it. Sequences that share one record:

- PUR-01 reads Home's late, unacknowledged and unsourced counts before PUR-19 receives `BOSS_PUR_PO_RCV`, PUR-15
  acknowledges `BOSS_PUR_PO_ACK` and PUR-06 sources `BOSS_PUR_REQ_A`.
- PUR-03 approves `BOSS_PUR_SUP_PENDING`; its refuse branch needs a second pending supplier made in PUR-02.
- PUR-11 places `BOSS_PUR_PO_A`; PUR-14's untouched-cancel branch needs another draft.
- PUR-16 releases from `BOSS_PUR_AGR_A`'s allowance; leave room for the excess-cap refusal.
- PUR-28 sends `BOSS_PUR_PORTAL_QUOTE` and acknowledges the portal order; Accounting's ACC-30 uses BillUpload with the
  same `ziddleman.billing` contact and "Portal demo shelving restock" order, so each review issues fresh links.
- `BOSS_WH_PO` belongs to Warehouse's WH-10–12 and `BOSS_WH_SUB_PO` to WH-30; use fresh orders here.
- Across reviews: PUR-27's rows are restored before Warehouse or Manufacturing activities use fresh Retail orders; PUR-19 prepares the receipt WH-10 reopens; PUR-21 places MFG-25's draft before MFG-26 dispatches and
  reads its acceptance after MFG-26's receipt; PUR-24 authorizes the return WH-27 requests before WH-27 sends it back.
  In separate runtimes the other review prepares these steps as setup.
- PUR-19 → 20 → 22 → 24 can chain on one fresh order (PurchasingReturnsWalk's sequence: 8 of 10 received into
  quarantine, 7 accepted, 1 rejected, returned and credited for the billed unit only); keep a separate order for
  the over-receipt and duplicate-bill refusals.

### Area criteria

Apply the guide's judgment criteria. Purchasing adds:

- **Document states.** Headers keep the document key/name, supplier, buying organization, revision, state and next
  action. Distinguish request, RFQ, requested quote, proposed offer, placed, approved, sent, acknowledged, received
  and settled; a state chip never implies the next action happened. Check approval, block, missing-price and held
  chips in both themes; color is never the only signal.
- **Quantity basis.** Follow one quantity through demand, purchase pack, stock unit, partial delivery, rejection,
  service acceptance, bill match and return, with its unit and conversion basis. Display rounding must not change a
  submitted quantity. Expected, received, accepted, rejected, held, released, billed and returned stay separate.
- **Comparison and price.** Ranking never chooses a supplier, unknown freight is not zero, and published supplier
  price, recorded offer and award allocation are different histories with their own dates.
- **Withheld values.** Restricted amounts, supplier finance and competing offers are absent (or explicitly withheld),
  never zero, on screen, in the response payload and in CSV/XLSX/PDF bytes.
- **Outputs.** Local CSV is offered on the five report pages, Scorecards, ScorecardDetail and QuoteComparison; CSV and
  XLSX on SupplierPrices (three Purchasing mounts) and the inherited Product360/Prices. Mounted shared screens add
  CSV of their own: PriceExplain, Packaging, InventoryAvailability Locations/Movements, the BOM/routing/where-used
  reads, InvoiceDetail and the excluded Costs (StandardCosts) tab. PDFs: order, RFQ and agreement as-of and issued
  prints, comparison print. html-print: reports and ReturnAuthorization. Inspect bytes and captured attachments; a
  toast or filename is not a correct document.
- **Operation keys and batches.** Sends, award groups, reminders, conversions, bulk approvals, evaluations and
  reevaluations name each failed member and keep successes. Retries follow each operation's own contract (an
  operation key answers the first result; a reminder that mailed then failed its record write may mail again, F118).
- **Selections and choices.** A changed organization, supplier or facility clears incompatible selections; dependent
  receipt locations, agreement items, suppliers and products track the selected record; selected labels survive
  outside a choice's first page; a selection changed while a confirmation is open invalidates it.
- **Schedules.** PlanSchedule and scheduled plans show their last run and error; saving a schedule is not a run.

### Waves

| Wave | Activities | Exit evidence for later execution |
| --- | --- | --- |
| P0 — Context and supplier basis | PUR-01–04, 27; PUR-30's pairs established | Actor grants and areas, Home counts before consumption, supplier states, price basis; PUR-27's dated policy rows (gate on, Stop, award rows) recorded for later consumers |
| P1 — Request and source | PUR-05–10 | Request → sourcing → RFQ → offers → comparison → award, with named group results and captured mail |
| P2 — Commit and communicate | PUR-11–16 | Placed, approved (both bands), issued, held/closed and revised orders; agreement release |
| P3 — Replenish and receive | PUR-17–21 | Plan conversion, reorder levels, receipt, quality disposition, service and subcontract acceptance |
| P4 — Supplier responses and obligations | PUR-28, 22–24 | Supplier quote, acknowledgement, bill upload and delivery report first; then bill match, drop-ship confirmation and supplier return/credit |
| P5 — Explain and collaborate | PUR-25, 26, 29 | Scorecards and risks, report bytes, evidence on the right record |
| P6 — Reconcile coverage | PUR-30–31 | Remaining boundaries, modes and the §4 handoff table |

Cross-wave continuations (record each open one in the originating ledger row):

- PUR-27's policy rows → PUR-03 (Stop), PUR-10 (award approval), PUR-11–12 (gate), PUR-17 (`planBuyToRequest`),
  PUR-23 (gate on drop-ship), PUR-25 (score actions); restore after the consumers.
- PUR-05 → 06 → 07 → 08 → 09 → 10 on one demand; PUR-10's placed quotes are PUR-11/12's orders.
- PUR-07's sent RFQ and PUR-13's sent order → PUR-28's quote response and acknowledgement on fresh links.
- PUR-14's close-remainder and PUR-15's partly received branches need a receipt: prepare it with the buyer-receiver
  before P2, or complete those branches after PUR-19.
- PUR-28's bill upload → PUR-22 intake; its delivery report → PUR-23 confirmation.
- Every output → PUR-29; every hidden or inherited route → PUR-30; every handoff → PUR-31.

Pair role/scope refusals with otherwise-valid successful requests in every wave; PUR-30 reconciles remaining gaps,
not a new role×route×mode matrix. Do not consume a shared record in two concurrent waves. A blocked external branch
need not stop independent internal activities but stays unresolved in the ledger.

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

Routes are relative to `/qapps/`; Standard uses `/apps/`. **B** means this component's `screen/`; append `.xml` to
local names for the source. Current source contains **54 local XML definitions**, `Purchasing.xml` and 53 below
`Purchasing/`, with no local `.qvue` or `.tui.json`. Recursively following physical children and explicit mounts
yields **129 route instances**: the 54 locals, 74 Shared-source instances and Commons Notifications. **21 local
screens and 6 templates** carry `render-mode` sections (html/qvt/tui; the ReceiptDetail and ReturnDetail templates
also html-print). Four screens are marked `server-static="qvt"`: the three quick creates and ProductFind. These are
source inventory counts, not evidence that every descendant is admitted to every Purchasing user or visible in its
menu; recompute after source changes.

### Local routes and defaults

| Route prefix / source directory | Local definitions | Activities |
| --- | --- | --- |
| root | `Purchasing` | PUR-01, 30–31 |
| `Purchasing/` | `Home` | PUR-01, 12, 15, 25–26 |
| `Purchasing/` | `Suppliers`, `Requests`, `Sourcing`, `Orders`, `Approvals`, `Agreements`, `Replenishment`, `Receiving`, `Returns`, `Bills`, `Performance`, `Settings`, `Products` | Containers/defaults below; PUR-01, 30–31 |
| `Purchasing/` | `NewPurchaseOrder`, `NewPurchaseRequest`, `NewQuoteRequest` | PUR-01, 05, 07, 11 |
| `Purchasing/Suppliers/` | `SupplierList` | PUR-02–03 |
| `Purchasing/Requests/` | `PurchaseRequests`, `RequestSourcing` | PUR-05–07, 23 |
| `Purchasing/Sourcing/` | `QuoteRequests`, `QuoteRequestDetail`, `Quotes`, `QuoteDetail`, `QuoteComparison`, `Award` | PUR-07–10, 28–29 |
| `Purchasing/Orders/` | `PurchaseOrders`, `OrderChanges`, `Acknowledgements` | PUR-11–16, 23 |
| `Purchasing/Agreements/` | `AgreementList`, `AgreementDetail` | PUR-16, 29 |
| `Purchasing/Replenishment/` | `ReorderRules` | PUR-18 |
| `Purchasing/Replenishment/ReorderRules/` | `Rules`, `SuggestLevels`, `PlanSchedule` | PUR-18 |
| `Purchasing/Receiving/` | `Receipts`, `Inspections` | PUR-19–20 |
| `Purchasing/Returns/` | `SupplierReturns`, `ReturnAuthorization` | PUR-24 |
| `Purchasing/Bills/` | `BillList`, `MatchExceptions` | PUR-22 |
| `Purchasing/Performance/` | `Scorecards`, `ScorecardDetail`, `Spend`, `Commitments`, `ProcurementTracker`, `PurchaseHistory`, `SupplierStatement` | PUR-25–26 |
| `Purchasing/Settings/` | `SettingsHome`, `PurchasePolicy`, `ApprovalPolicies`, `ScorecardPolicies` | PUR-03, 12, 25, 27 |
| `Purchasing/Products/` | `ProductFind` | PUR-04 |

| Container | Default child | Activities |
| --- | --- | --- |
| Purchasing | Home | PUR-01 |
| Suppliers / Requests / Sourcing / Orders | SupplierList / PurchaseRequests / QuoteRequests / PurchaseOrders | PUR-02, 05, 07, 11 |
| Approvals / Agreements | Notifications (Commons) / AgreementList | PUR-03, 05, 10, 12, 16 |
| Replenishment / ReorderRules | SupplyPlanning (Shared) / Rules | PUR-17–18 |
| Receiving / Returns / Bills | Receipts / SupplierReturns / BillList | PUR-19–24 |
| Performance / Settings / Products | Scorecards / SettingsHome / ProductFind | PUR-04, 25–27 |
| Supplier360 / Product360 / Product360/Documents | Overview / Summary / Index | PUR-02–04, 29 |
| InventoryAvailability / Product360/Stock / Product360/BOM | Summary / Summary / Overview | PUR-04, 17–18 |

### Shared mounts and inherited descendants

| Route under `Purchasing/` | Source under B | Activities / context |
| --- | --- | --- |
| `Chatter`, `Chatter/ChatterTui` | `Shared/Chatter.xml` (+ `.qvue`), `Shared/ChatterTui.xml` | PUR-29–31; record identity/audience and terminal helper |
| `RecordFiles`, `RecordFiles/RecordFilesTui` | `Shared/RecordFiles.xml` (+ `.qvue`), `Shared/RecordFilesTui.xml` | PUR-29–31; authorized files and terminal helper |
| `Approvals/Notifications` | `Commons/Notifications.xml` | PUR-03, 05, 10, 12, 16; source record decides |
| `Suppliers/Supplier360` | `Shared/Supplier360.xml`, `PurchasingSupplierApproval.xml` and `PurchasingSupplierPortal.xml` templates | PUR-02–04, 16, 20–25, 28–29 |
| `Suppliers/SupplierPrices`, `Suppliers/PriceExplain` | Matching `Shared/*.xml` | PUR-04, 08, 16; purchase direction and separate price grants |
| `Products/Product360` | `Shared/Product360.xml` | PUR-04, 17–18, 26 |
| `Requests/RequestDetail` | `Shared/RequestDetail.xml`, `PurchasingRequestDetail.xml` template | PUR-05–07, 26, 29 |
| `Orders/OrderDetail` | `Shared/OrderDetail.xml`, `PurchasingOrderDetail.xml` and its Approvals, Revisions, Receipts, Bills, DropShip, Sources, Returns and Agreements templates | PUR-11–16, 19, 21–24, 29 |
| `Replenishment/SupplyPlanning` | `Shared/SupplyPlanning.xml` | PUR-17; Purchasing facility scope and buy/outside conversion |
| `Replenishment/InventoryAvailability` | `Shared/InventoryAvailability.xml` and six children | PUR-17–18; stock reading and permitted reorder policy |
| `Receiving/ShipmentDetail` | `Shared/ShipmentDetail.xml`, `PurchasingReceiptDetail.xml` and `PurchasingReceiptPegs.xml` templates | PUR-19, 21–22; purchase receipt context |
| `Receiving/QualityInspection`, `Receiving/InspectionTemplates` | Matching `Shared/*.xml` | PUR-20; receipt quality, action by grant |
| `Returns/ReturnDetail` | `Shared/ReturnDetail.xml`, `PurchasingReturnDetail.xml` template | PUR-24; supplier direction, RMA, receipt quantities, replacement and financial handoff |
| `Bills/InvoiceDetail`, `Bills/InvoiceMatch` | Matching `Shared/*.xml`, `PurchasingInvoiceDetail.xml` template | PUR-22; supplier bill and matching, not Accounting's full AP workspace |

The following child paths complete the recursive inventory. Follow the consuming Purchasing route for both normal
activity and excluded-context probes. Physical availability does not mean the parent advertises or permits it.

| Parent / descendants | Purchasing presentation or boundary | Activities |
| --- | --- | --- |
| Supplier360: `Overview`, `Buying`, `Prices` (SupplierPrices), `Finance` | Contacts, organization-specific buying profile (Change profile holds the dated purchase block), supplier offers and separately permitted finance details (PAYABLE_VIEW) | PUR-02–04, 30 |
| Supplier360: `PurchasingQuotes`, `PurchasingAgreements`, `PurchasingReceipts`, `PurchasingReturns`, `Bills` | Quote, agreement, receipt/quality, supplier return and bill continuity | PUR-07–08, 16, 19–20, 22, 24 |
| Supplier360: `PurchasingDropShip`, `PurchasingPerformance` | Supplier drop-ship facility/integration metadata and latest evaluation/risks | PUR-23, 25 |
| Supplier360: `Documents`, `Conversation`, `InsightsRecord` | Evidence and discussion, hidden linked insight helper | PUR-26, 29–31 |
| Supplier360: `Receiving`, `SubcontractOrders` | Warehouse/Manufacturing-specific inherited children; inspect direct access/omission and owning-app counterpart | PUR-21, 30–31 |
| Product360: `Summary`, `Identifiers`, `Dimensions`, `Packaging`, `Suppliers`, `Stock`, `Documents`, `BOM`, `PurchaseHistory` | Purchasing's admitted tab set (§2 Actors); master edits disabled by Purchasing context | PUR-04, 17–18, 26, 30 |
| Product360: `Features`, `Categories`, `Prices`, `Costs`, `KitComponents`, `Equipment`, `Associations`, `Parties`, `Connections`, `History`, `Replenishment`, `PaidAccess` | Inherited physical/mounted sources outside Purchasing's tab set; record direct-request behavior without granting catalog, sales-price or cost authority | PUR-04, 30–31 |
| Product360: `InsightsRecord` | Hidden shared insight helper; authorized link and return only | PUR-26, 30–31 |
| Product360/Documents: `Index` | `Shared/Documents.xml`; file list, upload/download and record permission | PUR-04, 29 |
| Product360/BOM: `Overview`, `BillOfMaterialsExplosion`, `BillOfMaterialsCompare`, `WhereUsed`, `RoutingDetail` | Shared method read (planner, administrator) and excluded edit/approve operations under Purchasing context | PUR-04, 21, 30 |
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
| SupplierList | New supplier / New individual supplier, duplicate candidates and Create anyway; selected-row bulk change (category/buyer/block) and per-row results | PUR-02–03 |
| Supplier360 Buying, approval and portal templates | Change profile (dated block)/Change buyer/Change category; Submit for approval, Approve/Refuse/Suspend; Invite to the Supplier app | PUR-02–03, 28 |
| SupplierPrices and PriceExplain | Authorized add/replace/expire/bulk offer, purchase pack/UOM, tier/effective dates and explanation basis; forbidden sales/cost fields | PUR-04, 08 |
| SupplierPrices CSV/XLSX | `Suppliers/SupplierPrices`, `Suppliers/Supplier360/Prices` and `Products/Product360/Suppliers` share `Shared/SupplierPrices.xml`'s declared exports; inspect actual rows, selected columns, filters, amounts/currencies and withheld fields | PUR-04, 29–31 |
| Inherited Product360/Prices CSV/XLSX | `Shared/Prices.xml` declares both exports even though Prices is outside Purchasing's tab set; pair authorized owning-context output with Purchasing direct-request refusal/omission checks, without granting new price authority | PUR-30–31 |
| RequestDetail and RequestSourcing | Add/edit/remove line, submit/approve/refuse/cancel/complete; Choose supplier, Drop-ship and Request quotes (`PurchasingSourcingRfq`), convert and result/retry | PUR-05–07, 23 |
| QuoteRequestDetail / Quotes / QuoteDetail | New RFQ, edit RFQ/item, Invite supplier, Declined, Send, Print as of; New supplier quote, record answer, Edit price, Freight estimate, Publish price, quote content | PUR-07–08 |
| QuoteComparison / Award | Basis/line/quantity/currency/FX-day selection, allocations, CSV/PDF print, preview, commit (Place N quotes), close RFQ; these are page states, not additional child screens | PUR-09–10 |
| PurchaseOrders and NewPurchaseOrder | Draft creation, views (Draft … Drop-ship, Closed), selected-order bulk Approve/Close remainder; requester/reader omission and source-record context on quick create | PUR-01, 11–12, 14 |
| PurchasingOrderDetail / OrderApprovals | Add/edit/delete line; place, approve/refuse, send, edit header, hold/release, cancel, clone, close remainder, Record acceptance, as-of/issued content | PUR-11–15, 21 |
| OrderReceipts / OrderBills / OrderReturns / OrderSources / OrderAgreements | Expected receipt (ASN) and receipt links; Create draft bill, Upload supplier bill, Request supplier prepayment; source request/plan/agreement and return links | PUR-06, 16–17, 19, 22–24 |
| OrderRevisions / OrderChanges / Acknowledgements | Change order, propose/apply/cancel change, Record acknowledgement, line Promise and reminders | PUR-15 |
| AgreementList / AgreementDetail / AgreementRelease | New agreement, New from template, edit, dated items/terms/signers, submit/approve/refuse/cancel/status, file upload, Release from agreement (AgreementDetail and PurchaseOrders), as-of/issued print | PUR-16, 29 |
| SupplyPlanning / ReplenishmentParts | Run/refresh scope, suggestion selection, demand/supply detail, source choice, buy/request/drop-ship/outside conversion and conversion result; transfer refused (`METHOD_NOT_CONVERTED`) | PUR-17, 23 |
| ReorderRules Rules/SuggestLevels/PlanSchedule | New/Edit rule, snooze, history preview, selected application with reason, save schedule and explicit preview run | PUR-18 |
| ReceiptDetail / ReceiptPegs | Expected receipt (ASN), Receive, Receive all as expected, Finish receipt, Create draft bill and reserve received stock for linked customer demand | PUR-19, 22 |
| QualityInspection / InspectionTemplates | Receipt measurement/result/verify/disposition, files and template maintenance by separate grants; inspect actual print destination | PUR-20 |
| BillList / InvoiceDetail / MatchExceptions / InvoiceMatch | Upload supplier bill, duplicate-reference response, Ask to release, reevaluate selection, apply/unapply match, legacy preview/link, Allocate to receipts (landed cost link) | PUR-22 |
| Supplier360/PurchasingDropShip and OrderDropShip | Store drop-ship facility metadata; Drop-ship from supplier on a customer line; Confirm delivery/Confirm line with tracking; report versus confirmation | PUR-23, 28 |
| SupplierReturns / ReturnDetail / ReturnAuthorization | New supplier return, Add eligible receipt, Record RMA, Authorize, cancel, Replace; html-print supplier authorization | PUR-24 |
| Scorecards / ScorecardDetail | Evaluate suppliers, recalculate retained evaluation, metric drill, Record risk/End and CSV | PUR-25 |
| Performance report pages | Filtered CSV and html-print Print; committed versus billed, reserved versus actual, withheld money and currency basis | PUR-26 |
| Settings pages | New purpose/category and Edit; dated defaults/controls; approval step Change/End and amount preview; score basis/criteria/response rules | PUR-27 |
| Shared evidence | Chatter/RecordFiles QVue, terminal helpers, authorized upload/download, original/issued records, scan failures and audience | PUR-29 |
| Inline authored render sections | qvt/tui status, actions and evidence links in the 21 screens and 6 templates; distinguish actual native terminal output from markup fallback | Each owning activity; PUR-31 |

Hidden helpers include the three quick-create pages, ProductFind, RequestSourcing, OrderChanges, QuoteComparison,
Award, AgreementDetail, ReturnAuthorization, detail pages and the shared evidence/insight helpers. Direct reads and
transitions must retain the same record checks as their normal entry action. Record keys include `vendorPartyId` on
Supplier360, `productId` on Product360, `requestId` on requests/RFQs/comparison/award, `orderId` on
quotes/orders/order changes, `agreementId`, `shipmentId`, `qualityInspectionId`, `invoiceId`, `returnId`,
`supplierScorecardId`, and `planFacilityId` for Purchasing planning. Read the current declaration before
constructing a direct probe; do not replace these with one generic ID.

The shell provides the Purchasing records palette source, quick creates for request/RFQ/PO, `g b` (Purchasing home),
four Today sources (approvals, acknowledgements, requests to source, RFQs due) and the PurchaseLateReceipt,
PurchaseMatchException and PurchaseSupplierResponse topics. Approval notifications use the source's revision-bound
decision. Inspect alert→record→Back and quick-create cancel/reopen, including entry from an unrelated record, in
PUR-01 and its owning workflow.

PASS surfaces are a separate browser mount: SupplierHome, QuoteResponse (save/submit), OrderAcknowledgement
(acknowledge and the drop-ship delivery report) and BillUpload, with their `.html.fancy` templates. Include external
upload staging, captured invitations, contact versus capability access, response receipt and internal buyer
follow-up in PUR-28. The public app is not a Material/TUI variant of Purchasing and does not inherit its internal
tabs or competitor data.

### Design-to-code reconciliation

| Design or historical item | Current review disposition |
| --- | --- |
| Root placeholders and proposed P1 permissions | Purchasing is built (impl P0–P17); inventory and current grants take precedence over historical introductions |
| Requests/Suppliers/Agreements design paths | Containers resolve to PurchaseRequests, SupplierList and AgreementList; retain actual detail/helper paths |
| Purchasing “all XML” | Local files are XML; shared Chatter/RecordFiles have QVue and terminal helpers, and authored inline modes remain in scope |
| Supplier prices and catalog editing | No Purchasing group holds SUPPLIER_PRICE_EDIT; Purchasing Product360 deliberately restricts the master and sales-price action set |
| “Other apps' contexts” in impl §7 | Customer Service is built and consumes shared screens; Sales is still mostly placeholders. Use current shared context/ownership, bounded handoffs and same-record return |
| Supplier portal described as future | PASS Supplier is built (P16). Quote response, PO acknowledgement, drop-ship delivery report and bill upload are distinct scoped external operations |
| SupplyPlanning buy/make/transfer design | Purchasing converts buy and outside suggestions; Manufacturing owns make; transfer suggestions are shown but Mantle refuses their conversion (`METHOD_NOT_CONVERTED`) and no Warehouse mount converts them (impl §7) |
| Service versus subcontract receipt | Non-stock service acceptance uses `OrderServices.accept#ServiceItem`; subcontract acceptance is recorded by Manufacturing's `ProductionServices.receive#SubcontractOutput`, not a second manual PO acceptance |
| LeaseOverview / MergeDraftPurchaseOrders | Unmounted future work (impl §7); excluded from completion criteria |
| Recurring agreement release / purchase promotion tiers / consignment / rebates | Not built (F134, F140, R-PUR-38, impl §7). Ordinary price-row tiers and manual agreement releases are current paths |
| RFQ contact/channel/deadline per invitation, quote tax/MOQ/increment/warranty | Deferred (F143): recipients are the supplier's order addresses, else its primary ones, and the deadline is the RFQ's; describe the actual fields without inventing controls |
| Late quote responses | No policy flag refuses them; they are accepted and marked (F171) |
| Substitute acceptance and manufacturing change referral | Current award uses the buyer's explicit substitute choice; a separate requester-acceptance or released-BOM change workflow is not established by it |
| Quote revision warning and published offer after award | Open in impl §7: QuoteComparison does not mark a quote that answered an earlier RFQ revision (F189); a price published from a quote line stays in effect when the award drops the line, and the comparison-to-award SOURCE_CHANGED check rarely fires with default revision counting (F176). Record them as known limits, not new findings |
| Reminder resend after a failed record write | Open in impl §7 (F118); an applied revision awaiting approval is neither acknowledged nor reminded (REVISION_PENDING) |
| Receiving checklist / Purchasing inspection report / bill and match explanation print / supplier-price and reorder import under Purchasing | Not built (F190). QualityInspection's certificate is Manufacturing's link and Accounting's BillDetail has the bill prints; do not call them Purchasing outputs |
| OCR, NCR/CAPA, external risk feeds, arbitrary score formulas, EDI, per-document block override | Separate capability work (impl §7, F178). Existing warnings, risk records and receipt inspections are reviewed as implemented |
| Supplier delivery report prefilling confirmation / subcontract dispatch-inspection portal evidence / QuoteResponse file downloads | Not built (F174, F173). Supplier reporting itself ships/posts nothing; a report does not replace the buyer's confirmation |
| Historical verification totals and end-to-end instructions | Current specs/registrations and §5 govern; old results do not establish this review's coverage or authorize acceptance |

## 4. End-to-end activities

The §6 ledger holds status and evidence. Use visible controls and inspect intermediate states, confirmations,
persisted results and a second identity where relevant; a render, HTTP 200 or service-only mutation does not complete
an activity. Browser means Material light/dark; TUI means actual supported terminal operations; Standard means the
brief functional/output/fallback check. Record unattempted modes and recovery branches in §6. Role terms are §2's
actor table.

### PUR-01 — Start a purchasing workday in the right scope

- **Actor/start:** requester, buyer, planner, approver and reader; populated Retail and the empty-for-them Services
  scope (`purchasing.services`).
- **Objective/steps:** open Purchasing → inspect Home's eleven work cards (Unsourced requests, RFQs due, Quotes to
  compare, Quotes expiring, Shortfalls, Approvals waiting, Draft orders, Approved not sent, Unacknowledged orders,
  Late receipts, Held bills) and authorized spend summary → open a filtered work list → record → Back. Use the Purchasing palette source, `g b`, the four Today sources and notifications; open/cancel/reopen request,
  RFQ and PO quick creates where permitted. Save, change, reset and revisit a main find.
- **Expected:** cards and destination records agree on organization and authority; the requester sees only Home and
  Requests; sensitive amounts are withheld explicitly; default routes, list context and useful empty states are
  coherent ("No supply plan has been calculated yet" is not zero shortfalls). New opens a fresh record even after
  following a record notification.
- **Recovery:** no organization, no matches, unavailable recent record, changed active organization, one independently
  failed Home source and a selected filter no longer permitted. Unavailable information is not shown as zero.
- **Screens/modes:** Home, section defaults, three quick creates, shell/search/find controls; browser/TUI/Standard,
  selected narrow/keyboard cases and actual theme switching.

### PUR-02 — Create and maintain a supplier without losing its scope

- **Actor/start:** buyer, reader, buyer-matcher (Finance tab) and `purchasing.services`; shared (`ZiddlemanInc`) and
  Retail-owned (`BOSS_PUR_SUP_B`) suppliers.
- **Objective/steps:** SupplierList → New supplier/New individual supplier → inspect duplicate candidates → choose
  existing or deliberately Create anyway (also create the second pending supplier PUR-03 needs) → Supplier360 →
  contacts, Buying profile, Change buyer and Change category. Change one dated field with a reason; reload and inspect
  history. Select two suppliers for a bulk change.
- **Expected:** person versus organization input is clear; duplicates are explained before creation; supplier owner,
  buying organization and effective profile are distinct. Changes affect the intended records and preserve prior
  rows. Finance details appear only for PAYABLE_VIEW (buyer-matcher), withheld for the buyer. Maintaining a contact
  uses the existing Commons route only where authorized.
- **Recovery:** duplicate name/contact/external ID, incomplete required input, canceled duplicate decision, stale dated
  profile, invalid buyer/category, inaccessible supplier, reader refused, and a failed member of a bulk action.
  Keep successful rows.
- **Screens/modes:** SupplierList, Supplier360/Overview/Buying/Finance and shared choices; browser/TUI/Standard, two
  row dialogs, phone name/state columns and selected labels outside the current choice page.

### PUR-03 — Approve a supplier and understand a buying restriction

- **Actor/start:** buyer, approver and administrator (self-approval refusal); `BOSS_PUR_SUP_PENDING`,
  `BOSS_PUR_SUP_BLOCKED` and PUR-02's second pending supplier; PUR-27's dated Stop row for the Stop branch.
- **Objective/steps:** Supplier360 → inspect policy explanation → Submit for approval → approver follows
  Approvals/Today to the pending step → Approve or Refuse with reason → return to supplier. Apply a dated block
  (Change profile) or Suspend and attempt a valid RFQ/PO for the supplier under the demo's Warn and the prepared Stop.
- **Expected:** approval state, dated purchase block and suspension are distinguishable; the approver sees the
  current source and step (one approver decides: no supplier policy rows); a warning names its effect; Stop prevents
  the protected purchase operation. Existing orders remain visible and are not described as canceled because future
  buying is blocked.
- **Recovery:** administrator approving their own submission (self-approval off), stale source or expired decision,
  canceled suspension and supplier state changing after preview. Compare holder and non-holder requests; which grant
  Suspend requires is to verify at execution.
- **Screens/modes:** Supplier360 approval controls, Approvals/Notifications, PurchasePolicy and the consuming RFQ/PO;
  browser/TUI/Standard with clear text in both theme states.

### PUR-04 — Explain the product and supplier price used for a purchase

- **Actor/start:** buyer (Suppliers tab, no BOM), reader (no Suppliers tab), planner (BOM via METHOD_VIEW) and the
  prepared Retail supplier-price editor; `DEMO_1_1` with Ziddleman tiers and agreement price, a pack product.
- **Objective/steps:** ProductFind or purchase line → Product360 → admitted tabs → SupplierPrices → PriceExplain.
  Choose organization, supplier, quantity, date, currency and agreement basis; the editor adds/replaces/expires a
  dated offer and checks a consuming PO. Export the permitted SupplierPrices list as CSV and XLSX through its
  standalone, supplier and product contexts; inspect the workbook's rows, headers/selected columns, active filters,
  quantity units and amount/currency values.
- **Expected:** product identity and usable-for-buying reason remain visible; purchase and stock units are
  understandable; selected tier/agreement/offer and rejected alternatives explain the price. Read-only master tabs
  stay useful; supplier-price edit, standard cost and method actions do not appear through inferred authority.
  Exported rows match the selected supplier/product/organization and filter basis, with no restricted money or
  action-only columns.
- **Recovery:** no price, expired/overlapping offer, unavailable supplier/product, missing conversion, pack quantity,
  selected value outside the current search page and permission removed after opening a dialog.
- **Screens/modes:** ProductFind/Product360 admitted tabs and BOM/Stock descendants, SupplierPrices/PriceExplain;
  browser/TUI/Standard, comparison-style narrow layout, actual CSV/XLSX and document downloads, with excluded-child
  output probes in PUR-30. Terminal export delegation must identify the actual supported action. Products' PRD-11
  owns the supplier-offer workflow from the catalog side.

### PUR-05 — File, approve and complete a purchase request

- **Actor/start:** requester, buyer and approver (no request policy rows, so one approver decides); organization/
  facility, purpose and three request lines.
- **Objective/steps:** NewPurchaseRequest/list → RequestDetail → add/edit/remove lines, quantity/unit, needed date and
  permitted supplier/cost basis → submit → Approve/Refuse → follow the resulting requirements and sourcing links.
  After supply is arranged, use Complete request with its reason; inspect a linked Projects work item's completion
  separately (`complete#RequestFromWork`).
- **Expected:** requester ownership and buying organization are clear; request approval is not PO approval; approved
  quantities become sourceable requirements and later source links account for them. Completing a linked work item
  does not silently complete an unsatisfied purchase request (it stays In Progress).
- **Recovery:** no line, invalid product/unit, missing purpose/date, refusal and resubmission, another requester's
  record, repeated completion, canceled request and lost authority. Retain editable submitted values after a refusal.
- **Screens/modes:** PurchaseRequests, NewPurchaseRequest, shared RequestDetail and Notifications; browser/TUI/Standard,
  repeated line dialogs, long descriptions and requester-only navigation.

### PUR-06 — Source approved request quantities and recover partial conversion

- **Actor/start:** buyer; `BOSS_PUR_REQ_A` (one line, Ziddleman) and a prepared multi-line request with two
  suppliers and one line without a supplier.
- **Objective/steps:** PurchaseRequests row selection or RequestDetail → RequestSourcing → inspect uncovered quantities
  and supplier grouping → Choose supplier/source route → convert → inspect each resulting draft order and request
  links. Correct the failed group (MISSING_SUPPLIER) and retry only its unresolved quantity.
- **Expected:** approved demand, already covered quantity and new allocation stay separate; every result identifies its
  supplier/source line; successful groups survive another group's failure. A retry with the same operation key
  answers the recorded outcome, and another conversion cannot buy the same demand twice.
- **Recovery:** missing/blocked supplier, stale request or concurrently covered quantity, invalid selected line,
  canceled conversion and incompatible customer line for drop-ship. Preserve explicit source selection after error.
- **Screens/modes:** RequestSourcing, PurchaseRequests/RequestDetail, OrderDetail and source links; browser/TUI/Standard,
  bulk selection confirmation and narrow supplier/result grouping. RFQ sourcing continues in PUR-07.

### PUR-07 — Prepare and send an RFQ to several suppliers

- **Actor/start:** buyer with an approved request from PUR-05 or new demand; Ziddleman and Brightline (order
  emails), one supplier with no address and Halvorsen (blocked); captured mail.
- **Objective/steps:** NewQuoteRequest or RequestSourcing's Request quotes → QuoteRequestDetail → maintain
  specification, response date, product/description lines and units → Invite supplier → review recipients → Send →
  inspect per-supplier result, retained RFQ PDF and response links. Record a supplier's decline through the internal
  Declined action. Edit material content and send the new revision; view the old Print as of.
- **Expected:** the RFQ is distinct from an internal request and from each supplier's quote; send results identify
  successful and failed suppliers. Stored issued content reflects what that supplier was sent, and resending a
  changed revision is distinguishable from retrying an unchanged send.
- **Recovery:** missing address, one invalid recipient, blocked supplier, canceled invite/send, no line, expired or
  revoked response link and an edit after issue. Independent recipient failures leave the other sends available.
- **Screens/modes:** QuoteRequests, NewQuoteRequest, QuoteRequestDetail and Requests sourcing action; browser/TUI/
  Standard, PDF/captured attachments and portal continuation in PUR-28.

### PUR-08 — Record an offer and publish an authorized supplier price

- **Actor/start:** buyer, prepared supplier-price editor and reader; requested and standalone quotes, offer validity
  and freight.
- **Objective/steps:** Quotes → QuoteDetail → record supplier reference, answer/validity, line price/unit, promised date
  and supported substitute → Freight estimate → review the answer → Publish price (a selected price/tier) only as the
  supplier-price editor → follow SupplierPrices and a later order's price explanation.
- **Expected:** recorded response, proposed offer and published reusable price are distinct; the original quote basis
  and currency remain visible. A freight estimate is labeled as an estimate. Supplier attachments stay on that quote;
  the publication has its own effective dates and does not follow later award edits (F176 open).
- **Recovery:** negative/invalid values, invalid dates, wrong source item, quote already awarded/closed, unsupported
  substitute and the buyer refused Publish price (no SUPPLIER_PRICE_EDIT).
- **Screens/modes:** Quotes, QuoteDetail, Supplier360/PurchasingQuotes and SupplierPrices; browser/TUI/Standard, two line
  dialogs, localized amount input and actual authorized quote-content download.

### PUR-09 — Compare offers on an intelligible common basis

- **Actor/start:** buyer with two comparable offers, one expired offer, a missing-rate or missing-unit case and a
  quote answering an earlier sent RFQ revision.
- **Objective/steps:** QuoteRequestDetail → QuoteComparison → choose demand line, quantity, display currency and FX day
  → compare original quote basis, normalized unit price, promised date and estimated landed cost → inspect ranking
  explanations → add allocations explicitly → export CSV/print and compare the bytes to the visible basis.
- **Expected:** ranking chooses nothing. Incomparable and expired offers are not ranked; a comparable offer may have
  the lowest unit price while its landed cost remains Unknown because freight is missing. Unknown freight must not
  become zero or a lowest-landed-cost claim. Pack conversion and currency/date basis are explicit. Allocated and
  still-uncovered demand reconcile, and a substitute needs explicit acceptance rather than a hidden default.
- **Recovery:** missing rate/conversion/price, invalid quantity/currency, offer changed after comparison and long
  supplier names. The older-revision quote is not marked (F189, impl §7): record the limit, not a new finding.
- **Screens/modes:** QuoteComparison and QuoteDetail return path; browser/TUI/Standard, keyboard, 390px stacking and
  actual CSV/print. A design split is not evidence that the implemented page preserves selection on Back.

### PUR-10 — Award selected quantities and close the losing invitations

- **Actor/start:** buyer, and the approver of PUR-27's prepared award (`PasAward`) rows; split allocations with one
  valid and one blocked supplier group. Without award rows the commit places at once: run both variants.
- **Objective/steps:** comparison → Award preview → inspect groups, quantities, budget visibility and warnings → commit
  (Place N quotes) or wait on the PurchaseAwardApproval step → approver decides → inspect durable per-group results
  and resulting orders → retry unchanged result → preview closing the RFQ, review regret text/recipients → confirm
  close → inspect revoked losing links.
- **Expected:** each quote group has its own result; valid groups place despite a failed group; award approval and
  purchase-order approval remain distinct (the gate still meets each placed order). A placed quote becomes the order
  with its identity/source links retained, not an unexplained duplicate. Closing leaves awarded orders and
  uncovered demand intact.
- **Recovery:** stale request/quote basis, over-allocation, blocked supplier, budget refusal, missing policy/rate,
  canceled commit, lost response, refused award and award pending at close. Name failed regret recipients and
  preserve other sends.
- **Screens/modes:** Award states, QuoteComparison, Notifications, QuoteDetail/OrderDetail and RFQ detail; browser/TUI/
  Standard with group result inspection and explicit confirmation counts.

### PUR-11 — Create a correctly priced purchase order

- **Actor/start:** buyer and reader; usable stock product, pack product and non-stock service line
  (`BOSS_PUR_SUP_SERVICE`); `BOSS_PUR_PO_A`; the demo gate off and PUR-27's gate-on row.
- **Objective/steps:** PurchaseOrders/NewPurchaseOrder → select organization, supplier and receiving facility → create
  draft → add two lines, inspect resolved supplier price and unit → edit quantity/date/cost center → remove a line →
  review totals and source/terms → Place → reopen from list and inspect status/approval requirement, with the gate
  off and on.
- **Expected:** one purchase part identifies external supplier and internal buyer; defaults derive from policy/profile,
  not a prior record. Price/currency/unit and totals are clear; product usability is checked before purchase. With
  the gate on, placement waits for a current decision even for a prepaid or zero-total order; what a placed order
  shows with the gate off is to record, not assume.
- **Recovery:** no price, unusable product, invalid facility/cost center, empty order, supplier blocked since draft,
  invalid quantity, canceled place and the reader refused. Keep draft values and offer a useful correction.
- **Screens/modes:** PurchaseOrders, NewPurchaseOrder, shared OrderDetail and PurchasingOrderDetail; browser/TUI/Standard,
  repeated line dialogs, quick-create context and meaningful phone columns.

### PUR-12 — Decide current purchase approvals and understand budget effects

- **Actor/start:** buyer (author), approver and administrator (second step from $5,000); gate on; orders either side
  of $5,000, a no-policy case and a stale selected order; a prepared Retail budget for the budget branch.
- **Objective/steps:** placed OrderDetail → inspect approval preview/step and visible budget basis → Approvals/Today →
  approve the current revision → administrator completes the second step → inspect approved state and budget
  commitment. Select several valid orders for bulk Approve with one deliberately stale member; review each result.
- **Expected:** approvers see why their action is available or refused, which revision it covers and who acts next.
  Request reservation, PO commitment and later actual are not counted twice. Budget detail withheld from a buyer is
  not a zero allowance. Overrides require their own grant and reason (Accounting's ACC-26 owns the budget side).
- **Recovery:** self-approval, the administrator taking both steps (separate approver), stale revision, uncovered
  band, expired step, missing rate, budget Stop, refusal reason and independent failed bulk member. No successful
  order is hidden by another failure.
- **Screens/modes:** OrderDetail approval section, Approvals/Notifications, PurchaseOrders bulk result and
  ApprovalPolicies preview; browser/TUI/Standard. Reuse the existing source decision, not a second generic action.

### PUR-13 — Issue the current order and retain the evidence

- **Actor/start:** buyer with an approved order, Ziddleman/Brightline order addresses plus an invalid one, PDF
  support and captured mail.
- **Objective/steps:** OrderDetail → inspect revision and recipient selection → Send → read per-recipient result → open
  issued document/content → compare to current and earlier Print as of → repeat unchanged send → inspect recipient
  history. Whether a send issues a PASS acknowledgement link is to verify; follow it in PUR-28.
- **Expected:** sent revision and approved revision agree (the issued PDF and Approved→Sent never count as a
  revision); each recipient receives the intended PDF and the record retains it. An address already sent to is not
  sent again, and a failed recipient does not undo successful independent sends. Issued content remains
  identifiable after later commercial edits.
- **Recovery:** stale revision, missing/invalid address, PDF unavailable, canceled send, response lost after success and
  expired content link. Distinguish recorded send, queued delivery and actual captured message; inspect unknowns.
- **Screens/modes:** OrderDetail send/as-of/print/content, linked RFQ and agreement output patterns; browser/TUI/Standard,
  actual bytes and captured attachments. Terminal delegation to a browser/download must be truthful.

### PUR-14 — Hold, cancel or close the remaining commitment

- **Actor/start:** buyer and approver (PURCHASE_HOLD_RELEASE); an untouched draft, a sent order and a partly
  received/billed order (§2 continuation).
- **Objective/steps:** OrderDetail → Hold with reason → inspect current hold and next action → Release hold as the
  approver → Cancel order on an untouched order with reason; separately Close remainder on a partly received order
  → inspect canceled quantity, expected receipt and history. Clone an eligible order and review the new draft.
- **Expected:** hold, cancellation and closing a remainder describe different effects. Closing preserves receipts,
  bills and audit history; unrelated holds remain. Clone creates a draft without carrying payments, files or notes,
  and identifies any now-unusable product that must be corrected before placement.
- **Recovery:** the buyer refused Release hold, received/billed order cancellation, missing reason, no remaining
  quantity, canceled confirmation and changed source state. A failure leaves the order and posted facts intact.
- **Screens/modes:** OrderDetail actions and PurchaseOrders views/bulk Close remainder result; browser/TUI/Standard,
  explicit record identity in confirmation and list/Back context after closure.

### PUR-15 — Revise an order and reconcile the supplier's promise

- **Actor/start:** buyer and approver; `BOSS_PUR_PO_ACK` for acknowledgement and reminders; a sent, partly received
  order with a retained old issue (§2 continuation) and the buyer-receiver as concurrent receiver.
- **Objective/steps:** OrderDetail → Change order → inspect the Change hold → propose line/part changes on OrderChanges
  → review old/new values, received/billed/returned/accepted quantities and effects → apply with reason (or cancel the
  change) → approve the new revision → resend. Record acknowledgement and line Promise → inspect
  Acknowledgements/Today → send captured reminders.
- **Expected:** revision preview explains what changes and what prevents it; applying binds to the reviewed receipt
  basis and updates expected receipt/budget/match effects coherently (Warehouse's WH-12 sees the receipt follow).
  Acknowledgement is a claim about the current revision, not an unreviewed price/quantity edit. Print as of recovers
  the earlier commercial content.
- **Recovery:** cut below received quantity, concurrent receipt, stale order, invalid substitution, currency change
  with amounts (CURRENCY_CHANGE_WITH_AMOUNTS), canceled change, supplier accepting with changes/rejecting, an applied
  revision awaiting approval (REVISION_PENDING), superseded acknowledgement and one failed reminder recipient. The
  reminder resend after a failed record write is open (F118): never record exactly-once sending as passed.
- **Screens/modes:** OrderChanges, OrderDetail revision/acknowledgement sections, Acknowledgements and output links;
  browser/TUI/Standard, keyboard grid, long-form/narrow and lost-response scenarios.

### PUR-16 — Approve an agreement and release against its remaining allowance

- **Actor/start:** buyer and approver; active `BOSS_PUR_AGR_A`, template `BOSS_PUR_AGR_TPL`, dated terms and capped
  item quantity/amount.
- **Objective/steps:** AgreementList → New agreement or New agreement from this template → maintain items, terms and
  signers → Add file → submit → approve (PurchaseOrderApproval topic with the agreement as source) → inspect retained
  print → Release from agreement on AgreementDetail and from PurchaseOrders → follow the draft order's agreement
  section and return → change a cap/term with reason and inspect revision/approval implications.
- **Expected:** agreement, item and term dates are legible; approved revision and remaining allowance are distinct from
  ordered, received and billed totals. Release respects price, quantity/amount cap and tolerance and creates a draft
  order. A template is clearly a starting point rather than an active commercial authorization.
- **Recovery:** expired/inactive agreement, excess cap, invalid unit/date, stale approval, missing signer/evidence,
  canceled release, already-consumed quantity and the Services agreement refused. Released orders remain available
  after agreement expiry.
- **Screens/modes:** AgreementList/AgreementDetail, Supplier360/PurchasingAgreements, PurchaseOrders release and
  OrderDetail's agreement section; browser/TUI/Standard, row dialogs, files and current/as-of PDF. Recurring
  releases are not built (F134).

### PUR-17 — Turn a supply shortage into authorized buying work

- **Actor/start:** planner (runs), buyer (converts) and reader; `ZIRET_WH` with mixed buy/make/transfer/outside
  suggestions and customer demand; PUR-27's `planBuyToRequest` row for the request variant.
- **Objective/steps:** Replenishment → SupplyPlanning → select `planFacilityId` and horizon → run/read current plan →
  inspect demand/supply, held pending-release lines, exception and freshness → choose supplier/source → select
  eligible buy/outside suggestions → convert to draft orders (or requests sent for approval with `planBuyToRequest`)
  → follow result and refresh plan.
- **Expected:** the plan identifies its facility set and timestamp; draft converted orders count as supply and the same
  demand is not bought twice (DEMAND_ALREADY_COVERED). Purchasing's conversion creates no work order; Mantle
  converts no transfer anywhere (`METHOD_NOT_CONVERTED`, observed in MFG-24), and Manufacturing's MFG-24 converts
  make. The planner can run but not convert.
- **Recovery:** stale/superseded run, no source, missing method read, snoozed rule, held stock, blocked supplier,
  concurrent converter, already-covered demand and canceled selection. Partial results name the suggestion.
- **Screens/modes:** SupplyPlanning, InventoryAvailability, RequestSourcing/OrderDetail source links; browser/TUI/
  Standard, selected-row confirmation and narrow demand/supply detail. Customer drop-ship route continues PUR-23.

### PUR-18 — Set reorder levels and a schedule with visible effects

- **Actor/start:** planner (STOCK_POLICY_PLAN), buyer and reader (refused); one item with history and one without it at
  `ZIRET_WH`.
- **Objective/steps:** ReorderRules/Rules → New rule/Edit (min/max or fixed quantity, supplier) → inspect the
  equivalent InventoryAvailability/Policy → snooze → SuggestLevels choose history/lead/safety/cover basis → preview →
  apply selected suggestions with reason → PlanSchedule save timing and preview a run → revisit plan and schedule.
- **Expected:** rule, suggestion and applied value are distinct; missing demand/lead time is named, not zero demand;
  selected valid rows apply despite another refusal. Snoozing remains visible in shortage planning. The schedule
  identifies whose permissions execute it and its actual last result.
- **Recovery:** invalid min/max/day values, unavailable facility/product, no history, no reason, canceled apply,
  revoked scheduler authority and one failed scheduled scope. Existing values persist after an invalid submission.
- **Screens/modes:** all three ReorderRules children, InventoryAvailability/Policy and SupplyPlanning; browser/TUI/
  Standard, large localized quantity edits, selected-value labels, dates and keyboard/narrow forms.

### PUR-19 — Receive a purchase and reserve the right accepted stock

- **Actor/start:** buyer (refused receiving), buyer-receiver and the prepared standalone buyer-receiver; a fresh
  approved PO with a customer-demand peg, and `BOSS_PUR_PO_RCV` with its ASN.
- **Objective/steps:** OrderDetail → Expected receipt (ASN) (`ensure#PurchaseReceipt`) → open ShipmentDetail → inspect
  lines and locations → Receive a partial quantity or Receive all as expected → inspect accepted/rejected/held
  amounts → Finish receipt for only the intended remainder → follow quality outcome → reserve eligible received stock
  for its linked sales demand (ReceiptPegs).
- **Expected:** a repeated Expected receipt opens the same receipt, which Warehouse's New receipt also reopens
  (WH-10); receiving uses Warehouse's stock services and facility authority. Expected, received, accepted, rejected,
  held and released amounts are separate. Reservation consumes only eligible stock and names the customer order
  line; a receiving confirmation is not bill approval, and Create draft bill is AP's (PAYABLE_EDIT).
- **Recovery:** buyer without STOCK_RECEIVE, wrong location/facility, over-receipt, tracking/inspection requirement,
  stale row, canceled finish, locked posting date and a demand already reserved elsewhere. Preserve unrelated receipts.
- **Screens/modes:** Receipts, OrderDetail receipt section, Purchasing ShipmentDetail and ReceiptPegs; browser/TUI/
  Standard, row entry and actual saved stock/result. Warehouse's own receiving (WH-10–12) is a bounded handoff.

### PUR-20 — Explain an inspection and complete its permitted disposition

- **Actor/start:** buyer (read only) and prepared buyers holding Warehouse's inspect and quality-manager groups (the
  Warehouse users have no Purchasing root); PUR-19's quarantined receipt.
- **Objective/steps:** Receipts or Supplier360/PurchasingReceipts → Inspections → QualityInspection → inspect source
  quantity and template → record permitted results/evidence → verify → dispose accepted/rejected units → return to
  receipt and available stock. Open InspectionTemplates through the current entry and maintain a disposable template.
- **Expected:** inspect, verify and disposition remain separate actions; an accepted result alone does not imply
  released stock. Supplier quality context links to the right order/receipt and shows remaining held quantity.
  Template changes do not rewrite a completed inspection's recorded evidence.
- **Recovery:** missing sample/result, invalid quantity, wrong source type, missing grant, stale result, canceled
  disposition and an inspection file unavailable to the actor. Any offered certificate is Manufacturing's link (F190).
- **Screens/modes:** Inspections, QualityInspection, InspectionTemplates, Supplier360/PurchasingReceipts and receipt
  return; browser/TUI/Standard, two result rows, file delegation and narrow/keyboard samples. Warehouse's WH-13 owns
  the full quality workflow.

### PUR-21 — Accept purchased services and reconcile subcontract output

- **Actor/start:** buyer or buyer-receiver with a non-stock service PO from `BOSS_PUR_SUP_SERVICE`; the draft service
  PO of Manufacturing's MFG-25, placed/approved/sent here through PUR-11–13's controls; its dispatch and output are
  MFG-26's (on the Warehouse route WH-30 reviews). Do not use the shared `BOSS_WH_SUB_PO`.
- **Objective/steps:** OrderDetail → Record acceptance on the non-stock line → quantity/date/acceptor/evidence →
  confirm → inspect acceptance and bill eligibility. For subcontracting, follow the PO's source operation to
  dispatch/custody and the output receipt on the owners' side, then return to the PO's acceptance and matching
  evidence.
- **Expected:** ordinary acceptance uses `mantle.order.OrderServices.accept#ServiceItem` (PURCHASE_ORDER_EDIT or
  STOCK_RECEIVE, organization scope, at most as ordered). Subcontract acceptance comes from
  `mantle.work.ProductionServices.receive#SubcontractOutput` (STOCK_ISSUE, Warehouse's side): vendor-custody issue,
  production-valued output and service acceptance/accrual stay associated and happen once. Do not accept the
  subcontract line again or value output at the service PO price. Production cost close is Accounting's.
- **Recovery:** stock line submitted as service (NOT_SERVICE), over-acceptance (QUANTITY_EXCEEDS_ORDERED), canceled
  PO, missing evidence, same-operation retry, wrong organization and missing dispatch/output prerequisites. A missing
  physical step remains pending.
- **Screens/modes:** OrderDetail acceptance/source/receipt/bill sections, Supplier360/SubcontractOrders, Manufacturing
  and Warehouse handoffs; browser/TUI/Standard on the built routes, including useful read-only buyer presentation.

### PUR-22 — Resolve a supplier bill's match exception without crossing finance authority

- **Actor/start:** buyer (upload, PAYABLE_IMPORT), buyer-matcher, `retail.finance.ap` (AP intake) and
  `retail.finance.approve` (finance continuation), and reader; partial accepted receipt (PUR-19/20, or WH-12's),
  price variance, duplicate bill and PUR-28's uploaded bill.
- **Objective/steps:** Bills/PO → Upload supplier bill or (AP) Create draft bill → InvoiceDetail → inspect source,
  holds and exception lines → InvoiceMatch choose accepted receipt/service evidence → apply (and unapply) →
  MatchExceptions reevaluate selected exceptions → Ask to release with reason → finance continuation → reopen bill
  and PO. Preview/link a bounded legacy match batch with one ambiguous row and inspect its named result.
- **Expected:** bill quantity cannot be justified by merely received or rejected stock; service acceptance is explicit.
  Buyer import, matching, finance hold release, approval and payment are separate. Buyer sees useful status while
  restricted payment/GL detail is withheld. A duplicate supplier reference identifies the existing bill.
- **Recovery:** invalid/quarantined file, duplicate reference, the buyer refused matching, over-match, ambiguous legacy
  receipt, price/quantity hold, stale receipt/acceptance and independently failed reevaluation. Preserve successful
  members; which grant the legacy link needs is to verify.
- **Screens/modes:** BillList, InvoiceDetail, InvoiceMatch, MatchExceptions, PO bill/prepayment and Supplier360/Bills;
  browser/TUI/Standard with actual upload/content handling. Landed cost (Allocate to receipts, ACC-23) and AP
  payment are bounded owner handoffs; ACC-11/12 review Accounting's own mount on `BOSS_ACCT_ORG` bills.

### PUR-23 — Confirm a drop-ship delivery from its commercial evidence

- **Actor/start:** buyer and `ziddleman.billing`; `BOSS_PUR_DROPSHIP`, `DEMO_3_1_CS`, a prepared Retail sales line of
  `DEMO_3_1` and PUR-28's delivery report; the gate off and on.
- **Objective/steps:** Supplier360/PurchasingDropShip inspect facility/integration → route an eligible customer line
  from RequestSourcing, SupplyPlanning or Drop-ship from supplier on the customer order → inspect resulting purchase
  and linked sales lines → approve/send as required → read the supplier report → buyer Confirm delivery/Confirm line
  with quantity/tracking → inspect purchase delivery, sales shipment, invoice and remaining quantity → repeat the
  completed confirmation.
- **Expected:** report receipt and buyer confirmation are visibly distinct; the confirmation is not prefilled from the
  report (F174). `report#DropShipDelivery` ships/posts nothing; `finalize#DropShipPurchaseOrder` performs the
  authorized delivery and linked customer fulfillment. Drop-ship purchase delivery is not received into the local
  warehouse. Partial quantities and tracking reconcile.
- **Recovery:** missing price, blocked supplier, order waiting approval, wrong sales line/facility, ambiguous product,
  excessive quantity, canceled confirmation and uncertain response. A repeated completed outcome creates no new
  delivery.
- **Screens/modes:** Supplier360/PurchasingDropShip, PurchaseOrders Drop-ship view, OrderDetail/OrderDropShip and source
  routes; browser/TUI/Standard; customer invoice outcome through its owner.

### PUR-24 — Return received goods to a supplier and follow credit or replacement

- **Actor/start:** buyer (RETURN_AUTHORIZE), reader (refused) and `retail.finance.ap` (PAYABLE_EDIT) for the
  supplier credit; PUR-19/20's rejected and released units. Send-back and ship are WH-27's.
- **Objective/steps:** SupplierReturns or receipt/order → New supplier return → Add exact eligible receipt quantities
  and response → Record RMA → Authorize (`authorize#SupplierReturn`) → print ReturnAuthorization → follow Warehouse's
  send-back and ship → reopen ReturnDetail → AP settles the eligible supplier credit, or the buyer uses Replace →
  inspect the replacement PO and its expected receipt. Inspect a return Warehouse created and the buyer authorizes.
- **Expected:** receipt provenance and returned/shipped/credited/replaced quantities remain clear. Warehouse
  `ship#SupplierReturn` moves stock and settles nothing; `settle#Return`'s supplier credit needs PAYABLE_EDIT and the
  shipped-back/billed limits, and replacement excludes its quantity from credit. A physical return is not a promise
  to refund unbilled stock.
- **Recovery:** wrong return direction (NOT_SUPPLIER_RETURN), excess receipt quantity, missing RMA/evidence, empty
  return, canceled authorization, unshipped or unbilled credit, repeated replacement and unavailable supplier.
  Warehouse ships a whole return (F324 in its review). Retain original receipt quantities/history.
- **Screens/modes:** SupplierReturns, ReturnDetail, ReturnAuthorization, Supplier360/PurchasingReturns, order links and
  Warehouse/Accounting continuations; browser/TUI/Standard, actual printed authorization and repeat-result inspection.

### PUR-25 — Evaluate supplier performance and record a risk with evidence

- **Actor/start:** buyer (SUPPLIER_SCORECARD_EDIT) and reader; suppliers with five or more and with fewer eligible
  receipts, a score policy and an active risk.
- **Objective/steps:** Scorecards → Evaluate suppliers for a stated period → inspect per-supplier results →
  ScorecardDetail metric drill to original promise, receipt, rejection and other evidence → recalculate → compare
  retained evaluations → Record risk/End → follow Supplier360/PurchasingPerformance and a buying-policy consumer.
- **Expected:** denominators, period, policy version and evidence distinguish a poor score from insufficient data.
  Recalculation retains the previous evaluation. Any Warn/Block effect is explained separately from manual risk text
  and supplier approval; a short sample does not silently become a buying ban, and no per-document override exists
  (F178).
- **Recovery:** missing/invalid evidence, unsupported metric, empty period, one failed supplier evaluation, reader
  refused, stale policy/risk and canceled action. Date changes do not restate a retained evaluation.
- **Screens/modes:** Scorecards/ScorecardDetail, Supplier360/PurchasingPerformance and ScorecardPolicies;
  browser/TUI/Standard, metric drill/Back, two risk rows and actual CSV contents.

### PUR-26 — Explain procurement progress and spending from source to report

- **Actor/start:** buyer, reader and a separately authorized finance/budget reader; linked request/order/receipt/
  bill/payment.
- **Objective/steps:** Home/Performance → Spend, Commitments, ProcurementTracker, PurchaseHistory and SupplierStatement
  → choose organization/supplier/product/date/currency/stage basis → drill to source and return → export CSV and Print
  (html-print) → compare values and restrictions with Supplier360 and Product360/PurchaseHistory.
- **Expected:** committed, billed, reserved and actual are labeled and not summed indiscriminately. The tracker shows
  missing steps as such; bill/payment details depend on grants. Currency/date/filter basis survives output. Supplier
  statement balance is explained from its actual bill/credit/payment inclusion.
- **Recovery:** no rows, mixed currencies, unavailable source, amount withheld, boundary dates, historical corrected
  record and export error. A restricted drill must not leak identity or amounts in CSV/print or the response payload.
- **Screens/modes:** the five report pages, Home spend summary, supplier/product consumer tabs and linked
  InsightsRecord helper where authorized; browser/TUI/Standard with actual downloaded bytes and narrow tables.

### PUR-27 — Change purchasing policies and prove the intended consumer

- **Actor/start:** administrator (Settings is admin-only) with the recorded Retail baseline (§2); approver for the new
  steps; buyer and reader refused.
- **Objective/steps:** SettingsHome → New purpose/category, Edit → PurchasePolicy: dated row turning the approval gate
  on, unapproved supplier Stop and `planBuyToRequest`, with reason → ApprovalPolicies: add `PasAward` steps and
  Change/End an order step, preview amount/source type → ScorecardPolicies change basis, criterion and response rule →
  reload → hand each change to its consumer (§2 continuations) → restore the baseline when they are done.
- **Expected:** inherited/default versus dated local values are clear; one form preserves unrelated policy fields.
  Required reasons, effective dates, eligible approvers and amount-band boundaries are understandable. A configured
  option whose consumer is not built (recurring release, F134) is a limit, not a working workflow.
- **Recovery:** overlapping approval bands, no eligible quorum, invalid percentages/dates, stale expected row, wrong
  organization, missing edit grant and canceled end. A refused update preserves the form and the effective policy.
- **Screens/modes:** SettingsHome, PurchasePolicy, ApprovalPolicies, ScorecardPolicies and consumers in PUR-03, 10–12,
  17, 23 and 25; browser/TUI/Standard, keyboard, long labels, localized numeric edit samples.

### PUR-28 — Receive a supplier response through the public handoff

- **Actor/start:** buyer, `ziddleman.billing` and a second supplier contact invited here; local `ZIZI_PORTAL`
  (`portal.zizi.localhost`), the demo quote and acknowledgement links, and fresh links from PUR-07/13.
- **Objective/steps:** Supplier360 Invite to the Supplier app → captured invitation/contact access → SupplierHome → open
  only a sent RFQ → QuoteResponse enter offer → save draft → reopen private draft → submit with a supported file →
  inspect receipt and the internal quote and PurchaseSupplierResponse notice. Open the current PO →
  OrderAcknowledgement accept/change/reject and line promises → buyer review. Submit a drop-ship delivery report on a
  drop-ship order's OrderAcknowledgement (for PUR-23) and a bill through BillUpload (for PUR-22's intake).
- **Expected:** external pages show the supplier's published document at its sent revision, no competitor quote,
  internal request, unrelated organization or internal navigation. The saved draft stays private until submitted;
  internal Declined is PUR-07's. Late responses are accepted and marked (F171). Acknowledgement changes neither
  ordered price/quantity nor stock/payment. Scanned attachments and repeated responses stay on the right record.
- **Recovery:** wrong contact/site, revoked/expired link, superseded revision, unsent RFQ, canceled quote/order,
  throttled request, upload scan failure, duplicate bill and lost response. QuoteResponse and OrderAcknowledgement
  offer no file downloads (F173): record the limit rather than manufacturing it from the design.
- **Screens/modes:** PASS SupplierHome/QuoteResponse/OrderAcknowledgement/BillUpload and internal return points; public
  browser desktop/390px/keyboard plus BOSS buyer modes. BillUpload's own review is Accounting's ACC-30; do not claim
  remote PASS coverage from a local success or start another runtime without its explicit execution scope.

### PUR-29 — Keep discussion, files and issued documents with the correct record

- **Actor/start:** buyer, reader and a restricted counterpart on supplier, request, RFQ, quote, PO, agreement and return.
- **Objective/steps:** owning record → Chatter/Files or named content control → inspect existing evidence → upload a
  permitted local file → post permitted discussion → reload/follow notification → download original and issued content
  → compare record identity and access after navigation to another record and Back.
- **Expected:** files distinguish original supplier evidence from generated issue revisions; discussion audience and
  record identity remain visible. Read-only users get useful readable content without write controls. Async
  completion after navigation cannot attach the upload or message to the destination record.
- **Recovery:** missing/deleted file, denied record, invalid/oversized/quarantined file, failed upload, lost grant,
  canceled dialog and same-named files on two records. Error recovery retains the intended record and entered message.
- **Screens/modes:** Chatter/RecordFiles with their TUI helpers, Supplier360 Documents/Conversation, Product360/Documents/
  Index and record-specific `rfqContent`, `quoteContent`, `orderContent`, `agreementContent`; browser/TUI/Standard,
  inspected bytes and explicit terminal upload/download delegation.

### PUR-30 — Reconcile permission, organization and context boundaries

- **Actor/start:** the §2 actors: narrow holder/non-holder pairs, `purchasing.services` against `BOSS_PUR_PO_SVC`,
  `BOSS_PUR_AGR_SVC` and `BOSS_PUR_SUP_SVC_ORG`, `manufacturing.buyer` (buyer grants, no root), the prepared
  standalone buyer-receiver/matcher and `ziddleman.billing`.
- **Objective/steps:** reconcile refusals collected in earlier activities → inspect outstanding direct routes,
  transitions, choices, palette/record links, inherited children, exports and content download → repeat with the
  rightful holder → verify the requester's own scope, shared supplier with private organization records, and the
  external supplier. Include the inherited Product360/Prices CSV/XLSX endpoints: compare an authorized
  owning-context output with the Purchasing context's actual refusal or omission.
- **Expected:** root and area authorizations, record ownership and service permission all hold. Forged `appRoot`,
  organization, supplier, facility or source IDs do not widen access; no restricted money is sent then hidden. The
  standalone buyer receives and matches from Purchasing without the Warehouse or Accounting launcher
  (`purchasing.buyreceive` holds the Warehouse root, so it does not show this).
- **Recovery:** expired grant/relationship, foreign active organization, missing record, private supplier contact,
  unavailable choice selection and permission lost after preview. Distinguish validation failure from the refusal.
- **Screens/modes:** remaining inventory boundaries across Material/TUI/Standard and output endpoints; a targeted
  access/isolation activity. Broad automated coverage already lives in acceptance PurchasingAccessWalk.

### PUR-31 — Reconcile cross-app continuity and remaining modes

- **Actor/start:** selected owner/consumer pairs and the unresolved mode/branch ledger from PUR-01–30.
- **Objective/steps:** follow each handoff below from cold entry, with one record identity, Back and a direct bookmark
  after a fresh app navigation; open the counterpart only as far as the handoff. Finish remaining TUI, Standard,
  narrow and output samples.
- **Expected:** app context supplies the appropriate actions and return path without changing the record or authority.
  Purchasing's money/stock/quality handoffs agree with the owning review, and later shared corrections work for a
  representative second consumer. Unbuilt transfer conversion or an external dependency is an explicit unresolved
  branch.
- **Recovery:** missing owner launcher, inaccessible counterpart, stale origin URL, changed selected record, lost
  browser state and unsupported terminal action. Preserve the first meaningful refusal and a useful way back.
- **Screens/modes:** every remaining mapped inspection, defaults, helpers and outputs; observed modes recorded by
  activity. Stop only with passed evidence or a named blocked/deferred/failed continuation, never an inferred all-pass.

| Handoff | Counterpart side (review) | Purchasing side |
| --- | --- | --- |
| Purchase receipt prepared by a buyer (`ensure#PurchaseReceipt`) | Warehouse WH-10: `warehouse.receive`'s New receipt reopens it | PUR-19: `purchasing.buyer` prepares it (Expected receipt) on a fresh order |
| Purchase revision on an open receipt (`apply#PurchaseRevision`) | Warehouse WH-12 | PUR-15 |
| Receipt finish and quality | Warehouse WH-12/13 on Warehouse's mounts | PUR-19/20 on Purchasing's ShipmentDetail and QualityInspection mounts |
| Bill intake, match and hold release (Shared InvoiceMatch) | Accounting ACC-11/12 on `BOSS_ACCT_ORG` bills (`finance.*`); Warehouse WH-12 supplies the receipt | PUR-22 on the Retail bill: `purchasing.buymatch`, `retail.finance.ap`, `retail.finance.approve` |
| Supplier return send-back and ship (`ship#SupplierReturn`) | Warehouse WH-27 creates, sends back and ships | PUR-24: authorization (`authorize#SupplierReturn`), replacement and the supplier credit (`settle#Return`, `retail.finance.ap`) |
| Supply plan buy conversion | Manufacturing MFG-24 shows buy rows only and observes the transfer refusal | PUR-17 on Purchasing's mount |
| Outside-processing service PO | Manufacturing MFG-25: request and `manufacturing.buyer`'s conversion to a draft | PUR-21 places, approves and sends it through PUR-11–13's controls |
| Subcontract output and service acceptance (`receive#SubcontractOutput`) | Manufacturing MFG-26 drives the receipt for MFG-25's PO; Warehouse WH-30 reviews the route on `BOSS_WH_SUB_PO` | PUR-21 reads the acceptance on OrderDetail |
| Supplier offers and catalog | Products PRD-11 | PUR-04/08 on Purchasing's SupplierPrices and Product360 |
| Budget commitment | Accounting ACC-26 on `BOSS_ACCT_BUDGET` | PUR-12 on a prepared Retail budget |
| Landed cost (Allocate to receipts) | Accounting ACC-23 | PUR-22 link only |
| PASS BillUpload | Accounting ACC-30 reviews the page | PUR-28 submits one bill only as PUR-22's intake input |

## 5. Existing checks and future verification

This is a source inventory of available checks, not a report of new execution. Names omit `.spec.js`. There are
**14 Purchasing server regression specs** (`test/Purchasing/`, with helpers `PurchasingSpecLib.js` and
`PurchasingDropShipLib.js`), **one browser regression walk** and **18 server acceptance specs**
(`test/acceptance/Purchasing/`). `PurchasingOrdersWalk` exists in both `test/client/Purchasing/` and
`test/acceptance/Purchasing/`, so name the suite with any `--spec`. There is no `test/acceptance/client/Purchasing/`; PASS's
supplier browser walks are in mr-pass.

| Current coverage | Source / what it establishes when run | Activities / remaining review |
| --- | --- | --- |
| BOSS access rules | regression `PurchasingAccess`: root/area/capability/scope, selected choices, direct operations and composed receiving/matching access | PUR-01, 30; live discoverability, direct descendant and mode gaps still pending |
| Supplier and app presentation | regression `PurchasingSuppliers`, `PurchasingApprovals`, `PurchasingOrders` | PUR-02–03, 11–14 |
| Requests and sourcing | regression `PurchasingRequests`, `PurchasingSourcing` | PUR-05–10 |
| Supply and agreements | regression `PurchasingAgreements`, `PurchasingReplenishment` | PUR-16–18 |
| Receipt, finance and return context | regression `PurchasingReceiving`, `PurchasingBills`, `PurchasingReturns`, `PurchasingDropShip`, `PurchasingRevisions` | PUR-15, 19–24; server presentation/transition checks, not observed browser flows |
| Performance | regression `PurchasingPerformance` | PUR-25–26 |
| Single browser golden path | `test/client/Purchasing/PurchasingOrdersWalk`, registered in `test/client/suite.js`: buyer creates/places, approver approves, buyer sends at 1280×1000 | PUR-11–13; not modes, recovery, outputs or other workflows |
| Acceptance foundation/access | `PurchasingFoundationWalk`, `PurchasingAccessWalk` (standalone buyer, isolation by URL, mount, export, print, palette, link, choice, search and the Supplier app) | PUR-01, 28, 30–31 |
| Acceptance supplier/order/approval | `PurchasingSuppliersWalk`, `PurchasingOrdersWalk`, `PurchasingApprovalsWalk`, `PurchasingRevisionsWalk` (they toggle the gate and Warn/Stop on dated rows) | PUR-02–03, 11–15, 27 |
| Acceptance demand/source/award | `PurchasingRequestsWalk`, `PurchasingSourcingWalk`, `PurchasingAwardWalk` | PUR-05–10 |
| Acceptance agreement/planning | `PurchasingAgreementsWalk`, `PurchasingReplenishmentWalk`, `PurchasingReplenishmentRoutesWalk` | PUR-16–18, 23 |
| Acceptance physical/financial handoffs | `PurchasingReceivingWalk`, `PurchasingBillsWalk`, `PurchasingReturnsWalk`, `PurchasingDropShipWalk` (spec-local Retail finance users) | PUR-19–24 |
| Acceptance performance and static render | `PurchasingPerformanceWalk`; `PurchasingServerStatic` (every Purchasing XML screen's static check as `john.doe`) | PUR-25–26, 31; static check is not a browser journey |
| Acceptance sweeps | root `AppStructure` (every Purchasing route on PurchasingSpecLib's route fixtures) and `TuiRender` (tui mode) | The app's one sweep per mode; do not add another |

| Owning component checks | Actual rule/contract and review use |
| --- | --- |
| Mantle `test/order/` PurchasePolicy, PurchaseOrders, PurchaseApprovals, PurchaseHoldPermission | Buying policy, ordered product/price, approval gate/steps, holds and source authority; PUR-03, 11–14, 27 |
| Mantle `test/order/` PurchaseRequests, Sourcing, SourcingAwards, PurchaseRevisions | Request demand, issue/offer/award operations, revision/receipt race and retries; PUR-05–10, 15 |
| Mantle `test/order/` PurchaseReceipts, PurchaseBills, PurchaseReturns, DropShip | Physical/commercial handoff and bill/return/delivery rules; PUR-19–24 |
| Mantle `test/party/` PurchaseAgreements, SupplierScorecards | Agreement version/cap/release and evidence-based evaluations; PUR-16, 25–27 |
| Mantle `test/product/` SupplyPlanning, Replenishment, ReplenishmentRoutes | Netting, conversion, repeated demand, stock policy and source routes; PUR-17–18, 23 |
| Mantle `test/order/` SupplierPortal | Published revision, external scope, repeated response, revocation and delivery report; PUR-28 |
| Mantle acceptance `order/PurchaseApprovalBudgetWalk`, `party/PurchaseAgreementWalk` | Complete owner scenarios; run only on request |
| PASS `test/Supplier/SupplierPages`, `test/Billing/Portals`, `test/client/PortalHttp` | Page/operation projection and portal baseline; inspect exact asserted branches before relying on them |
| PASS `test/acceptance/SupplierPortalFixtures`, `test/acceptance/client/SupplierPortalHttp`, `RemoteHttp` | Public quote/acknowledgement flow, setup and the remote authority; local and remote outcomes are distinct |
| Warehouse/Manufacturing/Accounting rule and acceptance families | Owner checks for stock/quality, subcontract output, close and finance settlement; do not duplicate them in BOSS Purchasing |

The implementation's verification table (impl §8) is provenance; some of its contexts predate the current suites.
Read current assertions and setup/`dependsOn` before selecting a run. No historical passed count closes a present
activity, and a rendered source sweep never proves visible navigation or output bytes.

### Verification rules for later refinements

These rules govern the refinement pass, and the commit rule applies in both; the review pass corrects nothing and
commits no source (§2). The suite rules are the [testing skill](../../../../../.agents/skills/testing/SKILL.md) and
[Build-Test](../../../../../docs/Build-Test.md#the-two-suites) with [rendering screens in
tests](../../../../../docs/Build-Test.md#rendering-screens-in-tests). Purchasing specifics:

- **While working.** From the mr-moqui root on a built binary: `./moq test mr-boss --spec PurchasingRevisions
  --nobuild`, the owning Mantle spec when its rule changes, and the golden path
  `./moq test-client mr-boss --serve --spec PurchasingOrdersWalk --nobuild` (needs mail capture and the approver).
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
  `./moq accept mr-boss --spec PurchasingReceivingWalk`.
- **Rendering.** The app's sweeps are AppStructure and TuiRender in acceptance. Across regression a screen renders at
  most once per mode with all its checks, in tui as well only for the 21 screens and 6 templates with their own
  `render-mode` sections. No role × mode matrix, second golden path, Mantle rule retested through a BOSS wrapper or
  screenshot baseline.
- **Budgets.** BOSS `test/budget` 264 s server / 57 s client, Mantle 393 s server, PASS 20 s / 9 s; a component
  over 1.5 times its budget or one regression spec over 15 s fails the run. Cut duplication or move a scenario to
  acceptance; no budget is raised without the user's agreement.
- **Lint.** `moqui lint --screens <report-file>` for changed screens (the argument is an overwritten output report,
  never a screen path), compared with the baseline; Markdown-only edits need none.
- **Evidence** stays in ignored `plans/ui-refinement-evidence/boss-purchasing/` in the framework repository; redact
  portal tokens and never commit screenshots, credentials or tokens.

## 6. Coverage, findings and running record

### Activity coverage ledger

**Pending** means not reviewed; **inspected** means source/render/visual inspection only; **exercised** means steps
executed with an explicit pass/fail/partial outcome; **blocked** means a missing prerequisite; **deferred** means
deliberately postponed with reason and follow-up. Exercised does not by itself mean passed: use `exercised / partial`
and name the open continuations, recovery and mode gaps. Blocked and deferred coverage remains unresolved. Source
research and document review do not advance this ledger; record actual modes and results, not only a test name.

| Activity | Status | Outcome / recovery / mode gaps | Evidence / findings |
| --- | --- | --- | --- |
| PUR-01 — Workday and scope | pending | All live variants unreviewed | — |
| PUR-02 — Supplier identity/profile | pending | All live variants unreviewed | — |
| PUR-03 — Supplier approval/restriction | pending | All live variants unreviewed; Stop branch needs PUR-27's row | — |
| PUR-04 — Product/price explanation | pending | All live variants unreviewed; needs a prepared Retail supplier-price editor | — |
| PUR-05 — Purchase request | pending | All live variants unreviewed | — |
| PUR-06 — Request sourcing | pending | All live variants unreviewed | — |
| PUR-07 — RFQ issue | pending | All live variants unreviewed | — |
| PUR-08 — Supplier quote/price | pending | All live variants unreviewed | — |
| PUR-09 — Offer comparison | pending | All live variants unreviewed | — |
| PUR-10 — Award/losing invitations | pending | All live variants unreviewed; award approval needs PUR-27's rows | — |
| PUR-11 — Purchase order | pending | All live variants unreviewed | — |
| PUR-12 — Approval/budget | pending | Gate-on row and a Retail budget required | — |
| PUR-13 — Issue and retained evidence | pending | Requires local PDF/mail prerequisites | — |
| PUR-14 — Hold/cancel/remainder/clone | pending | All live variants unreviewed | — |
| PUR-15 — Revision/acknowledgement | pending | All live variants unreviewed | — |
| PUR-16 — Agreement/release | pending | All live variants unreviewed | — |
| PUR-17 — Supply plan/conversion | pending | All live variants unreviewed | — |
| PUR-18 — Reorder/schedule | pending | All live variants unreviewed | — |
| PUR-19 — Receipt/reservation | pending | All live variants unreviewed | — |
| PUR-20 — Quality/disposition | pending | All live variants unreviewed; needs prepared quality buyers | — |
| PUR-21 — Service/subcontract acceptance | pending | Requires owner-side physical evidence | — |
| PUR-22 — Bill/match resolution | pending | Needs prepared Retail AP/approver | — |
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

No runtime/UI defect has been established by this planning work. The review pass records findings with Owner /
correction / retest empty; the refinement pass fills them in. Number later findings **PUR-UI-001** onward with the
guide's fields and severities ([record, fix and verify](../../../../../docs/dev/UI-Review.md#record-fix-and-verify)): P1
blocks work or makes essential information unusable, P2 causes substantial friction or misleading presentation, P3 is
a localized refinement. Distinguish observed failures, source suspicions and design judgments. Data corruption or
unauthorized disclosure takes priority regardless of appearance.

| ID | Severity / status | Actor, activity and step | Route / mode / theme / viewport | Reproduction, impact and evidence | Owner / correction / retest |
| --- | --- | --- | --- | --- | --- |
| — | No observed findings yet | — | — | Source concerns below are investigation inputs | — |

Source concerns to carry into later execution, without treating them as observed defects:

- Shared catalog and supplier descendants exist physically beyond the admitted tab set. Inspect direct routes,
  helper choices and outputs alongside an authorized owning-app counterpart; menu omission is not a security result.
- Shared Supplier360 profiles are organization-specific while the supplier itself may be shared. Inspect organization
  switching, finance omission, duplicate candidates and current selected labels for stale or foreign context.
- RFQ sent revision, offer revision and published supplier-price dates are different histories; F176 and F189 are
  open known limits (impl §7). Check that the visible text does not imply a comparison basis it does not keep.
- Approval, award, reminder, issue and conversion retries have different persisted receipts; F118's reminder resend
  must not become a generic “retry is safe” promise in the UI or the review record.
- Receipt quality, service acceptance, subcontract output and bill match use different quantity/evidence bases.
  Trace the original record rather than equating accepted, released, billed and settled quantities.
- With Retail's approval gate off (the demo default), what a placed order's page says about approval may not match
  the approval policy rows it shows: source suspicion only, to observe in PUR-11.
- Reports deliberately withhold some amounts and use different commitment, bill and payment bases. Confirm the
  explanation in visible text and exported bytes instead of inferring one shared “spend” total.

### Bounded batch record

| Batch | Scope | Evidence / verification | Outcome / continuation |
| --- | --- | --- | --- |
| Plan and document review — 2026-11-10 | Dedicated Purchasing author in the coordinated four-app batch; current local/shared inventory, workflows, grants, fixtures, outputs and test coverage; an independent reviewer corrected PUR-09's ranking versus unknown landed cost and PUR-28's private draft/send flow, an addendum added the SupplierPrices/Product360 price CSV/XLSX, and the coordinator reconciled the companion handoffs | Source/document inspection and independent rechecks only (Mantle `Awards.js`, PASS `QuoteResponse`, `Shared/SupplierPrices.xml`, `Shared/Prices.xml`); no runtime, tests, outputs or business mutations | Initial document written and corrected; all PUR activities pending |
| Source recheck and revision — 2026-11-11 | Rechecked counts, defaults, mounts, dialogs, render-mode sections, users/groups/permissions/areas, demo IDs and dates, services, specs, budgets and impl finding numbers; condensed §2/§5 to area-specific content | Source and document inspection only (ls, grep, scripted route count); no runtime, tests or commits | Corrections listed in the revision report; added actor table, fixture consumption, handoff table and wave reorder; all live activities remain pending |
| Cross-review reconciliation — 2026-11-11 | The five companion reviews reconciled with one another and with source: handoff sides, shared fixtures, prepared identities, the shared-runtime disposition and the method wording | Source and document inspection only; no Customer Service record kind or Purchasing screen links a supplier return to a case (`CustomerService.js` `readReturn`) | Supplier credit kept in PUR-24 with `retail.finance.ap`; the Customer Service supplier-return row removed; cross-review orderings added; all PUR activities pending |

At research start the coordinator recorded framework `73c8a8945abff9709260e922b4ba6c348ee903b3`, BOSS
`1f6fde4e450a1e4b79773e4a4e5d8de3dad0eebf` and Mantle `aa702d05da2b12932abf788a7c12a428b388ced6`. These are source
provenance, not a tested deployment.

For each execution batch append: its pass (review or refinement); actor and fixture identities; source and binary
revisions; runtime, clock and modes; activities and branches attempted; findings and owning layer; important
before/after evidence; persisted outcomes and inspected artifacts; exact checks, results and skips;
design/implementation updates; commits when made; temporary grants, settings and policy rows restored; unresolved
continuations. Keep notes bounded and refer to evidence files rather than pasting logs or tokens.

## 7. Decisions

- **Planning record and method:** planning only, written 2026-11-10, checked against source and reconciled with the
  four companion reviews on 2026-11-11; no runtime, walkthrough, test, build, application change or commit, and every
  activity pending. Products' seven-part structure; §2 and §5 keep only Purchasing specifics and link the guide and
  Products for the generic method (user decision, 2026-11-11); earlier reviews' statuses, authorizations and
  exceptions do not carry over.
- **Source and handoffs:** current mounts, services and grants govern scope, and older records are reconciled here
  without being rewritten. Each side of a cross-app handoff is exercised once, by the activity the handoff tables name
  (PUR-31 here); the other review opens it only as far as the handoff.
- **Activity numbering is stable:** the companion reviews cite PUR numbers, so broad activities (PUR-04, 15, 22)
  keep their numbers and are bounded by their steps instead of being split.
- **Wave order follows data:** PUR-28 runs at the start of P4 because its bill upload and delivery report are
  PUR-22's and PUR-23's inputs; PUR-27 makes its dated policy rows in P0 and hands them to later consumers.
- **Retail-wide policy:** gate, Stop, award-approval and `planBuyToRequest` rows change every review's Retail purchase
  flow; change them only on dated rows, record and restore them (§2).
- **Business continuity:** keep organization, supplier, demand source, revision, quantity/UOM, currency/date and
  operation identity explicit. Follow the resulting physical/financial/public record through its owner and back.
- **Authority:** request, buy, approve, receive, inspect, match, pay and settle are separate capabilities. App context,
  a visible tab or another group's launcher cannot supply a missing grant; missing Retail finance, quality and
  supplier-price users are prepared, not borrowed from another organization.
- **Modes and completion:** Material is the visual target; actual TUI and brief Standard/output checks stay explicit.
  PASS is a bounded public browser handoff; shared custom modes and inherited helpers stay in the inventory though
  Purchasing has no local QVue file. Completion needs evidence for the selected activities, resolved or accepted
  findings and a candid ledger of what remains; a source inventory or passing suite is not a usable workflow.
- **Phases (user decision, 2026-11-11):** a complete review pass with concurrent agents comes first and corrects
  nothing; all findings are triaged together and addressed in a separate refinement pass (§2).

### Execution setup dispositions

The user decided every setup question on 2026-11-11. Record the actual values (instances, paths, ports, hostnames and
dates) in the first live batch and whenever an instance is added, as Products did:

- **Bootstrap and instances (decided):** the release binary, embedded Postgres and disposable databases throughout.
  The coordinator decides which agents share an instance and which get their own, and when (major data staging or a
  conflicting setup), and starts further instances on the fly on free non-default ports with their own hostnames (user
  decision, 2026-11-11). Record each instance's runtime and database paths, linked components (PASS for PUR-28),
  loaded demo data and any selected fixture specs; listener ports and hostnames, including the PASS `<public-site>`.
- **Shared runtime (decided):** the coordinating agent decides whether the five reviews share one runtime and
  manages the concurrent agents, the cross-review order and the restore of Retail-wide changes (§2).
- **Dates and zones (decided):** the real clock in the machine's current zone, recorded with the execution date, and
  no DST or second-zone checks (user decision, 2026-11-11); policy, price and agreement rows recreated relative to it.
- **Tool capability:** measured viewports, terminal keyboard and Chromium/PDF. 200% browser zoom is not checked
  (user decision, 2026-11-11).
- **Posting and mutation extent (decided):** postings and temporary setting, grant and policy changes in the
  disposable runtime are allowed (user decision, 2026-11-11); the coordinator sequences them and restores the changes.
- **Prepared fixtures (decided):** prepared users and records may be created for testing (user decision, 2026-11-11):
  §2's prepared Retail users, including the shared Retail finance identities, and a Retail budget.
- **Automation selection (decided):** focused acceptance walks and fixture specs along the way, and the full
  application acceptance run after the final `./moq test-apps` (§5; user decision, 2026-11-11).
- **Test cadence (decided):** local, focused checks before each commit in either pass, and one `./moq test-apps`
  (with `./moq test-framework` if framework code changed) at the end of the refinement pass (§5; user decision,
  2026-11-11).
