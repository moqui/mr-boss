# IronStone BOSS — Warehouse app research

Oct 18, 2026

Reviewed against sources Oct 18, 2026; follows [research-crosscut.md](research-crosscut.md).

Deeper research pass on the **IronStone Warehouse** app, cataloguing every relevant screen/page found in the reference apps. It covers the initial-design sections **Receiving** (inbound, put-away, inspection), **Shipping** (pick, pack, ship, carriers), **Inventory** (stock by location, counts, adjustments, transfers), **Returns receiving** and **Locations & facility setup**. It covers the reused screens Warehouse includes (crosscut §3–§4) and what Warehouse's version of each emphasizes: **Inventory availability** (full stock by facility, location, lot and reservations), **Shipment detail** (receive, pick, pack, ship), **Order detail** (fulfillment), **Product 360** (stock, lots, locations), **Supplier 360** (inbound receipts), the **Facility & equipment record** (storage locations and setup), quality inspection, customer and supplier returns, and carriers, ship methods and labels. Companion to [3p-app-reference.md](3p-app-reference.md) and [initial-design.md](initial-design.md).

**Organization.** Sorted by functional area (not by app): all receiving screens together, all picking screens together, etc. Within each area, sub-tables per reference app, then a **BOSS implications** paragraph. The closing sections follow research-crosscut.md §2: cross-app surfaces (§15), the current Moqui baseline (§16) and gaps & BOSS implications (§17).

**Scope.** Business UI only: screens, dialogs, lists, scan flows, report pages and the posting controls a warehouse user actually touches. Posting/allocation logic is noted only where it shapes a screen (statuses, reservations, backorders, validation gates, quantity fields). Product-master, manufacturing-execution and accounting-valuation screens are covered only where they are reached from a warehouse task.

**Path conventions.** Every backticked path resolves against the checkout given for its prefix (research-crosscut.md §1). All checkouts are under `/home/jonesde/work/moquiwork/`. A tail is used only when the same cell or row already names its directory.

| Prefix | Checkout | Paths start with |
| --- | --- | --- |
| **Odoo** | `3p_other/odoo` (bundle: `odoo/` repo + `industry/` repo) | `odoo/addons/<addon>/…` (views in `views/`, reports in `report/`, wizards in `wizard/`, OWL in `static/src/`); `industry/<package>/` for verticals |
| **ERPNext** | `3p_other/frappe/erpnext` | `erpnext/<module>/…`; stock is `erpnext/stock/` (`doctype/`, `report/`, `workspace/`, `page/`, `print_format/`), quality management `erpnext/quality_management/` |
| **Carbon** (Carbon MES for `apps/mes`) | `3p_other/carbon` | `apps/erp/app/{modules,routes}/…` (inventory UI `apps/erp/app/modules/inventory/ui/`, quality UI `apps/erp/app/modules/quality/ui/`, routes `apps/erp/app/routes/x+/…`), MES `apps/mes/app/…`, `packages/…` |
| **AureusERP** | `3p_other/aureuserp` | `plugins/webkul/<plugin>/src/Filament/…`; in this file `.../` stands for `plugins/webkul/inventories/src/Filament/` (clusters Operations, Configurations, Products, Reporting, Settings) |
| **Dolibarr** | `3p_other/dolibarr` | `htdocs/<module>/…` (stock `htdocs/product/stock/`, inventories `htdocs/product/inventory/`, shipments `htdocs/expedition/`, receptions `htdocs/reception/`) |
| **metasfresh** | `3p_other/metasfresh` | `frontend/src/…`, `backend/de.metas.<module>/…` (mobile apps in `backend/de.metas.handlingunits.mobileui/`, `backend/de.metas.inventory.mobileui/`, `backend/de.metas.picking.rest-api/`, Java under `src/main/java/de/metas/…`) |
| **Ever Gauzy** | `3p_other/ever-co/ever-gauzy` | `apps/gauzy/src/app/pages/…`, `packages/…` |
| **Moqui components** (Moqui Sales, ridgecrest) | `3p_moqui/<component>` | `screen/…`, `service/…`, `entity/…` |
| **Moqui baseline** | `mr-moqui-base/runtime` | `component/mr-marble/screen/SimpleScreens/…`, `component/mr-marble/screen/BasicHandheld/…`, `component/mr-marble/screen/…`, `component/mr-mantle/entity/…`, `component/mr-mantle/service/mantle/…`, `component/mr-mantle/test/…` |

**Not used here:** Akaunting, Twenty, Nextcloud, Zimbra, Signal, OpenProject, Redmine and the Frappe apps other than ERPNext (CRM, Helpdesk, HR, Insights, LMS, Wiki, Gameplan, suite, Central, payments, lending) ship no stock, location or shipment screens. Dolibarr community modules (e-invoicing and payment connectors) have nothing for stock. Moqui WorkManagement, WeCreate, coarchy, resistmanagement and ServiceJobMonitor have no warehouse screens. The Odoo industry packages other than `3pl_logistic_company` (food and beverage distribution, hardware shop, …) are data and settings over the standard stock screens. Odoo Enterprise `stock_barcode` and `quality_control` are absent from the checkout (crosscut §7).

