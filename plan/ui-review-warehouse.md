# IronStone BOSS — UI review: Warehouse

Contents: [scope and sources](#1-purpose-scope-and-sources) · [method](#2-review-method-and-refinement-criteria) ·
[screen inventory](#3-screen-and-surface-inventory) · [activities](#4-end-to-end-activities) ·
[verification](#5-existing-checks-and-future-verification) · [running record](#6-coverage-findings-and-running-record) ·
[decisions](#7-decisions).

## 1. Purpose, scope and sources

Review Warehouse through the work of receiving, storing, counting, moving and fulfilling physical goods. Follow a
purchase receipt into usable stock, a sales shipment from reserved stock to delivered packages, and a return or
production movement through its quality and financial handoffs. The daily workspace should make the facility,
physical identity, unit, quantity, stock state and next permitted action clear, including on a scanner-driven device.
A completed click must explain what moved, what remains, and how the operator resumes after a refusal or interruption.
Substantial layout and navigation refinements may be proposed where they improve an implemented workflow.

This follows [Products](ui-review-products.md) and the
[document convention](design-doc-guide.md#ui-review-and-refinement-phase); it is the plan and running record of the
Warehouse review: inventory, activities, coverage, findings, decisions and bounded execution notes.

**Status: planning only.** First pass 2026-11-10, source-checked 2026-11-11 (America/Chicago), as part of the
four-app documentation batch. All live activities and mode coverage start pending. No runtime was started, no stock
or financial record was changed, and no tests or walkthroughs were run to write it. Historical implementation results,
available tests and source inspection do not establish completed Warehouse review activities. This plan does not
start the live review; acceptance runs follow §5.

### Inputs and reference patterns

- [Warehouse design](design-warehouse.md), [implementation](impl-warehouse.md) (status: P0–P18 built; open questions
  §5, deferrals §7), [research](research-warehouse.md) and [implementation notes](../docs/WarehouseImplementation.md).
- Companion reviews [Accounting](ui-review-accounting.md), [Manufacturing](ui-review-manufacturing.md),
  [Purchasing](ui-review-purchasing.md) and [Customer Service](ui-review-customer-service.md);
  [Products review](ui-review-products.md), [Projects review](ui-review-projects.md),
  [drawers, Commons and Comms review](ui-review-drawers-commons.md),
  [framework UI review guide](../../../../../docs/dev/UI-Review.md) and
  [framework review](../../../../../plans/archive/UI-Refinement.md).
- [Application practices](../../../../../docs/dev/Practices-App-Dev.md), [style guide](style-guide.md) (§8.2 handheld
  density), [crosscut design](design-crosscut.md), and current Purchasing, Manufacturing, Customer Service, Products
  and Accounting designs/contracts where their work enters or leaves Warehouse.
- Current `screen/Warehouse.xml`, `screen/Warehouse/`, the mounted `screen/Shared/` sources and their children,
  `template/Warehouse*.xml`, `service/ironstone/warehouse/` (capabilities in `Warehouse.js`), `MoquiConf.xml`,
  `data/BossSetupData.xml`, `data/BossUsersDemoData.xml`, `data/BossWarehouseDemoData.xml` and
  `service/ironstone/warehouse/DemoServices.xml`.
- Current BOSS Warehouse regression and acceptance specs, client suite registrations and fixture helpers;
  Mantle's shipment/stock, facility, quality, count, traceability, production, return, purchasing and ledger services
  and their rule specs. Current grants, routes, outputs and service contracts take precedence over older prose.

Use the earlier research as a comparison lens: Odoo's receipt/delivery task continuity, ERPNext's stock and quality
work, Carbon's inventory and shop-floor patterns, and the Moqui baseline's stock and shipment contracts. These are
patterns documented in the existing research, not fresh claims about external products or a feature checklist to
import. Warehouse review is not a new warehouse management system design.

### Ownership and boundaries

| Surface | Owner and review boundary |
| --- | --- |
| Warehouse navigation, task screens, Home, choices, facility selection, settings and shared context | BOSS Warehouse and its templates/services |
| Stock movements, reservations, receipt/issue guards, tracking, quality, counts and transfer records | Mantle; business-rule corrections and tests belong there and must work without BOSS |
| Product360 and InventoryAvailability | Products' shared context with Warehouse physical tabs, facilities and stock-policy capabilities; no catalog, method, price or cost authority inferred from mounting |
| FacilityDetail, EquipmentDetail, QualityInspection and InspectionTemplates | Shared sources; exercise Warehouse's context and a representative other consumer if a shared correction is later made |
| Purchase receipt, bill matching and supplier returns | Purchasing owns the commercial order and return authorization (`purchasing.buyer` holds RETURN_AUTHORIZE); Warehouse owns physical handling; Accounting owns bill/payment and valuation consequences |
| Production issue/return/output and vendor custody | Manufacturing owns run/operation/method state; Warehouse owns its physical execution surfaces; Mantle owns the guarded movements; Accounting owns financial cost close |
| Customer RMA and settlement | Customer Service owns authorization and customer communication and receives its own returns in its own context (CS-21); Warehouse receives/inspects or ships returned goods; settlement is a financial grant (CS-22, ACC-28) |
| Chatter, RecordFiles, Today, palette and notifications | Existing Commons/shared services; inspect record identity, audience, evidence and return path without repeating a full Commons review |
| Label, printer, carrier, export and print behavior | Warehouse/Mantle provider contracts and framework output/rendering; use local substitutes and inspect actual artifacts |
| Insights record fallback and neighboring-app links | Bounded context/authority/return checks; no full Insights, PASS, Commerce or neighboring-app review |

Preserve record keys, routes, entered units, operation identity, dates, saved finds/columns and preferences. Record
unavoidable compatibility changes before implementing them. Facility selection (the `FacilityActive` preference) is a
convenience, not authorization; organization-owned stock in an inaccessible facility does not become visible because
the user knows its identifier. Financial read (ACCOUNTING_VIEW) remains separate from stock handling, including
exported bytes and shared details.

Do not build missing delivery trips, capacity planning, camera scanning, ZPL labels, external stock synchronization,
automatic waves or other deferred features to complete this review. Reconcile old deferrals against current sources:
other apps' production, purchasing and customer-service contexts and callers have since been built, while Warehouse
itself still has no SupplyPlanning mount. A stock operation's finance effect is a required handoff, not permission to
perform a complete Accounting review. Later execution uses disposable stock and synthetic carriers; real shipping
labels, carrier charges, customer/supplier mail and physical printer jobs are not review fixtures.

## 2. Review method and refinement criteria

The generic method is the [UI review guide](../../../../../docs/dev/UI-Review.md):
[preparing an isolated review](../../../../../docs/dev/UI-Review.md#prepare-an-isolated-review), activities and coverage,
[judging the result](../../../../../docs/dev/UI-Review.md#judge-the-result) (viewports, themes, keyboard, contrast,
terminal) and [recording, fixing and verifying](../../../../../docs/dev/UI-Review.md#record-fix-and-verify). Products
shows it executed: its [§2](ui-review-products.md#2-review-method-and-refinement-criteria) and
[execution setup dispositions](ui-review-products.md#execution-setup-dispositions). This section keeps only what is
specific to Warehouse.

### Environment and execution setup

- **Bootstrap.** Link Mantle and BOSS individually into an isolated runtime with copied configuration, a fresh
  disposable database, captured mail and local outputs; the guide's framework-only bootstrap leaves `component/` empty
  and is not enough. A linked component is source: uploads, issued files and exports land in the disposable runtime.
  Fixture specs beyond demo data run as focused acceptance runs (§5): here `WarehouseProductionFixtures` (acceptance;
  creates and releases a run of `DEMO_1_1` with frozen lines) and the `BOSS_P18_ORG` model in
  `test/Warehouse/WarehouseStandaloneLib.js`, which only WarehouseAccessWalk creates. Use the release binary and
  embedded Postgres; the coordinator starts further instances as needed (§7).
- **Prerequisites seen in executed reviews.** Embedded Postgres may need host (unsandboxed) shared memory, with every
  runner at one process-visibility level; delegated agents may have no browser tools; an isolated runtime may need
  webroot assets materialized before the terminal works; an automated tool-approval review may block a posting or
  send. Choose a free non-default port (another local Moqui may hold the defaults and is not stopped; Products used
  57820) and a hostname per browser identity. Record which apply in the first batch.
- **Shared runtime and concurrency.** The coordinating agent decides whether the five companion reviews share one
  runtime and manages the concurrent review agents (user decision, 2026-11-11). In a shared one it owns the lifecycle,
  no demo record is consumed by two reviews, and Retail-wide changes (PUR-27's purchasing policy rows, CS-21/22's
  `returnSettlementRequired`, MFG-06's production policy, MFG-17's forward repost flags) stay in their own batch and
  are restored, or isolated in another organization, before another review's dependent activity. In separate runtimes
  a review prepares the other side of a handoff as setup without reviewing it. Orderings: "Fixtures" below.
- **Carrier and labels.** Labels are bought only from the Mantle test carrier (`TEST_SHIPPING`, `TEST_CARRIER`
  Ground), which Retail allows by `ShippingTestGatewayAllowed=Y`; no real gateway is configured. Label bytes come
  from Ship's `labelPdf` transition (PDF) and from LabelSheet (Code 128 SVG in qvt/html/html-print, the code as text
  in the terminal).
- **Printer.** `BOSS_WH_LABEL_PRINTER` points at 127.0.0.1:9, so every print and printer test fails by design and
  offers Reprint. No successful-print fixture exists: point it at a local print sink (a temporary setting change, §7)
  and restore it afterwards, or record the success branch unverified.
- **Prints.** The other print documents are `renderMode=html-print` pages (browser print), not `/fop` PDFs; capture
  them with Chromium where a PDF is needed.
- **Posting extent.** Most Warehouse operations post stock and often ledger entries (receipt, issue, adjustment,
  scrap, ship, transfer, production); label buy/refund goes through the test carrier only, closed-period postings are
  refusal cases, and revaluation or cost repair is Accounting's, never Warehouse's. Postings and temporary setting
  changes are allowed (user decision, 2026-11-11); the coordinator sequences and restores them.

### Organizations, facilities and dates

- **Retail scope.** `ORG_ZIZI_RETAIL` owns `ZIRET_WH` (Mantle's base demo), `BOSS_WH_EAST` (second warehouse, the
  transfer destination), `BOSS_WH_ANNEX` (a building inside `ZIRET_WH`) and `BOSS_WH_VENDOR` (vendor custody,
  custodian ZiddlemanInc). Every seeded Warehouse user therefore has several facilities. A one-facility or
  no-facility user must be prepared (WarehouseAccess creates its own `warehouse.spec.noorg`).
- **Second organization under Retail.** `BOSS_WH_RETURNS` (Ziziwork Returns Center) rolls up to Retail, owns the demo
  RMA and settles returns separately (D11, `load#WarehouseReturnsDemo`). Retail's Warehouse users therefore belong to
  two organizations, and forms that create records must ask which one (the P14 New template fix).
- **Retail does not settle returns separately** (F321): a Retail RMA such as `BOSS_WH_RETURN` (ReturnRequested) is the
  RETURN_SETTLEMENT_OFF refusal case, not a receivable fixture.
- **Foreign facility.** `BOSS_PRD_WH` belongs to `ORG_ZIZI_SERVICES` (assetAllowOtherOwner) and holds Retail-owned
  `BOSS_PRD_FOREIGN_STOCK` and the Services sale `BOSS_WH_SHIP_OTHER`: the foreign-facility cases. No Warehouse user
  is seeded in another organization, so second-organization Warehouse users must be prepared on the
  WarehouseStandaloneLib model. Accounting's `BOSS_ACCT_ORG` is outside this hierarchy; do not combine its fixtures
  with Warehouse actors without preparing the intended organization and policy.
- **Dates.** Use the real clock in the review machine's current zone (America/Chicago on current machines; it will
  vary) and record both; no DST or second-zone checks (user decision, 2026-11-11). Demo dates are fixed and already
  past:
  - count `BOSS_WH_COUNT` planned 2026-10-15; picklist `BOSS_WH_LOAD` started 2026-10-20 (an overdue Today item);
  - `BOSS_WH_PO` due 2026-11-05; RMA entered 2026-10-25;
  - lots expired 2026-01-31 and 2026-03-31, the others expire 2027-12-31, so no near-expiry stock exists;
  - closed period `BOSS_WH_CLOSED_2024_06` and location `0199` closed in June; the kilogram history of `BOSS_WH_SHEET`
    runs through September 2026.
- **Date-relative copies.** Create near-expiry stock, due-today work and future-dated policy rows relative to the
  execution date. Postings use the user's book day (impl-warehouse wave 5 day-boundary fixes): check one backdated
  adjustment and one count post near local midnight, and dated policy precedence, in the current zone.

### Actors

Every seeded Warehouse user is a Retail agent in `BOSS_WAREHOUSE` (root, PRODUCT_CATALOG_VIEW) plus at most one
capability group; `Warehouse.js` maps each Mantle permission to a capability. Area entry is narrower than the root:
Inspection admits the inspect and quality-manager groups; Counts the count, count-review and adjust groups; Picking
the pick, pick-supervisor and move groups. Quick creates are NewReceipt (receive), NewTransfer (move), NewCount
(count) and NewStockRequest (every Warehouse user). No Warehouse group holds ACCOUNTING_VIEW.

| Role term in §4 | Username | Grants beyond the root | Refusal it supplies |
| --- | --- | --- | --- |
| reader | `warehouse.read` | none | every write; Inspection/Counts/Picking areas; NewReceipt |
| receiver | `warehouse.receive` | STOCK_RECEIVE | production output, moves |
| issuer | `warehouse.issue` | STOCK_ISSUE (transfer sending, supplier-return issue, production issue, unused return, output, subcontract output) | moves, receipts |
| mover | `warehouse.move` | STOCK_MOVE (moves, putaway, containers, repack, pick face, transfers, custody dispatch) | subcontract/production output, putaway rules |
| counter / count reviewer | `warehouse.count` / `warehouse.countreview` | STOCK_COUNT / STOCK_COUNT_REVIEW | the reviewer is refused NewCount and posting |
| adjuster | `warehouse.adjust` | STOCK_ADJUST (enters Counts to post) | lot expiry extension, review |
| inspector | `warehouse.inspect` | QUALITY_INSPECT | verify, dispose, templates |
| quality manager | `warehouse.quality` | QUALITY_VERIFY, QUALITY_DISPOSE, QUALITY_TEMPLATE_EDIT, LOT_EXPIRY_EXTEND; no QUALITY_INSPECT | recording readings |
| picker / pick supervisor | `warehouse.pick` / `warehouse.picksupervisor` | SHIPMENT_PICK / SHIPMENT_LOAD_EDIT (picklists, waves, assignments, outgoing shipments) | each other's actions |
| packer | `warehouse.pack` | SHIPMENT_PACK | labels, ship |
| shipper | `warehouse.ship`, `warehouse.shippingmanager` | SHIPMENT_SHIP only, the two identical | carrier setup (SHIPPING_CARRIER_EDIT) |
| planner / manager | `warehouse.planner` / `warehouse.manager` | STOCK_POLICY_PLAN / PLAN and MANAGE | the planner is refused count schedules and reservation repair |
| facility administrator | `warehouse.facility` | FACILITY_EDIT, STOCK_POLICY_PLAN, STOCK_POLICY_MANAGE | carrier setup, stock handling |
| Warehouse administrator | `warehouse.admin` | every Warehouse permission, FACILITY_ALL_ORGANIZATIONS, sole SHIPPING_CARRIER_EDIT; no ACCOUNTING_VIEW | self-verification (SELF_VERIFY); unsuitable as an isolation counterpart |
| dispatch, integration | `warehouse.dispatch`, `warehouse.integration` | none (groups without permissions; their features are deferred) | same as the reader |
| capability without root | `customerservice.agentwh` | Warehouse receive and inspect groups, no `BOSS_WAREHOUSE` | Warehouse root; positive in Customer Service's context (CS-21) |
| neighboring actors | `purchasing.buyer`, `purchasing.buyreceive`, `manufacturing.material`, `customerservice.returns`, `customerservice.returnsar`, `insights.warehouse` | buyer with RETURN_AUTHORIZE; buyer plus Warehouse receive; Manufacturing operate plus Warehouse issue/move; CS return authorizer; authorizer plus Accounting AR; Insights reader plus Warehouse root | to verify each actual grant before use |
| composed | prepare | a Warehouse user plus ACCOUNTING_VIEW (financial reader); a second-organization Warehouse user per needed capability | — |

Verify loaded memberships, permissions and organizations before interpreting a refusal. Pair each refusal with an
otherwise-valid success by a holder and name the grant the refused fixture lacks; a validation error is not
permission evidence.

### Fixtures

Prepare independent, consumable copies; inspect each demo record's current status and dates before using it.

| Fixture family | Starting evidence and variations |
| --- | --- |
| Facilities/locations | `ZIRET_WH`, `BOSS_WH_EAST`, `BOSS_WH_ANNEX`, `BOSS_WH_VENDOR`; receiving `0801`, staging `0701`, quarantine `0901`, morgue `0991`, dock `0601`, closed `0199`; forklift `BOSS_WH_FORKLIFT` |
| Physical identity | `BOSS_WH_LOTTED` (lots `BOSS_WH_LOT_A/B/C`), `BOSS_WH_SERIAL` (`BOSS_WH_SER_1–3`, serials `SCN-1001` onward); `BOSS_WH_LOT_AVAIL`, `_HOLD`, `_QUARANTINE`, `_MORGUE`, `_EAST`; colliding or ambiguous codes and long labels |
| Receipt/putaway | `BOSS_WH_PO` (sealant and serial lines), rule `BOSS_WH_PR_SEAL`, pick/bulk bins `01020301/01020302`; mixed accepted/rejected, over-receipt and two-step receiving |
| Counts/corrections | `BOSS_WH_COUNT` (blind, assigned to `warehouse.count`), schedule `BOSS_WH_CS_PICK`, `BOSS_WH_CLOSED_2024_06`; found stock, concurrent movement; zero, blank, skipped and fractional observations |
| Picking/packing | picklist `BOSS_WH_LOAD` (order `BOSS_WH_SO`, stock `BOSS_WH_PICK_STOCK`); `BOSS_WH_SHIP_PACK` / `BOSS_WH_SO_PACK`; kit `BOSS_WH_SHIP_KIT` / `BOSS_WH_SO_KIT` (`kitCostFromComponents` on ORG_ZIZI_CORP); cartons `BOSS_WH_BOX_S/M`; the pack invoice is final at pack, so a reopen needs an in-process copy |
| Shipping | `BOSS_WH_SHIP_SHIP` / `BOSS_WH_SO_SHIP` / `BOSS_WH_INV_SHIP` (in process), `BOSS_WH_LABEL_PRINTER`; failed printer, manual tracking, canceled/unknown label outcome |
| Repack | `BOSS_WH_SEAL_CASE` (12 per case), five cases `BOSS_WH_CASES` of lot C |
| Transfer/subcontract | `BOSS_WH_SHIP_TRANSFER` (`BOSS_WH_TRF_STOCK`), request `BOSS_WH_REQ`, `BOSS_WH_VENDOR_STOCK`, dispatch `BOSS_WH_SHIP_SUB`, service PO `BOSS_WH_SUB_PO`, run `BOSS_WH_RUN` / `BOSS_WH_RUN_OP` (no approved standard, so output is provisional) |
| Quality/returns | template `BOSS_WH_TMPL` (return context), draft inspection `BOSS_WH_INSP`; RMA `BOSS_WH_RMA` (RMA-4471) with `BOSS_WH_RMA_SHIP`; approved supplier return `BOSS_WH_SRET` with `BOSS_WH_SRET_SHIP` and disposed inspection `BOSS_WH_INSP_R`; refused Retail return `BOSS_WH_RETURN` |
| Reports | `BOSS_WH_SHEET` by kilogram (lot `BOSS_WH_LOT_SHEET`, shipments `BOSS_WH_SHIP_SHEET_IN/OUT`, scrap `BOSS_WH_SHEET_SCRAP`), incomplete historical opening, multiple units/currencies, scope-limited financial reader |

**Consumption.** Each listed record exists once and the existing walks consume most of them, so a live run on it is
also consumed. Sequences that share one record:

- `BOSS_WH_PO` is opened, received and finished across WH-10–12; WH-36's Purchasing handoff needs a fresh order.
- `BOSS_WH_COUNT` runs through WH-15–17 in order.
- `BOSS_WH_RUN` takes WH-30's subcontract output before WH-31's unused return (the WarehouseProductionWalk order),
  or WH-31 uses the `WarehouseProductionFixtures` run. The Manufacturing review records nothing on `BOSS_WH_RUN`,
  `BOSS_WH_SUB_PO` or `BOSS_WH_SHIP_SUB` (MFG-26 uses MFG-25's subcontract), but its Quantities, Changes and Costs
  acceptance walks read them in their demo state: if any is selected on a shared runtime, run it before WH-30.
- `BOSS_WH_RMA` (of `BOSS_WH_RETURNS`, which settles returns separately) is WH-26's alone; CS-21 receives the return
  CS-20 authorized. `BOSS_WH_RETURN` is WH-26's `RETURN_SETTLEMENT_OFF` case only while Retail keeps its default, so
  in a shared runtime WH-26 runs that branch before CS-21/22 set Retail's flag or after they restore it.
- `BOSS_WH_SRET` is already approved, so WH-27's create/submit/authorize branch needs a new disposed-to-supplier
  receipt; in a shared runtime PUR-24 authorizes that return between WH-27's request and its send-back.
- WH-19's substitution branch short-picks a shipment of Customer Service's `BOSS_CS_SO_PICK` (resolution Substitute;
  the shipment made by `create#OrderPartShipment`, as CustomerServiceOrderChangesWalk does), which CS-17 continues;
  in a separate runtime CS-17 prepares that short pick itself.
- Product `BOSS_WH_TRF` (asset `BOSS_WH_TRF_STOCK`, 30 at `ZIRET_WH`) feeds the transfer `BOSS_WH_SHIP_TRANSFER` (6),
  the request `BOSS_WH_REQ` (4), `BOSS_WH_RUN`'s material line (4) and the dispatch `BOSS_WH_SHIP_SUB` (2): check
  the quantities before scheduling WH-28, WH-29 and WH-30/31 together.

Include mixed-validity batch inputs (Relocate, generated lots, CSV counts, inspection reassignment), stale previews,
revoked permission and another actor changing the record between display and confirmation.

### Area criteria

Apply the guide's [judgment criteria](../../../../../docs/dev/UI-Review.md#judge-the-result) (1920×1080 light/dark,
1280px, 390px, keyboard, contrast; actual TUI; bounded Standard `/apps` check). Warehouse adds:

- **Handheld is its own variant.** `Handheld.xml` sets `density="handheld"` (48px controls, 18px text, no drawer, a
  reduced header; style-guide §8.2) and `server-static="qvt"`. Its seven aliases inherit that only under
  `Handheld/`, so compare each with its desk route narrowed to 390px rather than assume either. Check readable scan
  and quantity fields, first/next focus, feedback after each scan and one clear action. Whether the terminal and
  Standard honor the density is to verify at execution. Camera scanning is deferred; keyboard-wedge or typed input
  exercises the supported path.
- **Mode variants.** Twenty-one local screens and six templates carry `render-mode` sections (§3). PoolDetail has no
  html variant, so inspect Standard's actual fallback there.
- **Stock and return states.** Keep facility, location, owner, product, lot/serial/container, entered unit and stock
  unit visible at decisions; never add unlike quantities or currencies. Distinguish available, reserved, held,
  quarantine, in-transit, picked, packed, shipped and delivered, and a return's authorization, receipt, quality
  disposition and settlement. A state chip must not imply the next action has happened. Check the contrast of warning
  quantities, negative stock, expiry, quality-result and due chips, and changed-field fills in both themes; color alone
  cannot signal hold, shortage or failure.
- **Boards.** Receipts, Transfers, Picklists and Shipments boards and calendars are read-only. The Inspections board
  moves a card to reassign it (`moveInspection`, for `canAssign`) and refuses a status move with the reason: check its
  keyboard path and refusal message.
- **Scans and choices.** Scan the same code twice, an ambiguous code and a wrong-kind code; a scan identifies, it does
  not authorize or prove stock. Facility changes must not keep an incompatible record, location or selection.
  Selected labels survive outside a choice's first page.
- **Operation keys.** A repeated confirmation, double submit or lost response must answer the first result and never
  create a second movement, posting or carrier request. Named per-item failures (Relocate, `receiveLots`,
  `importCounts`, `reassignInspections`) must let independent items finish; an atomic container, transfer or
  production operation must not be presented as a partial batch.
- **Outputs.** CSV is offered on Assets, AssetDetail/Ledger, Containers, Lots, Movements, Traceability, Counts,
  CountReview, Inspections, CountVariance and OperationsHistory. XLSX is offered only on Movements,
  OperationsHistory and StockAtDate Places/History. Inspect the bytes. Keep a physical label reprint distinct from
  buying another label, and keep the recorded provider attempts when the outcome is unknown.
- **Shared panels.** A shipment, return, asset or work order that shares a visual panel must not share the wrong
  attachment identity or conversation.

### Waves

| Wave | Activities | Exit evidence for later execution |
| --- | --- | --- |
| W0 — Baseline and scope | WH-01–03; WH-35's positive/negative pairs established | Isolated fixtures, actor grants, facility boundaries, navigation and policy basis recorded; capability gaps named |
| W1 — Stock identity and handling | WH-04–09 | Traceable assets/lots/containers, moved and corrected quantities, reservations and operation retries |
| W2 — Receipt, quality and putaway | WH-10–14 | Purchase receipt/remainder handoff, tracked receipt, held stock disposition and physical destination |
| W3 — Counts and picking | WH-15–20 | Blind observations, reviewed/postable variances, picklist work, shortages and replenished pick faces |
| W4 — Pack and ship | WH-21–25 | Packages and kit issues, labels/outputs, shipment/invoice boundary and delivery evidence |
| W5 — Returns and production supply | WH-26–31 | RMA/supplier return boundaries, transfers, request allocations, vendor custody and production receipts |
| W6 — Reports and completion | WH-32–36 (WH-35 completed) | Quantity/value explanations, handheld/TUI continuations, artifacts, shared handoffs and candid coverage ledger |

Cross-wave continuations (record each open one in the originating ledger row):

- WH-11's held receipt → WH-13 inspection and WH-14 putaway; WH-26's quarantined boxes → WH-13's disposition path.
- WH-12's remainder/bill → Purchasing PUR-22; WH-19's `BOSS_CS_SO_PICK` short pick → Customer Service CS-17.
- WH-21's packed shipment → WH-24 when one copy is chained; WH-24's shipped packages → WH-25.
- WH-30 → WH-31 on one run; WH-07, 11, 14, 16, 19–21's handheld branches → WH-33.
- Every print/export → WH-34; every hidden or inherited route → WH-35; every handoff → WH-36.

Exercise relevant evidence, recovery and permission branches in each wave, not only in W6. Do not consume a shared
demo record in two concurrent walks. Corrections wait for the refinement pass (below); its verification follows
§5.

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

Paths below are relative to `/qapps/Warehouse`; Standard uses `/apps/Warehouse`. The source snapshot contains **89
Warehouse XML screen files including the root**, with **190 recursively reachable route instances** when physical
children and explicit local/shared mounts are enumerated: 89 local instances, seven additional Handheld aliases and
94 Shared-source instances. This is a source inventory, not a claim that every route appears in a menu or is admitted
to every role. Recompute after source changes and include any runtime screen extensions in execution reconciliation.

### Local routes and defaults

| Prefix | Local screens and section entry | Activities |
| --- | --- | --- |
| Root | `Warehouse` → `Home`; hidden `NewCount`, `InspectionCertificate` | WH-01, 13, 15, 34–35 |
| `Receiving` → `Receipts` | `Receipts`, `NewReceipt`, `Receive`, `Putaway`, `ReceiptDocument`, `PutawaySheet` | WH-10–14, 33–34 |
| `Inspection` → `Inspections` | `Inspections`, `TemplatePrint` | WH-13, 34–35 |
| `Inventory` → `Assets` | `Assets`, `AssetDetail`, `Movements`, `Lots`, `Containers`, `ContainerDetail`, `Traceability`, `Adjustments` | WH-04–08, 15 |
| `Inventory/AssetDetail` → `Ledger` | `Ledger`, `Reservations`, `Audit`, `Files`, `Notes` | WH-04–05, 08, 34 |
| `Counts` → `Counts` | `Counts`, `CountDetail`, `CountEntry`, `CountReview`, `CountSheet` | WH-15–17, 33–34 |
| `Transfers` → `Move` | `Move`, `Repack`, `Transfers`, `NewTransfer`, `TransferSheet`, `StockRequests`, `NewStockRequest` | WH-07, 09, 28–30 |
| `Picking` → `Picklists` | `Picklists`, `PicklistDetail`, `CreatePicklists`, `Pick`, `PickLocationMoves`, `PickSheet` | WH-18–20, 33–34 |
| `Shipping` → `Shipments` | `Shipments`, `Pack`, `Ship`, `PackageTracking`, `PackingSlip`, `LabelSheet`, `Manifest` | WH-18, 21–25, 33–34 |
| `Returns` → `Returns` | `Returns`, `ReturnSlip` | WH-26–27, 34 |
| `Locations` → `Facilities` | `Facilities`, `PutawayRules`, `BoxTypes`, `Carriers`, `Printers`, `PrinterTestPage` | WH-02, 14, 21, 23–24 |
| `Handheld` → `Home` | `Home` plus the aliases below | WH-01, 33 |
| `Reports` → `ReportIndex` | `ReportIndex`, `CountVariance`, `OperationsHistory` | WH-17, 32 |
| `Settings` → `Index` | `Index`, `StockPolicies`, `ReservationPolicies`, `AssetPools` | WH-03 |
| `Settings/StockPolicies` → `OperationPolicy` | `OperationPolicy`, `TrackingPolicy`, `ProductTrackingExceptions`, `PolicyPreview`, `CountSchedule` | WH-03, 15 |
| `Settings/ReservationPolicies` → `FacilityReservation` | `FacilityReservation`, `StoreReservation`, `ReservationCheck` | WH-03, 07, 19 |
| `Settings/AssetPools` → `PoolList` | `PoolList`, `PoolDetail` | WH-03 |
| `Orders` → `OrderDetail` | Hidden section; both children are shared mounts below | WH-18, 21, 24–25, 35 |

### Shared mounts, aliases and inherited children

A physical child or explicit mount is a route to inspect even when the context's tab list hides it. Review a valid
owning-app positive alongside direct-route and transition refusals. A removed tab is not the authorization boundary.
Where a nested shared tree appears twice, cover both consuming paths for context/return behavior without duplicating
all business-rule checks.

| Warehouse mount | Source and inherited surface | Activities / boundary |
| --- | --- | --- |
| `Receiving/ReceiptDetail` | `Shared/ShipmentDetail`; Warehouse purchase-receipt branch | WH-10–12, 35 |
| `Receiving/Supplier360` | `Shared/Supplier360` → `Overview`; children `Overview`, `Receiving`, `Documents`, `Conversation`, `Bills`, `Buying`, `Finance`, `PurchasingAgreements`, `PurchasingDropShip`, `PurchasingPerformance`, `PurchasingQuotes`, `PurchasingReceipts`, `PurchasingReturns`, `SubcontractOrders`; from other sources `Prices` → SupplierPrices and `InsightsRecord` | WH-10, 34–36; verify Warehouse's receiving/contact context and direct access to other contexts; SupplierPrices' condition excludes Warehouse |
| `Inventory/Availability` | `Shared/InventoryAvailability` → `Summary`; children `Summary`, `Locations`, `Movements`, `Reservations`, `Projection`, `Policy` | WH-04, 07, 20, 32, 35 |
| `Inventory/Product360` | `Shared/Product360` → `Summary`; Warehouse tab set `Summary`, `Identifiers`, `Dimensions`, `Stock`, `Replenishment`, `Documents`, `History` (`SharedContext.js` warehouseTabs) | WH-04–05, 34–36; master read-only, stock-policy actions by grants |
| `Inventory/Product360` other inherited routes | `Associations`, `Categories`, `Connections`, `Equipment`, `Features`, `KitComponents`, `PaidAccess`, `Parties`, `PurchaseHistory`; from other sources `Packaging`, `Prices`, `Suppliers`, `Costs`, `BOM`, `InsightsRecord` | WH-35 direct-route refusal: each carries a `product360Tabs` condition; tab omission does not make these sources disappear |
| `Inventory/Product360/Documents/Index` | `Shared/Documents` mounted inside `Documents` | WH-34–35; file identity and read scope |
| `Inventory/Product360/Stock` | Second mount of InventoryAvailability with its six children listed above | WH-04, 07, 32, 35–36; preserve product and facility through nested Back |
| `Inventory/Product360/BOM` | `Shared/BillOfMaterialsDetail` with `Overview`, `BillOfMaterialsExplosion`, `BillOfMaterialsCompare`, `WhereUsed`, `RoutingDetail` | WH-35 supporting scope inspection; Warehouse context does not grant method/cost capabilities |
| `Inventory/MaterialIssueReceipt` | `Shared/MaterialIssueReceipt`, `sourceType` `shipmentAssembly` or `productionRun` | WH-22, 31, 35; kit and run have different actions and valuation basis |
| `Locations/FacilityDetail` | `Shared/FacilityDetail` → `Overview`; `Overview`, `Locations`, `Children`, `Products`, `Policies`, `Schedules`, `BoxTypes`, `Printers`, `Files`, `Conversation`, `WorkCenter`, `InsightsRecord` | WH-02–03, 21, 23, 34–36; context determines offered tabs/actions |
| `Locations/EquipmentDetail` | `Shared/EquipmentDetail`, Warehouse equipment context (`template/WarehouseEquipment.xml`) | WH-02, 34–36; bounded operational read, book only with financial read |
| `Orders/OrderDetail` | `Shared/OrderDetail`, Warehouse fulfillment context | WH-18–19, 25, 35–36; inherited other-app transitions require their own authorization |
| `Orders/InvoiceDetail` | `Shared/InvoiceDetail`, Warehouse read/print context | WH-21, 24–25, 34–36; amounts by separate financial read |
| `Shipping/ShipmentDetail` | `Shared/ShipmentDetail`, Warehouse outbound branch | WH-18–25, 35 |
| `Transfers/TransferShipmentDetail` | `Shared/ShipmentDetail`, transfer branch | WH-28–29, 35 |
| `Transfers/SubcontractShipmentDetail` | Same source, subcontract custody and Output receipt branch | WH-30, 35–36 |
| `Transfers/RequestDetail` | `Shared/RequestDetail`, stock-request branch | WH-29, 34–36; Purchasing, Projects, Customer Service and Commerce transitions also exist in the shared source |
| `Returns/ReturnDetail` | `Shared/ReturnDetail`, Warehouse physical handling branch | WH-26–27, 34–36; authorization and settlement remain other capabilities |
| `Returns/ReturnReceipt`, `Returns/SupplierReturnShipment` | `Shared/ShipmentDetail`, customer-return and supplier-return branches | WH-26–27, 35–36 |
| `QualityInspection` | `Shared/QualityInspection`, hidden root read/inspection task (F195) | WH-13, 26–27, 30–31, 35 |
| `Inspection/InspectionTemplates` | `Shared/InspectionTemplates` | WH-13, 35 |
| `Reports/StockAtDate` | `Shared/StockAtDate` → `Places`; `Places`, `History` | WH-32, 35–36 |
| `Reports/InventoryValuation` | `Shared/InventoryValuation`, Warehouse branch (`get#ValuationScope`, `canRevalue` false) | WH-32, 35–36; no Warehouse revaluation/cost repair authority |
| `Chatter`, `Chatter/ChatterTui` | Shared Chatter browser surface and explicit terminal child | WH-34–35; record-linked discussions and activities |
| `RecordFiles`, `RecordFiles/RecordFilesTui` | Shared file browser surface and terminal child | WH-34–35; uploads, versions, picker and download |
| `Handheld/Move`, `/Receive`, `/Putaway` | Local aliases of `Transfers/Move`, `Receiving/Receive`, `Receiving/Putaway` | WH-07, 11, 14, 33 |
| `Handheld/Pick`, `/Pack`, `/Count`, `/PickFace` | Local aliases of `Picking/Pick`, `Shipping/Pack`, `Counts/CountEntry`, `Picking/PickLocationMoves`, outside the Picking/Counts area groups | WH-16, 19–21, 33, 35 |

Hidden InsightsRecord routes are source-backed fallback surfaces, not a new Warehouse dataset or universal permission
to view a record. Inspect their current context and admitted-data behavior with the corresponding app grants (for
example `insights.warehouse`) in WH-35–36. Keep unavailable/foreign-record behavior distinct from an empty permitted
record.

### Dialogs, helpers, modes and outputs

| Surface family | Explicit inspection / activity |
| --- | --- |
| Root shell and quick creates | WH-01, 10, 15, 28–29: facility picker, Home lookup, palette/record links, Today, `g q`, quick creates NewReceipt/NewCount/NewTransfer/NewStockRequest; cancel/reopen and stale IDs. Notification topics: WarehouseReceiptException (WH-12), WarehouseCountsDue (WH-15), WarehouseShortPick to pick supervisors (WH-19), QualityInspectionDecision (WH-13) |
| Facility/stock dialogs | WH-02–09: create facility/location, close/reopen location, EditAssetDialog, NewLot/CorrectLot, NewContainer/AddAsset/MoveContainer, selected-stock Relocate, count request, adjustment preview/post, ScrapDialog, repack |
| Receipt/quality/putaway helpers | WH-10–14: NewReceiptDialog, line selection, `receiveLots` generated lot/serial preview, AdHocReceiptDialog, `closeRemainder` (close or backorder), `receiveAll`, inspection assignment/board move/bulk reassignment, readings, submit/verify/dispose/reinspect/cancel, template versions, NewRuleDialog and rule test |
| Count dialogs and downloads | WH-15–17: NewCount/EditCount/Cancel, FoundStockDialog, ImportCountsDialog and `importCountsResult`, ReviewCount/recount/`resolveConflict`, PostCountDialog; blank versus zero |
| Pick and package dialogs | WH-18–22: NewOutgoingDialog, NewPicklist/EditPicklist/AddToPicklist/Bin/AssignPerson/AssignEquipment/CompletePicklist, create wave, Short/PutBack/FinishPick, AddPackage/edit/move contents/reopen, CompletePack and kit component packing |
| Shipping setup and task helpers | WH-23–25: AddMethod/BindGateway, NewBoxType/NewCarrierCode, facility printer and test, address validation/rates, request/refund labels and return labels, ManualCarrierDialog, print/reprint, ShipConfirmDialog, TrackingFindDialog and delivery recording |
| Return/transfer/request helpers | WH-26–31: NewReturnDialog (from an order for a receiver, from a disposed receipt for the quality manager), add item, request, create shipment, receive return, issue/ship supplier return; NewTransfer/send/ship/receive; NewStockRequest, items, approval and allocation; subcontract output and production issue/return/receive |
| Policy dialogs | WH-03, 15: TrackingPolicyDialog, NewException, effective operation/reservation policy, StoreReservationDialog, NewPool/EditPool/AddParty/AddStore, AddCountScheduleDialog, RepairReservationsDialog |
| Inline custom render modes | Counts, CountDetail, CountReview (WH-15–17); Inspections (WH-13); Assets, AssetDetail, Lots (WH-04–05); ContainerDetail (WH-06); Facilities (WH-02); PutawayRules (WH-14); BoxTypes (WH-21, 23); Picklists (WH-18); Receipts (WH-10); Putaway (WH-14); Returns (WH-26–27); PoolDetail, qvt/tui only (WH-03); Shipments (WH-18); LabelSheet with html-print (WH-24); Move (WH-07); Transfers (WH-28); StockRequests (WH-29) |
| Template custom modes | WarehouseEquipment (WH-02), WarehouseReceiptDetail (WH-10–12), WarehouseCountParts (WH-15–17), WarehouseReturnDetail (WH-26–27), WarehouseTransferDetail (WH-28, 30) and WarehouseRequestDetail (WH-29); inherited shared sources have their own qvt/tui behavior |
| Print documents | WH-10–36: ReceiptDocument, PutawaySheet, InspectionCertificate, TemplatePrint, CountSheet, PickSheet, PackingSlip, LabelSheet, Manifest, ReturnSlip, TransferSheet, PrinterTestPage (`renderMode=html-print` documents) and permitted invoice print |
| Non-page output paths | WH-04, 16, 24–25, 32, 34–35: `importCountsResult` row-result CSV, Ship `labelPdf`, the CSV lists in §2, CSV/XLSX on `Inventory/Movements`, `Reports/OperationsHistory` and `Reports/StockAtDate/Places` and `/History`, printer/provider evidence and file download/version links |
| Inherited price export variants | WH-35 refusal only: `Inventory/Product360/Prices` → Shared/Prices, `Inventory/Product360/Suppliers` and `Receiving/Supplier360/Prices` → Shared/SupplierPrices declare CSV/XLSX, and their conditions exclude Warehouse. Check the Warehouse route and its csv/xlsx renders refuse; the owning-app positive is Products' (PRD-10/11) |

Warehouse has no local `.qvue` or `.tui.json` file in this snapshot. Its variants are the `render-mode` sections
above, the handheld density, shared browser/terminal widgets, and 14 `server-static` screens (Handheld, NewCount,
NewReceipt, NewTransfer, NewStockRequest, CountSheet, Manifest, PrinterTestPage, Settings and others) whose loaded
rendering should be checked rather than inferred. Supporting mode inspection does not multiply every activity by every
viewport.

### Design-to-code reconciliation

| Earlier proposal or historical wording | Current treatment |
| --- | --- |
| Warehouse implementation's initial seven placeholders | Historical starting state; the full current tree and P0–P18 implementation supersede it |
| SupplyPlanning and transfer conversion listed as later | `Shared/SupplyPlanning` is built and mounted under Manufacturing/Planning and Purchasing/Replenishment. It shows transfer suggestions but leaves their conversion to a Warehouse mount that does not exist (impl-warehouse §7). Review transfers from NewTransfer and stock-request allocation only; do not invent a Warehouse menu item or treat transfer conversion as built |
| Other-app contexts/callers in impl-warehouse §7 | Since built: Purchasing Receiving (ShipmentDetail with `ensure#PurchaseReceipt`, QualityInspection, InspectionTemplates) and `apply#PurchaseRevision`; Manufacturing FacilityDetail (WorkCenters), MaterialIssueReceipt (WorkOrderDetail), QualityInspection/InspectionTemplates and the Components stage link into `Warehouse/Transfers/Move`; Customer Service StockAtDate (Availability), ReturnDetail/QualityInspection, `authorize#Return`, `apply#OrderChange` (OrderChangeDetail) and `request#ReturnLabel`. Customer Service has no ReturnReceipt mount; it receives on ReturnDetail (`Returns.js` `canReceive`: `STOCK_RECEIVE`, a separately settling organization and an open return shipment), which CS-21 exercises |
| TraceabilityGraph, DeliveryTrips/DeliveryTripDetail, Capacity, ExternalStockSync, automatic waves | Absent local screens (design `later`); separate future work. Traceability's current bounded tree and manual picklist/wave task remain in scope |
| Camera scan, ZPL, handheld return receipt and Handheld/Repack | Not inferred from typed scan, PDF labels, mobile return layout or desktop Repack; record the actual supported route/device |
| Supplier return partial shipment (F324), return putaway after quality release, kit unused-component return/breakdown (F283) | §7 deferrals: a supplier return ships whole; a released return is available where it was inspected. Check current guards before attempting; do not promise these from neighboring production-return support |
| Stock/financial/report history | Unknown provenance and incomplete historical opening are explicit results; values and revaluation actions are independently guarded. Source/render success cannot certify completeness |
| Old spec names, locations and historical “passed” totals | Use current files and registrations in §5. Historical WarehouseShell/WarehouseIsolationWalk/route-fixture statements are not proof that a same-named current spec exists (the access walk is now WarehouseAccessWalk) |

## 4. End-to-end activities

The §6 ledger holds status and evidence. Use visible controls and inspect intermediate states, confirmations,
persisted results and a second identity where relevant; a render, HTTP 200 or service-only mutation does not complete
an activity. Browser means Material light/dark; TUI means actual supported terminal operations; Standard means the
brief functional/output/fallback check. Record unattempted modes and recovery branches in §6. Role terms are §2's
actor table.

### WH-01 — Start a warehouse workday in the right facility

- **Actor/start:** reader and narrow operators, with several facilities (every seeded user), one and none (prepared);
  populated and empty queues.
- **Objective/steps:** open Warehouse → select facility → inspect operation cards and Your work → follow a count,
  inspection or picklist assignment → detail/task → Back. Scan or type an asset, serial, lot, shipment and ambiguous
  code in Home; use palette, Today, record links and `g q`. Open/cancel/reopen permitted quick creates. Save and reset
  a representative find and move through offered list, board/calendar, columns, sort and pagination.
- **Expected:** current facility and queue basis are visible; destinations retain meaningful scope; inaccessible work
  is omitted; uncomputed queue measures say unavailable; new forms do not inherit another record's identifier; the
  reader sees no quick create it cannot use (NewStockRequest is open to every Warehouse user).
- **Recovery:** no matches, lost facility access, failed independent queue source, deleted recent record, wrong-kind
  code and facility preference no longer in scope. Read-only users still get useful navigation.
- **Screens/modes:** Home, section defaults, shell, quick creates and Handheld/Home; browser/TUI/Standard,
  narrow/keyboard samples; continue individual records in their owning activities.

### WH-02 — Maintain a facility and inspect its equipment

- **Actor/start:** facility administrator and reader; facility tree, open/closed locations, stocked bin and empty bin.
- **Objective/steps:** Locations → Facilities list/tree → create a disposable facility → FacilityDetail → Overview,
  Locations and Children → add/edit locations and hierarchy → close an empty location and inspect its history.
  Read Products, Policies, Schedules, Box types and Printers, and follow `BOSS_WH_FORKLIFT` to EquipmentDetail's
  operator, maintenance, files and conversation. Return through the originating facility.
- **Expected:** hierarchy, owner and effective status stay clear; readers see the same record with fewer actions;
  occupied locations cannot be closed as if empty; equipment is distinguishable from ordinary inventory stock.
- **Recovery:** inaccessible parent, duplicate/invalid location, attempted close with stock (LOCATION_IN_USE),
  expired facility/location, unavailable equipment and canceled edit. Hidden WorkCenter/InsightsRecord routes get
  bounded scope checks.
- **Screens/modes:** Locations/Facilities, FacilityDetail and all inherited tabs, EquipmentDetail; browser/TUI/Standard,
  phone tree/detail and keyboard navigation; outputs and evidence continue in WH-23/34.

### WH-03 — Explain and change stock policies without losing their basis

- **Actor/start:** planner, manager and reader; organization/facility defaults, store override and product exception.
- **Objective/steps:** Settings → Stock policies → inspect effective operation/tracking policy and source → change an
  allowed dated row → PolicyPreview → compare organization/facility/product precedence. Open ReservationPolicies,
  inspect facility timing and store override, preview ReservationCheck and confirm a permitted repair (manager). Create
  a pool, add/change its party/store members, and return to a stock consumer using the resulting policy.
- **Expected:** the source/effective date of a decision is readable; edits preserve history; a store override applies
  only to its orders; repair names its affected work and outcome; pool membership stays in the user's organizations.
- **Recovery:** overlapping/expired rows, selected record outside first choice page, unsupported choice, stale repair,
  missing facility, canceled change, planner refused the repair (STOCK_POLICY_MANAGE) and reader/direct-write
  refusal. Settings alone do not grant stock handling.
- **Screens/modes:** Settings/Index, all StockPolicies/ReservationPolicies/AssetPools children, FacilityDetail/Policies;
  browser/TUI/Standard, keyboard and wide-policy layout samples; count schedules continue in WH-15.

### WH-04 — Find physical stock and explain an asset's balance

- **Actor/start:** physical reader, adjuster and separately composed financial reader; stock across statuses/facilities.
- **Objective/steps:** Inventory → Assets → filter/group by product, lot and place → AssetDetail/Ledger → follow its
  receipt and issuance → Reservations/Audit → Back. Open Product360's Warehouse tabs and Stock/Availability Summary,
  Locations, Reservations, Movements, Projection and Policy; vary the authorized facility and inspect units. Export
  Inventory/Movements as CSV and XLSX; inspect the files against the active filters, columns and permitted amounts.
- **Expected:** available/reserved/held/quarantine/in-transit meanings agree across lists and detail; restricted cost
  never appears in ordinary responses or exports; the physical Product360 context offers no master/price/method edits.
- **Recovery:** zero/missing stock, unavailable product, changed facility, empty projection, incomplete source history
  and a saved find whose selected value is no longer permitted. The adjuster edits only an asset's name and comments.
- **Screens/modes:** Assets, AssetDetail and five tabs, Product360, both Availability mounts and six children;
  browser/TUI/Standard, phone columns and wide/long names; WH-35 checks inherited non-Warehouse routes.

### WH-05 — Trace a lot or serial and correct its metadata deliberately

- **Actor/start:** reader, receiver and quality manager; purchased/sold lot, expired lot, serial and unknown provenance.
- **Objective/steps:** Lots → find by printed lot number → asset buckets → Traceability (tree and list) → expand
  upstream/downstream occurrences → open receipt, issue or source document → Back. Create a lot as receiver; correct
  lot metadata and extend expiry with a reason as the quality manager; inspect correction history and expiry list.
- **Expected:** repeated nodes/cycles are bounded and understandable; each occurrence links to the right record;
  unknown provenance is explicit; quantities and identities survive a metadata correction; expiry authority
  (LOT_EXPIRY_EXTEND) is separate.
- **Recovery:** no original receipt, restricted neighbor node, excessively deep trace, ambiguous scan, unavailable lot,
  invalid expiry and the adjuster's refused extension. Restricted nodes must not expose foreign names or values.
- **Screens/modes:** Lots, Traceability, Movements, AssetDetail/Audit, Product360/Identifiers and History;
  browser/TUI/Standard, keyboard tree and phone samples; export evidence in WH-34.

### WH-06 — Put stock in a container and move the whole container

- **Actor/start:** mover and reader; a new empty container, two contents, stock elsewhere and an incompatible
  destination (no container is seeded).
- **Objective/steps:** Containers → New container → ContainerDetail → Put stock in → Take out part → reattach → Move
  container → inspect every content's new place and ledger. Scan container from Home or Move and return to its detail.
- **Expected:** container identity, place and contents remain coherent; adding stock requires the intended location;
  whole-container movement has a clear count/result and preserved ownership, tracking and restrictions.
- **Recovery:** stock at another location, capacity/closed destination, held/quarantined content, another owner's
  container, stale content list, canceled Move and repeat submit. An all-or-nothing container operation must not be
  described as an independent batch.
- **Screens/modes:** Containers, ContainerDetail, Move, Assets and Movements; browser/TUI/Standard,
  repeated row-dialog identities, phone controls and scanner focus.

### WH-07 — Move individual stock or relocate a mixed selection

- **Actor/start:** mover; available, reserved and quarantined stock, open and closed bins, one deliberately invalid row.
- **Objective/steps:** Transfers → Move → scan source asset/location → select destination → enter quantity/unit →
  review warnings → move → inspect recent movement and source/destination balances. From Assets or Availability select
  several records → Relocate → include one invalid item → inspect each result and retry only unresolved work. Arrival
  from a work order's Components stage (`workEffortId`) is MFG-09's.
- **Expected:** partial moves preserve tracking/owner/cost basis; reserved/held stock constraints are explained;
  repeated operation returns its first result; independent relocation failures name the row while others proceed.
- **Recovery:** wrong facility/kind scan, quantity above free stock, quarantined stock aimed at a pick bin (HELD_STOCK),
  closed bin, concurrent reservation, stale page, lost response and canceled confirmation. Do not imply a move releases
  quality hold.
- **Screens/modes:** Move and Handheld/Move, Assets, Availability/Locations, ContainerDetail, Movements;
  browser/TUI/Standard, keyboard wedge, narrow and focus-after-success/refusal.

### WH-08 — Post a justified adjustment or scrap with an audit trail

- **Actor/start:** adjuster, financial reader and reader; one counted bucket, expired stock and open/locked dates.
- **Objective/steps:** AssetDetail or Inventory/Adjustments → preview a counted quantity → inspect difference/reason
  and permitted value → confirm post → inspect ledger/audit and remaining reservations. From the Lots expiry list or
  Adjustments choose Scrap → review quantity, destination and reason → post → inspect morgue/disposition and financial
  handoff.
- **Expected:** count-to-quantity adjustment and scrap are distinct operations; reasons and dates persist; operation
  retry does not repost; restricted value is omitted; refused posting leaves balances and previous history intact.
- **Recovery:** negative/invalid quantity, stale preview after a second movement, closed fiscal date
  (`BOSS_WH_CLOSED_2024_06`, PERIOD_CLOSED), missing mapping, insufficient authority and reserved stock after a
  decrease. A reduction leaves reservations as they were (F160, deferred re-reservation): record it as a known limit.
- **Screens/modes:** Adjustments, Lots, AssetDetail/Ledger/Audit, Movements and permitted Accounting source link;
  browser/TUI/Standard, confirmation/keyboard; no historical repair is implied.

### WH-09 — Repack between supported packaging units

- **Actor/start:** mover and financial reader; `BOSS_WH_SEAL_CASE` cases of lot C with expiry.
- **Objective/steps:** Transfers → Repack → scan stock → select unpack/pack direction and target level → review factor
  and quantity → confirm → inspect source/result stock, lot and ledger; return to the physical product identifiers.
- **Expected:** exact factor and entered/stock units are visible; ownership and tracking carry forward; value nets
  across the supported repack; repeating the same operation does not duplicate stock.
- **Recovery:** incompatible product/pack, fractional result that violates serial rules, missing conversion, held stock,
  shortage, stale source and canceled confirmation. Do not mistake kit breakdown for packaging repack.
- **Screens/modes:** Repack, Product360/Identifiers/Dimensions, Assets and Movements; browser/TUI/Standard,
  phone/keyboard samples. There is no Handheld/Repack route (§7 deferral); the desk task is the phone path.

### WH-10 — Prepare a purchase receipt and follow supplier evidence

- **Actor/start:** receiver and reader; approved purchase part, a second already-open receipt and supplier in scope;
  `purchasing.buyer` for the Purchasing side.
- **Objective/steps:** Receiving → Receipts → New receipt → select order part/facility → Open receipt → inspect
  ReceiptDetail and expected lines → repeat New receipt for the same part → confirm it reopens the existing receipt.
  Follow Supplier360's receiving context and receipt/rejection evidence, then return. Repeat entry from the quick
  create. On a fresh order, let the buyer prepare the receipt in Purchasing/Receiving (`ensure#PurchaseReceipt`,
  PUR-19's side), then confirm the receiver's New receipt opens that same receipt.
- **Expected:** one open receipt is reused across apps; source order/part, facility, due quantities and unit basis are
  clear; commercial purchasing authority is not inferred from Warehouse root access; supplier prices stay absent.
- **Recovery:** completed/canceled/non-purchase order (a placed service PO such as `BOSS_WH_SUB_PO` offers no
  receipt), nothing due, selected part outside first choice page, foreign supplier/facility, the reader refused
  NewReceipt and another actor creating the receipt first. New never means duplicate receipt.
- **Screens/modes:** Receipts, NewReceipt, ReceiptDetail, Supplier360/Overview/Receiving and permitted supporting tabs;
  browser/TUI/Standard, find dialog, board/calendar (read-only), keyboard and phone; receipt output in WH-12/34.

### WH-11 — Receive tracked goods, rejects or an ad-hoc delivery

- **Actor/start:** receiver; lot-tracked, serialized, plain and alternative-unit lines; rejected quantity with reason.
- **Objective/steps:** ReceiptDetail → Receive → choose/scan line → enter accepted/rejected quantities and unit →
  lot/expiry/serials and destination → receive → inspect receipt history and stock state. Preview generated
  serials/lots, inspect duplicates and use a valid selection. Receive an authorized ad-hoc stocked product with
  owner/reason, then inspect its stated cost source without exposing cost to the ordinary receiver.
- **Expected:** entered and stock units remain distinguishable; one serial per accepted unit and required lot/reason
  are enforced; accepted/rejected receipts explain their stock effect; repeated operation answers the first result.
- **Recovery:** wrong product, over-receipt, duplicate/missing serial, invalid conversion, expired/closed destination,
  refused supplied cost and a mixed generated range. Inspect each returned row rather than assume all lots succeeded.
- **Screens/modes:** Receive, Handheld/Receive, ReceiptDetail, Assets and QualityInspection where created;
  browser/TUI/Standard, scanner/keyboard, 390px and focus after success/error.

### WH-12 — Finish a short receipt or backorder its remainder

- **Actor/start:** receiver and buyer; partial receipt, untouched tracked line, distinct open/backorder copies.
- **Objective/steps:** ReceiptDetail/Receive → inspect accepted/rejected/due → Finish → choose close or backorder with
  reason → confirm → inspect old/new receipt, order remainder and the WarehouseReceiptException notice. On separate
  plain-stock data use Receive all as expected and inspect its confirmation, delivered state and permitted
  self-billing/match consequence.
- **Expected:** close/backorder affect only the intended remainder; no received quantity disappears; the order and
  receipt states agree; receive-all refuses tracking it cannot obtain; self-billing depends on the supplier policy.
- **Recovery:** missing reason, nothing due, concurrent revision/receipt (a purchase revision waits for the receive,
  F175), tracked line in receive-all, canceled finish, closed date and lost response. The downstream Retail bill
  match is PUR-22's (`purchasing.buymatch`), not the receiver's.
- **Screens/modes:** Receive, ReceiptDetail, Receipts, ReceiptDocument, bounded Purchasing order/receipt and Accounting
  bill/match handoff; browser/TUI/Standard and the actual printed document.

### WH-13 — Inspect held stock and dispose it with the right authority

- **Actor/start:** inspector, quality manager, Warehouse administrator (self-verification refusal) and reader; draft
  template, published `BOSS_WH_TMPL`, draft inspection `BOSS_WH_INSP` and a quarantined receipt.
- **Objective/steps:** Inspection → Inspections → assign, bulk-reassign and move a board card to another inspector →
  QualityInspection → record required readings and evidence → submit → verification by the quality manager → dispose
  accepted portion and scrap/return the rest → inspect stock, source receipt and remaining held quantity. Reinspect a
  supported case; create/change a template and inspect the new version's effect on a later inspection, then print
  certificate/template.
- **Expected:** sample and inspected quantities, units/tolerances, result, verification and disposition are separate;
  the inspector cannot verify by changing the URL, and the administrator cannot verify its own inspection
  (SELF_VERIFY, an open policy question in impl-warehouse §5); published characteristics retain history; release is
  clear; a board status move is refused with its reason and bulk reassignment names each result.
- **Recovery:** missing/out-of-range reading, incomplete sample, stale assignment, partial disposition, canceled
  inspection, another organization's source and reader opening hidden root detail without Inspection-area access.
- **Screens/modes:** Inspections (list and board), QualityInspection, InspectionTemplates, InspectionCertificate,
  TemplatePrint, receipt/return/production sources; browser/TUI/Standard, board keyboard path, phone and outputs.

### WH-14 — Put received stock away and explain the destination

- **Actor/start:** mover, facility administrator and reader; receiving-held stock, a full default bin and matching rule.
- **Objective/steps:** Receiving → Putaway → scan/filter stock → inspect suggested destination and rejected alternatives
  → accept suggestion → verify held stock's permitted release and balance. Try an allowed alternative with reason.
  Locations → PutawayRules → test a rule → add/change/end a dated rule (facility administrator) → return to the queue
  and inspect its effect.
- **Expected:** the operator can explain why a bin was suggested or refused; capacity and product constraints are
  visible; successful putaway removes the right queued quantity and returns scan focus; retry moves nothing twice.
- **Recovery:** no fitting location, full/closed destination, unsupported stock state, changed capacity, missing
  override reason, the mover refused rule edits and lost permission. A customer-return inspection release is not
  silently a putaway workflow.
- **Screens/modes:** Putaway, Handheld/Putaway, PutawaySheet, PutawayRules, AssetDetail and facility locations;
  browser/TUI/Standard, phone/scan/keyboard and actual sheet output.

### WH-15 — Plan a count from due work or selected stock

- **Actor/start:** counter, manager and reader; due schedule `BOSS_WH_CS_PICK`, selected asset set and a fresh
  empty-bin count.
- **Objective/steps:** Counts → Due saved find → New count → choose scope, assignee and blind setting → CountDetail →
  Edit/cancel a draft copy → Start intended count. Repeat creation from Assets' Request a count and root NewCount
  quick create. As manager change/end a count schedule row and inspect the resulting due-work explanation and the
  WarehouseCountsDue notice.
- **Expected:** scope and snapshot point are clear; NewCount uses count authority, not review-only area access;
  due work reaches the right actor through Home/Today; creating a count does not post an adjustment.
- **Recovery:** no matching stock, expired schedule, invalid scope/assignee, already-started count, canceled dialog,
  the count reviewer refused NewCount and the planner refused a schedule change (STOCK_POLICY_MANAGE). Separate a
  legitimate empty-bin count from no scope.
- **Screens/modes:** Counts, CountDetail, NewCount, CountSheet, Assets, StockPolicies/CountSchedule, Home;
  browser/TUI/Standard, quick-create keyboard and print-sheet confidentiality.

### WH-16 — Enter a blind count and recover from row import errors

- **Actor/start:** counter; started blind count with two lines, empty bin, found stock and mixed-validity CSV.
- **Objective/steps:** CountDetail → CountEntry → scan location/product/asset → record quantity → distinguish zero,
  blank and skip with reason → add found stock → save several desk rows → import counts → inspect named row failures
  and download result → correct/retry unresolved rows → submit. Repeat representative entries on Handheld/Count.
- **Expected:** observations do not adjust stock; blind expected quantities are withheld from count screens, scans,
  print and exports; operation retry is one observation; successful independent rows survive an invalid row.
- **Recovery:** duplicate observation, wrong asset/location, unknown CSV column/value, canceled upload, stale count,
  revoked permission, concurrent physical movement and navigation away from an unsaved row. Inventory and Home still
  show on-hand to counters: an open product question (impl-warehouse §5, P10 A1), not a new finding.
- **Screens/modes:** CountEntry, Handheld/Count, importCountsResult, CountDetail and CountSheet;
  browser/TUI/Standard with explicit upload/download delegation where terminal needs it; 390px one-line navigation.

### WH-17 — Review count variance, recount conflicts and post approved lines

- **Actor/start:** count reviewer and separate adjuster; submitted count with variance, held line and intervening
  movement.
- **Objective/steps:** Counts → CountReview → inspect expected/observed/variance basis → review or request recount →
  resolve a supported conflict → inspect returned observations → approve intended lines → adjuster previews date and
  confirms Post approved lines → inspect status, resulting ledger and CountVariance report.
- **Expected:** reviewer/adjuster responsibilities remain distinct; approved selection and posting date are named;
  conflict handling is explicit; posted lines cannot be counted twice through retry; report links explain the variance.
- **Recovery:** unresolved conflict, stale review, partly approved count, closed posting period (refused whole),
  canceled post and reviewer/counter direct-write refusal. Refused dependent posting must not leave a half-applied
  count.
- **Screens/modes:** CountDetail, CountReview, CountEntry, CountVariance, Movements and permitted ledger handoff;
  browser/TUI/Standard, repeated Resolve dialogs, keyboard and actual report export.

### WH-18 — Prepare outbound work and organize a picklist

- **Actor/start:** pick supervisor, picker and reader; approved order with reservations and separate eligible
  shipments; `BOSS_WH_LOAD`.
- **Objective/steps:** hidden OrderDetail through a legitimate order link → inspect fulfillment → create permitted
  outgoing shipment (supervisor) → Shipping/Shipments → Picking/CreatePicklists → choose eligible work and create wave
  → Picklists → PicklistDetail → add/remove shipment membership, set bin and assign person/equipment → inspect queued
  work.
- **Expected:** order part, shipment and load identities stay visible; selected quantities and reservations agree;
  manual wave creation is distinct from deferred automatic waves and reserves nothing; assignments do not create stock
  authority.
- **Recovery:** held order (no shipment), canceled order, no reservation, no eligible work, stale selected shipment,
  invalid assignment, foreign facility, the picker refused composition (SHIPMENT_LOAD_EDIT) and canceled membership
  change. Read-only board/calendar must not suggest unsupported dragging.
- **Screens/modes:** Orders/OrderDetail, Shipments, ShipmentDetail, Picklists, CreatePicklists, PicklistDetail,
  PickSheet and Home/Today; browser/TUI/Standard, long membership lists, keyboard and print.

### WH-19 — Pick, report a shortage and put stock back

- **Actor/start:** picker and pick supervisor (notice); picklist `BOSS_WH_LOAD` with reserved stock and a short
  location, and a shipment of Customer Service's `BOSS_CS_SO_PICK` for the substitution branch (§2).
- **Objective/steps:** PicklistDetail → Pick → select/scan work and source → pick part → Short with reason → inspect
  short-pick result/recount work, unchanged on-hand and the WarehouseShortPick notice → Put back a picked quantity →
  finish the permitted work. On `BOSS_CS_SO_PICK` short-pick one filter with resolution Substitute and open the order
  link once; the substitution is CS-17's.
- **Expected:** picked, short, put-back and remaining quantities are distinct; stock is not decremented merely because
  a shortage was reported; next scan focus is stable; source reservation and any customer change remain traceable.
- **Recovery:** wrong location/product (PRODUCT_MISMATCH), held/expired stock, quantity above reservation,
  already-picked source, canceled finish and lost response. A customer substitution requires its guarded order-change
  flow, not a Warehouse edit.
- **Screens/modes:** Pick, Handheld/Pick, PicklistDetail, ShipmentDetail, OrderDetail and permitted Customer Service
  handoff; browser/TUI/Standard, 390px scan/keyboard and one-primary-action checks.

### WH-20 — Replenish the pick face without confusing movement and allocation

- **Actor/start:** mover (admitted to Picking for this task); facility with a short pick face, eligible bulk stock and
  unavailable/held alternatives.
- **Objective/steps:** Picking → PickLocationMoves → inspect demand and available source → choose source/destination
  → move the suggested quantity → inspect pick-face balance and return to pick work. Repeat from Handheld/PickFace.
- **Expected:** the UI explains which stock physically moved and why; reservations/availability are preserved by the
  guard; destination is the intended pick bin; completing the task is not a new supply-plan purchase or make order.
- **Recovery:** no eligible source, full/closed pick bin, stock changed by another mover, expired lot, wrong unit,
  canceled confirmation and operation retry. An unavailable suggestion must leave the operator's work recoverable.
- **Screens/modes:** PickLocationMoves, Handheld/PickFace, Assets, Availability and Move history;
  browser/TUI/Standard, phone controls and keyboard scan sequence.

### WH-21 — Pack a shipment and handle a permitted reopening

- **Actor/start:** packer and reader; picked `BOSS_WH_SHIP_PACK`, two cartons, partly packed copy and an organization
  whose pack invoice stays in process (the demo's is final at pack).
- **Objective/steps:** ShipmentDetail → Pack → select/scan work → pack quantities → create/edit packages and weights
  → move contents between packages → Complete pack → inspect package totals and invoice consequence. On the in-process
  copy reopen a package, make a change and complete again; on the demo inspect the finalized-invoice refusal.
- **Expected:** source stock, package contents and packed total agree; packing does not buy carrier labels; invoice
  timing is explained by the organization's policy; reopen releases the in-process invoice through its service. Today
  the release takes the whole shipment's lines (F275, an open question): record it, do not file it as new.
- **Recovery:** not picked/overpacked stock, wrong carton/unit, zero/missing weight where required, changed invoice
  (INVOICE_FINALIZED), canceled complete/reopen and repeat submit. A refused reopen preserves the package and
  financial document.
- **Screens/modes:** Pack, Handheld/Pack, ShipmentDetail, BoxTypes, PackingSlip and permitted InvoiceDetail;
  browser/TUI/Standard, two package-row dialogs, phone/keyboard and output inspection.

### WH-22 — Pack a kit from its component stock

- **Actor/start:** packer; `BOSS_WH_SHIP_KIT` with required components, shortages and `kitCostFromComponents`.
- **Objective/steps:** Pack → open the kit's MaterialIssueReceipt (`shipmentAssembly`) → inspect
  required/packed/remaining components → pack each eligible component → return to shipment packing → inspect resulting
  kit/package and movement evidence.
- **Expected:** component quantities and units are clear; the kit is built through the supported guarded assembly
  path; component cost behavior follows the organization's policy; a retry does not issue components twice.
- **Recovery:** missing component, wrong facility/lot, held or insufficient stock, stale component quantity and canceled
  action. Do not imply that production unused-material returns provide kit breakdown or unused-component return
  (F283, deferred).
- **Screens/modes:** MaterialIssueReceipt with shipment assembly source, Pack, AssetDetail/Movements, PackingSlip;
  browser/TUI/Standard and narrow/keyboard samples, with costs inspected only by their holder.

### WH-23 — Configure cartons, carriers and local printer behavior

- **Actor/start:** facility administrator (box types, facility printers), Warehouse administrator (carriers),
  shipping manager (carrier refusal) and reader; test carrier and the failing local printer.
- **Objective/steps:** Locations → BoxTypes → add/edit a carton and carrier code → FacilityDetail/BoxTypes → verify
  consumer. Carriers → inspect masked binding → add a method/bind the gateway → test rates. FacilityDetail/Printers →
  inspect the supported printer → Printers → Test → inspect PrinterTestPage and the actual delivery result.
- **Expected:** facility setup and carrier authority remain separate; credentials are masked and excluded from ordinary
  responses; carton dimensions/weight units and printer purpose are clear; failures preserve a usable test artifact.
  Box types are shared across organizations today (an open ownership question): note which organization's edit shows.
- **Recovery:** unavailable carrier, invalid account/method, the dead printer endpoint, stale binding, the shipping
  manager refused carrier edits (SHIPPING_CARRIER_EDIT), the shipper refused box-type edits and canceled change. A
  passing render is not a successful printer test; the printer test's own guard is to verify.
- **Screens/modes:** BoxTypes, Carriers, Printers, PrinterTestPage, FacilityDetail/BoxTypes/Printers;
  browser/TUI/Standard, keyboard/dialog layout and actual test-page bytes; no external charge or printer job.

### WH-24 — Buy synthetic labels, recover printing and ship once

- **Actor/start:** shipper; packed `BOSS_WH_SHIP_SHIP`, test carrier rates/labels, valid/invalid address and the
  failing printer.
- **Objective/steps:** ShipmentDetail → Ship → inspect address/packages → Validate address → compare rates → request
  labels (and a return label where offered) → inspect attempt/status/artifacts → Print → handle the failure with
  Reprint or LabelSheet/`labelPdf` → confirm Ship. Use a separate copy to refund a label and another for manual
  tracking. Inspect invoice finalization where the organization's ship-time policy applies and captured outbound notice
  evidence.
- **Expected:** rating, label purchase, printing and shipment completion are visibly separate; retry/unknown outcome
  does not buy another label blindly; package/shipment identity is on every artifact; shipping posts once; a refund
  reverses no shipment.
- **Recovery:** invalid address, stale package/rate, provider decline/unknown result, failed printer, canceled ship,
  expired grant and lost response. Record unreconciled provider outcomes honestly and keep safe reprint available.
  Rates are visible to the shipper and a real gateway's timeout handling is open (impl-warehouse §5): not new findings.
- **Screens/modes:** Ship, ShipmentDetail, LabelSheet, Manifest, `labelPdf`, InvoiceDetail and captured provider
  records; browser/TUI/Standard, keyboard and inspected PDF bytes, not filenames alone.

### WH-25 — Track delivery and follow shipment documents back to the order

- **Actor/start:** shipper, reader and separate financial reader; shipped multi-package shipment with partial delivery.
- **Objective/steps:** PackageTracking → find shipment/carrier/date → refresh supported tracking → record a delivery
  manually with its date/evidence where allowed → inspect package and overall shipment states → open ShipmentDetail,
  OrderDetail and InvoiceDetail → print permitted invoice/packing slip/manifest → return to the filtered tracking list.
- **Expected:** one package delivered is not the whole shipment until the defined completion condition; recorded and
  effective dates are understandable; physical readers see permitted document context without restricted amounts.
- **Recovery:** provider unavailable, missing/duplicate tracking, contradictory delivery, canceled manual entry,
  stale shipment, foreign record and a financial read grant removed before download.
- **Screens/modes:** PackageTracking, ShipmentDetail, Orders/OrderDetail/InvoiceDetail, PackingSlip, Manifest;
  browser/TUI/Standard, phone tracking rows, keyboard and exact exported/printed fields.

### WH-26 — Receive a customer RMA and hand it to quality and settlement

- **Actor/start:** receiver, inspector and quality manager (disposition); RMA `BOSS_WH_RMA` of `BOSS_WH_RETURNS`
  (settles separately) in two boxes, and Retail's `BOSS_WH_RETURN` for the refusal at Retail's default (§2).
  Authorization is CS-20's (`customerservice.returns`) and settlement CS-22's or ACC-28's; if the settled read-only
  state is wanted, `customerservice.returnsar` (a Retail agent, whose organizations include `BOSS_WH_RETURNS` by
  rollup) settles `BOSS_WH_RMA` as setup.
- **Objective/steps:** Returns → ReturnDetail → inspect authorized items/quantity and customer source → create/open
  ReturnReceipt → receive first box with accepted/rejected quantities, tracking, reason and quarantine location →
  receive remaining box → inspect separate receipts and inspections → quality disposition → view settlement progress
  with its authorized actor. As receiver create a return from an order (NewReturn), add an eligible item and request
  authorization; the authorization itself is Customer Service's (CS-20).
- **Expected:** physical receipt retains authorized quantity and cumulative received quantity; accepted stock is
  quarantined with inspection on the keyed Warehouse path; receiving/disposition does not settle credit, refund or
  replacement. Warehouse presents settlement as read-only evidence; no Warehouse group may authorize.
- **Recovery:** excess receipt, wrong/closed item, missing quarantine/lot/serial, missing reason, an organization that
  does not settle separately (RETURN_SETTLEMENT_OFF; F326 and the D11 question), duplicate operation and partial
  arrival. Refused receipt cannot consume authorization or hide the second box. Settlement may run before disposition
  (F319, Accounting's open question): record what the read-only view shows.
- **Screens/modes:** Returns, ReturnDetail, ReturnReceipt, QualityInspection, ReturnSlip and bounded Customer Service/
  Accounting handoffs; browser/TUI/Standard and phone list. No Handheld/ReturnReceipt route is assumed.

### WH-27 — Send supplier-return stock back without settling it

- **Actor/start:** quality manager (creates and sends back) and shipper; approved `BOSS_WH_SRET` with
  `BOSS_WH_SRET_SHIP`, and a fresh disposed-to-supplier receipt for the create branch. Authorization, replacement and
  the supplier credit are PUR-24's (`purchasing.buyer`, `retail.finance.ap`).
- **Objective/steps:** Returns → New return from the disposed receipt → add eligible receipt evidence and request
  authorization → (PUR-24 authorizes) → SupplierReturnShipment → select permitted stock → Send back → inspect issued
  quantity and disposition → ship with tracking (shipper) → inspect ReturnShipped and the link to Purchasing.
- **Expected:** stock, original receipt and supplier remain traceable; disposed/removed quantities affect matching
  consistently; shipping physical goods does not create a settlement or replacement order by itself.
- **Recovery:** stock not tied to the allowed disposition, wrong facility/owner, insufficient issued quantity,
  unauthorized approval, already-shipped return, partial shipment (OUTSTANDING: ships whole, F324) and canceled ship.
  Record the partial-shipment limit, not a successful return.
- **Screens/modes:** Returns, ReturnDetail, SupplierReturnShipment, QualityInspection, ReturnSlip and permitted
  Purchasing receipt/return/match links; browser/TUI/Standard, repeated line dialogs and output inspection.

### WH-28 — Transfer stock between facilities and receive it in parts

- **Actor/start:** mover (creates), issuer/shipper and destination receiver; `BOSS_WH_SHIP_TRANSFER` from `ZIRET_WH`
  to `BOSS_WH_EAST` and eligible source stock.
- **Objective/steps:** Transfers → New transfer → choose origin/destination/products → TransferShipmentDetail → pick
  if used → send stock (issue group) → ship → inspect in transit → receive part at destination → receive remainder →
  inspect delivered state, source/destination stock and TransferSheet. Repeat create entry from quick create.
- **Expected:** sent, transit and received quantities derive from the same line's evidence; destination does not show
  available stock before receipt; tracking/owner and permitted cost basis carry forward; retry returns prior operation.
  A transfer ships without packages or labels (Ship refuses it, SHIPPED_ELSEWHERE).
- **Recovery:** same/foreign/closed facility, held source, shortage, canceled shipment, receive before ship,
  over-receipt, missing reject reason and short-ship choice. A rejected unit's value stays at the transfer account and
  nothing writes off what never arrives (F346, open): record it. A transfer is distinct from a custody movement with no
  transit step.
- **Screens/modes:** Transfers (list, read-only board/calendar), NewTransfer, TransferShipmentDetail, TransferSheet,
  receiving queue and Assets; browser/TUI/Standard, keyboard and physical document signatures.

### WH-29 — Approve and allocate a stock request

- **Actor/start:** reader as requester, planner (approves) and mover (allocates); `BOSS_WH_REQ` asking for filters at
  `BOSS_WH_EAST`.
- **Objective/steps:** StockRequests → New stock request → RequestDetail → add stocked items/quantities → submit →
  planner approves → mover allocates locally by move or from another facility by transfer → inspect requested,
  approved, allocated, sent, in-transit, received and remaining progress → complete when permitted.
- **Expected:** approval creates traceable requirements; allocation is distinguishable from physical receipt;
  Requirement/transfer links and current app context remain coherent; the requester cannot approve (approval needs the
  stock policy capability).
- **Recovery:** missing facility/items, non-stock product, closed request, duplicate allocation, quantity above
  approval, changed available stock and canceled approval/allocation. Buy/make requirements and transfer conversion
  from the supply plan are not built in Warehouse (§3 reconciliation).
- **Screens/modes:** StockRequests, NewStockRequest, RequestDetail, TransferShipmentDetail and Home's transfer card;
  browser/TUI/Standard, quick-create and keyboard/phone samples.

### WH-30 — Dispatch vendor-custody material and receive subcontract output

- **Actor/start:** mover (custody dispatch) and issuer or `manufacturing.material` (output); `BOSS_WH_SHIP_SUB`,
  `BOSS_WH_RUN_OP`, `BOSS_WH_SUB_PO`. This is the Warehouse route's review (layout, recovery, retry); MFG-26 drives
  the same route only as the step MFG-25's subcontract needs, and PUR-21 reads that subcontract's acceptance.
- **Objective/steps:** Transfers → subcontract dispatch → SubcontractShipmentDetail → inspect custodian and linked
  service line → move components to `BOSS_WH_VENDOR` or use the supported transit path → inspect Custody at supplier.
  Output receipt → review quantity, material actuals where offered, destination/tracking and service acceptance →
  Receive and accept → inspect material issues, output receipt, inspection, ServiceAcceptance and accrual evidence.
- **Expected:** custody stock remains owned by the organization; a custody move is not consumption. The output path
  requires **STOCK_ISSUE**, issues vendor components and receives at the production basis (provisional here, no
  approved standard), not the service PO price; service acceptance and outside-processing accrual occur once under the
  operation, pending financial cost close. Nothing completes the operation or the service line afterwards (open
  question, impl-warehouse §5).
- **Recovery:** wrong custodian, canceled/non-service PO, missing component stock, over-output/acceptance, foreign run,
  invalid actual line, the mover refused the output (no STOCK_ISSUE) and repeated request. A failed dependent
  transaction must not leave orphan acceptance or output.
- **Screens/modes:** Transfers, SubcontractShipmentDetail, MaterialIssueReceipt, inspection and bounded Manufacturing/
  Purchasing/Accounting links; browser/TUI/Standard, quantity/unit dialog, keyboard and trace evidence.

### WH-31 — Issue production material, return unused stock and receive output

- **Actor/start:** issuer or `manufacturing.material` and financial reader; a released run with frozen material/output
  lines (`BOSS_WH_RUN` after WH-30, or the `WarehouseProductionFixtures` run, §2). This is Warehouse's
  `Inventory/MaterialIssueReceipt` mount; Manufacturing's WorkOrderDetail mount of the same screen is MFG-09/10's.
- **Objective/steps:** authorized run link → Inventory/MaterialIssueReceipt with production source → inspect method,
  operation and required/issued/returned/remaining → issue selected stock → receive partial output with lot/serials
  and destination → inspect tracking/inspection → return eligible unused material → inspect new receipt and remaining
  WIP/output basis → open the run's Manufacturing link once; cost close is ACC-24's and MFG-28's.
- **Expected:** **STOCK_ISSUE** governs issue, unused return and production output; movement retains run/line/operation.
  Unused material creates a receipt linked to its issuance; it does not erase history. Standard/provisional basis and
  quality hold are visible as permitted; output receipt is not cost close and existing movements are not reposted there.
- **Recovery:** unreleased/closed run, wrong line/owner, held stock, over-issue/output (QUANTITY_EXCEEDS_REMAINING,
  OVER_RECEIPT), unavailable cost, provisional return limits, duplicate serial, changed run, the mover refused and
  operation retry. By-product or amendment limits are explicit.
- **Screens/modes:** MaterialIssueReceipt, AssetDetail/Movements, QualityInspection and bounded Manufacturing/
  Accounting continuation; browser/TUI/Standard, long line tables, repeated dialogs and keyboard.

### WH-32 — Explain quantity history and the permitted inventory value

- **Actor/start:** reader and separate financial reader; `BOSS_WH_SHEET` by kilogram with complete/incomplete history
  and dated movements.
- **Objective/steps:** Reports → StockAtDate → choose date/facility/product/lot → Places → History → open movement and
  source → return → compare opening/receipts/issues/adjustments/closing. OperationsHistory → choose movement/document
  date basis and operation → drill to shipment/movements. Open InventoryValuation with and without financial read,
  inspect valuation basis and allowed result links, and export the actual supported rows. Compare the CSV and XLSX
  of OperationsHistory and both StockAtDate tabs (§2 Outputs) with their columns, filters, unit totals and amounts.
- **Expected:** each unit totals separately; unknown opening is not zero (history before a facility's first ledger row
  is Unknown; a stock history start is an open question); effective/recorded dates and truncation are explicit;
  Warehouse valuation omits revaluation/repair actions and refuses values without ACCOUNTING_VIEW.
- **Recovery:** future/inverted dates, missing prior audit history, foreign facility, expired grant before export,
  unavailable source document and a large paged result. Do not equate an inventory quantity report with book valuation.
- **Screens/modes:** ReportIndex, StockAtDate/Places/History, OperationsHistory, CountVariance, InventoryValuation,
  Assets/Movements and authorized journal/source links; browser/TUI/Standard, phone and the inspected files.

### WH-33 — Complete supported work at handheld density

- **Actor/start:** each required narrow operator on independent copies of the earlier activities;
  keyboard-wedge/typed scan.
- **Objective/steps:** Handheld/Home → choose facility → scan/choose task (only the tasks the user's capabilities
  reach) → Move, Receive, Putaway, Pick, Pack, Count and PickFace → perform the representative successful operation
  from its owning activity → trigger one meaningful refusal → recover → finish/back to Home. Include repeated scans, a
  two-match selector and switching tasks after a dialog. Compare each alias with its desk route at 390px.
- **Expected:** the inherited `density="handheld"` supplies 48px controls, 18px text and the reduced header without a
  drawer; next-scan focus is restored; status and feedback stay visible; stale scan or async response cannot act on
  the next task; "No handheld task is open to you here" for a user with none.
- **Recovery:** disconnected/lost response, ambiguous/wrong-kind scan, out-of-scope facility, unsubmitted quantity,
  keyboard overlap and canceled confirmation. No camera, return-receipt or Repack mount is invented.
- **Screens/modes:** all eight Handheld paths; Material light/dark at 390px and relevant narrow layout, keyboard and
  actual TUI scan/selection behavior. Mark any physical scanner/device check unavailable separately.

### WH-34 — Keep evidence and outputs attached to the correct record

- **Actor/start:** permitted reader/editor and outsider; asset, facility, shipment, return, count and production
  records.
- **Objective/steps:** from each relevant owning activity open Files/Conversation → add permitted evidence or note →
  inspect audience/record identity → version/download/reopen where supported → follow notification back. Inspect each
  listed print/helper from §3 and compare artifact identity, lines, units, scope and page breaks to the record shown.
  Open the Movements, OperationsHistory and StockAtDate/Places/History XLSX workbooks and their CSV counterparts, and
  the other CSV lists of §2; check actual rows/cells, selected columns, active filters and restricted-amount omission,
  not only the download name or extension.
- **Expected:** source and return links preserve the exact record; file/version controls and conversations honor its
  authority; outputs preserve columns, empty cells and ordering and omit restricted values and action-only fields.
- **Recovery:** removed/inaccessible record, denied download, unavailable renderer, failed upload, unsupported type,
  repeated attachment action and long/multipage document. A filename/notification alone does not prove its contents.
- **Screens/modes:** Chatter/ChatterTui, RecordFiles/RecordFilesTui, asset/facility/supplier/Product360 document mounts,
  all print/output paths; browser/TUI/Standard with actual bytes and terminal delegation limits recorded.

### WH-35 — Reconcile permission, organization and facility boundaries

- **Actor/start:** the §2 actor pairs, `customerservice.agentwh` (capability without root), prepared
  second-organization users and valid records of both organizations.
- **Objective/steps:** pair each selected positive activity with its meaningful refusal; check direct hidden/inherited
  routes and transitions, selected-value searches, scans, palette, record links, notices, files and exports. Request
  Handheld/Pick, /Count and /PickFace as a reader (these aliases sit outside the Picking/Counts area groups) and expect
  no usable action. Switch `FacilityActive` and organization (including `BOSS_WH_RETURNS`); test a foreign record and a
  missing record; inspect permitted read-only actions. Request the inherited Product360/Prices, Product360/Suppliers and
  Supplier360/Prices routes and their csv/xlsx renders in Warehouse and expect refusal.
- **Expected:** root/area access and operation permissions remain independent; preferences/context do not grant scope;
  foreign identities and financial values stay out of responses; no Warehouse role gains return authorization,
  settlement, invoice release or revaluation from a shared route.
- **Recovery:** grant revoked after preview, moved record, inaccessible selected value and cached route/data after
  identity change. Use otherwise-valid requests and compare reason codes where available, not arbitrary errors.
- **Screens/modes:** inventory, hidden children and output paths in §3, including InsightsRecord fallbacks;
  browser/TUI/Standard samples. The full role/route isolation walk is WarehouseAccessWalk in acceptance, not a
  regression to duplicate.

### WH-36 — Preserve cross-app continuity and close remaining coverage gaps

- **Actor/start:** composed actors with only the needed app and operation grants, matched organization/facility
  fixtures.
- **Objective/steps:** follow each handoff below from cold entry, with Back/Forward, deep links and reopen; open the
  counterpart side only as far as the handoff, leaving its own review to its app. Reconcile every §3 surface, dialog,
  custom mode and output with its activity evidence or explicit unverified reason.
- **Expected:** each app retains its own ownership and allowed actions; source/operation identity survives handoff;
  one Back returns to the origin when appropriate; no unmounted design route is treated as built or reviewed.
- **Recovery:** missing neighboring-app grant, different organization, unavailable integration, stale record and
  restricted inherited tab. Record blockers/deferrals without making them passes or expanding this review's scope.
- **Screens/modes:** all bounded handoffs and remaining inventory inspections; Material, actual TUI and Standard/output
  continuation as applicable. Update the pending ledger only from actual evidence during later execution.

| Handoff | Counterpart side (review) | Warehouse side |
| --- | --- | --- |
| Purchase receipt prepared by a buyer (`ensure#PurchaseReceipt`) | Purchasing PUR-19: `purchasing.buyer` prepares it on a fresh order | WH-10: `warehouse.receive`'s New receipt reopens the same receipt |
| Purchase revision on an open receipt (`apply#PurchaseRevision`) | Purchasing PUR-15 | WH-12: receipt quantities follow, waiting for a running receive (F175) |
| Receipt finish and quality | Purchasing PUR-19/20 on its ShipmentDetail and QualityInspection mounts | WH-12/13 on Warehouse's |
| Receipt to bill match (Shared InvoiceMatch) | Purchasing PUR-22 on the Retail bill (`purchasing.buymatch`, `retail.finance.ap`/`.approve`); ACC-12 is the Accounting mount on `BOSS_ACCT_ORG` data | WH-12: finish/backorder and self-billing evidence |
| Supplier return (`authorize#SupplierReturn`, `ship#SupplierReturn`, `settle#Return`) | Purchasing PUR-24: buyer authorizes and replaces, `retail.finance.ap` credits | WH-27: creates, sends back and ships |
| Short pick to substitution (`record#ShortPick`, `apply#OrderChange`) | Customer Service CS-17 on `BOSS_CS_SO_PICK` | WH-19: Pick screen and the short pick |
| Customer return authorization, receipt and settlement | Customer Service CS-20 (authorization of a return WH-26 requests), CS-21 (its own return on its ReturnDetail), CS-22 and Accounting ACC-28 (settlement) | WH-26: Warehouse-context receipt and quality of `BOSS_WH_RMA`, read-only settlement |
| Stage components into Move (`workEffortId`) | Manufacturing MFG-09: `manufacturing.material` from Components to Move and back, on its own run | WH-07: Move itself, without run context |
| Production issue, unused return and output (Shared MaterialIssueReceipt) | Manufacturing MFG-09/10 on WorkOrderDetail's mount | WH-31 on Warehouse's mount |
| Subcontract custody, output and service acceptance (`receive#SubcontractOutput`) | Manufacturing MFG-26 drives the route for MFG-25's subcontract; Purchasing PUR-21 reads its acceptance | WH-30: the route's review on `BOSS_WH_SUB_PO` |
| Production cost close | Accounting ACC-24, Manufacturing MFG-28 | WH-31: an output receipt is not cost close |
| Inventory value (Shared InventoryValuation) | Accounting ACC-23: Accounting mount, revaluation and landed cost | WH-32: Warehouse mount, no revaluation or repair |
| Supply plan transfer suggestions | Manufacturing MFG-24 observes the refusal (`METHOD_NOT_CONVERTED`); Purchasing PUR-17 cites it | none: Warehouse has no SupplyPlanning mount |
| Product stock and facility policy | Products (PRD-12) | WH-03/04: Product360 Warehouse tabs and Availability |
| Insights record fallback | Insights, `insights.warehouse` | WH-35: InsightsRecord routes |

## 5. Existing checks and future verification

These are source-inspected checks, not results from this planning task. BOSS currently has sixteen Warehouse server
regression specs, one golden-path client spec, three Warehouse server acceptance specs and seventeen Warehouse client
acceptance walks. Read their assertions and setup before selecting one: names and old implementation summaries can
cover less than a full activity, and their fixture consumption can conflict.

| Current check family | What its source covers / use in this review |
| --- | --- |
| `test/Warehouse/WarehouseAccess.spec.js` | Root grants/capabilities, organization/facility scope, record refusals, one valid move permission pair, raw Mantle/REST refusal and record-link routing; WH-01/35 |
| `WarehouseFacilities`, `WarehousePolicies` | Facility tree/locations/equipment and selected choice labels; effective policy, overrides/pools/tracking and reader/manager controls; WH-02–03 |
| `WarehouseInventory` | Assets/lot/ledger/trace, financial omission, metadata audit, containers, Product360/Availability and export basics; WH-04–06 |
| `WarehouseMoves`, `WarehouseAdjustments` | Movement/retry, quarantine refusal, mixed Relocate results, container handling, Handheld Move; adjustment/scrap/expiry/repack and locked period; WH-06–09 |
| `WarehouseReceiving`, `WarehousePutaway` | Receipt reuse/read context/line retry/finish and supplier context; suggestion/refusal/override/retry/rule access and two-step queue; WH-10–12/14 |
| `WarehouseInspections` | Reading/submission, inspector verification refusal, quality disposition, Today work and published template change; WH-13 |
| `WarehouseCounts` | Blind start/entry, review/post separation, due schedule, asset request, closed date and NewCount authorization; WH-15–17 |
| `WarehousePicking`, `WarehousePacking` | Pick work/short/finish context and OrderDetail fulfillment; package/kit/read context, carton setup and print basics; WH-18–22 |
| `WarehouseShipping` | Ship context, synthetic labels and failed-print recovery, carrier masking/setup, printers/outputs, invoice money gate; WH-23–25 |
| `WarehouseReturns`, `WarehouseTransfers` | RMA quarantine/read-only settlement, supplier issue/ship and no Warehouse return authorization; transfer/custody/request context; WH-26–30 |
| `WarehouseReports` | Dated stock/incomplete history, unit totals, valuation gate, choices/exports and Home cards; WH-01/32 |
| `test/client/Warehouse/WarehouseReceivingWalk.spec.js` | The registered golden path opens a purchase receipt and reopens the same one. It does not complete tracked receipt, short finish or handheld review; WH-10 |
| `test/acceptance/Warehouse/WarehouseAccessWalk.spec.js` | Standalone no-ProductStore receive-to-ship, app roots, two-organization route/output/search/file/notification/financial isolation; creates its data through WarehouseStandaloneLib; WH-35–36 |
| `test/acceptance/Warehouse/WarehouseServerStatic.spec.js` | Full check of Warehouse XML and marked server-static correctness; source/render support, not observed browser usability |
| `test/acceptance/Warehouse/WarehouseProductionFixtures.spec.js` | Creates and releases a run of `DEMO_1_1` with frozen lines and standard for client work; fixture setup is not an observed production journey |

The abbreviated server spec names in the table are under `test/Warehouse/`. `WarehouseSpecLib.js` and
`WarehouseStandaloneLib.js` are helpers, not additional independent review proof. `test/acceptance/AppStructure.spec.js`
and `test/acceptance/TuiRender.spec.js` load WarehouseSpecLib's route list: they are the acceptance sweeps; do not
reintroduce them as regression screen walks. A test that names a screen can be checking only its service context or
one rendered state.

| Current Warehouse client acceptance walk | Covered branch and open continuation |
| --- | --- |
| `WarehouseFoundationWalk` | Reader facility choice, queues, own-unit lookup, record link and Home at 390px; broader quick-create/saved-find/terminal work still needs WH-01 |
| `WarehouseFacilitiesWalk`, `WarehousePoliciesWalk` | Occupied-location refusal/read layout; policy/exception/store-source changes and reader layout; WH-02–03 |
| `WarehouseInventoryWalk` | Lot ledger, trace unknown provenance, metadata audit and narrow lists; containers and full hidden-mount scope need own evidence |
| `WarehouseMovesWalk`, `WarehouseAdjustmentsWalk` | Handheld move focus/refusal and desk quarantine warning; adjustment/closed period/scrap and repack; mixed batch recovery remains explicit |
| `WarehouseReceiptFinishWalk` | Partial tracked receipt, short close and Handheld Receive; separate backorder/receive-all/ad-hoc branches remain WH-11–12 |
| `WarehouseInspectionWalk`, `WarehousePutawayWalk` | Readings/submit/verify/release and reader phone detail; handheld putaway/no-fit/suggestion; template/board/other dispositions still need evidence |
| `WarehouseCountsWalk` | Due find, blind count start/entry and handheld line; full review/recount/conflict/import/post continuation is WH-16–17 |
| `WarehousePickingWalk` | Partial pick/short, narrow focus and pick-face access; picklist composition, put-back and completed replenishment remain WH-18–20 |
| `WarehousePackingWalk` | Two-carton pack, finalized-invoice reopen refusal, kit and handheld layout; permitted in-process reopen needs its own fixture |
| `WarehouseShippingWalk` | Test rates/labels/failed print/ship, manual delivery and phone tracking; provider unknown/refund and actual file contents remain WH-24–25 |
| `WarehouseReturnsWalk` | Two-box RMA quarantine and supplier issue/ship, narrow list; authorization/settlement handoff remains WH-26–27 |
| `WarehouseTransfersWalk` | Transfer issue/ship/partial receives, request approval/allocation and vendor custody; current commercial/production continuation remains explicit |
| `WarehouseProductionWalk` | Run context, subcontract output/service acceptance and unused return; independent issue/output/quality/cost-close continuations remain WH-30–31 |
| `WarehouseReportsWalk` | Dated stock, incomplete opening, unit totals/drill, valuation refusal and phone layout; financial-holder and exported-artifact branches remain WH-32 |

These walk files are under `test/acceptance/client/Warehouse/`. `test/acceptance/client/suite.js` registers them, runs
WarehouseReceiptFinishWalk near the end because it receives into stock the other walks do not count on, and lists
WarehouseProductionFixtures among the server fixture specs. `test/client/suite.js` registers WarehouseReceivingWalk
separately. Several walks tolerate an HTTP 500 for an expected refusal (§6 source concerns). Inspect current setup
ordering and dependencies before a focused run (§5).

Mantle is the rule owner. Relevant current regression families include `test/shipment/WarehouseReceiving`,
`WarehouseAdjustments`, `WarehousePicking`, `WarehousePacking`, `WarehouseShipping`, `WarehouseReturns`,
`WarehouseTransfers`; `test/facility/WarehouseFacilities`, `WarehousePolicy`, `WarehouseOperationPolicy`,
`WarehousePutaway`; `test/product/WarehouseMoves`, `WarehouseExpiry`, `WarehouseCounts`, `WarehouseQuality`,
`WarehouseTraceability`, `WarehouseReports`, `WarehouseStockChecks`; `test/work/WarehouseProduction`,
`ProductionMaterials`, `ProductionQuality`, `ProductionCosts`, `ProductionSubcontract`; purchasing/return policy
specs under `test/order/` (`PurchaseReceipts`, `PurchaseReturns`, `ReturnPolicies`, `AccountingReturns`); and
`test/ledger/ProductionCostClose`. These names omit the `.spec.js` suffix. Verify current coverage before choosing a
command; no new duplicate BOSS test should restate a Mantle rule.

### Verification rules for later refinements

These rules govern the refinement pass, and the commit rule applies in both; the review pass corrects nothing and
commits no source (§2). The suite rules are the [testing skill](../../../../../.agents/skills/testing/SKILL.md) and
[Build-Test](../../../../../docs/Build-Test.md#the-two-suites) with [rendering screens in
tests](../../../../../docs/Build-Test.md#rendering-screens-in-tests). Warehouse specifics:

- **While working.** From the mr-moqui root on a built binary: `./moq test mr-boss --spec WarehouseReceiving
  --nobuild`, the owning Mantle rule spec when that rule changes, and the golden path
  `./moq test-client mr-boss --serve --spec WarehouseReceivingWalk --nobuild`. Re-exercise changed activities and a
  representative second consumer of a shared fix.
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
  `./moq accept mr-boss --spec WarehouseTransfersWalk`. WarehouseAccessWalk creates `BOSS_P18_ORG` data and
  WarehouseReceiptFinishWalk adds stock; account for both in a shared runtime.
- **Rendering.** WarehouseReceivingWalk stays the only Warehouse golden path, and the sweeps stay in acceptance
  (AppStructure, TuiRender). Across regression a screen renders at most once per mode with all its checks, in a
  second mode only for the twenty-one `render-mode` screens and six templates of §3. No users × modes matrix, second
  golden path, Mantle rule retested through a BOSS wrapper or screenshot baseline.
- **Budgets.** BOSS `test/budget` 264 s server / 57 s client, Mantle 393 s server; a component over 1.5 times its
  budget or one regression spec over 15 s fails the run. Cut duplication or move a scenario to acceptance; no budget
  is raised without the user's agreement.
- **Lint.** `moqui lint --screens <report-file>` for changed screens (the argument is an overwritten output report,
  never a screen path), and `--qvt-static` for the 14 server-static screens, compared with the baseline;
  Markdown-only edits need none.
- **Evidence** stays in ignored `plans/ui-refinement-evidence/boss-warehouse/` in the framework repository; never
  commit credentials, tokens, customer details, captured mail or screenshots.

## 6. Coverage, findings and running record

### Activity coverage ledger

**Pending** means not reviewed; **inspected** means source/render/visual inspection only; **exercised** means steps
executed with an explicit pass/fail/partial outcome; **blocked** means a missing prerequisite; **deferred** means
deliberately postponed with reason and follow-up. Exercised does not by itself mean passed: use `exercised / partial`
and name the open continuations, recovery and mode gaps. Blocked and deferred coverage remains unresolved. Source
research and document review do not advance this ledger; record actual modes and results, not only a test name.

| Activity | Status | Outcome / recovery / mode gaps | Evidence / findings |
| --- | --- | --- | --- |
| WH-01 — Workday/facility | pending | All live variants unreviewed | — |
| WH-02 — Facilities/equipment | pending | All live variants unreviewed | — |
| WH-03 — Policies/pools/reservations | pending | All live variants unreviewed | — |
| WH-04 — Stock/asset/product context | pending | All live variants unreviewed | — |
| WH-05 — Lots/serials/traceability | pending | All live variants unreviewed | — |
| WH-06 — Containers | pending | All live variants unreviewed | — |
| WH-07 — Moves/bulk relocation | pending | All live variants unreviewed | — |
| WH-08 — Adjustments/scrap | pending | All live variants unreviewed | — |
| WH-09 — Repack | pending | All live variants unreviewed | — |
| WH-10 — Prepare receipt/supplier | pending | All live variants unreviewed | — |
| WH-11 — Receive tracked/ad-hoc stock | pending | All live variants unreviewed | — |
| WH-12 — Finish/backorder receipt | pending | All live variants unreviewed | — |
| WH-13 — Quality/template/disposition | pending | All live variants unreviewed | — |
| WH-14 — Putaway/rules | pending | All live variants unreviewed | — |
| WH-15 — Plan/start count | pending | All live variants unreviewed | — |
| WH-16 — Count/import | pending | All live variants unreviewed | — |
| WH-17 — Review/recount/post | pending | All live variants unreviewed | — |
| WH-18 — Outbound/picklist preparation | pending | All live variants unreviewed | — |
| WH-19 — Pick/short/put-back | pending | All live variants unreviewed | — |
| WH-20 — Pick-face replenishment | pending | All live variants unreviewed | — |
| WH-21 — Pack/reopen | pending | All live variants unreviewed | — |
| WH-22 — Kit assembly | pending | All live variants unreviewed | — |
| WH-23 — Carton/carrier/printer setup | pending | Synthetic provider/local sink prerequisites | — |
| WH-24 — Label/print/ship | pending | Provider attempts and actual artifacts unverified | — |
| WH-25 — Delivery/document continuity | pending | All live variants unreviewed | — |
| WH-26 — Customer RMA | pending | Authorization/quality/settlement continuation unreviewed | — |
| WH-27 — Supplier return | pending | Physical/financial continuation unreviewed | — |
| WH-28 — Transfer | pending | All live variants unreviewed | — |
| WH-29 — Stock request | pending | All live variants unreviewed | — |
| WH-30 — Subcontract custody/output | pending | Run/service acceptance/accrual continuation unreviewed | — |
| WH-31 — Production stock | pending | Output/quality/cost-close continuation unreviewed | — |
| WH-32 — Reports/valuation | pending | All live variants and artifact contents unreviewed | — |
| WH-33 — Handheld | pending | All live/device variants unreviewed | — |
| WH-34 — Evidence/outputs | pending | All live variants and artifact contents unreviewed | — |
| WH-35 — Access/isolation | pending | No matrix or refusal outcome inferred | — |
| WH-36 — Cross-app/mode reconciliation | pending | Depends on prior activity continuations | — |

### Findings register

No runtime/UI defect has been established by this planning work. The review pass records findings with Owner /
correction / retest empty; the refinement pass fills them in. Number later findings **WH-UI-001** onward with the
guide's fields and severities ([record, fix and verify](../../../../../docs/dev/UI-Review.md#record-fix-and-verify)): P1
blocks work or makes essential information unusable, P2 causes substantial friction or misleading presentation, P3 is
a localized refinement. Distinguish observed failures, source suspicions and design judgments. Stock, financial or
access corruption takes priority regardless of the screen's visual quality.

| ID | Severity / status | Actor, activity and step | Route / mode / theme / viewport | Reproduction, impact and evidence | Owner / correction / retest |
| --- | --- | --- | --- | --- | --- |
| — | No observed findings yet | — | — | Static concerns below are investigation inputs | — |

Source concerns to carry into later execution, without treating them as observed defects:

- Shared route trees contain more surfaces/transitions than Warehouse's visible tabs. Inherited catalog/method,
  supplier commercial, project billing and request-case transitions need paired context/authority checks; a hidden
  tab or branch condition is not the entire data boundary.
- *Source suspicion:* the acceptance walks tolerate `500 Internal Server Error` on refused `closeLocation`
  (LOCATION_IN_USE), `moveStock` (HELD_STOCK), `reopenPackage` (INVOICE_FINALIZED) and `adjustStock` (PERIOD_CLOSED).
  Check in WH-02, 07, 08 and 21 whether the operator sees the reason with input retained, and whether an expected
  business refusal should answer 500.
- *Source suspicion:* Handheld/Pick, /Count and /PickFace mount Picking and Counts screens outside the
  `BOSS_WH_PICKING` and `BOSS_WH_COUNTS` area groups. Access there rests on Handheld Home's capability list and each
  transition's record check; verify a reader's direct request in WH-35.
- *Source suspicion:* Supplier360's Products & prices tab may still be listed, empty, in Warehouse (F178, open in
  impl-warehouse §5; Products fixed the like case for Product360 by drawing tabs from `product360Tabs`). Check in WH-10.
- *Source suspicion:* Shared/SupplyPlanning shows transfer suggestions on the Manufacturing and Purchasing mounts and
  its confirmation says they are "left for Purchasing and Warehouse", but Mantle converts none
  (`METHOD_NOT_CONVERTED`) and Warehouse has no SupplyPlanning mount. MFG-24 observes the refusal; no Warehouse
  activity owns a conversion.
- Stock and commercial states have several independent steps: a received box is not released stock, a custody move
  is not consumed material, a packed shipment is not shipped, and return receipt is not settlement. Inspect captions,
  action hierarchy and persisted evidence where the same shared screen changes branch.
- Generated-lot receiving, CSV counts, selected-stock relocation and inspection reassignment require explicit
  partial-result inspection; a dependent transfer/production transaction has its own atomic boundary.
- Open impl-warehouse §5 questions are existing decisions, not new findings: each is cited at its activity (WH-13,
  16, 21, 23, 24, 26, 28, 30, 32), and the over-issue policy question applies to WH-31.
- Old fixed demo dates, consumption order and financial policy differences can invalidate a scenario without a UI
  regression. The finalized-at-pack demo and ship-time invoice policy need separate fixtures; a return also needs
  the correct separate-settlement policy.
- Label purchase, provider uncertainty, failed printing and reprint span durable external-operation state. Inspect
  the current attempt and artifact, not only notification wording; keep synthetic-provider and physical-device gaps
  explicit.
- Historical locked-period repost/cost issues mentioned by Accounting/Manufacturing are investigation references,
  not newly observed Warehouse defects or authorization for repair. Reconcile current service flags and ownership
  before any isolated reproduction; preserve posted history on a refused replacement.

### Bounded batch record

| Batch | Scope | Evidence / verification | Outcome / continuation |
| --- | --- | --- | --- |
| Plan and document review — 2026-11-10 | Dedicated Warehouse author in the four-app documentation batch; current routes/mounts, workflows, grants, fixtures, tests and old deferrals; an independent reviewer and the coordinator added the Movements/OperationsHistory XLSX and the inherited StockAtDate/price-mount CSV/XLSX variants and reconciled the companion handoffs | Source/document inspection and independent rechecks only; 89 local XML files and 190 recursive route instances inventoried; no runtime, test, output or stock/financial mutation | Initial document written and corrected; all WH activities pending |
| Source check — 2026-11-11 | Rechecked the plan against current routes, grants, demo data, specs and impl status; condensed §2/§5 to Warehouse specifics | Route count recomputed (190); user groups and permissions read from data; corrected actor grants, render-mode mapping, print format, consumption order and reconciliation of built contexts; added the actor table, handoff table and impl §5 citations; no runtime, test or stock mutation | Plan corrected; all WH live activities remain pending |
| Cross-review reconciliation — 2026-11-11 | The five companion reviews reconciled with one another and with source: handoff sides, shared fixtures, prepared identities, the shared-runtime disposition and the method wording | Source and document inspection only; `BOSS_WH_RETURNS` read as a rollup child of Retail (Mantle `get#PartyInternalOrgIds`) | Bill match moved to PUR-22, `BOSS_WH_RMA` made WH-26's alone, the `BOSS_CS_SO_PICK` short pick and cross-review orderings added; all WH activities pending |

For each execution batch append: its pass (review or refinement); actor and fixture identities; source and binary
revisions; runtime, clock and modes; activities and branches attempted; findings and owning layer; important
before/after evidence; persisted outcomes and inspected artifacts; exact checks, results and skips;
design/implementation updates; commits when made; temporary grants, settings and policy rows restored; unresolved
continuations. Keep notes bounded and refer to evidence files rather than pasting logs or tokens.

## 7. Decisions

- **Planning record and method:** planning only, written 2026-11-10, checked against source and reconciled with the
  four companion reviews on 2026-11-11; no runtime, walkthrough, test, build, application change or commit, and every
  activity pending. Products' seven-part structure; §2 and §5 keep only Warehouse specifics and link the guide and
  Products for the generic method (user decision, 2026-11-11); earlier reviews' statuses, authorizations and
  exceptions do not carry over.
- **Source and handoffs:** current mounts, services and grants govern scope, and older records are reconciled here
  without being rewritten. Each side of a cross-app handoff is exercised once, by the activity the handoff tables name
  (WH-36 here); the other review opens it only as far as the handoff.
- **Actors by username:** activities use role terms that §2's actor table maps to seeded usernames and exact grants.
  Neighboring-app users are listed but verified before use.
- **Inherited price exports:** checked in Warehouse as refusals only (their screen conditions exclude Warehouse); the
  authorized owning-app export is Products' to review.
- **Access pairs early:** WH-35's positive/negative pairs are established in W0 and completed in W6, as Products
  established pairs from its first wave.
- **Physical basis:** every movement receipt identifies facility, owner, record, tracking, quantity/unit and operation;
  record effective versus recorded date and policy source where relevant. Use disposable stock and synthetic providers.
- **Modes and completion:** Material is the visual target; actual TUI and brief Standard/output checks stay explicit.
  The seven handheld aliases need their actual inherited density and focus; unsupported devices and providers stay
  evidence gaps. Completion needs evidence for the selected activities, resolved or accepted findings and a candid
  ledger of what remains; a source inventory or passing suite is not a usable workflow.
- **Phases (user decision, 2026-11-11):** a complete review pass with concurrent agents comes first and corrects
  nothing; all findings are triaged together and addressed in a separate refinement pass (§2).

### Execution setup dispositions

The user decided every setup question on 2026-11-11. Record the actual values (instances, paths, ports, hostnames and
dates) in the first live batch and whenever an instance is added, as Products did:

- **Bootstrap and instances (decided):** the release binary, embedded Postgres and disposable databases throughout.
  The coordinator decides which agents share an instance and which get their own, and when (major data staging or a
  conflicting setup), and starts further instances on the fly on free non-default ports with their own hostnames (user
  decision, 2026-11-11). Record each instance's runtime and database paths, linked components, loaded demo data and
  any selected fixture specs (`WarehouseProductionFixtures`, the `BOSS_P18_ORG` model); listener ports and hostnames.
- **Shared runtime (decided):** the coordinating agent decides whether the five reviews share one runtime and
  manages the concurrent agents, the cross-review order and the restore of Retail-wide changes (§2).
- **Dates and zones (decided):** the real clock in the machine's current zone, recorded with the execution date, and
  no DST or second-zone checks (user decision, 2026-11-11); near-expiry, due-today and dated policy rows recreated
  relative to it.
- **Tool capability:** measured viewports, terminal keyboard and Chromium/PDF. 200% browser zoom is not checked
  (user decision, 2026-11-11).
- **Posting and mutation extent (decided):** postings and temporary setting, grant and policy changes in the
  disposable runtime are allowed (user decision, 2026-11-11); the coordinator sequences them and restores the changes.
- **Print sink (decided):** pointing `BOSS_WH_LABEL_PRINTER` at a local sink for the successful-print branch is a
  temporary setting change, so it is allowed; restore the 127.0.0.1:9 target afterwards.
- **Prepared fixtures (decided):** prepared users and records may be created for testing (user decision, 2026-11-11):
  a one-facility and a no-facility user, second-organization Warehouse users, the financial reader, and the consumable
  copies of §2.
- **Automation selection (decided):** focused acceptance walks and fixture specs along the way, and the full
  application acceptance run after the final `./moq test-apps` (§5; user decision, 2026-11-11).
- **Test cadence (decided):** local, focused checks before each commit in either pass, and one `./moq test-apps`
  (with `./moq test-framework` if framework code changed) at the end of the refinement pass (§5; user decision,
  2026-11-11).
