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
- **Implemented in** for [design-manufacturing.md](design-manufacturing.md) was filled phase by phase during the Manufacturing build and checked on Nov 4, 2026 at its end (impl-manufacturing.md P17): each Manufacturing screen, its shared mounts and its new Mantle services (`mantle.work.Production*Services`, `SupplyPlanningServices`, `ProductionCostServices`) that call the service; a service a Manufacturing screen was designed to call and does not is `—` with what it calls instead.
- **Implemented in** for [design-purchasing.md](design-purchasing.md) was filled phase by phase during the Purchasing build and completed on Nov 4, 2026 at its end (impl-purchasing.md P17): every service with a Purchasing **Designed in** path names the Purchasing screen that calls it, or `—` with the Purchasing service called instead and the phase.
- **Implemented in** for [design-admin.md](design-admin.md) was filled phase by phase during the Admin build and completed on Nov 11, 2026 at its end (impl-admin.md P19): every service with an Admin **Designed in** path names the Admin screen that calls it, mostly through `mantle.party.IdentityServices` (accounts, invitations, internal organizations and their defaults), or `—` with what Admin does instead and the phase. The framework's `org.moqui.admin` services and BOSS's `ironstone.admin` are outside this inventory (design-admin §17.2).
- **Implemented in** for [design-commerce.md](design-commerce.md) and [design-shop.md](../../mr-pass/plan/design-shop.md) was filled phase by phase during the Commerce and Shop build and completed on Nov 7, 2026 at its end (impl-commerce.md P15, which does both plans' inventories, impl-shop F59): every service with a Commerce or `PASS:Shop` **Designed in** path names the Commerce screen or Shop page that calls it, through the Commerce and Shop services (`mantle.order.ShopCartServices`, `ShopCheckoutServices`, `mantle.party.ShopCustomerServices`, `StoreOperationsServices`, `StoreChannelServices`), or `—` with what Commerce or Shop does instead and the phase. Commerce's OrderDetail is read only (its order work is Customer Service's and Accounting's).
- **Implemented in** for [design-maintenance.md](design-maintenance.md) was filled phase by phase during the Maintenance build and checked on Nov 12, 2026 at its end (impl-maintenance.md P20): every service with a Maintenance **Designed in** path names the Maintenance screen (and tab or action) or Mantle service that carries it, or `—` with why. The check filled eight blank rows (Accounting's book services, read only in EquipmentDetail's Book tab, their actions Accounting's; the asset metadata writer, Warehouse's; the facility certification writer, not built) and gave the Maintenance part of rows that named only another app: a managed work order's assignments through `schedule#MaintenanceWorkOrder`, its timer through Maintenance's own timer services, its files on the WorkEffort, and the facility location and product policy services, which Maintenance's FacilityDetail context does not carry. Dispatch's rows (`find#StaffingCandidates`, `get#PartyCapacity`) are P8's and customer repair's P12's, filled by those phases.
- **Implemented in** for [design-people.md](design-people.md) was filled phase by phase during the People build and checked on Nov 13, 2026 at its end (impl-people.md P31): every HumanRes row and every People row of the Added table names the People screen (and form, region or transition) that calls it, or `—` with why; P31 filled the 33 HumanRes rows left blank, the legacy payroll services (PayrollServices, `check#NextPayrollTimePeriods`) and the statutory documents (PayrollDocumentServices) that People neither calls nor reads (design-people §8.4), `delete#Employment` (an employment is ended, never deleted) and `get#PartyEmployersAndPositionClasses`.

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

**Insights P4 (Nov 7, 2026):** the report services of design-insights §6.2 that Insights registers as metric sources
(ironstone.insights.MetricRegistration `serviceName`: `get#SalesOrderSummary`, `get#SalesInvoiceSummary`,
`get#InventoryProjectedInfo`, `get#InventoryAtDate`, `get#Utilization`, `get#OperationPerformanceReport`) and the services its
catalog entries name (`sourceReference`) are registrations, not calls: no Insights screen calls them yet, so their
**Implemented in** is unchanged (design §6.2: a registration does not promote a capability). The Insights paths of their
**Designed in** cells say `Insights/Panels/PanelDetail`, which was built as `Insights/PanelDetail` (impl-insights F46).

**Insights P12 (Nov 11, 2026):** **Implemented in** checked for every Insights row at the end of the Insights build. The root
calls `setup#UserOrganizationInfo` and every Insights screen `get#PartyOrganizationInfo` (through `get#Context`); Settings
writes `store#PartySetting`; Home's attention board calls the registered count services as the viewer (`find#Payables`,
`AccountingServices.find#Records`). The §6.2 report services stay registrations, not calls (P4's note). Mantle services Insights
calls that are newer than this inventory have no row: `StoreOperationsServices.get#StoreWorkSummary` and
`StoreChannelServices.get#ChannelHealth` (Home's attention counts), `PartyServices.get#OrganizationRowFilter` (the report
engine's scope policy, `MantleOrganization`), `BusinessEventServices.record#BusinessEvent` (the owners' business markers) and
`IdentityServices.find#SharedDevices` (Playlists' devices, P11).

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
| InvoiceServices | get#InvoiceDisplayInfo | Purchasing/Bills/InvoiceDetail; Accounting/Receivables/InvoiceDetail; Shared/Customer360; Shared/Supplier360; Shared/InvoiceDetail | — (replaced by mantle.account.InvoiceServices.get#InvoiceFinanceDetail and, on Customer360, mantle.account.CustomerFinanceServices.get#CustomerFinance); — Purchasing/Bills/InvoiceDetail: ironstone.purchasing.BillServices.get#BillDetail (Purchasing P6) |
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
| InvoiceServices | create#ProjectExpenseInvoice | Accounting/Receivables/BillingQueue; People/Expenses/ExpenseClaims | People/Expenses/ExpenseClaims (NewClaim, its expenseClaim write: employer authorization, self scope and the ExpenseClaim record, F21; People P15); Accounting/Receivables/BillingQueue bills approved time only |
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
| InvoiceServices | apply#InvoiceToOrder | Purchasing/Bills/InvoiceDetail; Shared/InvoiceDetail | — (replaced by mantle.account.InvoiceMatchServices.apply#InvoiceMatch on Accounting/Payables/BillDetail/Match); — Purchasing/Bills/InvoiceMatch: apply#InvoiceMatch (Purchasing P6) |
| InvoiceServices | apply#InvoiceItemToOrder | Purchasing/Bills/InvoiceDetail; Shared/InvoiceDetail | — (replaced by mantle.account.InvoiceMatchServices.apply#InvoiceMatch on Accounting/Payables/BillDetail/Match); — Purchasing/Bills/InvoiceMatch: apply#InvoiceMatch (Purchasing P6) |
| InvoiceServices | unapply#InvoiceItemFromOrder | Shared/InvoiceDetail | — (replaced by mantle.account.InvoiceMatchServices.unapply#InvoiceMatch on Accounting/Payables/BillDetail/Match) |
| InvoiceServices | apply#InvoiceToShipment | Purchasing/Bills/InvoiceDetail; Shared/InvoiceDetail | — (not built; a bill match links receipts, not shipment item sources); — Purchasing: not built (Purchasing P6) |
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
| PaymentMethodServices | get#PartyPaymentMethodInfoList | Accounting/Banking/BankAccounts; Accounting/Settings/PaymentMethods; PASS:Shop/Account/PaymentMethods; PASS:Shop/Checkout | — (replaced by mantle.account.ReconciliationServices.find#BankAccounts and mantle.ledger.SetupServices.get#PaymentMethods); — Shop: PASS:Shop/Account/PaymentMethods (mantle.party.ShopCustomerServices.get#PaymentMethods, masked) and the checkout's options (ShopCheckoutServices.get#PaymentOptions) (Shop P5, P6) |
| PaymentMethodServices | store#PaymentMethodInfo | Accounting/Settings/PaymentMethods; PASS:Shop/Account/PaymentMethods | — (replaced by mantle.ledger.SetupServices.store#PaymentMethod on Accounting/Settings/PaymentMethods); — Shop: a card is added through the gateway's hosted setup (ShopCustomerServices.begin#PaymentMethodSetup, finish#PaymentMethodSetup on PASS:Shop/Account/PaymentMethods), never typed into Shop (Shop P6) |
| PaymentMethodServices | update#PaymentMethodMutable | Accounting/Settings/PaymentMethods | Accounting/Banking/StatementImport (through mantle.account.ReconciliationServices.commit#StatementImport); Accounting/Settings/PaymentMethods edits through mantle.ledger.SetupServices.store#PaymentMethod |
| PaymentMethodServices | delete#PaymentMethod | PASS:Shop/Account/PaymentMethods | PASS:Shop/Account/PaymentMethods (through ShopCustomerServices.end#PaymentMethod; Shop P6) |
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
| PaymentServices | authorize#OrderPayments | Shared/OrderDetail; PASS:Shop/Checkout; Commerce/Orders/OrderDetail; Sales/Orders/OrderDetail | — Shop: the hosted payment page's attempt (ShopCheckoutServices.submit#Checkout, get#CheckoutPaymentResult over PortalPaymentAttempt; Shop P5); — Commerce/Orders/OrderDetail read only (StoreOperationsServices.get#StoreOrder; its order work is Customer Service's and Accounting's; Commerce P8) |
| PaymentServices | authorize#StorePayment |  |  |
| PaymentServices | authorize#SinglePayment |  |  |
| PaymentServices | get#AuthorizePaymentGatewayResponse |  |  |
| PaymentServices | capture#InvoicePayments |  |  |
| PaymentServices | capture#AppliedPayment |  |  |
| PaymentServices | capture#SinglePayment |  |  |
| PaymentServices | release#SinglePayment |  | Commerce/Orders/CartDetail (ResolvePlacement: a stuck Shop placement's kept payment, through ShopOperationsServices.resolve#StuckPlacement) (Shop P8) |
| PaymentServices | refund#SinglePayment |  | Commerce/Orders/CartDetail (ResolvePlacement: a stuck Shop placement's kept payment, through ShopOperationsServices.resolve#StuckPlacement) (Shop P8) |
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
| InvoiceServices | send#Invoice |  | Accounting/Receivables/InvoiceDetail; Projects/Billing/InvoiceDetail; CustomerService/Orders/InvoiceDetail (Send a copy, for RECEIVABLE_EDIT; Customer Service P3) |
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
| CreditServices | get#CustomerCreditStatus | Accounting/Receivables/Customer360 | Accounting/Receivables/Customer360/Credit; CustomerService/Customers/Customer360/ServiceBilling (read only, for CUSTOMER_CREDIT_VIEW; Customer Service P3) |
| OrderServices | hold#Order | Shared/OrderDetail; Commerce/Orders/OrderDetail | (CreditServices.evaluate#OrderCredit); Purchasing/Orders/OrderDetail (Hold, a Purchase reason; Purchasing P3); CustomerService/Orders/OrderChangeDetail (ApplyChange: the Change hold, through OrderChangeServices.apply#OrderChange; Customer Service P10); PASS:Shop/Checkout (an amount mismatch or failed capture holds the placed order, OhtPayment, ShopCheckout.js; Shop P5); — Commerce: OrderDetail shows the hold read only, Accounting releases it (Commerce P8, X4) |
| OrderServices | release#OrderHold | Shared/OrderDetail; Commerce/Orders/OrderDetail | (CreditServices.release#CreditHold); Purchasing/Orders/OrderDetail (Release hold, a Purchase reason; Purchasing P3); CustomerService/Orders/OrderChangeDetail (ApplyChange releases its Change hold, another hold kept; Customer Service P10); — Commerce: the OhtPayment hold is shown read only on Commerce/Orders/OrderDetail with a link to Accounting, which releases it (Commerce P8, X4) |
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
| InvoiceServices | find#Payables | Accounting/Payables/Bills | Accounting/Payables/Bills; Accounting/Payables/ExpensePosting (through PayableScreenServices.find#Bills); Insights/Home (an attention provider's count, as the viewer; Insights P5) |
| InvoiceServices | import#Bill | Accounting/Payables/Bills | Accounting/Payables/Bills#BillUploadForm; Accounting/Records/OrderDetail#OrderBillUploadForm; Purchasing/Bills/BillList#UploadSupplierBill; Purchasing/Orders/OrderDetail#PurchaseOrderUploadBillForm (Purchasing P6) |
| InvoiceServices | create#InvoiceFromSource | Accounting/Records/OrderDetail; Accounting/Records/ShipmentDetail; Sales/Orders/OrderDetail | Accounting/Records/OrderDetail#InvoiceFromOrderForm; Accounting/Records/ShipmentDetail#BillReceiptForm; Purchasing/Receiving/ShipmentDetail (Create draft bill, AP intake, received basis) (Purchasing P5); Purchasing/Orders/OrderDetail#PurchaseOrderDraftBillForm (Purchasing P6) |
| InvoiceServices | request#PayableApproval |  | Accounting/Payables/BillDetail |
| InvoiceServices | approve#Payable | Accounting/Payables/BillDetail; Accounting/Payables/ExpensePosting | Accounting/Payables/BillDetail; Accounting/Payables/ExpensePosting |
| InvoiceServices | hold#Invoice | Accounting/Payables/Bills; Accounting/Payables/BillDetail | Accounting/Payables/Bills#HoldSelectedBills; Accounting/Payables/BillDetail#BillHoldForm; Accounting/Payables/ExpensePosting |
| InvoiceServices | request#HoldRelease | Accounting/Payables/BillDetail | Accounting/Payables/BillDetail/Holds; Purchasing/Bills/InvoiceDetail (PurchasingBillHoldList); Purchasing/Bills/MatchExceptions#RequestHoldRelease (Purchasing P6) |
| InvoiceServices | release#InvoiceHold | Accounting/Payables/BillDetail | Accounting/Payables/BillDetail/Holds |
| InvoiceServices | get#InvoiceHolds |  | Accounting/Payables/BillDetail; Accounting/Payables/BillDetail/Holds |
| SupplierServices | store#SupplierProfile | Accounting/Payables/Supplier360 | Accounting/Payables/Supplier360/Terms; Shared/Supplier360/Buying (Purchasing: SupplierProfile) |
| SupplierServices | get#SupplierFinance | Accounting/Payables/Supplier360 | Accounting/Payables/Supplier360 and its tabs |

Added in Accounting P7 (matching), called by built screens:

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| InvoiceMatchServices | evaluate#InvoiceMatch | Shared/InvoiceMatch; Accounting/Payables/BillDetail | Accounting/Payables/BillDetail/Match (Shared/InvoiceMatch); a service line against its ServiceAcceptance under the policy's service-acceptance rule (Manufacturing P14); Purchasing/Bills/InvoiceMatch (Shared/InvoiceMatch); Purchasing/Bills/MatchExceptions#ReevaluateMatch (BillServices.reevaluate#Matches) (Purchasing P6) |
| InvoiceMatchServices | apply#InvoiceMatch | Shared/InvoiceMatch; Accounting/Payables/BillDetail | Accounting/Payables/BillDetail/Match#MatchSources; a subcontract line's price variance as a production cost event (Manufacturing P14); Purchasing/Bills/InvoiceMatch#MatchSources (Purchasing P6) |
| InvoiceMatchServices | unapply#InvoiceMatch | Shared/InvoiceMatch | Accounting/Payables/BillDetail/Match; Purchasing/Bills/InvoiceMatch (Purchasing P6) |
| InvoiceMatchServices | preview#LegacyMatches | Accounting/Settings/MatchPolicies; Purchasing/Bills/MatchExceptions | Accounting/Payables/LegacyMatches; Purchasing/Bills/MatchExceptions (LegacyMatches) (Purchasing P6) |
| InvoiceMatchServices | apply#LegacyMatches | Accounting/Settings/MatchPolicies; Purchasing/Bills/MatchExceptions | Accounting/Payables/LegacyMatches; Purchasing/Bills/MatchExceptions (LegacyMatches) (Purchasing P6) |
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
| ReturnServices | preview#ReturnSettlement | Shared/ReturnDetail | Accounting/Records/ReturnDetail (Shared/ReturnDetail); Purchasing/Returns/ReturnDetail (Credit, read only, for a finance reader) (Purchasing P8) |
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
| FacilityServices | get#Facility | Warehouse/Locations/FacilityDetail; Shared/FacilityDetail; Maintenance/Facilities/FacilityDetail | Warehouse/Locations/FacilityDetail (through ironstone.warehouse.FacilityServices.get#FacilityDetail); Maintenance/Facilities/FacilityDetail (Overview's contact, through ironstone.maintenance.FacilityServices.get#FacilityDetail, P2) |
| FacilityServices | get#FacilitiesByOwner | Warehouse/Handheld/Home; Warehouse/Locations/Facilities | — Warehouse/Handheld/Home (FacilityPicker: AccessServices.get#Choices, select#Facility); Warehouse/Locations/Facilities (get#Facilities) |
| FacilityServices | create#Facility | Warehouse/Locations/Facilities; Shared/FacilityDetail | Warehouse/Locations/Facilities; Warehouse/Locations/FacilityDetail/Children (through store#Facility) |
| FacilityServices | update#Facility | Warehouse/Locations/FacilityDetail; Shared/FacilityDetail | Warehouse/Locations/FacilityDetail (through store#Facility) |
| FacilityServices | update#FacilityCertification | Maintenance/Facilities/FacilityDetail | — (Maintenance/Facilities/FacilityDetail/Certifications lists them read only, P2; no writer is built) |
| FacilityServices | create#FacilityLocation | Warehouse/Locations/FacilityDetail; Shared/FacilityDetail; Maintenance/Facilities/FacilityDetail | Warehouse/Locations/FacilityDetail/Locations (New location, through store#FacilityLocation); Maintenance/Facilities/FacilityDetail: — (no Locations tab in Maintenance's facility context; locations stay Warehouse's) |
| FacilityServices | create#FacilityNote | Warehouse/Locations/FacilityDetail | — Warehouse/Locations/FacilityDetail/Conversation: the chatter logs a Comment (log#RecordNote) and shows the FacilityNotes |
| FacilityServices | get#ScannedIdGeneral | Warehouse/Counts/CountEntry; Warehouse/Handheld/Count; Warehouse/Handheld/Home; Warehouse/Handheld/Move; Warehouse/Home; Warehouse/Transfers/Move | Warehouse/Home, Warehouse/Handheld/Home, Warehouse/Handheld/Move, Warehouse/Transfers/Move, Warehouse/Inventory/ContainerDetail (the scan-input resolver ironstone.warehouse.AccessServices.resolve#Scan, over get#ScannedRecord) |

## HumanRes (38 services)

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| EmploymentServices | create#Employment | People/Employees/HireEmployee | People/Employees/HireEmployee (through PeopleServices.hire#Employee; its overlap check of PrtEmployee alone, F3) (People P6) |
| EmploymentServices | update#Employment |  | — (its overlap check of PrtEmployee alone, F3; People ends an employment through apply#EmploymentChange) (People P6) |
| EmploymentServices | delete#Employment |  | — (an employment is ended by apply#EmploymentChange, never deleted) (People P31) |
| EmploymentServices | create#EmploymentSalary | People/Employees/Employee360 | People/Employees/Employee360 (Compensation's Set salary and Change salary, through PeopleServices.apply#EmploymentChange's pay change, approved first, which writes the salary as this service does: the row in effect ended on the new one's date, F4); this service checks PAYROLL_EDIT and the payroll reader's employer and asks a first salary only, as a pay change waiting for approval (People P24 review, the user's call of Nov 12, 2026), and writes one at once only for an audited repair with PAYROLL_REPAIR (People P23 and its review) |
| EmploymentServices | check#NextPayrollTimePeriods |  | — (the legacy payroll, which People neither calls nor reads, design-people §8.4; kept for its specs and history) (People P31) |
| PayrollDocumentServices | get#EmploymentInfo |  | — (statutory documents wait on a real localization, PayrollStatements later, impl-people §7; People neither calls nor reads them) (People P31) |
| PayrollDocumentServices | get#EmploymentWageAndTaxInfo |  | — (statutory documents wait on a real localization, PayrollStatements later, impl-people §7; People neither calls nor reads them) (People P31) |
| PayrollDocumentServices | create#PeriodWageAndTaxRecords |  | — (statutory documents wait on a real localization, PayrollStatements later, impl-people §7; People neither calls nor reads them) (People P31) |
| PayrollDocumentServices | get#UsaIrsW2FormData |  | — (statutory documents wait on a real localization, PayrollStatements later, impl-people §7; People neither calls nor reads them) (People P31) |
| PayrollDocumentServices | generate#Efw2File |  | — (statutory documents wait on a real localization, PayrollStatements later, impl-people §7; People neither calls nor reads them) (People P31) |
| PayrollDocumentServices | get#UsaIrs1099MiscFormData |  | — (statutory documents wait on a real localization, PayrollStatements later, impl-people §7; People neither calls nor reads them) (People P31) |
| PayrollServices | get#TimePeriodEmployments |  | — (the legacy payroll, which People neither calls nor reads, design-people §8.4; kept for its specs and history) (People P31) |
| PayrollServices | process#TimePeriodPay |  | — (the legacy payroll, which People neither calls nor reads, design-people §8.4; kept for its specs and history) (People P31) |
| PayrollServices | reopen#PayrollPeriod |  | — (the legacy payroll, which People neither calls nor reads, design-people §8.4; kept for its specs and history) (People P31) |
| PayrollServices | approve#PeriodInvoices |  | — (the legacy payroll, which People neither calls nor reads, design-people §8.4; kept for its specs and history) (People P31) |
| PayrollServices | create#PeriodPayments |  | — (the legacy payroll, which People neither calls nor reads, design-people §8.4; kept for its specs and history) (People P31) |
| PayrollServices | set#PeriodPaymentDates |  | — (the legacy payroll, which People neither calls nor reads, design-people §8.4; kept for its specs and history) (People P31) |
| PayrollServices | set#PeriodPaymentRefNums |  | — (the legacy payroll, which People neither calls nor reads, design-people §8.4; kept for its specs and history) (People P31) |
| PayrollServices | authorize#PeriodPayments |  | — (the legacy payroll, which People neither calls nor reads, design-people §8.4; kept for its specs and history) (People P31) |
| PayrollServices | deliver#PeriodPayments |  | — (the legacy payroll, which People neither calls nor reads, design-people §8.4; kept for its specs and history) (People P31) |
| PayrollServices | process#EmploymentPay |  | — (the legacy payroll, which People neither calls nor reads, design-people §8.4; kept for its specs and history) (People P31) |
| PayrollServices | get#EmploymentPayAmount |  | — (the legacy payroll, which People neither calls nor reads, design-people §8.4; kept for its specs and history) (People P31) |
| PayrollServices | get#TimePeriodTotalPayAmount |  | — (the legacy payroll, which People neither calls nor reads, design-people §8.4; kept for its specs and history) (People P31) |
| PayrollServices | get#EmploymentPayDetail |  | — (the legacy payroll, which People neither calls nor reads, design-people §8.4; kept for its specs and history) (People P31) |
| PayrollServices | calculate#Adjustment |  | — (the legacy payroll, which People neither calls nor reads, design-people §8.4; kept for its specs and history) (People P31) |
| PayrollServices | calculate#PayrollAdjustment |  | — (the legacy payroll, which People neither calls nor reads, design-people §8.4; kept for its specs and history) (People P31) |
| PayrollServices | create#WorkersCompRate |  | — (the legacy payroll, which People neither calls nor reads, design-people §8.4; kept for its specs and history) (People P31) |
| PayrollServices | delete#WorkersCompRate |  | — (the legacy payroll, which People neither calls nor reads, design-people §8.4; kept for its specs and history) (People P31) |
| PayrollServices | update#WorkersCompRate |  | — (the legacy payroll, which People neither calls nor reads, design-people §8.4; kept for its specs and history) (People P31) |
| PayrollServices | create#GarnishmentDetail |  | — (the legacy payroll, which People neither calls nor reads, design-people §8.4; kept for its specs and history) (People P31) |
| PayrollServices | update#GarnishmentDetail |  | — (the legacy payroll, which People neither calls nor reads, design-people §8.4; kept for its specs and history) (People P31) |
| PayrollServices | create#PayrollAdjustmentAndDetail |  | — (the legacy payroll, which People neither calls nor reads, design-people §8.4; kept for its specs and history) (People P31) |
| PayrollServices | update#PayrollAdjustmentAndDetail |  | — (the legacy payroll, which People neither calls nor reads, design-people §8.4; kept for its specs and history) (People P31) |
| PayrollServices | delete#PayrollAdjustmentAndDetail |  | — (the legacy payroll, which People neither calls nor reads, design-people §8.4; kept for its specs and history) (People P31) |
| PayrollServices | create#PayrollInvoice |  | — (the legacy payroll, which People neither calls nor reads, design-people §8.4; kept for its specs and history) (People P31) |
| PositionServices | get#PartyEmployersAndPositionClasses |  | — (People's choices read the employer's seats and classes through ironstone.people get#Choices) (People P31) |
| RateServices | create#RateAmount | Projects/Projects/NewProject; Projects/Projects/ProjectDetail/Money; Projects/Billing/Rates; People/Payroll/Rates | Projects/Billing/Rates; Projects/Projects/NewProject/Money; People/Payroll/Rates (People P10, Projects' screen mounted under People) |
| RateServices | update#RateAmount | Projects/Projects/ProjectDetail/Money; Projects/Billing/Rates; People/Payroll/Rates | Projects/Billing/Rates; People/Payroll/Rates (People P10, Projects' screen mounted under People) |

**Added** (People P1 to P30, Nov 11–13, 2026; [impl-people](impl-people.md)): the People services Mantle gained, each with
the screens that call it.

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| PeopleServices | get#Scope | People | People (the root, through ironstone.people.ContextServices); Projects/Resources/PersonDetail and Admin/Users/UserDetail (the Employee360 link, get#Employee360Link) (People P1, P2) |
| PeopleServices | get#Home | People/Home | People/Home (People P1; P8: the vacancies and decisions waiting counts) |
| PeopleServices | get#Readiness | People/Settings | People/Settings/SettingsHome; Admin/Operations/Health (the readiness registry, people.setup) (People P1; P29: every phase's checks, each opening the place that sets it up) |
| PeopleServices | get#Settings, store#Settings | People/Settings (PeoplePreferences) | People/Settings/Preferences (Clocking, Confidential cases: the employer's clocking default and case intake handlers); People/Time/Attendance (Who clocks: Employer's default, an HR editor's) (People P29) |
| PeopleReportServices | get#Options | People/Reports (ReportOptions) | People/Reports (ReportOptions: the reports the user reads); Insights/Reports (the catalog's People entries, People's catalogue) (People P29) |
| PeopleReportServices | run#Report | People/Reports (ReportResults) | People/Reports (each report's results, totals and basis; Export CSV, exportCsv) (People P29) |
| PeopleServices | find#Employees | People/Employees | People/Employees/List (and its CSV export); the People palette's directory and the Person record-lookup (ironstone.people.ContextServices search#Records, lookup#Records) (People P2) |
| PeopleServices | get#Employee360 | People/Employees/Employee360 | People/Employees/Employee360; Commons/People/Employee360; Insights/Records/Employee360 (through get#Employee360Context) (People P2) |
| PeopleServices | get#EmploymentHistory | People/Employees/Employee360 | People/Employees/Employee360 (Employment history; P6: the dated assignments) (People P2, P6) |
| PeopleServices | store#PersonalInfo | People/Employees/Employee360 | People/Employees/Employee360; Commons/People/Employee360 (the person's own) (People P2) |
| PeopleServices | check#EmploymentAccess | People/Employees/Employee360 | Shared/Chatter; Shared/RecordFiles (through get#RecordLinkInfo and RecordFilesServices.get#ContentType, the employment host) (People P2) |
| PeopleServices | create#EmploymentContent | People/Employees/Employee360 | Shared/RecordFiles under People/Employees/Employee360 (Files and activity) (People P2) |
| OrganizationServices | find#Units | People/Employees/OrgStructure | People/Employees/OrgStructure (OrganizationTree and its unitChildren level) (People P3) |
| OrganizationServices | get#Unit | People/Employees/OrgStructure | People/Employees/OrgStructure (the open unit: its facts, UnitParents, TeamMembers) (People P3) |
| OrganizationServices | store#Unit | People/Employees/OrgStructure | People/Employees/OrgStructure (NewUnit, EditUnit; P6: CloseUnit, a department's people reassigned) (People P3, P6) |
| OrganizationServices | store#Membership | People/Employees/OrgStructure | People/Employees/OrgStructure (AddMember, EndMember: a team's; P6: a department's members are its assignments') (People P3, P6) |
| OrganizationServices | get#ReportingTree | People/Employees/OrgChart | People/Employees/OrgChart (ReportingTree and its reportChildren level) (People P3) |
| OrganizationServices | change#Manager | People/Employees/OrgChart | People/Employees/OrgChart (ChangeManager; P6: an employment's manager change, its assignment's) (People P3, P6) |
| PositionServices | find#JobClasses | People/Staffing/JobClasses | People/Staffing/JobClasses (FindJobClasses, JobClassList) (People P4) |
| PositionServices | get#JobClass | People/Staffing/JobClassDetail | People/Staffing/JobClassDetail (the header, Job profile, Requirements) (People P4) |
| PositionServices | store#JobClass | People/Staffing/JobClasses; People/Staffing/JobClassDetail | People/Staffing/JobClasses (NewJobClass); People/Staffing/JobClassDetail (EditJobClass, End job class) (People P4) |
| PositionServices | store#JobRequirement | People/Staffing/JobClassDetail | People/Staffing/JobClassDetail (AddSkill, Remove; P18: a requirement's level, certificate, required or desired, ChangeRequirement, Remove ending it) (People P4, P18) |
| PositionServices | find#Positions | People/Staffing/Positions | People/Staffing/Positions (FindPositions, PositionList as list and board) (People P4) |
| PositionServices | get#Position | People/Staffing/PositionDetail | People/Staffing/PositionDetail (the header, Terms, Holders; P5: Approval, the latest activation request) (People P4, P5) |
| PositionServices | store#Position | People/Staffing/Positions; People/Staffing/PositionDetail | People/Staffing/Positions (NewPosition); People/Staffing/PositionDetail (EditPosition, EndPosition) (People P4) |
| PositionServices | store#PositionHolder | People/Employees/HireEmployee; People/Employees/EmploymentChange | — (no screen: P6's hire and employment change hold and end a seat through Positions.js holdSeat and endHolding, its checks, with the assignment's position) (People P4, P6) |
| PayrollSetupServices | find#PayGrades | People/Staffing/PayGrades | People/Staffing/PayGrades (FindPayGrades, Grades, GradeBands; the amounts for PAYROLL_VIEW only) (People P4) |
| PayrollSetupServices | store#PayGrade | People/Staffing/PayGrades | People/Staffing/PayGrades (NewPayGrade, NewBand) (People P4) |
| PositionServices | request#PositionApproval | People/Staffing/PositionDetail | People/Staffing/PositionDetail (RequestActivation, the Requisition) (People P5) |
| PositionServices | decide#PositionApproval | People/Staffing/PositionDetail; People/Approvals | People/Staffing/PositionDetail (ApproveActivation, RefuseActivation) (People P5) |
| PositionServices | approve#PositionApproval | People/Approvals | People/Approvals and Commons' Notifications and tray (the PeoplePositionApproval topic's approve service, through org.moqui.ui.NotificationServices.approve#NotificationMessage) (People P5) |
| PositionServices | refuse#PositionApproval | People/Approvals | People/Approvals and Commons' Notifications and tray (the topic's refuse service, through refuse#NotificationMessage) (People P5) |
| PeopleApprovalServices | find#Policies | People/Settings/ApprovalPolicies | People/Settings/ApprovalPolicies (FindPolicies, Policies) (People P5) |
| PeopleApprovalServices | store#Policy | People/Settings/ApprovalPolicies | People/Settings/ApprovalPolicies (NewRule, ChangeRule, EndRule) (People P5) |
| PeopleApprovalServices | resolve#Approvers | People/Settings/ApprovalPolicies | People/Settings/ApprovalPolicies (ResolvePreview) (People P5) |
| PeopleApprovalServices | record#Decision | People/Approvals | — (no screen: the domain decision services call it, decide#PositionApproval) (People P5) |
| PeopleApprovalServices | find#OwnedApprovals | Admin/Users/LifecycleDetail | Admin/Users/UserDetail and LifecycleDetail (the people.approvals participant's lookup, through ironstone.admin.LifecycleServices) (People P5) |
| PeopleApprovalServices | transfer#ApprovalOwner | Admin/Users/LifecycleDetail | Admin/Users/LifecycleDetail (TransferOwnership of the people.approvals participant's rule rows) (People P5) |
| PeopleServices | find#Lookups | People/Settings/Lookups | People/Settings/Lookups (FindLookups, LookupValues) (People P5) |
| PeopleServices | store#Lookup | People/Settings/Lookups | People/Settings/Lookups (AddValue, EditValue, EndValue) (People P5) |
| PeopleServices | preview#Hire | People/Employees/HireEmployee | People/Employees/HireEmployee (Identity, EmploymentTerms, ConfirmHire; the hirePeople choice) (People P6); from an accepted offer, employmentOfferId (People P17) |
| PeopleServices | hire#Employee | People/Employees/HireEmployee | People/Employees/HireEmployee (ConfirmHire's Hire) (People P6); a hire from an accepted offer, which it consumes once (Identity's Start from the offer, OfferDetail's Hire) (People P17) |
| PeopleServices | preview#EmploymentChange | People/Employees/EmploymentChange | People/Employees/EmploymentChange (Change, ImpactAndConfirm) (People P6) |
| PeopleServices | apply#EmploymentChange | People/Employees/EmploymentChange | People/Employees/EmploymentChange (ImpactAndConfirm's Apply or Ask for approval) (People P6) |
| PeopleServices | decide#EmploymentChange | People/Approvals; People/Employees/Employee360 | People/Employees/Employee360 (Employment changes: ApproveChange, RefuseChange) (People P6) |
| PeopleServices | approve#EmploymentChange | People/Approvals | People/Approvals and Commons' Notifications and tray (the PeopleEmploymentChangeApproval topic's approve service) (People P6) |
| PeopleServices | refuse#EmploymentChange | People/Approvals | People/Approvals and Commons' Notifications and tray (the topic's refuse service) (People P6) |
| PeopleServices | find#EmploymentChanges | People/Employees/Employee360 | People/Employees/Employee360 (Employment changes) (People P6); each applied change's letter, offered and issued (People P17) |
| PeopleServices | get#EmploymentLetter, issue#EmploymentLetter | People/Employees/EmploymentChange | People/Employees/Employee360 (Employment changes: Issue letter, Letter) and People/Employees/EmploymentLetter (the lifecycle letter's html-print preview), on the offer letter's template, stored when issued (People P17) |
| PeopleServices | find#MyLetters, get#MyLetter | People/SelfService | People/SelfService and Commons/People/SelfService (My letters, the user's own issued lifecycle letters) (People P17 review) |
| PeopleServices | get#EmploymentDraft, store#EmploymentDraft, delete#EmploymentDraft | People/Employees/HireEmployee, People/Employees/EmploymentChange | People/Employees/HireEmployee and EmploymentChange (the wizards' draft records, resumed and discarded) (People P6 review) |
| PeopleServices | apply#DueAssignments | (the daily job apply_EmploymentDueAssignments) | none: a ServiceJob setting Employment.emplPositionId to the seat in effect (People P6 review); P7: also routing the waiting decisions of an employer on the date a later separation or manager change comes (F134) |
| PeopleServices | withdraw#EmploymentChange | People/Employees/Employee360 | People/Employees/Employee360 (Employment changes: Withdraw, Withdraw the return) (People P7) |
| PeopleServices | find#Checklists, store#Checklist, store#ChecklistStep | People/Employees/ChecklistTemplates | People/Employees/ChecklistTemplates (Templates, NewChecklist, RenameChecklist, EndChecklist; ChecklistTasks, AddStep, EditStep, EndStep) (People P7) |
| PeopleServices | start#Checklists, start#Checklist, start#EquipmentReturn | (Mantle's tx-commit rules on hire#Employee and an applied change) | none: the checklists and a separation's equipment return started after the change commits (People P7) |
| PeopleServices | get#ChecklistTask | People/Tasks/WorkItemDetail | People/Tasks/WorkItemDetail (the People box; read only for an HR reader) (People P7) |
| PeopleServices | get#AssignedEquipment | People/Employees/Employee360 | People/Employees/Employee360 (Assigned equipment) (People P7) |
| PeopleServices | get#EquipmentCustody, return#Equipment | People/Employees/EquipmentDetail | People/Employees/EquipmentDetail (Custody, End assignment) (People P7) |
| PeopleServices | complete#ReturnTasks | (Mantle's rule on an AssetPartyAssignment's end) | none: an EECA, whoever ends the holding (People P7) |
| PeopleServices | note#AccessRequestFailure | People/Employees/Employee360 | none directly: ironstone.admin.LifecycleServices request#Provisioning and request#AccessEnd note a failure on the change, Employee360 shows it with Request access again (People P7) |
| PeopleServices | validate#EmployeeImportRow, apply#EmployeeImportRow, find#EmployeeImportScopes | People/Employees/EmployeeImport | People/Employees/EmployeeImport (Shared/DataImport for the employees target); Admin/Data/Imports (People P7) |
| PeopleServices | get#SelfService | People/SelfService; Commons/People/SelfService | Shared/PeopleSelfService at People/SelfService and Commons/People/SelfService (MySummary, the counts); Commons/Home (People's card, checkOnly) (People P8) |
| PeopleServices | find#MyRequests | People/SelfService | Shared/PeopleSelfService (My requests) (People P8) |
| PeopleServices | get#Team | People/MyTeam | People/MyTeam (Team) (People P8) |
| PeopleServices | find#DueWork | People/Home; People/MyTeam | People/Home (DueWork: no manager and lifecycle tasks; a manager's decisions count); People/MyTeam (Decisions); Shared/PeopleSelfService (My People tasks); ironstone.people.ContextServices.get#TodayItems (Today's decisions waiting, on the People and Commons roots) (People P8) |
| PeopleServices | store#EmergencyContact | People/Employees/Employee360; People/SelfService | People/Employees/Employee360 and Commons/People/Employee360 (Personal information's emergency contacts); Shared/PeopleSelfService (Emergency contacts) (template/PeopleEmergencyContacts.xml) (People P8) |
| PeopleServices | notify#PeopleTaskAssigned | (TaskServices.notify#TaskAssigned for People's lifecycle work) | none: the PeopleTaskAssigned notice, opening the task in Commons (People P8) |
| ProcessServices | store#ProcessStep, instantiate#WorkProcess | People/Employees/ChecklistTemplates (MT-03's first part); Maintenance/Procedures (its P6) | none directly: People's store#ChecklistStep and start#Checklist call WorkProcesses.js after their own checks (People P7); Maintenance/Procedures/ProcedureDetail/Steps (Add step, Edit, Waits for, Remove: store#ProcessStep's checked path); Maintenance/WorkOrders/NewWorkOrder (instantiate#WorkProcess' checked path, through create#MaintenanceWorkOrder) (Maintenance P6) |
| ProcessServices | check#ManagedWork | (the generic task and work-effort services) | none: TaskServices update#Task, set#TaskDates, set#TaskStatus, move#Task, set#TaskRecurrence and WorkEffortServices delete#WorkEffort, add#, remove# and replace#WorkEffortParty refuse managed work with it (People P7); also add#TaskTime, add#TaskDependency, remove#TaskDependency and clone#WorkEffort (Maintenance P6, F110); WorkEffortServices.add#WorkEffortProduct, TimeServices.store#TimeEntry (a new entry, or one moved onto managed work) and create#TimeEntryClockIn, through which Maintenance's own time entry points pass (WorkProcesses.js asManagedOwner) (Maintenance P7, F159) |
| IdentityServices | request#Provisioning, request#AccessEnd | People/Employees/HireEmployee; People/Employees/Employee360 | People's tx-commit rules (mr-boss service/PeopleLifecycle.secas.xml) and Employee360's Request access again, through ironstone.admin.LifecycleServices; Admin/Users/LifecycleDetail retries their waiting steps (People P7) |
| ScheduleServices | find#Schedules | People/Time/WorkingSchedules | People/Time/WorkingSchedules (Schedules) (People P9) |
| ScheduleServices | get#Schedule | People/Time/WorkingScheduleDetail | People/Time/WorkingScheduleDetail (the header, Week, Assignments) (People P9) |
| ScheduleServices | store#Schedule | People/Time/WorkingSchedules; People/Time/WorkingScheduleDetail | People/Time/WorkingSchedules (NewSchedule, Copy); People/Time/WorkingScheduleDetail (Edit schedule, End schedule) (People P9) |
| ScheduleServices | store#ScheduleLine | People/Time/WorkingScheduleDetail | People/Time/WorkingScheduleDetail (Week: Add working hours, Change, End) (People P9) |
| ScheduleServices | assign#Schedule | People/Time/WorkingScheduleDetail | People/Time/WorkingScheduleDetail (Assign, End for employee; Employment.js, an EmploymentChange of kind EckSchedule) (People P9) |
| ScheduleServices | get#Holidays | People/Time/HolidayCalendars (designed under People/Settings) | People/Time/HolidayCalendars (Calendars, Holidays) (People P9) |
| ScheduleServices | store#HolidayCalendar, store#Holiday | People/Time/HolidayCalendars (designed under People/Settings) | People/Time/HolidayCalendars (New calendar, Rename; Add holiday, Change, Remove) (People P9) |
| ScheduleServices | get#CapacityPreview | People/Time/WorkingScheduleDetail | People/Time/WorkingScheduleDetail (Capacity preview) (People P9) |
| RateServices | get#CostingRate | Rates (read only); Maintenance's labor cost (its P11); Projects' cost reports (their owner's later work) | mantle/work/ProductionShopFloor.js (a production labor event's rate, in place of its own RaprProductionCost lookup; the person's employer's row before a shared one, P10's review) (People P10); mantle/work/MaintenanceCosts.js (a maintenance entry's approved hours and the Approve gate's estimate, the work's organization's row first: Maintenance/WorkOrders/WorkOrderDetail/Costs, Maintenance/Reports/MaintenanceCostReport, impl-maintenance P11) |
| RateServices | find#CostingRates, store#CostingRate, end#CostingRate | Accounting/Settings/CostingPolicies (LaborCostingRates) | Accounting/Settings/CostingPolicies (Labor costing rates, by organization since P10's review); find#CostingRates also in ironstone.projects.BillingServices.find#RateRows (Rates' Labor costing rows the user reads) (People P10) |
| RateServices | migrate#ProductionCostRates | (a data update) | data/ProductionShopFloorData.xml: Manufacturing's RaprProductionCost rows moved to RaprCost on a load (People P10) |
| TimesheetServices | find#WeeksToSubmit | Today's "my week not submitted"; SelfService's missing-week card | mantle.work.ProjectServices.get#ProjectTodayItems (Projects' Today); ironstone.people.ContextServices.get#TodayItems (People's Today, People and Commons roots); PeopleServices.get#SelfService's weeksToSubmit (Shared/PeopleSelfService) (People P10) |
| TimesheetServices | get#LineReports | People/Time/Timesheets (Missing); People/Time/MyTime and TimeEntries (the person pickers) | find#Timesheets' missing list (People/MyTeam's last week, People/Home's Weeks not submitted, Timesheets' Missing: the reports who keep time, keeperIdList, P10's review); People/MyTeam (keeperIdList: last week only for those who keep time); ironstone.projects.TimeServices.get#TimePeople (People P10) |
| LeaveServices | find#Policies | People/Time/LeavePolicies (designed under People/Settings) | People/Time/LeavePolicies (Policies) (People P11) |
| LeaveServices | get#Policy | People/Time/LeavePolicyDetail (designed under People/Settings) | People/Time/LeavePolicyDetail (the header, Policy terms, Accrual and carry-over, Assignments, Blocked days); People/Time/LeaveAllocations (the policy chosen) (People P11) |
| LeaveServices | store#Policy | People/Time/LeavePolicies; People/Time/LeavePolicyDetail | People/Time/LeavePolicies (NewPolicy); People/Time/LeavePolicyDetail (Edit terms, Close policy) (People P11) |
| LeaveServices | store#AccrualRule | People/Time/LeavePolicyDetail | People/Time/LeavePolicyDetail (Accrual and carry-over: Add step, Change, End) (People P11) |
| LeaveServices | assign#Policy | People/Time/LeavePolicyDetail | People/Time/LeavePolicyDetail (Assign: an employee, a department's or the employer's; End for an employee) (People P11) |
| LeaveServices | store#BlockedInterval | People/Time/LeavePolicyDetail | People/Time/LeavePolicyDetail (Blocked days: Add blocked days, Cancel) (People P11) |
| LeaveServices | preview#Allocation, allocate#Leave | People/Time/LeaveAllocations (designed under People/Settings) | People/Time/LeaveAllocations (AllocationPreview, the results, Allocate) (People P11) |
| LeaveServices | get#Balances, find#Ledger | People/Time/LeaveBalances | People/Time/LeaveBalances (BalancesAndLedger: the balances, an employee's movements with the CSV export and their historical leave) (People P11) |
| LeaveServices | get#MyBalances | People/SelfService | Shared/PeopleSelfService (My leave balances); the Assistant's people_my_leave_balances tool (People P11) |
| LeaveServices | run#Accrual, run#AccrualJob, accrue#Assignment | People/Time/LeavePolicyDetail | People/Time/LeavePolicyDetail (Run accrual); the run_LeaveAccrual ServiceJob (People P11) |
| LeaveServices | preview#Request, submit#Request | People/Time/LeaveRequests | People/Time/LeaveRequests (RequestLeave: the terms, the preview, Request leave) (People P12) |
| LeaveServices | find#Requests | People/Time/LeaveRequests | People/Time/LeaveRequests (Requests: mine, to decide, all I see); Shared/PeopleSelfService (My leave requests); the palette's own leave requests (ironstone.people.ContextServices.search#Records) (People P12) |
| LeaveServices | get#Request, decide#Request | People/Time/LeaveRequestDetail | People/Time/LeaveRequestDetail (RequestAndBalance, Decision: Approve, Refuse, Withdraw, Ask to cancel, Cancel leave); the LeaveRequest record-lookup (ContextServices.lookup#Records) (People P12) |
| LeaveServices | approve#Request, refuse#Request | People/Approvals | People/Approvals (the PeopleLeaveApproval topic's approve and refuse, through Commons' Notifications) (People P12) |
| LeaveServices | get#TeamAbsences | People/Time/TeamCalendar | People/Time/TeamCalendar and TeamCalendarTui; People/MyTeam (Who is out); People's Today source (leave starting for my team) (People P12) |
| LeaveServices | get#AbsenceProjection | — (CX-SYNC) | the Team absence projected CalDAV collection (mantle.work.CalendarDavServices, CalendarProjection PeopleTeamAbsence) (People P12) |
| AttendanceServices | record#Punch, get#MyClock | Shared/PeopleSelfService (Clock) | Shared/PeopleSelfService and People/Time/Clock (template/PeopleClock.xml: the user's own clock; the quick create Clock in on Commons' root) (People P13) |
| AttendanceServices | get#ClockOffer | — (the shell) | Commons' quick create Clock in, its condition-service (People P13 review) |
| AttendanceServices | store#Clocking, find#Clocking | — | People/Time/Attendance (Who clocks: Turn clocking on, Turn off, Follow the employer; the employer's default, PartySetting PeopleClocking, is People Settings', P29) (People P13) |
| AttendanceServices | find#Attendance, get#Day | People/Time/Attendance | People/Time/Attendance (AttendanceDays: mine, to decide, all I see, missing punches only, the CSV export; the day open with its punches and corrections) (People P13) |
| AttendanceServices | request#Correction, decide#Correction | People/Time/Attendance | People/Time/Attendance (CorrectAttendance, Correct a missed day, AttendanceDecision: Approve, Refuse, Withdraw, Approve selected) (People P13) |
| AttendanceServices | approve#Correction, refuse#Correction | People/Approvals | People/Approvals (the PeopleAttendanceApproval topic's approve and refuse, through Commons' Notifications) (People P13) |
| AttendanceServices | preview#Import, import#Records, get#Import | People/Time/TimeImport | People/Time/TimeImport (FileAndMapping, ImportResults) (People P13) |
| AttendanceServices | find#ImportRuns | — (Admin's Imports) | the time-and-attendance transfer target's findService (TransferTarget timeAndAttendance), Admin's Imports opening People/Time/TimeImport (People P13) |
| AttendanceServices | record#KioskPunch, resolve#KioskBadge | People/Time/ClockingKiosk | People/Time/ClockingKiosk (IdentifyAndClock: the badge's scan-input resolver and the punch, only in a registered clocking device's request, its display account in BOSS_PEOPLE_KIOSK) (People P30) |
| AttendanceServices | issue#KioskBadge, revoke#KioskBadge, reset#KioskPin, get#KioskBadge | People/Employees/Employee360 | People/Employees/Employee360 (Clocking badge: Issue badge, Issue a new badge, with a one-time PIN or none; Reset PIN; Revoke badge; HR's) (People P30, Reset PIN in its review) |
| AttendanceServices | get#MyKioskBadges, set#MyKioskPin | Shared/PeopleSelfService (My clocking badge) | Shared/PeopleSelfService (My clocking badge: Set my PIN, Change my PIN; the user's own badge, the user's call of Nov 12, 2026) (People P30 review) |
| AttendanceServices | prune#KioskAttempts | — | the daily ServiceJob prune_KioskAttempts (refused kiosk attempts kept 90 days, the user's call of Nov 12, 2026) (People P30 review) |
| AttendanceServices | print#KioskBadge, get#KioskBadge | People/Employees/Employee360 (the badge print) | People/Employees/BadgePrint (print: a POST from Employee360's Print badge answered with the printable badge, once, by the badge's issuer; the page, a GET, the badge's printed state by `kioskBadgeId` and nothing made) (People P30, follow-up 4) |
| ScheduleServices | get#Roster | People/Time/ShiftRoster | People/Time/ShiftRoster (Roster: the shared timeline's lanes and bars, through its schedule transition), ShiftRosterTui and ShiftRosterPrint (template/PeopleRoster.xml, a person and day table) (People P14) |
| ScheduleServices | store#Shift | People/Time/ShiftRoster | People/Time/ShiftRoster (AssignShift: the timeline's dialog, preview, Save shift and Remove shift, through moveShift); ShiftRosterTui (Shift, its preview box, Save shift, Remove shift) (People P14) |
| ScheduleServices | publish#Shifts | People/Time/ShiftRoster | People/Time/ShiftRoster and ShiftRosterTui (Publish; the PeopleShiftChange notice) (People P14) |
| ScheduleServices | get#MyShifts | Shared/PeopleSelfService (MySummary's next shift) | Shared/PeopleSelfService (My shifts) (People P14) |
| ScheduleServices | get#TeamShifts | People/Time/TeamCalendar | People/Time/TeamCalendar and TeamCalendarTui (the published shifts beside the absences) (People P14) |
| ScheduleServices | get#ShiftProjection | — (CalDAV, CX-SYNC) | the My shifts projected collection (CalendarProjection PeopleMyShifts) (People P14) |
| ExpenseServices | find#Claims, get#Claim | People/Expenses/ExpenseClaims, ExpenseClaimDetail | People/Expenses/ExpenseClaims (Claims: mine, to decide, all I see); People/Expenses/ExpenseClaimDetail (the claim, its expenses, FinanceAndSettlement, the approval); ExpenseClaimPrint (the PDF); People/Payroll/InvoiceDetail (People's branch of the shared InvoiceDetail, for a payroll reader) (People P15) |
| ExpenseServices | store#Claim, store#ClaimItem, read#Receipt | People/Expenses/ExpenseClaimDetail | People/Expenses/ExpenseClaimDetail (ClaimHeader; ClaimItems: Add expense with its receipt, Edit, Remove; Read receipt over AiTaskServices.run#Extract, reviewed before save) (People P15) |
| ExpenseServices | submit#Claim, decide#Claim | People/Expenses/ExpenseClaimDetail | People/Expenses/ExpenseClaimDetail (SubmitOrDecide: Submit, Approve, Return, Refuse, Withdraw, Cancel claim) (People P15) |
| ExpenseServices | approve#Claim, refuse#Claim, approve#Advance, refuse#Advance | People/Approvals | People/Approvals (the PeopleExpenseApproval and PeopleAdvanceApproval topics' approve and refuse, through Commons' Notifications) (People P15) |
| ExpenseServices | get#ClaimReceipt, get#ClaimEvidence | People/Expenses/ExpenseClaimDetail | People/Expenses/ExpenseClaimDetail (a receipt opened; the evidence bundle, ironstone.people Expenses.js) (People P15) |
| ExpenseServices | get#ClaimOptions, get#ClaimOffer | People/Expenses | People/Expenses/ExpenseClaims and EmployeeAdvances (the employer, project and expense type choices); Commons' quick create New claim, its condition-service (People P15) |
| ExpenseServices | find#Advances, request#Advance, decide#Advance | People/Expenses/EmployeeAdvances | People/Expenses/EmployeeAdvances (Advances, RequestAdvance, AdvanceDecision); Accounting/Payables/ExpensePosting (Employee advances, find#Advances with finance) (People P15) |
| ExpenseServices | apply#Advance | Accounting/Payables/ExpensePosting | Accounting/Payables/ExpensePosting (Employee advances: Apply, a credit on the employee advances account; template/AccountingAdvances.xml; an approved advance's bill is approved in the expenses queue and paid by a payment run, P15's review) (People P15, owner contract) |
| ExpenseServices | reserve#ClaimSettlement | — (P27's pay runs) | finance's approve#Payable reserves accounts payable itself (InvoiceWorkflow.js); the payroll route's caller is P27 (People P15) |
| ExpenseServices | create#ClaimLineFromEmail | — (mail rules) | the EmailRuleAction createExpenseLine (ErActCreateExpenseLine), run by org.moqui.mail.EmailClientServices.run#EmailRules (People P15, F65) |
| ExpenseServices | create#ClaimLineFromChat | — (chat message actions) | "Add to my claim" in the BasicComms chat (ironstone.comms.ChatServices.create#FromChat kind claimLine; screen-extend Chat.xml) (People P15) |
| RecruitingServices | find#Openings | People/Staffing/Openings | People/Staffing/Openings (FindOpenings, OpeningList as a list or a board by state); the palette's openings and the choice openings (People P16) |
| RecruitingServices | store#Opening | People/Staffing/Openings | People/Staffing/Openings (New opening, Edit, Open, Close) (People P16) |
| RecruitingServices | find#Applications | People/Staffing/ApplicantPipeline | People/Staffing/ApplicantPipeline (FindApplications, ApplicationList as the board by stage and its list); the palette's applications (People P16) |
| RecruitingServices | create#Application | People/Staffing/ApplicantPipeline | People/Staffing/ApplicantPipeline (Add application, with the resume through create#ApplicationContent) (People P16) |
| RecruitingServices | get#Application | People/Staffing/ApplicantDetail | People/Staffing/ApplicantDetail (the header, Application, Files, Interviews, the scorecards); the EmploymentApplication record-lookup (People P16) |
| RecruitingServices | store#Application | People/Staffing/ApplicantDetail | People/Staffing/ApplicantDetail (Edit application) (People P16) |
| RecruitingServices | change#ApplicationStage | People/Staffing/ApplicantPipeline; People/Staffing/ApplicantDetail | People/Staffing/ApplicantPipeline (a card dragged, moveStage; Move to stage on the selected rows, moveSelected); People/Staffing/ApplicantDetail (Move to stage) (People P16) |
| RecruitingServices | schedule#Interview | People/Staffing/ApplicantDetail | People/Staffing/ApplicantDetail (Schedule interview: the private event, its call link, the iMIP invitation and the panel's scorecards) (People P16) |
| RecruitingServices | change#Interview | People/Staffing/ApplicantDetail | People/Staffing/ApplicantDetail (an interview's row: Change, its time, length, place or note, the attendees told; the only place its event changes) (Commons calendar editors, Nov 12, 2026) |
| RecruitingServices | cancel#Interview | People/Staffing/ApplicantDetail | People/Staffing/ApplicantDetail (an interview's row: Cancel, the attendees told) (Commons calendar editors, Nov 12, 2026) |
| RecruitingServices | send#InterviewInvitations | People/Staffing/ApplicantDetail (an interview's row: Send again, after a failed send); a tx-commit rule of schedule, change and cancel#Interview | the interview's invitations once its change commits, as the system, a failure logged and recorded on the interview for its recruiters (People follow-up 1, F358, and its review) |
| RecruitingServices | submit#Scorecard | People/Staffing/ApplicantDetail | People/Staffing/ApplicantDetail (Your scorecard: the form of the interview scorecard purpose, Submit scorecard) (People P16) |
| RecruitingServices | find#Interviews | People/Staffing/InterviewsCalendar | People/Staffing/InterviewsCalendar (Commons' Calendar.qvue in its resource mode; an attended interview opening Commons' EventDetail mounted there) and InterviewsCalendarTui (People P16) |
| RecruitingServices | get#InterviewProjection | — (CalDAV, CX-SYNC) | the My interviews projected collection (CalendarProjection PeopleMyInterviews) (People P16) |
| RecruitingServices | check#ApplicationAccess, create#ApplicationContent | People/Staffing/ApplicantDetail | People/Staffing/ApplicantDetail (Files: the application's record-files host, get#RecordLinkInfo and RecordFiles) (People P16) |
| RecruitingServices | create#ApplicationFromEmail | — (Comms mail rules) | the createApplication mail rule action (EmailRuleAction ErActCreateApplication), an opening's plus tag (People P16) |
| RecruitingServices | share#ApplicationContent, get#ApplicationFile | People/Staffing/ApplicantDetail; People/MyInterview | People/Staffing/ApplicantDetail (Shared with the panel: Choose what the panel reads, sharePanelFiles; applicationFile); Shared/PeopleMyInterview (sharedFile) (People P16 review) |
| RecruitingServices | find#MyInterviews, get#MyInterview | People/SelfService; People/MyInterview | Shared/PeopleSelfService (My interviews, Scorecards to submit) and Shared/PeopleMyInterview (the interview, the shared materials, Your scorecard over submit#Scorecard), at People/ and Commons/People/ (People P16 review, the user's call of Nov 12, 2026) |
| RecruitingServices | create#ApplicationFromChat | — (chat message actions) | "Create application" in the BasicComms chat (ironstone.comms.ChatServices.create#FromChat kind application; screen-extend Chat.xml) (People P16 review) |
| RecruitingServices | find#Offers | People/Staffing/ApplicantDetail; People/Employees/HireEmployee | People/Staffing/ApplicantDetail (Offers); People/Employees/HireEmployee/Identity (Accepted offers to hire from) (People P17) |
| RecruitingServices | get#Offer, store#Offer | People/Staffing/OfferDetail | People/Staffing/OfferDetail (Offer: the record header, Terms, Edit terms, Set pay); People/Staffing/ApplicantDetail (Create offer) (People P17) |
| RecruitingServices | change#OfferState, approve#Offer, refuse#Offer | People/Staffing/OfferDetail | People/Staffing/OfferDetail (OfferDecision: Submit, Approve, Refuse, Issue, Record acceptance, Declined by the candidate, Withdraw); People/Approvals and the notification tray (PeopleOfferApproval) (People P17) |
| RecruitingServices | get#OfferLetter, get#OfferEvidence | People/Staffing/OfferDetail | People/Staffing/OfferDetail (the issued letter, the signed letter) and People/Staffing/OfferLetter (the letter's html-print preview) (People P17) |
| RecruitingServices | send#OfferLetter | People/Staffing/OfferDetail | the issue's tx-commit rule (mr-mantle `service/PeopleRecruiting.secas.xml`) and People/Staffing/OfferDetail (Send the letter again) (People P17 review) |
| PeopleServices | submit#ExitInterview | People/Tasks/WorkItemDetail | Shared/WorkItemDetail's People box (template/PeopleWorkItem.xml: Exit interview, submitExitInterview; get#ChecklistTask's exitInterview) (People P16 review) |
| party/FormDefinitionServices | find#Forms, create#Form | People/Settings/Forms | People/Settings/Forms (Shared/SurveyForms with People's registration: the forms list, New form) (People P16); People/Development/AssessmentForms (its Development mount: the training assessments, the learning administrator's) (People P19 review) |
| party/FormDefinitionServices | get#Form, rename#Form, save#FormField, save#FormCondition, end#FormPart, publish#Form | People/Settings/FormDetail | People/Settings/FormDetail (Shared/SurveyFormDetail with People's registration: FormFields, FieldOptions, the rules, Publish, Rename, the preview) (People P16); People/Development/AssessmentForms/FormDetail (its Development mount) (People P19 review) |
| party/FormPublicationServices | open#Publication | — | no screen: a form's publication by an access kind its purpose's registration admits (People's purposes admit none; Marketing's publication screens build on it, impl-marketing P12) (People P16) |
| DevelopmentServices | get#SkillsMatrix | People/Development/SkillsMatrix | People/Development/SkillsMatrix (the .qvue matrix, through its matrix transition) and SkillsMatrixTui (the person and skill rows) (People P18) |
| DevelopmentServices | store#Skill | People/Development/SkillsMatrix (EvaluateSkill) | People/Development/SkillsMatrix (a cell's evaluation, through evaluateSkill) and SkillsMatrixTui (Evaluate a skill) (People P18) |
| DevelopmentServices | find#Qualifications | People/Development/Qualifications | People/Development/Qualifications (FindQualifications, QualificationList, the Files box's record); Today's my qualification expiring (ironstone.people.ContextServices.get#TodayItems) (People P18) |
| DevelopmentServices | store#Qualification | People/Development/Qualifications (Qualification) | People/Development/Qualifications (AddQualification, a row's Change and Renew) (People P18) |
| DevelopmentServices | verify#Qualification | People/Development/Qualifications (Qualification's verifier decision) | People/Development/Qualifications (a row's Verify, Reject and Revoke) (People P18) |
| DevelopmentServices | check#Qualifications | Maintenance/WorkOrders (technician assignment); Projects' StaffAllocation | — (the staffing answer: no People screen calls it; Projects' StaffAllocation adopts it, impl-people §7) (People P18); Maintenance P8 reads the same answer through Development.js `staffingAnswer` after its own check (a dispatcher holds no People reach), in Maintenance/WorkOrders/WorkOrderDetail/Overview (Assign and schedule's technicians), schedule# and transition#MaintenanceWorkOrder (the warning or block); a work effort's requirement now carries the skill standard's qualification type |
| DevelopmentServices | get#PersonDevelopment | Shared/Employee360 (SkillsAndReviews) | Shared/Employee360 under People (Skills and reviews) (People P18) |
| DevelopmentServices | store#ResumeLine | Shared/Employee360 (SkillsAndReviews) | Shared/Employee360 under People (Add resume line, Remove) (People P18) |
| DevelopmentServices | check#QualificationAccess, create#QualificationContent | People/RecordFiles (the qualification host, PE-01) | People/Development/Qualifications (Files: RecordFiles of PartyQualification, through get#RecordLinkInfo and RecordFiles' get#ContentType) (People P18) |
| DevelopmentServices | send#ExpiryReminders | — (the daily job send_QualificationExpiryReminders) | the QualificationExpiring notice, opening People/Development/Qualifications (People P18) |
| DevelopmentServices | find#Training | People/Development/Training (Sessions) | People/Development/Training (FindTraining, SessionList; the courses for Schedule session and the Courses box); Today's training due (ironstone.people.ContextServices.get#TodayItems) (People P19) |
| DevelopmentServices | get#Training | People/Development/TrainingDetail | People/Development/TrainingDetail (the record header, Enrollment, Record a result, Results) (People P19) |
| DevelopmentServices | store#TrainingClass | People/Development/Training | People/Development/Training (Courses: New course, Change, End) (People P19) |
| DevelopmentServices | store#Training | People/Development/Training (NewSession) | People/Development/Training (Schedule session); People/Development/TrainingDetail (Change session, Cancel session) (People P19) |
| DevelopmentServices | enroll#Training | People/Development/TrainingDetail (Enrollment) | People/Development/Training (a row's Ask for a place); People/Development/TrainingDetail (Ask for a place, Enroll a person) (People P19) |
| DevelopmentServices | decide#Enrollment, approve#Enrollment, refuse#Enrollment | People/Development/TrainingDetail (Enrollment); People/Approvals | People/Development/TrainingDetail (a place's Approve, Refuse and Withdraw); People/Approvals and the notification tray (the PeopleTrainingApproval topic's handlers) (People P19) |
| DevelopmentServices | mark#TrainingAttendance | People/Development/TrainingDetail (Enrollment's attendance) | People/Development/TrainingDetail (a place's Attendance) (People P19) |
| DevelopmentServices | complete#Training | People/Development/TrainingDetail (Results) | People/Development/TrainingDetail (Record a result: the assessment form's DbForm, outcome, score, evidence) (People P19) |
| DevelopmentServices | get#TrainingCertificate | People/Development/TrainingDetail (the completion certificate, design §15) | People/Development/TrainingCertificate (html-print, the stored page); People/Development/TrainingDetail (certificatePdf, the stored PDF) (People P19) |
| request/RequestServices (PeopleCaseServices.xml, included) | create#PeopleCase, find#PeopleCases | People/Employees/Grievances (SubmitCase, Cases) | People/Employees/Grievances (Raise a concern, fileCase; CaseList and Show) (People P21) |
| request/RequestServices (PeopleCaseServices.xml, included) | get#PeopleCase, change#PeopleCase, assign#PeopleCaseHandler, add#PeopleCaseTask | People/Employees/RequestDetail | People/Employees/RequestDetail (Shared/RequestDetail's People branch, template/PeopleCaseDetail.xml: the header's Start, Resolve, Reopen, Withdraw, More's Close without action, Add a handler, Remove a handler and Ask for work) (People P21) |
| request/RequestServices (PeopleCaseServices.xml, included) | check#PeopleCaseAccess | People/RecordFiles; People/Chatter (the case host, PE-01) | People/Employees/RequestDetail (Files and Conversation: get#RecordLinkInfo's case rule, RecordFiles' change right); the case's record link (People.js caseLink) (People P21) |
| request/RequestServices (PeopleCaseServices.xml, included) | notify#PeopleCaseUpdate, get#CaseDocumentData | — (record notices; the search documents) | the PeopleCaseUpdate notice in place of ChatterMention and RecordFollow on a case; MantleRequest's and MantleCommunicationEvent's manual data service, which keeps a case out of the index (People P21) |
| ReviewServices | find#Cycles | People/Performance/ReviewCycles (Cycles) | People/Performance/ReviewCycles (FindCycles, CycleList with its progress counts, the Templates box) (People P20) |
| ReviewServices | store#ReviewTemplate | People/Performance/ReviewCycles (CycleSetup's template) | People/Performance/ReviewCycles (Templates: New template, Change, End) (People P20) |
| ReviewServices | store#Cycle, start#Cycle | People/Performance/ReviewCycles (CycleSetup) | People/Performance/ReviewCycles (New cycle, a draft's Change, Preview: who it reviews, Start reviews, a started cycle's Close) (People P20) |
| ReviewServices | find#Reviews | People/Performance/Reviews (ReviewList) | People/Performance/Reviews (FindReviews: To do, Mine, I review, All; ReviewList) (People P20) |
| ReviewServices | get#Review, store#Assessment, submit#Feedback | People/Performance/ReviewDetail (Assessment, Feedback) | People/Performance/ReviewDetail (the record header, Steps, Your self assessment, Your assessment of, Your feedback on: the step's review form as a dynamic form of its DbForm, the summary and the rating) (People P20) |
| ReviewServices | change#ReviewState, approve#ReviewStep, refuse#ReviewStep | People/Performance/ReviewDetail (ReviewDecision); People/Approvals | People/Performance/ReviewDetail (Finalize, Approve, Release, Acknowledge; More's Ask for feedback, Return, Refuse, Change reviewer, Exclude; a step's Withdraw); People/Approvals and the notification tray (the PeopleReviewStep topic's handlers) (People P20) |
| ReviewServices | store#ReviewNote | People/Performance/ReviewDetail (private notes) | People/Performance/ReviewDetail (Your private notes: Add note, Remove; their author's alone) (People P20) |
| ReviewServices | get#ReviewRelease | People/Performance/ReviewDetail (the review release, design §15) | People/Performance/ReviewRelease (html-print, the stored page); People/Performance/ReviewDetail (releasePdf, the stored PDF) (People P20) |
| ReviewServices | check#ReviewAccess, create#ReviewContent | People/RecordFiles; People/Chatter (the review host, PE-01) | People/Performance/ReviewDetail (Files: RecordFiles of PerformanceReview, through get#RecordLinkInfo and RecordFiles' get#ContentType) (People P20) |
| ReviewServices | find#Goals, store#Goal | People/Performance/Goals (Goals, Goal) | People/Performance/Goals (FindGoals, GoalList, Add goal, a row's Update progress, Change, Close, Cancel goal; a review's goals from ReviewDetail) (People P20) |
| PayrollSetupServices | find#Components | People/Payroll/PayComponents; People/Payroll/PayComponentDetail | People/Payroll/PayComponents (FindComponents, Components); People/Payroll/PayComponentDetail (the header, the term opened, All terms) (People P22) |
| PayrollSetupServices | store#Component | People/Payroll/PayComponents (NewComponent); People/Payroll/PayComponentDetail (ComponentTerms) | People/Payroll/PayComponents (New component); People/Payroll/PayComponentDetail (Edit calculation, the constrained formula editor; Start a draft; Edit name; End component) (People P22) |
| PayrollSetupServices | store#ComponentExample | People/Payroll/PayComponentDetail (Examples) | People/Payroll/PayComponentDetail (Add example, a row's Edit and Remove) (People P22) |
| PayrollSetupServices | preview#Component | People/Payroll/PayComponentDetail (Examples) | People/Payroll/PayComponentDetail (Examples with their checks; Try values) (People P22) |
| PayrollSetupServices | publish#Component | People/Payroll/PayComponentDetail (PublishComponent) | People/Payroll/PayComponentDetail (Publish) (People P22) |
| PayrollSetupServices | decide#Publication, approve#Publication, refuse#Publication | People/Payroll/PayComponentDetail; People/Payroll/PayStructureDetail; People/Approvals | People/Payroll/PayComponentDetail and PayStructureDetail (the Approval box, Approve, Refuse); People/Approvals and the notification tray (the PeoplePayrollConfigApproval topic's handlers) (People P22 review) |
| PayrollSetupServices | find#Structures | People/Payroll/PayStructures; People/Payroll/PayStructureDetail | People/Payroll/PayStructures (FindStructures, Structures); People/Payroll/PayStructureDetail (the header, Composition, the calculation order and findings) (People P22) |
| PayrollSetupServices | store#Structure | People/Payroll/PayStructures (NewStructure); People/Payroll/PayStructureDetail | People/Payroll/PayStructures (New structure); People/Payroll/PayStructureDetail (Edit, Copy, End structure) (People P22) |
| PayrollSetupServices | store#StructureComponent | People/Payroll/PayStructureDetail (Composition) | People/Payroll/PayStructureDetail (Add component, a draft line's Edit and Remove, a published line's End) (People P22) |
| PayrollSetupServices | preview#Structure | People/Payroll/PayStructureDetail (PreviewStructure) | People/Payroll/PayStructureDetail (Preview gross to net) (People P22) |
| PayrollSetupServices | publish#Structure | People/Payroll/PayStructureDetail (PublishStructure) | People/Payroll/PayStructureDetail (Publish) (People P22) |
| PayrollSetupServices | find#Groups | People/Payroll/PayGroups (Groups) | People/Payroll/PayGroups (Groups with their readiness; a group opened: GroupTerms, Periods) (People P22) |
| PayrollSetupServices | store#Group | People/Payroll/PayGroups (GroupTerms) | People/Payroll/PayGroups (New pay group, Edit policy, End group) (People P22) |
| PayrollSetupServices | prepare#Periods | People/Payroll/PayGroups (Periods) | People/Payroll/PayGroups (Prepare periods; Preview the next periods) (People P22) |
| PayrollSetupServices | find#Assignments | People/Payroll/PayAssignments (Assignments) | People/Payroll/PayAssignments (FindAssignments, AssignmentList with each employment's readiness; an employment opened: AssignmentHistory) (People P23) |
| PayrollSetupServices | assign#PayStructure | People/Payroll/PayAssignments (AssignPay) | People/Payroll/PayAssignments (Assign pay with its preview; a row's End) (People P23) |
| PayrollSetupServices | store#PayrollProfile | People/Payroll/PayAssignments (TaxAndBenefits) | People/Payroll/PayAssignments (Tax and benefits: Edit tax profile with the localization's declared fields, Add benefit, a benefit's End; bank accounts as masked references only) (People P23) |
| PayrollSetupServices | get#Compensation | People/Employees/Employee360 (Compensation) | People/Employees/Employee360 (Compensation, a payroll reader's, through ironstone.people.ContextServices.get#Employee360Context); People/Payroll/PayAssignments (Tax and benefits) (People P23) |
| PeopleServices | apply#EmploymentChange (changeKind pay), decide#EmploymentChange | People/Employees/Employee360 (Compensation's salary change dialog) | People/Employees/Employee360 (Compensation's Change salary; Employment changes' Approve and Refuse for the pay change's approver) (People P23) |
| PayrollLocalizationServices | calculate#Localization (interface), calculate#Demonstration | People/Payroll/PayStructureDetail (PreviewStructure's rule coverage) | People/Payroll/PayStructureDetail (Preview gross to net, through preview#Structure and the localization's registered service) (People P22) |
| PayrollLocalizationServices | find#Localizations | People/Payroll/PayGroups | — (the screens' localization choice reads the registrations; P29's settings may list them) (People P22) |
| PayrollInputServices | get#Reconciliation | People/Time/HoursForPay (Reconciliation) | People/Time/HoursForPay (FindReconciliation, the counts, ReconciliationList; an employment opened: its days, timesheets, leave and inputs; payroll's and a manager's for their reports, no amount) (People P24) |
| PayrollInputServices | prepare#Inputs | People/Time/HoursForPay (PrepareInputs); People/Payroll/PayRunDetail (Inputs) | People/Time/HoursForPay (Prepare inputs, with its preview, a source cutoff and some employees) (People P24); People/Payroll/PayRunDetail (Inputs: Prepare inputs with its preview, the period's counts) (People P25) |
| PayrollInputServices | store#Adjustment | People/Time/HoursForPay (ResolveInput); People/Payroll/PayAdjustments (Adjustment) | People/Time/HoursForPay (Resolve a day); People/Payroll/PayAdjustments (New adjustment, a row's Edit, Withdraw and Correct) (People P24) |
| PayrollInputServices | find#Adjustments | People/Payroll/PayAdjustments (Adjustments) | People/Payroll/PayAdjustments (FindAdjustments, AdjustmentList, To decide) (People P24) |
| PayrollInputServices | decide#Adjustment, approve#Adjustment, refuse#Adjustment | People/Payroll/PayAdjustments (ApproveAdjustment); the PeoplePayAdjustmentApproval topic | People/Payroll/PayAdjustments (a row's Approve and Refuse, Approve selected); People/Approvals and the tray (the topic's approve and refuse) (People P24) |
| PayrollInputServices | check#SourceUse, release#Sources | — (the source guards of design §6 and PE-09) | — (no screen: Mantle's InvoiceServices create#TimeEntryInvoiceItems and ApprovedTimeBilling, TimesheetServices get#TimesheetAccess and reopen#Timesheet, TimeServices store# and delete#TimeEntry and ExpenseServices reserve#ClaimSettlement call them; TimesheetDetail shows a paid week's refused reopen) (People P24) |
| PayrollRunServices | find#Runs | People/Payroll/PayRuns (Runs) | People/Payroll/PayRuns (FindRuns, RunList with each run's errors, gross, net and state; Needs attention); People's Today (the payroll operator's payroll exceptions) (People P25) |
| PayrollRunServices | create#Run | People/Payroll/PayRuns (NewRun) | People/Payroll/PayRuns (New pay run, opening PayRunDetail) (People P25) |
| PayrollRunServices | select#Employments | People/Payroll/PayRunDetail (Population) | People/Payroll/PayRunDetail (Population: bring in step with the group, the pay date, a row's Exclude with its reason and Include again) (People P25) |
| PayrollRunServices | calculate#Run | People/Payroll/PayRunDetail (CalculateAndReview) | People/Payroll/PayRunDetail (Calculate and review: Calculate, resuming pending, failed and changed employees) (People P25) |
| PayrollRunServices | get#Run | People/Payroll/PayRunDetail (CalculateAndReview, Approval) | People/Payroll/PayRunDetail (the header, the steps and progress, the population, an employee's lines and inputs, the Approval step's totals) (People P25) |
| PayrollRunServices | submit#Run, approve#Run, return#Run | People/Payroll/PayRunDetail (Approval); the PayrollRunApproval topic | People/Payroll/PayRunDetail (Approval: Ask for approval, Approve, Return); People/Approvals and the tray (the topic's approve and return) (People P25) |
| PayrollRunServices | cancel#Run | People/Payroll/PayRunDetail (the record header) | People/Payroll/PayRunDetail (Cancel run with its reason, a run not approved; its inputs released) (People P25 review) |
| PayrollRunServices | create#Correction | People/Payroll/PayslipDetail (CorrectPay) | People/Payroll/PayslipDetail (Correct pay: a correction run with the reason and a pay date, opened in PayRunDetail; its slip linked to the original) (People P26) |
| PayrollResultServices | find#Payslips | People/Payroll/Payslips (Slips) | People/Payroll/Payslips (FindPayslips, SlipList: preview, final, issued and corrections, the legacy history labelled historical); People/SelfService and Commons/People/SelfService (My payslips: the user's own issued slips, with mine) (People P26) |
| PayrollResultServices | get#Payslip | People/Payroll/PayslipDetail (PayBreakdown) | People/Payroll/PayslipDetail (the header, Pay breakdown with each line's rule and explanation, Year to date, Original and corrections with the net effect, Inputs paid, Download statement; a legacy pay record by its own key) (People P26) |
| PayrollResultServices | get#MyPayslip | People/Payroll/PayslipDetail (own issued slips; the Assistant's tool) | People/MyPayslip and Commons/People/MyPayslip (the user's own issued slip, or their own legacy pay record by its key: P26 review); the Assistant's people_my_payslip tool ("Explain this payslip", the people-payslip-explain skill) (People P26) |
| PayrollResultServices | get#MyPayslipStatement | People/Payroll/PayslipDetail (own issued slips' statement) | MyPayslip's Download statement (the user's own issued slip's stored statement; no tool) (People P26 review) |
| PayrollResultServices | issue#Payslip | People/Payroll/PayslipDetail (StatementOutput) | People/Payroll/PayslipDetail (Issue statement, a final slip's: rendered once, stored, the PayslipIssued notice) (People P26) |
| PayrollResultServices | check#PayslipAccess, create#PayslipContent | People/RecordFiles (the payslip host, PE-01) | People/Payroll/PayslipDetail (Files: RecordFiles of Payslip, payroll's, through get#RecordLinkInfo and RecordFiles' get#ContentType) (People P26) |
| PayrollRunServices | finalize#Run | People/Payroll/PayRunDetail (Finalize) | People/Payroll/PayRunDetail (5 Finalize: why the group is not live, Finalize and Finalize again; the run's pay obligations made and released to Accounting) (People P27) |
| PayrollRunServices | get#Settlement | People/Payroll/PayRunDetail (Settlement) | People/Payroll/PayRunDetail (6 Settlement: payment instructions, obligations with their invoices' state, posting and payments, overpayments to recover) (People P27) |
| PayrollRunServices | get#Obligation | People/Payroll/InvoiceDetail (payroll) | People/Payroll/InvoiceDetail (Shared/InvoiceDetail's People branch, template/PeopleInvoiceDetail.xml: a pay obligation's invoice, its lines, accounts and payments, for a payroll reader) (People P27) |
| PayrollSetupServices | get#RecoverySettings, store#RecoverySettings | People/Payroll/PayRecovery | People/Payroll/PayRecovery (Overpayment recovery: each employer's recovery deduction and cap, an amount or a percentage of net pay, changed by PAYROLL_CONFIGURE at the revision read) (People P27 review) |
| PayrollExchangeServices | preview#Batch | People/Payroll/PayrollExchange (Exchange) | People/Payroll/PayrollExchange (Exchange: an export of a group's period's approved inputs, an import of history before a cutover, an import of a processor's results, each row resolved and named; a file replayed opens its exchange) (People P28) |
| PayrollExchangeServices | reconcile#Batch | People/Payroll/PayrollExchange (Reconcile) | People/Payroll/PayrollExchange (Reconcile: the rows checked again, the totals and each employee's, the differences from what was signed off, a results group's live reasons) (People P28) |
| PayrollExchangeServices | execute#Batch | People/Payroll/PayrollExchange (CommitExchange) | People/Payroll/PayrollExchange (Export: written through the export target payrollExchangeInputs and stored with its manifest; history: historical pay records; results: the period's pay run, then PayRunDetail) (People P28) |
| PayrollExchangeServices | get#Batch, find#Batches | People/Payroll/PayrollExchange | People/Payroll/PayrollExchange (an exchange with its rows, reconciliation and stored files; the recent exchanges) (People P28) |
| PayrollExchangeServices | find#ExchangeRuns, find#ExportScopes, export#InputsTransfer | Admin/Data (Imports, Exports, DataExport) | the transfer targets payrollExchange (Admin's Imports, owner route peoplePayrollExchange) and payrollExchangeInputs (Admin's Exports and DataExport) (People P28) |

## Ledger (81 services)

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| AssetAutoPostServices | post#AssetReceipt |  | Maintenance/WorkOrders/MaterialIssueReceipt (Return unused: a return of an issuance to a maintenance work order is credited to its expense and dimensions, not WIP, and a receipt to the work that names no issuance yet to the policy's expense, inventory and supplies alike, AC-24, Maintenance P9 and its review) |
| AssetAutoPostServices | repost#AssetReceipt |  | Manufacturing/WorkOrders/Disassembly (a dated delta with forwardReceiptRepostEnabled, ReceiptAdjustments.js, Manufacturing P9) |
| AssetAutoPostServices | post#AssetIssuance |  | Maintenance/WorkOrders/MaterialIssueReceipt (Issue: to a maintenance work order or step, the MaintenanceCostPolicy expense with the facility, cost centre and project, not WIP; none mapped: the error journal, MAINTENANCE_COST_UNMAPPED; supplies the same, in place of the fixed-asset debit, the user's call of Nov 12; AC-24, Maintenance P9 and its review) |
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
| OtherAutoPostServices | post#WorkEffortCost |  | Accounting/PeriodClose/PeriodRuns (the project cost run); Projects timesheet approval (approve#Timesheet, reopen#Timesheet); — beside it at its four call sites, mantle.work.ProductionServices.sync#ProductionLaborCost (Manufacturing P10, F34) |
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
| OrderInfoServices | get#OrderDisplayInfo | Purchasing/Orders/OrderDetail; Shared/Customer360; Shared/Supplier360; PASS:Shop/Cart; PASS:Shop/Checkout; PASS:Shop/Orders/OrderConfirmation; PASS:Shop/Orders/OrderDetail; Commerce/Orders/CartDetail; Commerce/Orders/OrderDetail; Sales/Orders/OrderDetail | — (replaced by mantle.account.CustomerFinanceServices.get#CustomerFinance on Accounting/Receivables/Customer360); — (Purchasing P3: OrderDetail reads through ironstone.purchasing.OrderServices.get#OrderDetail; the display info gains revisionHistoryList and itemOtherAuditLogList); — Shop: Cart, Checkout and the account's orders read their own projections (ShopCartServices.get#Cart, ShopCheckoutServices.get#OrderConfirmation, ShopCustomerServices.get#Order; Shop P4–P6); — Commerce: Customer360's store relationships through StoreOperationsServices (Commerce P8) |
| OrderInfoServices | get#OrderItemsTotalCount |  |  |
| OrderInfoServices | get#OrderItemDisplayInfo |  |  |
| OrderInfoServices | get#OrderPartBillingAddress |  |  |
| OrderInfoServices | validate#Order |  |  |
| OrderInfoServices | validate#OrderRequireManual |  |  |
| OrderInfoServices | check#OrderPreApprove | Shared/OrderDetail; Accounting/Records/OrderDetail; CustomerService/Orders/OrderDetail; Purchasing/Orders/OrderDetail; Commerce/Orders/OrderDetail; Sales/Orders/OrderDetail | (the OrderPreApproveCredit SECA; autoApprove#Order); Purchasing/Orders/OrderDetail (Approve: approve#Order meets check#PurchaseApprovalRequired's warning, the SECA on this service) (Purchasing P3, P4); CustomerService/Orders/OrderDetail (its credit hold read only, Customer Service P3); — Commerce/Orders/OrderDetail read only (StoreOperationsServices.get#StoreOrder; its order work is Customer Service's and Accounting's; Commerce P8) |
| OrderInfoServices | send#OrderStoreEmail | Purchasing/Orders/OrderDetail; Shared/OrderDetail; Commerce/Orders/OrderDetail | — Purchasing: send#PurchaseOrder mails the purchase order (Purchasing P3); — Commerce: the store's order emails go out from Mantle's order flow (the store's PsetOrderPlaced binding, StoreDetail's Emails tab, Commerce P2); Commerce/Orders/OrderDetail read only (StoreOperationsServices.get#StoreOrder; its order work is Customer Service's and Accounting's; Commerce P8) |
| OrderInfoServices | notify#OrderHighPriority |  |  |
| OrderServices | create#Order | Purchasing/Orders/PurchaseOrders; Sales/Quotes/Quotes; Sales/Orders/Orders; Sales/Quotes/QuoteRequestDetail | Purchasing/Orders/PurchaseOrders and Purchasing/NewPurchaseOrder (through mantle.order.PurchaseServices.create#PurchaseOrder) (Purchasing P3) |
| OrderServices | update#OrderHeader | Purchasing/Orders/OrderDetail; Shared/OrderDetail; Commerce/Orders/OrderDetail; Sales/Orders/OrderDetail | — (Purchasing P3: a draft's reference through PurchaseServices.update#PurchaseOrder); — Commerce/Orders/OrderDetail read only (StoreOperationsServices.get#StoreOrder; its order work is Customer Service's and Accounting's; Commerce P8) |
| OrderServices | create#OrderPart | Purchasing/Orders/OrderDetail; Shared/OrderDetail; Commerce/Orders/OrderDetail; Sales/Orders/OrderDetail; Sales/Orders/Orders; Sales/Quotes/Quotes | — Purchasing: one part per order, made by create#PurchaseOrder (Purchasing P3); — Commerce/Orders/OrderDetail read only (StoreOperationsServices.get#StoreOrder; its order work is Customer Service's and Accounting's; Commerce P8); Shop's cart order has its one part from create#Order (ShopCart.js; Shop P4) |
| OrderServices | update#OrderPart | Purchasing/Orders/OrderDetail; Shared/OrderDetail; Commerce/Orders/OrderDetail; Sales/Orders/OrderDetail | — (Purchasing P3: a draft's receiving facility through PurchaseServices.update#PurchaseOrder); — Commerce/Orders/OrderDetail read only (StoreOperationsServices.get#StoreOrder; its order work is Customer Service's and Accounting's; Commerce P8) |
| OrderServices | get#OrderItemTotal |  |  |
| OrderServices | create#OrderItem | Purchasing/Orders/OrderDetail; Shared/OrderDetail; Commerce/Orders/OrderDetail; Sales/Orders/OrderDetail | Purchasing/Orders/OrderDetail (Add line, through PurchaseServices.store#PurchaseOrderItem) (Purchasing P3); CustomerService/Orders/OrderChangeDetail (ApplyChange: a short pick's substitute line; Customer Service P10); — Commerce/Orders/OrderDetail read only (StoreOperationsServices.get#StoreOrder; its order work is Customer Service's and Accounting's; Commerce P8); Commerce/Integrations/ChannelImport and the channel intake make a channel order's lines (StoreChannels.js consume#ChannelOrder; Commerce P13) |
| OrderServices | update#OrderItem | Purchasing/Orders/OrderDetail; Shared/OrderDetail; Commerce/Orders/OrderDetail; Sales/Orders/OrderDetail | — (Purchasing P3: a draft line through PurchaseServices.store#PurchaseOrderItem, the entity update); PASS:Shop/Cart (through mantle.order.ShopCartServices; Shop P4); PASS:Shop/Checkout (through mantle.order.ShopCheckoutServices; Shop P5) (the frozen prices); — Commerce/Orders/OrderDetail read only (StoreOperationsServices.get#StoreOrder; its order work is Customer Service's and Accounting's; Commerce P8) |
| OrderServices | delete#OrderItem | Purchasing/Orders/OrderDetail; Shared/OrderDetail; PASS:Shop/Cart; Commerce/Orders/OrderDetail; Sales/Orders/OrderDetail | Purchasing/Orders/OrderDetail (Remove, through PurchaseServices.delete#PurchaseOrderItem) (Purchasing P3); PASS:Shop/Cart (through mantle.order.ShopCartServices; Shop P4) (remove#CartItem); — Commerce/Orders/OrderDetail read only (StoreOperationsServices.get#StoreOrder; its order work is Customer Service's and Accounting's; Commerce P8) |
| OrderServices | recalc#OrderItemAmount |  |  |
| OrderServices | recalc#OrderPartItemAmounts |  |  |
| OrderServices | check#AvailableInventory |  |  |
| OrderServices | add#OrderProductQuantity | Purchasing/Orders/OrderDetail; Shared/OrderDetail; PASS:Shop/Products/ProductDetail; PASS:Shop/Cart; PASS:Shop/Orders/OrderDetail; Commerce/Orders/OrderDetail; Sales/Orders/OrderDetail | — (Purchasing P3: lines through PurchaseServices.store#PurchaseOrderItem, create#OrderItem at the resolver's supplier price); PASS:Shop/Cart (through mantle.order.ShopCartServices; Shop P4) (add#CartItem, from PASS:Shop/Products/ProductDetail too); — Commerce/Orders/OrderDetail read only (StoreOperationsServices.get#StoreOrder; its order work is Customer Service's and Accounting's; Commerce P8) |
| OrderServices | update#OrderProductQuantity | PASS:Shop/Cart | — Shop: a line's quantity through ShopCartServices.update#CartItem (update#OrderItem; Shop P4) |
| OrderServices | merge#OrderItems |  |  |
| OrderServices | set#OrderBillingShippingInfo | Shared/OrderDetail; PASS:Shop/Checkout; Commerce/Orders/OrderDetail; Sales/Orders/OrderDetail | PASS:Shop/Checkout (through mantle.order.ShopCheckoutServices; Shop P5) (set#CheckoutAddresses); — Commerce/Orders/OrderDetail read only (StoreOperationsServices.get#StoreOrder; its order work is Customer Service's and Accounting's; Commerce P8) |
| OrderServices | add#OrderPartPayment | Shared/OrderDetail; PASS:Shop/Checkout; Commerce/Orders/OrderDetail; Sales/Orders/OrderDetail | Purchasing/Orders/OrderDetail#PurchaseOrderPrepaymentForm (through mantle.order.PurchaseServices.request#SupplierPrepayment) (Purchasing P6); PASS:Shop/Checkout (through mantle.order.ShopCheckoutServices; Shop P5); the renewal's order (ShopSubscriptions.js; Shop P7); — Commerce/Orders/OrderDetail read only (StoreOperationsServices.get#StoreOrder; its order work is Customer Service's and Accounting's; Commerce P8) |
| OrderServices | create#OrderPayments50Split |  |  |
| OrderServices | change#OrderStatusInterface |  |  |
| OrderServices | update#OrderStatus | Purchasing/Orders/OrderDetail | — Purchasing: the status moves through mantle.order.PurchaseServices (place, decide#PurchaseApproval, send, hold, cancel) (Purchasing P3) |
| OrderServices | propose#Order | Sales/Orders/OrderDetail |  |
| OrderServices | place#Order | Purchasing/Orders/OrderDetail; PASS:Shop/Checkout; Commerce/Orders/OrderDetail; Sales/Orders/OrderDetail; PASS:Sales/CustomerQuote | Purchasing/Orders/OrderDetail (Place, through PurchaseServices.place#PurchaseOrder) (Purchasing P3); PASS:Shop/Checkout (through mantle.order.ShopCheckoutServices; Shop P5); the renewal's order (Shop P7); Commerce/Integrations/ChannelImport and the channel intake (StoreChannels.js; Commerce P13); — Commerce/Orders/OrderDetail read only (StoreOperationsServices.get#StoreOrder; its order work is Customer Service's and Accounting's; Commerce P8) |
| OrderServices | approve#Order | Purchasing/Orders/OrderDetail; Purchasing/Orders/PurchaseOrders; Commerce/Orders/OrderDetail; Sales/Orders/OrderDetail | Purchasing/Orders/OrderDetail (Approve) and Purchasing/Orders/PurchaseOrders (bulk), through PurchaseServices.decide#PurchaseApproval; its direction check and the approval gate (Purchasing P3); — Commerce/Orders/OrderDetail read only (StoreOperationsServices.get#StoreOrder; its order work is Customer Service's and Accounting's; Commerce P8); store orders approve by Mantle's store approval checks (StoreDetail's Order checks tab, Commerce P2) |
| OrderServices | autoApprove#OrdersDelayed |  |  |
| OrderServices | autoApprove#Order |  |  |
| OrderServices | isFulfilled#OrderPart |  |  |
| OrderServices | isFulfilled#OrderItem |  |  |
| OrderServices | checkComplete#OrderPart |  |  |
| OrderServices | checkStillComplete#Order |  |  |
| OrderServices | checkCancelComplete#Order |  |  |
| OrderServices | checkRejectedComplete#Order |  |  |
| OrderServices | complete#OrderPart | Purchasing/Orders/OrderDetail | — Purchasing: close#PurchaseRemainders completes the part (Purchasing P3) |
| OrderServices | complete#Order | Purchasing/Orders/PurchaseOrders | Purchasing/Orders/PurchaseOrders and Purchasing/Orders/OrderDetail (Close remainder: close#PurchaseRemainders completes the part) (Purchasing P3) |
| OrderServices | cancel#Order | Purchasing/Orders/OrderDetail; Commerce/Orders/OrderDetail; Sales/Orders/OrderDetail; PASS:Sales/CustomerQuote | Purchasing/Orders/OrderDetail (Cancel order, through PurchaseServices.cancel#PurchaseOrder) (Purchasing P3); Commerce/Orders/CartDetail (ResolvePlacement's refund cancels the cart, through ShopOperationsServices.resolve#StuckPlacement) (Shop P8) |
| OrderServices | cancel#OrderPart | Purchasing/Orders/OrderDetail | — Purchasing: cancel#PurchaseOrder (Purchasing P3) |
| OrderServices | cancel#OrderItem | Purchasing/Orders/OrderDetail | Warehouse/Receiving/ReceiptDetail (Finish receipt, close), with an explicit cancelQuantity through OrderServices.close#PurchaseRemainders; flags picked stock above a reduced line (putBackQuantity) for Warehouse/Picking/Pick (PutBack, reverse#Pick, P11); Purchasing/Orders/OrderDetail (Close remainder, through close#PurchaseRemainders) (Purchasing P3); CustomerService/Orders/OrderChangeDetail (ApplyChange: the open remainder or a short pick's, through apply#OrderChange; Customer Service P10) |
| OrderServices | reject#Order |  | Purchasing/Orders/OrderDetail and Purchasing/Approvals (Refuse, through mantle.order.PurchaseServices.decide#PurchaseApproval) (Purchasing P4) |
| OrderServices | reject#OrderPart |  |  |
| OrderServices | reject#OrderItem |  |  |
| OrderServices | clone#Order | Purchasing/Orders/OrderDetail; Sales/Orders/OrderDetail; Commerce/Orders/OrderDetail; Commerce/Customers/Customer360 | Purchasing/Orders/OrderDetail (Clone, through PurchaseServices.clone#PurchaseOrder) (Purchasing P3); Commerce/Orders/OrderDetail (Order again, through mantle.order.StoreOperationsServices.reorder#StoreOrder: copyPayment false, then repriced; Commerce P8) |
| OrderServices | update#OrderRecur | Shared/OrderDetail; Sales/Orders/OrderDetail; Sales/Agreements/RecurringOrders |  |
| OrderServices | create#RecurringOrders |  | Accounting/Receivables/RecurringInvoices (its job's last run) |
| OrderServices | create#RecurringOrder |  |  |
| OrderServices | handle#OrderItemChange |  |  |
| OrderServices | handle#OrderPartChange |  |  |
| OrderServices | handle#OrderMajorChange |  |  |
| OrderServices | update#OrderHeaderTotal |  |  |
| OrderServices | update#OrderPartTotal |  |  |
| OrderServices | increment#OrderRevision | Purchasing/Orders/OrderChanges | (Purchasing P3: the commercial revision behind PurchasePolicy.commercialRevisionOnly); Purchasing/Orders/OrderChanges (ApplyRevision counts the revision once, through apply#PurchaseRevision; Purchasing P9); (Customer Service P10: a sales order's commercial revision behind PartyAcctgPreference.salesCommercialRevisionOnly, F55) |
| OrderServices | create#OrderContent | Shared/RecordFiles; Shared/OrderDetail; Sales/Orders/OrderDetail | Shared/RecordFiles |
| OrderServices | update#OrderContent | Shared/OrderDetail; Sales/Orders/OrderDetail |  |
| OrderServices | save#OrderContentFile | Shared/RecordFiles |  |
| OrderServices | create#PurchaseRequestOrder | Projects/Requests/RequestDetail; Purchasing/Requests/RequestSourcing | — (BOSS never calls it: RequestSourcing calls convert#PurchaseSourcing, F4; Purchasing P10) |
| ReturnServices | get#ReturnDisplayInfo | Warehouse/Returns/ReturnDetail; Purchasing/Returns/ReturnDetail; CustomerService/Returns/ReturnDetail; CustomerService/Returns/Returns; Shared/Customer360; Shared/ReturnDetail | — (§7: a return list on Customer360; Accounting/Records/ReturnDetail reads through ironstone.accounting.ReturnScreenServices.get#ReturnContext); — Purchasing: ironstone.purchasing.ReturnServices reads its ReturnDetail branch (Purchasing P8); CustomerService/Returns/ReturnDetail, CustomerService/Returns/Returns (Customer Service P9, through mantle.order.ReturnPolicyServices and its Customer Service branch) |
| ReturnServices | create#Return | Warehouse/Returns/Returns; Purchasing/Returns/ReturnDetail | Warehouse/Returns/Returns (NewReturn: a supplier return from a facility); — Purchasing: create#ReturnFromOrder after check#Record (Purchasing P8, F100) |
| ReturnServices | create#ReturnFromOrder | Warehouse/Returns/Returns; Purchasing/Returns; CustomerService/Returns/NewReturn; PASS:Support/RequestReturn; Shared/ReturnDetail | Warehouse/Returns/Returns (NewReturn: a customer return from a sales order); Purchasing/Returns/SupplierReturns (NewSupplierReturn: a supplier return from a purchase order) (Purchasing P8); CustomerService/Returns/NewReturn (Customer Service P9, through mantle.order.ReturnPolicyServices and its Customer Service branch) |
| ReturnServices | find#OrderOpenReturns | CustomerService/Returns/NewReturn; PASS:Support/RequestReturn | CustomerService/Returns/NewReturn (Customer Service P9, through mantle.order.ReturnPolicyServices and its Customer Service branch) |
| ReturnServices | find#ReturnableOrderItems | Warehouse/Returns/ReturnDetail; Purchasing/Returns; CustomerService/Returns/NewReturn; PASS:Support/RequestReturn; Shared/ReturnDetail; PASS:Shop/Orders/RequestReturn | Warehouse/Returns/ReturnDetail (Eligible items of a customer return); — Purchasing: find#ReturnableReceipts (Purchasing P8); CustomerService/Returns/NewReturn (Customer Service P9, through mantle.order.ReturnPolicyServices and its Customer Service branch); — Shop: a return request from the account's order goes to Customer Service's request#CustomerReturn (Shop P6); — Commerce: Commerce/Orders/ReturnDetail reads Customer Service's return, read only (Commerce P8) |
| ReturnServices | calculate#OrderItemReturnable | Warehouse/Returns/ReturnDetail; Purchasing/Returns; CustomerService/Returns/NewReturn; PASS:Support/RequestReturn; Shared/ReturnDetail | Warehouse/Returns/ReturnDetail (Eligible items, Add: through add#OrderItemToReturn); — Purchasing: find#ReturnableReceipts (Purchasing P8); CustomerService/Returns/NewReturn (Customer Service P9, through mantle.order.ReturnPolicyServices and its Customer Service branch) |
| ReturnServices | add#OrderItemToReturn | Warehouse/Returns/ReturnDetail; Purchasing/Returns/ReturnDetail; CustomerService/Returns/NewReturn; PASS:Support/RequestReturn; Shared/ReturnDetail | Warehouse/Returns/ReturnDetail (Eligible items, Add); — Purchasing: add#ReceiptToReturn (Purchasing P8); CustomerService/Returns/NewReturn (Customer Service P9, through mantle.order.ReturnPolicyServices and its Customer Service branch) |
| ReturnServices | change#ReturnStatusInterface |  |  |
| ReturnServices | update#ReturnStatus |  |  |
| ReturnServices | checkUpdate#ReturnHeaderStatus |  | (WarehouseTaskServices.ship#SupplierReturn: ReturnShipped) |
| ReturnServices | request#Return | Warehouse/Returns/ReturnDetail; Purchasing/Returns/ReturnDetail; CustomerService/Returns/ReturnDetail; CustomerService/Returns/NewReturn; PASS:Support/RequestReturn | Warehouse/Returns/ReturnDetail (Submit for authorization); — Purchasing: ReturnDetail's Authorize (AuthorizeSupplierReturnForm, RETURN_AUTHORIZE) (Purchasing P8); CustomerService/Returns/NewReturn, CustomerService/Returns/ReturnDetail (Customer Service P9, through mantle.order.ReturnPolicyServices and its Customer Service branch) |
| ReturnServices | approve#Return | Warehouse/Returns/ReturnDetail; Purchasing/Returns/ReturnDetail; CustomerService/Returns/ReturnDetail | Purchasing/Returns/ReturnDetail (Authorize, through authorize#SupplierReturn) (Purchasing P8); — (Warehouse: authorization is Customer Service's RETURN_AUTHORIZE, which no Warehouse group holds); CustomerService/Returns/ReturnDetail (Customer Service P9, through mantle.order.ReturnPolicyServices and its Customer Service branch) |
| ReturnServices | receive#ReturnShipmentItems | Warehouse/Returns/ReturnDetail; Warehouse/Returns/ReturnReceipt; Shared/ReturnDetail | — (Warehouse: replaced on the receipt path by WarehouseTaskServices.receive#ReturnItems) |
| ReturnServices | receive#ReturnWithoutShipment | Warehouse/Returns/ReturnDetail; CustomerService/Returns/ReturnDetail; Shared/ReturnDetail | — (not offered: a receipt without a carrier uses ReturnReceipt, design §11); CustomerService/Returns/ReturnDetail (Customer Service P9, through mantle.order.ReturnPolicyServices and its Customer Service branch) |
| ReturnServices | receive#ReturnItem | Warehouse/Returns/ReturnDetail; Warehouse/Returns/ReturnReceipt | — (Warehouse: replaced by WarehouseTaskServices.receive#ReturnItems) |
| ReturnServices | complete#ReturnItem | CustomerService/Returns/ReturnDetail; Shared/ReturnDetail | Accounting/Records/ReturnDetail (through settle#Return); CustomerService/Returns/ReturnDetail (Customer Service P9, through mantle.order.ReturnPolicyServices and its Customer Service branch) |
| ReturnServices | process#ReturnItemResponses | CustomerService/Returns/ReturnDetail; Accounting/Records/ReturnDetail; Shared/ReturnDetail | Accounting/Records/ReturnDetail (a customer return, through settle#Return); CustomerService/Returns/ReturnDetail (Customer Service P9, through mantle.order.ReturnPolicyServices and its Customer Service branch) |
| ReturnServices | cancel#Return | Warehouse/Returns/ReturnDetail; Purchasing/Returns/ReturnDetail; CustomerService/Returns/ReturnDetail | Purchasing/Returns/ReturnDetail (Cancel return, before authorization) (Purchasing P8); — not built (P14): ReturnDetail has no cancel; it changes a return only by adding eligible items; CustomerService/Returns/ReturnDetail (Customer Service P9, through mantle.order.ReturnPolicyServices and its Customer Service branch) |
| ReturnServices | cancel#ReturnItem | Warehouse/Returns/ReturnDetail; CustomerService/Returns/ReturnDetail | — not built (P14): ReturnDetail does not change or remove an item; it adds eligible items only; CustomerService/Returns/ReturnDetail (Customer Service P9, through mantle.order.ReturnPolicyServices and its Customer Service branch) |
| ReturnServices | update#ReturnItem | Warehouse/Returns/ReturnDetail; Purchasing/Returns/ReturnDetail; CustomerService/Returns/ReturnDetail; CustomerService/Returns/NewReturn; PASS:Support/RequestReturn; Shared/ReturnDetail | — not built (P14): ReturnDetail does not change or remove an item; it adds eligible items only; — Purchasing: not built; items are added from receipts only (Purchasing P8); CustomerService/Returns/NewReturn, CustomerService/Returns/ReturnDetail (Customer Service P9, through mantle.order.ReturnPolicyServices and its Customer Service branch) |
| ReturnServices | delete#ReturnItem | Warehouse/Returns/ReturnDetail; Shared/ReturnDetail | — not built (P14): ReturnDetail does not change or remove an item; it adds eligible items only |
| ReturnServices | create#ReturnShipment | Warehouse/Returns/ReturnDetail; Purchasing/Returns/ReturnDetail; Shared/ReturnDetail | Warehouse/Returns/ReturnDetail (Create return shipment, for an approved return with none); (Purchasing P8: through authorize#SupplierReturn, the approval SECA) |
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
| TaxServices | calculate#OrderSalesTax | PASS:Shop/Checkout | PASS:Shop/Checkout (through mantle.order.ShopCheckoutServices; Shop P5) |
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
| BudgetServices | check#Budget | Accounting/Budgets/BudgetControls | Mantle (the preview of reserve#, convert#Commitment); Purchasing's order approval preview (preview#PurchaseApproval: Purchasing/Orders/OrderDetail Approvals; Purchasing P4); its request approval is §7 |
| BudgetServices | reserve#Commitment | Accounting/Budgets/BudgetControls | Mantle; Purchasing's order approval of a purchase order with no request (decide#PurchaseApproval, Purchasing P4); a purchase request's approval (decide#PurchaseRequestApproval: Purchasing/Requests/RequestDetail, Purchasing P10) |
| BudgetServices | convert#Commitment | Accounting/Payables/BillDetail | Accounting/Payables/BillDetail and ExpensePosting (through approve#Payable); a request-sourced purchase order line's approval (decide#PurchaseApproval: Purchasing/Orders/OrderDetail, Purchasing P10) |
| BudgetServices | release#Commitment | Accounting/Budgets/BudgetControls | Mantle; Purchasing's close (close#PurchaseRemainders) and order cancel (cancel#PurchaseOrder, Purchasing P4) release through release#ClosedSourceCommitments; a request cancel is §7 |
| BudgetReportServices | run#BudgetVariance | Accounting/Reports/BudgetVariance; Insights/Dashboard; Insights/Panels/PanelDetail; Insights/ReportBuilder/Analysis; Insights/ManagementDigest | Accounting/Reports/BudgetVariance |

## Party (86 services, 59 added)

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| AgreementServices | create#AgreementContent | Shared/RecordFiles; Purchasing/Agreements/AgreementDetail; Sales/Agreements/AgreementDetail | Shared/RecordFiles; Purchasing/Agreements/AgreementDetail (Add file; Purchasing P13) |
| AgreementServices | update#AgreementContent | Purchasing/Agreements/AgreementDetail; Sales/Agreements/AgreementDetail | — Purchasing: an agreement's file is not edited after its upload (F135) (Purchasing P13) |
| AgreementServices | save#AgreementContentFile | Shared/RecordFiles |  |
| CommunicationServices | find#PartyCommunicationEvents | Shared/Chatter; CustomerService/Cases/ChannelSessions | CustomerService/Cases/ChannelSessions |
| CommunicationServices | create#Message | Commons/QuickCreate; Commons/Files; Comms/Inbox/Compose; Projects/Requests/RequestDetail; Projects/Code/MergeRequestDetail/Changes; Shared/Chatter; CustomerService/Cases/CaseDetail; Shared/RequestDetail; PASS: Forum/Compose; Sales/Pipeline/OpportunityDetail | Comms/Inbox/Compose; Shared/Chatter; CustomerService/Cases/CaseDetail (Conversation, through Shared/Chatter and Compose, Customer Service P2) |
| CommunicationServices | reply#CommunicationEvent | Comms/Inbox/Compose; Projects/Code/MergeRequestDetail/Changes; Shared/Chatter | Comms/Inbox/Compose; Shared/Chatter |
| CommunicationServices | add#WikiPageComment | Commons/Knowledge; Commons/Knowledge/Review |  |
| CommunicationServices | get#CommunicationEventContentLocation |  |  |
| CommunicationServices | create#CommunicationEventContent | Shared/RecordFiles | Shared/RecordFiles |
| CommunicationServices | update#CommunicationEventContent |  |  |
| CommunicationServices | save#CommunicationEventContentFile | Shared/RecordFiles |  |
| ContactServices | get#PartyContactInfo | Commons/Contacts/ContactDetail; Comms/Inbox; Marketing/Contacts/ContactDetail; Admin/Settings/OrganizationDetail | Commons/Contacts/ContactDetail; Commons/Contacts/List; Commons/Settings/Account; Comms/Inbox/Mail; Projects/Billing/InvoiceDetail; Projects/Billing/InvoicePrint; Admin/Settings/OrganizationDetail (Contacts: OrganizationContacts) (Admin P7) |
| ContactServices | get#PartyContactInfoList | PASS:Shop/Account/Addresses; PASS:Shop/Checkout | — Shop: PASS:Shop/Account/Addresses and Checkout's saved addresses through ShopCustomerServices.get#Addresses (Shop P5, P6) |
| ContactServices | get#PartyDefaultBilling |  |  |
| ContactServices | store#PartyContactInfo | Commons/Contacts/ContactDetail; Commons/Settings/Account; PASS:Shop/Account/Addresses; PASS:Shop/Checkout; Marketing/Contacts/ContactDetail; Admin/Settings/OrganizationDetail | Commons/Contacts/ContactDetail; Commons/Contacts/List; Commons/Settings/Account; — Shop: PASS:Shop/Account/Addresses through ShopCustomerServices.store#Address, Checkout through set#CheckoutAddresses (Shop P5, P6); Admin/Settings/OrganizationDetail (Contacts: storeContacts, after the Admin record check) (Admin P7); People/Employees/Employee360 and Commons/People/Employee360 (through mantle.humanres.PeopleServices.store#PersonalInfo: home and mobile phones, home address) (People P2) |
| ContactServices | create#PostalAddress | PASS:Shop/Account/Addresses; PASS:Shop/Checkout | PASS:Shop/Account/Addresses (ShopCustomerServices.store#Address); PASS:Shop/Checkout (through mantle.order.ShopCheckoutServices; Shop P5) (set#CheckoutAddresses) |
| ContactServices | update#PartyPostalAddress | PASS:Shop/Account/Addresses; PASS:Shop/Checkout | PASS:Shop/Account/Addresses (ShopCustomerServices.store#Address, end#Address; Shop P6) |
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
| PartyServices | find#Party | Commons/Contacts; Purchasing/Suppliers | Commons; Commons/Contacts/ContactDetail; Commons/Contacts/List; Comms/Consent/List; — Purchasing: ironstone.purchasing.SupplierServices finds the suppliers in scope (Purchasing P2) |
| PartyServices | search#Party | Commons/Contacts; Comms/Panel/Chat; Comms/Inbox |  |
| PartyServices | search#Person |  | Commons/Calendar; Commons/Calendar/EventDetail; Commons/QuickCreate; Projects/Projects/ProjectDetail/Plan/Calendar |
| PartyServices | get#UserNoticeCounts |  |  |
| PartyServices | setup#UserOrganizationInfo | Commons; Comms; Projects; Products; Warehouse; Purchasing; CustomerService; Accounting; Manufacturing; Maintenance; Commerce; Marketing; Admin; Insights | Commons; Comms; Projects; Products; Manufacturing (the root's always-actions, Manufacturing P1); CustomerService (the root's always-actions, Customer Service P1); Insights (the root's always-actions, Insights P1) |
| PartyServices | get#PartyOrganizationInfo |  | Insights (every screen, through ironstone.insights.ContextServices.get#Context; Insights P1) |
| PartyServices | create#Account |  |  |
| PartyServices | update#Account |  | Commons/Settings/Account |
| PartyServices | create#UserAccountPerson |  |  |
| PartyServices | create#PartyUserAccount | Admin/Users/Users | Admin/Users/Users (NewStaffAccount, through mantle.party.IdentityServices.create#StaffAccount) (Admin P4); AcceptInvitation (an accepted invitation with no account, through accept#Invitation) (Admin P5) |
| PartyServices | update#PartyUserAccount | Admin/Users/UserDetail | Admin/Users/UserDetail (Account, through mantle.party.IdentityServices.store#Account: the account's fields only, F68) (Admin P4) |
| PartyServices | create#Person | Commons/QuickCreate; Purchasing/Suppliers; Sales/Accounts/Accounts; Sales/Accounts/ContactDetail | Purchasing/Suppliers/SupplierList (through mantle.party.SupplierServices.create#Supplier) |
| PartyServices | create#PersonCustomer |  |  |
| PartyServices | create#PersonEmployee |  |  |
| PartyServices | create#Organization | Commons/QuickCreate; Purchasing/Suppliers; Admin/Settings/Organizations | Purchasing/Suppliers/SupplierList (through mantle.party.SupplierServices.create#Supplier); Admin/Settings/Organizations (CreateOrganization, through mantle.party.IdentityServices.create#InternalOrganization) (Admin P7); People/Employees/OrgStructure (NewUnit, a department or team, through mantle.humanres.OrganizationServices.store#Unit) (People P3) |
| PartyServices | update#PartyDetail | Commons/Contacts/ContactDetail; Shared/Customer360; Shared/Supplier360; Sales/Accounts/Customer360; Sales/Accounts/ContactDetail; Marketing/Contacts/ContactDetail; Marketing/Customers/Customer360; Admin/Settings/OrganizationDetail | Commons/Contacts/Compare; Commons/Contacts/ContactDetail; Commons/Contacts/List; Admin/Settings/OrganizationDetail (Profile, through store#InternalOrganization: the name and pseudo id) (Admin P7) |
| PartyServices | convert#PartyToOrganization |  |  |
| PartyServices | convert#PartyToPerson |  |  |
| PartyServices | ensure#PartyRole | Purchasing/Suppliers; Admin/Settings/Organizations; Admin/Settings/OrganizationDetail | — (create#Supplier adds the Supplier role through create#Person or create#Organization); — Purchasing: create#Supplier gives the Supplier role (Purchasing P2); — Admin: create#InternalOrganization gives the OrgInternal role through create#Organization (Admin P7); People/Employees/OrgStructure and People/Employees/OrgChart (a member's, lead's and manager's role, through mantle.humanres.OrganizationServices.store#Membership and change#Manager) (People P3) |
| PartyServices | set#PartyClassification | Purchasing/Suppliers/Supplier360; Shared/Customer360; Sales/Accounts/Customer360 | Shared/Supplier360/Buying, Purchasing/Suppliers/SupplierList (through mantle.party.SupplierServices.set#SupplierCategory); — (other apps' contexts on Customer360, §7) |
| PartyServices | remove#PartyClassification | Purchasing/Suppliers/Supplier360; Shared/Customer360; Sales/Accounts/Customer360 | Shared/Supplier360/Buying, Purchasing/Suppliers/SupplierList (through set#SupplierCategory); — (other apps' contexts on Customer360, §7) |
| PartyServices | get#PartyBadgeInfo |  |  |
| PartyServices | lookup#PartyBadge |  |  |
| PartyServices | scan#PartyBadge |  |  |
| PartyServices | get#PartyContentLocation |  |  |
| PartyServices | create#PartyContent | Commons/Contacts/ContactDetail; Commons/Settings/Account; Shared/RecordFiles; Marketing/Contacts/ContactDetail; Marketing/Customers/Customer360 | Commons/Contacts/ContactDetail; Commons/Contacts/List; Commons/Settings/Account; Shared/RecordFiles |
| PartyServices | update#PartyContent |  |  |
| PartyServices | save#PartyContentFile | Shared/RecordFiles |  |
| PartyServices | get#PartySettingValue | Admin/Settings/OrganizationDetail | — (Admin P7: OrganizationDefaults reads the organization's own and inherited values in store#OrganizationDefault's service, F104) |
| PartyServices | store#PartySetting | Admin/Settings/OrganizationDetail | Admin/Settings/OrganizationDetail (Defaults, through store#OrganizationDefault) (Admin P7); Insights/Settings/AnalyticsSettings (ironstone.insights.ContextServices.store#Settings, Insights P10) |
| PartyServices | store#PartyRelationshipSetting |  |  |
| PartyServices | validate#PartySetting | Admin/Settings/OrganizationDetail | — (Admin P7: store#OrganizationDefault checks a registered type's value itself, F104) |
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
| CommunicationServices | get#RecordLinkInfo | Shared/Chatter; Shared/RecordFiles; Sales/Pipeline/OpportunityDetail | Commons/Calendar; Commons/Calendar/EventDetail; Commons/Files; Commons/Knowledge; Commons/Notes; Commons/QuickCreate; Commons/Requests/List; Commons/Requests/RequestDetail; Commons/Tasks/List; Commons/Tasks/TaskDetail; Comms/Chat; Comms/Inbox/Compose; Comms/Inbox/Mail; Comms/Inbox/MessageDetail; Shared/Chatter; Shared/RecordFiles; Projects: 19 screens (through the ironstone.* access and find services); People/Employees/Employee360 (Files and activity: the employment content host, its visibility by check#EmploymentAccess) (People P2) |
| CommunicationServices | findOrCreate#EmailCommunicationEvent |  | Comms/Inbox/Mail |
| CommunicationServices | link#CommunicationEventRecord |  | Comms/Chat; Comms/Inbox/Compose; Comms/Inbox/Mail; Comms/Inbox/MessageDetail; Shared/Chatter |
| CommunicationServices | unlink#CommunicationEventRecord |  | Comms/Inbox/Mail; Shared/Chatter |
| CommunicationServices | send#EmailDraft | Projects/Requests/RequestDetail; CustomerService/Cases/CaseDetail; Shared/RequestDetail; Sales/Orders/OrderDetail; Sales/Quotes/QuoteRequestDetail | Comms/Inbox/Compose; CustomerService/Orders/OrderDetail (Resend confirmation, through mantle.order.OrderConfirmationServices.resend#OrderConfirmation; Customer Service P3) |
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
| ConsentServices | get#PartyConsentState | Marketing/Audiences/Consent/ConsentDetail; Marketing/Customers/Customer360; Marketing/Contacts/ContactDetail; Commerce/Orders/CartDetail | Comms/Consent/Contact; — for Commerce/Orders/CartDetail#RecoveryHistory (P10 reads the store's cart reminders topic through mantle.public.AccountHubServices.check#CartReminderConsent, in mantle.order.StoreOperationsServices.get#CartRecovery) |
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
| ContactBookServices | find#OwnedContactBooks | Admin/Users/UserDetail | Admin/Users/UserDetail (Lifecycle review, the commons.contactBooks participant) (Admin P6) |
| ContactBookServices | transfer#ContactBookOwner | Admin/Users/LifecycleDetail | Admin/Users/LifecycleDetail (TransferOwnership) (Admin P6) |
| ContactImportServices | read#ContactFileText |  | Commons/Contacts/Import/Source; Projects/Time/Import/Source; Projects/WorkItems/Import/Source |
| ContactImportServices | parse#ContactFile | Marketing/Audiences/AudienceImport | Commons/Contacts/Import/Mapping; Commons/Contacts/Import/Source |
| ContactImportServices | preview#Contacts | Marketing/Audiences/AudienceImport | Commons/Contacts/Import/Preview |
| ContactImportServices | import#Contacts | Marketing/Audiences/AudienceImport | Commons/Contacts/Import/Result |
| ContactImportServices | export#Contacts | Admin/Data/DataExport | Commons/Contacts/ContactDetail; Commons/Contacts/List; Admin/Data/DataExport |
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
| AssetServices | get#AvailableInventory | Products/Products/Product360/Stock; Warehouse/Inventory/Availability; Purchasing/Replenishment/InventoryAvailability; CustomerService/Availability/InventoryAvailability; Shared/Product360; Shared/InventoryAvailability; Manufacturing/WorkOrders/NewWorkOrder; Manufacturing/BillsOfMaterials/BillOfMaterialsDetail/BillOfMaterialsExplosion; PASS:Shop/Products/ProductDetail | Shared/InventoryAvailability/Summary; Shared/Product360/Summary (kits); — Warehouse/Inventory/Availability/Summary: get#ProductStockTotals per facility; Manufacturing/WorkOrders/NewWorkOrder (producible now) and Manufacturing/BillsOfMaterials/BillOfMaterialsDetail/BillOfMaterialsExplosion (the buildable quantity), through get#BomExplosion (Manufacturing P5a, P2); Purchasing/Replenishment/InventoryAvailability (Shared/InventoryAvailability) (Purchasing P14); CustomerService/Availability/InventoryAvailability (Summary: get#ProductStockTotals at the customer-serving facilities; Customer Service P3); — PASS:Shop/Products/ProductDetail: get#AvailableInventoryMulti for the product and its variants at once (Shop P3) |
| AssetServices | get#AvailableForOrder | Warehouse/Inventory/Availability; Shared/InventoryAvailability | — Warehouse/Inventory/Availability/Summary: get#ProductStockTotals per facility (InventoryServices.get#InventorySummary) |
| AssetServices | get#AvailableInventoryMulti | Warehouse/Inventory/Availability; Warehouse/Picking/PickLocationMoves; Purchasing/Replenishment/InventoryAvailability; CustomerService/Availability/InventoryAvailability; Shared/InventoryAvailability; PASS:Shop/Categories/CategoryDetail | — Warehouse/Inventory/Availability/Summary (get#ProductStockTotals per facility); Picking/PickLocationMoves (find#PickFaceReplenishment); — Purchasing: Purchasing/Replenishment/InventoryAvailability as Warehouse's (Purchasing P14); — CustomerService/Availability/InventoryAvailability (Summary per facility; Customer Service P3); PASS:Shop/Home; PASS:Shop/Categories/CategoryDetail; PASS:Shop/Search; PASS:Shop/Products/ProductDetail (availability bands, through mantle.product.ShopCatalogServices; Shop P3) |
| AssetServices | update#Asset | Warehouse/Inventory/AssetDetail; Shared/EquipmentDetail; Maintenance/Equipment/EquipmentDetail | Warehouse/Inventory/AssetDetail (through AssetRecordServices.update#AssetMetadata); Maintenance/Equipment/EquipmentDetail/Identity (through MaintenanceResourceServices.store#MaintenanceEquipment) |
| AssetServices | update#Asset | Warehouse/Inventory/AssetDetail; Shared/EquipmentDetail | Warehouse/Inventory/AssetDetail (through AssetRecordServices.update#AssetMetadata); Warehouse/QualityInspection (Release and Scrap set the status through dispose#Inspection, P8) |
| AssetServices | update#AssetAcquireCost | Shared/EquipmentDetail | Accounting/FixedAssets/EquipmentDetail (AssetBookServices.repair#AcquireCost) |
| AssetServices | update#ProductAcquireCost | Accounting/Inventory/InventoryValuation | — (not organization-scoped; Accounting/Inventory/InventoryValuation calls AssetBookServices.repair#ProductAcquireCost, impl-accounting F270) |
| AssetServices | update#AssetFromDetail |  |  |
| AssetServices | recalculate#AllAssetTotals |  |  |
| AssetServices | get#AssetPools | Warehouse/Settings/AssetPools | Warehouse/Settings/AssetPools/PoolDetail (the reservation preview, through AssetPoolServices.preview#AssetPoolReservations; the list is AssetPoolServices.find#AssetPools) |
| AssetServices | reserve#AssetsForOrder | Warehouse/Orders/OrderDetail; Warehouse/Shipping/ShipmentDetail; Shared/ShipmentDetail | — not called: reservation stays Mantle's order SECAs (OrderPlacedReserveAssets) under P3's facility default; OrderDetail, ShipmentDetail show it |
| AssetServices | checkReserve#AssetForOrderItem |  |  |
| AssetServices | reserve#AssetForOrderItem | Warehouse/Orders/OrderDetail; Warehouse/Shipping/ShipmentDetail; Shared/OrderDetail; Shared/ShipmentDetail; Sales/Orders/OrderDetail | (the expiry gate, behind WarehousePolicy expiryBlock: expired stock skipped, the shortfall named; impl-warehouse P5); Purchasing/Receiving/ShipmentDetail (Bought for customer orders: Reserve for this order, through mantle.order.PurchasePegServices.reserve#ReceiptPeg; Purchasing P14b, R-PUR-37) |
| AssetServices | remove#OrderItemReservations | Shared/OrderDetail; Sales/Orders/OrderDetail |  |
| AssetServices | remove#OrderReservations |  |  |
| AssetServices | reduce#AssetReservation | Warehouse/Orders/OrderDetail; Warehouse/Shipping/ShipmentDetail; Shared/ShipmentDetail | — not offered: Warehouse/Orders/OrderDetail and ShipmentDetail show Reserved only; a held-stock disposition reduces it (Quality.js); — not called by apply#OrderChange: cancel#OrderItem's rule re-reserves the remainder (F66; Customer Service P10) |
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
| AssetServices | issue#AssetToWorkEffort | Warehouse/Inventory/MaterialIssueReceipt; Shared/MaterialIssueReceipt; Manufacturing/WorkOrders/WorkOrderDetail/MaterialIssueReceipt | Warehouse/Transfers/Repack (through repack#Asset, P6); Warehouse/Inventory/MaterialIssueReceipt (MaterialLines Issue, through issue#ProductionMaterial with issuanceFields: a new issuance, P16; beyond the line up to the ProductionPolicy scrap allowance, Manufacturing P4); Maintenance/WorkOrders/MaterialIssueReceipt (Issue, through mantle.work.MaintenanceExecutionServices.issue#MaintenanceMaterial with issuanceFields: a new issuance with the cost centre and project, Maintenance P9) |
| AssetServices | issue#AnyAssetToWorkEffort | Warehouse/Inventory/MaterialIssueReceipt; Shared/MaterialIssueReceipt; Manufacturing/WorkOrders/WorkOrderDetail/MaterialIssueReceipt | — Warehouse/Inventory/MaterialIssueReceipt (MaterialActionForm: pack#ShipmentAssembly for a kit, issue#ProductionMaterial for a run); — not used by Manufacturing: Manufacturing/WorkOrders/WorkOrderDetail/MaterialIssueReceipt issues through mantle.work.ProductionServices.issue#ProductionMaterial (issue#AssetToWorkEffort, Manufacturing P5b) |
| AssetServices | issue#AnyAssetForShipmentItemSource | Warehouse/Returns/SupplierReturnShipment | Warehouse/Returns/SupplierReturnShipment (Send back), through WarehouseTaskServices.issue#SupplierReturnStock with the new assetId |
| AssetServices | move#IssuancesToNewShipment |  |  |
| AssetServices | cancel#AssetIssuance | Warehouse/Inventory/MaterialIssueReceipt; Shared/MaterialIssueReceipt | — Warehouse/Inventory/MaterialIssueReceipt (ReturnUnusedForm: return#UnusedMaterial, a receipt at original cost, never a cancel) |
| AssetServices | update#AssetIssuedDate |  |  |
| AssetServices | receive#Asset | Warehouse/Handheld/Receive; Warehouse/Inventory/MaterialIssueReceipt; Warehouse/Receiving/Receive; Shared/MaterialIssueReceipt; Manufacturing/WorkOrders/WorkOrderDetail/MaterialIssueReceipt | Warehouse/Receiving/Receive (AdHocReceipt), through the guard: WarehouseTaskServices.receive#AdHocStock; Warehouse/Transfers/TransferShipmentDetail (through receive#TransferStock, with the issuance's cost and owner, P15); Warehouse/Inventory/MaterialIssueReceipt (Output Receive and Unused returns, through receive#ProductionOutput and return#UnusedMaterial, P16); Manufacturing/WorkOrders/WorkOrderDetail/MaterialIssueReceipt (Output Receive) and Manufacturing/ShopFloor/OperationExecution (Complete), through mantle.work.ProductionServices.receive#ProductionOutput (Manufacturing P5b, P10); Maintenance/WorkOrders/MaterialIssueReceipt (Return unused, through return#MaintenanceMaterial, Maintenance P9) |
| AssetServices | update#AssetAndReceipt |  |  |
| AssetServices | replace#AssetPartyAssignment | Maintenance/Equipment/EquipmentDetail; People/Employees/EquipmentDetail | People/Employees/EquipmentDetail (End assignment, through PeopleServices.return#Equipment after People's scope check; the end completes the return task, PeopleChecklist.eecas.xml) (People P7); Maintenance/Equipment/EquipmentDetail/Assignments (Change custodian, through MaintenanceResourceServices.change#MaintenanceCustody, dated now or earlier) |
| AssetServices | move#Product | Warehouse/Handheld/Move; Warehouse/Transfers/Move | — (Move chooses an asset in MoveContents and moves it with move#Stock; impl-warehouse §4 P5) |
| AssetServices | moveVerify#Product |  |  |
| AssetServices | check#ScanLocation | Warehouse/Handheld/Move; Warehouse/Handheld/Putaway; Warehouse/Picking/PickLocationMoves; Warehouse/Receiving/Putaway; Warehouse/Transfers/Move | Warehouse/Transfers/Move, Warehouse/Handheld/Move, Warehouse/Receiving/Putaway and Warehouse/Handheld/Putaway (inside move#Asset; the scan resolves through AccessServices.resolve#Scan) |
| AssetServices | move#Asset | Warehouse/Handheld/Move; Warehouse/Handheld/Putaway; Warehouse/Inventory/ContainerDetail; Warehouse/Receiving/Putaway; Warehouse/Transfers/Move | Warehouse/Transfers/Move, Warehouse/Handheld/Move, Warehouse/Inventory/Assets and Availability (Relocate), Warehouse/Inventory/ContainerDetail, Warehouse/Receiving/Putaway and Warehouse/Handheld/Putaway (P9), through the guard: WarehouseTaskServices.move#Stock, relocate#Assets, attach#AssetToContainer, detach#AssetFromContainer, move#Container, putaway#Stock; Warehouse/Transfers/SubcontractShipmentDetail (through dispatch#SubcontractStock, P15) |
| AssetServices | record#PhysicalInventoryQuantity | Warehouse/Inventory/Adjustments | Warehouse/Inventory/Adjustments (through WarehouseTaskServices.adjust#Stock) |
| AssetServices | record#PhysicalInventoryChange | Warehouse/Inventory/Adjustments | Warehouse/Inventory/Adjustments (through adjust#Stock and scrap#Asset) |
| AssetServices | create#ProductAssetAdHoc |  |  |
| AssetServices | update#PhysicalInventoryDate | Warehouse/Counts/CountDetail | — Not used: post#Count sets the count's date before its lines post (P10) |
| EquipmentServices | create#Equipment | Maintenance/Equipment; Maintenance/Equipment/EquipmentImport | Maintenance/Equipment/Find (New equipment, through MaintenanceResourceServices.store#MaintenanceEquipment); Maintenance/Equipment/EquipmentImport (each row, through MaintenanceImportServices.apply#EquipmentImportRow and store#MaintenanceEquipment; P18) |
| EquipmentServices | get#AssetMaintenanceNeeded |  | — Not used: the baseline's helper (highest meter value, latest maintenance whatever its status) is left as it is; Maintenance's due projection is MaintenancePlanServices.get#MaintenanceDue (impl-maintenance P13, F11) |
| EquipmentServices | create#AssetMaintenance | Manufacturing/WorkCenters/Downtime | Manufacturing/WorkCenters/Downtime and EquipmentDetail (Request maintenance: through mantle.work.ProductionServices.request#ProductionMaintenance, AsMntCreated and MntTpCorrective, Manufacturing P11) |
| EquipmentServices | create#AssetMaintenanceContent | Shared/RecordFiles; Maintenance/RecordFiles; Maintenance/Equipment/EquipmentDetail; Maintenance/WorkOrders/WorkOrderDetail | Shared/RecordFiles; under Maintenance: — (a work order's files are its WorkEffort's, WorkOrderDetail/Files, P3; Maintenance/Equipment/EquipmentDetail/Files lists the AssetMaintenanceContent kept before, read only, P2; Maintenance's record panels serve no AssetMaintenance host) |
| EquipmentServices | update#AssetMaintenanceContent | Maintenance/RecordFiles; Maintenance/Equipment/EquipmentDetail; Maintenance/WorkOrders/WorkOrderDetail | — (as create#AssetMaintenanceContent: under Maintenance a work order's files are its WorkEffort's; EquipmentDetail/Files lists the earlier ones read only, P2) |
| EquipmentServices | save#AssetMaintenanceContentFile | Shared/RecordFiles |  |
| InventoryReportServices | get#InventoryProjectedInfo | Products/Products/Product360/Stock; Warehouse/Inventory/Availability; Purchasing/Replenishment/SupplyPlanning; CustomerService/Availability/InventoryAvailability; Shared/InventoryAvailability; Shared/SupplyPlanning; Insights/Dashboard; Insights/Panels/PanelDetail; Insights/ReportBuilder/Analysis; Insights/ManagementDigest | Shared/InventoryAvailability/Projection; Warehouse/Inventory/Availability/Projection (Shared/SupplyPlanning nets the same sources from the entities, impl-manufacturing P13); Purchasing/Replenishment/InventoryAvailability (Shared/InventoryAvailability/Projection) (Purchasing P14); CustomerService/Availability/InventoryAvailability/Projection (unknown, never zero, when not ready; Customer Service P3) |
| InventoryReportServices | get#PriceHistoryInfo | Products/Pricing/PriceHistory | Products/Prices/PriceHistory |
| PriceServices | modify#ProductPrice | |  |
| PriceServices | get#ProductPriceByType |  |  |
| PriceServices | get#ProductPrice | Products/Pricing/PriceLists/PriceListDetail; Products/Pricing/PriceExplain; Purchasing/Suppliers/PriceExplain; Purchasing/Suppliers/SupplierPrices; PASS:Shop/Products/ProductDetail; PASS:Shop/Cart; PASS:Shop/Checkout; Commerce/Merchandising/PriceExplain; Commerce/Merchandising/PriceLists/PriceListDetail; Sales/Orders/OrderDetail; Sales/Agreements/CustomerPrices; Sales/Agreements/AgreementDetail; Sales/Agreements/PriceListDetail; Sales/Agreements/PriceExplain; Sales/Quotes/QuoteTemplateDetail | Shared/PriceExplain; Purchasing/Suppliers/PriceExplain (Shared/PriceExplain) (Purchasing P2); Commerce/Merchandising/PriceExplain; Commerce/Merchandising/PriceLists/PriceListDetail (P3); PASS:Shop/Home; PASS:Shop/Categories/CategoryDetail; PASS:Shop/Search; PASS:Shop/Products/ProductDetail (its resolver as the store's authority, through mantle.product.PriceServices.get#StoreProductPrice and ShopCatalogServices; Shop P3) |
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
| PromotionServices | apply#OrderPromotions | Shared/OrderDetail; PASS:Shop/Cart; PASS:Shop/Checkout | PASS:Shop/Cart (through mantle.order.ShopCartServices; Shop P4) and PASS:Shop/Checkout (through mantle.order.ShopCheckoutServices; Shop P5) (StorePromotions.js, under the store's locked limits; Commerce P7); — Commerce/Orders/OrderDetail read only (StoreOperationsServices.get#StoreOrder; its order work is Customer Service's and Accounting's; Commerce P8) |
| PromotionServices | add#OrderPromoCode | PASS:Shop/Cart; PASS:Shop/Checkout | PASS:Shop/Cart (through mantle.order.ShopCartServices; Shop P4) (apply#PromoCode, StorePromotions.js; Commerce P7) |
| PromotionServices | remove#OrderPromoCode | PASS:Shop/Cart; PASS:Shop/Checkout | PASS:Shop/Cart (through mantle.order.ShopCartServices; Shop P4) (remove#PromoCode) |
| PromotionServices | apply#NewCustomerDiscount |  |  |
| PromotionServices | apply#BuyGetDiscount |  |  |
| PromotionServices | apply#FlatDiscount |  |  |
| StoreServices | create#StoreShippingOption | Commerce/Settings/CheckoutSettings | Commerce/Settings/CheckoutSettings#AddShipOptionForm (through mantle.product.StoreAdminServices.store#ShippingOption) |
| StoreServices | get#StoreShippingOptions | PASS:Shop/Checkout | PASS:Shop/Checkout (through mantle.order.ShopCheckoutServices; Shop P5) (get#DeliveryOptions); Commerce/Settings/CheckoutSettings' shipping simulation (StoreCheckout.js simulate#StoreShipping; Commerce P6) |
| StoreServices | clone#ProductStore | Commerce/Stores/StoreDetail | Commerce/Stores/StoreDetail#CloneStoreForm (through mantle.product.StoreAdminServices.clone#Store) |
| StoreServices | format#UrlSlug | PRD-TAXONOMY; Commerce/Merchandising/CategoryDetail | Products/Categories/CategoryDetail/Identifiers (guarded preview before store); Commerce/Merchandising/CategoryDetail (P3) |
| StoreServices | generate#UrlSlugFromProductName | Products/Products/Product360; Shared/Product360; Commerce/Merchandising/Product360 | — Shop: a product's address slug is made from its name by Shop's catalog (ShopCatalog.js slug; Shop P3); Commerce/Merchandising/Product360 edits no slug |
| StoreServices | generate#UrlSlugFromCategoryName | Products/Categories/CategoryDetail; Commerce/Merchandising/CategoryDetail | — Shop: a category's address slug is made from its name by Shop's catalog (ShopCatalog.js slug; Shop P3); Commerce/Merchandising/CategoryDetail edits no slug |
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

### Added in the Maintenance build: parts and stock (P9)

| Service | Verbs | Implemented in |
| --- | --- | --- |
| mantle.work.MaintenanceExecutionServices | get#MaintenanceMaterials, store#MaintenanceMaterial | Maintenance/WorkOrders/WorkOrderDetail/Parts (Planned parts, Add part, Add suggested parts, Edit, Remove, Parts used); Maintenance/WorkOrders/MaterialIssueReceipt (through ironstone.maintenance.MaterialServices.get#MaterialSource) |
| mantle.work.MaintenanceExecutionServices | issue#MaintenanceMaterial, return#MaintenanceMaterial | Maintenance/WorkOrders/MaterialIssueReceipt (Issue, Return unused; ironstone.maintenance.MaterialServices.get#MaterialAction after check#Record) |
| mantle.work.MaintenanceServices | store#MaintenanceWorkOrder (cost centre, project) | Maintenance/WorkOrders/WorkOrderDetail/Overview (Edit) |
| mantle.ledger.SetupServices | store#PostingDefault, get#PostingDefaults (mapping kind maintenance: MaintenanceCostPolicy) | Accounting/Settings/PostingDefaults (Maintenance expense) |
| ironstone.maintenance.MaterialServices | get#MaterialSource, get#MaterialAction | Maintenance/WorkOrders/MaterialIssueReceipt |

### Added in the Maintenance build: Assist, Comms, sync and outputs (P19)

| Service | Verbs | Implemented in |
| --- | --- | --- |
| mantle.work.MaintenanceServices | get#MaintenanceProblemSource; report#MaintenanceProblem (the message it is reported from) | Commons/ReportProblem (prefilled from a chat message, a voicemail or a mail; mounted as Comms/Chat/ReportProblem, Comms/Calls/Voicemail/ReportProblem and Comms/Inbox/MessageDetail/ReportProblem) |
| mantle.work.MaintenanceServices | get#MaintenanceWorkProjection, get#MaintenanceDueProjection | CalDAV (projected-MaintenanceMyWork, projected-MaintenanceTeamDue; CalendarDavServices' projected kind) |
| mantle.work.MaintenanceServices | get#MaintenanceCalendarFile | Maintenance/WorkOrders/WorkOrderDetail (Add to calendar (.ics)); Maintenance/Preventive/Plans/PlanDetail (Add next due to calendar (.ics)) |
| mantle.work.MaintenanceServices | add#MaintenanceVideoCall | Maintenance/WorkOrders/WorkOrderDetail (Add video call) |
| ironstone.maintenance.StackServices | lookup#Records, get#CallContext | the Maintenance root's record-lookup and call-context providers (Comms' record cards, the ring bar and the call) |

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
| RequestServices | create#Request | Commons/QuickCreate; Commons/Requests; Comms/Inbox; Comms/Chat; Projects/Requests; Warehouse/Transfers/StockRequests; Purchasing/Requests; Purchasing/Requests/RequestDetail; CustomerService/Cases/NewCase; Manufacturing/WorkCenters/Downtime; Maintenance/Requests; Maintenance/WorkOrders/WorkOrderDetail; Sales/Quotes/QuoteRequests | Commons/ReportProblem (through MaintenanceServices.report#MaintenanceProblem, RqtMaintenance, impl-maintenance P4); Commons/QuickCreate; Commons/Requests/List; Commons/Tasks/TaskDetail; Projects/Requests/List; Projects/WorkItems/WorkItemDetail; Warehouse/Transfers/StockRequests and NewStockRequest (RqtInventory, validated: the facility in scope; P15); Manufacturing/WorkCenters/Downtime (the maintenance request of request#ProductionMaintenance, RqtMaintenance, linked to the stop, the equipment, the maintenance and the stopped work; Manufacturing P11); — Purchasing: create#PurchaseRequest and create#QuoteRequest (Purchasing P10, P11); CustomerService/Cases/NewCase (SupportCaseServices.create#Case; Customer Service P2) |
| RequestServices | update#Request | Commons/Requests/RequestDetail; Projects/Requests; Projects/Requests/RequestDetail; Purchasing/Requests/RequestDetail; CustomerService/Cases/CaseDetail; Shared/RequestDetail; Sales/Quotes/QuoteRequestDetail | Commons/Requests/RequestDetail; Projects/Requests/List; Projects/Requests/RequestDetail; Warehouse/Transfers/RequestDetail (Submit, Complete, Cancel; approve#InventoryRequest, P15); — Purchasing: the purchase request's own verbs (submit, cancel and complete#PurchaseRequest) (Purchasing P10, P17); CustomerService/Cases/CaseDetail (through mantle.request.SupportCaseServices.update#Case and transition#Case, Customer Service P2) |
| RequestServices | create#ContactRequest | Projects/Requests/Intake |  |
| RequestServices | create#ContactRequestReCaptcha | Projects/Requests/Intake |  |
| RequestServices | replace#RequestParty | Commons/Requests/RequestDetail; Projects/Requests; Projects/Requests/RequestDetail; Purchasing/Requests/RequestDetail; CustomerService/Cases/CaseDetail; CustomerService/Cases/NewCase; Shared/RequestDetail | Commons/Requests/RequestDetail; Projects/Requests/List; Projects/Requests/RequestDetail; — Purchasing: the organization and requester are parties by role, set when filed (Purchasing P10); CustomerService/Cases/CaseDetail (Assign: SupportCaseServices.update#Case; Customer Service P2) |
| RequestServices | add#RequestComment | Commons/Requests/RequestDetail; Projects/Requests/RequestDetail; CustomerService/Cases/CaseDetail | Commons/Requests/RequestDetail; Projects/Requests/List; Projects/Requests/RequestDetail; CustomerService/Cases/CaseDetail (Chatter, and a move's reason through transition#Case; Customer Service P2) |
| RequestServices | update#RequestComment | Commons/Requests/RequestDetail; Projects/Requests/RequestDetail; CustomerService/Cases/CaseDetail | Shared/Chatter; CustomerService/Cases/CaseDetail (Chatter; Customer Service P2) |
| RequestServices | delete#RequestComment | Commons/Requests/RequestDetail; Projects/Requests/RequestDetail; CustomerService/Cases/CaseDetail | Shared/Chatter; CustomerService/Cases/CaseDetail (Chatter; Customer Service P2) |
| RequestServices | get#RequestContentLocation |  |  |
| RequestServices | create#RequestContent | Commons/Requests/RequestDetail; Projects/Requests/RequestDetail; Shared/RecordFiles; CustomerService/Cases/CaseDetail; Sales/Quotes/QuoteRequestDetail | Shared/RecordFiles; CustomerService/Cases/CaseDetail (Files; Customer Service P2) |
| RequestServices | update#RequestContent | Projects/Requests/RequestDetail; CustomerService/Cases/CaseDetail; Sales/Quotes/QuoteRequestDetail | CustomerService/Cases/CaseDetail (Files; Customer Service P2) |
| RequestServices | save#RequestContentFile | Commons/Requests/RequestDetail; Shared/RecordFiles |  |

Added in the drawers-commons build (Oct 18–19, 2026), called by built screens:

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| RequestServices | get#UserTodayRequests |  | Commons |
| RequestServices | link#RequestRecord | Projects/Requests/RequestDetail; Purchasing/Requests/RequestDetail; CustomerService/Cases/CaseDetail; CustomerService/Cases/NewCase; CustomerService/Returns/WarrantyAssessment; Shared/RequestDetail; Manufacturing/WorkCenters/Downtime; Maintenance/Requests/RequestDetail; Maintenance/WorkOrders/WorkOrderDetail; Sales/Quotes/QuoteRequestDetail | Maintenance/Requests/RequestDetail (a maintenance request's one target: a second Asset or Facility is ONE_TARGET; report#MaintenanceProblem and triage record the target, impl-maintenance P4); Commons/QuickCreate; Commons/Requests/RequestDetail; Projects/Requests/RequestDetail; Manufacturing/WorkCenters/Downtime (the maintenance request of request#ProductionMaintenance, RqtMaintenance, linked to the stop, the equipment, the maintenance and the stopped work; Manufacturing P11); — Purchasing: a purchase request links its orders (RequestItemOrder), not records (Purchasing P10); CustomerService/Cases/NewCase (SupportCaseServices.create#Case; Customer Service P2); CustomerService/Cases/CaseDetail (Knowledge tab: an article by WikiPageRequest, Customer Service P12); CustomerService/Knowledge/Knowledge (Link to case); CustomerService/Orders/OrderDetail (Link to case; NewCase with the order through create#Case; Customer Service P3); CustomerService/Returns/WarrantyAssessment (Customer Service P9, through mantle.order.ReturnPolicyServices and its Customer Service branch) |
| RequestServices | unlink#RequestRecord | Projects/Requests/RequestDetail; Purchasing/Requests/RequestDetail; CustomerService/Cases/CaseDetail; Shared/RequestDetail | Commons/Requests/RequestDetail; Projects/Requests/RequestDetail; — Purchasing: a purchase request links its orders (RequestItemOrder), not records (Purchasing P10); CustomerService/Cases/CaseDetail (Knowledge tab: Unlink an article, Customer Service P12) |

Added in the Projects build (Oct 21–22, 2026; impl-projects.md P1–P10), called by built screens:

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| RequestServices | convert#RequestToProject |  | Projects/Requests/RequestDetail |
| RequestServices | create#IntakeRequest | PASS:Support/NewCustomerCase | RequestIntake; PASS:Support/NewCustomerCase (a queue's form token, through create#CustomerCase, Customer Service P15) |
| RequestServices | create#IntakeToken | CustomerService/Settings/ChannelRouting | Projects/Projects/ProjectDetail/Settings; Projects/Requests/List; CustomerService/Settings/ChannelRouting |
| RequestServices | get#IntakeSettings | CustomerService/Settings/ChannelRouting | Projects/Projects/ProjectDetail/Settings; Projects/Requests/List; Projects/Settings/Intake; CustomerService/Settings/ChannelRouting (the queue's intake token, Customer Service P6) |
| RequestServices | make#RequestWorkItem |  | Projects/Requests/List; Projects/Requests/RequestDetail |
| RequestServices | remove#IntakeToken | CustomerService/Settings/ChannelRouting | Projects/Projects/ProjectDetail/Settings; Projects/Requests/List; CustomerService/Settings/ChannelRouting |

## Sales (8 services)

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| AccountServices | create#Account | Sales/Accounts/Accounts; Sales/Pipeline/Leads |  |
| AccountServices | create#Contact | Sales/Accounts/Contacts; Sales/Accounts/Customer360; Sales/Accounts/ContactDetail |  |
| AccountServices | add#Contact | Sales/Accounts/Contacts; Sales/Accounts/Customer360; Sales/Accounts/ContactDetail |  |
| AccountServices | delete#Contact | Sales/Accounts/Contacts; Sales/Accounts/Customer360; Sales/Accounts/ContactDetail |  |
| SalesReportServices | get#SalesOrderSummary | Accounting/Reports/SalesAnalysis; Sales/Reports/SalesSummary; Insights/Dashboard; Insights/Panels/PanelDetail; Insights/ReportBuilder/Analysis; Insights/ManagementDigest; Commerce/Home; Commerce/Reports/OnlineSales | — (replaced by mantle.sales.SalesReportServices.run#SalesAnalysis on Accounting/Reports/SalesAnalysis); Commerce/Home (PeriodStrip) and Commerce/Reports/OnlineSales through ironstone.commerce.ReportingServices (P11: productStoreIds of the user's store scope, by currency) |
| SalesReportServices | get#SalesInvoiceSummary | Sales/Reports/SalesSummary; Insights/Dashboard; Insights/Panels/PanelDetail; Insights/ReportBuilder/Analysis; Insights/ManagementDigest; Commerce/Home; Commerce/Reports/OnlineSales | Commerce/Home (PeriodStrip's net sales) and Commerce/Reports/OnlineSales (net invoiced) through ironstone.commerce.ReportingServices (P11) |
| SalesReportServices | get#SalesTopProduct | Sales/Reports/SalesSummary; Insights/Dashboard; Insights/Panels/PanelDetail; Insights/ReportBuilder/Analysis; Insights/ManagementDigest; Commerce/Home; Commerce/Reports/OnlineSales | organization filter (vendorPartyIds); Accounting/Reports/SalesAnalysis reads the records (run#SalesAnalysis); Commerce/Home and Commerce/Reports/OnlineSales (P11: productStoreIds and currencyUomIds) |
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
| CarrierServices | validate#PostalAddress | Warehouse/Locations/Carriers; Warehouse/Shipping/Ship; PASS:Shop/Checkout; PASS:Shop/Account/Addresses | Warehouse/Shipping/Ship (ShipmentAddress, Check address) (P13); PASS:Shop/Checkout (set#CheckoutAddresses) and PASS:Shop/Account/Addresses (store#Address) (Shop P5, P6) |
| CarrierServices | validate#PostalAddressBulk |  |  |
| CarrierServices | calculate#OrderShipping |  |  |
| CarrierServices | calculate#OrderPartShipping |  |  |
| CarrierServices | get#OrderShippingRatesBulk | PASS:Shop/Checkout | PASS:Shop/Checkout (through mantle.order.ShopCheckoutServices; Shop P5) (get#DeliveryOptions) |
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
| ShipmentServices | create#OrderPartShipment | Warehouse/Orders/OrderDetail; Warehouse/Receiving/Receipts; Warehouse/Shipping/Shipments; Purchasing/Receiving/Receipts; Shared/OrderDetail; Sales/Orders/OrderDetail | Warehouse/Receiving/Receipts and NewReceipt (NewReceipt), through WarehouseTaskServices.ensure#PurchaseReceipt; — Purchasing: ensure#PurchaseReceipt (Receipts' PrepareReceipt) (Purchasing P5) |
| ShipmentServices | add#OrderPartToShipment | Warehouse/Orders/OrderDetail; Shared/OrderDetail; Sales/Orders/OrderDetail | — Warehouse/Orders/OrderDetail (Create shipment: a new shipment per part, create#OutgoingShipment over create#OrderPartShipment); CustomerService/Orders/OrderChangeDetail (ApplyChange: the substitute on its short pick's shipment; Customer Service P10) |
| ShipmentServices | pickMove#ProductToContainer | Warehouse/Inventory/ContainerDetail | — Warehouse/Picking/Pick (PickScan into a pick container: pick#ShipmentStock over pickMove#ShipmentProduct); ContainerDetail attaches only |
| ShipmentServices | pickMove#ShipmentProduct | Warehouse/Handheld/Pick; Warehouse/Picking/Pick; Shared/ShipmentDetail | Warehouse/Picking/Pick and Handheld/Pick (PickScan) through WarehouseTaskServices.pick#ShipmentStock, for one line (its new shipmentItemSourceId and pickedMoveList) |
| ShipmentServices | get#ShipmentProductByScan | Warehouse/Handheld/Pick; Warehouse/Picking/Pick; Shared/ShipmentDetail | Warehouse/Picking/Pick (inside pickMove#ShipmentProduct; the handheld product scan must be the line's product) |
| ShipmentServices | pack#ShipmentProductScan | Warehouse/Handheld/Pack; Warehouse/Shipping/Pack; Shared/ShipmentDetail | Warehouse/Shipping/Pack and Warehouse/Handheld/Pack (PackScan) through WarehouseTaskServices.pack#ShipmentStock |
| ShipmentServices | pack#ShipmentProduct | Warehouse/Handheld/Pack; Warehouse/Shipping/Pack | Warehouse/Shipping/Pack (PackScan by product) through pack#ShipmentStock |
| ShipmentServices | pack#ShipmentItemSource | Warehouse/Handheld/Pack; Warehouse/Shipping/Pack; Shared/ShipmentDetail | Warehouse/Shipping/Pack (PackLines: Pack) through pack#ShipmentStock |
| ShipmentServices | pack#ShipmentAssemblyComponent | Warehouse/Handheld/Pack; Warehouse/Shipping/Pack; Shared/ShipmentDetail; Shared/MaterialIssueReceipt | Warehouse/Shipping/Pack (PackAssembly); Warehouse/Inventory/MaterialIssueReceipt (Pack component) through WarehouseTaskServices.pack#ShipmentAssembly |
| ShipmentServices | unpack#ShipmentItemIssuance | Warehouse/Handheld/Pack; Warehouse/Shipping/Pack; Shared/ShipmentDetail | Warehouse/Shipping/Pack (Reopen) through WarehouseTaskServices.reopen#ShipmentPackage, with its new quantity |
| ShipmentServices | create#ShipmentAutoPackages | Warehouse/Handheld/Pack; Warehouse/Shipping/Pack | — §7: automatic package suggestions (F299); Warehouse/Shipping/Pack's AddPackage and Move instead |
| ShipmentServices | receive#EntireShipment | Warehouse/Handheld/Receive; Warehouse/Receiving/ReceiptDetail; Warehouse/Receiving/Receive; Warehouse/Returns/ReturnReceipt; Warehouse/Transfers/TransferShipmentDetail; Purchasing/Receiving/ShipmentDetail; Shared/ShipmentDetail | — (not called: "Receive all as expected" is WarehouseTaskServices.receive#ExpectedShipment through the receive guard, F37, impl-warehouse §4); never for a transfer: F37, receive#TransferStock sums issuances and receipts apart (P15); — Purchasing: receive#ExpectedShipment (ShipmentDetail's Receive all) (Purchasing P5) |
| ShipmentServices | receive#ShipmentProduct | Warehouse/Handheld/Receive; Warehouse/Receiving/ReceiptDetail; Warehouse/Receiving/Receive; Warehouse/Returns/ReturnReceipt; Warehouse/Transfers/TransferShipmentDetail; Purchasing/Receiving/ShipmentDetail; Shared/ShipmentDetail | Warehouse/Receiving/Receive and Warehouse/Handheld/Receive (ReceiveLine, GenerateTracking), Warehouse/Receiving/ReceiptDetail (Receive all as expected), through the guard: WarehouseTaskServices.receive#ShipmentStock; Purchasing/Receiving/ShipmentDetail (Receive), through WarehouseTaskServices.receive#ShipmentStock (Purchasing P5) |
| ShipmentServices | convert#ProductBoxQuantity |  |  |
| ShipmentServices | get#ShipmentPackageWeight | Warehouse/Handheld/Pack; Warehouse/Shipping/Pack | Warehouse/Shipping/Pack (Weigh) through edit#ShipmentPackage |
| ShipmentServices | print#ShipmentLabels | Warehouse/Locations/Printers; Warehouse/Shipping/Ship; Shared/ShipmentDetail | — Warehouse/Shipping/Ship (Print labels, Reprint) and Warehouse/Locations/Printers (TestPrinter): PrintServices.dispatch#Document |
| ShipmentServices | complete#ShipmentPack | Warehouse/Handheld/Pack; Warehouse/Shipping/Pack | Warehouse/Shipping/Pack (CompletePack) through WarehouseTaskServices.complete#Pack, getLabels and getReturnLabels false |
| ShipmentServices | pack#Shipment |  | Warehouse/Returns/SupplierReturnShipment (Ship), through WarehouseTaskServices.ship#SupplierReturn |
| ShipmentServices | ship#Shipment | Warehouse/Shipping/Ship | Warehouse/Transfers/TransferShipmentDetail (through ship#Transfer, P15); Warehouse/Returns/SupplierReturnShipment (Ship), through WarehouseTaskServices.ship#SupplierReturn; Warehouse/Shipping/Ship (ShipConfirm), through WarehouseTaskServices.ship#OutgoingShipment (P13) |
| ShipmentServices | deliver#Shipment | Warehouse/Shipping/PackageTracking | Warehouse/Receiving/ReceiptDetail (Finish receipt, Receive all as expected), through WarehouseTaskServices.close#ReceiptRemainder and receive#ExpectedShipment; Warehouse/Transfers/TransferShipmentDetail (through receive#TransferStock when nothing is left in transit, P15); Warehouse/Shipping/PackageTracking (RecordDelivery), through record#PackageDelivery and the ShipmentPackageDeliveredCheckShipment SECA (P13); Purchasing/Receiving/ShipmentDetail (Finish receipt, Receive all as expected), through close#ReceiptRemainder and receive#ExpectedShipment (Purchasing P5) |
| ShipmentServices | checkSet#ShipmentDeliveredByPackages |  | Warehouse/Shipping/PackageTracking (RecordDelivery), by its SECA (P13) |
| ShipmentServices | cancel#Shipment | Warehouse/Receiving/ReceiptDetail; Warehouse/Returns/ReturnReceipt; Warehouse/Returns/SupplierReturnShipment; Warehouse/Shipping/ShipmentDetail; Warehouse/Transfers/TransferShipmentDetail | Warehouse/Receiving/ReceiptDetail (FinishReceipt: a receipt backordered with nothing received is cancelled, close#ReceiptRemainder) |
| ShipmentServices | reduce#QuantitiesToHandled |  |  |
| ShipmentServices | send#ShipmentStoreEmail | Warehouse/Receiving/ReceiptDetail; Warehouse/Returns/ReturnReceipt; Warehouse/Returns/SupplierReturnShipment; Warehouse/Shipping/ShipmentDetail; Warehouse/Transfers/TransferShipmentDetail; Shared/ShipmentDetail | — not built: the Warehouse mounts send no shipment email (P7: the receipt documents print instead) |
| ShipmentServices | create#ShipmentContent | Shared/RecordFiles; Warehouse/Receiving/ReceiptDetail; Warehouse/Returns/ReturnReceipt; Warehouse/Returns/SupplierReturnShipment; Warehouse/Shipping/ShipmentDetail; Warehouse/Transfers/TransferShipmentDetail; Shared/ShipmentDetail | Shared/RecordFiles; Warehouse/Receiving/ReceiptDetail, Shipping/ShipmentDetail, Returns/ReturnReceipt, SupplierReturnShipment, Transfers/TransferShipmentDetail (Files) |
| ShipmentServices | update#ShipmentContent | Warehouse/Receiving/ReceiptDetail; Warehouse/Returns/ReturnReceipt; Warehouse/Returns/SupplierReturnShipment; Warehouse/Shipping/ShipmentDetail; Warehouse/Transfers/TransferShipmentDetail; Shared/ShipmentDetail | — Files on the Warehouse shipment mounts (Shared/RecordFiles: a new version updates the entity, entity-auto) |
| ShipmentServices | save#ShipmentContentFile | Shared/RecordFiles |  |

## Work (105 services, 32 added)

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| EventServices | get#FullCalendarData | Commons/Home; Commons/Calendar; Commons/Calendar/Schedules; Commons/Calendar/Schedules/ResourceDetail; Comms/Home; Comms/Calls; Projects/Projects/ProjectDetail/Plan/Calendar; Maintenance/Scheduling/ResourceCalendar; Marketing/Calendar | Commons/Calendar; Commons/Calendar/Schedules; Commons/Calendar/Schedules/ResourceDetail; Commons/Contacts/ContactDetail; Commons/Contacts/List; Commons/Home; Comms/Home; Projects/Projects/ProjectDetail/Plan/Calendar; Maintenance/Scheduling/ResourceCalendar (bookings and unavailableList, through ScheduleServices.get#ResourceBookings with includeUnavailable, impl-maintenance P16) |
| EventServices | create#Event | Commons/QuickCreate; Commons/Calendar; Commons/Calendar/EventDetail; Commons/Calendar/Schedules; Commons/Calendar/Schedules/ResourceDetail; Comms/Inbox; Comms/Chat; Maintenance/Scheduling/ResourceCalendar; Marketing/Calendar; Marketing/Events; Marketing/Events/EventDetail; Marketing/QuickCreate | Commons/Calendar; Commons/Calendar/Schedules; Commons/Calendar/Schedules/ResourceDetail; Commons/QuickCreate; Shared/Chatter; Projects/Projects/ProjectDetail/Plan/Calendar; Maintenance/Scheduling/ResourceCalendar (Book, through ScheduleServices.book#ResourceSlot, impl-maintenance P16); People/Development/Training (a session, a WepTraining event, through DevelopmentServices.store#Training, People P19) |
| EventServices | get#NextBusinessDay | People/Time/LeaveRequests | Maintenance/Preventive/Plans/PlanDetail and Plans (a plan's planned day after a weekend or holiday, over the organization's WepHoliday events and the plan's People holiday calendar, through MaintenancePlanServices.get#MaintenanceDue; impl-maintenance P13) |
| EventServices | get#FutureBusinessDay | Projects/WorkItems/Timeline; People/Time/LeaveRequests | — (no screen calls it; Mantle's TaskServices does. People: a leave request is charged by the person's working schedule and holiday calendars, Leave.js, not the business-day services, People P12) |
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
| ManufacturingServices | get#ProductionRunDisplayInfo | Manufacturing/WorkOrders/WorkOrderDetail; Shared/MaterialIssueReceipt | — not used: Manufacturing/WorkOrders/WorkOrderDetail reads mantle.work.ProductionServices.get#ProductionOrder (Manufacturing P5a) |
| ManufacturingServices | create#ProductionRun |  | mantle.work.ProductionServices.create#ProductionOrder (without the legacy consume and produce products, P16a) |
| ManufacturingServices | create#ShipmentAssemblyWorkEffort |  |  |
| ManufacturingServices | set#ProducedProductQuantity |  | — never called (F8): a target change is mantle.work.ProductionServices.change#ProductionQuantity (P7) |
| ManufacturingServices | recreate#ConsumeProductsFromProduce |  |  |
| ManufacturingServices | produce#AvailableAssemblies | Warehouse/Handheld/Pack; Warehouse/Shipping/Pack; Shared/MaterialIssueReceipt | Warehouse/Shipping/Pack and Warehouse/Inventory/MaterialIssueReceipt (inside pack#ShipmentAssemblyComponent; the kit cost of kitCostFromComponents, F41) |
| ManufacturingServices | breakDown#Assembly |  | Manufacturing/WorkOrders/Disassembly (inside mantle.work.ProductionServices.reverse#SupportedAssembly, without its unissue, Manufacturing P9) |
| ManufacturingServices | unissue#AssemblyComponents |  |  |
| ManufacturingServices | unissue#Component |  | — not used by Disassembly: reverse#SupportedAssembly cancels the kit slices newest first itself (F30, Manufacturing P9) |
| ManufacturingServices | cancel#AssemblyWorkEffort |  |  |
| ManufacturingServices | get#ConsumedAssetRemaining | Manufacturing/WorkOrders/Disassembly | — Manufacturing/WorkOrders/Disassembly reads preview#SupportedAssemblyReversal (the kit slices, Manufacturing P9) |
| ManufacturingServices | get#ProducedProductComplete | Manufacturing/WorkOrders/WorkOrderDetail/Quantities; Manufacturing/WorkOrders/Disassembly | — not used by Quantities: it reads mantle.work.ProductionServices.get#ProductionQuantities (the run lines and receipts, P7) |
| ManufacturingServices | get#ProductionRunProduceConsumeDetail | Manufacturing/WorkOrders/WorkOrderDetail/Components; Manufacturing/WorkOrders/WorkOrderDetail/Quantities; Shared/MaterialIssueReceipt | — Manufacturing/WorkOrders/WorkOrderDetail/Components and MaterialIssueReceipt: get#ProductionMaterials over the run's own lines (P5b) |
| ManufacturingServices | get#ProductBomDetail | Manufacturing/BillsOfMaterials/BillOfMaterialsDetail/BillOfMaterialsExplosion | — not used by Manufacturing: BillOfMaterialsExplosion reads mantle.product.BomServices.get#BomExplosion (Products P8, P9); kits and the migration comparison keep it (R-MFG-35) |
| ManufacturingServices | get#ProductionRunPickInfo | Manufacturing/WorkOrders/WorkOrderDetail | — not used: Manufacturing/WorkOrders/WorkOrderDetail/PickSheet reads mantle.work.ProductionServices.get#ProductionPickList (the run lines, P5a) |
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
| TimeServices | store#TimeEntry | Projects/Home; Projects/QuickCreate; Projects/WorkItems/WorkItemDetail; Projects/Time/MyTime; Projects/Time/TimeEntries; People/Time/MyTime; People/Time/TimeEntries; Maintenance/WorkOrders/WorkOrderDetail | Commons/Tasks/TaskDetail; Projects/QuickCreate; Projects/Time/MyTime; Projects/Time/TimeEntries; Projects/Time/TimeEntries/EditEntry; People/Time/MyTime; People/Time/TimeEntries (People P10, Projects' screen mounted under People); Maintenance/WorkOrders/WorkOrderDetail/Time (through MaintenanceServices.record#MaintenanceTime, which checks the work first, impl-maintenance F66, P3; a new entry on managed work only through it, P7, F159) |
| TimeServices | create#TimeEntryClockIn | Commons/Tasks/TaskDetail; Projects/WorkItems/WorkItemDetail; Projects/Time/MyTime; Projects/Time/TimeEntries | Commons/Tasks/TaskDetail |
| TimeServices | delete#TimeEntry | Projects/WorkItems/WorkItemDetail; Projects/Time/MyTime; Projects/Time/TimeEntries; People/Time/MyTime; People/Time/TimeEntries | Commons/Tasks/TaskDetail; Projects/Time/MyTime; Projects/Time/TimeEntries; Projects/Time/TimeEntries/EditEntry; Projects/WorkItems/WorkItemDetail; People/Time/MyTime; People/Time/TimeEntries (People P10, Projects' screen mounted under People) |
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
| WorkEffortServices | update#WorkEffort | (Mantle's REST PATCH /workEfforts/{workEffortId}, before an entity update) | none: no screen; a goal (People's WetGoal) refused, as the generic work services refuse it through check#WorkEffortOpen (People follow-up 2) |
| WorkEffortServices | add#WorkEffortParty | Commons/QuickCreate; Commons/Calendar; Commons/Calendar/EventDetail; Projects/Projects/NewProject; Projects/Projects/ProjectDetail/Team; Projects/WorkItems; Projects/WorkItems/WorkItemDetail; Manufacturing/WorkOrders/WorkOrderDetail/Overview; Maintenance/WorkOrders/WorkOrderDetail; Marketing/Events/EventDetail | Manufacturing/WorkOrders/WorkOrderDetail/Overview (inside store#ProductionParty, P5a); Commons/Calendar; Commons/Calendar/EventDetail; Commons/QuickCreate; Commons/Tasks/TaskDetail; Projects/Projects/NewProject/Start; Projects/Projects/NewProject/Team; Projects/Projects/ProjectDetail; Projects/Projects/ProjectDetail/Plan/Calendar; Projects/Projects/ProjectDetail/Team; Projects/QuickCreate; Projects/QuickProject; Projects/Requests/RequestDetail; Projects/WorkItems/Backlog; Projects/WorkItems/List; Projects/WorkItems/WorkItemDetail; Maintenance/WorkOrders/WorkOrderDetail: — (a managed work order's assignments are written by mantle.work.MaintenanceServices.schedule#MaintenanceWorkOrder, Overview's Assign, P3; the generic writers refuse managed work, impl-maintenance §4; WorkOrders' AssignSchedule and BulkWork through schedule#MaintenanceWorkOrder and act#MaintenanceWorkOrders, P8) |
| WorkEffortServices | remove#WorkEffortParty | Commons/Calendar/EventDetail; Projects/Projects/ProjectDetail/Team; Projects/WorkItems; Manufacturing/WorkOrders/WorkOrderDetail/Overview; Maintenance/WorkOrders/WorkOrderDetail; Marketing/Events/EventDetail | Manufacturing/WorkOrders/WorkOrderDetail/Overview (inside store#ProductionParty, P5a); Projects/Projects/NewProject/Team; Projects/Projects/ProjectDetail/Team; Projects/WorkItems/List; Projects/WorkItems/SprintDetail; Projects/WorkItems/WorkItemDetail; Maintenance/WorkOrders/WorkOrderDetail: — (a managed work order's assignments are written by mantle.work.MaintenanceServices.schedule#MaintenanceWorkOrder, Overview's Assign, P3; the generic writers refuse managed work, impl-maintenance §4; WorkOrders' AssignSchedule and BulkWork through schedule#MaintenanceWorkOrder and act#MaintenanceWorkOrders, P8) |
| WorkEffortServices | replace#WorkEffortParty | Commons/Calendar/EventDetail; Commons/Tasks; Projects/WorkItems/WorkItemDetail; Maintenance/WorkOrders/WorkOrderDetail; Marketing/Events/EventDetail | Commons/Tasks/List; Commons/Tasks/TaskDetail; Shared/Chatter; Projects/Projects/List; Projects/WorkItems/List; Projects/WorkItems/SprintDetail; Projects/WorkItems/WorkItemDetail; Maintenance/WorkOrders/WorkOrderDetail: — (a managed work order's assignments are written by mantle.work.MaintenanceServices.schedule#MaintenanceWorkOrder, Overview's Assign, P3; the generic writers refuse managed work, impl-maintenance §4; WorkOrders' AssignSchedule and BulkWork through schedule#MaintenanceWorkOrder and act#MaintenanceWorkOrders, P8) |
| WorkEffortServices | add#WorkEffortProduct | Projects/Projects/ProjectDetail/Money |  |
| WorkEffortServices | get#WorkEffortStartEnd |  | Commons/Calendar; Commons/Calendar/EventDetail; Projects/Projects/ProjectDetail/Plan/Calendar |
| WorkEffortServices | get#WorkEffortContentLocation |  |  |
| WorkEffortServices | create#WorkEffortContent | Commons/Tasks/TaskDetail; Projects/Projects/ProjectDetail/Files; Projects/WorkItems/WorkItemDetail; Shared/RecordFiles; Maintenance/Procedures/ProcedureDetail; Maintenance/RecordFiles; Maintenance/WorkOrders/WorkOrderDetail | Shared/RecordFiles; Maintenance/RecordFiles and Maintenance/WorkOrders/WorkOrderDetail/Files (a work order's or step's files, under Maintenance's check#Record, P3); a step response's evidence through mantle.work.ProcessChecks, P7 |
| WorkEffortServices | update#WorkEffortContent | Projects/Projects/ProjectDetail/Files; Projects/WorkItems/WorkItemDetail; Maintenance/Procedures/ProcedureDetail; Maintenance/RecordFiles; Maintenance/WorkOrders/WorkOrderDetail |  (refuses a check's evidence and a stored checklist, EVIDENCE_PROTECTED; Maintenance P7; the entity's guard WorkEffortEvidenceProtected covers every other path, P7 review) |
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
| CalendarServices | find#OwnedCalendars | Admin/Users/UserDetail | Admin/Users/UserDetail (Lifecycle review, the commons.calendars participant) (Admin P6) |
| CalendarServices | transfer#CalendarOwner | Admin/Users/LifecycleDetail | Admin/Users/LifecycleDetail (TransferOwnership) (Admin P6) |
| EventServices | check#EventAccess | Marketing/Events/EventDetail | Commons/Calendar; Commons/Calendar/EventDetail; Projects/Projects/ProjectDetail/Plan/Calendar |
| EventServices | get#ManagedEvents |  | Commons/Calendar (the grid's canEdit: an event an application keeps is not dragged); through check#EventAccess, EventDetail, CalDAV and store#CalendarFeedEvents (Commons calendar editors, Nov 12, 2026) |
| EventServices | get#EventIcsMaps | Maintenance/WorkOrders/WorkOrderDetail; Maintenance/Preventive/DueMaintenance | Commons/Calendar/EventDetail; Maintenance/WorkOrders/WorkOrderDetail (Add to calendar (.ics), through MaintenanceServices.get#MaintenanceCalendarFile, impl-maintenance P19) |
| EventServices | store#EventRecurrence |  | Commons/Calendar; Commons/Calendar/EventDetail; Projects/Projects/ProjectDetail/Plan/Calendar |
| EventServices | update#EventOccurrence | Marketing/Calendar; Marketing/Events/EventDetail | Commons/Calendar; Commons/Calendar/EventDetail; Projects/Projects/ProjectDetail/Plan/Calendar |
| EventServices | cancel#EventOccurrence | Marketing/Events/EventDetail | Commons/Calendar; Commons/Calendar/EventDetail; Projects/Projects/ProjectDetail/Plan/Calendar |
| EventServices | respond#EventInvitation | Marketing/Events/EventDetail | Commons/Calendar; Commons/Calendar/EventDetail; Comms/Inbox/Mail; Projects/Projects/ProjectDetail/Plan/Calendar |
| EventServices | get#InvitationDigest |  | Commons/Calendar/EventDetail |
| EventServices | send#EventInvitations | Marketing/Events/EventDetail; People/Staffing/ApplicantDetail; People/Staffing/InterviewsCalendar; Maintenance/WorkOrders/WorkOrderDetail | Commons/Calendar; Commons/Calendar/EventDetail; Commons/QuickCreate; Projects/Projects/ProjectDetail/Plan/Calendar ; Maintenance/WorkOrders/WorkOrderDetail (Add video call, through MaintenanceServices.add#MaintenanceVideoCall, impl-maintenance P19) |
| EventServices | remove#EventAttendee |  | Commons/Calendar/EventDetail |
| EventServices | get#FreeBusy | Maintenance/Scheduling/ResourceCalendar | Commons/Calendar; Commons/Calendar/EventDetail; — Maintenance/Scheduling/ResourceCalendar reads get#FullCalendarData's unavailableList and get#ResourceAvailability instead (impl-maintenance P16) |
| EventServices | book#Resource | Maintenance/Scheduling/ResourceCalendar; Marketing/Events/EventDetail | Commons/Calendar; Commons/Calendar/EventDetail; Commons/Calendar/Schedules; Commons/Calendar/Schedules/ResourceDetail; Projects/Projects/ProjectDetail/Plan/Calendar; Maintenance/Scheduling/ResourceCalendar (Book, through ScheduleServices.book#ResourceSlot, impl-maintenance P16) |
| EventServices | cancel#ResourceBooking | Maintenance/Scheduling/ResourceCalendar | Commons/Calendar/EventDetail; Commons/Calendar/Schedules; Commons/Calendar/Schedules/ResourceDetail; Maintenance/Scheduling/ResourceCalendar (Cancel booking, through ScheduleServices.cancel#MyBooking, impl-maintenance P16) |
| EventServices | store#WorkEffortReminders | People/Time/LeaveRequestDetail; People/Development/TrainingDetail; People/Development/Qualifications | Commons/Calendar; Commons/Calendar/EventDetail; Projects/Projects/ProjectDetail/Plan/Calendar; — not People/Development/Qualifications: a qualification's expiry is reminded by its own topic, QualificationExpiring (DevelopmentServices.send#ExpiryReminders), a qualification being no work effort (People P18); not People/Development/TrainingDetail: a person enrolled gets a reminder a day before the session as their own WorkEffortReminder row, written by DevelopmentServices.enroll#Training and decide#Enrollment (store#WorkEffortReminders sets only the caller's own), and changes it on Commons' EventDetail (People P19) |
| WorkEffortServices | link#WorkEffortRecord | Projects/QuickCreate; Projects/WorkItems/WorkItemDetail; CustomerService/Returns/WarrantyAssessment; Maintenance/WorkOrders/WorkOrderDetail | Commons/Calendar; Commons/Calendar/EventDetail; Commons/Panel/Today; Commons/QuickCreate; Commons/Requests/RequestDetail; Commons/Tasks/List; Commons/Tasks/TaskDetail; Shared/Chatter; Projects/Projects/ProjectDetail/Plan/Calendar; Projects/QuickCreate; Projects/Requests/RequestDetail; Projects/WorkItems/Backlog; Projects/WorkItems/List; Projects/WorkItems/WorkItemDetail; CustomerService/Returns/WarrantyAssessment (Customer Service P9, through mantle.order.ReturnPolicyServices and its Customer Service branch); Maintenance/WorkOrders/WorkOrderDetail: — (a follow-up task is a WorkEffortAssoc, ironstone.maintenance WorkItems.js, P7; the request it came from is linked by triage, P4) |
| WorkEffortServices | unlink#WorkEffortRecord | Projects/WorkItems/WorkItemDetail | Commons/Calendar/EventDetail |
| WorkEffortServices | get#UserTodayItems |  | Commons/Home; Commons/Panel/Today; — a production run and its operations left out (Manufacturing P10, F41); Manufacturing's today-source ironstone.manufacturing.HomeServices.get#TodayItems lists the due operations |
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
| ProjectServices | get#ProjectMoneySummary |  | Projects/Projects/ProjectDetail/Money (P11 of impl-maintenance: its Maintenance box, the repairs charged to the project with their cost by currency, an owner contract) |
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
| ResourceServices | find#StaffingCandidates | People/Development/SkillsMatrix; Maintenance/WorkOrders | Projects/Billing/Rates; Projects/Projects/ProjectDetail/Team; Projects/Resources/Allocations/EditAllocation; Projects/Resources/Allocations/Staff; Projects/Resources/TeamPlanner; People/Development/SkillsMatrix and SkillsMatrixTui (Find available, through ironstone.people.ContextServices.find#AvailablePeople, bounded by partyIdList) (People P18); Maintenance/WorkOrders/WorkOrderDetail/Overview (Assign and schedule's technicians, through mantle.work.MaintenanceServices.find#MaintenanceCandidates: skillList with least levels and a window in hours, Maintenance P8) |
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
| TaskServices | set#TaskStatus |  | Projects/WorkItems/List; Projects/WorkItems/SprintDetail; Projects/WorkItems/WorkItemDetail; People/Tasks/WorkItemDetail (a checklist task, on the Commons rule; refuses managed work, MANAGED_WORK) (People P7) |
| TimeServices | find#TimeEntries | People/Time/TimeEntries | Projects/Resources/PersonDetail/Time; Projects/Time/TeamTimesheet; Projects/Time/TimeEntries; Projects/Time/TimeEntries/EditEntry; People/Time/TimeEntries (People P10, Projects' screen mounted under People) |
| TimeServices | import#TimeEntryCsv | People/Time/TimeImport; People/Time/TimeEntries | Projects/Time/Import/Preview; Projects/Time/Import/Result; Projects/Time/Import/Source; People/Time/TimeEntries (People P10, Projects' screen mounted under People; People's TimeImport reads clock events only, and project time keeps this importer, People P13) |
| TimesheetServices | approve#Timesheet | People/Time/MyTime; People/Time/TimesheetDetail | Projects/Time/MyTime; Projects/Time/TimesheetDetail; Manufacturing/ShopFloor/ProductionTime (the work order's supervisor; with it sync#ProductionLaborCost writes the labor cost events, Manufacturing P10); People/Time/MyTime; People/Time/TimesheetDetail (People P10, Projects' screen mounted under People) |
| TimesheetServices | find#Timesheets | People/Time/Timesheets | Projects/Home; Projects/Resources/PersonDetail/Time; Projects/Time/Timesheets; People/Time/Timesheets (People P10, Projects' screen mounted under People) |
| TimesheetServices | get#PartyTimesheet | People/Time/MyTime | Projects/QuickCreate; Projects/Time/MyTime; Projects/Time/TimeEntries/EditEntry; People/Time/MyTime (People P10, Projects' screen mounted under People) |
| TimesheetServices | get#PartyWeek | People/Time/MyTime | Projects/Time/MyTime; People/Time/MyTime (People P10, Projects' screen mounted under People) |
| TimesheetServices | get#TimeKeepers |  | Projects/Billing/Rates; Projects/Projects/ProjectDetail/Team; Projects/Resources/Allocations/EditAllocation; Projects/Resources/TeamPlanner; Projects/Time/Import/Source; Projects/Time/MyTime; Projects/Time/TimeEntries; Projects/Time/TimeEntries/EditEntry |
| TimesheetServices | get#Timer | Manufacturing/ShopFloor; Manufacturing/ShopFloor/OperationExecution; Manufacturing/WorkOrders/WorkOrderDetail/Time; People/Time/MyTime; Maintenance/WorkOrders/WorkOrderDetail | Projects/Home; Projects/Time/MyTime; Manufacturing/ShopFloor/Station, OperationExecution and ProductionTime (through get#ShopFloorQueue, get#ProductionOperation and get#ProductionTime, Manufacturing P10); People/Time/MyTime (People P10, Projects' screen mounted under People); Maintenance/WorkOrders/WorkOrderDetail/Time: — (its own mantle.work.MaintenanceServices start#/stop#MaintenanceTimer and record#MaintenanceTime, F66, P3) |
| TimesheetServices | get#TimesheetAccess |  | Projects/QuickCreate; Projects/Resources/PersonDetail/Time; Projects/Time/MyTime; Projects/Time/TeamTimesheet; Projects/Time/TimeEntries; Projects/Time/TimeEntries/EditEntry |
| TimesheetServices | get#TimesheetPolicy |  | Projects/Resources/PersonDetail/Time; Projects/Settings/Time; Projects/Time/MyTime; Projects/Time/TeamTimesheet; Projects/Time/TimeEntries; Projects/Time/TimeEntries/EditEntry |
| TimesheetServices | get#TimesheetSummary | People/Employees/Employee360; People/Time/TimesheetDetail | Projects/Time/TimesheetDetail; Projects/Time/TimesheetPrint; People/Time/TimesheetDetail (People P10, Projects' screen mounted under People) |
| TimesheetServices | get#WeekRange |  | Projects/Resources/PersonDetail/Time; Projects/Time/MyTime; Projects/Time/TeamTimesheet; Projects/Time/TimeEntries; Projects/Time/TimeEntries/EditEntry |
| TimesheetServices | get#WorkTypes |  | Projects/Billing/Rates; Projects/QuickCreate; Projects/Settings/Time; Projects/Time/MyTime; Projects/Time/TimeEntries; Projects/Time/TimeEntries/EditEntry |
| TimesheetServices | reopen#Timesheet | People/Time/MyTime; People/Time/TimesheetDetail | Projects/Time/MyTime; Projects/Time/TimesheetDetail; Manufacturing/ShopFloor/ProductionTime (with it sync#ProductionLaborCost reverses the labor cost events, Manufacturing P10); People/Time/MyTime; People/Time/TimesheetDetail (People P10, Projects' screen mounted under People) |
| TimesheetServices | return#Timesheet | People/Time/MyTime; People/Time/TimesheetDetail | Projects/Time/MyTime; Projects/Time/TimesheetDetail; People/Time/MyTime; People/Time/TimesheetDetail (People P10, Projects' screen mounted under People) |
| TimesheetServices | send#MissingTimeReminders | People/MyTeam; People/Time/Timesheets | Projects/Time/Timesheets; People/MyTeam; People/Time/Timesheets (People P10, Projects' screen mounted under People) |
| TimesheetServices | start#Timer | Manufacturing/ShopFloor/OperationExecution; Manufacturing/WorkOrders/WorkOrderDetail/Time; People/Time/MyTime; Maintenance/WorkOrders/WorkOrderDetail | Projects/Home; Projects/Time/MyTime; Projects/WorkItems/WorkItemDetail; Manufacturing/ShopFloor/Station and OperationExecution (through start#ProductionOperation: the switch from a timer elsewhere after the confirmation, Manufacturing P10); People/Time/MyTime (People P10, Projects' screen mounted under People); Maintenance/WorkOrders/WorkOrderDetail/Time (through MaintenanceServices.start#MaintenanceTimer, which checks the work first, impl-maintenance F66, P3) |
| TimesheetServices | stop#Timer | Manufacturing/ShopFloor/OperationExecution; Manufacturing/WorkOrders/WorkOrderDetail/Time; People/Time/MyTime; Maintenance/WorkOrders/WorkOrderDetail | Projects/Home; Projects/Time/MyTime; Projects/WorkItems/WorkItemDetail; Manufacturing/ShopFloor/OperationExecution and ProductionTime (Stop timer; through pause# and complete#ProductionOperation, Manufacturing P10); People/Time/MyTime (People P10, Projects' screen mounted under People); Maintenance/WorkOrders/WorkOrderDetail/Time (through MaintenanceServices.stop#MaintenanceTimer, which checks the work first, impl-maintenance F66, P3) |
| TimesheetServices | store#TimesheetPolicy |  | Projects/Settings/Time |
| TimesheetServices | store#WorkTypes |  | Projects/Settings/Time |
| TimesheetServices | submit#Timesheet | People/Time/MyTime; People/Time/TimesheetDetail | Projects/Time/MyTime; Projects/Time/TimesheetDetail; Manufacturing/ShopFloor/ProductionTime (the week of a work order's time, Manufacturing P10); People/Time/MyTime; People/Time/TimesheetDetail (People P10, Projects' screen mounted under People) |
| TimesheetServices | update#Timer | Manufacturing/ShopFloor/OperationExecution; People/Time/MyTime | Projects/Time/MyTime; — not used by Manufacturing: OperationExecution starts and stops the person timer through start#ProductionOperation and stop#Timer (Manufacturing P10); People/Time/MyTime (People P10, Projects' screen mounted under People) |
| WorkItemImportServices | import#WorkItems |  | Projects/WorkItems/Import/Result |
| WorkItemImportServices | parse#WorkItemFile |  | Projects/WorkItems/Import/Mapping; Projects/WorkItems/Import/Source |
| WorkItemImportServices | preview#WorkItems |  | Projects/WorkItems/Import/Preview |

Existing capacity service mapped by the People design (Oct 31, 2026); source verified in `mantle/work/ResourceServices.xml`. The People schedule extension is proposed, not implemented.

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| ResourceServices | get#PartyCapacity | People/Time/WorkingScheduleDetail; Maintenance/WorkOrders | People/Time/WorkingScheduleDetail (Capacity preview, through ScheduleServices.get#CapacityPreview); Projects/Resources/PersonDetail and TeamPlanner and the timesheets' expected hours (get#TeamPlan, TimesheetServices.get#WeekDays), a People working schedule read first (People P9, F23), a published shift's hours in place of it on its day (People P14); Maintenance/WorkOrders/WorkOrderDetail (AssignSchedule's candidates' free hours, through MaintenanceDispatch.js find#MaintenanceCandidates, P8) |

## General (2 services)

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| GeneralServices | lookup#ById | Commons/Calendar/EventDetail; Commons/Knowledge; Comms/Inbox; Comms/Chat | Commons; Commons/Calendar/EventDetail; Commons/Knowledge; Commons/Notes; Comms/Chat; Comms/Inbox/Mail; Comms/Inbox/MessageDetail; Shared/Chatter; Projects/Projects/ProjectDetail/Docs; Projects/Requests/RequestDetail |
| GeneralServices | search#MantleFiltered |  |  |

### Products implementation, Oct 29, 2026

Products uses native guarded replacements for raw catalog writes, bulk assignments, content revisions and variant previews. Legacy service rows above stay blank where no BOSS screen calls that legacy API; a Designed in entry alone is not an implementation claim. Other apps' shared mounts remain later. The following public native entry points are reached by built Products screens; internal per-row workers and calls made only by another Mantle service are not claimed here.

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| product/CatalogRecordServices | store#Product |  | Shared/Product360; Products/Products/List; Shared/DataImport |
| product/CatalogRecordServices | store#CatalogRow |  | Shared/Product360; Products/Products/List; Shared/DataImport |
| product/CatalogRecordServices | ensure#CatalogAssignment |  | Shared/Product360; Products/Products/List; Shared/DataImport |
| product/ContentServices | find#CatalogContents |  | Shared/Documents; Shared/DocumentDetail; Shared/Translations; Products/Categories/CategoryDetail/Content |
| product/ContentServices | get#CatalogContent |  | Shared/Documents; Shared/DocumentDetail; Shared/Translations; Products/Categories/CategoryDetail/Content |
| product/ContentServices | store#CatalogContent |  | Shared/Documents; Shared/DocumentDetail; Shared/Translations; Products/Categories/CategoryDetail/Content |
| product/ContentServices | upload#CatalogContents |  | Shared/Documents; Shared/DocumentDetail; Shared/Translations; Products/Categories/CategoryDetail/Content |
| product/ContentServices | restore#CatalogContent |  | Shared/Documents; Shared/DocumentDetail; Shared/Translations; Products/Categories/CategoryDetail/Content |
| product/ContentServices | find#CatalogTranslations |  | Shared/Documents; Shared/DocumentDetail; Shared/Translations; Products/Categories/CategoryDetail/Content |
| product/ContentServices | store#CatalogTranslation |  | Shared/Documents; Shared/DocumentDetail; Shared/Translations; Products/Categories/CategoryDetail/Content |
| product/ContentServices | get#CatalogContentResource |  | Shared/Documents; Shared/DocumentDetail; Shared/Translations; Products/Categories/CategoryDetail/Content |
| product/ContentServices | get#ProductDatasheet |  | Shared/Documents; Shared/DocumentDetail; Shared/Translations; Products/Categories/CategoryDetail/Content |
| product/ProductImportServices | get#CatalogImportKinds | Admin/Data/DataImport | Shared/DataImport (Products/ProductImport; Admin/Data/DataImport; Admin/Data/ImportDetail) |
| product/ProductImportServices | stage#CatalogImport | Admin/Data/DataImport | Shared/DataImport (Products/ProductImport; Admin/Data/DataImport; Admin/Data/ImportDetail) |
| product/ProductImportServices | configure#CatalogImport | Admin/Data/DataImport | Shared/DataImport (Products/ProductImport; Admin/Data/DataImport; Admin/Data/ImportDetail) |
| product/ProductImportServices | validate#CatalogImport | Admin/Data/DataImport | Shared/DataImport (Products/ProductImport; Admin/Data/DataImport; Admin/Data/ImportDetail) |
| product/ProductImportServices | apply#CatalogImport | Admin/Data/DataImport; Admin/Data/ImportDetail | Shared/DataImport (Products/ProductImport; Admin/Data/DataImport; Admin/Data/ImportDetail) |
| product/ProductImportServices | get#CatalogImport | Admin/Data/ImportDetail | Shared/DataImport (Products/ProductImport; Admin/Data/DataImport; Admin/Data/ImportDetail) |
| product/ProductImportServices | get#CatalogImportReport | Admin/Data/ImportDetail | Shared/DataImport (Products/ProductImport; Admin/Data/DataImport; Admin/Data/ImportDetail) |
| product/ProductImportServices | get#CatalogImportSample | Admin/Data/DataImport | Shared/DataImport (Products/ProductImport; Admin/Data/DataImport; Admin/Data/ImportDetail) |
| product/CatalogCheckServices | validate#Catalog | Admin/Operations/Health | Shared/CatalogChecks; Products/CatalogChecks; Products/Home; Admin/Operations/Health and Admin/Home (readiness provider products.catalogChecks, impl-admin P2) |
| product/CatalogCheckServices | get#CatalogChecks |  | Shared/CatalogChecks; Products/CatalogChecks; Products/Home |
| product/PriceServices | store#ProductPrice | Commerce/Merchandising/Product360; Sales/Agreements/CustomerPrices; Sales/Agreements/AgreementDetail | Shared/Prices; Shared/PriceListDetail; Shared/PriceExplain; Shared/SupplierPrices; Commerce/Merchandising/Product360 (P3) |
| product/PriceServices | replace#ProductPrice | Commerce/Merchandising/Product360; Sales/Agreements/CustomerPrices; Sales/Agreements/AgreementDetail | Shared/Prices; Shared/PriceListDetail; Shared/PriceExplain; Shared/SupplierPrices; Commerce/Merchandising/Product360 (P3) |
| product/PriceServices | expire#ProductPrice | Commerce/Merchandising/Product360; Sales/Agreements/CustomerPrices; Sales/Agreements/AgreementDetail | Shared/Prices; Shared/PriceListDetail; Shared/PriceExplain; Shared/SupplierPrices; Commerce/Merchandising/Product360 (P3) |
| product/PriceServices | find#ProductPriceLists | Commerce/Merchandising/PriceLists; Sales/Agreements/PriceLists; Sales/Agreements/PriceListDetail | Shared/Prices; Shared/PriceListDetail; Shared/PriceExplain; Shared/SupplierPrices; Commerce/Merchandising/PriceLists (P3) |
| product/PriceServices | find#ProductPriceRules | Commerce/Merchandising/PriceLists/PriceListDetail; Sales/Agreements/PriceListDetail | Shared/Prices; Shared/PriceListDetail; Shared/PriceExplain; Shared/SupplierPrices; Commerce/Merchandising/PriceLists/PriceListDetail (P3) |
| product/PriceServices | store#ProductPriceList | Commerce/Merchandising/PriceLists; Sales/Agreements/PriceLists; Sales/Agreements/PriceListDetail | Shared/Prices; Shared/PriceListDetail; Shared/PriceExplain; Shared/SupplierPrices; Commerce/Merchandising/PriceLists (P3) |
| product/PriceServices | store#ProductPriceRule | Commerce/Merchandising/PriceLists/PriceListDetail; Sales/Agreements/PriceListDetail | Shared/Prices; Shared/PriceListDetail; Shared/PriceExplain; Shared/SupplierPrices; Commerce/Merchandising/PriceLists/PriceListDetail (P3) |
| product/PriceServices | get#ProductPriceListPublication | Commerce/Merchandising/PriceLists/PriceListDetail; Sales/Agreements/PriceListDetail | Shared/Prices; Shared/PriceListDetail; Shared/PriceExplain; Shared/SupplierPrices; Commerce/Merchandising/PriceLists/PriceListDetail (P3) |
| product/PriceServices | publish#ProductPriceList | Commerce/Merchandising/PriceLists/PriceListDetail; Sales/Agreements/PriceListDetail | Shared/Prices; Shared/PriceListDetail; Shared/PriceExplain; Shared/SupplierPrices; Commerce/Merchandising/PriceLists/PriceListDetail (P3) |
| product/PriceServices | retire#ProductPriceList | Commerce/Merchandising/PriceLists/PriceListDetail; Sales/Agreements/PriceListDetail | Shared/Prices; Shared/PriceListDetail; Shared/PriceExplain; Shared/SupplierPrices; Commerce/Merchandising/PriceLists/PriceListDetail (P3) |
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
| work/ProductionPlanningServices | get#WorkCenterLoad | Manufacturing/WorkCenters | Manufacturing/WorkCenters/Centers (with next available and offline reason, P12); Manufacturing/WorkCenters/FacilityDetail/WorkCenter; Manufacturing/Planning/Capacity (nominal, calendar-adjusted, downtime, booked and available hours by period, missing data, P12) |
| work/ProductionPlanningServices | get#ProductionSchedule | Manufacturing/Planning/ProductionSchedule | Manufacturing/Planning/ProductionSchedule (Timeline.qvue resource mode); Manufacturing/Planning/ProductionScheduleTui; Manufacturing/Planning/ScheduleSnapshot (P12) |
| work/ProductionPlanningServices | schedule#ProductionOperation | Manufacturing/Planning/ProductionSchedule; Manufacturing/WorkOrders/WorkOrderDetail/Operations | Manufacturing/Planning/ProductionSchedule (Move: preview, apply, unschedule, request and decide an override); Manufacturing/Planning/ProductionScheduleTui; Manufacturing/WorkOrders/WorkOrderDetail/Operations (Reschedule, P12) |
| work/ProductionPlanningServices | store#WorkCenterOffline | Manufacturing/WorkCenters/FacilityDetail | Manufacturing/WorkCenters/FacilityDetail/WorkCenter (Take offline with its preview, Withdraw, P12) |
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
| work/ProductionServices | create#ProductionInspection | Manufacturing/WorkOrders/WorkOrderDetail/Quality | Manufacturing/WorkOrders/WorkOrderDetail/Quality (Inspect, an in-process gate; impl-manufacturing P8) |
| work/ProductionServices | record#ProductionCostEvent |  | (internal: issue#ProductionMaterial, return#UnusedMaterial and receive#ProductionOutput, so receive#SubcontractOutput too, call it inside their transaction; Manufacturing P6; P14: receive#SubcontractOutput's service accrual and apply#InvoiceMatch's price variance) |
| work/ProductionServices | get#ProductionCosts | Manufacturing/WorkOrders/WorkOrderDetail/ProductionCosts | Manufacturing/WorkOrders/WorkOrderDetail/ProductionCosts (Costs; the estimate with cost read, actuals with ACCOUNTING_VIEW; P6, WorkOrderDetail's Costs tab since P5a) |
| work/ProductionServices | review#ProductionCosts | Manufacturing/WorkOrders/WorkOrderDetail/ProductionCosts | Manufacturing/WorkOrders/WorkOrderDetail/ProductionCosts (CloseReview, P6) |
| work/ProductionServices | find#ProductionOrders | Manufacturing/WorkOrders; Manufacturing/Home | Manufacturing/WorkOrders/Find (list, board, calendar, saved finds); Shared/OrderDetail (supplying work orders) (P5a) |
| work/ProductionServices | get#ProductionLifecycle | Manufacturing/WorkOrders/WorkOrderDetail | Manufacturing/WorkOrders/WorkOrderDetail (header, Lifecycle dialog's impact preview), Overview (history, shortages) (P5a) |
| work/ProductionServices | transition#ProductionOrder | Manufacturing/WorkOrders/WorkOrderDetail; Manufacturing/WorkOrders | Manufacturing/WorkOrders/WorkOrderDetail (Lifecycle); Manufacturing/WorkOrders/Find (board move) (P5a) |
| work/ProductionServices | batch#ProductionAction | Manufacturing/WorkOrders | Manufacturing/WorkOrders/Find (Selection: release, hold, cancel) (P5a) |
| work/ProductionServices | store#ProductionOrder | Manufacturing/WorkOrders/WorkOrderDetail/Overview | Manufacturing/WorkOrders/WorkOrderDetail/Overview (EditHeader) (P5a) |
| work/ProductionServices | store#ProductionEquipment | Manufacturing/WorkOrders/WorkOrderDetail/Overview | Manufacturing/WorkOrders/WorkOrderDetail/Overview (Equipment) (P5a) |
| work/ProductionServices | store#ProductionParty |  | Manufacturing/WorkOrders/WorkOrderDetail/Overview (People) (P5a) |
| work/ProductionServices | get#ProductionResources |  | Manufacturing/WorkOrders/WorkOrderDetail/Overview (P5a) |
| work/ProductionServices | get#ProductionOperations | Manufacturing/WorkOrders/WorkOrderDetail/Operations | Manufacturing/WorkOrders/WorkOrderDetail/Operations, Traveler (P5a) |
| work/ProductionServices | get#ProductionPickList |  | Manufacturing/WorkOrders/WorkOrderDetail/PickSheet (P5a) |
| work/ProductionServices | get#ProductionMaterials | Manufacturing/WorkOrders/WorkOrderDetail/Components; Shared/MaterialIssueReceipt | Manufacturing/WorkOrders/WorkOrderDetail/Components; Manufacturing/WorkOrders/WorkOrderDetail/MaterialIssueReceipt (material lines, stock to issue from) (P5b) |
| work/ProductionServices | store#ProductionMaterial | Manufacturing/WorkOrders/WorkOrderDetail/Components | Manufacturing/WorkOrders/WorkOrderDetail/Components (AddMaterial, Edit, Remove of a manual draft line) (P5b) |
| work/ProductionServices | preview#ProductionBackflush | Shared/MaterialIssueReceipt | Manufacturing/WorkOrders/WorkOrderDetail/MaterialIssueReceipt (Backflush preview) (P5b) |
| work/ProductionServices | backflush#ProductionMaterials | Shared/MaterialIssueReceipt | Manufacturing/WorkOrders/WorkOrderDetail/MaterialIssueReceipt (Confirm backflush, through issue#ProductionMaterial) (P5b) |
| work/ProductionServices | get#ProductionShortages | Manufacturing/Home | Manufacturing/Home (Short count, the queue's shortages) (P5b) |
| work/ProductionServices | request#SubcontractService | Manufacturing/Subcontracting/SubcontractOperations; Manufacturing/Subcontracting/SubcontractDetail | Manufacturing/Subcontracting/SubcontractOperations and SubcontractDetail (New outside processing, P14) |
| work/ProductionServices | store#ProductionSubcontract | Manufacturing/Subcontracting/SubcontractDetail | Manufacturing/Subcontracting/SubcontractDetail (Edit agreement, P14) |
| work/ProductionServices | get#SubcontractMaterials | Manufacturing/Subcontracting/SubcontractDetail | Manufacturing/Subcontracting/SubcontractDetail (Materials), SubcontractInstructions (P14) |
| work/ProductionServices | get#SubcontractStatus | Manufacturing/Subcontracting/SubcontractDetail | Manufacturing/Subcontracting/SubcontractDetail (header, Agreement, Acceptance), SubcontractInstructions (P14) |
| work/ProductionServices | find#SubcontractOperations | Manufacturing/Subcontracting/SubcontractOperations | Manufacturing/Subcontracting/SubcontractOperations; Shared/Supplier360/SubcontractOrders (Manufacturing context) (P14) |
| work/ProductionServices | get#SubcontractOrder |  | Shared/OrderDetail (Manufacturing context, P14) |
| work/ProductionServices | get#SubcontractShipment |  | Shared/ShipmentDetail (Manufacturing context, P14) |
| ledger/ProductionCostServices | get#AllocationPolicies | Accounting/Settings/CostingPolicies | Accounting/Settings/CostingPolicies; Manufacturing/Settings/ProductionSettings (the policy in effect, read only, no rates) (Manufacturing P15) |
| ledger/ProductionCostServices | store#AllocationPolicy | Accounting/Settings/CostingPolicies | Accounting/Settings/CostingPolicies (Change policy, finance administration, P15) |
| ledger/ProductionCostServices | preview#CostClose | Shared/ProductionCostClose | Accounting/Inventory/ProductionCostClose; Manufacturing/WorkOrders/WorkOrderDetail/ProductionCostClose (P15) |
| ledger/ProductionCostServices | post#CostClose | Shared/ProductionCostClose | Accounting/Inventory/ProductionCostClose; Manufacturing/WorkOrders/WorkOrderDetail/ProductionCostClose (Post cost close, which also closes the run through transition#ProductionOrder; P15) |
| ledger/ProductionCostServices | get#CostClose |  | Shared/ProductionCostClose (posted allocations); Manufacturing/WorkOrders/WorkOrderDetail/ByProducts (actual allocation) (P15) |
| ledger/ProductionCostServices | return#CostReview |  | Shared/ProductionCostClose (More, Return to production; P15) |
| ledger/ProductionCostServices | check#ProductionClose |  | Accounting/PeriodClose/PeriodCloseDetail (the PccProductionWip and PccProductionCostClose rows; P15) |
| work/ProductionServices | get#ShopFloorQueue | Manufacturing/ShopFloor | Manufacturing/ShopFloor/Station (the board, through ironstone.manufacturing.ShopFloorServices.get#Station); the Manufacturing today-source (P10) |
| work/ProductionServices | get#ProductionOperation | Manufacturing/ShopFloor/OperationExecution | Manufacturing/ShopFloor/OperationExecution (Work, start checks, PersonTimer, MachineRuntime) (P10) |
| work/ProductionServices | get#ProductionInstructions | Manufacturing/ShopFloor/Instructions | Manufacturing/ShopFloor/Instructions (Steps, Evidence), InstructionsPrint (P10) |
| work/ProductionServices | record#InstructionStep | Manufacturing/ShopFloor/Instructions | Manufacturing/ShopFloor/Instructions (Acknowledge, Record evidence) (P10) |
| work/ProductionServices | override#ProductionOperationStart |  | Manufacturing/ShopFloor/OperationExecution (Override start checks, supervisors) (P10) |
| work/ProductionServices | start#ProductionOperation |  | Manufacturing/ShopFloor/Station (Start) and OperationExecution (Start) (P10) |
| work/ProductionServices | pause#ProductionOperation |  | Manufacturing/ShopFloor/OperationExecution (Pause, then Downtime's ReportStopDialog) (P10) |
| work/ProductionServices | complete#ProductionOperation | Manufacturing/ShopFloor/OperationExecution | Manufacturing/ShopFloor/OperationExecution (CompleteStep: the quantities through record#ProductionQuantity, coupled to the output receipt) (P10) |
| work/ProductionServices | record#MachineRuntime | Manufacturing/ShopFloor/OperationExecution | Manufacturing/ShopFloor/OperationExecution (Start machine, Stop machine, Record runtime) (P10) |
| work/ProductionServices | sync#ProductionLaborCost |  | (internal: TimesheetServices approve# and reopen#Timesheet, TimeServices store# and delete#TimeEntry, under the laborCostSync policy flag; P10) |
| work/ProductionServices | get#ProductionTime |  | Manufacturing/ShopFloor/ProductionTime (P10) |
| product/SupplyPlanningServices | run#SupplyPlan | Shared/SupplyPlanning | Manufacturing/Planning/SupplyPlanning (Recalculate, Manufacturing P13); Purchasing/Replenishment/SupplyPlanning (Recalculate); Purchasing/Replenishment/ReorderRules/PlanSchedule (Preview run) (Purchasing P14a) |
| product/SupplyPlanningServices | get#SupplyPlan | Shared/SupplyPlanning | Manufacturing/Planning/SupplyPlanning (suggestions, held stock, demand and supply); Purchasing/Replenishment/SupplyPlanning (buy suggestions by default); Purchasing/Replenishment/ReorderRules/PlanSchedule (Purchasing P14a) |
| product/SupplyPlanningServices | store#PlanSchedule | Shared/SupplyPlanning | Manufacturing/Planning/SupplyPlanning (Schedule); Purchasing/Replenishment/SupplyPlanning (Schedule); Purchasing/Replenishment/ReorderRules/PlanSchedule (Purchasing P14a) |
| product/SupplyPlanningServices | run#ScheduledSupplyPlans |  | the run_ScheduledSupplyPlans job |
| product/SupplyPlanningServices | convert#PlanningSuggestions | Shared/SupplyPlanning | Manufacturing/Planning/SupplyPlanning (Convert, make suggestions through create#ProductionOrder; P14: outside-processing requests to draft service PO lines for the buyer); Purchasing/Replenishment/SupplyPlanning (Convert: buy suggestions to draft purchase orders per supplier and facility, DEMAND_ALREADY_COVERED; Purchasing P14a; P14b: under the buying policy's planBuyToRequest a purchase request sent for approval, and the Drop-ship customer orders route through route#OrderItemToDropShip) |
| facility/FacilityServices | get#ProductFacilityPolicy | Maintenance/Facilities/FacilityDetail | Shared/InventoryAvailability/Policy; Products/Products/Product360/Stock/Policy; Maintenance/Facilities/FacilityDetail: — (Maintenance's facility context has no box type, location or product policy tab; they stay Warehouse's) |
| facility/FacilityServices | store#ProductFacilityPolicy | Maintenance/Facilities/FacilityDetail | Shared/InventoryAvailability/Policy (with the snooze); Products/Products/Product360/Stock/Policy; Warehouse/Locations/FacilityDetail/Products (with removeLocation); Purchasing/Replenishment/InventoryAvailability/Policy; Purchasing/Replenishment/ReorderRules/Rules (storeRule, with the snooze); the catalog import's reorderRules kind (Purchasing P14a); Maintenance/Facilities/FacilityDetail: — (Maintenance's facility context has no box type, location or product policy tab; they stay Warehouse's) |
| facility/ReorderRuleServices | preview#ReorderLevels |  | Purchasing/Replenishment/ReorderRules/SuggestLevels (Preview levels; Purchasing P14a) |
| facility/ReorderRuleServices | apply#ReorderLevels |  | Purchasing/Replenishment/ReorderRules/SuggestLevels (Apply, per row through store#ProductFacilityPolicy) |
| facility/ReorderRuleServices | validate#ReorderRuleImportRow |  | (the catalog import's reorderRules kind: Products/ProductImport) |
| facility/FacilityServices | store#Facility | Maintenance/Facilities; Maintenance/Facilities/FacilityDetail | Warehouse/Locations/Facilities; Warehouse/Locations/FacilityDetail; Warehouse/Locations/FacilityDetail/Children; Maintenance/Facilities/Find (New facility); Maintenance/Facilities/FacilityDetail (Edit facility); Maintenance/Facilities/FacilityDetail/Children |
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
| shipment/WarehouseTaskServices | ensure#PurchaseReceipt |  | Warehouse/Receiving/Receipts (NewReceipt); Warehouse/Receiving/NewReceipt (quick create); close#ReceiptRemainder's backorder; Purchasing/Receiving/Receipts and Purchasing/Orders/OrderDetail (PrepareReceipt, "Expected receipt (ASN)") (Purchasing P5) |
| shipment/WarehouseTaskServices | adjust#ExpectedReceipt |  | Purchasing/Orders/OrderChanges (ApplyRevision, through apply#PurchaseRevision; Purchasing P9) |
| shipment/WarehouseTaskServices | receive#ShipmentStock |  | Warehouse/Receiving/Receive and Warehouse/Handheld/Receive (ReceiveLine, GenerateTracking); Purchasing/Receiving/ShipmentDetail (PurchaseReceiveLine) (Purchasing P5) |
| shipment/WarehouseTaskServices | receive#ExpectedShipment |  | Warehouse/Receiving/ReceiptDetail and Receive (Receive all as expected); Purchasing/Receiving/ShipmentDetail (Receive all as expected) (Purchasing P5) |
| shipment/WarehouseTaskServices | receive#AdHocStock |  | Warehouse/Receiving/Receive (AdHocReceipt) |
| shipment/WarehouseTaskServices | close#ReceiptRemainder |  | Warehouse/Receiving/ReceiptDetail and Receive (Finish receipt); Purchasing/Receiving/ShipmentDetail (Finish receipt) (Purchasing P5) |
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
| product/QualityServices | store#InspectionTemplate, get#InspectionTemplate, find#InspectionTemplates |  | Warehouse/Inspection/InspectionTemplates (Shared/InspectionTemplates); Warehouse/Inspection/TemplatePrint (impl-warehouse P8); Manufacturing/Quality/InspectionTemplates (Shared/InspectionTemplates, production templates with stage, sample basis and attachment); Manufacturing/WorkOrders/WorkOrderDetail/QualityChecklist (as of the release) (impl-manufacturing P8); Purchasing/Receiving/InspectionTemplates (Shared/InspectionTemplates, receipt templates; Settings' Inspection templates) (Purchasing P5) |
| product/QualityServices | create#Inspection |  | (receive#ShipmentStock, for a receipt that needs inspection, in its own operation; receive#ProductionOutput for a final gate's output, impl-manufacturing P8); Manufacturing/Quality/QualityInspection (Inspect again) |
| product/QualityServices | assign#Inspection, save#InspectionReading, submit#Inspection, verify#Inspection, dispose#Inspection, get#Inspection |  | Warehouse/QualityInspection (Shared/QualityInspection); Warehouse/Inspection/Inspections (board moves and Reassign); Warehouse/InspectionCertificate; Manufacturing/Quality/QualityInspection and Quality/InspectionStation/Inspection (Shared/QualityInspection, operator mode); Manufacturing/Quality/QualityCertificate (impl-manufacturing P8); Purchasing/Receiving/QualityInspection (Shared/QualityInspection; the actions where Warehouse's scope covers the facility) (Purchasing P5) |
| product/QualityServices | find#Inspections |  | Warehouse/Inspection/Inspections; Warehouse/Receiving/ReceiptDetail (Inspection); Manufacturing/Quality/Inspections; Manufacturing/WorkOrders/WorkOrderDetail/Quality (the run's inspections) (impl-manufacturing P8) |
| product/QualityServices | get#SourceInspectionStatus |  | (Accounting's bill matching, InvoiceMatch.js receiptsOf: held quantity, F31); Manufacturing/WorkOrders/WorkOrderDetail/Quality (Gates: run, operation and output-line sources; the start, complete and operation guards read the same, impl-manufacturing P8); Purchasing/Receiving/Receipts, ShipmentDetail, Purchasing/Orders/OrderDetail and Supplier360's Receipts and quality (held quantity, PurchaseReceipts.js) (Purchasing P5) |
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
| order/OrderServices | close#PurchaseRemainders |  | Purchasing/Orders/PurchaseOrders (ClosePurchaseOrders, bulk) and Purchasing/Orders/OrderDetail (Close remainder) (Purchasing P3); its close runs inside close#ReceiptRemainder |
| order/PurchaseReceiptServices | notify#LateReceipts |  | the ServiceJob notify_LateReceipts (topic PurchaseLateReceipt, opened in Purchasing/Orders/OrderDetail); its lines (PurchaseReceipts.js) feed Purchasing/Receiving/Receipts, Home's late receipts and Purchasing/Orders/PurchaseOrders' Late view (Purchasing P5) |
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
| order/PurchaseServices | create#PurchaseOrder, update#PurchaseOrder, store#PurchaseOrderItem, delete#PurchaseOrderItem, place#PurchaseOrder, cancel#PurchaseOrder, clone#PurchaseOrder |  | Purchasing/Orders/PurchaseOrders (New purchase order); Purchasing/NewPurchaseOrder; Purchasing/Orders/OrderDetail (Edit order, Add line, Edit, Remove, Place, Cancel order, Clone) (Purchasing P3) |
| order/PurchaseServices | decide#PurchaseApproval |  | Purchasing/Orders/OrderDetail (Approve, Refuse); Purchasing/Orders/PurchaseOrders (Approve, bulk) (Purchasing P3; P4: the policy steps, refusal, budget); Purchasing/Agreements/AgreementDetail (Approve, Refuse, with the agreementId; Purchasing P13) |
| order/PurchaseServices | check#PurchaseApprovalRequired |  | (the OrderPreApprovePurchase SECA on check#OrderPreApprove, and approve#Order; Purchasing P3) |
| order/OrderServices | send#PurchaseOrder |  | Purchasing/Orders/OrderDetail (Send) (Purchasing P3) |
| order/OrderServices | get#PurchaseOrderPrint |  | Purchasing/Orders/OrderDetail (Print, Print as of) (Purchasing P3) |
| order/OrderServices | accept#ServiceItem |  | Purchasing/Orders/OrderDetail (Record acceptance of a service line) (Purchasing P3); Maintenance/WorkOrders/WorkOrderDetail (Complete's outside-service line and the Purchasing tab's Accept outside service, through MaintenanceServices.accept#MaintenanceService with the work order and its file as evidence, impl-maintenance P10) |
| order/PurchaseServices | store#PurchaseApprovalPolicy |  | Purchasing/Settings/ApprovalPolicies (New step, Change, End) (Purchasing P4) |
| order/PurchaseServices | preview#PurchaseApproval |  | Purchasing/Settings/ApprovalPolicies (ApprovalPreview); Purchasing/Orders/OrderDetail (Approvals, through ironstone.purchasing.OrderServices.get#OrderDetail) (Purchasing P4) |
| order/PurchaseServices | approve#PurchaseSource, refuse#PurchaseSource |  | Purchasing/Approvals and Commons/Notifications (the PurchaseOrderApproval and PurchaseSupplierApproval topics' approve and refuse) (Purchasing P4) |
| order/PurchaseServices | submit#SupplierApproval, decide#SupplierApproval, suspend#Supplier |  | Shared/Supplier360 (Purchasing: Approval menu) (Purchasing P4) |
| order/PurchaseServices | handle#PurchaseApprovalRevision |  | (the OrderRevisionPurchaseApproval SECA on increment#OrderRevision; Purchasing P4) |
| order/ReturnServices | find#ReturnableReceipts, add#ReceiptToReturn |  | Purchasing/Returns/SupplierReturns (NewSupplierReturn: the receipts by receipt and lot, the first item) and Purchasing/Returns/ReturnDetail (Eligible receipts, Add) (Purchasing P8); Warehouse/Returns/ReturnDetail (Warehouse P14) |
| order/ReturnServices | authorize#SupplierReturn |  | Purchasing/Returns/ReturnDetail (Authorize, Record RMA) (Purchasing P8) |
| order/ReturnServices | create#ReplacementOrder |  | Purchasing/Returns/ReturnDetail (Replace) (Purchasing P8) |
| order/OrderServices | start#PurchaseRevision, cancel#PurchaseRevision |  | Purchasing/Orders/OrderDetail (Change order); Purchasing/Orders/OrderChanges (Start a change, Let the change go) (Purchasing P9) |
| order/OrderServices | preview#PurchaseRevision, apply#PurchaseRevision |  | Purchasing/Orders/OrderChanges (ProposedChange, RevisionEffects, ApplyRevision) (Purchasing P9) |
| order/OrderServices | record#Acknowledgement |  | Purchasing/Orders/Acknowledgements (Record); Purchasing/Orders/OrderDetail (Record acknowledgement, a line's Promise) (Purchasing P9) |
| order/OrderServices | send#PurchaseReminder |  | Purchasing/Orders/Acknowledgements (Send reminder, on the selected rows); Purchasing/Orders/OrderDetail (Send reminder) (Purchasing P9) |
| other/BudgetServices | lower#SourceCommitments |  | (apply#PurchaseRevision's budget delta, internal; Purchasing P9) |
| request/RequestServices | create#PurchaseRequest |  | Purchasing/Requests/PurchaseRequests (New purchase request); Purchasing/NewPurchaseRequest (quick create) (Purchasing P10); Maintenance/WorkOrders/WorkOrderDetail/Purchasing (Request a purchase, through MaintenanceServices.link#MaintenancePurchase with store#PurchaseRequestItem and submit#PurchaseRequest, linked to the work by RequestWorkEffort, impl-maintenance P10) |
| request/RequestServices | store#PurchaseRequestItem, delete#PurchaseRequestItem |  | Purchasing/Requests/RequestDetail (Add line, Edit, Choose supplier, Remove); Purchasing/Requests/RequestSourcing (Choose supplier) (Purchasing P10) |
| request/RequestServices | submit#PurchaseRequest, cancel#PurchaseRequest |  | Purchasing/Requests/RequestDetail (Submit for approval, Cancel request) (Purchasing P10) |
| request/RequestServices | complete#PurchaseRequest |  | Purchasing/Requests/RequestDetail (Complete request: a short line's rest released with a reason, F127) (Purchasing P17) |
| request/RequestServices | decide#PurchaseRequestApproval |  | Purchasing/Requests/RequestDetail (Approve, Refuse); Purchasing/Approvals and Commons/Notifications (the PurchaseRequestApproval topic, through approve#PurchaseSource and refuse#PurchaseSource) (Purchasing P10) |
| request/RequestServices | get#PurchaseRequestProgress |  | Purchasing/Requests/RequestDetail (Lines, Approval, through ironstone.purchasing.RequestServices.get#RequestDetail) (Purchasing P10) |
| request/RequestServices | preview#PurchaseSourcing, convert#PurchaseSourcing, convert#PurchaseSourcingGroup |  | Purchasing/Requests/RequestSourcing (SourceDemand, SourceGroups, Create purchase orders, Retry the failed groups, Drop-ship) (Purchasing P10) |
| party/AgreementServices | store#PurchaseAgreement |  | Purchasing/Agreements/AgreementList (NewAgreement, from a template); Purchasing/Agreements/AgreementDetail (Edit agreement, Add term, End, Add signer, Remove, New agreement from this template, Close, Cancel) (Purchasing P13) |
| party/AgreementServices | store#AgreementItem |  | Purchasing/Agreements/AgreementDetail (Add item, Edit, End) (Purchasing P13) |
| party/AgreementServices | submit#PurchaseAgreement |  | Purchasing/Agreements/AgreementDetail (Send for approval) (Purchasing P13) |
| party/AgreementServices | get#ReleaseBalance |  | (ironstone.purchasing.AgreementServices reads the balance through PurchaseAgreements.js balanceOf: Purchasing/Agreements/AgreementList, AgreementDetail, Shared/Supplier360 Agreements) (Purchasing P13) |
| party/AgreementServices | release#PurchaseAgreement |  | Purchasing/Agreements/AgreementDetail (Release from agreement); Purchasing/Orders/PurchaseOrders (Release from agreement) (Purchasing P13) |
| party/AgreementServices | get#PurchaseAgreementPrint |  | Purchasing/Agreements/AgreementDetail (Print, Print as of) (Purchasing P13) |
| party/AgreementServices | expire#PurchaseAgreements |  | (the daily job expire_PurchaseAgreements; Purchasing P13) |
| order/PurchasePegServices | get#ReceiptPegs, reserve#ReceiptPeg |  | Purchasing/Receiving/ShipmentDetail (Bought for customer orders, Reserve for this order) (Purchasing P14b) |
| order/SourcingServices | create#QuoteRequest |  | Purchasing/Sourcing/QuoteRequests (New RFQ); Purchasing/NewQuoteRequest (quick create); Purchasing/Requests/RequestSourcing (Request quotes, the RFQ route) (Purchasing P11) |
| order/SourcingServices | store#QuoteRequest, store#QuoteRequestItem |  | Purchasing/Sourcing/QuoteRequestDetail (Edit RFQ; Add item, Edit, Remove) (Purchasing P11) |
| order/SourcingServices | store#QuoteInvitation |  | Purchasing/Sourcing/QuoteRequestDetail (Invite supplier, Declined) (Purchasing P11) |
| order/SourcingServices | send#QuoteRequest |  | Purchasing/Sourcing/QuoteRequestDetail (Send) (Purchasing P11) |
| order/SourcingServices | get#QuoteRequestPrint |  | Purchasing/Sourcing/QuoteRequestDetail (Print, Print as of) (Purchasing P11) |
| order/SourcingServices | store#SupplierQuote |  | Purchasing/Sourcing/Quotes (New supplier quote); Purchasing/Sourcing/QuoteDetail (Record the answer, Edit quote) (Purchasing P11) |
| order/SourcingServices | store#SupplierQuoteItem |  | Purchasing/Sourcing/QuoteDetail (Add line, Edit price) (Purchasing P11) |
| order/SourcingServices | publish#SupplierQuotePrice |  | Purchasing/Sourcing/QuoteDetail (Publish price) (Purchasing P11) |
| order/SourcingServices | compare#SupplierQuotes |  | Purchasing/Sourcing/QuoteComparison (CompareBasis, OfferComparison, Print, CSV) (Purchasing P12) |
| order/SourcingServices | preview#Award, commit#Award, commit#AwardGroup |  | Purchasing/Sourcing/Award (AwardPreview, AwardCommit, Retry the failed groups) (Purchasing P12) |
| order/SourcingServices | decide#AwardApproval, record#AwardDecision |  | Purchasing/Approvals and the Commons inbox (PurchaseAwardApproval, through approve#/refuse#PurchaseSource) (Purchasing P12) |
| order/SourcingServices | close#QuoteRequest |  | Purchasing/Sourcing/Award (CloseSolicitation); Purchasing/Sourcing/QuoteRequestDetail (More: Close RFQ) (Purchasing P12) |
| order/SourcingServices | store#SupplierQuoteFreight |  | Purchasing/Sourcing/QuoteDetail (Terms: Freight estimate) (Purchasing P12) |


## Accounting native additions — P0–P3 (Oct 29, 2026)

The screens call these native services after BOSS access context. Reviewed posting replaces raw/unrestricted ledger
mutators in the app. Legacy unpost, posted rewrite and post#GlJournal remain unexposed.

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| AccountingServices | get#Access | Accounting (scoped records and QuickCreate) | Native contract (not directly mounted) |
| AccountingServices | find#Records | Accounting (scoped records and QuickCreate) | Accounting/GeneralLedger/ChartOfAccounts; Accounting/GeneralLedger/JournalBatches; Accounting/GeneralLedger/JournalEntries; Accounting/GeneralLedger/JournalTemplates; Accounting/GeneralLedger/TransactionEntries; Accounting/Payables/Bills; Accounting/Payments/Payments; Accounting/PeriodClose/PeriodLocks; Accounting/PeriodClose/Periods; Accounting/Receivables/Invoices; Insights/Home (an attention provider's count, as the viewer; Insights P5) |
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
| SetupServices | get#Readiness | Accounting/Home; Accounting/Settings; Admin/Operations/Health | Accounting/Home (setupStatus offers Setup first); native contract; Admin/Operations/Health and Admin/Home (readiness provider accounting.setup, impl-admin P2, F16) |
| SetupServices | store#SetupRun | Accounting/Settings/Setup | Accounting/Settings/Setup/Basis; Accounting/Settings/Setup/OpeningBalances |
| SetupServices | preview#OpeningBalances | Accounting/Settings/Setup | Accounting/Settings/Setup (every step) |
| SetupServices | import#OpenItems | Accounting/Settings/Setup | Accounting/Settings/Setup/OpenItems |
| SetupServices | create#OpenItem | Accounting/Settings/Setup | Accounting/Settings/Setup/OpenItems (import#OpenItems, a row each) |
| SetupServices | check#Readiness | Accounting/Settings/Setup | Accounting/Settings/Setup/Readiness; Accounting/Settings/Setup/Activate (Admin Health reads get#Readiness instead, impl-admin F16) |
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
| TaxServices | simulate#SalesTax | Accounting/Tax/TaxRates; Commerce/Settings/CheckoutSettings | Accounting/Tax/TaxRates; Commerce/Settings/CheckoutSettings#TaxPreview (its calculation, SalesTax.js sample, through mantle.product.StoreAdminServices.preview#StoreTax) |
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
| ledger/AssetBookServices | get#AssetBook | Maintenance/Equipment/EquipmentDetail | Maintenance/Equipment/EquipmentDetail/Book (EquipmentBook, read only, for a user it admits; through ironstone.maintenance.EquipmentServices.get#Equipment, P2) |
| ledger/AssetBookServices | capitalize#Asset | Maintenance/Equipment/EquipmentDetail | — (the Book actions stay Accounting's dialogs in its EquipmentDetail mount; Maintenance's Book tab is read only, P2) |
| ledger/AssetBookServices | adjust#AssetBook | Maintenance/Equipment/EquipmentDetail | — (the Book actions stay Accounting's; Maintenance's Book tab is read only, P2) |
| ledger/AssetBookServices | dispose#Asset | Maintenance/Equipment/EquipmentDetail | — (the Book actions stay Accounting's; Maintenance's Book tab is read only, P2) |
| ledger/AssetBookServices | reverse#AssetBookEvent | Maintenance/Equipment/EquipmentDetail | — (the Book actions stay Accounting's; Maintenance's Book tab is read only, P2) |

## Sales design — source-verified service additions

These active definitions were verified for the Sales design. The original section counts
remain historical; these rows add no implementation claim.

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| order/OrderServices | hold#Order | Sales/Orders/OrderDetail |  |
| order/OrderServices | release#OrderHold | Sales/Orders/OrderDetail |  |
| party/ExternalAccessServices | check#AccessCapability | PASS:Sales/CustomerQuote; PASS:Sales/QuoteResponse | PASS:Supplier/SupplierHome; PASS:Supplier/QuoteResponse; PASS:Supplier/OrderAcknowledgement (its rule, through mantle.order.SupplierPortalServices) (Purchasing P16) |
| party/ExternalAccessServices | create#AccessCapability | Sales/Orders/OrderDetail | Purchasing/Sourcing/QuoteRequestDetail (Send: each quote's QuoteResponse link); Purchasing/Orders/OrderDetail (Send: the revision's OrderAcknowledgement link) (its rule, through send#QuoteRequest and send#PurchaseOrder) (Purchasing P16) |
| party/ExternalAccessServices | invite#Contact | Sales/Accounts/Customer360; Sales/Accounts/ContactDetail | Purchasing/Suppliers/Supplier360 (Invite to the Supplier app) (Purchasing P16) |
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
| product/AssetRecordServices | update#AssetMetadata | Maintenance/Equipment/EquipmentDetail | — (Warehouse's, Warehouse/Inventory/AssetDetail; Maintenance edits equipment through mantle.product.MaintenanceResourceServices store#MaintenanceEquipment, F17, P2) |
| public/SiteServices | get#SitePage | PASS:Shop/Page | PASS:Shop/Page (getShopPage's page kind, through mantle.product.ShopCatalogServices.get#Page; Shop P3) |
| public/SiteServices | publish#SitePage | Shared/PageDetail; Commerce/Website/Pages/PageDetail; Marketing/Content/LandingPages/PageDetail | Shared/PageDetail/PagePublication (Publish, Withdraw, Cancel); Commerce/Website/PageDetail (Commerce P4) |

## Purchasing P16 — Supplier portal (Nov 4, 2026)

Purchasing's pages in the PASS Supplier app call these through `pass.Facade.call#Operation` (mr-pass `Schema.js` and
`Routes.js`), locally or through Mantle's PassApi.

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| order/SupplierPortalServices | get#SupplierHome | PASS:Supplier/SupplierHome | PASS:Supplier/SupplierHome (SupplierDocuments, SupplierContact) (Purchasing P16) |
| order/SupplierPortalServices | get#QuoteInvitation | PASS:Supplier/QuoteResponse | PASS:Supplier/QuoteResponse (PublishedQuoteRequest, SupplierOffer) (Purchasing P16) |
| order/SupplierPortalServices | save#QuoteResponse | PASS:Supplier/QuoteResponse | PASS:Supplier/QuoteResponse (SupplierOffer: Save draft) (Purchasing P16) |
| order/SupplierPortalServices | submit#QuoteResponse | PASS:Supplier/QuoteResponse | PASS:Supplier/QuoteResponse (SupplierOffer: Send quote; SubmitResponse) (Purchasing P16) |
| order/SupplierPortalServices | get#PublishedPurchaseOrder | PASS:Supplier/OrderAcknowledgement | PASS:Supplier/OrderAcknowledgement (PublishedPurchaseOrder) (Purchasing P16) |
| order/SupplierPortalServices | acknowledge#PurchaseOrder | PASS:Supplier/OrderAcknowledgement | PASS:Supplier/OrderAcknowledgement (AcknowledgeOrder) (Purchasing P16) |
| order/SupplierPortalServices | report#DropShipDelivery | PASS:Supplier/OrderAcknowledgement | PASS:Supplier/OrderAcknowledgement (Report a delivery to the customer) (Purchasing P16) |
| order/SupplierPortalServices | revoke#QuoteCapabilities |  | for close#QuoteRequest (Purchasing P12) |
| order/SupplierPortalServices | revoke#OrderCapabilities |  | the SupplierPortalRevoke EECA (Purchasing P16) |


## Customer Service P15 — Support app (Nov 5, 2026)

Added in `request/SupportCaseServices.xml`, `request/KnowledgeServices.xml`, `order/ReturnPolicyServices.xml` and
`order/OrderChangeServices.xml` (impl-customer-service P15, CS-PORTAL; `SupportPortal.js`, `CustomerReturns.js`,
`CustomerOrders.js`), the PASS Support app's operations (mr-pass `Schema.js`, `Routes.js`; PassApi for a remote frontend), and
BOSS's `ironstone.customerservice.SupportAppServices` (`SupportApp.js`).

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| request/SupportCaseServices | get#SupportHome | PASS:Support/SupportHome | PASS:Support/SupportHome (HelpSearch, HelpResults; getSupportHome) |
| request/SupportCaseServices | find#CustomerCases | PASS:Support/MyCases | PASS:Support/MyCases (MyCaseFind, MyCaseList; findCustomerCases) |
| request/SupportCaseServices | get#CaseIntake, create#CustomerCase | PASS:Support/NewCustomerCase | PASS:Support/NewCustomerCase (getCaseIntake; createCustomerCase, a TOKEN_WRITE with a queue's form token) |
| request/SupportCaseServices | get#CustomerCase, reply#CustomerCase, request#CaseReopen, cancel#CustomerCase, get#CaseFile | PASS:Support/CustomerCase | PASS:Support/CustomerCase (getCustomerCase; Reply, Ask to reopen, Cancel this request, the files' download) |
| request/SupportCaseServices | save#SupportAppSetting, get#SupportAppSetting | CustomerService/Settings/ServiceDefaults | CustomerService/Settings/ServiceDefaults (Support app; through SupportAppServices.get#SupportMountSettings) |
| request/SupportCaseServices | get#CaseCustomerLink |  | for a notice's link to CustomerCase (F60); not yet called by CaseDetail's reply |
| request/SupportCaseServices | validate#TemplateValues | PASS:Support/NewCustomerCase | PASS:Support/NewCustomerCase, its rule (CaseTemplates.checkValues, customer audience) through create#CustomerCase |
| request/KnowledgeServices | get#CustomerArticle, rate#Article | PASS:Support/CustomerArticle | PASS:Support/CustomerArticle (getCustomerArticle; Was this helpful?, rateArticle, a TOKEN_WRITE with the view's nonce) |
| order/ReturnPolicyServices | find#CustomerReturns | PASS:Support/MyReturns | PASS:Support/MyReturns (MyReturnFind, MyReturnList) |
| order/ReturnPolicyServices | get#ReturnableOrder, request#CustomerReturn | PASS:Support/RequestReturn | PASS:Support/RequestReturn (through submit#CustomerReturn on the Support claim) |
| order/ReturnPolicyServices | get#CustomerReturn, add#ReturnEvidence, withdraw#CustomerReturn, get#ReturnLabel | PASS:Support/CustomerReturn | PASS:Support/CustomerReturn (the RMA link or a signed-in account; evidence, withdraw through cancel#CustomerReturn, the label's download) |
| order/OrderChangeServices | request#CustomerCancel, get#CustomerCancel, withdraw#CustomerCancel | PASS:Support/NewCustomerCase | PASS:Support/NewCustomerCase (OrderCancelRequest; requestOrderCancel through save#OrderChange, getOrderCancelRequest, withdrawOrderCancel) |
| party/ExternalAccessServices | invite#Contact | CustomerService/Customers/ContactDetail | CustomerService/Customers/ContactDetail (Invite to support, through ironstone.customerservice.SupportAppServices.create#SupportInvitation) |

## Customer Service P13 — Feedback (Nov 5, 2026)

Added in `request/CaseFeedbackServices.xml` (impl-customer-service P13, CS-FEEDBACK, CS-JOBS; `CaseFeedback.js`) and Commons'
`party/FormPublicationServices.xml` (`FormPublication.js`, built under the owner-contract rule), called by built screens, the
send job and the PASS Support app's Feedback page (operations getCaseFeedbackInvitation and submitCaseFeedback).

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| request/CaseFeedbackServices | create#FeedbackForm | CustomerService/Settings/FeedbackForms | CustomerService/Settings/FeedbackForms (NewFeedbackForm, Shared/SurveyForms) |
| request/CaseFeedbackServices | publish#FeedbackForm | CustomerService/Settings/FeedbackFormDetail | CustomerService/Settings/FeedbackFormDetail (Publish) |
| request/CaseFeedbackServices | save#FeedbackFormField, save#FeedbackFormCondition, end#FeedbackFormPart, rename#FeedbackForm, get#FeedbackForm |  | CustomerService/Settings/FeedbackFormDetail (FormFields, FieldOptions, the rules, Rename; Shared/SurveyFormDetail), over mantle.party.FormDefinitions since People P16 (Customer Service's survey registration) |
| request/CaseFeedbackServices | save#InvitationPolicy | CustomerService/Settings/ServiceDefaults | CustomerService/Settings/ServiceDefaults (FeedbackDeliveryPolicy, Stop asking) |
| request/CaseFeedbackServices | queue#Invitation, create#Invitation |  | the SupportCaseFeedbackInvitation rule (entity/FormPublication.eecas.xml), after a case's resolution |
| request/CaseFeedbackServices | send#Invitations, send#Invitation |  | the send_CaseFeedbackInvitations ServiceJob (CS-JOBS) |
| request/CaseFeedbackServices | get#Invitation | PASS:Support/Feedback | PASS:Support/Feedback (CaseFeedback; getCaseFeedbackInvitation, PassApi for a remote frontend) |
| request/CaseFeedbackServices | submit#CaseFeedback | PASS:Support/Feedback | PASS:Support/Feedback (Send my answer; submitCaseFeedback, a TOKEN_WRITE) |
| request/CaseFeedbackServices | record#FeedbackFollowUp | CustomerService/Reports/ResponseDetail | CustomerService/Reports/ResponseDetail (FeedbackFollowUp, Shared/SurveyResponseDetail) |
| request/CaseFeedbackServices | check#SupportAppReadiness |  | a site's readiness (PublicApps.js, Forum's site checks) for its support mount |
| party/FormPublicationServices | guard#FormResponse |  | the InvitedFormResponseImmutable rules (FormPublication.eecas.xml): update#FormResponse and delete#FormResponse refuse an invited response |
| ScreenServices (framework) | create#FormResponse, get#FormResponse, evaluate#DbFormDependencies, publish#DbForm |  | through submit#CaseFeedback, ironstone.customerservice.FeedbackServices.get#CaseResponse and the feedback form services (Customer Service P13) |

## Customer Service P12 — Knowledge (Nov 5, 2026)

Added in `request/KnowledgeServices.xml` (impl-customer-service P12, CS-KNOWLEDGE), called by built screens; the Support
app's CustomerArticle (P15) is to call `get#PublishedArticle` and `find#ArticleSuggestions` on its customer-visible surface.

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| request/KnowledgeServices | save#ServiceKnowledgeSource | CustomerService/Settings/KnowledgeSources | CustomerService/Settings/KnowledgeSources (ServiceKnowledgeSources: Add source, Edit, End) |
| request/KnowledgeServices | find#ArticleSuggestions | CustomerService/Cases/NewCase; CustomerService/Cases/CaseDetail; PASS:Support/CustomerArticle | CustomerService/Cases/NewCase (CaseIdentity's suggestions); CustomerService/Cases/CaseDetail (Knowledge tab, through ironstone.customerservice.KnowledgeServices.get#CaseKnowledge); PASS:Support/SupportHome and NewCustomerCase (customer-visible, through get#SupportHome and get#CaseIntake; Customer Service P15) |
| request/KnowledgeServices | get#PublishedArticle | PASS:Support/CustomerArticle | PASS:Support/CustomerArticle and SupportHome, through get#CustomerArticle (F59; Customer Service P15) |
| request/KnowledgeServices | get#ArticlePublicLink | CustomerService/Cases/CaseDetail; CustomerService/Knowledge | CustomerService/Cases/CaseDetail (Send to customer); CustomerService/Knowledge/Knowledge (Send to customer), through prepare#ArticleSend |
| request/KnowledgeServices | record#ArticleFeedback | PASS:Support/CustomerArticle | CustomerService/Cases/CaseDetail (Knowledge tab: Helpful?); PASS:Support/CustomerArticle (rate#Article, Customer Service P15) |
| request/KnowledgeServices | review#ArticleFeedback | CustomerService/Knowledge/ArticleFeedback | CustomerService/Knowledge/ArticleFeedback (FeedbackReview) |
| request/KnowledgeServices | suggest#ArticleEdit | CustomerService/Cases/CaseDetail; CustomerService/Knowledge | CustomerService/Cases/CaseDetail (Suggest edit); CustomerService/Knowledge/Knowledge (Suggest edit) |
| request/KnowledgeServices | create#ArticleFromCase | CustomerService/Knowledge/CaseToArticle | CustomerService/Knowledge/CaseToArticle (ArticleDraft; AnswerSelection's preview through prepare#ArticleFromCase) |
| request/KnowledgeServices | make#ArticleTask |  | for review#ArticleFeedback and suggest#ArticleEdit |

## Customer Service P8 — Merge, split and closing (Nov 5, 2026)

Added in `request/SupportCaseServices.xml` (impl-customer-service P8, CS-MERGE, CS-JOBS; `CaseRelations.js`, the merge's
clocks in `Sla.js`), called by built screens and jobs; the Support app's CustomerCase (P15) is to get its reopen and follow-up
from the same reply rule (Sla.js recordMessage).

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| request/SupportCaseServices | preview#MergeCases | CustomerService/Cases/MergeCases | CustomerService/Cases/MergeCases (MergeSelection, MergePreview) |
| request/SupportCaseServices | merge#Cases | CustomerService/Cases/MergeCases | CustomerService/Cases/MergeCases (MergeConfirm) |
| request/SupportCaseServices | preview#SplitCase | CustomerService/Cases/SplitCase | CustomerService/Cases/SplitCase (SplitSelection) |
| request/SupportCaseServices | split#Case | CustomerService/Cases/SplitCase | CustomerService/Cases/SplitCase (SplitNewCase) |
| request/SupportCaseServices | create#FollowUpCase | CustomerService/Cases/CaseDetail | CustomerService/Cases/CaseDetail (Open a follow-up case, template/CustomerServiceLineage.xml) |
| request/SupportCaseServices | make#FollowUpCase |  | the reply rule after the commit (Sla.js recordMessage, CaseRelations.js replyArrived) |
| request/SupportCaseServices | get#CaseLineage | CustomerService/Cases/CaseDetail | CustomerService/Cases/CaseDetail (the lineage, a merged case's redirect, through CaseServices.get#CaseDetail) |
| request/SupportCaseServices | close#ResolvedCases, close#ResolvedCase | CustomerService/Settings/ServiceDefaults | CustomerService/Settings/ServiceDefaults (the auto-close delay); the close_ResolvedCases ServiceJob (ServicePolicy.autoCloseDays) (Customer Service P8) |
| RequestServices | link#RequestRecord, add#RequestComment, replace#RequestParty, create#Request, file#RequestEmail |  | through merge#Cases, split#Case and the follow-up (Customer Service P8) |

## Customer Service P7 — Case templates (Nov 5, 2026)

Added in `request/SupportCaseServices.xml` (impl-customer-service P7, CS-TEMPLATES; `CaseTemplates.js`), over the framework's
dated DbForm services (`org.moqui.impl.ScreenServices`), called by built screens; the Support app's NewCustomerCase (P15) is to
call `get#CaseTemplate` and `validate#TemplateValues` with the customer's audience.

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| request/SupportCaseServices | save#CaseTemplate | CustomerService/Settings/CaseTemplates | CustomerService/Settings/CaseTemplates (New template, Rename, Publish, Use for a queue) |
| request/SupportCaseServices | save#CaseTemplateField |  | CustomerService/Settings/CaseTemplates (Add field, Edit) |
| request/SupportCaseServices | save#CaseTemplateCondition |  | CustomerService/Settings/CaseTemplates (the condition rows) |
| request/SupportCaseServices | end#CaseTemplatePart |  | CustomerService/Settings/CaseTemplates (End a field or condition) |
| request/SupportCaseServices | validate#CaseTemplate | CustomerService/Settings/CaseTemplates | CustomerService/Settings/CaseTemplates (TemplatePreview's check; the problems) |
| request/SupportCaseServices | validate#TemplateValues | CustomerService/Cases/NewCase; PASS:Support/NewCustomerCase | CustomerService/Cases/NewCase (through create#Case); PASS:Support/NewCustomerCase (create#CustomerCase, Customer Service P15) |
| request/SupportCaseServices | get#CaseTemplate | PASS:Support/NewCustomerCase | CustomerService/Settings/CaseTemplates (TemplateEdit, with its drafts); the customer's projection for P15; PASS:Support/NewCustomerCase (the customer projection of get#CaseIntake, Customer Service P15) |
| request/SupportCaseServices | get#CaseTemplateValues | CustomerService/Cases/CaseDetail | CustomerService/Cases/CaseDetail (Overview, template/CustomerServiceTemplates.xml) |
| ScreenServices (framework) | publish#DbForm, create#DbFormFieldSuccessor, store#DbFormFieldDependency, end#DbFormField, end#DbFormFieldOption, end#DbFormFieldDependency, evaluate#DbFormDependencies, create#FormResponse, get#FormResponse |  | through the services above (Customer Service P7) |

## Customer Service P3 — customers and orders (Nov 5, 2026)

Mantle services Customer Service P3 added or calls that had no row.

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| order/OrderConfirmationServices | get#OrderConfirmationPrint | CustomerService/Orders/OrderDetail | — (the confirmation as placed; store#OrderConfirmation renders it) (Customer Service P3) |
| order/OrderConfirmationServices | store#OrderConfirmation | CustomerService/Orders/OrderDetail | — (resend#OrderConfirmation stores it on the first resend) (Customer Service P3) |
| order/OrderConfirmationServices | resend#OrderConfirmation | CustomerService/Orders/OrderDetail | CustomerService/Orders/OrderDetail (Resend confirmation) (Customer Service P3) |
| product/InventoryReportServices | get#InventoryAtDate | CustomerService/Availability/StockAtDate; Shared/StockAtDate | Warehouse/Reports/StockAtDate (Warehouse P17); CustomerService/Availability/StockAtDate (AvailabilityServices.get#StockAtDate, the customer-serving facilities; Customer Service P3) |

## Customer Service P10 — Order changes (Nov 5, 2026)

Mantle services Customer Service P10 added or calls that had no row.

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| order/OrderChangeServices | save#OrderChange | CustomerService/Orders/OrderChangeDetail; Shared/OrderChangeDetail | CustomerService/Orders/OrderChangeDetail (ChangeProposal, its Edit; from OrderDetail's Propose change and CaseDetail's Request order change) (Customer Service P10) |
| order/OrderChangeServices | withdraw#OrderChange | CustomerService/Orders/OrderChanges | CustomerService/Orders/OrderChangeDetail (Withdraw) (Customer Service P10) |
| order/OrderChangeServices | get#OrderChange | CustomerService/Orders/OrderChangeDetail | CustomerService/Orders/OrderChangeDetail (the record header, ChangeProposal, ChangeDecision) (Customer Service P10) |
| order/OrderChangeServices | preview#OrderChange | CustomerService/Orders/OrderChangeDetail | CustomerService/Orders/OrderChangeDetail (ChangeImpact) (Customer Service P10) |
| order/OrderChangeServices | decide#OrderChange | CustomerService/Orders/OrderChangeDetail; CustomerService/Approvals | CustomerService/Orders/OrderChangeDetail (ChangeDecision) (Customer Service P10) |
| order/OrderChangeServices | approve#OrderChangeMessage, refuse#OrderChangeMessage | CustomerService/Approvals | Commons/Notifications (the OrderChangeApproval topic's approve and refuse) (Customer Service P10) |
| order/OrderChangeServices | apply#OrderChange | CustomerService/Orders/OrderChangeDetail | CustomerService/Orders/OrderChangeDetail (ApplyChange) (Customer Service P10) |
| order/OrderChangeServices | send#OrderChangeConfirmation | CustomerService/Orders/OrderChangeDetail | CustomerService/Orders/OrderChangeDetail (Send confirmation: the applied change's PDF) (Customer Service P10) |
| order/OrderChangeServices | find#OrderChanges | CustomerService/Orders/OrderChanges | CustomerService/Orders/OrderChanges (ChangeFind, ChangeList) (Customer Service P10) |
| shipment/WarehouseTaskServices | reopen#ShipmentPackageForChange |  | (internal: apply#OrderChange's reopen between pack and ship, under ORDER_CHANGE_APPLY; Customer Service P10) |

## Customer Service P11 — Warranty (Nov 5, 2026)

Mantle services Customer Service P11 added or calls that had no row.

| Service XML | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| request/WarrantyServices | find#WarrantyClaims | CustomerService/Returns/WarrantyClaims | CustomerService/Returns/WarrantyClaims (WarrantyFind, WarrantyList; the user's queues and assigned claims) (Customer Service P11) |
| request/WarrantyServices | get#WarrantyClaim |  | CustomerService/Returns/WarrantyAssessment (the record header, WarrantyEvidence, WarrantyDecision, RepairLinks) (Customer Service P11) |
| request/WarrantyServices | save#WarrantyClaim | CustomerService/Returns/WarrantyAssessment | CustomerService/Returns/WarrantyAssessment (Record evidence); CustomerService/Cases/NewCase (a warranty claim's serial, sale and fault after create#Case) (Customer Service P11) |
| request/WarrantyServices | get#WarrantyCoverage | CustomerService/Returns/WarrantyAssessment; Shared/Customer360 | CustomerService/Returns/WarrantyAssessment (Coverage, through get#WarrantyClaim); Shared/Customer360/ServiceDeliveredItems (through find#DeliveredItems) (Customer Service P11) |
| request/WarrantyServices | decide#WarrantyClaim | CustomerService/Returns/WarrantyAssessment | CustomerService/Returns/WarrantyAssessment (Decide, Record consent) (Customer Service P11) |
| request/WarrantyServices | link#WarrantyWork | CustomerService/Returns/WarrantyAssessment | CustomerService/Returns/WarrantyAssessment (Add repair: an AssetMaintenance with its WepMaintenance task) (Customer Service P11); with the organization's MaintenancePolicy managing warranty repairs the repair is also made a managed work order, its task the root (impl-maintenance P12) |
| request/WarrantyServices | update#WarrantyWork |  | CustomerService/Returns/WarrantyAssessment (Update repair: in process, finished, cancelled) (Customer Service P11); a managed repair moves through transition#MaintenanceWorkOrder under the caller's maintenance permission, and RepairLinks offers no Update repair for it (impl-maintenance P12) |
| request/WarrantyServices | notify#WarrantyWorkFinished |  | (internal: the WarrantyWorkFinished rule on AssetMaintenance; the WarrantyRepairFinished topic; Customer Service P11) |
| request/WarrantyServices | store#ServiceAgreement | Shared/Customer360 | Shared/Customer360/ServiceStatistics (ServiceAgreements: New agreement and Change, SUPPORT_POLICY_EDIT, after check#Record; Customer Service P14); the demo and Mantle's spec call it (Customer Service P11) |
| request/WarrantyServices | find#DeliveredItems | Shared/Customer360 | Shared/Customer360/ServiceDeliveredItems (DeliveredItems, crosscut §3.2) (Customer Service P11) |
| product/EquipmentServices | create#AssetMaintenance | Manufacturing/WorkCenters/Downtime | CustomerService/Returns/WarrantyAssessment (through link#WarrantyWork: AsMntCreated, MntTpWarranty, the sold serial's Asset; Customer Service P11) |

Added in `product/MaintenanceResourceServices.xml` and `facility/FacilityServices.xml` (impl-maintenance P2; `MaintenanceResources.js`,
`FacilitySetup.js`), called by built screens through the Maintenance screens after `ironstone.maintenance.AccessServices.check#Record`:

| File | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| product/MaintenanceResourceServices | find#MaintenanceEquipment | Maintenance/Equipment | Maintenance/Equipment/Find (EquipmentRows); Maintenance/Facilities/FacilityDetail/Equipment; the palette and the equipment choice (ironstone.maintenance) |
| product/MaintenanceResourceServices | find#MaintenanceFacilities | Maintenance/Facilities | Maintenance/Facilities/Find (FacilityTree, list and tree); Maintenance/Facilities/FacilityDetail (header, Children, Rooms); the palette |
| product/MaintenanceResourceServices | store#MaintenanceEquipment | Maintenance/Equipment; Maintenance/Equipment/EquipmentDetail | Maintenance/Equipment/Find (CreateEquipment); Maintenance/Equipment/EquipmentDetail/Identity (Edit equipment) |
| product/MaintenanceResourceServices | record#MaintenanceMeter | Maintenance/Equipment/EquipmentDetail | Maintenance/Equipment/EquipmentDetail/Meters (Record a reading); a checklist's counter reading (record#ProcessStep, its Measurement linked; in work, only the work's own equipment, Maintenance P7, F94); a meter plan's Complete (transition#MaintenanceWorkOrder's meterValue, the assigned technician's or a supervisor's, Maintenance P14 and its review) |
| product/MaintenanceResourceServices | store#MaintenanceRegistration | Maintenance/Equipment/EquipmentDetail | Maintenance/Equipment/EquipmentDetail/Registrations (Add registration) |
| product/MaintenanceResourceServices | change#MaintenanceCustody | Maintenance/Equipment/EquipmentDetail | Maintenance/Equipment/EquipmentDetail/Assignments (Change custodian) |
| product/MaintenanceResourceServices | move#MaintenanceEquipment | Maintenance/Equipment/EquipmentDetail | Maintenance/Equipment/EquipmentDetail/Identity (Move, with its preview) |
| product/MaintenanceResourceServices | preview#MaintenanceFacilityChange | Maintenance/Facilities/FacilityDetail | Maintenance/Facilities/FacilityDetail (Move, its effect shown before Edit facility's store#Facility makes it) |
| facility/FacilityServices | store#FacilityFeature | Maintenance/Facilities/FacilityDetail | Maintenance/Facilities/FacilityDetail/Rooms (Add feature, End) |

Added in `work/MaintenanceServices.xml`, `work/MaintenanceSettingsServices.xml` and `work/MaintenanceReportServices.xml`
(impl-maintenance P3; `MaintenanceWork.js`), called by built screens through the Maintenance screens after
`ironstone.maintenance.AccessServices.check#Record`:

| File | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| work/MaintenanceServices | find#MaintenanceWorkOrders | Maintenance/WorkOrders; Maintenance/Home | Maintenance/WorkOrders/Find (WorkRows, board, calendar, through ironstone.maintenance.WorkOrderServices.find#WorkOrderRows); Maintenance/Equipment/EquipmentDetail/Maintenance; Maintenance/Facilities/FacilityDetail/WorkOrders; Maintenance's Today source and palette |
| work/MaintenanceServices | get#MaintenanceWorkOrder | Maintenance/WorkOrders/WorkOrderDetail | Maintenance/WorkOrders/WorkOrderDetail (header, Lifecycle; Overview, Time, History) |
| work/MaintenanceServices | create#MaintenanceWorkOrder | Maintenance/WorkOrders | Maintenance/WorkOrders/NewWorkOrder (NewWork; the quick create's; P6: from a procedure, Use procedure) |
| work/MaintenanceServices | store#MaintenanceWorkOrder | Maintenance/WorkOrders/WorkOrderDetail | Maintenance/WorkOrders/WorkOrderDetail/Overview (WorkHeaderEdit) |
| work/MaintenanceServices | schedule#MaintenanceWorkOrder | Maintenance/WorkOrders; Maintenance/WorkOrders/WorkOrderDetail | Maintenance/WorkOrders/WorkOrderDetail/Overview (Assign and schedule); Admin's offboarding (maintenance.assignments transfer; P6: replacePartyId on the root and its steps, F113); P14 review: a plan's work reminds each person assigned to it a day before its due date (WorkEffortReminder), and one taken off it keeps none; P8: the people added checked on the work's qualifications, a warning or refused under the work policy |
| work/MaintenanceServices | transition#MaintenanceWorkOrder | Maintenance/WorkOrders/WorkOrderDetail | Maintenance/WorkOrders/WorkOrderDetail (primary action, Lifecycle, CompleteWork; a meter plan's reading, P14); Maintenance/WorkOrders/Find (board moves) |
| work/MaintenanceServices | act#MaintenanceWorkOrders | Maintenance/WorkOrders | Maintenance/WorkOrders/Find (Approve, Cancel on the selection; P8: Assign and Schedule, BulkWork) |
| work/MaintenanceServices | find#MaintenanceCandidates | Maintenance/WorkOrders | Maintenance/WorkOrders/WorkOrderDetail/Overview (Assign and schedule's ranked technicians, the choice technicians; P8) |
| work/MaintenanceServices | adopt#MaintenanceRecord | Maintenance/Equipment/EquipmentDetail | Maintenance/Equipment/EquipmentDetail/Maintenance (Adopt) |
| work/MaintenanceServices | start#MaintenanceTimer | Maintenance/WorkOrders/WorkOrderDetail | Maintenance/WorkOrders/WorkOrderDetail/Time (Start timer; then TimesheetServices.start#Timer) |
| work/MaintenanceServices | stop#MaintenanceTimer | Maintenance/WorkOrders/WorkOrderDetail | Maintenance/WorkOrders/WorkOrderDetail/Time (Stop timer; then TimesheetServices.stop#Timer) |
| work/MaintenanceServices | record#MaintenanceTime | Maintenance/WorkOrders/WorkOrderDetail | Maintenance/WorkOrders/WorkOrderDetail/Time (Record time; then TimeServices.store#TimeEntry) |
| work/MaintenanceSettingsServices | get#MaintenancePolicy | Maintenance/Settings | Maintenance/Settings/WorkPolicy (MaintenanceSettings) |
| work/MaintenanceSettingsServices | find#MaintenanceTeams | Maintenance/Settings | Maintenance/Settings/Teams (TeamList, TeamMembers; P8) |
| work/MaintenanceSettingsServices | store#MaintenanceTeamDefaults | Maintenance/Settings | Maintenance/Settings/Teams (TeamDefaults; P8) |
| work/MaintenanceSettingsServices | store#MaintenancePolicy | Maintenance/Settings | Maintenance/Settings/WorkPolicy (MaintenanceSettings, Save from the date chosen; P18: each field not given kept, PolicyDates; the preventive lead days, P14) |
| work/MaintenanceReportServices | get#MaintenanceHome | Maintenance/Home | Maintenance/Home (Counters, My work, Team work; the overdue PM and unknown meter counters, P14) |

Added in `work/MaintenanceServices.xml` (impl-maintenance P4; `MaintenanceIntake.js`): the requests and intake, called by Maintenance's
Requests and RequestDetail after `check#Record` and by Commons' Report a problem and RequestDetail (a requester holds no Maintenance
root, F78; the services check MAINTENANCE_REQUEST and the organization themselves):

