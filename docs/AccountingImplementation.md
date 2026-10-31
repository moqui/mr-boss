# Accounting implementation

The Accounting app calls Mantle's services, which check permissions and organization scope themselves. BOSS owns
its access context, routes, choices, Home and forms, and adds no financial pass-through service. Later workflow
sections are hidden until their destinations exist. P0–P9, P11 (period close), P13 (valuation and landed costs), P14
(tax), P15 (budgets), P17 (returns) and P18 (portals, as PASS apps) are built; P4–P5 were reviewed and rebuilt on
Mantle's services (R2 in [impl-accounting](../plan/impl-accounting.md)). Activation is P19, and foreign-currency posting
and rate refresh P20.

## Routes and users

| Area | Implemented destinations |
| --- | --- |
| Foundation | Home; Receivables/Invoices and InvoiceDetail; Payables/Bills and BillDetail; Payments/Payments and PaymentDetail; QuickCreate/NewInvoice, NewBill, NewPayment and NewEntry |
| Receivables | Invoices, one list with list and calendar views; shared InvoiceDetail with ten tabs; BillingQueue; InvoiceBatch; Statements and StatementPrint; InvoicePrint; shared Customer360 Contact, Orders, Money, Agreements, FinanceDetails and Files |
| Payables | Bills with its queues, Upload bill and Place hold; BillDetail with Overview, Holds, Match (Shared/InvoiceMatch) and InvoiceDetail's tabs, and Allocate landed cost under More; PayablesWorkbench and its SettlementReview; ExpensePosting; PaymentRuns and PaymentRunDetail; LegacyMatches; LandedCosts; Supplier360 Bills and payments, Agreements and terms, Finance details |
| Records and approvals | Records/OrderDetail, Records/ShipmentDetail, Records/ReturnDetail and Records/Product360 (Shared/OrderDetail's Accounting context, with Supplier bill link, Shared/ShipmentDetail, Shared/ReturnDetail and Shared/Product360's Accounting context); Approvals |
| Inventory | Inventory/InventoryValuation (Shared/InventoryValuation's Accounting context): the valuation beside the inventory and WIP accounts, exceptions, open WIP, Revalue and Repair product cost |
| Portals (PASS, mr-pass) | Billing: Invoices and InvoicePay; Supplier: BillUpload. Not BOSS screens: public pages over Mantle's PortalServices, opened by an invoice's pay link or a purchase order's bill link |
| Settlement and payments | ReceivablesWorkbench; Payments with new payment and internal transfer; PaymentDetail Overview, Applications, Gateway, Refunds, GeneralLedger, Files and History; GatewayTransactions; PaymentPrint for the receipt, detail and check (a transfer's detail only) |
| Banking | Banking/BankAccounts, BankAccountDetail (bank lines with Reconcile, Not reconciled and Unreconcile, deposit slip, add line, match automatically), StatementImport (BAI2, OFX, CSV), Reconciliations, ReconciliationDetail, UnmatchedTransactions, BankRules, FinancialAccounts and FinancialAccountDetail |
| Ledger | GeneralLedger/ChartOfAccounts, AccountDetail, JournalEntries, JournalEntryDetail, TransactionEntries, JournalBatches and JournalTemplates |
| Periods | PeriodClose/Periods, PeriodCloseDetail (checklist, close, reopen, history), PeriodLocks and PeriodRuns |
| Fixed assets | FixedAssets/FixedAssets, AssetClasses, DepreciationRunDetail and EquipmentDetail (Shared/EquipmentDetail's Accounting context), for GL posting, approvers, readers and finance administrators |
| Reports | Reports/Reports, TrialBalance, GeneralLedger, InvoiceReconciliation and StockTransactions |
| Settings | Settings/Settings, AccountingPreferences, PostingDefaults, PaymentTerms, Currencies, PaymentMethods, DocumentSettings and MatchPolicies |
| Tax | Tax/TaxAuthorities, TaxRates (with the simulation), TaxStatements and TaxStatementDetail, for the tax group and finance administrators |
| Budgets | Budgets/Budgets, BudgetDetail and BudgetControls, for the GL, reader, approver and finance admin groups; Reports/BudgetVariance |

All routes are under `/qapps/Accounting`. Record routes take `recordId`; reads, mutations, search choices, exports,
record links and files validate their organizations and records on the server. Report navigation and print URLs
retain organization, date/period, currency and dimension filters. Mantle's record reads return display text: dates in
the user's zone (`AccountingPolicy.display`), party, status and counterparty names, and a document's date, amount and
currency. Shared screen parts are in `template/AccountingParts.xml` (choices, the organization picker, find, batch
review, report options) and `template/AccountingDocuments.xml` (the invoice, bill and payment list, detail and draft).

Demo users are `finance.ar`, `finance.ap`, `finance.match`, `finance.treasury`, `finance.gl`, `finance.tax`,
`finance.read`, `finance.approve` and `finance.admin` (demo password `moqui`). The reader has no other business
launcher. Reads come from view permissions: `ACCOUNTING_VIEW` for every kind, `RECEIVABLE_VIEW`, `PAYABLE_VIEW` and
`PAYMENT_VIEW` for their kinds. An edit permission alone opens no reads, so Projects' managers, who hold
`RECEIVABLE_EDIT` for billing, do not read Accounting's records. Their composed grants are in BossAccountingSetupData; no finance role gets GL_POST_CLOSED, raw REST
mutation authorization, unpost, unrestricted posted rewrites or bulk historical repost authorization. Organization
membership follows Mantle's existing direct-child organization rule; active scope narrows it. Administration can
select an internal organization, and private-contact filters still apply.

Deterministic fixtures use BOSS_ACCT_ORG and BOSS_ACCT_INVOICE/BILL/PAYMENT/ENTRY/POSTED. BOSS_ACCT_ORG is the demo's
own organization (BossAccountingUsersDemoData), outside the Ziziwork rollup, with Mantle's default accounting
configuration; it explicitly enables the guard, required dimensions and forward issuance adjustment, so the adoption does
not reach Mantle's demo flows, which post directly for ORG_ZIZI_RETAIL and ORG_ZIZI_CORP. Native defaults remain N.
A demo item and unassigned expense account support the setup repair walk; the revaluation offset maps to
BOSS_INVENTORY_REVALUATION.

## Native contracts

| Native service family | Responsibility |
| --- | --- |
| AccountingServices / AccountingPolicy | Capabilities, scope, record and child checks, safe account projections, lists, draft documents |
| JournalServices | Draft headers/lines, genuine draft-line moves, description-only posted correction with reason, previews, reviewed posting/reversal, independent batches and versioned templates |
| LedgerServices / PostingGuard | Native posting choke point, organization/source/account/date/currency/balance checks, fiscal parents, typed locks, required/supplied dimensions and operation identity |
| CloseServices | Audited organization lock dates; named user/group, scope, transaction and expiry exceptions to a specific soft lock |
| AccountServices | Account metadata, assignments/dates/dimension requirements, classifications and fiscal-period generation |
| FinanceReportServices | Currency-separated trial balance/ledger, stored closed-period summaries, live open-period entries and comparison calculations |
| SetupServices | Readiness, posted-basis protection, mapping validation/repair, clone conflict preview/concurrency, due terms and masked method metadata |
| CurrencyServices | Explicit dated manual rates and independent CSV rows with persisted source/import results |
| JournalContentServices | Authorized journal evidence upload and RecordFiles ownership |
| InvoiceServices / InvoiceWorkflow | `change#InvoiceState`, draft edits, approved-time billing, linked credits (`create#InvoiceCreditMemo`, `apply#InvoiceCredit`), the receivables list and summary, print (`get#InvoiceOutput` over `get#InvoicePrintInfo`), `send#Invoice` through an EmailTemplate, batches |
| CollectionServices | `get#Statements` and `send#Statements` over `get#ReceivableStatementInfo` |
| CustomerFinanceServices | The customer's finance context through the existing contact, order and receivable services; masked methods for treasury |
| TaxServices (mantle.other) | Rate versions and authorities (`store#Rate`, `store#Authority`), the local gateway and an invoice's tax lines at finalize, the simulation, sales tax statements, the 1099 run and the CSV export |
| PaymentServices | Open items and settlement through the `apply#*` services; payment lists, detail, drafts, state changes through `update#Payment` and unapplication; issued documents; gateway actions through the `*#SinglePayment` services; refunds through `create#RefundPayment`; internal transfers; deposit slips (`create#DepositSlip`). Each confirmed review is a `PaymentReview` row |
| ReconciliationServices | Bank accounts and bank lines, statement imports keyed by line identity, matching candidates, statement sessions to a zero difference, match rules; `check#BankAccess` before the older bank line services |
| FinancialAccountServices | Stored-value accounts and their movements; `check#FinancialAccountAccess` before them |

New financial services check permissions and organization scope even when artifact authorization is disabled.
Journal previews expire after ten minutes; their fingerprints include authoritative source headers, transaction and
lines, accounts/assignments, relevant configuration, periods, locks and exceptions. Posting rechecks under lock.
External operation keys are at most 40 characters, matching the existing PostingOperation schema; internal batch
and source keys are deterministic bounded hashes. Identical retries return the recorded result; changed reuse is
refused. A reversal links its original only after successful posting, and a failed reversal rolls back atomically.

`verifyOnly` performs reads only: no period creation, transaction updates, summary updates or operation records.
Direct financial failures are refused with stable reason codes and preview findings. Adopted operational stock and
financial-account failures stay unposted in the configured error journal with a recorded failure; missing mappings
never produce AtrSuccess. Legacy callers keep their defaults. Forward issuance adjustments are opt-in and preserve
historical posted movements, including dates already protected by a hard lock.

Each batch transaction validates and posts in its own transaction. Named failures do not stop independent items;
partially successful batches remain open. Published template versions are immutable, and an effective publication
instantiates an independent draft with its source version. Required dimensions are per organization/account;
supplied facilities and cost centres are checked even when they are optional. New journal, template and draft payment amounts round to their currency.

## Configuration boundaries

PostingDefaults covers account assignments, GL types, item types/directions, invoice types, payment types,
instruments, asset/type/class, financial account type/reason, variance, product, category and party defaults. For
invoice product lines the existing resolver checks category, product and asset-type profit/receipt accounts before
item defaults. Organization configuration includes its accounting parents. Missing generic item defaults are
identified using that resolver, alongside missing GL types and the scoped error journal. ChartOfAccounts can
assign an existing global chart account; account reads never include another organization's balances.

Preferences and clone application refuse routine changes to the currency, fiscal or costing basis of posted
history. Clone previews preserve destination conflicts, name mappings incompatible with the destination, and reject stale inputs. Mantle's invoice/order numbering
fields remain authoritative; issued identities are not rewritten. Terms have portions and discounts (P8). Currency rates are dated,
positive and source-labelled; malformed independent CSV rows are retained as failures while valid rows commit.

PaymentGatewayOrganization records are provisioned outside finance forms in Admin. Only active organization
bindings are offered for a new method binding. Finance sees gateway IDs/descriptions and masked identifiers, never
credentials or executable service names. The demo organization permits TEST_APPROVE and TEST_DECLINE. Approved
standard document layouts have representative long previews; the shared HTML viewer retains its script sandbox.
Mantle's test gateway (`PaymentTestServices.xml`) answers pending and declined, and the demo's gateway uses it. PASS
runtime changes remain P18, as documented in mr-pass/design-forum.

## Receivables and payments

Screens call Mantle's receivables and payment services after `ironstone.accounting.AccessServices` has checked the
capability and the organization ([mr-mantle AccountingImplementation](../../mr-mantle/docs/AccountingImplementation.md)
has the contracts). Mantle decides every financial question; BOSS shapes its answers for a screen.

- **Screen services.** `ReceivableServices.xml` (with `Receivables.js`) serves the receivables screens, and
  `PaymentScreenServices.xml` and `SettlementScreenServices.xml` (with `Payments.js` and `Settlements.js`) the payment
  and settlement screens: their options, names, capabilities and review rows. The payment and settlement transitions
  call these declared services, not module functions. `AccountingLib.js` holds what the modules share: the access check and app root,
  reviewed `id~version` tokens, paging names, record links and parameters, operation keys and the before and after rows
  of a review.
- **Receivables.** Each InvoiceDetail tab holds its own section and includes only the transitions its forms post to.
  The header follows ProjectDetail: a status chip with its tui twin, print and PDF through `sharedLinks`, one send
  dialog. Invoices is one list with list and calendar views. Statements show `get#Statements`. DocumentSettings'
  preview renders Mantle's invoice print template over a sample. Customer360's finance transitions are in its
  FinanceDetails tab only.
- **Projects.** Billing's invoice services are inline XML Actions over Mantle's; its `send#Invoice` passes its
  time-detail print to Mantle's `send#Invoice` (`printLocation`), so the emailed PDF keeps the time detail.
- **Settlement.** ReceivablesWorkbench keeps its selection in Mantle behind a `draftId` (`store#`/`get#SettlementDraft`)
  and confirms a review by its id, fingerprint and the operation key Mantle's preview returned.
- **Payments.** The detail's dialogs review and confirm through Mantle's preview and confirm services: state changes,
  unapplication, gateway actions, manual refunds and transfers. GatewayTransactions lists PaymentGatewayResponse rows.
  Payment files are read and locked through Mantle (`get#PaymentAccess`), and the shared Files screens ask
  `get#RecordContentPolicy` what a record's files allow. The transfer form names who is paid the fee.
- **Settings and demo.** AccountingPreferences shows the posting guard (`postingGuardEnabled`), required dimensions
  and forward issuance adjustment. The demo service turns them on for BOSS_ACCT_ORG only, with the single-currency
  refusal (`singleCurrencyDocumentsOnly`), and its gateway uses Mantle's test gateway services.

## Payables

Mantle owns intake, approval, holds and the supplier profile ([mr-mantle AccountingImplementation](../../mr-mantle/docs/AccountingImplementation.md)
"Payables"); the screens call it after the Accounting access check.

- **Screen services.** `PayableScreenServices.xml` (with `Payables.js`): `find#Bills` over `find#Payables` with the
  queue tabs, `get#SupplierContext` over `get#SupplierFinance`, `get#OrderContext` and `get#ShipmentContext` for the
  Accounting context of the shared order and shipment screens, and `get#Approvals`. `MatchServices.find#BillExceptions`
  lists the open holds for the Held tab; P7 adds match exceptions.
- **Bills and BillDetail.** Upload bill calls `import#Bill`; Place hold on the selection calls `hold#Invoice` for each
  bill and names each refusal. BillDetail's primary action is Send for approval (`request#PayableApproval`) for an
  incoming bill and Approve (`approve#Payable`) otherwise, Place hold beside it; a held bill shows its holds in a
  banner and has no Approve. The Holds tab releases (`release#InvoiceHold`, never by the placer) and asks for a
  release (`request#HoldRelease`). The other tabs are InvoiceDetail's, which read any invoice the user may see.
- **ExpensePosting** lists a person's bills awaiting finance and approves each with its posting day.
- **Supplier360** is Accounting's own 360 screen (Products' `Shared/Supplier360` keeps the buying context; a shared
  screen's tabs are the same for every mount, impl-accounting F135). Agreements and terms changes the supplier
  profile; Finance details is Customer360's template (`template/AccountingFinanceDetails.xml`) with side supplier.
- **Orders and shipments.** `Shared/OrderDetail` has an Accounting branch (appRoot Accounting) and `Shared/ShipmentDetail`
  is new, both from `template/AccountingRecords.xml`: Invoice or Bill from order and Bill accepted receipts
  (`create#InvoiceFromSource`), Upload supplier bill on a purchase order.
- **Approvals** is Commons Notifications mounted with Accounting's topics (`notificationTopics`: `BillApproval`,
  `BillHoldRelease`); each row opens its bill, where the decision is made, and the decision marks it read.
- **Demo.** BOSS_ACCT_SUPPLIER on 30-day terms (BOSS_ACCT_NET30), BOSS_ACCT_BILL_REVIEW awaiting approval,
  BOSS_ACCT_BILL_HELD on hold, the approved purchase order BOSS_ACCT_PO, and BOSS_ACCT_PO_RECEIVED received into
  BOSS_ACCT_WH and waiting for its bill; BOSS_ACCT_ORG turns on `receiptInvoiceSelfBilledOnly` through
  `store#Preferences` (AccountingPreferences' Receipt bills).

## Portals

The customer and supplier pages are the PASS Billing and Supplier apps (mr-pass `docs/Deployment.md`), over Mantle's
`mantle.account.PortalServices` and `mantle.party.ExternalAccessServices`
([mr-mantle AccountingImplementation](../../mr-mantle/docs/AccountingImplementation.md) "Portals"). BOSS adds no
public screen, group or token route; a customer or supplier contact is a PASS public account.

- **Links.** `send#Invoice` mails an invoice's pay link when the organization has a published Billing site.
  OrderDetail's Supplier bill link (AP, an approved purchase order, a published Supplier site) issues the order's
  BillUpload link through `create#AccessCapability` and shows it once. The Accounting groups reach the
  ExternalAccessServices, which check `RECEIVABLE_EDIT` or `PAYABLE_EDIT` in the record's organization.
- **Payment.** Accounting Preferences chooses the invoice payment gateway among the organization's gateway bindings.
  A payment made from a pay link is an ordinary card payment for the invoice, applied when the gateway confirms it.
- **Bills.** A supplier's upload is an incoming bill on Bills like one AP uploads, waiting for review; its file is the
  scanned one.
- **Demo** (`BossZPortalDemoData.xml`, `load#PortalDemo`). ORG_ZIZI_RETAIL's site ZIZI_PORTAL on
  `portal.zizi.localhost` with `/account`, `/billing` and `/supplier`; the hosted test gateway ZIZI_PORTAL_HOSTED; the
  invoice ZIZI_PORTAL_INVOICE to JoeDist with the pay link token `ZiziPortalDemoInvoicePayLink000000000000000001`; the
  approved purchase order ZIZI_PORTAL_PO from ZiddlemanInc with the bill link token
  `ZiziPortalDemoOrderBillLink0000000000000000001`; contacts `joedist.payer` (Billing) and `ziddleman.billing`
  (Supplier), invited and redeemed (password `moqui`). A PASS runtime serves the site with a `<public-site>` for that
  host.

## Matching

Mantle owns the match, its policy, the re-evaluation job and the legacy backfill (`InvoiceMatchServices`;
[mr-mantle AccountingImplementation](../../mr-mantle/docs/AccountingImplementation.md) "Matching"); the screens call it
after the Accounting access check and add no service of their own.

- **Match tab.** BillDetail's Match tab is `Shared/InvoiceMatch` with the Accounting context (appRoot Accounting): the
  bill lines on the left and their order and receipt sources on the right, from `evaluate#InvoiceMatch`, with what each
  source allows and its check; a purchase order narrows the sources. A match operator (`INVOICE_MATCH`: AP, the match
  group, finance admin) edits the quantities and applies (`apply#InvoiceMatch`, with an operation key); an exception
  that holds puts the bill on hold, and the approver releases it on the Holds tab. An applied match shows its result,
  whether it waits for re-evaluation, and Unapply match. The match group reads bills (`PAYABLE_VIEW`) and reaches
  Payables.
- **LegacyMatches** (`Payables/LegacyMatches`, `INVOICE_MATCH`): preview the links the earlier bills' evidence
  supports, with the ambiguous lines and those with no evidence, then Link bills; each bill is linked on its own.
- **MatchPolicies** (`Settings/MatchPolicies`, finance admin): the policy rows in effect, or all with ended ones;
  Change policy starts a row for the organization, a category or a product, End ends an override. It links to
  LegacyMatches, since Settings is the administrator's.
- **Demo.** BOSS_ACCT_ORG's policy (received basis, 2% on price, hold); BOSS_ACCT_PO_MATCH received in full (ten at 8);
  BOSS_ACCT_BILL_MATCH (six at 8) and BOSS_ACCT_BILL_PRICE (four at 9, outside the tolerance) wait for their match.

## Banking

The Banking section opens for treasury, the reader and the finance admin (`BOSS_ACCT_BANKING`); AR does not read bank
statements. Its screens call Mantle's `ReconciliationServices` and the deposit services of `PaymentServices` (the
contracts are in mr-mantle's AccountingImplementation, "Banking (P9)"); a transition that calls an older bank line
service (`create#`, `reconcile#`, `unreconcile#`, `noReconcile#PaymentMethodTrans`, `match#PaymentMethodTransUnmatched`)
or a financial account movement calls `check#BankAccess` or `check#FinancialAccountAccess` first.

- **Screen services.** `BankServices.xml` holds the list reads (`find#Reconciliations`, `find#Rules`,
  `find#FinancialAccounts`, `get#FinancialAccount`); `Banking.js` the routes and the bank drop-downs of the shared
  choices transition (`bankAccounts`, `bankLineCandidates`, `depositReceipts`).
- **Statements.** StatementImport reads a file or pasted text, shows each row as new, a duplicate or rejected, and
  imports the new lines. ReconciliationDetail lists the period's lines in date order (a sequential list on terminal),
  each matched, cleared or left unreconciled with a reason from its row, and Clear selected for several.
- **Rules.** BankRules is under Banking, not Settings (impl-accounting §4). A rule suggests; one set to reconcile does
  so only for an exact, unambiguous match (Apply rules on UnmatchedTransactions). Test shows what it would do.
- **Demo.** BOSS_ACCT_BANK, "Operating account", with three receipts into it, two open bank lines and a rule for the
  payment customer; the organization's stored-value accounts are assigned (impl-accounting F190).

## Period close

The close, its checklist and the period runs are Mantle's (`CloseServices`, `PeriodRunServices`; mr-mantle's
AccountingImplementation, "Period close (P11)"); the screens call them after the Accounting access check.

- **PeriodCloseDetail** shows `get#Checklist`: each row that is not clear with its count and items, each item linked to
  the screen that resolves it (an invoice, bill, payment, journal entry, bank account or period) where the user may open
  that screen; Close period (FISCAL_CLOSE) when nothing blocks, Reopen period (FISCAL_REOPEN) under More once closed,
  the period's trial balance, invoice reconciliation and period runs, and the close history. Periods links each period
  here.
- **PeriodRuns** lists `ironstone.accounting.PeriodRunServices.find#Runs`; Start a run calls `preview#Run`, a run chosen
  from the list shows `get#Run`'s results, and Post run posts the version shown.
- **InvoiceReconciliation** shows `run#InvoiceReconciliation` for an organization's period, receivables or payables.
- **Settings and demo.** AccountingPreferences' Project cost sets `projectCostPostingEnabled`, which the demo turns on
  for BOSS_ACCT_ORG. The demo's last month (BOSS_ACCT_CLOSE_PERIOD) holds a draft invoice (BOSS_ACCT_CLOSE_INVOICE) and
  the "Payroll account" (BOSS_ACCT_CLOSE_BANK) with a line no statement cleared; AccountingCloseWalk resolves both and
  closes the period.

## Valuation and landed costs

The valuation, landed costs and cost repair are Mantle's (`InventoryReportServices`, `AssetBookServices`; mr-mantle's
AccountingImplementation, "Valuation and landed costs (P13)"); the screens call them after the Accounting access check
and add no service of their own.

- **InventoryValuation** is Products' `Shared/InventoryValuation` with the Accounting context (appRoot Accounting, at
  `Accounting/Inventory/InventoryValuation`; `template/AccountingInventory.xml`): the organization, facility, product and
  day; the stock value, inventory and WIP accounts and their difference; each product's stock beside its inventory
  account, linked to its Product360; the accounts; the exceptions; open WIP by run. A product with an approved standard
  cost has Revalue, which opens Products P9's revaluation dialogs on the same screen; Repair product cost (finance
  administration) is under More. Products' mount keeps only the revaluation of an approved estimate.