Sections: [1 warehouse home & queues](#1-warehouse-home--work-queues) · [2 receiving & inbound](#2-receiving--inbound) · [3 put-away, internal transfers & warehouse transfers](#3-put-away-internal-transfers--warehouse-transfers) · [4 inspection & quality](#4-inspection--quality) · [5 stock by location & availability](#5-stock-by-location--availability) · [6 counts, adjustments & reconciliation](#6-counts-adjustments--reconciliation) · [7 picking](#7-picking) · [8 packing, shipping & carriers](#8-packing-shipping--carriers) · [9 returns receiving](#9-returns-receiving) · [10 lots, serials, packages & traceability](#10-lots-serials-packages--traceability) · [11 locations, storage & facility setup](#11-locations-storage--facility-setup) · [12 barcode, handheld & scan flows](#12-barcode-handheld--scan-flows) · [13 reports, valuation & audit](#13-reports-valuation--audit) · [14 settings & configuration](#14-settings--configuration) · [15 cross-app surfaces](#15-cross-app-surfaces) · [16 current Moqui baseline](#16-current-moqui-baseline-mr-marble--marbleerp--mantle) · [17 gaps & BOSS implications](#17-gaps--boss-implications)

---

## 1. Warehouse home & work queues

### Odoo — Inventory Overview is a board of operation types

The Inventory app has no generic dashboard: the landing screen is a kanban of **operation types**, one card per receipt / delivery / internal / manufacturing / POS flow, each card acting as a live work queue.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Inventory root menu | **Operations** (Transfers, Adjustments, Procurement, Jobs) · **Products** · **Reporting** · **Configuration**; the root is gated to stock user/manager | `odoo/addons/stock/views/stock_menu_views.xml` (menuitems `menu_stock_root`, `menu_stock_warehouse_mgmt`, `menu_stock_transfers`, `menu_stock_adjustments`, `menu_stock_jobs`, `menu_stock_inventory_control`, `menu_warehouse_report`), `odoo/addons/stock/views/res_config_settings_views.xml` |
| Inventory Overview | Kanban (`js_class="stock_dashboard_kanban"`) over operation types; each card has the type name, warehouse, a primary "N To Receive / To Deliver / To Process" button (or "Open"), and secondary links for **Waiting**, **Late**, **Back Orders** counts that open the same transfer list pre-filtered | `odoo/addons/stock/views/stock_picking_type_views.xml` (`stock_picking_type_action`, `stock_picking_type_kanban`) |
| Card mini-chart | Bar sparkline of moves for past / present / future days; clicking a bar opens the transfers filtered to that date bucket and operation type | `odoo/addons/stock/static/src/picking_type_dashboard_graph/picking_type_dashboard_graph_field.js`; action `stock.click_dashboard_graph` |
| Card menu | **Reporting**, **Detailed Moves**, **Prepare Batch**; manager-only favorite/color/Configuration controls | `odoo/addons/stock/views/stock_picking_type_views.xml` (`stock_picking_type_kanban`, menu template) |
| Transfer work lists | Server actions for all / incoming / outgoing / internal / ready / waiting / late / backorder transfers; list, kanban and calendar views over the same `stock.picking` model | `odoo/addons/stock/views/stock_picking_views.xml` (`action_picking_tree_all`, `action_picking_tree_incoming`, `action_picking_tree_outgoing`, `action_picking_tree_internal`, `action_picking_tree_ready`, `action_picking_tree_waiting`, `action_picking_tree_late`, `action_picking_tree_backorder`, `stock_picking_kanban`, `stock_picking_calendar`) |
| Batch (wave) work list | Separate list/kanban/card/calendar for batch transfers, with assignee and transfer count | `odoo/addons/stock/views/stock_picking_batch_views.xml` (`stock_picking_batch_action`, `stock_picking_batch_tree`, `stock_picking_batch_kanban`, `stock_picking_batch_card`, `stock_picking_batch_calendar`) |

### AureusERP — the same operation-type card board in Filament

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Inventory Overview | Filament page (slug inventory/overview), shield-gated, header widgets only | `plugins/webkul/inventories/src/Filament/Pages/Overview.php`, `resources/views/filament/pages/overview.blade.php` |
| Operation-type cards | One card per `OperationType`; shows a ready count with a type-specific label ("to receive", "to deliver", "to process"), plus links for waiting, late, back-orders and all operations; every link deep-links to the Receipt / Delivery / Internal resource index with a query-builder filter for that operation type and active table view | `plugins/webkul/inventories/src/Filament/Widgets/OperationTypeOverviewWidget.php`, `OperationTypeCardWidget.php` |
| Operation tables | Table columns: favorite toggle, name, source/destination location, partner, responsible user, scheduled at, deadline, closed at, origin, operation type, company, state; group-by state/origin/type/scheduled/created; a modal query-builder filter (text, relationship, state, dates, company, creator); bulk delete | `plugins/webkul/inventories/src/Filament/Clusters/Operations/Resources/OperationResource/Tables/OperationsTable.php` |

### ERPNext — Desk "Stock" workspace with KPI cards and report cards

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Stock workspace | Onboarding block, "Stock Value by Item Group" chart, three number cards (**Total Stock Value**, **Total Warehouses**, **Total Active Items**), then seven link cards: Stock Reports, Serial & Batch Reports, Movement Reports, Item Reports, Audit Reports, Tools, Setup | `erpnext/stock/workspace/stock/stock.json` |
| KPI definitions | Number cards over `Bin`, `Warehouse`, `Item`; supporting charts: purchase-receipt trends, delivery trends, stock value by item group, warehouse-wise stock value, oldest items, item shortage summary | `erpnext/stock/number_card/*/*.json`, `erpnext/stock/dashboard_chart/*/*.json` |
| Report cards | Grouped link lists (not screens themselves): Stock Ledger, Stock Balance, Stock Projected Qty, Stock Analytics, Stock Ageing, Warehouse Wise Stock Balance, Total Stock Summary, Item Shortage, Reorder Level, Reserved Stock, Serial/Batch traceability, audit reports, and tools (Repost Item Valuation, Stock Closing Entry, Putaway Rule, Delivery Trip, Shipment, Quick Stock Balance) | `erpnext/stock/workspace/stock/stock.json` |
| Stock dashboard | Separate `erpnext/stock/stock_dashboard/` fixture directory supplies the module dashboard data | `erpnext/stock/stock_dashboard/` |

### Dolibarr — stock-area home is a warehouse list plus latest movements

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Stock area home | Warehouse search, a list of warehouses with links, and a "last stock movements" table with a **Full list** link; no configurable dashboard of its own | `htdocs/product/stock/index.php` |
| Global home boxes | The company home page is a user-arranged grid of boxes; stock is represented only through generic movement/warehouse boxes, not a dedicated warehouse board | `htdocs/index.php`, `htdocs/admin/boxes.php`, registration `htdocs/core/boxes/modules_boxes.php` |
| Warehouse list | Searchable/sortable warehouse list with status, country and product count columns | `htdocs/product/stock/list.php` |

### Carbon — module rail with a quantities-first landing page

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Inventory navigation | Five groups: **Stock** (Quantities, Movements, Inventory Count, Kanbans) · **Shipping & Receiving** (Receipts, Shipments) · **Transfers** (Picking Lists, Stock Transfers, Warehouse Transfers) · **Traceability** (Tracked Entities, Traceability) · **Configure** (Storage Units, Storage Types, Storage Rules, Shipping Methods) | `apps/erp/app/modules/inventory/ui/useInventorySubmodules.tsx` |
| Inventory landing | `/x/inventory` redirects to **Quantities**, a dense stock table with custom columns, filters, export, and tabs for Quantities / Batch Quantities / Serial Quantities | `apps/erp/app/routes/x+/inventory+/_index.tsx`, `inventory+/quantities.tsx`, `apps/erp/app/modules/inventory/ui/Inventory/InventoryTable.tsx` |
| Quantities columns | Item ID/name, On Hand, Days remaining, Lead Time, Reorder Policy, Replenishment system, Usage/day (30d, 90d), On Purchase Order, On Jobs, On Production Demand, On Sales Order, Demand Forecast, UoM, material attributes (shape, substance, finish, grade, dimension, type), tags, storage type/unit, active; **Recalculate** action | `apps/erp/app/modules/inventory/ui/Inventory/InventoryTable.tsx` |
| Kanbans | Replenishment kanban definitions (Buy / Make / Transfer), creating one card per item/replenishment policy; list page has new/delete flows | `apps/erp/app/routes/x+/inventory+/kanbans.tsx`, `kanbans.new.tsx`, `kanbans.$id.tsx`, `apps/erp/app/modules/inventory/ui/Kanbans/` |

### metasfresh — generic window shell; no warehouse home of its own

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Generic dashboard / window shell | All warehouse "screens" are backend-defined windows rendered by the same document-list + master-window containers; no module-specific React page | `frontend/src/containers/DocumentListContainer.js`, `MasterWindowContainer.js`, `frontend/src/components/window/` |
| Delivery planning header | Document-list header above a delivery-planning window that sums **planned/actual loaded** and **planned/actual discharged** quantities per UoM over the selected rows (or current page) | `frontend/src/components/deliveryPlanning/DeliveryPlanningViewHeader.js`, `OIViewHeader.js` |

**BOSS implications.** Every reference that has a real warehouse lands on a queue, not a chart wall. Odoo/AureusERP's operation-type card board is the strongest candidate for the Warehouse home: Receiving, Put-away, Picking, Packing, Shipping, Returns, Counts, each with ready / waiting / late / backorder counts and a sparkline, and every tile deep-links into a pre-filtered work list. ERPNext's KPI strip (stock value, warehouse count, active items) sits beside the queue in the references, not in place of it. On Moqui this could map to a `Screen` with a `form-list` of operation-type summary rows (or a dashboard portlet), backed by counts over `Shipment`/`PhysicalInventory` rather than a new aggregation table; the pre-filtered list is a screen parameter, not a separate screen. Mantle shipment statuses (`ShipInput`, `ShipScheduled`, `ShipPicked`, `ShipPacked`, `ShipShipped`, `ShipDelivered`) and types (`ShpTpPurchase`, `ShpTpSales`, `ShpTpTransfer`, `ShpTpSalesReturn`, `ShpTpPurchaseReturn`) already give the card buckets; the SimpleScreens Shipping dashboard's `FacilitySummary` (approved order quantity by facility, ship method and carrier) is the only existing queue-like view (§16).

---

## 2. Receiving & inbound

### Odoo — receipt is one `stock.picking` form with an editable move list

Receiving is not a separate model: a receipt is a picking of an incoming operation type. The same form also serves deliveries and internal transfers, with fields and buttons toggled by `picking_type_code`.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Transfer list | Columns: priority, reference, from/to location, partner, signed flag, responsible user, scheduled date, availability, deadline, effective date, origin, backorder, operation type, batch, company, status, activity exception; header **Reserve**; search filters for To Do / My Transfers / Starred / Draft / Waiting / Ready / Receipts / Deliveries / Internal / Late / Backorders; group-by status/date/origin/country/type/batch | `odoo/addons/stock/views/stock_picking_views.xml` (`vpicktree`) |
| Receipt form | Header buttons: Mark as To Do, Reserve, Validate, Print (before/after done), Return, Exchange, Cancel, Lock/Unlock; status bar for incoming is `draft,assigned,done` (no confirmed step); button box: Returns, Scraps, Packages, Traceability, Allocation, Moves, Next Transfer, Batch | `odoo/addons/stock/views/stock_picking_views.xml` (`view_picking_form`) |
| Receipt header fields | "Receive From" partner, operation type, destination location, scheduled date + reschedule popover, deadline, product availability indicator, effective date, origin (e.g. PO0032), owner (owner-tracked stock), picking properties | `odoo/addons/stock/views/stock_picking_views.xml` (`view_picking_form`) |
| Operations tab | Editable move rows: product, description, forecast availability widget, demand, done quantity, UoM, picked flag, lot/serial tags (create-on-receipt controlled by `use_create_lots`), destination package, **Details**; buttons **Put in Pack**, **Return All**, **Clear** | `odoo/addons/stock/views/stock_picking_views.xml` (`view_picking_form`, `move_ids` list) |
| Additional Info / Note | Move type, responsible user, company, batch; internal note printed on the picking operations sheet | `odoo/addons/stock/views/stock_picking_views.xml` |
| Validation / backorder dialog | Warns when less than the initial demand was processed; creates a backorder or closes without one; per-transfer toggle when several transfers are validated together | `odoo/addons/stock/wizard/stock_backorder_confirmation_views.xml`, `stock_backorder_confirmation.py` |
| Put in Pack dialog | Package type, max quantity per package + UoM, existing destination package or blank to create new; puts selected move lines into packages | `odoo/addons/stock/wizard/stock_put_in_pack_views.xml` |
| Print actions | Picking Operations, Delivery Slip, Packages, Reception label; report templates include reception, delivery slip, return slip, package/lot/location barcodes | `odoo/addons/stock/report/stock_report_views.xml`, `report_stock_reception.xml`, `report_deliveryslip.xml`, `report_return_slip.xml`, `report_package_barcode.xml` |
| Chatter | Message/activity/attachment timeline on every transfer | `view_picking_form` (`<chatter/>`) |

### ERPNext — Purchase Receipt doctype with received/rejected quantities

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Purchase Receipt list/form | Generated Desk list/form over `Purchase Receipt`; list columns posting date, grand total, per-billed, per-returned; form is submittable with statuses Draft / Partly Billed / To Bill / Completed / Return / Return Issued / Cancelled / Closed | `erpnext/stock/doctype/purchase_receipt/purchase_receipt.json`, `purchase_receipt.js`, `purchase_receipt.py` |
| Receipt header | Supplier, supplier delivery note, posting date/time, company, is-return + return-against, supplier/shipping addresses and contacts, currency/price list, set warehouse, rejected warehouse, subcontracting flags, taxes/shipping rule, totals | `erpnext/stock/doctype/purchase_receipt/purchase_receipt.json` |
| Receipt lines | Item, received qty, accepted qty (`qty`), **rejected qty**, UoM, warehouse, rejected warehouse, quality inspection link, purchase order link, schedule date, valuation rate, landed-cost amount | `erpnext/stock/doctype/purchase_receipt_item/purchase_receipt_item.json` |
| Receipt actions | Debit Note, Delivery Note, Landed Cost Voucher, Purchase Invoice, Asset, Asset Movement, Purchase Order, Close, **Purchase Return**, Make Stock Entry, Sample Retention Stock Entry, Reopen | `erpnext/stock/doctype/purchase_receipt/purchase_receipt.js` (`add_custom_button` labels) |
| Barcode/scan | `scan_barcode` header shortcut populates lines by barcode; line has explicit `barcode` + `has_item_scanned` | `erpnext/stock/doctype/purchase_receipt/purchase_receipt.json`, `erpnext/stock/doctype/purchase_receipt_item/purchase_receipt_item.json` |
| Create from PO | Purchase Order has a **Create → Purchase Receipt** action, mapping open PO lines/quantities | `erpnext/buying/doctype/purchase_order/purchase_order.js` (`make_purchase_receipt`) |
| Receiving print | Purchase Receipt serial/batch print format plus receipt trend chart | `erpnext/stock/print_format/purchase_receipt_serial_and_batch_bundle_print/`, `erpnext/stock/dashboard_chart/purchase_receipt_trends/` |
| Stock Entry (alternative receipt path) | Submittable document with purpose **Material Receipt** (also Material Issue, Material Transfer, Manufacture, Repack, Send to Subcontractor, Disassemble, Receive from Customer, …); lines carry source/target warehouse, qty, serial/batch bundle, quality inspection | `erpnext/stock/doctype/stock_entry/stock_entry.json`, `erpnext/stock/doctype/stock_entry_detail/stock_entry_detail.json`, `stock_entry.js` |

### Carbon — Receipts are first-class documents with source-document selection

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Receipts list | Table with ID, type, source document + readable ID, status, invoiced flag, posted by/date, assignee, supplier, external reference, created/updated by and timestamps; **Add Receipt** action; custom columns | `apps/erp/app/modules/inventory/ui/Receipts/ReceiptsTable.tsx`, route `apps/erp/app/routes/x+/receipt+/` |
| New receipt form | Source document selector (Sales Return Order, Purchase Order, Purchase Invoice, Inbound Transfer; Rental Agreement only for rental receipts), source document ID (searches the chosen source), location, external reference | `apps/erp/app/modules/inventory/ui/Receipts/ReceiptForm/ReceiptForm.tsx`, `useReceiptForm.tsx` |
| Receipt detail header | Status chip, created-by/due/at-location meta, assignee, **Post** / **Void** / **Delete** menu actions, print; posting button opens the post modal | `apps/erp/app/modules/inventory/ui/Receipts/ReceiptHeader.tsx`, `Receipts/ReceiptPostModal.tsx`, `Receipts/ReceiptVoidModal.tsx` |
| Receipt lines | Line cards with item, received quantity, serial numbers (one per line), tracking (batch) selection, batch properties, shelf-life/expiry, attachments per line, fixed-asset lines, rental-unit lines; split/update/tracking sub-routes | `apps/erp/app/modules/inventory/ui/Receipts/ReceiptLines.tsx`, routes `apps/erp/app/routes/x+/receipt+/{$receiptId,$receiptId.details,$receiptId.post}.tsx`, `lines.update.tsx`, `lines.tracking.tsx`, `lines.split.tsx`, `lines.return-entities.tsx` |
| Posting validation | Post modal lists missing/over-quantity tracking lines and blocks posting until serial/batch quantities are complete; also evaluates rule violations | `apps/erp/app/modules/inventory/ui/Receipts/ReceiptPostModal.tsx` |
| Receipt documents panel | Related-document rail: supplier, source document, inspections raised, invoices that billed it, files attached to lines; streams async rows | `apps/erp/app/modules/inventory/ui/Receipts/ReceiptDocuments.tsx` |
| Receipt statuses | Draft → Pending → Posted, plus Voided | `apps/erp/app/modules/inventory/inventory.models.ts` (`receiptStatusType`) |
| Return entity | On a sales-return receipt line, picks which shipped serial/batch entities actually arrived; re-tags the existing entity, and posting reactivates it On Hold; blind lines fall back to normal tracking entry | `apps/erp/app/modules/inventory/ui/Receipts/ReturnEntityForm.tsx`, route `apps/erp/app/routes/x+/receipt+/lines.return-entities.tsx` |

### AureusERP — ReceiptResource shares one operation form with deliveries/internals

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Receipts list | Filament table over operations whose type is INCOMING; favorite, name, locations, partner, user, scheduled/deadline/closed dates, origin, operation type, company, state; activity action, view/edit/delete actions; bulk delete | `plugins/webkul/inventories/src/Filament/Clusters/Operations/Resources/ReceiptResource/Tables/ReceiptsTable.php`, `OperationResource/Tables/OperationsTable.php` |
| Receipt form | General section switches partner label by operation type ("Receive From" for incoming), operation type presets source/destination locations; locations required depending on type; Tabs: **Operations** (moves repeater), **Additional** (responsible, shipping policy, scheduled at, source document), **Note** (rich editor) | `.../Clusters/Operations/Resources/OperationResource/Schemas/OperationForm.php` (lines 86–260) |
| Move rows | Product, final/destination location, description, packaging, demand qty, done qty, UoM, picked toggle; per-move lot/serial generation dialog (first lot, qty per lot, qty received, keep current lines) and serials textarea; detailed lines repeater with quantity/lot/destination/package/qty | `.../Clusters/Operations/Resources/OperationResource/Schemas/OperationForm.php` (`getMovesRepeater`, lines 263–830) |
| Receipt actions | Action classes: Check Availability, Todo, Validate, Cancel, Return, Next Transfer, Print (delivery slip, labels, package, picking operation, return slip) | `.../Clusters/Operations/Actions/{CheckAvailabilityAction,TodoAction,ValidateAction,CancelAction,ReturnAction,NextTransferAction}.php`, `Actions/Print/` |
| Move history page | "Moves" relation page per operation: product, date, reference, lot, package, source/destination, quantity, UoM, state, done-by; delete per row | `.../Clusters/Operations/Resources/OperationResource/Pages/ManageMoves.php` |

### Dolibarr — Reception is a separate document created from a supplier order

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Reception list | Searchable list of receptions with status, supplier, project, dates and totals | `htdocs/reception/list.php`, `htdocs/reception/index.php` |
| New reception | Created from a supplier order (or standalone): supplier, warehouse, project, reception date, planned delivery date, weight/dimensions, reception method, tracking number, incoterm, document model, public/private notes | `htdocs/reception/card.php` (creation block) |
| Reception card | Object tabs: Card, Reception Distribution (while draft/validated and stock not yet calculated), Contacts/Addresses, Documents, Notes; validate/cancel actions; status draft → validated → closed | `htdocs/reception/card.php`, `htdocs/core/lib/reception.lib.php` (`reception_prepare_head`) |
| Distribution tab | Per-line dispatch: product, description/comment, qty ordered, qty already received, qty to receive, buying price, warehouse + stock, batch number, sell-by/eat-by dates; **Fill** / **Reset** helpers | `htdocs/reception/dispatch.php`, `htdocs/reception/card.php` lines ~1750+ |
| Validation | Confirmation dialog warns whether stock movements will be recorded now or later (depends on `STOCK_CALCULATE_ON_RECEPTION` / `..._CLOSE`); validates reception and optionally closes it | `htdocs/reception/card.php` lines ~2080–2110 |
| Reception numbering/PDF | Configurable numbering module and PDF model, free text, draft watermark | `htdocs/admin/reception_setup.php` |

**BOSS implications.** The references point to one receiving task screen used for purchase receipts, transfer receipts and customer returns, with the source document as context. Odoo's structure fits Moqui most closely: a single Shipment record with `shipmentTypeEnumId`, an editable item list carrying demand vs. received vs. rejected, a status bar, and a validation step that offers backorder creation. Carbon adds the two things Odoo/ERPNext do better elsewhere: a source-document picker at creation and a hard posting gate that refuses to post until every tracked line has serial/batch quantities. Mantle already has the pieces (`Shipment`, `ShipmentItem`, `ShipmentItemSource`, `ShipmentServices.receive#ShipmentProduct`, `receive#EntireShipment`); `receive#ShipmentProduct` already takes `quantityAccepted`, `quantityRejected`, `rejectionReasonEnumId` (`RejectionReason`: Damaged, Lost in Transit, Not Ordered, Over Shipped, Not to Specification), `lotNumber` and `expirationDate`, and writes them to `AssetReceipt`. One option this suggests is `ShipmentItemSource` as the receipt line, with accepted/rejected derived from `AssetReceipt` rather than new columns on `ShipmentItem`. Inspection is a reused function that Warehouse includes for receiving (crosscut §4); ERPNext's line link and Carbon's receipt rail both reach it inline from the receipt line.

---

## 3. Put-away, internal transfers & warehouse transfers

### Odoo — multi-step routes, putaway rules and destination packages

Put-away in Odoo is not a button on the receipt; it is a receiving route plus a putaway rule. The receipt itself may be one, two or three steps (input → quality → stock), each step a separate operation type and transfer, and the final destination is chosen by a putaway rule when the product is stored.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Warehouse configuration | Warehouse name/code/address; **Warehouse Configuration** tab: `reception_steps` (one/two/three steps), `delivery_steps` (ship only / pick+ship / pick+pack+ship), resupply warehouses; Technical tab exposes the generated view/stock/input/QC/pack/output locations and the operation types created for each step | `odoo/addons/stock/views/stock_warehouse_views.xml` (`view_warehouse`) |
| Operation type configuration | Code, sequence, warehouse, reservation method (at confirmation / before scheduled / manually), create-backorder default, lot creation policy (create new / use existing), package type, default source/destination locations, allocation location, batch creation (manual/automatic; max transfers/lines; group by contact/product/category/destination/source/date), print-on-validation choices | `odoo/addons/stock/views/stock_picking_type_views.xml` (`view_picking_type_form`) |
| Routes and rules | Routes list/form; rules list/form with action (pull/push/pull+push), source/destination location, picking type, procurement method, delay, propagate-cancel, domain; this is what turns sales/purchase demand into pick/pack/ship and receive/QC/store chains | `odoo/addons/stock/views/stock_location_views.xml` (routes), `odoo/addons/stock/views/stock_rule_views.xml` (`action_rules_form`) |
| Putaway Rules | Editable list: **When product arrives in** location, product (or category, or all), package type, **Store to** location, sublocation mode (`closest_location` / `no`), storage category, company; ordering by drag handle | `odoo/addons/stock/views/product_strategy_views.xml` (`stock_putaway_list`, `action_putaway_tree`) |
| Internal transfer | Same transfer form as a receipt/delivery; source and destination locations both visible; status bar includes `confirmed`; **Put in Pack**, move details, lots/serials; can generate a return | `odoo/addons/stock/views/stock_picking_views.xml` (`view_picking_form`) |
| Batch transfer (wave) | List/kanban/calendar of batches; form has Confirm / Reserve / Validate / Print / Print Labels / Cancel, assignee, operation type, scheduled date, description, Operations and Transfers tabs, **Put in Pack** | `odoo/addons/stock/views/stock_picking_batch_views.xml` (`stock_picking_batch_form`, `stock_picking_batch_kanban`) |
| Add transfers to batch | Wizard to select pickings and create a batch | `odoo/addons/stock/wizard/stock_picking_to_batch_views.xml` |
| Add to wave | Wizard to add pickings to an existing wave | `odoo/addons/stock/wizard/stock_add_to_wave_views.xml` |
| Relocate stock | Wizard launched from the quant list to move selected quants from one location to another | `odoo/addons/stock/wizard/stock_quant_relocate.xml`, `odoo/addons/stock/views/stock_quant_views.xml` (`action_stock_quant_relocate`) |

### ERPNext — Warehouse tree, Putaway Rule, and Material Transfer

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Warehouse | Tree/list/form with `is_group`, parent warehouse, company, account, address/contact HTML, warehouse type, default in-transit warehouse, rejected-warehouse flag, customer; button actions for Stock Balance and General Ledger | `erpnext/stock/doctype/warehouse/warehouse.json`, `warehouse.js` |
| Putaway Rule | Item (or blank for all), warehouse, capacity, priority, UoM/stock capacity, company, disabled; applies on Purchase Receipt / Stock Entry receipt | `erpnext/stock/doctype/putaway_rule/putaway_rule.json`, `putaway_rule.js` |
| Stock Entry | Purpose **Material Transfer** moves stock between warehouses/locations; lines carry source (`s_warehouse`) and target (`t_warehouse`), qty, serial/batch bundle, quality inspection, putaway rule, project, valuation rate; other purposes cover Material Receipt/Issue, Manufacture, Repack, Subcontracting, Disassemble | `erpnext/stock/doctype/stock_entry/stock_entry.json`, `erpnext/stock/doctype/stock_entry_detail/stock_entry_detail.json`, `stock_entry.js` |
| Pick List (Material Transfer) | Pick List purpose can be **Material Transfer**, **Material Transfer for Manufacture** or **Delivery**; material-transfer pick lists feed a Stock Entry rather than a Delivery Note | `erpnext/stock/doctype/pick_list/pick_list.json`, `pick_list.js` |
| Stock Reservation Entry | Submittable reservation against a voucher (Sales Order, etc.) with item, warehouse, reserved/delivered/consumed/transferred quantities, serial/batch entries, status | `erpnext/stock/doctype/stock_reservation_entry/stock_reservation_entry.json` |
| Warehouse Capacity Summary | Page with company/warehouse/item/parent-warehouse filters and a table of stock capacity, % occupied, balance qty; drill-down to documents | `erpnext/stock/page/warehouse_capacity_summary/` |

### Carbon — bin-to-bin Stock Transfers vs. location-to-location Warehouse Transfers

Carbon separates two transfer types that other ERPs conflate: a **Stock Transfer** moves quantities between storage units (bins) inside one location; a **Warehouse Transfer** moves stock between physical locations and has an explicit ship/receive lifecycle.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Stock Transfers list | Columns: transfer ID, location, status, source (Kanban vs Manual), assignee, completed at, created/updated by/at; delete action; **Add Stock Transfer** | `apps/erp/app/modules/inventory/ui/StockTransfers/StockTransfersTable.tsx`, routes `apps/erp/app/routes/x+/stock-transfer+/` |
| Stock Transfer wizard | Pick a source storage unit, search items/bins, see On Storage Unit / Required / Available / Incoming columns, set move quantities, create lines; release/complete actions | `apps/erp/app/modules/inventory/ui/StockTransfers/StockTransferWizard.tsx`, `StockTransferHeader.tsx` |
| Stock Transfer detail | Header with Kanban/manual source badge, **Release**, **Print**, **Complete**, reopen/delete; lines with pick/unpick, scan tracked entities, add line; scan route uses `TrackedEntityPicker` and clamps available quantity | `apps/erp/app/modules/inventory/ui/StockTransfers/StockTransferHeader.tsx`, `StockTransferLines.tsx`, `routes/x+/stock-transfer+/$id.scan.$lineId.tsx` |
| Stock transfer statuses | Draft → Released → In Progress → Completed; locked after Draft | `apps/erp/app/modules/inventory/inventory.models.ts` (`stockTransferStatusType`, `isStockTransferLocked`) |
| Warehouse Transfers list | Columns: transfer ID, status, from/to location, reference, transfer date, expected receipt date, created/updated by/at | `apps/erp/app/modules/inventory/ui/WarehouseTransfers/WarehouseTransfersTable.tsx`, routes `apps/erp/app/routes/x+/warehouse-transfer+/` |
| Warehouse Transfer detail | Header actions **Confirm**, **Ship**, **Receive**, cancel/reopen/delete; line editor; document rail | `apps/erp/app/modules/inventory/ui/WarehouseTransfers/WarehouseTransferHeader.tsx`, `WarehouseTransferLines.tsx`, `WarehouseTransferForm.tsx` |
| Warehouse transfer statuses | Draft → To Ship and Receive / To Ship / To Receive → Completed / Cancelled | `apps/erp/app/modules/inventory/inventory.models.ts` (`warehouseTransferStatusType`) |
| Internal movement history | Stock Movements table with correction modal; item ledger entries tagged by document type (receipt, shipment, transfer, adjustment, job issue, etc.) | `apps/erp/app/modules/inventory/ui/StockMovements/StockMovementsTable.tsx`, `StockMovements/StockMovementCorrectionModal.tsx`, `Inventory/ledgerFeed.ts` |

### AureusERP — Internal transfers are operation resources; putaway rules are configuration

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Internal transfers | `InternalResource` list/form, same operation form as receipts/deliveries; move list with source/destination; actions Check Availability/Todo/Validate/Cancel/Return/Next Transfer/Print | `plugins/webkul/inventories/src/Filament/Clusters/Operations/Resources/InternalResource/`, `OperationResource/` |
| Putaway Rules | Relationship page per product/category/location and a standalone configuration resource: company, in-location, out-location, product/category, storage category, sub-location | `.../Clusters/Configurations/Resources/PutawayRuleResource/`, `.../Clusters/Configurations/Resources/ProductCategoryResource/Pages/ManageProducts.php` |
| Routes and Rules | Route resource with Rules relation manager; rule form with action, source/destination, picking type, delay, procurement method | `.../Clusters/Configurations/Resources/RouteResource/`, `RuleResource/` |
| Operation types | Configuration resource defining incoming/outgoing/internal/dropship types, source/destination locations, sequence, warehouse | `.../Clusters/Configurations/Resources/OperationTypeResource/` |
| Move history | Per-operation and global move tables with product, date, reference, lot, package, source/destination, quantity, UoM, state, done-by | `.../Clusters/Operations/Resources/OperationResource/Pages/ManageMoves.php`, `.../Clusters/Reporting/Resources/MoveResource/` |

### Dolibarr — stock transfer document and mass-movement screen

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Stock transfer list/card | Own document with agenda/contact/document/note tabs; draft → validated; actions **Destock all products**, **Cancel destock**, **Add stock all products**, **Cancel add stock**, validate (with inventory code) | `htdocs/product/stock/stocktransfer/stocktransfer_list.php`, `stocktransfer_card.php` |
| Mass stock movement | Select source warehouse, target warehouse, product, batch and quantity line by line, or import a CSV; label/inventory code; **Record movements** creates one movement per line | `htdocs/product/stock/massstockmove.php` |
| Warehouse list/card | Warehouse CRUD with status, address, product stock; stock movements per warehouse | `htdocs/product/stock/list.php`, `htdocs/product/stock/card.php` |

### metasfresh — handling-unit moves are the transfer primitive

| Screen/page | What it is | Key files |
| --- | --- | --- |
| HU Manager / mobile move | Mobile REST endpoints for moving a handling unit, bulk-moving HUs, loading/unloading, and resolving a locator by scanned code; the mobile UI is a profile-driven app, not a desktop form | `backend/de.metas.handlingunits.mobileui/src/main/java/de/metas/handlingunits/` (`mobileui/HUManagerRestController.java`, `rest_api/{HandlingUnitsRestController,JsonMoveHURequest,JsonBulkMoveHURequest}.java`); locator resolution `backend/de.metas.inventory.mobileui/src/main/java/de/metas/inventory/mobileui/rest_api/json/JsonResolveLocatorRequest.java` |
| Picking / inventory mobile apps | Mobile applications (`PickingMobileApplication`, `InventoryMobileApplication`) expose workflow steps for picking and counting; desktop lists remain backend-defined windows | `backend/de.metas.picking.rest-api/src/main/java/de/metas/picking/workflow/handlers/PickingMobileApplication.java`, `backend/de.metas.inventory.mobileui/src/main/java/de/metas/inventory/mobileui/InventoryMobileApplication.java` |
| Generic window renderer | All desktop transfer windows (internal movements, HU movements) use the same list/master-window shell | `frontend/src/containers/DocumentListContainer.js`, `MasterWindowContainer.js` |

**BOSS implications.** None of the references needs a separate "put-away" document: put-away is a receiving step that produces moves from the receiving location to the final location, with a configurable putaway rule (product/category → facility location) applied at receipt. Mantle's `FacilityLocation` is a flat list per facility keyed by `locationSeqId`, with area/aisle/section/level/position fields, `capacity` + `capacityUomId` and a type (`FltReceiving`, `FltStaging`, `FltPick`, `FltBulk`, `FltQuarantine`, `FltMorgue`); hierarchy exists only between facilities (`Facility.parentFacilityId`). `ProductFacilityLocation` already gives a product its default locations with `minimumStock` and `moveQuantity`, which is a per-product putaway/pick-face rule; a category or storage-type rule like Odoo's or ERPNext's is new. Putaway could be a service that resolves the destination and passes it to `receive#ShipmentProduct` or `AssetServices.move#Asset`, with no new UI. For internal movement, Carbon's two screens are one option: a quick bin-to-bin transfer (quantity only, scan optional) and a facility-to-facility warehouse transfer with ship/receive states. The latter maps to a `Shipment` of type `ShpTpTransfer` with a `ShipmentRouteSegment` (origin and destination facility), so the same tracking and document rail apply; SimpleScreens already creates one from **New Transfer Shipment** on Find Shipment. In Odoo and Carbon, internal transfers are a first-class queue on the operation-type board, and multi-step receiving/delivery shows as separate step queues rather than being hidden inside one document.

---

## 4. Inspection & quality

### ERPNext — Quality Inspection is a first-class, reference-linked document

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Quality Inspection | Submittable document: report date, inspection type, reference type/name (Purchase Receipt, Delivery Note, Stock Entry, Job Card, etc.), item/serial/batch, sample size, inspected by / verified by, remarks, template, readings child table, status **Accepted / Rejected / Cancelled** | `erpnext/stock/doctype/quality_inspection/quality_inspection.json`, `quality_inspection.js` |
| Readings grid | Each reading row: specification/parameter, numeric spec (min/max or acceptance formula), up to 10 reading values, status/reading value; parameter groups; manual inspection flag | `erpnext/stock/doctype/quality_inspection_reading/quality_inspection_reading.json` |
| Templates and parameters | Quality Inspection Template, Quality Inspection Parameter, Parameter Group; reused across items and inspection types | `erpnext/stock/doctype/quality_inspection_template/`, `quality_inspection_parameter/`, `quality_inspection_parameter_group/` |
| Receipt/delivery integration | Purchase Receipt line has a `quality_inspection` link and separate **rejected qty** + rejected warehouse; Delivery Note and Stock Entry lines also carry inspection links | `erpnext/stock/doctype/purchase_receipt_item/purchase_receipt_item.json`, `erpnext/stock/doctype/delivery_note_item/delivery_note_item.json`, `erpnext/stock/doctype/stock_entry_detail/stock_entry_detail.json` |
| Stock Entry gate | `inspection_required` flag on Stock Entry; Stock Settings control what happens when an inspection is not submitted or is rejected (`action_if_quality_inspection_is_not_submitted`, `action_if_quality_inspection_is_rejected`) | `erpnext/stock/doctype/stock_entry/stock_entry.json`, `erpnext/stock/doctype/stock_settings/stock_settings.json` |
| Inspection types | `inspection_type` Incoming / Outgoing / In Process; `reference_type` Purchase Receipt, Purchase Invoice, Subcontracting Receipt, Delivery Note, Sales Invoice, Stock Entry, Job Card | `erpnext/stock/doctype/quality_inspection/quality_inspection.json` |
| Inspection workflow | Create from a receipt/stock entry line; submit accepted or rejected; rejected quantities land in the rejected warehouse; a Quality Inspection can be cancelled | `erpnext/stock/doctype/quality_inspection/quality_inspection.py`, `erpnext/stock/doctype/purchase_receipt/purchase_receipt.js` (Quality Inspection action) |
| Quality management module | Separate module: **Non Conformance** (subject, procedure, process owner, status Open / Resolved / Cancelled, corrective action, preventive action), Quality Action, Quality Procedure, Quality Goal, Quality Review, Quality Meeting, Quality Feedback; a Non Conformance has no link to a Quality Inspection | `erpnext/quality_management/doctype/{non_conformance,quality_action,quality_procedure,quality_goal,quality_review}/`, `erpnext/quality_management/workspace/quality/` |

### Carbon — inspection plans, measurement grid, sample scanning and lot disposition

Carbon treats inspection as a quality module with full sampling and measurement, linked back to receipts and lots.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Inspections list | Table of inspection lots: inspection, item, item name, lot size, sample, source, received by/at, status; lots are raised when a receipt posts (the receipt documents rail lists "inspections posting raised") | `apps/erp/app/modules/quality/ui/Inspections/InspectionsTable.tsx`, routes `apps/erp/app/routes/x+/quality+/` |
| Inspection form | Item, serial/batch, receipt reference, notice ("You received this item"), disposition selector, notes, submit; used for a quick inspection | `apps/erp/app/modules/quality/ui/Inspections/InspectionForm.tsx` |
| Inspection view | Header actions **Add Sample**, **Reject Lot**, **Accept Lot**, **Create Issue**, **Change Document**; resizable drawing pane + characteristics grid; inspection plan selector | `apps/erp/app/modules/quality/ui/Inspections/InspectionView.tsx` |
| Measurement grid | One column per scanned sample (serial lots) or anonymous samples; rows are characteristics with spec, gauge, n/Ac (sample/accept), result and per-cell pass/fail toggles; inline editable with keyboard navigation | `apps/erp/app/modules/quality/ui/Inspections/InspectionMeasurementGrid.tsx` |
| Sample scanning | Scan or select a serial/batch sample; associates samples with the inspection | `apps/erp/app/modules/quality/ui/Inspections/ScanInspectionSample.tsx` |
| Gauge picker & drawing | Measurement entry by gauge, plus drawing pane with feature callouts | `apps/erp/app/modules/quality/ui/Inspections/InspectionGaugePicker.tsx`, `InspectionDrawingPane.tsx` |
| Reject lot | Modal to reject an inspection lot and choose disposition/reason | `apps/erp/app/modules/quality/ui/Inspections/RejectLotModal.tsx` |
| Inspection plans / documents | Reusable inspection documents with characteristics and sampling rules | `apps/erp/app/modules/quality/ui/InspectionDocument/InspectionDocumentForm.tsx`, `InspectionDocumentEditor.tsx`, `SamplingRuleModal.tsx` |
| Receipt integration | Receipt documents panel lists every inspection raised by the receipt, with item and inspection status, linking to the inspection | `apps/erp/app/modules/inventory/ui/Receipts/ReceiptDocuments.tsx` |
| Quality issues | Issue records with severity, workflow, reviewers, associated items, required actions, supplier-return creation; useful when inspection fails | `apps/erp/app/modules/quality/ui/Issue/`, `ui/IssueWorkflows/`, `ui/RequiredActions/` |
| Gauges / calibration | Gauge master, gauge types, calibration records with status | `apps/erp/app/modules/quality/ui/Gauge/`, `ui/GaugeTypes/`, `ui/Calibrations/` |
| Quality navigation | Groups **Inspection** (Inspections, Inspection Plans) · **Issues** (Actions, Issues, Risks) · **Calibrations** (Gauges, Records) · **Document Control** (Quality Documents) · **Configure** (Action Types, Gauge Types, Issue Types, Issue Workflows) | `apps/erp/app/modules/quality/ui/useQualitySubmodules.tsx` |
| Carbon MES in-process inspection | Shop-floor inspection on a job operation: samples, measurement matrix, gauge, then a disposition modal (accept, reject lot, partial disposition allocating failed units to rework or scrap, optional NCR for MRB disposition); this is a Manufacturing inspection gate, not receiving | `apps/mes/app/routes/x+/inspection-lot.$id.{sample,measurement,gauge,disposition,complete-passed}.tsx`, `apps/mes/app/components/Inspection/{InspectionView,InspectionMeasurementMatrix,DispositionModal}.tsx` |

### Odoo — quality control is a setting, but the addon is absent from this community checkout

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Quality Control setting | Inventory settings expose `module_quality_control` ("Add quality checks to your transfer operations") and `module_quality_control_worksheet`, both marked as upgrade modules | `odoo/addons/stock/views/res_config_settings_views.xml` (setting `quality_control`) |
| **Absent** inspection screens | No `quality_control` / `quality` addon directory exists in this checkout; `stock` itself has no inspection model or form. The only quality-related location is the generated `wh_qc_stock_loc_id` (quality-control stock location) on the warehouse | verified by `ls odoo/addons \| grep quality` (none); warehouse technical tab in `odoo/addons/stock/views/stock_warehouse_views.xml` |
| Scrap | Closest in-stock disposition screen: scrap move form with product, quantity, source location, scrap reason tags, replenish flag, confirm | `odoo/addons/stock/views/stock_move_views.xml` (`view_scrap_move_form`, `view_scrap_move_list`, `menu_stock_scrap`) |

### Dolibarr / AureusERP / metasfresh — no inspection UI

| Reference | Finding | Evidence |
| --- | --- | --- |
| Dolibarr | No quality/inspection module or screen in the checkout; reception lines carry batch and sell-by/eat-by dates only. Disposition happens through stock movements/transfers. | `find htdocs -iname '*quality*' -o -iname '*inspection*'` returns nothing; `htdocs/reception/dispatch.php` line columns |
| AureusERP | The inventories plugin has quality-control stock locations/flags but no Quality Inspection resource, template or readings screen | `plugins/webkul/inventories/src/Filament/` has no Quality/Inspection class; `plugins/webkul/inventories/src/Models/Warehouse.php` and seeders only reference QC locations |
| metasfresh | No inspection window in the checkout; quality handling is through HU attributes/status and backend windows, not a dedicated UI | `backend/de.metas.handlingunits.*` and `frontend/src/` have no inspection component |

**BOSS implications.** Inspection is the one Warehouse area where the reference set is uneven: ERPNext has the clean document model, Carbon has the best operator UI. Together they suggest a small inspection record linked to `ShipmentItemSource` (receipt) and lot/serial, with a template of characteristics, sample size, readings, accepted/rejected quantity, disposition and an inspector/verifier. Both keep it apart from the receipt document itself, which is what lets a failed inspection reject part of a line, put that quantity in a quarantine location, and still let the accepted quantity post. Both also reach inspection from the receipt (ERPNext's line link, Carbon's documents rail listing open inspections). Per crosscut §4 inspection is a reused screen: Warehouse includes it for receiving and returns inspection, Manufacturing for in-process and final inspection gates on the same record (Carbon MES shows that use), and Purchasing for a supplier quality score. Mantle has no inspection entity today, so this is new data, but it could reuse `WorkEffort` for the inspection task, `AssetReceipt.quantityRejected` + `rejectionReasonEnumId` (`ArjNotToSpec`) for the receipt outcome, and a `FltQuarantine` location whose `FacilityLocationType.autoStatusId` sets the asset status on move (Mantle supports `AstQuarantine`) rather than a parallel workflow engine. Non-conformance and corrective action (ERPNext `Non Conformance`, Carbon issues) build on the inspection record; whether they call for a further quality function is an open question (§17).

---

## 5. Stock by location & availability

### Odoo — quants are the stock-by-location screen

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Stock by Location | Read-mostly quant list: product, location, lot/serial, package, owner, on-hand, available, reserved, UoM; filters **Internal Locations**, **Transit Locations**, **To Count**, **To Apply**, **Conflicts**, **Negative Stock**, date; group-by product/category/location/storage category/owner/lot/package/company; graph and pivot views | `odoo/addons/stock/views/stock_quant_views.xml` (`action_view_quants`, `quant_search_view`, `view_stock_quant_tree_simple`, `view_stock_quant_pivot`, `stock_quant_view_graph`) |
| Quant detail | Read-only form: product, location, lot/serial (required when tracked), package, owner, on-hand, available, reserved | `odoo/addons/stock/views/stock_quant_views.xml` (`view_stock_quant_form_editable`) |
| Physical inventory list | Editable quant list used for counting: location, storage category, product, package, lot/serial, owner, counted quantity (auto-apply), reserved, available, UoM, properties; **Relocate**, **History**, **Replenishment** row actions | `odoo/addons/stock/views/stock_quant_views.xml` (`view_stock_quant_tree_editable`) |
| Product stock | Product-level "Stock" action opening quants/pickings for that product | `odoo/addons/stock/views/product_views.xml` (`menu_product_stock`, `action_product_stock_view`) |
| Forecasted report | Client action rendering the forecasted on-hand timeline (incoming/outgoing) for a product/location | `odoo/addons/stock/views/stock_forecasted.xml` (`stock_forecasted_product_product_action`, `stock_forecasted_product_template_action`), `static/src/stock_forecasted/` |
| Availability on transfers | Per-move forecast widget and `products_availability` indicator on the picking header, showing available / expected / late | `odoo/addons/stock/views/stock_picking_views.xml` (`products_availability`, `forecast_widget`), `stock_move_views.xml` |

### Odoo industry — 3PL Logistic Company: owner stock, storage fees and a customer stock portal

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Package scope | Industry package over `stock`, `delivery`, `product_expiry`, `sale_subscription` and Enterprise `quality_control`/`quality_mrp` (so the quality parts do not run on this community checkout); demo warehouse with an area/rack/shelf location tree (A01/R01/S01) and pallet storage categories | `industry/3pl_logistic_company/__manifest__.py`, `industry/3pl_logistic_company/data/{stock_location,stock_storage_category,stock_warehouse}.xml` |
| Fee Rate | Custom model and menu under the Inventory configuration menu; each stock location carries a fee rate (`x_location_fee_rate_id` on `stock.location`), used for invoicing customers who store goods | `industry/3pl_logistic_company/data/{ir_model,ir_model_fields,ir_ui_menu,x_fee_rate}.xml` |
| Stock History | Custom model with list/pivot (default filter current month): date, owner, location, fee rate, product, package, package type, lot/serial, quantity, operation type, invoice period — a dated snapshot of owner stock that feeds storage billing | `industry/3pl_logistic_company/data/{ir_model_fields,ir_actions_act_window,ir_ui_view}.xml` |
| Stock Occupation | Pivot/list over subscription order lines in progress (default filter current occupation): what each customer is renting | `industry/3pl_logistic_company/data/ir_actions_act_window.xml` |
| Customer portal "Your Products" | Portal page listing internal-location quants whose owner is the logged-in customer's company | `industry/3pl_logistic_company/data/portal_templates.xml` |
| Automations | On owner set on product, on move line created, on stock move create; invoice next-action server action | `industry/3pl_logistic_company/data/{base_automation,ir_actions_server}.xml` |

### ERPNext — Stock Balance, Stock Ledger, Quick Stock Balance and Bin

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Stock Balance | Script report over Stock Ledger Entry; filters company, warehouse, item, item group, date; columns opening qty/value, in/out qty/value, closing qty/value, valuation rate | `erpnext/stock/report/stock_balance/` |
| Stock Ledger | Script report listing every Stock Ledger Entry with item, warehouse, posting date, qty, valuation, voucher type/number | `erpnext/stock/report/stock_ledger/` |
| Quick Stock Balance | Page/dialog: warehouse + date + item (or barcode), shows item name/description/image, quantity and value; used by counter staff | `erpnext/stock/doctype/quick_stock_balance/quick_stock_balance.json`, `quick_stock_balance.js` |
| Stock Projected Qty | Report adding ordered, requested, planned, reserved and projected quantities to actual stock | `erpnext/stock/report/stock_projected_qty/` |
| Stock Analytics / Ageing | Pivot-style analytics and ageing reports over stock ledger/valuation | `erpnext/stock/report/stock_analytics/`, `stock_ageing/`, `warehouse_wise_stock_balance/`, `warehouse_wise_item_balance_age_and_value/` |
| Bin | The stored balance record behind most stock screens: warehouse, item, actual qty, reserved qty, ordered/indented/planned qty, projected qty, production/subcontract reservations, valuation rate/value, stock UoM, company | `erpnext/stock/doctype/bin/bin.json` |
| Item dashboard | Item form's stock/availability section and dashboard links into Stock Balance/Projected Qty | `erpnext/stock/doctype/item/`, `erpnext/stock/dashboard/` |

### Carbon — quantities table, item detail cards, activity feed

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Quantities | Main stock list; tabs Quantities / Batch Quantities / Serial Quantities; on-hand, days remaining, usage, incoming/outgoing/on-order columns; filters by storage type/unit, material attributes, tags, active; **Recalculate** action | `apps/erp/app/modules/inventory/ui/Inventory/InventoryTable.tsx`, routes `apps/erp/app/routes/x+/inventory+/quantities.tsx` |
| Item inventory detail | Cards: Quantity on Hand, Days Remaining, Daily Usage, Quantity on Purchase Order (incoming), Quantity on Sales Order (outgoing), Quantity on Jobs (supply/demand); variant `quantity` used in pickers | `apps/erp/app/modules/inventory/ui/Inventory/InventoryDetails.tsx` |
| Inventory activity | Ledger feed per item, rendering human sentences ("received N units to <storage unit>", "shipped …", "transferred …", "adjusted …") with links to the source document; collapsed ledger rows | `apps/erp/app/modules/inventory/ui/Inventory/InventoryActivity.tsx`, `ledgerFeed.ts` |
| Stock Movements | Global movement table with correction action (manual adjustment), filters, export | `apps/erp/app/modules/inventory/ui/StockMovements/StockMovementsTable.tsx`, `StockMovements/StockMovementCorrectionModal.tsx`, route `apps/erp/app/routes/x+/inventory+/stock-movements.tsx` |
| Item quantities by storage | Per-item storage-unit breakdown with on-hand/reserved/available and drill-down | `apps/erp/app/modules/inventory/ui/Inventory/InventoryStorageUnits.tsx`, routes `apps/erp/app/routes/x+/inventory+/quantities+/$itemId.details.tsx`, `$itemId.activity.tsx`, `$itemId.adjustment.tsx` |
| Valuation workbench | Rows by item/location: costing method, qty on hand, on hold, rejected, UoM, unit cost, total value, % of total; as-of date; group by location/item; GL tie-out subledger vs GL vs variance with **Reconcile** action | `apps/erp/app/modules/inventory/ui/Valuation/InventoryValuationWorkbench.tsx` |

### AureusERP — one quantities table with inline on-hand editing

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Quantities (Reporting) | Table: product, location, storage category, package, lot, on-hand (inline editable), reserved qty, UoM; filters warehouse/location/product category/storage category/package/package type/lot; group by product/category/location/storage category/lot/package/company; create/delete actions | `plugins/webkul/inventories/src/Filament/Clusters/Reporting/Resources/QuantityResource/Tables/QuantitiesTable.php` |
| Quantities (Operations) | Same data exposed as an operations resource for day-to-day quantity management | `.../Clusters/Operations/Resources/QuantityResource/` |
| Moves | Reporting move table: product, date, reference, lot, package, source/destination, quantity, UoM, state, done-by | `.../Clusters/Reporting/Resources/MoveResource/Tables/MovesTable.php` |
| Product quantities tab | Per-product quantities relation page | `.../Clusters/Products/Resources/ProductResource/Pages/ManageQuantities.php` |

### Dolibarr — product stock card, movement list, stock at date and warehouse valuation

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Product stock card | Per-product, per-warehouse stock with stock limit/desired stock, correct-stock form, batch handling, movement history | `htdocs/product/stock/product.php` |
| Stock movement list | Full movement ledger: ref, date, product, label, batch, eat-by/sell-by, warehouse, author, inventory code, type, origin, qty, unit purchase value; configurable columns, filters and mass PDF generation | `htdocs/product/stock/movement_list.php` |
| Stock at date | Product/warehouse/date query showing current stock, stock at date, virtual stock at date, estimated value, movements since date; CSV export | `htdocs/product/stock/stockatdate.php` |
| Warehouse valuation | Warehouse card's valuation tab: number of products, estimated stock value, yearly valuation graph placeholder | `htdocs/product/stock/fiche-valo.php`, `htdocs/product/stock/valo.php` |
| Warehouse list | Stock per warehouse with status and product count | `htdocs/product/stock/list.php` |

### metasfresh — stock is a backend window plus mobile count

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Generic stock windows | Desktop stock/availability screens are metadata-defined windows rendered by the generic list/master shell; no dedicated React stock page | `frontend/src/containers/DocumentListContainer.js`, `MasterWindowContainer.js` |
| Mobile inventory count | Mobile app/REST workflow for inventory jobs: start from launcher params, fetch job lines, count HUs, post counts | `backend/de.metas.inventory.mobileui/src/main/java/de/metas/inventory/mobileui/` (`rest_api/InventoryRestController.java`, `job/service/InventoryJobService.java`, `InventoryMobileApplication.java`, `rest_api/json/JsonInventoryJob*.java`) |
| HU inventory view | The inventory mobile app's handling-unit adapter returns product/storage/locator/attribute info for counting | `backend/de.metas.inventory.mobileui/src/main/java/de/metas/inventory/mobileui/deps/handlingunits/{HUProductStorages,HandlingUnitsService}.java` |

**BOSS implications.** **Inventory availability** is a reused screen (crosscut §3: Warehouse, Customer Service, Purchasing, Sales, Manufacturing and Commerce include it), and the baseline already has one availability service family behind it; the references show why a single source matters, with one number reached from every screen that shows stock. Mantle's `mantle.product.AssetServices.get#AvailableInventory` (one product, optional facility or store, owner and asset-pool filters), `get#AvailableForOrder` and `get#AvailableInventoryMulti` (product × facility map) return an available-to-promise total only, not a breakdown. The stock-by-location screen is therefore a grouped find over `Asset` rows through the existing view entities `AssetSummaryView` and `AssetLocationSummary` (facility → location → product → lot/serial, with `quantityOnHandTotal` and `availableToPromiseTotal`), while the ATP number shown in Sales, Customer Service and Purchasing comes from the `get#AvailableInventory*` family; incoming and projected quantities come from `mantle.product.InventoryReportServices.get#InventoryProjectedInfo`. These cover what an `InventoryItem` or bin-balance table would hold. Odoo, AureusERP and ERPNext all show on-hand, reserved, available and incoming as separate columns; collapsing them into one number is the most common warehouse-screen mistake. The evidence favors a location and lot drill-down from a quantity row that opens the movement/ledger history (`AssetDetail` rows; Carbon's activity sentences are the best presentation) over a read-only form with no context. Owner-held stock (Odoo 3PL) is already possible through `Asset.ownerPartyId` and `Facility.assetAllowOtherOwner`; a customer-facing "your stock" view and storage-fee history would be new.