| File | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| work/MaintenanceServices | report#MaintenanceProblem | Maintenance/Requests | Commons/ReportProblem (the + menu's Report a problem, Maintenance/Requests' link to it) |
| work/MaintenanceServices | find#MaintenanceReportTargets | Maintenance/Requests | Commons/ReportProblem (Equipment or facility) |
| work/MaintenanceServices | resolve#MaintenanceReportScan | Maintenance/Requests | Commons/ReportProblem (Or scan its tag) |
| work/MaintenanceServices | find#MaintenanceRequests | Maintenance/Requests; Maintenance/Requests/RequestDetail | Maintenance/Requests/Find (through ironstone.maintenance.RequestServices.find#RequestRows); Maintenance/Requests/RequestDetail (get#RequestContext); Commons/Requests/RequestDetail (the reporter's Maintenance summary) |
| work/MaintenanceServices | triage#MaintenanceRequest | Maintenance/Requests; Maintenance/Requests/RequestDetail | Maintenance/Requests/RequestDetail (Create work order, Add to a work order, Reject, Assign); Maintenance/Requests/Find (the adoption queue's Make a work order of a request) |
| work/MaintenanceServices | find#UnmanagedMaintenance | Maintenance/Requests | Maintenance/Requests/Find (Maintenance records with no work order) |
| work/MaintenanceServices | create#MaintenanceRequestFromEmail | Maintenance/Requests | the mail rules' Make a maintenance request (EmailRuleAction ErActCreateMaintenanceRequest; no screen) |

