# IronStone BOSS — Purchasing implementation

Nov 12, 2026 — owner contract with Maintenance (impl-maintenance P10, F45): RequestDetail shows the originating work order of a
purchase request raised from maintenance work (a read added to its context, `get#PurchaseRequestWork`), a RequestItemOrder of such a
request links the order line to the work's equipment record (Maintenance's entity ECA), and OrderDetail has a read-only Maintenance
branch at Maintenance/WorkOrders/OrderDetail; Purchasing's services and specs are unchanged. Review: the ECA never fails the
sourcing (it logs what it cannot link); the work order's name shows only to a user Maintenance admits; PurchaseRequests.js exports
its `requireRead` for that read, its behavior unchanged.
Nov 4, 2026 — built: P0–P17 done (§3), what is left is §7. Nov 1, 2026 — plan; P0 partly done (F1–F23, found while writing it); the phase order and the open questions decided
(§4), on the shared party-role and effective-date rules (impl-drawers-commons §4); the supplier pages in a PASS app in
mr-pass (§4); Purchasing's rules in Mantle, behind Moqui permissions (§4); consistency pass: brought in line with the
Accounting, Warehouse and Products builds and the Nov 1 decisions

How [design-purchasing.md](design-purchasing.md) gets built, in phases from the foundation to the supplier portal, each
ending tested and usable. This file is kept at a high level, as [impl-products.md](impl-products.md),
[impl-accounting.md](impl-accounting.md), [impl-warehouse.md](impl-warehouse.md) and
[impl-manufacturing.md](impl-manufacturing.md) are: each phase names its scope by the design's sections and §16 needs
rather than restating them, and the design stays the place for screen and record detail. During the build this file is
the log: phase status and what each built, the decisions made, open questions, findings against the code, and what is
deferred.

Today `screen/Purchasing/` holds nine placeholders, and the root mounts only Chatter and RecordFiles. The
`BOSS_PURCHASING` artifact group has only the admin authz, and `BOSS_PURCHASING_PLANNER` and `BOSS_PURCHASING_ADMIN`
are seeded with `STOCK_POLICY_PLAN` (F1). None of the design's proposed
services, entities, fields or status items exist in Mantle or BOSS beyond what the four apps built before it provide.
Purchasing is built after Manufacturing and before Customer Service (§4), so these are there to extend:
- from Products: the supplier-price groups (P1); Product360 and `check#ProductUsable` on both order-entry paths (P2);
  `store#ProductPrice`, the resolver's direction fix, agreement matching and trace, and `Shared/PriceExplain` (P5);
  `Shared/SupplierPrices`, `Shared/Supplier360` and supplier item codes (P6); `store#ProductFacilityPolicy` and
  `Shared/InventoryAvailability` (P7); pack products and `resolve#ScannedProduct` (P11); ProductImport (P12);
- from Accounting: the AP, match, approver, treasury and reader groups (P1); SupplierProfile with its finance fields,
  `import#Bill` (for AP and buyers), `create#InvoiceFromSource`, `approve#Payable`, the holds and
  `request#HoldRelease`, the conditioned receipt-bill SECA, `OrderItem.costCenterId`, and its contexts on InvoiceDetail,
  OrderDetail, Supplier360 and ShipmentDetail (P6); `Shared/InvoiceMatch`, MatchPolicies, `queue#MatchReevaluation` and
  the legacy match backfill (P7); CX-ORDER-HOLD (P10); LandedCosts (P13); BudgetCommitment and
  `mantle.other.BudgetServices` (P15);
  `settle#Return` and `Shared/ReturnDetail` (P17); CX-PORTALS, and the PASS Supplier app in mr-pass with its BillUpload
  page and the PO's link (P18);
- from Warehouse: `ensure#PurchaseReceipt`, `adjust#ExpectedReceipt`, `close#ReceiptRemainder`, the receive guard and
  Purchasing's `close#PurchaseRemainders` (P7); CX-QUALITY with `Shared/QualityInspection`, `Shared/InspectionTemplates`
  and `get#SourceInspectionStatus` (P8); `ship#SupplierReturn` and Purchasing's `find#ReturnableReceipts` with the
  receipt link (P14); the vendor-custody facility (P15); Purchasing's `accept#ServiceItem` and
  `receive#SubcontractOutput` (P16);
- from Manufacturing: CX-PLANNING, with `Shared/SupplyPlanning`, `run#SupplyPlan`, `store#PlanSchedule`, the make
  conversion and held receipts as a pending-release line (P13); the outside-processing buy conversion to draft service
  PO lines, and `BOSS_PURCHASING_BUYER` with its permissions (P14, §4);
- from Projects: `Shared/RequestDetail` (without request items, F6), `Shared/OrderDetail`, `Shared/InvoiceDetail` and
  `complete#RequestFromWork` (F5);
- from Commons: notification topics with approve and refuse services, Notifications, Chatter, RecordFiles, and the
  palette, quick-create and Today providers.

**Inputs.**
- Designs:
  - [design-purchasing.md](design-purchasing.md)
  - [design-crosscut.md](design-crosscut.md) §1.3 (the automation register), §1.4, §3.3, §3.5–§3.8, §3.11, §3.15,
    §3.16, §3.18–§3.22, §4.1, §4.2, §5, §6 and §7.1 (CX-APPROVAL, CX-SOURCING, CX-REQUEST, CX-ORDER-HOLD, CX-PORTALS)
  - [design-products.md](design-products.md): §8 Suppliers and PRD-PRICE
  - [design-accounting.md](design-accounting.md): Bills, InvoiceMatch, MatchPolicies, SupplierBillUpload, AC-02, AC-03
    and AC-14
  - [design-warehouse.md](design-warehouse.md): receiving, WH-POST and WH-RETURN
  - [design-manufacturing.md](design-manufacturing.md): SupplyPlanning and Subcontracting
  - [design-projects.md](design-projects.md) §6 Requests
  - [design-drawers-commons.md](design-drawers-commons.md) §4, for the topic seeds
  - `mr-pass/plan/design-forum.md` §1, §4, §5 and §13.1: PASS's shell, app mounts, authority boundary, request
    contract, identity and invitations, for P16's pages
- Plans:
  - [impl-products.md](impl-products.md): the pattern; P5, P6 and P7, which build the price, supplier-price and
    availability screens Purchasing mounts.
  - [impl-accounting.md](impl-accounting.md): P6, P7, P10, P13, P15, P17 and P18 (the PASS Supplier app), and its §7
    list of Purchasing's callers.
  - [impl-warehouse.md](impl-warehouse.md): P7, P8, P14 and P16, which build Purchasing's three services, and its §7
    list of Purchasing's contexts and callers.
  - [impl-manufacturing.md](impl-manufacturing.md): P13 and P14, and its §7 list of Purchasing's mount and buy
    conversion.
  - [impl-projects.md](impl-projects.md): RequestDetail, OrderDetail and InvoiceDetail, and its P5 later list (request
    items and purchase orders).
- The design review: [review-core-apps.md](review-core-apps.md) (D1–D28) and
  [review-core-apps/purchasing.md](review-core-apps/purchasing.md), which explain the design's D- and R- IDs.
- Guides and rules: [design-doc-guide.md](design-doc-guide.md), [style-guide.md](style-guide.md) §8, and
  [impl-drawers-commons.md](impl-drawers-commons.md) §4 (the shared rules, with the party-role and effective-date rules).
- Inventories: [ss-inventory.md](ss-inventory.md) and [usl-inventory.md](usl-inventory.md), which already carry the
  design §14.5 **Designed in** paths.
- mr-moqui: `plans/Remaining-Work.md` and `docs/Build-Test.md`.

Framework paths are under the mr-moqui checkout (`crates/`, `runtime/components/base/`), Mantle paths under
`runtime/components/addon/mr-mantle/`, PASS paths under `runtime/components/addon/mr-pass/`.

Sections: [1 scope](#1-scope-and-order) · [2 rules](#2-ground-rules) · [3 phases](#3-phases) ·
[4 decisions](#4-decisions) · [5 open](#5-open-questions) · [6 findings](#6-findings) · [7 later](#7-later) ·
[8 verification](#8-verification)

---

## 1. Scope and order

- **Repositories.** Each is its own git repo:
  - `mr-moqui` (`crates/`, `runtime/components/base`)
  - `runtime/components/addon/mr-mantle`
  - `runtime/components/addon/mr-boss`, the internal app
  - `runtime/components/addon/mr-pass`, the supplier pages in its Supplier app (P16; §4)

  Design §16 needs no new framework widget, and the supplier links are pages of PASS's Supplier app taking their
  tokens (impl-accounting P18), so no phase plans framework work; P0 confirms it. `runtime/components/addon/mr-marble` is read
  only, for the baseline Supplier, Party, Request, Order, Agreement, Facility, Shipment, Return and Invoice screens
  that design §14.3 maps.
- **Scope.**
  - Every `parity` and `new` row of design §2, and the §16 needs they use, with PUR-DROPSHIP (§4), except PUR-LATER.
  - The design reshaped by the shared rules (§2, §4): a supplier's quote is a purchase order in Mantle's quote
    statuses; revisions, acknowledgements and agreement versions are audit-logged key fields with stored PDFs; policies
    are effective-dated rows; organizations and buyers are party roles.
  - Moqui Java's unmerged drop-ship branch, ported into mr-mantle (P7, F21).
  - The parts of other apps' needs that Purchasing still depends on (§4):
    - purchase requests on RequestDetail's Items tabs (Projects and Warehouse built them), the base RequestItems of
      crosscut §3.11;
    - crosscut CX-REQUEST's type check in `complete#RequestFromWork` (F5);
    - in Accounting's `evaluate#InvoiceMatch`, a drop-ship delivery as evidence (the service-acceptance rule is
      Manufacturing P14's, which P6's P0 check confirms);
    - in Warehouse's `store#ProductFacilityPolicy` (CX-FACILITY-POLICY), the snooze; the maximum stock and the reorder
      method exist (Products P7), and `run#SupplyPlan` reads them;
    - reorder-rule rows in Products' ProductImport (design §15).
  - No shared screen of its own. Purchasing's context on the fifteen shared screens other apps built:
    - Products' Product360, Supplier360, SupplierPrices, PriceExplain and InventoryAvailability;
    - Projects' RequestDetail, OrderDetail and InvoiceDetail;
    - Accounting's ShipmentDetail, ReturnDetail and InvoiceMatch;
    - Warehouse's QualityInspection and InspectionTemplates;
    - Manufacturing's SupplyPlanning;
    - Commons' Notifications, as Approvals (crosscut §3.15);

    and its pages in the PASS Supplier app in mr-pass, which Accounting P18 starts (§4).
  - The callers the other plans leave to Purchasing (their §7): the budget commitments at request, award and PO
    approval and at a cancel; match re-evaluation from a revision; PrepareReceipt and the revision's
    `adjust#ExpectedReceipt`; the buy conversion; placing and approving the service PO; `publish#SupplierQuotePrice`.
  - §7 holds the `later` rows and needs, and the rest of the other apps' needs.
- **Order** (decided Oct 28, 2026), the procure-to-pay spine first, on what the other apps built for it:
  1. the foundation;
  2. suppliers and the buying policy;
  3. purchase orders, then approvals and budgets;
  4. receiving and inspection, then bills and matching, then drop-ship, then supplier returns;
  5. revisions and acknowledgements;
  6. purchase requests, then RFQs and quotes, then comparison and award;
  7. agreements;
  8. replenishment;
  9. performance;
  10. the supplier portal, in the PASS Supplier app;
  11. the finish.

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
  - changes by effective date and the audit log;
  - demo data;
  - builds and commits.

  The walks are on Products' pattern (impl-products §2): one golden-path walk in `test/client/`, the rest acceptance
  tests.
- **Rules in Mantle, screens in BOSS** (§4). Purchasing's approvals, policies, supplier profile and check, sends,
  revisions, acknowledgements, requests, sourcing, agreements and scorecards are Mantle services in the package of their
  records (`mantle.order`, `mantle.request`, `mantle.party`). Each checks its Moqui permission (§4) and the organization
  by party relationship itself, so SECAs, other apps, the PASS pages and plain Mantle callers meet the same rule.
  `ironstone.purchasing` keeps `AccessServices`, Home, the worklists' and find screens' reads, the report reads, saved
  views and the settings forms. A Purchasing screen or mount calls the Mantle service after `AccessServices`, with no
  same-named `ironstone` pass-through; other apps call the Mantle name.
- **Purchase rows through services.** Under the organization filters (impl-drawers-commons §4), OrderPart, Shipment,
  ReturnHeader, Invoice and Party are filtered, but not OrderHeader, OrderItem, Request, RequestItem, Requirement,
  Agreement, AgreementItem, ProductPrice or AssetReceipt (F2). Purchasing reads and writes them only through services:
  `ironstone.purchasing.AccessServices` checks the buying organization, the supplier, the record and the capability
  group, then the screen calls the Mantle service, which checks its permission and the organization.
  - `entity` in a design form summary means that guarded path, never a bare entity form.
  - Grants are checked in the services, so they hold for exports, search, the palette, shared mounts and the supplier
    pages. The `BOSS_PURCHASING_*` groups get no artifact authorization for the raw Mantle order, request, agreement and
    return mutators, their REST paths or `change#OrderPartsStatus` (F9).
- **Purchase documents follow the shared rules** (impl-drawers-commons §4; §4 here):
  - Parties by role: a request's organization is a RequestParty in the OrgInternal role, and a requirement's a
    RequirementParty; a supplier's buyer is a dated PartyRelationship from the buyer (Buyer) to the supplier
    (Supplier); a drop-ship customer is the PO part's `CustomerShipTo` OrderPartParty, as Moqui Java has it (P7);
    agreement signers are AgreementParty rows.
    The fields Mantle keys by stay: OrderPart's vendor and customer, Request's filer, Agreement's two parties.
  - One document from quote to PO: a supplier's quote is a purchase OrderHeader in OrderRequested and then
    OrderProposed, and an award places it (F19).
  - Revisions: the key fields a phase locks are audit-logged (F18), and `OrderHeader.orderRevision` with them. A
    revision is that counter and its time. OrderDetail, OrderChanges, QuoteDetail, RequestDetail and AgreementDetail show
    the history from the audit log, and their prints take an effective date and time. A sent PO, a published RFQ and an
    approved agreement store their PDFs as OrderContent, RequestContent and AgreementContent.
  - Policies and profiles are effective-dated rows with their key fields audit-logged: SupplierProfile,
    PurchasePolicy, PurchaseApprovalPolicy and SupplierScorecardPolicy. A document keeps the policy row it was evaluated
    against, and the time.
  - Records of their own stay where a fact has its own identity: an approval decision, a scorecard evaluation, an
    agreement release allocation.
- **One approval gate.** Where the organization's buying policy turns its flag on (impl-accounting §4), a purchase part
  reaches OrderApproved only through `mantle.order.PurchaseServices.decide#PurchaseApproval`, and Mantle's
  `autoApprove#Order` meets the warning of `check#PurchaseApprovalRequired`, a SECA in mr-mantle on
  `check#OrderPreApprove` (design §6, D8). Mantle's `approve#Order` checks direction (X4, P3): a purchase part needs
  `PURCHASE_ORDER_APPROVE`, which ADMIN holds, and meets the same warning, so the flow specs' direct approval keeps
  working where no flag is on (F9).
- **Revisions and operations.** Every approval, conversion, award, release, revision, send, reminder and portal
  submission names its source revision and an operation identity. A retry answers the first result, and a stale
  revision is refused naming the current one. The operation record is Accounting P2's CX-POSTING record
  (impl-accounting §4). A batch names each failure and goes on: supplier groups, invitations, recipients, approvals,
  evaluations, import rows. One award, conversion or revision with its links commits atomically.
- **Restricted values stay on the server.** A service leaves out of its answer any supplier price, cost, budget,
  bank, payment or competing-quote value the user may not read. An inaccessible amount is omitted or said to be
  withheld, never shown as zero; a supplier sees its own documents only (design §13). A Mantle answer decides it by
  permission: `SUPPLIER_PRICE_VIEW`, `PRODUCT_COST_VIEW` and `ACCOUNTING_VIEW`, which their owners grant.
- **Shared screens.** Purchasing builds none. It adds its context to the shared screens of §1, each taking `appRoot` and
  server-derived capabilities on `Shared/RequestDetail`'s pattern, and its context adds no right a borrowed capability
  does not give (design §1).
- **Public pages in mr-pass, internal ones in mr-boss** (§4). The supplier pages are in the PASS Supplier app, on
  PASS's foundation (design-forum §1, §4, §5), as impl-accounting §2 sets out: PASS's shell and mounts, at 390 px and
  on the desktop with no terminal UI; a supplier contact is a PASS public account reaching its own documents through
  Mantle's checks of its supplier relationship and `ExternalAccessCapability`, with no `BOSS_SUPPLIER_PORTAL` group;
  pages call only Mantle services through `pass.Facade.call#Operation`, so the same pages work with a local or remote
  authority; PASS's request contract and media; links are pages taking their tokens, not `<token-route>`s.
- **Owner contracts.** A contract built here for another app follows that app's design: its package, its record and
  service names, its Shared screen, its permissions and its capability groups. A change found while building it is
  written into the owner's design. The owner's own screens stay with the owner.
- **Mantle rule changes keep Mantle's default.** A new refusal or condition in a Mantle service or SECA sits behind
  its own flag, off by default (impl-accounting §4), and ships with a test of its condition and of its unchanged default
  (crosscut §7.1). A new Mantle service checks its permission; an existing one gains a refusal only behind its flag. A
  new `enable-audit-log` changes no behavior and needs no setting.
- **Mantle callers stay compatible.** Existing callers of these keep working:
  - `create#PurchaseRequestOrder`, which BOSS never calls but CrmMiscServices does (F4);
  - `create#Order`, `add#OrderProductQuantity`, `place#Order` and `approve#Order`, and the quote transitions;
  - `complete#RequestFromWork` for Projects' request types;
  - `get#ProductPrice`, `create#ReturnFromOrder`, `get#OrderDisplayInfo` and the agreement content services;
  - the reservation SECA, which with P7's port makes a drop-ship PO only for a line reserved at a drop-ship facility.

  Mantle's OrderProcureToPayBasicFlow, CrmMiscServices, OrderLifecycle, OrderBulk and WorkProjectRequests specs pass
  unchanged, and so does the earlier apps' BOSS regression suite.
- **Done for a phase** means all of these:
  - impl-projects §2 "Done":
    - cargo tests for the touched crates, with goldens reviewed;
    - the regression tests for the rules the phase adds passing: Mantle's in mr-mantle, their users in spec-local
      groups holding the permissions, never a `BOSS_*` group, and BOSS's in mr-boss;
    - the regression suites of mr-mantle and mr-boss passing within their budget;
    - `moqui lint --screens` clean for BOSS with the Debug binary;
    - the inventories' **Implemented in** columns;
  - an access rule the phase adds checked in `PurchasingAccess` (one holder and one non-holder on one verb, and another
    organization's record refused), not every service and mount;
  - for P16: the same for mr-pass, and lint clean for PASS;
  - its row and **Built** note here.

  No route fixtures: a screen sweep is an acceptance test, one per app per mode (F16). The phase's "usable when" and
  its §8 scenario are acceptance tests to write (`test/acceptance/Purchasing/`, `test/acceptance/client/Purchasing/`; for P16,
  the remote pair on PASS's RemoteFixtures pattern and a browser walk on ForumHttp's and RemoteHttp's in mr-pass
  `test/acceptance/`), named in the phase; running them is not part of Done.

## 3. Phases

| Phase | Repos | Screens | Status |
| --- | --- | --- | --- |
| P0 Checks | all (read) | — | done Nov 4 (§6 F1–F43) |
| P1 Foundation | Mantle, BOSS | the Purchasing root and menu, Home | built Nov 4, 2026 |
| P2 Suppliers and buying policy | Mantle, BOSS | Suppliers, Supplier360, SupplierPrices, PriceExplain, Product360, Settings, PurchasePolicy | built Nov 4, 2026 |
| P3 Purchase orders | Mantle, BOSS | PurchaseOrders, OrderDetail | built Nov 4, 2026 |
| P4 Approvals and budgets | Mantle, BOSS | Approvals, ApprovalPolicies | built Nov 4, 2026 |
| P5 Receiving and inspection | Mantle, BOSS | Receipts, ShipmentDetail, Inspections, QualityInspection, InspectionTemplates | built Nov 4, 2026 |
| P6 Bills and matching | Mantle, BOSS | Bills, InvoiceDetail, MatchExceptions, InvoiceMatch | built Nov 4, 2026 |
| P7 Drop-ship | Mantle, BOSS | OrderDetail's drop-ship actions, PurchaseOrders' Drop-ship view | built Nov 4, 2026 |
| P8 Supplier returns | Mantle, BOSS | Returns, ReturnDetail | built Nov 4, 2026 |
| P9 Revisions and acknowledgements | Mantle, BOSS | OrderChanges, Acknowledgements | built Nov 4, 2026 |
| P10 Purchase requests | Mantle, BOSS | Requests, RequestDetail, RequestSourcing | built Nov 4, 2026 |
| P11 RFQs and supplier quotes | Mantle, BOSS | QuoteRequests, QuoteRequestDetail, Quotes, QuoteDetail | built Nov 4, 2026 |
| P12 Comparison and award | Mantle, BOSS | QuoteComparison, Award | built Nov 4, 2026 |
| P13 Agreements | Mantle, BOSS | Agreements, AgreementDetail | built Nov 4, 2026 |
| P14 Replenishment | Mantle, BOSS | SupplyPlanning, InventoryAvailability, ReorderRules | P14a built Nov 4, 2026; P14b built Nov 4, 2026 |
| P15 Performance | Mantle, BOSS | Scorecards, ScorecardDetail, Spend, Commitments, ProcurementTracker, PurchaseHistory, SupplierStatement, ScorecardPolicies | built Nov 4, 2026 |
| P16 Supplier portal | Mantle, mr-pass, BOSS | the PASS Supplier app's SupplierHome, QuoteResponse and OrderAcknowledgement | built Nov 4, 2026 |
| P17 Finish | Mantle, BOSS | — | built Nov 4, 2026 |

### P0 — Checks

Verify the design's riskiest assumptions against the code before building. Each result is a row in §6 and, where it
changes the design, an edit there. F1–F23 were found on Oct 28 while writing this plan. The design edits that §4's
decisions call for (the quote model, the audit-log revisions, the party roles, drop-ship on Moqui Java's model, the
quote tiers, the buyer's bill upload, the supplier pages in the PASS Supplier app) were made in the Oct 28 design sweep. Still to
check:

- **The other apps' state.** Products, Accounting and Warehouse are built, with their Purchasing parts:
  `close#PurchaseRemainders` (which calls `release#ClosedSourceCommitments`), `find#ReturnableReceipts`,
  `accept#ServiceItem`, SupplierProfile's finance fields, the buyer's `import#Bill`, the match backfill, and the PASS
  Supplier app with BillUpload (mr-pass `screen/Supplier/BillUpload.xml`). Still to check when the phases that use
  them start: Manufacturing P13 and P14, `BOSS_PURCHASING_BUYER` with its permissions (§4), the outside-processing
  conversion, and how the Supplier app's pages register (impl-accounting P18).
- **Service-line matching.** That Manufacturing P14 built the service-acceptance rule in Accounting's
  `evaluate#InvoiceMatch`; Accounting P7 did not (`InvoiceMatch.js` reads no ServiceAcceptance).
- **REST and bulk writes** (F9). Which BOSS groups would reach the Mantle REST order, return and request mutators and
  `change#OrderPartsStatus`, and which raw writes the mr-marble Order, Request, Agreement and Supplier screens make.
- **The rule flags.** That a buying-policy flag (impl-accounting §4) can condition `check#PurchaseApprovalRequired`,
  and what the demo organizations have.
- **The quote statuses** (F19). What Mantle's services and SECAs do with a purchase part in OrderRequested and
  OrderProposed (reservation, emails, auto-approval, totals). Not awarded uses Cancel Quote (crosscut X3).
- **Audit-log coverage** (F18). Each key field the phases lock that lacks `enable-audit-log`, and what
  `get#OrderDisplayInfo` and `get#OrderItemDisplayInfo` read back, for P9's history and the as-of print.
- **The drop-ship port** (F21). In the `dropship-moqui` branch's code: which shipment the PO gets, and its type; how
  the sales shipment's issue of a supplier-owned or shell asset at the drop-ship facility posts, so where the cost
  lands beside the supplier bill; and the branch's SECA ordering against BOSS's approval gate.
- **Purchase promotions** (F22). How Moqui Java users who take tier discounts by a promotion's auto-adjust scope it for
  a PO, which has no ProductStore.
- **Sending.** Projects' `send#Invoice` path for a rendered PDF on an EmailMessage draft, for `send#PurchaseOrder` (F13).
- **Demo data.** Mantle's ZiddlemanInc supplier, its offers to ORG_ZIZI_RETAIL, ZIRET_WH and OrderProcureToPayBasicFlow's
  fixtures, as P1's base.

**Done Nov 4.** The checks above are F24–F43 in §6. Their resolutions bind the phases that read them: P1 defines the five
missing permissions and gives the buyer the root (F28) and shares ZiddlemanInc (F43); P2's PurchasePolicy carries the
approval gate's flag (F34); P3's send copies Mantle's `send#Invoice` path (F42) and logs the fields of F36; P7's port
makes the PO's shipment, links lines by a stored link, moves the cost to COGS and stops at Placed under the gate
(F37–F40); P11 builds tiers as price rows and the promotion way only with a purchasing store (F41); P14a converts PsmBuy
(F27); service-line matching is already built (F30).

### P1 — Foundation

- **PUR-ACCESS** (design §1, crosscut §1.4).
  - The groups of design §1 not seeded yet: `BOSS_PURCHASING_REQUESTER`, `BOSS_PURCHASING_APPROVE` and
    `BOSS_PURCHASING_READ`, with `BOSS_PURCHASING` as the root user group beside the artifact group of that name, as
    in Products (§4). `BOSS_PURCHASING_PLANNER` and `BOSS_PURCHASING_ADMIN` exist (F1), `BOSS_PURCHASING_BUYER` from
    Manufacturing P14 (with `SUPPLIER_PRICE_VIEW`, which pricing a converted line needs; its review); the borrowed groups
    from their owners (crosscut §1.4).
  - The root user group's authz, beside the artifact group's admin authz (F1), with the organization filters of
    impl-drawers-commons §4 (`MANTLE_USER_ORG` for the groups, `MANTLE_ACTIVE_ORG` for `BOSS_PURCHASING_ADMIN`) and
    the service checks of §2.
  - The `UserGroupPermission` rows in BossSetupData for the Mantle permissions of §4: `PURCHASE_APPROVE`,
    `PURCHASE_ORDER_APPROVE` and `PURCHASE_HOLD_RELEASE` to `BOSS_PURCHASING_APPROVE` (X4); `SUPPLY_PLAN_RUN` to
    `BOSS_PURCHASING_PLANNER`, which holds `STOCK_POLICY_PLAN` already (F1); `SUPPLIER_SCORECARD_EDIT` to
    `BOSS_PURCHASING_BUYER`, whose other four (`PURCHASE_ORDER_EDIT`, `SUPPLIER_PROFILE_EDIT`, `PAYABLE_IMPORT` and
    `RETURN_AUTHORIZE`) Manufacturing P14 grants; all of them and `PURCHASE_POLICY_EDIT` to `BOSS_PURCHASING_ADMIN`,
    which holds `STOCK_POLICY_PLAN` already. The requester and reader groups hold none. The `UserPermission` rows not
    seeded yet, `PURCHASE_ORDER_APPROVE` and `PURCHASE_HOLD_RELEASE` among them, go beside `ORDER_APPROVE` in
    mr-mantle's MantleSetupData, and OhtPurchase's `enumCode` in OrderHoldEntities.xml changes from `ORDER_APPROVE` to
    `PURCHASE_HOLD_RELEASE` (X4).
  - `ironstone.purchasing.AccessServices`: the user's buying organizations, their capabilities, own and borrowed, and
    the suppliers they may work with: any Supplier-role party whose owner passes the organization filter, that is owned
    by the active organization or, with none active, by one of the user's organizations, or shared `_NA_` (§4). Every
    Purchasing screen and shared mount calls it before the Mantle service (§2). A supplied organization, supplier,
    order, request, RFQ, quote, agreement or return is checked against it. A requester sees their own and assigned
    requests only.
  - No artifact authorization for the raw services, REST paths or bulk status change of F9.
- **The Purchasing root.**
  - The menu of design §1: the placeholders renamed, Quotes as Sourcing, and Agreements, Receiving, Bills, Approvals
    and the hidden Products added (F1), on the design's path convention. Each area shows for its groups only.
  - `<shell-providers>` (PUR-SHELL): the palette types, quick create, Today sources and notification topics grow phase
    by phase, as their records are built.
  - The `purchasing` key scope.
  - `ironstone.commons.PaletteServices.get#RecordLink` opens POs, quotes, requests, RFQs, agreements and supplier
    returns under Purchasing for its users.
- **Home** (design §3): BuyerCounters over `ironstone.purchasing.BuyerServices.get#Home`, with the counts of later phases
  null; BuyerWork over `find#BuyerWork` with no sources yet; SpendSummary unavailable until P15.
- **Purchasing demo data.**
  - `BossPurchasingDemoData.xml` builds on Mantle's ZiddlemanInc supplier, ORG_ZIZI_RETAIL as the buyer, ZIRET_WH and
    the DEMO_* offers. It adds a second and a third supplier, a supplier awaiting approval, a blocked supplier, a
    service supplier, and a drop-ship supplier with its drop-ship facility, as the phases need them, with their buyers
    as PartyRelationship rows.
  - `BossUsersDemoData.xml` gains a user per group, a buyer who also holds `BOSS_ACCOUNTING_MATCH`, a buyer with the
    Warehouse receive group, and a Purchasing reader with no other launcher.
- **Specs.**
  - `PurchasingAccess`: the app's one access spec, about ten features run once with authorization on: the menu,
    providers and launcher per group, Home's one render, organization and supplier scope, the groups through the services
    and their permissions, record links, and the refused REST and bulk paths. A later phase adds a case only for an access
    rule it adds (no separate Shell spec, as the test reduction left the other apps).
- **Usable when** (an acceptance test to write): the menu renders for each group, and quick create offers only what the
  group may create. A reader sees their organization's POs and suppliers but not another organization's, in lists, the
  palette and record links, and sees shared suppliers too. A forged order or supplier ID is refused.

**Built Nov 4 (P1).**
- Mantle: `MantleSetupData.xml` seeds `PURCHASE_APPROVE`, `PURCHASE_ORDER_APPROVE`, `PURCHASE_HOLD_RELEASE`,
  `PURCHASE_POLICY_EDIT` and `SUPPLIER_SCORECARD_EDIT` beside `ORDER_APPROVE`, each with its ADMIN grant;
  `OrderHoldEntities.xml`'s OhtPurchase takes `PURCHASE_HOLD_RELEASE` (X4). Spec `test/order/PurchaseHoldPermission`.
- BOSS access (`data/BossSetupData.xml`): the groups `BOSS_PURCHASING` (root user group), `_REQUESTER`, `_APPROVE` and
  `_READ`; the root authz `BOSS_PURCHASING_ROOT` (`MANTLE_USER_ORG`, `MANTLE_PRIVATE_CONTACT`) and the
  `ironstone\.purchasing\..*` service pattern on the `BOSS_PURCHASING` artifact group; `purchasing` in the client deny
  pattern; the area groups `BOSS_PUR_LISTS` (Suppliers, Sourcing, Orders, Agreements, Receiving, Returns, Bills,
  Performance, Products: buyer, planner, approver, reader, admin), `BOSS_PUR_REPLENISHMENT` (planner, buyer, reader,
  admin), `BOSS_PUR_APPROVALS` (approver, admin) and `BOSS_PUR_SETTINGS` (admin), each denying the root user group; the
  record link group `BOSS_PUR_RECORD_LINK`; the grants of the Access list above. No authz for the raw Mantle mutators,
  their REST paths or `change#OrderPartsStatus`.
- `ironstone.purchasing.AccessServices` (`get#SharedContext`, `check#Record`, `get#Choices`, `search#Records`) over
  `Purchasing.js`, whose tables later phases extend: `capabilityPermissions`, `areas` (the area authorizations as the
  `listRead`, `replenishment`, `approvals` and `settings` capabilities), `recordKinds` (order, quote, request, rfq,
  agreement, supplierReturn, supplier; a `destination` once a screen is built), `searchFinds` (orders and quotes,
  suppliers), `choiceSources` (suppliers, organizations) and `linkPaths`. `BuyerServices.get#Home` (all counters null)
  and `find#BuyerWork` (no sources).
- The root: the menu of design §1 (Quotes.xml renamed Sourcing.xml, titled RFQs; the placeholders retitled and
  re-indexed; Approvals, Agreements, Receiving, Bills and the hidden Products added as placeholders, each file's comment
  naming its phase and groups), `<shell-providers>` with the palette source and the `purchasing` keymap; Home
  (BuyerCounters with each card for the groups that read it, My work's empty state, Spend unavailable, record lookup);
  `get#RecordLink` opens purchase orders, quotes and agreements under Purchasing (Home's lookup until P3 and P13 set their
  destinations), and requests, RFQs and supplier returns once their Purchasing screens are built (until then their
  Commons, Projects and Warehouse links stand).
- Demo: `BossPurchasingDemoData.xml` (ZiddlemanInc given the shared owner `_NA_` and an EmailOrder address, F43; the
  suppliers `BOSS_PUR_SUP_B` (Retail's, with an EmailOrder address), `_C` (shared), `_SERVICE`, `_PENDING` and `_BLOCKED`
  (Retail's; P2 sets the last two's states), `_SVC_ORG` (Ziziwork Services'); the draft POs `BOSS_PUR_PO_A` (Retail) and
  `BOSS_PUR_PO_SVC` (Services)). BossUsersDemoData's `purchasing.*` users: requester, buyer, planner, approve, read,
  admin (in `BOSS_PURCHASING_ADMIN` alone), buymatch (with `BOSS_ACCOUNTING_MATCH`), buyreceive (with Warehouse's receive
  group) and services (Ziziwork Services' reader); the buyer's Buyer-to-Supplier PartyRelationships (`PrtSupplier`) to
  Brightline and Ziddleman. The drop-ship supplier and its facility are P7's.
- Specs: `test/Purchasing/PurchasingSpecLib.js` (ids, users, `shell`, `routeFixtures`) and `PurchasingAccess` (10: the
  context, the menu, providers and launcher per group, Home's one qvt render, the capabilities per group, supplier scope in choices and palette, the record check with the requester's own requests, a
  capability on a record, record links, the guarded areas, REST and bulk refused). Acceptance:
  `test/acceptance/Purchasing/PurchasingFoundationWalk` (the usable-when: every area per group, the reader's and the other
  organization's orders and suppliers, forged ids) and `AppStructure` renders Purchasing's built screens
  (PurchasingSpecLib.routeFixtures; the placeholder count is now 66, the floor stays 62).
- Tests run: PurchasingShell, PurchasingAccess, ManufacturingAccess, ManufacturingSubcontracting, ProductsCatalog,
  AccountingPayables, AccountingAccess, WarehouseReceiving, WarehouseReturns, AppOrganizationFilters (BOSS, 69 features,
  all pass; Purchasing's two 2.6 s); PurchaseHoldPermission, OrderProcureToPayBasicFlow, AccountingCredit, OrderBulk,
  OrderLifecycle (Mantle, 47, all pass); acceptance PurchasingFoundationWalk and AppStructure (21, all pass). `moqui lint
  --screens`: no idiom or hazard site in the Purchasing screens.
- Decisions:
  - The areas by group: Home and Requests for every Purchasing user; the buying lists for every group but the
    requester's; Replenishment for the planner, buyer, reader and administrator; Approvals for the approver and
    administrator; Settings for the administrator. A requester's narrower read is the lists' authorization, read by
    `Purchasing.js` as `listRead`, so it comes from data and not from group names (the requester and reader hold no
    permission, §4).
  - A supplier is in scope when its owner is one of the user's organizations (the active one for the administrator, every
    one with none active) or `_NA_`; an unowned supplier passes no organization filter and is no one's (F43).
  - The buyer relationship is `PrtSupplier`, from the buyer in the Buyer role to the supplier in the Supplier role.
  - No quick create, Today source or notification topic in P1: the phases that build their records add them.
- Findings (provisional):
  - **F44** The per-app Shell specs were deleted from the regression suite in mr-moqui's test reduction (step 1), and
    Products and Accounting check their menus per group in their Access specs; the review folded PurchasingShell into
    PurchasingAccess (R2).
  - **F45** `get#PartyOrganizationInfo`'s organizations for a Retail agent include `BOSS_WH_RETURNS` (Warehouse's demo
    organization under Retail), so the organizations choice lists it beside ORG_ZIZI_RETAIL.
  - **F46** `get#RecordLink` answered no link for any OrderHeader or Agreement before P1; a sales order still gets
    none (Sales has no order screen).

**Review Nov 4 (P1).** Checked the Mantle and BOSS diffs against this phase, §2, design-purchasing §1, AGENTS.md and
Practices-App-Dev: the groups, root and area authorizations against Manufacturing's pattern (ALWAYS for each group over the
root user group's DENY, as Moqui's ALWAYS > DENY > ALLOW, which `screenGrants` mirrors); no authz for the raw Mantle
mutators, REST paths or `change#OrderPartsStatus`; the `ironstone.purchasing` pattern in the client deny list; every
Purchasing screen behind the root's `get#SharedContext`; the requester limited to their own and assigned requests (the
filer or a non-OrgInternal RequestParty) and refused orders, suppliers, the palette and record links; record links for a
sales order, request and return falling through as before; ZiddlemanInc's shared owner, which only widens what the
organization filters pass: every BOSS spec naming ZiddlemanInc or listing suppliers passes (below).
- **R1** (low, cost) `Purchasing.js` read the user's screen authorizations once per screen, five queries for every
  `scope()` (three per Home render, one per record link), and asked `get#PartyOrganizationInfo` of a user without
  Purchasing on every OrderHeader or Agreement link. It now reads them once per scope (`screenAuthz`) and skips the
  organizations when there is no root grant.
- **R2** (low, tests) `PurchasingShell` folded into `PurchasingAccess` (the menu and launcher in one feature, Home's render
  in another) and deleted: one Purchasing regression spec, 10 features, about 2.2 s.
- Left for the lead: OhtPurchase's `enumCode` change is a new refusal in Mantle's `hold#Order`/`release#OrderHold` for a
  non-ADMIN `ORDER_APPROVE` holder with no flag; X4 decides it, so it stays, but §2's flag rule does not cover it as
  written. No caller in mr-mantle, mr-boss, mr-marble or mr-pass places a Purchase hold.
- Specs run: PurchasingAccess, ManufacturingAccess, AccountingAccess, WarehouseReports, ProductsSuppliers, ProductsAccess,
  ProductsPricing, ProductsImport, ProductsFinish (BOSS, all pass).
- **Wave 1 suites (Nov 4, on master after P1 merged):** standalone mr-mantle 1,568 passed, 2 failed (the baseline
  WorkTimeEntries and WorkTimesheets), 11 skipped; `./moq test-apps` 2,788 server and 13 client features passed (feature
  time mr-mantle 281 of 300 s, mr-boss 191 of 220 s server and 32 of 36 s client); `moqui lint --screens` clean.

### P2 — Suppliers and buying policy

- **PUR-SUPPLIER, the buyer part.** Accounting P6 built `mantle.party.supplier.SupplierProfile`, effective-dated by
  organization and supplier, with the terms and self-billing fields. Here:
  - the default currency, the incoterm, the dated purchase block with its reason, and `approvalStatus` with its seeded
    Pending, Approved, Rejected and Suspended, audit-logged. Deciding it is P4;
  - the buyer as a dated PartyRelationship from the buyer (Buyer) to the supplier (Supplier), not a profile field;
  - the buyer fields of `mantle.party.SupplierServices.store#SupplierProfile` under `SUPPLIER_PROFILE_EDIT`, beside
    Accounting's finance fields under `SUPPLIER_TERMS_EDIT`, ending the current row and starting the next;
  - `ironstone.purchasing.SupplierServices.find#Suppliers`, over the supplier scope of P1;
  - the supplier-category classification type `PcltSupplierCategory` (F11).
- **PUR-SETTINGS.**
  - `mantle.order.purchase.PurchasePolicy`, effective-dated rows by organization with their key fields audit-logged:
    the buying defaults and controls of design PurchasePolicy, among them the RFQ response days, quote-expiry warning
    days, reminder days, supplier approval required and the unapproved-supplier Warn or Stop.
  - `mantle.order.PurchaseServices.store#PurchasePolicy` under `PURCHASE_POLICY_EDIT`. A change starts a row from its
    date; a document keeps the row it was evaluated against until revalidated.
  - `ironstone.purchasing.SettingsServices` `get#PurchasingSettings` and `store#RequestPurpose`, for the forms.
- **Screens** (design §3, §12):
  - Suppliers: SupplierFind, SupplierList, CreateSupplierPerson and CreateSupplierOrganization with the duplicate search
    first. Create adds the Supplier role, owned by the active organization, and the profile starts Pending when the
    policy requires approval. Bulk buyer and classification changes answer a result per supplier.
  - Supplier360: Products' `Shared/Supplier360` with the Purchasing row of crosscut §3.3: Overview and contact,
    Products and prices, Identifications and tax registrations, Payment details (Accounting's, finance-gated and masked),
    and Chatter and files. The profile's terms and self-billing flag show read only to a buyer, and the profile's
    history comes from its rows and the audit log. Later phases add their tabs.
  - SupplierPrices and PriceExplain: Products' shared screens with their Purchasing rows of crosscut §3.21, purchase
    direction only; PriceLists opens by link for the price-policy grant (R-XC-23).
  - Product360: Products' `Shared/Product360` with the Purchasing row of crosscut §3.5: identity, units, barcodes and
    packaging, supplier prices, availability, documents and BOM links if granted. A product `check#ProductUsable`
    refuses for buying shows the reason and no order action. P15 adds Purchase history.
  - Settings: SettingsLinks, RequestPurposes over RequestCategory, and SupplierClassifications.
  - PurchasePolicy: BuyingDefaults, PurchaseControls, and PolicyDependencies with Accounting's MatchPolicies and the
    Warehouse and budget policies read only.
- **Palette:** suppliers, by name, ID and supplier item code; the product lookup opens Purchasing's Product360.
- **Usable when:**
  - a buyer creates a supplier organization, and a duplicate candidate opens the existing Supplier360 instead;
  - the buyer is assigned to the supplier from a date, and sets the profile's currency and incoterm; they are refused
    its payment terms and self-billing flag;
  - a dated purchase block shows on Supplier360 and cancels no order;
  - PriceExplain explains ZiddlemanInc's tier for ORG_ZIZI_RETAIL, and a buyer without supplier-price read sees none;
  - an administrator starts a PurchasePolicy row from a date, and the earlier row stays with its history.

**Built Nov 4 (P2).**
- Mantle:
  - `entity/AccountingPayableEntities.xml`: SupplierProfile's buying fields `currencyUomId`, `incotermEnumId` (a TermType
    under TtInco), `approvalStatusId` (StatusType `SupplierApproval`: SupaPending, SupaApproved, SupaRejected,
    SupaSuspended) and the dated purchase block `purchaseBlockFromDate`, `purchaseBlockThruDate`, `purchaseBlockReason`,
    all audit-logged (F25).
  - `entity/PurchasePolicyEntities.xml`: `mantle.order.purchase.PurchasePolicy`, dated by organization on
    ProductionPolicy's pattern (empty takes the built-in default): the buying defaults (currency, purchase price list,
    receiving facility, default buyer, payment term, Incoterm) and the controls (`rfqResponseDays` 7,
    `quoteExpiryWarnDays` 7, `reminderDays` 3, `lockSentOrders` N, `supplierApprovalRequired` N,
    `unapprovedSupplierEnumId` PusWarn/PusStop, `approvalGateEnabled` N, `selfApprovalAllowed` N); the
    `PurchaseUnapprovedSupplier` enumeration and `PcltSupplierCategory` (F11).
  - `service/mantle/order/PurchaseServices.xml` over `PurchasePolicy.js`: `get#PurchasePolicy` (the policy in effect for
    an organization and date, with `policyFromDate`, the row a document keeps), `store#PurchasePolicy`
    (PURCHASE_POLICY_EDIT; POLICY_CHANGED, POLICY_INVALID) and `check#SupplierUsable` (OK, WARN or STOP:
    SUPPLIER_BLOCKED, SUPPLIER_SUSPENDED, SUPPLIER_UNAPPROVED). Reading takes PURCHASE_POLICY_EDIT,
    PURCHASE_ORDER_EDIT, PURCHASE_APPROVE, PURCHASE_ORDER_APPROVE or SUPPLIER_PROFILE_EDIT in the user's organizations.
    The rules of later phases (P3's `check#PurchaseApprovalRequired` SECA, the order and RFQ checks) read
    `PurchasePolicy.js`'s `effective(organizationPartyId, at)` and `supplierUsable(organizationPartyId, supplierPartyId,
    at)`, which check no permission.
  - `service/mantle/party/SupplierServices.xml` over `SupplierProfile.js`: `store#SupplierProfile` now takes the buying
    fields under SUPPLIER_PROFILE_EDIT beside the finance fields under SUPPLIER_TERMS_EDIT (an approval decision, a change
    to Approved or Rejected, also PURCHASE_APPROVE), its codes and callers unchanged; `create#Supplier` (an organization or
    person owned by the organization, in the Supplier role, with its email, phone and category, Pending where the policy
    requires approval); `store#SupplierBuyer` (the dated PrtSupplier relationship from a Buyer of the organization, ending
    the organization's buyer in effect, never another organization's); `set#SupplierCategory`.
  - Spec `test/order/PurchasePolicy` (5 features).
- BOSS:
  - `ironstone.purchasing.SupplierServices` (`Suppliers.js`): `find#Suppliers`, `find#SupplierDuplicates`,
    `get#SupplierContext` (Supplier360's Purchasing read) and `bulk#SupplierChanges` (buyer or category, a result per
    supplier); `ironstone.purchasing.SettingsServices` (`Settings.js`): `get#PurchasingSettings` (the settings rows and
    PolicyDependencies: Accounting's match and budget control and Warehouse's receiving read only, with their owners'
    links), `store#RequestPurpose` and `store#SupplierCategory`.
  - `Purchasing.js`: the supplier record's destination (Supplier360), a `product` kind (Product360), the capabilities
    `payableRead`, `termsEdit`, `supplierPriceEdit` and `catalogRead`, the choices `buyers` and `supplierCategories`, the
    palette's supplier item code and product finds, and the P2 link paths. `PaletteServices.get#RecordLink` opens a
    product in Purchasing's Product360 for a Purchasing user who opens neither Products nor Warehouse.
  - Products' `SharedContext.js` gets the Purchasing branch (crosscut §3.5, §3.21): the master read only, the tabs Summary,
    Identifiers, Dimensions, Packaging, Suppliers (supplier-price readers), Stock, Documents and BOM (method readers), no
    sales price. `PRODUCT_CATALOG_VIEW` to the buyer, planner, approver, reader and administrator groups (BossSetupData).
  - Screens: `Purchasing/Suppliers.xml` (SupplierList, the shared SupplierPrices and PriceExplain as tabs, Supplier360
    hidden), `Suppliers/SupplierList.xml` (find, New supplier and New individual supplier with the duplicate check first
    and Create anyway, Pending approval and Blocked links, the bulk Assign buyer and Set category), `Purchasing/Products.xml`
    with `Products/ProductFind.xml` and Product360, `Purchasing/Settings.xml` with `Settings/SettingsHome.xml`
    (SettingsLinks, RequestPurposes, SupplierClassifications) and `Settings/PurchasePolicy.xml` (BuyingDefaults,
    PurchaseControls, PolicyDependencies, the dated rows); `template/PurchasingParts.xml` (the choices transition).
  - Shared screens, each change kept to its Purchasing branch: `Shared/Supplier360.xml` (the Purchasing read, the approval
    chip and the supplier check under the title, a not-available state), `Supplier360/Buying.xml` (the buying profile with
    the payment term and self-billing read only, the buyer and its history, the category, the profile's history) and
    `Supplier360/Finance.xml` (Accounting's `get#SupplierFinance` for a finance reader, masked), the Conversation tab;
    `Shared/SupplierPrices.xml` and `Shared/PriceExplain.xml` for a supplier-price reader only, PriceExplain in the
    purchase direction asking for the supplier first; `Shared/Product360.xml`'s "Not for buying" reason from
    `check#ProductUsable` (usage Purchase).
  - Demo (`BossPurchasingDemoData.xml` P2 block): Retail's PurchasePolicy (gate off, supplier approval required, Warn),
    four supplier categories, the profiles of Ziddleman and Brightline (Approved), Northwind (`BOSS_PUR_SUP_PENDING`,
    Pending) and Halvorsen (`BOSS_PUR_SUP_BLOCKED`, blocked from Nov 1, 2026 for a quality hold), and their categories.
  - Specs: `PurchasingAccess` gains one feature (the supplier scope of the list, Supplier360 and the bulk changes, the
    settings' permissions, the product link; 11 features); `PurchasingSuppliers` (3: the list's profile columns and
    finds, the duplicates in scope, Supplier360's one html render). Acceptance: `test/acceptance/Purchasing/PurchasingSuppliersWalk`
    (the five usable-when items through the screens' transitions); `PurchasingSpecLib.routeFixtures` lists the P2 routes
    and shared mounts, and AppStructure's placeholder floor is 60 (63 left).
- Tests run: PurchasePolicy, AccountingPayables, WarehouseReceiving, OrderProcureToPayBasicFlow, CrmMiscServices,
  OrderLifecycle, OrderBulk, PurchaseHoldPermission (Mantle, 72 features, all pass); PurchasingAccess,
  PurchasingSuppliers, AccountingAccess, AccountingPayables, ManufacturingAccess, ManufacturingSubcontracting,
  ProductsAccess, ProductsSharedContext, ProductsSuppliers, ProductsPriceLists, ProductsFinish, ProductsInventory,
  WarehouseReceiving, WarehouseAccess (BOSS, 130 features, all pass); acceptance PurchasingSuppliersWalk (5),
  PurchasingFoundationWalk (3) and AppStructure (18), all pass. `moqui lint --screens`: no idiom or hazard site in the
  changed screens.
- Decisions:
  - Approved and Rejected are the purchase approver's decision (PURCHASE_APPROVE) in `store#SupplierProfile` until P4's
    `decide#PurchaseApproval` routes it; a buyer puts a supplier to Pending or Suspended. Giving the status already in
    effect is no decision.
  - `check#SupplierUsable`: a purchase block and Suspended always stop; Pending and Rejected, and no status where the
    policy requires approval, get the policy's Warn or Stop; a supplier with no profile and no approval required is OK, so
    nothing changes for Mantle's callers. It refuses nothing itself; P3's order and P11's RFQ services stop on STOP.
  - The supplier's buyer is the organization's: `store#SupplierBuyer` ends only the relationships from people of the
    organization (agents, employees, members), so a shared supplier keeps each organization's buyer.
  - The supplier list, Supplier360 and the duplicate search read through `ironstone.purchasing` (the app's reads, §2);
    the writes are the Mantle services, called by the screens after `check#Record` with the profileEdit capability.
  - Supplier360's Purchasing tabs (Buying profile, Payment details) come after the existing ones (menu index 6 and 7), so
    the other apps' tab order is unchanged.
- Findings (provisional):
  - **F47** PriceExplain's purchase explanation needs the external vendor: `PriceResolver.context` infers the sales
    direction with no vendor and refuses a purchase direction ("Price direction does not match the transaction parties").
    Purchasing's PriceExplain asks for the supplier first.
  - **F48** A Purchasing user held no catalog read, so Products' shared Product360, SupplierPrices and PriceExplain
    refused them; P2 grants PRODUCT_CATALOG_VIEW to the list-reading groups (as Manufacturing P2 did to its groups).
  - **F49** The design's PurchaseControls also name a substitution rule and a recurring-release rule; no phase before
    P9 (substitution on a revision) and P13 (agreement releases) reads them, so PurchasePolicy leaves them to those
    phases. The PurchaseSupplierApproval notification of a new Pending supplier is P4's (with its topic).
  - **F50** A shared tab whose screen has a `condition` (Supplier360's Receiving, Subcontract orders, Payment details)
    is still listed in the tab menu data of every app; the condition hides only its content. Pre-existing in Warehouse
    and Manufacturing; left as is.

**Review Nov 4 (P2).** Checked the diff in both repos against §2 and this phase: PRODUCT_CATALOG_VIEW to the five
Purchasing groups opens no Products-root screen (the root and its areas are artifact grants the groups lack) and no cost or
price beyond §2 (SharedContext's Purchasing branch lists no Prices or Costs tab, Suppliers needs SUPPLIER_PRICE_VIEW,
cost and method stay their permissions); store#SupplierProfile keeps Accounting's finance path, codes and callers;
SupplierProfile and PurchasePolicy changes end the row in effect and start the next with the earlier rows kept; the
get#RecordLink and SharedContext edits come after the Products and Warehouse branches, so their users are unchanged; the
BOSS screens call the Mantle writes after check#Record. Fixes:
- R1 (medium) store#SupplierBuyer, set#SupplierCategory and store#SupplierProfile's buying fields accepted another
  organization's supplier from a plain Mantle caller (BOSS checked the scope only in its own services); they now refuse a
  supplier owned by another organization (SUPPLIER_UNAVAILABLE). set#SupplierCategory reported an unchanged category as
  changed; it now answers no change, and PurchasingAccess expects Brightline's unchanged category.
- R2 (medium) a buyer could clear a Rejected or Suspended supplier's status, which check#SupplierUsable then passes where
  the policy does not require approval; clearing a status now needs PURCHASE_APPROVE like a decision.
- Left for the lead: a supplier's category is a PartyClassification, so for a shared (_NA_) supplier one organization's
  category is every organization's (F11's design); store#SupplierBuyer and Supplier360's buyer history find the
  organization's buyers by their membership now, so a buyer who has left keeps an open Buyer relationship and drops out of
  the history.
- Specs: mr-mantle PurchasePolicy, AccountingPayables, WarehouseReceiving; mr-boss PurchasingAccess, PurchasingSuppliers,
  AccountingAccess, AccountingPayables, ProductsSharedContext, ProductsAccess, WarehouseAccess; all pass.
- **Wave 2 suites (Nov 4, on master after P2 and P14a merged):** standalone mr-mantle 1,579 passed, 2 failed (the
  baseline), 11 skipped; `./moq test-apps` 2,806 server features passed, 1 failed: PurchasingSuppliers expected exact
  find results and met another spec's supplier created anyway as a duplicate, so it now checks the demo suppliers are
  found and the others are not (fixed); 13 client features passed (feature time mr-mantle 262 of 300 s, mr-boss 198 of
  220 s server and 32 of 36 s client); `moqui lint --screens` clean.

### P3 — Purchase orders

- **PUR-ORDER, the order.**
  - `ironstone.purchasing.OrderServices.find#PurchaseOrders`, with received, billed and balance kept apart.
  - Create, place, update, clone and cancel through guarded calls of the Mantle order services of design OrderDetail,
    one purchase part per PO (§4, F7). Each line's product passes `check#ProductUsable` for buying (Products P2), and a
    pack is ordered as its pack product (crosscut §4.1). Each line carries its cost centre in Accounting P6's
    `OrderItem.costCenterId` (AC-22). An unapproved or blocked supplier gets the policy's Warn or Stop from
    `mantle.order.PurchaseServices.check#SupplierUsable`, beside `check#ProductUsable`.
  - The audit log (§2, F18) on the PO's key fields that Mantle does not log yet: `OrderHeader.orderRevision`, and
    OrderItem's unit, cancelled quantity and description.
  - The commercial revision (X2, crosscut CX-ORDER-AUTHORITY), unless an app built it first: `increment#OrderRevision`
    counts only commercial changes behind its CX-AUTOMATION flag, with `get#OrderCommercialSnapshot` as the fallback.
    Decisions, sends and acknowledgements bind to it.
  - `mantle.order.OrderServices.send#PurchaseOrder` (R-PUR-02; `PURCHASE_ORDER_EDIT`, as for the PO verbs of later
    phases): the PO rendered as of its revision, to the vendor's `EmailOrder` address, then `EmailPrimary`, through an
    EmailMessage and `send#EmailDraft` on Projects' `send#Invoice` pattern (F13). The PDF is stored as OrderContent
    stamped with the revision and its time. It dedupes on order, revision and recipient, records each recipient's
    outcome, and moves the part OrderApproved → OrderSent.
  - The PO print takes an effective date and time, read back from the audit log (§2).
  - A buyer's hold through Accounting P10's `hold#Order`, with a Purchase reason, and its release through
    `release#OrderHold` by a purchase approver, under `PURCHASE_HOLD_RELEASE` (X4). A Sent PO un-sends to OrderApproved
    first (D7). `hold#Order` today checks the hold type's release permission for placing too, so P3 changes it in
    Mantle, unless an app built it first: a Change or Purchase reason is placed under the order's change permission
    for its direction (`PURCHASE_ORDER_EDIT`; `ORDER_CHANGE_APPLY` or `SALES_ORDER_CHANGE` on a sales order) or the
    type's release permission (crosscut §1.4).
  - ClosePurchaseOrders over `mantle.order.OrderServices.close#PurchaseRemainders` (Warehouse P7), a result per order.
  - RecordServiceAcceptance over `mantle.order.OrderServices.accept#ServiceItem` (Warehouse P16), its evidence on the
    order's OrderContent.
- **PUR-APPROVAL, the default step.**
  - `mantle.order.purchase.PurchaseApprovalDecision`, a fact of its own (§2): source entity, ID and revision, the policy
    row (none yet), approver, decision, time and reason.
  - `mantle.order.PurchaseServices.decide#PurchaseApproval` with design ApprovalPolicies' no-policy rule: one step by a
    holder of `PURCHASE_APPROVE`, self-approval refused unless PurchasePolicy allows it. It then calls `approve#Order`,
    which for a purchase part checks `PURCHASE_ORDER_APPROVE`.
  - Direction-aware `approve#Order` (X4, crosscut CX-ORDER-AUTHORITY), unless an app built it first: a purchase part
    needs `PURCHASE_ORDER_APPROVE`, and the order runs `check#OrderPreApprove`, refused on its warning unless a current
    decision is recorded.
  - `mantle.order.PurchaseServices.check#PurchaseApprovalRequired`, the SECA in mr-mantle on `check#OrderPreApprove`
    behind the buying policy's flag (§2).
- **Screens** (design §6):
  - PurchaseOrders: OrderFind, PurchaseOrderList with its saved views, CreatePurchaseOrder, ApprovePurchaseOrders and
    ClosePurchaseOrders.
  - OrderDetail: Projects' `Shared/OrderDetail` with the Purchasing row of crosscut §3.6: Header, addresses and terms,
    Items, History (the audit log and the stored PDFs), Chatter and files, and Money with finance capability. Its
    actions are place, approve, send, hold, cancel remaining, close, clone and print as of a date. Create draft bill
    opens Accounting's InvoiceFromSource dialog for AP intake. Money's request supplier prepayment goes through
    `add#OrderPartPayment` (R-PUR-36). Later phases add their tabs.
- **Outputs and shell:** the PO print and PDF; the PO palette type; quick create PO; Home's draft and unsent counts.
- **Usable when:**
  - a buyer creates a PO from ORG_ZIZI_RETAIL to ZiddlemanInc at its supplier price, and places it; a line for an
    obsolete product is refused with the reason;
  - a placed prepaid PO is not auto-approved, and its creator cannot approve it;
  - a purchase approver approves it, and send mails the PDF to the supplier's order address, stores it on the order and
    marks it Sent; a second send of the same revision mails no one twice;
  - a buyer holds the PO and a purchase approver releases it, which the buyer cannot, and an Accounting credit hold on
    another order stays;
  - Manufacturing P14's draft service PO is placed and approved here;
  - a PO partly received through Warehouse's Receive closes its remainder with a reason, records the cancelled quantity
    in the line's history and completes.

**Built Nov 4 (P3).**
- Mantle:
  - `entity/PurchaseOrderEntities.xml`: `mantle.order.purchase.PurchaseApprovalDecision` (source entity, id and revision,
    organization, decision PadApproved/PadRefused, date, user and party, reason, the PurchasePolicy row's `policyFromDate`,
    the approval policy and step for P4, operation key); the audit log on `OrderHeader.orderRevision` and OrderItem's
    `itemDescription`, `quantityUomId` and `quantityCancelled` (create and update, F57); `PurchasePolicy.commercialRevisionOnly`;
    the content type `OctPurchaseOrderIssued`. `data/PurchaseOrderSetupData.xml`: the `MANTLE_PURCHASE_ORDER_EMAIL` template.
  - `service/mantle/order/PurchaseServices.xml` (appended) over the new `PurchaseOrders.js`: `create#PurchaseOrder` (one
    purchase part, the supplier's profile currency else the policy's, the policy's receiving facility; the supplier check's
    Stop refuses and Warn warns; another organization's supplier SUPPLIER_UNAVAILABLE), `update#PurchaseOrder`,
    `store#PurchaseOrderItem` (a draft's line: `check#ProductUsable` Purchase, PRODUCT_NOT_USABLE with the reason; the
    resolver's supplier price unless given, PRICE_UNAVAILABLE; the cost centre the organization or a PrtOrgRollup child,
    COST_CENTER_INVALID), `delete#PurchaseOrderItem`, `place#PurchaseOrder` (ORDER_EMPTY, the supplier check again),
    `cancel#PurchaseOrder` (a reason as an internal note; ORDER_RECEIVED, ORDER_BILLED: close the remainder instead),
    `clone#PurchaseOrder` (a new draft without payments, files or notes; unusable lines named), `decide#PurchaseApproval`
    (the no-policy rule: PURCHASE_APPROVE, a placed order at its revision, STALE_REVISION naming the current one,
    SELF_APPROVAL unless `selfApprovalAllowed`, the supplier check, the decision kept, then `approve#Order`; operation key
    replay) and `check#PurchaseApprovalRequired`; every verb under PURCHASE_ORDER_EDIT in the buying organization
    (FacilityScope), one purchase part (NOT_PURCHASE, PURCHASE_PARTS), drafts only for line and header changes
    (ORDER_NOT_DRAFT).
  - `service/Purchase.secas.xml`: OrderPreApprovePurchase on `check#OrderPreApprove`, adding PURCHASE_APPROVAL_REQUIRED for
    a purchase part of an organization with `approvalGateEnabled` and no decision at the order's revision, so
    `autoApprove#Order` approves no such order (a prepaid one included).
  - `OrderServices.xml`: `approve#Order` direction-aware (`PurchaseOrders.js approveRefusal`, decision below);
    `hold#Order` places a Change or Purchase reason under the order's change permission for its direction
    (PURCHASE_ORDER_EDIT; ORDER_CHANGE_APPLY or SALES_ORDER_CHANGE) or the type's release permission, and un-sends a sent
    purchase order to Approved first (D7); `increment#OrderRevision` takes `revisionKind` (content, note and status are not
    counted, an item's quantity or price is, where the order's buying organization sets `commercialRevisionOnly`; every
    other order as before; `Order.eecas.xml`'s content and note rules and `handle#OrderPartChange`'s status-only update
    pass their kind, `handle#OrderItemChange` the item's); appended `send#PurchaseOrder` and `get#PurchaseOrderPrint` over
    the new `PurchaseOrderDocuments.js` (send#Invoice's path, F42: the print rendered to a PDF stored once per print as
    OrderContent, `send#EmailTemplate` per recipient in its own transaction with the bytes, OrderEmailMessage with the
    revision, ALREADY_SENT per recipient of the revision, Approved to Sent, PostingOperation replay; recipients the
    supplier's EmailOrder, else EmailPrimary; the print as of a time read back from the audit log, ORDER_NOT_YET before the
    order) with `template/order/PurchaseOrder.print.html.fancy` and `PurchaseOrderEmail.html.fancy`.
  - `OrderInfoServices.xml`: `get#OrderDisplayInfo` gains `revisionHistoryList` and `itemOtherAuditLogList`,
    `get#OrderItemDisplayInfo` `itemOtherAuditList` (the new audit fields, apart from the quantity and price lists marble
    reads).
  - Spec `test/order/PurchaseOrders.spec.js` (8 features, about 1.5 s).
- BOSS:
  - `ironstone.purchasing.OrderServices` (`Orders.js`): `find#PurchaseOrders` (views Draft, Awaiting approval, Approved not
    sent, Open, On hold, Closed; ordered, received, total, billed and balance apart; amounts withheld from a user who neither
    works the orders nor reads supplier prices or the books), `get#OrderDetail` (the Purchasing context: header, holds,
    lines with received, accepted and billed, history from the audit log, documents, emails, decisions and the actions by
    capability and status), `bulk#PurchaseOrderActions` (approve or close each selected order in its own transaction, a
    result per order); Home's `draftCount` and `unsentCount` and BuyerWork's orders to send; the choices `orderProducts` and
    `costCenters`. `Purchasing.js`: the order kind's destination `Orders/OrderDetail`, the P3 link paths.
  - Screens: `Purchasing/Orders.xml` (PurchaseOrders, the shared OrderDetail), `Orders/PurchaseOrders.xml` (OrderFind and
    PurchaseOrderList with saved finds, CreatePurchaseOrder, ApprovePurchaseOrders and ClosePurchaseOrders on the selected
    rows), `Purchasing/NewPurchaseOrder.xml` (quick create, BOSS_PUR_NEW_ORDER); `Shared/OrderDetail.xml`'s Purchasing branch
    with `template/PurchasingOrderDetail.xml` (the header with Place, Approve or Send by status and More: Edit order, Hold,
    Release hold, Close remainder, Clone, Print as of, Cancel order; Print; the holds, Details, Approvals, Lines with Add
    line, Edit, Remove and Record acceptance of a service line through `accept#ServiceItem`, Documents and emails, History);
    Home's Draft orders and Approved, not sent cards. `Purchasing.xml`: the purchase order quick create.
  - Data: BossSetupData's `BOSS_PUR_NEW_ORDER`; BossPurchasingDemoData: Retail's policy with `commercialRevisionOnly`, the
    demo sink server for `MANTLE_PURCHASE_ORDER_EMAIL` (F61).
  - Specs: `PurchasingOrders` (4: the list's views, amounts and its html render; OrderDetail's html render and a reader's
    detail; the bulk approval's named refusal; Home's counts and work); PurchasingAccess gains the quick create per group,
    the order record link to OrderDetail, the palette's order link and a feature for the detail's record scope (13
    features). The app's golden-path client walk `test/client/Purchasing/PurchasingOrdersWalk` (create, add a line, place,
    approve, send; 6.9 s). Acceptance `PurchasingOrdersWalk` (6: the usable-when items); PurchasingFoundationWalk's quick
    create; `routeFixtures` lists Orders/PurchaseOrders, Orders/OrderDetail and NewPurchaseOrder (AppStructure's placeholder
    count 61).
- Tests run: Mantle PurchaseOrders, OrderProcureToPayBasicFlow, CrmMiscServices, OrderLifecycle, OrderBulk,
  WorkProjectRequests, PurchaseHoldPermission, PurchasePolicy, AccountingCredit, OrderToCashBasicFlow, Replenishment,
  SupplyPlanning, ProductionSubcontract, ReturnToResponseBasicFlow, WarehouseReceiving (148 features, all pass); BOSS
  PurchasingAccess, PurchasingOrders, PurchasingSuppliers, PurchasingReplenishment, AccountingCollections,
  AccountingPayables, ManufacturingSubcontracting, ManufacturingWorkOrders, ManufacturingMaterials, ManufacturingSchedule,
  ManufacturingPlanning, ClientBilling, ProjectsAccess, WarehouseReceiving, WarehousePicking (85 features, all pass); client
  PurchasingOrdersWalk (pass); acceptance PurchasingOrdersWalk (6), PurchasingFoundationWalk (3), PurchasingSuppliersWalk,
  PurchasingReplenishmentWalk and AppStructure (all pass). `moqui lint --screens`: no idiom or hazard site in the changed
  screens (informational anchors only). mr-boss's client feature time is now about 39 s of its 36 s budget (a warning;
  the budget is not raised).
- Decisions:
  - approve#Order's direction (F33): a sales or internal part needs ORDER_APPROVE as before; a purchase part of an
    organization whose buying policy has the approval gate on needs PURCHASE_ORDER_APPROVE and a current decision; with
    the gate off (no row, Mantle's default) PURCHASE_ORDER_APPROVE or ORDER_APPROVE, so no ORDER_APPROVE holder is refused
    a purchase order they approve today and BOSS_PURCHASING_APPROVE (PURCHASE_ORDER_APPROVE only) approves too. The new
    refusal is the gate's; OrderProcureToPayBasicFlow and the Accounting demo (gate off for BOSS_ACCT_ORG and Retail) pass.
  - decide#PurchaseApproval is new, so its rules hold whatever the gate: one PURCHASE_APPROVE holder, no self-approval
    unless the policy allows it (the user who entered or placed the order), the revision current. BOSS approves only
    through it; the gate makes it the only way in Mantle too.
  - The commercial revision (X2) is behind `PurchasePolicy.commercialRevisionOnly` for an organization's purchase orders,
    the flag with its owner's settings (impl-accounting §4); Sales adds its own for sales orders. Retail's demo turns it on,
    so a sent order's revision stays the one approved and sent; `get#OrderCommercialSnapshot` is not needed.
  - hold#Order's widening (a buyer places a Purchase hold; a sent order un-sends first) is no new refusal and has no flag;
    a released order returns to Approved and is sent again (the revision already sent marks it Sent without mailing).
  - The print shows the status only as of a time, so the current print of a revision, and its stored PDF, are the same
    whatever its status.
  - Amounts in Purchasing's order reads show to a buyer, an approver, a supplier-price reader or a finance reader, and are
    "Withheld" for the reader group (§2).
  - The quick create is the root's NewPurchaseOrder, not a screen under Orders (F63). The PO palette type is
    Purchasing's own palette source, which now opens OrderDetail (F62).
- Left for later phases: OrderDetail's Create draft bill (Accounting's InvoiceFromSource) and Money's supplier prepayment
  (`add#OrderPartPayment`, R-PUR-36) are P6's with Bills; the addresses and terms tab and changes after placing are P9's
  (OrderChanges); a refusal decision and the Approvals list are P4's; the late, received-not-billed and drop-ship views come
  with P5, P6 and P7.
- Findings (provisional):
  - **F57** The framework's `enable-audit-log="update"` does not log the first value set on an empty field (the
    initial set), so a line's first cancelled quantity was not logged and an as-of read would show it before it happened.
    P3 logs `orderRevision`, the unit, the cancelled quantity and the description on create and update ("true").
    Accounting P6's `OrderItem.costCenterId` is "update": its first set is not in the log (P9 may change it to "true").
  - **F58** Under Mantle's counting a line's quantity or price change never moved `orderRevision`
    (`handle#OrderItemChange` leaves it to the part update, and `handle#OrderPartChange` returns early on a `partTotal`
    change), while a file, a note or a status change did. With `commercialRevisionOnly` the line change counts.
  - **F59** OrderContent has no immutable flag (F42's "immutable OrderContent"): the issued PDF is stored once per
    print and typed `OctPurchaseOrderIssued`, but nothing refuses its change.
  - **F60** `check#OrderPreApprove` warns every purchase order without authorized payments (payments low), so
    approve#Order cannot refuse on its warnings in general; it refuses on the purchase approval's warning only.
  - **F61** Mantle's SYSTEM EmailServer has no SMTP host, so `MANTLE_PURCHASE_ORDER_EMAIL` sends nothing on a plain
    install (the send names each recipient failed); BOSS's demo points the template to a local sink server, as Accounting's
    demo delivery does, and the Mantle spec uses a server and template of its own.
  - **F62** The MantleOrder search index holds sales orders and every organization's orders, and Commons' Records
    source falls back to the search's own link when `get#RecordLink` answers none, so a MantleOrder palette type would list
    them; the purchase order palette type is Purchasing's own source (P1's `search#Records`).
  - **F63** BOSS_PUR_LISTS's ALWAYS on `Orders.xml` reaches every screen under it, so a quick create screen there
    was offered to the reader, planner and approver; it is the root's `NewPurchaseOrder` with its own group.

**Review Nov 4 (P3).**
- Checked: Mantle defaults with no PurchasePolicy row (approve#Order's direction check: a sales or mixed part still needs
  ORDER_APPROVE, a purchase part takes PURCHASE_ORDER_APPROVE or ORDER_APPROVE, so ReturnServices' replacement approvals,
  change#OrderPartsStatus and createOrders' place-and-approve keep working; the SECA adds nothing with the gate off, so
  autoApprove#Order is unchanged; hold#Order only widens, and un-sends a Sent order only when every part is a purchase part);
  increment#OrderRevision's revisionKind (content, note and status still count and item returns early unless the order's
  buyer sets commercialRevisionOnly, so F58 holds); decide#PurchaseApproval (PURCHASE_APPROVE, the buying organization
  through FacilityScope, Placed only, STALE_REVISION naming the current revision, SELF_APPROVAL by enteredByPartyId or the
  logged OrderPlaced change, operation replay); send#PurchaseOrder (Approved or Sent only, the revision checked, recipients
  EmailOrder then EmailPrimary, ALREADY_SENT per recipient of the revision, the PDF stored once per print hash, the
  OrderEmailMessage with its revision); the amounts in find#PurchaseOrders and get#OrderDetail (Withheld, not zero); F57
  against the framework.
- **R1 (high, BOSS)** OrderDetail's History showed each price change's old and new value, and Documents opened the issued
  PDF (with its prices), to a reader whose amounts are withheld. The history's price rows say Withheld for that reader, the
  issued PDF is listed without a link and the orderContent transition refuses it (`Orders.js contentReadable`);
  PurchasingOrders checks the history.
- **R2 (medium, Mantle)** send#PurchaseOrder checked the status and the revision before the operation key, so a retry of a
  send that went through (a double submit) was refused once the order had moved on (STALE_REVISION without the commercial
  revision). The replay now comes first, its request naming the revision asked for; PurchaseOrders retries the first send
  after the revision moved.
- For the lead:
  - F57 is a framework divergence: `crates/moqui-entity/src/entity/field_rw.rs:349-352` skips an update whose old value
    is null when the flag is "update" ("does not log the first non-null value. That is the initial set."). The XSD
    (`entity-definition-3.xsd:197-202`) and Moqui Java's `EntityValueBase.handleAuditLog` leave out only the create under
    "update"; an update from null to a value is logged. With it fixed, "update" would do for the P3 fields (the as-of read
    needs the change, not the create) and save an audit row per new line of every order, sales included; Accounting's
    "update" fields (`OrderItem`/`InvoiceItem`/`AcctgTransEntry.costCenterId`, AccountingPayableEntities.xml and
    AccountingControlEntities.xml) then log a first coding of an uncoded line, which they miss now.
  - Without `commercialRevisionOnly` (every organization but the Retail demo) the send's own OrderContent and its
    Approved to Sent move the revision by two, so the revision recorded on the email is not the order's afterwards, and a
    send after a hold and release mails the supplier again; decisions are unaffected (the check runs before the status
    change). Purchasing's revision-bound rules assume the flag: consider defaulting it on where Purchasing sets up an
    organization's policy.
  - Budget: the client walk is 6.8 s, nearly all of it steps of 0.2 to 0.7 s and the send's PDF and mail (1.3 s); a trim
    saves well under the 3 s over mr-boss's client budget, so it is unchanged.
- **Wave 3 suites (Nov 4, on master after P3 merged):** standalone mr-mantle 1,587 passed, 2 failed (the baseline), 11
  skipped; `./moq test-apps` 2,819 server features passed, 1 failed: PurchasingAccess read the reader's suppliers from
  the first page of 30, which other specs' suppliers filled, so it now checks each supplier's scope by itself (fixed); 14
  client features passed (feature time mr-mantle 294 of 300 s, mr-boss 200 of 220 s server and 38 of 36 s client, a
  warning from P3's golden walk, left for the end's measured budget); `moqui lint --screens` clean.

### P4 — Approvals and budgets

- **PUR-APPROVAL, the policies** (design ApprovalPolicies, Approvals).
  - `mantle.order.purchase.PurchaseApprovalPolicy`, effective-dated rows with their key fields audit-logged:
    organization, source type, amount band and currency, category or facility, sequence, approver role or user, quorum,
    self-approval and expiry. Activation refuses ambiguous bands and a band with no eligible approver.
  - `mantle.order.PurchaseServices` `store#PurchaseApprovalPolicy` (`PURCHASE_POLICY_EDIT`) and
    `preview#PurchaseApproval`; `decide#PurchaseApproval` with steps, quorum and separation. A decision keeps the policy
    row and the time it was evaluated. A change to an audit-logged key field of a placed source after its decision
    invalidates the decision and resubmits. `ironstone.purchasing.ApprovalServices.find#PurchaseApprovalPolicies` for
    the list.
  - The topics `PurchaseOrderApproval` and `PurchaseSupplierApproval`, seeded in mr-mantle's data with
    `mantle.order.PurchaseServices` `approve#PurchaseSource` and `refuse#PurchaseSource` (`PURCHASE_APPROVE`) as the
    framework's approve and refuse services (F23), which refuse a stale revision naming the current one. Refusal moves
    a PO OrderPlaced → OrderRejected and sets a supplier Rejected. P10 seeds `PurchaseRequestApproval` and P12
    `PurchaseAwardApproval` the same way; agreements reuse the PO topic (P13). The seeds' note goes into
    design-drawers-commons §4.
  - Supplier onboarding (R-PUR-15): submit a Pending supplier, decide it, and Suspended as a dated block with its reason.
- **PUR-BUDGET, the PO commitments** (D10), through Accounting P15's `mantle.other.BudgetServices`:
  - `check#Budget` in the approval preview, with Warn shown and Stop refused;
  - `reserve#Commitment` at the approval of a PO with no request, keyed by its revision;
  - `release#Commitment` on a cancel; a closed remainder's commitments are released by Mantle's
    `close#PurchaseRemainders` through `release#ClosedSourceCommitments`.

  P10 adds the request reservation and its conversion at PO approval.
- **Screens:**
  - Approvals: Commons Notifications filtered to Purchasing's topics and the current recipient (crosscut §3.15), its rows
    the pending decision steps (F15). Approve and refuse call the topic handlers.
  - ApprovalPolicies: ApprovalPolicyList, ApprovalPolicy and ApprovalPreview.
  - OrderDetail's Approvals tab; Supplier360's approval status and submit.
- **Shell:** Home's approvals-waiting count; the Today source for decisions due.
- **Usable when** (thresholds as design §18 recommends, §4):
  - a policy with two bands sends a PO over the first band to two approvers in sequence, and one person cannot take
    both steps where separation is set; with no policy, one purchase approver decides;
  - Approvals here and in the Commons inbox show the same decision; deciding a superseded revision is refused naming the
    current one;
  - a refused PO is Rejected;
  - a budget under Stop refuses an approval and Warn lets it through with the warning; a closed remainder releases the
    unused commitment;
  - a bulk approval of three POs with one stale names it and approves the other two;
  - a PO to a supplier awaiting approval gets the policy's Stop, and passes once the supplier is approved.

**Built Nov 4 (P4).**
- Mantle:
  - `entity/PurchaseApprovalEntities.xml`: `mantle.order.purchase.PurchaseApprovalPolicy` (organization, source type
    `PurchaseApprovalSource`: PasOrder, PasRequest, PasAward, PasSupplier; band `fromAmount` included to `thruAmount` not
    included, currency, category, facility, `sequenceNum`, `approverUserId`, `approverUserGroupId`, `quorum`,
    `selfApprovalAllowed`, `separateApprover`, `expiryDays`, dates, description and reason, every key field audit-logged);
    `PurchaseApprovalDecision.supersededDate`.
  - `data/PurchaseApprovalSetupData.xml`: the topics `PurchaseOrderApproval` and `PurchaseSupplierApproval` with
    `approve#PurchaseSource` and `refuse#PurchaseSource` (F23; refuse needs a reason).
  - `service/mantle/order/PurchaseApprovals.js` with `PurchaseServices.xml` (appended): `store#PurchaseApprovalPolicy`
    (PURCHASE_POLICY_EDIT; a new step, the next version of one, or its end; POLICY_AMBIGUOUS for a band overlapping another
    band of the same scope or a second row for one step, NO_ELIGIBLE_APPROVER when fewer users of the organization holding
    PURCHASE_APPROVE than the quorum fit the step's approver), `preview#PurchaseApproval` (an order, a supplier or an amount:
    the steps with who approved and who may approve, POLICY_MISSING, canDecide or why not, and for an order `check#Budget` by
    account, WITHHELD for a buyer), `submit#SupplierApproval`, `decide#SupplierApproval`, `suspend#Supplier`,
    `approve#PurchaseSource`, `refuse#PurchaseSource` and `handle#PurchaseApprovalRevision`. The steps: the rows in effect of
    the organization and source type that fit the amount, currency, category and facility, of the most specific rank
    (facility and category, category, facility, the organization's), by sequence; none in effect is P3's no-policy rule; rows
    in effect none of which fits is POLICY_MISSING. A step is done when its quorum of distinct users approved it at the
    source's revision within its expiry. Messages go to the step's approvers (the user named, else the group's members, else
    any purchase approver of the organization), one message, or one per approver where the quorum is over one.
  - `PurchaseOrders.js`: `decide#PurchaseApproval` takes approve or refuse: the step waiting and its checks (NOT_ELIGIBLE,
    SELF_APPROVAL by the step's setting else the buying policy's, ALREADY_DECIDED, SEPARATION_REQUIRED, POLICY_MISSING); the
    decision keeps the policy row and step; a refusal (REASON_REQUIRED) is `reject#Order`; an approval leaving a step
    answers `pendingStepText` and notifies the next; the last one reserves the budget of the lines with no request
    (`reserve#Commitment` at BcsOrder, keyed by the revision, each line on its override account else
    `get#InvoiceItemGlAccount` incoming; only accounts under an approved budget; `budgetOverrideReason` for a Stop) and
    approves. The gate's `approvalWarnings` needs every step done. `place#PurchaseOrder` sends the first step;
    `cancel#PurchaseOrder` releases the commitments (`release#ClosedSourceCommitments`) and reads the notices.
  - `service/Purchase.secas.xml`: OrderRevisionPurchaseApproval on `increment#OrderRevision` (not for a status, file or
    note): the decisions of earlier revisions are superseded and a placed order's first step is sent again at the new
    revision.
  - `SupplierProfile.js`: a new Pending supplier's PurchaseSupplierApproval notice (F49), and `storeDecision`, the decided
    status written for `decide#SupplierApproval` (F65). `Budgets.js`: PURCHASE_APPROVE reserves and checks (F64).
  - Specs: `test/order/PurchaseApprovals` (5 features, about 2.7 s); acceptance `test/acceptance/order/PurchaseApprovalBudgetWalk`
    (2: Warn approves with the warning and reserves; a closed remainder releases).
- BOSS:
  - `ironstone.purchasing.ApprovalServices` (`Approvals.js`): `find#PurchaseApprovalPolicies` (Settings area) and
    `get#TodayItems` (the user's approvals waiting); Home's `approvalCount` (BuyerServices); the choices `approvers`,
    `approverGroups` and `productCategories` (Purchasing.js); the Settings link row; `Orders.js` `get#OrderDetail` carries
    `approval` (the order's preview as a probe), the `refuse` action, the decisions' step and superseded date;
    `bulk#PurchaseOrderActions` takes `orderRevisions` and names a step left waiting.
  - Screens: `Purchasing/Approvals.xml` (Commons Notifications with Purchasing's topics), `Settings/ApprovalPolicies.xml`
    (ApprovalPolicyList with New step, Change and End; ApprovalPreview), `template/PurchasingOrderApprovals.xml` (OrderDetail's
    approvals: the state, steps, budget, decisions and Refuse; included in place of P3's Approvals box, with `refuseOrder` in
    Shared/OrderDetail.xml and the approve dialog's budget override reason), `template/PurchasingSupplierApproval.xml`
    (Supplier360's Approval menu: Submit for approval, Approve, Refuse, Suspend), the Today source in `Purchasing.xml`.
  - Data: BossSetupData's links of the two topics; BossPurchasingDemoData's Retail policy (up to $5,000 a purchase approver;
    from $5,000 the BOSS_PURCHASING_APPROVE group and then the purchasing administrator, separated).
  - Specs: `PurchasingApprovals` (2: ApprovalPolicies' one html render with the preview, Today); PurchasingAccess gains the
    approval policies' access feature (14); PurchasingOrders checks the approvals section, the approval and refuse of the
    placed order and Home's approval count; PurchasingSuppliers' render the Approval menu; `routeFixtures` lists Approvals
    and Settings/ApprovalPolicies. Acceptance `test/acceptance/Purchasing/PurchasingApprovalsWalk` (5: the two steps, the inbox
    and a superseded revision, a refusal, the bulk with one stale, the supplier's Stop and approval).
- Tests run: Mantle PurchaseApprovals, PurchaseOrders, PurchasePolicy, OrderProcureToPayBasicFlow, AccountingBudgets,
  CrmMiscServices, OrderLifecycle, OrderBulk, WorkProjectRequests, PurchaseHoldPermission, AccountingPayables,
  WarehouseReceiving (all pass); BOSS PurchasingApprovals, PurchasingAccess, PurchasingOrders, PurchasingSuppliers,
  PurchasingReplenishment, ProductsSuppliers, ManufacturingSubcontracting, WarehouseReceiving, WarehousePicking,
  ClientBilling, AccountingPayables, AccountingAccess, ProjectsAccess, AccountingBudgets (97 features, all pass); client
  PurchasingOrdersWalk (pass); acceptance PurchasingApprovalsWalk (5), PurchaseApprovalBudgetWalk (2) and AppStructure
  (18), all pass. `moqui lint --screens`: no idiom or hazard site in the new and changed screens (informational anchors
  only).
- Decisions:
  - A step's approver is a user, a user group or any purchase approver of the organization, each holding PURCHASE_APPROVE
    and working for the organization; "approver role" is the user group (the design's role, as data).
  - Bands of one scope (organization, source type, currency, category, facility) meet or are the same; rows of one band are
    its steps by sequence. A source with lines in two categories that each have rows takes both rows' steps.
  - Expiry: a step's approval counts for its days while later steps wait; an expired one is approved again.
  - A supplier is approved by the same steps (PasSupplier rows, none in the demo: one purchase approver); its revision is
    the count of its profile rows (F67). Suspended is the status with a dated purchase block and its reason; a suspended
    supplier is submitted again only once the block ends, and approved again.
  - The budget is reserved only for lines under an approved budget's account, so an organization without budgets writes no
    commitment; a Warn reserves with the warning and a Stop refuses unless a BUDGET_OVERRIDE holder gives a reason.
  - Approvals is Commons' list with the topics; its rows' titles carry the order, revision, supplier, amount and step, not
    the budget (F71).
- Findings (provisional):
  - **F64** `reserve#`, `release#Commitment` and `check#Budget` admitted no Purchasing permission (Accounting §7: "with their
    approval permission"); PURCHASE_APPROVE is added to Budgets.js's reserve permissions (a widening, no new refusal).
  - **F65** `store#SupplierProfile` needs SUPPLIER_PROFILE_EDIT for any buying field, which the purchase approver group does
    not hold, so an approver could not set a supplier Approved; `decide#SupplierApproval` writes the decided status through
    SupplierProfile.js's `storeDecision` after its own PURCHASE_APPROVE check.
  - **F66** A band applies only in its currency (or every currency when it names none); nothing converts an amount, so the
    preview's "converted amount" is the source's own, and a source in a currency no row covers, where rows exist, is
    POLICY_MISSING.
  - **F67** A supplier has no revision; P4 counts its SupplierProfile rows (each change starts one), which the notice
    carries as `sourceRevision`.
  - **F68** A line changed on a placed order before any decision left the approvers' notice at the old revision, which the
    handler then refuses as stale; the SECA also resends where an approval notice exists, not only after a decision.
  - **F69** PurchaseOrders' row selection posts order ids only, so the list's bulk approval decides each order's current
    revision; `bulk#PurchaseOrderActions` takes `orderRevisions` for a caller that kept the revisions reviewed; the list now posts
    the revisions shown (review R3).
  - **F70** An error of a service called through `EntityLib.call` reaches the framework's approve#NotificationMessage as
    "Error: Error: CODE: …" (the inner error text is wrapped again); callers test the code with includes, and
    `lib.reasonCode` would not parse it.
  - **F71** The design's Approvals rows show the budget result and a due date; a notice is sent by the buyer who placed
    the order, who may not read budgets, so the title has no budget, and Today's due date is the time it was sent.
    OrderDetail's approvals show the budget to an approver.
  - **F72** OrderDetail's Purchasing branch has no tab list (P3 built it as sections of one page); P4's approvals are a
    section of their own template, included in place of P3's Approvals box (one line in `PurchasingOrderDetail.xml`).
  - **F73** Approvals is no longer a placeholder: AppStructure's count is 60 against its floor of 59, which P5 and P6's
    screens may cross at the merge.

**Review Nov 4 (P4).** Checked the Mantle and BOSS diffs against this section, §2 and design ApprovalPolicies, Approvals and
D10. Mantle defaults: `place#` and `cancel#PurchaseOrder` are Purchasing's own services (Mantle's flows call `place#Order` and
`cancel#Order`), their notice and release refuse nothing (the notice is logged on failure, `release#ClosedSourceCommitments`
needs no permission and releases nothing where no budget is held), the gate's `approvalComplete` runs only with the gate on;
OrderProcureToPayBasicFlow, OrderLifecycle, OrderBulk, CrmMiscServices and OrderToCashBasicFlow pass. Steps: separation,
ALREADY_DECIDED, the stale revision through the topic handler and the bulk with one stale are covered; Stop refuses and Warn
passes (acceptance). F65 is not a bypass: `storeDecision` is a script export (no service), writes only the decided
status, and still runs `store#SupplierProfile`'s organization scope and `buyingSupplier`'s owner check; only the permission
names move to `decide#SupplierApproval`'s own PURCHASE_APPROVE check (P2 R2's clearing to no status is not reachable through
it). Budgets.js's PURCHASE_APPROVE is a widening only, each service still scoped by `wf.organization`. The topic handlers
check PURCHASE_APPROVE, and the decide services the organization (`purchaseOrder`, `supplierOf`).
- **R1** (medium, performance) `handle#PurchaseApprovalRevision` runs on every order's revision and counted NotificationMessage
  rows by topic and record (no index) before knowing the order was a purchase; it now reads the order's parts first and
  returns for a sales order. `notify` read the step in a default parameter outside its failure guard (a failure would have
  refused `place#PurchaseOrder`); moved inside.
- **R2** (low, test) PurchaseApprovals: a decision retried with its operation key answers the first, with one decision and one
  commitment.
- **R3** (low, F69) PurchaseOrders' rows carry their revision and the bulk Approve posts them (`orderRevisionsText`), so an
  order changed since the list was shown is refused; PurchasingOrders posts the transition with a stale revision.
- Specs: Mantle PurchaseApprovals, PurchaseOrders, AccountingBudgets, OrderProcureToPayBasicFlow, OrderLifecycle, OrderBulk,
  CrmMiscServices, OrderToCashBasicFlow (86 features, pass); BOSS PurchasingApprovals, PurchasingAccess, PurchasingOrders,
  PurchasingSuppliers, AccountingBudgets (27, pass); `lint --screens` unchanged.

### P5 — Receiving and inspection

Purchasing's worklists and mounts over what Warehouse built (P7, P8): it posts no stock itself.

- **PUR-RECEIPT, the worklists:** `ironstone.purchasing.ReceiptServices.find#ExpectedReceipts` and
  `find#PurchaseInspections`, with expected, received, accepted, rejected and held quantities apart, and their units.
- **Screens** (design §9):
  - Receipts: ReceiptFind, ExpectedReceipts, and PrepareReceipt, labelled "Expected receipt (ASN)", over
    `ensure#PurchaseReceipt`.
  - ShipmentDetail: Accounting's `Shared/ShipmentDetail` with the Purchasing row of crosscut §3.8. A holder of
    Warehouse's receive group receives through Warehouse's guard, "Receive all as expected" with confirmation, and a
    short receipt closes or backorders through `close#ReceiptRemainder`. AP intake opens InvoiceFromSource on the
    accepted basis. A buyer without the receive group sees progress only.
  - Inspections: InspectionFind and InspectionList.
  - QualityInspection and InspectionTemplates: Warehouse's shared screens with their Purchasing rows of crosscut §3.19.
    The holders of the inspect, verify and dispose groups act; others read. InspectionTemplates is in Settings' menu.
  - OrderDetail's Receipts and inspection tab; Supplier360's Receipts and quality tab.
- **Outputs and shell:** the receiving checklist and inspection report through Warehouse's outputs; the late-receipt
  notification topic; Home's late-receipt count.
- **Usable when** (design §14.4 #1, the receipt):
  - PrepareReceipt for a PO part twice opens the same shipment;
  - a buyer with the receive group receives 8 of 10 from Purchasing's mount into quarantine, and the inspector accepts 7
    and rejects 1;
  - Receipts shows 10 ordered, 8 received, 7 accepted, 1 rejected and the held quantity until disposition;
  - a buyer without the receive group cannot receive;
  - a receipt past its due date raises the late-receipt notice.

**Built Nov 4 (P5).**
- Mantle:
  - `service/mantle/order/PurchaseReceipts.js`: each stock line of the approved, sent, processing or held purchase parts of
    the given organizations (completed too on request) with its expected (ordered less cancelled, in the stock unit),
    received, accepted, rejected, held and remaining quantities apart, its open receipt and expected arrival, its due date
    (the line's required date, else the part's promised delivery, else the open receipt's expected arrival) and whether it
    is late (due before today with something to come); the held quantity is Mantle's
    `get#SourceInspectionStatus`, an inspection's rejection moves units from accepted to rejected and an undecided
    inspection's units are neither (F78). At most 2,000 lines (`truncated`, F79). Purchasing posts no stock.
  - `service/mantle/order/PurchaseReceiptServices.xml` `notify#LateReceipts` (new file): once per order part and due date,
    the late lines to the organization's users with PURCHASE_ORDER_EDIT, a part that fails logged and the rest going on;
    `data/PurchaseReceiptSetupData.xml`: the topic `PurchaseLateReceipt` and the ServiceJob `notify_LateReceipts` (daily
    6:15).
  - Spec `test/order/PurchaseReceipts.spec.js` (2: the quantities apart and lateness; the notice once, to the buyer, never
    for a line received in full or not yet due).
- BOSS:
  - `ironstone.purchasing.ReceiptServices` (`Receipts.js`): `find#ExpectedReceipts` (views Expected, Partly received, Late,
    Held, Completed, All; supplier, order, facility, organization and due dates), `find#PurchaseInspections` (the
    inspections of the user's purchase receipts, open or all), `get#ReceiptDetail` (Shared/ShipmentDetail's Purchasing
    context), `get#InspectionDetail` (Shared/QualityInspection's), `get#TemplateList` and `get#TemplateDetail` (the receipt
    templates for Shared/InspectionTemplates), `get#InspectionChoices` (the status filters, else Warehouse's choices);
    Home's `lateCount` and PurchaseOrders' Late view (`Orders.js` view `late`). `Purchasing.js`: the record kinds `receipt`
    (a ShpTpPurchase shipment of the user's orders, ShipmentDetail) and `inspection` (QualityInspection), the capabilities
    `payableEdit`, `inspect`, `qualityVerify`, `qualityDispose` and `qualityTemplateEdit`, the choices `receiptParts`,
    `rejectionReasons` and `receiptLocations`, the Receiving link paths; `get#Choices` takes `shipmentId`.
  - Screens: `Purchasing/Receiving.xml` (tabs Receipts and Inspections; ShipmentDetail, QualityInspection and
    InspectionTemplates mounted, hidden), `Receiving/Receipts.xml` (ReceiptFind, ExpectedReceipts with saved finds,
    PrepareReceipt "Expected receipt (ASN)"), `Receiving/Inspections.xml` (InspectionFind, InspectionList);
    `template/PurchasingReceiptDetail.xml` (the transitions `purchaseReceiptChoices`, `prepareReceipt`, `purchaseReceive`,
    `purchaseFinishReceipt`, `purchaseReceiveAll`, `purchaseBillReceipt`; the sections PrepareReceiptDialog and
    PurchasingReceipt: the record header with Finish receipt, Receive all as expected and Create draft bill, a Receive dialog
    per line, the lines with expected, received, accepted, rejected, held and due, the receipts, the inspections, files and
    conversation; "Receiving is done by the warehouse's receivers" for a buyer without STOCK_RECEIVE);
    `template/PurchasingOrderReceipts.xml` (OrderDetail's Receipts and inspection, one section-include in
    `template/PurchasingOrderDetail.xml`, with Expected receipt (ASN) for an approved or sent order);
    `Shared/Supplier360/PurchasingReceipts.xml` (Receipts and quality, menu index 8). Purchasing branches in
    `Shared/ShipmentDetail.xml`, `Shared/QualityInspection.xml` (the receipt and order links, More only with an action),
    `Shared/InspectionTemplates.xml` and `template/WarehouseInspectionParts.xml`'s `inspectionChoices`;
    `Shared/OrderDetail.xml` includes `prepareReceipt`. Home's Late receipts card opens Receipts' Late view; Settings' landing
    lists Inspection templates (Receiving/InspectionTemplates, design §1); PurchaseOrders' Late view; the root's
    `notification-topic` PurchaseLateReceipt, whose link (BossSetupData) opens the order.
  - Demo (`BossPurchasingDemoData.xml` P5 block): `BOSS_PUR_PO_RCV` ("Late restock", Retail from Ziddleman, ten DEMO_1_1
    required by Oct 25, approved) and its expected receipt `BOSS_PUR_RCV_SHIP` at ZIRET_WH, nothing received.
  - Specs: `PurchasingReceiving` (3: Receipts' late line with its quantities apart, Home's count and the orders' Late view,
    refused to a requester, Receipts' html render; ShipmentDetail's html render for the receiver and the buyer's progress
    only, another organization refused; the Inspections, InspectionTemplates and Supplier360 tab html renders);
    PurchasingAccess gains the receipt's scope and the receive permission on it (14 features). Acceptance
    `test/acceptance/Purchasing/PurchasingReceivingWalk` (5, the usable-when items); `routeFixtures` lists the Receiving routes and
    mounts.
- Tests run: Mantle PurchaseReceipts (2, pass); BOSS PurchasingReceiving, PurchasingAccess, PurchasingOrders,
  PurchasingSuppliers, PurchasingReplenishment, WarehouseInspections, WarehouseReceiving, WarehouseAccess, AccountingPayables,
  ManufacturingSubcontracting, ManufacturingAccess, ManufacturingShopFloor (all pass; PurchasingReceiving about 1.0 s);
  acceptance PurchasingReceivingWalk (5), AppStructure (18) and PurchasingFoundationWalk (3), pass. `moqui lint --screens`:
  no idiom or hazard site in the changed screens (informational anchors only). No existing Mantle service changed, so no
  compatibility spec applies.
- Decisions:
  - Receiving on Purchasing's mount is the receive permission (STOCK_RECEIVE, Warehouse's receive group) on a receipt of
    the user's orders, through Warehouse's receive guard (`receive#ShipmentStock`, `close#ReceiptRemainder`,
    `receive#ExpectedShipment`), which checks the permission and the facility again; Purchasing's own transitions, not
    Warehouse's (F74). Expected receipt (ASN) is for a buyer or a receiver (ensure#PurchaseReceipt's own rule).
  - The inspect, verify and dispose actions under Purchasing are offered where Warehouse's scope also covers the
    inspection's facility, since they are Warehouse's transitions and choices (F75); assign and cancel stay Warehouse's.
  - AP intake's bill from a receipt is `create#InvoiceFromSource` on the received basis for PAYABLE_EDIT, a delivered receipt
    with accepted units; P6 opens the bill under Bills.
  - InspectionTemplates' "menu entry in Settings" is a row of Settings' landing (Settings' tab menu holds only its own
    subscreens); the route stays Receiving/InspectionTemplates (design §1).
  - Late is a stock line of an open part due before today with something to come; Home counts those lines, and the
    orders' Late view their orders.
- Findings (provisional):
  - **F74** Warehouse's receipt transitions included in Shared/ShipmentDetail (`closeRemainder`, `receiveAll`) check
    Warehouse's record scope (its root) and answer `sharedLinks['Receiving/ReceiptDetail']`, which no other app has, and
    Accounting's `invoiceFromSource` refuses any root but Accounting; Purchasing's mount has its own transitions over the same
    Mantle services.
  - **F75** Shared/QualityInspection's and InspectionTemplates' transitions and choices are Warehouse's (or
    Manufacturing's) and need Warehouse's root; a Purchasing reader without it got no status filter. Purchasing answers the
    status filters itself and leaves the rest to Warehouse's choices.
  - **F76** `ensure#PurchaseReceipt` takes no supplier shipment reference, which design PrepareReceipt lists; the receipt
    keeps none from Purchasing (a later parameter on the Warehouse service).
  - **F77** ZIRET_WH's demo operation policy names no quarantine location, so a receipt that needs inspection there is
    refused LOCATION_REQUIRED unless the receiver chooses the quarantine cage (0901); the walk does.
  - **F78** A line's accepted quantity counts its receipts' first inspections' decisions; a re-inspection's split shows
    only through the held quantity. (Fixed in review R1: a re-inspection moves what it accepts back to accepted.)
  - **F79** The due date is the line's, the part's or the open receipt's, so the Late, Partly received and Held views are
    computed over the open lines read (at most 2,000, with a warning past it) rather than in the query.

**Review Nov 4 (P5).** Checked: F74, each Purchasing receipt transition (`purchaseReceive`, `purchaseFinishReceipt`,
`purchaseReceiveAll`, `purchaseBillReceipt`, `prepareReceipt`) runs `check#Record` (the receipt's organization, and the
`receive` or `payableEdit` capability) and then the Mantle guard (`receive#ShipmentStock`, `close#ReceiptRemainder`,
`receive#ExpectedShipment`, `create#InvoiceFromSource`, `ensure#PurchaseReceipt`), each checking its permission and facility or
organization again, with no entity write of its own; a buyer posting `purchaseReceive` is refused (PurchasingAccess and the
walk), another organization's receipt RECORD_UNAVAILABLE. F75, the inspection actions under Purchasing are offered only
where Warehouse's `checkRecord` passes, and the included transitions call Warehouse's `check#Record` with the capability
before the Mantle verb, so Purchasing widens nothing. The 10/8/7/1/held scenario reads correctly. Fixes:
  - **R1 (medium)** `PurchaseReceipts.js` `inspectionSplit`: a re-inspection (rework of rejected, held stock) was ignored, so
    what it accepted stayed rejected for good (F78). A re-inspection's units now leave rejected while it is undecided and
    what it accepts returns to accepted; the Mantle spec gains the rework line (6 received, 2 rejected, 1 accepted again: 5
    accepted, 1 rejected). Shared/ShipmentDetail's Purchasing lines use the same split.
  - **R2 (medium)** `notify#LateReceipts` ran every organization in one transaction and one `lines` read capped at 2,000
    parts newest first (the oldest, likeliest late, dropped first). The job now runs each internal organization through
    `lib.probe` (its own transaction and error frame), logs a failing one and goes on, and warns when an organization is
    truncated; a failed part clears its errors. The spec runs the job path, then the organization's run finds it sent.
  - **R3 (low)** `lines` failure tolerance and cost (F79): the held and stock-factor reads ran through `lib.call`, whose
    failure left an error message that failed every later call; they now run in an error frame. The per-line scans of
    parts, receipts and sources (quadratic over 2,000 lines) are indexed; Home's late count, PurchaseOrders' Late view and
    the notice skip the per-line held read (`withoutHeld`). An empty set of internal organizations answers no lines (plain
    Mantle). Left: Receipts' Completed and All views still read held once per received line (up to 2,000 service calls).

### P6 — Bills and matching

Purchasing's mounts over Accounting's intake, holds and match (P6, P7), with the service lines and the buyer's actions.

- **Accounting's contract** (§4, PUR-MATCH), built by Manufacturing P14 and confirmed by P0:
  `mantle.account.InvoiceMatchServices.evaluate#InvoiceMatch` reads ServiceAcceptance under the match policy's
  service-acceptance rule, so a service line matches against its accepted quantity (R-PUR-09).
- **Screens** (design §10):
  - Bills: BillFind, BillList over `find#BillExceptions` and an authorized invoice find, and UploadSupplierBill over
    `mantle.account.InvoiceServices.import#Bill`, which takes a buyer's upload under `PAYABLE_IMPORT` as it takes AP
    intake's (§4; impl-accounting P6).
  - InvoiceDetail: Projects' `Shared/InvoiceDetail` with the Purchasing row of crosscut §3.16. Buyers investigate; a
    match operator applies; finance holds, approves and pays through Accounting's actions. "Allocate to receipts" opens
    Accounting's LandedCosts.
  - MatchExceptions: MatchFind, ExceptionList, ReevaluateMatch over `evaluate#InvoiceMatch` with a result per bill,
    RequestHoldRelease over `request#HoldRelease`, and the legacy match backfill of Accounting P7 for a holder of the
    match group, as Accounting offers it (§4).
  - InvoiceMatch: Accounting's `Shared/InvoiceMatch` with the Purchasing row of crosscut §3.22, for
    `BOSS_ACCOUNTING_MATCH`.
  - OrderDetail's Bills and match tab; Supplier360's Bills and payment summary tab.
- **Shell:** the match-exception notification topic; Home's blocked-bills count.
- **Usable when** (design §14.4 #1, the bill):
  - a supplier bill for 8 at a higher price, uploaded by a buyer from Bills, finds only the 7 accepted units eligible
    and holds on price variance, naming the rule;
  - the buyer who holds the match group applies the 7 and requests the hold's release; finance releases and approves;
  - a buyer without that group cannot apply, and no buyer can release a hold;
  - a second upload with the same supplier reference is refused, naming the first;
  - a service line's bill matches only after its acceptance;
  - the backfill run from Purchasing links a legacy bill line with one unambiguous receipt, and names one with two.

**Built Nov 4 (P6).**
- Mantle:
  - `service/mantle/order/PurchaseServices.xml` (appended) over the new `PurchaseBills.js`: `request#SupplierPrepayment`
    (R-PUR-36: a PmntPromised payment from the buying organization to the supplier through `add#OrderPartPayment`, at most
    the part's total less its linked payments, all of it when no amount is given; PAYABLE_EDIT in the buying organization;
    NOT_PURCHASE, ORDER_STATE_INVALID, AMOUNT_INVALID; operation key replay) and `notify#MatchException` (the
    PurchaseMatchException notice to the organization's PURCHASE_ORDER_EDIT users but the actor, through Payables.js
    `notify`; a failure is logged and the match stands).
  - `service/PurchaseMatch.secas.xml`: the notice after `apply#InvoiceMatch` placed a hold (not a replay) and after
    `reevaluate#InvoiceMatch` held the bill. `data/PurchaseMatchSetupData.xml`: the `PurchaseMatchException` topic.
  - `InvoiceServices.xml` `request#HoldRelease`: AP (PAYABLE_EDIT), a match operator (INVOICE_MATCH) or a buyer
    (PURCHASE_ORDER_EDIT) asks (F80); a receivable's hold is refused PAYABLE_ONLY (hold#Invoice places none).
  - Spec `test/order/PurchaseBills.spec.js` (2 features: the prepayment's permission, amounts, replay and state; the notice
    to the buyer and not the matcher, the release request by a buyer and a matcher and not a reader).
- BOSS:
  - `ironstone.purchasing.BillServices` (`Bills.js`): `find#Bills` (views Incoming, Awaiting approval, Held, Not matched,
    Approved not paid, Paid; by supplier, order, status and text; the match result, open holds and billed orders),
    `find#MatchExceptions` (Held bills, Match variances, Received not billed and Billed not received, the last two over the
    lines of the newest 100 approved orders with ordered, accepted (receipts, or a service line's acceptances) and billed, and
    who acts next), `reevaluate#Matches` (ReevaluateMatch, INVOICE_MATCH: evaluate#InvoiceMatch per bill in its own
    transaction, a stale applied match re-evaluated at once with reevaluate#InvoiceMatch, a result per bill),
    `get#BillDetail`, `get#OrderBills`, `get#SupplierBills`; Home's `heldCount`; the `billOrders` choice. Amounts: a bill's
    total to whoever sees order amounts or reads payables, its payments and unpaid amount to a finance reader only, else
    "Withheld". `Purchasing.js`: the `bill` record kind (a bill from a supplier in scope to a buying organization, opening
    Bills/InvoiceDetail), the capabilities `payableEdit` (PAYABLE_EDIT) and `landedCost` (ACCOUNTING_GL_POST), the P6 link
    paths; `get#Choices` takes `partyId`. `Orders.js`: PurchaseOrders' Received, not billed view (`unbilled`: an order with an
    accepted receipt that names no bill).
  - Screens: `Purchasing/Bills.xml` (tabs; the shared InvoiceDetail and InvoiceMatch hidden), `Bills/BillList.xml` (BillFind,
    BillList with saved finds, UploadSupplierBill over import#Bill after check#Record with `billImport`, opening the draft in
    InvoiceDetail), `Bills/MatchExceptions.xml` (MatchFind, the views, ReevaluateMatch on the selected bills, Ask to release
    per held bill, Match for the match group, and Link earlier bills: preview#/apply#LegacyMatches for INVOICE_MATCH holders,
    F26); `Shared/InvoiceDetail.xml`'s Purchasing branch with `template/PurchasingInvoiceDetail.xml` (header with status, match
    and hold chips; Match as primary for the match group; More: Allocate to receipts, Accounting's LandedCosts, for
    ACCOUNTING_GL_POST; holds with Ask to release; match exceptions, lines, orders and receipts billed, payments or "withheld",
    documents; `billChoices`, `billRequestRelease`); `Shared/InvoiceMatch.xml`'s Purchasing row (crosscut §3.22: the
    evaluation after check#Record with `match`, else not available; Purchasing's purchase-order choice; order links to
    Orders/OrderDetail; apply and unapply checked the same way); OrderDetail's Bills and match in
    `template/PurchasingOrderBills.xml` (one section-include in PurchasingOrderDetail.xml, three transition-includes in
    Shared/OrderDetail.xml: the order's bills, Upload supplier bill, Create draft bill (create#InvoiceFromSource, received or
    ordered basis, PAYABLE_EDIT), and Money for a finance reader with Request supplier prepayment); `Shared/Supplier360/Bills.xml`
    (Bills and payments: open and held counts, unpaid per currency for a finance reader, the last 50 bills); Home's Held bills
    card opens MatchExceptions' held view; PurchaseOrders' Received, not billed view.
  - Shell and data: `<notification-topic topic="PurchaseMatchException"/>`; BossSetupData's topic link to
    Bills/InvoiceDetail.
  - Specs: `PurchasingBills` (4: BillList's views and amounts with its html render; InvoiceDetail's held bill, the release a
    buyer asks for and payments withheld, with its html render; MatchExceptions' held and received-not-billed views, the
    re-evaluation's result per bill and the backfill preview, with its html render; OrderDetail's and Supplier360's bills and
    Home's count); PurchasingAccess gains the topic per group and a feature (a bill of another organization refused, the
    shared InvoiceMatch's html render for the match group and not for a buyer, the re-evaluation refused to a buyer); 14
    features. `PurchasingSpecLib.billFixture` (a Retail order from Ziddleman, 8 received, 7 accepted, the buyer's upload, AP's
    line and the match operator's apply). Acceptance `test/acceptance/Purchasing/PurchasingBillsWalk` (6: the usable-when items
    above); `routeFixtures` lists Bills/BillList, Bills/MatchExceptions and the two shared mounts (the Bills placeholder is
    gone).
- Tests run: Mantle PurchaseBills, AccountingPayables, AccountingMatching, PurchaseOrders, OrderProcureToPayBasicFlow,
  ProductionSubcontract (66 features, all pass); BOSS PurchasingBills, PurchasingAccess, PurchasingOrders,
  PurchasingSuppliers, AccountingMatching, AccountingPayables, AccountingAccess, ClientBilling, Billing,
  ManufacturingSubcontracting, ProductsSuppliers, WarehouseReceiving, WarehouseShipping (all pass; PurchasingBills 0.7 s,
  PurchasingAccess 4.3 s); acceptance PurchasingBillsWalk (6) and AppStructure (18), pass. `moqui lint --screens`: no idiom
  or hazard site in the changed screens (InvoiceMatch's one flagged site is its existing evaluation script).
- Decisions:
  - The match is the match group's (INVOICE_MATCH) in Purchasing too: InvoiceMatch, ReevaluateMatch and the legacy backfill
    show only to it; a buyer without it investigates on InvoiceDetail and MatchExceptions and asks for a release. No buyer
    places or releases a bill hold.
  - ReevaluateMatch evaluates each bill (read only) and re-evaluates an applied match that waits for it at once, as the job
    would (reevaluate#InvoiceMatch records the result, may hold on a source change and releases nothing).
  - The legacy backfill is a box on MatchExceptions (the design's LegacyMatches form), not a route of its own.
  - Create draft bill and Request supplier prepayment are AP's (PAYABLE_EDIT); no Purchasing group holds it, so they show to
    a user who is also in AP (F84). Create draft bill defaults to the accepted received basis.
  - The match-exception notice goes to the organization's buyers (PURCHASE_ORDER_EDIT), not to the supplier's buyer
    relationship alone, so a shared supplier's bill reaches each organization's own buyers.
- Findings (provisional):
  - **F80** `request#HoldRelease` needed PAYABLE_EDIT, which no buyer holds, so Purchasing's RequestHoldRelease (crosscut
    §3.22) could not ask; it now admits INVOICE_MATCH and PURCHASE_ORDER_EDIT too (a request, no new refusal), written into
    design-accounting's Holds and impl-accounting's AC-03.
  - **F81** Accounting's `find#BillExceptions` needs payables read (PAYABLE_VIEW, a report reader or admin); buyers hold
    none, so Purchasing's lists read the buying organizations' bills themselves (BillServices), the match group's
    PAYABLE_VIEW adding only the unpaid amounts and payments.
  - **F82** `import#Bill` keeps no link to the order it is given (it checks it and names it in the description) and takes
    one ItemExpense line for the amount, so an uploaded bill has no product line to match until AP keys its lines in
    BillDetail, and a bill is found by its order only once matched (OrderItemBilling). The walk has AP key the line.
  - **F83** `add#OrderPartPayment` checks no permission and BOSS grants no raw Mantle mutator (§2), so the prepayment is
    Mantle's new `request#SupplierPrepayment` over it, with PAYABLE_EDIT and the amount left on the part.
  - **F84** No Purchasing group holds PAYABLE_EDIT or ACCOUNTING_GL_POST: Create draft bill, Request supplier prepayment
    and Allocate to receipts show only to a Purchasing user who also holds Accounting's AP or GL group; the buyer uploads.
  - **F85** A receipt of an organization whose `receiptInvoiceSelfBilledOnly` is N (the demo's Retail) is billed by
    Mantle's receipt SECA when its shipment is delivered, so the specs receive without delivering; with the flag on (impl-
    accounting §4) only self-billing suppliers' receipts bill themselves.
  - **F86** Shared/InvoiceMatch linked its order lines through Accounting's `Records/OrderDetail` link and searched orders
    through Accounting's `choices`, which refuse a Purchasing user; the Purchasing row takes Orders/OrderDetail and its own
    `billChoices` transition.
  - **F87** F30 checked with a service PO: a service line's bill (item type ItemServiceProduct; there is no ItemService)
    has no eligible source until `accept#ServiceItem`, then matches on the accepted quantity.
  - **F88** Supplier360's Bills tab, like F50's, shows in the other apps' tab menus with its content hidden.
  - **F89** PurchaseOrders' Received, not billed view reads the orders of the newest 500 receipts that name no bill (all
    organizations, then the buyers' filter), and MatchExceptions' line views the newest 100 approved orders: bounded reads, so
    an older unbilled receipt can fall outside them.

**Review Nov 4 (P6).** Checked the Mantle and BOSS diffs against this section, §2, the brief, AGENTS.md and
Practices-App-Dev. `request#HoldRelease` (F80) only records the request and notifies INVOICE_HOLD_RELEASE holders; it
releases nothing. The bill's organization is checked and locked through InvoiceWorkflowLib `invoice`, and AP's path is
unchanged. The new PAYABLE_ONLY refusal can't be reached, because `placeHold` puts no hold on a receivable. Bills.js
(F81) withholds the total from a user who sees no amounts, and the unpaid amount and payments from anyone who is not a
finance reader ("Withheld", never zero). It shows no payment method or bank detail. Another organization's bill is refused
(RECORD_UNAVAILABLE), and Supplier360's bills go through `recordOf(supplier)`. `request#SupplierPrepayment` checks
PAYABLE_EDIT in the buying organization under lock, caps the amount at the part total less linked live payments, replays
the operation key, and its state check comes after the replay. The notify#MatchException SECAs skip a replayed apply
(`alreadyApplied`). They fire on reevaluate only when a hold is newly placed (`held` = placed). Notice failures are
caught and logged, and the SECAs use only Mantle (the topic is Mantle seed data; BOSS adds only the link). Recipients are
the PURCHASE_ORDER_EDIT agents of the bill's organization, excluding the actor. The Purchasing branches of
Shared/InvoiceDetail and InvoiceMatch apply only when appRoot is Purchasing. In Accounting, `orderDetailPath` still
resolves to Records/OrderDetail. The legacy backfill box and ReevaluateMatch show only for `can.match`, and the Mantle
services check INVOICE_MATCH again.
- R1 (medium, fixed in mr-mantle): `request#HoldRelease`'s widened check called `ec.user.hasPermission`, which refused a
  system administrator that `writeInvoice` had admitted and admitted a PROJECT_CLIENT user who held one of the
  permissions. It now uses InvoiceWorkflowLib `has`, the domain check. PurchaseBills now also checks that another
  organization's buyer is refused (ORGANIZATION_DENIED) and gets no notice, and that a replayed apply sends no second
  notice.
- Left for the lead (not changed): BillList and MatchExceptions don't narrow bills by supplier scope, the same as
  PurchaseOrders' lists. A bill from a supplier owned by another organization therefore lists, but opening it is refused.
  An apply that reuses an open match-exception hold (after an unapply) sends the notice again. The notice is sent inside
  the match's transaction, as Accounting's BillHoldRelease notice is. `reevaluate#Matches` calls
  `reevaluate#InvoiceMatch`, which has no permission check of its own, after BOSS's INVOICE_MATCH and organization check
  and Mantle's `evaluate#InvoiceMatch` for the same bill.
- Specs run: Mantle PurchaseBills (2), AccountingMatching (14), AccountingPayables (10), OrderProcureToPayBasicFlow (24);
  BOSS PurchasingBills (4), PurchasingAccess (14), AccountingMatching (4), AccountingPayables (8), AccountingAccess (8),
  ClientBilling (8), Billing (5). All pass.
- **Wave 4 suites (Nov 4, on master after P4, P5 and P6 merged):** standalone mr-mantle 1,596 passed, 2 failed (the
  baseline), 11 skipped; `./moq test-apps` 2,840 server features passed, 1 failed: ProjectsAccess found P6's
  `reevaluate#Matches` outside the client deny pattern, whose verb list now has `reevaluate` (fixed); client walks 12
  passed, 2 failed: WarehouseReceivingWalk's purchase order list stayed open over "Open receipt" once Purchasing's demo
  added order parts, so its `choose()` now closes the list as the other walks do (fixed); feature time mr-mantle 291 of
  300 s, mr-boss 236 of 220 s server (a warning, for the end's measured budget); `moqui lint --screens` clean.

### P7 — Drop-ship

PUR-DROPSHIP (design §18, R-PUR-17, R-SB-20), brought forward as an actively used Moqui Java feature, done the way Moqui
Java's `dropship-moqui` branch of mantle-udm and mantle-usl does it (F21; §4). That branch never merged into master, so
P7 ports it into mr-mantle and finishes it.

- **Mantle, ported from the branch:**
  - The drop-ship facility: facility type `FcTpDropShip`, owned by the supplier (`ownerPartyId`), with
    `assetAllowOtherOwner` Y, and `Facility.dropShipRemoteId` naming the SystemMessageRemote of the supplier's
    integration. The `CustomerShipFrom` and `VendorShipTo` order roles.
  - A sales line drops to a supplier by its reservation: the sales part's facility, or its store's, is the supplier's
    drop-ship facility, and `reserve#AssetsForOrder` reserves there as usual, against the supplier's stock or, with
    none, Mantle's shell asset with negative availability (F21).
  - `mantle.order.OrderServices.create#DropShipPurchaseOrder`, run beside `reserve#AssetsForOrder` in its SECA: for the
    sales lines reserved at a drop-ship facility, a PO cloned from the sales order. The link is Mantle's own fields:
    the PO's `OrderHeader.parentOrderId` is the sales order (`get#OrderDisplayInfo` lists it as a child order); each PO
    part has the facility's owner as vendor and the selling organization as customer, the end customer as a
    `CustomerShipTo` OrderPartParty and the sales part's ship-to contact mechs; notes, content and OrderItemWorkEffort
    are copied, and the lines priced by `recalc#OrderItemAmount` from the supplier's price. It then calls the
    remote's implementation of the `send#DropShipPurchaseOrderPart` interface.
  - `finalize#DropShipPurchaseOrder`, on the supplier's confirmation: the confirmed quantities and tracking code on the
    PO's shipment, shipped; then, through `parentOrderId`, the sales order's shipment found or created, packed with
    that tracking code and shipped, so Mantle's pack SECA invoices the customer.
- **Mantle's additions to the port**, where the approval gate's flag is on (§2); none calls BOSS:
  - the PO is placed and goes through P4's approval gate in `mantle.order.PurchaseServices`, where the branch approves
    it at once (Mantle's default stays for other organizations);
  - a drop-ship facility with no remote sends its PO by P3's `mantle.order.OrderServices.send#PurchaseOrder`;
  - a sales line the service passes over (no drop-ship reservation, an internal owner, two reservations) is named in
    its result, not only logged; a retry answers the first PO;
  - the buyer enters a confirmation from OrderDetail, which calls `finalize#DropShipPurchaseOrder`; the supplier's
    integration calls it itself, and P16 lets the supplier report it for the buyer's review;
  - the supplier bill comes through Accounting's intake and matches against the shipped drop-ship delivery
    (Accounting's contract in `mantle.account.InvoiceMatchServices`, §4, PUR-MATCH).
- **Routing a line to a supplier:** "Drop-ship from supplier" on a customer order line, offered where the supplier's
  price `canDropShip`, moves the line to that supplier's drop-ship facility and reserves there, in Mantle under
  `PURCHASE_ORDER_EDIT`, so the same service makes the PO. P10's RequestSourcing and P14's SupplyPlanning route customer
  demand the same way.
- **Screens:**
  - OrderDetail, in any app's context: on a customer order, each line's drop-ship state, its child PO and "Drop-ship
    from supplier" for a holder of `PURCHASE_ORDER_EDIT` (`BOSS_PURCHASING_BUYER`); on the PO, the customer, the parent
    sales order and "Confirm delivery".
  - PurchaseOrders: the Drop-ship view, with confirmation pending.
  - Supplier360's drop-ship setup: the supplier's drop-ship facility and its remote, for a purchase administrator.
- **Outputs:** the drop-ship PO print, with the customer's ship-to address and no buyer receiving address.
- **Usable when:**
  - a customer order line that reserves at ZiddlemanInc's drop-ship facility makes a PO to ZiddlemanInc whose parent is
    the sales order, shipping to the customer; a line reserved in ZIRET_WH stays with the warehouse;
  - the PO waits for P4's approval and goes out by email to a supplier with no remote;
  - confirming delivery with a tracking code ships the PO's shipment, and packs and ships the sales shipment with that
    tracking code, invoicing the customer once; a retry changes nothing;
  - "Drop-ship from supplier" on a line of a product with a drop-ship price makes the same kind of PO;
  - the buyer's warehouse stock is unchanged, and the supplier bill matches against the shipped delivery.

**Built Nov 4 (P7).**
- Mantle, the port (Moqui Java's `dropship-moqui` branch, F21, F37):
  - `entity/DropShipEntities.xml`: Facility `dropShipRemoteId` (with its SystemMessageRemote relationship) and the stored
    line link of F38, `OrderItem.salesOrderId` and `salesOrderItemSeqId` (indexed): a drop-ship purchase order line names
    the customer line it ships. `data/DropShipSetupData.xml`: `FcTpDropShip`, the `CustomerShipFrom` and `VendorShipTo`
    roles in RgpOrder, and the transaction type `AttDropShipDelivery`.
  - `OrderServices.xml` (appended, the branch's names kept for integrations): the `send#DropShipPurchaseOrderPart`
    interface, `create#DropShipPurchaseOrder` and `finalize#DropShipPurchaseOrder`, over the new `DropShip.js`.
    `DropShip.secas.xml` OrderApprovedDropShip calls create once the sales approval (with its `reserve#AssetsForOrder`)
    commits (review R1).
  - create: the lines of an approved sales order reserved at a drop-ship facility (its stock or the shell asset), one
    purchase order per sales part and facility (P3's one purchase part per PO): `parentOrderId` the sales order, the part
    from the facility's owner to the selling organization at the facility with the sales part's ship-to address, phone and
    shipping, the end customer as `CustomerShipTo`, the ship-to contact mechs; each line at the supplier's current price
    read by the order's own rule (F91, review R2) with `otherPartyProductId` the supplier's item code and the link; the lines'
    content and work efforts and the order's notes that are not internal copied; placed; with the buying organization's
    gate on left at Placed and sent to its first step's approvers (P4's notice), else approved at once (F40). A line already
    on a live drop-ship order answers it (a retry); a line meant to drop that cannot is named in `skippedItems`
    (NO_RESERVATION, RESERVATION_SPLIT, NO_SUPPLIER, INTERNAL_OWNER, or the buying policy's stop such as SUPPLIER_BLOCKED,
    review R4) and logged; an order with a line with no price stays Open, named in `unpricedItems` (review R3). An order
    approval with no drop-ship facility anywhere costs one count of them (review R1).
  - finalize (PURCHASE_ORDER_EDIT in the buying organization, F97): the order's own delivery, a ShpTpPurchase shipment
    from the drop-ship facility to the customer's address with the confirmed lines, package and tracking code, shipped and
    never received (F38); the linked sales lines packed by their link on their part's open sales shipment or a new one
    (F38's part fix), the tracking code on its package, packed (Mantle's pack SECA invoices the customer) and shipped; the
    cost posted (F39, below); the order completed once delivered in full. Quantities by line, or by product as the branch's
    integrations send them (PRODUCT_AMBIGUOUS for a product on two lines), else what is left; NOT_DROP_SHIP,
    ORDER_NOT_APPROVED, ITEM_UNAVAILABLE, QUANTITY_EXCESS; an order delivered in full answers its delivery and changes
    nothing (alreadyApplied).
- Mantle's additions:
  - F39, the cost: finalize posts one `AttDropShipDelivery` transaction per delivery, debit the cost of goods sold
    (GatCogs) and credit Unreceived Inventory (GatUnreceivedInventory) at the order's prices, with the shipment and the
    supplier, `reviewed` (Mantle's own posting); a missing account puts it in the error journal. Chosen over billing
    drop-ship lines to a COGS item type because it is the receipt's own posting with Inventory skipped: the supplier's bill
    debits Unreceived Inventory as for any stock purchase (the bill path, its item types and the match are unchanged), the
    cost reaches COGS when the goods reach the customer, the period the sale is invoiced (the pack SECA), whatever the
    bill's timing, and the sales issuance of the shell asset posts nothing (AtrNoAcquireCost), so nothing is counted twice.
    A bill price differing from the order's stays in Unreceived Inventory, as for a received line (F95).
  - F40, the send: `service/DropShip.secas.xml` OrderApprovedDropShip (tx-commit on `update#OrderHeader` to Approved) calls
    `mantle.order.DropShipServices.handle#OrderApprovedDropShip`, which makes a sales order's drop-ship orders (review R1)
    or calls `send#DropShipPurchaseOrder` once an approval commits, the sales order's (gate
    off) or `decide#PurchaseApproval`'s (gate on): the facility's remote's send service, then Sent, else email by
    `send#PurchaseOrder`'s path (`PurchaseOrderDocuments.js issue`, the send without the user's checks: the approver need not
    be a buyer). A failure is logged and the order stays Approved for the buyer to send (F92).
  - `service/mantle/order/DropShipServices.xml` over `DropShip.js`: `route#OrderItemToDropShip` ("Drop-ship from
    supplier", PURCHASE_ORDER_EDIT in the selling organization: a supplier the organization may buy from and the policy
    does not stop, a current canDropShip price (NOT_DROP_SHIPPABLE), a drop-ship facility (NO_DROP_SHIP_FACILITY); the line
    moves to its part at the facility (the part itself when it is the part's only line, else a new part with the customer,
    ship-to and shipping, F93), is reserved there again and, on an approved order, bought at once; LINE_SHIPPED,
    ALREADY_DROP_SHIPPED, ORDER_STATE), `send#DropShipPurchaseOrder`, `get#OrderDropShip` (an order's drop-ship state for a
    purchasing user of its organization: a customer order's lines with their state, purchase order and the suppliers a
    buyer may drop each from; a drop-ship order's customer, ship-to, parent order, tracking and delivered and remaining
    quantities), `store#DropShipFacility` (PURCHASE_POLICY_EDIT; FcTpDropShip owned by the supplier with
    `assetAllowOtherOwner` and `assetAllowIssueOverQoh` Y, F90; REMOTE_INVALID, FACILITY_INVALID) and `get#DropShipSetup`.
  - The match (Accounting's contract, PUR-MATCH): `InvoiceMatch.js` takes a drop-ship line's confirmed delivery as its
    evidence on the received basis, as a receipt (proposal, base, MISSING_RECEIPT naming the delivery, the ordered basis's
    receipt-required exception), read through `DropShip.js deliveredQuantity`; every other line is unchanged.
  - `PurchaseReceipts.js` leaves drop-ship lines out of expected receipts (never received, else every one is late); the PO
    print (`PurchaseOrderDocuments.js`, `PurchaseOrder.print.html.fancy`) shows a drop-ship order's "Drop-ship to" customer
    and address in place of the receiving facility.
  - Spec `test/order/DropShip.spec.js` (5 features, 2.6 s): the order on approval with its parent, part, ship-to, link,
    email and print, the warehouse line left, a retry; the delivery's shipments, tracking, one invoice, the posted
    COGS/Unreceived transaction, the shell issuance posting nothing, completion, a retry, PERMISSION_DENIED and
    RECORD_UNAVAILABLE; the bill matched against the delivery; the gate's Placed, notice and send after the decision; the
    routing with NOT_DROP_SHIPPABLE, ALREADY_DROP_SHIPPED and PERMISSION_DENIED.
- BOSS:
  - `template/PurchasingOrderDropShip.xml`: OrderDropShip (a customer order's drop-ship lines in any app's OrderDetail for a
    purchasing user, with each line's state chip, purchase order and Drop-ship from supplier; in Purchasing its own header,
    in place of "not available") and PurchasingOrderDropShip (a drop-ship order's customer, ship-to, facility, tracking,
    customer order link and lines with Confirm delivery and Confirm line); transitions `dropShipLine` and
    `confirmDelivery` (check#Record buy, then finalize). `Shared/OrderDetail.xml` reads `get#OrderDropShip` into `dropShip`,
    includes the two transitions and the section; `PurchasingOrderDetail.xml` includes the PO section and shows "not
    available" only when the order is no customer order with drop-ship lines.
  - PurchaseOrders' Drop-ship view (`Orders.js` `dropship`: placed and open orders with a drop-ship line); MatchExceptions'
    line views count a drop-ship line's delivery as its accepted quantity (`Bills.js`).
  - Supplier360's Drop-ship tab (`Shared/Supplier360/PurchasingDropShip.xml`, menu index 12): the supplier's drop-ship
    facilities and their integration, Add and Change for a purchase administrator after check#Record `policyEdit`.
  - Demo (`BossPurchasingDemoData.xml` P7 block): Ziddleman's drop-ship facility `BOSS_PUR_DROPSHIP` (no integration, so
    its orders are emailed) and its DEMO_3_1 price marked canDropShip.
  - Specs: `test/Purchasing/PurchasingDropShipLib.js` (a customer order of Retail's at the drop-ship facility and ZIRET_WH,
    approved; the wait for the send's worker), `PurchasingDropShip` (2: the Drop-ship view; Supplier360's Drop-ship tab's
    html render for the administrator and the buyer), PurchasingAccess gains the drop-ship setup's case (holder,
    non-holder, another organization's supplier; 17 features). Acceptance `test/acceptance/Purchasing/PurchasingDropShipWalk`
    (5, the usable-when items, with OrderDetail's html renders of both orders).
- Tests run: Mantle DropShip, OrderToCashBasicFlow, OrderProcureToPayBasicFlow, AssetReservationMisc,
  AssetReservationMultipleThreads, ReturnToResponseBasicFlow, PurchaseOrders, PurchaseReceipts, PurchaseApprovals,
  PurchaseBills, AccountingMatching, AccountingPayables, WarehouseReceiving, OrderLifecycle, OrderBulk, CrmMiscServices,
  WorkProjectRequests (157 features, all pass); BOSS PurchasingDropShip, PurchasingAccess, PurchasingOrders,
  PurchasingSuppliers, PurchasingBills, PurchasingReceiving, PurchasingApprovals, PurchasingReplenishment,
  AccountingPayables, WarehousePicking, ManufacturingSubcontracting, ClientBilling, Billing, ProductsSuppliers,
  WarehouseReceiving (all pass); client PurchasingOrdersWalk (pass); acceptance PurchasingDropShipWalk (5, pass). `moqui
  lint --screens`: no idiom or hazard site in the new and changed screens (informational anchors only).
- Decisions:
  - One drop-ship purchase order per sales part and drop-ship facility (the branch made one order with a part per sales
    part); a sales part has one facility, so a part's drop-ship lines share a supplier.
  - The F39 posting at the delivery (above), not a COGS item type on the bill.
  - The send after the approval commits, whichever approval it is, so a supplier's integration or mail server never undoes
    a sales or purchase approval; the branch called the remote inside the sales approval. Since review R1 the purchase
    order is also made after the sales approval commits, not inside it.
  - finalize needs PURCHASE_ORDER_EDIT (the branch checked nothing); `create#DropShipPurchaseOrder` checks none, as the
    SECA runs as the sales order's approver.
  - The confirmation without line quantities confirms every line left; Confirm line takes one line's quantity.
- Findings (provisional):
  - **F90** Mantle's pack issues a reservation only up to its asset's quantity on hand unless the facility has
    `assetAllowIssueOverQoh` Y; the shell asset holds nothing, so a drop-ship facility needs it beside `assetAllowOtherOwner`
    (the branch's README leaves it out). `store#DropShipFacility` and the demo set both; the design's setup says so.
  - **F91** `recalc#OrderItemAmount` resolves a price as the current user, and the SECA runs as the sales order's
    approver, who seldom reads supplier prices: the branch's PO line kept the sales price. create reads the supplier's
    current price row itself with the resolver's eligibility (review R2: the order's currency, no store, agreement or term
    scope, the line's unit; the organization's row before the supplier's general one, the highest minimum quantity
    reached, the latest), and leaves an order with an unpriced line Open (R3).
  - **F92** A tx-commit SECA runs on a service worker in a context of its own, so the drop-ship send is not in the
    approver's request: specs wait for the worker (`ec.factory.waitWorkerPoolEmpty`), and a send that fails leaves the
    order in Approved, not sent for the buyer.
  - **F93** Drop-ship from supplier on a line that shares its part makes a new sales part; `update#OrderPartTotal`
    lowers a single promised payment of the original part to its new total, so route gives the new part a payment by the
    same method for its total (review R5). An authorized payment cannot be split and stays on the original part, so a
    moved line's share of it is the order's to settle.
  - **F94** A customer line changed or cancelled after its drop-ship order is made does not change that order; the
    buyer revises or cancels it (P9's revisions); cancelling the sales order leaves its drop-ship orders open.
  - **F95** A bill price above or below the order's leaves the difference in Unreceived Inventory, as for a received
    line (Mantle posts no purchase price variance); Accounting's price tolerance holds such a bill.
  - **F96** The delivery's transaction is in the order's currency; `post#AcctgTrans` converts it to the organization's
    base currency (AC-19), or holds it in the error journal with no rate.
  - **F97** finalize is refused to an integration user without PURCHASE_ORDER_EDIT in the buying organization; a
    supplier integration's user needs the permission (the Supplier app's report for review is P16's).
  - **F98** Mantle's receipts worklist and the bills' received-not-billed and billed-not-received views read receipts:
    drop-ship lines are left out of the first and read their delivery in the others.
  - **F99** ss-inventory.md and usl-inventory.md have no rows for the drop-ship forms and services (the branch's
    services were never in Mantle's master), so P7 fills no Implemented-in cell.

**Review Nov 4 (P7).** Checked the diff in both repos against this section, §2, design §18, F21 and F37–F40, AGENTS.md and
Practices-App-Dev: Mantle's defaults for an organization with no drop-ship facility, the GL of F39, F40's transactions and
failure tolerance, the supplier price row, finalize's permission and route. Fixes:
- **R1 (high)** create ran inside the sales order's approval (OrderApprovedReserveAssets, post-service): any failure in it
  (a write, a SECA of the purchase order) marked the transaction for rollback and undid the sales approval, and the
  framework has no savepoint to contain it. The purchase order is now made once the sales approval commits:
  `DropShip.secas.xml` OrderApprovedDropShip (tx-commit) calls the new `handle#OrderApprovedDropShip`, which sends a
  drop-ship purchase order or, for any other order, counts the drop-ship facilities (0: returns; the one query an
  organization without drop-ship pays, off the approval's transaction) and runs create in a transaction of its own; a
  failure is logged naming the sales order and its lines (verified with an injected throw: the sales order stays Approved,
  no partial purchase order, the line named). create locks the sales order so the approval's run and a route's make one
  order per line. `ProductAsset.secas.xml` is back to master's; one worker dispatch per approval, as the send already had.
  The specs wait for the purchase order as they did for the send.
- **R2 (medium)** create's price row (F91) took rows `get#ProductPrice` never would: a store's, an agreement's or a
  term's price, a row with no currency, another unit's, and a null price; ties went to whichever row came first. It now
  uses the resolver's eligibility (PriceResolver.js `typed`) and order. Reusing `get#ProductPrice` is not feasible: it
  withholds supplier rows from a user without SUPPLIER_PRICE_VIEW, and the create runs for no particular user.
- **R3 (medium)** A line with no supplier price was bought at zero, and with the gate off the order was approved and
  emailed at zero (Mantle's auto-approval also approves a placed order of zero total). Such an order now stays Open, named
  in `unpricedItems`, for the buyer to price and place; its approval then sends it.
- **R4 (medium)** create bought from a supplier the buying policy stops (blocked, suspended, unapproved under Stop), which
  route and the purchase order screens refuse; such lines are now passed over with the policy's reason code.
- **R5 (medium)** route (F93) moved a line to a new part without its child items (discounts, tax), so both parts' totals
  were wrong, and the original part's promised payment was lowered with nothing to collect the moved line; the children
  now move with it and the new part gets a payment by the same method for its total.
- **R6 (low)** `get#DropShipSetup` read any supplier's facilities; another organization's supplier is now refused
  (SUPPLIER_UNAVAILABLE), as `store#DropShipFacility` does.
Checked and kept:
- GL (F39, F95): a received line behaves the same. Its receipt credits Unreceived Inventory at the asset's acquire cost
  (the order price) and the bill debits it at the bill price, and nothing in matching or approval clears a difference
  (Mantle posts no purchase price variance; landed cost only spreads charge lines). So drop-ship leaves no residue a
  received line would not. A PPV posting for both belongs to Accounting, not P7. The delivery's posting goes through
  `post#AcctgTrans` (period checks, the review guard, currency conversion to the base currency with AC-19's error-journal
  fallback, F96); a closed period refuses the confirmation as a whole.
- F40: in create's transaction the gate leaves the purchase order at Placed and notifies; with the gate off it is approved
  by `update#OrderStatus` (no `approve#Order`); the send is on its own approval's commit.
- F97: finalize's PURCHASE_ORDER_EDIT is acceptable without a flag. The service is new to mr-mantle, with no Mantle or
  BOSS caller before P7, and §2 asks a new Mantle service to check its permission; the branch's integrations never ran
  against Mantle master. Recorded as F97.
- Mantle defaults: InvoiceMatch.js, PurchaseReceipts.js and the PO print change only lines with `salesOrderId` or orders
  with a parent order. Every other line reads one field and loads nothing.
- Left for the lead: OrderDetail shows a drop-ship line whose order could not be made (R1's failure, a stop) as "drops
  when approved" on an approved order. The buyer's way back is create#DropShipPurchaseOrder again (idempotent) or route,
  and no screen offers it. F94 stands.
- Specs: Mantle DropShip (6 features, 3.3 s; adds the unpriced and blocked lines, decoy price rows, the payment split and
  the setup refusal), OrderToCashBasicFlow, OrderProcureToPayBasicFlow, AssetReservationMisc,
  AssetReservationMultipleThreads, ReturnToResponseBasicFlow, AccountingMatching, AccountingValuation, AccountingDelivery,
  PurchaseApprovals, PurchaseOrders, OrderLifecycle; BOSS PurchasingDropShip, PurchasingAccess, PurchasingOrders,
  PurchasingBills, WarehousePicking: all pass; acceptance PurchasingDropShipWalk (5, its lib changed): pass.

### P8 — Supplier returns

- **PUR-RETURN, the rest.** Warehouse P14 built `mantle.order.ReturnServices.find#ReturnableReceipts` and the receipt
  link. Here:
  - `ironstone.purchasing.ReturnServices.find#SupplierReturns`;
  - `mantle.order.ReturnServices.create#ReplacementOrder` (`PURCHASE_ORDER_EDIT`): a linked PO, and its expected
    receipt through `ensure#PurchaseReceipt`.
- **Screens** (design §9):
  - Returns: ReturnFind, SupplierReturnList, and NewSupplierReturn over `find#ReturnableReceipts` and
    `create#ReturnFromOrder`, eligible quantities by receipt and lot.
  - ReturnDetail: Accounting's `Shared/ReturnDetail` with the Purchasing row of crosscut §3.18: Authorization and RMA,
    source quantities, outbound shipment, replacement, credit or refund read only, and evidence on ReturnContent.
  - OrderDetail's Returns tab; Supplier360's Returns tab.
- **Outputs:** the supplier return authorization.
- **Usable when** (design §14.4 #4, the supplier side):
  - the rejected unit of P5 is returned with the supplier's RMA, and a second return of the same receipt and lot is
    refused past its eligible quantity;
  - Warehouse ships it and the return shows ReturnShipped; Accounting's settlement credits the billed portion only;
  - a replacement opens a linked PO with its expected receipt;
  - a return of unbilled quantity lowers the match-eligible receipt and needs no credit.

**Built Nov 4 (P8).**
- Mantle:
  - `service/mantle/order/ReturnServices.xml` (appended) over the new `PurchaseReturns.js`: `authorize#SupplierReturn`
    (RETURN_AUTHORIZE in the return's buying organization, FacilityScope; a created or requested supplier return with
    items is approved with the supplier's RMA in `ReturnHeader.supplierRmaId`, so Mantle's ReturnApprovedProcess makes its
    ShpTpPurchaseReturn shipment; on an authorized return a new RMA number only, RMA_RECORDED, else ALREADY_AUTHORIZED;
    NOT_SUPPLIER_RETURN, RECORD_UNAVAILABLE, RETURN_CLOSED, RETURN_EMPTY) and `create#ReplacementOrder`
    (PURCHASE_ORDER_EDIT; an authorized supplier return's items asking for a replacement, or the lines given, for at most
    what was neither credited nor replaced: a purchase order from the supplier at no price, placed and approved, each item's
    `replacementOrderId` and `replacedQuantity` (which `settle#Return` leaves out of the credit), an item shipped and fully
    settled completed, and the expected receipt through `ensure#PurchaseReceipt` at the return's facility; operation key
    replay on the posting guard; RETURN_NOT_APPROVED, RETURN_ITEM_UNAVAILABLE, DUPLICATE_LINE, NOTHING_TO_REPLACE,
    QUANTITY_INVALID, QUANTITY_EXCEEDS_ELIGIBLE). No existing Mantle service or SECA changed.
  - Spec `test/order/PurchaseReturns.spec.js` (2 features, about 0.6 s).
- BOSS:
  - `ironstone.purchasing.ReturnServices` (`ReturnServices.xml`, `Returns.js`): `find#SupplierReturns` (views Open, To
    authorize, To dispatch, Awaiting credit or replacement, Completed, Cancelled; by supplier, order, receipt, status,
    organization and text over the return, the supplier's RMA and our reference; the physical state from the outbound
    shipment and the credit and replacement state apart; a credit's amount for a finance reader only, "Withheld"
    otherwise) and `get#ReturnDetail` (Shared/ReturnDetail's Purchasing context: the header with the RMA, orders and
    states; the items by source receipt and lot with authorized, sent back, credited and replaced; the outbound shipment
    with its tracking; the replacement orders with their expected receipts; Accounting's `preview#ReturnSettlement` read
    only for a finance reader; the eligible receipts by receipt and lot through `find#ReturnableReceipts` while it is
    created or requested; the actions by capability and status). Choices `returnOrders` (approved, sent, processing or
    completed purchase orders with a receipt, of a supplier), `returnReceipts` (an order's eligible receipts by receipt and
    lot), `returnReasons`, `returnResponses` (Credit, Replace); `get#Choices` takes `orderId`. `Purchasing.js`: the
    `supplierReturn` kind's destination `Returns/ReturnDetail` (so `get#RecordLink` now opens a supplier return under
    Purchasing for a Purchasing user, and still falls through to Warehouse's for anyone else), its palette find (return,
    RMA, reference), the P8 link paths.
  - Screens: `Purchasing/Returns.xml` (tabs; the shared ReturnDetail hidden), `Returns/SupplierReturns.xml` (ReturnFind,
    SupplierReturnList with saved finds and views, NewSupplierReturn: supplier, purchase order, receipt and lot with what it
    allows, quantity, reason, credit or replacement, the supplier's RMA, our reference; `create#ReturnFromOrder` and
    `add#ReceiptToReturn` after `check#Record` of the order with `buy`; opens ReturnDetail), `Returns/ReturnAuthorization.xml`
    (the supplier return authorization, html-print, no prices); `template/PurchasingReturnDetail.xml` (Shared/ReturnDetail's
    Purchasing branch and its transitions `purchasingReturnChoices`, `purchasingAddReceipt`, `purchasingAuthorizeReturn`,
    `purchasingCancelReturn` (before authorization, `cancel#Return`), `purchasingReplaceReturn`: the record header with
    Authorize (and the RMA), Record RMA, Print authorization and Cancel return; Eligible receipts with Add; Items with
    Replace and the replacement order's link; Outbound shipment; Replacement orders with their expected receipts; Credit read
    only; Files (ReturnContent) and Conversation); `template/PurchasingOrderReturns.xml` (OrderDetail's Returns: the
    order's returns and Return to supplier, one section-include in `template/PurchasingOrderDetail.xml`);
    `Shared/Supplier360/PurchasingReturns.xml` (the Returns tab, menu index 10, Purchasing only). Shared/ReturnDetail gains
    the Purchasing branch (its service call, transition-includes and section-include).
  - Specs: `PurchasingReturns` (3: NewSupplierReturn with the RMA, refused past the receipt's eligibility and without buy;
    SupplierReturns' views and filters with its one html render; ReturnDetail's eligible receipts and item, the
    authorization with the RMA, with its one html render; about 0.9 s); PurchasingAccess gains a supplier return's scope,
    its authorization for RETURN_AUTHORIZE only and its record link (17 features); `PurchasingSpecLib.returnFixture` and the
    Returns routes and mount. Acceptance `test/acceptance/Purchasing/PurchasingReturnsWalk` (4, the usable-when items);
    AppStructure's placeholder floor 57.
- Tests run: Mantle PurchaseReturns (2, pass); BOSS PurchasingReturns, PurchasingAccess, PurchasingOrders,
  PurchasingSuppliers, PurchasingBills, WarehouseReturns, WarehouseAccess, AccountingAccess (all pass); acceptance
  PurchasingReturnsWalk (4) and AppStructure (18), pass. `moqui lint --screens`: no idiom or hazard site in the changed
  screens (informational anchors only).
- Decisions:
  - A buyer works supplier returns: creating one and adding receipts is `buy` (PURCHASE_ORDER_EDIT, which
    `add#ReceiptToReturn` checks again), authorizing it is RETURN_AUTHORIZE (`BOSS_PURCHASING_BUYER` and the administrator
    hold it, Manufacturing P14), cancelling it before authorization is `buy`. Warehouse sends back and ships
    (`issue#SupplierReturnStock`, `ship#SupplierReturn`), Accounting settles; Purchasing shows both read only.
  - Purchasing's authorization is its own Mantle service, `authorize#SupplierReturn`, not Customer Service's proposed
    `ReturnPolicyServices.authorize#Return` (not built; its policy and `responseImmediate` concern customer returns, F101).
  - A replacement is a purchase order at no price, approved by `create#ReplacementOrder` itself (as Mantle's customer
    replacement is), not through `decide#PurchaseApproval`: it commits no new spend and replaces goods of an approved
    order, so the buying policy's approval gate does not apply to it.
  - A credit's amount (and the settlement preview) shows to a finance reader only (ACCOUNTING_VIEW or PAYABLE_VIEW); every
    list reader sees the quantities authorized, sent back, credited and replaced.
  - OrderDetail's Return to supplier opens SupplierReturns with the order chosen for New supplier return; OrderDetail has no
    return transition of its own. The outbound shipment shows inside ReturnDetail (no Purchasing mount of a supplier return
    shipment, F105).
- Findings (provisional):
  - **F100** `create#ReturnFromOrder` and `cancel#Return` check no permission (Mantle's raw mutators); Purchasing calls
    them after `check#Record` with `buy`, as Warehouse calls `create#Return`, and `add#ReceiptToReturn` checks
    PURCHASE_ORDER_EDIT again. A guarded Mantle create and cancel of a supplier return would make the rule Mantle's.
  - **F101** Mantle's `respond#ReturnItems` answers nothing for a supplier return ("Cannot process return responses for
    supplier purchase return"), so ReturnApprovedProcess only makes the shipment and a Replace response orders nothing by
    itself: the replacement is `create#ReplacementOrder`'s, as design §9 says.
  - **F102** ReturnHeader has the supplier's RMA number (`supplierRmaId`) but no RMA expiry or supplier instructions
    field; design Returns' "RMA expiry, attachment and supplier-approved instructions are recorded" are a file
    (ReturnContent, type Authorization) and the conversation for now.
  - **F103** (decided Nov 4 by the user: a correction of the match base, no flag; built in the P8 review, R2) Accounting's match base (`InvoiceMatch.js`, `get#SourceInspectionStatus`) takes out only what inspection
    removed (scrapped, or sent back under a Return to supplier disposition). A rejected unit returned that way leaves the
    receipt's match (the walk: 8 received, 7 match-eligible), but a supplier return of released, unbilled stock does not
    lower the receipt's match base, so a later bill could still match it. Changing it is a new refusal in Accounting's
    match (behind its flag); left for the lead and Accounting.
  - **F104** An unbilled supplier return has nothing to settle (`preview#ReturnSettlement` answers no line), so it stays
    ReturnShipped with its quantity open unless it is replaced; there is no "close without credit" for it.
  - **F105** No Purchasing mount shows a supplier return's ShpTpPurchaseReturn shipment (Receiving/ShipmentDetail's
    Purchasing branch is purchase receipts); ReturnDetail shows its status, quantity sent back and tracking.
  - **F106** ReturnItem has one `replacementOrderId`: a second replacement of the same item moves the link to the new order
    (`replacedQuantity` keeps the total).
  - **F107** `settle#Return` refuses a credit against a bill not finalized (CREDIT_SOURCE_INVALID); the walk approves the
    supplier's bill before Accounting settles.

**Review Nov 4 (P8).**
- Checked: `authorize#SupplierReturn` (RETURN_AUTHORIZE, the return's buying organization through FacilityScope, a supplier
  return only, closed and empty returns refused; idempotent by status, so no operation key) and `create#ReplacementOrder`
  (PURCHASE_ORDER_EDIT through the posting guard, organization, operation replay before and after the lock, a supplier
  return only, open quantity under lock). The replacement's approval without `decide#PurchaseApproval` cannot approve a
  priced order: the service creates the order itself (no orderId in), every line is `add#OrderProductQuantity` with
  `unitAmount` 0 (not null, so no price lookup; isModifiedPrice Y), and a purchase order gets no adjustment on place; its
  `update#OrderStatus` to OrderApproved is reached only for that new order. Purchasing edits a purchase order only while
  OrderOpen, so the approved replacement cannot be repriced today (a P9 note below). Every Purchasing path to the raw
  `create#ReturnFromOrder` and `cancel#Return` (F100) runs `check#Record` with `buy` first: `newSupplierReturn` (the order)
  and `purchasingCancelReturn` (the return, before authorization); the other transitions (`purchasingAddReceipt`,
  `purchasingAuthorizeReturn`, `purchasingReplaceReturn`) do too, and Shared/ReturnDetail's Purchasing transitions posted
  under another app's mount meet the same check#Record (which needs the Purchasing capability whatever the appRoot).
  Restricted values: a credit's amount and the settlement preview for a finance reader only, "Withheld" otherwise, in
  find#SupplierReturns, get#ReturnDetail and their screens; the authorization print shows no price.
- R1 (low, test): `PurchaseReturns.spec.js` now turns the buying policy's approval gate on before the replacement and
  checks the order's grand total is zero and the part approved (the deliberate exception to the gate, D8), and its header
  no longer says Mantle orders a replacement at authorization.
- F103 confirmed (the analysis that went to the lead; decided Nov 4 and built as R2 below): the match base is
  `mantle/account/InvoiceMatch.js` `receiptsOf` / `checkAllocation` (`accepted - held - inspectionRejected`, both the
  order-line `base` and the `receiptBase`), fed by `mantle/product/Quality.js` `sourceStatus` (get#SourceInspectionStatus),
  whose `inspectionRemovedQuantity` counts only scrap and a Return to supplier disposition's `returnedQuantity` (raised by
  `ReturnStock.js` `issueSupplierReturn` only for held stock). A supplier return of released stock (ReturnItem.assetReceiptId,
  issued through `issue#SupplierReturnStock`) lowers nothing, so the plan's "a return of unbilled quantity lowers the
  match-eligible receipt" does not hold today: a later bill still matches goods that went back (in the walk's third feature
  3 released units go back, 2 unbilled, and nothing takes those 2 out of the receipt's base). A correct base is not simply "less shipped
  returns": `settle#Return` credits a return against the order line's billed quantity first (orderCap) and leaves a
  replacement uncredited, so the base must take out, per receipt, what supplier returns shipped of it less what their
  credits (standing ReturnItemBilling) and replacements (`replacedQuantity`) settled, less what the dispositions already
  took out (to avoid counting a disposed unit twice). Taking out returned-but-credited units would instead turn the original
  bill's match into an exception on its next re-evaluation, and a replaced unit's original bill likewise. Nothing queues a
  match re-evaluation when released stock ships back or a return is credited or replaced (only the disposition path calls
  `queue#MatchReevaluation`). It changes the eligible quantity of bills of organizations already using Warehouse P14's
  supplier returns, so Accounting should decide it (as a base correction like P8 review B2, or behind a match-policy flag).
- R2 (medium, F103 as decided): `InvoiceMatch.js` `receiptsOf` now takes `supplierReturned` out of each receipt's base
  (`checkAllocation`'s line and receipt bases, `propose`), from the new `supplierReturnedOf`: per receipt, what supplier
  return items naming it issued to their return shipments, less the Return to supplier dispositions' `returnedQuantity`
  (`get#SourceInspectionStatus` now gives it apart as `returnedToSupplierQuantity`), less `replacedQuantity`, less what
  billing links (OrderItemBilling) of any bill take of the receipt, at least zero. The credited quantity needs no term of
  its own: a credit is of billed units, which the billed term already covers, so a billed-then-credited unit keeps the
  original bill matched before and after its credit, and a replaced unit too. The match's source rows show
  `supplierReturnedQuantity`. Re-evaluation: `issue#SupplierReturnStock` queues the receipt's matches when it sends back
  released stock, `create#ReplacementOrder` when it replaces an item with a receipt (a failure to queue is logged, the
  posting stands); `settle#Return` already queued the credited bill. Cheap without supplier returns: one indexed read of
  ReturnItem by `assetReceiptId`. A limit, recorded: which units a bill is for is not known, so once bills link the receipt
  for more than was kept, a later bill may match returned units, as settlement then credits them (the same billed-first
  rule). Spec `PurchaseReturns` gains two cases (eight received, two sent back unbilled: a bill for eight is refused past
  six and holds when applied for six; a billed return keeps its bill matched after the ship and the credit, and an unbilled
  return replaced lets the bill for eight match again); without the base change the first fails. Design-accounting's
  InvoiceMatch states the rule. Specs after R2, all pass: Mantle PurchaseReturns (4), AccountingMatching (14),
  AccountingPayables (10), the ReturnToResponseBasicFlow run (55), WarehouseReturns (5); BOSS PurchasingReturns (3),
  PurchasingBills (4), WarehouseReturns (6), AccountingMatching (4); acceptance PurchasingReturnsWalk (4, unchanged: the
  walk reads get#SourceInspectionStatus, whose matchEligibleQuantity stays inspection-only).
- For P9: `handle#PurchaseApprovalRevision` returns at once for an order with no decision, so when revisions of approved
  orders are built, a commercial revision of a replacement order (approved without a decision) must send it back for
  approval under the gate, like any other approved order.
- Specs: Mantle PurchaseReturns, ReturnToResponseBasicFlow, AccountingMatching; BOSS PurchasingReturns, PurchasingAccess,
  WarehouseReturns, AccountingAccess: all pass (PurchaseReturns 2, the ReturnToResponseBasicFlow run 55 with its flow specs,
  AccountingMatching 14, PurchasingReturns 3, PurchasingAccess 17, WarehouseReturns 6, AccountingAccess 8).

### P9 — Revisions and acknowledgements

- **PUR-ORDER, the revision**, on the audit-log rule (§2): no revision record.
  - `mantle.order.OrderServices.preview#PurchaseRevision` and `apply#PurchaseRevision` (design OrderChanges). Start
    locks with a Change hold. Apply, in one transaction, writes the changes to the audit-logged fields with the reason,
    calls `increment#OrderRevision` for the commercial change (X2), Warehouse's `adjust#ExpectedReceipt` (a
    ReceiptInProgress fails the revision by name), Accounting's `convert#` or `release#Commitment` for the delta and
    `queue#MatchReevaluation`, all Mantle's.
    Decreases below received, billed or returned quantities are refused, and so is a supplier or currency change on a
    progressed part.
  - The approval of the new revision, then `release#OrderHold` and a resend through `send#PurchaseOrder`, which stores
    the new revision's PDF.
- **PUR-ORDER, the acknowledgement**, on the same rule: no acknowledgement record.
  - The supplier's reference and date on OrderPart's `otherPartyOrderId` and `otherPartyOrderDate`, the acknowledged
    revision and its outcome on OrderPart, and the promised date on each line, all audit-logged (F17, F18; the new
    field names at P9 start). The evidence is OrderContent in the supplier's role. Each acknowledgement's history is the
    audit log.
  - `mantle.order.OrderServices` `record#Acknowledgement` and `send#PurchaseReminder`, deduped on revision, template
    and occurrence, a result per recipient; `ironstone.purchasing.OrderServices.find#Acknowledgements` for the list.
- **Screens** (design §6):
  - OrderChanges: ProposedChange, RevisionEffects (old and new values beside the received, billed and returned
    quantities) and ApplyRevision.
  - Acknowledgements: AcknowledgementList, RecordAcknowledgement and SendReminder.
  - OrderDetail's Revisions tab (each revision's time, changes and stored PDF) and Acknowledgements tab.
- **Outputs and shell:** the revision print and email; Home's unacknowledged count; the Today source for
  acknowledgements due.
- **Usable when:**
  - a buyer lowers a partly received, sent PO's quantity: it holds with a Change reason, the effects show the received
    quantity, a cut below it is refused, the approved revision adjusts the expected receipt, re-evaluates the bill,
    releases the commitment's delta, and goes out as revision 2 with its PDF stored;
  - the PO printed as of a time before revision 2 shows revision 1's quantities;
  - a receive in progress fails the revision with ReceiptInProgress, and nothing changes;
  - a supplier's phone confirmation with a later date is recorded, and the original due date stays for OTD;
  - reminders to three suppliers with one bad address name it and mark the other two sent.

**Built Nov 4 (P9).**
- Mantle:
  - `entity/PurchaseRevisionEntities.xml`: OrderPart's `otherPartyOrderId`, `otherPartyOrderDate`, `estimatedDeliveryDate`,
    `settlementTermId` and `tradeTermEnumId` audit-logged ("true", F57), and the acknowledgement `acknowledgedRevision`,
    `acknowledgementEnumId` (PurchaseAcknowledgement: PakAccepted, PakChanged, PakRejected), `acknowledgedDate` and
    `acknowledgementNote`, all "true"; OrderItem's `promisedDate` and `promisedQuantity` ("true"); OrderHeader's
    `currencyUomId` ("update"); `OrderEmailMessage.reminderOccurrence`; `PurchasePolicy.substitutionEnumId` (F49:
    PurchaseSubstitution PsbNotAllowed, the default, or PsbAllowed). `data/PurchaseRevisionSetupData.xml`: the enumerations,
    `OctSupplierAcknowledgement` and the `MANTLE_PURCHASE_REMINDER` template (`template/order/PurchaseReminderEmail.html.fancy`).
  - `service/mantle/order/PurchaseRevisionServices.xml` over the new `PurchaseRevisions.js`, included in
    `mantle.order.OrderServices` by name (six one-line service-includes): `start#PurchaseRevision` (a Change hold, its
    source the revision started from; ORDER_NOT_REVISABLE, STALE_REVISION, REASON_REQUIRED), `cancel#PurchaseRevision`
    (REVISION_NOT_STARTED, REVISION_APPLIED), `preview#PurchaseRevision` (change rows with their refusals by name, each
    line's ordered, received, billed, returned, accepted and expected quantities, the changed lines' amounts, the part's
    values and the basis key), `apply#PurchaseRevision` (one transaction: the open receipts locked first, the changes written
    with their reason in the audit log and an internal note, the revision counted once, `adjust#ExpectedReceipt`,
    `lower#SourceCommitments`, `queue#MatchReevaluation` per changed line, the new revision's approvers notified;
    RECEIPT_IN_PROGRESS, QUANTITY_BELOW_RECEIVED/_BILLED/_RETURNED/_ACCEPTED, SUPPLIER_CHANGE_PROGRESSED,
    CURRENCY_CHANGE_PROGRESSED, SUBSTITUTION_NOT_ALLOWED, SUBSTITUTE_PROGRESSED, FACILITY_ON_RECEIPT, NO_CHANGE; operation key
    replay), `record#Acknowledgement` (SUPERSEDED_REVISION naming the current one, OUTCOME_INVALID, REASON_REQUIRED for a
    changed or rejected response; the requested date and the ordered quantity stay; evidence as OrderContent in the Supplier
    role) and `send#PurchaseReminder` (each order in its own transaction, a result per order and per recipient, once per
    revision, template and occurrence; ORDER_NOT_SENT, ALREADY_ACKNOWLEDGED, RECIPIENT_REQUIRED, RECIPIENT_INVALID).
  - Changes to existing Mantle (none refuses anything new): `increment#OrderRevision` returns while a revision or
    acknowledgement holds the order's count (`ec.context.sharedMap`), so they count once or not at all;
    `PurchaseOrders.js decide#PurchaseApproval` also decides a held order whose changed revision was applied, its last step
    releasing the Change hold (to Approved, or to Placed and then approve#Order), a refusal leaving it held for the buyer;
    `update#PurchaseOrder` takes a draft's delivery date, payment term and incoterm (the addresses-and-terms editing P3 left;
    TERM_INVALID); `get#PurchaseOrderPrint` reads the part's supplier, facility, ship-to, reference, delivery date and terms
    and the currency back as of the time, and prints "Changes in this revision" with their reasons; `adjust#ExpectedReceipt`
    takes a held order (Receiving.js `purchasePart` statuses); Budgets.js `lowerSource` behind the new internal
    `mantle.other.BudgetServices.lower#SourceCommitments`; PurchasePolicy's `substitutionEnumId` in `store#PurchasePolicy`;
    PurchaseOrderDocuments.js exports `recipientsOf`.
  - Spec `test/order/PurchaseRevisions.spec.js` (8 features, about 3 s).
- BOSS:
  - `ironstone.purchasing.RevisionServices` (`Revisions.js`): `get#OrderRevisions` (OrderDetail's sections),
    `find#Acknowledgements` (included in `ironstone.purchasing.OrderServices` by name; views Unacknowledged, Changed promise,
    Overdue by the policy's reminder days, All sent; at most 500 sent orders read) and `get#TodayItems` (acknowledgements due,
    for a buyer); Home's `unacknowledgedCount` (BuyerServices); `Orders.js` offers Approve and Refuse on a held order whose
    revision was applied, and the detail's delivery date and terms; `Purchasing.js` link paths Orders/OrderChanges and
    Orders/Acknowledgements.
  - Screens: `Purchasing/Orders.xml` now a tab panel (Purchase orders, Acknowledgements; OrderDetail and OrderChanges hidden);
    `Orders/OrderChanges.xml` (Start a change; ProposedChange as a lines grid and the order's form, kept in `changesText`;
    RevisionEffects with each change's refusal, the lines' quantities and the amounts; ApplyRevision with the reason and the
    preview's basis; Let the change go); `Orders/Acknowledgements.xml` (AcknowledgementList with views and saved finds,
    Record per row, Send reminder on the selected rows); `template/PurchasingOrderRevisions.xml` (the transitions
    `startRevision`, `recordAcknowledgement`, `linePromise`, `sendReminders`; OrderDetail's Revisions section with Change
    order and each revision's changes, reason and PDF, and Supplier acknowledgement with Record acknowledgement, Send reminder,
    each line's requested and promised date with its own Promise, reminders and history), two section-includes in
    `PurchasingOrderDetail.xml` and four transition-includes in `Shared/OrderDetail.xml`; Edit order's delivery date, payment
    term and incoterm and the Details' terms; the approvals' "waiting" text for a revised order; Home's Unacknowledged orders
    card opens Acknowledgements; the root's second today-source; Settings/PurchasePolicy's PurchaseControls takes the
    substitution rule.
  - Inventories: usl-inventory's revision, acknowledgement, reminder, `adjust#ExpectedReceipt`, `increment#OrderRevision` and
    `lower#SourceCommitments` rows; ss-inventory's EditPartNonEdForm.
  - Data: BossPurchasingDemoData's `BOSS_PUR_PO_ACK` (Retail's sent, unacknowledged order from Brightline) and the reminder
    template on the demo mail sink.
  - Specs: `PurchasingRevisions` (2: Acknowledgements' views, Home's count and Today with its html render; OrderChanges' html
    render with a proposed cut and OrderDetail's revisions read by capability); PurchasingAccess gains a feature (the
    revisions and acknowledgement are the organization's, change and response the buyer's; 18 features). Acceptance
    `test/acceptance/Purchasing/PurchasingRevisionsWalk` (7: the usable-when items); `routeFixtures` lists Orders/Acknowledgements
    and Orders/OrderChanges.
- Tests run: Mantle PurchaseRevisions, PurchaseOrders, PurchaseApprovals, PurchasePolicy, PurchaseReceipts,
  OrderProcureToPayBasicFlow, WarehouseReceiving, AccountingBudgets, OrderLifecycle, OrderBulk, CrmMiscServices,
  PurchaseHoldPermission (96 features, all pass); BOSS PurchasingRevisions, PurchasingAccess, PurchasingOrders,
  PurchasingApprovals, PurchasingReceiving, PurchasingBills, PurchasingSuppliers, PurchasingReplenishment, WarehouseReceiving,
  AccountingBudgets (all pass); client PurchasingOrdersWalk (pass); acceptance PurchasingRevisionsWalk (7) and AppStructure
  (18), pass. The new screens render in qvt and tui without error (checked once by hand). `moqui lint --screens`: no idiom
  or hazard site in the new and changed screens (informational anchors only).
- Decisions:
  - The revision's flow: Start holds the order with a Change reason; the change is applied under the hold (again after a
    refusal); the approval of the new revision is `decide#PurchaseApproval` on the held order, whose last step releases the
    revision's Change hold (to Approved, or to Placed and approve#Order for an order not approved yet); the buyer resends it
    through `send#PurchaseOrder`, which stores the new revision's PDF. The Change hold is the revision's lock: its approval or
    the buyer's cancel of an unapplied change releases it, not `release#OrderHold` (F109).
  - Receiving goes on while an order changes; ReceiptInProgress is a receipt or bill posted since the change was reviewed
    (the preview's basis key), and the apply locks the open receipts first, so a receive under way finishes before it
    (F108).
  - A revision counts once: its writes do not move the revision one by one (F110); an acknowledgement and the Change hold
    move none.
  - The budget delta at apply: a lowered line's commitment is released to what it still needs (`lower#SourceCommitments`); a
    raised line is reserved by the approval of the new revision, where Warn and Stop apply (F111). P10 adds a request's
    conversion.
  - A supplier's promise is per line (`promisedDate`, `promisedQuantity`); the requested date stays `requiredByDate` for on-time
    delivery, and a promise changes no ordered quantity. A changed or rejected response needs the supplier's reason.
  - Reminders dedupe on the revision, the template and the occurrence (by default the day) per recipient.
  - The substitution rule (F49) is `PurchasePolicy.substitutionEnumId`: not allowed by default; allowed puts a product usable
    for buying on a line nothing was received, billed or expected on.
- Findings (provisional):
  - **F108** No skip-locked find in scripts (impl-warehouse F175), so a revision cannot tell at once that a receive holds the
    receipt; Warehouse's receive guard also receives on a held order. ReceiptInProgress is therefore the preview's basis key
    (each line's received and billed quantities): `apply#PurchaseRevision` locks the open receipts first, waits for a receive
    under way, and fails by name when anything was posted since the review.
  - **F109** OhtChange's release permission (`enumCode`) is ORDER_APPROVE, which no Purchasing group holds (the design's
    ORDER_CHANGE_HOLD_RELEASE is not seeded), and nothing in mr-mantle, mr-boss or mr-pass placed a Change hold before P9. The
    approval of the revision releases its Change hold and the buyer's cancel an unapplied one; `release#OrderHold` still
    releases it for an ORDER_APPROVE holder.
  - **F110** Under `commercialRevisionOnly` each changed line moved `orderRevision` by one (`handle#OrderItemChange`'s item
    kind), and without the flag the part's fields, the internal note and the acknowledgement's OrderPart writes each moved it
    too (`handle#OrderPartChange`, the note and content rules); `increment#OrderRevision` returns while the order's count is
    held (`ec.context.sharedMap['PurchaseRevisionCount:<orderId>']`), and the OrderRevisionPurchaseApproval SECA still runs
    on those returns (harmless: nothing is superseded at the same revision).
  - **F111** `reserve#Commitment` at a new revision replaces only the lines the approval reserves, so a line lowered to zero
    kept its earlier commitment until close or cancel (P4 review), and a buyer holds no budget permission; Accounting's
    `BudgetServices` gains the internal `lower#SourceCommitments` (no permission of its own, as
    `release#ClosedSourceCommitments`), written into design-accounting's budget contract list below.
  - **F112** `adjust#ExpectedReceipt` refused a held order (`Receiving.purchasePart` took Approved or Sent only); it now
    takes the hold a revision places. The receive guard is unchanged.
  - **F113** The framework writes a `<field>_changeReason` in the context to each audit row (as Moqui Java does), so the
    revision's reason is on each change, read back by OrderDetail's Revisions and the print's "Changes in this revision".
  - **F114** OrderPart's reference, dates and terms logged with "true" write an audit row for each new part's first value
    of them; the as-of print needs the first set.
  - **F115** RecordAcknowledgement takes one promised date for every line (a dialog form has no per-line grid); a line's own
    promise is its row's Promise on OrderDetail, which keeps the revision's recorded response.
  - **F116** Not built: a ship-to address choice in OrderChanges (apply takes `postalContactMechId`; Purchasing has no
    address choice source) and adding a line by a revision (a new line is a new order or a later item).
  - **F117** An order is overdue from its revision's first order email; an order marked Sent with no email (the demo's, or
    sent outside Mantle) is unacknowledged but never overdue.

**Review Nov 4 (P9).** Checked: apply#PurchaseRevision's one transaction, lock order (the open receipts, then the order; the
facts and the basis key read under the locks, so a receive cannot post between the check and the writes), its refusals and
operation replay; the count hold (`uncounted`: try/finally, keyed by order, nested and other orders safe; every revision
EECA runs synchronously inside it); the Change hold's release only by decide#PurchaseApproval (PURCHASE_APPROVE, the steps,
separation and quorum, budget) and by the buyer's cancel of an unapplied change; decide on a held order only for a revision's
applied hold, and a revision of an order with no earlier decision (P8's $0 replacement) goes back for approval through it;
lower#SourceCommitments internal (allow-remote false, not in any REST or screen, only apply calls it; releases down to what the
line still needs); reminder dedupe per recipient, revision, template and occurrence, a result per order and recipient;
SUPERSEDED_REVISION; the "true" audit fields; increment#OrderRevision's early return only under the hold; the print's and
adjust#ExpectedReceipt's old callers. Fixes:
  - R1 (medium) "applied" was the order's count past the hold's source, but by default a note or a receipt's status change
    moves the count while a change is only started: the buyer's cancel was refused and decide treated the hold as waiting for
    approval. The Change hold now carries `appliedRevision` (OrderHoldReason, set by apply), Mantle's `revisionState` and
    BOSS's `changeState` read it, and a Change hold with no source is not a revision's.
  - R2 (medium) An ORDER_APPROVE holder's release#OrderHold of an applied revision's Change hold returned the order to Approved
    or Sent with no decision at the new revision, past the approval gate; with the gate on it now returns to Placed for its
    approval (`PurchaseRevisions.releaseReturn`; nothing changes with the gate off).
  - R3 (low) adjust#ExpectedReceipt took an order on any hold (a credit or quality hold too); it takes a held order only while
    a Change hold is open.
  - R4 (low) apply adjusted the expected receipt only for receipts found before its locks; a receipt opened in between is on
    the line's facts and is adjusted too.
  - Specs: PurchaseRevisions gains a cancel after the count moved and the gated release (9 features).
- Left for the lead: a currency change together with a price or quantity change lowers commitments held in the old currency
  against amounts in the new one (lower#SourceCommitments compares them as one currency); record#Acknowledgement accepts a
  response while an applied revision waits for its approval (the supplier has not been sent it yet); a reminder's mail is
  sent in its own transaction before its OrderEmailMessage is written, so a failure after the send can repeat it.
- **Wave 5 suites (Nov 4, on master after P7, P8 and P9 merged):** standalone mr-mantle 1,615 passed, 2 failed (the
  baseline), 11 skipped; `./moq test-apps` 2,870 server and 14 client features passed, none failed. The run shared the
  machine with wave 6's two workers, so its feature times (mr-mantle 996 s, mr-boss 601 s server and 56 s client, and
  four specs over 15 s) measure the load, not the suite; later waves run their suites before launching workers.
  `moqui lint --screens` clean.

### P10 — Purchase requests

- **PUR-REQUEST.**
  - The request's organization as a RequestParty in the OrgInternal role, and the cost centre on each line, carried to
    `OrderItem.costCenterId` (§4; F3). The filer stays `Request.filedByPartyId`. `RequestItem.quantityUomId`;
    Manufacturing P13 added `Requirement.quantityUomId`.
  - The audit log on RequestItem's product, quantity, unit, required date, supplier and cost centre (F18). A request's
    revision is the time of its last change to them; a decision is refused if the request changed after it.
  - `ironstone.purchasing.RequestServices.find#PurchaseRequests`, and `mantle.request.RequestServices`:
    - `get#PurchaseRequestProgress`;
    - `preview#PurchaseSourcing` and `convert#PurchaseSourcing` (`PURCHASE_ORDER_EDIT`), on design RequestSourcing's
      result envelope. Each supplier group commits its PO, RequestItemOrder and RequirementSupply under a lock on the
      Requirement's remaining quantity. A group fails by name and the others go on; a retry repeats only the failures.
      It never passes `placeAndApproveOrders`, and it refuses quantity already sourced (R-PUR-01; F4). Customer demand
      may take P7's drop-ship route, moving the sales line to the supplier's drop-ship facility.
  - The `PurchaseRequestApproval` topic, seeded as P4's are. Approval creates or links one Requirement through
    RequirementRequestItem (RqTpProduct or RqTpInternal, RqmtStApproved), with its organization as a RequirementParty
    in the OrgInternal role (Manufacturing P13), and calls `reserve#Commitment`; refusal leaves ReqSubmitted; a cancel
    releases the unsourced demand and its commitment.
  - PO approval converts a request-sourced line's reservation with `convert#Commitment`.
- **CX-REQUEST** (§4; F5): `complete#RequestFromWork` leaves RqtPurchase alone, and RqtInventory unless Warehouse P15
  did so; progress comes from `mantle.request.RequestServices.get#PurchaseRequestProgress`.
- **Projects' contract** (§4; F6): RequestDetail's Items tabs, which Projects and Warehouse built (Warehouse's adds
  items while a draft), extended to purchase requests, the base RequestItems of crosscut §3.11, on Marble's
  EditRequestItems. Its "Create purchase order" opens RequestSourcing, for the buyer group only.
- **Screens** (design §4):
  - Requests: RequestFind, RequestList with My requests, Awaiting sourcing, Due and All, and NewPurchaseRequest.
  - RequestDetail: Projects' `Shared/RequestDetail` with the Purchasing row of crosscut §3.11: Overview, Items, Sourcing
    progress, Approval, History, links, Chatter and files.
  - RequestSourcing: SourceDemand, SourceGroups and ConvertDemand, the direct PO and drop-ship routes. P11 adds the RFQ
    route.
  - OrderDetail's Sources tab.
- **Shell:** quick create request; the Today source for due requests; Home's unsourced count.
- **Usable when** (design §14.4 #1, the request):
  - a requester files a request for ORG_ZIZI_RETAIL with three lines, two with suppliers and one without; approval
    creates three requirements with the organization's role and reserves the commitment;
  - RequestSourcing makes a draft PO for each supplier and names MissingSupplier for the third; after a supplier is
    chosen, the retry makes only that PO;
  - a second conversion of the same lines is refused as already sourced;
  - approving a sourced PO converts the reservation, so the amount is not counted twice;
  - a Projects work item linked to the request completes and the request stays In Progress;
  - the Items tab shows in the Commons and Projects contexts, with "Create purchase order" for a buyer only.

**Built Nov 4 (P10).**
- Mantle:
  - `entity/PurchaseRequestEntities.xml`: RequestItem's `quantityUomId` and `costCenterId`, and the audit log ("true", F57) on
    its product, quantity, unit, required date, supplier and cost centre. `data/PurchaseRequestSetupData.xml`: the
    `PurchaseRequestApproval` topic, seeded as P4's (approve#/refuse#PurchaseSource, a refusal needs a reason).
  - `service/mantle/request/PurchaseRequestServices.xml` over the new `PurchaseRequests.js`, included in
    `mantle.request.RequestServices` by name: `create#PurchaseRequest` (RqtPurchase, the organization as its OrgInternal
    RequestParty, one of the user's: RECORD_UNAVAILABLE; the buying policy's currency, else the accounting one),
    `store#PurchaseRequestItem` (a draft's or submitted request's line: product usable for buying, unit, required date,
    supplier the organization may buy from, cost centre of the organization or a PrtOrgRollup child, most to pay; a submitted
    request's change is a new revision sent to its approvers again; on an approved request a buyer's supplier and cost centre
    only, REQUEST_APPROVED), `delete#PurchaseRequestItem` (a draft's), `submit#PurchaseRequest`,
    `decide#PurchaseRequestApproval` (PURCHASE_APPROVE; the steps of PasRequest policy rows, else the no-policy rule;
    STALE_REVISION, SELF_APPROVAL by the filer or submitter, operation key replay; a refusal leaves it Submitted; the last
    step makes one RqmtStApproved requirement per line, RqTpProduct or RqTpInternal, linked through RequirementRequestItem with
    the organization as OrgInternal RequirementParty, reserves each line's maximum at BcsRequest under an approved budget and
    puts the request In Progress), `cancel#PurchaseRequest` (the reason on the status's audit row; an uncovered requirement
    Rejected, a partly covered one cut to what is covered, `release#ClosedSourceCommitments`, the live orders named),
    `get#PurchaseRequestProgress` (requested, approved, sourced, ordered, received and remaining per line, the approval and the
    actions), `preview#` and `convert#PurchaseSourcing` (PURCHASE_ORDER_EDIT; one draft order per organization, supplier,
    facility and route, each group in its own transaction, `convert#PurchaseSourcingGroup`, under the lock of its requirements,
    through `create#PurchaseOrder` and `store#PurchaseOrderItem`, with RequestItemOrder and RequirementSupply RstPurchaseOrder
    under the operation key; MISSING_SUPPLIER, ALREADY_SOURCED, PRODUCT_REQUIRED, NO_CUSTOMER_LINE and the line services'
    refusals by name, retryable or not; a retry answers EXISTING for this operation's lines; PLACE_NOT_ALLOWED; the drop-ship
    route through `route#OrderItemToDropShip` for a line with a customer order line, DROP_SHIP_PENDING before that order's
    approval). The writes check the request's people (the filer or a party of it) or PURCHASE_ORDER_EDIT, and the organization.
  - Existing Mantle, refusing nothing new: `complete#RequestFromWork` leaves RqtPurchase, RqtPurchaseRfq and RqtInventory alone
    (CX-REQUEST; F123); `PurchaseApprovals.js` knows the request as a source (topic, PasRequest, its message fields, the
    topic handlers' branch); `PurchaseOrders.js decide` calls `PurchaseRequests.js convertOrderCommitments` after P4's
    reservation (a request-sourced line converts the request's commitment, `convert#Commitment`) and exports `costCenterOf`.
  - Spec `test/order/PurchaseRequests.spec.js` (6 features, about 3 s).
- BOSS:
  - `ironstone.purchasing.RequestServices` (`Requests.js`): `find#PurchaseRequests` (views My requests, Awaiting sourcing,
    Due, All; a requester's own and assigned only; approved, sourced and remaining per request; at most 500 read),
    `get#RequestDetail` (check#Record, then the Mantle progress, with the history from the audit log), `get#OrderSources`,
    `get#TodayItems` (approved requests left to source due, for a buyer); Home's `unsourcedCount` (BuyerServices); the other
    apps' Items rows and the "Create purchase order" link (`itemRows`, `sourcingUrl`). `Purchasing.js`: the request kind's
    destination `Requests/RequestDetail` (so `get#RecordLink` opens a purchase request under Purchasing), the request palette
    find, the Requests link paths and the `requestCreate` capability (NewPurchaseRequest's grant). `Approvals.js`: the topic
    in Approvals and Today.
  - Screens: `Purchasing/Requests.xml` (tabs: PurchaseRequests; the shared RequestDetail and RequestSourcing hidden),
    `Requests/PurchaseRequests.xml` (RequestFind and RequestList with views and saved finds, New purchase request, Source on the
    selected rows for a buyer), `Requests/RequestSourcing.xml` (SourceDemand with Choose supplier and Drop-ship, SourceGroups,
    Create purchase orders and Retry the failed groups under one operation key), `Purchasing/NewPurchaseRequest.xml` (quick
    create, BOSS_PUR_NEW_REQUEST); `template/PurchasingRequestDetail.xml` (RequestDetail's Purchasing branch: header with Submit,
    Approve, Create purchase order and More: Refuse, Cancel request; Lines with Add line, Edit, Choose supplier, Remove and each
    line's sourcing; Approval; History; Conversation; Files; its transitions), included by `Shared/RequestDetail.xml`, which also
    gives a purchase request an Items tab in Commons and Projects with "Create purchase order" for a buyer only;
    `template/PurchasingOrderSources.xml` (OrderDetail's Sources, one include in `PurchasingOrderDetail.xml`); the root's quick
    create and Today source; Approvals lists the request topic.
  - Data: BossSetupData's `BOSS_PUR_NEW_REQUEST` (requester, buyer, administrator) and the topic's link; BossUsersDemoData's
    approved request `BOSS_PUR_REQ_A` of the requester (F128).
  - Specs: `PurchasingRequests` (4: the list's scope, views and html render; RequestDetail's html render for the approver;
    RequestSourcing's html render for the buyer with the Items link a buyer's only; Home's count and Today); PurchasingAccess
    gains the quick create per group, the `requestCreate` capability and a request feature (detail for its requester and
    organization, sourcing the buyer's; 20 features). Acceptance `test/acceptance/Purchasing/PurchasingRequestsWalk` (7, the
    usable-when items); PurchasingFoundationWalk's quick create; `routeFixtures` lists the Requests screens; AppStructure's
    placeholder floor 56.
- Tests run: Mantle PurchaseRequests, OrderProcureToPayBasicFlow, CrmMiscServices, OrderLifecycle, OrderBulk,
  WorkProjectRequests, PurchaseApprovals, PurchaseOrders, AccountingBudgets, PurchaseRevisions, DropShip (102 features, all
  pass); BOSS PurchasingRequests, PurchasingAccess, PurchasingApprovals, PurchasingOrders, Requests (Commons),
  ProjectRequests, ProjectsAccess, QuickCreate, Notifications, AppOrganizationFilters, PurchasingReplenishment,
  PurchasingRevisions, PurchasingDropShip, Tasks, Files, Chatter (all pass); acceptance PurchasingRequestsWalk (7),
  PurchasingFoundationWalk (3) and AppStructure (18), pass. The new screens render in qvt and tui without error (checked
  once by hand). `moqui lint --screens`: no idiom or hazard site in the new and changed screens (informational anchors only).
- Decisions:
  - A request's approval puts it In Progress (as Warehouse's stock request): Request has no Approved status and Reviewed is
    triage; Awaiting sourcing is In Progress with quantity left. Completion stays by hand (F127).
  - A request's amount, for its approval steps and its budget, is its lines' maximum amounts (the most to pay for each
    line), in the request's currency; no supplier price is read before sourcing (F120).
  - Lines are removed only while a draft; a submitted request's lines change (each change a new revision, sent to its
    approvers again, so a decision on the earlier one is refused).
  - RequestSourcing is the buyer's (the buy and list capabilities; Mantle checks PURCHASE_ORDER_EDIT); a requester and the
    other groups see "not available". Quick create of a request is the requester's, buyer's and administrator's.
  - The request topic's approvals are decided in RequestDetail, Approvals and the Commons inbox, through the same Mantle
    service.
- Findings (provisional):
  - **F119** A request's revision is the time (epoch milliseconds) of the last audit row of its lines' six fields, kept in
    `PurchaseApprovalDecision.sourceRevision` (a long) and shown as a time; deleting a line writes no audit row, so a line is
    removed only from a draft, before any decision.
  - **F120** RequestItem has no price; `maximumAmount` ("the maximum amount (price) to pay for the item") is taken as the
    line's not-to-exceed amount, so a line without one counts nothing toward the approval bands and reserves nothing.
  - **F121** Sourcing prices a line at the supplier's price the buyer may read (`store#PurchaseOrderItem`); a supplier
    with none fails its group PRICE_UNAVAILABLE (retryable). RequestSourcing has no per-line price override yet (design
    SourceGroups' "price/override"). The demo's DEMO_1_1 has supplier prices from Ziddleman only, so the demo request names
    Ziddleman and the walk adds a Brightline price.
  - **F122** The preview shows the supplier check and, for a supplier-price reader, the group's amount, but no
    `check#Budget`: the request's budget was decided at its approval and the PO stage is decided by the order's approval
    (`convert#Commitment`), and a buyer may not read budgets.
  - **F123** Warehouse P15 left `complete#RequestFromWork` without a type check, so P10's check leaves RqtInventory alone
    too, with RqtPurchase and RqtPurchaseRfq. It refuses nothing, so it has no flag; WorkProjectRequests passes unchanged.
  - **F124** A revision of a request-sourced order line after its approval holds the line again with `reserve#Commitment`
    (its earlier order commitment, converted from the request, already holds the request's share), not a second conversion.
  - **F125** Customer demand on a request (for the drop-ship route) is a RequestItemOrder from the request line to a sales
    order line; nothing in BOSS writes one yet (P14b's conversion, or a later intake). `route#OrderItemToDropShip` buys only on
    an approved customer order, so the route fails DROP_SHIP_PENDING before it. The route has no regression spec (its drop-ship
    fixture is P7's); left for P14b's walk.
  - **F126** `cancel#PurchaseRequest` keeps its reason as the status change's `changeReason` (Request has no note entity
    of its own besides comments); the purchase orders made from the request stay and are named for the buyer.
  - **F127** Nothing completes a purchase request when its lines are received in full; it stays In Progress until a user
    completes it (design RequestDetail: "fulfilled or explicitly closed with a reason"). Left for P17.
  - **F128** The demo request is in BossUsersDemoData, after the requester's party: `Request.filedByPartyId` has a foreign
    key, and BossPurchasingDemoData loads before the users.
  - **F129** AppStructure's placeholder floor is now 56 (Requests built).

**Review (Nov 4, P10).** Checked: `convert#PurchaseSourcing` (each group `convert#PurchaseSourcingGroup` in a new transaction,
its requirements locked `forUpdate` in id order before the covered quantity is read again, so a second conversion waits and
reads ALREADY_SOURCED; a same-key retry answers EXISTING from the operation's RequirementSupply and runs only the failed
groups; a group's failure rolls back only its own transaction; `placeAndApproveOrders` refused, nothing placed or approved);
the budget path (request approval reserves at BcsRequest, PO approval converts, `budgetLines` leaves request-sourced lines to
`convertOrderCommitments`, cancel releases what is left); requester scope (list, Home count, detail, record link and Mantle's
`own` all the filer or a non-organization party; the palette is `listRead` only; RequestSourcing and "Create purchase order"
need `buy` and `listRead`, Mantle PURCHASE_ORDER_EDIT); RequestDetail in Commons and Projects. Fixes:
  - R1 (medium, budget) F124 was a double count where the request's commitment kept a remainder (a line priced below its
    maximum): a revision raising the line reserved its new amount beside the request's open remainder (request 40, PO 30 then
    revised to 40 held 50). `convertOrderCommitments` now, for a revised line whose request commitment is still open, releases
    the line's earlier order commitment (as `reserve#Commitment` replaces an earlier revision's) and converts the request's
    remainder at the new revision; a line with a commitment at the current revision (a retry, a lowered line) and one whose
    request commitment is spent go through `reserve#Commitment` as before. PurchaseRequests' PO-approval feature revises the
    line and checks 40 held.
  - R2 (low, approval) F120: a line with no maximum counts nothing, so it falls in the lowest band (every request still
    needs one approval step, and the PO's own approval bands and budget reservation still apply at the PO stage). Not refused;
    the approvers are told: the request's approval message `amountText` ("$40.00 + lines 02, 03 with no amount", the topic's
    title) and `get#PurchaseRequestProgress` `approval.unpricedText`, shown in RequestDetail's Approval box.
  - R3 (medium, compatibility) F123: Commons and Projects may raise a request of type RqtPurchase (QuickCreate's type
    list; the demo's BOSS_DEMO_REQ_DRAFT) with no organization, which Purchasing cannot see or source; skipping every
    RqtPurchase stopped a project's Purchase-type request completing from its work. `complete#RequestFromWork` now leaves
    RqtPurchase alone only when it has an OrgInternal RequestParty (every Purchasing request); RqtPurchaseRfq and RqtInventory
    by type (Warehouse P15's InventoryRequests.js already documents "never from linked work" for stock requests, and design
    crosscut §3.11 says so, so nothing relied on it). The CX-REQUEST feature checks a plain project Purchase request completes.
  - R4 (low, Projects behaviour) the shared Items tab replaced Projects' for a purchase request without its Maximum column;
    `itemRows` gives `maximumText` and the tab shows it.
  - Left for the lead: a request line priced below its maximum keeps the remainder reserved at BcsRequest until the request is
    cancelled; nothing closes a fully sourced request (F127), so that remainder stays committed until P17 adds the close
    (which should release it). No regression spec runs two conversions concurrently (the lock was checked by reading).
- **Wave 6 suites (Nov 4, on master after P10 and P13 merged, run alone):** standalone mr-mantle 1,624 passed, 2 failed
  (the baseline), 11 skipped; `./moq test-apps` 2,887 server and 14 client features passed, none failed; feature time
  mr-mantle 340 of 300 s in the apps run (250 s standalone), mr-boss 272 of 220 s server and 42 of 36 s client, mr-pass
  17 of 15 s (no Purchasing change there): warnings, none over 1.5 times, for the end's measured budget; no spec over
  15 s; `moqui lint --screens` clean.

### P11 — RFQs and supplier quotes

- **PUR-RFQ, the model** (§4; F19).
  - The `RqtPurchaseRfq` request type and its policy (R-PUR-13): left out of the Commons, Projects and Customer Service
    request lists and every RequestDetail mount, with triage, work-link completion and Convert to project off. Every
    open, from a link or the palette, goes to QuoteRequestDetail.
  - The RFQ is the Request and its items, audit-logged as P10's are. Sending stores the published RFQ's PDF as
    RequestContent, stamped with its time, and a material change after it needs a new send.
  - Each invited supplier's quote is a purchase OrderHeader with one part (the supplier as vendor, the buying
    organization as customer) in OrderRequested ("Request Quote"), its lines from the RFQ items with RequestItemOrder
    links. The supplier's answer moves it to OrderProposed ("Propose Quote") with prices and dates, validity in
    OrderPart's `validFromDate` and `validThruDate`, terms in `settlementTermId` and `tradeTermEnumId`, and the
    supplier's reference in `otherPartyOrderId`. Evidence is OrderContent. An unsolicited quote is a purchase order
    entered straight in OrderProposed. An amendment is an audit-logged change, and an expired quote one past its
    `validThruDate`.
  - Quantity tiers both ways (§4):
    - as purchase ProductPrice rows with their minimum quantities, valid for the quote's validity, so the resolver
      calculates a line's price at any quantity: the long-standing Moqui Java way. They are written through Products'
      `store#ProductPrice` by `publish#SupplierQuotePrice`, which stays the one path from a quote to a price row;
    - where an organization uses it, a promotion's auto-adjust: an `apply#Promotion` service that adds an `isPromo`
      child OrderItem (`parentItemSeqId`, `promoQuantity`) for the quantity difference, reapplied by
      `apply#OrderPromotions` on every change. Mantle finds promotions through the order's ProductStore, which a PO
      lacks, so P0 checks how Moqui Java scopes them for purchases (F22).
  - Quotes and requested quotes are never supply.
- **`mantle.order.SourcingServices`** (`PURCHASE_ORDER_EDIT`, but the price publish):
  - `create#QuoteRequest`, `store#QuoteRequest` and `store#QuoteRequestItem`;
  - `store#QuoteInvitation`: the supplier's quote order in OrderRequested;
  - `send#QuoteRequest`: the published RFQ to each invited supplier, InvitationDeliveryFailed for a failed contact while
    the others send. P16 adds the response link;
  - `store#SupplierQuote` for an on-behalf entry with its channel and evidence;
  - `publish#SupplierQuotePrice` (R-PUR-21; Products §7): a quoted price to an effective supplier price through
    `store#ProductPrice`, with the source order and line, under `SUPPLIER_PRICE_EDIT` only.
- **`ironstone.purchasing.SourcingServices`:** `find#QuoteRequests` and `get#QuoteRequest`; `find#SupplierQuotes` over
  the purchase orders in the quote statuses, and `get#SupplierQuote`.
- **Screens** (design §5):
  - QuoteRequests: QuoteRequestFind, QuoteRequestList and NewQuoteRequest.
  - QuoteRequestDetail: QuoteRequestHeader, QuoteRequestItems, QuoteRequestSuppliers (the quote orders),
    SendQuoteRequest, QuoteRequestResponses and History.
  - Quotes: QuoteFind, QuoteList and NewSupplierQuote.
  - QuoteDetail, over the quote order: QuoteHeader, QuoteLines with their history, QuoteTerms, QuoteAwards (filled by
    P12) and PublishPrice.
  - RequestSourcing's RFQ route; Supplier360's RFQs and quotes tab.
- **Outputs and shell:** the RFQ print and invitation email; the RFQ palette type; quick create RFQ; the Today source
  for quotes due; Home's RFQs-due and quotes-expiring counts, with PurchasePolicy's warning days.
- **Usable when:**
  - an RFQ from an approved request goes to three suppliers as three requested quotes; one bad contact is named and the
    other two are sent, and the published RFQ's PDF is on the request;
  - a material edit after sending needs a new send, and the earlier RFQ prints as of its send time;
  - a buyer enters two suppliers' prices on their quotes, with evidence; a price change shows in the line's history; an
    expired quote shows but cannot be placed;
  - publishing a quoted price makes the supplier price with its dates, and a buyer without supplier-price edit is
    refused;
  - the RFQ is in no Commons or Projects request list, and opening it from the palette shows QuoteRequestDetail.

**Built Nov 4 (P11).**
- Mantle:
  - `entity/SourcingEntities.xml`: the `RqtPurchaseRfq` request type and the `RqCntRfqPublished` request content type;
    the audit log on RequestItem's `description` ("true", F57; with P10's product, quantity, unit and date and Mantle's
    status, the RFQ items' material fields); the RFQ header's response date, text, facility and currency logged by
    `store#QuoteRequest` itself, a first set included (F148, review R1); and
    on OrderPart's `validFromDate` and `validThruDate` ("true"); the `OctSupplierQuote` order content type; ProductPrice's `sourceOrderId` and `sourceOrderItemSeqId`
    (audit-logged), which Products' `PricePolicy.js` now writes (F141). `data/SourcingSetupData.xml`: the
    `MANTLE_RFQ_EMAIL` template; `template/order/QuoteRequest.print.html.fancy` and `QuoteRequestEmail.html.fancy`.
  - `service/mantle/order/SourcingServices.xml` (`mantle.order.SourcingServices`) over the new `Sourcing.js`:
    `create#QuoteRequest` (a draft RFQ of the user's organization, its OrgInternal RequestParty; the buying policy's
    currency and `rfqResponseDays`; from approved purchase request lines, `sourceRequestItemKeys`, an item each for what is
    left to source linked by RequestItemAssoc: SOURCE_INVALID, NOT_APPROVED, ALREADY_SOURCED), `store#QuoteRequest`
    (CURRENCY_CHANGE_QUOTED), `store#QuoteRequestItem` (a product usable for buying or a description; remove cancels the
    item; the quotes still requested follow each change), `store#QuoteInvitation` (the supplier's quote order created in
    OrderRequested with a line per item, unpriced, and RequestItemOrder links; the supplier check's Stop refuses, a supplier
    already invited answers its quote; declined: Reject Request with the reason), `get#QuoteRequestPrint` (as of a time,
    from the audit log), `send#QuoteRequest` (the PDF stored once per print as RequestContent stamped with its time, mailed
    per address in its own transaction to each live quote not sent the current revision, InvitationDeliveryFailed by name
    with RECIPIENT_REQUIRED, RECIPIENT_INVALID or DELIVERY_FAILED while the others go, Draft to Submitted, operation key
    replay), `store#SupplierQuote` (reference, quote date, validity, terms, delivery, the channel as the order's
    `salesChannelEnumId`, evidence as OrderContent in the Supplier role; Requested to Proposed; with no order an unsolicited
    quote created in OrderProposed, for an RFQ's items when one is given: QUOTE_EXISTS), `store#SupplierQuoteItem` (price,
    quantity, unit, promise, the supplier's item code, each change audit-logged with its reason) and
    `publish#SupplierQuotePrice` (SUPPLIER_PRICE_EDIT only: a proposed, unexpired quote line's price or a tier of it,
    through `store#ProductPrice` with the quote's dates and source, the tier's row in effect ended by `expire#ProductPrice`;
    QUOTE_NOT_PROPOSED, QUOTE_EXPIRED, PRICE_REQUIRED, PRICE_OVERLAP).
  - The request type's policy (R-PUR-13): `RequestTriageNotice` skips an RFQ, `get#IntakeSettings` never offers or
    triages the type, `convert#RequestToProject` refuses it (REQUEST_TYPE_FIXED, F139); `complete#RequestFromWork`
    already left it alone (P10, F123).
  - Spec `test/order/Sourcing.spec.js` (6 features, about 2 s).
- BOSS:
  - `ironstone.purchasing.SourcingServices` (`Sourcing.js`): `find#QuoteRequests` (views Open, Drafts, Responses due,
    Changed since sent, Closed, All; a supplier invited), `get#QuoteRequest` (header, items with their source lines, the
    invited suppliers' quotes with when each was sent and whether the RFQ changed since, responses, published PDFs, history),
    `find#SupplierQuotes` (views Awaiting the supplier, Quoted, Expiring by the buying policy's `quoteExpiryWarnDays`,
    Expired, All with the declined ones), `get#SupplierQuote` (header, terms and their amendments, lines with their price,
    quantity and promise history, evidence, `canPlace` false for an expired quote, `canPublish` for a supplier-price
    editor), `get#TodayItems` (RFQs due); Home's `quoteDueCount` and `quoteExpiringCount` (BuyerServices); amounts and
    prices withheld from a user who neither buys nor reads supplier prices or the books. `Purchasing.js`: the rfq and quote
    kinds open QuoteRequestDetail and QuoteDetail (a declined or not-awarded quote stays a quote, `wasQuote`), the RFQ
    palette find, the `rfqs` and `quoteChannels` choices, the `rfqCreate` capability and the Sourcing link paths.
  - Screens: `Purchasing/Sourcing.xml` (no longer a placeholder: tabs QuoteRequests and Quotes),
    `Sourcing/QuoteRequests.xml` (QuoteRequestFind, QuoteRequestList, New RFQ), `Sourcing/QuoteRequestDetail.xml` (header
    with Send, Print and More: Edit RFQ, Print as of; Items with Add item, Edit, Remove; Suppliers with Invite supplier,
    Enter quote, Declined; Responses; As published; History; Conversation; Files), `Sourcing/Quotes.xml` (QuoteFind,
    QuoteList, New supplier quote with the channel, evidence and an optional RFQ), `Sourcing/QuoteDetail.xml` (header with
    Record the answer or Edit quote; Lines with Add line, Edit price and Publish price; Terms; Amendments; Evidence; Awards,
    empty until P12; Conversation), `Purchasing/NewQuoteRequest.xml` (quick create, BOSS_PUR_NEW_RFQ),
    `template/PurchasingSourcingRfq.xml` (RequestSourcing's RFQ route: Request quotes on the lines left to source, one
    transition-include and one section-include in `Requests/RequestSourcing.xml`), `Shared/Supplier360/PurchasingQuotes.xml`
    (Supplier360's RFQs and quotes tab); the root's quick create and Today source; Home's RFQs due and Quotes expiring cards
    open the lists' views.
  - Commons and Projects (R-PUR-13): Commons' `get#RequestAccess` (and so Projects' access) and `find#RequestRows`, and
    Projects' request list, leave an RFQ out; `get#RecordLink` opens an RFQ only in QuoteRequestDetail, never falling back to
    another app's RequestDetail. Customer Service's Cases are a placeholder (nothing to leave out yet).
  - Data: BossSetupData's `BOSS_PUR_NEW_RFQ` (buyer, administrator); BossPurchasingDemoData's `MANTLE_RFQ_EMAIL` on the demo
    mail sink.
  - Specs: `PurchasingSourcing` (4: the RFQ list's views and one html render, a requester refused; QuoteRequestDetail's one
    html render with the reader's amounts withheld; the Expiring view and QuoteDetail's one html render, Publish price for a
    supplier-price editor only; Home's counts and Today); PurchasingAccess gains the RFQ quick create and `rfqCreate` and a
    feature (the RFQ's scope, its writes the buyer's, its record link to QuoteRequestDetail, left out of Commons; 22 features).
    Acceptance `test/acceptance/Purchasing/PurchasingSourcingWalk` (5, the usable-when items through the screens' transitions);
    PurchasingFoundationWalk's quick create; `routeFixtures` lists the Sourcing routes and NewQuoteRequest; AppStructure's
    placeholder floor 54.
- Tests run: Mantle Sourcing (6), ProductPricePolicy, ProductEffectivePrices, ProductPriceLists, ProductCatalogChecks,
  OrderProcureToPayBasicFlow, CrmMiscServices, OrderLifecycle, OrderBulk, WorkProjectRequests, PurchaseRequests,
  PurchaseOrders, SupplyPlanning, Replenishment, PurchaseRevisions, PurchaseAgreements, DropShip (all pass); BOSS
  PurchasingSourcing (4), PurchasingAccess (22), PurchasingRequests, PurchasingSuppliers, PurchasingOrders,
  PurchasingAgreements, PurchasingReplenishment, Requests, ProjectRequests, QuickCreate, TodayPanel, Notifications,
  AppOrganizationFilters, ProjectsAccess, Chatter, Files (all pass); acceptance PurchasingSourcingWalk (5),
  PurchasingFoundationWalk (3) and AppStructure (18), pass. `moqui lint --screens`: no idiom or hazard site in the new and
  changed screens (informational anchors only).
- Decisions:
  - No invitation record: an invitation is its quote order, its send state the order's emails in the Supplier role against
    the RFQ's revision. A quote is created straight in OrderRequested or OrderProposed (create#Order's initial
    status), never OrderOpen, so no draft rule sees it.
  - RFQ items keep step with the quotes still requested (a line added, changed or taken off); a quote the supplier answered
    keeps its lines and is sent the new revision.
  - A request's line asked of suppliers stays to source: the RFQ links its item to the line (RequestItemAssoc), and only
    P12's award makes supply (RequirementSupply).
  - Quantity tiers are price rows: Publish price takes a line's price or a tier (from quantity, price) per call. The
    promotion way is left to §7 (F140).
  - Home's RFQs due are the sent RFQs whose response date is past or within a day with a supplier still to answer; quotes
    expiring are the proposed quotes within the buying policy's warning days. Quick create of an RFQ is the buyer's and the
    administrator's.
- Findings (provisional):
  - **F138** Commons listed and showed every request its user filed or was a party of, with no type rule, so a buyer's
    RFQ was in their Commons list; Projects showed one in a visible project or of a triaged type. Commons' access service
    (which Projects' builds on) and both lists now leave the type out; it refuses nothing existing (only P11 makes the type).
  - **F139** `convert#RequestToProject` gains a refusal of the RFQ type (REQUEST_TYPE_FIXED) with no flag: the type is
    new and no existing caller makes one (as P10's F123); the triage notice and the intake settings simply skip it.
  - **F140** The promotion way of quantity tiers (F41) needs a purchasing ProductStore with tax and shipping calculation,
    store emails and reservation turned off for purchase parts; not built (§7). Tiers are published price rows.
  - **F141** ProductPrice named no source; `sourceOrderId` and `sourceOrderItemSeqId` are added and Products'
    `PricePolicy.js` writes them through `store#ProductPrice` (a widening that refuses nothing); a `replace#ProductPrice`
    successor names no source, as its price is not the quote's (review R3).
  - **F142** `expire#ProductPrice` takes an end now or later, so a published price starts a second ahead at the earliest
    and the tier's earlier row ends where it starts.
  - **F143** Design QuoteRequestSuppliers' per-supplier contact, send channel, deadline and capability expiry are not
    built: the recipients are the supplier's order addresses, else its primary ones (as a PO's), the deadline the RFQ's, and
    P16 adds the capability and link.
  - **F144** Quotes are never supply, checked by reading: `run#SupplyPlan` counts placed to sent parts and a
    conversion's OrderOpen drafts (SupplyPlanning.js), P10's sourcing counts RequirementSupply, which no quote has; Mantle
    reserves only placed or approved parts with a store (F35), auto-approves only on Placed, and P3's gate and P7's drop-ship
    SECA act on Placed and Approved.
  - **F145** A declined quote (OrderRejected) leaves Purchase orders' quote filter (quote statuses only) and shows in its
    Closed view; its record link stays QuoteDetail (`wasQuote`). P12's Not awarded (OrderCancelled) is the same case.
  - **F146** Under Retail's `commercialRevisionOnly` a quote line's price change moves the quote's `orderRevision`
    (P3's rule on any purchase order); harmless, as no approval decision exists on a quote, and it counts amendments.
  - **F147** AppStructure's placeholder count drops by one (Sourcing built): its floor is 54.
  - **F148** Every request's audit-logged change shows in its Chatter timeline, so logging Request's response date
    and description on create ("true") gave every request with them a "Set to" entry (Chatter's paging spec failed). Built
    as "update", which left a text first set after create unlogged (no revision, a wrong as-of print). Review R1: Request
    has no audit-logged field again; `store#QuoteRequest` writes the RFQ header's EntityAuditLog rows itself (response date,
    text, facility, currency; a first set included), so only an RFQ's timeline shows them.

**Review Nov 4 (P11).** Checked the Mantle and BOSS diffs against this section, §2, design §5 and R-PUR-13/21: access (every
Sourcing transition calls `check#Record` before the Mantle service; the quick creates follow P10's, the root's
`get#SharedContext`), the organization and permission checks in each Mantle verb, restricted amounts ("Withheld", never
zero; a supplier's print and email name no other supplier), the send (per-recipient transaction, failure named and the
others sent, PDF stored once per print hash, operation replay), the Commons and Projects exclusion (`get#RequestAccess`,
`find#RequestRows`, Projects' list; only the RFQ type; Chatter's Request access is `get#RecordLinkInfo`, untouched), the
convert refusal (the RFQ type only) and that quotes leave P5's expected receipts, P6's bill and match lists and P9's
acknowledgements out (each a whitelist of placed-to-completed statuses). Fixes:
  - **R1** (medium) The RFQ header's material change was read from Request's "update" audit, so a specification text first
    set after create (and any facility or currency change, not logged at all) moved no revision, needed no new send, and an
    as-of print showed the later text. `store#QuoteRequest` now logs the header's response date, text, facility and currency
    itself (`headerAudit`, a first set included), the as-of print reads facility and currency back too, and Request's
    entity audit is removed, so no other request's timeline changes (F148). QuoteRequestDetail's history labels them.
  - **R2** (medium) `publish#SupplierQuotePrice`: a thru date given past the quote's validity published a price the supplier
    never quoted; it is now capped at the quote's thru date. A per-term row (`termUomId`) of the scope is no longer ended
    (another scope, as a store's and an agreement's). An awarded quote (placed from OrderProposed, P12) still publishes.
  - **R3** (low) `replace#ProductPrice` copied the source quote to a successor with a new price; the successor names none.
  - **R4** (tests) Sourcing.spec: the text first set after a send moves the revision and is absent from the earlier print; a
    tier of 100 is its own row and leaves the tier of 0, the supplier's agreement price and another supplier's price alone;
    a new feature runs `run#SupplyPlan` at a warehouse with a requested and a proposed quote of 20 and gets the whole
    minimum of 30 suggested, nothing reserved, placed, approved or RequirementSupply (F144 now tested; about 0.3 s).
  - Left for the lead: F145 stands. Purchase orders' Closed and All views still show a declined quote, and P12's Not
    awarded ones; a quote order carries no marker the PO list's find can test (a cancelled draft PO looks the same: no
    `placedDate`, OrderCancelled), and the audit-log test `wasQuote` uses is per order. P12 should add one (for instance a
    quote flag or the RFQ id on OrderHeader set by `quoteOrder`) and `Orders.js purchaseFind` exclude it. Also: an
    agreement price row exactly as specific as a published row (agreement in place of the unit) is an equal-precedence
    overlap Products' `store#ProductPrice` refuses, so the publish fails with Products' message; P13's agreement rows should
    name their unit or item, or the publish should say PRICE_OVERLAP.
  - Specs: Mantle Sourcing (7), ProductPricePolicy, ProductEffectivePrices, ProductPriceLists, OrderProcureToPayBasicFlow,
    PurchaseRequests, PurchaseOrders, SupplyPlanning, DropShip, WorkProjectRequests (87 features, pass); BOSS
    PurchasingSourcing, PurchasingAccess, PurchasingOrders, Requests, ProjectRequests, ProjectsAccess, Chatter (88, pass).
- **Wave 7 suites (Nov 4, on master after P11 and P14b merged):** standalone mr-mantle 1,637 passed, 2 failed (the
  baseline), 11 skipped; `./moq test-apps` 2,905 server and 14 client features passed, none failed. A cargo clippy run of
  another checkout (mr-moqui-base) loaded the machine during the apps run, so its feature times (mr-mantle 597 s against
  254 s standalone, mr-boss 261 s server and 42 s client, ProductionChanges 15.5 s and AccountingPaymentCorrections
  15.2 s) measure that load; `moqui lint --screens` clean.

### P12 — Comparison and award

- **PUR-RFQ, the award** (§4; F19). No award record: an award is the placed quote order with its links.
  - `mantle.order.SourcingServices.compare#SupplierQuotes`: the RFQ's quote lines in the demand's unit, through
    Products' conversions and pack products, priced at the compared quantity by the resolver's tier rows and any
    promotion child items, in a display currency at Accounting's dated rates. A missing rate, freight or unit is
    Unknown or Not comparable, never zero or cheapest; committed price and estimated landed cost stay apart.
  - `preview#Award` (validity, `check#SupplierUsable`, `check#ProductUsable`, `check#Budget`, substitutes) and
    `commit#Award`: per supplier group, it sets each chosen quote line's quantity to its allocation (audit-logged) and
    places the quote ("Place from Quote") with RequirementSupply, under lock, a result per group, never approving or
    sending. The `PurchaseAwardApproval` topic, where policy needs it, decides before the placing.
  - `close#QuoteRequest`: the remaining quotes cancelled as Not awarded (F19), their capabilities revoked once P16
    issues them, and a reviewed regret notice with a result per recipient (R-PUR-35).
- **Screens** (design §5): QuoteComparison (CompareBasis, OfferComparison, SelectOffer) and Award (AwardPreview,
  AwardCommit, CloseSolicitation). Phones and the terminal pick a demand line, then its offers.
- **Outputs:** the comparison print and CSV, with the original and normalized basis.
- **Usable when** (design §14.4 #1, the award):
  - 10 units split across two suppliers' quotes place both as draft POs with their allocated quantities; with one
    supplier blocked, its group fails by name and the other is placed;
  - a double commit answers the first result;
  - a quote in a currency without a rate shows Not comparable;
  - the third supplier's quote is cancelled as Not awarded with a regret notice, and the uncovered demand is left for
    the next run.

**Built Nov 4 (P12).**
- Mantle:
  - `entity/SourcingAwardEntities.xml`: OrderHeader's `supplierQuote` (Y on an order made as a supplier quote, set by
    Sourcing.js `quoteOrder`, kept once placed; F156) and the Default flow's OrderRequested → OrderCancelled ("Cancel Quote
    Request", F157). `data/SourcingAwardSetupData.xml`: the `PurchaseAwardApproval` topic, seeded as P4's and P10's
    (approve#/refuse#PurchaseSource, a refusal needs a reason), and the `MANTLE_RFQ_REGRET_EMAIL` template;
    `template/order/QuoteComparison.print.html.fancy` and `QuoteRegretEmail.html.fancy`.
  - `service/mantle/order/SourcingAwardServices.xml` over the new `Awards.js`, included by name in
    `mantle.order.SourcingServices` (eight service-includes appended to SourcingServices.xml):
    `compare#SupplierQuotes` (per RFQ item, or the one chosen for phones and the terminal: its offers, the linked quote lines
    and the quote's other lines of a pack (PatPackagingFor, followed down) or a declared substitute (PatEquivalent,
    PatReplacement); the demand's unit through the dated unit conversions (Products' `convert`); priced at the compared
    quantity (the item's quantity left to award by default) by the quote's published tier rows (ProductPrice with the quote as
    source) else the line's price; in a display currency at Accounting's rate of a day (`Currencies.js rateOn`); the
    original basis beside the normalized unit price, committed amount, freight share and estimated landed cost; RATE_MISSING,
    UOM_INCOMPATIBLE, UOM_MISSING, PRODUCT_DIFFERENT, NOT_QUOTED, QUOTE_EXPIRED and AWARDED as Not comparable with the reason,
    never ranked; the comparable ranked by unit price with the reason; `output` csv or print), `preview#Award` (allocations as
    a list or `orderId:orderItemSeqId:requestItemSeqId:quantity[:S]` text, grouped per quote: INVITATION_UNAVAILABLE,
    QUOTE_CLOSED, QUOTE_EXPIRED, SOURCE_CHANGED against the quote revisions, the supplier check's Stop codes,
    PRODUCT_NOT_USABLE, QUANTITY_NOT_WHOLE for part of a pack, INVALID_SUBSTITUTE, DEMAND_ALREADY_COVERED in commit's order,
    BUDGET_STOP; each demand line's left, allocated and uncovered; whether the award needs approval), `commit#Award` (the RFQ
    locked, the operation key's first result answered; each quote placed by `commit#AwardGroup` in its own transaction under
    the lock of the quote and its requirements: each chosen line's quantity set to its allocation and its price given (a tier
    where one applies), both audit-logged with "Awarded from RFQ", the quote's other product lines taken off and named in an
    internal note naming the award, the RFQ link at the awarded quantity, for request demand a RequestItemOrder from the
    request line and RequirementSupply RstPurchaseOrder under the key, the requirement Ordered once covered, then
    `place#Order` (Place from Quote) and P4's notice where the gate keeps it Placed; never approved or sent; a failure by name
    while the others go on), `decide#AwardApproval` with `record#AwardDecision` (below), `close#QuoteRequest` (preview, or:
    the quotes left cancelled as Not awarded with a note, their capabilities revoked, the regret notice per recipient in its
    own transaction, SENT/QUEUED or FAILED with RECIPIENT_REQUIRED, RECIPIENT_INVALID, DELIVERY_FAILED; warnings for draft
    POs still open for the same demand and the demand left uncovered; the RFQ Completed, or Cancelled for a draft with nothing
    awarded; AWARD_PENDING while an award waits; operation key replay) and `store#SupplierQuoteFreight` (the quote's one
    ItemShipping line, set, changed with its reason or taken off).
  - The award's approval (D8): where the organization has PasAward PurchaseApprovalPolicy rows in effect, `commit#Award` places
    nothing: the award's allocations are its PostingOperation (status `pending`, its revision the submit time) and the
    PurchaseAwardApproval notice goes to the step's approvers with `awardKey`; `approve#PurchaseSource` hands a Request notice
    with `awardKey` to `decide#AwardApproval`, which records the decision in its own transaction (`record#AwardDecision`: the
    step's checks, the PurchaseApprovalDecision of the RFQ at the award's revision, STALE_REVISION, a refusal marks the
    operation `refused`, the last step `approved`), then places the groups as commit does (the approver passes
    `commit#AwardGroup` only for an approved award naming the quote) and keeps the result. With no PasAward row an award
    places at once, each placed quote meeting P3/P4's gate.
  - Existing Mantle, refusing nothing: `PurchaseApprovals.js` (`source.topic` for notify and clearNotices; the award branch
    of the topic handlers), `PurchaseRequests.js convertOrderCommitments` (an awarded line's RFQ link is passed over when the
    line has its request line's link, so the request's commitment converts once), `Sourcing.js` (the quote marker; a quote
    line's quantity changed alone keeps its price, F159).
  - Spec `test/order/SourcingAwards.spec.js` (5 features, about 1.1 s).
- BOSS:
  - `ironstone.purchasing.AwardServices` (`Awards.js`): `get#QuoteAwards` (QuoteDetail's awards: each awarded line with its
    RFQ item, awarded and ordered quantity, price withheld from a user who may not see prices, the request line and
    requirement it supplies, the RFQ item's demand left and the purchase order; or Not awarded / Declined with the reason)
    and `get#AwardResult` (the Award screen's result of an award or close from its operation, the placed orders' links and
    the failed groups' allocations to retry). `Sourcing.js`: an awarded quote opens in QuoteDetail (Awarded), a cancelled one
    reads Not awarded. `Orders.js purchaseFind` leaves out a marked quote never placed (F145). `Purchasing.js`: the two link
    paths. `Approvals.js` and `Approvals.xml`: the award topic.
  - Screens: `Sourcing/QuoteComparison.xml` (CompareBasis: display currency, rate day, compared quantity; the split: Demand
    lines at left, the chosen line's OfferComparison at right; SelectOffer: Add allocation with a substitute accepted
    explicitly; the award so far with demanded, selected and remaining per line and Review the award; Print and CSV),
    `Sourcing/Award.xml` (the wizard: AwardPreview with the groups, checks and demand; AwardCommit, Place N quotes with its
    confirmation; the result per group with Retry the failed groups; CloseSolicitation with the quotes to cancel, the warnings,
    each recipient, the regret text to review and Close RFQ, then the result per recipient), QuoteRequestDetail's Compare quotes
    and More: Close RFQ, QuoteDetail's Freight estimate and its Awards box, Quotes' New supplier quote currency.
  - Data: BossSetupData's PurchaseAwardApproval link (QuoteRequestDetail); BossPurchasingDemoData's regret template on the demo
    mail sink.
  - Specs: `PurchasingSourcing` gains a feature (QuoteComparison's and Award's one html render, no award yet, a declined quote
    marked and out of Purchase orders' Closed view); PurchasingAccess gains a feature (the comparison for buyers and
    approvers, a reader refused; the close and award the buyer's; another organization refused); `routeFixtures` lists the two
    routes. Acceptance `test/acceptance/Purchasing/PurchasingAwardWalk` (4, the usable-when items through the screens'
    transitions).
- Tests run: Mantle SourcingAwards (5), Sourcing, PurchaseApprovals, PurchaseRequests, PurchaseOrders,
  OrderProcureToPayBasicFlow, OrderLifecycle, OrderBulk, CrmMiscServices, WorkProjectRequests, SupplyPlanning,
  PurchaseRevisions (103 features, pass); BOSS PurchasingSourcing (5), PurchasingAccess, PurchasingOrders, PurchasingApprovals,
  PurchasingRequests, Notifications, PurchasingSuppliers, PurchasingAgreements, TodayPanel, QuickCreate (all pass); acceptance
  PurchasingAwardWalk (4) and AppStructure (18), pass. QuoteComparison, Award (preview and close) and QuoteDetail render in qvt
  and tui without error (checked once by hand). `moqui lint --screens`: no idiom or hazard site in the new and changed
  screens (informational anchors only).
- Decisions:
  - No award record (§4): an award is the placed quote with its links; a pending award's allocations are its operation's
    request (PostingOperation, CX-POSTING), the only place they wait, and its decisions are PurchaseApprovalDecision rows of
    the RFQ at the award's revision (the submit time).
  - An award places a whole quote: one supplier, one live quote per RFQ, so a supplier group is a quote. The quote's lines not
    chosen are taken off before it is placed (named in its note, their prices still in the audit log); its freight line stays.
  - The award approval is needed only where PasAward policy rows are in effect ("where policy needs it"); the organization's
    PO approval (P3/P4's gate) still meets every placed quote.
  - The tier price at the compared quantity is the quote's own published row (sourceOrderId), not the resolver's whole
    choice, which could pick another supplier price or an agreement's.
  - The budget at the award is shown and stops a group only for a user who may read budgets (check#Budget's permissions); for
    a buyer it is withheld and decided at the PO's approval, as P4 reserves it. Request-sourced lines are left out, as P10's.
  - Quote capabilities: close#QuoteRequest revokes a not-awarded quote's ExternalAccessCapability rows directly (record types
    Order, Quote, SupplierQuote); P16's SupplierPortalRevoke EECA revokes them anyway when a quote leaves the quote statuses, so
    this is belt and braces (`isServiceDefined` is not reachable from a script to call P16's service conditionally).
- Findings (provisional):
  - **F156** (F145) A quote order had no marker: OrderHeader's `supplierQuote` is set when a quote order is made, and
    Purchase orders' find leaves out a marked order with no `placedDate` (declined or not awarded); an awarded quote is placed
    and listed. Quotes made before P12 carry no marker and stay listed when closed.
  - **F157** OrderRequested had no transition to OrderCancelled; a requested quote never answered is not declined
    (OrderRejected is the supplier's "Reject Request"), so the Default flow gains "Cancel Quote Request" (a widening; no
    existing service moves a requested order there).
  - **F158** (F35) Cancel Quote fires the EDI acknowledgement SECA on OrderCancelled; `record#OrderAcknowledgment` returns at
    once for an order not received in an 850, which no quote is. Accepted, no condition.
  - **F159** Mantle's `update#OrderItem` prices a product line again by the resolver when no `unitAmount` is given, so
    P11's `store#SupplierQuoteItem` changing a quote line's quantity alone lost the quoted price (and placing an award lost
    the totals: a zero grand total auto-approved the placed order). Both now pass the price.
  - **F160** QuoteTerms' freight estimate was not built (P11): `store#SupplierQuoteFreight` keeps it as the quote's one
    ItemShipping line, so the landed cost has a source; tax inclusion, MOQ/increment and warranty are still not recorded.
  - **F161** Lead time is the line's promise, else the quote's delivery date; the on-time rate from scorecard evidence is
    P15's and not shown. Risk is the buying policy's supplier check.
  - **F162** The awarded-quote branch of `publish#SupplierQuotePrice` is now tested (SourcingAwards). An agreement price row
    exactly as specific as a published one still meets Products' overlap refusal with its own message; P13's rows name the
    agreement and item, so they are a narrower scope; the case is not exercised by P12's specs and is left as P11 noted it.
  - **F163** Design SelectOffer's "requester acceptance where policy requires it" for a substitute is not built: a
    substitute is accepted by the buyer's explicit choice (INVALID_SUBSTITUTE without it); the referral of released BOM
    material to Manufacturing change review is not built.

**Review (P12, Nov 4).** Checked against §2, design §5 QuoteComparison/Award, D8, F19, F35: commit#Award's RFQ lock, operation
key and per-group transactions; the PasAward path (PostingOperation, record/decide, separation through `refusalFor`); the F159
price paths; the removed lines' record; compare's ranking, rates, units and packs; close#QuoteRequest; the F145 marker in
`purchaseFind`; `convertOrderCommitments`; BOSS screens' check#Record before each Mantle call. Fixes (mr-mantle):
  - R1 (high) An approved award was placed by `decide#AwardApproval` without the RFQ's lock and against the quotes as they were
    at the decision, not at the submit: two awards approved at once could over-allocate an item with no requirement, and a quote
    the supplier repriced while the award waited was placed at the new price. decide now places under the RFQ's lock, answers a
    concurrent decision's result, and checks each quote against the award's submit (its revision and a stamp of its lines and
    validity: a quote's orderRevision does not count a line change outside commercialRevisionOnly), so a changed quote fails
    SOURCE_CHANGED and stays proposed. An approval of an award whose RFQ changed after the submit is STALE_REVISION (a refusal
    still goes). close#QuoteRequest also waits on an award approved but not yet placed (AWARD_PENDING).
  - R2 (medium) `placeAll` passed each quote's current revision to commit#AwardGroup, so commit#Award with `quoteRevisions`
    placed a quote preview had marked SOURCE_CHANGED; it now passes the revision the award was made against.
  - R3 (medium, F159) store#SupplierQuoteItem kept the price only when the quantity changed: a change of the promised date,
    description, unit or supplier code alone still repriced the line by the resolver, and Sourcing.js `followItem` (an RFQ item
    changed under a requested quote) did too. Both now pass the line's price on every update.
  - R4 (medium) commit#AwardGroup without an awardKey placed a quote where PasAward rows are in effect (any PURCHASE_ORDER_EDIT
    caller of the internal service skipped the award's approval): now AWARD_APPROVAL_REQUIRED.
  - R5 (low) A guard before Place from Quote: each awarded line must still carry its awarded price and the quote a non-zero
    total, else AWARD_PRICE_LOST for that group (a zero total auto-approves with the gate off; a zero-priced line was already
    NOT_QUOTED by `priceAt`).
  - Spec: SourcingAwards gains a feature (gate on: the approved award's quote stays Placed with PURCHASE_APPROVAL_REQUIRED and
    its total; the direct group refused; a quote repriced while its award waits is not placed).
- Confirmed: the unchosen lines' original offer is in the award's internal OrderNote (line, product, quantity, price) and the
  chosen lines' quantity/price changes in the audit log with "Awarded from RFQ"; P15's scorecard reads receipts and
  dispositions, not offers, so nothing it needs is lost. `convertOrderCommitments` holds a line linked to both its RFQ item and
  its request line once (the request's commitment converts; an RFQ-only line still reserves); no spec exercises it with a
  budget. Not comparable offers (rate, unit, product, not quoted, expired, awarded) are never ranked. purchaseFind leaves out
  marked unplaced quotes and keeps placed ones.
- Left for the lead: (1) at the P16 merge, `revokeCapabilities` in Awards.js (about 15 lines) can be replaced by P16's
  revoke#QuoteCapabilities or dropped for its EECA. (2) The quote revision P11 compares (OrderHeader.orderRevision) does not
  move on a line's price change unless the policy sets commercialRevisionOnly, so QuoteComparison → Award's SOURCE_CHANGED
  rarely fires in the default configuration (the preview shows the current price, so the buyer sees it; R1's stamp covers the
  approval path). (3) An unchosen line's published ProductPrice rows (publish#SupplierQuotePrice) stay in effect after the
  line is taken off.

### P13 — Agreements

- **PUR-AGREEMENT**, on the shared rules (§2).
  - `AgrPurchase`, the Agreement status items AgmStDraft, AgmStActive, AgmStExpired, AgmStClosed and AgmStCancelled and
    their flow, and `AgreementItem.amountCap` and `releaseTolerancePercent` (F10).
  - Versions by the audit log: Mantle already logs Agreement's status, other party and dates and AgreementItem's
    quantity (F18); P13 adds the caps, tolerance and terms. AgreementItems and terms are effective-dated. An approved
    agreement stores its PDF as AgreementContent; the agreement prints as of a date. Signers and other parties are
    AgreementParty rows.
  - Release allocations, a record of their own (§2): order, line, quantity, value and the agreement's revision time.
  - `mantle.party.AgreementServices` `store#PurchaseAgreement`, `store#AgreementItem`, `get#ReleaseBalance` and
    `release#PurchaseAgreement` (`PURCHASE_ORDER_EDIT`). A release over the remaining quantity or value is refused
    beyond the tolerance, under a lock. Activation is approved as a PO is, through `decide#PurchaseApproval` on the
    PurchaseOrderApproval topic with the agreement as source (§4).
- **Screens** (design §7):
  - Agreements: AgreementFind, AgreementList and NewAgreement, a template cloned without releases.
  - AgreementDetail: AgreementHeader, AgreementTerms, AgreementItems, AgreementReleases, ReleaseAgreement, History, and
    AgreementFiles through the existing agreement content services.
  - CreatePurchaseOrder's agreement release; OrderDetail's Agreements tab; Supplier360's Agreements tab.
- **Outputs:** the agreement, terms and release history print.
- **Usable when:**
  - a blanket agreement for 100 units and a value cap is approved, its PDF stored, and releases two POs; a third over
    the cap is refused, and one within the tolerance passes;
  - two releases at once cannot exceed the cap together;
  - a changed cap shows in the agreement's history, and its print as of the approval shows the old cap;
  - an expired agreement takes no new release and its POs stay;
  - a template has no balance; PriceExplain chooses the agreement's price for its release.

**Built Nov 4 (P13).**
- Mantle:
  - `entity/PurchaseAgreementEntities.xml`: `AgrPurchase`; the Agreement status flow AgmStDraft → AgmStActive (the approval),
    AgmStDraft or AgmStActive → AgmStCancelled, AgmStActive → AgmStExpired or AgmStClosed, AgmStExpired → AgmStClosed
    (StatusFlowTransition, the one flow Sales adopts, X13); Agreement's `agreementRevision` with `revisionDate`,
    `approvedRevision` with `approvedDate`, and its supplier, dates and currency logged "true" (they were "update", F57);
    AgreementItem's `amountCap` and `releaseTolerancePercent` (F10) with its product, unit and dates, all "true" beside Mantle's
    quantity; AgreementTerm's `fromDate`/`thruDate` (effective-dated terms) and its type, payment term, text and value, "true";
    `mantle.party.agreement.AgreementRelease`, the release allocation (agreement and item, order and line, quantity, unit
    amount, value, currency, the agreement's revision and its time, the price row, operation key); the content type
    `AcntApprovedVersion` and the signer role `AgreementSigner` (in RgpAgreement). `data/PurchaseAgreementSetupData.xml`: the
    daily `expire_PurchaseAgreements` job.
  - `service/mantle/party/PurchaseAgreementServices.xml` over the new `PurchaseAgreements.js`, included in
    `mantle.party.AgreementServices` by name (seven service-includes): `store#PurchaseAgreement` (a draft of the organization
    with the supplier, from a template's items, prices and terms without its releases; the header, effective-dated terms and
    signers; the buyer's close and cancel; TEMPLATE_INVALID, CURRENCY_REQUIRED, DATE_INVALID, AGREEMENT_CLOSED,
    SUPPLIER_CHANGE_RELEASED, CURRENCY_CHANGE_RELEASED, STATUS_INVALID, REASON_REQUIRED), `store#AgreementItem` (product, caps,
    tolerance, dates, text and the agreement's price; an item never approved or released is removed, any other ended;
    CAP_BELOW_RELEASED, PRODUCT_CHANGE_RELEASED, ITEM_APPROVED), `submit#PurchaseAgreement`, `get#ReleaseBalance`,
    `release#PurchaseAgreement` (under a lock on the agreement: a new draft PO or a draft of the same organization, supplier
    and currency, the line at the agreement's price through `get#ProductPrice` with the agreement and item, the allocation;
    TEMPLATE_NO_RELEASE, AGREEMENT_EXPIRED, AGREEMENT_NOT_ACTIVE, AGREEMENT_NOT_STARTED, AGREEMENT_CHANGE_PENDING,
    STALE_REVISION, ITEM_NOT_IN_EFFECT, PRICE_UNAVAILABLE, RELEASE_OVER_QUANTITY, RELEASE_OVER_VALUE, RELEASE_ORDER_INVALID;
    operation key replay), `get#PurchaseAgreementPrint` (as of a time from the audit log and the price rows, with
    `template/party/PurchaseAgreement.print.html.fancy`) and `expire#PurchaseAgreements`. Every verb checks PURCHASE_ORDER_EDIT
    (the reads also PURCHASE_APPROVE or PURCHASE_ORDER_APPROVE) and the agreement's organization (FacilityScope,
    RECORD_UNAVAILABLE).
  - The approval (§4): `decide#PurchaseApproval` and `preview#PurchaseApproval` take an `agreementId` (PurchaseOrders.js hands
    an agreement to PurchaseAgreements.js `decide`); the decision is a PurchaseApprovalDecision of the Agreement at its
    `agreementRevision`, by the organization's PasOrder steps for the agreement's value; the last step activates a draft, sets
    `approvedRevision` and stores the approved PDF as AgreementContent; a refusal leaves it as it was. PurchaseApprovals.js:
    the Agreement on the PurchaseOrderApproval topic, a source's own notice title (`source.title`), the message's
    `agreementId`, and `approve#`/`refuse#PurchaseSource` deciding an agreement's notice.
  - Specs `test/party/PurchaseAgreements.spec.js` (3 features: activation, PDF, template refusals; releases within caps and
    tolerance and a cancelled line's give-back; a changed cap's revision, pending release, history, as-of print and expiry)
    and acceptance `test/acceptance/party/PurchaseAgreementWalk.spec.js` (4: the usable-when items Mantle-side, two releases at
    once through `parallel`).
- BOSS:
  - `ironstone.purchasing.AgreementServices` (`Agreements.js`): `find#Agreements` (views Active, Expiring in 30 days,
    Exhausted, Draft and awaiting approval, Templates, Closed; limit, released and remaining value, Withheld for the reader),
    `get#AgreementDetail` (header, items with balance, terms, releases, signers, history, files, decisions, approval preview,
    actions by capability and status) and `get#OrderAgreements`; the choices `releaseAgreements`, `agreementTemplates`,
    `agreementItems`, `agreementSigners`, `termTypes`, `settlementTerms` and `currencies`. `Purchasing.js`: the agreement kind
    (AgrPurchase only) opens `Agreements/AgreementDetail`, its palette find, the P13 link paths.
  - Screens: `Purchasing/Agreements.xml` (no longer a placeholder: AgreementList, AgreementDetail hidden),
    `Agreements/AgreementList.xml` (AgreementFind and AgreementList with views and saved finds, NewAgreement with a template),
    `Agreements/AgreementDetail.xml` (header with Send for approval, Approve or Release by state and More: Edit agreement,
    Print as of, Refuse, New agreement from this template, Close, Cancel; Print; Balance; Items with Add item, Edit, End and
    Explain price (PriceExplain with the agreement); Terms; Releases; Approval; Signers; Files with Add file through
    `create#AgreementContent`; History), `template/PurchasingAgreementRelease.xml` (ReleaseAgreement: the transition and the
    dialog, on AgreementDetail and on PurchaseOrders as CreatePurchaseOrder's agreement release),
    `template/PurchasingOrderAgreements.xml` (OrderDetail's Agreements, one section-include), `Shared/Supplier360/
    PurchasingAgreements.xml` (Supplier360's Agreements tab).
  - Data: BossSetupData's PurchaseOrderApproval link opens AgreementDetail for an agreement's notice; BossPurchasingDemoData's
    `BOSS_PUR_AGR_A` (Retail's active blanket agreement with Ziddleman for DEMO_1_1: 100 units, $1,000.00, 5%, $9.00, a term),
    `BOSS_PUR_AGR_TPL` (a template) and `BOSS_PUR_AGR_SVC` (Ziziwork Services' draft).
  - Specs: `PurchasingAgreements` (2: the list's views and withheld amounts with AgreementDetail's one html render; a release
    through AgreementDetail's transition at the agreement's price, in OrderDetail's Agreements; 0.8 s); PurchasingAccess gains
    a feature (the agreement's scope, change and release for the buyer, its record link; 21 features); `routeFixtures` lists
    the two agreement routes. Acceptance `test/acceptance/Purchasing/PurchasingAgreementsWalk` (4: the usable-when items through
    the screens).
  - Tests run: Mantle PurchaseAgreements, PurchaseApprovals, PurchaseOrders, PurchaseRevisions, OrderProcureToPayBasicFlow,
    ContentRecords, CrmMiscServices (all pass); BOSS PurchasingAgreements, PurchasingAccess, PurchasingOrders,
    PurchasingSuppliers, PurchasingApprovals, ProductsSuppliers, ManufacturingSubcontracting (all pass); acceptance
    PurchaseAgreementWalk (Mantle, 4) and PurchasingAgreementsWalk (BOSS, 4), pass. The new screens render in qvt, tui and
    html for the buyer, reader and approver without error (checked once by hand). `moqui lint --screens`: no idiom or hazard
    site in the new and changed screens (informational anchors only).
  - Inventories: usl-inventory's agreement services and `decide#PurchaseApproval`'s agreement; ss-inventory's EditAgreement
    and FindAgreement forms (UpdateContentForm stays blank: files are added, not edited).
- Decisions:
  - Agreement activation is approved as a PO is (§4): by the organization's purchase order (PasOrder) steps for the agreement's
    value (its items' value caps, else their quantities at the agreement's price); no agreement source type is added.
  - An agreement's revision is a counter, `agreementRevision`, with its time (F130); every key-field change counts it once,
    supersedes earlier decisions and, on an active or submitted agreement, sends the new revision to its approvers. A changed
    active agreement takes no release until its revision is approved (AGREEMENT_CHANGE_PENDING); its earlier releases stay.
  - What a release uses is its allocation less its line's cancelled quantity (none for a cancelled or rejected order), so a
    cancelled line or a closed remainder gives its quantity and value back; a draft line raised past its allocation is not
    counted against the cap (the allocation is the record).
  - The agreement's price is a ProductPrice row of the agreement and item written by store#AgreementItem (F132); the
    resolver ranks agreement rows first only when the agreement is in its context, so it changes no other PO's price.
  - Expiry: a release checks the dates itself; the daily job sets Expired. Templates are never approved or released.
- Findings (provisional):
  - **F130** PurchaseApprovalDecision's `sourceRevision` is an integer bound to a counter, and design §17 made an
    agreement's revision "the time of its last audit-logged change". Agreements get `agreementRevision` and its
    `revisionDate` (the release allocation keeps both); design §7 and §17 now say so.
  - **F131** The PurchaseOrderApproval topic's title template names a purchase order (`${orderId}`) and is seed-initial;
    an agreement's notice sets its own title (`notify` reads `source.title`), and BOSS's link template picks AgreementDetail or
    OrderDetail by the message's `sourceEntityName`.
  - **F132** `store#ProductPrice` needs SUPPLIER_PRICE_EDIT, which the buyer group does not hold; the agreement's price is
    part of the agreement, so `store#AgreementItem` writes the agreement-scoped row itself under PURCHASE_ORDER_EDIT (ending
    and starting rows, so the price as of a time reads back). Reading it still needs SUPPLIER_PRICE_VIEW (the resolver).
  - **F133** mr-marble's agreement screens (F32) write raw: the audit log now covers what they write of the logged
    fields, but a raw change does not count `agreementRevision`, so a marble change of an active agreement is not sent for
    approval again. No BOSS group reaches marble.
  - **F134** The recurring-release rule (F49) is not built: a recurring release needs a schedule per agreement item (a
    frequency and next date) and a job calling `release#PurchaseAgreement`, which already checks the caps, dates and approval
    again each time; left to §7 with PurchasePolicy's field.
  - **F135** AgreementFiles is AgreementDetail's own list and upload over `create#AgreementContent` with the record check,
    not Commons' `record-files`, so the approved PDF is withheld from the reader as OrderDetail's issued PDF is (P3 R1).
  - **F136** Supplier360's new Agreements tab is listed in every app's tab menu data though its condition keeps its
    content to Purchasing (F50).
  - **F137** The Mantle regression spec takes about 3 s (up to 6 s when its first approval renders the run's first PDF);
    mr-mantle's feature time was 294 of 300 s at wave 3, so the lead may move its third feature to acceptance.

**Review Nov 4 (P13).** Checked: release#PurchaseAgreement's lock (the acceptance walk's two parallel releases), quantity and
value caps with the tolerance, and its refusals of an expired, draft and changed-but-unapproved agreement; the line goes
through store#PurchaseOrderItem (check#ProductUsable) and a new draft through create#PurchaseOrder (the supplier check);
decide#PurchaseApproval without orderId (neither id is RECORD_UNAVAILABLE; orders unchanged: PurchaseApprovals,
PurchaseOrders, PurchaseRevisions pass); the Agreement status flow and audit-log changes against Mantle's other agreement
users (no Mantle, marble or BOSS writer sets an Agreement status outside P13; marble's EditAgreement has no status field;
the flow only adds transitions the entity-auto status check needed, so AgrSales and other agreements are unaffected);
F132 (store#AgreementItem's rows always carry the agreement and item, the resolver matches them only with that agreement
and item in its context, so no general supplier price is written: not an escalation); AgreementDetail's files. Fixes:
  - R1 (medium) A released draft line could be raised past its release, or repriced above it, and keep the agreement's
    price beyond the caps (the allocation is the record): `store#PurchaseOrderItem` and a revision (PurchaseRevisions.js)
    now refuse a released line's quantity above its releases or a price above their price (RELEASE_LINE_OVER, from
    PurchaseAgreements.js `releasedLineRefusal`); more comes from another release, which checks the caps. Only lines with
    an AgreementRelease are checked, so no existing order changes.
  - R2 (medium) An item without the agreement's price was released at the supplier's general price; a release now needs
    the agreement's own price row (PRICE_UNAVAILABLE), and a release to an existing draft runs the buying policy's supplier
    check as a new draft does.
  - R3 (medium, F132's other side) `store#`/`replace#`/`expire#ProductPrice` (SUPPLIER_PRICE_EDIT) could change an
    approved purchase agreement's price row with no revision or approval; PricePolicy.js refuses writes to an AgrPurchase
    agreement's rows (the type is new, so no existing row is affected).
  - R4 (low) AgreementDetail's uploadFile took any content type, so a buyer could store a file as the approved agreement
    (AcntApprovedVersion); it now takes only the form's kinds. PurchasingAccess's agreement feature checks the reader's
    approved PDF withheld, another organization's file refused and the spoofed upload refused.
  - R5 (F137) The Mantle spec's third feature kept only its rules (change pending, stale revision, the R1-R3 refusals,
    expiry); the history, as-of print, reapproval and the expiry job are acceptance's PurchaseAgreementWalk. 3.2 s.
  - R6 AppStructure's placeholder floor is 56 (Agreements built).
  Left: a changed item product keeps the old product's price row until a price is set (the release then refuses
  PRICE_UNAVAILABLE, which is safe); F133 (marble's raw writes count no revision) stands.

### P14 — Replenishment

- **CX-PLANNING, the buy conversion** (§4). Manufacturing P13 built the run, the schedule and the make conversion, and
  P14 the outside-processing lines. Here, in `mantle.product.SupplyPlanningServices.convert#PlanningSuggestions` under
  `PURCHASE_ORDER_EDIT`: an ordinary buy suggestion to a draft PO per supplier group, to an approved purchase
  request as policy says (crosscut §4.2), or for customer demand to P7's drop-ship route (the sales line moved to the
  supplier's drop-ship facility), with RequirementSupply and `check#ProductUsable`; a competing conversion leaves
  DemandAlreadyCovered by name. Customer-order demand keeps its sales line, and the receipt on Purchasing's
  ShipmentDetail offers `reserve#AssetForOrderItem` for it (R-PUR-37). Held receipts show as Manufacturing decided (its
  §4): a pending-release line, left out of netting unless the organization's plan schedule includes held quantity due
  within the lead time.
- **Warehouse's contract** (§4, CX-FACILITY-POLICY), through `store#ProductFacilityPolicy` (`STOCK_POLICY_PLAN`),
  audit-logged: the snooze, with its thru date and reason. It stops automatic conversion, not the shortage.
  `ProductFacility.maximumStock` and `reorderMethodEnumId` (RdmFixedQuantity or RdmUpToMaximum) exist (Products P7),
  and `run#SupplyPlan` reads them (R-PUR-19).
- **Products' contract** (§4, PRD-IMPORT): reorder-rule rows as a row kind of ProductImport (design §15), each through
  `store#ProductFacilityPolicy` with its row result.
- **Screens** (design §8):
  - SupplyPlanning: Manufacturing's `Shared/SupplyPlanning` with the Purchasing row of crosscut §3.20, buy suggestions
    by default with the whole demand's provenance.
  - InventoryAvailability: Products' shared screen with the Purchasing row of crosscut §3.7.
  - ReorderRules: ReorderFind; ReorderRuleList over `store#ProductFacilityPolicy`; SuggestLevels, which previews the
    minimum and maximum from average daily demand × lead time + safety stock and applies them per row with named
    failures; and PlanSchedule over `store#PlanSchedule` (`SUPPLY_PLAN_RUN`) with a preview run.
- **Shell:** Home's shortfall count with the plan's date.
- **Usable when** (design §14.4 #2 and #3, the buy part):
  - a shortage of a purchased component shows as a buy suggestion; a buyer converts it to a draft PO, and a planner's
    second conversion is DemandAlreadyCovered;
  - an approved purchase request's demand is not suggested again;
  - a customer-order shortage converted to a PO keeps its sales line, and its receipt offers to reserve for it;
  - a planner sets a minimum and an up-to-maximum rule from ReorderRules and from InventoryAvailability through the same
    service, and the plan orders up to the maximum; SuggestLevels names one product without demand history and applies
    the rest;
  - a snoozed rule still shows its shortage.

The lead split P14 in two: **P14a** (the base, below) and **P14b** (after P7 and P10): the request route and the drop-ship
route of the buy conversion, customer-order demand's reservation offer on ShipmentDetail, and the usable-when items that
need them (an approved request's demand not suggested again; a customer-order shortage keeping its sales line with the
receipt's reservation offer).

**Built Nov 4 (P14a, the base).**
- Mantle, the buy conversion (`SupplyPlanning.js`, `SupplyPlanningServices.xml`): `convertPermissions.PsmBuy =
  PURCHASE_ORDER_EDIT`; `convertBuy` makes a line of a draft (OrderOpen) purchase order of the suggestion's supplier for its
  facility, one order (one purchase part) per supplier and facility in the call, at the requirement's remaining quantity in
  the stock unit and the resolver's supplier price, with a RequirementSupply RstPurchaseOrder, the requirement Ordered and the
  suggestion converted; it refuses a stale plan (PLAN_STALE), an exception or no supplier (SUGGESTION_EXCEPTION), a closed
  suggestion, an unusable product (`check#ProductUsable` Purchase, PRODUCT_NOT_USABLE), no supplier-price read or price; never
  places or approves. A buy whose requirement is already covered by another operation is refused DEMAND_ALREADY_COVERED
  naming the covering line (no second order); a retry with the same operation key answers EXISTING. The pricing and draft
  order code is shared with the outside-processing conversion (`draftOrderLine`). Transfer stays METHOD_NOT_CONVERTED.
  `convert#PlanningSuggestions` takes `automatic`, which leaves a snoozed rule's suggestion (SUGGESTION_SNOOZED).
- Mantle, the plan: `run#SupplyPlan` reads the reorder rule (R-PUR-19): below the minimum a shortage orders up to the
  maximum (RdmUpToMaximum) or at least the reorder quantity (RdmFixedQuantity), with a "Reorder rule" line in its demand and
  supply; a snoozed rule's suggestion carries the warning SNOOZED (`snoozed`, and the thru date and reason in its
  `warningText`); the line of a draft order a conversion made counts as supply. `get#SupplyPlan` admits the new
  `SUPPLY_PLAN_VIEW` (MantleSetupData, ADMIN) and answers `canConvertBuy`.
- Mantle, Warehouse's contract: `entity/ReorderRuleEntities.xml` extends ProductFacility with `snoozeThruDate` and
  `snoozeReason`, audit-logged; `store#ProductFacilityPolicy` (`WarehousePolicy.js`, its checks now `facilityValues`, shared
  with the new `facilityPreview`) keeps them: a new snooze ends after now (SNOOZE_INVALID) and gives its reason
  (SNOOZE_REASON_REQUIRED), an empty thru date ends it, one left as it was is kept.
- Mantle, levels and import (`service/mantle/facility/ReorderRuleServices.xml`, `ReorderRules.js`): `preview#ReorderLevels`
  (STOCK_POLICY_PLAN or MANAGE; average daily demand from the facility's issuances over the history, the supplier's lead time
  else the one given, safety and cover days; NO_DEMAND_HISTORY and NO_LEAD_TIME named), `apply#ReorderLevels` (each row
  through store#ProductFacilityPolicy as its own transaction, each failure named) and `validate#ReorderRuleImportRow`;
  `data/ReorderRuleImportData.xml` registers the catalog import kind `reorderRules` (STOCK_POLICY_PLAN), each row stored
  through store#ProductFacilityPolicy with its row result.
- BOSS: `screen/Purchasing/Replenishment.xml` (tabs: Shared/SupplyPlanning as Supply planning, the default; ReorderRules;
  Shared/InventoryAvailability hidden), `Replenishment/ReorderRules.xml` with `Rules.xml` (ReorderFind, ReorderRuleList, New
  rule and Edit with the snooze), `SuggestLevels.xml` (preview, Apply on the selected rows from the server's own preview) and
  `PlanSchedule.xml` (store#PlanSchedule and Preview run); `template/PurchasingReplenishmentParts.xml` (choices, storeRule).
  Shared/SupplyPlanning's Purchasing branch: `planFacilityId` (the buying organization's warehouse or plant, default the
  latest current plan's), buy suggestions by default (`_ALL_` shows every method), Recalculate and Schedule for `plan`, Convert
  of buy and outside-processing suggestions for `buy` after `check#Record` facility, the order linked through Home's lookup
  until P3; its `choices` transition dispatches by app root; on the Manufacturing mount buy rows are no longer offered to
  convert. Shared/InventoryAvailability: the Purchasing context in `SharedContext.js` (one dispatch line to
  `Replenishment.js catalogContext`: Summary, Projection and Policy, stock policy for STOCK_POLICY_PLAN) and the snooze
  fields on Policy. `ironstone.purchasing.ReplenishmentServices` (`get#PlanContext`, `find#ReorderRules`) over
  `Replenishment.js`; `Purchasing.js` gains the `facility` record kind, the `planFacilities`, `planProducts` and
  `planningMethods` choices and the Replenishment links. Home: `get#Home` counts the open buy suggestions of the current
  plans (`shortfallCount`) with the latest plan's date, shown under the cards. BossSetupData: SUPPLY_PLAN_VIEW to the
  reader, METHOD_VIEW to the planner and administrator (F52).
- Specs: Mantle `test/product/Replenishment.spec.js` (6: snooze rules and audit; buy, up-to-maximum, fixed and snoozed
  suggestions; the buyer's conversion, retry, DEMAND_ALREADY_COVERED, the planner refused, automatic snoozed refused; draft
  lines as supply; levels preview and apply; the import kind) and SupplyPlanning's buy refusal now PERMISSION_DENIED for a
  planner. BOSS `PurchasingReplenishment` (3: the SupplyPlanning qvt render with Home's count, the screen conversion, the
  Rules html render with Policy's) and PurchasingAccess's facility case. Acceptance `PurchasingReplenishmentWalk` (4, the
  usable-when items above that need neither P7 nor P10); AppStructure's Purchasing routes (`routeFixtures`).
- Tests run: Mantle Replenishment, SupplyPlanning, ProductionSubcontract, ProductCatalogImport, WarehousePolicy,
  WarehouseFacilities (56, pass); BOSS PurchasingAccess, PurchasingReplenishment, ManufacturingPlanning, ManufacturingAccess,
  ManufacturingSubcontracting, ManufacturingReports, ProductsInventory, ProductsImport, WarehouseAccess (63, pass);
  acceptance PurchasingReplenishmentWalk (4), AppStructure (18) and PurchasingFoundationWalk, pass. `moqui lint --screens`: no
  idiom or hazard site in the changed screens (informational anchors only).
- Decisions:
  - A competing buy conversion is a named failure (DEMAND_ALREADY_COVERED), not EXISTING as for make: design §8 asks for the
    named row; the retry of the same operation still answers its first result.
  - A reorder rule's minimum is its reorder point; up to maximum adds maximum − minimum to the net, a fixed quantity orders at
    least the reorder quantity. A rule with a maximum and no minimum orders up to it once demand appears.
  - No automatic conversion exists yet; the snooze's contract is `automatic` on convert#PlanningSuggestions, and the plan
    still suggests the shortage with SNOOZED.
  - SuggestLevels applies the server's own preview for the selected rows, never values posted from the page.
- Findings (provisional):
  - **F51** The plan's "a planner's second conversion is DemandAlreadyCovered": the Purchasing planner holds no
    PURCHASE_ORDER_EDIT, so its conversion is refused PERMISSION_DENIED; the competing conversion is a second buyer's
    (the walk uses the administrator).
  - **F52** run#SupplyPlan explodes a made product's BOM through get#BomExplosion, which needs METHOD_VIEW; the
    Purchasing planner and administrator had none, so their run of a plan with a made product failed. BossSetupData grants
    METHOD_VIEW to both (F119's rule). A runner without METHOD_VIEW now gets METHOD_INVALID on the made product and the
    run goes on (review R1).
  - **F53** The Purchasing reader holds no permission, and get#SupplyPlan admitted none it could hold; Mantle gains
    SUPPLY_PLAN_VIEW (reads only), granted to BOSS_PURCHASING_READ.
  - **F54** A draft purchase order was not supply to the plan (firm statuses only), so a converted buy would be
    suggested again by the next run; the lines of a draft order with a RequirementSupply (a conversion's) now count.
  - **F55** Shared/SupplyPlanning took Manufacturing's `choices` by transition-include, which refuses a Purchasing user;
    it now dispatches by app root. SharedContext.js and PurchasingSpecLib gain a Purchasing branch and fixture that P2's
    Product360 context will also touch: reconciled at the merge: one Purchasing context in SharedContext.js serves Product360 (catalog read) and InventoryAvailability (Replenishment's stock read).
  - **F56** A tab's qvt fragment under Replenishment/ReorderRules renders the parent's tab menu (its content is loaded
    by the client), so AppStructure checks those routes for errors only; their content is PurchasingReplenishment's.

**Review Nov 4 (P14a).** Checked the Mantle and BOSS diffs against this section, §2 and the brief. Draft lines as supply:
only an OrderOpen purchase part's line with an active RequirementSupply counts (no other draft PO), a placed order counts
once under the firm statuses, and nothing else nets a requirement's coverage, so there is no double count;
Manufacturing's outside-processing drafts are service lines, never netted. Shared/SupplyPlanning: Manufacturing's
`choices` goes to the same service as its old transition-include, and buy rows were never convertible there (no
PsmBuy permission before), so its users see no change. METHOD_VIEW on the Purchasing planner and administrator reads
BOM structure only (no cost: PRODUCT_COST_VIEW is apart), and Purchasing's InventoryAvailability context sets every
method and cost capability false; kept, since without it a planner's plan would leave every made product an exception.
ProductFacility's snooze fields are an `extend-entity` in their own file (mr-mantle's pattern), audit-logged, and
store#ProductFacilityPolicy audits them with the change reason. Specs lean (Replenishment 6, PurchasingReplenishment 3,
0.7 s). Fixes:
- R1 (medium, F52): `run#SupplyPlan` called get#BomExplosion for a runner without a method read; its refusal marked
  the run's transaction rollback-only, so the whole run failed. `structureOf` now checks the method read first and names
  METHOD_INVALID on that product (SupplyPlanning.spec's last feature).
Specs run: Mantle SupplyPlanning (11), Replenishment (6), ProductionSubcontract (8); BOSS ManufacturingPlanning (5),
ManufacturingSubcontracting (5), PurchasingReplenishment (3), PurchasingAccess (11): all pass.

**Built Nov 4 (P14b, the routes).**
- Mantle, the buy conversion's routes (new `service/mantle/product/SupplyPlanningRoutes.js`, hooks in `SupplyPlanning.js`):
  - the policy switch: `PurchasePolicy.planBuyToRequest` (new `entity/ReplenishmentRouteEntities.xml`, audit-logged, empty N;
    PurchasePolicy.js's controls and `store#PurchasePolicy`'s parameter). `convert#PlanningSuggestions` takes `route` (order,
    request, dropShip; the policy's when empty; order under a request policy is ROUTE_NOT_ALLOWED) and `supplierPartyId`, and
    answers `requests`; `get#SupplyPlan` answers `buyRoute` and each row's `customerDemand`. The checks every route shares
    (stale plan, exception, closed, `check#ProductUsable`) are `buyChecks`, and a competing conversion of any route is
    DEMAND_ALREADY_COVERED naming the purchase order or request line.
  - the request route: one purchase request per organization and facility in the call (`create#PurchaseRequest`,
    `store#PurchaseRequestItem`, so their checks apply), a line per customer order line of the requirement with a
    RequestItemOrder to it (F125) and one for the rest, at the supplier's price as the most to pay where the buyer may
    read it, each a RequirementSupply RstPurchaseRequest on the plan's requirement; the requests are sent to approval
    (`submit#PurchaseRequest`, each in its own transaction, a failure named and the request left a draft). The approval then
    makes the request's own requirements and RequestSourcing sources them (P10). `cancel#PurchaseRequest` ends the request's
    RstPurchaseRequest coverage (`releaseRequestSupply`).
  - the drop-ship route: each customer order line of the requirement on an approved order through
    `route#OrderItemToDropShip` (P7), its drop-ship purchase order line covering the requirement (RstPurchaseOrder); a line of
    an order not yet approved is named in `pendingLines` (DROP_SHIP_PENDING when none moved), NO_CUSTOMER_LINE without one;
    what is left stays to convert (PssPartial).
  - the plan: the lines of the organization's approved purchase requests at the set's facilities, and of a submitted one a
    conversion made, less what is ordered (RequestItemOrder to a live purchase line), are supply ("Purchase request" lines),
    so approved request demand is not suggested again; a sales line reserved without stock is shown and pegged (kind
    `salesWaiting`, not netted: its shortage nets as the negative availability) so customer demand keeps its sales line
    (F149); held quantity of a bought product nets within its supplier price's standard lead time where the schedule
    nets held quantity (F150; P13 had it for made products only).
- Mantle, the receipt's reservation offer (R-PUR-37; new `service/mantle/order/PurchasePegServices.xml` over
  `PurchasePegs.js`): `get#ReceiptPegs` (PURCHASE_ORDER_EDIT or STOCK_RECEIVE, a purchase receipt of the user's organizations:
  each received line's sales lines through its RequirementSupply, the requirement's RequirementOrderItem and the request
  line's RequestItemOrder, with what is to ship, waits and is reserved on the received stock) and `reserve#ReceiptPeg`
  (STOCK_RECEIVE: what is not available of the line's reservations taken off up to the stock on hand, then
  `reserve#AssetForOrderItem` with the asset first, displacing other reservations of it; NOT_PEGGED, ASSET_UNAVAILABLE,
  STOCK_HELD, STOCK_UNAVAILABLE; alreadyReserved). Stock on hold at the dock for its putaway may be reserved (F151).
- BOSS: Shared/SupplyPlanning's Purchasing branch: Convert's Route ("Drop-ship customer orders" where a selected row has
  customer demand), the request route's wording where the policy says so, and messages for requests, drop-ship lines and the
  requests sent for approval. PurchasePolicy's controls form gains "Plan buys go to purchase requests". New
  `template/PurchasingReceiptPegs.xml`: section PurchasingReceiptPegs ("Bought for customer orders", included in
  PurchasingReceiptDetail's PurchasingReceiptFound) and transition `purchaseReservePeg` (check#Record receipt `receive`, then
  `reserve#ReceiptPeg`; transition-included in Shared/ShipmentDetail).
- Specs: Mantle `test/product/ReplenishmentRoutes.spec.js` (5 features, 1.5 s: the request route with its lines, links,
  submission, retry, DEMAND_ALREADY_COVERED and ROUTE_NOT_ALLOWED; request supply while submitted, approved and sourced, the
  request's drop-ship route through RequestSourcing (F125's missing spec) and a cancel ending the coverage; the plan's
  drop-ship route with NO_CUSTOMER_LINE and a pending order; the receipt's pegs, Reserve, PERMISSION_DENIED and NOT_PEGGED;
  held netting within the supplier's lead time). No BOSS regression spec (F154). Acceptance
  `test/acceptance/Purchasing/PurchasingReplenishmentRoutesWalk` (3: a customer-order shortage converted to a purchase order keeps
  its sales line and its receipt reserves for it from ShipmentDetail; the drop-ship route from SupplyPlanning; under the
  request policy the request's demand, submitted and approved, is not suggested again).
- Tests run: Mantle ReplenishmentRoutes (5), Replenishment (6), SupplyPlanning (11), ProductionSubcontract (8),
  PurchaseRequests (6), PurchasePolicy (5), DropShip (6), all pass; BOSS PurchasingReplenishment (3), PurchasingReceiving (3),
  ManufacturingPlanning (5), ManufacturingSubcontracting (5), PurchasingSuppliers (3), PurchasingAccess (21),
  PurchasingRequests (4), all pass; acceptance PurchasingReplenishmentRoutesWalk (3), pass. `moqui lint --screens`: no parse
  failure, no idiom or hazard site in the changed screens.
- Decisions:
  - The request route sends the request to its approval rather than making it approved: crosscut §4.2 routes plan buys
    "through request approval", and an approved request made by a conversion would skip its approvers and the request-stage
    budget reservation. The plan's demand is covered from the conversion (RstPurchaseRequest), so a submitted request is
    neither converted again nor suggested again; a refused one stays submitted but is no supply (review R1): shown in the
    provenance, not netted, so its demand is suggested again, and its coverage of the old requirement ends when cancelled.
  - The request's approval makes its own requirements (P10) and the plan's requirement stays covered by the request line,
    so RequestSourcing reads the request's remaining quantity as P10 built it; the request line's ordered quantity moves to
    its purchase order line in the next plan.
  - The drop-ship route is the buyer's choice per conversion, never the policy's; it moves only lines of approved orders,
    as RequestSourcing's (P10).
- Findings (provisional):
  - **F149** Mantle reserves a sales line when its order is placed, its shortage reserved without stock (negative
    availability), so the plan's sales lines left out every placed order: a customer-order shortage had no sales line in its
    provenance or RequirementOrderItem. Such a line is now shown and pegged (`salesWaiting`), not netted; the netting is
    unchanged.
  - **F150** Held quantity was netted "within the lead time" only for a made product (its BOM's lead days); a bought
    product had none, so only inspections already due were netted. Its supplier price's `standardLeadTimeDays` is now its
    lead time for that rule.
  - **F151** Warehouse's receive leaves stock AstOnHold at the dock until its putaway, and `receive#Asset` gives stock to
    waiting reservations only once it is available (`reserve#IncreasedAsset`, by priority then date), so a pegged line could
    lose its stock to another order. The receipt's Reserve reserves the on-hold stock for the pegged line; putaway's
    `move#Asset` carries the reservation (ReplenishmentRoutes covers it since the review).
  - **F152** Request lines as plan supply count any approved purchase request of the organization at a facility of the
    set, in the line's quantity: a request line in a unit other than the stock unit is not converted (the request route
    writes the stock unit; a hand-filed line in another unit would be miscounted). Fixed in the review (R2).
  - **F153** The drop-ship route buys from the suggestion's supplier (the plan's lowest minimum-quantity price), which
    may not drop-ship the product (NOT_DROP_SHIPPABLE, named); `convert#PlanningSuggestions` takes `supplierPartyId`, but
    Convert offers no supplier choice yet.
  - **F154** No BOSS regression spec: the rules are Mantle's (ReplenishmentRoutes); BOSS adds no access rule (Reserve is
    the receive capability on a receipt, PurchasingAccess's P5 case), and the screens are the walk's.
  - **F155** F125 is answered: the request route writes the RequestItemOrder from a request line to its
    customer order line, and ReplenishmentRoutes covers RequestSourcing's drop-ship route.

**Review Nov 4 (P14b).** Checked both diffs against this section, §2, crosscut §4.2 and the brief, with the shared planning
behaviour first. Manufacturing: netting is unchanged (`salesWaiting` lines are pegged, never netted; the shortage still nets
as the negative available), so ManufacturingPlanning, SupplyPlanning and ProductionSubcontract results hold; two intended
effects on made products: a make requirement now also keeps a placed (reserved) sales line as RequirementOrderItem, so a
make conversion with one such line sets the work order's demand order (Quality's release then reserves for it), and with
the schedule's held-quantity option a bought component nets held stock due within its supplier's lead time (before, only
inspections already due). ManufacturingPlanningWalk's "Sales order …" text still matches the new label. No double count:
request supply subtracts what its RequestItemOrder put on a live purchase line, that line counts once (a draft only with its
RequirementSupply, P14a), and the plan's own requirement coverage (RstPurchaseRequest) is not supply. Drop-ship: approved
orders only, the rest PssPartial; a supplier with no drop-ship price or facility is refused by name (P7's
NOT_DROP_SHIPPABLE, NO_DROP_SHIP_FACILITY), now in the spec. Reserve: putaway keeps the reservation (a whole move updates
the asset in place; a part moves reservations beyond its available), receiptOf limits the receipt to the user's
organizations and NOT_PEGGED to the purchase line's own pegs. `planBuyToRequest` is empty N, no row takes the order route
(Replenishment's default conversion). Fixes:
- R1 (high): a refused purchase request kept covering the plan's demand with no cue, a silent shortage until someone
  cancelled it. `requestSupply` shows a submitted request refused at its revision as "Refused purchase request …, not netted
  until it is changed or cancelled" (kind `requestNotNetted`) and does not net it, so the shortage is suggested again. If the
  requester changes and resubmits it while a second conversion covers the same demand, both count: the buyer cancels one.
- R2 (medium, F152): request lines in another unit are converted to the stock unit (MethodPolicy.convert); a line with
  no conversion is shown with the reason and not netted.
- R3 (medium): `convert#PlanningSuggestion` called directly with route `order` bypassed ROUTE_NOT_ALLOWED; convertOne checks
  the route against the policy too.
- R4 (medium): get#/reserve#ReceiptPeg offered another internal organization's sales line linked to the requirement; pegs are
  now only the receipt organization's own sales lines.
- Spec additions in ReplenishmentRoutes (6 features, about 2 s): the refusal, the unit, NOT_DROP_SHIPPABLE, and the pegged
  reservation on dock stock (AstOnHold at a receiving location) kept through putaway#Stock.
Left for the lead: Convert still offers no drop-ship supplier choice (F153); `outsideRequirements` limits RqTpProduct
requirements before filtering to outside processing, so P10's approved request requirements count toward that limit (P10's,
low). Specs run: Mantle ReplenishmentRoutes (6), Replenishment, SupplyPlanning, ProductionSubcontract, PurchaseRequests,
PurchasePolicy, DropShip, WarehouseReceiving (60, pass); BOSS PurchasingReplenishment, PurchasingReceiving,
ManufacturingPlanning, ManufacturingSubcontracting, PurchasingRequests, PurchasingAccess (41, pass).
- **Wave 8 suites (Nov 4, on master after P12 and P16 merged, run alone):** standalone mr-mantle 1,649 passed, 2 failed
  (the baseline), 11 skipped; `./moq test-apps` 2,922 server and 14 client features passed, none failed; feature time
  mr-mantle 324 of 300 s in the apps run (239 s standalone), mr-boss 232 of 220 s server and 41 of 36 s client, mr-pass
  16 of 15 s: warnings, for the end's measured budget; no spec over 15 s; `moqui lint --screens` clean.

### P15 — Performance

- **PUR-REPORTS.**
  - `mantle.party.supplier.SupplierScorecardPolicy`, effective-dated rows with their key fields audit-logged.
    `SupplierScorecard` and `SupplierScorecardMeasure`, an evaluation each, a fact of its own (§2): period, the policy
    row, evidence IDs with numerators and denominators, missing data and the risk response. A recalculation is a new
    evaluation, and the earlier one stays. `SupplierRisk`, effective-dated.
  - `mantle.party.SupplierServices`:
    - `store#ScorecardPolicy`, `store#ScorecardCriterion` and `store#ScorecardAction` (`PURCHASE_POLICY_EDIT`);
    - `evaluate#SupplierScorecard` (`SUPPLIER_SCORECARD_EDIT`), a result per supplier;
    - `store#SupplierRisk` (`SUPPLIER_PROFILE_EDIT`).
  - `ironstone.purchasing.ReportServices`:
    - `find#` and `get#SupplierScorecard`;
    - `get#PurchaseSpend`, `get#PurchaseCommitments` over BudgetCommitment, `get#ProcurementTracker`,
      `get#PurchaseHistory` and `get#SupplierStatement`. Each checks the organization and its fields, and answers its
      snapshot time and what it left out.
- **Screens** (design §11, §12): Scorecards, ScorecardDetail, Spend, Commitments, ProcurementTracker, PurchaseHistory,
  SupplierStatement (financial reader) and ScorecardPolicies. Product360's Purchase history tab; Supplier360's
  Performance tab; OfferComparison's on-time rate (R-PUR-39); ScoreActions' warning on an RFQ or PO.
- **Exports:** each report's rows with its filters, snapshot time and omitted-data warning, formula-like text guarded.
- **Home complete:** SpendSummary and every counter and BuyerWork source of design §3.
- **Usable when** (the date basis and sample as design §18 recommends, §4):
  - an evaluation of the demo suppliers scores on-time delivery from the first acknowledged line date, else the line's
    required date, and quality from dispositions; a supplier under five eligible receipts is Insufficient data and
    blocked from nothing;
  - a recalculation makes a new evaluation and keeps the earlier one;
  - Spend shows committed and billed as separate measures;
  - Commitments counts a reservation, its PO and its actual once;
  - ProcurementTracker follows P10's request through payment, and shows a buyer without finance read the payment rows
    as withheld.

**Built Nov 4 (P15).**
- Mantle (new files but three appended lines and one rule in the supplier check):
  - `entity/SupplierScorecardEntities.xml` (`mantle.party.supplier`): `SupplierScorecardPolicy` (organization and fromDate;
    period days, minimum sample, due-date basis `ScorecardDueDateBasis` SddbAcknowledged or SddbRequired; audit-logged),
    `SupplierScorecardCriterion` (per `ScorecardMetric` SsmOnTime, SsmQuality, SsmPriceVariance, SsmResponse: weight,
    target and floor, dated, audit-logged), `SupplierScorecardAction` (a score band and/or a risk severity drawing a
    `ScorecardEffect` SseWarn, SseReview or SseBlock; dated, audit-logged), the evaluation `SupplierScorecard` (period,
    policy row, due-date basis, minimum sample, eligible receipts, `ScorecardResult` SsrScored or SsrInsufficient, score,
    missing data, the action and effect it drew, `previousScorecardId` of a recalculation, operation key),
    `SupplierScorecardMeasure` (numerator, denominator, eligible and excluded evidence, value, score, weight, target, floor,
    criterion row) and `SupplierScorecardEvidence` (each receipt, billed line or invitation with its due date and basis,
    latest promise, event, quantity, counted share, exception or why it was left out), and `SupplierRisk` (severity
    `SupplierRiskSeverity`, category `SupplierRiskCategory`, owner, from/thru, evidence, response, evaluation; audit-logged).
  - `service/mantle/party/SupplierScorecardServices.xml`, included in `mantle.party.SupplierServices` by name (seven
    service-include lines appended), over `SupplierScorecards.js`: `get#ScorecardPolicy`, `store#ScorecardPolicy`,
    `store#ScorecardCriterion`, `store#ScorecardAction` (PURCHASE_POLICY_EDIT; POLICY_INVALID, POLICY_CHANGED,
    CRITERION_INVALID, ACTION_INVALID, ACTION_UNAVAILABLE), `evaluate#SupplierScorecard` (SUPPLIER_SCORECARD_EDIT; the named
    suppliers or every supplier with a receipt in the period, each through `evaluate#OneSupplierScorecard` in its own
    transaction with a result row; operation key replay; PERIOD_INVALID, SUPPLIER_UNAVAILABLE named per supplier) and
    `store#SupplierRisk` (SUPPLIER_PROFILE_EDIT; RISK_INVALID, RISK_UNAVAILABLE). Each checks the organization by
    FacilityScope as the buying policy does. `responseOf()` (for the supplier check) and `onTimeOf()` (for the comparison)
    check no permission.
  - The measures (§4): on-time delivery per receipt of a placed order line against the line's first acknowledged date (the
    first value of the audit-logged `OrderItem.promisedDate`), else its required date, by received quantity, day against
    day in the user's zone; quality per receipt as received less the dock rejection and the defective dispositions of its
    inspections (scrap, rework, return to supplier; a rejected result not yet disposed counts as rejected), an undecided
    inspection leaving the receipt out; price variance per billed line as the absolute billed-to-ordered difference over the
    ordered amount, in the order's currency; RFQ response per invitation first sent (its first sent email) in the period,
    answered (OrderProposed) by the RFQ's response date. Each measure scores 100 at its target and 0 at its floor, straight
    between; the score is the weighted mean of the measures with evidence (built-in weights 40, 30, 20, 10; targets 95%,
    99%, 0%, 100%; floors 70%, 90%, 10%, 50%). Fewer eligible receipts (on-time evidence) than the minimum sample is
    Insufficient data, which draws no response.
  - `PurchasePolicy.js supplierUsable` (check#SupplierUsable and every RFQ, quote, award, PO, agreement and request check
    built on it): where the organization has a response rule, the latest scored evaluation's effect and each active risk at
    or above a rule's severity warn (SUPPLIER_SCORE_WARNING, or the message added to an unapproved supplier's warning) or
    stop (SUPPLIER_SCORE_BLOCKED). With no rule it reads one query and changes nothing (the default, tested).
  - `Awards.js compare#SupplierQuotes`: each offer's `onTimeText` (the latest evaluation's on-time rate with its sample, or
    "Not evaluated"), in the CSV too (R-PUR-39; F161 answered).
  - Spec `test/party/SupplierScorecards.spec.js` (4 features, about 0.5 s).
- BOSS:
  - `ironstone.purchasing.ReportServices` (`ReportServices.xml`, `define#ReportAnswer`) over `Reports.js`:
    `find#SupplierScorecards`, `get#SupplierScorecard`, `get#SupplierPerformance` (Supplier360's tab), `get#PurchaseSpend`,
    `get#SpendSummary` (Home), `get#PurchaseCommitments`, `get#ProcurementTracker`, `get#PurchaseHistory` and
    `get#SupplierStatement`. Each needs the buying lists and checks the organization, supplier, product, request or order by
    Purchasing.js, answers `asOf`/`asOfText`, `filtersText`, `omittedText` and `complete`, and with `output` csv its
    `csvText` (title, filters, as-of and left-out lines, then the rows; text starting `=`, `+`, `-`, `@`, a tab or CR behind
    an apostrophe, number columns plain) and `fileName`. Withheld (never zero): ordered and received amounts without supplier
    price read (Orders.js's rule), bill amounts without it or payables read (Bills.js's rule), payments without finance read
    (ACCOUNTING_VIEW or PAYABLE_VIEW), commitment amounts without ACCOUNTING_VIEW or ACCOUNTING_ADMIN; the statement is a
    finance reader's only (PERMISSION_DENIED). Commitments counts each BudgetCommitment at its stage: a reservation's open part
    (amount less what its children converted), an order's open part and the actuals, so a reservation, its order and its
    actual count once. Reports.js also gives Home `compareCount` (open RFQs with a proposed quote not expired) and
    `buyerWork` (the approvals, requests to source, RFQs due and acknowledgements overdue of the modules' Today sources,
    due within a week), and the tracker's request choice.
  - Screens: `Performance.xml` (placeholder replaced: tab panel) with `Performance/Scorecards` (ScorecardFind,
    ScorecardList, Evaluate suppliers), `ScorecardDetail` (record header, Recalculate, Record risk, measures, evidence with
    its CSV, risks with End, other evaluations), `Spend`, `Commitments`, `ProcurementTracker`, `PurchaseHistory` and
    `SupplierStatement`; `Settings/ScorecardPolicies` (basis, measures, response rules, history);
    `template/PurchasingReportParts.xml` (ReportFrame: as of, filters, left out, Export CSV; PurchaseHistoryRows);
    `Shared/Supplier360/PurchasingPerformance.xml` (Performance tab) and `Shared/Product360/PurchaseHistory.xml` (Purchase
    history tab; Products' SharedContext.js lists it for Purchasing). QuoteComparison's offers show "On time". Home:
    SpendSummary (committed and billed of the last three months by month and currency, drilling to Spend), the quotes to
    compare counted and BuyerWork's sources; every counter of design §3 is counted. Settings links ScorecardPolicies.
    Purchasing.js: the report link paths, `buyerIds` exported, the `trackerRequests` choice.
  - Specs: `PurchasingPerformance` (3: Commitments counted once and withheld; Spend's measures apart and withheld, the
    tracker's payment withheld and shown; ScorecardDetail's qvt render and the scorecards' CSV guard); PurchasingAccess's P15
    feature (evaluate for the buyer only, an evaluation in its organization only, the statement for a finance reader only)
    and its Home feature (spend summary, every counter counted). Acceptance `test/acceptance/Purchasing/PurchasingPerformanceWalk`
    (6, the usable-when) and AppStructure's route fixtures for the new screens (PurchasingSpecLib.routeFixtures).
- Decisions:
  - The plan's two evaluation records are three: SupplierScorecardEvidence keeps the evidence rows (design ScoreEvidence),
    beside the measures.
  - The criteria are bounded: a measure's score is linear between its floor and target, with no formula of its own (design
    ScoreCriteria); an evaluation keeps the response its score drew when it was made, so a rule added later applies from the
    next evaluation or a recalculation, while a risk rule applies to the active risks at the time of the check.
  - Report reads are BOSS's (ironstone.purchasing.ReportServices, §2); each export is the report's own CSV transition
    (`exportCsv`) over the same service, not the form-list's CSV button, so it carries the filters, snapshot time and
    what was left out (F177).
- Findings (provisional):
  - **F177** The form-list CSV export (ScreenCsv.js `$csv`; XLSX writes string cells and is safe) quotes but does not guard formula-like text, so a
    list exported with show-csv-button can carry `=...` from a supplier's name or reference into a spreadsheet; the
    Purchasing reports guard their own export (Reports.js `csvCell`, as moqui-report's dashboard export does). For the lead:
    a framework guard in ScreenCsv.js would cover every list (Review P15).
  - **F178** A Block rule is the explicit approved rule the design asks for (no rule, no change); its override is ending
    the rule or the risk (PURCHASE_POLICY_EDIT, SUPPLIER_PROFILE_EDIT) or a newer evaluation: there is no per-document
    override. ScoreActions has one effect for RFQs and orders alike, and no reviewer role or expiry; Warn and review warns
    and marks the evaluation, and no follow-up work item is made (§7).
  - **F179** RFQ response counts an invitation from its first sent email (EmailMessage ES_SENT): a quote entered on the
    supplier's behalf with no email sent is not an invitation here. Price variance leaves out a bill in another currency
    than its order (no conversion) and compares in the order line's unit.
  - **F180** Evaluating every supplier (no supplier named) reads the period's receipts (at most 5,000 orders), so a
    supplier with only RFQ invitations in the period is evaluated only when named.
  - **F181** The supplier statement counts bills received for review and later (not Incoming), credits by invoice type
    (InvoiceCreditMemo, InvoiceReturn) and Delivered or Confirmed payments by effective date, not their applications: a
    payment not yet applied lowers the balance.
  - **F182** The walk follows P10's request through its bill; paying the bill (AP's approval and a payment run) is not
    driven, so the tracker's payment shows "Not paid" to a payables reader and the bill's actual is Accounting's conversion
    called directly, as approve#Payable makes it.
  - **F183** Spend's received measure is the receipts at the order's price, not landed cost (Accounting's allocation,
    linked for its users); paid is by applied date and not by product. A withheld measure still lists its groups, so a
    reader sees which suppliers had spend.
  - **F184** Home's counters are all counted now; a Purchasing reader sees no "Unavailable" card (PurchasingAccess's Home
    check changed with it).
- Tests run: Mantle SupplierScorecards with PurchasePolicy, Sourcing, SourcingAwards, PurchaseOrders, SupplierPortal and
  OrderProcureToPayBasicFlow (pass); BOSS PurchasingPerformance, PurchasingAccess, PurchasingSourcing, PurchasingSuppliers,
  ProductsSharedContext (pass; P15's regression features about 0.9 s); acceptance PurchasingPerformanceWalk (6, pass) and
  AppStructure. `moqui lint --screens`: no flagged site in the new or changed screens (informational anchors only).
  `ss-inventory.md`'s FinancialInfo OutgoingPaymentList and PaidPayablesList rows name the statement; no `usl-inventory.md`
  row is called (the report services are new).

**Review Nov 4 (P15).** Checked both diffs against this phase, §2, design §11, §12, §18: the supplier check with no rule
(one indexed read of the organization's rules, nothing else, tested), Warn against Block and the order of the checks (a
purchase block or suspension first, then a scorecard Block, then the unapproved warning); the measures by hand (on-time 40 of
60 by quantity against the first acknowledged else required date, quality 47 of 50 with the undecided inspection left out,
price variance 5 of 50, score (44.44 x 30) / 90 = 14.81, and fewer than five eligible receipts Insufficient with no
response); each evaluation in its own transaction (`lib.probe`) with a named failure; a recalculation of the same period
keeping and naming the earlier one; every report's organization, supplier, product, request and order checks; amounts
withheld as null and "Withheld", never zero; Commitments' stage arithmetic against Budgets.js `consumedAmounts` and
`openAmount` (a released or actual child consumes, a blocked or reversed one does not); `csvCell`'s guard; the caps.
- **R1** (medium, retry) `evaluate#SupplierScorecard` hashed the period it defaulted to now and the suppliers it found, so a
  retry with the same operation key and no period was refused OPERATION_KEY_CONFLICT. It hashes the request as asked
  (unset period and suppliers as unset) and checks the key before finding the period's suppliers. Spec case added.
- **R2** (medium, rule) The supplier check applied an evaluation's stored effect whenever any response rule was in effect, so
  ending the score rule that drew a Block did not lift it while a risk rule stayed. An evaluation's response now applies
  only while the rule that drew it is in effect (ending or changing a rule lifts it until the next evaluation, as F178
  says). Spec case added.
- **R3** (medium, cost) `compare#SupplierQuotes` ran the supplier check (now with the scorecard reads) for every offer line;
  it is once per supplier per comparison. The evaluation reads a line's first acknowledged date once per line, not per
  receipt, and finds the evaluation it recalculates by its period instead of reading every evaluation of the supplier.
- **R4** (medium, cost) Home ran the whole Spend report (receipts and payment applications too) and counted quotes to compare
  with an invitation read per RFQ (up to 500 RFQs, several reads each) on every load. SpendSummary reads committed and billed
  only; `compareCount` is three bounded reads (proposed quotes not expired, their RFQ links, the RFQs still open).
- **R5** (low, large data) Spend's payment applications and PurchaseHistory's quotes were capped without saying so; both now
  name the cap in what was left out (so `complete` is false). PurchaseHistory reads its lines' billings, billed prices and
  first receipts per 500 orders, and Commitments its request lines' suppliers per 500 requests, instead of per line.
- **R6** (low) Scorecards' result and score filters picked a supplier's latest matching evaluation, so an older low score
  stood in for a newer one; the filters now apply to the latest evaluation of each supplier (or to every one, view all).
- **R7** (low) ProcurementTracker's supplier filter left a request's rows of other suppliers in; it applies to them too.
- For the lead (F177, framework, unchanged): `runtime/components/base/framework/template/screen/ScreenCsv.js` lines 29-35,
  the csv render mode's `$csv`, only quotes a value holding a comma, quote or LF (`/[,"\n]/`, not CR) and never prefixes
  text starting `=`, `+`, `-`, `@`, tab or CR, so a form-list CSV export carries a supplier's `=...` name as a formula. The
  XLSX export is not affected: `crates/moqui-core/src/screen/xlsx.rs` writes text with `write_string_with_format` (lines
  164, 175), a string cell Excel does not evaluate. F177's "and the XLSX writer" is only the CSV.
- Left as they are (bounded and flagged): Spend's receipts and payment applications are read across organizations before the
  order and bill filter, so in a database with many organizations the cap can be reached by others' rows (flagged
  incomplete); SupplierStatement reads bills and payments from the beginning, oldest first, to carry the opening balance, so
  a supplier with over 5,000 of them shows an incomplete period (flagged) where an aggregated opening balance would not; an
  evaluation's price variance reads every billing of the supplier's (up to 5,000) orders before the period filter.
- **Wave 9 suites (Nov 4, on master after P15 merged, run alone):** standalone mr-mantle 1,653 passed, 2 failed (the
  baseline), 11 skipped; `./moq test-apps` 2,930 server and 14 client features passed, none failed; feature time mr-mantle
  346 of 300 s in the apps run (283 s standalone), mr-boss 250 of 220 s server and 41 of 36 s client, mr-pass 14 of 15 s:
  warnings, for the end's measured budget; no spec over 15 s; `moqui lint --screens` clean.

### P16 — Supplier portal

These are Purchasing's pages in the PASS Supplier app Accounting P18 started in mr-pass (§2, §4), on CX-PORTALS.

- **PUR-PORTAL, the Mantle side**, so a PASS page can call it locally or remotely:
  - `mantle.order.SupplierPortalServices`, each calling `check#AccessCapability` first: `get#SupplierHome`,
    `get#QuoteInvitation`, `save#QuoteResponse`, `submit#QuoteResponse`, `get#PublishedPurchaseOrder` and
    `acknowledge#PurchaseOrder`. A quote response moves the supplier's quote order to OrderProposed, and its quantity
    tiers become price rows only when a buyer publishes them (P11); an acknowledgement writes P9's audit-logged fields.
    Both are claims for internal review, and a repeat answers its receipt.
  - What they call is Mantle's too: P9's `mantle.order.OrderServices.record#Acknowledgement` and P11's
    `mantle.order.SourcingServices.store#SupplierQuote`, since PASS reaches no BOSS service (impl-drawers-commons §4).
  - CX-PORTALS's `ExternalAccess.js`, which issues for a PO only under `PAYABLE_EDIT` (scopes BillUpload and
    OrderAcknowledgement, page `/BillUpload`) and refuses an order in OrderRequested or OrderProposed: a quote record
    kind with a QuoteResponse scope for a quote order in those statuses, the QuoteResponse page and
    `PURCHASE_ORDER_EDIT` as its issuer permission; and the PO's kind also issued under `PURCHASE_ORDER_EDIT`, so
    `send#PurchaseOrder`'s caller can issue its capability.
- **PUR-PORTAL, the PASS side.**
  - Each of those as an operation in `Schema.js` and `Routes.js`, served by Mantle's PassApi to a remote frontend.
  - The RFQ link: QuoteResponse taking its token, checked by `check#AccessToken`; and on Accounting's PO link (§4),
    OrderAcknowledgement beside BillUpload. PASS's throttling limits the posts.
  - Mantle's `send#QuoteRequest` and `send#PurchaseOrder` create the quote order's or revision's capability through
    `create#AccessCapability` and mail its link, the Supplier app's page on the buying organization's site; the PO's
    capability covers acknowledgement and bill upload. A new revision, a cancel and `close#QuoteRequest` revoke it.
  - A signed-in supplier contact is a PASS public account invited from Supplier360 through a PASS invitation bound to
    the Supplier app and the supplier; redeeming it makes the supplier relationship Mantle checks.
  - Quote and acknowledgement attachments go through PASS's media staging and scanning into OrderContent.
  - A drop-ship supplier reports delivery from the PO page, and the buyer confirms it (P7).
- **Screens** (design §13), in the Supplier app: SupplierHome (SupplierDocuments, SupplierContact), QuoteResponse
  (PublishedQuoteRequest, SupplierOffer, SubmitResponse) and OrderAcknowledgement (PublishedPurchaseOrder,
  AcknowledgeOrder), with a subcontract PO's service lines and custody, at 390 px and on the desktop. BillUpload stays
  Accounting's page. BOSS gains Supplier360's Invite to the Supplier app.
- **Shell:** the supplier-response notification topic.
- **Demo:** a supplier contact of ZiddlemanInc as an invited PASS account on the demo site's Supplier mount, and token
  fixtures for the specs.
- **Usable when** (design §13; crosscut §5):
  - an invited supplier opens the RFQ link, saves a draft, and submits; the buyer sees the quote proposed with the
    supplier's prices, and a repeated submit answers the first receipt;
  - a revoked, expired or forged token shows nothing about the supplier or the document;
  - the supplier sees no competitor, internal request, maximum price or private file;
  - acknowledging revision 2 with a later date goes to the buyer for review and changes no quantity; revision 1's link
    answers SupersededRevision; the same PO link opens BillUpload;
  - a signed-in supplier user sees only its own documents;
  - the same walk through a remote PASS frontend with only framework, webroot and PASS installed.

**Built Nov 4 (P16).**
- Mantle:
  - `entity/SupplierPortalEntities.xml`: `ExternalAccessCapability.recordRevision` (the revision a link was issued for) and
    `mantle.order.SupplierPortalResponse` (a quote response's private draft, and the receipt of each quote response,
    acknowledgement and drop-ship delivery report: order, kind, revision, state, operation, capability or contact, late,
    what was entered and the receipt); the content type `OctSupplierDeliveryReport`. `data/SupplierPortalSetupData.xml`:
    the `PurchaseSupplierResponse` topic. `entity/SupplierPortal.eecas.xml`: SupplierPortalRevoke.
  - `service/mantle/order/SupplierPortalServices.xml` (`mantle.order.SupplierPortalServices`) over the new
    `SupplierPortal.js`, each taking PASS's input map, finding the supplier mount's organization and checking the
    capability or the signed-in contact first (ExternalAccess.js `check`, check#AccessCapability's rule): `get#SupplierHome`
    (a link's one record, or a contact's suppliers' requested and proposed quotes, orders from approval on and bills sent;
    the buyer's public contact and the link's expiry), `get#QuoteInvitation` (the request's revision, response date,
    specification and currency, the quote's lines with the supplier's offer and draft, the receipt), `save#QuoteResponse`
    (the private draft of the current revision), `submit#QuoteResponse` (confirm and operation id; store#SupplierQuoteItem
    per line and store#SupplierQuote, channel web, the file staged and scanned into OrderContent; OrderProposed; a repeat
    or a second submit of the revision answers the first receipt; a changed request is a Conflict; late accepted and
    marked), `get#PublishedPurchaseOrder` (revision, buyer, lines with price, required and promised dates, terms, ship-to,
    a subcontract order's service lines with the components in custody, a drop-ship order's deliveries; for a link of an
    earlier revision only `superseded`, SupersededRevision), `acknowledge#PurchaseOrder` (record#Acknowledgement of the
    current revision: accept, accept with changes, reject, reference, note, each line's promised date and quantity, a
    scanned file; SupersededRevision a Conflict; a repeat answers the first receipt) and `report#DropShipDelivery` (a
    drop-ship supplier's shipped quantities, tracking and date as OrderContent for the buyer to confirm with
    finalize#DropShipPurchaseOrder); every post counts against PASS's throttle (`record#Attempt`, 60 in ten minutes per
    requester, Tarpit) and is told to the organization's buyers on `PurchaseSupplierResponse`. `revoke#QuoteCapabilities`
    (for P12's close#QuoteRequest: an RFQ's quotes, or given quote orders; internal) and `revoke#OrderCapabilities` (the
    EECA: a cancelled or rejected order's links, and a quote's once it leaves the quote statuses).
  - CX-PORTALS (`party/ExternalAccess.js`, F32): a `Quote` record kind (scope QuoteResponse, a purchase order in
    OrderRequested or OrderProposed, page `/QuoteResponse`, PURCHASE_ORDER_EDIT); the `Order` kind issued, revoked and
    listed under PAYABLE_EDIT or PURCHASE_ORDER_EDIT, its link opening `/OrderAcknowledgement` when it has that scope;
    `invite#Contact` for the supplier app under either; capabilities keep `recordRevision`; `check` answers it and the
    expiry; `revokeActive` takes every issuer kind (null).
  - The links: `send#QuoteRequest` mails each quote's own QuoteResponse link (Sourcing.js, one line per supplier) and
    `send#PurchaseOrder` the revision's OrderAcknowledgement link with BillUpload (PurchaseOrderDocuments.js), when the
    organization has a published Supplier site (`SupplierPortal.js quoteLink`, `orderLink`; a failure is logged and the
    mail goes without it); `PurchaseOrderEmail` and `QuoteRequestEmail` show `linkUrl`.
  - The supplier's claim (F165): `PurchaseOrders.js asSupplier` and `portalClaim`; `requirePermission` and
    `purchaseOrder` (and Sourcing.js `requirePermission`) take the claim for its one order only. `Portal.js` exports `stage`
    (a noun for its refusals); `PurchaseReceipts.js` exports `buyersOf`.
  - PASS's operations in Mantle's copies: `forum/ForumSchema.js`, `script/PassRoutes.js`, and `TOKEN_WRITES` in
    `PassAuthority.js` and `PassApi.js` (saveQuoteResponse, submitQuoteResponse, acknowledgePurchaseOrder,
    reportDropShipDelivery).
  - Spec `test/order/SupplierPortal.spec.js` (6 features, about 0.8 s).
- mr-pass:
  - The seven operations in `service/pass/Schema.js` and `Routes.js` (`supplier/home`, `supplier/quote`,
    `supplier/quote/draft`, `supplier/quote/response`, `supplier/purchase-order`, `.../acknowledgement`, `.../delivery`),
    the four writes in `Transport.js` `TOKEN_WRITES`; an operation with an optional file goes as an ordinary call without
    one (F169).
  - Screens (server HTML, phone and desktop): `Supplier/SupplierHome` (SupplierDocuments, SupplierContact; the app's
    default page), `Supplier/QuoteResponse` (PublishedQuoteRequest; SupplierOffer with Save draft and Send quote, one block
    per line; SubmitResponse, the receipt) and `Supplier/OrderAcknowledgement` (PublishedPurchaseOrder with the bill link;
    the subcontract work; AcknowledgeOrder, one block per line; Report a delivery to the customer for a drop-ship order;
    SupersededRevision); the header's Supplier documents link for a signed-in user.
  - Specs: `test/Supplier/SupplierPages` (2: the three pages' one html render each, the superseded link and a bad one;
    the operations registered alike on both sides) over `test/Supplier/SupplierFixtures.js`; acceptance
    `test/acceptance/SupplierPortalFixtures` (the walk's and the remote check's documents and a signed-in supplier contact),
    `test/acceptance/client/SupplierPortalHttp` (3: the usable-when items in the browser at 390 px and on the desktop) and a
    RemoteHttp feature (the quote with a file and the acknowledgement through the remote frontend, the superseded link).
- BOSS:
  - Supplier360's Invite to the Supplier app (`template/PurchasingSupplierPortal.xml`, one transition-include and one
    section-include in `Shared/Supplier360.xml`): check#Record with `buy`, then invite#Contact for the supplier app; the
    invitation's link shown once for the buyer to send.
  - The shell's `PurchaseSupplierResponse` topic (`Purchasing.xml`), its link to QuoteDetail or OrderDetail
    (BossSetupData.xml).
  - Demo: `ironstone.purchasing.DemoServices.load#SupplierPortalDemo` (`SupplierPortalDemo.js`,
    `data/BossZPurchasingPortalDemoData.xml`, after Accounting's portal demo): on ZIZI_PORTAL (portal.zizi.localhost), an
    RFQ of Retail's (BOSS_PUR_PORTAL_RFQ) with Ziddleman's quote requested (BOSS_PUR_PORTAL_QUOTE) and its link
    (`/supplier/QuoteResponse?token=ZiziPortalDemoQuoteResponseLink00000000000001`), and the portal demo order's
    acknowledgement link of its revision (`/supplier/OrderAcknowledgement?token=ZiziPortalDemoOrderAcknowledgeLink000000000001`);
    Accounting's invited Ziddleman contact (ziddleman.billing, password moqui) sees both on SupplierHome.
  - Specs: PurchasingAccess gains the topic and a feature (the invite is the buyer's, on a supplier in scope; 23
    features); AccountingPayables' portal demo lists the two new links.
  - Inventories: usl-inventory's P16 section (the Supplier portal services) and ExternalAccessServices' Implemented in;
    ss-inventory has no mr-marble form for these pages.
- Tests run: Mantle SupplierPortal (6), AccountingPortals, Sourcing, PurchaseOrders, PurchaseRevisions, DropShip,
  OrderProcureToPayBasicFlow, PurchaseReceipts (79 features, pass); PASS SupplierPages (2), Portals, PortalFixtures,
  ClientFixtures, Transport (9, pass); BOSS PurchasingAccess (23), PurchasingSuppliers, PurchasingSourcing,
  PurchasingRevisions, AccountingPayables, AccountingAccess (pass). Acceptance: SupplierPortalHttp (3) and RemoteHttp (7)
  against the served suite server, pass; the remote pair (REST: the authority serving ClientFixtures, PortalFixtures and
  SupplierPortalFixtures, a frontend runtime of framework, webroot, tools and PASS serving RemoteFixtures): RemoteHttp 7 of
  7 and SupplierPortalHttp 3 of 3 through the frontend, pass. `moqui lint --screens`: no parse failure or flagged site in
  the new and changed BOSS and PASS screens.
- Decisions:
  - A purchase order's link names its revision. A new revision supersedes the link's acknowledgement (SupersededRevision,
    and nothing of the new revision), while its BillUpload still takes a bill, as bills belong to the order; the send of
    the new revision mails a new link. A cancel or decline, and a quote leaving the quote statuses (an award, P12's Not
    awarded), revoke the links (the EECA), besides ExternalAccess already refusing those records (F164).
  - A supplier's answer runs Mantle's own verbs on its claim of the one order (F165); nothing in PASS or BOSS writes the
    order. Quote tiers stay prices only when a buyer publishes them (P11).
  - A draft is the supplier's own SupplierPortalResponse row, never a write to the quote, so the buyer sees nothing before
    the submit; a submit of the request's revision is final for that revision, and a later revision of the RFQ may be
    answered again.
  - A late quote is accepted and marked late for the buyer (no policy flag yet, F171).
  - SupersededRevision on the page is a result, not an error, so a remote frontend shows it (F170).
- Findings (provisional):
  - **F164** ExternalAccessCapability had no revision (design §13 names one); added as `recordRevision`. The plan's "a new
    revision revokes it" is built as the acknowledgement superseded on the older link, its bill upload kept.
  - **F165** store#SupplierQuote, store#SupplierQuoteItem and record#Acknowledgement check PURCHASE_ORDER_EDIT and the
    user's organizations, which a public supplier has neither of. A supplier's claim (`ec.context.sharedMap`, set only by
    SupplierPortal.js after the capability check) stands in for both on that one order, and every other order stays
    unavailable; the check is in PurchaseOrders.js and one line of Sourcing.js `requirePermission` (P12's file).
  - **F166** Mantle's store verbs set a field that is passed, even as null; the portal passes only what the supplier gave.
  - **F167** OrderContent counts a revision on an order without `commercialRevisionOnly` (Order.eecas.xml), so a
    supplier's file or delivery report would supersede its own link; they are written uncounted (PurchaseRevisions.js
    `uncounted`).
  - **F168** Without a draft record, Save draft would write the quote's lines, which the buyer reads; drafts and receipts
    are `SupplierPortalResponse`.
  - **F169** PASS's REST and gRPC transports sent every operation with a `file` field as multipart and required the
    file; the quote's and acknowledgement's file is optional, so without one it is an ordinary call. Lines cross a
    multipart form as JSON text.
  - **F170** A remote frontend shows only the envelope's generic message for an Unprocessable or Conflict (PassAuthority
    MESSAGES), so a supplier's validation message ("Give the reason") reads "The authority could not complete this
    request" remotely, as BillUpload's do. For the lead: pass the refusal's own text for those kinds.
  - **F171** Design QuoteResponse accepts a late response "only if policy permits", and PurchasePolicy has no such flag;
    late responses are accepted and marked (§7).
  - **F172** invite#Contact makes the PASS invitation but mails nothing (as Accounting P18); Supplier360 shows its link
    once for the buyer to send.
  - **F173** QuoteResponse offers no file downloads (the published RFQ PDF, permitted files): PASS has no supplier file
    operation yet, and the RFQ email carries the PDF (§7).
  - **F174** A drop-ship delivery report is the order's content and the buyer's notice; OrderDetail's Confirm delivery
    does not prefill from it yet, and a subcontract order shows the components held at the custody facility but not the
    dispatch and inspection evidence (§7).
  - **F175** Accounting's portal demo already invites a Ziddleman contact (ziddleman.billing) on ZIZI_PORTAL's Supplier
    mount; P16 adds the quote and acknowledgement links to it. The Supplier app's default page is now SupplierHome (was
    BillUpload).
- For P12: `mantle.order.SupplierPortalServices.revoke#QuoteCapabilities` (`requestId`, or `orderId`/`orderIds`) ends an RFQ's
  quote links from close#QuoteRequest; the SupplierPortalRevoke EECA also revokes a quote's links whenever it leaves
  OrderRequested or OrderProposed, so an award or a Not awarded cancel needs no call.

**Review Nov 4 (P16).** A security review first, then the phase brief. Checked: every SupplierPortalServices operation finds
the supplier mount's organization (a published site) and calls ExternalAccess `check` (token: digest, revoked, expired,
record type, scope, organization, the record still the supplier's; contact: an in-effect grant for the app, organization and
party) before it reads anything; scopes do not cross (a BillUpload-only link cannot read or acknowledge the order, an order
link cannot open a quote, a quote link no order); every refusal is the same NotFound text; issue needs PURCHASE_ORDER_EDIT
(or PAYABLE_EDIT for Order) in the record's organization. get#QuoteInvitation and get#PublishedPurchaseOrder read field by
field: no other supplier, RFQ item or source request, maximum price, cost, internal note or private file (a PO's own price,
terms and a drop-ship ship-to are the supplier's). The claim (F165) is set only by SupplierPortal.js after the check,
lives in `ec.context.sharedMap` (never filled from request parameters), is removed in a finally, and `purchaseOrder` refuses
any other order or a part of another buyer or supplier; the services are allow-remote false. submit#QuoteResponse writes
only price, promised date and item code of its own lines and the quote's reference, validity, delivery and channel; quantity
is never taken. acknowledge#PurchaseOrder writes only record#Acknowledgement's fields; report#DropShipDelivery only content.
Repeats answer the first receipt; posts are throttled per requester; files go through Portal.js `stage` (size, type sniffed,
scanned). PASS pages call only `portal.attempt` (pass.Facade); TOKEN_WRITES match in PassApi, PassAuthority and Transport.
Fixes:
- R1 (medium) A signed-in supplier contact saw, and could answer, a requested quote of an RFQ not yet sent (the buyer's
  draft invitation) on SupplierHome and QuoteResponse. A requested quote is now the contact's only once published to it
  (its RFQ mailed, or a link made for it); spec case added.
- R2 (low, hardening) The claim stood in for any permission list naming PURCHASE_ORDER_EDIT (an approval's
  `PURCHASE_ORDER_EDIT, PURCHASE_APPROVE`, Sourcing's read list); it now stands in for PURCHASE_ORDER_EDIT alone
  (`PurchaseOrders.js claimed`). Under a claim store#SupplierQuote needs the quote's orderId (no new quote) and
  store#SupplierQuoteItem only prices, dates and codes an existing line (no new line, quantity, unit or text).
- R3 (low) get#SupplierHome with an earlier revision's link showed the new revision's number and delivery date; it now says
  Revised and shows nothing of the new revision; spec case added.
- R4 (low, hardening) The pages' and the writes' lines are the capability's order part's (a purchase order has one part
  today); revoke#OrderCapabilities reads the order's own status instead of trusting its parameters.
Decision on F164: kept. An earlier revision's link still opens BillUpload: a bill is for the order, not a revision, AP
matches it against the order's current lines and receipts (P6), and BillUpload shows nothing of the order beyond what
Accounting P18 already shows; the acknowledgement on that link stays SupersededRevision.
For the lead: F170 (a remote frontend shows the generic text for Unprocessable or Conflict) stands; QuoteResponse shows
the RFQ's current header and lines, so an edit the buyer has not re-sent is visible on the page (the revision check makes
the supplier answer the current one); showing the last sent revision instead is a design choice for P12/P16.
Specs run (pass): Mantle SupplierPortal (6), AccountingPortals (17), Sourcing (7), PurchaseOrders (8), PurchaseRevisions
(9), DropShip (6); PASS SupplierPages (2), Portals (3), Transport (2), client PortalHttp (3); BOSS PurchasingAccess (23),
AccountingPayables (8). `moqui lint --screens`: no parse failure, nothing flagged in the P16 BOSS and PASS screens.

### P17 — Finish

- The terminal twins, and the server-static sweep, an acceptance test.
- The design §14.4 acceptance review, acceptance tests. A Purchasing user with no other launcher is refused cost,
  finance, stock posting and other organizations' prices, through URLs, shared contexts, exports, the palette, search
  and the Supplier app. With the receive and finance groups, the same user works from the shared mounts without the
  Warehouse or Accounting root.
- The §15 outputs not built earlier.
- The inventories' **Implemented in** columns, the design's Impl column, and Remaining-Work.
- The open items earlier phases left for P17 (§6): F127, F118 and F176.

**Built Nov 4 (P17).**
- **Terminal twins and server-static.** Purchasing has no `.qvue` screen, so its twins are its XML screens in tui, each
  list's `render-mode` section included. `test/acceptance/TuiRender.spec.js` now renders every Purchasing screen and its shared
  mounts on their route fixture (PurchasingSpecLib) and checks each fixture's text in the twin; it fails a Purchasing route
  fixture that no screen renders, as for Warehouse and Manufacturing. No Purchasing screen lacked a usable twin (all pass,
  with the fixtures' texts). `test/acceptance/Purchasing/PurchasingServerStatic.spec.js` (one per app per mode, on
  ServerStaticLib): the full static report of the 53 Purchasing XML screens on their route fixtures, the marked ones clean
  and rendering their static qvt page without an error (impl-manufacturing F147's check). Marked `server-static="qvt"`, the
  screens the report found clean: the three quick creates (NewPurchaseOrder, NewPurchaseRequest, NewQuoteRequest) and
  Products/ProductFind. The others keep a list's condition outside its form-list (the form-list-key rule) or request data
  in a text, as most Warehouse and Manufacturing screens do; ReturnAuthorization (a print) and PlanSchedule (a tab) are
  clean but left unmarked.
- **Design §14.4 "unauthorized action and standalone use"**, `test/acceptance/Purchasing/PurchasingAccessWalk.spec.js` (7
  features, about 60 s with its start), with artifact authorization on. Each side, Retail and Ziziwork Services, gets its
  own records marked with a secret text and an odd amount: a placed order with its expected receipt, a purchase request, an
  RFQ with a requested quote, an agreement, a bill, a supplier return and an organization-scoped supplier price, and Retail a
  standard cost of DEMO_1_1. Then:
  - every Retail demo Purchasing user, Services' reader and the walk's standalone buyer open Purchasing and none of eight
    other roots (the demo's purchasing.buyreceive is in Warehouse's root group too, F186);
  - 39 routes per side (each record's URL, the lists, the shared mounts, Chatter and RecordFiles, the authorization print,
    the reports), html and for a reader also tui: the other side's users see none of a side's records, while its own reader
    or john.doe sees them on the required eight (OrderDetail, PurchaseOrders, RequestDetail, QuoteRequestDetail,
    QuoteDetail, AgreementDetail, InvoiceDetail, ReturnDetail);
  - the reports' CSV exports (spend by supplier and product, commitments, history) and the Mantle prints (purchase order,
    RFQ, agreement) hold only the user's side (john.doe's print of each side's order is the control);
  - the palette (by ids and text), record links, the supplier, organization and bill-order drop-downs and universal search
    keep each side to its records (each side's reader finds its own order and link);
  - no Purchasing user sees the standard cost on Product360 (its Summary and Costs) under Purchasing (john.doe sees it under
    Products), a buyer's bill shows no payments, the buyer's price of DEMO_1_1 from Services' supplier is none of Services',
    and approve#Payable, release#InvoiceHold, receive#ShipmentStock and post#AcctgTrans refuse every Retail Purchasing
    user without the group that grants them (nothing received);
  - the Supplier app (the demo order link's home and page, the demo quote link, a signed-in Ziddleman contact's home, a
    forged token) shows neither side's records nor the cost, and a record named beside a link is refused (NotFound);
  - a buyer with Warehouse's receive group and Accounting's match group and neither root (the walk's
    `purchasing.p17standalone`) receives 8 from Purchasing's Receiving/ShipmentDetail and applies the match from
    Bills/InvoiceMatch, while the plain buyer is refused both (PERMISSION_DENIED) and asks for the price hold's release
    instead (the handoff); neither releases the hold.
  The purchasing administrator is left out of the isolation sweeps: its MANTLE_ACTIVE_ORG grant reaches every organization
  with none active, by design (§4; F185). No access hole was found.
- **§8's scenarios**: the table names the covering specs (§8), each scenario already covered by a phase walk or Mantle spec
  but the standalone use, which is the walk above.
- **§15 outputs.** Built earlier: the RFQ print as of a time, its stored PDF and email with the QuoteResponse link (P11,
  P16); the comparison print and CSV (P12); the purchase order print as of a time, its stored PDF, email and acknowledgement
  link (P3, P9, P16); the drop-ship order's print with the customer's ship-to (P7); the regret notice (P12); the agreement
  print as of a time and its stored PDF (P13); the supplier return authorization (P8); the supplier statement and the
  reports' CSVs (P15); the submission receipts (P16). Built here: a Print link on every report (PurchasingReportParts'
  ReportFrame: the screen as html-print with the same filters, its snapshot and what it left out), checked in
  PurchasingPerformanceWalk. Not built (§7, F190): a receiving checklist, a purchase inspection report and a bill or
  match explanation print under Purchasing, and the supplier price and reorder import from Purchasing's screens.
- **F127** (Mantle): `mantle.request.RequestServices.complete#PurchaseRequest` (PurchaseRequestServices.xml,
  PurchaseRequests.js `complete`): an approved request with something sourced completes, with no reason once every line is
  received in full (design RequestDetail: fulfilled, or explicitly closed with a reason), else with a reason kept on the
  status change; a line sourced short gives up the rest (requirement cut to what is covered, or Rejected), the request's
  reserved commitments (the unsourced remainder at BcsRequest) are released and its plan supply ends, as a cancel does;
  refuses REQUEST_NOT_APPROVED, REQUEST_CLOSED, NOTHING_SOURCED (cancel it instead) and REASON_REQUIRED naming the lines.
  `get#PurchaseRequestProgress` answers `canComplete`. BOSS: RequestDetail's Purchasing branch has Complete request in its
  More menu (`completePurchaseRequest`, template/PurchasingRequestDetail.xml, one transition-include in
  Shared/RequestDetail.xml). Regression: mr-mantle PurchaseRequests (a partly sourced request: NOTHING_SOURCED before
  sourcing, REASON_REQUIRED naming line 01, the requirement cut to 3 and Ordered, the request commitment released, the order
  kept, REQUEST_CLOSED again); acceptance: PurchasingRequestsWalk's last feature (from RequestDetail, with a reason).
- **F118** (Mantle, PurchaseRevisions.js): a revision changing the currency together with a line's price or quantity is
  refused (CURRENCY_CHANGE_WITH_AMOUNTS: the currency changes in a revision of its own); `record#Acknowledgement` and
  `send#PurchaseReminder` refuse an order whose applied revision waits for its approval (REVISION_PENDING: it has not gone
  to the supplier). Regression: mr-mantle PurchaseRevisions (the preview's refusal; the acknowledgement and the reminder
  of the held revision). Not fixed: a reminder whose OrderEmailMessage write fails after the mail went can mail again on a
  retry (§7).
- **F176** (Mantle, SupplierPortal.js `quoteView`, Sourcing.js exports `rfqAt`): a quote sent its RFQ before the RFQ's last
  change shows the RFQ as last sent to that supplier (specification, due date, lines and revision as of the send, from the
  audit log as the as-of print reads them); the supplier answers that revision until the buyer sends again. Regression:
  mr-mantle SupplierPortal (a buyer's edit after the send is not on the page). Design §13 QuoteResponse says so. Not
  changed (§7): a price published from a quote line stays in effect when the award drops the line (it is the supplier's
  offer for its validity; ending it is a design choice), and the comparison-to-award SOURCE_CHANGED check rarely fires
  with default revision counting.
- **Inventories and design.** ss-inventory: every form with a Purchasing Designed in path names the Purchasing screen that
  carries it, or `—` with what Purchasing does instead (57 cells filled); usl-inventory: the same for services (28 cells,
  and complete#PurchaseRequest's row); design-purchasing §2's Impl names the building phase (and the built path where it
  differs) or §7.
- Specs run (this runtime; no full suite): acceptance PurchasingAccessWalk (7), PurchasingServerStatic (1), TuiRender (3),
  PurchasingRequestsWalk (8), PurchasingPerformanceWalk (7), all pass; regression mr-mantle PurchaseRequests (7),
  PurchaseRevisions (9), SupplierPortal (7), with Sourcing, SourcingAwards, PurchaseOrders, OrderProcureToPayBasicFlow,
  ReplenishmentRoutes and AccountingPortals (68 features), pass; BOSS PurchasingRequests, PurchasingRevisions,
  PurchasingAccess and PurchasingSourcing (36), pass. `moqui lint --screens`: no parse failure, no Purchasing site
  flagged, no Purchasing TUI worklist item.
- Findings (provisional):
  - **F185** The purchasing administrator (BOSS_PURCHASING_ADMIN, MANTLE_ACTIVE_ORG) reaches every organization's purchase
    records, palette rows, links and choices when no organization is active (Purchasing.js `rootGrants`, by design, §4);
    the isolation sweeps leave it out, as the other apps' walks leave out their administrators.
  - **F186** The demo's purchasing.buyreceive is in Warehouse's root group (BOSS_WAREHOUSE) as well as its receive group,
    so it opens Warehouse; the standalone case is the walk's own user, which holds BOSS_WAREHOUSE_RECEIVE and
    BOSS_ACCOUNTING_MATCH without either root.
  - **F187** Universal search answers nothing in a test runtime (no index), so its check is vacuous; the palette's
    `search#Records` with its own-side control is the one that counts (impl-manufacturing's review found the same).
  - **F188** F127 as the design reads it: a request completes by itself once received in full; sourced in full but not
    received is still In Progress, so its Complete needs a reason ("RFQ/PO issuance alone is In Progress").
  - **F189** F176's page change: the supplier answers the RFQ's sent revision, so after an edit not yet sent a submitted
    quote answers an older revision than the RFQ's; QuoteComparison does not mark a quote of an earlier RFQ revision (the
    receipt keeps the revision answered), so the buyer re-sends after a material edit, as P11's walk does (§7).
  - **F190** §15 outputs not built: a receiving checklist and a purchase inspection report under Purchasing
    (QualityInspection's Print certificate is Manufacturing's link), a bill print and a match explanation print under
    Purchasing (Accounting's BillDetail has them for AP), and the supplier price and reorder import from SupplierPrices
    and ReorderRules (Products' ProductImport takes reorder rows, P14, and has no Purchasing mount).
  - **F191** PurchasingAccessWalk takes about 60 s with its start (the route sweep 28 s); it is acceptance, so no budget
    applies, but it could split as Manufacturing's did if it grows.

**Review Nov 4 (P17).** Checked the Mantle and BOSS diffs against this section, §2, design RequestDetail, §13 QuoteResponse
and AGENTS.md. complete#PurchaseRequest: the requester or PURCHASE_ORDER_EDIT in the request's organization (as cancel);
it releases only the request's commitments still BcReserved, whose open amount is what its purchase orders have not
converted (a converted share stays with the order's commitment, a fully converted one is BcConverted and untouched), and
ends only the request's RstPurchaseRequest supply; a retry answers REQUEST_CLOSED, as cancel does. F118's refusals are in
Purchasing's own P9 services (no Mantle default changed). The four server-static marks pass PurchasingServerStatic.
Ten inventory and design Impl entries spot-checked against the screens and services (one wording fix). Fixes:
- R1 (medium, F176) SupplierPortal `quoteView`: a line the buyer added (or moved to another product) after the last send
  still showed on a requested quote's page with its unsent content, and the lines kept their current description; such a
  line is now left out and the others show as sent. The F176 spec now uses the still-requested quote B (a submitted
  quote does not follow the RFQ's lines, so the earlier check could not see a line change).
- R2 (low, F118) the Supplier app's order page offered Acknowledge while an applied revision waited for approval, and the
  refusal reached the supplier as an Unprocessable with the buyer's wording; canAcknowledge is now false then, and
  REVISION_PENDING is a Conflict in the supplier's terms (SupplierPortal spec, a held order).
- R3 (medium, test) PurchasingAccessWalk's finance and stock refusals were partly vacuous: release#InvoiceHold and
  post#AcctgTrans ran on records that did not exist, refused as "not available", which the walk counted as a refusal.
  The hold is now a real one on Retail's bill (left unreleased), post#AcctgTrans is left out (its authority is the posting
  guard's REVIEW_REQUIRED), and only a permission refusal counts. The universal search check (F187, no index) is removed.
- R4 (medium, P16 leak, at the lead's request) a signed-in contact's order page (`orderView`) showed the current lines of
  a revision the buyer applied that still waited for its approval, before it was sent. While such a revision waits, the
  page reads the order as of its last send to the supplier before the Change hold (else just before the hold), through
  PurchaseOrderDocuments' `orderAt` (now exported): its revision, terms, lines and total then, a line added since left
  out, Acknowledge not offered; the home list and a token link's superseded check use the same sent revision.
  SupplierPortal spec: a held order with a raised line and an added one shows revision 2, line 01 at 10 and no new line.
Left for the lead: the drop-down checks of the walk have no own-side control.

- **Final suites (Nov 4, on master after P17 merged, run alone):** standalone mr-mantle 1,655 passed, 2 failed (the
  baseline WorkTimeEntries and WorkTimesheets), 11 skipped; `./moq test-apps` 2,932 server and 14 client features
  passed, none failed; no spec over 15 s; `moqui lint --screens` clean.
- **Budgets (the user's agreement at the start: raise by Purchasing's measured share).** Purchasing's regression specs
  took, in the final apps run: mr-boss 20.3 s server (the Purchasing* specs) and 7.2 s client (PurchasingOrdersWalk);
  mr-mantle 32.5 s (its seventeen new specs); mr-pass 0.1 s (SupplierPages). The budgets are now mr-boss 245 server
  (from 220) and 44 client (from 36), and mr-mantle 335 (from 300); mr-pass stays 15. The whole components still run
  over them in the apps run (mr-mantle 363 s, 267 s standalone; mr-boss 261 s server, 42 s client; mr-pass 16 s): that
  rest is the other specs' growth over the build (more demo data and SECAs for them to meet) and run-to-run variance
  (the same mr-mantle specs took 267 s and 363 s in two runs an hour apart), not Purchasing's own specs, so it is left
  as a warning for the user's call rather than folded into the share.
- **Acceptance (Nov 4, on master after the budgets):** `./moq accept` mr-mantle 6 passed; mr-pass 25 and 5 (2
  ignored, as before) passed; mr-boss 166 client features passed, server 331 passed and 3 failed, all from earlier
  walks' data in the shared database, none a code bug: PurchasingAwardWalk's purchase block left Brightline's profile
  with no approval status (it now keeps it), and PurchasingAccessWalk left its marked Brightline prices in effect, which
  put later walks' orders in the two-step approval band and swelled PerformanceWalk's billed spend (it now ends them,
  and PerformanceWalk counts its own bill). After the fixes the mr-boss server acceptance suite passes, 343 of 343.

## 4. Decisions

These are made before and during the build. Each one that changes the design is also written into
design-purchasing.md, or into the owner's design.

| Date | Decision | Notes |
| --- | --- | --- |
| Oct 28, 2026 | Purchasing is built after Products, Accounting, Warehouse and Manufacturing, and before Customer Service. It adds its context and callers to what they built for it | impl-manufacturing §4, the user's call there; the other three plans assume it |
| Oct 28, 2026 | Phase order: the procure-to-pay spine first (suppliers and policy, orders, approvals, receiving, bills, drop-ship, returns), then revisions, the sourcing upstream of the PO (requests, RFQs, award), agreements, replenishment, performance and the supplier portal | The user's call. The other apps built their side of every PO handoff, so a PO built first gives each later phase its target and the procure-to-pay walk runs by P6. The alternative was the sourcing first |
| Oct 28, 2026 | The shared rules of impl-drawers-commons §4, parties by role and changes by effective date and the audit log, apply to Purchasing and the other core apps; Mantle's existing uses of both are kept | The user's call, the Moqui Java pattern. Applied here in §2, and in the other plans |
| Oct 28, 2026 | Revisions are audit-logged key fields with `orderRevision` and its time; prints take an effective date and time; key revisions store their PDFs on the record. PurchaseOrderRevision and PurchaseAcknowledgement are dropped (P9), and policies and profiles are effective-dated rows | The user's call (answer 6) |
| Oct 28, 2026 | A supplier's quote is a purchase OrderHeader in OrderRequested and OrderProposed, and an award places it. PurchaseRfqInvitation, SupplierQuote, SupplierQuoteItem, SupplierQuoteContent and PurchaseAward are dropped (P11, P12) | The user's call (answer 6: the order "should still be an OrderHeader in the early quote statuses"), confirmed as read here. Mantle's quote transitions fit (F19) |
| Oct 28, 2026 | The root group and filter set as Products: `BOSS_PURCHASING` as root user group and artifact group, with service checks. Its groups take `MANTLE_USER_ORG` and `MANTLE_PRIVATE_CONTACT`, and `BOSS_PURCHASING_ADMIN`, with all authz on the root, `MANTLE_ACTIVE_ORG` and `MANTLE_PRIVATE_CONTACT` (impl-drawers-commons §4) | The user's call (answer 1); the filters revised in the core-app question review, for every BOSS root |
| Oct 28, 2026 | A buyer may work with any Supplier-role party whose owner passes the active or available organization filter, or shared `_NA_`; no SupplierProfile is required | The user's call (answer 2) |
| Oct 28, 2026 | Approval thresholds as design §18 recommends: no monetary auto-approval outside configured policy, a buyer and manager split, budget Warn with finance choosing Stop, and P3's no-policy step | The user's call (answer 3) |
| Oct 28, 2026 | Buyers upload supplier bills as well as AP intake, through Accounting's `import#Bill` | The user's call (answer 4); written into impl-accounting P6 |
| Oct 28, 2026 | The legacy PO and receipt match backfill is offered in both apps: Accounting's service, mounted in Purchasing's MatchExceptions (P6) | The user's call (answer 5); written into impl-accounting P7 |
| Oct 28, 2026 | The request's organization is a RequestParty in the OrgInternal role, a requirement's a RequirementParty, and the cost centre is on each line | The user's call (answer 7) |
| Oct 28, 2026 | RequestDetail's Items tab shows in every app's context | The user's call (answer 8) |
| Oct 28, 2026 | Agreement activation is approved as a PO is, on the PurchaseOrderApproval topic with the agreement as source | The user's call (answer 9) |
| Oct 28, 2026 | Drop-ship POs are built, as P7 after bills | The user's call (answer 10): an actively used Moqui Java feature with partial support in Mantle (F14) |
| Oct 28, 2026 | Drop-ship is done as Moqui Java's `dropship-moqui` branch does it: a supplier-owned `FcTpDropShip` facility, the sales line reserved there, `create#DropShipPurchaseOrder` cloning the sales order into a PO whose `parentOrderId` is the sales order with the customer as `CustomerShipTo`, and `finalize#DropShipPurchaseOrder` shipping the PO's and the sales order's shipments. ShpTpDrop and the design's `confirm#DropShipDelivery` with its two InvoiceFromSource calls are not used | The user's call: "do it the same way" (F21). P7 ports the unmerged branch and adds BOSS's approval gate, named results and email send |
| Oct 28, 2026 | Quote quantity tiers both ways: purchase ProductPrice rows with minimum quantities, priced by the resolver; and optionally a promotion's auto-adjust adding an `isPromo` child item for the quantity difference | The user's call: price rows are the long-standing way, and some use the promotion (F22) |
| Oct 28, 2026 | Maximum stock and a reorder method on ProductFacility, and SuggestLevels on ReorderRules (P14) | The user's call (answer 11) |
| Oct 28, 2026 | Held quantity in planning follows Manufacturing: a pending-release line left out of netting, with an organization option | The user's call (answer 12); decided in impl-manufacturing §4 |
| Oct 28, 2026 | The performance date basis and sample as design §18 recommends: the first acknowledged date, else the line's required date; five eligible receipts | The user's call (answer 13) |
| Oct 28, 2026 | Accounting's PO link opens BillUpload, and P16 adds OrderAcknowledgement to it; with the move below the link is the PASS Supplier app's page for the PO, not a `/po/<token>` route | The user's call (answer 14); written into impl-accounting P18 |
| Oct 28, 2026 | Purchasing builds the parts of other needs it still depends on: the purchase requests on RequestDetail's Items tabs and CX-REQUEST's type check (P10); the drop-ship delivery as match evidence in Accounting's match (P7), whose service-acceptance rule Manufacturing P14 builds and P6 checks; Warehouse's `store#ProductFacilityPolicy` snooze, and Products' ProductImport reorder rows (P14). These keep the owner's names, packages and Shared screens | The plan's choice, as Products, Accounting, Warehouse and Manufacturing decided for theirs |
| Oct 28, 2026 | Purchasing builds no shared screen. It adds its context to the fifteen the other apps built, and its pages to the PASS Supplier app Accounting P18 starts | Follows from the above: each shared screen it mounts has another owner, built first |
| Oct 28, 2026 | Public-facing applications are in mr-pass and internal ones in mr-boss. The supplier pages are in the PASS Supplier app, not `screen/SupplierPortal.xml` in BOSS: public accounts with no UserGroup (no `BOSS_SUPPLIER_PORTAL`), Mantle's `SupplierPortalServices` through PASS's facade for a local or remote authority, PASS invitations, media and request contract (§2, P16) | The user's call, Oct 28, in the Customer Service plan review (impl-customer-service §4). It reverses crosscut D5's SupplierPortal root; Accounting P18 builds the app with BillUpload |
| Oct 28, 2026 | P3 approves with the design's no-policy rule, the decision record and the auto-approval SECA; P4 adds the policies, topics and the Approvals list | The plan's choice: no placed PO is approved without a decision from the first phase that places one |
| Oct 28, 2026 | A PO has one purchase part. Revisions, sends and acknowledgements key on the order header's revision | The plan's choice (F7); `create#PurchaseRequestOrder` already makes one order per supplier |
| Oct 28, 2026 | Internal entry first: quotes and acknowledgements are entered on the supplier's behalf from P9 and P11, and the supplier pages come in P16 | The plan's choice; design §18's "internal on-behalf-of entry remains complete" |
| Oct 28, 2026 | Mantle stands without BOSS, and business logic leans to Mantle (impl-drawers-commons §4). Purchasing's rules are Mantle services by package: approvals, the buying and approval policies, the topic handlers, the approval SECA and the supplier check in a new `mantle.order.PurchaseServices`; the PO send, revisions, acknowledgements and reminders, with Warehouse's remainder close and service acceptance, in `mantle.order.OrderServices`; RFQs, quotes, comparison and award in a new `mantle.order.SourcingServices`; returnable receipts and the replacement order in `mantle.order.ReturnServices`; request progress and sourcing in `mantle.request.RequestServices`; agreements in `mantle.party.AgreementServices`; the supplier profile, risk and scorecards in the existing `mantle.party.SupplierServices` (Accounting P6). Each checks its permission and the organization itself, and its topics are Mantle data (F23). `ironstone.purchasing` keeps `AccessServices`, Home, the worklists' and find screens' reads, the report reads and the settings forms, and its screens call the Mantle name with no pass-through. P1 grants `PURCHASE_ORDER_EDIT`, `SUPPLIER_PROFILE_EDIT`, `SUPPLIER_SCORECARD_EDIT`, `PAYABLE_IMPORT` and `RETURN_AUTHORIZE` to `BOSS_PURCHASING_BUYER`; `PURCHASE_APPROVE`, `PURCHASE_ORDER_APPROVE` and `PURCHASE_HOLD_RELEASE` to `BOSS_PURCHASING_APPROVE` (Nov 1, X4; in place of `ORDER_APPROVE`); `STOCK_POLICY_PLAN` and `SUPPLY_PLAN_RUN` to `BOSS_PURCHASING_PLANNER`; and all of them with `PURCHASE_POLICY_EDIT` to `BOSS_PURCHASING_ADMIN` | The user's call (plan review Q2). Applied in §2 and P1–P16, with one name for each contract the other plans build or use; the owner designs' names follow in the design sweep |
| Nov 4, 2026 | A purchase order's issued PDF and its Approved to Sent never count as a revision, whatever the policy's `commercialRevisionOnly`; other content, notes and status changes keep Mantle's counting where the flag is off | The user's call after the P3 review: the send's own writes moved the revision by two, so its email named a revision the order no longer had. `increment#OrderRevision`'s `issued` kind |

## 5. Open questions

| Question | Decides | Notes |
| --- | --- | --- |
| Further issues discovered during implementation | the affected phase | Record findings and decisions here; the open questions of the plan as written are decided in §4 |

The design's other §18 items, vendor consignment and the advanced integrations, are `later` there and in §7.

## 6. Findings

Design assumptions found wrong or unstated in the code, with the resolution. Where a resolution changes the design, it
is written there too.

| # | Finding | Resolution |
| --- | --- | --- |
| F1 | P0: `screen/Purchasing/` has nine placeholders: Home, Suppliers, Requests ("Purchase requests"), Quotes ("RFQs & supplier quotes"), Orders, Replenishment, Returns ("Supplier returns"), Performance ("Supplier performance") and Settings. There are no Agreements, Receiving, Bills, Products or Approvals; the root mounts only Chatter and RecordFiles and has no `<shell-providers>`. The `BOSS_PURCHASING` artifact group has only the admin authz (`BOSS_PURCHASING_ADMIN` for ADMIN, `BOSS_PURCHASING_APPADMIN` for the admin group); `BOSS_PURCHASING_PLANNER` and `BOSS_PURCHASING_ADMIN` are seeded, each with `STOCK_POLICY_PLAN`, and Manufacturing P14 seeds `BOSS_PURCHASING_BUYER` | P1 |
| F2 | P0: `MANTLE_ACTIVE_ORG` filters Party by `ownerPartyId` in the active organization and `_NA_`, and OrderPart, Shipment, ReturnHeader and Invoice by party. Nothing filters OrderHeader, OrderItem, Request, RequestItem, Requirement, Agreement, AgreementItem, ProductPrice or AssetReceipt | Purchase rows through services (§2); supplier scope by the owner filter (§4, P1) |
| F3 | P0: Request has no organization or cost centre (it has facility, currency and `filedByPartyId`). RequestItem has product, quantity, required date, maximum and selected amounts and supplier, but no `quantityUomId`. Requirement has no `organizationPartyId` or `quantityUomId`. RequestParty and RequirementParty are dated role associations, and requests use RequestParty for assignees | The organization by RequestParty and RequirementParty roles (§4); the unit and the line's cost centre as fields (P10) |
| F4 | P0: `create#PurchaseRequestOrder` requires the request's facility and returns an error at the first item without a supplier. It makes one order per supplier, writes a RequestItemOrder for each item's full quantity without reading the existing ones, answers only the last order's IDs, places and approves when `placeAndApproveOrders` is set, and sets ReqInProgress. CrmMiscServices calls it | Mantle's service stays as it is; BOSS never calls it, and P10's `convert#PurchaseSourcing` is the BOSS path (R-PUR-01) |
| F5 | P0: `complete#RequestFromWork` skips completed, cancelled and draft requests but reads no request type, so linked work completing would complete a purchase request | P10's type check (CX-REQUEST, R-XC-40) |
| F6 | P0: `Shared/RequestDetail` had no request items; Projects and Warehouse (P15, adding items while a draft) have since built its Items tabs, with none for purchase requests. The Commons and Projects request lists filter by type on request and leave none out | P10 extends those Items tabs to purchase requests; P11's RFQ type policy |
| F7 | P0: `OrderHeader.orderRevision` is on the header, and not audit-logged; `increment#OrderRevision` adds one under a for-update lock and checks nothing | One purchase part per PO (§4); P3 audit-logs it, and P9 guards the call |
| F8 | P0: the order status flow is as design §6 says: OrderBeingChanged only from Open or Proposed; Open, Placed, Processing and Approved go to Hold; Hold goes to Processing, Placed, Approved or Cancelled; Sent goes to Approved ("Approve (un-send)"), Processing, Completed or Cancelled, and not to Hold. OrderAutoReorder exists unused | The design holds (D7); P3 and P9 |
| F9 | P0: OrderProcureToPayBasicFlow places and approves a PO directly; OrderBulk's `change#OrderPartsStatus` and OrderLifecycle's `autoApprove#OrdersDelayed` approve orders too. Mantle REST posts orders, parts, items, part payments and returns with no BOSS guard | The approval gate is the BOSS adapter and the SECA, behind the approval gate's flag (§2); P1 grants no REST or bulk path; P0 checks the groups |
| F10 | P0: the Agreement status type has no items. AgreementType has AgrProduct, AgrSales, AgrEmployment, AgrOther, AgrCommission and AgrEula, but no AgrPurchase. AitPurchase exists. AgreementItem has quantity, unit, dates and text, but no amount | P13 |
| F11 | P0: the party classification types are Customer, EEOC, Minority, Income, Industry, Revenue, Number of Employees, SIC Code and NAICS Code; there is no supplier category | P2 seeds `PcltSupplierCategory` |
| F12 | P0: no `mantle.order.purchase` or `mantle.party.supplier` record exists. Accounting P6 adds SupplierProfile with its finance fields, and Warehouse P16 ServiceAcceptance | Under the shared rules only PurchasePolicy, PurchaseApprovalPolicy, PurchaseApprovalDecision, the release allocation and the scorecard records are new here (§2) |
| F13 | P0: `send#EmailDraft` sends an existing EmailMessage by ID, with record links and followers. `send#OrderStoreEmail` needs a ProductStore (design §14.1). Projects' `send#Invoice` sends a template with the rendered PDF (impl-accounting F2). OrderContent has a type, an item, a party and role, and a content date | P3's `send#PurchaseOrder` on that pattern, storing the PDF as OrderContent; P0 checks the attachment path |
| F14 | P0: Mantle's drop-ship pieces: ProductPrice `canDropShip` (with `standardLeadTimeDays`, `otherPartyItemId`, `quantityIncrement`, `preferredOrderEnumId` and the agreement keys); ShpTpDrop, with no parent shipment type; and `create#Order`'s Customer Bill-To from a drop-ship channel store's ProductStoreParty role. `OrderHeader.parentOrderId` is set by `clone#Order` for recurrence and listed as child orders. The `EmailOrder` contact purpose exists. Moqui Java's master has the same three pieces | P7, on F21 |
| F15 | P0: Commons' demo topic BossDemoApproval, "Purchase Approval (demo)", with `approve#DemoPurchase` and `refuse#DemoPurchase`, is Commons' demo, not a purchase source | Purchasing's Approvals filters by its own topics; the demo stays |
| F16 | P0: AppStructure's non-placeholder list is Commons, Comms, Insights, Projects and Products, each built app adding itself; its placeholder floor (94 today) counts Purchasing's nine | None: no route fixtures; the sweep is an acceptance test (§2 Done) |
| F17 | P0: OrderItem has `quantityUomId`, `unitListPrice`, `isModifiedPrice`, `productPriceId`, `standardCost`, `quantityCancelled`, `requiredByDate` and `overrideGlAccountId`, but no promised date, and no `costCenterId` until Accounting P6. OrderPart has `otherPartyOrderId`, `otherPartyOrderDate`, `estimatedShipDate`, `estimatedDeliveryDate`, `validFromDate`, `validThruDate`, `settlementTermId` and `tradeTermEnumId` | The acknowledgement on OrderPart and a promised date per line (P9); the quote's validity and terms on OrderPart (P11) |
| F18 | P0: the audit log covers OrderHeader's status; OrderItem's product, quantity, required date, unit amount and standard cost; OrderPart's status, vendor, customer, facility, carrier, shipment method, address and priority; Agreement's status, other party and dates; AgreementItem's quantity; and only the status of Request, RequestItem and Requirement. `get#OrderDisplayInfo` and `get#OrderItemDisplayInfo` read the order's audit history. Not covered: `orderRevision`, OrderItem's unit and cancelled quantity, OrderPart's supplier reference, validity and terms, and RequestItem's quantity, product, date and supplier | Each phase adds `enable-audit-log` to the fields it locks (P3, P9, P10, P11, P13) |
| F19 | P0: Mantle's quote flow is OrderOpen → OrderRequested ("Request Quote") → OrderProposed ("Propose Quote") → OrderPlaced ("Place from Quote"), with OrderRequested → OrderRejected ("Reject Request") and OrderProposed → OrderCancelled ("Cancel Quote") or OrderBeingChanged. The statuses read "Quote Requested by Customer" and "Quote Proposed by Vendor"; on a PO the customer is the buying organization | Supplier quotes as purchase orders in these statuses (§4, P11, P12); P0 checks the services on them. Not awarded uses Cancel Quote: no Proposed → Rejected, since OrderRejected means rejected by the vendor (crosscut X3) |
| F20 | P0: Mantle has a dated RoleType association for most records: RequestParty, RequirementParty, ProductParty, FacilityParty, WorkEffortParty and others, and undated OrderPartParty, OrderItemParty, AgreementParty, AgreementItemParty, InvoiceParty, ShipmentParty and BudgetParty. The Buyer, Supplier and OrgInternal roles exist, Buyer in the order role group. RequestContent and AgreementContent exist | The party roles of §2 |
| F21 | P7: Moqui Java's drop-ship lives on the `dropship-moqui` branch of mantle-udm (Facility `dropShipRemoteId`, `FcTpDropShip`, the `CustomerShipFrom` and `VendorShipTo` roles) and mantle-usl (`send#DropShipPurchaseOrderPart`, `create#DropShipPurchaseOrder`, `finalize#DropShipPurchaseOrder`, the SECA after `reserve#AssetsForOrder`, a README setup), Aug 2024 to May 2025, never merged into master. It links by cloning the sales order: `parentOrderId`, a `CustomerShipTo` OrderPartParty and the ship-to contact mechs; lines match by product, and two lines of one product refuse to finalize. It places and approves the PO itself. Mantle's `reserve#AssetForOrderItem` with no stock creates a shell asset with negative availability, owned by the selling organization, so a drop-ship facility needs no supplier stock feed | P7 ports it into mr-mantle, with BOSS's approval gate behind its flag |
| F22 | P11: Mantle's promotions are ProductStorePromotion rows whose `apply#Promotion` services (`apply#BuyGetDiscount`, `apply#FlatDiscount` and others) add `isPromo` child OrderItems with `parentItemSeqId` and `promoQuantity`, removed and reapplied by `apply#OrderPromotions` on order changes. They are found through the order's ProductStore. The resolver picks purchase price rows by date and minimum quantity | Both tier ways in P11; P0 checks the promotion's purchase scope |
| F23 | P0: a topic's approve and refuse services are the framework's, not Commons': NotificationTopic's `approveServiceName`, `refuseServiceName` and `refuseReasonRequired`, called by `approve#` and `refuse#NotificationMessage` as the user with recordEntityName, recordId, the messageJson map and notificationMessageId, and a refuse's reason. Mantle already seeds NotificationTopic rows in MantleSetupData | P4's, P10's and P12's topics are seeded in mr-mantle's data with the Mantle handlers, so the gate works without BOSS. `decide#PurchaseApproval` puts the source revision, the policy row and the decision step in the message map, which answers P0's handler check |
| F24 | P0: Warehouse's purchase parts are built in mr-mantle. `mantle.order.OrderServices.close#PurchaseRemainders` (OrderServices.xml, PurchaseRemainders.js) needs PURCHASE_ORDER_EDIT, cancels with an explicit quantity, lowers RequirementOrderItem, completes the part, and releases budget through `mantle.other.BudgetServices.release#ClosedSourceCommitments` (no permission of its own, refuses SOURCE_OPEN). `mantle.order.ReturnServices.find#ReturnableReceipts` (ReturnStock.js) needs PURCHASE_ORDER_EDIT, QUALITY_DISPOSE or STOCK_ISSUE. `accept#ServiceItem` (ServiceAcceptance.js) writes `mantle.order.purchase.ServiceAcceptance`, needs PURCHASE_ORDER_EDIT or STOCK_RECEIVE, and takes an operation key | P5, P6, P8 call these names as built |
| F25 | P0: SupplierProfile (AccountingPayableEntities.xml) is effective-dated and audit-logged, with only `settlementTermId`, `selfBillingIndicator` and `changeReason`. `store#SupplierProfile` needs SUPPLIER_TERMS_EDIT for those; SUPPLIER_PROFILE_EDIT is defined in MantleSetupData. `import#Bill` needs PAYABLE_IMPORT, refuses BILL_DUPLICATE, and can attach to a self-billed draft by `shipmentId` | P2 adds the buying fields under SUPPLIER_PROFILE_EDIT; P6 mounts import#Bill as is |
| F26 | P0: the legacy match backfill is `mantle.account.InvoiceMatchServices.preview#LegacyMatches`, `apply#LegacyMatches` (a transaction per bill) and `apply#LegacyMatch`, all under INVOICE_MATCH; `get#MatchPolicies` answers whether the user may run it | P6 mounts preview and apply in MatchExceptions for holders only |
| F27 | P0: Manufacturing P13/P14 in SupplyPlanningServices.xml: `run#SupplyPlan` and `store#PlanSchedule` need SUPPLY_PLAN_RUN; a buy suggestion is PsmBuy with a supplier on a Requirement with an OrgInternal RequirementParty. `convert#PlanningSuggestions` converts PsmMake (PRODUCTION_PLAN) and PsmOutside (PURCHASE_ORDER_EDIT: a draft service PO per supplier, priced by get#ProductPrice, with OrderItemWorkEffort and RequirementSupply, never placed). Buy and transfer are refused METHOD_NOT_CONVERTED (SupplyPlanning.js). `get#SupplyPlan` admits PURCHASE_ORDER_EDIT | P14a builds the PsmBuy conversion in Mantle's convert; transfer stays Warehouse's (§7); P3/P4 place and approve the outside-processing drafts |
| F28 | P0: `BOSS_PURCHASING_BUYER` (BossSetupData) has authz only on BOSS_MFG_PLANNING and BOSS_MFG_SUBCONTRACTING, none on the BOSS_PURCHASING root; it holds SUPPLIER_PRICE_VIEW, PURCHASE_ORDER_EDIT, PAYABLE_IMPORT, SUPPLIER_PROFILE_EDIT and RETURN_AUTHORIZE, as does the admin; its demo member is BOSS_MFG_BUYER. `BOSS_PURCHASING_PLANNER` holds only STOCK_POLICY_PLAN. PURCHASE_ORDER_APPROVE, PURCHASE_APPROVE, PURCHASE_HOLD_RELEASE, PURCHASE_POLICY_EDIT and SUPPLIER_SCORECARD_EDIT are not defined in mr-mantle | P1 defines the five in Mantle data (ADMIN holding PURCHASE_ORDER_APPROVE), grants SUPPLY_PLAN_RUN to the planner, and adds the root authz |
| F29 | P0: the PASS Supplier app registers in four places (mr-pass docs/Deployment.md): mantle `public/PublicApps.js`, pass `Apps.js`, `screen/Pass.xml`, and its operations in `Schema.js`/`Routes.js` mirrored in mr-mantle `forum/ForumSchema.js` and `PassRoutes.js`; token writes are listed in `pass/Transport.js`. `screen/Supplier.xml` defaults to BillUpload, its only page, which calls through `screen/Shared/Portal.js` | P16 adds its pages and operations in those places |
| F30 | P0: service-line matching is built: `InvoiceMatch.js` reads ServiceAcceptance and matches a PtService line on accepted quantity when the policy's `serviceAcceptanceRequired` is on (empty reads Y) | P6 only checks it with a service PO; P0's "reads no ServiceAcceptance" was out of date |
| F31 | P0: /mantle REST is reachable only through MANTLE_API, ADMIN only; no BOSS data grants AT_REST_PATH or a mantle.order, mantle.request or AgreementServices mutator (but Accounting's settlement). `change#OrderPartsStatus` checks no permission but approves through `approve#Order`. BOSS's own direct place/approve callers are the Accounting demo (`ironstone/accounting/Demo.js`) | §2 holds with no new grant; P3's gate in approve#Order covers bulk approval; ADMIN is the one bypass, by design |
| F32 | P0: mr-marble's Order, Request, Agreement and Supplier screens write raw (bare `update#OrderStatus` transitions, entity-auto RequestItem, Agreement, AgreementItem, PartyRole CRUD, `create#PurchaseRequestOrder`); only ADMIN and MarbleErpAdmin reach them. `ExternalAccess.js` treats OrderRequested and OrderProposed as closed orders, and the Order capability needs PAYABLE_EDIT | No BOSS group gets marble; P9–P13 audit-log what those paths write; P16 opens the quote statuses for a QuoteResponse scope and accepts PURCHASE_ORDER_EDIT for a PO link (as P16 already planned) |
| F33 | P0: `approve#Order` checks only ORDER_APPROVE, by no direction; `autoApprove#Order` approves a Placed order only when authorized payments cover the total, `check#OrderPreApprove` warns nothing, and it was never approved; a PO with promised payments is never auto-approved. ReturnServices also uses ORDER_APPROVE | P3's direction check and warning, as §2 says |
| F34 | P0: no buying-policy or approval-gate flag exists, nor PurchasePolicy; PartyAcctgPreference has no purchase flag. impl-accounting §4 puts the gate on the buying policy's dated rows on ProductionPolicy's pattern (dated, empty inherits, off by default). The Accounting demo places and approves POs directly for BOSS_ACCT_ORG and ORG_ZIZI_RETAIL | P2's PurchasePolicy carries the gate flag (off by default) before P3 reads it; the demo sets it only after its direct calls; ORG_ZIZI_RETAIL stays off |
| F35 | P0: the quote statuses on a purchase part: no reservation (only Placed/Approved, and none for a non-internal vendor with no store), no store emails, auto-approval only on Placed, totals recomputed in every status, `handle#OrderMajorChange` only with a store; Requested and Proposed are editable; the EDI ack SECA fires on Cancelled and Rejected; Proposed → Placed fires the Placed SECAs | P11/P12 need no Mantle change for the statuses; Place from Quote meets P3's gate; P12 accepts or conditions the EDI ack on Cancel Quote |
| F36 | P0: audit-log coverage, refining F18: OrderHeader logs status and processing status, not `orderRevision`; OrderItem logs product, required date, quantity, unit amount, standard cost and price keys and `costCenterId`, not unit, cancelled quantity or description; OrderPart its status, parties, facility, carrier, method, address and priority, not the reference, estimated dates, validity or terms; Request, RequestItem and Requirement only status; Agreement status, other party and dates; AgreementItem quantity. `get#OrderDisplayInfo` reads the header status history and items' quantity and unit amount; no OrderPart field and no as-of reconstruction | P3 logs `orderRevision`, unit and cancelled quantity; P9 OrderPart's reference, dates and terms and adds the as-of reader; P10 RequestItem's; P11 validity and terms; P13 the agreement's; each widens the display services' lists |
| F37 | P0: the drop-ship branch is local, in /Users/jonesde/work/moquiwork/moqui/runtime/components/addon/mantle-usl and mantle-udm (`origin/dropship-moqui`, Aug–Oct 2024 there): `Facility.dropShipRemoteId`, FcTpDropShip, the CustomerShipFrom and VendorShipTo roles (CustomerShipTo exists in mr-mantle); the `send#DropShipPurchaseOrderPart` interface, `create#DropShipPurchaseOrder` (run in OrderApprovedReserveAssets after `reserve#AssetsForOrder`, Approved only) and `finalize#DropShipPurchaseOrder`; `pack#ShipmentItemSource` returns the package. Create clones the header with `parentOrderId`, makes the PO part (vendor the facility owner, customer the seller, a CustomerShipTo party), copies contact mechs, content, notes and work efforts, places, approves and calls the remote | P7 ports these |
| F38 | P0: the branch makes no PO shipment; finalize expects the integration's ShipmentItemSource per PO line, ships it, never receives it; the sales side filters ShipmentItemSource by the PO's item and part seq ids, which the clone resequences | P7 makes the PO's ShpTpPurchase shipment at finalize, maps PO lines to sales lines by a stored link, not by product or seq id, and fixes the part id |
| F39 | P0: where drop-ship cost lands: the shell asset (no stock) has no acquire cost, so the sales issuance posts nothing; a supplier-owned asset posts nothing for the seller; the supplier bill debits Unreceived Inventory, and since the PO is never received the cost never reaches COGS | P7 moves the PO line's cost from Unreceived Inventory to COGS on the drop-ship delivery or its match (or bills drop-ship lines to a COGS item type) |
| F40 | P0: `create#DropShipPurchaseOrder` runs inside the sales order's Approved SECA transaction and approves the PO; with the gate on that would refuse and roll back the sales approval | P7 stops the drop-ship PO at Placed for `decide#PurchaseApproval` when the flag is on, approves as the branch does when off, and sends only after approval |
| F41 | P0: `apply#OrderPromotions` returns with no `productStoreId`, and promotions are found by the order's store, so a purchase promotion needs a ProductStore on the PO, which brings shipping and tax calc, store emails, requireInventory, autoApproveDelay and reservation against the PO. Price-row tiers exist in the demo: DEMO_1_1 from ZiddlemanInc at 1 = 9.00, 100 = 8.00 | P11 builds the tiers as price rows; the promotion way needs a purchasing store (no reservation, no emails, calc disabled on the part), which P11 seeds and tests or defers to §7 |
| F42 | P0: Projects' `send#Invoice` calls Mantle's `mantle.account.InvoiceServices.send#Invoice`: html-print render, `xslFoTransform` PDF stored once per content hash as an immutable InvoiceContent, a `send#EmailTemplate` per recipient with the bytes attached, InvoiceEmailMessage, and operation replay; not an EmailMessage draft. OrderContent has no immutable flag and no seeded type; OrderEmailMessage has `orderRevision`. ZiddlemanInc has no email | P3's `send#PurchaseOrder` copies this path, seeding an OrderContentType for the issued PO; demo data gives ZiddlemanInc an order email |
| F43 | P0: ZiddlemanInc has the Supplier role, addresses, phone and a bank account, but no `ownerPartyId` (so the active-org filter hides it), no email and no SupplierProfile; its PptCurrent purchase prices name no customer, so they are offers to any buyer. ZIRET_WH is ORG_ZIZI_RETAIL's warehouse. OrderProcureToPayBasicFlow runs with authz off and places and approves its PO (23,795.00) directly | P1's base: BOSS demo data shares ZiddlemanInc (`_NA_` owner) with an order email and a profile; the spec stays unchanged with the gate off for ORG_ZIZI_RETAIL (F34) |
| F44 | P1: the per-app Shell specs left the regression suite in the test reduction; Products and Accounting check their menus per group in their Access specs | PurchasingShell folded into PurchasingAccess (P1 review R2) |
| F45 | P1: `get#PartyOrganizationInfo`'s organizations for a Retail agent include `BOSS_WH_RETURNS` (Warehouse's demo organization under Retail), so the organizations choice lists it beside ORG_ZIZI_RETAIL | None: a demo-data effect, harmless |
| F46 | P1: `get#RecordLink` answered no link for any OrderHeader or Agreement before P1; a sales order still gets none (Sales has no order screen) | P1 links POs, quotes and agreements to Purchasing; sales orders wait for Sales (picked up in impl-sales P7) |
| F47 | P2: `PriceResolver.context` infers the sales direction with no vendor and refuses a purchase direction, so a purchase price explanation needs the supplier | Purchasing's PriceExplain asks for the supplier first |
| F48 | P2: Purchasing users held no catalog read, so Products' shared Product360, SupplierPrices and PriceExplain refused them | PRODUCT_CATALOG_VIEW to the list-reading Purchasing groups; the Purchasing context shows no price or cost tab, and supplier prices keep SUPPLIER_PRICE_VIEW |
| F49 | P2: the design's PurchaseControls also name a substitution and a recurring-release rule, which only P9 and P13 read; the Pending supplier's notification needs P4's topic | Left to P9, P13 and P4 |
| F50 | P2: a shared tab whose screen has a `condition` is still listed in every app's tab menu data; only its content is hidden (as in Warehouse and Manufacturing) | None |
| F51 | P14a: the Purchasing planner holds no PURCHASE_ORDER_EDIT, so the plan's "a planner's second conversion is DemandAlreadyCovered" is a second buyer's; a planner is refused | The walk uses a second buyer; the planner plans, buyers convert |
| F52 | P14a: `run#SupplyPlan` explodes a made product's BOM through `get#BomExplosion` (METHOD_VIEW); without it the whole run failed | METHOD_VIEW to the Purchasing planner and admin; a runner without it gets METHOD_INVALID on that product and the run goes on (review R1) |
| F53 | P14a: `get#SupplyPlan` admitted no permission the Purchasing reader holds | Mantle's SUPPLY_PLAN_VIEW, granted to BOSS_PURCHASING_READ |
| F54 | P14a: a draft purchase order was no supply to the plan, so a converted buy would be suggested again | The lines of a draft order with an active RequirementSupply (a conversion's) count |
| F55 | P14a: Shared/SupplyPlanning included Manufacturing's `choices`, which refuses a Purchasing user | It dispatches by app root; at the W2 merge one Purchasing context in SharedContext.js serves both Product360 and InventoryAvailability |
| F56 | P14a: a tab's qvt fragment under Replenishment/ReorderRules renders the parent's tab menu, so AppStructure checks those routes for errors only | None; their content is PurchasingReplenishment's |
| F57 | P3: the framework's `enable-audit-log="update"` skips an update from an empty field (`crates/moqui-entity/src/entity/field_rw.rs:349-352`). Moqui Java does the same on purpose (`EntityValueBase.handleAuditLog`: "if set to log updates and old value is null don't consider it an update (is initial set of value)"), so it is parity, not a bug; the XSD's wording is looser. Accounting's first `costCenterId` on a line is therefore not logged | No framework change. P3 logs its fields with "true"; a field whose first set matters uses "true" |
| F58 | P3: under Mantle's counting a line's quantity or price change never moved `orderRevision`, while content, notes and status did | `PurchasePolicy.commercialRevisionOnly` counts only commercial changes; off by default, on in Retail's demo |
| F59 | P3: OrderContent has no immutable flag, so the issued PDF, stored once per print hash, is not protected from change | Open; an OrderContent immutable flag with Accounting's InvoiceContent rule, later |
| F60 | P3: `check#OrderPreApprove` warns every PO without authorized payments, so `approve#Order` refuses only on the purchase-approval warning | As built |
| F61 | P3: Mantle's SYSTEM EmailServer has no SMTP host, so a plain install sends no PO email | The BOSS demo uses a local mail sink; deployment sets the host |
| F62 | P3: the MantleOrder search index holds sales orders and every organization's orders | The PO palette type is Purchasing's own source |
| F63 | P3: BOSS_PUR_LISTS's ALWAYS on `Orders.xml` reaches every screen under it, so a quick create there was offered to readers | Quick create is the root's NewPurchaseOrder with its own group BOSS_PUR_NEW_ORDER |
| F64 | P4: `reserve#`, `release#Commitment` and `check#Budget` admitted no Purchasing permission (Accounting §7: "with their approval permission"); PURCHASE_APPROVE is added to Budgets.js's reserve permissions (a widening, no new refusal). | See P4 |
| F65 | P4: `store#SupplierProfile` needs SUPPLIER_PROFILE_EDIT for any buying field, which the purchase approver group does not hold, so an approver could not set a supplier Approved; `decide#SupplierApproval` writes the decided status through SupplierProfile.js's `storeDecision` after its own PURCHASE_APPROVE check. | See P4 |
| F66 | P4: A band applies only in its currency (or every currency when it names none); nothing converts an amount, so the preview's "converted amount" is the source's own, and a source in a currency no row covers, where rows exist, is POLICY_MISSING. | See P4 |
| F67 | P4: A supplier has no revision; P4 counts its SupplierProfile rows (each change starts one), which the notice carries as `sourceRevision`. | See P4 |
| F68 | P4: A line changed on a placed order before any decision left the approvers' notice at the old revision, which the handler then refuses as stale; the SECA also resends where an approval notice exists, not only after a decision. | See P4 |
| F69 | P4: PurchaseOrders' row selection posts order ids only, so the list's bulk approval decides each order's current revision; `bulk#PurchaseOrderActions` takes `orderRevisions` for a caller that kept the revisions reviewed; the list now posts the revisions shown (review R3). | See P4 |
| F70 | P4: An error of a service called through `EntityLib.call` reaches the framework's approve#NotificationMessage as "Error: Error: CODE: …" (the inner error text is wrapped again); callers test the code with includes, and `lib.reasonCode` would not parse it. | See P4 |
| F71 | P4: The design's Approvals rows show the budget result and a due date; a notice is sent by the buyer who placed the order, who may not read budgets, so the title has no budget, and Today's due date is the time it was sent. OrderDetail's approvals show the budget to an approver. | See P4 |
| F72 | P4: OrderDetail's Purchasing branch has no tab list (P3 built it as sections of one page); P4's approvals are a section of their own template, included in place of P3's Approvals box (one line in `PurchasingOrderDetail.xml`). | See P4 |
| F73 | P4: Approvals is no longer a placeholder: AppStructure's count is 60 against its floor of 59, which P5 and P6's screens may cross at the merge. | See P4 |
| F74 | P5: Warehouse's receipt transitions included in Shared/ShipmentDetail (`closeRemainder`, `receiveAll`) check Warehouse's record scope (its root) and answer `sharedLinks['Receiving/ReceiptDetail']`, which no other app has, and Accounting's `invoiceFromSource` refuses any root but Accounting; Purchasing's mount has its own transitions over the same Mantle services. | See P5 |
| F75 | P5: Shared/QualityInspection's and InspectionTemplates' transitions and choices are Warehouse's (or Manufacturing's) and need Warehouse's root; a Purchasing reader without it got no status filter. Purchasing answers the status filters itself and leaves the rest to Warehouse's choices. | See P5 |
| F76 | P5: `ensure#PurchaseReceipt` takes no supplier shipment reference, which design PrepareReceipt lists; the receipt keeps none from Purchasing (a later parameter on the Warehouse service). | See P5 |
| F77 | P5: ZIRET_WH's demo operation policy names no quarantine location, so a receipt that needs inspection there is refused LOCATION_REQUIRED unless the receiver chooses the quarantine cage (0901); the walk does. | See P5 |
| F78 | P5: A line's accepted quantity counts its receipts' first inspections' decisions; a re-inspection's split shows only through the held quantity. (Fixed in review R1: a re-inspection moves what it accepts back to accepted.) | See P5 |
| F79 | P5: The due date is the line's, the part's or the open receipt's, so the Late, Partly received and Held views are computed over the open lines read (at most 2,000, with a warning past it) rather than in the query. | See P5 |
| F80 | P6: `request#HoldRelease` needed PAYABLE_EDIT, which no buyer holds, so Purchasing's RequestHoldRelease (crosscut §3.22) could not ask; it now admits INVOICE_MATCH and PURCHASE_ORDER_EDIT too (a request, no new refusal), written into design-accounting's Holds and impl-accounting's AC-03. | See P6 |
| F81 | P6: Accounting's `find#BillExceptions` needs payables read (PAYABLE_VIEW, a report reader or admin); buyers hold none, so Purchasing's lists read the buying organizations' bills themselves (BillServices), the match group's PAYABLE_VIEW adding only the unpaid amounts and payments. | See P6 |
| F82 | P6: `import#Bill` keeps no link to the order it is given (it checks it and names it in the description) and takes one ItemExpense line for the amount, so an uploaded bill has no product line to match until AP keys its lines in BillDetail, and a bill is found by its order only once matched (OrderItemBilling). The walk has AP key the line. | See P6 |
| F83 | P6: `add#OrderPartPayment` checks no permission and BOSS grants no raw Mantle mutator (§2), so the prepayment is Mantle's new `request#SupplierPrepayment` over it, with PAYABLE_EDIT and the amount left on the part. | See P6 |
| F84 | P6: No Purchasing group holds PAYABLE_EDIT or ACCOUNTING_GL_POST: Create draft bill, Request supplier prepayment and Allocate to receipts show only to a Purchasing user who also holds Accounting's AP or GL group; the buyer uploads. | See P6 |
| F85 | P6: A receipt of an organization whose `receiptInvoiceSelfBilledOnly` is N (the demo's Retail) is billed by Mantle's receipt SECA when its shipment is delivered, so the specs receive without delivering; with the flag on (impl- accounting §4) only self-billing suppliers' receipts bill themselves. | See P6 |
| F86 | P6: Shared/InvoiceMatch linked its order lines through Accounting's `Records/OrderDetail` link and searched orders through Accounting's `choices`, which refuse a Purchasing user; the Purchasing row takes Orders/OrderDetail and its own `billChoices` transition. | See P6 |
| F87 | P6: F30 checked with a service PO: a service line's bill (item type ItemServiceProduct; there is no ItemService) has no eligible source until `accept#ServiceItem`, then matches on the accepted quantity. | See P6 |
| F88 | P6: Supplier360's Bills tab, like F50's, shows in the other apps' tab menus with its content hidden. | See P6 |
| F89 | P6: PurchaseOrders' Received, not billed view reads the orders of the newest 500 receipts that name no bill (all organizations, then the buyers' filter), and MatchExceptions' line views the newest 100 approved orders: bounded reads, so an older unbilled receipt can fall outside them. | See P6 |
| F90 | P7: Mantle's pack issues a reservation only up to its asset's quantity on hand unless the facility has `assetAllowIssueOverQoh` Y; the shell asset holds nothing, so a drop-ship facility needs it beside `assetAllowOtherOwner` (the branch's README leaves it out). `store#DropShipFacility` and the demo set both; the design's setup says so. | See P7 |
| F91 | P7: `recalc#OrderItemAmount` resolves a price as the current user, and the SECA runs as the sales order's approver, who seldom reads supplier prices: the branch's PO line kept the sales price. create reads the supplier's current price row itself with the resolver's eligibility (review R2: the order's currency, no store, agreement or term scope, the line's unit; the organization's row before the supplier's general one, the highest minimum quantity reached, the latest), and leaves an order with an unpriced line Open (R3). | See P7 |
| F92 | P7: A tx-commit SECA runs on a service worker in a context of its own, so the drop-ship send is not in the approver's request: specs wait for the worker (`ec.factory.waitWorkerPoolEmpty`), and a send that fails leaves the order in Approved, not sent for the buyer. | See P7 |
| F93 | P7: Drop-ship from supplier on a line that shares its part makes a new sales part; `update#OrderPartTotal` lowers a single promised payment of the original part to its new total, so route gives the new part a payment by the same method for its total (review R5). An authorized payment cannot be split and stays on the original part, so a moved line's share of it is the order's to settle. | See P7 |
| F94 | P7: A customer line changed or cancelled after its drop-ship order is made does not change that order; the buyer revises or cancels it (P9's revisions); cancelling the sales order leaves its drop-ship orders open. | See P7 |
| F95 | P7: A bill price above or below the order's leaves the difference in Unreceived Inventory, as for a received line (Mantle posts no purchase price variance); Accounting's price tolerance holds such a bill. | See P7 |
| F96 | P7: The delivery's transaction is in the order's currency; `post#AcctgTrans` converts it to the organization's base currency (AC-19), or holds it in the error journal with no rate. | See P7 |
| F97 | P7: finalize is refused to an integration user without PURCHASE_ORDER_EDIT in the buying organization; a supplier integration's user needs the permission (the Supplier app's report for review is P16's). | See P7 |
| F98 | P7: Mantle's receipts worklist and the bills' received-not-billed and billed-not-received views read receipts: drop-ship lines are left out of the first and read their delivery in the others. | See P7 |
| F99 | P7: ss-inventory.md and usl-inventory.md have no rows for the drop-ship forms and services (the branch's services were never in Mantle's master), so P7 fills no Implemented-in cell. | See P7 |
| F100 | P8: `create#ReturnFromOrder` and `cancel#Return` check no permission (Mantle's raw mutators); Purchasing calls them after `check#Record` with `buy`, as Warehouse calls `create#Return`, and `add#ReceiptToReturn` checks PURCHASE_ORDER_EDIT again. A guarded Mantle create and cancel of a supplier return would make the rule Mantle's. | See P8 |
| F101 | P8: Mantle's `respond#ReturnItems` answers nothing for a supplier return ("Cannot process return responses for supplier purchase return"), so ReturnApprovedProcess only makes the shipment and a Replace response orders nothing by itself: the replacement is `create#ReplacementOrder`'s, as design §9 says. | See P8 |
| F102 | P8: ReturnHeader has the supplier's RMA number (`supplierRmaId`) but no RMA expiry or supplier instructions field; design Returns' "RMA expiry, attachment and supplier-approved instructions are recorded" are a file (ReturnContent, type Authorization) and the conversation for now. | See P8 |
| F103 | P8: (decided Nov 4 by the user: a correction of the match base, no flag; built in the P8 review, R2) Accounting's match base (`InvoiceMatch.js`, `get#SourceInspectionStatus`) takes out only what inspection removed (scrapped, or sent back under a Return to supplier disposition). A rejected unit returned that way leaves the receipt's match (the walk: 8 received, 7 match-eligible), but a supplier return of released, unbilled stock does not lower the receipt's match base, so a later bill could still match it. Changing it is a new refusal in Accounting's match (behind its flag); left for the lead and Accounting. | See P8 |
| F104 | P8: An unbilled supplier return has nothing to settle (`preview#ReturnSettlement` answers no line), so it stays ReturnShipped with its quantity open unless it is replaced; there is no "close without credit" for it. | See P8 |
| F105 | P8: No Purchasing mount shows a supplier return's ShpTpPurchaseReturn shipment (Receiving/ShipmentDetail's Purchasing branch is purchase receipts); ReturnDetail shows its status, quantity sent back and tracking. | See P8 |
| F106 | P8: ReturnItem has one `replacementOrderId`: a second replacement of the same item moves the link to the new order (`replacedQuantity` keeps the total). | See P8 |
| F107 | P8: `settle#Return` refuses a credit against a bill not finalized (CREDIT_SOURCE_INVALID); the walk approves the supplier's bill before Accounting settles. | See P8 |
| F108 | P9: No skip-locked find in scripts (impl-warehouse F175), so a revision cannot tell at once that a receive holds the receipt; Warehouse's receive guard also receives on a held order. ReceiptInProgress is therefore the preview's basis key (each line's received and billed quantities): `apply#PurchaseRevision` locks the open receipts first, waits for a receive under way, and fails by name when anything was posted since the review. | See P9 |
| F109 | P9: OhtChange's release permission (`enumCode`) is ORDER_APPROVE, which no Purchasing group holds (the design's ORDER_CHANGE_HOLD_RELEASE is not seeded), and nothing in mr-mantle, mr-boss or mr-pass placed a Change hold before P9. The approval of the revision releases its Change hold and the buyer's cancel an unapplied one; `release#OrderHold` still releases it for an ORDER_APPROVE holder. | See P9 |
| F110 | P9: Under `commercialRevisionOnly` each changed line moved `orderRevision` by one (`handle#OrderItemChange`'s item kind), and without the flag the part's fields, the internal note and the acknowledgement's OrderPart writes each moved it too (`handle#OrderPartChange`, the note and content rules); `increment#OrderRevision` returns while the order's count is held (`ec.context.sharedMap['PurchaseRevisionCount:<orderId>']`), and the OrderRevisionPurchaseApproval SECA still runs on those returns (harmless: nothing is superseded at the same revision). | See P9 |
| F111 | P9: `reserve#Commitment` at a new revision replaces only the lines the approval reserves, so a line lowered to zero kept its earlier commitment until close or cancel (P4 review), and a buyer holds no budget permission; Accounting's `BudgetServices` gains the internal `lower#SourceCommitments` (no permission of its own, as `release#ClosedSourceCommitments`), written into design-accounting's budget contract list below. | See P9 |
| F112 | P9: `adjust#ExpectedReceipt` refused a held order (`Receiving.purchasePart` took Approved or Sent only); it now takes the hold a revision places. The receive guard is unchanged. | See P9 |
| F113 | P9: The framework writes a `<field>_changeReason` in the context to each audit row (as Moqui Java does), so the revision's reason is on each change, read back by OrderDetail's Revisions and the print's "Changes in this revision". | See P9 |
| F114 | P9: OrderPart's reference, dates and terms logged with "true" write an audit row for each new part's first value of them; the as-of print needs the first set. | See P9 |
| F115 | P9: RecordAcknowledgement takes one promised date for every line (a dialog form has no per-line grid); a line's own promise is its row's Promise on OrderDetail, which keeps the revision's recorded response. | See P9 |
| F116 | P9: Not built: a ship-to address choice in OrderChanges (apply takes `postalContactMechId`; Purchasing has no address choice source) and adding a line by a revision (a new line is a new order or a later item). | See P9 |
| F117 | P9: An order is overdue from its revision's first order email; an order marked Sent with no email (the demo's, or sent outside Mantle) is unacknowledged but never overdue. | See P9 |
| F118 | P9 review: a revision that changes the currency with a price or quantity has `lower#SourceCommitments` compare commitments in the old currency with amounts in the new; `record#Acknowledgement` accepts a response while an applied revision awaits approval; a reminder whose record write fails after the send can mail again | P17: the currency change with an amount is refused (CURRENCY_CHANGE_WITH_AMOUNTS) and an applied revision awaiting approval is neither acknowledged nor reminded (REVISION_PENDING); the reminder's resend after a failed record write is §7 |
| F119 | P10: A request's revision is the time (epoch milliseconds) of the last audit row of its lines' six fields, kept in `PurchaseApprovalDecision.sourceRevision` (a long) and shown as a time; deleting a line writes no audit row, so a line is removed only from a draft, before any decision. | See P10 |
| F120 | P10: RequestItem has no price; `maximumAmount` ("the maximum amount (price) to pay for the item") is taken as the line's not-to-exceed amount, so a line without one counts nothing toward the approval bands and reserves nothing. | See P10 |
| F121 | P10: Sourcing prices a line at the supplier's price the buyer may read (`store#PurchaseOrderItem`); a supplier with none fails its group PRICE_UNAVAILABLE (retryable). RequestSourcing has no per-line price override yet (design SourceGroups' "price/override"). The demo's DEMO_1_1 has supplier prices from Ziddleman only, so the demo request names Ziddleman and the walk adds a Brightline price. | See P10 |
| F122 | P10: The preview shows the supplier check and, for a supplier-price reader, the group's amount, but no `check#Budget`: the request's budget was decided at its approval and the PO stage is decided by the order's approval (`convert#Commitment`), and a buyer may not read budgets. | See P10 |
| F123 | P10: Warehouse P15 left `complete#RequestFromWork` without a type check, so P10's check leaves RqtInventory alone too, with RqtPurchase and RqtPurchaseRfq. It refuses nothing, so it has no flag; WorkProjectRequests passes unchanged. | See P10 |
| F124 | P10: A revision of a request-sourced order line after its approval holds the line again with `reserve#Commitment` (its earlier order commitment, converted from the request, already holds the request's share), not a second conversion. | See P10 |
| F125 | P10: Customer demand on a request (for the drop-ship route) is a RequestItemOrder from the request line to a sales order line; nothing in BOSS writes one yet (P14b's conversion, or a later intake). `route#OrderItemToDropShip` buys only on an approved customer order, so the route fails DROP_SHIP_PENDING before it. The route has no regression spec (its drop-ship fixture is P7's); left for P14b's walk. | See P10 |
| F126 | P10: `cancel#PurchaseRequest` keeps its reason as the status change's `changeReason` (Request has no note entity of its own besides comments); the purchase orders made from the request stay and are named for the buyer. | See P10 |
| F127 | P10: Nothing completes a purchase request when its lines are received in full; it stays In Progress until a user completes it (design RequestDetail: "fulfilled or explicitly closed with a reason"). Left for P17. | P17: complete#PurchaseRequest (received in full, or closed with a reason), releasing a short line's rest and the request's reserved commitments; RequestDetail's Complete request |
| F128 | P10: The demo request is in BossUsersDemoData, after the requester's party: `Request.filedByPartyId` has a foreign key, and BossPurchasingDemoData loads before the users. | See P10 |
| F129 | P10: AppStructure's placeholder floor is now 56 (Requests built). | See P10 |
| F130 | P13: PurchaseApprovalDecision's `sourceRevision` is an integer bound to a counter, and design §17 made an agreement's revision "the time of its last audit-logged change". Agreements get `agreementRevision` and its `revisionDate` (the release allocation keeps both); design §7 and §17 now say so. | See P13 |
| F131 | P13: The PurchaseOrderApproval topic's title template names a purchase order (`${orderId}`) and is seed-initial; an agreement's notice sets its own title (`notify` reads `source.title`), and BOSS's link template picks AgreementDetail or OrderDetail by the message's `sourceEntityName`. | See P13 |
| F132 | P13: `store#ProductPrice` needs SUPPLIER_PRICE_EDIT, which the buyer group does not hold; the agreement's price is part of the agreement, so `store#AgreementItem` writes the agreement-scoped row itself under PURCHASE_ORDER_EDIT (ending and starting rows, so the price as of a time reads back). Reading it still needs SUPPLIER_PRICE_VIEW (the resolver). | See P13 |
| F133 | P13: mr-marble's agreement screens (F32) write raw: the audit log now covers what they write of the logged fields, but a raw change does not count `agreementRevision`, so a marble change of an active agreement is not sent for approval again. No BOSS group reaches marble. | See P13 |
| F134 | P13: The recurring-release rule (F49) is not built: a recurring release needs a schedule per agreement item (a frequency and next date) and a job calling `release#PurchaseAgreement`, which already checks the caps, dates and approval again each time; left to §7 with PurchasePolicy's field. | See P13 |
| F135 | P13: AgreementFiles is AgreementDetail's own list and upload over `create#AgreementContent` with the record check, not Commons' `record-files`, so the approved PDF is withheld from the reader as OrderDetail's issued PDF is (P3 R1). | See P13 |
| F136 | P13: Supplier360's new Agreements tab is listed in every app's tab menu data though its condition keeps its content to Purchasing (F50). | See P13 |
| F137 | P13: The Mantle regression spec takes about 3 s (up to 6 s when its first approval renders the run's first PDF); mr-mantle's feature time was 294 of 300 s at wave 3, so the lead may move its third feature to acceptance. | See P13 |
| F138 | P11: Commons listed and showed every request its user filed or was a party of, with no type rule, so a buyer's RFQ was in their Commons list; Projects showed one in a visible project or of a triaged type. Commons' access service (which Projects' builds on) and both lists now leave the type out; it refuses nothing existing (only P11 makes the type). | See P11 |
| F139 | P11: `convert#RequestToProject` gains a refusal of the RFQ type (REQUEST_TYPE_FIXED) with no flag: the type is new and no existing caller makes one (as P10's F123); the triage notice and the intake settings simply skip it. | See P11 |
| F140 | P11: The promotion way of quantity tiers (F41) needs a purchasing ProductStore with tax and shipping calculation, store emails and reservation turned off for purchase parts; not built (§7). Tiers are published price rows. | See P11 |
| F141 | P11: ProductPrice named no source; `sourceOrderId` and `sourceOrderItemSeqId` are added and Products' `PricePolicy.js` writes them through `store#ProductPrice` (a widening that refuses nothing); a `replace#ProductPrice` successor names no source, as its price is not the quote's (review R3). | See P11 |
| F142 | P11: `expire#ProductPrice` takes an end now or later, so a published price starts a second ahead at the earliest and the tier's earlier row ends where it starts. | See P11 |
| F143 | P11: Design QuoteRequestSuppliers' per-supplier contact, send channel, deadline and capability expiry are not built: the recipients are the supplier's order addresses, else its primary ones (as a PO's), the deadline the RFQ's, and P16 adds the capability and link. | See P11 |
| F144 | P11: Quotes are never supply, checked by reading: `run#SupplyPlan` counts placed to sent parts and a conversion's OrderOpen drafts (SupplyPlanning.js), P10's sourcing counts RequirementSupply, which no quote has; Mantle reserves only placed or approved parts with a store (F35), auto-approves only on Placed, and P3's gate and P7's drop-ship SECA act on Placed and Approved. | See P11 |
| F145 | P11: A declined quote (OrderRejected) leaves Purchase orders' quote filter (quote statuses only) and shows in its Closed view; its record link stays QuoteDetail (`wasQuote`). P12's Not awarded (OrderCancelled) is the same case. | See P11 |
| F146 | P11: Under Retail's `commercialRevisionOnly` a quote line's price change moves the quote's `orderRevision` (P3's rule on any purchase order); harmless, as no approval decision exists on a quote, and it counts amendments. | See P11 |
| F147 | P11: AppStructure's placeholder count drops by one (Sourcing built): its floor is 54. | See P11 |
| F148 | P11: Every request's audit-logged change shows in its Chatter timeline, so logging Request's response date and description on create ("true") gave every request with them a "Set to" entry (Chatter's paging spec failed). Built as "update", which left a text first set after create unlogged (no revision, a wrong as-of print). Review R1: Request has no audit-logged field again; `store#QuoteRequest` writes the RFQ header's EntityAuditLog rows itself (response date, text, facility, currency; a first set included), so only an RFQ's timeline shows them. | See P11 |
| F149 | P14b: Mantle reserves a sales line when its order is placed, its shortage reserved without stock (negative availability), so the plan's sales lines left out every placed order: a customer-order shortage had no sales line in its provenance or RequirementOrderItem. Such a line is now shown and pegged (`salesWaiting`), not netted; the netting is unchanged. | See P14b |
| F150 | P14b: Held quantity was netted "within the lead time" only for a made product (its BOM's lead days); a bought product had none, so only inspections already due were netted. Its supplier price's `standardLeadTimeDays` is now its lead time for that rule. | See P14b |
| F151 | P14b: Warehouse's receive leaves stock AstOnHold at the dock until its putaway, and `receive#Asset` gives stock to waiting reservations only once it is available (`reserve#IncreasedAsset`, by priority then date), so a pegged line could lose its stock to another order. The receipt's Reserve reserves the on-hold stock for the pegged line; putaway's `move#Asset` carries the reservation (ReplenishmentRoutes covers it since the review). | See P14b |
| F152 | P14b: Request lines as plan supply count any approved purchase request of the organization at a facility of the set, in the line's quantity: a request line in a unit other than the stock unit is not converted (the request route writes the stock unit; a hand-filed line in another unit would be miscounted). Fixed in the review (R2). | See P14b |
| F153 | P14b: The drop-ship route buys from the suggestion's supplier (the plan's lowest minimum-quantity price), which may not drop-ship the product (NOT_DROP_SHIPPABLE, named); `convert#PlanningSuggestions` takes `supplierPartyId`, but Convert offers no supplier choice yet. | See P14b |
| F154 | P14b: No BOSS regression spec: the rules are Mantle's (ReplenishmentRoutes); BOSS adds no access rule (Reserve is the receive capability on a receipt, PurchasingAccess's P5 case), and the screens are the walk's. | See P14b |
| F155 | P14b: F125 is answered: the request route writes the RequestItemOrder from a request line to its customer order line, and ReplenishmentRoutes covers RequestSourcing's drop-ship route. | See P14b |
| F156 | P12: (F145) A quote order had no marker: OrderHeader's `supplierQuote` is set when a quote order is made, and Purchase orders' find leaves out a marked order with no `placedDate` (declined or not awarded); an awarded quote is placed and listed. Quotes made before P12 carry no marker and stay listed when closed. | See P12 |
| F157 | P12: OrderRequested had no transition to OrderCancelled; a requested quote never answered is not declined (OrderRejected is the supplier's "Reject Request"), so the Default flow gains "Cancel Quote Request" (a widening; no existing service moves a requested order there). | See P12 |
| F158 | P12: (F35) Cancel Quote fires the EDI acknowledgement SECA on OrderCancelled; `record#OrderAcknowledgment` returns at once for an order not received in an 850, which no quote is. Accepted, no condition. | See P12 |
| F159 | P12: Mantle's `update#OrderItem` prices a product line again by the resolver when no `unitAmount` is given, so P11's `store#SupplierQuoteItem` changing a quote line's quantity alone lost the quoted price (and placing an award lost the totals: a zero grand total auto-approved the placed order). Both now pass the price. | See P12 |
| F160 | P12: QuoteTerms' freight estimate was not built (P11): `store#SupplierQuoteFreight` keeps it as the quote's one ItemShipping line, so the landed cost has a source; tax inclusion, MOQ/increment and warranty are still not recorded. | See P12 |
| F161 | P12: Lead time is the line's promise, else the quote's delivery date; the on-time rate from scorecard evidence is P15's and not shown. Risk is the buying policy's supplier check. | See P12 |
| F162 | P12: The awarded-quote branch of `publish#SupplierQuotePrice` is now tested (SourcingAwards). An agreement price row exactly as specific as a published one still meets Products' overlap refusal with its own message; P13's rows name the agreement and item, so they are a narrower scope; the case is not exercised by P12's specs and is left as P11 noted it. | See P12 |
| F163 | P12: Design SelectOffer's "requester acceptance where policy requires it" for a substitute is not built: a substitute is accepted by the buyer's explicit choice (INVALID_SUBSTITUTE without it); the referral of released BOM material to Manufacturing change review is not built. | See P12 |
| F164 | P16: ExternalAccessCapability had no revision (design §13 names one); added as `recordRevision`. The plan's "a new revision revokes it" is built as the acknowledgement superseded on the older link, its bill upload kept. | See P16 |
| F165 | P16: store#SupplierQuote, store#SupplierQuoteItem and record#Acknowledgement check PURCHASE_ORDER_EDIT and the user's organizations, which a public supplier has neither of. A supplier's claim (`ec.context.sharedMap`, set only by SupplierPortal.js after the capability check) stands in for both on that one order, and every other order stays unavailable; the check is in PurchaseOrders.js and one line of Sourcing.js `requirePermission` (P12's file). | See P16 |
| F166 | P16: Mantle's store verbs set a field that is passed, even as null; the portal passes only what the supplier gave. | See P16 |
| F167 | P16: OrderContent counts a revision on an order without `commercialRevisionOnly` (Order.eecas.xml), so a supplier's file or delivery report would supersede its own link; they are written uncounted (PurchaseRevisions.js `uncounted`). | See P16 |
| F168 | P16: Without a draft record, Save draft would write the quote's lines, which the buyer reads; drafts and receipts are `SupplierPortalResponse`. | See P16 |
| F169 | P16: PASS's REST and gRPC transports sent every operation with a `file` field as multipart and required the file; the quote's and acknowledgement's file is optional, so without one it is an ordinary call. Lines cross a multipart form as JSON text. | See P16 |
| F170 | P16: A remote frontend shows only the envelope's generic message for an Unprocessable or Conflict (PassAuthority MESSAGES), so a supplier's validation message ("Give the reason") reads "The authority could not complete this request" remotely, as BillUpload's do. For the lead: pass the refusal's own text for those kinds. | See P16 |
| F171 | P16: Design QuoteResponse accepts a late response "only if policy permits", and PurchasePolicy has no such flag; late responses are accepted and marked (§7). | See P16 |
| F172 | P16: invite#Contact makes the PASS invitation but mails nothing (as Accounting P18); Supplier360 shows its link once for the buyer to send. | See P16 |
| F173 | P16: QuoteResponse offers no file downloads (the published RFQ PDF, permitted files): PASS has no supplier file operation yet, and the RFQ email carries the PDF (§7). | See P16 |
| F174 | P16: A drop-ship delivery report is the order's content and the buyer's notice; OrderDetail's Confirm delivery does not prefill from it yet, and a subcontract order shows the components held at the custody facility but not the dispatch and inspection evidence (§7). | See P16 |
| F175 | P16: Accounting's portal demo already invites a Ziddleman contact (ziddleman.billing) on ZIZI_PORTAL's Supplier mount; P16 adds the quote and acknowledgement links to it. The Supplier app's default page is now SupplierHome (was BillUpload). | See P16 |
| F176 | W8 reviews: QuoteResponse shows the RFQ as it is now, so buyer edits not yet re-sent are visible to the supplier (the as-of print could show the last sent revision); a supplier price published from a quote line stays in effect when the award drops the line; with default settings a quote line price change does not move `orderRevision`, so the comparison-to-award SOURCE_CHANGED check rarely fires (the approval path's stamp covers it) | P17: QuoteResponse shows the RFQ as last sent to the supplier; the published price after the award drops a line and the SOURCE_CHANGED check are §7 |
| F177 | P15: The form-list CSV export (ScreenCsv.js `$csv`; XLSX writes string cells and is safe) quotes but does not guard formula-like text, so a list exported with show-csv-button can carry `=...` from a supplier's name or reference into a spreadsheet; the Purchasing reports guard their own export (Reports.js `csvCell`, as moqui-report's dashboard export does). For the lead: a framework guard in ScreenCsv.js would cover every list (Review P15). | Fixed in the framework (Nov 4, at the user's call): ScreenCsv.js's `$csv` writes formula-like text with a leading apostrophe unless it is a plain number, and quotes a CR; moqui-core test `csv_guards_formula_text_and_quotes_a_carriage_return` |
| F178 | P15: A Block rule is the explicit approved rule the design asks for (no rule, no change); its override is ending the rule or the risk (PURCHASE_POLICY_EDIT, SUPPLIER_PROFILE_EDIT) or a newer evaluation: there is no per-document override. ScoreActions has one effect for RFQs and orders alike, and no reviewer role or expiry; Warn and review warns and marks the evaluation, and no follow-up work item is made (§7). | See P15 |
| F179 | P15: RFQ response counts an invitation from its first sent email (EmailMessage ES_SENT): a quote entered on the supplier's behalf with no email sent is not an invitation here. Price variance leaves out a bill in another currency than its order (no conversion) and compares in the order line's unit. | See P15 |
| F180 | P15: Evaluating every supplier (no supplier named) reads the period's receipts (at most 5,000 orders), so a supplier with only RFQ invitations in the period is evaluated only when named. | See P15 |
| F181 | P15: The supplier statement counts bills received for review and later (not Incoming), credits by invoice type (InvoiceCreditMemo, InvoiceReturn) and Delivered or Confirmed payments by effective date, not their applications: a payment not yet applied lowers the balance. | See P15 |
| F182 | P15: The walk follows P10's request through its bill; paying the bill (AP's approval and a payment run) is not driven, so the tracker's payment shows "Not paid" to a payables reader and the bill's actual is Accounting's conversion called directly, as approve#Payable makes it. | See P15 |
| F183 | P15: Spend's received measure is the receipts at the order's price, not landed cost (Accounting's allocation, linked for its users); paid is by applied date and not by product. A withheld measure still lists its groups, so a reader sees which suppliers had spend. | See P15 |
| F184 | P15: Home's counters are all counted now; a Purchasing reader sees no "Unavailable" card (PurchasingAccess's Home check changed with it). | See P15 |
| F185 | P17: The purchasing administrator (BOSS_PURCHASING_ADMIN, MANTLE_ACTIVE_ORG) reaches every organization's purchase records, palette rows, links and choices when no organization is active (Purchasing.js `rootGrants`, by design, §4); the isolation sweeps leave it out, as the other apps' walks leave out their administrators. | See P17 |
| F186 | P17: The demo's purchasing.buyreceive is in Warehouse's root group (BOSS_WAREHOUSE) as well as its receive group, so it opens Warehouse; the standalone case is the walk's own user, which holds BOSS_WAREHOUSE_RECEIVE and BOSS_ACCOUNTING_MATCH without either root. | See P17 |
| F187 | P17: Universal search answers nothing in a test runtime (no index), so its check is vacuous; the palette's `search#Records` with its own-side control is the one that counts (impl-manufacturing's review found the same). | See P17 |
| F188 | P17: F127 as the design reads it: a request completes by itself once received in full; sourced in full but not received is still In Progress, so its Complete needs a reason ("RFQ/PO issuance alone is In Progress"). | See P17 |
| F189 | P17: F176's page change: the supplier answers the RFQ's sent revision, so after an edit not yet sent a submitted quote answers an older revision than the RFQ's; QuoteComparison does not mark a quote of an earlier RFQ revision (the receipt keeps the revision answered), so the buyer re-sends after a material edit, as P11's walk does (§7). | See P17 |
| F190 | P17: §15 outputs not built: a receiving checklist and a purchase inspection report under Purchasing (QualityInspection's Print certificate is Manufacturing's link), a bill print and a match explanation print under Purchasing (Accounting's BillDetail has them for AP), and the supplier price and reorder import from SupplierPrices and ReorderRules (Products' ProductImport takes reorder rows, P14, and has no Purchasing mount). | See P17 |
| F191 | P17: PurchasingAccessWalk takes about 60 s with its start (the route sweep 28 s); it is acceptance, so no budget applies, but it could split as Manufacturing's did if it grows. | See P17 |

## 7. Later

Designed, not in this build:

- **The design's `later` rows:** LeaseOverview (PUR-LATER, Accounting AC-17) and MergeDraftPurchaseOrders.
- **Other design items:**
  - bill extraction (OCR) within Accounting's intake;
  - NCR and CAPA in the shared quality model;
  - pivot and graph exploration through Insights;
  - arbitrary score formulas, external risk feeds, EDI and remote supplier ordering;
  - vendor and product purchase warnings (R-XC-45), and SupplierQualifications if crosscut accepts it (R-XC-46);
  - variant-matrix PO entry (PRD-VARIANT-UI);
  - vendor-owned consignment stock (R-PUR-38);
  - rebates and retrospective settlements on agreements;
  - quantity tiers by a purchase promotion's auto-adjust (F41, F140): a purchasing ProductStore with calculation,
    emails and reservation off, and its promotions scoped to purchase orders;
  - an RFQ invitation's own contact, channel and deadline (F143).
  - from the supplier pages (P16): a buying-policy flag refusing late quote responses (F171); file downloads on
    QuoteResponse and OrderAcknowledgement (F173); OrderDetail's Confirm delivery prefilled from a supplier's
    delivery report, and a subcontract order's dispatch and inspection evidence on its page (F174).
  - from performance (P15): a response rule's separate RFQ and order effects, reviewer role, expiry and follow-up work
    item, and a per-document override of a block (F178).
  - from the finish (P17): a receiving checklist and a purchase inspection report under Purchasing, a bill and match
    explanation print under Purchasing, and the supplier price and reorder import from SupplierPrices and ReorderRules
    (F190); a reminder that mailed and then failed its record write mails again on a retry (F118); a supplier price
    published from a quote line staying in effect when the award drops the line, and the comparison-to-award
    SOURCE_CHANGED check with default revision counting (F176); QuoteComparison marking a quote that answered an earlier
    RFQ revision (F189).
- **Other apps' contexts:** the Sales and Customer Service rows of the screens Purchasing mounts; a supplier return
  linked from a customer case (design §14.4 #4, Customer Service's side).
- **The rest of the other apps' needs:** Warehouse's transfer conversion and mount in SupplyPlanning (impl-warehouse
  §7); Customer Service's CX-APPROVAL topics, which reuse P4's decision pattern.

## 8. Verification

- **Per phase,** the "Done" rule of §2.
- **End to end,** run `./moq run`, sign in as `john.doe` and as each demo purchasing user, and walk each built phase's
  "usable when" in order.
- **Design §14.4**, scenario by phase. The walks named are acceptance tests (`./moq accept mr-boss`, when asked), except
  `PurchasingOrdersWalk` in `test/client/`, the app's one golden-path client walk in the regression suite; the Mantle and
  PASS specs are their components' regression and acceptance specs:

| Scenario | Phase | Covered by (checked in P17) |
| --- | --- | --- |
| Variant to supplier pack price, request and RFQ, split award, PO, partial receipt and inspection, split bill, payment | P2 (the pack price), P10–P12 (request, RFQ, award), P3 (the PO), P5, P6; payment is Accounting's P8 | mr-mantle PurchaseRequests, Sourcing, SourcingAwards, PurchaseReceipts, PurchaseBills; BOSS PurchasingSuppliersWalk (the price), PurchasingRequestsWalk, PurchasingSourcingWalk, PurchasingAwardWalk (one group blocked by name, the other placed), PurchasingReceivingWalk (8 of 10 into quarantine, 7 accepted, 1 rejected), PurchasingBillsWalk (only the 7 eligible, the price hold, finance releases and approves) |
| Shortage, shared buy, make and transfer plan, partial production, stock and GL | P14 (the buy conversion); make is Manufacturing's P13, transfer Warehouse's §7 | mr-mantle Replenishment, ReplenishmentRoutes, SupplyPlanning; BOSS PurchasingReplenishmentWalk (DEMAND_ALREADY_COVERED for a second converter); the make side Manufacturing's ManufacturingAccessWalk and ManufacturingPlanningWalk |
| Sales reservation, pick shortfall, alternate buy, pack, ship and invoice | P14 (the customer demand and the reservation offer); P7 (a drop-ship alternative) | mr-mantle ReplenishmentRoutes, DropShip; BOSS PurchasingReplenishmentRoutesWalk (a customer-order shortage bought and reserved on receipt; the drop-ship route), PurchasingDropShipWalk |
| Customer case, RMA, disposition, supplier return and credit or replacement | P8; the customer side is §7 | mr-mantle PurchaseReturns, WarehouseReturns; BOSS PurchasingReturnsWalk (the rejected unit returned, credited for the billed unit only, a replacement order with its expected receipt) |
| Count with an intervening movement | Warehouse's P10; Purchasing reads posted availability (P14) | Warehouse's WarehouseCountsWalk and mr-mantle WarehouseCounts; BOSS PurchasingReplenishmentWalk reads InventoryAvailability's posted stock |
| Case intake to resolution | Customer Service's; supplier follow-ups link Requests and WorkItems (P15) | Customer Service's (not built); BOSS PurchasingRequestsWalk (a linked work item completes, the request stays In Progress) |
| Cancellation, failed inspection and substitution | P3 (cancel remainder), P5 (failed inspection), P11 and P16 (a cancelled RFQ revokes), P12 (substitutes) | mr-mantle PurchaseOrders (close remainder), PurchaseReceipts, SourcingAwards (substitutes), SupplierPortal (revoked links); BOSS PurchasingOrdersWalk (close remainder with its reason), PurchasingReceivingWalk (the rejected unit held), PurchasingAwardWalk |
| Closed period, unauthorized action and standalone use | P6 (a bill correction through Accounting); `PurchasingAccess` for each access rule a phase adds; P17 | BOSS PurchasingAccess (regression), PurchasingFoundationWalk, PurchasingAccessWalk (P17: isolation by URL, shared mount, export, print, palette, link, choice, search and the Supplier app; cost, finance and stock refused; standalone receive and match without the Warehouse or Accounting root); the closed period is Accounting's AccountingCloseWalk |
| Named independent failures, atomic inner posting | Every phase: P4 (bulk approvals), P7 (drop-ship lines), P9 (reminders), P10 (supplier groups), P11 (invitations), P15 (evaluations) | BOSS PurchasingApprovalsWalk (a stale order named, two approved), PurchasingRevisionsWalk (a bad address named, two sent), PurchasingRequestsWalk (MISSING_SUPPLIER named, the others made), PurchasingSourcingWalk (a bad address named), PurchasingAwardWalk; mr-mantle SupplierScorecards (evaluations) |
| Drop-ship order to customer invoice and supplier bill (design §18) | P7 | mr-mantle DropShip; BOSS PurchasingDropShipWalk |
| A revision and its as-of print (§2) | P9; P11 (the RFQ), P13 (the agreement) | mr-mantle PurchaseRevisions, Sourcing, PurchaseAgreements; BOSS PurchasingRevisionsWalk, PurchasingSourcingWalk, PurchasingAgreementsWalk |
| The supplier pages (design §13) | P16 | mr-mantle SupplierPortal; mr-pass SupplierPages, acceptance client SupplierPortalHttp and RemoteHttp |

- **Walks.** One golden-path client walk for the app in the regression suite; the others, and the Supplier app's
  pages at phone and desktop widths in mr-pass, are acceptance tests. No screenshots.
