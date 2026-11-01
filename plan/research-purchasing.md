# IronStone BOSS — Purchasing app research

Oct 18, 2026

Reviewed against sources Oct 18, 2026; follows [research-crosscut.md](research-crosscut.md).

Deeper research pass on screens/pages relevant to **IronStone Purchasing** (buyers:
Suppliers · Purchase requests · RFQs & supplier quotes · Purchase orders · Replenishment ·
Supplier returns · Supplier performance, per [initial-design.md](initial-design.md)),
cataloguing every relevant screen found in the reference apps. Companion to
[3p-app-reference.md](3p-app-reference.md). Purchasing is the fullest version of the
reused **Supplier 360** and includes the purchase-order actions of the reused **Order
detail**. It also includes, in a buyer's form, the reused **Product 360** (supplier
prices), **Inventory availability** (shortfall and reorder), **Shipment detail**
(receiving against PO, supplier-return shipments), **Request / case** (purchase requests),
supplier returns, supplier invoice match exceptions and **Approvals waiting** (PO and
request approvals), per crosscut §3–§4, so that a business running only Purchasing can
source, order, receive, return and match.

**Organization.** Sorted by functional area (not by app): all supplier master screens
together, all RFQ screens together, etc. Within each area, sub-tables per reference app.
Each area ends with **BOSS implications**.

**Scope.** Screens a buyer uses from requisition through supplier invoice handoff,
including the reused screens a buyer needs. Receiving execution and inspection are
researched in depth in the Warehouse pass and payables/3-way match in the Accounting pass;
this file records the buyer's version of those reused screens (receiving, supplier
returns, match exceptions) and the evidence for them, not their full inventory.

**Path conventions.** Every backticked path resolves against the checkout for its prefix
(crosscut §1). Checkouts are under `/home/jonesde/work/moquiwork/`:

| Prefix | Checkout | Paths start with |
| --- | --- | --- |
| **Odoo** | `3p_other/odoo` | `odoo/addons/<addon>/…` for apps (`purchase`, `purchase_stock`, `purchase_requisition`, `purchase_alternative`, `stock`, `product`, `account`, …); `odoo/odoo/addons/base/…` for core |
| **ERPNext** | `3p_other/frappe/erpnext` | `erpnext/<module>/…` (`erpnext/buying/`, `erpnext/stock/`, `erpnext/accounts/`, `erpnext/setup/`, `erpnext/templates/`); screens are metadata-driven (DocType JSON + form JS + workspace/report JSON) |
| **Carbon** | `3p_other/carbon` | `apps/erp/app/{modules,routes}/…` (module `apps/erp/app/modules/purchasing/`, routes `apps/erp/app/routes/x+/…`), `packages/…` |
| **AureusERP** | `3p_other/aureuserp` | `plugins/webkul/<plugin>/src/Filament/…` (mainly `plugins/webkul/purchases/`) |
| **Dolibarr** | `3p_other/dolibarr` | `htdocs/<module>/…`; module descriptors under `htdocs/core/modules/` |
| **metasfresh** | `3p_other/metasfresh` | `frontend/src/…` (generic React WebUI), `backend/de.metas.<module>/…` (windows defined by SQL migrations, processes in Java) |
| **Akaunting** | `3p_other/akaunting` | `resources/views/…`, `app/…` |
| **Ever Gauzy** | `3p_other/ever-co/ever-gauzy` | `apps/gauzy/src/app/pages/…`, `packages/…` |
| **Moqui baseline** | `mr-moqui-base/runtime` | `component/mr-marble/screen/SimpleScreens/…`, `component/mr-marble/screen/…`, `component/mr-mantle/entity/…`, `component/mr-mantle/service/mantle/…`, `component/mr-boss/screen/…` |

**Not used here:** Moqui Sales and Moqui WorkManagement (sales order and project modules
only), resistmanagement (a MarbleERP-style flow dashboard that links the SimpleScreens
purchasing screens, nothing new), ridgecrest (storefront), Dolibarr community modules
(e-invoicing, gateways), Twenty (CRM only), Nextcloud, Zimbra, Signal (groupware only).
Ever Gauzy ships only a vendor register, no procure-to-pay flow.

Sections: [1 landing & navigation](#1-purchasing-landing--navigation) · [2 suppliers](#2-suppliers) · [3 requests, requisitions & demand](#3-purchase-requests-requisitions--demand) · [4 rfqs & supplier quotes](#4-rfqs--supplier-quotes) · [5 purchase orders & agreements](#5-purchase-orders--agreements) · [6 replenishment & forecasting](#6-replenishment--forecasting) · [7 receiving & supplier returns](#7-receiving--supplier-returns) · [8 supplier invoices & 3-way match](#8-supplier-invoices--3-way-match) · [9 supplier performance & reporting](#9-supplier-performance--reporting) · [10 settings & configuration](#10-settings--configuration) · [11 cross-app surfaces](#11-cross-app-surfaces) · [12 Moqui baseline](#12-current-moqui-baseline-mr-marble--marbleerp--mantle) · [13 gaps & BOSS implications](#13-gaps--boss-implications)

---

## 1. Purchasing landing & navigation

### Odoo — Purchase app

Odoo's purchasing surface is one app with nested menus: Orders (Requests for Quotation,
Purchase Orders, Vendors, plus Purchase Agreements when `purchase_requisition` is
installed), Products, Reporting (managers) and Configuration. Status is a form status
bar, and the main "new" action is *New RFQ*, not *New PO* — an RFQ becomes a PO.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Purchase app root / menu tree | App menus: Orders (RFQs, Purchase Orders, Vendors), Products, Reporting, Configuration (Vendor Pricelists, product attributes/categories/units, Settings) | `odoo/addons/purchase/views/purchase_views.xml` |
| RFQ list KPI dashboard | Cards: New, RFQ Sent, Late RFQ, Not Acknowledged, Late Receipt, Days to Order, with All and My rows and priority-star counts; purchase_stock adds OTD | `odoo/addons/purchase/static/src/views/purchase_dashboard.xml`, `odoo/addons/purchase/static/src/views/purchase_listview.xml`, `odoo/addons/purchase/views/purchase_views.xml` |
| RFQ/PO kanban | Kanban cards with vendor, amount, status, activity, KPI strip | `odoo/addons/purchase/static/src/views/purchase_kanbanview.xml`, `odoo/addons/purchase/views/purchase_views.xml` |
| Purchase order calendar | Orders by order date, colored by vendor | `odoo/addons/purchase/views/purchase_views.xml` |
| Purchase order list | RFQ / PO list with status, vendor, expected arrival, total; filters for my orders, waiting, late | `odoo/addons/purchase/views/purchase_views.xml` |
| Purchase Analysis | Pivot/graph/list of ordered, received and billed qty/amounts | `odoo/addons/purchase/report/purchase_report_views.xml`, `odoo/addons/purchase/report/purchase_reports.xml` |
| On-time Delivery | Vendor OTD graph (last year) and dashboard KPI (purchase_stock) | `odoo/addons/purchase_stock/report/vendor_delay_report.xml`, `odoo/addons/purchase_stock/static/src/purchase_dashboard/purchase_dashboard.xml` |
| Purchase configuration | Settings for purchase, incoterms, units, currencies | `odoo/addons/purchase/views/res_config_settings_views.xml` |
| Purchase & Inventory menu additions | Receipts, reordering rules and replenishment reachable from the purchase/inventory app | `odoo/addons/purchase_stock/views/purchase_views.xml`, `stock_orderpoint_views.xml` |
| Purchase Agreements menu | `purchase_requisition` adds a Purchase Agreements item under Orders (not a separate app) | `odoo/addons/purchase_requisition/views/purchase_requisition_views.xml` |

### ERPNext — Buying workspace

The Buying workspace is the module landing page: shortcut cards, number cards, dashboard
charts, onboarding and report links. The sidebar repeats the document sequence. The
workspace is a metadata record, so the page is composed from JSON, not a hand-written
template.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Buying workspace | Landing page: shortcuts, number cards, charts, onboarding, report links | `erpnext/buying/workspace/buying/buying.json` |
| Buying sidebar | Document/report navigation for the module | `erpnext/buying/sidebar/buying/buying.json` |
| Buying dashboard | Dashboard with purchase charts | `erpnext/buying/buying_dashboard/buying/buying.json` |
| Number cards | Active suppliers, annual purchase, average order value, PO count, POs to bill, POs to receive, total purchase amount | `erpnext/buying/number_card/` (7 folders) |
| Dashboard charts | Material request analysis, PO analysis, PO trends, top suppliers | `erpnext/buying/dashboard_chart/` |
| Buying onboarding | Guided setup steps from create supplier through pay supplier | `erpnext/buying/module_onboarding/buying_onboarding/`, `erpnext/buying/onboarding_step/` |
| Buying insights workbook | Prebuilt Insights workbook for buying analysis | `erpnext/buying/insights_workbook/buying/` |
| Buying settings | Module settings page (DocType form) | `erpnext/buying/doctype/buying_settings/` |

### Carbon — Purchasing module

