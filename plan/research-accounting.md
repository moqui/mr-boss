# IronStone BOSS — Accounting app research

Oct 18, 2026

Reviewed against sources Oct 18, 2026; follows [research-crosscut.md](research-crosscut.md).

Deeper research pass on the **IronStone Accounting** app (receivables & collections, payables & payment runs, banking & reconciliation, general ledger & period close, tax, budgets, financial reports), cataloguing every relevant screen/page found in the reference apps. Companion to [3p-app-reference.md](3p-app-reference.md); feeds the design of the Accounting row in [initial-design.md](initial-design.md). Accounting's audience keeps the books, so Accounting would include these reused screens (crosscut §3–§4), each with an accounting context: **Customer 360** (balance, credit, aging, statements); **Supplier 360** (AP balance, bills, payments); **Order detail** (invoices, payments); **Shipment detail** (cost and invoice links); **Product 360** (cost history); the **Facility & equipment record** (fixed-asset books); and **Approvals waiting** (bill approval). In the overlapping functions Accounting's version emphasizes AP bills and 3-way match, depreciation and fixed-asset books, posting and payment of expense claims, recurring invoicing for subscriptions, the credit/refund step of customer returns, and tax authorities and payment methods within the payment, shipping & tax settings.

**Organization.** Sorted by functional area (not by app): all invoicing screens together, all banking screens together, etc. Within each area, sub-tables per reference app. Style mirrors [research-drawers-commons.md](research-drawers-commons.md).

**Scope.** Business UI only: screens, dialogs, lists, report pages and their components/engines — the invoice → payment → reconciliation chain a bookkeeper actually uses, plus fixed-asset books and period runs. Backend posting logic is noted only where it shapes a screen (post/draft states, locks, matching).

**Path conventions.** Every backticked path resolves against the checkout for its prefix (crosscut §1); all checkouts are under `/home/jonesde/work/moquiwork/`. Inside a table row a path may be shortened to a tail only when the same cell or row already names the full directory.

| Prefix | Checkout | Paths start with |
| --- | --- | --- |
| **Odoo** | `3p_other/odoo` | `odoo/addons/<addon>/…` (`account`, `account_*`, `analytic`, `payment`, `purchase`, `l10n_*`); views in `<addon>/views/`, wizards in `<addon>/wizard/`, OWL UI in `<addon>/static/src/components/` |
| **ERPNext** | `3p_other/frappe/erpnext` | `erpnext/<module>/…` — accounting doctypes `erpnext/accounts/doctype/<name>/`, reports `erpnext/accounts/report/`, workspaces `erpnext/accounts/workspace/`, sidebar `erpnext/accounts/sidebar/`; fixed assets `erpnext/assets/`; credit limits `erpnext/selling/` |
| **Frappe apps** (payments, lending) | `3p_other/frappe` | `payments/payments/…` (gateway settings and checkout pages), `lending/lending/…` (loan management, collections) |
| **Carbon** | `3p_other/carbon` | `apps/erp/app/{modules,routes}/…` — modules `apps/erp/app/modules/{accounting,invoicing}/` (UI in `ui/`), routes `apps/erp/app/routes/x+/{accounting+,invoicing+,fixed-asset+,depreciation-run+,lease+,payments+}/` |
| **AureusERP** | `3p_other/aureuserp` | `plugins/webkul/<plugin>/…` — base resources `plugins/webkul/accounts/src/Filament/Resources/` (hidden from navigation), user-facing clusters `plugins/webkul/accounting/src/Filament/Clusters/{Accounting,Customers,Vendors,Configuration,Reporting,Settings}/` and `plugins/webkul/invoices/src/Filament/Clusters/{Customers,Vendors,Configuration,Settings}/`, models-only `plugins/webkul/payments/` |
| **Dolibarr** | `3p_other/dolibarr` | `htdocs/<module>/…` (`compta`, `fourn`, `accountancy`, `asset`, `loan`, `core`, `admin`) |
| **Dolibarr community modules** | `3p_other/dolibarr-community-modules` | `<module>/…` (`einvoicing`, `stancer`, `helloasso`, `ksef`) |
| **metasfresh** | `3p_other/metasfresh` | `frontend/src/…` (React WebUI shell), `backend/de.metas.<module>/…` (window owners; business windows are metadata-defined) |
| **Akaunting** | `3p_other/akaunting` | `resources/views/…` (Blade), `app/…` (controllers `app/Http/Controllers/`, reports `app/Reports/`, widgets `app/Widgets/`) |
| **Ever Gauzy** | `3p_other/ever-co/ever-gauzy` | `apps/gauzy/src/app/pages/…`, `packages/…` (shared UI `packages/ui-core/shared/src/lib/`) |
| **Moqui baseline** | `mr-moqui-base/runtime` | `component/mr-marble/screen/SimpleScreens/{Accounting,Party,Asset}/…`, `component/mr-marble/screen/MyAccount/…`, `component/mr-marble/screen/…`, `component/mr-mantle/{entity,data}/…`, `component/mr-mantle/{service/mantle,data}/…`; see also [ss-inventory.md](ss-inventory.md) and [usl-inventory.md](usl-inventory.md) |

Not used here: Twenty, Zimbra, Nextcloud, Signal, OpenProject, Redmine, Frappe CRM, Frappe Helpdesk, Frappe Insights and the other groupware sources ship no accounting screens. Frappe HR's Expense Claim (`hrms/hr/doctype/expense_claim/`) covers the capture and approval that People's version of expense claims emphasizes and is catalogued in [research-people.md](research-people.md). The Moqui components in `3p_moqui/` have no accounting screens (ridgecrest only brands the past-due invoice email that `mantle.account.InvoiceServices.send#CustomerPastDueEmail` sends).

Sections: [1 accounting home & dashboards](#1-accounting-home--dashboards) · [2 chart of accounts, journals & fiscal years](#2-chart-of-accounts-journals--fiscal-years) · [3 journal entries & the general ledger](#3-journal-entries--the-general-ledger) · [4 invoices & receivables (AR)](#4-invoices--receivables-ar) · [5 collections & dunning](#5-collections--dunning) · [6 bills & payables (AP)](#6-bills--payables-ap) · [7 payments & payment runs](#7-payments--payment-runs) · [8 banking & reconciliation](#8-banking--reconciliation) · [9 period close & locks](#9-period-close--locks) · [10 tax & e-invoicing compliance](#10-tax--e-invoicing-compliance) · [11 budgets & forecasts](#11-budgets--forecasts) · [12 financial reports & the report engine](#12-financial-reports--the-report-engine) · [13 customer & vendor balance, credit & aging](#13-customer--vendor-balance-credit--aging) · [14 accounting settings & configuration](#14-accounting-settings--configuration) · [15 fixed assets, depreciation & period runs](#15-fixed-assets-depreciation--period-runs) · [16 cross-app surfaces](#16-cross-app-surfaces) · [17 current Moqui baseline](#17-current-moqui-baseline-mr-marble--marbleerp--mantle) · [18 gaps & BOSS implications](#18-gaps--boss-implications)

---

## 1. Accounting home & dashboards

### Akaunting — a configurable dashboard assembled from widget records

- The home screen is user-configurable: multiple dashboards (create/edit/clone/delete, per-user with search), each a grid of draggable widget cards whose order is persisted (`sort`, `width`, per-widget settings JSON).

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Dashboard CRUD & show | List/create/edit/delete, `show.blade.php` renders the widget grid with a SortableJS-style drag ordering and a widget-picker search box; header has dashboard switcher + "New dashboard" | `resources/views/common/dashboards/{index,create,edit,show}.blade.php`, `app/Http/Controllers/Common/Dashboards.php` |
| Widget load & reorder API | `index()` lists widgets+dashboards, `show()` returns one widget's HTML async into a placeholder card, `update()` persists drag order, `getData()` refreshes charts | `app/Http/Controllers/Common/Widgets.php` |
| Finance widget classes & views | 8 finance widgets (CashFlow income-vs-expense line chart, AccountBalance bar chart per bank/cash account, Currencies, Receivables & Payables invoice-status chips + totals, ProfitLoss, ExpensesByCategory, BankFeeds — a "learn more" card for the paid cloud bank-feeds app); shared chart templates (`line_chart`, `bar_chart`, `donut_chart`) with JS series building | `app/Widgets/{CashFlow,AccountBalance,Currencies,Receivables,Payables,ProfitLoss,ExpensesByCategory,BankFeeds}.php`, `resources/views/widgets/{line_chart,bar_chart,donut_chart,cash_flow,account_balance,currencies,receivables_payables,bank_feeds}.blade.php`, base object `app/Abstracts/Widget.php` |

### AureusERP — Filament "Accounting overview" page over six clusters

- Three plugins share the work: `accounts` holds base resources that are hidden from navigation (`shouldRegisterNavigation = false`); `accounting` (full accounting) and `invoices` (invoicing only) subclass them into clusters (`use Webkul\Account\Filament\Resources\InvoiceResource as BaseInvoiceResource`).

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Accounting menu | Clusters **Customers** (Invoices, Credit Notes, Payments, Customers, Products), **Vendors** (Bills, Refunds, Payments, Vendors, Products), **Accounting** (Journal Entries, Journal Items), **Reporting** (seven statement pages, §12), **Configuration** (Accounts, Journals, Taxes, Tax Groups, Fiscal Positions, Payment Terms, Currencies, Cash Roundings, Incoterms, product categories/attributes), **Settings** | `plugins/webkul/accounting/src/Filament/Clusters/{Customers,Vendors,Accounting,Reporting,Configuration}.php` and the matching folders, plus `plugins/webkul/accounting/src/Filament/Clusters/Settings/` |
| Accounting Overview | Filament custom page at slug `/accounting/overview` (group "Accounting"), permission-gated via `page_accounting_overview` (Filament Shield), header widgets only | `plugins/webkul/accounting/src/Filament/Pages/Overview.php` |
| Journal charts | "Journal Charts" widget set renders per-journal trend charts; the module's only dashboard widget | `plugins/webkul/accounting/src/Filament/Widgets/{JournalChartsWidget,JournalChartWidget}.php` |
| Overview page view | Blade shell that hosts the header widgets | `plugins/webkul/accounting/resources/views/filament/pages/overview.blade.php` |
| Setup gate | Trait that shows a "set up accounting" callout and action on pages until the company's accounting is set up | `plugins/webkul/accounting/src/Filament/Concerns/GatesAccountingSetup.php` |

### Carbon — invoicing dashboard + AR/AP "workbench"

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Invoicing dashboard | As-of-date aging totals card (current + 4 buckets + unapplied), metric cards (overdue, received/paid), GL-vs-subledger reconciliation tie-out panel (variance flagged), recent payments table with Receipt/Disbursement status chips; depends on `accountingSetUp` gate | `apps/erp/app/modules/invoicing/ui/Dashboard/InvoicingDashboard.tsx` |
| AR/AP workbench | Pick-based allocation workbench: customer/supplier sections with checkbox line selection, collapse/expand per party, as-of date + currency popover, bulk allocate action; links every line to its document | `apps/erp/app/modules/invoicing/ui/Workbench/ARAPWorkbench.tsx` |
| Accounting and invoicing menus | Accounting: **Reports** (Reporting; Sync Tie-Out only with a Xero/QuickBooks/Rillet integration), **General Ledger** (Journal Entries; Intercompany only with several companies), **Closing** (Accounting Periods, Depreciation, Leases, Revenue Recognition), **Fixed Assets** (Assets, Fleet), **Configure** (Asset Classes, Chart of Accounts, Cost Centers, Default Accounts, Dimensions, Exchange Rates, Fiscal Year, Payment Terms, Projects). Invoicing: **Accounts Payable** (Payables workbench, Purchase Invoices, Supplier Credits, Charges, Reimbursements), **Accounts Receivable** (Receivables workbench, Sales Invoices, Credit Memos), **Payments** | `apps/erp/app/modules/accounting/ui/useAccountingSubmodules.tsx`, `apps/erp/app/modules/invoicing/ui/useInvoicingSubmodules.tsx` |
| Cutover gate | Reports, Intercompany, Journal Entries, Accounting Periods and Depreciation sit behind a locked overlay until the company completes the Activation (cutover) wizard (§14) | `apps/erp/app/modules/accounting/ui/AccountingBetaGate.tsx` |

### Dolibarr — boxes-based home boards

- No dedicated "accounting dashboard": the global home page is a grid of user-configurable "boxes" (box widgets), several of which are finance widgets; each module also has its own `index.php` summary list.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Home boxes board | Global dashboard: per-user two-column boxes with edit mode (enable/disable/order each box); boxes configured in admin and per-user | `htdocs/index.php`, `htdocs/admin/boxes.php`, registration `htdocs/core/boxes/modules_boxes.php` |
| Customer-invoice box | Latest customer invoices with status/amount paid pills | `htdocs/core/boxes/box_factures.php`, `box_factures_imp.php` |
| Supplier-invoice boxes | Latest supplier invoices (paid / unpaid variants) | `htdocs/core/boxes/box_factures_fourn.php`, `box_factures_fourn_imp.php` |
| Third-party finance boxes | Top customers by turnover, customers with outstanding bill limit reached, invoice disputes | `htdocs/core/boxes/box_goodcustomers.php`, `box_customers_outstanding_bill_reached.php`, `box_invoices_dispute.php` |
| Bank/cash box | Open bank accounts balances | `htdocs/core/boxes/box_comptes.php` |
| Graph boxes | Invoices per month/year (customer & supplier) mini-graphs | `htdocs/core/boxes/box_graph_invoices_permonth.php`, `box_graph_invoices_peryear.php`, `box_graph_invoices_supplier_permonth.php` |
| Accountancy entry boxes | Last manual journal entries + suspense account alert (needs manual matching) | `htdocs/core/boxes/box_accountancy_last_manual_entries.php`, `box_accountancy_suspense_account.php` |

### ERPNext — Desk "Accounting" workspace + configurable dashboards

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Accounts sidebar | Module menu: Home, Dashboard, Chart of Accounts, Sales Invoice, Purchase Invoice, Payment Entry, Journal Entry; **Reports** (General Ledger, Trial Balance, Trial Balance for Party, Profit and Loss, Balance Sheet, Cash Flow, Consolidated Report, Profitability Analysis, Accounts Receivable, Accounts Payable); **Banking** (Banking, Bank Account, Bank Clearance); **Taxes** (sales/purchase/item tax templates, Tax Rule, Tax Withholding Category); **Budgeting** (Budget, Cost Center Allocation, Monthly Distribution, Budget Variance); **Setup** (Company, Fiscal Year, Cost Centers, Accounting Dimension, Account Category, Financial Report Template, Mode of Payment, Payment Terms Template, Currency Exchange, Accounts Settings) | `erpnext/accounts/sidebar/accounts/accounts.json` |
| Accounting workspaces | Four workspace pages (Accounting, Financial Reports, Invoicing, Payments), each with three number cards and one chart; the Accounting workspace groups its links into Financial Statements, Receivables & Payables, Registers & Profitability, Tax & Compliance, Invoicing & Payments, Banking, Reconciliation, Opening & Closing, Ledger Tools, Share Management, Setup | `erpnext/accounts/workspace/{accounting,financial_reports,invoicing,payments}/` |
| Accounts & payments dashboards | Pre-canned dashboards (JSON canvas: number cards + charts) for accounts vs payments | `erpnext/accounts/accounts_dashboard/accounts/accounts.json`, `erpnext/accounts/accounts_dashboard/payments/payments.json` |
| Standard dashboard charts | Data-driven chart sources: AR/AP ageing, bank balance, budget variance, incoming/outgoing bills, P&L | `erpnext/accounts/dashboard_chart/{accounts_receivable_ageing,accounts_payable_ageing,bank_balance,budget_variance,incoming_bills_(purchase_invoice),outgoing_bills_(sales_invoice),profit_and_loss}/` |
| Number cards | "Total Incoming/Outgoing Bills" and "Total Incoming/Outgoing Payment" KPI cards used in the workspaces | `erpnext/accounts/number_card/{total_incoming_bills,total_incoming_payment,total_outgoing_bills,total_outgoing_payment}/` |
| Onboarding | Accounting module onboarding steps/checklist records | `erpnext/accounts/module_onboarding/`, `erpnext/accounts/onboarding_step/` |

### Ever Gauzy — org dashboard & custom dashboards (income/expense-centric)

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Org dashboard | Organization home: accounting tab + HR tab split; income/expense bar charts w/ selectable date ranges & org/team/project/employee selectors; KPI cards | `apps/gauzy/src/app/pages/dashboard/{dashboard.component.ts,dashboard.component.html,accounting/}` |
| Dashboard switcher | Segmented switcher between Accounting / HR dashboards | `apps/gauzy/src/app/pages/dashboard/dashboard-switcher/` |
| Custom dashboards | User-defined dashboards: canvas + tab strip + widget palette + widget-config dialog; widget catalog spans accounting/charts/projects/HR | `apps/gauzy/src/app/pages/dashboard/custom-dashboard/{dashboard-canvas,dashboard-tab-strip,widget-palette,widget-config-dialog}.component.ts`, shared engine `packages/ui-core/shared/src/lib/dashboard/{widget,widget-host,window-layout}/` |
| Data-entry shortcuts | Quick-add income/expense tiles over the dashboard | `apps/gauzy/src/app/pages/dashboard/data-entry-shortcuts/` |

### metasfresh — generic window + a chart-widget dashboard shell

- The React WebUI is a thin shell; an accounting "dashboard" is a backend-defined window with chart widgets, not dedicated React.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Dashboard widget components | Chart widget host (antd-based), ChartOptions editor, drag-and-drop wrapper, side navigation for dashboard pages | `frontend/src/components/dashboard/{ChartWidget.js,ChartOptions.js,DndWidget.js,DraggableWrapper.js,Sidenav.js,Placeholder.js,EntityType.js}` |
| Generic document window | Every accounting doc (invoices, payments, allocation) renders in this one shell — list container + master window container are the real "screens" | `frontend/src/containers/{DocumentListContainer,MasterWindowContainer}.js`, `frontend/src/components/window/` |

### Odoo — the journals kanban is the accounting home

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Invoicing menu | **Dashboard**; **Customers** (Invoices, Credit Notes, Payments, Products, Customers); **Vendors** (Bills, Refunds, Payments, Products, Vendors); **Accounting** (Transactions: Journal Items, Analytic Items; Closing; Review; Control: Journal Entries, Audit Trail); **Reporting** (Invoice Analysis, Cashflow Analysis, Analytic Report; the Statement Reports and Partner Reports folders stay empty without Enterprise); **Configuration** (Settings, Chart of Accounts, Taxes, Journals, Currencies, Fiscal Positions, Multi-Ledger, Tax Groups, Cash Roundings, Payment Terms, Incoterms, Product Categories, Analytic Plans and Distribution Models) | `odoo/addons/account/views/account_menuitem.xml` |
| Journals kanban dashboard | One card per journal (bank/cash/sale/purchase/general) with type-specific body (bank: to-reconcile/new statement buttons + liquidity graph; sale: to invoice/confirm buttons; general: misc links), KPI strip, sample data state, "fetch e-invoices" actions | `odoo/addons/account/views/account_journal_dashboard_view.xml` |
| Dashboard KPI bar | `account_dashboard_kpis` OWL widget rendering A/R to collect, A/P to pay, customer+vendor totals, bank/cash balances above the kanban with quick-create links | `odoo/addons/account/static/src/components/account_dashboard_kpis/{account_dashboard_kpis.js,account_dashboard_kpis.xml,account_dashboard_kpi_card.xml}`, `odoo/addons/account/views/account_journal_dashboard_view.xml` |
| Journal dashboard JS | OWL kanban controller `account_dashboard_kanban` + per-journal "New" menu logic & graph widget | `odoo/addons/account/static/src/components/account_dashboard_kpis/account_dashboard_kpis.js`, `odoo/addons/account/models/account_journal.py` (dashboard values builder) |

**BOSS implications.** Every reference puts one action-first home in front of the bookkeeper: Akaunting's user-arranged widget board (drag-reorder persisted server-side, async fill-in of widget HTML) is the simplest model of an arrangeable landing page; in BOSS the widget types and builder are the reused dashboard widgets (crosscut §3), which Insights and every app's landing page include, so Accounting's landing page would place them. The references suggest a KPI strip centered on money (AR ageing / bank balance / vendor payable) like Odoo's `account_dashboard_kpis` and Carbon's GL-vs-subledger tie-out panel. Home tiles in the references deep-link straight into the working screens (Odoo journal-card buttons jump to statements/move lists); the BOSS equivalents would be the Journal, Invoice and Payment screens. The menus agree on one split — Customers / Vendors / Accounting (GL) / Reporting / Configuration in Odoo and AureusERP, AR / AP / Payments plus GL / Closing / Fixed Assets / Configure in Carbon — and two references (AureusERP's setup callout, Carbon's cutover gate) lock GL screens until accounting has been set up for the company. Per-area gating (AureusERP's `page_accounting_overview` shield permission) is one pattern for role-locked Accounting tabs inside the reused Customer 360 screen.

---

## 2. Chart of accounts, journals & fiscal years

### Akaunting — **absent**: no double-entry COA, journals or fiscal years

| Screen/page | What it is | Key files |
| --- | --- | --- |
| **Absent** | Cash-account-based bookkeeping: "chart of accounts" is a flat bank/cash account list, no GL account tree, no journal definitions, no fiscal-year entity in this codebase | bank accounts live in `resources/views/banking/accounts/`, ledger-ish via `resources/views/banking/transactions/` (see §8) |

### AureusERP — Odoo-derived Filament resources for accounts & journals

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Chart of accounts | Configuration → Accounts: list/detail/create/edit over the Odoo `account.account` port (code, account type, group); subclass of the hidden base resource | `plugins/webkul/accounting/src/Filament/Clusters/Configuration/Resources/AccountResource.php`, base `plugins/webkul/accounts/src/Filament/Resources/AccountResource.php` (+ `AccountResource/`) |
| Account tags | Tag resource for filtering/report grouping; base resource only, not in any cluster menu | `plugins/webkul/accounts/src/Filament/Resources/AccountTagResource.php` |
| Journals | Configuration → Journals CRUD (bank/cash/sale/purchase/general journal types per Odoo model) | `plugins/webkul/accounting/src/Filament/Clusters/Configuration/Resources/JournalResource.php`, base `plugins/webkul/accounts/src/Filament/Resources/JournalResource.php` (+ `JournalResource/`) |
| Fiscal positions | Tax/account mapping per country/locale (fiscal position + its tax/account mappings) | `plugins/webkul/accounting/src/Filament/Clusters/Configuration/Resources/FiscalPositionResource.php`, base `plugins/webkul/accounts/src/Filament/Resources/FiscalPositionResource.php` |
| Fiscal years | **Absent** — no fiscal-year resource in any of the three plugins (§18) | — |