---

## 6. Counts, adjustments & reconciliation

### Odoo — physical inventory is an editable quant list plus three wizards

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Physical Inventory | Editable list of quants (`js_class="inventory_report_list"`); header **Apply All**, **Apply**, **Clear**, **Request a Count**; row **History**; filters To Count / To Apply / Conflicts / Negative Stock; counted quantity and difference columns | `odoo/addons/stock/views/stock_quant_views.xml` (`action_view_inventory_tree`, `view_stock_quant_tree_editable`) |
| Apply quantities | Wizard asks for an adjustment name and counting date, then applies all counted quantities | `odoo/addons/stock/wizard/stock_inventory_adjustment_name.xml`, `stock_inventory_adjustment_name.py` |
| Request a count | Assigns a counter user, inventory date, and whether to show expected quantity; creates counting tasks per quant | `odoo/addons/stock/wizard/stock_request_count.xml` |
| Conflict resolution | When stock moved between counting and applying: keep counted quantity, keep difference, or discard and resolve manually; lists affected quants with quantity/counted/difference | `odoo/addons/stock/wizard/stock_inventory_conflict.xml` |
| Warning / reset | Warnings for unapplied counts and lines that already have quantities set; reset-count confirmation | `odoo/addons/stock/wizard/stock_inventory_warning.xml`, `stock_inventory_warning_reset_view` |
| Cycle counting | Location form's **Cyclic Counting** group: inventory frequency in days, last/next inventory date; the quant search's **To Count** filter surfaces due locations | `odoo/addons/stock/views/stock_location_views.xml` (`view_location_form`) |
| Annual inventory | Inventory settings: annual inventory day/month, used to schedule the next physical inventory | `odoo/addons/stock/views/res_config_settings_views.xml` (setting `annual_inventory_date`) |
| Scrap | Scrap move form (product, qty, source location, reason tags, replenish flag) creates a done scrap move; scrap list and report | `odoo/addons/stock/views/stock_move_views.xml` (`view_scrap_move_form`, `view_scrap_move_list`, `menu_stock_scrap`), `odoo/addons/stock/report/report_stockinventory.xml` (count sheet) |
| Relocate | Wizard moving selected quants to another location, with optional package destination | `odoo/addons/stock/wizard/stock_quant_relocate.xml` |

### ERPNext — Stock Reconciliation, closing entries and repost tools

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Stock Reconciliation | Submittable document: company, purpose (**Opening Stock**, **Stock Reconciliation**, **Adjustment Entry**), posting date/time, items child, expense account/cost center, difference amount, scan barcode/scan mode, set warehouse, last scanned warehouse | `erpnext/stock/doctype/stock_reconciliation/stock_reconciliation.json`, `stock_reconciliation.js` |
| Reconciliation lines | Item, warehouse, new qty, stock UoM, valuation rate, amount, serial/batch bundle, current qty, current serial/batch, current valuation rate/amount, quantity difference, amount difference, allow-zero-valuation | `erpnext/stock/doctype/stock_reconciliation_item/stock_reconciliation_item.json` |
| Fetch items | Action **Fetch Items from Warehouse** populates lines from current stock for the selected warehouse | `erpnext/stock/doctype/stock_reconciliation/stock_reconciliation.js` |
| Count sheet / barcode | Scan barcode mode and `has_item_scanned` flag support handheld-style counting into a reconciliation | `erpnext/stock/doctype/stock_reconciliation/stock_reconciliation.json`, `erpnext/stock/doctype/stock_reconciliation_item/stock_reconciliation_item.json` |
| Stock Closing Entry | Period closing document that freezes balances for a period | `erpnext/stock/doctype/stock_closing_entry/`, `stock_closing_balance/` |
| Repost Item Valuation | Tool to rebuild valuation/GL for stock ledger entries, with status and logs | `erpnext/stock/doctype/repost_item_valuation/` (a doctype with list/form; there is no report of that name) |
| Stock Reposting Settings | Controls repost batch size/limits | `erpnext/stock/doctype/stock_reposting_settings/` |

### Carbon — a proper count document with blind counting and variance review

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Inventory Counts list | Count ID, location, status, posted by/at, created by/at; delete action; **Inventory Count** create button | `apps/erp/app/modules/inventory/ui/InventoryCount/InventoryCountsTable.tsx`, route `apps/erp/app/routes/x+/inventory+/inventory-count.tsx` |
| New count | Location, optional storage unit, optional item type, **Blind Count** toggle, notes | `apps/erp/app/modules/inventory/ui/InventoryCount/InventoryCountForm.tsx` |
| Count detail | Status badge; **Confirm** (Draft → Pending), **Post** (Pending → Posted), **Reopen** (Pending → Draft); notes modal; record hero with location; lines table | `apps/erp/app/modules/inventory/ui/InventoryCount/InventoryCount.tsx`, routes `apps/erp/app/routes/x+/inventory-count+/$id.tsx`, `$id.confirm.tsx`, `$id.post.tsx`, `$id.reopen.tsx` |
| Count lines | Item, readable batch/serial, item type, storage unit/type, material attributes, tags, **System Qty**, **Counted Qty**, **Variance**; filters **In stock only** / **Variance only**; inline counted-quantity editing in Draft | `apps/erp/app/modules/inventory/ui/InventoryCount/InventoryCountLines.tsx` |
| Blind count | System quantity and variance are withheld until the count is Posted; filtering also removes those columns so the counter cannot derive the expected quantity | `apps/erp/app/modules/inventory/ui/InventoryCount/InventoryCount.tsx` lines ~98–120 |
| Confirm dialog | Shows recalculated lines/warnings and asks for confirmation before moving to Pending | `apps/erp/app/modules/inventory/ui/InventoryCount/InventoryCountConfirmModal.tsx` |
| Posting | Post turns variances into inventory adjustments; lines that cannot post are marked/toasted; history shows adjustments the count posted | route `apps/erp/app/routes/x+/inventory-count+/$id.post.tsx`, `apps/erp/app/modules/inventory/ui/InventoryCount/InventoryCount.tsx` |
| Manual adjustment | Stock Movements correction modal posts a positive/negative adjustment; negative adjustment refuses insufficient quantity | `apps/erp/app/modules/inventory/ui/StockMovements/StockMovementCorrectionModal.tsx`, route `apps/mes/app/routes/x+/adjustment.tsx` |

### AureusERP — no count document; quantity edits are the adjustment

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Quantity inline edit | **On Hand** is an inline `TextInputColumn`; changing it writes `quantity` and `inventory_diff_quantity` and emits a success notification; there is no separate count/reconciliation document or variance-review screen | `.../Clusters/Reporting/Resources/QuantityResource/Tables/QuantitiesTable.php` lines ~80–100 |
| Replenishment | Resource exists but is a stub in this checkout (empty form/table configuration) | `.../Clusters/Operations/Resources/ReplenishmentResource/Schemas/ReplenishmentForm.php`, `Tables/ReplenishmentsTable.php` |
| Scrap | Scrap resource form with product, qty, UoM, lot, tags, package, partner, source/destination location, origin, company | `.../Clusters/Operations/Resources/ScrapResource/Schemas/ScrapForm.php` |

### Dolibarr — full inventory document from draft to movement posting

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Inventory list | Inventories with ref/title, warehouse, status, dates, lines; create/clone/delete | `htdocs/product/inventory/list.php`, `card.php` |
| New inventory | Title, warehouse, date, inventory code, status, include-sub-warehouse option | `htdocs/product/inventory/card.php` (create block) |
| Validate/start | Validate dialog with start mode (current stock / zero / none), include sub-warehouses | `htdocs/product/inventory/card.php` (validate block) |
| Inventory sheet | Editable lines: warehouse, product, batch, expected qty (current stock and stock at validation), real qty, stock movement; **Add** line, **Save**, **Clear Qtys**, **Update by scanning**, pagination; "Make Movements and Close" posts differences and closes | `htdocs/product/inventory/inventory.php` |
| Status flow | Draft → validated (counting) → closed; cancel/reopen actions | `htdocs/product/inventory/card.php`, `inventory.php` |
| Correct stock | Product/warehouse correct-stock form creating a manual movement with label, date, qty, batch/serial | `htdocs/product/stock/product.php` (`correct_stock`) |
| Mass movement | Batch entry/CSV import of paired source/target warehouse movements | `htdocs/product/stock/massstockmove.php` |

