# mr-marble form inventory

Per-form inventory of the mr-marble component, for tracking form-level feature parity in IronStone BOSS.

- Source: `runtime/component/mr-marble/screen/` (current working tree).
- Form: every `<form-single>` and `<form-list>` element, including forms nested in dialogs, sections and includes.
- The **Designed in** column is filled when a design file is reviewed with the IronStone screen path(s) whose forms cover it (`—` when deliberately not carried forward, with the reason in that design's Decided table); the **Implemented in** column is filled during implementation with the screen and form that exist. See [design-doc-guide.md](design-doc-guide.md) §9.
- **Implemented in** was filled on Oct 19, 2026 from the drawers-commons build, by the path of the built screen that carries each form of its **Designed in** cell: a designed screen built as a parent with subscreens is its default subscreen (`Commons/Tasks/List`, `Commons/Requests/List`, `Commons/Contacts/List`, `Comms/Inbox/Mail`); the contact record (`template/ContactRecord.xml`) is on both `Commons/Contacts/ContactDetail` and the main pane of `Commons/Contacts/List`; a space's settings are on `Commons/Knowledge/SpaceDetail`, and a page's attachments are Knowledge's own, not record files; a `—` row stays `—`. Filled: the 101 rows designed with a path (wiki `ClonePage` since Oct 19, Knowledge's Duplicate page), and the 5 `—` rows. The update note and comment forms the design gives to `Shared/Chatter` (`UpdateNoteForm`, the `…CommentUpdate` `ReplyCommentForm`) are Chatter's edit of a note in place (since Oct 19). Rows that other design files are to fill stay blank.
- **Designed in** for [design-projects.md](design-projects.md) was filled on Oct 21, 2026 from that design's §13.1 and the **Derived from** cells of its form summaries, each screen by the path the design gives it: a project's tab is a subscreen of `Projects/Projects/ProjectDetail`, and a screen the design mounts in a tab with the project fixed (WorkItems, Requests, TimeEntries) is listed by its own path. Paths are added after what an earlier design wrote. The rows of the git forms added to SimpleScreens on Oct 20 came with it: `Project/EditRepositories`, `ProjectSummary`'s `ViewGitRepositoryList` and `ViewGitTagList`, `Task/EditSource` and `MyAccount/User/GitAccess` (`Project/GitCommit` has no forms); their **Implemented in** is blank. The My Account expense forms other than the worker invoice stay blank for design-people.
- **Implemented in** for [design-projects.md](design-projects.md) was filled on Oct 22, 2026 at the end of the Projects build (impl-projects.md P11), by the path of the built screen that carries each form of its Projects **Designed in** paths, after what Commons wrote: a section designed as one screen is its default subscreen (`Projects/Projects/List`, `Projects/WorkItems/List`, `Projects/Requests/List`), the project form of QuickCreate is `Projects/QuickProject` (impl-projects.md F8), a tab mounted from another screen keeps the tab's path (`Projects/Projects/ProjectDetail/Time`, `…/Docs`), and the shared screens keep their Projects mount (`Projects/WorkItems/WorkItemDetail`, `Projects/Requests/RequestDetail`). Twelve rows stay blank for the parts impl-projects.md §7 leaves for later: the worker and contractor invoices (My Account's `WorkerInvoice` and Unbilled's worker forms), a manager's clock-in for another person (`PartyTimeEntries` `ClockInForm`), request items (`EditRequestItems`), and wiki pages linked to a work item or a request (`EditWikiPages` on WorkItemDetail and RequestDetail; the Docs tab links pages to a project).
- **Designed in** for the six core app drafts and [design-crosscut.md](design-crosscut.md) was extended on Oct 27, 2026 from their form/service coverage review. New mappings are additive to Commons and Projects; **Implemented in** is unchanged. Proposed services and definitions inside XML comments are not counted as active existing services.
- **Designed in** for the six core designs and [design-crosscut.md](design-crosscut.md) was updated on Oct 28, 2026 after their review ([review-core-apps.md](review-core-apps.md)). Paths of renamed or moved screens are replaced in place (for example `Manufacturing/Boms/BomDetail` → `Manufacturing/BillsOfMaterials/BillOfMaterialsDetail`, `CustomerService/Reports/CsatResults` → `CustomerService/Reports/SatisfactionResults`, `Accounting/GeneralLedger/GlAccountDetail` → `Accounting/GeneralLedger/AccountDetail`, `Accounting/FixedAssets/InventoryValuation` → `Accounting/Inventory/InventoryValuation`). Entries were added where the reviewed designs now carry a form (the Products stock tab, the Accounting cost repair dialogs, BankAccountDetail reconciliation, the Manufacturing notes tab, the handheld pick face). Facility box-type assignment is FacilityDetail only (R-WH-16). The ProductStore and Gateway forms stay blank; Products and Accounting Decided name the apps they are handed to. **Implemented in** is unchanged.