Added in `work/ResourceBookingServices.xml` (impl-maintenance P5; `ResourceOutages.js`; `record#ResourceUnavailability` was
Manufacturing P11's internal service and gains Maintenance's entry point), called by built screens through the Maintenance screens
after `ironstone.maintenance.AccessServices.check#Record`:

| File | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| work/ResourceBookingServices | record#ResourceUnavailability | Maintenance/Equipment/Downtime; Maintenance/WorkOrders/WorkOrderDetail | Maintenance/Equipment/Downtime (RecordDowntime); Maintenance/WorkOrders/WorkOrderDetail/Downtime (Record outage); WorkOrderDetail's Start with offline intent and Complete leaving equipment down (through transition#MaintenanceWorkOrder); Manufacturing/WorkCenters/Downtime (an equipment-fault stop, through store#ProductionDowntime, Manufacturing P11); P15: Maintenance/Scheduling/Blackouts (StoreBlock, a planned block) and Manufacturing's FacilityDetail offline change (store#WorkCenterOffline's planned block) |
| work/ResourceBookingServices | find#ResourceUnavailability | Maintenance/Equipment/Downtime; Maintenance/Scheduling/Blackouts | Maintenance/Equipment/Downtime (DowntimeRows, the correction history); Maintenance/WorkOrders/WorkOrderDetail/Downtime; P15: Maintenance/Scheduling/Blackouts (BlockRows, the list and calendar) |
| work/ResourceBookingServices | correct#ResourceUnavailability | Maintenance/Equipment/Downtime; Maintenance/Scheduling/Blackouts | Maintenance/Equipment/Downtime and WorkOrderDetail/Downtime (Correct); P15: Maintenance/Scheduling/Blackouts (a block's Correct) |
| work/ResourceBookingServices | end#ResourceUnavailability | Maintenance/Equipment/Downtime; Maintenance/WorkOrders/WorkOrderDetail | Maintenance/Equipment/Downtime and WorkOrderDetail/Downtime (RestoreResource); P15: Maintenance/Scheduling/Blackouts (a block's End) |

