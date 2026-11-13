# IronStone BOSS — UI review: Accounting

Contents: [scope and sources](#1-purpose-scope-and-sources) · [method](#2-review-method-and-refinement-criteria) ·
[screen inventory](#3-screen-and-surface-inventory) · [activities](#4-end-to-end-activities) ·
[verification](#5-existing-checks-and-future-verification) · [running record](#6-coverage-findings-and-running-record) ·
[decisions](#7-decisions).

## 1. Purpose, scope and sources

Review and refine Accounting as finance staff work: establish an organization's books, invoice and collect, review
and pay bills, reconcile cash, explain ledger balances and close a period. Follow transactions from their operational
source to their financial outcome, including corrections, approvals, evidence and outputs. Aim for a comfortable
daily workspace in which people can see whose books they are working in, what an amount means, what they may do next
and what a confirmed action will change. Substantial layout and navigation refinements may be proposed where they
improve an implemented workflow.

This follows [Products](ui-review-products.md) and the
[document convention](design-doc-guide.md#ui-review-and-refinement-phase); it is the plan and running record of the
Accounting review: inventory, activities, coverage, findings, decisions and bounded execution notes.

**Status: planning only, 2026-11-10 America/Chicago; checked against source 2026-11-11.** All live activity and
mode coverage starts pending. No application behavior was changed, no review runtime was started and no tests were
run to write or check it. Earlier Accounting implementation results and the completed Products review inform the
plan; they do not establish Accounting review outcomes. This task does not start the review; acceptance runs follow
§5.

### Inputs and reference patterns

- [Accounting design](design-accounting.md), [implementation](impl-accounting.md),
  [research](research-accounting.md) and [implementation notes](../docs/AccountingImplementation.md).
- Companion reviews [Warehouse](ui-review-warehouse.md), [Manufacturing](ui-review-manufacturing.md),
  [Purchasing](ui-review-purchasing.md) and [Customer Service](ui-review-customer-service.md);
  [Products review](ui-review-products.md), [Projects review](ui-review-projects.md),
  [drawers, Commons and Comms review](ui-review-drawers-commons.md),
  [framework UI review guide](../../../../../docs/dev/UI-Review.md) and
  [framework review](../../../../../plans/archive/UI-Refinement.md): activity/evidence method and established refinements.
- [Application practices](../../../../../docs/dev/Practices-App-Dev.md), [style guide](style-guide.md),
  [crosscut design](design-crosscut.md), and current Manufacturing, Purchasing, Warehouse, Projects, Customer Service,
  Commerce and PASS contracts where they hand records to Accounting.
- Current `screen/Accounting.xml`, `screen/Accounting/`, mounted `screen/Shared/` sources, the ten
  `template/Accounting*.xml` parts, `service/ironstone/accounting/`, `MoquiConf.xml`,
  `data/BossAccountingSetupData.xml` (groups, permissions, artifact grants, notification topics),
  `data/BossAccountingUsersDemoData.xml`, `data/BossZAccountingDemoData.xml`, `data/BossZSetupDemoData.xml`,
  `data/BossZPortalDemoData.xml`, `data/BossUsersDemoData.xml` (neighbouring apps' finance-group users) and the demo
  loader `service/ironstone/accounting/Demo.js`.
- Current Accounting regression/acceptance specs and their client registrations; Mantle's accounting, ledger, tax,
  asset, production-cost, budget and external-access services and rule tests. Current sources take precedence over
  historical route, role, output and “Later” tables.

Use the existing research as a comparison lens: ERPNext for reconciliation, collections and budgets; Carbon for
settlement, close and setup continuity; Odoo for journal/document navigation; and the Moqui baseline for record and
service contracts. These are patterns documented in the earlier research, not fresh claims about third-party
products or a mandate to import their feature inventories. This review concerns product behavior, not certification
of tax, banking or statutory reporting compliance.

### Ownership and boundaries

| Surface | Owner and review boundary |
| --- | --- |
| Accounting navigation, lists, wizards, settings, shell context and organization picker | BOSS `screen/Accounting/`, its templates and `service/ironstone/accounting/` |
| Financial records, approvals, settlement, posting, locks, rates, tax, budgets and asset books | Mantle services/entities; business-rule corrections and their tests belong there and must work without BOSS |
| Customer360, orders, shipments, returns, product financial context, equipment, matching and valuation | Shared BOSS screens with server-derived app context; exercise Accounting's mounts and the appropriate second consumer of a shared correction |
| Supplier360 and invoice/bill/payment details | Accounting's own Supplier360 and document routes, with reused templates and invoice tabs; do not substitute the Products/Purchasing Supplier360 |
| Production cost close | Shared ProductionCostClose and Mantle production costing; Accounting owns financial review/posting and Manufacturing owns operational facts and review requests |
| Chatter, RecordFiles, Notifications and approvals | Existing Commons/Shared widgets and services; inspect financial record identity, audience, evidence and return path, not another Commons review |
| Public invoice pay and supplier upload | PASS Billing/Supplier over Mantle; bounded finance handoff only, with a separately configured local PASS runtime when exercised |
| Lists, dialogs, wizards, charts, print/PDF, file handling and terminal rendering | Framework renderers, webroot/client and output services; fix shared causes there and verify with Accounting content |
| Insights reports/attention and Admin reference settings | Existing links and authority contracts; bounded entry/return checks |

Preserve routes, record keys, operation identity, dates, saved finds/columns, preferences and entity/service
contracts. Record unavoidable compatibility changes before implementing them. Keep restricted amounts, bank details,
taxpayer information and foreign-organization identities out of server responses, pickers, search, files and exported
bytes. A hidden button or an app context is not an authorization boundary.

Do not build absent features to complete this review. Advanced period runs, leases, revenue recognition,
intercompany, electronic invoicing, chargeback intake and other still-deferred work remain separate. Conversely,
ProductionCostClose and CostingPolicies are built and belong in this review despite their older deferral entries.
Full reviews of neighboring apps, public sites and payment providers are outside scope. All financial mutations in
later review work use disposable local records; real payments, bank submissions, customer mail and tax filing are
not review fixtures.

## 2. Review method and refinement criteria

The generic method is the [UI review guide](../../../../../docs/dev/UI-Review.md):
[preparing an isolated review](../../../../../docs/dev/UI-Review.md#prepare-an-isolated-review), activities and coverage,
[judging the result](../../../../../docs/dev/UI-Review.md#judge-the-result) (viewports, themes, keyboard, contrast,
terminal) and [recording, fixing and verifying](../../../../../docs/dev/UI-Review.md#record-fix-and-verify). Products
shows it executed: its [§2](ui-review-products.md#2-review-method-and-refinement-criteria) and
[execution setup dispositions](ui-review-products.md#execution-setup-dispositions). This section keeps only what is
specific to Accounting.

### Environment

- **Bootstrap.** Link Mantle and BOSS individually into an isolated runtime with copied configuration, a fresh
  disposable database, captured mail and local outputs; the guide's framework-only bootstrap leaves `component/` empty
  and is not enough. A linked component is source: uploads, issued files and exports land in the disposable runtime.
  Fixture specs beyond demo data run as focused acceptance runs (§5). PASS joins only for ACC-30, as a separately
  configured runtime serving the portal site. Use the release binary and embedded Postgres; the coordinator starts
  further instances as needed (§7).
- **Prerequisites seen in executed reviews.** Embedded Postgres may need host (unsandboxed) shared memory, with every
  runner at one process-visibility level; delegated agents may have no browser tools; an isolated runtime may need
  webroot assets materialized before the terminal works; an automated tool-approval review may block a posting or
  send. Choose a free non-default port (another local Moqui may hold the defaults and is not stopped; Products used
  57820) and a hostname per browser identity. Record which apply in the first batch, and restore temporary grants,
  preferences and settings and stop review listeners at the end.
- **Shared runtime and concurrency.** The coordinating agent decides whether the five companion reviews share one
  runtime and manages the concurrent review agents (user decision, 2026-11-11). In a shared one it owns the lifecycle,
  no demo record is consumed by two reviews, and Retail-wide changes (PUR-27's purchasing policy rows, CS-21/22's
  `returnSettlementRequired`, MFG-06's production policy, MFG-17's forward repost flags) stay in their own batch and
  are restored, or isolated in another organization, before another review's dependent activity. In separate runtimes
  a review prepares the other side of a handoff as setup without reviewing it. Orderings: "Records, dates and
  consumption" below.
- **Fixtures.** Accounting's fixtures are its demo data: `BossAccountingUsersDemoData`, `BossZAccountingDemoData`
  (`load#AccountingDemo`), `BossZSetupDemoData` (`load#SetupDemo`) and `BossZPortalDemoData` (`load#PortalDemo`).
  `AccountingClientFixtures`, the client suites' server spec, only checks that theme assets are local. Other
  components' fixture specs (Manufacturing's, for a cost-close run) are acceptance fixtures and need the user's
  selection.
- **Mail and outputs.** Serve with `mail_capture_sends=true`, as both client suites do; the demo `EmailServer`
  `BOSS_ACCOUNTING_DEMO` is a local sink (127.0.0.1:9) and `BOSS_ACCOUNTING_MAIL` (`accounts@finance.example`) gives
  send rights to `finance.ar`, `finance.admin` and john.doe only. Issued invoices, statements, receipts/checks and
  retained revisions need Chromium for PDF (`moqui_chromium_path`); without it those branches are blocked, not failed.
  Gateway outcomes come from the test gateway (`BOSS_ACCT_GW_TEST`; PASS uses `ZIZI_PORTAL_HOSTED`); bank and return
  files are synthetic; the demo rate provider `get#EcbRates` is given a local copy of the ECB file (`sourceText`),
  since without one it fetches the bank's daily file.
- **Finance extent.** Postings, payment and payment-run execution, gateway capture/refund, sends, tax export, period
  close/reopen, lock changes and activation all mutate the disposable books. They are allowed, as are temporary
  setting, grant and policy changes (user decision, 2026-11-11); the coordinator sequences them and restores settings.

### Organizations and identities

- **`BOSS_ACCT_ORG`** (Accounting Demo Company, pseudo ID `ACCTDEMO`) is outside the Ziziwork rollup and alone adopts
  the posting guard, required dimensions and forward issuance adjustment. Every `finance.*` user is a `PrtAgent` of it
  only, so a narrow user's organization picker has one entry; a multi-organization picker needs `finance.admin`
  (filtered by `MANTLE_ACTIVE_ORG`, any internal organization) or a prepared second agent relationship.
- **`BOSS_ACCT_NEWCO`** (Accounting Demo Startup) is left in setup by `load#SetupDemo` (a setup run with a trial
  balance and one open invoice, so Home offers "Finish setting up accounting") and has no agent users;
  `finance.admin` selects it. Activating it consumes it, which is why AccountingSetupWalk creates its own organization;
  a repeatable ACC-02 does the same.
- **`ORG_ZIZI_SERVICES`** is AccountingSpecLib's foreign organization. `BOSS_P21_OTHER` exists only after the
  acceptance AccountingAccessWalk has run; do not rely on it.
- **`ORG_ZIZI_RETAIL`** owns Manufacturing's runs, the PASS portal demo and most neighbouring fixtures, and no
  `finance.*` user can act there: ACC-24 and ACC-30 use the prepared Retail finance identities below.

| Fixture | Group: permissions; sections (`BossAccountingSetupData`) | Review use and limits |
| --- | --- | --- |
| `finance.ar` | AR: `RECEIVABLE_EDIT`/`_VIEW`, `PAYMENT_VIEW`, `CUSTOMER_CREDIT_VIEW`; Receivables, Payments, NewInvoice | Invoices, statements, collections, dunning, recurring, receivable settlement; no Approvals, Banking, Period close, Tax or Settings |
| `finance.ap` | AP: `PAYABLE_EDIT`/`_VIEW`/`_IMPORT`, `PAYMENT_VIEW`, `INVOICE_HOLD`, `INVOICE_MATCH`, `SUPPLIER_TERMS_EDIT`; Payables, Payments, Approvals, NewBill | Bills, holds, matching, terms, run proposals; no hold release, bill approval or run approval |
| `finance.match` | MATCH: `INVOICE_MATCH`, `PAYABLE_VIEW`; Payables | Match-only counterpart without AP edit or approval |
| `finance.treasury` | TREASURY: `PAYMENT_EDIT`/`_VIEW`, `BANK_RECONCILE`, `PAYABLE_VIEW`, `PAYMENT_HOLD_RELEASE`; Payments, Banking, Payables, ReceivablesWorkbench, NewPayment | Payments, gateway, refunds, transfers, banking, stored value, run execution |
| `finance.paymentar` | AR + TREASURY | Composed receipt workflow; never a narrow refusal counterpart |
| `finance.gl` | GL: `ACCOUNTING_VIEW`, `ACCOUNTING_GL_POST`, `PRODUCT_COST_VIEW`, `BUDGET_EDIT`; GL, Period close, Fixed assets, Inventory, Budgets, Reports, NewEntry, document reads | Journals, asset book events and depreciation runs, valuation, budget drafts, cost-close preview; cannot post or return a cost close |
| `finance.tax` | TAX: `TAX_STATEMENT_EDIT`; Tax | Tax statements and exports; which authority/rate writes also need ADMIN (design: tax admin is TAX + ADMIN) is to verify at execution |
| `finance.read` | READ: `ACCOUNTING_VIEW`, `PRODUCT_COST_VIEW`, `CUSTOMER_CREDIT_VIEW`; Receivables, Payables, Payments, Banking, GL, Fixed assets, Inventory, Budgets, Reports | Read-only counterpart with no other launcher; no Period close, Tax, Settings, Approvals or quick create |
| `finance.approve` | APPROVE: `ACCOUNTING_VIEW`, `INVOICE_APPROVE`, `INVOICE_HOLD_RELEASE`, `PAYMENT_RUN_APPROVE`, `FISCAL_CLOSE`, `CREDIT_HOLD_RELEASE`, `BUDGET_APPROVE`, `BUDGET_OVERRIDE`, `RETURN_CREDIT_APPROVE`, `PRODUCTION_COST_POST`; Approvals, Period close, documents, GL, Fixed assets, Inventory, Budgets, Reports | Independent approvals, close, credit release, cost-close post/return; no `FISCAL_REOPEN`, GL post or edit permission |
| `finance.admin` | ADMIN: `ACCOUNTING_ADMIN`, `FISCAL_REOPEN` and every permission above except `PAYMENT_HOLD_RELEASE`; always-access to every section | Setup, Settings and policies, locks, reopen, repair, self-approval; holds both `INVOICE_HOLD` and `INVOICE_HOLD_RELEASE`, so it is the same-user release refusal; never an isolation negative |

Neighbouring fixtures (`BossUsersDemoData`; none has the Accounting launcher): `manufacturing.finance` (Retail;
Manufacturing reader plus READ), `manufacturing.costclose` (Retail; Manufacturing reader plus APPROVE, posts from
Manufacturing's Cost close tab), `purchasing.buymatch` (Retail; buyer plus MATCH), `customerservice.returnsar`
(Retail; return authorizer plus AR), `insights.finance` (Retail; Insights plus READ) and `catalog.cost.gl` (Services;
Products plus GL). `catalog.reader` is AccountingAccess's no-finance outsider. The Projects billing editor
(`BOSS_PROJECT_MANAGER`: `RECEIVABLE_EDIT` without the view permissions) has only john.doe as a member, so prepare
one. The PASS contacts `joedist.payer` (Billing, JoeDist) and `ziddleman.billing` (Supplier, ZiddlemanInc) are
public accounts with no user group. john.doe is ADMIN and drives AccountingScreens and AccountingServerStatic, so
those results are never least-privilege evidence.

Self-approval is an audited `PartyAcctgPreference` setting on AccountingPreferences, off by default and set only by
finance administration; a decision by the drafter is stamped self-approved. Verify loaded memberships, permissions
and organizations before interpreting a refusal. Pair each refusal with an otherwise-valid success by a holder and
name the grant the refused fixture lacks; a validation error is not permission evidence.

### Prepared Retail finance identities

Every review that needs finance authority over a Retail record prepares these Retail `PrtAgent`s (each also in
`BOSS_USERS`) rather than borrowing a `finance.*` user, and records them in its first batch. The usernames are
proposals for the five reviews to share; the compositions follow the existing specs.

| Identity | Groups | Model | Used in |
| --- | --- | --- | --- |
| `retail.finance.approve` | `BOSS_ACCOUNTING`, `BOSS_ACCOUNTING_APPROVE` | AccountingProductionCostClose's `boss_pcc_approve` | ACC-24 post and return from the Accounting queue; PUR-22's hold release and bill approval |
| `retail.finance.gl` | `BOSS_ACCOUNTING`, `BOSS_ACCOUNTING_GL` | `boss_pcc_gl` | ACC-24 preview without post; a landed charge on a Retail receipt if PUR-22's link is followed |
| `retail.finance.read` / `retail.finance.admin` | `BOSS_ACCOUNTING` with `_READ` / `_ADMIN` | `boss_pcc_read` / `boss_pcc_admin` | ACC-24 reader and CostingPolicies (`store#AllocationPolicy` is ADMIN-only) |
| `retail.finance.ap` | `BOSS_ACCOUNTING`, `BOSS_ACCOUNTING_AP` | the Retail AP user PurchasingBillsWalk and PurchasingReturnsWalk create (permission group only) | PUR-22 intake and draft bill, PUR-24 supplier credit, ACC-30 BillUpload intake |
| `retail.finance.ar` | `BOSS_ACCOUNTING`, `BOSS_ACCOUNTING_AR` | — | ACC-30 pay link (`send#Invoice`, `create#AccessCapability`); the demo mailbox `BOSS_ACCOUNTING_MAIL` is `BOSS_ACCT_ORG`'s and lists only its own senders, so which account mails a Retail invoice is to verify |
| `retail.manufacturing.gl` | `BOSS_MANUFACTURING`, `BOSS_MANUFACTURING_READ`, `BOSS_ACCOUNTING_GL` | `manufacturing.costclose` with GL in place of APPROVE | MFG-28 preview-only on the Cost close tab |
| `customerservice.returnsar` + `BOSS_ACCOUNTING_TREASURY` / `BOSS_ACCOUNTING_APPROVE` | temporary grants on the seeded user, restored | CustomerServiceReturnsWalk's temporary-grant pattern | CS-22 refund and receiptless credit |

### Records, dates and consumption

`load#AccountingDemo` creates the records once, by fixed ID, for `BOSS_ACCT_ORG`:

- Documents and journals: drafts `BOSS_ACCT_INVOICE`, `BOSS_ACCT_BILL` and `BOSS_ACCT_PAYMENT`; journals
  `BOSS_ACCT_ENTRY` (draft) and `BOSS_ACCT_POSTED`; finalized `BOSS_ACCT_AR_FINALIZED`; approved time
  `BOSS_ACCT_APPROVED_TIME` on project `BOSS_ACCT_PROJECT`.
- Settlement and payments: `BOSS_ACCT_STL_*` (invoices INV100, SPLIT100, INV40, ADJUST50; receipts RECEIPT60/70;
  credit CREDIT25); `BOSS_ACCT_PAY_*` (DRAFT, VALIDATED, EVIDENCE_DRAFT, DELIVERED, APPLIED, CHECK) and
  `BOSS_ACCT_REFUND_*`; bank receipts `BOSS_ACCT_BANK_RCPT1`–`3`; bank rule `BOSS_ACCT_RULE_CUSTOMER`.
- Payables: `BOSS_ACCT_BILL_REVIEW`, `_HELD`, `_DUE`, `_DISCOUNT` (term `Net30Disc2Pct10`), `_DISPUTE`, `_RUN` and
  `_WORKBENCH`; order `BOSS_ACCT_PO_MATCH` with `BOSS_ACCT_BILL_MATCH` and `_PRICE`; freight `BOSS_ACCT_BILL_FREIGHT`;
  budget `BOSS_ACCT_BUDGET` with order `BOSS_ACCT_PO_BUDGET` and overrun bill `BOSS_ACCT_BILL_OVER`.
- Close, assets, tax, collections, returns: `BOSS_ACCT_CLOSE_PERIOD` ("Last month") with its two blockers, draft
  `BOSS_ACCT_CLOSE_INVOICE` and an unreconciled line on `BOSS_ACCT_CLOSE_BANK`; assets `BOSS_ACCT_FA_FORKLIFT` (in
  service), `_VAN` (to capitalize) and `_PRINTER` (no cost); authority `BOSS_ACCT_UT_TAX`, taxed invoice
  `BOSS_ACCT_TAXED`, 1099 vendors `BOSS_ACCT_1099_VENDOR` and `_NOTIN`; `BOSS_ACCT_AR_OVERDUE`, `_DISPUTED`, held
  order `BOSS_ACCT_SO_HELD`, recurring template `BOSS_ACCT_RENT_TEMPLATE`; return `BOSS_ACCT_RETURN` on
  `BOSS_ACCT_SO_RETURN`.

Generated IDs come from AccountingSpecLib's lookups (`receivedShipmentId`, `demoRunId`, `statementPreview`), not
guessed constants. Valuation, production and stale-preview close blockers, a second currency's documents and a
multi-organization user are not in the demo; prepare them.

Demo dates are relative to the load: documents carry the load day, the overdue receivables are 20 and 10 days past
due, the discount bill's window starts at load, and "Last month" is the month before the load month in the loading
user's zone. A runtime kept across days or a month end drifts, so record the load and execution dates. Use the real
clock in the machine's current zone (America/Chicago on current machines; it will vary), with no DST or second-zone
checks (user decision, 2026-11-11). Recreate date-sensitive rows relative to execution: current, future and expired
policies and rates and an expiring lock exception. Closing and month-based work uses back-dated transactions in
periods that ended before now (`BOSS_ACCT_CLOSE_PERIOD` is last month), never a future date or a moved clock; posting
and application days follow `EntityLib.bookDay` (impl-accounting F121).
Foreign-currency posting is built, but the settlement workbenches, payment drafts, payment runs and internal
transfers stay base-currency only (impl-accounting §7, P20), so their refusals are expected outcomes.

The demo records are one-shot; keep a baseline and give each activity its own record where two need the same state:

- ACC-11's release of `BOSS_ACCT_BILL_HELD` removes the held bill ACC-13 and ACC-14 exclude and the payable-hold check
  ACC-21 reads; prepare another held bill.
- ACC-13 uses `BOSS_ACCT_BILL_WORKBENCH`; ACC-14 uses `_DUE`, `_DISCOUNT` and `_RUN`. Do not settle a run's bills in
  the workbench.
- ACC-08's batch actions and ACC-16's reconciliation leave `BOSS_ACCT_CLOSE_INVOICE` and the `BOSS_ACCT_CLOSE_BANK`
  line for ACC-21, which resolves them as its blockers.
- ACC-21's close of `BOSS_ACCT_CLOSE_PERIOD` refuses later postings dated last month (an ACC-04 reversal, an ACC-22
  run month), hence the wave order below.
- ACC-02's activation, ACC-07's send of `BOSS_ACCT_INVOICE`, ACC-22's capitalization of `BOSS_ACCT_FA_VAN` and
  ACC-28's settlement of `BOSS_ACCT_RETURN` each happen once per database.
- Across reviews: a cost-close post closes its run, so ACC-24 and MFG-28 each close their own completed Retail run
  (in a shared runtime ACC-24's is the run whose review MFG-27 requested); ACC-30 and PUR-28 use the same
  `ziddleman.billing` contact and "Portal demo shelving restock" order, so each issues fresh links.

### Accounting criteria

Apply the guide's criteria and Products' visual and interaction list. In Accounting also check:

- The guide's viewports and keyboard on Material `/qapps` with measured geometry, actual TUI operations and a brief
  Standard `/apps` functional/output/fallback check, with JSON renders as supporting evidence only.
- Organization, counterparty, document identity, date basis, amount/currency, debit/credit meaning and payable
  versus receivable direction stay visible, including on the invoice tabs BillDetail reuses and on BillPrint. Draft,
  approval, posting, payment, clearing and reconciliation states are distinct without relying on color.
- Reviews (both SettlementReviews, PaymentDetail/Review, TransferReview, InvoiceBatch, Setup/Activate, close,
  depreciation, landed cost, cost close) name the operation, organization, source version, date, selected documents
  and totals; a changed input, grant, mapping, rate or lock makes them stale, and reload or retry keeps the
  operation key.
- After a financial action inspect balanced postings, applications, remaining amounts, evidence and linked reversals.
  Bulk work (invoice batches, runs, legacy matches, depreciation, statement import, reminders) names each independent
  failure and keeps the successes usable; a single posting, application set, paired transfer or document-and-ledger
  write stays atomic.
- No data, no matches, no permission, missing basis and failed loading are distinct: Home names a failed figure
  Unavailable, its cards agree with their destination lists, and no total silently adds currencies.
- An issued invoice, statement, receipt/check, payment-run file, tax export, list export and record print are
  different output contracts: inspect bytes, page breaks, rounding, masked bank and tax identifiers and the scope the
  UI actually offers. A download is not a bank submission or filing; "sent" is checked against the captured message.
- Shell: the four quick creates, Today, the Finance records palette, `g j`/`g a` and the three notification topics,
  in context. Accounting declares no Assist prompt; generic page context is not a finance integration.

### Waves

| Wave | Activities | Focus |
| --- | --- | --- |
| 1. Establish the finance workday | ACC-01–06 | Scope, setup, chart/periods, journal, defaults and currency basis |
| 2. Invoice and collect receipts | ACC-07–10 | Invoice lifecycle, source billing/outputs, settlement and payments |
| 3. Review and pay suppliers | ACC-11–14 | Bills/holds, matching, payable settlement and payment runs |
| 4. Reconcile cash | ACC-15–17 | Statement intake, rules, reconciliation, deposits, transfers and stored value |
| 5. Follow up receivables | ACC-18–20 | Collections/credit, dunning and recurring drafts |
| 6. Value the subledgers | ACC-22–26 | Asset books, inventory/landed cost, production cost close, tax and budgets |
| 7. Close and explain the books | ACC-21, then ACC-27 | Close blockers resolved through earlier activities, locks, reopen; reports and drill |
| 8. Handoffs and remaining variants | ACC-28–32 | Returns, evidence, PASS, permissions, other mounts and modes |

Establish positive/negative pairs from Wave 1 and inspect evidence, files and boundaries throughout. Continuations:
defaults/rates → invoice and journal posting; invoices/bills → settlement → payments → bank reconciliation;
matches/holds → payment eligibility; collections/recurrence → invoices; asset/stock/production postings → close
checks and reports; budgets → bill and source commitments; return credits → settlement/refund; public payment and
upload → the internal record. ACC-21 resolves the demo's draft-invoice and bank-line blockers through their Fix
links, and closes only after the prepared valuation and production blockers' resolutions have been observed in ACC-23
and ACC-24. Record incomplete branches in the originating ledger row.

In the review pass (below), start with ACC-01 and a disposable ACC-04/07 path to establish browser/TUI and
record-identity baselines; the coordinator delegates activities only after checking tools and identity isolation,
and serializes shared settings, locks, fixture mutations and runtime lifecycle.

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

Routes are relative to `/qapps/`. **B** means this component's `screen/`. Append a local name to its directory for
the route and `.xml` for its source. There are **134 local XML definitions**: `Accounting.xml` and 133 below
`Accounting/`. There is **no local Accounting QVue or `.tui.json` file**, but 50 local XML files carry `render-mode`
sections: 49 with authored qvt/tui twins (76 pairs) and 16 with authored `html-print` text. Four mounted Shared
sources (InvoiceMatch, EquipmentDetail, ProductionCostClose, Product360) and four templates (AccountingDocuments,
AccountingParts, AccountingRecords, AccountingInventory) add their own tui text; Chatter and RecordFiles are QVue with
terminal helpers. Each needs mode-specific inspection. Physical child sources do not establish access.

### Local routes

| Route prefix / source directory | XML definitions | Activities |
| --- | --- | --- |
| root | `Accounting` | ACC-01, 31–32 |
| `Accounting/` | `Home` | ACC-01, 02, 18, 24 |
| `Accounting/` | `Receivables`, `Payables`, `Payments`, `Banking`, `GeneralLedger`, `PeriodClose`, `FixedAssets`, `Inventory`, `Tax`, `Budgets`, `Reports`, `Settings`, `Records`, `Approvals`, `QuickCreate` | Containers/defaults and their activities below |
| `Accounting/QuickCreate/` | `NewInvoice`, `NewBill`, `NewPayment`, `NewEntry` | ACC-01, 04, 07, 10–11 |
| `Accounting/Receivables/` | `Invoices`, `InvoiceDetail`, `InvoicePrint` | ACC-07, 27, 29 |
| `Accounting/Receivables/InvoiceDetail/` | `Overview`, `Items`, `Orders`, `Shipments`, `Payments`, `GeneralLedger`, `Budget`, `Files`, `Conversation`, `History` | ACC-07–09, 26, 28–29 |
| `Accounting/Receivables/` | `BillingQueue`, `InvoiceBatch`, `Statements`, `StatementPrint` | ACC-08 |
| `Accounting/Receivables/` | `ReceivablesWorkbench`, `SettlementReview` | ACC-09 |
| `Accounting/Receivables/` | `Collections`, `Dunning`, `RecurringInvoices` | ACC-18–20 |
| `Accounting/Payables/` | `Bills`, `BillDetail`, `BillPrint`, `ExpensePosting` | ACC-11, 29 |
| `Accounting/Payables/BillDetail/` | `Overview`, `Holds` | ACC-11–12; other tabs are mounts below |
| `Accounting/Payables/` | `LegacyMatches`, `LandedCosts` | ACC-12, 23 |
| `Accounting/Payables/` | `PayablesWorkbench`, `SettlementReview`, `PaymentRuns`, `PaymentRunDetail` | ACC-13–14 |
| `Accounting/Payables/` | `Supplier360` | ACC-11, 13, 29 |
| `Accounting/Payables/Supplier360/` | `Bills`, `Terms`, `FinanceDetails` | ACC-05, 11, 13, 29 |
| `Accounting/Payments/` | `Payments`, `PaymentDetail`, `GatewayTransactions`, `PaymentPrint`, `TransferReview` | ACC-10, 14, 17 |
| `Accounting/Payments/PaymentDetail/` | `Overview`, `Applications`, `Gateway`, `Refunds`, `GeneralLedger`, `Files`, `History`, `Review` | ACC-09–10, 13, 17, 29 |
| `Accounting/Banking/` | `BankAccounts`, `BankAccountDetail`, `StatementImport`, `BankRules`, `UnmatchedTransactions` | ACC-15–16 |
| `Accounting/Banking/` | `Reconciliations`, `ReconciliationDetail`, `FinancialAccounts`, `FinancialAccountDetail` | ACC-16–17 |
| `Accounting/GeneralLedger/` | `ChartOfAccounts`, `AccountDetail`, `JournalEntries`, `JournalEntryDetail`, `TransactionEntries`, `JournalBatches`, `JournalTemplates` | ACC-03–04, 27, 29 |
| `Accounting/PeriodClose/` | `Periods`, `PeriodCloseDetail`, `PeriodLocks`, `PeriodRuns` | ACC-03, 21–22, 24 |
| `Accounting/FixedAssets/` | `FixedAssets`, `AssetClasses`, `DepreciationRunDetail` | ACC-22 |
| `Accounting/Tax/` | `TaxAuthorities`, `TaxRates`, `TaxStatements`, `TaxStatementDetail` | ACC-25 |
| `Accounting/Budgets/` | `Budgets`, `BudgetDetail`, `BudgetControls` | ACC-26 |
| `Accounting/Reports/` | `Reports`, `TrialBalance`, `GeneralLedger`, `PartnerLedger`, `BalanceSheet`, `IncomeStatement`, `CashFlow`, `RetainedEarnings`, `FinancialRatios`, `AccountBalance`, `PostedSummary`, `Aging`, `InvoiceReconciliation`, `BudgetVariance`, `SalesAnalysis`, `StockTransactions` | ACC-27 owns the catalog, the ten ledger/statement reports and SalesAnalysis; Aging ACC-18, InvoiceReconciliation ACC-21, StockTransactions ACC-23, BudgetVariance ACC-26; TrialBalance also ACC-04, 21 |
| `Accounting/Settings/` | `Settings`, `AccountingPreferences`, `PostingDefaults`, `PaymentTerms`, `PaymentMethods`, `DocumentSettings` | ACC-05 and their consumers |
| `Accounting/Settings/` | `Currencies`, `CollectionPolicies`, `MatchPolicies`, `CostingPolicies`, `Setup` | ACC-02, 06, 12, 18–19, 24 |
| `Accounting/Settings/Setup/` | `Basis`, `OpeningBalances`, `OpenItems`, `Readiness`, `Activate` | ACC-02 |

### Defaults and shared mounts

| Container | Default child | Activities |
| --- | --- | --- |
| `Accounting` | Home | ACC-01 |
| Receivables / Payables / Payments / Banking | Invoices / Bills / Payments / BankAccounts | ACC-07, 10–11, 15 |
| GeneralLedger / PeriodClose / FixedAssets / Inventory | ChartOfAccounts / Periods / FixedAssets / InventoryValuation | ACC-03–04, 21–24 |
| Tax / Budgets / Reports / Settings | TaxStatements / Budgets / Reports / Settings | ACC-02, 05–06, 25–27 |
| Records / Approvals | OrderDetail / Notifications | ACC-11, 14, 18, 26, 28, 31 |
| QuickCreate | none (each quick create opens its own screen) | ACC-01 |
| InvoiceDetail / BillDetail / PaymentDetail | Overview | ACC-07, 10–11 |
| Payables/Supplier360 / Receivables/Customer360 | Bills / Contact | ACC-11, 18, 28–29 |
| Settings/Setup | Basis | ACC-02 |

The following routes mount existing sources. Accounting's document tabs and finance boxes are not the same tab
set as Products, Purchasing or Manufacturing even where the parent XML is shared.

| Route under `Accounting/` | Source under B | Activities / context |
| --- | --- | --- |
| `Chatter`, `Chatter/ChatterTui` | `Shared/Chatter.xml`, its terminal helper | ACC-29, 31–32 |
| `RecordFiles`, `RecordFiles/RecordFilesTui` | `Shared/RecordFiles.xml`, its terminal helper | ACC-29, 31–32 |
| `Approvals/Notifications` | `Commons/Notifications.xml` with topics BillApproval, BillHoldRelease, PaymentRunApproval, BudgetOverride and CreditHoldRelease | ACC-11, 14, 18, 26, 31; the linked source record makes the decision; only AP, APPROVE and ADMIN open it |
| `Receivables/Customer360` | `Shared/Customer360.xml` and admitted children | ACC-07–09, 18, 28–29 |
| `Payables/BillDetail/Match` | `Shared/InvoiceMatch.xml` | ACC-12 |
| `Payables/BillDetail/{Items,Orders,Shipments,Payments,GeneralLedger,Budget,Files,History}` | Matching `Accounting/Receivables/InvoiceDetail/*.xml` | ACC-11–13, 26, 28–29; Shipments labelled Receipts; local Overview/Holds retained; Conversation is not mounted |
| `FixedAssets/EquipmentDetail` | `Shared/EquipmentDetail.xml` | ACC-22; Accounting asset-book presentation |
| `Inventory/InventoryValuation` | `Shared/InventoryValuation.xml`, `template/AccountingInventory.xml` | ACC-23 |
| `Inventory/ProductionCostClose` | `Shared/ProductionCostClose.xml` | ACC-24; also mounted as `Manufacturing/WorkOrders/WorkOrderDetail/ProductionCostClose` (tab "Cost close") |
| `Records/OrderDetail`, `Records/ShipmentDetail`, `Records/ReturnDetail` | Matching `Shared/*.xml` with `template/AccountingRecords.xml` (Invoice from order, Upload supplier bill, Supplier bill link, Bill accepted receipts, Settle) and AccountingCollections (credit hold) | ACC-08, 11–12, 18, 28, 30 |
| `Records/Product360` | `Shared/Product360.xml`, `template/AccountingInventory.xml` | ACC-23, 28; financial summary/mappings, not the catalog tabs |

Account for inherited children explicitly. These are ACC-31 context/access probes where excluded, not additional
Accounting jobs to implement:

| Shared parent / descendants | Accounting presentation or boundary |
| --- | --- |
| Customer360: `Contact`, `Orders`, `Money`, `Credit`, `Agreements`, `Activities`, `FinanceDetails`, `Files` | Accounting's financial/customer tabs; ACC-07–09, 18, 28–29 |
| Customer360: `ServiceOverview`, `ServiceCases`, `ServiceOrders`, `ServiceBilling`, `ServiceActivities`, `ServiceStatistics`, `ServiceDeliveredItems`, `ServiceReturns` | Customer Service context; test direct-request omission/refusal and a permitted owning-app counterpart |
| Product360 physical children: `Summary`, `Features`, `Categories`, `Identifiers`, `Dimensions`, `Documents`, `Equipment`, `Associations`, `Parties`, `Connections`, `History`, `Replenishment`, `PurchaseHistory`, `PaidAccess`, `KitComponents` | Accounting uses its financial boxes, not these catalog/operational tabs; a forged appRoot or direct child URL must not acquire authority |
| Product360 mounted children: `Packaging`, `Prices`, `Suppliers`, `Costs`, `Stock`, `BOM` | Shared Packaging/Prices/SupplierPrices/StandardCosts/InventoryAvailability/BillOfMaterialsDetail; excluded-context checks, not catalog maintenance |
| Product360 nested children | Documents/Index → Shared Documents; Stock's Summary/Projection/Policy/Locations/Movements/Reservations; BOM's Overview/BillOfMaterialsExplosion/BillOfMaterialsCompare/WhereUsed/RoutingDetail. Include helper/choice resolution in the excluded-context inspection |
| Customer360/InsightsRecord and Product360/InsightsRecord | Hidden Shared InsightsRecord mount; inspect authorized linked insight and return without assuming an Accounting dashboard exists |
| Chatter/ChatterTui and RecordFiles/RecordFilesTui | Shared terminal helpers; inspect truthful supported actions and delegation in ACC-29/32 |

Retest shared corrections through a representative second consumer: Purchasing/Bills for InvoiceMatch, Manufacturing
WorkOrderDetail for cost close and WorkCenters for EquipmentDetail, Warehouse for shipment/return/valuation
(`Warehouse/Reports/InventoryValuation`), Customer Service or Commerce for Customer360, Products for Product360, or
another authorized Commons record for files/Chatter. Choose the consumer for the behavior actually changed. The
shared `Shared/Supplier360` (Products, Purchasing, Warehouse, Manufacturing, Insights) is not mounted in Accounting.

Hidden review/output routes are first-class supporting surfaces: InvoiceBatch; both SettlementReview routes;
PaymentDetail/Review; TransferReview; InvoicePrint, BillPrint, StatementPrint and PaymentPrint; quick-create screens;
setup steps; shared choice transitions and upload/download endpoints. Inspect their access and context directly as
well as through the normal entry action. A review URL must not bypass the preview's permission or source check.

Use actual record parameters when preserving context: `recordId` on the generic invoice/bill/payment/journal detail
wrappers; `paymentMethodId` on BankAccountDetail; `statementImportId` plus `paymentMethodId` on StatementImport;
`bankReconciliationId` on ReconciliationDetail; `finAccountId` on FinancialAccountDetail; `paymentRunId` on
PaymentRunDetail; `timePeriodId` on PeriodCloseDetail; `periodRunId` on PeriodRuns/DepreciationRunDetail;
`workEffortId` on ProductionCostClose; `supplierPartyId` on Supplier360; `taxStatementId` on TaxStatementDetail;
`budgetId` (and `revisionSeqId`) on BudgetDetail; `assetId` on EquipmentDetail; `previewId` (with `draftId` on the
SettlementReviews and `previewKind` on PaymentDetail/Review) on the review routes. Carry `organizationPartyId` where
declared. Read each route's current parameters before constructing direct checks; shared record routes also accept
their native record keys.

### Custom modes, outputs and embedded surfaces

| Surface | Supporting inspection | Activities |
| --- | --- | --- |
| Shared document layouts | `AccountingDocuments.xml`, `AccountingPayments.xml`, `AccountingFinanceDetails.xml` (Customer360 and Supplier360 finance details), `AccountingCollections.xml` (Collections, Customer360 Activities/Credit, OrderDetail's credit hold); header, draft dialog, tabs, statuses, phone columns and selected-record actions | ACC-07–14, 18 |
| Organization, choices and reports | `AccountingParts.xml`, `AccountingReportParts.xml`, `AccountingReports.xml`; selection labels outside the current page, dependent choices, scope/date/dimension continuity | ACC-01–06, 27, 31 |
| Settlement review | `AccountingWorkbench.xml` and each side's SettlementReview; draft selection, fingerprint and operation identity through navigation/reload | ACC-09, 13 |
| Treasury reviews | PaymentDetail/Review and TransferReview; pending gateway outcome, confirmation, unchanged retry and applications | ACC-10, 17 |
| Wizards and long forms | Setup's five physical steps; staged imports, run details and close/depreciation reviews on their actual routes; do not invent child routes for design step names | ACC-02, 14–16, 21–22 |
| Issued documents | InvoicePrint/BillPrint, invoice batch output, StatementPrint, PaymentPrint (receipt/detail/check), captured emails and attachments | ACC-07–08, 10–11, 14 |
| Bank outputs | Run-file generation/download and return import; deposit slip; bank/stored-value screen print where offered | ACC-14, 16–17 |
| Record/report print | Authored `html-print` on Invoices, InvoiceDetail, Bills, BillDetail, ExpensePosting, PaymentRuns, PaymentRunDetail, PaymentDetail, Collections, Dunning, RecurringInvoices, BudgetDetail, TaxStatementDetail, Setup OpeningBalances/Readiness and StatementPrint; the generic print of JournalEntryDetail, PeriodCloseDetail, DepreciationRunDetail, ReconciliationDetail and FinancialAccountDetail (to verify at execution); report `html-print`, CSV/XLSX where offered | ACC-02, 04, 07, 10–11, 14, 16–22, 25–27 |
| Financial custom cells | Inline qvt/tui status, amount, comparison, findings and action sections; inspect authored twins rather than inferring parity from XML | Respective activities, ACC-32 |
| Chatter/files | Shared QVue and terminal helpers, authorized original/issued bytes, upload/read-only states and history | ACC-29 |
| Shell | Four quick creates; Finance records palette plus MantleInvoice/Payment/GlAccount/AcctgTrans types; `g j`, `g a`; Accounting Today (`HomeServices.get#TodayItems`); CreditHoldRelease, RecurringInvoiceFailed and ProductionCostReview topics | ACC-01, 04, 07, 10–11, 18, 20, 24 |
| Adjacent entry points | Insights Accounting reports and the `Accounting.DraftEntries`/`PostedEntries`/`BillsAwaitingApproval`/`BillsOnHold`/`CostClose` attention providers; Admin settings entries for Settings/Settings, Currencies, PaymentTerms and Tax/TaxAuthorities, and Admin Health's fix link to Settings/Setup | ACC-02, 05–06, 24–25, 27, 32 |

### Design-to-code reconciliation

| Design or historical item | Current review disposition |
| --- | --- |
| ProductionCostClose/CostingPolicies listed under impl-accounting §7 "Later" | Built by impl-manufacturing P15; include Home's "Production runs awaiting cost close" source, preview/post/return, later adjustment, effective policy and close blockers. Mantle's `ProductionCostingData` registers the `PccProductionWip` and `PccProductionCostClose` close checks that §7's P11 entry still calls later |
| Shared contexts described as Accounting-only or future | Neighboring apps now consume many of these screens. Inspect the current context and a relevant second consumer; do not restore old assumptions |
| Supplier360 as one shared screen with per-app tabs (impl-accounting §7, F135) | Not built: Accounting has its own `Payables/Supplier360` (Bills, Terms, FinanceDetails). Shared Supplier360's buying/catalog tabs and its contact invitation are Products/Purchasing features, not Accounting's |
| “All screens XML” | True for local files; shared Chatter/RecordFiles use QVue and terminal helpers. Inline render variants and shared inherited children remain in scope |
| Foreign-currency posting described as P20/future in older notes | Posting and rate proposals are built. Do not infer foreign-currency support for settlement, payment runs, transfers, landed cost, exposure or every report |
| AdvancedPeriodRun, Leases, RevenueRecognition, Intercompany, ElectronicInvoices | Unmounted future work; keep out of completion criteria and menus |
| Chargeback action / real hosted gateway / bank feeds / filing | Do not manufacture a working action from a design paragraph. Review built gateway/refund/return contracts and synthetic outcomes; external integrations and country packs are separate |
| Posted depreciation-run reversal, landed-cost/revaluation reversal, finished-statement reopen, bank-fee creation from a line and statement formats beyond BAI2/OFX/CSV (impl-accounting §7) | Historical deferrals require a current service/control check before a variant is scheduled; absence is a capability limit, not permission to implement it |
| Older reports, print and setup descriptions | Check actual output controls, conversion basis, known limitations and wizard confirmation. Do not treat “printed record” as a new period snapshot or regulatory form |
| AccountingImplementation's spec list (it omits AccountingProductionCostClose, AccountingReporting, AccountingFixedAssetsWalk and AccountingReportsWalk), its “No route fixtures” (AccountingSpecLib's `routeFixtures` feeds the acceptance sweep) and its nine demo users (it omits `finance.paymentar`) | Use current suite registrations and fixtures in §5; historical pass totals do not establish live coverage |

## 4. End-to-end activities

The §6 ledger holds status and evidence. Use visible controls and inspect intermediate states, confirmations,
persisted results and a second identity where relevant; a render, HTTP 200 or service-only mutation does not complete
an activity. Browser means Material light/dark; TUI means actual supported terminal operations; Standard means the
brief functional/output/fallback check. Record unattempted modes and recovery branches in §6. Actors are §2's
fixtures.

### ACC-01 — Start a finance workday in the right organization

- **Actor/start:** `finance.read` and each narrow `finance.*` user (one organization each); `finance.admin` or a
  prepared second agent relationship for the multi-organization picker; populated and empty organizations.
- **Objective/steps:** open Accounting → select organization → follow permitted Home cards and Your work →
  filtered list → record → Back; inspect the setup callout and findings, Approvals for its holders, Today, the
  finance palette and `g j`/`g a`;
  open/cancel/reopen each permitted quick create. Follow a main find through saved filters, paging, columns,
  supported views, reset and actual offered exports.
- **Expected:** current organization and basis are clear; cards and destination rows agree; read-only navigation
  stays useful; default routes and menu order are predictable; New never inherits a previously viewed record ID.
- **Recovery:** no organization, no matches, inaccessible recent record, missing period, one failed aggregate,
  multi-currency cash exclusions and changed active organization. Unavailable is not zero and unrelated cards load.
- **Screens/modes:** Home, section defaults, QuickCreate, shell and representative finds; browser/TUI/Standard,
  narrow/keyboard samples. Findings about individual records continue in their owning activities.

### ACC-02 — Establish and activate a new set of books

- **Actor/start:** `finance.admin` in a disposable unactivated organization (activating `BOSS_ACCT_NEWCO` consumes
  it; its in-setup run is Home's "Finish setting up" sample); `finance.read` as the Settings refusal counterpart.
- **Objective/steps:** Home/Settings → Setup/Basis → choose chart, base currency, fiscal/costing basis and opening day
  → OpeningBalances add/edit/import → OpenItems validate/import → Readiness follow Fix links → return → Activate
  review → activate → inspect opening entry and activated state. Leave and resume between steps.
- **Expected:** wizard controls save the intended step; totals and receivable/payable open items tie to the opening
  accounts; the same activation retry returns the recorded outcome once; record links retain the startup scope.
- **Recovery:** unbalanced/missing mappings, mixed valid/invalid CSV, duplicate import, stale run, navigation with an
  unsaved field, canceled activation and lost permission. Posted basis changes are refused. Record the impl-accounting
  §7 P19 limits (inventory/WIP/asset opening ties, no removal of a mistaken open item before activation, no separate
  finish confirmation) without inventing setup functionality.
- **Screens/modes:** all five Setup steps, Settings, Home and opening JournalEntryDetail; browser/TUI/Standard,
  keyboard and long-form/narrow samples. File upload delegation must be explicit in terminal.

### ACC-03 — Maintain a usable chart and fiscal structure

- **Actor/start:** `finance.gl` and `finance.admin` (which chart writes need ADMIN is to verify at execution);
  `finance.read` for chart reads, whose Periods request is refused (READ has no Period close grant); global
  accounts with separate organization assignments.
- **Objective/steps:** ChartOfAccounts → AccountDetail → inspect/edit permitted metadata and organization assignment,
  effective dates and required dimensions → follow transactions; Periods → create the fiscal hierarchy → inspect
  parent/child periods and links to close. Test both new and existing global accounts.
- **Expected:** account identity, classification, assignment and balance scope are distinct; global account access
  reveals no other organization's balances; period names, dates and hierarchy support the intended posting day.
- **Recovery:** duplicate/invalid account, incompatible assignment, overlapping or invalid fiscal dates, missing
  dimensions, inactive assignment, canceled edits and another organization's identifier. Preserve submitted inputs.
- **Screens/modes:** ChartOfAccounts, AccountDetail, Periods, TransactionEntries; browser/TUI/Standard, keyboard,
  two-row dialogs and mobile name/balance columns.

### ACC-04 — Draft, review, post and correct a journal

- **Actor/start:** `finance.gl` with `BOSS_ACCT_ENTRY`, `BOSS_ACCT_POSTED`, an unbalanced draft and an
  independent failed batch member; `finance.read`.
- **Objective/steps:** quick create/list → journal header and lines → preview → confirm posting → inspect posted
  entries, source/evidence and trial balance → permitted description correction with reason → linked reversal in an
  open period. Publish/instantiate a versioned template; review/post a batch and retry its failed member.
- **Expected:** debits/credits, currency, dimensions and posting date are intelligible; confirmation binds the shown
  preview; unchanged retry produces no duplicate transaction; posted amounts remain historical, with linked
  correction/reversal. Independent batch failures name the entry and leave successful entries visible.
- **Recovery:** missing mapping, imbalance, locked date, expired/stale preview, changed template/account/permission,
  canceled post/reversal and changed reuse of an operation key. A failed reversal leaves the original intact.
- **Screens/modes:** JournalEntries, JournalEntryDetail, TransactionEntries, JournalBatches, JournalTemplates,
  QuickCreate/NewEntry and relevant report/print links; browser/TUI/Standard with actual posted/reloaded headers.

### ACC-05 — Change finance defaults and verify their consumers

- **Actor/start:** `finance.admin` (Settings is ADMIN-only), `finance.ap` for Supplier360/Terms
  (`SUPPLIER_TERMS_EDIT`) and a narrow consumer; a separate organization and captured prior settings.
- **Objective/steps:** Settings → AccountingPreferences, PostingDefaults, PaymentTerms, PaymentMethods and
  DocumentSettings → change one effective default at a time → reload → create a consuming draft/output → restore.
  Inspect mapping readiness/fix links, clone preview/conflicts where offered, term portions/discounts, numbering,
  approved layouts, masked methods, allowed gateway bindings, the invoice payment gateway that pay links use and the
  audited self-approval setting (then one self-approved decision in ACC-11 or ACC-14).
- **Expected:** labels explain operational effect; checkbox values persist; inherited versus local settings are
  clear; the consumer uses the effective value; issued numbers/documents and posted basis are unchanged. Finance
  sees permitted gateway metadata, not secrets or executable configuration.
- **Recovery:** invalid accounts/percentages, stale clone/configuration, canceled apply, inactive gateway binding,
  posted-basis change refusal and long/localized edit values. Record settings that require a future consumer sample.
- **Screens/modes:** Settings and its six overview/configuration pages, Supplier360/Terms, consumer dialogs/output;
  browser/TUI/Standard, keyboard and long-form/narrow samples. Specialized policies continue in ACC-12/18/24/26.

### ACC-06 — Review exchange rates and explain converted postings

- **Actor/start:** `finance.admin` (Currencies is under Settings), `finance.gl`/`finance.ar` for a converted
  journal/invoice, `finance.read`; base and foreign currency with dated rates.
- **Objective/steps:** Currencies → add/import rates → inspect valid/rejected rows → propose rates from a local copy
  of the ECB file (`get#EcbRates` with `sourceText`) → accept/reject selected proposals → create a supported
  foreign-currency invoice/journal → inspect source amount, stored rate/date and base posting → follow ledger/report
  drill.
- **Expected:** rate direction, effective date, source and currency precision are explicit; accepted proposals are
  distinct from unaccepted ones; display arithmetic reconciles to stored accounting amounts and original currency.
- **Recovery:** missing/zero/negative/duplicate rate, mixed-invalid import, stale proposal, canceled acceptance and
  provider unavailable. A changed later rate does not silently restate posted history. Record unsupported foreign
  workbench/run/transfer variants as limits and preserve their named refusal.
- **Screens/modes:** Currencies, AccountingPreferences, document/journal detail and Reports; browser/TUI/Standard,
  date-zone boundary and actual CSV/output checks. No live rate-provider dependency is required for the fixture.

### ACC-07 — Create, finalize and issue a customer invoice

- **Actor/start:** `finance.ar` (a sender on `BOSS_ACCOUNTING_MAIL`) and `finance.read`; `finance.approve` where
  invoice approval is required; `BOSS_ACCT_INVOICE` or a disposable draft, customer, terms and tax setup.
- **Objective/steps:** Invoices or quick create → draft header → add/edit two item rows and supporting references →
  review totals/due date → permitted approval/finalize → inspect ledger → preview/print/download → send to locally
  captured recipient → reopen the invoice and its issued evidence. Create a linked credit as a separate correction.
- **Expected:** customer/issuer, invoice identity, tax, currency, due/paid/remaining amounts and available next action
  agree across list, header, tabs and output; repeated issue/download uses the intended version and attachments.
- **Recovery:** invalid item/amount/recipient, missing tax/mapping, approval or date refusal, stale edit, canceled
  finalize/send/credit, missing output renderer and failed delivery. Sent evidence remains immutable while permitted
  ordinary supporting files remain editable. No broad role can substitute for the narrow AR evidence.
- **Screens/modes:** Invoices list/calendar, QuickCreate/NewInvoice, InvoiceDetail and all ten tabs, InvoicePrint;
  browser/TUI/Standard, keyboard/phone and multipage/long-name output samples.

### ACC-08 — Bill approved sources and issue a selected batch or statement

- **Actor/start:** `finance.ar` with `BOSS_ACCT_APPROVED_TIME` and source orders; a prepared Projects billing
  editor (`RECEIVABLE_EDIT` without reads) as counterpart. Leave `BOSS_ACCT_CLOSE_INVOICE` out of every batch.
- **Objective/steps:** BillingQueue → select eligible time/expenses → create invoice/bill → inspect source links and
  billed state; select invoices → InvoiceBatch → review action/recipients → process → inspect each outcome and
  downloaded CSV/PDF; Statements (or Customer360's Customer statement) → customer/as-of/currency options →
  preview → local send/output.
- **Expected:** the source is billed once within the operator's access; batch selection and source versions survive
  review; failures name the invoice/recipient without losing independent successes; statement balance and currency
  match its open items. Output scope is the explicit selection, not an inherited page selection.
- **Recovery:** already-billed/changed source, unauthorized project/worker, one invalid recipient, stale batch,
  canceled action, empty statement, unavailable PDF and retry after partial completion. Check output pagination and
  fixed filters rather than equating a successful download with complete records.
- **Screens/modes:** BillingQueue, Records/OrderDetail, InvoiceBatch, Statements, StatementPrint and resulting detail;
  browser/TUI/Standard, selection/keyboard and actual captured documents.

### ACC-09 — Apply a receipt and credit to customer open items

- **Actor/start:** `finance.ar`; `finance.treasury` (granted ReceivablesWorkbench) or `finance.paymentar` only where
  the chosen action needs payment authority; `BOSS_ACCT_STL_*` receipts, credit and invoices.
- **Objective/steps:** ReceivablesWorkbench → choose customer/currency/date → select source and target rows → edit
  allocations → SettlementReview → Back to selection → reload/resume the draft → confirm → follow applications,
  remaining amounts and ledger → repeat the same confirmed review without another allocation.
- **Expected:** selected identities and totals survive paging and navigation; partial receipt, credit, discount and
  any permitted write-off have understandable effects; retained `previewId`, fingerprint and operation key describe
  the exact confirmed work, and result links return to the right customer.
- **Recovery:** over-allocation, changed outstanding amount, expired/foreign preview, changed permission/lock/date,
  canceled confirmation and changed-input retry. The reviewed application set is atomic; no hidden partial settlement.
- **Screens/modes:** ReceivablesWorkbench, SettlementReview, InvoiceDetail/Payments, PaymentDetail/Applications and
  Customer360/Money; browser/TUI/Standard with a real failed-edit/reload/recovery sequence.

### ACC-10 — Record a payment and resolve its gateway or refund outcome

- **Actor/start:** `finance.treasury`; `finance.ar` as the read-only payment counterpart (`PAYMENT_VIEW`);
  `BOSS_ACCT_PAY_*` and `BOSS_ACCT_REFUND_*`, a disposable manual receipt and test-gateway approved/declined/pending
  cases.
- **Objective/steps:** Payments/quick create → save draft and evidence → review validation/delivery/state action →
  confirm → inspect applications and ledger. Separately authorize/capture through the test gateway, inspect
  GatewayTransactions, and review a manual or gateway refund with its linked original and result. Inspect receipt,
  detail and authorized check outputs.
- **Expected:** manual versus gateway actions and refund availability are clear; durable reviews survive reload;
  unknown provider outcome stays pending for reconciliation; confirmed retries return the same payment/result and
  immutable issued bytes. Refund and unapplication reveal their effects on the invoice and ledger.
- **Recovery:** declined/unknown response, stale method/evidence, expired/foreign review, changed-input retry,
  cancel, excess refund and missing permission. No arbitrary second charge to discover an uncertain first outcome.
- **Screens/modes:** Payments, QuickCreate/NewPayment, PaymentDetail's seven visible tabs and hidden Review,
  GatewayTransactions, PaymentPrint; browser/TUI/Standard and actual masked/downloaded evidence.

### ACC-11 — Intake a supplier bill and resolve its hold and approval

- **Actor/start:** `finance.ap`; `finance.match` as reader; `finance.approve` releases holds and approves;
  `finance.admin` as the same-user release refusal; `BOSS_ACCT_BILL_REVIEW`, a prepared held bill (keep
  `BOSS_ACCT_BILL_HELD` for ACC-13/14/21), an approved order with accepted receipt and an expense bill.
- **Objective/steps:** Bills upload/create or order/receipt billing → inspect bill identity, lines, source and file →
  place hold → request release → follow Approvals → independent release → request/decide approval → inspect posting
  and payment eligibility. Review ExpensePosting and Supplier360 bills/terms/finance details as related variants.
- **Expected:** duplicate supplier references and intake status are understandable; a held bill cannot become payable
  by a different route; the placer cannot release their own hold; bill print names the supplier as issuer, and shared
  invoice tabs preserve the payable direction. Approval notification returns to the authoritative bill.
- **Recovery:** malformed/duplicate upload, another supplier's source, changed receipt, rejection, canceled hold or
  approval, missing mapping, same-user release and partial bulk hold/expense outcomes. Retain inputs and original file.
- **Screens/modes:** Bills, QuickCreate/NewBill, BillDetail with mounted tabs/Holds, BillPrint, ExpensePosting,
  Supplier360 and Approvals/Notifications; browser/TUI/Standard, two-row dialog and phone/output samples.

### ACC-12 — Match a bill to its order and accepted receipts

- **Actor/start:** `finance.ap` or `finance.match`, `finance.approve` for the hold release, `finance.read`,
  `finance.admin` for MatchPolicies; `BOSS_ACCT_PO_MATCH` with `BOSS_ACCT_BILL_MATCH` and `_PRICE`.
- **Objective/steps:** BillDetail/Match → inspect order/receipt candidates → enter quantities → evaluate → apply →
  inspect evidence and exceptions/hold → resolve with the authorized actor → re-evaluate/unapply where offered.
  Inspect effective MatchPolicies and a LegacyMatches preview/apply with ambiguous and unsupported lines.
- **Expected:** ordered/received/accepted/billed quantities, units and tolerances are readable; applying evidence is
  distinct from releasing a hold; source changes make review stale; legacy backfill names independent bill outcomes.
- **Recovery:** overmatch, price variance, wrong supplier/order, changed acceptance, stale selection, canceled apply,
  ambiguous legacy evidence and revoked match permission. Record any currently unsupported tax/service/return-credit
  rule without expanding it as part of UI review.
- **Screens/modes:** Shared InvoiceMatch through BillDetail, Holds, LegacyMatches, MatchPolicies and source links;
  browser/TUI/Standard, keyboard/phone sequential-list behavior. The Purchasing/Bills mount on a Retail bill
  (`purchasing.buymatch`, WH-12's receipt) is PUR-22's and is the second consumer of a shared fix.

### ACC-13 — Apply supplier advances and credits to open bills

- **Actor/start:** `finance.ap` or `finance.treasury` (both reach PayablesWorkbench), with the supplier advance, a
  credit, `BOSS_ACCT_BILL_WORKBENCH` and a held bill.
- **Objective/steps:** Supplier360 → PayablesWorkbench → choose supplier/currency/date → select credits/payments and
  bills → enter allocations → SettlementReview → back/reload → confirm → inspect applications and bill balances.
- **Expected:** payable direction is retained through the shared workbench; discounts, due schedules and hold reasons
  remain visible; supplier advances and credits are not confused with a new disbursement; unchanged retry is stable.
- **Recovery:** held/ineligible bill, stale due amount, over-allocation, unsupported currency combination, another
  supplier's review, canceled confirmation and missing permission. Preserve draft selections after correction.
- **Screens/modes:** PayablesWorkbench, SettlementReview, Supplier360/Bills, BillDetail/Payments and payment result;
  browser/TUI/Standard. Compare the shared layout with ACC-09 without repeating its complete role matrix.

### ACC-14 — Propose, approve and execute a supplier payment run

- **Actor/start:** `finance.ap` proposes → `finance.approve` approves → `finance.treasury` executes; `finance.admin`
  approving its own run is the self-approval refusal; `BOSS_ACCT_BILL_DUE`, `_DISCOUNT`, `_RUN`, a held and an
  excluded bill; banks `BOSS_ACCT_RUN_BANK` and `BOSS_ACCT_SUPPLIER_BANK`.
- **Objective/steps:** PaymentRuns → new run → inspect included/excluded bills → leave out/put back → refresh selection
  → request approval → Approvals handoff → approve → execute → inspect per-supplier payments → resume an interrupted
  execution using its existing identity → download a synthetic NACHA/Positive Pay file → import a local return file.
- **Expected:** selection and approval refer to the same source version; bank/date/discount basis is clear; held or
  changed bills are explained; independent supplier failures do not duplicate successes; file download is distinct
  from submission to a bank, and returned/rejected items retain links and a useful next action.
- **Recovery:** stale selection/bank details, self-approval refusal, revoked execution permission, cancel before
  execution, invalid return rows, unknown/partial outcome and same-run retry. Inspect actual file records and totals.
- **Screens/modes:** PaymentRuns, PaymentRunDetail, Approvals/Notifications, Bills and resulting PaymentDetail;
  browser/TUI/Standard, dense-list/phone and visible resume/retry variants.

### ACC-15 — Import bank statements and apply explainable matching rules

- **Actor/start:** `finance.treasury` and `finance.read`; `BOSS_ACCT_BANK`, rule `BOSS_ACCT_RULE_CUSTOMER` and
  synthetic CSV/BAI2/OFX files.
- **Objective/steps:** BankAccounts → StatementImport → choose account and source → review new/duplicate/rejected
  rows → commit → inspect imported bank lines → repeat source → BankRules create/test/end → UnmatchedTransactions
  apply rules → inspect suggestions and exact/unambiguous automatic matches.
- **Expected:** account, date, debit/credit and file identity stay visible; duplicates do not create lines; each bad
  row has a reason; suggestions do not masquerade as reconciled facts; failed independent rows leave valid work usable.
- **Recovery:** malformed file/encoding/amount/date, mixed rows, duplicate IDs, wrong account, stale source, canceled
  import, ambiguous rule and lost bank authority. Correct failed input and retry without reimporting successes.
- **Screens/modes:** BankAccounts, BankAccountDetail, StatementImport, BankRules, UnmatchedTransactions;
  browser/TUI/Standard, keyboard and explicit terminal upload/paste boundary.

### ACC-16 — Reconcile a bank statement to zero difference

- **Actor/start:** `finance.treasury` with imported lines, `BOSS_ACCT_BANK_RCPT1`–`3`, an unmatched line and a
  draft statement session; leave the `BOSS_ACCT_CLOSE_BANK` line for ACC-21.
- **Objective/steps:** Reconciliations → create/open statement → inspect opening/closing balance and date range →
  match, clear, unclear or exclude individual rows with reasons → clear selected → review difference → finish →
  reload completed session and print. From BankAccountDetail prepare an eligible receipt deposit and inspect its slip.
- **Expected:** matched, cleared, excluded and still-open states are distinct; bank and payment identities remain
  paired; zero difference is a prerequisite to finish; completed results and deposit records survive reload.
- **Recovery:** nonzero difference, out-of-range/foreign line, conflicting match, stale session, canceled finish,
  receipt already deposited and lost permission. A finished-statement reopen or bank-fee creation is a separate
  capability check, not an assumed available recovery action.
- **Screens/modes:** BankAccountDetail, Reconciliations, ReconciliationDetail, UnmatchedTransactions and deposit/output
  controls; browser/TUI/Standard, keyboard and phone sequential lists with visible balances/actions.

### ACC-17 — Transfer cash and maintain a stored-value account

- **Actor/start:** `finance.treasury` and `finance.read`; two organization-owned payment methods, a fee
  counterparty and a permitted stored-value account.
- **Objective/steps:** Payments → internal transfer → TransferReview → inspect both legs and fee → cancel/review/
  confirm → reload result and linked payments. FinancialAccounts → FinancialAccountDetail → deposit, withdraw or
  adjust value through the offered controls → inspect resulting movements, balance and print.
- **Expected:** from/to method, currency, fee recipient and posting date are explicit; a transfer's two legs and fee
  succeed atomically and repeat returns the same result. Stored-value movements have their own clear purpose and
  authority; they are not presented as the same operation as a bank transfer.
- **Recovery:** invalid amount, same/foreign/inactive method, changed method revision, unsupported currency,
  expired review, canceled transfer, denied movement and failed posting. Preserve known data and named refusal.
- **Screens/modes:** Payments, TransferReview, PaymentDetail/PaymentPrint, FinancialAccounts/FinancialAccountDetail;
  browser/TUI/Standard, masked-field and actual output checks. Do not invent deferred stored-value transfer/reversal.

### ACC-18 — Work an overdue customer and resolve a credit hold

- **Actor/start:** `finance.ar` collects (it cannot open Approvals); `finance.approve` releases the credit hold;
  `finance.admin` for CollectionPolicies; `finance.read`; `BOSS_ACCT_AR_OVERDUE`, `_DISPUTED` and `BOSS_ACCT_SO_HELD`.
- **Objective/steps:** Home/Collections → prioritize customer → Customer360/Money and Activities → record contact,
  disputed invoices, next action and promise → reload → follow Today → Credit inspect exposure/policy → request or
  perform permitted hold release → OrderDetail → verify reason and order eligibility; inspect CollectionPolicies.
- **Expected:** the work list and customer totals use the same scope/date; promise is distinct from a payment;
  collector and due follow-up persist; credit limit, exposure, hold and release reason are understandable; approval
  returns to the order/customer without broadening the caller's read access.
- **Recovery:** invalid promise/date, stale exposure, wrong customer/order, canceled release, insufficient credit
  authority and unavailable aggregate. Unsupported cross-currency exposure or promise-to-invoice matching remains
  explicit rather than shown as a completed calculation.
- **Screens/modes:** Collections, Customer360/Contact/Money/Activities/Credit, CollectionPolicies, Approvals and
  Records/OrderDetail; browser/TUI/Standard, keyboard and long-note/phone samples.

### ACC-19 — Review reminders and resolve an uncertain send

- **Actor/start:** `finance.ar` with permitted recipients, disputed/ineligible invoices and captured local mail.
- **Objective/steps:** Dunning → new reminder run → inspect level, invoices, amounts and excluded reasons → review
  recipients → send → inspect per-notice outcome and captured content → reopen same run → resolve a deliberately
  uncertain notice as sent/failed with reason through the offered Settle action.
- **Expected:** preview and send use the same organization, policy and recipient scope; already-sent notices are
  not sent again; unknown outcome is visible and requires a deliberate resolution. One notice's failure does not
  misreport the whole run or hide successfully issued reminders.
- **Recovery:** missing recipient/template, ineligible or changed invoice, canceled send, failed local delivery,
  uncertain delivery and revoked AR authority. Do not claim a printable letter or fees/interest workflow if absent.
- **Screens/modes:** Dunning, CollectionPolicies, resulting invoice/customer and notification links;
  browser/TUI/Standard, actual captured message/recipient and resume/retry evidence.

### ACC-20 — Generate a recurring invoice without duplicate billing

- **Actor/start:** `finance.ar` (RecurringInvoices also accepts `PAYABLE_EDIT`); `BOSS_ACCT_RENT_TEMPLATE` and
  monitored recurring-order examples.
- **Objective/steps:** RecurringInvoices → create invoice-only schedule → inspect next-period preview → Make draft
  now → inspect source/period and draft invoice → repeat/resume → pause/resume/end a separate disposable schedule;
  inspect recurring orders' last copy and job result without executing an unrelated scheduler.
- **Expected:** invoice schedule and recurring sales order are distinguishable; displayed dates and generated period
  agree; retry does not duplicate a period; draft generation does not imply automatic send or a gateway charge.
- **Recovery:** missing/changed template, invalid cadence, already-generated period, failed period, canceled end and
  no authority. Named failures link to correction and the same schedule can resume where supported.
- **Screens/modes:** RecurringInvoices, InvoiceDetail, Today/RecurringInvoiceFailed return; browser/TUI/Standard and
  date-zone boundary samples. AP's entry to recurring bills under Payables is later (impl-accounting §7); record it,
  do not assume a Payables route.

### ACC-21 — Resolve close blockers and protect a closed period

- **Actor/start:** `finance.gl` investigates and resolves, `finance.approve` closes (`FISCAL_CLOSE`),
  `finance.admin` sets locks and exceptions and reopens (the only `FISCAL_REOPEN` holder); `BOSS_ACCT_CLOSE_PERIOD`
  with its draft-invoice and bank-line blockers plus prepared valuation and production blockers.
- **Objective/steps:** Periods → PeriodCloseDetail → inspect checklist/evidence → follow each selected Fix link →
  resolve (the draft invoice and bank line here; valuation and production as observed in ACC-23/24) → return/rerun
  → inspect TrialBalance/InvoiceReconciliation/PeriodRuns → confirm close → reload history/print → inspect
  authorized reopen. Separately configure a typed soft lock and bounded exception, and demonstrate a hard-lock
  refusal on a disposable journal.
- **Expected:** blocker counts and resolving records agree; only authorized links appear; period/date scope survives
  navigation; close/exception/reopen records identify actor/reason. Closed summaries and live open-period amounts are
  explained. Each registered check reports: AccountingCloseData's eleven, ValuationData's receipt cost basis and
  valuation tie-out, and ProductionCostingData's production WIP and cost close.
- **Recovery:** unresolved/new blocker, failed independent check, stale run, expired exception, wrong lock scope,
  canceled close/reopen and post on locked date. A failed close must not falsely mark a period closed.
- **Screens/modes:** Periods, PeriodCloseDetail, PeriodLocks, PeriodRuns, report and resolving record routes;
  browser/TUI/Standard. Advanced FX/deferral runs and absent reversal variants stay outside completion criteria.

### ACC-22 — Capitalize an asset and post a depreciation run

- **Actor/start:** `finance.admin` for AssetClasses and cost repair; `finance.gl` for capitalize, adjust, dispose,
  reverse and depreciation runs (all GL post); `finance.read`; `BOSS_ACCT_FA_FORKLIFT`, `_VAN`, `_PRINTER` and a
  disposed asset. Run this before ACC-21 closes last month.
- **Objective/steps:** AssetClasses → effective defaults → FixedAssets → EquipmentDetail → capitalize → inspect book,
  receipts/accounts and events → adjust/dispose or reverse an eligible latest book event on separate fixtures;
  DepreciationRunDetail → month/class/asset selection → preview → inspect per-asset amounts/failures → post → reload
  result and ledger/print; follow the run from PeriodRuns.
- **Expected:** acquisition cost, accumulated depreciation and net book reconcile; asset identity/location remain
  visible; failed independent assets are named; the same run is not posted twice and the book retains its history.
- **Recovery:** missing cost/method/account, stale class/book/run, closed date, invalid disposal/adjustment, canceled
  post and denied repair. Distinguish reversing a book event from the still-deferred posted depreciation-run reversal.
- **Screens/modes:** FixedAssets, AssetClasses, shared EquipmentDetail, DepreciationRunDetail and PeriodRuns;
  browser/TUI/Standard, long asset names, two-row actions and relevant second-consumer context.

### ACC-23 — Explain inventory value and allocate a landed charge

- **Actor/start:** `finance.gl`, `finance.read` and `finance.admin` (Repair product cost); `BOSS_ACCT_SUPPLY` at
  `BOSS_ACCT_WH` with on-hand/issued portions and `BOSS_ACCT_BILL_FREIGHT`; an approved standard cost for a
  `BOSS_ACCT_ORG` product must be prepared (Products' revaluation ran in Services as `catalog.cost.gl`).
- **Objective/steps:** InventoryValuation → organization/facility/product/day → compare stock, inventory/WIP accounts,
  exceptions and source movements → Product360 financial context → BillDetail/More → LandedCosts select charge and
  receipts → preview allocation basis/on-hand/issued split → confirm → inspect cost/ledger once. Separately preview,
  cancel and, in an authorized disposable execution, post standard revaluation; inspect privileged repair boundaries.
- **Expected:** quantity and valuation effects are distinct; receipt allocations sum to the charge; source documents,
  mappings and dates explain differences; standard approval alone never posts GL. Revaluation/repair authority is
  checked at the server, including requests from another app mount.
- **Recovery:** missing basis/standard, foreign receipt, stale stock or policy, locked date, cancel, same-key retry,
  denied repair and incomplete historical value. Absent landed/revaluation reversals are recorded as limits.
- **Screens/modes:** InventoryValuation, Records/Product360, LandedCosts, BillDetail and StockTransactions;
  browser/TUI/Standard, actual CSV/print where offered and Products/Warehouse shared-fix counterpart.

### ACC-24 — Review production costs and close or return the work order

- **Actor/start:** the prepared `retail.finance.approve` (posts and returns), `retail.finance.gl` (previews only),
  `retail.finance.admin` (CostingPolicies) and `retail.finance.read` (§2). A completed Retail run whose review MFG-27
  requested (in a shared runtime) or one prepared as AccountingProductionCostClose does, and a closed run with a later
  adjustment; Manufacturing's fixture specs run as focused acceptance runs (§5). MFG-28 owns the Manufacturing Cost
  close tab and closes a different run.
- **Objective/steps:** Home/notification/queue → ProductionCostClose → inspect source events, components, overhead,
  scrap, co-product allocation, variance and proposed ledger → the poster returns it to production with a note →
  inspect the corrected review → confirm cost close → verify allocations, ledger and closed work order. Inspect a
  later adjustment and dated CostingPolicies without rewriting the prior applied policy.
- **Expected:** operational completion, financial review and cost close are distinct; preview/post roles differ;
  the shown fingerprint binds all cost inputs; post balances and closes once, while an adjustment preserves history.
- **Recovery:** missing inputs/mappings, stale source/policy, open WIP, wrong organization, canceled post/return,
  retry and GL-only post refusal. Queue/read failures must not appear as “no work”.
- **Screens/modes:** Inventory/ProductionCostClose, Settings/CostingPolicies, Home and PeriodCloseDetail;
  browser/TUI/Standard. The Manufacturing mount (`Manufacturing/WorkOrders/WorkOrderDetail/ProductionCostClose`) is
  MFG-28's and the second consumer of a shared fix. Prepare operational facts as fixtures; this is not another
  production execution review.

### ACC-25 — Maintain tax inputs and inspect a retained statement

- **Actor/start:** `finance.tax`; `finance.admin` for configuration that needs it; `finance.ar` finalizes the
  consuming invoice (it has no Tax access); `BOSS_ACCT_UT_TAX`, `BOSS_ACCT_TAXED`, `BOSS_ACCT_1099_VENDOR` (with a
  TIN) and `_NOTIN` (without).
- **Objective/steps:** TaxAuthorities/TaxRates → inspect nexus/registration/account → version rate → simulate sale →
  finalize a consuming invoice → TaxStatements → prepare sales-tax or 1099 statement → inspect detail/source lines
  and validation → confirm export → inspect actual local output and retained state.
- **Expected:** effective dates and jurisdiction are clear; invoice tax ties to the selected source lines; masked
  identifiers stay masked in ordinary views. Export identifies its sensitive contents and records exporter/time;
  it is a state-changing operation, not an ordinary list download.
- **Recovery:** missing registration/account/taxpayer number, invalid/stale rate, foreign statement, canceled export,
  delete of retained statement and missing permission. Record limitations on credits/returns and jurisdiction packs;
  do not label a preview or generic CSV as a completed statutory filing.
- **Screens/modes:** four Tax screens, AccountingPreferences, InvoiceDetail and output;
  browser/TUI/Standard, dated-rate boundary, phone validation and exact exported bytes.

### ACC-26 — Revise a budget and explain commitment versus actual

- **Actor/start:** `finance.gl` edits (`BUDGET_EDIT`); `finance.approve` approves and overrides (it holds both; to
  separate the two, prepare a single-grant user); `finance.read`; `BOSS_ACCT_BUDGET`, `BOSS_ACCT_PO_BUDGET`,
  `BOSS_ACCT_BILL_OVER` and a draft budget.
- **Objective/steps:** Budgets → BudgetDetail → edit draft account/period amounts and parties → approve budget →
  change approved amounts with a revision reason → inspect the retained revision/PDF → BudgetControls → inspect a
  permitted source's commitment → warning/stop → BudgetOverride notice in Approvals → override → convert/release
  through the owning source action → BudgetVariance drill and invoice Budget tab.
- **Expected:** draft budget, approved amounts and retained revisions are distinct; saving approved amounts creates
  their revision directly, without an invented second approval step. Actual, committed and available amounts
  reconcile; override records authority/reason; historical revision output remains stable; source links preserve
  organization and period.
- **Recovery:** unbalanced/invalid allocation where constrained, stale approval, duplicate commitment, canceled
  override, unsupported dimension and denied source. Which Purchasing callers of the budget check exist is to verify
  at execution (impl-accounting §7 P15 lists them as later); inspect what exists without expanding its workflow, and
  record overlapping budgets (F315) rather than choosing one silently.
- **Screens/modes:** Budgets, BudgetDetail, BudgetControls, BudgetVariance, invoice/bill Budget tabs and bounded
  Purchasing/Projects handoff; browser/TUI/Standard with row/period editing and retained PDF bytes.

### ACC-27 — Explain a financial result from report to source

- **Actor/start:** `finance.read` and `finance.gl`; `finance.ar` (no Reports grant) as the refusal; known postings,
  open/closed periods, zero values, comparison period and incomplete-data fixture.
- **Objective/steps:** Reports catalog → choose organization/date/period/currency/dimensions/comparison → read result
  → drill account/month/party/product/source → inspect record → Back with options intact → export and print. Cover
  TrialBalance, GeneralLedger, PartnerLedger, BalanceSheet, IncomeStatement, CashFlow, RetainedEarnings,
  FinancialRatios, AccountBalance, PostedSummary and SalesAnalysis, each with the question it answers. Aging,
  InvoiceReconciliation, StockTransactions and BudgetVariance are exercised in ACC-18, 21, 23 and 26; here only
  their catalog entry is checked.
- **Expected:** totals tie to controlled fixtures, conversions and as-of basis are named, comparisons use matching
  scope, zero denominators say unavailable, and restricted sources do not leak through drills or bytes. Exported
  rows reflect the advertised full/filtered scope and do not silently stop at a visible page.
- **Recovery:** empty/no-match result, absent period/rate, failed source, restricted drill, invalid comparison,
  changed organization and unavailable PDF. Incomplete reports name their limitations instead of asserting a full tie.
- **Screens/modes:** the catalog and the eleven reports above plus output/drill destinations; browser/TUI/Standard,
  narrow, keyboard and multipage output. This is planned manual coverage, not a new regression render sweep.

### ACC-28 — Follow operational evidence and settle a return

- **Actor/start:** `finance.ar` settles, `finance.approve` approves a receiptless credit (`RETURN_CREDIT_APPROVE`),
  `finance.read`; `BOSS_ACCT_RETURN` on `BOSS_ACCT_SO_RETURN` (`BOSS_ACCT_ORG` settles returns separately), an
  owned shipment and product. Settlement in Customer Service's context is CS-22's (`customerservice.returnsar`), a
  supplier return's credit PUR-24's (`retail.finance.ap`), and Warehouse's read-only settlement view WH-26's.
- **Objective/steps:** source invoice/bill → OrderDetail/ShipmentDetail → inspect lines, accepted receipts, invoice
  and hold links → return to finance; ReturnDetail → inspect authorized/received/accepted/rejected/eligible quantity
  → preview settlement → confirm received portion → inspect linked credit and refund handoff. Separately inspect
  receiptless-credit review and source-linked paid-access effects where the existing contract applies.
- **Expected:** record keys, counterparties, quantities and financial effects agree; settle is distinct from physical
  receipt, authorization and refund; retries do not duplicate credits. Operational writes remain in their owning app.
- **Recovery:** wrong-side/foreign return, insufficient receipt, changed eligibility, canceled settlement, missing
  approval and stale source. Missing return-list entry or manual-response/fee feature is a navigation/capability note,
  not a reason to add a new workflow.
- **Screens/modes:** Records/OrderDetail/ShipmentDetail/ReturnDetail/Product360, Customer360, invoice/bill tabs;
  browser/TUI/Standard. The Warehouse, Purchasing, Customer Service and Commerce ReturnDetail consumers are second
  consumers of a shared fix, not part of this activity.

### ACC-29 — Keep evidence and discussion attached to the right record

- **Actor/start:** the record's editor (`finance.ar`, `finance.ap`, `finance.treasury` or `finance.gl`),
  `finance.read` and `catalog.reader` or a Services user without the record; ordinary supporting file
  (`BOSS_ACCT_AR_SUPPORT`, `BOSS_ACCT_PAY_EVIDENCE`) plus immutable issued invoice/payment evidence.
- **Objective/steps:** record Files/Conversation/History → upload ordinary evidence → inspect/download its exact bytes
  → add/edit/reply/follow Chatter where offered → return from notification → inspect record history. Compare source
  versions, sent invoice attachments and treasury-only issued checks through their actual download links.
- **Expected:** record and audience identity remain visible; issued evidence is retained and immutable while ordinary
  allowed evidence can version; file counts are filtered before paging/limits; unauthorized filenames, drive paths,
  costs and private metadata are absent from answers and known-key download attempts.
- **Recovery:** wrong file/record, failed independent upload, deleted attachment, stale edit, canceled action,
  expired permission and late reply after switching records. Draft recovery belongs to the selected record.
- **Screens/modes:** invoice/bill/payment tabs, journal evidence, customer/supplier finance files, root Chatter and
  RecordFiles plus terminal helpers; browser/TUI/Standard. State explicit terminal browser delegation for unsupported
  upload/edit controls; readback alone does not prove editing.

### ACC-30 — Hand an invoice or purchase order to its external contact

- **Actor/start:** the prepared `retail.finance.ar` and `retail.finance.ap` (§2; `send#Invoice` and
  `create#AccessCapability` check `RECEIVABLE_EDIT`/`PAYABLE_EDIT` in the record's organization, and the published
  site `ZIZI_PORTAL` on `portal.zizi.localhost` targets `ORG_ZIZI_RETAIL`), or a disposable Billing/Supplier site for
  `BOSS_ACCT_ORG`; PASS contacts `joedist.payer` (invoice "Portal demo distributor replenishment" to JoeDist) and
  `ziddleman.billing` (order "Portal demo shelving restock" from ZiddlemanInc), both with generated IDs, not the
  `ZIZI_PORTAL_INVOICE`/`_PO` that AccountingImplementation names; captured mail and test gateway `ZIZI_PORTAL_HOSTED`.
- **Objective/steps:** send an issued invoice (`send#Invoice` mails the pay link) → external Billing/InvoicePay →
  test-gateway outcome → Accounting invoice/payment; Records/OrderDetail of an approved purchase order → Supplier
  bill link (shown once) → Supplier/BillUpload → Bills intake, file and source order. Use newly issued links; the
  demo tokens in AccountingImplementation are fixtures, not evidence of issuance.
- **Expected:** external access needs its own relationship/capability, not a BOSS group; payer/upload may reach only
  the named records; internal balances/intake reflect the same outcome; token/recipient details stay out of evidence
  committed to the repository.
- **Recovery:** expired/revoked/wrong-party token, unavailable site/gateway, duplicate submission, declined/pending
  payment and invalid file. Missing published host/runtime is a blocked handoff, not a failed Accounting screen.
- **Screens/modes:** Accounting InvoiceDetail/Records/OrderDetail/Bills and PASS Billing/InvoicePay/Supplier/BillUpload;
  browser at desktop/390px. PASS has no implied TUI requirement; review only this handoff, not its whole public suite.

### ACC-31 — Reconcile permission, organization and context boundaries

- **Actor/start:** each narrow `finance.*` holder/non-holder pair, `catalog.reader`, `ORG_ZIZI_SERVICES` records,
  launcher-less finance holders (`manufacturing.finance`, `purchasing.buymatch`, `insights.finance`), the same record
  after grant revocation, `finance.paymentar` as the composed actor and `finance.admin` with active scope narrowed.
- **Objective/steps:** pair successful/otherwise-valid refused reads and writes across direct routes, transition
  calls, choices and selected-value labels, palette/search counts, report drills, Chatter/files, print/export and
  known review/output keys. Probe inherited excluded children and forged `appRoot`; verify a legitimate owning-app
  counterpart. Change one grant or active organization after loading a review, then restore it.
- **Expected:** server permissions protect the operation even when artifact authorization alone is bypassed;
  edit-only neighboring grants do not create financial read access; a view grant does not create approval/post
  authority; denied values and identities are absent, not replaced with revealing counts or zeros.
- **Recovery:** authorization loss keeps recoverable draft state without committing; restoration permits a fresh
  authorized review. A refusal must name the intended rule/reason or be paired with the same valid successful payload;
  validation errors do not count as permission evidence.
- **Screens/modes:** mapped routes/helpers/outputs and shared-context exclusions throughout; browser plus focused
  server-response support, actual TUI/Standard representatives. This is not a new users × routes × modes test matrix.

### ACC-32 — Preserve cross-app continuity and reconcile remaining modes

- **Actor/start:** `finance.read` or a narrow operator and an explicit neighbouring holder (`catalog.cost.gl`,
  `manufacturing.costclose`, `purchasing.buymatch`, `insights.finance`), with scoped records and the remaining
  mode/recovery gaps from earlier activities.
- **Objective/steps:** enter from Insights report/attention or Admin settings → retain organization/filter context →
  complete the permitted finance step → return with one Back; inspect Products standard → valuation, Manufacturing
  cost review → finance, Purchasing match/budget → AP, Projects billing → invoice and Warehouse facts → source ledger
  using the receipts from their owning activities. Revisit changed shared surfaces in a second consumer.
- **Expected:** links choose the current mount and preserve record context; unavailable adjacent apps explain limits;
  shell/tray navigation works in terminal; light/dark, phone, keyboard, Standard and output gaps are explicitly
  reconciled rather than inherited from a browser or service pass.
- **Recovery:** cold cross-app navigation, missing launcher despite a valid business permission, deleted/inaccessible
  linked record, stale asynchronous response, failed provider and interrupted confirmation.
- **Screens/modes:** shared mounts, shell providers, report/settings entries and outstanding variants; actual browser/
  TUI/Standard as applicable. Record unsupported/tool-blocked variants without claiming their outcomes.

Handoffs with the four companion reviews; each side is exercised once, by the activity named, and the other review
only opens it as far as the handoff:

| Handoff | Counterpart side (review) | Accounting side |
| --- | --- | --- |
| Production cost review and close (`ProductionCostReview` notice; Shared ProductionCostClose) | Manufacturing MFG-27 requests (`manufacturing.cost`); MFG-28 previews, posts or returns on the Cost close tab | ACC-24: Inventory/ProductionCostClose queue with the prepared Retail finance identities |
| Bill match and hold release (Shared InvoiceMatch) | Purchasing PUR-22 on a Retail bill (`purchasing.buymatch`, `retail.finance.ap`/`.approve`), over WH-12's receipt | ACC-11/12 on `BOSS_ACCT_ORG` bills (`finance.*`) |
| Budget commitment | Purchasing PUR-12 | ACC-26 on `BOSS_ACCT_BUDGET` |
| Landed charge (Allocate to receipts) | Purchasing PUR-22, link only | ACC-23 |
| Inventory value (Shared InventoryValuation) | Warehouse WH-32: Warehouse mount, no revaluation or repair | ACC-23: Accounting mount, revaluation and landed cost |
| Return settlement (`settle#Return`) | Customer Service CS-22 (`customerservice.returnsar`); Warehouse WH-26's read-only view; Purchasing PUR-24's supplier credit | ACC-28 on `BOSS_ACCT_RETURN` |
| PASS Billing pay link and Supplier BillUpload | Purchasing PUR-28 submits one bill through BillUpload only as PUR-22's intake input | ACC-30 reviews both pages, on fresh links |

## 5. Existing checks and future verification

This is an available-test map, not a results ledger. Paths are relative to the named component and names omit
`.spec.js`; read current assertions before relying on a spec name.

| Component / suite | Existing specs | Activities / limits |
| --- | --- | --- |
| mr-boss regression `test/Accounting/` | AccountingAccess | ACC-01–06, 28, 30–31; access, scope, choices, returns and setup cases; not a live role walk |
| mr-boss regression `test/Accounting/` | AccountingClientFixtures | One feature: theme assets are local; not review evidence |
| mr-boss regression `test/Accounting/` | AccountingReceivables, AccountingSettlement | ACC-07–09, 13; documents, batches, statements, retained settlement review and results |
| mr-boss regression `test/Accounting/` | AccountingPayments, AccountingPaymentGateway, AccountingPaymentRefunds, AccountingPaymentTransfers | ACC-10, 17; draft/lifecycle/review identity, gateway, refund and transfer contracts |
| mr-boss regression `test/Accounting/` | AccountingPaymentFiles, AccountingIssuedFiles, AccountingOutputs | ACC-07–11, 17, 21, 29, 31; immutable issued bytes, scope/counts and authorized print content |
| mr-boss regression `test/Accounting/` | AccountingPayables, AccountingMatching, AccountingPaymentRuns | ACC-11–14; hold/approval/match, supplier settlement and interrupted execution |
| mr-boss regression `test/Accounting/` | AccountingBanking, AccountingCollections | ACC-15–20; import/reconciliation/stored value, reminder outcomes, credit and recurring context |
| mr-boss regression `test/Accounting/` | AccountingPeriodClose, AccountingFixedAssets, AccountingValuation, AccountingProductionCostClose | ACC-21–24; blockers, per-asset outcomes, valuation/landed cost; cost close with spec-local Retail `boss_pcc_*` users |
| mr-boss regression `test/Accounting/` | AccountingTax, AccountingBudgets, AccountingReporting | ACC-25–27; tax context/output, budget revisions/commitments, report/print/drill and Home |
| mr-boss regression `test/client/Accounting/` | AccountingReceivablesWalk | The golden path: AR create/finalize/send an invoice; reuse it |
| mr-boss acceptance `test/acceptance/Accounting/` | AccountingScreens | The app's sweep: every route with `routeFixtures` in qvt and tui, as john.doe with authz off; not browser or terminal interaction |
| mr-boss acceptance `test/acceptance/Accounting/` | AccountingAccessWalk, AccountingServerStatic | Access/isolation walk (creates `BOSS_P21_OTHER`) and server-static qvt; acceptance despite their `./moq test` run comments |
| mr-boss acceptance `test/acceptance/client/Accounting/` | AccountingLedgerWalk, AccountingSettingsWalk, AccountingSetupWalk, AccountingCurrencyWalk | ACC-02–06 |
| mr-boss acceptance `test/acceptance/client/Accounting/` | AccountingSettlementWalk, AccountingPaymentsWalk, AccountingPaymentGatewayWalk | ACC-09–10 |
| mr-boss acceptance `test/acceptance/client/Accounting/` | AccountingPayablesWalk, AccountingMatchingWalk, AccountingPaymentRunsWalk | ACC-11–14; AP → approver → treasury handoffs |
| mr-boss acceptance `test/acceptance/client/Accounting/` | AccountingBankingWalk, AccountingCollectionsWalk | ACC-15–19 |
| mr-boss acceptance `test/acceptance/client/Accounting/` | AccountingCloseWalk, AccountingFixedAssetsWalk, AccountingValuationWalk | ACC-21–23 |
| mr-boss acceptance `test/acceptance/client/Accounting/` | AccountingTaxWalk, AccountingBudgetsWalk, AccountingReportsWalk, AccountingReturnsWalk | ACC-25–28 |
| mr-boss regression `test/Shared/`, `test/Commons/` | Chatter, RecordFiles; QuickCreate, TodayPanel, Notifications | ACC-01, 29, 32; only for an affected shared surface |
| mr-boss acceptance root | AppStructure, ServerStatic, TuiRender | Suite-wide structure/render checks; reconcile overlap before changing AccountingScreens |
| mr-mantle regression `test/ledger/` | AccountingApplicationRules, AccountingControls, AccountingBookDates, AccountingFiscalPeriodDays, AccountingSetup, AccountingCurrency | ACC-02–06, 21, 31 |
| mr-mantle regression `test/ledger/` | AccountingReceivables, AccountingPaymentCorrections, AccountingReports, AccountingActivities, AccountingProjectCost, FinancialReports | ACC-07–10, 18, 27–28 |
| mr-mantle regression `test/ledger/` | AccountingPeriodClose, AccountingFixedAssets, AccountingValuation, ProductionCostClose, ReceiptAdjustments, LedgerMaintenance | ACC-21–24 and protected history |
| mr-mantle regression `test/account/` | AccountingSettlement, AccountingSettlementConcurrency, AccountingPaymentLifecycle, AccountingPaymentGateway, AccountingPaymentRefunds, AccountingInternalTransfers, FinancialAccountServices | ACC-09–10, 13, 17 |
| mr-mantle regression `test/account/` | AccountingPaymentOutput, AccountingPaymentNotifications, AccountingDelivery | ACC-07–10, 14, 29 |
| mr-mantle regression `test/account/` | AccountingPayables, AccountingMatching, AccountingPaymentRuns, AccountingPaymentRunControls, AccountingBankReconciliation, AccountingTermDueDays | ACC-05, 11–16 |
| mr-mantle regression `test/account/` | AccountingCollections, AccountingCredit, AccountingCustomerFinance, AccountingRecurringAging, DunningRenewalExclusion, AccountingPortals | ACC-18–20, 30 |
| mr-mantle regression `test/other/`, `test/order/`, `test/sales/` | AccountingTax, TaxStatementServices, AccountingBudgets, BudgetServices; AccountingReturns; AccountingStatements | ACC-08, 25–28 |
| mr-pass regression `test/Billing/`, `test/client/` | Portals, PortalFixtures; PortalHttp | ACC-30's PASS side (pay link and BillUpload pages and refusals) |
| webroot regression `test/client/` | WebrootVue.qvt, WebrootVue.qvt.shell, WebrootVue.qvt.layout, WebrootVue.qvt.records, WebrootVue.qvt.static, WebrootVue.qvt.views, WebrootTerminal, QvtKeys, Keys | Only for affected shared-widget/shell/renderer behavior |
| webroot acceptance `test/acceptance/client/` | ThemeLayout | Offline theme/geometry coverage; no implied authorization to run it |

Counts: 23 server regression specs in `test/Accounting/` (with AccountingSpecLib), one browser golden path
(registered in `test/client/suite.js` with captured mail), three server acceptance specs and 19 browser walks
registered in `test/acceptance/client/suite.js`, whose server also loads Products, Warehouse, Manufacturing and Insights
fixture specs; inspect a selection's `dependsOn` and fixtures before a run. AccountingSpecLib is the shared
identity/route-fixture source (`ids`, `asUser`, `routeFixtures`, the tab lists and generated-ID lookups); its fixture
functions are not an instruction to add route-fixture specs.

None of these establishes actual TUI keyboard workflows, app-wide narrow coverage, multipage output quality,
every recovery branch, a browser cost-close journey from the Accounting mount or the cross-runtime PASS handoff; a
tested pending gateway result is not a provider integration. No new automation is prescribed: an observed finding
names its activity and the existing or new spec first, with focused rule/bug checks in regression and complete
jobs, phone, access, isolation and terminal walks in acceptance.

### Verification rules for later refinements

These rules govern the refinement pass, and the commit rule applies in both; the review pass corrects nothing and
commits no source (§2). The suite rules are the [testing skill](../../../../../.agents/skills/testing/SKILL.md) and
[Build-Test](../../../../../docs/Build-Test.md#the-two-suites) with [rendering screens in
tests](../../../../../docs/Build-Test.md#rendering-screens-in-tests). Accounting specifics:

- **While working.** From the mr-moqui root on a built binary: `./moq test mr-boss --spec AccountingSettlement
  --nobuild`, the owning Mantle spec when its rule changes, and the golden path
  `./moq test-client mr-boss --serve --spec AccountingReceivablesWalk --nobuild`. PDF specs need Chromium; the
  client suites set `mail_capture_sends`.
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
  `./moq accept mr-boss --spec AccountingPaymentRunsWalk`.
- **Rendering.** AccountingScreens is the one sweep per mode and stays in acceptance. Across regression a screen
  renders at most once per mode with all its checks, in a second mode only where it has its own qvt/tui section (the
  49 local files above). No role × mode matrix, duplicate golden path, Mantle rule retested through a BOSS wrapper
  or screenshot baseline.
- **Budgets.** BOSS `test/budget` 264 s server / 57 s client, Mantle 393 s server, PASS 20 s / 9 s; a component
  over 1.5 times its budget or one regression spec over 15 s fails the run. Cut duplication or move a scenario to
  acceptance; no budget is raised without the user's agreement.
- **Lint.** `moqui lint --screens <report-file>` for changed screens (the argument is an overwritten output report,
  never a screen path), compared with the baseline; Markdown-only edits need none.
- **Evidence** stays in ignored `plans/ui-refinement-evidence/boss-accounting/` in the framework repository; never
  commit credentials, issued link tokens, private financial data, captured messages or screenshots.

## 6. Coverage, findings and running record

### Activity coverage ledger

**Pending** means not reviewed; **inspected** means source/render/visual inspection only; **exercised** means steps
executed with an explicit pass/fail/partial outcome; **blocked** means a missing prerequisite; **deferred** means
deliberately postponed with reason and follow-up. Exercised does not by itself mean passed: use `exercised / partial`
and name the open continuations, recovery and mode gaps. Blocked and deferred coverage remains unresolved. Source
research and document review do not advance this ledger; record actual modes and results, not only a test name.

| Activity | Status | Outcome / recovery / mode gaps | Evidence / findings |
| --- | --- | --- | --- |
| ACC-01 — Workday/scope | pending | All live variants unreviewed | — |
| ACC-02 — Setup/activation | pending | All live variants unreviewed | — |
| ACC-03 — Chart/periods | pending | All live variants unreviewed | — |
| ACC-04 — Journals/templates/batches | pending | All live variants unreviewed | — |
| ACC-05 — Defaults/consumers | pending | All live variants unreviewed | — |
| ACC-06 — Rates/conversion | pending | All live variants unreviewed | — |
| ACC-07 — Invoice lifecycle | pending | All live variants unreviewed | — |
| ACC-08 — Source billing/batches/statements | pending | All live variants unreviewed | — |
| ACC-09 — Receivable settlement | pending | All live variants unreviewed | — |
| ACC-10 — Payments/gateway/refunds | pending | All live variants unreviewed | — |
| ACC-11 — Bills/holds/approval | pending | All live variants unreviewed | — |
| ACC-12 — Matching | pending | All live variants unreviewed | — |
| ACC-13 — Payable settlement | pending | All live variants unreviewed | — |
| ACC-14 — Payment runs | pending | All live variants unreviewed | — |
| ACC-15 — Statement import/rules | pending | All live variants unreviewed | — |
| ACC-16 — Reconciliation/deposits | pending | All live variants unreviewed | — |
| ACC-17 — Transfers/stored value | pending | All live variants unreviewed | — |
| ACC-18 — Collections/credit | pending | All live variants unreviewed | — |
| ACC-19 — Dunning | pending | All live variants unreviewed | — |
| ACC-20 — Recurring invoices | pending | All live variants unreviewed | — |
| ACC-21 — Locks/close/runs | pending | All live variants unreviewed | — |
| ACC-22 — Asset books/depreciation | pending | All live variants unreviewed | — |
| ACC-23 — Valuation/landed cost | pending | All live variants unreviewed | — |
| ACC-24 — Production cost close | pending | All live variants unreviewed; needs prepared Retail finance users and a requested Retail run | — |
| ACC-25 — Tax | pending | All live variants unreviewed | — |
| ACC-26 — Budgets | pending | All live variants unreviewed | — |
| ACC-27 — Reports/drill/outputs | pending | All live variants unreviewed | — |
| ACC-28 — Related records/returns | pending | All live variants unreviewed | — |
| ACC-29 — Evidence/discussion | pending | All live variants unreviewed | — |
| ACC-30 — PASS handoff | pending | Needs a separately configured PASS runtime and a Retail (or `BOSS_ACCT_ORG`-site) AR/AP operator | — |
| ACC-31 — Access/isolation | pending | Paired checks throughout; no matrix inferred | — |
| ACC-32 — Cross-app/mode reconciliation | pending | Depends on earlier activity continuations | — |

### Findings register

No runtime/UI defect has been established by this planning work. The review pass records findings with Owner /
correction / retest empty; the refinement pass fills them in. Number later findings **ACC-UI-001** onward with the
guide's fields and severities ([record, fix and verify](../../../../../docs/dev/UI-Review.md#record-fix-and-verify)): P1
blocks work or makes essential information unusable, P2 causes substantial friction or misleading presentation, P3 is
a localized refinement. Distinguish observed failures, source suspicions and design judgments. Financial data or
access corruption takes priority regardless of whether the screen looks correct.

| ID | Severity / status | Actor, activity and step | Route / mode / theme / viewport | Reproduction, observed impact and evidence | Owner / correction / retest |
| --- | --- | --- | --- | --- | --- |
| — | No observed findings yet | — | — | Source concerns below are investigation inputs | — |

Source concerns to carry into execution, without treating them as observed defects:

- Shared context branches and inherited children can differ from the visible tab menu; pair direct route/transition
  probes with actual owning-app positives. Reused invoice tabs and bill outputs need explicit direction checks.
- Duplicate menu indexes: root Approvals and Inventory (9), Payables LegacyMatches and PaymentRuns (4), Settings
  CostingPolicies and MatchPolicies (8). Tax defaults to TaxStatements (index 3), not its first item, and
  FixedAssets lists DepreciationRunDetail as a menu item. Inspect actual navigation order before proposing a
  correction; a source index alone is not evidence of a confusing rendered menu.
- Durable settlement/payment reviews, unknown outcomes, issued evidence and resumed runs require visible recovery
  checks beyond a normal happy path. Outputs, selected-value labels and search counts are part of financial scope.
- Home mixes independently loaded sources and counts receivables, payables and bank balance in the base currency
  only (`Home.js` filters other-currency bank rows); reports mix live data with stored closed-period summaries.
  Inspect basis and incompleteness explanations.
- impl-manufacturing F121, carried in impl-accounting §7 "Later" (not impl-accounting's own F121, a fixed date
  finding): with `postingGuardEnabled`, the legacy `repost#AssetReceipt` under a hard lock unposts and deletes the
  posted transaction and its new posting lands unposted in the error journal. Current Mantle
  `PostingGuard.assertMutable` still returns early for an unpost, so the source suggests it is open. It is an input
  for ACC-21's hard-lock branch (Mantle owns the fix), not an observed finding or authorization for historical repair.
- Documentation lags source: impl-accounting §7 still lists ProductionCostClose/CostingPolicies, MyFinanceWork's
  cost-close entry and the production WIP/cost-close close checks as later, though impl-manufacturing P15 and
  Mantle's `ProductionCostingData` built them; AccountingImplementation's verification list, "No route fixtures" and
  demo users are out of date (§3 reconciliation). Record further source-to-design differences when encountered; do
  not turn them into feature expansion.

### Bounded batch record

| Batch | Scope | Evidence / verification | Outcome / continuation |
| --- | --- | --- | --- |
| Plan — 2026-11-10 | Coordinator plus two read-only research subagents: Products pattern, current Accounting inventory, workflows, fixtures, permissions, tests and historical deferrals | Source/document inspection only; no live runtime, tests, outputs or financial mutations | Initial plan written; all ACC activities pending |
| Plan check — 2026-11-11 | One read-only pass against screens, data, services, specs and suite registrations | Confirmed 134 local definitions, the route/default tables, 23/1 regression and 3/19 acceptance files and budgets. Corrected the role table to the seeded grants, each activity's actors and fixture IDs, the Manufacturing cost-close route, Approvals topics, the Retail scope of ACC-24/30 and the F121 citation; condensed §2/§5 to Accounting specifics; added fixture consumption and an eighth wave so ACC-21 follows its blocker activities | No runtime, test or application change; all ACC activities pending |
| Cross-review reconciliation — 2026-11-11 | The five companion reviews reconciled with one another and with source: handoff sides, shared fixtures, prepared identities, the shared-runtime disposition and the method wording | Source and document inspection only | Added the prepared Retail finance identities and the handoff table (ACC-32); ACC-24 and ACC-28 keep only Accounting's side; all ACC activities pending |

For each execution batch append: its pass (review or refinement); actor and fixture identities; source and binary
revisions; runtime, clock and modes; activities and branches attempted; findings and owning layer; important
before/after evidence; persisted outcomes and inspected artifacts; exact checks, results and skips;
design/implementation updates; commits when made; temporary grants, settings and policy rows restored; unresolved
continuations. Keep notes bounded and refer to evidence files rather than pasting logs or tokens.

## 7. Decisions

- **Planning record and method:** planning only, written 2026-11-10, checked against source and reconciled with the
  four companion reviews on 2026-11-11; no runtime, walkthrough, test, build, application change or commit, and every
  activity pending. Products' seven-part structure; §2 and §5 keep only Accounting specifics and link the guide and
  Products for the generic method (user decision, 2026-11-11); earlier reviews' statuses, authorizations and
  exceptions do not carry over.
- **Source and handoffs:** current mounts, services and grants govern scope, and older records are reconciled here
  without being rewritten. Each side of a cross-app handoff is exercised once, by the activity the handoff tables name
  (ACC-32 here); the other review opens it only as far as the handoff.
- **Financial basis:** record organization, dates, currency and authority in each receipt. Use disposable local data,
  captured mail, synthetic gateways and local bank/tax files. Review a business operation's full result, including
  retained reviews, partial outcomes and repeated requests.
- **Wave order (2026-11-11 check):** eight waves rather than Products' seven, so ACC-21's close follows the
  activities that resolve its blockers (22–26) and closes `BOSS_ACCT_CLOSE_PERIOD` only after nothing else posts in
  it; ACC-27 then explains the closed and open periods. Activity numbers are unchanged.
- **Report ownership:** ACC-27 owns the catalog, the ledger/statement reports and SalesAnalysis; Aging,
  InvoiceReconciliation, StockTransactions and BudgetVariance belong to the activities whose data they explain, so
  ACC-27 stays one bounded batch.
- **Retail scope:** ACC-24 and ACC-30 use the prepared Retail finance identities (§2), or for ACC-30 a disposable
  portal site for `BOSS_ACCT_ORG`, because the demo finance users serve `BOSS_ACCT_ORG` only while the requested runs
  and the portal demo are Retail's.
- **Modes and completion:** Material is the visual target; actual TUI and brief Standard/output checks stay explicit.
  PASS is a bounded browser handoff. Completion needs evidence for the selected activities, resolved or accepted
  findings and a candid ledger of what remains; a source inventory or passing suite is not a usable workflow.
- **Phases (user decision, 2026-11-11):** a complete review pass with concurrent agents comes first and corrects
  nothing; all findings are triaged together and addressed in a separate refinement pass (§2).

### Execution setup dispositions

The user decided every setup question on 2026-11-11. Record the actual values (instances, paths, ports, hostnames and
dates) in the first live batch and whenever an instance is added, as Products did:

- **Bootstrap and instances (decided):** the release binary, embedded Postgres and disposable databases throughout.
  The coordinator decides which agents share an instance and which get their own, and when (major data staging or a
  conflicting setup), and starts further instances on the fly on free non-default ports with their own hostnames (user
  decision, 2026-11-11). Record each instance's runtime and database paths, linked components, loaded demo data and
  any selected fixture specs; listener ports and hostnames.
- **Shared runtime (decided):** the coordinating agent decides whether the five reviews share one runtime and
  manages the concurrent agents, the cross-review order and the restore of Retail-wide changes (§2).
- **Dates and zones (decided):** the real clock in the machine's current zone, recorded with the load and execution
  dates, and no DST or second-zone checks; rows recreated relative to execution, and closing and month work back-dated
  into periods that ended before now (user decision, 2026-11-11).
- **Tool capability:** measured viewports, terminal keyboard and Chromium/PDF. 200% browser zoom is not checked
  (user decision, 2026-11-11).
- **Posting and mutation extent (decided):** postings and temporary setting, grant and policy changes in the
  disposable runtime are allowed (user decision, 2026-11-11); the coordinator sequences them and restores the changes.
- **Prepared fixtures (decided):** prepared users and records may be created for testing (user decision, 2026-11-11):
  the Retail finance identities (§2), a multi-organization user, a held bill, a Projects billing editor, an approved
  `BOSS_ACCT_ORG` standard cost, valuation/production close blockers and a second currency's documents.
- **Automation selection (decided):** focused acceptance walks and fixture specs along the way, and the full
  application acceptance run after the final `./moq test-apps` (§5; user decision, 2026-11-11). The acceptance client
  suite's server also loads Products, Warehouse, Manufacturing and Insights fixture specs.
- **Test cadence (decided):** local, focused checks before each commit in either pass, and one `./moq test-apps`
  (with `./moq test-framework` if framework code changed) at the end of the refinement pass (§5; user decision,
  2026-11-11).