- **PASS design follow-up (Oct 27, 2026):** [design-forum.md](../../mr-pass/plan/design-forum.md) designs new public Forum screens over existing Mailbox services; there are no SimpleScreens Forum forms to map. WikiBlogs/EditWikiBlog remain future Blog/Publishing baselines, with full screen design deferred. Their Designed in and Implemented in cells remain unchanged; shared content ownership is described in Forum §13.3.
- **Implemented in** for [design-accounting.md](design-accounting.md) was filled on Oct 31, 2026 at the end of the Accounting build (impl-accounting.md P21), by the path of the built screen (and form or section) that carries each form of its Accounting **Designed in** paths, after what the earlier Accounting phases wrote; a shared screen goes by its Accounting mount (`Accounting/Receivables/Customer360`, `Accounting/Records/OrderDetail`, `Accounting/Payables/BillDetail/Match`). A form done another way names the screen that does it; a function left for later is `—` with its impl-accounting.md §7 item, and one not built is `—` with what the screen does instead. Party forms designed for Customer360 are other apps' contexts there (§7). Rows that name other apps keep their other paths blank, and rows designed only for the shared Order, Shipment, Return, Equipment and Product screens by other apps stay blank.
- **Implemented in** for [design-warehouse.md](design-warehouse.md) was filled on Oct 31, 2026 at the end of the Warehouse build (impl-warehouse.md P18), by the path of the built screen (and form or section) that carries each form of its Warehouse **Designed in** paths, after what the earlier Warehouse phases wrote; a shared screen goes by its Warehouse mount (`Warehouse/Receiving/ReceiptDetail` and `Warehouse/Shipping/ShipmentDetail` for `Shared/ShipmentDetail`, `Warehouse/Returns/ReturnDetail`, `Warehouse/Inventory/Availability/Summary`, `Warehouse/Inventory/MaterialIssueReceipt`), and a handheld task by its `Warehouse/Handheld/...` mount (the desk screen mounted again, the active facility being Handheld Home's FacilityPicker). A form done another way names the screen that does it; a function left for later is `—` with its impl-warehouse.md §7 item, and one not built is `—` with what the screen does instead (the shipment header, party, payment and email forms; return header and item edits, P14). 36 rows filled here; rows that name other apps keep their other paths as they were.
- **Implemented in** for [design-manufacturing.md](design-manufacturing.md) was filled phase by phase during the Manufacturing build and checked on Nov 4, 2026 at its end (impl-manufacturing.md P17): every one of the 23 Manufacturing forms, and each other section's form with a Manufacturing **Designed in** path, names the Manufacturing screen (and form or section) that carries it.

Products P1 (Oct 28): the shell, guarded read list and minimal product/category record routes are built. Catalog
form-parity cells remain blank until their full P2/P3 editors are implemented; these foundation screens do not claim
that parity.

Accounting P4 mappings name only built receivables forms. Payable, settlement, source-allocation and budget editors remain for their assigned phases; a read-only source tab does not claim their write forms.

**People design (Oct 31, 2026):** [design-people §14.2](design-people.md#142-baseline-forms-and-service-coverage) adds employee/lifecycle, organization, pay-rate, shared work-time and expense mappings to Designed in. Attendance and the new payroll core are proposed workflows, not implementation coverage. Existing mappings and Implemented in remain unchanged; account administration and worker-invoice forms stay with their owners.

**Maintenance design (Oct 31, 2026):** [design-maintenance](design-maintenance.md) maps the verified baseline forms and current services used by its own screens and contextual mounts. Procedures/checklists are core WorkEffort templates and independent executions. Mappings are additive; **Implemented in** is unchanged. Proposed services and helpers named only for internal implementation or limitation analysis are not active service-inventory claims.

**Commerce and Shop design (Oct 31, 2026):** [Commerce](design-commerce.md) maps all 34 ProductStore forms, including the one shared store-promotion/code definition, and adds its consumed catalog/content/price mounts. [Shop](../../mr-pass/plan/design-shop.md) defines new public screens; those are not parity claims over staff forms. Existing Designed in mappings and every Implemented in cell are preserved. Gateway definitions retain their domain owners; Commerce maps their store bindings only.

**Sales design (Oct 31, 2026):** [Sales](design-sales.md) adds account/contact, RFQ, quote/order,
agreement, pricing and report destinations to Designed in. Shared contexts retain their domain
permissions; public Sales pages are new surfaces, not staff-form parity claims. Previous mappings
and every Implemented in cell are unchanged. Party security, supplier/payable and return execution
remain with their existing owners; see Sales §14.2.

**Marketing design (Oct 31, 2026):** [Marketing §16.2](design-marketing.md#162-baseline-forms-and-service-coverage)
adds the shared store-promotion/code, survey, event, contact and wiki-body mounts to Designed in.
Campaign execution, automation and registration are new workflows, not baseline implementation.
WikiBlogs/EditWikiBlog full article/editorial forms remain future Publishing work. All earlier
mappings and Implemented in cells are preserved.

**Admin and Insights designs (Oct 31, 2026):** [Admin](design-admin.md) adds account/access,
internal-organization and infrastructure configuration destinations. [Insights](design-insights.md)
maps SimpleReport and scheduled-find forms to the approved dataset/report and recipient-delivery
surfaces. Existing Designed in mappings are retained and every Implemented in cell is unchanged.
Framework Tools screens are referenced in the designs; this remains the mr-marble form inventory.

**Design review fixes (Nov 1, 2026):** after [review-suite-apps.md](review-suite-apps.md),
Marketing designs blog posts itself, so the WikiBlogs forms map to `Marketing/Content/BlogPosts`
and the EditWikiBlog forms to its BlogPostDetail, whose body also derives from EditWikiPage
EditPageForm (this replaces the earlier notes that left them for future Publishing). The customer
pages are the PASS app Support, so `ServicePortal/*` paths are now `PASS:Support/*`. Maintenance
adds its WorkOrderDetail assignments, Facilities tree and DueMaintenance reading to the forms they
derive from. The People, Maintenance, Admin and Insights screen renames had no paths here; the
Marble dashboard has no form row (Insights maps it to `Insights/Flows/FlowMap`). **Implemented in**
is unchanged.

## MyAccount (49 forms)

| Screen XML | Form | Designed in | Implemented in |
| --- | --- | --- | --- |
| EditExpenseInvoice | WorkerInvoice | Projects/Time/MyTime |  |
| EditExpenseInvoice | EditInvoice | People/Expenses/ExpenseClaimDetail |  |
| EditExpenseInvoiceItems | CreateInvoiceItem | People/Expenses/ExpenseClaimDetail |  |
| EditExpenseInvoiceItems | EditInvoiceItems | People/Expenses/ExpenseClaimDetail |  |
| FindExpenseInvoice | CreateInvoice | People/Expenses/ExpenseClaims |  |
| FindExpenseInvoice | WorkerInvoice | Projects/Time/MyTime |  |
| FindExpenseInvoice | InvoiceList | People/Expenses/ExpenseClaims |  |
| Account | ChangePasswordForm | Commons/Settings/Account | Commons/Settings/Account |
| Account | SecondFactorSendForm | Commons/Settings/Account | Commons/Settings/Account |
| Account | EditUser | Commons/Settings/Account | Commons/Settings/Account |
| Account | CreateUserAuthcFactorTotp | Commons/Settings/Account | Commons/Settings/Account |
| Account | CreateUserAuthcFactorSingleUse | Commons/Settings/Account | Commons/Settings/Account |
| Account | CreateUserAuthcFactorEmail | Commons/Settings/Account | Commons/Settings/Account |
| Account | CreateUserAuthcFactorSms | Commons/Settings/Account | Commons/Settings/Account |
| Account | UserAuthcFactorList | Commons/Settings/Account | Commons/Settings/Account |
| EventDetail | UpdateEvent | Commons/Calendar/EventDetail; Marketing/Events/EventDetail | Commons/Calendar/EventDetail |
| EventDetail | NewNoteForm | Commons/Calendar/EventDetail; Shared/Chatter; Marketing/Events/EventDetail | Commons/Calendar/EventDetail; Shared/Chatter |
| EventDetail | UpdateNoteForm | Commons/Calendar/EventDetail; Shared/Chatter; Marketing/Events/EventDetail | Commons/Calendar/EventDetail; Shared/Chatter |
| EventDetail | AddPartyAssignForm | Commons/Calendar/EventDetail; Marketing/Events/EventDetail | Commons/Calendar/EventDetail |
| EventDetail | UpdateAssignForm | Commons/Calendar/EventDetail; Marketing/Events/EventDetail | Commons/Calendar/EventDetail |
| EventDetail | AddEquipment | Commons/Calendar/EventDetail; Marketing/Events/EventDetail | Commons/Calendar/EventDetail |
| EventDetail | EquipmentList | Commons/Calendar/EventDetail; Marketing/Events/EventDetail | Commons/Calendar/EventDetail |
| MyCalendar | NewEventForm | Commons/Calendar; Commons/QuickCreate; Marketing/Calendar; Marketing/Events; Marketing/QuickCreate | Commons/Calendar; Commons/QuickCreate |
| UpdateContactInfo | ShippingInfo | Commons/Settings/Account | Commons/Settings/Account |
| GitAccess | CreateAccessTokenForm | Projects/Code/GitAccess | Projects/Code/GitAccess |
| GitAccess | AccessTokenList | Projects/Code/GitAccess | Projects/Code/GitAccess |
| GitAccess | AddSshKeyForm | Projects/Code/GitAccess | Projects/Code/GitAccess |
| GitAccess | SshKeyList | Projects/Code/GitAccess | Projects/Code/GitAccess |
| EditMessage | ReplyMessageForm | Comms/Inbox/Compose | Comms/Inbox/Compose |
| EditMessage | MessageForm | Comms/Inbox/Compose | Comms/Inbox/Compose |
| EditMessage | AddPurposeForm | — | — |
| EditMessage | PurposesForm | — | — |
| FindMessage | CreateMessage | Comms/Inbox/Compose | Comms/Inbox/Compose |
| FindMessage | MessageList | Comms/Inbox | Comms/Inbox/Mail |
| SingleMessage | ReplyMessageForm | Comms/Inbox/Compose; Shared/Chatter | Comms/Inbox/Compose; Shared/Chatter |
| Notifications | NotificationTopicList | Commons/Settings/Notifications | Commons/Settings/Notifications |
| Notifications | NotificationList | Commons/Notifications; Commons/Panel/Notifications | Commons/Notifications; Commons/Panel/Notifications |
| EditRequest | EditRequest | Commons/Requests/RequestDetail; Projects/Requests/RequestDetail; PASS:Support/CustomerCase | Commons/Requests/RequestDetail; Projects/Requests/RequestDetail |
| EditRequest | UpdatePartyForm | Commons/Requests/RequestDetail; Projects/Requests/RequestDetail; PASS:Support/CustomerCase | Commons/Requests/RequestDetail; Projects/Requests/RequestDetail |
| RequestCommentReply | ReplyCommentForm | Commons/Requests/RequestDetail; Shared/Chatter; PASS:Support/CustomerCase | Commons/Requests/RequestDetail; Shared/Chatter |
| RequestCommentUpdate | ReplyCommentForm | Commons/Requests/RequestDetail; Shared/Chatter; PASS:Support/CustomerCase | Commons/Requests/RequestDetail; Shared/Chatter |
| MyRequests | NewRequestForm | Commons/Requests; Commons/QuickCreate; PASS:Support/NewCustomerCase | Commons/Requests/List; Commons/QuickCreate |
| MyRequests | ListRequests | Commons/Home; Commons/Requests; PASS:Support/MyCases | Commons/Home; Commons/Requests/List |
| ScheduledFinds | ScreenScheduledList | Insights/ScheduledReports |  |
| EditScheduledFind | EditScreenScheduled | Insights/ScheduledReports/ScheduledReportDetail |  |
| MyTasks | NewTaskForm | Commons/Tasks; Commons/QuickCreate | Commons/Tasks/List; Commons/QuickCreate |
| MyTasks | MyTasks | Commons/Panel/Today; Commons/Home; Commons/Tasks; Projects/Home | Commons/Panel/Today; Commons/Home; Commons/Tasks/List; Projects/Home |
| TaskDetail | UpdateEvent | Commons/Tasks/TaskDetail | Commons/Tasks/TaskDetail |
| TimeEntries | TimeEntryList | Commons/Tasks/TaskDetail; Projects/WorkItems/WorkItemDetail; Projects/Time/MyTime; Projects/Time/TimeEntries; People/Time/MyTime; People/Time/TimeEntries | Commons/Tasks/TaskDetail; Projects/WorkItems/WorkItemDetail; Projects/Time/MyTime; Projects/Time/TimeEntries |

## Accounting (166 forms)

| Screen XML | Form | Designed in | Implemented in |
| --- | --- | --- | --- |
| BudgetAccountsEntry | GlAccountBudgetList | Accounting/Budgets/BudgetDetail | Accounting/Budgets/BudgetDetail#BudgetAccounts and AccountAmounts (by period, as of a revision) |
| BudgetReport | GlAccountBudgetList | Accounting/Reports/BudgetVariance | Accounting/Reports/BudgetVariance#VarianceRows (with committed, net actual) |
| EditBudget | UpdateBudgetForm | Accounting/Budgets/BudgetDetail | Accounting/Budgets/BudgetDetail (header, state actions, AddPartyForm) |
| EditBudgetItems | AddItemForm | Accounting/Budgets/BudgetDetail | Accounting/Budgets/BudgetDetail#AddAccountForm |
| EditBudgetItems | BudgetItemList | Accounting/Budgets/BudgetDetail | Accounting/Budgets/BudgetDetail#BudgetAccounts (account totals; item details by asset or facility are §7) |
| FindBudget | NewBudgetForm | Accounting/Budgets/Budgets | Accounting/Budgets/Budgets#NewBudget |
| FindBudget | BudgetList | Accounting/Budgets/Budgets | Accounting/Budgets/Budgets#BudgetList |
| EditFinancialAccount | StatementForm | Accounting/Banking/FinancialAccountDetail | Accounting/Banking/FinancialAccountDetail (Print: the account and its movements in html-print, P21; a dated statement by month is §7) |
| EditFinancialAccount | UpdateFinancialAccountForm | Accounting/Banking/FinancialAccountDetail | — (not built; FinancialAccountDetail edits no account header) |
| FinancialAccountTrans | AdjustFinancialAccount | Accounting/Banking/FinancialAccountDetail | Accounting/Banking/FinancialAccountDetail#DepositValue, WithdrawValue and AdjustValue |
| FinancialAccountTrans | TransactionList | Accounting/Banking/FinancialAccountDetail | Accounting/Banking/FinancialAccountDetail#FinancialTransactions |
| FindFinancialAccount | NewFinancialAccountForm | Accounting/Banking/FinancialAccounts | Accounting/Banking/FinancialAccounts#NewFinancialAccount |
| FindFinancialAccount | FinancialAccountList | Accounting/Banking/FinancialAccounts | Accounting/Banking/FinancialAccounts#FinancialAccounts |
| FindJournal | CreateGlJournal | Accounting/GeneralLedger/JournalBatches | Accounting/GeneralLedger/JournalBatches#NewBatch |
| FindJournal | TransactionList | Accounting/GeneralLedger/JournalBatches | Accounting/GeneralLedger/JournalBatches#Records |
| EditGlAccount | EditGlAccountForm | Accounting/GeneralLedger/AccountDetail | Accounting/GeneralLedger/AccountDetail#AccountHeader |
| EditGlAccount | NewGlAccountOrgForm | Accounting/GeneralLedger/AccountDetail | Accounting/GeneralLedger/AccountDetail#RequiredDimensions; Accounting/GeneralLedger/ChartOfAccounts#AssignExistingAccount |
| EditGlAccount | GlAccountOrgList | Accounting/GeneralLedger/AccountDetail | Accounting/GeneralLedger/AccountDetail#RequiredDimensions |
| FindGlAccount | NewGlAccountForm | Accounting/GeneralLedger/ChartOfAccounts | Accounting/GeneralLedger/ChartOfAccounts#NewAccount |
| FindGlAccount | GlAccountListForm | Accounting/GeneralLedger/ChartOfAccounts | Accounting/GeneralLedger/ChartOfAccounts#Records |
| Aging | ReportOptions | Accounting/Reports/Aging | Accounting/Reports/Aging#AgingOptions |
| Aging | InvoiceAgingList | Accounting/Reports/Aging | Accounting/Reports/Aging#AgingRows |
| EditInvoice | AdjustInvoice | Accounting/Receivables/InvoiceDetail; Accounting/Payables/BillDetail; Shared/InvoiceDetail | Accounting/Receivables/InvoiceDetail#FinanceCreditMemo (a finalized invoice is corrected by a credit memo, not adjusted) |
| EditInvoice | OutSystemMessageList | Purchasing/Bills/InvoiceDetail; Accounting/Receivables/InvoiceDetail; Accounting/Payables/BillDetail; Shared/InvoiceDetail | — (later: ElectronicInvoices, §7); — Purchasing: Accounting's (Purchasing P6) |
| EditInvoice | AuditLogList | Purchasing/Bills/InvoiceDetail; Accounting/Receivables/InvoiceDetail; Accounting/Payables/BillDetail; Shared/InvoiceDetail | Accounting/Receivables/InvoiceDetail/History#FinanceInvoiceHistory; Accounting/Payables/BillDetail/History; — Purchasing: the bill's history is Accounting's BillDetail (Purchasing P6) |
| EditInvoice | EditInvoice | Purchasing/Bills/InvoiceDetail; Accounting/Receivables/InvoiceDetail; Accounting/Payables/BillDetail; Shared/InvoiceDetail | Accounting/Receivables/InvoiceDetail#FinanceInvoiceHeader; Accounting/Payables/BillDetail#BillHeader; Purchasing/Bills/InvoiceDetail (Shared/InvoiceDetail: the bill header and PurchasingBillDetails, read only) (Purchasing P6) |
| EditInvoice | NewContentForm | Purchasing/Bills/InvoiceDetail; Accounting/Receivables/InvoiceDetail; Accounting/Payables/BillDetail; Shared/InvoiceDetail | Accounting/Receivables/InvoiceDetail/Files#AccountingInvoiceFiles (shared record files); Accounting/Payables/BillDetail/Files; Purchasing/Bills/BillList (UploadSupplierBill: the bill's file through import#Bill); Purchasing/Bills/InvoiceDetail (PurchasingBillDocuments, read) (Purchasing P6) |
| EditInvoice | UpdateContentForm | Purchasing/Bills/InvoiceDetail; Accounting/Receivables/InvoiceDetail; Accounting/Payables/BillDetail; Shared/InvoiceDetail | Accounting/Receivables/InvoiceDetail/Files#AccountingInvoiceFiles (shared record files); Accounting/Payables/BillDetail/Files; — Purchasing reads the documents (PurchasingBillDocuments); AP changes them in BillDetail (Purchasing P6) |
| EditInvoice | SendPastDueEmailForm | Accounting/Receivables/InvoiceDetail; Accounting/Receivables/Dunning; Shared/InvoiceDetail | Accounting/Receivables/Dunning#SendDunningForm |
| EditInvoice | SendFinalizedEmailForm | Accounting/Receivables/InvoiceDetail; Accounting/Payables/BillDetail; Shared/InvoiceDetail | Accounting/Receivables/InvoiceDetail#FinanceSendInvoice |
| EditInvoice | EmailMessageList | Purchasing/Bills/InvoiceDetail; Accounting/Receivables/InvoiceDetail; Accounting/Payables/BillDetail; Shared/InvoiceDetail | Accounting/Receivables/InvoiceDetail/Overview#InvoiceDeliveries; — Purchasing: Accounting's (Purchasing P6) |
| EditInvoice | NewCreditMemoForm | Accounting/Receivables/InvoiceDetail; Accounting/Payables/BillDetail; Shared/InvoiceDetail | Accounting/Receivables/InvoiceDetail#FinanceCreditMemo |
| EditInvoice | RecordPaymentForm | Accounting/Receivables/InvoiceDetail; Accounting/Payables/BillDetail; Shared/InvoiceDetail | Accounting/Payments/Payments#PaymentDraft, then Accounting/Receivables/ReceivablesWorkbench or Accounting/Payables/PayablesWorkbench (recorded, then settled) |
| EditInvoice | PaymentApplicationList | Purchasing/Bills/InvoiceDetail; Accounting/Receivables/InvoiceDetail; Accounting/Payables/BillDetail; Shared/InvoiceDetail | Accounting/Receivables/InvoiceDetail/Payments#FinanceInvoicePayments; Accounting/Payables/BillDetail/Payments; Purchasing/Bills/InvoiceDetail (PurchasingBillPayments, a finance reader's; withheld otherwise) (Purchasing P6) |
| EditInvoice | OrderPromisedPaymentList | Purchasing/Bills/InvoiceDetail; Accounting/Receivables/InvoiceDetail; Accounting/Payables/BillDetail; Shared/InvoiceDetail | Accounting/Records/OrderDetail#AccountingOrderPayments (from InvoiceDetail/Orders; no send and apply); Purchasing/Orders/OrderDetail (PurchaseOrderPayments, the order's payments for a finance reader) (Purchasing P6) |
| EditInvoice | UnappliedPaymentList | Accounting/Receivables/InvoiceDetail; Accounting/Payables/BillDetail; Shared/InvoiceDetail | Accounting/Receivables/ReceivablesWorkbench#SettlementOpenItems; Accounting/Payables/PayablesWorkbench#SettlementOpenItems |
| EditInvoice | UnpaidInvoiceList | Accounting/Receivables/InvoiceDetail; Accounting/Payables/BillDetail; Shared/InvoiceDetail | Accounting/Receivables/InvoiceDetail/Payments#FinanceApplyCredit; Accounting/Receivables/ReceivablesWorkbench#SettlementOpenItems; Accounting/Payables/PayablesWorkbench#SettlementOpenItems |
| EditInvoice | InvoiceTxList | Purchasing/Bills/InvoiceDetail; Accounting/Receivables/InvoiceDetail; Accounting/Payables/BillDetail; Shared/InvoiceDetail | Accounting/Receivables/InvoiceDetail/GeneralLedger#FinanceInvoiceLedger; Accounting/Payables/BillDetail/GeneralLedger; — Purchasing: the ledger is finance's, in BillDetail (Purchasing P6) |
| EditInvoice | InvoiceGlaList | Purchasing/Bills/InvoiceDetail; Accounting/Receivables/InvoiceDetail; Accounting/Payables/BillDetail; Shared/InvoiceDetail | Accounting/Receivables/InvoiceDetail/GeneralLedger#FinanceInvoiceLedger (transactions; no per-account summary); Accounting/Payables/BillDetail/GeneralLedger; — Purchasing: the ledger is finance's, in BillDetail (Purchasing P6) |
| EditInvoiceItemDetails | AddDetailForm | Purchasing/Bills/InvoiceDetail; Accounting/Receivables/InvoiceDetail; Accounting/Payables/BillDetail; Shared/InvoiceDetail | — (not built; invoice item details by asset or facility); — Purchasing: not built (Purchasing P6) |
| EditInvoiceItemDetails | AssetItemDetailList | Purchasing/Bills/InvoiceDetail; Accounting/Receivables/InvoiceDetail; Accounting/Payables/BillDetail; Shared/InvoiceDetail | — (not built; invoice item details by asset or facility); — Purchasing: not built (Purchasing P6) |
| EditInvoiceItemDetails | FacilityItemDetailList | Purchasing/Bills/InvoiceDetail; Accounting/Receivables/InvoiceDetail; Accounting/Payables/BillDetail; Shared/InvoiceDetail | — (not built; invoice item details by asset or facility); — Purchasing: not built (Purchasing P6) |
| EditInvoiceItemDetails | ItemDetailList | Purchasing/Bills/InvoiceDetail; Accounting/Receivables/InvoiceDetail; Accounting/Payables/BillDetail; Shared/InvoiceDetail | — (not built; invoice item details by asset or facility); — Purchasing: not built (Purchasing P6) |
| EditInvoiceItemOrders | ApplyToOrder | Purchasing/Bills/InvoiceMatch; Accounting/Receivables/InvoiceDetail; Accounting/Payables/BillDetail; Shared/InvoiceDetail | Accounting/Payables/BillDetail/Match#MatchSources; Purchasing/Bills/InvoiceMatch (Shared/InvoiceMatch MatchSources, apply#InvoiceMatch for the match group) (Purchasing P6) |
| EditInvoiceItemOrders | ApplyItemToOrder | Purchasing/Bills/InvoiceMatch; Accounting/Receivables/InvoiceDetail; Accounting/Payables/BillDetail; Shared/InvoiceDetail | Accounting/Payables/BillDetail/Match#MatchSources; Purchasing/Bills/InvoiceMatch (Shared/InvoiceMatch MatchSources, apply#InvoiceMatch for the match group) (Purchasing P6) |
| EditInvoiceItemOrders | ItemBillingList | Purchasing/Bills/InvoiceMatch; Accounting/Receivables/InvoiceDetail; Accounting/Payables/BillDetail; Shared/InvoiceDetail | Accounting/Receivables/InvoiceDetail/Orders#FinanceInvoiceOrders; Accounting/Payables/BillDetail/Orders; Purchasing/Bills/InvoiceDetail (PurchasingBillSources); Purchasing/Bills/InvoiceMatch (Shared/InvoiceMatch) (Purchasing P6) |
| EditInvoiceItemShipments | ApplyToShipment | Purchasing/Bills/InvoiceMatch; Accounting/Receivables/InvoiceDetail; Accounting/Payables/BillDetail; Shared/InvoiceDetail | — (not built; a bill match links receipts, not shipment item sources: the Accounting P7 note); — Purchasing: a match links receipts (Purchasing/Bills/InvoiceMatch) (Purchasing P6) |
| EditInvoiceItemShipments | ApplyItemToShipment | Purchasing/Bills/InvoiceMatch; Accounting/Receivables/InvoiceDetail; Accounting/Payables/BillDetail; Shared/InvoiceDetail | — (not built; a bill match links receipts, not shipment item sources: the Accounting P7 note); — Purchasing: a match links receipts (Purchasing/Bills/InvoiceMatch) (Purchasing P6) |
| EditInvoiceItemShipments | ItemSourceList | Purchasing/Bills/InvoiceMatch; Accounting/Receivables/InvoiceDetail; Accounting/Payables/BillDetail; Shared/InvoiceDetail | Accounting/Receivables/InvoiceDetail/Shipments#FinanceInvoiceShipments; Accounting/Payables/BillDetail/Shipments; Purchasing/Bills/InvoiceDetail (PurchasingBillSources, the receipts) (Purchasing P6) |
| EditInvoiceItems | CreateInvoiceItem | Purchasing/Bills/InvoiceDetail; Accounting/Receivables/InvoiceDetail; Accounting/Payables/BillDetail; Shared/InvoiceDetail | Accounting/Receivables/InvoiceDetail/Items#FinanceAddInvoiceItem; Accounting/Payables/BillDetail/Items; — Purchasing: AP keys the lines in BillDetail (Purchasing P6) |
| EditInvoiceItems | EditInvoiceItems | Purchasing/Bills/InvoiceDetail; Accounting/Receivables/InvoiceDetail; Accounting/Payables/BillDetail; Shared/InvoiceDetail | Accounting/Receivables/InvoiceDetail/Items#FinanceInvoiceItems; FinanceEditInvoiceItem; Accounting/Payables/BillDetail/Items; Purchasing/Bills/InvoiceDetail (PurchasingBillLines, read) (Purchasing P6) |
| FindInvoice | NewPayableForm | Accounting/Payables/Bills | Accounting/QuickCreate/NewBill#CreateDraft (draft only) |
| FindInvoice | NewReceivableForm | Accounting/Receivables/Invoices | Accounting/Receivables/Invoices#CreateReceivable; Accounting/QuickCreate/NewInvoice#CreateDraft (draft only) |
| FindInvoice | NewCustCreditForm | Accounting/Receivables/Invoices | Accounting/Receivables/Invoices#CreateReceivable (credit memo type) |
| FindInvoice | NewSupCreditForm | Accounting/Payables/Bills | — (not built; Bills takes supplier bills, not supplier credits) |
| FindInvoice | ProjectInvoice | Projects/Billing/Unbilled; Accounting/Receivables/BillingQueue | Projects/Billing/Unbilled; Accounting/Receivables/BillingQueue#CreateApprovedTimeInvoice (receivable) |
| FindInvoice | ProjectWorkerInvoice | Projects/Billing/Unbilled; Accounting/Receivables/BillingQueue | Accounting/Receivables/BillingQueue#CreateApprovedTimeInvoice (payable) |
| FindInvoice | WorkerInvoice | Projects/Billing/Unbilled; Accounting/Receivables/BillingQueue | Accounting/Receivables/BillingQueue#CreateApprovedTimeInvoice (payable) |
| FindInvoice | CustomerStatementForm | Accounting/Receivables/Statements | Accounting/Receivables/Statements#StatementOptions; StatementInvoices; StatementDelivery |
| FindInvoice | MainOptions | Accounting/Receivables/Invoices; Accounting/Payables/Bills | Accounting/Receivables/Invoices#InvoiceQueues and InvoiceList (header find); Accounting/Payables/Bills#BillQueues and BillList (header find) |
| FindInvoice | InvoiceList | Purchasing/Bills; Accounting/Receivables/Invoices; Accounting/Payables/Bills | Accounting/Receivables/Invoices#InvoiceList; Accounting/Payables/Bills#BillList; Purchasing/Bills/BillList (SupplierBillList, views and saved finds); Purchasing/Bills/MatchExceptions (MatchExceptionBills) (Purchasing P6) |
| FindInvoice | AgingSummaryList | Accounting/Receivables/Invoices; Accounting/Payables/Bills | Accounting/Receivables/Invoices#InvoiceSummaryView (open receivables by customer); Accounting/Reports/Aging#AgingRows |
| AcctgPreference | EditPapForm | Accounting/Settings/AccountingPreferences | Accounting/Settings/AccountingPreferences#Preferences |
| AcctgPreference | CloneAcctgSettingsForm | Accounting/Settings/AccountingPreferences | Accounting/Settings/AccountingPreferences#ClonePreferences |
| AssetTypes | AddConfigForm | Accounting/Settings/PostingDefaults | Accounting/Settings/PostingDefaults#PostingMapping (Assets kind) |
| AssetTypes | AllConfigList | Accounting/Settings/PostingDefaults | Accounting/Settings/PostingDefaults#PostingMappings (Assets kind) |
| FinAcctReasons | AllTypesList | Accounting/Settings/PostingDefaults | Accounting/Settings/PostingDefaults#PostingMappings (Financial account reasons kind) |
| FinAcctTypes | AllTypesList | Accounting/Settings/PostingDefaults | Accounting/Settings/PostingDefaults#PostingMappings (Financial account types kind) |
| GlAccounts | NewGlAccountOrgForm | Accounting/Settings/PostingDefaults | Accounting/GeneralLedger/ChartOfAccounts#AssignExistingAccount |
| GlAccounts | GlAccountOrgList | Accounting/Settings/PostingDefaults | Accounting/Settings/PostingDefaults#PostingMappings |
| InvoiceTypes | AddConfigForm | Accounting/Settings/PostingDefaults | Accounting/Settings/PostingDefaults#PostingMapping (Invoice types kind) |
| InvoiceTypes | MissingConfigForm | Accounting/Settings/PostingDefaults | Accounting/Settings/PostingDefaults#MissingMappings |
| InvoiceTypes | AllConfigList | Accounting/Settings/PostingDefaults | Accounting/Settings/PostingDefaults#PostingMappings (Invoice types kind) |
| ItemTypes | AddConfigForm | Accounting/Settings/PostingDefaults | Accounting/Settings/PostingDefaults#PostingMapping (Invoice item types kind) |
| ItemTypes | MissingConfigForm | Accounting/Settings/PostingDefaults | Accounting/Settings/PostingDefaults#MissingMappings |
| ItemTypes | AllConfigList | Accounting/Settings/PostingDefaults | Accounting/Settings/PostingDefaults#PostingMappings (Invoice item types kind) |
| PaymentInstruments | AllEnumList | Accounting/Settings/PostingDefaults | Accounting/Settings/PostingDefaults#PostingMappings (Payment instruments kind) |
| PaymentTypes | AddConfigForm | Accounting/Settings/PostingDefaults | Accounting/Settings/PostingDefaults#PostingMapping (Payment types kind) |
| PaymentTypes | MissingConfigForm | Accounting/Settings/PostingDefaults | Accounting/Settings/PostingDefaults#MissingMappings |
| PaymentTypes | AllConfigList | Accounting/Settings/PostingDefaults | Accounting/Settings/PostingDefaults#PostingMappings (Payment types kind) |
| TypeDefaults | AllEnumList | Accounting/Settings/PostingDefaults | Accounting/Settings/PostingDefaults#PostingMappings (Account types kind) |
| BulkPaymentCheck | PaymentList | Accounting/Payables/PaymentRunDetail | Accounting/Payables/PaymentRunDetail |
| BulkPaymentCheck | PaymentListAssignRef | Accounting/Payables/PaymentRunDetail | Accounting/Payables/PaymentRunDetail |
| BulkPaymentCheck | PaymentListActions | Accounting/Payables/PaymentRunDetail | Accounting/Payables/PaymentRunDetail |
| EditPayment | RefundPaymentForm | Accounting/Payments/PaymentDetail | Accounting/Payments/PaymentDetail#ReviewManualRefund (reviewed native replacement) |
| EditPayment | AuditLogList | Accounting/Payments/PaymentDetail | Accounting/Payments/PaymentDetail/History#PaymentHistory |
| EditPayment | EditPayment | Accounting/Payments/PaymentDetail | Accounting/Payments/PaymentDetail#PaymentEditDraft (a draft; state changes are reviewed actions) |
| EditPayment | GatewayAuthorizeForm | Accounting/Payments/PaymentDetail | Accounting/Payments/PaymentDetail#ReviewGatewayAuthorize (reviewed native replacement) |
| EditPayment | GatewayCaptureForm | Accounting/Payments/PaymentDetail | Accounting/Payments/PaymentDetail#ReviewGatewayCapture (reviewed native replacement) |
| EditPayment | GatewayRefundForm | Accounting/Payments/PaymentDetail | Accounting/Payments/PaymentDetail#ReviewProviderRefund (original-capture native replacement) |
| EditPayment | SetRefundForForm | Accounting/Payments/PaymentDetail | Accounting/Payments/PaymentDetail/Refunds#PaymentRefund (a reviewed refund records the link; no raw link writer) |
| EditPayment | GatewayRefundForForm | Accounting/Payments/PaymentDetail | Accounting/Payments/PaymentDetail#ReviewProviderRefund (reviewed draft conversion; no raw link writer) |
| EditPayment | RefundPaymentList | Accounting/Payments/PaymentDetail | Accounting/Payments/PaymentDetail#PaymentRefunds |
| EditPayment | PaymentApplicationList | Accounting/Payments/PaymentDetail | Accounting/Payments/PaymentDetail#PaymentApplications |
| EditPayment | UnpaidInvoiceList | Accounting/Payments/PaymentDetail | Accounting/Receivables/ReceivablesWorkbench#SettlementOpenItems; Accounting/Payables/PayablesWorkbench#SettlementOpenItems (from PaymentDetail/Applications) |
| EditPayment | UnappliedPaymentList | Accounting/Payments/PaymentDetail | Accounting/Receivables/ReceivablesWorkbench#SettlementOpenItems; Accounting/Payables/PayablesWorkbench#SettlementOpenItems (from PaymentDetail/Applications) |
| EditPayment | PaymentTxList | Accounting/Payments/PaymentDetail | Accounting/Payments/PaymentDetail/GeneralLedger#PaymentLedger |
| EditPayment | InvoiceGlaList | Accounting/Payments/PaymentDetail | Accounting/Payments/PaymentDetail/GeneralLedger#PaymentLedger (transactions; no per-account summary) |
| EditPayment | NewContentForm | Accounting/Payments/PaymentDetail | Accounting/Payments/PaymentDetail/Files#AccountingPaymentFiles (shared record files) |
| EditPayment | UpdateContentForm | Accounting/Payments/PaymentDetail | Accounting/Payments/PaymentDetail/Files#AccountingPaymentFiles (shared record files) |
| EditPayment | GatewayResponseList | Accounting/Payments/PaymentDetail | Accounting/Payments/PaymentDetail#PaymentGatewayEvidence |
| FindPayment | NewInPaymentForm | Accounting/Payments/Payments | Accounting/Payments/Payments#NewAccountingPayment; Accounting/QuickCreate/NewPayment#CreateDraft (reviewed native lifecycle) |
| FindPayment | NewOutPaymentForm | Accounting/Payments/Payments | Accounting/Payments/Payments#NewAccountingPayment; Accounting/QuickCreate/NewPayment#CreateDraft (reviewed native lifecycle) |
| FindPayment | PaymentList | Accounting/Payments/Payments | Accounting/Payments/Payments#Records |
| AccountBalance | AccountBalanceHistory | Accounting/Reports/AccountBalance | Accounting/Reports/AccountBalance#BalanceRows |
| AccountLedger | AccountLedger | Accounting/Reports/GeneralLedger | Accounting/Reports/GeneralLedger#ReportRows |
| ArAgingSummary | ReportOptions | Accounting/Reports/Aging | Accounting/Reports/Aging#AgingOptions |
| ArAgingSummary | InvoiceAgingList | Accounting/Reports/Aging | Accounting/Reports/Aging#AgingRows |
| AssetOnHand | AssetOnHandSummary | Warehouse/Inventory/Availability; Accounting/Reports/StockTransactions | — (§7: StockTransactions' on-hand and package summaries) |
| AssetOnHandSummary | FieldDescriptions | Warehouse/Inventory/Availability; Accounting/Reports/StockTransactions | — (§7: StockTransactions' on-hand and package summaries) |
| AssetOnHandSummary | AssetOnHandSummary | Warehouse/Inventory/Availability; Accounting/Reports/StockTransactions | — (§7: StockTransactions' on-hand and package summaries) |
| AssetReceiptTransaction | AssetReceiptTxList | Warehouse/Reports/OperationsHistory; Accounting/Reports/StockTransactions | Accounting/Reports/StockTransactions; Warehouse/Reports/OperationsHistory (HistoryReport) |
| AssetStatusByReceipt | FieldDescriptions | Warehouse/Reports/OperationsHistory; Accounting/Reports/StockTransactions | — (§7: StockTransactions' on-hand and package summaries) |
| AssetStatusByReceipt | AssetOnHandSummary | Warehouse/Reports/OperationsHistory; Accounting/Reports/StockTransactions | Warehouse/Reports/OperationsHistory (HistoryTotals, per unit) |
| AssetValuation | AssetValuationSummary | Accounting/Inventory/InventoryValuation; Shared/InventoryValuation; Warehouse/Reports/InventoryValuation | Accounting/Inventory/InventoryValuation (Shared/InventoryValuation); Warehouse/Reports/InventoryValuation (with financial read) |
| InvoiceAgingDetail | ReportOptions | Accounting/Reports/Aging | Accounting/Reports/Aging#AgingOptions |
| InvoiceAgingDetail | InvoiceAgingList | Accounting/Reports/Aging | Accounting/Reports/Aging#AgingDetailRows |
| InvoiceItemSummary | InvoiceItemSummary | Accounting/Reports/SalesAnalysis | Accounting/Reports/SalesAnalysis#SalesAnalysisRows |
| InvoiceReconciliation | ReportOptions | Accounting/Reports/InvoiceReconciliation | Accounting/Reports/InvoiceReconciliation#ReconciliationOptions |
| InvoiceReconciliation | InvoiceVsGlList | Accounting/Reports/InvoiceReconciliation | Accounting/Reports/InvoiceReconciliation#ReconciliationRows |
| InvoiceReconciliation | PaymentVsGlList | Accounting/Reports/InvoiceReconciliation | Accounting/Reports/InvoiceReconciliation#ReconciliationRows |
| InvoiceReconciliation | NotPostedTxList | Accounting/Reports/InvoiceReconciliation | Accounting/Reports/InvoiceReconciliation#ReconciliationRows |
| InvoiceReconciliation | CreditNeqDebitTxList | Accounting/Reports/InvoiceReconciliation | Accounting/Reports/InvoiceReconciliation#ReconciliationRows |
| InvoiceReconciliation | NoInvoiceTxList | Accounting/Reports/InvoiceReconciliation | Accounting/Reports/InvoiceReconciliation#ReconciliationRows |
| InvoiceReconciliation | ApplicationFutureInvoiceList | Accounting/Reports/InvoiceReconciliation | Accounting/Reports/InvoiceReconciliation#ReconciliationRows |
| OrderIssuedInvoiced | OrderIssuedInvoiced | Accounting/Reports/SalesAnalysis | Accounting/Reports/SalesAnalysis#SalesAnalysisRows |
| OrderItemSummary | OrderItemSummary | Accounting/Reports/SalesAnalysis | Accounting/Reports/SalesAnalysis#SalesAnalysisRows |
| PostedAmountSummary | ResultListForm | Accounting/Reports/PostedSummary | Accounting/Reports/PostedSummary#PostedRows |
| PostedBalanceSummary | ResultList | Accounting/Reports/PostedSummary | Accounting/Reports/PostedSummary#PostedRows |
| ReportList | BalanceSheetForm | Accounting/Reports/BalanceSheet | Accounting/Reports/BalanceSheet#StatementOptions; Accounting/Reports/Reports#QuickOptions |
| ReportList | IncomeStatementForm | Accounting/Reports/IncomeStatement | Accounting/Reports/IncomeStatement#StatementOptions; Accounting/Reports/Reports#QuickOptions |
| ReportList | CashFlowStatementForm | Accounting/Reports/CashFlow | Accounting/Reports/CashFlow#StatementOptions; Accounting/Reports/Reports#QuickOptions |
| ReportList | RetainedEarningsStatementForm | Accounting/Reports/RetainedEarnings | Accounting/Reports/RetainedEarnings#StatementOptions; Accounting/Reports/Reports#QuickOptions |
| ReportList | FinancialRatiosForm | Accounting/Reports/FinancialRatios | Accounting/Reports/FinancialRatios#StatementOptions; Accounting/Reports/Reports#QuickOptions |
| ReportList | CustomerStatementForm | Accounting/Receivables/Statements | Accounting/Receivables/Statements#StatementOptions; StatementInvoices; StatementDelivery |
| ReportList | AccountLedgerForm | Accounting/Reports/GeneralLedger | Accounting/Reports/GeneralLedger#ReportOptions; Accounting/Reports/Reports#QuickOptions |
| ReportList | AccountBalanceForm | Accounting/Reports/AccountBalance | Accounting/Reports/AccountBalance#StatementOptions; Accounting/Reports/Reports#QuickOptions |
| ReportList | PostedAmountSummaryForm | Accounting/Reports/PostedSummary | Accounting/Reports/PostedSummary#PostedSummaryOptions |
| ReportList | PostedBalanceSummaryForm | Accounting/Reports/PostedSummary | Accounting/Reports/PostedSummary#PostedSummaryOptions |
| SalesAnalysis | SalesAnalysis | Accounting/Reports/SalesAnalysis; Sales/Reports/SalesAnalysis | Accounting/Reports/SalesAnalysis#SalesAnalysisRows |
| SalesInvoiceAnalysis | SalesInvoiceAnalysis | Accounting/Reports/SalesAnalysis | Accounting/Reports/SalesAnalysis#SalesAnalysisRows |
| SalesSummary | SummaryOptions | Accounting/Reports/SalesAnalysis; Sales/Reports/SalesSummary | Accounting/Reports/SalesAnalysis#SalesAnalysisOptions |
| SalesSummary | TopProductList | Accounting/Reports/SalesAnalysis; Sales/Reports/SalesSummary | Accounting/Reports/SalesAnalysis#SalesAnalysisRows (by product) |
| SalesSummary | SalesOrderSummaryList | Accounting/Reports/SalesAnalysis; Sales/Reports/SalesSummary | Accounting/Reports/SalesAnalysis#SalesAnalysisRows (ordered) |
| SalesSummary | TopCustomerClassList | Accounting/Reports/SalesAnalysis; Sales/Reports/SalesSummary | Accounting/Reports/SalesAnalysis#SalesAnalysisRows (by customer class) |
| SalesSummary | SalesInvoiceSummaryList | Accounting/Reports/SalesAnalysis; Sales/Reports/SalesSummary | Accounting/Reports/SalesAnalysis#SalesAnalysisRows (invoiced) |
| ShipmentPackageSummary | ShipmentPackageSummary | Warehouse/Reports/OperationsHistory; Accounting/Reports/StockTransactions | Warehouse/Reports/OperationsHistory (HistoryReport: picked, shipped, delivered; packages §7) |
| EditTimePeriod | CreateNextPeriod | Accounting/PeriodClose/Periods | Accounting/PeriodClose/Periods#GeneratePeriods |
| EditTimePeriod | CreatePreviousPeriod | Accounting/PeriodClose/Periods | Accounting/PeriodClose/Periods#GeneratePeriods (a day in the earlier year) |
| EditTimePeriod | ViewTimePeriod | Accounting/PeriodClose/Periods | Accounting/PeriodClose/PeriodCloseDetail |
| EditTimePeriod | CreateChild | Accounting/PeriodClose/Periods | Accounting/PeriodClose/Periods#GeneratePeriods (the quarters and months of a year) |
| EditTimePeriod | TimePeriodList | Accounting/PeriodClose/Periods | Accounting/PeriodClose/Periods#Records |
| FindTimePeriod | CreatePeriod | Accounting/PeriodClose/Periods | Accounting/PeriodClose/Periods#GeneratePeriods |
| FindTimePeriod | TimePeriodList | Accounting/PeriodClose/Periods | Accounting/PeriodClose/Periods#Records |
| ViewPeriodGlAccounts | ClosingTransForm | Accounting/PeriodClose/PeriodCloseDetail | Accounting/PeriodClose/PeriodCloseDetail#ClosePeriod |
| ViewPeriodGlAccounts | PeriodGlAccountList | Accounting/PeriodClose/PeriodCloseDetail | Accounting/Reports/TrialBalance#ReportRows (the period's stored summaries, linked from PeriodCloseDetail) |
| EditTransaction | UpdateAcctgTrans | Accounting/GeneralLedger/JournalEntryDetail | Accounting/GeneralLedger/JournalEntryDetail#DraftHeader |
| EditTransaction | UpdateAcctgTransPosted | Accounting/GeneralLedger/JournalEntryDetail | Accounting/GeneralLedger/JournalEntryDetail#CorrectDescription and ReverseEntry (audited metadata and reversal; no amount edit) |
| EditTransaction | AddEntryForm | Accounting/GeneralLedger/JournalEntryDetail | Accounting/GeneralLedger/JournalEntryDetail#AddLine |
| EditTransaction | EntryListForm | Accounting/GeneralLedger/JournalEntryDetail | Accounting/GeneralLedger/JournalEntryDetail#TransactionLines |
| EditTransaction | AuditLogList | Accounting/GeneralLedger/JournalEntryDetail | Accounting/GeneralLedger/JournalEntryDetail#Audit |
| MoveEntry | ReceiveForm | Accounting/GeneralLedger/JournalEntryDetail | Accounting/GeneralLedger/JournalEntryDetail#MoveDraftLine (draft move; posted adjustment is not exposed) |
| FindTransaction | CreateAcctgTrans | Accounting/GeneralLedger/JournalEntries | Accounting/QuickCreate/NewEntry#CreateDraft |
| FindTransaction | TransactionList | Accounting/GeneralLedger/JournalEntries | Accounting/GeneralLedger/JournalEntries#Records |
| FindTransactionEntry | TransactionEntryList | Accounting/GeneralLedger/TransactionEntries | Accounting/GeneralLedger/TransactionEntries#Records |
| OrgInternalSummary | OrgInternalForm | Accounting/Home | Accounting/Home (money cards, MyFinanceWork) |

## Asset (65 forms)

| Screen XML | Form | Designed in | Implemented in |
| --- | --- | --- | --- |
| AssetCalendar | NewEventForm | Commons/Calendar/Schedules; Maintenance/Scheduling/ResourceCalendar; Maintenance/Equipment/EquipmentDetail | Commons/Calendar/Schedules |
| AssetDetail | UpdateAssetAcquireCost | Accounting/FixedAssets/EquipmentDetail; Maintenance/Equipment/EquipmentDetail | Accounting/FixedAssets/EquipmentDetail (Repair acquire cost) |
| AssetDetail | AuditLogList | Warehouse/Inventory/AssetDetail; Maintenance/Equipment/EquipmentDetail | Warehouse/Inventory/AssetDetail/Audit |
| AssetDetail | EditAsset | Warehouse/Inventory/AssetDetail; Maintenance/Equipment/EquipmentDetail | Warehouse/Inventory/AssetDetail (Edit details: name and comments) |
| AssetDetail | ReservationsListForm | Warehouse/Inventory/AssetDetail | Warehouse/Inventory/AssetDetail/Reservations |
| AssetDetail | AssetDetailList | Warehouse/Inventory/AssetDetail; Maintenance/Equipment/EquipmentDetail | Warehouse/Inventory/AssetDetail/Ledger |
| AssetDetail | AssetDepreciationList | Accounting/FixedAssets/EquipmentDetail; Accounting/FixedAssets/DepreciationRunDetail; Maintenance/Equipment/EquipmentDetail | Accounting/FixedAssets/EquipmentDetail; Accounting/FixedAssets/DepreciationRunDetail |
| EditAssetMaintenance | UpdateMaintenanceForm | Maintenance/WorkOrders/WorkOrderDetail; Maintenance/Equipment/EquipmentDetail |  |
| EditAssetMaintenance | NewContentForm | Shared/RecordFiles; Maintenance/RecordFiles; Maintenance/Equipment/EquipmentDetail; Maintenance/WorkOrders/WorkOrderDetail |  |
| EditAssetMaintenance | UpdateContentForm | Shared/RecordFiles; Maintenance/RecordFiles; Maintenance/Equipment/EquipmentDetail; Maintenance/WorkOrders/WorkOrderDetail |  |
| FindAssetMaintenance | AddPlannedMaintenance | Maintenance/Preventive/DueMaintenance; Maintenance/WorkOrders/WorkOrderDetail |  |
| FindAssetMaintenance | AddOtherMaintenance | Maintenance/WorkOrders; Maintenance/WorkOrders/WorkOrderDetail |  |
| FindAssetMaintenance | ProductMaintenanceList | Maintenance/Preventive/Plans; Maintenance/Equipment/EquipmentDetail |  |
| FindAssetMaintenance | MaintenanceListForm | Maintenance/Equipment/EquipmentDetail; Maintenance/WorkOrders/WorkOrderDetail |  |
| AssetMeters | NewMeterForm | Maintenance/Equipment/EquipmentDetail; Maintenance/Preventive/DueMaintenance |  |
| AssetMeters | MeterListForm | Maintenance/Equipment/EquipmentDetail |  |
| AssetParties | AddUserForm | Maintenance/Equipment/EquipmentDetail |  |
| AssetParties | UpdateUserForm | Maintenance/Equipment/EquipmentDetail |  |
| AssetRegistrations | NewRegistrationForm | Maintenance/Equipment/EquipmentDetail |  |
| AssetRegistrations | RegistrationsForm | Maintenance/Equipment/EquipmentDetail |  |
| DetailHistory | AssetDetailList | Warehouse/Inventory/Movements; Warehouse/Inventory/AssetDetail | Warehouse/Inventory/Movements; Warehouse/Inventory/AssetDetail/Ledger |
| FindAsset | UpdateProductCost | Accounting/Inventory/InventoryValuation | Accounting/Inventory/InventoryValuation (Repair product cost) |
| FindAsset | CreateEquipment | Maintenance/Equipment |  |
| FindAsset | ListAssets | Warehouse/Inventory/Assets; Maintenance/Equipment | Warehouse/Inventory/Assets |
| FindSummary | ReceiveAssetForm | Warehouse/Receiving/Receive; Warehouse/Inventory/MaterialIssueReceipt | Warehouse/Receiving/Receive (AdHocReceipt, receive#AdHocStock); Warehouse/Inventory/MaterialIssueReceipt (ReceiveOutputForm) |
| FindSummary | PhysicalManualChange | Warehouse/Inventory/Adjustments | Warehouse/Inventory/Adjustments (AdjustmentScope, then Preview and PostAdjustment) |
| FindSummary | AssetSummary | Warehouse/Inventory/Availability | Warehouse/Inventory/Availability/Summary (InventorySummary, InventoryLots) |
| PhysicalChange | RecordChange | Warehouse/Inventory/Adjustments | Warehouse/Inventory/Adjustments (AdjustmentScope, Enter: the change; PostAdjustment) |
| PhysicalQuantity | RecordQuantity | Warehouse/Inventory/Adjustments | Warehouse/Inventory/Adjustments (AdjustmentScope, Enter: what is there, a count; PostAdjustment) |
| MoveAsset | AssetInfoForm | Warehouse/Transfers/Move; Maintenance/Equipment/EquipmentDetail | Warehouse/Transfers/Move (MoveConfirm) |
| MoveAsset | ScanMoveAssetForm | Warehouse/Transfers/Move; Maintenance/Equipment/EquipmentDetail | Warehouse/Transfers/Move (ScanSelect, MoveConfirm) |
| MoveAsset | EnterMoveAssetForm | Warehouse/Transfers/Move; Maintenance/Equipment/EquipmentDetail | Warehouse/Transfers/Move (MoveConfirm) |
| SelectAsset | ScanAssetForm | Warehouse/Transfers/Move | Warehouse/Transfers/Move (ScanSelect) |
| SelectAsset | ActiveFacilityForm | Warehouse/Transfers/Move | Warehouse/Transfers/Move (MoveSelect) |
| SelectAsset | SelectAssetForm | Warehouse/Transfers/Move | Warehouse/Transfers/Move (MoveSelect) |
| SelectAsset | SelectLocationForm | Warehouse/Transfers/Move | Warehouse/Transfers/Move (MoveSelect) |
| SelectAsset | ScanMoveAssetForm | Warehouse/Transfers/Move | Warehouse/Transfers/Move (MoveConfirm) |
| SelectAsset | EnterMoveAssetForm | Warehouse/Transfers/Move | Warehouse/Transfers/Move (MoveConfirm) |
| SelectAsset | ContainerAssetList | Warehouse/Transfers/Move | Warehouse/Transfers/Move (MoveContents) |
| SelectAsset | LocationAssetList | Warehouse/Transfers/Move | Warehouse/Transfers/Move (MoveContents) |
| SelectAsset | ProductNoLocAssetList | Warehouse/Transfers/Move | Warehouse/Transfers/Move (MoveContents) |
| SelectAsset | RecentMoveForm | Warehouse/Transfers/Move | Warehouse/Transfers/Move (RecentMoves) |
| SelectAsset | RecentContainerMoveForm | Warehouse/Transfers/Move | Warehouse/Transfers/Move (RecentMoves) |
| EditAssetPool | UpdateAssetPoolForm | Warehouse/Settings/AssetPools | Warehouse/Settings/AssetPools/PoolDetail (EditPool) |
| EditAssetPool | AddPartyForm | Warehouse/Settings/AssetPools | Warehouse/Settings/AssetPools/PoolDetail (AddParty) |
| EditAssetPool | PartyListForm | Warehouse/Settings/AssetPools | Warehouse/Settings/AssetPools/PoolDetail (PoolPartys list) |
| EditAssetPool | AddStoreForm | Warehouse/Settings/AssetPools | Warehouse/Settings/AssetPools/PoolDetail (AddStore) |
| EditAssetPool | StoreListForm | Warehouse/Settings/AssetPools | Warehouse/Settings/AssetPools/PoolDetail (PoolStores) |
| FindAssetPool | CreateAssetPoolForm | Warehouse/Settings/AssetPools | Warehouse/Settings/AssetPools/PoolList (NewPool) |
| FindAssetPool | AssetPoolList | Warehouse/Settings/AssetPools | Warehouse/Settings/AssetPools/PoolList (PoolList) |
| EditContainer | PickScanForm | Warehouse/Inventory/ContainerDetail | Warehouse/Inventory/ContainerDetail (AddOrRemoveAsset, the scan; a pick movement is P11) |
| EditContainer | UpdateContainerForm | Warehouse/Inventory/ContainerDetail | — not built (P4): ContainerDetail's header is read only; type and place are set at Containers' New container, moves by MoveContainer |
| EditContainer | AddAssetForm | Warehouse/Inventory/ContainerDetail | Warehouse/Inventory/ContainerDetail (AddOrRemoveAsset, Take out) |
| EditContainer | AssetListForm | Warehouse/Inventory/ContainerDetail | Warehouse/Inventory/ContainerDetail (Contents) |
| FindContainer | CreateContainerForm | Warehouse/Inventory/Containers | Warehouse/Inventory/Containers (New container) |
| FindContainer | ContainerList | Warehouse/Inventory/Containers | Warehouse/Inventory/Containers |
| MoveContainer | ContainerInfoForm | Warehouse/Inventory/ContainerDetail; Warehouse/Transfers/Move | Warehouse/Inventory/ContainerDetail (header, MoveContainer) |
| MoveContainer | AssetListForm | Warehouse/Inventory/ContainerDetail; Warehouse/Transfers/Move | Warehouse/Inventory/ContainerDetail (Contents); Warehouse/Transfers/Move (MoveContents by container) |
| MoveContainer | ScanMoveContainerForm | Warehouse/Inventory/ContainerDetail; Warehouse/Transfers/Move | Warehouse/Inventory/ContainerDetail (MoveContainer) |
| MoveContainer | EnterMoveContainerForm | Warehouse/Inventory/ContainerDetail; Warehouse/Transfers/Move | Warehouse/Inventory/ContainerDetail (MoveContainer) |
| EditLots | CreateLot | Warehouse/Inventory/Lots | Warehouse/Inventory/Lots (New lot) |
| EditLots | LotList | Warehouse/Inventory/Lots | Warehouse/Inventory/Lots (Correct, through correct#LotMetadata, P6) |
| EditPhysicalInventory | UpdateMasterEntityValue | Warehouse/Counts/CountDetail | Warehouse/Counts/CountDetail (Edit count through update#Count, P10) |
| EditPhysicalInventory | AssetDetailList | Warehouse/Counts/CountDetail; Warehouse/Counts/CountReview; Warehouse/Reports/CountVariance | Warehouse/Counts/CountDetail (PostedAdjustments), CountReview (VarianceReview), Reports/CountVariance (P10) |
| FindPhysicalInventory | PhysicalInventoryList | Warehouse/Counts/Counts | Warehouse/Counts/Counts (CountList over find#Counts, P10) |

## Catalog (80 forms)

| Screen XML | Form | Designed in | Implemented in |
| --- | --- | --- | --- |
| Category/Content/ContentDetail | UpdateContentForm | Products/Categories/CategoryDetail/Content; Commerce/Merchandising/CategoryDetail/Content | Products/Categories/CategoryDetail/Content (Shared/Documents: AddCatalogText, UploadCatalogFiles, Documents; Shared/DocumentDetail: ProductContentMetadata) |
| Category/Content/ContentDetail | UpdateTextForm | Products/Categories/CategoryDetail/Content; Commerce/Merchandising/CategoryDetail/Content | Products/Categories/CategoryDetail/Content (Shared/Documents: AddCatalogText, UploadCatalogFiles, Documents; Shared/DocumentDetail: ProductContentMetadata) |
| Category/Content/ContentList | NewContentForm | Products/Categories/CategoryDetail/Content; Commerce/Merchandising/CategoryDetail/Content | Products/Categories/CategoryDetail/Content (Shared/Documents: AddCatalogText, UploadCatalogFiles, Documents; Shared/DocumentDetail: ProductContentMetadata) |
| Category/Content/ContentList | NewLocationForm | Products/Categories/CategoryDetail/Content; Commerce/Merchandising/CategoryDetail/Content | Products/Categories/CategoryDetail/Content (Shared/Documents: AddCatalogText, UploadCatalogFiles, Documents; Shared/DocumentDetail: ProductContentMetadata) |
| Category/Content/ContentList | NewTextForm | Products/Categories/CategoryDetail/Content; Commerce/Merchandising/CategoryDetail/Content | Products/Categories/CategoryDetail/Content (Shared/Documents: AddCatalogText, UploadCatalogFiles, Documents; Shared/DocumentDetail: ProductContentMetadata) |
| Category/Content/ContentList | ContentList | Products/Categories/CategoryDetail/Content; Commerce/Merchandising/CategoryDetail/Content | Products/Categories/CategoryDetail/Content (Shared/Documents: AddCatalogText, UploadCatalogFiles, Documents; Shared/DocumentDetail: ProductContentMetadata) |
| EditCategory | EditCategoryForm | Products/Categories/CategoryDetail; Commerce/Merchandising/CategoryDetail | Products/Categories/CategoryDetail/Summary |
| EditCategory | AddChild | Products/Categories/CategoryDetail; Commerce/Merchandising/CategoryDetail | Products/Categories/CategoryDetail/Parents |
| EditCategory | ChildCategoriesForm | Products/Categories/CategoryDetail; Commerce/Merchandising/CategoryDetail | Products/Categories/CategoryDetail/Parents |
| EditCategory | GenerateCategoryIdent | Products/Categories/CategoryDetail; Commerce/Merchandising/CategoryDetail | Products/Categories/CategoryDetail/Identifiers |
| EditCategory | AddCategoryIdentForm | Products/Categories/CategoryDetail; Commerce/Merchandising/CategoryDetail | Products/Categories/CategoryDetail/Identifiers |
| EditCategory | CategoryIdentForm | Products/Categories/CategoryDetail; Commerce/Merchandising/CategoryDetail | Products/Categories/CategoryDetail/Identifiers |
| EditCategory | ParentCategoriesForm | Products/Categories/CategoryDetail; Commerce/Merchandising/CategoryDetail | Products/Categories/CategoryDetail/Parents |
| EditCategory | AddFeatureGroupForm | Products/Categories/CategoryDetail | Products/Categories/CategoryDetail/FeatureDefaults |
| EditCategory | FeatureGroupsForm | Products/Categories/CategoryDetail | Products/Categories/CategoryDetail/FeatureDefaults |
| EditProducts | AddProductForm | Products/Categories/CategoryDetail; Commerce/Merchandising/CategoryDetail | Products/Categories/CategoryDetail/Products |
| EditProducts | ProductsForm | Products/Categories/CategoryDetail; Commerce/Merchandising/CategoryDetail | Products/Categories/CategoryDetail/Products |
| FindCategory | NewCategoryForm | Products/Categories | Products/Categories/NewCategory |
| FindCategory | CategoriesForm | Products/Categories | Products/Categories/List (occurrences and guarded one-edge moves) |
| EditFeature | NewFeatureForm | Products/Features | Products/Features/NewFeature; Shared/Product360/Features (atomic create/apply) |
| EditFeature | EditFeatureForm | Products/Features/FeatureDetail | Products/Features/FeatureDetail/Summary |
| EditFeature | AddFeatureGroupForm | Products/Features/FeatureDetail | Products/Features/FeatureDetail/Groups |
| EditFeature | FeatureGroupsForm | Products/Features/FeatureDetail | Products/Features/FeatureDetail/Groups |
| EditFeature | AddProductForm | Products/Features/FeatureDetail | Products/Features/FeatureDetail/Products |
| EditFeature | ProductsForm | Products/Features/FeatureDetail | Products/Features/FeatureDetail/Products |
| FindFeature | NewFeatureForm | Products/Features | Products/Features/NewFeature |
| FindFeature | FeaturesForm | Products/Features | Products/Features/List |
| EditFeatureGroup | EditFeatureGroupForm | Products/Features/FeatureGroups/FeatureGroupDetail | Products/Features/FeatureGroups/FeatureGroupDetail/Summary |
| EditFeatureGroup | AddCategoryForm | Products/Features/FeatureGroups/FeatureGroupDetail | Products/Features/FeatureGroups/FeatureGroupDetail/Categories |
| EditFeatureGroup | CategoriesForm | Products/Features/FeatureGroups/FeatureGroupDetail | Products/Features/FeatureGroups/FeatureGroupDetail/Categories |
| EditFeatureGroup | AddFeatureForm | Products/Features/FeatureGroups/FeatureGroupDetail | Products/Features/FeatureGroups/FeatureGroupDetail/Features |
| EditFeatureGroup | FeaturesForm | Products/Features/FeatureGroups/FeatureGroupDetail | Products/Features/FeatureGroups/FeatureGroupDetail/Features |
| FindFeatureGroup | NewFeatureGroupForm | Products/Features/FeatureGroups | Products/Features/FeatureGroups/NewGroup |
| FindFeatureGroup | FeatureGroupsForm | Products/Features/FeatureGroups | Products/Features/FeatureGroups/List |
| Product/Content/ContentDetail | UpdateContentForm | Products/Documents/DocumentDetail; Products/Products/Product360; Shared/Product360; Commerce/Merchandising/Documents/DocumentDetail; Commerce/Merchandising/Product360 | Shared/Product360/Documents (guarded existing content service) |
| Product/Content/ContentDetail | UpdateTextForm | Products/Documents/DocumentDetail; Products/Products/Product360; Shared/Product360; Commerce/Merchandising/Documents/DocumentDetail; Commerce/Merchandising/Product360 | Shared/Product360/Documents (guarded existing content service) |
| Product/Content/ContentList | NewContentForm | Products/Documents; Products/Products/Product360; Shared/Product360; Commerce/Merchandising/Documents; Commerce/Merchandising/Product360 | Shared/Product360/Documents |
| Product/Content/ContentList | NewLocationForm | Products/Documents; Products/Products/Product360; Shared/Product360; Commerce/Merchandising/Documents; Commerce/Merchandising/Product360 | Shared/Product360/Documents |
| Product/Content/ContentList | NewTextForm | Products/Documents; Products/Products/Product360; Shared/Product360; Commerce/Merchandising/Documents; Commerce/Merchandising/Product360 | Shared/Product360/Documents |
| Product/Content/ContentList | ContentList | Products/Documents; Products/Products/Product360; Shared/Product360; Commerce/Merchandising/Documents; Commerce/Merchandising/Product360 | Shared/Product360/Documents |
| EditAssocs | AddAssocToForm | Products/Products/Product360; Manufacturing/BillsOfMaterials/BillOfMaterialsDetail; Shared/Product360 | Shared/Product360/Associations (substitutes only); Manufacturing/BillsOfMaterials/BillOfMaterialsDetail (the dated BOM lines of Shared/BillOfMaterialsDetail, P2) |
| EditAssocs | AssocToListForm | Products/Products/Product360; Manufacturing/BillsOfMaterials/BillOfMaterialsDetail; Shared/Product360 | Shared/Product360/Associations (substitutes only); Manufacturing/BillsOfMaterials/BillOfMaterialsDetail (the dated BOM lines of Shared/BillOfMaterialsDetail, P2) |
| EditAssocs | AssocFromListForm | Products/Products/Product360; Manufacturing/BillsOfMaterials/WhereUsed; Shared/Product360 | Shared/Product360/Associations (substitutes only); Manufacturing/BillsOfMaterials/WhereUsed (Shared/WhereUsed, kits read only, P2) |
| EditAssocs | CreateVariantsForm | Products/Products/VariantBuilder; Shared/Product360 | Products/Products/VariantBuilder (qvue; VariantBuilderTui XML twin) |
| EditAssocs | AllSelectableFeaturesForm | Products/Products/VariantBuilder; Shared/Product360 | Products/Products/VariantBuilder (qvue; VariantBuilderTui XML twin) |
| EditCategories | AddCategoryForm | Products/Products/Product360; Shared/Product360; Commerce/Merchandising/Product360 | Shared/Product360/Categories |
| EditCategories | CategoriesForm | Products/Products/Product360; Shared/Product360; Commerce/Merchandising/Product360 | Shared/Product360/Categories |
| EditPrices | NewPriceForm | Products/Pricing/Prices; Products/Products/Product360; Products/Suppliers/SupplierPrices; Purchasing/Suppliers/SupplierPrices; Shared/Product360; Shared/SupplierPrices; Commerce/Merchandising/Product360; Sales/Agreements/CustomerPrices; Sales/Agreements/AgreementDetail | Shared/Prices (NewSalesPrice, NewSupplierPrice, Prices); Shared/SupplierPrices (SupplierOffers and offer forms); Products mounts only; Purchasing/Suppliers/SupplierPrices (Shared/SupplierPrices) |
| EditPrices | PricesForm | Products/Pricing/Prices; Products/Products/Product360; Products/Suppliers/SupplierPrices; Purchasing/Suppliers/SupplierPrices; Shared/Product360; Shared/SupplierPrices; Commerce/Merchandising/Product360; Sales/Agreements/CustomerPrices; Sales/Agreements/AgreementDetail | Shared/Prices (NewSalesPrice, NewSupplierPrice, Prices); Shared/SupplierPrices (SupplierOffers and offer forms); Products mounts only; Purchasing/Suppliers/SupplierPrices (Shared/SupplierPrices) |
| EditProduct | CloneProductForm | Products/Products/Product360; Shared/Product360 | Shared/Product360 |
| EditProduct | EditProductForm | Products/Products/Product360; Shared/Product360; Commerce/Merchandising/Product360 | Shared/Product360 |
| EditProduct | AddIdentificationForm | Products/Products/Product360; Shared/Product360; Commerce/Merchandising/Product360 | Shared/Product360/Identifiers |
| EditProduct | IdentificationsForm | Products/Products/Product360; Shared/Product360; Commerce/Merchandising/Product360 | Shared/Product360/Identifiers |
| EditProduct | GenerateOtherIdentification | Products/Products/Product360; Shared/Product360 | Shared/Product360/Identifiers (GenerateIdentifierPreview, AssignGeneratedIdentifier; explicit internal generation) |
| EditProduct | AddOtherIdentificationForm | Products/Products/Product360; Shared/Product360; Commerce/Merchandising/Product360 | Shared/Product360/Identifiers |
| EditProduct | OtherIdentificationsForm | Products/Products/Product360; Shared/Product360; Commerce/Merchandising/Product360 | Shared/Product360/Identifiers |
| EditProduct | NewFeatureForm | Products/Products/Product360; Shared/Product360 | Shared/Product360/Features (atomic create/apply) |
| EditProduct | AddFeatureForm | Products/Products/Product360; Shared/Product360 | Shared/Product360/Features (existing feature applications) |
| EditProduct | FeaturesForm | Products/Products/Product360; Shared/Product360 | Shared/Product360/Features (existing feature applications) |
| EditProduct | AddDimensionForm | Products/Products/Product360; Shared/Product360 | Shared/Product360/Dimensions (modern writes; legacy read only) |
| EditProduct | DimensionsForm | Products/Products/Product360; Shared/Product360 | Shared/Product360/Dimensions (modern writes; legacy read only) |
| EditProduct | AddUomDimensionForm | Products/Products/Product360; Shared/Product360 | Shared/Product360/Dimensions (modern writes; legacy read only) |
| EditProduct | UomDimensionsForm | Products/Products/Product360; Shared/Product360 | Shared/Product360/Dimensions (modern writes; legacy read only) |
| EditProduct | CreateProductLocation | Products/Products/Product360; Shared/Product360 | Shared/InventoryAvailability/Policy (LocationStockPolicy, LocationPolicies) |
| EditProduct | ProductLocationList | Products/Products/Product360; Shared/Product360 | Shared/InventoryAvailability/Policy (LocationStockPolicy, LocationPolicies) |
| EditProduct | CreateProductMeter | Products/Products/Product360; Shared/Product360; Maintenance/Equipment/Product360 | Shared/Product360/Equipment |
| EditProduct | ProductMeterList | Products/Products/Product360; Shared/Product360; Maintenance/Equipment/Product360 | Shared/Product360/Equipment |
| EditProduct | CreateProductMaintenance | Products/Products/Product360; Shared/Product360; Maintenance/Equipment/Product360 | Shared/Product360/Equipment |
| EditProduct | ProductMaintenanceList | Products/Products/Product360; Shared/Product360; Maintenance/Equipment/Product360 | Shared/Product360/Equipment |
| FindProduct | NewProductForm | Products/Products | Products/Products/NewProduct |
| FindProduct | ProductsForm | Products/Products | Products/Products/List |
| Search | AddCategoryForm | Products/Products | Products/Products/List (fixed-ID selection; per-product results) |
| Search | RemoveCategoryForm | Products/Products | Products/Products/List (fixed-ID selection; per-product results) |
| Search | AddFeatureForm | Products/Products | Products/Products/List (fixed-ID selection; per-product results) |
| Search | RemoveFeatureForm | Products/Products | Products/Products/List (fixed-ID selection; per-product results) |
| Search | ProductsForm | Products/Products | Products/Products/List (fixed-ID selection; per-product results) |
| Search | AddCategoryFormSelection | Products/Products | Products/Products/List (fixed-ID selection; per-product results) |
| Search | RemoveCategoryFormSelection | Products/Products | Products/Products/List (fixed-ID selection; per-product results) |
| Search | AddFeatureFormSelection | Products/Products | Products/Products/List (fixed-ID selection; per-product results) |
| Search | RemoveFeatureFormSelection | Products/Products | Products/Products/List (fixed-ID selection; per-product results) |

## Customer (7 forms)

| Screen XML | Form | Designed in | Implemented in |
| --- | --- | --- | --- |
| CustomerData | CustomerDataList | CustomerService/Customers/Customer360; Sales/Accounts/Accounts |  |
| FindCustomer | CreatePersonForm | CustomerService/Customers/Customer360; Sales/Accounts/Accounts |  |
| FindCustomer | CreateOrganizationForm | CustomerService/Customers/Customer360; Sales/Accounts/Accounts |  |
| FindCustomer | CreateAccountForm | CustomerService/Customers/Customer360; Sales/Accounts/Accounts |  |
| FindCustomer | CreateContactForm | CustomerService/Customers/ContactDetail; Sales/Accounts/Contacts |  |
| FindCustomer | OuterSearchForm | CustomerService/Customers; Sales/Accounts/Accounts |  |
| FindCustomer | CustomerListForm | CustomerService/Customers; Sales/Accounts/Accounts |  |

## Facility (18 forms)

| Screen XML | Form | Designed in | Implemented in |
| --- | --- | --- | --- |
| BoxTypes | CreateBoxType | Warehouse/Locations/BoxTypes | Warehouse/Locations/BoxTypes (NewBoxType) |
| BoxTypes | BoxTypeList | Warehouse/Locations/BoxTypes | Warehouse/Locations/BoxTypes (BoxTypeList, EditBoxType, Retire) |
| CarrierShipMethods | CreateCarrierShipmentMethod | Warehouse/Locations/Carriers | Warehouse/Locations/Carriers (Add method, P13) |
| CarrierShipMethods | CarrierShipmentMethodList | Warehouse/Locations/Carriers | Warehouse/Locations/Carriers (CarrierMethods, P13) |
| EditFacility | EditFacilityForm | Warehouse/Locations/FacilityDetail; Shared/FacilityDetail; Maintenance/Facilities/FacilityDetail | Warehouse/Locations/FacilityDetail (Edit facility; Overview) |
| EditFacility | ChildListForm | Warehouse/Locations/FacilityDetail; Shared/FacilityDetail; Maintenance/Facilities/FacilityDetail; Maintenance/Facilities | Warehouse/Locations/FacilityDetail/Children |
| EditFacility | NewNoteForm | Warehouse/Locations/FacilityDetail; Shared/Chatter; Shared/FacilityDetail; Maintenance/Chatter; Maintenance/Facilities/FacilityDetail | Warehouse/Locations/FacilityDetail/Conversation (chatter) |
| EditFacility | UpdateNoteForm | Warehouse/Locations/FacilityDetail; Shared/Chatter; Shared/FacilityDetail; Maintenance/Chatter; Maintenance/Facilities/FacilityDetail | Warehouse/Locations/FacilityDetail/Conversation (chatter) |
| EditFacility | AddBoxTypeForm | Warehouse/Locations/FacilityDetail; Shared/FacilityDetail; Maintenance/Facilities/FacilityDetail | Warehouse/Locations/FacilityDetail (Box types tab: AddFacilityBoxType) |
| EditFacility | BoxTypesForm | Warehouse/Locations/FacilityDetail; Shared/FacilityDetail; Maintenance/Facilities/FacilityDetail | Warehouse/Locations/FacilityDetail (Box types tab: FacilityBoxTypeList) |
| EditFacility | AddLocationTypeForm | Warehouse/Locations/FacilityDetail; Shared/FacilityDetail; Maintenance/Facilities/FacilityDetail | Warehouse/Locations/FacilityDetail/Locations (Set status) |
| EditFacility | LocationTypesForm | Warehouse/Locations/FacilityDetail; Shared/FacilityDetail; Maintenance/Facilities/FacilityDetail | Warehouse/Locations/FacilityDetail/Locations (Location types) |
| EditFacilityLocations | NewLocationForm | Warehouse/Locations/FacilityDetail; Shared/FacilityDetail; Maintenance/Facilities/FacilityDetail | Warehouse/Locations/FacilityDetail/Locations (New location) |
| EditFacilityLocations | LocationsForm | Warehouse/Locations/FacilityDetail; Shared/FacilityDetail; Maintenance/Facilities/FacilityDetail | Warehouse/Locations/FacilityDetail/Locations (Locations, Edit, Close, Reopen) |
| EditFacilityProducts | AddProductForm | Warehouse/Locations/FacilityDetail; Warehouse/Inventory/Product360; Purchasing/Replenishment/ReorderRules; Shared/FacilityDetail; Products/Products/Product360/Stock; Shared/InventoryAvailability; Maintenance/Facilities/FacilityDetail | Shared/InventoryAvailability/Policy (FacilityStockPolicy, FacilityPolicyRead); Products/Products/Product360/Stock/Policy; Warehouse/Locations/FacilityDetail/Products; Purchasing/Replenishment/ReorderRules/Rules (NewReorderRuleForm, EditRule) |
| EditFacilityProducts | ProductList | Warehouse/Locations/FacilityDetail; Warehouse/Inventory/Product360; Purchasing/Replenishment/ReorderRules; Shared/FacilityDetail; Products/Products/Product360/Stock; Shared/InventoryAvailability; Maintenance/Facilities/FacilityDetail | Shared/InventoryAvailability/Policy (FacilityStockPolicy, FacilityPolicyRead); Products/Products/Product360/Stock/Policy; Warehouse/Locations/FacilityDetail/Products; Purchasing/Replenishment/ReorderRules/Rules (ReorderRuleList); Purchasing/Replenishment/ReorderRules/SuggestLevels |
| FindFacility | NewFacilityForm | Warehouse/Locations/Facilities; Maintenance/Facilities | Warehouse/Locations/Facilities (New facility); Warehouse/Locations/FacilityDetail/Children |
| FindFacility | FacilityListForm | Warehouse/Locations/Facilities; Maintenance/Facilities | Warehouse/Locations/Facilities (list and tree) |

## Gateway (6 forms)

| Screen XML | Form | Designed in | Implemented in |
| --- | --- | --- | --- |
| EditPaymentGateway | EditPaymentGatewayForm | Admin/Integrations/ConnectionDetail |  |
| FindPaymentGateway | NewPaymentGatewayForm | Admin/Integrations/Connections |  |
| FindPaymentGateway | PaymentGatewaysForm | Admin/Integrations/Connections |  |
| EditShippingGateway | EditShippingGatewayForm | Admin/Integrations/ConnectionDetail |  |
| FindShippingGateway | NewShippingGatewayForm | Admin/Integrations/Connections |  |
| FindShippingGateway | ShippingGatewaysForm | Admin/Integrations/Connections |  |

## HumanRes (2 forms)

| Screen XML | Form | Designed in | Implemented in |
| --- | --- | --- | --- |
| EditRateAmounts | CreateRateAmount | Projects/Projects/ProjectDetail/Money; Projects/Billing/Rates; People/Payroll/Rates | Projects/Projects/ProjectDetail/Money; Projects/Billing/Rates |
| EditRateAmounts | EditRateAmounts | Projects/Projects/ProjectDetail/Money; Projects/Billing/Rates; People/Payroll/Rates | Projects/Projects/ProjectDetail/Money; Projects/Billing/Rates |

## Manufacturing (23 forms)

| Screen XML | Form | Designed in | Implemented in |
| --- | --- | --- | --- |
| EditRun | UpdateRun | Manufacturing/WorkOrders/WorkOrderDetail; Manufacturing/WorkOrders/WorkOrderDetail/Overview | Manufacturing/WorkOrders/WorkOrderDetail/Overview (EditHeader: store#ProductionOrder, a draft only, P5a) |
| EditRun | NewNoteForm | Shared/Chatter; Manufacturing/Chatter; Manufacturing/WorkOrders/WorkOrderDetail | Manufacturing/WorkOrders/WorkOrderDetail/Notes (chatter on the run, P5a) |
| EditRun | UpdateNoteForm | Shared/Chatter; Manufacturing/Chatter; Manufacturing/WorkOrders/WorkOrderDetail | Manufacturing/WorkOrders/WorkOrderDetail/Notes (chatter on the run, P5a) |
| EditRun | AddEquipment | Manufacturing/WorkOrders/WorkOrderDetail/Overview; Manufacturing/WorkCenters/Equipment | Manufacturing/WorkOrders/WorkOrderDetail/Overview (AssignEquipment: store#ProductionEquipment, P5a) |
| EditRun | EquipmentList | Manufacturing/WorkOrders/WorkOrderDetail/Overview; Manufacturing/WorkCenters/Equipment | Manufacturing/WorkCenters/Equipment (the equipment at the user's facilities with its assigned operation); Manufacturing/WorkOrders/WorkOrderDetail/Overview (RunEquipment, with End, P5a) |
| EditRun | AddPartyAssignForm | Manufacturing/WorkOrders/WorkOrderDetail/Overview; Maintenance/WorkOrders/WorkOrderDetail | Manufacturing/WorkOrders/WorkOrderDetail/Overview (AssignPerson: store#ProductionParty, P5a) |
| EditRun | UpdateAssignForm | Manufacturing/WorkOrders/WorkOrderDetail/Overview; Maintenance/WorkOrders/WorkOrderDetail | Manufacturing/WorkOrders/WorkOrderDetail/Overview (RunPeople with Remove, P5a) |
| FindRun | NewRunForm | Manufacturing/WorkOrders/NewWorkOrder | Manufacturing/WorkOrders/NewWorkOrder (Identity, Method, Review: create#ProductionOrder); Manufacturing/WorkOrders/QuickCreate (P5a) |
| FindRun | RunList | Manufacturing/WorkOrders; Manufacturing/Home | Manufacturing/WorkOrders/Find (WorkOrderList: find#ProductionOrders, board, calendar, bulk, P5a); Manufacturing/Home (Summary, Queue and Kpis, P5b and P16); Manufacturing/Reports/WorkOrderStatusReport (StatusRows: get#ProductionStatusReport over find#ProductionOrders, with its CSV export, P16) |
| RunConsumed | IssueAssetForm | Shared/MaterialIssueReceipt; Manufacturing/WorkOrders/WorkOrderDetail/MaterialIssueReceipt; Maintenance/WorkOrders/MaterialIssueReceipt | Warehouse/Inventory/MaterialIssueReceipt (MaterialLines Issue: issue#ProductionMaterial, P16); Manufacturing/WorkOrders/WorkOrderDetail/MaterialIssueReceipt (Issue, and Backflush through issue#ProductionMaterial, Manufacturing P5b) |
| RunConsumed | ConsumeAssetForm | Shared/MaterialIssueReceipt; Manufacturing/WorkOrders/WorkOrderDetail/MaterialIssueReceipt; Maintenance/WorkOrders/MaterialIssueReceipt | Manufacturing/WorkOrders/WorkOrderDetail/MaterialIssueReceipt (Issue from a chosen asset, P5b) |
| RunConsumed | IssuedAssetForm | Shared/MaterialIssueReceipt; Manufacturing/WorkOrders/WorkOrderDetail/MaterialIssueReceipt; Maintenance/WorkOrders/MaterialIssueReceipt | Warehouse/Inventory/MaterialIssueReceipt (Posted issues and receipts, Unused returns, P16); Manufacturing/WorkOrders/WorkOrderDetail/MaterialIssueReceipt (Posted issues and receipts, Unused returns, Manufacturing P5b) |
| RunProduced | ReceiveAssetForm | Shared/MaterialIssueReceipt; Manufacturing/WorkOrders/WorkOrderDetail/MaterialIssueReceipt | Warehouse/Inventory/MaterialIssueReceipt (Output Receive: receive#ProductionOutput; Warehouse/Transfers/SubcontractShipmentDetail Output receipt: receive#SubcontractOutput, P16); Manufacturing/WorkOrders/WorkOrderDetail/MaterialIssueReceipt (Output Receive, Manufacturing P5b); a by-product at its co-product share of the frozen estimate (Manufacturing P15) |
| RunProduced | ReceivedAssetForm | Shared/MaterialIssueReceipt; Manufacturing/WorkOrders/WorkOrderDetail/MaterialIssueReceipt | Warehouse/Inventory/MaterialIssueReceipt (Tracking, P16); Manufacturing/WorkOrders/WorkOrderDetail/MaterialIssueReceipt (Tracking, Manufacturing P5b) |
| RunProducts | AddProduceForm | Manufacturing/WorkOrders/WorkOrderDetail/Quantities | Manufacturing/WorkOrders/WorkOrderDetail/Quantities AddOutput and ByProducts (a draft's secondary output or by-product: store#ProductionOutput, P7) |
| RunProducts | ReceiveAssetForm | Shared/MaterialIssueReceipt; Manufacturing/WorkOrders/WorkOrderDetail/MaterialIssueReceipt | Warehouse/Inventory/MaterialIssueReceipt (Output Receive: receive#ProductionOutput; Warehouse/Transfers/SubcontractShipmentDetail Output receipt: receive#SubcontractOutput, P16); Manufacturing/WorkOrders/WorkOrderDetail/MaterialIssueReceipt (Output Receive, Manufacturing P5b) |
| RunProducts | ProduceList | Manufacturing/WorkOrders/WorkOrderDetail/Quantities | Manufacturing/WorkOrders/WorkOrderDetail/Quantities OutputPlan (get#ProductionQuantities: target, good, held, loss, remaining, P7) |
| RunProducts | AddConsumeForm | Manufacturing/WorkOrders/WorkOrderDetail/Components; Maintenance/WorkOrders/WorkOrderDetail | Manufacturing/WorkOrders/WorkOrderDetail/Components (AddMaterial: store#ProductionMaterial, P5b) |
| RunProducts | IssueAssetForm | Shared/MaterialIssueReceipt; Manufacturing/WorkOrders/WorkOrderDetail/MaterialIssueReceipt; Maintenance/WorkOrders/MaterialIssueReceipt | Warehouse/Inventory/MaterialIssueReceipt (MaterialLines Issue: issue#ProductionMaterial, P16); Manufacturing/WorkOrders/WorkOrderDetail/MaterialIssueReceipt (Issue, Manufacturing P5b) |
| RunProducts | ConsumeList | Manufacturing/WorkOrders/WorkOrderDetail/Components; Maintenance/WorkOrders/WorkOrderDetail | Manufacturing/WorkOrders/WorkOrderDetail/Components (ComponentLines: get#ProductionMaterials, P5b; its Substitute dialog and the substitution requests: substitute#ProductionMaterial, P9) |
| ConsumeAsset | ConsumeAssetForm | Shared/MaterialIssueReceipt; Manufacturing/WorkOrders/WorkOrderDetail/MaterialIssueReceipt | Manufacturing/WorkOrders/WorkOrderDetail/MaterialIssueReceipt (Issue from a chosen asset, P5b) |
| ConsumeProduct | ConsumeAssetForm | Shared/MaterialIssueReceipt; Manufacturing/WorkOrders/WorkOrderDetail/MaterialIssueReceipt | Manufacturing/WorkOrders/WorkOrderDetail/MaterialIssueReceipt (Backflush: the lots chosen oldest expiry first, P5b) |
| ProduceAsset | ReceiveAssetForm | Shared/MaterialIssueReceipt; Manufacturing/WorkOrders/WorkOrderDetail/MaterialIssueReceipt | Warehouse/Inventory/MaterialIssueReceipt (Output Receive: receive#ProductionOutput; Warehouse/Transfers/SubcontractShipmentDetail Output receipt: receive#SubcontractOutput, P16); Manufacturing/WorkOrders/WorkOrderDetail/MaterialIssueReceipt (Output Receive, Manufacturing P5b) |

## Order (43 forms)

| Screen XML | Form | Designed in | Implemented in |
| --- | --- | --- | --- |
| FindOrder | CreateSalesOrder | Sales/Quotes/Quotes; Sales/Orders/Orders |  |
| FindOrder | ApproveOrdersForm | Purchasing/Orders/PurchaseOrders; Sales/Orders/Orders | Purchasing/Orders/PurchaseOrders (BulkApprove: decide#PurchaseApproval per order) (Purchasing P3) |
| FindOrder | CloseOrdersForm | Purchasing/Orders/PurchaseOrders; Sales/Orders/Orders | Purchasing/Orders/PurchaseOrders (BulkClose: close#PurchaseRemainders per order) (Purchasing P3) |
| FindOrder | CreatePurchaseOrder | Purchasing/Orders/PurchaseOrders | Purchasing/Orders/PurchaseOrders (CreatePurchaseOrder); Purchasing/NewPurchaseOrder (quick create) (Purchasing P3) |
| FindOrder | OrderList | Purchasing/Orders/PurchaseOrders; CustomerService/Orders/Orders; Sales/Quotes/Quotes; Sales/Orders/Orders | Purchasing/Orders/PurchaseOrders (PurchaseOrderList, views and saved finds) (Purchasing P3); Purchasing/Sourcing/Quotes (QuoteList, the quote statuses) (Purchasing P11) |
| OrderDetail | CloseOrderPartItems | Purchasing/Orders/OrderDetail; Shared/OrderDetail; Sales/Orders/OrderDetail | Shared/OrderDetail (Purchasing: ClosePurchaseRemainder) (Purchasing P3) |
| OrderDetail | AddPartForm | Purchasing/Orders/OrderDetail; Shared/OrderDetail; Sales/Orders/OrderDetail |  |
| OrderDetail | RecurOptions | Purchasing/Orders/OrderDetail; Shared/OrderDetail; Sales/Orders/OrderDetail; Sales/Agreements/RecurringOrders |  |
| OrderDetail | AuditLogList | Purchasing/Orders/OrderDetail; CustomerService/Orders/OrderDetail; Shared/OrderDetail; Sales/Orders/OrderDetail | Shared/OrderDetail (Purchasing: PurchaseOrderHistory) (Purchasing P3) |
| OrderDetail | HeaderForm | Purchasing/Orders/OrderDetail; CustomerService/Orders/OrderDetail; Shared/OrderDetail; Sales/Orders/OrderDetail | Shared/OrderDetail (Purchasing: the record header, EditPurchaseOrder) (Purchasing P3) |
| OrderDetail | AddPromoCode | Shared/OrderDetail; Sales/Orders/OrderDetail |  |
| OrderDetail | AddPartyPromoCode | Shared/OrderDetail; Sales/Orders/OrderDetail |  |
| OrderDetail | OrderPromoCodeList | Shared/OrderDetail; Sales/Orders/OrderDetail |  |
| OrderDetail | ItemLimitForm | Purchasing/Orders/OrderDetail; Shared/OrderDetail; Sales/Orders/OrderDetail |  |
| OrderDetail | NewNoteForm | Purchasing/Orders/OrderDetail; Shared/OrderDetail; Sales/Orders/OrderDetail; Shared/Chatter | Shared/Chatter (the order's record context on Purchasing/Orders/OrderDetail) (Purchasing P3) |
| OrderDetail | UpdateNoteForm | Purchasing/Orders/OrderDetail; Shared/OrderDetail; Sales/Orders/OrderDetail; Shared/Chatter | Shared/Chatter (the order's record context on Purchasing/Orders/OrderDetail) (Purchasing P3) |
| OrderDetail | NewContentForm | Purchasing/Orders/OrderDetail; Shared/OrderDetail; Sales/Orders/OrderDetail; Shared/RecordFiles | Shared/RecordFiles (the order's record context); Shared/OrderDetail (Purchasing: PurchaseOrderDocuments) (Purchasing P3) |
| OrderDetail | UpdateContentForm | Purchasing/Orders/OrderDetail; Shared/OrderDetail; Sales/Orders/OrderDetail; Shared/RecordFiles | Shared/RecordFiles (the order's record context) (Purchasing P3) |
| OrderDetail | SendPlacedEmailForm | Purchasing/Orders/OrderDetail; CustomerService/Orders/OrderDetail; Shared/OrderDetail; Sales/Orders/OrderDetail | Shared/OrderDetail (Purchasing: SendPurchaseOrder: send#PurchaseOrder) (Purchasing P3) |
| OrderDetail | EmailMessageList | Purchasing/Orders/OrderDetail; CustomerService/Orders/OrderDetail; Shared/OrderDetail; Sales/Orders/OrderDetail | Shared/OrderDetail (Purchasing: PurchaseOrderEmails) (Purchasing P3) |
| OrderDetail | SystemMessageList | Purchasing/Orders/OrderDetail; Shared/OrderDetail; Sales/Orders/OrderDetail |  |
| OrderDetail | ChildOrderList | Purchasing/Orders/OrderDetail; Shared/OrderDetail; Sales/Orders/OrderDetail |  |
| OrderDetail | AddOrderPartToShipmentForm | Purchasing/Orders/OrderDetail; Shared/OrderDetail; Sales/Orders/OrderDetail | Purchasing/Receiving/Receipts (PrepareReceipt, "Expected receipt (ASN)"); Purchasing/Orders/OrderDetail (Receipts and inspection) |
| OrderDetail | EditPartForm | Purchasing/Orders/OrderDetail; Shared/OrderDetail; Sales/Orders/OrderDetail | Shared/OrderDetail (Purchasing: EditPurchaseOrder: reference and receiving facility of a draft) (Purchasing P3) |
| OrderDetail | EditPartNonEdForm | Purchasing/Orders/OrderDetail; Shared/OrderDetail; Sales/Orders/OrderDetail | Purchasing/Orders/OrderChanges (ProposedOrder: delivery date and terms of a placed order); Shared/OrderDetail (Purchasing: RecordAcknowledgement, the supplier's reference and date) (Purchasing P9) |
| OrderDetail | CreateOrderPartParty | Purchasing/Orders/OrderDetail; Shared/OrderDetail; Sales/Orders/OrderDetail |  |
| OrderDetail | CloseOrderPartItems | Purchasing/Orders/OrderDetail; Shared/OrderDetail; Sales/Orders/OrderDetail | Shared/OrderDetail (Purchasing: ClosePurchaseRemainder) (Purchasing P3) |
| OrderDetail | AddPaymentForm | Shared/OrderDetail; Sales/Orders/OrderDetail |  |
| OrderDetail | UpdatePaymentForm | Shared/OrderDetail; Sales/Orders/OrderDetail |  |
| OrderDetail | GatewayAuthorizeForm | Shared/OrderDetail; Sales/Orders/OrderDetail |  |
| OrderDetail | GatewayResponseList | Shared/OrderDetail; Sales/Orders/OrderDetail |  |
| OrderDetail | SetOrderInfoForm | Purchasing/Orders/OrderDetail; Shared/OrderDetail; Sales/Orders/OrderDetail |  |
| OrderDetail | AddProductItemForm | Purchasing/Orders/OrderDetail; Shared/OrderDetail; Sales/Orders/OrderDetail | Shared/OrderDetail (Purchasing: AddPurchaseOrderLine) (Purchasing P3) |
| OrderDetail | AddOtherItemForm | Purchasing/Orders/OrderDetail; Shared/OrderDetail; Sales/Orders/OrderDetail |  |
| OrderDetail | OrderItems | Purchasing/Orders/OrderDetail; CustomerService/Orders/OrderDetail; Shared/OrderDetail; Sales/Orders/OrderDetail | Shared/OrderDetail (Purchasing: PurchaseOrderLines) (Purchasing P3) |
| EditItem | EditOrderItem | Purchasing/Orders/OrderDetail; Shared/OrderDetail; Sales/Orders/OrderDetail | Shared/OrderDetail (Purchasing: EditPurchaseOrderLine) (Purchasing P3) |
| ItemReserve | ReserveItem | Shared/OrderDetail; Sales/Orders/OrderDetail |  |
| ReturnItem | ReturnItem | CustomerService/Returns/NewReturn; CustomerService/Returns/ReturnDetail; Shared/ReturnDetail |  |
| OrderItems | AddProductItemForm | Purchasing/Orders/OrderDetail; Shared/OrderDetail; Sales/Orders/OrderDetail | Shared/OrderDetail (Purchasing: AddPurchaseOrderLine) (Purchasing P3) |
| OrderItems | AddOtherItemForm | Purchasing/Orders/OrderDetail; Shared/OrderDetail; Sales/Orders/OrderDetail |  |
| OrderItems | OrderItems | Purchasing/Orders/OrderDetail; Shared/OrderDetail; Sales/Orders/OrderDetail | Shared/OrderDetail (Purchasing: PurchaseOrderLines) (Purchasing P3) |
| QuickItems | QuickItemOptions | Shared/OrderDetail; Sales/Orders/OrderDetail |  |
| QuickItems | QuickItemList | Shared/OrderDetail; Sales/Orders/OrderDetail |  |

## Party (105 forms)

| Screen XML | Form | Designed in | Implemented in |
| --- | --- | --- | --- |
| EditParty | CreateUserAccount | Admin/Users/Users |  |
| EditParty | ConvertToPersonForm |  |  |
| EditParty | ConvertToOrganizationForm |  |  |
| EditParty | EditOrganizationForm | Commons/Contacts/ContactDetail; Purchasing/Suppliers/Supplier360; Shared/Customer360; Shared/Supplier360; People/Employees/OrgStructure; Sales/Accounts/Customer360; Sales/Accounts/ContactDetail; Marketing/Contacts/ContactDetail; Marketing/Customers/Customer360; Admin/Settings/OrganizationDetail | Commons/Contacts/ContactDetail; Commons/Contacts/List |
| EditParty | EditPersonForm | Commons/Contacts/ContactDetail; Purchasing/Suppliers/Supplier360; Shared/Customer360; Shared/Supplier360; People/Employees/Employee360; Sales/Accounts/Customer360; Sales/Accounts/ContactDetail; Marketing/Contacts/ContactDetail; Marketing/Customers/Customer360 | Commons/Contacts/ContactDetail; Commons/Contacts/List |
| EditParty | AddDirectRoleForm | Purchasing/Suppliers/Supplier360; Shared/Customer360; Shared/Supplier360; Sales/Accounts/Customer360 | — (other apps' contexts on Customer360, §7) |
| EditParty | AddOtherRoleForm | Purchasing/Suppliers/Supplier360; Shared/Customer360; Shared/Supplier360; Sales/Accounts/Customer360 | — (other apps' contexts on Customer360, §7) |
| EditParty | RolesForm | Purchasing/Suppliers/Supplier360; Shared/Customer360; Shared/Supplier360; Sales/Accounts/Customer360 | — (other apps' contexts on Customer360, §7) |
| EditParty | SetClassificationForm | Purchasing/Suppliers/Supplier360; Shared/Customer360; Shared/Supplier360; Sales/Accounts/Customer360 | Shared/Supplier360/Buying (SupplierCategory); Purchasing/Suppliers/SupplierList (BulkCategory); — (other apps' contexts on Customer360, §7) |
| EditParty | ClassificationsForm | Purchasing/Suppliers/Supplier360; Shared/Customer360; Shared/Supplier360; Sales/Accounts/Customer360 | Shared/Supplier360/Buying (Category); — (other apps' contexts on Customer360, §7) |
| EditParty | AddIdentificationForm | Purchasing/Suppliers/Supplier360; People/Employees/Employee360 | — (Accounting/Payables/Supplier360 edits; Shared/Supplier360/Finance reads) |
| EditParty | IdentificationsForm | Purchasing/Suppliers/Supplier360; People/Employees/Employee360 | Shared/Supplier360/Finance (SupplierIdentifications) |
| EditParty | AddSettingForm | Admin/Settings/OrganizationDetail |  |
| EditParty | AddSettingTextForm | Admin/Settings/OrganizationDetail |  |
| EditParty | SettingsForm | Admin/Settings/OrganizationDetail |  |
| EditParty | UpdateUserAccount | Admin/Users/UserDetail |  |
| EditParty | AddGroupForm | Admin/Users/UserDetail |  |
| EditParty | GroupsForm | Admin/Users/UserDetail |  |
| EditParty | NewToRelForm | Shared/Customer360; Shared/Supplier360 | — (other apps' contexts on Customer360, §7) |
| EditParty | UserOrgRelList | Shared/Customer360; Shared/Supplier360 | — (other apps' contexts on Customer360, §7) |
| EditParty | AddSalesAccount | Shared/Customer360; Shared/Supplier360; Sales/Accounts/Customer360 | — (other apps' contexts on Customer360, §7) |
| EditParty | AccountRelList | Shared/Customer360; Shared/Supplier360; Sales/Accounts/Customer360 | — (other apps' contexts on Customer360, §7) |
| EditParty | AddContactAssignForm | Purchasing/Suppliers/Supplier360; Shared/Customer360; Shared/Supplier360; Sales/Accounts/Customer360 | — (other apps' contexts on Customer360, §7) |
| EditParty | CreateContactForm | Purchasing/Suppliers/Supplier360; Shared/Customer360; Shared/Supplier360; Sales/Accounts/Customer360 | — (other apps' contexts on Customer360, §7) |
| EditParty | ContactRelList | Purchasing/Suppliers/Supplier360; Shared/Customer360; Shared/Supplier360; Sales/Accounts/Customer360 | — (other apps' contexts on Customer360, §7) |
| EditParty | AddParentAccount | Shared/Customer360; Shared/Supplier360; Sales/Accounts/Customer360 | — (other apps' contexts on Customer360, §7) |
| EditParty | ParentAccountRelList | Shared/Customer360; Shared/Supplier360; Sales/Accounts/Customer360 | — (other apps' contexts on Customer360, §7) |
| EditParty | AddChildAccount | Shared/Customer360; Shared/Supplier360; Sales/Accounts/Customer360 | — (other apps' contexts on Customer360, §7) |
| EditParty | ChildAccountRelList | Shared/Customer360; Shared/Supplier360; Sales/Accounts/Customer360 | — (other apps' contexts on Customer360, §7) |
| EditParty | NewNoteForm | Commons/Contacts/ContactDetail; Shared/Chatter; Purchasing/Suppliers/Supplier360; People/Employees/Employee360; Sales/Accounts/Customer360; Sales/Accounts/ContactDetail; Marketing/Contacts/ContactDetail; Marketing/Customers/Customer360 | Commons/Contacts/ContactDetail; Commons/Contacts/List; Shared/Chatter |
| EditParty | UpdateNoteForm | Commons/Contacts/ContactDetail; Shared/Chatter; Purchasing/Suppliers/Supplier360; People/Employees/Employee360; Sales/Accounts/Customer360; Sales/Accounts/ContactDetail; Marketing/Contacts/ContactDetail; Marketing/Customers/Customer360 | Commons/Contacts/ContactDetail; Commons/Contacts/List; Shared/Chatter |
| EditParty | OtherCreateForm | Commons/Contacts/ContactDetail; Purchasing/Suppliers/Supplier360; People/Employees/Employee360; Sales/Accounts/Customer360; Sales/Accounts/ContactDetail; Marketing/Contacts/ContactDetail | Commons/Contacts/ContactDetail; Commons/Contacts/List |
| EditParty | PhonePurposeForm | Commons/Contacts/ContactDetail; Purchasing/Suppliers/Supplier360; People/Employees/Employee360; Sales/Accounts/Customer360; Sales/Accounts/ContactDetail; Marketing/Contacts/ContactDetail | Commons/Contacts/ContactDetail; Commons/Contacts/List |
| EditParty | EmailPurposeForm | Commons/Contacts/ContactDetail; Purchasing/Suppliers/Supplier360; People/Employees/Employee360; Sales/Accounts/Customer360; Sales/Accounts/ContactDetail; Marketing/Contacts/ContactDetail | Commons/Contacts/ContactDetail; Commons/Contacts/List |
| EditParty | WebPurposeForm | Commons/Contacts/ContactDetail; Purchasing/Suppliers/Supplier360; People/Employees/Employee360; Sales/Accounts/Customer360; Sales/Accounts/ContactDetail; Marketing/Contacts/ContactDetail | Commons/Contacts/ContactDetail; Commons/Contacts/List |
| EditParty | OtherUpdateForm | Commons/Contacts/ContactDetail; Purchasing/Suppliers/Supplier360; People/Employees/Employee360; Sales/Accounts/Customer360; Sales/Accounts/ContactDetail; Marketing/Contacts/ContactDetail | Commons/Contacts/ContactDetail; Commons/Contacts/List |
| EditParty | OtherPurposeForm | Commons/Contacts/ContactDetail; Purchasing/Suppliers/Supplier360; People/Employees/Employee360; Sales/Accounts/Customer360; Sales/Accounts/ContactDetail; Marketing/Contacts/ContactDetail | Commons/Contacts/ContactDetail; Commons/Contacts/List |
| EditParty | PostalPurposeForm | Commons/Contacts/ContactDetail; Purchasing/Suppliers/Supplier360; People/Employees/Employee360; Sales/Accounts/Customer360; Sales/Accounts/ContactDetail; Marketing/Contacts/ContactDetail | Commons/Contacts/ContactDetail; Commons/Contacts/List |
| EditParty | FinancialAccountList | Accounting/Banking/FinancialAccounts | Accounting/Banking/FinancialAccounts#FinancialAccounts |
| EditParty | NewContentForm | Commons/Contacts/ContactDetail; Shared/RecordFiles; Purchasing/Suppliers/Supplier360; People/Employees/Employee360; Sales/Accounts/Customer360; Sales/Accounts/ContactDetail; Marketing/Contacts/ContactDetail; Marketing/Customers/Customer360 | Commons/Contacts/ContactDetail; Commons/Contacts/List; Shared/RecordFiles |
| EditParty | UpdateContentForm | Commons/Contacts/ContactDetail; Shared/RecordFiles; Purchasing/Suppliers/Supplier360; People/Employees/Employee360; Sales/Accounts/Customer360; Sales/Accounts/ContactDetail; Marketing/Contacts/ContactDetail; Marketing/Customers/Customer360 | Commons/Contacts/ContactDetail; Commons/Contacts/List; Shared/RecordFiles |
| ExpiredContactOther | PcmListForm | Commons/Contacts/ContactDetail; Marketing/Contacts/ContactDetail | Commons/Contacts/ContactDetail; Commons/Contacts/List |
| ExpiredContactOther | PcmTelecomListForm | Commons/Contacts/ContactDetail; Marketing/Contacts/ContactDetail | Commons/Contacts/ContactDetail; Commons/Contacts/List |
| ExpiredPostal | PcmListForm | Commons/Contacts/ContactDetail; Marketing/Contacts/ContactDetail | Commons/Contacts/ContactDetail; Commons/Contacts/List |
| FindDuplicates | DupPartyList | Commons/Contacts/Duplicates; Sales/Accounts/MergeAccounts | Commons/Contacts/Duplicates |
| UpdateContactInfo | UpdateContactInfo | Commons/Contacts/ContactDetail; Marketing/Contacts/ContactDetail | Commons/Contacts/ContactDetail; Commons/Contacts/List |
| UpdatePaymentMethodInfo | PaymentMethodInfoForm | Accounting/Settings/PaymentMethods | Accounting/Settings/PaymentMethods#NewMethod and EditMethod |
| FinancialInfo | UnpaidInvoiceList | Accounting/Receivables/Customer360; Shared/Customer360; Sales/Accounts/Customer360 | Accounting/Receivables/Customer360/Money#CustomerInvoices |
| FinancialInfo | PaymentList | Accounting/Receivables/Customer360; Shared/Customer360; Sales/Accounts/Customer360 | Accounting/Receivables/Customer360/Money#CustomerReceipts |
| FinancialInfo | OrderList | Accounting/Receivables/Customer360; Shared/Customer360; Sales/Accounts/Customer360 | Accounting/Receivables/Customer360/Orders#CustomerOrders |
| FinancialInfo | UnpaidPayablesList | Purchasing/Suppliers/Supplier360; Accounting/Payables/Supplier360; Shared/Supplier360 | Accounting/Payables/Supplier360/Bills#SupplierBills; Shared/Supplier360/Bills (SupplierBillRows; the unpaid summary for a finance reader) (Purchasing P6) |
| FinancialInfo | OutgoingPaymentList | Purchasing/Suppliers/Supplier360; Accounting/Payables/Supplier360; Shared/Supplier360 | Accounting/Payables/Supplier360/Bills#SupplierPayments; — Purchasing: the unpaid summary only (Shared/Supplier360/Bills); payments are Accounting's Supplier360 (Purchasing P6); Purchasing/Performance/SupplierStatement#SupplierStatementRows, a finance reader's (Purchasing P15) |
| FinancialInfo | PurchaseOrderList | Purchasing/Suppliers/Supplier360; Accounting/Payables/Supplier360; Shared/Supplier360 | — (not built; Accounting/Payables/Supplier360 lists bills and payments, not purchase orders) |
| FinancialInfo | PaidInvoiceList | Accounting/Receivables/Customer360; Shared/Customer360; Sales/Accounts/Customer360 | Accounting/Receivables/Customer360/Money#CustomerInvoices |
| FinancialInfo | PaidPayablesList | Purchasing/Suppliers/Supplier360; Accounting/Payables/Supplier360; Shared/Supplier360 | Accounting/Payables/Supplier360/Bills#SupplierBills; Shared/Supplier360/Bills (SupplierBillRows) (Purchasing P6); Purchasing/Performance/SupplierStatement#SupplierStatementRows (Purchasing P15) |
| FindParty | CreatePersonForm | Commons/QuickCreate | Commons/QuickCreate |
| FindParty | CreatePersonCustForm |  |  |
| FindParty | CreateEmployeeForm | People/Employees/HireEmployee |  |
| FindParty | CreateOrganizationForm | Commons/QuickCreate | Commons/QuickCreate |
| FindParty | CreateAccountForm |  |  |
| FindParty | CreateContactForm | Commons/QuickCreate | Commons/QuickCreate |
| FindParty | OuterSearchForm | Commons/Contacts; People/Employees | Commons/Contacts/List |
| FindParty | PartyListForm | Commons/Contacts; People/Employees | Commons/Contacts/List |
| EditAgreement | EditAgreement | Purchasing/Agreements/AgreementDetail; Sales/Agreements/AgreementDetail | Purchasing/Agreements/AgreementDetail (EditAgreement) |
| EditAgreement | AddSettlementTerm | Purchasing/Agreements/AgreementDetail; Sales/Agreements/AgreementDetail | Purchasing/Agreements/AgreementDetail (AddAgreementTerm) |
| EditAgreement | AddOtherTerm | Purchasing/Agreements/AgreementDetail; Sales/Agreements/AgreementDetail | Purchasing/Agreements/AgreementDetail (AddAgreementTerm) |
| EditAgreement | AgreementTermList | Purchasing/Agreements/AgreementDetail; Sales/Agreements/AgreementDetail | Purchasing/Agreements/AgreementDetail (AgreementTerms) |
| EditAgreement | AddAgreementItem | Purchasing/Agreements/AgreementDetail; Sales/Agreements/AgreementDetail | Purchasing/Agreements/AgreementDetail (AddAgreementItem) |
| EditAgreement | AgreementItemList | Purchasing/Agreements/AgreementDetail; Sales/Agreements/AgreementDetail | Purchasing/Agreements/AgreementDetail (AgreementItems) |
| EditAgreement | NewContentForm | Purchasing/Agreements/AgreementDetail; Sales/Agreements/AgreementDetail; Shared/RecordFiles | Purchasing/Agreements/AgreementDetail (AgreementUploadFile) |
| EditAgreement | UpdateContentForm | Purchasing/Agreements/AgreementDetail; Sales/Agreements/AgreementDetail; Shared/RecordFiles |  |
| FindAgreement | NewAgreement | Purchasing/Agreements; Sales/Agreements/Agreements | Purchasing/Agreements/AgreementList (NewAgreement) |
| FindAgreement | AgreementList | Purchasing/Agreements; Sales/Agreements/Agreements | Purchasing/Agreements/AgreementList (AgreementFind, AgreementList) |
| PartyEmails | EmailMessageList | Comms/Inbox/MessageDetail; Shared/Chatter | Comms/Inbox/MessageDetail; Shared/Chatter |
| PartyProjects | AddUserAssignForm | Projects/Projects/ProjectDetail/Team; Projects/Resources/PersonDetail | Projects/Projects/ProjectDetail/Team; Projects/Resources/PersonDetail |
| PartyProjects | UpdateUserAssignForm | Projects/Projects/ProjectDetail/Team; Projects/Resources/PersonDetail | Projects/Projects/ProjectDetail/Team; Projects/Resources/PersonDetail |
| PartyRelated | NewToRelForm | Commons/Contacts/ContactDetail; People/Employees/OrgStructure; Marketing/Contacts/ContactDetail | Commons/Contacts/ContactDetail; Commons/Contacts/List |
| PartyRelated | NewFromRelForm | Commons/Contacts/ContactDetail; People/Employees/OrgStructure; Marketing/Contacts/ContactDetail | Commons/Contacts/ContactDetail; Commons/Contacts/List |
| PartyRelated | ToRelationshipForm | Commons/Contacts/ContactDetail; People/Employees/OrgStructure; Marketing/Contacts/ContactDetail | Commons/Contacts/ContactDetail; Commons/Contacts/List |
| PartyRelated | FromRelationshipForm | Commons/Contacts/ContactDetail; People/Employees/OrgStructure; Marketing/Contacts/ContactDetail | Commons/Contacts/ContactDetail; Commons/Contacts/List |
| PartyRequests | AddUserForm | Projects/Requests/RequestDetail | Projects/Requests/RequestDetail |
| PartyRequests | UpdateUserForm | Projects/Requests/RequestDetail | Projects/Requests/RequestDetail |
| PartyTasks | AddUserAssignForm | Projects/WorkItems/WorkItemDetail; Projects/Resources/PersonDetail | Projects/WorkItems/WorkItemDetail; Projects/Resources/PersonDetail |
| PartyTasks | UpdateUserAssignForm | Projects/WorkItems/WorkItemDetail; Projects/Resources/PersonDetail | Projects/WorkItems/WorkItemDetail; Projects/Resources/PersonDetail |
| PartyTimeEntries | ClockInForm | Projects/Time/TimeEntries; People/Time/TimeEntries |  |
| PartyTimeEntries | WorkerInvoice | Projects/Billing/Unbilled |  |
| PartyTimeEntries | TimeEntryList | Projects/Time/TimeEntries; Projects/Resources/PersonDetail; People/Time/TimeEntries | Projects/Time/TimeEntries; Projects/Resources/PersonDetail |
| EditTimeEntry | AddTimeForm | Projects/QuickCreate; Projects/WorkItems/WorkItemDetail; Projects/Time/MyTime; Projects/Time/TimeEntries; People/Time/MyTime; People/Time/TimeEntries | Projects/QuickCreate; Projects/WorkItems/WorkItemDetail; Projects/Time/MyTime; Projects/Time/TimeEntries |
| EditPaymentMethod | PaymentMethodInfoForm | Accounting/Banking/BankAccountDetail; Accounting/Settings/PaymentMethods | Accounting/Banking/BankAccountDetail (record header) |
| EditPaymentMethod | NewContentForm | Accounting/Banking/BankAccountDetail; Accounting/Settings/PaymentMethods | — (not built; BankAccountDetail has no files) |
| EditPaymentMethod | UpdateContentForm | Accounting/Banking/BankAccountDetail; Accounting/Settings/PaymentMethods | — (not built; BankAccountDetail has no files) |
| EditPaymentMethod | UpdateBankAccountMutable | Accounting/Banking/BankAccountDetail; Accounting/Settings/PaymentMethods | — (not built; a bank account is described when added, Accounting/Banking/BankAccounts#AddBankAccount) |
| EditPaymentMethod | UpdatePaymentMethodMutable | Accounting/Banking/BankAccountDetail; Accounting/Settings/PaymentMethods | Accounting/Settings/PaymentMethods#EditMethod |
| PaymentGatewayResponses | GatewayResponseList | Accounting/Payments/GatewayTransactions | Accounting/Payments/GatewayTransactions#GatewayTransactionResults |
| PaymentMethodChecks | CheckList | Accounting/Banking/BankAccountDetail; Accounting/Payables/PaymentRunDetail | Accounting/Payables/PaymentRunDetail |
| PaymentMethodFiles | GenerateNachaFile | Accounting/Banking/BankAccountDetail; Accounting/Payables/PaymentRunDetail | Accounting/Payables/PaymentRunDetail |
| PaymentMethodFiles | GeneratePosPayFile | Accounting/Banking/BankAccountDetail; Accounting/Payables/PaymentRunDetail | Accounting/Payables/PaymentRunDetail |
| PaymentMethodFiles | FileList | Accounting/Banking/BankAccountDetail; Accounting/Payables/PaymentRunDetail | Accounting/Payables/PaymentRunDetail |
| PaymentMethodTrans | AddTransForm | Accounting/Banking/BankAccountDetail; Accounting/Banking/ReconciliationDetail | Accounting/Banking/BankAccountDetail#AddBankLine |
| PaymentMethodTrans | UploadOfxV1Form | Accounting/Banking/StatementImport | Accounting/Banking/StatementImport#StatementFile |
| PaymentMethodTrans | UploadBaiV2Form | Accounting/Banking/StatementImport | Accounting/Banking/StatementImport#StatementFile |
| PaymentMethodTrans | AutoMatchReconcileForm | Accounting/Banking/ReconciliationDetail; Accounting/Banking/BankAccountDetail | Accounting/Banking/BankAccountDetail (Match automatically) |
| PaymentMethodTrans | TransList | Accounting/Banking/BankAccountDetail; Accounting/Banking/ReconciliationDetail | Accounting/Banking/BankAccountDetail#BankLines; Accounting/Banking/ReconciliationDetail#StatementLines |
| PaymentMethodTrans | ManRecForm | Accounting/Banking/ReconciliationDetail; Accounting/Banking/BankAccountDetail | Accounting/Banking/BankAccountDetail#ReconcileLine; Accounting/Banking/ReconciliationDetail#MatchLine |
| CreatePayment | CreatePaymentForm | Accounting/Payments/Payments | Accounting/Payments/Payments#PaymentDraft; Accounting/QuickCreate/NewPayment#PaymentDraft |

## ProductStore (34 forms)

| Screen XML | Form | Designed in | Implemented in |
| --- | --- | --- | --- |
| EditProductStore | CloneProductStoreForm | Commerce/Stores/StoreDetail |  |
| EditProductStore | EditStoreForm | Commerce/Stores/StoreDetail |  |
| EditProductStore | NewShippingOptionForm | Commerce/Settings/CheckoutSettings |  |
| EditProductStore | ShipOptionsForm | Commerce/Settings/CheckoutSettings |  |
| EditProductStore | NewShippingGatewayForm | Commerce/Settings/CheckoutSettings |  |
| EditProductStore | ShippingGatewaysForm | Commerce/Settings/CheckoutSettings |  |
| EditProductStore | NewPaymentGatewayForm | Commerce/Settings/CheckoutSettings |  |
| EditProductStore | PaymentGatewayForm | Commerce/Settings/CheckoutSettings |  |
| EditProductStore | NewStoreDataDocumentForm | Commerce/Stores/StoreDetail |  |
| EditProductStore | StoreDataDocumentForm | Commerce/Stores/StoreDetail |  |
| FindProductStore | NewStoreForm | Commerce/Stores |  |
| FindProductStore | StoresForm | Commerce/Stores |  |
| FindProductStoreCategory | NewStoreCategoryForm | Commerce/Merchandising/StoreCategories |  |
| FindProductStoreCategory | StoreCategoriesForm | Commerce/Merchandising/StoreCategories |  |
| FindProductStoreEmails | NewStoreEmailForm | Commerce/Stores/StoreDetail |  |
| FindProductStoreEmails | StoreEmailsForm | Commerce/Stores/StoreDetail |  |
| FindProductStoreFacility | NewStoreFacilityForm | Commerce/Stores/StoreDetail |  |
| FindProductStoreFacility | StoreFacilityFormList | Commerce/Stores/StoreDetail |  |
| FindProductStoreParty | NewStorePartyForm | Commerce/Stores/StoreDetail |  |
| FindProductStoreParty | StorePartyFormList | Commerce/Stores/StoreDetail |  |
| FindProductStoreSettings | SelectStoreSettingForm | Commerce/Stores/StoreDetail |  |
| FindProductStoreSettings | NewStoreSettingForm | Commerce/Stores/StoreDetail |  |
| FindProductStoreSettings | StoreSettingsForm | Commerce/Stores/StoreDetail |  |
| EditPromotion | EditPromotionForm | Shared/PromotionDetail; Commerce/Promotions/PromotionDetail; Marketing/Promotions/PromotionDetail |  |
| EditPromotion | PromoParameterForm | Shared/PromotionDetail; Commerce/Promotions/PromotionDetail; Marketing/Promotions/PromotionDetail |  |
| EditPromotion | AddProductForm | Shared/PromotionDetail; Commerce/Promotions/PromotionDetail; Marketing/Promotions/PromotionDetail |  |
| EditPromotion | ProductsForm | Shared/PromotionDetail; Commerce/Promotions/PromotionDetail; Marketing/Promotions/PromotionDetail |  |
| FindPromotion | NewPromotionForm | Shared/Promotions; Commerce/Promotions; Marketing/Promotions |  |
| FindPromotion | PromotionsForm | Shared/Promotions; Commerce/Promotions; Marketing/Promotions |  |
| EditPromoCode | EditPromoCodeForm | Shared/PromoCodeDetail; Commerce/Promotions/PromoCodes/PromoCodeDetail; Marketing/Promotions/PromoCodes/PromoCodeDetail |  |
| EditPromoCode | NewPromoCodePartyForm | Shared/PromoCodeDetail; Commerce/Promotions/PromoCodes/PromoCodeDetail; Marketing/Promotions/PromoCodes/PromoCodeDetail |  |
| EditPromoCode | PromoCodePartyForm | Shared/PromoCodeDetail; Commerce/Promotions/PromoCodes/PromoCodeDetail; Marketing/Promotions/PromoCodes/PromoCodeDetail |  |
| FindPromoCode | NewPromoCodeForm | Shared/PromoCodes; Commerce/Promotions/PromoCodes; Marketing/Promotions/PromoCodes |  |
| FindPromoCode | PromoCodeForm | Shared/PromoCodes; Commerce/Promotions/PromoCodes; Marketing/Promotions/PromoCodes |  |

## Project (26 forms)

| Screen XML | Form | Designed in | Implemented in |
| --- | --- | --- | --- |
| EditMilestones | CreateMilestoneForm | Projects/Projects/Roadmap | Projects/Projects/Roadmap |
| EditMilestones | MilestoneList | Projects/Projects/Roadmap; Projects/Projects/MilestoneDetail | Projects/Projects/Roadmap; Projects/Projects/MilestoneDetail |
| EditProject | CloneProject | Projects/Projects/NewProject; Projects/Projects/ProjectDetail; Projects/Projects/ProjectDetail/Settings; Projects/Settings/Templates | Projects/Projects/NewProject; Projects/Projects/ProjectDetail; Projects/Projects/ProjectDetail/Settings; Projects/Settings/Templates |
| EditProject | EditProject | Projects/Projects/ProjectDetail/Overview; Projects/Projects/ProjectDetail/Money; Projects/Projects/ProjectDetail/Settings | Projects/Projects/ProjectDetail/Overview; Projects/Projects/ProjectDetail/Money; Projects/Projects/ProjectDetail/Settings |
| EditRepositories | AddRepositoryForm | Projects/Projects/ProjectDetail/Code; Projects/Code/Repositories | Projects/Projects/ProjectDetail/Code; Projects/Code/Repositories |
| EditRepositories | CreateRepositoryForm | Projects/Projects/ProjectDetail/Code; Projects/Code/Repositories | Projects/Projects/ProjectDetail/Code; Projects/Code/Repositories |
| EditRepositories | RepositoryList | Projects/Projects/ProjectDetail/Code; Projects/Code/Repositories | Projects/Projects/ProjectDetail/Code; Projects/Code/Repositories |
| EditRepositories | ProjectRefList | Projects/Projects/ProjectDetail/Code; Projects/Code/RepositoryDetail/Tags | Projects/Projects/ProjectDetail/Code; Projects/Code/RepositoryDetail/Tags |
| EditUsers | AddUserAssignForm | Projects/Projects/NewProject; Projects/Projects/ProjectDetail/Team | Projects/Projects/NewProject; Projects/Projects/ProjectDetail/Team |
| EditUsers | UpdateUserAssignForm | Projects/Projects/ProjectDetail/Team | Projects/Projects/ProjectDetail/Team |
| EditWikiPages | AddWpweForm | Projects/Projects/ProjectDetail/Docs | Projects/Projects/ProjectDetail/Docs |
| EditWikiPages | DeleteWpweForm | Projects/Projects/ProjectDetail/Docs | Projects/Projects/ProjectDetail/Docs |
| FindProject | NewProject | Projects/QuickCreate; Projects/Projects/NewProject | Projects/QuickProject; Projects/Projects/NewProject |
| FindProject | ListProjects | Projects/Projects | Projects/Projects/List |
| MilestoneSummary | InactiveTaskList | Projects/Projects/MilestoneDetail | Projects/Projects/MilestoneDetail |
| MilestoneSummary | ActiveTaskList | Projects/Projects/MilestoneDetail | Projects/Projects/MilestoneDetail |
| MilestoneSummary | DoneTaskList | Projects/Projects/MilestoneDetail | Projects/Projects/MilestoneDetail |
| ProjectProgressReport | ChildStatsListDays | Projects/Reports/Progress; Projects/Projects/ProjectDetail/Overview | Projects/Reports/Progress; Projects/Projects/ProjectDetail/Overview |
| ProjectProgressReport | MilestoneStatsList | Projects/Projects/MilestoneDetail; Projects/Reports/Progress | Projects/Projects/MilestoneDetail; Projects/Reports/Progress |
| ProjectSummary | ViewProject | Projects/Projects/ProjectDetail; Projects/Projects/ProjectDetail/Overview | Projects/Projects/ProjectDetail; Projects/Projects/ProjectDetail/Overview |
| ProjectSummary | MilestoneList | Projects/Projects/ProjectDetail/Overview; Projects/Projects/Roadmap | Projects/Projects/ProjectDetail/Overview; Projects/Projects/Roadmap |
| ProjectSummary | ViewWpweForm | Projects/Projects/ProjectDetail/Docs | Projects/Projects/ProjectDetail/Docs |
| ProjectSummary | ViewUserAssignForm | Projects/Projects/ProjectDetail/Overview | Projects/Projects/ProjectDetail/Overview |
| ProjectSummary | ViewGitRepositoryList | Projects/Projects/ProjectDetail/Overview | Projects/Projects/ProjectDetail/Overview |
| ProjectSummary | ViewGitTagList | Projects/Projects/ProjectDetail/Code; Projects/Code/RepositoryDetail/Tags | Projects/Projects/ProjectDetail/Code; Projects/Code/RepositoryDetail/Tags |
| ProjectTimeEntries | TimeEntryListForm | Projects/Projects/ProjectDetail/Time; Projects/Time/TimeEntries | Projects/Projects/ProjectDetail/Time; Projects/Time/TimeEntries |

## Request (22 forms)

| Screen XML | Form | Designed in | Implemented in |
| --- | --- | --- | --- |
| EditRequest | EditRequest | Projects/Requests/RequestDetail; Purchasing/Requests/RequestDetail; CustomerService/Cases/CaseDetail; Maintenance/Requests/RequestDetail; Sales/Quotes/QuoteRequestDetail | Projects/Requests/RequestDetail |
| EditRequest | AddCommentForm | Commons/Requests/RequestDetail; Projects/Requests/RequestDetail; Shared/Chatter; Purchasing/Requests/RequestDetail; CustomerService/Cases/CaseDetail; Maintenance/Chatter; Maintenance/Requests/RequestDetail; Sales/Quotes/QuoteRequestDetail | Commons/Requests/RequestDetail; Shared/Chatter; Projects/Requests/RequestDetail; Purchasing/Requests/RequestDetail |
| EditRequest | AddPartyForm | Projects/Requests/RequestDetail; Purchasing/Requests/RequestDetail; CustomerService/Cases/CaseDetail; Maintenance/Requests/RequestDetail; Sales/Quotes/QuoteRequestDetail | Projects/Requests/RequestDetail |
| EditRequest | UpdatePartyForm | Projects/Requests/RequestDetail; Purchasing/Requests/RequestDetail; CustomerService/Cases/CaseDetail; Maintenance/Requests/RequestDetail; Sales/Quotes/QuoteRequestDetail | Projects/Requests/RequestDetail |
| EditRequest | NewNoteForm | Commons/Requests/RequestDetail; Projects/Requests/RequestDetail; Shared/Chatter; Purchasing/Requests/RequestDetail; CustomerService/Cases/CaseDetail; Maintenance/Chatter; Maintenance/Requests/RequestDetail; Sales/Quotes/QuoteRequestDetail | Commons/Requests/RequestDetail; Shared/Chatter; Projects/Requests/RequestDetail; Purchasing/Requests/RequestDetail |
| EditRequest | UpdateNoteForm | Commons/Requests/RequestDetail; Projects/Requests/RequestDetail; Shared/Chatter; Purchasing/Requests/RequestDetail; CustomerService/Cases/CaseDetail; Maintenance/Chatter; Maintenance/Requests/RequestDetail; Sales/Quotes/QuoteRequestDetail | Commons/Requests/RequestDetail; Shared/Chatter; Projects/Requests/RequestDetail; Purchasing/Requests/RequestDetail |
| EditRequest | NewContentForm | Commons/Requests/RequestDetail; Projects/Requests/RequestDetail; Shared/RecordFiles; Purchasing/Requests/RequestDetail; CustomerService/Cases/CaseDetail; Maintenance/RecordFiles; Maintenance/Requests/RequestDetail; Sales/Quotes/QuoteRequestDetail | Commons/Requests/RequestDetail; Shared/RecordFiles; Projects/Requests/RequestDetail; Purchasing/Requests/RequestDetail |
| EditRequest | UpdateContentForm | Commons/Requests/RequestDetail; Projects/Requests/RequestDetail; Shared/RecordFiles; Purchasing/Requests/RequestDetail; CustomerService/Cases/CaseDetail; Maintenance/RecordFiles; Maintenance/Requests/RequestDetail; Sales/Quotes/QuoteRequestDetail | Commons/Requests/RequestDetail; Shared/RecordFiles; Projects/Requests/RequestDetail; Purchasing/Requests/RequestDetail |
| EditRequest | RequestTaskList | Commons/Requests/RequestDetail; Projects/Requests/RequestDetail; Purchasing/Requests/RequestDetail; CustomerService/Cases/CaseDetail; Maintenance/Requests/RequestDetail; Sales/Quotes/QuoteRequestDetail | Commons/Requests/RequestDetail; Projects/Requests/RequestDetail |
| RequestCommentReply | ReplyCommentForm | Projects/Requests/RequestDetail; Shared/Chatter; Purchasing/Requests/RequestDetail; CustomerService/Cases/CaseDetail; Sales/Quotes/QuoteRequestDetail | Projects/Requests/RequestDetail; Purchasing/Requests/RequestDetail |
| RequestCommentUpdate | ReplyCommentForm | Projects/Requests/RequestDetail; Shared/Chatter; Purchasing/Requests/RequestDetail; CustomerService/Cases/CaseDetail; Sales/Quotes/QuoteRequestDetail | Projects/Requests/RequestDetail; Purchasing/Requests/RequestDetail |
| EditRequestItems | NewRequestItemForm | Projects/Requests/RequestDetail; Purchasing/Requests/RequestDetail; CustomerService/Cases/CaseDetail; Sales/Quotes/QuoteRequestDetail | Purchasing/Requests/RequestDetail; Purchasing/Sourcing/QuoteRequestDetail (Add item, Purchasing P11) |
| EditRequestItems | RequestItemListForm | Projects/Requests/RequestDetail; Purchasing/Requests/RequestDetail; CustomerService/Cases/CaseDetail; Sales/Quotes/QuoteRequestDetail | Purchasing/Requests/RequestDetail; Commons/Requests/RequestDetail; Projects/Requests/RequestDetail; Purchasing/Sourcing/QuoteRequestDetail (QuoteRequestItems, Purchasing P11) |
| EditTasks | AddRweForm | Projects/Requests/RequestDetail; Purchasing/Requests/RequestDetail; CustomerService/Cases/CaseDetail; Sales/Quotes/QuoteRequestDetail | Projects/Requests/RequestDetail |
| EditTasks | NewTaskForm | Projects/Requests/RequestDetail; Purchasing/Requests/RequestDetail; CustomerService/Cases/CaseDetail; Sales/Quotes/QuoteRequestDetail | Projects/Requests/RequestDetail |
| EditTasks | UpdateRweForm | Projects/Requests/RequestDetail; Purchasing/Requests/RequestDetail; CustomerService/Cases/CaseDetail; Sales/Quotes/QuoteRequestDetail | Projects/Requests/RequestDetail |
| EditUsers | AddUserForm | Projects/Requests/RequestDetail; Purchasing/Requests/RequestDetail; CustomerService/Cases/CaseDetail; Sales/Quotes/QuoteRequestDetail | Projects/Requests/RequestDetail |
| EditUsers | UpdateUserForm | Projects/Requests/RequestDetail; Purchasing/Requests/RequestDetail; CustomerService/Cases/CaseDetail; Sales/Quotes/QuoteRequestDetail | Projects/Requests/RequestDetail |
| EditWikiPages | AddWprForm | Commons/Knowledge; Projects/Requests/RequestDetail; Purchasing/Requests/RequestDetail; CustomerService/Cases/CaseDetail; CustomerService/Knowledge | Commons/Knowledge |
| EditWikiPages | DeleteWprForm | Commons/Knowledge; Projects/Requests/RequestDetail; Purchasing/Requests/RequestDetail; CustomerService/Cases/CaseDetail; CustomerService/Knowledge | Commons/Knowledge |
| FindRequest | NewRequestForm | Projects/Requests; Purchasing/Requests; CustomerService/Cases/NewCase; Maintenance/Requests; Sales/Quotes/QuoteRequests | Projects/Requests/List; Purchasing/Requests/PurchaseRequests; Purchasing/NewPurchaseRequest; Purchasing/Sourcing/QuoteRequests (NewQuoteRequest); Purchasing/NewQuoteRequest (Purchasing P11) |
| FindRequest | ListRequests | Commons/Requests; Projects/Requests; Purchasing/Requests; CustomerService/Cases/Cases; CustomerService/Home; Maintenance/Requests; Sales/Quotes/QuoteRequests | Commons/Requests/List; Projects/Requests/List; Purchasing/Requests/PurchaseRequests |

## Return (8 forms)

| Screen XML | Form | Designed in | Implemented in |
| --- | --- | --- | --- |
| AddOrderItems | LookBackDaysForm | Warehouse/Returns/ReturnDetail; Purchasing/Returns/ReturnDetail; CustomerService/Returns/NewReturn; PASS:Support/RequestReturn; Shared/ReturnDetail | Warehouse/Returns/ReturnDetail#ReturnEligibleList (Shared/ReturnDetail); Purchasing/Returns/ReturnDetail#PurchasingReturnEligibleList (Shared/ReturnDetail) |
| AddOrderItems | AddOrderItemToReturn | Warehouse/Returns/ReturnDetail; Purchasing/Returns/ReturnDetail; CustomerService/Returns/NewReturn; PASS:Support/RequestReturn; Shared/ReturnDetail | Warehouse/Returns/ReturnDetail#AddReturnItem (Shared/ReturnDetail); Purchasing/Returns/ReturnDetail#AddReturnReceipt (Shared/ReturnDetail) |
| EditReturn | AuditLogList | Warehouse/Returns/ReturnDetail; Purchasing/Returns/ReturnDetail; CustomerService/Returns/ReturnDetail; Shared/ReturnDetail | Warehouse/Returns/ReturnDetail (Conversation: the chatter's audited changes of the return; no item audit, P14); Purchasing/Returns/ReturnDetail (Conversation) |
| EditReturn | UpdateReturn | Warehouse/Returns/ReturnDetail; Purchasing/Returns/ReturnDetail; CustomerService/Returns/ReturnDetail; Shared/ReturnDetail | — not built (P14): ReturnDetail edits a return only by adding eligible items; the header is set at Returns' New return |
| EditReturnItems | ReturnItemList | Warehouse/Returns/ReturnDetail; Purchasing/Returns/ReturnDetail; CustomerService/Returns/ReturnDetail; Shared/ReturnDetail | Accounting/Records/ReturnDetail#AccountingReturnItems (Shared/ReturnDetail); Warehouse/Returns/ReturnDetail#ReturnItemList (Shared/ReturnDetail); Purchasing/Returns/ReturnDetail#PurchasingReturnItems (Shared/ReturnDetail) |
| FindReturn | CreateReturn | Warehouse/Returns/Returns; CustomerService/Returns/NewReturn | Warehouse/Returns/Returns#NewReturn |
| FindReturn | CreateSupplierReturn | Warehouse/Returns/Returns; Purchasing/Returns | Warehouse/Returns/Returns#NewReturn; Purchasing/Returns/SupplierReturns#NewSupplierReturn |
| FindReturn | ReturnHeaderList | Warehouse/Returns/Returns; Purchasing/Returns; CustomerService/Returns/Returns; PASS:Support/MyReturns | Warehouse/Returns/Returns#ReturnList; Purchasing/Returns/SupplierReturns#SupplierReturnList |

## Shipment (46 forms)

| Screen XML | Form | Designed in | Implemented in |
| --- | --- | --- | --- |
| FindShipment | NewOutgoingShipment | Warehouse/Shipping/Shipments | Warehouse/Shipping/Shipments (NewOutgoing, order parts) |
| FindShipment | NewIncomingShipment | Warehouse/Receiving/Receipts | Warehouse/Receiving/Receipts (NewReceipt); Warehouse/Receiving/NewReceipt |
| FindShipment | NewTransferShipment | Warehouse/Transfers/Transfers | Warehouse/Transfers/Transfers (NewTransfer); Warehouse/Transfers/NewTransfer (quick create) |
| FindShipment | ShipmentList | Warehouse/Receiving/Receipts; Warehouse/Shipping/Shipments; Warehouse/Transfers/Transfers; Purchasing/Receiving/Receipts | Warehouse/Receiving/Receipts (ReceiptList, incoming); Warehouse/Shipping/Shipments (ShipmentList, outgoing); Warehouse/Transfers/Transfers (TransferList, transfers and subcontract dispatches); Purchasing/Receiving/Receipts (ExpectedReceipts, the purchase order lines) |
| PackageTracking | EtaPackageList | Warehouse/Shipping/PackageTracking | Warehouse/Shipping/PackageTracking (TrackingList, P13) |
| ShipmentDetail | AuditLogList | Warehouse/Receiving/ReceiptDetail; Warehouse/Shipping/ShipmentDetail; Purchasing/Receiving/ShipmentDetail; Shared/ShipmentDetail | Warehouse/Receiving/ReceiptDetail, Warehouse/Shipping/ShipmentDetail (Conversation: the chatter's audited changes of the shipment); Purchasing/Receiving/ShipmentDetail (Conversation) |
| ShipmentDetail | EditShipment | Warehouse/Receiving/ReceiptDetail; Warehouse/Shipping/ShipmentDetail; Purchasing/Receiving/ShipmentDetail; Shared/ShipmentDetail | — no header edit: Warehouse/Shipping/Ship checks the address (ValidateAddress), and a bought rate sets carrier and method (BuyRate) |
| ShipmentDetail | ItemLimitForm | Warehouse/Receiving/ReceiptDetail; Warehouse/Shipping/ShipmentDetail; Purchasing/Receiving/ShipmentDetail; Shared/ShipmentDetail | Warehouse/Receiving/Receive (ReceiveSource, as designed); the detail mounts' lines are not paged |
| ShipmentDetail | PackScanForm | Warehouse/Shipping/Pack; Warehouse/Handheld/Pack; Shared/ShipmentDetail | Warehouse/Shipping/Pack (PackScan); Warehouse/Handheld/Pack (PackScan, the product scan); Shared/ShipmentDetail (outbound: Pack) |
| ShipmentDetail | PickScanForm | Warehouse/Picking/Pick; Warehouse/Handheld/Pick; Shared/ShipmentDetail | Warehouse/Picking/Pick (PickScan); Warehouse/Handheld/Pick (PickScan, the scans); Shared/ShipmentDetail (outbound: Pick) |
| ShipmentDetail | ShipmentOrderPaymentList | Warehouse/Receiving/ReceiptDetail; Warehouse/Shipping/ShipmentDetail; Purchasing/Receiving/ShipmentDetail; Shared/ShipmentDetail | — not built: the Warehouse mounts show no payments; ShipmentDetail's OutboundLines show unit prices with financial read |
| ShipmentDetail | ShipmentInvoicePaymentList | Warehouse/Receiving/ReceiptDetail; Warehouse/Shipping/ShipmentDetail; Purchasing/Receiving/ShipmentDetail; Shared/ShipmentDetail | — not built: the Warehouse mounts show no payments; ShipmentDetail's OutboundLines show unit prices with financial read |
| ShipmentDetail | AddParty | Warehouse/Receiving/ReceiptDetail; Warehouse/Shipping/ShipmentDetail; Purchasing/Receiving/ShipmentDetail; Shared/ShipmentDetail | — not built: the Warehouse mounts edit no shipment parties; the header names the supplier or the ship-to party |
| ShipmentDetail | RolesForm | Warehouse/Receiving/ReceiptDetail; Warehouse/Shipping/ShipmentDetail; Purchasing/Receiving/ShipmentDetail; Shared/ShipmentDetail | — not built: the Warehouse mounts edit no shipment parties; the header names the supplier or the ship-to party |
| ShipmentDetail | NewContentForm | Warehouse/Receiving/ReceiptDetail; Warehouse/Shipping/ShipmentDetail; Shared/RecordFiles; Purchasing/Receiving/ShipmentDetail; Shared/ShipmentDetail | Warehouse/Receiving/ReceiptDetail, Warehouse/Shipping/ShipmentDetail (Files: shared record files); Purchasing/Receiving/ShipmentDetail (Files) |
| ShipmentDetail | UpdateContentForm | Warehouse/Receiving/ReceiptDetail; Warehouse/Shipping/ShipmentDetail; Shared/RecordFiles; Purchasing/Receiving/ShipmentDetail; Shared/ShipmentDetail | Warehouse/Receiving/ReceiptDetail, Warehouse/Shipping/ShipmentDetail (Files: shared record files, a new version); Purchasing/Receiving/ShipmentDetail (Files) |
| ShipmentDetail | SendPlacedEmailForm | Warehouse/Receiving/ReceiptDetail; Warehouse/Shipping/ShipmentDetail; Purchasing/Receiving/ShipmentDetail; Shared/ShipmentDetail | — not built: the Warehouse mounts send no shipment email (P7: the receipt documents print instead) |
| ShipmentDetail | EmailMessageList | Warehouse/Receiving/ReceiptDetail; Warehouse/Shipping/ShipmentDetail; Purchasing/Receiving/ShipmentDetail; Shared/ShipmentDetail | — not built: no shipment email list; the mounts' Conversation shows the shipment's messages |
| ShipmentDetail | ProduceAssembliesForm | Warehouse/Inventory/MaterialIssueReceipt; Warehouse/Shipping/Pack; Shared/ShipmentDetail | Warehouse/Inventory/MaterialIssueReceipt (MaterialLines, Pack component); Warehouse/Shipping/Pack (PackAssembly) |
| ShipmentDetail | AssemblyProduceProducts | Warehouse/Inventory/MaterialIssueReceipt; Warehouse/Shipping/Pack; Shared/ShipmentDetail | Warehouse/Inventory/MaterialIssueReceipt (MaterialHistory: kit receipts) |
| ShipmentDetail | AssemblyConsumeProducts | Warehouse/Inventory/MaterialIssueReceipt; Warehouse/Shipping/Pack; Shared/ShipmentDetail | Warehouse/Inventory/MaterialIssueReceipt (MaterialLines, MaterialHistory: issues) |
| ShipmentDetail | AddItemForm | Warehouse/Receiving/ReceiptDetail; Warehouse/Shipping/ShipmentDetail; Purchasing/Receiving/ShipmentDetail; Shared/ShipmentDetail | — not built: lines come from the order (Receipts' NewReceipt, Shipments' NewOutgoing); Receive's AdHocReceipt takes stock with no order |
| ItemReserve | ReserveItem | Warehouse/Shipping/ShipmentDetail; Shared/ShipmentDetail | — not offered: reservation stays Mantle's order SECAs under P3's facility default; ShipmentDetail's OutboundLines show Reserved |
| ReceiveItem | ReceiveForm | Warehouse/Receiving/Receive; Warehouse/Handheld/Receive; Purchasing/Receiving/ShipmentDetail; Shared/ShipmentDetail | Warehouse/Receiving/Receive (ReceiveLine); Warehouse/Handheld/Receive; Purchasing/Receiving/ShipmentDetail (PurchaseReceiveLine, through the receive guard) |
| UpdateItemAsset | UpdateForm | Warehouse/Shipping/ShipmentDetail; Shared/ShipmentDetail | — not offered (F36): a received asset's details are AssetDetail's Edit details and Lots' Correct (correct#LotMetadata) |
| ShipmentItems | AssemblyPackUnusedComponents | Warehouse/Shipping/ShipmentDetail; Warehouse/Shipping/Pack; Shared/ShipmentDetail | Warehouse/Shipping/Pack (CompletePack: unused components return at complete#Pack) |
| ShipmentItems | SetPackedForm | Warehouse/Shipping/ShipmentDetail; Warehouse/Shipping/Pack; Shared/ShipmentDetail | Warehouse/Shipping/Pack (CompletePack) |
| ShipmentItems | SetDeliveredForm | Warehouse/Shipping/PackageTracking; Warehouse/Shipping/ShipmentDetail; Shared/ShipmentDetail | Warehouse/Shipping/PackageTracking (RecordDelivery per package, P13) |
| ShipmentItems | AddItemForm | Warehouse/Shipping/ShipmentDetail; Warehouse/Shipping/Pack; Purchasing/Receiving/ShipmentDetail; Shared/ShipmentDetail | — not built: shipment lines come from order parts (Shipments' NewOutgoing, OrderDetail's Create shipment) |
| ShipmentItems | ItemsOptionsForm | Warehouse/Shipping/ShipmentDetail; Warehouse/Shipping/Pack; Purchasing/Receiving/ShipmentDetail; Shared/ShipmentDetail | Warehouse/Shipping/ShipmentDetail (OutboundLines); Warehouse/Shipping/Pack (PackLines) |
| ShipmentItems | PackItemForm | Warehouse/Shipping/ShipmentDetail; Warehouse/Shipping/Pack; Shared/ShipmentDetail | Warehouse/Shipping/Pack (PackLines: Pack) |
| ShipmentItems | PackComponentsForm | Warehouse/Shipping/ShipmentDetail; Warehouse/Shipping/Pack; Shared/ShipmentDetail | Warehouse/Shipping/Pack (AssemblyComponents: Pack) |
| ShipmentItems | UpdateItemForm | Warehouse/Shipping/ShipmentDetail; Warehouse/Shipping/Pack; Purchasing/Receiving/ShipmentDetail; Shared/ShipmentDetail | — no line edit: Warehouse/Picking/Pick (FinishPick, backorder) lowers each line to what was picked (update#ShipmentItem) |
| ShipmentItems | AddItemToPackageForm | Warehouse/Shipping/ShipmentDetail; Warehouse/Shipping/Pack; Shared/ShipmentDetail | Warehouse/Shipping/Pack (PackageContents: Move) |
| ShipmentItems | ItemSourceIssuanceList | Warehouse/Shipping/ShipmentDetail; Warehouse/Shipping/Pack; Shared/ShipmentDetail | Warehouse/Shipping/ShipmentDetail (OutboundLines: source, picked, packed); Warehouse/Shipping/Pack (PackLines: source, packed, Pack) |
| ShipmentItems | PaComponentPackForm | Warehouse/Shipping/ShipmentDetail; Warehouse/Shipping/Pack; Shared/ShipmentDetail | Warehouse/Shipping/Pack (AssemblyComponents: Pack) |
| ShipmentItems | ItemAssetIssuanceList | Warehouse/Shipping/ShipmentDetail; Warehouse/Shipping/Pack; Shared/ShipmentDetail | — no issuance list: Warehouse/Shipping/Pack (ReopenPackage names each packed asset, lot and serial); Inventory/Movements by shipment |
| ShipmentItems | ItemSourceReceiptList | Warehouse/Receiving/ReceiptDetail; Warehouse/Returns/ReturnReceipt; Purchasing/Receiving/ShipmentDetail; Shared/ShipmentDetail | Warehouse/Returns/ReturnReceipt#ReturnShipmentLines (Shared/ShipmentDetail); Purchasing/Receiving/ShipmentDetail (PurchaseReceiptLines) |
| ShipmentItems | ItemAssetReceiptList | Warehouse/Receiving/ReceiptDetail; Warehouse/Returns/ReturnReceipt; Purchasing/Receiving/ShipmentDetail; Shared/ShipmentDetail | Warehouse/Returns/ReturnReceipt#ReturnReceiptRows (Shared/ShipmentDetail); Purchasing/Receiving/ShipmentDetail (PurchaseReceiptRows) |
| ShipmentPackages | SetShippedForm | Warehouse/Shipping/Ship; Warehouse/Shipping/ShipmentDetail; Shared/ShipmentDetail | Warehouse/Shipping/Ship (ShipConfirm, P13) |
| ShipmentPackages | PrintAllShipmentLabels | Warehouse/Shipping/Ship; Warehouse/Shipping/ShipmentDetail; Shared/ShipmentDetail | Warehouse/Shipping/Ship (Print labels, P13) |
| ShipmentPackages | PackageOptionsForm | Warehouse/Shipping/ShipmentDetail; Warehouse/Shipping/Pack; Warehouse/Shipping/Ship; Shared/ShipmentDetail | Warehouse/Shipping/Pack (Add package, Remove, Move) |
| ShipmentPackages | UpdatePackageForm | Warehouse/Shipping/ShipmentDetail; Warehouse/Shipping/Pack; Warehouse/Shipping/Ship; Shared/ShipmentDetail | Warehouse/Shipping/Pack (EditPackage, Weigh) |
| ShipmentPackages | RequestRetLabel | Warehouse/Shipping/Ship; Warehouse/Shipping/ShipmentDetail; Shared/ShipmentDetail | Warehouse/Shipping/Ship (Return labels, P13) |
| ShipmentPackages | PrintShipmentLabel | Warehouse/Shipping/Ship; Warehouse/Shipping/ShipmentDetail; Shared/ShipmentDetail | Warehouse/Shipping/Ship (Labels: View, Reprint, P13) |
| ShipmentPackages | ShipmentPackageContentList | Warehouse/Shipping/ShipmentDetail; Warehouse/Shipping/Pack; Warehouse/Shipping/Ship; Shared/ShipmentDetail | Warehouse/Shipping/Pack (PackageContents, Reopen); Shared/ShipmentDetail (outbound: Packages) |

## Shipping (34 forms)

| Screen XML | Form | Designed in | Implemented in |
| --- | --- | --- | --- |
| PackItems | ItemsOptionsForm | Warehouse/Shipping/Pack; Warehouse/Handheld/Pack | Warehouse/Shipping/Pack (PackLines) |
| PackItems | PackItemForm | Warehouse/Shipping/Pack; Warehouse/Handheld/Pack | Warehouse/Shipping/Pack (PackLines: Pack); Warehouse/Handheld/Pack (PackScan) |
| PackItems | UpdateItemForm | Warehouse/Shipping/Pack; Warehouse/Handheld/Pack | — no line edit: Warehouse/Picking/Pick (FinishPick, backorder) lowers each line to what was picked (update#ShipmentItem) |
| PackItems | AddItemToPackageForm | Warehouse/Shipping/Pack; Warehouse/Handheld/Pack | Warehouse/Shipping/Pack (PackageContents: Move) |
| PackItems | ItemSourceIssuanceList | Warehouse/Shipping/Pack; Warehouse/Handheld/Pack | Warehouse/Shipping/Pack (PackLines: source, picked, packed, Pack); Warehouse/Handheld/Pack (PackLines) |
| PackItems | ItemAssetIssuanceList | Warehouse/Shipping/Pack; Warehouse/Handheld/Pack | — no issuance list: Warehouse/Shipping/Pack (ReopenPackage names each packed asset, lot and serial); Inventory/Movements by shipment |
| PackPackages | PackageOptionsForm | Warehouse/Shipping/Pack; Warehouse/Shipping/Ship | Warehouse/Shipping/Pack (Add package, Remove) |
| PackPackages | UpdatePackageForm | Warehouse/Shipping/Pack; Warehouse/Shipping/Ship | Warehouse/Shipping/Pack (EditPackage, Weigh) |
| PackPackages | RequestRetLabel | Warehouse/Shipping/Pack; Warehouse/Shipping/Ship | Warehouse/Shipping/Ship (Return labels, P13) |
| PackPackages | PrintShipmentLabel | Warehouse/Shipping/Pack; Warehouse/Shipping/Ship | Warehouse/Shipping/Ship (Labels, P13) |
| PackPackages | ShipmentPackageContentList | Warehouse/Shipping/Pack; Warehouse/Shipping/Ship | Warehouse/Shipping/Pack (PackageContents) |
| PackSummary | PrintAllShipmentLabels | Warehouse/Shipping/Pack; Warehouse/Shipping/Ship; Warehouse/Handheld/Pack | Warehouse/Shipping/Ship (Print labels, P13) |
| PackSummary | SetShippedForm | Warehouse/Shipping/Pack; Warehouse/Shipping/Ship; Warehouse/Handheld/Pack | Warehouse/Shipping/Ship (ShipConfirm, P13) |
| PackSummary | PackScanForm | Warehouse/Shipping/Pack; Warehouse/Shipping/Ship; Warehouse/Handheld/Pack | Warehouse/Shipping/Pack (PackScan); Warehouse/Handheld/Pack (PackScan) |
| PackSummary | ClosePackageForm | Warehouse/Shipping/Pack; Warehouse/Shipping/Ship; Warehouse/Handheld/Pack | Warehouse/Shipping/Pack (EditPackage, Weigh) |
| PackSummary | ShipmentPackageContentList | Warehouse/Shipping/Pack; Warehouse/Shipping/Ship; Warehouse/Handheld/Pack | Warehouse/Shipping/Pack (PackagesList, PackageContents) |
| PackCompleted | AssemblyPackUnusedComponents | Warehouse/Shipping/Pack | Warehouse/Shipping/Pack (CompletePack: unused components return) |
| PackCompleted | PackCompletedForm | Warehouse/Shipping/Pack | Warehouse/Shipping/Pack (CompletePack, no label) |
| PickLocationMoves | PickMoveList | Warehouse/Picking/PickLocationMoves | Warehouse/Picking/PickLocationMoves (PickFaceNeeds) |
| QuickMove | ScanMoveAssetForm | Warehouse/Picking/PickLocationMoves | Warehouse/Picking/PickLocationMoves (QuickPickMove) |
| AddOrder | AddOrderList | Warehouse/Picking/PicklistDetail | Warehouse/Picking/PicklistDetail (AddOrderToPicklist) |
| AddShipment | AddShipmentList | Warehouse/Picking/PicklistDetail | Warehouse/Picking/PicklistDetail (AddShipmentToPicklist) |
| BulkPicklist | CreatePicklistsForm | Warehouse/Picking/CreatePicklists | Warehouse/Picking/CreatePicklists (LoadSelection, LoadCreate) |
| BulkPicklist | AddOrderList | Warehouse/Picking/CreatePicklists | Warehouse/Picking/CreatePicklists (PreviewGroups, PreviewExcluded) |
| FindPicklist | NewPicklist | Warehouse/Picking/Picklists | Warehouse/Picking/Picklists (NewPicklist) |
| FindPicklist | PicklistList | Warehouse/Picking/Picklists | Warehouse/Picking/Picklists (PicklistList) |
| PicklistDetail | UpdateShipmentLoad | Warehouse/Picking/PicklistDetail | Warehouse/Picking/PicklistDetail (EditPicklist, CompletePicklist) |
| PicklistDetail | ListShipments | Warehouse/Picking/PicklistDetail | Warehouse/Picking/PicklistDetail (LoadShipments) |
| PicklistDetail | AddPartyAssignForm | Warehouse/Picking/PicklistDetail | Warehouse/Picking/PicklistDetail (AssignPerson) |
| PicklistDetail | UpdateAssignForm | Warehouse/Picking/PicklistDetail | Warehouse/Picking/PicklistDetail (LoadPeople, End) |
| PicklistDetail | AddAsset | Warehouse/Picking/PicklistDetail | Warehouse/Picking/PicklistDetail (AssignEquipment) |
| PicklistDetail | UpdateAssetAssign | Warehouse/Picking/PicklistDetail | Warehouse/Picking/PicklistDetail (LoadEquipment, End) |
| dashboard | PackShipmentForm | Warehouse/Shipping/Pack; Warehouse/Handheld/Pack | Warehouse/Shipping/Pack (ShipmentsToPack); Warehouse/Handheld/Pack (ScanWork) |
| dashboard | FacilitySummary | Warehouse/Home | Warehouse/Home (queue cards, QueueRows, stock indicators) |

## SimpleReport (9 forms)

| Screen XML | Form | Designed in | Implemented in |
| --- | --- | --- | --- |
| EditReport | EditDataDocument | Insights/ReportBuilder/DatasetDetail |  |
| FieldList | AddCondition | Insights/ReportBuilder/DatasetFields |  |
| FieldList | ConditionList | Insights/ReportBuilder/DatasetFields |  |
| FieldList | FieldList | Insights/ReportBuilder/DatasetFields |  |
| FindReport | CreateDataDocument | Insights/ReportBuilder/Datasets |  |
| FindReport | DataDocumentList | Insights/ReportBuilder/Datasets |  |
| QuickViewReport | DataDocumentList | Insights/Reports; Insights/SavedReports |  |
| ViewReport | ExportDocuments | Insights/ReportBuilder/DatasetView |  |
| ViewReport | DataViewList | Insights/ReportBuilder/DatasetView |  |

## Supplier (4 forms)

| Screen XML | Form | Designed in | Implemented in |
| --- | --- | --- | --- |
| FindSupplier | CreatePersonForm | Purchasing/Suppliers | Purchasing/Suppliers/SupplierList (CreateSupplierPerson) |
| FindSupplier | CreateOrganizationForm | Purchasing/Suppliers | Purchasing/Suppliers/SupplierList (CreateSupplierOrganization, DuplicateCandidates) |
| FindSupplier | OuterSearchForm | Purchasing/Suppliers | Purchasing/Suppliers/SupplierList (SupplierList find) |
| FindSupplier | SupplierListForm | Purchasing/Suppliers | Purchasing/Suppliers/SupplierList (SupplierList) |

## Survey (14 forms)

| Screen XML | Form | Designed in | Implemented in |
| --- | --- | --- | --- |
| EditSurvey | EditSurveyForm | CustomerService/Settings/FeedbackFormDetail; Marketing/Surveys/SurveyDetail |  |
| EditSurvey | NewUserGroupForm | CustomerService/Settings/FeedbackFormDetail; Marketing/Surveys/SurveyDetail |  |
| EditSurvey | UserGroupForm | CustomerService/Settings/FeedbackFormDetail; Marketing/Surveys/SurveyDetail |  |
| Fields | NewDbFormFieldForm | CustomerService/Settings/FeedbackFormDetail; Marketing/Surveys/SurveyDetail |  |
| Fields | SurveyPreview | CustomerService/Settings/FeedbackFormDetail; Marketing/Surveys/SurveyDetail |  |
| Fields | DbFormFieldList | CustomerService/Settings/FeedbackFormDetail; Marketing/Surveys/SurveyDetail |  |
| Fields | NewFieldOptionForm | CustomerService/Settings/FeedbackFormDetail; Marketing/Surveys/SurveyDetail |  |
| Fields | FieldOptionForm | CustomerService/Settings/FeedbackFormDetail; Marketing/Surveys/SurveyDetail |  |
| FindSurvey | NewSurveyForm | CustomerService/Settings/FeedbackForms; Marketing/Surveys |  |
| FindSurvey | SurveyList | CustomerService/Settings/FeedbackForms; Marketing/Surveys |  |
| ResponseDetails | ResponseDetailsForm | CustomerService/Reports/ResponseDetail; Marketing/Surveys/ResponseDetail |  |
| ResponseStats | TextDbFormFieldResponseCountList | CustomerService/Reports/SatisfactionResults; Marketing/Surveys/Responses |  |
| ResponseStats | FieldOptionForm | CustomerService/Reports/SatisfactionResults; Marketing/Surveys/Responses |  |
| Responses | ResponseListForm | CustomerService/Reports/SatisfactionResults; Marketing/Surveys/Responses |  |

## Task (32 forms)

| Screen XML | Form | Designed in | Implemented in |
| --- | --- | --- | --- |
| EditRelated | AddRelatedToForm | Projects/WorkItems/WorkItemDetail | Projects/WorkItems/WorkItemDetail |
| EditRelated | AddRelatedFromForm | Projects/WorkItems/WorkItemDetail | Projects/WorkItems/WorkItemDetail |
| EditRelated | DeleteRelatedToForm | Projects/WorkItems/WorkItemDetail | Projects/WorkItems/WorkItemDetail |
| EditRelated | DeleteRelatedFromForm | Projects/WorkItems/WorkItemDetail | Projects/WorkItems/WorkItemDetail |
| EditRequests | AddRweForm | Projects/WorkItems/WorkItemDetail | Projects/WorkItems/WorkItemDetail |
| EditRequests | DeleteRweForm | Projects/WorkItems/WorkItemDetail | Projects/WorkItems/WorkItemDetail |
| EditSource | AddCommitForm | Projects/WorkItems/WorkItemDetail; Projects/Code/CommitDetail | Projects/WorkItems/WorkItemDetail; Projects/Code/CommitDetail |
| EditSource | AddRefForm | Projects/Projects/ReleaseDetail; Projects/WorkItems/WorkItemDetail | Projects/Projects/ReleaseDetail; Projects/WorkItems/WorkItemDetail |
| EditSource | TaskCommitList | Projects/WorkItems/WorkItemDetail; Projects/Code/RepositoryDetail/Commits | Projects/WorkItems/WorkItemDetail; Projects/Code/RepositoryDetail/Commits |
| EditSource | TaskRefList | Projects/WorkItems/WorkItemDetail | Projects/WorkItems/WorkItemDetail |
| EditTask | EditTask | Projects/WorkItems/WorkItemDetail | Projects/WorkItems/WorkItemDetail |
| EditTimeEntries | ClockInForm | Projects/WorkItems/WorkItemDetail | Projects/WorkItems/WorkItemDetail |
| EditTimeEntries | AddTaskTime | Projects/QuickCreate; Projects/WorkItems/WorkItemDetail | Projects/QuickCreate; Projects/WorkItems/WorkItemDetail |
| EditTimeEntries | TimeEntryList | Projects/WorkItems/WorkItemDetail | Projects/WorkItems/WorkItemDetail |
| EditUsers | AddUserAssignForm | Projects/WorkItems/WorkItemDetail | Projects/WorkItems/WorkItemDetail |
| EditUsers | AddTeamAssignForm | Projects/Projects/ProjectDetail/Team; Projects/WorkItems/WorkItemDetail | Projects/Projects/ProjectDetail/Team; Projects/WorkItems/WorkItemDetail |
| EditUsers | UpdateAssignForm | Projects/WorkItems/WorkItemDetail | Projects/WorkItems/WorkItemDetail |
| EditWikiPages | AddWpweForm | Commons/Knowledge; Projects/WorkItems/WorkItemDetail | Commons/Knowledge |
| EditWikiPages | DeleteWpweForm | Commons/Knowledge; Projects/WorkItems/WorkItemDetail | Commons/Knowledge |
| FindTask | SearchOptions | Commons/Tasks; Projects/WorkItems | Commons/Tasks/List; Projects/WorkItems/List |
| FindTask | NewTaskForm | Commons/Tasks; Projects/QuickCreate; Projects/WorkItems | Commons/Tasks/List; Projects/QuickCreate; Projects/WorkItems/List |
| FindTask | ListTasks | Commons/Tasks; Projects/WorkItems | Commons/Tasks/List; Projects/WorkItems/List |
| FindTask | AssignTaskSelected | Commons/Tasks; Projects/WorkItems | Commons/Tasks/List; Projects/WorkItems/List |
| FindTask | UnAssignTaskSelected | Commons/Tasks; Projects/WorkItems | Commons/Tasks/List; Projects/WorkItems/List |
| FindTask | UpdateTaskSelected | Commons/Tasks; Projects/WorkItems | Commons/Tasks/List; Projects/WorkItems/List |
| TaskSummary | ClockInForm | Commons/Tasks/TaskDetail; Projects/WorkItems/WorkItemDetail | Commons/Tasks/TaskDetail; Projects/WorkItems/WorkItemDetail |
| TaskSummary | AddCommentForm | Commons/Tasks/TaskDetail; Projects/WorkItems/WorkItemDetail; Shared/Chatter | Commons/Tasks/TaskDetail; Shared/Chatter; Projects/WorkItems/WorkItemDetail |
| TaskSummary | NewChildTaskForm | Commons/Tasks/TaskDetail; Projects/WorkItems/WorkItemDetail | Commons/Tasks/TaskDetail; Projects/WorkItems/WorkItemDetail |
| TaskSummary | NewContentForm | Commons/Tasks/TaskDetail; Projects/WorkItems/WorkItemDetail; Shared/RecordFiles | Commons/Tasks/TaskDetail; Shared/RecordFiles; Projects/WorkItems/WorkItemDetail |
| TaskSummary | UpdateContentForm | Commons/Tasks/TaskDetail; Projects/WorkItems/WorkItemDetail; Shared/RecordFiles | Commons/Tasks/TaskDetail; Shared/RecordFiles; Projects/WorkItems/WorkItemDetail |
| TaskCommentReply | ReplyCommentForm | Commons/Tasks/TaskDetail; Projects/WorkItems/WorkItemDetail; Shared/Chatter | Commons/Tasks/TaskDetail; Shared/Chatter; Projects/WorkItems/WorkItemDetail |
| TaskCommentUpdate | ReplyCommentForm | Commons/Tasks/TaskDetail; Projects/WorkItems/WorkItemDetail; Shared/Chatter | Commons/Tasks/TaskDetail; Shared/Chatter; Projects/WorkItems/WorkItemDetail |

## Vendor (10 forms)

| Screen XML | Form | Designed in | Implemented in |
| --- | --- | --- | --- |
| EditUsers | AddUserRelationshipForm | Admin/Settings/OrganizationDetail |  |
| EditUsers | UpdateUserRelForm | Admin/Settings/OrganizationDetail |  |
| EditVendor | PaymentInfo | Admin/Settings/OrganizationDetail |  |
| EditVendor | SetVendorRepForm | Admin/Settings/OrganizationDetail |  |
| EditVendor | BillingInfo | Admin/Settings/OrganizationDetail |  |
| EditVendor | EditVendor | Admin/Settings/OrganizationDetail |  |
| EditVendor | RoleList | Admin/Settings/OrganizationDetail |  |
| FindVendor | FindVendor | Admin/Settings/Organizations |  |
| FindVendor | CreateVendor | Admin/Settings/Organizations |  |
| FindVendor | VendorList | Admin/Settings/Organizations |  |

## Wiki (18 forms)

| Screen XML | Form | Designed in | Implemented in |
| --- | --- | --- | --- |
| EditWikiBlog | EditBlogForm | Marketing/Content/BlogPosts/BlogPostDetail |  |
| EditWikiBlog | AddCategory | Marketing/Content/BlogPosts/BlogPostDetail |  |
| EditWikiBlog | CategoriesForm | Marketing/Content/BlogPosts/BlogPostDetail |  |
| EditWikiPage | EditPageForm | Commons/Knowledge; Marketing/Content/Knowledge; Marketing/Content/BlogPosts/BlogPostDetail | Commons/Knowledge |
| EditWikiSpace | CloneSpace | Commons/Knowledge/Spaces | Commons/Knowledge/Spaces |
| EditWikiSpace | EditSpace | Commons/Knowledge/Spaces | Commons/Knowledge/SpaceDetail |
| WikiBlogs | AddBlogPage | Marketing/Content/BlogPosts |  |
| WikiBlogs | AddBlogText | Marketing/Content/BlogPosts |  |
| WikiBlogs | WikiBlogList | Marketing/Content/BlogPosts |  |
| WikiSpaces | NewSpace | Commons/Knowledge/Spaces | Commons/Knowledge/Spaces |
| WikiSpaces | WikiSpaceList | Commons/Knowledge/Spaces | Commons/Knowledge/Spaces |
| wiki | AddPageForm | Commons/Knowledge | Commons/Knowledge |
| wiki | ClonePage | Commons/Knowledge | Commons/Knowledge |
| wiki | AddCommentForm | Commons/Knowledge; Shared/Chatter | Commons/Knowledge; Shared/Chatter |
| wiki | UploadAttachment | Commons/Knowledge; Shared/RecordFiles | Commons/Knowledge |
| wiki | AddCategory | Commons/Knowledge; Commons/Notes | Commons/Knowledge; Commons/Notes |
| wiki | CategoriesForm | Commons/Knowledge; Commons/Notes | Commons/Knowledge; Commons/Notes |
| WikiCommentReply | ReplyCommentForm | Commons/Knowledge; Shared/Chatter | Commons/Knowledge; Shared/Chatter |

## BasicHandheld (Warehouse handheld) (16 forms)

| Screen XML | Form | Designed in | Implemented in |
| --- | --- | --- | --- |
| ReceiveAsset | ScanAssetForm | Warehouse/Handheld/Receive | Warehouse/Handheld/Receive (ScanReceipt) |
| ReceiveAsset | ActiveFacilityForm | Warehouse/Handheld/Receive | Warehouse/Handheld/Home (FacilityPicker) |
| ReceiveAsset | ReceiveAssetForm | Warehouse/Handheld/Receive | Warehouse/Handheld/Receive (ReceiveLine; AdHocReceipt is the desk Receive's) |
| SelectAsset | ScanAssetForm | Warehouse/Handheld/Move | Warehouse/Handheld/Move (HandheldMoveForm) |
| SelectAsset | ActiveFacilityForm | Warehouse/Handheld/Move | Warehouse/Handheld/Home (FacilityPicker) |
| SelectAsset | ScanMoveAssetForm | Warehouse/Handheld/Move | Warehouse/Handheld/Move (HandheldMoveForm) |
| SelectAsset | ContainerAssetList | Warehouse/Handheld/Move | — not at handheld density: Warehouse/Handheld/Move scans one asset (HandheldMoveForm); the lists are the desk Move's MoveContents |
| SelectAsset | LocationAssetList | Warehouse/Handheld/Move | — not at handheld density: Warehouse/Handheld/Move scans one asset (HandheldMoveForm); the lists are the desk Move's MoveContents |
| SelectAsset | ProductNoLocAssetList | Warehouse/Handheld/Move | — not at handheld density: Warehouse/Handheld/Move scans one asset (HandheldMoveForm); the lists are the desk Move's MoveContents |
| SelectAsset | RecentMoveForm | Warehouse/Handheld/Move | Warehouse/Handheld/Move (RecentMoves) |
| SelectAsset | RecentContainerMoveForm | Warehouse/Handheld/Move | Warehouse/Handheld/Move (RecentMoves) |
| PickLocationMoves | ActiveFacilityForm | Warehouse/Picking/PickLocationMoves; Warehouse/Handheld/PickFace | Warehouse/Handheld/Home (FacilityPicker) |
| PickLocationMoves | PickMoveList | Warehouse/Picking/PickLocationMoves; Warehouse/Handheld/PickFace | Warehouse/Handheld/PickFace (BelowMinimum, QuickPickMove) |
| dashboard | ActiveFacilityForm | Warehouse/Handheld/Home | Warehouse/Handheld/Home (FacilityPicker) |
| dashboard | ScanAssetForm | Warehouse/Handheld/Home | Warehouse/Handheld/Home (ScanAnything) |
| dashboard | PackShipmentForm | Warehouse/Handheld/Home | Warehouse/Handheld/Home (ScanAnything: a shipment's Pack it) |

## Shared root screens (5 forms)

| Screen XML | Form | Designed in | Implemented in |
| --- | --- | --- | --- |
| Search | SearchOptions | Commons/Search | Commons/Search |
| Search | SearchResults | Commons/Search | Commons/Search |
| QuickSearch | SearchOptions | — | — |
| QuickSearch | SearchResults | — | — |
| QuickLookup | QuickLookupForm | — | — |

Accounting P0–P3 (Oct 29): foundation lists/drafts, ledger/configuration editors, reports, batches/templates and files
are implemented. Coverage above names the built forms. Posted financial rewrite, arbitrary period editing/close,
full invoice/bill/payment workflows, gateway operations and banking remain outside this phase; those parity cells
remain blank. Numbering/templates, due-only terms and masked method metadata are documented in AccountingImplementation.

Accounting P4–P5 (reworked on Mantle's services in impl-accounting R2): invoice sending, batches and statements,
the shared customer and invoice contexts, settlement, payment state changes and unapplication, gateway actions and
lookup, manual and gateway refunds, and internal transfers are implemented. The internal transfer forms have no
SimpleScreens form to claim. The raw refund-link forms are not used: refunds go through `create#RefundPayment`.
Payable intake and holds, payment runs, bank sessions and the later phases' forms remain planned.

Accounting P6: bill intake (upload and from an order or receipt), holds and approval, expense posting, the supplier's
finance context, the order and shipment Accounting contexts and Approvals are implemented. BillDetail carries
InvoiceDetail's tabs, so the invoice tab forms name both. Matching (InvoiceMatch) is P7 and payment runs P8.

Accounting P7: bill matching is implemented as BillDetail's Match tab (Shared/InvoiceMatch), which applies a bill's lines
to purchase order lines and their receipts, so the order application forms of a bill name it; the shipment application
forms (ApplyToShipment, ApplyItemToShipment) stay open, since a match links receipts, not shipment item sources. The
match policy and the legacy backfill have no SimpleScreens form.