Carbon's purchasing module is a route group with six nav groups: **Suppliers**, **Orders**
(Purchase Orders, Returns), **Agreements** (Leases), **Planning** (Material Planning),
**Sourcing** (RFQs, Supplier Quotes), **Configure** (Types). The landing page is a
working dashboard: count cards, a KPI chart and an "Assigned to Me" list that includes
the POs and suppliers waiting for the user's approval, not a static menu.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Purchasing nav groups | Permission-filtered module routes and saved views | `apps/erp/app/modules/purchasing/ui/usePurchasingSubmodules.tsx` |
| Purchasing landing | Cards for active supplier quotes, open POs and open purchase invoices; KPI bar chart (quote/PO/invoice counts and amounts); Assigned to Me (incl. POs and suppliers needing the user's approval) and Recently Created lists with CSV export | `apps/erp/app/routes/x+/purchasing+/_index.tsx` |
| Purchasing layout | Module shell/nav wrapper | `apps/erp/app/routes/x+/purchasing+/_layout.tsx` |
| Purchasing invoices | Legacy route redirecting to the Invoicing module's purchasing view | `apps/erp/app/routes/x+/purchasing+/invoices.tsx`, `apps/erp/app/routes/x+/invoicing+/purchasing.tsx` |

### AureusERP — Purchase clusters

Purchasing is three Filament clusters: **Orders** (slug purchase/orders),
**Configurations** (slug purchase/configurations) and **Products** (slug
purchase/products), plus a **Customer** cluster that exposes orders, quotations and POs
to the vendor portal. Orders cluster holds
vendors, quotations, purchase orders, agreements, receipts and bills; Configurations
holds vendor prices, currencies, packaging, attributes, categories and units.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Orders cluster | Cluster shell for vendors, quotations, orders, agreements | `plugins/webkul/purchases/src/Filament/Admin/Clusters/Orders.php` |
| Configurations cluster | Cluster shell for vendor prices and product/UOM/currency setup | `plugins/webkul/purchases/src/Filament/Admin/Clusters/Configurations.php` |
| Products cluster | Cluster shell for purchasing product views | `plugins/webkul/purchases/src/Filament/Admin/Clusters/Products.php` |
| Customer/vendor portal cluster | Portal pages for quotations, purchase orders and orders | `plugins/webkul/purchases/src/Filament/Customer/Clusters/Account/Resources/` |
| Plugin settings | Plugin-level settings cluster | `plugins/webkul/purchases/src/Filament/Admin/Clusters/PluginSettings.php` |

### Dolibarr — Purchasing menu area

Dolibarr splits purchasing into separate modules, each with its own menu and list:
Suppliers (third parties), Supplier Proposals, Supplier Orders, Receptions and Supplier
Invoices. The "Suppliers area" page is a dashboard with supplier-order counts by status,
draft orders, draft bills, last modified suppliers and supplier categories.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Suppliers area home | Supplier dashboard: orders by status, draft orders, draft bills, last suppliers, categories | `htdocs/fourn/index.php` |
| Supplier order list | Filterable list with status tabs, late/not-received alerts, mass actions (create bill, send) | `htdocs/fourn/commande/list.php` |
| Supplier proposal list | Supplier quote/request list with status filters | `htdocs/supplier_proposal/list.php` |
| Reception list | Inbound receipt list with draft/validated/processed status | `htdocs/reception/list.php` |
| Supplier invoice list | Vendor bill list with payment status and aging filters | `htdocs/fourn/facture/list.php` |
| Module descriptors | Menus, permissions and module constants per purchasing module | `htdocs/core/modules/modFournisseur.class.php`, `modSupplierProposal.class.php`, `modSupplierOrder.class.php`, `modReception.class.php`, `modSupplierInvoice.class.php` |

### Akaunting — Purchases menu

Akaunting keeps purchasing deliberately small: **Bills**, **Recurring Bills** and
**Vendors**, with payments handled from Banking. There is no requisition, RFQ, PO or
receipt layer in the built-in views.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Bills list | Vendor bills with status, due date, amounts and bulk actions | `resources/views/purchases/bills/index.blade.php` |
| Bills create/edit | Bill form with vendor, dates, line items, taxes, attachments | `resources/views/purchases/bills/create.blade.php`, `edit.blade.php` |
| Bill detail | Document view with status, payment history and actions | `resources/views/purchases/bills/show.blade.php` |
| Recurring bills | Templates for repeating vendor bills | `resources/views/purchases/recurring_bills/index.blade.php`, `create.blade.php`, `edit.blade.php`, `show.blade.php` |
| Vendors list/detail | Vendor register with documents, contacts and balances | `resources/views/purchases/vendors/index.blade.php`, `show.blade.php` |
| Purchases controllers | Server actions behind the three areas | `app/Http/Controllers/Purchases/Bills.php`, `RecurringBills.php`, `Vendors.php` |

### metasfresh — menu windows

metasfresh's WebUI is generic: every screen is a window definition rendered by
`DocumentListContainer` / `MasterWindowContainer`. Purchasing is a set of windows and
processes rather than bespoke pages: Procurement Planning, purchase candidates,
purchase order control, purchase invoice candidates, vendor evaluation and purchase
reports. Each is a metadata window plus Java processes.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Window/list shell | Generic list + single-document window renderer used by every purchasing window | `frontend/src/containers/DocumentListContainer.js`, `MasterWindowContainer.js`, `frontend/src/components/window/` |
| Procurement Planning window | Purchase-candidate planning window (Bestelldisposition / procurement planning) | `backend/de.metas.purchasecandidate.base/src/main/sql/postgresql/system/45-de.metas.purchasecandidate/5478250_sys_gh3037-purchase-order-candidates-window-webui.sql` |
| Purchase candidates (procurement) | Vendor-contract procurement candidate window and weekly qty views | `backend/de.metas.procurement.base/src/main/sql/postgresql/system/50-de.metas.procurement/5440904_sys_09628_PMM_PurchaseCandidate_Window.sql` |
| Purchase invoice candidates | Vendor invoice disposition window (Rechnungsdisposition Einkauf); the migration's file name says PurchaseOrderCandidates but it builds this window | `backend/de.metas.adempiere.adempiere/migration/src/main/sql/postgresql/system/10-de.metas.adempiere/5569820_sys_gh10074_CreateWindow_PurchaseOrderCandidates.sql` |
| Purchase planning view | Sales-order-to-purchase planning grid and candidate-to-PO launcher | `backend/de.metas.ui.web.base/src/main/java/de/metas/ui/web/order/sales/purchasePlanning/view/`, `backend/de.metas.ui.web.base/src/main/java/de/metas/ui/web/order/sales/purchasePlanning/process/WEBUI_PurchaseCandidates_PurchaseView_Launcher.java` |
| Vendor return process | Generate a vendor return from a receipt | `backend/de.metas.ui.web.base/src/main/java/de/metas/ui/web/shipment/process/M_InOut_GenerateVendorReturn.java` |

**BOSS implications.** Every reference separates a purchasing *workspace* from the
document lists, and the strongest landing pages are working dashboards, not menus:
Carbon's count cards + KPI chart + assigned documents (with approvals folded in),
ERPNext's number cards and charts, Odoo's RFQ KPI strip, and Dolibarr's draft-order and
draft-bill boxes. One option for the IronStone Purchasing root screen is a buyer work
queue (my RFQs, POs awaiting approval, late receipts, invoices on hold) with the document
lists one click away. Odoo's "new RFQ first" lifecycle is a candidate default: the buyer
starts a sourcing document, not a PO, and a PO is the accepted quote/requisition outcome.
AureusERP's split of Orders / Configurations / Products is a workable authz grouping;
Dolibarr's split into five modules fragments the navigation, where the other references
keep one app and one nav.

---

## 2. Suppliers

### Odoo — vendor master and supplier info

Supplier master reuses the partner form, with a Purchases tab for supplier-specific
terms, and product-level `product.supplierinfo` records for vendor prices, lead times and
minimum quantities. Vendor bill and purchase order counts appear as smart buttons.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Vendors list | Supplier partner list with purchase smart buttons | `odoo/addons/purchase/views/purchase_views.xml`, `odoo/addons/account/views/partner_view.xml` |
| Vendor form — Purchase tab | Buyer (before the supplier payment terms field), vendor currency, incoterm and incoterm location, receipt reminder email and days before | `odoo/addons/purchase/views/res_partner_views.xml` |
| Vendor form — stats | RFQ/PO smart buttons and on-time delivery rate (purchase_stock) | `odoo/addons/purchase/views/res_partner_views.xml`, `odoo/addons/purchase_stock/views/res_partner_views.xml` |
| Vendor Pricelists | Supplier price list list/kanban/form under Purchase > Configuration | `odoo/addons/product/views/product_supplierinfo_views.xml`, `odoo/addons/purchase/views/product_views.xml` |
| Vendor Information form | Vendor, product/variant, vendor product name/code, min qty, price, currency, validity, delay | `odoo/addons/product/views/product_supplierinfo_views.xml` |
| Product form — Purchase tab | Editable vendor pricelists, purchase description/warning, bill-control policy | `odoo/addons/purchase/views/product_views.xml` |
| Product purchased stat/history | Purchased qty (365 days), incoming qty, purchase history list/pivot/graph | `odoo/addons/purchase/views/product_views.xml`, `odoo/addons/purchase/views/purchase_views.xml` |
| Purchase warnings | Vendor/product warning text shown on RFQs, POs and bills | `odoo/addons/purchase/views/res_partner_views.xml`, `odoo/addons/purchase/views/product_views.xml` |
| Vendor portal | Supplier-facing PO/quote pages when portal is enabled | `odoo/addons/purchase/controllers/portal.py`, `odoo/addons/purchase/views/portal_templates.xml` |

### ERPNext — Supplier and Supplier Scorecard

Suppliers are full DocTypes with contacts, addresses, bank accounts, tax and payment
terms. Supplier scorecards are a separate DocType family: criteria, scoring variables,
standings and periods produce a periodic score used for sourcing decisions. Item-level
supplier records carry vendor part number, price and lead time.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Supplier form | Supplier master: contacts, addresses, bank accounts, tax, payment terms, default currency | `erpnext/buying/doctype/supplier/supplier.json`, `supplier.js` |
| Supplier list | Filterable supplier list; supplier can be disabled or put on hold (hold type, release date) | `erpnext/buying/doctype/supplier/supplier.json` |
| Supplier scorecard | Scorecard definition and evaluation periods; standings can warn or prevent new RFQs and POs and notify the supplier | `erpnext/buying/doctype/supplier_scorecard/`, `erpnext/buying/doctype/supplier_scorecard_period/` |
| Scorecard criteria | Criteria, scoring criteria, variables and standings | `erpnext/buying/doctype/supplier_scorecard_criteria/`, `erpnext/buying/doctype/supplier_scorecard_scoring_criteria/`, `erpnext/buying/doctype/supplier_scorecard_scoring_variable/`, `erpnext/buying/doctype/supplier_scorecard_scoring_standing/`, `erpnext/buying/doctype/supplier_scorecard_standing/`, `erpnext/buying/doctype/supplier_scorecard_variable/` |
| Item supplier | Vendor part number, price, lead time per item | `erpnext/stock/doctype/item_supplier/` |
| Item lead time | Lead-time history per item/supplier | `erpnext/stock/doctype/item_lead_time/`, `erpnext/stock/doctype/item_lead_time_supplier/` |
| Customer number at supplier | Supplier's identifier for the buying company | `erpnext/buying/doctype/customer_number_at_supplier/` |

### Carbon — Supplier 360

Carbon gives the supplier a full record with a persistent right sidebar and tabs for
contacts, locations, bank accounts, payment terms, shipping, tax, parts, processes and a
risk register. This is the closest reference for a "Supplier 360" screen.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Suppliers list | Searchable supplier table with status indicators and saved views | `apps/erp/app/modules/purchasing/ui/Supplier/SuppliersTable.tsx`, `apps/erp/app/routes/x+/purchasing+/suppliers.tsx` |
| Supplier form | Core supplier fields: ID, name, status, type, account manager, purchasing contact, currency, website | `apps/erp/app/modules/purchasing/ui/Supplier/SupplierForm.tsx` |
| Supplier header | Record header with status, actions and navigation | `apps/erp/app/modules/purchasing/ui/Supplier/SupplierHeader.tsx` |
| Supplier sidebar | Tabs: Details, Contacts, Locations, Payment, Tax, Shipping, Processes, Parts, Documents, Default Attachments, Bank Accounts, Risks, Quotes, Orders, Invoices (with counts) | `apps/erp/app/modules/purchasing/ui/Supplier/SupplierSidebar/SupplierSidebar.tsx`, `useSupplierSidebar.tsx` |
| Supplier contacts | Contact list/add/edit per supplier | `apps/erp/app/modules/purchasing/ui/Supplier/SupplierContacts.tsx`, `SupplierContactForm.tsx` |
| Supplier locations | Delivery/remit-to addresses per supplier | `apps/erp/app/modules/purchasing/ui/Supplier/SupplierLocations.tsx`, `SupplierLocationForm.tsx` |
| Supplier bank accounts | Vendor bank accounts for payment | `apps/erp/app/modules/purchasing/ui/Supplier/SupplierBankAccounts.tsx`, `SupplierBankAccountForm.tsx` |
| Supplier payment terms | Payment terms per supplier | `apps/erp/app/modules/purchasing/ui/Supplier/SupplierPaymentForm.tsx` |
| Supplier shipping | Shipping method/terms per supplier | `apps/erp/app/modules/purchasing/ui/Supplier/SupplierShippingForm.tsx` |
| Supplier tax | Tax configuration per supplier | `apps/erp/app/modules/purchasing/ui/Supplier/SupplierTaxForm.tsx` |
| Supplier parts | Approved vendor parts/prices per supplier | `apps/erp/app/modules/purchasing/ui/Supplier/SupplierParts.tsx` |
| Supplier processes | Supplier-facing process definitions | `apps/erp/app/modules/purchasing/ui/Supplier/SupplierProcesses.tsx`, `SupplierProcessForm.tsx` |
| Supplier risk register | Risk entries/assessment per supplier | `apps/erp/app/modules/purchasing/ui/Supplier/SupplierRiskRegister.tsx` |
| Supplier approval | Supplier status Active / Inactive / Pending / Rejected; new suppliers can need approval, which shows in the approver's Assigned to Me list | `apps/erp/app/routes/x+/supplier+/$supplierId.approval.tsx`, `apps/erp/app/modules/purchasing/ui/Supplier/SupplierStatusIndicator.tsx` |
| Supplier types | Supplier type configuration | `apps/erp/app/modules/purchasing/ui/SupplierTypes/SupplierTypesTable.tsx`, `SupplierTypeForm.tsx` |
| Product supplier parts | Add/edit/delete supplier part from an item record | `apps/erp/app/routes/x+/part+/$itemId.purchasing.$supplierPartId.tsx`, `$itemId.purchasing.new.tsx` |

### AureusERP — Vendor resource

The Vendor resource is a full partner record with sub-pages for contacts, addresses,
bills and purchases; vendor prices are a standalone configuration resource (and a
Vendors tab on the inventory product). The Customer cluster exposes a read-only vendor
portal view.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Vendors list | Vendor register | `plugins/webkul/purchases/src/Filament/Admin/Clusters/Orders/Resources/VendorResource/Pages/ListVendors.php` |
| Vendor form | Vendor master: identity, addresses, contacts, payment terms | `plugins/webkul/purchases/src/Filament/Admin/Clusters/Orders/Resources/VendorResource/Pages/CreateVendor.php`, `EditVendor.php`, `ViewVendor.php` |
| Vendor addresses | Address sub-page | `plugins/webkul/purchases/src/Filament/Admin/Clusters/Orders/Resources/VendorResource/Pages/ManageAddresses.php` |
| Vendor contacts | Contact relation manager | `plugins/webkul/purchases/src/Filament/Admin/Clusters/Orders/Resources/VendorResource/Pages/ManageContacts.php` |
| Vendor purchases | Purchase orders/quotes sub-page | `plugins/webkul/purchases/src/Filament/Admin/Clusters/Orders/Resources/VendorResource/Pages/ManagePurchases.php` |
| Vendor bills | Bills relation manager | `plugins/webkul/purchases/src/Filament/Admin/Clusters/Orders/Resources/VendorResource/Pages/ManageBills.php` |
| Vendor prices list | Vendor-specific product prices | `plugins/webkul/purchases/src/Filament/Admin/Clusters/Configurations/Resources/VendorPriceResource/Pages/ListVendorPrices.php` |
| Vendor price form | Product, vendor, price, currency, min qty, lead time | `plugins/webkul/purchases/src/Filament/Admin/Clusters/Configurations/Resources/VendorPriceResource/Schemas/VendorPriceForm.php`, `plugins/webkul/purchases/src/Filament/Admin/Clusters/Configurations/Resources/VendorPriceResource/Schemas/VendorPriceInfolist.php`, `plugins/webkul/purchases/src/Filament/Admin/Clusters/Configurations/Resources/VendorPriceResource/Tables/VendorPricesTable.php` |
| Vendor portal list/view | Supplier-facing quotation/PO/order pages | `plugins/webkul/purchases/src/Filament/Customer/Clusters/Account/Resources/QuotationResource/`, `PurchaseOrderResource/`, `OrderResource/` |

### Dolibarr — supplier (third-party) card

Dolibarr's supplier is a company record with a "Supplier" nature; the card has tabs for
contacts, orders, invoices, proposals and products, plus outstanding-balance boxes.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Supplier card | Company/supplier record: nature, supplier code, contacts, addresses, bank, outstanding balance | `htdocs/fourn/card.php` |
| Supplier list | Supplier register with category, status and outstanding balance filters | `htdocs/societe/list.php` (supplier filter) |
| Supplier products | Products/prices for a supplier (list per vendor) | `htdocs/fourn/product/list.php` |
| Supplier area home | Dashboard with last suppliers and purchasing boxes | `htdocs/fourn/index.php` |
| Supplier invoice/order/proposal tabs | Cross-links from the supplier card to its documents | `htdocs/fourn/card.php` (tab construction) |

### Akaunting — vendor record

Vendors are contacts with a vendor role; the detail page reuses the contact show screen
with documents, contacts and transactions tabs.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Vendors list | Vendor register with balances and bulk actions | `resources/views/purchases/vendors/index.blade.php` |
| Vendor form | Contact form for a vendor (general, address, billing, persons) | `resources/views/purchases/vendors/create.blade.php`, `edit.blade.php`, `resources/views/components/contacts/form/` |
| Vendor detail | Contact show screen: overview, documents, contacts, transactions | `resources/views/purchases/vendors/show.blade.php`, `resources/views/components/contacts/show/content.blade.php` |

### metasfresh — business partner and vendor product info

Vendors are business partners (`C_BPartner`) with purchasing flags and vendor product
records (`C_BPartner_Product`); no bespoke vendor page exists, the generic
business-partner window and product window serve both sales and purchasing. Vendor
evaluation is a report/process, not a master-data form.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Business partner window | Generic BP master shell (vendor and customer share it) | `frontend/src/containers/MasterWindowContainer.js`, `frontend/src/components/window/`, `backend/de.metas.business/` |
| Vendor product info | Vendor product number, price/lead-time lookup used by the planning views | `backend/de.metas.purchasecandidate.base/src/main/java/de/metas/purchasecandidate/VendorProductInfo.java`, `VendorProductInfoService.java` |
| Vendor purchase schedule | Vendor delivery days / purchase schedule window tab | `backend/de.metas.purchasecandidate.base/src/main/sql/postgresql/system/45-de.metas.purchasecandidate/5493100_sys_gh4002_C_BP_PurchaseSchedule_window_tab.sql` |
| Vendor evaluation | Vendor Evaluation Excel report entry (menu/process translation) | `backend/de.metas.fresh/de.metas.fresh.base/src/main/sql/postgresql/system/75-de.metas.fresh.reports/5491270_sys_gh3768_add_excel_in_webui_menu.sql` |

### Ever Gauzy — vendor register only

Gauzy has a basic organization-vendor register (name, phone, email, website, tags) with
a favorites-enabled record view, but no supplier terms, contacts, prices or purchasing
documents.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Vendors grid | Organization vendors list, add/edit dialog, favorites | `apps/gauzy/src/app/pages/vendors/vendors.component.ts`, `vendors.component.html` |
| Vendor record view | Full-width vendor record used by favorites/deep links | `apps/gauzy/src/app/pages/vendors/vendor-record-view.ts` |

**BOSS implications.** The supplier record is really four records in one screen: **party**
(name, addresses, contacts, tax IDs), **purchasing terms** (currency, payment terms,
incoterm, shipping), **financial** (bank accounts, balance, bills), and
**performance/risk** (scorecard, risk register, processes). Carbon's Supplier 360 sidebar
(with supplier approval) and ERPNext's scorecard (whose standings can block RFQs and POs)
are the strongest structural references; Odoo's `product.supplierinfo` is the closest
model for per-product vendor price/lead-time rows in the reused Product 360; in Mantle
these are `ProductPrice` rows with `vendorPartyId` (see §12). Carbon and AureusERP both
let vendor prices be edited from supplier and product contexts. Dolibarr spreads suppliers
over five module menus; in the other references one supplier record links to every
purchasing document.

---

## 3. Purchase requests, requisitions & demand

This is the area where the references diverge most. Only ERPNext has a first-class,
current internal **Material Request**; metasfresh still carries the ADempiere
requisition model (`M_Requisition`) but works mainly from planning candidates; Odoo and
AureusERP use *purchase agreements* (blanket orders and templates) under the
"requisition" name; Carbon generates demand from planning; Dolibarr and Akaunting have
no internal request document (Dolibarr's "price request" is a request to a vendor).

### Odoo — Purchase Agreements (not internal requests)

`purchase.requisition` is a **purchase agreement**, not an employee purchase request.
It supports two types — *Blanket Order* (vendor-specific, validity period, negotiated
prices) and *Purchase Template* (vendor-neutral sourcing template) — with states
Draft → Confirmed → Done/Cancelled. Confirmed agreements spawn RFQs/orders and expose an
"RFQs/Orders" smart button.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Purchase Agreements list | Agreement list with validity, vendor, buyer, state; "My Agreements" filter | `odoo/addons/purchase_requisition/views/purchase_requisition_views.xml` |
| Purchase Agreement form | Type, vendor, buyer, validity dates, reference, currency, product lines, ordered qty | `odoo/addons/purchase_requisition/views/purchase_requisition_views.xml` |
| Agreement actions | Confirm, Close, Reset to Draft, Cancel; New Quotation; RFQs/Orders smart button | `odoo/addons/purchase_requisition/views/purchase_requisition_views.xml` |
| RFQs for an agreement | Filtered purchase-order list scoped to the agreement | `odoo/addons/purchase_requisition/views/purchase_requisition_views.xml` (`action_purchase_requisition_list`) |
| Merge RFQs | Server action merging multiple RFQs for the same vendor/need | `odoo/addons/purchase/views/purchase_views.xml` (`action_merger`), `wizard/` |

### ERPNext — Material Request

Material Request is the internal demand document: purpose Purchase, Material Transfer,
Material Issue, Manufacture, Subcontracting or Customer Provided, with required-by dates
and per-line ordered/received percentages; statuses run Draft → Pending → Partially
Ordered / Ordered → Partially Received / Received (or Issued / Transferred), with Stop
and Re-open. It is the source for RFQ, Supplier Quotation, Purchase Order or
Subcontracted Purchase Order; buttons on the form create each downstream document.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Material Request form | Purpose, required-by, company, items, status, % ordered, % received, terms | `erpnext/stock/doctype/material_request/material_request.json`, `material_request.js` |
| Material Request list | List with status/purpose filters and bulk actions | `erpnext/stock/doctype/material_request/material_request_list.js` |
| Create downstream documents | Buttons: Purchase Order, Request for Quotation, Supplier Quotation, Subcontracted PO | `erpnext/stock/doctype/material_request/material_request.js` |
| Material Request analysis chart | Workspace chart of request volume/status | `erpnext/buying/dashboard_chart/material_request_analysis/` |
| Requested items to order and receive | Report of open request lines with ordered/received quantities | `erpnext/buying/report/requested_items_to_order_and_receive/` |

### Carbon — planning-generated demand, no requisition document

Carbon has no requisition document. Demand comes from Material Planning (MRP worklist)
and directly from RFQs; the planning grid's actions create planned orders and purchase
orders. The buyer's "request" equivalent is the RFQ.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Material Planning table | Time-phased item/location grid with planned actions, time fence, assignee, drawer | `apps/erp/app/modules/purchasing/ui/Planning/PurchasingPlanningTable.tsx`, `apps/erp/app/routes/x+/purchasing+/planning.tsx` |
| Planning order drawer | Item detail and order creation from a planning row | `apps/erp/app/modules/purchasing/ui/Planning/PurchasingPlanningOrderDrawer.tsx` |
| Planning commands | Apply/reschedule/cancel planned purchase actions | `apps/erp/app/modules/purchasing/ui/Planning/usePurchaseOrderPlanningCommands.tsx`, `apps/erp/app/routes/x+/purchasing+/planning.update.tsx` |

### AureusERP — purchase agreements

AureusERP's Purchase Agreement resource carries blanket-order/purchase-template types,
validity dates, buyer, currency and product lines with ordered quantities; RFQs can be
managed from the agreement. There is no separate internal purchase request resource.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Purchase Agreements list | Agreements with type, vendor, buyer, validity and status | `plugins/webkul/purchases/src/Filament/Admin/Clusters/Orders/Resources/PurchaseAgreementResource/Pages/ListPurchaseAgreements.php` |
| Purchase Agreement form | General fields + Products / Additional Information / Terms tabs | `plugins/webkul/purchases/src/Filament/Admin/Clusters/Orders/Resources/PurchaseAgreementResource/Schemas/PurchaseAgreementForm.php` |
| Agreement RFQs | Manage RFQs created under an agreement | `plugins/webkul/purchases/src/Filament/Admin/Clusters/Orders/Resources/PurchaseAgreementResource/Pages/ManageRfqs.php` |
| Agreement types/states | Blanket order vs purchase template; draft/confirmed/closed/cancelled | `plugins/webkul/purchases/src/Enums/RequisitionType.php`, `RequisitionState.php` |

### Dolibarr — supplier proposals are quotes, not requests

Dolibarr has no internal requisition. **Supplier Proposal** ("Vendor commercial
proposal", shown on its card as a *Price request*) is the request-for-quote /
supplier-quote document, with Draft / Validated / Signed / Not signed / Closed states,
contacts and notes. Demand enters via the replenishment page or a manual supplier
order.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Supplier proposal card | Quote/request card: vendor, lines, totals, Validate, Close, Create Supplier Order | `htdocs/supplier_proposal/card.php` |
| Supplier proposal list | Filtered list by status/vendor | `htdocs/supplier_proposal/list.php` |
| Proposal tabs | Main card tab labelled *Price request* (`CommRequests`), Contacts/addresses, Notes, documents, info | `htdocs/core/lib/supplier_proposal.lib.php`, `htdocs/supplier_proposal/contact.php`, `note.php`, `document.php`, `info.php` |

### metasfresh — purchase candidates and procurement planning

Demand is generated as **purchase candidates** from sales orders, material disposition
or vendor contracts, then converted to purchase orders in the planning window. The
procurement (PMM) variant manages weekly contract quantities and messages.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Procurement Planning window | Candidate grid with vendor, product, qty, date promised, source sales order; generate POs | `backend/de.metas.purchasecandidate.base/src/main/sql/postgresql/system/45-de.metas.purchasecandidate/5478250_sys_gh3037-purchase-order-candidates-window-webui.sql` |
| Purchase candidates → PO | Async process generating purchase orders from selected candidates | `backend/de.metas.purchasecandidate.base/src/main/java/de/metas/purchasecandidate/async/C_PurchaseCandidates_GeneratePurchaseOrders.java` |
| Procurement candidates (PMM) | Contract-based weekly procurement candidates and messages | `backend/de.metas.procurement.base/src/main/sql/postgresql/system/50-de.metas.procurement/5440904_sys_09628_PMM_PurchaseCandidate_Window.sql` |
| Procurement planning view | Aggregated sales-order demand with purchase rows; launch PO creation | `backend/de.metas.ui.web.base/src/main/java/de/metas/ui/web/order/sales/purchasePlanning/view/`, `backend/de.metas.ui.web.base/src/main/java/de/metas/ui/web/order/sales/purchasePlanning/process/WEBUI_PurchaseCandidates_PurchaseView_Launcher.java` |
| Requisition (legacy) | ADempiere `M_Requisition` / `M_RequisitionLine` model and a Requisition → PO process; whether a WebUI window exposes it is *(unverified)* | `backend/de.metas.business/src/main/java-legacy/org/compiere/model/MRequisition.java`, `backend/de.metas.business/src/main/java-legacy/org/compiere/process/RequisitionPOCreate.java` |

**BOSS implications.** A genuine internal **purchase request** is the missing role in
Odoo/AureusERP and the strongest part of ERPNext: any employee asks, a buyer sources.
ERPNext models it as a request document with purpose, required-by, cost center/project and
lines, then a single action to create RFQ(s) or PO(s); its button set is the reference.
The Moqui baseline already has the shape: `Request` type `RqtPurchase` with `RequestItem`
(product, quantity, required-by, maximum amount, supplier) and
`create#PurchaseRequestOrder`, which splits the lines into one PO per supplier and links
them with `RequestItemOrder` (§12). Odoo and AureusERP keep *agreements* (blanket
orders/templates) as a separate document from requisitions, despite the shared name. In
ERPNext, Carbon and metasfresh, buyer work starts from a demand queue (ERPNext
requested-items report, Carbon planning, metasfresh candidates), not from a blank PO.

---

## 4. RFQs & supplier quotes

### Odoo — RFQ is the draft purchase order

Odoo has no separate RFQ object: a `purchase.order` in Draft/Sent **is** the RFQ.
Actions switch meaning by state — *Send RFQ* / *Confirm Order* while draft/sent,
*Send PO* / *Acknowledge* after confirmation. Vendor responses are entered on the same
order; multiple RFQs can be merged. Side-by-side comparison comes from the separate
`purchase_alternative` addon: an Alternatives tab on the PO, a "Create Alternative"
wizard, and an editable "Compare Product Lines" list with Choose/Clear per line.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| RFQ list | "Requests for Quotation" list, kanban and calendar | `odoo/addons/purchase/views/purchase_views.xml` (`purchase_rfq`, `purchase_order_kanban`, `purchase_order_calendar`) |
| RFQ form | Vendor, currency, date, expected arrival, lines, terms; Send RFQ / Confirm / Print quotation | `odoo/addons/purchase/views/purchase_views.xml` (`purchase_order_form`) |
| Send RFQ dialog | Email composer with template/attachments | `odoo/addons/purchase/wizard/`, `odoo/addons/purchase/views/purchase_views.xml` (`action_rfq_send`) |
| Merge RFQs | Combines selected RFQs into one | `odoo/addons/purchase/views/purchase_views.xml` (`action_merger`) |
| Confirm RFQs | Bulk confirm action from the list | `odoo/addons/purchase/views/purchase_views.xml` (`action_confirm_rfqs`) |
| Alternatives tab / wizard | Create alternative RFQs per vendor; copy products optionally; warns on confirm | `odoo/addons/purchase_alternative/views/purchase_views.xml`, `wizard/purchase_alternative_create.xml`, `wizard/purchase_alternative_warning.xml` |
| Compare Product Lines | Editable comparison of vendor, qty, price and totals; Choose/Clear per line | `odoo/addons/purchase_alternative/views/purchase_views.xml` (`purchase_order_line_view_compare_list`) |
| Alternatives with OTD | Adds vendor on-time-delivery percentage to alternatives/comparison | `odoo/addons/purchase_alternative_stock/views/purchase_views.xml` |
| Vendor portal quote | Supplier-facing RFQ list/detail and scheduled-date update | `odoo/addons/purchase/controllers/portal.py`, `odoo/addons/purchase/views/portal_templates.xml`, `odoo/addons/purchase/data/portal_entry_data.xml` |

### ERPNext — RFQ, Supplier Quotation and comparison

ERPNext separates the RFQ (a request sent to one or more suppliers) from Supplier
Quotation records, and ships a comparison report across quotes for the same RFQ. The RFQ
form can email suppliers, generate quotations on their behalf and download a per-supplier
PDF; the comparison report is the sourcing decision screen.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| RFQ form | Suppliers table, items, required-by, message; create quotation, send emails, PDF | `erpnext/buying/doctype/request_for_quotation/request_for_quotation.json`, `request_for_quotation.js` |
| RFQ list/dashboard | RFQ list and dashboard counts | `erpnext/buying/doctype/request_for_quotation/request_for_quotation_dashboard.py` |
| Supplier Quotation form | Supplier, valid till, currency, items/rates, taxes; create PO/Quotation | `erpnext/buying/doctype/supplier_quotation/supplier_quotation.json`, `supplier_quotation.js` |
| Supplier Quotation Comparison | Side-by-side quote comparison report | `erpnext/buying/report/supplier_quotation_comparison/` |
| Procurement Tracker | End-to-end status of requests → RFQs → POs → receipts | `erpnext/buying/report/procurement_tracker/` |
| Add suppliers to RFQ | "Get Suppliers" dialog filtered by group/tag | `erpnext/buying/doctype/request_for_quotation/request_for_quotation.js` |
| Supplier portal RFQ | Portal page where a supplier enters rates against an RFQ | `erpnext/templates/pages/rfq.py`, `rfq.html` |

### Carbon — RFQ + Supplier Quote + compare/conversion drawers

Carbon has distinct RFQ (Draft / Requested / Closed) and Supplier Quote (Draft / Active /
Expired / Declined / Cancelled) documents, with a compare drawer for active quotes on the
same RFQ, per-quote line pricing (quantity tiers, shipping, lead time,
tax), a send modal and a "convert to order" drawer. Vendors can submit quotes through a
share link (digital quote route).

| Screen/page | What it is | Key files |
| --- | --- | --- |
| RFQ list | Sourcing list with status and saved views | `apps/erp/app/modules/purchasing/ui/PurchasingRfq/PurchasingRFQsTable.tsx`, `apps/erp/app/routes/x+/purchasing+/rfqs.tsx` |
| RFQ form | Suppliers, RFQ/due dates, receiving location, buyer | `apps/erp/app/modules/purchasing/ui/PurchasingRfq/PurchasingRFQForm.tsx` |
| RFQ lines | Requested items/quantities, delete line | `apps/erp/app/modules/purchasing/ui/PurchasingRfq/PurchasingRFQLineForm.tsx`, `DeletePurchasingRFQLine.tsx` |
| RFQ header/actions | Finalize, cancel, delete, suppliers, compare, share link | `apps/erp/app/modules/purchasing/ui/PurchasingRfq/PurchasingRFQHeader.tsx`, `FinalizeRFQModal.tsx`; routes `apps/erp/app/routes/x+/purchasing-rfq+/$rfqId.finalize.tsx`, `$rfqId.cancel.tsx`, `$rfqId.suppliers.tsx`, `$rfqId.compare.tsx` |
| Supplier quote list | Quotes with status (Draft/Active/Expired/Declined/Cancelled) | `apps/erp/app/modules/purchasing/ui/SupplierQuote/SupplierQuotesTable.tsx`, `apps/erp/app/routes/x+/purchasing+/quotes.tsx` |
| Supplier quote form/lines | Vendor, quoted/expiration dates, currency, line pricing | `apps/erp/app/modules/purchasing/ui/SupplierQuote/SupplierQuoteForm.tsx`, `SupplierQuoteLineForm.tsx`, `SupplierQuoteLinePricing.tsx` |
| Quote comparison drawer | Compares active quotes by total and quantity tier | `apps/erp/app/modules/purchasing/ui/SupplierQuote/SupplierQuoteCompareDrawer.tsx` |
| Quote → order drawer | Select lines/quantities to convert to a PO | `apps/erp/app/modules/purchasing/ui/SupplierQuote/SupplierQuoteToOrderDrawer.tsx` |
| Quote send modal | Email quote/RFQ to supplier | `apps/erp/app/modules/purchasing/ui/SupplierQuote/SupplierQuoteSendModal.tsx` |
| External digital quote | Public share pages for RFQ and supplier quote submission | `apps/erp/app/routes/share+/purchasing-rfq.$id.tsx`, `share+/supplier-quote.$id.tsx`, `api+/purchasing.digital-quote.$id.tsx` |

### AureusERP — Quotation resource and vendor portal

AureusERP calls the RFQ-stage document **Quotation**, with Purchase Order as the confirmed
form. Quotation resources have create/edit/view/list pages, print/send actions and a
vendor-portal twin; purchase agreements can also manage RFQs.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Quotations list | Vendor quotations with state and totals | `plugins/webkul/purchases/src/Filament/Admin/Clusters/Orders/Resources/QuotationResource/Pages/ListQuotations.php` |
| Quotation create/edit/view | Header, lines, terms and actions | `plugins/webkul/purchases/src/Filament/Admin/Clusters/Orders/Resources/QuotationResource/Pages/CreateQuotation.php`, `EditQuotation.php`, `ViewQuotation.php` |
| Quotation actions | Print RFQ, send email, confirm, cancel, lock/unlock | `plugins/webkul/purchases/src/Filament/Admin/Clusters/Orders/Resources/OrderResource/Actions/PrintRFQAction.php`, `SendEmailAction.php`, `ConfirmAction.php`, `CancelAction.php`, `LockAction.php`, `UnlockAction.php` |
| Vendor portal quotation | Supplier-facing list/view of quotations | `plugins/webkul/purchases/src/Filament/Customer/Clusters/Account/Resources/QuotationResource/Pages/ListQuotations.php`, `ViewQuotation.php` |

### Dolibarr — Supplier Proposal

Supplier Proposal is Dolibarr's quote document. It has a card with lines/totals,
contacts/addresses, notes, email sending, validation, Signed / Not signed closing and a
direct "Add Supplier Order" conversion.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Supplier proposal card | Lines, totals, status, Validate, close as Signed / Not signed, Add Supplier Order | `htdocs/supplier_proposal/card.php` |
| Supplier proposal list | Status/vendor filtered list | `htdocs/supplier_proposal/list.php` |
| Proposal documents/notes/contacts | Document attachments, notes, linked contacts | `htdocs/supplier_proposal/document.php`, `note.php`, `contact.php`, `info.php` |

### metasfresh — vendor availability and remote ordering

metasfresh has no RFQ/quotation document. Sourcing happens through purchase candidates
and vendor product info; vendor availability checks and remote orders are pluggable via
vendor gateways (the MSV3 module is the reference implementation).

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Vendor availability request | Availability check request/response model used by planning | `backend/de.metas.purchasecandidate.base/src/main/java/de/metas/purchasecandidate/availability/` |
| Remote purchase order gateway | Vendor-gateway API for sending orders/availability (Null + MSV3 implementations) | `backend/de.metas.vendor.gateway.api/`, `backend/de.metas.vertical.pharma.vendor.gateway.msv3/` |
| MSV3 order/availability windows | Vendor gateway transaction, order and availability-response windows | `backend/de.metas.vertical.pharma.vendor.gateway.msv3/src/main/sql/postgresql/system/99-metasfresh-pharma.vendor.gateway.mvs3/5484240_sys_gh3411-app_add_window_for_verfuegbarkeit_and_bestellung.sql` |

**BOSS implications.** ERPNext and Carbon keep **RFQ** and **supplier quote** as separate
records; Odoo keeps one record but recovers comparison through its Alternatives addon,
which suggests the comparison UI matters more than the document count. Every reference
with sourcing has a **quote comparison** (ERPNext report, Carbon compare drawer, Odoo
Compare Product Lines): per line, vendor, unit price, lead time, shipping and tax, with a
selection that becomes the PO; total landed cost is a candidate addition (none makes it
first-class, §13). Carbon's digital quote share link is the strongest vendor-response
pattern (no portal account required); ERPNext's "create quotation on behalf of supplier"
covers phone/email quotes. Odoo's "merge RFQs" and alternative cancellation warning are
candidate bulk actions on requests.

---

## 5. Purchase orders & agreements

### Odoo — RFQ-to-PO with approval and lock

A purchase order is the same record as the RFQ after *Confirm Order*, with states
RFQ → RFQ Sent → To Approve → Purchase Order, or Cancelled; there is no Done state —
locking is a separate `locked` flag (set on confirm when the company locks confirmed
orders). The form carries vendor, currency,
payment terms, incoterm, expected arrival, receipt/control policy, lines (product,
quantity, UoM, price, taxes, analytic distribution) and a status bar. Actions: Send PO,
Acknowledge, Receive, Create Bills, Lock/Unlock, Cancel, Print. Approval is a manager
button when the order exceeds the configured double-validation threshold.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| PO form — header/status bar | Send RFQ/PO, Confirm, Approve, Receive, Acknowledge, Print, Lock/Unlock, Cancel | `odoo/addons/purchase/views/purchase_views.xml` (`purchase_order_form`) |
| PO form — Products tab | Editable lines with sections/notes, catalog, received/billed qty, taxes, totals, terms | `odoo/addons/purchase/views/purchase_views.xml` |
| PO form — Other Info tab | Buyer, confirmation date, invoice status, fiscal position, incoterm, origin | `odoo/addons/purchase/views/purchase_views.xml` |
| PO form — smart buttons | Vendor Bills, Bill Matching, Price Comparison; purchase_stock adds Receipt | `odoo/addons/purchase/views/purchase_views.xml`, `odoo/addons/purchase_stock/views/purchase_views.xml` |
| PO list / kanban / calendar | List with Receive/Create Bills/Cancel; kanban; calendar by order date | `odoo/addons/purchase/views/purchase_views.xml` |
| PO line form/list | Product, description, qty, UoM, price, taxes, analytic distribution, stock moves | `odoo/addons/purchase/views/purchase_views.xml`, `odoo/addons/purchase_stock/views/purchase_views.xml` |
| Approval settings | Double-validation / minimum amount; Approve Order for managers | `odoo/addons/purchase/views/res_config_settings_views.xml`, `security/purchase_security.xml` |
| Lock / receipt reminder | Lock/Unlock confirmed orders; arrival reminder email + days before | `odoo/addons/purchase/views/purchase_views.xml`, `odoo/addons/purchase/views/res_config_settings_views.xml` |
| Product catalog / variant matrix | Catalog modal and attribute-matrix variant entry on PO lines | `odoo/addons/purchase/static/src/product_catalog/kanban_renderer.xml`, `odoo/addons/purchase_product_matrix/views/purchase_views.xml` |
| Drop-ship / subcontract / manufacturing / repair | Smart buttons and destination fields from the corresponding addons | `odoo/addons/stock_dropshipping/views/purchase_order_views.xml`, `odoo/addons/mrp_subcontracting_purchase/views/purchase_order_views.xml`, `odoo/addons/purchase_mrp/views/purchase_order_views.xml`, `odoo/addons/purchase_repair/views/purchase_views.xml` |
| Purchase agreement / blanket order | Validity, vendor, negotiated prices, New Quotation | `odoo/addons/purchase_requisition/views/purchase_requisition_views.xml` |
| Send PO / print / portal | Email composer, mass send, followers, PO PDF, vendor portal PO page | `odoo/addons/purchase/views/purchase_views.xml`, `odoo/addons/purchase/report/purchase_reports.xml`, `odoo/addons/purchase/views/portal_templates.xml` |
| UBL BIS3 order exchange | Import/export on purchase orders (no dedicated view) | `odoo/addons/purchase_edi_ubl_bis3/__manifest__.py`, `odoo/addons/purchase/views/portal_templates.xml` |

### ERPNext — Purchase Order with full action set

The PO form is a dense two-column document: supplier/company/dates, addresses, currency
and price list, items with warehouse and required-by, taxes, terms and totals. Status
actions include Hold/Resume, Close, Re-open, Deliver (Dropship), Update Items; create
actions produce Purchase Receipt, Purchase Invoice, Payment, Payment Request,
Subcontracting Order and inter-company sales orders; *Get Items From* pulls lines from a
Material Request or Supplier Quotation. Blanket orders are a separate DocType.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Purchase Order form | Supplier, schedule, addresses, currency/price list, items, taxes, terms, totals | `erpnext/buying/doctype/purchase_order/purchase_order.json`, `purchase_order.js` |
| PO list | Status/date/supplier filters, bulk actions | `erpnext/buying/doctype/purchase_order/purchase_order_list.js` |
| PO dashboard | Linked receipts/bills counts | `erpnext/buying/doctype/purchase_order/purchase_order_dashboard.py` |
| Create downstream | Receipt, invoice, payment, payment request, subcontracting order | `erpnext/buying/doctype/purchase_order/purchase_order.js` |
| Blanket Order | Long-term agreement with quantities/rates, used by POs | `erpnext/manufacturing/doctype/blanket_order/`, referenced from `erpnext/buying/doctype/purchase_order/purchase_order.js` |
| PO print formats | Classic/modern/bordered and with-images formats | `erpnext/buying/print_format/` |
| Drop-ship format | Supplier-facing drop-ship PO print format | `erpnext/buying/print_format/drop_shipping_format/` |

### Carbon — PO 360, revisions, approvals and leases

Carbon's PO has an explorer list, header, form, line form, properties, summary, delivery
and payment forms, approval and finalize modals, status and revision actions. Statuses:
Draft, Planned (MRP), Needs Approval, To Review, To Receive, To Receive and Invoice, To
Invoice, Completed, Rejected, Closed. Leases are
a separate purchasing agreement type with their own setup wizard, classification,
schedule, payments, assets and accounting tabs.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| PO list/explorer | Filterable order list with status and saved views | `apps/erp/app/modules/purchasing/ui/PurchaseOrder/PurchaseOrdersTable.tsx`, `PurchaseOrderExplorer.tsx`; route `apps/erp/app/routes/x+/purchasing+/orders.tsx` |
| PO form | Supplier, supplier order no., locations/contacts, currency, type | `apps/erp/app/modules/purchasing/ui/PurchaseOrder/PurchaseOrderForm.tsx` |
| PO header/actions | Finalize, approve, cancel, delete, revision, status | `apps/erp/app/modules/purchasing/ui/PurchaseOrder/PurchaseOrderHeader.tsx`, `PurchaseOrderApprovalModal.tsx`, `PurchaseOrderFinalizeModal.tsx` |
| PO lines | Line form, details, receiving, delete | `apps/erp/app/modules/purchasing/ui/PurchaseOrder/PurchaseOrderLineForm.tsx`; routes `apps/erp/app/routes/x+/purchase-order+/$orderId.$lineId.details.tsx`, `$orderId.$lineId.receiving.tsx` |
| PO properties/summary/delivery/payment | Dates, location, currency, totals, delivery and payment panels | `apps/erp/app/modules/purchasing/ui/PurchaseOrder/PurchaseOrderProperties.tsx`, `PurchaseOrderSummary.tsx`, `PurchaseOrderDeliveryForm.tsx`, `PurchaseOrderPaymentForm.tsx` |
| PO PDF | Printable purchase order (one route file, $orderId[.]pdf.tsx) | `apps/erp/app/routes/file+/purchase-order+/` |
| Leases list/form | Lease agreements with setup steps, details, status (Draft, Active, Expired, Terminated, Purchased, Cancelled) | `apps/erp/app/modules/purchasing/ui/Leases/LeasesTable.tsx`, `LeaseDetailsForm.tsx`, `LeaseSetupSteps.tsx`; route `apps/erp/app/routes/x+/purchasing+/leases.tsx` |
| Lease financials | Classification, schedule, payments, accounting, assets, invoice status | `apps/erp/app/modules/purchasing/ui/Leases/LeaseClassificationPreview.tsx`, `LeaseSchedule.tsx`, `LeasePayments.tsx`, `LeaseAccounting.tsx`, `LeaseAssetsGrid.tsx`, `LeaseInvoiceStatus.tsx` |

### AureusERP — Purchase Orders and agreements

Purchase Orders and Quotations share the Order resource; the PO page exposes status
progress, general/terms tabs, line repeater and actions for confirm, cancel, lock/unlock,
send email, print PO, create bill and manage receipts/bills. Purchase Agreements cover
blanket orders and templates.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Purchase Orders list | PO list with state, vendor, totals | `plugins/webkul/purchases/src/Filament/Admin/Clusters/Orders/Resources/PurchaseOrderResource/Pages/ListPurchaseOrders.php` |
| PO create/edit/view | Progress stepper, general section, lines, terms | `plugins/webkul/purchases/src/Filament/Admin/Clusters/Orders/Resources/PurchaseOrderResource/Pages/CreatePurchaseOrder.php`, `EditPurchaseOrder.php`, `ViewPurchaseOrder.php`; `OrderResource/Schemas/OrderForm.php` |
| PO actions | Confirm, cancel, lock/unlock, send email, print PO, create bill | `plugins/webkul/purchases/src/Filament/Admin/Clusters/Orders/Resources/OrderResource/Actions/ConfirmAction.php`, `CancelAction.php`, `LockAction.php`, `UnlockAction.php`, `SendPOEmailAction.php`, `PrintPOAction.php`, `CreateBillAction.php` |
| Receipts/bills from PO | Relation pages to manage receipts and bills | `plugins/webkul/purchases/src/Filament/Admin/Clusters/Orders/Resources/PurchaseOrderResource/Pages/ManageReceipts.php`, `ManageBills.php` |
| Purchase Agreements | Blanket orders/templates with validity and products | `plugins/webkul/purchases/src/Filament/Admin/Clusters/Orders/Resources/PurchaseAgreementResource/Pages/ListPurchaseAgreements.php`, `CreatePurchaseAgreement.php` |

### Dolibarr — Supplier Order card

The supplier order card is the PO record: vendor, project, delivery date, lines, totals,
documents, contacts, notes and a dispatch tab. States Draft → Validated → Approved
(one or two approval levels) → Ordered → Partially received → Received, or Cancelled /
Refused. Actions:
Validate, Approve/Approve 2, Disapprove, Send by email, Dispatch/Receive, Classify
reception, Create bill, Close, Reopen.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Supplier order card | Header, vendor/project, dates, lines, totals, status actions | `htdocs/fourn/commande/card.php` |
| Supplier order list | Status tabs, late/not-received alerts, mass create bill/send | `htdocs/fourn/commande/list.php` |
| Order dispatch tab | Reception/dispatch lines per order | `htdocs/fourn/commande/dispatch.php` |
| Order documents/contacts/notes | Attachments, linked contacts, private/public notes | `htdocs/fourn/commande/document.php`, `contact.php`, `note.php` |
| Order info | Order metadata/log | `htdocs/fourn/commande/info.php` |

### metasfresh — generic purchase order window

Purchase orders are `C_Order` records with `IsSOTrx=N`, rendered by the generic
document window. There is no dedicated PO page; the buyer works from the order window,
the planning window and the order-check/report processes. Vendor returns and purchase
invoice candidates are separate windows.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Purchase order window | Generic document window for `C_Order` purchase orders | `frontend/src/containers/MasterWindowContainer.js`, `frontend/src/components/window/`; window definitions under `backend/de.metas.business/src/main/sql/` |
| Order lines/quick input | Line entry and quick-input descriptors | `backend/de.metas.ui.web.base/src/main/java/de/metas/ui/web/quickinput/orderline/OrderLineQuickInputDescriptorFactory.java` |

**BOSS implications.** In the references the PO screen is the richest document in the
purchasing app: header facts (supplier, buyer, currency, incoterm, payment terms, dates),
line grid with per-line receipt/invoice progress, a right-side activity/attachment panel,
and a status bar whose actions change by state. In the Moqui baseline this is the existing
`OrderDetail` screen, which already serves sales and purchase parts; it is the reused
Order detail (crosscut §3), and Purchasing's version emphasizes the purchase action set.
Candidates from the references: Carbon's revision support (create a revision instead of
editing a sent PO) and ERPNext's create-menu (receipt, invoice, payment, subcontract).
Approval is amount-threshold based in Odoo and Dolibarr, and lock/unlock is explicit in
Odoo, Carbon and AureusERP. Blanket agreements sit beside POs in the references but are a
different record.

---

## 6. Replenishment & forecasting

### Odoo — reordering rules and replenishment report

Odoo's replenishment is a single editable list of `stock.warehouse.orderpoint` rules:
product/location, on-hand, forecast, route, min/max, qty to order, deadline, and
Order/Automate/Snooze buttons. The same record opens a forecast report and a
replenishment-information dialog. `purchase_stock` adds vendor/price selection to the
buy route and lets rules create RFQs.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Replenishment report | Editable orderpoint list filtered to "to reorder", not snoozed, manual trigger | `odoo/addons/stock/views/stock_orderpoint_views.xml` (`action_replenishment`, `view_warehouse_orderpoint_tree_editable`) |
| Reordering Rules list | Automatic rules with trigger, min/max, qty to order | `odoo/addons/stock/views/stock_orderpoint_views.xml` (`action_orderpoint`) |
| Reordering rule form | Product, location, route, min/max, trigger, supplier/lead-time hints | `odoo/addons/stock/views/stock_orderpoint_views.xml` (`view_warehouse_orderpoint_form`) |
| Replenish wizard | Manual quantity/route/warehouse/planned date; purchase_stock adds required vendor | `odoo/addons/stock/wizard/product_replenish_views.xml`, `odoo/addons/purchase_stock/wizard/product_replenish_views.xml` |
| Suggest Min-Max | Suggests min/max from average daily demand | `odoo/addons/stock/wizard/stock_orderpoint_suggest.xml` |
| Forecasted Report | Availability timeline with incoming/outgoing and draft RFQ row | `odoo/addons/stock/views/stock_forecasted.xml`, `odoo/addons/purchase_stock/static/src/purchase_stock_forecasted/forecasted_details.xml` |
| Replenishment information | Forecast explanation wizard; purchase_stock adds vendor pricelists and "Set as Supplier" | `odoo/addons/stock/wizard/stock_replenishment_info.xml`, `odoo/addons/purchase_stock/wizard/stock_replenishment_info.xml` |
| Product catalog — stock columns | On hand, forecasted, monthly demand and Suggest; filters for suggested/to-order | `odoo/addons/purchase_stock/views/product_views.xml` |
| Buy route / stock rule | Route and rule that turns shortages into RFQs; Days to Purchase setting | `odoo/addons/purchase_stock/data/purchase_stock_data.xml`, `odoo/addons/stock/views/stock_rule_views.xml`, `odoo/addons/purchase_stock/views/res_config_settings_views.xml` |

### ERPNext — reorder levels and auto-reorder

ERPNext stores reorder rules per item/warehouse (`Item Reorder` child table) and runs a
scheduled auto-reorder job that creates Material Requests (POs are then created from
them). Reports show items to request, projected quantities, shortages and recommended reorder levels;
the procurement tracker follows the resulting documents.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Item reorder levels | Per-warehouse re-order level/qty inside the Item form | `erpnext/stock/doctype/item/item.json` (`reorder_levels`), `item_reorder/item_reorder.json` |
| Auto-reorder job | Scheduled creation of material requests from reorder levels | `erpnext/stock/reorder_item.py` |
| Items to be requested | Report of items below reorder level | `erpnext/stock/report/items_to_be_requested/` |
| Itemwise recommended reorder level | Suggested reorder levels from consumption/lead time | `erpnext/stock/report/itemwise_recommended_reorder_level/` |
| Stock projected quantity | Projected qty by warehouse with incoming/outgoing | `erpnext/stock/report/stock_projected_qty/` |
| Item shortage report | Shortages against demand | `erpnext/stock/report/item_shortage_report/` |
| Requested items to order and receive | Buying-side open demand report | `erpnext/buying/report/requested_items_to_order_and_receive/` |

### Carbon — Material Planning worklist

Carbon's Material Planning is a time-phased grid per item/location with a planning time
fence, action types, assignee, purchase quantity, order-by date and linked PO; a drawer
drills into an item and creates planned orders/purchase orders. Actions can be bulk
updated from the grid.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Planning grid | Items × periods, planned actions, time fence, actions column, filters | `apps/erp/app/modules/purchasing/ui/Planning/PurchasingPlanningTable.tsx`; route `apps/erp/app/routes/x+/purchasing+/planning.tsx` |
| Planning item drawer | Item detail, purchase qty, order-by, PO link, supplier selection | `apps/erp/app/modules/purchasing/ui/Planning/PurchasingPlanningOrderDrawer.tsx` |
| Planning bulk actions | Apply/reschedule/cancel planning actions | `apps/erp/app/routes/x+/purchasing+/planning.update.tsx`, `apps/erp/app/modules/purchasing/ui/Planning/usePurchaseOrderPlanningCommands.tsx` |
| MRP schedule hints | Lead-time/schedule explanation in the grid | `apps/erp/app/hooks/useMrpScheduleDescription.ts` (used by the planning table) |

### AureusERP — inventory rules and product quantities

AureusERP puts replenishment under the Inventories plugin: configurable routes/rules and
product quantity/move tabs. Purchasing-facing product pages show vendors, quantities and
moves; an Odoo-style Replenishment resource (order points) exists but is an empty stub,
so there is no working buyer replenishment worklist.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Inventory rules | Route rules (push/pull) under inventory configurations | `plugins/webkul/inventories/src/Filament/Clusters/Configurations/Resources/RuleResource/Pages/ListRules.php`, `plugins/webkul/inventories/src/Filament/Clusters/Configurations/Resources/RuleResource/Schemas/RuleForm.php` |
| Replenishment (stub) | Operations → Replenishment resource over an `OrderPoint` model (manual/automatic trigger), but its table defines no columns yet | `plugins/webkul/inventories/src/Filament/Clusters/Operations/Resources/ReplenishmentResource/Tables/ReplenishmentsTable.php`, `plugins/webkul/inventories/src/Models/OrderPoint.php`, `plugins/webkul/inventories/src/Enums/OrderPointTrigger.php` |
| Product quantities | On-hand/forecast quantities per product/location | `plugins/webkul/inventories/src/Filament/Clusters/Products/Resources/ProductResource/Pages/ManageQuantities.php` |
| Product moves | Stock moves for a product | `plugins/webkul/inventories/src/Filament/Clusters/Products/Resources/ProductResource/Pages/ManageMoves.php` |
| Product vendors | Vendor prices/lead times from the product side | `plugins/webkul/inventories/src/Filament/Clusters/Products/Resources/ProductResource/Pages/ManageVendors.php` |

### Dolibarr — Replenishment page

Dolibarr has a dedicated Replenishment page that computes shortages against supplier
prices/lead times and can generate supplier orders in bulk; a companion page lists the
orders generated by replenishment.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Replenishment | Stock-to-replenish list with supplier price/qty, generate orders | `htdocs/product/stock/replenish.php` |
| Replenishment orders | Orders created from the replenishment run | `htdocs/product/stock/replenishorders.php` |
| Stock list/movements | Stock on hand, movements, lots, valuation (shared inventory screens) | `htdocs/product/stock/list.php`, `movement_list.php`, `productlot_list.php`, `valo.php` |

### metasfresh — material cockpit and planning

metasfresh computes material disposition candidates from demand and shows them in the
material cockpit; purchasing then converts purchase candidates into orders in the
procurement planning window. There is no separate min/max reorder-rule page.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Material cockpit | Demand/supply rows per product/warehouse with candidate details | `backend/de.metas.ui.web.base/src/main/java/de/metas/ui/web/material/cockpit/`, `frontend/src/components/` |
| Material disposition candidates | Candidate business cases including purchase detail | `backend/de.metas.material/dispo-commons/src/main/java/de/metas/material/dispo/commons/candidate/businesscase/PurchaseDetail.java` |
| Procurement planning | Candidate → order worklist | `backend/de.metas.purchasecandidate.base/src/main/sql/postgresql/system/45-de.metas.purchasecandidate/5478250_sys_gh3037-purchase-order-candidates-window-webui.sql` |
| Product planning settings | Product planning policy/lead time used by disposition | `backend/de.metas.material/planning/` |

**BOSS implications.** The evidence favors combining Odoo's editable min/max list,
ERPNext's scheduled auto-reorder and Carbon's time-phased planning grid. One option is a
single **Replenishment** screen that switches views (list, forecast, time-phased) over the
same data, shows on-hand/forecast/incoming/outgoing/qty-to-order, and offers Order /
Automate / Snooze per row. Odoo keeps the rule editor inline, puts the forecast drill-down
one click away, and shows supply warnings ("no vendor/route") before the buyer clicks
Order. The Moqui baseline has the inputs — `ProductFacility.minimumStock` /
`reorderQuantity`, projected inventory from `get#InventoryProjectedInfo`, main/alternate
supplier on `ProductPrice` — and `Requirement` as the natural "suggested order" record,
but no reorder service and no screen (§12). Replenishment is the buyer's version of the
reused Inventory availability screen (also included in Warehouse, Customer Service, Sales,
Manufacturing and Commerce), emphasizing shortfall and reorder (crosscut §3).

---

## 7. Receiving & supplier returns

Receiving and supplier returns are reused screens (Shipment detail and the return record,
also included in Warehouse and Accounting). Purchasing includes them so that a business
without the Warehouse app can still receive and return; the buyer's version centers on the
PO-linked view, receipt progress on lines and the return-authorization flow.

### Odoo — receipts and returns from the PO

The PO's Receive button creates/opens the incoming `stock.picking`; the receipt form has
Reserve, Validate, Print, Return and Exchange actions and shows the source PO. Returns
are created from a done receipt via the Return action, with a return slip report. Line
quantities and receipt status roll up to the PO.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Receipt (incoming picking) form | Source PO, moves, quantities, lot/serial, Validate/Return/Exchange | `odoo/addons/stock/views/stock_picking_views.xml` |
| Receipt list/kanban | Incoming transfers with status, scheduled date, partner | `odoo/addons/stock/views/stock_picking_views.xml` |
| PO → receipt | Receive button, Receipt smart button and purchase fields on the picking | `odoo/addons/purchase_stock/views/purchase_views.xml`, `odoo/addons/purchase_stock/views/stock_picking_views.xml` |
| Return flow | Return creates a return picking; Return All/Clear in draft returns | `odoo/addons/stock/views/stock_picking_views.xml` |
| PO line stock moves | Stock moves shown on the PO line; forecast button | `odoo/addons/purchase_stock/views/purchase_views.xml`, `odoo/addons/stock/views/stock_move_views.xml` |
| Return slip | Printable return document | `odoo/addons/stock/report/report_return_slip.xml` |
| Receipt print | Picking operations/delivery slip | `odoo/addons/stock/report/picking_templates.xml`, `odoo/addons/stock/report/report_stockpicking_operations.xml` |
| Stock lots/serials on receipt | Lot/serial selection and "Purchases" smart button on lots | `odoo/addons/purchase_stock/views/stock_lot_views.xml` |

### ERPNext — Purchase Receipt and Purchase Return

Purchase Receipt records goods received against a PO (or directly); its form creates a
Debit Note (Purchase Return), Purchase Invoice, Landed Cost Voucher or Stock Entry. The
receipt supports `is_return`/`return_against`, and returned quantities roll up to the PO
and bill.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Purchase Receipt form | Supplier, PO, items, accepted/rejected qty, warehouse, return flags | `erpnext/stock/doctype/purchase_receipt/purchase_receipt.json`, `purchase_receipt.js` |
| Purchase Receipt list | Status/supplier/date filters | `erpnext/stock/doctype/purchase_receipt/purchase_receipt_list.js` |
| Receipt → Debit Note | Create Purchase Return from a receipt | `erpnext/stock/doctype/purchase_receipt/purchase_receipt.js` |
| Receipt → Invoice/Landed Cost/Stock Entry | Downstream document actions | `erpnext/stock/doctype/purchase_receipt/purchase_receipt.js` |
| Purchase Invoice from receipt | Invoice against received quantities | `erpnext/accounts/doctype/purchase_invoice/purchase_invoice.js` |

### Carbon — PO receiving and Purchase Return Orders

Carbon records receipts from PO lines (`$orderId.$lineId.receiving`), tracks receipt
status on the PO, and has a full **Purchase Return Order** document (Draft / To Ship /
Completed / Cancelled): supplier RMA number, return location, expiration date,
returnable receipt lines, confirm, replacement order, credit with restock fee, and PDF.
A quality issue whose disposition is *Return to Supplier* can draft the return order.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| PO line receiving | Receive quantities per PO line | `apps/erp/app/routes/x+/purchase-order+/$orderId.$lineId.receiving.tsx` |
| PO delivery form | Delivery location, shipping method, incoterm, dates, tracking, drop-ship | `apps/erp/app/modules/purchasing/ui/PurchaseOrder/PurchaseOrderDeliveryForm.tsx` |
| Purchase returns list | Return orders with status | `apps/erp/app/modules/purchasing/ui/PurchaseReturnOrders/PurchaseReturnOrdersTable.tsx`, `PurchaseReturnOrderExplorer.tsx`; route `apps/erp/app/routes/x+/purchasing+/supplier-returns.tsx` |
| Return order form/header | Supplier, supplier RMA #, supplier contact/location, order and expiration dates, return location, currency; confirm/cancel | `apps/erp/app/modules/purchasing/ui/PurchaseReturnOrders/PurchaseReturnOrderForm.tsx`, `PurchaseReturnOrderHeader.tsx` |
| Returnable receipt lines | Pick receipt lines/quantities to return | `apps/erp/app/modules/purchasing/ui/PurchaseReturnOrders/ReturnableReceiptLinesModal.tsx`; route `apps/erp/app/routes/x+/purchase-return-order+/returnable-lines.tsx` |
| Return credit/replacement | Credit/restock-fee modal and replacement flow | `apps/erp/app/modules/purchasing/ui/PurchaseReturnOrders/PurchaseReturnOrderCreditModal.tsx`; routes `apps/erp/app/routes/x+/purchase-return-order+/$id.credit.tsx`, `$id.replacement.tsx` |
| Return PDF | Printable supplier return (one route file, $id[.]pdf.tsx) | `apps/erp/app/routes/file+/purchase-return-order+/` |
| Quality issue → supplier return | Non-conformance issue with a *Return to Supplier* disposition drafts a Purchase Return Order for the uncovered quantity | `apps/erp/app/modules/quality/ui/Issue/CreateSupplierReturn.tsx`, `DispositionStatus.tsx` |

### AureusERP — receipts and generic inventory returns

Receipts are inventory operations linked to purchase orders, with edit/view/moves pages.
Returns use the Inventories plugin's generic Return action rather than a purchasing
return document; bills and receipts are managed from the PO.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Purchase order receipts | Receipt resource for PO/quote receipts | `plugins/webkul/purchases/src/Filament/Admin/Clusters/Orders/Resources/PurchaseOrderReceiptResource.php`, `plugins/webkul/purchases/src/Filament/Admin/Clusters/Orders/Resources/PurchaseOrderReceiptResource/Pages/ViewReceipt.php` |
| Receipt moves | Stock moves on a receipt | `plugins/webkul/purchases/src/Filament/Admin/Clusters/Orders/Resources/PurchaseOrderReceiptResource/Pages/ManageMoves.php` |
| Manage receipts from PO | Relation page listing receipts | `plugins/webkul/purchases/src/Filament/Admin/Clusters/Orders/Resources/PurchaseOrderResource/Pages/ManageReceipts.php` |
| Inventory receipt pages | Generic receipt create/edit/list/view | `plugins/webkul/inventories/src/Filament/Clusters/Operations/Resources/ReceiptResource/Pages/` |
| Inventory return action | Generic return operation and return slip | `plugins/webkul/inventories/src/Filament/Clusters/Operations/Actions/ReturnAction.php`, `plugins/webkul/inventories/src/Filament/Clusters/Operations/Actions/Print/ReturnSlipAction.php` |

### Dolibarr — Receptions

Receptions are a separate module: a reception card with lines, quantities, batch/lot,
dispatch/put-away and status (Draft/Validated/Processed), created from a supplier order.
Supplier returns are financial credit notes on the supplier invoice rather than a
dedicated return document.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Reception card | Supplier/order link, lines, quantities, status, Validate/Process | `htdocs/reception/card.php` |
| Reception list | Draft/validated/processed filters | `htdocs/reception/list.php` |
| Reception dispatch | Put-away/distribution of received quantities | `htdocs/reception/dispatch.php` |
| Reception documents/notes/contacts | Attachments, notes, contacts | `htdocs/reception/document.php`, `note.php`, `contact.php` |
| Supplier order dispatch | Receive against an order before/alongside a reception | `htdocs/fourn/commande/dispatch.php` |
| Supplier credit note | Return/credit document created from the supplier invoice | `htdocs/fourn/facture/card.php` (`ConvertToReduc` / credit-note flow) |

### metasfresh — vendor returns from receipts

Vendor returns are generated from a completed receipt (`M_InOut`) by a dedicated
process; the receipt/return documents use the generic in-out window. The process is the
reference for "return against receipt" semantics.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Generate vendor return | Process creating a vendor return from a receipt | `backend/de.metas.ui.web.base/src/main/java/de/metas/ui/web/shipment/process/M_InOut_GenerateVendorReturn.java` |
| Receipt/return window | Generic `M_InOut` document window for receipts and returns | `frontend/src/containers/MasterWindowContainer.js`, window definitions under `backend/de.metas.business/src/main/sql/` |

### Akaunting / Ever Gauzy — absent

Akaunting has no receipt or PO-linked return; bills are the only purchasing document.
Gauzy has no receiving or returns at all.

**BOSS implications.** Odoo, ERPNext and Carbon expose receiving from the PO with per-line
received/remaining quantities and a Receive action. Receiving is a reused screen:
Purchasing would include it with a PO context, for buyers in businesses without a separate
warehouse team, and Warehouse includes the same screen with its execution emphasis
(receive, pick, pack, ship, labels). Supplier returns have their own purchasing document in
Carbon, the strongest reference (RMA number, return location, returnable receipt lines,
credit vs replacement). Dolibarr has only a credit note; the other references link the
physical return flow and the financial credit to the same record. Mantle already has that
record: `ReturnHeader` with `vendorPartyId` and `supplierRmaId`, `ReturnItem` responses
(credit, refund, replace) and an outbound `ShpTpPurchaseReturn` shipment. Supplier returns
are reused (crosscut §4): Purchasing includes the return document, Warehouse the outbound
return shipment and Accounting the debit note, over the same record.

---

## 8. Supplier invoices & 3-way match

### Odoo — vendor bills and bill-line matching

Vendor bills are account moves with purchase smart buttons. Odoo ships a bill-line
matching view (`purchase.bill.line.match`) that lists unbilled PO lines beside bill lines
(PO qty, billed qty, qty to invoice, price) with Match and Add to PO actions and
matched/unmatched filters (the model also unmatches); the PO shows billed quantity and a
"Create Bills" action. This is the reference for 2-way bill↔PO matching UI. The
receipt-gated **3-way matching** toggle is an upgrade field (`module_account_3way_match`)
for an Enterprise addon that is not in the community checkout.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Vendor bill form | Bill lines, PO/receipt links, auto-complete, matching status, totals | `odoo/addons/account/views/account_move_views.xml`, `odoo/addons/purchase/views/account_move_views.xml` |
| Auto-Complete | Select purchase document/vendor bill to autocomplete bill lines | `odoo/addons/purchase/views/account_move_views.xml`, `odoo/addons/purchase/report/purchase_bill_views.xml` |
| Bill line — Purchase Order | `purchase_line_id` selector with qty-to-invoice and price comparison hints | `odoo/addons/purchase/views/account_move_views.xml`, `odoo/addons/purchase/views/purchase_views.xml` |
| Bill-line matching list | Match bill lines to PO lines, Add to PO; PO qty / billed / qty to invoice / unit price columns; matched/unmatched filters | `odoo/addons/purchase/views/purchase_bill_line_match_views.xml` |
| Add to PO wizard | Add bill products or a down payment to an existing PO | `odoo/addons/purchase/wizard/bill_to_po_wizard_views.xml` |
| PO — Bill Matching | Bill-matching percentage smart button and matching list link | `odoo/addons/purchase/views/purchase_views.xml` |
| PO → bills | Create Bills action, billed qty, Vendor Bills smart button | `odoo/addons/purchase/views/purchase_views.xml` |
| 3-way matching setting | Upgrade toggle (Enterprise `account_3way_match`, absent here): receipt required before bill payment | `odoo/addons/purchase/views/res_config_settings_views.xml` |

### ERPNext — Purchase Invoice with PO/receipt links

Purchase Invoice is the vendor bill: supplier invoice number/date, PO/receipt references,
items, taxes, payment terms, and actions for Payment, Payment Request, Return/Debit Note
and Block/Unblock/Hold. It is the accounting-side document with purchasing links.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Purchase Invoice form | Supplier bill no./date, PO/receipt refs, items, taxes, terms, totals | `erpnext/accounts/doctype/purchase_invoice/purchase_invoice.json`, `purchase_invoice.js` |
| Purchase Invoice list | Status/supplier/date filters | `erpnext/accounts/doctype/purchase_invoice/purchase_invoice_list.js` |
| Actions | Payment, Payment Request, Return/Debit Note, Block/Unblock, Hold | `erpnext/accounts/doctype/purchase_invoice/purchase_invoice.js` |
| Purchase Order → Invoice | Create Purchase Invoice from PO/receipt | `erpnext/buying/doctype/purchase_order/purchase_order.js` |
| Purchase Receipt → Invoice | Create invoice from received quantities | `erpnext/stock/doctype/purchase_receipt/purchase_receipt.js` |

### Carbon — Purchase Invoice with extraction-assisted mapping

Carbon's invoicing module owns purchase invoices: explorer/list, form (supplier invoice
number, dates, terms, currency, delivery), lines (supplier unit price, costs, GL account,
lease), delivery/properties/summary, post/void modals, and an "map extracted lines"
modal for invoice extraction. It links invoice lines back to orders/receipts.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Purchase invoice list/explorer | Invoice list with status and filters | `apps/erp/app/modules/invoicing/ui/PurchaseInvoice/PurchaseInvoicesTable.tsx`, `PurchaseInvoiceExplorer.tsx` |
| Purchase invoice form | Supplier invoice details, payment terms, currency, delivery | `apps/erp/app/modules/invoicing/ui/PurchaseInvoice/PurchaseInvoiceForm.tsx` |
| Invoice lines | Supplier unit price, costs, GL account, lease, delivery | `apps/erp/app/modules/invoicing/ui/PurchaseInvoice/PurchaseInvoiceLineForm.tsx` |
| Post/void | Post invoice or void it | `apps/erp/app/modules/invoicing/ui/PurchaseInvoice/PurchaseInvoicePostModal.tsx`, `PurchaseInvoiceVoidModal.tsx` |
| Extracted-line mapping | Map OCR/extracted invoice lines to records | `apps/erp/app/modules/invoicing/ui/PurchaseInvoice/MapExtractedInvoiceLinesModal.tsx`, `usePurchaseInvoiceAutoFill.ts` |
| Invoice → order/line links | Link invoice line to order line | `apps/erp/app/routes/x+/purchase-invoice+/$invoiceId.line-order.tsx` |
| Purchase invoice routes | List/new/view/details/post/void | `apps/erp/app/routes/x+/purchase-invoice+/` |

### AureusERP — vendor bills

Bills are managed from the Orders cluster with bill resources for quotations and POs,
plus standalone create/edit/view/payment pages. The PO has ManageBills and CreateBill
actions; bills link back to the order and have payment management.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Purchase order bills | Bill resource for a purchase order | `plugins/webkul/purchases/src/Filament/Admin/Clusters/Orders/Resources/PurchaseOrderBillResource.php`, `plugins/webkul/purchases/src/Filament/Admin/Clusters/Orders/Resources/PurchaseOrderBillResource/Pages/ViewBill.php`, `plugins/webkul/purchases/src/Filament/Admin/Clusters/Orders/Resources/PurchaseOrderBillResource/Pages/EditBill.php` |
| Manage bills from PO | Relation page listing bills | `plugins/webkul/purchases/src/Filament/Admin/Clusters/Orders/Resources/PurchaseOrderResource/Pages/ManageBills.php` |
| Bill payments | Payment relation/management page | `plugins/webkul/purchases/src/Filament/Admin/Clusters/Orders/Resources/PurchaseOrderBillResource/Pages/ManagePayments.php` |
| Create bill from PO | CreateBill action | `plugins/webkul/purchases/src/Filament/Admin/Clusters/Orders/Resources/OrderResource/Actions/CreateBillAction.php` |
| Quotation bills | Bill resource before order confirmation | `plugins/webkul/purchases/src/Filament/Admin/Clusters/Orders/Resources/QuotationBillResource.php` |

### Dolibarr — Supplier Invoice card

The supplier invoice card carries vendor, project, lines, totals, payments, credit notes
and a bank-transfer tab. Statuses Draft/Validated/Paid/Abandoned; actions Validate, Pay,
Convert to credit note, Reopen, Send by email, Dispatch to accounting.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Supplier invoice card | Vendor, project, lines, totals, payments, status actions | `htdocs/fourn/facture/card.php` |
| Supplier invoice list | Status/payment/aging filters | `htdocs/fourn/facture/list.php` |
| Recurring supplier invoices | Template invoices | `htdocs/fourn/facture/card-rec.php`, `list-rec.php` |
| Supplier payments | Payment entry/listing | `htdocs/fourn/facture/paiement.php`, `htdocs/fourn/paiement/` |
| Invoice documents/contacts/notes | Attachments, contacts, notes | `htdocs/fourn/facture/document.php`, `contact.php`, `note.php` |

### Akaunting — Bills

Akaunting's vendor bill is the purchase document: vendor, bill number/date, due date,
items, taxes, attachments, status and payments. Recurring bills cover repeat purchases;
there is no PO/receipt link.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Bills list | Status/due-date filters and bulk actions | `resources/views/purchases/bills/index.blade.php` |
| Bill create/edit | Vendor, dates, line items, taxes, attachment | `resources/views/purchases/bills/create.blade.php`, `edit.blade.php` |
| Bill detail | Status, payment history, actions | `resources/views/purchases/bills/show.blade.php` |
| Bill print | Printable bill | `resources/views/purchases/bills/print.blade.php` |
| Recurring bills | Template list/form/detail | `resources/views/purchases/recurring_bills/` |

### metasfresh — Purchase Invoice Candidates

Purchase invoice candidates are the buyer/AP work queue: open receipts/orders become
invoice candidates, which are aggregated/processed into vendor invoices. The window
includes purchaser, grand total, invoicing status and delivery status columns.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Purchase invoice candidates window | Invoice disposition queue (Rechnungsdisposition Einkauf) | `backend/de.metas.adempiere.adempiere/migration/src/main/sql/postgresql/system/10-de.metas.adempiere/5569820_sys_gh10074_CreateWindow_PurchaseOrderCandidates.sql` |
| Purchaser/invoice status columns | Purchaser, grand total, status color fields | `backend/de.metas.fresh/de.metas.fresh.base/src/main/sql/postgresql/system/70-de.metas.fresh/5767780_sys_gh24241_Purchaser_User_Field.sql`, `5750740_sys_gh20510_Invoice_Candidate_InvoicingStatusColor.sql` |
| Payment allocation | Allocate vendor payments/invoices | `backend/de.metas.banking/de.metas.banking.base/src/main/java/de/metas/banking/payment/paymentallocation/`, `backend/de.metas.ui.web.base/src/main/java/de/metas/ui/web/payment_allocation/` |

**BOSS implications.** What buyers need in the references is invoice status and *matching
exceptions* on the PO: received-not-invoiced, invoiced-not-received, price/quantity
variance. Supplier invoices and 3-way match are reused across Purchasing and Accounting
(crosscut §4): Purchasing would include the match-exceptions screen and holds against PO
and receipt, plus the same supplier-invoice screen Accounting includes, so a buyer can
open and resolve a bill without leaving the app. Bill entry, posting and payment are
Accounting's emphasis; Purchasing's version centers on the match and an "on hold /
blocked" reason (ERPNext Hold/Block Invoice). Mantle can compute all three exceptions:
`OrderItemBilling` links an order item to an invoice item and optionally to the
`AssetReceipt` that received it, and the SimpleScreens invoice already has Orders and
Shipments tabs that apply invoice items to them (§12). Odoo's line-match list and Carbon's
extracted-line mapping are the two strongest additions: a match/unmatch screen with
variance highlighting, and an import path that maps supplier PDF/OCR lines onto PO/receipt
lines.

---

## 9. Supplier performance & reporting

### Odoo — purchase analysis, OTD, purchase history

Reporting is a pivot/graph/list over purchase order lines with ordered/received/billed
measures, plus a vendor on-time-delivery report and a per-product purchase history.
The RFQ list itself carries KPI cards and the kanban dashboard; vendor forms show an
on-time rate.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Purchase Analysis | Pivot/graph/list: ordered, received, billed quantities/amounts by vendor/product/period | `odoo/addons/purchase/report/purchase_report_views.xml`, `odoo/addons/purchase/report/purchase_reports.xml` |
| Purchase Analysis with stock filters | Adds receipt operation type to analysis | `odoo/addons/purchase_stock/report/purchase_report_views.xml` |
| On-time Delivery | Vendor OTD graph (default last year) | `odoo/addons/purchase_stock/report/vendor_delay_report.xml` |
| Vendor OTD on form | On-time rate smart button/field on supplier | `odoo/addons/purchase_stock/views/res_partner_views.xml` |
| Product purchase history | Past PO lines list/pivot/graph by product/vendor | `odoo/addons/purchase/views/purchase_views.xml` |
| RFQ/PO dashboard KPIs | New, sent, late, not acknowledged, late receipt, days to order/OTD | `odoo/addons/purchase/static/src/views/purchase_dashboard.xml`, `odoo/addons/purchase_stock/static/src/purchase_dashboard/purchase_dashboard.xml` |

### ERPNext — Supplier Scorecard and buying reports

ERPNext has the most developed supplier-performance model: scorecards with weighted
criteria, variables, standings and evaluation periods. Buying reports cover quote
comparison, procurement tracking, purchase history, analytics, order analysis/trends and
top suppliers; the workspace surfaces them as cards/charts.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Supplier Scorecard | Scorecard definition, criteria weights, periods, standings | `erpnext/buying/doctype/supplier_scorecard/`, `erpnext/buying/doctype/supplier_scorecard_period/` |
| Scorecard criteria/variables | Criteria, scoring criteria, variables and standings | `erpnext/buying/doctype/supplier_scorecard_criteria/`, `erpnext/buying/doctype/supplier_scorecard_scoring_criteria/`, `erpnext/buying/doctype/supplier_scorecard_scoring_variable/`, `erpnext/buying/doctype/supplier_scorecard_scoring_standing/`, `erpnext/buying/doctype/supplier_scorecard_standing/`, `erpnext/buying/doctype/supplier_scorecard_variable/` |
| Supplier Quotation Comparison | Compare quotes for an RFQ | `erpnext/buying/report/supplier_quotation_comparison/` |
| Procurement Tracker | Request → RFQ → PO → receipt status | `erpnext/buying/report/procurement_tracker/` |
| Item-wise Purchase History | Purchase history per item/vendor | `erpnext/buying/report/item_wise_purchase_history/` |
| Purchase Analytics | Buying analytics report | `erpnext/buying/report/purchase_analytics/` |
| Purchase Order Analysis / Trends | PO analysis and trend reports | `erpnext/buying/report/purchase_order_analysis/`, `erpnext/buying/report/purchase_order_trends/` |
| Top Suppliers / buying charts | Top-supplier chart and buying dashboard | `erpnext/buying/dashboard_chart/top_suppliers/`, `erpnext/buying/buying_dashboard/buying/` |
| Buying number cards | Active suppliers, annual purchase, average order value, PO count, to bill/receive | `erpnext/buying/number_card/` |

### Carbon — dashboard KPIs and supplier risk

Carbon's purchasing landing page is the main performance surface: supplier quote, PO,
invoice counts/amounts, pending approvals, documents assigned to me and a purchase trend
chart. Supplier quality/risk is captured in the supplier risk register rather than a
scorecard; reports include a purchases pivot in the accounting reports module.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Purchasing KPIs | Quote/PO/invoice counts and amounts via KPI API | `apps/erp/app/modules/purchasing/purchasing.models.ts`, `apps/erp/app/routes/api+/purchasing.kpi.$key.ts` |
| Purchasing dashboard | KPI cards, approvals, assigned documents, purchase trend chart | `apps/erp/app/routes/x+/purchasing+/_index.tsx` |
| Supplier risk register | Risk entries/assessment per supplier | `apps/erp/app/modules/purchasing/ui/Supplier/SupplierRiskRegister.tsx` |
| Supplier status | Active/inactive/pending/rejected status indicator | `apps/erp/app/modules/purchasing/ui/Supplier/SupplierStatusIndicator.tsx` |
| Purchases report | Purchase-line pivot with period/dimension grouping, CSV export, drill-down drawer | `apps/erp/app/routes/x+/reports+/purchases.tsx`, `apps/erp/app/modules/accounting/ui/Reports/` |

### AureusERP — no dedicated purchasing reports

The purchases plugin ships resources and settings, not report pages; analytics is a
generic records plugin. Reporting on purchases would go through the Analytics/Accounting
plugins rather than the purchase cluster.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Purchases report pages | None found in the purchases plugin | `plugins/webkul/purchases/src/Filament/` (resources/pages only) |
| Generic analytics records | Analytics record model/resource | `plugins/webkul/analytics/src/Models/Record.php`, `src/Http/Resources/V1/RecordResource.php` |

### Dolibarr — supplier statement, payment reports, reception stats

Dolibarr's performance/reporting surface is document-oriented: a supplier statement
(invoices/payments/running balance), payment reports by year, reception statistics by
month, and supplier invoice aging/recap pages.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Supplier statement | Invoices, payments and running balance for one supplier; PDF/XLSX export | `htdocs/fourn/recap-fourn.php` |
| Payment reports | Generate/download payment reports by year | `htdocs/fourn/facture/rapport.php` |
| Reception statistics | Number/amount/average receptions by month/year | `htdocs/reception/stats/index.php`, `htdocs/reception/stats/month.php` |
| Supplier invoice aging | Aged payables/recap | `htdocs/fourn/facture/list.php` |

### Akaunting — financial summaries only

Akaunting reports are financial, not supplier-performance: expense summary, profit/loss,
income summary, tax summary and discount summary. Vendor balances appear on the vendor
record; there is no OTD, scorecard or purchasing analysis.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Expense summary | Expense totals by category/vendor/period | `app/Reports/ExpenseSummary.php` |
| Profit & loss | P&L report | `app/Reports/ProfitLoss.php`, `resources/views/reports/profit_loss/detail.blade.php` |
| Tax summary | Tax report | `app/Reports/TaxSummary.php` |
| Income/expense summary | Combined income/expense report | `app/Reports/IncomeExpenseSummary.php` |
| Income summary / discount summary | Additional financial reports | `app/Reports/IncomeSummary.php`, `app/Reports/DiscountSummary.php` |

### metasfresh — vendor evaluation and purchase reports

metasfresh exposes vendor evaluation and purchase reporting as report/process entries:
Vendor Evaluation Excel, Purchase by Product and Vendor (Jasper), Purchase Trace Excel,
goods purchased, and purchase price/availability trend reports, alongside the material
cockpit.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Vendor Evaluation | Vendor evaluation Excel report menu/process | `backend/de.metas.fresh/de.metas.fresh.base/src/main/sql/postgresql/system/75-de.metas.fresh.reports/5491270_sys_gh3768_add_excel_in_webui_menu.sql` |
| Purchase by Product and Vendor | Jasper purchase report | `backend/de.metas.fresh/de.metas.fresh.base/src/main/sql/postgresql/system/75-de.metas.fresh.reports/5805420_AddReportGoodsPurchased.sql` |
| Purchase Trace | Sales/purchase trace Excel process and menu | `backend/de.metas.fresh/de.metas.fresh.base/src/main/sql/postgresql/system/75-de.metas.fresh.reports/5448871_sys_FRESH-567_purchase_trace_process.sql`, `backend/de.metas.fresh/de.metas.fresh.base/src/main/sql/postgresql/system/75-de.metas.fresh.reports/5448872_sys_FRESH-567_add_sales_and_purchase_trace_process_in_menu.sql` |
| Purchase price/availability trends | Price and availability trend reports/menus | `backend/de.metas.ui.web.base/src/main/sql/postgresql/system/41-de.metas.ui.web.base/5459622_sys_gh1277_WEBUI_AD_Menu_dump.sql` |
| Material cockpit | Demand/supply analysis grid | `backend/de.metas.ui.web.base/src/main/java/de/metas/ui/web/material/cockpit/` |

**BOSS implications.** The references divide the area in two: a **supplier scorecard**
(quality, OTD, price variance, responsiveness, risk) and **operational reports** (spend by
supplier/product/category/period, open commitments, late receipts, invoice variances).
ERPNext's scorecard is the only full model; Odoo's OTD and purchase analysis are the
minimum metrics. One option is the same pivot/list views Insights uses, with saved views
per buyer, rather than a separate reporting module inside Purchasing. Carbon's purchase
pivot (grouping, CSV, drill-down) is the strongest interaction pattern found. The quality
input is quality inspection, a function included in Warehouse and Manufacturing (crosscut
§4); in Mantle the receipt-level signal is `AssetReceipt.quantityRejected` +
`rejectionReasonEnumId`, OTD can be computed from `OrderItem.requiredByDate` /
`OrderPart.estimatedDeliveryDate` against `AssetReceipt.receivedDate`, and
`ProductPrice.supplierRatingTypeEnumId` is an unused per-product supplier rating slot (no
enum values seeded).

---

## 10. Settings & configuration

### Odoo — purchase settings and configuration menu

Purchase settings control approvals, order locking, warnings, agreements, receipt
reminders, alternatives and bill control; the Configuration menu holds vendor pricelists
and product attributes/categories/units. Incoterms, payment terms and currencies live in
Accounting settings but are consumed by POs.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Purchase Settings | Orders (approval, lock, warnings, agreements, reminders, alternatives), invoicing, products | `odoo/addons/purchase/views/res_config_settings_views.xml` |
| Purchase Configuration menu | Vendor Pricelists, Attributes, Categories, Units & Packagings, Settings | `odoo/addons/purchase/views/purchase_views.xml`, `odoo/addons/product/views/` |
| Incoterms | Incoterm list/form | `odoo/addons/account/views/account_incoterms_view.xml` |
| Payment Terms | Payment term list/form and lines | `odoo/addons/account/views/account_payment_term_views.xml` |
| Currencies | Currency list/form and rates | `odoo/odoo/addons/base/views/res_currency_views.xml` |
| Units & Packagings | UoM list/form | `odoo/addons/uom/views/uom_uom_views.xml` |
| Product category accounts | Bills to Receive / Billed not Received accounts | `odoo/addons/purchase/views/product_views.xml` |
| Buyer/approval security | Purchase User vs Administrator groups | `odoo/addons/purchase/security/purchase_security.xml` |
| Inventory purchase settings | Days to Purchase, dropshipping, MTO | `odoo/addons/purchase_stock/views/res_config_settings_views.xml` |

### ERPNext — Buying Settings and setup DocTypes

Buying Settings enforces process rules: PO required for invoice/receipt, receipt required
for invoice, same-rate throughout the cycle, multiple items, subcontracting, over-transfer
allowance, last-purchase-rate behavior, blanket-order allowance, auto-create receipt/order
and zero-quantity POs. Supplier groups, incoterms and terms are setup DocTypes.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Buying Settings | PO/receipt requirements, rate rules, subcontracting, allowances, defaults | `erpnext/buying/doctype/buying_settings/buying_settings.json`, `erpnext/buying/doctype/buying_settings/buying_settings.py` |
| Supplier Group | Hierarchical supplier grouping with payment terms | `erpnext/setup/doctype/supplier_group/supplier_group.json` |
| Incoterm | Incoterm setup | `erpnext/setup/doctype/incoterm/` |
| Terms and Conditions | Terms templates | `erpnext/setup/doctype/terms_and_conditions/` |
| Item / price list / UOM | Product, buying price list and unit setup consumed by POs | `erpnext/stock/doctype/item/`, `erpnext/stock/doctype/price_list/` |

### Carbon — supplier types, approvals and saved views

Carbon's purchasing configuration is intentionally thin: supplier types, approval
workflows (enterprise approvals package), permission-gated routes and user saved views
for each list. Product/item purchasing data lives in the Items module.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Supplier types | Configure supplier types | `apps/erp/app/modules/purchasing/ui/SupplierTypes/SupplierTypesTable.tsx`, `SupplierTypeForm.tsx`, route `apps/erp/app/routes/x+/purchasing+/supplier-types.tsx` |
| Approval workflow | PO approval requests and approver routing | `apps/erp/app/modules/purchasing/ui/PurchaseOrder/PurchaseOrderApprovalModal.tsx`, `packages/ee/src/approvals` |
| Saved views | Per-user list views added to every purchasing route | `apps/erp/app/modules/purchasing/ui/usePurchasingSubmodules.tsx` (`useSavedViews`) |
| Permission gate | Role/permission filtering of purchasing nav/routes | `apps/erp/app/modules/purchasing/ui/usePurchasingSubmodules.tsx` (`usePermissions`) |

### AureusERP — Manage Orders / Manage Products

AureusERP exposes purchasing settings as two settings pages: order approval threshold,
confirmed-order locking and purchase-agreement enablement; product variants, UoM and
packagings. The Configurations cluster holds vendor prices, currencies, packaging,
attributes, categories and UoM.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Manage Orders | Enable order approval, minimum amount, lock confirmed orders, purchase agreements | `plugins/webkul/purchases/src/Filament/Admin/Clusters/Settings/Pages/ManageOrders.php` |
| Manage Products | Enable variants, UoM and packagings; configure packagings | `plugins/webkul/purchases/src/Filament/Admin/Clusters/Settings/Pages/ManageProducts.php` |
| Configurations cluster | Vendor prices, currencies, packaging, attributes, categories, UoM | `plugins/webkul/purchases/src/Filament/Admin/Clusters/Configurations/` |
| Vendor price config | Vendor/product/price/currency/min qty/lead time | `plugins/webkul/purchases/src/Filament/Admin/Clusters/Configurations/Resources/VendorPriceResource/Schemas/VendorPriceForm.php` |

### Dolibarr — module setup pages

Each purchasing module has its own setup page: supplier order numbering/approval options,
supplier invoice/payment options, supplier proposal options and reception setup.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Supplier Order setup | Numbering, approval levels, default options | `htdocs/supplier_order/admin/supplier_order.php` |
| Supplier Invoice setup | Invoice/payment options and numbering | `htdocs/supplier_invoice/admin/supplier_invoice.php`, `htdocs/supplier_invoice/admin/supplier_payment.php` |
| Supplier Proposal setup | Proposal numbering/options | `htdocs/supplier_proposal/admin/supplier_proposal.php` |
| Reception setup | Reception numbering/options | `htdocs/admin/reception_setup.php` |
| Module descriptors | Permissions, menus and constants for each module | `htdocs/core/modules/modSupplierOrder.class.php`, `htdocs/core/modules/modSupplierInvoice.class.php`, `htdocs/core/modules/modSupplierProposal.class.php`, `htdocs/core/modules/modReception.class.php`, `htdocs/core/modules/modFournisseur.class.php` |

### Akaunting — general settings only

Purchasing has no module settings; vendors/bills use general categories, taxes,
currencies, payment terms and email templates from Settings.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Settings | Company, currencies, taxes, categories, invoice settings, email templates | `resources/views/settings/` |
| Categories | Item/category setup used by bill lines | `resources/views/settings/categories/` |
| Taxes | Tax rates used on bills | `resources/views/settings/taxes/` |

### metasfresh — sysconfigs and product planning

metasfresh has no purchasing settings page; behavior is controlled by system
configurations (purchase-candidate order creation, reminders), product planning data and
vendor product records. Windows/menus are metadata.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Purchase-candidate order creation config | Sysconfigs controlling PO creation from candidates | `backend/de.metas.purchasecandidate.base/src/main/sql/postgresql/system/45-de.metas.purchasecandidate/5791020_sys_PurchaseCandidate_POCreation_SysConfigs.sql` |
| Candidate reminders | Reminder scheduler/controller for purchase candidates | `backend/de.metas.ui.web.base/src/main/java/de/metas/purchasecandidate/reminder/` |
| Product planning data | Planning policy/lead time per product | `backend/de.metas.material/planning/` |
| Vendor product/schedule | Vendor product info and purchase schedule | `backend/de.metas.purchasecandidate.base/src/main/java/de/metas/purchasecandidate/VendorProductInfo.java`, `backend/de.metas.purchasecandidate.base/src/main/sql/postgresql/system/45-de.metas.purchasecandidate/5493100_sys_gh4002_C_BP_PurchaseSchedule_window_tab.sql` |

**BOSS implications.** The settings that matter in the references are process rules that
change behavior, not just labels: PO approval threshold, whether receipt is required
before bill, whether same-rate is enforced, default buying price list/currency,
over-receipt allowance, auto-reorder on/off, and the RFQ response window. ERPNext's Buying
Settings is the most complete checklist. Supplier types/groups, incoterms, payment terms
and units are configuration records shared with Admin and Accounting; one option is a
reused settings screen over the same records, included where each app's audience needs it
(where shared configuration is edited is a crosscut §8 question).

---

## 11. Cross-app surfaces

Reused screens as listed in crosscut §3 (reused screens) and §4 (overlapping functions).
Purchasing includes each in the form a buyer needs, so a business running only Purchasing
can source, order, receive, return and match in one app; the other apps include the same
screens with their own context.

| Reused screen or link | Use in Purchasing | Other apps that include it | Reference evidence |
| --- | --- | --- | --- |
| **Supplier 360** | The fullest version: party, contacts and addresses, purchasing terms, supplier prices, open RFQs/quotes/POs, receipts, returns, scorecard and risk, approval status | Accounting (AP balance, bills, payments), Products (supplier-price rows), Warehouse (inbound receipts) | Carbon supplier sidebar (Quotes, Orders, Invoices, Risks, Parts) and supplier approval; ERPNext Supplier + Scorecard standings; Odoo vendor Purchase tab, smart buttons and On-time Rate; AureusERP vendor sub-pages; Dolibarr supplier card tabs |
| **Order detail** (purchase orders) | Purchase action set: send RFQ/PO, confirm, approve (amount threshold), hold, revise, lock, cancel, close; per-line received/billed progress; links to receipts, bills, returns | Sales, Customer Service, Warehouse (receiving and fulfillment), Accounting (invoices and payments), Commerce | Odoo PO status bar and Lock/Unlock; ERPNext Hold/Close/Update Items and create menu; Carbon PO header, revisions, approval modal; Dolibarr Validate/Approve/Approve 2/Refuse |
| **Product 360** | Supplier prices: supplier, supplier item id/name, price breaks, currency, lead time, main/alternate supplier, drop-ship; purchase history | Products (master data), Commerce, Manufacturing, Warehouse, Accounting, Sales | Odoo `product.supplierinfo` on the product Purchase tab; Carbon item supplier parts; AureusERP product Vendors tab; ERPNext Item Supplier + Item Lead Time; Dolibarr supplier products |
| **Inventory availability** | Replenishment: on hand, projected, incoming, min/reorder, suggested quantity, preferred supplier | Warehouse (full stock), Customer Service, Sales, Manufacturing, Commerce | Odoo replenishment report; ERPNext projected qty / items to be requested; Carbon Material Planning; Dolibarr Replenishment; metasfresh material cockpit |
| **Shipment detail** (receiving) | Receiving against PO: expected and late receipts, Receive action, received/remaining per PO line; outbound supplier-return shipments | Warehouse (receive, pick, pack, ship), Customer Service and Sales (tracking), Commerce, Accounting | Odoo Receive / Receipt smart button; ERPNext Purchase Receipt from PO; Carbon PO line receiving; Dolibarr receptions from the order; AureusERP Manage Receipts |
| **Request / case** | Purchase requests: `Request` type `RqtPurchase` with items, required-by, suggested supplier; Purchasing's version adds the request list, approval and "create RFQ/PO" actions | Customer Service, Maintenance, Projects, Sales, Warehouse, Commons | ERPNext Material Request and its create buttons; metasfresh legacy requisition; (Odoo, AureusERP, Carbon, Dolibarr lack it) |
| **Supplier invoices & 3-way match** | Match exceptions and holds on the PO: received-not-billed, billed-not-received, price and quantity variance, bill on hold with reason; the supplier invoice itself to review and resolve | Accounting (AP bills, posting, payment) | Odoo bill-line matching and Bill Matching smart button; ERPNext Hold/Block Invoice; Carbon invoice line → order line and extracted-line mapping; metasfresh purchase invoice candidates |
| **Supplier returns** | Return document with supplier RMA, lines from receipts, credit vs replacement, and its return shipment | Warehouse (outbound return shipment, `ShpTpPurchaseReturn`), Accounting (debit note) | Carbon Purchase Return Order (and quality-issue bridge); ERPNext Debit Note from receipt; Odoo receipt Return; metasfresh vendor return from receipt |
| **Quality inspection** | Supplier quality score: rejected quantity and reasons per supplier feed the scorecard | Warehouse (receiving and returns inspection), Manufacturing (in-process and final) | ERPNext scorecard criteria; Carbon supplier risk register and quality issues |
| **Approvals waiting** | PO approvals (amount threshold) and purchase-request approvals, as a filtered list and in the header Notifications panel | Header (all apps); People, Projects, Sales, Accounting approval lists | Carbon Assigned to Me with pending approvals; Odoo To Approve state; Dolibarr two-level approval; AureusERP approval threshold setting |
| **Chatter & activities** | Timeline on supplier, request, RFQ, PO and return: sent RFQs/POs, supplier replies, attachments, follow-ups | Every app's record screens | Odoo chatter on PO and RFQ (not re-researched here); Carbon supplier documents; ERPNext RFQ email to suppliers |
| **Dashboard widgets** | Landing-page cards and charts: open POs, to receive, to bill, late receipts, spend by supplier, OTD | Insights, every app's landing page | ERPNext Buying number cards and charts; Carbon purchasing KPIs; Odoo RFQ KPI strip and Purchase Analysis |
| **Per-app settings** | Purchasing settings: approval threshold, lock confirmed POs, receipt-before-bill rule, same-rate rule, RFQ defaults, auto-reorder | Every app (its own settings section); Admin (settings index) | Odoo Purchase Settings; ERPNext Buying Settings; AureusERP Manage Orders; Dolibarr module setup pages |

---

## 12. Current Moqui baseline (mr-marble / MarbleERP / Mantle)

The baseline covers the procure-to-pay records end to end but has no purchasing app:
suppliers are a thin party screen, purchase orders share the generic Order screens,
purchase requests exist only as `Request` items with a "Create Purchase Order" button,
and there is nothing for RFQs, supplier quotes, replenishment, scorecards or match
exceptions. MarbleERP mounts the SimpleScreens trees (`Supplier`, `Order`, `Request`,
`Return`, `Shipment`, `Accounting`) and its flow-map dashboard links them in
procure-to-pay order; `component/mr-boss/screen/` has no purchasing screens yet.

### Screens

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Find Supplier | Party search (search string) limited to the Supplier role; Create Person / Create Organization dialogs; list with a **Purchase Orders** link per supplier | `component/mr-marble/screen/SimpleScreens/Supplier/FindSupplier.xml`, `component/mr-marble/screen/SimpleScreens/Supplier.xml` |
| Edit Supplier | Generic party sections: party detail, roles, identifications, notes, contact info, payment methods, financial accounts, content, find duplicates; **Orders** link. No terms, prices, documents or performance | `component/mr-marble/screen/SimpleScreens/Supplier/EditSupplier.xml` (sections from `Party/EditParty.xml`) |
| Supplier financial info | Open purchase orders for the supplier (`OrderPlaced` … `OrderSent`) beside AR/AP info | `component/mr-marble/screen/SimpleScreens/Party/FinancialInfo.xml` (`PurchaseOrderList`) |
| Vendors (not suppliers) | Internal selling organizations (roles Vendor, VendorBillFrom, OrgInternal) with accounting setup and reps; not the supplier list | `component/mr-marble/screen/SimpleScreens/Vendor/{FindVendor,EditVendor}.xml` |
| Find Order | Sales/Purchase/Any filter, vendor and customer filters, purchase item type; **Create Purchase Order** dialog (supplier from Supplier/Vendor roles, customer org, facility, ship-before and estimated delivery dates) | `component/mr-marble/screen/SimpleScreens/Order/FindOrder.xml` |
| Order detail | One screen for sales and purchase parts (part header reads "Purchase Order Part"); request, propose, place, approve, **Mark order as Sent** (approved POs), hold, cancel part/item, clone, **Create Shipment** (incoming `ShpTpPurchase` for a PO), **Create Invoice**, return from order, notes, content, email, PDF | `component/mr-marble/screen/SimpleScreens/Order/OrderDetail.xml`, `Order/OrderItems.xml`, `Order/PrintOrder.xml` |
| Requests | Find/edit requests of any type; **Request Items** tab with product, quantity, required-by, selected/maximum amount, status and **supplier**, plus **Create Purchase Order** (one PO per supplier) and links to the resulting orders | `component/mr-marble/screen/SimpleScreens/Request/{FindRequest,EditRequest,EditRequestItems}.xml` |
| Shipments (incoming) | Find by type (MarbleERP links `ShpTpIncoming`); shipment detail with **Receive Entire Shipment** and per-item receive (accepted and rejected quantity with rejection reason, facility/location, lot/serial, cost) | `component/mr-marble/screen/SimpleScreens/Shipment/{FindShipment,ShipmentDetail}.xml`, `Shipment/ShipmentDetail/ReceiveItem.xml` |
| Returns | Find returns; **Create Supplier Return** (supplier, customer org); edit return with request/approve/cancel; return items; add order items | `component/mr-marble/screen/SimpleScreens/Return/{FindReturn,EditReturn,EditReturnItems,AddOrderItems}.xml` |
| Supplier prices | Product **Prices** tab: `ProductPrice` rows with type, purpose, **Vendor**, customer, **Other Party Product ID**, dates, store, min quantity, price, currency, term; lead time, main/alternate and drop-ship fields are not on the form | `component/mr-marble/screen/SimpleScreens/Catalog/Product/EditPrices.xml` |
| Reorder levels | Product-by-facility **minimum stock**, **reorder quantity**, days to ship (also on the product's facility section) | `component/mr-marble/screen/SimpleScreens/Facility/EditFacilityProducts.xml`, `Catalog/Product/EditProduct.xml` |
| Payables | **New Payable**, Supplier Credit Memo; invoice **Orders** and **Shipments** tabs that apply invoice items to order items or shipment items; payable aging | `component/mr-marble/screen/SimpleScreens/Accounting/Invoice/{FindInvoice,EditInvoice,EditInvoiceItemOrders,EditInvoiceItemShipments,Aging}.xml` |
| Flow map | Procure-to-pay links: Suppliers, Purchase Requests, Purchase Orders & Quotes, Purchase Shipments, Supplier Credit Memos, Supplier Payments, Purchase Returns, Supplier Return Shipments | `component/mr-marble/screen/marble/dashboard.xml` |

### Data model available

| Entity / enum | What it gives Purchasing | Key files |
| --- | --- | --- |
| `Party` + `PartyRole` `Supplier` | Supplier identity; `PartySetting` (typed per-party values) could hold default terms, there are no supplier-terms fields | `component/mr-mantle/entity/PartyEntities.xml` |
| `ProductPrice` with `vendorPartyId` | The supplier-price row: `price`, `priceUomId`, `minQuantity`, `quantityIncrement`, from/thru dates, `otherPartyItemId` / `otherPartyItemName` (supplier part), `standardLeadTimeDays`, `preferredOrderEnumId` (`SpoMain`, `SpoAlternate`), `supplierRatingTypeEnumId` (no values seeded), `canDropShip`, `agreementId`; no separate supplier-product entity | `component/mr-mantle/entity/ProductDefinitionEntities.xml` |
| `OrderHeader`, `OrderPart`, `OrderItem` | PO = order part whose `customerPartyId` is the internal org and `vendorPartyId` the supplier; part has `otherPartyOrderId` / `otherPartyOrderDate` (supplier order number), `tradeTermEnumId` (incoterm), `settlementTermId`, `facilityId`, estimated ship/delivery dates; header has `orderRevision`; items have `requiredByDate`, `standardCost`. Statuses `OrderOpen`, `OrderRequested`, `OrderProposed`, `OrderPlaced`, `OrderApproved`, `OrderSent`, `OrderHold`, `OrderProcessing`, `OrderCompleted`, `OrderRejected`, `OrderCancelled`, plus `OrderAutoReorder` (unused) | `component/mr-mantle/entity/OrderEntities.xml` |
| `Request` type `RqtPurchase`, `RequestItem`, `RequestItemOrder` | Purchase request: header (facility, currency, filed-by, response required date), items (product, quantity, required-by, maximum amount, `supplierPartyId`), item → PO item link. Request statuses Draft / Submitted / Reviewed / In Progress / Completed / Cancelled — no Approved | `component/mr-mantle/entity/RequestEntities.xml` |
| `Requirement` (+ `RequirementOrderItem`, `RequirementRequestItem`, `RequirementBudgetAllocation`, `RequirementParty`) | Planning output: type `RqTpCustomer` / `RqTpInternal` / `RqTpProduct` / `RqTpInventory` / `RqTpWork`, facility, product, quantity, required-by, estimated budget; statuses Proposed / Created / Approved / Ordered / Rejected; links to PO items, request items and budget items | `component/mr-mantle/entity/RequestEntities.xml` |
| `ProductFacility` | `minimumStock`, `reorderQuantity`, `daysToShip` per product and facility | `component/mr-mantle/entity/FacilityEntities.xml` |
| `Shipment` (`ShpTpIncoming` → `ShpTpPurchase`, `ShpTpPurchaseReturn`), `AssetReceipt` | Inbound shipments against POs; receipt rows with order item, shipment, `quantityAccepted`, `quantityRejected`, `rejectionReasonEnumId`, `receivedDate` | `component/mr-mantle/entity/ShipmentEntities.xml`, `component/mr-mantle/entity/ProductAssetEntities.xml` |
| `ReturnHeader`, `ReturnItem` | Supplier return: `vendorPartyId`, `supplierRmaId`, facility, carrier; items with reason, response (`RrspCredit`, `RrspRefund`, `RrspReplace`), `replacementOrderId`; statuses `ReturnCreated` … `ReturnCompleted` | `component/mr-mantle/entity/OrderEntities.xml` |
| `Invoice`, `OrderItemBilling` | Purchase invoice (statuses `InvoiceIncoming`, `InvoiceReceived`, `InvoiceApproved`, `InvoicePmtSent`, …); `OrderItemBilling` ties order item ↔ invoice item ↔ `assetReceiptId` / `shipmentId` with quantity and amount — the 3-way match data | `component/mr-mantle/entity/AccountingAccountEntities.xml`, `component/mr-mantle/entity/OrderEntities.xml` |
| `Agreement`, `AgreementItem` | Could carry blanket orders, but agreement types are `AgrProduct`, `AgrSales`, `AgrEmployment`, `AgrCommission`, `AgrEula`, `AgrOther` — no purchase type; `ProductPrice.agreementId` can hold negotiated prices | `component/mr-mantle/entity/PartyEntities.xml` |

### Services

| Service | Purpose | Key files |
| --- | --- | --- |
| `create#Order`, `create#OrderPart`, `add#OrderProductQuantity`, `place#Order`, `approve#Order`, `update#OrderStatus`, `cancel#Order`, `clone#Order`, `increment#OrderRevision` | PO lifecycle on the shared order record | `component/mr-mantle/service/mantle/order/OrderServices.xml` |
| `create#PurchaseRequestOrder` | Request → one PO per `RequestItem.supplierPartyId`, with `RequestItemOrder` links; optionally places and approves | `component/mr-mantle/service/mantle/order/OrderServices.xml` |
| `get#OrderProductPrice`, `get#ProductPrice` | PO line price from `ProductPrice` rows matching the order part's `vendorPartyId` | `component/mr-mantle/service/mantle/product/PriceServices.xml` |
| `get#InventoryProjectedInfo`, `get#AvailableInventory`, `get#AvailableInventoryMulti` | Projected on hand with open order items and production; availability | `component/mr-mantle/service/mantle/product/InventoryReportServices.xml`, `component/mr-mantle/service/mantle/product/AssetServices.xml` |
| `create#OrderPartShipment`, `receive#EntireShipment`, `receive#ShipmentProduct` | Incoming shipment from a PO part (`ShpTpPurchase`) and receiving | `component/mr-mantle/service/mantle/shipment/ShipmentServices.xml` |
| `create#EntireOrderPartInvoice`, `create#PurchaseShipmentInvoices`, `apply#InvoiceToOrder`, `apply#InvoiceItemToOrder`, `apply#InvoiceToShipment` | Bill from PO or from received shipment (a SECA runs it when an incoming shipment goes `ShipDelivered`); link bill items to order and shipment items | `component/mr-mantle/service/mantle/account/InvoiceServices.xml`, `component/mr-mantle/service/AccountingInvoice.secas.xml` |
| `create#Return`, `create#ReturnFromOrder`, `request#Return`, `approve#Return`, `create#ReturnShipment` | Supplier return and its outbound `ShpTpPurchaseReturn` shipment | `component/mr-mantle/service/mantle/order/ReturnServices.xml` |
| `create#Request`, `update#Request`, `add#RequestComment` | Request header and comments | `component/mr-mantle/service/mantle/request/RequestServices.xml` |

Missing services: nothing creates or converts `Requirement` records, nothing reads
`ProductFacility.minimumStock` to suggest orders, and there are no RFQ, supplier quote,
quote comparison, scorecard or match-exception services.

---

## 13. Gaps & BOSS implications

### Gaps in the reference set

- **No app has the full chain** internal request → RFQ → multi-vendor quote comparison →
  PO → receipt → supplier return → scorecard. ERPNext is closest on documents and
  scorecards; Carbon is closest on sourcing UX and returns; Odoo is closest on
  replenishment and bill matching; Dolibarr is broad but fragmented.
- **Internal purchase requests** exist only in ERPNext (Material Request) and, as a
  legacy model, metasfresh. Odoo community and AureusERP use "requisition" for purchase
  agreements; Carbon, Dolibarr and Akaunting have none.
- **3-way match enforcement is Enterprise in Odoo** (`account_3way_match`, an upgrade
  toggle, not in the checkout); community has 2-way bill↔PO line matching only.
- **No reference implements a buyer work queue across all document types** except Carbon's
  landing dashboard (with approvals in Assigned to Me); Dolibarr's supplier area shows
  only drafts and counts. That is an open area for BOSS.
- **Quote comparison** is a report (ERPNext) or drawer (Carbon, Odoo alternatives); none
  makes landed cost (freight, duty, tax) first-class in the compare view.
- **AureusERP replenishment** is a stub (order-point resource with no columns); its
  purchasing has no reports.
- **Akaunting** has no requisition, RFQ, PO, receipt or return; it is a bills/vendors
  reference only. **Ever Gauzy** has only a vendor register.
- **metasfresh** has strong planning/candidate and invoice-disposition concepts, but its
  UI is generic windows; it is a reference for the demand → candidate → PO model and
  vendor evaluation, not for page design.

### Notable gaps in the Moqui baseline

- **No Supplier 360.** Edit Supplier is the generic party form; supplier prices live only
  on the product Prices tab, there is no terms block, no document list beyond the Orders
  link, no performance or approval status.
- **Supplier price fields are hidden.** `ProductPrice` has `standardLeadTimeDays`,
  `preferredOrderEnumId` (main/alternate) and `canDropShip`, but Edit Prices shows none of
  them.
- **Purchase requests have no workflow.** `RqtPurchase` requests use the generic request
  screens; there is no "my requests" for employees, no approval status (Request has no
  Approved status), no budget check, and the PO button fails unless every item has a
  supplier.
- **No RFQ or supplier quote.** Nothing in Mantle or SimpleScreens; `OrderProposed` on a
  purchase order is the nearest thing to "quote received".
- **No replenishment.** `ProductFacility` min/reorder values and `Requirement` exist, but
  no service or screen turns shortages into requirements or POs; `OrderAutoReorder` is
  unused.
- **Purchase actions are generic.** Order detail has place/approve/send but no
  amount-threshold approval, no lock, no PO-specific send (email to supplier with PDF),
  and no received/billed progress per line.
- **No match exceptions or supplier performance.** The data (`OrderItemBilling`,
  `AssetReceipt`) is there; nothing lists variances, late receipts or OTD.

### What each reference contributes

| Reference | Take |
| --- | --- |
| Odoo | RFQ-first lifecycle on one record; RFQ KPI strip (late, not acknowledged, late receipt, days to order); alternatives with Compare Product Lines and Choose; lock/unlock and receipt reminders; editable replenishment report with Order / Automate / Snooze; bill-line matching list; On-time Rate on the vendor |
| ERPNext | Material Request with one-click downstream documents; RFQ to many suppliers with supplier portal and quotation comparison report; Procurement Tracker; Supplier Scorecard with standings that warn or block RFQs/POs; Buying Settings checklist; auto-reorder job creating material requests; invoice Hold/Block with release date |
| Carbon | Supplier 360 sidebar and supplier approval; RFQ + supplier quote with compare drawer, quote → order drawer and public share link for supplier quotes; PO revisions and approvals; time-phased Material Planning; Purchase Return Order with RMA, credit/restock fee and replacement, plus quality-issue bridge; working landing page |
| AureusERP | Odoo shapes in Filament: vendor sub-pages, purchase agreements, approval threshold and lock settings, vendor portal cluster |
| Dolibarr | Two-level PO approval; reception as its own document; Replenishment page generating supplier orders; supplier statement |
| metasfresh | Purchase candidates from sales demand, invoice candidates as an AP work queue, vendor gateway for remote availability/ordering, vendor return from receipt |
| Akaunting | Simple bill and recurring-bill forms (Accounting reference more than Purchasing) |
| Ever Gauzy | Nothing beyond a vendor register |
| Moqui baseline | All core records (order parts with vendor, `RqtPurchase` requests, `Requirement`, `ProductPrice` supplier rows, `ReturnHeader` with `supplierRmaId`, `AssetReceipt`, `OrderItemBilling`) and the request → PO, PO → shipment → bill and supplier-return services |

#### Reference coverage

| Reference app | Supplier master | Requests/requisitions | RFQ/quotes | POs/agreements | Replenishment | Receiving/returns | Invoice matching | Performance |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Odoo | Yes | Agreements only | Yes + alternatives | Yes | Yes | Yes | Bill↔PO lines; 3-way is Enterprise | Yes |
| ERPNext | Yes + scorecard | Yes (Material Request) | Yes + comparison report + portal | Yes + blanket | Yes + auto-reorder | Yes + debit note | Yes + hold/block | Yes |
| Carbon | Yes (Supplier 360) | Planning only | Yes + compare drawer | Yes + leases | Yes | Yes + return orders | Yes | KPIs + risk |
| AureusERP | Yes | Agreements only | Yes + vendor portal | Yes | Route rules; order-point stub | Receipts; generic return | Yes | No reports |
| Dolibarr | Yes | No | Supplier proposals (price requests) | Yes | Yes | Receptions; credit notes | Yes | Statements/stats |
| Akaunting | Vendors | No | No | No | No | No | Bills only | Financial reports |
| metasfresh | BP + vendor info | Candidates/planning; legacy requisition | No (vendor gateways) | Generic window | Material cockpit | Vendor return process | Invoice candidates | Vendor evaluation |
| Ever Gauzy | Vendor register | No | No | No | No | No | No | No |
| Moqui baseline | Party form | `RqtPurchase` request → PO | No | Shared order screen | Data only | Incoming shipments; supplier returns | Invoice ↔ order/shipment tabs | No |

### Candidate screen inventory (IronStone Purchasing)

Candidate screens for buyers, from the findings above. Screens other apps would also
include are marked **(reused: …)**.

| Area | Screens |
| --- | --- |
| Home | Buyer work queue: my requests to source, RFQs awaiting replies, quotes expiring, POs to approve **(reused: Approvals waiting, header Notifications)**, POs not acknowledged, late receipts, bills on hold, replenishment suggestions; number cards and spend chart **(reused: Insights widgets)** |
| Suppliers | Supplier list (status, category, buyer, open PO value); **Supplier 360** in its fullest version **(reused: Accounting, Products, Warehouse)**: summary, contacts and addresses **(reused: Contact / party record, Commons and every app)**, purchasing terms, supplier prices, documents (RFQs, quotes, POs, receipts, returns, bills), scorecard and risk, approval status, Chatter **(reused: all apps)** |
| Purchase requests | My requests (any employee), request form (purpose, required-by, cost center/project, lines with suggested supplier), approval, buyer queue with "create RFQ" / "create PO"; the request record and screen are **(reused: Request / case; Customer Service, Maintenance, Projects, Sales, Warehouse, Commons)** with type `RqtPurchase` |
| Sourcing | RFQ list/form with recipients, send and share link, supplier quote entry (by buyer or supplier link), quote comparison (price, lead time, landed cost) with per-line award → PO |
| Purchase orders | PO list (saved views by status); **Order detail (reused: Sales, Customer Service, Warehouse, Accounting, Commerce)** with the purchase action set: send, confirm, approve, hold, revise, lock, cancel, close; receipt and bill progress per line |
| Agreements | Blanket orders / price agreements with validity, committed and released quantities (record open, see Open questions) |
| Replenishment | Shortfall list on **Inventory availability (reused: Warehouse, Customer Service, Sales, Manufacturing, Commerce)**: on hand, projected, min, reorder qty, suggested qty, preferred supplier, lead time; Order / Snooze; reorder-level editing inline |
| Receiving & returns | Expected and late receipts by PO and a **Receive** action on **Shipment detail (reused: Warehouse, Customer Service, Sales, Commerce, Accounting)**; supplier return list and form (RMA, lines from receipts, credit vs replacement) with its return shipment **(reused: Warehouse, Accounting)** |
| Invoice matching | Match exceptions on POs: received-not-billed, billed-not-received, price/qty variance, bills on hold with reason; each opens the supplier invoice in the same screen Accounting includes **(reused: Accounting)** |
| Performance | Supplier scorecard (OTD, quality from **quality inspection (reused: Warehouse, Manufacturing)**, price variance, response time), spend by supplier/product/period, open commitments |
| Settings | Approval threshold, lock confirmed POs, receipt-before-bill and same-rate rules, RFQ defaults, request purposes, supplier categories; Admin settings index links here |

### Data-model findings

- **Purchase order:** `OrderHeader` / `OrderPart` (vendor = supplier, customer =
  internal org) / `OrderItem` fit; `otherPartyOrderId` holds the supplier's order number,
  `tradeTermEnumId` the incoterm, and `orderRevision` + `increment#OrderRevision` give
  revisions. Lock and acknowledgement have no field or status today.
- **Purchase request:** `Request` type `RqtPurchase` + `RequestItem` + `RequestItemOrder`,
  converted by `create#PurchaseRequestOrder`. An approval step is missing; options are a
  status flow with an Approved status for `RqtPurchase`, or `RequestParty` approver rows.
  A budget check could use `RequirementBudgetAllocation` or a new request-item budget link.
- **Replenishment:** `Requirement` (type `RqTpInventory`, status Proposed) fits as the
  suggested order, generated from `ProductFacility.minimumStock` / `reorderQuantity`
  against `get#InventoryProjectedInfo` and converted with `RequirementOrderItem`. No
  reorder service exists.
- **Supplier prices:** `ProductPrice` rows with `vendorPartyId` fit; the screens would
  surface `standardLeadTimeDays`, `preferredOrderEnumId`, `otherPartyItemId`,
  `minQuantity`, `canDropShip`. No new entity appears necessary.
- **RFQ and supplier quote:** no Mantle record. Options: an RFQ as `Request` type
  `RqtQuote` (crosscut lists it under Sales for customer requests for quote) with one
  `RequestParty` per invited supplier, and each supplier quote as an `OrderHeader` in
  `OrderProposed` with the supplier as vendor, linked back by a new request/order join —
  or new `PurchaseRfq` / `SupplierQuote` entities. The sourcing screens depend on this
  choice (Open questions).
- **Supplier returns:** `ReturnHeader` (`vendorPartyId`, `supplierRmaId`) + `ReturnItem`
  responses + `ShpTpPurchaseReturn` shipment fit; a return-against-receipt link would
  need `ReturnItem` → `AssetReceipt` (today it points at the order item).
- **Match exceptions:** computable from `OrderItem`, `AssetReceipt` and
  `OrderItemBilling`; a hold reason on the purchase `Invoice` has no field today (it
  would serve the Accounting version of the screen too).
- **Supplier terms and scorecard:** default payment terms, incoterm, currency and buyer
  per supplier have no fields (options: `PartySetting` or a supplier-terms entity);
  scorecard periods, criteria and scores would be new records.

### Sequencing notes

- **Cheap on the baseline.** Supplier list and a Supplier 360 summary over the party
  record and `ProductPrice` supplier rows (surfacing the hidden lead-time and
  main/alternate fields); purchase requests on `RqtPurchase` with Create PO
  (`create#PurchaseRequestOrder`); the PO list and purchase actions on the existing
  `OrderDetail`; expected/late receipts and receiving over existing incoming shipments
  and `AssetReceipt`; supplier returns on `ReturnHeader`; a "received not billed /
  billed not received" list from `OrderItemBilling` and `AssetReceipt`; a landing work
  queue of counts and lists.
- **Small additions.** Request approval needs an Approved status or approver rows;
  amount-threshold PO approval and lock need a rule and a field or status; PO send needs a
  PDF and supplier email; per-line received/billed progress is computed; a replenishment
  shortfall list needs a reorder service over `ProductFacility` and
  `get#InventoryProjectedInfo`.
- **Depends on a data-model choice.** RFQs and quote comparison depend on the RFQ record;
  blanket agreements on a purchase agreement type; supplier terms on `PartySetting` or a
  new record; scorecards beyond OTD and rejected-quantity counts on scorecard records; a
  bill hold reason on a new `Invoice` field.
- **More expensive.** Supplier portal and share links (the cross-app portal question,
  crosscut §8), time-phased planning (overlaps Manufacturing MRP), landed-cost compare,
  and a full match/unmatch screen with PDF/OCR line mapping.

### Open questions

- **RFQ record.** Reuse `Request` type `RqtQuote` (crosscut §3 lists `RqtQuote` under
  Sales as customer "requests for quote") plus `OrderHeader` in `OrderProposed` per
  supplier quote, or add purchase-specific RFQ and quote entities? Reusing `RqtQuote`
  would put purchase RFQs and customer requests for quote on the same reused Request
  screen; how would each app's context keep them apart?
- **Purchase request screen.** One Request / case screen with a purchase context
  (approval, create RFQ/PO actions), or a purchase-request sub-screen Purchasing
  assembles from parts of it (the crosscut §8 granularity question)?
- **Vendor portal.** Supplier quote submission, PO acknowledgement and invoice upload
  appear in Odoo, ERPNext, Carbon and AureusERP. One portal reused by several apps
  (Purchasing for quotes and acknowledgements, Accounting for invoice upload), or a
  portal per app (crosscut §8)?
- **Blanket orders and purchase agreements.** Crosscut §4 lists purchase agreements under
  Purchasing and Accounting (terms), with no purchase agreement type seeded. On
  `Agreement` (needs a purchase agreement type) or on `ProductPrice.agreementId` alone?
- **Approval threshold.** Model as an order status step (`OrderRequested` → approve) with
  an amount rule, or as a generic approval record usable by requests, POs and bills?
- **Replenishment vs Manufacturing MRP.** `Requirement` serves both; when Manufacturing is
  installed, is there one planning run included in both apps, or one per app (Carbon puts
  Material Planning in Purchasing)?

### Checkout path quirks

- Carbon file routes keep literal `[.]` in the name ($orderId[.]pdf.tsx), which glob-based
  checkers read as a character class; this file cites their directories.
- Carbon's supplier returns route is `x+/purchasing+/supplier-returns.tsx`, but the
  documents live under `x+/purchase-return-order+/` (`returnable-lines.tsx` is not
  prefixed with `$id.`).
- metasfresh `5569820_sys_gh10074_CreateWindow_PurchaseOrderCandidates.sql` builds the
  purchase **invoice** candidates window (Rechnungsdisposition Einkauf), not purchase
  order candidates; the procurement planning window is `5478250_sys_gh3037-…`.
- AureusERP cluster slugs (purchase/orders, purchase/configurations, purchase/products)
  are URL routes, not paths.
- Odoo's PO alternatives are their own addons (`purchase_alternative`,
  `purchase_alternative_stock`, `purchase_alternative_sale`), not part of
  `purchase_requisition`.

**Bottom line.** Mantle already holds every procure-to-pay record IronStone Purchasing
needs except RFQs, supplier quotes, scorecards and supplier terms; the remaining work
found is mostly screens and a few services (reorder suggestions, approvals, match
exceptions). Supplier 360, purchase requests, the PO action set, receiving and supplier
returns, match exceptions and a replenishment list all sit on existing records, while the
sourcing screens depend on the RFQ data-model choice.
