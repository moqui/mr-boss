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

**Status: bounded follow-up completed with three subagents, 2026-11-10 America/Chicago.**
Observed outcomes and explicit unverified recovery/mode branches are recorded in §6; partial coverage is not a pass. Execution scope, workers, commit cadence, authorized acceptance specs and
gate timing are recorded in §7. Historical Products implementation results and existing tests are inputs, not
evidence of this review's outcomes.

### Inputs and reference patterns

- [Products design](design-products.md), [implementation](impl-products.md) and [research](research-products.md):
  intended workflows, delivered functionality, prior findings and deferrals.
- [Projects review](ui-review-projects.md), [drawers, Commons and Comms review](ui-review-drawers-commons.md),
  [framework UI review guide](../../../../../docs/dev/UI-Review.md) and
  [framework review](../../../../../plans/archive/UI-Refinement.md): activity/evidence method and established refinements.
- [Application practices](../../../../../docs/dev/Practices-App-Dev.md), [style guide](style-guide.md),
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

For later execution, follow the [review guide](../../../../../docs/dev/UI-Review.md), repository building/testing skills
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
| mr-boss acceptance `test/acceptance/Products/` | ProductsScreens, ProductsTaxonomyScreens, ProductsVariantScreens, ProductsPriceScreens | Existing render coverage, including selected custom modes; source/render support, not browser or terminal interaction |
| mr-boss acceptance `test/acceptance/Products/` | ProductsPriceFixtures, ProductsInventoryFixtures, ProductsToolsFixtures, ProductsImportFixtures | Acceptance setup, not an incidental authorized bootstrap |
| mr-boss acceptance `test/acceptance/client/Products/` | ProductsTaxonomyWalk, ProductsVariantWalk | PRD-04–06; VariantBuilderTui is opened in a browser, not a live terminal |
| mr-boss acceptance `test/acceptance/client/Products/` | ProductsPriceWalk, ProductsPriceListWalk, ProductsSupplierWalk | PRD-07–11 |
| mr-boss acceptance `test/acceptance/client/Products/` | ProductsInventoryWalk, ProductsMethodWalk, ProductsCostWalk | PRD-12–15; method walk uses a composed role; cost walk covers a purchased estimate, independent approval and revaluation, not every manufacturing roll-up variant |
| mr-boss acceptance `test/acceptance/client/Products/` | ProductsDocumentWalk, ProductsToolsWalk | PRD-16–19; actual current assertions determine output/translation extent |
| mr-boss acceptance `test/acceptance/client/Products/` | ProductsImportWalk, ProductsChecks, ProductsCatalogSettings, ProductsFinish | PRD-20–22, outputs and cross-cutting finish checks |
| mr-boss acceptance `test/acceptance/client/Products/` | ProductsPhone | 390px labels/checks/import/variant-list samples and five pricing dialogs at 1280px; the variant list and dialogs run as ADMIN `john.doe`; not app-wide phone or least-privilege coverage |
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
| webroot acceptance `test/acceptance/client/` | ThemeLayout | Existing home for reusable theme/geometry checks, not permission to run it without authorization |

There are **18 Products server regression files**, **one Products browser regression golden path**, **eight Products
server acceptance files** (four render specs and four fixture specs) and **15 registered Products browser acceptance
specs**. `ProductsChecks` and `ProductsFinish` exist both in `test/Products/` and in `test/acceptance/client/Products/`, so
say which suite a `--spec` run means. `test/client/suite.js` registers ProductsWalk; `test/acceptance/client/suite.js` registers the other 15 and requests
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