### Carbon — first-class tree UI for COA + fiscal year & periods

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Chart-of-accounts tree | Hierarchical tree table with expand/collapse groups, inline account rows, filters bar; named account/group forms and a "Move account" dialog for re-parenting | `apps/erp/app/modules/accounting/ui/ChartOfAccounts/{ChartOfAccountsTree.tsx,ChartOfAccountsTableFilters.tsx,GroupAccountForm.tsx,MoveAccountForm.tsx,ChartOfAccountForm.tsx}` |
| COA CSV import | Upload → column-mapped import review screen → per-row error report | `apps/erp/app/modules/accounting/ui/ChartOfAccounts/{AccountImportReview.tsx,AccountImportCsvErrors.tsx}`, logic `apps/erp/app/modules/accounting/account-import-csv.ts` |
| Chart-of-accounts routes | Tree, new account/group, move, delete, CSV import, and a per-account ledger page | `apps/erp/app/routes/x+/accounting+/{charts,charts.new,charts.new-group,charts.move.$accountId,charts.ledger.$accountId,chart-import}.tsx` |
| Fiscal year | Fiscal-year settings form | `apps/erp/app/modules/accounting/ui/FiscalYear/FiscalYearSettingsForm.tsx`, route `apps/erp/app/routes/x+/accounting+/years.tsx` |
| Default accounts | One long form of posting defaults grouped by area (Cash & Banking; receivables incl. customer payment discounts and write-off/bad debt; payables; inventory and goods-received clearing; manufacturing absorption; fixed assets — acquisition cost, accumulated depreciation, disposal; leases — right-of-use assets and amortization; deferred revenue and contract assets; deferred tax; currency translation), with CSV export | `apps/erp/app/modules/accounting/ui/AccountDefaults/AccountDefaultsForm.tsx`, route `apps/erp/app/routes/x+/accounting+/defaults.tsx` |
| Supporting masters | Exchange rates (with rate-source badge), payment terms, cost centers (tree and list views), dimensions, projects — separate submodule UIs under the module menu | `apps/erp/app/modules/accounting/ui/{ExchangeRates,PaymentTerms,CostCenters,Dimensions,Projects}/` |

### Dolibarr — accountancy admin + generated journal pages

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Chart-of-accounts admin | Generic data tables (list & card) over `llx_accounting_account` with chart-model choice (`accountmodel.php`), per-country chart activation, account categories CRUD (`categories.php`, `categories_list.php`), short/auxiliary account admin (`subaccount.php`), product→account mapping (`productaccount.php`), journals dictionary list (`journals_list.php`), report-account list config (`report_list.php`), default account mapping per type (`defaultaccounts.php`) | `htdocs/accountancy/admin/{account,accountmodel,card,subaccount,categories,categories_list,productaccount,journals_list,report_list,defaultaccounts}.php`, shared rows `htdocs/accountancy/tpl/` |
| Bundled country charts | Install-time chart data per country (42 `llx_accounting_account_<iso>.sql` files: AD/AT/AU/BE/CA/…) | `htdocs/install/mysql/data/llx_accounting_account_*.sql`, `htdocs/install/mysql/data/llx_accounting_journal.sql` |
| Generated journals | Rendered bookkeeping journals from transferred entries: sells, purchases, bank, treasury, cashsells, expensereports, various — each a summary table with per-entry drill-down + CSV export | `htdocs/accountancy/journal/{sellsjournal,purchasesjournal,bankjournal,treasuryjournal,cashsellsjournal,expensereportsjournal,variousjournal}.php` |
| Fiscal years | Fiscal-year admin list + card + start/end year handling | `htdocs/accountancy/admin/fiscalyear.php`, `fiscalyear_card.php`, `fiscalyear_info.php` |

### ERPNext — doctype-driven masters with tree & importer

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Chart of accounts (Account doctype) | Tree-view master (`is_group`, root types: Assets/Liabilities/Income/Expense/Equity), account type & account number fields, per-company currency; bundled standard charts in `chart_of_accounts/` | `erpnext/accounts/doctype/account/account.{js,json,py}`, tree view `erpnext/accounts/doctype/account/account_tree.js`, charts `erpnext/accounts/doctype/account/chart_of_accounts/` |
| COA importer/builder | Standard chart selection + CSV import + live tree re-parent tool | `erpnext/accounts/doctype/chart_of_accounts_importer/chart_of_accounts_importer.{js,json,py}` |
| Fiscal year & books | Fiscal-year master (auto-year-start/company dates in `fiscal_year_company`), multi-currency finance books (per book GL isolation) | `erpnext/accounts/doctype/fiscal_year/fiscal_year.{js,json,py}`, `fiscal_year/fiscal_year_dashboard.py`, `erpnext/accounts/doctype/finance_book/finance_book.{js,json,py}` |
| Accounting dimensions | Runtime-defined extra dimensions (branch/project/cost center/user-defined), filters + constraint UI | `erpnext/accounts/doctype/accounting_dimension/accounting_dimension.{js,py}`, helpers `accounting_dimension_filter/`, `allowed_dimension/` |
| Cost centers & categories | Cost-center tree with allocation percentages; account_category layer | `erpnext/accounts/doctype/cost_center/cost_center.{js,py}`, `erpnext/accounts/doctype/cost_center_allocation/…`, `erpnext/accounts/doctype/account_category/account_category.{js,json,py}` |
| Period closing prep | Accounting period (posting permissions per doctype) + period closing voucher (§9) | `erpnext/accounts/doctype/accounting_period/accounting_period.{js,py}` |

### Ever Gauzy — **absent** (no GL/COA anywhere)

| Screen/page | What it is | Key files |
| --- | --- | --- |
| **Absent** | Gauzy is income/expense-centric; nearest analogs are expense categories & report categories (see §14), no accounts/journals/fiscal-year entities | — |

### metasfresh — metadata-defined windows (backend owns the UI)

| Screen/page | What it is | Key files |
| --- | --- | --- |
| COA/journal windows | No per-screen React: accounting windows (accounts, accounting schemas, journals) are defined in the backend AD; React renders the generic document window/list shell | `frontend/src/containers/{MasterWindowContainer,DocumentListContainer}.js`, `frontend/src/components/window/`; backend window owners `backend/de.metas.acct.base`, `backend/de.metas.acct.webui` |
| Fiscal calendar | Fiscal calendar/period windows likewise backend-defined (C_Calendar/period control) | `backend/de.metas.acct.base` (+ `de.metas.adempiere.adempiere` core AD model) |

### Odoo — accounts / journals / analytic plans core + l10n chart data

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Chart of accounts & tags | Account list/group (code+name+type columns, group tree), account tags, account-type selection widget (`account_type_selection` OWL component) | `odoo/addons/account/views/account_account_views.xml`, `odoo/addons/account/views/account_account_tag_views.xml`, `odoo/addons/account/static/src/components/account_type_selection/` |
| Journals | Journal list/form incl. bank-journal "statement source" (online_sync/manual), currency, sequence properties; journal dashboard see §1 | `odoo/addons/account/views/account_journal_views.xml` |
| Analytic plans/accounts | Analytic plan tree (plans-in-plans), analytic accounts + distribution model ("analytics distribution" widget) | `odoo/addons/analytic/views/{analytic_account_views.xml,analytic_plan_views.xml}`, `odoo/addons/account/views/account_analytic_{account,plan,distribution_model}_views.xml` |
| Fiscal years | **Absent** — no fiscal-year entity in community; discipline replaced by locking dates (tax/lock dates on company) + hard locks (§9) | lock dates: `odoo/addons/account/models/company.py` (`fiscalyear_lock_date` etc.), `odoo/addons/account/views/res_company_views.xml` |
| Country chart templates (pattern) | Each l10n addon ships its COA + tax templates + accounts templates + report/declaration adapters (BE/DE/US verified) | `odoo/addons/l10n_be/data/account*.xml`, `odoo/addons/l10n_de/data/*.xml`, `odoo/addons/l10n_us/data/*.xml` |

