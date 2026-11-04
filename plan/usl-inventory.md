# mr-mantle service inventory

Per-service inventory of the mr-mantle component, for tracking service-level feature parity in IronStone BOSS.

- Source: `runtime/component/mr-mantle/service/` (current working tree).
- Service: every `<service>` element in the service definition XML files under `service/mantle/` (including `GeneralServices.xml`).
- Test services (`PaymentTestServices.xml`, `OrderTestServices.xml`), service ECAs (`*.secas.xml`), and the REST API definition (`mantle.rest.xml`) are excluded.
- The **Designed in** column is filled when a design file is reviewed with the IronStone screen path(s) whose form summaries call the service (blank when no screen calls it); the **Implemented in** column is filled during implementation with the screens that call it. See [design-doc-guide.md](design-doc-guide.md) §9.
- **Implemented in** was filled on Oct 19, 2026 from the drawers-commons build (the Commons, Comms, `Shared`, `PublicShare` and `Unsubscribe` screens): each screen whose transitions, actions or forms call the service, directly or through the `ironstone.*` services of `service/ironstone/` (followed from one to the next, but not into Mantle's own calls, so `save#*ContentFile`, which `create#*Content` calls, stays blank). A screen that includes a `template/` record (ContactRecord, ConsentRecord) has that record's calls, so the contact record's are on both `Commons/Contacts/ContactDetail` and `Commons/Contacts/List`; a `.qvue` screen goes by its `.xml` path; a service the shell calls through a BOSS theme value names the value, and `Unsubscribe` includes its token route's check. The other apps' screens from the first port (Sales/Reports, Projects/Timesheets) are not counted.
- **Added** tables, at the end of Party, Request and Work and as the Marketing section: the services Mantle gained during that build that a built screen calls (102 of the 143 new ones; the rest are not listed yet).
- **Implemented in** of the design gaps closed on Oct 19, 2026 (Chatter edit and delete, the contact info card, EventDetail's linked records, the Account photo, Duplicate page): `update#RequestComment` and `delete#RequestComment` are reached from Chatter through Mantle's `update#RecordNote` and `delete#RecordNote` for a note on a request, and are filled with `Shared/Chatter`, which edits and deletes notes on every record (the Commons hosts, RequestDetail among them). Their **Designed in** is blank until design-drawers-commons, which names most of them in its form summaries and §19, is reviewed again.
- **Designed in** for [design-projects.md](design-projects.md) was filled on Oct 21, 2026 from the Mantle services its screen sections name (the form summaries, the actions and the Context passed blocks), each screen by the path the design gives it, after what an earlier design wrote; the `Projects` root calls `setup#UserOrganizationInfo` as the Commons and Comms roots do. Services the design names as new are not rows until Mantle has them. The 17 services of `work/GitServices.xml`, added to Mantle on Oct 20, joined the Work table (no BOSS screen calls them yet), and `link#RequestRecord` and `unlink#RequestRecord`, added after the drawers-commons save point, joined Request's Added table with the Commons screens that call them.
- **Implemented in** for [design-projects.md](design-projects.md) was filled on Oct 22, 2026 at the end of the Projects build (impl-projects.md P11), as the drawers-commons pass was: each Projects screen whose transitions, actions or forms call the service, directly or through the `ironstone.*` services (followed from one to the next, not into Mantle's own calls), after what Commons wrote. A `.qvue` screen and its terminal twin go by the `.xml` path (`Projects/Time/MyTime` for MyTimeTui too); the shared screens by their Projects mount (`Projects/WorkItems/WorkItemDetail`, `Projects/Requests/RequestDetail`, `Projects/Billing/InvoiceDetail`, `Projects/Billing/OrderDetail`); Commons' Knowledge and KnowledgeTui by the Docs tab (`Projects/Projects/ProjectDetail/Docs`); the root's always-actions as `Projects`; the public request form as `RequestIntake`. A service reached from more than twelve Projects screens (the visibility and settings reads behind the access and find services) is written as a count. 68 rows filled; the **Added in the Projects build** tables at the end of Account, Party, Request and Work hold the 112 services Mantle gained in P1–P10 that a built screen calls (their **Designed in** is blank: the design names them as new, §15).
- **Designed in** for the six core app drafts and [design-crosscut.md](design-crosscut.md) was extended on Oct 27, 2026 from their form/service coverage review. New mappings are additive to Commons and Projects; **Implemented in** is unchanged. Proposed services and definitions inside XML comments are not counted as active existing services.
- **Designed in** for the six core designs and [design-crosscut.md](design-crosscut.md) was updated on Oct 28, 2026 after their review ([review-core-apps.md](review-core-apps.md)). Paths of renamed or moved screens are replaced in place. Entries were added for existing services the reviewed designs now call from a screen (the Manufacturing MaterialIssueReceipt mount, Downtime and NewWorkOrder; Warehouse SupplierReturnShipment and Ship; Accounting InventoryValuation and SalesAnalysis; the OrderDetail approve guard's `check#OrderPreApprove`; Products VariantBuilder). `modify#ProductPrice` no longer lists SupplierPrices: it is the price resolver's modifier interface, and writes go through the proposed `store#ProductPrice` (R-PUR-04). Services that only rules or other services call (`create#PurchaseShipmentInvoices`, `create#ProductionRun`, `reserve#IncreasedAsset`, `post#AssetReceipt`, and similar) stay blank. **Implemented in** is unchanged.

- **PASS design follow-up (Oct 27, 2026):** [design-forum.md](../../mr-pass/plan/design-forum.md) adds `PASS:`-prefixed contexts for existing Mailbox/Communication services used through the proposed public facade and shared-policy extensions. Implemented in is unchanged. Proposed PASS services and future Commerce/Publishing screens are not inventory claims.
- **Implemented in** for [design-accounting.md](design-accounting.md) was filled on Oct 31, 2026 at the end of the Accounting build (impl-accounting.md P21): each Accounting screen whose transitions, actions or forms call the service, directly or through the `ironstone.accounting` or Mantle services (and the Mantle SECAs a state change runs, named where they are the path), with shared screens by their Accounting mount. A service the build replaced is `—` with the service that does its work; a function left for later is `—` with its impl-accounting.md §7 item. Rows designed only for `Shared/InvoiceDetail` were filled for Accounting's InvoiceDetail and BillDetail. Rows that name other apps keep their other paths blank, and rows designed only for the shared Order, Shipment, Return, Equipment and Product screens by other apps stay blank.
- **Implemented in** for [design-warehouse.md](design-warehouse.md) was filled on Oct 31, 2026 at the end of the Warehouse build (impl-warehouse.md P18): each Warehouse screen whose transitions, actions or forms call the service, directly or through the `ironstone.warehouse` services, the `WarehouseTaskServices` guards or Mantle's own services (and the SECA, named where it is the path), with shared screens by their Warehouse mount and handheld tasks by `Warehouse/Handheld/...`. A service a guard or BOSS read replaced is `—` with the service or screen that does its work (for example Availability's `get#ProductStockTotals`, Ship's `get#ShipContext`); a function left for later is `—` with its impl-warehouse.md §7 item, and one not built is `—` with what the screen does instead. 36 rows filled here (the two earlier "not used" cells now start with `—`); rows that name other apps keep their other paths as they were.

**People design (Oct 31, 2026):** [design-people §14.2](design-people.md#142-baseline-forms-and-service-coverage) maps verified current services used by People forms and inherited time/rate forms, with required guard/source extensions labelled in the design. Proposed People services and legacy payroll helpers mentioned only for disposition are not added as active screen calls. Implemented in is unchanged. The already-existing get#PartyCapacity service receives a separate source-verified row under Work.

**Maintenance design (Oct 31, 2026):** [design-maintenance](design-maintenance.md) maps the verified baseline forms and current services used by its own screens and contextual mounts. Procedures/checklists are core WorkEffort templates and independent executions. Mappings are additive; **Implemented in** is unchanged. Proposed services and helpers named only for internal implementation or limitation analysis are not active service-inventory claims.

**Commerce and Shop design (Oct 31, 2026):** [Commerce](design-commerce.md) adds scoped staff mounts and [Shop](../../mr-pass/plan/design-shop.md) adds `PASS:Shop/...` paths for verified existing services used through its proposed facade wrappers. All previous mappings and Implemented in cells are unchanged. Proposed `shop.*` operations and new service packages remain in those designs, not this active-service inventory. Worker-only subscription, payment, reservation and email effects are covered by their automation registers, not claimed as extra screen calls.

**Sales design (Oct 31, 2026):** [Sales](design-sales.md) maps source-verified existing services
used by its forms and shared contexts, including guarded native calls behind proposed Sales/PASS
facades. Designed in entries are additive; Implemented in is unchanged. Proposed Sales service
families remain in the design. Existing definitions absent from the older inventory are listed
in the source-verified additions section below; worker/SECA-only effects are not extra screen calls.

**Marketing design (Oct 31, 2026):** [Marketing §16.2](design-marketing.md#162-baseline-forms-and-service-coverage)
adds source-verified existing list, consent, contact/import and event services used by Marketing
forms and contextual mounts, plus public preference operations. Required scope/policy extensions
are explicit in the design. Proposed Marketing services stay there; existing mappings and every
Implemented in cell remain unchanged. The source-verified additions table below covers an existing
calendar service missing from the older inventory.

**Admin and Insights designs (Oct 31, 2026):** [Admin](design-admin.md) and
[Insights](design-insights.md) add source-verified Mantle calls used by their own forms and
contextual mounts. Proposed framework/BOSS extensions and framework report, identity and monitor
services remain in the designs, outside this Mantle inventory. Existing Designed in mappings
and every Implemented in cell are preserved; catalog links alone do not claim service calls.

**Design review fixes (Nov 1, 2026):** after [review-suite-apps.md](review-suite-apps.md),
renamed paths are replaced in place (`Marketing/Audiences/Import` → `AudienceImport`,
`Consent/Contact` → `Consent/ConsentDetail`, `PASS:Marketing/Preferences` →
`PASS:Account/EmailPreferences`, and the customer pages `ServicePortal/*` → `PASS:Support/*`).
Shop's own return request is gone: `find#ReturnableOrderItems` names Support's RequestReturn and
its Shop mount `PASS:Shop/Orders/RequestReturn`. Sales declines a quote with `cancel#Order`, not
`reject#Order`; Maintenance writes facilities with `store#Facility`, not `create#`/`update#Facility`.
Existing services the fixed designs now call gain those screens (People, Maintenance, Sales,
Admin imports and exports, Insights' named report sources, Commerce, Shop), and existing Mantle
services they name that had no row are in the last table. Framework (`org.moqui.*`) and proposed
services are not rows. **Implemented in** is unchanged.

## Account (162 services)

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| BaiServices | upload#BaiVersion2 | Accounting/Banking/StatementImport | Accounting/Banking/StatementImport (review#StatementImport reads BAI2 with the same reader) |
| BaiServices | consume#Bai2SystemMessage |  |  |
| BaiServices | import#BaiVersion2 |  |  |
| FinancialAccountServices | get#StatementPrintInfo | Accounting/Banking/FinancialAccountDetail | — (not used: it checks no access, F432; FinancialAccountDetail prints its own authorized movements) |
| FinancialAccountServices | create#FinancialAccount | Accounting/Banking/FinancialAccounts | Accounting/Banking/FinancialAccounts |
| FinancialAccountServices | update#FinancialAccount | Accounting/Banking/FinancialAccountDetail | — (not built; FinancialAccountDetail edits no account header) |
| FinancialAccountServices | getOrCreate#FinancialAccount |  |  |
| FinancialAccountServices | calculate#FinancialAccountTotals |  |  |
| FinancialAccountServices | adjust#FinancialAccount | Accounting/Banking/FinancialAccountDetail | Accounting/Banking/FinancialAccountDetail (through record#FinancialAccountMovement) |
| FinancialAccountServices | deposit#FinancialAccount | Accounting/Banking/FinancialAccountDetail | Accounting/Banking/FinancialAccountDetail (through record#FinancialAccountMovement) |
| FinancialAccountServices | withdraw#FinancialAccount | Accounting/Banking/FinancialAccountDetail | Accounting/Banking/FinancialAccountDetail (through record#FinancialAccountMovement) |
| FinancialAccountServices | transfer#FinancialAccount | Accounting/Banking/FinancialAccountDetail | — (§7: financial account transfer and reversal) |
| FinancialAccountServices | reverse#FinancialAccountTrans | Accounting/Banking/FinancialAccountDetail | — (§7: financial account transfer and reversal) |
| FinancialAccountServices | authorize#FinancialAccount |  |  |
| FinancialAccountServices | expire#FinancialAccountAuth |  |  |
| FinancialAccountServices | disburse#FinancialAccount |  |  |
| FinancialAccountServices | replenish#FinancialAccount |  |  |
| FinancialAccountServices | checkCreate#InvoiceTransactions |  |  |
| FinancialAccountServices | checkCreate#InvoiceItemTrans |  |  |
| FinancialAccountServices | reverse#InvoiceTransactions |  |  |
| FinancialAccountServices | checkCreate#PaymentTrans |  |  |
| FinancialAccountServices | reverse#PaymentTrans |  |  |
| FinancialAccountServices | authorize#FinancialAccountPayment |  |  |
| FinancialAccountServices | capture#FinancialAccountPayment |  |  |
| FinancialAccountServices | release#FinancialAccountPayment |  |  |
| FinancialAccountServices | refund#FinancialAccountPayment |  |  |
| InvoiceServices | get#InvoiceBasicInfo |  |  |
| InvoiceServices | get#InvoiceDisplayInfo | Purchasing/Bills/InvoiceDetail; Accounting/Receivables/InvoiceDetail; Shared/Customer360; Shared/Supplier360; Shared/InvoiceDetail | — (replaced by mantle.account.InvoiceServices.get#InvoiceFinanceDetail and, on Customer360, mantle.account.CustomerFinanceServices.get#CustomerFinance) |
| InvoiceServices | get#InvoiceTotal |  |  |
| InvoiceServices | update#InvoiceTotals |  |  |
| InvoiceServices | calculate#MissingInvoiceTotals |  |  |
| InvoiceServices | get#InvoicePrintInfo |  |  |
| InvoiceServices | get#ReceivableStatementInfo | Accounting/Receivables/Statements | Accounting/Receivables/Statements and Accounting/Receivables/StatementPrint (through mantle.account.CollectionServices.get#Statements); Accounting/Receivables/Customer360 (through mantle.account.CustomerFinanceServices.get#CustomerFinance) |
| InvoiceServices | create#Invoice | Accounting/Receivables/Invoices; Accounting/Payables/Bills | Accounting/Receivables/Invoices (through create#Receivable); Accounting/Payables/Bills (through import#Bill); Accounting/QuickCreate/NewInvoice and NewBill (through mantle.ledger.AccountingServices.create#DraftDocument); Accounting/Receivables/InvoiceDetail (through create#InvoiceCreditMemo); Accounting/Receivables/BillingQueue (through create#InvoiceFromApprovedTime) |
| InvoiceServices | update#Invoice | Shared/InvoiceDetail | Projects/Billing/InvoiceDetail |
| InvoiceServices | update#InvoiceClosed |  |  |
| InvoiceServices | checkSet#InvoiceDueDate |  | Projects/Billing/InvoiceDetail |
| InvoiceServices | create#InvoiceItem | Shared/InvoiceDetail | Accounting/Receivables/InvoiceDetail/Items and Accounting/Payables/BillDetail/Items (through mantle.account.InvoiceServices.store#InvoiceDraftItem); Accounting/Receivables/InvoiceDetail (through create#InvoiceCreditMemo) |
| InvoiceServices | update#InvoiceItem | Shared/InvoiceDetail | Accounting/Receivables/InvoiceDetail/Items and Accounting/Payables/BillDetail/Items (through mantle.account.InvoiceServices.store#InvoiceDraftItem) |
| InvoiceServices | update#InvoiceItemClosed |  |  |
| InvoiceServices | update#InvoiceItemAdjustment | Shared/InvoiceDetail | Accounting/Receivables/InvoiceDetail/Items and Accounting/Payables/BillDetail/Items (through store#InvoiceDraftItem and update#InvoiceItem) |
| InvoiceServices | delete#InvoiceItem | Shared/InvoiceDetail | Projects/Billing/InvoiceDetail |
| InvoiceServices | adjust#Invoice | Shared/InvoiceDetail | Accounting/Records/ReturnDetail (through mantle.order.ReturnServices.settle#Return and respond#ReturnItems) |
| InvoiceServices | create#EntireOrderPartInvoice | Accounting/Records/OrderDetail | Accounting/Records/OrderDetail (through create#InvoiceFromSource) |
| InvoiceServices | create#SalesShipmentInvoices | Accounting/Records/ShipmentDetail | Accounting/Records/ShipmentDetail (through mantle.account.InvoiceServices.create#InvoiceFromSource and create#PurchaseShipmentInvoices) |
| InvoiceServices | create#PurchaseShipmentInvoices |  | Accounting/Records/ShipmentDetail; Accounting/Records/OrderDetail (through create#InvoiceFromSource, acceptedOnly) |
| InvoiceServices | create#ProjectExpenseInvoice | Accounting/Receivables/BillingQueue; People/Expenses/ExpenseClaims | — (not built; Accounting/Receivables/BillingQueue bills approved time only) |
| InvoiceServices | create#ProjectInvoiceItems | Projects/Time/MyTime; Projects/Billing/Unbilled; Accounting/Receivables/BillingQueue | Projects/Billing/Unbilled/CreateInvoice |
| InvoiceServices | create#WorkerInvoiceItems | Projects/Billing/Unbilled; Accounting/Receivables/BillingQueue | — (replaced by mantle.account.InvoiceServices.create#InvoiceFromApprovedTime on Accounting/Receivables/BillingQueue) |
| InvoiceServices | create#TimeEntryInvoiceItems | Accounting/Receivables/BillingQueue | Accounting/Receivables/BillingQueue (through mantle.account.InvoiceServices.create#InvoiceFromApprovedTime) |
| InvoiceServices | create#InvoiceBillThroughItems |  |  |
| InvoiceServices | create#InvoiceCreditMemo | Shared/InvoiceDetail; Shared/ReturnDetail | Accounting/Records/ReturnDetail (a supplier return, through settle#Return) |
| InvoiceServices | reverse#Invoice | Shared/InvoiceDetail | Accounting/Receivables/InvoiceDetail (through mantle.account.InvoiceServices.reverse#DraftInvoice) |
| InvoiceServices | cancel#Invoice | Projects/Billing/InvoiceDetail; Shared/InvoiceDetail | — (replaced by mantle.account.InvoiceServices.change#InvoiceState on Accounting/Receivables/InvoiceDetail) |
| InvoiceServices | cancel#InvoiceAndPayments |  |  |
| InvoiceServices | unpay#Invoice |  |  |
| InvoiceServices | autoApplyTo#Invoice | Shared/InvoiceDetail | — (replaced by mantle.account.PaymentServices.apply#Settlement on the settlement workbenches) |
| InvoiceServices | create#InvoiceItemDetail | Shared/InvoiceDetail | — (not built; invoice item details by asset or facility) |
| InvoiceServices | distribute#InvoiceItemDetail | Shared/InvoiceDetail | — (not built; invoice item details by asset or facility) |
| InvoiceServices | apply#InvoiceToOrder | Purchasing/Bills/InvoiceDetail; Shared/InvoiceDetail | — (replaced by mantle.account.InvoiceMatchServices.apply#InvoiceMatch on Accounting/Payables/BillDetail/Match) |
| InvoiceServices | apply#InvoiceItemToOrder | Purchasing/Bills/InvoiceDetail; Shared/InvoiceDetail | — (replaced by mantle.account.InvoiceMatchServices.apply#InvoiceMatch on Accounting/Payables/BillDetail/Match) |
| InvoiceServices | unapply#InvoiceItemFromOrder | Shared/InvoiceDetail | — (replaced by mantle.account.InvoiceMatchServices.unapply#InvoiceMatch on Accounting/Payables/BillDetail/Match) |
| InvoiceServices | apply#InvoiceToShipment | Purchasing/Bills/InvoiceDetail; Shared/InvoiceDetail | — (not built; a bill match links receipts, not shipment item sources) |
| InvoiceServices | apply#InvoiceItemToShipment | Shared/InvoiceDetail | — (not built; a bill match links receipts, not shipment item sources) |
| InvoiceServices | unapply#InvoiceItemFromShipment | Shared/InvoiceDetail | — (not built; a bill match links receipts, not shipment item sources) |
| InvoiceServices | check#InvoicesPaid |  |  |
| InvoiceServices | find#InvoiceProductStores |  |  |
| InvoiceServices | send#InvoiceStoreEmail | Shared/InvoiceDetail | — (replaced by mantle.account.InvoiceServices.send#Invoice on Accounting/Receivables/InvoiceDetail) |
| InvoiceServices | send#SalesInvoicePastDueEmails | Shared/InvoiceDetail | — (replaced by mantle.account.CollectionServices.send#Dunning on Accounting/Receivables/Dunning) |
| InvoiceServices | send#CustomerPastDueEmail | Accounting/Receivables/Dunning | — (Dunning sends through CollectionServices.send#Dunning; the job stays paused) |
| InvoiceServices | get#InvoiceContentLocation |  |  |
| InvoiceServices | create#InvoiceContent | Shared/RecordFiles; Shared/InvoiceDetail | Shared/RecordFiles |
| InvoiceServices | update#InvoiceContent | Shared/InvoiceDetail | — (replaced by the shared record files on Accounting/Receivables/InvoiceDetail/Files) |
| InvoiceServices | save#InvoiceContentFile | Shared/RecordFiles |  |
| NachaServices | generate#NachaFile | Accounting/Payables/PaymentRunDetail | Accounting/Payables/PaymentRunDetail (through PaymentRunServices.generate#RunFile) |
| NachaServices | consume#NachaReturnSystemMessage |  |  |
| NachaServices | import#NachaReturn | Accounting/Payables/PaymentRunDetail | Accounting/Payables/PaymentRunDetail#RunBankReturnForm (through PaymentRunServices.import#RunReturn) |
| OfxServices | upload#OfxVersion1 | Accounting/Banking/StatementImport | Accounting/Banking/StatementImport (review#StatementImport reads OFX in its place) |
| OfxServices | consume#OfxV1SystemMessage |  |  |
| OfxServices | import#OfxVersion1 |  |  |
| PaymentMethodServices | get#PartyPaymentMethodInfo | Accounting/Banking/BankAccounts; Accounting/Banking/BankAccountDetail; Accounting/Settings/PaymentMethods | — (replaced by mantle.account.ReconciliationServices.get#BankAccount and mantle.ledger.SetupServices.get#PaymentMethods) |
| PaymentMethodServices | get#PartyPaymentMethodInfoList | Accounting/Banking/BankAccounts; Accounting/Settings/PaymentMethods; PASS:Shop/Account/PaymentMethods; PASS:Shop/Checkout | — (replaced by mantle.account.ReconciliationServices.find#BankAccounts and mantle.ledger.SetupServices.get#PaymentMethods) |
| PaymentMethodServices | store#PaymentMethodInfo | Accounting/Settings/PaymentMethods; PASS:Shop/Account/PaymentMethods | — (replaced by mantle.ledger.SetupServices.store#PaymentMethod on Accounting/Settings/PaymentMethods) |
| PaymentMethodServices | update#PaymentMethodMutable | Accounting/Settings/PaymentMethods | Accounting/Banking/StatementImport (through mantle.account.ReconciliationServices.commit#StatementImport); Accounting/Settings/PaymentMethods edits through mantle.ledger.SetupServices.store#PaymentMethod |
| PaymentMethodServices | delete#PaymentMethod | PASS:Shop/Account/PaymentMethods |  |
| PaymentMethodServices | checkDelete#PaymentPaymentMethods |  |  |
| PaymentMethodServices | expunge#PaymentMethod |  |  |
| PaymentMethodServices | create#CreditCard |  |  |
| PaymentMethodServices | update#CreditCard |  |  |
| PaymentMethodServices | create#BankAccount | Accounting/Banking/BankAccounts | Accounting/Banking/BankAccounts; Accounting/Receivables/Customer360/FinanceDetails and Accounting/Payables/Supplier360/FinanceDetails (through mantle.account.CustomerFinanceServices.store#CustomerBankAccount) |
| PaymentMethodServices | update#BankAccount | Accounting/Banking/BankAccountDetail | Accounting/Receivables/Customer360/FinanceDetails and Accounting/Payables/Supplier360/FinanceDetails (through mantle.account.CustomerFinanceServices.store#CustomerBankAccount); BankAccountDetail edits no bank details |
| PaymentMethodServices | update#BankAccountMutable | Accounting/Banking/BankAccountDetail | — (not built; BankAccountDetail edits no bank details) |
| PaymentMethodServices | get#PaymentMethodContentLocation |  |  |
| PaymentMethodServices | create#PaymentMethodContent | Shared/RecordFiles | Shared/RecordFiles |
| PaymentMethodServices | update#PaymentMethodContent |  |  |
| PaymentMethodServices | save#PaymentMethodContentFile | Shared/RecordFiles |  |
| PaymentMethodServices | update#PaymentMethodFileComplete | Accounting/Banking/BankAccountDetail | Accounting/Payables/PaymentRunDetail (through the run file, generate#NachaFile and generate#PositivePayFile) |
| PaymentMethodServices | cancel#PaymentMethodFile | Accounting/Banking/BankAccountDetail | — (§7: BankAccountDetail's bank files box) |
| PaymentMethodServices | produce#PaymentMethodFileSystemMessage | Accounting/Banking/BankAccountDetail | — (§7: BankAccountDetail's bank files box) |
| PaymentServices | get#PaymentDisplayInfo | Accounting/Payments/PaymentDetail; Shared/Customer360; Shared/Supplier360 | — (replaced by mantle.account.PaymentServices.get#PaymentFinanceDetail and, on Customer360, mantle.account.CustomerFinanceServices.get#CustomerFinance) |
| PaymentServices | get#PaymentDescription |  |  |
| PaymentServices | get#PaymentTotals |  |  |
| PaymentServices | update#PaymentTotals |  |  |
| PaymentServices | calculate#MissingPaymentTotals |  |  |
| PaymentServices | assign#BankAccountCheckNumber | Accounting/Payables/PaymentRunDetail | Accounting/Payables/PaymentRunDetail (through PaymentRunServices.execute#Run) |
| PaymentServices | set#PaymentDate | Accounting/Payments/PaymentDetail | — (replaced by the payment draft's date, mantle.account.PaymentServices.create#PaymentDraft and store#PaymentDraft) |
| PaymentServices | get#PaymentCheckInfo |  |  |
| PaymentServices | create#Payment | Accounting/Payments/Payments; Accounting/Payments/PaymentDetail | Accounting/Payments/TransferReview (through mantle.account.PaymentServices.create#InternalTransfer); Accounting/Payments/PaymentDetail/Review (through execute#PaymentGatewayAction, a gateway refund); a new payment is create#PaymentDraft |
| PaymentServices | set#PaymentAutoInfo |  |  |
| PaymentServices | create#InvoicePayment | Shared/InvoiceDetail | — (replaced by a payment draft on Accounting/Payments/Payments and mantle.account.PaymentServices.apply#Settlement on the settlement workbenches) |
| PaymentServices | create#RefundPayment | Accounting/Payments/PaymentDetail; Shared/ReturnDetail | Accounting/Records/ReturnDetail (a refund, through settle#Return) |
| PaymentServices | set#PaymentRefundFor | Accounting/Payments/PaymentDetail | — (replaced by mantle.account.PaymentServices.refund#ReviewedPayment on Accounting/Payments/PaymentDetail/Review) |
| PaymentServices | send#PromisedPayment |  |  |
| PaymentServices | check#InvoiceStatusForPayment |  |  |
| PaymentServices | update#Payment | Accounting/Payments/PaymentDetail; Shared/OrderDetail; Sales/Orders/OrderDetail | Accounting/Payments/PaymentDetail/Review (through mantle.account.PaymentServices.change#PaymentState); Accounting/Banking/BankAccountDetail (through create#DepositSlip) |
| PaymentServices | apply#InvoicePayment | Accounting/Receivables/ReceivablesWorkbench; Accounting/Payments/PaymentDetail; Shared/InvoiceDetail | Accounting/Receivables/SettlementReview and Accounting/Payables/SettlementReview (through mantle.account.PaymentServices.apply#Settlement); Accounting/Payables/PaymentRunDetail (through mantle.account.PaymentRunServices.execute#Run) |
| PaymentServices | apply#PaymentForInvoice |  |  |
| PaymentServices | apply#InvoiceForPayments |  |  |
| PaymentServices | apply#OrderPaymentsToInvoice |  |  |
| PaymentServices | apply#PaymentToPayment | Accounting/Receivables/ReceivablesWorkbench; Accounting/Payments/PaymentDetail | Accounting/Receivables/SettlementReview and Accounting/Payables/SettlementReview (through mantle.account.PaymentServices.apply#Settlement); Accounting/Payments/PaymentDetail/Review (through execute#PaymentGatewayAction, a gateway refund) |
| PaymentServices | apply#InvoiceToInvoice | Accounting/Receivables/InvoiceDetail; Accounting/Receivables/ReceivablesWorkbench; Accounting/Payables/PayablesWorkbench; Accounting/Payments/PaymentDetail; Shared/InvoiceDetail | Accounting/Receivables/InvoiceDetail/Payments (through mantle.account.InvoiceServices.apply#InvoiceCredit); Accounting/Receivables/SettlementReview and Accounting/Payables/SettlementReview (through mantle.account.PaymentServices.apply#Settlement); Accounting/Payables/PaymentRunDetail (through execute#Run) |
| PaymentServices | cancel#PaymentAndInvoices |  |  |
| PaymentServices | void#Payment | Accounting/Payments/PaymentDetail | Accounting/Payments/PaymentDetail/Review (through mantle.account.PaymentServices.change#PaymentState and the PaymentCancelledCleanup SECA) |
| PaymentServices | unapply#PaymentApplication | Accounting/Receivables/ReceivablesWorkbench; Accounting/Payables/PayablesWorkbench; Accounting/Payments/PaymentDetail; Shared/InvoiceDetail | Accounting/Payments/PaymentDetail/Review (through mantle.account.PaymentServices.unapply#ReviewedPayment and change#PaymentState) |
| PaymentServices | autoApply#Payment | Accounting/Payments/PaymentDetail | Mantle, confirming a settlement review (no screen calls it) |
| PaymentServices | authorize#Payment | Accounting/Payments/PaymentDetail | Accounting/Payments/PaymentDetail/Review (the gateway's implementation, through execute#PaymentGatewayAction and authorize#SinglePayment) |
| PaymentServices | capture#Payment | Accounting/Payments/PaymentDetail | Accounting/Payments/PaymentDetail/Review (the gateway's implementation, through execute#PaymentGatewayAction and capture#SinglePayment) |
| PaymentServices | release#Payment | Accounting/Payments/PaymentDetail | Accounting/Payments/PaymentDetail/Review (the gateway's implementation, through execute#PaymentGatewayAction and release#SinglePayment) |
| PaymentServices | refund#Payment | Accounting/Payments/PaymentDetail | Accounting/Payments/PaymentDetail/Review (the gateway's implementation, through execute#PaymentGatewayAction and refund#SinglePayment) |
| PaymentServices | get#PaymentGatewayDetails | Accounting/Payments/PaymentDetail; Accounting/Payments/GatewayTransactions | Accounting/Payments/PaymentDetail/Gateway (the gateway's implementation, through lookup#PaymentGatewayDetails and get#SinglePaymentGatewayDetails) |
| PaymentServices | authorize#OrderPayments | Shared/OrderDetail; PASS:Shop/Checkout; Commerce/Orders/OrderDetail; Sales/Orders/OrderDetail |  |
| PaymentServices | authorize#StorePayment |  |  |
| PaymentServices | authorize#SinglePayment |  |  |
| PaymentServices | get#AuthorizePaymentGatewayResponse |  |  |
| PaymentServices | capture#InvoicePayments |  |  |
| PaymentServices | capture#AppliedPayment |  |  |
| PaymentServices | capture#SinglePayment |  |  |
| PaymentServices | release#SinglePayment |  |  |
| PaymentServices | refund#SinglePayment |  |  |
| PaymentServices | get#SinglePaymentGatewayDetails |  |  |
| PaymentServices | poll#PaymentGatewayDetails | Accounting/Payments/GatewayTransactions | — (a scheduled job; Accounting/Payments/PaymentDetail/Gateway looks up one payment through lookup#PaymentGatewayDetails) |
| PaymentServices | get#PaymentContentLocation |  |  |
| PaymentServices | create#PaymentContent | Shared/RecordFiles; Accounting/Payments/PaymentDetail | Shared/RecordFiles |
| PaymentServices | update#PaymentContent | Accounting/Payments/PaymentDetail | — (replaced by the shared record files on Accounting/Payments/PaymentDetail/Files) |
| PaymentServices | save#PaymentContentFile | Shared/RecordFiles |  |
| PositivePayServices | generate#PositivePayFile | Accounting/Payables/PaymentRunDetail | Accounting/Payables/PaymentRunDetail (through PaymentRunServices.generate#RunFile) |
| PositivePayServices | send#PositivePayJob |  |  |
| PositivePayServices | generate#PositivePayInterface |  |  |
| PositivePayServices | generate#PmftBankOfAmericaAr |  |  |
| PositivePayServices | generate#PmftCityBankCnb |  |  |
| PositivePayServices | generate#PmftSunTrustCpr |  |  |
| PositivePayServices | generate#PmftWachoviaAr |  |  |
| PositivePayServices | generate#PmftWellsFargoArp |  |  |
| PositivePayServices | generate#PmftZionsBankCsv |  |  |
| ReconciliationServices | match#PaymentMethodTransUnmatched | Accounting/Banking/ReconciliationDetail; Accounting/Banking/UnmatchedTransactions | Accounting/Banking/BankAccountDetail |
| ReconciliationServices | create#PaymentMethodTrans | Accounting/Banking/BankAccountDetail | Accounting/Banking/BankAccountDetail |
| ReconciliationServices | update#PaymentMethodTrans | Accounting/Banking/BankAccountDetail | — (replaced by mantle.account.ReconciliationServices.reconcile#BankLine, noReconcile# and unreconcile#PaymentMethodTrans) |
| ReconciliationServices | noReconcile#PaymentMethodTrans | Accounting/Banking/ReconciliationDetail | Accounting/Banking/BankAccountDetail; Accounting/Banking/ReconciliationDetail |
| ReconciliationServices | create#TransPayment | Accounting/Banking/ReconciliationDetail | — (§7: a fee or payment from a bank line) |
| ReconciliationServices | reconcile#PaymentMethodTrans | Accounting/Banking/ReconciliationDetail | Accounting/Banking/BankAccountDetail; Accounting/Banking/ReconciliationDetail (through reconcile#BankLine) |
| ReconciliationServices | unreconcile#PaymentMethodTrans | Accounting/Banking/ReconciliationDetail | Accounting/Banking/BankAccountDetail |
| ReconciliationServices | clear#PaymentTrans | Accounting/Banking/ReconciliationDetail | Accounting/Payments/PaymentDetail/Review (through change#PaymentState and the PaymentCancelClearMethodTrans SECA); ReconciliationDetail clears lines through mantle.account.ReconciliationServices.store#Reconciliation |

Added in the Projects build (Oct 21–22, 2026; impl-projects.md P1–P10), called by built screens:

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| InvoiceServices | create#MilestoneInvoiceItems |  | Projects/Billing/Unbilled; Projects/Billing/Unbilled/CreateInvoice; Projects/Projects/MilestoneDetail |
| InvoiceServices | get#InvoiceTimeDetail | Shared/InvoiceDetail | Projects/Billing/InvoiceDetail; Projects/Billing/InvoicePrint |

Added in Accounting P4, called by built screens (financial authority remains native). Older design writer names are superseded by these contracts; internal native-to-native primitives are not counted as new screen calls.

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| InvoiceServices | change#InvoiceState |  | Accounting/Receivables/InvoiceDetail; Projects/Billing/InvoiceDetail |
| InvoiceServices | store#InvoiceDraft |  | Accounting/Receivables/InvoiceDetail; Projects/Billing/InvoiceDetail |
| InvoiceServices | store#InvoiceDraftItem |  | Accounting/Receivables/InvoiceDetail/Items |
| InvoiceServices | delete#InvoiceDraftItem |  | Accounting/Receivables/InvoiceDetail/Items; Projects/Billing/InvoiceDetail |
| InvoiceServices | get#InvoiceFinanceDetail | Sales/Orders/InvoiceDetail | Accounting/Receivables/InvoiceDetail; Accounting/Receivables/InvoiceBatch |
| InvoiceServices | reverse#DraftInvoice |  | Accounting/Receivables/InvoiceDetail |
| InvoiceServices | apply#InvoiceCredit |  | Accounting/Receivables/InvoiceDetail/Payments |
| InvoiceServices | find#Receivables |  | Accounting/Receivables/Invoices |
| InvoiceServices | get#ReceivableSummary |  | Accounting/Receivables/Invoices |
| InvoiceServices | create#Receivable |  | Accounting/Receivables/Invoices |
| InvoiceServices | get#InvoiceOutput |  | Accounting/Receivables/InvoicePrint |
| InvoiceServices | get#InvoiceDeliveryAttachments |  | Accounting/Receivables/InvoiceDetail (explicit supporting-file choices) |
| InvoiceServices | send#Invoice |  | Accounting/Receivables/InvoiceDetail; Projects/Billing/InvoiceDetail |
| InvoiceServices | process#InvoiceBatch |  | Accounting/Receivables/InvoiceBatch |
| InvoiceServices | get#InvoiceBatchResult |  | Accounting/Receivables/InvoiceBatch |
| InvoiceServices | find#ApprovedTimeBilling |  | Accounting/Receivables/BillingQueue |
| InvoiceServices | create#InvoiceFromApprovedTime |  | Accounting/Receivables/BillingQueue |
| CustomerFinanceServices | get#CustomerFinance | Sales/Accounts/Customer360 | Accounting/Receivables/Customer360 |
| CustomerFinanceServices | store#CustomerIdentification |  | Accounting/Receivables/Customer360/FinanceDetails |
| CustomerFinanceServices | store#CustomerBankAccount |  | Accounting/Receivables/Customer360/FinanceDetails |
| CustomerFinanceServices | store#CustomerTaxRegistration |  | Accounting/Receivables/Customer360/FinanceDetails |
| CollectionServices | get#Statements |  | Accounting/Receivables/Statements; Accounting/Receivables/StatementPrint |
| CollectionServices | send#Statements |  | Accounting/Receivables/Statements |

Added in Accounting P10 (collections, credit and recurring invoices), called by built screens:

| Service file | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| CollectionServices | record#Activity | Accounting/Receivables/Collections | Accounting/Receivables/Collections; Accounting/Receivables/Customer360/Activities |
| CollectionServices | store#Promise | Accounting/Receivables/Collections | Accounting/Receivables/Collections; Accounting/Receivables/Customer360/Activities |
| CollectionServices | get#CustomerCollections |  | Accounting/Receivables/Customer360/Activities |
| CollectionServices | store#Level | Accounting/Settings/CollectionPolicies | Accounting/Settings/CollectionPolicies |
| CollectionServices | preview#Dunning | Accounting/Receivables/Dunning | Accounting/Receivables/Dunning |
| CollectionServices | send#Dunning | Accounting/Receivables/Dunning | Accounting/Receivables/Dunning |
| CollectionServices | get#DunningRun |  | Accounting/Receivables/Dunning |
| CreditServices | store#Policy | Accounting/Receivables/Customer360 | Accounting/Receivables/Customer360/Credit |
| CreditServices | store#Defaults | Accounting/Settings/CollectionPolicies | Accounting/Settings/CollectionPolicies |
| CreditServices | evaluate#OrderCredit | Accounting/Records/OrderDetail | (approve#Order; the OrderPreApproveCredit SECA) |
| CreditServices | release#CreditHold | Accounting/Records/OrderDetail; Accounting/Receivables/Customer360 | Accounting/Records/OrderDetail; Accounting/Receivables/Customer360/Credit |
| CreditServices | get#CustomerCreditStatus | Accounting/Receivables/Customer360 | Accounting/Receivables/Customer360/Credit |
| OrderServices | hold#Order | Shared/OrderDetail; Commerce/Orders/OrderDetail | (CreditServices.evaluate#OrderCredit) |
| OrderServices | release#OrderHold | Shared/OrderDetail; Commerce/Orders/OrderDetail | (CreditServices.release#CreditHold) |
| RecurringInvoiceServices | store#Schedule | Accounting/Receivables/RecurringInvoices | Accounting/Receivables/RecurringInvoices |
| RecurringInvoiceServices | preview#Period | Accounting/Receivables/RecurringInvoices | Accounting/Receivables/RecurringInvoices |
| RecurringInvoiceServices | generate#Invoices | Accounting/Receivables/RecurringInvoices | Accounting/Receivables/RecurringInvoices |
| LedgerReportServices | run#Aging | Accounting/Reports/Aging; Insights/Dashboard; Insights/Panels/PanelDetail; Insights/ReportBuilder/Analysis; Insights/ManagementDigest | Accounting/Reports/Aging |

Added in Accounting P5 for gateway actions, called by built screens. They review and confirm Mantle's
`authorize#`, `capture#`, `release#` and `refund#SinglePayment` and `get#SinglePaymentGatewayDetails` (R2), which
replace the older gateway writer and poller design references.

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| PaymentServices | find#PaymentGatewayProviders |  | Accounting/Payments/GatewayTransactions |
| PaymentServices | find#PaymentGatewayTransactions |  | Accounting/Payments/GatewayTransactions |
| PaymentServices | preview#PaymentGatewayAction |  | Accounting/Payments/PaymentDetail |
| PaymentServices | get#PaymentGatewayActionPreview |  | Accounting/Payments/PaymentDetail |
| PaymentServices | execute#PaymentGatewayAction |  | Accounting/Payments/PaymentDetail |
| PaymentServices | lookup#PaymentGatewayDetails |  | Accounting/Payments/PaymentDetail/Gateway |

Added in Accounting P5, called by built screens; reworked on Mantle's services in R2. Gateway refunds are the gateway
rows above; the test gateway services are left out.

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| PaymentServices | find#OpenItems | Accounting/Receivables/ReceivablesWorkbench | Accounting/Receivables/ReceivablesWorkbench; Accounting/Payables/PayablesWorkbench |
| PaymentServices | find#SettlementAdjustmentAccounts | Accounting/Receivables/ReceivablesWorkbench | Accounting/Receivables/ReceivablesWorkbench (explicit account choices) |
| PaymentServices | preview#Settlement | Accounting/Receivables/ReceivablesWorkbench | Accounting/Receivables/ReceivablesWorkbench |
| PaymentServices | get#SettlementPreview | Accounting/Receivables/ReceivablesWorkbench | Accounting/Receivables/ReceivablesWorkbench |
| PaymentServices | store#SettlementDraft |  | Accounting/Receivables/ReceivablesWorkbench |
| PaymentServices | get#SettlementDraft |  | Accounting/Receivables/ReceivablesWorkbench |
| PaymentServices | apply#Settlement | Accounting/Receivables/ReceivablesWorkbench | Accounting/Receivables/ReceivablesWorkbench; Accounting/Payables/SettlementReview |
| PaymentServices | preview#PaymentAutoApplication | Accounting/Payments/PaymentDetail | Mantle (no screen calls it yet) |
| PaymentServices | find#Payments | Accounting/Payments/Payments | Accounting/Payments/Payments |
| PaymentServices | get#PaymentFinanceDetail | Accounting/Payments/PaymentDetail | Accounting/Payments/PaymentDetail and its seven tabs |
| PaymentServices | find#PaymentMethods | Accounting/Payments | Accounting/Payments/Payments; Accounting/Payments/PaymentDetail (reviewed choices) |
| PaymentServices | create#PaymentDraft | Accounting/Payments | Accounting/Payments/Payments; Accounting/QuickCreate/NewPayment |
| PaymentServices | store#PaymentDraft | Accounting/Payments/PaymentDetail | Accounting/Payments/PaymentDetail |
| PaymentServices | preview#PaymentState | Accounting/Payments/PaymentDetail | Accounting/Payments/PaymentDetail |
| PaymentServices | get#PaymentStatePreview | Accounting/Payments/PaymentDetail | Accounting/Payments/PaymentDetail |
| PaymentServices | change#PaymentState | Accounting/Payments/PaymentDetail | Accounting/Payments/PaymentDetail |
| PaymentServices | preview#PaymentUnapply | Accounting/Payments/PaymentDetail | Accounting/Payments/PaymentDetail/Applications |
| PaymentServices | get#PaymentUnapplyPreview | Accounting/Payments/PaymentDetail | Accounting/Payments/PaymentDetail |
| PaymentServices | unapply#ReviewedPayment | Accounting/Payments/PaymentDetail | Accounting/Payments/PaymentDetail/Applications |
| PaymentServices | get#PaymentOutput | Accounting/Payments/PaymentPrint | Accounting/Payments/PaymentPrint |
| PaymentServices | get#PaymentRefundSummary | Accounting/Payments/PaymentDetail | Accounting/Payments/PaymentDetail/Refunds (through get#PaymentFinanceDetail) |
| PaymentServices | preview#PaymentRefund | Accounting/Payments/PaymentDetail | Accounting/Payments/PaymentDetail#ReviewManualRefund |
| PaymentServices | get#PaymentRefundPreview | Accounting/Payments/PaymentDetail | Accounting/Payments/PaymentDetail |
| PaymentServices | refund#ReviewedPayment | Accounting/Payments/PaymentDetail | Accounting/Payments/PaymentDetail#ConfirmManualRefund |
| PaymentServices | find#InternalTransferMethods | Accounting/Payments/Payments | Accounting/Payments/Payments (reviewed methods) |
| PaymentServices | find#InternalTransferFeeAccounts | Accounting/Payments/Payments | Accounting/Payments/Payments (explicit expense account) |
| PaymentServices | preview#InternalTransfer | Accounting/Payments/Payments | Accounting/Payments/Payments#ReviewInternalTransfer |
| PaymentServices | get#InternalTransferPreview | Accounting/Payments/Payments | Accounting/Payments/Payments |
| PaymentServices | create#InternalTransfer | Accounting/Payments/Payments | Accounting/Payments/Payments#ConfirmInternalTransfer |

Added in Accounting P6 (payables), called by built screens:

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| InvoiceServices | find#Payables | Accounting/Payables/Bills | Accounting/Payables/Bills; Accounting/Payables/ExpensePosting (through PayableScreenServices.find#Bills) |
| InvoiceServices | import#Bill | Accounting/Payables/Bills | Accounting/Payables/Bills#BillUploadForm; Accounting/Records/OrderDetail#OrderBillUploadForm |
| InvoiceServices | create#InvoiceFromSource | Accounting/Records/OrderDetail; Accounting/Records/ShipmentDetail; Sales/Orders/OrderDetail | Accounting/Records/OrderDetail#InvoiceFromOrderForm; Accounting/Records/ShipmentDetail#BillReceiptForm |
| InvoiceServices | request#PayableApproval |  | Accounting/Payables/BillDetail |
| InvoiceServices | approve#Payable | Accounting/Payables/BillDetail; Accounting/Payables/ExpensePosting | Accounting/Payables/BillDetail; Accounting/Payables/ExpensePosting |
| InvoiceServices | hold#Invoice | Accounting/Payables/Bills; Accounting/Payables/BillDetail | Accounting/Payables/Bills#HoldSelectedBills; Accounting/Payables/BillDetail#BillHoldForm; Accounting/Payables/ExpensePosting |
| InvoiceServices | request#HoldRelease | Accounting/Payables/BillDetail | Accounting/Payables/BillDetail/Holds |
| InvoiceServices | release#InvoiceHold | Accounting/Payables/BillDetail | Accounting/Payables/BillDetail/Holds |
| InvoiceServices | get#InvoiceHolds |  | Accounting/Payables/BillDetail; Accounting/Payables/BillDetail/Holds |
| SupplierServices | store#SupplierProfile | Accounting/Payables/Supplier360 | Accounting/Payables/Supplier360/Terms |
| SupplierServices | get#SupplierFinance | Accounting/Payables/Supplier360 | Accounting/Payables/Supplier360 and its tabs |

Added in Accounting P7 (matching), called by built screens:

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| InvoiceMatchServices | evaluate#InvoiceMatch | Shared/InvoiceMatch; Accounting/Payables/BillDetail | Accounting/Payables/BillDetail/Match (Shared/InvoiceMatch) |
| InvoiceMatchServices | apply#InvoiceMatch | Shared/InvoiceMatch; Accounting/Payables/BillDetail | Accounting/Payables/BillDetail/Match#MatchSources |
| InvoiceMatchServices | unapply#InvoiceMatch | Shared/InvoiceMatch | Accounting/Payables/BillDetail/Match |
| InvoiceMatchServices | preview#LegacyMatches | Accounting/Settings/MatchPolicies; Purchasing/Bills/MatchExceptions | Accounting/Payables/LegacyMatches |
| InvoiceMatchServices | apply#LegacyMatches | Accounting/Settings/MatchPolicies; Purchasing/Bills/MatchExceptions | Accounting/Payables/LegacyMatches |
| InvoiceMatchServices | get#MatchPolicies | Accounting/Settings/MatchPolicies | Accounting/Settings/MatchPolicies |
| InvoiceMatchServices | store#MatchPolicy | Accounting/Settings/MatchPolicies | Accounting/Settings/MatchPolicies#MatchPolicy |
| InvoiceMatchServices | end#MatchPolicy |  | Accounting/Settings/MatchPolicies |

Added in Accounting P8 (payment runs and terms), called by built screens:

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| PaymentRunServices | create#Run | Accounting/Payables/PaymentRuns | Accounting/Payables/PaymentRuns#NewRunForm |
| PaymentRunServices | select#Bills | Accounting/Payables/PaymentRunDetail | Accounting/Payables/PaymentRunDetail |
| PaymentRunServices | store#RunItem |  | Accounting/Payables/PaymentRunDetail#RunLeaveOutForm |
| PaymentRunServices | request#RunApproval |  | Accounting/Payables/PaymentRunDetail |
| PaymentRunServices | approve#Run | Accounting/Payables/PaymentRunDetail | Accounting/Payables/PaymentRunDetail |
| PaymentRunServices | execute#Run | Accounting/Payables/PaymentRunDetail | Accounting/Payables/PaymentRunDetail |
| PaymentRunServices | generate#RunFile |  | Accounting/Payables/PaymentRunDetail |
| PaymentRunServices | import#RunReturn |  | Accounting/Payables/PaymentRunDetail#RunBankReturnForm |
| PaymentRunServices | get#Run |  | Accounting/Payables/PaymentRunDetail (through PaymentRunServices.get#RunContext) |
| PaymentRunServices | cancel#Run |  | Accounting/Payables/PaymentRunDetail#RunCancelForm |

Added in Accounting P9 (banking), called by built screens:

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| ReconciliationServices | check#BankAccess |  | Accounting/Banking (each screen and transition that changes a bank line) |
| ReconciliationServices | check#BankLineOpen |  | Mantle, inside reconcile#, unreconcile# and noReconcile#PaymentMethodTrans |
| ReconciliationServices | find#BankAccounts | Accounting/Banking/BankAccounts | Accounting/Banking/BankAccounts; the bankAccounts choice |
| ReconciliationServices | get#BankAccount | Accounting/Banking/BankAccountDetail | Accounting/Banking/BankAccountDetail |
| ReconciliationServices | find#BankLines | Accounting/Banking/BankAccountDetail | Accounting/Banking/BankAccountDetail; Accounting/Banking/ReconciliationDetail; Accounting/Banking/UnmatchedTransactions |
| ReconciliationServices | find#BankLineCandidates | Accounting/Banking/ReconciliationDetail | Accounting/Banking/BankAccountDetail; Accounting/Banking/ReconciliationDetail (the bankLineCandidates choice) |
| ReconciliationServices | reconcile#BankLine | Accounting/Banking/ReconciliationDetail | Accounting/Banking/BankAccountDetail; Accounting/Banking/ReconciliationDetail |
| ReconciliationServices | preview#CsvStatement | Accounting/Banking/StatementImport | Mantle (the review step shows the read rows; no screen calls it yet) |
| ReconciliationServices | review#StatementImport | Accounting/Banking/StatementImport | Accounting/Banking/StatementImport |
| ReconciliationServices | get#StatementImport | Accounting/Banking/StatementImport | Accounting/Banking/StatementImport |
| ReconciliationServices | commit#StatementImport | Accounting/Banking/StatementImport | Accounting/Banking/StatementImport |
| ReconciliationServices | create#Reconciliation | Accounting/Banking/Reconciliations | Accounting/Banking/Reconciliations |
| ReconciliationServices | get#Reconciliation | Accounting/Banking/ReconciliationDetail | Accounting/Banking/ReconciliationDetail |
| ReconciliationServices | store#Reconciliation | Accounting/Banking/ReconciliationDetail | Accounting/Banking/ReconciliationDetail |
| ReconciliationServices | finish#Reconciliation | Accounting/Banking/ReconciliationDetail | Accounting/Banking/ReconciliationDetail |
| ReconciliationServices | store#Rule | Accounting/Settings/BankRules | Accounting/Banking/BankRules |
| ReconciliationServices | test#Rule | Accounting/Settings/BankRules | Accounting/Banking/BankRules |
| ReconciliationServices | apply#Rules | Accounting/Banking/UnmatchedTransactions | Accounting/Banking/UnmatchedTransactions |
| PaymentServices | find#DepositReceipts | Accounting/Banking/BankAccountDetail | Accounting/Banking/BankAccountDetail (the depositReceipts choice) |
| PaymentServices | create#DepositSlip | Accounting/Banking/BankAccountDetail | Accounting/Banking/BankAccountDetail#DepositSlip |
| FinancialAccountServices | check#FinancialAccountAccess |  | Accounting/Banking/FinancialAccounts; Accounting/Banking/FinancialAccountDetail |
| FinancialAccountServices | record#FinancialAccountMovement | Accounting/Banking/FinancialAccountDetail | Accounting/Banking/FinancialAccountDetail |
| ReconciliationServices | check#BankLineDay |  | Mantle, inside create# and update#PaymentMethodTrans |
| ReconciliationServices | set#DepositEntriesReconciled |  | Mantle, inside reconcile# and unreconcile#PaymentMethodTrans |
| ReconciliationServices | claim#StatementImport |  | Mantle, inside commit#StatementImport |

Added in Accounting P17 (returns and order changes):

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| ReturnServices | preview#ReturnSettlement | Shared/ReturnDetail | Accounting/Records/ReturnDetail (Shared/ReturnDetail) |
| ReturnServices | settle#Return | Shared/ReturnDetail | Accounting/Records/ReturnDetail#SettleReturnForm, #SettleReceiptlessForm |
| ReturnServices | get#ReturnSettlementMode |  | Mantle, in the return SECAs and the return services |
| WarehouseTaskServices | receive#ReturnItems | Warehouse/Returns/ReturnReceipt | Warehouse/Returns/ReturnReceipt (receiveReturn, with the operation key: quarantine and an inspection per box, impl-warehouse P14); the Accounting demo receives with it |
| InvoiceServices | release#ShipmentDraftInvoice | Warehouse/Shipping (Reopen package); CustomerService order change | Warehouse/Shipping/Pack (Reopen) through WarehouseTaskServices.reopen#ShipmentPackage, by its release (release#ShipmentInvoiceLines, F275); CustomerService order change when built |
| InvoiceServices | finalize#ShipmentInvoices |  | Mantle, the ShipmentShippedFinalizeInvoices SECA |
| PaymentServices | refund#OrderPayment | Accounting/Payments/PaymentDetail; CustomerService order change | Customer Service's order change when it is built |

## Facility (15 services)

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| ContactServices | get#FacilityDefaultShipDest |  |  |
| ContactServices | get#FacilityDefaultShipOrigin |  |  |
| ContactServices | get#FacilityContactInfo |  |  |
| ContactServices | update#FacilityPostalAddress |  |  |
| ContactServices | update#FacilityTelecomNumber |  |  |
| ContactServices | update#FacilityContactOther |  |  |
| ContactServices | delete#FacilityContactMech |  |  |
| FacilityServices | get#Facility | Warehouse/Locations/FacilityDetail; Shared/FacilityDetail; Maintenance/Facilities/FacilityDetail | Warehouse/Locations/FacilityDetail (through ironstone.warehouse.FacilityServices.get#FacilityDetail) |
| FacilityServices | get#FacilitiesByOwner | Warehouse/Handheld/Home; Warehouse/Locations/Facilities | — Warehouse/Handheld/Home (FacilityPicker: AccessServices.get#Choices, select#Facility); Warehouse/Locations/Facilities (get#Facilities) |
| FacilityServices | create#Facility | Warehouse/Locations/Facilities; Shared/FacilityDetail | Warehouse/Locations/Facilities; Warehouse/Locations/FacilityDetail/Children (through store#Facility) |
| FacilityServices | update#Facility | Warehouse/Locations/FacilityDetail; Shared/FacilityDetail | Warehouse/Locations/FacilityDetail (through store#Facility) |
| FacilityServices | update#FacilityCertification | Maintenance/Facilities/FacilityDetail |  |
| FacilityServices | create#FacilityLocation | Warehouse/Locations/FacilityDetail; Shared/FacilityDetail; Maintenance/Facilities/FacilityDetail | Warehouse/Locations/FacilityDetail/Locations (New location, through store#FacilityLocation) |
| FacilityServices | create#FacilityNote | Warehouse/Locations/FacilityDetail | — Warehouse/Locations/FacilityDetail/Conversation: the chatter logs a Comment (log#RecordNote) and shows the FacilityNotes |
| FacilityServices | get#ScannedIdGeneral | Warehouse/Counts/CountEntry; Warehouse/Handheld/Count; Warehouse/Handheld/Home; Warehouse/Handheld/Move; Warehouse/Home; Warehouse/Transfers/Move | Warehouse/Home, Warehouse/Handheld/Home, Warehouse/Handheld/Move, Warehouse/Transfers/Move, Warehouse/Inventory/ContainerDetail (the scan-input resolver ironstone.warehouse.AccessServices.resolve#Scan, over get#ScannedRecord) |

## HumanRes (38 services)

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| EmploymentServices | create#Employment |  |  |
| EmploymentServices | update#Employment |  |  |
| EmploymentServices | delete#Employment |  |  |
| EmploymentServices | create#EmploymentSalary | People/Employees/Employee360 |  |
| EmploymentServices | check#NextPayrollTimePeriods |  |  |
| PayrollDocumentServices | get#EmploymentInfo |  |  |
| PayrollDocumentServices | get#EmploymentWageAndTaxInfo |  |  |
| PayrollDocumentServices | create#PeriodWageAndTaxRecords |  |  |
| PayrollDocumentServices | get#UsaIrsW2FormData |  |  |
| PayrollDocumentServices | generate#Efw2File |  |  |
| PayrollDocumentServices | get#UsaIrs1099MiscFormData |  |  |
| PayrollServices | get#TimePeriodEmployments |  |  |
| PayrollServices | process#TimePeriodPay |  |  |
| PayrollServices | reopen#PayrollPeriod |  |  |
| PayrollServices | approve#PeriodInvoices |  |  |
| PayrollServices | create#PeriodPayments |  |  |
| PayrollServices | set#PeriodPaymentDates |  |  |
| PayrollServices | set#PeriodPaymentRefNums |  |  |
| PayrollServices | authorize#PeriodPayments |  |  |
| PayrollServices | deliver#PeriodPayments |  |  |
| PayrollServices | process#EmploymentPay |  |  |
| PayrollServices | get#EmploymentPayAmount |  |  |
| PayrollServices | get#TimePeriodTotalPayAmount |  |  |
| PayrollServices | get#EmploymentPayDetail |  |  |
| PayrollServices | calculate#Adjustment |  |  |
| PayrollServices | calculate#PayrollAdjustment |  |  |
| PayrollServices | create#WorkersCompRate |  |  |
| PayrollServices | delete#WorkersCompRate |  |  |
| PayrollServices | update#WorkersCompRate |  |  |
| PayrollServices | create#GarnishmentDetail |  |  |
| PayrollServices | update#GarnishmentDetail |  |  |
| PayrollServices | create#PayrollAdjustmentAndDetail |  |  |
| PayrollServices | update#PayrollAdjustmentAndDetail |  |  |
| PayrollServices | delete#PayrollAdjustmentAndDetail |  |  |
| PayrollServices | create#PayrollInvoice |  |  |
| PositionServices | get#PartyEmployersAndPositionClasses |  |  |
| RateServices | create#RateAmount | Projects/Projects/NewProject; Projects/Projects/ProjectDetail/Money; Projects/Billing/Rates; People/Payroll/Rates | Projects/Billing/Rates; Projects/Projects/NewProject/Money |
| RateServices | update#RateAmount | Projects/Projects/ProjectDetail/Money; Projects/Billing/Rates; People/Payroll/Rates | Projects/Billing/Rates |

## Ledger (81 services)

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| AssetAutoPostServices | post#AssetReceipt |  |  |
| AssetAutoPostServices | repost#AssetReceipt |  |  |
| AssetAutoPostServices | post#AssetIssuance |  |  |
| AssetAutoPostServices | revert#AssetIssuanceOnCancel |  |  |
| AssetAutoPostServices | repost#AssetIssuance |  |  |
| AssetAutoPostServices | calculate#FixedAssetDepreciation | Accounting/FixedAssets/DepreciationRunDetail | Accounting/FixedAssets/DepreciationRunDetail (AssetBookServices.calculate#DepreciationRun) |
| AssetAutoPostServices | post#FixedAssetDepreciation | Accounting/FixedAssets/DepreciationRunDetail | Accounting/FixedAssets/DepreciationRunDetail (through calculateAndPost#FixedAssetDepreciation) |
| AssetAutoPostServices | calculateAndPost#FixedAssetDepreciation |  | Accounting/FixedAssets/DepreciationRunDetail (AssetBookServices.post#AssetPeriodDepreciation, one asset-month) |
| AssetAutoPostServices | calculateAndPost#AllFixedAssetDepreciations |  |  |
| AssetAutoPostServices | post#PhysicalInventoryVariance |  | Accounting P13: posts by variance reason (no screen; SECA); P10's post#Count gives it one delta per asset per count |
| AssetAutoPostServices | repost#PhysicalInventoryVariance |  |  |
| AssetAutoPostServices | get#AssetTypeGlAccount |  |  |
| AssetAutoPostServices | repost#Asset |  |  |
| InvoiceAutoPostServices | post#Invoice | Shared/InvoiceDetail | Accounting/Receivables/InvoiceDetail and Accounting/Payables/BillDetail (through mantle.account.InvoiceServices.change#InvoiceState and the InvoiceGlPost SECA) |
| InvoiceAutoPostServices | post#InvoiceAdjustment |  |  |
| InvoiceAutoPostServices | get#InvoicePartyAcctgPreferences |  |  |
| InvoiceAutoPostServices | get#InvoiceTypeTransType |  |  |
| InvoiceAutoPostServices | get#InvoiceItemGlAccount |  |  |
| InvoiceAutoPostServices | repost#Invoice | Shared/InvoiceDetail | — (not built; a posted invoice is corrected by a credit memo) |
| InvoiceAutoPostServices | repost#InvoiceAdjustment |  |  |
| InvoiceAutoPostServices | repost#AllInvoices |  |  |
| InvoiceAutoPostServices | revert#InvoicePost |  |  |
| LedgerReportServices | get#ReportBasicInfo | Accounting/Reports/Reports | Accounting/Reports statements (checks the organization and periods; summary rows) |
| LedgerReportServices | run#IncomeStatement | Accounting/Reports/IncomeStatement; Insights/Dashboard; Insights/Panels/PanelDetail; Insights/ReportBuilder/Analysis; Insights/ManagementDigest | Accounting/Reports/IncomeStatement |
| LedgerReportServices | run#BalanceSheet | Accounting/Reports/BalanceSheet; Insights/Dashboard; Insights/Panels/PanelDetail; Insights/ReportBuilder/Analysis; Insights/ManagementDigest | Accounting/Reports/BalanceSheet |
| LedgerReportServices | run#CashFlowStatement | Accounting/Reports/CashFlow; Insights/Dashboard; Insights/Panels/PanelDetail; Insights/ReportBuilder/Analysis; Insights/ManagementDigest | Accounting/Reports/CashFlow |
| LedgerReportServices | run#RetainedEarningsStatement | Accounting/Reports/RetainedEarnings; Insights/Dashboard; Insights/Panels/PanelDetail; Insights/ReportBuilder/Analysis; Insights/ManagementDigest | Accounting/Reports/RetainedEarnings |
| LedgerReportServices | run#FinancialRatios | Accounting/Reports/FinancialRatios; Insights/Dashboard; Insights/Panels/PanelDetail; Insights/ReportBuilder/Analysis; Insights/ManagementDigest | Accounting/Reports/FinancialRatios |
| LedgerReportServices | get#GlAccountClassInfoSums |  | Accounting/Reports statements |
| LedgerReportServices | get#GlAccountClassReportInfo |  | Accounting/Reports statements |
| LedgerReportServices | run#PostedAmountSummary | Accounting/Reports/PostedSummary; Insights/Dashboard; Insights/Panels/PanelDetail; Insights/ReportBuilder/Analysis; Insights/ManagementDigest | Accounting/Reports/PostedSummary |
| LedgerReportServices | get#PostedAmountSummarySide |  | removed (P16 review; run#PostedAmountSummary reads the view) |
| LedgerReportServices | get#AccountLedgerInfo | Accounting/Reports/GeneralLedger | checked (organization and period); GeneralLedger uses FinanceReportServices.run#GeneralLedger |
| LedgerReportServices | get#PeriodSeriesSummary | Accounting/Reports/AccountBalance; Insights/Dashboard; Insights/Panels/PanelDetail; Insights/ReportBuilder/Analysis; Insights/ManagementDigest | Accounting/Reports/AccountBalance |
| LedgerReportServices | get#PeriodSeriesSummaryRows |  |  |
| LedgerServices | create#GlAccount | Accounting/GeneralLedger/ChartOfAccounts | Accounting/GeneralLedger/ChartOfAccounts and Accounting/GeneralLedger/AccountDetail (through mantle.ledger.AccountServices.store#Account) |
| LedgerServices | init#PartyAccountingConfiguration | Accounting/Settings/Setup | Accounting/Settings/Setup/Basis (SetupServices.store#SetupRun, from a chart template) |
| LedgerServices | find#PartyAcctgPreference | Accounting/Settings/Settings | Accounting/Settings/Settings (through mantle.ledger.SetupServices.get#Preferences), and most Accounting screens (through the Mantle ledger and posting services) |
| LedgerServices | find#RootGlAccountClassEnum |  |  |
| LedgerServices | set#GlAccountFlags | Accounting/GeneralLedger/AccountDetail | Accounting/GeneralLedger/ChartOfAccounts and Accounting/GeneralLedger/AccountDetail (through mantle.ledger.AccountServices.store#Account and the GlAccount EECA) |
| LedgerServices | set#MissingGlAccountFlags |  |  |
| LedgerServices | expand#ParentOrganizationList |  |  |
| LedgerServices | expand#ChildOrganizationList |  |  |
| LedgerServices | get#DefaultGlAccountByType | Accounting/Settings/PostingDefaults | Accounting/Settings/PostingDefaults (through mantle.ledger.SetupServices.get#PostingDefaults) |
| LedgerServices | create#AcctgTrans | Accounting/GeneralLedger/JournalEntries; Accounting/GeneralLedger/JournalEntryDetail | Accounting/GeneralLedger/JournalEntryDetail and Accounting/QuickCreate/NewEntry (through mantle.ledger.JournalServices.store#DraftEntry); Accounting/GeneralLedger/JournalTemplates (through create#FromTemplate) |
| LedgerServices | update#AcctgTrans | Accounting/GeneralLedger/JournalEntryDetail | Accounting/GeneralLedger/JournalEntryDetail (through mantle.ledger.JournalServices.store#DraftEntry) |
| LedgerServices | update#AcctgTransPosted |  |  |
| LedgerServices | delete#AcctgTrans | Accounting/GeneralLedger/JournalEntryDetail | Accounting/GeneralLedger/JournalEntryDetail (through mantle.ledger.JournalServices.delete#DraftEntry) |
| LedgerServices | create#AcctgTransEntry | Accounting/GeneralLedger/JournalEntryDetail | Accounting/GeneralLedger/JournalEntryDetail (through mantle.ledger.JournalServices.store#DraftLine and move#DraftLine) |
| LedgerServices | update#AcctgTransEntry | Accounting/GeneralLedger/JournalEntryDetail | Accounting/GeneralLedger/JournalEntryDetail (through mantle.ledger.JournalServices.store#DraftLine) |
| LedgerServices | delete#AcctgTransEntry | Accounting/GeneralLedger/JournalEntryDetail | Accounting/GeneralLedger/JournalEntryDetail (through mantle.ledger.JournalServices.delete#DraftLine) |
| LedgerServices | calculate#AcctgTransTrialBalance | Accounting/GeneralLedger/JournalEntryDetail | Accounting/GeneralLedger/JournalEntryDetail (through mantle.ledger.AccountingServices.get#Record) |
| LedgerServices | post#AcctgTrans | Accounting/GeneralLedger/JournalEntryDetail | Accounting/GeneralLedger/JournalEntryDetail (through mantle.ledger.JournalServices.post#Entry); Accounting/GeneralLedger/JournalBatches and JournalEntries (through post#Batch) |
| LedgerServices | unpost#AcctgTrans |  |  |
| LedgerServices | update#GlAccountOrgSummariesForTx |  |  |
| LedgerServices | post#ReverseAcctgTrans | Accounting/GeneralLedger/JournalEntryDetail | Accounting/GeneralLedger/JournalEntryDetail (through mantle.ledger.JournalServices.reverse#Entry) |
| LedgerServices | move#AcctgTransEntry | Accounting/GeneralLedger/JournalEntryDetail | — (replaced by mantle.ledger.JournalServices.move#DraftLine on Accounting/GeneralLedger/JournalEntryDetail) |
| LedgerServices | get#OrganizationFiscalTimePeriods | Accounting/PeriodClose/Periods; Accounting/Reports/TrialBalance | Accounting/FixedAssets/DepreciationRunDetail; Accounting/Home (through ironstone.accounting.HomeServices.get#Summary); Accounting/Reports/SalesAnalysis (through mantle.sales.SalesReportServices.run#SalesAnalysis) |
| LedgerServices | check#NextFiscalTimePeriods | Accounting/PeriodClose/Periods | Accounting/PeriodClose/Periods (through mantle.ledger.AccountServices.ensure#Periods) |
| LedgerServices | close#FinancialTimePeriod | Accounting/PeriodClose/PeriodCloseDetail | Accounting/PeriodClose/PeriodCloseDetail (through CloseServices.close#Period) |
| LedgerServices | recalculate#GlAccountOrgTimePeriodAmounts | Accounting/PeriodClose/PeriodCloseDetail | Accounting/PeriodClose/PeriodCloseDetail (through CloseServices.close#Period) |
| LedgerServices | reopen#FinancialTimePeriod | Accounting/PeriodClose/PeriodCloseDetail | Accounting/PeriodClose/PeriodCloseDetail (through CloseServices.reopen#Period) |
| LedgerServices | create#PeriodCloseAcctgTrans | Accounting/PeriodClose/PeriodCloseDetail | Accounting/PeriodClose/PeriodCloseDetail (through CloseServices.close#Period, a fiscal year) |
| LedgerServices | recalculate#GlAccountOrgSummaries |  |  |
| LedgerServices | create#GlJournal | Accounting/GeneralLedger/JournalBatches | Accounting/GeneralLedger/JournalBatches (through mantle.ledger.JournalServices.store#Batch) |
| LedgerServices | update#GlJournal | Accounting/GeneralLedger/JournalBatches | Accounting/GeneralLedger/JournalBatches (through mantle.ledger.JournalServices.store#Batch and post#Batch) |
| LedgerServices | calculate#GlJournalTrialBalance |  |  |
| LedgerServices | post#GlJournal |  |  |
| OtherAutoPostServices | post#WorkEffortCost |  | Accounting/PeriodClose/PeriodRuns (the project cost run); Projects timesheet approval (approve#Timesheet, reopen#Timesheet) |
| OtherAutoPostServices | post#FinancialAccountTrans |  |  |
| OtherAutoPostServices | get#FinancialAccountGlAccount |  |  |
| OtherAutoPostServices | get#FinancialAccountTransGlAccount |  |  |
| PaymentAutoPostServices | post#Payment | Accounting/Payments/PaymentDetail | Accounting/Payments/PaymentDetail/Review (through mantle.account.PaymentServices.change#PaymentState and the PaymentGlPost SECA) |
| PaymentAutoPostServices | revert#PaymentPost | Accounting/Payments/PaymentDetail | Accounting/Payments/PaymentDetail/Review (through mantle.account.PaymentServices.change#PaymentState and the PaymentCancelRevertGlPost SECA) |
| PaymentAutoPostServices | get#PaymentPartyAcctgPreferences |  |  |
| PaymentAutoPostServices | create#PaymentTypeEntry |  |  |
| PaymentAutoPostServices | get#PaymentTypeGlAccount |  |  |
| PaymentAutoPostServices | get#PaymentMethodGlAccount |  |  |
| PaymentAutoPostServices | post#PaymentApplication |  |  |
| PaymentAutoPostServices | revert#PaymentApplicationPost |  |  |
| PaymentAutoPostServices | repost#PaymentAndApplications |  |  |

## Marketing (11 services, all added)

Added in the drawers-commons build (Oct 18–19, 2026), called by built screens:

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| ContactListServices | get#ContactListAccess | PASS: Forum/Categories/CategoryDetail; PASS: Forum/Topics/TopicDetail | Comms/Inbox/Compose; Comms/Inbox/Mail |
| ContactListServices | create#ContactList | PASS: Forum/Settings/Categories; Marketing/Audiences/Lists; Marketing/QuickCreate | Comms/Inbox/Mail |
| ContactListServices | update#ContactList | PASS: Forum/Settings/Categories; Marketing/Audiences/Lists/ListDetail | Comms/Inbox/Mail |
| ContactListServices | find#ContactLists | Marketing/Audiences/Lists | Comms; Comms/Inbox/Compose; Comms/Inbox/Mail |
| ContactListServices | find#ContactListParties | Marketing/Audiences/Lists/ListDetail | Comms/Inbox/Mail |
| ContactListServices | join#ContactList | PASS: Forum/Categories/CategoryDetail | Comms/Inbox/Mail |
| ContactListServices | leave#ContactList | PASS: Forum/Categories/CategoryDetail | Comms/Inbox/Mail |
| ContactListServices | add#ContactListParty | PASS: Forum/Settings/Members | Comms/Inbox/Mail |
| ContactListServices | remove#ContactListParty | PASS: Forum/Settings/Members | Comms/Inbox/Mail |
| ContactListServices | decline#ContactListParty | PASS: Forum/Settings/Members | Comms/Inbox/Mail |
| ContactListServices | set#ContactListPartyDelivery | PASS: Forum/Categories/CategoryDetail | Comms/Inbox/Mail |

## Order (89 services)

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| OrderBulkServices | store#Order |  |  |
| OrderBulkServices | change#OrderPartsStatus |  |  |
| OrderInfoServices | get#OrderDisplayInfo | Purchasing/Orders/OrderDetail; Shared/Customer360; Shared/Supplier360; PASS:Shop/Cart; PASS:Shop/Checkout; PASS:Shop/Orders/OrderConfirmation; PASS:Shop/Orders/OrderDetail; Commerce/Orders/Carts/CartDetail; Commerce/Orders/OrderDetail; Sales/Orders/OrderDetail | — (replaced by mantle.account.CustomerFinanceServices.get#CustomerFinance on Accounting/Receivables/Customer360) |
| OrderInfoServices | get#OrderItemsTotalCount |  |  |
| OrderInfoServices | get#OrderItemDisplayInfo |  |  |
| OrderInfoServices | get#OrderPartBillingAddress |  |  |
| OrderInfoServices | validate#Order |  |  |
| OrderInfoServices | validate#OrderRequireManual |  |  |
| OrderInfoServices | check#OrderPreApprove | Shared/OrderDetail; Accounting/Records/OrderDetail; CustomerService/Orders/OrderDetail; Purchasing/Orders/OrderDetail; Commerce/Orders/OrderDetail; Sales/Orders/OrderDetail | (the OrderPreApproveCredit SECA; autoApprove#Order) |
| OrderInfoServices | send#OrderStoreEmail | Purchasing/Orders/OrderDetail; Shared/OrderDetail; Commerce/Orders/OrderDetail |  |
| OrderInfoServices | notify#OrderHighPriority |  |  |
| OrderServices | create#Order | Purchasing/Orders/PurchaseOrders; Sales/Quotes/Quotes; Sales/Orders/Orders; Sales/Quotes/QuoteRequestDetail |  |
| OrderServices | update#OrderHeader | Purchasing/Orders/OrderDetail; Shared/OrderDetail; Commerce/Orders/OrderDetail; Sales/Orders/OrderDetail |  |
| OrderServices | create#OrderPart | Purchasing/Orders/OrderDetail; Shared/OrderDetail; Commerce/Orders/OrderDetail; Sales/Orders/OrderDetail; Sales/Orders/Orders; Sales/Quotes/Quotes |  |
| OrderServices | update#OrderPart | Purchasing/Orders/OrderDetail; Shared/OrderDetail; Commerce/Orders/OrderDetail; Sales/Orders/OrderDetail |  |
| OrderServices | get#OrderItemTotal |  |  |
| OrderServices | create#OrderItem | Purchasing/Orders/OrderDetail; Shared/OrderDetail; Commerce/Orders/OrderDetail; Sales/Orders/OrderDetail |  |
| OrderServices | update#OrderItem | Purchasing/Orders/OrderDetail; Shared/OrderDetail; Commerce/Orders/OrderDetail; Sales/Orders/OrderDetail |  |
| OrderServices | delete#OrderItem | Purchasing/Orders/OrderDetail; Shared/OrderDetail; PASS:Shop/Cart; Commerce/Orders/OrderDetail; Sales/Orders/OrderDetail |  |
| OrderServices | recalc#OrderItemAmount |  |  |
| OrderServices | recalc#OrderPartItemAmounts |  |  |
| OrderServices | check#AvailableInventory |  |  |
| OrderServices | add#OrderProductQuantity | Purchasing/Orders/OrderDetail; Shared/OrderDetail; PASS:Shop/Products/ProductDetail; PASS:Shop/Cart; PASS:Shop/Orders/OrderDetail; Commerce/Orders/OrderDetail; Sales/Orders/OrderDetail |  |
| OrderServices | update#OrderProductQuantity | PASS:Shop/Cart |  |
| OrderServices | merge#OrderItems |  |  |
| OrderServices | set#OrderBillingShippingInfo | Shared/OrderDetail; PASS:Shop/Checkout; Commerce/Orders/OrderDetail; Sales/Orders/OrderDetail |  |
| OrderServices | add#OrderPartPayment | Shared/OrderDetail; PASS:Shop/Checkout; Commerce/Orders/OrderDetail; Sales/Orders/OrderDetail |  |
| OrderServices | create#OrderPayments50Split |  |  |
| OrderServices | change#OrderStatusInterface |  |  |
| OrderServices | update#OrderStatus | Purchasing/Orders/OrderDetail |  |
| OrderServices | propose#Order | Sales/Orders/OrderDetail |  |
| OrderServices | place#Order | Purchasing/Orders/OrderDetail; PASS:Shop/Checkout; Commerce/Orders/OrderDetail; Sales/Orders/OrderDetail; PASS:Sales/CustomerQuote |  |
| OrderServices | approve#Order | Purchasing/Orders/OrderDetail; Purchasing/Orders/PurchaseOrders; Commerce/Orders/OrderDetail; Sales/Orders/OrderDetail |  |
| OrderServices | autoApprove#OrdersDelayed |  |  |
| OrderServices | autoApprove#Order |  |  |
| OrderServices | isFulfilled#OrderPart |  |  |
| OrderServices | isFulfilled#OrderItem |  |  |
| OrderServices | checkComplete#OrderPart |  |  |
| OrderServices | checkStillComplete#Order |  |  |
| OrderServices | checkCancelComplete#Order |  |  |
| OrderServices | checkRejectedComplete#Order |  |  |
| OrderServices | complete#OrderPart | Purchasing/Orders/OrderDetail |  |
| OrderServices | complete#Order | Purchasing/Orders/PurchaseOrders |  |
| OrderServices | cancel#Order | Purchasing/Orders/OrderDetail; Commerce/Orders/OrderDetail; Sales/Orders/OrderDetail; PASS:Sales/CustomerQuote |  |
| OrderServices | cancel#OrderPart | Purchasing/Orders/OrderDetail |  |
| OrderServices | cancel#OrderItem | Purchasing/Orders/OrderDetail | Warehouse/Receiving/ReceiptDetail (Finish receipt, close), with an explicit cancelQuantity through OrderServices.close#PurchaseRemainders; flags picked stock above a reduced line (putBackQuantity) for Warehouse/Picking/Pick (PutBack, reverse#Pick, P11) |
| OrderServices | reject#Order |  |  |
| OrderServices | reject#OrderPart |  |  |
| OrderServices | reject#OrderItem |  |  |
| OrderServices | clone#Order | Purchasing/Orders/OrderDetail; Sales/Orders/OrderDetail; Commerce/Orders/OrderDetail; Commerce/Customers/Customer360 |  |
| OrderServices | update#OrderRecur | Shared/OrderDetail; Sales/Orders/OrderDetail; Sales/Agreements/RecurringOrders |  |
| OrderServices | create#RecurringOrders |  | Accounting/Receivables/RecurringInvoices (its job's last run) |
| OrderServices | create#RecurringOrder |  |  |
| OrderServices | handle#OrderItemChange |  |  |
| OrderServices | handle#OrderPartChange |  |  |
| OrderServices | handle#OrderMajorChange |  |  |
| OrderServices | update#OrderHeaderTotal |  |  |
| OrderServices | update#OrderPartTotal |  |  |
| OrderServices | increment#OrderRevision | Purchasing/Orders/OrderChanges |  |
| OrderServices | create#OrderContent | Shared/RecordFiles; Shared/OrderDetail; Sales/Orders/OrderDetail | Shared/RecordFiles |
| OrderServices | update#OrderContent | Shared/OrderDetail; Sales/Orders/OrderDetail |  |
| OrderServices | save#OrderContentFile | Shared/RecordFiles |  |
| OrderServices | create#PurchaseRequestOrder | Projects/Requests/RequestDetail; Purchasing/Requests/RequestSourcing |  |
| ReturnServices | get#ReturnDisplayInfo | Warehouse/Returns/ReturnDetail; Purchasing/Returns/ReturnDetail; CustomerService/Returns/ReturnDetail; CustomerService/Returns/Returns; Shared/Customer360; Shared/ReturnDetail | — (§7: a return list on Customer360; Accounting/Records/ReturnDetail reads through ironstone.accounting.ReturnScreenServices.get#ReturnContext) |
| ReturnServices | create#Return | Warehouse/Returns/Returns; Purchasing/Returns/ReturnDetail | Warehouse/Returns/Returns (NewReturn: a supplier return from a facility) |
| ReturnServices | create#ReturnFromOrder | Warehouse/Returns/Returns; Purchasing/Returns; CustomerService/Returns/NewReturn; PASS:Support/RequestReturn; Shared/ReturnDetail | Warehouse/Returns/Returns (NewReturn: a customer return from a sales order) |
| ReturnServices | find#OrderOpenReturns | CustomerService/Returns/NewReturn; PASS:Support/RequestReturn |  |
| ReturnServices | find#ReturnableOrderItems | Warehouse/Returns/ReturnDetail; Purchasing/Returns; CustomerService/Returns/NewReturn; PASS:Support/RequestReturn; Shared/ReturnDetail; PASS:Shop/Orders/RequestReturn | Warehouse/Returns/ReturnDetail (Eligible items of a customer return) |
| ReturnServices | calculate#OrderItemReturnable | Warehouse/Returns/ReturnDetail; Purchasing/Returns; CustomerService/Returns/NewReturn; PASS:Support/RequestReturn; Shared/ReturnDetail | Warehouse/Returns/ReturnDetail (Eligible items, Add: through add#OrderItemToReturn) |
| ReturnServices | add#OrderItemToReturn | Warehouse/Returns/ReturnDetail; Purchasing/Returns/ReturnDetail; CustomerService/Returns/NewReturn; PASS:Support/RequestReturn; Shared/ReturnDetail | Warehouse/Returns/ReturnDetail (Eligible items, Add) |
| ReturnServices | change#ReturnStatusInterface |  |  |
| ReturnServices | update#ReturnStatus |  |  |
| ReturnServices | checkUpdate#ReturnHeaderStatus |  | (WarehouseTaskServices.ship#SupplierReturn: ReturnShipped) |
| ReturnServices | request#Return | Warehouse/Returns/ReturnDetail; Purchasing/Returns/ReturnDetail; CustomerService/Returns/ReturnDetail; CustomerService/Returns/NewReturn; PASS:Support/RequestReturn | Warehouse/Returns/ReturnDetail (Submit for authorization) |
| ReturnServices | approve#Return | Warehouse/Returns/ReturnDetail; Purchasing/Returns/ReturnDetail; CustomerService/Returns/ReturnDetail | — (Warehouse: authorization is Customer Service's RETURN_AUTHORIZE, which no Warehouse group holds) |
| ReturnServices | receive#ReturnShipmentItems | Warehouse/Returns/ReturnDetail; Warehouse/Returns/ReturnReceipt; Shared/ReturnDetail | — (Warehouse: replaced on the receipt path by WarehouseTaskServices.receive#ReturnItems) |
| ReturnServices | receive#ReturnWithoutShipment | Warehouse/Returns/ReturnDetail; CustomerService/Returns/ReturnDetail; Shared/ReturnDetail | — (not offered: a receipt without a carrier uses ReturnReceipt, design §11) |
| ReturnServices | receive#ReturnItem | Warehouse/Returns/ReturnDetail; Warehouse/Returns/ReturnReceipt | — (Warehouse: replaced by WarehouseTaskServices.receive#ReturnItems) |
| ReturnServices | complete#ReturnItem | CustomerService/Returns/ReturnDetail; Shared/ReturnDetail | Accounting/Records/ReturnDetail (through settle#Return) |
| ReturnServices | process#ReturnItemResponses | CustomerService/Returns/ReturnDetail; Accounting/Records/ReturnDetail; Shared/ReturnDetail | Accounting/Records/ReturnDetail (a customer return, through settle#Return) |
| ReturnServices | cancel#Return | Warehouse/Returns/ReturnDetail; Purchasing/Returns/ReturnDetail; CustomerService/Returns/ReturnDetail | — not built (P14): ReturnDetail has no cancel; it changes a return only by adding eligible items |
| ReturnServices | cancel#ReturnItem | Warehouse/Returns/ReturnDetail; CustomerService/Returns/ReturnDetail | — not built (P14): ReturnDetail does not change or remove an item; it adds eligible items only |
| ReturnServices | update#ReturnItem | Warehouse/Returns/ReturnDetail; Purchasing/Returns/ReturnDetail; CustomerService/Returns/ReturnDetail; CustomerService/Returns/NewReturn; PASS:Support/RequestReturn; Shared/ReturnDetail | — not built (P14): ReturnDetail does not change or remove an item; it adds eligible items only |
| ReturnServices | delete#ReturnItem | Warehouse/Returns/ReturnDetail; Shared/ReturnDetail | — not built (P14): ReturnDetail does not change or remove an item; it adds eligible items only |
| ReturnServices | create#ReturnShipment | Warehouse/Returns/ReturnDetail; Purchasing/Returns/ReturnDetail; Shared/ReturnDetail | Warehouse/Returns/ReturnDetail (Create return shipment, for an approved return with none) |
| ReturnServices | add#ReturnToShipment | Warehouse/Returns/ReturnDetail; Shared/ReturnDetail | Warehouse/Returns/ReturnDetail (Create return shipment, through create#ReturnShipment) |
| ReturnServices | returnAndResell#Shipment |  |  |
| ReturnServices | return#Shipment |  |  |
| ReturnServices | resell#Shipment |  |  |

## Other (32 services, 10 added)

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| BudgetReportServices | run#BudgetExpenseReport | Accounting/Reports/BudgetVariance | Not used: Accounting/Reports/BudgetVariance runs run#BudgetVariance (organization-checked, committed, actuals net of credits) |
| BudgetReportServices | run#BudgetExpenseDetailReport | Accounting/Reports/BudgetVariance | Not used (asset and facility details are §7) |
| BudgetServices | get#GlAccountAppls |  |  |
| BudgetServices | get#AssetGlAppls |  |  |
| BudgetServices | get#FacilityGlAppls |  |  |
| BudgetServices | create#Budget | Accounting/Budgets/Budgets | Accounting/Budgets/Budgets#NewBudget (a draft, its creator recorded) |
| BudgetServices | store#BudgetItem | Accounting/Budgets/BudgetDetail | Accounting/Budgets/BudgetDetail (a budget without sub periods; drafts only) |
| BudgetServices | get#BudgetItemsAccountsSubPeriods | Accounting/Budgets/BudgetDetail | — (replaced by ironstone.accounting.BudgetServices.get#BudgetDetail on Accounting/Budgets/BudgetDetail) |
| BudgetServices | store#BudgetItemsSubPeriods | Accounting/Budgets/BudgetDetail | Accounting/Budgets/BudgetDetail#AddAccountForm and AccountAmounts (drafts only) |
| BudgetServices | store#BudgetItemDetail | Accounting/Budgets/BudgetDetail | — (§7: budget item details by asset or facility, F316) |
| BudgetServices | store#BudgetItemDetailsSubPeriods | Accounting/Budgets/BudgetDetail | — (§7: budget item details by asset or facility, F316) |
| TaxServices | calculate#SalesTax | Accounting/Tax/TaxRates | Mantle, the gateway interface of calculate#SalesTaxLocal |
| TaxServices | calculate#OrderSalesTax | PASS:Shop/Checkout |  |
| TaxServices | calculate#InvoiceSalesTax | Shared/InvoiceDetail | Mantle, change#InvoiceState on finalize or approve (Accounting/Receivables/InvoiceDetail) |
| TaxServices | calculate#SalesTaxLocal | Accounting/Tax/TaxRates | Accounting/Tax/TaxRates (simulate#SalesTax); invoice finalize |
| TaxServices | create#TaxStatement | Accounting/Tax/TaxStatements | Accounting/Tax/TaxStatements (create#SalesTaxStatement, run#Vendor1099Statements) |
| TaxServices | delete#TaxStatement | Accounting/Tax/TaxStatementDetail | Accounting/Tax/TaxStatements; Accounting/Tax/TaxStatementDetail |
| TaxServices | create#AllVendor1099MiscStatements | Accounting/Tax/TaxStatements | Not used: Accounting/Tax/TaxStatements runs run#Vendor1099Statements (payments, registered vendors) |
| TaxServices | create#Vendor1099MiscStatement | Accounting/Tax/TaxStatements | Accounting/Tax/TaxStatements (run#Vendor1099Statements, itemTypeTotals) |
| TaxServices | get#UsaIrs1099MiscFormData | Accounting/Tax/TaxStatementDetail | Accounting/Tax/TaxStatements (the 1099 run) |
| TaxServices | get#RecipientTaxInfo |  | Accounting/Tax/TaxStatements (the 1099 run's checks) |
| TaxServices | get#PayerTaxInfo |  |  |

Added in Accounting P15 (budgets), called by built screens:

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| BudgetServices | get#BudgetAmounts |  | Accounting/Budgets/BudgetDetail (through BudgetServices.get#BudgetDetail); budget choices |
| BudgetServices | change#BudgetState | Accounting/Budgets/BudgetDetail | Accounting/Budgets/BudgetDetail (approve, close, cancel) |
| BudgetServices | revise#Budget | Accounting/Budgets/BudgetDetail | Accounting/Budgets/BudgetDetail#AddAccountForm and AccountAmounts |
| BudgetServices | store#BudgetParty | Accounting/Budgets/BudgetDetail | Accounting/Budgets/BudgetDetail#AddPartyForm |
| BudgetServices | store#Policy | Accounting/Budgets/BudgetControls | Accounting/Budgets/BudgetControls#BudgetPolicy, PolicyVersion and EndPolicy |
| BudgetServices | check#Budget | Accounting/Budgets/BudgetControls | Mantle (the preview of reserve#, convert#Commitment); Purchasing's callers are §7 |
| BudgetServices | reserve#Commitment | Accounting/Budgets/BudgetControls | Mantle; Purchasing's request and order approvals are §7 |
| BudgetServices | convert#Commitment | Accounting/Payables/BillDetail | Accounting/Payables/BillDetail and ExpensePosting (through approve#Payable) |
| BudgetServices | release#Commitment | Accounting/Budgets/BudgetControls | Mantle; Purchasing's close and cancel are §7 |
| BudgetReportServices | run#BudgetVariance | Accounting/Reports/BudgetVariance; Insights/Dashboard; Insights/Panels/PanelDetail; Insights/ReportBuilder/Analysis; Insights/ManagementDigest | Accounting/Reports/BudgetVariance |

## Party (86 services, 59 added)

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| AgreementServices | create#AgreementContent | Shared/RecordFiles; Purchasing/Agreements/AgreementDetail; Sales/Agreements/AgreementDetail | Shared/RecordFiles |
| AgreementServices | update#AgreementContent | Purchasing/Agreements/AgreementDetail; Sales/Agreements/AgreementDetail |  |
| AgreementServices | save#AgreementContentFile | Shared/RecordFiles |  |
| CommunicationServices | find#PartyCommunicationEvents | Shared/Chatter; CustomerService/Cases/ChannelSessions |  |
| CommunicationServices | create#Message | Commons/QuickCreate; Commons/Files; Comms/Inbox/Compose; Projects/Requests/RequestDetail; Projects/Code/MergeRequestDetail/Changes; Shared/Chatter; CustomerService/Cases/CaseDetail; Shared/RequestDetail; PASS: Forum/Compose; Sales/Pipeline/OpportunityDetail | Comms/Inbox/Compose; Shared/Chatter |
| CommunicationServices | reply#CommunicationEvent | Comms/Inbox/Compose; Projects/Code/MergeRequestDetail/Changes; Shared/Chatter | Comms/Inbox/Compose; Shared/Chatter |
| CommunicationServices | add#WikiPageComment | Commons/Knowledge; Commons/Knowledge/Review |  |
| CommunicationServices | get#CommunicationEventContentLocation |  |  |
| CommunicationServices | create#CommunicationEventContent | Shared/RecordFiles | Shared/RecordFiles |
| CommunicationServices | update#CommunicationEventContent |  |  |
| CommunicationServices | save#CommunicationEventContentFile | Shared/RecordFiles |  |
| ContactServices | get#PartyContactInfo | Commons/Contacts/ContactDetail; Comms/Inbox; Marketing/Contacts/ContactDetail; Admin/Settings/OrganizationDetail | Commons/Contacts/ContactDetail; Commons/Contacts/List; Commons/Settings/Account; Comms/Inbox/Mail; Projects/Billing/InvoiceDetail; Projects/Billing/InvoicePrint |
| ContactServices | get#PartyContactInfoList | PASS:Shop/Account/Addresses; PASS:Shop/Checkout |  |
| ContactServices | get#PartyDefaultBilling |  |  |
| ContactServices | store#PartyContactInfo | Commons/Contacts/ContactDetail; Commons/Settings/Account; PASS:Shop/Account/Addresses; PASS:Shop/Checkout; Marketing/Contacts/ContactDetail; Admin/Settings/OrganizationDetail | Commons/Contacts/ContactDetail; Commons/Contacts/List; Commons/Settings/Account |
| ContactServices | create#PostalAddress | PASS:Shop/Account/Addresses; PASS:Shop/Checkout |  |
| ContactServices | update#PartyPostalAddress | PASS:Shop/Account/Addresses; PASS:Shop/Checkout |  |
| ContactServices | get#PostalAddressGeoIdSet |  |  |
| ContactServices | findOrCreate#PartyPostalAddress |  |  |
| ContactServices | clean#TelecomNumber |  |  |
| ContactServices | create#TelecomNumber | Commons/QuickCreate |  |
| ContactServices | update#PartyTelecomNumber |  |  |
| ContactServices | findOrCreate#PartyTelecomNumber |  |  |
| ContactServices | create#EmailAddress | Commons/QuickCreate |  |
| ContactServices | get#PrimaryEmailAddress |  | Commons/Settings/Account; Comms/Inbox/Compose; Projects/Billing/InvoiceDetail; Projects/Billing/InvoicePrint |
| ContactServices | findOrCreate#PartyEmailAddress |  |  |
| ContactServices | create#WebAddress |  |  |
| ContactServices | create#ContactMechOther |  |  |
| ContactServices | update#PartyContactOther |  |  |
| ContactServices | update#ContactMechMutable |  |  |
| ContactServices | store#PartyContactMech | Commons/Contacts/ContactDetail; Comms/Consent; Marketing/Contacts/ContactDetail; Marketing/Audiences/Consent/ConsentDetail | Commons/Contacts/ContactDetail; Commons/Contacts/List |
| ContactServices | delete#PartyContactMech | Commons/Contacts/ContactDetail; Marketing/Contacts/ContactDetail | Commons/Contacts/ContactDetail; Commons/Contacts/List |
| ContactServices | undelete#PartyContactMech |  |  |
| DuplicateServices | find#PartyHasDuplicates | Commons/Contacts/Duplicates |  |
| DuplicateServices | find#PartyDuplicates | Commons/Contacts/Duplicates; Sales/Accounts/MergeAccounts | Commons/Contacts/Duplicates |
| DuplicateServices | find#TelecomNumbers |  |  |
| DuplicateServices | find#PostalAddresses |  |  |
| DuplicateServices | check#AllPartyDuplicates | Commons/Contacts/Duplicates | Commons/Contacts/Duplicates |
| DuplicateServices | merge#AllDuplicateParties |  |  |
| DuplicateServices | merge#Parties | Commons/Contacts; Commons/Contacts/Duplicates; Sales/Accounts/MergeAccounts | Commons/Contacts/Compare |
| GooglePartyServices | get#MapsGeoCodeResults |  |  |
| GooglePartyServices | get#MapsPlaceSearchText |  |  |
| GooglePartyServices | get#MapsPlaceDetails |  |  |
| PartyServices | find#Party | Commons/Contacts; Purchasing/Suppliers | Commons; Commons/Contacts/ContactDetail; Commons/Contacts/List; Comms/Consent/List |
| PartyServices | search#Party | Commons/Contacts; Comms/Panel/Chat; Comms/Inbox |  |
| PartyServices | search#Person |  | Commons/Calendar; Commons/Calendar/EventDetail; Commons/QuickCreate; Projects/Projects/ProjectDetail/Plan/Calendar |
| PartyServices | get#UserNoticeCounts |  |  |
| PartyServices | setup#UserOrganizationInfo | Commons; Comms; Projects; Products; Warehouse; Purchasing; CustomerService; Accounting; Manufacturing; Maintenance; Commerce; Marketing; Admin; Insights | Commons; Comms; Projects; Products |
| PartyServices | get#PartyOrganizationInfo |  |  |
| PartyServices | create#Account |  |  |
| PartyServices | update#Account |  | Commons/Settings/Account |
| PartyServices | create#UserAccountPerson |  |  |
| PartyServices | create#PartyUserAccount | Admin/Users/Users |  |
| PartyServices | update#PartyUserAccount | Admin/Users/UserDetail |  |
| PartyServices | create#Person | Commons/QuickCreate; Purchasing/Suppliers; Sales/Accounts/Accounts; Sales/Accounts/ContactDetail |  |
| PartyServices | create#PersonCustomer |  |  |
| PartyServices | create#PersonEmployee |  |  |
| PartyServices | create#Organization | Commons/QuickCreate; Purchasing/Suppliers; Admin/Settings/Organizations |  |
| PartyServices | update#PartyDetail | Commons/Contacts/ContactDetail; Shared/Customer360; Shared/Supplier360; Sales/Accounts/Customer360; Sales/Accounts/ContactDetail; Marketing/Contacts/ContactDetail; Marketing/Customers/Customer360; Admin/Settings/OrganizationDetail | Commons/Contacts/Compare; Commons/Contacts/ContactDetail; Commons/Contacts/List |
| PartyServices | convert#PartyToOrganization |  |  |
| PartyServices | convert#PartyToPerson |  |  |
| PartyServices | ensure#PartyRole | Purchasing/Suppliers; Admin/Settings/Organizations; Admin/Settings/OrganizationDetail |  |
| PartyServices | set#PartyClassification | Purchasing/Suppliers/Supplier360; Shared/Customer360; Sales/Accounts/Customer360 | — (other apps' contexts on Customer360, §7) |
| PartyServices | remove#PartyClassification | Purchasing/Suppliers/Supplier360; Shared/Customer360; Sales/Accounts/Customer360 | — (other apps' contexts on Customer360, §7) |
| PartyServices | get#PartyBadgeInfo |  |  |
| PartyServices | lookup#PartyBadge |  |  |
| PartyServices | scan#PartyBadge |  |  |
| PartyServices | get#PartyContentLocation |  |  |
| PartyServices | create#PartyContent | Commons/Contacts/ContactDetail; Commons/Settings/Account; Shared/RecordFiles; Marketing/Contacts/ContactDetail; Marketing/Customers/Customer360 | Commons/Contacts/ContactDetail; Commons/Contacts/List; Commons/Settings/Account; Shared/RecordFiles |
| PartyServices | update#PartyContent |  |  |
| PartyServices | save#PartyContentFile | Shared/RecordFiles |  |
| PartyServices | get#PartySettingValue | Admin/Settings/OrganizationDetail |  |
| PartyServices | store#PartySetting | Admin/Settings/OrganizationDetail |  |
| PartyServices | store#PartyRelationshipSetting |  |  |
| PartyServices | validate#PartySetting | Admin/Settings/OrganizationDetail |  |
| PartyServices | send#DataDocumentNotifications |  |  |
| TimeServices | get#DescendantPeriods |  |  |
| TimeServices | create#TimePeriod |  |  |
| TimeServices | reset#TimePeriodNames |  |  |
| TimeServices | delete#TimePeriod |  |  |
| TimeServices | getOrCreate#TimePeriod |  |  |
| TimeServices | getOrCreate#NextTimePeriod |  |  |
| TimeServices | get#NextTimePeriod |  |  |
| TimeServices | getOrCreate#PreviousTimePeriod |  |  |
| TimeServices | get#TimePeriodInfo |  |  |
| TimeServices | find#PartyTimePeriodGroups |  |  |

Added in the drawers-commons build (Oct 18–19, 2026), called by built screens:

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| CommunicationServices | get#InternalThread | PASS: Forum/Topics/TopicDetail | Comms/Inbox/Compose; Comms/Inbox/Mail; Comms/Inbox/MessageDetail |
| CommunicationServices | set#InternalMessageState | PASS: Forum/Topics/TopicDetail | Comms/Inbox/Compose; Comms/Inbox/Mail |
| CommunicationServices | close#ListThread | PASS: Forum/Topics/TopicDetail | Comms/Inbox/Compose; Comms/Inbox/Mail |
| CommunicationServices | find#InboxThreads |  | Comms; Comms/Home; Comms/Inbox/Mail |
| CommunicationServices | get#InboxUnreadCounts |  | Comms/Home; Comms/Inbox/Mail |
| CommunicationServices | get#RecordLinkInfo | Shared/Chatter; Shared/RecordFiles; Sales/Pipeline/OpportunityDetail | Commons/Calendar; Commons/Calendar/EventDetail; Commons/Files; Commons/Knowledge; Commons/Notes; Commons/QuickCreate; Commons/Requests/List; Commons/Requests/RequestDetail; Commons/Tasks/List; Commons/Tasks/TaskDetail; Comms/Chat; Comms/Inbox/Compose; Comms/Inbox/Mail; Comms/Inbox/MessageDetail; Shared/Chatter; Shared/RecordFiles; Projects: 19 screens (through the ironstone.* access and find services) |
| CommunicationServices | findOrCreate#EmailCommunicationEvent |  | Comms/Inbox/Mail |
| CommunicationServices | link#CommunicationEventRecord |  | Comms/Chat; Comms/Inbox/Compose; Comms/Inbox/Mail; Comms/Inbox/MessageDetail; Shared/Chatter |
| CommunicationServices | unlink#CommunicationEventRecord |  | Comms/Inbox/Mail; Shared/Chatter |
| CommunicationServices | send#EmailDraft | Projects/Requests/RequestDetail; CustomerService/Cases/CaseDetail; Shared/RequestDetail; Sales/Orders/OrderDetail; Sales/Quotes/QuoteRequestDetail | Comms/Inbox/Compose |
| CommunicationServices | get#RecordTimeline | Sales/Pipeline/OpportunityDetail | Shared/Chatter |
| CommunicationServices | log#RecordNote |  | Commons/QuickCreate; Shared/Chatter |
| CommunicationServices | update#RecordNote |  | Shared/Chatter |
| CommunicationServices | delete#RecordNote |  | Shared/Chatter |
| CommunicationServices | notify#RecordMention |  | Shared/Chatter |
| CommunicationServices | notify#RecordFollowers |  | Commons/Knowledge; Commons/Notes; Projects/Projects/ProjectDetail/Docs |
| CommunicationServices | follow#Record |  | Commons/Knowledge; Shared/Chatter; Projects/Projects/ProjectDetail; Projects/Projects/ProjectDetail/Docs; Projects/WorkItems/WorkItemDetail |
| CommunicationServices | unfollow#Record |  | Commons/Knowledge; Shared/Chatter; Projects/Projects/ProjectDetail; Projects/Projects/ProjectDetail/Docs; Projects/WorkItems/WorkItemDetail |
| CommunicationServices | get#RecordFollowers |  | Shared/Chatter |
| CommunicationServices | findOrCreate#ChatCommunicationEvent |  | Comms/Chat |
| CommunicationServices | create#RecordFromChatMessage |  | Comms/Chat |
| ConsentServices | store#PartyConsent | Marketing/Audiences/Consent/ConsentDetail | Commons/Contacts/ContactDetail; Commons/Contacts/List; Comms/Consent/Contact; Comms/Consent/List |
| ConsentServices | get#PartyConsentState | Marketing/Audiences/Consent/ConsentDetail; Marketing/Customers/Customer360; Marketing/Contacts/ContactDetail; Commerce/Orders/Carts/CartDetail | Comms/Consent/Contact |
| ConsentServices | get#PartyConsentHistory | Marketing/Audiences/Consent/ConsentDetail; Marketing/Audiences/Lists/MemberDetail | Comms/Consent/Contact |
| ConsentServices | find#Consents | Marketing/Audiences/Consent | Comms/Consent/List |
| ConsentServices | subscribe#ContactListParty | Marketing/Audiences/Consent/ConsentDetail; Marketing/Audiences/Lists/MemberDetail | Commons/Contacts/ContactDetail; Commons/Contacts/List; Comms/Consent/Contact |
| ConsentServices | unsubscribe#ContactListParty | Marketing/Audiences/Consent/ConsentDetail; Marketing/Audiences/Lists/MemberDetail; PASS:Account/EmailPreferences | Commons/Contacts/ContactDetail; Commons/Contacts/List; Comms/Consent/Contact; Unsubscribe |
| ConsentServices | unsubscribe#ContactListParties | Marketing/Audiences/Consent | Comms/Consent/List |
| ConsentServices | check#UnsubscribeToken | PASS:Account/EmailPreferences | Unsubscribe |
| ConsentServices | resolve#UnsubscribeToken | PASS:Account/EmailPreferences | Unsubscribe |
| ConsentServices | apply#UnsubscribePreferences | PASS:Account/EmailPreferences | Unsubscribe |
| ContactBookServices | create#ContactBook |  | Commons/Settings/ContactBooks |
| ContactBookServices | update#ContactBook |  | Commons/Settings/ContactBooks |
| ContactBookServices | delete#ContactBook |  | Commons/Settings/ContactBooks |
| ContactBookServices | ensure#UserDefaultContactBook |  | Commons/QuickCreate |
| ContactBookServices | share#ContactBook |  | Commons/Settings/ContactBooks |
| ContactBookServices | unshare#ContactBook |  | Commons/Settings/ContactBooks |
| ContactBookServices | add#ContactBookParties |  | Commons/Contacts/ContactDetail; Commons/Contacts/List |
| ContactBookServices | remove#ContactBookParties |  | Commons/Contacts/ContactDetail; Commons/Contacts/List |
| ContactBookServices | create#ContactBookGroup |  | Commons/Settings/ContactBooks |
| ContactBookServices | update#ContactBookGroup |  | Commons/Settings/ContactBooks |
| ContactBookServices | delete#ContactBookGroup |  | Commons/Settings/ContactBooks |
| ContactBookServices | add#ContactBookGroupParties |  | Commons/Contacts/List |
| ContactBookServices | remove#ContactBookGroupParties |  | Commons/Contacts/ContactDetail; Commons/Contacts/List |
| ContactBookServices | set#ContactFavorite |  | Commons/Contacts/ContactDetail; Commons/Contacts/List |
| ContactBookServices | find#ContactBookParties |  | Commons/Contacts/List |
| ContactBookServices | get#UserContactBooks |  | Commons/Contacts/Compare; Commons/Contacts/ContactDetail; Commons/Contacts/Duplicates; Commons/Contacts/Import/Options; Commons/Contacts/Import/Result; Commons/Contacts/List; Commons/QuickCreate; Commons/Settings/ContactBooks |
| ContactBookServices | store#ContactParty |  | Commons/Calendar/EventDetail; Commons/QuickCreate |
| ContactBookServices | create#PersonalContact |  | Commons/Calendar/EventDetail; Commons/QuickCreate |
| ContactBookServices | link#PersonalContactToDirectory |  | Commons/Contacts/Compare; Commons/Contacts/ContactDetail; Commons/Contacts/List |
| ContactBookServices | delete#Contacts |  | Commons/Contacts/ContactDetail; Commons/Contacts/List |
| ContactBookServices | filter#ContactAddresses |  | Comms/Settings/OutOfOffice (theme value STRT_EMAIL_CONTACT_SERVICE) |
| ContactImportServices | read#ContactFileText |  | Commons/Contacts/Import/Source; Projects/Time/Import/Source; Projects/WorkItems/Import/Source |
| ContactImportServices | parse#ContactFile | Marketing/Audiences/AudienceImport | Commons/Contacts/Import/Mapping; Commons/Contacts/Import/Source |
| ContactImportServices | preview#Contacts | Marketing/Audiences/AudienceImport | Commons/Contacts/Import/Preview |
| ContactImportServices | import#Contacts | Marketing/Audiences/AudienceImport | Commons/Contacts/Import/Result |
| ContactImportServices | export#Contacts | Admin/Data/DataExport | Commons/Contacts/ContactDetail; Commons/Contacts/List |
| DuplicateServices | mark#PartyNotDuplicate |  | Commons/Contacts/Compare; Commons/Contacts/Duplicates |
| PartyServices | get#ShellCounts |  | shell header (theme value STRT_SHELL_COUNTS_SERVICE) |

Added in the Projects build (Oct 21–22, 2026; impl-projects.md P1–P10), called by built screens:

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| CommunicationServices | get#ClientRecordVisibility |  | Projects/Home; Projects/Projects/MilestoneDetail; Projects/Requests/RequestDetail |

## Product (108 services, 7 added)

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| AssetServices | get#AssetDisplayInfo | Warehouse/Inventory/Adjustments; Warehouse/Inventory/AssetDetail; Shared/EquipmentDetail; Maintenance/Equipment/EquipmentDetail | — Warehouse/Inventory/Adjustments (AdjustmentServices.get#AdjustmentContext), AssetDetail (InventoryServices.get#AssetDetail) |
| AssetServices | get#AvailableInventory | Products/Products/Product360/Stock; Warehouse/Inventory/Availability; Purchasing/Replenishment/InventoryAvailability; CustomerService/Availability/InventoryAvailability; Shared/Product360; Shared/InventoryAvailability; Manufacturing/WorkOrders/NewWorkOrder; Manufacturing/BillsOfMaterials/BillOfMaterialsDetail/BillOfMaterialsExplosion; PASS:Shop/Products/ProductDetail | Shared/InventoryAvailability/Summary; Shared/Product360/Summary (kits); — Warehouse/Inventory/Availability/Summary: get#ProductStockTotals per facility |
| AssetServices | get#AvailableForOrder | Warehouse/Inventory/Availability; Shared/InventoryAvailability | — Warehouse/Inventory/Availability/Summary: get#ProductStockTotals per facility (InventoryServices.get#InventorySummary) |
| AssetServices | get#AvailableInventoryMulti | Warehouse/Inventory/Availability; Warehouse/Picking/PickLocationMoves; Purchasing/Replenishment/InventoryAvailability; CustomerService/Availability/InventoryAvailability; Shared/InventoryAvailability; PASS:Shop/Categories/CategoryDetail | — Warehouse/Inventory/Availability/Summary (get#ProductStockTotals per facility); Picking/PickLocationMoves (find#PickFaceReplenishment) |
| AssetServices | update#Asset | Warehouse/Inventory/AssetDetail; Shared/EquipmentDetail; Maintenance/Equipment/EquipmentDetail | Warehouse/Inventory/AssetDetail (through AssetRecordServices.update#AssetMetadata) |
| AssetServices | update#Asset | Warehouse/Inventory/AssetDetail; Shared/EquipmentDetail | Warehouse/Inventory/AssetDetail (through AssetRecordServices.update#AssetMetadata); Warehouse/QualityInspection (Release and Scrap set the status through dispose#Inspection, P8) |
| AssetServices | update#AssetAcquireCost | Shared/EquipmentDetail | Accounting/FixedAssets/EquipmentDetail (AssetBookServices.repair#AcquireCost) |
| AssetServices | update#ProductAcquireCost | Accounting/Inventory/InventoryValuation | — (not organization-scoped; Accounting/Inventory/InventoryValuation calls AssetBookServices.repair#ProductAcquireCost, impl-accounting F270) |
| AssetServices | update#AssetFromDetail |  |  |
| AssetServices | recalculate#AllAssetTotals |  |  |
| AssetServices | get#AssetPools | Warehouse/Settings/AssetPools | Warehouse/Settings/AssetPools/PoolDetail (the reservation preview, through AssetPoolServices.preview#AssetPoolReservations; the list is AssetPoolServices.find#AssetPools) |
| AssetServices | reserve#AssetsForOrder | Warehouse/Orders/OrderDetail; Warehouse/Shipping/ShipmentDetail; Shared/ShipmentDetail | — not called: reservation stays Mantle's order SECAs (OrderPlacedReserveAssets) under P3's facility default; OrderDetail, ShipmentDetail show it |
| AssetServices | checkReserve#AssetForOrderItem |  |  |
| AssetServices | reserve#AssetForOrderItem | Warehouse/Orders/OrderDetail; Warehouse/Shipping/ShipmentDetail; Shared/OrderDetail; Shared/ShipmentDetail; Sales/Orders/OrderDetail | (the expiry gate, behind WarehousePolicy expiryBlock: expired stock skipped, the shortfall named; impl-warehouse P5) |
| AssetServices | remove#OrderItemReservations | Shared/OrderDetail; Sales/Orders/OrderDetail |  |
| AssetServices | remove#OrderReservations |  |  |
| AssetServices | reduce#AssetReservation | Warehouse/Orders/OrderDetail; Warehouse/Shipping/ShipmentDetail; Shared/ShipmentDetail | — not offered: Warehouse/Orders/OrderDetail and ShipmentDetail show Reserved only; a held-stock disposition reduces it (Quality.js) |
| AssetServices | reReserve#Assets |  |  |
| AssetServices | reserve#IncreasedAsset |  |  |
| AssetServices | move#AssetReservation |  |  |
| AssetServices | move#ReservationsFromNonPickLocations | Warehouse/Picking/PickLocationMoves | not called: each reservation moves through the move guard (WarehouseTaskServices.move#Stock with its assetReservationId, PickFaceNeeds) |
| AssetServices | check#AssetReservations |  | (the guard, after a move carries a reservation onto held stock: StockPosting.js recheckReservations, F38) |
| AssetServices | check#AssetReservationValid |  |  |
| AssetServices | check#FacilityReservations | Warehouse/Settings/ReservationPolicies | Warehouse/Settings/ReservationPolicies/ReservationCheck (the preview, WarehousePolicyServices.preview#FacilityReservations, and the repair through WarehouseTaskServices.repair#FacilityReservations, which runs check#AssetReservationValid and reserve#IncreasedAsset per finding) |
| AssetServices | displace#AssetReservations |  |  |
| AssetServices | change#AssetQuantity |  |  |
| AssetServices | checkReserve#ProductAssets |  |  |
| AssetServices | issue#AssetReservation |  |  |
| AssetServices | issue#Asset |  | Warehouse/Transfers/TransferShipmentDetail (through issue#TransferStock, P15) |
| AssetServices | issue#AssetToWorkEffort | Warehouse/Inventory/MaterialIssueReceipt; Shared/MaterialIssueReceipt; Manufacturing/WorkOrders/WorkOrderDetail/MaterialIssueReceipt | Warehouse/Transfers/Repack (through repack#Asset, P6); Warehouse/Inventory/MaterialIssueReceipt (MaterialLines Issue, through issue#ProductionMaterial with issuanceFields: a new issuance, P16; beyond the line up to the ProductionPolicy scrap allowance, Manufacturing P4) |
| AssetServices | issue#AnyAssetToWorkEffort | Warehouse/Inventory/MaterialIssueReceipt; Shared/MaterialIssueReceipt; Manufacturing/WorkOrders/WorkOrderDetail/MaterialIssueReceipt | — Warehouse/Inventory/MaterialIssueReceipt (MaterialActionForm: pack#ShipmentAssembly for a kit, issue#ProductionMaterial for a run) |
| AssetServices | issue#AnyAssetForShipmentItemSource | Warehouse/Returns/SupplierReturnShipment | Warehouse/Returns/SupplierReturnShipment (Send back), through WarehouseTaskServices.issue#SupplierReturnStock with the new assetId |
| AssetServices | move#IssuancesToNewShipment |  |  |
| AssetServices | cancel#AssetIssuance | Warehouse/Inventory/MaterialIssueReceipt; Shared/MaterialIssueReceipt | — Warehouse/Inventory/MaterialIssueReceipt (ReturnUnusedForm: return#UnusedMaterial, a receipt at original cost, never a cancel) |
| AssetServices | update#AssetIssuedDate |  |  |
| AssetServices | receive#Asset | Warehouse/Handheld/Receive; Warehouse/Inventory/MaterialIssueReceipt; Warehouse/Receiving/Receive; Shared/MaterialIssueReceipt; Manufacturing/WorkOrders/WorkOrderDetail/MaterialIssueReceipt | Warehouse/Receiving/Receive (AdHocReceipt), through the guard: WarehouseTaskServices.receive#AdHocStock; Warehouse/Transfers/TransferShipmentDetail (through receive#TransferStock, with the issuance's cost and owner, P15); Warehouse/Inventory/MaterialIssueReceipt (Output Receive and Unused returns, through receive#ProductionOutput and return#UnusedMaterial, P16) |
| AssetServices | update#AssetAndReceipt |  |  |
| AssetServices | replace#AssetPartyAssignment | Maintenance/Equipment/EquipmentDetail; People/Employees/EquipmentDetail |  |
| AssetServices | move#Product | Warehouse/Handheld/Move; Warehouse/Transfers/Move | — (Move chooses an asset in MoveContents and moves it with move#Stock; impl-warehouse §4 P5) |
| AssetServices | moveVerify#Product |  |  |
| AssetServices | check#ScanLocation | Warehouse/Handheld/Move; Warehouse/Handheld/Putaway; Warehouse/Picking/PickLocationMoves; Warehouse/Receiving/Putaway; Warehouse/Transfers/Move | Warehouse/Transfers/Move, Warehouse/Handheld/Move, Warehouse/Receiving/Putaway and Warehouse/Handheld/Putaway (inside move#Asset; the scan resolves through AccessServices.resolve#Scan) |
| AssetServices | move#Asset | Warehouse/Handheld/Move; Warehouse/Handheld/Putaway; Warehouse/Inventory/ContainerDetail; Warehouse/Receiving/Putaway; Warehouse/Transfers/Move | Warehouse/Transfers/Move, Warehouse/Handheld/Move, Warehouse/Inventory/Assets and Availability (Relocate), Warehouse/Inventory/ContainerDetail, Warehouse/Receiving/Putaway and Warehouse/Handheld/Putaway (P9), through the guard: WarehouseTaskServices.move#Stock, relocate#Assets, attach#AssetToContainer, detach#AssetFromContainer, move#Container, putaway#Stock; Warehouse/Transfers/SubcontractShipmentDetail (through dispatch#SubcontractStock, P15) |
| AssetServices | record#PhysicalInventoryQuantity | Warehouse/Inventory/Adjustments | Warehouse/Inventory/Adjustments (through WarehouseTaskServices.adjust#Stock) |
| AssetServices | record#PhysicalInventoryChange | Warehouse/Inventory/Adjustments | Warehouse/Inventory/Adjustments (through adjust#Stock and scrap#Asset) |
| AssetServices | create#ProductAssetAdHoc |  |  |
| AssetServices | update#PhysicalInventoryDate | Warehouse/Counts/CountDetail | — Not used: post#Count sets the count's date before its lines post (P10) |
| EquipmentServices | create#Equipment | Maintenance/Equipment; Maintenance/Equipment/EquipmentImport |  |
| EquipmentServices | get#AssetMaintenanceNeeded |  |  |
| EquipmentServices | create#AssetMaintenance | Manufacturing/Quality/Downtime |  |
| EquipmentServices | create#AssetMaintenanceContent | Shared/RecordFiles; Maintenance/RecordFiles; Maintenance/Equipment/EquipmentDetail; Maintenance/WorkOrders/WorkOrderDetail | Shared/RecordFiles |
| EquipmentServices | update#AssetMaintenanceContent | Maintenance/RecordFiles; Maintenance/Equipment/EquipmentDetail; Maintenance/WorkOrders/WorkOrderDetail |  |
| EquipmentServices | save#AssetMaintenanceContentFile | Shared/RecordFiles |  |
| InventoryReportServices | get#InventoryProjectedInfo | Products/Products/Product360/Stock; Warehouse/Inventory/Availability; Purchasing/Replenishment/SupplyPlanning; CustomerService/Availability/InventoryAvailability; Shared/InventoryAvailability; Shared/SupplyPlanning; Insights/Dashboard; Insights/Panels/PanelDetail; Insights/ReportBuilder/Analysis; Insights/ManagementDigest | Shared/InventoryAvailability/Projection; Warehouse/Inventory/Availability/Projection (Shared/SupplyPlanning nets the same sources from the entities, impl-manufacturing P13) |
| InventoryReportServices | get#PriceHistoryInfo | Products/Pricing/PriceHistory | Products/Prices/PriceHistory |
| PriceServices | modify#ProductPrice | |  |
| PriceServices | get#ProductPriceByType |  |  |
| PriceServices | get#ProductPrice | Products/Pricing/PriceLists/PriceListDetail; Products/Pricing/PriceExplain; Purchasing/Suppliers/PriceExplain; Purchasing/Suppliers/SupplierPrices; PASS:Shop/Products/ProductDetail; PASS:Shop/Cart; PASS:Shop/Checkout; Commerce/Merchandising/PriceExplain; Commerce/Merchandising/PriceLists/PriceListDetail; Sales/Orders/OrderDetail; Sales/Agreements/CustomerPrices; Sales/Agreements/AgreementDetail; Sales/Agreements/PriceListDetail; Sales/Agreements/PriceExplain; Sales/Quotes/QuoteTemplateDetail | Shared/PriceExplain |
| PriceServices | get#OrderProductPrice | Sales/Orders/OrderDetail |  |
| ProductServices | find#ProductByIdValue | Products; Products/Products; Products/Units/Packaging; Products/Settings/IdentificationTypes | Products (guarded exact-ID palette) |
| ProductServices | clone#Product | Products/Products/Product360; Shared/Product360 |  |
| ProductServices | create#ProductFeature | Products/Features; Products/Products/Product360; Shared/Product360 |  |
| ProductServices | apply#ProductFeatures | Products/Features/FeatureDetail; Products/Products/Product360; Shared/Product360 |  |
| ProductServices | find#ProductFeatures |  |  |
| ProductServices | find#ProductFeatureGroups | Products/Products/VariantBuilder |  |
| ProductServices | find#ProductCategoryFeatures |  |  |
| ProductServices | get#ProductCategoryFeatureList |  |  |
| ProductServices | get#FeatureByIactnOrAll |  |  |
| ProductServices | find#VariantProduct |  |  |
| ProductServices | get#VariantProductsInfo | Products/Products/VariantBuilder |  |
| ProductServices | create#VariantProducts | Products/Products/VariantBuilder; Shared/Product360 | Products/Products/VariantBuilder; Products/Products/VariantBuilderTui |
| ProductServices | create#VariantProduct | Products/Products/VariantBuilder |  |
| ProductServices | delete#VariantProducts |  |  |
| ProductServices | delete#Product | Products/Products | Shared/Product360 (guarded unused-draft deletion) |
| ProductServices | add#ProductsToCategory | Products/Products |  |
| ProductServices | remove#ProductsFromCategory | Products/Products |  |
| ProductServices | add#FeatureToProducts | Products/Products |  |
| ProductServices | remove#FeatureFromProducts | Products/Products |  |
| ProductServices | create#ProductContent | Shared/RecordFiles; Products/Products/Product360; Products/Documents; Products/Documents/Translations; Shared/Product360 | Shared/RecordFiles; Shared/Product360/Documents |
| ProductServices | update#ProductContent | Products/Products/Product360; Products/Documents/DocumentDetail; Products/Documents/Translations; Shared/Product360 | Shared/Product360/Documents |
| ProductServices | save#ProductContentFile | Shared/RecordFiles |  |
| ProductServices | create#ProductCategoryContent | Shared/RecordFiles; Products/Categories/CategoryDetail/Content; Products/Documents/Translations | Shared/RecordFiles |
| ProductServices | update#ProductCategoryContent | Products/Categories/CategoryDetail/Content; Products/Documents/Translations |  |
| ProductServices | save#ProductCategoryContentFile | Shared/RecordFiles |  |
| ProductServices | get#ProductManualDocumentData | Products/Products/Product360; Products/Documents |  |
| PromotionServices | apply#Promotion |  |  |
| PromotionServices | apply#OrderPromotions | Shared/OrderDetail; PASS:Shop/Cart; PASS:Shop/Checkout |  |
| PromotionServices | add#OrderPromoCode | PASS:Shop/Cart; PASS:Shop/Checkout |  |
| PromotionServices | remove#OrderPromoCode | PASS:Shop/Cart; PASS:Shop/Checkout |  |
| PromotionServices | apply#NewCustomerDiscount |  |  |
| PromotionServices | apply#BuyGetDiscount |  |  |
| PromotionServices | apply#FlatDiscount |  |  |
| StoreServices | create#StoreShippingOption | Commerce/Settings/CheckoutSettings |  |
| StoreServices | get#StoreShippingOptions | PASS:Shop/Checkout |  |
| StoreServices | clone#ProductStore | Commerce/Stores/StoreDetail |  |
| StoreServices | format#UrlSlug | PRD-TAXONOMY; Commerce/Merchandising/CategoryDetail | Products/Categories/CategoryDetail/Identifiers (guarded preview before store) |
| StoreServices | generate#UrlSlugFromProductName | Products/Products/Product360; Shared/Product360; Commerce/Merchandising/Product360 |  |
| StoreServices | generate#UrlSlugFromCategoryName | Products/Categories/CategoryDetail; Commerce/Merchandising/CategoryDetail |  |
| SubscriptionServices | init#SubscriptionResource |  |  |
| SubscriptionServices | renew#SubscriptionResourceAccess |  |  |
| SubscriptionServices | revoke#SubscriptionResourceAccess |  |  |
| SubscriptionServices | restore#SubscriptionResourceAccess |  |  |
| SubscriptionServices | destroy#SubscriptionResource |  |  |
| SubscriptionServices | fulfill#OrderSubscriptions |  |  |
| SubscriptionServices | fulfill#OrderPartSubscriptions |  |  |
| SubscriptionServices | fulfill#ProductSubscriptionResource |  |  |
| TenantSubscriptionServices | init#Tenant |  |  |
| TenantSubscriptionServices | revoke#TenantAccess |  |  |
| TenantSubscriptionServices | restore#TenantAccess |  |  |
| TenantSubscriptionServices | destroy#Tenant |  |  |

### Added in the Products build

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| ProductServices | get#CatalogOwnerScope | PRD-ACCESS | Products; Products/Products/List; Products/Products/Product360; Products/Categories/CategoryDetail; shared catalog record visibility |
| ProductServices | check#ProductUsable | PRD-LIFECYCLE | OrderServices create#OrderItem and add#OrderProductQuantity (through check#OrderProductUsable) |
| ProductServices | check#OrderProductUsable | PRD-LIFECYCLE | Both order entry paths; explicit sale/purchase direction |
| ProductServices | store#ProductIdentifier | PRD-IDENTIFIERS | Shared/Product360/Identifiers; internal/scoped clone IDs |
| ProductServices | store#KitComponent | PRD-KITS | Shared/Product360/KitComponents |
| ProductServices | store#FeatureInteraction | PRD-VARIANTS | Products/Features/FeatureInteractions (guarded pair/scope/conflict store) |
| ProductServices | preview#FeatureInteractions | PRD-VARIANTS | Products/Features/FeatureInteractions; FeatureDetail/Interactions |

### BOSS catalog application services (P1–P3)

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| ironstone.products.CatalogServices | get#CatalogAccess | PRD-ACCESS; P2 | Products owner/capability boundary |
| ironstone.products.CatalogServices | get#CatalogRecord | PRD-ACCESS; P2 | All catalog record mounts |
| ironstone.products.CatalogServices | find#Products | PRD-ACCESS; P2 | Products/Products/List |
| ironstone.products.CatalogServices | search#ProductIds | PRD-ACCESS; P2 | Products exact-ID palette |
| ironstone.products.CatalogServices | search#Catalog | PRD-ACCESS; P2 | Products text/party-code palette |
| ironstone.products.CatalogServices | store#Product | PRD-ACCESS; P2 | Products/Products/NewProduct; Shared/Product360/Summary |
| ironstone.products.CatalogServices | transition#ProductStatus | PRD-ACCESS; P2 | Shared/Product360 lifecycle actions |
| ironstone.products.CatalogServices | get#ProductDetail | PRD-ACCESS; P2 | Shared/Product360 and its catalog tabs |
| ironstone.products.CatalogServices | store#CatalogRow | PRD-ACCESS; P2 | Shared/Product360 catalog row editors |
| ironstone.products.CatalogServices | store#ProductContent | PRD-ACCESS; P2 | Shared/Product360/Documents |
| ironstone.products.CatalogServices | clone#Product | PRD-ACCESS; P2 | Shared/Product360 selected-section clone |
| ironstone.products.CatalogServices | delete#UnusedDraft | PRD-ACCESS; P2 | Shared/Product360 guarded deletion |
| ironstone.products.CatalogServices | bulk#Products | PRD-ACCESS; P2 | Products/Products/List fixed selection |
| ironstone.products.CatalogServices | get#CatalogSummary | PRD-ACCESS; P2 | Products/Home |
| ironstone.products.CatalogServices | get#CatalogOptions | PRD-ACCESS; P2 | Catalog form options |
| ironstone.products.CatalogServices | search#CatalogChoices | PRD-ACCESS; P2 | Catalog server-search lookups |
| mantle.product.ProductServices | get#CatalogSettings | PRD-SETTINGS | Products/Settings |
| mantle.product.ProductServices | store#CatalogSettings | PRD-SETTINGS | Products/Settings |
| ironstone.products.CategoryServices | find#Categories | PRD-TAXONOMY; PRD-ACCESS; P3 | Products/Categories/List |
| ironstone.products.CategoryServices | get#CategoryAncestors | PRD-TAXONOMY; PRD-ACCESS; P3 | Products/Categories/List tree ancestors |
| ironstone.products.CategoryServices | store#Category | PRD-TAXONOMY; PRD-ACCESS; P3 | Products/Categories/NewCategory; CategoryDetail/Summary |
| ironstone.products.CategoryServices | store#CategoryParent | PRD-TAXONOMY; PRD-ACCESS; P3 | Products/CategoryDetail/Parents |
| ironstone.products.CategoryServices | move#CategoryParent | PRD-TAXONOMY; PRD-ACCESS; P3 | Products/Categories/List; CategoryDetail/Parents |
| ironstone.products.CategoryServices | expire#CategoryParent | PRD-TAXONOMY; PRD-ACCESS; P3 | Products/CategoryDetail/Parents |
| ironstone.products.CategoryServices | get#CategoryDetail | PRD-TAXONOMY; PRD-ACCESS; P3 | Products/CategoryDetail tabs |
| ironstone.products.CategoryServices | store#CategoryRow | PRD-TAXONOMY; PRD-ACCESS; P3 | Products/CategoryDetail relationships/identifiers |
| ironstone.products.CategoryServices | delete#UnusedCategory | PRD-TAXONOMY; PRD-ACCESS; P3 | Products/CategoryDetail guarded deletion |
| ironstone.products.CategoryServices | preview#CategorySlug | PRD-TAXONOMY; PRD-ACCESS; P3 | Products/CategoryDetail/Identifiers |
| ironstone.products.CategoryServices | get#CategoryOptions | PRD-TAXONOMY; PRD-ACCESS; P3 | Products/Category/tag form options |
| ironstone.products.FeatureServices | find#Features | PRD-TAXONOMY; PRD-ACCESS; P3 | Products/Features/List |
| ironstone.products.FeatureServices | store#Feature | PRD-TAXONOMY; PRD-ACCESS; P3 | Products/Features/NewFeature; FeatureDetail/Summary; Product360 atomic create/apply |
| ironstone.products.FeatureServices | get#FeatureDetail | PRD-TAXONOMY; PRD-ACCESS; P3 | Products/FeatureDetail tabs |
| ironstone.products.FeatureServices | delete#UnusedFeature | PRD-TAXONOMY; PRD-ACCESS; P3 | Products/FeatureDetail guarded deletion |
| ironstone.products.FeatureServices | find#FeatureGroups | PRD-TAXONOMY; PRD-ACCESS; P3 | Products/Features/FeatureGroups/List |
| ironstone.products.FeatureServices | store#FeatureGroup | PRD-TAXONOMY; PRD-ACCESS; P3 | Products/FeatureGroups/NewGroup; FeatureGroupDetail/Summary |
| ironstone.products.FeatureServices | get#FeatureGroupDetail | PRD-TAXONOMY; PRD-ACCESS; P3 | Products/FeatureGroupDetail tabs |
| ironstone.products.FeatureServices | delete#UnusedFeatureGroup | PRD-TAXONOMY; PRD-ACCESS; P3 | Products/FeatureGroupDetail guarded deletion |
| ironstone.products.FeatureServices | store#FeatureRow | PRD-TAXONOMY; PRD-ACCESS; P3 | Products/FeatureDetail and FeatureGroupDetail relationships |
| ironstone.products.FeatureServices | find#FeatureInteractions | PRD-TAXONOMY; PRD-ACCESS; P3 | Products/FeatureInteractions |
| ironstone.products.FeatureServices | store#FeatureInteraction | PRD-TAXONOMY; PRD-ACCESS; P3 | Products/FeatureInteractions guarded writer |
| ironstone.products.FeatureServices | preview#FeatureInteractions | PRD-TAXONOMY; PRD-ACCESS; P3 | Products/FeatureInteractions preview |
| ironstone.products.FeatureServices | get#FeatureOptions | PRD-TAXONOMY; PRD-ACCESS; P3 | Products/Feature/group form options |

## Request (12 services, 3 added)

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| RequestServices | create#Request | Commons/QuickCreate; Commons/Requests; Comms/Inbox; Comms/Chat; Projects/Requests; Warehouse/Transfers/StockRequests; Purchasing/Requests; Purchasing/Requests/RequestDetail; CustomerService/Cases/NewCase; Manufacturing/Quality/Downtime; Maintenance/Requests; Maintenance/WorkOrders/WorkOrderDetail; Sales/Quotes/QuoteRequests | Commons/QuickCreate; Commons/Requests/List; Commons/Tasks/TaskDetail; Projects/Requests/List; Projects/WorkItems/WorkItemDetail; Warehouse/Transfers/StockRequests and NewStockRequest (RqtInventory, validated: the facility in scope; P15) |
| RequestServices | update#Request | Commons/Requests/RequestDetail; Projects/Requests; Projects/Requests/RequestDetail; Purchasing/Requests/RequestDetail; CustomerService/Cases/CaseDetail; Shared/RequestDetail; Sales/Quotes/QuoteRequestDetail | Commons/Requests/RequestDetail; Projects/Requests/List; Projects/Requests/RequestDetail; Warehouse/Transfers/RequestDetail (Submit, Complete, Cancel; approve#InventoryRequest, P15) |
| RequestServices | create#ContactRequest | Projects/Requests/Intake |  |
| RequestServices | create#ContactRequestReCaptcha | Projects/Requests/Intake |  |
| RequestServices | replace#RequestParty | Commons/Requests/RequestDetail; Projects/Requests; Projects/Requests/RequestDetail; Purchasing/Requests/RequestDetail; CustomerService/Cases/CaseDetail; CustomerService/Cases/NewCase; Shared/RequestDetail | Commons/Requests/RequestDetail; Projects/Requests/List; Projects/Requests/RequestDetail |
| RequestServices | add#RequestComment | Commons/Requests/RequestDetail; Projects/Requests/RequestDetail; CustomerService/Cases/CaseDetail | Commons/Requests/RequestDetail; Projects/Requests/List; Projects/Requests/RequestDetail |
| RequestServices | update#RequestComment | Commons/Requests/RequestDetail; Projects/Requests/RequestDetail; CustomerService/Cases/CaseDetail | Shared/Chatter |
| RequestServices | delete#RequestComment | Commons/Requests/RequestDetail; Projects/Requests/RequestDetail; CustomerService/Cases/CaseDetail | Shared/Chatter |
| RequestServices | get#RequestContentLocation |  |  |
| RequestServices | create#RequestContent | Commons/Requests/RequestDetail; Projects/Requests/RequestDetail; Shared/RecordFiles; CustomerService/Cases/CaseDetail; Sales/Quotes/QuoteRequestDetail | Shared/RecordFiles |
| RequestServices | update#RequestContent | Projects/Requests/RequestDetail; CustomerService/Cases/CaseDetail; Sales/Quotes/QuoteRequestDetail |  |
| RequestServices | save#RequestContentFile | Commons/Requests/RequestDetail; Shared/RecordFiles |  |

Added in the drawers-commons build (Oct 18–19, 2026), called by built screens:

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| RequestServices | get#UserTodayRequests |  | Commons |
| RequestServices | link#RequestRecord | Projects/Requests/RequestDetail; Purchasing/Requests/RequestDetail; CustomerService/Cases/CaseDetail; CustomerService/Cases/NewCase; CustomerService/Returns/WarrantyAssessment; Shared/RequestDetail; Manufacturing/Quality/Downtime; Maintenance/Requests/RequestDetail; Maintenance/WorkOrders/WorkOrderDetail; Sales/Quotes/QuoteRequestDetail | Commons/QuickCreate; Commons/Requests/RequestDetail; Projects/Requests/RequestDetail |
| RequestServices | unlink#RequestRecord | Projects/Requests/RequestDetail; Purchasing/Requests/RequestDetail; CustomerService/Cases/CaseDetail; Shared/RequestDetail | Commons/Requests/RequestDetail; Projects/Requests/RequestDetail |

Added in the Projects build (Oct 21–22, 2026; impl-projects.md P1–P10), called by built screens:

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| RequestServices | convert#RequestToProject |  | Projects/Requests/RequestDetail |
| RequestServices | create#IntakeRequest | PASS:Support/NewCustomerCase | RequestIntake |
| RequestServices | create#IntakeToken | CustomerService/Settings/ChannelRouting | Projects/Projects/ProjectDetail/Settings; Projects/Requests/List |
| RequestServices | get#IntakeSettings | CustomerService/Settings/ChannelRouting | Projects/Projects/ProjectDetail/Settings; Projects/Requests/List; Projects/Settings/Intake |
| RequestServices | make#RequestWorkItem |  | Projects/Requests/List; Projects/Requests/RequestDetail |
| RequestServices | remove#IntakeToken | CustomerService/Settings/ChannelRouting | Projects/Projects/ProjectDetail/Settings; Projects/Requests/List |

## Sales (8 services)

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| AccountServices | create#Account | Sales/Accounts/Accounts; Sales/Pipeline/Leads |  |
| AccountServices | create#Contact | Sales/Accounts/Contacts; Sales/Accounts/Customer360; Sales/Accounts/ContactDetail |  |
| AccountServices | add#Contact | Sales/Accounts/Contacts; Sales/Accounts/Customer360; Sales/Accounts/ContactDetail |  |
| AccountServices | delete#Contact | Sales/Accounts/Contacts; Sales/Accounts/Customer360; Sales/Accounts/ContactDetail |  |
| SalesReportServices | get#SalesOrderSummary | Accounting/Reports/SalesAnalysis; Sales/Reports/SalesSummary; Insights/Dashboard; Insights/Panels/PanelDetail; Insights/ReportBuilder/Analysis; Insights/ManagementDigest; Commerce/Home; Commerce/Reports/OnlineSales | — (replaced by mantle.sales.SalesReportServices.run#SalesAnalysis on Accounting/Reports/SalesAnalysis) |
| SalesReportServices | get#SalesInvoiceSummary | Sales/Reports/SalesSummary; Insights/Dashboard; Insights/Panels/PanelDetail; Insights/ReportBuilder/Analysis; Insights/ManagementDigest; Commerce/Home; Commerce/Reports/OnlineSales |  |
| SalesReportServices | get#SalesTopProduct | Sales/Reports/SalesSummary; Insights/Dashboard; Insights/Panels/PanelDetail; Insights/ReportBuilder/Analysis; Insights/ManagementDigest; Commerce/Home; Commerce/Reports/OnlineSales | organization filter (vendorPartyIds); Accounting/Reports/SalesAnalysis reads the records (run#SalesAnalysis) |
| SalesReportServices | get#InvoicesByCustomerClass | Sales/Reports/SalesSummary; Insights/Dashboard; Insights/Panels/PanelDetail; Insights/ReportBuilder/Analysis; Insights/ManagementDigest | organization filter (fromPartyIds); Accounting/Reports/SalesAnalysis reads the records (run#SalesAnalysis) |

## Search (1 service)

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| UniversalSearchServices | search#Universal | Commons/Search; Comms/Inbox | Commons; Commons/Knowledge; Commons/Notes; Commons/Search; Comms/Chat; Comms/Inbox/Mail; Comms/Inbox/MessageDetail; Projects/Projects/ProjectDetail/Docs; Projects/Requests/RequestDetail |

## Shipment (68 services)

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| CarrierServices | get#OrderShippingRate |  |  |
| CarrierServices | get#ShippingRatesBulk |  | Warehouse/Shipping/Ship (RateOptions), Warehouse/Locations/Carriers (CarrierTest), through WarehouseTaskServices.get#ShipmentRates (the test carrier implements it, P13) |
| CarrierServices | get#AutoPackageInfo |  |  |
| CarrierServices | get#ShippingRate | Warehouse/Shipping/Ship | Warehouse/Shipping/Ship (RateOptions), through WarehouseTaskServices.get#ShipmentRates when a gateway has no bulk rate (P13) |
| CarrierServices | request#ShippingLabels |  | Warehouse/Shipping/Ship (Labels), through request#ShipmentLabels on the recorded gateway path (the test carrier implements it, P13) |
| CarrierServices | refund#ShippingLabels |  | Warehouse/Shipping/Ship (Refund), through refund#ShipmentLabels (P13) |
| CarrierServices | track#ShippingLabels |  | Warehouse/Shipping/PackageTracking (Refresh), through track#ShipmentLabels (P13) |
| CarrierServices | validate#ShippingPostalAddress |  | Warehouse/Shipping/Ship (Check address), through validate#PostalAddress (P13) |
| CarrierServices | validate#PostalAddress | Warehouse/Locations/Carriers; Warehouse/Shipping/Ship; PASS:Shop/Checkout; PASS:Shop/Account/Addresses | Warehouse/Shipping/Ship (ShipmentAddress, Check address) (P13) |
| CarrierServices | validate#PostalAddressBulk |  |  |
| CarrierServices | calculate#OrderShipping |  |  |
| CarrierServices | calculate#OrderPartShipping |  |  |
| CarrierServices | get#OrderShippingRatesBulk | PASS:Shop/Checkout |  |
| CarrierServices | get#ShipmentRates |  |  |
| CarrierServices | request#ShipmentLabels | Warehouse/Shipping/Ship | Warehouse/Shipping/Ship (Labels, Return labels), through WarehouseTaskServices.request#PackageLabels; Customer Service return labels through request#ReturnLabel (P13, F331) |
| CarrierServices | get#ShipLabelMarkup |  |  |
| CarrierServices | refund#ShipmentLabels | Warehouse/Shipping/Ship | Warehouse/Shipping/Ship (Refund), through WarehouseTaskServices.refund#PackageLabels (P13) |
| CarrierServices | track#ShipmentLabels | Warehouse/Shipping/PackageTracking; Warehouse/Shipping/Ship | Warehouse/Shipping/PackageTracking (Refresh tracking), through WarehouseTaskServices.track#PackageLabels (P13) |
| CarrierServices | get#ShipmentGatewayDetails |  | Warehouse/Shipping/Ship, through the shipping entry points and ShippingServices.get#ShipContext (P13) |
| CarrierServices | remove#ShipmentLabelInfo |  | Warehouse/Shipping/Ship (a refunded label replaced), through request#PackageLabels (P13) |
| CarrierServices | remove#ShipmentReturnLabelInfo |  |  |
| CarrierServices | get#ShipmentPackageRequiresInsurance |  |  |
| CarrierServices | get#GeneralPackageRequiresInsurance |  |  |
| CarrierServices | get#OrderShippingRateLocal | Warehouse/Shipping/Ship | Warehouse/Shipping/Ship (RateOptions local rules), through WarehouseTaskServices.get#ShipmentRates (P13) |
| ShipmentInfoServices | get#ShipmentDisplayInfo | Warehouse/Handheld/Receive; Warehouse/Receiving/ReceiptDetail; Warehouse/Receiving/Receive; Warehouse/Returns/ReturnReceipt; Warehouse/Returns/SupplierReturnShipment; Warehouse/Shipping/ShipmentDetail; Warehouse/Transfers/TransferShipmentDetail; Shared/ShipmentDetail | — each mount reads its own context (get#ReceiveContext, get#ReceiptDetail, get#ReturnShipmentDetail, get#OutboundDetail, get#TransferDetail) |
| ShipmentInfoServices | get#ShipmentContactInfo | Warehouse/Receiving/ReceiptDetail; Warehouse/Returns/ReturnReceipt; Warehouse/Returns/SupplierReturnShipment; Warehouse/Shipping/Ship; Warehouse/Shipping/ShipmentDetail; Warehouse/Transfers/TransferShipmentDetail; Shared/ShipmentDetail | — Warehouse/Shipping/Ship (ShipConfirm, ValidateAddress) reads the addresses in ShippingServices.get#ShipContext |
| ShipmentInfoServices | get#ShipmentShippingOptions | Warehouse/Receiving/ReceiptDetail; Warehouse/Returns/ReturnReceipt; Warehouse/Returns/SupplierReturnShipment; Warehouse/Shipping/ShipmentDetail; Warehouse/Transfers/TransferShipmentDetail | — Warehouse/Shipping/Ship: carrier methods in ShippingServices.get#ShipContext, rates in get#ShipmentRates; the detail mounts edit none |
| ShipmentInfoServices | get#ShipmentLoadPickInfo | Warehouse/Handheld/Pick; Warehouse/Picking/Pick | — not called: Pick reads its lines with the reservations and short picks (PickingServices.get#PickContext) |
| ShipmentInfoServices | get#ShipmentPickPackInfo |  |  |
| ShipmentServices | create#Shipment | Warehouse/Receiving/Receipts; Warehouse/Shipping/Shipments; Warehouse/Transfers/Transfers | Warehouse/Transfers/Transfers (through create#Transfer, P15) |
| ShipmentServices | update#ShipmentAndRouteSegment | Warehouse/Receiving/ReceiptDetail; Warehouse/Returns/ReturnReceipt; Warehouse/Returns/SupplierReturnShipment; Warehouse/Shipping/ShipmentDetail; Warehouse/Transfers/TransferShipmentDetail; Shared/ShipmentDetail | — no header edit: Warehouse/Shipping/Ship's BuyRate sets carrier and method on the route segment (request#PackageLabels) |
| ShipmentServices | create#ShipmentItem | Warehouse/Receiving/ReceiptDetail; Warehouse/Returns/ReturnReceipt; Warehouse/Returns/SupplierReturnShipment; Warehouse/Shipping/ShipmentDetail; Warehouse/Transfers/TransferShipmentDetail; Shared/ShipmentDetail | Warehouse/Transfers/Transfers (through create#Transfer, P15) |
| ShipmentServices | update#ShipmentItem | Warehouse/Receiving/ReceiptDetail; Warehouse/Returns/ReturnReceipt; Warehouse/Returns/SupplierReturnShipment; Warehouse/Shipping/ShipmentDetail; Warehouse/Transfers/TransferShipmentDetail; Shared/ShipmentDetail | Warehouse/Receiving/ReceiptDetail (Finish receipt, backorder), through WarehouseTaskServices.close#ReceiptRemainder |
| ShipmentServices | ensure#ShipmentItemQuantityRemaining | Shared/ShipmentDetail |  |
| ShipmentServices | create#ShipmentPackage | Warehouse/Handheld/Pack; Warehouse/Shipping/Pack; Shared/ShipmentDetail | Warehouse/Shipping/Pack (Add package) through WarehouseTaskServices.edit#ShipmentPackage |
| ShipmentServices | update#ShipmentPackageAndRouteSeg | Warehouse/Handheld/Pack; Warehouse/Shipping/Pack; Shared/ShipmentDetail | Warehouse/Shipping/Pack (EditPackage, Weigh) through edit#ShipmentPackage (the package fields); Warehouse/Shipping/Ship (ManualCarrier) through record#ManualTracking (P13) |
| ShipmentServices | delete#ShipmentPackage | Warehouse/Handheld/Pack; Warehouse/Shipping/Pack; Shared/ShipmentDetail | Warehouse/Shipping/Pack (Remove) through edit#ShipmentPackage |
| ShipmentServices | add#ItemToPackage | Warehouse/Handheld/Pack; Warehouse/Shipping/Pack; Shared/ShipmentDetail | Warehouse/Shipping/Pack (PackageContents: Move) through edit#ShipmentPackage; inside the pack services |
| ShipmentServices | update#ShipmentPackageContent | Warehouse/Handheld/Pack; Warehouse/Shipping/Pack; Shared/ShipmentDetail | Warehouse/Shipping/Pack (Move, Reopen) through edit#ShipmentPackage and reopen#ShipmentPackage |
| ShipmentServices | reset#ShipmentPackage | Warehouse/Handheld/Pack; Warehouse/Shipping/Pack | — not built (P12): Warehouse/Shipping/Pack's Move and Remove cover it (edit#ShipmentPackage) |
| ShipmentServices | ship#OrderPart |  |  |
| ShipmentServices | create#OrderPartShipment | Warehouse/Orders/OrderDetail; Warehouse/Receiving/Receipts; Warehouse/Shipping/Shipments; Purchasing/Receiving/Receipts; Shared/OrderDetail; Sales/Orders/OrderDetail | Warehouse/Receiving/Receipts and NewReceipt (NewReceipt), through WarehouseTaskServices.ensure#PurchaseReceipt |
| ShipmentServices | add#OrderPartToShipment | Warehouse/Orders/OrderDetail; Shared/OrderDetail; Sales/Orders/OrderDetail | — Warehouse/Orders/OrderDetail (Create shipment: a new shipment per part, create#OutgoingShipment over create#OrderPartShipment) |
| ShipmentServices | pickMove#ProductToContainer | Warehouse/Inventory/ContainerDetail | — Warehouse/Picking/Pick (PickScan into a pick container: pick#ShipmentStock over pickMove#ShipmentProduct); ContainerDetail attaches only |
| ShipmentServices | pickMove#ShipmentProduct | Warehouse/Handheld/Pick; Warehouse/Picking/Pick; Shared/ShipmentDetail | Warehouse/Picking/Pick and Handheld/Pick (PickScan) through WarehouseTaskServices.pick#ShipmentStock, for one line (its new shipmentItemSourceId and pickedMoveList) |
| ShipmentServices | get#ShipmentProductByScan | Warehouse/Handheld/Pick; Warehouse/Picking/Pick; Shared/ShipmentDetail | Warehouse/Picking/Pick (inside pickMove#ShipmentProduct; the handheld product scan must be the line's product) |
| ShipmentServices | pack#ShipmentProductScan | Warehouse/Handheld/Pack; Warehouse/Shipping/Pack; Shared/ShipmentDetail | Warehouse/Shipping/Pack and Warehouse/Handheld/Pack (PackScan) through WarehouseTaskServices.pack#ShipmentStock |
| ShipmentServices | pack#ShipmentProduct | Warehouse/Handheld/Pack; Warehouse/Shipping/Pack | Warehouse/Shipping/Pack (PackScan by product) through pack#ShipmentStock |
| ShipmentServices | pack#ShipmentItemSource | Warehouse/Handheld/Pack; Warehouse/Shipping/Pack; Shared/ShipmentDetail | Warehouse/Shipping/Pack (PackLines: Pack) through pack#ShipmentStock |
| ShipmentServices | pack#ShipmentAssemblyComponent | Warehouse/Handheld/Pack; Warehouse/Shipping/Pack; Shared/ShipmentDetail; Shared/MaterialIssueReceipt | Warehouse/Shipping/Pack (PackAssembly); Warehouse/Inventory/MaterialIssueReceipt (Pack component) through WarehouseTaskServices.pack#ShipmentAssembly |
| ShipmentServices | unpack#ShipmentItemIssuance | Warehouse/Handheld/Pack; Warehouse/Shipping/Pack; Shared/ShipmentDetail | Warehouse/Shipping/Pack (Reopen) through WarehouseTaskServices.reopen#ShipmentPackage, with its new quantity |
| ShipmentServices | create#ShipmentAutoPackages | Warehouse/Handheld/Pack; Warehouse/Shipping/Pack | — §7: automatic package suggestions (F299); Warehouse/Shipping/Pack's AddPackage and Move instead |
| ShipmentServices | receive#EntireShipment | Warehouse/Handheld/Receive; Warehouse/Receiving/ReceiptDetail; Warehouse/Receiving/Receive; Warehouse/Returns/ReturnReceipt; Warehouse/Transfers/TransferShipmentDetail; Purchasing/Receiving/ShipmentDetail; Shared/ShipmentDetail | — (not called: "Receive all as expected" is WarehouseTaskServices.receive#ExpectedShipment through the receive guard, F37, impl-warehouse §4); never for a transfer: F37, receive#TransferStock sums issuances and receipts apart (P15) |
| ShipmentServices | receive#ShipmentProduct | Warehouse/Handheld/Receive; Warehouse/Receiving/ReceiptDetail; Warehouse/Receiving/Receive; Warehouse/Returns/ReturnReceipt; Warehouse/Transfers/TransferShipmentDetail; Purchasing/Receiving/ShipmentDetail; Shared/ShipmentDetail | Warehouse/Receiving/Receive and Warehouse/Handheld/Receive (ReceiveLine, GenerateTracking), Warehouse/Receiving/ReceiptDetail (Receive all as expected), through the guard: WarehouseTaskServices.receive#ShipmentStock |
| ShipmentServices | convert#ProductBoxQuantity |  |  |
| ShipmentServices | get#ShipmentPackageWeight | Warehouse/Handheld/Pack; Warehouse/Shipping/Pack | Warehouse/Shipping/Pack (Weigh) through edit#ShipmentPackage |
| ShipmentServices | print#ShipmentLabels | Warehouse/Locations/Printers; Warehouse/Shipping/Ship; Shared/ShipmentDetail | — Warehouse/Shipping/Ship (Print labels, Reprint) and Warehouse/Locations/Printers (TestPrinter): PrintServices.dispatch#Document |
| ShipmentServices | complete#ShipmentPack | Warehouse/Handheld/Pack; Warehouse/Shipping/Pack | Warehouse/Shipping/Pack (CompletePack) through WarehouseTaskServices.complete#Pack, getLabels and getReturnLabels false |
| ShipmentServices | pack#Shipment |  | Warehouse/Returns/SupplierReturnShipment (Ship), through WarehouseTaskServices.ship#SupplierReturn |
| ShipmentServices | ship#Shipment | Warehouse/Shipping/Ship | Warehouse/Transfers/TransferShipmentDetail (through ship#Transfer, P15); Warehouse/Returns/SupplierReturnShipment (Ship), through WarehouseTaskServices.ship#SupplierReturn; Warehouse/Shipping/Ship (ShipConfirm), through WarehouseTaskServices.ship#OutgoingShipment (P13) |
| ShipmentServices | deliver#Shipment | Warehouse/Shipping/PackageTracking | Warehouse/Receiving/ReceiptDetail (Finish receipt, Receive all as expected), through WarehouseTaskServices.close#ReceiptRemainder and receive#ExpectedShipment; Warehouse/Transfers/TransferShipmentDetail (through receive#TransferStock when nothing is left in transit, P15); Warehouse/Shipping/PackageTracking (RecordDelivery), through record#PackageDelivery and the ShipmentPackageDeliveredCheckShipment SECA (P13) |
| ShipmentServices | checkSet#ShipmentDeliveredByPackages |  | Warehouse/Shipping/PackageTracking (RecordDelivery), by its SECA (P13) |
| ShipmentServices | cancel#Shipment | Warehouse/Receiving/ReceiptDetail; Warehouse/Returns/ReturnReceipt; Warehouse/Returns/SupplierReturnShipment; Warehouse/Shipping/ShipmentDetail; Warehouse/Transfers/TransferShipmentDetail | Warehouse/Receiving/ReceiptDetail (FinishReceipt: a receipt backordered with nothing received is cancelled, close#ReceiptRemainder) |
| ShipmentServices | reduce#QuantitiesToHandled |  |  |
| ShipmentServices | send#ShipmentStoreEmail | Warehouse/Receiving/ReceiptDetail; Warehouse/Returns/ReturnReceipt; Warehouse/Returns/SupplierReturnShipment; Warehouse/Shipping/ShipmentDetail; Warehouse/Transfers/TransferShipmentDetail; Shared/ShipmentDetail | — not built: the Warehouse mounts send no shipment email (P7: the receipt documents print instead) |
| ShipmentServices | create#ShipmentContent | Shared/RecordFiles; Warehouse/Receiving/ReceiptDetail; Warehouse/Returns/ReturnReceipt; Warehouse/Returns/SupplierReturnShipment; Warehouse/Shipping/ShipmentDetail; Warehouse/Transfers/TransferShipmentDetail; Shared/ShipmentDetail | Shared/RecordFiles; Warehouse/Receiving/ReceiptDetail, Shipping/ShipmentDetail, Returns/ReturnReceipt, SupplierReturnShipment, Transfers/TransferShipmentDetail (Files) |
| ShipmentServices | update#ShipmentContent | Warehouse/Receiving/ReceiptDetail; Warehouse/Returns/ReturnReceipt; Warehouse/Returns/SupplierReturnShipment; Warehouse/Shipping/ShipmentDetail; Warehouse/Transfers/TransferShipmentDetail; Shared/ShipmentDetail | — Files on the Warehouse shipment mounts (Shared/RecordFiles: a new version updates the entity, entity-auto) |
| ShipmentServices | save#ShipmentContentFile | Shared/RecordFiles |  |

## Work (104 services, 31 added)

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| EventServices | get#FullCalendarData | Commons/Home; Commons/Calendar; Commons/Calendar/Schedules; Commons/Calendar/Schedules/ResourceDetail; Comms/Home; Comms/Calls; Projects/Projects/ProjectDetail/Plan/Calendar; Maintenance/Scheduling/ResourceCalendar; Marketing/Calendar | Commons/Calendar; Commons/Calendar/Schedules; Commons/Calendar/Schedules/ResourceDetail; Commons/Contacts/ContactDetail; Commons/Contacts/List; Commons/Home; Comms/Home; Projects/Projects/ProjectDetail/Plan/Calendar |
| EventServices | create#Event | Commons/QuickCreate; Commons/Calendar; Commons/Calendar/EventDetail; Commons/Calendar/Schedules; Commons/Calendar/Schedules/ResourceDetail; Comms/Inbox; Comms/Chat; Maintenance/Scheduling/ResourceCalendar; Marketing/Calendar; Marketing/Events; Marketing/Events/EventDetail; Marketing/QuickCreate | Commons/Calendar; Commons/Calendar/Schedules; Commons/Calendar/Schedules/ResourceDetail; Commons/QuickCreate; Shared/Chatter; Projects/Projects/ProjectDetail/Plan/Calendar |
| EventServices | get#NextBusinessDay | People/Time/LeaveRequests |  |
| EventServices | get#FutureBusinessDay | Projects/WorkItems/Timeline; People/Time/LeaveRequests |  |
| GitServices | add#ProjectRepository | Projects/Projects/NewProject; Projects/Projects/ProjectDetail/Code; Projects/Code/Repositories; Projects/Code/RepositoryDetail/Settings | Projects/Code/Repositories; Projects/Code/RepositoryDetail/Settings; Projects/Projects/NewProject/Modules; Projects/Projects/ProjectDetail/Code |
| GitServices | remove#ProjectRepository | Projects/Projects/ProjectDetail/Code; Projects/Code/RepositoryDetail/Settings | Projects/Code/RepositoryDetail/Settings; Projects/Projects/ProjectDetail/Code |
| GitServices | create#ProjectRepository | Projects/Projects/NewProject; Projects/Projects/ProjectDetail/Code; Projects/Code/Repositories | Projects/Code/Repositories; Projects/Projects/NewProject/Modules; Projects/Projects/ProjectDetail/Code |
| GitServices | get#RepositoryProjects | Projects/Code/RepositoryDetail/Settings | Projects/Code/CommitDetail; Projects/Code/Compare; Projects/Code/MergeRequestDetail; Projects/Code/MergeRequestDetail/Commits; Projects/Code/MergeRequestDetail/Overview; Projects/Code/RepositoryDetail |
| GitServices | find#TaskReferences |  |  |
| GitServices | store#TaskCommit |  |  |
| GitServices | add#TaskCommit | Projects/WorkItems/WorkItemDetail; Projects/Code/CommitDetail | Projects/Code/CommitDetail |
| GitServices | remove#TaskCommit | Projects/WorkItems/WorkItemDetail; Projects/Code/CommitDetail | Projects/Code/CommitDetail; Projects/WorkItems/WorkItemDetail |
| GitServices | link#CommitReferences |  |  |
| GitServices | store#WorkEffortRef |  | Projects/Projects/ReleaseDetail |
| GitServices | add#WorkEffortRef | Projects/Projects/ReleaseDetail; Projects/WorkItems/WorkItemDetail; Projects/Code/RepositoryDetail/Tags | Projects/Code/RepositoryDetail/Tags; Projects/Projects/ReleaseDetail |
| GitServices | remove#WorkEffortRef | Projects/Projects/ProjectDetail/Code; Projects/WorkItems/WorkItemDetail; Projects/Code/RepositoryDetail/Tags | Projects/Code/RepositoryDetail/Tags; Projects/Projects/ProjectDetail/Code; Projects/Projects/ReleaseDetail; Projects/WorkItems/WorkItemDetail |
| GitServices | link#RefByName |  |  |
| GitServices | close#RefLinks |  |  |
| GitServices | apply#CommitKeywords |  |  |
| GitServices | complete#TaskFromCommit |  |  |
| GitServices | check#GitRepositoryAuthz |  |  |
| ManufacturingServices | get#ProductionRunDisplayInfo | Manufacturing/WorkOrders/WorkOrderDetail; Shared/MaterialIssueReceipt |  |
| ManufacturingServices | create#ProductionRun |  | mantle.work.ProductionServices.create#ProductionOrder (without the legacy consume and produce products, P16a) |
| ManufacturingServices | create#ShipmentAssemblyWorkEffort |  |  |
| ManufacturingServices | set#ProducedProductQuantity |  |  |
| ManufacturingServices | recreate#ConsumeProductsFromProduce |  |  |
| ManufacturingServices | produce#AvailableAssemblies | Warehouse/Handheld/Pack; Warehouse/Shipping/Pack; Shared/MaterialIssueReceipt | Warehouse/Shipping/Pack and Warehouse/Inventory/MaterialIssueReceipt (inside pack#ShipmentAssemblyComponent; the kit cost of kitCostFromComponents, F41) |
| ManufacturingServices | breakDown#Assembly |  |  |
| ManufacturingServices | unissue#AssemblyComponents |  |  |
| ManufacturingServices | unissue#Component |  |  |
| ManufacturingServices | cancel#AssemblyWorkEffort |  |  |
| ManufacturingServices | get#ConsumedAssetRemaining | Manufacturing/WorkOrders/Disassembly |  |
| ManufacturingServices | get#ProducedProductComplete | Manufacturing/WorkOrders/WorkOrderDetail/Quantities; Manufacturing/WorkOrders/Disassembly |  |
| ManufacturingServices | get#ProductionRunProduceConsumeDetail | Manufacturing/WorkOrders/WorkOrderDetail/Components; Manufacturing/WorkOrders/WorkOrderDetail/Quantities; Shared/MaterialIssueReceipt |  |
| ManufacturingServices | get#ProductBomDetail | Manufacturing/BillsOfMaterials/BillOfMaterialsDetail/BillOfMaterialsExplosion |  |
| ManufacturingServices | get#ProductionRunPickInfo | Manufacturing/WorkOrders/WorkOrderDetail |  |
| MeasurementServices | get#MeasurementUomsByMeasurementType |  |  |
| ProjectServices | clone#Project | Projects/QuickCreate; Projects/Projects/NewProject; Projects/Projects/ProjectDetail; Projects/Projects/ProjectDetail/Settings; Projects/Settings/Templates | Projects/Projects/NewProject/Start; Projects/Projects/ProjectDetail; Projects/QuickProject; Projects/Requests/RequestDetail |
| ProjectServices | create#Project | Projects/QuickCreate; Projects/Projects/NewProject; Projects/Settings/Templates | Projects/Projects/NewProject/Start; Projects/Projects/ProjectDetail; Projects/QuickProject; Projects/Requests/RequestDetail |
| ProjectServices | update#Project | Projects/Projects; Projects/Projects/NewProject; Projects/Projects/ProjectDetail/Overview; Projects/Projects/ProjectDetail/Money; Projects/Projects/ProjectDetail/Settings | Projects/Projects/ProjectDetail/Settings; Projects/Requests/RequestDetail |
| ProjectServices | get#ProjectStats | Projects/Home; Projects/Projects; Projects/Projects/ProjectDetail/Overview; Projects/Projects/ProjectDetail/Money; Projects/Reports/Portfolio | Projects/Home; Projects/Projects/List; Projects/Projects/NewProject/Review; Projects/Projects/ProjectDetail; Projects/Projects/ProjectDetail/Overview; Projects/Projects/StatusReport; Projects/WorkItems/Timeline |
| ProjectServices | get#ProjectMilestoneSummary | Projects/Projects/ProjectDetail/Overview; Projects/Projects/Roadmap; Projects/Projects/MilestoneDetail; Projects/Reports/Progress |  |
| ProjectServices | get#WorkEffortChildStats | Projects/Reports/Progress |  |
| ProjectServices | get#ProjectParties | Projects/WorkItems/WorkItemDetail |  |
| ProjectServices | get#ProjectTeams | Projects/Projects/ProjectDetail/Team |  |
| ProjectServices | get#ProjectTasks | Projects/WorkItems/WorkItemDetail |  |
| ProjectServices | get#ProjectMilestones | Projects/WorkItems/WorkItemDetail |  |
| ProjectServices | create#Milestone | Projects/Projects/Roadmap | Projects/Projects/MilestoneDetail; Projects/Projects/ReleaseDetail; Projects/Projects/Roadmap |
| ProjectServices | update#Milestone | Projects/Projects/Roadmap; Projects/Projects/MilestoneDetail; Projects/Projects/ReleaseDetail; Projects/WorkItems/Backlog; Projects/WorkItems/SprintDetail | Projects/Projects/MilestoneDetail; Projects/Projects/ReleaseDetail; Projects/Projects/Roadmap |
| ShipmentWorkServices | create#ShipmentLoadShip | Warehouse/Picking/Picklists | Warehouse/Picking/Picklists (NewPicklist, through store#ShipmentLoad) |
| ShipmentWorkServices | add#ShipmentToShipmentLoad | Warehouse/Picking/PicklistDetail | Warehouse/Picking/PicklistDetail (Add shipment, through edit#ShipmentLoadMember) |
| ShipmentWorkServices | add#OrderPartToShipmentLoad | Warehouse/Picking/PicklistDetail | Warehouse/Picking/PicklistDetail (Add order, through edit#ShipmentLoadMember); CreatePicklists (each group) |
| ShipmentWorkServices | make#ShipmentLoadOrderConditions | Warehouse/Picking/CreatePicklists | — Warehouse/Picking/CreatePicklists: the guarded wave finds candidates with find#ShipmentLoadCandidates (preview#ShipmentLoadsForOrders) |
| ShipmentWorkServices | create#ShipmentLoadsForOrders | Warehouse/Picking/CreatePicklists | Warehouse/Picking/CreatePicklists (LoadCreate: with an operation key, a result per group; preview#ShipmentLoadsForOrders for LoadPreview) |
| ShipmentWorkServices | check#ShipmentLoadStatusChange |  |  |
| ShipmentWorkServices | set#ShipmentLoadStatusOnShipmentStatus |  |  |
| ShipmentWorkServices | setAll#ShipmentLoadStatusFromShipments |  |  |
| ShipmentWorkServices | set#ShipmentLoadStatusFromShipments | Warehouse/Picking/PicklistDetail | Warehouse/Picking/PicklistDetail (the load follows its shipments: SECA WorkEffortShipLoadStatusAuto) |
| ShipmentWorkServices | complete#ShipmentLoadShip | Warehouse/Picking/PicklistDetail | Warehouse/Picking/PicklistDetail (Complete, through WarehouseTaskServices.finish#Pick with the acknowledgement) |
| ShipmentWorkServices | close#ShipmentLoadShip | Warehouse/Picking/PicklistDetail | — Warehouse/Picking/PicklistDetail (CompletePicklist: finish#Pick completes the load and takes unpicked shipments off) |
| TaskServices | get#FullCalendarData | Commons/Calendar; Projects/Projects/ProjectDetail/Plan/Calendar | Commons/Calendar |
| TaskServices | create#Task | Projects/QuickCreate; Projects/WorkItems; Projects/WorkItems/WorkItemDetail; Projects/WorkItems/Backlog; Projects/Requests; Projects/Requests/RequestDetail | Projects/QuickCreate; Projects/WorkItems/Backlog; Projects/WorkItems/List; Projects/WorkItems/WorkItemDetail |
| TaskServices | create#SimpleTask | Commons/Panel/Today; Commons/QuickCreate; Commons/Tasks; Comms/Inbox; Comms/Chat; Shared/Chatter; Sales/Pipeline/OpportunityDetail; Sales/Agreements/Subscriptions | Commons/Panel/Today; Commons/QuickCreate; Commons/Requests/RequestDetail; Commons/Tasks/List; Commons/Tasks/TaskDetail; Shared/Chatter; Projects/Requests/RequestDetail; Projects/WorkItems/WorkItemDetail |
| TaskServices | update#Task | Commons/Panel/Today; Commons/Tasks; Commons/Tasks/TaskDetail; Projects/Projects/MilestoneDetail; Projects/WorkItems; Projects/WorkItems/WorkItemDetail; Projects/WorkItems/Timeline; Shared/Chatter | Commons/Panel/Today; Commons/Tasks/List; Commons/Tasks/TaskDetail; Shared/Chatter; Projects/WorkItems/List; Projects/WorkItems/SprintDetail; Projects/WorkItems/WorkItemDetail |
| TaskServices | set#TaskMilestone | Projects/Projects/MilestoneDetail; Projects/WorkItems; Projects/WorkItems/WorkItemDetail |  |
| TaskServices | set#TaskDefaults |  |  |
| TaskServices | add#TaskComment | Commons/Tasks/TaskDetail |  |
| TaskServices | update#TaskComment |  |  |
| TaskServices | delete#TaskComment |  |  |
| TaskServices | add#TaskTime | Commons/Tasks/TaskDetail; Projects/WorkItems/WorkItemDetail | Commons/Tasks/TaskDetail; Projects/WorkItems/WorkItemDetail |
| TaskServices | update#TaskFromTime |  | Commons/Tasks/TaskDetail; Projects/WorkItems/WorkItemDetail |
| TaskServices | update#ProjectTimeFromTask |  |  |
| TimeServices | store#TimeEntry | Projects/Home; Projects/QuickCreate; Projects/WorkItems/WorkItemDetail; Projects/Time/MyTime; Projects/Time/TimeEntries; People/Time/MyTime; People/Time/TimeEntries; Maintenance/WorkOrders/WorkOrderDetail | Commons/Tasks/TaskDetail; Projects/QuickCreate; Projects/Time/MyTime; Projects/Time/TimeEntries; Projects/Time/TimeEntries/EditEntry |
| TimeServices | create#TimeEntryClockIn | Commons/Tasks/TaskDetail; Projects/WorkItems/WorkItemDetail; Projects/Time/MyTime; Projects/Time/TimeEntries | Commons/Tasks/TaskDetail |
| TimeServices | delete#TimeEntry | Projects/WorkItems/WorkItemDetail; Projects/Time/MyTime; Projects/Time/TimeEntries; People/Time/MyTime; People/Time/TimeEntries | Commons/Tasks/TaskDetail; Projects/Time/MyTime; Projects/Time/TimeEntries; Projects/Time/TimeEntries/EditEntry; Projects/WorkItems/WorkItemDetail |
| TimeServices | delete#TimeEntries |  |  |
| TimeServices | store#TimeEntryWorkEffort | Projects/Time/TimeEntries |  |
| TimeServices | store#WorkEffortPartyTime | Projects/Time/TimeEntries |  |
| TimeServices | get#TeamTimesheetInfo | Projects/Time/TimeEntries |  |
| TimeServices | get#TimeEntryAmount | Projects/Time/TimeEntries |  |
| TimeServices | resetAndGet#TimeEntryRates | Projects/Time/TimeEntries |  |
| TimeServices | resetAndGet#ProjectTimeEntryRates | Projects/Projects/ProjectDetail/Time | Projects/Time/TimeEntries |
| TimeServices | get#TimeEntryRate | Projects/Time/TimeEntries | Projects/Time/TimeEntries; Projects/Time/TimeEntries/EditEntry |
| TimeServices | get#TimeEntryFacility |  |  |
| TimeServices | get#TimeEntryRiskClassInfo |  |  |
| TimeServices | find#RateAmount | Projects/Billing/Rates | Projects/Billing/Rates |
| TimeServices | find#TimeEntryRateAmount |  |  |
| TimeServices | upload#TimeSummaryFile |  |  |
| TimeServices | import#TimeSummaryFile |  |  |
| TimeServices | import#TimeSummaryRecord |  |  |
| TimeServices | upload#TimeDetailFile | Projects/Time/TimeEntries |  |
| TimeServices | import#TimeDetailFile | Projects/Time/TimeEntries |  |
| TimeServices | import#TimeDetailRecord |  |  |
| WorkEffortServices | clone#WorkEffort | Commons/Calendar/EventDetail; Commons/Tasks/TaskDetail; Projects/WorkItems/WorkItemDetail | Commons/Calendar/EventDetail; Commons/Tasks/TaskDetail; Projects/WorkItems/WorkItemDetail |
| WorkEffortServices | delete#WorkEffort | Projects/Projects/ProjectDetail/Settings; Projects/WorkItems; Projects/WorkItems/WorkItemDetail | Commons/Tasks/TaskDetail; Projects/Projects/ProjectDetail/Settings; Projects/WorkItems/List; Projects/WorkItems/WorkItemDetail |
| WorkEffortServices | add#WorkEffortParty | Commons/QuickCreate; Commons/Calendar; Commons/Calendar/EventDetail; Projects/Projects/NewProject; Projects/Projects/ProjectDetail/Team; Projects/WorkItems; Projects/WorkItems/WorkItemDetail; Manufacturing/WorkOrders/WorkOrderDetail/Overview; Maintenance/WorkOrders/WorkOrderDetail; Marketing/Events/EventDetail | Commons/Calendar; Commons/Calendar/EventDetail; Commons/QuickCreate; Commons/Tasks/TaskDetail; Projects/Projects/NewProject/Start; Projects/Projects/NewProject/Team; Projects/Projects/ProjectDetail; Projects/Projects/ProjectDetail/Plan/Calendar; Projects/Projects/ProjectDetail/Team; Projects/QuickCreate; Projects/QuickProject; Projects/Requests/RequestDetail; Projects/WorkItems/Backlog; Projects/WorkItems/List; Projects/WorkItems/WorkItemDetail |
| WorkEffortServices | remove#WorkEffortParty | Commons/Calendar/EventDetail; Projects/Projects/ProjectDetail/Team; Projects/WorkItems; Manufacturing/WorkOrders/WorkOrderDetail/Overview; Maintenance/WorkOrders/WorkOrderDetail; Marketing/Events/EventDetail | Projects/Projects/NewProject/Team; Projects/Projects/ProjectDetail/Team; Projects/WorkItems/List; Projects/WorkItems/SprintDetail; Projects/WorkItems/WorkItemDetail |
| WorkEffortServices | replace#WorkEffortParty | Commons/Calendar/EventDetail; Commons/Tasks; Projects/WorkItems/WorkItemDetail; Maintenance/WorkOrders/WorkOrderDetail; Marketing/Events/EventDetail | Commons/Tasks/List; Commons/Tasks/TaskDetail; Shared/Chatter; Projects/Projects/List; Projects/WorkItems/List; Projects/WorkItems/SprintDetail; Projects/WorkItems/WorkItemDetail |
| WorkEffortServices | add#WorkEffortProduct | Projects/Projects/ProjectDetail/Money |  |
| WorkEffortServices | get#WorkEffortStartEnd |  | Commons/Calendar; Commons/Calendar/EventDetail; Projects/Projects/ProjectDetail/Plan/Calendar |
| WorkEffortServices | get#WorkEffortContentLocation |  |  |
| WorkEffortServices | create#WorkEffortContent | Commons/Tasks/TaskDetail; Projects/Projects/ProjectDetail/Files; Projects/WorkItems/WorkItemDetail; Shared/RecordFiles; Maintenance/Procedures/ProcedureDetail; Maintenance/RecordFiles; Maintenance/WorkOrders/WorkOrderDetail | Shared/RecordFiles |
| WorkEffortServices | update#WorkEffortContent | Projects/Projects/ProjectDetail/Files; Projects/WorkItems/WorkItemDetail; Maintenance/Procedures/ProcedureDetail; Maintenance/RecordFiles; Maintenance/WorkOrders/WorkOrderDetail |  |
| WorkEffortServices | save#WorkEffortContentFile | Commons/Tasks/TaskDetail; Shared/RecordFiles |  |

Added in the drawers-commons build (Oct 18–19, 2026), called by built screens:

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| CalendarServices | check#CalendarAccess |  | Commons/Calendar; Commons/Calendar/EventDetail; Commons/Settings/Calendars; Commons/Settings/Preferences |
| CalendarServices | ensure#UserDefaultCalendar |  | Commons/Calendar; Commons/Calendar/EventDetail; Commons/Calendar/Schedules; Commons/Calendar/Schedules/ResourceDetail; Commons/QuickCreate; Shared/Chatter; Projects/Projects/ProjectDetail/Plan/Calendar |
| CalendarServices | create#Calendar |  | Commons/Settings/Calendars |
| CalendarServices | update#Calendar |  | Commons/Settings/Calendars; Commons/Settings/Preferences |
| CalendarServices | delete#Calendar |  | Commons/Settings/Calendars |
| CalendarServices | share#Calendar |  | Commons/Settings/Calendars |
| CalendarServices | unshare#Calendar |  | Commons/Settings/Calendars |
| CalendarServices | get#UserCalendars |  | Commons/Calendar; Commons/Calendar/EventDetail; Commons/QuickCreate; Commons/Settings/Calendars; Commons/Settings/Preferences; Comms/Inbox/Mail; Projects/Projects/ProjectDetail/Plan/Calendar |
| CalendarServices | add#CalendarEvent |  | Commons/Calendar/EventDetail |
| CalendarServices | remove#CalendarEvent |  | Commons/Calendar/EventDetail |
| CalendarServices | subscribe#Calendar |  | Commons/Settings/Calendars |
| CalendarServices | fetch#CalendarSubscriptions |  | Commons/Settings/Calendars |
| CalendarServices | export#Calendar |  | Commons/Calendar; Commons/Settings/Calendars |
| CalendarServices | import#Calendar |  | Commons/Settings/Calendars |
| EventServices | check#EventAccess | Marketing/Events/EventDetail | Commons/Calendar; Commons/Calendar/EventDetail; Projects/Projects/ProjectDetail/Plan/Calendar |
| EventServices | get#EventIcsMaps | Maintenance/WorkOrders/WorkOrderDetail; Maintenance/Preventive/DueMaintenance | Commons/Calendar/EventDetail |
| EventServices | store#EventRecurrence |  | Commons/Calendar; Commons/Calendar/EventDetail; Projects/Projects/ProjectDetail/Plan/Calendar |
| EventServices | update#EventOccurrence | Marketing/Calendar; Marketing/Events/EventDetail | Commons/Calendar; Commons/Calendar/EventDetail; Projects/Projects/ProjectDetail/Plan/Calendar |
| EventServices | cancel#EventOccurrence | Marketing/Events/EventDetail | Commons/Calendar; Commons/Calendar/EventDetail; Projects/Projects/ProjectDetail/Plan/Calendar |
| EventServices | respond#EventInvitation | Marketing/Events/EventDetail | Commons/Calendar; Commons/Calendar/EventDetail; Comms/Inbox/Mail; Projects/Projects/ProjectDetail/Plan/Calendar |
| EventServices | get#InvitationDigest |  | Commons/Calendar/EventDetail |
| EventServices | send#EventInvitations | Marketing/Events/EventDetail; People/Staffing/ApplicantDetail; People/Staffing/InterviewsCalendar; Maintenance/WorkOrders/WorkOrderDetail | Commons/Calendar; Commons/Calendar/EventDetail; Commons/QuickCreate; Projects/Projects/ProjectDetail/Plan/Calendar |
| EventServices | remove#EventAttendee |  | Commons/Calendar/EventDetail |
| EventServices | get#FreeBusy | Maintenance/Scheduling/ResourceCalendar | Commons/Calendar; Commons/Calendar/EventDetail |
| EventServices | book#Resource | Maintenance/Scheduling/ResourceCalendar; Marketing/Events/EventDetail | Commons/Calendar; Commons/Calendar/EventDetail; Commons/Calendar/Schedules; Commons/Calendar/Schedules/ResourceDetail; Projects/Projects/ProjectDetail/Plan/Calendar |
| EventServices | cancel#ResourceBooking | Maintenance/Scheduling/ResourceCalendar | Commons/Calendar/EventDetail; Commons/Calendar/Schedules; Commons/Calendar/Schedules/ResourceDetail |
| EventServices | store#WorkEffortReminders | People/Time/LeaveRequestDetail; People/Development/TrainingDetail; People/Development/Qualifications | Commons/Calendar; Commons/Calendar/EventDetail; Projects/Projects/ProjectDetail/Plan/Calendar |
| WorkEffortServices | link#WorkEffortRecord | Projects/QuickCreate; Projects/WorkItems/WorkItemDetail; CustomerService/Returns/WarrantyAssessment; Maintenance/WorkOrders/WorkOrderDetail | Commons/Calendar; Commons/Calendar/EventDetail; Commons/Panel/Today; Commons/QuickCreate; Commons/Requests/RequestDetail; Commons/Tasks/List; Commons/Tasks/TaskDetail; Shared/Chatter; Projects/Projects/ProjectDetail/Plan/Calendar; Projects/QuickCreate; Projects/Requests/RequestDetail; Projects/WorkItems/Backlog; Projects/WorkItems/List; Projects/WorkItems/WorkItemDetail |
| WorkEffortServices | unlink#WorkEffortRecord | Projects/WorkItems/WorkItemDetail | Commons/Calendar/EventDetail |
| WorkEffortServices | get#UserTodayItems |  | Commons/Home; Commons/Panel/Today |
| WorkEffortServices | snooze#UserTodayItem |  | Commons/Panel/Today; Commons/Tasks/List; Commons/Tasks/TaskDetail; Projects/WorkItems/WorkItemDetail |

Added in the Projects build (Oct 21–22, 2026; impl-projects.md P1–P10), called by built screens:

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| GitServices | add#MergeRequestItem |  | Projects/Code/MergeRequestDetail/Overview |
| GitServices | create#ReviewComment |  | Projects/Code/MergeRequestDetail/Changes |
| GitServices | create#TaskBranch |  | Projects/WorkItems/WorkItemDetail |
| GitServices | get#MergeRequestItems |  | Projects/Code/MergeRequestDetail; Projects/Code/MergeRequestDetail/Commits; Projects/Code/MergeRequestDetail/Overview |
| GitServices | get#RepositoryDefaults |  | Projects/Settings/Code |
| GitServices | get#ReviewThreads |  | Projects/Code/MergeRequestDetail; Projects/Code/MergeRequestDetail/Changes; Projects/Code/MergeRequestDetail/Commits; Projects/Code/MergeRequestDetail/Overview |
| GitServices | get#TaskBranchName |  | Projects/WorkItems/WorkItemDetail |
| GitServices | link#MergeRequestItems |  | Projects/Code/Compare |
| GitServices | remove#MergeRequestItem |  | Projects/Code/MergeRequestDetail/Overview |
| GitServices | resolve#ReviewThread |  | Projects/Code/MergeRequestDetail/Changes |
| GitServices | search#Code |  | Projects |
| ProjectReportServices | get#PortfolioStatus | Insights/Dashboard; Insights/Panels/PanelDetail; Insights/ReportBuilder/Analysis; Insights/ManagementDigest | Projects/Reports/Portfolio |
| ProjectReportServices | get#ProgressBreakdown | Insights/Dashboard; Insights/Panels/PanelDetail; Insights/ReportBuilder/Analysis; Insights/ManagementDigest | Projects/Reports/Progress |
| ProjectReportServices | get#ProjectProfitability | Insights/Dashboard; Insights/Panels/PanelDetail; Insights/ReportBuilder/Analysis; Insights/ManagementDigest | Projects/Reports/Profitability |
| ProjectReportServices | get#SprintBurndown | Insights/Dashboard; Insights/Panels/PanelDetail; Insights/ReportBuilder/Analysis; Insights/ManagementDigest | Projects/Reports/Sprints; Projects/WorkItems/Backlog; Projects/WorkItems/SprintDetail; Projects/WorkItems/SprintReport |
| ProjectReportServices | get#SprintVelocity | Insights/Dashboard; Insights/Panels/PanelDetail; Insights/ReportBuilder/Analysis; Insights/ManagementDigest | Projects/Reports/Sprints; Projects/WorkItems/SprintReport |
| ProjectReportServices | get#TimeReport | Insights/Dashboard; Insights/Panels/PanelDetail; Insights/ReportBuilder/Analysis; Insights/ManagementDigest | Projects/Home; Projects/Reports/Time |
| ProjectReportServices | get#Utilization | Insights/Dashboard; Insights/Panels/PanelDetail; Insights/ReportBuilder/Analysis; Insights/ManagementDigest | Projects/Reports/Utilization |
| ProjectReportServices | get#WorkItemSummary | Insights/Dashboard; Insights/Panels/PanelDetail; Insights/ReportBuilder/Analysis; Insights/ManagementDigest | Projects/Reports/WorkItems |
| ProjectServices | approve#MilestoneApproval |  | Projects/Projects/MilestoneDetail |
| ProjectServices | complete#Sprint |  | Projects/WorkItems/Backlog; Projects/WorkItems/SprintDetail |
| ProjectServices | create#ProjectDocsSpace |  | Projects/Projects/NewProject/Modules; Projects/Projects/ProjectDetail/Docs |
| ProjectServices | create#ProjectTemplate |  | Projects/Projects/ProjectDetail; Projects/Settings/Templates |
| ProjectServices | create#Release |  | Projects/Projects/MilestoneDetail; Projects/Projects/ReleaseDetail; Projects/Projects/Roadmap |
| ProjectServices | create#Sprint |  | Projects/WorkItems/Backlog; Projects/WorkItems/SprintDetail |
| ProjectServices | generate#ReleaseNotes |  | Projects/Projects/ReleaseDetail |
| ProjectServices | get#ClientProjectInfo |  | Projects: 49 screens (through the ironstone.* access and find services) |
| ProjectServices | get#MilestoneApprovalAccess |  | Projects/Billing/OrderDetail; Projects/Projects/MilestoneDetail; Projects/Projects/ProjectDetail/Money |
| ProjectServices | get#MilestoneBilling |  | Projects/Billing/OrderDetail; Projects/Projects/MilestoneDetail; Projects/Projects/NewProject/Money |
| ProjectServices | get#PlanItemSummary |  | Projects/Projects/MilestoneDetail; Projects/Projects/ProjectDetail/Plan/Calendar; Projects/Projects/ReleaseDetail; Projects/Projects/Roadmap; Projects/WorkItems/Timeline |
| ProjectServices | get#ProjectActivity |  | Projects/Home; Projects/Projects/ProjectDetail/Overview; Projects/Projects/StatusReport |
| ProjectServices | get#ProjectEstimate |  | Projects/Projects/EstimatePrint |
| ProjectServices | get#ProjectHomeCounts |  | Projects/Home |
| ProjectServices | get#ProjectMoneySummary |  | Projects/Projects/ProjectDetail/Money |
| ProjectServices | get#ProjectSettings |  | Projects: 27 screens (through the ironstone.* access and find services) |
| ProjectServices | get#ProjectTemplates |  | Projects/Projects/NewProject/Start; Projects/Settings/Templates |
| ProjectServices | get#ProjectTodayItems |  | Projects |
| ProjectServices | get#ReleaseNotes |  | Projects/Projects/ReleaseDetail |
| ProjectServices | get#SprintDefaults |  | Projects/WorkItems/Backlog |
| ProjectServices | get#TimelineData |  | Projects/WorkItems/Timeline |
| ProjectServices | get#UnbilledSummary |  | Projects/Billing/Unbilled; Projects/Billing/Unbilled/CreateInvoice; Projects/Home; Projects/Projects/NewProject/Review; Projects/Projects/ProjectDetail; Projects/Projects/StatusReport |
| ProjectServices | get#VisibleProjectInfo |  | Projects: 77 screens (through the ironstone.* access and find services) |
| ProjectServices | get#WorkItemTree |  | Projects: 16 screens (through the ironstone.* access and find services) |
| ProjectServices | link#ProjectOrderItem |  | Projects/Projects/NewProject/Money; Projects/Projects/ProjectDetail/Money |
| ProjectServices | post#ProjectUpdate |  | Projects/Projects/ProjectDetail |
| ProjectServices | publish#ReleaseNotes |  | Projects/Projects/ReleaseDetail |
| ProjectServices | refuse#MilestoneApproval |  | Projects/Projects/MilestoneDetail |
| ProjectServices | release#Release |  | Projects/Projects/ReleaseDetail |
| ProjectServices | send#EstimateForApproval |  | Projects/Billing/OrderDetail; Projects/Projects/ProjectDetail/Money |
| ProjectServices | setup#ClientProjectInfo |  | Projects |
| ProjectServices | start#Sprint |  | Projects/WorkItems/Backlog; Projects/WorkItems/SprintDetail |
| ProjectServices | store#MilestoneShare |  | Projects/Projects/MilestoneDetail |
| ProjectServices | store#ProjectSetting |  | Projects/Projects/NewProject/Modules; Projects/Projects/NewProject/Money; Projects/Projects/ProjectDetail/Money; Projects/Projects/ProjectDetail/Settings; Projects/Settings/Intake; Projects/WorkItems/Backlog |
| ProjectServices | store#ReleaseNotes |  | Projects/Projects/ReleaseDetail |
| ProjectServices | update#Sprint |  | Projects/WorkItems/Backlog; Projects/WorkItems/SprintDetail |
| ResourceServices | approve#Allocation |  | Projects/Projects/ProjectDetail/Team; Projects/Resources/Allocations; Projects/Resources/Allocations/Staff; Projects/Resources/TeamPlanner |
| ResourceServices | cancel#Allocation |  | Projects/Projects/ProjectDetail/Team; Projects/Resources/Allocations; Projects/Resources/Allocations/Staff; Projects/Resources/TeamPlanner |
| ResourceServices | create#Allocation |  | Projects/Projects/NewProject/Team; Projects/Projects/ProjectDetail/Team; Projects/Resources/Allocations/EditAllocation; Projects/Resources/TeamPlanner |
| ResourceServices | find#Allocations |  | Projects/Home; Projects/Projects/NewProject/Team; Projects/Projects/ProjectDetail/Team; Projects/Resources/Allocations; Projects/Resources/Allocations/Staff; Projects/Resources/PersonDetail/Allocations; Projects/Resources/TeamPlanner |
| ResourceServices | find#StaffingCandidates | People/Development/SkillsMatrix; Maintenance/WorkOrders | Projects/Billing/Rates; Projects/Projects/ProjectDetail/Team; Projects/Resources/Allocations/EditAllocation; Projects/Resources/Allocations/Staff; Projects/Resources/TeamPlanner |
| ResourceServices | get#AllocationAccess |  | Projects/Projects/NewProject/Team; Projects/Projects/ProjectDetail/Team; Projects/Resources/Allocations/EditAllocation; Projects/Resources/Allocations/Staff; Projects/Resources/TeamPlanner |
| ResourceServices | get#TeamPlan |  | Projects/Resources/PersonDetail/Capacity; Projects/Resources/PersonDetail/Overview; Projects/Resources/TeamPlanner |
| ResourceServices | reject#Allocation |  | Projects/Projects/ProjectDetail/Team; Projects/Resources/Allocations; Projects/Resources/Allocations/Staff; Projects/Resources/TeamPlanner |
| ResourceServices | staff#Allocation |  | Projects/Projects/ProjectDetail/Team; Projects/Resources/Allocations; Projects/Resources/Allocations/Staff; Projects/Resources/TeamPlanner |
| ResourceServices | update#Allocation |  | Projects/Projects/NewProject/Team; Projects/Projects/ProjectDetail/Team; Projects/Resources/Allocations/EditAllocation; Projects/Resources/TeamPlanner |
| TaskServices | add#TaskDependency |  | Projects/WorkItems/Timeline; Projects/WorkItems/WorkItemDetail |
| TaskServices | add#TaskLabel |  | Projects/WorkItems/List; Projects/WorkItems/SprintDetail; Projects/WorkItems/WorkItemDetail |
| TaskServices | get#TaskStatusFlow |  | Projects/WorkItems/WorkItemDetail |
| TaskServices | move#Task |  | Projects/WorkItems/List; Projects/WorkItems/SprintDetail; Projects/WorkItems/WorkItemDetail |
| TaskServices | remove#TaskDependency |  | Projects/WorkItems/Timeline |
| TaskServices | remove#TaskLabel |  | Projects/WorkItems/List; Projects/WorkItems/SprintDetail; Projects/WorkItems/WorkItemDetail |
| TaskServices | set#TaskBacklogRank |  | Projects/WorkItems/Backlog |
| TaskServices | set#TaskDates |  | Projects/Projects/ProjectDetail/Plan/Calendar; Projects/WorkItems/Timeline |
| TaskServices | set#TaskPlanItem |  | Projects/Projects/MilestoneDetail; Projects/Projects/ReleaseDetail; Projects/WorkItems/List; Projects/WorkItems/SprintDetail; Projects/WorkItems/WorkItemDetail |
| TaskServices | set#TaskRank |  | Projects/QuickCreate; Projects/WorkItems/Backlog; Projects/WorkItems/List; Projects/WorkItems/WorkItemDetail |
| TaskServices | set#TaskRecurrence |  | Projects/WorkItems/List; Projects/WorkItems/SprintDetail; Projects/WorkItems/WorkItemDetail |
| TaskServices | set#TaskSprint |  | Projects/QuickCreate; Projects/WorkItems/Backlog; Projects/WorkItems/List; Projects/WorkItems/SprintDetail; Projects/WorkItems/WorkItemDetail |
| TaskServices | set#TaskStatus |  | Projects/WorkItems/List; Projects/WorkItems/SprintDetail; Projects/WorkItems/WorkItemDetail |
| TimeServices | find#TimeEntries | People/Time/TimeEntries | Projects/Resources/PersonDetail/Time; Projects/Time/TeamTimesheet; Projects/Time/TimeEntries; Projects/Time/TimeEntries/EditEntry |
| TimeServices | import#TimeEntryCsv | People/Time/TimeImport; People/Time/TimeEntries | Projects/Time/Import/Preview; Projects/Time/Import/Result; Projects/Time/Import/Source |
| TimesheetServices | approve#Timesheet | People/Time/MyTime; People/Time/TimesheetDetail | Projects/Time/MyTime; Projects/Time/TimesheetDetail |
| TimesheetServices | find#Timesheets | People/Time/Timesheets | Projects/Home; Projects/Resources/PersonDetail/Time; Projects/Time/Timesheets |
| TimesheetServices | get#PartyTimesheet | People/Time/MyTime | Projects/QuickCreate; Projects/Time/MyTime; Projects/Time/TimeEntries/EditEntry |
| TimesheetServices | get#PartyWeek | People/Time/MyTime | Projects/Time/MyTime |
| TimesheetServices | get#TimeKeepers |  | Projects/Billing/Rates; Projects/Projects/ProjectDetail/Team; Projects/Resources/Allocations/EditAllocation; Projects/Resources/TeamPlanner; Projects/Time/Import/Source; Projects/Time/MyTime; Projects/Time/TimeEntries; Projects/Time/TimeEntries/EditEntry |
| TimesheetServices | get#Timer | Manufacturing/ShopFloor; Manufacturing/ShopFloor/OperationExecution; Manufacturing/WorkOrders/WorkOrderDetail/Time; People/Time/MyTime; Maintenance/WorkOrders/WorkOrderDetail | Projects/Home; Projects/Time/MyTime |
| TimesheetServices | get#TimesheetAccess |  | Projects/QuickCreate; Projects/Resources/PersonDetail/Time; Projects/Time/MyTime; Projects/Time/TeamTimesheet; Projects/Time/TimeEntries; Projects/Time/TimeEntries/EditEntry |
| TimesheetServices | get#TimesheetPolicy |  | Projects/Resources/PersonDetail/Time; Projects/Settings/Time; Projects/Time/MyTime; Projects/Time/TeamTimesheet; Projects/Time/TimeEntries; Projects/Time/TimeEntries/EditEntry |
| TimesheetServices | get#TimesheetSummary | People/Employees/Employee360; People/Time/TimesheetDetail | Projects/Time/TimesheetDetail; Projects/Time/TimesheetPrint |
| TimesheetServices | get#WeekRange |  | Projects/Resources/PersonDetail/Time; Projects/Time/MyTime; Projects/Time/TeamTimesheet; Projects/Time/TimeEntries; Projects/Time/TimeEntries/EditEntry |
| TimesheetServices | get#WorkTypes |  | Projects/Billing/Rates; Projects/QuickCreate; Projects/Settings/Time; Projects/Time/MyTime; Projects/Time/TimeEntries; Projects/Time/TimeEntries/EditEntry |
| TimesheetServices | reopen#Timesheet | People/Time/MyTime; People/Time/TimesheetDetail | Projects/Time/MyTime; Projects/Time/TimesheetDetail |
| TimesheetServices | return#Timesheet | People/Time/MyTime; People/Time/TimesheetDetail | Projects/Time/MyTime; Projects/Time/TimesheetDetail |
| TimesheetServices | send#MissingTimeReminders | People/MyTeam; People/Time/Timesheets | Projects/Time/Timesheets |
| TimesheetServices | start#Timer | Manufacturing/ShopFloor/OperationExecution; Manufacturing/WorkOrders/WorkOrderDetail/Time; People/Time/MyTime; Maintenance/WorkOrders/WorkOrderDetail | Projects/Home; Projects/Time/MyTime; Projects/WorkItems/WorkItemDetail |
| TimesheetServices | stop#Timer | Manufacturing/ShopFloor/OperationExecution; Manufacturing/WorkOrders/WorkOrderDetail/Time; People/Time/MyTime; Maintenance/WorkOrders/WorkOrderDetail | Projects/Home; Projects/Time/MyTime; Projects/WorkItems/WorkItemDetail |
| TimesheetServices | store#TimesheetPolicy |  | Projects/Settings/Time |
| TimesheetServices | store#WorkTypes |  | Projects/Settings/Time |
| TimesheetServices | submit#Timesheet | People/Time/MyTime; People/Time/TimesheetDetail | Projects/Time/MyTime; Projects/Time/TimesheetDetail |
| TimesheetServices | update#Timer | Manufacturing/ShopFloor/OperationExecution; People/Time/MyTime | Projects/Time/MyTime |
| WorkItemImportServices | import#WorkItems |  | Projects/WorkItems/Import/Result |
| WorkItemImportServices | parse#WorkItemFile |  | Projects/WorkItems/Import/Mapping; Projects/WorkItems/Import/Source |
| WorkItemImportServices | preview#WorkItems |  | Projects/WorkItems/Import/Preview |

Existing capacity service mapped by the People design (Oct 31, 2026); source verified in `mantle/work/ResourceServices.xml`. The People schedule extension is proposed, not implemented.

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| ResourceServices | get#PartyCapacity | People/Time/WorkingScheduleDetail; Maintenance/WorkOrders |  |

## General (2 services)

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| GeneralServices | lookup#ById | Commons/Calendar/EventDetail; Commons/Knowledge; Comms/Inbox; Comms/Chat | Commons; Commons/Calendar/EventDetail; Commons/Knowledge; Commons/Notes; Comms/Chat; Comms/Inbox/Mail; Comms/Inbox/MessageDetail; Shared/Chatter; Projects/Projects/ProjectDetail/Docs; Projects/Requests/RequestDetail |
| GeneralServices | search#MantleFiltered |  |  |

### Products implementation, Oct 29, 2026

Products uses native guarded replacements for raw catalog writes, bulk assignments, content revisions and variant previews. Legacy service rows above stay blank where no BOSS screen calls that legacy API; a Designed in entry alone is not an implementation claim. Other apps' shared mounts remain later. The following public native entry points are reached by built Products screens; internal per-row workers and calls made only by another Mantle service are not claimed here.

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| product/CatalogRecordServices | store#Product |  | Shared/Product360; Products/Products/List; Shared/ProductImport |
| product/CatalogRecordServices | store#CatalogRow |  | Shared/Product360; Products/Products/List; Shared/ProductImport |
| product/CatalogRecordServices | ensure#CatalogAssignment |  | Shared/Product360; Products/Products/List; Shared/ProductImport |
| product/ContentServices | find#CatalogContents |  | Shared/Documents; Shared/DocumentDetail; Shared/Translations; Products/Categories/CategoryDetail/Content |
| product/ContentServices | get#CatalogContent |  | Shared/Documents; Shared/DocumentDetail; Shared/Translations; Products/Categories/CategoryDetail/Content |
| product/ContentServices | store#CatalogContent |  | Shared/Documents; Shared/DocumentDetail; Shared/Translations; Products/Categories/CategoryDetail/Content |
| product/ContentServices | upload#CatalogContents |  | Shared/Documents; Shared/DocumentDetail; Shared/Translations; Products/Categories/CategoryDetail/Content |
| product/ContentServices | restore#CatalogContent |  | Shared/Documents; Shared/DocumentDetail; Shared/Translations; Products/Categories/CategoryDetail/Content |
| product/ContentServices | find#CatalogTranslations |  | Shared/Documents; Shared/DocumentDetail; Shared/Translations; Products/Categories/CategoryDetail/Content |
| product/ContentServices | store#CatalogTranslation |  | Shared/Documents; Shared/DocumentDetail; Shared/Translations; Products/Categories/CategoryDetail/Content |
| product/ContentServices | get#CatalogContentResource |  | Shared/Documents; Shared/DocumentDetail; Shared/Translations; Products/Categories/CategoryDetail/Content |
| product/ContentServices | get#ProductDatasheet |  | Shared/Documents; Shared/DocumentDetail; Shared/Translations; Products/Categories/CategoryDetail/Content |
| product/ProductImportServices | get#CatalogImportKinds | Admin/Data/DataImport | Shared/ProductImport; Products/ProductImport |
| product/ProductImportServices | stage#CatalogImport | Admin/Data/DataImport | Shared/ProductImport; Products/ProductImport |
| product/ProductImportServices | configure#CatalogImport | Admin/Data/DataImport | Shared/ProductImport; Products/ProductImport |
| product/ProductImportServices | validate#CatalogImport | Admin/Data/DataImport | Shared/ProductImport; Products/ProductImport |
| product/ProductImportServices | apply#CatalogImport | Admin/Data/DataImport; Admin/Data/ImportDetail | Shared/ProductImport; Products/ProductImport |
| product/ProductImportServices | get#CatalogImport | Admin/Data/ImportDetail | Shared/ProductImport; Products/ProductImport |
| product/ProductImportServices | get#CatalogImportReport | Admin/Data/ImportDetail | Shared/ProductImport; Products/ProductImport |
| product/ProductImportServices | get#CatalogImportSample | Admin/Data/DataImport | Shared/ProductImport; Products/ProductImport |
| product/CatalogCheckServices | validate#Catalog |  | Shared/CatalogChecks; Products/CatalogChecks; Products/Home |
| product/CatalogCheckServices | get#CatalogChecks |  | Shared/CatalogChecks; Products/CatalogChecks; Products/Home |
| product/PriceServices | store#ProductPrice | Commerce/Merchandising/Product360; Sales/Agreements/CustomerPrices; Sales/Agreements/AgreementDetail | Shared/Prices; Shared/PriceListDetail; Shared/PriceExplain; Shared/SupplierPrices |
| product/PriceServices | replace#ProductPrice | Commerce/Merchandising/Product360; Sales/Agreements/CustomerPrices; Sales/Agreements/AgreementDetail | Shared/Prices; Shared/PriceListDetail; Shared/PriceExplain; Shared/SupplierPrices |
| product/PriceServices | expire#ProductPrice | Commerce/Merchandising/Product360; Sales/Agreements/CustomerPrices; Sales/Agreements/AgreementDetail | Shared/Prices; Shared/PriceListDetail; Shared/PriceExplain; Shared/SupplierPrices |
| product/PriceServices | find#ProductPriceLists | Commerce/Merchandising/PriceLists; Sales/Agreements/PriceLists; Sales/Agreements/PriceListDetail | Shared/Prices; Shared/PriceListDetail; Shared/PriceExplain; Shared/SupplierPrices |
| product/PriceServices | find#ProductPriceRules | Commerce/Merchandising/PriceLists/PriceListDetail; Sales/Agreements/PriceListDetail | Shared/Prices; Shared/PriceListDetail; Shared/PriceExplain; Shared/SupplierPrices |
| product/PriceServices | store#ProductPriceList | Commerce/Merchandising/PriceLists; Sales/Agreements/PriceLists; Sales/Agreements/PriceListDetail | Shared/Prices; Shared/PriceListDetail; Shared/PriceExplain; Shared/SupplierPrices |
| product/PriceServices | store#ProductPriceRule | Commerce/Merchandising/PriceLists/PriceListDetail; Sales/Agreements/PriceListDetail | Shared/Prices; Shared/PriceListDetail; Shared/PriceExplain; Shared/SupplierPrices |
| product/PriceServices | get#ProductPriceListPublication | Commerce/Merchandising/PriceLists/PriceListDetail; Sales/Agreements/PriceListDetail | Shared/Prices; Shared/PriceListDetail; Shared/PriceExplain; Shared/SupplierPrices |
| product/PriceServices | publish#ProductPriceList | Commerce/Merchandising/PriceLists/PriceListDetail; Sales/Agreements/PriceListDetail | Shared/Prices; Shared/PriceListDetail; Shared/PriceExplain; Shared/SupplierPrices |
| product/PriceServices | retire#ProductPriceList | Commerce/Merchandising/PriceLists/PriceListDetail; Sales/Agreements/PriceListDetail | Shared/Prices; Shared/PriceListDetail; Shared/PriceExplain; Shared/SupplierPrices |
| product/PriceServices | get#EffectivePriceList |  | Shared/Prices; Shared/PriceListDetail; Shared/PriceExplain; Shared/SupplierPrices |
| product/ProductServices | store#ProductPackaging |  | Shared/Packaging; Shared/Product360/Packaging; Shared/Product360/Identifiers |
| product/ProductServices | find#ProductPackaging |  | Shared/Packaging; Shared/Product360/Packaging; Shared/Product360/Identifiers |
| product/ProductServices | resolve#ScannedProduct |  | Shared/Packaging; Shared/Product360/Packaging; Shared/Product360/Identifiers; Warehouse/Transfers/Repack (repack#Asset, preview#Repack) |
| product/ProductServices | validate#ProductIdentifier |  | Shared/Packaging; Shared/Product360/Packaging; Shared/Product360/Identifiers |
| product/LabelServices | prepare#ProductLabels |  | Shared/Labels; Products/Units/Labels |
| product/LabelServices | render#ProductLabels |  | Shared/Labels; Products/Units/Labels |
| product/LabelServices | get#ProductLabels |  | Shared/Labels; Products/Units/Labels |
| product/LabelServices | get#ProductLabelResource |  | Shared/Labels; Products/Units/Labels |
| product/LabelServices | get#ProductLabelPrint |  | Shared/Labels; Products/Units/Labels |
| product/CostServices | find#ProductStandardCosts |  | Shared/StandardCosts; Shared/CostRollup; Shared/CostHistory; Shared/PriceExplain |
| product/CostServices | get#ProductStandardCost |  | Shared/StandardCosts; Shared/CostRollup; Shared/CostHistory; Shared/PriceExplain |
| product/CostServices | store#ProductStandardCost |  | Shared/StandardCosts; Shared/CostRollup; Shared/CostHistory; Shared/PriceExplain |
| product/CostServices | store#StandardCostComponent |  | Shared/StandardCosts; Shared/CostRollup; Shared/CostHistory; Shared/PriceExplain |
| product/CostServices | clone#ProductStandardCost |  | Shared/StandardCosts; Shared/CostRollup; Shared/CostHistory; Shared/PriceExplain |
| product/CostServices | approve#ProductStandardCost |  | Shared/StandardCosts; Shared/CostRollup; Shared/CostHistory; Shared/PriceExplain |
| product/CostServices | preview#ProductCostRollup |  | Shared/StandardCosts; Shared/CostRollup; Shared/CostHistory; Shared/PriceExplain |
| product/CostServices | save#ProductCostRollup |  | Shared/StandardCosts; Shared/CostRollup; Shared/CostHistory; Shared/PriceExplain |
| product/CostServices | get#StandardCostPrint |  | Shared/StandardCosts; Shared/CostRollup; Shared/CostHistory; Shared/PriceExplain |
| product/CostServices | get#ProductMargin |  | Shared/StandardCosts; Shared/CostRollup; Shared/CostHistory; Shared/PriceExplain |
| product/BomServices | find#Boms |  | Shared/BillOfMaterialsDetail; Shared/BillOfMaterialsExplosion; Shared/BillOfMaterialsCompare; Shared/WhereUsed |
| product/BomServices | get#BomDetail |  | Shared/BillOfMaterialsDetail; Shared/BillOfMaterialsExplosion; Shared/BillOfMaterialsCompare; Shared/WhereUsed |
| product/BomServices | store#Bom |  | Shared/BillOfMaterialsDetail; Shared/BillOfMaterialsExplosion; Shared/BillOfMaterialsCompare; Shared/WhereUsed |
| product/BomServices | store#BomItem |  | Shared/BillOfMaterialsDetail; Shared/BillOfMaterialsExplosion; Shared/BillOfMaterialsCompare; Shared/WhereUsed |
| product/BomServices | validate#BomDraft |  | Shared/BillOfMaterialsDetail; Shared/BillOfMaterialsExplosion; Shared/BillOfMaterialsCompare; Shared/WhereUsed |
| product/BomServices | release#BomDraft |  | Shared/BillOfMaterialsDetail; Shared/BillOfMaterialsExplosion; Shared/BillOfMaterialsCompare; Shared/WhereUsed |
| product/BomServices | get#BomExplosion |  | Shared/BillOfMaterialsDetail; Shared/BillOfMaterialsExplosion; Shared/BillOfMaterialsCompare; Shared/WhereUsed |
| product/BomServices | compare#BomDates |  | Shared/BillOfMaterialsDetail; Shared/BillOfMaterialsExplosion; Shared/BillOfMaterialsCompare; Shared/WhereUsed |
| product/BomServices | get#BomWhereUsed |  | Shared/BillOfMaterialsDetail; Shared/BillOfMaterialsExplosion; Shared/BillOfMaterialsCompare; Shared/WhereUsed |
| product/BomServices | import#LegacyBom |  | Shared/BillOfMaterialsDetail; Shared/BillOfMaterialsExplosion; Shared/BillOfMaterialsCompare; Shared/WhereUsed |
| work/RoutingServices | find#Routings |  | Shared/RoutingDetail; Shared/BillOfMaterialsDetail |
| work/RoutingServices | get#RoutingDetail |  | Shared/RoutingDetail; Shared/BillOfMaterialsDetail |
| work/RoutingServices | store#Routing |  | Shared/RoutingDetail; Shared/BillOfMaterialsDetail |
| work/RoutingServices | store#RoutingOperation |  | Shared/RoutingDetail; Shared/BillOfMaterialsDetail |
| work/RoutingServices | store#RoutingResource |  | Shared/RoutingDetail; Shared/BillOfMaterialsDetail |
| work/RoutingServices | validate#RoutingDraft |  | Shared/RoutingDetail; Shared/BillOfMaterialsDetail |
| work/RoutingServices | release#RoutingDraft |  | Shared/RoutingDetail; Shared/BillOfMaterialsDetail |
| work/RoutingServices | store#WorkCenter |  | Shared/RoutingDetail; Shared/BillOfMaterialsDetail; Manufacturing/WorkCenters/Centers (New work center, with a new line); Manufacturing/WorkCenters/FacilityDetail/WorkCenter |
| work/RoutingServices | store#WorkCenterRate |  | Shared/RoutingDetail; Shared/BillOfMaterialsDetail; Manufacturing/WorkCenters/FacilityDetail/WorkCenter |
| work/WorkCenterServices | get#WorkCenter | Manufacturing/WorkCenters/FacilityDetail | Manufacturing/WorkCenters/FacilityDetail/WorkCenter (rates with cost read only) |
| work/WorkCenterServices | store#WorkCenterCapacity | Manufacturing/WorkCenters/FacilityDetail | Manufacturing/WorkCenters/Centers; Manufacturing/WorkCenters/FacilityDetail/WorkCenter |
| work/WorkCenterServices | store#WorkCenterAlternate | Manufacturing/WorkCenters/FacilityDetail | Manufacturing/WorkCenters/FacilityDetail/WorkCenter |
| work/ProductionPlanningServices | get#WorkCenterLoad | Manufacturing/WorkCenters | Manufacturing/WorkCenters/Centers; Manufacturing/WorkCenters/FacilityDetail/WorkCenter (capacity and released operations; P12 adds the calendar) |
| product/BomServices | find#Boms |  | Shared/BillOfMaterialsDetail; Shared/BillOfMaterialsExplosion; Shared/BillOfMaterialsCompare; Shared/WhereUsed; Manufacturing/BillsOfMaterials/Find (P2, get#BomList) |
| product/BomServices | get#BomDetail |  | Shared/BillOfMaterialsDetail; Shared/BillOfMaterialsExplosion; Shared/BillOfMaterialsCompare; Shared/WhereUsed; Manufacturing/BillsOfMaterials (P2) |
| product/BomServices | store#Bom |  | Shared/BillOfMaterialsDetail; Shared/BillOfMaterialsExplosion; Shared/BillOfMaterialsCompare; Shared/WhereUsed; Manufacturing/BillsOfMaterials/Find (P2) |
| product/BomServices | store#BomItem |  | Shared/BillOfMaterialsDetail; Shared/BillOfMaterialsExplosion; Shared/BillOfMaterialsCompare; Shared/WhereUsed; Manufacturing/BillsOfMaterials (P2) |
| product/BomServices | validate#BomDraft |  | Shared/BillOfMaterialsDetail; Shared/BillOfMaterialsExplosion; Shared/BillOfMaterialsCompare; Shared/WhereUsed; Manufacturing/BillsOfMaterials (P2) |
| product/BomServices | release#BomDraft |  | Shared/BillOfMaterialsDetail; Shared/BillOfMaterialsExplosion; Shared/BillOfMaterialsCompare; Shared/WhereUsed; Manufacturing/BillsOfMaterials (P2) |
| product/BomServices | get#BomExplosion |  | Shared/BillOfMaterialsDetail; Shared/BillOfMaterialsExplosion; Shared/BillOfMaterialsCompare; Shared/WhereUsed; Manufacturing/BillsOfMaterials (P2) |
| product/BomServices | compare#BomDates |  | Shared/BillOfMaterialsDetail; Shared/BillOfMaterialsExplosion; Shared/BillOfMaterialsCompare; Shared/WhereUsed; Manufacturing/BillsOfMaterials (P2) |
| product/BomServices | get#BomWhereUsed |  | Shared/BillOfMaterialsDetail; Shared/BillOfMaterialsExplosion; Shared/BillOfMaterialsCompare; Shared/WhereUsed; Manufacturing/BillsOfMaterials (P2) |
| product/BomServices | import#LegacyBom |  | Shared/BillOfMaterialsDetail; Shared/BillOfMaterialsExplosion; Shared/BillOfMaterialsCompare; Shared/WhereUsed; Manufacturing/BillsOfMaterials/Find (P2) |
| work/RoutingServices | find#Routings |  | Shared/RoutingDetail; Shared/BillOfMaterialsDetail; Manufacturing/Routings/Find (P2, get#RoutingList) |
| work/RoutingServices | get#RoutingDetail |  | Shared/RoutingDetail; Shared/BillOfMaterialsDetail; Manufacturing/Routings/RoutingDetail (P2) |
| work/RoutingServices | store#Routing |  | Shared/RoutingDetail; Shared/BillOfMaterialsDetail; Manufacturing/Routings/Find (P2) |
| work/RoutingServices | store#RoutingOperation |  | Shared/RoutingDetail; Shared/BillOfMaterialsDetail; Manufacturing/Routings/RoutingDetail (P2) |
| work/RoutingServices | store#RoutingResource |  | Shared/RoutingDetail; Shared/BillOfMaterialsDetail; Manufacturing/Routings/RoutingDetail (P2) |
| work/RoutingServices | validate#RoutingDraft |  | Shared/RoutingDetail; Shared/BillOfMaterialsDetail; Manufacturing/Routings/RoutingDetail (P2) |
| work/RoutingServices | release#RoutingDraft |  | Shared/RoutingDetail; Shared/BillOfMaterialsDetail; Manufacturing/Routings/RoutingDetail (P2) |
| work/RoutingServices | store#WorkCenter |  | Shared/RoutingDetail; Shared/BillOfMaterialsDetail; Manufacturing/Routings/RoutingDetail (P2) |
| work/RoutingServices | store#WorkCenterRate |  | Shared/RoutingDetail; Shared/BillOfMaterialsDetail; Manufacturing/Routings/RoutingDetail (P2) |
| work/RoutingServices | find#OperationTemplates |  | Manufacturing/Routings/OperationTemplates (P2, get#TemplateList) |
| work/RoutingServices | store#OperationTemplate |  | Manufacturing/Routings/OperationTemplates (P2: EditTemplate, Archive) |
| work/RoutingServices | store#OperationInstruction |  | Manufacturing/Routings/OperationTemplates (P2: InstructionVersion) |
| work/RoutingServices | copy#RoutingOperations |  | Shared/RoutingDetail (P2, Manufacturing context: Copy operations) |
| work/RoutingServices | request#RoutingRelease |  | Shared/RoutingDetail (P2: Request release; RoutingRelease topic in Manufacturing/Approvals) |
| work/RoutingServices | import#RoutingCsv |  | Manufacturing/Routings/Find (P2: Import from CSV, with preview) |
| product/BomServices | request#BomRelease |  | Shared/BillOfMaterialsDetail (P2: Request release; BomRelease topic in Manufacturing/Approvals) |
| product/BomServices | clone#Bom |  | Manufacturing/BillsOfMaterials/Find (P2: Clone) |
| product/BomServices | import#BomCsv |  | Manufacturing/BillsOfMaterials/Find (P2: Import from CSV, with preview) |
| work/ProductionServices | record#ProductionCostEvent |  | (internal: issue#ProductionMaterial, return#UnusedMaterial and receive#ProductionOutput, so receive#SubcontractOutput too, call it inside their transaction; Manufacturing P6) |
| work/ProductionServices | get#ProductionCosts | Manufacturing/WorkOrders/WorkOrderDetail/ProductionCosts | Manufacturing/ProductionCosts (Costs; the estimate with cost read, actuals with ACCOUNTING_VIEW; mounted at the root until WorkOrderDetail, P6) |
| work/ProductionServices | review#ProductionCosts | Manufacturing/WorkOrders/WorkOrderDetail/ProductionCosts | Manufacturing/ProductionCosts (CloseReview, P6) |
| product/SupplyPlanningServices | run#SupplyPlan | Shared/SupplyPlanning | Manufacturing/Planning/SupplyPlanning (Recalculate, Manufacturing P13) |
| product/SupplyPlanningServices | get#SupplyPlan | Shared/SupplyPlanning | Manufacturing/Planning/SupplyPlanning (suggestions, held stock, demand and supply) |
| product/SupplyPlanningServices | store#PlanSchedule | Shared/SupplyPlanning | Manufacturing/Planning/SupplyPlanning (Schedule) |
| product/SupplyPlanningServices | run#ScheduledSupplyPlans |  | the run_ScheduledSupplyPlans job |
| product/SupplyPlanningServices | convert#PlanningSuggestions | Shared/SupplyPlanning | Manufacturing/Planning/SupplyPlanning (Convert, make suggestions through create#ProductionOrder) |
| facility/FacilityServices | get#ProductFacilityPolicy | Maintenance/Facilities/FacilityDetail | Shared/InventoryAvailability/Policy; Products/Products/Product360/Stock/Policy |
| facility/FacilityServices | store#ProductFacilityPolicy | Maintenance/Facilities/FacilityDetail | Shared/InventoryAvailability/Policy; Products/Products/Product360/Stock/Policy; Warehouse/Locations/FacilityDetail/Products (with removeLocation) |
| facility/FacilityServices | store#Facility | Maintenance/Facilities; Maintenance/Facilities/FacilityDetail | Warehouse/Locations/Facilities; Warehouse/Locations/FacilityDetail; Warehouse/Locations/FacilityDetail/Children |
| facility/FacilityServices | store#FacilityLocation |  | Warehouse/Locations/FacilityDetail/Locations (with the storage type, P9) |
| facility/FacilityServices | store#FacilityLocationType |  | Warehouse/Locations/FacilityDetail/Locations |
| facility/FacilityServices | get#FacilityLocationBlockers |  | (close#FacilityLocation names the same blockers) |
| facility/FacilityServices | close#FacilityLocation |  | Warehouse/Locations/FacilityDetail/Locations |
| facility/FacilityServices | reopen#FacilityLocation |  | Warehouse/Locations/FacilityDetail/Locations |
| facility/FacilityServices | check#FacilityLocationOpen |  | (the destination guards of Warehouse P5, P7, P9) |
| facility/WarehousePolicyServices | resolve#WarehousePolicy |  | Shared/InventoryAvailability/Policy; Products/Products/Product360/Stock/Policy; Warehouse/Settings/StockPolicies (all tabs); Warehouse/Settings/ReservationPolicies; Shared/FacilityDetail/Policies |
| facility/WarehousePolicyServices | store#TrackingPolicy |  | Shared/InventoryAvailability/Policy; Products/Products/Product360/Stock/Policy; Warehouse/Settings/StockPolicies/TrackingPolicy; Warehouse/Settings/StockPolicies/ProductTrackingExceptions |
| facility/WarehousePolicyServices | store#OperationPolicy |  | Warehouse/Settings/StockPolicies/OperationPolicy; Shared/FacilityDetail/Policies |
| facility/WarehousePolicyServices | store#ReservationPolicy |  | Warehouse/Settings/ReservationPolicies/FacilityReservation; Shared/FacilityDetail/Policies |
| facility/WarehousePolicyServices | update#StoreReservation | Warehouse/Settings/ReservationPolicies | Warehouse/Settings/ReservationPolicies/StoreReservation |
| facility/WarehousePolicyServices | preview#FacilityReservations |  | Warehouse/Settings/ReservationPolicies/ReservationCheck |
| facility/WarehousePolicyServices | get#ReservationDefault |  | (Mantle's reservation: reserve#AssetsForOrder, checkReserve# and reserve#AssetForOrderItem) |
| facility/WarehousePolicyServices | get#ExpiryGate, get#AssetExpiry, check#AssetExpiryGate |  | (the expiry gate in Mantle's reserve#AssetForOrderItem, issue#AssetReservation, issue#Asset and issue#AssetToWorkEffort; the move guard's expiry warnings) |
| shipment/WarehouseTaskServices | move#Stock |  | Warehouse/Transfers/Move; Warehouse/Handheld/Move |
| shipment/WarehouseTaskServices | relocate#Assets |  | Warehouse/Inventory/Assets; Warehouse/Inventory/Availability/Locations (Relocate) |
| shipment/WarehouseTaskServices | attach#AssetToContainer, detach#AssetFromContainer, move#Container |  | Warehouse/Inventory/ContainerDetail |
| shipment/WarehouseTaskServices | repair#FacilityReservations |  | Warehouse/Settings/ReservationPolicies/ReservationCheck |
| shipment/WarehouseTaskServices | preview#StockAdjustment, adjust#Stock |  | Warehouse/Inventory/Adjustments (P6) |
| shipment/WarehouseTaskServices | scrap#Asset |  | Warehouse/Inventory/Adjustments (Scrap, opened from AssetDetail, Move and the Lots expiry list) |
| shipment/WarehouseTaskServices | correct#LotMetadata |  | Warehouse/Inventory/Lots (Correct) |
| shipment/WarehouseTaskServices | preview#Repack, repack#Asset |  | Warehouse/Transfers/Repack |
| shipment/WarehouseTaskServices | ensure#PurchaseReceipt |  | Warehouse/Receiving/Receipts (NewReceipt); Warehouse/Receiving/NewReceipt (quick create); close#ReceiptRemainder's backorder |
| shipment/WarehouseTaskServices | adjust#ExpectedReceipt |  | (Purchasing's order revision, when Purchasing is built) |
| shipment/WarehouseTaskServices | receive#ShipmentStock |  | Warehouse/Receiving/Receive and Warehouse/Handheld/Receive (ReceiveLine, GenerateTracking) |
| shipment/WarehouseTaskServices | receive#ExpectedShipment |  | Warehouse/Receiving/ReceiptDetail and Receive (Receive all as expected) |
| shipment/WarehouseTaskServices | receive#AdHocStock |  | Warehouse/Receiving/Receive (AdHocReceipt) |
| shipment/WarehouseTaskServices | close#ReceiptRemainder |  | Warehouse/Receiving/ReceiptDetail and Receive (Finish receipt) |
| shipment/WarehouseTaskServices | generate#TrackingIdentities |  | Warehouse/Receiving/Receive (GenerateTracking) |
| shipment/WarehouseTaskServices | putaway#Stock |  | Warehouse/Receiving/Putaway; Warehouse/Handheld/Putaway (P9) |
| shipment/WarehouseTaskServices | pack#ShipmentStock, pack#ShipmentAssembly |  | Warehouse/Shipping/Pack; Warehouse/Handheld/Pack; Warehouse/Inventory/MaterialIssueReceipt (P12) |
| shipment/WarehouseTaskServices | edit#ShipmentPackage, complete#Pack, reopen#ShipmentPackage |  | Warehouse/Shipping/Pack (PackageEditor, PackageContents, CompletePack, ReopenPackage; P12) |
| shipment/PackagingServices | store#ShipmentBoxType, store#CarrierShipmentBoxType |  | Warehouse/Locations/BoxTypes (P12) |
| shipment/PackagingServices | store#FacilityBoxType |  | Warehouse/Locations/FacilityDetail/BoxTypes (Shared/FacilityDetail/BoxTypes; P12) |
| account/InvoiceServices | release#ShipmentInvoiceLines |  | (internal: release#ShipmentDraftInvoice and reopen#ShipmentPackage, F275) |
| shipment/WarehouseTaskServices | create#Transfer |  | Warehouse/Transfers/Transfers (NewTransfer); Warehouse/Transfers/NewTransfer (quick create); allocate#InventoryRequest (P15) |
| shipment/WarehouseTaskServices | issue#TransferStock, ship#Transfer |  | Warehouse/Transfers/TransferShipmentDetail and SubcontractShipmentDetail (Origin pick and ship, P15) |
| shipment/WarehouseTaskServices | receive#TransferStock |  | Warehouse/Transfers/TransferShipmentDetail and SubcontractShipmentDetail (Destination receive, P15) |
| shipment/WarehouseTaskServices | dispatch#SubcontractStock |  | Warehouse/Transfers/SubcontractShipmentDetail (Move to the vendor-custody facility, or back, P15) |
| shipment/WarehouseTaskServices | allocate#InventoryRequest |  | Warehouse/Transfers/RequestDetail (Shared/RequestDetail, Allocate, P15) |
| request/RequestServices | add#InventoryRequestItem, approve#InventoryRequest |  | Warehouse/Transfers/RequestDetail (Add item, Approve); Warehouse/Transfers/StockRequests and NewStockRequest (the first item) (P15) |
| request/RequestServices | get#InventoryRequestProgress |  | Warehouse/Transfers/RequestDetail (InventoryRequestProgress); Warehouse/Transfers/StockRequests (progress) (P15) |
| facility/PutawayServices | store#PutawayRule, find#PutawayRules |  | Warehouse/Locations/PutawayRules (P9) |
| facility/PutawayServices | resolve#Destination |  | Warehouse/Receiving/Putaway; Warehouse/Handheld/Putaway; Warehouse/Receiving/PutawaySheet; Warehouse/Locations/PutawayRules (RuleTest); Warehouse/Receiving/Receive (step 1, inside receive#ShipmentStock and receive#AdHocStock) |
| facility/PutawayServices | get#Capacity |  | (the resolver's capacity; the Capacity screen is impl-warehouse §7) |
| product/QualityServices | store#InspectionTemplate, get#InspectionTemplate, find#InspectionTemplates |  | Warehouse/Inspection/InspectionTemplates (Shared/InspectionTemplates); Warehouse/Inspection/TemplatePrint (impl-warehouse P8) |
| product/QualityServices | create#Inspection |  | (receive#ShipmentStock, for a receipt that needs inspection, in its own operation) |
| product/QualityServices | assign#Inspection, save#InspectionReading, submit#Inspection, verify#Inspection, dispose#Inspection, get#Inspection |  | Warehouse/QualityInspection (Shared/QualityInspection); Warehouse/Inspection/Inspections (board moves and Reassign); Warehouse/InspectionCertificate |
| product/QualityServices | find#Inspections |  | Warehouse/Inspection/Inspections; Warehouse/Receiving/ReceiptDetail (Inspection) |
| product/QualityServices | get#SourceInspectionStatus |  | (Accounting's bill matching, InvoiceMatch.js receiptsOf: held quantity, F31) |
| product/QualityServices | create#InspectionContent |  | Warehouse/QualityInspection (Evidence: record files) |
| order/ReturnServices | find#ReturnableReceipts |  | Warehouse/Returns/ReturnDetail (Eligible items of a supplier return; Purchasing's contract, impl-warehouse P14) |
| order/ReturnServices | add#ReceiptToReturn |  | Warehouse/Returns/ReturnDetail (Eligible items, Add) |
| order/ReturnServices | create#ReturnContent, save#ReturnContentFile |  | Warehouse/Returns/ReturnDetail (Files: record files) |
| shipment/WarehouseTaskServices | issue#SupplierReturnStock |  | Warehouse/Returns/SupplierReturnShipment (Send back) |
| shipment/WarehouseTaskServices | ship#SupplierReturn |  | Warehouse/Returns/SupplierReturnShipment (Ship) |
| shipment/WarehouseTaskServices | request#ReturnLabel |  | (Customer Service's Issue return label, when it is built; on the recorded gateway path since P13, F331) |
| shipment/WarehouseTaskServices | get#ShipmentRates |  | Warehouse/Shipping/Ship (RateOptions); Warehouse/Locations/Carriers (CarrierTest) (P13) |
| shipment/WarehouseTaskServices | request#PackageLabels, refund#PackageLabels |  | Warehouse/Shipping/Ship (Labels: Buy labels, Return labels, Refund) (P13) |
| shipment/WarehouseTaskServices | track#PackageLabels |  | Warehouse/Shipping/PackageTracking (Refresh tracking) (P13) |
| shipment/WarehouseTaskServices | record#ManualTracking |  | Warehouse/Shipping/Ship (ManualCarrier) (P13) |
| shipment/WarehouseTaskServices | record#PackageDelivery |  | Warehouse/Shipping/PackageTracking (RecordDelivery) (P13) |
| shipment/WarehouseTaskServices | ship#OutgoingShipment, get#ShipReadiness |  | Warehouse/Shipping/Ship (ShipConfirm) (P13) |
| shipment/WarehouseTaskServices | record#ShippingGatewayRequests, finish#ShippingGatewayRequests, record#ReturnLabelRequest |  | (internal to the gateway entry points, P13) |
| shipment/carrier/TestGatewayServices | get#ShippingRatesBulk, get#ShippingRate, request#ShippingLabels, find#ShippingLabels, refund#ShippingLabels, track#ShippingLabels, validate#ShippingPostalAddress |  | The Mantle test carrier (TEST_SHIPPING), reached through Ship, PackageTracking and Carriers (P13) |
| shipment/carrier/CarrierSetupServices | store#CarrierShipmentMethod, store#ShippingGatewayCarrier |  | Warehouse/Locations/Carriers (CarrierMethods, carrier bindings) (P13) |
| facility/PrintServices | dispatch#Document |  | Warehouse/Shipping/Ship (Print labels, Reprint); Warehouse/Locations/Printers and Shared/FacilityDetail/Printers (PrinterTest) (P13) |
| facility/PrintServices | get#PrinterCapabilities |  | Warehouse/Locations/Printers (PrinterIndex) (P13) |
| facility/PrintServices | store#FacilityPrinter |  | Shared/FacilityDetail/Printers (Bind printer, End) (P13) |
| order/OrderServices | close#PurchaseRemainders |  | (Purchasing's ClosePurchaseOrders when built; its close runs inside close#ReceiptRemainder) |
| other/BudgetServices | release#ClosedSourceCommitments |  | (internal to close#PurchaseRemainders) |
| product/AssetPoolServices | find#AssetPools, get#AssetPool, store#AssetPool, store#AssetPoolParty, store#AssetPoolStore, preview#AssetPoolReservations |  | Warehouse/Settings/AssetPools/PoolList; Warehouse/Settings/AssetPools/PoolDetail |
| ledger/AssetBookServices | preview#Revaluation |  | Shared/InventoryValuation (Products mount); Accounting/Inventory/InventoryValuation |
| ledger/AssetBookServices | get#RevaluationPreview |  | Shared/InventoryValuation (Products mount) |
| ledger/AssetBookServices | post#Revaluation |  | Shared/InventoryValuation (Products mount); Accounting/Inventory/InventoryValuation |
| ledger/AssetBookServices | get#RevaluationContext |  | Shared/InventoryValuation (Products mount); Accounting/Inventory/InventoryValuation |
| product/IdentifierServices | get#IdentifierContext |  | Shared/IdentificationTypes; Products/Settings/IdentificationTypes |
| product/IdentifierServices | store#IdentifierPolicy |  | Shared/IdentificationTypes; Products/Settings/IdentificationTypes |
| product/PriceServices | get#PricingSettings |  | Products/Settings/PricingSettings; Shared/Prices; Shared/SupplierPrices |
| product/PriceServices | store#PricingSettings |  | Products/Settings/PricingSettings; Shared/Prices; Shared/SupplierPrices |


## Accounting native additions — P0–P3 (Oct 29, 2026)

The screens call these native services after BOSS access context. Reviewed posting replaces raw/unrestricted ledger
mutators in the app. Legacy unpost, posted rewrite and post#GlJournal remain unexposed.

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| AccountingServices | get#Access | Accounting (scoped records and QuickCreate) | Native contract (not directly mounted) |
| AccountingServices | find#Records | Accounting (scoped records and QuickCreate) | Accounting/GeneralLedger/ChartOfAccounts; Accounting/GeneralLedger/JournalBatches; Accounting/GeneralLedger/JournalEntries; Accounting/GeneralLedger/JournalTemplates; Accounting/GeneralLedger/TransactionEntries; Accounting/Payables/Bills; Accounting/Payments/Payments; Accounting/PeriodClose/PeriodLocks; Accounting/PeriodClose/Periods; Accounting/Receivables/Invoices |
| AccountingServices | get#Record | Accounting (scoped records and QuickCreate) | Accounting/GeneralLedger/AccountDetail; Accounting/GeneralLedger/JournalEntryDetail; Accounting/GeneralLedger/JournalTemplates; Accounting/Payables/BillDetail; Accounting/Payments/PaymentDetail; Accounting/Receivables/InvoiceDetail |
| AccountingServices | create#DraftDocument | Accounting (scoped records and QuickCreate) | Accounting/QuickCreate/NewBill; Accounting/QuickCreate/NewInvoice; Accounting/QuickCreate/NewPayment |
| JournalServices | store#DraftEntry | Accounting/GeneralLedger/JournalEntryDetail; Accounting/GeneralLedger/JournalBatches; Accounting/GeneralLedger/JournalTemplates | Accounting/GeneralLedger/JournalEntryDetail; Accounting/QuickCreate/NewEntry |
| JournalServices | store#DraftLine | Accounting/GeneralLedger/JournalEntryDetail; Accounting/GeneralLedger/JournalBatches; Accounting/GeneralLedger/JournalTemplates | Accounting/GeneralLedger/JournalEntryDetail |
| JournalServices | delete#DraftLine | Accounting/GeneralLedger/JournalEntryDetail; Accounting/GeneralLedger/JournalBatches; Accounting/GeneralLedger/JournalTemplates | Accounting/GeneralLedger/JournalEntryDetail |
| JournalServices | delete#DraftEntry | Accounting/GeneralLedger/JournalEntryDetail; Accounting/GeneralLedger/JournalBatches; Accounting/GeneralLedger/JournalTemplates | Accounting/GeneralLedger/JournalEntryDetail |
| JournalServices | move#DraftLine | Accounting/GeneralLedger/JournalEntryDetail; Accounting/GeneralLedger/JournalBatches; Accounting/GeneralLedger/JournalTemplates | Accounting/GeneralLedger/JournalEntryDetail |
| JournalServices | preview#Entry | Accounting/GeneralLedger/JournalEntryDetail; Accounting/GeneralLedger/JournalBatches; Accounting/GeneralLedger/JournalTemplates | Accounting/GeneralLedger/JournalEntryDetail |
| JournalServices | post#Entry | Accounting/GeneralLedger/JournalEntryDetail; Accounting/GeneralLedger/JournalBatches; Accounting/GeneralLedger/JournalTemplates | Accounting/GeneralLedger/JournalEntryDetail |
| JournalServices | reverse#Entry | Accounting/GeneralLedger/JournalEntryDetail; Accounting/GeneralLedger/JournalBatches; Accounting/GeneralLedger/JournalTemplates | Accounting/GeneralLedger/JournalEntryDetail |
| JournalServices | update#PostedMetadata | Accounting/GeneralLedger/JournalEntryDetail; Accounting/GeneralLedger/JournalBatches; Accounting/GeneralLedger/JournalTemplates | Accounting/GeneralLedger/JournalEntryDetail |
| JournalServices | store#Batch | Accounting/GeneralLedger/JournalEntryDetail; Accounting/GeneralLedger/JournalBatches; Accounting/GeneralLedger/JournalTemplates | Accounting/GeneralLedger/JournalBatches |
| JournalServices | validate#Batch | Accounting/GeneralLedger/JournalEntryDetail; Accounting/GeneralLedger/JournalBatches; Accounting/GeneralLedger/JournalTemplates | Accounting/GeneralLedger/JournalBatches; Accounting/GeneralLedger/JournalEntries |
| JournalServices | post#Batch | Accounting/GeneralLedger/JournalEntryDetail; Accounting/GeneralLedger/JournalBatches; Accounting/GeneralLedger/JournalTemplates | Accounting/GeneralLedger/JournalBatches; Accounting/GeneralLedger/JournalEntries |
| JournalServices | store#Template | Accounting/GeneralLedger/JournalEntryDetail; Accounting/GeneralLedger/JournalBatches; Accounting/GeneralLedger/JournalTemplates | Accounting/GeneralLedger/JournalTemplates |
| JournalServices | store#TemplateLines | Accounting/GeneralLedger/JournalEntryDetail; Accounting/GeneralLedger/JournalBatches; Accounting/GeneralLedger/JournalTemplates | Native contract (not directly mounted) |
| JournalServices | create#FromTemplate | Accounting/GeneralLedger/JournalEntryDetail; Accounting/GeneralLedger/JournalBatches; Accounting/GeneralLedger/JournalTemplates | Accounting/GeneralLedger/JournalTemplates |
| JournalServices | get#Preview | Accounting/GeneralLedger/JournalEntryDetail; Accounting/GeneralLedger/JournalBatches; Accounting/GeneralLedger/JournalTemplates | Accounting/GeneralLedger/JournalEntryDetail |
| JournalServices | get#BatchPreview | Accounting/GeneralLedger/JournalEntryDetail; Accounting/GeneralLedger/JournalBatches; Accounting/GeneralLedger/JournalTemplates | Accounting/GeneralLedger/JournalBatches; Accounting/GeneralLedger/JournalEntries |
| JournalServices | store#TemplateLine | Accounting/GeneralLedger/JournalEntryDetail; Accounting/GeneralLedger/JournalBatches; Accounting/GeneralLedger/JournalTemplates | Accounting/GeneralLedger/JournalTemplates |
| JournalServices | publish#Template | Accounting/GeneralLedger/JournalEntryDetail; Accounting/GeneralLedger/JournalBatches; Accounting/GeneralLedger/JournalTemplates | Accounting/GeneralLedger/JournalTemplates |
| JournalServices | delete#TemplateLine | Accounting/GeneralLedger/JournalEntryDetail; Accounting/GeneralLedger/JournalBatches; Accounting/GeneralLedger/JournalTemplates | Accounting/GeneralLedger/JournalTemplates |
| CloseServices | store#Lock | Accounting/PeriodClose/PeriodLocks | Accounting/PeriodClose/PeriodLocks |
| CloseServices | grant#Exception | Accounting/PeriodClose/PeriodLocks | Accounting/PeriodClose/PeriodLocks |
| AccountServices | store#Account | Accounting/GeneralLedger/ChartOfAccounts; Accounting/GeneralLedger/AccountDetail; Accounting/PeriodClose/Periods | Accounting/GeneralLedger/AccountDetail; Accounting/GeneralLedger/ChartOfAccounts |
| AccountServices | store#Assignment | Accounting/GeneralLedger/ChartOfAccounts; Accounting/GeneralLedger/AccountDetail; Accounting/PeriodClose/Periods | Accounting/GeneralLedger/AccountDetail; Accounting/GeneralLedger/ChartOfAccounts |
| AccountServices | ensure#Periods | Accounting/GeneralLedger/ChartOfAccounts; Accounting/GeneralLedger/AccountDetail; Accounting/PeriodClose/Periods | Accounting/PeriodClose/Periods |
| AccountServices | get#Classifications | Accounting/GeneralLedger/ChartOfAccounts; Accounting/GeneralLedger/AccountDetail; Accounting/PeriodClose/Periods | Accounting/GeneralLedger/AccountDetail |
| AccountServices | store#Classification | Accounting/GeneralLedger/ChartOfAccounts; Accounting/GeneralLedger/AccountDetail; Accounting/PeriodClose/Periods | Accounting/GeneralLedger/AccountDetail |
| SetupServices | get#Preferences | Accounting/Home; Accounting/Settings | Accounting/Settings/AccountingPreferences (get#Context); Accounting/Settings/Settings |
| SetupServices | store#Preferences | Accounting/Home; Accounting/Settings | Accounting/Settings/AccountingPreferences; Accounting/Settings/DocumentSettings |
| SetupServices | get#PostingDefaults | Accounting/Home; Accounting/Settings | Accounting/Settings/PostingDefaults |
| SetupServices | store#PostingDefault | Accounting/Home; Accounting/Settings | Accounting/Settings/PostingDefaults; Accounting/Records/Product360 (GL mappings) |
| SetupServices | clone#Preferences | Accounting/Home; Accounting/Settings | Accounting/Settings/AccountingPreferences |
| SetupServices | store#SettlementTerm | Accounting/Home; Accounting/Settings | Accounting/Settings/PaymentTerms |
| SetupServices | get#PaymentMethods | Accounting/Home; Accounting/Settings | Accounting/Settings/PaymentMethods; Accounting/Settings/PaymentMethods (get#Context) |
| SetupServices | store#PaymentMethod | Accounting/Home; Accounting/Settings | Accounting/Settings/PaymentMethods |
| SetupServices | get#Context | Accounting/Home; Accounting/Settings | Accounting/Settings/AccountingPreferences; Accounting/Settings/Currencies; Accounting/Settings/DocumentSettings; Accounting/Settings/PaymentTerms |
| SetupServices | get#Readiness | Accounting/Home; Accounting/Settings | Accounting/Home (setupStatus offers Setup first); native contract |
| SetupServices | store#SetupRun | Accounting/Settings/Setup | Accounting/Settings/Setup/Basis; Accounting/Settings/Setup/OpeningBalances |
| SetupServices | preview#OpeningBalances | Accounting/Settings/Setup | Accounting/Settings/Setup (every step) |
| SetupServices | import#OpenItems | Accounting/Settings/Setup | Accounting/Settings/Setup/OpenItems |
| SetupServices | create#OpenItem | Accounting/Settings/Setup | Accounting/Settings/Setup/OpenItems (import#OpenItems, a row each) |
| SetupServices | check#Readiness | Accounting/Settings/Setup; Admin/Operations/Health | Accounting/Settings/Setup/Readiness; Accounting/Settings/Setup/Activate |
| SetupServices | activate#Accounting | Accounting/Settings/Setup | Accounting/Settings/Setup/Activate |
| CurrencyServices | store#Rate | Accounting/Settings/Currencies | Accounting/Settings/Currencies |
| CurrencyServices | store#Currency | Accounting/Settings/Currencies | Accounting/Settings/Currencies |
| CurrencyServices | import#Rates | Accounting/Settings/Currencies | Accounting/Settings/Currencies |
| CurrencyServices | get#ImportResult | Accounting/Settings/Currencies | Accounting/Settings/Currencies |
| CurrencyServices | refresh#Rates | Accounting/Settings/Currencies | Accounting/Settings/Currencies (Fetch rates) |
| CurrencyServices | get#EcbRates | Accounting/Settings/Currencies | Accounting/Settings/Currencies (the shipped provider of refresh#Rates) |
| CurrencyServices | get#RateProposals | Accounting/Settings/Currencies | Accounting/Settings/Currencies (Proposed rates) |
| CurrencyServices | accept#RateProposals | Accounting/Settings/Currencies | Accounting/Settings/Currencies (Accept selected) |
| CurrencyServices | reject#RateProposals | Accounting/Settings/Currencies | Accounting/Settings/Currencies (Reject selected) |
| FinanceReportServices | run#TrialBalance | Accounting/Reports/TrialBalance; Accounting/Reports/GeneralLedger; Insights/Dashboard; Insights/Panels/PanelDetail; Insights/ReportBuilder/Analysis; Insights/ManagementDigest | Accounting/Reports/TrialBalance |
| FinanceReportServices | run#GeneralLedger | Accounting/Reports/TrialBalance; Accounting/Reports/GeneralLedger; Insights/Dashboard; Insights/Panels/PanelDetail; Insights/ReportBuilder/Analysis; Insights/ManagementDigest | Accounting/Reports/GeneralLedger |
| JournalContentServices | create#Content | Accounting/GeneralLedger/JournalEntryDetail (RecordFiles) | Shared/RecordFiles (Accounting journal context) |
| JournalContentServices | save#ContentFile | Accounting/GeneralLedger/JournalEntryDetail (RecordFiles) | Shared/RecordFiles (Accounting journal context) |
| TaxServices | store#Authority | Accounting/Tax/TaxAuthorities | Accounting/Tax/TaxAuthorities |
| TaxServices | store#Rate | Accounting/Tax/TaxRates | Accounting/Tax/TaxRates |
| TaxServices | simulate#SalesTax | Accounting/Tax/TaxRates; Commerce/Settings/CheckoutSettings | Accounting/Tax/TaxRates |
| TaxServices | find#SalesTaxLines | Accounting/Tax/TaxStatementDetail | Accounting/Tax/TaxStatementDetail (get#StatementDetail) |
| TaxServices | create#SalesTaxStatement | Accounting/Tax/TaxStatements | Accounting/Tax/TaxStatements |
| TaxServices | run#Vendor1099Statements | Accounting/Tax/TaxStatements | Accounting/Tax/TaxStatements |
| TaxServices | export#Statement | Accounting/Tax/TaxStatementDetail | Accounting/Tax/TaxStatementDetail |

## Accounting native additions — P13 valuation and landed costs (Oct 31, 2026)

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| product/InventoryReportServices | run#InventoryValuation | Accounting/Inventory/InventoryValuation; Insights/Dashboard; Insights/Panels/PanelDetail; Insights/ReportBuilder/Analysis; Insights/ManagementDigest | Accounting/Inventory/InventoryValuation (Shared/InventoryValuation) |
| product/InventoryReportServices | run#StockTransactions | Accounting/Reports/StockTransactions; Insights/Dashboard; Insights/Panels/PanelDetail; Insights/ReportBuilder/Analysis; Insights/ManagementDigest | Accounting/Reports/StockTransactions |
| product/InventoryReportServices | get#ProductAccounting | Accounting/Records/Product360 | Accounting/Records/Product360 (Shared/Product360) |
| product/InventoryReportServices | check#ValuationClose | Accounting/PeriodClose/PeriodCloseDetail | Accounting/PeriodClose/PeriodCloseDetail (CloseServices.get#Checklist) |
| ledger/AssetBookServices | get#LandedCostSources | Accounting/Payables/LandedCosts | Accounting/Payables/LandedCosts |
| ledger/AssetBookServices | preview#LandedCost | Accounting/Payables/LandedCosts | Accounting/Payables/LandedCosts |
| ledger/AssetBookServices | post#LandedCost | Accounting/Payables/LandedCosts | Accounting/Payables/LandedCosts |
| ledger/AssetBookServices | repair#ProductAcquireCost | Accounting/Inventory/InventoryValuation | Accounting/Inventory/InventoryValuation |

## Source-verified shared asset-book services (Maintenance design, Oct 31, 2026)

These existing services in `mantle/ledger/AssetBookServices.xml` are used by the Accounting-owned Book pane mounted in Maintenance. Their presence is source-verified; this design adds no implementation mappings and grants no financial authority.

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| ledger/AssetBookServices | get#AssetBook | Maintenance/Equipment/EquipmentDetail |  |
| ledger/AssetBookServices | capitalize#Asset | Maintenance/Equipment/EquipmentDetail |  |
| ledger/AssetBookServices | adjust#AssetBook | Maintenance/Equipment/EquipmentDetail |  |
| ledger/AssetBookServices | dispose#Asset | Maintenance/Equipment/EquipmentDetail |  |
| ledger/AssetBookServices | reverse#AssetBookEvent | Maintenance/Equipment/EquipmentDetail |  |

## Sales design — source-verified service additions

These active definitions were verified for the Sales design. The original section counts
remain historical; these rows add no implementation claim.

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| order/OrderServices | hold#Order | Sales/Orders/OrderDetail |  |
| order/OrderServices | release#OrderHold | Sales/Orders/OrderDetail |  |
| party/ExternalAccessServices | check#AccessCapability | PASS:Sales/CustomerQuote; PASS:Sales/QuoteResponse |  |
| party/ExternalAccessServices | create#AccessCapability | Sales/Orders/OrderDetail |  |
| party/ExternalAccessServices | invite#Contact | Sales/Accounts/Customer360; Sales/Accounts/ContactDetail |  |
| party/ExternalAccessServices | revoke#AccessCapability | Sales/Orders/OrderDetail |  |
| product/PriceServices | find#ProductPrices | Sales/Agreements/CustomerPrices; Sales/Agreements/AgreementDetail |  |
| sales/SalesReportServices | run#SalesAnalysis | Sales/Reports/SalesAnalysis; Insights/Dashboard; Insights/Panels/PanelDetail; Insights/ReportBuilder/Analysis; Insights/ManagementDigest |  |

## Marketing design — source-verified service additions

This active EventServices definition was verified for the shared calendar mount. Existing section
counts remain historical. Worker-only list-send/receipt helpers and proposed Marketing services
are not added as screen-call or implementation claims.

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| work/EventServices | get#EventInstances | Marketing/Calendar |  |

## Design review fixes — source-verified service additions (Nov 1, 2026)

These existing definitions are called by screens of the designs as fixed after the suite review
and had no row. Section counts above remain historical; these rows add no implementation claim.

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| ledger/LedgerReportServices | run#PartnerLedger | Accounting/Reports/PartnerLedger; Insights/Dashboard; Insights/Panels/PanelDetail; Insights/ReportBuilder/Analysis; Insights/ManagementDigest |  |
| ledger/LedgerReportServices | run#InvoiceReconciliation | Accounting/Reports/InvoiceReconciliation; Insights/Dashboard; Insights/Panels/PanelDetail; Insights/ReportBuilder/Analysis; Insights/ManagementDigest |  |
| product/AssetRecordServices | update#AssetMetadata | Maintenance/Equipment/EquipmentDetail |  |
| public/SiteServices | get#SitePage | PASS:Shop/Page |  |
| public/SiteServices | publish#SitePage | Shared/PageDetail; Commerce/Website/Pages/PageDetail; Marketing/Content/LandingPages/PageDetail |  |