- Read the [testing skill](../../../../../.agents/skills/testing/SKILL.md) before writing/running tests. Commands run
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
| PRD-01 — Workday/find | exercised | Existing Home/find, saved-find create/default/update/apply/delete, no-match/reset, future-discontinuation Home0→1→0 and correct card destination retained. Native List/Board preserved page2 identities; paging changed records; Owner-column save/reload and default reset passed. General filtered CSV/XLSX each contained all 9 matching owned rows across pages; 201 matches now give named HTTP500 refusals and no partial download. There is no selected-only export option or header sort control; the existing modified-descending query parameter was observed. Light/dark,390px and actual terminal Home are recorded separately. 200% zoom is user-excluded. | 001,014,027; earlier saved-find/ending-soon records; followup-catalog list-views, export-after, export-overflow-final, catalog-final-restore; followup-20261110 terminal receipts |
| PRD-02 — Create/clone/lifecycle | exercised | Existing create/activate/cancel, duplicate-ID retained input, selected clone/cancel, unused-draft delete/cancel/reload and Discontinued/Obsolete master edits retained. Actual used-product delete refused with its named unused-draft condition and preserved BOSS_PRD_OWN. The same valid quantity/amount payload added an active product to a disposable OPEN order and refused the obsolete child with PrdObsolete. No new approval, shipment or posting occurred. This receipt adds a browser/native lifecycle recovery, not a complete lifecycle walk in every mode. Actual terminal create, activation Cancel/Confirm and description saves through Active→Discontinued→Obsolete passed; Obsolete has no Activate. | batch1 and products-catalog-resume clone/delete/discontinued/obsolete; followup-catalog lifecycle-final; followup-20261110 terminal receipts |
| PRD-03 — Master record | exercised | Existing Summary/header, identifier/party-code, Equivalent outgoing/incoming and dedicated-editor-refusal observations retained. Two distinct equipment-meter, kit-component and dimension rows were edited through their own dialogs and reloaded with separate persisted values; no identity crossover. Earlier actual terminal SKU/Other dialogs showed their own values and canceled unchanged. The new row-family results are native browser observations; other modes are not inferred from them. Connections' per-type 25-record display limit remains a documented capability limit. Actual terminal kit component changed3→4, reloaded, then restored3; the other component stayed5. | 002,009; earlier identifiers/association evidence; followup-catalog equipment, kit, dimensions-final; followup-20261110 terminal receipts |
| PRD-04 — Categories | exercised | Existing dated-edge move preserved the second parent and both tree occurrences; keyboard move cancellation, unused-category delete and content entry passed. The actual cycle attempt retained submitted input and left both parent-edge arrays unchanged after its named refusal.  Actual terminal category description save retained input on the fixture’s missing-type refusal; choosing Catalog corrected it and reload preserved the description. | taxonomy walk; products-catalog-resume category-delete and category-cycle; category content-entry evidence; followup-20261110 terminal receipts |
| PRD-05 — Features/groups | exercised | Existing feature/group create, dated membership, unused deletion, inline Fabric axis, scoped dependency correction and Compatible/eight-combination recovery retained. Native A→B/B→C dependencies followed by incompatible A↔C refused the contradictory rule, retained quantity 2 and persisted only the two valid rules. Actual deletion of used BOSS_VAR_BLUE named ProductFeatureAppl and preserved the master. This establishes used-feature refusal; it does not claim an additional used-group deletion or every terminal editor. Actual terminal feature abbreviation TUI saved and reloaded. | taxonomy/interaction/three-axis records; followup-catalog features-green; followup-20261110 terminal receipts |
| PRD-06 — Variants | exercised | Existing preview/selected generation, durable resume, three-axis matrix/list/390px, stale source/confirmation/operation ownership and safe existing repeat retained. Native four-choice selection at temporary limit 2 was disabled; the valid direct overlimit request now returns named JSON 500. Queue processing reproduced an unrelated-ID collision; failed-item retry after removal of the unused blocker finished4 created / 0 failed / 0 pending. Selected description/stock unit copied while unselected comments stayed blank. Revoking the isolated editor after load produced a named inline 403 and preserved 4 pending; restoring its grant resumed the same operation to4 existing / 0 pending. Policy 1000 and grant restored. Prior actual TUI generation/type picker and Standard fallback remain separately observed modes. | 003,008,019,020,029,032; followup-catalog variant-queue-collision, variant-finish, variant-errors-after, variant-permission-after, catalog-final-restore;7 mounted response cases; followup-20261110 terminal receipts |
| PRD-07 — Sales prices/bulk | exercised | Current/future/expired boundaries in two zones, distinct change/expiry notices and permitted recipients, invalid input retention, stale→one reload→save, bulk preview/cancel/unconfirmed/stale no-write passed. Actual Standard fractional create 12.50→correct 12.75 now persists with one original-date parameter.  Actual terminal fractional correction12.50→12.75 saved and reloaded. | Prior pricing-recovery/dates; 031, 033; `followup/standard-final`, `followup-standard-final.log`; followup-20261110 terminal receipts |
| PRD-08 — Price lists/rules | exercised | Create/rule/publish and publication Cancel/stale recovery passed. New customer-scoped product/category/feature/all rules demonstrate quantity/date/sequence winners, percentage→amount→rounding→bounds (22.10/16.60/50); Standard resolves the unclassified-product fallback to 99. Invalid rule range retains input then saves after correction; duplicate effective sequence names its refusal.  | Prior list-recovery; `followup/rules`, `followup-rules.log`, `followup/standard-final`; followup-20261110 terminal receipts |
| PRD-09 — Explain/history | exercised | Permitted direction/currency defaults, history/chart/provenance, actual trace CSV, and separate cost-holder margin/price-only omission checks passed. Material dated trace and Standard changed-quantity result 22.10 expose the same rounding/bounds steps. Trace displays source IDs; source-link navigation was not observed in this follow-up.  Actual terminal quantity12 calculated22.10 with rule100158 and percent/amount/round/bounds trace; quantity2 recalculated16.60. | 004, 022; prior margin evidence; `followup/rules/Competing-rule-dated-trace.csv`, `followup/standard-final`; followup-20261110 terminal receipts |
| PRD-10 — Price outputs | exercised | Prior actual CSV/XLSX/HTML/PDF scope, blank missing prices, independent failure, denied reader and named item limit checks remain. New actual 70-row PDF has four A4-landscape pages (15/24/24/7 rows), repeated headers, all 70 unique IDs and no clipped/lost rows. Isolated renderer startup failure returns a named HTML 500 for PDF while HTML output remains 200; restoring the renderer makes the same explicit request produce an inspected 7.25 USD PDF. | 010; `followup/multipage`, `followup-multipage.log`, `followup/renderer-fault`, `followup/renderer-recovery`; followup-20261110 terminal receipts |
| PRD-11 — Supplier offers | exercised | Invalid-retain→correct→schedule/end, Cancel/Confirm, buyer/owner/direction refusals and actual scoped outputs remain verified. Standard fractional create 4.50→correct 4.75 persists in Services buyer context with the same supplier code.  Actual terminal supplier correction4.75→4.85 saved and reloaded with the same code/minimum3. | 010, 031; prior supplier-recovery/output; `followup/standard-final`, `followup-standard-final.log`; followup-20261110 terminal receipts |
| PRD-12 — Stock/policy | exercised | Policy/tracking save/reload, three projection horizons and scoped kit ATP=3 passed. Standard Summary/Projection/Policy returned the owned product without foreign stock. Cancel and invalid minimum preserved input/no rows; corrected 2/5/3 policy survived loss of facility scope, with facility owner restored. Products Movements/Reservations direct routes omit operational content; real Warehouse routes show the owning views. Coordinator observed actual terminal 15 on-hand / 12 ATP / 3 held, three projected quantities of 12, and policy 9→10→9 with reloads. Remaining stock permutations unsampled. Actual terminal nested tabs are visible after026. | 007, 016, 026; stock-kit/projection; followup-standard-stock-finance, followup-stock-recovery, followup-boundaries; coordinator terminal receipt; followup-20261110 terminal receipts |
| PRD-13 — Methods | exercised | Import/revise/release method/routing walk passed. Equipment and skill requirements persisted with quantities; negative quantity refused while retaining the draft. Saved draft/released operation readback now names both resources and counts, with durations only for authorized viewers. Actual Products and Manufacturing editor/reader counterparts passed; 390px retains two columns and has no page overflow. Minute-based routing was consumed by the costing lot. Remaining resource/type and terminal edit permutations unsampled. Actual terminal BOM Alt2→Explosion and Alt5→WhereUsed verify shared nested menus in a second consumer. A disposable terminal routing approval reproduced035 and, after correction, Save/F5 showed the new operation without a fresh Go; authority/error/historical reads are retained. | 028, 035; method walk; followup-routing-resources/readback-after/manufacturing-resources/routing-phone; ProductsMethods 21/21; followup-20261110 terminal receipts |
| PRD-14 — Cost roll-up | exercised | Purchased and manufactured roll-ups passed: main 146.25, materials 101.25, by-product allocation 48.75, substock 11 and raw 4. Changed efficiency refused stale save/no extra draft and was restored to 100. A 500g and 0.5kg lot both gave USD2.00; temporary dated USD→EUR 0.8 gave EUR1.60, while incompatible units and missing FX were named. Minute routing reconciled material16 + labor18 + machine4.50 + overhead2.25 = USD40.75. New calculations remained previews with no stock/GL rows. Remaining basis/mode permutations unsampled. Separate Retail estimator’s actual terminal quantity4 preview reconciled40.75USD (material16/labor18/machine4.50/overhead2.25); no draft save. | manufactured-review; followup-rollup-unit-currency, followup-minute-cost-components; separate estimator/approver; followup-20261110 terminal receipts |
| PRD-15 — Standard/finance handoff | exercised | Independent standard approvals and PDF outputs passed. Revaluation Cancel/stale preview wrote nothing; exactly one authorized disposable post changed unit cost10→8 at unchanged quantity5, balanced ledger10/10, and identical retry created no extra event. Manufactured approval created zero stock/GL events. Standard valuation denies cost-read-only and permits the GL holder with Preview available. No further post was invoked; additional postings intentionally excluded.  Actual terminal GL-holder preview showed quantity5, current/forward cost8 and0USD adjustment; no additional Post. | finance-recovery/outcome; manufactured-review; followup-standard-stock-finance; followup-20261110 terminal receipts |
| PRD-16 — Documents/files/Chatter | exercised | Version compare, restore Cancel→new version, conflict draft, exact current/version/draft bytes, category/inherited content, generic supplier attachment and note/edit/reply/follow/files remain verified. Actual managed three-file upload preserves two successes and names the empty-file failure; retrying only the corrected failed file yields three resources. Successful original downloads retain exact content. TUI upload delegates to the browser; actual terminal document readback shows the record-files browser-only boundary; terminal version editing is not claimed. | 005, 012, 024; prior content recovery; `followup/content`, `followup-content.log`; followup-20261110 terminal receipts |
| PRD-17 — Translations | exercised | Scoped locale choices, source review state, stale draft→one reload→Unicode save, explicit clear and invalid locale remain verified. Category target Cancel does not write; Unicode target saves. Identical locale names the refusal and retains text; missing source returns a named refusal.  Actual terminal category Unicode translation appended a terminal note, saved and reloaded. | 005, 023; prior translation recovery; `followup/content`, `followup-content.log`; followup-20261110 terminal receipts |
| PRD-18 — Units/packs/scans | exercised | Dated definitions, incompatible/stale/canceled edits and scoped identifier/unit boundaries remain verified. Actual keyboard Enter resolves the changed pack factor 18. An explicitly seeded historical receipt snapshot (entered 2, factor 12, base 24) and its asset remain byte-for-byte/stamp unchanged after the actual packaging edit 12→18; AssetDetail/GL entries stay zero. This is fixture-based historical preservation, not execution of a receiving/issuing workflow.  Actual terminal identifier input plus Enter resolved the changed pack to18Each. | Prior tools/pack recovery; `followup/pack`, `followup-pack.log`; followup-20261110 terminal receipts |
| PRD-19 — Labels | exercised | Both approved local layouts have actual inspected PDFs: two 50×30 mm QR copies and one 100×60 mm Code128 copy, correct page counts/geometry and readable pack/base context. Independent decoding of the actual PDF raster images returns the selected codes. Invalid/stale preparation refusals remain verified. Renderer startup failure retains a named retryable job; restoring it renders the exact same job/fingerprint/request with count 17→17 and byte-identical repeated PDF download. Unrendered and other-actor HTML resource navigation now name errors; the prior authorized PDF bytes remain unchanged. No physical printing/delivery was executed. Actual terminal rendered-job readback displayed QR, existing code, pack/base,18Each and2copies; no device send. | 030; `followup/labels`, `followup/label-download-after`, `followup/renderer-fault`, `followup/renderer-recovery`; followup-20261110 terminal receipts |
| PRD-20 — Import/resume | exercised | Actual UTF8 quoted upload, durable mapping and partial apply→correct failed row→resume passed, as did sales/supplier kinds and opposite-role refusals. A real edit grant revoked after validated preview refused Apply/Confirm with a named authority error and no Product; restored membership allowed the same run to apply one row once. Over-2MiB, over-5000-row and malformed UTF8 inputs refused by name, followed by successful Unicode staging. Actor-private/stale/cancel/idempotency and CSV outputs passed earlier.  Actual terminal visibly delegates file upload to the browser; CSV paste staged one row with recognized ID/name mapping, without Apply. | 013, 029; resumed-import-file-retry/kinds; followup-import-revoked, followup-import-limits, followup-import-cleanup; followup-20261110 terminal receipts |
| PRD-21 — Catalog checks | exercised | Home/readiness/retry/rerun, filtered three errors / three issues, independent unavailable record while a known product continues, zero-issue results and severity-bearing CSV without Retry passed.  Remaining check/data/mode permutations unsampled. Actual terminal followed the issue’s product link, saved its missing name, and reran the same requiredFields check from1issue to0. | 011, 025; resumed-checks-recovery-after; followup-tui-check-fixture; followup-20261110 terminal receipts |
| PRD-22 — Settings/consumers | exercised | Existing four flags persisted/restored; stale/invalid currency refused. Isolated future EUR start, duplicate-start refusal, canceled JPY and changed GBP invalidating a prepared import→revalidate/apply passed; prior defaults restored. Variant/identifier/cost consumers sampled. Both Services/Retail batch limits are restored1000; other consumer permutations are unsampled. Actual terminal post-save historical-view/stale-token issue034 is corrected: successive Catalog true→false→true saves and Variant1000→999→1000 saves each reloaded current values without a fresh Go; all defaults/copy fields restored. | 034; settings-dated recovery; catalog settings/cost evidence; sibling and coordinator receipts; followup-20261110 terminal receipts |
| PRD-23 — Access/scope | exercised | Existing owner/store/facility omissions, valid-payload Products mutation refusals including forged appRoot, and actual owning-app positives retained. Live import and variant edit-grant revocation refused otherwise-valid reviewed work, preserved persisted state, and resumed the same operation after restoration. Forged Products Movements/Reservations returned parent-only pages without operational rows, while Warehouse holders received operational content; valuation repair refused without changing cost8/quantity5. Catalog-only choice helpers refused403 versus owning-app200/nonempty counterparts. Temporary grants restored; no role/route matrix inferred. | 006,007,015–017,024,029,032; existing boundaries/paired bytes; followup-catalog variant-permission-after; followup-engineering followup-import-revoked and followup-boundaries; followup-20261110 terminal receipts |
| PRD-24 — Cross-app/modes | exercised | Admin settings/Health and Insights report/attention destinations and one-Back returns now observed, including exact Health origin; catalog-only Insights refused. Shared Chatter/translation and Manufacturing routing readback provided second-consumer checks; Manufacturing reader saw resource identities while durations stayed omitted. Native row dialogs and created-child opening preserved identity; CSV/XLSX bytes/errors were inspected. Brief Standard stock/output and finance authority counterparts passed; prior terminal variants and Standard twin are separately observed.  200% zoom is user-excluded. Current actual terminal lifecycle, kit row, stock/policy, BOM tabs, pricing, supplier, cost/finance previews, translations, scan, labels, import and checks are recorded in followup-20261110/tui-*.log; no unvisited mode is inferred. | 002,008,018,023,027–035; earlier history/terminal records; followup-engineering followup-health-back, followup-manufacturing-resources and followup-standard-stock-finance; followup-catalog receipt; followup-20261110 terminal receipts |

