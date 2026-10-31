# IronStone BOSS — Accounting implementation

P0–P5 are built and reviewed (R for P0–P3, R2 for P4–P5, with its rework). Work is paused before P6. P6–P21
remain planned. The delivery log is below; the contracts are in
[AccountingImplementation](../docs/AccountingImplementation.md).

How [design-accounting.md](design-accounting.md) gets built, in phases from the foundation to base-currency
posting, each ending tested and usable. This file is kept at a high level, as [impl-products.md](impl-products.md)
and [impl-projects.md](impl-projects.md) are: each phase names its scope by the design's sections and §18 needs
rather than restating them, and the design stays the place for screen and record detail. During the build this
file is the log: phase status and what each built, the decisions made, open questions, findings against the
code, and what is deferred.

Before P0, `screen/Accounting/` held nine placeholders and its root grant was inactive. P0–P3 now provide the
scoped shell and minimal document routes, guarded ledger, reports and settings. Products' existing costing and
revaluation contracts remain the integration baseline. Full document workflows and shared customer/supplier
screens follow in their later phases.

**Inputs.**
- Designs:
  - [design-accounting.md](design-accounting.md)
  - [design-crosscut.md](design-crosscut.md) §1.3 (the automation register), §1.4, §2, §3.2, §3.3, §3.5,
    §3.6, §3.8, §3.10, §3.15, §3.16, §3.18, §3.22, §3.25, §4.4, §5 and §7.1
  - [design-purchasing.md](design-purchasing.md): PUR-SUPPLIER (SupplierProfile) and PUR-MATCH
  - [design-warehouse.md](design-warehouse.md): ReturnReceipt and WH-RETURN (`receive#ReturnItems`)
  - [design-customer-service.md](design-customer-service.md): Returns, for the return-approval rule
  - [design-products.md](design-products.md): PRD-COST, with [impl-products.md](impl-products.md) P9, which
    builds Accounting's revaluation contract
  - [design-projects.md](design-projects.md) §10 Billing
  - [design-manufacturing.md](design-manufacturing.md): ProductionCosts and M8, for §7
  - `mr-pass/plan/design-forum.md` §1, §4, §5 and §13.1: PASS's shell, app mounts, authority boundary, request
    contract, identity and invitations, for P18's apps; with `mr-pass/plan/implementation-forum.md` and
    `mr-pass/docs/Deployment.md`
- The design review: [review-core-apps.md](review-core-apps.md) (D1–D28 and the §4 step owners) and
  [review-core-apps/accounting.md](review-core-apps/accounting.md), which explain the design's D- and R- IDs.
- Guides and rules: [design-doc-guide.md](design-doc-guide.md), [style-guide.md](style-guide.md) §8, and
  [impl-drawers-commons.md](impl-drawers-commons.md) §4 (the shared rules).
- [impl-products.md](impl-products.md): the pattern; its decisions on other apps' contracts and shared contexts;
  the groups its P1 seeds (`BOSS_ACCOUNTING_GL`); and the BOSS client walks it adds (its F23).
- [impl-projects.md](impl-projects.md): InvoiceDetail, OrderDetail and the billing services, and its findings
  that recur here (F91, F131).
- Inventories: [ss-inventory.md](ss-inventory.md) and [usl-inventory.md](usl-inventory.md).
- mr-moqui: `plans/Remaining-Work.md` and `docs/Build-Test.md`.

Framework paths are under the mr-moqui checkout (`crates/`, `runtime/base-component/`), Mantle paths under
`runtime/component/mr-mantle/`, PASS paths under `runtime/component/mr-pass/`.

Sections: [1 scope](#1-scope-and-order) · [2 rules](#2-ground-rules) · [3 phases](#3-phases) ·
[4 decisions](#4-decisions) · [5 open](#5-open-questions) · [6 findings](#6-findings) · [7 later](#7-later) ·
[8 verification](#8-verification)

---

## 1. Scope and order

**Current execution boundary (Oct 30, 2026):** P4–P5 reviewed and reworked on Mantle's services (R2), then a pause
before P6. The later phase definitions remain the plan for a future continuation.

- **Repositories.** Each is its own git repo:
  - `mr-moqui` (`crates/`, `runtime/base-component`)
  - `runtime/component/mr-mantle`
  - `runtime/component/mr-boss`, the internal app
  - `runtime/component/mr-pass`, the customer and supplier pages as PASS apps (P18; §4)

  `runtime/component/mr-marble` is read only, for the baseline Accounting, Asset and Party screens that design
  §16.1 maps.
- **Scope.**
  - Every `parity` and `new` row of design §2, and the §18 needs they use: AC-01 to AC-14 and AC-18 to AC-22,
    with the first-release parts of AC-16 (dated rates) and AC-20 (transfers and deposits).
  - The parts of other apps' needs that Accounting depends on (§4):
    - crosscut CX-ORDER-HOLD: `OrderHoldReason`, `hold#Order` and `release#OrderHold`;
    - crosscut CX-PORTALS: `ExternalAccessServices`, and two PASS apps in mr-pass, Billing for customers and
      Supplier for suppliers, in place of the ServicePortal and SupplierPortal roots, with Accounting's pages only;
    - Purchasing's SupplierProfile, its finance fields only;
    - Warehouse's `receive#ReturnItems`;
    - crosscut CX-AUTOMATION: the Mantle rule changes of design §1.4.
  - The shared screens no app has built, with the Accounting context only: Customer360, ShipmentDetail,
    EquipmentDetail, ReturnDetail and InvoiceMatch. Accounting's context on Projects' InvoiceDetail and
    OrderDetail, and on Products' Product360, Supplier360 and InventoryValuation.
  - §7 holds the `later` rows and needs, ProductionCostClose and CostingPolicies, and the rest of the other
    apps' needs.
- **Order** (decided Oct 28, 2026):
  1. the foundation;
  2. the ledger and its posting guard;
  3. settings;
  4. receivables;
  5. payments and settlement;
  6. payables: bill intake, holds and approval;
  7. matching;
  8. payment runs;
  9. banking;
  10. collections, credit and recurring invoices;
  11. period close;
  12. fixed assets;
  13. inventory valuation and landed costs;
  14. tax;
  15. budgets;
  16. reports;
  17. returns and order changes;
  18. portals, as PASS apps;
  19. setup and activation;
  20. base-currency posting;
  21. the finish.

  A report that a phase's walk needs comes with that phase: TrialBalance and GeneralLedger with the ledger,
  Aging with collections, InvoiceReconciliation with close, StockTransactions with valuation, and
  BudgetVariance with budgets.

## 2. Ground rules

- **The Commons rules hold.** These are impl-drawers-commons §4:
  - failure tolerance;
  - the Mantle-free framework;
  - Mantle stands without BOSS: no Mantle code or spec calls `ironstone.*`, reads BOSS or names a BOSS group;
  - business logic leans to Mantle;
  - the new XML element checklist of style-guide §8.1;
  - libraries through `libs/refresh.mjs`, and crates against `deny.toml`;
  - the `.qvue` gallery pattern;
  - parties by role;
  - changes by effective date and the audit log;
  - demo data;
  - builds and commits.

  The walks are BOSS `test/client` specs, as Products' are (impl-products §2). No spec takes screenshots; a walk
  asserts what a page shows.
- **Use Mantle first.** Before adding a service, entity or guard, find the Mantle service that already does it and use
  it, or extend it with a parameter: payments through `create#`/`update#Payment` and `post#Payment`, so their SECAs
  run; applications through the `apply#*` services; refunds through `create#RefundPayment`; gateway operations through
  the `*#SinglePayment` services and their gateway interfaces; invoice print, email, statements and credit memos through
  `get#InvoicePrintInfo`, an `EmailTemplate`, `get#ReceivableStatementInfo` and `create#InvoiceCreditMemo`. Add beside
  Mantle only what it lacks (docs/dev/Practices-App-Dev.md §3; F115).
- **Financial writes through Mantle services.** Every invoice, payment, settlement, stock-value and period
  mutation is a Mantle service that checks its permission, the organization, status, balance, lock date and
  operation key (design §1.1). An Accounting screen or mount calls it after `ironstone.accounting.AccessServices`
  has checked the capability group and the organization. No same-named `ironstone` pass-through is built, and
  other apps call the Mantle name.
  - A Mantle service checks its Moqui permission through Products P9's `ProductAccess.js` `has()`, and the
    organization by party relationship (`get#PartyOrganizationInfo`), never a BOSS group. BOSS grants the
    permissions to its groups (P1). A permission check goes on a new Mantle service only.
  - An `ironstone.accounting` service keeps only the capability check, a screen's reads, shapes and saved views,
    the settings forms, and the call to Mantle.
  - `entity` in a design form summary means an access-checked read or a configuration-record write, never raw
    financial state (design §1.3).
  - Permissions are checked in the Mantle services and capabilities in AccessServices, so they hold for imports,
    exports, search, the palette and shared mounts. Mantle's existing ledger and report services check no access
    (F6), and several accounting records have no entity filter (F5), so no Accounting screen calls them without
    AccessServices first, and P16's report runs add the checks in Mantle.
- **One posting choke point.** The AC-06 guard runs inside Mantle `post#AcctgTrans` (P2), so direct posting,
  every auto-post SECA and each Accounting posting service, all of them Mantle's, pass it (F9). The
  `BOSS_ACCOUNTING_*` groups get no artifact authorization for `unpost#AcctgTrans`, `update#AcctgTransPosted`, the
  `repost#*` services or the Mantle REST mutators (F11). Only the finance-admin data-repair actions reach a raw
  rewrite (design §1.1, §19).
- **Preview, then post.** A preview answers a version. The post takes that version and an operation key,
  re-reads under lock and refuses a stale preview; a retry with the same key answers the first result (design
  §18.1; F8). Both are one Mantle service pair, keyed on the CX-POSTING record (§4; F47); a payment's review is a
  `PaymentReview` row holding its operation key and result (R2). One financial transaction, application set,
  transfer or document-and-ledger posting is atomic; a bulk selection names each failure and goes on.
- **Restricted values stay on the server.** Bank and card numbers are masked and gateway secrets stay Admin's.
  An inaccessible account contributes no names or amounts, and a failed aggregate is unavailable, never zero
  (design §3).
- **Base-currency posting (P20).** Mantle converted no currency (F19), so P4–P19 refused documents in another currency
  (D18). From P20 every posting converts to the organization's base currency at its document's rate and an application
  books the realized difference; the refusal and its readiness row are gone.
- **Shared screens.** Accounting builds these with the Accounting context only:
  - `Shared/Customer360`, `Shared/ShipmentDetail`, `Shared/EquipmentDetail`, `Shared/ReturnDetail` and
    `Shared/InvoiceMatch`.

  InvoicePay and SupplierBillUpload are not BOSS screens: they are pages of PASS apps (below).

  It adds its context to `Shared/InvoiceDetail` and `Shared/OrderDetail`, and to Products' `Shared/Product360`,
  `Shared/Supplier360` and `Shared/InventoryValuation` (F4). Each takes `appRoot` and server-derived
  capabilities, on `Shared/RequestDetail`'s pattern (F2).
- **Public pages in mr-pass, internal ones in mr-boss** (§4). The customer and supplier pages are PASS apps, on
  PASS's foundation (design-forum §1, §4, §5), as impl-customer-service §2 sets out for its Support app:
  - PASS's public shell with host and app-mount routing; server-rendered HTML with qvue enhancement, at 390 px and
    on the desktop; no terminal UI, which PASS does not have yet.
  - Public accounts hold only `ALL_USERS`. A customer or supplier contact reaches its records through Mantle's checks
    of its relationship and of `ExternalAccessCapability`, never a UserGroup, so there is no `BOSS_SERVICE_PORTAL` or
    `BOSS_SUPPLIER_PORTAL`.
  - Pages call the authority only through `pass.Facade.call#Operation`: an operation in PASS's `Schema.js`, its route
    in `Routes.js`, served to a remote frontend by Mantle's PassApi. So every service a page calls is Mantle's, and
    what it calls is Mantle's too; no `ironstone.*` service, BOSS screen or BOSS group.
  - PASS's request contract (design-forum §4.3), and its media staging and scanning for uploads.
  - A bearer link is a page of the app that takes its token, as PASS's Unsubscribe does, checked by
    `check#AccessToken`; no `<token-route>` in BOSS's `MoquiConf.xml`.
- **Owner contracts.** A contract built here for another app follows that app's design: its package, its record
  and service names, its Shared screen, and the permissions its Mantle services check. A change found while
  building it is written into the owner's design. The owner's own screens stay with the owner.
- **A new control is the one behavior.** Each CX-AUTOMATION change, and each new refusal in an existing Mantle
  service, is how Mantle behaves from then on, with a test of its condition (crosscut §7.1). Only a control that would
  break Mantle's flow specs (F27) stays behind a flag, off by default, listed in §4 with the reason; today that is
  `postingGuardEnabled` (R2).
- **Existing callers stay compatible.**
  - Mantle's specs pass unchanged, including the flow specs' SECA invoices, return responses and posted
    amounts (F27).
  - Projects' Billing passes unchanged: the Billing, BillingWalk, ClientBilling and MilestoneBillingWalk specs.
    Projects' `update#InvoiceStatus` calls `mantle.account.InvoiceServices.change#InvoiceState` (D6), and its
    `send#Invoice` calls that file's `send#Invoice` (F2).
- **Done for a phase** means all of these:
  - impl-projects §2 "Done":
    - cargo tests for the touched crates, with goldens reviewed;
    - the new Mantle specs passing under `./moq test mr-mantle` without mr-boss, their users in spec-local groups
      holding the permissions;
    - `./moq test mr-boss` passing, with AppStructure covering the new screens and Accounting in its
      non-placeholder list (F3);
    - `moqui lint --screens` clean for BOSS with the Debug binary;
    - the `test/client` walks passing;
    - the inventories' **Implemented in** columns;
  - the `AccountingAccess` spec extended to the phase's services and mounts;
  - for P18: `./moq test mr-pass mr-mantle mr-boss` with the apps' specs, the remote pair on PASS's RemoteFixtures
    pattern, `moqui test-client mr-pass --serve` on ForumHttp's and RemoteHttp's pattern, with the phone-width
    overflow checks at 390 px, and lint clean for PASS;
  - the phase's walk in §8;
  - its row and **Built** note here.

## 3. Phases

| Phase | Repos | Screens | Status |
| --- | --- | --- | --- |
| P0 Checks | all (read) | — | checked Oct 29 (§6 F48–F55); access regressions accompany P1 |
| P1 Foundation | Mantle, BOSS | root/menu, Home, minimal invoice/bill/payment lists and read-only details, draft quick create | built Oct 29; see build record below |
| P2 Ledger and posting guard | Mantle, BOSS | ChartOfAccounts, AccountDetail, JournalEntries, JournalEntryDetail, TransactionEntries, JournalBatches, JournalTemplates, Periods, PeriodLocks, TrialBalance, GeneralLedger | built Oct 29; see build record below |
| P3 Settings | Mantle, BOSS | Settings, AccountingPreferences, PostingDefaults, PaymentTerms, Currencies, PaymentMethods, DocumentSettings | built Oct 29; see build record below |
| P4 Receivables | Mantle, BOSS | Invoices, InvoiceDetail, BillingQueue, Statements, Customer360 | built Oct 29, reviewed and reworked Oct 30; see R2 |
| P5 Payments and settlement | Mantle, BOSS | Payments, PaymentDetail, GatewayTransactions, ReceivablesWorkbench | built Oct 29–30, reviewed and reworked Oct 30; see R2 |
| P6 Payables | Mantle, BOSS | Bills, BillDetail, ExpensePosting, Supplier360, OrderDetail, ShipmentDetail, Approvals | built Oct 31; see build record below |
| P7 Matching | Mantle, BOSS | InvoiceMatch, MatchPolicies | built Oct 31; see build record below |
| P8 Payment runs | Mantle, BOSS | PayablesWorkbench, PaymentRuns, PaymentRunDetail | built Oct 31; see build record below |
| P9 Banking | Mantle, BOSS | BankAccounts, BankAccountDetail, StatementImport, Reconciliations, ReconciliationDetail, UnmatchedTransactions, BankRules, FinancialAccounts, FinancialAccountDetail | built Oct 31; see build record below |
| P10 Collections, credit and recurring | Mantle, BOSS | Collections, Dunning, CollectionPolicies, RecurringInvoices, Aging | built Oct 31; see build record below |
| P11 Period close | Mantle, BOSS | PeriodCloseDetail, PeriodRuns, InvoiceReconciliation | built Oct 31, reviewed and fixed; the stock and WIP tie-out is partial (stock movements that posted nothing, open WIP on kit and repack work; the rest with P7, P13 and Manufacturing); see build record below |
| P12 Fixed assets | Mantle, BOSS | FixedAssets, EquipmentDetail, AssetClasses, DepreciationRunDetail | built Oct 31; a posted depreciation run is not reversed (reverse a book event); see build record below |
| P13 Valuation and landed costs | Mantle, BOSS | InventoryValuation, LandedCosts, Product360, StockTransactions | built Oct 31; see build record below |
| P14 Tax | Mantle, BOSS | TaxAuthorities, TaxRates, TaxStatements, TaxStatementDetail | built Oct 31; see build record below |
| P15 Budgets | Mantle, BOSS | Budgets, BudgetDetail, BudgetControls, BudgetVariance | built Oct 31; see build record below |
| P16 Reports | Mantle, BOSS | Reports, BalanceSheet, IncomeStatement, CashFlow, RetainedEarnings, FinancialRatios, PartnerLedger, AccountBalance, PostedSummary, SalesAnalysis | built Oct 31; Home complete but production runs awaiting cost close (Manufacturing); see build record below |
| P17 Returns and order changes | Mantle, BOSS | ReturnDetail | built Oct 31; see build record below |
| P18 Portals | Mantle, mr-pass, BOSS | the PASS apps Billing, with InvoicePay, and Supplier, with BillUpload | built Oct 31; see build record below |
| P19 Setup and activation | Mantle, BOSS | Setup (Basis, OpeningBalances, OpenItems, Readiness, Activate) | built Oct 31; see build record below |
| P20 Base-currency posting | Mantle, BOSS | Currencies (Fetch rates, proposed rates) | built Oct 31; see build record below |
| P21 Finish | BOSS | — | — |

### P0 — Checks

Verify the design's riskiest assumptions against the code before building. Each result is a row in §6 and,
where it changes the design, an edit there. F1–F46 were found on Oct 28 while writing this plan; the design
edits that F17, F25, F27 and F40 call for, and those of §4's decisions in design-accounting and crosscut (among
them InvoicePay and SupplierBillUpload, and the audience roots of crosscut §2, §5 and D5 with their groups in §1.4),
were made in the Oct 28 design sweep. The Billing and Supplier apps in design-forum §1 and §13 are added when P0
closes. Completed checks (findings F48–F60; verification below):

- **REST.** Which Mantle REST mutators reach invoices, payments and accounting transactions, and what the BOSS
  groups would reach through them (F6, F11).
- **Palette documents.** Whether Mantle has search documents for invoices, payments, GL accounts and journal
  entries for the palette types, or P1 adds them.
- **Inspection quantity.** What "open inspection" reads before CX-QUALITY exists (D21).
- **A gateway for InvoicePay.** Mantle's `TEST_APPROVE` gateway always approves; InvoicePay's pending and
  declined paths need a test gateway that can answer them.
- **PASS for its first apps beyond Forum** (§4). How an app registers: its `PublicSiteApp` mount and target,
  navigation, readiness and operator configuration; the facade's operation and route catalogues and Mantle's PassApi
  route table; PASS invitations with organization grants; media staging finalized into a record's content; and the
  URLs Mantle builds for a site's pages (impl-customer-service F43). Also `Pass.xml`'s content security policy
  (`form-action 'self'`, `frame-ancestors 'none'`) against the gateway's hosted page or redirect, and PASS's
  local-return-path rule for the gateway's return.
- **Products' state.** Which of Products P2, P6 and P9 are built when P6 and P13 start.

### P1 — Foundation

- **AC-01, access.**
  - The groups of design §1.1, with `BOSS_ACCOUNTING_MATCH` (crosscut §1.4), `BOSS_ACCOUNTING` as the root
    user group and `BOSS_ACCOUNTING_ADMIN` as the admin group (§4). `BOSS_ACCOUNTING_GL` exists from Products P1.
  - The root's authz comes out of BossSetupData's commented block (F1), with the organization filters of
    impl-drawers-commons §4: `MANTLE_USER_ORG` for the groups, `MANTLE_ACTIVE_ORG` for the admin group (F5).
  - `ironstone.accounting.AccessServices`: the user's organizations and capabilities. Every Accounting screen and
    shared mount calls it before the Mantle service, and a supplied organization or record is checked against it.
  - **Permissions** (§2, §4): Mantle seeds Accounting's `UserPermission` rows beside `ORDER_APPROVE` in
    `MantleSetupData.xml`, and BossSetupData grants them with `UserGroupPermission` rows. `BOSS_ACCOUNTING_ADMIN`
    holds every one below, and alone holds `ACCOUNTING_ADMIN` and `FISCAL_REOPEN`. No group gets `GL_POST_CLOSED`
    (F9).
    - `BOSS_ACCOUNTING_AR`: `RECEIVABLE_EDIT`, `CUSTOMER_CREDIT_VIEW`;
    - `BOSS_ACCOUNTING_AP`: `PAYABLE_EDIT`, `PAYABLE_IMPORT`, `INVOICE_HOLD`, `INVOICE_MATCH`, `SUPPLIER_TERMS_EDIT`;
    - `BOSS_ACCOUNTING_MATCH`: `INVOICE_MATCH`;
    - `BOSS_ACCOUNTING_TREASURY`: `PAYMENT_EDIT`, `BANK_RECONCILE`;
    - `BOSS_ACCOUNTING_GL`: `BUDGET_EDIT`, beside Products' `ACCOUNTING_VIEW`, `ACCOUNTING_GL_POST` and
      `PRODUCT_COST_VIEW`;
    - `BOSS_ACCOUNTING_TAX`: `TAX_STATEMENT_EDIT`;
    - `BOSS_ACCOUNTING_READ`: `CUSTOMER_CREDIT_VIEW`, beside Products' `ACCOUNTING_VIEW` and `PRODUCT_COST_VIEW`;
    - `BOSS_ACCOUNTING_APPROVE`: `ACCOUNTING_VIEW`, `INVOICE_APPROVE`, `INVOICE_HOLD_RELEASE`,
      `PAYMENT_RUN_APPROVE`, `FISCAL_CLOSE`, `CREDIT_HOLD_RELEASE`, `BUDGET_OVERRIDE`, `RETURN_CREDIT_APPROVE`,
      `PRODUCTION_COST_POST`;
    - Projects' `BOSS_PROJECT_MANAGER`: `RECEIVABLE_EDIT`, since its Billing calls `change#InvoiceState` and
      `send#Invoice` (§2).
  - No artifact authorization for the restricted services of §2, or for the Mantle REST ledger paths (F6).
- **The Accounting root.**
  - The menu of design §1.2: the placeholders renamed, and Payments, PeriodClose, FixedAssets, Inventory,
    Records and Approvals added (F1). Each area shows for its groups only.
  - `<shell-providers>`: palette types and sources for invoices, payments, parties, accounts and journal
    entries, and quick create of an invoice, bill, payment or draft journal entry, each checking its group.
    Today and the notification topics grow phase by phase (AC-18).
  - The `accounting` key scope.
  - `ironstone.commons.PaletteServices.get#RecordLink` opens invoices, payments and journal entries under
    Accounting.
- **Home** (design §3): AccountingSummary and MoneyCards over `ironstone.accounting.HomeServices.get#Summary`,
  with the counts of later phases null, and MyFinanceWork with no sources yet.
- **Accounting demo data.**
  - `BossZAccountingDemoData.xml` uses the demo's own organization, `BOSS_ACCT_ORG` (defined in
    `BossAccountingUsersDemoData.xml` with Mantle's default accounting configuration), outside the Ziziwork rollup,
    so its adopted controls do not reach Mantle's demo flows (F7). Mantle seeds no accounting transactions, so a demo service runs the
    invoices, payments and postings the phases need, as Projects' demo services do.
  - `BossUsersDemoData.xml` gains a user per group (AR, AP, treasury, GL, tax, reader, approver and admin), and a
    report reader with no other launcher.
- **Specs.**
  - `AccountingShell`: the menu per group, the palette, record links, quick create.
  - `AccountingAccess`: started, covering organization scope and groups through AccessServices, and the
    permissions through the Mantle services.
- **Usable when:** the menu renders for each group, and quick create offers only what the group may create. A
  report reader sees their organization's invoices, payments and accounts but not another organization's, in
  lists, the palette and record links.

### P2 — Ledger and posting guard

Built in two parts: P2a the guard and the core screens, then P2b batches, templates, dimensions and attachments.

- **P2a.**
  - **AC-06, the guard,** inside `mantle.ledger.LedgerServices.post#AcctgTrans`, beside its period check (F9):
    - proposed `mantle.ledger.config.AccountingLock` (typed lock-through dates) and `AccountingLockException`
      (soft and expiring; never relaxing a hard lock or `TimePeriod.isClosed`);
    - the organization, and the operation identity;
    - `verifyOnly` made free of side effects (F9);
    - `mantle.ledger.CloseServices.store#Lock` and `grant#Exception` (`ACCOUNTING_ADMIN`).
  - **Mantle ledger fixes** (each keeping Mantle's default):
    - `repost#AssetIssuance` posts a dated reversing delta in an open period instead of unposting and deleting
      (R-SA-02; design §1.4's `AssetIssuanceGlRePost` row; F11);
    - `post#ReverseAcctgTrans` takes a reversal date, and marks the original reversed only when the reversal
      posts (F12);
    - fiscal periods follow the organization's fiscal-year start (F13);
    - `GlAccountOrganization` gains its from and thru dates (F14).
  - **Screens** (design §8 and §9):
    - ChartOfAccounts (tree and list) and AccountDetail;
    - JournalEntries, with bulk post and a result per transaction;
    - JournalEntryDetail: balanced lines; post, and reverse with a date and reason; delete of drafts; the move
      dialog; the audit. Posted entries are read only, and the metadata correction is
      `mantle.ledger.JournalServices.update#PostedMetadata`, audited and limited, not `update#AcctgTransPosted`
      (F11);
    - TransactionEntries;
    - Periods and PeriodLocks.
  - **Reports** (design §13): TrialBalance and GeneralLedger, with the shared report options and drill-down.
    TrialBalance reads closed periods' summaries and sums open periods' posted entries (§4; F16).
- **P2b.**
  - **AC-13:** `AcctgTransTemplate` and `AcctgTransTemplateEntry`; `mantle.ledger.JournalServices`
    `store#Template`, `store#TemplateLines`, `create#FromTemplate`, `validate#Batch` and `post#Batch`, checking
    `ACCOUNTING_GL_POST`. The batch posts each transaction on its own and names each failure, in place of
    `post#GlJournal` (F17). JournalBatches and JournalTemplates.
  - **AC-22:** `AcctgTransEntry.facilityId` and `costCenterId`, AccountDetail's RequiredDimensions on
    `GlAccountOrganization`, and the posting refusal of an entry missing a required dimension (F15). The
    source-line fields and their copy come in P6.
  - **AC-21:** `AcctgTransContent`, registered in `get#RecordLinkInfo`, for JournalEntryDetail's Files.
- **Usable when** (design §16.3 bank-to-close, its closed-period part):
  - a GL user creates, balances and posts a manual entry, then reverses it on a later date with a reason, and
    the posted entry stays read only;
  - a backdated posting into a locked or closed period is refused by a direct post, and an auto-post SECA's
    goes to the error journal with the lock named, while a soft exception lets one named user post one scope until
    it expires;
  - a batch with one unbalanced entry posts the others and names the failure.

### P3 — Settings

- **Screens** (design §15):
  - Settings: the index, with readiness;
  - AccountingPreferences, with ClonePreferences' conflict preview (`mantle.ledger.SetupServices.clone#Preferences`,
    `ACCOUNTING_ADMIN`). The COGS method is shown for what it is: Mantle posts actual cost whatever it says (F40);
  - PostingDefaults: the mappings by kind, `ProductGlAccount` and `ProductCategoryGlAccount` among them, and
    the missing-mapping queue over `get#DefaultGlAccountByType`, which also lists the transactions sent to the
    error journal for a missing account (F10). The type defaults include the revaluation offset type
    `GatInventoryRevaluation` that Products P9 seeds, mapped for the demo organization (§4; F47);
  - PaymentTerms: due terms, and from P8 the term lines (§4);
  - Currencies: currency units and dated rates, the only writer of either (D17; Products Units excludes them;
    F20);
  - PaymentMethods: masked methods and gateway bindings; secrets stay Admin's;
  - DocumentSettings: numbering, kept on `PartyAcctgPreference` where Mantle reads it, and templates, with the
    preview of `ironstone.accounting.DocumentServices`.
- **Usable when:** a finance admin sets an organization's preferences, maps an invoice item type that
  PostingDefaults listed as missing, and adds a dated rate and a due term. A GL user who is not an admin is
  refused each.

### P4 — Receivables

- **AC-02, the invoice controls.**
  - `mantle.account.InvoiceServices.change#InvoiceState`, the one invoice state guard over Mantle's status
    flow (F18): status, period, posting, hold (D6), and the single-currency refusal (D18). It checks
    `RECEIVABLE_EDIT` or `PAYABLE_EDIT` by side, and `INVOICE_APPROVE` for approval. Projects'
    `update#InvoiceStatus` calls it, so project invoices are refused too (F46).
  - `send#Invoice`, with or without a store: it renders the invoice as sent and its attachments, stores the PDF as the
    invoice's content stamped with its time (impl-drawers-commons §4), sends through an `EmailTemplate` and records
    the outcome as its EmailMessage rows (F21; R2). Projects' `send#Invoice` calls it (F2). The InvoicePay link is
    added in P18.
  - `InvoiceFinalizedSendEmail` skips a version `send#Invoice` has sent (CX-AUTOMATION).
  - `process#InvoiceBatch`, and the duplicate-source guard. It and `send#Invoice` check `RECEIVABLE_EDIT`.
- **Screens** (design §4):
  - Invoices, with CreateReceivable and InvoiceBatch;
  - InvoiceDetail: `Shared/InvoiceDetail` with the receivables context (F2) and the tabs of design §4. Its
    credit memo is linked to the invoice and applied through `apply#InvoiceToInvoice` (F22). Projects' context
    and client view are unchanged;
  - BillingQueue, over Projects' approved time;
  - Statements, over `get#ReceivableStatementInfo`, grouped by currency (F19), and sent through
    `mantle.account.CollectionServices.send#Statements` (`RECEIVABLE_EDIT`);
  - Customer360: `Shared/Customer360` (crosscut §3.2) with the Accounting context, its Contact, Orders,
    Invoices/payments and Agreements tabs, and the PaymentDetails, PartyIdentifications and TaxRegistrations
    forms (D26), finance-gated and masked. Credit and Activities come in P10.
- **Outputs:** the invoice and credit memo print, shared with Projects' (F2); the customer statement.
- **Usable when** (§16.3 invoice-to-cash, its first part):
  - an AR user creates, finalizes and sends a customer invoice without a store, and its email outcome is
    recorded;
  - a store invoice is not sent twice;
  - a batch send with one bad address names it and sends the rest;
  - an invoice in a foreign currency cannot be finalized;
  - a project invoice approved and sent from Projects behaves as before.

### P5 — Payments and settlement

- **AC-02, settlement.**
  - `mantle.account.PaymentServices.find#OpenItems` and `apply#Settlement` (`RECEIVABLE_EDIT` or `PAYABLE_EDIT` by
    side): a preview, then one atomic application set per party and currency, under the operation key (F8). A
    discount or write-off is a posted adjustment to an explicit account, not Mantle's write-off status (F23).
  - `PaymentServices.autoApply#Payment`, an empty stub today (F24), implemented over the same `find#OpenItems`.
  - `PaymentServices.change#PaymentState`, the guarded payment status transition (validate, deliver, void;
    `PAYMENT_EDIT`), with the PaymentValidation topic.
- **AC-20, transfers:** the `PtInternalTransfer` payment type (F31), its cash-in-transit `PaymentTypeGlAccount`,
  and `PaymentServices.create#InternalTransfer` (`PAYMENT_EDIT`): one payment from the organization to itself, whose
  `post#Payment` posts both sides through transit, and a fee as its own payment, all or nothing (R2).
- **Screens** (design §6 and §4):
  - Payments, with its tabs, NewPayment and InternalTransfer;
  - PaymentDetail: applications, gateway actions, refunds linked to the original, evidence, and the payment
    date under the lock;
  - GatewayTransactions;
  - ReceivablesWorkbench.
- **Usable when** (§16.3 invoice-to-cash, settlement; access):
  - a partial receipt and an available credit apply to an invoice in one confirmed set, and a retry applies
    nothing twice;
  - a write-off without an account is refused;
  - a transfer between two bank accounts posts both legs through transit, or neither;
  - an AR-only user cannot capture a gateway payment or read bank numbers.

### P6 — Payables

- **Purchasing's contract** (§4, PUR-SUPPLIER; F29):
  - `mantle.party.supplier.SupplierProfile`, effective-dated by organization and supplier (`fromDate`, `thruDate`),
    with `settlementTermId` and `selfBillingIndicator` only, both audit-logged (impl-drawers-commons §4);
  - the finance fields of `mantle.party.SupplierServices.store#SupplierProfile`, which need `SUPPLIER_TERMS_EDIT`
    (its buyer fields need Purchasing's `SUPPLIER_PROFILE_EDIT`).

  The rest of the profile stays Purchasing's.
- **AC-02, bill intake** (D2):
  - `mantle.account.InvoiceServices.import#Bill`, keyed by organization, supplier and supplier reference, or by
    shipment for a self-billed draft. A repeat is refused, naming the earlier bill. It needs `PAYABLE_IMPORT`: it
    takes an upload from AP intake, and from a Purchasing buyer (`BOSS_PURCHASING_BUYER`, seeded with Manufacturing
    P14, which grants it the permission) for a bill on a PO of an organization the buyer belongs to (§4);
    Purchasing's Bills mounts it in its P6;
  - `create#InvoiceFromSource` (`PAYABLE_EDIT`), on the ordered or the accepted received basis, applying order
    payments; from the InvoiceFromSource dialog of OrderDetail and ShipmentDetail;
  - `approve#Payable` (`INVOICE_APPROVE`);
  - the due-date rule takes SupplierProfile's term for a bill, after the agreement's and before
    PartyAcctgPreference's (R-ACC-16; F28).
- **AC-03, holds:**
  - `mantle.account.invoice.InvoiceHold` and its seeded reasons;
  - `mantle.account.InvoiceServices` `hold#Invoice` (`INVOICE_HOLD`), `release#InvoiceHold`
    (`INVOICE_HOLD_RELEASE`, never by the placer) and `request#HoldRelease` (`PAYABLE_EDIT`), with
    `ironstone.accounting.MatchServices.find#BillExceptions` for the screens;
  - the hold guard inside Mantle, where a payment is applied to a payable invoice, behind its flag (§4): it
    covers `apply#Settlement`, payable `create#InvoicePayment` and `apply#InvoicePayment`, and the SECAs below.
- **CX-AUTOMATION**, each change behind its flag (§4; F27):
  - `ShipmentIncomingDeliveredCreateInvoices` runs only for a self-billing supplier, and
    `create#PurchaseShipmentInvoices` takes `acceptedOnly`, which bills accepted quantity and no leftover or
    service line (F26);
  - `PaymentApplyForInvoice` and `InvoiceApplyForPayments` leave a held bill's payment unapplied, with a named
    exception.
- **AC-22, the sources:** `OrderItem.costCenterId` and `InvoiceItem.costCenterId`, copied with the facility by
  the invoice and payment auto-post services.
- **Screens** (design §5 and §14):
  - Bills: its tabs, CreatePayable, BillUpload, and HoldInvoice on a selection;
  - BillDetail: `Shared/InvoiceDetail` with the payables context. Its Match tab comes in P7;
  - ExpensePosting;
  - Supplier360: Products' `Shared/Supplier360` gains the Accounting context. Its tabs are Bills/payments and
    Agreements/terms (the SupplierProfile terms and self-billing flag). It also gains PaymentDetails, through
    `create#BankAccount` and `update#BankAccount` behind the treasury guard (F30), PartyIdentifications and
    TaxRegistrations;
  - OrderDetail: `Shared/OrderDetail` with the Accounting context (Header, Items, Invoices/payments,
    Fulfillment, History);
  - ShipmentDetail: `Shared/ShipmentDetail` (crosscut §3.8) with the Accounting context;
  - Approvals: the Commons Notifications mount, filtered by Accounting's approval topics (§4; F43), with the BillApproval and
    BillHoldRelease topics. Later phases add theirs.
- **Usable when** (§16.3 procure-to-pay, intake and holds):
  - a receipt from a supplier that is not self-billing creates no bill, and one from a self-billing supplier bills
    accepted quantity only;
  - a second upload with the same supplier reference is refused, naming the first;
  - a bill from a PO through InvoiceFromSource takes the supplier's terms;
  - a held bill cannot be approved or paid, manually or by a payment that names it;
  - the placer cannot release the hold, and an approver's release is recorded;
  - OrderProcureToPayBasicFlow passes unchanged.

### P7 — Matching

- **AC-03, the match.**
  - `InvoiceMatch`, `InvoiceMatchLine` and `InvoiceMatchPolicy`.
  - `mantle.account.InvoiceMatchServices` `evaluate#InvoiceMatch`, `apply#InvoiceMatch` (writes or updates
    `OrderItemBilling`) and `unapply#InvoiceMatch` (reverses it), checking `INVOICE_MATCH`; `store#MatchPolicy`
    (`ACCOUNTING_ADMIN`); and `queue#MatchReevaluation`, called from the AssetReceipt and InvoiceItem EECAs, with
    its background job, all in mr-mantle.
  - Quantity under open inspection is excluded as P0 settles. Service lines wait for Purchasing's acceptance
    (§7).
  - `InvoiceMatchPolicy` as effective-dated rows with their key fields audit-logged; a match line keeps the policy
    row it applied (impl-drawers-commons §4).
  - The legacy match backfill (design-purchasing §18), `InvoiceMatchServices` `preview#LegacyMatches` and
    `apply#LegacyMatches`: it links existing bill lines to orders and receipts only from unambiguous OrderItemBilling
    and AssetReceipt evidence, names each ambiguous line as a match exception and goes on, and never matches an
    unexplained balance. AP and a buyer with the match group (`INVOICE_MATCH`) run it, from MatchPolicies here and
    from Purchasing's MatchExceptions (§4).
- **Screens:** `Shared/InvoiceMatch` (crosscut §3.22) with the Accounting context, opened from BillDetail's Match
  tab; MatchPolicies.
- **Usable when** (§16.3 procure-to-pay, matching):
  - a bill against a partial accepted receipt matches within tolerance, and excess or already-billed quantity is
    refused;
  - a price outside tolerance holds the bill, naming the rule;
  - a changed receipt marks the match stale and the job re-evaluates it;
  - no hold is released automatically.

### P8 — Payment runs

- **Payment terms** (§4): `SettlementTermLine` as effective-dated rows,
  `mantle.account.InvoiceServices.store#SettlementTerm` (`ACCOUNTING_ADMIN`), and the per-invoice
  `InvoiceDueSchedule` written at issue, which aging, the workbench, runs and `apply#Settlement` read; a discount
  taken within its date posts to the discount account.
- **AC-04.**
  - `mantle.account.payment.PaymentRun` and `PaymentRunItem`.
  - `mantle.account.PaymentRunServices` `create#Run` and `select#Bills` (`PAYABLE_EDIT`), `approve#Run`
    (`PAYMENT_RUN_APPROVE`) and `execute#Run` (`PAYMENT_EDIT`), with `ironstone.accounting.PaymentRunServices.find#Runs`
    for the screens. Execution re-reads holds, bank details and the version under lock, and gives each supplier
    payment one instruction identity.
  - The PaymentRunApproval topic.
  - A supplier's bank-detail change voids a pending approval of a run that pays them (D26), through
    `PaymentRunServices.void#RunApproval`, a SECA on `update#BankAccount`. The void keys on the supplier, since
    Mantle moves a changed bank account to a new payment method (F30).
  - A bank return that declines a payment reverses its posting and unapplies it, so the bill is open again
    (F32).
- **Screens** (design §5): PayablesWorkbench, with ApplySupplierCredit; PaymentRuns; PaymentRunDetail, with
  checks, NACHA and Positive Pay through the existing services, and bank returns through `import#NachaReturn`.
  The discount columns read the due schedule.
- **Usable when** (§16.3 procure-to-pay and batch):
  - a run selects the due approved bills and excludes a held one with its reason;
  - after approval, one supplier's payment fails and the others keep their payments and file;
  - regenerating downloads the same file;
  - a bank-detail change voids the approval;
  - a NACHA return reopens the bill it paid.

### P9 — Banking

- **AC-05.**
  - `mantle.account.method.BankReconciliation`, `BankReconciliationLine`, `BankMatchRule` and `StatementImport`.
  - `mantle.account.ReconciliationServices`, checking `BANK_RECONCILE`:
    - `preview#CsvStatement`, `review#StatementImport` and `commit#StatementImport`. A line's identity is the
      bank's FIT id where the format has one (OFX), and a source-row key otherwise (BAI2, CSV; F33);
    - `create#`, `store#` and `finish#Reconciliation`, with `ironstone.accounting.BankServices.find#Reconciliations`
      for the screens;
    - `store#Rule` and `test#Rule`. Every candidate shows; a rule applies only an exact, unambiguous match (F33).
- **AC-20, deposits:** `PaymentDeposit`, `Payment.paymentDepositId` and
  `mantle.account.PaymentServices.create#DepositSlip` (`PAYMENT_EDIT`).
- **Screens** (design §7 and §15):
  - BankAccounts;
  - BankAccountDetail, whose reconcile, unreconcile and no-reconcile row actions keep parity on their own
    (R-ACC-25), with DepositSlip;
  - StatementImport: BAI2, OFX and CSV;
  - Reconciliations and ReconciliationDetail, sequential lists on terminal;
  - UnmatchedTransactions and BankRules;
  - FinancialAccounts and FinancialAccountDetail.
- **Usable when** (§16.3 bank-to-close, the bank part; batch):
  - a statement with a duplicate and a malformed row imports the rest and lists both, and the same BAI2 file
    imported twice adds nothing the second time;
  - an ambiguous rule suggests and does not apply;
  - two sessions cannot clear one line;
  - a statement with a difference cannot be finished;
  - a deposit's one bank line reconciles once.

### P10 — Collections, credit and recurring invoices

- **CX-ORDER-HOLD** (§4; F29): `mantle.order.OrderHoldReason`, and `mantle.order.OrderServices.hold#Order` and
  `release#OrderHold`. A release returns the order to Approved only when no other reason is open; nothing uses
  `OrderBeingChanged`.
- **AC-11, credit.**
  - `CustomerCreditPolicy` and `CreditHoldDecision`.
  - `mantle.account.CreditServices` `store#Policy` and `store#Defaults` (`ACCOUNTING_ADMIN`), `evaluate#OrderCredit`,
    `release#CreditHold` (`CREDIT_HOLD_RELEASE`) and `get#CustomerCreditStatus` (`CUSTOMER_CREDIT_VIEW`), the hold
    and its reason that Customer Service reads. `evaluate#OrderCredit` runs as a SECA in mr-mantle on
    `check#OrderPreApprove`, adding a warning that stops Mantle's auto-approval (F34), and in the guard of every
    BOSS approve action.
  - The CreditHoldRelease topic, and OrderDetail's hold banner.
- **AC-10, collections.**
  - `CollectionPromise`, `DunningLevel`, `DunningRun` and `DunningNotice`.
  - `mantle.account.CollectionServices` `record#Activity`, `store#Promise`, `preview#Dunning` and `send#Dunning`
    (`RECEIVABLE_EDIT`), and `store#Level` (`ACCOUNTING_ADMIN`), with
    `ironstone.accounting.CollectionServices.find#Work` for the screens.
  - `send_SalesInvoicePastDueEmails` stays paused.
- **AC-09, recurring invoices.**
  - `InvoiceSchedule` and `InvoiceScheduleOccurrence`.
  - `mantle.account.RecurringInvoiceServices` `store#Schedule` and `preview#Period`, with its ServiceJob's
    `generate#Invoices` (`RECEIVABLE_EDIT`), and `ironstone.accounting.RecurringServices.find#Schedules` for the
    screens.
  - `create_RecurringOrders` shown with its last result (D24).
- **Screens:** Collections, Dunning, CollectionPolicies and RecurringInvoices; Customer360's Credit and
  Activities tabs; the Aging report (design §13) over `mantle.ledger.LedgerReportServices.run#Aging`, as of a
  chosen date, with Mantle's aging view fixed (F36).
- **Today and notices:** collection follow-ups, credit holds, recurring-generation failures.
- **Usable when** (§16.3 invoice-to-cash, overdue and credit; batch):
  - an order over its customer's limit is held on approval, by Mantle's auto-approval and by a BOSS approve
    alike; it keeps its reservations, and a credit manager releases it with a reason;
  - a dunning run excludes a disputed invoice, and one failed recipient does not resend the rest;
  - a retried generation of a recurring schedule makes one draft;
  - Aging for a past date buckets the same on H2 as on Postgres.

### P11 — Period close

- **AC-06, close.**
  - `AccountingCloseRun`.
  - `mantle.ledger.CloseServices.get#Checklist`: unposted documents, imbalance, unmatched bank lines, AP holds,
    missing rates, the error-journal transactions (F10), the stock and WIP tie-out, and the rows of design §9
    PeriodCloseDetail.
  - `CloseServices.close#Period` (`FISCAL_CLOSE`) commits the closing entries, `close#FinancialTimePeriod` and the
    snapshot at once. Mantle's close is fixed to count only the organization's unposted transactions, and its
    closing entries to use the organization's own net-income account (F37). `reopen#Period` (`FISCAL_REOPEN`) is
    audited and keeps the old close.
- **Project cost** (§4; F45): `mantle.ledger.OtherAutoPostServices.post#WorkEffortCost`, on project timesheet
  approval behind its flag: approved project time at the entry's cost rate to project cost, from the labor clearing
  account, keyed by time entry, with a dated reversing delta when the approval is undone or the entry changes.
  Production time is left to Manufacturing (D12). The two GL account types are seeded and mapped in
  PostingDefaults.
- **The period-run contract:** `mantle.ledger.transaction.AccountingPeriodRun` and its results, with
  `mantle.ledger.PeriodRunServices.preview#Run`, and `ironstone.accounting.PeriodRunServices.find#Runs` for the
  screens. P12's depreciation is its first kind.
- **Screens:** PeriodCloseDetail and PeriodRuns; the InvoiceReconciliation report, over
  `mantle.ledger.LedgerReportServices.run#InvoiceReconciliation`.
- **Usable when** (§16.3 bank-to-close, close):
  - close is blocked by an unposted invoice and an unreconciled statement, each named and linked;
  - once they are fixed, the period closes, and another organization's open work did not block it;
  - a backdated invoice, refund and reversal are then refused alike.

### P12 — Fixed assets

- **AC-07, the books.**
  - `mantle.product.asset.FixedAssetClass`, effective-dated rows with their key fields audit-logged, beside the
    `AssetClass` enumeration it replaces as the source of defaults (F38), and the book event types of
    `AssetBookEvent`, which Products P9 made for the revaluation (F47).
  - `mantle.ledger.AssetBookServices`, which Products P9 began with the revaluation, adds:
    - `store#Class` (`ACCOUNTING_ADMIN`), with `ironstone.accounting.AssetBookServices.find#Classes` for the
      screens beside Products' `get#RevaluationContext`;
    - `capitalize#Asset`, `adjust#AssetBook`, `dispose#Asset` and `reverse#AssetBookEvent` (`ACCOUNTING_GL_POST`);
    - `preview#Depreciation`, `get#DepreciationPreview` and `post#Depreciation` (`ACCOUNTING_GL_POST`): each
      asset-period once, over the existing calculate and post services, never
      `calculateAndPost#AllFixedAssetDepreciations`. A depreciation that does not post leaves no depreciation row
      (F38).
- **Screens:**
  - FixedAssets, AssetClasses and DepreciationRunDetail;
  - EquipmentDetail: `Shared/EquipmentDetail` (crosscut §3.10) with the Accounting context: identity, the Book
    pane with its four dialogs and AcquireCostRepair (finance admin only, in an open period; F39), source and
    history.
- **Usable when** (§16.3 bank-to-close and batch):
  - an asset is capitalized from its class, then depreciated for a period with one asset failing and the rest
    posted;
  - it is adjusted, and disposed with a gain or loss, and a book event is reversed in an open period;
  - depreciation into a closed period is refused.

### P13 — Valuation and landed costs

- **InventoryValuation** (design §10): the rest of Products' `Shared/InventoryValuation`, around its P9 dialogs,
  at `Accounting/Inventory/InventoryValuation`:
  - `mantle.product.InventoryReportServices.run#InventoryValuation` over `AssetValuationSummary`, which values
    stock at each asset's current cost, set beside the inventory and WIP account balances (F40). A revaluation
    moves both by on-hand × delta, so they still agree after one;
  - ValuationExceptions: the `AtrNoAcquireCost` and `AtrNoAcctgPreference` movements, zero-cost receipts, and
    movements whose posting went to the error journal (F40);
  - CostDataRepair: finance admin, audited, in an open period (F39).

  Warehouse's mount is §7.
- **AC-07, the revaluation from Products P9** (§4; F47): the dialogs call `mantle.ledger.AssetBookServices`
  `preview#Revaluation` and `post#Revaluation` (`ACCOUNTING_GL_POST`), behind the organization's revaluation flag,
  off by default. A post changes forward cost (§4): it sets the on-hand assets' `acquireCost` from its date,
  without reposting history, and posts one AcctgTrans for on-hand × delta against the revaluation offset account
  (P3), never calling `update#ProductAcquireCost`.
- **AC-07, landed costs:** `mantle.account.invoice.LandedCostAllocation`, and `AssetBookServices.preview#LandedCost`
  and `post#LandedCost` (`ACCOUNTING_GL_POST`). The on-hand share goes to the asset's cost and the issued share to
  COGS or variance.
- **AC-07, for Manufacturing's cost close:** the GL account types `GatLaborApplied`, `GatOverheadApplied`,
  `GatOutsideProcessAccrued` and `GatProductionVariance`, and `AssetTypeGlAccount.scrapGlAccountId` (§4).
- **Scrap by reason** (impl-warehouse §4): `post#PhysicalInventoryVariance` reads the organization's
  `VarianceReasonGlAccount` row for the variance reason, then for a scrap reason the asset type's
  `scrapGlAccountId`, and otherwise found or shrinkage by sign as before; the demo organization's InVrScrap and
  InVrExpired rows are seeded.
- **Screens:** InventoryValuation; LandedCosts, linked from BillDetail; Product360: Products' `Shared/Product360`
  with the Accounting context (Summary, Costs/history, source movements, permitted Prices, and the GL mappings pane
  of §4); the StockTransactions report, over `mantle.product.InventoryReportServices.run#StockTransactions`.
- **Usable when** (§16.3 production-to-GL, the valuation part):
  - a freight bill line allocated by weight to two receipts raises the on-hand asset's cost and sends the
    consumed share to COGS, with ledger links, and cannot be allocated twice;
  - a receipt without a cost basis shows in ValuationExceptions and in P11's checklist;
  - the valuation and the inventory account agree for the demo organization, or the difference is listed;
  - a revaluation from a changed estimate sets the on-hand cost from its date and posts on-hand × delta to the
    offset account; a later issue posts at the new cost, and the valuation and the inventory account still agree
    (Products P9);
  - with the organization's revaluation flag off, the post is refused.

### P14 — Tax

- **AC-08** (F41).
  - A corrected, active `mantle.other.tax.TaxAuthorityRate`, keyed to `TaxAuthority` by its own id.
  - `calculate#SalesTaxLocal` and `calculate#InvoiceSalesTax`, implemented, with the organization fallback for
    invoices without a store. Tax lines post to the authority's account.
  - A tax error blocks finalization in `change#InvoiceState`.
  - `mantle.other.TaxServices` `store#Rate` (`ACCOUNTING_ADMIN`), and `export#Statement` and the 1099 runs
    (`TAX_STATEMENT_EDIT`), with `ironstone.accounting.TaxServices.get#StatementDetail` for TaxStatementDetail.
- **Screens** (design §11): TaxAuthorities; TaxRates, with TaxSimulation; TaxStatements and TaxStatementDetail.
  The first release has the US 1099 data and local sales tax only (design §20).
- **Usable when:**
  - a sales invoice without a store gets its local tax lines by organization policy, with the authority, rate
    version, base and rounding stored;
  - an invoice whose tax cannot be calculated cannot be finalized;
  - a sales-tax statement for a period lists its invoice lines;
  - 1099 data is generated per vendor, with failures named.

### P15 — Budgets

- **AC-14.**
  - The Budget status items and flow, which Mantle declares no items for (F42).
  - Budget amounts audit-logged, so a revision is its time and BudgetVariance reads a budget as of one; the approved
    budget's PDF stored as its content. The organization comes from the budget's period, and other parties are
    BudgetParty rows (impl-drawers-commons §4).
  - `BudgetControlPolicy`, effective-dated rows with their key fields audit-logged, and
    `mantle.other.budget.BudgetCommitment`.
  - `mantle.other.BudgetServices` `revise#Budget` (`BUDGET_EDIT`), `store#Policy` (`ACCOUNTING_ADMIN`),
    `check#Budget` (its Stop override `BUDGET_OVERRIDE`), `reserve#Commitment`, `convert#Commitment` and
    `release#Commitment`, each idempotent per source revision, with
    `ironstone.accounting.BudgetServices.find#Exceptions` for the screens.
  - `approve#Payable` (P6) converts a PO's commitment to actual.
  - The BudgetOverride topic. Purchasing's callers are §7.
- **Screens:** Budgets, BudgetDetail and BudgetControls; the BudgetVariance report, with its committed column
  and actuals net of credits (F42).
- **Usable when:**
  - an approved budget's revision keeps the old numbers;
  - a commitment reserved and converted is not counted again as actual;
  - an over-budget expense under Stop is refused, and an override needs a reason.

### P16 — Reports

- **AC-12:** the report runs in Mantle's report files, over the existing report services and views. Each checks
  the organization and that the periods are its own, which Mantle's report services do not (F6). Each answers
  as-of, incomplete and error metadata, and drill-down keeps organization, date and currency.
  `mantle.ledger.LedgerReportServices.run#PartnerLedger` and `mantle.sales.SalesReportServices.run#SalesAnalysis`
  come here, after `LedgerReportServices.run#Aging` (P10) and `run#InvoiceReconciliation` (P11), and
  `mantle.product.InventoryReportServices.run#StockTransactions` and `run#InventoryValuation` (P13).
  `ironstone.accounting.ReportServices` keeps the Reports catalog, its quick options, and the print and export
  shapes.
  Date filters and drill-downs preserve the source's captured `accountingDate` when present, including documents
  created and approved in different time zones; later applications and forward reversals retain their own dates.
- **Screens** (design §13): Reports, the catalog with its quick options; BalanceSheet, IncomeStatement,
  CashFlow, RetainedEarnings, FinancialRatios, PartnerLedger, AccountBalance, PostedSummary and SalesAnalysis.
- **Home complete:** every card and MyFinanceWork source of design §3.
- **Usable when:**
  - each report runs for the demo organization, drills to its source, and prints and exports the same rows;
  - a reader of one organization sees no other organization's balances through any report or export, including
    SalesAnalysis' top products and customer classes (F6).

### P17 — Returns and order changes

- **Warehouse's contract** (§4, WH-RETURN): `mantle.shipment.WarehouseTaskServices.receive#ReturnItems`, checking
  `STOCK_RECEIVE`, which Warehouse grants its groups. It sets `ReturnItem.receivedQuantity` and processes no
  responses, replacing `ShipmentDeliveredReturnReceive` and `ReturnReceivedProcess` on this path. Warehouse's
  ReturnReceipt screen stays Warehouse's.
- **CX-AUTOMATION**, behind D11's flag (§4): `ReturnApprovedProcess` keeps only
  `create#ReturnShipment` (D11).
- **AC-02, returns:** `mantle.order.ReturnServices.preview#ReturnSettlement` and `settle#Return`: a credit needs
  `RECEIVABLE_EDIT` (a supplier's `PAYABLE_EDIT`), a refund `PAYMENT_EDIT`, and a receiptless credit
  `RETURN_CREDIT_APPROVE`.
  - The customer branch calls `process#ReturnItemResponses` inside the settlement.
  - The supplier branch is new code: Mantle refuses responses for a purchase return (F35).
  - Both cover the result codes of design §14, a receiptless credit with an approver, `complete#ReturnItem`, and
    `ReturnItemBilling.assetReceiptId`. Settlement queues match re-evaluation.
- **AC-02, between pack and ship** (D3, behind its flag; §4, F25): the pack SECA leaves the sales invoice
  InvoiceInProcess with no payments applied, and a ShipShipped SECA finalizes it, applying captured payments and
  sending it; `mantle.account.InvoiceServices.release#ShipmentDraftInvoice` and
  `mantle.account.PaymentServices.refund#OrderPayment` (`PAYMENT_EDIT`) serve the changes in between.
- **Screens:** ReturnDetail: `Shared/ReturnDetail` (crosscut §3.18) with the Accounting context.
- **Usable when** (§16.3 return-to-refund; invoice-to-cash, the reopened package):
  - approving an RMA creates no credit;
  - receiving part of it credits only that part, a second box later is still credited, and a refund stays
    within the original paid amount;
  - a supplier return creates the payable credit;
  - a package reopened after pack takes its lines off the shipment's invoice, which is finalized only when the
    shipment ships;
  - ReturnToResponseBasicFlow and OrderToCashBasicFlow pass unchanged.

### P18 — Portals

Accounting's customer and supplier pages, as two PASS apps in mr-pass (§2, §4), on CX-PORTALS.

- **CX-PORTALS** (§4; F29): `mantle.party.ExternalAccessCapability`, and `mantle.party.ExternalAccessServices`
  `create#AccessCapability`, `check#AccessCapability`, `revoke#AccessCapability` and `check#AccessToken`.
- **The PASS apps**, in place of crosscut §5's audience roots (F44):
  - Billing (`screen/Billing.xml`, the `billing` mount): a customer's invoices, with InvoicePay;
  - Supplier (`screen/Supplier.xml`, the `supplier` mount): a supplier's documents, with BillUpload. Purchasing P16
    adds its home, QuoteResponse and OrderAcknowledgement.

  Each is a `PublicSiteApp` with the organization as its target, under PASS's `Pass.xml`, with its navigation,
  readiness and operator configuration on Forum's pattern. They are the first PASS apps beyond Forum, so P18 settles
  how an app registers, which Purchasing P16 and Customer Service's Support app follow.
- **Links and contacts.**
  - An invoice's pay link opens InvoicePay. A PO's link opens BillUpload for that PO: AP issues its capability from
    OrderDetail through `create#AccessCapability`; Purchasing P16 adds OrderAcknowledgement to the same link, and its
    `send#PurchaseOrder` issues one capability for both. Each link is a page taking its token, checked by
    `check#AccessToken` (§2).
  - A signed-in customer or supplier contact is a PASS public account, invited through a PASS invitation bound to
    the app and to the customer or supplier; redeeming it makes the relationship Mantle checks. No UserGroup.
- **AC-02, portal services**, in Mantle so a PASS page can call them, locally or remotely:
  `mantle.account.PortalServices` `issue#InvoiceAccess`, `get#Invoice`, `start#InvoicePayment`, `get#PaymentResult`,
  `submit#SupplierBill` and `get#Submission`, each calling `check#AccessCapability` first, each an operation in
  PASS's `Schema.js` and `Routes.js` served by Mantle's PassApi. `send#Invoice` adds the pay link, the Billing page
  of the organization's site. `submit#SupplierBill` takes its files through PASS's media staging and scanning and
  makes the incoming draft through the core of `mantle.account.InvoiceServices.import#Bill` (P6), with the
  capability check in place of `PAYABLE_IMPORT`.
- **Screens:** InvoicePay (PublicInvoice, PayInvoice, PaymentResult) in Billing, the gateway's return coming back to
  a registered local path of the app; BillUpload, with SupplierBillUpload's forms, in Supplier. Both at 390 px and on
  the desktop.
- **Demo:** a PASS site for ORG_ZIZI_RETAIL with the Billing and Supplier mounts, a customer contact and a supplier
  contact as invited PASS accounts, and token fixtures for the specs.
- **Usable when** (§16.3 access, procure-to-pay):
  - a customer's link shows only that invoice, with no Chatter, cost or rates, and an expired or foreign token
    says unavailable;
  - a redirect return never marks the invoice paid, and a pending payment resumes;
  - a supplier upload creates an incoming draft, a repeat answers the first submission, and it never approves a
    bill;
  - the same pages through a remote PASS frontend with only framework, webroot and PASS installed, and Forum's
    walks unchanged.

### P19 — Setup and activation

- **AC-01, activation.**
  - `mantle.ledger.config.AccountingSetupRun`.
  - `mantle.ledger.SetupServices`, checking `ACCOUNTING_ADMIN`:
    - `preview#OpeningBalances`;
    - `import#OpenItems`: real invoices and bills with an opening flag, at their own due dates, against migration
      clearing;
    - `check#Readiness`: the rows of design §15 Setup, among them single currency, the WIP and transfer accounts,
      and the paused reminder job;
    - `activate#Accounting`, once per run version.
  - The chart templates (§4; F14): a seeded template organization from Mantle's installed chart, copied by
    `init#PartyAccountingConfiguration`.
- **Screens:** Setup. Home offers it first to an unconfigured organization.
- **Usable when** (§16.3 batch/activation):
  - a new organization's opening trial balance and open items tie before activation;
  - one bad open-item row is named and the rest kept;
  - activating twice posts once;
  - aging, dunning and a payment run work on the imported items.

### P20 — Base-currency posting

- **AC-19** (CX-FX; F19, F20):
  - the invoice and payment auto-post services and `post#AcctgTrans` convert to
    `PartyAcctgPreference.baseCurrencyUomId`;
  - the decimal rate, its date and source are stored on the transaction and the document, and
    `originalCurrencyUomId` and `originalCurrencyAmount` are filled;
  - `post#PaymentApplication` books realized FX to `GatForExGain` or `GatForExLoss`, which get their default
    mappings;
  - the single-currency refusal and its readiness row go.
- **Usable when** (§16.3 invoice-to-cash, currency): a foreign-currency invoice posts at its rate and is paid at
  another, and the difference is booked; the GL summaries hold base currency only; Setup no longer says single
  currency.

### P21 — Finish

- The terminal twins, and the server-static pass.
- The §16.3 access walk: an Accounting user of one group with no other launcher is refused the other groups'
  actions and other organizations' records, through URLs, shared mounts, imports, exports and search.
- The §17 outputs not built earlier.
- The inventories' **Implemented in** columns, the design's Impl column, and Remaining-Work.

## 4. Decisions

These are made before and during the build. Each one that changes the design is also written into
design-accounting.md, or into the owner's design.

| Date | Decision | Notes |
| --- | --- | --- |
| Oct 28, 2026 | Phase order: the ledger and its posting guard first; then settings, receivables, payments, payables, matching, payment runs, banking, collections and credit, close, assets, valuation, tax, budgets, reports, returns, portals, setup and base currency | The user's call. The alternatives were the §16.3 flows first, and tax before invoices |
| Oct 28, 2026 | Accounting builds the parts of other apps' needs it depends on: crosscut CX-ORDER-HOLD (P10); Purchasing's SupplierProfile finance fields (P6); Warehouse's `receive#ReturnItems` (P17); crosscut CX-PORTALS with the PASS Billing and Supplier apps (P18); and the CX-AUTOMATION rule changes of design §1.4, each in the phase of its path. These keep the owner's names, packages and Shared screens. The rest of each need, and the owner's own screens, stay with the owner | The user's call, as Products decided for its own. The alternative was features that wait for their owners |
| Oct 28, 2026 | ProductionCostClose and CostingPolicies are built with Manufacturing's cost events, output receipt and run close. P13 seeds their GL account types and the scrap account, and P19's readiness checks the WIP and transfer accounts | The user's call |
| Oct 28, 2026 | Accounting is built after Products. It adds its context to Products' Supplier360 (P6), Product360 and InventoryValuation (P13), and uses P9's revaluation services and dialogs | The user's call |
| Oct 28, 2026 | The shared screens Accounting builds first carry the Accounting context only. Another app's context is added when that app is built | Follows from the above, as in Products |
| Oct 28, 2026 | The shared rules of impl-drawers-commons §4 apply: parties by role, and changes by effective date and the audit log. Here: SupplierProfile, InvoiceMatchPolicy, FixedAssetClass and BudgetControlPolicy are effective-dated rows with audit-logged key fields; budget amounts are audit-logged and a budget revision is a time; a sent invoice and an approved budget store their PDFs; a budget's other parties are BudgetParty rows. Mantle's existing audit-logged invoice, payment and transaction fields are kept | The user's call, in the Purchasing plan review (impl-purchasing §4) |
| Oct 28, 2026 | `import#Bill` takes a Purchasing buyer's upload as well as AP intake's (P6) | The user's call (impl-purchasing §4, answer 4); design-purchasing §1's AP-intake row was corrected in the Oct 28 design sweep |
| Oct 28, 2026 | The legacy match backfill is Accounting's (P7), run by AP or a buyer with the match group, from either app | The user's call (impl-purchasing §4, answer 5); it settles design-purchasing §18's migration item |
| Oct 28, 2026 | The supplier bill link is Purchasing's PO link, which Accounting adds in P18 with BillUpload (F44); with the move below it is the Supplier app's page for the PO, not a `/po/<token>` route | The user's call (impl-purchasing §4, answer 14) |
| Oct 28, 2026 | Public-facing applications are in mr-pass and internal ones in mr-boss. Accounting's customer and supplier pages are PASS apps: Billing with InvoicePay, and Supplier with BillUpload, which Purchasing P16 extends; not `screen/ServicePortal.xml` and `screen/SupplierPortal.xml` in BOSS. They follow PASS's foundation (§2): public accounts with no UserGroup, Mantle services through the facade for a local or remote authority, PASS invitations, media and request contract | The user's call, Oct 28, in the Customer Service plan review (impl-customer-service §4). It reverses crosscut D5's two BOSS roots; Customer Service's pages are its own PASS app, Support |
| Oct 28, 2026 | The root: `BOSS_ACCOUNTING` as root user group and artifact group. Its groups take `MANTLE_USER_ORG` and `MANTLE_PRIVATE_CONTACT`, and `BOSS_ACCOUNTING_ADMIN`, with all authz on the root, `MANTLE_ACTIVE_ORG` and `MANTLE_PRIVATE_CONTACT` (impl-drawers-commons §4). `AccessServices` checks every supplied organization and record. The records no filter covers (F5) are read only through services that check their parent's organization, and `GlAccount` stays global (F14) | The user's call (§5 review), for every BOSS root |
| Oct 28, 2026 | Each Mantle rule change is adopted by its own flag, off by default, so plain Mantle and its flow specs keep their behavior (F27). A flag lives with its owner's settings: Accounting's (D2's receipt billing, D3's pack invoice, D11's return settlement, D18's base-currency refusal, the hold guards) are audit-logged fields of `PartyAcctgPreference`, inherited as its other fields are; another app's are fields of its effective-dated policy rows (WarehousePolicy's expiry gate, ProductionPolicy's approver rule, the buying policy's approval gate, Customer Service's ServicePolicy). The names are neutral, since Mantle stands without BOSS (the Q2 row below). BOSS's demo organization turns them on; the organizations Mantle's specs use leave them off | The user's call (§5 review). The alternatives were one adoption flag on PartyAcctgPreference, and one PartySetting type. Superseded Oct 30: a flag only where a control breaks Mantle's flow specs (below) |
| Oct 28, 2026 | A posting-guard failure is split by source (F9, F10). A finance user's direct post (a manual entry, an invoice or payment post, a batch line) is refused with the reason. An automatic post from an operational event (a receipt, issue, shipment or production fact) goes to the error journal with the failed guard named; Accounting's MissingMappings and error-journal list and Today show it, and P11's close refuses a period that still holds one. An auto-poster that finds no account records a failure, not `AtrSuccess` | The user's call (§5 review). Design §15: a missing map blocks and is named, never a silent suspense. The alternatives were always refusing and always the error journal |
| Oct 28, 2026 | CX-POSTING keeps one Mantle operation record, keyed by `operationKey`, with the operation type, organization, user, time, request hash, preview version, status and links to the records it made or posted (F8). Each posting service checks and writes it in the posting's transaction: a retry with the same hash returns the stored result, and a different request under the same key is refused. Products' `ProductCatalogOperation` stays as built, for its resumable batches | The user's call (§5 review); a fact with an identity of its own under the shared rule. The alternative was an `operationKey` field on each target record. Warehouse, Manufacturing, Purchasing and Customer Service use the same record |
| Oct 28, 2026 | Lock scopes go by the transaction's source document. Sales: transactions whose invoice the organization issued (sales invoices, customer credits and returns, their adjustments). Purchases: those whose invoice it received. Tax: any transaction with an entry on a `GatTax` account, and `AttTaxDue` and `AttTaxInvoice`. All: every transaction, so payments, stock, depreciation and manual entries fall under it only. A hard lock takes no exception, and `TimePeriod.isClosed` still applies | The user's call (§5 review). Odoo's company lock dates, whose sale and purchase dates cover only those journals. The alternatives were an editable map of AcctgTrans types, and payments in the sales and purchase scopes |
| Oct 28, 2026 | Reports read closed periods' GL summary rows, which P11's close computes and stores, creating any that are missing (F16); open periods are summed from posted AcctgTransEntry rows at read time. `realTimeGlSummary` stays as each organization has it, and no report depends on it | The user's call (§5 review). The alternatives were requiring live summaries, which lock summary rows on each post, and recalculating before each report |
| Oct 28, 2026 | Exchange rates: P3 has manual dated UomConversion rates with a CSV import, each marked with its source. P20 builds `mantle.ledger.CurrencyServices.refresh#Rates` as a provider interface, a service name in a `PartyAcctgPreference` field, with the European Central Bank's daily reference rates as the shipped provider (free, no key; cross rates through EUR). A fetch proposes rates that a finance user accepts before they are active (AC-16) | The user's call (§5 review). Until P20 every document is in the base currency (D18). The alternatives were manual rates only, and the fetch at P3 |
| Oct 28, 2026 | Self-approval (design §1.1): one audit-logged `PartyAcctgPreference` field, off by default, which only `ACCOUNTING_ADMIN` sets (P1 grants it to `BOSS_ACCOUNTING_ADMIN`). It covers every Accounting approval (bills, invoices, journal entries, payment runs, write-offs), and a decision whose approver drafted the record is stamped self-approved, for the audit and the approvals report | The user's call (§5 review), as Products decided for estimates. The alternatives were a setting per document type, and none |
| Oct 28, 2026 | The payable hold guard is inside Mantle, at the one point where a payment is applied to a payable invoice, behind the hold flag. `PaymentApplyForInvoice` and `InvoiceApplyForPayments` catch its refusal and leave the payment unapplied with a named exception; `apply#Settlement`, `create#InvoicePayment`, `apply#InvoicePayment` and P8's runs meet the same check | The user's call (§5 review). Mantle reads its own InvoiceHold and never calls BOSS. The alternative was BOSS adapters with the SECAs conditioned, which leaves direct Mantle callers unguarded |
| Oct 28, 2026 | An app's Approvals list filters Commons Notifications by the approval topics it owns, passed by its mount; `get#UserNotifications` takes a list of topics (F43). Commons' own app chips stay. Purchasing (P4) and Customer Service (P9) mount theirs the same way | The user's call (§5 review). A bill approval stays in Accounting's list whichever app sent it. The alternative was the `appName` filter |
| Oct 28, 2026 | Payment terms (P8): `SettlementTermLine` (sequence, portion percent, days basis, discount percent, discount days) as effective-dated rows with audit-logged fields, saved through `store#SettlementTerm`; a per-invoice `InvoiceDueSchedule` (due date, amount, discount date, discount amount) written at issue, the invoice's own rows, so a later term change never alters an issued invoice (as built, not audit-logged: written once at issue and removed only on Resume Changes, both in the invoice's status audit log; F189). Aging, PayablesWorkbench, PaymentRunDetail and `apply#Settlement` read it, and a discount taken within its date posts to the discount account, for customer receipts and supplier payments | The user's call (§5 review): design §20's recommendation, with dated rows in place of its versions. The alternatives were a single discount on SettlementTerm, and due terms only |
| Oct 28, 2026 | Accounting builds project cost posting (P11; F45): `post#WorkEffortCost` reclasses a project's approved time at the entry's cost rate, debiting project cost and crediting a labor clearing account (both GL account types seeded, mapped in PostingDefaults), with the project on the transaction. It runs on timesheet approval behind its own flag, keyed by time entry on the operation record, and posts a dated reversing delta when the approval is undone or the entry changes. Production time is excluded, since Manufacturing's labor events post it (D12) | The user's call (§5 review). impl-projects §7 handed it to Accounting. The alternative was §7, with the People app's payroll; payroll then credits the clearing account rather than wage expense, which the organization's setup decides |
| Oct 28, 2026 | Product360's Accounting context gains a GL mappings pane over `ProductGlAccount` and `ProductCategoryGlAccount` (P13), organization-scoped and edited by finance admin; PostingDefaults stays the bulk editor, and the Products context does not show it | The user's call (§5 review): design §20's recommendation. It is in crosscut §3.5 since the Oct 28 design sweep. The alternative was PostingDefaults only |
| Oct 28, 2026 | The pack invoice (F25), behind D3's flag: the pack SECA creates the sales invoice InvoiceInProcess, without applying payments, and a ShipShipped SECA finalizes it (posting it, applying captured payments and sending it). Between pack and ship, Warehouse's Reopen package and put-back and Customer Service's `apply#OrderChange` call `release#ShipmentDraftInvoice` as D3 designs; after ship, changes go through returns and credit memos. With the flag off Mantle finalizes at pack as before, so OrderToCashBasicFlow passes unchanged | The user's call (§5 review). Revenue and receivable then come at shipment. The alternative was finalizing at pack and building InvoiceCorrection for every change after it. Design-accounting §14 (D3) and crosscut §3.8 were corrected in the Oct 28 design sweep; Warehouse P12 and Customer Service P10 follow |
| Oct 28, 2026 | Chart templates (P19; F14) are seeded template organizations on Mantle's one global chart: a Party with no transactions, holding its account links, type defaults and mappings, copied into a new organization by Mantle's `init#PartyAccountingConfiguration` (`sourcePartyId`). The first release ships one template, from Mantle's installed chart; country charts whose codes conflict are §7's country packs | The user's call (§5 review), Mantle's existing setup copy. The alternatives were template records applied by a BOSS service, and account codes unique per organization |
| Oct 28, 2026 | Two apps by owner and audience, Billing for customers and Supplier for suppliers, rather than one customer app with Customer Service's Support | The plan's choice: P18 comes before Customer Service, and PASS shares accounts and navigation across a site's apps (design-forum §13.1) |
| Oct 28, 2026 | Mantle stands without BOSS, and business logic leans to Mantle. mr-mantle has no dependency on mr-boss: no Mantle service, SECA, EECA, script, data file or spec calls `ironstone.*`, reads a BOSS screen, entity or setting, or names a BOSS group; Mantle checks Moqui permissions, which BOSS grants its groups. Logic not specific to one screen goes in Mantle, in the package of its records, and an `ironstone.accounting` service keeps the capability check, a screen's reads, shapes and saved views, the settings forms and the call to Mantle (§2). So Accounting's services move: to `mantle.ledger` the close and locks, journals, setup, period runs, rates, the production cost close, and the asset books beside Products P9's revaluation; to `mantle.account` invoice states, sending, batches, intake, holds and terms (InvoiceServices), settlement, payment states, transfers, deposits and refunds (PaymentServices), statement import and reconciliation (ReconciliationServices), and the new InvoiceMatchServices, PaymentRunServices, CreditServices, CollectionServices and RecurringInvoiceServices; to `mantle.other` tax and budgets; to `mantle.order.ReturnServices` the return settlement; to `mantle.party.SupplierServices` the supplier profile; and the report runs to Mantle's ledger, inventory and sales report files. BOSS keeps AccessServices, HomeServices, DocumentServices, ReportServices' catalog and shapes, and the list reads (`find#BillExceptions`, `find#Runs`, `find#Work` and the like). P1 grants Accounting's groups the new `RECEIVABLE_EDIT`, `PAYABLE_EDIT`, `PAYABLE_IMPORT`, `INVOICE_HOLD`, `INVOICE_HOLD_RELEASE`, `INVOICE_MATCH`, `PAYMENT_EDIT`, `BANK_RECONCILE`, `PAYMENT_RUN_APPROVE`, `FISCAL_CLOSE`, `CREDIT_HOLD_RELEASE`, `CUSTOMER_CREDIT_VIEW`, `TAX_STATEMENT_EDIT`, `BUDGET_EDIT`, `BUDGET_OVERRIDE`, `RETURN_CREDIT_APPROVE`, `PRODUCTION_COST_POST`, `SUPPLIER_TERMS_EDIT` and `ACCOUNTING_ADMIN`, with Mantle's `INVOICE_APPROVE` and `FISCAL_REOPEN` and Products' `ACCOUNTING_VIEW`, `ACCOUNTING_GL_POST` and `PRODUCT_COST_VIEW`, and `RECEIVABLE_EDIT` to `BOSS_PROJECT_MANAGER` for Projects' Billing; none gets `GL_POST_CLOSED` | The user's call (plan review Q2): a hard rule for every app, in impl-drawers-commons §4. It replaces §2's guarded `ironstone.accounting` adapters. The owner designs' names follow in the design sweep |
| Oct 28, 2026 | Revaluation changes forward cost (AC-07, built by Products P9; used in P13). `mantle.ledger.AssetBookServices.post#Revaluation`, a new Mantle service behind its own flag (`PartyAcctgPreference.inventoryRevaluationEnabled`), off by default and tested in both states, sets `Asset.acquireCost` on the on-hand assets from the effective date, without reposting history, splitting a partly issued asset. It posts one AcctgTrans for on-hand × delta, with asset links, against the seeded offset type `GatInventoryRevaluation`, which P3's PostingDefaults maps. It refuses negative on-hand, a date before the product's last posted movement and a future date, and never calls `update#ProductAcquireCost`. Later issues then post at the new cost, and P13's valuation and inventory account agree after a revaluation | The user's call (plan review Q7), as ERPNext and Odoo do. It replaces "value only", which stranded the amount in the inventory account; design-accounting's AC-07 follows in the design sweep |
| Oct 30, 2026 | P4–P5 are rebased on Mantle's services, and what they built beside them is deleted: gateway actions through the `*#SinglePayment` services, refunds through `create#RefundPayment`, applications through the `apply#*` services, state changes through `update#Payment`, a transfer as one payment that `post#Payment` posts, and invoice print, email, statements and credit memos through Mantle's services and templates (R2; F115) | The user's call (R2). The alternative was correcting the copies in place |
| Oct 30, 2026 | The adoption flags are retired: a new control is the one behavior (§2). Retired: `invoiceHoldGuardEnabled` (P6 builds the hold), `paymentGatewayWorkflowEnabled`, `settlementApplicationGuardEnabled` and `paymentAutoApplicationEnabled`. `postingGuardEnabled` stays, off by default, and BOSS's demo organization turns it on: it gates the posting guard and the invoice and payment `MAPPING_MISSING` refusal, because turning them on breaks Mantle's OrderToCash, ProcureToPay, ReturnToResponse, InvoicePaymentMisc and Payroll flow specs (their demo account assignments, and the error journal those flows post to). An invoice's book day and drafter, the settlement rules, and the invoice period and posted-state refusals hold whatever it says. P2's `requiredLedgerDimensionsEnabled` and `forwardIssuanceRepostEnabled` stay as P2 built them; R2 did not reexamine them. `singleCurrencyDocumentsOnly` (D18) and `invoiceApprovalRequired` are the organization's settings, not a switch between old and new code. D2's, D3's and D11's rule changes, which change what Mantle's flow specs assert (F27), get flags when built | The user's call (R2). It supersedes the Oct 28 flag row |
| Oct 30, 2026 | No screenshot specs in any component; a walk asserts what a page shows. Service implementations are inline XML Actions, with JavaScript modules only for logic XML Actions do not express well (docs/dev/Practices-App-Dev.md) | The user's call (R2) |
| Oct 31, 2026 | D2's receipt billing is behind `PartyAcctgPreference.receiptInvoiceSelfBilledOnly`, off by default: with it on, `ShipmentIncomingDeliveredCreateInvoices` bills a delivered receipt only for a self-billing supplier (its SupplierProfile in effect), with `acceptedOnly`. OrderProcureToPayBasicFlow asserts the SECA's bill with its freight line, so the rule is a flag; BOSS's demo organization turns it on. The hold guard has no flag (no flow spec holds a bill): it is in `change#InvoiceState`'s approval of a bill, the application rules (`apply#InvoicePayment`, `apply#InvoiceToInvoice`, `apply#Settlement`), `create#InvoicePayment` and the open items, and `apply#PaymentForInvoice` and `apply#InvoiceForPayments` leave a held bill's payment unapplied with a `PAYMENT_HELD` warning | §2's flag rule (the Oct 30 row) |
| Oct 31, 2026 | `mantle.account.InvoiceServices.request#PayableApproval` (`PAYABLE_EDIT`) receives an incoming bill and sends the `BillApproval` notification; the plan named only `approve#Payable` and no sender of the topic (agent's call, for review) | The alternative was a SECA on the receive, a hot path the rules keep free |
| Oct 31, 2026 | Accounting's supplier context is its own `Accounting/Payables/Supplier360`, on Customer360's pattern, not Products' `Shared/Supplier360` with an Accounting branch (F135). Its finance details are Customer360's, one template (`template/AccountingFinanceDetails.xml`), writing through Mantle's `CustomerFinanceServices` writers with `side` supplier; the side counts only that side's relationship (a supplier's bills, purchase orders or profile), and the side's permission follows from it (agent's call, for review) | A single Supplier360 with per-app tabs waits for a way to vary a shared screen's tabs by mount; the coordinator raised it with the user |
| Oct 31, 2026 | Payment terms are saved through P3's `mantle.ledger.SetupServices.store#SettlementTerm` (`ACCOUNTING_ADMIN`), extended with `lines`, not a second `mantle.account.InvoiceServices.store#SettlementTerm` as the P8 section named (F170). With lines a term is due in its last portion's days. The seeded 2% discount terms get their line (agent's call, for review) | Use Mantle first: one writer of terms |
| Oct 31, 2026 | `InvoiceDueSchedule` is written once by the `InvoiceIssuedDueSchedule` SECA when an invoice becomes Finalized or a bill Approved, from the term's lines in effect on the invoice date; no rows for a credit memo or a zero total. An invoice issued before P8 is read with the schedule its term gives, not stored. A discount is open through the calendar day of `discountDate` in the user's zone; what is still available is the open discounts less prompt-payment credits already issued for the invoice, at most its unpaid total (agent's call, for review) | The contract P10's aging reads; documented in mr-mantle's AccountingImplementation |
| Oct 31, 2026 | A prompt-payment discount with no account, within what the due schedule offers on the date, posts to the `ItemPromptDiscount` item-type account of the side (outgoing for customer invoices, incoming for bills); more is refused; a discount on an explicit account stays P5's adjustment (agent's call, for review) | "Posts to the discount account" with no new configuration |
| Oct 31, 2026 | A payment run pays each supplier with one payment, in its own transaction; ACH payments are authorized at execution and delivered by the run's NACHA file, then applied; checks are numbered, delivered and applied at execution, and get a Positive Pay file only when the bank account has a format. The run's bank file holds its payments only (`paymentIdList`, F171). A run's discount is a credit memo the organization issues against the bill, finalized and applied before the payment: the run's approval stands for it (F173). `request#RunApproval` sends the PaymentRunApproval topic; `store#RunItem` leaves a bill out or puts it back; selecting or changing an approved run sends it back to proposed; `import#RunReturn` scopes `import#NachaReturn` to the run and cancels its discount credits (agent's call, for review) | The plan named create, select, approve and execute; the others are what the screens need |
| Oct 31, 2026 | Review rework: a payment run's execution is idempotent through the CX-POSTING record (`PostingOperation`) for a completed execution, answered before any other check; the run's `executeOperationKey` stays as the claim of an execution in progress, since PostingOperation is written only when an operation completes and a resume needs the key before then. A run is executed only when every payment it made is applied; otherwise it stays approved with the reason and the same key resumes it (agent's call, for review) | Coordinator's B3 allowed recording the deviation |
| Oct 31, 2026 | Second review: a supplier that failed in a run that has not finished releases its bills to other runs (its item stays Failed); resuming that run pays them only when no other run has paid or is paying them, and the bill's balance is unchanged (agent's call, for review) | The alternative was a release action on the unfinished run |
| Oct 31, 2026 | Review rework: a prompt-payment discount within the due schedule is an organization-issued credit with no approval step (`create#InvoiceCreditMemo` `promptDiscount`), for the workbench and runs alike; any other payable write-off or discount needs `INVOICE_APPROVE` and is refused at preview otherwise (F173) | The alternative was routing write-offs through `request#PayableApproval` |
| Oct 31, 2026 | Bills due through the run's date are selected, and also a bill not yet due whose discount is open on the pay date (agent's call, for review) | Otherwise the discount date passes before the bill is due |
| Oct 31, 2026 | Treasury (`BOSS_ACCOUNTING_TREASURY`) reaches Payables and is granted `PAYABLE_VIEW`: it executes runs and reads the bills they pay. `PAYMENT_VIEW` reads runs as it reads their payments (agent's call, for review) | A Payables subscreen grant alone leaves the Payables root forbidden in the client |
| Oct 31, 2026 | PayablesWorkbench is the settlement workbench with direction payable: ReceivablesWorkbench's screen and SettlementReview moved into `template/AccountingWorkbench.xml`, each route screen setting its side; ApplySupplierCredit is its credit-to-bill allocation, reviewed in Payables/SettlementReview (agent's call, for review) | Screens that differ only by record kind share one template |
| Oct 31, 2026 | Approvals is the Commons Notifications list mounted with Accounting's approval topics (`notificationTopics`, through the framework's `get#UserNotifications` `topicList`), as F43 and the Oct 28 row decided; a row opens its bill and nothing is decided from the list. `approve#Payable` and `release#InvoiceHold` mark their notifications read, and `request#PayableApproval` and `request#HoldRelease` notify only the organization's users who hold the deciding permission. `Shared/OrderDetail`'s Accounting context is a branch of that screen with boxes (Items, Invoices and payments, Fulfillment, History) rather than tabs, since it has none; `Shared/ShipmentDetail` is new with the Accounting context only (agent's call, for review) | Commons Notifications takes `appName`, not topics, and the framework service one topic |
| Oct 31, 2026 | The match exception hold (`IhrMatchException`) goes through the one hold creation, `InvoiceWorkflowLib.placeHold` (state, reason and duplicate checks, the row), which `hold#Invoice` calls after its `INVOICE_HOLD` check, `apply#InvoiceMatch` after its `INVOICE_MATCH` check, and the re-evaluation job with no user: a match operator (a buyer with the match group) holds no `INVOICE_HOLD`, and a scheduled job runs with no user (F151). Its placer is the user who applied the match (none for the job), so an approver who did not apply it releases it. The job places it again only for a source change or an exception the match's lines did not record, so a released hold stays released (F158) (agent's call, for review; revised after the P7 review) | The alternative was granting the match group `INVOICE_HOLD`, which would let buyers place any hold, and a run-as user for the job |
| Oct 31, 2026 | BillDetail's Match tab is `Shared/InvoiceMatch` itself (one route, `Payables/BillDetail/Match`), not a separate `Payables/InvoiceMatch` route; the legacy backfill is its own task screen, `Payables/LegacyMatches`, linked from MatchPolicies, since Settings is the finance administrator's alone and AP and match operators run the backfill (F152). The match group (`BOSS_ACCOUNTING_MATCH`) gets `PAYABLE_VIEW` and the Payables screens, to read the bills it matches (F153) (agent's call, for review) | The alternatives were opening Settings to AP and the match group, and a match screen beside BillDetail |
| Oct 31, 2026 | Match policy (agent's call, for review): with no row in effect a bill matches accepted receipts with no tolerance and a variance holds the bill; a tolerance is the larger of a percent of the source's base (accepted less held, or ordered) and a fixed allowance, and what other bills billed, this bill's earlier allocations and the allocation together may not pass base plus tolerance (F157); a product row wins over a category row (of several, the one that started last), which wins over the organization's; `selfBillingDefault` is read from the organization's row only, when a supplier has no profile row in effect at the change's date; the design's "same-rate action (Warn or Stop)" is the action outside tolerance (`ImaHold`, `ImaWarn`); tax tolerance and the service-acceptance rule wait for their checks (§7). An unmatched quantity, a product line with no source and a missing receipt where required are exceptions that hold, like a price variance; quantity beyond what the source allows is refused at apply. A re-evaluation uses the policy rows the match lines kept | Design §15 MatchPolicies lists the fields without their semantics |
| Oct 31, 2026 | BankRules is `Accounting/Banking/BankRules`, not under Settings: Settings is finance-admin only by artifact authorization, and the design gives the rules to treasury too. Design §2 and §15 follow | P9 (agent's call, for review). The alternative was a treasury grant on the Settings section, which opens its other settings screens to treasury |
| Oct 31, 2026 | A statement session (`BankReconciliation`) links the bank lines of its period through `BankReconciliationLine`, keyed by the bank line, so one session clears a line; the sessions of one bank never overlap; finishing needs every line of the period cleared, each matched or not reconciled with a reason, and a zero difference. A rejected or missing statement row shows as a difference until it is added or the closing balance corrected, so finishing needs no separate resolution of import rejections. Reopening a finished statement is later (§7) | P9 (agent's call, for review): design §7 ReconciliationDetail's "resolved import errors" and its finance-admin reopen |
| Oct 31, 2026 | Reading bank lines needs `BANK_RECONCILE`, `ACCOUNTING_VIEW` or `ACCOUNTING_ADMIN`, not `PAYMENT_VIEW` alone, so AR does not read bank statements; changing them needs `BANK_RECONCILE`; a deposit slip needs `PAYMENT_EDIT` with `PAYMENT_VIEW`. Banking opens for treasury, the reader and the finance admin. `AccountingPolicy.capabilities` gains `bankReconcile`, which is not a general finance read: it opens only a scope that names it (`organization(p, "bankReconcile")`), so a user holding only `BANK_RECONCILE` reads banks and nothing else of Accounting | P9 (agent's call, for review; narrowed after the P9 review) |
| Oct 31, 2026 | Statements follow one another: a new session starts the day after the bank's previous one ends, only once that one is finished, and none starts before an existing one; its opening balance is the previous closing balance. No line is added, imported or moved into a finished statement's period (`check#BankLineDay`), and a finished statement's lines do not change (`check#BankLineOpen`, also in `update#PaymentMethodTrans`) | P9 review B3 and B4 (agent's call, for review). The alternative was re-deriving the opening at finish |
| Oct 31, 2026 | A finance user's own stored-value movement goes through `FinancialAccountServices.record#FinancialAccountMovement`, which refuses and rolls back a movement whose transaction does not post (as §4 Oct 28 refuses a finance user's direct post); `deposit#`, `withdraw#` and `adjust#FinancialAccount`, which orders, payments and gift cards call, keep the automatic posting to the error journal | P9 review B1: an explicit service, no caller-name check |
| Oct 31, 2026 | `clear#PaymentTrans`, which the PaymentCancelClearMethodTrans SECA runs on a cancelled or voided payment, is refused when the payment is on a line a finished statement cleared (BANK_LINE_FINISHED), so the void fails until the statement is dealt with. This is a new refusal on Mantle's void flow (§2) | P9 review; reopening a statement is §7 |
| Oct 31, 2026 | A deposit slip groups delivered receipts whose `toPaymentMethodId` is the bank account, in its currency, so the cash is already booked to the bank's account and the deposit changes no posting. A receipt recorded without a bank method (posted to an undeposited-funds account) is not offered (§7) | P9 (agent's call, for review): R-ACC-33 groups "receipts of one bank account" |
| Oct 31, 2026 | The existing `create#`, `update#`, `reconcile#`, `unreconcile#`, `noReconcile#PaymentMethodTrans` and `match#PaymentMethodTransUnmatched` check no permission, since the statement message consumers call them; screens call `check#BankAccess` first, and the new services check it themselves. `reconcile#`, `unreconcile#` and `noReconcile#` refuse a line a finished session cleared, and `match#` reconciles only a line with one possible match (F192) | P9, a new refusal in existing Mantle services (§2) |
| Oct 31, 2026 | A period's closing entries are posted only when a fiscal year closes; a month or quarter close stores its summary rows and posts nothing. `close#Period` closes the period first (Mantle's `close#FinancialTimePeriod`), then stores the summary rows, posts the year's closing entries and stores them again, all in one transaction; with the posting guard on, only the closing entries of the close in progress pass the year's closed-period finding: `close#Period` creates its run as CrnClosing in its own transaction and passes the year to `post#AcctgTrans` (`closingTimePeriodId`), and the guard checks the closing type, the year's last day, the organization's chain and that run, and asks FISCAL_CLOSE. Locks are never skipped: a hard lock through the year end is set after the close, an exception to the Oct 28 lock row only in that order. No journal draft, template, instance or reversal takes a closing type, and a closing entry is not reversed (reopen and close again) (agent's call, for review; review R1) | P11. Closing entries every month would empty the year's income statement |
| Oct 31, 2026 | A rollup's close closes each organization that rolls up to the period's organization to its own net income account and stores each one's summary rows, so a child's reports of the parent's closed year read them; every closing entry posts or the whole close rolls back (agent's call, for review; review R2, R3, R5) | The alternative was refusing while children have rows |
| Oct 31, 2026 | `close#FinancialTimePeriod` joins its caller's transaction (it was `force-new`), and counts the unposted transactions of the period's organization and the organizations that roll up to it, which post under its periods (F37, F230) | P11. Standalone calls still begin their own transaction |
| Oct 31, 2026 | The checklist's rows are `PeriodCloseCheck` enumerations, each naming a service that implements `CloseServices.define#CloseCheck` (enumCode) and whether its items block the close (optionIndicator), so a later source (P7's match exceptions, P13's valuation, Manufacturing's cost close) adds a row with data and its own service. Unposted transactions, the error journal, unbalanced transactions, unposted documents, bank lines not on a finished statement and missing rates block; bills on hold, stock movements that posted nothing, open WIP on completed kit and repack work and unposted project time are shown without blocking. A check that fails is unavailable and blocks. Each runs in its own transaction (agent's call, for review) | P11: "a list each source adds to" |
| Oct 31, 2026 | Project cost posting is behind `PartyAcctgPreference.projectCostPostingEnabled`, off by default, set in AccountingPreferences (Project cost) and turned on for BOSS_ACCT_ORG by the demo. It posts on the day of the approval or change (today's book day), for the project's owner, the time of a project's work (a WetProject or work under one; production runs are tasks of purpose `WepProductionRun` with no project), only internal labor (no vendor, or a vendor in the organization's chain; an outside vendor's time is its bill's). Each time entry's `PostingOperation` (`wec:` and its id) lists its transaction lines; a posting that goes to the error journal holds the entry until it is posted. Mantle seeds `GatProjectLaborCost` (cost of services sold, 550000000) and `GatLaborClearing` for DefaultSettings; the clearing account is the employee wage expense payroll's earnings items debit (631100000), so the reclass moves approved project time out of wage expense into project cost; an organization with an absorbed-labor account maps that. Deleting a posted entry reverses its cost (agent's call, for review; review R6, R7) | §2's flag rule: approving a week in Mantle's flow specs would post |
| Oct 31, 2026 | The period-run contract: a kind is a `PeriodRunKind` enumeration naming its calculation service (enumCode, `PeriodRunServices.define#RunCalculation`) and its posting service (optionValue, `define#RunPosting`). `preview#Run` stores the run, its results and a version (a hash of the results), superseding the kind's earlier preview of the period; `post#Run` (operation key) calculates again and refuses a changed version (RUN_CHANGED), then the kind posts. The project cost catch-up (`PrkProjectCost`) is the first kind built, for time approved before the flag was on or whose posting failed; P12 adds depreciation as a kind (agent's call, for review) | The plan named only preview#Run; a contract needs a post its kinds share |
| Oct 31, 2026 | A checklist item links to the screen that resolves it only where the user may open it: the approver, who closes, does not open Banking (§4 Oct 31), so a bank account's item is named without a link for them; treasury finishes the statement, and the finance admin sees the link | P11 |
| Oct 31, 2026 | P14: an organization's sales tax gateway for its invoices without a store, or whose store has none, is `PartyAcctgPreference.taxGatewayConfigId` (audit-logged); a store's own binding comes first. The local gateway taxes a sale where the organization (or one it rolls up to) has nexus (`TaxAuthorityParty.isNexus`) and a sales tax rate, for each authority whose geo is the destination's country, state, county, city or postal code; the destination is the customer's shipping, else billing, else primary address. An organization with no sales tax nexus gets no tax, so Mantle's order flows are unchanged | Agent's call, for review. Destination-based only; origin sourcing, tax-inclusive prices and VAT are §7. The alternative for the organization's gateway was a PartySetting |
| Oct 31, 2026 | P14: a sales invoice's tax is calculated when it is finalized or approved, inside `change#InvoiceState`, and the result is written only when it differs, so an approved version keeps its fingerprint; a tax refusal refuses the state change. Back in draft, the calculated lines are removed | Agent's call, for review. The alternative was calculating on each draft edit, which touches `store#InvoiceDraftItem` (P6 edits it) and every line change; a "Calculate tax" action on the draft is §5 |
| Oct 31, 2026 | P14: a rate version is a dated `TaxAuthorityRate` row of the organization; `store#Rate` starts a new version and ends the one it replaces, or ends one, and refuses overlaps of one authority, type and scope; an invoice tax line keeps its version (`InvoiceItem.taxAuthorityRateId`) with its base, rate and rounding | Agent's call, for review; the shared rule of changes by effective date. The design's "priority" is the scope's specificity (category, store, organization) |
| Oct 31, 2026 | P14: the 1099 run (`run#Vendor1099Statements`) reports the vendors the organization paid in the year who are registered with the IRS and not exempt (`TaxAuthorityParty` for `UsaIrs`, the TaxRegistrations form), from the year's payments applied to their invoices, split by item type in proportion. `create#AllVendor1099MiscStatements` stays as it was for its callers; `create#Vendor1099MiscStatement` takes the run's `itemTypeTotals` | Agent's call, for review (F41, F294). The alternatives were every vendor over the threshold (Mantle's), and an eligibility field on Party |
| Oct 31, 2026 | P14: a statement's export is CSV data with a format version (`local-sales-tax-v1`, `usa-1099-misc-data-v1`), recorded on the statement; an exported statement is kept, and a change to its sources is a new statement for the period. No authority filing format ships (design §20) | Agent's call, for review |
| Oct 31, 2026 | P10: the credit check runs inside Mantle's `approve#Order`, the manual approval every BOSS approve action calls, and as the `OrderPreApproveCredit` SECA on `check#OrderPreApprove` for `autoApprove#Order`, which passes `approving` so a Hold result places the hold while a display of the checks does not. There is no separate BOSS guard: no BOSS screen approves a sales order yet (Sales and Customer Service are placeholders), and one in Mantle holds for every caller. An order with an open hold reason is released, not approved (`ORDER_HOLD_OPEN`). An organization without a credit policy is never checked, so Mantle's flows are unchanged (agent's call, for review) | The alternative was a BOSS guard service before `approve#Order`, which callers outside BOSS would skip (F210, F211) |
| Oct 31, 2026 | P10 (CX-ORDER-HOLD): `hold#Order` writes an `OrderHoldReason` (Credit, Change, Purchase or Manual, `OrderHoldType` with the releasing permission as its enumCode) and moves the order to OrderHold; a Credit reason is placed only by the credit policy and asks no permission of the user whose approval triggered it, the other types need their type's permission. `release#OrderHold` needs the type's permission and returns the order (or the reason's part) to the reason's return status, the status it had when held, only when no other reason is open on it: an order held before its approval goes back to Placed, so its approval runs the pre-approve and credit checks again (F229). An order of several parts is held and released by part (F221). Neither service checks the organization: their callers do. Reservations stay while held | The design names the reasons and the release rule; the permissions are this build's (agent's call, for review) |
| Oct 31, 2026 | P10: a customer's credit policy (`store#Policy`) is set by a credit manager (`CREDIT_HOLD_RELEASE`, AR + APPROVE in BOSS) or the finance admin, as design §4 Customer360 has it; the organization default (`store#Defaults`) by the finance admin only. Exposure is the customer's unpaid issued invoices and open orders not yet invoiced (part totals less OrderItemBilling), less its unapplied payments and the payments authorized on those orders, in the policy's currency; an order in another currency is a reason. Warn approves a manual approval with the warning (`creditWarning`) and stops Mantle's automatic approval; Hold holds. A policy's currency defaults to the organization's base currency when none is given (agent's call, for review). A release decision passes the order (or its part) in the credit check until its `expireDate`, for good without one (F224); after a release an order back in Placed goes through `autoApprove#Order` | Plan P10 named `ACCOUNTING_ADMIN` for both writers; the design gives the customer's limit to the credit manager (agent's call, for review) |
| Oct 31, 2026 | P10: collections. A contact is a WorkEffort activity (call, email or to-do) on the customer's record with a `CollectionActivity` row (organization, outcome, invoices); a next action is an open task assigned to the collector, so it reaches their Today. A dispute is `Invoice.disputedDate`/`disputeNote` (audit-logged), set and cleared by the Disputed and Dispute resolved outcomes. A promise's state is derived: kept by the customer's payments received from its making through its day, broken when the day passes first; it stores only open or cancelled | InvoiceHold is payable-only and blocks applications, so it is not a receivable dispute (F219, F220) |
| Oct 31, 2026 | P10: dunning. A run previews, per customer and currency, a notice at the level of its most overdue invoice that is not disputed, and leaves out with the reason disputed invoices (unless the level includes them), a customer covered by unapplied payments, one with an open promise, and a reminder of the same level to the customer, by the organization in the currency, sent within the level's cadence. Each notice is prepared and sent in its own transaction; a failure keeps its reason, and sending again sends only the notices not sent; a notice whose email's outcome is unknown stays sending until AR settles it as sent or failed with a note. Levels are effective-dated rows; fees and interest are §7 | Design §4 Dunning and AC-10 |
| Oct 31, 2026 | P10: recurring invoices copy a template invoice's lines (not its calculated tax lines) into a draft dated on the period's day; a period is made once (`InvoiceScheduleOccurrence` keyed by schedule and day, the schedule locked); the job makes at most 12 periods a schedule a run and records a failure on its period with a `RecurringInvoiceFailed` notice. Drafts only: auto-send is §7. The screen is under Receivables for AR; a supplier's recurring bill is stored by `PAYABLE_EDIT` but AP's own entry comes with Payables (§7) (agent's call, for review) | Design §4 RecurringInvoices and AC-09 |
| Oct 31, 2026 | P10: Aging (`run#Aging`) ages each invoice open on the chosen day (issued by then, less what was applied by then), each portion of its due schedule (P8) in the bucket of its days past due, on calendar days compared in JavaScript, so a past day buckets the same on any database. More than 5,000 open invoices are named (complete false), never cut. Aging is in Reports (report reader, GL, approver, admin); AR works from Collections | The view's per-database day arithmetic was the cause of F36 (F213) |
| Oct 31, 2026 | P10: Today and notices. Collection follow-ups are the collector's assigned activities, which Today lists already; the Accounting today-source adds orders held for credit for a credit manager and recurring periods that failed for a biller. CreditHoldRelease is an approval topic (Approvals), sent to the organization's users holding `CREDIT_HOLD_RELEASE`; RecurringInvoiceFailed a notice to its billers | Design §1.3 |
| Oct 31, 2026 | P15: a budget is Draft, Approved, Closed or Cancelled. Approving needs a new permission, `BUDGET_APPROVE` (BOSS grants it to the approver and finance admin groups), and another user than the drafter unless `allowAccountingSelfApproval` (the Oct 28 self-approval row); closing and cancelling need `BUDGET_EDIT` and a reason. Mantle's item writers refuse a budget that is not a draft (`BUDGET_NOT_DRAFT`, a new refusal in existing services, §2) | Agent's call, for review. The plan named no approval permission; the alternatives were `BUDGET_EDIT` (the drafter's own) and `BUDGET_OVERRIDE` |
| Oct 31, 2026 | P15: a revision is a `BudgetRevision` whose `BudgetRevisionImpact` rows hold the amounts it set; approval is revision 0 with every item. A budget is read as of a revision (each item's latest impact at or before it) or of the revision in effect at a time; `BudgetItem.amount` is audit-logged with the reason as well. An approved budget changes only through `revise#Budget` | Agent's call, for review: Mantle's revision records rather than reconstructing amounts from audit rows, whose timestamps can tie within a millisecond |
| Oct 31, 2026 | P15: spending counts against the approved budget's item for the sub period holding its day, else the whole-period item. Actual is posted debits less credits at read time; committed is the open amount of reserved commitments by their day. A policy row for a budget and account wins over an account's, a budget's and the organization's, and a stage's over every stage's; with none, spending is not controlled. Stop refuses when actual and committed after the spending pass the threshold percent and the spending adds to it | Agent's call, for review (design §12) |
| Oct 31, 2026 | P15: a refused Stop is kept as a blocked commitment in its own transaction (`record#BlockedCommitment`; `BudgetCommitment` has no foreign keys so it does not wait on the caller's locks) and the `BudgetOverride` notice goes once to the organization's users holding `BUDGET_OVERRIDE`. The override is given on the source document with a reason (`approve#Payable`'s `budgetOverrideReason`; Purchasing's approvals in §7), never from the list; the notice opens BudgetControls' exceptions | Agent's call, for review. The alternative was an override action on the exception, which would approve a document from outside it |
| Oct 31, 2026 | P15: `reserve#` and `release#Commitment` need `INVOICE_APPROVE`, `BUDGET_EDIT` or `ACCOUNTING_ADMIN` in the organization, and `convert#Commitment` also `PAYABLE_EDIT` (a bill's approval converts); `release#Commitment` releases only a closed or cancelled source's commitments unless the user holds `BUDGET_OVERRIDE` or `ACCOUNTING_ADMIN`. Purchasing adds its approval permission with its callers (§7). A bill's actuals are recorded by `change#InvoiceState`'s approval of a bill, after its posting, from the debit lines of its posting in effect, keyed by its approved version; an account's lines are decided together; a commitment converts only on its own account (on another it gives up its share); its approval undone or the bill cancelled reverses them (`reverse#InvoiceActuals` from the existing revert SECAs). `create#Budget` and the item writers need `BUDGET_EDIT` in the period's organization; the control and the lists read an approved budget as of its latest revision | Agent's call, for review; revised after the P15 review (F319–F325) |
| Oct 31, 2026 | P15: an approved budget's PDF is made at approval and at each revision; one that cannot be made is logged and the revision stands (failure tolerance), since the amounts and revisions are the record | Agent's call, for review |
| Oct 31, 2026 | P12: `FixedAssetClass` is an organization's dated versions of the book defaults of one `AssetClass` enumeration value (useful life, residual percent, book and tax methods, asset, accumulated depreciation, expense, gain and loss accounts); `store#Class` ends the version in effect where the next starts and refuses overlaps; its key fields are audit-logged on create and update (`enable-audit-log="true"`: "update" does not log a first value, such as a version's first end) | Agent's call, for review. The alternative was a class record of its own beside the enumeration; `Asset.classEnumId` stays the asset's class |
| Oct 31, 2026 | P12: capitalization writes the adopted basis on the Asset (class, in-service day as `acquiredDate`, cost, residual, method, end of life from whole years) and the adopted accounts as the asset's own `AssetTypeGlAccount` row, which Mantle's depreciation and receipt postings read first. An asset not received posts its cost from Unreceived Fixed Asset (the type's `receiptGlAccountId`, which a fixed asset bill debits); a received one is on the books from its receipt and is reclassified only when the class's asset account differs. An adjustment's cost change posts against the same clearing account | Agent's call, for review. Capitalizing from a bill line's own account, and AP's fixed asset bills, are §7 |
| Oct 31, 2026 | P12: a disposal posts itself: the cost and accumulated depreciation out, a sale's proceeds to the asset's Unissued Fixed Asset account (the clearing its sales invoice line credits, through the line's override account), and the gain or loss to the class's (else the type's) accounts; the asset ends its life (`actualEndOfLife`) and keeps its status. An invoice that sells the asset itself (an `ItemAsset` line) is refused, since Mantle's invoice posting disposes of that one | Agent's call, for review (F254). The alternative was the sale only through Mantle's ItemAsset invoice posting |
| Oct 31, 2026 | P12: a book event is reversed only while it is the asset's latest in force, a capitalization or adjustment only before depreciation used it; the reversal posts `post#ReverseAcctgTrans` on its day and restores the basis and account row kept on the event (`bookBeforeJson`). A book change is refused when depreciation is posted for a later period. Acquire cost repair is `AssetBookServices.repair#AcquireCost` (`ACCOUNTING_ADMIN`, a reason, an operation key) over `update#AssetAcquireCost`, refused while any posting of the asset is in a closed period | Agent's call, for review |
| Oct 31, 2026 | P12: depreciation is the `PrkDepreciation` period run kind, by fiscal month: `calculate#DepreciationRun` gives the month's amount of each fixed asset with a method, in service by the month's end, not disposed and not yet depreciated for it; `post#DepreciationRun` posts each ready asset in its own transaction through `post#AssetPeriodDepreciation` over `calculateAndPost#FixedAssetDepreciation`, which refuses (rolling back the transaction and its row) when it did not post. `preview#Depreciation`, `get#DepreciationPreview` and `post#Depreciation` are the depreciation screen's calls over the contract: a class or asset selection, each asset's book columns, and the kind's check. Only the book basis is depreciated | Agent's call, for review. The design's book/tax basis choice is §7 (Mantle calculates no tax depreciation) |
| Oct 31, 2026 | P12: Fixed assets opens for GL posting, approvers, readers and finance administrators; an asset's book (`get#AssetBook`) and the lists need GL posting, report read or finance administration, not AR or AP. EquipmentDetail's dialogs leave out the source bill and the sales invoice, which GL posting may not read (F255); the services take them | Agent's call, for review |
| Oct 31, 2026 | P17: D11's flag is `PartyAcctgPreference.returnSettlementRequired` and D3's `salesInvoiceFinalizedAtShip`, both audit-logged, off by default, preference fields of `store#Preferences` and AccountingPreferences, which BOSS's demo turns on. With D11's on, `ReturnApprovedProcess` only creates the return shipment and `ShipmentDeliveredReturnReceive` and `ReturnReceivedProcess` stand aside (`get#ReturnSettlementMode`); `receive#ReturnItems` is refused for an organization with it off (`RETURN_SETTLEMENT_OFF`), since Mantle would receive the same shipment again when it is delivered. With D3's on, the pack SECA passes `applyPayments` false and `ShipmentShippedFinalizeInvoices` (shipped, or delivered unshipped) calls `finalize#ShipmentInvoices`, which finalizes and applies as the pack did; the InvoiceFinalizedSendEmail SECA sends it (agent's call, for review) | ReturnToResponseBasicFlow and OrderToCashBasicFlow assert the old behavior (F27). The alternative for receipt was letting `receive#ReturnItems` run either way and the delivered SECA skip what it recorded, which needs a mark on each receipt |
| Oct 31, 2026 | P17: the preview and settlement are `mantle.order.ReturnServices.preview#ReturnSettlement` and `settle#Return` (design §14's `ReturnSettlementServices.preview#Return`, by the Oct 28 Mantle rule); the preview answers a version (a hash of the return, its items' received and settled quantities and the request), which settle recomputes under lock (organization, return, items) and refuses when it differs (`RECEIPT_CHANGED`); the operation key is a PostingOperation. The result codes are `CREDIT_CAP_EXCEEDED`, `RECEIPT_CHANGED`, `CLOSED_PERIOD`, `REFUND_PENDING` and `FORBIDDEN` (design §14 in upper case, as the other reason codes), with `RESPONSE_REQUIRED`, `REASON_REQUIRED`, `NOTHING_TO_SETTLE` and `RETURN_NOT_APPROVED`; a reader previews, and settle checks the writer's permission before anything else. Eligibility: a customer item what was received (authorized, receiptless) less what its standing billing links settled, within what its order line billed less what every return credited; a supplier item what was shipped back (ReturnShipped or later) within what was billed less earlier supplier credits. The restocking fee and a response chosen on ReturnDetail for a ReturnManResp item are §7 (agent's call, for review) | A PaymentReview row per preview was the alternative; a return has no payment to scope it, and the version needs no stored state |
| Oct 31, 2026 | P17 (revised after the P17 review): a customer refund is within the total paid on the order: it is spread over the return's orders' captured payments, the largest first (the latest of equal ones), each refunded through `create#RefundPayment` up to what is left of it (amount less its refunds, pending included; else `CREDIT_CAP_EXCEEDED`), as promised refunds for the credit memo; the gateway calls (`refund#SinglePayment`, keyed by the settlement's operation key) come last, a decline refuses the whole settlement (`REFUND_DECLINED`) so the quantity can be settled again, and a pending one answers `REFUND_PENDING` and holds the next refund. A credit is Mantle's customer credit account; a credit's unit is at most the billed unit price. A replacement settles the quantity given, recorded on `ReturnItem.replacedQuantity`, and is placed, approved only when the settler holds `ORDER_APPROVE`. A receiptless settlement credits or refunds, never replaces; its settler, who holds `RETURN_CREDIT_APPROVE` and `INVOICE_APPROVE` with `RECEIVABLE_EDIT`, is the approver on the billing link and approves the credit memo through `change#InvoiceState`, which refuses it unless `allowAccountingSelfApproval` (F369). The customer credit memo is issued through `change#InvoiceState`; with `invoiceApprovalRequired`, by `approve` from a settler with `INVOICE_APPROVE` and `allowAccountingSelfApproval` (else `APPROVAL_REQUIRED`). A supplier return makes one credit per item through `create#InvoiceCreditMemo` linked to the bill, with the item's adjustments netted in (F354), and queues the bill's re-evaluation (agent's call, for review) | The review's decision on the refund (one payment that covers it, before); a return credit awaiting another approver is §7 |
| Oct 31, 2026 | P17: ReturnDetail is `Shared/ReturnDetail` at `Accounting/Records/ReturnDetail`, Accounting's context only; Settle settles every eligible line as previewed (the service takes lines and quantities; the screen does not edit them), and Credit without receipt is in More for an AR user who holds `RETURN_CREDIT_APPROVE`. `release#ShipmentDraftInvoice` and `refund#OrderPayment` have no Accounting screen: Warehouse's Reopen package and Customer Service's order change call them (design §14 D3) (agent's call, for review) | No Accounting list of returns: a return is reached from its order or customer once those contexts are built; the walk opens it by its route |
| Oct 31, 2026 | P18: InvoicePay pays what is due in one card payment for the invoice (`forInvoiceId`, `PiCreditCard`) through the organization's invoice payment gateway, `PartyAcctgPreference.invoicePayGatewayConfigId` (one of its PaymentGatewayOrganization bindings, set in Accounting Preferences), by `authorize#SinglePayment` with a `returnUrl` Mantle builds on the site's canonical host. A hosted gateway answers pending with its page (`PaymentGatewayResponse.redirectUrl`); the outcome is only its details service's (`get#SinglePaymentGatewayDetails`), an authorization is captured, and Mantle's `PaymentApplyForInvoice` applies it. Payments started from a page are `PortalPaymentAttempt` rows, the only ones a page shows, refreshes or captures (F381). One attempt is pending at a time per invoice: a retried request answers its attempt and a new one resumes the pending attempt; one with no reference to ask and no page is cancelled; the invoice page asks the gateway first, and `resolve_PortalPayments` settles the rest every ten minutes. The gateway's return carries a per-attempt reference that reads the result without the session. The attempt is made under the invoice's lock in its own transaction, and the gateway is called under the payment's lock only (F380). Partial payment is §7 | Agent's call, for review. Mantle had no hosted gateway contract (F373); the alternatives were a new gateway interface, and card entry in PASS, which PCI rules out |
| Oct 31, 2026 | P18: the gateway's page is a link on PaymentResult, never a form post or a server redirect to the provider, so `Pass.xml`'s `form-action 'self'` stays as it is for every provider (F53) | Agent's call, for review |
| Oct 31, 2026 | P18: an app registers in Mantle's `public/PublicApps.js` (name, target type, readiness service), PASS's `service/pass/Apps.js` (root screen, default path), a `Pass.xml` subscreen, its operations in `Schema.js`/`Routes.js` and Mantle's copies, and the runtime's `<public-site>` mounts. A targeted mount (Billing, Supplier: an internal organization) is written only by an operator and kept by a site owner's core save. Recorded in design-forum §13.1 and mr-pass `docs/Deployment.md` for Purchasing P16 and Customer Service's Support app | Agent's call, for review (F371) |
| Oct 31, 2026 | P18: CX-PORTALS record types and who issues their capabilities: an issued customer invoice (`Invoice`, InvoicePay; `RECEIVABLE_EDIT`) and a purchase order past its draft states (`Order`, BillUpload and OrderAcknowledgement; `PAYABLE_EDIT`), in the record's organization; Purchasing P16 adds its own permission for `send#PurchaseOrder`. A contact is an `ExternalAccessContact` grant (account's party, outside party, organization, app), made by redeeming an `invite#Contact` invitation (`RECEIVABLE_EDIT` for Billing, `PAYABLE_EDIT` for Supplier); it holds only on that organization's site and app, and a CRM `PrtContact` gives no portal access (F379) | Agent's call, for review. The design names the capability record's fields, not the permissions |
| Oct 31, 2026 | P18: a supplier's bill is one form (number, date, amount, file): the file is staged under `pass_media_root/bills` and scanned at submission, and becomes the incoming draft's content only when clean; Forum's two-step attachment staging needs a signed-in owner, which a link holder is not (F375). A repeat of the request or of the supplier's bill number answers the first `SupplierBillSubmission`; a bill number AP already recorded is a conflict that names nothing internal | Agent's call, for review |
| Oct 31, 2026 | P18 (revised after the P18 review, F378): the posting guard's user-organization check is skipped only for the one payment a Billing page is completing: Portal.js names it in the execution context's shared map (`PostingGuard.PORTAL_PAYMENT`) around its gateway calls, and the guard lets through a posting whose payment, or whose application's payment, is that one and is paid to the posting organization. Any other posting by no user or a public account keeps the check | Agent's call, for review. It replaces a blanket exemption of source postings by no user or a public account, which the review found too wide |
| Oct 31, 2026 | P18 (revised after review): the demo sets ORG_ZIZI_RETAIL's invoice payment gateway through `store#Preferences` on ORG_ZIZI_CORP, whose preferences ORG_ZIZI_RETAIL inherits (a row of ORG_ZIZI_RETAIL's own, as `store#Preferences` on it makes, lacks the corporation's term and real-time summaries, and OrderToCashBasicFlow and OrderProcureToPayBasicFlow then fail on a database with BOSS's demo), keeping the corporation's error journal; it makes its invoice and purchase order through Mantle's services; its fixed link tokens load only with the demo data | The review's call, on the organization that owns the preferences |
| Oct 31, 2026 | P13: Product360's Accounting context is a branch of `Shared/Product360` by appRoot, on P6's OrderDetail pattern: in the Accounting mount (`Accounting/Records/Product360`) the screen shows a record header and boxes (Summary cards, Costs and history, Source movements, Prices with PRICE_VIEW, GL mappings) and no tab panel, and Products' tabs get an empty `product360Tabs`, since a shared screen's tabs are one list for every mount (F135). `Shared/InventoryValuation` branches the same way: Products' mount keeps the revaluation of an approved estimate, Accounting's adds the valuation report around it (agent's call, for review) | One Product360 with per-app tabs waits for a framework way to choose tabs by mount; a separate Accounting screen would copy the record's header and reads |
| Oct 31, 2026 | P13 landed costs: a charge is a line of a posted bill in the `EngItemsLandedCost` group (`ItemShipping`, `ItemFee`, `ItemMiscCharge`) without a product, credited to the account the bill's posting debited for that line. A receipt's issued share is its accepted quantity less what its asset (and any asset a revaluation split it into) still holds, so stock that left by a count variance counts as issued; it goes to the asset type's issuance account (cost of goods sold), or `GatProductionVariance` when the asset was issued to work. The on-hand share raises the holding assets' cost from the accounting date (forward cost, as a revaluation; no reposting). The preview is stateless: its `inputFingerprint` covers the line, receipts, stock and accounts, and the post takes it with an operation key (PostingOperation). A charge line is allocated once; its correction (reverse and allocate again) is §7 (agent's call, for review) | Design §5 LandedCosts; duty and broker item types are not seeded (§7) |
| Oct 31, 2026 | P13: scrap reasons are `InventoryVarianceReason` enumerations with `enumCode` scrap; Mantle seeds `InVrScrap` and `InVrExpired` (Warehouse P6's `scrap#Asset` uses them). `post#PhysicalInventoryVariance` takes the organization's `VarianceReasonGlAccount` row for any reason first, then the asset type's `scrapGlAccountId` for a scrap reason, else found or shrinkage by sign; with nothing mapped it posts as before, so no flag (agent's call, for review) | impl-warehouse §4 names "a scrap reason" without saying how one is known |
| Oct 31, 2026 | P13: the valuation's close rows (`PccReceiptCostBasis`, `PccValuationTieOut`) are shown without blocking; receipts without a cost (`AtrNoAcquireCost`) move from `PccStockPostings` to `PccReceiptCostBasis`, which also lists zero-cost receipts. The tie-out compares stock at current cost with the inventory accounts at the period's end, for each organization of the close. Manufacturing's GL account types are seeded without a DefaultSettings default: each organization maps them in PostingDefaults, which lists them as missing until then (agent's call, for review) | P11's checklist registry; design §9 CloseChecks |
| Oct 31, 2026 | P13: cost data repair (`AssetBookServices.repair#ProductAcquireCost`, `ACCOUNTING_ADMIN`) rewrites the organization's own inventory assets of a product through `update#AssetAcquireCost`, not `update#ProductAcquireCost`, which takes every owner's assets (F270); it refuses when any posted transaction of those assets is in a closed period, keeps an `AbeCostDataRepair` event per asset with the reason, and is idempotent by operation key (agent's call, for review) | Design §10 CostDataRepair; F39 |
| Oct 31, 2026 | P13 review: a cost data repair is refused when the product's assets have revaluation or landed cost events (`BOOK_EVENTS`, naming the transactions), rather than reversing them within the repair: a repair is rare data correction, and reversing forward-cost postings inside it would hide them (F277). A landed cost follows a receipt's stock through revaluation splits, moves (`AssetDetail.otherAssetId`) and transfer shipments to the organization's other facilities (F279), and splits the issued share by issue kind (F278); its inventory debit is quantity × the unit change at the cost's four decimals, with the rest to cost of goods sold (F280) (agent's call, for review) | Review F275–F287 |
| Oct 31, 2026 | P13 review: a shared screen's context is chosen by `appRoot`, which each app root sets in its always-actions (`Accounting.xml`, `Products.xml`), so a request's `appRoot` parameter cannot select another app's branch; the shared screens keep their `appRoot` parameter for Products' links (F287) | Pattern of Shared/OrderDetail, ShipmentDetail, InventoryValuation and Product360 |
| Oct 31, 2026 | P13 second review, smaller items: stock in transit (a transfer issue not yet received) and a receipt chain over 50 assets are preview findings that keep the landed cost from posting; the repair's `BOOK_EVENTS` refusal says a repair is unavailable for the product until those postings can be reversed (§7); the earlier-day note says a landed cost dated back raised the cost of the stock on hand when posted. Per-holder rounding: each holder's inventory debit is its quantity × the four-decimal unit change, in cents, so the stock value and the account can differ by under a cent per holder and product; the valuation compares at cents and reports such a difference rather than hiding it (agent's call, for review) | Second review of the P13 fixes |
| Oct 31, 2026 | P16: the statements (balance sheet, income statement, cash flow, retained earnings, ratios, account balances) read each period's GL summary rows from `get#ReportBasicInfo`: a closed period's stored rows, an open period's summed from its posted entries by book day when the report runs, with the sums period close stores (`FinanceReports.periodTotals`); a closed period without stored rows is summed and named incomplete | §4's Oct 28 reports row, carried into Mantle's existing statement services rather than reports beside them (F330) |
| Oct 31, 2026 | P16: a report reads the organization's own periods or those of an organization it rolls up to, whose periods it books in (P11's rollup close), always for the organization's own figures; with `childOrgPeriods` the rolled-up organizations' periods each for their own organization. Any other period is refused (`PERIOD_UNAVAILABLE`) | Agent's call, for review: "its own" read strictly refused P11's child reading the parent's closed year (F331) |
| Oct 31, 2026 | P16: `run#SalesAnalysis` reads the organization's sales orders, their issuances, its issued sales invoices (by book day) and returns, grouped by product, customer or customer class, each read capped at 2,000 documents and named. The search-backed `get#Sales*Summary`, `get#SalesTopProduct` and `get#InvoicesByCustomerClass` stay for their callers, the last two with an organization filter | Agent's call, for review: those summaries need the sales index kept current, which not every deployment has (MantleSearch is a baseline failure), and "each report runs for the demo organization" needs the records (F333) |
| Oct 31, 2026 | P16: a statement prints and exports the list it shows: `ReportServices.get#Statement` shapes Mantle's class tree into one list of class, account, total or ratio rows (indent by level), Print renders the same screen in `html-print` and the list's CSV and XLSX export the same rows. A ratio whose denominator is zero is unavailable, not Mantle's zero | Design §13: "the form-list result is the exported dataset" |
| Oct 31, 2026 | P16: Home's money cards are as of today in the base currency: receivables due and overdue and payables due from `run#Aging`, the bank balance and open bank lines from `find#BankAccounts`, the fiscal year's unposted documents from the close check; MyFinanceWork lists bills awaiting approval and on hold, journal batches with entries that did not post, blockers to closing the last ended open month (fiscal close only) and the user's collection follow-ups, each with its count and the list that resolves it, a failed source unavailable | Production runs awaiting cost close come with Manufacturing's cost close (§7) |
| Oct 31, 2026 | P19: a chart template is an organization with the `OrgAccountingTemplate` role (DefaultSettings carries it) and an accounting preference. An organization has one setup run (`AccountingSetupRun`, unique by organization), its opening trial balance in `AccountingSetupBalance` and its last import's refused rows on the run (`lastImportJson`); `runVersion` rises with each change and activation takes it | (agent's call, for review) The plan named only AccountingSetupRun. The alternatives were a role-less flag on PartyAcctgPreference, and the lines and results as JSON on the run |
| Oct 31, 2026 | P19: an open item is issued through `update#Invoice` (finalized or approved, so the posting and due schedule SECAs run), not `change#InvoiceState`: no tax calculation, approval workflow, self-approval or budget conversion for a document already issued in the old books. A bill is imported approved, which the status flow's transition limits to `INVOICE_APPROVE` (F391) | (agent's call, for review) `change#InvoiceState` would tax the imported line and refuse the importer's own approval |
| Oct 31, 2026 | P19: the posting guard is a readiness blocker (opening items and balances post on the opening day under its period and lock checks), and Setup turns it and single-currency documents on for an organization it sets up | (agent's call, for review) Without the guard an opening item would post on its document date |
| Oct 31, 2026 | P19: readiness blocks on the basis, chart, open periods, guard, migration and control accounts, WIP and transfer accounts with a costing basis, documents or prices in another currency, unbalanced lines and untied open items; it warns of mappings to summary accounts (F71, F251), mapped accounts not in the chart (F190, F250, F271), no tax gateway, no bank account, an unpaused `send_SalesInvoicePastDueEmails`, single-currency documents off and entries already posted (the opening balances add to them). DefaultSettings is not changed for F271 (assigning 512000000 there collides with the demo and specs that assign it) | (agent's call, for review) Blocking on the template's own mappings would block every organization set up from it (F393) |
| Oct 31, 2026 | P19: Setup's last step activates with the wizard's own finish button (Activate accounting), as the Projects and Contacts imports finish, without a confirmation dialog; the review step says it posts once and is not changed afterwards, and a repeat answers the first result | (agent's call, for review) The wizard has no confirmation on its finish button; a dialog in the step would leave the finish button doing nothing |

| Oct 31, 2026 | P19 review: an organization that inherits its accounting preference through its rollup is configured: Setup makes a setup run for it without a template and keeps the parent's basis (a change goes to the parent; `BASIS_INHERITED`) (F396) | The alternative, giving it its own preference, ends the rollup's shared configuration |
| Oct 31, 2026 | P19 review: a credit memo allocated over an open item's lines posts to the account the organization maps to the Opening balance item type for the side (PostingDefaults, invoice item types), and is refused without one; never to migration clearing, which nets to zero once activated (F403) | (agent's call, for review) The alternatives were the side's sales or purchase account, which DefaultSettings maps to a summary account (F71), and the migration account |
| Oct 31, 2026 | P20: conversion is one step in `post#AcctgTrans`, before the guard, for every organization with a base currency (no flag: a base-currency posting reads one row more and posts as before). A transaction converts at the rate it carries, which the invoice and payment auto-posters pass from their document; a document's own posting re-posted at its document's rate (F423); a posting of an asset's cost at the rate its asset kept from its first posting (F417: receipt, issuance, variance and issuance delta, so the inventory account clears; another currency than the asset's cost, or several assets in one posting, is refused); an application at its documents' rates (F418); an adjustment's control line cumulatively (F419); else at the rate of its book day; the rate in effect on a day is the last that day in the user's zone, the pair's own dated rate, else the inverse of the opposite pair's. A document keeps the first rate it posts at (`exchangeRate`, date, source, target currency on Invoice and Payment), so its adjustments and applications use it and later rate changes affect later documents only. Each side of a transaction is trued up on its largest line, so a control line holds exactly its document's total at the rate (agent's call, for review) | The alternatives were converting in each auto-poster only, which leaves manual, asset and other postings unconverted, and one rate per day for every line of an application, which books no realized difference |
| Oct 31, 2026 | P20: realized exchange is booked by `post#PaymentApplication`: each document's line is what brings its cleared total (over its posted, unreversed application postings) to the cleared amount at its kept rate, so an invoice paid in parts clears exactly what it posted, and the difference of the two lines is `GatForExGain` (credit) or `GatForExLoss` (debit), mapped in DefaultSettings to 817000000 and 797000000. A payment in another currency posts unapplied, never with Mantle's full single-application shortcut, so every application books its difference. A missing rate or exchange account is refused with the guard on and held in the error journal without it; `change#InvoiceState` refuses either way, since the posting must complete (agent's call, for review) | The alternative was rounding each application at the invoice's rate alone, which leaves cents on a part-paid receivable (F413) |
| Oct 31, 2026 | P20 review (F420): rates being global, their writers (`store#Rate`, import, accepting a proposal) check `Currencies.ratesAdmin`, finance administration of every internal organization or system administration; `refresh#Rates` and rejecting stay with the organization's finance administration. ACCOUNTING_ADMIN is unscoped in AccountingPolicy, so this names the rule rather than narrowing today's users (agent's call, for review) | The review asked that organization-scoped administrators only fetch and propose; no such scope exists yet |
| Oct 31, 2026 | P20: the rate is decimal text (`exchangeRate`, up to 12 places) on AcctgTrans, Invoice and Payment, since `number-decimal` keeps 6 places (F412) (agent's call, for review) | The alternative, a 6-place decimal, loses about 0.006% on a yen rate |
| Oct 31, 2026 | P20: `refresh#Rates` calls the service an `ExchangeRateProvider` enumeration names (enumCode), held in `PartyAcctgPreference.rateProviderServiceName` and accepted by `store#Preferences` only from those enumerations, so no other service can be named; the ECB provider (`get#EcbRates`) fetches the daily file or reads a copy given as `sourceText` (a server without outbound access; the specs and walk). A refresh proposes a `CurrencyRateProposal` per currency of the organization's invoices and payments (or chosen), a cross rate through the euro to the base currency; accepting stores it through `store#Rate` in its own transaction; the same pair and day answers its proposal. The demo organization names the ECB provider; nothing is fetched at load (agent's call, for review) | §4 Oct 28 names the provider field and the acceptance; the enumeration, the uploaded copy and the proposal record are this build's |
| Oct 31, 2026 | P20: the settlement workbench, the payment lifecycle drafts, payment runs, internal transfers, landed costs and credit exposure keep their base-currency (or policy-currency) refusals; a document in another currency is paid through Mantle's payment and `apply#*` services. `singleCurrencyDocumentsOnly` is removed with its refusal and AccountingPreferences field (D18) (agent's call, for review) | Each compares document amounts with posted amounts; their foreign-currency forms are §7 |
## 5. Open questions

| Question | Decides | Notes |
| --- | --- | --- |
| Further issues discovered during implementation | the affected phase | Record findings and decisions here; the open questions of the plan as written are decided in §4 |
| Should the order status writes that bypass `approve#Order` (OrderBulk's `change#OrderPartsStatus`, Projects' estimate approval in `ProjectServices`) check credit too? | Sales and Projects, with P10's `evaluate#OrderCredit` | F210: today they approve without the credit check; an organization without a credit policy is unaffected. OrderBulk can also move a held order to Approved and leave its hold reasons open: `approve#Order` then refuses it (`ORDER_HOLD_OPEN`) until they are released |
| In which zone is a pack invoice's ship-day book day taken: the user's who ships (as now, `EntityLib.bookDay`) or the organization's? | P17, with P16 and P20 | The book day follows the user's zone everywhere today; an organization zone is a wider change |
| Which permission opens the search-backed sales summaries to BOSS's Sales app, now that they need report read (F338)? | Sales, when built | Today ADMIN passes; BOSS_SALES_ADMIN users get a refusal on Sales/Reports/SalesSummary until their group holds ACCOUNTING_VIEW or a sales read permission the services accept |
| Should a draft invoice show its sales tax before it is finalized (a Calculate tax action, or a calculation on each line change)? | P14 follow-up, with P6 (`store#InvoiceDraftItem`) | P14 calculates at finalize or approve only (§4) |
| When two approved budgets of an organization cover the same account and day (an operating and a capital budget), which does spending count against? | P15 follow-up, with Purchasing | P15 takes the first by id (F315) |
| Where does an internal user invite a customer's or supplier's contact to Billing or Supplier? | P18 follow-up, with Customer Service's ContactDetail (its P15) | `invite#Contact` is built and the demo uses it; no BOSS screen calls it yet (Customer360's and Supplier360's finance details are candidates) |
| Should InvoicePay offer the issued invoice's PDF? | P18 follow-up | Crosscut §5 lists the PDF for the external payer; the page shows the invoice's lines and totals, and the PDF is the email's attachment |
| Exchange rates are global `UomConversion` rows (P3): should rates be per organization? | P20 follow-up, with multi-organization deployments | Until then (F415, F420) `store#Rate`, the CSV import and accepting a proposal need finance administration of every organization (`ACCOUNTING_ADMIN`, which AccountingPolicy scopes to every internal organization, or a system administrator); fetching and proposing need the organization's finance administration. Per-organization rates would need a rate scope on `UomConversion` |

The design's other §20 items are `later` there and in §7.

## 6. Findings

Design assumptions found wrong or unstated in the code, with the resolution. Where a resolution changes the
design, it is written there too. R2 deleted much of what P4–P5 built: where a resolution of F78–F112 describes
that code (the archive, Drive and source guards, the legacy fence, the gateway attempts and reservations, the
adoption flags), F115–F126 and R2 say what stands.

| # | Finding | Resolution |
| --- | --- | --- |
| F1 | P0: `screen/Accounting/` has nine placeholders: Home, Receivables, Payables, Banking, GeneralLedger, Tax, Budgets, Reports and Settings. There are no Payments, PeriodClose, FixedAssets, Inventory, Records or Approvals areas, and the root has no `<shell-providers>`. The `BOSS_ACCOUNTING` authz is in BossSetupData's commented not-yet-implemented block | P1 |
| F2 | P0: `Shared/InvoiceDetail` and `Shared/OrderDetail` are mounted by Projects only and do not branch on `appRoot`. InvoiceDetail's `invoices` transition, its print and PDF URLs and its email attachment name Projects' screens. Projects' `update#InvoiceStatus` covers client invoices only; its `send#Invoice` approves a draft, sends the `BOSS_PROJECT_INVOICE` template with the PDF and marks the invoice Sent | P4 adds the context on `Shared/RequestDetail`'s pattern and a shared invoice print; Projects' services call Accounting's |
| F3 | P0: AppStructure's non-placeholder list is fixed at Commons, Comms, Insights and Projects, and its placeholder floor is 97 | P1 adds Accounting and lowers the floor |
| F4 | P0: BOSS has no Customer360, Supplier360, ShipmentDetail, ReturnDetail, EquipmentDetail, Product360, InventoryValuation or Approvals screen. Products builds Product360 (its P2), Supplier360 (P6) and InventoryValuation's two dialogs (P9) | Accounting builds the rest with its context (§2); it extends Products' |
| F5 | P0: `MANTLE_USER_ORG` and `MANTLE_ACTIVE_ORG` filter Invoice and Payment (from or to party), AcctgTrans and FinancialAccount (organization), TimePeriod, ReturnHeader, Shipment and OrderPart. Nothing filters InvoiceItem, PaymentApplication, AcctgTransEntry, GlAccount, GlAccountOrganization, PaymentMethod, PaymentMethodTrans, Budget, TaxStatement or Asset | Those are read through services that check the organization (§2); the root's filters are the organization filters (§4) |
| F6 | P0: Mantle's ledger report services check no access. `get#GlAccountClassReportInfo` filters by period only, not by organization; `get#SalesTopProduct` and `get#InvoicesByCustomerClass` take no organization; the ledger reports are on Mantle REST | P1 grants no REST ledger path; P16's report runs in Mantle check the organization and its periods |
| F7 | P0: the demo runs `init#PartyAccountingConfiguration` for `ORG_ZIZI_CORP` (with `realTimeGlSummary=Y`); `ORG_ZIZI_RETAIL` has no preference of its own and inherits through its rollup. Periods exist only for the load year and the next, and no accounting transactions are seeded | P1's demo data builds on it and runs its postings through a demo service |
| F8 | P0: the framework has no operation-key helper (only AgentRun's `clientRequestId`); payments have no idempotency key, `paymentRefNum` is not unique, and `create#InvoicePayment`'s only duplicate guard is a covered total | One operation record (§4); P5 is the first heavy user |
| F9 | P0: `post#AcctgTrans` checks the balance, `disallowPosting`, the scheduled date and every fiscal period of the date for `isClosed` (bypassed by `forcePost` with `GL_POST_CLOSED`), and diverts failures to the error journal. It checks no organization, currency or lock date, and `verifyOnly` already moves a failed transaction to the error journal | P2a adds the guard and fixes `verifyOnly`; no BOSS group gets `GL_POST_CLOSED`; a failure is refused or goes to the error journal by its source (§4) |
| F10 | P0: an auto-poster that finds no GL account sets the error journal itself, without calling `post#AcctgTrans`, and still records `AtrSuccess` on a stock movement | P3's MissingMappings and P11's checklist list the error-journal transactions; P13 lists the movements |
| F11 | P0: `update#AcctgTransPosted` checks nothing and can change a posted transaction's organization or type. `unpost#AcctgTrans` and every `repost#*` (invoices, payments, receipts, issuances, variances, assets) unpost and hard-delete the posted transaction, so each fails in a closed period. `AssetIssuanceGlRePost` runs on any AssetIssuance update | No BOSS group is granted them (P1); P2a's `update#PostedMetadata` and `repost#AssetIssuance` delta |
| F12 | P0: `post#ReverseAcctgTrans` keeps the original's transaction date, and marks the original reversed even when the reversal lands in the error journal | P2a adds a reversal date (Mantle's default unchanged) and marks only a posted reversal |
| F13 | P0: `check#NextFiscalTimePeriods` assumes a calendar fiscal year; `fiscalYearStartMonth` and `fiscalYearStartDay` are read nowhere. `get#OrganizationFiscalTimePeriods` creates periods when it finds none | P2a follows the organization's start; P19's Setup sets it |
| F14 | P0: GlAccount is global, with a unique digits-only `accountCode`. `GlAccountOrganization` has no dates or active flag. `set#GlAccountFlags` always overwrites `isDebit` and `isTemporary` | P2a adds the dates; chart templates are template organizations (§4, P19) |
| F15 | P0: `AcctgTransEntry` has `productId` and `assetId` but no facility or cost centre; `AcctgTrans.workEffortId` is never set by an auto-poster; the `COST_CENTER` GL account category type exists and is unused | P2b and P6 add the dimensions; the cost centre stays a Party (design AC-22) |
| F16 | P0: `GlAccountOrgTimePeriod` has no currency and is kept live only with `realTimeGlSummary=Y`; `recalculate#GlAccountOrgTimePeriodAmounts` fixes existing rows and creates none | Closed periods' rows and open periods' live sums (§4); P20 keeps one currency per summary |
| F19 | P0: Mantle converts no currency. Every poster writes the document's currency as the transaction's, the GL summaries add currencies together, the original and local currency fields are never filled, `post#PaymentApplication` books no FX, and `GatForExGain` and `GatForExLoss` exist with no default mapping. `get#ReceivableStatementInfo` mixes currencies | P4's refusal (D18), statements by currency; P20 |
| F20 | P0: `moqui.basic.UomConversion.conversionFactor` is a float; no currency rates are seeded and Mantle reads none | P3's Currencies; P20 stores the decimal rate on the document and the transaction |
| F21 | P0: `send#InvoiceStoreEmail` needs a ProductStore and its email template, returns silently without one, and sets the invoice Sent | P4's `send#Invoice` |
| F22 | P0: `create#InvoiceCreditMemo` makes one reversed-party item, not linked to the original or applied to it; `reverse#Invoice` refuses an invoice with applications | P4 links and applies the credit memo |
| F23 | P0: Mantle's write-off status is reached only from Payment Received, which a SECA refuses while anything is unpaid; there is no payable write-off | P5's write-off is a posted adjustment to its account |
| F24 | P0: `autoApply#Payment` and `autoApplyTo#Invoice` are empty stubs (Remaining-Work lists the first) | P5 implements `autoApply#Payment` |
| F25 | P0: the pack SECA calls `create#SalesShipmentInvoices` with `applyPayments` defaulting to true, which finalizes the invoice, and so posts it, at pack. D3's `release#ShipmentDraftInvoice` assumes it is still in process | Behind D3's flag the invoice is finalized at ship (§4, P17) |
| F26 | P0: `create#PurchaseShipmentInvoices` bills each receipt's accepted quantity, then a leftover line with no asset for what was shipped and not accepted, and every non-product order line in full on the first shipment's invoice. It has no `acceptedOnly` | P6 adds `acceptedOnly` |
| F27 | P0: Mantle's flow specs assert the behaviors D2, D3 and D11 change: OrderProcureToPayBasicFlow the SECA's purchase invoice with its freight line, OrderToCashBasicFlow the pack invoice paid, ReturnToResponseBasicFlow the responses. Six specs assert posted amounts | Each change sits behind its own flag, off by default (§2, §4); the specs pass unchanged |
| F28 | P0: the due date is set by the `InvoiceSetDueDate` EECA: the invoice's term, else the newest agreement term, else PartyAcctgPreference's for a receivable only | P6 adds SupplierProfile's term for a bill |
| F29 | P0: there is no SupplierProfile, no OrderHoldReason (OrderHold is only an order status) and no external access capability; the nearest are the unsubscribe tokens and the forum's access grants | P6, P10 and P18, under the owners' names (§4) |
| F30 | P0: `update#BankAccount` copies a non-internal owner's bank account to a new payment method and expires the old one | P8's approval void keys on the supplier |
| F31 | P0: there is no internal-transfer payment type; `Payment.toPaymentMethodId` exists | P5 seeds `PtInternalTransfer` |
| F32 | P0: `import#NachaReturn` sets a delivered payment Declined; nothing reverses its posting or unapplies it | P8 |
| F33 | P0: BAI2 has no transaction id, so `upload#BaiVersion2` numbers lines from a sequence and a re-import duplicates them; OFX skips a known FIT id. `PaymentMethodTrans` has no currency or statement id. `match#PaymentMethodTransUnmatched` takes the first match. `GlReconciliation` is used by no service | P9's line identity, sessions and rules; GlReconciliation stays out (design §18.2) |
| F34 | P0: `check#OrderPreApprove` answers `approveWarnings`, which a post SECA can add to; `autoApprove#Order` approves only with no warnings and payments covering the total | P10 as designed |
| F35 | P0: `process#ReturnItemResponses` returns without responding for a purchase return (customer is an internal organization). `ReturnApprovedProcess` runs it at approval for immediate-response items. `ReturnItemBilling.assetReceiptId` is never filled | P17: the supplier branch is new code; settlement fills the receipt |
| F36 | P0: `InvoiceAgingSummary` buckets against today, with no as-of date. Its H2 expression has the opposite sign of the others, a 121-day-old invoice falls in no bucket, and its role joins can multiply sums | P10's `run#Aging` takes the as-of date; the view is fixed in Mantle |
| F37 | P0: `close#FinancialTimePeriod` counts every organization's unposted transactions and creates no closing entries; `create#PeriodCloseAcctgTrans` takes the first NET_INCOME account of the chart; `reopen#FinancialTimePeriod` ignores a closed parent | P11 |
| F38 | P0: depreciation needs a type, cost, acquired date and expected end of life; useful life is whole years between the dates; units of production is a TODO; `post#FixedAssetDepreciation` writes the depreciation row and accumulated amount even when the transaction went to the error journal; `calculateAndPost#AllFixedAssetDepreciations` dates a day early. Asset classes are an enumeration | P12 |
| F39 | P0: `update#AssetAcquireCost` calls `repost#Asset`, which deletes and re-posts every receipt, issuance and variance transaction of the asset and fails in a closed period; `update#ProductAcquireCost` loops it | Finance-admin data repair only, in an open period (P12, P13) |
| F40 | P0: `AssetValuationSummary` values on-hand quantity at each asset's current cost, not from the GL. A zero-cost receipt posts zero. `cogsMethodEnumId` is read by no service: posting is always actual cost. There is no scrap account. An issuance to a work effort another party owns posts to COGS | P13 sets the valuation beside the accounts and lists the exceptions; P3 shows the COGS method as it is; design §10 and §18.2 corrected |
| F41 | P0: `TaxAuthorityRate` is commented out, its relationship keyed by a composite that is not TaxAuthority's key. `calculate#SalesTaxLocal` only logs; `calculate#InvoiceSalesTax` is empty. Tax lines post through `ItemTypeGlAccount`; `TaxAuthorityGlAccount` is unused. `ItemVatTax` is not left out of totals. The 1099 selection is by invoice date over 600, with no eligibility flag | P14 |
| F42 | P0: Budget has no organization (its period's party is), and its status type has no items or transitions. Sub-period entry covers twelve periods. `run#BudgetExpenseReport`'s actual is posted debits of expense accounts only; the detail report is invoice-based. No budget service checks status or permission | P15: the status flow, `change#BudgetState`, `revise#Budget` and the commitment services check status and permission; `run#BudgetVariance` nets credits (F310, F311) |
| F43 | P0: approvals are NotificationTopics with approve and refuse services; there is no provider registry. Commons Notifications filters by `appName` | P6's mount, filtered by topic list (§4) |
| F44 | P0: MoquiConf `<token-route>` is generic: a token service answers `valid` and a route context, and the screen gets the token. Crosscut §5 names `/pay` for InvoicePay and no route for bill upload | P18. The customer and supplier links are pages of the PASS apps taking their tokens, not `<token-route>`s (§4); the bill link is the PO's (§4) |
| F45 | P0: impl-projects §7 hands project cost posting (`post#WorkEffortCost`, an empty stub) and a link to Mantle budgets to Accounting; design-accounting names neither | P11 builds the posting (§4); the budget link is §7 |
| F46 | P0: Projects' invoices check no currency (impl-projects F91), and its approve finalizes and posts | P4's `change#InvoiceState` applies D18 to them too |
| F47 | P0, Products' state: Products P9 (mr-mantle 5a18970e, mr-boss 2a4abd6) built parts this plan proposes. `mantle.ledger.transaction.PostingOperation` is §4's CX-POSTING record (key, type, organization, user, request hash, preview fingerprint, status, result). `mantle.product.asset.AssetBookEvent` is create-only, with ledger and reversal links. `mantle.ledger.AssetBookServices` holds the revaluation, behind `PartyAcctgPreference.inventoryRevaluationEnabled`, posting `AttInventoryRevaluation` against `GatInventoryRevaluation`, read from `GlAccountTypeDefault` and mapped only for `ORG_ZIZI_SERVICES` in BOSS's Products demo. BOSS's `ironstone.accounting.AssetBookServices` passes its four services through to Mantle's, and InventoryValuation's dialogs call those | P2a and P5 post through PostingOperation; P12 adds its event types to AssetBookEvent and its services to AssetBookServices; P3 maps the offset type for Accounting's demo organization. The dialogs call Mantle directly, and BOSS keeps only `get#RevaluationContext` (Products' fix) |

| F48 | P0 Oct 29: `mantle.rest.xml` exposes invoice and payment create/update/apply/cancel/gateway operations and GL create/update/delete/post/reverse/period mutators. Accounting root authorization does not grant the REST screen. | AccountingAccess exercises REST with authorization enabled; no Accounting REST grant is added. |
| F49 | P0 Oct 29: `MantleInvoice` exists in MantleDocumentData; payment, GL account and accounting transaction documents do not. | P1 adds the three documents and access-checked palette sources. Global accounts are visible only through an authorized organization's assignment. |
| F50 | P0 Oct 29: there is no inspection quantity model or source-inspection service in Mantle. | P7 must not invent a successful zero-inspection result: CX-QUALITY is a future owner contract, with received/accepted quantity as existing evidence and an explicit unavailable inspection check. |
| F51 | P0 Oct 29: AccountConfigData installs TEST_APPROVE and TEST_DECLINE; PaymentTestServices also has card/expiry/NSF failures, but no durable pending-provider fixture. | P18 adds a deterministic pending/completion fixture; no gateway runtime change in P0–P3. |
| F52 | P0 Oct 29: PublicSiteApp has targetId, but Forum's mount writer accepts only forum/account/members/sites and does not persist targetId. Readiness and URL builders are Forum-specific. PASS uses Schema/Routes and Mantle PassRoutes allowlists; invitations bind a verified recipient, not employee groups. Media is staged/scanned before record finalization. | P18 adds Billing/Supplier mounts, typed organization targets, operation schemas, readiness, record finalizers and canonical page URL builders; its contract is recorded in mr-pass/design-forum. |
| F53 | P0 Oct 29: Pass.xml has form-action self and frame-ancestors none. Hosted gateway form posts therefore need a reviewed provider-specific policy; return URLs must remain local validated paths. | P18 retains the CSP by default and tests hosted redirect, pending and decline paths without arbitrary return URLs. |
| F54 | P0 Oct 29: Products' Product360, Supplier360, standard costs, PostingOperation and native forward revaluation exist. Its old BOSS AssetBook wrappers still exist in this checkout. | Reuse native operations and the shared posting record; extend the Accounting contexts in their assigned later phases. |
| F55 | P0 Oct 29: move#AcctgTransEntry refuses drafts and creates a correction transaction for posted entries. | P2 adds move#DraftLine; the draft editor must not expose the posted adjustment primitive. |

| F56 | P2: PostingOperation keys are existing 40-character identifiers. | Reviewed external keys are bounded at 40; derived batch/source identities use deterministic hashes that fit the existing record. No parallel operation table was introduced. |
| F57 | P2: invoice/payment missing-mapping branches bypassed post#AcctgTrans; operational posters could set AtrSuccess without a posted transaction. | Adopted direct financial posts refuse missing mappings atomically. Adopted stock/financial-account sources retain the unposted error journal and AtrPostingFailed, with a stable failure code. Legacy defaults remain unchanged. |
| F58 | P3: invoice item enums use ItemType; variance reasons use InventoryVarianceReason. Product invoice mapping resolves category before product, then asset-type and item defaults. | Server choices and mapping-precedence text use the installed native contracts; missing item defaults are checked through get#InvoiceItemGlAccount. |
| F59 | P3: PaymentGatewayConfig is global and contains executable service names. | PaymentGatewayOrganization is an audited external provisioning boundary. Finance returns only active organization-permitted gateway IDs/descriptions, and no credentials or executable fields. Existing method identifiers remain masked. |
| F60 | P3 browser verification: the remote choice widget discarded loaded options when a parent form rerendered its empty seed array, then cleared a selection outside the first search page. | The existing widget preserves the loaded selection across renders/search pages; a changed dependency still clears it. QvtKeys and the Accounting mapping-repair walk exercise the contract. |

| F61 | Review Oct 29: Home's and the Settings screens' Choose organization form posted to `selectOrganization`, which no screen had: a `transition-include` copies one named transition, and only `choices` was included | Each screen includes both; AccountingShell posts the picker on Home and Settings |
| F62 | Review: deleting a draft went back to JournalEntries with the deleted id, which the list declared as a parameter and filtered by, so the list was empty | The list declares only what it reads; a spec checks the response's Location |
| F63 | Review: Accounting's choices searched case-sensitively, ignored the term for journals, batches, templates, locks, periods, users and groups, and filtered in JavaScript after `limit`; the `parties` choice called `makeCondition(field, value)`, which this framework reads as field and operator, so the new-document Customer/Supplier drop-down always failed; Mantle's list search matched only ids | `choices` is a table of sources searching their names in the query, ignoring case; Mantle's `query` matches names and descriptions. A spec calls every choice with a selected value outside the page |
| F64 | Review: the palette's record links checked BOSS group names; finance reads were "holds any finance permission", so Projects' managers, who hold `RECEIVABLE_EDIT` to bill, could read receivables and payments | Mantle seeds `RECEIVABLE_VIEW`, `PAYABLE_VIEW` and `PAYMENT_VIEW`; a kind reads from its view permission or `ACCOUNTING_VIEW`, an edit permission alone opens nothing, and BOSS grants the views to AR, AP, treasury and admin. The palette uses the permission-derived capability. Specs in both repositories (decided with the user) |
| F65 | Review: AccountDetail overwrote the report's account filter with its own account, and the GeneralLedger report's links dropped it | Report links carry the report's options; AccountDetail's account is `recordId` |
| F66 | Review: JournalEntryDetail and AccountDetail read their record in `always-actions`, which run for every `choices` request, and failed the page for a missing record; Publish showed on a published template; a batch could be posted without its review; row dialogs had fixed ids | Records are read in `actions` with a Not available state; actions follow state; posting is from the review only; row dialog ids carry the row key |
| F67 | Review: AccountingControls' "opt-in issuance adjustments" built its hard lock date with `toISOString()`, a UTC day, so it locked today from evening on in the Americas and failed (reproduced at the committed code) | The date is formatted in the user's zone |
| F68 | Review: a widget that fails renders its error into the output, not `errorMessages`, so the status-only Accounting specs passed broken pages; negative access helpers counted any error, including validation errors, as a refusal; a "reader sees no New batch" check named a button that did not exist | Specs check rendered text and render errors, pair negative cases with positive ones, and check controls present for the users who have them |
| F69 | Review: the screens copied a 12-parameter block and 7-parameter responses, faked one page with about 60 hand-set page fields, duplicated invoice/bill/payment screens and PostingDefaults' Add and Edit forms, and loaded `Accounting.js` to format dates | `template/AccountingParts.xml` and `AccountingDocuments.xml`; services page their lists and return display text (`AccountingPolicy.display`), party and status names |
| F70 | Review: the BOSS Accounting scripts and specs used Prettier's defaults rather than the documented style, and the screens a different XML formatter and a one-line license header | Reformatted; `.prettierrc.json` at the mr-moqui root; full headers restored |
| F71 | P4: the installed generic `ItemSales` mapping points to a non-postable summary account; using it in the finalized demo caused the whole demo data file to roll back | Demo and consulting walks use the valid `ItemTimeEntry` mapping. P19 readiness must identify non-postable mappings explicitly; no global chart remapping is assumed |
| F72 | P4: legacy customer credits reverse the parties, which made them appear payable and selected purchase-side expense accounts | Native guarded credits retain their financial side and original source account allocations; common lists, links and posting lock scopes use that side |
| F73 | P4: an invoice timestamp near midnight displayed as different days to its creator and approver, changing the typed lock day | New invoices capture an audited SQL DATE `accountingDate` from the creator's chosen day. Adopted original postings persist that day; locks, summaries, rebuilds, unpost/repost, trial balance, ledger and issued output agree. A later effective reversal uses its own day. Existing posted legacy rows remain undated and retain their original timestamp semantics |
| F74 | P4: QVT prepares form metadata even when a record's section is hidden; a null invoice context still dereferenced its currency | Detail and shared contexts normalize safe empty maps after computing record availability; unavailable records are covered in QVT and TUI |
| F75 | P4 review: the design names invoice budget links, but this Mantle checkout has no InvoiceItemBudget entity or invoice-line budget keys; PaymentBudgetAllocation links payments only | Invoice Budget details reports unavailable evidence. P15 supplies the invoice commitment model; no fictitious link or financial writer is introduced in P4. P15: Budget details shows the invoice's commitments (BillDetail has the tab too) |
| F76 | P4 visual review: EntityAuditLog stores new SQL DATE accountingDate changes as epoch text, which the generic invoice History values display without formatting | P21 output finishing formats typed audit date values and status/user labels; source audit evidence remains unchanged |
| F77 | P4 visual review: an unusually long invoice ID makes the 390px HTML print slightly wider than its viewport, and its Description heading can wrap mid-word | P21 output finishing refines narrow-screen print wrapping; the exported PDF and actual monetary values remain correct |
| F78 | P4 review: generic Files removal and resource-only version replacement could mutate an issued archive even when its InvoiceContent row was guarded | Durable PDFs/supporting copies live outside mutable record folders. Native content invariants protect identity/removal and equivalent DbResource aliases before writes; generic Files respects immutable rows and native per-side edit authority |
| F79 | P4 final visual review: Quasar Files list captions and neutral controls inherited light-mode colors in dark mode; a nested conditional spec branch also had bare expressions that did not assert | Shared RecordFiles passes the active theme to its list/item hosts. Actual issued rows pass unchanged text/control contrast thresholds after theme transitions finish. Client isolation branches now explicitly assert their permission and omission checks |
| F80 | P4 repeated walk: legacy sole-store fallback advances an invoice from Finalized to Sent asynchronously after its Send form reads the timestamp | Send submits the already-supported exact financial source fingerprint and selected attachment versions, without its redundant timestamp. Native eligibility, organization and revision checks remain strict; header/item/state writes retain timestamps. Regressions prove status-only advancement succeeds and changed financial fields refuse before durable output or mail |
| F81 | P5a: actor-formatted legacy document dates could allow October settlement against an undated source or target actually posted in November UTC | `AccountingPolicy.postingDay` uses persisted SQL days, otherwise the unchanged UTC ledger timestamp day. Preview evidence and locked confirmation include every original source/target posting day, including adjustment-only targets; earlier settlement refuses. Undated reversals cannot borrow an invoice's earlier SQL day |
| F82 | P5a: legacy/raw application writers can race a reviewed settlement or skip period checks when no extra application GL is needed | Separately adopted `settlementApplicationGuardEnabled` serializes organization/documents/applications/original postings before all application writers, checks balances and dates, and captures currency/day on new adopted rows. Existing history is not backfilled; default-off fields and audit behavior are covered independently |
| F83 | P5a: restoring only part of a receipt already posted directly to its invoice changes open items without a matching GL movement; overstated imported payment amounts can also exceed their actual backing | Direct restoration requires the entire available balance to its actual original invoice with consistent history. Shared signed control proof checks actual original cash against its document; genuinely unapplied cash still permits partial applications. Native and generic writers share the history/control rules |
| F84 | P5a: unpost/reverse/move and raw header/entry writes could invalidate already consumed source backing; a raw delete could disguise a positive stored application with an unsaved zero | Applied sources retain their original postings until unapplied. Raw reversal construction is guarded too. Application identity/dates are immutable, zero reactivation refuses, and deletion locks/rechecks the actual stored row, ignoring unpersisted financial changes |
| F85 | P5a: cached invoice totals and an arbitrary first-200 cutoff lose eligible open items; PostgreSQL does not accept a numeric currency scale in `ROUND` | SQL views aggregate rounded invoice lines and both application sides before filtering/counting/paging. The currency scale is an integer. Four typed lists page independently; selected revisions stay available outside a search page, without silently refreshing reviewed versions |
| F86 | P5a full gates: its original fixture prefix collided with P4; legacy ClientBilling cleanup encountered the newly inherited adoption flag and left Projects data behind; a nested role helper reset callers to system administration | P5 fixture identities are distinct. The legacy projection spec explicitly selects default-off behavior and restores the exact inherited flag in cleanup's `finally`. Nested role helpers restore their calling identity; Treasury's valid negative and AR positive use the same payload |
| F87 | P5a full gate exposed an existing variant-policy timing race: its default effective time was compared against a second, later clock read | `CatalogSettings.storeVariantSettings` captures the clock once and keeps default revisions strictly ordered, matching the catalog-policy writer. Explicit backdated input still refuses without changing policy history |
| F88 | P5a browser correction: saved error parameters for a failed preview form overrode its current computed draft after an adjustment account was corrected; the row and URL were current while both form field sets were stale | The computed-only preview action uses the existing hidden-form POST link with current `workbench.editParameters`. The browser regression inspects the actual submitted hidden draft before review and application; no global editable-form watcher, forced Vue state or reload bypass is used |
| F89 | P5a browser navigation: Back to selection inherited the current preview ID from the destination's declared parameters and rendered the old review again | Selection links explicitly clear retained preview/operation IDs, and Clear selection also clears its draft. Original selected revisions, amounts, account/reason, filters and fixed dates remain retained |
| F90 | P5b1: joined payment views do not retain the authoritative Payment stamp, and cached totals can miss actual applications | Native revisions use the base Payment and authoritative application/posting/method evidence; filtered reads use narrow scoped projections |
| F91 | P5b1: a direct legacy application can share its header invoice with unrelated receipts; reviewed cash corrections still meet the manual-posting gate | Cash-source dependencies retain their own applications. Only exact reviewed state/unapply controllers join the existing PostingGuard validation; an identical Treasury actor's unreviewed Ledger reversal still refuses |
| F92 | P5b1: content metadata alone cannot make issued bytes immutable | Native guards protect DbResource identity, files/history, blob metadata/chunks and immutable output/content links; ordinary supporting files remain mutable |
| F93 | P5b1: drive/search/public tokens and another record's content pointer could expose a private issued archive | Native URI access guards and canonical cross-record filtering protect each path; generic resource search gains optional subtree exclusions before search limits, preserving callers that omit them |
| F94 | P5b1: first archive references and deduplicated blobs can be uncommitted when a raw resource writer checks them | Issuance and existing ancestor/blob/chunk mutation share stable mantle/content locks and fresh reference reads. New unpublished upload identities avoid the suspended-parent ForceNew deadlock. Real races pass; removing the blob lock alone reproduces byte/metadata corruption |
| F95 | P5b1: a commit worker has no interactive actor context, and late publication could reopen a decided validation request | Durable event-bound publication retains the actor, checks each recipient independently, uses stable delivery identities and retires obsolete/decided requests under lock |
| F96 | P5b1: demo-data loading can issue payment documents before normal host PDF installation | The host installs the renderer during factory data loading and drains workers before its guard ends. Host lint/build pass; two host test failures reproduce with the two-line change removed |
| F97 | P5b1 browser: self-dependent dropdowns clear their selected party/method/evidence/application value | Remove all 20 self-dependencies, retain 16 real external dependencies and pass form-scoped initial selections. Browser checks inspect actual selected revision tokens before submission |
| F98 | P5b1 rendered-output proof: an isolated app root cannot resolve mounted shared links; Treasury correctly omits ledger IDs | Real admin/Treasury-owned operations render through the actual mount at the correct standalone level in QVT/TUI/HTML, asserting enabled file identities and separately authorized ledger presence/omission |
| F99 | P5b1 screenshot review: full-page Chromium capture can hide a 15px scrollbar after choosing its clip width and crop the light document's right edge | Final-theme outer/inner/root bounds and viewport companion captures prove actual check fit. Generic full-page capture correction remains tooling work; no further product-layout change is inferred from the cropped artifact |
| F100 | P5b1 browser: a successful draft edit from 21 to 22 left a previous failed delivery form's sourceVersion in session restoration; a new form instance received that old initial value | After successful native store only, the app consumes the prior saved failed-submit values through the existing errorParameters getter. Same-revision reference/reason/evidence remains retained, failed saves stay untouched, own-edit review receives its new revision, and external stale confirmation still refuses |
| F101 | P5b2 legacy provider entry could race first native adoption, including a manual instrument with an explicit configured provider; an outer rollback could otherwise erase the only evidence of old I/O | Durable per-payment admission fences commit before old provider I/O and serialize first adoption. Shipped and configured legacy leaves, wrappers, refund links, order/invoice loops and polling reload stored identity and exclude managed records. Real competing calls, native adoption and caller rollback are covered |
| F102 | P5b2 interstage reads could retain a caller's repeatable-read snapshot, and interrupted lookup replay omitted its claimed attempt version | Orchestrator-only fresh attempt reads join separate committed stages; lookup claim results retain the exact version and summary. Actual outer rollback and concurrent pre-finish lookup replay prove durable result identities |
| F103 | P5b2 credential preparation could validate an ordinary old PaymentMethod read while projecting newer locked bank/card data | Private preparation projects only freshly locked method/subtype rows, compares the hash of those same values to the retained revision, and commits before adapter I/O. Safe adapters explicitly guarantee consumption of this by-value snapshot; lookup retains original identity independently of rotated credentials |
| F104 | P5b2 source checks could miss target-only payments, accept a real APP id with altered links/currency, or inspect only a candidate's replacement source | Common guards inspect stored and candidate payment identities under stable locks, validate all APP links/currency, and preserve positive application identity with flags off. Exact negative proofs include a real initially unmanaged AP-header/adoption race. The held manual-source reparent proof is required before P5b2b enables cash holds |
| F105 | P5b2 full-suite verification exposed legacy fixture cleanup/corruption using raw financial EntityValue/deleteAll writes without a transaction; guarded source locks refused and ClientBilling cleanup left later Projects fixtures behind | Financial fixture mutations use the existing transactional generic services, retaining their original assertions and default-off business behavior. Full BOSS rerun passes 1,161/0/5; standalone Mantle passes 1,139 with only the same four reproduced baseline failures and 17 skips |
| F106 | P5b2 visual review found the phone gateway table scrolling 560 px inside a 359 px container, with the actual provider amount beyond the visible right edge | Mobile identity links wrap, the two columns retain actual amount/currency and separate compact provider/local outcomes, and full reference/code details remain on the exact selected authorized attempt. Per-row geometry checks include amounts and chip content, beyond document-width checks. Gateway reviews also omit the empty generic state-effects grid; real B1 effects still render |
| F107 | P5b2 browser retries exposed data-dependent clicks on wrapped inline attempt IDs: the locator's union-rectangle center can fall between actual text fragments and hit the surrounding form-group | Attempt links have a rectangular block target at every width; tests verify the actual single rectangle and center hit before the unchanged normal click. Generic locator hit-point selection remains test-tooling work; no forced clicks or native financial identity changes are used |
| F108–F112 | P5b2b: legacy refunds without a native backing record, banking rows read apart from the locked ones, the legacy fence's admission for first adoption, the refund's retained posting policy, refund draft claims | Resolved in P5's own code, which R2 deleted; they no longer apply |
| F113 | P5b3: the transit account 258300000 had no default organization assignment; the fee account 550000000 is cost of sales | The assignment is installed with the PtInternalTransfer mappings, and the demo adds only what is missing. A transfer fee needs an expense account (`find#InternalTransferFeeAccounts`) |
| F114 | P5b3: transfers showed as unapplied trade cash | `find#Payments`' Unapplied queue and the trade settlement scope leave out PtInternalTransfer, before counting and paging |

| F115 | R2: P4–P5 rebuilt beside Mantle what Mantle had, ported from Moqui Java and used in production: the gateway path (`*#SinglePayment` and the gateway interfaces, with an adapter interface only a test double implemented), refunds (`create#RefundPayment`), the `apply#*` services, `post#Payment`, which posts both sides of a payment from the organization to itself, `get#InvoicePrintInfo`, `EmailTemplate`, `get#ReceivableStatementInfo`, `create#InvoiceCreditMemo`, the stored invoice totals and NotificationMessage | §2 "Use Mantle first". P4–P5 rebased on those services and the copies deleted (§4, R2) |
| F116 | R2: payment state changes wrote `statusId` directly, so the Payment SECAs did not run: `PaymentGlPost`, the cancelled-payment cleanup, `clear#PaymentTrans` and the FinancialAccountTrans SECAs | State changes go through `update#Payment` along `StatusFlowTransition`, and unapplication through `unapply#PaymentApplication`, whose SECA reverses the posting |
| F117 | R2: authorization from caller names (`getStackNameString()`, 19 sites in 13 modules), held together by EECAs and SECAs on hot paths: every Payment, PaymentApplication, AcctgTrans, AcctgTransEntry, DbResource and ContentBlob write, and a pre-service SECA on every service (`service=".*"`) | `PostingGuard` decides an automatic posting from the transaction's source fields and asks `ACCOUNTING_GL_POST` of a manual or reversal posting unless its caller passes `reviewed`; the rules the EECAs enforced are in `post#AcctgTrans` and the apply and unapply services. The guard EECAs and SECAs are gone; `IssuedInvoiceContentImmutable` remains |
| F118 | R2: test entities, services and SECAs were loaded in production; one SECA hooked every `post#AcctgTrans` and ran a script from `test/` | Deleted. The test gateway is in `PaymentTestServices.xml` (`alwaysPending#*`, `alwaysDecline#PaymentRelease`, `alwaysDecline#PaymentRefund`); a spec makes its own gateway configuration and faults |
| F119 | R2: adoption flags defaulting to N gave each rule two code paths, and most specs ran the old one | Retired, but `postingGuardEnabled` (§4) |
| F120 | R2: nearly every service was a one-line `<script>` into a module of 1,000 to 1,600 lines; helpers were copied (`same` six times, `json` four, line totals five, lock checks four), and one copy of `partyNames` showed parties another user keeps private; parameter interfaces were copied unions | Services are inline XML Actions, with modules for involved logic. `EntityLib.js` in Mantle and `AccountingLib.js` in BOSS hold the shared helpers; `partyNames` leaves out private parties; each service declares its own parameters |
| F121 | R2: transfer method dates compared as ISO strings; a posting or application without a calendar day took its timestamp's UTC day while its invoice took the user's day, so an evening application in the Americas was refused as before its own invoice | `EntityLib.bookDay`: the calendar day, else the timestamp's day in the user's zone, for posting and application days, the fiscal period lookup, `check#NextFiscalTimePeriods` and the summary recalculation (replaces F81's UTC day). The transfer module that compared ISO strings is gone |
| F122 | R2: settlement adjustments were `ItemTimeEntry` items; the workbench carried its draft, up to 256 KB, in each URL; Mantle accepted HTML built by the screen as the issued invoice; a payment was read twice per page | Adjustments are discount or write-off credit memos (`create#InvoiceCreditMemo`), applied to their invoice; the draft is kept behind an id (`store#`/`get#SettlementDraft`); Mantle renders the issued invoice from its template (`printHtml` removed) |
| F123 | R2: unapplying a payment posted straight to its invoice failed when it had several applications; `store#Account` called `set#GlAccountFlags` with the wrong parameter | Both fixed (mr-mantle `90573cb0`, `c820c444`) |
| F124 | R2: the screenshot specs saved images nothing compared, and their checks repeated the qvt and tui render specs; P4–P5 added about 17,000 lines of Mantle specs in 57 files, with busy-waiting test doubles | Screenshot specs removed in every component; each walk keeps what needs the live client; Mantle's Accounting specs went from 19,100 to 7,681 lines |
| F125 | R2: PaymentDetail was 2,733 lines (four screens in one, five copies of one dialog); 789 lines of P4–P5 XML and 357 of P0–P3 ran over 130 characters; tabs wrapped a shared template; the choices transition had four copies; labels said "reviewed" | Receivables tabs own their content, one choices transition, P0–P3 and receivables XML wrapped at 130 (mr-boss `f0cca60`). PaymentDetail a header screen with tabs that own their content, reviews as their own screens, one draft form, state dialog and gateway dialog (mr-boss `5225cc7`) |
| F126 | R2: a payment's version was a fingerprint built with copied exclude blocks, and Payment carried copies of what other records hold (`financeOrganizationPartyId`, `financeDirection`, `accountingDate`, `settlementAccountingDate`, `lifecycleManaged`) | A payment's version is its `lastUpdatedStamp`; the organization comes from its OrgInternal party and the book day is `effectiveDate` (mr-mantle `304ab31e`) |

| F130 | P6, Products' state (P0's check): Products P6 built `Shared/Supplier360` with the Products context only; its always-actions refuse another app root (`CatalogServices.get#SharedContext`). Purchasing is not started: there was no SupplierProfile, and `BOSS_PURCHASING_BUYER` is not seeded, so only AP intake holds `PAYABLE_IMPORT` | P6 builds SupplierProfile's finance fields in Mantle; the buyer's grant comes with its group (Manufacturing P14) |
| F131 | P6: `create#PurchaseShipmentInvoices` declared `invoiceIdList` and never set it | It returns the invoices of `create#SalesShipmentInvoices` |
| F132 | P6: the framework's `get#UserNotifications` took one `topic`, not the list F43 assumed | mr-moqui `550f4258` adds `topicList`; Approvals is the Commons Notifications mount filtered by Accounting's topics |
| F133 | P6: InvoiceItem has no facility, and a payment has no lines, so AC-22's "copied with the facility by the invoice and payment auto-post services" has nothing to copy for the facility or for a payment | The invoice postings carry a line's cost center, else its order line's; the facility on bill lines and payment postings are left for AC-22's follow-up (§7) |
| F134 | P6: a tab's transition answering `.` keeps only the declared parameters present in the context, so a row action whose form did not post the record's id returned to the tab without its bill | The forms post the id (BillDetail's Holds); docs/dev/Practices-App-Dev.md's "Declare only the parameters a screen reads" covers it |
| F135 | P6: a shared screen's tabs are one subscreen list for every mount, and the menu shows a tab by the artifact authorization of its file, which cannot differ by mount; Products' Supplier360 tabs need the Products context and Accounting's need Accounting's | Accounting's supplier context is its own 360 screen (§4); one Supplier360 with per-app tabs needs a framework way to choose tabs by mount |
| F136 | P6: Customer360 and Supplier360 each had a finance details tab over the same Mantle writers | One template, `template/AccountingFinanceDetails.xml`; each route screen sets the party and the side |
| F137 | P6 review: `import#Bill` for a receipt attached a repeat upload to the receipt's draft and dropped a conflicting reference; `create#InvoiceFromSource` keyed the received basis per order part, so a second delivery could not be billed, and checked the source before answering a retried operation key; the customer finance writers let the caller's side choose the permission | A receipt's bill takes one supplier upload, a reference on another bill is refused first, and a later upload or a bill no longer a draft is refused naming it; each receipt is billed once on its accepted quantity; the operation key is answered first; the side counts only its own relationship. Specs for each |
| F150 | P7, P0's F50 and D21: Mantle has no inspection record; the only held evidence is an accepted receipt whose asset is in `AstQuarantine` | That quantity is held and left out of the match (`MeInspectionHold`), and the inspection check is reported unavailable (`inspectionCheck`), never passed; `get#SourceInspectionStatus` replaces it with CX-QUALITY (§7) |
| F151 | P7: a scheduled ServiceJob runs with no user, so the re-evaluation job cannot pass `hold#Invoice`'s `INVOICE_HOLD` check, and a match operator without AP holds no `INVOICE_HOLD` either | The match places its own exception hold (§4) |
| F152 | P7: Settings is denied to every Accounting group but the finance administrator, so MatchPolicies cannot offer the backfill to AP and the match group as design §15 says | `Payables/LegacyMatches`, linked from MatchPolicies (§4) |
| F153 | P7: `BOSS_ACCOUNTING_MATCH` held only `INVOICE_MATCH`, which opens no bill read and no Payables screen, so a match operator could not open the bill it matches | The group gets `PAYABLE_VIEW` and the Payables screens' authorization; AccountingShell's match role now sees Payables |
| F154 | P7: P6's received-basis billing (`create#InvoiceFromSource`) and Mantle's receipt billing decide a receipt is billed by `AssetReceipt.invoiceId`, not by `OrderItemBilling` | A match also gives a receipt with no invoice the bill line, as `apply#InvoiceItemToOrder` does, and unapply clears it, so a matched receipt is not billed again from its order |
| F155 | P7: a corrected receipt can leave the matches of an order line over its accepted total; each bill's re-evaluation sees only what the other bills already billed | The job names each such match a source change and holds its bill; a buyer or AP corrects the source or unapplies a match |
| F156 | P7 review: two lines of one bill, or two receipts of one order line, could each take the whole remainder of the source, since each allocation was checked only against other bills | `evaluate#` and `apply#InvoiceMatch` and the proposal keep a running total of the bill's allocations per order line and per receipt and subtract it. Spec |
| F157 | P7 review: the quantity tolerance was a percent of what was left of the source, so successive bills each got a smaller allowance and their total passed none | The allowance is taken of the source's base, and earlier billing, this bill and the allocation together are checked against base plus allowance. Specs for a percent and a fixed quantity |
| F158 | P7 review: the re-evaluation placed the match hold again for an exception an approver had released, and a receipt write of only its invoice (a match or bill linking it) made every match of the order line stale | The job holds only for a source change or an exception the match's lines did not record (`InvoiceMatchLine.exceptionCodes`), and records what it finds; the AssetReceipt EECA queues only a created or removed receipt or a changed accepted quantity, order line or asset. Spec |
| F159 | P7 review: a match gave a receipt its bill on the first partial allocation, and unapply cleared it even while another bill still billed the receipt, so `create#InvoiceFromSource` could bill it again | A receipt gets the bill once billing links with a quantity cover its accepted quantity; unapplying, or a link the match sets to zero, points it to another bill still linked, or clears it when none is. Spec |
| F160 | P7 review: the legacy backfill called a bill matched with unexplained or unevidenced lines, kept no policy row on its lines, read only the first 500 bills (matched ones included, so runs stopped progressing) and its matches could be held by the job for their ambiguous lines | Partly matched or exception as the lines say; the policy row in effect on every line; bills read in invoice order a batch at a time with matched ones left out (`afterInvoiceId`, `lastInvoiceId`); a legacy match holds only for a source change. Specs |
| F161 | P7 review: a stale match whose re-evaluation failed kept its place at the head of the queue and starved the others; the job also locked the match before its bill; a source in another currency was accepted | A failure is recorded on the match (`staleReason`) and its stale date moved to now; the job locks the bill first; a source order in another currency is refused (`SOURCE_INVALID`). Specs |
| F162 | P7 second review: the re-evaluation compared a recorded exception by its code only, so a released price hold was not placed again when the bill or order price changed further | A recorded price variance holds again when the bill or order unit price differs from the line's snapshot or the variance grew, and a recorded quantity variance when the bill line grew; the snapshot is updated. Spec |
| F163 | P7 second review: `apply#LegacyMatches` counted bills without evidence toward its limit and answered no cursor, so a screen run could stall on them | It reads on until it has linked or tried `limit` bills with evidence (up to 5000 read) and answers `lastInvoiceId`; LegacyMatches continues from it (Next bills, and after Link bills). Spec |
| F164 | P7 second review: after an unapply a receipt names another bill still linked to it even when that bill bills only part of it, unlike the full coverage that sets it | Kept deliberately: Mantle's receipt billing bills a receipt whole by `AssetReceipt.invoiceId`, so naming the partial bill keeps it from billing the receipt again; the unbilled rest is matched (§7) |
| F17 | P0: `post#GlJournal` returns on a raised error, but a transaction diverted to the error journal raises none and is counted as posted, and `closeJournal` marks the journal posted regardless. The design says it stops at the first error | P2b's `post#Batch`; design §8 JournalBatches corrected |
| F18 | P0: there is no guarded invoice transition. Status changes are `update#Invoice` against the status flows, with `INVOICE_APPROVE` enforced by the framework; `unapply#PaymentApplication` changes an invoice's status by a direct update | P4's `mantle.account.InvoiceServices.change#InvoiceState`; unapply runs through it |
| F170 | P8: the P8 section names `mantle.account.InvoiceServices.store#SettlementTerm`; P3 built `mantle.ledger.SetupServices.store#SettlementTerm`, due-only, the one the PaymentTerms screen calls | Extended with `lines` (§4) |
| F171 | P8: `generate#NachaFile` and `generate#PositivePayFile` take every pending payment of the bank account, so a run's file would carry other payments | Both take `paymentIdList` |
| F172 | P8: with F32's return declined, the cash posting's reversal ran before the unapply SECA and the posting guard refused it (`SOURCE_HAS_APPLICATIONS`), and `void#Payment` would have set the declined payment Void | Delivered → Declined runs the undeliver SECAs, the unapply first (priority 4); `void#Payment` leaves Declined; an executed run's returns cancel its discount credits (`import#RunReturn`) |
| F173 | P8: a bill's Received → Approved transition needs `INVOICE_APPROVE` in the status flow, so a payable credit made through P5's `createAdjustment` (Incoming, Received, Approved) needed an approver; BOSS's AP does not hold it, nor does treasury, which executes runs | Closed in the review rework: a prompt-payment discount within the due schedule is issued by `create#InvoiceCreditMemo` with `promptDiscount` (organization-issued, finalized, no approval step; the side's edit permission or `PAYMENT_EDIT`), from the workbench and from runs; a payable write-off or a discount outside the terms by a user without `INVOICE_APPROVE` is refused at preview (`ADJUSTMENT_APPROVAL_REQUIRED`). AP is not granted `INVOICE_APPROVE` |
| F174 | P8: a payment's delivery posts it and its applications lock the organization, so a run that held a lock on the organization, or wrote the bank file in the same transaction as the applications, waited on itself | A run never locks its organization; the claim, each supplier, the file and each ACH application are their own transactions |
| F175 | P8: `update#BankAccount` gives its post-service SECA only the new payment method, and a call that changes nothing returns the same one | `void#RunApproval` acts when the method was made by this request (Mantle's copy of a changed account) or a run's account for the supplier has ended |
| F176 | P8 review: two executions under the same key could both pay a supplier: `pay#RunSupplier` read its items without a lock | It locks the run first and reads the items again; a failure marks only items still without a payment. Spec AccountingPaymentRunControls |
| F177 | P8 review: a run payment made and not applied (its bank file failed, or its application after the file) left the bill selectable by another run, and the run was marked executed anyway | A bill with a run payment not applied, declined or voided is left out of other runs (`PrxInOtherRun`, naming the payment); the run stays approved with `executionMessage` until every payment is applied; an ACH run's bank account must have its NACHA fields at create and at payment (`BANK_ACCOUNT_NACHA_MISSING`) |
| F178 | P8 review: the workbench's side (`direction`) was set in `actions`, which transitions do not run, so the payables workbench's draft edits and preview ran on the receivables side | Set in `always-actions` of both workbenches and both SettlementReview screens. BOSS spec posts editDraft; the walk adds an allocation and previews |
| F179 | P8 review: execution accepted a pay date already past, which could take a discount after its date | Refused before anything is paid (`PAY_DATE_PAST`); a resume after the date pays no new supplier |
| F180 | P8 review: an execution that stopped could not be resumed from the screen | `get#Run` gives `canResume` and, to a user who may resume, the claim's key; PaymentRunDetail offers Resume execution |
| F181 | P8 review: execution's idempotency was only a field on the run, not §4's CX-POSTING record; using InvoiceWorkflowLib's `operation` locked the organization, which the payments' own transactions then waited on | A completed execution is a `PostingOperation` (EntityLib's `operation`, `previous`, `complete`), answered first; the run's `executeOperationKey` stays as the claim of an execution in progress, which PostingOperation, written only on completion, cannot hold (§4) |
| F182 | P8 review: an issued invoice changed back for edits (Resume Changes) kept its old due schedule | The `InvoiceResumedDueSchedule` SECA removes it (`clear#InvoiceDueSchedule`); issuing again writes the new one |
| F183 | P8 review: schedule dates were timestamps from the server's zone compared as days in the user's | `InvoiceDueSchedule` and `PaymentRunItem` dates are calendar days (type date) from the invoice's book day, compared day to day; a spec reads them as a user in UTC+14 |
| F184 | P8 review: only a changed bank account voided an approval, and the void also touched items of closed runs | `void#RunApproval` also runs on `create#BankAccount` and `delete#PaymentMethod`, for open runs not executing: an ACH run whose supplier account is no longer the current one, or an account ended |
| F185 | P8 review: a return marked only the importing run's items, and a return imported again added gateway responses | Returns mark the items of every run of the bank account whose payment the file declined; `import#NachaReturn` skips a payment already declined |
| F186 | P8 review: a run's discount credit was written with field updates beside `create#InvoiceCreditMemo` | `create#InvoiceCreditMemo` with `linkToOriginal` and `promptDiscount` (within the schedule, the bill's credit cap, finalized) |
| F187 | P8 review, minor: the run services were granted by pattern; a selection of more than 500 bills dropped the rest silently; the schedules were read per invoice; `nextDueDate` used today | The public operations only; the run tells that more bills are due; schedules are read in a few queries per page; `nextDueDate` is as of the day asked |
| F188 | P8 second review: one bill could be in two open runs and both paid it: `store#RunItem` put a bill back after checking only its own item, and `pay#RunSupplier` never looked at other runs; and a supplier that failed in an unfinished run (approved with its key) held its bills from every new run | One check of what another run holds (`otherRunHolds`): selection, putting a bill back (`RUN_ITEM_IN_OTHER_RUN`) and, with the bills locked, paying (another run's payment not applied, declined, voided or cancelled). A failed supplier's bills are free for other runs; resuming its own run pays them only if no other run has (§4). Spec AccountingPaymentRunControls |
| F189 | P8 second review: a lapsed prompt discount could be taken by dating the settlement back; `promptDiscount` accepted an explicit account; a return imported outside the run (`consume#NachaReturnSystemMessage`) never marked the run; the available discount was read before the bill was locked | A prompt discount must be open on its date and today, and posts only to the side's discount account (another account is a write-off, `ADJUSTMENT_APPROVAL_REQUIRED` on a bill without approval; `DISCOUNT_ACCOUNT_FIXED` from `create#InvoiceCreditMemo`); the `RunPaymentReturned` SECA marks a run payment's bills Returned and cancels the run's discount credits whenever a delivered run payment is declined, once; `checkPromptDiscount` locks the bill first. Specs After merging, InvoiceDueSchedule's audit-logged fields added EntityAuditLog rows that shifted the audit sequence WorkPlanToCashBasicFlow checks; the schedule is no longer audit-logged (§4 payment-terms row), so the flow specs pass unchanged |
| F190 | P9: the demo organization BOSS_ACCT_ORG had no assignment of the stored-value liability and clearing accounts (251100000, 251200000, 251500000, 258100000, 258200000) that `FinancialAccountTypeGlAccount` and `FinancialAccountReasonGlAccount` map, so the posting guard refused every financial account movement | The demo assigns them. P19's readiness names a mapped account the organization does not have |
| F191 | P9: `post#FinancialAccountTrans` created its transaction without `finAccountTransId`, so the posting guard took a deposit or withdrawal for a manual entry and asked for a reviewed operation from a user without `ACCOUNTING_GL_POST` | Fixed: the transaction names its FinancialAccountTrans (mr-mantle `c12815d7`) |
| F192 | P9: `match#PaymentMethodTransUnmatched` reconciled a line with the first of several payments or ledger entries of the same amount (F33), and a receipt on a deposit could be matched on its own | It reconciles only a line with one possible match, and leaves deposited receipts to their deposit's line |
| F193 | P9: BAI2 has no transaction id, so `import#BaiVersion2` numbered lines from a sequence and a file imported again was imported twice (F33); its control-sum message gave the file's time in UTC | A BAI2 or CSV line is keyed by a hash of its source row and its occurrence in the file; `import#BaiVersion2` and `import#OfxVersion1` share `BankReconciliation.js`'s readers with `review#StatementImport` and skip known lines; the time is in the user's zone |
| F194 | P9: the Mantle reconciliation services checked no permission and the financial account services cannot (orders and payments call them) | New `check#BankAccess` and `check#FinancialAccountAccess`; the Banking screens call them before the older services, and the new services call them themselves |
| F195 | P9: the client test browser cannot set a file input, so a walk cannot upload a statement file | StatementImport also takes the statement pasted as text (`statementText`), which the walk uses; the file upload is the same service parameter as a FileItem |
| F196 | P9: `container-box` has no `condition` attribute, and one given is ignored without a lint finding: an empty Deposits box showed | Wrapped in a `section` with the condition. A lint of unknown attributes is a framework matter (not changed here) |
| F197 | P9 review: `reconcile#BankLine` trusted any candidate value, and `reconcile#PaymentMethodTrans` moved a payment off another line even when a finished statement had cleared that line | Under the line's lock, the line must be open and the candidate one of its candidates now (`checkedCandidate`); taking a payment or entry from a finished statement's line is refused; `apply#Rules` goes through `reconcile#BankLine` |
| F198 | P9 review: the OFX account and currency refusals printed the stored routing and account numbers | The bank account is named by its masked label; only the file's own values are shown |
| F199 | P9 review: one payment matched by two lines was given to the first line by `apply#Rules` and `match#PaymentMethodTransUnmatched` | Neither line gets it; `test#Rule` shows both as ambiguous ("Another line matches the same payment") |
| F200 | P9 review: an OFX DTPOSTED without a time was midnight UTC, the day before in the Americas | A day without a time is that calendar day in the user's zone |
| F201 | P9 review: the deposit branch did not lock the deposit, and left the receipts' bank ledger entries unreconciled | The deposit is read under lock; its receipts' entries on the bank's account become AterRec (AterNot when unreconciled) |
| F202 | P9 review: two commits of one statement import could run at once | `claim#StatementImport` marks it importing (SimCommitting) in its own transaction; a second commit is refused |
| F203 | P9 review: a BAI2 line's key used the group's as-of time, so a corrected file with another time duplicated its lines | The key is the as-of day, type, amount and bank reference (the whole record when there is no reference) |
| F210 | P10: Mantle approves a sales order on more paths than the two the design names: `approve#Order` and `autoApprove#Order` (from the OrderPlaced SECA, `autoApprove#OrdersDelayed` and `authorize#OrderPayments`), and also by direct `update#OrderStatus` writes in OrderBulk's `change#OrderPartsStatus` and Projects' estimate approval | The credit check is in `approve#Order` and the `check#OrderPreApprove` SECA (§4); the direct writes are §5 for their owners |
| F211 | P10: no BOSS screen approves a sales order yet; "the guard of every BOSS approve action" had no caller | `approve#Order` itself checks credit (§4) |
| F212 | P10: `check#OrderPreApprove` is also a read of the warnings, so a SECA on it cannot tell an approval from a display | It takes `approving`, which `autoApprove#Order` passes; the SECA holds only then |
| F213 | P10: F36 confirmed. `InvoiceAgingSummary` buckets against today with per-database day arithmetic (H2's `DATEDIFF` had the opposite sign), its last bucket began at 4×periodDays+2 so a 121-day-old invoice fell in none, and its party role joins multiplied every sum. H2 is not in this build (an `h2` conf is the embedded Postgres) | The view's H2 sign, last bucket and role joins fixed (spec over a 121-day invoice); `run#Aging` ages as of a day without database day arithmetic, tested on Postgres |
| F214 | P10: the aging view's day expressions read `dbConfName` from the find's context; a find without it gets the generic `CURRENT_TIMESTAMP - due`, which Postgres refuses (interval < integer) | Callers set it (mr-marble's Aging does); `run#Aging` does not use the view |
| F215 | P10: a Date-typed service parameter (`asOfDate`, `promisedDate`) reaches a script as UTC midnight, so formatting it in the user's zone gives the day before in the Americas | P10's modules read such parameters and date fields as calendar days (`calendarDateText`) |
| F216 | P10: `generate#Invoices` makes a period in a transaction of its own, which does not see a schedule created earlier in the caller's uncommitted transaction | A screen stores and generates in separate requests; the demo calls `generate#Occurrence` in its transaction |
| F217 | P10: `send#SalesInvoicePastDueEmails` and `send#CustomerPastDueEmail` send only for invoices with a ProductStore email and dedupe by the invoices' recent emails | Not used: dunning sends through its levels' EmailTemplate; the job stays paused (P19's readiness flags it if unpaused) |
| F218 | P10: a script has no read of the messages a service added (`ec.message` has errors only) | `approve#Order` answers `creditWarning` and `creditHeld` |
| F219 | P10: WorkEffort has no organization, so an activity on a customer's record cannot say which organization's collection it is | `CollectionActivity` (organization, customer, outcome, invoices), keyed by the activity |
| F220 | P10: receivables have no dispute record; `InvoiceHold` is payable-only and its guard blocks applications | `Invoice.disputedDate` and `disputeNote`, audit-logged (§4) |
| F221 | P10 review: a hold on an order of several parts held the whole order when a part was named or not, and its release moved the header; `approve#Order` without a part never approved the parts that were not held | A part is held when the order has more than one part (counting every part); `release#OrderHold` returns only the reason's part; `approve#Order` approves the parts not held, each on its own, and a named part only (spec of two parts). Second review: the credit check read every sales part, so releasing one part held an approved part of the same customer; it checks only parts awaiting approval (Placed or Processing) (spec of two parts of one customer approved apart), and `check#OrderPreApprove` warns `ORDER_HOLD_OPEN` while a hold reason is open (spec) |
| F222 | P10 review: the fix of F36 removed `fromRoleTypeId`/`toRoleTypeId` from `InvoiceAgingSummary`, which mr-marble's Accounting/Invoice/Aging still filters by | The role aliases are back on optional joins, which a find joins only when it reads or filters the role, so a role filter finds each invoice once and the sums are not multiplied (spec); no mr-marble spec renders that screen |
| F223 | P10 review: the credit exposure read up to 500 open order parts and their billings in JavaScript, and an incomplete read passed | The open parts, billings and payments are summed in queries (`CreditOpenOrderSum`, `CreditOrderBillingSum`, `CreditPaymentSum`); the overdue check reads up to 1,000 unpaid invoices and more is a hold reason (`CREDIT_INCOMPLETE`) |
| F224 | P10 review: a release decision's `expireDate` had no effect | The credit check passes the order (or part) while a release decision stands; a past expiry is refused (spec) |
| F225 | P10 review: dunning and the credit overdue check aged by `Invoice.dueDate`, missing an instalment past due | Both age by the due schedule less what was applied (`Aging.openPortions`, `pastDue`), shared with `run#Aging`; a notice reminds the past-due portion (spec) |
| F226 | P10 review: a notice sent invoices disputed after its preview | Sending leaves them out unless the level includes disputed invoices; nothing left is `DntExcluded` with `DISPUTED` (spec). Second review: a failure before the email left the notice sending for good; `prepare#DunningNotice` reads, checks and renders it in its own transaction, so a failure there is `DntFailed`, and only an exception during or after the email call leaves it sending (`SEND_UNKNOWN`); `resolve#DunningNotice` (`RECEIVABLE_EDIT`, a note) and Dunning's Settle mark it sent or failed (spec) |
| F227 | P10 review: "reminded recently" was by customer and level across organizations | It is by the notice's key (organization, customer, currency, level; the second review dropped the invoices, so a new invoice does not shorten the cadence) (spec of two organizations) |
| F228 | P10 review: recurring drafts dropped child lines and their adjustment flag, tax authority and day, and copied the reference number | Every template line but its calculated tax is copied with its number, so a child keeps its parent; no reference number (spec with a discount child) |
| F229 | P10 review: a release returned an order held before its approval to Approved, skipping its approval's checks | A hold returns to the status the order (or part) had when held (spec) |
| F230 | P11: `close#FinancialTimePeriod` ran in a `force-new` transaction, so a caller could not commit the close with its closing entries and summary rows at once, and it counted every organization's unposted transactions (F37) | It joins its caller's transaction and counts the organization's and its rollup children's (§4) |
| F231 | P11: with the posting guard on, a period's closing entries were refused in the period being closed (its closed-period and lock findings) and as manual postings without GL posting authority; `create#PeriodCloseAcctgTrans` booked them by the transaction stamp's day in the user's zone | The guard lets closing types past those findings and asks FISCAL_CLOSE; close#Period posts them reviewed; they are booked on the period's last day (`accountingDate`) |
| F232 | P11: `create#PeriodCloseAcctgTrans` took the chart's first NET_INCOME account, and `reopen#FinancialTimePeriod` reopened a period whose parent was closed (F37) | The organization's GatProfitLoss default, else a NET_INCOME account assigned to it or its parents, else refused (NET_INCOME_ACCOUNT_MISSING); a reopen under a closed parent is refused |
| F233 | P11: summary rows (`GlAccountOrgTimePeriod`) existed only for accounts that had them (F16), so the trial balance of a closed period could fail "incomplete" | close#Period computes every account's row from the posted entries (beginning from all earlier postings) and stores it, creating the missing ones, then Mantle's recalculation carries the endings forward |
| F234 | P11: `post#WorkEffortCost` was an empty stub; Mantle has no production-run work effort type (a production run is a WetTask of purpose `WepProductionRun`), and an approved week's entries may still change their rates (and, with the timesheet policy's lock off, their hours) | Built on the operation record per time entry, with deltas from approve#Timesheet, reopen#Timesheet and store#TimeEntry (§4) |
| F235 | P11: a server screen render rooted at Accounting.xml does not resolve `//Accounting` shared links, so they render disabled (a test artifact, corrected after review) | AccountingPeriodClose renders through webroot's `apps/Accounting` mount, as AccountingPayments does: the approver's bank item is a disabled link (Banking is treasury's) and the admin's links to BankAccountDetail |
| F236 | P11 review: the guard let any closing-typed transaction into a closed period and past locks by its type alone, and journal drafts, templates and reversals could take that type | The explicit close-in-progress marker (§4); closing types refused in drafts, templates, instances and reversals; locks never skipped. Specs for each, by a user with GL posting and FISCAL_CLOSE |
| F237 | P11 review: `create#PeriodCloseAcctgTrans` read every organization's summary rows of the period | It reads its organization's (a new `organizationPartyId`), and a rollup close closes each child to its own account (§4) |
| F238 | P11 review: a close could commit with a closing entry left unposted (in the error journal with the guard off), and a rollup child had no summary rows of the closed period | Every closing entry must post or the close rolls back; each organization of the rollup gets its rows |
| F239 | P11 review: `delete#TimeEntry` left a posted project cost behind; the first posting of an entry could race; a waiting posting was said to be in the error journal when there was none; the run posted all results in one transaction | Deleting reverses the cost; the entry's operation record is made then locked before its first posting; the message names where the transaction is; each run result posts in its own transaction |
| F240 | P11 review: the checklist and the invoice reconciliation read whole document lists into IN conditions, the report summed the aging over every invoice in memory and cut lists at 2,000 silently | Documents are read in pages of 500 by organization and date, stock rows through owner views, the aging summed in the query (`InvoiceTotalSum`, `InvoiceAppliedSum`), and a check past its limit is reported incomplete |
| F241 | P11 review: after the close's summary rows, Mantle's recalculation re-summed the closed period by server-zone timestamps, and the no-closing columns left out a type Mantle's keep | The close carries ending balances to the later periods' existing rows itself, and the no-closing columns leave out `AttNetIncomeClosing` only, as Mantle's recalculation does |
| F242 | P11 second review: a year's closing entries, dated its last day, fell inside the closed last month and quarter, whose stored rows nothing made again (a net income account had none, nor had the rollup children) | After the closing entries the close stores again, for each organization, every closed period of the owner holding the year's last day, and carries them forward. Spec: the closed December's trial balance and a child's December rows |
| F243 | P11 second review: InvoiceReconciliation never showed that a check was cut at its limit | The report screen names the incomplete checks in a warning, and says "Nothing disagrees" only for a complete report (`listLimit` parameter; spec) |
| F244 | P11 second review, smaller items: a hard lock through a year's last day would refuse its closing entries only at the close; a deleted entry's cost was left when the flag had been turned off; one bank's period lines were one IN list | A blocking checklist row names hard locks through the year end (PccHardLock); a deleted entry's earlier cost is reversed whatever the flag; bank lines are checked 500 at a time. Specs for the first two |
| F250 | P12: DefaultSettings' fixed asset type mappings name accumulated depreciation (181000000, 181800000, 182000000, 183500000), depreciation (671000000, 671800000, 672000000, 673500000) and unreceived (139100000–139300000) accounts that it does not assign (`GlAccountOrganization`), so with the posting guard every fixed asset receipt and depreciation was refused (`ACCOUNT_INACTIVE`) | Assigned to DefaultSettings in `ZaaGlAccountsInstallData.xml`, so organizations set up from it have them; an organization set up before needs them assigned |
| F251 | P12: DefaultSettings' `AstTpFixed` and `AstTpRealEstate` mappings name summary accounts (131000000, 132000000, no posting) as the asset account, so a generic fixed asset's receipt or capitalization cannot post | Not changed: a class's asset account (or the dialog's) is used at capitalization; P19's readiness can name it |
| F252 | P12, F38: `post#FixedAssetDepreciation` wrote the depreciation row and the accumulated amount when its transaction went to the error journal | It records nothing when its transaction did not post; `post#AssetPeriodDepreciation` refuses then, so the run's transaction rolls back too. `calculateAndPost#AllFixedAssetDepreciations` (a day early) is not called. Units of production stays Mantle's TODO |
| F253 | P12: `post#Run` sets a run Posted when its kind's posting fails nothing, though results that failed at calculation stay failed | Kept: the header shows the run's failed count with the state; a run of only failures at posting is Posted with failures |
| F254 | P12: Mantle's sales invoice posting of an `ItemAsset` line reads the asset's type and class accounts without the asset, so a capitalized asset's own account row is not used there, and it books the gain or loss itself | `dispose#Asset` refuses an invoice that sells the asset itself (`ASSET_SOLD_BY_INVOICE`); a sale disposed here is invoiced on a line posted to the clearing account (§4) |
| F255 | P12: GL posting (BOSS_ACCOUNTING_GL) reads no invoices (`arRead`/`apRead`), so the book dialogs could not offer a server-searched bill or sales invoice | The dialogs leave them out; `capitalize#Asset` and `dispose#Asset` take `sourceInvoiceId` and `salesInvoiceId` and check them |
| F256 | P12: `get#OrganizationFiscalTimePeriods` creates a date's periods only when none of the date's periods exist, so a month is not created where its year exists | The spec makes last month's period itself; the depreciation screen defaults to the month the service finds for today |
| F257 | P12 review: `repair#AcquireCost` after capitalization reposted only the receipts and issuances, so the book and the ledger disagreed and a capitalized cost could post twice; an asset with an unposted receipt was capitalized against Unreceived | `repair#AcquireCost` refuses a capitalized asset (`ASSET_CAPITALIZED`: adjust the book) and a disposed one, and a repair counts when deciding an asset's latest event; any receipt makes an asset received, and capitalization refuses one whose receipt has not posted (`RECEIPT_NOT_POSTED`) |
| F258 | P12 review: an asset could be depreciated after its disposal, and disposed with months before it undepreciated | `dispose#Asset` refuses while a fiscal month from the in-service day through the month before the disposal has no depreciation (`DEPRECIATION_DUE`) unless fully depreciated; the run leaves out and `post#AssetPeriodDepreciation` refuses an asset with an end of life |
| F259 | P12 review: P11's `post#Run` set a run Posted when its only failures were at calculation (F253) | The run is Posted with failures when any source failed, at calculation or at posting, and its failed count is their sum |
| F260 | P12 review: with F252 an unposted depreciation transaction stayed in the error journal, where a later post would book it without a depreciation row, and each rerun of `calculateAndPost#AllFixedAssetDepreciations` left another | `post#FixedAssetDepreciation` deletes the transaction it made when it did not post, and logs an error |
| F261 | P12 review: a class version started at the moment it was saved, so one added in the afternoon did not apply to an asset in service that day (the book day's noon) | Class versions start and end at the start of their day in the user's zone |
| F262 | P12 review: an asset sold on a sales invoice line (ItemAsset), whose posting books the sale, stayed in depreciation runs | That posting sets the asset's end of life on its day (no book event, which would add audit rows to Mantle's flow specs); the run and `post#AssetPeriodDepreciation` also leave out an asset a posted invoice of its owner sells |
| F263 | P12 review, smaller items | Capitalization takes an offset account (default Unreceived Fixed Asset); a received asset's change of cost needs one (`OFFSET_REQUIRED`); a sale's invoice needs a line to the disposal clearing account; a retried operation key is answered before the period and reason checks; a preview supersedes only one of the same selection; posting refuses an asset whose amount changed from the run's (`RUN_CHANGED`); book postings carry their accounting day; a disposal before the in-service day is refused. Not done: child organizations without their own preferences in the run (their assets' scope is the child's), and making a disposed asset unavailable for issue (a status change Mantle's asset flow has no transition for); both §7 |
| F290 | P14: `TaxAuthorityRate` was commented out, its relationship keyed by `taxAuthGeoId` and `taxAuthPartyId`, which are not TaxAuthority's key (F41) | Active, keyed by `taxAuthorityId`, with the collecting organization and the rate type `TarSalesTax`, written through `store#Rate` |
| F291 | P14: `calculate#SalesTaxLocal` only logged and `calculate#InvoiceSalesTax` was empty (F41); the `calculate#SalesTax` interface had no tax date, store or currency, and its results no rate version, base or rounding | Both implemented (`SalesTax.js`); the interface gained the inputs and result fields, optional for other gateways |
| F292 | P14: an invoice without a store had no tax gateway, and nothing chose one for an organization | `PartyAcctgPreference.taxGatewayConfigId` (§4) |
| F293 | P14: tax lines posted through `ItemTypeGlAccount`; `TaxAuthorityGlAccount` was read by nothing (F41) | `get#InvoiceItemGlAccount` takes `taxAuthorityId`; a sales tax line posts to the organization's account for its authority, else the item type's. Purchase tax lines still post by item type |
| F294 | P14: the 1099 selection was every vendor whose approved invoices dated in the year totalled 600 or more, with no eligibility (F41) | `run#Vendor1099Statements` (§4), each vendor its own step with its failure named |
| F295 | P14: `create#TaxStatement`, `delete#TaxStatement` and the 1099 services check no permission, and §2 puts permission checks on new services only | The new statement services check `TAX_STATEMENT_EDIT`; Tax's delete checks the capability and organization in BOSS before `delete#TaxStatement`, which now refuses an exported statement (`STATEMENT_EXPORTED`) |
| F296 | P14: `ItemVatTax` is not left out of totals, and `TaxAuthority.includeTaxInPrice` has no calculation (F41) | Not in the first release (US sales tax, design §20); the local gateway calculates tax on top of the price only. §7 country packs |
| F297 | P14: `delete#InvoiceItem` refuses a line with child items, so a line with a tax line under it could not be removed from a draft | `change#InvoiceState` removes the calculated tax lines when an invoice goes back to draft; finalize calculates them again |
| F298 | P14: InvoiceItem had nowhere to keep a tax line's rate version, base or rounding | `InvoiceItem.taxAuthorityRateId`, `taxableAmount`, `taxPercentage` and `taxRoundingAmount` |
| F299 | P14: TaxStatement has no organization, status or amounts; payroll's W-2 statements share it | A statement's organization is its period's party; `reportedAmount`, `taxAmount`, `lineCount`, `createdDate`/`createdByUserId` and `exportedDate`/`exportedByUserId`/`exportFormat` added. Tax lists sales tax and 1099 statements only |
| F300 | P14: a sales tax statement dates its lines by `invoiceDate`, not the invoice's book day (`accountingDate`) | First release; P11's close and P16's reports decide whether tax periods follow the book day |
| F301 | P14: `create#InvoicePayment` declared `statusId` (`default="paymentStatusId"`) through its Payment auto-parameters, before `paymentStatusId`; called without `statusId` (its REST route, the 1099 spec), the payment was left with no status | Fixed in Mantle: `statusId` is excluded from the auto-parameters and declared after `paymentStatusId`. The tax spec pays through it without `statusId`; the payroll, flow and payables callers pass |
| F302 | P14 review: `PartyAcctgPreference.taxGatewayConfigId` had no writer but a raw update | It is a preference field of `store#Preferences` (`ACCOUNTING_ADMIN`, audit-logged, an unknown gateway refused) and of AccountingPreferences (`taxGateways` choice); the demo sets it through `store#Preferences` |
| F303 | P14 review: a discount of the whole sale (an `ItemDiscount` line with no parent) was left out of the taxable base | The local gateway spreads such discounts over the taxable lines (shipping aside) in proportion to their bases, the last taking the rounding; the interface items carry `parentItemId` |
| F304 | P14 review: the authorities came from the rates, so an authority with nexus in the destination and no rate was silently untaxed | The authorities are those with nexus whose geo is the destination's; one with no rate in effect refuses `TAX_RATE_MISSING`. A nexus row (`TaxAuthorityParty.isNexus`) is sales tax nexus |
| F305 | P14 review: calculated tax lines were known by their rate version, which another gateway may not give, so a reopen could leave them and the next finalize double them | `InvoiceItem.taxCalculated`; reopen clears the calculated lines of any gateway, only on a draft |
| F306 | P14 review: one organization's administrator could change a shared authority's header or a rate for every organization, and nexus rows changed in place | `AUTHORITY_SHARED` and `RATE_SHARED` unless a system administrator; TaxAuthority and TaxAuthorityParty fields audit-logged; a nexus or registration change ends the row in effect and starts a new one, and an empty `partyTaxId` clears it |
| F307 | P14 review: TaxStatementDetail showed the payer's and recipient's taxpayer numbers in full | Only their last four digits on screen; the export has them in full |
| F308 | P14 review, smaller items: the clear path took any status; an order part with no address had no destination; the 1099 run counted card and network payments; an adjusting tax line posted by item type; the export was a GET link; a statement could be made twice by a retry; a second 1099 run failed vendors already done, unlocked | Clear needs a draft; the origin address stands in; card and third-party instruments are left out (1099-K); `post#InvoiceAdjustment` passes `taxAuthorityId`; export is a posted, confirmed action; `create#SalesTaxStatement` takes an `operationKey`; a vendor done is skipped, its check under its Party lock, and its statement made in the run's transaction |
| F309 | P14 review: a sales tax statement sums the tax lines of issued sales invoices; customer credits and returns do not net against it | §7, with P17's returns and credit memos |
| F270 | P13: `AssetServices.update#ProductAcquireCost` finds a product's assets of every owner (and facility and dates) and reposts each, so one organization's cost repair would rewrite another's history | Cost data repair is `AssetBookServices.repair#ProductAcquireCost` over the organization's own assets (§4) |
| F271 | P13: Mantle's DefaultSettings inventory issue mapping (the `AssetTypeGlAccount` rows `init#PartyAccountingConfiguration` copies) names `512000000` General COGS, which DefaultSettings does not assign (`GlAccountOrganization`); with the posting guard on, an organization set up from DefaultSettings sends its sale issues to the error journal (ACCOUNT_INACTIVE), and a landed cost's issued share cannot post | The demo assigns 512000000 to BOSS_ACCT_ORG; the landed cost preview names an inactive account as a finding. Mantle's install data, or P19's readiness, should assign or check it |
| F272 | P13: `receive#Asset` without an order leaves `Asset.acquireCostUomId` empty, so Products P9's revaluation refuses the asset ("no current acquisition cost") | The valuation counts a cost without a currency in the organization's base currency; a direct receipt's currency is for Warehouse's receiving (§7) |
| F273 | P13: `InvoiceServices.create#InvoiceItem` numbers the line itself (`01`) and ignores a given `invoiceItemSeqId`, so the demo's "line 00001 exists" checks (`supplierBill`, `matching`) never match and a reload would add lines | The valuation demo checks for any line; the others are left as they are (one load per database) |
| F274 | P13: `AssetValuationSummary` values on-hand at each asset's current cost, so a valuation as of an earlier day uses today's cost for that day's quantities; a revaluation or landed cost after that day makes it differ from the inventory account then | Fixed in the review (F282): the valuation takes each asset back to its cost before the later revaluations and landed costs |
| F275 | P13 review: the landed cost preview's fingerprint covered only each share's amount, so a sale between the preview and the post (on-hand and issued split, accounts, the receipt's own asset when it held no stock) posted an unreviewed split | The fingerprint covers each allocation row's quantities, amounts and accounts, each holding asset's amount, cost and account, the debit lines, and every asset of each receipt's chain; spec: a sale after the preview is refused STALE_PREVIEW |
| F276 | P13 review: the holders of a receipt's stock were followed without a visited set (a move out and back counted an asset again), and two receipts sharing a holder each set its cost alone | Followed once each; the shares of one holder are summed before its new unit cost; spec: two receipts in one asset moved out and back |
| F277 | P13 review: a cost data repair after a revaluation or landed cost reposts receipts and issues at the new cost and leaves those postings, so the stock and the ledger would differ | The repair is refused (`BOOK_EVENTS`) naming the revaluation and landed cost transactions, to be reversed first (§4); spec |
| F278 | P13 review: an asset with any issue to work sent its whole issued share to production variance | The issued share splits by the quantity issued to work (variance) and otherwise (cost of goods sold); spec: 99 sold and 1 to a run |
| F279 | P13 review: stock moved by a transfer shipment to another facility counted as issued, so its share went to cost of goods sold | The receipt's chain follows a transfer shipment's issue to its receipt's asset at the destination (§4); spec |
| F280 | P13 review: the inventory posted the share while the asset kept quantity × a rounded unit change, so the valuation and the ledger drifted (by up to a cent a unit on large quantities) | The inventory posts quantity × the unit change at the cost's four decimals, and the rest of the share goes to cost of goods sold; spec: $100 over 30,000 units |
| F281 | P13 review: a facility filter applied to the stock and to ledger entries by facility, which stock postings rarely carry | The ledger is filtered by the facility's assets; spec: a transfer destination's valuation agrees |
| F282 | P13 review: an earlier day's valuation (and PccValuationTieOut for a past period) used today's cost | Each asset's cost before the revaluations and landed costs dated after the day; the screen says so (a repair is not taken back); spec |
| F283 | P13 review: the ledger rows were not limited when the stock query was capped | Stock is read by asset up to 5,000; when capped only its products are compared and the page says the valuation is incomplete |
| F284 | P13 review: moving `AtrNoAcquireCost` receipts out of `PccStockPostings` dropped those of non-inventory assets | `PccStockPostings` keeps them for every type but inventory, which `PccReceiptCostBasis` lists |
| F285 | P13 review: the unit cost range of a product was the last group's | The minimum and maximum across the product's assets |
| F286 | P13 review: open WIP by run was unordered, of every day and silently capped | Ordered, through the valuation's day, with `wipComplete` and a note when capped |
| F287 | P13 review: the shared screens declare an `appRoot` parameter | Each app root sets `appRoot` in its always-actions (Accounting's and Products'), which a request parameter does not override; the pattern is recorded in §4 |
| F288 | P13 second review: the stock read capped at 5,000 assets ever received, so a real organization's valuation and its close row showed a false difference | Today reads the assets holding stock; an earlier day those received by then that hold stock now or moved after it (up to 20,000 moved). When the read is incomplete the difference is unavailable, in the summary and in `PccValuationTieOut`, never a number; spec |
| F289 | P13 second review: following a transfer counted the destination asset's whole stock, which other sources also sent | A transfer is followed only for what this asset's issue sent, capped per destination receipt; stock not yet received is in transit, a preview finding; spec: two receipts each sending their last 10 into one asset are each on hand 10, issued 90 |
| F310 | P15: `create#Budget` took any `statusId`, and the budget item writers changed any budget, approved or not; Budget had no status items or flow (F42) | `create#Budget` makes a draft and records its creator; the writers refuse a budget that is not a draft; the flow is seeded |
| F311 | P15: `run#BudgetExpenseReport` checks no organization or period (F6), reads its actual from `GlAccountOrgTimePeriod.postedDebits` only (debits, and only periods with stored summaries) and has no committed amount (F42) | `run#BudgetVariance`, organization- and period-checked, actuals net of credits from posted entries, with the committed column; the old report stays for its callers |
| F312 | P15: a new organization's fiscal months from `get#DescendantPeriods` depend on what `get#OrganizationFiscalTimePeriods` made: the spec organization had 3 months of its year, not 12 | The specs read the sub periods rather than assume twelve; BudgetDetail shows as many as the budget has |
| F313 | P15: BudgetVariance sums posted entries at read time for every period, not the closed periods' stored summaries the Oct 28 decision names | P16, with P11's close summaries |
| F314 | P15: a bill's actual commitments are not released when its approval is undone, and a supplier credit memo does not reduce them (the GL actual does net it) | The undone approval: F319. Credit memos: §7 |
| F315 | P15: several approved budgets covering an account and day are not chosen between; the first by id is used | §5 |
| F316 | P15: budget item details by asset or facility (`BudgetItemDetail`, `run#BudgetExpenseDetailReport`) are not in BudgetDetail or BudgetVariance | §7 |
| F317 | P15: a missing `NotificationTopic` does not persist its notifications, so the `BudgetOverride` topic is seeded in Mantle (`BudgetNotificationSetupData.xml`), as the payables topics are; BOSS adds its link | Done |
| F318 | P15, after merging P11: a period close's closing entries (`AttPeriodClosing`, `AttNetIncomeClosing`) move expense balances to retained earnings, so a closed year's actual would net to zero | `run#BudgetVariance` and the budget control leave the closing entries out of the actual |
| F319 | P15 review: a bill approved again after Resume Changes read its reverted posting too and counted twice, and an undone approval left its actuals holding the order's commitment (F314) | Only the posting in effect is read (as `revert#InvoicePost` reads it); `reverse#InvoiceActuals`, from the cancel and resume-change SECAs, reverses the bill's actuals and reopens the order commitments |
| F320 | P15 review: two bill lines against one order line each took the commitment's whole open amount | A running amount per order commitment across the bill's lines; the excess is decided against the budget |
| F321 | P15 review: a new revision of an order line reserved its full amount though earlier revisions had passed some on | It reserves the new amount less what the earlier revisions passed on |
| F322 | P15 review: the control and the budget list read the items' current amounts, which an entity write around `revise#Budget` (mr-marble's budget screens use entity-auto writes) changes without a revision | They read an approved budget as of its latest revision; a budget approved without a revision controls nothing. mr-marble's screens are §7 |
| F323 | P15 review: `create#Budget` and the item writers checked no permission or organization | `BUDGET_EDIT` in the budget's (or period's) organization |
| F324 | P15 review: `PAYABLE_EDIT` reserved and released, and any spender released an open order's commitment | §4: reserve and release without `PAYABLE_EDIT`; releasing an open source needs `BUDGET_OVERRIDE` or finance administration |
| F325 | P15 review: an order commitment on one account converted to a bill line on another; a bill approved through `change#InvoiceState` alone converted nothing; smaller items (retries not checked again under lock, a blocked row not deduplicated under a lock, all of a source's notices cleared, budgets locked out of order, capped exception and policy lists, a sub period total summing unavailable rows, the PDF reading every account, no self-approval stamp, a demo budget not made through `create#Budget`) | Converted only on its own account, else its share released; the conversion is in `change#InvoiceState`; the smaller items fixed (the blocked row is ordered by its budget item's lock; `BudgetReview.isSelfApproved`) |
| F326 | P15 review run: P7's AccountingMatching took a bill's two lines in query order, so a full run sometimes called the first line the second and failed | The spec sorts them |
| F327 | P15 second review: `convertInvoice` locked the order commitments before the budgets while reserve and convert locked the budget first (a deadlock between a line revision and a bill approval), and the control read whole budgets and evaluated each account two or three times | Budget, then commitment, everywhere: a bill's budget lines and its order commitments' budgets are locked first, as are a reversal's; `budgetLine` reads only the account's items and their impacts up to the latest revision; each account is evaluated once per approval. The blocked row's lock is the budget item, which the caller never writes |
| F328 | P15 second review, smaller items: a reversed bill's amount went back to a released order line revision; the approval transition had no permission; a budget approved around the services showed no sign of it | It goes back to the line's current revision; `BUDGET_APPROVE` on the Draft to Approved transition; BudgetDetail says the budget was approved without a revision and controls nothing |
| F330 | P16: Mantle's statement services (`run#IncomeStatement`, `run#BalanceSheet`, `run#CashFlowStatement`, `run#RetainedEarningsStatement`, `run#FinancialRatios`, `get#PeriodSeriesSummary`) read `GlAccountOrgTimePeriodDetail` for every period, which is kept live only with `realTimeGlSummary`; an open month of an organization without it showed nothing (F16) | `get#ReportBasicInfo` answers each period's summary rows, stored for a closed period and summed from posted entries for an open one, and the class and series reads take them (§4); spec |
| F331 | P16: those services, `get#AccountLedgerInfo` and `run#PostedAmountSummary` checked no access, and `get#GlAccountClassReportInfo` filtered by period only (F6); they are on Mantle REST | Each checks report read in the organization and that its periods are the organization's (or a rollup parent's, §4); specs of another organization and its periods |
| F332 | P16: the `PostedAmountSummary` view summed unposted entries and its service filtered by transaction date only | `run#PostedAmountSummary` reads posted entries by book day (the view gained `isPosted` and `accountingDate`), with balances before and after; spec |
| F333 | P16: `get#SalesTopProduct` and `get#InvoicesByCustomerClass` take no organization, so top products and customer classes mixed every organization's sales (F6); the sales summaries read the search index only | An organization filter on both; `run#SalesAnalysis` over the organization's own records (§4); spec |
| F334 | P16: `run#FinancialRatios` answers 0 for a ratio whose denominator is zero | The statement shape shows it unavailable (§4) |
| F335 | P16: a section of a screen template that section-includes another section of the same template loads the template within itself until the include depth limit ("nested too deeply") | The report parts are their own template (`AccountingReportParts.xml`), included by the statements' template and the report screens |
| F336 | P16 review: the cash flow's net change in cash summed Mantle's operating, investing and financing totals, which cover every account class and net to about zero | The BOSS shape leaves the cash class out of operating activities and shows the change in cash from its balance change; Mantle's `netOperatingActivityMap` is unchanged (mr-marble reads it); spec |
| F337 | P16 review: `get#AccountLedgerInfo` read stored summary rows (none for an open period without live summaries) and its entries by transaction date | It opens from the period's summary row and reads entries by book day; spec |
| F338 | P16 review: the search-backed sales summaries (`get#SalesOrderSummary`, `get#SalesInvoiceSummary`, `get#SalesTopProduct`, `get#InvoicesByCustomerClass`) checked no access and read every organization without a list | Each needs report read and reads the organizations named that the user may read, else every one the user works in; spec. BOSS's Sales app (ADMIN, BOSS_SALES_ADMIN) calls them: its group needs ACCOUNTING_VIEW or a sales read permission when Sales is built (§5) |
| F339 | P16 review: sales analysis counted tax, shipping and adjustment lines, draft returns, and said nothing of credit memos | Only ItemSales line types, returns once requested; credit memos no return made are not counted (said in the description); spec |
| F340 | P16 review: Home's work read the organization's whole activity and journal lists, ran the whole close checklist on each load and read the last month outside its source's error handling | The user's assignments first, open batches first (each capped and unavailable over 2,000), the close a link without a count, each source's reads inside its own handling. Receivables and payables still take one `run#Aging` each: no cheaper read gives the same figures (credits, due schedules) |
| F341 | P16 review: `childOrgPeriods` read every rolled-up organization, a grandchild or one the user does not work in included | Only the organizations the user works in; spec |
| F342 | P16 review: each open period summed every earlier posting | The earlier postings are summed once per organization and carried forward by the postings between periods; spec of two periods |
| F343–F347 | P16 review, smaller items: `get#PostedAmountSummarySide` left unused; the partner ledger's incomplete closing row kept its totals; a closed period's other currencies were not named; `run#PostedAmountSummary` made Mantle's inclusive through date exclusive; sales analysis had no default period | Removed; blank; named; inclusive again without a period (documented, and PostedSummary's tooltip); the fiscal month holding today |
| F348 | P16 review: no spec showed the export carries the screen's rows | AccountingReporting renders each statement in `csv` and finds every row |
| F350 | P17: Mantle's return credit memo (an `InvoiceReturn` from the customer to the organization) is approved by `update#Invoice` to InvoiceApproved, a transition that needs `INVOICE_APPROVE`; AR, settling under `RECEIVABLE_EDIT`, could not approve it | A settlement's credit memo is the organization's receivable credit (`financeDirection` receivable, `financeOrganizationPartyId`), moved to InvoiceInProcess and finalized as AR finalizes one; Mantle's own responses (flag off) approve it as before |
| F351 | P17: `process#ReturnItemResponses` left `ReturnItemBilling.assetReceiptId` empty (a TODO) and linked no original invoice line | Its settlement parameter fills the receipt and the original line (`originalInvoiceId`, `originalInvoiceItemSeqId`, new fields), with the receiptless flag, reason, approver, settler and operation key; Mantle's own responses are unchanged |
| F352 | P17: `process#ReturnItemResponses` refunds with a `PtRefund` from `create#Payment` beside `create#RefundPayment`, linked to no original payment and not limited by it | With the flag off unchanged (ReturnToResponseBasicFlow asserts it). A settlement refunds through `create#RefundPayment` against an original order payment that can cover it, for the credit memo, then through the original's gateway (`refund#SinglePayment`) or delivered |
| F353 | P17: `receive#Asset` returns a warning and records nothing for a zero accepted quantity, so units rejected at the dock leave no receipt through `receive#ShipmentProduct` | `receive#ReturnItems` writes the receipt of rejected units itself, with no asset and so nothing to post, and counts them as received |
| F354 | P17: `create#InvoiceCreditMemo` makes a bill's credit from the organization to the supplier (reversed parties, `financeDirection` payable), not the design's "supplier to organization" | The supplier branch uses Mantle's credit as it is: one per returned item, linked to the bill (`creditForInvoiceId`) and capped by it; AP approves and applies it (P8's ApplySupplierCredit) |
| F355 | P17: the return status flow has no ReturnApproved → ReturnCompleted, so an item credited without receipt could not complete | A receiptless settlement of the whole item closes its remainder (ReturnReceived, as crosscut §3.18's authorizer does) before `complete#ReturnItem` |
| F356 | P17: `template/AccountingRecords.xml` (P6) had an unterminated license comment, so its description was inside it and the file was not well-formed XML | Closed |
| F357 | P17: a return item's discount and tax children (made by `add#OrderItemToReturn`) must follow it, or the header never completes and the credit misses the discount | Settlement prorates each child by the quantity settled and completes the children with their item |
| F358 | P17: the bill match does not read `ReturnItemBilling`, so a supplier credit does not reduce the match-eligible receipt (P7's §7 note); `settle#Return` queues the bill's re-evaluation, which reads the same sources | §7 |
| F359 | P17: sales tax statements (F309) do not net settlement credits: the credit memo's tax comes only from the return item's tax child, and P14's calculated tax lines are not order items, so a return of a P14-taxed invoice credits no tax | §7, with F309 |
| F360 | P17 review A1: a replacement had no cap and repeated: it replaced the received quantity, not the one settled, and recorded nothing settle#Return counted | The quantity given is replaced and recorded (`ReturnItem.replacedQuantity`), which the cap, the completion and a later credit count |
| F361 | P17 review A2: a return item listed twice passed the per-item cap once per line | Refused (`DUPLICATE_LINE`) on both branches |
| F362 | P17 review A3: the D3 invoice kept its pack day, so revenue and receivable were booked when packed | `finalize#ShipmentInvoices` dates it the ship day (invoice date, book day, due date) |
| F363 | P17 review B1, B2, B4: a supplier return of a line with adjustments credited them as lines (a null original, a negative credit); prorated adjustments could over-credit across settlements; a raised return price over-credited | Adjustments are credited by their total times the share settled so far less what they credited, netted into a supplier credit; a credit's unit is at most the billed unit |
| F364 | P17 review B3 and C: the gateway refund ran before the settlement finished, with its own key, and a decline left the quantity settled; one payment had to cover a refund | The gateway goes last under the settlement's key, a decline refuses the settlement; a refund spreads over the order's payments (§4) |
| F365 | P17 review B5: D11 was only in the SECAs: Mantle's `process#ReturnItemResponses` (its REST route) and `receive#ReturnWithoutShipment` still responded, and a receipt through Mantle's own services left nothing received to settle | The settlement branch is the internal `respond#ReturnItems`; `process#ReturnItemResponses` refuses under the flag (`RETURN_SETTLEMENT_REQUIRED`); `sync#ReturnShipmentReceipts` sets the received quantities when such a shipment is delivered |
| F366 | P17 review B6: the customer credit memo was finalized by a raw status change, past the invoice workflow's approval, posting and credit-cap checks | Issued through `change#InvoiceState` (§4) |
| F367 | P17 review, smaller items: the ship SECA finalized only under the flag; release left calculated tax lines; the rejected-only receipt bypassed its service; a receiptless completion left the return shipment open | The ship SECA finalizes any pack invoice still in process; release clears calculated tax first; the receipt goes through `create#AssetReceipt`; the return shipment is cancelled (nothing received) or delivered |
| F369 | P17 second review: gateway refunds ran inside the settlement's transaction, so a decline of one refund rolled back another whose money had moved, and a retry refunded again; a receiptless credit's approval was written raw, past the self-approval setting; a refund with no gateway answer stayed promised and blocked the return, which read pending refunds from the items | The settlement commits first (`record#ReturnSettlement`); each gateway call runs in its own transaction, its attempt recorded before it (`PaymentLifecycleEvent` with the settlement key and index), so a retry calls no gateway twice; a decline marks only that refund declined (its amount refundable again; `REFUND_DECLINED`), a call that fails leaves it promised for lookup, and one with no answer is declined. A receiptless credit is approved through `change#InvoiceState` (`INVOICE_APPROVE`; `SELF_APPROVAL_DENIED` unless `allowAccountingSelfApproval`). Pending refunds are read from the credit memos, and ReturnDetail shows each. The ship SECA runs only on leaving ShipPacked and finalizes only the shipper's sales invoices |
| F368 | P17 review: `AccountingMatching` and `AccountingReturns` read rows without an order and picked a line by position or product, which a discount line of the same product made nondeterministic | Sorted, and the parent line chosen |
| F370 | P18: the posting guard checked the acting user's organizations for every posting, so a customer's payment, a gateway's answer through a public page or `poll#PaymentGatewayDetails` (no user) could not post for an organization with the guard on | A source document's own posting by no user or a public account skips the user's organization check; manual postings and reversals keep it (§4) |
| F371 | P18, P0's F52: `store#Mounts` accepted only the four Forum apps, replaced every mount and dropped `targetId`; readiness and the shell assumed Forum | `PublicApps.js` and PASS's `Apps.js` list the apps; targeted mounts need an operator and an internal organization, a core save keeps them, and each app adds readiness checks; the header shows an app's own navigation, also on a site without Forum |
| F372 | P18: PASS's facade and Mantle's PassApi refused any write without a member session except the opt-out, and sent a file only for `stageAttachment` | `TOKEN_WRITES` (`startInvoicePayment`, `submitSupplierBill`) reach the authority without a session, from a registered deployment only; any operation with a `file` goes as multipart |
| F373 | P18, P0's F51: Mantle had no hosted gateway contract, and `get#SinglePaymentGatewayDetails` needs a `paymentRefNum` that `authorize#SinglePayment` sets only on success | `authorize#Payment` takes `returnUrl`, a pending response carries `redirectUrl`, and the portal keeps a pending answer's reference; the test gateway's `hostedPending#PaymentAuthorization`, `alwaysPending#` and `alwaysDecline#PaymentDetails` answer the specs |
| F374 | P18: a screen action's 404 status is replaced when the page renders | An unavailable link's page answers 200 and names nothing of the record |
| F375 | P18: Forum's attachment staging belongs to a signed-in member and a category; a link holder has neither | The supplier's file is staged and scanned at submission (§4) |
| F376 | P18: a session attribute keeps plain values; a map stored there came back empty | The gateway return finds its link's token by a per-attempt attribute |
| F377 | P18: with the Dev binary (no image derivatives) RemoteHttp's thumbnail and avatar features answer 503, as before P18 | Environment: an image-enabled build (`--features moqui-host/image`) runs them; without one they now skip with that reason. The standard `moqui test-client mr-pass --serve` run first failed RemoteHttp's portal feature because PortalHttp, earlier on the same server, had already started paying the fixture invoice; RemoteHttp has its own invoice now (acct/p18fix) |
| F378 | P18 review: the posting guard skipped the user-organization check for every source posting by no user or a public account | Only the one payment a Billing page names while completing it, paid to the posting organization (§4); a spec posts another organization's payment with no user, with a public account and with another payment marked, each refused |
| F379 | P18 review: a redeemed invitation became a plain `PrtContact`, which named no organization or app, so a contact reached the customer's records on any organization's site and app, and a CRM contact reached them too | `ExternalAccessContact` grants by organization and app; specs for another organization's site, the Supplier app and a CRM contact |
| F380 | P18 review: a pending payment was refreshed only on its result page; the invoice page could offer a page already resolved; the return needed the session; an attempt with nothing to ask was resumed forever | The invoice page and the `resolve_PortalPayments` job ask the gateway; the return's reference; such an attempt is cancelled; spec |
| F381 | P18 review: the pages took any card payment for the invoice from its customer, so a pay link could capture an authorization made in Accounting | `PortalPaymentAttempt` marks the pages' payments; spec |
| F382 | P18 review: the token limiter counted only misses, after the lookup (a hit-or-miss signal), and copied Account.js's requester key | Every lookup counts before it is made; spec. The copy stays: exporting `requesterKey` from the framework's Account.js is a framework change (reported) |
| F383 | P18 review: a supplier's file was taken by its declared type and kept under its own name | Its leading bytes must be a PDF, PNG or JPEG of the declared type, and it is kept with that type's extension; spec |
| F384 | P18 review, smaller items: a caller's `thruDate` was not capped; earlier pay links stayed valid; a link to a cancelled record could not be revoked; `recordRevision` was stored and never compared; the invoice lock was held across the gateway call; a bad bill date failed as an unexpected error; a supplier link could be made for a site with no canonical host | Capped at 366 days; a new pay link revokes the earlier ones; revocation checks the capability's organization; the field is gone; the attempt is made in its own transaction; Unprocessable; links need a canonical host and the order screen refuses without one |
| F385 | P18 second review: a return reference read its attempt with no end and past the invoice's cancellation; a no-reference attempt could be cancelled in its first moments; a resume asked the gateway under the invoice's lock and a start could ask twice; the job read every pending card payment; an abandoned hosted attempt stayed pending; a contact's shared link ended the emailed one; the token limit used a copy of the requester key; nothing named a demo without the corporation's preferences | The reference reads while pending and a day after the attempt settles (`settledDate`), while the invoice is issued; five minutes' grace before a no-reference attempt is cancelled and seven days to abandonment; the start's own transaction resumes without the gateway, asked once after; the job reads unsettled `PortalPaymentAttempt` rows; links carry `issuerKind` and each kind replaces its own; Account.js's exported `requesterKey`; Deployment.md on trusted proxies; the demo logs a missing preference row or error journal. Specs for the reference, the grace, abandonment and issuer kinds |
| F390 | P19: a wizard step's Next submits the step's first form that is not in a dialog, a table or a form-list, and a `link-type="hidden-form"` in a list row is such a form (its form is outside the table): on Opening balances, Next removed the first balance line through its Remove link | Remove is a dialog with its own form. Reported again by the review as F398; resolved in the framework by mr-moqui `c98df6a7` (link forms carry `m-link-form` and the wizard's step form skips them); the dialog stays |
| F391 | P19: the framework's status check enforces `StatusFlowTransition.userPermissionId` also for a service call with authorization disabled: Incoming to Approved needs `INVOICE_APPROVE` | An open bill's import needs `INVOICE_APPROVE` (refused first with `PERMISSION_DENIED`); finance administration holds it in BOSS |
| F392 | P19: `import#OpenItems` runs each row in its own transaction, which waits on the organization's lock when the caller's open transaction holds it (the demo loader's file transaction after `store#SetupRun`), and the database cancels the wait | The demo saves and imports through probes; the service description says a caller commits first |
| F393 | P19: DefaultSettings' type and item mappings name seven summary accounts (F71) and twelve accounts it does not assign (F190, F250, F271), so every organization set up from it has the two mapping warnings | Readiness names each mapping; the template is not changed (§7, country packs and template review) |
| F394 | P19: `init#PartyAccountingConfiguration` did not copy a template's variance reason and tax authority accounts; it still does not copy card type accounts (copying them would change the card postings of organizations set up before) nor party, product and category accounts (specific to their records) | It copies the first two; the rest stay its TODO |
| F395 | P19: data files load in name order with foreign keys enforced, so a seed enumeration of a type a later-named file defines (ItemType in ItemTypeData.xml) fails the whole file | `ItemOpeningBalance` is in ItemTypeData.xml |
| F396 | P19 review: an organization configured through its rollup (ORG_ZIZI_RETAIL inherits ORG_ZIZI_CORP's preference) was treated as not set up: Home offered Set up accounting and Basis would have set it up from a template, ending its inheritance; readiness read mappings of the organization only | Configured is the preference over the chain (`setupStatus`, `preview#OpeningBalances` `configured` and `inheritedFrom`, `store#SetupRun`): an inheriting organization is not set up from a template and a basis change is refused (`BASIS_INHERITED`); readiness reads mappings from the nearest organization of the chain that has them. Mantle AccountingSetup (a rolled-up organization) |
| F397 | P19 review: an open item imported without the posting guard posted on its document date, not the opening day | `create#OpenItem` (and a check) refuses without the guard (`POSTING_GUARD_REQUIRED`). Mantle AccountingSetup |
| F398 | P19 review: the wizard's step form included a list row's hidden-form link (F390) | Resolved in mr-moqui `c98df6a7`; Opening balances keeps its Remove dialog |
| F399 | P19 review: readiness did not name the production cost account types (GatLaborApplied, GatOverheadApplied, GatOutsideProcessAccrued, GatProductionVariance) | A `PRODUCTION_ACCOUNTS` warning names the unmapped ones while Manufacturing is not built. Mantle AccountingSetup |
| F400 | P19 review: the repeat lookup of an open item matched a cancelled invoice | Cancelled invoices are left out |
| F401 | P19 review: a check (`verifyOnly`) overwrote the last import's refused rows and locked the organization and run | A check keeps its results apart (`lastCheckJson`, `lastCheck`) and takes no lock; Open items shows the newer |
| F402 | P19 review: an open bill imported approved carried no approval | It is stamped with the importer's approval (`approvedByUserId`, `approvedDate`, `isSelfApproved` Y). Mantle AccountingSetup |
| F403 | P19 review: a credit memo split over an open item's lines posted to migration clearing (the line's posted account) | §4: it takes the account mapped to the Opening balance item type for the side, or is refused (`CREDIT_ACCOUNT_MISSING`). Mantle AccountingSetup |
| F404 | P19 review: Setup shared Preferences' menu index, and the setup walk activated the shared demo organization, so it failed when run again on the same database | Setup has its own index (10); the walk makes its own organization (Mantle's REST `parties/organization`) and sets it up from the template |
| F410 | P20: `create#AcctgTrans` defaults `amountUomId` to the organization's base currency, else `'USD'`, and every auto-poster passes its document's currency, so a document in another currency posted its own amounts into the base-currency summaries (F19) | `post#AcctgTrans` converts any transaction not in the base currency before the guard (§4) |
| F411 | P20: `post#Payment` posts a payment fully applied to one earlier invoice straight to the receivable or payable at the payment's amount, which in another currency would clear the invoice at the payment's rate | A payment in another currency posts unapplied and each application books its difference |
| F412 | P20: `number-decimal` is `NUMERIC(26,6)` and `UomConversion.conversionFactor` a float (F20) | The applied rate is exact decimal text on the transaction and the document |
| F413 | P20: rounding each part payment at the invoice's rate leaves cents on the receivable (three 0.01 parts of 0.03 at 1.5 clear 0.06 of a posted 0.05) | Each application clears what brings the document's cleared total to the cleared amount at its rate (Mantle AccountingCurrency) |
| F414 | P20: the invoice reconciliation (P11, P16) summed invoice totals and applications across currencies against the base-currency ledger | An invoice in another currency is compared at its kept rate; the aging total converts the same way (5,000 at most, else unavailable); a payment in another currency is left out of the payment check, named incomplete |
| F415 | P20: `UomConversion` has no organization, so `store#Rate`, the CSV import and an accepted proposal set the rate for every organization | §5 |
| F416 | P20: P5's settlement workbench and control proofs, P8's runs, P9's transfers and the payment lifecycle compare document amounts with posted amounts, which now differ for another currency | Their base-currency refusals stay (§4); §7 |
| F417 | P20 review: inventory costed in another currency converted at each posting's own day rate, so the inventory account never cleared | An asset keeps the rate of its first posting (`Asset.exchangeRate`) and every posting of its cost converts at it; a posting in another currency than the asset's cost or of several assets is refused (`ASSET_CURRENCY`) (AccountingCurrency: a kroner receipt at 1.10 issued at 1.05 clears). The receipt accrual still meets the bill at the bill's rate (§7) |
| F418 | P20 review: an application posting held in the error journal and posted again converted at one day rate, booking no realized difference | `convert` hands an application type to `convertApplication` (spec) |
| F419 | P20 review: an invoice adjustment rounded its receivable on its own, leaving a cent against the invoice's total | Its control line is the invoice's total after it at the rate less what was posted (spec) |
| F420 | P20 review: any organization's finance administrator set the global rates (F415) | `ratesAdmin` on the rate writers (§4, §5; spec) |
| F421 | P20 review: a document re-posted after its postings were reversed kept its first rate, even for another book day, and a rate to a former base currency | Taken again when nothing depends on it and it was not for its book day, or the base currency changed (spec) |
| F422 | P20 review: a carried or kept rate was used without checking it is a positive decimal | `positiveRate` |
| F423 | P20 review: a document's own posting converted from the error journal did not keep its rate on the document | It takes and keeps the document's rate |
| F424 | P20 review: the reconciliation's payment check leaves out payments in another currency, so it is named incomplete for any such payment | Not changed: the ledger holds a payment's application lines at its invoices' rates, so a comparison at the payment's rate would show the realized difference as a mismatch (§7) |
| F425 | P20 review: refresh#Rates asked the provider inside its transaction | It runs without one; `propose#Rates` writes in its own |
| F426 | P20 review: an application posting of another shape was named `RATE_MISSING` | `APPLICATION_SHAPE` |
| F427 | P20 review: no spec covered payables, an invoice-to-invoice credit or unapply and apply again; AccountingReceivables relied on no SEK rate | AccountingCurrency covers them; AccountingReceivables uses XTS, the ISO testing code |
| F428 | P20 review: postings made in another currency before P20 stay unconverted | Readiness's `EXCHANGE_RATES` warns of them; reports already name them incomplete (§7) |
| F429 | WorkPlanToCashBasicFlow's "create Client Time and Expense Invoice and Finalize" data check sometimes failed in combined runs (never alone): the client invoice's bill-through items 05 and 06, their InvoiceItemAssoc rows and so the posting's entries 04 and 05 came swapped. `create#InvoiceBillThroughItems` and `post#Invoice` read the invoice's items with no order, and Postgres returned them in row-storage order (the index on `invoice_id` ties by row location): an insert into an earlier page with space a vacuum freed after earlier specs, or an update that moves a row (a changed indexed field such as `productId`), puts an item out of sequence | Both read the items by `invoiceItemSeqId`, so new items and entries are numbered in item order; the flow specs pass unchanged; Mantle spec InvoicePostOrder (a moved first item was billed through and posted last before). The same order class also broke AccountingControls' mixed batch in one combined run (results `[false, true]`): `validate#Batch` read a journal's unposted entries with no order; it now reads them by `acctgTransId` |

## 7. Later

Designed, not in this build:

- **From P12:** reversing a posted depreciation run; tax-basis depreciation and units of
  production; child organizations without their own preferences in a depreciation run; a disposed asset made
  unavailable for issue.
- **The design's `later` rows:** AdvancedPeriodRun, Leases, RevenueRecognition, Intercompany and
  ElectronicInvoices, with AC-15, AC-17, and the FX revaluation and deferral parts of AC-16.
- **With Manufacturing:** ProductionCostClose and CostingPolicies: `mantle.ledger.ProductionCostServices`
  (`store#AllocationPolicy`, `ACCOUNTING_ADMIN`; `preview#CostClose`, `ACCOUNTING_GL_POST`; `post#CostClose`,
  `PRODUCTION_COST_POST`), with `ironstone.accounting.ProductionCostServices.find#CostCloseQueue` for Home's queue;
  `ProductionAllocationPolicy`; the ProductionCostReview topic, seeded in Mantle's data, on which Mantle's
  `review#ProductionCosts` notifies Accounting; Accounting's side of the production posting rule (D12); and the
  cost-close part of §16.3 production-to-GL.
- **From P6:** the facility of bill lines and the payment postings' dimensions (F133); Supplier360 as one shared
  screen with per-app tabs (F135); the supplier file of a bill upload through PASS's media staging (P18).
- **From P7:** Mantle's receipt billing (`create#PurchaseShipmentInvoices`, `create#InvoiceFromSource` on the received
  basis) treats a receipt as billed whole once it names a bill, so a receipt partly billed by a match is completed only by
  another match (F164); the quantity credited back by supplier returns is not subtracted from a source yet (P17's
  `ReturnItemBilling` with `settle#Return`); the tax tolerance and `TaxVariance` check, and the service-acceptance rule of MatchPolicies (§4); a
  manual re-evaluation for a buyer who knows a source changed; a match column and an unmatched queue on Bills; the
  re-evaluation calls of `dispose#Inspection`, `apply#PurchaseRevision` and `settle#Return` with their owners (P17 for
  the return).
- **From P15:** Purchasing's callers of `check#Budget`, `reserve#`, `convert#` and `release#Commitment` (request and
  order approval, close and cancel) with their approval permission; netting supplier credits against a bill's actuals
  (F314; an undone approval is reversed, F319); mr-marble's budget screens (`Accounting/Budget/*`), which write
  `Budget` and `BudgetItem` through entity-auto services around `revise#Budget` and the status flow (the control reads
  only revisions, F322); releasing one cancelled line of an open purchase order needs `BUDGET_OVERRIDE` or finance
  administration (`release#Commitment` takes a closed or cancelled source), which Purchasing's callers meet; budget
  details by asset or facility (F316); choosing between overlapping approved budgets (F315, §5).
- **From P16:** MyFinanceWork's production runs awaiting cost close (with Manufacturing's cost close); the partner
  ledger's open items beside its movements; graph and pivot views of the reports and saved views beyond the lists' saved
  finds; a statement in a document currency (P20).
- **From P17:** the restocking fee as a credit memo line and a response chosen on ReturnDetail for a manual-response item;
  a return list and links to ReturnDetail from OrderDetail and Customer360; the match reading supplier credits (F358); tax
  on returns of P14-taxed invoices and sales tax statements net of credits (F359, F309); `ship#SupplierReturn` and
  `authorize#Return` with their owners; a permission path for Warehouse's Reopen package to call
  `release#ShipmentDraftInvoice`, which checks `RECEIVABLE_EDIT` (Warehouse's groups hold none); a return credit memo
  awaiting another approver when invoice approval is required.
- **Other design items:** payment references and the invoice QR block (AC-20); dunning fees and interest;
  percentage distribution across cost centres; the posted-entry hash; inbound direct debit; the country and book packs (cash-basis tax,
  withholding, VAT and tax-inclusive prices, origin-based sourcing, authority filing formats and e-filing, and sales
  tax statements that net customer credits and returns, with P17 (F309));
  statement formats beyond BAI2, OFX and CSV (camt.053, then MT940).
- **Banking (P9):** reopening a finished statement (finance admin, with a reason); creating a bank fee or payment from
  a bank line through a reviewed dialog (`create#TransPayment`); BankAccountDetail's bank files box (P8 shows NACHA and
  Positive Pay on PaymentRunDetail); the bank statement and the stored-value statement prints; financial account
  transfer and reversal; a deposit of receipts recorded without a bank method, which needs a posting from undeposited
  funds to the bank; a rule's ledger account suggestion; `preview#CsvStatement` on the screen (the review step shows
  the read rows).
- **Period close (P11):** the WIP tie-out against the WIP account and open production runs, uninvoiced receipts against the
  GRNI clearing balance (with P7's match exceptions), approved physical counts not posted, and production runs awaiting
  cost close (Manufacturing), each a `PeriodCloseCheck` row with its own service; reversing a posted period run
  (`PrnReversed`, with P12); a close snapshot print (html-print/CSV); a project's link to a Mantle budget.
- **Collections, credit and recurring (P10):** auto-send of recurring drafts after tax, credit and period checks; AP's
  entry to recurring supplier bills under Payables; Collections' board and calendar views and saved views; the dunning
  letter print and preview of one letter; a promise matched to the invoices it names; the credit check on order status
  writes outside `approve#Order` (§5, F210); Aging's comparison periods, graph and saved views; a credit decision scoped to the customer (it is the order's).
- **Valuation (P13):** reversing a landed cost allocation and allocating it again in an open period, and reversing a
  revaluation, after which a cost data repair of the product is available again (F277); duty and broker
  item types for charge lines; a landed cost charge from a bill in another currency (P20); the on-hand and package
  summaries of StockTransactions (AssetOnHand, ShipmentPackageSummary) and its comparison period; an earlier day's value
  after a cost data repair (F282); the currency of a direct receipt's cost (F272); Revalue for a product
  without an approved standard cost (an estimate first, Products' StandardCosts).
- **Other apps' contexts:** Customer Service and Sales on Customer360; Purchasing, Warehouse and Customer Service
  on ReturnDetail; Warehouse on ShipmentDetail, and its `Warehouse/Reports/InventoryValuation` mount;
  Maintenance, Manufacturing and Warehouse on EquipmentDetail; Purchasing on InvoiceMatch.
- **Other apps' callers:**
  - Purchasing: `decide#PurchaseApproval`, `close#PurchaseRemainders` and a request cancel (the budget
    commitments); `apply#PurchaseRevision` (match re-evaluation); `accept#ServiceItem` (service-line matching).
    The drop-ship delivery as match evidence is Purchasing P7's, on Moqui Java's model (impl-purchasing §4).
  - Quality: `get#SourceInspectionStatus` and `dispose#Inspection`.
  - Warehouse: Reopen package and put-back, `ship#SupplierReturn`, `post#Count`.
  - Customer Service: `authorize#Return` and `apply#OrderChange`.
  - Projects: a project's link to a Mantle budget (impl-projects §7). Its cost posting is P11's (§4).
- **The rest of the other apps' needs:** the rest of PUR-SUPPLIER (approval status, risk); CX-RETURNS' policy
  records; CX-QUALITY.
- **Portals (P18):** partial invoice payment and a saved payment method; the issued invoice's PDF on InvoicePay (§5);
  BOSS's invitation of a contact (§5); a real hosted gateway integration (Mantle's test gateway stands in); a pay link
  sent again without a new send; a terminal UI for PASS.
- **Setup and activation (P19):** the inventory, WIP and asset book subledgers tied to the opening balances (only the
  receivable and payable control accounts tie to their open items); removing an open item imported by mistake before
  activation (a posted one is corrected with a credit memo); chart import with mapping into Setup; open items and
  balances in another currency (P20); more chart templates, as country packs; a review of DefaultSettings' mappings to
  summary and unassigned accounts (F393); the wizard's own confirmation on its finish button (§4).
- **Base-currency posting (P20):** the settlement workbenches, payment lifecycle drafts, payment runs and internal
  transfers in another currency, with control proofs over `originalCurrencyAmount` (F416); FX revaluation of open items
  (AC-16, with AdvancedPeriodRun); credit exposure converted to the policy's currency; a landed cost from a bill in another
  currency; a rate chosen on a draft document; the ECB's historical file for a past day (the provider reads the daily
  file); rates per organization (§5, F415); a statement in a document currency (P16); the receipt accrual met by a bill
  at another rate than its receipt's (F417); the payment check of the invoice reconciliation for payments in another
  currency (F424); converting or restating postings made in another currency before P20 (F428).

## 8. Verification

- **Per phase,** the "Done" rule of §2 and the phase's "usable when".
- **End to end,** run `./moq run`, sign in as `john.doe` and as each demo finance user, and walk each built
  phase's "usable when" in order.
- **Design §16.3**, walkthrough by phase:

| Walkthrough | Phase |
| --- | --- |
| Procure-to-pay | P6 (intake and holds), P7 (matching), P8 (bank change and payment); the supplier upload in P18 |
| Invoice-to-cash | P4 (invoice and statement), P5 (receipt, credit, write-off, retries), P10 (overdue and credit hold), P17 (package reopened after pack), P20 (currency difference) |
| Return-to-refund | P17 |
| Production-to-GL | P13 (revaluation, and the inventory, WIP and GL tie-out); the cost close in §7, with Manufacturing |
| Bank-to-close | P2 (closed periods), P9 (statements and matches), P11 (close), P12 (depreciation into a closed period) |
| Batch/activation | P8 (supplier payment), P9 (statement row), P10 (notice recipient), P12 (asset depreciation), P19 (activation) |
| Access | `AccountingAccess` in every phase; P18 (customer token); P21 (the full walk) |

- **Walks** through the BOSS client specs of §2, asserting what each page shows.

### P0 verification — Oct 29, 2026

Source contracts checked against this checkout. Existing AccountingActivities, LedgerMaintenance and PartyTimePeriods: **18/18 passed**, using `./moq test --nobuild mr-mantle --spec LedgerMaintenance,PartyTimePeriods,AccountingActivities` with a disposable database. P1 includes minimal scoped document lists, draft creation and read-only detail routes to fulfill its shell acceptance criteria; complete document workflows remain P4–P5.

### P1 build — Oct 29, 2026

Implemented the complete finance grant matrix and root filters, isolated demo users, permission-derived native
access, scoped lists/search/record links, draft document creation and read-only routes. Home keeps later aggregates
unavailable and names independent health/count failures. The ledger model is additive preparation for P2/P3.
`AccountingShell` exercises every role, palette source and quick-create grant; `AccountingAccess` and
`AccountingIsolation` cover service, REST, export, file and search boundaries, including disabled artifact authz.


### P2 build — Oct 29, 2026

P2a and P2b are implemented: native posting guard, dated reversal and forward adjustment, configured fiscal
calendar, chart/journal/period editors, trial balance/general ledger, independent batch results, immutable template
versions, dimensions and journal files. Reviewed retries recheck authoritative inputs under lock. No closed-period
bypass or unrestricted posted rewrite was granted. Accounting explicitly adopts the new flags on ORG_ZIZI_CORP;
standalone Mantle retains the legacy defaults. Native controls and the original 18-check ledger baseline pass.

### P3 build — Oct 29, 2026

Implemented native preferences, conflict-preview cloning, all mapping kinds, due terms, dated rates/CSV results,
masked payment methods and organization-approved gateway bindings, numbering and approved document previews.
PostingDefaults identifies missing item defaults through the native invoice resolver as well as missing GL types.
Existing chart accounts can be assigned from ChartOfAccounts. Configuration retains posted accounting meaning and
issued document identities. Installment/discount lines, provider refresh and conversion remain P8/P20.

### R — Review of P0–P3 — Oct 29, 2026

A review of the four P0–P3 commits against docs/Practices-App-Dev.md found the bugs and practice gaps F61–F70, fixed
in mr-boss and mr-mantle, and added what they taught to that document. The detail screens have the record header with
one primary action by state and a More menu, a Not available state and chips with tui twins; lists have names,
amounts and states and real pagination; the invoice, bill and payment screens share one template.

Verified Oct 30, 2026: `./moq test mr-boss` 1,065 passed, 5 skipped; standalone `./moq test mr-mantle` 844 passed with
the four baseline failures (InboxThreads, MantleSearch, WorkTimeEntries, WorkTimesheets) and 17 skipped, PDF specs with
Chromium; `test-client mr-boss` AccountingShots (three users, 31 destinations at 390, 1280 and 1440, light and dark),
AccountingLedgerWalk and AccountingSettingsWalk 230 of 230, screenshots looked at; `moqui lint --screens` 125 flagged
sites as before, none in Accounting. The framework's qvt list toolbar now counts an unpaginated list's rows instead of
saying "No results found" (mr-moqui).

Left for later:
- `AccountingPolicy.js` refuses with plain messages; reason codes (`denied(reason, message)`) and the walks' comparison
  by code wait for that conversion. Its formatting (Prettier defaults) is also still to change.
- Chips have qvt and tui texts only, so printed lists show no state.
- An invoice list fills a draft's missing total with one `get#InvoiceTotal` per row (at most a page).
- JournalTemplates turns the amount form's `parameterName_N` fields into a map in its transition.

### P0–P3 integration verification — Oct 29, 2026

See [AccountingImplementation](../docs/AccountingImplementation.md) for native contracts, routes, reproduction
commands, result counts and the baseline comparison. Every implemented XML route renders in QVT and TUI. Browser
coverage includes all 31 destinations at 390/1280/1440 pixels in light/dark, reviewed posting/reversal, and the P3
assignment/mapping/terms/rates/preferences walk. Screenshots were visually inspected. Screen lint writes to a
separate report: zero parse failures and the existing 125 flagged sites, with no new Accounting hazard.

The original AccountingActivities, LedgerMaintenance and PartyTimePeriods remain 18/18 passing. The standalone
runtime excludes BOSS demo adoption settings; BOSS explicitly opts ORG_ZIZI_CORP into the new guard and dimensions.
No ADMIN exemption, closed-period permission or unrestricted rewrite authorization was added. Full standalone
Mantle retains four pre-existing failures reproduced against archived commit b48e696c: InboxThreads, MantleSearch,
WorkTimeEntries and WorkTimesheets. They are unrelated to the new finance controls.

### Remaining-phase baseline

Before P4 changes, the clean component heads were frozen and checked with the existing develop binary and Chromium
on disposable databases. BOSS at `25478b4` reproduced 1,065 passed, zero failed and five skipped. Standalone Mantle at
`f23f8de6` reproduced 844 passed, 17 skipped and exactly the four failures above. The standalone runtime excludes
BOSS data and adoption settings. Subsequent phase results are compared to these baselines.

### P4 build — Oct 29, 2026

Built:
- `mantle.account.InvoiceServices.change#InvoiceState`, the one invoice state guard over Mantle's status flow: status,
  period, posting, approval and the single-currency refusal (D18), by side permission. Draft edits through
  `store#InvoiceDraft`, `store#InvoiceDraftItem` and `delete#InvoiceDraftItem`; `reverse#DraftInvoice`. Projects'
  `update#InvoiceStatus` calls it.
- `send#Invoice` for any invoice, with or without a store, which freezes the PDF as the invoice's content and records
  the outcome per recipient; `InvoiceFinalizedSendEmail` skips a version it sent. `process#InvoiceBatch`.
- Linked credit memos applied to their original; approved-time billing for customers and workers; statements;
  Customer360's Accounting context with masked finance details (`CustomerFinanceServices`).
- Screens: Invoices, InvoiceDetail (the shared screen with the receivables context and its tabs), BillingQueue,
  InvoiceBatch, Statements and Customer360.

For later phases:
- An invoice records its book day (`Invoice.accountingDate`) and its postings use it (F73; R2 for the user's zone).
- Invoice budget evidence is unavailable until P15 adds commitments (F75).
- The generic `ItemSales` mapping points to a non-postable account; P19's readiness names such mappings (F71).

Verified then: `./moq test mr-boss` 1,110 passed, 5 skipped; standalone `./moq test mr-mantle` 903 passed, with the
four baseline failures and 17 skipped.

Commits: mr-mantle `876732f6`, `93e8fed3`; mr-boss `b933118`, `907a816`, `5b1b900`. R2 replaced its delivery,
recipient and statement snapshot entities, its script-built HTML and its own credit memo service.

### P5 build — Oct 29–30, 2026

Built in slices:
- P5a, settlement: `find#OpenItems`, `preview#Settlement` and `apply#Settlement`, one application set per party and
  currency under an operation key; automatic application (`preview#PaymentAutoApplication`, `autoApply#Payment`);
  ReceivablesWorkbench.
- P5b1, payments: `find#Payments`, `get#PaymentFinanceDetail`, drafts, reviewed state changes (validate, deliver,
  confirm, cancel, void) and unapplication, issued receipts, details and checks, PaymentValidation notices; Payments,
  PaymentDetail with seven tabs, and PaymentPrint.
- P5b2, gateway actions (authorize, capture, release, lookup), manual refunds and gateway refunds; GatewayTransactions.
- P5b3, internal transfers with a fee.

For later phases:
- A settlement is dated on or after the postings of its sources and targets. A discount or write-off goes to an
  explicit account (F23).
- A retry with the same operation key (at most 40 characters) answers the first result; another request under the key
  is refused.
- A transfer posts through the transit account 258300000, and its fee needs an expense account (F113). Transfers are
  not trade cash (F114).
- Due schedules and term discounts are P8's, historical Aging P10's.

Verified then: the last full runs were at P5b2a, `./moq test mr-boss` 1,162 passed, 5 skipped, and standalone
`./moq test mr-mantle` 1,139 passed with the four baseline failures and 17 skipped. At the user's request the refund
and transfer slices ran only their own specs.

Commits: mr-mantle `a79012de`, `8f8c06ad` (F87), `ea31a0aa`, `5c24c2fa`, `501769d0`, `cb9cc35d`, `128f6ca0`,
`9a13f26c`; mr-boss `737c439`, `acc99ca`, `59a4060`, `a8f8a38`, `4b92e2c`, `64f4585`, `bb8a421`, `d24147c`, `848ff21`,
`cadf060`, `49f3001`, `67ded21`. P5 built its gateway path, refunds, transfers, settlement guards and payment outputs
beside Mantle's services, with their own entities, guards and adoption flags; R2 rebuilt them on Mantle's services.

### P9 build — Oct 31, 2026

Built:
- Mantle `ReconciliationServices` on the existing bank lines (`PaymentMethodTrans`): `review#StatementImport`,
  `get#StatementImport` and `commit#StatementImport` for BAI2, OFX and CSV (`preview#CsvStatement` for a CSV's
  columns), a line keyed by the bank's FIT id or by a source-row key, so the same file imported twice adds nothing
  (F33, F193); `StatementImport` keeps each row new, a duplicate or rejected, and commit creates each line in its own
  transaction. `import#BaiVersion2` and `import#OfxVersion1` use the same readers (`BankReconciliation.js`).
- Statement sessions: `BankReconciliation` and `BankReconciliationLine` (keyed by the bank line), `create#`, `get#`,
  `store#` and `finish#Reconciliation`; a period overlaps no other session of the bank, opens at the last finished
  closing balance and finishes only with every line cleared and a zero difference (§4).
- Matching: `find#BankLines`, `find#BankLineCandidates` and `reconcile#BankLine` over `reconcile#PaymentMethodTrans`;
  `BankMatchRule` with `store#Rule`, `test#Rule` and `apply#Rules`, which applies only an exact, unambiguous match;
  `match#PaymentMethodTransUnmatched` reconciles only a line with one match (F192); a finished session's lines refuse
  `reconcile#`, `unreconcile#` and `noReconcile#`, which records its reason. `check#BankAccess` (`BANK_RECONCILE`).
- AC-20 deposits: `PaymentDeposit`, `Payment.paymentDepositId`, `PaymentServices.find#DepositReceipts` and
  `create#DepositSlip` (`PAYMENT_EDIT`, under an operation key); the deposit's one bank line reconciles its receipts,
  and a second line for it is refused (`PaymentMethodTrans.paymentDepositId`).
- `FinancialAccountServices.check#FinancialAccountAccess`; `post#FinancialAccountTrans` names its transaction (F191).
- Screens under `Accounting/Banking`: BankAccounts; BankAccountDetail with the Reconcile, Not reconciled and
  Unreconcile row actions (R-ACC-25), a deposit slip, Add bank line and Match automatically; StatementImport (file or
  pasted text); Reconciliations; ReconciliationDetail (the period's lines in order, Match, Not reconciled, Clear,
  Unclear and Clear selected, Finish); UnmatchedTransactions with the rules' suggestions and Apply rules; BankRules
  with Test (under Banking, §4); FinancialAccounts and FinancialAccountDetail (deposit, withdraw, adjust).
  `ironstone.accounting.BankServices` (`find#Reconciliations`, `find#Rules`, `find#FinancialAccounts`,
  `get#FinancialAccount`) and `Banking.js` (routes and drop-downs). `BOSS_ACCT_BANKING` opens the section for
  treasury, the reader and the finance admin. The demo adds BOSS_ACCT_BANK with three receipts, two bank lines and a
  rule, and assigns the stored-value accounts (F190).

For later phases:
- P11's close can read a period's finished statements (`BankReconciliation.statusId` BrecFinished).
- P19's readiness names mapped accounts an organization does not have, such as the stored-value ones (F190).
- §7 holds reopening a statement, a fee or payment from a bank line, the bank files box, the statement prints, deposits
  of receipts without a bank method and camt.053/MT940.

Review fixes (F197–F203 and the §4 rows of Oct 31): mr-mantle `470f3393`, mr-boss `b976bea`. After them,
AccountingBankReconciliation has 11 features, and the Mantle set above with AccountingControls and AccountingReceivables
passed 177; the mr-boss set 155; the banking walk 3 of 3; lint 125 as before.
`preview#CsvStatement` stays a Mantle service with its spec and is not on the screen: the review step shows the same
rows with their errors.

Verified: standalone `./moq test mr-mantle --spec` AccountingBankReconciliation, BankFileServices,
FinancialAccountServices, OrderToCashBasicFlow, OrderProcureToPayBasicFlow, ReturnToResponseBasicFlow,
InvoicePaymentMisc, AccountingPaymentLifecycle, AccountingInternalTransfers and AccountingCustomerFinance: 119 passed.
`./moq test mr-boss --spec` AccountingBanking, AccountingAccess, AccountingIsolation, AccountingShell,
AccountingScreens, AccountingPayments, AccountingReceivables, AccountingSettlement, AccountingPaymentTransfers,
AppStructure and TuiRender: 155 passed. `./moq test-client mr-boss --serve --spec AccountingBankingWalk,
AccountingPaymentsWalk`: 4 of 4. `moqui lint --screens`: 125 flagged sites as before, none in Accounting. The full
suites were not run.

Commits: mr-mantle `3e46ba26`, `c12815d7`, `fa58b5d1`; mr-boss `8df6e50`, `809944a` and the docs commit.

### R2 — Review of P4–P5 — Oct 30, 2026

A review of P4–P5 against docs/dev/Practices-App-Dev.md found that they rebuilt beside Mantle much of what Mantle
already had, and held the copies together with caller-name checks and guards on hot paths. With the user, P4–P5 were
rebased on Mantle's services and the copies deleted. The practices document gained "Use Mantle before adding to it",
XML Actions first and no screenshot specs.

**Findings** (F115–F126 in §6):
- Parallel stacks beside Mantle: a second gateway path (attempt, instruction, reservation and preview entities, and an
  adapter interface only a test double implemented) behind a "legacy fence" with a pre-service SECA on every service;
  transfers as two raw Payments and hand-built AcctgTrans; refunds beside `create#RefundPayment`; settlement writes
  beside the `apply#*` services; issued outputs, archive and Drive guards with EECAs on DbResource and ContentBlob;
  a notification outbox beside NotificationMessage; invoice print, email and statements as HTML built by string
  concatenation; a linked credit memo beside `create#InvoiceCreditMemo`; totals recomputed beside the stored ones.
- Payment state changes as raw `statusId` writes, which skipped the Payment SECAs.
- Authorization from caller names (`getStackNameString()`, 19 sites in 13 modules), and EECAs and SECAs on hot paths.
- Test entities, services and SECAs loaded in production; one hooked every `post#AcctgTrans`.
- One-line `<script>` services into modules of 1,000 to 1,600 lines; copied helpers, one of which showed private
  parties' names; copied-union parameter interfaces; adoption flags giving each rule two code paths.
- Bugs: settlement adjustments as `ItemTimeEntry` items; transfer method dates compared as ISO strings; references
  cut silently; screen-built HTML accepted as the issued invoice; `isInGroup` in a service; settlement drafts of up to
  256 KB in URLs; two payment reads per page.
- Screens: PaymentDetail at 2,733 lines; 789 lines of P4–P5 XML and 357 of P0–P3 over 130 characters; tabs that
  wrapped a template; four copies of the choices transition; "reviewed" in labels.
- Tests: screenshot specs that nothing compared; about 17,000 lines of P4–P5 Mantle specs in 57 files; busy-waiting
  test doubles.

**Decisions** (§4):
1. Rebase P4–P5 on Mantle's services and delete the parallel stacks.
2. Retire the adoption flags. `postingGuardEnabled` stays, because Mantle's flow specs need the guard off.
3. Remove the screenshot specs in every component. Service implementations are inline XML Actions; JavaScript only
   for involved logic.

mr-moqui: `ab8e4cf4` (`disable-authz` on the XML Actions entity find and write actions, a Parity-Diffs row),
`95e13d1f` (Practices-App-Dev), `ad6658ea` (screenshot specs removed, with mr-boss `8b7c7e2`, mr-pass `b069c42` and
mr-marble `b65b343`; GallerySmoke, ProductsPhone and ProductsPricePrint keep their real checks).

**Rework by area:**

| Area | What changed | mr-mantle | mr-boss |
| --- | --- | --- | --- |
| Walks | AccountingShots and AccountingGatewayShots removed; each Accounting walk keeps one live-client pass (67 s of feature time, from 369 s) | — | `8cf8198`, `8b7c7e2` |
| Pass-throughs | The four AssetBook pass-throughs and the unused `validate#Template` removed; InventoryValuation calls Mantle | — | `b245769` |
| Ledger P1–P3 | Journal attachments in XML Actions; seven ledger modules formatted (2,160 to 1,762 lines); LedgerConfiguration and CloseControls deleted and the simple operations of the others inline XML Actions (AccountingRecords 233 to 117 lines, AccountingSetup 734 to 474, Journals 849 to 746, Currencies 198 to 94); each service declares its own parameters | `301f37ad`, `c820c444` | — |
| Payment lifecycle | State changes through `update#Payment` along StatusFlowTransition and unapplication through `unapply#PaymentApplication`, so the Payment SECAs run; `revert#PaymentPost` and `revert#PaymentApplicationPost` take a `reversalDate`; issued documents are PaymentContent from a template; validation notices are NotificationMessages; ten guard and EECA files deleted | `95d61343` | `320bbb2` |
| Receivables | Print and statement templates over `get#InvoicePrintInfo` and `get#ReceivableStatementInfo`; `send#Invoice` through an EmailTemplate with the PDF as InvoiceContent, and a caller's `printLocation`; `create#InvoiceCreditMemo` links its credit; stored totals; customer finance on existing services; InvoiceDelivery.js, Statements.js and BillingWorkflow.js deleted; tabs own their content and one choices transition; P0–P3 and receivables XML wrapped at 130 | `216fbe99`, `5e32be39` | `de517d6`, `f0cca60` |
| Settlement and transfers | The `apply#*` services take `appliedDate` and `accountingDate` and check every caller; adjustments are discount or write-off credit memos; PaymentApplicationGuard, SourcePostingGuard and their EECAs folded into PostingGuard; the workbench draft behind an id; a transfer is one PtInternalTransfer payment and a fee disbursement; the transfer modules, entities and test SECA deleted | `90573cb0` | `a43b8c1`, `9dfe2f8` |
| Gateway and refunds | `operationKey` on the `*#SinglePayment` services; refunds through `create#RefundPayment` and `refund#SinglePayment`; the test gateway in PaymentTestServices; eleven modules, the legacy fence and 27 spec files (6,824 lines) deleted for two specs | `9355c3ae` | `794d7f3` |
| Consolidation | One PaymentReview entity for every review and the settlement draft; Payment's copied fields removed; EntityLib.js; AccountingPolicy refuses with reason codes; PostingGuard decides from source fields; `get#RecordContentPolicy`; AccountingLib.js and declared screen services in BOSS | `304ab31e` | `52ce9bf` |
| Book days | `EntityLib.bookDay` in the user's zone for postings, applications and periods; `create#Invoice` always records its book day and drafter | `55b87818` | — |
| Payment screens | PaymentDetail a header screen (2,262 to 193 lines) whose tabs own their content; reviews as their own screens (PaymentDetail/Review, Payments/TransferReview, Receivables/SettlementReview) with one confirm and no "I reviewed" checkbox; one draft form, state dialog and gateway dialog in `template/AccountingPayments.xml`; Payments one list (722 to 237 lines), the workbench without its review mode (1,308 to 600); the walks on the new screens, the client suite's server running only fixture specs | `c1821532` | `5225cc7`, `2e66ac4` |

R's first item left for later is done: `AccountingPolicy.js` refuses with reason codes.

**Behavior changes and cuts:**
- Statements show today's open items with aging as of the statement date; there is no opening balance and no stored
  snapshot.
- Unapplying no longer clears `Invoice.paidDate`; Mantle's `unapply#PaymentApplication` does not.
- `apply#InvoicePayment`, `apply#PaymentToPayment` and `apply#InvoiceToInvoice` refuse for every caller: a date before
  a document's posting, an amount finer than the currency, an internal transfer, a gateway authorization or held
  gateway cash, and the application that funds a refund.
- Gateway: no partial capture; a prepared refund cannot be edited and reopened; no evidence files on gateway or refund
  reviews; no ledger preview on refund reviews.
- Transfers: the fee is paid to an outside party, by default the from bank's party; the demo's cash method has none, so
  the form names who is paid. The fee payment points at its transfer (`Payment.feeForPaymentId`).
- Settlement adjustment accounts are found by date over the organization chain, not by the nearest assignment.
- Retired flags: `invoiceHoldGuardEnabled`, `paymentGatewayWorkflowEnabled`, `settlementApplicationGuardEnabled` and
  `paymentAutoApplicationEnabled`. `postingGuardEnabled` now gates only the posting guard and the invoice and payment
  `MAPPING_MISSING` refusal (§4).

**Lines** in the Accounting files: before P4 (mr-mantle `876732f6^`, mr-boss `b933118^`), at the end of P5 (the merges
`de6e6f2d` and `0283176`) and now (HEAD):

| Repository | Files | Before P4 | End of P5 | Now |
| --- | --- | --- | --- | --- |
| mr-mantle | JavaScript, `service/mantle/{account,ledger}/*.js` | 4,814 | 20,064 | 8,216 |
| mr-mantle | Service XML, those directories and the Accounting, Payment and Invoice SECA files | 16,212 | 18,911 | 22,389 |
| mr-mantle | Entity and EECA XML, the Accounting, Payment, Invoice, Settlement and AssetBook files | 4,174 | 5,594 | 4,569 |
| mr-mantle | Specs and fixtures, `test/Accounting*.js` | 1,882 | 19,100 | 7,681 |
| mr-boss | JavaScript, `service/ironstone/accounting/*.js` and Projects' BillingWorkflow.js | 622 | 4,429 | 3,708 |
| mr-boss | Service XML, `service/ironstone/accounting/*.xml` | 249 | 667 | 1,145 |
| mr-boss | Screen XML, `screen/Accounting*`, Shared Customer360 and InvoiceDetail, `template/Accounting*.xml` | 5,577 | 15,777 | 14,920 |
| mr-boss | Specs, `test/Accounting*.js` and `test/client/Accounting*.js` | 1,445 | 8,992 | 5,329 |

The change from the end of P5 to now includes the P1–P3 rework (mr-mantle `301f37ad` and `c820c444`: JavaScript
−1,340, service XML +1,391, specs +316) and the screenshot specs (mr-boss `8cf8198`: specs −2,178). Service XML grew
because services moved from script modules into XML Actions.

**Verification.** Before the rework, with a Chromium for PDF: `./moq test mr-boss` 1,187 passed, 0 failed, 5 skipped;
standalone `./moq test mr-mantle` 1,195 passed and 9 failed, all in guard and archive specs since deleted. Without a
Chromium for PDF (`pdf_chromium_path`; docs/Run-Deploy.md, docs/dev/Client-Testing.md), every PDF spec fails.

Verification after the rework, Oct 30, 2026, with a Chromium for PDF: `./moq test mr-boss` 1,161 passed, 0 failed, 5
skipped; standalone `./moq test mr-mantle` 991 passed, 1 failed, 1 skipped. The failure is InboxThreads' search
operators, one of the four failures recorded before this work, which fails only while the UTC date is ahead of the local
one. `./moq test-client mr-boss --serve` 39 of 40, the failure ProductsFinish's xlsx download, which this host does not
build; `example` (GallerySmoke) 22 of 22 and mr-marble 41 of 41. `moqui lint --screens`: 125 flagged sites as before,
none in Accounting. Mail capture (`mail_capture_sends`) is for the client walks only: with it on, InboxThreads and
BankOutputFiles fail in the server specs.

### P6 build — Oct 31, 2026

Built:
- Purchasing's contract: `mantle.party.supplier.SupplierProfile`, effective-dated with audit-logged `settlementTermId`
  and `selfBillingIndicator`; `mantle.party.SupplierServices.store#SupplierProfile` (`SUPPLIER_TERMS_EDIT`) and
  `get#SupplierFinance`. The due-date rule takes the supplier's term after the agreement's.
- Intake and approval in `mantle.account.InvoiceServices` (logic in `account/Payables.js`): `find#Payables`,
  `import#Bill` keyed by the supplier's reference (or attaching to a receipt's self-billed draft),
  `create#InvoiceFromSource` on the ordered or received basis, `request#PayableApproval` (§4) and `approve#Payable`.
- Holds: `InvoiceHold` with its four seeded reasons, `hold#Invoice`, `request#HoldRelease`, `release#InvoiceHold` (never
  by the placer) and `get#InvoiceHolds`; the hold guard in approval, every application, `create#InvoicePayment`, the
  open items and the forInvoiceId SECAs, with no flag (§4).
- CX-AUTOMATION: `acceptedOnly` receipt billing and `PartyAcctgPreference.receiptInvoiceSelfBilledOnly` (§4).
- AC-22: `OrderItem.costCenterId` and `InvoiceItem.costCenterId` on the invoice postings (F133 for the rest).
- The BillApproval and BillHoldRelease topics.
- Screens: Bills (queues, Upload bill, Place hold on the selection, the Held tab over `find#BillExceptions`),
  BillDetail (Overview, Holds and InvoiceDetail's tabs), ExpensePosting, Accounting's Supplier360 (F135) with
  Customer360's finance details template (F136), the Accounting context of Shared/OrderDetail and the new
  Shared/ShipmentDetail under Records, and Approvals, the Commons Notifications mount with Accounting's topics (F132).
- After an independent review (F137): a receipt's bill takes one supplier upload; each delivery is billed once; the
  operation key is answered first; the finance writers' side is scoped; `receiptInvoiceSelfBilledOnly` is set in
  AccountingPreferences; decisions mark their notifications read and requests notify the organization's deciders;
  releasing the last hold of an approved bill applies its waiting payments; a cost center is copied onto the bill line;
  a receipt with nothing accepted leaves no empty bill; the demo has a delivered receipt waiting for its bill.

For later phases:
- P7's InvoiceMatch places `IhrMatchException` holds through `hold#Invoice`; no hold is released automatically.
- P8's runs meet the hold guard through the apply services; a bank-detail change hold is `IhrBankChange`.
- §7 "From P6".

Verified Oct 31, 2026 (runtime without a full suite run; the orchestrator runs the suites after merging):
- `./moq test mr-mantle --spec AccountingPayables,AccountingCustomerFinance,AssetReservationMultipleThreads,`
  `OrderProcureToPayBasicFlow,OrderToCashBasicFlow,ReturnToResponseBasicFlow,InvoicePaymentMisc,InvoiceOrderApply,`
  `AccountingSettlement,AccountingSettlementConcurrency,AccountingReceivables,AccountingApplicationRules,`
  `AccountingPaymentLifecycle,AccountingPaymentCorrections`: 162 passed, 0 failed; OrderProcureToPayBasicFlow unchanged.
- `./moq test mr-boss --spec AccountingPayables,AccountingAccess,AppStructure,TuiRender,AccountingShell,`
  `AccountingScreens,AccountingReceivables,AccountingIsolation,AccountingSettlement,AccountingPayments,Billing,`
  `BillingWalk,ClientBilling,MilestoneBillingWalk,ProductsSuppliers`: 200 passed, 0 failed.
- `./moq test-client mr-boss --serve --spec AccountingPayablesWalk`: 1 of 1 (11 s).
- `moqui lint --screens`: 125 flagged sites as before, none in Accounting.

Commits: mr-mantle `f5bee15e`, `8f70b15b`; mr-boss `e4b0ac2`, `335fa0e` and the docs commit with this record.

### P11 build — Oct 31, 2026

Built:
- `mantle.ledger.transaction.AccountingCloseRun` (status CrnClosed, CrnReopened): who closed, the reason, the checklist
  it passed, the closing transactions, the net income account and the summary totals; a reopen marks it reopened with
  its reason (audit-logged) and the next close is a new run.
- `mantle.ledger.CloseServices` (logic in `ledger/PeriodClose.js`): `get#Checklist` (the period's dates and order, then
  each `PeriodCloseCheck` row with up to 20 named items: unposted transactions, the error journal with each failure
  code, unbalanced transactions, unposted invoices, bills and payments, each bank account's lines not on a finished
  statement, missing rates, bills on hold, stock movements that posted nothing, open WIP on completed kit and repack
  work, unposted project time), `check#StandardClose`, `close#Period` (FISCAL_CLOSE; operation key) and `reopen#Period`
  (FISCAL_REOPEN; a reason). Mantle's close fixed (F230–F233, F37).
- Project cost: `OtherAutoPostServices.post#WorkEffortCost` (logic in `ledger/ProjectCosts.js`), called by
  `approve#Timesheet`, `reopen#Timesheet` and `store#TimeEntry`; `PartyAcctgPreference.projectCostPostingEnabled`,
  settable in AccountingPreferences; `AttWorkEffortCost`, `GatProjectLaborCost` and `GatLaborClearing` seeded with
  DefaultSettings defaults, so PostingDefaults lists them.
- The period-run contract: `AccountingPeriodRun` and `AccountingPeriodRunResult`, `PeriodRunServices.preview#Run`,
  `get#Run` and `post#Run` (logic in `ledger/PeriodRuns.js`), the kind interfaces, and the project cost kind
  (`calculate#` and `post#WorkEffortCostRun`). `ironstone.accounting.PeriodRunServices.find#Runs`.
- `LedgerReportServices.run#InvoiceReconciliation` (in `FinanceReports.js`): organization- and period-checked (F6).
- Screens: PeriodClose/PeriodCloseDetail (record header, Close period as the primary action when nothing blocks,
  Reopen period under More, the checklist rows with their linked items, the period's reports, the close history),
  linked from each period on Periods; PeriodClose/PeriodRuns (Start a run, the list, a run's results and Post run);
  Reports/InvoiceReconciliation and its place in the reports overview.
- Demo: last month's period of BOSS_ACCT_ORG (BOSS_ACCT_CLOSE_PERIOD) with a draft invoice (BOSS_ACCT_CLOSE_INVOICE) and
  a bank account whose line no statement cleared (BOSS_ACCT_CLOSE_BANK, "Payroll account"); project cost posting on.

For later phases:
- P12's depreciation is a `PeriodRunKind` whose services implement `define#RunCalculation` and `define#RunPosting`;
  DepreciationRunDetail reads `get#Run`. A posted run's reversal (`PrnReversed`, `reverseOfRunId`) is not built.
- P7, P13 and Manufacturing add their checklist rows as `PeriodCloseCheck` enumerations with their own services (§7).
- P16's reports read closed periods' stored summary rows, which close#Period now completes.

Review fixes (F236–F241, review R1–R11): the close-in-progress marker for closing entries, closing types refused
elsewhere, the rollup close, rollback unless every closing entry posts, `transaction-timeout` on close#Period and no
transaction on the Close period transition, project cost reversal on delete, labor clearing on wage expense, paged
checks and the report's incomplete flag, carried balances, the run's per-result transactions, and the walk reading the
demo period's days from the page. After the fixes and merging master (P7): Mantle's AccountingPeriodClose (8 features),
AccountingProjectCost (4), the four flow specs, InvoicePaymentMisc, WorkPlanToCashBasicFlow, WorkProjectBilling,
OrderToCashTime, TimeImports, WorkTimesheets, WorkTimeEntries, LedgerMaintenance, AccountingControls, AccountingReports,
PartyTimePeriods, AccountingActivities and PayrollServices 182 passed (in one of three identical runs
WorkPlanToCashBasicFlow's data check found its invoice posting's entries in another order; it passed alone, without
the P11 specs and in the two runs after); mr-boss AccountingPeriodClose, AccountingShell, AccountingAccess, AppStructure,
TuiRender, ClientIsolation, Billing, BillingWalk, ClientBilling, MilestoneBillingWalk and TimeWalk 162 passed;
AccountingCloseWalk 1 of 1. Commits: mr-mantle `a2992332` and the merge after it; mr-boss `f2a67e4`, merge `764471d`
and this record.

Second review fixes (F242–F244): AccountingPeriodClose (Mantle, 8 features), AccountingProjectCost and
LedgerMaintenance 18 passed; mr-boss AccountingPeriodClose, AccountingAccess, AppStructure and TuiRender 68 passed;
AccountingCloseWalk 1 of 1.

Verified Oct 31, 2026 (no full suite run):
- `./moq test mr-mantle --spec AccountingPeriodClose,AccountingProjectCost,OrderToCashBasicFlow,`
  `OrderProcureToPayBasicFlow,ReturnToResponseBasicFlow,InvoicePaymentMisc,AccountingControls,AccountingReports,`
  `LedgerMaintenance,PartyTimePeriods,AccountingActivities,WorkPlanToCashBasicFlow,WorkProjectBilling,OrderToCashTime,`
  `AccountingBankReconciliation,AccountingPayables,AccountingReceivables,PayrollServices,WorkTimesheets,WorkTimeEntries`:
  214 passed, 0 failed.
- `./moq test mr-boss --spec AccountingPeriodClose,AccountingAccess,AccountingShell,AccountingScreens,`
  `AccountingIsolation,AccountingBanking,AccountingReceivables,AccountingPayables,AppStructure,TuiRender,Billing,`
  `BillingWalk,ClientBilling,MilestoneBillingWalk,TimeWalk,Reports`: 176 passed, 0 failed.
- `./moq test-client mr-boss --serve --spec AccountingCloseWalk` (with `mail_capture_sends=true`): 1 of 1.
- `moqui lint --screens`: 125 flagged sites as before, none in Accounting.

After merging master (P14): Mantle's AccountingPeriodClose, AccountingProjectCost, the four flow specs,
InvoicePaymentMisc, AccountingControls, AccountingReports, LedgerMaintenance, WorkPlanToCashBasicFlow, WorkTimesheets,
WorkTimeEntries and AccountingTax 154 passed; mr-boss AccountingPeriodClose, AccountingAccess, AccountingShell,
AppStructure, TuiRender, AccountingScreens, AccountingTax, AccountingBanking, AccountingPayables, Billing, ClientBilling,
BillingWalk and MilestoneBillingWalk 156 passed; AccountingCloseWalk 1 of 1.

Commits: mr-mantle `3299c2f2`, `7109a364` (docs), merge `841eafae`; mr-boss `ce3c9c2`, `4f2c15d`, `d6b3d85` (docs),
merge `ec0aaba`, `98dbc4b` (the merge's dropped closers) and this record.
### P14 build — Oct 31, 2026

Built:
- Mantle (`mantle.other.TaxServices`, `SalesTax.js`, `TaxStatements.js`): an active, corrected `TaxAuthorityRate` as
  dated versions keyed to `TaxAuthority`, written by `store#Rate` (`ACCOUNTING_ADMIN`); `store#Authority`
  (`ACCOUNTING_ADMIN`) with the organization's tax account and nexus. `calculate#SalesTaxLocal` and
  `calculate#InvoiceSalesTax` implemented, the organization's gateway (`PartyAcctgPreference.taxGatewayConfigId`) for
  invoices without a store, each tax line keeping its authority, rate version, base, rate and rounding.
  `change#InvoiceState` calculates a sales invoice's tax before finalizing or approving it and refuses one whose tax
  cannot be calculated; tax lines post to the authority's account (`TaxAuthorityGlAccount`). `simulate#SalesTax`,
  `find#SalesTaxLines`, `create#SalesTaxStatement`, `run#Vendor1099Statements` and `export#Statement`
  (`TAX_STATEMENT_EDIT`); `delete#TaxStatement` keeps an exported statement.
- BOSS: the Tax area for the tax group and finance administrators: TaxAuthorities, TaxRates with the simulation,
  TaxStatements (a sales tax statement, the 1099 run with its failures named) and TaxStatementDetail (lines, form
  fields, CSV export); `ironstone.accounting.TaxServices` (`find#Authorities`, `find#Rates`, `find#Statements`,
  `get#StatementDetail`) over `Tax.js`; the tax choices; the demo's Utah sales tax, taxed invoice and 1099 suppliers in
  `Demo.js`.

For later phases:
- P6 edits `store#InvoiceDraftItem` and `change#InvoiceState`: P14's change there is two calls in `InvoiceWorkflow.js`
  (`issue` and the return to draft). Purchase tax lines still post by item type (F293).
- Tax shown on a draft before it is finalized is open (§5); VAT, tax-inclusive prices, origin sourcing and filing
  formats are §7 (F296). P11 and P16 decide whether tax periods follow the book day (F300).

Verified: standalone `./moq test mr-mantle --spec AccountingTax` 9 of 9, and TaxStatementServices,
AccountingReceivables, OrderToCashBasicFlow, InvoicePaymentMisc, OrderProcureToPayBasicFlow,
ReturnToResponseBasicFlow, AccountingControls and AccountingBookDates 136 of 136. `./moq test mr-boss` with every
Accounting spec, AppOrganizationFilters, AppStructure, TuiRender, Billing, BillingWalk, ClientBilling and
MilestoneBillingWalk: 228 of 228. `./moq test-client mr-boss --serve` with the seven Accounting walks: 9 of 9, the
receivables walk with `mail_capture_sends=true` as it says (without it its delivery row waits in vain). `moqui lint
--screens`: 125 flagged sites as before, none in Accounting. The full suites were not run.

Commits: mr-mantle `d9257332`, `8b54ad8b`; mr-boss `2163c8a`, `671b7eb`, `967dd4b` and this record.

Review fixes, Oct 31 (after merging master with P6 and P9): F301 fixed in Mantle, and F302–F308 (the gateway a
preference, sale discounts spread, nexus authorities without a rate refused, calculated lines marked, shared authorities
and rates guarded with dated nexus rows, masked taxpayer numbers, and the smaller items); F309 is §7. Verified: standalone
mr-mantle AccountingTax (12 features) with TaxStatementServices, the receivables, settlement, payables, bank
reconciliation, controls, book-day, payroll and the four flow specs (WorkPlanToCash among them): 215 of 215. mr-boss
every Accounting spec (Payables and Banking among them), AppOrganizationFilters, AppStructure, TuiRender and the four
Billing specs: 241 of 241 after AccountingShell's menu order. The nine Accounting walks with `mail_capture_sends=true`:
13 of 13. `moqui lint --screens`: 125 flagged sites, none in Accounting.


### P7 build — Oct 31, 2026

Built:
- Mantle's match model (`entity/InvoiceMatchEntities.xml`): `InvoiceMatchPolicy` as effective-dated rows with audit-logged
  fields (organization, category or product scope; bill basis, receipt required, quantity and price tolerance, variance
  action, self-billing default); `InvoiceMatch` (one applied per bill, `ImApplied`/`ImUnapplied`, a result, staleness) and
  `InvoiceMatchLine` (the allocation's snapshot, the policy row it applied, its exception and the billing link it wrote).
- `mantle.account.InvoiceMatchServices` (logic in `account/InvoiceMatch.js`): `evaluate#`, `apply#` and `unapply#InvoiceMatch`
  (`INVOICE_MATCH`; apply writes or updates `OrderItemBilling` under lock, refuses excess and already-billed quantity and
  places the match exception hold naming the rule; unapply reverses the links and keeps the hold); `store#`, `end#` and
  `get#MatchPolicies` (`ACCOUNTING_ADMIN` to change); `queue#MatchReevaluation` from the `AssetReceipt` and `InvoiceItem`
  EECAs (indexed reads only) and the `run_MatchReevaluation` job (`run#`/`reevaluate#`), which names each bill's result
  and never releases a hold; `preview#` and `apply#LegacyMatches` from unambiguous evidence only. Quantity in quarantine
  is held and the inspection check reported unavailable (F150). A supplier's first profile row takes the policy's
  self-billing default.
- Screens: BillDetail's Match tab, `Shared/InvoiceMatch` with the Accounting context (bill lines beside their sources,
  Apply and Unapply match, exceptions, the applied match); `Payables/LegacyMatches`; `Settings/MatchPolicies`. The match
  group reads bills and reaches Payables (F153). Demo: BOSS_ACCT_ORG's policy, BOSS_ACCT_PO_MATCH received in full and
  the bills BOSS_ACCT_BILL_MATCH and BOSS_ACCT_BILL_PRICE. No approval topic is added: a match hold is released through
  `BillHoldRelease`.

For later phases:
- P8's runs meet the match hold through the P6 hold guard. P17's `settle#Return`, and Purchasing's revision and quality
  services, call `queue#MatchReevaluation`. §7 "From P7".

Verified Oct 31, 2026, after merging master (P9, P14):
- `./moq test mr-mantle --spec AccountingMatching,AccountingPayables,OrderProcureToPayBasicFlow,OrderToCashBasicFlow,`
  `ReturnToResponseBasicFlow,InvoicePaymentMisc,InvoiceOrderApply`: 92 passed, 0 failed; the flow specs unchanged.
- `./moq test mr-boss --spec AccountingMatching,AccountingAccess,AccountingShell`: 92 passed; `--spec AppStructure,TuiRender,`
  `AccountingPayables,AccountingScreens,AccountingReceivables,AccountingIsolation,Billing,BillingWalk,ClientBilling,`
  `MilestoneBillingWalk`: 120 passed, 0 failed.
- `./moq test-client mr-boss --serve --spec AccountingMatchingWalk,AccountingPayablesWalk`: 2 of 2.
- `moqui lint --screens`: 125 flagged sites, none in Accounting or Shared/InvoiceMatch.

Commits: mr-mantle `16124afc`, `3a0269d5`; mr-boss `886c35e`, `21ca6bd`, `7eec17d`, `f351b62`, `689806c` and the docs
commit with this record.

P7 review fixes (Oct 31, 2026; F156–F161): running totals per order line and receipt within a bill; the quantity
tolerance taken of the source's base across bills; the job holds only for a source change or an unrecorded exception,
locks the bill first and records a failure without starving the queue; the receipt EECA queues only real receipt
changes; a receipt names a bill by coverage and another linked bill after an unapply; legacy matches partly matched,
with policy rows, paged past matched bills; the shared hold creation (`placeHold`); another currency refused; the Match
tab names the refusal. Verified after merging master (`e264fc8`): mr-mantle AccountingMatching (12 features),
AccountingPayables and the five flow specs 97 of 97; mr-boss AccountingMatching, AccountingShell, AccountingAccess,
AppStructure, TuiRender, ClientIsolation and AccountingPayables 134 of 134; AccountingMatchingWalk and
AccountingPayablesWalk 2 of 2; `moqui lint --screens` 125 flagged sites, none in Accounting. Commits: mr-mantle
`33eebc13`; mr-boss `aa9d901` and this record.

P7 second review fixes (F162–F164): a recorded price or quantity exception holds again when it got worse than the
line's snapshot; `apply#LegacyMatches` reads past bills without evidence and answers `lastInvoiceId`, which
LegacyMatches continues from; the receipt release rule is stated (F164, §7); the Match tab shows a coded refusal's
message and a generic one for anything else. mr-mantle AccountingMatching (14 features), AccountingPayables and the five
flow specs 99 of 99; mr-boss AccountingMatching, AccountingPayables, AppStructure and TuiRender 30 of 30;
AccountingMatchingWalk 1 of 1.

### P8 build — Oct 31, 2026

Built:
- Payment terms: `SettlementTermLine` (effective-dated portions and discounts, audit-logged) through
  `SetupServices.store#SettlementTerm` with `lines` (F170); the seeded 2% terms as lines; PaymentTerms shows each term's
  portions and discounts, New payment term takes a discount and Edit lines saves up to three portions.
- `InvoiceDueSchedule`, written once at issue (the `InvoiceIssuedDueSchedule` SECA) and read by `get#InvoiceDueSchedule`,
  `find#OpenItems` (discount columns of both workbenches), runs and `apply#Settlement`, where a discount within its date
  posts to the discount account (§4). The contract is in mr-mantle's AccountingImplementation for P10's aging.
- AC-04: `PaymentRun` and `PaymentRunItem`; `mantle.account.PaymentRunServices` `create#Run`, `select#Bills`,
  `store#RunItem`, `request#RunApproval`, `approve#Run`, `execute#Run` (with `claim#RunExecution`, `pay#RunSupplier`,
  `generate#RunFile`, `write#RunFile`, `apply#RunPayment`), `get#RunFile`, `import#RunReturn`, `get#Run`, `cancel#Run`;
  `void#RunApproval` as the `PaymentRunBankChangeVoid` SECA on `update#BankAccount` (D26, F30, F175); the
  PaymentRunApproval topic in Approvals. NACHA and Positive Pay through Mantle's services with `paymentIdList` (F171).
- F32: a NACHA return declines a delivered payment, which is unapplied and its posting reversed (F172).
- Screens: PaymentRuns (New run), PaymentRunDetail (send, approve, execute, refresh, leave out and put back, download
  the bank file, import bank returns, cancel), PayablesWorkbench and Payables/SettlementReview on the shared
  `template/AccountingWorkbench.xml` with ReceivablesWorkbench (§4); `ironstone.accounting.PaymentRunServices`
  `find#Runs` and `get#RunContext`. Treasury reaches Payables with `PAYABLE_VIEW` (§4).
- Demo: BOSS_ACCT_RUN_BANK set up for NACHA, the supplier's bank account, approved bills due today and on 2% 10 net 30
  terms, an approved bill on hold, and a proposed demo run.

Usable when (§16.3 procure-to-pay and batch), each in a spec:
- a run selects the due approved bills and leaves out a held one with its reason (Mantle and BOSS AccountingPaymentRuns,
  AccountingPaymentRunsWalk);
- after approval one supplier's payment fails (a hold placed after approval) and the other keeps its payment, discount
  and file (Mantle AccountingPaymentRuns);
- regenerating downloads the same file (Mantle and BOSS AccountingPaymentRuns);
- a bank-detail change voids the approval and the run takes the new account (Mantle AccountingPaymentRuns);
- a NACHA return reopens the bill it paid, in full (Mantle AccountingPaymentRuns).

For later phases:
- P10's aging reads `InvoiceDueSchedule` through `PaymentTerms.js` `schedule`/`schedules` or `get#InvoiceDueSchedule`.
- P9's BankAccountDetail can list a bank account's run files (`PaymentRun.paymentMethodFileId`).
- F173: P5's payable adjustments need an approver; for review.

Verified Oct 31, 2026 (runtime without a full suite run; the orchestrator runs the suites after merging):
- `./moq test mr-mantle --spec AccountingPaymentRuns,BankOutputFiles,BankFileServices,OrderToCashBasicFlow,`
  `OrderProcureToPayBasicFlow,ReturnToResponseBasicFlow,InvoicePaymentMisc,InvoiceOrderApply,AccountingSettlement,`
  `AccountingSettlementConcurrency,AccountingPayables,AccountingPaymentLifecycle,AccountingPaymentCorrections,`
  `AccountingControls,AccountingReceivables,AccountingApplicationRules,AccountingPaymentGateway,AccountingPaymentRefunds,`
  `AccountingCustomerFinance,AccountingInternalTransfers`: 244 passed, 0 failed; the flow specs unchanged.
- `./moq test mr-boss --spec AccountingPaymentRuns,AccountingAccess,AppStructure,TuiRender,AccountingShell,`
  `AccountingScreens,AccountingReceivables,AccountingIsolation,AccountingSettlement,AccountingPayments,AccountingPayables,`
  `AccountingPaymentFiles,AccountingPaymentGateway,AccountingPaymentRefunds,AccountingPaymentTransfers,Billing,BillingWalk,`
  `ClientBilling,MilestoneBillingWalk,ProductsSuppliers,Notifications`: 237 passed, 0 failed.
- `./moq test-client mr-boss --serve --spec AccountingPaymentRunsWalk,AccountingSettingsWalk,AccountingPayablesWalk,`
  `AccountingSettlementWalk`: 4 of 4.
- `moqui lint --screens`: 125 flagged sites as before, none in Accounting.

Commits: mr-mantle `b90c5aaf`, `e14f3cf1`; mr-boss `e64be82` and the docs commit with this record.

Review rework, Oct 31, 2026 (F176–F187, F173 closed; §4): runs pay a supplier once under concurrent executions, keep a
payment's bills out of other runs until it is applied, stay approved with the reason until every payment is applied and
resume under their key (Resume execution), refuse a past pay date and an ACH bank account without NACHA settings, and
answer a completed execution from its PostingOperation; due schedules are calendar days and are rewritten after Resume
Changes; bank accounts added or ended void approvals; returns mark every run of the bank account and import once; a
prompt-payment discount within the terms is issued without approval through `create#InvoiceCreditMemo` `promptDiscount`
and a payable write-off needs `INVOICE_APPROVE`; the workbenches set their side in `always-actions`. Specs: mr-mantle
AccountingPaymentRunControls (new) and AccountingPaymentRuns; mr-boss AccountingPaymentRuns (the payables workbench's
editDraft, Resume execution) and AccountingPaymentRunsWalk (an allocation on the payables workbench). Results after
merging master follow.

After merging master (P7, P9, P14), Oct 31, 2026: mr-mantle AccountingPaymentRuns, AccountingPaymentRunControls,
BankOutputFiles, BankFileServices, AccountingSettlement, AccountingSettlementConcurrency, the four flow specs,
InvoiceOrderApply, AccountingPayables, AccountingMatching, AccountingBankReconciliation, AccountingReceivables,
AccountingApplicationRules, AccountingControls, AccountingPaymentLifecycle, AccountingPaymentCorrections and
AccountingCustomerFinance: 261 passed, 0 failed. mr-boss AccountingPaymentRuns, AccountingAccess, AppStructure, TuiRender,
AccountingShell, AccountingSettlement, ClientIsolation, AccountingPayables, AccountingMatching, AccountingBanking,
AccountingScreens, AccountingIsolation, AccountingReceivables, AccountingPayments and the four Billing specs: 215 passed,
0 failed. Walks with `mail_capture_sends=true` (AccountingPaymentRunsWalk, AccountingSettlementWalk,
AccountingSettingsWalk, AccountingPayablesWalk): 5 of 5. `moqui lint --screens`: 126 flagged sites, the one new one in
P7's Shared/InvoiceMatch, none in P8's screens.

Second review, Oct 31, 2026 (F188, F189): mr-mantle AccountingPaymentRunControls (10 features), AccountingPaymentRuns,
AccountingSettlement, BankOutputFiles, BankFileServices and the four flow specs: 123 passed, 0 failed; mr-boss
AccountingPaymentRuns 6 of 6; AccountingPaymentRunsWalk (`mail_capture_sends=true`) 2 of 2.

### P17 build — Oct 31, 2026

Built:
- Mantle flags (`entity/ReturnSettlementEntities.xml`), audit-logged, off by default, preference fields of
  `store#Preferences` and AccountingPreferences (§4): `returnSettlementRequired` (D11) makes `ReturnApprovedProcess` only
  create the return shipment and sets `ShipmentDeliveredReturnReceive` and `ReturnReceivedProcess` aside
  (`ReturnServices.get#ReturnSettlementMode`); `salesInvoiceFinalizedAtShip` (D3) leaves the pack invoice in process with no
  payment applied, and the new `ShipmentShippedFinalizeInvoices` SECA finalizes it (`InvoiceServices.finalize#ShipmentInvoices`).
- Warehouse's contract `mantle.shipment.WarehouseTaskServices.receive#ReturnItems` (`STOCK_RECEIVE`, seeded in Mantle):
  accepted units as stock, rejected ones as a receipt with no stock (F353), `receivedQuantity` only, no response.
- `mantle.order.ReturnServices.preview#ReturnSettlement` and `settle#Return` (`order/ReturnSettlement.js`): cumulative caps
  per item and order line, the design's result codes, the version under lock, the operation key; the customer branch
  through `process#ReturnItemResponses`' new `settlement` parameter (quantities, receipts, original lines, a refund through
  `create#RefundPayment` to the original payment and its gateway; F350–F352), the supplier branch as credits linked to the
  bills with match re-evaluation queued (F35, F354); a receiptless credit with a reason and an approver; adjustments
  prorated (F357); `complete#ReturnItem` (F355); `ReturnItemBilling.assetReceiptId` and the original line.
- `InvoiceServices.release#ShipmentDraftInvoice` (`RECEIVABLE_EDIT`) and `PaymentServices.refund#OrderPayment`
  (`PAYMENT_EDIT`) between pack and ship, for Warehouse's Reopen package and Customer Service's order change.
- BOSS: `Shared/ReturnDetail` at `Accounting/Records/ReturnDetail` (ReturnScreenServices `get#ReturnContext`, `Returns.js`,
  the AccountingReturn section and settleReturn transition of `template/AccountingRecords.xml`), with Settle and Credit
  without receipt; the Accounting group reaches the four Mantle services; the demo's flags and BOSS_ACCT_RETURN.

For later phases:
- §7 "From P17". Warehouse P12/P14 call `release#ShipmentDraftInvoice` from Reopen package and `receive#ReturnItems` from
  ReturnReceipt; Customer Service P9/P10 calls `refund#OrderPayment` and `release#ShipmentDraftInvoice` from its order
  change and adds its context (and `authorize#Return`) to ReturnDetail; Purchasing adds `ship#SupplierReturn`, which sets
  ReturnShipped, the supplier settlement's eligibility. P8's ApplySupplierCredit applies a supplier return's credit.

Verified Oct 31, 2026, after merging master (P8, P11):
- `./moq test mr-mantle --spec AccountingReturns,ReturnToResponseBasicFlow,OrderToCashBasicFlow,OrderProcureToPayBasicFlow,`
  `InvoicePaymentMisc,InvoiceOrderApply,ShipmentReturnMisc,AccountingReceivables,AccountingPayables,AccountingMatching,`
  `AccountingPeriodClose,AccountingPaymentRuns,AccountingTax`: 163 passed, 0 failed; ReturnToResponseBasicFlow and
  OrderToCashBasicFlow unchanged. AccountingReturns: 6 features, 15 s.
- `./moq test mr-boss --spec AccountingAccess,AppStructure,TuiRender,AccountingShell,ClientIsolation,AccountingScreens,`
  `AccountingPayables,AccountingReceivables,AccountingSettlement,AccountingPayments,AccountingMatching,AccountingPaymentRuns,`
  `AccountingPeriodClose,AccountingTax,Billing,BillingWalk,ClientBilling,MilestoneBillingWalk`: 220 passed, 0 failed.
- `./moq test-client mr-boss --serve --spec AccountingReturnsWalk,AccountingSettingsWalk,AccountingCloseWalk,`
  `AccountingPayablesWalk`: 4 of 4.
- `moqui lint --screens`: 126 flagged sites, none in Accounting, its templates or Shared/ReturnDetail.

Commits: mr-mantle `188dde08`, `257c2f67`, `6bbd4a25` and the merge `1376456c`; mr-boss `9ef61b7`, `3177ea9`, the merge
`852349a` and the docs commit with this record.

P17 review fixes (Oct 31, 2026; F360–F368): capped and recorded replacements, single lines, the D3 invoice dated the ship
day, prorated and netted adjustments, the billed unit cap, refunds spread over the order's payments with the gateway
last, D11 in the services (`respond#ReturnItems`, `sync#ReturnShipmentReceipts`), the credit memo issued through
`change#InvoiceState`. Verified after merging master: mr-mantle AccountingReturns (14 features) with the flow specs and
the Accounting specs of the earlier record 175 of 175; mr-boss the same 18 specs 220 of 220; AccountingReturnsWalk and
AccountingCloseWalk 2 of 2. Commits: mr-mantle `23cfd4c4`; mr-boss this record.

P17 second review fixes (Oct 31, 2026; F369): the settlement commits before the gateway refunds, each in its own
transaction with its attempt recorded; a receiptless credit approved through `change#InvoiceState`; refunds with no
gateway answer declined; pending refunds read from the credit memos and every refund on ReturnDetail; the ship SECA on
leaving ShipPacked only. Verified: mr-mantle AccountingReturns (15 features), AccountingPaymentRefunds,
AccountingPaymentGateway, AccountingMatching and the flow specs 115 of 115; mr-boss AccountingAccess, AppStructure,
TuiRender, AccountingShell and ClientIsolation 129 of 129; AccountingReturnsWalk 1 of 1.

### P12 build — Oct 31, 2026

Built:
- Mantle: `mantle.product.asset.FixedAssetClass` (dated versions of an organization's book defaults by `AssetClass`,
  key fields audit-logged) and `AssetBookEvent`'s fields for the book events (`FixedAssetEntities.xml`), the event,
  disposal and transaction types and the `PrkDepreciation` run kind (`FixedAssetData.xml`). `AssetBookServices`
  (logic in `ledger/FixedAssets.js`, beside Products' revaluation): `store#Class` (`ACCOUNTING_ADMIN`);
  `capitalize#Asset`, `adjust#AssetBook`, `dispose#Asset` and `reverse#AssetBookEvent` (`ACCOUNTING_GL_POST`, operation
  keys, an open period); `repair#AcquireCost` (`ACCOUNTING_ADMIN`, F39); `get#AssetBook`; the run kind's
  `calculate#DepreciationRun`, `post#DepreciationRun` and `post#AssetPeriodDepreciation`; `preview#Depreciation`,
  `get#DepreciationPreview` and `post#Depreciation`. `post#FixedAssetDepreciation` records nothing when its transaction
  did not post (F38, F252); DefaultSettings assigns the fixed asset accounts its mappings name (F250).
- BOSS: the Fixed assets area (GL, approvers, readers, finance administrators): FixedAssets/FixedAssets (the list with
  book state), AssetClasses (Add class, New version, End for the finance administrator), DepreciationRunDetail (scope,
  the run's per-asset results, Post depreciation, recent runs) and EquipmentDetail, `Shared/EquipmentDetail` with the
  Accounting context (identity, Book with its accounts, depreciation by month and book events, source and history;
  Capitalize as the primary action before capitalization and Adjust book after it, Dispose and Repair acquire cost
  under More, Reverse on the latest event). `ironstone.accounting.AssetBookServices.find#Assets` and `find#Classes`; the
  asset class, method, fixed asset type and fixed asset choices; PeriodRuns opens a depreciation run in
  DepreciationRunDetail. Demo: the Trucks and Forklifts classes, a forklift in service since the first of the month, a
  delivery van to capitalize and a label printer without a cost (`Demo.js` `fixedAssets`).

For later phases:
- A posted depreciation run is not reversed (P11's `PrnReversed` is not built); a book event is reversed instead.
  Tax-basis depreciation, units of production and capitalizing from a bill line are §7.
- PeriodCloseDetail's design lists no depreciation row among its checks, so none was added.
- P19's readiness can name F251's summary asset accounts.

Verified Oct 31, 2026 (no full suite run):
- `./moq test mr-mantle --spec AccountingFixedAssets,OrderToCashBasicFlow,OrderProcureToPayBasicFlow,`
  `ReturnToResponseBasicFlow,InvoicePaymentMisc,AccountingPeriodClose,AccountingProjectCost,ProductStandardCosts,`
  `LedgerMaintenance,AccountingControls`: 151 passed, 0 failed (AccountingFixedAssets 7 features).
- `./moq test mr-boss --spec AccountingFixedAssets,AccountingAccess,AccountingShell,AccountingPeriodClose,ClientIsolation,`
  `AccountingScreens`: 116 passed; `--spec AppStructure,TuiRender` with AccountingFixedAssets: 23 passed.
- `./moq test-client mr-boss --serve --spec AccountingFixedAssetsWalk`: 1 of 1.
- `moqui lint --screens`: 126 flagged sites as on the branch before, none in Accounting or Shared/EquipmentDetail.

Commits: mr-mantle `9b65718e`, `329a1444` (docs); mr-boss `b6ea3e5`, `d74abad` (the walk) and this record.

After merging master (P8): mr-mantle AccountingFixedAssets, AccountingPeriodClose, AccountingProjectCost,
OrderProcureToPayBasicFlow and OrderToCashBasicFlow 61 passed; mr-boss AccountingFixedAssets, AccountingShell,
AccountingAccess, AppStructure, TuiRender, ClientIsolation and AccountingPeriodClose 135 passed; AccountingFixedAssetsWalk
1 of 1. Merges: mr-mantle `b74d2962`, mr-boss `004618f`.

Review fixes (F257–F263): repair refused on capitalized and disposed assets and counted as an event; capitalization of an
asset with an unposted receipt refused; no depreciation after disposal and no disposal before the months due; a run with
calculation failures posted with failures; an unposted depreciation transaction removed; class versions by day; an asset
sold on an invoice ends its life; the smaller items of F263. Verified (master already merged, nothing new): mr-mantle AccountingFixedAssets (11
features), AccountingPeriodClose, AccountingProjectCost and the four flow specs (OrderProcureToPayBasicFlow depreciates and
sells equipment) with InvoicePaymentMisc: 90 passed; mr-boss AccountingFixedAssets, AccountingShell, AccountingAccess,
AppStructure, TuiRender, ClientIsolation and AccountingPeriodClose: 135 passed; AccountingFixedAssetsWalk 1 of 1.
Commits: mr-mantle `1261465d`; mr-boss `139e625` and this note.

### P18 build — Oct 31, 2026

Built:
- CX-PORTALS in Mantle: `mantle.party.ExternalAccessCapability` (record type and id, revision, outside party, scopes,
  expiry, revocation, token digest) and `mantle.party.ExternalAccessServices` (`party/ExternalAccess.js`):
  `create#AccessCapability` (an issued customer invoice with `RECEIVABLE_EDIT`, a purchase order with `PAYABLE_EDIT`;
  answers the record's page on the organization's site), `check#AccessCapability`, `revoke#AccessCapability`,
  `check#AccessToken` (misses limited per requester), `find#AccessCapabilities` and `invite#Contact`; a redeemed
  invitation makes the account's party a `PrtContact` of the customer or supplier, with no user group.
- How a PASS app registers (§4; F371): Mantle's `public/PublicApps.js` and PASS's `service/pass/Apps.js`; Billing and
  Supplier take an internal organization as target, set only by an operator and kept by a core save, with their
  readiness checks; documented in design-forum §13.1 and mr-pass `docs/Deployment.md` for Purchasing P16 and Support.
- `mantle.account.PortalServices` (`account/Portal.js`): `issue#InvoiceAccess`, `find#Invoices`, `get#Invoice`,
  `start#InvoicePayment`, `get#PaymentResult`, `submit#SupplierBill`, `get#Submission` and `check#AppReadiness`, each an
  operation in PASS's `Schema.js` and `Routes.js` (and Mantle's copies) served by PassApi, the two link writes from a
  registered deployment without a session (F372). The hosted gateway contract and the test gateway's answers (F373);
  the invoice payment gateway preference; `submit#SupplierBill` over `import#Bill`'s core (`portalBill`), the file
  staged and scanned first (F375), recorded as `SupplierBillSubmission`. `send#Invoice` mails the pay link. The posting
  guard rule for a public payer (F370).
- The PASS apps: Billing (`screen/Billing.xml`, Invoices and InvoicePay with PublicInvoice, PayInvoice, PaymentResult,
  the gateway's `return` path and a contact's pay link) and Supplier (`screen/Supplier.xml`, BillUpload with
  SupplierSubmission and SubmissionReceipt), server HTML with XML forms at 390 px and on the desktop; the header shows
  each app's navigation. `Pass.xml`'s CSP is unchanged.
- BOSS: OrderDetail's Supplier bill link (AP, approved purchase order, published Supplier site), the invoice payment
  gateway in Accounting Preferences, the Accounting groups' grant of the ExternalAccessServices, and
  `load#PortalDemo` (ORG_ZIZI_RETAIL's site with both mounts, a pay link and a bill link with fixed tokens, a contact
  of JoeDist and of ZiddlemanInc invited and redeemed).

For later phases:
- Purchasing P16 adds its pages to Supplier and `OrderAcknowledgement` to the order's capability (the `Order` record
  type already allows the scope); Customer Service's Support app follows §13.1, adding its record types to
  `ExternalAccess.js` and its app to both registries. §5 asks where BOSS invites contacts and whether InvoicePay shows
  the PDF; §7 "Portals (P18)".

Verified Oct 31, 2026:
- `./moq test mr-mantle --spec AccountingPortals`: 8 of 8; with AccountingPaymentGateway, AccountingPaymentLifecycle,
  AccountingPayables, AccountingDelivery, AccountingReceivables, AccountingControls, AccountingSettlement,
  PaymentGateway, FinancialAccountServices, InvoicePaymentMisc, OrderToCashBasicFlow and OrderProcureToPayBasicFlow:
  192 of 192.
- `./moq test mr-pass --spec Portals,PortalFixtures,ClientFixtures,Forum,ForumAccess,Media,Integrations,Outbox,`
  `PublicIdentity,Operations,SsoHandoff`: 73 of 73.
- `./moq test mr-boss --spec AccountingAccess,AccountingPayables,AccountingShell,AppStructure,TuiRender,ClientIsolation,`
  `AccountingScreens`: 136 features, the new OrderDetail one failing until the Accounting groups got the
  ExternalAccessServices grant; then AccountingPayables and AccountingAccess 53 of 53.
- `./moq test-client mr-pass --serve --spec PortalHttp`: 3 of 3, at 390 px with no horizontal overflow and on the
  desktop.
- The remote pair on RemoteFixtures' pattern: the authority served `ClientFixtures,PortalFixtures` on 18091, a runtime
  with only framework, webroot, tools and PASS served RemoteFixtures (1 of 1, no Mantle catalog) on 18092, and RemoteHttp
  passed its portal feature and the Forum features but the two image features, which need an image-enabled build (F377).
- `moqui lint --screens`: 126 flagged sites, none in Billing, Supplier, Accounting or Shared/OrderDetail.

After merging master (P8, P11): mr-mantle AccountingPortals, AccountingPaymentGateway, AccountingPayables,
AccountingDelivery, AccountingControls, AccountingPaymentRuns, AccountingPeriodClose, InvoicePaymentMisc,
OrderToCashBasicFlow and OrderProcureToPayBasicFlow 141 of 141; mr-boss AccountingAccess, AccountingPayables,
AccountingShell, AppStructure, TuiRender, ClientIsolation and AccountingScreens 140 of 140; mr-pass Portals,
PortalFixtures, ClientFixtures, Forum and ForumAccess 32 of 32; PortalHttp 3 of 3.

Commits: mr-mantle `f2a38ab3`, `b5bedb0c`, `f77ba237`, `0b77ac47`; mr-pass `b6ac29a`, `9143e99`, `2112858` and the
screen formatting; mr-boss `ac0edd3` and the docs commits with this record.

P18 review fixes (Oct 31, 2026; F378–F384): the scoped portal payment marker in the posting guard; contact grants by
organization and app; `PortalPaymentAttempt`, the return reference, `resolve_PortalPayments` and the refreshed invoice
page; every token lookup counted first; sniffed bill files; the smaller items. The framework's Account.js does not
export `requesterKey`, so ExternalAccess.js keeps its copy (a framework change for the coordinator). Verified after
merging master (no change since the first merge): mr-mantle AccountingPortals (14 features), AccountingPaymentGateway,
AccountingPayables, AccountingDelivery, AccountingControls, AccountingPaymentRuns, AccountingPeriodClose,
InvoicePaymentMisc and the two flow specs 147 of 147 (the flows had failed on BOSS's demo when it stored ORG_ZIZI_RETAIL's
own preferences, fixed by storing on ORG_ZIZI_CORP, §4); mr-boss AccountingAccess, AccountingPayables, AccountingShell,
AppStructure, TuiRender, ClientIsolation and AccountingScreens 140 of 140; mr-pass Portals, PortalFixtures,
ClientFixtures, Forum, ForumAccess, Media, Integrations and PublicIdentity 49 of 49; PortalHttp 3 of 3 (390 px and
desktop, and the gateway return read with no session); the remote pair: RemoteFixtures 1 of 1, RemoteHttp 4 of 6 with
the portal feature passing and the two image features needing an image-enabled build (F377).

P18 second review fixes (F385): AccountingPortals 16 of 16 with OrderToCashBasicFlow and OrderProcureToPayBasicFlow (58
of 58); mr-pass Portals, PortalFixtures, ClientFixtures and Forum 17 of 17; PortalHttp 3 of 3; mr-boss
AccountingPayables and AccountingAccess 56 of 56.

### P15 build — Oct 31, 2026

Built:
- Mantle (`mantle.other.BudgetServices`, `BudgetReportServices`, `other/Budgets.js`, `entity/BudgetControlEntities.xml`):
  the Budget status flow (F42, F310); `change#BudgetState` (approve with `BUDGET_APPROVE` and the self-approval rule,
  close, cancel); `revise#Budget` (`BUDGET_EDIT`) as `BudgetRevision` and impacts with audit-logged amounts, so
  `get#BudgetAmounts` and `run#BudgetVariance` read a budget as of a revision; the approved budget's PDF per revision as
  `BudgetContent`; `store#BudgetParty`; `BudgetControlPolicy` dated rows with audit-logged key fields (`store#Policy`,
  `ACCOUNTING_ADMIN`); `BudgetCommitment` with `check#Budget`, `reserve#`, `convert#` and `release#Commitment`, each
  idempotent per source revision; a Stop's refusal kept as a blocked commitment and the `BudgetOverride` notice to the
  organization's overriders; `approve#Payable` converting a purchase order line's commitment to the bill's actual
  (`budgetOverrideReason` for a Stop); the invoice's budget evidence (F75); `run#BudgetVariance`, organization- and
  period-checked, with the committed column and actuals net of credits (F6, F311). §4 has the decisions.
- BOSS: the Budgets area (Budgets, BudgetDetail, BudgetControls) for the GL, reader, approver and finance admin groups,
  Reports/BudgetVariance, `ironstone.accounting.BudgetServices` (`find#Budgets`, `get#BudgetDetail`, `find#Policies`,
  `find#Exceptions`, `find#Commitments`) over `Budgets.js`, the budget choices, BillDetail's Approve over budget and
  Budget details tab, the BudgetOverride topic in Approvals, `BUDGET_APPROVE` for the approver and admin groups, and the
  demo budget (`Demo.js` `budgets`).

Usable when (§3):
- an approved budget's revision keeps the old numbers: the budget and its variance read as approved and as revised
  (mr-mantle AccountingBudgets, mr-boss AccountingBudgets, AccountingBudgetsWalk);
- a commitment reserved and converted is not counted again as actual: an order's 300 committed becomes 300 actual and
  0 committed when its bill is approved;
- an over-budget expense under Stop is refused, and an override needs a reason and `BUDGET_OVERRIDE`.

For later phases:
- P16 reads `run#BudgetVariance` (organization, budget, sub period, revision or as-of date; rows with budget, committed,
  actual, remaining, variance and percent; totals and `asOf`) and decides the closed-period summaries (F313).
- Purchasing's callers and the rest are §7 "From P15".

Verified Oct 31, 2026 (runtime without a full suite run; the orchestrator runs the suites after merging):
- `./moq test mr-mantle --spec AccountingBudgets,BudgetServices,AccountingPayables,AccountingMatching,`
  `OrderProcureToPayBasicFlow,OrderToCashBasicFlow,ReturnToResponseBasicFlow,InvoicePaymentMisc,InvoiceOrderApply,`
  `AccountingReceivables`: 134 passed, 0 failed; the flow specs unchanged.
- `./moq test mr-boss --spec AccountingBudgets,AppStructure,TuiRender`: 24 passed; `--spec AccountingAccess,AccountingShell,`
  `AccountingPayables,AccountingScreens,AccountingReceivables,AccountingIsolation,AccountingMatching,AccountingTax,`
  `AccountingBanking,Billing,BillingWalk,ClientBilling,MilestoneBillingWalk,AppOrganizationFilters`: 180 passed, 0 failed.
- `./moq test-client mr-boss --serve --spec AccountingBudgetsWalk`: 3 of 3.
- `moqui lint --screens`: 126 flagged sites, none in the P15 screens (Shared/InvoiceMatch's one is P7's).

Commits: mr-mantle `bb0ab99c`, `de8f2b20`; mr-boss `585c756`, `cdfed50`.

After merging master (P8, P11), Oct 31, 2026: budget actuals leave out a period close's closing entries (F318; mr-mantle
`025570dc`). mr-mantle AccountingBudgets, BudgetServices, AccountingPayables, AccountingMatching, AccountingPaymentRuns,
AccountingPeriodClose, the four flow specs and InvoiceOrderApply: 128 passed, 0 failed. mr-boss AccountingBudgets,
AccountingShell, AccountingAccess, AppStructure, TuiRender, AccountingPayables, AccountingPaymentRuns,
AccountingPeriodClose, AccountingScreens and ClientIsolation: 152 passed, 0 failed. Walks with `mail_capture_sends=true`
(AccountingBudgetsWalk, AccountingPayablesWalk, AccountingPaymentRunsWalk, AccountingCloseWalk): 7 of 7. Merges:
mr-mantle `c5b7644b`, mr-boss `c970d1e`.

Review fixes, Oct 31, 2026 (F319–F326; the §4 commitments row revised): bills read their posting in effect and reverse
their actuals when the approval is undone or the bill cancelled; an order commitment is used once across a bill's lines
and converts only on its own account; a revised order line holds its new amount less what it passed on; the conversion is
in `change#InvoiceState`; the control and the lists read the latest revision; the writers check `BUDGET_EDIT` and the
organization; reserve and release drop `PAYABLE_EDIT`, release needs a closed source or `BUDGET_OVERRIDE`; and the minor
items. mr-mantle AccountingBudgets (11 features), BudgetServices, AccountingPayables, AccountingMatching,
AccountingPaymentRuns, AccountingPeriodClose, the four flow specs and InvoiceOrderApply: 126 passed, AccountingMatching's
order-dependent case failed once and its 6 later features were skipped (F326, fixed; 14 of 14 alone and with
AccountingBudgets). mr-boss AccountingBudgets,
AccountingPayables, AccountingShell, AccountingAccess, AppStructure, TuiRender, ClientIsolation and
AccountingPaymentRuns: 145 passed, 0 failed. AccountingBudgetsWalk and AccountingPayablesWalk
(`mail_capture_sends=true`): 4 of 4. Master had nothing new to merge.

Second review fixes, Oct 31, 2026 (F327, F328; §7 notes a cancelled line of an open order): mr-mantle AccountingBudgets
(11 features) and AccountingMatching 25 of 25; BudgetServices, AccountingPayables and the four flow specs passed in the
same run (AccountingBudgets' revised-line check failed there on an assertion read after the reversal, fixed). mr-boss
AccountingBudgets and AppStructure 22 of 22; AccountingBudgetsWalk (`mail_capture_sends=true`) 3 of 3. Then master (P17)
was merged (mr-mantle `d954ad2e`, mr-boss `1969261`): mr-mantle AccountingBudgets, BudgetServices, AccountingPayables,
AccountingMatching, AccountingReturns and the four flow specs 124 of 124; mr-boss AccountingBudgets, AccountingShell,
AccountingAccess, AppStructure, TuiRender, ClientIsolation and AccountingPayables 141 of 141; AccountingBudgetsWalk,
AccountingPayablesWalk and AccountingReturnsWalk (`mail_capture_sends=true`) 5 of 5.

### P16 build — Oct 31, 2026

Built:
- Mantle (`mantle.ledger.LedgerReportServices`, `FinanceReportServices`, `ledger/FinanceReports.js`,
  `mantle.sales.SalesReportServices`, `sales/SalesAnalysis.js`): the statement services check report read, the
  organization and its periods (F6, F331), and read each period's summary rows, stored for a closed period and summed
  from posted entries for an open one, with the sums period close stores (§4, F16, F330); `asOf`, `complete` and
  `incompleteReasons` on each; `get#PeriodSeriesSummary` and `get#AccountLedgerInfo` checked; `run#PostedAmountSummary`
  by book day with balances (F332); `run#PartnerLedger`; `run#SalesAnalysis` and the organization filter of the top
  product and customer class summaries (F333). Period close's summary sums are `FinanceReports.periodTotals`.
- BOSS: `ironstone.accounting.ReportServices` (`get#Catalog`, `check#ReportChoice`, `get#Statement`) with `Reports.js`;
  Reports (the catalog with quick options), BalanceSheet, IncomeStatement, CashFlow, RetainedEarnings, FinancialRatios
  and AccountBalance on `template/AccountingReports.xml`, PartnerLedger, PostedSummary and SalesAnalysis, each with
  `template/AccountingReportParts.xml`'s print link and as-of, incomplete and error states; Home complete (`Home.js`):
  the money cards and MyFinanceWork (§4); the report services in the Accounting artifact group.

Usable when (§3):
- each report runs for the demo organization, drills to its source (an account to the general ledger with the report's
  organization, period and currency; a ledger line to its invoice, bill, payment or entry; a month to its trial balance;
  a product or customer to its page) and prints and exports the same rows (mr-boss AccountingReporting,
  AccountingReportsWalk);
- a reader of one organization sees no other organization's balances through any report or export, sales analysis
  included (mr-mantle AccountingStatements, mr-boss AccountingReporting and AccountingAccess).

For later phases: §7 "From P16". P19's Setup and P20's document currency read the same summary rows.

Verified Oct 31, 2026 (runtime without a full suite run; the orchestrator runs the suites after merging):
- `./moq test mr-mantle --spec AccountingStatements,FinancialReports,AccountingReports,AccountingPeriodClose,SalesReports,`
  `AccountingRecurringAging,AccountingProjectCost`: 85 passed, 0 failed (with OrderToCashBasicFlow and
  AccountingActivities, which FinancialReports depends on).
- `./moq test mr-boss --spec AccountingReporting,AccountingShell,AccountingScreens,AppStructure,TuiRender,AccountingAccess`:
  136 passed, 0 failed after the link checks were fixed (AccountingReporting and AccountingAccess again: 70 of 70).
- `./moq test-client mr-boss --serve --spec AccountingReportsWalk`: 3 of 3.
- `moqui lint --screens`: no flagged site in the P16 screens and templates.

Review fixes, Oct 31, 2026 (F336–F348): the cash flow's change in cash from the cash accounts; the account ledger by book
day from the period's summary; the sales summaries scoped and the analysis by sales lines and requested returns; readable
child periods only; open periods carried forward; cheaper Home work sources; the smaller items. mr-mantle
AccountingStatements (10 features), FinancialReports, AccountingReports, AccountingPeriodClose, SalesReports: 79 of 79.
mr-boss AccountingReporting, AccountingShell, AccountingAccess, AppStructure, TuiRender: 136 of 136. AccountingReportsWalk
3 of 3. mr-marble SimpleScreensRender (with mr-mantle): 135 of 143, the same 8 failures as on master (its statement,
reconciliation and period drop-down cases name period 55100, which that run does not have); its SalesSummary passes.
Master had nothing new to merge.

### P13 build — Oct 31, 2026

Built:
- Mantle's valuation (`mantle.product.InventoryReportServices`, logic in `product/InventoryValuation.js`):
  `run#InventoryValuation` (stock at each asset's current cost from `AssetValuationSummary`, by product, beside the
  inventory and WIP accounts of the organization's mappings, the difference, the exceptions of F40 and open WIP by run;
  organization-checked, F6), `run#StockTransactions` (a period's receipts, issues and count variances with cost and
  posting; organization- and period-checked), `get#ProductAccounting` (Product360's Accounting context, prices only with
  PRICE_VIEW) and `check#ValuationClose`, the two valuation rows of P11's checklist (`PccReceiptCostBasis`,
  `PccValuationTieOut`).
- Landed costs (`mantle.ledger.AssetBookServices`, logic in `ledger/AssetCosts.js`, apart from P9's and P12's):
  `mantle.account.invoice.LandedCostAllocation`, `get#LandedCostSources`, `preview#LandedCost` and `post#LandedCost`
  (`ACCOUNTING_GL_POST`; on-hand share to the assets' cost, issued share to cost of goods sold or production variance,
  the charge account credited, once per line, operation key); `repair#ProductAcquireCost`, CostDataRepair (finance
  admin, audited, open periods; F39, F270).
- `GatLaborApplied`, `GatOverheadApplied`, `GatOutsideProcessAccrued`, `GatProductionVariance` and
  `AssetTypeGlAccount.scrapGlAccountId` (in PostingDefaults' asset mapping); scrap by reason in
  `post#PhysicalInventoryVariance` with the `InVrScrap` and `InVrExpired` reasons (§4).
- Screens: the Inventory section with `Shared/InventoryValuation`'s Accounting context (valuation, accounts, exceptions,
  open WIP, Revalue into P9's dialogs, Repair product cost); `Payables/LandedCosts`, from BillDetail's More;
  `Records/Product360`, `Shared/Product360`'s Accounting branch with the GL mappings pane (§4, F135);
  `Reports/StockTransactions`; PeriodCloseDetail links the valuation rows.
- Demo: BOSS_ACCT_ORG's revaluation on (`store#Preferences`), its InVrScrap and InVrExpired accounts, a scrapped unit of
  the supplies, their weight, and the carrier's approved freight bill BOSS_ACCT_BILL_FREIGHT.

For later phases:
- P12 adds its own services to AssetBookServices beside these; P17's returns and Purchasing's revisions do not touch
  landed costs yet. P19's readiness checks the WIP, transfer and production accounts and F271's COGS assignment.
- Manufacturing's cost close posts to the seeded GL types and lists its runs with `wipRows`' rule. §7 "Valuation (P13)".

Revaluation (Products P9) verified as §4 says: with the flag off the preview is refused; on, the post sets the on-hand
assets' cost, posts on-hand × delta against the offset account, a later issue posts at the new cost, and the valuation
and the inventory account still agree (mr-mantle AccountingValuation).

Verified Oct 31, 2026 (no full suite run):
- `./moq test mr-mantle --spec AccountingValuation,AccountingPeriodClose,OrderToCashBasicFlow,OrderProcureToPayBasicFlow,`
  `ReturnToResponseBasicFlow,InvoicePaymentMisc,AccountingControls,LedgerMaintenance,ProductStandardCosts,`
  `AccountingPayables,AccountingMatching,AssetReservationMisc`: 182 passed, 0 failed.
- `./moq test mr-boss --spec AccountingValuation,AccountingAccess,AccountingShell,AppStructure,TuiRender,ClientIsolation,`
  `AccountingPeriodClose,AccountingPayables,AccountingScreens,AccountingMatching,ProductsCosts,ProductsScreens,`
  `ProductsAccess,ProductsSharedContext,ProductsInventory,ServerStatic`: 246 passed, 0 failed.
- `./moq test-client mr-boss --serve --spec AccountingValuationWalk`: 1 of 1 (15 s).
- `moqui lint --screens`: 126 flagged sites, none in the P13 screens and template (the one more than P11's 125 is
  P7's Shared/InvoiceMatch).

After merging master (P8): mr-mantle AccountingValuation, AccountingPeriodClose, the four flow specs, ProductStandardCosts
and AccountingPaymentRuns 115 passed; mr-boss AccountingValuation, AccountingShell, AccountingAccess, AppStructure,
TuiRender, ClientIsolation, AccountingPaymentRuns, AccountingPeriodClose, AccountingPayables and AccountingScreens 151
passed; AccountingValuationWalk, AccountingPaymentRunsWalk, AccountingCloseWalk, AccountingPayablesWalk and
ProductsCostWalk (`mail_capture_sends=true`) 6 of 6; lint unchanged.

Commits: mr-mantle `b75ecb25`, merge `4f161a1e`; mr-boss `f5d18bd`, `ac84737` (docs), merge `bd1bbfb` and this record.

Review fixes, Oct 31, 2026 (F275–F287; §4): the landed cost fingerprint covers the whole split and every asset of a
receipt's chain; holders followed once (moves, revaluation splits, transfer shipments) and summed; the issued share by
issue kind; inventory at quantity × the unit change with the rounding to cost of goods sold; cost repair refused after
revaluation or landed cost events; an earlier day's valuation at that day's cost; the facility's ledger by its assets;
capped stock and WIP reported incomplete; non-inventory receipts without cost kept in `PccStockPostings`. After merging
master (P17): mr-mantle AccountingValuation (13 features), AccountingPeriodClose, the four flow specs and
ProductStandardCosts 113 passed; mr-boss AccountingValuation, AccountingPeriodClose, AccountingShell, AccountingAccess,
AppStructure, TuiRender, ClientIsolation, the Products specs over Product360 and InventoryValuation (Documents,
Inventory, Access, Methods, Costs, Screens, PriceScreens, Shell, Suppliers, VariantScreens, Tools, SharedContext) and
ServerStatic 357 passed; AccountingValuationWalk 1 of 1. Commits: mr-mantle `a8d6ed2c`, merge `369b84c0`; mr-boss
`27ec357`, merge `7c3dc51` and this record.

### P10 build — Oct 31, 2026

Built:
- CX-ORDER-HOLD (Mantle): `mantle.order.OrderHoldReason` with `OrderHoldType` (Credit, Change, Purchase, Manual; the
  releasing permission as enumCode); `OrderServices.hold#Order` and `release#OrderHold`, which returns the order to
  Approved only when no other reason is open; reservations stay; nothing uses OrderBeingChanged.
- AC-11 (Mantle `CreditServices`, `account/Credit.js`): `CustomerCreditPolicy` (dated rows, audit-logged) and
  `CreditHoldDecision`; `store#Policy`, `store#Defaults`, `evaluate#OrderCredit`, `release#CreditHold`,
  `get#CustomerCreditStatus`. The check runs inside `approve#Order` (Hold holds, Warn warns, `ORDER_HOLD_OPEN` for a held
  order) and as the `OrderPreApproveCredit` SECA on `check#OrderPreApprove` (`approving` from `autoApprove#Order`), which
  stops Mantle's auto-approval (F34). CreditHoldRelease to the organization's credit managers, in Approvals.
- AC-10 (Mantle `CollectionServices`, `account/Collections.js`): `CollectionActivity`, `CollectionPromise`,
  `Invoice.disputedDate`/`disputeNote`, `DunningLevel`, `DunningRun`, `DunningNotice`; `record#Activity`,
  `store#Promise`, `get#CustomerCollections`, `store#Level`, `preview#Dunning`, `send#Dunning` (each notice in its own
  transaction), `get#DunningRun`; `MANTLE_DUNNING_EMAIL` and `DunningNotice.html.fancy`. `send_SalesInvoicePastDueEmails`
  stays paused.
- AC-09 (Mantle `RecurringInvoiceServices`, `account/RecurringInvoices.js`): `InvoiceSchedule`,
  `InvoiceScheduleOccurrence`; `store#Schedule`, `preview#Period`, `generate#Invoices` (one draft per period),
  `generate#Occurrence`, `record#OccurrenceFailure` (RecurringInvoiceFailed) and the `generate_RecurringInvoices` job
  (`run#Schedules`).
- Aging: `LedgerReportServices.run#Aging` as of a day (`ledger/Aging.js`; due schedule portions, calendar days, complete
  flag); `InvoiceAgingSummary` fixed (F36, F213).
- BOSS: Receivables/Collections, Dunning and RecurringInvoices (with the recurring orders and the last
  `create_RecurringOrders` run, D24); Settings/CollectionPolicies; Reports/Aging; Customer360's Credit and Activities
  tabs; OrderDetail's hold banner with Release hold; `template/AccountingCollections.xml`; `CollectionServices.xml`,
  `RecurringServices.xml` and `HomeServices.get#TodayItems` over `Collections.js` (the Accounting today-source: credit
  holds, recurring failures); `creditView` and `creditRelease` capabilities. Demo: Granite Peak Supply overdue with a
  disputed invoice and a next action, two reminder levels, Summit Retail's order held for credit, the monthly sublease.

Usable when (§16.3 invoice-to-cash, overdue and credit; batch), each in a spec:
- an order over its customer's limit is held on approval, by Mantle's auto-approval and by `approve#Order` alike, keeps
  its reservations, and a credit manager releases it with a reason (Mantle AccountingCredit; BOSS AccountingCollections;
  AccountingCollectionsWalk);
- a dunning run excludes a disputed invoice, and one failed recipient does not resend the rest (Mantle
  AccountingCollections; BOSS AccountingCollections; the walk sends the demo run);
- a retried generation of a recurring schedule makes one draft (Mantle AccountingRecurringAging);
- Aging for a past day buckets on calendar days compared in JavaScript, with no database day arithmetic, so it buckets
  the same on any database. H2 is not in this build (an `h2` conf opens the embedded Postgres), so the H2 case was not
  run; the Postgres case and Mantle's fixed view are in AccountingRecurringAging.

For later phases:
- Sales and Customer Service approve sales orders through `approve#Order`, which checks credit; the direct status writes
  are §5 (F210). Customer Service reads the hold and its reason through `get#CustomerCreditStatus`.
- P16's reports read `run#Aging`; P19's readiness flags an unpaused `send_SalesInvoicePastDueEmails`; §7 "Collections,
  credit and recurring (P10)".

Verified Oct 31, 2026, after merging master (P12, P17, P18; no full suite run):
- `./moq test mr-mantle --spec AccountingCredit,AccountingCollections,AccountingRecurringAging,OrderToCashBasicFlow,`
  `OrderProcureToPayBasicFlow,ReturnToResponseBasicFlow,InvoicePaymentMisc,OrderLifecycle,OrderBulk,AssetReservationMisc,`
  `WorkPlanToCashBasicFlow,AccountingReceivables,AccountingDelivery,AccountingPaymentRuns,AccountingReturns,`
  `AccountingPeriodClose,AccountingPayables,AccountingPortals`: 210 passed, 0 failed; the flow specs unchanged.
- `./moq test mr-boss --spec AccountingCollections,AccountingAccess,AppStructure,TuiRender,AccountingShell,`
  `AccountingScreens,AccountingReceivables,AccountingPayables,ClientIsolation,AccountingIsolation,Notifications,Billing,`
  `BillingWalk,ClientBilling,MilestoneBillingWalk`: 202 passed, 0 failed.
- `./moq test-client mr-boss --serve --spec AccountingCollectionsWalk,AccountingReceivablesWalk,AccountingPayablesWalk`
  with `mail_capture_sends=true`: 4 of 4.
- `moqui lint --screens`: 126 flagged sites, none in Accounting or the new shared tabs.

Commits: mr-mantle `03357dc9`, `9fc6283f`, `b585467d` (docs), merges `08851ead` and `ccf7553c`; mr-boss `01cd74a`,
`e958ea3` (docs), merge `6faaef2`, `7a4cd62` (the demo after the merge), merge `2048fa8` and this record.

P10 review fixes, Oct 31, 2026 (F221–F229; and the smaller items: the hold services' organization contract stated, an
organization without any credit policy answered by one count, the policy currency default in §4, OrderBulk's side effect
in §5, one RecurringInvoiceFailed notice per failed period, the schedule's state read again under its lock, no reference
number copied, a dunning notice marked sending in its own transaction before its email so a retry never sends it again,
the misplaced Payables.js comment). After merging master (P12, P13, P15): mr-mantle AccountingCredit (8),
AccountingCollections (8), AccountingRecurringAging (7), the four flow specs, InvoicePaymentMisc, OrderLifecycle,
OrderBulk, AssetReservationMisc, AccountingReceivables, AccountingReturns and AccountingPeriodClose 170 features, 168
passed; the 2 failures were WorkPlanToCashBasicFlow's posting-entry order (P11's record), which passed alone and with the
P10 and flow specs (101 of 101). mr-boss AccountingCollections, AccountingAccess, AppStructure, TuiRender,
AccountingShell, ClientIsolation, AccountingPayables, Billing, BillingWalk, ClientBilling and MilestoneBillingWalk 178 of
178; AccountingCollectionsWalk 2 of 2 (`mail_capture_sends=true`). mr-marble SimpleScreensRender with MarbleScreens: 153
of 161, the same 8 failures on master; none of its specs renders Invoice/Aging.

P10 second review fixes, Oct 31, 2026 (extending F221 and F226; and the smaller items: the dunning cadence keyed on
organization, customer, currency and level; a recurring line copied without its links to other records (parent invoice
item, asset, financial account transaction, payroll adjustment, sales opportunity) or a manual tax line's rate fields;
authorized payments counted only on open orders, `CreditOrderPaymentSum`; a preview for a past day reading the open
portions as of that day). mr-mantle AccountingCredit (9), AccountingCollections (9), AccountingRecurringAging, the
flow specs, InvoicePaymentMisc, OrderLifecycle and OrderBulk 116 of 116; mr-boss AccountingCollections, AccountingShell,
AccountingAccess, AppStructure and TuiRender 128 of 128; AccountingCollectionsWalk 2 of 2 (`mail_capture_sends=true`).

### P19 build — Oct 31, 2026

Built:
- Chart templates (§4, F14): the `OrgAccountingTemplate` role, carried by DefaultSettings, Mantle's installed chart;
  `init#PartyAccountingConfiguration` (`sourcePartyId`) copies it, now with its variance reason and tax authority
  accounts (F394). The installed chart gains the migration clearing account 913000000 (`GatMigrationClearing`).
- AC-01 activation (Mantle `SetupServices`, `ledger/AccountingActivation.js`, `ACCOUNTING_ADMIN`):
  `AccountingSetupRun` (one per organization) and `AccountingSetupBalance`; `store#SetupRun` (sets an organization up
  from a template with the guard and single-currency documents on, or changes its basis through `store#Preferences`;
  the fiscal periods of the opening day; the trial balance lines, one or all, or a CSV), `preview#OpeningBalances`,
  `import#OpenItems` with `create#OpenItem` per row (real invoices and bills with `openingSetupRunId`, at their own
  document and due dates, booked on the opening day against migration clearing; a refused row named, the rest kept; a
  repeat answers the first; `verifyOnly`), `check#Readiness` (§4: blockers and warnings, among them single currency,
  the WIP and transfer accounts, the paused reminder job, the guard, non-postable and unassigned mappings, F71, F190,
  F250, F251, F271) and `activate#Accounting` (once per run version, by operation key; an activated run answers its
  posting). `get#Readiness` answers `setupStatus`.
- BOSS: Settings/Setup, a wizard over Basis, OpeningBalances, OpenItems, Readiness and Activate; Home offers it first
  (one primary) to an organization not set up or in setup; the settings overview links it. Demo BOSS_ACCT_NEWCO in
  setup (`load#SetupDemo`).

Usable when (§16.3 batch/activation), each in a spec:
- a new organization's opening trial balance and open items tie before activation, and readiness names the account that
  does not (Mantle AccountingSetup);
- one bad open-item row is named and the rest kept, and importing again makes nothing twice (Mantle AccountingSetup;
  AccountingSetupWalk names the refused row);
- activating twice posts once, under the same or another operation key, and migration clearing nets to zero (Mantle
  AccountingSetup; AccountingSetupWalk activates);
- aging, dunning and a payment run work on the imported items: their due schedules are written at their own due dates
  (Mantle AccountingSetup).

For later phases:
- P20 removes the single-currency refusal of open items and the readiness row's blocker; open items in another currency
  then need their rate.
- P21: the setup screens' terminal twins are the XML steps (AppStructure and TuiRender render each).
- §7 "Setup and activation (P19)".

Verified Oct 31, 2026 (runtime without a full suite run; the orchestrator runs the suites after merging):
- `./moq test mr-mantle --spec AccountingSetup,OrderToCashBasicFlow,OrderProcureToPayBasicFlow,ReturnToResponseBasicFlow,`
  `InvoicePaymentMisc,AccountingControls,AccountingValuation,AccountingPaymentRuns,AccountingCollections,`
  `AccountingRecurringAging,AccountingReceivables,AccountingPayables`: 177 passed, 0 failed; the flow specs unchanged.
- `./moq test mr-boss --spec AppStructure,TuiRender,AccountingShell,AccountingAccess,AccountingScreens`: passed.
- `./moq test-client mr-boss --serve --spec AccountingSetupWalk`: 1 of 1.
- `moqui lint --screens`: 126 flagged sites as before, none in Accounting's setup screens.

After merging master (no P16 yet), Oct 31, 2026: mr-mantle AccountingSetup, the four flow specs, InvoicePaymentMisc,
InvoicePostOrder, AccountingControls, AccountingValuation, AccountingPaymentRuns, AccountingCollections,
AccountingRecurringAging, AccountingReceivables and AccountingPayables 179 of 179 (AccountingSetup again after the
posted-history readiness row, 5 of 5); mr-boss AccountingAccess, AccountingShell, AppStructure, TuiRender,
AccountingScreens, AccountingCollections and AccountingPaymentRuns 139 of 139; AccountingSetupWalk and
AccountingSettingsWalk 2 of 2.

Commits: mr-mantle `3634b2bd`, `c6e68dec`, `13853522` (docs), the merge of master and the posted-history row; mr-boss
`1c12928`, `22284fa` (docs), the merge of master and this record.

P19 review fixes, Oct 31, 2026 (F396–F404; §4): an inherited configuration is configured (no template set-up, the
parent's basis kept, mappings read over the chain); open items need the posting guard; readiness warns of unmapped
production cost accounts; a check keeps its results apart and takes no lock; cancelled invoices are not repeats; open
bills carry the importer's approval; a credit on an open item takes the Opening balance item type's account; Setup has
its own menu index and the walk makes its own organization. After merging master (P16 Reports; Home keeps P16's cards
with the setup box first): mr-mantle AccountingSetup (7), the flow specs, InvoicePaymentMisc, AccountingReceivables and
AccountingStatements 106 of 106; mr-boss AccountingAccess, AccountingShell, AppStructure, TuiRender, AccountingScreens
and AccountingReporting 141 of 141; AccountingSetupWalk, AccountingSettingsWalk and AccountingReportsWalk pass (the setup
walk 1 of 1 after its currency option fix); `moqui lint --screens` 126 flagged sites, none in Accounting. Commits:
mr-mantle `5a2447a3`, merge `1a3f106b`, `7e23f8c6` (docs); mr-boss `00dc107`, merge `a6515a1` and this record.

### P20 build — Oct 31, 2026

Built:
- AC-19 (CX-FX; F19, F20), Mantle `ledger/Currencies.js`: `post#AcctgTrans` converts an unposted transaction in another
  currency to `PartyAcctgPreference.baseCurrencyUomId` before the guard, at the rate it carries (its document's, passed
  by `post#Invoice`, `post#InvoiceAdjustment` and `post#Payment`) or the rate of its book day; each side trued up on its
  largest line; `amountUomId` the base, `originalCurrencyUomId` and each line's `originalCurrencyAmount` the document's,
  the decimal rate with its date and source on the transaction (`AcctgTrans.exchangeRate`, `exchangeRateDate`,
  `exchangeRateSource`) and on the document (`Invoice`/`Payment.exchangeRate`, with `exchangeRateToUomId`). No rate:
  `RATE_MISSING` with the guard, the error journal without it; `verifyOnly` reports it.
- `post#PaymentApplication` converts an application at its documents' kept rates and books the realized difference to
  `GatForExGain` or `GatForExLoss` (DefaultSettings 817000000, 797000000, with their assignments); a document applied
  in parts clears exactly what it posted (F413). A payment in another currency posts unapplied (F411).
- D18 removed: `change#InvoiceState`'s `FOREIGN_CURRENCY_DISABLED`, the open items' `CURRENCY_NOT_BASE`, Setup's
  single-currency flag and `singleCurrencyDocumentsOnly`; readiness's `SINGLE_CURRENCY` row became `EXCHANGE_RATES`
  (open documents' currencies with no rate on the opening day block; unmapped exchange accounts warn). The close's
  missing-rate row and the invoice reconciliation read the kept rates (F414).
- AC-16 provider rates (§4 Oct 28): `CurrencyServices.refresh#Rates` over `define#RateProvider`, the ECB provider
  `get#EcbRates` (daily file, or a copy as `sourceText`), `CurrencyRateProposal`, `get#RateProposals`,
  `accept#RateProposals` and `reject#RateProposals` (`ACCOUNTING_ADMIN`); `rateProviderServiceName` in
  `store#Preferences` (an `ExchangeRateProvider` enumeration only) and AccountingPreferences.
- BOSS: Currencies gains Fetch rates (with the provider) and the proposed rates list with Accept and Reject selected;
  AccountingPreferences the provider in place of Base currency documents; Readiness links the rates row to Currencies;
  the demo names the ECB provider through `store#Preferences`.

Usable when (§16.3 invoice-to-cash, currency), each in a spec:
- a foreign-currency invoice posts at its rate and is paid at another, and the difference is booked: a gain and a loss
  (Mantle AccountingCurrency);
- the GL summaries hold base currency only: the trial balance of the spec's organization, and AccountingReports'
  transaction in another currency converted;
- Setup no longer says single currency: readiness's `EXCHANGE_RATES` row (AccountingCurrency, AccountingSetup);
- a fetch proposes rates a finance administrator accepts before they are active (AccountingCurrency;
  AccountingCurrencyWalk accepts one on Currencies).

For later phases: §7 "Base-currency posting (P20)"; §5's rate scope.

Verified Oct 31, 2026 (runtime without a full suite run):
- `./moq test mr-mantle --spec` every Accounting spec, OrderToCashBasicFlow, OrderProcureToPayBasicFlow,
  ReturnToResponseBasicFlow, WorkPlanToCashBasicFlow, InvoicePaymentMisc, InvoicePostOrder, PayrollServices,
  PayrollAdjustments, LedgerMaintenance and FinancialReports: 473 features, 445 passed; AccountingReceivables' currency
  feature passed after its change (22 of 22); AccountingStatements' setup collided with AccountingDelivery's fixture
  ids, which master fixes (07a4b352). Changed specs: AccountingReceivables (another currency with no rate is refused,
  `RATE_MISSING`, in place of D18's refusal), AccountingSetup (the rates row), AccountingReports (the other currency
  converted at its rate), the fixtures (no single-currency flag); the flow specs unchanged.
- `./moq test mr-boss --spec AccountingAccess,AccountingShell,AppStructure,TuiRender,AccountingScreens`: 129 of 129; the
  other Accounting specs, Billing and ClientIsolation 145 of 145.
- `./moq test-client mr-boss --serve --spec AccountingCurrencyWalk,AccountingSettingsWalk,AccountingSetupWalk`: 3 of 3.
- `moqui lint --screens`: 126 flagged sites as before, none in Accounting.

After merging master (AccountingStatements' own fixture ids; AccountingPaymentFiles' organization restore), Oct 31,
2026: mr-mantle AccountingCurrency, AccountingReports, AccountingSetup, AccountingReceivables, AccountingStatements,
AccountingDelivery, AccountingCustomerFinance, AccountingMatching, AccountingInternalTransfers, the four flow specs,
InvoicePaymentMisc and PayrollServices pass (AccountingDelivery's euro invoice now carries its own rate, since alone it
found no euro rate to post at); mr-boss AccountingAccess, AccountingShell, AppStructure, TuiRender and
AccountingPaymentFiles 132 of 132; AccountingCurrencyWalk 1 of 1. Also passing: Billing, BillingWalk, ClientBilling,
MilestoneBillingWalk 22 of 22; AccountingReceivablesWalk (with `mail_capture_sends=true`), AccountingPaymentsWalk and
AccountingReportsWalk.

P20 review fixes, Oct 31, 2026 (F417–F428; §4, §5): asset costs post at their asset's kept rate, error-journal application
re-posts book their difference, adjustments post cumulatively, rate writers need finance administration of every
organization, kept rates are taken again on a re-post with nothing depending on them, rates must be positive, a re-posted
document keeps its rate, the provider is asked outside a transaction, `APPLICATION_SHAPE`, readiness warns of unconverted
postings; F424 left as named incomplete. AccountingCurrency 14 of 14 (inventory, adjustment, re-post, payables with
unapply and apply again, a credit memo at its own rate, an error-journal application, the rate writers).