- **Product360** is `Shared/Product360` with an Accounting branch (appRoot Accounting, at `Accounting/Records/Product360`),
  on OrderDetail's pattern: a shared screen's tabs are one list for every mount (F135), so the Accounting context is a
  record header and boxes (Summary cards, Costs and history, Source movements, Prices when the user holds PRICE_VIEW,
  GL mappings), and Products' tabs see an empty tab list there. The GL mappings pane adds and edits the product's and its
  categories' `ProductGlAccount`/`ProductCategoryGlAccount` rows through `store#PostingDefault`, for finance
  administration; PostingDefaults stays the bulk editor.
- **LandedCosts** (`Payables/LandedCosts?invoiceId=`), from BillDetail's More: the bill's lines and their state, the
  allocation form (charge line, basis, accounting date, receipts) whose preview shows each receipt's share split into on
  hand and issued with the new unit cost, Post landed cost for a GL poster, and the allocations made.
- **StockTransactions** (`Reports/StockTransactions`): an organization's fiscal period of receipts, issues and count
  variances with their totals.
- **Settings and demo.** PostingDefaults' asset mapping has the scrap account. The demo turns inventory revaluation on
  for BOSS_ACCT_ORG (AccountingPreferences), maps the InVrScrap and InVrExpired reasons, scraps a unit of the delivered
  supplies, gives BOSS_ACCT_SUPPLY a weight and adds the carrier's approved freight bill BOSS_ACCT_BILL_FREIGHT, which
  AccountingValuationWalk allocates by weight to the two supply receipts. The close checklist links its valuation rows to
  InventoryValuation.