### Findings register

Assign finding IDs only after reproducing an issue or making an explicit design judgment. Record severity,
actor/activity step, route, theme/measured geometry, reproduction, observed impact,
evidence, owning component, correction and retest, in the same columns the Projects and drawers reviews use. Kind is
observed, mounted reproduction, measured or source-confirmed. P1 blocks work, exposes restricted data or makes
essential information unusable; P2 materially misleads or impedes work; P3 is a localized refinement. Keep static
leads separate until investigated.

| ID / kind / severity | Activity and step | Route, actor, theme / viewport / input | Reproduction and impact | Evidence | Owner | Correction / decision | Retest / remaining gap |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PRD-UI-001 / observed / P3 | PRD-01 Home card | catalog.edit; Material light/dark 1920×1080, dark 390×844; TUI keyboard | Ending-in-30-days title clipped at desktop; meaning and timestamp zone unclear | Home CUA captures; screens-batch1.txt | BOSS | Shortened to Ending soon, visible sales-discontinuation explanation and zone | Measured desktop light/dark captures, dark phone and live TUI show complete label/caption |
| PRD-UI-002 / observed / P2 | PRD-03, 23–24 Product360 navigation | catalog.edit; ordinary asset; Material dark 1920×1080 | Replenishment/Purchase history and type-inapplicable tabs appear; clicking Replenishment reaches Screen not found | CUA observation on disposable UI_PRD_20261109 | BOSS Product360 | The conditional-menu framework change departed from Moqui Java and was reverted. Product360 now draws its own tab bar from product360Tabs, narrowed once by product type, and the tab screens check that list | Fixed: the Product360 qvt and html renders list only admitted tabs; ProductsWalk clicks a tab in the browser |
| PRD-UI-003 / mounted reproduction / P2 | PRD-06 preview/generate/batch | Actual VariantBuilder QVue on native offline client | Delayed success/failure/finally overwrites replacement source/operation; confirmation submits changed selection; unmount continuation requests destination route | variant-responses-before/after; four failing baseline cases | BOSS | Captured source/path/request ownership, confirmation snapshot and disposal; clears stale operation/results | Six focused mounted regressions pass, including phone wrapping and departure before unmount; browser variant walk 2/2 |
| PRD-UI-004 / source-confirmed / P2 | PRD-09 initial history parameters | supplier-only reader; Services EUR pricing policy | Defaults selected unauthorized sales direction and hard-coded USD | ProductsPricing failing baseline and corrected regression; visual-evidence/ | BOSS | Choose permitted direction and dated organization currency, then user preference | ProductsPricing/Documents 33/33; pricing acceptance 8/8 |
| PRD-UI-005 / source-confirmed / P2 | PRD-16–17 locale choices/default | catalog reader, foreign owner, Commerce store-limited counterpart, ADMIN | Unscoped distinct locales disclosed foreign-content locale choices and influenced suggested target | ProductsDocuments failing baseline and corrected regression | Mantle/BOSS | Add two content-owner views; filter owner/store in SQL before distinct locale read | 33/33 pricing/document checks; document acceptance 2/2; bytes inspected |
| PRD-UI-006 / source-confirmed / P1 | PRD-23 paid-access read | Narrow catalog owner/store holders and foreign counterparts | Native read returned foreign digital-product terms without owner/store scope | ShopSubscriptions red/green regression | Mantle | Require readable catalog owner/shared master or an authorized store assortment | Full focused spec 16/16; direct Products normal/forged mutation refusal and actual Commerce positive counterpart pass |
| PRD-UI-007 / source-confirmed / P1 | PRD-12/23 Commerce stock | Store-limited staff; authorized and unassigned same-org facilities | Shared stock ignored Commerce facilityIds and returned unassigned stock/picker options | ProductsInventory red/green spec-local fixtures | BOSS | Honor Commerce server-derived facility scope | Inventory/SharedContext 20/20; inventory/method browser walks 3/3 |
| PRD-UI-008 / observed / P2 | PRD-06 Standard entry | catalog.edit; /apps variant builder | Authored HTML fallback unreachable because html was excluded; HTTP 404 | products-standard-variant-fallback.log | BOSS | Admit existing HTML fallback and encode product context with sri URL builder | Native request 200 plus targeted HTML regression; no new workflow |
| PRD-UI-009 / mounted reproduction / P3 | PRD-03 bulk action visibility | catalog.price.edit; Products list | Price-only editor sees Category/Feature bulk controls despite lacking catalog edit; services still refuse writes | products-narrow-actions local evidence | Framework/BOSS | Added optional per-action condition across QVT/static/TUI; Products gates actions and permitted price directions | Five renderer checks and three live editing-role counterparts pass; framework c7620238 |
| PRD-UI-010 / observed / P2 | PRD-07/11 CSV output | Sales/supplier price readers | Dated prices/offers export blank State and empty action-only columns | output-bytes/ before, output-bytes-after/ after; regression same-state capture | BOSS | Export state as text and omit History/Row Actions in CSV/XLSX | ProductsFinish/Suppliers 29/29; actual CSV contains Effective and omits controls |
| PRD-UI-011 / observed / P2 | PRD-21 severity-filtered checks | Reader; error filter | Three visible errors reported as four issues because one hidden warning remained in summary | resumed-check-severity-before/after | BOSS | Filter rows and displayed counts together in CheckContext; domain readiness unchanged | Focused red/green regression and live three-row/three-issue result |
| PRD-UI-012 / observed / P3 | PRD-16 collaboration editing | catalog.edit; product Chatter | Rich message, note, edit and reply fields had no accessible names | Chatter named-field baseline/after; primary actual note/follow/reload | BOSS Shared | Add localized existing editor labels | Checks/Chatter 33/33; native note/edit/reply/follow/two-file upload/reader-download pass |
| PRD-UI-013 / observed / P2 | PRD-20 results/sample refusal | Different authorized importer, unknown kind | Service refusal returned HTTP 200 with empty body rather than named failure | resumed import recovery and ProductsImport baseline | BOSS | Keep service invocation and error/CSV response in one script; return standard named JSON errors | ProductsImport 7/7; native holder CSV and refused actor/invalid kind checks pass |
| PRD-UI-014 / observed / P2 | PRD-01 find dialog | Catalog editor, pointer input | Find Options had no visible submit control, so filters could not be applied with pointer | products-catalog-resume/export-evidence | BOSS | Add conventional header-only Find action; keep export columns clean | Existing ProductsCatalog render assertion and actual find/no-match/reset/CSV/XLSX pass; e5059b5f |
| PRD-UI-015 / observed / P2 | PRD-23 Products PaidAccess mutation | Commerce holder with temporary Products read; normal/forged appRoot | Read-only Products mount accepted a native authorized Commerce mutation | paid-mount-before/after and ProductsSharedContext | BOSS | Require authoritative Commerce context before save | Holder/nonholder/forged calls refuse without data changes; actual Commerce call succeeds |
| PRD-UI-016 / observed / P2 | PRD-23 inherited stock-location mutation | ADMIN holder, forged Warehouse context | Products Stock/Locations accepted relocation despite excluded context | boundaries/ before/after plus persisted location | BOSS | Warehouse-only helper requires authoritative Warehouse context | Products refuses before mutation; actual Warehouse request moves disposable asset, then restored |
| PRD-UI-017 / observed / P2 | PRD-23 inherited supplier mutation | Purchasing holder, forged appRoot | Products Supplier360 accepted Purchasing supplier-approval submit | boundaries/ before/after; profile state | BOSS | Require Purchasing context on approval/invitation transitions; retain native permissions | Products unchanged, actual Purchasing route creates Pending; temporary profile restored |
| PRD-UI-018 / observed / P2 | PRD-24 cross-app Back | Admin/Insights holder, cold plain-anchor navigation | Shell mount pushed a duplicate current document entry; one Back stayed in Products | history-live.log; focused shell baseline 3 entries versus 2 | Framework | Preserve initial document entry; replace bare-shell preferred app instead of pushing | WebrootVue.qvt/shell 65/65 and actual Admin/Insights one-Back handoffs pass; 453483c0 |
| PRD-UI-019 / measured / P2 | PRD-06 three-axis phone preview | 390px viewport, 375px client area | Canonical three-feature keys widened page to 433px | three-axis phone before/after and real-CSS fixture | BOSS | Use shared wrap-anywhere utility, preserving full keys | Native page 433→375px; fixture 918→307px; six focused cases pass |
| PRD-UI-020 / observed / P3 | PRD-06 terminal child type | catalog.edit; actual TUI 1920×1080 | Blank type concealed the Asset default and offered ineligible Virtual children | products-catalog-resume/twin-type*; coordinator keyboard retest | BOSS | Resolve blank to Asset and filter Virtual from choices; retain invalid supplied values for refusal | ProductsVariants 10/10, native picker and actual terminal show Asset plus eight eligible types; two peer reviews |
| PRD-UI-021 / measured / P2 | PRD-07/11 ended status text | Material light, native computed colors | Ended chip/badge text contrast 3.97 | resumed-composited-contrast-{light,dark}[-after] and measurements JSON | Framework | Use existing muted text token for grey tonal chip/badge text | Actual price chip contrast 5.24; badge fixture parity, MoquiHtmlCss 10/10 and supplier workflow checked; da2e2766 |
| PRD-UI-022 / measured / P2 | PRD-07 focused field label | Material dark, native computed colors | Default focused label contrast 3.66 | resumed-composited-contrast-{light,dark}[-after] and measurements JSON | Framework | Use theme link token for default focused labels; preserve explicit and error colors | Actual contrast 7.61; errors and stroke retain passing contrast; MoquiHtmlCss 10/10; da2e2766 |
| PRD-UI-023 / observed / P2 | PRD-07/08/17 stale-edit recovery | Native Material sales/list and translation editors | Correct stale refusal retained the draft, but first real reload reused old hidden stamp/publication token/source revision and refused again | pricing-recovery payloads; content-tools recovery before/after | Framework | JSON failures no longer queue form parameters for a later page; ordinary redirect input recovery remains | Failing baseline regression; 45 render/transition checks pass with one existing ignored; actual single-reload sales/list and translation save/clear pass; two peer reviews |
| PRD-UI-024 / observed / P2 | PRD-16 denied/missing download | Catalog reader and narrow Retail holder, identical resource | Denied or missing managed document returned empty HTTP 200, hiding the named service refusal | content-entry-recovery paired downloaded bytes | BOSS | Invoke resource service and emit its named error or authorized bytes in one script | ProductsDocuments 20/20, native foreign/missing 500 and exact same-resource holder bytes 200; peer approved |
| PRD-UI-025 / observed / P2 | PRD-21 check CSV | Catalog reader; independent record failure plus known-product check | Severity blank and empty Retry action column exported | resumed-checks-recovery before/after actual CSV | BOSS | Plain severity outside custom modes; omit Retry from CSV/XLSX | ProductsChecks 7/7; native independent/empty/CSV 1/1 with error text and no Retry header; peer approved |
| PRD-UI-026 / observed / P2 | PRD-12/24 nested terminal tabs | Actual Stock terminal and BOM second consumer | Separate menu/active widgets omitted inner navigation | followup-20261110 tui-menu-before/after and tui-stock/method logs | Framework | Emit standard subscreens menu node; Active remains sole content owner | Red baseline;29 TUI tests pass; actual Alt2 Projection/Alt3 Policy, BOM Alt2 Explosion/Alt5 WhereUsed;8131c4fa |
| PRD-UI-027 / observed / P2 | PRD-01 filtered exports | Catalog editor; CSV/XLSX pages | Download silently stopped at current page | followup-catalog export-before/after/overflow-final | BOSS | Honor optional pageNoLimit within existing200 ceiling; larger find names narrowing guidance with500 |24 Catalog/Variants checks; final both-mode feature1/1; actual9-row files and201-match refusals;bec4c8d8 |
| PRD-UI-028 / observed / P2 | PRD-13 routing readback | Products/Manufacturing engineer and reader;390px | Saved equipment/skill requirements had no visible identity | followup-engineering routing-resource/readback/manufacturing/phone receipts | BOSS | Show scoped names/counts; gate duration, retain two mobile columns |21 Methods checks; actual draft/released resources and second consumer; no page overflow;5e4bca7b |
| PRD-UI-029 / observed / P2 | PRD-06 JSON action errors | Valid overlimit variant request | Failed no-response action returned empty200 | followup-catalog variant-errors; followup-20261110 json-none-before/after | Framework/BOSS regression | Serialize existing errors with standard500 only for failed JSON ResponseNone; successful empty response unchanged |45 passed/1existing ignored; valid generation counterpart and actual named500s;01eb58ff/7283de0b |
| PRD-UI-030 / observed / P2 | PRD-19 label resources | HTML navigation; unrendered own job/other actor | Failed download/printable returned empty200 | followup label-download-after and tools red/green | BOSS | Keep service and conditional resource/error response in one script |22 Tools checks; native1/1; authorized original PDF SHA256 unchanged;9d7dad42 |
| PRD-UI-031 / observed / P2 | PRD-07/11 Standard decimal entry | Actual Standard sales/supplier forms | Browser default number step1 refused fractional prices | followup/standard and followup/standard-final | Framework | Decimal number fields use step any; digits retain1 |ScreenHtml15/15; actual fractional sales and offer creates/corrections persist;8374226a |
| PRD-UI-032 / observed / P2 | PRD-06 revoked authority | Variant editor revoked after load | Structured HTTP403 displayed [object Object] | followup-catalog variant-permission-clean/after and mounted response red/green | BOSS | Normalize existing structured rejection at request boundary; keep ownership guards/state |7 mounted cases; actual named403 retains4pending, restored grant completes same operation;cb97664e |
| PRD-UI-033 / observed / P2 | PRD-07 Standard correction | Standard unreferenced sales price | Duplicate hidden start dates became an array and refused valid correction | followup standard-final; ProductsPricing red/green | BOSS | Keep one canonical hidden date; disable display auto-hidden duplicate |15 Pricing checks; Standard2/2 plus actual terminal12.50→12.75;98c86d78 |
| PRD-UI-034 / observed / P2 | PRD-22 terminal settings | Catalog administrator; consecutive saves | Successful save retained old as-of view/token; reload showed old policy and next save was stale | followup-20261110 tui-settings baseline/after; followup-engineering settings-redirect red/green | BOSS | Explicitly clear successful Catalog/Variant/Pricing response dates with supported empty-string expression |14 Catalog checks; actual Catalog/Variant consecutive saves and restored values;454e5092 |
| PRD-UI-035 / observed / P2 | PRD-13 terminal routing release | Approver on unused disposable routing100055 | Save/F5 showed prior released operation name; fresh Go showed persisted new release | followup-20261110 tui-routing; followup-engineering routing-redirect-lead | BOSS | Supported explicit empty-date expression on nine successful routing authoring responses |21 Methods checks; actual subsequent release/F5 shows new name,1released/0draft without fresh Go;0ccbe6b4 |