### metasfresh — mobile inventory jobs

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Inventory mobile app | Workflow launcher + count job: start inventory count, fetch next eligible line, scan HU/locator, submit counted qty, complete job | `backend/de.metas.inventory.mobileui/src/main/java/de/metas/inventory/mobileui/` (`InventoryMobileApplication.java`, `rest_api/InventoryRestController.java`, `job/service/InventoryJobService.java`, `launchers/InventoryWorkflowLaunchersProvider.java`, `rest_api/json/{JsonCountRequest,JsonCountStatus}.java`) |
| HU lookup | Scan a QR code / HU and return its product/storages/attributes for counting | `backend/de.metas.inventory.mobileui/src/main/java/de/metas/inventory/mobileui/rest_api/json/{JsonResolveHURequest,JsonResolveHUResponse}.java`; HU manager QR lookup `backend/de.metas.handlingunits.mobileui/src/main/java/de/metas/handlingunits/rest_api/JsonGetByQRCodeRequest.java` |

### ridgecrest — external fulfillment-center imports, no pick/pack screens

| Screen/page | What it is | Key files |
| --- | --- | --- |
| ridgecrest admin dashboard | Three boxes: **VDC Imports** (Order and Return Import, Inventory Import, Settlement Summary Import dialog with an async option), **Reports** (Order Reports), **Retailers** (Access Tokens) | `screen/rcadmin/dashboard.xml`, `screen/rcadmin.xml` |
| ridgecrest inventory import | Three-step upload / processing / done wizard for a marketplace fulfillment center's inventory file; each line becomes an absolute stock quantity through `AssetServices.record#PhysicalInventoryQuantity` (or a change through `record#InventoryChange`) | `screen/rcadmin/InventoryFileImporter.xml`, `screen/rcadmin/vdc/inventory/FileImporter.{vuet,js}`, `service/ridgecrest/vdc/VdcServices.xml` (`import#Inventory`, `record#InventoryAbs`, `record#InventoryChange`) |
| ridgecrest order and return import | Same wizard for marketplace orders and returns; creates orders and returns, and leaves shipment creation disabled because inventory issuance comes from the settlement summary | `screen/rcadmin/OrderFileImporter.xml`, `service/ridgecrest/vdc/VdcServices.xml` (`import#Orders`, `import#Returns`; note at the disabled `create#OrderPartShipment` call) |
| **Absent** fulfillment UI | No picking, packing, shipment or location screens anywhere in the component | `screen/` tree (`rcadmin/`, `popdynamic/`, `rcherbals/`) |

**BOSS implications.** Carbon, Dolibarr and Ever Gauzy give counts their own document even though the result is an adjustment. Mantle already has `PhysicalInventory` (`physicalInventoryDate`, facility, party, comments, status `PIInPlanning` → `PIInProgress` → `PIInValidation` → `PIComplete`) and `PhysicalInventoryCount` (facility, `locationSeqId`, product, lot, `countDate`, `quantityOnHand`), plus `AssetServices.record#PhysicalInventoryQuantity` and `record#PhysicalInventoryChange`. Today those services apply the variance to `Asset` immediately (an `AssetDetail` row carrying `physicalInventoryId` and a `varianceReasonEnumId` from `InventoryVarianceReason`: Lost, Stolen, Found, Damaged, Integration, Sample, Mis-shipped ±), and no baseline screen or service creates `PhysicalInventoryCount` rows or moves a count through the status flow, so count-then-post is new screen work over existing records, not new tables. Carbon's flow is the strongest candidate because it is the only reference that separates counting from posting cleanly: Draft (count entry, with a blind-count option) → Pending (review) → Posted (variance becomes auditable asset quantity changes); the four Mantle statuses map onto it, and Ever Gauzy's count plugin (Draft → Open → Counting → Review → Closed, modes Full / Cycle / Spot / Recount; §11) confirms the shape. Odoo's conflict-resolution dialog addresses stock that moves during a count; without one a count silently overwrites receipts/shipments that happened mid-count. Adjustments outside a count carry a reason code and an audit trail in the references; Mantle's variance reasons, Odoo scrap reasons, ERPNext reconciliation purpose and Carbon's ledger feed all point the same way. AureusERP's inline on-hand edit and ridgecrest's external-fulfillment stock import are useful shortcuts only if they write the same audit record as a count, which ridgecrest does by calling `record#PhysicalInventoryQuantity`.

---

## 7. Picking

### Odoo — picking is an outgoing transfer; waves are batch transfers

Odoo has no separate "pick list" model. A delivery operation type can be configured as one, two or three steps (ship / pick+ship / pick+pack+ship), and each step is a transfer. Grouping work is done with **batch transfers** (waves).

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Delivery transfers | `stock.picking` list/form filtered to outgoing operation types; **Reserve**, **Validate**, **Print**, **Return/Exchange**, **Put in Pack**, detailed moves; availability column and late/backorder filters | `odoo/addons/stock/views/stock_picking_views.xml` |
| Batch transfer list/card | One record per wave/batch: name, description, scheduled date, responsible user, operation type, priority, state, transfer count; list, kanban, card and calendar views | `odoo/addons/stock/views/stock_picking_batch_views.xml` |
| Batch transfer form | Confirm / Reserve / Validate / Print / Print Labels / Cancel; button box for Packages, Moves, Allocation; Operations and Transfers tabs; **Put in Pack** | `odoo/addons/stock/views/stock_picking_batch_views.xml` (`stock_picking_batch_form`) |
| Prepare batch | Operation-type card menu action opens batch creation for that type; wizard selects transfers | `odoo/addons/stock/views/stock_picking_type_views.xml` (`action_batch`), `odoo/addons/stock/wizard/stock_picking_to_batch_views.xml` |
| Add to wave | Wizard adding selected transfers to an existing wave | `odoo/addons/stock/wizard/stock_add_to_wave_views.xml` |
| Batch configuration | Operation type: batch creation manual/automatic, max transfers/lines, group by contact/product/category/destination/source/date; auto-confirm | `odoo/addons/stock/views/stock_picking_type_views.xml` (`view_picking_type_form`, Batch Transfers group) |
| Allocation report | Report view opened from a transfer/operation type: product lines with Available / Quantity / Assigned / For / Date and **Assign All**, **Print**, **Print Labels**; mobile template | `odoo/addons/stock/static/src/allocation_report/allocation_report.xml`, `allocation_report.js`, `report/stock_allocation_report.py`, `report_stockpicking_operations.xml` |
| Picking operations sheet | Printable picking list grouped by location with quantities and lots; auto-print option on validation | `odoo/addons/stock/report/picking_templates.xml`, `report_stockpicking_operations.xml`; operation type "Print on Validation" group |

### ERPNext — Pick List is a real document with reserve/unreserve and scan modes

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Pick List list/form | Submittable document; list columns company/customer; form fields company, parent warehouse, customer, work order, locations child, for-qty, purpose (**Material Transfer for Manufacture**, **Material Transfer**, **Delivery**), material request, group-same-items, scan barcode, scan mode, prompt qty, status, consider-rejected-warehouses, pick-manually, delivery status/per-delivered | `erpnext/stock/doctype/pick_list/pick_list.json`, `pick_list.js` |
| Pick-list lines | Item, qty, picked qty, warehouse, stock qty, serial/batch bundle, pick serial/batch, stock reserved qty, delivered/transferred qty, actual qty, company total stock | `erpnext/stock/doctype/pick_list_item/pick_list_item.json` |
| Pick-list actions | **Stock Availability**, **Update Current Stock**, **Get Items**, **Reserve**, **Unreserve**, **Reserved Stock**, and create **Delivery Note**, **Sales Invoice**, **Stock Entry**, **Stock Reservation** depending on purpose/status | `erpnext/stock/doctype/pick_list/pick_list.js` (`add_custom_button` labels) |
| Statuses | Draft → Open → Partly Delivered / Partially Transferred → Completed → Cancelled | `erpnext/stock/doctype/pick_list/pick_list.json` |
| Scan modes | Header barcode input plus `scan_mode`/`prompt_qty`; line `has_item_scanned`; stock availability dialog shows stock held by location/warehouse | `erpnext/stock/doctype/pick_list/pick_list.js`, `pick_list.json` |
| Stock Reservation Entry | Reservation record behind "Reserve" with reserved/delivered/consumed/transferred qty and serial/batch entries | `erpnext/stock/doctype/stock_reservation_entry/stock_reservation_entry.json` |

### Carbon — Picking Lists are first-class, with a mobile picker in MES

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Picking Lists list | Table + schedule/kanban views; filters; create; status filter; assignee; due date; location | `apps/erp/app/modules/inventory/ui/PickingLists/PickingListsTable.tsx`, `PickingListsHeader.tsx`, routes `apps/erp/app/routes/x+/picking-list+/` |
| Picking list detail | Header: picking-list ID, status, created-by/due/at-location meta, assignee, **Start** (Draft → In Progress), **Finish** (In Progress → Completed), reopen/cancel/delete menu; finish with unpicked material asks for acknowledgement | `apps/erp/app/modules/inventory/ui/PickingLists/PickingListHeader.tsx` |
| Picking lines | Progress "N% picked"; per line: item, to-pick quantity, picked quantity, lots/tracked entities, buttons **Pick**, **Short**, **Scan**, **Unpick**, status Short/Pending/Picked/Cancelled; pickers clamp quantity to outstanding | `apps/erp/app/modules/inventory/ui/PickingLists/PickingListLines.tsx`, `ShortPickModal.tsx`, route `apps/erp/app/routes/x+/picking-list+/$pickingListId.line.quantity.tsx` |
| Batch picking board | Kanban of operations that require picking at a location; item cards show parts to pick, complete/reworked/scrapped quantities | `apps/erp/app/modules/inventory/ui/PickingLists/PickingKanban.tsx`, `PickingItemCard.tsx` |
| Statuses | Draft → In Progress → Completed / Partial / Cancelled; line Pending / Picked / Short / Cancelled; locked after Completed/Partial/Cancelled | `apps/erp/app/modules/inventory/inventory.models.ts` (`pickingListStatusType`, `pickingListLineStatusType`, `isPickingListLocked`) |
| MES picking queue | Mobile-first queue of assigned picking lists (location, due date, progress); detail with Start/Finish, line scan/pick/short, **Finish with material unpicked?** acknowledgement | `apps/mes/app/routes/x+/picking._index.tsx`, `x+/picking.$pickingListId.tsx`, `apps/mes/app/components/ShortPickModal.tsx`, `PickingListStatus.tsx` |

### Dolibarr — pick/pack happens inside the shipment document

| Screen/page | What it is | Key files |
| --- | --- | --- |
| New shipment | Created from a customer order (or standalone): third party, project, shipping date, planned delivery date, weight/volume/dimensions, delivery method, tracking number, incoterm, document model, notes | `htdocs/expedition/card.php` (creation block) |
| Shipment card | Tabs: Card, Shipment Distribution (while draft), Contacts/Addresses, Documents, Notes, Events; validate/cancel; status draft → validated → closed | `htdocs/expedition/card.php`, `htdocs/core/lib/sendings.lib.php` (`shipping_prepare_head`) |
| Distribution tab | Per-order-line: description, qty ordered, qty already shipped, qty to ship, warehouse + stock, batch/serial, stock entry date; **Autofill**, **Reset**, line-level warnings for low stock/batch allocation | `htdocs/expedition/dispatch.php`, `card.php` lines ~1900–2550 |
| Add lines/orders | Add order lines or whole orders to an existing shipment; service lines handled separately | `htdocs/expedition/card.php` (add line/order actions) |
| Shipment list | Searchable list with ref, third party, dates, status, totals | `htdocs/expedition/list.php` |

### AureusERP — DeliveryResource shares the operation form

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Deliveries | `DeliveryResource` list/form over outgoing operations; same columns/actions as receipts (check availability, todo, validate, cancel, return, next transfer, print delivery slip/labels/picking operation) | `plugins/webkul/inventories/src/Filament/Clusters/Operations/Resources/DeliveryResource/`, `Actions/` |
| Moves | Operations tab move repeater with demand/done, UoM, picked, lot/serial generation, detailed lines | `.../Clusters/Operations/Resources/OperationResource/Schemas/OperationForm.php` |
| Check availability | Action validates stock/reservations for the operation before picking | `.../Clusters/Operations/Actions/CheckAvailabilityAction.php` |
| Dropship | Separate `DropshipResource` for supplier-direct flows (no warehouse pick) | `.../Clusters/Operations/Resources/DropshipResource/` |

### metasfresh — mobile picking workflow over picking jobs

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Picking mobile app | Workflow launcher starts a picking job; REST endpoints fetch next eligible line, available targets, pick-from HUs/locators, unpick/alternative pick, close line, complete job | `backend/de.metas.picking.rest-api/src/main/java/de/metas/picking/` (`workflow/handlers/PickingMobileApplication.java`, `rest_api/PickingRestController.java`, `workflow/PickingJobRestService.java`, `workflow/lauchers/PickingWorkflowLaunchersProvider.java`, `rest_api/json/JsonPickingJob*.java`, `rest_api/json/JsonPickFrom*.java`) |
| Picking step events | Records each pick/unpick/close event for audit and workflow progress | `backend/de.metas.picking.rest-api/src/main/java/de/metas/picking/rest_api/json/JsonPickingStepEvent.java`, `JsonPickingEventsList.java`, `backend/de.metas.picking.rest-api/src/main/java/de/metas/picking/workflow/handlers/activity_handlers/PickingWFActivityHelper.java` |
| Desktop pick lists | No dedicated React pick-list screen; picking windows are backend-defined and rendered through the generic shell | `frontend/src/containers/DocumentListContainer.js` |

### Moqui Sales — order source only, no picking screen

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Find Order | Order list/search for the Sales app; the order is the source document Warehouse would fulfill, but the screen has no pick/pack/ship action | `screen/Sales/Order/FindOrder.xml`, `FindOrder.qvue`, `screen/Sales/Order.xml` |
| View Order | Order detail with header/items; no fulfillment queue, reservation view or shipment creation in the checkout | `screen/Sales/Order/ViewOrder.xml`, `ViewOrder.qvue` |
| **Absent** warehouse UI | The Moqui Sales component ships accounts, contacts, opportunities, orders, agreements and a task editor only; the order part offers a shipment-method drop-down; no stock/shipment/pick screens | verified by `find 3p_moqui/Sales/screen -type f` (no shipment/inventory directory) |

**BOSS implications.** Picking is a new screen family in BOSS, but not new data. Carbon keeps the order → shipment seam explicit, and the baseline supports the same: a Warehouse picking screen opened with `orderId` (or a shipment created from the order with `ShipmentServices.create#OrderPartShipment`), and the reused **Order detail** screen (crosscut §3: Sales, Purchasing, Customer Service, Warehouse, Accounting, Commerce) showing the fulfillment action set in Warehouse. In the baseline, picking is a task on an outbound `Shipment`, not a second stock document. Carbon's screen is the smallest complete candidate: a picking list with start/finish, a per-line "to pick / picked / short" state, scan-or-select for lots/serials, and an explicit acknowledgement when finishing with unpicked material; Carbon and Ever Gauzy both turn a short pick into a stock correction. Odoo's wave/batch grouping already has a Mantle home: a picklist is a `WorkEffort` with purpose `WepShipmentShip` linked from `Shipment.shipWorkEffortId`, with `binLocationNumber` per shipment (or per `ShipmentItemSource`), assignees through `WorkEffortParty`, equipment through `WorkEffortAssetAssign`, and `mantle.work.ShipmentWorkServices` (`create#ShipmentLoadShip`, `add#ShipmentToShipmentLoad`, `create#ShipmentLoadsForOrders`, `complete#ShipmentLoadShip`); SimpleScreens Picklist screens and the `Picklist.pdf` / `PicklistAndPackSheets.pdf` sheets sit on it (§16). `ShipmentItemSource.quantityPicked` and `quantityNotHandled` carry the line state. ERPNext's reserve/unreserve and reservation record answer the question every picker asks ("is it actually mine?"); Mantle's `AssetReservation` with `AssetServices.reserve#AssetsForOrder` and `move#ReservationsFromNonPickLocations` is that record. Carbon and metasfresh give the mobile view a separate route/layout rather than a shrunken desktop table; Carbon's MES queue is the best reference. On Mantle, `ShipmentServices.pickMove#ShipmentProduct`, `pack#ShipmentProductScan` and `get#ShipmentProductByScan` already implement the core, so what remains is the queue, the line state machine and the scan interaction.

---

## 8. Packing, shipping & carriers

### Odoo — packages, package types, delivery slips and carrier connectors

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Package form | Name, package type, owner, location, parent package, company, pack date; contents quant list (product, package, lot, qty, UoM); **Unpack**; link to the transfer | `odoo/addons/stock/views/stock_package_views.xml` (`stock_package_view_form`) |
| Package list / editable list | Package name, parent/container, type, location, company; editable list can **Put in Pack** / **Remove** and move a package to a destination package/location | `odoo/addons/stock/views/stock_package_views.xml` (`stock_package_view_list`, `stock_package_view_list_editable`, `stock_package_view_kanban`) |
| Package types | Name, barcode, sequence, routes, company; Dimensions tab (length × width × height, base weight, max weight); Capacity tab by storage category | `odoo/addons/stock/views/stock_package_type_view.xml` (`stock_package_type_form`) |
| Put in Pack | Wizard from a transfer: package type, capacity per package + UoM, existing/new destination package; puts selected move lines into packages and can auto-print labels | `odoo/addons/stock/wizard/stock_put_in_pack_views.xml` |
| Delivery slip / package reports | Delivery Slip, Picking Operations, Packages (with contents), package barcode (PDF/ZPL), lot/serial barcode, location barcode | `odoo/addons/stock/report/{report_deliveryslip,report_stockpicking_operations,report_picking_batch,report_package_barcode,report_lot_barcode,report_location_barcode}.xml` |
| Batch transfer print | Batch picking report | `odoo/addons/stock/report/report_picking_batch.xml` |
| Carrier / delivery method | Delivery method form: name, provider type (`delivery_type`), integration level, company, currency, fixed price/margin/free-over, product, tracking URL, invoice policy, shipping insurance, price rules, availability by country/state/zip/weight/volume/tags, customer description; prod/debug toggles; "Install more Providers" | `odoo/addons/delivery/views/delivery_carrier_views.xml` (`view_delivery_carrier_form`) |
| Delivery price rules / zip prefixes | Price-rule list/form and zip-prefix list for rule-based carriers | `odoo/addons/delivery/views/delivery_price_rule_views.xml`, `delivery_zip_prefix_views.xml` |
| Delivery signature | Signature widget on a done outgoing transfer and a signed flag in the transfer list | `odoo/addons/stock/views/stock_picking_views.xml` (`signature` widget, `is_signed`) |
| Batch validation | Batch form `Validate` finalizes all contained transfers, with optional label printing | `odoo/addons/stock/views/stock_picking_batch_views.xml` |

### ERPNext — Packing Slip, Shipment, Delivery Trip, Shipping Rule

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Packing Slip | Submittable document linked to a Delivery Note: from/to case numbers, items child (item, batch, qty, net weight, page break), net/gross weight + UoM, letter head; print format | `erpnext/stock/doctype/packing_slip/packing_slip.json`, `erpnext/stock/doctype/packing_slip_item/packing_slip_item.json` |
| Shipment | Shipment document: pickup from (company/customer/supplier + address/contact), delivery to (same), shipment parcels/pallets, value of goods, pickup date/type, shipment type, service provider, carrier, carrier service, AWB number, shipment ID/amount, tracking URL/status/info, incoterm; statuses Draft → Submitted → Booked → Completed / Cancelled | `erpnext/stock/doctype/shipment/shipment.json`, `erpnext/stock/doctype/shipment_delivery_note/shipment_delivery_note.json`, `erpnext/stock/doctype/shipment_parcel/shipment_parcel.json`, `shipment.js` |
| Shipment parcel templates | Reusable parcel dimensions/weight | `erpnext/stock/doctype/shipment_parcel_template/` |
| Delivery Trip | Vehicle/driver run: driver, vehicle, departure time, delivery stops child (customer, address, delivery note, visited, distance, estimated arrival, lat/lng), optimize route, calculate arrival times, notify customers, create delivery notes | `erpnext/stock/doctype/delivery_trip/delivery_trip.json`, `erpnext/stock/doctype/delivery_stop/delivery_stop.json`, `delivery_trip.js` |
| Shipping Rule | Account/cost-center based shipping calculation: rule type, calculate based on, shipping amount, conditions, countries, project | `erpnext/accounts/doctype/shipping_rule/shipping_rule.json` |
| Delivery Settings | Dispatch template/attachment, send-with-attachment, stop delay | `erpnext/stock/doctype/delivery_settings/delivery_settings.json` |
| Print formats | Delivery Note bordered/classic/modern/with images, Pick List, Purchase Receipt serial/batch | `erpnext/stock/print_format/` |

### Carbon — Shipments with source-document types and a hard posting gate

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Shipments list | Shipment ID, source document + readable ID, status, invoiced, posted by/date, assignee, customer, external ref, created/updated; **Add Shipment** | `apps/erp/app/modules/inventory/ui/Shipments/ShipmentsTable.tsx`, routes `apps/erp/app/routes/x+/shipment+/` |
| Shipment detail | Header status, meta, assignee, **Post**/**Void**/delete, print/invoice; lines with serial numbers, tracking, fixed assets, rental units; documents rail | `apps/erp/app/modules/inventory/ui/Shipments/ShipmentHeader.tsx`, `ShipmentLines.tsx`, `ShipmentDocuments.tsx`, `ShipmentPostModal.tsx`, `ShipmentVoidModal.tsx` |
| Source documents | Sales Order, Sales Return Order, Purchase Order, Purchase Return Order, Outbound Transfer, Rental Agreement; the source document drives which lines/quantities can ship | `apps/erp/app/modules/inventory/inventory.models.ts` (`shipmentSourceDocumentType`), `apps/erp/app/modules/inventory/ui/Shipments/ShipmentForm/` |
| Posting gate | Post modal blocks on missing track quantities and **expired batches** (`expiredErrors` block, `expiredWarnings` warn); rule violations modal may also block | `apps/erp/app/modules/inventory/ui/Shipments/ShipmentPostModal.tsx` |
| Shipping Methods | Name, carrier, carrier account, tracking URL; CRUD list/form | `apps/erp/app/modules/inventory/ui/ShippingMethods/ShippingMethodForm.tsx`, `ShippingMethodsTable.tsx`, routes `apps/erp/app/routes/x+/inventory+/shipping-methods*` |
| Shipment statuses | Draft → Pending → Posted / Voided | `apps/erp/app/modules/inventory/inventory.models.ts` (`shipmentStatusType`) |
| Tracking | Shipment lines carry tracked entities; traceability view links them to receipts, shipments, jobs and adjustments | `apps/erp/app/modules/inventory/ui/Traceability/`, `apps/erp/app/modules/inventory/ui/Shipments/ShipmentLines.tsx` |

### Dolibarr — shipment document with tracking and delivery method

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Shipment card | Third party, project, shipping/delivery dates, weight, dimensions, delivery method, tracking number, incoterm, notes; validate/close; linked delivery receipt when the delivery submodule is enabled | `htdocs/expedition/card.php`, `htdocs/core/lib/sendings.lib.php` |
| Shipment distribution | Pick quantities per order line/warehouse/batch; autofill/reset; stock warnings | `htdocs/expedition/dispatch.php` |
| Shipment document | PDF generation from configurable model; email/agenda/notes/contacts tabs | `htdocs/expedition/document.php`, `agenda.php`, `note.php`, `contact.php`; `htdocs/admin/expedition.php` |
| Barcode helpers | Shipment barcode search and print sheets | `htdocs/expedition/ajax/searchfrombarcode.php`, `htdocs/barcode/printsheet.php` |
| Delivery receipt | Separate delivery document when `MAIN_SUBMODULE_DELIVERY` is enabled, linked from the shipment | `htdocs/delivery/`, `expedition_prepare_head` in `core/lib/expedition.lib.php` |

