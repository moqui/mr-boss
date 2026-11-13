# IronStone BOSS — Products app research

Oct 18, 2026

Reviewed against sources Oct 18, 2026; follows [research-crosscut.md](research-crosscut.md).

Deeper research pass on the **IronStone Products** app, covering the six sections initial-design gives it: **Products & variants**, **Categories**, **Features & attributes**, **Pricing & costs**, **Product suppliers** and **Product documents**. It catalogues every relevant screen/page found in the reference apps. Companion to [3p-app-reference.md](3p-app-reference.md); feeds the Products row in [initial-design.md](initial-design.md) and the reused **Product 360** screen (crosscut §3), one screen whose tabs vary by the app that includes it: the Products version emphasizes master data, variants, prices, costs and the supplier list; Commerce merchandising, store categories and SEO; Purchasing supplier prices and lead times; Manufacturing BOM and where-used; Warehouse stock, lots and locations; Accounting cost history; Sales price and availability. It also covers the **Prices & price rules** screens (crosscut §4), which Products, Sales, Commerce and Purchasing include over one `ProductPrice` table and one price service (`get#ProductPrice`).

**Organization.** Sorted by functional area (not by app): all variant screens together, all pricing screens together, etc. Within each area, sub-tables per reference app. Style mirrors [research-drawers-commons.md](research-drawers-commons.md).

**Scope.** Catalog management UI only: product master, variants/attributes, categories, pricing & costs, supplier catalogs, media/documents, units/barcodes — the screens a catalog manager lives in. Stock movements, bills and purchase orders, BOMs/routings and storefront merchandising are researched in the Warehouse, Purchasing, Manufacturing and Commerce files; here they appear only as those apps' tabs on the reused Product 360 (§10, §12).

**Path conventions.** Every backticked path resolves against the checkout for its prefix (per [research-crosscut.md](research-crosscut.md) §1; checkouts under `/home/jonesde/work/moquiwork/`). A tail such as `ui/Consumables/` or `…/Schemas/ProductForm.php` is relative to the directory named earlier in the same cell or row; `…` stands for that directory. `$itemId`-style route parameters and `x+/` folders are literal parts of Carbon file names.

| Prefix | Checkout | Paths start with |
| --- | --- | --- |
| **Odoo** | `3p_other/odoo` | `odoo/addons/<addon>/…` (`product`, `uom`, `barcodes`, `stock`, `stock_account`, `purchase`, `sale`, `mrp`); views in `views/`, OWL in `static/src/` |
| **ERPNext** | `3p_other/frappe/erpnext` | `erpnext/<module>/…`: Item family, Price List and Item Price under `erpnext/stock/`; `item_group`, `brand`, `uom`, `uom_conversion_factor` under `erpnext/setup/`; Pricing Rule and Promotional Scheme under `erpnext/accounts/`; `product_bundle` and selling reports under `erpnext/selling/`; Item Variant creation in `erpnext/controllers/` |
| **Carbon** | `3p_other/carbon` | `apps/erp/app/{modules,routes}/…` (items module `apps/erp/app/modules/items/`, part routes `apps/erp/app/routes/x+/part+/`), `packages/…` |
| **AureusERP** | `3p_other/aureuserp` | `plugins/webkul/<plugin>/src/…` (`products`, `purchases`, `inventories`, `sales`, `manufacturing`, `barcode`) |
| **Dolibarr** | `3p_other/dolibarr` | `htdocs/<module>/…` (`product`, `variants`, `categories`, `barcode`, `fourn`, `margin`, `core`) |
| **metasfresh** | `3p_other/metasfresh` | `frontend/src/…`, `backend/de.metas.<module>/…` (product, pricing, UOM engines inside `backend/de.metas.business/`) |
| **Akaunting** | `3p_other/akaunting` | `resources/views/…`, `app/…` |
| **Ever Gauzy** | `3p_other/ever-co/ever-gauzy` | `apps/gauzy/src/app/pages/…`, `packages/…` (domain in `packages/core/src/lib/`, catalog plugin `packages/plugins/catalog/`) |
| **Moqui baseline** | `mr-moqui-base/runtime` | `component/mr-marble/screen/SimpleScreens/…`, `component/mr-marble/screen/…`, `component/mr-mantle/entity/…`, `component/mr-mantle/service/mantle/…`, `components/base/framework/entity/…` |

**Not used here:** checked and found no product-catalog UI in Twenty, Zimbra, Nextcloud, Signal, OpenProject, Redmine, Ever Teams, and the Frappe apps other than ERPNext (CRM, Helpdesk, HR, Insights, LMS, Wiki, Gameplan, suite, Central). Dolibarr community modules only map incoming e-invoice vendor references onto products (`einvoicing/product_mapping.php`, stored as supplier prices), which is Purchasing/Accounting material. Of the Moqui components, ridgecrest has storefront product pages only (Commerce); resistmanagement only mounts the SimpleScreens `Catalog.xml` tree (`3p_moqui/resistmanagement/screen/resistadmin.xml`), the same screens as the Moqui baseline; Sales, WorkManagement, WeCreate, coarchy and ServiceJobMonitor have no product screens.