### Static leads

Source observations were investigated as bounded samples below. Resolved findings point to their evidence;
unverified branches remain explicit and do not count as passed coverage.

| Lead | Source | Activity | Investigation / disposition |
| --- | --- | --- | --- |
| Shared-context documentation drift | docs/ProductsSharedScreens.md; SharedContext.js | PRD-23–24 | Resolved: documentation now lists six implemented contexts and separate Accounting presentation; two peer source reviews agree. |
| Variant Standard fallback | VariantBuilder.xml | PRD-06,24 | Resolved as PRD-UI-008: existing HTML fallback admitted/encoded, native 200 and focused regression. |
| Repeated row-dialog identity | Product360 row dialogs; impl-products F43 | PRD-03–05 | Sampled without a new defect: two distinct identifier rows edited/reloaded in browser; actual terminal SKU/Other dialogs show own values and cancel unchanged. Follow-up native equipment, kit and dimension two-row edits/reloads passed; actual terminal kit3→4→3 retained the other row5. Other row families are unsampled. |
| Standalone tab actions | impl-products F44 | PRD-03,24 | Browser identifiers/parties and direct actual TUI Identifiers retained owning record, header/actions and both rows. No new defect in sampled tabs; remaining standalone variants unverified. |
| Variant asynchronous ownership | VariantBuilder.qvue | PRD-06 | Resolved as PRD-UI-003, including route departure before unmount: six focused mounted cases plus actual created-child navigation; PRD-UI-019 phone wrap separately corrected. |
| Newer shared tabs/inherited transitions | PaidAccess,Product360,Supplier360,InventoryValuation | PRD-23–24 | Resolved findings PRD-UI-006/015–017: owner/store read and authoritative Commerce/Warehouse/Purchasing mutation boundaries fixed, valid-payload positive/negative/forged-context counterparts observed. Accounting storeProductGl already refused Products. Follow-up repairCost normal/forged Products500 left cost8/quantity5 unchanged; choice helpers403 for catalog-only versus nonempty200 for native holders. Movements/Reservations Products200 omit operational content, owning Warehouse200 shows it. |
| Warehouse-only Stock tabs | InventoryAvailability Locations/Movements/Reservations | PRD-12,23 | Confirmed context-limited menu; PRD-UI-016 blocks direct Products location helper/mutations before service. Real Warehouse relocation succeeded then restored; remaining Warehouse operations stay outside Products review. |
| No Products Assist prompt | Products.xml; Admin.xml comparison | PRD-24 | Source-confirmed generic page context; no product-specific Assist workflow promised. Adding a prompt remains separate design work; provider/LLM behavior unverified. |
| Demo price-date rollover | BossProductsDemoData.xml | PRD-01,07–10 | Resolved setup risk: execution-relative expired/current/scheduled prices and exact exclusive-end transitions observed in Chicago/Tokyo; separate product-discontinuation Home meaning documented. |
| Historical output evidence | impl-products F45 and older notes | PRD-10,15–16,19 | Current actual CSV/XLSX/HTML/PDF, managed/version/draft bytes and local label outputs inspected. Follow-up renderer startup failure/retry and four-page 70-row PDF layout are now observed; historical failures/passes were not carried forward. |

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
blocking findings. Actual terminal variant selection/generation was subsequently observed in the resumed batch; other taxonomy recovery variants stay named in the ledger.
ProductsVariantWalk changed the disposable Services variant batch limit from 1000 to 100; the entire disposable
runtime is retained separately at pause. PRD-UI-009 was reproduced but not implemented before the requested pause.

