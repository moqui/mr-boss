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
[document convention](design-doc-guide.md#ui-review-and-refinement-phase). Keep the current inventory, activities,
coverage, findings, decisions and bounded execution notes here. Research records references, design specifies
behavior, implementation records construction, and this file records review and refinement.

**Status: planning only, 2026-11-10 America/Chicago.** Source research is complete for this initial plan; all live
activity and mode coverage starts pending. No application behavior was changed, no review runtime was started and no
tests were run to write it. Earlier Accounting implementation results and the completed Products review inform the
plan; they do not establish Accounting review outcomes. This task does not start the review or authorize acceptance
runs.

### Inputs and reference patterns

- [Accounting design](design-accounting.md), [implementation](impl-accounting.md),
  [research](research-accounting.md) and [implementation notes](../docs/AccountingImplementation.md).
- [Products review](ui-review-products.md), [Projects review](ui-review-projects.md),
  [drawers, Commons and Comms review](ui-review-drawers-commons.md),
  [framework UI review guide](../../../../docs/dev/UI-Review.md) and
  [framework review](../../../../plans/UI-Refinement.md): activity/evidence method and established refinements.
- [Application practices](../../../../docs/dev/Practices-App-Dev.md), [style guide](style-guide.md),
  [crosscut design](design-crosscut.md), and current Manufacturing, Purchasing, Warehouse, Projects, Customer Service,
  Commerce and PASS contracts where they hand records to Accounting.
- Current `screen/Accounting.xml`, `screen/Accounting/`, mounted `screen/Shared/` sources,
  `template/Accounting*.xml`, `service/ironstone/accounting/`, `MoquiConf.xml`,
  `data/BossAccountingSetupData.xml`, `data/BossAccountingUsersDemoData.xml`, `data/BossZAccountingDemoData.xml`,
  `data/BossSetupData.xml` and the demo loader `service/ironstone/accounting/Demo.js`.
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

### Environment and fixtures

For later execution, follow the review guide and repository building/testing skills. Use an isolated runtime and
fresh disposable database with individually linked Mantle and BOSS components. The guide's framework-only bootstrap
leaves `component/` empty and needs explicit app components for this review. Include PASS only for the bounded public
handoff. Copy mutable configuration; keep database, uploaded bill/evidence files, output artifacts and captured mail
separate from working data. A different port alone does not isolate a database; cookies are not isolated by port.
Give independent browser identities separate hostnames. A component symlink still writes into the source component.

One coordinator owns runtime lifecycle and shared files. Record source/binary revisions, loaded components, actual
runtime/database paths, hostnames, listener ports, fixture setup, clock/zone and evidence directory in the first
execution batch. Check delegated agents' browser access before assigning live work. Embedded Postgres permissions,
materialized web assets and terminal availability are prerequisites to establish, not assumed Products results.
If retaining a runner-created runtime across restarts, follow the guide's whole-runtime relocation procedure.
Restore temporary grants/preferences/settings and stop review listeners when finished.

Reuse a suitable binary for XML/script work; rebuild for Rust or embedded renderer changes. Verify actual loaded
assets before diagnosing a stale page. Verify Chromium/PDF availability and inspect actual output bytes. Capture
mail locally and use synthetic gateway responses and bank files. “Sent”, “executed” or a download filename alone
does not prove delivery or a correct document. A missing provider/runtime leaves the affected branch unverified.

The main demo organization is **`BOSS_ACCT_ORG`**, outside the Zizi organization hierarchy. It enables guarded
posting and finance policies without changing Mantle's legacy demo organizations. **`BOSS_ACCT_NEWCO`** is the
startup/setup fixture; use another disposable organization for an activation that must be repeatable.
`ORG_ZIZI_SERVICES` supplies a foreign-scope starting point; cross-app fixtures, especially Manufacturing and PASS,
may belong to Retail or another organization. Match the actor's scope before interpreting a refusal as a role check.

| Fixture role | Existing starting point and purpose |
| --- | --- |
| Receivables operator | `finance.ar`: invoice, customer, collections and receivable settlement work |
| Payables operator | `finance.ap`: bills, holds, matching and payable selection |
| Match-only operator | `finance.match`: bill reads and `INVOICE_MATCH`, without AP approval/payment authority |
| Treasury operator | `finance.treasury`: payments, bank operations and execution of approved runs |
| Composed receipt operator | `finance.paymentar`: AR plus treasury; useful for a receipt workflow, not a narrow-role refusal counterpart |
| GL operator | `finance.gl`: journal/asset/valuation work and production cost preview |
| Tax operator | `finance.tax`: tax records and outputs; pair with admin for configuration requiring it |
| Financial reader | `finance.read`: financial reads without mutation authority or another business launcher |
| Independent approver | `finance.approve`: approved decisions and close/cost-post capabilities; inspect actual grants for each action |
| Finance administrator | `finance.admin`: setup and policies; can scope all internal organizations and is unsuitable as an isolation negative |
| Outsiders and neighboring-app pairs | A no-finance user, Projects billing editor, matching Purchasing user, Manufacturing cost reader/operator and external customer/supplier contact, each with the specific missing grant named |

Verify actual group permissions and organization relationships in the loaded fixture. Roles compose: one demo
user does not establish separation of drafting, approval, posting and treasury execution. Self-approval is a policy
with an audit effect, not permission inferred from a button. Pair each refusal with an otherwise-valid successful
request by a holder. Do not use ADMIN to stand in for any narrow finance role.

Prepare the minimum records needed by each wave, reusing demo data and existing fixtures after inspecting their
setup. Useful families include `BOSS_ACCT_INVOICE/BILL/PAYMENT/ENTRY/POSTED`, review/held/due/discount bills,
`BOSS_ACCT_PO_MATCH` and matching bills, bank accounts/statements, `BOSS_ACCT_CLOSE_PERIOD`, the fixed-asset examples,
`BOSS_ACCT_BILL_FREIGHT` and `BOSS_ACCT_RETURN`. Their status can change during a walk; preserve a separate baseline
and identify any scenario that consumes a fixture. Client fixture registrations are not permission to run acceptance.

Dates and financial basis need deliberate fixtures:

- Record execution date and zone. Inspect demo-loader dates rather than assuming an old due date, fiscal year,
  discount window or “last month” still exercises its intended condition. Prepare current/future/expired policies,
  overdue/current invoices, open/closed periods, an expiring exception and a boundary in two time zones.
- Prepare balanced and unbalanced drafts, missing mappings/dimensions, independent approval identities, a locked
  date, stale previews, operation retries and a second identity changing a source after preview.
- Use at least two currencies and dated rates, with source/document and base amounts distinguishable. Foreign
  currency posting exists; settlement, run and transfer support must be checked independently, not inferred from it.
- Include empty/populated/filtered lists, long and localized names, fractional and large amounts, two rows per
  repeated dialog, inaccessible/deleted records and masked account/tax identifiers.
- Use synthetic mixed-validity CSV/BAI2/OFX and bill files, duplicate imports, partial batch outcomes, declined and
  unknown gateway outcomes, and a run whose inputs change before confirmation. Prepare failures locally; do not
  exercise external delivery to create them.

### Visual and interaction review

- Review Material `/qapps` in default light/dark at **1920×1080**, with selected **1280px**, **390px**, keyboard-only
  and actual **200% browser zoom** cases. Record measured dimensions and available zoom control; Products' excluded
  or unverified variants do not automatically carry over.
- Inspect actual embedded TUI launch, theme change, tabs, pickers, row actions, dialogs, confirmations and saved
  results. JSON rendering and a browser-opened terminal helper are supporting evidence, not terminal interaction.
  Give Standard `/apps` a brief functional/output/fallback check; visual refinement targets Material.
- Use the archetype's name/key/status header, one primary action, coherent read-only layout and grouped fields.
  Keep organization, counterparty, document identity, date basis, amount/currency and debit/credit meaning visible.
  Distinguish draft, approval, posting, payment, clearing and reconciliation states.
- Apply the guide's contrast criteria to composited backgrounds: ordinary text **4.5:1**, qualifying large text
  **3:1**, meaningful controls/states **3:1**. Inspect money, negative balances, chips, disabled fields, focus and
  validation in both themes; status and reconciliation difference cannot depend on color alone.
- Follow finds through saved-find create/update/default/reset, supported sorting/views/columns, pagination,
  selection, detail and Back. Organization or counterparty changes clear stale dependent selections. Export the
  scope the UI actually offers; do not presume selected-only exports exist.
- Exercise native typing, blur/change, Enter/Escape, accessible names, tab order and focus return. Reopen dialogs
  on two different rows after reload to prove record identity. Large/localized numbers must reopen as valid edit
  values; currency precision, zero, blank, unavailable and restricted values remain distinct.
- Failed saves retain the draft and identify correction; cancel leaves persisted state unchanged. Preview/review
  names the operation, organization, source version, date, selected documents and totals. Changing inputs, grants,
  mappings, rates or locks invalidates stale review. Reload/retry preserves the intended operation identity.
- Only explicit confirmation resumes the original action. Recheck the target after navigation or a late response;
  a confirmation for one invoice, statement, run or organization cannot apply to another. Check resumed execution
  separately from a fresh request.
- Inspect balanced postings, applications, remaining amounts, evidence and linked reversals after financial actions.
  Bulk work names each independent failure while successful documents remain usable. A single posting, allocation,
  paired transfer or document-and-ledger transaction remains atomic.
- Distinguish no data, no matches, no permission, missing basis and failed loading. A failed Home/report source is
  unavailable with a named reason; unrelated sources continue. Card counts, drill-through filters and report totals
  agree without silently adding incompatible currencies.
- Inspect CSV/XLSX/PDF/HTML/bank-file bytes, page breaks, repeated headers, Unicode, rounding, masked values and scope.
  A journal summary and an issued invoice are different output contracts. Tax exports and bank files remain local.
- Inspect Accounting's shell search, quick create, Today, approvals and notification returns in context. It declares
  no Accounting-specific Assist prompt; generic page context is not a finance-action integration.

### Waves

| Wave | Activities | Focus |
| --- | --- | --- |
| 1. Establish the finance workday | ACC-01–06 | Scope, setup, chart/periods, journal, defaults and currency basis |
| 2. Invoice and collect receipts | ACC-07–10 | Invoice lifecycle, source billing/outputs, settlement and payments |
| 3. Review and pay suppliers | ACC-11–14 | Bills/holds, matching, payable settlement and payment runs |
| 4. Reconcile cash | ACC-15–17 | Statement intake, rules, reconciliation, deposits and stored value/transfers |
| 5. Follow up receivables | ACC-18–20 | Collections/credit, dunning and recurring drafts |
| 6. Close and explain the books | ACC-21–27 | Locks/close, assets, inventory/production costs, tax, budgets and reports |
| 7. Reconcile handoffs and remaining variants | ACC-28–32 and open continuations | Returns, evidence, PASS, permissions, other mounts and modes |

Establish positive/negative permission pairs from Wave 1. Run evidence/file and boundary inspections throughout,
not only in Wave 7. Important continuations: defaults/rates → invoice and journal posting; invoices/bills →
settlement → payments → bank reconciliation; matches/holds → payment eligibility; collections/recurrence → invoices;
asset/stock/production postings → reports and close blockers; budgets → bill/source commitments; return credits →
settlement/refund; public payment/upload → the corresponding internal record. Close ACC-21 only after its selected
blocker-resolution continuations have been observed. Record incomplete branches in the originating ledger row.

Each later authorized batch follows observe → prioritize → refine → rerun affected activities → compare evidence
→ verify → update this record. Start with ACC-01 and a disposable ACC-04/07 path to establish browser/TUI and record
identity baselines. Delegate bounded activities only after checking tools and identity isolation; serialize shared
settings, fiscal locks, fixture mutations and runtime lifecycle.

## 3. Screen and surface inventory

Routes are relative to `/qapps/`. **B** means this component's `screen/`. Append a local name to its directory for
the route and `.xml` for its source. There are **134 local XML definitions**: `Accounting.xml` and 133 below
`Accounting/`. There is **no local Accounting QVue or TUI JSON file**; authored inline render sections, shared QVue
surfaces and helper routes still require mode-specific inspection. Physical child sources do not establish access.

### Local routes

| Route prefix / source directory | XML definitions | Activities |
| --- | --- | --- |
| root | `Accounting` | ACC-01, 31–32 |
| `Accounting/` | `Home` | ACC-01, 02, 18, 21, 24 |
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
| `Accounting/PeriodClose/` | `Periods`, `PeriodCloseDetail`, `PeriodLocks`, `PeriodRuns` | ACC-03, 21–24 |
| `Accounting/FixedAssets/` | `FixedAssets`, `AssetClasses`, `DepreciationRunDetail` | ACC-22 |
| `Accounting/Tax/` | `TaxAuthorities`, `TaxRates`, `TaxStatements`, `TaxStatementDetail` | ACC-25 |
| `Accounting/Budgets/` | `Budgets`, `BudgetDetail`, `BudgetControls` | ACC-26 |
| `Accounting/Reports/` | `Reports`, `TrialBalance`, `GeneralLedger`, `PartnerLedger`, `BalanceSheet`, `IncomeStatement`, `CashFlow`, `RetainedEarnings`, `FinancialRatios`, `AccountBalance`, `PostedSummary`, `Aging`, `InvoiceReconciliation`, `BudgetVariance`, `SalesAnalysis`, `StockTransactions` | ACC-27; specific consumers in 04, 18, 21, 23, 26 |
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
| Records / Approvals | OrderDetail / Notifications | ACC-11, 14, 18, 28, 31 |
| InvoiceDetail / BillDetail / PaymentDetail | Overview | ACC-07, 10–11 |
| Payables/Supplier360 / Receivables/Customer360 | Bills / Contact | ACC-11, 18, 28–29 |
| Settings/Setup | Basis | ACC-02 |

The following routes mount existing sources. Accounting's document tabs and finance boxes are not the same tab
set as Products, Purchasing or Manufacturing even where the parent XML is shared.

| Route under `Accounting/` | Source under B | Activities / context |
| --- | --- | --- |
| `Chatter`, `Chatter/ChatterTui` | `Shared/Chatter.xml`, its terminal helper | ACC-29, 31–32 |
| `RecordFiles`, `RecordFiles/RecordFilesTui` | `Shared/RecordFiles.xml`, its terminal helper | ACC-29, 31–32 |
| `Approvals/Notifications` | `Commons/Notifications.xml` | ACC-11, 14, 18, 31; source document makes the decision |
| `Receivables/Customer360` | `Shared/Customer360.xml` and admitted children | ACC-07–09, 18, 28–29 |
| `Payables/BillDetail/Match` | `Shared/InvoiceMatch.xml` | ACC-12 |
| `Payables/BillDetail/{Items,Orders,Shipments,Payments,GeneralLedger,Budget,Files,History}` | Matching `Accounting/Receivables/InvoiceDetail/*.xml` | ACC-11–13, 26, 28–29; Shipments labelled Receipts; local Overview/Holds retained; Conversation is not mounted |
| `FixedAssets/EquipmentDetail` | `Shared/EquipmentDetail.xml` | ACC-22; Accounting asset-book presentation |
| `Inventory/InventoryValuation` | `Shared/InventoryValuation.xml`, `template/AccountingInventory.xml` | ACC-23 |
| `Inventory/ProductionCostClose` | `Shared/ProductionCostClose.xml` | ACC-24; also mounted as `Manufacturing/WorkOrders/WorkOrderDetail/CostClose` |
| `Records/OrderDetail`, `Records/ShipmentDetail`, `Records/ReturnDetail` | Matching `Shared/*.xml`, Accounting context/templates | ACC-08, 11–12, 18, 28, 30 |
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

Retest shared corrections through a representative second consumer: Purchasing for matching, Manufacturing for cost
close/equipment, Warehouse for shipment/return/valuation, Customer Service for Customer360, Products for Product360,
or another authorized Commons record for files/Chatter. Choose the consumer for the behavior actually changed.

Hidden review/output routes are first-class supporting surfaces: InvoiceBatch; both SettlementReview routes;
PaymentDetail/Review; TransferReview; InvoicePrint, BillPrint, StatementPrint and PaymentPrint; quick-create screens;
setup steps; shared choice transitions and upload/download endpoints. Inspect their access and context directly as
well as through the normal entry action. A review URL must not bypass the preview's permission or source check.

Use actual record parameters when preserving context: `recordId` on the generic invoice/bill/payment/journal detail
wrappers; `paymentMethodId` on BankAccountDetail; `statementImportId` plus `paymentMethodId` on StatementImport;
`bankReconciliationId` on ReconciliationDetail; `finAccountId` on FinancialAccountDetail; `paymentRunId` on
PaymentRunDetail; `timePeriodId` on PeriodCloseDetail; `periodRunId` on PeriodRuns/DepreciationRunDetail;
`workEffortId` on ProductionCostClose. Carry `organizationPartyId` where declared. Read each route's current
parameters before constructing direct checks; shared record routes also accept their native record keys.

### Custom modes, outputs and embedded surfaces

| Surface | Supporting inspection | Activities |
| --- | --- | --- |
| Shared document layouts | `AccountingDocuments.xml`, `AccountingPayments.xml`; header, draft dialog, tabs, statuses, phone columns and selected-record actions | ACC-07–14 |
| Organization, choices and reports | `AccountingParts.xml`, `AccountingReportParts.xml`, `AccountingReports.xml`; selection labels outside the current page, dependent choices, scope/date/dimension continuity | ACC-01–06, 27, 31 |
| Settlement review | `AccountingWorkbench.xml` and each side's SettlementReview; draft selection, fingerprint and operation identity through navigation/reload | ACC-09, 13 |
| Treasury reviews | PaymentDetail/Review and TransferReview; pending gateway outcome, confirmation, unchanged retry and applications | ACC-10, 17 |
| Wizards and long forms | Setup's five physical steps; staged imports, run details and close/depreciation reviews on their actual routes; do not invent child routes for design step names | ACC-02, 14–16, 21–22 |
| Issued documents | InvoicePrint/BillPrint, invoice batch output, StatementPrint, PaymentPrint (receipt/detail/check), captured emails and attachments | ACC-07–08, 10–11, 14 |
| Bank outputs | Run-file generation/download and return import; deposit slip; bank/stored-value screen print where offered | ACC-14, 16–17 |
| Record/report print | Journal, close, depreciation, reconciliation, stored-value and tax detail print; report `html-print`, CSV/XLSX where offered | ACC-04, 16–17, 21–22, 25, 27 |
| Financial custom cells | Inline qvt/tui status, amount, comparison, findings and action sections; inspect authored twins rather than inferring parity from XML | Respective activities, ACC-32 |
| Chatter/files | Shared QVue and terminal helpers, authorized original/issued bytes, upload/read-only states and history | ACC-29 |
| Shell | Four quick creates; Finance records palette plus MantleInvoice/Payment/GlAccount/AcctgTrans types; `g j`, `g a`; Accounting Today; CreditHoldRelease, RecurringInvoiceFailed and ProductionCostReview topics | ACC-01, 04, 07, 10–11, 18, 20, 24 |
| Adjacent entry points | Insights Accounting reports, DraftEntries/PostedEntries/BillsAwaitingApproval/BillsOnHold/CostClose attention; Admin currencies, payment terms and tax settings entries | ACC-05–06, 24–25, 27, 32 |

### Design-to-code reconciliation

| Design or historical item | Current review disposition |
| --- | --- |
| ProductionCostClose/CostingPolicies deferred in Accounting design/impl | Built by Manufacturing; include queue, preview/post/return, later adjustment, effective policy and close blockers. Current Mantle data adds production-WIP and cost-close checks |
| Shared contexts described as Accounting-only or future | Neighboring apps now consume many of these screens. Inspect the current context and a relevant second consumer; do not restore old assumptions |
| Supplier360 described as one shared supplier screen | Accounting has its own Supplier360 and tabs. Shared Supplier360's buying/catalog actions are not Accounting features |
| “All screens XML” | True for local files; shared Chatter/RecordFiles use QVue and terminal helpers. Inline render variants and shared inherited children remain in scope |
| Foreign-currency posting described as P20/future in older notes | Posting and rate proposals are built. Do not infer foreign-currency support for settlement, payment runs, transfers, landed cost, exposure or every report |
| AdvancedPeriodRun, Leases, RevenueRecognition, Intercompany, ElectronicInvoices | Unmounted future work; keep out of completion criteria and menus |
| Chargeback action / real hosted gateway / bank feeds / filing | Do not manufacture a working action from a design paragraph. Review built gateway/refund/return contracts and synthetic outcomes; external integrations and country packs are separate |
| Depreciation/run reversal, landed-cost/revaluation reversal, finished-statement reopen and additional statement formats | Historical deferrals require a current service/control check before a variant is scheduled; absence is a capability limit, not permission to implement it |
| Older reports, print and setup descriptions | Check actual output controls, conversion basis, known limitations and wizard confirmation. Do not treat “printed record” as a new period snapshot or regulatory form |
| AccountingImplementation's old spec list and “No route fixtures” | Use current suite registrations and fixtures in §5; historical pass totals do not establish live coverage |

## 4. End-to-end activities

The §6 ledger records status and evidence. Use visible controls and inspect intermediate states, confirmations,
persisted outcomes and a second identity where relevant. A render, HTTP 200 or direct service mutation does not
complete an activity. Browser means Material light/dark; TUI means actual supported terminal actions; Standard means
the brief functional/output/fallback check in §2. Sample relevant narrow/keyboard/zoom variants, and record the rest
explicitly. Missing features and unsupported operations remain capability limits, not inferred passes.

### ACC-01 — Start a finance workday in the right organization

- **Actor/start:** financial reader and narrow operators, with populated, empty and multi-organization fixtures.
- **Objective/steps:** open Accounting → select organization → follow permitted Home cards and My finance work →
  filtered list → record → Back; inspect setup callout, approval tray, Today, finance palette and `g j`/`g a`;
  open/cancel/reopen each permitted quick create. Follow a main find through saved filters, paging, columns,
  supported views, reset and actual offered exports.
- **Expected:** current organization and basis are clear; cards and destination rows agree; read-only navigation
  stays useful; default routes and menu order are predictable; New never inherits a previously viewed record ID.
- **Recovery:** no organization, no matches, inaccessible recent record, missing period, one failed aggregate,
  multi-currency cash exclusions and changed active organization. Unavailable is not zero and unrelated cards load.
- **Screens/modes:** Home, section defaults, QuickCreate, shell and representative finds; browser/TUI/Standard,
  narrow/keyboard/zoom samples. Findings about individual records continue in their owning activities.

### ACC-02 — Establish and activate a new set of books

- **Actor/start:** finance administrator in a disposable unactivated organization; reader as counterpart.
- **Objective/steps:** Home/Settings → Setup/Basis → choose chart, base currency, fiscal/costing basis and opening day
  → OpeningBalances add/edit/import → OpenItems validate/import → Readiness follow Fix links → return → Activate
  review/confirmation → inspect opening entry and activated state. Leave and resume between steps.
- **Expected:** wizard controls save the intended step; totals and receivable/payable open items tie to the opening
  accounts; the same activation retry returns the recorded outcome once; record links retain the startup scope.
- **Recovery:** unbalanced/missing mappings, mixed valid/invalid CSV, duplicate import, stale run, navigation with an
  unsaved field, canceled activation and lost permission. Posted basis changes are refused. Record the existing
  inventory/WIP/asset opening-tie limitations without inventing extra setup functionality.
- **Screens/modes:** all five Setup steps, Settings, Home and opening JournalEntryDetail; browser/TUI/Standard,
  keyboard and long-form/narrow samples. File upload delegation must be explicit in terminal.

### ACC-03 — Maintain a usable chart and fiscal structure

- **Actor/start:** GL operator, finance administrator and reader; global accounts with separate organization assignments.
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

- **Actor/start:** GL operator with a balanced draft, unbalanced draft and independent failed batch member; reader.
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

- **Actor/start:** finance administrator and narrow operator; separate organization and captured prior settings.
- **Objective/steps:** Settings → AccountingPreferences, PostingDefaults, PaymentTerms, PaymentMethods and
  DocumentSettings → change one effective default at a time → reload → create a consuming draft/output → restore.
  Inspect mapping readiness/fix links, clone preview/conflicts where offered, term portions/discounts, numbering,
  approved layouts, masked methods and allowed gateway bindings.
- **Expected:** labels explain operational effect; checkbox values persist; inherited versus local settings are
  clear; the consumer uses the effective value; issued numbers/documents and posted basis are unchanged. Finance
  sees permitted gateway metadata, not secrets or executable configuration.
- **Recovery:** invalid accounts/percentages, stale clone/configuration, canceled apply, inactive gateway binding,
  posted-basis change refusal and long/localized edit values. Record settings that require a future consumer sample.
- **Screens/modes:** Settings and its six overview/configuration pages, Supplier360/Terms, consumer dialogs/output;
  browser/TUI/Standard, keyboard and long-form/narrow samples. Specialized policies continue in ACC-12/18/24/26.

### ACC-06 — Review exchange rates and explain converted postings

- **Actor/start:** finance administrator, GL/AR operator and reader; base and foreign currency with dated rates.
- **Objective/steps:** Currencies → add/import rates → inspect valid/rejected rows → propose rates using a local
  provider-file sample → accept/reject selected proposals → create a supported foreign-currency invoice/journal →
  inspect source amount, stored rate/date and base posting → follow ledger/report drill.
- **Expected:** rate direction, effective date, source and currency precision are explicit; accepted proposals are
  distinct from unaccepted ones; display arithmetic reconciles to stored accounting amounts and original currency.
- **Recovery:** missing/zero/negative/duplicate rate, mixed-invalid import, stale proposal, canceled acceptance and
  provider unavailable. A changed later rate does not silently restate posted history. Record unsupported foreign
  workbench/run/transfer variants as limits and preserve their named refusal.
- **Screens/modes:** Currencies, AccountingPreferences, document/journal detail and Reports; browser/TUI/Standard,
  date-zone boundary and actual CSV/output checks. No live rate-provider dependency is required for the fixture.

### ACC-07 — Create, finalize and issue a customer invoice

- **Actor/start:** AR operator and reader; customer, product/service, terms and tax setup with a separate approver
  where required.
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

- **Actor/start:** authorized AR/AP billing operator with approved project/worker items and source orders; AR sender.
- **Objective/steps:** BillingQueue → select eligible time/expenses → create invoice/bill → inspect source links and
  billed state; select invoices → InvoiceBatch → review action/recipients → process → inspect each outcome and
  downloaded CSV/PDF; Statements → customer/as-of/currency options → preview → local send/output.
- **Expected:** the source is billed once within the operator's access; batch selection and source versions survive
  review; failures name the invoice/recipient without losing independent successes; statement balance and currency
  match its open items. Output scope is the explicit selection, not an inherited page selection.
- **Recovery:** already-billed/changed source, unauthorized project/worker, one invalid recipient, stale batch,
  canceled action, empty statement, unavailable PDF and retry after partial completion. Check output pagination and
  fixed filters rather than equating a successful download with complete records.
- **Screens/modes:** BillingQueue, Records/OrderDetail, InvoiceBatch, Statements, StatementPrint and resulting detail;
  browser/TUI/Standard, selection/keyboard and actual captured documents.

### ACC-09 — Apply a receipt and credit to customer open items

- **Actor/start:** AR operator, with treasury composition only where the chosen action needs it; partial receipt,
  credit and multiple customer invoices.
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

- **Actor/start:** treasury operator, AR read-only payment counterpart and independent reviewer as required;
  disposable manual receipt and synthetic gateway-approved/declined/pending cases.
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

- **Actor/start:** AP operator, match-only reader, separate hold releaser/approver and supplier with approved order
  and accepted receipt; expense bill fixture.
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

- **Actor/start:** AP or match-only operator, separate hold releaser, reader; received-basis and price-exception bills.
- **Objective/steps:** BillDetail/Match → inspect order/receipt candidates → enter quantities → evaluate → apply →
  inspect evidence and exceptions/hold → resolve with the authorized actor → re-evaluate/unapply where offered.
  Inspect effective MatchPolicies and a LegacyMatches preview/apply with ambiguous and unsupported lines.
- **Expected:** ordered/received/accepted/billed quantities, units and tolerances are readable; applying evidence is
  distinct from releasing a hold; source changes make review stale; legacy backfill names independent bill outcomes.
- **Recovery:** overmatch, price variance, wrong supplier/order, changed acceptance, stale selection, canceled apply,
  ambiguous legacy evidence and revoked match permission. Record any currently unsupported tax/service/return-credit
  rule without expanding it as part of UI review.
- **Screens/modes:** Shared InvoiceMatch through BillDetail, Holds, LegacyMatches, MatchPolicies and source links;
  browser/TUI/Standard, keyboard/phone sequential-list behavior and a Purchasing counterpart for shared fixes.

### ACC-13 — Apply supplier advances and credits to open bills

- **Actor/start:** AP/treasury holder for the relevant operation, with supplier advance, credit, due bill and held bill.
- **Objective/steps:** Supplier360 → PayablesWorkbench → choose supplier/currency/date → select credits/payments and
  bills → enter allocations → SettlementReview → back/reload → confirm → inspect applications and bill balances.
- **Expected:** payable direction is retained through the shared workbench; discounts, due schedules and hold reasons
  remain visible; supplier advances and credits are not confused with a new disbursement; unchanged retry is stable.
- **Recovery:** held/ineligible bill, stale due amount, over-allocation, unsupported currency combination, another
  supplier's review, canceled confirmation and missing permission. Preserve draft selections after correction.
- **Screens/modes:** PayablesWorkbench, SettlementReview, Supplier360/Bills, BillDetail/Payments and payment result;
  browser/TUI/Standard. Compare the shared layout with ACC-09 without repeating its complete role matrix.

### ACC-14 — Propose, approve and execute a supplier payment run

- **Actor/start:** AP proposer → independent approver → treasury executor; due, discounted, held and excluded bills.
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

- **Actor/start:** treasury operator and financial reader; permitted bank account and synthetic CSV/BAI2/OFX files.
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

- **Actor/start:** treasury operator with imported lines, receipts, an unmatched line and a draft statement session.
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

- **Actor/start:** treasury operator and reader; two organization-owned payment methods, fee counterparty and a
  permitted stored-value account.
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

- **Actor/start:** AR collector, independent credit approver and reader; overdue invoices, promise and held order.
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

- **Actor/start:** AR operator with permitted recipients, disputed/ineligible invoices and captured local mail.
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

- **Actor/start:** authorized invoice-schedule operator; invoice template and monitored recurring-order examples.
- **Objective/steps:** RecurringInvoices → create invoice-only schedule → inspect next-period preview → Make draft
  now → inspect source/period and draft invoice → repeat/resume → pause/resume/end a separate disposable schedule;
  inspect recurring orders' last copy and job result without executing an unrelated scheduler.
- **Expected:** invoice schedule and recurring sales order are distinguishable; displayed dates and generated period
  agree; retry does not duplicate a period; draft generation does not imply automatic send or a gateway charge.
- **Recovery:** missing/changed template, invalid cadence, already-generated period, failed period, canceled end and
  no authority. Named failures link to correction and the same schedule can resume where supported.
- **Screens/modes:** RecurringInvoices, InvoiceDetail, Today/RecurringInvoiceFailed return; browser/TUI/Standard and
  date-zone boundary samples. Verify current AP entry/access instead of assuming a Payables menu route exists.

### ACC-21 — Resolve close blockers and protect a closed period

- **Actor/start:** GL investigator, independent close approver and finance administrator; ended open period with
  known draft, reconciliation, valuation and production blockers.
- **Objective/steps:** Periods → PeriodCloseDetail → inspect checklist/evidence → follow each selected Fix link →
  resolve through its owning activity → return/rerun → inspect TrialBalance/InvoiceReconciliation/PeriodRuns →
  confirm close → reload history/print → inspect authorized reopen. Separately configure a typed soft lock and
  bounded exception, and demonstrate a hard-lock refusal on a disposable journal.
- **Expected:** blocker counts and resolving records agree; only authorized links appear; period/date scope survives
  navigation; close/exception/reopen records identify actor/reason. Closed summaries and live open-period amounts are
  explained. Production WIP and cost-close checks reflect current Mantle registrations.
- **Recovery:** unresolved/new blocker, failed independent check, stale run, expired exception, wrong lock scope,
  canceled close/reopen and post on locked date. A failed close must not falsely mark a period closed.
- **Screens/modes:** Periods, PeriodCloseDetail, PeriodLocks, PeriodRuns, report and resolving record routes;
  browser/TUI/Standard. Advanced FX/deferral runs and absent reversal variants stay outside completion criteria.

### ACC-22 — Capitalize an asset and post a depreciation run

- **Actor/start:** finance administrator for classes, GL operator for book work and separate approver where required;
  uncapitalized, in-service, disposed and deliberately incomplete assets.
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

- **Actor/start:** GL operator, financial reader and separate finance administrator; receipts with on-hand/issued
  portions, approved freight bill and an approved product standard for revaluation.
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

- **Actor/start:** GL previewer and independent `PRODUCTION_COST_POST` holder in the run's organization; Manufacturing
  review request, completed run and a previously closed run with a later adjustment.
- **Objective/steps:** Home/notification/queue → ProductionCostClose → inspect source events, components, overhead,
  scrap, co-product allocation, variance and proposed ledger → return to production with reason → inspect corrected
  review → confirm cost close → verify allocations, ledger and closed work order. Inspect a later adjustment and
  dated CostingPolicies without rewriting the prior applied policy.
- **Expected:** operational completion, financial review and cost close are distinct; preview/post roles differ;
  the shown fingerprint binds all cost inputs; post balances and closes once, while an adjustment preserves history.
- **Recovery:** missing inputs/mappings, stale source/policy, open WIP, wrong organization, canceled post/return,
  retry and GL-only post refusal. Queue/read failures must not appear as “no work”.
- **Screens/modes:** Inventory/ProductionCostClose, Settings/CostingPolicies, Home, PeriodCloseDetail and
  Manufacturing/WorkOrders/WorkOrderDetail/CostClose; browser/TUI/Standard. Prepare operational facts as fixtures;
  this is not another full production execution review.

### ACC-25 — Maintain tax inputs and inspect a retained statement

- **Actor/start:** tax operator, finance administrator for configuration and AR counterpart; dated local rates,
  taxable invoice and suppliers with valid/missing taxpayer information.
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

- **Actor/start:** GL budget editor, independent approver, budget override holder and reader; a draft budget, an
  approved budget to revise and a source transaction that crosses a warning/stop limit.
- **Objective/steps:** Budgets → BudgetDetail → edit draft account/period amounts and parties → approve budget →
  change approved amounts with a revision reason → inspect the retained revision/PDF → BudgetControls → inspect a
  permitted source's commitment → warning/stop/override
  handoff → convert/release through the owning source action → BudgetVariance drill and invoice Budget tab.
- **Expected:** draft budget, approved amounts and retained revisions are distinct; saving approved amounts creates
  their revision directly, without an invented second approval step. Actual, committed and available amounts
  reconcile; override records authority/reason; historical revision output remains stable; source links preserve
  organization and period.
- **Recovery:** unbalanced/invalid allocation where constrained, stale approval, duplicate commitment, canceled
  override, unsupported dimension and denied source. Inspect existing Purchasing integration without expanding its
  workflow or silently choosing an ambiguous overlapping budget.
- **Screens/modes:** Budgets, BudgetDetail, BudgetControls, BudgetVariance, invoice/bill Budget tabs and bounded
  Purchasing/Projects handoff; browser/TUI/Standard with row/period editing and retained PDF bytes.

### ACC-27 — Explain a financial result from report to source

- **Actor/start:** financial reader and narrower document readers; known postings, open/closed periods, zero values,
  comparison period and incomplete-data fixture.
- **Objective/steps:** Reports catalog → choose organization/date/period/currency/dimensions/comparison → read result
  → drill account/month/party/product/source → inspect record → Back with options intact → export and print. Cover
  each named report in the inventory with the question it answers: trial balance/GL/partner movement; balance sheet,
  income/cash/retained earnings/ratios; account series/posted summary; aging/reconciliation; budget variance; sales and
  stock movements. Reuse earlier activity receipts for their report branches.
- **Expected:** totals tie to controlled fixtures, conversions and as-of basis are named, comparisons use matching
  scope, zero denominators say unavailable, and restricted sources do not leak through drills or bytes. Exported
  rows reflect the advertised full/filtered scope and do not silently stop at a visible page.
- **Recovery:** empty/no-match result, absent period/rate, failed source, restricted drill, invalid comparison,
  changed organization and unavailable PDF. Incomplete reports name their limitations instead of asserting a full tie.
- **Screens/modes:** all 16 Reports definitions plus output/drill destinations; browser/TUI/Standard, narrow,
  keyboard/zoom and multipage output. This is planned manual coverage, not a new regression render sweep.

### ACC-28 — Follow operational evidence and settle a return

- **Actor/start:** AR/AP and reader, with separate receiptless-credit authority where needed; owned order, shipment,
  product, customer and a return partly received/accepted.
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
  browser/TUI/Standard and bounded Warehouse/Purchasing/Customer Service/Commerce counterpart.

### ACC-29 — Keep evidence and discussion attached to the right record

- **Actor/start:** permitted document/payment/journal editor, reader and another organization's non-holder;
  ordinary supporting file plus immutable issued invoice/payment evidence.
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

- **Actor/start:** internal AR/AP operator and scoped external customer/supplier contact or single-record token,
  using local published PASS Billing/Supplier sites, captured mail and test gateway.
- **Objective/steps:** issue invoice with pay link → authorized external InvoicePay → synthetic payment outcome →
  return to Accounting invoice/payment; approved purchase OrderDetail → supplier bill link → scoped BillUpload →
  return to Bills intake, file and source order. Inspect current links, not hard-coded demo tokens.
- **Expected:** external access needs its own relationship/capability, not a BOSS group; payer/upload may reach only
  the named records; internal balances/intake reflect the same outcome; token/recipient details stay out of evidence
  committed to the repository.
- **Recovery:** expired/revoked/wrong-party token, unavailable site/gateway, duplicate submission, declined/pending
  payment and invalid file. Missing published host/runtime is a blocked handoff, not a failed Accounting screen.
- **Screens/modes:** Accounting InvoiceDetail/Records/OrderDetail/Bills and PASS Billing/InvoicePay/Supplier/BillUpload;
  browser at desktop/390px. PASS has no implied TUI requirement; review only this handoff, not its whole public suite.

### ACC-31 — Reconcile permission, organization and context boundaries

- **Actor/start:** each required narrow holder/non-holder pair, foreign organization, same record after grant
  revocation, composed actor, and administrator with active scope narrowed.
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

- **Actor/start:** Accounting-only reader/operator and explicit neighboring-app holder, with scoped records and
  remaining mode/recovery gaps from earlier activities.
- **Objective/steps:** enter from Insights report/attention or Admin settings → retain organization/filter context →
  complete the permitted finance step → return with one Back; inspect Products standard → valuation, Manufacturing
  cost review → finance, Purchasing match/budget → AP, Projects billing → invoice and Warehouse facts → source ledger
  using the receipts from their owning activities. Revisit changed shared surfaces in a second consumer.
- **Expected:** links choose the current mount and preserve record context; unavailable adjacent apps explain limits;
  shell/tray navigation works in terminal; light/dark, phone, keyboard, zoom, Standard and output gaps are explicitly
  reconciled rather than inherited from a browser or service pass.
- **Recovery:** cold cross-app navigation, missing launcher despite a valid business permission, deleted/inaccessible
  linked record, stale asynchronous response, failed provider and interrupted confirmation.
- **Screens/modes:** shared mounts, shell providers, report/settings entries and outstanding variants; actual browser/
  TUI/Standard as applicable. Record unsupported/tool-blocked variants without claiming their outcomes.

## 5. Existing checks and future verification

This is an available-test map, not a passing-results ledger. Paths are relative to the named component and spec
names omit `.spec.js`. Read current assertions before selecting a run; historic breadth is not a reason to
duplicate business rules, renders or journeys.

| Component / suite | Existing specs | Activities / limits |
| --- | --- | --- |
| mr-boss regression `test/Accounting/` | AccountingAccess | ACC-01–06, 28, 30–31; app access, valid positive/negative cases, scope and choice rules; not a live role walk |
| mr-boss regression `test/Accounting/` | AccountingClientFixtures | Browser theme assets; fixture setup is not review evidence |
| mr-boss regression `test/Accounting/` | AccountingReceivables, AccountingSettlement | ACC-07–09, 13; documents/batches/statements, retained settlement review and results |
| mr-boss regression `test/Accounting/` | AccountingPayments, AccountingPaymentGateway, AccountingPaymentRefunds, AccountingPaymentTransfers | ACC-10, 17; draft/lifecycle/review identity, gateway/refund/transfer contracts |
| mr-boss regression `test/Accounting/` | AccountingPaymentFiles, AccountingIssuedFiles, AccountingOutputs | ACC-07–11, 17, 21, 29, 31; immutable issued bytes, scope/counts and authorized print content |
| mr-boss regression `test/Accounting/` | AccountingPayables, AccountingMatching, AccountingPaymentRuns | ACC-11–14; hold/approval/match, supplier settlement and interrupted execution |
| mr-boss regression `test/Accounting/` | AccountingBanking, AccountingCollections | ACC-15–20; import/reconciliation/stored value, reminder outcomes, credit and recurring context |
| mr-boss regression `test/Accounting/` | AccountingPeriodClose, AccountingFixedAssets, AccountingValuation, AccountingProductionCostClose | ACC-21–24; blockers, per-asset outcomes, valuation/landed cost, queue/policy/cost-close roles |
| mr-boss regression `test/Accounting/` | AccountingTax, AccountingBudgets, AccountingReporting | ACC-25–27; tax context/output, budget revisions/commitments, report/print/drill and Home |
| mr-boss regression `test/client/Accounting/` | AccountingReceivablesWalk | Existing single golden path: AR create/finalize/send invoice without a store; reuse it |
| mr-boss acceptance `acceptance/Accounting/` | AccountingScreens | Existing current-route/mounted-fixture sweep in qvt/tui plus selected output checks; not browser or terminal interaction |
| mr-boss acceptance `acceptance/Accounting/` | AccountingAccessWalk, AccountingServerStatic | Existing access/isolation/output matrix and static-render contracts; both are acceptance regardless of old command comments |
| mr-boss acceptance `acceptance/client/Accounting/` | AccountingLedgerWalk, AccountingSettingsWalk, AccountingSetupWalk, AccountingCurrencyWalk | ACC-02–06 |
| mr-boss acceptance `acceptance/client/Accounting/` | AccountingSettlementWalk, AccountingPaymentsWalk, AccountingPaymentGatewayWalk | ACC-09–10; retained review/retry, manual payment and test gateway |
| mr-boss acceptance `acceptance/client/Accounting/` | AccountingPayablesWalk, AccountingMatchingWalk, AccountingPaymentRunsWalk | ACC-11–14; existing AP → approver → treasury handoffs |
| mr-boss acceptance `acceptance/client/Accounting/` | AccountingBankingWalk, AccountingCollectionsWalk | ACC-15–19; bank import/reconcile/deposit and contact/reminder/credit release |
| mr-boss acceptance `acceptance/client/Accounting/` | AccountingCloseWalk, AccountingFixedAssetsWalk, AccountingValuationWalk | ACC-21–23 |
| mr-boss acceptance `acceptance/client/Accounting/` | AccountingTaxWalk, AccountingBudgetsWalk, AccountingReportsWalk, AccountingReturnsWalk | ACC-25–28 |
| mr-boss regression `test/Shared/`, `test/Commons/` | Chatter, RecordFiles; QuickCreate, TodayPanel, Notifications | ACC-01, 29, 32; affected shared checks, not a repeat Commons review |
| mr-boss acceptance root | AppStructure, ServerStatic, TuiRender | Existing broad structure/render checks; reconcile overlap before modifying Accounting's sweep |
| mr-mantle regression `test/ledger/` | AccountingApplicationRules, AccountingControls, AccountingBookDates, AccountingFiscalPeriodDays, AccountingSetup, AccountingCurrency | ACC-02–06, 21, 31; owning financial rules |
| mr-mantle regression `test/ledger/` | AccountingReceivables, AccountingPaymentCorrections, AccountingReports, AccountingActivities, AccountingProjectCost, FinancialReports | ACC-07–10, 18, 27–28 |
| mr-mantle regression `test/ledger/` | AccountingPeriodClose, AccountingFixedAssets, AccountingValuation, ProductionCostClose, ReceiptAdjustments, LedgerMaintenance | ACC-21–24 and protected history |
| mr-mantle regression `test/account/` | AccountingSettlement, AccountingSettlementConcurrency, AccountingPaymentLifecycle, AccountingPaymentGateway, AccountingPaymentRefunds, AccountingInternalTransfers | ACC-09–10, 13, 17 |
| mr-mantle regression `test/account/` | AccountingPaymentOutput, AccountingPaymentNotifications, AccountingDelivery | ACC-07–10, 14, 29 |
| mr-mantle regression `test/account/` | AccountingPayables, AccountingMatching, AccountingPaymentRuns, AccountingPaymentRunControls, AccountingBankReconciliation, AccountingTermDueDays | ACC-05, 11–16 |
| mr-mantle regression `test/account/` | AccountingCollections, AccountingCredit, AccountingCustomerFinance, AccountingRecurringAging, AccountingPortals | ACC-18–20, 30 |
| mr-mantle regression `test/other/`, `test/order/`, `test/sales/` | AccountingTax, AccountingBudgets, BudgetServices; AccountingReturns; AccountingStatements | ACC-08, 25–28 |
| webroot regression `test/client/` | WebrootVue.qvt, WebrootVue.qvt.shell, WebrootVue.qvt.layout, WebrootVue.qvt.records, WebrootVue.qvt.static, WebrootVue.qvt.views, WebrootTerminal, QvtKeys, Keys | Only for affected shared-widget/shell/renderer behavior |
| webroot acceptance `acceptance/client/` | ThemeLayout | Existing reusable theme/geometry coverage; no implied authorization to run it |

There are **23 Accounting server regression specs**, **one Accounting browser regression golden path**, **three
Accounting server acceptance specs** and **19 registered Accounting browser acceptance walks**.
`test/client/suite.js` registers AccountingReceivablesWalk and AccountingClientFixtures with captured mail;
`acceptance/client/suite.js` registers the other walks and broader setup. Inspect selected dependencies before a run.
`test/Accounting/AccountingSpecLib.js` is the shared identity/record/route-fixture source; use its receipt/run lookup
helpers where IDs are generated rather than guessing a constant. Existing fixture functions are not an instruction
to add route-fixture specs or to run acceptance during setup.

These suites do not establish actual TUI keyboard workflows, app-wide narrow/zoom coverage, multipage output quality,
all failure/recovery branches, the newer cost-close browser journey or the PASS handoff. A tested pending gateway
result is not a real provider integration. Review current assertions before relying on broad spec names. Read-only
button absence needs its authorized presence counterpart; a failure must be for the intended permission, not invalid
input. Existing rule tests and source inspection remain supporting evidence.

No new automation is prescribed by this plan. If an observed finding needs coverage, name the activity and existing
or new spec before writing it: focused rule/bug checks in regression; additional complete jobs, phone, access,
isolation and terminal walks in acceptance. Reuse the existing app sweep and golden path; no screenshot baselines.

### Verification rules for later refinements

- Read the [testing skill](../../../../.agents/skills/testing/SKILL.md) before writing/running tests. Commands run
  from the mr-moqui root. Use the affected regression specs on a suitable binary, for example
  `./moq test mr-boss --spec AccountingSettlement --nobuild`; use the owning Mantle spec when its rule changes.
  Browser specs run through Moqui, not Node:
  `./moq test-client mr-boss --serve --spec AccountingReceivablesWalk --nobuild`.
- Follow the supplied repository instructions: `./moq test-apps` before application-work commits and
  `./moq test-framework` before framework-work commits. Record any later explicit user-directed review cadence in
  §7; do not inherit a Products/Projects exception from their execution records. No commit is part of this task.
- **Acceptance runs require the user's request or an added/changed acceptance test.** If one is added/changed, run
  that test and its component's acceptance suite once written. An explicitly authorized existing walk could use
  `./moq accept mr-boss --spec AccountingPaymentRunsWalk`. Plan entries, setup dependencies, shared-code changes and
  a completion checkpoint do not authorize acceptance. No `accept-all` is part of this plan.
- Keep business rules in Mantle and app context checks in BOSS. Across regression, render a screen at most once per
  mode with all checks together; a second mode requires its own custom template. Do not add regression screen sweeps,
  role×mode matrices, duplicate golden paths or repeated financial-rule tests through app wrappers.
- Respect BOSS `test/budget`: **264 seconds server / 57 seconds client**, with individual regression specs over
  **15 seconds** failing. Observe each other component's current budget. Remove duplication or move full scenarios
  to acceptance; no budget increase is authorized.
- Lint changed screens with `moqui lint --screens <report-file>`; its argument is an overwritten output report,
  never a screen path. Compare parse/idiom findings against baseline. This Markdown-only plan needs no screen lint.
- A shared renderer/widget correction is framework work; follow the building skill and embedded/precompiled asset
  checks. Do not run framework specs, `cargo test` or `test-all` just because application files changed.
- Keep evidence in ignored framework `plans/ui-refinement-evidence/boss-accounting/` or a named equivalent outside
  tracked source. Compare important before/after captures with the same data, geometry and theme; include relevant
  DOM/console/network results, persisted outcomes and inspected/redacted artifacts. Do not commit credentials,
  tokens, private financial data, captured messages or screenshots with this plan.
- Re-exercise changed activities and relevant recovery branches after correction, including a representative second
  consumer of shared changes. Separate tool limitations, missing prerequisites, reproduced baseline failures and
  product defects. A silent skip, rendered page or historical result cannot close live coverage.

## 6. Coverage, findings and running record

### Activity coverage ledger

**Pending** means not reviewed; **inspected** means source/render/visual inspection only; **exercised** means steps
executed with an explicit pass/fail/partial outcome; **blocked** means a missing prerequisite; **deferred** means
deliberately postponed with reason/follow-up. Exercised does not itself mean passed. Use `exercised / partial` and
name open continuations for partly executed work. Blocked/deferred coverage remains unresolved. Source research for
this plan does not advance live activity coverage. Record modes and recovery gaps, not just a test name.

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
| ACC-24 — Production cost close | pending | All live variants unreviewed | — |
| ACC-25 — Tax | pending | All live variants unreviewed | — |
| ACC-26 — Budgets | pending | All live variants unreviewed | — |
| ACC-27 — Reports/drill/outputs | pending | All live variants unreviewed | — |
| ACC-28 — Related records/returns | pending | All live variants unreviewed | — |
| ACC-29 — Evidence/discussion | pending | All live variants unreviewed | — |
| ACC-30 — PASS handoff | pending | Requires explicit local site/runtime fixture | — |
| ACC-31 — Access/isolation | pending | Paired checks throughout; no matrix inferred | — |
| ACC-32 — Cross-app/mode reconciliation | pending | Depends on earlier activity continuations | — |

### Findings register

No runtime/UI defects have been established by this planning task. Number later findings **ACC-UI-001** onward.
Distinguish observed failures, source suspicions and design judgments. P1 blocks work or makes essential information
unusable; P2 causes substantial friction or misleading presentation; P3 is a localized refinement. Financial data
or access corruption takes priority regardless of whether the screen looks correct.

| ID | Severity / status | Actor, activity and step | Route / mode / theme / viewport | Reproduction, observed impact and evidence | Owner / correction / retest |
| --- | --- | --- | --- | --- | --- |
| — | No observed findings yet | — | — | Source concerns below are investigation inputs | — |

Source concerns to carry into execution, without treating them as observed defects:

- Shared context branches and inherited children can differ from the visible tab menu; pair direct route/transition
  probes with actual owning-app positives. Reused invoice tabs and bill outputs need explicit direction checks.
- Duplicate menu indexes occur in the root and some sections. Inspect actual navigation order before proposing a
  correction; a source index alone is not evidence of a confusing rendered menu.
- Durable settlement/payment reviews, unknown outcomes, issued evidence and resumed runs require visible recovery
  checks beyond a normal happy path. Outputs, selected-value labels and search counts are part of financial scope.
- Home mixes several independently loaded sources and deliberately excludes some foreign-currency bank amounts;
  reports mix live data with stored closed-period summaries. Inspect basis and incompleteness explanations.
- Historical Manufacturing F121 in `impl-accounting.md` §7 describes legacy receipt repost under a hard lock losing
  posted history before replacement fails. Reconcile current flags/services with Mantle/Manufacturing ownership
  before any isolated reproduction; it is neither a newly observed finding nor authorization for historical repair.
- Old deferrals and implementation prose lag current production-cost/shared-context work. Record further
  source-to-design differences when encountered; do not silently turn them into feature expansion.

### Bounded batch record

| Batch | Scope | Evidence / verification | Outcome / continuation |
| --- | --- | --- | --- |
| Plan — 2026-11-10 | Coordinator plus two read-only research subagents: Products pattern, current Accounting inventory, workflows, fixtures, permissions, tests and historical deferrals | Source/document inspection only; no live runtime, tests, outputs or financial mutations | Initial plan written; all ACC activities pending |

For each execution batch append: actor/fixture identities; source and binary revisions; runtime/clock/modes;
activities and branches attempted; findings and ownership; important before/after evidence; persisted outcomes and
inspected artifacts; exact checks/results and any skips; design/implementation updates; commits when made; temporary
state restored; unresolved continuations. Keep notes bounded and refer to evidence files rather than pasting logs.

## 7. Decisions

- **Current task:** write this plan only. The user requested research/planning and allowed subagents; two researched
  bounded sources read-only. No live walkthrough, mutation, acceptance run, implementation or commit was requested.
- **Pattern:** retain Products' seven-part structure, explicit screen/mount inventory, complete actor/start/steps/
  expected/recovery/mode activities, pending ledger, findings and bounded records. Products' completed statuses,
  posting permissions, acceptance selections and execution exceptions do not carry over.
- **Source of truth:** current mounts/services and grants govern review scope. Include the now-built production
  cost-close/policy surfaces; reconcile older documents without rewriting them as part of this task.
- **Financial basis:** record organization, dates, currency and authority in each applicable receipt. Use disposable
  local data, captured mail, synthetic gateways and local bank/tax files. Review a business operation's full result,
  including retained reviews, partial outcomes and repeated requests.
- **Modes and boundaries:** Material is the visual target; actual TUI and brief Standard/output checks remain
  explicit. PASS is a bounded browser handoff. Other app jobs are included only for the necessary source/return or
  shared-fix contract, not complete neighboring-app reviews.
- **Testing and cadence:** reuse existing coverage and follow §5. No acceptance selection, suite run, new test,
  budget increase or exception to the supplied pre-commit rules is authorized by this plan. Record later user-directed
  execution scope and cadence here when the review begins.
- **Completion:** later review completion requires evidence for the selected activities, resolved or explicitly
  accepted findings and a candid ledger of remaining modes, recovery branches, blockers and deferred work. A source
  inventory or passing suite does not by itself establish a usable Accounting workflow.