### AureusERP — print actions rather than carrier connectors

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Delivery labels/documents | Actions: Delivery Slip, Labels, Package, Picking Operation, Return Slip; each opens a print/PDF flow from an operation | `.../Clusters/Operations/Actions/Print/{DeliverySlipAction,LabelsAction,PackageAction,PickingOperationAction,ReturnSlipAction}.php` |
| Operation form | Shipping policy (direct vs. all-at-once), scheduled at, source document, responsible user; moves with packages | `.../Clusters/Operations/Resources/OperationResource/Schemas/OperationForm.php` |
| **Absent** | No carrier rate/label integration or tracking-number screen in the inventories plugin; carrier logic would live outside this module | `plugins/webkul/inventories/src/Filament/` has no Carrier/DeliveryMethod resource |

### metasfresh — delivery planning and HU carrier advice

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Delivery planning | Backend window (no dedicated React page); document-list header sums planned/actual load and discharge quantities per UoM across selected rows | `frontend/src/components/deliveryPlanning/DeliveryPlanningViewHeader.js`, `OIViewHeader.js` |
| Carrier advice | Service that computes/returns carrier advice for packed HUs (used by the delivery process, not a standalone screen) | `backend/de.metas.picking.rest-api/src/main/java/de/metas/picking/workflow/PackedHUCarrierAdviseService.java` |
| HU label printing | Mobile/desktop actions to print HU labels (PDF/ZPL) through the HU manager | `backend/de.metas.handlingunits.mobileui/src/main/java/de/metas/handlingunits/rest_api/{JsonPrintHULabelRequest,JsonPrintHULabelResponse}.java`, `backend/de.metas.picking.rest-api/src/main/java/de/metas/picking/rest_api/json/massprinting/JsonMassPrintingScanRequest.java`, `backend/de.metas.handlingunits.mobileui/src/main/java/de/metas/handlingunits/mobileui/HUManagerRestController.java` |

**BOSS implications.** In the references packing and shipping are separate verbs on the same outbound shipment: packing assigns items to packages and captures weight/dimensions; shipping assigns a carrier/service, produces labels/tracking, and posts the stock movement. Odoo's package model (package + type + contents + parent package) and ERPNext's shipment/trip model together cover the ground: package-level contents are needed for multi-box orders, and a delivery trip is needed when one vehicle carries several shipments. Mantle covers most of it: `ShipmentPackage` (box type, weight) with `ShipmentPackageContent`, `ShipmentBoxType`/`FacilityBoxType`/`CarrierShipmentBoxType` for box sizes, `ShipmentPackageRouteSeg` for per-package tracking code, label and return label, `ShipmentRouteSegment` for carrier, method and costs, and `Delivery` (vehicle `assetId`, origin/destination facility, mileage, fuel) referenced from `ShipmentRouteSegment.deliveryId` as the delivery-trip record; outbound packages do not nest (no parent package), while storage pallets and totes are `Container` records. Odoo's `delivery.carrier` frames carrier integration as a provider interface with fixed-price/rule-based fallbacks, which suits businesses that start with flat rates and only later add live rates; Mantle's `CarrierShipmentMethod`, `ShippingGateway*` and `mantle.shipment.CarrierServices` (`get#ShippingRate`, `request#ShipmentLabels`, `track#ShipmentLabels`, `refund#ShipmentLabels`) with `ShipmentServices.print#ShipmentLabels` are that interface already, so rating needs screens over it rather than a reimplementation. Carriers, ship methods and labels are a reused function (crosscut §4): Warehouse includes carrier setup and labels, Commerce includes the checkout shipping options and rates per store (`ProductStoreShipOption`), over the same records. Carbon's posting gate is the strongest evidence on shipment validation: expired or untracked goods block shipment rather than warn after the truck leaves.

---

## 9. Returns receiving

### Odoo — Return creates a new draft transfer, Exchange replaces it

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Return | Button on a done transfer; creates a new picking linked to the original, with quantities returned and `origin_returned_move_id` set; opens the new draft transfer for review/edit | `odoo/addons/stock/models/stock_picking.py` (`action_return`, `_create_return`), `odoo/addons/stock/views/stock_picking_views.xml` |
| Return All / Clear | On a draft return, fills every line with the original done quantity or zeroes them | `odoo/addons/stock/models/stock_picking.py` (`action_return_all`, `action_clear_return`), `odoo/addons/stock/views/stock_picking_views.xml` |
| Exchange | Creates a replacement transfer with the original links cleared, confirms and reserves it | `odoo/addons/stock/models/stock_picking.py` (`action_exchange`) |
| Returns stat button | Original transfer shows a Returns count linking to all returns | `odoo/addons/stock/views/stock_picking_views.xml` (`action_see_returns`, `return_count`) |
| Return slip | Printable return document | `odoo/addons/stock/report/report_return_slip.xml` |
| Returned picking list | A return is a normal transfer, so it appears in receiving/shipping lists with origin and backorder links | `odoo/addons/stock/views/stock_picking_views.xml` |

### ERPNext — `is_return` + `return_against` on the same doctypes

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Purchase Return | Purchase Receipt with `is_return` set and `return_against` pointing at the original; statuses Return / Return Issued; debits the supplier | `erpnext/stock/doctype/purchase_receipt/purchase_receipt.json`, `purchase_receipt.js` |
| Sales Return | Delivery Note with `is_return` set and `return_against`; statuses Return / Return Issued; feeds a credit note | `erpnext/stock/doctype/delivery_note/delivery_note.json`, `delivery_note.js` |
| Return creation | Actions **Purchase Return** / **Sales Return** create the return document from the original; rejected quantities can feed a purchase return against the rejected warehouse | `erpnext/stock/doctype/purchase_receipt/purchase_receipt.js`, `erpnext/stock/doctype/delivery_note/delivery_note.js` (`make_purchase_return_against_rejected_warehouse`) |
| Returns receiving | A purchase return is an outbound movement to the supplier; a sales return is an inbound receipt at a warehouse. The same Quality Inspection / rejected-warehouse logic applies | `erpnext/stock/doctype/purchase_receipt/purchase_receipt.py`, `erpnext/stock/doctype/delivery_note/delivery_note.py`, `erpnext/stock/doctype/quality_inspection/quality_inspection.json` |
| Return trends | Purchase Receipt / Delivery Note trend charts include returns | `erpnext/stock/dashboard_chart/purchase_receipt_trends/`, `delivery_trends/` |

### Carbon — return source documents on both receipts and shipments

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Sales return receiving | New receipt with source document **Sales Return Order**; supplier fields are hidden and the customer is resolved from the return order; lines can be tracked/serialized and inspected | `apps/erp/app/modules/inventory/ui/Receipts/ReceiptForm/useReceiptForm.tsx`, `Receipts/ReceiptDocuments.tsx`, `inventory.models.ts` (`receiptSourceDocumentType`) |
| Purchase return shipping | New shipment with source document **Purchase Return Order**; moves stock out to the supplier | `apps/erp/app/modules/inventory/ui/Shipments/ShipmentForm/`, `inventory.models.ts` (`shipmentSourceDocumentType`) |
| Per-entity return | On a sales-return receipt, `ReturnEntityForm` selects which shipped serial/batch entities arrived; it re-tags the existing entity rather than creating a new one | `apps/erp/app/modules/inventory/ui/Receipts/ReturnEntityForm.tsx`, route `apps/erp/app/routes/x+/receipt+/lines.return-entities.tsx` |
| Returned lot handling | Returned tracked entities are received into the chosen location through the same line/tracking flow; a failed inspection can reject the lot | `apps/erp/app/modules/inventory/ui/Receipts/ReceiptLines.tsx`, `ReceiptPostModal.tsx`, `quality/ui/Inspections/` |
| Return source documents | Receipt sources: Sales Return Order, Purchase Order, Purchase Invoice, Inbound Transfer, Rental Agreement; shipment sources: Sales Order, Sales Return Order, Purchase Order, Purchase Return Order, Outbound Transfer, Rental Agreement (other values are commented out in the source) | `apps/erp/app/modules/inventory/inventory.models.ts` |

### AureusERP — return modal on a done operation

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Return action | Visible on DONE operations; modal lists returnable moves (product, original qty, return qty, UoM), rejects empty returns and excess quantities with a warning; creates a new return operation and redirects to its edit form | `plugins/webkul/inventories/src/Filament/Clusters/Operations/Actions/ReturnAction.php` |
| Return slip print | `ReturnSlipAction` is registered but its action body is empty in this checkout — no actual print implementation | `.../Clusters/Operations/Actions/Print/ReturnSlipAction.php` |
| Return operation | The created return is a normal operation (incoming or outgoing depending on the original); it uses the same moves/validate flow | `.../Clusters/Operations/Actions/ReturnAction.php` (`Inventory::createReturn`) |

### Dolibarr — no dedicated returns-receiving document

| Screen/page | What it is | Key files |
| --- | --- | --- |
| **Absent** returns document | `htdocs/expedition/` and `reception/` have no return/customer-return document or return-against link in this checkout; returns are handled with credit notes and manual/negative stock movements | verified by directory and `grep -ril return htdocs/expedition htdocs/reception` (only normal shipment/reception code) |
| Correct stock | Negative/positive manual movement is the fallback for putting returned goods back | `htdocs/product/stock/product.php` (`correct_stock`), `massstockmove.php` |

**BOSS implications.** In Odoo, ERPNext and Carbon, returns receiving is the same receipt screen with a return source document and a return-against link, not a separate "RMA receiving" form. Customer returns are a reused function over one RMA record (`ReturnHeader`/`ReturnItem`, Requested → Approved → Shipped → Received → Completed): Customer Service includes authorization, Warehouse the receipt and disposition, Accounting the credit, Commerce online returns (crosscut §4). The important differences from a purchase receipt are: the party is a customer (not a supplier), the expected quantity is bounded by what was shipped, and the disposition (restock / quarantine / scrap) is captured per line. ERPNext's rejected warehouse is a good model for separating good from bad returns; Carbon's per-entity return gives the granularity serialized goods need. Mantle already models this: shipment types `ShpTpSalesReturn` and `ShpTpPurchaseReturn`, `ShipmentItemSource.returnId`/`returnItemSeqId`, `AssetReceipt.returnId`, and `mantle.order.ReturnServices` (`create#ReturnShipment`, `add#ReturnToShipment`, `receive#ReturnShipmentItems`, `receive#ReturnWithoutShipment`, `receive#ReturnItem`, `returnAndResell#Shipment`), covered by `component/mr-mantle/test/ShipmentReturnMisc.spec.js` and `ReturnToResponseBasicFlow.spec.js`; no new tables look necessary. Disposition to quarantine is a move to a `FltQuarantine` location. Odoo shows the return from the original shipment/order (a Returns stat button), which in BOSS terms is part of the reused Order detail screen.

---

## 10. Lots, serials, packages & traceability