**Checkpoint round and pause, 2026-11-09:** the user requested the next round of reviewed commits, then a
pull-only merge across mr-moqui and every mr-* addon repository before continuing this review. New review work stopped;
PRD-UI-009's assessed widget enhancement was not started. All current fixes received coordinator and independent peer
review. Pricing/export fixes cover PRD-UI-004/010; scoped document languages cover PRD-UI-005 with Mantle owner views;
Mantle paid-access and BOSS Commerce stock reads cover PRD-UI-006/007; PRD-UI-002 is fixed in
BOSS, as Moqui Java menus do not evaluate screen conditions: Product360 draws its tabs from product360Tabs.

Focused checks passed: pricing/documents 33/33; finish/suppliers 29/29; ShopSubscriptions 16/16; inventory/shared context
20/20; framework menu 9/9 including a failing baseline regression; targeted core Clippy and changed-file rustfmt checks.
Final local screen lint: 1,280 files, 35,064 expression sites, zero parse failures, 87 existing idiom/hazard sites.
Authorized existing acceptance: taxonomy/variants 3/3, pricing 8/8, inventory/methods 3/3, documents 2/2, tools 4/4.
No acceptance test or screenshot baseline was added. Actual effective-price PDF/layout, XLSX numeric/string cells,
CSV and managed-content bytes were inspected; Home light/dark 1920×1080, supplier history and document captures are
under ignored `visual-evidence/`. Important browser and actual TUI observations are recorded separately above.

PRD-14/15 manufactured costing and authorized finance posting were not reached: **no posting occurred**. A scratch
setup/probe runner rejected its external spec path before executing, so no Retail accounts were created. Imports,
checks and remaining settings activities also stay open. All full framework/apps suites remain deferred until the
resumed pass reaches its final wave; this checkpoint is not completion of the review. Browser theme and viewport
were restored. Review listeners will be stopped and the kept disposable runtime relocated intact outside the runner's
scratch namespace before pulls; its path and retained stock/method/variant/packaging fixture changes are recorded in
ignored environment evidence. The working database was never used.

**Resumed batch, 2026-11-09 — rebuild and action scope:** user resumed with the same three workers, reviewed
local batch commits, focused checks, final full suites and no push. Starting merged heads were framework `e5ee437f`,
BOSS `9725a5bd`, Mantle `57aa89a9`. Rebuilt Maximal debug with `CARGO_BUILD_JOBS=4 ./moq build --debug -j 4` (2m43s),
then rebuilt the embedded action templates incrementally (21.81s). Reused the retained disposable runtime outside the
runner cleanup namespace, explicitly restarting only ProductsPriceFixtures against its existing database (1/1).
Primary browser host is now `products-resume.localhost`; no working database was opened.

Live Product360 retest confirms PRD-UI-002: an ordinary asset no longer advertises Replenishment, Purchase history,
Paid access, Kit components or Equipment. The ungranted BOM tab gives its named Manufacturing-access explanation.
Fixed PRD-UI-009 with additive `row-selection/action@condition`: false/error omits that action's whole dialog/form;
services still enforce authority. Products offers Category/Feature only for catalog editors, Prices only for the
relevant editors, and only their permitted directions. Five existing focused renderer tests pass (0.25s); only the
existing gated static golden was regenerated/inspected. Native catalog/sales-price/supplier-price roles pass (8.10s);
ProductsCatalog 12/12 (4.5s feature time), changed-file rustfmt and screen lint (zero parse failures, 87 existing idiom
sites) pass. Two independent peer reviews found no blockers. Framework commit: `c7620238`.

Additional observed continuations: cloned/canceled/deleted disposable draft, including delete cancellation/reload;
edited two distinct identifier rows and reloaded; saved-find create/default/update/apply/delete restored its prior
default. Native evidence is under `products-catalog-resume/`. Primary logged a internal note on `UI_PRD_20261109`,
followed the record and reloaded to verify both; the named Message/Internal note controls are now visible. A missing
Find submit control was reproduced separately (PRD-UI-014) and is the next small app correction.

Finance: exactly one authorized disposable revaluation completed through ProductsCostWalk. Before posting,
confirmation cancellation and expired-preview refusal left zero events/operations. Persisted transaction `100051`
and event `100051` link to the posted preview/operation; pack stock quantity remains 5, unit cost changes 10→8 USD,
adjustment −10 USD, debits and credits each 10 USD. Identical operation retry produced no second event. Evidence is
retained under `finance-outcome/`; no further post is planned. Retail manufactured costing and broader access/mode
continuations are still being exercised. The full framework/apps suites remain deferred until the final wave.

**Maintenance and collaboration batch, 2026-11-09:** completed the authorized existing ImportWalk/Checks (3/3)
and CatalogSettings/Phone (10/10) against the rebuilt retained runtime. Native import continuation covered actor-private
reports, stale mappings, forged source fingerprint, canceled apply, mixed row results, reopening and idempotent retry,
and actual CSV bytes. Found/fixed PRD-UI-013: XML service-call error flow skipped the following response script, leaving
an empty successful response; one script now sends either authorized CSV or the framework's named error response.

Found/fixed PRD-UI-011: severity filtering happened after summary calculation. The optional severity is now declared
on CheckContext and filters displayed rows/counts together; native readiness and Home counts keep their existing
business meaning. Live error-only result is three errors/three issues. Found/fixed PRD-UI-012 using existing localized
rich-editor label support; primary typed/logged a internal note, followed and reloaded the record, and native checks
exercised note editing, replies, followers, two-file upload and reader download. A second shared consumer is retained
in the existing shared Chatter regression; no framework widget code was changed.

Focused checks before commits: ProductsChecks/Chatter 33/33 (8.4s feature time); ProductsImport 7/7 (3.1s), red before
its response correction. Native settings flags persisted all four chosen values after reload; stale-version and
invalid-currency submissions failed for their intended reasons, and original flags were restored in cleanup. Source
and two independent peer reviews found no blockers. Screen lint remains zero parse failures with 87 existing sites.
No new registered acceptance test or screenshot baseline was added; full suites still wait for the final wave.

Observed modality limits remain explicit: native IAB zoom shortcut left measured 1920×1080, DPR 1 and visual scale 1,
so actual 200% zoom was unverified at this checkpoint; it is user-excluded for the follow-up. Responsive1280/390px samples are independent evidence. Physical printer
send is outside the authorized scope, while generated labels/PDF/print layout were exercised. Native terminal Home
and navigation are being used for the remaining TUI continuations, not inferred from a browser-rendered twin.