Sections: [1 products home & dashboards](#1-products-home--dashboards) · [2 product lists & find views](#2-product-lists--find-views) · [3 product forms & master data](#3-product-forms--master-data) · [4 variants & attributes](#4-variants--attributes) · [5 categories & taxonomy](#5-categories--taxonomy) · [6 pricing & costs](#6-pricing--costs) · [7 product suppliers & purchasing references](#7-product-suppliers--purchasing-references) · [8 media, documents & attachments](#8-media-documents--attachments) · [9 UOM, packaging & barcodes](#9-uom-packaging--barcodes) · [10 product 360 & per-app tabs](#10-product-360--per-app-tabs) · [11 catalog settings & configuration](#11-catalog-settings--configuration) · [12 cross-app surfaces](#12-cross-app-surfaces) · [13 current Moqui baseline](#13-current-moqui-baseline-mr-marble--marbleerp--mantle) · [14 gaps & BOSS implications](#14-gaps--boss-implications)

---

## 1. Products home & dashboards

### Akaunting — shared dashboards, no product home

- The configurable widget dashboard is the accounting pass's §1 (widget grid, drag order persisted); none of the shipping widget classes is product-specific. The de-facto "products home" is the plain Items list.

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Dashboard grid (shared) | Same draggable widget board as accounting; its widget classes (account balance, bank feeds, cash flow, currencies, expenses by category, payables, profit & loss, receivables) include none for products | `resources/views/common/dashboards/show.blade.php`, `app/Widgets/` |
| Items module home | Flat item list (the `Items` controller) — see §2; no overview page, no KPIs | `app/Http/Controllers/Common/Items.php` |

### AureusERP — Filament resource lists are the home

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Products plugin — **absent dashboard** | No Overview/Page or Widget classes under `products/src/Filament/`; the product home is the `ProductResource` list's infolist/table (see §2/§3) | — |
| Inventory overview pointer | The warehouse-flavored overview lives in the `inventories` plugin (Warehouse material; see §10 pointer) | `plugins/webkul/inventories/src/Filament/` |

### Carbon — declared submodule registry instead of a dashboard

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Items submodule registry | The module surface is declared in code: **Items** (Parts, Materials, Tools, Consumables, Services), **Change Notices** (+ Change Notice Types, Change Notice Actions), **Material Properties** (Dimensions, Finishes, Grades, Shapes, Substances, Types) and **Configure** (Item Groups, Units); routes are permission-gated and get saved views appended (`useSavedViews`) | `apps/erp/app/modules/items/ui/useItemsSubmodules.tsx` |
| Module notes | `AGENTS.md` at module root states the domain split: one shared `item` table + per-type extension tables (`part`, `material`, `tool`, `consumable`, `service`), make-method versioning (Draft/Active/Archived), item tracking types (Inventory/Serial/Batch/Non-Inventory), replenishment systems (Buy, Make, Buy and Make) | `apps/erp/app/modules/items/AGENTS.md` |

### Dolibarr — "Products & services area": a boxes page per type

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Products & services area | Not a stats board in the code: a boxes-area page (`boxes` area id `4`, same box framework as the home) split by `type` (0 products / 1 services) with per-page/dashboards libs; supports custom boxes + shortlists | `htdocs/product/index.php`, box framework `htdocs/core/boxes/modules_boxes.php` |
| Grip-to-boxes wiring | Box enable/order/reload via the generic box dashboard machinery | `htdocs/core/actions_addbox.inc.php`, `htdocs/core/lib/dashboard.lib.php` |

### ERPNext — Desk "Stock" workspace carries the Item entry points

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Stock workspace | Desk workspace titled **Stock**: onboarding block, links to Item, Item Group, Item Attribute, Brand, Item Prices, Item Variant Settings, plus Item Reports (Item Variant Details, Item Where Used, Item-wise Price List Rate…); the closest thing to a catalog home | `erpnext/stock/workspace/stock/stock.json` |
| Charts & number cards | Workspace chart **Stock Value by Item Group** and number cards **Total Stock Value**, **Total Warehouses**, **Total Active Items**; further stock charts (Item Shortage Summary, Oldest Items) exist as records | `erpnext/stock/dashboard_chart/{stock_value_by_item_group,item_shortage_summary,oldest_items}/`, `erpnext/stock/number_card/{total_active_items,total_stock_value,total_warehouses}/` |
| Item onboarding | Desk onboarding step guiding item creation | `erpnext/stock/onboarding_step/create_item/` |

### Ever Gauzy — Angular inventory module as its own page group

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Inventory module shell | Standalone inventory page tree, permission-gated (`ORG_INVENTORY_VIEW`): default child route shows the inventory-items table; sub-routes for product-types, product-categories, warehouses, merchants; create/edit/view/variant routing driven by `PermissionsGuard` | `apps/gauzy/src/app/pages/inventory/inventory-routing.module.ts`, root `apps/gauzy/src/app/pages/inventory/inventory.module.ts` |
| Module tabs frame | Inventory + its wizards/cards live in one module folder (components enumerated §2–§5) | `apps/gauzy/src/app/pages/inventory/components/` |

### metasfresh — generic windows + web-UI process packages

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Dashboard shell | Chart-widget host (`ChartWidget`/`ChartOptions`, drag-and-drop wrapper, sidenav) — the generic dashboard, not product-specific | `frontend/src/components/dashboard/{ChartWidget.js,ChartOptions.js,DndWidget.js,Sidenav.js}` |
| Generic document window | Every product/pricing screen renders through the one shell (list container + master window) — see §2 note | `frontend/src/containers/{DocumentListContainer,MasterWindowContainer}.js` |
| Product/pricing web-UI hooks | Backend Java "processes" (web-UI actions) for the product/pricing windows, e.g. discount-schema-break copy-to-otherSchema | `backend/de.metas.ui.web.base/src/main/java/de/metas/ui/web/{product,pricing}/process/` |

### Odoo — products kanban as home, no dedicated dashboard

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Products kanban | Card view per product template (`product_template_kanban_view`, `sample="1"`) behind the **Products** action (`product_template_action`, `view_mode` kanban,list,form); the variant kanban (`product_kanban_view`) orders favorites first; Inventory re-declares the action as `product_template_action_product` | `odoo/addons/product/views/product_template_views.xml`, `odoo/addons/product/views/product_views.xml`, `odoo/addons/stock/views/product_views.xml` |

**BOSS implications.** No reference builds a standalone "products dashboard": the home is either a taxonomic workspace (ERPNext) or a nav registry (Carbon) or the product list itself (everyone else). The ERPNext workspace pattern fits a catalog-manager home — shortcut tiles into Product list, Categories, Attributes, Price lists, Brands — plus 2–4 KPI cards (active products, variants count, price-list coverage) as dashboard widgets (crosscut §3: the same widgets serve Insights and every app's landing page). Akaunting's board shows that widget plumbing is expensive; one option is folding product stats into the list screen's KPI strip instead of a separate dashboard app.

---

## 2. Product lists & find views

### Akaunting — Blade items list + generic import/export

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Items list | Paged item table with per-row dropdowns and bulk actions (edit, enable, disable, delete, export), the list layout block reused across masters; a "favorite" slot lets the user pin the page | `resources/views/common/items/index.blade.php`, bulk actions `app/BulkActions/Common/Items.php`, controller `app/Http/Controllers/Common/Items.php` (`index()` eager-loads `category, media, taxes`, sortable via `->collect()`) |
| Item create/edit | Create/edit share one page layout: sections split into info + billing + description tiles (§3) | `resources/views/common/items/{create,edit}.blade.php` |
| Import | One generic import page for every type: upload a sheet in the sample-file layout (sample file link and embedded how-to video; no column mapping step) → per-row validation failures reported back; items import goes through the same pipeline | `resources/views/common/import/create.blade.php`, `app/Http/Controllers/Common/Import.php`, `app/Utilities/Import.php`, `Items.php@import` (Excel import classes `app/Imports/`) |
| Export & bulk | Excel export of the filtered list; shared bulk-action controller across modules | `app/Http/Controllers/Common/{BulkActions,Items}.php` (`export`/`destroy`), `resources/views/components/index/` layout parts |

### AureusERP — Filament grid with type, category and date groupings

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Product list table | `ProductsTable.php` behind `ListProducts.php`: `type` column, **groupings** by type, category and created date (`Tables\Grouping\Group::make('type')`), a `type` select constraint in the query-builder filter | `plugins/webkul/products/src/Filament/Resources/ProductResource/{Tables/ProductsTable,Pages/ListProducts}.php` |
| Type vocabulary | Product type enum has just two cases, goods and service; feature switches come from `ProductSettings` (§11) | `plugins/webkul/products/src/Enums/ProductType.php`, `plugins/webkul/products/src/Settings/ProductSettings.php` |

### Carbon — one table component per item subtype

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Subtype tables | Each item subtype (parts, consumables, services, tools) has its own table + header/properties components and a `use*Navigation` hook wiring deep links (edit route, detail tabs) | `apps/erp/app/modules/items/ui/Parts/{PartsTable,PartHeader,PartProperties}.tsx` + `ui/Parts/usePartNavigation.tsx`, `ui/Consumables/{ConsumablesTable,ConsumableHeader,ConsumableProperties}.tsx`, `ui/Services/`, `ui/Tools/` |
| Saved views & flags | List screens integrate the global saved-views system (`useSavedViews`) and file-badge flags for attachment state on rows | `apps/erp/app/modules/items/ui/useItemsSubmodules.tsx`, `ui/Item/FileBadge.tsx` |

### Dolibarr — one mega search-form list + task list

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Product/service list | Single `list.php` page per type: full GET-form find view searching reference, supplier ref, **barcode**, label, VAT rate, note-public/note-private, to-sell/to-buy/lot-tracked flags, country, accounting codes, plus a distinctive **category filter** with an OR/AND operator toggle (`search_category_product_operator`), mass action bar at bottom | `htdocs/product/list.php` (search fields `$search_{ref,ref_supplier,barcode,label,vatrate,tosell,tobuy,tobatch,…}`) |
| Top search box | Top-bar search offers "Search into products or services" (shortcut P), which opens `product/list.php?search_all=…` | `htdocs/core/ajax/selectsearchbox.php` |

### ERPNext — Desk list with curated one-click list filters + item search service

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Item list view | Standard desk list tuned by `listview_settings`: extra fetched columns (uom, group, image, variant flags, sales/purchase flags), defaults to `disabled=0`, formatters for image chips | `erpnext/stock/doctype/item/{item_list.js,item.json}` |
| Curated list filters | JSON-defined one-click filters surfaced in the list side panel: Batch-tracked, Disabled, Fixed assets, Serialized, Services, Stock items, Templates | `erpnext/stock/doctype/item/list_filter/{item_batch_tracked,item_disabled,item_fixed_assets,item_serialized,item_services,item_stock_items,item_templates}.json` |
| Item quick search | `ItemSearch`: an SQLite FTS5 trigram index over Item that backs substring search on large catalogues in the item link query; the `templates/` pair are sample web-view templates | `erpnext/stock/doctype/item/item_search.py`, `erpnext/stock/doctype/item/templates/{item,item_row}.html` |
| Item dashboard | Connections panel with per-doctype link counts on the Item form (§10) | `erpnext/stock/doctype/item/item_dashboard.py` |

### Ever Gauzy — the inventory list + its neighbor masters

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Inventory items table | The list landing page of the Inventory module: paged table or card grid of products with a favorite toggle and view/edit/add buttons routing into the form | `apps/gauzy/src/app/pages/inventory/components/table-inventory-items/table-inventory.component.{ts,html}` |
| Option masters as lists | Product types/categories/warehouse/merchant tables share the same table sub-components | `apps/gauzy/src/app/pages/inventory/components/{manage-product-types,manage-product-categories,manage-warehouses,manage-merchants}/` |

### metasfresh — everything through the one generic grid

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Generic document list | All product/pricing screens are backend window instances; the React "find/view" layer is one `DocumentList` shell with the metadata-driven filters/saved-views living in the window + filters packages | `frontend/src/containers/{DocumentListContainer,MasterWindowContainer}.js`, window internals `frontend/src/components/window/`, filter bar `frontend/src/components/filters/` |
| Product attribute decode | `pattribute` web-UI package adds attribute search/decode to the grid columns | `backend/de.metas.ui.web.base/src/main/java/de/metas/ui/web/pattribute/` |

### Odoo — list + a rich search view with favorites

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Product template list/search | Search view (`product_template_search_view`) with filters Goods, Services, Combo, Favorites, Sales, Purchase, activities, Warnings, Archived; group by product type, product category and **product properties**; search by tags and attributes; kanban already seen (§1) | `odoo/addons/product/views/product_views.xml`, `odoo/addons/product/views/product_template_views.xml` |
| Product-catalog picker | OWL kanban controller/renderer/search-panel reusable as an embedded product picker (used by sale order lines via `order_line/`), with favorite toggle & quantity stepper on cards | `odoo/addons/product/static/src/product_catalog/{kanban_controller,kanban_renderer,kanban_record,kanban_model,product_catalog_search_panel}.*` |
| Pricelist report panel | Editable pricelist breakdown panel drawn from the product list (§6) | `odoo/addons/product/static/src/js/pricelist_report/` |

**BOSS implications.** The catalog list is the workhorse. The references point to a saved-view-first Product list (Carbon + metasfresh) with per-column filters incl. reference, supplier ref and barcode (Dolibarr), one-click curated facets (batch-tracked/serialized/services — ERPNext's `list_filter/*.json` is a cheap high-value pattern), and category multi-select with OR/AND operator (Dolibarr). Spreadsheet import with a sample file and per-row errors (Akaunting) is a candidate for product import; a column-mapping review step would go beyond every reference here. A type/grouping dimension (goods/service grouping in AureusERP; in Moqui `productTypeEnumId`) appears as a filter and group-by in the references, not as a separate app. The baseline Find Product already has saved finds, column selection and CSV export (§13), so the gap is facets and bulk actions rather than a new list.

---

## 3. Product forms & master data

### Akaunting — one short form, sections not tabs

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Item create/edit | Sections stacked on one page: **General** (type radio product/service, name, category, description) and **Billing** (sale-information and purchase-information toggles, sale price, purchase price, taxes multi-select); duplicate/enable/disable are controller actions; one record = flat item master, no variants at all, and **no picture field on the item form** although the `Item` model handles a `picture` media | `resources/views/common/items/{create,edit}.blade.php`, shared form widgets `resources/views/components/form/group/`, model `app/Models/Common/Item.php`, controller `app/Http/Controllers/Common/Items.php` |
| Item tax select helper | Tax select reuses the shared form-group component rather than a sub-screen | `resources/views/components/form/group/tax.blade.php` |

### AureusERP — sectioned Filament form with an injection registry

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Product form | Two-column schema built from named **sections**: left = General, Images, Inventory (replaced when a plugin fills the `left.inventory` slot); right = Settings + Pricing — crucially a `ProductSchemaRegistry` lets other plugins inject blocks at slots (`left.general.after`, `left.inventory`, `left.append`, `right.settings.after`, `right.pricing.fields`, `right.append`); accounts, inventories, manufacturing and point-of-sale register into it | `plugins/webkul/products/src/Filament/Resources/ProductResource/Schemas/ProductForm.php`, `…/Schemas/ProductInfolist.php`, registry `…/ProductResource/Support/ProductSchemaRegistry.php` |
| View/Create/Edit pages | Filament resource pages incl. a `ViewProduct` infolist page (read-only detail view) and `ManageAttributes`/`ManageVariants` sub-pages (§4) | `plugins/webkul/products/src/Filament/Resources/ProductResource/Pages/{CreateProduct,EditProduct,ViewProduct}.php` |

### Carbon — one master form with expert sub-forms per concern

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Item form + record header | `ItemForm`/`SelectedItemProperties` feed per-subtype forms (`PartForm`, `ConsumableForm`, …); header shows record info + revision state + supersession notice; sub-forms: Costing, SalePrice, Planning, Purchasing, Manufacturing, Reorder policy, Supersession, Risk register — the master-data surface is really a tabbed stack; a part's tabs are **Details, Purchasing, Accounting** (costing), **Planning, Inventory, Sales** (customer part numbers, rental rates), **Quality**, plus make-method pages when replenishment is Make | `apps/erp/app/modules/items/ui/Item/{ItemForm,ItemRecordHeader,SelectedItemProperties,ItemCostingForm,ItemSalePriceForm,ItemPlanningForm,ItemPurchasingForm,ItemManufacturingForm,ItemReorderPolicy,ItemSupersessionForm,ItemRiskRegister}.tsx`, tabs `apps/erp/app/modules/items/ui/Parts/usePartNavigation.tsx`, routes `apps/erp/app/routes/x+/part+/` |
| Revisions & change notices | Engineering-change flow: revision form on the item, change notices with status flow, affected items, diff viewer, impact panel, release/merge and item lock; change-notice types and actions are masters | `apps/erp/app/modules/items/ui/Item/RevisionForm.tsx`, `apps/erp/app/modules/items/ui/{ChangeNotice,ChangeNoticeActions,ChangeNoticeTypes}/` |
| Storage & physicality | Storage fields + material-dimension/finish/grade/shape/substance/type masters feeding material classification fields | `apps/erp/app/modules/items/ui/Item/ItemStorageFields.tsx`, `apps/erp/app/modules/items/ui/{MaterialDimensions,MaterialFinishes,MaterialGrades,MaterialShapes,MaterialSubstances,MaterialTypes}/` |

### Dolibarr — tabbed card.php, tab set assembled at runtime

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Product card + tab pages | `card.php` holds the master data (ref, label, type, status to sell/buy, category, VAT, barcode, weight/size, lifetime, extrafields); the other tabs are separate pages built by `product_prepare_head()`: Prices (`price.php`, §6), Buying prices (`price_suppliers.php`, §7), Translation (`traduction.php`), Kit (`composition/card.php`), Variants (`variants/combinations.php`, §4), Stock (`stock/product.php`), Resources, Contacts, Referring objects and Statistics (`stats/`, §10), Notes, Documents (§8), Agenda; hooks `tabContentCreateProduct`/`tabContentEditProduct`/`tabContentViewProduct` and `formObjectOptions` extend the card | `htdocs/product/card.php`, tab builder `htdocs/core/lib/product.lib.php` |
| Notable behaviors | Duplicate-ref hook (`onProductAlreadyExists`), more-actions hook (`addMoreActionsButtons`); extrafields engine shared with every object | `htdocs/product/card.php` (action handlers), `htdocs/core/class/extrafields.class.php` |

### ERPNext — the desk Item form (the largest in the repo)

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Item form | One desk form whose sections show/hide by flags: naming series & item_code (auto), group/UOM/disabled, **is_stock_item/is_fixed_asset/is_sales_item/is_purchase_item** switches, opening stock + valuation_rate + standard_rate, brand/description, barcodes child, inventory section (shelf life, end-of-life, default material request type, valuation method, warranty, weight), reorder levels child (§10), UOM conversions child, serial & batch section, variants section (§4), defaults + taxes children (§11/§10) | `erpnext/stock/doctype/item/{item.json,item.js,item.py}` |
| Naming & validations | `item.py` naming hooks (set item_code from series/item_name rules), duplicate-barcode validation, item-group mandatory/leaf validation | `erpnext/stock/doctype/item/{item.py,item.js}` |
| Item defaults | Per-company child defaults: default warehouse, default price list, **default supplier**, cost centers, income/expense/inventory/COGS accounts (+ `vf_*` fallback fields) — keeps postings/fulfillment automatic | `erpnext/stock/doctype/item_default/item_default.json` |

### Ever Gauzy — the multi-tab product wizard

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Product form | Photo gallery on the left rail + `nb-tabset` with **Main** (language-aware name/desc — store multiple translations inline via language selector), **Tags & Options** (tag chips + variant-option toggles) and **Variants** tabs; save/next with redirected-to-variant flow | `apps/gauzy/src/app/pages/inventory/components/edit-inventory-item/{product-form.component.ts,product-form.component.html}`, gallery sub-component `…/edit-inventory-item/product-gallery/` |
| Options & variant mgmt | `options-form` and `variant-form`/`variant-table` components mounted by the same page (§4) | `apps/gauzy/src/app/pages/inventory/components/edit-inventory-item/options-form/`, `apps/gauzy/src/app/pages/inventory/components/edit-inventory-item-variant/` |
| Domain model | Product = master + variants: gauzy core libs define product (name/description translation entities), option-chain categories and option groups; plugin carry-over seen in the `catalog` plugin | `packages/core/src/lib/product/`, `packages/core/src/lib/{product-option,product-variant,product-variant-price}/` |

### metasfresh — metadata-defined product window, business code in `de.metas.*`

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Product master window | Rendered by the generic master-window shell; layout, tabs, included attributes come from AD window definitions (e.g. `M_Product` + `M_HU_PI*` handling units); BOSS's Moqui screen XML plays the same role | backend anchor `backend/de.metas.business/src/main/java/de/metas/product/`, UI shell `frontend/src/components/window/` |
| Product codes & scanning | Product-code resolution engine (attribute-based scanned codes, GS1) behind the product lookup forms | `backend/de.metas.business/src/main/java/de/metas/product/`, `backend/de.metas.business/src/main/java/de/metas/gs1/` |

### Odoo — the multi-tab template form, price list embedded

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Product template form | Tabbed form: **General Information** (name/SKU/category, tags, description), **Sales** (upsell/cross-sell groups, description surfaces, packaging barcodes + extra barcodes group), **Prices** — an inline embedded price-list tree with `add_product_price` for the current customer context, **Purchase** (Vendor Bills group), **Inventory** (logistics: traceability/lots, weight & volume), + Documents stat/button, internal-notes page; "template-only" copy strips variant bits | `odoo/addons/product/views/product_views.xml` (`product_template_form_view`), lighter form in `odoo/addons/product/views/product_template_views.xml` (`product_template_only_form_view`) |
| Template-only lists | Contextual list variants "sellable" or "purchasable" (columns complete accordingly) | `odoo/addons/product/views/product_template_views.xml` ({`product_template_list_view_sellable`,`…_purchasable`}) |
| Update Quantities grid | Editable inline quantity grid over variants (list with on-hand/forecasted sums) — quick bulk edit of stock quantities from the product screen | `odoo/addons/product/views/product_views.xml` (`product_view_list_qty`, action `product_variant_edit_qty_action`) |
| Attribute-value wizard | Update product attribute values across the products that use them | `odoo/addons/product/wizard/{update_product_attribute_value.py,update_product_attribute_value_views.xml}` |

**BOSS implications.** Item master forms divide cleanly: a compact "general" core (Akaunting), a registry-injectable sectioned form (AureusERP's ProductSchemaRegistry slot pattern shows other modules extending the product form without forking it, a candidate for how apps add blocks to the reused Product 360), and a tabbed expert stack (Dolibarr, ERPNext, Odoo). Bought-master patterns that recur: ERPNext's flag-driven sections (stock/fixed-asset/sales/purchase toggles reshape the form), per-company defaults child table, inline translated names/descriptions (Odoo translations + gauzy language selector), and Odoo's trick of embedding price-list editing inside the product form (see §6). Revisions/supersession (Carbon) matter only where a business does engineer-style change control; one option is a setting that turns them on rather than a field set on the core form.

---

## 4. Variants & attributes

### Akaunting — **absent**: flat item master

| Screen/page | What it is | Key files |
| --- | --- | --- |
| **Absent** | Items are a flat list master — no variant machinery, no attribute/feature engine (categories are the only dimension) | — |

### AureusERP — Odoo-shaped variant management inside the product resource

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Attribute master | `AttributeResource` CRUD: attribute name, type (radio, select, color) and options — the Odoo `product.attribute` shape | `plugins/webkul/products/src/Filament/Resources/AttributeResource/` (+ `AttributeResource.php`), types `plugins/webkul/products/src/Enums/AttributeType.php` |
| Manage Attributes (per product) | Sub-page `ManageAttributes` inside the product resource: attribute lines with their values for this product | `plugins/webkul/products/src/Filament/Resources/ProductResource/Pages/ManageAttributes.php` |
| Generate variants & Manage Variants | `GenerateVariantsAction` (action inside ManageAttributes page that creates variant records from attribute-value combinations) + `ManageVariants` (`ManageRelatedRecords` tab: variant table with values/price, PDF export via DomPDF) | `plugins/webkul/products/src/Filament/Resources/ProductResource/Actions/GenerateVariantsAction.php`, `plugins/webkul/products/src/Filament/Resources/ProductResource/Pages/ManageVariants.php` |

### Carbon — no variant matrix; configurable parts instead

| Screen/page | What it is | Key files |
| --- | --- | --- |
| **No variant matrix** | No attribute-combination variants; the nearest analogues are (a) the material-properties taxonomy (type/grade/shape/substance/finish/dimension as FK masters) and (b) **configurable parts**: a part flagged `requiresConfiguration` gets **Configuration Parameters** (grouped, typed parameters) on its details page and make method, answered per quote or job line | `apps/erp/app/modules/items/AGENTS.md`, `apps/erp/app/modules/items/ui/Material*/`, `apps/erp/app/modules/items/ui/Parts/ConfigurationParameters.tsx`, `apps/erp/app/routes/x+/part+/$itemId.details.tsx` |

### Dolibarr — a dedicated `variants` module generating combinations

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Attribute & value masters | Attribute list + attribute card with value grid (create/edit inline per attribute); barcode-shaped AJAX: fetch values, order values | `htdocs/variants/{list.php,card.php}`, templates `htdocs/variants/tpl/productattributevalueline_{create,edit,view}.tpl.php`, AJAX `htdocs/variants/ajax/{get_attribute_values,orderAttribute}.php` |
| Combination generator | Per-product "Generate combinations": builds the cartesian product from attribute-value pairs (ProductCombination + ProductCombination2ValuePair classes) via AJAX step, then a combination list with bulk price/weight adjustments | `htdocs/variants/combinations.php`, `htdocs/variants/ajax/getCombinations.php`, classes `htdocs/variants/class/{ProductCombination,ProductCombination2ValuePair}.class.php` |
| Combination record | Per-combination card view (variant price/stock override, link back to parent) — `htdocs/variants/list.php` lists combos of a parent | `htdocs/variants/{card.php,list.php}` |
| Product-side plumbing | Parent product card gains variant sections; variant references generatable via Dolibarr ref engine | `htdocs/product/card.php`, `htdocs/variants/lib/variants.lib.php` |

### ERPNext — dialog-driven variant builder on the Item form

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Variant settings on Item | `has_variants` tick converts the Item into a template (blocked from transactions); `variant_based_on` = Item Attribute or Manufacturer; Item Variant Settings lists the fields copied to variants, plus do-not-update-variants, allow-rename-attribute-value and allow-different-UOM switches | `erpnext/stock/doctype/item/item.js` (lines ~240–300), settings `erpnext/stock/doctype/item_variant_settings/item_variant_settings.{js,json}` |
| Single/multiple variant dialogs | Two client-side dialogs: one-attribute quick dialog, and a **matrix dialog** with per-value checkboxes and "Create Variants" that calls `enqueue_multiple_variant_creation` to materialize child Items | `erpnext/stock/doctype/item/item.js` (`erpnext.item.show_{single_variant,multiple_variants}_dialog`), server `erpnext/controllers/item_variant.py` |
| Attribute master | `Item Attribute` with value rows (value + abbreviation used in the variant code) or a **numeric range** (from, to, increment) | `erpnext/stock/doctype/item_attribute/{item_attribute.js,item_attribute.json}`, `erpnext/stock/doctype/item_attribute_value/` |
| Variant records | A variant is itself an Item row (`variant_of`, `item_variant` + `item_variant_attribute` child tables); variant details report exists | `erpnext/stock/doctype/{item_variant,item_variant_attribute}/`, report `erpnext/stock/report/item_variant_details/` |

### Ever Gauzy — options tab + variant grid/graph

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Variant wizard | The product form's Variants tab opens the variant approach at `edit/:id` child route (variant request through option chain); automatic generation + variant-slotting UI | `apps/gauzy/src/app/pages/inventory/components/edit-inventory-item/variant-table/`, nav route `apps/gauzy/src/app/pages/inventory/inventory-routing.module.ts` (route `:itemId/variants/:itemVariantId`) |
| Option-form & variant-form | `options-form` rows (option groups with options) + variant form's SKU/price/quantity/tax entry | `apps/gauzy/src/app/pages/inventory/components/edit-inventory-item/options-form/options-form.component.{ts,html}`, variant form `apps/gauzy/src/app/pages/inventory/components/edit-inventory-item-variant/variant-form.component.ts` |
| Variant domain | ProductVariant entity in core (`product-variant` lib) + variant price (`product-variant-price`: unit cost and retail price with currencies); catalog plugin links variants to channels and media | `packages/core/src/lib/product-variant/`, `packages/core/src/lib/product-variant-price/`, `packages/plugins/catalog/src/lib/{product-variant-channel,product-variant-media,product-variant-sale}/` |

### metasfresh — attribute set instances instead of variant SKUs

| Screen/page | What it is | Key files |
| --- | --- | --- |
| pattribute (attribute set instances) | Web-UI editor for **attribute set instances** (ASI): one product, with attribute values (lot, best-before, quality…) captured per document line or stock unit instead of separate variant SKUs | `backend/de.metas.ui.web.base/src/main/java/de/metas/ui/web/pattribute/` (`ASIDescriptorFactory`, `ASIRepository`), business `backend/de.metas.business/src/main/java/de/metas/product/` |
| Attributes-included tab | Window tab machinery appending attribute data to a document/product grid | `backend/de.metas.business/src/main/java/de/metas/attributes_included_tab/` |

### Odoo — attribute lines on templates + 3 creation modes

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Attribute & value masters | `product.attribute` + `product.attribute.value` forms/lists; attribute `create_variant` selection is `always` (Instantly), `dynamic` (when ordered) or `no_variant` (Never), and `display_type` radio/pills/select/color/multi/image/range; a model constraint `CHECK(display_type != 'multi' OR create_variant = 'no_variant')` keeps multi-checkbox attributes informational | `odoo/addons/product/views/{product_attribute_views.xml,product_attribute_value_views.xml}`, models `odoo/addons/product/models/{product_attribute.py,product_attribute_value.py}` |
| Attribute lines on product | `product.template.attribute.line` embedded list on the template form: choose attribute + values | `odoo/addons/product/views/product_template_attribute_line_views.xml`, model `odoo/addons/product/models/product_template_attribute_line.py` |
| Variant matrix on template | The template form's variant matrix (auto-created `product.product`s), variant list view + per-combination "Update Quantities" grid (§3) | `odoo/addons/product/views/product_views.xml` (variant list + qty grid views) |
| Mass attribute update | Wizard to update attribute values across the products that use them | `odoo/addons/product/wizard/{update_product_attribute_value.py,update_product_attribute_value_views.xml}` |

**BOSS implications.** The references suggest one variant model with three flavors visible in the UI: (1) **matrix preview + generate** — a builder that shows the combinations, lets the manager untick some, and posts one request (ERPNext's matrix dialog + Dolibarr's combination generator are the strongest UX evidence); (2) **dynamic/informational attributes** — Odoo's `create_variant` choice (instantly / when ordered / never) avoids hundreds of useless SKUs; (3) **variant = row** — ERPNext Item and Odoo `product.product` store variants as full product rows, which is what Mantle already does: a `PtVirtual` product with Selectable features (`ProductFeatureAppl` `PfatSelectable`, grouped by `ProductFeatureGroup`) and variant products linked by `ProductAssoc` `PatVariant` carrying Distinguishing features, created by `mantle.product.ProductServices.create#VariantProducts` (all combinations, no preview today). ERPNext's copy-fields-to-variant config (Item Variant Settings) is what spares catalog managers hand-editing variant descriptions. Carbon's configurable parts and metasfresh's attribute set instances are the other end of the spectrum: one product, values captured per order line or stock unit; Mantle has only the `PtConfigurable` product type live; the `ProductConfig*` entities are commented out in `ProductDefinitionEntities.xml` (not usable without enabling), so the options are enabling those definitions or adding new records (§14 Open questions).

---

## 5. Categories & taxonomy

### Akaunting — one generic categories screen shared by all modules

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Categories list & editor | Single `settings/categories` page family used for item/income/expense/other categories: inline **parent/child nesting** rendered as collapsible child rows (`data-collapse="child-<id>"`), code/name/type columns; item category select on the item form reads from it | `resources/views/settings/categories/{index,create,edit,sub_category}.blade.php`, controller `app/Http/Controllers/Settings/Categories.php` |
| Shared select component | Categories attach through a generic modal-based category select on documents too | `resources/views/components/form/group/category.blade.php` |

### AureusERP — plain category tree with a products sub-page

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Category CRUD | `CategoryResource`: form with just name and parent category, a view page, and a **Manage Products** sub-page listing the category's products | `plugins/webkul/products/src/Filament/Resources/CategoryResource/` (`Schemas/{CategoryForm,CategoryInfolist}.php`, `Pages/ManageProducts.php`) |

### Carbon — **absent** as commerce taxonomy; posting groups instead

| Screen/page | What it is | Key files |
| --- | --- | --- |
| **Absent** | No category/tag tree for items; the nearest analogues are **Item Groups** (item posting groups, an accounting classification) and the material-properties taxonomy (§3) | `apps/erp/app/modules/items/ui/ItemPostingGroups/` |

### Dolibarr — generic tree-based categories for every type

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Category cards & tree | `htdocs/categories/index.php` (tree browser page per type) + `card.php`/`edit.php`; sub-category tree widget per category page loads the full arborescence (`get_full_arbo`) with jquery.TreeView; many types share the table (product, supplier, customer, ...) so a product can belong to multiple categories | `htdocs/categories/{index.php,card.php,edit.php,viewcat.php}`, classes `htdocs/categories/class/categorie.class.php` |
| Category pages extras | Per-category: object list (products/customers/...), translations per language (`traduction.php`), photos manager (`photos.php`), info page | `htdocs/categories/{traduction.php,photos.php,info.php}` |
| Category assignment in product screens | Product card + list filter tie into categories; the same tree is the "category filter" facet in product lists (§2) | `htdocs/core/class/html.formother.class.php`, `htdocs/product/card.php` |

### ERPNext — item group is a real Tree master

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Item Group tree | Desk doctype with `is_tree=1`, default view Tree: parent group, `is_group`, image, per-company **Item Group Defaults** child and an item-tax child that items in the group inherit | `erpnext/setup/doctype/item_group/{item_group.js,item_group.json}` |
| Brand & catalogue tags | Brand separate doctype parallel to groups; customer/supplier "groups" also exist but live outside products; `POS Item Group` (retail) groups POS tiles | `erpnext/setup/doctype/brand/` (beside item_group), `erpnext/accounts/doctype/pos_item_group/` |

### Ever Gauzy — category manager inline in the Inventory module

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Product categories | Sub-route `product-categories` in the inventory module: category CRUD with image and parent; the core entity also carries slug, sort order, featured flag and status (`packages/core/src/lib/product-category/product-category.entity.ts`); categories are org-scoped and picked on the product form | `apps/gauzy/src/app/pages/inventory/components/manage-product-categories/`, route `apps/gauzy/src/app/pages/inventory/inventory-routing.module.ts` |
| Category selector | Shared `product-category-selector` component reused wherever products are picked (including purchase/sales screens) | `packages/ui-core/shared/src/lib/product/product-category-selector/` |

### metasfresh — taxonomy via the generic shell

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Product-category windows | Product classes/categories etc. are AD windows rendered in the generic shell (de.M_Product_Category style backend records); semantics live in the business package, not in bespoke screens | `backend/de.metas.business/src/main/java/de/metas/product/`, shell `frontend/src/containers/MasterWindowContainer.js` |

### Odoo — categories with a smart-button product count + tags

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Product categories | Tree/form with parent field, optional company, child categories, a **product count smart button** linking to the filtered product list, and `product_properties_definition` — custom **Product Properties** defined on the category and filled on each product in it | `odoo/addons/product/views/product_category_views.xml`, model `odoo/addons/product/models/product_category.py` |
| Tags | Lightweight `product.tag` many-to-many chips with kanban/tag widget colors (searchable in every product list view) | `odoo/addons/product/views/product_tag_views.xml`, model `odoo/addons/product/models/product_tag.py` |
| Country groups | `res.country.group` for regional price computation (§6) | `odoo/addons/product/views/res_country_group_views.xml` |

**BOSS implications.** The references show two usable taxonomies, not one: category tree (structural, drives navigation, lookups and reports — Dolibarr's generic all-types design shows the same tree can classify products and vendors) and tags (Odoo's free-label chips). The category features that recur are parent/child with a single "view products in this branch" deep link (Odoo's category smart button), translations per node (Dolibarr `traduction.php` / Odoo), and separation from accounting classification (Carbon's only grouping is the posting group). Mantle already has this shape: `ProductCategory` typed by `productCategoryTypeEnumId` (Catalog, Industry, Internal, Search, Tax, Inventory Group…), many-to-many `ProductCategoryMember` with from/thru dates, `ProductCategoryRollup` for multiple parents, `ProductCategoryContent` for localized names, images and SEO text, and `ProductCategoryParty` for category-to-party links; tags can be a category type rather than a new record. Odoo's per-category product properties map to Mantle feature groups applied to a category (`ProductCategoryFeatGrpAppl`). Store-facing categories (`ProductStoreCategory`) are what the Commerce version of the Product 360 emphasizes (crosscut §3).

---

## 6. Pricing & costs

### Akaunting — plain price fields on the item

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Sale/purchase price fields | Item form billing section only: sale price & purchase price + tax select (+ optional description); no price lists, no tiers, no effective dating — prices live on document lines, computed there | `resources/views/common/items/create.blade.php` (Billing section), logic in `app/Http/Controllers/Common/Items.php` |

### AureusERP — price list with per-item/min-qty rules

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Price list CRUD | `PriceListResource`: header (name, currency, company, active) + **rule items**: apply to global / category / product / variant, min quantity, type fixed / percentage / formula, formula base (list price, cost or another price list) with discount, markup, rounding, surcharge and min/max margin, validity dates — the Odoo pricelist shape; no customer field on the rule | `plugins/webkul/products/src/Filament/Resources/PriceListResource/` (`Schemas/PriceListForm.php`), enums `plugins/webkul/products/src/Enums/{PriceRuleApplyTo,PriceRuleType,PriceRuleBase}.php`, models `plugins/webkul/products/src/Models/{PriceList,PriceRuleItem}.php` |
| Pricing rules engine | One resolver class picks the applicable rule and computes the price | `plugins/webkul/products/src/Services/PriceListResolver.php` |

### Carbon — separate price & costing forms + cost history chart

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Sale price form | Per-item: currency select, priceIncludingTax toggle (VAT-inclusive storage) | `apps/erp/app/modules/items/ui/Item/ItemSalePriceForm.tsx` |
| Costing form | Item posting group, `costingMethod` select (**Standard costing option explicitly filtered out** with a "not implemented yet" comment), unit cost, cost-is-adjusted flag | `apps/erp/app/modules/items/ui/Item/ItemCostingForm.tsx` |
| Cost history | Chart component plotting item cost over time (price-change visualization) | `apps/erp/app/modules/items/ui/Item/ItemCostHistoryChart.tsx` |

### Dolibarr — price page with history, multi-level prices & dynamic expressions

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Price page | `price.php` per product: current price + **multiprices levels** (conf `PRODUIT_MULTIPRICES_LIMIT`, e.g. retail/wholesale/qty tiers), with per-level base type (HT net-of-tax/TTC gross) + min price + `npr` (VAT-non-recoverable) flag; every change writes a **price-history log** row (user, date, old/new values) | `htdocs/product/price.php`, history writer `htdocs/product/class/product.class.php` (`_log_price` → `product_price` rows), per-customer prices `htdocs/product/class/productcustomerprice.class.php` |
| Dynamic price engine | Formula-based price evaluation: price expressions/variables parsed per product (price_parser) — rules can drive prices from cost/markup, dimensions etc. | `htdocs/product/dynamic_price/` (admin pages + `class/price_parser.class.php`) |
| Cost fields | Purchase cost & efficiency margin on product card; margin module ties cost→price visibility | `htdocs/product/class/product.class.php` (cost fields), margin module `htdocs/margin/` |

### ERPNext — price lists and item prices (in `stock/`) plus pricing rules (in `accounts/`)

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Price list master | Header w/ currency + buying/selling applicability flags + `price_not_uom_dependent` + countries child list | `erpnext/stock/doctype/price_list/{price_list.js,price_list.json}` (also `price_list_country/` child) |
| Item Price | Per item row: item_code, price list, customer/supplier, buying/selling flag, currency, **price_list_rate**, uom & packing_unit, valid_from (plus validity window) — the ledger of every price ever quoted | `erpnext/stock/doctype/item_price/{item_price.js,item_price.json,item_price.py}` |
| Price reports | "Item Prices" list report + item-wise price-list-rate report powering price maintenance screens | `erpnext/stock/report/{item_prices,item_wise_price_list_rate}/`, customer-side `erpnext/selling/report/customer_wise_item_price/` |
| Pricing Rule & Promotional Scheme | **Pricing Rule** (in Accounts): apply on item / item group / brand, selling or buying, applicable for customer / customer group / territory / sales partner / campaign / supplier / supplier group, min/max quantity and amount, validity, rate or discount or margin, free item, priority, coupon; the rules applied are recorded on each document line (`Pricing Rule Detail`); **Promotional Scheme** generates pricing rules from slabs | `erpnext/accounts/doctype/{pricing_rule,pricing_rule_detail,promotional_scheme}/` |
| Cost handling on Item | `standard_rate` & `valuation_rate` fields on the Item itself; **Item Standard Cost** is a separate submittable record per item and company (standard rate, effective date, revaluation entry) listed in the Item connections | `erpnext/stock/doctype/item/item.json`, `erpnext/stock/doctype/item_standard_cost/` |

### Ever Gauzy — per-variant cost and retail price

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Variant price entity | `ProductVariantPrice` one-to-one with a variant: `unitCost` + `unitCostCurrency`, `retailPrice` + `retailPriceCurrency`; the variant form's price fields populate it | `packages/core/src/lib/product-variant-price/{product-variant-price.entity.ts,product-variant-price.service.ts}` |
| Channel publication & sale terms | The catalog plugin publishes a product per sales channel (`product-channel`, status per channel) and answers whether a variant is sold on recurring terms and which variant is the default (`product-variant-sale`); prices are not per channel | `packages/plugins/catalog/src/lib/{product-channel,product-variant-sale}/` |

### metasfresh — the deepest pricing engine (all metadata/UI driven)

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Pricing engine | Rule-tree pricing: price systems → price lists → discount schema breaks with margin/currency/attribute-based conditions; copy-schema-break processes added to the window UI | `backend/de.metas.business/src/main/java/de/metas/pricing/`, legacy `backend/de.metas.business/src/main/java/org/adempiere/pricing/`, web-UI processes `backend/de.metas.ui.web.base/src/main/java/de/metas/ui/web/pricing/process/` |
| Costing engines | FIFO/standard/average costing with batches & movement costing; cost-revaluation + customs-tariff cost rates for imports | `backend/de.metas.business/src/main/java/de/metas/{costing,costrevaluation,customstariff,quantity}/` |

### Odoo — pricelist rules with a base and adjustments + an embedded report

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Pricelist & rules | `product.pricelist` form (currency, company, **country groups**) + `product.pricelist.item` rule grid: applied on variant / product / product category / all products, `compute_price` = fixed / discount / surcharge (markup) on a base (sales price, cost or another pricelist) with rounding and margins, min quantity, date range; customers get a pricelist through the partner field `property_product_pricelist` rather than through the rule | `odoo/addons/product/views/{product_pricelist_views,product_pricelist_item_views}.xml`, models `odoo/addons/product/models/{product_pricelist,product_pricelist_item,res_partner}.py` |
| Pricelist report | Server action + editor: printable multi-currency pricelist report; JS panel can render the breakdown inside product context | `odoo/addons/product/report/{product_pricelist_report.py,product_pricelist_report_templates.xml}`, UI `odoo/addons/product/static/src/js/pricelist_report/` |
| Cost side | Cost is a field per variant (`standard_price` visible in the template form's variant tab); revaluation views come from stock_account | `odoo/addons/product/views/product_views.xml` (cost group), `odoo/addons/stock_account/views/{product_views,product_value_views}.xml` |
| Daily-rates calendar | Calendar view over pricelist items for per-day rates (each entry an all-day date range), used by the pricelist item views | `odoo/addons/product/static/src/js/daily_rates_calendar/`, `odoo/addons/product/views/product_pricelist_item_views.xml` |

**BOSS implications.** The references point to two pricing screens: a **rule list UI** (price list header + scoped rules by product/category/variant, min qty, validity dates, currency — AureusERP, ERPNext Pricing Rule and Odoo converge on this shape; customer scope sits on the rule in ERPNext and on the customer in Odoo) and a **price-change history log** (Dolibarr stores every change with old/new values; `ProductPrice.price` already has `enable-audit-log="true"`, so the Moqui entity audit log holds the history and only a screen over it is missing). The evidence favors effective-dated rows over edited history (ERPNext Item Price, Mantle `ProductPrice.fromDate`/`thruDate`), and the references support tax-inclusive prices (Carbon `priceIncludesTax`, Dolibarr HT/TTC; Mantle `ProductPrice.taxInPrice`) and min-quantity tiers (`ProductPrice.minQuantity`). ERPNext's `Pricing Rule Detail` — which rules applied on each document line — is the nearest model for an **explain** output from the one price service (crosscut §4), which the price screens in Products, Sales, Commerce and Purchasing would all show; Mantle's `get#ProductPrice` today returns only price, list price and the chosen `productPriceId`. Costs get their own screens independent of price in the references: item standard cost with effective date (ERPNext Item Standard Cost), valuation method and a cost-history chart (Carbon), while stock valuation mechanics sit with stock and accounting in every reference (Odoo `stock_account`). Promotions and coupons are Marketing programs that Commerce and Sales also include (crosscut §4), and one option is evaluating them inside the same price service.

---

## 7. Product suppliers & purchasing references

### Akaunting — **absent**

| Screen/page | What it is | Key files |
| --- | --- | --- |
| **Absent** | Items carry no supplier linkage at all; purchasing references are only COGS on the item form | — |

### AureusERP — vendor prices live in the Purchases plugin

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Vendor prices | The products plugin defines the `ProductSupplier` model (vendor, vendor product name/code, min qty, price, discount, delay, validity) but renders no UI for it; the **purchases** plugin does: a **Vendor Prices** resource under Configurations and a **Vendors** sub-page (`ManageVendors`) on its product resource | `plugins/webkul/products/src/Models/ProductSupplier.php`, `plugins/webkul/purchases/src/Filament/Admin/Clusters/Configurations/Resources/VendorPriceResource.php`, `plugins/webkul/purchases/src/Filament/Admin/Clusters/Products/Resources/ProductResource/Pages/ManageVendors.php` |

### Carbon — supplier part records drive the item's purchasing defaults

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Supplier parts on item | Purchasing tab of the part: **Supplier Parts** list (supplier, supplier part id, currency, unit price, supplier UOM + conversion factor, minimum order quantity, order multiple) with **price breaks** per supplier part; the item purchasing form holds purchasing UOM, conversion factor, **preferred supplier**, lead time and purchasing-blocked | `apps/erp/app/modules/items/ui/Item/SupplierParts/{SupplierParts,SupplierPartPrice}.tsx`, `apps/erp/app/modules/items/ui/Item/{SupplierPartForm,ItemPurchasingForm}.tsx`, routes `apps/erp/app/routes/x+/part+/$itemId.purchasing.tsx` |

### Dolibarr — supplier prices tab on the product

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Supplier prices page/tab | `price_suppliers.php` ("Buying prices" tab): per-supplier price rows on the product — supplier ref, min quantity, price (net or gross base), VAT, discount, delivery delay in days, packaging, supplier reputation, multicurrency price; **advanced permission** `product_advance.write_supplier_prices` gates writing supplier prices separately from product edit | `htdocs/product/price_suppliers.php`, class `htdocs/fourn/class/fournisseur.product.class.php`, permission in `htdocs/core/modules/modProduct.class.php` |
| Supplier ref in search | The supplier ref stored on those rows is a search field of the product list (§2) | `htdocs/product/list.php` (`search_ref_supplier`) |

### ERPNext — supplier children on the Item

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Item supplier child | Simple child table on Item: `supplier` + `supplier_part_no` (the SKU as the vendor knows it); the per-company `item_default` child carries `default_supplier` among its purchase defaults, and supplier prices are Item Price rows with `supplier` + `buying` | `erpnext/stock/doctype/item_supplier/item_supplier.json`, `erpnext/stock/doctype/item_default/item_default.json`, `erpnext/stock/doctype/item_price/item_price.json` |
| Item Lead Time | Separate doctype per item (linked from the Item connections): manufacturing time, shifts, capacity, purchase and buffer time, with a child **Item Lead Time Supplier** (supplier, purchase time, buffer time, is default) | `erpnext/stock/doctype/{item_lead_time,item_lead_time_supplier}/` |

### Ever Gauzy — **absent** vendor catalogs in product UI

| Screen/page | What it is | Key files |
| --- | --- | --- |
| **Absent** | Inventory/product pages have no supplier mapping; variant prices are a single cost/retail pair (§6) | — |

### metasfresh — BPartner product records as a first-class engine

| Screen/page | What it is | Key files |
| --- | --- | --- |
| BPartner product | Vendor/partner-specific product identity engine (per-partner product code/name/query, effective records, exclusion) on top of the product; callout helpers on the bpartner window | `backend/de.metas.business/src/main/java/de/metas/bpartner_product/`, `backend/de.metas.adempiere.adempiere/base/src/main/java/de/metas/bpartner/product/` |
| Purchasing references | Receipt schedules/procurement windows pick up vendor product data (`de.metas.vendor.gateway.api` handles external supplier catalogs) | `backend/de.metas.procurement.base/`, `backend/de.metas.vendor.gateway.api/` |

### Odoo — "Vendor Information" as its own mini-master

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Supplierinfo CRUD | Standalone searchable list ("Vendor") + per-vendor price rows: vendor, product (tmpl or variant), unit price, min quantity, currency, **validity dates**, plus delivery lead time & company; server-side "warnings on purchase orders" group extends the product form | `odoo/addons/product/views/product_supplierinfo_views.xml`, model `odoo/addons/product/models/product_supplierinfo.py` |
| Purchase-side product views | Purchase module patches the product form (vendor field `seller_ids`, purchase description, PO warning group) and adds forecasted columns in picking-views | `odoo/addons/purchase/views/product_views.xml` |

**BOSS implications.** Supplier product references are rows of their own, not item fields: vendor + vendor's part number + unit price + min qty + validity + lead time (Odoo supplierinfo, Carbon supplier parts, AureusERP `ProductSupplier`, Dolibarr buying prices agree; ERPNext splits them across Item Supplier, Item Price and Item Lead Time). Mantle has **no separate supplier-product entity**: a supplier price is a `ProductPrice` row with `vendorPartyId`, carrying `otherPartyItemId`/`otherPartyItemName` (vendor part number), `minQuantity`, `fromDate`/`thruDate`, `standardLeadTimeDays`, `preferredOrderEnumId` (`SpoMain` main / `SpoAlternate` alternate supplier), `supplierRatingTypeEnumId`, `quantityIncrement` and `canDropShip` — the Odoo/Carbon field set already. The Product 360 **Suppliers** tab, which the Products and Purchasing versions both show (crosscut §3), and the Supplier 360 (reused: Purchasing, Accounting, Warehouse) are two views of the same rows; AureusERP shows the same split (vendor prices rendered by the purchases plugin on its re-exposed product resource). Dolibarr gates supplier-price writing behind its own permission (`write_supplier_prices`), and Carbon and ERPNext let the main-supplier row feed purchasing defaults and cost estimates (Carbon preferred supplier, ERPNext default supplier and `is_default` lead time); both are candidates.

---

## 8. Media, documents & attachments

### Akaunting — a generic attachments pipeline only

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Uploads controller | Every module's attachments route through one `Uploads` controller (file route/delete via signed URLs) — used for invoice/bill files as much as anything on items; the item form itself has no media/picture widget in this checkout | `app/Http/Controllers/Common/Uploads.php`, shared file group `resources/views/components/form/group/file.blade.php` |

### AureusERP — gallery FileUpload on the form section

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Product media section | `mediaSection` in the product form: `FileUpload::make('images')->image()` multi-upload; images persist as an array cast on the Product model | `plugins/webkul/products/src/Filament/Resources/ProductResource/Schemas/ProductForm.php` (`mediaSection`), model `plugins/webkul/products/src/Models/Product.php` (`images` array cast) |

### Carbon — dedicated item documents panel over a files module

| Screen/page | What it is | Key files |
| --- | --- | --- |
| ItemDocuments | Panel inside the item detail rendering `ItemFile` rows from object storage with optimistic-upload merge (`attachmentsByName` map joins pending + saved files), download/delete, and a separate **3D model** upload for CAD files (`ModelUpload`) | `apps/erp/app/modules/items/ui/Item/ItemDocuments.tsx` |

### Dolibarr — per-object document page with PDF merge

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Documents tab | `product/document.php`: list of uploaded/generated docs for the product with actions (generate doc template, delete), shared tpl for headers/actions; hooks `productdocuments` extend panels | `htdocs/product/document.php`, shared `htdocs/core/tpl/document_actions_post_headers.tpl.php` |
| Generated PDF merge | Documents tab can merge proposal PDFs into the product documents (per-product merged-file aggregation) | `htdocs/product/document.php` (merge block ~line 304), merge class `htdocs/product/class/propalmergepdfproduct.class.php` |

### ERPNext — desk attachments + spec child grid

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Desk attachments | Item form image/attachments are the Framework's standard: `image` field + attachments sidebar (files framework-wide); nothing product-specific beyond `item_website_specification` child for ecommerce specs | `erpnext/stock/doctype/item/{item.json,item.js}`, `erpnext/stock/doctype/item_website_specification/` |

### Ever Gauzy — gallery + merchandising image assets

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Product gallery | `product-gallery` subcomponent on the product form (photo strip + featured) | `apps/gauzy/src/app/pages/inventory/components/edit-inventory-item/product-gallery/` |
| Image asset entities | Product carries `imageUrl`, `featuredImage (ImageAsset)` with org-level `isFeatured` + `sortOrder` merchandising flags; shared image-uploader/image-asset UI components | `packages/core/src/lib/product/product.entity.ts`, `packages/ui-core/shared/src/lib/{image-asset,image-uploader}/` |

### metasfresh — attachment engine in the AD core

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Attachments | Generic attachment entries on any record, opened from the window header (attach file or URL); document archive for generated PDFs | `backend/de.metas.adempiere.adempiere/base/src/main/java/de/metas/attachments/`, `backend/de.metas.ui.web.base/src/main/java/de/metas/ui/web/attachments/`, `frontend/src/components/header/{Attachments,AttachUrl}.js`, archive `backend/de.metas.document.archive/` |

### Odoo — product documents kanban with upload button

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Product documents | Dedicated `product.document` model rendered as a **kanban of files per product/variant** (cards preview images/PDFs) with an upload button; the product form's Documents smart button opens it; `res_model` can be template or variant, so docs attach per-variant | `odoo/addons/product/views/product_document_views.xml`, OWL panel `odoo/addons/product/static/src/js/product_document_kanban/` (`product_document_kanban_{view,controller,record,renderer}.js`, `upload_button/`), model `odoo/addons/product/models/product_document.py` |
| Product images | Template image (`image_1920` with resized copies) and an optional per-variant image (`image_variant_1920`) that overrides it, reused wherever product images are shown | `odoo/addons/product/views/product_template_views.xml`, `odoo/addons/product/models/product_product.py` |

**BOSS implications.** The references favor one central attachment mechanism reused per module (Akaunting's single Uploads controller, Dolibarr's shared document tab template, metasfresh's generic attachments) with product documents **variant-scopeable** (Odoo `product.document` on template or variant is the clearest seam), shown as kanban-style file cards with preview for images/PDFs (Odoo product document kanban is the best UX reference) and with optimistic upload so re-uploads don't flash empty states (Carbon ItemDocuments). Mantle already has the record: `ProductContent` (location, `productContentTypeEnumId` with image sizes, specification, warranty, instructions, label text, meta keywords…, `locale`, optional `productFeatureId` and `productStoreId`, from/thru dates) — the variant/feature scope and per-store scope are fields, not new entities. Image-plus-merchandising flags (Ever Gauzy `featuredImage`, `isFeatured`, `sortOrder`) and storefront content per store are what the Commerce version of the Product 360 emphasizes (crosscut §3); the product document library over the same `ProductContent` rows is a Products screen.

---

## 9. UOM, packaging & barcodes

### Akaunting — **absent**

| Screen/page | What it is | Key files |
| --- | --- | --- |
| **Absent** | No UOM master (quantity is bare number), no packaging, no barcode fields on items | — |

### AureusERP — packaging master with barcode + a barcode plugin

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Packaging resource | `PackagingResource` (name, barcode, product, qty, company): sellable packages of a product (box/unit multiples) with their own barcode; Purchases repeats it under Configurations | `plugins/webkul/products/src/Filament/Resources/PackagingResource/` (+ `Schemas/PackagingForm.php`) |
| Barcode scanning UI | Separate `barcode` plugin with Livewire components (scan-driven tooling added via Filament) | `plugins/webkul/barcode/src/{BarcodePlugin.php,Filament,Livewire,Support}` |

### Carbon — UOM form/table in the items module

| Screen/page | What it is | Key files |
| --- | --- | --- |
| UOM master | `UnitOfMeasureForm` + `UnitOfMeasuresTable` (flat master; conversion not modeled as categories but item-level storage fields carry dims) | `apps/erp/app/modules/items/ui/UnitOfMeasure/{UnitOfMeasureForm,UnitOfMeasuresTable}.tsx`, semantic checks `apps/erp/app/modules/items/method-material-storage-units.test.ts` |

### Dolibarr — barcode module + product barcode fields

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Barcode engine/masks | `htdocs/admin/barcode.php` config (encoders + numbering masks), gen/init pages assign codes and print sheets using the printsheet templates in `htdocs/core/modules/printsheet/` | `htdocs/barcode/{codeinit.php,printsheet.php}`, `htdocs/admin/barcode.php` |
| Product-side barcode | Barcode + barcode-type (EAN/UPC/other) fields on the product card, creation gated by `BARCODE_USE_ON_PRODUCT` + advanced permission (`barcode.creer_advance`); barcode is a search token in product list (§2) | `htdocs/product/card.php` (lines ~238–340), lookup `htdocs/core/class/html.formbarcode.class.php` |
| Units | Product card carries weight / net-weight / volume (+ their unit selectors); UOM conversion is not modeled (quantity stays a bare numeric) | `htdocs/product/class/product.class.php` |

### ERPNext — 3 masters: UOM, UOM category, item barcodes child

| Screen/page | What it is | Key files |
| --- | --- | --- |
| UOM doctype | `uom` master (name, `must_be_whole_number` flag with a delete/blocklist check in `uom.py`) used everywhere by item UOM fields | `erpnext/setup/doctype/uom/{uom.js,uom.json,uom.py}`; categories & conversions row below |
| UOM categories & conversions | `UOM Category` groups (which in this checkout is itself under stock) + `UOM Conversion Factor` (to_uom/from_uom/factor) reconciling conversions; Item carries a `uoms` child (conversion per UOM + price factor) and `unit_of_measure_conversion` field | `erpnext/stock/doctype/uom_category/`, `erpnext/setup/doctype/uom_conversion_factor/` |
| Item barcodes | `barcodes` child on Item: `barcode` value + `barcode_type` (type sequence: EAN/Code/GS1/QR...) + per-line uom | `erpnext/stock/doctype/item_barcode/item_barcode.json` |

### Ever Gauzy — product units inline

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Units on the variant | Each variant references a **stock unit** (must be the reference unit of its category), optional **sales** and **purchase** units (same category) and a **weight unit**; no standalone UOM screen in the inventory pages | `packages/core/src/lib/product-variant/product-variant.entity.ts` |

### metasfresh — dedicated UOM engines + handling units for packaging

| Screen/page | What it is | Key files |
| --- | --- | --- |
| UOM | UOM conversion engine (business-side services under `de/metas/uom`: uom, conversions, standard/base UOM resolution) consumed by every pricing/inventory window | `backend/de.metas.business/src/main/java/de/metas/uom/` |
| Handling units | Packaging as first-class entities (HU packing instructions, TUs/LUs) — the packaging/goods-units engine, mostly a Warehouse topic | `backend/de.metas.handlingunits.{base,webui,mobileui}/` |
| Barcode/scan | GS1 decoder + scanned product-code resolution feeding barcode-driven picking and receipt applets | `backend/de.metas.business/src/main/java/de/metas/gs1/`, `backend/de.metas.adempiere.adempiere/base/src/main/java/de/metas/product/{ResolvedScannedProductCode,ResolvedScannedProductCodes}.java` |

### Odoo — uom addon, packaging in stock, barcode nomenclatures

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Units & packagings page | "Units & Packagings" list/form: **no UOM categories in this version** — each unit names a reference unit (`relative_uom_id`) and a quantity (`relative_factor`), forming a tree with a computed absolute `factor`; archive flag | `odoo/addons/uom/views/uom_uom_views.xml`, model `odoo/addons/uom/models/uom_uom.py` |
| Base units | `product.base.unit` (units such as m² used to show a price per base unit) | `odoo/addons/product/views/product_base_unit_views.xml` |
| Packaging barcodes | Packaging is now a unit: `product.uom` links a product to a pack unit with its own **barcode** ("Packaging Barcodes" editable list), opened from the product form button `action_open_packaging_barcodes` | `odoo/addons/product/views/uom_views.xml`, model `odoo/addons/product/models/product_uom.py`, button in `odoo/addons/product/views/product_views.xml` |
| Barcode nomenclatures | Scanner configuration: `barcode.nomenclature` with rules parsed by the `barcode_parser` JS lib (GS1 support); partners carry barcodes too | `odoo/addons/barcodes/views/barcodes_view.xml`, `odoo/addons/barcodes/static/src/js/barcode_parser.js` |
| Label printing | Product label report launcher + print sheets; barcode/serial QR labels in the webui wizard `product.label.layout` | `odoo/addons/product/report/{product_product_templates.xml,product_reports.xml}`, wizard `odoo/addons/product/wizard/{product_label_layout.py,product_label_layout_views.xml}` |

**BOSS implications.** In the references UOM sits at the data-model level: a typed unit table with conversions (ERPNext UOM Category + UOM Conversion Factor; Odoo now uses a reference-unit tree instead of categories), plus per-item conversions in a child grid (ERPNext Item `uoms`, Ever Gauzy stock/sales/purchase units per variant, Carbon supplier UOM + conversion factor). The Moqui framework already has `moqui.basic.Uom` (typed by `uomTypeEnumId`) and `UomConversion` (factor, offset, from/thru dates); Mantle adds per-product `ProductDimension` (weight, length… with a unit) and `ProductUomDimension`, and `Product.amountUomId`/`amountFixed` for the sold quantity. The references model packaging as (product, pack quantity, barcode, label) with a pack-size picker on document lines (AureusERP Packaging, Odoo `product.uom`); in Mantle the candidates are a pack product linked by `ProductAssoc` (`PatAlternativePkg` / `PatPackagingFor`) or a `ProductUomDimension` (§14 Open questions). Barcodes take typed codes on the item (ERPNext `barcode_type`, Dolibarr barcode type; Mantle `ProductIdentification` with UPC-A, UPC-E, EAN, GTIN, ISBN, SKU, HTS types) and a nomenclature/parser config for scanners (Odoo `barcode.nomenclature`, metasfresh GS1) — the same codes then feed label printing (Odoo label layout wizard, Dolibarr printsheet) and scanning in Warehouse.

---

## 10. Product 360 & per-app tabs

### Akaunting — no product record view across modules

| Screen/page | What it is | Key files |
| --- | --- | --- |
| **Absent / list-only** | No reverse-link surfaces; item detail shows attachments + documents where it appears, but there's no per-product workbench aggregating orders/purchases | — |

### AureusERP — one product resource re-exposed by each app with its own tabs

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Per-app product resource | Purchases, Inventories, Sales and Manufacturing each have a **Products** cluster whose `ProductResource` extends a base resource (Purchases from Accounts, Manufacturing from Inventories) and adds the same sub-pages: **Attributes, Variants, Vendors, Quantities, Moves, Bills of Materials** — the closest reference to one Product 360 with per-app tabs; other plugins inject form blocks through `ProductSchemaRegistry` (§3) | `plugins/webkul/purchases/src/Filament/Admin/Clusters/Products/Resources/ProductResource.php` (+ `ProductResource/Pages/{ManageVendors,ManageQuantities,ManageMoves,ManageBillsOfMaterials}.php`), `plugins/webkul/inventories/src/Filament/Clusters/Products/Resources/ProductResource.php`, `plugins/webkul/sales/src/Filament/Clusters/Products/Resources/ProductResource.php`, `plugins/webkul/manufacturing/src/Filament/Clusters/Products/Resources/ProductResource.php` |
| Inventories clusters | `inventories` plugin clusters: Products, Operations, Reporting, Configurations, Settings; its widgets are operation-type cards, not product KPIs | `plugins/webkul/inventories/src/Filament/Clusters/`, `plugins/webkul/inventories/src/Filament/Widgets/` |

### Carbon — one item record with cross-module sub-forms and exploration

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Manufacturing sub-forms | BOM/BOP/BoM-explorer components on the item (recipe sheets, method operations/materials tables) | `apps/erp/app/modules/items/ui/Item/{BillOfMaterial,BillOfProcess,BoMExplorer,MethodRow,MakeMethodTools,MakeMethodVersionStatus}.tsx`, `apps/erp/app/modules/items/ui/Methods/`, production side `apps/erp/app/modules/production/` |
| Reverse links | `UsedIn.tsx` enumerates wherever the item is consumed (BOMs/methods/order templates), with `PlannedOrderDetailsPopover` and a planning chart | `apps/erp/app/modules/items/ui/Item/{UsedIn,PlannedOrderDetailsPopover,ItemPlanningChart,ItemPlanningForm}.tsx` |
| Risk & revisions 360 | Risk register + revision/change-notice stack inside the same record header | `apps/erp/app/modules/items/ui/Item/{ItemRiskRegister,RevisionForm}.tsx`, `apps/erp/app/modules/items/ui/ChangeNotice/` |

### Dolibarr — per-tab stats pages around the product

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Referring objects & statistics | **Referring objects** tab: `htdocs/product/stats/` pages each list linked documents of one type for the product — proposals, customer orders, invoices (customer, supplier, recurring), supplier proposals and orders, receptions, contracts, shipments, MOs, BOMs; a **Statistics** tab (`stats/index.php`) charts quantities and amounts per period | `htdocs/product/stats/{propal,commande,facture,facture_fournisseur,facturerec,supplier_proposal,commande_fournisseur,reception,contrat,expedition,mo,bom,index}.php` |
| Composition (kits) | Kit tab: sub-products with quantity and an inc/dec flag saying whether component stock moves with the kit | `htdocs/product/composition/card.php` |
| Stock views on product | Stock tab per warehouse and movements list for the product | `htdocs/product/stock/{product.php,movement_list.php}` |

### ERPNext — Item "connections" heatmap + doctype dashboards

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Item connections panel | Reverse links with counts, grouped **Groups** (BOM, Product Bundle, Item Alternative), **Pricing** (Item Price, Pricing Rule), **Sell** (Quotation → Sales Invoice), **Buy** (Material Request → Purchase Invoice), **Manufacture** (Production Plan, Work Order, Item Manufacturer), **Traceability** (Serial No, Batch), **Stock Movement**, **Lead Time**, **Standard Cost**; plus a stock-movement heatmap | `erpnext/stock/doctype/item/item_dashboard.py` |
| Stock levels section | Warehouse-wise stock levels (actual, reserved, ordered, projected) rendered inside the Item form | `erpnext/stock/dashboard/{item_dashboard.py,item_dashboard.js,item_dashboard_list.html}`, mounted from `erpnext/stock/doctype/item/item.js` |
| Sales-side views | Selling chart **Item-wise Annual Sales** and report **Item-wise Sales History** | `erpnext/selling/dashboard_chart/item_wise_annual_sales/`, `erpnext/selling/report/item_wise_sales_history/` |
| Ecommerce-ish leftovers | `www/all-products` is an empty shell (only an empty `__init__.py`; the webshop moved to the separate `webshop` app, not in this checkout) + `website_item_group` setup doctype (no Website Item doctype in this checkout) | `erpnext/www/all-products/`, `erpnext/setup/doctype/website_item_group/` |

### Ever Gauzy — variants/warehouse tabs as the product 360

| Screen/page | What it is | Key files |
| --- | --- | --- |
| View item page | `view-inventory-item` component (per-route `view/:id` read-only page) showing the product with its variants | `apps/gauzy/src/app/pages/inventory/components/view-inventory-item/` |
| Warehouses & merchants | Sibling sub-routes of the inventory module (`warehouses`, `merchants`) with their own tables; warehouse stock per product is kept there, not on the product page | `apps/gauzy/src/app/pages/inventory/components/{manage-warehouses,manage-merchants}/` |
| Shared mutation helper | `product-mutation` helper provides create/update/duplicate shorthands reused by the wizard and is org-scoped | `packages/ui-core/shared/src/lib/product/product-mutation/` |

### metasfresh — windows + processes compose the product view

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Product-related processes | Product window processes like `WEBUI_M_Product_LotNumber_Quarantine` (quarantine lot handler surfaced as button) inside the generic window | `backend/de.metas.ui.web.base/src/main/java/de/metas/ui/web/product/process/` |
| Stock views | Receipts/picking candidates per product are separate windows (warehouse) *(reached from the product via quick actions — unverified)* | `backend/de.metas.ui.web.base/src/main/java/de/metas/ui/web/{receiptSchedule,picking,inoutcandidate}/` |

### Odoo — one product template button-box shared across modules

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Smart buttons in the same product form | Stock addon patches the product/category forms: category button-box "Putaway Rules" + Logistics page; on the product it adds stat buttons to the same button box as **Documents** (`action_open_documents`): On Hand (`action_open_quants`), Forecasted, Lots/Serial numbers, Reordering rules (`action_view_orderpoints`), Putaway rules | `odoo/addons/stock/views/product_views.xml`, `odoo/addons/product/views/product_views.xml` (`product_template_form_view` button_box) |
| BOM & MO buttons | MRP patches the product form: **Bill of Materials**, **Used In** and manufactured-quantity stat buttons (template & variant level) | `odoo/addons/mrp/views/product_views.xml` |
| Sales and purchase buttons | Sale adds a **Sold** stat button (`sales_count`) and a sales-order warning; Purchase adds **Purchased** (`purchased_product_qty`), purchase description and a PO warning (`odoo/addons/purchase/views/product_views.xml`); the customer-facing storefront lives in `website_sale` (+ eight `website_sale_*` addons, all in this community checkout; see research-commerce.md) | `odoo/addons/sale/views/product_views.xml` |

**BOSS implications.** The references converge on a **button-box pattern** over one record: each module adds reverse-linked counts and tabs (Odoo stat buttons patched in by stock, mrp, sale and purchase; ERPNext connections; Dolibarr referring objects; AureusERP's per-app product resources with Vendors/Quantities/Moves/BOM sub-pages; Carbon's per-concern tabs and Used In). In BOSS terms this is the reused **Product 360** (crosscut §3): one screen, built once and included in each app that needs it, with the app and role context selecting the tabs. The Products version emphasizes master data, variants and features, categories, identifications, dimensions, content/documents, prices, costs, price rules and the supplier list; the **Purchasing** version supplier prices and lead times; **Manufacturing** BOM and where-used; **Warehouse** stock, lots and locations (through the reused Inventory availability screen); **Accounting** cost history; **Sales** price and availability; **Commerce** merchandising, store categories and SEO. A documents tab (Odoo product documents) and a connections/referring-documents list with counts (ERPNext item dashboard, Dolibarr `product/stats/`) are the two features every reference converged on, which suggests them in every app's version. AureusERP hides the tabs of plugins that are not installed; the same rule would hide tabs whose app is not enabled or that the user may not see.

---

## 11. Catalog settings & configuration

### Akaunting — categories + defaults, no product-specific options

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Settings relevant to items | Generic settings: categories (§5) and Settings → Defaults (default account, currency, income and expense category, tax, list limit); no product feature toggles — item handling is fixed by code | `app/Http/Controllers/Settings/{Defaults,Categories}.php`, views `resources/views/settings/{default,categories}/` |

### AureusERP — one settings class with 4 capability toggles

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Product settings page | `ProductSettings` (spatie/laravel-settings group `products_product`): **enable_variants, enable_uom, enable_packagings, enable_price_lists** — four feature switches that reshape the whole products plugin UI | `plugins/webkul/products/src/Settings/ProductSettings.php` |

### Carbon — nothing product-specific

| Screen/page | What it is | Key files |
| --- | --- | --- |
| **Absent** | No catalog options screen; item behaviors are code-fixed (beta gating exists module-wide only); feature surface is the nav registry | `apps/erp/app/modules/items/ui/useItemsSubmodules.tsx` |

### Dolibarr — product admin pages per concern

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Product module admin | Price model choice (one price, multiprice levels with `PRODUIT_MULTIPRICES_LIMIT`, customer prices, prices by quantity), product code numbering and PDF models, kits (`PRODUIT_SOUSPRODUITS`), customer/supplier packaging, description autofill; lot/serial settings on their own page | `htdocs/product/admin/product.php`, `htdocs/product/admin/product_lot.php` |
| Dynamic prices & price rules admin | Price expressions and variables for formula prices; **multiprice rules** deriving each price level from another level with a percentage | `htdocs/product/admin/{dynamic_prices.php,price_rules.php}` |
| Product tools | Mass change of the VAT rate on all products | `htdocs/product/admin/product_tools.php` |

### ERPNext — settings doctypes scattered as capability toggles

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Stock Settings | Desk settings entity with product-relevant defaults plus stock options: **item_naming_by, default item_group, default stock_uom, valuation_method, show_barcode_field, clean_description_html, auto-insert price list rate** (alongside stock controls like negative stock/freeze) | `erpnext/stock/doctype/stock_settings/stock_settings.json` |
| Feature toggles family | Separate settings doctypes per feature: item variant settings (§4), delivery settings, stock reposting settings — each own dir with `*_settings.{js,json,py}` | `erpnext/stock/doctype/{item_variant_settings,delivery_settings,stock_reposting_settings}/` |
| Item taxonomy defaults | Default item group hierarchy feeds the workspace tree and Stock Settings's `item_group` default | `erpnext/setup/doctype/item_group/`, `erpnext/stock/doctype/stock_settings/stock_settings.json` |

### Ever Gauzy — per-variant capability flags

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Product variant settings entity | `ProductVariantSetting` — one settings row per variant with boolean columns **isSubscription, isPurchaseAutomatically, canBeSold, canBePurchased, canBeCharged, canBeRented, isEquipment, trackInventory**; REST at `/product-variant-settings` and a GraphQL resolver | `packages/core/src/lib/product-setting/{product-setting.entity.ts,product-setting.controller.ts,product-setting.resolver.ts}`, schema `packages/core/src/lib/product-setting/schema/product-setting.type.gql` |
| UI setting widgets | Org-level product type/category/merchant management tables are the pickers' configured sources | `apps/gauzy/src/app/pages/inventory/components/manage-product-types/` |

### metasfresh — product config is backend windows/params

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Product config anchors | Pricing/UOM/packaging configuration as windows/parameters in the generic shell (de.metas.pricing & de.metas.uom packages define the systems) | `backend/de.metas.business/src/main/java/de/metas/{pricing,uom}/` |

### Odoo — res.config.settings page + security groups

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Product settings page | Weight/volume UOM choice (`product_weight_in_lbs`), volume units, and upgrade-boolean entries to install barcode-lookup module etc. | `odoo/addons/product/views/res_config_settings_views.xml`, `odoo/addons/product/models/res_config_settings.py` |
| Variant/packaging groups | Feature enablement is via security groups: `group_product_variant` gates the whole variant machinery inline in views | `odoo/addons/product/security/product_security.xml`, `odoo/addons/product/models/res_groups.py` |

**BOSS implications.** Catalog configuration is mostly a few capability toggles: AureusERP's four booleans (variants, UOM, packaging, price lists) reshape the whole products plugin, Odoo does the same with security groups (`group_product_variant`, `group_product_pricelist`), and ERPNext gathers defaults in Stock Settings (naming, default item group and UOM, valuation method, barcode field, auto-insert price list rate). One option is a Products settings section (crosscut §4: every app has its own settings section, and the Admin settings index links to it) holding these switches as Moqui preferences or settings records per organization, with permissions as the second axis (viewing vs editing variants and prices). Ever Gauzy's per-variant flags (can be sold, purchased, rented, subscribed, stocked) are the same idea at product level; Mantle covers most of them with `productTypeEnumId`, `assetTypeEnumId`, `requireInventory`, `returnable`, `taxable` and the sales intro/discontinue dates, so few new fields look necessary.

---

## 12. Cross-app surfaces

| Reused screen or link | Use in Products | Other apps that include it | Reference evidence |
| --- | --- | --- | --- |
| **Product 360** | Full editor: master data, type and class, identifications and barcodes, variants and features, categories, dimensions and units, content/documents, list and base prices, costs, price rules, associations, supplier list; other apps' tabs shown when their app is enabled and the user may see them | Commerce (merchandising, store categories, SEO); Purchasing (supplier rows, lead times, sourcing); Manufacturing (BOM, where-used); Warehouse (stock, lots, locations); Accounting (cost history); Sales (price and availability) | Odoo product form patched by stock, mrp, sale, purchase (`odoo/addons/{stock,mrp,sale,purchase}/views/product_views.xml`); AureusERP per-app `ProductResource` with Vendors/Quantities/Moves/BOM sub-pages; ERPNext item connections; Carbon part tabs; Dolibarr product tabs |
| **Supplier 360** and the Product 360 **Suppliers** tab | Supplier prices: the same `ProductPrice` rows with `vendorPartyId` (part number, lead time, main/alternate supplier), seen per product on the Suppliers tab and per supplier on Supplier 360 | Purchasing (terms, sourcing, performance); Accounting (AP balance, bills); Warehouse (inbound receipts) | Odoo supplierinfo (in `product`, patched by `purchase`); Carbon supplier parts with price breaks; AureusERP Vendor Prices + product Vendors page; Dolibarr Buying prices tab with its own write permission |
| **Prices & price rules** | Price lists, base prices, costs, price rules, and the explain output of the one price service (`get#ProductPrice`) | Sales (customer and agreement prices); Commerce (store prices); Purchasing (supplier prices); Marketing (promotion programs) | Odoo pricelist rules; ERPNext Price List, Item Price, Pricing Rule (+ Pricing Rule Detail on lines); AureusERP price list rules; Dolibarr multiprice levels, customer prices, price log |
| Product 360 **BOM & where-used** tab | BOM and where-used tab beside the product's make/buy flag and standard cost | Manufacturing (BOM and routing editing, where-used) | Odoo **Bill of Materials** / **Used In** stat buttons; Carbon BoM explorer and Used In; ERPNext connections **Groups** (BOM, Product Bundle, Item Alternative); Dolibarr BOM referring objects |
| **Inventory availability** (Product 360 Stock tab) | Stock, lots and locations tab; per-facility reorder settings (`ProductFacility`) shown on the product, where they are edited being open (crosscut §8) | Warehouse (full stock by facility, location, lot); Customer Service; Purchasing; Sales; Manufacturing; Commerce | ERPNext stock-levels section on Item; Odoo on-hand/forecast buttons; AureusERP Quantities and Moves pages; Dolibarr Stock tab; Mantle `ProductFacility` (minimum stock, reorder quantity, days to ship) |
| Product 360 **Cost history** tab | Cost history tab; product GL account overrides | Accounting (cost history, valuation) | Carbon cost-history chart and Accounting tab; ERPNext Item Standard Cost; Odoo `stock_account` valuation views; Mantle `ProductGlAppl` (cost entities `CostComponent`, `ProductAverageCost` are commented out) |
| **Customer agreements** (link) | Price and availability on the product; agreement prices shown as `ProductPrice` rows with `agreementId` (the agreements are `Agreement`, `AgreementItem`) | Sales (agreements, agreement prices); Accounting (terms); Customer Service (read) | Odoo Sold button and partner pricelist; ERPNext Pricing Rule for customer/customer group; Carbon customer part numbers |
| Product 360 **Merchandising** tab and store categories | Internal taxonomy and the product document library; store categories, SEO and store-specific content on the Product 360 where Commerce is in use | Commerce (merchandising, store categories, SEO) | Odoo `website_sale` (see research-commerce.md); Ever Gauzy catalog plugin channel publication; Mantle `ProductStoreCategory`, `ProductContent.productStoreId`, `ProductOtherIdentification` URL slugs |
| **Promotions, coupons** (link) | Promotion programs as they affect product prices; one option is evaluating them in the same price service (today `apply#OrderPromotions` runs on orders, §13) | Marketing (programs); Commerce (store promotions and checkout); Sales (manual discounts on quotes) | ERPNext Promotional Scheme → Pricing Rules; Mantle `ProductStorePromotion`, `PromotionServices.xml` |
| **Dashboard widgets** | Landing-page KPI cards (active products, products without price, variants) | Insights (dashboards, widget builder); every app's landing page | ERPNext Stock workspace chart and number cards; Akaunting's widget board has no product widget |

**BOSS implications.** The references converge on one product record screen whose tabs vary by module (Odoo, AureusERP, ERPNext) and one price computation behind every price screen. In BOSS terms the Product 360 is built once and each app that includes it shows the tabs its audience needs, and every price screen (Products, Sales, Commerce, Purchasing) reads through `get#ProductPrice`, so no app keeps a copy of the product screen or its own price logic.

---

## 13. Current Moqui baseline (mr-marble / MarbleERP / Mantle)

The baseline has a broad product data model and a working SimpleScreens **Catalog** app, but no product home, no price-list or price-rule screen, no supplier-price list, no cost screen and no per-app Product 360 tabs. MarbleERP (`component/mr-marble/screen/marble.xml`) only mounts the SimpleScreens `Catalog.xml` tree; it has no product screens of its own. IronStone BOSS has no product screens yet (`component/mr-boss/screen/boss.xml` mounts search and reports only).

### Screens

| Screen/page | What it is | Key files |
| --- | --- | --- |
| Catalog dashboard | Five plain links: Products, Search Products, Categories, Features, Feature Groups | `component/mr-marble/screen/SimpleScreens/Catalog/dashboard.xml` |
| Find Product | Create dialog (name, type, owner); list with saved finds, column selection, CSV export, page size; filters ID, name, type, class, asset type/class, owner, other ID, assoc-from (virtual, BOM), feature, category | `component/mr-marble/screen/SimpleScreens/Catalog/Product/FindProduct.xml` (`mantle.product.ProductFindView`) |
| Edit Product | Product form (ID, name, description, internal comments, type, class, asset type/class, owner, amount + UOM, sales intro/discontinue, signature required, ship insurance, country of origin); **Clone Product** (copy categories, features, dimensions, assocs, prices, content, identifications); boxes for **Identification** (UPC/EAN/GTIN/SKU…), **Other Identification** (per store or market segment, URL slug generator), **Features** (apply new or existing, appl type, amount), **Dimensions**, **UOM Dimensions**, **Facility Locations** (inventory products), **Meters** and **Scheduled Maintenance** (equipment); Find Assets link | `component/mr-marble/screen/SimpleScreens/Catalog/Product/EditProduct.xml` (`clone#Product`, `create#ProductFeature`, `apply#ProductFeatures`) |
| Prices tab | New/edit `ProductPrice` rows: type, purpose, vendor, customer, other party product ID, from/thru, store, min quantity, price, currency, term UOM; list with find header — no agreement, lead time, preferred-supplier or tax-in-price fields | `component/mr-marble/screen/SimpleScreens/Catalog/Product/EditPrices.xml` |
| Associated tab | Assocs to and from the product (type, to-product, dates, quantity, sequence); **Create All Variants** from feature groups (variant type, copy category members); list of selectable features | `component/mr-marble/screen/SimpleScreens/Catalog/Product/EditAssocs.xml` (`create#VariantProducts`) |
| Categories tab | Category memberships with from/thru and sequence | `component/mr-marble/screen/SimpleScreens/Catalog/Product/EditCategories.xml` |
| Content tab | Content list (type, locale, feature, store, dates) with upload, location and text forms; content detail and **version compare** | `component/mr-marble/screen/SimpleScreens/Catalog/Product/Content/{ContentList,ContentDetail,ContentCompare}.xml` |
| Categories | Find/create category; edit category with child categories (rollup), parent categories, identifications (URL slug), feature groups; products in category; category content | `component/mr-marble/screen/SimpleScreens/Catalog/Category/{FindCategory,EditCategory,EditProducts}.xml`, `Catalog/Category/Content/` |
| Features & feature groups | Find/edit features (type, abbreviation, description, default amount and sequence, owner), their groups and products; feature groups with categories and features | `component/mr-marble/screen/SimpleScreens/Catalog/{Feature,FeatureGroup}/` |
| Search Products | Full-text search over the product data document, with bulk **add/remove category** and **add/remove feature** on the selection | `component/mr-marble/screen/SimpleScreens/Catalog/Search.xml` (`add#ProductsToCategory`, `add#FeatureToProducts`) |
| Facility products | Per-facility product settings (minimum stock, reorder quantity, days to ship); Warehouse uses the same screen | `component/mr-marble/screen/SimpleScreens/Facility/EditFacilityProducts.xml` |
| Update product cost | Re-cost all assets of a product (optionally per facility and receive-date range) and re-post GL | `component/mr-marble/screen/SimpleScreens/Asset/Asset/FindAsset.xml` (`UpdateProductCost`, `update#ProductAcquireCost`) |
| Store categories | Store-to-category links by type (Commerce) | `component/mr-marble/screen/SimpleScreens/ProductStore/FindProductStoreCategory.xml` |

Not present: supplier price list per supplier (Supplier screens `Supplier/{FindSupplier,EditSupplier}.xml` have no product or price section), price lists or price rules (`ProductPriceModify` has no screen), costs and configurable products (their entities are commented out, see below), product parties, product geos, reviews, subscriptions resources.

### Data model available (mr-mantle)

| Entity / enum | What it gives Products | Key files |
| --- | --- | --- |
| `Product` | `pseudoId`, `productTypeEnumId`, `productClassEnumId`, asset type/class, `statusId` (no product status items defined), `ownerPartyId` (brand/IP owner), name, description, comments, sales intro/discontinuation, `salesDiscWhenNotAvail`, support discontinuation, `requireInventory`, `chargeShipping`, signature, insurance, box type, `taxable`, `taxCode`, `returnable`, amount UOM/fixed/require, `originGeoId`, `billOfMaterialLevel` | `component/mr-mantle/entity/ProductDefinitionEntities.xml` |
| `ProductType` enum | Asset (Good), Digital and Asset, Digital, Asset Use, Facility Use, Service, **Virtual (with variants)**, Pick Assembly, **Configurable Good** (`Pt*`) | same |
| `ProductAssoc` + `ProductAssocType` | Typed product-to-product links with dates, quantity, scrap factor, instruction, routing: Up-Sell, Down-Sell, Replacement, Equivalent, Accessory, Add On, Cross-Sell, Also Bought, Alternative Packaging, Refurbished, **Variant**, Requires, Incompatible, Revision, **Manufacturing/Engineering BOM**, Manufactured As, Configurable Instance, Component, **Packaging For** (`Pat*`) | same |
| `ProductFeature`, `ProductFeatureAppl`, `ProductFeatureGroup`, `ProductFeatureGroupAppl`, `ProductCategoryFeatGrpAppl`, `ProductFeatureIactn` | Typed features (Color, Size, Brand, Style, Material…, `Pft*`) applied as Standard, Selectable, Distinguishing or Optional with amount; groups per category; feature dependency/compatibility rules | same |
| `ProductCategory`, `ProductCategoryMember`, `ProductCategoryRollup`, `ProductCategoryContent`, `ProductCategoryIdent`, `ProductCategoryParty` | Typed categories (Catalog, Industry, Internal, Materials, Search, Usage, Cross Sell, Tax, Best Selling, Inventory Group…), dated membership, multiple parents, localized content and SEO, URL slugs, party links | same |
| `ProductPrice` | One table for list, current, average cost, min/max, promotional, wholesale prices (`PptList`…`PptMinimumOrder`) and purposes (purchase, recurring, usage, component), scoped by `productStoreId`, `customerPartyId`, `agreementId`/`agreementItemSeqId`, **`vendorPartyId`** with `standardLeadTimeDays`, `otherPartyItemId`/`Name`, `preferredOrderEnumId` (`SpoMain`, `SpoAlternate`), `supplierRatingTypeEnumId`, `canDropShip`; min quantity, quantity increment/included, `taxInPrice`, tax amount/percentage, dates; `price` is audit-logged. **No separate supplier-product entity.** | same |
| `ProductPriceModify`, `ProductPriceModifyParameter` | Registry of price-modifier services (implementing `mantle.product.PriceServices.modify#ProductPrice`) run in sequence after the base price | same |
| `ProductIdentification`, `ProductOtherIdentification` | Typed codes: ISBN, Mfg Model Number, SKU, UPC-A, UPC-E, EAN, GTIN, LoC, URL Slug, HTS; other IDs per store or market segment | same |
| `ProductContent` | Typed content (names, descriptions, specs, warranty, instructions, image sizes, meta keywords/description…) with `locale`, `productFeatureId`, `productStoreId`, dates | same |
| `ProductDimension`, `ProductDimensionType`, `ProductUomDimension`, `ProductGeo` | Physical dimensions with units; UOM dimensions per market segment; purchase/shipment geo include/exclude | same |
| `ProductParty` | Product-to-party links by role with dates and the party's item ID/name | same |
| `ProductConfigItem`, `ProductConfigItemAppl`, `ProductConfigOption`, `ProductConfigOptionProduct`, `ProductConfigOptionIactn`, `ProductConfigSaved*` | **Commented out** (inside the "For future reference when configurable product support is implemented" comment): questions, options, option products, option rules, saved configurations — not usable without enabling; only the `PtConfigurable` product type and `PatConfigInstance` assoc type are live | same |
| `CostComponent`, `CostComponentCalc`, `ProductCostComponentCalc`, `ProductAverageCost` | **Commented out** (inside the "For reference in future support…" comment, with their `CostComponentType` enums): cost components by type (material, labor, route, overhead; estimated standard vs actual), cost formulas, average cost per organization and facility — not usable without enabling; the live cost fields are `Asset.acquireCost` and `ProductPrice` type `PptAverage` | same |
| `ProductGlAppl`, `ProductCalculatedInfo`, `ProductReview`, `ProductParameter*`, `ProductSubscriptionResource` | GL overrides; ordered/viewed/rating counters; reviews (Pending/Approved/Deleted); order-time personalization parameters; subscription resources | same |
| `ProductFacility`, `ProductFacilityLocation` | Per-facility minimum stock, reorder quantity, days to ship; preferred locations | `component/mr-mantle/entity/FacilityEntities.xml` |
| `ProductStoreCategory`, `ProductStoreProduct`, `ProductStorePromotion`, `ProductStorePromoCode` | Store records (Commerce) and promotions (Marketing) | `component/mr-mantle/entity/ProductStoreEntities.xml` |
| `moqui.basic.Uom`, `UomConversion`, `UomDimensionType` | Typed units with dated conversions (factor, offset) | `components/base/framework/entity/BasicEntities.xml` |

### Services (mr-mantle)

| Service | Purpose | Key files |
| --- | --- | --- |
| `get#ProductPrice`, `get#ProductPriceByType`, `get#OrderProductPrice`, `modify#ProductPrice` | The price resolver: current price (falling back to the virtual product), list price, then registered `ProductPriceModify` services; matches store, vendor and customer rows or null rows; **agreement prices are a TODO** and the result does not say why a price was chosen | `component/mr-mantle/service/mantle/product/PriceServices.xml` |
| `clone#Product`, `delete#Product`, `find#ProductByIdValue` | Copy with selected parts; delete; lookup by any identification | `component/mr-mantle/service/mantle/product/ProductServices.xml` |
| `create#VariantProducts`, `create#VariantProduct`, `find#VariantProduct`, `get#VariantProductsInfo`, `delete#VariantProducts` | Variant generation from selectable feature groups and lookup by features | same |
| `create#ProductFeature`, `apply#ProductFeatures`, `find#ProductFeatures`, `find#ProductFeatureGroups`, `find#ProductCategoryFeatures`, `get#FeatureByIactnOrAll`, `add/remove#FeatureToProducts` | Features and bulk feature edits | same |
| `add#ProductsToCategory`, `remove#ProductsFromCategory`, `create/update#ProductContent`, `save#ProductContentFile`, `create/update#ProductCategoryContent`, `get#ProductManualDocumentData` | Category bulk edits, content and files, product manual document | same |
| `generate#UrlSlugFromProductName`, `generate#UrlSlugFromCategoryName` | URL slugs (Commerce) | `component/mr-mantle/service/mantle/product/StoreServices.xml` |
| `update#ProductAcquireCost`, `get#PriceHistoryInfo` | Re-cost assets of a product and re-post; order price statistics per product (min, max, weighted average) | `component/mr-mantle/service/mantle/product/{AssetServices,InventoryReportServices}.xml` |
| `get#ProductBomDetail` | BOM detail for the Product 360 BOM tab | `component/mr-mantle/service/mantle/work/ManufacturingServices.xml` |
| `apply#Promotion`, `apply#OrderPromotions` | Promotion evaluation on orders (Marketing programs) | `component/mr-mantle/service/mantle/product/PromotionServices.xml` |

---

## 14. Gaps & BOSS implications

### Gaps in the reference set

- **No standalone product dashboard anywhere.** The home is a workspace (ERPNext Stock), a nav registry (Carbon) or the product list (Odoo, AureusERP, Dolibarr, Akaunting, Ever Gauzy). AureusERP's products plugin has no Pages or Widgets at all; Akaunting's widgets (`app/Widgets/`) include none for products.
- **No reference explains a resolved price.** Odoo, AureusERP and ERPNext compute prices from rules; only ERPNext records which rules applied on each document line (`Pricing Rule Detail`). None shows a "why this price" breakdown on the product screen.
- **Standard costing is thin.** Carbon hides the Standard method ("not implemented yet"); Odoo community keeps costing in `stock_account`; ERPNext has Item Standard Cost records but valuation lives in stock. Cost history as a chart exists only in Carbon.
- **Akaunting is the flattest catalog**: one sale and one purchase price, product/service type, category, taxes; no UOM, barcode, variants, supplier refs or price lists. Its only reusable product piece is the generic import page with sample file and per-row errors (`resources/views/common/import/create.blade.php`).
- **Ever Gauzy and Carbon have no category tree** for products in the item pages (Ever Gauzy has categories in core and channel collections in the catalog plugin; Carbon only Item Groups = posting groups).
- **ERPNext's e-commerce side is minimal in this checkout**: no `website_item` doctype; only `erpnext/www/all-products/` and `erpnext/setup/doctype/website_item_group/` — consistent with Products and Commerce being separate BOSS apps.
- **Odoo Enterprise-only pieces** do not affect this file: the product, pricelist, supplierinfo, document, combo, UOM and barcode-nomenclature screens are all in the community checkout (crosscut §7).

### Notable gaps in the Moqui baseline

- **No product home or KPIs**: the Catalog dashboard is five links.
- **No price-list or price-rule UI.** Prices are flat `ProductPrice` rows edited per product; there is no price list header, no category- or customer-group-scoped rule, no formula (base + discount/markup/rounding), and `ProductPriceModify` services are configured only in data.
- **The resolver does not explain itself and ignores agreements.** `get#ProductPrice` returns price, list price and the chosen row; `agreementId` matching is a TODO; there is no simulator ("price for customer X, qty Y, store Z on date D").
- **No supplier-price list.** Supplier prices are `ProductPrice` rows with `vendorPartyId`, but the Prices tab hides lead time, main/alternate supplier and rating, and Supplier screens show no products.
- **No cost screens.** Cost lives on `Asset.acquireCost`; the cost entities (`CostComponent`, `ProductAverageCost`) are commented out in Mantle; there is no standard cost, cost roll-up or cost history.
- **Variant generation has no preview.** "Create All Variants" builds every combination of the chosen feature groups; there is no matrix to untick combinations and no copy-fields-to-variant setting.
- **No product lifecycle status.** `Product.statusId` exists but no status items are defined; only sales intro/discontinue dates.
- **No tags, translations UI or document library view**: content rows carry `locale` but there is no side-by-side translation screen and no file-card view of product documents.
- **No per-app Product 360 tabs**: stock, BOM/where-used, orders, purchases and cost appear only as links (Find Assets) or not at all.
- **Configurable products, product parties, geos and reviews** have entities but no screens.

### What each reference contributes

| Reference | Take |
| --- | --- |
| Odoo | Product form tabs with embedded price rows; `create_variant` instantly / when ordered / never; product documents kanban per template or variant; product properties defined per category; pricelist rules on a base with discount/surcharge/rounding and country groups; packaging as a product unit with its own barcode; label layout wizard; stat buttons patched in by each app |
| ERPNext | Stock workspace as catalog home with number cards; curated one-click list filters (`list_filter/*.json`); Item form sections driven by flags; per-company Item Defaults; variant matrix dialog + Item Variant Settings; Item Group tree with defaults and taxes; Item Price + **Pricing Rule** with applied-rule detail per line; Item Standard Cost; item connections with counts and a stock heatmap |
| Carbon | Item types on one table with extensions; part tabs (Details, Purchasing, Accounting, Planning, Inventory, Sales, Quality); configurable parts with typed parameters; supplier parts with price breaks and preferred supplier; customer part numbers; cost-history chart; change notices with diff and release; Used In and BoM explorer; saved views on every list |
| AureusERP | `ProductSchemaRegistry` slots for other plugins' form blocks; one product resource re-exposed by each app with Vendors/Quantities/Moves/BOM pages; four product feature switches; Odoo-shaped price rules; packaging with barcode |
| Dolibarr | Product tabs as separate pages; multiprice levels with HT/TTC base and min price; price-change log; formula prices; buying prices with a separate write permission; category filter with AND/OR; referring-objects and statistics tabs; kits; barcode masks and print sheets |
| metasfresh | Attribute set instances instead of variant SKUs; partner-specific product codes (`bpartner_product`); GS1 scanned-code resolution; product windows as metadata, the way Moqui screens are XML |
| Ever Gauzy | Per-variant capability flags (sold, purchased, rented, subscribed, stocked); stock/sales/purchase units per variant with a same-category rule; per-channel publication rather than a product flag |
| Akaunting | Generic import with sample file, how-to and per-row validation errors (no column mapping); one uploads pipeline for every module |
| Moqui baseline | The data model for nearly everything above (`ProductPrice` with store/customer/agreement/vendor scope, features and variants, typed categories with rollups, identifications, content with locale and store; configuration and cost entities exist only as commented-out definitions) and working Catalog screens to reshape rather than replace |

### Candidate screen inventory (IronStone Products)

The screens the research points to for a catalog manager. Reused screens are those crosscut §3–§4 lists for other apps too; the Products version is described here.

| Area | Screens |
| --- | --- |
| Home | Products landing page: shortcut tiles (Products, Categories, Features, Price lists, Suppliers, Import), KPI cards as **Dashboard widgets (reused: Insights, every app's landing page)** (active products, products without a list price, variants, discontinuing soon), recently changed products |
| Products & variants | Product list (saved views, facets for type/class/category/feature/owner/has price/discontinued, curated one-click filters, bulk category/feature/price actions, CSV import with mapping review and error report, export); **Product 360 (reused: Commerce, Purchasing, Manufacturing, Warehouse, Accounting, Sales)** with tabs Summary, Variants & features, Categories, Identifications & barcodes, Dimensions & units, Content & documents, Prices, Costs, Associations, History, Suppliers (the same rows as **Supplier 360, reused: Purchasing, Accounting, Warehouse**), Stock (**Inventory availability, reused: Warehouse, Customer Service, Purchasing, Sales, Manufacturing, Commerce**), BOM & where-used, Merchandising/SEO and Cost history (the tabs the Manufacturing, Commerce and Accounting versions emphasize, shown here when those apps are enabled); variant matrix builder (preview, untick, generate); configurable product setup (questions, options, rules; needs enabled or new records) |
| Categories | Category tree (drag to reparent, multiple parents), category detail (content and translations, feature groups, products in branch with deep link, URL slug); tags as a category type |
| Features & attributes | Feature list by type, feature groups, feature interactions (requires/incompatible) |
| Pricing & costs | **Prices & price rules (reused: Sales, Commerce, Purchasing)**: price lists (header + scoped rules by product/category/feature/customer group/store, min qty, dates, base + adjustment), price list rows per product in Product 360, **price explain/simulator** over `get#ProductPrice`, price-change history (from the audit log); standard cost per product, cost roll-up from BOM (with Manufacturing; needs enabled or new cost records) |
| Product suppliers | Cross-supplier price list (all `ProductPrice` rows with `vendorPartyId`: supplier, part number, price, min qty, lead time, main/alternate) with bulk update and import — the same rows as the Product 360 Suppliers tab and **Supplier 360 (reused: Purchasing, Accounting, Warehouse)** |
| Product documents | Document library across products (file cards with preview, filter by type/locale/variant), upload into `ProductContent` |
| Units & barcodes | Units and conversions (framework `Uom`/`UomConversion`), identification types, label printing |
| Settings | Products settings section (variants on/off, price lists on/off, packaging, default currency and price type, ID generation, required fields); linked from the Admin settings index |

### Data-model findings

- **Fit as they are:** `Product`, `ProductAssoc`, `ProductFeature*`, `ProductCategory*`, `ProductContent`, `ProductIdentification`, `ProductOtherIdentification`, `ProductDimension`, `ProductUomDimension`, `ProductParty` and framework `Uom`/`UomConversion`.
- **Prices fit `ProductPrice`.** Supplier prices are `ProductPrice` rows with `vendorPartyId` (no new supplier-product entity looks necessary); customer, store and agreement prices are rows with `customerPartyId`, `productStoreId`, `agreementId`. Customer agreements themselves are `Agreement`, `AgreementItem` records.
- **Price list and price rule records look new.** A price list header (name, currency, purpose, active, priority) and rules (scope by product, category, feature, customer, party classification or store; min qty; dates; base price type or another list; discount/markup/rounding; result as fixed price). One option implements them as a `ProductPriceModify` service so `get#ProductPrice` stays the one price service; another has rules generate plain `ProductPrice` rows (Open questions).
- **Resolver output lacks an explanation**: no list of rows considered, row chosen, or modifiers and promotions applied with their effect; and the `agreementId` matching is a TODO.
- **Product lifecycle status**: `Product.statusId` has no status items; the options are defining some (for example Draft, Active, Discontinued, Obsolete) or keeping dates only.
- **Tags** fit a `ProductCategory` type (new `productCategoryTypeEnumId` value) rather than a new entity.
- **Standard and average cost**: Mantle's `CostComponent`/`CostComponentCalc`/`ProductCostComponentCalc`/`ProductAverageCost` are commented out. The options are enabling those definitions (estimated-standard cost types per product and date range, average cost per organization and facility) or adding new cost records; either way a roll-up service from the BOM is new (Open questions).
- **Configurable products**: the `ProductConfig*` entities are commented out; enabling them or designing new records are the options (Open questions).
- **Packaging**: pack products linked by `ProductAssoc` `PatPackagingFor`, with their own `ProductIdentification` barcode, need no new entity if this shape fits.
- **Variant copy settings**: a small settings record (fields copied from virtual to variants) or a product-store/organization preference are candidates.

### Sequencing notes

- **Cheap on the baseline:** product list facets and bulk category/feature actions (Find Product already has saved finds, columns and CSV export; Search Products already has bulk add/remove); the Products tabs of the Product 360 (Edit Product, Prices, Associated, Categories and Content screens already exist to reshape); the variant matrix builder (over `create#VariantProducts`, which needs only a preview step); category tree, features and feature groups (screens exist); the cross-supplier price list (rows exist; the screen and the hidden fields are missing); a price-change history screen (the audit log already holds the data).
- **Depends on the reused screens:** the Product 360 Stock tab on Inventory availability; the Suppliers tab and cross-supplier list on the same `ProductPrice` rows as Supplier 360; the BOM tab on the BOM and routing editor (research-manufacturing.md); the Merchandising tab on the store records (research-commerce.md).
- **Depends on new records or services:** price lists and rules and the explain/simulator depend on the resolver extension and the price rule records; agreement prices depend on the `agreementId` TODO in `get#ProductPrice`; standard cost and roll-up depend on enabled or new cost records; configurable products on enabled or new `ProductConfig*` records; lifecycle statuses on status items for `Product.statusId`; packaging on the packaging-shape question.
- **Screens over existing records with no baseline UI:** document library view (`ProductContent`), translation workspace (`locale` on content rows), label printing (`ProductIdentification`).

### Open questions

- **Price rules as records or as generated rows?** A rule engine behind `ProductPriceModify` keeps `ProductPrice` small but needs the explain output; generating `ProductPrice` rows from rules keeps the resolver unchanged but multiplies rows. Which?
- **Customer-specific price lists** (crosscut §8): are they agreements (`AgreementItem` + `ProductPrice.agreementId`) or price rules scoped by customer or customer group? Either way the price screens in Products, Sales and Commerce show the same rows.
- **Enable commented-out Mantle definitions or add new records?** Standard/average cost (`CostComponent`, `CostComponentCalc`, `ProductCostComponentCalc`, `ProductAverageCost`) and configurable products (`ProductConfig*`) exist only inside XML comments in `ProductDefinitionEntities.xml`. Enabling them reuses a reviewed design but commits to its shape; new records can fit the BOSS cost roll-up and Carbon-style typed parameters better.
- **Variant model for apparel-scale catalogs**: keep full variant products (`PtVirtual` + `PatVariant`) for everything, or add an Odoo-style "create when ordered" mode using configurable products for large matrices?
- **Packaging shape**: pack products via `ProductAssoc` vs a quantity-and-barcode row per product (`ProductUomDimension` or a new record)?
- **Lifecycle**: does BOSS need a product status workflow, or are sales intro/discontinue dates enough?
- **Per-facility product settings** (`ProductFacility`: minimum stock, reorder quantity): edited today in the baseline Facility products screen (§13) and shown on the Product 360 Stock tab; are they edited in every app version that shows them, or in one (crosscut §8, where reused configuration is kept)?

### Checkout path quirks

- Odoo product addon paths are `3p_other/odoo/odoo/addons/product/…`; supplierinfo, documents, combos, pricelists and label printing are all in `product`, not `purchase` or `stock`; there is no `uom.category` model in this version (units form a tree through `relative_uom_id`), and packaging is `product.uom` in `product/models/product_uom.py`.
- ERPNext: Price List and Item Price are `erpnext/stock/doctype/{price_list,item_price}/`, but Pricing Rule and Promotional Scheme are `erpnext/accounts/doctype/`; `item_group`, `brand`, `uom`, `uom_conversion_factor` are in `erpnext/setup/`, `uom_category` in `erpnext/stock/`; variant creation is `erpnext/controllers/item_variant.py`; stock charts and number cards are directories (`dashboard_chart/<name>/<name>.json`).
- Carbon has no manufacturing module folder; production is `apps/erp/app/modules/production/`; part tab routes are `apps/erp/app/routes/x+/part+/$itemId.<tab>.tsx`.
- AureusERP vendor prices are rendered by `plugins/webkul/purchases/`, not `products/`; the products plugin has five resources and no Pages or Widgets.
- metasfresh `backend/` has 115 modules and none named `product*` or `pricing*`; the engines are inside `de.metas.business` (`de/metas/{product,pricing,uom,gs1,bpartner_product}`), and scanned-code resolution is in `de.metas.adempiere.adempiere/base`.
- Ever Gauzy has no inventory folder under `packages/ui-core/shared/src/lib/`; inventory pages are app-side (`apps/gauzy/src/app/pages/inventory/`), shared product pickers are in `packages/ui-core/shared/src/lib/product/`, domain in `packages/core/src/lib/product*/`, channel publication in `packages/plugins/catalog/`.
- Dolibarr product tabs are separate PHP files (`htdocs/product/{card,price,price_suppliers,traduction,document,note,contact,agenda}.php`, `stock/product.php`, `stats/`), variants live in `htdocs/variants/`, barcode print sheets in `htdocs/core/modules/printsheet/`.
- Akaunting has no documents folder under the common views; document forms are `resources/views/components/documents/{form,show}/`.

**Bottom line.** The Moqui data model already covers most catalog features the references show, including supplier prices on `ProductPrice` (cost and configurable-product entities exist only as commented-out definitions); what the research finds missing is screens — a real product home, a Product 360 reused across apps with per-app tabs, a variant matrix with preview, price lists and rules behind the one price service with an explanation of each price, and cost screens.