## Fixed assets

The books, classes and depreciation are Mantle's (`AssetBookServices`; mr-mantle's AccountingImplementation, "Fixed
assets (P12)"); the screens call them after the Accounting access check.

- **FixedAssets** lists `ironstone.accounting.AssetBookServices.find#Assets`: each fixed asset with its class, in-service
  day, cost, depreciation, net book, location and book state (not capitalized, in service, disposed); Run depreciation
  for GL posting. **AssetClasses** lists `find#Classes`; the finance administrator adds a class, starts a new version or
  ends one (`store#Class`).
- **EquipmentDetail** (`Shared/EquipmentDetail`, mounted at FixedAssets/EquipmentDetail; other apps' contexts come with
  them) shows `get#AssetBook`: identity, the book with its accounts, depreciation by month and book events, and the
  asset's receipts, each with its posting. Capitalize (the class's defaults filled in) is the primary action before
  capitalization and Adjust book after it; Dispose and Repair acquire cost (finance administrator, in an open period)
  are under More; Reverse is on the latest event in force.
- **DepreciationRunDetail** calculates a month (today's by default) for all assets, a class or chosen assets
  (`preview#Depreciation`), shows each asset's result (`get#DepreciationPreview`) and posts the version shown
  (`post#Depreciation`); its recent runs come from `find#Runs`. PeriodRuns opens a depreciation run here.
- **Demo.** `Demo.js` `fixedAssets`: BOSS_ACCT_ORG's Trucks and Forklifts classes, BOSS_ACCT_FA_FORKLIFT in service since
  the first of the month, BOSS_ACCT_FA_VAN to capitalize and BOSS_ACCT_FA_PRINTER with a method and no cost, which a run
  names as failing. AccountingFixedAssetsWalk capitalizes the van and posts the month.

## Tax

`TaxServices.xml` with `Tax.js` serves the Tax screens' reads (authorities with the organization's nexus, registration,
account and current rates; rate versions with their state; statements; a statement's detail with its lines over
`find#SalesTaxLines`) after the tax capability (`taxEdit` or `admin`). Writes go to Mantle's TaxServices; Tax's delete
checks the capability and the statement's organization before `delete#TaxStatement`; Export is a posted, confirmed
action, and the detail shows a 1099's taxpayer numbers by their last four digits only. AccountingPreferences sets the
organization's sales tax gateway. The choices `taxGeos`, `stores`,
`taxPeriods` (the organization's fiscal periods that have begun, latest first) and `enum:TaxAuthorityType` are in
`Accounting.js`. The Tax area authorizes BOSS_ACCOUNTING_TAX and BOSS_ACCOUNTING_ADMIN only. The demo
(`Demo.js` `taxDocuments`, in `load#AccountingDemo`) gives BOSS_ACCT_ORG Utah sales tax at 6.1% with nexus, the
LOCAL gateway, Sales Tax Collected as the authority's account, the taxed invoice BOSS_ACCT_TAXED to Wasatch Outfitters,
and two IRS-registered suppliers paid this year, one without a taxpayer number.

## Payment runs and terms

Mantle owns payment terms, due schedules and runs ([mr-mantle AccountingImplementation](../../mr-mantle/docs/AccountingImplementation.md)
"Payment terms and payment runs"); the screens call it after the Accounting access check.

- **Screen services.** `PaymentRunServices.xml` (with `PaymentRuns.js`): `find#Runs`, a page of the organization's runs
  with their masked bank account, dates, total and progress, and `get#RunContext` over `get#Run`, with the run's bills
  in it and left out and the operation key of its execute form. The `runBankAccounts` choice offers the organization's
  current bank accounts, masked.
- **PaymentRuns and PaymentRunDetail.** New run (`create#Run`) opens the run. The detail's primary action follows its
  state: Send for approval (`request#RunApproval`) for AP, Approve run (`approve#Run`) for an approver, Execute run
  (`execute#Run`, once under its form's operation key) for treasury, or Resume execution under the run's own key when an
  execution did not finish (its reason shown in the header); More holds Refresh selection (`select#Bills`),
  Download bank file (`generate#RunFile`, the same file each time), Import bank returns (`import#RunReturn`, a file or
  pasted text) and Cancel run. Each bill in the run has Leave out; one the user left out has Put back.
- **PayablesWorkbench** is the settlement workbench of `template/AccountingWorkbench.xml` with direction payable: a
  supplier's open bills with due dates, discounts (from the due schedule) and holds, its credits and the payments made,
  and the draft applying them (ApplySupplierCredit), reviewed in Payables/SettlementReview. ReceivablesWorkbench and
  Receivables/SettlementReview are the same template with direction receivable; `Settlements.js` names each side's
  documents and screens. Each route screen sets `direction` in its `always-actions`, so its transitions run on its side.
- **PaymentTerms** shows each term's portions and discounts; New payment term takes an optional discount, and Edit lines
  saves up to three portions (`store#SettlementTerm` with `lines`).
- **Approvals** adds the PaymentRunApproval topic; a row opens the run.
- **Access.** Treasury (`BOSS_ACCOUNTING_TREASURY`) reaches Payables and holds `PAYABLE_VIEW`: it executes runs and reads
  the bills they pay. Approvers hold `PAYMENT_RUN_APPROVE`.
- **Demo.** BOSS_ACCT_RUN_BANK, the organization's operating account set up for NACHA files; BOSS_ACCT_SUPPLIER_BANK;
  approved bills BOSS_ACCT_BILL_DUE (due today) and BOSS_ACCT_BILL_DISCOUNT (2% 10 net 30), BOSS_ACCT_BILL_DISPUTE
  approved then held, and the proposed "Demo supplies run" paying BOSS_ACCT_BILL_RUN.

## Budgets

Mantle owns the budget states, revisions, control policies and commitments (`mantle.other.BudgetServices`,
`BudgetReportServices.run#BudgetVariance`; [mr-mantle AccountingImplementation](../../mr-mantle/docs/AccountingImplementation.md)
"Budgets"). `BudgetServices.xml` with `Budgets.js` serves the screens' reads after the finance read (`reportRead` or
`admin`): `find#Budgets`, `get#BudgetDetail` (over `get#BudgetAmounts`, as of a revision), `find#Policies`,
`find#Exceptions` and `find#Commitments`. The choices `budgetPeriods`, `budgets`, `budgetPeriodsOf`, `budgetRevisions`,
`budgetStatuses`, `commitmentStatuses` and the `BudgetType`, `BudgetControlStage` and `BudgetControlAction` enumerations
are in `Accounting.js`.

- **Budgets** lists the organization's budgets; New budget (budget editors) starts a draft on a fiscal year or quarter
  and opens it.
- **BudgetDetail**: the record header with Approve budget (`BUDGET_APPROVE`, another user than the creator), the amounts
  of each account for the period and by sub period, Add account and Change on a draft
  (`store#BudgetItemsSubPeriods`), Revise with a reason once approved (`revise#Budget`, matrix form), the revisions with
  their stored PDFs and a link to read the budget as of each, the parties (`store#BudgetParty`) and the commitments;
  More holds the PDF, the variance report, Add party, Close and Cancel.
- **BudgetControls**: the policy rows (Add policy, New version and End for the finance administrator,
  `store#Policy`), the exceptions (a Stop's blocked spending and the overrides, with the reason) and the commitments.
- **BudgetVariance** (Reports): budget, committed, actual (posted debits less credits), remaining and variance per
  account, for the budget's period or a sub period, as of a revision.
- **Bills.** BillDetail's More has Approve over budget for a user holding `BUDGET_OVERRIDE` (`approve#Payable` with
  `budgetOverrideReason`), and its Budget details tab (InvoiceDetail's) shows the bill's commitments. Approvals lists
  the `BudgetOverride` topic, which links to BudgetControls.
- **Demo.** BOSS_ACCT_BUDGET, the year's operating budget drafted by the GL user, approved and revised once (its
  expense account 3,000 to 3,200), a second expense account spread by month; a Stop on bills for the expense account
  and a Warn for everything else; BOSS_ACCT_PO_BUDGET with 600 reserved; BOSS_ACCT_BILL_OVER (3,500), which the Stop
  refuses until an overrider gives a reason.

## Returns

Mantle owns receipt, settlement and the changes between pack and ship (mr-mantle AccountingImplementation, "Returns and
order changes (P17)"); ReturnDetail calls them after the Accounting access check.

- **ReturnDetail** (`Records/ReturnDetail`, `Shared/ReturnDetail` with the Accounting context; ReturnScreenServices
  `get#ReturnContext` over `Returns.js`): the return's header, its items with authorized, received, accepted, rejected,
  settled and eligible quantity, its credits with their original invoices and its refunds. Settle (AR for a customer
  return, AP for a supplier one) shows what `preview#ReturnSettlement` would do and settles it with that version; Credit
  without receipt (in More) is offered to an AR user who holds `RETURN_CREDIT_APPROVE` and `INVOICE_APPROVE`; the refunds
  shown are every refund of the return's credit memos. A reader sees the return and why
  nothing may be settled; a return of a side the user may not read is not available.
- **Preferences.** AccountingPreferences sets Return settlement (`returnSettlementRequired`) and Shipment invoices
  (`salesInvoiceFinalizedAtShip`).
- **Demo.** BOSS_ACCT_ORG has both on; BOSS_ACCT_SO_RETURN sold three supplies to Acme, shipped and paid by check, and
  BOSS_ACCT_RETURN returns two of them for credit, approved with one received, waiting for Settle.

## Verification

Tests run through Moqui's JavaScript runners; Node is not a test dependency.

- Server specs: AccountingAccess, AccountingIsolation and AccountingShell (roles, scope and the palette, with paired
  positive and negative cases), AccountingScreens, AccountingReceivables, AccountingSettlement, AccountingPayments,
  AccountingPaymentFiles, AccountingIssuedFiles, AccountingPaymentGateway, AccountingPaymentRefunds,
  AccountingPaymentTransfers, AccountingPayables, AccountingMatching, AccountingPaymentRuns, AccountingBanking,
  AccountingPeriodClose, AccountingTax, AccountingBudgets and AccountingValuation (returns in AccountingAccess); Projects'
  Billing and ClientBilling. AppStructure and TuiRender render every Accounting screen in qvt and tui.
- Browser walks, one live-client pass each: ledger, settings, receivables, settlement, payments, gateway, payables,
  matching, payment runs, banking, period close, tax, budgets, returns and valuation.
- Screen lint writes to a report file; a screen source is never its output.

```sh
./moq test --nobuild mr-mantle
./moq test --nobuild mr-boss
./moq test --nobuild mr-boss --spec AccountingReceivables,AccountingSettlement,AccountingPayments,AccountingPaymentGateway,AccountingPaymentRefunds,AccountingPaymentTransfers
./moq test --nobuild mr-boss --spec AccountingPayables,AccountingMatching,AccountingPaymentRuns,AccountingBanking,AccountingPeriodClose,AccountingTax,AccountingAccess
./moq test --nobuild mr-boss --spec AccountingValuation
./moq test --nobuild mr-boss --spec AccountingBudgets
./moq test-client --nobuild mr-boss --serve --spec AccountingLedgerWalk,AccountingSettingsWalk,AccountingReceivablesWalk,AccountingSettlementWalk,AccountingPaymentsWalk,AccountingPaymentGatewayWalk,AccountingPayablesWalk,AccountingMatchingWalk,AccountingPaymentRunsWalk,AccountingBankingWalk,AccountingCloseWalk,AccountingTaxWalk,AccountingReturnsWalk,AccountingBudgetsWalk,AccountingValuationWalk
target/develop/moqui lint --screens <report-file>
```

The PDF specs need a Chromium for PDF (`pdf_chromium_path`; see [Run-Deploy](../../../../docs/Run-Deploy.md) and
[Client-Testing](../../../../docs/dev/Client-Testing.md)); without one every PDF spec fails. The BOSS demo adopts the
controls only on BOSS_ACCT_ORG, so Mantle's low-level posting specs run in the same runtime as Accounting's and test
Mantle's defaults. Results are recorded in [impl-accounting](../plan/impl-accounting.md).

Each walk checks only what needs the live client: that its dialogs and forms post to their transitions, that a review
survives a reload, and that a saved result is checked again without a second write. The ledger and settings walks
post a balanced journal, assign an existing expense account, repair an invoice item default, create a due term,
import valid and invalid rate rows, and save numbering preferences; the others create, finalize and send an invoice,
apply a receipt and credit, deliver a manual payment, and authorize then capture through the gateway; the tax walk
versions a rate and simulates a sale, finalizes a taxed product invoice, and makes a sales tax statement and the year's
1099 data. The financial
rules, permissions and refusals are tested in the server specs here and in mr-mantle. Keep deterministic fixtures
declared in the data file: the client runner's snapshot key includes entity and data files and the binary, not
service implementation text.

The remote-choice widget keeps a selected value when its parent form rerenders and a later search page leaves the
selected row out; a dependency change still clears it. QvtKeys has a browser regression for it.