**Shared boundaries and costing batch, 2026-11-09:** reproduced and corrected PRD-UI-015–017 using valid payloads
and native-authorized holders. Products routes now refuse Commerce paid-access, Warehouse stock-location and
Purchasing supplier approval/invitation actions before their mutation services; server-derived parent app context
wins over forged request appRoot. Native permission and record-scope checks remain in place. Real owning Commerce,
Warehouse and Purchasing routes succeeded, with disposable asset/profile state restored. Existing Accounting
storeProductGl already refused Products correctly. ProductsSharedContext/CommerceSubscriptions/WarehouseMoves/
PurchasingApprovals: 18/18 pass (7.4s feature time), including meaningful failing baselines; native HTTP and persisted
outcome probes agree. Independent peer review and changed-screen lint pass (zero parse failures, 87 existing sites).

Narrow Retail estimator/approver manufacturing continuation passed: raw material 4 and stocked subassembly 11 had
independently approved PDFs; main phantom/raw/subassembly/by-product estimate totals 146.25, materials 101.25,
by-product allocation 48.75. Changed work-center efficiency caused the reviewed save to refuse without another draft;
original efficiency was restored. Main standard `100104` was approved by the separate approver, with zero inventory
book or ledger rows. This is distinct from the one Services revaluation already recorded.

Bounded actual Admin settings/Health and Insights report/attention links reached their correct Products destinations;
catalog-only Insights access refused. PRD-UI-018 initially blocked one-step Back; corrected the shared shell's cold
mount history. Both actual Admin→Products and Insights→Products cold navigations now return to their exact origin
with one Back. Existing WebrootVue.qvt/shell checks: 65/65, 11.9s feature time; root commit `453483c0`. Documentation
now describes the six current shared contexts and separate Accounting presentation, with historical results linked
to plans. No full adjacent-app journeys were added.

Primary actual TUI keyboard path used `g` to open VariantBuilderTui, Tab to its list, Space to select one complete
combination, and its Generate selected dialog/button. Results retained the complete feature key, correct product
`BOSS_PRD_VIRT_BL_L`, and existing outcome without a duplicate product. Browser three-axis matrix/list/phone showed
eight equivalent three-key combinations, created one child and safely repeated it. Phone overflow PRD-UI-019 and a
remaining pre-unmount request-start race in PRD-UI-003 were corrected with six focused mounted cases (baseline two
failures, corrected 6/6); no new API, CSS fork or screenshot suite. Terminal type-choice clarity is a separate final
refinement (PRD-UI-020).

**Terminal, responsive variants and contrast batch, 2026-11-09:** the terminal child-type picker now shows
Asset (Good) for its existing blank default and offers only the eight eligible nonvirtual types (PRD-UI-020).
Coordinator reconnected the idle terminal and navigated by keyboard to the builder; the displayed default and open
picker agree with native response inspection. Existing ProductsVariants: 10/10 (5.3s feature time), including one
focused render of this helper's own TUI logic; both peers approved. Screen lint: 1,280 files, 35,071 expression sites,
zero parse failures, 87 existing idiom/hazard sites. Invalid nonempty supplied types still reach the service refusal.

Variant phone wrapping and the remaining route-departure race are committed as `70f70d7e`. Framework contrast
corrections PRD-UI-021/022 are committed as `da2e2766`: actual light Ended text improved 3.97→5.24, dark focused labels
3.66→7.61. Existing MoquiHtmlCss checks went red before the correction and pass 10/10 after (4.66s); native light/dark
price chip/dialog measurements agree; shared badge fixture parity and supplier workflow were checked. Explicit colors/error labels and focus strokes were checked separately; original
light preference was restored. No screenshot baseline or additional complete regression journey was added.

**Final recovery/output batch, 2026-11-09:** PRD-UI-023 was independently reproduced in sales prices, price-list
publication and translations. Persisted current data and actual submitted payloads proved the first reload's stamp/
publication token remained old after a JSON refusal. The framework now queues recovery fields only for ordinary
redirect responses, including its no-response branch; JSON clients retain their current draft locally. Focused Rust
render/transition checks: 45 passed, one existing ignored (2.12s); new regression fails on the original behavior.
Non-JSON retained draft/password filtering is verified separately. Core all-target Clippy passes (25.08s) after removing
an upstream obsolete TUI argument-count lint expectation, reviewed and separately committed as `8d891361`. Debug
rebuild passed (22.45s); retained disposable server restarted with only the price fixture (1/1). Native sales recovery
13.00s, price-list recovery 9.48s and translation recovery/clear 5.96s pass with exactly one real reload. Both peers
approved the framework correction; reusable route, AJAX recovery and cold-history patterns entered UI-Review.md.

PRD-UI-024 document download correction preserves resource authority and bytes while returning named denied/missing/
version failures. Existing ProductsDocuments: 20/20 (8.0s feature time), native same-resource holder/non-holder and
missing-resource checks 1/1 (5.81s). PRD-UI-025 check exports now include severity and omit Retry; existing
ProductsChecks: 7/7 (4.2s), native independent failure/clean zero-issue/CSV 1/1 (3.00s). Both had failing baselines,
coordinator and peer review. Final output screen lint: zero parse failures, 87 existing sites, 35,071 expressions.
The final release build and deferred full framework/apps gates follow this batch; no push is authorized.

Final PRD-09 read-only continuation used existing approved BOSS_COST_SAMPLE at 6.25 USD and published list price 13.50 USD
on BOSS_PRD_OWN: actual margin 7.25 USD / 53.7037% agrees. The positive catalog.admin identity has both grants;
catalog.price.read actions JSON omits all four cost/margin/source fields and corresponding labels, while
catalog.cost.read independently sees the approved cost/link. Returned to the same Product360; no writes (6.91s). Final actual parent-cycle attempt named its path and retained sequence 73; both parent-edge arrays stayed unchanged, then returned to the child Parents record (6.96s).

**Final regression verification, 2026-11-09 America/Chicago:** built Maximal release once at the end
(`CARGO_BUILD_JOBS=4 ./moq build -j 4`, 4m15s). Full gates ran from the repository with MOQUI_RUNTIME,
MOQUI_FRAMEWORK and MOQUI_CONF unset, four build/test workers, and `--nobuild` on that release binary.
No application/framework code changed during the full gates; later edits only reconcile review documentation.
Workspace `cargo lint` passed (1m43s).

| Final check | Observed result |
| --- | --- |
| `./moq test-framework --nobuild` | All seven suites passed: workspace Rust tests, 342 shell checks, 425 framework server features, 10 demo features, 419 webroot offline + 48 dev-aide offline features, 149 served client features |
| `./moq test-apps --nobuild` (final rerun) | 3,436/3,436 server features, 452 specs, 194.52s wall; 36/36 client features, 17 specs, 132.15s wall; zero failed/ignored/skipped |
| Changed-screen lint | 1,280 files, 35,071 expression sites, zero parse failures; 87 existing idiom/hazard sites |
| Budget preservation | No budget changed. Final app server feature time: Mantle 375.9/393s, BOSS 234.1/264s, PASS 15.8/20s. Soft warnings: framework 12.8/12s and tools 3.2/3s; final BOSS client 66.7/57s. No hard budget gate failed |

The first full app run had 17 failures around one Customer Service delivered order; its client suite passed 36/36.
Read-only inspection of the exact cached `test-5d49575c52820843` dump proved that order/header/parts absent before
any specs, while other Customer Service orders were present. Earlier separate bootstrap logs contain the same
partial-loader failure class (delivered-order transaction rolled back after a script stack overflow); they are not
claimed as the exact cache creation log. Fresh-release CustomerServiceOrders passed 6/6. Quarantined only the bad
snapshot, regenerated it on the release binary, and passed all 51 affected Customer Service/Commerce features across
six specs before the complete successful app rerun. No source correction, test assertion weakening or helper
self-seeding was used. Exact hashes, original dumps, failed/successful logs and peer diagnosis remain local.

Final execution-relative product-date verification used the final release server and the existing active owned
product. Summary saved/reloaded salesDiscontinuationDate 2026-11-25 04:29 UTC (15 days ahead), Home Ending soon0→1,
and the actual card opened list=discontinuingSoon with that product. Clearing/reloading restored the original null,
Home 1→0 and exclusion from the filtered list (5.97s). This count is independent of price-expiry notifications.
No source changed; retained runtime field was restored before stopping the final listener.

Cleanup: Services/Retail variant batch limits are 1000 again; catalog flags/defaults, effective Light appearance,
price-user zones and saved-find default are restored. Initial theme preference-row presence was not captured;
only restored effective appearance is claimed. Temporary grant, stock location and supplier profile changes were
restored. New synthetic fixture/history rows and exactly one reviewed revaluation remain in the disposable runtime;
working data was never opened. Final review and full app-test listener ports were verified closed; browser viewport
was reset and temporary tab closed. The kept runtime/database and downloaded evidence remain local and ignored.