### Odoo — lot/serial records with stat buttons, package hierarchy and traceability report

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Lot/Serial form | Name, product, reference, company, customers, inventory group (quantity, UoM, location), properties, note; stat buttons **Transfers**, **Location**, **Traceability**, **Scraps** (scraps only when the lot was scrapped) | `odoo/addons/stock/views/stock_lot_views.xml` (`view_production_lot_form`) |
| Lot/Serial list/kanban | Name, product, reference, create date, company, transfer-to partners, activities, properties, quantity; kanban card with product and activity | `odoo/addons/stock/views/stock_lot_views.xml` (`view_production_lot_tree`, `view_production_lot_kanban`) |
| Lot/serial search | Filters by lot/serial number, customer, product, properties, create date; actions to print lot/serial barcode (PDF/ZPL) | `odoo/addons/stock/views/stock_lot_views.xml` (`search_product_lot_filter`, `action_print_lot_label_pdf`, `action_print_lot_label_zpl`) |
| Package form/list | Package name, type, owner, location, parent container, pack date, contents (product/lot/qty/UoM); **Unpack**; link to transfer; editable list **Put in Pack**/**Remove**; kanban | `odoo/addons/stock/views/stock_package_views.xml` (`stock_package_view_form`, `stock_package_view_list*`, `stock_package_view_kanban`) |
| Package history | History record per package movement; barcode-with-contents reports | `odoo/addons/stock/views/stock_package_history_views.xml`, `odoo/addons/stock/report/report_package_barcode.xml` |
| Traceability report | Transient report walking parent/child move lines for a lot/serial, transfer or move line; returns nodes/levels for the report UI | `odoo/addons/stock/report/stock_traceability.py`, `odoo/addons/stock/views/report_stock_traceability.xml` |
| Expiry | Optional `product_expiry` module adds best-before/removal/end-of-life/alert dates to lots; print/alert settings in Inventory settings | `odoo/addons/product_expiry/`, `odoo/addons/stock/views/res_config_settings_views.xml` (setting `expiration_dates_serial_numbers`) |
| Traceability on transfers | Transfer stat button and lot stat buttons open the same traceability report | `odoo/addons/stock/views/stock_picking_views.xml` (`Traceability` button), `stock_lot_views.xml` |

### ERPNext — Batch, Serial No, Serial and Batch Bundle

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Batch | Batch ID, item, parent batch, manufacturing date, expiry date, supplier, reference doctype/name, description, batch qty/UoM, qty to produce/produced qty, batch-wise valuation, allow-negative-stock; list/kanban search | `erpnext/stock/doctype/batch/batch.json`, `batch.js` |
| Serial No | Serial number, item, description, item group/brand, asset + status, location, employee, maintenance status, warranty period/expiry, AMC expiry, company, work order, warehouse, batch, purchase rate, status, customer, reference doctype/name, posting date | `erpnext/stock/doctype/serial_no/serial_no.json`, `serial_no.js` |
| Serial and Batch Bundle | Submittable bundle linking a voucher line to serial/batch entries with quantities/directions; used by Stock Entry, Purchase Receipt, Delivery Note, Pick List, Stock Reconciliation | `erpnext/stock/doctype/serial_and_batch_bundle/`, `serial_and_batch_entry/` |
| Traceability reports | Serial No and Batch Traceability, Serial and Batch Summary, Serial No Ledger, Batch-Wise Balance History, Available Batch/Serial, Batch Item Expiry Status, Serial No Status/Warranty/Service Contract Expiry, Negative Batch | `erpnext/stock/report/{serial_no_and_batch_traceability,serial_and_batch_summary,serial_no_ledger,batch_wise_balance_history,available_batch_report,available_serial_no,batch_item_expiry_status,serial_no_status,serial_no_warranty_expiry,serial_no_service_contract_expiry,negative_batch_report}/` |
| Reservation by serial/batch | Pick List/Stock Reservation Entry can pick/reserve specific serial/batch bundles; settings control auto-reserve and selection policy | `erpnext/stock/doctype/stock_settings/stock_settings.json`, `erpnext/stock/doctype/pick_list_item/pick_list_item.json` |

### Carbon — tracked entities, expiry policy, and a lineage graph

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Tracked entities list | Searchable list of serials/batches with status, item, source document, expiry; actions to edit expiry | `apps/erp/app/modules/inventory/ui/Traceability/TrackedEntitiesTable.tsx`, route `apps/erp/app/routes/x+/inventory+/tracked-entities.tsx`, `tracked-entity.expiry.tsx` |
| Traceability graph | Node/edge graph of receipt, production, shipment, transfer, adjustment, split, return and scrap events; toolbar: search nodes, hop depth, top-down/left-right layout, isolate lineage, fit/re-layout, spacing; table view; legend (normal flow, selection path, reject branch, cycle back-edge, serial group) | `apps/erp/app/modules/inventory/ui/Traceability/` (`TraceabilityGraph*`, `apps/erp/app/modules/inventory/ui/Traceability/GraphToolbar.tsx`, `GraphLegend.tsx`, `NodeSearchDialog.tsx`, `edges/`, `nodes/`) |
| Batch properties | Configurable per-item batch properties (text/number/date/list) shown on receipt/shipment lines and stored on tracked entities | `apps/erp/app/modules/inventory/ui/Batches/BatchPropertiesConfig.tsx`, `BatchPropertiesFields.tsx`, `apps/erp/app/modules/inventory/inventory.models.ts` (`batchPropertyValidator`) |
| Expiry trace | Popover explaining how a final expiry date was derived: split from another batch, goods receipt, production output, manual adjustment, policy mode, manual override reason, final date | `apps/erp/app/modules/inventory/ui/Traceability/ExpiryTracePopover.tsx`, `EditExpiryModal.tsx` |
| Shelf-life policy | Company settings: near-expiry warning days, expired entity policy (Warn / Block / BlockWithOverride); receipt/shipment post modals enforce it | `apps/erp/app/modules/inventory/inventory.models.ts`, `apps/erp/app/modules/inventory/ui/Receipts/ReceiptPostModal.tsx`, `apps/erp/app/modules/inventory/ui/Shipments/ShipmentPostModal.tsx`, `apps/erp/app/modules/settings/settings.service.ts` |
| Serial selection | `TrackedEntityPicker` for scan-or-select of serial/batch with quantity clamping; shared by receipts, shipments, transfers and picking | `packages/react/src/TrackedEntityPicker.tsx` (used in receipt/shipment/stock-transfer scan routes) |
| Labels | ZPL/PDF label printing for tracked entities and operations (MES file routes) and a shared print button; storage-unit labels print from the ERP storage-unit list (§11) | `apps/mes/app/routes/file+/entity+/`, `apps/mes/app/routes/file+/operation+/` (each with $id.labels[.]pdf.tsx and $id.labels[.]zpl.tsx), `packages/printing/src/ui/PrintButton.tsx` |

### AureusERP — Lot and Package resources

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Lots | CRUD resource with lot name, product, quantities; relation page for quantities | `plugins/webkul/inventories/src/Filament/Clusters/Products/Resources/LotResource/`, `LotResource/Pages/ManageQuantities.php` |
| Packages | CRUD resource with package name/type, operations relation, products relation | `.../Clusters/Products/Resources/PackageResource/`, `.../Clusters/Products/Resources/PackageResource/RelationManagers/ProductsRelationManager.php` |
| Package types / packaging | Configuration resources for package types and packagings | `.../Clusters/Configurations/Resources/PackageTypeResource/`, `PackagingResource/` |
| Settings | Traceability toggle: enable lots/serial numbers; display lots on delivery slips | `.../Clusters/Settings/Pages/ManageTraceability.php` |

### Dolibarr — product lots with movement and document links

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Lot list/card | Lot/serial reference, product, batch qty, eat-by/sell-by dates, supplier, documents, notes; list search | `htdocs/product/stock/productlot_list.php`, `productlot_card.php`, `productlot_document.php`, `productlot_note.php` |
| Lot movements | Stock movements filtered by batch, with eat-by/sell-by columns in the movement list | `htdocs/product/stock/movement_list.php` |
| Batch/serial entry | Batch/serial fields on reception and shipment distribution lines; warnings when qty exceeds serial quantity | `htdocs/reception/dispatch.php`, `htdocs/expedition/dispatch.php` |
| Barcode sheets | Barcode print sheet and code init pages | `htdocs/barcode/printsheet.php`, `codeinit.php` |

**BOSS implications.** Lots and serials are not a Warehouse-only concern, but Warehouse is where they are created and consumed. Mantle already has `Lot` (`lotNumber`, manufacturer party, `manufacturedDate`, `expirationDate`), `Asset` (`serialNumber`, `lotId`, `containerId`, `ownerPartyId`), `AssetDetail` (the quantity ledger), `Container` (pallets, totes and shelf bins by `containerTypeEnumId`, with facility and location), `AssetReceipt`, `AssetIssuance` and `AssetReservation`; this maps a serial to an `Asset` and a batch to a `Lot`, and suggests a single `TrackedEntityPicker`-style interaction used by receipt, pick, transfer and count. Carbon's expiry trace and policy (near-expiry warning days; Warn / Block / BlockWithOverride) is the one reference answer to expiry disputes, which are otherwise impossible to explain; Mantle stores one `expirationDate` per lot, so the policy and the trace would be new. Outbound package contents fit `ShipmentPackage`/`ShipmentPackageContent`, storage handling units `Container`; package labels and contents reports printable from both the package and the shipment are a candidate requirement. The references treat traceability as a graph or a drill-down ledger rather than a static report (here over `AssetReceipt`, `AssetIssuance` and `AssetDetail`); Odoo's parent/child move walk and Carbon's lineage graph are the two implementations to study. The existing `Lot` and `Asset` records cover warehouse lot/serial needs without a second table.

---

## 11. Locations, storage & facility setup

### Odoo — warehouse/location hierarchy, operation types, routes and storage categories

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Warehouses | Warehouse list/form: name, code, company, address; **Warehouse Configuration** tab (reception steps, delivery steps, resupply warehouses); Technical tab (view/stock/input/QC/pack/output locations, generated operation types) | `odoo/addons/stock/views/stock_warehouse_views.xml` (`action_warehouse_form`, `view_warehouse`) |
| Locations | Tree/list/form; name, parent, usage (`view`, `internal`, `transit`, `inventory`, `production`, `supplier`, `customer`), storage category, company, replenish flag, cyclic inventory frequency/last/next count, removal strategy; search filters by usage, empty locations, warehouse; **Putaway Rules** and **Products** stat buttons | `odoo/addons/stock/views/stock_location_views.xml` (`action_location_form`, `view_location_form`, `view_location_search`, `view_location_tree2`) |
| Operation types | CRUD for receipt/delivery/internal/manufacturing/POS types; code, sequence, warehouse, reservation method, backorder default, lot policy, default source/destination, allocation location, batch settings, print-on-validation | `odoo/addons/stock/views/stock_picking_type_views.xml` (`action_picking_type_list`, `view_picking_type_form`) |
| Routes | Route list/form; rules list/form with push/pull action, source/destination, picking type, delay, procurement method, domain; warehouse form links to its routes | `odoo/addons/stock/views/stock_location_views.xml` (`stock_location_route_tree`, `stock_location_route_form_view`), `stock_rule_views.xml` |
| Putaway Rules | Product/category/package-type → location/storage-category, priority order; editable list | `odoo/addons/stock/views/product_strategy_views.xml` (`stock_putaway_list`, `action_putaway_tree`) |
| Storage Categories | Name, allow-new-product, max weight + UoM; capacity by package (package type, quantity) and capacity by product (product, quantity, UoM); **Locations** stat button | `odoo/addons/stock/views/stock_storage_category_views.xml` |
| Package Types | Name, barcode, sequence/routes, dimensions (L×W×H, base/max weight), capacity by storage category | `odoo/addons/stock/views/stock_package_type_view.xml` |
| UoM / packaging | Units of measure under stock configuration; packagings are product-level fields rather than a separate screen | `odoo/addons/uom/views/uom_uom_views.xml` (menu `menu_stock_uom_form_action`) |

### ERPNext — warehouse tree, putaway rules, capacity page

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Warehouse | Tree/list/form with `is_group`, parent, company, account, address/contact, warehouse type, default transit warehouse, rejected flag, customer; list shows group/company/account | `erpnext/stock/doctype/warehouse/warehouse.json`, `warehouse.js` |
| Warehouse Type | Simple descriptor record | `erpnext/stock/doctype/warehouse_type/` |
| Putaway Rule | Item or category, warehouse, capacity/stock capacity, UoM/conversion, priority, company, disabled | `erpnext/stock/doctype/putaway_rule/putaway_rule.json` |
| Warehouse Capacity Summary | Capacity/occupancy page with company/warehouse/item/parent filters and drill-down | `erpnext/stock/page/warehouse_capacity_summary/` |
| UoM / UoM Category / Conversion | Unit masters and conversion factors used by stock and putaway capacity | `erpnext/setup/doctype/uom/`, `erpnext/stock/doctype/uom_category/`, `erpnext/setup/doctype/uom_conversion_factor/` |
| Stock Settings | Module-wide defaults (valuation method, negative stock, barcode field visibility, freeze dates, reservation, etc.) | `erpnext/stock/doctype/stock_settings/stock_settings.json` |

### Carbon — storage units, storage types and a rule builder

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Storage Units list/form | Name, location, parent storage unit, storage types, work center; active flag; print label (PDF/ZPL); add child, delete; bulk label printing | `apps/erp/app/modules/inventory/ui/StorageUnits/StorageUnitsTable.tsx`, `StorageUnitForm.tsx` |
| Storage Types list/form | Simple name-based classification used by storage units and items | `apps/erp/app/modules/inventory/ui/StorageTypes/StorageTypesTable.tsx`, `StorageTypeForm.tsx` |
| Storage Rules | Rule builder: name, active, description, applies-to-all-work-centers, condition AST (field/operator/value rows, item filters), surfaces, assignments, severity; list + edit form | `apps/erp/app/modules/inventory/ui/StorageRules/StorageRuleForm.tsx`, `RuleBuilder.tsx`, `RuleAssignmentsList.tsx`, `SeveritySelect.tsx`, `StorageRulesTable.tsx` |
| Shipping Methods | Carrier/account/tracking URL configuration | `apps/erp/app/modules/inventory/ui/ShippingMethods/` |
| Locations | Company locations are managed outside the inventory module; storage units reference a location | `apps/erp/app/modules/inventory/ui/StorageUnits/StorageUnitForm.tsx` (location select) |

### AureusERP — warehouse, location, storage category, putaway and routes

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Warehouses | Name, code, company, address; Settings: reception steps, delivery steps, resupply-from warehouses, manufacture steps; visible only when multi-step routes are enabled | `.../Clusters/Configurations/Resources/WarehouseResource/Schemas/WarehouseForm.php` |
| Locations | Name, parent, description; settings: type (internal/transit/inventory/production/supplier/customer/view), company, storage category (internal only), scrap flag, dock flag, replenish flag, cyclic inventory frequency/last/next dates (internal/transit) | `.../Clusters/Configurations/Resources/LocationResource/Schemas/LocationForm.php` |
| Storage Categories | Capacity by package and capacity by product relation pages; locations relation | `.../Clusters/Configurations/Resources/StorageCategoryResource/` |
| Putaway Rules | Company, in/out location, product/category, storage category, sub-location | `.../Clusters/Configurations/Resources/PutawayRuleResource/Schemas/PutawayRuleForm.php` |
| Routes / Rules | Route form + rules relation manager; rule form | `.../Clusters/Configurations/Resources/RouteResource/`, `RuleResource/` |
| Operation Types | Incoming/outgoing/internal/dropship definitions with source/destination locations | `.../Clusters/Configurations/Resources/OperationTypeResource/` |
| Package Types / Packagings | Package type form (dimensions/weight/capacity) and packaging form | `.../Clusters/Configurations/Resources/PackageTypeResource/`, `PackagingResource/` |
| Settings pages | Warehouses: enable locations, multi-step routes; Operations: packages, annual inventory day/month; Products: variants/UoM/packagings; Traceability: lots/serials; Logistics: dropshipping | `.../Pages/Settings/Manage*.php`, base under `Clusters/Settings/Pages/` |

### Dolibarr — warehouses and stock setup

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Warehouse card/list | Ref, label, description, address, status (open/closed), product count, stock value; agenda/stock/valuation tabs | `htdocs/product/stock/card.php`, `list.php`, `fiche-valo.php` |
| Stock setup | Rules for stock decrease/increase at bill/order/shipment/reception/close, negative-stock guards, virtual stock horizon, PDF model | `htdocs/admin/stock.php` |
| Stock transfer setup | Numbering/model for stock transfer documents | `htdocs/admin/stocktransfer.php` |
| Shipment setup | Numbering, PDF model, tracking/stock-entry-date display, free legal text, draft watermark, online signature | `htdocs/admin/expedition.php` |
| Reception setup | Numbering, PDF model, free text, draft watermark | `htdocs/admin/reception_setup.php` |

### metasfresh — locators, warehouses and HU configuration

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Locators/warehouses | Backend windows (metadata-defined); locator resolution by scanned code is exposed to the mobile app | `backend/de.metas.inventory.mobileui/src/main/java/de/metas/inventory/mobileui/rest_api/json/{JsonResolveLocatorRequest,JsonResolveLocatorResponse}.java`, `backend/de.metas.inventory.mobileui/src/main/java/de/metas/inventory/mobileui/deps/warehouse/LocatorInfo.java` |
| HU profiles | Mobile profile/layout configuration decides which HU actions and fields the handheld shows | `backend/de.metas.handlingunits.mobileui/src/main/java/de/metas/handlingunits/mobileui/config/{HUManagerProfile,HUManagerProfileLayoutSection,HUManagerProfilesMap}.java` |
| Generic configuration windows | Warehouse/locator/product setup rendered by the same list/master shell | `frontend/src/containers/DocumentListContainer.js` |

### Ever Gauzy — inventory pages, plus warehouse and inventory plugins with no UI

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Ever Gauzy inventory pages | Angular pages: products (table, edit item and variants), product types and categories, **warehouses** (warehouse form, product list per warehouse, manage quantity per product and variant), merchants | `apps/gauzy/src/app/pages/inventory/components/{manage-warehouses,table-inventory-items,edit-inventory-item,manage-merchants}/` |
| Ever Gauzy warehouse plugin (API only) | Zones (receiving, storage, picking, packing, staging, shipping, returns, quarantine, damage; pickable / receivable / shippable / blocked flags, temperature range), a bin tree (aisle → rack → level → position), pick waves, pick lists derived from due shipments, pick lines (a short pick writes a stock correction), pack slips (packages, weight, tracking, label) and carrier manifests; REST controllers and GraphQL, no screens in the checkout | `packages/plugins/warehouse/README.md`, `packages/plugins/warehouse/src/lib/{warehouse-zone,warehouse-bin,pick-wave,pick-list,pick-list-line,pack-slip,carrier-manifest}/`, `packages/plugins/warehouse/src/lib/warehouse.types.ts` |
| Ever Gauzy inventory plugin (API only) | Append-only stock ledger written with the level row, reservations with expiry, transfers, adjustments, low-stock alerts, physical counts (statuses Draft → Open → Counting → Review → Closed / Canceled; modes Full, Cycle, Spot, Recount; line statuses Pending, Counted, Recounted, Skipped); available = quantity − reserved − safety stock | `packages/plugins/inventory/README.md`, `packages/plugins/inventory/src/lib/{stock-ledger,stock-reservation,stock-transfer,stock-count,stock-count-line,stock-alert}/`, `packages/plugins/inventory/src/lib/inventory.enums.ts` |

**BOSS implications.** Facility and location master data is one set of records. Per crosscut §3 the **Facility & equipment record** is a reused screen that Maintenance, Warehouse, Manufacturing, Commons and Accounting include; Warehouse's version emphasizes storage locations and setup, on the same `Facility` records rather than a separate warehouse/location table. Mantle already has `Facility` (`parentFacilityId` hierarchy, type `FcTpWarehouse` among others, asset policy flags `assetAllowOtherOwner`, `assetAllowIssueOverQoh`, `assetInventoryLocRequire`, `defaultDaysToShip`), `FacilityLocation` (area/aisle/section/level/position, `locationTypeEnumId`, `capacity` + `capacityUomId`, `sequenceNum` for pick-path order), `FacilityLocationType` (the location types a facility uses, each with an optional `autoStatusId` that sets the asset status on move), `FacilityBoxType`, `FacilityPrinter`, `FacilityGroup`, `ProductFacility` (`minimumStock`, `reorderQuantity`, `daysToShip`) and `ProductFacilityLocation` (`minimumStock`, `moveQuantity`). The location types Receiving, Staging, Quarantine, Pick, Bulk and Morgue already exist (`Flt*`), so receiving docks, staging, quarantine and pick faces need no new data. What is missing is a shipping-dock type (a `Facility` of type `FcTpDock` exists, a location type does not), category- or storage-type putaway rules, capacity enforcement (the fields exist, no service checks them), and the one-, two- or three-step receiving/delivery setting. Ever Gauzy's zone kinds (receiving, storage, picking, packing, staging, shipping, returns, quarantine, damage) and bin tree are a useful checklist. One screen with role-based sections, included in Warehouse for warehouse staff and in Maintenance for facilities managers, matches initial-design's shared-screen rule.

---

## 12. Barcode, handheld & scan flows

### Odoo — barcodes module only; full scanner is an enterprise add-on absent here

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Barcode Nomenclatures | List/form of nomenclature records and barcode rules (pattern, encoding, model/field mapping); configuration in Inventory → Products → Barcode Nomenclatures | `odoo/addons/barcodes/views/barcodes_view.xml`, `barcodes/models/barcode_nomenclature.py`, `barcode_rule.py` |
| GS1 nomenclature | Optional GS1 preset nomenclature/rules | `odoo/addons/barcodes_gs1_nomenclature/` |
| Barcode separator | Company setting used when parsing scanned codes | `odoo/addons/stock/views/res_config_settings_views.xml` (setting `barcode_separator`) |
| Mobile move-line form | A mobile-optimized (editable) variant of the move-line form used by scanner apps | `odoo/addons/stock/views/stock_move_line_views.xml` (`view_move_line_mobile_form`) |
| **Absent** scanner app | `stock_barcode` and `stock_barcode_barcodelookup` are referenced as upgrade modules in settings but are not present in this community checkout; there is no scan screen, no barcode action, no handheld JS. The only scan-like widget is `many2many_barcode_tags` for tag fields | verified by `ls odoo/addons \| grep '^stock_barcode'` (none); `odoo/addons/stock/views/res_config_settings_views.xml` (`module_stock_barcode`); `stock/static/src/widgets/many2many_barcode_tags.js` |
| Barcode print | Lot/serial, location, package and operation-type label reports (PDF/ZPL) | `odoo/addons/stock/report/report_lot_barcode.xml`, `report_location_barcode.xml`, `report_package_barcode.xml`; `wizard/stock_lot_label_layout.xml`, `stock_location_label_layout.py`, `stock_package_label_layout.py`, `stock_picking_type_label_layout.py` |
| Mobile picking views | The transfer form already exposes a "Moves" list and details suitable for a scan-driven flow, but Odoo community does not ship the scanner UI | `odoo/addons/stock/views/stock_picking_views.xml`, `stock_move_line_views.xml` |

### ERPNext — scan fields and scan modes, no dedicated handheld app

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Header barcode scan | `scan_barcode` field on Purchase Receipt, Delivery Note, Stock Entry, Stock Reconciliation, Pick List; scanning fills/creates lines | the JSON and JS files of each doctype |
| Scan modes | Pick List and Stock Reconciliation have `scan_mode` (continuous scanning) and `prompt_qty`; lines have `has_item_scanned` | `erpnext/stock/doctype/pick_list/pick_list.json`, `erpnext/stock/doctype/stock_reconciliation/stock_reconciliation.json`, `erpnext/stock/doctype/pick_list_item/pick_list_item.json`, `erpnext/stock/doctype/stock_reconciliation_item/stock_reconciliation_item.json` |
| Barcode fields | Item `barcode`, warehouse/package/lot/serial identifiers; `show_barcode_field` in Stock Settings controls visibility | `erpnext/stock/doctype/item/`, `erpnext/stock/doctype/stock_settings/stock_settings.json` |
| Quick Stock Balance | Barcode input opens item stock/value without navigating the item master | `erpnext/stock/doctype/quick_stock_balance/` |
| **Absent** handheld UI | Nothing in the checkout is a mobile/PWA warehouse app; scanning is embedded in Desk forms | verified by `grep -r` for mobile/route apps; ERPNext is a Desk SPA |

### Carbon — scan-or-select pickers and a full MES handheld app

| Screen/page | What it is | Key files |
| --- | --- | --- |
| TrackedEntityPicker | Modal picker with Scan and Select tabs; scan a serial/batch or choose from available entities; quantity clamped; expiry warning/policy; used by receipt, shipment, stock-transfer and picking flows | `packages/react/src/TrackedEntityPicker.tsx` (imports in `apps/erp/app/modules/inventory/ui/Receipts/ReceiptLines.tsx`, `apps/erp/app/modules/inventory/ui/Shipments/ShipmentLines.tsx`, `routes/x+/stock-transfer+/$id.scan.$lineId.tsx`) |
| MES app shell | Mobile-first app with app bar, bottom tab bar, more-sheet, session lock, pin-in/pin-out, timecard, offline-ish overlays | `apps/mes/app/components/{MesAppBar,MesBottomBar,MesTabBar,MoreSheet,SessionLockOverlay,PinInOverlay}.tsx`, `routes/x+/_layout.tsx` |
| MES picking | Picking queue/detail with Scan/Pick/Short/Unpick; paste/scan tracked entity; finish-with-unpicked acknowledgement | `apps/mes/app/routes/x+/picking*.tsx`, `components/ShortPickModal.tsx` |
| MES inventory actions | Adjustment, scrap, issue, unconsume, location switch, print/labels; job operation material issue and serial selection | `apps/mes/app/routes/x+/{adjustment,scrap,issue,unconsume,location,print}.tsx`, `components/JobOperation/components/{IssueMaterialModal,SerialSelectorModal}.tsx` |
| Label printing | ZPL/PDF labels for entities, operations, storage units; print queue/select-printer modal | `apps/mes/app/routes/file+/`, `apps/erp/app/modules/inventory/ui/StorageUnits/StorageUnitsTable.tsx` (printer modal) |
| Batch/serial lookup | API routes that list batch and serial numbers for an item, feeding the pickers; label files come from the file routes above | `apps/mes/app/routes/api+/{batch-numbers,serial-numbers}.ts`, label routes; `packages/react` PrintButton |

### Dolibarr — barcode module and scan-into-inventory

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Barcode setup/generation | Barcode code init and print sheet pages | `htdocs/barcode/codeinit.php`, `printsheet.php`, `htdocs/admin/barcode.php` |
| Inventory scanning | **Update by scanning** opens a popup that accepts a list of scanned codes/quantities and updates real quantities; mode selector for barcode vs. batch | `htdocs/product/inventory/inventory.php` lines ~693, ~727–900 |
| Shipment barcode search | Barcode lookup for adding products to a shipment | `htdocs/expedition/ajax/searchfrombarcode.php` |
| Reception/shipment line batch fields | Batch/serial inputs on distribution screens; manual entry, no scanner-specific widget | `htdocs/reception/dispatch.php`, `htdocs/expedition/dispatch.php` |
| **Absent** handheld app | No mobile warehouse app in the checkout; scanning is form/popup based | verified by module directory |

### AureusERP / metasfresh — REST/mobile scan backends

| Screen/page | What it is | Key files |
| --- | --- | --- |
| AureusERP barcode labels | Barcode label printing on lots, packages and locations, and a barcode field on package types; there is no scanner app or scan-mode form in the inventories plugin | `.../Clusters/Products/Resources/LotResource/Tables/LotsTable.php`, `PackageResource/Tables/PackagesTable.php`, `Configurations/Resources/LocationResource/Tables/LocationsTable.php`, `PackageTypeResource/Schemas/PackageTypeForm.php` |
| metasfresh HU manager | Mobile HU app: resolve by QR code or ID, load/move/bulk-move HUs, change qty, print labels, manage profiles; the picking and inventory mobile apps each have their own scanned-code HU lookup | `backend/de.metas.handlingunits.mobileui/src/main/java/de/metas/handlingunits/` (`mobileui/{HUManagerMobileApplication,HUManagerRestController}.java`, `rest_api/{HandlingUnitsRestController,JsonGetByQRCodeRequest,JsonQRCodesGenerateRequest}.java`); picking `backend/de.metas.picking.rest-api/src/main/java/de/metas/picking/rest_api/json/JsonGetHUInfoByScannedCodeRequest.java`, inventory `backend/de.metas.inventory.mobileui/src/main/java/de/metas/inventory/mobileui/rest_api/json/JsonResolveHURequest.java` |
| metasfresh picking/inventory REST | Picking and inventory mobile workflows exchange JSON job/step/line models over REST | `backend/de.metas.picking.rest-api/src/main/java/de/metas/picking/rest_api/json/JsonPickingJob*.java`, `backend/de.metas.inventory.mobileui/src/main/java/de/metas/inventory/mobileui/rest_api/json/JsonInventoryJob*.java` |

**BOSS implications.** In the references scanning is an input mode, not a screen family. One option is a single client-side scan component (keyboard-wedge input plus camera where available) that resolves a code to product, location, package, lot/serial or shipment, with each task screen deciding what a valid scan means. Odoo's barcode nomenclature/rules and ERPNext's `scan_barcode` fields keep code parsing in shared configuration; Carbon's `TrackedEntityPicker` is the cleanest interaction for serialized/batch goods; metasfresh's QR/HU lookup is the model for package/location codes. On Mantle, the existing `FacilityServices.get#ScannedIdGeneral` (resolves a scan within a facility to `assetId`, `containerId`, `locationSeqId` or `productId`), `AssetServices.check#ScanLocation` (location, container ID or container serial) and `ShipmentServices.get#ShipmentProductByScan` already resolve codes, so screens need not parse them; GS1 parsing and a nomenclature setting would be new. Carbon MES and the metasfresh mobile apps give handheld work separate routes with large tap targets and no desktop tables; the existing `BasicHandheld/Warehouse` screens (§16) work as a parity checklist rather than a UI model.

---

## 13. Reports, valuation & audit

### Odoo

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Stock by Location | Quant report sliced by location/product/lot/package/owner; graph/pivot views | `odoo/addons/stock/views/stock_quant_views.xml` (`action_view_quants`, `view_stock_quant_pivot`, `stock_quant_view_graph`) |
| Moves Analysis | Stock move list/pivot/graph with valuation fields when `stock_account` is installed; filter by aging/intercompany | `odoo/addons/stock/views/stock_move_views.xml` (`stock_move_action`, `stock_move_menu`), `stock_account/views/stock_move_views.xml` |
| Forecasted Report | On-hand + incoming/outgoing timeline for a product/location | `odoo/addons/stock/views/stock_forecasted.xml`, `static/src/stock_forecasted/` |
| Traceability | Parent/child movement tree for a lot/serial/transfer | `odoo/addons/stock/report/stock_traceability.py`, `odoo/addons/stock/views/report_stock_traceability.xml` |
| Valuation Adjustments | Product value adjustment list/form (manager/no-one group) | `odoo/addons/stock_account/views/product_value_views.xml` (`product_value_list_action`, `valuation_adjustments_menu`) |
| Count sheet | Printable physical-inventory count sheet | `odoo/addons/stock/report/report_stockinventory.xml`; action `action_report_inventory` in `stock_report_views.xml` |
| Delivery/picking/package reports | Delivery slip, picking operations, batch picking, package contents, return slip, reception label | `odoo/addons/stock/report/stock_report_views.xml`, individual templates |
| Allocation report | Available/assigned/for/date lines with assign-all and label printing | `odoo/addons/stock/static/src/allocation_report/`, `report/stock_allocation_report.xml` |

### ERPNext

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Stock reports | 55 report folders in `erpnext/stock/report/`; key ones: Stock Balance, Stock Ledger, Stock Projected Qty, Stock Analytics, Stock Ageing, Warehouse Wise Stock Balance, Warehouse wise Item Balance Age and Value, Total Stock Summary, Item Shortage, Reorder Level, Reserved Stock, Product Bundle Balance, Landed Cost Report, COGS by Item Group | `erpnext/stock/report/` |
| Traceability/expiry | Serial No and Batch Traceability, Serial and Batch Summary, Serial No Ledger, Batch-Wise Balance History, Available Batch/Serial, Batch Item Expiry Status, Negative Batch, Serial No Status/Warranty/Service Contract Expiry | `erpnext/stock/report/` |
| Audit reports | Stock and Account Value Comparison, Stock Ledger Variance, Stock Ledger Invariant Check, Incorrect Balance Qty After Transaction, Incorrect Stock Value, Incorrect Serial No Valuation, Incorrect Serial and Batch Bundle, FIFO Queue comparison, Stock Qty vs Batch/Serial Count | `erpnext/stock/report/` |
| Stock Balance page | Fast on-screen summary by warehouse/item group | `erpnext/stock/page/stock_balance/` |
| Quick Stock Balance | Barcode/item + warehouse/date quantity and value | `erpnext/stock/doctype/quick_stock_balance/` |
| Stock Closing / Repost | Period closing and valuation repost tools with status/logs | `erpnext/stock/doctype/stock_closing_entry/`, `repost_item_valuation/` |

### Carbon

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Quantities / Movements | Operational stock and ledger tables; export; custom columns | `apps/erp/app/modules/inventory/ui/Inventory/InventoryTable.tsx`, `StockMovements/StockMovementsTable.tsx` |
| Inventory valuation | Valuation workbench with costing method, qty on hand/on hold/rejected, unit cost, total value, % of total, as-of date, group by location/item, GL tie-out and **Reconcile** | `apps/erp/app/modules/inventory/ui/Valuation/InventoryValuationWorkbench.tsx` |
| Activity feed | Human-readable ledger per item/entity with links to source documents | `apps/erp/app/modules/inventory/ui/Inventory/InventoryActivity.tsx`, `ledgerFeed.ts` |
| Traceability | Graph + table of lineage; expiry trace | `apps/erp/app/modules/inventory/ui/Traceability/` |
| Counts | Count history and posted adjustments | `apps/erp/app/modules/inventory/ui/InventoryCount/InventoryCountHistory.tsx`, `InventoryCount.tsx` |

### AureusERP

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Reporting cluster | Moves and Quantities resources with modal query-builder filters, grouping and export; no dedicated valuation/financial report | `plugins/webkul/inventories/src/Filament/Clusters/Reporting/` |
| Operation/move history | Per-operation and global move tables | `.../Clusters/Operations/Resources/OperationResource/Pages/ManageMoves.php`, `.../Clusters/Reporting/Resources/MoveResource/` |

### Dolibarr

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Movement list | Full stock ledger with configurable columns, filters and mass PDF generation | `htdocs/product/stock/movement_list.php` |
| Stock at date | Past/future stock snapshot with virtual stock and estimated values | `htdocs/product/stock/stockatdate.php` |
| Valuation | Warehouse valuation card + `htdocs/product/stock/valo.php` | `htdocs/product/stock/fiche-valo.php`, `valo.php` |
| Statistics | Per-module stats pages under `htdocs/product/stock/stats/`, `htdocs/expedition/stats/`, `htdocs/reception/stats/` | respective `stats/` dirs |
| Inventory/transfer lists | Inventory and stock-transfer lists with status/date filters | `htdocs/product/inventory/list.php`, `htdocs/product/stock/stocktransfer/stocktransfer_list.php` |

### metasfresh

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Generic reporting windows | Stock/valuation reports are backend windows or SQL views rendered by the generic shell; no dedicated React report page | `frontend/src/containers/`, `backend/de.metas.*` |
| Delivery planning sums | Planned/actual load/discharge totals in the document-list header | `frontend/src/components/deliveryPlanning/DeliveryPlanningViewHeader.js` |

**BOSS implications.** Warehouse reports in the references are mostly saved finds, not separate report engines. Candidates are Stock by Location, Stock Ledger/Movements, Availability/Forecast, Traceability, Count Variance and Receiving/Shipping History as find screens that can switch list/kanban/pivot/graph views (initial-design's switchable-views requirement), with export. Valuation is where the evidence favors a split: quantity and movement in Warehouse, value and GL tie-out in Accounting; Carbon's split (quantities vs. valuation workbench) is the cleanest example, and the baseline already files On Hand, Asset Valuation, Receipt Transactions and Status by Receipt under Accounting reports (§16). The Asset view entities (`AssetSummaryView`, `AssetLocationSummary`), `AssetDetail`, `AssetReceipt`, `AssetIssuance` and the shipment entities can feed these screens, with `InventoryReportServices.get#InventoryProjectedInfo` for the forecast; nothing found so far calls for materialized report tables. A candidate requirement is that audit views (who changed a quantity, which document posted it) are reachable from every stock row rather than buried in an admin report.

---

## 14. Settings & configuration

### Odoo — one Inventory settings page, plus per-operation-type configuration

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Inventory settings | Toggles/selects: product packs/package tracking, process transfers (batch/wave), partner-specific instructions, shipping policy, quality control + worksheet (upgrade), annual inventory day/month, barcode app + barcode database (upgrade), delivery connectors, stock fleet, delivery confirmation email/SMS, signature on delivery, product variants, UoM/packagings, full traceability (lots/serials), GS1 lot print, barcode separator, expiry dates, lots on delivery slip, owner-stored products, multi-location storage, own routes, replenishment horizon, dropshipping, MTO | `odoo/addons/stock/views/res_config_settings_views.xml` (settings groups, lines 28–193) |
| Operation type | Per-flow settings (reservation method, backorder default, lot creation policy, default locations, batch creation/grouping, print-on-validation) | `odoo/addons/stock/views/stock_picking_type_views.xml` (`view_picking_type_form`) |
| Warehouse | Per-warehouse reception/delivery steps, resupply, generated locations/types | `odoo/addons/stock/views/stock_warehouse_views.xml` (`view_warehouse`) |
| Company | Stock valuation method/accounts (when `stock_account` installed) | `odoo/addons/stock_account/views/res_config_settings_views.xml`, `product_views.xml` |

### ERPNext — Stock Settings and Delivery Settings

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Stock Settings | Item naming, default item group/UoM, valuation method, over-delivery/receipt allowance, quality-inspection actions when not submitted/rejected, show barcode field, clean description HTML, auto price-list rate, allow negative stock, auto indent, reorder email, stock freeze date/days/auth role, naming series, role allowed for backdated transactions, role allowed to over-deliver/receive, material-request allowance, update price-list rate, enable stock reservation, partial reservation, serial/batch selection policy, auto-create/auto-reserve serial-batch, and more | `erpnext/stock/doctype/stock_settings/stock_settings.json`, `stock_settings.js` |
| Delivery Settings | Dispatch template/attachment, send-with-attachment, stop delay | `erpnext/stock/doctype/delivery_settings/delivery_settings.json` |
| Stock Reposting Settings | Repost batch size/limits | `erpnext/stock/doctype/stock_reposting_settings/` |
| Putaway Rule / Warehouse Type / UoM | Operational masters used by receipts and capacity checks | `erpnext/stock/doctype/putaway_rule/`, `warehouse_type/`, `setup/doctype/uom/` |
| Workspace | Which cards/reports appear on the Stock workspace | `erpnext/stock/workspace/stock/stock.json` |

### Carbon — settings page plus configuration resources

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Inventory settings | Cards: **Kanban Output** (planning output), **Shelf life** (calculated input scope, near-expiry warning days, expired-entity policy Warn/Block/BlockWithOverride), **Finishing an incomplete pick** (policy), **Returning unused picked material** (policy) | `apps/erp/app/routes/x+/settings+/inventory.tsx`, `apps/erp/app/modules/settings/settings.models.ts` (`inventoryShelfLife`) |
| Storage Types / Storage Units / Storage Rules | Configuration resources, not global settings; rules can be scoped to work centers/surfaces | `apps/erp/app/modules/inventory/ui/StorageTypes/`, `StorageUnits/`, `StorageRules/` |
| Shipping Methods | Carrier, carrier account, tracking URL | `apps/erp/app/modules/inventory/ui/ShippingMethods/` |
| Batch properties | Per-item batch property definitions and ordering | `apps/erp/app/modules/inventory/ui/Batches/BatchPropertiesConfig.tsx`, `BatchPropertiesOrder` |
| Company settings | Shelf-life start event and calculated-input scope used by receipts | `apps/erp/app/components/Form/ShelfLifeStartEvent.tsx`, `modules/settings/settings.server.ts` |

### AureusERP — five settings pages, all plugin-scoped

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Warehouses settings | Enable locations, enable multi-step routes (turning locations off also turns routes off) | `.../Clusters/Settings/Pages/ManageWarehouses.php` |
| Operations settings | Enable packages, annual inventory day/month | `.../Clusters/Settings/Pages/ManageOperations.php` |
| Products settings | Enable variants, UoM, packagings | `.../Clusters/Settings/Pages/ManageProducts.php` |
| Traceability settings | Enable lots/serial numbers, display on delivery slips | `.../Clusters/Settings/Pages/ManageTraceability.php` |
| Logistics settings | Enable dropshipping (creates/removes the dropship operation type) | `.../Clusters/Settings/Pages/ManageLogistics.php` |
| Plugin settings cluster | Wrapper cluster/slugs for the above pages | `.../Pages/Settings/Manage*.php`, `Clusters/PluginSettings.php` |

### Dolibarr — module setup pages, mostly stock-calculation timing

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Stock setup | Decrease rules (on bill / validate order / shipment / shipment close), increase rules (supplier bill / validate order / reception / reception close / supplier dispatch), disallow negative transfer, must-be-enough guards, virtual horizon days, PDF model | `htdocs/admin/stock.php` |
| Stock transfer setup | Numbering model, extrafields | `htdocs/admin/stocktransfer.php` |
| Shipment setup | Numbering/PDF model, stock-entry-date display, earliest sell/eat-by preselect, free legal text, draft watermark, online signature, do-not-prefill quantity | `htdocs/admin/expedition.php` |
| Reception setup | Numbering/PDF model, free text, draft watermark | `htdocs/admin/reception_setup.php` |

### metasfresh — profile-driven mobile configuration

| Screen/page | What it is | Key files |
| --- | --- | --- |
| HU manager profiles | Profile/layout sections decide which actions/fields the handheld shows; profiles map per warehouse/user | `backend/de.metas.handlingunits.mobileui/src/main/java/de/metas/handlingunits/mobileui/config/{HUManagerProfile,HUManagerProfileLayoutSection,HUManagerProfileLayoutSectionList,HUManagerProfilesMap}.java` |
| Mobile application launchers | Workflow launcher parameters for picking/inventory apps (warehouse, workflow type, filters) | `backend/de.metas.picking.rest-api/src/main/java/de/metas/picking/workflow/lauchers/PickingWorkflowLaunchersProvider.java`, `backend/de.metas.inventory.mobileui/src/main/java/de/metas/inventory/mobileui/launchers/InventoryWorkflowLaunchersProvider.java` |
| Desktop settings | Backend/metadata windows; no dedicated React settings page | `backend/de.metas.*` |

**BOSS implications.** Where the references keep every choice on one global page, operational choices get buried; Odoo (per-operation-type configuration) and Carbon (configuration resources) split them by scope, and the evidence favors that. One possible split: organization defaults (valuation method, negative-stock policy, expiry policy, numbering) with organization or accounting settings; facility defaults (receiving/delivery steps, dock/staging/quarantine locations, putaway rules, capacity, and Mantle's existing `Facility` asset policy flags) on the facility record; role defaults (blind counts, over-receipt tolerance, allowed backdating) in authz/role configuration. Odoo keeps operation-type-style settings (reservation timing, lot creation policy, batch grouping, print-on-validation) on the workflow record, not on a user. Mantle puts reservation timing and the inventory facility on the store (`ProductStore.reservationOrderEnumId`, `reservationAutoEnumId`, `inventoryFacilityId`, `requireInventory`), a shared record that Commerce and Warehouse would both include; where it is edited is an open question (§17). The settings that change what a screen shows or which button is enabled, and so affect screen design itself: reservation timing, over-receipt/over-ship tolerance, lot/serial creation policy, expiry policy, blind-count default, backorder default, and which documents auto-print.

---

## 15. Cross-app surfaces

Warehouse includes the reused screens below, each in the form a warehouse-only business needs; other apps include the same screens with their own context (research-crosscut.md §3–§4). The screen identity is in the URL and the action set is in the app/role context. Counts & adjustments is a Warehouse screen that Accounting links to.

| Reused screen or link | Use in Warehouse | Other apps that include it | Reference evidence |
| --- | --- | --- | --- |
| **Inventory availability** | Full stock by facility → location → product → lot/serial, reservations, incoming and projected; adjust, move, count from a row. ATP from the one service family `AssetServices.get#AvailableInventory*` (context `productId`, `facilityId`, `locationSeqId`, `lotId`, as-of date) | Customer Service (availability and promise dates); Purchasing (shortfall and reorder); Sales (inline on quote/order lines); Manufacturing (component availability); Commerce (store availability) | Odoo quant list and per-move forecast widget (§5); ERPNext `Bin` and Stock Projected Qty (§5); Carbon item cards On Hand / On PO / On SO / On Jobs (§5) |
| **Shipment detail** | Receive, put away, pick, pack, ship, deliver, return, print and track labels, inspect, documents rail (context `shipmentId`, `shipmentTypeEnumId`, `facilityId`) | Customer Service and Sales (tracking and promise dates); Purchasing (inbound against PO); Commerce (online order fulfillment); Accounting (cost and invoice links) | Odoo one transfer form for receipts, deliveries and internal moves (§2); Carbon receipt/shipment documents rail (§2, §8); ERPNext Shipment (§8) |
| **Order detail** (sales and purchase) | Fulfillment action set: create shipment from an order part, reserve, pick, ship, see returns (context `orderId`, `orderPartSeqId`) | Sales (quotes, sales orders); Purchasing (purchase orders); Customer Service (changes, returns, cases); Accounting (invoices, payments); Commerce (online orders) | Carbon source-document seam (§2, §8); Odoo Next Transfer and Returns stat buttons (§2, §9); Moqui Sales order part has only a shipment-method drop-down (§7) |
| **Product 360** | Stock tab: quantities by facility/location/lot, default locations (`ProductFacilityLocation`), reorder levels (`ProductFacility`), movements | Products (master data, variants, prices, costs); Commerce (merchandising); Purchasing (supplier rows, lead times); Manufacturing (BOM, where-used); Accounting (cost history); Sales (price and availability) | Odoo product Stock action (§5); AureusERP product Quantities page (§5); Carbon per-item storage-unit breakdown (§5) |
| **Supplier 360** | Inbound receipts tab: open and past receipts, rejected quantities and reasons | Purchasing (terms, sourcing, performance); Accounting (AP balance, bills, payments); Products (supplier prices) | Carbon receipts list with supplier column (§2); ERPNext Purchase Receipt rejected qty (§2) |
| **Facility & equipment record** | Storage locations and setup: location types, putaway defaults, capacity, box types, printers, receiving/delivery steps | Maintenance (equipment register, maintenance history, facility tree); Manufacturing (production equipment, work centers); Commons (schedules and booking); Accounting (fixed-asset books) | Odoo warehouse and location forms (§11); Carbon storage units and rules (§11); AureusERP warehouse/location settings (§11); Ever Gauzy zones and bins (§11) |
| **Customer returns / RMA** | Return receipt and per-line disposition on a `ShpTpSalesReturn` shipment | Customer Service (authorization, reasons, case link); Accounting (credit/refund); Commerce (online returns) | Odoo Return/Exchange (§9); ERPNext `is_return` + `return_against` (§9); Carbon per-entity return (§9) |
| **Supplier returns** | Outbound return shipment `ShpTpPurchaseReturn` | Purchasing; Accounting (debit note) | Carbon shipment source Purchase Return Order (§9); ERPNext Purchase Return (§9) |
| **Quality inspection** | Inspection record and templates; receiving and returns inspection | Manufacturing (in-process and final inspection gates); Purchasing (supplier quality score) | ERPNext Quality Inspection with Incoming / Outgoing / In Process types (§4); Carbon ERP inspections and MES in-process inspection (§4) |
| **Carriers, ship methods, labels** | Carrier accounts, ship methods, box types, rating and label gateways | Commerce (which options and rates each store offers at checkout, `ProductStoreShipOption`) | Odoo delivery carrier form (§8); Carbon Shipping Methods (§8, §11) |
| **Request / case** | Internal stock requests (`RqtInventory`) | Customer Service, Purchasing, Maintenance, Projects, Sales, Commons (crosscut §3) | Mantle request type `RqtInventory`; see §17 open questions |
| **Counts & adjustments** (Warehouse screen, linked) | Count entry, variance review, posting | Accounting links to it for variance posting and GL read (`AssetAutoPostServices.post#PhysicalInventoryVariance`) | Carbon valuation workbench vs quantities split (§13); ERPNext Stock Reconciliation expense account (§6) |
| **Chatter & activities** | Timeline on receipts, shipments, counts and inspections | Every app's record screens (one component) | Odoo chatter on every transfer (§2) |
| **Dashboard widgets** | Warehouse landing page places the operation-type queue cards and KPI number cards | Insights (dashboards, widget builder); every app's landing page | ERPNext Stock workspace number cards and charts (§1) |

---

## 16. Current Moqui baseline (mr-marble / MarbleERP / Mantle)

The existing Moqui UI is a CRUD form set with good service coverage, not a warehouse UX: no work queue, no count review, no inspection, no mobile layout beyond the BasicHandheld screens. MarbleERP (`component/mr-marble/screen/marble.xml`) only mounts the SimpleScreens `Asset`, `Facility`, `Shipment`, `Shipping` and `Return` trees and has no warehouse screens of its own; `BasicHandheld/Warehouse` has an authz artifact group in `component/mr-marble/data/SimpleScreensSetupData.xml` but is not mounted by `marble.xml`. IronStone BOSS (`component/mr-boss/screen/`) has no warehouse screens yet. Form counts are from [ss-inventory.md](ss-inventory.md): Shipment 46, Shipping 34, Facility 18, Asset 65, Return 8, BasicHandheld 16. Service counts are from [usl-inventory.md](usl-inventory.md): Shipment 68 (`ShipmentServices` 39, `CarrierServices` 24, `ShipmentInfoServices` 5), `AssetServices` 45, Facility 15.

### Screens

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Find Shipment | **New Outgoing / New Incoming / New Transfer Shipment** (transfer sets `ShpTpTransfer` with origin and destination facility), shipment list | `component/mr-marble/screen/SimpleScreens/Shipment/FindShipment.xml` |
| Shipment Detail | Edit header, schedule, **Pick** scan form (`pickMove#ShipmentProduct`), **Pack** scan form (`pack#ShipmentProductScan`), add items, packages and contents, auto-packages, request/print/track/refund labels, receive entire shipment, ship, deliver, cancel; parties, content files, store emails, payments; assembly produce/consume | `component/mr-marble/screen/SimpleScreens/Shipment/ShipmentDetail.xml` |
| Receive item | Per product: quantity accepted, **quantity rejected**, rejection reason, lot number, manufactured date, serial, owner, pool, facility, location, container, status, acquire cost (`receive#ShipmentProduct`) | `component/mr-marble/screen/SimpleScreens/Shipment/ShipmentDetail/ReceiveItem.xml` |
| Item reserve / update asset | Reserve stock against a shipment item; change the asset on an item source | `component/mr-marble/screen/SimpleScreens/Shipment/ShipmentDetail/{ItemReserve,UpdateItemAsset}.xml` |
| Shipment items and packages | Items with pack, set packed/delivered, issuance and receipt lists per item source; packages with update, set shipped, print all labels, return label request, contents | `component/mr-marble/screen/SimpleScreens/Shipment/{ShipmentItems,ShipmentPackages}.xml` |
| Package tracking | Packages by tracking ETA | `component/mr-marble/screen/SimpleScreens/Shipment/PackageTracking.xml` |
| Printed documents | Pick sheet, pack sheet, shipment by package, insert | `component/mr-marble/screen/SimpleScreens/Shipment/{ShipmentPick,ShipmentPack,ShipmentByPackage,ShipmentInsert}.xml` |
| Shipping dashboard | **Pack Shipment** scan entry, **Facility Summary** (approved order quantity by facility, ship method, carrier, linking to orders); links to Picklists, Pick Location Moves, Move Assets | `component/mr-marble/screen/SimpleScreens/Shipping/dashboard.xml` |
| Pack Shipment | Pack items, pack packages, summary (scan, close package, print labels, set shipped), completed | `component/mr-marble/screen/SimpleScreens/Shipping/PackShipment.xml`, `PackShipment/{PackItems,PackPackages,PackSummary}.xml`, `PackShipment/PackSummary/PackCompleted.xml` |
| Picklists | Find/new picklist, **Bulk Picklist** (create picklists from approved orders), picklist detail (shipments, assignees, equipment, load status, complete/close, `Picklist.pdf`, `PicklistAndPackSheets.pdf`), add order/shipment, load pick and pick-and-pack sheets | `component/mr-marble/screen/SimpleScreens/Shipping/Picklist/{FindPicklist,BulkPicklist,PicklistDetail,AddOrder,AddShipment,ShipmentLoadPick,ShipmentLoadPickAndPack}.xml` |
| Pick Location Moves | Reserved stock that is not in a pick location, with the product's pick locations and quantities, to move into the pick face; Quick Move scan form | `component/mr-marble/screen/SimpleScreens/Shipping/PickLocationMoves.xml`, `PickLocationMoves/QuickMove.xml` |
| Asset dashboard and summary | Links to summary, assets, move, physical inventory, containers, lots, pools, on-hand report; Find Summary with **Receive Asset** (no shipment), **Physical Manual Change**, record quantity / record change dialogs | `component/mr-marble/screen/SimpleScreens/Asset/dashboard.xml`, `Asset/Asset/FindSummary.xml`, `Asset/Asset/FindSummary/{PhysicalQuantity,PhysicalChange}.xml` |
| Find / detail / move asset | Asset list and detail (reservations, detail history, audit log); select asset by scan, facility, location, container; move with scanned location | `component/mr-marble/screen/SimpleScreens/Asset/Asset/{FindAsset,AssetDetail,DetailHistory,SelectAsset,MoveAsset}.xml` |
| Physical inventory | List of physical inventory records; detail shows the `AssetDetail` variance rows it produced and lets the date be changed — there is no count-entry or review screen | `component/mr-marble/screen/SimpleScreens/Asset/PhysicalInventory/{FindPhysicalInventory,EditPhysicalInventory}.xml` |
| Containers, lots, pools | Containers (create, add assets, pick scan, move); lots; asset pools with parties and stores | `component/mr-marble/screen/SimpleScreens/Asset/Container/{FindContainer,EditContainer,MoveContainer}.xml`, `Asset/EditLots.xml`, `Asset/AssetPool/{FindAssetPool,EditAssetPool}.xml` |
| Facility | Find/edit facility (parent, type, owner, size, dates, address, asset policy flags, notes, child facilities, box types, location types), locations (area/aisle/section/level/position, type, capacity, sequence), products (min stock, reorder qty), box types, printable box types, carrier ship methods, calendar | `component/mr-marble/screen/SimpleScreens/Facility/{FindFacility,EditFacility,EditFacilityLocations,EditFacilityProducts,BoxTypes,PrintBoxTypes,CarrierShipMethods,FacilityCalendar}.xml` |
| Returns (RMA screens) | Find/create return and supplier return, edit return, items, add order items | `component/mr-marble/screen/SimpleScreens/Return/{FindReturn,EditReturn,EditReturnItems,AddOrderItems}.xml` |
| Inventory reports (Accounting) | On Hand and On Hand Summary, Receipt Transactions, Status by Receipt, Asset Valuation, Shipment Package Summary | `component/mr-marble/screen/SimpleScreens/Accounting/Reports/{AssetOnHand,AssetOnHandSummary,AssetReceiptTransaction,AssetStatusByReceipt,AssetValuation,ShipmentPackageSummary}.xml` |
| BasicHandheld Warehouse | Dashboard (active facility, scan anything via `get#ScannedIdGeneral`, pack shipment), receive asset by scan, select/move asset by scan, pick location moves; packing reuses the SimpleScreens Pack Shipment screens | `component/mr-marble/screen/BasicHandheld/Warehouse.xml`, `BasicHandheld/Warehouse/{dashboard,Shipping}.xml`, `BasicHandheld/Warehouse/Asset/{ReceiveAsset,SelectAsset}.xml`, `BasicHandheld/Warehouse/Shipping/PickLocationMoves.xml` |

### Data model available

| Entity / enum | What it gives Warehouse | Key files |
| --- | --- | --- |
| `Shipment` | `shipmentTypeEnumId` (`ShpTpIncoming` → `ShpTpPurchase`, `ShpTpSalesReturn`; `ShpTpOutgoing` → `ShpTpSales`, `ShpTpPurchaseReturn`; `ShpTpDrop`, `ShpTpTransfer`), status `ShipInput` → `ShipScheduled` → `ShipPicked` → `ShipPacked` → `ShipShipped` → `ShipDelivered` (+ `ShipRejected`, `ShipCancelled`, un-pick/un-pack/un-ship transitions), from/to party, priority, ship-after/before and estimated dates, `pickContainerId`, `shipWorkEffortId` / `receiveWorkEffortId` (picklist and receiving work), `binLocationNumber`, handling instructions | `component/mr-mantle/entity/ShipmentEntities.xml` |
| `ShipmentItem`, `ShipmentItemSource` | Expected quantity per product; per source line the order item or return item, `quantity`, `quantityPicked`, `quantityNotHandled`, status, bin, invoice link | same |
| `ShipmentPackage`, `ShipmentPackageContent`, `ShipmentPackageRouteSeg`, `ShipmentBoxType`, `CarrierShipmentBoxType` | Packages (box type, weight), contents, per-package tracking code/URL/status, label, return label, gateway IDs and amounts; box sizes | same |
| `ShipmentRouteSegment`, `Delivery` | Origin/destination facility and address, carrier, ship method, costs, master tracking; `Delivery` (vehicle `assetId`, origin/destination facility, start/end mileage, fuel) via `deliveryId` | same |
| `CarrierShipmentMethod`, `ShippingGatewayConfig`, `ShippingGatewayCarrier`, `ShippingGatewayMethod`, `ShippingGatewayBoxType`, `ShippingGatewayOption` | Carrier ship methods and rating/label gateway configuration | same |
| `ShipmentParty`, `ShipmentContent` | Parties by role; attached files | same |
| `Asset`, `AssetDetail`, `AssetReservation`, `AssetReceipt`, `AssetIssuance` | Stock unit per product/facility/location/lot/container/owner/status (`AstAvailable`, `AstOnHold`, `AstQuarantine`, `AstDefective`, `AstInTransfer`, `AstReturned`, …) with `serialNumber`, `expectedEndOfLife`; `AssetDetail` is the quantity ledger (shipment, receipt, issuance, physical inventory, `varianceReasonEnumId`); receipts carry `quantityAccepted`, `quantityRejected`, `rejectionReasonEnumId` (`Arj*`), shipment, order and return links | `component/mr-mantle/entity/ProductAssetEntities.xml` |
| `Lot`, `Container`, `AssetPool` | Lot number, manufacturer, manufactured and expiration dates; containers (shelf bin, pallet sizes) with facility and location; asset pools by party and store | same |
| `PhysicalInventory`, `PhysicalInventoryCount`, `InventoryVarianceReason` | Count header (date, facility, party, status `PIInPlanning` → `PIInProgress` → `PIInValidation` → `PIComplete`), count lines (location, product, lot, count date, quantity on hand), reasons Lost, Stolen, Found, Damaged, Integration, Sample, Mis-shipped ± | same |
| `AssetSummaryView`, `AssetLocationSummary` (view entities) | Grouped on-hand and ATP by product, facility, location, lot, container | `component/mr-mantle/entity/ProductAssetViewEntities.xml` |
| `Facility`, `FacilityLocation`, `FacilityLocationType`, `FacilityBoxType`, `FacilityPrinter`, `FacilityGroup` | Facility hierarchy and types (`FcTpWarehouse`, `FcTpDock`, …), asset policy flags, `defaultDaysToShip`; locations with area/aisle/section/level/position, type (`FltPick`, `FltBulk`, `FltReceiving`, `FltStaging`, `FltQuarantine`, `FltMorgue`), capacity + UOM, pick sequence; per-facility location types with `autoStatusId`; printers by purpose | `component/mr-mantle/entity/FacilityEntities.xml` |
| `ProductFacility`, `ProductFacilityLocation` | Per product and facility: minimum stock, reorder quantity, days to ship; default locations with minimum stock and move quantity | same |
| `ProductStore` reservation settings, `ProductStoreShipOption` | `reservationOrderEnumId` (`AsResOrdFifoRec`, `AsResOrdLifoRec`, `AsResOrdFifoExp`, `AsResOrdLifoExp`, cost-based, `AsResOrdNoRes`), `reservationAutoEnumId`, `inventoryFacilityId`, `requireInventory`; store ship options with markup | `component/mr-mantle/entity/ProductStoreEntities.xml` |
| `WorkEffort` purposes `WepShipmentShip`, `WepShipmentReceive` | Picklist / shipment load and receiving work with assignees (`WorkEffortParty`) and equipment (`WorkEffortAssetAssign`) | `component/mr-mantle/entity/WorkEffortEntities.xml` |
| `ReturnHeader`, `ReturnItem` | The RMA record that a return shipment receives against | `component/mr-mantle/entity/OrderEntities.xml` |

Missing from the data model: an inspection record (header, characteristics, readings, disposition), inspection templates, putaway rules by category or storage type, a shipping-dock location type, an expiry policy, a count snapshot for conflict detection, and storage-fee or owner-stock history.

### Services

| Service | Purpose | Key files |
| --- | --- | --- |
| `create#Shipment`, `create#OrderPartShipment`, `add#OrderPartToShipment`, `ship#OrderPart`, `create#ShipmentItem`, `ensure#ShipmentItemQuantityRemaining` | Create outbound and inbound shipments from orders | `component/mr-mantle/service/mantle/shipment/ShipmentServices.xml` |
| `receive#ShipmentProduct`, `receive#EntireShipment` | Receive with accepted/rejected quantity, reason, lot and expiry | same |
| `pickMove#ShipmentProduct`, `pickMove#ProductToContainer`, `get#ShipmentProductByScan`, `pack#ShipmentProductScan`, `pack#ShipmentProduct`, `pack#ShipmentItemSource`, `unpack#ShipmentItemIssuance`, `complete#ShipmentPack`, `pack#Shipment`, `ship#Shipment`, `deliver#Shipment`, `cancel#Shipment` | Pick, pack, ship, deliver | same |
| `create#ShipmentPackage`, `add#ItemToPackage`, `create#ShipmentAutoPackages`, `get#ShipmentPackageWeight`, `print#ShipmentLabels` | Packages and labels | same |
| `get#ShippingRate`, `get#ShipmentRates`, `request#ShipmentLabels`, `track#ShipmentLabels`, `refund#ShipmentLabels`, `validate#PostalAddress` | Carrier rating, labels and tracking through gateways | `component/mr-mantle/service/mantle/shipment/CarrierServices.xml` |
| `get#ShipmentDisplayInfo`, `get#ShipmentPickPackInfo`, `get#ShipmentLoadPickInfo` | Display and pick/pack sheet data | `component/mr-mantle/service/mantle/shipment/ShipmentInfoServices.xml` |
| `create#ShipmentLoadShip`, `add#ShipmentToShipmentLoad`, `create#ShipmentLoadsForOrders`, `complete#ShipmentLoadShip`, `close#ShipmentLoadShip` | Picklists / waves | `component/mr-mantle/service/mantle/work/ShipmentWorkServices.xml` |
| `get#AvailableInventory`, `get#AvailableForOrder`, `get#AvailableInventoryMulti` | Available-to-promise totals | `component/mr-mantle/service/mantle/product/AssetServices.xml` |
| `reserve#AssetsForOrder`, `move#ReservationsFromNonPickLocations`, `check#FacilityReservations`, `issue#AssetReservation`, `issue#Asset` | Reservation and issuance | same |
| `receive#Asset`, `move#Product`, `move#Asset`, `check#ScanLocation`, `change#AssetQuantity` | Receipts without a shipment, moves, scan check | same |
| `record#PhysicalInventoryQuantity`, `record#PhysicalInventoryChange`, `update#PhysicalInventoryDate` | Apply a counted quantity or a change immediately, with variance reason | same |
| `get#InventoryProjectedInfo` | Incoming, outgoing and projected quantities (search documents over assets, order items, production runs, estimates) | `component/mr-mantle/service/mantle/product/InventoryReportServices.xml` |
| `get#ScannedIdGeneral`, `create#FacilityLocation` | Scan resolution; location creation | `component/mr-mantle/service/mantle/facility/FacilityServices.xml` |
| `post#AssetReceipt`, `post#AssetIssuance`, `post#PhysicalInventoryVariance` | GL posting of receipts, issuances and count variances (used by Accounting) | `component/mr-mantle/service/mantle/ledger/AssetAutoPostServices.xml` |
| `create#ReturnShipment`, `add#ReturnToShipment`, `receive#ReturnShipmentItems`, `receive#ReturnWithoutShipment`, `receive#ReturnItem`, `returnAndResell#Shipment` | Return receiving | `component/mr-mantle/service/mantle/order/ReturnServices.xml` |

Tests that exercise these flows: `component/mr-mantle/test/{ShipmentPick,ShipmentLoads,ShipmentReturnMisc,AssetReservationMisc,CarrierServices}.spec.js`.

---

## 17. Gaps & BOSS implications

### Gaps in the reference set

| Gap | Evidence | Consequence for BOSS |
| --- | --- | --- |
| No Moqui-native warehouse UI among the Moqui components | Moqui Sales has accounts, contacts, opportunities, orders, agreements and a task editor (`3p_moqui/Sales/screen/Sales/`); ridgecrest only imports a marketplace fulfillment center's orders, returns and stock (§6); WorkManagement, WeCreate, coarchy and resistmanagement have none | Screen evidence comes from the ERP references, with the SimpleScreens forms as the parity list |
| Odoo community lacks quality inspection and the scanner app | Settings show `module_quality_control` and `module_stock_barcode` as upgrade booleans (`odoo/addons/stock/views/res_config_settings_views.xml`); no `quality*` or `stock_barcode` addon in the checkout; the 3PL industry package depends on Enterprise `quality_control` | ERPNext is the evidence for the inspection document, Carbon for inspection and handheld UX |
| AureusERP has no count document, inspection UI or carrier integration | No count, quality or carrier resource in the inventories plugin; `ReturnSlipAction` has an empty action body; Replenishment form and table are empty (§6, §9) | Useful for its operation and quantity screens only |
| Dolibarr has no returns-receiving document or inspection UI | No return or quality module in `htdocs/` (§4, §9) | Returns and quality evidence comes from ERPNext and Carbon |
| metasfresh desktop is metadata-driven | `frontend/src` has generic list/master containers and a delivery-planning header; warehouse work is in backend mobile apps (§1, §12) | Useful for handling-unit and mobile workflow concepts, not screen layout |
| ERPNext has no handheld app | Scanning is a field on Desk forms (§12) | ERPNext offers no mobile-route model; Carbon MES is the reference |
| Ever Gauzy's warehouse and inventory plugins have no screens | Plugins expose REST/GraphQL only; the inventory pages cover warehouses and quantities (§11) | Useful as a data-model and rules checklist (zones, waves, short picks, count modes) |
| Non-conformance and corrective action are thin | Only ERPNext `Non Conformance` / Quality Action (no link to an inspection) and Carbon Issues with required actions (§4); Odoo quality is Enterprise | Little evidence to design NCR/CAPA from; it depends on the inspection record existing first |
| Carbon is AGPL-3.0 | Every source file carries an `AGPL-3.0-only` SPDX header | Behavioral reference only; its code cannot be copied |
| No reference combines equipment maintenance with location setup | Odoo `stock_maintenance` only opens a lot from an equipment form; ERPNext and Dolibarr warehouses are stock-only | No reference shows how one reused Facility record serves both storage setup (Warehouse) and the equipment register (Maintenance); the design pass works this out without a model |

### Notable gaps in the Moqui baseline

- **No warehouse home or work queues.** The Shipping dashboard's Facility Summary is the only queue-like view; no operation-type cards with ready / waiting / late counts.
- **No count-then-post.** `record#PhysicalInventoryQuantity` applies the variance at once; no screen or service creates `PhysicalInventoryCount` rows (the record service only updates one when given its ID) or moves a count through the `PI*` status flow; no blind count, variance review, conflict check or cycle-count schedule.
- **No inspection.** No entity, template or screen; only `AssetReceipt.quantityRejected` + reason on the receive form.
- **No put-away rules beyond default product locations.** `ProductFacilityLocation` gives per-product locations; no category/storage-type rule, and `FacilityLocation.capacity` is not checked by any service.
- **No expiry policy or posting gate.** `Lot.expirationDate` and FEFO reservation order (`AsResOrdFifoExp`) exist, but the shipment and asset services never read `expirationDate` (checked by grep of `ShipmentServices.xml` and `AssetServices.xml`), so near-expiry warnings and expired-lot blocks are new.
- **No pick line state or short-pick flow.** `quantityPicked` and `quantityNotHandled` exist on `ShipmentItemSource`; there is no picker screen with to-pick / picked / short and acknowledgement.
- **No traceability view.** The data (`AssetReceipt`, `AssetIssuance`, `AssetDetail`, lots, serials) is there; no lineage screen.
- **No modern mobile layout.** BasicHandheld screens are scan forms on desktop widgets.
- **No internal bin-to-bin transfer document.** Moves are immediate (`move#Asset`, `move#Product`); facility-to-facility transfer is a `ShpTpTransfer` shipment.
- **No carrier rating UI beyond gateway setup.** Rating and labels are service-level; ship-method setup is on the Facility screens.

### What each reference contributes

| Reference | Take |
| --- | --- |
| Odoo | Operation-type card board as the landing page; one transfer form for receipts, deliveries and internal moves; backorder dialog; multi-step routes and putaway rules; count conflict resolution and Request a Count; package types and Put in Pack; delivery carrier with rule-based pricing; lot/serial stat buttons and traceability walk; 3PL industry: owner stock, storage fees and customer stock portal |
| ERPNext | Quality Inspection document with templates, readings and Incoming / Outgoing / In Process types; rejected qty and rejected warehouse on receipts; Pick List with reserve/unreserve; Stock Reconciliation purposes; Shipment with parcels and Delivery Trip; KPI number cards; scan modes on forms |
| Carbon (ERP and MES) | Source-document picker; hard posting gates (tracking, expiry, rules); count Draft → Pending → Posted with blind counting; picking list line states and short-pick acknowledgement; bin-to-bin vs warehouse transfers; inspection measurement grid and lot disposition; expiry trace and policy; lineage graph; MES picking queue and in-process inspection |
| AureusERP | Same operation-type board in a simpler stack; return modal bounded by original quantities; per-plugin settings pages (warehouses, operations, traceability, logistics) |
| Dolibarr | Reception/shipment distribution tabs with fill/reset; inventory sheet with "update by scanning"; mass stock movement with CSV import; stock-calculation timing settings |
| metasfresh | Handling-unit moves and QR lookup; profile-driven handheld configuration; mobile picking and inventory jobs with step events |
| Ever Gauzy | Zone kinds and bin tree; waves, pick lists derived from shipments, short pick as a stock correction; pack slips and carrier manifests; count modes (full, cycle, spot, recount) |
| ridgecrest | External fulfillment-center stock import through `record#PhysicalInventoryQuantity`; a three-step upload wizard |
| Moqui Sales | Order detail that supplies lines; confirms no fulfillment UI to reuse |
| Moqui baseline | All shipment, reservation, pick/pack, carrier, count and scan services; picklists as `WepShipmentShip` work efforts; location types incl. quarantine with auto status; BasicHandheld and SimpleScreens forms as the parity list |

### Candidate screen inventory (IronStone Warehouse)

Screens the research points to for a warehouse audience, including the reused screens a warehouse-only business needs. Input to design, not a design.

| Area | Screens |
| --- | --- |
| Home | Warehouse landing page: operation-type cards (Receipts, Put-away, Picking, Packing, Shipping, Returns, Transfers, Counts, Inspections) with ready / waiting / late / backorder counts, each opening a pre-filtered list; KPI number cards **(reused: Dashboard widgets, every app's landing page and Insights)** |
| Receiving | Receipt list (incoming, purchase, transfer receipts); **Shipment detail** receiving version with source-document picker, receive lines (accepted / rejected / reason / lot / expiry), backorder on close, inline Inspect **(reused: Warehouse, Customer Service, Sales, Purchasing, Commerce, Accounting)**; inbound receipts on **Supplier 360** **(reused: Purchasing, Accounting, Products, Warehouse)**; put-away list from receiving and staging locations |
| Inspection | Inspection list and inspection record (characteristics, samples, readings, accept/reject, disposition to quarantine); inspection templates **(reused: Warehouse, Manufacturing, Purchasing)** |
| Inventory | **Inventory availability** by facility/location/product/lot with reserved, available, incoming **(reused: Warehouse, Customer Service, Purchasing, Sales, Manufacturing, Commerce)**; stock tab on **Product 360** **(reused: Products, Commerce, Purchasing, Manufacturing, Warehouse, Accounting, Sales)**; movement ledger; adjust/move dialogs with reason; containers; lots and serials with traceability |
| Counts | Count list; count document (scope, blind option, assignee); count entry (desktop and handheld); variance review and post; conflict dialog |
| Transfers & requests | Bin-to-bin move (quick, scan); facility-to-facility transfer as a `ShpTpTransfer` **Shipment detail** with ship and receive; internal stock requests (`RqtInventory`) **(reused: Request / case, per crosscut §3)** |
| Picking | Picklist / wave list and detail over `WepShipmentShip`; picker screen with to-pick / picked / short, scan, finish acknowledgement; pick-face replenishment (Pick Location Moves) |
| Packing & shipping | Pack station (packages, box type, weight, contents, scan); ship (carrier, method, rate, labels, tracking, manifest); **Order detail** fulfillment version **(reused: Sales, Purchasing, Customer Service, Warehouse, Accounting, Commerce)** |
| Returns receiving | Return receipt on a `ShpTpSalesReturn` shipment with per-line disposition **(reused: Customer Service, Warehouse, Accounting, Commerce)**; supplier return shipment **(reused: Purchasing, Warehouse, Accounting)** |
| Locations & facility setup | Storage locations and setup on the **Facility & equipment record** **(reused: Maintenance, Warehouse, Manufacturing, Commons, Accounting)**: location types, locations, putaway defaults, capacity, box types, printers; carriers and ship methods **(reused: Warehouse, Commerce)** |
| Handheld | Mobile routes: scan home, receive, put away, pick, pack, move, count |
| Reports | Saved finds: stock by location, movements, availability/forecast, count variance, receiving and shipping history, traceability; link to valuation reports |
| Settings | Warehouse settings section (count defaults, tolerances, lot/expiry policy, auto-print); store reservation settings (`ProductStore`, a shared record also included in Commerce) |

### Data-model findings

- **Fit as is:** `Shipment` / `ShipmentItem` / `ShipmentItemSource` for every receipt, transfer, shipment and return; `ShipmentPackage`, `ShipmentPackageContent`, `ShipmentPackageRouteSeg`, `ShipmentRouteSegment`, `Delivery`, `CarrierShipmentMethod`, `ShippingGateway*` for packing and carriers; `Asset`, `AssetDetail`, `AssetReservation`, `AssetReceipt`, `AssetIssuance`, `Lot`, `Container` for stock and tracking; `Facility`, `FacilityLocation`, `FacilityLocationType`, `ProductFacility`, `ProductFacilityLocation` for locations; `WorkEffort` `WepShipmentShip` / `WepShipmentReceive` for picklists and receiving work; `PhysicalInventory` + `PhysicalInventoryCount` for counts.
- **Existing fields that no screen uses yet:** `PhysicalInventory` status flow and `PhysicalInventoryCount` lines (count entry and review); `FacilityLocation.capacity`; `FacilityLocationType.autoStatusId` with `FltQuarantine` for disposition; `ShipmentItemSource.quantityPicked` / `quantityNotHandled` for pick line state.
- **Where new records look necessary:** inspection header (source shipment item source or asset, lot, inspector, status, accepted/rejected quantity, disposition) with characteristic readings and templates; putaway rule (product category or storage type → location type or location, priority); count snapshot of expected quantity per line for conflict detection; expiry policy settings (near-expiry days, warn / block / block-with-override). Possibly also storage-fee history for owner stock (Odoo 3PL) and a shipping-dock location type.
- **Already covered by Mantle:** warehouse, bin, lot/serial, stock-balance and picklist needs map onto the records above, so no separate table for any of them appears necessary.

### Sequencing notes

- **Cheap because the baseline has it:** receiving with accepted/rejected/lot/expiry (`receive#ShipmentProduct`, `receive#EntireShipment`, the Receive item form); put-away as moves from receiving locations (`move#Asset`, `Flt*` location types); Inventory availability and the movement ledger (`get#AvailableInventory*`, `AssetSummaryView`, `AssetLocationSummary`, `AssetDetail`); adjust and move dialogs with variance reason; picklists over the existing `WepShipmentShip` work efforts and `ShipmentWorkServices`; pack and ship with the existing carrier services; return receipt and disposition (`ReturnServices`, `FltQuarantine`); the storage setup on the Facility record (the SimpleScreens Facility forms already edit locations, types and box types); handheld receive, pick and move (`get#ScannedIdGeneral`, `check#ScanLocation`, BasicHandheld as the parity list).
- **Screen work over existing records:** count-then-post needs a count document over `PhysicalInventory`/`PhysicalInventoryCount` and either a deferred mode for `record#PhysicalInventoryQuantity` or a count-post service (open question below); the picker line state uses `quantityPicked` / `quantityNotHandled`.
- **Depends on new records:** inspection templates and measurement grids need the inspection record (without it, the receipt can still record accept/reject with reason on `AssetReceipt`); category putaway rules need the putaway-rule record; count conflict detection needs the count snapshot; expiry posting gates need the expiry policy and a service that reads `Lot.expirationDate`; storage-fee billing needs fee history.
- **Expensive or reference-thin:** capacity enforcement (no service checks `FacilityLocation.capacity`), waves with automatic batching rules, the traceability graph, multi-step routes, delivery trips, and NCR/CAPA (which depends on the inspection record and has the thinnest evidence).
- **Settings first:** the settings listed in §14 (reservation timing, tolerances, lot/serial and expiry policy, blind-count and backorder defaults, auto-print) change which fields and buttons each task screen shows, so screen design depends on them.

### Open questions

- **A further quality function.** Crosscut §4 lists inspection as reused by Warehouse (record, templates, receiving and returns inspection), Manufacturing (in-process and final gates) and Purchasing (supplier scores); crosscut §8 asks whether a further quality function for templates, non-conformance and corrective action is needed. Carbon's quality module (Inspections, Issues, Gauges, Document Control) suggests it may be; where inspection templates are edited follows from that answer.
- **Inspection record scope.** Is a full inspection record needed, or do `AssetReceipt` rejected quantity and reason plus a quarantine location cover receiving inspection on their own?
- **Counts: extend `record#PhysicalInventoryQuantity` or add a count-post service?** The current services post immediately; a review step needs either a deferred mode or a new service that posts `PhysicalInventoryCount` lines.
- **Where reservation timing is edited.** Mantle keeps reservation order and auto-reservation on `ProductStore`, a record Commerce and Warehouse would both include; a warehouse-only business may have no store. Edit it on the store from both apps, or add a facility default?
- **Internal stock requests.** Crosscut §3 lists Warehouse among the apps that include the **Request / case** screen for internal stock requests (`RqtInventory`); is that one request screen with a Warehouse context (ERPNext Material Request style), and how does it relate to Purchasing's purchase requests?
- **External fulfillment (3PL) stock sync.** ridgecrest shows a real need to import a marketplace fulfillment center's stock and orders; is that a Warehouse screen, an Admin integration, or a screen both include?

### Checkout path quirks

- **Odoo** `stock_picking_batch` is merged into `stock` in this checkout (`odoo/addons/stock/views/stock_picking_batch_views.xml`); quality and barcode add-ons are absent even though settings reference them.
- **ERPNext** workspace JSON is `erpnext/stock/workspace/stock/stock.json`; Repost Item Valuation is a doctype (`erpnext/stock/doctype/repost_item_valuation/`), not a report.
- **Carbon** inventory UI is under `apps/erp/app/modules/inventory/ui/`, but route components live under `apps/erp/app/routes/x+/…`; some "screens" are route files that delegate to API actions. Receipt line routes are `lines.update.tsx` and `lines.tracking.tsx` (no `$id` segment).
- **AureusERP** settings pages subclass base pages in `Clusters/Settings/Pages/`; `ReturnSlipAction` is a stub.
- **metasfresh** mobile classes are split across modules: locator and HU resolution for counting live in `de.metas.inventory.mobileui`, not `de.metas.handlingunits.mobileui`; the picking launcher package is spelled `lauchers`.
- **Moqui baseline** `BasicHandheld` is a sibling of `SimpleScreens` (`component/mr-marble/screen/BasicHandheld/`), and the Asset view entities are in `component/mr-mantle/entity/`, not `mr-mantle`.

**Bottom line.** The reference set is strong on receiving, picking, counts and stock visibility, weaker on inspection and returns in the community checkouts, and has no Moqui-native warehouse UI. Mantle already carries nearly all of the data and posting logic, including picklists, rejected receipt quantities, quarantine locations and count records that no screen uses yet. The evidence favors screens built around `Shipment` + `Asset` + `PhysicalInventory`, with Carbon's operator flows (counts, picking, posting gates, traceability) and Odoo's queue and configuration structure as the strongest UI references and ERPNext's inspection document as the data reference; the new data the research points to is limited to the inspection record, putaway rules, count snapshots and expiry policy.
