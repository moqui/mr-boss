# IronStone BOSS — Research cross-cut: conventions, reused screens & shared facts

Oct 18, 2026 (updated after the per-file source review)

The research files (`research-*.md`) were first written independently, one per app or
suite area. This file holds what they must agree on: how paths are written, how each file
ends, which screens several IronStone apps reuse, the verified Mantle facts behind them, and
the names used for references and BOSS concepts. Like the files it serves, this is research,
not design: it records findings, reuse candidates and open questions for the design pass that
follows, and decides nothing beyond initial-design's **Decided** table.

**Stand-alone apps, reused screens.** Each IronStone app should stand on its own for its
target audience: a business that runs only Commerce, or only Maintenance, still has every
screen that audience needs. Where several apps need the same function (inventory
availability, a customer record, shipping settings, inspection), the same screen is included
in each of those apps, configured by the app's context (initial-design, "Shared business
screens"). The research files therefore say which apps would include a reused screen and
what each app's version emphasizes; they do not assign an owning app.

Inputs: [initial-design.md](initial-design.md) (its **Decided** table is fixed),
[3p-app-reference.md](3p-app-reference.md), [ss-inventory.md](ss-inventory.md),
[usl-inventory.md](usl-inventory.md), and the Mantle entity definitions in
`runtime/components/addon/mr-mantle/entity/`.