Confirmed findings PRD-UI-001–025 are corrected, reviewed and retested. All 24 activities have observed outcomes;
this prior checkpoint preserved named unverified branches (superseded by the follow-up ledger). Actual 200% zoom was not established then by the
available tool; selected 1280/390px checks are independent. Less-used master/routing/long-batch mode variants,
renderer-unavailable fault injection and multi-page price-list page breaks were unverified at this earlier checkpoint; the follow-up below observes their outcomes.
Physical printer/external delivery remain outside scope. No additional production feature is inferred from a gap.

Compatibility: routes, record keys, preferences and existing service contracts are retained. Content-owner views and
row-action conditions are additive. Products now refuses owning-app mutation routes before the native service;
authored explicit save-parameters and ordinary redirect form recovery remain intact. No migration or renamed API.

Reviewed local review commits (the final verification-only commit follows this index):

| Repository | Commits |
| --- | --- |
| mr-moqui | c8507e2f, c7620238, 453483c0, da2e2766, 8d891361, fe9dbd98 |
| mr-boss | c74f9d8e, f26cde70, cc2eef83, a4b55267, b7dc256b, e39e490c, 0a1cf3f0, 82fff833, c625863e, e5059b5f, f51e2a23, 70f70d7e, 6937fea2, 5a63404e, 35f173e7, 9f037725 |
| mr-mantle | bcc065a1, c3546cd4 |

The earlier requested pull-only merges were e5ee437f/9725a5bd/57aa89a9 (framework/BOSS/Mantle), with the other
mr-repos fast-forwarded or already current. No push was performed. Local ignored evidence and exact environment
metadata are indexed in [evidence-index.md](../../../../plans/ui-refinement-evidence/boss-products/evidence-index.md).

**Follow-up authorization and compatibility decisions, 2026-11-09 America/Chicago:** user requested completion of
remaining locally verifiable gaps with the same three subagents, reviewed focused-test commits and full framework/apps
gates only at the end. No push. Actual 200% zoom is explicitly user-excluded for this pass; native Chrome access had
also been refused by Computer Use, so no bypass or simulated zoom is counted. Reused the retained disposable database
and verified release binary, explicitly loading only the idempotent price fixture (1/1); no second revaluation post.

Follow-up decisions made before their corrections: PRD-UI-026, paired subscreens-menu/active omits terminal Stock's nested
Summary/Projection/Policy navigation; shared renderer must emit its existing standard subscreens node while Active
remains the sole content owner. PRD-UI-027, filtered CSV/XLSX exports silently stop at the current page; honor
pageNoLimit within the existing 200-record ceiling, with named narrow-filter guidance for larger finds. This changes
previous silently truncated oversized downloads into explicit refusal; normal pagination and owner scope remain.
PRD-UI-028, saved routing equipment/skill requirements lack any visible read-back identity; show existing authorized
resource data and preserve duration visibility. PRD-UI-029, a failed no-response transition requested as JSON returns
empty HTTP 200; shared fallback will serialize existing errors with their standard failure status. Successful empty
no-response transitions, explicitly sent responses and non-JSON behavior remain unchanged. These decisions precede
implementation of the shared JSON fallback; no routes, record keys or service signatures are renamed.

**Follow-up implementation and observations, 2026-11-09/10 America/Chicago:** the same three workers investigated,
implemented and rotated peer review; coordinator integrated, tested, committed and ran actual terminal workflows.
Evidence stays in ignored `plans/ui-refinement-evidence/boss-products/followup*`. The current §6 ledger supersedes
earlier dated “unverified” continuations above; selected samples do not imply an exhaustive role/route/mode matrix.

Compatibility decisions for the additional corrections: Standard decimal fields accept fractional numbers while
fields with digits validation retain step1. Sales-price correction submits one existing canonical date. Label resource errors
use the established named response; successful bytes remain unchanged. Variant HTTP errors are normalized inside
the existing client request boundary, preserving the framework rejection contract and operation ownership guards.
No route, key or preference rename, database migration, screenshot baseline, extra golden path or registered
acceptance journey was added. The export contract now explicitly refuses more than200 matching rows instead of
silently truncating; at most200 are exported across pages, with native owner/filter scope unchanged.

The corrected PDF fault used a separate offline copy `/tmp/products-review-pdf-fault-vpxurlcg`, port57821, with its
single existing renderer node pointed at `/usr/bin/false`. It reproduced named PDF startup failure while independent
HTML output stayed200. Restoring Chrome in that same clone rendered the exact failed label job/request/fingerprint;
job count17→17, error cleared, repeated bytes identical SHA256
`5220cd3a5886784352963c37912c62fc02f4d6851a4cb03adbd0f3573a083d3f`. Price PDF recovery showed7.25USD.
The earlier duplicate-facade configuration did not inject a fault and is not counted. Actual70-product output had
four A4-landscape pages15/24/24/7, repeated headers and all70 unique IDs; every rendered page was inspected. QR and
Code128 PDF rasters decoded the intended identifiers on the two approved local layouts. Physical print/external
send remain outside scope.

Other completed recovery gaps: managed three-file upload retained two successes and retried only the failed empty
file; contradictory feature rules/used-feature deletion named their refusals without mutation; live import/variant
revocation refused prepared work and resumed the same operation after authority restoration; oversized and malformed
UTF8 import files refused before valid Unicode staging. Variant collision retry completed4created/0failed/0pending;
copy selection included description/unit and omitted comments. Unit/currency cost previews reconciled500g and0.5kg
at2USD, temporary0.8FX at1.60EUR, named incompatible/missingFX refusals, and minute routing40.75USD with separate
material/labor/machine/overhead amounts. New cost work stayed previews. The historical packaging preservation case
explicitly seeded a receipt snapshot (2entered×12=24base) and asset, then verified unchanged values/stamps after the
real definition edit12→18; it is not a receiving/issuing workflow claim.

Actual terminal coordinator observations are preserved as settled client responses in `followup-20261110/tui-*.log`:
create, activation Cancel/Confirm, Active/Discontinued/Obsolete edits; kit row3→4→3 with the other row5; category
missing-type retained refusal→Catalog correction; feature abbreviation save/reload; stock15/12/3 and all projection
rows12, policy9→10→9; BOM Explosion/WhereUsed tabs; sales12.50→12.75 and supplier4.75→4.85 corrections; quantity12
price22.10 with rule/round/bounds trace then quantity2 price16.60; Retail estimator preview40.75USD; GL-holder preview
quantity5/current8/forward8/adjustment0 without Post; Unicode translation edit; scan Enter resolves18Each; decoded
rendered QR job2copies; CSV-paste import staging only; and issue link→missing-name save→same checks1→0. Terminal
document readback exposes the browser-only record-files part; file upload directs to the browser. Rich browser
widgets, external scanner hardware and physical printers are not inferred as terminal capabilities.

Services/Retail variant limits1000 and original copy policies, temporary grants, facility ownership, FX and default
columns were restored. Only the review-created page-size preference was cleared to documented default25; its original
row presence/value was not captured. The terminal stock minimum is restored9. New synthetic masters, completed
operations, an OPEN order and clearly marked historical snapshot remain in the disposable DB. No second revaluation
post or working-database access occurred. Actual 200% zoom is user-excluded; responsive width checks remain separate.

Focused precommit results: framework TUI29/29 (0.46s), render45passed/1existing ignored (2.04s), core Clippy green;
ScreenHtml15/15 (0.6s). BOSS Tools22/22 (3.0s), Pricing15/15 (8.5s feature), Methods21/21 (4.6s feature),
Catalog+Variants24/24 (11.3s feature/18.64s wall), final both-export-mode feature1/1 (2.68s), mounted variant responses7/7
(4.46s); selected actual native counterparts passed as indexed in worker receipts. The201-row scratch setup/cleanup
passed its functional assertion but exceeded the runner15s guard at51.90s; it is unregistered manual evidence, not a
passing regression run or raised budget. Screen lint had0parse errors; existing diagnostics are retained. A final
release build with four jobs passed in 3m43s. Full framework gate started after the final settings correction/focused checks; full app gate follows the quiet framework retry. The routing lead is now reproduced/corrected as035.

**PRD-UI-034 decision before implementation:** terminal Settings save inherited the rendered asOfDate into its success
location, so the previous policy remained visible and a second save used an old token. Fresh navigation proved the
first change persisted. Preserve Java-compatible framework parameter inheritance and dated/error views; explicitly
clear asOfDate only on successful Catalog/Variant/Pricing settings responses, following the intent of the existing method-screen pattern. The parser ignores empty value attributes, so use the supported from expression evaluating to empty string. Current readback and consecutive saves passed in the strengthened14/14 Catalog regression (new feature0.21s;6.4s feature/14.12s wall), with historical reads preserved. Actual terminal Catalog and Variant second-consumer saves passed and restored original values. Peer-approved commit 454e5092. Final screen lint: 1,280 files / 35,076 sites / 0 parse failures / 87 existing heuristic flags. The same ineffective-clear pattern on Routing was separately reproduced/corrected as035 before the final app gate.

Related routing source-lead decision before any extension: investigate one unused disposable route/release. If the
inherited computed date hides the new released operations, use the same supported explicit date clear on its
successful authoring responses, preserve explicit historical reads/error drafts, and verify in the existing Methods
regression and native counterpart. This is application navigation context, not a reason to alter framework parameter
inheritance or broaden domain authorization.

