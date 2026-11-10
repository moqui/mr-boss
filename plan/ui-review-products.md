# IronStone BOSS — UI review: Products

Contents: [scope and sources](#1-purpose-scope-and-sources) · [method](#2-review-method-and-refinement-criteria) ·
[screen inventory](#3-screen-and-surface-inventory) · [activities](#4-end-to-end-activities) ·
[verification](#5-existing-checks-and-future-verification) · [running record](#6-coverage-findings-and-running-record) ·
[decisions](#7-decisions).

## 1. Purpose, scope and sources

Review and refine Products as its users work: catalog editors, price and supplier-price editors, method engineers,
cost estimators and readers. Cover each job, from creating a product and generating variants to explaining prices,
maintaining methods and estimates, managing documents and identifiers, importing changes and resolving catalog
problems. Aim for a comfortable daily catalog workspace with clear next actions and trustworthy identities, effective
dates, quantities and money. Substantial layout and navigation refinements may be proposed where they improve an
implemented workflow.

This follows [Projects](ui-review-projects.md) and the [document convention](design-doc-guide.md#ui-review-and-refinement-phase).
Keep the current inventory, activities, coverage, findings, decisions and bounded execution notes here. Research
records references, design specifies behavior, implementation records construction, and this file records review
and refinement.

**Status: execution authorized, 2026-11-09; review in progress.** Activity coverage starts **pending** and advances
only with the evidence recorded in §6. Execution scope, workers, commit cadence, authorized acceptance specs and
gate timing are recorded in §7. Historical Products implementation results and existing tests are inputs, not
evidence of this review's outcomes.

### Inputs and reference patterns

- [Products design](design-products.md), [implementation](impl-products.md) and [research](research-products.md):
  intended workflows, delivered functionality, prior findings and deferrals.
- [Projects review](ui-review-projects.md), [drawers, Commons and Comms review](ui-review-drawers-commons.md),
  [framework UI review guide](../../../../docs/dev/UI-Review.md) and
  [framework review](../../../../plans/UI-Refinement.md): activity/evidence method and established refinements.
- [Application practices](../../../../docs/dev/Practices-App-Dev.md), [style guide](style-guide.md),
  [crosscut design](design-crosscut.md), [Products implementation notes](../docs/ProductsImplementation.md) and
  [shared catalog screens](../docs/ProductsSharedScreens.md). The last two contain historical statements that must be
  reconciled with current sources, especially the now-built neighboring app contexts.
- Current `screen/Products.xml`, `screen/Products/`, their mounted `screen/Shared/` sources,
  `service/ironstone/products/`, `template/CatalogChoiceTransitions.xml`, `MoquiConf.xml`,
  `data/BossSetupData.xml`, `data/BossUsersDemoData.xml` and `data/BossProductsDemoData.xml`.
- Current Products regression/acceptance specs and client suite registrations; the owning Mantle catalog, price,
  method, cost, inventory, document and import services and specs. Current mounts and service capabilities take
  precedence over historical route, grant and “Later” tables.

Use the existing research as a comparison lens: Odoo and ERPNext for catalog/variant/pricing continuity, Carbon for
method and item context, and the Moqui baseline for record and service contracts. These are patterns already
documented in the research, not a fresh claim about current third-party products or a reason to import their feature
inventories.

### Ownership and boundaries

| Surface | Owner and review boundary |
| --- | --- |
| Products navigation, landing, finds, dialogs, matrix, settings and shell providers | BOSS `screen/Products/` and `service/ironstone/products/`; inspect global lists and product-fixed mounts |
| Catalog masters, taxonomy, variants, prices, supplier offers, standard estimates and durable imports | Mantle business services and entities; rule corrections and their tests belong in Mantle and must work without BOSS |
| Product360, CategoryDetail, Supplier360, pricing, documents, units and tools | Shared BOSS screens with server-derived app context; exercise Products' mounts, not copied screens |
| Stock and facility policy | Shared InventoryAvailability and Mantle/Warehouse policy; inspect permitted facilities, totals, tracking and the existing Warehouse handoff |
| BOM, routing, explosion, comparison and where-used | Shared method screens, Mantle method rules and Manufacturing permissions; review catalog engineering and costing context, not production execution |
| Revaluation | Shared InventoryValuation and Accounting/Mantle services; approval of a standard estimate alone changes neither stock value nor GL; any later posting uses disposable fixtures and a finance-authorized identity |
| Chatter, files, record links and catalog tasks | Existing Commons/Shared widgets and services; review Products identity, audience and return path, not another Commons pass |
| Paid access | Products shows digital-product terms read-only; Commerce owns edits and downstream subscriptions/entitlements |
| Lists, trees, dialogs, wizard controls, charts, barcode/PDF output and terminal rendering | Framework renderers, webroot/client and output services; put shared corrections there and retest with Products content |
| Insights reports/attention, Admin health/settings entries and neighboring app records | Existing entry/return contracts under the owning app's authority; bounded handoff inspection only |
| Category store context, Product360 Accounting summary | Commerce (`get#CategoryStores` on CategoryDetail) and Accounting (`get#ProductAccounting`, `storeProductGl`); Products checks only that they are absent or refused |

Retest a shared correction through a representative second consumer chosen for the affected behavior. Product360
has Warehouse, Manufacturing, Purchasing, Customer Service, Commerce and a separate Accounting presentation;
CategoryDetail/content has Commerce consumers; Supplier360 has operational consumers. Accounting's Product360 uses
its own template/context, rather than the catalog tab set. Chatter and RecordFiles have many other consumers.

Preserve routes, record keys, saved finds/columns, user preferences, dates, entity/service contracts and authorization.
Record any unavoidable compatibility change before implementing it. Keep restricted prices, supplier offers, costs,
margins and transaction identities out of server answers, pickers, search and exported bytes, not merely out of the
visible screen. App context determines presentation and links; it must not grant authority.

Do not implement absent features to complete a review. Configurations, change notices, product merge, ProductGeo,
general matrix widgets and the other deferred design items remain separate work. Complete Warehouse, Manufacturing,
Purchasing, Sales, Accounting, Commerce, PASS, Insights, Admin and desktop reviews are outside scope. No real customer
catalog, production stock, external publication, financial posting or printer delivery is a review fixture.

## 2. Review method and refinement criteria

### Environment and fixtures

For later execution, follow the [review guide](../../../../docs/dev/UI-Review.md), repository building/testing skills
and application practices. Use an isolated runtime and fresh disposable database with individually linked Mantle
and BOSS components. The guide's framework-only bootstrap leaves `component/` empty and is insufficient on its own.
Copy mutable configuration; keep database, uploaded content, generated PDFs/labels and import resources separate
from working data. A different port alone does not isolate the database, and cookies are not isolated by port: give
each browser identity its own hostname. A component symlink is not isolation; new files written through it land in
the working component.

Projects' execution found environment prerequisites to check up front (ui-review-projects.md §6): delegated child
agents may have no browser tools; embedded Postgres may need unsandboxed shared memory; an isolated runtime may need
webroot assets materialized before xterm works; upload/download approval waits are tool timing, not product timing;
and automated approval review may block a financial post or printer send. Record which apply.

One coordinator owns runtime lifecycle. Record source and binary revisions, loaded components, actual database and
runtime paths, hostname, free listener ports, fixture setup and evidence directory in the first execution batch.
Use independent browser identities. If retaining a runner-created runtime across restarts, follow the guide's
whole-runtime relocation procedure. Restore changed preferences/settings and stop review listeners at the end.

Reuse a suitable binary for XML/QVue/script work; rebuild for Rust or embedded renderer changes. Confirm actual
loaded browser assets before diagnosing stale behavior. Verify Chromium/PDF availability before outputs; do not
inherit either the old PDF failure or the later successful run as today's result. Use local captured notifications
and a safe print destination if printer delivery is included. No physical print or remote delivery is implied by a
successful job record. Missing capabilities leave the affected variant blocked or unverified.

Existing demo accounts provide useful permission pairs. Check their actual grants and organization membership in the
loaded fixture before using them; a broadly privileged account cannot establish least-privilege behavior.

| Fixture role | Existing starting point and purpose |
| --- | --- |
| Catalog reader (also the Products-only user) | `catalog.reader`: permitted catalog reads with no other app launcher; the "catalog-only reader" of PRD-07 and the Products-only user of PRD-24 |
| Catalog editor | `catalog.edit`: master-data changes; price/supplier/cost values remain independently restricted |
| Sales-price reader and editor | `catalog.price.read` (the "sales-only reader" of PRD-11), `catalog.price.edit`: dated prices, lists, explanation and outputs |
| Supplier-price reader and editor | `catalog.supplier.price.read`, `catalog.supplier.price.edit`: purchase-direction offers, separate from sales prices |
| Cost reader, estimator and approver | `catalog.cost.read`, `catalog.cost.estimate`, `catalog.cost.approve`: standard estimates and approval separation; compose price read only for an explicit margin sample |
| Catalog administrator | `catalog.admin` (`BOSS_PRODUCTS_ADMIN`): catalog/variant/pricing/identifier defaults, but also price edit, supplier-price edit, cost estimate and approve, and always-access to the Prices, Suppliers and Costs screens (`BossSetupData.xml:809-816`). Not a narrow role and not a substitute for system-wide unit authority |
| Stock planner | `catalog.stock.plan` (`BOSS_WAREHOUSE_STOCK_PLANNER`): planning policy and product-specific tracking exceptions. No catalog-scoped stock manager is seeded (`BOSS_WH_MANAGER` is Retail); prepare one only if broader organization/facility defaults are exercised |
| Method reader/editor/approver | `catalog.method.read`, `catalog.method`, `catalog.method.approve`: distinct Manufacturing permissions on Products' method surfaces |
| Method resource administrator | `catalog.method.resource`: resource administration plus cost estimate and approve, so it is not a cost-free narrow counterpart |
| Combined method walkthrough | `catalog.method.walk`: useful initial engineering/costing fixture, but combines edit, approval, resource and cost grants; pair with the narrow roles above |
| Inventory accountant | `catalog.cost.gl` (`BOSS_ACCOUNTING_GL`): existing revaluation handoff, with explicit organization/facility/settings/period prerequisites. Use this name throughout |
| System administrator | Separate `ADMIN` fixture for global noncurrency units/shared-master writes and setup; do ordinary catalog work with its own roles. `john.doe` is ADMIN and is used by several existing specs, so their samples are not least-privilege evidence |
| Outsider and neighboring-app pairs | `warehouse.read` (the existing outsider in ProductsAccess), other organization, revoked/absent grants and a representative adjacent-app reader; prepare only missing fixtures. A "non-holder" always names the grant it lacks |

The five method users belong to `ORG_ZIZI_RETAIL`; the other twelve `catalog.*` users belong to `ORG_ZIZI_SERVICES`.
Use a matching product/facility instead of misclassifying owner refusal as a missing method permission. The cost
estimator, approver and inventory accountant are Services users, so a manufactured roll-up from a Retail released
method needs a prepared Retail estimator/approver pair (or the composed `catalog.method.walk` with that limit
recorded); a Services purchased item such as `BOSS_PRD_PACK` (ProductsCostWalk's choice) serves the narrow-role
approval path. Catalog-only users also need the root grant for a neighboring app before its linked transaction
details are available.

Products demo records (`data/BossProductsDemoData.xml`):

- Owner boundary: `BOSS_PRD_OWN` (Services, active) and `BOSS_PRD_OTHER` (Retail; no status or currency).
- Lifecycle: `BOSS_PRD_DRAFT`, `BOSS_PRD_OBSOLETE`.
- Variants: virtual draft `BOSS_PRD_VIRT` with selectable `BOSS_VAR_BLUE`, `_RED`, `_SMALL`, `_LARGE`.
- Taxonomy and features: `BOSS_PRD_CAT`, `BOSS_PRD_PARENT_A`, `BOSS_PRD_PARENT_B`, `BOSS_PRD_TAG`, `BOSS_PRD_FEATURE`,
  `BOSS_PRD_GROUP`.
- Prices and suppliers: `BOSS_PRICE_SALES`, `BOSS_PRICE_NEXT`, `BOSS_PRICE_LIST`, `BOSS_PRICE_RULE`,
  `BOSS_PRD_SUPPLIER`; sales prices use `pricePurposeEnumId="PppPurchase"`, which is how the model marks sales direction.
- Packaging, checks, stock and cost: `BOSS_PRD_PACK` (`PatPackagingFor` × 12), `BOSS_CHK_EMPTY`, `BOSS_CHK_DUP_A/_B`,
  facility `BOSS_PRD_WH` with `BOSS_PRD_STOCK`, `_HELD` and `_FOREIGN_STOCK`, draft standard `BOSS_COST_SAMPLE` and
  `BOSS_COST_STOCK`; content `BOSS_CONTENT_SAMPLE`.

Type-specific tabs use base demo data, not the Products file: kit `DEMO_PA` (Retail-owned, ZcaProductDemoData) or
`BOSS_WH_KIT`; equipment `EQUIP_1`; digital `DEMO_TNT` or `BOSS_COM_PAID_MONTH` (Services). Shared `_NA_` masters are
implicit through the `Product.ownerPartyId` default (for example `DEMO_SA_1`, `DEMO_TNT`, `EQUIP_*`); `DEMO_PA` is not
shared. Prefer disposable copies for mutation. `ProductsMethodFixtures` and `ProductsCostFixtures` are regression
fixture specs; the inventory, price, tools and import fixture specs listed in §5 live in acceptance. Select and record
a bootstrap explicitly; this plan does not authorize running those acceptance fixtures incidentally.

Dates matter: demo `BOSS_PRICE_SALES` ends at **2026-11-15 00:00**, when `BOSS_PRICE_NEXT` starts, six days after this
plan was written. From that date the demo has no future price, `BOSS_PRICE_ORDER` refers to an expired row, and the
expiring-price notices change. Home "Ending in 30 days" instead counts products approaching their
`salesDiscontinuationDate`; prepare independent discontinuation fixtures for that card. Record the as-of date and zone, and create
disposable rows relative to the execution date: current, future, expired and ending within 30 days. Check an exclusive
`thruDate` boundary from two time zones; Projects' date findings (PR-UI-025, 029, 032) were this class. Also prepare
quantity breaks, two currencies/units, published/draft lists, missing cost bases, approved/draft methods and
standards, and stock inside/outside scope. The cost fixture skips without Chromium and enables revaluation only when
it creates the Services accounting preference; verify settings, accounts and periods rather than assuming setup
succeeded.

Include empty and populated finds, long/localized names, two rows per repeated dialog, missing/deleted records,
invalid inputs, stale revisions and two identities editing the same record. Use synthetic CSVs with mixed valid and
invalid rows, duplicate identifiers, explicit clears and stable retry keys. Keep fixture limitations explicit; a
setup service can prepare data but cannot substitute for the user's interaction.

### Visual and interaction review

- Review Material `/qapps` in default light and dark at **1920×1080**, with selected **1280px**, **390px**,
  keyboard-only and **actual 200% browser zoom** cases. Record measured viewport/image dimensions and actual zoom
  capability. Prior tool limitations do not establish this pass's dimensions or coverage.
- Inspect actual embedded TUI launches and theme switches, tab navigation, dynamic helpers, dialogs and persisted
  actions. An error-free TUI JSON document is supporting evidence, not a keyboard workflow. Give Standard `/apps`
  a brief functional/output/fallback check; visual refinement targets Material.
- Use the archetype's name/key/status header, coherent sections and one primary action. Keep name, owner, state,
  amount, currency and quantity unit visible where needed. Read-only roles should retain a coherent record layout.
- Measure composited contrast: ordinary text **4.5:1**, qualifying large text **3:1**, meaningful controls/states
  **3:1**. Inspect chips, selected matrix cells, validation messages, chart labels and focus in both themes; status,
  price direction and restricted/missing values must not depend on color alone.
- Follow one find through list/board or category tree, saved-find create/update/default/reset, sort, columns,
  pagination, selection, detail and Back. Inspect global and fixed-product mounts separately. Reset must clear its
  filters without losing fixed context, and exports must reflect the selected scope.
- Exercise native typing, blur/change, Enter/Escape, accessible names, tab order and focus return. Test the keyboard
  path for tree moves and matrix selection. Open actions on two different rows and reopen after a reload to prove
  target identity; distinguish a tool input limitation from an application failure.
- Preserve entered values on failed saves and canceled confirmations. Preview/apply workflows must identify the
  selected product/list/run and the snapshot being committed. A late reply must not change a different product,
  preview, page or operation, including in the shared Chatter/RecordFiles QVue; changing the source clears selections
  that no longer apply. Check whether the shared stale-response helper Projects proposed exists before adding another.
- Checkbox and flag settings save the intended value and survive reload (Projects PR-UI-036). Authorized row actions
  on static-rendered lists are enabled (PR-UI-037). Treat an attribute that has no effect, or changes a flow
  unexpectedly, as a finding; screen lint alone does not catch it (PR-UI-002).
- In the terminal, check that a record header refreshes after a lifecycle transition, current-row F10 actions reach
  the right row dialog, multi-select pickers work, and download/print actions delegate truthfully.
- Explain date boundaries, sale versus purchase direction, price versus estimate versus posted valuation, and
  quantity-unit conversions. Restricted values are absent, not zero. Reconcile counts/totals with drill-throughs;
  distinguish no records, no matches, no permission, missing basis and failed loading.
- Inspect real downloaded CSV/XLSX/PDF/content bytes and printed layout, including headers, empty values, Unicode,
  owner scope and date/quantity/currency basis. A toast, filename or HTTP 200 does not prove a correct output.
- Confirm lifecycle, generation, publication, bulk changes, approval and posting with the record/count. Cancel must
  not write. Independent failed import/output items identify the item and allow unrelated work where the contract
  permits; security and atomic record/financial operations stay strict.
- Check app drawer, palette, notifications and Assist with a selected product. Inspect existing provider context
  and return paths without repeating the entire shell/Assist review or assuming an unavailable provider worked;
  Products declares no Assist prompt, so expect only generic page context there.

### Waves

| Wave | Activities | Focus |
| --- | --- | --- |
| 1. Establish the catalog workday | PRD-01–03 | Landing/find, creation/lifecycle and useful product details |
| 2. Organize and generate | PRD-04–06 | Multi-parent taxonomy, features and selected variants |
| 3. Price and source | PRD-07–11 | Sales prices, lists/rules, explanation/history, output and supplier offers |
| 4. Inspect supply and cost | PRD-12–15 | Stock/policy, methods, roll-up, standards and finance handoff |
| 5. Complete catalog content and identity | PRD-16–19 | Documents/files, translations, units/packs/scans and labels |
| 6. Maintain at scale | PRD-20–22 | Durable import, catalog checks and defaults with visible consumers |
| 7. Reconcile scope and modes | PRD-23–24 and remaining variants | Permissions, neighboring mounts, outputs, terminal and shared-fix checks |

Establish positive/negative permission pairs from Wave 1. Cross-wave continuations:

- PRD-03 tabs → pricing PRD-07, suppliers PRD-11, stock PRD-12, methods/costs PRD-13–15, documents PRD-16, packaging PRD-18.
- PRD-04 category content → PRD-16; PRD-05 combinations → PRD-06.
- PRD-08 output → PRD-10; PRD-09 standard-cost basis/margin → after PRD-14/15.
- PRD-10's effective price-list output is sales-direction; supplier-offer CSV/XLSX is checked in PRD-11.
- PRD-13 cost basis → PRD-14; PRD-14's saved draft → PRD-15 approval.
- PRD-18 identifiers → PRD-19 labels; PRD-22 settings → their consumers in PRD-02, 06–09, 15 and 18–21.

Record each open continuation in the originating activity's ledger row; a later pass does not automatically complete
earlier work.

Each later authorized batch follows observe → prioritize → refine → rerun affected activities → compare evidence
→ verify → update this record. Start with PRD-01/02 to establish measured browser/TUI baselines and fixture ownership.
Delegated work can then cover bounded sources or independent activities; one coordinator owns shared files, runtime
lifecycle and integration. Check available identity/tool isolation before assigning live work.

## 3. Screen and surface inventory

Routes are relative to `/qapps/`. **B** means this component's `screen/`. Append a listed local name to its directory
for the route and `.xml` for its source under B. The local inventory contains **44 XML definitions**: `Products.xml`
and 43 below `Products/`, plus **one local QVue file**. Following explicit mounts and physical shared children reaches
**74 distinct Shared XML definitions**, including context-excluded children; source existence is not proof of
reachability or authority. All live route/mode coverage is pending and is recorded with the activities in §6.

### Local routes

| Route prefix / source directory | XML definitions | Activities |
| --- | --- | --- |
| root | `Products` | PRD-01, 23–24 |
| `Products/` | `Home` | PRD-01, 21 |
| `Products/` | `Products`, `Categories`, `Features`, `Prices`, `SupplierPrices`, `Documents`, `Translations`, `Units`, `ProductImport`, `CatalogChecks`, `Settings` | Container/default navigation; respective rows below |
| `Products/Products/` | `List`, `NewProduct` | PRD-01–03, 23 |
| `Products/Products/` | `BulkPrice` | PRD-07 |
| `Products/Products/` | `VariantBuilder`, `VariantBuilderTui` | PRD-06 |
| `Products/Categories/` | `List`, `NewCategory` | PRD-04 |
| `Products/Features/` | `List`, `NewFeature`, `FeatureDetail`, `FeatureGroups`, `FeatureInteractions` | PRD-05–06 |
| `Products/Features/FeatureDetail/` | `Summary`, `Groups`, `Products` | PRD-05 |
| `Products/Features/FeatureGroups/` | `List`, `NewGroup`, `FeatureGroupDetail` | PRD-05 |
| `Products/Features/FeatureGroups/FeatureGroupDetail/` | `Summary`, `Features`, `Categories` | PRD-05–06 |
| `Products/Prices/` | `PriceLists`, `PriceExplain`, `PriceHistory` | PRD-08–10 |
| `Products/Prices/` | `StandardCosts`, `CostRollup`, `CostHistory` | PRD-14–15 |
| `Products/Settings/` | `Index`, `VariantSettings`, `PricingSettings`, `IdentificationTypes` | PRD-22; consumers in PRD-02, 06–09, 15, 18–21 |

### Defaults and shared mounts

| Container | Default child | Activities |
| --- | --- | --- |
| `Products` | Home | PRD-01 |
| `Products/Products`, `Products/Categories`, `Products/Features`, `Products/Features/FeatureGroups` | List | PRD-01, 04–05 |
| `Products/Features/FeatureDetail`, `Products/Features/FeatureGroups/FeatureGroupDetail` | Summary | PRD-05 |
| `Products/Prices`, `Products/Prices/PriceLists`, `Products/SupplierPrices` | List | PRD-07–11 |
| `Products/Documents`, `Products/Translations`, `Products/ProductImport`, `Products/CatalogChecks`, `Products/Units`, `Products/Settings` | Index | PRD-16–22 |
| `Products/Prices/PriceExplain`, `Products/Prices/StandardCosts`, `Products/Prices/CostRollup`, `Products/Prices/CostHistory` | Index | PRD-09, 14–15 |
| `Products/Settings/IdentificationTypes` | Index | PRD-18, 22 |
| Product360, CategoryDetail | Summary | PRD-03–04 |
| Product360/Stock | Summary | PRD-12 |
| Product360/BOM | Overview | PRD-13 |
| Supplier360 | Overview | PRD-11 |
| Product360/Documents, CategoryDetail/Content, CategoryDetail/Content/Index | Index | PRD-16 |

In the following table **P360** is `Products/Products/Product360`, **CD** is
`Products/Categories/CategoryDetail`, and **S360** is `Products/SupplierPrices/Supplier360`. These are actual
mounts/reused sources, not copies to implement. Check helper resolution through the consuming route at runtime.

| Route under Products | Source under B | Activities / context |
| --- | --- | --- |
| `Products/DocumentDetail` | `Shared/DocumentDetail.xml` | PRD-16; preview, versions, datasheet, embedded Chatter |
| `Products/Chatter`, `Products/Chatter/ChatterTui` | `Shared/Chatter.xml`; ChatterTui is mounted by Shared Chatter, not by Products | PRD-16, 23–24 |
| `Products/RecordFiles`, `Products/RecordFiles/RecordFilesTui` | `Shared/RecordFiles.xml`; RecordFilesTui is mounted by Shared RecordFiles | PRD-16, 23–24 |
| `Products/InventoryValuation` | `Shared/InventoryValuation.xml` | PRD-15; hidden finance handoff |
| `Products/CatalogChecks/Index`, `Products/Documents/Index`, `Products/Translations/Index`, `Products/ProductImport/Index` | `Shared/CatalogChecks.xml`, `Documents.xml`, `Translations.xml`, `ProductImport.xml` | PRD-16–17, 20–21 |
| `Products/Prices/List` | `Shared/Prices.xml` | PRD-07 |
| `Products/Prices/PriceLists/List`, `Products/Prices/PriceLists/PriceListDetail` | `Shared/PriceLists.xml`, `Shared/PriceListDetail.xml` | PRD-08–10 |
| `Products/Prices/{PriceExplain,StandardCosts,CostRollup,CostHistory}/Index` | Matching `Shared/*.xml` | PRD-09, 14–15 |
| `Products/SupplierPrices/List`, S360 | `Shared/SupplierPrices.xml`, `Shared/Supplier360.xml` | PRD-11 |
| `Products/Units/Index`, `Products/Units/Packaging`, `Products/Units/Labels` | `Shared/Units.xml`, `Shared/Packaging.xml`, `Shared/Labels.xml` | PRD-18–19 |
| `Products/Settings/IdentificationTypes/Index` | `Shared/IdentificationTypes.xml` | PRD-18, 22 |
| `Products/Features/FeatureDetail/Interactions` | `Products/Features/FeatureInteractions.xml` | PRD-05; feature-fixed reuse |
| P360 | `Shared/Product360.xml` | PRD-02–03 and its tab activities |
| `P360/{Summary,Features,Categories,Identifiers,Dimensions,Documents,KitComponents,Equipment,Associations,Parties,Connections,History,PaidAccess}` | Matching `Shared/Product360/*.xml` | PRD-03–05, 16, 18, 23–24 |
| `P360/Documents/Index` | `Shared/Documents.xml` | PRD-16; fixed product |
| `P360/{Packaging,Prices,Suppliers,Costs,Stock,BOM}` | `Shared/{Packaging,Prices,SupplierPrices,StandardCosts,InventoryAvailability,BillOfMaterialsDetail}.xml` | PRD-07, 11–15, 18; fixed product |
| `P360/Stock/{Summary,Projection,Policy}` | Matching `Shared/InventoryAvailability/*.xml` | PRD-12; facility and owner scope |
| `P360/Stock/{Locations,Movements,Reservations}` | Matching `Shared/InventoryAvailability/*.xml`, shown only when `appRoot == 'Warehouse'` (`Locations.xml:25`, `Movements.xml:21`, `Reservations.xml:20`) | PRD-23 direct-route boundary only |
| `P360/BOM/Overview` | `Shared/BillOfMaterialsDetail/Overview.xml` | PRD-13 |
| `P360/BOM/{BillOfMaterialsExplosion,BillOfMaterialsCompare,WhereUsed,RoutingDetail}` | Matching `Shared/*.xml` | PRD-13–14 |
| CD; `CD/{Summary,Parents,Products,FeatureDefaults,Identifiers,Content}` | `Shared/CategoryDetail.xml` and matching children | PRD-04–05, 16 |
| `CD/Content/Index`, `CD/Content/Index/Index` | `Shared/CategoryContent.xml`, then `Shared/Documents.xml` | PRD-16; nested category content |
| `S360/{Overview,Documents}`, `S360/Prices` | Matching `Shared/Supplier360/*.xml`; `Shared/SupplierPrices.xml` | PRD-11, 16; supplier-fixed context |

Product360 declares 21 tabs: 15 files in `Shared/Product360/` and six mounted from other Shared screens (Packaging,
Prices, Suppliers, Costs, Stock, BOM). Products' context (`service/ironstone/products/SharedContext.js`) admits 19
names, with type conditions but, unlike the other apps, no capability filter. `KitComponents` is for `PtPickAssembly`,
Equipment requires `AstTpEquipment`, and Products' PaidAccess presentation is read-only for `PtDigital`.
`Replenishment` and `PurchaseHistory` are Warehouse and Purchasing tabs: include their routes in PRD-23's
direct-access/context checks rather than presenting them as catalog features.

Supplier360 also has `Bills`, `Buying`, `Finance`, `PurchasingAgreements`, `PurchasingDropShip`,
`PurchasingPerformance`, `PurchasingQuotes`, `PurchasingReceipts`, `PurchasingReturns`, `Receiving`, `SubcontractOrders`
and `Conversation`. Five are declared explicitly in `Supplier360.xml` (Buying, Finance, PurchasingReceipts,
PurchasingDropShip, PurchasingPerformance); the other seven come from the directory. Their owning contexts are
Purchasing, Warehouse and/or Manufacturing. PRD-23 checks that Products has not acquired those operational surfaces
through shared-file expansion. Inspect inherited document and Chatter helpers through their actual resolved URLs;
they are supporting surfaces of PRD-16, not separate workflows.

Shared parents also bring transitions onto Products routes that only their owning app may use: Product360's
`storeProductGl` (refused outside Accounting), Supplier360's `submitSupplier`, `decideSupplier`, `suspendSupplier` and
`inviteSupplierContact` (Purchasing access check), InventoryValuation's `repairCost` and Accounting/Warehouse choice
lists, and Locations' `relocateAssets`/`requestCount` (Warehouse). `appRoot` is a declared parameter on Product360,
Supplier360 and `Products/SupplierPrices.xml`. These are PRD-23's concrete direct-call and forged-context cases. The
`choices` transition from `template/CatalogChoiceTransitions.xml`, included by NewProduct, VariantBuilder and
Settings/Index, is PRD-23's picker restricted-value case.

Translations, ProductImport and CatalogChecks are excluded from the menu (`default-menu-include="false"`); users
reach them from Home, links or direct URLs, which PRD-01 and PRD-21 navigation must account for.

### Custom modes, outputs and embedded surfaces

| Surface | Template / variant and supporting inspection | Activities |
| --- | --- | --- |
| Variant matrix | `Products/Products/VariantBuilder.qvue`; hidden sibling `VariantBuilderTui.xml` via dynamic container; matrix/list/phone, selected generation, queue/run/resume/retry | PRD-06 |
| Product list and category tree | Product list/board, selection/bulk controls, saved finds and exports; category multi-parent occurrence identity, lazy expansion and move | PRD-01–04, 07 |
| Detail dialogs | Product edit/clone/lifecycle/delete; taxonomy edges/members; feature/group/interactions; per-row master-data actions | PRD-02–06 |
| Price dialogs | Add/correct/schedule/end; reviewed bulk change; list/rule/publish; explanation parameters and fixed-product/supplier contexts | PRD-07–11 |
| Stock/method/cost dialogs | Facility/tracking policy; method revision/components/operations/approve; estimate components/approval/clone; valuation preview/post | PRD-12–15 |
| Chatter and RecordFiles | Reused shared QVue components and terminal helpers; record audiences and recipient return | PRD-16 |
| Price history | Local `PriceHistory.xml` qvt `chartHtml` and tui `chartTui`, parameters and underlying transaction statistics | PRD-09 |
| Import | One staged `Shared/ProductImport.xml` surface, not five child routes: source, mapping/defaults/value mapping/formats, validate, apply, durable row results/retry; `sample` and `results` CSV | PRD-20 |
| Price-list output | `effectiveOutput` HTML/PDF, effective-price CSV/XLSX and authored `html-print` header/layout | PRD-10 |
| Cost outputs | `estimatePrint`, `approvedPdf`, roll-up/history and valuation CSV where offered | PRD-14–15 |
| Managed documents | Preview/download, version compare/restore, conflict draft download and product `datasheet`; product/category content. Supplier Documents is a Party RecordFiles attachment entry | PRD-16–17 |
| Labels | Prepared fingerprint, decoded value/SVG preview, PDF layout/download and configured-printer send/retry; TUI text describes symbology/value | PRD-19 |
| Other exports | CSV and XLSX: Products, Features, FeatureGroups and Categories lists, Prices, PriceListDetail effective rows, SupplierPrices. CSV only: CostRollup, CostHistory, StandardCosts, InventoryValuation, CatalogChecks, Units, Packaging, Labels, PriceExplain. The PriceLists list and PriceHistory have none | Respective activities |
| Shell | Quick create product/category/feature; palette `search#Catalog` (labelled "Products"), `MantleProduct` and `#` identifier sources; `g p/g c/g f`; price-change and expiring-price notification topics. Products declares no `assist-prompt` (Admin, Commerce and Insights do), so Assist gets only generic page context | PRD-01, 07, 20–24 |
| Home panels | Counters (Active SKUs, Variants, Missing price, Ending in 30 days, Incomplete → CatalogChecks with required-field error preset), Recently changed, capability-gated shortcuts, empty-catalog box and the Catalog tasks panel linking to Commons TaskDetail | PRD-01, 21 |
| Insights/Admin entries | `Products.CatalogChecks`, `Products.PriceHistory`, `Products.CostHistory`, `Products.CostRollup`; ActiveSkus/Variants/EndingSoon attention; Admin catalog-health fix link and `products.settings` SettingsEntry → `Products/Settings/Index` (`BossSetupData.xml:2563-2566`) | PRD-21–22, 24 |

VariantBuilder allows only `vue,qvue,tui`, yet contains an `html,qvt` fallback link (`VariantBuilder.xml:57`).
Check whether Standard can reach that link before claiming Standard support. Inline status/chart templates and shared
Chatter/files also need their own relevant mode samples; one QVue file does not mean only one custom experience.

### Design-to-code reconciliation

| Design or historical item | Current review disposition |
| --- | --- |
| “Only Products context implemented” in shared-screen notes; several neighboring contexts in impl-products §7 | Current context code supports Warehouse, Manufacturing, Purchasing, CustomerService and Commerce; Accounting has a separate Product360 template branch. Use current mounts and reconcile stale documentation when behavior is reviewed |
| Product360's original tab list | Include the newer digital PaidAccess read-only surface; distinguish physical children from permitted Products tabs |
| Supplier360's original small catalog context | Additional inherited operational children belong to their consuming apps; verify omission/refusal in Products |
| Import described as steps | Current implementation is a single staged shared screen with durable state, not a multi-route wizard or Commons progress template |
| Historical ProductsShots and full-render results | Use current §5 suites and assertions; do not restore deleted screenshot/sweep regression tests or promote old results to live coverage |
| Configurations/ConfigurationDetail, ChangeNotices/ChangeNoticeDetail, ProductGeo, merge-product, pivot/graph, general matrix and GS1 company-prefix provider | Deferred/unmounted work stays outside this review; no placeholder implementation to close coverage |
| Commerce merchandising and Manufacturing execution formerly listed as future | Their current owner apps exist; inspect only a relevant handoff or shared-fix consumer here |
| Global units, currencies and valuation | Noncurrency global unit writes require system authority; currency/rates remain Accounting's; standard approval and inventory revaluation are separate outcomes |

## 4. End-to-end activities

The §6 ledger holds status and evidence. Use visible controls and inspect intermediate states, confirmations,
persisted results and a second identity where relevant. A landing render, HTTP 200 or service-only mutation does
not complete an activity. Browser means Material light/dark; TUI means actual supported terminal operations;
Standard means the brief functional/output/fallback check in §2. Unsupported variants remain explicit.

### PRD-01 — Start a catalog workday and find the right product

- **Actor/start:** catalog reader/editor, price reader and empty-catalog fixture, with owned and shared products.
- **Objective/steps:** Home → each permitted counter (Active SKUs, Variants, Missing price, Ending in 30 days,
  Incomplete) → matching find → product → Back; Recently changed and capability-gated shortcuts; search ID/name/typed
  identifier and authorized party item code; filter by tag; open each seeded saved find (Virtual, Variants, Services,
  Stocked, Discontinued, Missing price); switch list/board, sort, page, choose columns and save/reset a find; export
  CSV and XLSX by filter and by selected rows and inspect the bytes; reach the menu-excluded Translations, Import and
  Checks screens from Home; use palette, quick-create entry, keyboard shortcuts, the Home catalog-tasks panel and
  notification returns with drawers open.
- **Expected:** counts, owner scope, filters, selected identity and visible money agree; returning preserves the find;
  exports match the chosen scope with readable columns (Projects found blank/raw export columns, PR-UI-031);
  supplier-only item codes stay hidden without supplier-price read; restricted or unavailable sources do not
  fabricate values or hide unrelated work.
- **Recovery:** empty catalog box, no-match list, one Home card unavailable while the others load, inaccessible recent
  record, identifier ambiguity, unavailable search/provider, canceled quick create and filters retained after failure.
- **Screens/modes:** Home, Products/List and shell providers; browser/TUI/Standard, keyboard/narrow/zoom samples.

### PRD-02 — Create, clone and manage a product's lifecycle

- **Actor/start:** catalog editor with disposable draft and used product; reader for refusal.
- **Objective/steps:** NewProduct from list and quick create → saved Product360 → edit → clone selected sections →
  inspect the new identity/history → activate/discontinue/obsolete as allowed; delete an unused draft separately.
- **Expected:** defaults and selected clone sections persist, ownership is clear, transitions explain their effects,
  readiness failures identify missing requirements, and deletion is limited to unused drafts; a new form does not
  inherit another record's key. Discontinuation/obsolescence preserves existing open orders, stock and returns while
  refusing new prohibited use under the lifecycle rule. The Summary `salesAllowed`/`purchaseAllowed` facets are
  enforced by `check#ProductUsable` at a downstream consumer. The record header, including the terminal header,
  refreshes after a transition.
- **Recovery:** missing/duplicate ID/name, invalid date/status, stale edit, canceled clone/status/delete, attempted
  deletion of a used product, obsolete-product refusal at one existing downstream consumer, and an edit of a
  Discontinued or Obsolete product's master record (Projects found closed-state writes, PR-UI-022).
- **Screens/modes:** NewProduct, Product360/Summary/History and lifecycle dialogs; browser/TUI/Standard.

### PRD-03 — Complete the master record and understand its connections

- **Actor/start:** editor and reader on owned/shared masters, kit and equipment fixtures, with multiple child rows.
- **Objective/steps:** maintain identifiers (including `assignGenerated` and other-type entry), dimensions,
  associations, party references, categories and tags, and effective dates; create a feature inline from the Features
  tab; edit two different rows in each sampled dialog family; inspect kit components and equipment-specific details;
  use Connections and History, then return to the same product. Select products in the list and apply each bulk action
  (Category apply/end, Feature apply/end as Standard or Selectable, and Prices handing off to BulkPrice), then
  reconcile row outcomes after the redirect. Reload a tab on its own and open it in the terminal (impl F44:
  `always-actions` versus `actions`). Visit the tab links into later activities.
- **Expected:** names, units, dates and owner context are readable; row actions target their own keys; equivalent and
  replacement associations read correctly from both products, and the generic editor refuses `PatMfgBom` and
  `PatPackagingFor`; a kit remains distinct from a manufacturing BOM; unauthorized transaction identities are omitted.
- **Recovery:** duplicate identifier, invalid unit/association/cycle, ended relationship, missing target, stale save,
  shared-master write refusal, mixed valid/foreign/stale bulk selections and cancel/reopen with retained input.
- **Screens/modes:** Product360 master tabs, KitComponents, Equipment, Connections and History; browser/TUI/Standard.
  Pricing, suppliers, stock, methods, costs, documents and packaging continue in PRD-07, 11–16 and 18. Connections'
  per-type 25-record limit without list links is a known limit (impl R7), not a new finding.

### PRD-04 — Organize a multi-parent category hierarchy

- **Actor/start:** editor with two parents, one category placed under both, dated edges and product memberships.
- **Objective/steps:** create category → edit Summary → add/end parent edges and add children → expand/find the same
  category in both tree occurrences → move one placement → maintain product membership, feature defaults and
  identifiers, including the URL-slug preview → reopen each path → delete an unused disposable category.
- **Expected:** only the chosen dated edge moves; other placements and memberships remain; counts and current/as-of
  presentation agree; list/tree navigation retains the selected record and useful find.
- **Recovery:** cycle, duplicate/overlapping edge, wrong owner, canceled move, refused delete of a used category,
  failed child load and retry; keyboard alternative to drag; category-content continuation in PRD-16. Category store
  context belongs to Commerce and is only checked for absence here.
- **Screens/modes:** Categories/List/NewCategory, CategoryDetail tabs and Product360/Categories; browser/TUI/Standard,
  focused phone/tree/keyboard sample.

### PRD-05 — Maintain features, groups and compatible combinations

- **Actor/start:** editor with selectable/descriptive features, dated group membership and a category default.
- **Objective/steps:** create/edit feature and group → add/end memberships → attach group to category → apply feature
  to product → inspect affected Products → maintain required/incompatible interactions globally and feature-fixed →
  delete an unused disposable feature and group.
- **Expected:** labels and dates explain the choices; product/category/group identity survives navigation; the
  selected and required features feed the same combinations used by PRD-06.
- **Recovery:** duplicate application, invalid/expired membership, forbidden owner, contradictory interaction,
  refused delete of a used feature or group, cancel and second-row edit/reopen.
- **Screens/modes:** Features/List/NewFeature, FeatureGroups/NewGroup, FeatureDetail, FeatureGroupDetail, both Interactions mounts, category defaults
  and Product360/Features; browser/TUI/Standard.

### PRD-06 — Generate selected variants and resume a batch

- **Actor/start:** editor on a virtual product with at least three feature axes, existing variants and forbidden combinations.
- **Objective/steps:** preview → choose axes/filter/groups/copy fields → select complete combinations across pages →
  generate → open created product and verify copied values; repeat safely; queue a separate selection → leave/reopen
  operation → process next batch → inspect item results and retry a failed item.
- **Expected:** matrix/list/phone identify the same complete keys; only selected allowed combinations are created;
  existing variants keep their identity/overrides; selectable-feature price extras for the virtual-base fallback are
  shown in the preview; preview revision and durable operation stay bound to their source.
- **Recovery:** no selectable features, collision, over-limit selection, stale preview, permission change, failed
  combination, source/axis switch during a delayed request, cancel generation and navigation while loading.
- **Screens/modes:** VariantBuilder QVue and VariantBuilderTui; actual browser matrix/list/390px/keyboard and terminal
  selection/generation; Standard fallback investigated separately.

### PRD-07 — Maintain effective sales prices and review a bulk change

- **Actor/start:** price editor/reader, catalog-only reader, current/future/expired prices and quantity breaks.
- **Objective/steps:** global Prices → add/schedule/correct/end → follow the row history and bulk links → product
  Prices tab → Products list selection → BulkPrice preview → inspect count/deltas/currency rounding → confirm → reopen
  prices/history and the price-change notification. Separately prepare a price ending within 30 days and inspect the
  expiring-price notice from the scheduled `send_ExpiringProductPrices` job and its recipients.
- **Expected:** sale direction, organization, unit, currency and date boundaries remain visible; preview and apply
  agree; results survive redirects and unaffected products remain unchanged; price-change and expiring-price notices
  are distinct and reach only recipients permitted to read the price.
- **Recovery:** invalid dates/amounts, overlap or stale basis, missing selected row, mixed-owner selection, canceled
  bulk operation, denied write and independent item failure where supported.
- **Screens/modes:** Prices/List, Product360/Prices, Products/List/BulkPrice and row dialogs; browser/TUI/Standard.

### PRD-08 — Build and publish a price list with understandable rules

- **Actor/start:** price editor with draft/published lists, scoped products and applicable quantity/date/counterparty rules.
- **Objective/steps:** create list → edit entries/rules, geo scope and dates → preview/explain a representative
  result, including rule rounding and bounds steps → publish with confirmation → inspect effective entries → clone/end
  or revise through offered controls.
- **Expected:** precedence and eligibility are understandable; the selected list/version of dated records is stable
  across navigation; publication does not silently broaden owner or party scope.
- **Recovery:** incomplete rule, invalid range, overlapping/competing rules, missing base, stale change, canceled
  publication and reader/direct-write refusal.
- **Screens/modes:** PriceLists/List/PriceListDetail and rule dialogs; browser/TUI/Standard; output continues PRD-10.

### PRD-09 — Explain a price and distinguish price history from estimates

- **Actor/start:** price reader with published list, quantity/unit/date/counterparty variants; separate cost reader pair.
- **Objective/steps:** Explain price → vary one input → follow selected/base/rule trace, including per-step rounding
  → export the trace CSV and print it → inspect product price history and transaction statistics → open a source where
  permitted; revisit with an approved standard after PRD-15.
- **Expected:** final amount and provenance match the chosen inputs; the result states that order promotions and
  final tax are excluded; historical transactions are labeled distinctly from dated catalog changes; cost
  bases/margins appear only with the required permissions and remain absent otherwise.
- **Recovery:** missing price/base, unsupported conversion, unavailable search/history, no transactions, invalid date,
  denied supplier direction and unauthorized source link.
- **Screens/modes:** PriceExplain/Index, local PriceHistory chart/table and relevant history links; browser/TUI/Standard,
  dark chart and narrow parameters. Standard-cost basis/margin is an explicit PRD-14/15 continuation.

### PRD-10 — Produce an effective price list that matches the screen

- **Actor/start:** authorized price reader, selected published list/date/quantity/unit/counterparty and mixed visible/hidden products.
- **Objective/steps:** resolve effective rows → export CSV and XLSX → open printable HTML/PDF → inspect actual bytes,
  headers, amounts, dates, blank missing prices and page breaks against the same selection.
- **Expected:** every output has the same permitted product scope and resolution basis; independent failures name
  their product; no hidden cost/owner rows appear; the output limit gives usable filter guidance.
- **Recovery:** missing price, failed one-product resolution, excessive scope, stale/ended list, denied download and
  unavailable PDF renderer. Supplier-offer output is checked in PRD-11.
- **Screens/modes:** PriceListDetail/effectiveOutput, effective rows and html-print; browser and downloaded outputs,
  TUI/Standard entry/delegation as supported.

### PRD-11 — Maintain supplier offers for the right buying organization

- **Actor/start:** supplier-price editor/reader, sales-only reader, one supplier with offers for two buying organizations.
- **Objective/steps:** find offers → create/schedule/correct/end offer and quantity break, setting preferred order and
  dropship → open Supplier360 → Prices and Documents → product Suppliers tab → review/apply a supplier bulk change
  from the Products list → explain the selected purchase price → export the offers CSV and XLSX and inspect the bytes
  → return to the original find.
- **Expected:** supplier item code, buying organization, currency/unit, preferred order, dropship, lead time and dates
  stay explicit; global, supplier-fixed and product-fixed surfaces refer to the same offer; outputs carry only
  permitted offers; sales privileges do not expose purchase values.
- **Recovery:** wrong buyer/product owner, invalid range/minimum, stale edit, ended offer, absent supplier details,
  canceled action and direct output/read refusal.
- **Screens/modes:** SupplierPrices/List, Supplier360/Overview/Prices/Documents, Product360/Suppliers and purchase
  explanation; browser/TUI/Standard. Additional operational supplier tabs are PRD-23 boundaries.

### PRD-12 — Explain available stock and maintain authorized facility policy

- **Actor/start:** `catalog.reader` and `catalog.stock.plan` with permitted and foreign stock (`BOSS_PRD_WH` assets),
  incoming supply, reservations and a kit.
- **Objective/steps:** product Stock → Summary (facilities, incoming quantities, lots on hand) → Projection → Policy.
  As the planner, change planning values and add a dated product tracking exception with shelf-life and near-expiry
  days, then reload. Confirm the planner cannot change organization or facility defaults. In Products, Stock shows
  only Summary, Projection and Policy; Locations, Movements and Reservations are Warehouse-only and belong to PRD-23.
- **Expected:** facility/owner totals reconcile, foreign stock is absent, incoming and available quantities are
  distinct, units are clear, kit availability respects the limiting component, and product exceptions do not grant
  authority to change broader defaults. Lots and movements are not links yet (impl R7); record that as a known limit.
- **Recovery:** no authorized facilities, missing location/source, invalid minimum/multiple/date, revoked facility,
  canceled policy change and unavailable downstream app.
- **Screens/modes:** Product360/Stock Summary, Projection and Policy; browser/TUI/Standard and narrow totals.

### PRD-13 — Maintain a manufacturing method through its catalog context

- **Actor/start:** `catalog.method`, separate `catalog.method.approve` and `catalog.method.read`, a matching Retail
  product/facility and released/draft revisions.
- **Objective/steps:** product BOM → create/revise method → add components and operations → routing/work-center
  choices → create a work center and maintain setup/run/batch standards and permitted resource rates → copy operations
  from another routing → request release / release and link the routing → validate → compare revisions → request or
  approve the method release through the permitted role → explosion and where-used at two dates; inspect legacy
  import and kit distinction where offered.
- **Expected:** draft versus released/effective identity is clear; approved data is stable; component paths, units,
  phantom/subassembly behavior and routing context remain understandable; method edit, approval, resource-rate
  authority and cost visibility remain independent.
- **Recovery:** cycle, invalid component/quantity/unit, overlapping dates, missing routing/resource, stale revision,
  canceled approval, non-approver refusal and deleted/unavailable source.
- **Screens/modes:** BOM/Overview, RoutingDetail, BillOfMaterialsExplosion/Compare and WhereUsed; browser/TUI/Standard,
  selected tree/keyboard/phone variants. Cost basis continues PRD-14.

### PRD-14 — Roll up a cost and explain its missing inputs

- **Actor/start:** cost estimator/reader with released method, approved subassembly standard, phantom and by-product
  fixture, all in one organization: a prepared Retail estimator for a Retail method, or a Services purchased item
  (`BOSS_PRD_PACK`) for the narrow Services roles (§2).
- **Objective/steps:** CostRollup → select product, organization/facility, quantity/unit/date and basis → calculate →
  inspect per-path materials/conversion/overhead/by-product totals → follow source → create/open the resulting draft.
- **Expected:** lot size, setup, allocation and rounding basis are stated; approved subassembly and full calculations
  are distinguishable; incomplete findings remain visible; the displayed total reconciles to its components.
- **Recovery:** missing supplier price/standard/rate/conversion, cycle, incompatible basis, stale method, denied cost
  read and failed independent path where the contract permits continuing. Change a supplier price, approved
  subassembly standard or work-center rate after preview, then attempt save to inspect source-fingerprint recovery.
- **Screens/modes:** CostRollup/Index, BOM links and resulting StandardCosts; browser/TUI/Standard and the CSV export.
  The saved draft continues in PRD-15.

### PRD-15 — Approve a standard estimate and inspect the finance handoff

- **Actor/start:** `catalog.cost.estimate`, separate `catalog.cost.approve` and the inventory accountant
  (`catalog.cost.gl`); draft/approved standards (`BOSS_COST_SAMPLE`) and disposable stock/accounting prerequisites.
- **Objective/steps:** draft manual standard or PRD-14 result → edit allowed components → review → approve as the
  permitted approver → reopen/clone → inspect estimate HTML/approved PDF and CostHistory; follow Request revaluation
  as the inventory accountant → preview → inspect confirmation/result if the later execution scope includes posting.
- **Expected:** approval separation/self-approval policy is clear; standard approval makes no stock/GL change;
  finance preview names affected on-hand quantity, dates and accounts. An authorized disposable posting is checked
  against saved valuation/ledger outcomes, never inferred from a toast.
- **Recovery:** incomplete/overlapping standard, stale approval, forbidden self-approval, missing PDF, revaluation
  disabled, missing mapping/closed period/negative stock, canceled post and refusal for a user without `catalog.cost.gl`'s
  accounting grant.
- **Screens/modes:** StandardCosts/Index and product Costs, CostHistory/Index, InventoryValuation, outputs;
  browser/TUI/Standard. Explicitly record whether posting was exercised, deferred or outside execution scope.

### PRD-16 — Maintain product documents and collaborate on the same record

- **Actor/start:** two authorized staff and a user without the content edit grant; versioned product/category content
  (`BOSS_CONTENT_SAMPLE`), a virtual product with a variant, and generic product/supplier attachments.
- **Objective/steps:** Documents → create/upload/edit metadata/content → upload several files at once
  (`uploadContents`) → switch list/card view → preview/download → compare versions → restore → product datasheet;
  repeat managed-content entry through product and category, and read the inherited-from-virtual indicator on the
  variant. Separately open product
  RecordFiles and Supplier360/Documents → attach/download a record file → Chatter post/reply/mention/follow on a
  supported catalog record → recipient notification returns to the same record.
- **Expected:** language, content type, dates, parent record and resource identity persist; version/download bytes
  match the chosen content; generic record files and managed catalog documents remain understandable. Supplier
  Documents attaches files to the supplier Party and does not acquire the managed catalog version/translation UI.
- **Recovery:** missing/deleted resource, denied direct bytes, stale edit with local draft recovery, one failed file in
  a multi-file upload named while the others succeed, failed upload/save,
  canceled restore, revoked audience and empty history. Preserve unsaved text on errors.
- **Screens/modes:** Documents/Index, DocumentDetail/Chatter, product/category content, supplier attachment mount and RecordFiles helpers;
  browser/TUI/Standard, actual downloads/datasheet, selected narrow rich-editor/keyboard variants.

### PRD-17 — Translate content without overwriting another language

- **Actor/start:** editor with two locales, translated/missing product/category text and a source revision.
- **Objective/steps:** Translations → filter source/target language and record → add/edit target → save → revisit
  target document/product/category and its history → change source → inspect/reconcile a target needing review
  → switch language and return.
- **Expected:** source and target are clearly identified; selected locale and effective content survive navigation;
  no fixed default language or unintended overwrite is introduced.
- **Recovery:** missing translation/source, identical or invalid locale, stale source/save, explicit clear, canceled
  edit, denied owner and long/Unicode content.
- **Screens/modes:** Translations/Index and corresponding content mounts; browser/TUI/Standard and output sample.

### PRD-18 — Maintain units, packs and resolvable identifiers

- **Actor/start:** catalog editor, reader and separate system administrator; base product, packaging product and conversion.
- **Objective/steps:** inspect Units/conversion and use Preview conversion → edit allowed noncurrency unit as ADMIN →
  product Packaging →
  add/end pack relation and identifier → scan/resolve base and pack codes → inspect resolved product/quantity/unit.
- **Expected:** pack versus base identity and factor are explicit; dated conversions preserve history; non-admin
  unit writes and all Products currency/rate edits are refused; shared/global authority is not inferred from catalog
  admin. Packaging/conversion changes preserve historical transaction pack quantities and create no stock movement.
- **Recovery:** incompatible unit, zero/invalid quantity, cyclic/duplicate packaging, ambiguous/invalid code, stale
  conversion, canceled end and wrong-owner identifier.
- **Screens/modes:** Units/Index/Packaging, Product360 Dimensions/Identifiers/Packaging and identifier palette;
  browser/TUI/Standard, keyboard scanner-like input. Label preparation continues PRD-19.

### PRD-19 — Prepare, inspect and print usable labels

- **Actor/start:** permitted catalog user with valid/invalid identifiers, pack quantities and a safe local print destination if available.
- **Objective/steps:** Labels → choose products/identifiers/symbology/layout/quantity → prepare → render and inspect
  decoded values and preview → generate/download PDF and open the printable page → inspect page size, dimensions,
  repeated labels and legibility; send/retry only to the configured review destination when included.
- **Expected:** preview and PDF describe the same current selection and label count; encoded values match records;
  TUI provides meaningful decoded text; generation, queue status and actual delivery are distinguished. Explicit
  internal identifier assignment is a separate edit; generating labels neither allocates external GS1 identities
  nor moves stock.
- **Recovery:** invalid check digit/unsupported input, missing identifier, changed preparation fingerprint, renderer
  unavailable, canceled send and printer failure/retry without unexplained duplicate delivery.
- **Screens/modes:** Units/Labels, real PDF and optional controlled printer outcome; browser/TUI/Standard,
  selected 390px/keyboard controls. No physical printer availability is assumed.

### PRD-20 — Import, correct and resume a catalog change

- **Actor/start:** catalog/price/supplier editor as appropriate, actor-private run and synthetic CSV with mixed rows.
- **Objective/steps:** obtain sample → upload/stage → map columns, defaults, values and formats/clear behavior →
  validate → inspect findings → apply → inspect row results/error CSV → leave/reopen → correct/retry; repeat with
  an existing completed row and a separately permitted price or supplier import kind.
- **Expected:** staged source and mapping survive navigation; apply rechecks fingerprint and authority; independent
  valid rows commit, product-plus-identifiers stays atomic, completed rows skip retry, and aggregate notices agree.
- **Recovery:** size/row limit, encoding/invalid type, missing required column, duplicate key, explicit clear,
  changed source, stale mapping, revoked permission, another actor's run and failed row amid successful rows.
- **Screens/modes:** ProductImport/Index, its mapping/default/value/format controls and sample/results endpoints;
  browser and available TUI/Standard steps, with upload limitations explicit; downloaded CSV inspected.

### PRD-21 — Find and resolve catalog-quality issues

- **Actor/start:** reader/editor/admin, seeded incomplete and duplicate data plus restricted-price/cost cases.
- **Objective/steps:** Home Incomplete → CatalogChecks → choose checks/severity/scope → run → open affected record →
  correct as permitted → return/rerun → export; inspect the existing Admin health/Insights entry with its holder.
- **Expected:** findings identify record, rule and useful action; counts match filters and owner scope; a reader can
  inspect permitted issues without acquiring writes or sensitive diagnostic values.
- **Recovery:** no issues/no matches, failed independent check, inaccessible source, invalid selection, stale result
  after correction and denied check data.
- **Screens/modes:** CatalogChecks/Index, Home and selected fix destinations; browser/TUI/Standard and actual CSV.

### PRD-22 — Change defaults and verify their consumers

- **Actor/start:** catalog administrator and ordinary editor, organization defaults plus explicit product overrides.
- **Objective/steps:** reach Settings from the Products menu and from Admin's `products.settings` entry →
  Settings/Index → change dated catalog defaults and the cost self-approval setting → new product and PRD-15 approval;
  VariantSettings → new preview; PricingSettings → affected rounding and explanation behavior; IdentificationTypes →
  row actions, the IdentifierTest form (validate without assigning) and identifier/label entry; inspect effective
  versus overridden values, reload to confirm each checkbox/flag kept its value, and restore review-only settings.
- **Expected:** organization, effective date and scope are clear; defaults affect the intended future operation,
  preserve explicit overrides/history, and do not grant additional authority; authorized row actions are enabled in
  every mode (Projects PR-UI-037) and saved flags match what was chosen (PR-UI-036).
- **Recovery:** invalid default/range/type, overlapping dates, stale edit, canceled save, read-only settings and
  changing a setting after a preview has already been prepared.
- **Screens/modes:** all Settings definitions and corresponding PRD-02/06–09/15/18–21 consumers;
  browser/TUI/Standard, selected phone/keyboard long form and row controls.

### PRD-23 — Reconcile permission and organization boundaries

- **Actor/start:** narrow catalog/price/supplier/cost/method roles, system/admin pair, other organization and revoked role.
- **Objective/steps:** repeat representative successful read/write/output as a user lacking that grant; inspect direct
  detail/tab/helper/download URLs, search and the `choices` picker, and import/variant operations; switch active
  organization where supported; inspect shared `_NA_` records; attempt context-excluded product/supplier/stock tabs,
  the inherited owning-app transitions listed in §3 and paid-access writes; pass a forged `appRoot`; check that
  supplier-only item codes stay absent without supplier-price read.
- **Expected:** refusal is due to the intended authority using otherwise valid inputs; hidden controls have positive
  holder counterparts; sensitive values/record IDs are absent server-side; user-supplied context cannot expand access.
- **Recovery:** logout/relogin, revoked grant/membership after page/preview load, stale saved link, missing record,
  forged app context and denied direct file/export. Keep absence, unavailability and refusal distinguishable.
- **Screens/modes:** bounded samples across §3, including Product360 PaidAccess/Replenishment/PurchaseHistory, the
  Warehouse-only Stock tabs and inherited operational Supplier360 children; browser/TUI/Standard plus response/output
  inspection, not a new matrix test.

### PRD-24 — Preserve cross-app continuity and reconcile remaining modes

- **Actor/start:** Products-only user and representative authorized neighboring-app identities on the same records.
- **Objective/steps:** follow catalog Connections and authorized warehouse/purchasing/method/accounting/Commerce
  handoffs → inspect correct record and return; inspect Products report/attention links through Insights and the
  Admin catalog-health and settings links; sample the same shared correction in a second consumer; close remaining terminal,
  Standard, theme, keyboard, narrow/zoom and output gaps recorded by earlier activities.
- **Expected:** app context retains record identity and each app's authority; Accounting's separate presentation and
  Commerce's editable PaidAccess remain distinct from Products; unsupported modes provide a truthful usable fallback.
- **Recovery:** unavailable neighboring launcher, denied record, removed report/provider, stale notification and
  unsupported mode/tool prerequisite. Do not turn an absent handoff into a new feature request.
- **Screens/modes:** actual current shared mounts/providers and named outstanding samples only; record each observed
  mode separately. Full adjacent-app journeys and every role×route×mode combination remain outside this review.

## 5. Existing checks and future verification

This is an available-test map, not a passing-results ledger. Paths are relative to the named component and names
omit `.spec.js`. Read current assertions before selecting a run; historical breadth is not a reason to duplicate
rules, renders or complete journeys.

| Component / suite | Existing specs | Activities / limits |
| --- | --- | --- |
| mr-boss regression `test/Products/` | ProductsCatalog, ProductsTaxonomy, ProductsVariants | PRD-01–06; rules/context checks, not live find/tree/matrix evidence |
| mr-boss regression `test/Products/` | ProductsPricing, ProductsPriceLists, ProductsSuppliers | PRD-07–11; date/direction/context checks, with actual explanation/output usability separate |
| mr-boss regression `test/Products/` | ProductsInventory, ProductsMethods, ProductsCosts | PRD-12–15; permitted stock, engineering and cost behavior |
| mr-boss regression `test/Products/` | ProductsMethodFixtures, ProductsCostFixtures | Generated method/standard/PDF setup; check prerequisites and loaded rows, not a review outcome |
| mr-boss regression `test/Products/` | ProductsDocuments, ProductsTools, ProductsImport, ProductsChecks, ProductsFinish | PRD-10, 16–22; focused content/tools/import/output contracts |
| mr-boss regression `test/Products/` | ProductsAccess, ProductsSharedContext | PRD-23–24 and permission pairs throughout; not a complete access walk |
| mr-boss regression `test/client/Products/` | ProductsWalk | Existing single golden path: create/activate draft, identifier and customer item code; reuse it |
| mr-boss acceptance `acceptance/Products/` | ProductsScreens, ProductsTaxonomyScreens, ProductsVariantScreens, ProductsPriceScreens | Existing render coverage, including selected custom modes; source/render support, not browser or terminal interaction |
| mr-boss acceptance `acceptance/Products/` | ProductsPriceFixtures, ProductsInventoryFixtures, ProductsToolsFixtures, ProductsImportFixtures | Acceptance setup, not an incidental authorized bootstrap |
| mr-boss acceptance `acceptance/client/Products/` | ProductsTaxonomyWalk, ProductsVariantWalk | PRD-04–06; VariantBuilderTui is opened in a browser, not a live terminal |
| mr-boss acceptance `acceptance/client/Products/` | ProductsPriceWalk, ProductsPriceListWalk, ProductsSupplierWalk | PRD-07–11 |
| mr-boss acceptance `acceptance/client/Products/` | ProductsInventoryWalk, ProductsMethodWalk, ProductsCostWalk | PRD-12–15; method walk uses a composed role; cost walk covers a purchased estimate, independent approval and revaluation, not every manufacturing roll-up variant |
| mr-boss acceptance `acceptance/client/Products/` | ProductsDocumentWalk, ProductsToolsWalk | PRD-16–19; actual current assertions determine output/translation extent |
| mr-boss acceptance `acceptance/client/Products/` | ProductsImportWalk, ProductsChecks, ProductsCatalogSettings, ProductsFinish | PRD-20–22, outputs and cross-cutting finish checks |
| mr-boss acceptance `acceptance/client/Products/` | ProductsPhone | 390px labels/checks/import/variant-list samples and five pricing dialogs at 1280px; the variant list and dialogs run as ADMIN `john.doe`; not app-wide phone or least-privilege coverage |
| mr-boss regression `test/Shared/`, `test/Commons/` | Chatter, RecordFiles; QuickCreate, TodayPanel, Notifications | PRD-01, 16, 24; use affected shared checks without repeating the Commons review |
| mr-boss acceptance root | AppStructure, ServerStatic, TuiRender | Existing structural/render coverage; reconcile with Products render files before changing a sweep |
| mr-mantle regression `test/product/` | ProductLifecycle, ProductCatalogServices, ProductCatalogSettings, ProductFeaturePolicy, ProductVariants | PRD-02–06, 22–23; native business rules |
| mr-mantle regression `test/product/` | ProductPricePolicy, ProductPriceLists, ProductEffectivePrices | PRD-07–11; direction, provenance, bulk changes and resolved output |
| mr-mantle regression `test/product/` | ProductStockTotals, ProductMethods, ProductStandardCosts | PRD-12–15; stock, method and estimate rules |
| mr-mantle regression `test/product/` | ProductContents, ProductPackaging, ProductLabels | PRD-16–19 |
| mr-mantle regression `test/product/` | ProductCatalogCsv, ProductCatalogImport, ProductCatalogChecks | PRD-20–21 |
| mr-mantle regression `test/product/` | Replenishment, ReplenishmentRoutes, SupplyPlanning; ReportLookups | PRD-12 stock policy, obsolete products and kit assembly; PRD-05, 18 feature and unit lookups |
| mr-mantle regression `test/product/`, `test/ledger/` | WarehouseReports, AccountingValuation; AssetReservationMisc, WarehouseStockChecks | PRD-15 revaluation and stock history; PRD-12 edge checks |
| webroot regression `test/client/` | WebrootVue.qvt, WebrootVue.qvt.shell, WebrootVue.qvt.layout, WebrootVue.qvt.records, WebrootVue.qvt.static, WebrootVue.qvt.views, WebrootTerminal, QvtKeys, Keys | Only for affected shared-widget/shell/renderer behavior |
| webroot acceptance `acceptance/client/` | ThemeLayout | Existing home for reusable theme/geometry checks, not permission to run it without authorization |

There are **18 Products server regression files**, **one Products browser regression golden path**, **eight Products
server acceptance files** (four render specs and four fixture specs) and **15 registered Products browser acceptance
specs**. `ProductsChecks` and `ProductsFinish` exist both in `test/Products/` and in `acceptance/client/Products/`, so
say which suite a `--spec` run means. `test/client/suite.js` registers ProductsWalk; `acceptance/client/suite.js` registers the other 15 and requests
price/inventory/method/cost/tools/import fixtures alongside other apps' setup. Method/cost fixtures live in regression
despite their use by acceptance. Select a focused run deliberately and inspect setup dependencies before execution.

Neither a browser opening of VariantBuilderTui nor a rendered terminal response proves actual TUI keyboard use.
Current phone coverage is narrow, and the purchased-cost scenario does not cover every by-product/phantom/stale-input
roll-up. Shared-screen contexts and newer PaidAccess/Insights handoffs also need current live evidence. Existing
render coverage is spread across several acceptance files and root checks: reconcile overlap before extending it,
keep at most one screen sweep per app/mode, and do not add another sweep simply to satisfy this plan.

Some older Products specs computed checks inside `if` blocks that the runner never asserted (impl-products F46);
read the current assertions before relying on a spec as coverage. No new automation is prescribed by this plan. If a later finding needs coverage, name the activity and
existing or new spec first: focused rule/bug assertions in regression, additional complete journeys and access,
phone or terminal walks in acceptance. Do not recreate ProductsShots or add screenshot baselines.

### Verification rules for later refinements

- Read the [testing skill](../../../../.agents/skills/testing/SKILL.md) before writing/running tests. Commands run
  from the mr-moqui root. Use affected regression specs on a suitable binary, for example
  `./moq test mr-boss --spec ProductsCatalog --nobuild`; client specs run through Moqui, not Node:
  `./moq test-client mr-boss --serve --spec ProductsWalk --nobuild`.
- Follow the supplied repository instructions: `./moq test-apps` before an application-work commit;
  `./moq test-framework` before a framework-work commit. Any later user-directed review cadence must be recorded
  explicitly in §7. Do not copy Projects' exception or infer one from older review notes. Commit only when the user
  asks.
- **Acceptance runs require the user's request or an added/changed acceptance test.** If one is added/changed,
  run that test and its component's acceptance suite once written. For an authorized existing scenario, use
  `./moq accept mr-boss --spec ProductsVariantWalk`. A plan entry, shared-code change, acceptance fixture dependency
  or completion checkpoint is not authorization to run acceptance. No `accept-all` is part of this plan.
- Keep business-rule/bug regressions in their owning component. Across regression, render a screen at most once
  per mode with all checks together; a second mode requires its own custom template. No regression screen sweeps,
  role×mode matrices, screenshot baselines or duplicate golden paths. Additional full journeys/access/phone walks
  belong in acceptance, named by activity before being written. Reuse the existing Products browser golden path.
- Respect BOSS `test/budget`: **264 seconds server / 57 seconds client**; a regression spec over **15 seconds**
  fails. Remove duplication or move scenario coverage to acceptance; no budget increase is authorized. Observe
  Mantle's own current budget for rule changes there.
- Lint changed screens with `moqui lint --screens <report-file>`; the argument is an output file that is overwritten,
  never a screen path. Compare parse/idiom findings against baseline. Plan-only (Markdown) edits need no lint.
- A shared renderer/widget correction is framework work; follow the building skill, embedded asset regeneration
  and relevant generated/precompiled checks. Do not run framework specs, `cargo test` or `test-all` merely because
  application files changed.
- Keep review evidence under ignored `plans/ui-refinement-evidence/boss-products/` in the framework repository or a
  named equivalent outside tracked source. Inspect important before/after captures at the same data, geometry and
  theme; retain relevant DOM/console/network results, persisted outcomes and redacted output checks. No screenshots,
  credentials, private content or tokens are committed with the plan.
- Re-exercise affected activities after correction, including relevant recovery cases and a representative second
  consumer of shared changes. Distinguish tool limitations, missing prerequisites, reproduced baseline failures and
  product defects. A silent skip or historical result cannot close coverage.

## 6. Coverage, findings and running record

### Activity coverage ledger

**Pending** means not reviewed; **inspected** means source/render/visual inspection only; **exercised** means steps
executed with an explicit pass/fail/partial outcome; **blocked** means a missing prerequisite; **deferred** means
deliberately postponed with reason and follow-up. Exercised does not itself mean passed. Use `exercised / partial`
with named continuations for partly executed activities. Blocked/deferred coverage remains unresolved. Source
research for this plan does not advance live coverage. Record actual modes and recovery gaps, not just a test name.

| Activity | Status | Outcome / recovery / mode gaps | Evidence / findings |
| --- | --- | --- | --- |
| PRD-01 — Workday/find | exercised / partial | Home/create/detail navigation; dark desktop and 390px; actual embedded-TUI keyboard launch. Saved finds, exports and shell recovery continue | PRD-UI-001; batch 1 |
| PRD-02 — Create/clone/lifecycle | exercised / partial | Created/activated disposable draft; canceled activation; duplicate-ID recovery retained input; identifier/party golden path passed. Clone/delete/obsolete continuations remain | batch 1 |
| PRD-03 — Master record | exercised / partial | Summary/header and standalone identifiers/parties exercised; operational tabs incorrectly advertised. Remaining master tabs and continuations PRD-07, 11–16, 18 stay open | PRD-UI-002; batch 1 |
| PRD-04 — Categories | exercised / partial | Created category; moved one dated edge, retained second parent/tree occurrence; keyboard move cancellation observed. Delete/cycle and content continuation remain | batch 2 |
| PRD-05 — Features/groups | exercised / partial | Created feature/group and saved membership through UI. Interaction/refusal/delete cases remain | batch 2 |
| PRD-06 — Variants | exercised / partial | Browser preview/generate/durable resume and settings limit exercised; mounted response-order recovery verified. Standard fallback works; actual TUI operations remain | PRD-UI-003, 008; batch 2 |
| PRD-07 — Sales prices/bulk | pending | Not executed | — |
| PRD-08 — Price lists/rules | pending | Not executed; output PRD-10 | — |
| PRD-09 — Explain/history | pending | Not executed; cost basis/margin PRD-14/15 | — |
| PRD-10 — Price outputs | pending | Not executed; supplier-offer output PRD-11 | — |
| PRD-11 — Supplier offers | pending | Not executed | — |
| PRD-12 — Stock/policy | pending | Not executed | — |
| PRD-13 — Methods | pending | Not executed; cost basis PRD-14 | — |
| PRD-14 — Cost roll-up | pending | Not executed; saved draft continues PRD-15 | — |
| PRD-15 — Standard/finance handoff | pending | Not executed; posting scope/prerequisites unresolved | — |
| PRD-16 — Documents/files/Chatter | pending | Not executed | — |
| PRD-17 — Translations | pending | Not executed | — |
| PRD-18 — Units/packs/scans | pending | Not executed; labels PRD-19 | — |
| PRD-19 — Labels | pending | Not executed; printer availability unresolved | — |
| PRD-20 — Import/resume | pending | Not executed | — |
| PRD-21 — Catalog checks | pending | Not executed | — |
| PRD-22 — Settings/consumers | pending | Not executed; consumers in PRD-02, 06–09, 15, 18–21 | — |
| PRD-23 — Access/scope | pending | Not executed | — |
| PRD-24 — Cross-app/modes | pending | Not executed | — |

### Findings register

Assign finding IDs only after reproducing an issue or making an explicit design judgment. Record severity,
actor/activity step, route, theme/measured geometry, reproduction, observed impact,
evidence, owning component, correction and retest, in the same columns the Projects and drawers reviews use. Kind is
observed, mounted reproduction, measured or source-confirmed. P1 blocks work, exposes restricted data or makes
essential information unusable; P2 materially misleads or impedes work; P3 is a localized refinement. Keep static
leads separate until investigated.

| ID / kind / severity | Activity and step | Route, actor, theme / viewport / input | Reproduction and impact | Evidence | Owner | Correction / decision | Retest / remaining gap |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PRD-UI-001 / observed / P3 | PRD-01 Home card | catalog.edit; Material light/dark 1920×1080, dark 390×844; TUI keyboard | Ending-in-30-days title clipped at desktop; meaning and timestamp zone unclear | Home CUA captures; screens-batch1.txt | BOSS | Shortened to Ending soon, visible sales-discontinuation explanation and zone | Browser dark phone and live TUI show complete label/caption; desktop light capture follows |
| PRD-UI-002 / observed / P2 | PRD-03, 23–24 Product360 navigation | catalog.edit; ordinary asset; Material dark 1920×1080 | Replenishment/Purchase history and type-inapplicable tabs appear; clicking Replenishment reaches Screen not found | CUA observation on disposable UI_PRD_20261109 | Framework menu | Investigating shared child-condition evaluation | Open; direct route refused, no unauthorized read observed |
| PRD-UI-003 / mounted reproduction / P2 | PRD-06 preview/generate/batch | Actual VariantBuilder QVue on native offline client | Delayed success/failure/finally overwrites replacement source/operation; confirmation submits changed selection; unmount continuation requests destination route | variant-responses-before/after; four failing baseline cases | BOSS | Captured source/path/request ownership, confirmation snapshot and disposal; clears stale operation/results | Four focused mounted regressions pass; browser variant walk 2/2 |
| PRD-UI-008 / observed / P2 | PRD-06 Standard entry | catalog.edit; /apps variant builder | Authored HTML fallback unreachable because html was excluded; HTTP 404 | products-standard-variant-fallback.log | BOSS | Admit existing HTML fallback and encode product context with sri URL builder | Native request 200 plus targeted HTML regression; no new workflow |
| PRD-UI-009 / mounted reproduction / P3 | PRD-03 bulk action visibility | catalog.price.edit; Products list | Price-only editor sees Category/Feature bulk controls despite lacking catalog edit; services still refuse writes | products-narrow-actions local evidence | Framework/BOSS | Open at requested pause; per-action condition support was assessed but no implementation started | Do not count as corrected |

### Static leads

These are source observations/questions, not confirmed interactive defects or passed coverage. Reproduce each in an
authorized batch, then allocate a finding or close the lead with the reason.

| Lead | Source | Activity | Investigation / priority |
| --- | --- | --- | --- |
| Shared-context documentation drift | `docs/ProductsSharedScreens.md`, impl-products §7; `service/ironstone/products/SharedContext.js` | PRD-23–24 | Notes say only Products is implemented; current context branches and the Accounting presentation are broader. Reconcile current consumers and update the affected documentation with decided behavior |
| Variant Standard fallback | `VariantBuilder.xml:15, 57` | PRD-06, 24 | Declares `vue,qvue,tui` but authors an `html,qvt` link. Verify actual mode reachability; Projects found a similar mismatch (PR-UI-034) |
| Repeated row-dialog identity | Product360 `EditCategories`, `EditFeatures`, `EditIdentifiers`, `EditDimensions`, `EditAssociations`, `EditParties`, `EditKitComponents`, `EditEquipment`; impl-products F43 (row-menu `container-dialog`, never re-checked) | PRD-03–05 | Exercise two rows, reload and static QVT behavior before classifying |
| Standalone tab actions | impl-products F44 | PRD-03, 24 | A parent's `always-actions` run for a standalone tab render but its `actions` do not. Reload Product360 tabs and open them in the terminal |
| Variant asynchronous ownership | `VariantBuilder.qvue` preview/batch handlers | PRD-06 | Shared state is updated after awaited requests without an obvious request-generation guard. Reproduce source/axis/operation changes and late success/failure before deciding whether correction is needed |
| Newer shared tabs and inherited transitions | `Product360/PaidAccess.xml`; `Product360.xml:16, 44`; `Supplier360.xml:16, 69-73`; `InventoryValuation.xml:52-55` | PRD-23–24 | PaidAccess is read-only in Products but shares a mutation-bearing source with Commerce; owning-app transitions and a declared `appRoot` parameter reach Products routes. Check controls, direct calls and forged context |
| Warehouse-only Stock tabs | `InventoryAvailability/Locations.xml:25`, `Movements.xml:21`, `Reservations.xml:20` | PRD-12, 23 | Hidden in Products by `appRoot`; earlier plan text assumed them. Confirm the visible set and direct-route refusal |
| No Products Assist prompt | `Products.xml` (none); `Admin.xml:54` for comparison | PRD-24 | Assist gets only generic page context in Products. Record observed behavior; adding a prompt is a separate design decision |
| Demo price-date rollover | `BossProductsDemoData.xml:37-38` | PRD-01, 07–10 | `BOSS_PRICE_SALES` ends 2026-11-15. Prepare execution-relative rows rather than relying on demo dates |
| Historical output evidence | impl-products F45 and older notes | PRD-10, 15–16, 19 | Old notes include PDF failures, later passes, removed shots and broad render counts. Establish current capability and inspect actual outputs; do not carry either old outcome forward |

### Bounded batch record

**Planning baseline, 2026-11-09:** read the Projects pattern, document convention, application/style/review guidance,
Products design/implementation/research, current screen mounts/context code, demo roles and test registrations.
Two delegated source audits covered inventory and activities/tests. Produced this plan only. No runtime, browser,
database, build, test, acceptance fixture or application mutation was used. Document validation and independent
plan review confirmed 44 local XML definitions, 74 Shared sources, the 18/1 regression and 8/15 acceptance file
counts, current spec references, relative links and the 24-activity pending ledger. Corrected review comments on
feature-list wording, supplier attachments and product-specific tracking authority; added explicit stale-cost,
packaging-history and lifecycle-continuity checks. All live coverage remains pending.

**Document review, 2026-11-09:** three read-only audits rechecked the plan against current source, demo data, test
suites, design/implementation records and the executed Projects review. Corrected PRD-12's Stock tabs (Locations,
Movements and Reservations are Warehouse-only), the absent Products Assist prompt and Home-panel catalog tasks, the
`catalog.admin` and `catalog.method.resource` grants, the Services/Retail cost-role alignment, fixture IDs and
base-demo kit/equipment/digital sources, the Settings consumer list and the PRD-03/10/11 continuations. Added built
functionality the activities missed (Home cards and saved finds, list export and bulk actions, deletes, tags,
association semantics, notifications, explanation output, supplier output, multi-file upload, IdentifierTest),
inherited owning-app transitions and forged `appRoot` for PRD-23, Projects' defect classes and environment lessons,
the price-date rollover, further Mantle specs, and the Projects findings/leads table format. No runtime, test or
application change; all live coverage remains pending.

**Batch 1, 2026-11-09 — baseline and catalog workday:** coordinator plus three delegated workers; clean starting
revisions framework `7d4027eb`, BOSS `9622bd4c`, Mantle `05d33505`, existing release binary. Disposable Mantle+BOSS
bootstrap and actual runner runtime are recorded in ignored `boss-products/environment.json`; local HTTP port 57820,
primary browser identity `products-review.localhost`. The sandbox refused Postgres shared memory; the host-permission
retry loaded all six explicitly selected Products fixture features (6/6). Keep all database runners at the same host
process visibility; sandboxed stale-process checks cannot reliably identify the host's live review processes.

Created/activated `UI_PRD_20261109` as catalog.edit through visible controls, tested canceled activation and observed
persisted status/history. Existing ProductsWalk covered create/activate/identifier/party-code navigation (1/1, 6.97s);
a disposable native-client duplicate-ID check retained both submitted ID and name (1/1). Home measured 1920×1080
(DPR 1, visual scale 1) and 390×844, light/dark; actual embedded terminal opened with keyboard Tab/Enter and rendered
Products Home. Corrected the source-confirmed discontinuation/price-expiry documentation drift and PRD-UI-001. Source
review found no need to change NewProduct recovery. PRD-UI-002 remains open for the shared-menu batch.

Checks before this batch commit: ProductsCatalog/ProductsTaxonomy/ProductsVariants 29/29 (3.9s feature time); ProductsWalk
1/1; screen lint 1,280 files, zero parse failures, 87 existing idiom/hazard sites and no new Home site. Coordinator
reviewed the small Home change. Full framework/apps gates are explicitly deferred until the end of all seven waves.
No live activity is closed by these bounded checks; the ledger names the remaining continuations.

**Batch 2, 2026-11-09 — taxonomy and variants:** fixed PRD-UI-003 and PRD-UI-008 after failing baseline
reproductions. Actual QVue deferred-response checks cover obsolete success/failure/cleanup, confirmation source
replacement, operation-key replacement and unmount. The existing local request-ownership pattern was reused; no shared
API was introduced. Standard's authored fallback is now reachable and encodes the product context.

Checks: ProductsCatalog/Taxonomy/Variants 29/29; updated ProductsVariants 9/9 (2.1s feature time), offline
ProductsVariantResponses 4/4 (2.7s), authorized ProductsTaxonomyWalk/ProductsVariantWalk 3/3, native Standard request
1/1. Screen lint has zero parse failures. Coordinator and pricing/engineering peers reviewed the changes without
blocking findings. Actual terminal variant selection/generation and remaining taxonomy recovery cases stay open.
ProductsVariantWalk changed the disposable Services variant batch limit from 1000 to 100; the entire disposable
runtime is retained separately at pause. PRD-UI-009 was reproduced but not implemented before the requested pause.

For later batches record the exact scope/identities, source/binary/runtime baseline, observations, finding IDs,
changed behavior/files, checks and results, same-state before/after evidence, remaining recovery/mode gaps and cleanup.
Keep full-gate status and any explicitly changed cadence visible. Do not append an unbounded transcript or repeat
entire test logs here.

### Completion

An activity passes only after its intended outcome and relevant recovery paths are observed. A blocked/deferred
disposition can end work for a bounded batch but cannot count as passed coverage. A render, source inspection or
automated test pass alone does not prove usability. Close a wave when its mapped surfaces have outcomes, findings
are corrected/retested or explicitly deferred, and required checks for its changes have passed.

The final review record includes changed behavior, route/activity/mode coverage, resolved/open findings, verification,
selected evidence, compatibility decisions and cleanup. Retain unsampled variants honestly. Update design and
implementation notes when decided behavior changes, keep Products-specific findings here, and feed reusable patterns
into the framework review guide. An accurate, reviewable plan does not close any live activity.

## 7. Decisions

- **Execution authorization (2026-11-09):** all 24 activities and seven waves, with three workers: catalog/variants
  (PRD-01–06), pricing/content/tools (PRD-07–11, 16–22), and engineering/access (PRD-12–15, 23–24). The coordinator
  owns browser/terminal observation, runtime lifecycle, shared integration and commits. Review and run focused
  regression/lint checks before each local batch commit; run `./moq test-framework` and `./moq test-apps` only at the
  end. The user reviews along the way and pushes at the end; no push is authorized here. Focused existing Products
  acceptance walks and their six named fixture specs are authorized; no unrelated acceptance sweep. Adding/changing
  an acceptance test still requires that test and its component's acceptance suite. One disposable local revaluation
  posting is authorized with persisted inventory/ledger and idempotency checks. Labels use local PDF/output only.
- **Scope:** current Products workflows, hidden helpers, actual shared mounts, outputs and bounded handoffs;
  no absent-feature implementation or complete adjacent-app review.
- **Inventory authority:** current sources/policies decide what is reachable. Count physical inherited sources
  separately from admitted tabs and record the documented design differences explicitly.
- **Sequence:** seven waves, 24 activities, positive/negative pairs from the start and explicit cross-wave continuations.
- **Status:** §6 is the activity ledger; every live outcome is pending. Source research and old test results do not
  establish a pass. Mode and recovery gaps remain named after partial execution.
- **Modes:** Material is the visual target; TUI gets actual supported operations and Standard brief functional/output
  or fallback checks. Measure viewport and real zoom instead of assuming the tools honored a request.
- **Permissions:** catalog, sale/purchase pricing, costs, methods, facility policy, global units and finance remain
  separate. Use narrow identities, owner/facility scope and response/output checks.
- **Shared causes:** correct in BOSS, Mantle or framework according to ownership and retest a representative consumer.
- **Verification:** retain the existing Products golden path, suite boundaries and budgets; no new screenshot or
  duplicate sweep suite. The current user-supplied before-commit rules apply unless explicitly superseded later.
- **Fixtures:** isolated Mantle+BOSS runtime, matching owner/date fixtures, local outputs and safe print destination;
  existing acceptance fixtures are not an automatic bootstrap authorization.

### Open at execution setup

- **Bootstrap:** select a suitable binary and explicit demo/fixture setup without silently running acceptance.
  Only add narrowly missing roles/data.
- **Cost-role alignment:** decide whether to prepare a Retail estimator/approver pair for manufactured roll-up or
  record the composed `catalog.method.walk` limit; the narrow cost roles are Services users.
- **Execution dates:** record the as-of date and zone and prepare price rows relative to it; the demo price change on
  2026-11-15 shifts current/future prices and expiring notices. The Home Ending-in-30-days count is separately based on
  product sales discontinuation dates.
- **Mark items here *(resolved)* as they are decided, with the decision.**
- **Tool capability:** measure browser dimensions/zoom and terminal interaction; verify PDF/content resource support
  and whether a safe printer is available. Leave unsupported variants explicit.
- **Finance extent:** choose whether PRD-15 stops at an inspected revaluation preview/cancel or includes an actual
  posting in the disposable database as the inventory accountant; record the choice and required accounts/periods.
- **Automation selection:** identify existing acceptance specs the next execution request actually asks to run.
  The map in §5 is available coverage, not a default command to run all of it.