Sections: [1 paths](#1-path-conventions) · [2 file skeleton](#2-research-file-skeleton) ·
[3 reused screens](#3-reused-screens) · [4 overlapping functions](#4-overlapping-functions) ·
[5 Mantle basis](#5-mantle-basis-for-recurring-records) · [6 names](#6-names-and-terms) ·
[7 reference coverage](#7-reference-coverage-by-app) · [8 open questions](#8-open-questions)

---

## 1. Path conventions

**Rule.** Every backticked path in a research file resolves against the **Checkout** given
for its prefix in that file's path-conventions table. Each file's table must therefore use
the checkout and path start below. Paths inside a table row may be shortened to a tail
(`views/maintenance_views.xml`) only when the same cell or the row's first cell already
names the full directory. A shorthand prefix (for example `tf/` for
`packages/twenty-front/src`) must be defined in the file before first use. Placeholders use
angle brackets (`<addon>`); route parameters (`$id`) and React Router folders (`x+/`) are
literal parts of Carbon paths, not placeholders.

All checkouts are under `/home/jonesde/work/moquiwork/` (written `3p_other/…`, `3p_moqui/…`
and `mr-moqui-base/…` below).

| Prefix | Checkout | Paths start with |
| --- | --- | --- |
| **Odoo** | `3p_other/odoo` (bundle: `odoo/` repo + `industry/` repo) | `odoo/addons/<addon>/…` for apps; `odoo/odoo/addons/{base,…}/` for the core framework addons; `industry/<package>/` for verticals |
| **ERPNext** | `3p_other/frappe/erpnext` | `erpnext/<module>/…` (e.g. `erpnext/stock/doctype/item/`) |
| **Frappe framework** (desk) | `3p_other/frappe/frappe` | `frappe/<area>/…` (e.g. `frappe/desk/`, `frappe/public/js/`) |
| **Frappe CRM** | `3p_other/frappe/crm` | `frontend/src/…`, backend `crm/fcrm/doctype/…` |
| **Frappe Helpdesk** | `3p_other/frappe/helpdesk` | `desk/src/…`, backend `helpdesk/helpdesk/doctype/…`, `helpdesk/api/…`, `helpdesk/{templates,www}/…` |
| **Frappe HR** (hrms) | `3p_other/frappe/hrms` | `hrms/<area>/doctype/…`, PWA `frontend/src/…`, roster `roster/src/…` |
| **Frappe Insights** | `3p_other/frappe/insights` | `frontend/src2/…`, backend `insights/insights/…` |
| **Frappe LMS / Wiki / Gameplan** | `3p_other/frappe/{lms,wiki,gameplan}` | `frontend/src/…`, backend `<app>/<app>/…` |
| **Frappe suite** / **Frappe Central** | `3p_other/frappe/{suite,central}` | `frontend/src/apps/<app>/…` / `dashboard/src/…` |
| **Twenty** | `3p_other/twenty` | `packages/twenty-front/src/…`, `packages/twenty-server/src/…`, `packages/twenty-ui/src/…` |
| **Carbon** | `3p_other/carbon` | `apps/erp/app/{modules,routes}/…`, MES `apps/mes/app/…`, `packages/…` |
| **AureusERP** | `3p_other/aureuserp` | `plugins/webkul/<plugin>/src/Filament/…` |
| **Dolibarr** | `3p_other/dolibarr` | `htdocs/<module>/…` |
| **Dolibarr community modules** | `3p_other/dolibarr-community-modules` | `<module>/…` |
| **metasfresh** | `3p_other/metasfresh` | `frontend/src/…`, `backend/de.metas.<module>/…`, mobile web UI `misc/services/mobile-webui/mobile-webui-frontend/src/…` |
| **Akaunting** | `3p_other/akaunting` | `resources/views/…`, `app/…` |
| **Ever Gauzy** | `3p_other/ever-co/ever-gauzy` | `apps/gauzy/src/app/pages/…`, `packages/…` |
| **Ever Teams** / **Ever Rec** | `3p_other/ever-co/{ever-teams,ever-rec}` | repo root |
| **Nextcloud** | `3p_other/nextcloud` (bundle of app repos) | `<app>/src/…` (e.g. `calendar/src/`), bundled server apps `server/apps/<app>/…` |
| **Zimbra** | `3p_other/Zimbra` (bundle) | `zm-web-client/WebRoot/js/zimbraMail/…`, `zm-admin-console/WebRoot/js/zimbraAdmin/…`, `zd-full/ZimbraWebClient/…`, `zm-mailbox/…` |
| **Signal** | `3p_other/signalapp` (bundle) | `Signal-Desktop/ts/…`, `Signal-Server/…`, `libsignal/…`, `ringrtc/…` |
| **OpenProject** | `3p_other/openproject` | `app/…`, `modules/<module>/…`, `frontend/src/app/features/…` |
| **Redmine** | `3p_other/redmine` | `app/{views,controllers,models}/…` |
| **Moqui components** (Sales, WorkManagement, WeCreate, coarchy, resistmanagement, ServiceJobMonitor, ridgecrest) | `3p_moqui/<component>` | `screen/…`, `service/…`, `entity/…` |
| **Moqui baseline** | `mr-moqui-base/runtime` | `component/mr-marble/screen/SimpleScreens/…`, `component/mr-marble/screen/{MyAccount,BasicHandheld}/…` (siblings of `SimpleScreens/`, not under it), `component/mr-marble/screen/…`, `component/mr-mantle/entity/…`, `component/mr-mantle/{service/mantle,entity}/…` (`entity/` holds view entities and EECAs), `components/base/tools/screen/…`, `components/base/framework/entity/…`, `component/mr-boss/screen/…` |

Notes that trip people up:

- Odoo app addons are at `3p_other/odoo/odoo/addons/<addon>`, which this convention writes
  as `odoo/addons/<addon>`. Only `base` and the other core addons live one level deeper
  (`odoo/odoo/addons/base`). `odoo/addons/` (bundle-relative) is not the same directory as
  the core `odoo/odoo/addons/`.
- Odoo industry packages are at `3p_other/odoo/industry/`, not under `odoo/`.
- Frappe app repos contain a Python package of the same name, so backend paths repeat the
  name (`helpdesk/helpdesk/…`, `insights/insights/…`), except ERPNext and the framework,
  whose paths above already start inside the repo (`erpnext/…`, `frappe/…`).
- A file that cites several Frappe apps side by side (suite, Gameplan, Wiki, CRM, Insights)
  may use one **Frappe apps** row with checkout `3p_other/frappe` and paths that start with
  the app directory (`suite/frontend/…`). ERPNext and the Frappe framework always use their
  own rows above.
- Nextcloud Assistant is not in the checkout; drawers-commons cites it from the published
  repository and says so.

## 2. Research file skeleton

Front matter (in this order): title `# IronStone BOSS — <App> app research`, date line, a
paragraph naming the app sections from initial-design and the reused screens it covers,
**Organization**, **Scope**, **Path conventions** (table per §1), a **Not used here** line
naming checked references that ship nothing relevant, and a section nav.

Body: numbered `## N. <functional area>` sections, each with per-reference sub-tables
(`| Screen/page | What it is | Key files |`) and a closing **BOSS implications** paragraph:
what the evidence suggests for BOSS, written as findings and options ("the references
suggest", "one option is"), not as design decisions ("BOSS must build").

Closing sections (the last numbered sections, in this order, with these headings):

| Heading | Contents |
| --- | --- |
| `## N. Cross-app surfaces` | Table `Reused screen or link \| Use in <App> \| Other apps that include it \| Reference evidence`, per §3–§4 of this file |
| `## N+1. Current Moqui baseline (mr-marble / MarbleERP / Mantle)` | `### Screens`, `### Data model available`, `### Services` tables with verified paths (relative to the Moqui baseline checkout); what exists, what is missing |
| `## N+2. Gaps & BOSS implications` | The sub-sections below, in order |

Sub-sections of **Gaps & BOSS implications**:

1. `### Gaps in the reference set` — what no checkout covers, Enterprise-only or absent features.
2. `### Notable gaps in the Moqui baseline` — what the baseline lacks for this app's audience.
3. `### What each reference contributes` — table `Reference | Take`.
4. `### Candidate screen inventory (IronStone <App>)` — table `Area | Screens`: the screens the research points to for this app's audience, marking screens other apps would also include as **(reused: <apps>)**. Input to design, not a design.
5. `### Data-model findings` — which Mantle records fit (names verified against `mr-mantle`, not commented out), what they lack, and where new records look necessary; options rather than choices.
6. `### Sequencing notes` — dependencies and what the baseline already makes cheap or expensive (for example "quotes need agreement pricing in `get#ProductPrice`"); no release decisions.
7. `### Open questions` — questions for the design pass, including disagreements with this file or initial-design.

`### Checkout path quirks` may follow as a last sub-section. A closing **Bottom line**
paragraph is optional. `research-drawers-commons.md` applies the closing skeleton three
times, once each for **Header & drawers**, **Commons** and **Comms**, as sub-sections of
its Gaps & BOSS implications section.

## 3. Reused screens

Screens that several IronStone apps would include. Each app includes the same screen with
its own context (tabs, filters, allowed actions), so each app is complete for its audience
and the screen is built once. The second column lists the apps found in the research to need
it and what each app's version emphasizes; none is the owner.

| Reused screen | Apps that include it, and their emphasis | Mantle basis |
| --- | --- | --- |
| **Contact / party record** | Commons (contacts, address book); every app that shows a person or organization; Admin (user account on the party); People (employee data) | `Party`, `Person`/`Organization`, `ContactMech`, `PartyRelationship`, `PartyRole` |
| **Customer 360** | Sales (pipeline, quotes, orders, agreements); Customer Service (cases, returns, orders); Marketing (engagement, consent, campaigns); Accounting (balance, credit, aging, statements); Commerce (store account, carts, online orders) | `Party` with customer role + `OrderHeader`, `Request`, `ReturnHeader`, `Invoice`, `CommunicationEvent` |
| **Supplier 360** | Purchasing (terms, sourcing, performance); Accounting (AP balance, bills, payments); Products (supplier prices); Warehouse (inbound receipts) | `Party` with supplier role + `ProductPrice` rows with `vendorPartyId` (supplier price, lead time, supplier item id), `OrderHeader` (purchase), `Invoice` |
| **Employee 360** | People (employment, pay, leave, reviews); Admin (user account); Projects (allocations, timesheets); Commons (directory card) | `Person` + `PartyRelationship` `PrtEmployee` + `Employment`, `EmplPositionParty` |
| **Product 360** | Products (master data, variants, prices, costs, supplier list per initial-design "Product suppliers"); Commerce (merchandising, store categories, SEO); Purchasing (supplier rows, lead times, sourcing); Manufacturing (BOM, where-used); Warehouse (stock, lots, locations); Accounting (cost history); Sales (price and availability) | `Product`, `ProductAssoc`, `ProductPrice`, `ProductParty`, `ProductFacility` |
| **Order detail** (sales and purchase) | Sales (quotes, sales orders); Purchasing (purchase orders); Customer Service (changes, returns, cases); Warehouse (fulfillment: shipments, pick, ship); Accounting (invoices, payments); Commerce (online orders, channel filters on the order list) | `OrderHeader`, `OrderPart`, `OrderItem` (quotes are `OrderHeader` in `OrderOpen`/`OrderProposed`) |
| **Inventory availability** | Warehouse (full stock by facility, location, lot, reservations); Customer Service (availability and promise dates); Purchasing (shortfall and reorder); Sales (inline on quote/order lines); Manufacturing (component availability); Commerce (store availability) | `Asset`, `AssetReservation`, `ProductFacility`; service family `mantle.product.AssetServices.get#AvailableInventory*` (available-to-promise totals); location/lot breakdown from `AssetSummaryView` / `AssetLocationSummary`; projected stock from `InventoryReportServices.get#InventoryProjectedInfo` |
| **Shipment detail** | Warehouse (receive, pick, pack, ship, labels); Customer Service and Sales (tracking, promise dates); Purchasing (inbound against PO); Commerce (online order fulfillment); Accounting (cost and invoice links) | `Shipment` (`ShpTp*`), `ShipmentItem`, `ShipmentItemSource`, `ShipmentPackage` |
| **Material issue / receipt** | Manufacturing (component issue, finished-goods receipt on the work order); Warehouse (issue and receipt postings, stock movement); Maintenance (spare parts issued to a work order) | `AssetIssuance`, `AssetReceipt`; `mantle.product.AssetServices.issue#AssetToWorkEffort`, `receive#Asset` |
| **Facility & equipment record** | Maintenance (equipment register, maintenance history, facility tree); Warehouse (storage locations and setup); Manufacturing (production equipment, work centers); Commons (schedules and booking); Accounting (fixed-asset books) | `Facility`, `FacilityLocation`, `Asset` (`AstTpEquipment`, fixed-asset types) |
| **Request / case** | Customer Service (case intake, queues, SLA); Purchasing (purchase requests, `RqtPurchase`); Maintenance (maintenance requests); Projects (converted work); Sales (customer requests for quote, `RqtQuote`); Warehouse (internal stock requests, `RqtInventory`); Commons (requests assigned to me) | `Request`, `RequestItem`, `RequestParty`, `RequestCommEvent`, `RequestWorkEffort` |
| **Task / work item** | Projects (work items, boards, plans); Commons (my tasks); Customer Service and Sales (follow-up tasks); People (onboarding checklists) | `WorkEffort` (`WetTask`), `WorkEffortParty`, `WorkEffortAssoc` |
| **Calendar & schedules** | Commons (calendars, booking rooms and equipment); Maintenance (scheduling policies, approvals, blackout windows); Projects (plan views); People (leave and shift views) | `WorkEffort` (`WetEvent`), `WorkEffortFacility`, `WorkEffortAssetAssign` |
| **Chatter & activities** | One component on every app's record screens; activities roll up into the header Today panel | Messages: `CommunicationEvent` with record joins (`OrderCommunicationEvent`, `RequestCommEvent`, `WikiPageCommunicationEvent`, …); activities: `WorkEffort` (`WetTask`, purposes `WepToDo`, `WepPhoneCall`, `WepMeeting`, `WepEmail`) |
| **Approvals waiting** | Header Notifications panel (all apps); per-app lists in People (leave, expenses, pay hours), Projects (timesheets), Purchasing (PO and request approvals), Sales (quote and discount approvals, `OrderDecision`), Accounting (bill approval) | Status transitions on the source records; notification topics |
| **Invoice detail** (sales and purchase) | Accounting (approval, posting, payments, statements); Projects (the time and milestones behind each line, client view); Sales (invoices of orders); Purchasing (supplier bills against orders and receipts); Customer Service (invoices behind a case, credits) | `Invoice`, `InvoiceItem`, `PaymentApplication`; `WorkEffortInvoice`, `TimeEntry.invoiceId` |
| **Dashboard widgets** (number cards, charts) | Insights (dashboards, widget builder); every app's landing page | New dashboard/widget records over `DataDocument` + saved finds |

## 4. Overlapping functions

Functions more than one research file covers. Under the stand-alone rule each app listed
includes the function (usually as the same reused screen) in the form its audience needs.
The notes give the verified Mantle basis.

| Function | Apps that include it, and their emphasis | Notes |
| --- | --- | --- |
| Customer returns / RMA | Customer Service (authorization, reasons, case link); Warehouse (return receipt and disposition, `ShpTpSalesReturn`); Accounting (credit/refund, `ReturnItemBilling`); Commerce (online returns) | Mantle has the RMA record: `ReturnHeader`/`ReturnItem` with statuses Created → Requested → Approved → Shipped → Received → Completed |
| Purchase agreements & blanket orders | Purchasing; Accounting (terms) | `Agreement`, `AgreementItem`; no purchase agreement type is seeded |
| Supplier returns | Purchasing; Warehouse (outbound return shipment, `ShpTpPurchaseReturn`); Accounting (debit note) | |
| Prices & price rules | Products (base prices, costs, rules); Sales (customer and agreement prices); Commerce (store prices); Purchasing (supplier prices) | `ProductPrice`, `ProductPriceModify`; one price service (`get#ProductPrice`) serves all of them, and the references favor one that explains its result |
| Customer agreements | Sales; Accounting (terms); Customer Service (read) | `Agreement`, `AgreementItem` |
| Subscriptions & recurring contracts | Sales; Accounting (recurring invoicing); Commerce (subscription products in the store) | `Subscription`, `ProductSubscriptionResource`, `Agreement` |
| Promotions, coupons, loyalty | Marketing (programs); Commerce (store promotions and checkout); Sales (manual discounts on quotes) | `ProductStorePromotion`, `ProductStorePromoCode`, `OrderPromoCode`; Mantle scopes promotions to one store, and applies them to orders in a separate service (`apply#OrderPromotions`), not in `get#ProductPrice` |
| Fixed assets | Maintenance (register, lifecycle, custodian); Accounting (depreciation, capitalization, disposal) | Same `Asset` record; `AssetDepreciation` |
| Expense claims | People (capture, approval); Accounting (posting, tax, payment) | Employee-from `Invoice` or payroll reimbursement (`PrphExpenses`) |
| Time entry & timesheets | Projects (entry, approval); People (attendance, pay hours); Accounting (billing) | `TimeEntry`, `Timesheet`; attendance (clock in/out) also uses `TimeEntry` |
| Budgets | Accounting (GL budgets, per initial-design); Projects (project costing and cost caps, `WorkEffort.totalTimeAllowed`, `totalClientCostAllowed`) | `Budget` (`mantle.other.budget`) has no project link |
| Booking rooms & equipment | Commons (book, availability); Maintenance (policies, approvals, blackout windows) | Decided in initial-design |
| Knowledge base articles | Commons (wiki authoring); Customer Service (search, suggest, link to case, suggest edit) | `WikiPage`, `WikiPageRequest` |
| Surveys & forms | Marketing (surveys, per initial-design); Customer Service (CSAT); People (interview scorecards, training quizzes) | Framework `DbForm` + `FormResponse` (SimpleScreens `Survey/`); `FormResponse` links to no record |
| Quality inspection | Warehouse (receiving and returns inspection); Manufacturing (in-process and final inspection); Purchasing (supplier quality score) | No Mantle entity yet |
| Supplier invoices & 3-way match | Accounting (AP bills); Purchasing (match exceptions and holds against PO/receipt) | `Invoice` (purchase) |
| Carriers, ship methods, labels | Warehouse (carriers, labels); Commerce (checkout shipping options and rates per store) | `CarrierShipmentMethod`, `ShippingGateway*`, `ProductStoreShipOption` |
| Payment, shipping & tax settings | Commerce (per initial-design, per store); Accounting (tax authorities, payment methods); Admin (gateway configuration in the integrations area) | `PaymentGatewayConfig`, `ShippingGatewayConfig`, `TaxGatewayConfig`, `TaxAuthority`; the seeded local tax gateway is a stub |
| Landing pages & KPIs | Every app (its own landing page); Insights (dashboards, cross-app KPIs, management digest) | |
| Settings | Every app (its own settings section); Admin (settings index and system settings) | |
| User accounts, groups, app access | Admin; People and Commons (account details on the party) | `UserAccount`, `UserGroup`, `ArtifactGroup` |
| Email/SMS sending, mail accounts | Comms (accounts, sending, tracking, unsubscribe and consent); Marketing (campaign sends, audiences); Customer Service (case email); Admin (relay, gateway trust, protocol servers and queues) | `CommunicationEvent`, `EmailMessage`, `EmailServer`; consent data today is the `ContactListParty` opt-in status |
| Events & webinars | Commons (calendar events); Marketing (registration, tickets, communication schedule) | |
| List pivot/graph view modes | Every find screen, through the mr-moqui form-list (initial-design "switchable views"); Insights ("add to dashboard") | |
| Leads & opportunities | Sales; Marketing (lead sources, campaign attribution) | `SalesOpportunity`, `MarketingCampaign`, `TrackingCode` |

## 5. Mantle basis for recurring records

Verified against `runtime/components/addon/mr-mantle/entity/` on Oct 18, 2026. Research files
cite these names exactly; a claim that "Mantle has no X" must be checked against this list
and the entity files. Several entity definitions in those files are inside XML comments and
do not exist at runtime: check that an entity is not commented out before citing it.

| Concept | Mantle record (entity file) | Notes |
| --- | --- | --- |
| Quote | `OrderHeader` in `OrderOpen` / `OrderProposed` (OrderEntities) | No separate quote entity; `Request` type `RqtQuote` is a customer's request for quote, not a purchase RFQ (purchase RFQ model is open) |
| Sales / purchase order | `OrderHeader`, `OrderPart`, `OrderItem` (OrderEntities) | Purchase vs sales is per `OrderPart` (vendor/customer) |
| Return / RMA | `ReturnHeader`, `ReturnItem`, `ReturnItemBilling` (OrderEntities) | Statuses `ReturnCreated`, `ReturnRequested`, `ReturnApproved`, `ReturnShipped`, `ReturnReceived`, `ReturnCompleted`, `ReturnManResp`, `ReturnCancelled` |
| Case / request | `Request`, `RequestItem`, `RequestParty`, `RequestCommEvent`, `RequestWorkEffort`, `RequestCategory` (RequestEntities) | Types `RqtSupport`, `RqtInformation`, `RqtBugFix`, `RqtNewFeature`, `RqtPurchase`, `RqtQuote`, `RqtProposal`, `RqtInventory`, `RqtContact` |
| Purchase requirement | `Requirement`, `RequirementOrderItem`, `RequirementRequestItem` (RequestEntities) | Planning output that becomes a PO |
| Task, project, milestone, event | `WorkEffort` with `WetTask`, `WetProject`, `WetMilestone`, `WetEvent`, `WetRelease`, `WetTimeOff` (WorkEffortEntities) | Milestones already exist as a WorkEffort type (linked to tasks by `WorkEffortAssoc` `WeatMilestone`) |
| Work effort purposes | `WepMaintenance`, `WepProductionRun`, `WepAssembling`, `WepPickAssembly`, `WepRouting`, `WepRoutingTask`, `WepSubcontracting`, `WepShipmentShip`, `WepAssetUsage`, `WepToDo`, `WepPhoneCall`, `WepMeeting`, `WepEmail`, `WepTraining`, `WepTimesheet`, … | Routings exist in the data model (`WepRouting`/`WepRoutingTask`, `WeatRoutingComp`, `WeptRouting`, `ProductAssoc.routingWorkEffortId`) but no screen or service uses them; `WepSubcontracting` is a top-level purpose, not under Manufacturing; picklists are `WepShipmentShip` work efforts (`Shipment.shipWorkEffortId`); kits are `PtPickAssembly` products |
| Assignments and relations | `WorkEffortParty`, `WorkEffortAssoc`, `WorkEffortFacility`, `WorkEffortAssetAssign`, `OrderItemWorkEffort` | Not `WorkEffortPartyAssignment`; there is no resource-allocation record (`WorkEffortParty` has no hours) |
| Time | `TimeEntry`, `Timesheet`, `TimesheetParty` (WorkEffortEntities) | |
| Budgets | `Budget`, `BudgetItem`, `BudgetRevision`, `BudgetScenario`, … (`mantle.other.budget`, AccountingOtherEntities) | Period/GL budgets; no project link |
| Subscriptions | `Subscription`, `SubscriptionDelivery`, `ProductSubscriptionResource` (ProductDefinitionEntities) | |
| Pricing | `ProductPrice`, `ProductPriceModify`, `ProductStorePromotion`, `ProductStorePromoCode`, `OrderPromoCode` | One `ProductPrice` table carries list, store (`productStoreId`), customer (`customerPartyId`), agreement (`agreementId`) and supplier (`vendorPartyId`, `standardLeadTimeDays`, `otherPartyItemId`) prices; there is no separate supplier-product entity |
| Agreements | `Agreement`, `AgreementItem`, `AgreementTerm`, `AgreementParty`, … (PartyEntities) | |
| Messages | `CommunicationEvent` (+ `Party`, `Content`, `Product`, `Purpose`) (PartyEntities) | Record joins exist per record type (orders, requests, wiki pages) |
| Marketing | `MarketingCampaign` (budget, costs, expected revenue, approval status), `ContactList`, `ContactListParty` (opt-in status), `ContactListCommStatus`, `MarketSegment`, `TrackingCode`, `TrackingCodeVisit`, `TrackingCodeOrder` (MarketingEntities) | No screen or service in the baseline uses these entities |
| Equipment & maintenance | `Asset`, `AssetMaintenance`, `ProductMaintenance`, `AssetMeter` (ProductAssetEntities) | |
| Facilities | `Facility`, `FacilityLocation`, `FacilityParty`, … (FacilityEntities) | `FacilityLocation` is flat (area/aisle/section/level/position, capacity, location type); production lines are `FcTpLine` facilities |
| Shipping | `Shipment`, `ShipmentItem`, `ShipmentItemSource`, `ShipmentPackage`, `Delivery` (ShipmentEntities) | Type field is `shipmentTypeEnumId` |
| HR | `Employee` (payroll tax data), `Employment`, `EmplPosition`, `EmplPositionClass`, `EmploymentLeave`, `EmploymentApplication`, `PartySkill`, `PayrollAdjustment`, `RateAmount`, … (HumanResourcesEntities) | **Commented out** (not usable without enabling): `PerformanceReview`, `PerformanceReviewItem`, `PerformanceNote`, `PartyQualification`, `PartyResume`, `PersonTraining`, `TrainingClass`, `JobRequisition`, `JobInterview` |
| Surveys & forms | `moqui.screen.form.DbForm`, `FormResponse` (framework ScreenEntities) | Not a Mantle entity |
| Wiki & blog | `moqui.resource.wiki.WikiSpace`, `WikiPage`, `WikiBlog` (framework ResourceEntities) | Blog posts exist in the framework wiki |
| Analytics dimensions | `moqui.olap.DateDayDimension`, `CurrencyDimension` (framework) | Nothing fills or reads them; Mantle `*Dimension` entities are measurement values, not analytics dimensions |
| **Commented out elsewhere** | — | Not usable without enabling: `CostComponent`, `CostComponentCalc`, `ProductCostComponentCalc`, `ProductAverageCost`, `ProductConfig*` (ProductDefinitionEntities); `TaxAuthorityRate` (AccountingOtherEntities); `AssetProduct`, `ShipmentInsuredRefunded`, `PartyClassificationSingle`, `PartyClassDimension`, `PartySettingTypeClass`; framework `SystemMessageHook`, `SystemMessageHookStatus`, `DynamicScreen*` |

## 6. Names and terms

**Reference names** (use these, not variants such as "Ever Co (gauzy)" or "Frappe/ERPNext"):
Odoo, ERPNext, Frappe framework, Frappe CRM, Frappe Helpdesk, Frappe HR, Frappe Insights,
Frappe LMS, Frappe Wiki, Gameplan, Frappe suite, Frappe Central, Twenty, Carbon (Carbon MES
for `apps/mes`), AureusERP, Dolibarr, metasfresh, Akaunting, Ever Gauzy, Ever Teams,
Nextcloud (with the app: Nextcloud Calendar, Nextcloud Talk, …), Zimbra (zm-web-client,
zm-admin-console, zd-full), Signal Desktop, OpenProject, Redmine, Moqui Sales, Moqui
WorkManagement, WeCreate, coarchy, resistmanagement, ServiceJobMonitor, ridgecrest, and
**Moqui baseline** for mr-marble + Mantle + tools together.

**BOSS terms.**

| Term | Meaning |
| --- | --- |
| Case | A Customer Service `Request`; say "ticket" only when quoting a reference |
| Customer 360 / Supplier 360 / Employee 360 / Product 360 / Equipment 360 | The shared record screens in §3; "Party 360" is not used |
| Chatter | The message, activity and attachment timeline beside a record |
| Activity | A scheduled next action (call, email, to-do, meeting) on a record; a `WorkEffort` |
| Today panel | The header panel of tasks due, today's events, activities and overdue items |
| Maintenance work order | A `WorkEffort` with purpose `WepMaintenance` |
| Work order / production run | A Manufacturing production order, a `WorkEffort` with purpose `WepProductionRun` |
| Work item | A Projects task (`WetTask`); Projects uses "work item", Commons uses "task" for the same record |
| Landing page | An app's home screen; "dashboard" means an Insights dashboard |
| Vendor (SimpleScreens) | SimpleScreens `Vendor/` screens are internal organizations (the company's own orgs), not suppliers; supplier screens are `Supplier/` |

## 7. Reference coverage by app

Checked-out references most likely to matter for each file, including ones the first pass
under-used. A file's **Not used here** line must name the ones it checked and found empty.

| Research file | Primary references | Also check |
| --- | --- | --- |
| accounting | Odoo, ERPNext, Carbon, Dolibarr, Akaunting, AureusERP | Dolibarr community modules, metasfresh, Frappe `payments`, `lending` |
| admin | Zimbra admin, Nextcloud server settings, Odoo, Frappe framework, Twenty, Carbon, Dolibarr | Frappe Central, ServiceJobMonitor, OpenProject and Redmine admin |
| commerce | Odoo website/website_sale, Dolibarr, ERPNext portal, Ever Gauzy plugins | ridgecrest (Moqui storefront on PopRestStore), Frappe `payments` |
| customer-service | Frappe Helpdesk, ERPNext support, Dolibarr tickets, Carbon RMA, Odoo | Redmine mail handler, Nextcloud Collectives, Frappe Wiki |
| drawers-commons | Nextcloud apps, Zimbra, Frappe suite, Twenty, Ever Gauzy, Signal, Odoo mail/Discuss/activities, OpenProject notifications | Frappe Wiki, Gameplan, OpenProject/Redmine wiki and news |
| insights | Frappe Insights, ERPNext/Frappe workspaces, Odoo, Twenty, Carbon | OpenProject reporting and grids |
| maintenance | Odoo, ERPNext, Carbon, AureusERP, Dolibarr, Ever Gauzy | Nextcloud Calendar resources, Zimbra resources |
| manufacturing | Odoo, ERPNext, Carbon (ERP and MES), AureusERP, Dolibarr, metasfresh | — |
| marketing | Odoo, Frappe framework, ERPNext, Twenty, Dolibarr | Nextcloud Forms, Frappe LMS (events), Moqui baseline wiki blogs |
| people | Frappe HR, Odoo, AureusERP, Ever Gauzy, Dolibarr, Carbon | Frappe LMS (training), OpenProject working times |
| products | Odoo, ERPNext, Carbon, AureusERP, Dolibarr | metasfresh, Ever Gauzy catalog plugin |
| projects | OpenProject, Redmine, Odoo, ERPNext, AureusERP, Dolibarr, Ever Gauzy | Moqui WorkManagement, WeCreate, Gameplan |
| purchasing | Odoo, ERPNext, Carbon, AureusERP, Dolibarr, metasfresh | Akaunting (bills only) |
| sales | Odoo, Frappe CRM, ERPNext, Twenty, Carbon, Moqui Sales | Dolibarr, Ever Gauzy pipeline |
| warehouse | Odoo, ERPNext, Carbon (ERP and MES), AureusERP, Dolibarr, metasfresh | ridgecrest (marketplace and fulfillment-center import only; no pick/pack screens) |

**Odoo Enterprise-only, verified absent from the community checkout:** `account_asset`,
`account_reports`, `quality_control`, `stock_barcode`, `helpdesk`, `hr_payroll`,
`hr_appraisal`, `sale_subscription`, `mrp_mps`, `marketing_automation`. Present: `website_sale`
and eight `website_sale_*` addons, `maintenance`, `repair`, `fleet`, `mass_mailing*`, `survey`,
`event*`, `loyalty`.

## 8. Open questions

Cross-file questions for the design pass. Per-file questions stay in each file.

- **Reused screen granularity.** For each screen in §3, is it one screen with per-app context
  (tabs, filters, actions) or a set of sub-screens each app assembles? The Order detail
  (sales and purchase orders) and Customer 360 are the largest cases.
- **Where reused configuration is kept.** When several apps include the same settings (payment,
  shipping and tax gateways in Commerce, Accounting and Admin; carriers in Warehouse and
  Commerce; mail domains and templates in Comms, Marketing and Admin), the records are
  shared; which app's screens edit them, and which only read?
- **Survey and form builder.** Included in Marketing (initial-design), Customer Service and
  People; should Commons also include it beside notes and files?
- **Quality inspection.** Included in Warehouse and Manufacturing; is a further quality
  function (templates, non-conformance, corrective action) needed?
- **Prices.** Products, Sales, Commerce and Purchasing all include price screens over one
  `ProductPrice` table; are customer-specific price lists agreements or price rules?
- **Generic record links for Chatter and activities.** Mantle has per-record join entities
  (`OrderCommunicationEvent`, `RequestCommEvent`, …) but no generic "any record" link.
  Chatter on every record needs either more join entities or a generic link record. Orders
  have no activity link today (only `OrderItemWorkEffort`), and survey `FormResponse` rows
  link to no record (CSAT needs a case link).
- **Approvals.** Header Notifications panel only, or also per-app approval lists (People,
  Purchasing, Sales and Accounting research each describe one)?
- **Portals.** Customer portal (orders, invoices, cases, quote acceptance) and vendor portal
  (RFQ responses, PO acknowledgement): one portal reused by several apps, or a portal per app?
- **Public pages.** Careers page (People) and storefront (Commerce): is a customer-facing site
  in BOSS scope (ridgecrest shows Mantle can run one)?
- **Promotions across stores.** Mantle scopes `ProductStorePromotion` to one store; is a
  promotion program that spans stores and channels needed?
- **Customer-owned equipment repair and warranty.** Researched in both Customer Service and
  Maintenance; which records (case, repair order, maintenance work order) carry it?
- **Commented-out Mantle entities.** Enable the "future reference" definitions (HR reviews,
  training and recruiting; cost components; product configuration; tax rates) in
  mr-mantle, or define BOSS records?
- **Smaller cross-app questions:** internal stock requests (`RqtInventory`); replenishment and
  Manufacturing MRP planning over the same requirements; non-equipment downtime; rate cards
  (`RateAmount`, edited under HumanRes today); working-hours calendars used by SLA, People
  and Commons; the personal "Me" page (People and Commons); 3PL stock sync (Warehouse and
  Admin); blogs (Marketing screens over Commons wiki pages).