Added in `work/ResourceBookingServices.xml` (impl-maintenance P15; `ResourcePolicy.js`), the booking policy, its approvers and the one
availability read, which `EventServices`' `book#Resource`, `check#ResourceBookings` (and through it `update#EventOccurrence`,
`store#EventRecurrence` for a managed resource and the CalDAV event PUT), `create#Event`'s equipment, `get#FreeBusy` and
`get#FullCalendarData` (its `unavailableList`, and a managed resource's hidden bookings answered Busy) call:

| File | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| work/ResourceBookingServices | find#BookableResources | Maintenance/Scheduling/Resources | Maintenance/Scheduling/Resources (ResourceRows) |
| work/ResourceBookingServices | get#ResourceBookingPolicy | Maintenance/Scheduling/ResourcePolicyDetail | Maintenance/Scheduling/ResourcePolicyDetail (BookingPolicy, BookingApprovers, the history) |
| work/ResourceBookingServices | store#ResourceBookingPolicy | Maintenance/Scheduling/Resources; Maintenance/Scheduling/ResourcePolicyDetail | Maintenance/Scheduling/Resources (Bookability); Maintenance/Scheduling/ResourcePolicyDetail (BookingPolicy) |
| work/ResourceBookingServices | preview#ResourceBookingPolicy | Maintenance/Scheduling/ResourcePolicyDetail | Maintenance/Scheduling/ResourcePolicyDetail (PolicyImpact) |
| work/ResourceBookingServices | store#ResourceApprover | Maintenance/Scheduling/ResourcePolicyDetail | Maintenance/Scheduling/ResourcePolicyDetail (BookingApprovers' add and end); Admin's offboarding (Maintenance's lifecycle participant, bookingApprovals) |
| work/ResourceBookingServices | get#ResourceAvailability | Maintenance/Scheduling/ResourceCalendar | Maintenance/Scheduling/ResourcePolicyDetail; Maintenance/Equipment/EquipmentDetail/Schedule; Maintenance/Facilities/FacilityDetail/Schedules; P16: Maintenance/Scheduling/ResourceCalendarTui (the day's intervals) |

Added in `work/ResourceBookingServices.xml` (impl-maintenance P16; `ResourceBookingDecisions.js`), the booking decisions; `book#Resource`
and `check#ResourceBookings` (a move) tell the approvers on the ResourceBooking topic, whose approve and refuse services Commons'
approvals inbox calls:

| File | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| work/ResourceBookingServices | find#ResourceBookingRequests | Maintenance/Scheduling/BookingRequests | Maintenance/Scheduling/BookingRequests (BookingRows) |
| work/ResourceBookingServices | decide#ResourceBooking | Maintenance/Scheduling/BookingRequests; Commons/Notifications | Maintenance/Scheduling/BookingRequests (BookingDecision: Approve, Deny); Commons/Notifications and Commons/Panel/Notifications (through approve#ResourceBooking and refuse#ResourceBooking) |
| work/ResourceBookingServices | decide#ResourceBookings | Maintenance/Scheduling/BookingRequests | Maintenance/Scheduling/BookingRequests (BulkBookingDecision) |
| work/ResourceBookingServices | approve#ResourceBooking, refuse#ResourceBooking | Commons/Notifications | Commons/Notifications and Commons/Panel/Notifications (the ResourceBooking topic's approve and refuse services, through approve#NotificationMessage and refuse#NotificationMessage) |

Added in `work/ProcessServices.xml` (impl-maintenance P6; `MaintenanceProcedures.js`, the checked path of the WppMaintenanceProcedure
policy), called by built screens through the Maintenance screens after `ironstone.maintenance.AccessServices.check#Record`
(recordType procedure):

| File | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| work/ProcessServices | find#WorkProcesses | Maintenance/Procedures | Maintenance/Procedures/Find (ProcedureRows); Maintenance's palette; the procedures choice of Maintenance/WorkOrders/NewWorkOrder (usable) |
| work/ProcessServices | get#WorkProcess | Maintenance/Procedures/ProcedureDetail | Maintenance/Procedures/ProcedureDetail (header and every tab) |
| work/ProcessServices | store#WorkProcess | Maintenance/Procedures | Maintenance/Procedures/Find (NewProcedure); Maintenance/Procedures/ProcedureDetail (Copy as a new draft; Overview's Edit) |
| work/ProcessServices | move#ProcessStep | Maintenance/Procedures/ProcedureDetail | Maintenance/Procedures/ProcedureDetail/Steps (Up, Down) |
| work/ProcessServices | store#ProcessDependency | Maintenance/Procedures/ProcedureDetail | none yet: Steps' Waits for writes through store#ProcessStep's dependsOnIds |
| work/ProcessServices | store#ProcessRequirements | Maintenance/Procedures/ProcedureDetail | Maintenance/Procedures/ProcedureDetail/Resources (Add requirement, Remove); P8: a skill's least level and the qualification type that proves it (At least, Proved by) |
| work/ProcessServices | store#ProcessInstruction | Maintenance/Procedures/ProcedureDetail | Maintenance/Procedures/ProcedureDetail/Instructions (Edit, Remove) |
| work/ProcessServices | find#ProcessInstructions | Maintenance/WorkOrders/WorkOrderDetail | none directly: the checklist reads an execution step's instruction through MaintenanceProcedures.js executionInstruction (Maintenance P7) |
| work/ProcessServices | request#WorkProcessApproval | Maintenance/Procedures/ProcedureDetail | Maintenance/Procedures/ProcedureDetail (Request approval; Approval) |
| work/ProcessServices | approve#WorkProcess | Maintenance/Procedures/ProcedureDetail; Commons/Notifications | Maintenance/Procedures/ProcedureDetail (Approve; Approval); Commons' approvals inbox (the WorkProcessApproval topic's approve service) |
| work/ProcessServices | refuse#WorkProcess | Maintenance/Procedures/ProcedureDetail; Commons/Notifications | Maintenance/Procedures/ProcedureDetail/Approval (Refuse); Commons' approvals inbox (the topic's refuse service) |
| work/ProcessServices | retire#WorkProcess | Maintenance/Procedures/ProcedureDetail | Maintenance/Procedures/ProcedureDetail (More › Retire; Approval) |
| work/ProcessServices | find#ProcessExecutions | Maintenance/Procedures/ProcedureDetail | Maintenance/Procedures/ProcedureDetail/Usage (ProcessUsage) |
| work/ProcessServices | check#ProcessApplicability | Shared/Product360 | Products' CatalogRecordServices.store#CatalogRow (a maintenance default's work template; Product360's Equipment tab) |

Added in `work/ProcessServices.xml` (impl-maintenance P7; `ProcessChecks.js`, executing a procedure's checklist), called by built
screens through WorkOrderDetail's Procedure tab after `ironstone.maintenance.AccessServices.check#Record` (recordType workOrder):

| File | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| work/ProcessServices | get#ProcessExecution | Maintenance/WorkOrders/WorkOrderDetail (ProcedureSteps) | Maintenance/WorkOrders/WorkOrderDetail/Procedure (the next step, the checklist, Checks, Waivers and amendments) |
| work/ProcessServices | record#ProcessStep | Maintenance/WorkOrders/WorkOrderDetail (ProcedureSteps, StepResponse) | Maintenance/WorkOrders/WorkOrderDetail/Procedure (Start, Respond and Correct: template/MaintenanceChecklistParts.xml StepResponseForm; Skip) |
| work/ProcessServices | transcribe#CheckVoiceNote | Maintenance/WorkOrders/WorkOrderDetail (StepResponse) | Maintenance/WorkOrders/WorkOrderDetail/Procedure (after a response with a voice note, in a transaction of its own; only when the organization's work policy turns transcription on, TRANSCRIPTION_OFF otherwise, P7 review) |
| work/ProcessServices | waive#ProcessStep | Maintenance/WorkOrders/WorkOrderDetail (ProcedureSteps) | Maintenance/WorkOrders/WorkOrderDetail/Procedure (Waive) |
| work/ProcessServices | amend#ProcessExecution | Maintenance/WorkOrders/WorkOrderDetail (ExecutionAmendment) | Maintenance/WorkOrders/WorkOrderDetail/Procedure (Amend: change a step, add a step, or remove a step not started; Preview, then Amend with the reason; add and remove P7 review) |
| work/ProcessServices | get#ProcessChecklist | Maintenance/WorkOrders/WorkOrderDetail (§12 the completed checklist) | Maintenance/WorkOrders/WorkOrderDetail/Procedure (Print checklist); stored at close by transition#MaintenanceWorkOrder |
| work/ProcessServices | get#EvidencePolicy | Shared/RecordFiles (F69) | ironstone.shared.RecordFilesServices.get#ContentType (a managed work effort's files: changed only while the work is open, a check's evidence never removed or replaced) |
| work/ProcessServices | check#EvidenceChange | (the content services) | none: WorkEffortServices.update#WorkEffortContent and save#WorkEffortContentFile refuse a check's evidence and a stored checklist with it (save# P7 review) |

Added in `work/MaintenancePlanServices.xml` (impl-maintenance P13; `MaintenancePlans.js`, design-maintenance §5.1), called by built
screens through the Maintenance screens after `ironstone.maintenance.AccessServices.check#Record` (recordType plan) where a plan is
named:

| File | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| work/MaintenancePlanServices | find#MaintenanceSchedules | Maintenance/Preventive/Plans | Maintenance/Preventive/Plans/Find (PlanRows); Maintenance/Equipment/EquipmentDetail/Maintenance (Preventive plans) |
| work/MaintenancePlanServices | get#MaintenanceSchedule | Maintenance/Preventive/Plans/PlanDetail | Maintenance/Preventive/Plans/PlanDetail (header, findings) and its Schedule tab (ScheduleTerms, the terms' history) |
| work/MaintenancePlanServices | store#MaintenanceSchedule | Maintenance/Preventive/Plans; Maintenance/Preventive/Plans/PlanDetail | Maintenance/Preventive/Plans/Find (NewPlan); PlanDetail (Activate, More › End plan: PlanAction) and its Schedule tab (Edit terms) |
| work/MaintenancePlanServices | get#MaintenanceDue | Maintenance/Preventive/Plans/PlanDetail | Maintenance/Preventive/Plans/PlanDetail/Schedule (DueExplanation, through get#MaintenanceSchedule); the next due of every PlanRows row |
| work/MaintenancePlanServices | find#MaintenanceDue | Maintenance/Preventive/DueMaintenance | Maintenance/Preventive/DueMaintenance (DueRows with the calendar view, GenerateWork's preview: each row's generation outcome; capped at 500 plans, P14) |

Added in `work/MaintenanceServices.xml` (impl-maintenance P10; `MaintenancePurchases.js`), called by built screens through the
Maintenance screens after `ironstone.maintenance.AccessServices.check#Record`, and by Purchasing's RequestDetail:

| File | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| work/MaintenanceServices | link#MaintenancePurchase | Maintenance/WorkOrders/WorkOrderDetail | Maintenance/WorkOrders/WorkOrderDetail/Purchasing (Request a purchase; Link an order line, a buyer's) |
| work/MaintenanceServices | link#SourcedMaintenancePurchase | — | the RequestItemOrder entity ECA MaintenancePurchaseSourced (Purchasing's sourcing of a work's request line) |
| work/MaintenanceServices | get#MaintenancePurchases | Maintenance/WorkOrders/WorkOrderDetail | Maintenance/WorkOrders/WorkOrderDetail/Purchasing (PurchaseLinks) |
| work/MaintenanceServices | accept#MaintenanceService | Maintenance/WorkOrders/WorkOrderDetail | Maintenance/WorkOrders/WorkOrderDetail/Purchasing (Accept outside service); transition#MaintenanceWorkOrder's complete (CompleteWork's outside-service line) |
| work/MaintenanceServices | get#MaintenanceOrder | Maintenance/WorkOrders/OrderDetail | Maintenance/WorkOrders/OrderDetail (Shared/OrderDetail's Maintenance branch, read only) |
| work/MaintenanceServices | get#PurchaseRequestWork | Purchasing/Requests/RequestDetail | Purchasing/Requests/RequestDetail (the originating work order under the header; its name only for a user Maintenance admits) |

Added in `work/MaintenancePlanServices.xml` and `work/MaintenanceReportServices.xml` (impl-maintenance P14; `MaintenancePlans.js`,
design-maintenance §5.1 occurrences, DueMaintenance, §8), with the MaintenanceOccurrence record and the generate_MaintenanceWorkOrders
job (`data/MaintenancePlanSetupData.xml`, paused; its registration, recovery and the MaintenanceDue topic in `data/MaintenancePlanData.xml`):

| File | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| work/MaintenancePlanServices | generate#MaintenanceWorkOrders | Maintenance/Preventive/DueMaintenance; Maintenance/Preventive/Plans/PlanDetail | Maintenance/Preventive/DueMaintenance (GenerateWork, Generate on a row, the selection); PlanDetail (Generate work, its preview in the confirmation); template/MaintenancePlanParts.xml generateDue |
| work/MaintenancePlanServices | run#MaintenanceGeneration | — (the job) | the generate_MaintenanceWorkOrders ServiceJob, Admin's Jobs (its JobRegistration, batchSize) and its recovery (RecoveryDescriptor maintenanceGenerationJob, ownerRoute maintenanceDue; run by the scheduler as the job, with no user); a person who runs it generates in their own scope (P14 review R1) |
| work/MaintenancePlanServices | reconcile#MaintenanceSchedule | Maintenance/Preventive/DueMaintenance; Maintenance/Preventive/Plans/PlanDetail | Maintenance/Preventive/DueMaintenance (ResolveDue: coalesce, skip); PlanDetail/DueHistory (missed due dates: coalesce, skip; Correct a completion); template/MaintenancePlanParts.xml resolveDue |
| work/MaintenancePlanServices | find#MaintenanceOccurrences | Maintenance/Preventive/Plans/PlanDetail | Maintenance/Preventive/Plans/PlanDetail/DueHistory (OccurrenceHistory) and GeneratedWork |
| work/MaintenancePlanServices | get#MaintenanceDueJob | Maintenance/Settings | Maintenance/Settings/WorkPolicy (the preventive generation job's state) |
| work/MaintenanceReportServices | get#MaintenanceCompliance | Maintenance/Reports/PreventiveComplianceReport | Maintenance/Reports/PreventiveComplianceReport (ComplianceOptions, ComplianceSummary, ComplianceRows; P17: its CSV, every row with pageNoLimit); Maintenance/Reports/Overview (the on-time card, P17) |

Added in `work/MaintenanceReportServices.xml` (impl-maintenance P17; `MaintenanceReports.js`, design-maintenance §8 WorkStatusReport), over
execution roots and their status audit; Insights' metric `Maintenance.Backlog` names it:

| File | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| work/MaintenanceReportServices | get#MaintenanceStatusReport | Maintenance/Reports/WorkStatusReport | Maintenance/Reports/WorkStatusReport (StatusOptions, StatusMeasures and StatusTotals, StatusRows with its CSV and Print) |

Added in `work/MaintenanceSettingsServices.xml` and `product/MaintenanceImportServices.xml` (impl-maintenance P18; `MaintenanceSettings.js`,
`MaintenanceImport.js`, design-maintenance §9 and §6 EquipmentImport), called by built screens, by Admin's Health (the readiness
provider `maintenance.readiness`) and by the framework's DataTransferServices (the `equipment` import target's row services):