**BOSS implications.** Only Carbon and ERPNext treat the chart of accounts as a first-class screen surface (tree + move/re-parent + CSV-import review); the evidence favors that UI shape for the existing Moqui GL account tree (`GlAccountTree.xml` over `mantle.ledger.account.GlAccount` with `parentGlAccountId`, §17). Fiscal years in this sample are mostly config-ish single screens (Dolibarr fiscalyear card, Carbon one form, ERPNext doctype); Mantle already models them as `TimePeriod` rows of a fiscal type with `isClosed`, plus the fiscal-year start month and day on `PartyAcctgPreference`, so the gap is a period screen, not a new record (§9). Journal definitions (Dolibarr's `journals_list`, Odoo journal form with statement source) differ in kind from Mantle's `GlJournal`, which is a batch of transactions to post together, not a sale/purchase/bank book — see Open questions. The per-country bundled chart (Dolibarr SQL data, Odoo `l10n_*`, ERPNext `chart_of_accounts/`) maps to seed data for BOSS built-in charts, and account categories (Dolibarr) / account tags (Odoo, AureusERP base) match Mantle's existing `GlAccountCategory` and `GlAccountGroup` records for report grouping. Akaunting and Ever Gauzy show a finance app can work without exposing GL/COA at all, while every reference aimed at bookkeepers exposes it; posting defaults (Carbon's Default Accounts form, AureusERP's ManageDefaultAccounts) are what keep bookkeepers from hand-picking accounts per entry; Mantle has the same idea spread over `GlAccountTypeDefault`, `ItemTypeGlAccount`, `PaymentTypeGlAccount` and the other `mantle.ledger.config` mappings.

---

## 3. Journal entries & the general ledger

### Akaunting — **absent** (no journals/manual entries)

| Screen/page | What it is | Key files |
| --- | --- | --- |
| **Absent** | No journal-entry form nor general-ledger browsing; transactions ledger (§8) is the closest surface | — |

### AureusERP — JournalEntry/JournalItem resources under the accounting cluster

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Journal entries | Accounting → Journal Entries: list, create, edit, view pages with form/infolist schemas and a CSV exporter | `plugins/webkul/accounting/src/Filament/Clusters/Accounting/Resources/JournalEntryResource.php` (+ `JournalEntryResource/{Pages,Schemas,Tables}/`), `plugins/webkul/accounting/src/Filament/Exports/JournalEntryExporter.php` |
| Journal items | Accounting → Journal Items: per-line list across entries, with exporter; per-account ledger browsing is the General Ledger report page (§12) | `plugins/webkul/accounting/src/Filament/Clusters/Accounting/Resources/JournalItemResource.php` (+ `JournalItemResource/`), `plugins/webkul/accounting/src/Filament/Exports/JournalItemExporter.php` |

### Carbon — draftable entry form + ledger browsing

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Journal entry form | Draft/Posted status model with journal-driven header (journal/date/currency/dimension), line rows with debit/credit cells and a running balance check, per-line dimension selector, attachments; status chip component | `apps/erp/app/modules/accounting/ui/JournalEntries/{JournalEntryForm,JournalEntryHeader,JournalLineRow,DimensionSelector,JournalEntryStatus,JournalEntryDocuments}.tsx` |
| Entries table | Filterable table (journal/status/date range) w/ table row expansion into document links | `apps/erp/app/modules/accounting/ui/JournalEntries/JournalEntriesTable.tsx` |
| GL browsing / reports | Reports submodule: trial balance to CSV, per-account ledger (also `charts.ledger.$accountId` from the chart of accounts), period summaries | `apps/erp/app/modules/accounting/ui/Reports/`, CSV builder `apps/erp/app/modules/accounting/trial-balance-csv.ts` |
| Period discipline ties in | Periods table + "unposted documents in period" popover drives eligibility to post/close | `apps/erp/app/modules/accounting/ui/Periods/{PeriodsTable.tsx,PeriodCloseUnpostedDocumentsPopover.tsx}` |

### Dolibarr — MCAT bookkeeping ledger + manual-entry back doors

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Bookkeeping (MCAT) ledger | Flat ledger of manual/transfered entries: list, list-by-account, account balance over ledger lines, card (multi-line entry with journal selection), CSV import/export | `htdocs/accountancy/bookkeeping/{list.php,listbyaccount.php,balance.php,card.php,export.php}`, shared templates `htdocs/accountancy/tpl/` |
| Various payments | Manual cash disbursement/receipt entries that auto-generate ledger lines on transfer | `htdocs/compta/bank/various_payment/{card,list}.php` |
| Bank entries list | The general bank journal linear browser with inline edit & transfer-to-bookkeeping action | `htdocs/compta/bank/bankentries_list.php` |
| Accounting recap | "Compta recap" summary of movement per journal | `htdocs/compta/recap-compta.php` |

### ERPNext — gl_entry + journal_entry doctype family (posting states, templates, merges)

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Journal Entry | Full-featured desk form driven by voucher type (Journal Entry, Inter Company Journal Entry, Bank Entry, Cash Entry, Credit Card Entry, Debit Note, Credit Note, Contra Entry, Excise Entry, Write Off Entry, Opening Entry, Depreciation Entry, Asset Disposal, Periodic Accounting Entry, Exchange Rate Revaluation, Exchange Gain Or Loss, Deferred Revenue, Deferred Expense), multi-currency rows, submit posts GL at `posting_date` | `erpnext/accounts/doctype/journal_entry/journal_entry.{js,json,py}`, list js `journal_entry_list.js`, row doctype `erpnext/accounts/doctype/journal_entry_account/` |
| JE templates | Reusable multi-row entry templates | `erpnext/accounts/doctype/journal_entry_template/journal_entry_template.{js,json,py}`, rows `erpnext/accounts/doctype/journal_entry_template_account/` |
| GL & ledger entries | Server-side ledger records shaping every list: gl_entry (is_cancelled flags), payment_ledger_entry, advance_payment_ledger_entry, ledger merge tool, repost stacks | `erpnext/accounts/doctype/gl_entry/gl_entry.py`, `erpnext/accounts/doctype/{payment_ledger_entry,advance_payment_ledger_entry,ledger_merge,repost_accounting_ledger,repost_payment_ledger}/` |
| Closing balances | Per-account-year closing balance snapshot (fast start-of-year totals) | `erpnext/accounts/doctype/account_closing_balance/account_closing_balance.json` |
| Ledger health and surgery | Ledger health monitor (scheduled checks per company), bisect statements tool, transaction deletion records | `erpnext/accounts/doctype/{ledger_health_monitor,ledger_health,bisect_accounting_statements,transaction_deletion_record_details}/` |

### Ever Gauzy — **absent**

| Screen/page | What it is | Key files |
| --- | --- | --- |
| **Absent** | No journals/GL; income & expense records only (§4/§6) | — |

### metasfresh — backend windows (accounting schema/fact windows)

| Screen/page | What it is | Key files |
| --- | --- | --- |
| GL via windows | Fact_Acct/period endpoints rendered by the generic window shell; document posting states shown as status labels in the window header (see §9) | `frontend/src/components/window/`, backend owner `backend/de.metas.acct.base`, `de.metas.acct.webui` |

### Odoo — account.move is *the* GL surface (entry==invoice==statement)

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Move views (monolith) | All move forms/list/kanban/pivot/graph: invoice form w/ notebook (Invoice Lines, Payment Terms, Other Info), status-wizard header (Draft→Posted→Cancelled), "Journal Items" list w/ `view_account_move_line_filter`, kanban w/ status chips, graph/pivot for invoices (~2.3k lines) | `odoo/addons/account/views/account_move_views.xml` |
| Move form JS/OWL | `account_move_form` OWL form (dynamic notebook), tax autocomplete, `tax_totals` widget, `account_number_widget`, resequence dialog, review-state badge & `account_statusbar_secured` | `odoo/addons/account/static/src/components/account_move_form/`, `…/tax_autocomplete/`, `…/tax_totals/`, `…/account_resequence/`, `…/account_review_state_selection/`, `…/account_statusbar_secured/` |
| Grouped-entries view | "Journal items" grouped list with a special grouped_view_widget rendering account-move sub-rows inside group headers | `odoo/addons/account/static/src/components/grouped_view_widget/{grouped_view_widget.js,grouped_view_widget.xml}` |
| Automatic entries wizard | **Change Period** (move amounts to other periods through accrual entries) or **Change Account** on selected journal items | `odoo/addons/account/wizard/{account_automatic_entry_wizard.py,account_automatic_entry_wizard_views.xml}` |
| Merge & resequence | Merge moves wizard, renumbering (resequence) dialog | `odoo/addons/account/wizard/account_merge_wizard.py`, `odoo/addons/account/wizard/account_resequence.py` |
| Validation & locking helpers | Bulk post/confirm wizard, secure-entries wizard (immutable-lock hash), unreconcile wizard | `odoo/addons/account/wizard/account_validate_account_move.py`, `odoo/addons/account/wizard/account_secure_entries_wizard.py`, `odoo/addons/account/wizard/account_unreconcile_view.xml`, deep-link widgets `odoo/addons/account/static/src/components/open_move_widget/`, `open_move_line_move_widget/` |

**BOSS implications.** The GL in modern references is a *line/entry* surface, not a document list: Dolibarr's bookkeeping list + list-by-account and Odoo's grouped journal-items list are the mechanics a bookkeeper works in — the evidence points to a Journal Entries table screen that can filter by journal/account/status and jump to lines; the baseline already has both halves (`FindTransaction` and `FindTransactionEntry`, §17). Draft→Posted→Locked posting state with an immutability marker (Odoo's `account_statusbar_secured` + secure-entries wizard, ERPNext's `enable_immutable_ledger` setting and `repost_*` stack) maps onto Mantle `AcctgTrans.isPosted` plus `reverseOfAcctgTransId`/`reversedByAcctgTransId` and the existing post/unpost/reverse services; a lock flag is the missing piece (§9). Reusable templates (ERPNext JE templates) are a big bookkeeping accelerator with no Mantle record yet; and Carbon shows a compact single-screen form including document attachment + dimension selector that maps almost 1:1 onto a Moqui XML form screen.

---

## 4. Invoices & receivables (AR)

### Akaunting — classic document flow + a full customer portal

- One generic "Document" pipeline (invoice/bill): three document templates (default, classic, modern) to pick per invoice, and the customer portal (guest, signed URL) for viewing and paying.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Invoice list | Search with tabs **Unpaid** (status sent, viewed, partial), **Draft** and **All** (a user can pin the default tab); statuses draft, sent, viewed, partial, paid, cancelled; bulk actions | `resources/views/sales/invoices/index.blade.php`, tab params in `config/type.php`, controller `app/Http/Controllers/Sales/Invoices.php` |
| Invoice create/edit | Items table with tax and discount rows, currency, dates, attachments, recurring settings; template selector and notes; the same form parts power bills | `resources/views/sales/invoices/{create,edit}.blade.php`, shared components `resources/views/components/documents/{form,show,template}/` + `resources/views/common/items/` |
| Invoice show & print | Document detail: history + received payments list, add-payment dialog, three print layouts, email and share modals | `resources/views/sales/invoices/{show,print_default,print_classic,print_modern}.blade.php`, templates `resources/views/components/documents/template/{default,classic,modern}.blade.php`, modals `resources/views/modals/documents/` and `resources/views/modals/invoices/{email,share}.blade.php` |
| Recurring invoices | Recurring-invoice list and create/edit/show (frequency, interval, limit, auto-send) | `resources/views/sales/recurring_invoices/{index,create,edit,show}.blade.php`, controller `app/Http/Controllers/Sales/RecurringInvoices.php` |
| Customer portal (AR face) | Guest portal on signed URLs: dashboard of paid/due invoices and totals, invoice list/show/preview, pay and finish pages, payments list, profile | `resources/views/portal/{dashboard,invoices,payments,profile}/` (`invoices/{index,show,preview,signed,finish}.blade.php`), `app/Http/Controllers/Portal/{Dashboard,Invoices,Payments,Profile}.php` |

### AureusERP — one Odoo-ported invoice resource, mounted by two plugins

| Screen/page | What it is | Key files |
| --- | --- | --- |
| AR invoices | Customers → Invoices: list/create/edit/view + Manage Payments page; header actions Confirm, Pay, Preview, Print & Send, Reset to Draft, Reverse, Set as Checked, Cancel; the same cluster has Credit Notes and Payments. The `invoices` plugin mounts the same pages in its own Customers cluster | `plugins/webkul/accounting/src/Filament/Clusters/Customers/Resources/{InvoiceResource,CreditNoteResource,PaymentResource}.php` (+ `InvoiceResource/Pages/{ListInvoices,CreateInvoice,EditInvoice,ViewInvoice,ManagePayments}.php`), twin `plugins/webkul/invoices/src/Filament/Clusters/Customers/Resources/InvoiceResource.php` |
| Base resources | Odoo `account.move` port that both clusters subclass: invoice, credit note, refund, bill, with the action classes | `plugins/webkul/accounts/src/Filament/Resources/{InvoiceResource,CreditNoteResource,RefundResource}.php` (+ `InvoiceResource/{Actions,Pages,Schemas,Tables}/`) |
| Invoice preview and email | Blade preview per document kind and the invoice email body | `plugins/webkul/accounts/resources/views/{invoice,credit-note,bill,refund}/actions/preview/index.blade.php`, `plugins/webkul/accounts/resources/views/mail/invoice/actions/invoice.blade.php` |

### Carbon — poster-style invoice lifecycle with e-payment integration

| Screen/page | What it is | Key files |
| --- | --- | --- |
| AR invoice form | Full form: header (invoice no., contact, contract, dates, currency & fx), line forms (incl. rental & contract-billed line types w/ shipment links), ShipmentForm for invoice-from-shipment, properties panel, totals summary w/ tax grid | `apps/erp/app/modules/invoicing/ui/SalesInvoice/{SalesInvoiceForm.tsx,SalesInvoiceHeader.tsx,SalesInvoiceLineForm.tsx,SalesInvoiceShipmentForm.tsx,SalesInvoiceSummary.tsx,SalesInvoiceProperties.tsx}`, line-type helpers `useRentalLineTypeLabel.ts`, `RentalInvoiceLineSummary.tsx` |
| Post/void modals | Posting modal (date, journal, fx-rate check → posts GL) and void modal; status chips Draft/Posted/Paid/Voided | `apps/erp/app/modules/invoicing/ui/SalesInvoice/{SalesInvoicePostModal.tsx,SalesInvoiceVoidModal.tsx,SalesInvoiceStatus.tsx}`, table `SalesInvoicesTable.tsx`, explorer `SalesInvoiceExplorer.tsx` |
| Stripe customer panel | Per-invoice Stripe customer panel (id mapping/sync) | `apps/erp/app/modules/invoicing/ui/SalesInvoice/StripeCustomerPanel.tsx`, mapper `apps/erp/app/modules/invoicing/stripe-customer.mapper.ts` |
| Credit memos / debits | Memo doc workbench: form/header/status + "Applications" panel allocating memo balance to invoices | `apps/erp/app/modules/invoicing/ui/Memo/{MemoForm,MemoHeader,MemoStatus,MemoDocuments,MemosTable,MemoApplicationsPanel}.tsx` |
| Invoice status rules | "Partially Paid" and "Overdue" are derived from settlements, not set by hand; there is no Mark as Paid — only a payment (or memo) settlement makes an invoice paid | `apps/erp/app/modules/invoicing/invoicing.service.ts`, notes `apps/erp/app/modules/invoicing/AGENTS.md` |

### Dolibarr — facture pages with fiche-recurring + generator engine

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Customer invoices | List (`list.php`) w/ status filter chips & bulk PDF/email; card (`card.php`) full edit w/ approval buttons (validate/cancel/set paid), credit-note/replace-from, lines & payment records panel | `htdocs/compta/facture/{list,card}.php`, shared row/page components `htdocs/compta/facture/tpl/` |
| Recurring invoices | "Template invoices" list + card, scheduled generation into drafts | `htdocs/compta/facture/{invoicetemplate_list,card-rec,note-rec,agenda-rec}.php` |
| Per-invoice extras | Tabs on the invoice: attachments, contacts, notes, messaging (comment log), agenda events, direct-debit request | `htdocs/compta/facture/{document,contact,note,messaging,agenda,prelevement}.php` |
| Standalone credit notes | "Avoir" (credit note) and replacement invoices created from the invoice card; numbering comes from the selected numbering module | `htdocs/compta/facture/card.php`, numbering `htdocs/core/modules/facture/mod_facture_{mars,mercure,terre}.php` |
| Document generators | PDF generators Sponge and Octopus plus a generic ODT template generator | `htdocs/core/modules/facture/doc/{pdf_sponge,pdf_octopus,doc_generic_invoice_odt}.modules.php` |

### ERPNext — Sales Invoice desk capsule with payment-request & e-tools

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Sales Invoice doctype | Large desk form: multi-currency, `is_return` credit notes, "update stock" toggle, advances, fetch-from-order helpers, timesheet billing rows; statuses Draft, Return, Credit Note Issued, Submitted, Paid, Partly Paid, Unpaid, Unpaid and Discounted, Partly Paid and Discounted, Overdue and Discounted, Overdue, Cancelled, Internal Transfer | `erpnext/accounts/doctype/sales_invoice/sales_invoice.{js,json,py}` (+ `regional/`), child doctypes `erpnext/accounts/doctype/{sales_invoice_item,sales_invoice_payment,sales_invoice_advance,sales_invoice_timesheet,sales_taxes_and_charges}/` |
| List & connections | List view script and filters; connections dashboard (linked payments, orders, returns) | `erpnext/accounts/doctype/sales_invoice/{sales_invoice_list.js,list_filter/,sales_invoice_dashboard.py}` |
| Credit note | "Return / Credit Note" made from a submitted invoice | `erpnext/accounts/doctype/sales_invoice/mapper.py` (`make_sales_return`) |
| Payment request | "Payment Request" (Outward/Inward) emailed with a payment-gateway link; statuses Draft, Requested, Initiated, Partially Paid, Payment Ordered, Paid, Failed, Cancelled | `erpnext/accounts/doctype/payment_request/payment_request.{js,json,py}` |
| Subscriptions | Subscription (party, plans, trial, current/next billing period, days until due, cancel at period end, generate invoice at period start/end; statuses Trialing, Active, Grace Period, Cancelled, Unpaid, Completed, Refunded) and Subscription Plan (item, price determination, billing interval and count, payment gateway); a scheduled process generates the invoices | `erpnext/accounts/doctype/{subscription,subscription_plan,subscription_invoice,subscription_settings,process_subscription}/` |
| Invoice tooling | Opening-invoice creation tool (migration of open items) | `erpnext/accounts/doctype/opening_invoice_creation_tool/opening_invoice_creation_tool.{js,json,py}` |
| Dunning prep | Dunning created from overdue invoices (see §5) | `erpnext/accounts/doctype/dunning/dunning.{js,json,py}` |

### Ever Gauzy — invoice suite w/ e-payment & email surface

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Invoices module | Invoice table with line selectors (tasks, products, projects, employees, expenses), apply tax/discount and paid toggles; add/edit/view pages; estimates (`invoice-estimates`) and received invoices; internal notes | `apps/gauzy/src/app/pages/invoices/{invoices.component.ts,table-components/,invoice-add/,invoice-edit/,invoice-view/,invoice-estimates/,invoices-received/,add-internal-note/}` |
| Send/download/email | Send-invoice dialog & email history step, public-link generator, PDF download flow | `apps/gauzy/src/app/pages/invoices/{invoice-send,invoice-email,invoice-download,public-link}/` |
| Invoice PDF & templates | Invoice print/pdf preview driven by selectable HTML templates; org-level template management page ("accounting templates") | `apps/gauzy/src/app/pages/invoices/invoice-pdf/`, `apps/gauzy/src/app/pages/accounting-templates/accounting-templates.component.ts`, PDF/CSV generators `packages/ui-core/shared/src/lib/invoice/` |
| Payments tab per invoice | Invoice-payments view listing received payments + add-payment dialog (also standalone Payments page) | `apps/gauzy/src/app/pages/invoices/invoice-payments/`, `apps/gauzy/src/app/pages/payments/` |
| Income | Income records list (client, amount, date, tags) feeding the accounting dashboard | `apps/gauzy/src/app/pages/income/income.component.ts` |

### metasfresh — AR invoices are backend windows

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Invoice windows | C_Invoice windows rendered by the generic shell; paymentAllocation component is the AR face inside the UI (see §7) | `frontend/src/components/window/`, `frontend/src/components/paymentAllocation/`; window owners `backend/de.metas.adempiere.adempiere` (core C_Invoice window) + `backend/de.metas.fresh` (invoice extensions), gateway bridges `backend/de.metas.invoice_gateway.{api,spi}` |

### Odoo — invoices inside account.move + send/portal surface

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Invoice/bill views | Move lists/kanban of type out_invoice/in_invoice (§3) with special filters & batch actions; tax mode selector `account_document_tax_mode_selector` | `odoo/addons/account/views/account_move_views.xml`, `odoo/addons/account/static/src/components/account_document_tax_mode_selector/` |
| Send by email | `account_move_send` wizard (single & batch; email template, attachments checklist) + `invoice_guide`/`bill_guide` OWL onboarding helpers | `odoo/addons/account/wizard/{account_move_send_wizard.py,account_move_send_wizard.xml,account_move_send_batch_wizard.py,account_move_send_batch_wizard.xml}`, `odoo/addons/account/static/src/components/{bill_guide,invoice_guide}/` |
| Credit note | Reversal wizard: **Reverse** (credit note) or **Reverse and Create Invoice** (credit note plus a new draft) | `odoo/addons/account/wizard/{account_move_reversal.py,account_move_reversal_view.xml}` |
| Print/report | Customer `report_invoice` QWeb (+ payment receipts) & portal `account_portal_templates` | `odoo/addons/account/views/report_invoice.xml`, `odoo/addons/account/views/report_payment_receipt_templates.xml`, `odoo/addons/account/views/account_portal_templates.xml` |
| Down payments | Down-payment invoice creation is a sale-side wizard (`sale_make_invoice_advance`) that lands as an `account.move`; move side carries the down-payment flags | `odoo/addons/sale/wizard/sale_make_invoice_advance.py` (in this checkout's addons tree), move fields in `odoo/addons/account/views/account_move_views.xml` |

**BOSS implications.** Four lifecycle states repeat everywhere (draft → sent/posted → part-paid → paid, plus credited/void), shown as a status bar with explicit transitions in the Invoice screen header — including void/post modals (Carbon) and permission-gated posting. Mantle already has the states (`InvoiceInProcess` → `InvoiceFinalized` → `InvoiceSent` → `InvoiceAcked` → `InvoicePmtRecvd`, plus `InvoiceWriteOff` and `InvoiceCancelled`; payables `InvoiceIncoming` → `InvoiceReceived` → `InvoiceApproved` → `InvoicePmtSent`). Carbon and ERPNext derive "partly paid" and "overdue" from settlements and due date rather than storing them; Mantle allows the same derivation over `Invoice.unpaidTotal` and `dueDate`. Invoice lines in the references carry the standard unit/price/tax/discount columns; credits (Carbon's memo-applications panel, Dolibarr Avoir, ERPNext `make_sales_return`, Odoo reversal wizard) map onto Mantle's `InvoiceCreditMemo` type with `create#InvoiceCreditMemo` and `apply#InvoiceToInvoice`. The recurring/template-invoice list (Akaunting recurring invoices, Dolibarr `invoicetemplate_list`) and ERPNext's Subscription → generated invoices are the evidence for recurring invoicing, Accounting's emphasis in the subscriptions function that Sales and Commerce also include (crosscut §4); Mantle has `Subscription` and an unused `InvoiceTemplate` invoice type but no generator. The customer portal is a proven differentiator: a guest view on a signed URL with pay-online (Akaunting) — in BOSS one option is a reused invoice view/pay page that Commerce's store account and Accounting both include, reading the same invoices; payment-request emails with a gateway link (ERPNext) are its accelerator. Per-invoice PDF template selection (Akaunting's three templates, Ever Gauzy's accounting-templates, ERPNext print formats) favors template records seeded in data over hardcoded layouts.

---

## 5. Collections & dunning

### Akaunting — scheduled reminder emails only

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Schedule settings | **Send invoice reminder** with a comma list of days after the due date (and the same for bills), plus the run time; a daily command emails each unpaid invoice due that many days ago | `resources/views/settings/schedule/edit.blade.php`, `app/Http/Controllers/Settings/Schedule.php`, `app/Console/Commands/{InvoiceReminder,BillReminder}.php` |
| No dunning levels | No letter levels, fees or interest, no collections workbench; overdue invoices are found through the Unpaid tab | `resources/views/sales/invoices/index.blade.php` |

### AureusERP — **absent**

| Screen/page | What it is | Key files |
| --- | --- | --- |
| **Absent** | No dunning, follow-up or reminder module in any webkul plugin (no `account_followup` port) | — |

### Carbon — collections live in the receivables workbench (aging first, not letters)

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Receivables workbench | The ARAP workbench filtered to receivables: per-customer open-invoice groups with checkboxes, as-of aging buckets, bulk allocate/apply credit memos; no dunning schedule | `apps/erp/app/modules/invoicing/ui/Workbench/ARAPWorkbench.tsx`, route registry `apps/erp/app/modules/invoicing/ui/useInvoicingSubmodules.tsx` (name "Receivables") |
| Credit memos in collections | Credit-memo allocation panel as the informal "discount & forgive" tool | `apps/erp/app/modules/invoicing/ui/Memo/MemoApplicationsPanel.tsx` |

### Dolibarr — direct-debit batches + scheduled due-date reminders

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Direct debit (Prélèvement) | Bank-transfer pull collections: create-from-invoices batch (Sepa generation), pending demands, rejections list w/ card, per-line cards, statistics page | `htdocs/compta/prelevement/{create,demandes,factures,requests,rejets,fiche-rejet,line,list,orders_list,stats,index}.php`, admin `htdocs/admin/prelevement.php` |
| Overdue reminder | Scheduled job method that emails reminders for validated invoices N days before/after the due date with a chosen template, and records an agenda event per reminder so none is sent twice | `htdocs/compta/facture/class/facture.class.php` (`sendEmailsRemindersOnInvoiceDueDate`) |
| Disputes box | Invoice-dispute widget surfaces stuck payments on the dashboard | `htdocs/core/boxes/box_invoices_dispute.php` |

### ERPNext — a proper Dunning doctype (+ auto overdue streams)

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Dunning | Dunning document made from overdue invoices: overdue payment rows, interest and dunning fee, statuses Draft / Resolved / Unresolved / Cancelled, letter printed from the Dunning Letter print format | `erpnext/accounts/doctype/dunning/dunning.{js,json,py}`, `erpnext/accounts/print_format/dunning_letter/` |
| Dunning masters | Dunning Type (dunning fee, rate of interest, letter texts per language, income account, cost center) + letter texts | `erpnext/accounts/doctype/dunning_type/dunning_type.{js,json,py}`, `erpnext/accounts/doctype/dunning_letter_text/dunning_letter_text.{json,py}` |
| Overdue rows | Overdue payment rows (per payment-schedule term) carried on the dunning | `erpnext/accounts/doctype/overdue_payment/overdue_payment.{json,py}` |
| Statement of accounts batch | Scheduled mass emails of the Statement of Accounts per customer (passive collections) | `erpnext/accounts/doctype/process_statement_of_accounts/process_statement_of_accounts.{js,py}`, `erpnext/accounts/doctype/{process_statement_of_accounts_cc,process_statement_of_accounts_customer}/` |

### Frappe Lending — a collections case with promise-to-pay

- A lender's app (loans given out), but its collections records are the only case-style collections workflow in the checkouts.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Collection case | Per overdue loan: applicant, bucket, days past due, outstanding amount, assigned agent, next action date, status **Open / In Progress / Promise to Pay / Broken PTP / Hardship Requested / Resolved / Closed**, resolution reason, child tables of promises and activities | `lending/lending/loan_management/doctype/collection_case/` |
| Collection activity | Activity row: type (Call, SMS, Email, WhatsApp, Field Visit, Legal Notice, System Dunning), channel, agent, outcome (Answered, No Response, Promise to Pay, Dispute Raised, Paid, Refused, Number Unreachable), template, notes | `lending/lending/loan_management/doctype/collection_activity/` |
| Promise to pay | Promised date and amount, status Open / Kept / Broken / Partial, actual paid amount | `lending/lending/loan_management/doctype/promise_to_pay/` |
| Dunning rule and run | Rule per product/classification by days-past-due range with a cadence in days; scheduled dunning process | `lending/lending/loan_management/doctype/{dunning_rule,process_collection_dunning}/` |

### Ever Gauzy — **absent** (no credit-communication page in this checkout)

| Screen/page | What it is | Key files |
| --- | --- | --- |
| **Absent** | Invoice send/email resend exists but no dunning/credit-reminder flow; `forms of payment` are covered in §7 | `apps/gauzy/src/app/pages/invoices/invoice-send/` |

### metasfresh — dunning as a backend window + gateway SPI

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Dunning windows | Dunning run/letters are backend-defined windows (mass dunning process); no dedicated React surface | `backend/de.metas.dunning`, SPI `backend/de.metas.dunning_gateway.{api,spi}`, rendering shell `frontend/src/components/window/` |

### Odoo — follow-up module absent; debit notes & chatter as stopgaps

| Screen/page | What it is | Key files |
| --- | --- | --- |
| **Absent** | `account_followup` not in this community tree (Enterprise line-history match reminders) | — |
| Debit notes | Debit-note wizard creating corrective moves from an original (§18) | `odoo/addons/account_debit_note/` (wizard + views) |
| Activities-based chasing | Scheduled activities on overdue customers (mail module drives them) — no automatic matching | `odoo/addons/account/views/account_move_views.xml` (activity fields), `odoo/addons/account/models/account_move.py` (`activity_state`) |

**BOSS implications.** Collections split into three tiers: the *workbench* (aging buckets + open items by customer + credit-memo application, Carbon), *reminders* (Akaunting's days-after-due list, Dolibarr's scheduled reminder, Mantle's existing `send#SalesInvoicePastDueEmails` job) and the *letter engine* (levels with fee, interest and letter templates, ERPNext dunning/dunning_type). Frappe Lending adds the piece none of the ERPs have: a collections case with agent, next action date, activities with outcomes and promises to pay. One option is the aging workbench in Accounting's version of the reused Customer 360 plus a collections list per customer whose activities are ordinary BOSS activities (`WorkEffort`, crosscut §6) and whose promises to pay are dated follow-ups; dunning levels and letter templates would build on those. Direct-debit mass collection (Dolibarr `prelevement`) depends on a gateway. Odoo's `account_followup` is Enterprise and AureusERP and Ever Gauzy have nothing, so anything past reminders is a differentiator, not table stakes.

---

## 6. Bills & payables (AP)

### Akaunting — bill flow mirroring invoices

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Bill list/create/edit/show/print | Same Document engine as invoices with reversed semantics (paid/due, vendor bill PDF via single `print.blade.php` style) | `resources/views/purchases/bills/{index,create,edit,show,print}.blade.php`, controller `app/Http/Controllers/Purchases/Bills.php`, modals `resources/views/modals/documents/` |
| Recurring bills | Auto-draft schedule maintenance (same frequency/interval/limit form as AR recurring) | `resources/views/purchases/recurring_bills/`, controller `app/Http/Controllers/Purchases/RecurringBills.php` |
| Vendor master | Vendor CRUD with contacts & billing info feeding bill dropdowns | `resources/views/purchases/vendors/`, controller `app/Http/Controllers/Purchases/Vendors.php` |

### AureusERP — bill resources + vendor refunds

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Vendor bills | Vendors → Bills (Odoo `in_invoice` port) with Payments and Refunds (vendor credits); subclasses of the hidden base resources, mounted by both the `accounting` and `invoices` plugins | `plugins/webkul/accounting/src/Filament/Clusters/Vendors/Resources/{BillResource,RefundResource,PaymentResource}.php`, twin `plugins/webkul/invoices/src/Filament/Clusters/Vendors/Resources/{BillResource,RefundResource,PaymentResource}.php`, base `plugins/webkul/accounts/src/Filament/Resources/BillResource.php` (+ `BillResource/`) |

### Carbon — purchase invoices with OCR-style extraction & expense reimbursements

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Purchase invoice form | Header/line/properties/summary/mirror of the AR form, plus delivery (receipt) linkage and autofill hook | `apps/erp/app/modules/invoicing/ui/PurchaseInvoice/{PurchaseInvoiceForm,PurchaseInvoiceHeader,PurchaseInvoiceLineForm,PurchaseInvoiceDeliveryForm,PurchaseInvoiceProperties,PurchaseInvoiceSummary}.tsx`, `usePurchaseInvoiceAutoFill.ts` |
| Line extraction mapping | "Map extracted invoice lines" modal for mapping vendor-feature lines onto PO lines (auto-merge) | `apps/erp/app/modules/invoicing/ui/PurchaseInvoice/MapExtractedInvoiceLinesModal.tsx` |
| Post/void/status | PurchaseInvoicePostModal (journal+date), VoidModal, status chips, table + explorer | `apps/erp/app/modules/invoicing/ui/PurchaseInvoice/{PurchaseInvoicePostModal,PurchaseInvoiceVoidModal,PurchaseInvoicingStatus,PurchaseInvoicesTable,PurchaseInvoiceExplorer}.tsx` |
| Reimbursements | Employee expense → payable document (Draft → Posted → Voided): edit form, pay-expense modal, documents panel; imported from a spend tool, never hand-created; paid by a payment whose payee is the employee | `apps/erp/app/modules/invoicing/ui/Reimbursement/{ReimbursementEditForm,ReimbursementHeader,ReimbursementSummary,PayExpenseModal,ReimbursementDocuments,ReimbursementsTable}.tsx` |
| Charges | Company-card transactions (Charge, Credit, Payment, Cashback, Repayment) fed from the Ramp integration; read-only list and drawer with Void only | `apps/erp/app/modules/invoicing/ui/Charge/{ChargesTable,ChargeStatus}.tsx`, routes `apps/erp/app/routes/x+/invoicing+/{charges,charges.$id,charges.$id.void}.tsx` |
| Supplier credits | The one `memo` table filtered to supplier parties (direction Credit/Debit is independent of party) | `apps/erp/app/modules/invoicing/ui/Memo/MemosTable.tsx`, route `apps/erp/app/routes/x+/invoicing+/supplier-credits.tsx` |

### Dolibarr — fourn/facture + supplier document portal

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Supplier invoices | `htdocs/fourn/facture/card.php` — rich edit with create-from-supplier-order, reception-matched lines, payment status chips, per-bill documents/contacts/lifecycle info; list with filters & bulk PDF | `htdocs/fourn/facture/{card,list}.php`, per-bill `htdocs/fourn/facture/{document,contact,info}.php`, `htdocs/fourn/recap-fourn.php` |
| Supplier orders | Order card + bill-from-order conversion | `htdocs/fourn/commande/{card,list}.php` |
| Reception & templates | Reception steps and third-party purchase index | `htdocs/reception/`, `htdocs/fourn/index.php` |
| Supplier invoice generators | Numbering/doc generator modules for supplier invoices | `htdocs/core/modules/supplier_invoice/` |

### ERPNext — Purchase Invoice doctype

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Purchase invoice form | Mirror of Sales Invoice with `is_return` (debit note), update-stock, and a payment hold (`on_hold`, `release_date`, `hold_comment`); statuses Draft, Return, Debit Note Issued, Submitted, Paid, Partly Paid, Unpaid, Overdue, Cancelled, Internal Transfer | `erpnext/accounts/doctype/purchase_invoice/purchase_invoice.{js,json,py}`, children `erpnext/accounts/doctype/{purchase_invoice_item,purchase_invoice_advance,purchase_taxes_and_charges}/` |
| List filters & connections | List js, filters and connections dashboard | `erpnext/accounts/doctype/purchase_invoice/{purchase_invoice_list.js,list_filter/,purchase_invoice_dashboard.py}` |
| Debit notes | Debit note made from a submitted purchase invoice | `erpnext/accounts/doctype/purchase_invoice/mapper.py` (`make_debit_note`) |
| PO / receipt matching | Each bill line keeps its purchase order and receipt line (`purchase_order`, `po_detail`, `purchase_receipt`, `pr_detail`); Buying Settings can require a PO and/or a receipt before a bill; "Received Items To Be Billed" lists the gap | `erpnext/accounts/doctype/purchase_invoice_item/purchase_invoice_item.json`, `erpnext/buying/doctype/buying_settings/buying_settings.json` (`po_required`, `pr_required`), `erpnext/accounts/report/received_items_to_be_billed/` |

### Ever Gauzy — expense-centric AP

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Expenses | Expense add/list with vendor, category, employee/org/project selectors and receipts; expense categories page; feeds the income/expense dashboard pair (§1) | `apps/gauzy/src/app/pages/expenses/{expenses.component.ts,expense-categories/}`, dialogs `packages/ui-core/shared/src/lib/expenses/` |
| Vendor expense records | Expenses paid to vendor records flow as the AP-side entries (vendor picker on expense rows) | `apps/gauzy/src/app/pages/expenses/`, vendor selector `packages/ui-core/shared/src/lib/vendor-select/` |
| Recurring expenses | Org-level & employee-level recurring expense maintenance | `apps/gauzy/src/app/pages/expense-recurring/expense-recurring.component.ts`, `apps/gauzy/src/app/pages/recurring-expense-employee/recurring-expense-employee.component.ts` |
| Vendor master | Vendor list page feeding picker | `apps/gauzy/src/app/pages/vendors/vendors.component.ts` |

### metasfresh — vendor invoice windows (backend shells)

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Vendor invoice / bill windows | C_Invoice vendor-side + purchase-invoice candidate windows via the generic shell; no dedicated React | `frontend/src/components/window/`; window owners `backend/de.metas.adempiere.adempiere`, `backend/de.metas.fresh`, `backend/de.metas.einvoice.base` |

### Odoo — vendor bills inside account.move

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Bill views | in_invoice views inside the move monolith with `bill_guide` onboarding ("Upload your supplier bills") and the PDF/bill preview panel | `odoo/addons/account/views/account_move_views.xml`, `odoo/addons/account/static/src/components/bill_guide/`, `odoo/addons/account/views/bill_preview_template.xml` |
| Autoposting bills | After several unmodified bills from one vendor, a prompt asks whether to auto-post that vendor's bills (always / ask later / never) | `odoo/addons/account/wizard/{account_autopost_bills_wizard.py,account_autopost_bills_wizard.xml}` |
| Accrued expenses / orders | "Make Accrual Entries" wizard creating accrued revenue/expense entries from sale or purchase orders | `odoo/addons/account/wizard/{accrued_orders.py,accrued_orders.xml}` |
| Bill ↔ PO matching | "Purchase Bill Lines" list pairing bill lines with PO lines (Bill Qty, Qty to invoice, Billed vs Purchased) with **Match** and **Add to PO**; product Control Policy bills on ordered or received quantities; the 3-way-matching setting is an Enterprise upsell (`module_account_3way_match`) | `odoo/addons/purchase/views/purchase_bill_line_match_views.xml`, `odoo/addons/purchase/models/product.py` (`purchase_method`), `odoo/addons/purchase/views/res_config_settings_views.xml` |

**BOSS implications.** AP is AR reversed: same state model (draft→posted→paid; Mantle `InvoiceIncoming` → `InvoiceReceived` → `InvoiceApproved` → `InvoicePmtSent`), same line editor, plus AP-only features: matching bill lines to PO and receipt lines (Odoo Purchase Bill Lines, ERPNext `po_detail`/`pr_detail` with PO/receipt-required settings, Carbon's MapExtractedInvoiceLinesModal) — the supplier invoices & 3-way match function, which Accounting includes for AP bills and Purchasing for match exceptions and holds (crosscut §4); a payment hold with release date (ERPNext); and employee reimbursements as a payable (Carbon). In the expense-claims function People's version emphasizes capture and approval and Accounting's posting and payment, which in Mantle is an expense `Invoice` from the employee (`MyAccount/Expense` screens, `create#ProjectExpenseInvoice`) paid like any bill. Akaunting gives the vendor symmetric CRUD but no vendor portal. The references suggest a visible "schedule for payment" step on the bill screen feeding the §7 payment run, and `InvoiceApproved` is the bill-approval item that appears in the header Approvals list.

---

## 7. Payments & payment runs

### Akaunting — transactions ledger + transfers + (empty) gateway modules

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Transactions | Money-in/out ledger list with type filters & monthly/annual grouping, batch actions, create/edit/show/print, CSV import screen | `resources/views/banking/transactions/{index,create,edit,show,print_default,import}.blade.php`, controller `app/Http/Controllers/Banking/Transactions.php` |
| Transfers between accounts | Transfer doc with three print variants (voucher/cheque-like) | `resources/views/banking/transfers/{index,create,edit,show,print_default,print_second,print_third}.blade.php`, controller `app/Http/Controllers/Banking/Transfers.php` |
| Recurring transactions | Scheduled auto transactions (same recurring engine) | `resources/views/banking/recurring_transactions/`, controller `app/Http/Controllers/Banking/RecurringTransactions.php` |
| Add-payment modal | Payment capture dialog from invoice/bill document with split of amount & date | `resources/views/modals/documents/payment.blade.php` (+ `item_columns.blade.php`), portal twin `resources/views/portal/payments/` |

### AureusERP — PaymentResource ×2 + minimal payments plugin

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Account payments | Customers → Payments and Vendors → Payments (Odoo `account.payment` port), subclasses of one hidden base resource; the `invoices` plugin mounts the same pair | `plugins/webkul/accounting/src/Filament/Clusters/{Customers,Vendors}/Resources/PaymentResource.php`, `plugins/webkul/invoices/src/Filament/Clusters/{Customers,Vendors}/Resources/PaymentResource.php`, base `plugins/webkul/accounts/src/Filament/Resources/PaymentResource.php` |
| Payments plugin | Models only (Payment, PaymentToken, PaymentTransaction, payment methods migration); no Filament screens in this checkout | `plugins/webkul/payments/src/{PaymentPlugin.php,PaymentServiceProvider.php,Models/}` |

### Carbon — payment as settlement document with an application workbench

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Payment doc | PaymentForm/Header/Status: direction Receipt or Disbursement; exactly one payee — customer, supplier or employee (a reimbursement payout); status Draft / Posted / Voided; documents panel, per-invoice payments panel; post and void routes | `apps/erp/app/modules/invoicing/ui/Payment/{PaymentForm,PaymentHeader,PaymentStatus,PaymentDocuments,InvoicePaymentsPanel,PaymentsTable}.tsx`, routes `apps/erp/app/routes/x+/payments+/{$paymentId,$paymentId.post,$paymentId.void,$paymentId.applications.set,$paymentId.credits.set}.tsx` |
| Application/applied credits | PaymentApplyTable + PaymentApplications: apply a payment across invoices and memos with an "available credit" pool, per-application discount and write-off, generated FX gain/loss; a zero-amount payment can be a pure credit application | `apps/erp/app/modules/invoicing/ui/Payment/{PaymentApplyTable,PaymentApplications,AvailableCreditsTable,useSettlementDocuments}.tsx`, settlement logic `apps/erp/app/modules/invoicing/invoicing.service.ts` (`replaceInvoiceSettlements`) |
| Payment runs | No scheduled payment-run engine; pay-run-like batches happen on workbench selection (Payables, with an adjust action) | `apps/erp/app/modules/invoicing/ui/Workbench/ARAPWorkbench.tsx`, routes `apps/erp/app/routes/x+/invoicing+/{payables,payables.adjust,receivables,receivables.adjust}.tsx` |

### Dolibarr — paiement CRUD + cheque deposits

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Customer payments | paiement list/card (multi-invoice allocation grid: amount column per line), "to validate" queue (`tovalidate.php`), documents/infos, monthly report (`rapport.php` with print) | `htdocs/compta/paiement/{list,card,tovalidate,document,info,index,rapport}.php`, quick-create from doc `htdocs/compta/paiement.php` |
| Supplier payments | fourn/paiement list/card (bill allocations) + docs | `htdocs/fourn/paiement/{list,card,document,info}.php` |
| Cheque deposit | Deposit card building bank entries from batched cheque payments | `htdocs/compta/paiement/cheque/{card,list,index}.php`, classes `htdocs/compta/paiement/class/{paiement,cpaiement}.class.php` |
| Tax and charge payments | Payment pages for social contributions and VAT | `htdocs/compta/{paiement_charge,paiement_vat}.php` |

### ERPNext — Payment Entry + the reconciliation workhorse

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Payment Entry | Payment type Receive / Pay / Internal Transfer: references table (invoices/orders auto-pulled), unallocated amount and deductions/write-off rows, taxes, exchange gain/loss per reference, bank charges; status Draft / Submitted / Cancelled | `erpnext/accounts/doctype/payment_entry/payment_entry.{js,json,py}` (+ `payment_entry_list.js`), children `erpnext/accounts/doctype/{payment_entry_reference,payment_entry_deduction}/` |
| Payment reconciliation | Allocate invoices ↔ payments for one party and receivable/payable account: date and amount filters, fetch outstanding, auto-allocate + manual allocation grid with difference amount | `erpnext/accounts/doctype/payment_reconciliation/payment_reconciliation.{js,json,py}` |
| Payment orders/schedule | Payment Order (type Payment Request or Payment Entry: a batch of references to pay from one company bank account) | `erpnext/accounts/doctype/payment_order/payment_order.{js,json,py}`, `erpnext/accounts/doctype/payment_order_reference/` |
| Modes & gateways | Mode of Payment with accounts per company; Payment Gateway Account; gateway implementations live in the separate Frappe `payments` app (below) | `erpnext/accounts/doctype/mode_of_payment/mode_of_payment.{js,json,py}`, `erpnext/accounts/doctype/payment_gateway_account/payment_gateway_account.{js,json,py}` |

### Frappe payments — gateway settings and hosted checkout pages

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Gateway settings | One settings doctype per provider: Braintree, GoCardless (+ mandate), M-Pesa, Paymob, PayPal, Paytm, Razorpay, Stripe; a generic Payment Gateway record links them to ERPNext's Payment Gateway Account | `payments/payments/payment_gateways/doctype/`, `payments/payments/payments/doctype/payment_gateway/` |
| Checkout pages | Hosted checkout pages per provider plus shared success / failed / cancel pages | `payments/payments/templates/pages/` (e.g. `stripe_checkout.html`, `gocardless_confirmation.html`, `payment-success.html`) |

### Dolibarr community modules — card/SEPA gateway back offices

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Stancer back office | Payments, payouts, refunds and disputes lists, a bookkeeping page, payout-reversal import check, audit and repair pages; public card and SEPA-IBAN payment pages for invoices and proposals; admin for card, SEPA, mail, accounting accounts | `stancer/stancer_{payments_list,payouts_list,refunds_list,disputes_list,bookkeeping,import_check_reversements,audit}.php`, `stancer/public/{newpayment,newpayment_propal,sepa-iban,paymentback}.php`, `stancer/admin/{setup,cb,sepa,compta}.php` |
| HelloAsso | Online checkout of membership dues, donations, customer invoices or orders through the HelloAsso API | `helloasso/helloassoindex.php`, `helloasso/admin/` |

### Ever Gauzy — payment capture on invoices (Stripe-side)

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Payments page | Org-level payments list (per invoice/customer) w/ date filters & totals; add payment dialog partially from invoice | `apps/gauzy/src/app/pages/payments/payments.component.ts`, invoice-scoped `apps/gauzy/src/app/pages/invoices/invoice-payments/` |
| Estimate payments | Estimate-invoice conversions with per-task payments — not part of this pass (§4) | `apps/gauzy/src/app/pages/invoices/invoice-estimates/` |

### metasfresh — payment allocation flow + payment adapter windows

| Screen/page | What it is | Key files |
| --- | --- | --- |
| PaymentAllocation components | Header + amount indicator for the "Invoice to allocate" allocation workflow (allocation, diff-reason, writeoff folds live in backend processes) | `frontend/src/components/paymentAllocation/{InvoiceToAllocateViewHeader.js,AmountIndicator.js}` |
| Payment adapters/windows | de.metas banking payment windows + SEPA/ESR/PayPal/Revolut/SumUp payment adapter backends (banking windows render through generic shell) | `backend/de.metas.banking`, `backend/de.metas.payment.{sepa,esr,paypal,revolut,sumup}` (+ `de.metas.payment.sumup.rest-api`) |

### Odoo — payment register wizard + payment/payment provider pages

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Payment document | `account.payment` views (list/tree with partner/amount/status, payments from moves) | `odoo/addons/account/views/account_payment_view.xml` |
| Register payment wizard | Bulk "Register Payment" wizard from selected move lines — flexible journal, payment difference handling (in/out), write-off dialog, multi term checks | `odoo/addons/account/wizard/account_payment_register.py` + `odoo/addons/account/wizard/account_payment_register_views.xml` |
| Providers & tokens | payment provider list/form (states, token setup, journal mapping), saved tokens & transactions (all MVC views) + express checkout templates | `odoo/addons/payment/views/payment_provider_views.xml`, `odoo/addons/payment/views/payment_token_views.xml`, `odoo/addons/payment/views/payment_transaction_views.xml`, `odoo/addons/payment/views/express_checkout_templates.xml` |
| Portal pay page | payment portal templates (pay-in link UI) & account_payment portal glue | `odoo/addons/payment/views/portal_templates.xml`, `odoo/addons/account_payment/views/` |
| Check printing | Check layout setting, check numbers on journals and payments, print checks from payments | `odoo/addons/account_check_printing/views/{account_payment_views,account_journal_views,res_config_settings_views}.xml` |

**BOSS implications.** One mental model recurs: a *Payment* document with a direction (receipt / disbursement, plus internal transfer in ERPNext), an allocation table against open invoices/bills, and per-application discount, write-off & FX — Carbon's `PaymentApplyTable`/`useSettlementDocuments` and ERPNext Payment Entry references; the evidence favors making that allocation grid the center of the Payment screen. Mantle already has this shape (`Payment` + `PaymentApplication`, `apply#InvoicePayment`, `apply#PaymentToPayment`, `autoApply#Payment`, `unapply#PaymentApplication`) and the baseline Edit Payment screen shows unpaid invoices and unapplied payments beside the applications (§17). Dolibarr's `tovalidate` queue shows a two-step payment flow (entered → validated → posted) a candidate permission divider. Payment-run/batch scheduling is rarer than expected (ERPNext Payment Order; Carbon only by workbench selection) — one option is a simple "Payment Run" generator over approved bills that writes `Payment` rows and hands them to the existing Bulk Checks, NACHA and Positive Pay outputs. The references keep gateways at the provider-records level (Odoo `payment` addon, Frappe payments, Stancer), which lets online pay pages grow without rework; Mantle has `PaymentGatewayConfig` and authorize/capture/refund services for this.

---

## 8. Banking & reconciliation

### Akaunting — bank accounts + a dedicated reconciliation screen

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Bank accounts | Account (bank/cash) CRUD with opening balance, currency, account number; show page lists the account's transactions | `resources/views/banking/accounts/{index,create,edit,show}.blade.php`, controller `app/Http/Controllers/Banking/Accounts.php` |
| Reconciliations | Pick account + start/end date and closing balance → list of transactions (deposits/withdrawals) with a clear checkbox each; running opening balance, cleared amount, closing balance and difference; Save Draft or Reconcile when the difference is zero; create/edit/index screens | `resources/views/banking/reconciliations/{index,create,edit}.blade.php`, controller `app/Http/Controllers/Banking/Reconciliations.php` |
| Bank feeds | No feed in core: the Bank Feeds widget links to a paid cloud app | `app/Widgets/BankFeeds.php`, `resources/views/widgets/bank_feeds.blade.php` |

### AureusERP — bank accounts only, no reconciliation engine

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Bank accounts | Bank account CRUD (journal-linked, account number, currency); in the `invoices` plugin's Configuration cluster, base resource in `accounts` | `plugins/webkul/invoices/src/Filament/Clusters/Configuration/Resources/BankAccountResource.php`, base `plugins/webkul/accounts/src/Filament/Resources/BankAccountResource.php` |
| Reconciliation | **Absent** — no statement-matching screen in this version; reconciliation state rides on payments/journal-item fields only | — |

### Carbon — no banking module; reconciliation via tie-out panel only

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Sync tie-out | Per account and period, Carbon's balance against the connected external ledger (Xero, QuickBooks, Rillet); shown only when an accounting integration is active | `apps/erp/app/modules/accounting/ui/SyncTieOut/SyncTieOutTable.tsx`, routes `apps/erp/app/routes/x+/accounting+/{sync-tieout,sync-tieout.$cellId}.tsx` |
| Dashboard tie-out | AR and AP subledger balance vs GL control-account balance, variance flagged (§1) | `apps/erp/app/modules/invoicing/ui/Dashboard/InvoicingDashboard.tsx` (`TieOut`) |
| Bank accounts | Only customer and supplier bank details (for payments), no company bank-account register | `apps/erp/app/modules/sales/ui/Customer/CustomerBankAccounts.tsx`, `apps/erp/app/modules/purchasing/ui/Supplier/SupplierBankAccounts.tsx` |
| Statement import/feeds | **Absent** in this checkout (no bank-statement screens) | — |

### Dolibarr — bank journal is a browsable ledger with per-line matching

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Bank accounts & entries | Bank account card/list; the main `bankentries_list.php` linear ledger with editable lines, reconciliation checkbox columns (rappro), third-party/type filters, quick new-entry row; `releve.php` printable statement; dashboard graphs `bilan.php`/`graph.php` | `htdocs/compta/bank/{card,list,bankentries_list,releve,bilan,graph,categ,transfer,treso}.php` |
| Statement document | Upload/attach bank statement PDF against account | `htdocs/compta/bank/account_statement_document.php` |
| Cheque/transfer in-paths | Cheque deposit flow (§7) feeding entries; accounts listing `list.php` | `htdocs/compta/paiement/cheque/card.php`, `htdocs/compta/bank/list.php` |

### ERPNext — bank accounts/transactions/rules + statement import + tool

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Bank account layers | Bank (record per physical bank), Bank Account (per bank GL/IBAN/subtype), balance history (`bank_account_balance`) | `erpnext/accounts/doctype/bank/bank.{js,json,py}`, `erpnext/accounts/doctype/bank_account/bank_account.{js,json,py}`, `bank_account_balance/` |
| Bank statement import | Upload/import bank statements (bank_statement_import + logs w/ column mapping) generating Bank Transactions | `erpnext/accounts/doctype/bank_statement_import/bank_statement_import.{js,css,py}` (+ `bank_statement_import_list.js`), `bank_statement_import_log/` |
| Bank transactions & rules | Bank Transaction doc (transaction type, amounts, party autofit), auto-match-party hook, upload helper; rules engine with description conditions & account mapping (auto reconcile via rules) | `erpnext/accounts/doctype/bank_transaction/{bank_transaction.js,bank_transaction_list.js,bank_transaction_upload.py,auto_match_party.py}`, `erpnext/accounts/doctype/bank_transaction_rule/bank_transaction_rule.{js,json,py}` (+ `_accounts`, `_description_conditions`, `bank_transaction_mapping/`) |
| Bank reconciliation tool | Legacy/manual reconciliation page matching unmatched transactions to payments & entries (whole-transaction matching UI) | `erpnext/accounts/doctype/bank_reconciliation_tool/bank_reconciliation_tool.{js,json,py}` |
| Cash side | Bank Clearance (sequence of entries with running balance) + cashier closing drawer | `erpnext/accounts/doctype/bank_clearance/bank_clearance.{js,json,py}`, `erpnext/accounts/doctype/cashier_closing/…` |

### Ever Gauzy — **absent**

| Screen/page | What it is | Key files |
| --- | --- | --- |
| **Absent** | No bank accounts/statements; payment capture only (§7) | — |

### metasfresh — banking module backends render through the generic window

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Banking windows | Bank/statement/payment windows (statement line import feeding the payment-allocation flow) via generic shell | `frontend/src/components/window/`; owners `backend/de.metas.banking`, `backend/de.metas.payment.esr` (Swiss inbound matching) |

### Odoo — bank statements and reconcile models; the matching widget is Enterprise

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Bank statement views | account.bank.statement list/form with starting and ending balance; rows flagged red when the statement is not complete (lines do not reach the real ending balance) or not valid; reconcile models maintained separately | `odoo/addons/account/views/account_bank_statement_views.xml`, `odoo/addons/account/views/account_full_reconcile_views.xml`, `odoo/addons/account/views/account_reconcile_model_views.xml` (reconcile model maintenance) |
| Partner bank | `res.partner.bank` views + `many2many_tags_banks`/`manyone_banks`/`auto_save_res_partner_bank` OWL components (IBAN UX) | `odoo/addons/account/views/res_partner_bank_views.xml`, `odoo/addons/account/static/src/components/{many2many_tags_banks,manyone_banks,auto_save_res_partner_bank}/` |
| Reconciliation widget | **Absent in community** — the bank-reconciliation matching widget ships with the Enterprise `account_accountant`; community keeps statements+models only | §18 |

**BOSS implications.** Banking splits into three building blocks everywhere: (1) bank-account master w/ opening balance & currency (Akaunting, Dolibarr, ERPNext, AureusERP), (2) a ledger-browsable statement surface — Dolibarr's `bankentries_list` with inline matching columns is the single best reference for a Moqui XML screen, (3) matching/reconciliation (ERPNext statement import → rule-based auto-match → manual tool; Akaunting's clear-checkbox screen with a zero-difference rule). The Moqui baseline is further along than any community reference except ERPNext: bank accounts are `PaymentMethod` + `BankAccount` with GL account and ledger balance, and the payment-method transactions screen imports BAI2 and OFX statements into `PaymentMethodTrans`, auto-matches them (**Match and Reconcile**), and offers manual reconcile, no-reconcile and unreconcile (§17). The evidence favors that model plus a real statement-session header (period, closing balance, difference — Akaunting), matching rules (ERPNext Bank Transaction Rule), and a visible queue for unmatched lines (Dolibarr's suspense-account box). The Odoo reconcile widget is Enterprise; nothing in the community set needs a bespoke widget beyond a two-sided match list.

---

## 9. Period close & locks

### Akaunting / Ever Gauzy — **absent**

| Screen/page | What it is | Key files |
| --- | --- | --- |
| **Absent** | No period/fiscal-locks concept anywhere in either suite | — |

### AureusERP — **absent** beyond fiscal positions

| Screen/page | What it is | Key files |
| --- | --- | --- |
| **Absent** | No period close/lock screens in the accounts/accounting plugins | — |

### Carbon — periods table driving close

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Periods table | Fiscal periods grid (open/closed per year & month), generate periods, close and delete actions | `apps/erp/app/modules/accounting/ui/Periods/PeriodsTable.tsx`, routes `apps/erp/app/routes/x+/accounting+/{periods,periods.generate,periods.$periodId.close,periods.$periodId.delete}.tsx` |
| Pre-close checklist popover | "Unposted documents in period" popover listing blocking docs before closing | `apps/erp/app/modules/accounting/ui/Periods/PeriodCloseUnpostedDocumentsPopover.tsx` (tests `apps/erp/app/modules/accounting/accounting.periods.test.ts`) |
| Period runs | Depreciation, lease and revenue-recognition runs are listed under Closing beside the periods (§15) | `apps/erp/app/modules/accounting/ui/PeriodRunDocuments.tsx`, `apps/erp/app/routes/x+/accounting+/period-runs.server.ts` |

### Dolibarr — single closure screen + per-fiscalyear close

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Bookkeeping closure | "Closure" action page: validate all unrecorded movements, close the fiscal period, insert accounting reversal entries (per the accountancy closure setup in admin) | `htdocs/accountancy/closure/index.php`, closure setup options `htdocs/accountancy/admin/closure.php` |
| Fiscal year end rules | fiscalyear pages with per-year closure fields (§2) | `htdocs/accountancy/admin/fiscalyear*.php` |

### ERPNext — accounting period gates + closing voucher chain

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Accounting Periods | Period master (name, start/end, company, disabled) with a table of closed document types and an exempted role | `erpnext/accounts/doctype/accounting_period/accounting_period.{js,json,py}` |
| Period closing voucher | Year-end closing: `account_closing_balance` snapshot generating journal entry; process helper queues the work in background | `erpnext/accounts/doctype/period_closing_voucher/period_closing_voucher.{js,json,py}`, `process_period_closing_voucher/`, closing balances `account_closing_balance/` |
| Freeze date and immutable ledger | Per company: accounts frozen till date and the role allowed to post frozen entries; Accounts Settings: **Enable Immutable Ledger** (cancellation entries post on the actual cancellation date and reports include cancelled entries) | `erpnext/setup/doctype/company/company.json` (`accounts_frozen_till_date`, `role_allowed_for_frozen_entries`), `erpnext/accounts/doctype/accounts_settings/accounts_settings.json` (`enable_immutable_ledger`) |
| Repost hygiene | Repost queue doctypes monitoring day-end consistency repairs (see §3) | `erpnext/accounts/doctype/repost_accounting_ledger/` |

### metasfresh — period control in the core AD model

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Period control | C_Period/C_PeriodControl windows (open/closed/hard-close per table) opened through the generic shell | generic shell `frontend/src/components/window/`; backend `backend/de.metas.adempiere.adempiere` (legacy `PeriodClosedException` flow), GL posting gates in `backend/de.metas.acct.base` |

### Odoo — lock dates + hard lock, with a legal override registry

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Lock dates | Company-level `fiscalyear_lock_date`, `tax_lock_date`, `sale_lock_date`, `purchase_lock_date`, `hard_lock_date` (UI in company form & settings) | `odoo/addons/account/models/company.py`, `odoo/addons/account/views/res_company_views.xml`, `odoo/addons/account/views/res_config_settings_views.xml` |
| Lock exceptions | `ir.lock.exception` registry letting approved users post into locked windows until a date | `odoo/addons/account/views/account_lock_exception_views.xml`, models tie-in `odoo/addons/account/models/account_move.py` |
| Entry immutability | Secure-entries wizard hashing posted entries (anti-tamper) | `odoo/addons/account/wizard/account_secure_entries_wizard.py` |

**BOSS implications.** Close is a *period status + checklist + gate*, not one big screen: Carbon's periods table + unposted-documents popover models a candidate Moqui screen (period grid, pre-close validation list). Mantle already has the period and the close: fiscal `TimePeriod` rows with `isClosed`, and `close#FinancialTimePeriod`, `reopen#FinancialTimePeriod`, `create#PeriodCloseAcctgTrans` behind the baseline **Accounts** view of a time period (§17). Odoo's lock-date axes (all entries, tax, sales, purchases, hard lock) plus lock exceptions, and ERPNext's per-document-type closed periods with an exempt role, are what Mantle lacks: today a period is open or closed for everything. A per-type lock and an exception record would be new; the posted-entry hash (Odoo secure entries) depends on a hard lock.

---

## 10. Tax & e-invoicing compliance

- Tax screens come in two shapes: per-rate master (Akaunting/AureusERP/ERPNext templates) vs declaration drafts (Dolibarr's VAT menus, Odoo report tags). E-invoicing is add-on tier everywhere.

### Akaunting — flat tax rates + percentages grouping

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Taxes CRUD | Flat rate list (name/rate/type incl. compound), create/edit; assignable to items & documents | `resources/views/settings/taxes/{index,create,edit}.blade.php`, controller `app/Http/Controllers/Settings/Taxes.php`, modal `resources/views/modals/taxes/` |
| Document tax grid | Document-level tax summary block (name/rate/amount columns) + totals on invoice/bill forms | `resources/views/components/documents/form/{tax-rate,totals}.blade.php`, show-side `resources/views/components/documents/show/` |

### AureusERP — Odoo-ported Tax & TaxGroup resources

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Taxes | Configuration → Taxes (rate scopes, distribution for invoice/refund repartition lines) and Tax Groups | `plugins/webkul/accounting/src/Filament/Clusters/Configuration/Resources/{TaxResource,TaxGroupResource}.php`, base `plugins/webkul/accounts/src/Filament/Resources/{TaxResource,TaxGroupResource}.php` |
| Fiscal positions (tax switching) | Country/city mapping switching tax accounts & taxes per document (§2) | `plugins/webkul/accounts/src/Filament/Resources/FiscalPositionResource.php` |

### Carbon — no standalone tax screens; tax inside documents

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Tax handling | Tax percent and amount per invoice line and a tax total in the invoice summary; journal-entry lines have no tax field; no tax-rate master screen or route | `apps/erp/app/modules/invoicing/ui/SalesInvoice/{SalesInvoiceLineForm,SalesInvoiceSummary}.tsx` |

### Dolibarr — the full declaration workspace

| Screen/page | What it is | Key files |
| --- | --- | --- |
| VAT declarations | Main VAT ledger (list/card with payment month deadlines), payments page, per-client turnover reports (`clients.php`), declarations detail/norms | `htdocs/compta/tva/{index,card,list,payments,clients,document,info}.php`, paid-through `htdocs/compta/payment_vat/` |
| Quadri detail (declaration lines) | Detail per rate/product for periodic declaration printing (incl. `quadri` variants) | `htdocs/compta/tva/quadri_detail.php` (+ sibling `initdatesforvat.inc.php`) |
| Local taxes | `localtax` pages (same pattern per local tax type) | `htdocs/compta/localtax/{index,card,list,clients,quadri_detail}.php` |
| Social contributions | Sociales contributors (payroll-tax analog) with their own payment pages | `htdocs/compta/sociales/`, payments via `htdocs/compta/paiement_charge.php` |
| Intrastat/report feeds | European tax report tooling | `htdocs/intracommreport/` |

### Dolibarr community modules — French e-invoicing access point; KSeF stub

| Screen/page | What it is | Key files |
| --- | --- | --- |
| E-invoicing module | Connects to a certified French access point ("Plateforme Agréée"): e-invoice document list/cards (with notes, contacts, agenda, files tabs), per-invoice tracking with the lifecycle statuses (local: not generated, generated, awaiting validation, awaiting acknowledgement, error; platform: deposited, issued, received, available, taken over, approved, partially approved, disputed, suspended, completed, refused, payment sent, paid, rejected), API call log, XML preview, pending-sync queue, product and vendor-reference mapping; refuses to generate a 0 % VAT line without an exemption reason (EN 16931 BT-121) | `einvoicing/{document_list,document_card,document_note,document_contact,document_agenda,document_document,einvoice_tracking,call_list,call_card,xmlpreview,sync_pending_list,product_mapping,vendorref_list}.php`, statuses `einvoicing/class/einvoicing.class.php` |
| KSeF (Poland) | **Metadata only** in this checkout (README + index.yaml describing an external repository, no code) | `ksef/{README.md,index.yaml}` |

### ERPNext — tax templates/withholding + regional e-invoice modules

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Items/sales/purchase tax templates | item_tax_template (+detail), sales & purchase taxes-and-charges templates driving default document taxes; tax_category wrapper | `erpnext/accounts/doctype/item_tax_template/item_tax_template.{js,json,py}`, `erpnext/accounts/doctype/sales_taxes_and_charges_template/…`, `erpnext/accounts/doctype/tax_category/…` |
| Withholding | tax_withholding_category (+rates & entries) & per-party accounts | `erpnext/accounts/doctype/tax_withholding_category/tax_withholding_category.{js,json,py}` (+ `_rate`, `_entry`) |
| Tax rules & setting | tax_rule (priority/shipping rules composition) + accounts_settings tax-related toggles | `erpnext/accounts/doctype/tax_rule/tax_rule.{js,json,py}`, `erpnext/accounts/doctype/accounts_settings/` |
| Italy e-invoice | E-invoice XML payload builders + setup hooks (regional package activated per company country) | `erpnext/regional/italy/{setup.py,utils.py,e-invoice.xml}` |
| Other regions | Regional overrides load: australia, south_africa, turkey, uae, us | `erpnext/regional/{australia,south_africa,turkey,united_arab_emirates,united_states}/` |

### Ever Gauzy — tax rates are org settings

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Org tax settings | VAT/tax id fields and default tax rates in organization settings, feeding invoice tax columns *(unverified field list)* | `apps/gauzy/src/app/pages/organizations/edit-organization/edit-organization-settings/` (see §14) |

### metasfresh — e-invoice gateway modules, no tax screens

| Screen/page | What it is | Key files |
| --- | --- | --- |
| E-invoice module | `de.metas.einvoice.base` owns invoice EDI config/DOIs (backend windows); DATEV export interface lives beside it | `backend/de.metas.einvoice.base`, `backend/de.metas.datev` |

### Odoo — the EDI framework is the star

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Taxes UI | account_tax views (rate grids with distribution for invoice & credit-note repartition), tax groups widget (`many2x_tax_tags`), tax rounding/repartition via `account_tax_repartition_line_factor_percent` component; python-code-defined taxes via `account_tax_python` | `odoo/addons/account/views/account_tax_views.xml`, `odoo/addons/account/static/src/components/{many2x_tax_tags,tax_autocomplete,account_tax_repartition_line_factor_percent}/`, `odoo/addons/account_tax_python/` |
| EDI framework | `account_edi` base: CRON send/receive, EDI documents & format dispatch UI; `account_edi_ubl_cii` (UBL/CII builders), `account_edi_proxy_client` (operator proxy), `account_peppol` (network enrollment UI) | `odoo/addons/account_edi/views/`, `odoo/addons/account_edi_ubl_cii/`, `odoo/addons/account_edi_proxy_client/`, `odoo/addons/account_peppol/` |
| QR codes & country EDIs | Payment QR codes (SEPA & EMV) and per-country EDI bundles | `odoo/addons/account_qr_code_sepa/`, `odoo/addons/account_qr_code_emv/`, Italian EDI bundle `odoo/addons/l10n_it_edi` (+ `odoo/addons/l10n_it_edi_sale`, `odoo/addons/l10n_it_edi_doi`) |
| Fetch external e-invoices | `fetch_einvoices`/`account_file_uploader` component pair (pull inbound e-invoices on dashboard) | `odoo/addons/account/static/src/components/{fetch_einvoices,account_file_uploader}/` |

**BOSS implications.** The references suggest a master-plus-declaration split for tax: tax-rate master with per-document tax grid (Akaunting/AureusERP style) and a declaration draft screen fed by tax-per-line tables — Dolibarr's `htdocs/compta/tva/quadri_detail.php` is the clearest reference for a Moqui XML declaration screen, and its VAT payments page is another candidate. Mantle has tax authorities (`TaxAuthority`, `TaxAuthorityCategory`, `TaxAuthorityParty`, `TaxAuthorityAssoc`, `TaxAuthorityGlAccount`) and tax statements (`TaxStatement`, 1099-MISC) but **no tax-rate record**: `TaxAuthorityRate` exists only inside an XML comment ("Using a Drools Decision Table instead of this"), and no decision table ships in the checkout. Rates come from a tax gateway: `ProductStore.taxGatewayConfigId` → `TaxGatewayConfig.calculateServiceName`, a service implementing the `calculate#SalesTax` interface that returns rate, amount and authority per item; `calculate#OrderSalesTax` writes them as `ItemSalesTax` order items with `sourcePercentage` and `taxAuthorityId`. The only gateway seeded, `LOCAL` (`calculate#SalesTaxLocal`), is a stub that logs "not yet implemented", and `calculate#InvoiceSalesTax` is an empty TODO. So out of the box Mantle computes no tax, and there are no tax screens (§17). Tax screens depend first on a rate source — a local rate table behind the `LOCAL` gateway, or an external gateway (Open questions) — and then on authority maintenance and a tax-statement list. For e-invoicing the references favor an outbound document record with a lifecycle status (the einvoicing module's tracking statuses are a ready list) and a format dispatch layer rather than country hardcoding — Odoo's layered `account_edi` stack is the closest template; Mantle's `InvoiceSystemMessage` is the existing outbound link (the baseline Edit Invoice screen also calls `mantle.edi.account.X12InvoiceServices.produce#Invoice`, which is not in this checkout). Inbound e-invoice fetching is a proven small screen (Odoo `fetch_einvoices`).

---

## 11. Budgets & forecasts

### Akaunting / AureusERP / Carbon / metasfresh — **absent**

| Screen/page | What it is | Key files |
| --- | --- | --- |
| **Absent** | No budget/forecast screen in Akaunting, AureusERP or Carbon; metasfresh's React shell has none and its backend windows were not checked *(unverified)* | — |

### Ever Gauzy — client and project budget reports

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Budget reports | Client budgets and project budgets reports (spend against the budget set on a client or project), not a GL budget | `apps/gauzy/src/app/pages/reports/{client-budgets-report,project-budgets-report}/` |

### Dolibarr — cash-flow forecast page only

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Bank budget/forecast | Previsional cash budget: future income/expense by month with running balance per account | `htdocs/compta/bank/budget.php` |
| Loan schedules | Loan principal+interest schedule pages (planned payments as forecast lines) | `htdocs/loan/` |

### ERPNext — full Budget doctype + variance reporting

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Budget | Budget against a Cost Center or Project, one account and amount over a fiscal-year range, distributed equally or by a distribution; for each of material requests, purchase orders, actual expenses and cumulative expense, an annual and an accumulated-monthly action of Stop / Warn / Ignore; revisions (`revision_of`) | `erpnext/accounts/doctype/budget/budget.{js,json,py}`, `erpnext/accounts/doctype/{budget_account,budget_distribution,monthly_distribution,monthly_distribution_percentage}/` |
| Variance reporting | Budget Variance report + the budget-variance dashboard chart source (§1) | `erpnext/accounts/report/budget_variance_report/`, `erpnext/accounts/dashboard_chart/budget_variance/` |

### Odoo — **absent in community**

| Screen/page | What it is | Key files |
| --- | --- | --- |
| **Absent** | No `budget`/`account_budget` addon in this tree (Enterprise-only flavor) — analytic plans carry the comparative-analysis burden | — |

**BOSS implications.** Budgeting is the thinnest area across the reference set — one good implementation (ERPNext: budget doc + variance report + distribution) covers the area. The Moqui baseline is already ahead of everyone but ERPNext here: `mantle.other.budget.Budget`/`BudgetItem` with GL-account × sub-period entry (Accounts Entry screen), budget item details, and an Expense Report (`run#BudgetExpenseReport`) exist (§17), and Mantle also models revisions, reviews and scenarios with no screens. The evidence favors that model plus a variance view in the report engine (§12) and ERPNext's Stop/Warn check on purchase orders and expenses as the one control. Forecasts beyond the bank cash view (Dolibarr `budget.php`) are thin in the references.

---

## 12. Financial reports & the report engine

### Akaunting — report classes + read-only report pages with export pipeline

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Profit & loss / tax summary pages | Category-comparison tables with period switcher; two dedicated report views (the other classes render through the shared report view); users create and edit report records from a report class | `resources/views/reports/{profit_loss,tax_summary}/`, `resources/views/common/reports/{create,edit}.blade.php`, controller `app/Http/Controllers/Common/Reports.php` |
| Report classes | Server-side row builders: ProfitLoss, IncomeExpenseSummary, Income/ExpenseSummary, TaxSummary, DiscountSummary | `app/Reports/{ProfitLoss,IncomeExpenseSummary,IncomeSummary,ExpenseSummary,TaxSummary,DiscountSummary}.php` |
| Export engine | Bulk XLSX/PDF exports per page area (Sales/Purchases/Banking/Common/Settings) | `app/Exports/{Sales,Purchases,Banking,Common,Settings}/`, base `app/Abstracts/Export.php` |

### AureusERP — a full statements cluster (the references' best financial-report pass)

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Trial balance & GL | TrialBalance, GeneralLedger (+ PartnerLedger per customer/vendor) pages with filters; per-row drill-in | `plugins/webkul/accounting/src/Filament/Clusters/Reporting/Pages/{TrialBalance,GeneralLedger,PartnerLedger}.php` |
| Statements | ProfitLoss and BalanceSheet pages rendering standard statements from journal lines | `plugins/webkul/accounting/src/Filament/Clusters/Reporting/Pages/{ProfitLoss,BalanceSheet}.php` |
| Ageing reports | AgedReceivable / AgedPayable pages bucketed per period | `plugins/webkul/accounting/src/Filament/Clusters/Reporting/Pages/{AgedReceivable,AgedPayable}.php` |
| Report exports | One export class per report page + shared concerns (date-filter normalizing, currency notice) | `plugins/webkul/accounting/src/Filament/Clusters/Reporting/Pages/Exports/`, `plugins/webkul/accounting/src/Filament/Clusters/Reporting/Pages/Concerns/{NormalizeDateFilter,ShowsCurrencyNotice}.php` |

### Carbon — an in-app pivot/reporting engine reading straight off the GL

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Pivot engine | PivotTree (row/column grouping tree), ColumnStepper (define columns across comparison periods), PivotLinesDrawer & PivotControlBar, ReportFilters + CompanySelector, SaveViewModal (save views) | `apps/erp/app/modules/accounting/ui/Reports/{PivotTree,PivotControlBar,PivotLinesDrawer,ColumnStepper,ReportFilters,CompanySelector,SaveViewModal}.tsx`, data layer `apps/erp/app/modules/accounting/ui/Reports/executivePnl.ts` + `pivotData.test.ts` |
| Statement renders | MultiPeriodStatementTree (balance-sheet-like trees), ExecutivePnlSummary | `apps/erp/app/modules/accounting/ui/Reports/{MultiPeriodStatementTree,ExecutivePnlSummary}.tsx` |
| Trial balance & ledger | TrialBalanceTable/Tree + AccountLedgerDrawer per-account drill-in; purchases lines drawer; export helper | `apps/erp/app/modules/accounting/ui/Reports/{TrialBalanceTable,TrialBalanceTree,AccountLedgerDrawer,PurchaseLinesDrawer,PurchasesControlBar}.tsx`, `apps/erp/app/modules/accounting/ui/Reports/exportReport.ts` |
| Invoicing analytics | Calendar and spend-aggregation helpers with no route consumer yet | `apps/erp/app/modules/invoicing/invoicing.reports.ts` |

### Dolibarr — dozens of PHP result/stat pages

| Screen/page | What it is | Key files |
| --- | --- | --- |
| P&L (result) | Result pages: revenue-expenditure matrix per year (index/result), customer/supplier split (`clientfourn.php`), per-project view | `htdocs/compta/resultat/{index,result,clientfourn,projects}.php` |
| Turnover stats | Customer/supplier turnover aggregates: per-product, per-country, per-user, per-third-party | `htdocs/compta/stats/{index,casoc,cabyprodserv,cabyuser,byratecountry,supplier_turnover,supplier_turnover_by_prodserv,supplier_turnover_by_thirdparty}.php` |
| Fiscal exports | Bookkeeping export formats (FEC / taxes), centralized on the bookkeeping export page (see §3) | `htdocs/accountancy/bookkeeping/export.php` |
| Bank trend pages | Bank flows graphs & cash positions (§8 files) double as reports | `htdocs/compta/bank/{bilan,graph,treso}.php` |

### ERPNext — the largest report surface (60+ accounting reports)

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Ledger reports | General Ledger (w/ group filters & is-group drill), Trial Balance (+`_simple`, `_for_party`), Payment Ledger, Advance ledger & GL/payment comparison | `erpnext/accounts/report/{general_ledger,trial_balance,trial_balance_simple,trial_balance_for_party,payment_ledger,general_and_payment_ledger_comparison}/` |
| Statements | Profit and Loss Statement, Balance Sheet, Cash Flow (with `financial_statements` engine), Consolidated variants | `erpnext/accounts/report/{profit_and_loss_statement,balance_sheet,cash_flow,financial_statements.py,consolidated_financial_statement,consolidated_trial_balance,consolidated_accounts_{receivable,payable}}/` |
| Register & summary reports | Sales/Purchase Register (`item_wise_*_register`, payable/receivable summaries + consolidated), AR/AP ageing (§13) | `erpnext/accounts/report/{sales_register,purchase_register,item_wise_sales_register,item_wise_purchase_register,accounts_receivable_summary,accounts_payable_summary}/` |
| Financial templates | Pre-defined statement layouts (IFRS P&L/Balance/Cash Flow; horizontal variants, ratios) configurable tree data | `erpnext/accounts/financial_report_template/` (incl. `financial_ratios_analysis`, `standard_balance_sheet_(ifrs)`, `horizontal_profit_and_loss_(columnar)`) |
| Report framework | Shared scripted-report UI (filters, save/print variants) from the Frappe core report engine; accounting pinch-point glue in `utils.py` | `erpnext/accounts/report/utils.py` |
| Insights workbook | External BI seeding for accounting dashboards | `erpnext/accounts/insights_workbook/{accounts,payments}/` |

### Ever Gauzy — report gallery page + reusable report components

| Screen/page | What it is | Key files |
| --- | --- | --- |
| All reports index | Grid of available reports (finance: expenses, payment, amounts owed, client/project budgets; plus time/HR reports) | `apps/gauzy/src/app/pages/reports/all-report/all-report/all-report.component.ts` |
| Finance reports | Expenses report w/ chart+grid stack; Payment report; Amounts owed (customer/vendor outstanding); Client & Project budget reports | `apps/gauzy/src/app/pages/reports/{expenses-report,amounts-owed-report,payment-report,client-budgets-report,project-budgets-report}/` |
| Report infra | Report service + shared chart/grid components, global org/employee/date selectors | `apps/gauzy/src/app/pages/reports/all-report/report.service.ts`, shared UI `packages/ui-core/` |

### metasfresh — AD reporting windows + SQL views

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Report windows | All statements are windows/jasperwizard exports via the generic shell; owning backend `de.metas.acct.base`, `de.metas.fresh` (fresh/domain report extensions), ESR report | shell `frontend/src/components/window/`, charts `frontend/src/components/charts/` |

### Odoo — SQL-view reports in community; statement UI is Enterprise

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Invoice analysis (SQL view) | `account.invoice.report` pivot/graph (Reporting → Invoice Analysis) | `odoo/addons/account/report/{account_invoice_report.py,account_invoice_report_view.xml}` |
| Cashflow analysis | Reporting → Cashflow Analysis: pivot/graph action over bank statement lines | `odoo/addons/account/views/account_bank_statement_views.xml` (`action_account_cashflow_analysis`) |
| Financial statements | **Absent** — the P&L/BS/aged/partner-ledger screens (`account_reports`) are Enterprise; community ships the `account.report` definition model and its views, which the Enterprise UI renders | `odoo/addons/account/models/account_report.py`, `odoo/addons/account/views/account_report.xml` |
| Hash integrity | Integrity-check report for hashed (secured) entries | `odoo/addons/account/report/{account_hash_integrity_templates.py,account_hash_integrity_templates.xml}` |

**BOSS implications.** Financial reporting is where the references divide: file-per-report suites (Dolibarr PHP pages, ERPNext script reports) vs a report-definition model (Odoo's `account.report`, ERPNext `financial_report_template`) vs in-app pivot builders (Carbon). AureusERP's seven Reporting pages (Trial Balance, General Ledger, Partner Ledger, Profit & Loss, Balance Sheet, Aged Receivable, Aged Payable) are the minimum set. The Moqui baseline already covers most of it in one Report List (Balance Sheet, Income Statement, Cash Flow, Retained Earnings, Financial Ratios, Account Ledger, Account Balance, Posted Amount/Balance Summary, AR aging summary and detail, Invoice Reconciliation) over `mantle.ledger.LedgerReportServices` (§17), plus a per-period trial balance (the time period **Accounts** view: beginning, debits, credits, ending per GL account) and Quick Aging for receivables or payables with a chosen bucket length; the gaps are a partner ledger, multi-period comparison columns and row drill-down. A shared drill-down (click a report row → open the account ledger filtered) is the single biggest UX win identified across Carbon (AccountLedgerDrawer) and ERPNext; saved views and export (Carbon SaveViewModal/ColumnStepper, AureusERP export classes, Akaunting Exports) fit as report-engine features that Insights also uses, rather than per-report code.

---

## 13. Customer & vendor balance, credit & aging

### Akaunting — balance rollups on the contact card

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Customers | Contact list and CRUD; the show page has Open / Overdue / Paid totals, documents and transactions tabs, and client-portal access status | `resources/views/sales/customers/{index,create,edit,show}.blade.php`, shared `resources/views/components/contacts/show/content.blade.php`, controller `app/Http/Controllers/Sales/Customers.php` |
| Vendors | Same surface for purchase side | `resources/views/purchases/vendors/`, controller `app/Http/Controllers/Purchases/Vendors.php` |
| Customer portal face | Guest sees own totals/paid/due on portal dashboard & invoice pages (§4) | `resources/views/portal/dashboard/`, controller `app/Http/Controllers/Portal/Dashboard.php` |

### AureusERP — partner resources w/ related accounts

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Customers & vendors | Customers → Customers and Vendors → Vendors partner resources with invoice/bill relations (no credit-limit field in this version) | `plugins/webkul/accounting/src/Filament/Clusters/Customers/Resources/CustomerResource.php`, `plugins/webkul/accounting/src/Filament/Clusters/Vendors/Resources/VendorResource.php`, twins `plugins/webkul/invoices/src/Filament/Clusters/Customers/Resources/CustomerResource.php` and `plugins/webkul/invoices/src/Filament/Clusters/Vendors/Resources/VendorResource.php`, base `plugins/webkul/accounts/src/Filament/Resources/{CustomerResource,VendorResource}.php` |

### Carbon — party-grouped aging workbench

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Aging workbench | ARAP workbench groups open items per customer/supplier with expandable balance rows and cooperative allocation (§7) | `apps/erp/app/modules/invoicing/ui/Workbench/ARAPWorkbench.tsx` |
| Aging totals on dashboard | Current/1-30/31-60/61-90/over-90 buckets + unapplied credit & tie-out | `apps/erp/app/modules/invoicing/ui/Dashboard/InvoicingDashboard.tsx` (`AgingTotals` type) |
| Customer/supplier stores | Client-side customer and supplier stores backing the party pickers | `apps/erp/app/stores/{customers,suppliers}.ts` |

### Dolibarr — open-bill lists & third-party recaps (no formal aging engine)

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Unpaid invoice views | Thirdparty-scoped unpaid bills with "late"/"to pay" filters; global unpaid lists | `htdocs/compta/facture/list.php` (status/soc filters), `htdocs/fourn/facture/list.php` |
| Third-party recap | Per-thirdparty compta recap (charges/payments per account) | `htdocs/compta/recap-compta.php`, supplier side `htdocs/fourn/recap-fourn.php` |
| Credit-ish warnings | Outstanding bill limit box on dashboard swings when a customer exceeds allowed unpaid amount | `htdocs/core/boxes/box_customers_outstanding_bill_reached.php`, `box_goodcustomers.php` |

### ERPNext — party balance primitives + credit limits + ageing reports

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Party utils | `party.py` — account resolution, balance & gl helpers (party-wise balances backend) | `erpnext/accounts/party.py` |
| AR/AP ageing | Accounts Receivable/Payable reports (w/ ageing & range-based details) + consolidated summaries | `erpnext/accounts/report/{accounts_receivable,accounts_payable,accounts_receivable_summary,accounts_payable_summary,consolidated_accounts_receivable,consolidated_accounts_payable}/` |
| Ledger summaries | Customer & supplier ledger summary (emailable/`process_statement_of_accounts`-ready) | `erpnext/accounts/report/{customer_ledger_summary,supplier_ledger_summary}/` |
| Credit limits | Customer Credit Limit rows per company (credit limit, overdue billing threshold, bypass credit-limit check at sales order); Accounts Settings names the role allowed to bypass and can block new invoices for customers over their overdue threshold; customer credit balance report | `erpnext/selling/doctype/customer_credit_limit/customer_credit_limit.{json,py}`, `erpnext/accounts/doctype/accounts_settings/accounts_settings.json` (`credit_controller`, `enable_overdue_billing_threshold`), `erpnext/selling/report/customer_credit_balance/` |

### Ever Gauzy — amounts-owed & budgets reports

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Amounts owed | Customer/vendor outstanding report pages (no bucket aging) | `apps/gauzy/src/app/pages/reports/amounts-owed-report/` |
| Budgets per client/project | Additional exposure limiting surfaces | `apps/gauzy/src/app/pages/reports/{client-budgets-report,project-budgets-report}/` |

### metasfresh — Open Items view header shell

| Screen/page | What it is | Key files |
| --- | --- | --- |
| AcctOpenItems | Shared header component of the open-items (AR/AP balance) views rendered inside windows; full aging comes from backend dunning/open-items windows | `frontend/src/components/acctOpenItems/OIViewHeader.js` |

### Odoo — partner accounting via moves (community lacks partner ledger screen)

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Partner accounting tabs | Fiscal position & partner-level accounting settings on partner forms (no follow-up fields in community); partner payments widget (`account_payment_field`) shows paid amounts on documents | `odoo/addons/account/views/partner_view.xml`, `odoo/addons/account/static/src/components/account_payment_field/` |
| Open links | `open_move_widget`/`open_move_line_move_widget` badges deep-linking source docs from GL line views | `odoo/addons/account/static/src/components/{open_move_widget,open_move_line_move_widget}/` |
| Followup/ledger reports | **Absent** (Enterprise `account_reports` + `account_followup` own them) | §18 |

**BOSS implications.** Accounting's version of the reused Customer 360 (also in Sales, Customer Service, Marketing and Commerce, crosscut §3) could fuse what these references keep separate: a party header with due/current (Akaunting), bucket aging (Carbon/ERPNext), credit limit with stop/warn behavior (ERPNext Customer Credit Limit plus overdue threshold) and a payments/open-items tab linking into allocation (§7). The baseline Party **Financial Info** tab already lists unpaid and recently paid receivables and payables, unapplied payments and current orders, with a customer statement PDF (§17); what it lacks is the aging strip and a credit limit — Mantle's `BillingAccount.accountLimit` is the only limit field and has no screen. Accounting's version of the reused Supplier 360 (also in Purchasing, Products and Warehouse) would show the same minus credit — Carbon's single AR/AP workbench proves one screen can carry both with a party-type switch. Deep-link badges from balances to source documents (Odoo `open_move_widget`) connect these views: in the references GL lines, invoices and payments are all reachable from the party record.

---

## 14. Accounting settings & configuration

### Akaunting — settings pages + first-run wizard

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Settings sweep | Company, localisation (tax ids & fiscal-year start), invoice defaults (numbering, prefixes, due terms), categories & defaults for account/types, currencies, email & templates, recurring schedule, tax settings (§10) | `app/Http/Controllers/Settings/{Company,Localisation,Invoice,Currencies,Defaults,Categories,Email,EmailTemplates,Schedule}.php`, views `resources/views/settings/{company,localisation,invoice,currencies,default,categories,email,email-templates,schedule}/` |
| Modules store | Module install/activate UI (relies on paid marketplace → empty in this checkout) | `app/Http/Controllers/Settings/Modules.php`, `resources/views/settings/modules/` |
| First-run wizard | Company → currencies → finish steps | `resources/views/wizard/{companies,currencies,finish}/`, controllers `app/Http/Controllers/Install/` |

### AureusERP — per-cluster Settings pages

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Accounting settings | ManageCustomerInvoice, ManageDefaultAccounts, ManageProducts, ManageTaxes (the same four pages exist under the Settings cluster and under `Pages/Settings`) | `plugins/webkul/accounting/src/Filament/Clusters/Settings/Pages/{ManageCustomerInvoice,ManageDefaultAccounts,ManageProducts,ManageTaxes}.php`, `plugins/webkul/accounting/src/Filament/Pages/Settings/` |
| Plugin settings shell | Cluster-level PluginSettings page per plugin | `plugins/webkul/accounting/src/Filament/Clusters/PluginSettings.php` (pattern shared by all webkul plugins) |

### Carbon — activation wizard + posting defaults + fintech knobs

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Activation wizard | Readiness checklist, opening-balance (trial-balance) editor, fixed-asset & inventory-cost preview tables, migration clearing table, apply button | `apps/erp/app/modules/accounting/ui/Activation/{ReadinessChecklist,TrialBalanceEditor,FixedAssetDepreciationTable,InventoryCostTable,MigrationClearingTable,ApplyCarbonButton,ActivationSteps}.tsx` |
| Posting defaults & masters | AccountDefaults, PaymentTerms, ExchangeRates, FiscalYearSettings (§2) | `apps/erp/app/modules/accounting/ui/{AccountDefaults,PaymentTerms,ExchangeRates,FiscalYear}/` |

### Dolibarr — admin pages per document type

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Invoice admin | Numbering modules, invoice terms & situation, templates links | `htdocs/admin/invoice.php`, `htdocs/admin/invoice_situation.php` |
| Payment admin | Bank accounts config + payment-by-transfer config | `htdocs/admin/bank.php`, `htdocs/admin/payment.php`, `htdocs/admin/paymentbybanktransfer.php` |
| Company & currency | Company/socials + multicurrency rates | `htdocs/admin/company.php`, `htdocs/admin/multicurrency.php` (+ `htdocs/multicurrency/` rate pages) |
| Dictionary/entity config | Common dictionaries & accountancy module options | `htdocs/admin/dict.php`, `htdocs/admin/accounting.php` |

### ERPNext — Accounts Settings + gateway/deferral automation

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Accounts Settings | Single settings doctype: supplier-invoice uniqueness check, unlink payments on cancel, over-billing allowance, overdue-billing block, credit-limit bypass role, auto-reconcile payments and fuzzy party matching, deferred-accounting options, immutable ledger (§9), print options | `erpnext/accounts/doctype/accounts_settings/accounts_settings.{js,json,py}` |
| Currency/deferral automation | Currency exchange settings (auto-fetch), exchange-rate revaluation, deferred-revenue process runner | `erpnext/accounts/doctype/{currency_exchange_settings,exchange_rate_revaluation,process_deferred_accounting}/` |
| Numbering | Naming series per doctype (`naming_series` field, e.g. on Dunning and Payment Order) | `erpnext/accounts/doctype/payment_order/payment_order.json` |

### Ever Gauzy — org settings + accounting templates

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Accounting templates | Manage invoice PDF templates at org level (see §4) | `apps/gauzy/src/app/pages/accounting-templates/` |
| Org/general settings | Organization settings (finance-relevant: currency, tax ids, invoice defaults *(unverified field list)*) and app settings pages | `apps/gauzy/src/app/pages/organizations/edit-organization/edit-organization-settings/`, `apps/gauzy/src/app/pages/settings/{general-setting,feature,billing}/` |

### metasfresh — accounting setups as backend windows

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Accounting schema/config windows | Accounting schema + journal/GL configuration are backend AD windows rendered in the generic shell | `backend/de.metas.acct.base`, `de.metas.acct.webui` |

### Odoo — settings page + chart setup wizard + sequences

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Accounting settings | `res.config.settings` subpage with groups leading the setup (COA picker, lock dates, currency, bank sync) | `odoo/addons/account/views/res_config_settings_views.xml`, `odoo/addons/account/wizard/setup_wizards.py` |
| Company accounting fields | Default income/expense/deferred accounts, terms on company form | `odoo/addons/account/views/res_company_views.xml`, `odoo/addons/account/models/company.py` |
| Sequences & layout | Sequence mixin numbering entries per journal (with the resequence wizard, §3); document layout settings for printed invoices | `odoo/addons/account/models/sequence_mixin.py`, `odoo/addons/account/views/base_document_layout_views.xml` |

**BOSS implications.** The references suggest one Accounting Configuration section with per-area tabs mirroring the references: document defaults & numbering (Akaunting invoice settings, Dolibarr admin/invoice, Odoo sequences), payment terms & currency (every suite), first-run activation wizard with readiness checklist + opening balances (Carbon Activation is unmatched — the strongest guidance for onboarding a company into BOSS accounting), posting defaults (Carbon Default Accounts, AureusERP ManageDefaultAccounts) to keep bookkeepers from picking accounts line-by-line. The baseline Org Settings already covers much of the posting-default half — Accounting Preferences (`PartyAcctgPreference`: fiscal year start, base currency, COGS method, invoice/order numbering, GL account code mask, error journal), GL Accounts per org, Account Types, Item Types, Invoice Types, Payment Types, Payment Instruments, Asset Types, Financial Account Types and Reasons, several with a "missing configuration" list — and an `init#PartyAccountingConfiguration` service, so the gap is a guided wizard over it rather than new records. Currency exchange automation (ERPNext currency exchange settings) is a lightweight, high-value candidate config screen for multi-company BOSS.

---

## 15. Fixed assets, depreciation & period runs

- Fixed assets are one `Asset` record that Maintenance and Accounting both include (crosscut §4, [research-maintenance.md](research-maintenance.md) §8): Maintenance's version emphasizes the register, lifecycle and custodian, Accounting's the books on the same record: capitalization, depreciation, revaluation and disposal postings. This section also covers the other period-end runs the references group under "Closing" (leases, revenue recognition, revaluation, intercompany).

### Carbon — fixed assets, depreciation runs, leases and revenue recognition under Accounting

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Fixed asset register | Assets list and record (statuses Draft, Under Construction, Active, Fully Depreciated, Disposed; fields class, location, work center, serial, lifetime usage, book and tax depreciation method, useful life in months, residual %, MACRS class and convention, bonus depreciation %) with actions Register, Capitalize, Capitalize CIP (with CIP cost lines), Adjust Cost, Attach Job, Take Out of Service, Dispose, Sell, Return to Inventory, Purchase; documents and notes | `apps/erp/app/modules/accounting/ui/FixedAssets/{FixedAssetsTable,FixedAssetForm,FixedAssetHeader,FixedAssetStatus,FixedAssetRegisterForm,FixedAssetCapitalizeForm,FixedAssetCapitalizeCipForm,FixedAssetCipCosts,FixedAssetAdjustCostForm,FixedAssetAttachJobForm,FixedAssetOutOfServiceForm,FixedAssetDisposalForm,FixedAssetReturnToInventoryForm,FixedAssetDocuments,FixedAssetNotes}.tsx`, routes `apps/erp/app/routes/x+/fixed-asset+/` |
| Asset classes | Class defaults for book and tax depreciation (method, useful life, residual %, MACRS, bonus %) and the accounts: asset, accumulated depreciation, depreciation expense, gain and loss on disposal, write-down, write-off | `apps/erp/app/modules/accounting/ui/FixedAssets/{AssetClassForm,AssetClassesTable}.tsx`, route `apps/erp/app/routes/x+/accounting+/asset-classes.tsx` |
| Depreciation runs | One run per period with header, status and documents; Post, Recalculate, Repeat, Reverse, Delete | `apps/erp/app/modules/accounting/ui/FixedAssets/{DepreciationRunTable,DepreciationRunHeader,DepreciationRunStatus,DepreciationRunDocuments}.tsx`, routes `apps/erp/app/routes/x+/depreciation-run+/{$depreciationRunId,$depreciationRunId.post,$depreciationRunId.recalculate,$depreciationRunId.repeat,$depreciationRunId.reverse}.tsx` |
| Fleet | Rental-fleet view over fixed assets (Available, Reserved, On Rent, In Maintenance, Under Construction, Returned to Stock, Sold) | `apps/erp/app/modules/accounting/ui/FixedAssets/{FleetAssetsTable,FleetStatus}.tsx`, route `apps/erp/app/routes/x+/accounting+/fleet.tsx` |
| Leases (lessee) | Lease record with a setup wizard (details, assets, payments, accounting, review), lines with classification, payment schedule with regenerate, modify, terminate, activate, invoice; lease runs per period post the right-of-use amortization | `apps/erp/app/routes/x+/lease+/{new,$id.setup.details,$id.setup.assets,$id.setup.payments,$id.setup.accounting,$id.setup.review,$id.modify,$id.activate,$id.payments.regenerate,$id.$lineId.terminate}.tsx`, `apps/erp/app/routes/x+/accounting+/lease-runs.tsx`, logic `apps/erp/app/modules/accounting/lease-liabilities.ts` |
| Revenue recognition | Runs per period with Post, Recalculate, Repeat, Reverse | `apps/erp/app/modules/accounting/ui/RevenueRecognition/{RevenueRecognitionRunsTable,RevenueRecognitionRunHeader,RevenueRecognitionRunStatus,RevenueRecognitionRunDocuments}.tsx`, routes `apps/erp/app/routes/x+/revenue-recognition-run+/` |
| Intercompany | Intercompany transactions with status, a balance matrix between companies, matching summary, Match and Eliminate actions; shown only with several companies | `apps/erp/app/modules/accounting/ui/Intercompany/{IntercompanyTransactionForm,IntercompanyTransactionTable,IntercompanyTransactionStatus,IntercompanyBalanceMatrix,IntercompanyMatchingSummary}.tsx`, routes `apps/erp/app/routes/x+/accounting+/{intercompany,intercompany.new,intercompany.match,intercompany.eliminate}.tsx` |
| Opening fixed assets | Activation step that loads the existing asset register with accumulated depreciation | `apps/erp/app/modules/accounting/ui/Activation/FixedAssetDepreciationTable.tsx`, route `apps/erp/app/routes/x+/accounting+/activation.fixed-assets.tsx` |

### ERPNext — Asset documents with depreciation schedules; deferred accounting and revaluation runs

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Asset | Fixed asset record (statuses Draft, Submitted, Cancelled, Partially Depreciated, Fully Depreciated, Sold, Scrapped, In Maintenance, Out of Order, Issue, Receipt, Capitalized, Work In Progress) with finance books and category accounts | `erpnext/assets/doctype/{asset,asset_category,asset_category_account,asset_finance_book}/` |
| Depreciation schedule | Schedule per asset and finance book (Straight Line, Double Declining Balance, Written Down Value, Manual; statuses Draft / Active / Cancelled); Accounts Settings can book depreciation entries automatically | `erpnext/assets/doctype/{asset_depreciation_schedule,depreciation_schedule}/`, `erpnext/accounts/doctype/accounts_settings/accounts_settings.json` (`book_asset_depreciation_entry_automatically`) |
| Value changes | Asset Value Adjustment (revaluation), Asset Capitalization (from stock, services and other assets), shift-based depreciation factors | `erpnext/assets/doctype/{asset_value_adjustment,asset_capitalization,asset_shift_allocation,asset_shift_factor}/` |
| Register report | Fixed Asset Register | `erpnext/assets/report/fixed_asset_register/` |
| Deferred revenue/expense | Process Deferred Accounting run that books deferred revenue and expense entries for a period | `erpnext/accounts/doctype/process_deferred_accounting/`, `erpnext/accounts/deferred_revenue.py` |
| Exchange-rate revaluation | Period-end revaluation of foreign-currency balances into a journal entry | `erpnext/accounts/doctype/{exchange_rate_revaluation,exchange_rate_revaluation_account}/` |

### Dolibarr — accounting-first Asset module

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Assets | Asset list/card with depreciation tab, depreciation options (economic and accelerated), accounting codes per asset, disposal; asset models act as templates with the same tabs | `htdocs/asset/{list,card,depreciation,depreciation_options,accountancy_codes,disposal}.php`, models `htdocs/asset/model/` |

### Odoo / AureusERP / Akaunting / Ever Gauzy — **absent**

| Screen/page | What it is | Key files |
| --- | --- | --- |
| **Absent** | Odoo's `account_asset` (assets and deferred revenue) is Enterprise and not in the checkout; AureusERP, Akaunting and Ever Gauzy have no fixed-asset books. Odoo community's nearest tool is the automatic-entries wizard (spread an expense over periods, §3) | — |

**BOSS implications.** Carbon is the closest model for Accounting's version of the reused Facility & equipment record: a book tab (class, book and tax method, useful life, residual, accumulated depreciation, net book value) plus capitalize / adjust / dispose / sell actions, and a **Depreciation run** per period with post / recalculate / reverse. Mantle already carries the book fields on `Asset` (acquire cost, salvage value, depreciation type and amount, year-begin depreciation, tax depreciation type and amount), per-period `AssetDepreciation` rows linked to their `AcctgTrans`, depreciation types (Straight Line, Double Declining, Sum of Years Digits, Units of Production; tax MACRS GDS 5/7) and `calculateAndPost#AllFixedAssetDepreciations` behind the time period's **Post Depreciation** button (§17). What it lacks are asset classes with default accounts (today `AssetTypeGlAccount` maps by asset type only), a run record with a reviewable preview, and disposal/revaluation postings. Leases, revenue recognition, revaluation and intercompany runs are thinner in the references (Carbon has them all; ERPNext deferred accounting and revaluation); they share one "period run" list screen pattern (Carbon's `PeriodRunDocuments`).

---

## 16. Cross-app surfaces

| Reused screen or link | Use in Accounting | Other apps that include it | Reference evidence |
| --- | --- | --- | --- |
| **Customer 360** | Balance, credit limit and hold, aging strip, open items with allocation, statements, collections activity | Sales, Customer Service, Marketing, Commerce | Akaunting contact totals (Open / Overdue / Paid); ERPNext Customer Credit Limit, Accounts Receivable report, Process Statement of Accounts; Carbon Receivables workbench; Odoo `open_move_widget` deep links; baseline Party Financial Info tab and customer statement PDF |
| **Supplier 360** | AP balance, open bills, payments, debit notes | Purchasing, Products, Warehouse | Carbon Payables workbench and supplier credits; AureusERP Vendors cluster; Dolibarr `htdocs/fourn/recap-fourn.php`; baseline Party Financial Info (payables side) |
| **Order detail** | Invoice from order (entire order part, partial, down payment), applied payments, promised payments | Sales, Purchasing, Customer Service, Warehouse, Commerce | ERPNext invoice from sales order; Odoo `sale_make_invoice_advance`; Mantle `create#EntireOrderPartInvoice`, `apply#OrderPaymentsToInvoice`; baseline Edit Invoice **Orders** tab |
| **Shipment detail** | Invoice from shipment, invoice-item ↔ shipment links, landed cost | Warehouse, Customer Service, Sales, Purchasing, Commerce | Carbon `SalesInvoiceShipmentForm` / `PurchaseInvoiceDeliveryForm`; Mantle `create#SalesShipmentInvoices`, `create#PurchaseShipmentInvoices`; baseline Edit Invoice **Shipments** tab |
| **Product 360** | Cost history and valuation, product GL accounts | Products, Commerce, Purchasing, Manufacturing, Warehouse, Sales | Mantle `ProductGlAccount`, `ProductCategoryGlAccount`; baseline Inventory Valuation report; Odoo `account_stock_valuation_report` |
| **Facility & equipment record** | Fixed-asset books: class, depreciation, net book value, capitalize / dispose | Maintenance, Warehouse, Manufacturing, Commons | Carbon fixed assets (§15); ERPNext Asset and schedules; Dolibarr asset depreciation tab; Mantle `AssetDepreciation` |
| **Approvals waiting** | Bill approval (`InvoiceIncoming`/`InvoiceReceived` → `InvoiceApproved`), payments to validate | Header Notifications panel (all apps); People, Projects, Purchasing, Sales | ERPNext purchase invoice hold; Dolibarr payment `tovalidate.php`; Mantle invoice statuses |
| **Supplier invoices & 3-way match** | AP bills: bill-line ↔ PO-line ↔ receipt matching | Purchasing (match exceptions and holds against PO/receipt) | Odoo Purchase Bill Lines + Control Policy; ERPNext `po_detail`/`pr_detail`, `po_required`/`pr_required`, Received Items To Be Billed; Carbon extracted-line mapping |
| **Customer returns** | Credit memo or refund from the return (`ReturnItemBilling`) | Customer Service, Warehouse, Commerce | ERPNext `make_sales_return`; Carbon credit memos; Mantle `process#ReturnItemResponses` creating the return invoice |
| **Supplier returns** | Debit note | Purchasing, Warehouse | ERPNext `make_debit_note`; Carbon memo direction Debit; Odoo `account_debit_note` |
| **Subscriptions** | Recurring invoicing: schedule, next invoice date, generated invoices | Sales, Commerce | ERPNext Subscription + Process Subscription; Akaunting recurring invoices; Dolibarr template invoices |
| **Customer agreements** | Payment terms and settlement terms on invoices | Sales, Customer Service | Mantle `SettlementTerm`, `InvoiceTerm`, `AgreementTerm`; Carbon and Odoo payment terms |
| **Expense claims** | Posting, tax and reimbursement payment of approved claims | People (capture, approval) | Carbon Reimbursements + employee payee on Payment; Frappe HR Expense Claim (People capture/approval); baseline My Account expense invoices |
| **Time entry & timesheets** | Billing approved time and expenses to customers | Projects, People | Mantle `create#TimeEntryInvoiceItems`, `create#ProjectInvoiceItems`; ERPNext `sales_invoice_timesheet`; Ever Gauzy invoice task selector |
| **Payroll** | Posting payroll invoices and paying them | People | Mantle `create#PayrollInvoice`, `InvoicePayroll` type |
| **Payment, shipping & tax settings** | Tax authorities and rates, payment methods and payment gateway records, which also serve sales orders, purchase bills and POS outside any store | Commerce (per-store bindings), Admin (gateway configuration) | Frappe payments gateway settings (§7); Odoo `payment` provider records (§7); Mantle `TaxAuthority`, `TaxGatewayConfig`, `PaymentGatewayConfig` (§10, §17) |
| **Invoice view and pay online** | Online invoice view/pay page, statements and pay-online flow over the same invoices | Commerce (store account) | Commerce research §7 (store portal); Akaunting portal; Odoo `account_portal_templates.xml`; Frappe payments checkout pages |
| **Dashboard widgets** | Financial KPIs and charts on the Accounting landing page; financial statements as report-builder sources | Insights, every app's landing page | ERPNext number cards and dashboard charts, `insights_workbook/`; Carbon pivot reports |

**BOSS implications.** Accounting includes most of the reused record screens with an accounting context: balance and credit on Customer 360, AP on Supplier 360, invoice and payment tabs on Order detail, the book tab on the Facility & equipment record and bill approval in the header. In the overlapping functions its versions emphasize AP bills with 3-way match, the credit/refund step of returns, recurring invoicing for subscriptions, posting and payment of expense claims, depreciation, and tax authorities and payment methods.

---

## 17. Current Moqui baseline (mr-marble / MarbleERP / Mantle)

The baseline is a working double-entry accounting system: invoices and payments with applications, auto-posting to the GL, bank statement import and reconciliation, financial accounts, budgets, time periods with close, and a report list with the main statements. MarbleERP mounts the SimpleScreens `Accounting` tree as-is (`component/mr-marble/screen/marble.xml`); `component/mr-boss/screen/` has no accounting screens yet (only `Base`, sales `Reports` and `SimpleReport`). The SimpleScreens Accounting tree has 166 forms ([ss-inventory.md](ss-inventory.md)).

### Screens

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Accounting dashboard | Link boxes **Invoices and Payments** (Invoices, Aging, Payments, Bulk Checks, Financial Accounts) and **General Ledger** (Reports, Transactions, Transaction Entries, GL Accounts, GL Journals, Time Periods, Budgets); per internal organization: receivable and payable summaries, bank accounts with ledger balance and date, Settings link | `component/mr-marble/screen/SimpleScreens/Accounting/{dashboard.xml,dashboard/OrgInternalSummary.xml}` |
| Find Invoice | Create payable, receivable, customer credit, supplier credit; project and worker invoices; customer statement; invoice list with aging summary | `component/mr-marble/screen/SimpleScreens/Accounting/Invoice/FindInvoice.xml` |
| Edit Invoice | Header with status transitions, update, close, adjust, reverse, cancel with payments, post/repost; create credit memo; record payment, apply payment, apply invoice to invoice, unapply; send store email and past-due email; content files, email messages, system messages, GL transactions, audit log; tabs Items, Budget Details, Orders, Shipments; PDF | `component/mr-marble/screen/SimpleScreens/Accounting/Invoice/{EditInvoice,EditInvoiceItems,EditInvoiceItemDetails,EditInvoiceItemOrders,EditInvoiceItemShipments,PrintInvoice}.xml` |
| Aging & statements | Quick Aging for receivables or payables with bucket length and as-of date; receivable statement | `component/mr-marble/screen/SimpleScreens/Accounting/Invoice/{Aging,ReceivableStatement}.xml` |
| Payments | Find Payment (new incoming / outgoing); Edit Payment (status, post/repost, refund, gateway authorize/capture/release/refund, set refund-for, apply to invoices or payments, unapply, unpaid invoices and unapplied payments side lists, content, gateway responses, GL); check and detail PDFs; Bulk Checks (create, assign check numbers) | `component/mr-marble/screen/SimpleScreens/Accounting/Payment/{FindPayment,EditPayment,PaymentCheck,PaymentDetail,BulkPaymentCheck}.xml` |
| Bank accounts & reconciliation | On the party's payment method (bank account): transactions with Upload (BAI2, OFX), Add, Update, **Match and Reconcile**, manual Reconcile, No Reconcile, Unreconcile (FIT id, amount, matched payment and GL transaction); checks list; payment method files; gateway responses | `component/mr-marble/screen/SimpleScreens/Party/PaymentMethod/{EditPaymentMethod,PaymentMethodTrans,PaymentMethodChecks,PaymentMethodFiles,PaymentGatewayResponses}.xml` |
| Financial accounts | Find/create, edit, transactions with adjust, statement print (customer deposits, gift cards, store credit) | `component/mr-marble/screen/SimpleScreens/Accounting/FinancialAccount/{FindFinancialAccount,EditFinancialAccount,FinancialAccountTrans,FinancialAccountStatement}.xml` |
| GL accounts | Find/create, edit with organizations, account tree | `component/mr-marble/screen/SimpleScreens/Accounting/GlAccount/{FindGlAccount,EditGlAccount,GlAccountTree}.xml` |
| Transactions & journals | Find Transaction (create), Edit Transaction (update, update posted, add/edit/move/delete entries, post, unpost, reverse, delete), Find Transaction Entry; GL Journals (create, post) | `component/mr-marble/screen/SimpleScreens/Accounting/Transaction/{FindTransaction,EditTransaction,EditTransaction/MoveEntry,FindTransactionEntry}.xml`, `component/mr-marble/screen/SimpleScreens/Accounting/FindJournal.xml` |
| Time periods & close | Find/create periods; edit with create next / previous / child; **Accounts** view per period (beginning, debits, credits, ending per GL account; recalculate; **Post Depreciation**; close, reopen, closing transaction) | `component/mr-marble/screen/SimpleScreens/Accounting/TimePeriod/{FindTimePeriod,EditTimePeriod,ViewPeriodGlAccounts}.xml` |
| Budgets | Find/create, edit, items, accounts entry by sub-period, expense report | `component/mr-marble/screen/SimpleScreens/Accounting/Budget/{FindBudget,EditBudget,EditBudgetItems,BudgetAccountsEntry,BudgetReport}.xml` |
| Report List | **Financial Reports** (Balance Sheet, Income Statement, Cash Flow, Retained Earnings, Financial Ratios — each with organization and period form); **Sales and Invoice Reports** (Sales Summary, Sales Order Analysis, Sales Invoice Analysis, customer statement, Order Item Summary, Order Issued and Invoiced, Invoice Item Summary, Quick Aging, Invoice Aging Detail, AR Aging Summary, Invoice Reconciliation); **Transaction Reports** (Account Ledger, Account Balance, Posted Amount Summary, Posted Balance Summary); **Asset and Inventory Reports** (Inventory Valuation, Receipt Transactions, Status by Receipt, On Hand, On Hand Summary, Shipment Package Summary) | `component/mr-marble/screen/SimpleScreens/Accounting/Reports/ReportList.xml`, report screens `component/mr-marble/screen/SimpleScreens/Accounting/Reports/` |
| Invoice Reconciliation | Integrity checks: invoices vs GL, payments vs GL, unposted transactions, transactions where credits ≠ debits, transactions with no invoice, applications to future invoices | `component/mr-marble/screen/SimpleScreens/Accounting/Reports/InvoiceReconciliation.xml` |
| Org settings | Accounting Preferences, GL Accounts per org, Account Types, Item Types, Invoice Types, Payment Types, Payment Instruments, Asset Types, Financial Account Types and Reasons; several with a missing-configuration list | `component/mr-marble/screen/SimpleScreens/Accounting/OrgSettings/{AcctgPreference,GlAccounts,TypeDefaults,ItemTypes,InvoiceTypes,PaymentTypes,PaymentInstruments,AssetTypes,FinAcctTypes,FinAcctReasons}.xml`; accounting init also on `component/mr-marble/screen/SimpleScreens/Vendor/EditVendor.xml` |
| Party financial info | Party tab: unpaid and recently paid receivables and payables, unapplied incoming/outgoing payments, current sales and purchase orders, counts with links, customer statement PDF | `component/mr-marble/screen/SimpleScreens/Party/FinancialInfo.xml` |
| Expense invoices | Employee expense invoices with items (My Account) | `component/mr-marble/screen/MyAccount/Expense/{FindExpenseInvoice,EditExpenseInvoice,EditExpenseInvoiceItems}.xml` |
| Asset book fields | Fixed-asset fields and depreciation list on the asset detail | `component/mr-marble/screen/SimpleScreens/Asset/Asset/AssetDetail.xml` |

### Data model available

| Record (entity file) | What it gives Accounting | Key files |
| --- | --- | --- |
| `Invoice`, `InvoiceItem`, `InvoiceItemDetail`, `InvoiceItemAssoc`, `InvoiceParty`, `InvoiceTerm`, `SettlementTerm`, `InvoiceContent`, `InvoiceEmailMessage`, `InvoiceSystemMessage` (`mantle.account.invoice`) | Types Sales/Purchase, Return, Payroll Employee, Payroll Other, Tax, Garnishment, Commission, Credit Memo, Template; receivable statuses In-Process, Finalized, Sent, Acknowledged, Payment Received, Write Off; payable statuses Incoming, Received, Approved, Payment Sent; Billed Through, Cancelled; totals `invoiceTotal`, `appliedPaymentsTotal`, `unpaidTotal`, `dueDate` | `component/mr-mantle/entity/AccountingAccountEntities.xml` |
| `Payment`, `PaymentApplication`, `PaymentBudgetAllocation`, `Deduction`, `PaymentContent` (`mantle.account.payment`) | Statuses Proposed, Promised, Authorized, Delivered, Confirmed Paid, Cancelled, Void, Declined; reconcile status Not / Partly / Reconciled; applications to invoices and to other payments | same |
| `PaymentMethod`, `BankAccount`, `BankAccountCheck`, `PaymentMethodTrans`, `PaymentMethodFile`, `PaymentGatewayConfig`, `PaymentGatewayResponse` (`mantle.account.method`) | Bank account with `glAccountId`, `ledgerBalance`, `availableBalance`, `balanceDate`; statement lines with FIT id, amount, check number, matched payment and GL entry, `noReconcile` | same |
| `FinancialAccount`, `FinancialAccountTrans`, `FinancialAccountAuth`, `FinancialAccountType` (`mantle.account.financial`); `BillingAccount` (`mantle.account.billing`) | Deposit / gift-card / store-credit accounts; billing account with `accountLimit` (the only credit-limit field) | same |
| `GlAccount`, `GlAccountOrganization`, `GlAccountOrgTimePeriod`, `GlAccountCategory`, `GlAccountGroup`, `GlAccountParty`, `GlBudgetXref` (`mantle.ledger.account`) | Account tree (`parentGlAccountId`), type and class, `isDebit`, `disallowPosting`; per-org and per-period balances; categories and groups for reports | `component/mr-mantle/entity/AccountingLedgerEntities.xml` |
| `AcctgTrans`, `AcctgTransEntry`, `GlJournal` (`mantle.ledger.transaction`) | Transaction with `isPosted`, `scheduledPostingDate`, links to invoice, payment, application, asset, shipment, work effort, financial account transaction; reverse links; journal as a batch of transactions with `isPosted` | same |
| `PartyAcctgPreference`, `GlAccountTypeDefault`, `ItemTypeGlAccount`, `InvoiceTypeTransType`, `PaymentTypeGlAccount`, `PaymentInstrumentGlAccount`, `AssetTypeGlAccount`, `ProductGlAccount`, `TaxAuthorityGlAccount`, … (`mantle.ledger.config`) | Fiscal year start month/day, base currency, COGS method, invoice and order numbering, GL code mask, error journal, default settlement term; posting defaults by type | same |
| `GlReconciliation`, `GlReconciliationEntry` (`mantle.ledger.reconciliation`) | GL reconciliation header and entries (Created, Reconciled); no screen uses them | same |
| `TimePeriod`, `TimePeriodType` (`mantle.party.time`) | Fiscal periods per organization with parent/previous and `isClosed` | `component/mr-mantle/entity/PartyEntities.xml` |
| `Budget`, `BudgetItem`, `BudgetItemDetail`, `BudgetRevision`, `BudgetRevisionImpact`, `BudgetReview`, `BudgetScenario`, `BudgetScenarioRule`, `BudgetScenarioApplication`, `BudgetParty` (`mantle.other.budget`) | Budgets by GL account and sub-period; revisions, reviews and scenarios (no screens) | `component/mr-mantle/entity/AccountingOtherEntities.xml` |
| `TaxAuthority`, `TaxAuthorityCategory`, `TaxAuthorityParty`, `TaxAuthorityAssoc`, `TaxGatewayConfig`, `TaxStatement` (`mantle.other.tax`) | Tax authorities (geo, authority party, include-tax-in-price, tax-id format), their product categories, party tax ids / exemption / nexus, authority associations; tax gateway config naming the calculate service (seed `LOCAL`), linked from `ProductStore.taxGatewayConfigId`; tax statements (e.g. 1099-MISC). **No rate record** — `TaxAuthorityRate` is commented out; no screens | same |
| `Asset`, `AssetDepreciation` (`mantle.product.asset`) | Book fields on the asset (acquire cost, salvage value, depreciation and type, year-begin depreciation, tax depreciation and type); depreciation per period (monthly, annual, useful life years, years remaining, `acctgTransId`); types Straight Line, Double Declining Balance, Sum of Years Digits, Units of Production; tax MACRS GDS 5/7 year | `component/mr-mantle/entity/ProductAssetEntities.xml` |
| `ReturnItemBilling`; `Subscription` | Return item ↔ return invoice item; subscriptions (fulfilled through order invoicing, no recurring billing) | `component/mr-mantle/entity/{OrderEntities,ProductDefinitionEntities}.xml` |

### Services

| Service | Purpose | Key files |
| --- | --- | --- |
| `create#Invoice`, `adjust#Invoice`, `create#EntireOrderPartInvoice`, `create#SalesShipmentInvoices`, `create#PurchaseShipmentInvoices`, `create#ProjectExpenseInvoice`, `create#ProjectInvoiceItems`, `create#TimeEntryInvoiceItems`, `create#InvoiceBillThroughItems`, `create#InvoiceCreditMemo`, `reverse#Invoice`, `cancel#InvoiceAndPayments`, `autoApplyTo#Invoice`, `send#SalesInvoicePastDueEmails`, `send#CustomerPastDueEmail`, `get#ReceivableStatementInfo` | Invoice creation from orders, shipments, projects and time; credits; past-due emails (weekly ServiceJob `send_SalesInvoicePastDueEmails`, paused by default in `component/mr-mantle/data/MantleSetupData.xml`) | `component/mr-mantle/service/mantle/account/InvoiceServices.xml` |
| `create#Payment`, `create#InvoicePayment`, `create#RefundPayment`, `apply#InvoicePayment`, `apply#PaymentToPayment`, `apply#InvoiceToInvoice`, `autoApply#Payment`, `unapply#PaymentApplication`, `void#Payment`, `authorize#Payment`, `capture#Payment`, `refund#Payment`, `assign#BankAccountCheckNumber` | Payments, applications, gateway operations, checks | `component/mr-mantle/service/mantle/account/PaymentServices.xml` |
| `upload#BaiVersion2`, `upload#OfxVersion1`, `match#PaymentMethodTransUnmatched`, `reconcile#PaymentMethodTrans`, `unreconcile#PaymentMethodTrans`, `noReconcile#PaymentMethodTrans`; `generate#NachaFile`, `import#NachaReturn`; `generate#PositivePayFile` (bank-specific formats) | Statement import and bank reconciliation; ACH files and returns; positive pay | `component/mr-mantle/service/mantle/account/{BaiServices,OfxServices,ReconciliationServices,NachaServices,PositivePayServices}.xml` |
| `deposit#FinancialAccount`, `withdraw#FinancialAccount`, `transfer#FinancialAccount`, `adjust#FinancialAccount`, `get#StatementPrintInfo` | Financial accounts | `component/mr-mantle/service/mantle/account/FinancialAccountServices.xml` |
| `create#AcctgTrans`, `post#AcctgTrans`, `unpost#AcctgTrans`, `post#ReverseAcctgTrans`, `move#AcctgTransEntry`, `calculate#AcctgTransTrialBalance`, `close#FinancialTimePeriod`, `reopen#FinancialTimePeriod`, `create#PeriodCloseAcctgTrans`, `recalculate#GlAccountOrgSummaries`, `create#GlJournal`, `post#GlJournal`, `init#PartyAccountingConfiguration` | GL transactions, period close, journals, org setup | `component/mr-mantle/service/mantle/ledger/LedgerServices.xml` |
| `post#Invoice`, `post#Payment`, `post#PaymentApplication`, `post#AssetReceipt`, `post#AssetIssuance`, `calculateAndPost#AllFixedAssetDepreciations`, `post#PhysicalInventoryVariance`, `post#WorkEffortCost`, `post#FinancialAccountTrans` (+ repost/revert) | Auto-posting of business documents to the GL | `component/mr-mantle/service/mantle/ledger/{InvoiceAutoPostServices,PaymentAutoPostServices,AssetAutoPostServices,OtherAutoPostServices}.xml` |
| `run#BalanceSheet`, `run#IncomeStatement`, `run#CashFlowStatement`, `run#RetainedEarningsStatement`, `run#FinancialRatios`, `run#PostedAmountSummary`, `get#AccountLedgerInfo`, `get#PeriodSeriesSummary` | Financial statements | `component/mr-mantle/service/mantle/ledger/LedgerReportServices.xml` |
| `create#Budget`, `store#BudgetItemsSubPeriods`, `run#BudgetExpenseReport`, `run#BudgetExpenseDetailReport` | Budgets | `component/mr-mantle/service/mantle/other/{BudgetServices,BudgetReportServices}.xml` |
| `calculate#SalesTax`, `calculate#OrderSalesTax`, `calculate#InvoiceSalesTax`, `create#TaxStatement`, `create#AllVendor1099MiscStatements`, `get#UsaIrs1099MiscFormData` | Gateway interface for sales tax (only order tax is wired; the `LOCAL` gateway and invoice tax are stubs) and 1099 statements | `component/mr-mantle/service/mantle/other/TaxServices.xml` |
| `create#PayrollInvoice`, `approve#PeriodInvoices`; `process#ReturnItemResponses` | Payroll invoices; return credit/refund invoices with `ReturnItemBilling` | `component/mr-mantle/service/mantle/humanres/PayrollServices.xml`, `component/mr-mantle/service/mantle/order/ReturnServices.xml` |

What is missing in the baseline: tax rates and a working tax calculation, and tax screens of any kind; a credit-limit screen and check; recurring invoices; dunning levels; a collections view; 3-way match; payment runs; a bank statement session (period, closing balance, difference); journal templates; per-type period locks; fixed-asset classes, depreciation-run review and disposal; partner ledger and period-comparison reports; a modern landing page with KPIs.

---

## 18. Gaps & BOSS implications

### Gaps in the reference set

- **Enterprise-only in Odoo, absent from the community checkout:** `account_reports` (financial statements, partner ledger, aged balances), `account_followup` (dunning), `account_asset` (fixed assets and deferred revenue), `account_accountant` (bank reconciliation widget), `account_batch_payment`, budgets, and `account_3way_match` (the Purchase setting is an upsell toggle). The `Statement Reports` and `Partner Reports` menu folders are empty without Enterprise. Present instead: `account_debit_note`, `account_edi*` (+ `account_peppol`), `account_check_printing`, `account_qr_code_{sepa,emv}`, `account_tax_python`, `analytic`, Purchase Bill Lines matching.
- **No collections case in any ERP:** only Frappe Lending (a lender's app) has a case with agent, activities and promises to pay; ERPNext dunning and Dolibarr/Akaunting reminders are letter/email only.
- **Bank feeds:** no live bank feed anywhere; ERPNext and the Moqui baseline import statement files (CSV/BAI2/OFX); Akaunting's Bank Feeds widget only advertises a paid cloud app. Carbon has no company bank register or reconciliation; AureusERP has bank accounts but no reconciliation.
- **Budgets:** only ERPNext (and the Moqui baseline) have GL budgets; Ever Gauzy's budgets are client/project spend caps.
- **Fixed assets:** only Carbon, ERPNext and Dolibarr have books; Carbon alone has lease accounting and revenue-recognition runs.
- **Thin references:** Akaunting has no GL, journals or fiscal years (bank-account bookkeeping with categories); Ever Gauzy is income/expense-centric with no GL, banking or dunning; metasfresh's React UI is a thin shell over backend window definitions (`backend/de.metas.{acct.base,acct.webui,banking,dunning,einvoice.base,payment.esr}`), so its screens could not be read as UI. Dolibarr's `htdocs/supplier_invoice/` is only `admin/`; real supplier screens are `htdocs/fourn/facture/`. Akaunting's `modules/` is empty (`.gitkeep`), so its paid apps (including double-entry) are absent.
- **KSeF** in the Dolibarr community modules is metadata only.

### Notable gaps in the Moqui baseline

- **No landing page with numbers.** The dashboard is two link boxes plus an org summary; no aging strip, cash position, bills due or unreconciled count (compare Odoo journal cards and KPI bar, Carbon invoicing dashboard).
- **No tax rates and no tax screens.** `TaxAuthority`, `TaxStatement` and the `calculate#SalesTax` gateway interface exist, but there is no rate record (`TaxAuthorityRate` is only in an XML comment), the seeded `LOCAL` gateway `calculate#SalesTaxLocal` is an unimplemented stub, and `calculate#InvoiceSalesTax` is empty — so orders and invoices get no tax unless an external gateway component is installed.
- **No credit control.** `BillingAccount.accountLimit` has no screen and nothing checks it on orders or invoices (compare ERPNext Customer Credit Limit and overdue threshold).
- **Collections is one email.** `send#CustomerPastDueEmail` and a paused weekly job; no levels, fees, letters, activities or promises.
- **No recurring invoicing** for subscriptions or templates; the `InvoiceTemplate` type is unused.
- **No 3-way match or bill hold.** Purchase invoices link to orders and shipments (Orders and Shipments tabs) but nothing compares billed, ordered and received quantities.
- **No payment run.** Bulk Checks creates and numbers checks; NACHA and Positive Pay generate files; nothing selects due bills into a batch.
- **Reconciliation has no session.** Statement lines are matched one by one; there is no statement period, closing balance or difference, and `GlReconciliation` is unused.
- **Period close is all-or-nothing.** `TimePeriod.isClosed` locks everything; no per-type lock dates, no exception list, no pre-close checklist (Carbon unposted-documents popover).
- **Fixed-asset books are fields, not a workflow.** No asset class defaults, no depreciation-run preview, no disposal/revaluation posting.
- **Reports lack drill-down and comparisons**; no partner ledger; no saved views.
- **Journals are batches only.** No sale/purchase/bank books with their own numbering and defaults; no journal-entry templates.

### What each reference contributes

| Reference | Take |
| --- | --- |
| Odoo | Journal kanban + KPI bar as the home; Customers / Vendors / Accounting / Reporting / Configuration menu; lock dates on five axes + lock exceptions + secured (hashed) entries; register-payment wizard with write-off; Purchase Bill Lines matching and Control Policy; reversal wizard; EDI framework (`account_edi`, UBL/CII, Peppol); autopost-per-vendor prompt |
| ERPNext | Widest coverage: Payment Entry + Payment Reconciliation; bank statement import → transactions → rules → reconciliation tool; Dunning + Dunning Type; Process Statement of Accounts; Customer Credit Limit with overdue threshold; Accounting Period per document type; Budget with Stop/Warn/Ignore per stage; Subscription → invoices; Asset + depreciation schedules; immutable ledger; ledger health monitor; sidebar/workspace layout |
| Carbon | Settlement model (one table, discount/write-off/FX per application, derived paid/overdue); AR/AP workbenches; GL-vs-subledger tie-out on the dashboard; cutover/activation wizard with readiness checklist and opening balances; Default Accounts form; fixed assets with book/tax depreciation and run screens; leases, revenue recognition, intercompany |
| AureusERP | Proof that an Odoo-shaped UI ports cleanly to a server-rendered framework; the minimum seven-report Reporting cluster; setup-gate callout; base-resources-plus-cluster layering |
| Dolibarr | Bank entries list with inline reconcile columns; payments to-validate queue; cheque deposits; direct-debit (SEPA) batches and rejects; VAT declaration and `quadri_detail`; accountancy closure page; country chart data; asset module; scheduled due-date reminders |
| Dolibarr community modules | French e-invoicing lifecycle statuses and access-point sync queue; Stancer gateway back office (payments, payouts, refunds, disputes, bookkeeping) |
| Frappe payments / Lending | Gateway settings per provider with hosted checkout pages; collections case, activity outcomes, promise to pay, dunning rules by days past due |
| Akaunting | Simplest usable bookkeeping: arrangeable widget dashboard, invoice tabs Unpaid/Draft/All, recurring invoices/bills/transactions, reconciliation with a zero-difference rule, signed-URL customer portal, days-after-due reminder list |
| Ever Gauzy | Org-level editable invoice templates; invoice lines pulled from tasks, projects and expenses; amounts-owed report |
| metasfresh | Payment allocation and open-items headers; backend module list (SEPA, ESR, PayPal, Revolut, SumUp, DATEV, dunning) as a checklist of integrations |

### Candidate screen inventory (IronStone Accounting)

| Area | Screens |
| --- | --- |
| Home | Accounting landing page: KPI strip (receivables due and overdue, payables due this week, cash by bank account, unreconciled lines, unposted documents), AR/AP aging bars, GL-vs-subledger tie-out, bills awaiting approval, quick links; dashboard widgets **(reused: Insights, every app's landing page)** |
| Receivables & collections | Invoice list (tabs Draft / Unpaid / Overdue / All, saved filters); invoice detail (status bar, lines, tax grid, payments and credits applied, orders and shipments, content, Chatter); credit memo, including credit/refund from customer returns **(reused: Customer Service, Warehouse, Commerce)**; recurring invoice schedules (template or subscription driven; subscriptions **(reused: Sales, Commerce)**); receivables workbench (open items by customer, aging, apply credits); collections list (overdue customers, last activity, next action date, promise to pay); dunning levels and letters (building on collections); customer statements batch; invoice view and pay online **(reused: Commerce)** |
| Payables & payment runs | Bill list and detail (Incoming → Received → Approved, hold with release date); bill-line match to PO and receipt with exceptions list **(reused: Purchasing)**; debit notes from supplier returns **(reused: Purchasing, Warehouse)**; payment run (select due approved bills → payments → checks / NACHA / Positive Pay); expense-claim posting queue (expense claims **(reused: People)**, which captures and approves them) |
| Payments | Payment list and detail with allocation grid (unpaid invoices, unapplied payments, discount, write-off); payments to validate; refunds; gateway transactions |
| Banking & reconciliation | Bank accounts (from `PaymentMethod`/`BankAccount`) with balances; statement import (BAI2, OFX, CSV); reconciliation session (period, closing balance, difference, two-sided match list, rules); unmatched queue; financial accounts (deposits, gift cards, store credit) |
| General ledger | Chart of accounts tree with import; journal entry list and form (lines, dimensions, attachments, reverse); journal entry templates; transaction entries (line search); account ledger |
| Period close | Fiscal years and periods; close checklist (unposted documents, unreconciled lines, depreciation run, tie-out); per-type lock dates with exceptions; period runs list (depreciation; revaluation, deferrals) |
| Fixed assets | Book tab on the Facility & equipment record **(reused: Maintenance, Warehouse, Manufacturing, Commons)**; asset classes with default accounts; depreciation run with preview, post, reverse; disposal and revaluation |
| Tax | Tax authorities and tax rates (new record or gateway, see Open questions) within the payment, shipping & tax settings **(reused: Commerce, Admin)**; tax-on-document grid; tax statements and returns (sales tax summary, 1099); e-invoice tracking |
| Budgets | Budget list, GL-account × period entry, budget vs actual, Stop/Warn rule on purchase orders and expenses |
| Reports | Report list: Trial Balance, General Ledger, Partner Ledger, Balance Sheet, Income Statement, Cash Flow, Retained Earnings, Financial Ratios, AR/AP aging summary and detail, Invoice Reconciliation; row drill-down; period comparison; export |
| Reused record screens | Accounting tab on Customer 360 **(reused: Sales, Customer Service, Marketing, Commerce)**; AP tab on Supplier 360 **(reused: Purchasing, Products, Warehouse)**; invoices and payments on Order detail **(reused: Sales, Purchasing, Customer Service, Warehouse, Commerce)**; invoice links on Shipment detail **(reused: Warehouse, Customer Service, Sales, Purchasing, Commerce)**; cost history on Product 360 **(reused: Products, Commerce, Purchasing, Manufacturing, Warehouse, Sales)**; bill approval in Approvals waiting **(reused: header Notifications, People, Projects, Purchasing, Sales)** |
| Configuration | Accounting preferences per organization; setup wizard (readiness checklist, chart choice, opening balances, posting defaults); posting defaults by item/payment/invoice/asset type; payment terms and settlement terms; currencies and exchange rates; payment methods and payment gateways **(reused: Commerce, Admin)**; numbering |

### Data-model findings

- **Mantle records that fit as is:** `Invoice`/`InvoiceItem` and their status flows; `Payment`/`PaymentApplication`; `PaymentMethod`/`BankAccount`/`PaymentMethodTrans` for banking; `FinancialAccount`; `GlAccount`, `AcctgTrans`/`AcctgTransEntry`, `GlJournal`; `mantle.ledger.config` mappings; `TimePeriod`; `Budget`/`BudgetItem`; `TaxAuthority`/`TaxGatewayConfig`/`TaxStatement` and the `ItemSalesTax` item pattern; `Asset` book fields and `AssetDepreciation`; `ReturnItemBilling`; `SettlementTerm`.
- **Derived rather than stored:** "partly paid" and "overdue" can come from `unpaidTotal`, `appliedPaymentsTotal` and `dueDate`, as in Carbon and ERPNext.
- **Activities for collections:** collection calls, emails and promises to pay fit as `WorkEffort` activities on the customer (purposes `WepPhoneCall`, `WepEmail`, `WepToDo`) with an Accounting purpose or category to filter them; a promise-to-pay amount needs a field or a small new record.
- **Where new records look necessary (options):** a tax-rate source — either a new rate record (authority, category, rate type, rate, from/thru, store; the commented-out `TaxAuthorityRate` is a ready field list) read by a real `calculate#SalesTaxLocal`, or a decision-table resource, or only an external gateway (Open questions); an implementation of `calculate#InvoiceSalesTax`; credit limit per customer and organization with an overdue threshold (or `BillingAccount.accountLimit`); recurring invoice schedule (frequency, next date, template invoice or `Subscription`, last generated); dunning level and letter template; payment run header (date, bank account, selection, status) over `Payment`; bank statement session (bank account, period, opening and closing balance, status) over `PaymentMethodTrans` — or the unused `GlReconciliation`; per-type period lock (period or date, scope: all / sales / purchases / tax, exempt user group); journal-entry template; asset class with default accounts and depreciation defaults; depreciation run header over `AssetDepreciation`; bill-line match result (or computed view) for 3-way match exceptions; e-invoice document status.
- **Possible existing homes:** `PartyAcctgPreference` may absorb lock dates and setup-wizard state; `AcctgTransTypeEnumId` plus `GlJournal` may cover what Odoo calls journals.

### Sequencing notes

- **Cheap on the baseline:** invoice and bill lists/detail (Mantle flows and statuses exist; overdue derives from `unpaidTotal` and `dueDate`); payment detail with the allocation grid (Edit Payment already shows unpaid invoices and unapplied payments beside the applications); the receivables workbench and Accounting's Customer 360 tab (Party Financial Info, AR aging reports and the customer statement PDF exist); bank accounts, statement import and matching (BAI2/OFX import and Match and Reconcile exist); chart of accounts, journal entries and transaction search (`GlAccountTree`, `FindTransaction`, `FindTransactionEntry`); periods with close/reopen (`close#FinancialTimePeriod`, `reopen#FinancialTimePeriod`); the report list (`LedgerReportServices`); accounting preferences and posting defaults (Org Settings and `init#PartyAccountingConfiguration`); the depreciation run as the book tab (`calculateAndPost#AllFixedAssetDepreciations` behind **Post Depreciation**).
- **Dependencies:** tax on orders and invoices depends on a rate source plus real `calculate#SalesTaxLocal` and `calculate#InvoiceSalesTax`, and authority and rate maintenance depend on the rate record chosen; the landing page KPIs depend on the reused dashboard widgets; a reconciliation session depends on a session record (or `GlReconciliation`); the pre-close checklist depends on unposted-document and unreconciled-line queries; report drill-down and comparisons depend on report-engine work that Insights also uses; payment runs depend on approved bills and a run header, then reuse Bulk Checks, NACHA and Positive Pay; 3-way match exceptions depend on a match result; recurring invoicing depends on a schedule record and a generator; dunning levels and collections promises depend on collections activities; a credit hold depends on a credit-limit record and a check on orders; a depreciation preview depends on a run header.
- **Expensive (no baseline support):** per-type lock dates, e-invoicing, journal templates, asset classes, disposal and revaluation, budgets beyond the existing screens, leases, revenue recognition, revaluation and intercompany runs, and multi-company consolidation.

### Open questions

- **Journals.** Odoo-style journals (sale, purchase, bank, cash books with numbering and default accounts) do not exist in Mantle, where `GlJournal` is a posting batch. Add a book record, or rely on `AcctgTransTypeEnumId`, invoice types and bank accounts for the same grouping?
- **Invoice view and pay online.** Commerce's store account (research-commerce.md §7) and Accounting both need the online invoice view/pay page over the same invoices, statements and pay-online flow. Is it one reused page in both, and is it also part of a customer portal (crosscut §8, Portals)?
- **Where the shared gateway/tax records are edited.** Crosscut §4 lists payment, shipping & tax settings in Commerce (per store, per initial-design), Accounting (tax authorities, payment methods) and Admin (gateway configuration); tax authorities, rates and payment gateway configs also serve sales orders, purchase bills and POS outside any store. One option is that Accounting's and Admin's versions edit the authority/rate and gateway records and Commerce's binds them per store; another is that every version edits them in its own context. Which versions edit and which read (crosscut §8)?
- **Tax-rate source.** Mantle has no rate record (`TaxAuthorityRate` is commented out in favor of a Drools decision table that is not in the checkout) and the local gateway is a stub. Options: (a) enable a rate entity close to the commented-out `TaxAuthorityRate` and implement `calculate#SalesTaxLocal` over it, with a BOSS rate-maintenance screen; (b) a decision-table/rules resource edited outside screens; (c) external tax-service gateways only, each a `TaxGatewayConfig` naming its calculate service. (a) matches every reference (Akaunting, AureusERP/Odoo, ERPNext tax templates all keep rates as records); the evidence favors (a) plus (c) per store.
- **Credit limit.** Where is the limit edited — Accounting's version of the reused Customer 360 or a separate Accounting screen — and is it `BillingAccount.accountLimit` or a new per-customer record? Where does the order hold show: on Order detail in Sales, in Approvals for Accounting, or both?
- **Collections case.** Plain activities on Customer 360, or a collections record like Frappe Lending's case (status, agent, next action date, promises)?
- **Reconciliation model.** Keep reconciliation on `PaymentMethodTrans` (what the baseline uses) or move to the unused `GlReconciliation`, which can also reconcile non-bank GL accounts?
- **Period locks.** Extend `TimePeriod` / `PartyAcctgPreference` with lock dates, or a new lock record with exceptions?
- **Fixed-asset book tab.** How much of the book (net book value read-only vs capitalize/dispose actions) appears in each app's version of the reused Facility & equipment record (Accounting, Maintenance), and how much is in a separate Accounting asset list? (Same question appears in research-maintenance.md.)
- **Advanced period runs.** Are leases, revenue recognition and intercompany in scope for IronStone Accounting at all, or left to an add-on?

### Checkout path quirks

- Odoo paths are written `odoo/addons/<addon>/…`, which is `3p_other/odoo/odoo/addons/<addon>/…` on disk.
- ERPNext paths start inside the repo (`erpnext/accounts/…`); ERPNext dashboard charts and number cards are directories holding a same-named JSON file.
- AureusERP's user-facing resources are in the `accounting` and `invoices` plugin clusters; the `accounts` plugin holds hidden base resources with the same names, so a resource name alone is ambiguous.
- Carbon's accounting and invoicing modules have tests (`accounting.periods.test.ts`, `accounting.defaults.test.ts`, `invoicing.settlements.test.ts`) without same-named source files; the logic is in `apps/erp/app/modules/accounting/accounting.service.ts` and `apps/erp/app/modules/invoicing/invoicing.service.ts`.
- Akaunting keeps document forms in `resources/views/components/documents/{form,show,template}/`, not under `resources/views/common/`.
- Frappe payments and Lending paths repeat the app name (`payments/payments/…`, `lending/lending/…`).

**Bottom line.** The Moqui baseline is already a fuller accounting engine than most references — invoices, payments with applications, auto-posting, bank statement import and matching, period close, budgets and statements all exist — so the gap the research finds is mainly new UI over Mantle: a numbers-first landing page, workbenches for receivables and payables, a reconciliation session, a close checklist and drill-down reports, plus the missing controls (tax screens, credit limits, collections, 3-way match, payment runs, lock dates, depreciation runs). Carbon and ERPNext are the strongest references for the new pieces; Odoo community and AureusERP mostly confirm the menu shape.