**Final-gate first run, before correction/retry:** `./moq test-framework --nobuild` completed all seven stages.
Rust had one stale existing generated-text golden (`tui/structure`), with1,682 core checks passing and4existing
ignored. The corrected expected file adds only the nine intended menu-node lines, exactly matching captured actual
output; normal focused golden1/1 passed in0.04s, two reviewers approved, commit2e4787cf. Framework server426/426
functional features passed, but ArtifactIndex16.43s exceeded the15s hard spec guard under concurrent native review
load. All other stages passed: moq shell342, demo10, webroot offline419, dev-aide offline48, served clients149.
No budget is raised or assertion removed. Repeat the full framework command after the final terminal continuation
and all concurrent review probes stop, then run the full app command in the repository environment.

**PRD-UI-035 observed, terminal routing release:** fresh and explicit-dated native browser releases on disposable
routing100055 were positive and do not establish a browser defect. Actual terminal release of its prepared revision
saved, emptied the draft list and showed one released operation, but F5 retained the previous operation name at the
old inherited date. A fresh Go to the same product/workEffort path showed the new Terminal release candidate.
The TUI form includes the computed date among hidden transition parameters. Apply the previously stated bounded
Routing success-date correction with the supported empty-string expression; preserve errors/historical read routes.
No framework parameter/parser behavior or domain approval rule changes. The nine success clears now use the supported empty-string expression. Existing Methods resource setup reuses its release through a TUI transition and follows returned parameters; meaningful red retained the old date, green21/21 passed (13.4s feature/20.96s wall on debug). Actual terminal second release/F5 showed the new postfix label,1released/0draft and empty returned date without Go. Peer-reviewed commit0ccbe6b4; final lint1,280files/35,085sites/0parse failures/87existing heuristic flags.

Follow-up reviewed source commits (all local):

| Repository | Commits |
| --- | --- |
| mr-moqui |8131c4fa,01eb58ff,8374226a,2e4787cf,974c8636|
| mr-boss |9d7dad42,98c86d78,5e4bca7b,bec4c8d8,7283de0b,cb97664e,454e5092,0ccbe6b4,c88c939f|

All35 confirmed findings now have reviewed corrections and focused verification. Every activity has bounded
observations and explicit limits; no exhaustive role/owner/mode matrix is claimed. Known capability limits include
no selected-only catalog export/header sort control, the200-match export ceiling, Connections'25-per-type display,
browser-only upload/rich parts, and scoped physical-print/external-delivery exclusion. Unsampled association types,
locale/owner and basis permutations, external scanner hardware and provider/LLM behavior are not silently passed.
200% zoom is explicitly user-excluded for this pass.

After the last terminal retest, both review HTTP/Postgres instances and every terminal client were stopped; all
nine task-local stored login-key files plus the later routing key were removed, leaving no profile credentials.
The final full-suite verification record and clean repository/listener checks are recorded below.

The quiet full-framework retry cleared the original golden and timing guard: framework426/426 passed in48.91s,
with ArtifactIndex14.78s. Six non-Rust stages passed. It exposed a later supporting Rust-test count: devkit's
no-entity template harness expected14 ScreenHtml cases after the added decimal regression made15. Updated only that registration count, retaining per-case/no-entity assertions; the exact focused check passed1/1 in3.88s after a four-job test build1m03s. Peer-approved commit974c8636 precedes the final full command. This is test metadata, not a runtime implementation or budget change. Use two workers for the final full
framework/app runs to reduce host contention; the checks and thresholds stay unchanged.

**Final verification completed, 2026-11-10 America/Chicago:** final
`env -u MOQUI_RUNTIME -u MOQUI_FRAMEWORK -u MOQUI_CONF CARGO_BUILD_JOBS=4 MOQ_TEST_WORKERS=2 ./moq test-framework --nobuild`
passed all seven stages, including the full Rust workspace/integration checks. Framework server426/426 passed
(67specs,39.00s), ArtifactIndex8.48s, shell342/342, demo10/10, webroot offline419/419, dev-aide offline48/48 and
served framework clients149/149 (9specs,53.06s). Supporting golden/count fixes are committed and all budgets retained.
The final release binary SHA256 is `122ddd0c668e81fa99d9e1682ceed1a00eb32b731d6004e9582096b84a4ffb2d`;
it contains all runtime Rust/template corrections. Subsequent framework commits changed only test expectations.
BOSS screens/services remain individually linked, dynamically loaded source; no runtime implementation changed
with the final test-only organization isolation.

Additional regression hygiene: each server worker owns its restored DB and runs its specs serially, so the policy
case had no cross-worker write race. To remove dependence on preexisting policy-history metadata, its unchanged
three cases now use one private internal-organization fixture. Only its seed setup uses the existing scoped artifact
bypass; actual transitions keep authorization. Release ProductsCatalog14/14 passed (3.3s feature/20.27s wall,
new case0.13s); peer-approved test-only commitc88c939f. No new UI finding or budget change.

The final `env -u MOQUI_RUNTIME -u MOQUI_FRAMEWORK -u MOQUI_CONF CARGO_BUILD_JOBS=4 MOQ_TEST_WORKERS=2 ./moq test-apps --nobuild`
passed both stages: **3,442/3,442 server features**,452specs,339.10s; **37/37 client features**,17specs,133.80s.
Server component time: Mantle329.5s/393s and BOSS228.7s/264s. BOSS clients retain the existing soft-budget warning
67.9s/57s (prior gate66.7s/57s); the hard gate passed. No budget or assertion was weakened. Final commands exited0.
Logs: `followup-final-test-framework-verified.log` and `followup-final-test-apps.log` in the ignored review directory.

Tested source: framework974c8636, BOSS c88c939f, Mantle57aa89a9; the subsequent BOSS commit records only this ledger.
The release binary was built after all runtime Rust/template fixes at8374226a; later framework commits only corrected
test expectations/counts. All fourteen observed review/test HTTP ports and twelve recorded suite server PIDs were
absent after completion; both review Postgres pidfiles were absent, and all task-local terminal credential files were
removed. Review settings/effective preferences were restored as documented above; newly created review fixtures and
captured evidence remain in the stopped disposable runtime. No working-database access, extra revaluation post,
external delivery, physical printing or push occurred. All seven mr-repositories are clean after the verification-only
commit. Actual 200% zoom remained user-excluded; all unsampled capability/mode variants retain their explicit limits.

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
- **Status:** §6 is the activity ledger; each observed outcome and remaining mode/recovery gap is recorded there.
  Source research and old test results do not establish a pass.
- **Modes:** Material is the visual target; TUI gets actual supported operations and Standard brief functional/output
  or fallback checks. Measure viewport and real zoom instead of assuming the tools honored a request.
- **Permissions:** catalog, sale/purchase pricing, costs, methods, facility policy, global units and finance remain
  separate. Use narrow identities, owner/facility scope and response/output checks.
- **Shared causes:** correct in BOSS, Mantle or framework according to ownership and retest a representative consumer.
- **Verification:** retain the existing Products golden path, suite boundaries and budgets; no new screenshot or
  duplicate sweep suite. The current user-supplied before-commit rules apply unless explicitly superseded later.
- **Fixtures:** isolated Mantle+BOSS runtime, matching owner/date fixtures, local outputs and safe print destination;
  existing acceptance fixtures are not an automatic bootstrap authorization.

### Execution setup dispositions

- **Bootstrap (resolved):** isolated individually linked Mantle/BOSS runtime with copied configuration, disposable
  database/resources and captured mail; six explicitly authorized fixture specs loaded. Retained runtime and debug/
  final release binary revisions, paths, port 57820 and host identities are recorded in local environment evidence.
- **Cost-role alignment (resolved):** prepared separate Retail estimator/approver fixtures; they have cost permissions
  and read-only method access, not method edit. Existing Services roles cover the purchased-item/finance path.
- **Execution dates (resolved):** executed 2026-11-09 America/Chicago (2026-11-10 UTC). Prepared prices relative to
  execution, observed exclusive price-end boundaries in Chicago/Tokyo and restored preferences. Home Ending soon
  independently counts product sales discontinuations within 30 days; price-expiry notices are separate.
- **Tool capability (bounded):** measured 1920×1080 and selected 1280/390px; native terminal keyboard operations and
  Standard fallback/output observed. Actual 200% zoom is user-excluded for this pass; earlier shortcut attempts did not establish zoom. PDFs/managed bytes/local label output work; physical printer/external delivery remain out of scope.
- **Finance extent (resolved):** user authorized one actual disposable posting. It completed after cancellation/stale
  recovery; persisted quantity, cost, balanced ledger and same-operation retry were checked. No second post is needed.
- **Automation selection (resolved):** explicitly selected Products fixtures/walks and the four existing Products
  server acceptance specs only. Scratch native probes are local evidence, not added registered suites. No new
  acceptance tests, screenshot baselines, duplicate regression journey or budget increase; no accept-all/test-all.