| File | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| work/MaintenanceSettingsServices | find#MaintenanceLookups | Maintenance/Settings | Maintenance/Settings/Lookups (MaintenanceLookups, FailureModes); the failure mode choice of WorkOrderDetail's Overview (its equipment's, through MaintenanceSettings.js) |
| work/MaintenanceSettingsServices | store#MaintenanceLookup | Maintenance/Settings | Maintenance/Settings/Lookups (Add value, Edit, End, Applies to) |
| work/MaintenanceSettingsServices | check#MaintenanceReadiness | Maintenance/Settings | Maintenance/Settings/Readiness; Admin/Operations/Health and System's Health (the provider maintenance.readiness) |
| product/MaintenanceImportServices | validate#EquipmentImportRow | Maintenance/Equipment/EquipmentImport | Maintenance/Equipment/EquipmentImport (the shared wizard's validate, through DataTransferServices.validate#Import) |
| product/MaintenanceImportServices | apply#EquipmentImportRow | Maintenance/Equipment/EquipmentImport | Maintenance/Equipment/EquipmentImport (apply, through DataTransferServices.apply#Import); Admin/Data/ImportDetail (retry) |
| product/MaintenanceImportServices | find#EquipmentImportScopes | Maintenance/Equipment/EquipmentImport | Maintenance/Equipment/EquipmentImport (the organizations); Admin/Data/Imports (the runs a reader may see) |

Added in `work/MaintenanceReportServices.xml` and extended in `work/MaintenanceSettingsServices.xml` (impl-maintenance P11; `MaintenanceCosts.js`),
called by built screens through the Maintenance screens after `ironstone.maintenance.AccessServices.check#Record` (the cost screens
are the cost reader's, BOSS_MNT_COSTS; the service checks MAINTENANCE_COST_VIEW itself):

| File | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| work/MaintenanceReportServices | get#MaintenanceCosts | Maintenance/WorkOrders/WorkOrderDetail (WorkCosts); Maintenance/Reports/MaintenanceCostReport | Maintenance/WorkOrders/WorkOrderDetail/Costs (cost by currency, estimate, sources); Maintenance/Reports/MaintenanceCostReport (CostOptions, CostTotals, CostSources, Export CSV, Print) |
| work/MaintenanceSettingsServices | store#MaintenancePolicy (its cost threshold) | Maintenance/Settings | Maintenance/Settings/WorkPolicy (Approve planned work estimated up to, Cost threshold currency) |

Added in `work/MaintenanceServices.xml` and `request/WarrantyServices.xml` (impl-maintenance P12; `MaintenanceRepairs.js`, `Warranty.js`):
the customer repair, called by built screens after `ironstone.maintenance.AccessServices.check#Record` (Maintenance) or
`ironstone.customerservice.AccessServices.check#Record` (Customer Service):

| File | Service | Designed in | Implemented in |
| --- | --- | --- | --- |
| work/MaintenanceServices | get#InterventionReport | Maintenance/WorkOrders/WorkOrderDetail | Maintenance/WorkOrders/InterventionReport (the report, Print as html-print, PDF and the stored report) |
| work/MaintenanceServices | store#InterventionReport | Maintenance/WorkOrders/WorkOrderDetail | Maintenance/WorkOrders/InterventionReport (Store for the customer, with the customer's acknowledgment file) |
| request/WarrantyServices | check#WarrantyRepair |  | (internal: Maintenance's Start and parts issue of a customer repair, MaintenanceRepairs.js; WorkOrderDetail's blocker) |
| request/WarrantyServices | send#InterventionReport | CustomerService/Returns/WarrantyAssessment | CustomerService/Returns/WarrantyAssessment (RepairLinks' Send intervention report) |
