# IronStone BOSS — UI review: Products

Contents: [scope and sources](#1-purpose-scope-and-sources) · [method](#2-review-method-and-refinement-criteria) ·
[screen inventory](#3-screen-and-surface-inventory) · [activities](#4-end-to-end-activities) ·
[verification](#5-existing-checks-and-future-verification) · [running record](#6-coverage-findings-and-running-record) ·
[decisions](#7-decisions).

## 1. Purpose, scope and sources

Review and refine Products through the work of catalog managers, price and supplier-price editors, method engineers,
cost estimators and readers: establish a product, organize and enrich it, generate variants, explain and publish
prices, inspect stock and methods, maintain estimates, manage documents and identifiers, import changes and resolve
catalog problems. Aim for a comfortable daily catalog workspace with clear next actions and trustworthy identities,
effective dates, quantities and money. Substantial layout and navigation refinements may be proposed where they
improve an implemented workflow.

This follows [Projects](ui-review-projects.md) and the [document convention](design-doc-guide.md#ui-review-and-refinement-phase).
Keep the current inventory, activities, coverage, findings, decisions and bounded execution notes here. Research
records references, design specifies behavior, implementation records construction, and this file records review
and refinement.

**Planning only, 2026-11-09.** This task researches and writes the plan. No live review, application changes, builds,
test runs, commits or pushes are part of this task. All activity coverage starts **pending**. The Projects pass's
execution authorization, acceptance selection and commit cadence do not transfer to Products. Historical Products
implementation results and existing tests are inputs, not evidence of this review's outcomes.

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
| Insights reports/attention, Admin health and neighboring app records | Existing entry/return contracts under the owning app's authority; bounded handoff inspection only |

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
from working data. A different port alone does not isolate the database, and cookies are not isolated by port.

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
| Catalog reader and editor | `catalog.reader`, `catalog.edit`: permitted catalog reads versus master-data changes; price/supplier/cost values remain independently restricted |
| Sales-price reader and editor | `catalog.price.read`, `catalog.price.edit`: dated prices, lists, explanation and outputs |
| Supplier-price reader and editor | `catalog.supplier.price.read`, `catalog.supplier.price.edit`: purchase-direction offers, separate from sales prices |
| Cost reader, estimator and approver | `catalog.cost.read`, `catalog.cost.estimate`, `catalog.cost.approve`: standard estimates and approval separation; compose price read only for an explicit margin sample |
| Catalog administrator | `catalog.admin`: catalog/variant/pricing/identifier defaults; not a substitute for system-wide unit authority |
| Stock planner | `catalog.stock.plan`: planning policy and product-specific tracking exceptions; broader organization/facility tracking defaults require management authority if exposed |
| Method reader/editor/approver/resource administrator | `catalog.method.read`, `catalog.method`, `catalog.method.approve`, `catalog.method.resource`: distinct Manufacturing permissions on Products' method surfaces |
| Combined method walkthrough | `catalog.method.walk`: useful initial engineering/costing fixture, but combines edit, approval, resource and cost grants; pair with the narrow roles above |
| Inventory accountant | `catalog.cost.gl`: existing revaluation handoff, with explicit organization/facility/settings/period prerequisites |
| System administrator | Separate `ADMIN` fixture for global noncurrency units/shared-master writes and setup; do ordinary catalog work with its own roles |
| Scope and neighboring-app pairs | Other organization, revoked/absent grants, Products-only user and representative adjacent-app reader; prepare only missing fixtures |

Most `catalog.*` users belong to `ORG_ZIZI_SERVICES`; the method users above belong to `ORG_ZIZI_RETAIL`. Use a
matching product/facility instead of misclassifying owner refusal as a missing method permission. Catalog-only
users also need the root grant for a neighboring app before its linked transaction details are available.

Use `BOSS_PRD_OWN` and `BOSS_PRD_OTHER` for the Services/Retail boundary, the draft and obsolete samples for lifecycle,
`BOSS_PRD_VIRT` and its selectable features for variants, and packaging/check/stock/cost samples for their waves.
Include shared `_NA_` masters, a kit, equipment and a digital product to reach type-specific tabs. Prefer disposable
copies for mutation. `ProductsMethodFixtures` and `ProductsCostFixtures` are regression fixture specs; the inventory,
price, tools and import fixture specs listed in §5 live in acceptance. Select and record a bootstrap explicitly;
this plan does not authorize running those acceptance fixtures incidentally.

Dates matter: demo `BOSS_PRICE_SALES` ends on **2026-11-15**, when `BOSS_PRICE_NEXT` starts. Record the as-of date and
zone, or create dated disposable rows appropriate to execution time. Prepare current/future/expired prices, quantity
breaks, two currencies/units, published/draft lists, missing cost bases, approved/draft methods and standards, and
stock inside/outside scope. Cost fixtures may depend on Chromium and may not enable revaluation on an already
existing accounting preference; verify settings, accounts and periods rather than assuming setup succeeded.

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
  selected product/list/run and the snapshot being committed. Late responses must not overwrite another product,
  preview, page or operation; changing the source must invalidate incompatible selections.
- Explain date boundaries, sale versus purchase direction, price versus estimate versus posted valuation, and
  quantity-unit conversions. Restricted values are absent, not zero. Reconcile counts/totals with drill-throughs;
  distinguish no records, no matches, no permission, missing basis and failed loading.
- Inspect real downloaded CSV/XLSX/PDF/content bytes and printed layout, including headers, empty values, Unicode,
  owner scope and date/quantity/currency basis. A toast, filename or HTTP 200 does not prove a correct output.
- Confirm lifecycle, generation, publication, bulk changes, approval and posting with the record/count. Cancel must
  not write. Independent failed import/output items identify the item and allow unrelated work where the contract
  permits; security and atomic record/financial operations stay strict.
- Check app drawer, palette, notifications and Assist with a selected product. Inspect existing provider context
  and return paths without repeating the entire shell/Assist review or assuming an unavailable provider worked.

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

Establish positive/negative permission pairs from Wave 1. PRD-09's standard-cost basis/margin continuation follows
PRD-14/15; PRD-10 revisits supplier-direction output with PRD-11 if offered. PRD-03's documents, pricing, stock,
method/cost and packaging tabs continue in their named later activities. Keep each unfinished continuation visible
in the originating activity's outcome instead of treating a later pass as automatic completion of earlier work.

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
| `Products/Settings/` | `Index`, `VariantSettings`, `PricingSettings`, `IdentificationTypes` | PRD-22; PRD-06–09, 18–21 consumers |

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
| Product360/Stock, Product360/BOM, Supplier360 | Summary, Overview, Overview respectively | PRD-11–13 |
| Product360/Documents, CategoryDetail/Content, CategoryDetail/Content/Index | Index | PRD-16 |

In the following table **P360** is `Products/Products/Product360`, **CD** is
`Products/Categories/CategoryDetail`, and **S360** is `Products/SupplierPrices/Supplier360`. These are actual
mounts/reused sources, not copies to implement. Check helper resolution through the consuming route at runtime.

| Route under Products | Source under B | Activities / context |
| --- | --- | --- |
| `Products/DocumentDetail` | `Shared/DocumentDetail.xml` | PRD-16; preview, versions, datasheet, embedded Chatter |
| `Products/Chatter`, `Products/Chatter/ChatterTui` | `Shared/Chatter.xml`, `Shared/ChatterTui.xml` | PRD-16, 23–24 |
| `Products/RecordFiles`, `Products/RecordFiles/RecordFilesTui` | `Shared/RecordFiles.xml`, `Shared/RecordFilesTui.xml` | PRD-16, 23–24 |
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
| `P360/Stock/{Summary,Locations,Movements,Reservations,Projection,Policy}` | Matching `Shared/InventoryAvailability/*.xml` | PRD-12; facility and owner scope |
| `P360/BOM/Overview` | `Shared/BillOfMaterialsDetail/Overview.xml` | PRD-13 |
| `P360/BOM/{BillOfMaterialsExplosion,BillOfMaterialsCompare,WhereUsed,RoutingDetail}` | Matching `Shared/*.xml` | PRD-13–14 |
| CD; `CD/{Summary,Parents,Products,FeatureDefaults,Identifiers,Content}` | `Shared/CategoryDetail.xml` and matching children | PRD-04–05, 16 |
| `CD/Content/Index`, `CD/Content/Index/Index` | `Shared/CategoryContent.xml`, then `Shared/Documents.xml` | PRD-16; nested category content |
| `S360/{Overview,Documents}`, `S360/Prices` | Matching `Shared/Supplier360/*.xml`; `Shared/SupplierPrices.xml` | PRD-11, 16; supplier-fixed context |

Product360 declares 21 physical tabs; Products' context admits 19 names, with additional capability/type conditions.
`KitComponents` is for `PtPickAssembly`, Equipment requires `AstTpEquipment`, and Products' PaidAccess presentation
is read-only for `PtDigital`. `Replenishment` and `PurchaseHistory` are not Products tabs: include their inherited
routes in PRD-23's direct-access/context checks rather than presenting them as catalog features.

Supplier360 also physically inherits `Bills`, `Buying`, `Finance`, `PurchasingAgreements`, `PurchasingDropShip`,
`PurchasingPerformance`, `PurchasingQuotes`, `PurchasingReceipts`, `PurchasingReturns`, `Receiving`, `SubcontractOrders`
and `Conversation`. Their owning contexts are Purchasing, Warehouse and/or Manufacturing. PRD-23 checks that
Products has not acquired those operational surfaces through shared-file expansion. Inspect inherited document and
Chatter helpers through their actual resolved URLs; they are supporting surfaces of PRD-16, not separate workflows.

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
| Other exports | Product/price lists CSV/XLSX; checks, costs and other authored exports; inspect the actual offered format, not assumed parity | Respective activities |
| Shell | Quick create product/category/feature; Catalog and `#` identifier palette sources, `MantleProduct`, `g p/g c/g f`, price-change/expiry notifications, catalog tasks and Assist context | PRD-01, 07, 20–24 |
| Insights/Admin entries | `Products.CatalogChecks`, `Products.PriceHistory`, `Products.CostHistory`, `Products.CostRollup`; ActiveSkus/Variants/EndingSoon attention; catalog-health fix link | PRD-21, 24 |

The variant wrapper declares `vue,qvue,tui` while also authoring an `html,qvt` link to its terminal/list setup.
Verify whether Standard can reach that fallback before claiming support. Inline status/chart templates and shared
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
- **Objective/steps:** Home → each permitted counter → matching find → product → Back; search ID/name/typed identifier
  and authorized party item code; switch list/board, sort, page, choose columns and save/reset a find; use palette,
  quick-create entry, keyboard shortcuts, catalog task and notification returns with drawers open.
- **Expected:** counts, owner scope, filters, selected identity and visible money agree; returning preserves the find;
  restricted or unavailable sources do not fabricate values or hide unrelated work.
- **Recovery:** empty/no-match list, inaccessible recent record, identifier ambiguity, unavailable search/provider,
  canceled quick create and filters retained after failure.
- **Screens/modes:** Home, Products/List and shell providers; browser/TUI/Standard, keyboard/narrow/zoom samples.

### PRD-02 — Create, clone and manage a product's lifecycle

- **Actor/start:** catalog editor with disposable draft and used product; reader for refusal.
- **Objective/steps:** NewProduct from list and quick create → saved Product360 → edit → clone selected sections →
  inspect the new identity/history → activate/discontinue/obsolete as allowed; delete an unused draft separately.
- **Expected:** defaults and selected clone sections persist, ownership is clear, transitions explain their effects,
  readiness failures identify missing requirements, and deletion is limited to unused drafts; a new form does not
  inherit another record's key. Discontinuation/obsolescence preserves existing open orders, stock and returns while
  refusing new prohibited use under the lifecycle rule.
- **Recovery:** missing/duplicate ID/name, invalid date/status, stale edit, canceled clone/status/delete, attempted
  deletion of a used product, and obsolete-product refusal at one existing downstream consumer.
- **Screens/modes:** NewProduct, Product360/Summary/History and lifecycle dialogs; browser/TUI/Standard.

### PRD-03 — Complete the master record and understand its connections

- **Actor/start:** editor and reader on owned/shared masters, kit and equipment fixtures, with multiple child rows.
- **Objective/steps:** maintain identifiers, dimensions, associations, party references and effective dates; edit
  two different rows in each sampled dialog family; inspect kit components and equipment-specific details; use
  Connections and History, then return to the same product. Select products in the list, apply a category/feature
  bulk action and reconcile row outcomes after the redirect. Visit the tab links into later activities.
- **Expected:** names, units, dates and owner context are readable; row actions target their own keys; a kit remains
  distinct from a manufacturing BOM; unauthorized transaction identities are omitted.
- **Recovery:** duplicate identifier, invalid unit/association/cycle, ended relationship, missing target, stale save,
  shared-master write refusal, mixed valid/foreign/stale bulk selections and cancel/reopen with retained input.
- **Screens/modes:** Product360 master tabs, KitComponents, Equipment, Connections and History; browser/TUI/Standard.
  Pricing, stock, methods, costs, documents and packaging continue in PRD-07–18.

### PRD-04 — Organize a multi-parent category hierarchy

- **Actor/start:** editor with two parents, one category placed under both, dated edges and product memberships.
- **Objective/steps:** create category → edit Summary → add/end parent edges → expand/find the same category in both
  tree occurrences → move one placement → maintain product membership, defaults and identifiers → reopen each path.
- **Expected:** only the chosen dated edge moves; other placements and memberships remain; counts and current/as-of
  presentation agree; list/tree navigation retains the selected record and useful find.
- **Recovery:** cycle, duplicate/overlapping edge, wrong owner, canceled move, failed child load and retry; keyboard
  alternative to drag; category-content continuation in PRD-16.
- **Screens/modes:** Categories/List/NewCategory, CategoryDetail tabs and Product360/Categories; browser/TUI/Standard,
  focused phone/tree/keyboard sample.

### PRD-05 — Maintain features, groups and compatible combinations

- **Actor/start:** editor with selectable/descriptive features, dated group membership and a category default.
- **Objective/steps:** create/edit feature and group → add/end memberships → attach group to category → apply feature
  to product → inspect affected Products → maintain required/incompatible interactions globally and feature-fixed.
- **Expected:** labels and dates explain the choices; product/category/group identity survives navigation; the
  selected and required features feed the same combinations used by PRD-06.
- **Recovery:** duplicate application, invalid/expired membership, forbidden owner, contradictory interaction,
  cancel and second-row edit/reopen.
- **Screens/modes:** Features/List/NewFeature, FeatureGroups/NewGroup, FeatureDetail, FeatureGroupDetail, both Interactions mounts, category defaults
  and Product360/Features; browser/TUI/Standard.

### PRD-06 — Generate selected variants and resume a batch

- **Actor/start:** editor on a virtual product with at least three feature axes, existing variants and forbidden combinations.
- **Objective/steps:** preview → choose axes/filter/groups/copy fields → select complete combinations across pages →
  generate → open created product and verify copied values; repeat safely; queue a separate selection → leave/reopen
  operation → process next batch → inspect item results and retry a failed item.
- **Expected:** matrix/list/phone identify the same complete keys; only selected allowed combinations are created;
  existing variants keep their identity/overrides; preview revision and durable operation stay bound to their source.
- **Recovery:** no selectable features, collision, over-limit selection, stale preview, permission change, failed
  combination, source/axis switch during a delayed request, cancel generation and navigation while loading.
- **Screens/modes:** VariantBuilder QVue and VariantBuilderTui; actual browser matrix/list/390px/keyboard and terminal
  selection/generation; Standard fallback investigated separately.

### PRD-07 — Maintain effective sales prices and review a bulk change

- **Actor/start:** price editor/reader, catalog-only reader, current/future/expired prices and quantity breaks.
- **Objective/steps:** global Prices → add/schedule/correct/end → product Prices tab → Products list selection →
  BulkPrice preview → inspect count/deltas/currency rounding → confirm → reopen prices/history and notification.
- **Expected:** sale direction, organization, unit, currency and date boundaries remain visible; preview and apply
  agree; results survive redirects and unaffected products remain unchanged.
- **Recovery:** invalid dates/amounts, overlap or stale basis, missing selected row, mixed-owner selection, canceled
  bulk operation, denied write and independent item failure where supported.
- **Screens/modes:** Prices/List, Product360/Prices, Products/List/BulkPrice and row dialogs; browser/TUI/Standard.

### PRD-08 — Build and publish a price list with understandable rules

- **Actor/start:** price editor with draft/published lists, scoped products and applicable quantity/date/counterparty rules.
- **Objective/steps:** create list → edit entries/rules and dates → preview/explain a representative result → publish
  with confirmation → inspect effective entries → clone/end or revise through offered controls.
- **Expected:** precedence and eligibility are understandable; the selected list/version of dated records is stable
  across navigation; publication does not silently broaden owner or party scope.
- **Recovery:** incomplete rule, invalid range, overlapping/competing rules, missing base, stale change, canceled
  publication and reader/direct-write refusal.
- **Screens/modes:** PriceLists/List/PriceListDetail and rule dialogs; browser/TUI/Standard; output continues PRD-10.

### PRD-09 — Explain a price and distinguish price history from estimates

- **Actor/start:** price reader with published list, quantity/unit/date/counterparty variants; separate cost reader pair.
- **Objective/steps:** Explain price → vary one input → follow selected/base/rule trace → inspect product price
  history and transaction statistics → open a source where permitted; revisit with an approved standard after PRD-15.
- **Expected:** final amount and provenance match the chosen inputs; historical transactions are labeled distinctly
  from dated catalog changes; cost bases/margins appear only with the required permissions and remain absent otherwise.
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
  unavailable PDF renderer; revisit offered purchase-direction output with PRD-11.
- **Screens/modes:** PriceListDetail/effectiveOutput, effective rows and html-print; browser and downloaded outputs,
  TUI/Standard entry/delegation as supported.

### PRD-11 — Maintain supplier offers for the right buying organization

- **Actor/start:** supplier-price editor/reader, sales-only reader, one supplier with offers for two buying organizations.
- **Objective/steps:** find offers → create/schedule/correct/end offer and quantity break → open Supplier360 → Prices
  and Documents → product Suppliers tab → review/apply an offered bulk change → explain the selected purchase price
  → return to the original find.
- **Expected:** supplier item code, buying organization, currency/unit, lead time and dates stay explicit; global,
  supplier-fixed and product-fixed surfaces refer to the same offer; sales privileges do not expose purchase values.
- **Recovery:** wrong buyer/product owner, invalid range/minimum, stale edit, ended offer, absent supplier details,
  canceled action and direct output/read refusal.
- **Screens/modes:** SupplierPrices/List, Supplier360/Overview/Prices/Documents, Product360/Suppliers and purchase
  explanation; browser/TUI/Standard. Additional operational supplier tabs are PRD-23 boundaries.

### PRD-12 — Explain available stock and maintain authorized facility policy

- **Actor/start:** reader and stock planner/manager with permitted and foreign stock, incoming supply, reservations and a kit.
- **Objective/steps:** product Stock → Summary → Locations/Movements/Reservations/Projection → permitted source
  handoff → Policy → change planning values and dated product-specific tracking exceptions as the planner → reload
  effective result; distinguish broader organization/facility defaults requiring management authority.
- **Expected:** facility/owner totals reconcile, foreign stock is absent, incoming and available quantities are
  distinct, units are clear, kit availability respects the limiting component, and product exceptions do not grant
  authority to change broader defaults.
- **Recovery:** no authorized facilities, missing location/source, invalid minimum/multiple/date, revoked facility,
  canceled policy change and unavailable downstream app.
- **Screens/modes:** all InventoryAvailability children under Product360/Stock; browser/TUI/Standard and narrow totals.

### PRD-13 — Maintain a manufacturing method through its catalog context

- **Actor/start:** method editor, separate approver/reader, matching Retail product/facility and released/draft revisions.
- **Objective/steps:** product BOM → create/revise method → add components and operations → routing/work-center
  choices → maintain setup/run/batch standards and permitted resource rates → release/link the routing → validate
  → compare revisions → approve through permitted role → explosion and where-used at two dates; inspect legacy
  import and kit distinction where offered.
- **Expected:** draft versus released/effective identity is clear; approved data is stable; component paths, units,
  phantom/subassembly behavior and routing context remain understandable; method edit, approval, resource-rate
  authority and cost visibility remain independent.
- **Recovery:** cycle, invalid component/quantity/unit, overlapping dates, missing routing/resource, stale revision,
  canceled approval, non-approver refusal and deleted/unavailable source.
- **Screens/modes:** BOM/Overview, RoutingDetail, BillOfMaterialsExplosion/Compare and WhereUsed; browser/TUI/Standard,
  selected tree/keyboard/phone variants. Cost basis continues PRD-14.

### PRD-14 — Roll up a cost and explain its missing inputs

- **Actor/start:** cost estimator/reader with released method, approved subassembly standard, phantom and by-product fixture.
- **Objective/steps:** CostRollup → select product, organization/facility, quantity/unit/date and basis → calculate →
  inspect per-path materials/conversion/overhead/by-product totals → follow source → create/open the resulting draft.
- **Expected:** lot size, setup, allocation and rounding basis are stated; approved subassembly and full calculations
  are distinguishable; incomplete findings remain visible; the displayed total reconciles to its components.
- **Recovery:** missing supplier price/standard/rate/conversion, cycle, incompatible basis, stale method, denied cost
  read and failed independent path where the contract permits continuing. Change a supplier price, approved
  subassembly standard or work-center rate after preview, then attempt save to inspect source-fingerprint recovery.
- **Screens/modes:** CostRollup/Index, BOM links and resulting StandardCosts; browser/TUI/Standard and offered export.

### PRD-15 — Approve a standard estimate and inspect the finance handoff

- **Actor/start:** estimator, separate approver and finance holder; draft/approved standards and disposable stock/accounting prerequisites.
- **Objective/steps:** draft manual standard or PRD-14 result → edit allowed components → review → approve as the
  permitted approver → reopen/clone → inspect estimate HTML/approved PDF and CostHistory; follow Request revaluation
  as the finance holder → preview → inspect confirmation/result if the later execution scope includes posting.
- **Expected:** approval separation/self-approval policy is clear; standard approval makes no stock/GL change;
  finance preview names affected on-hand quantity, dates and accounts. An authorized disposable posting is checked
  against saved valuation/ledger outcomes, never inferred from a toast.
- **Recovery:** incomplete/overlapping standard, stale approval, forbidden self-approval, missing PDF, revaluation
  disabled, missing mapping/closed period/negative stock, canceled post and non-finance refusal.
- **Screens/modes:** StandardCosts/Index and product Costs, CostHistory/Index, InventoryValuation, outputs;
  browser/TUI/Standard. Explicitly record whether posting was exercised, deferred or outside execution scope.

### PRD-16 — Maintain product documents and collaborate on the same record

- **Actor/start:** two authorized staff and non-holder; versioned product/category content and generic product/supplier attachments.
- **Objective/steps:** Documents → create/upload/edit metadata/content → preview/download → compare versions →
  restore → product datasheet; repeat managed-content entry through product and category. Separately open product
  RecordFiles and Supplier360/Documents → attach/download a record file → Chatter post/reply/mention/follow on a
  supported catalog record → recipient notification returns to the same record.
- **Expected:** language, content type, dates, parent record and resource identity persist; version/download bytes
  match the chosen content; generic record files and managed catalog documents remain understandable. Supplier
  Documents attaches files to the supplier Party and does not acquire the managed catalog version/translation UI.
- **Recovery:** missing/deleted resource, denied direct bytes, stale edit with local draft recovery, failed upload/save,
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
- **Objective/steps:** inspect Units/conversion → edit allowed noncurrency unit as ADMIN → product Packaging →
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
- **Objective/steps:** Labels → choose products/identifiers/symbology/layout/quantity → prepare → inspect decoded
  values and preview → generate/download PDF → inspect page size, dimensions, repeated labels and legibility;
  send/retry only to the configured review destination when included.
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
- **Objective/steps:** Settings/Index → change dated catalog defaults → new product; VariantSettings → new preview;
  PricingSettings → affected price/approval/explanation behavior; IdentificationTypes → identifier/label entry;
  inspect effective versus overridden values and restore review-only settings.
- **Expected:** organization, effective date and scope are clear; defaults affect the intended future operation,
  preserve explicit overrides/history, and do not grant additional authority.
- **Recovery:** invalid default/range/type, overlapping dates, stale edit, canceled save, read-only settings and
  changing a setting after a preview has already been prepared.
- **Screens/modes:** all Settings definitions and corresponding PRD-02/06–09/15/18–21 consumers;
  browser/TUI/Standard, selected phone/keyboard long form and row controls.

### PRD-23 — Reconcile permission and organization boundaries

- **Actor/start:** narrow catalog/price/supplier/cost/method roles, system/admin pair, other organization and revoked role.
- **Objective/steps:** repeat representative successful read/write/output under its non-holder; inspect direct
  detail/tab/helper/download URLs, search/choices and import/variant operations; switch active organization where
  supported; inspect shared `_NA_` records; attempt context-excluded product/supplier tabs and paid-access writes.
- **Expected:** refusal is due to the intended authority using otherwise valid inputs; hidden controls have positive
  holder counterparts; sensitive values/record IDs are absent server-side; user-supplied context cannot expand access.
- **Recovery:** logout/relogin, revoked grant/membership after page/preview load, stale saved link, missing record,
  forged app context and denied direct file/export. Keep absence, unavailability and refusal distinguishable.
- **Screens/modes:** bounded samples across §3, including Product360 PaidAccess/Replenishment/PurchaseHistory and
  inherited operational Supplier360 children; browser/TUI/Standard plus response/output inspection, not a new matrix test.

### PRD-24 — Preserve cross-app continuity and reconcile remaining modes

- **Actor/start:** Products-only user and representative authorized neighboring-app identities on the same records.
- **Objective/steps:** follow catalog Connections and authorized warehouse/purchasing/method/accounting/Commerce
  handoffs → inspect correct record and return; inspect Products report/attention links through Insights and the
  Admin catalog-health link; sample the same shared correction in a second consumer; close remaining terminal,
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
| mr-boss acceptance `acceptance/client/Products/` | ProductsPhone | 390px labels/checks/import/variant-list samples and five pricing dialogs at 1280px; not app-wide phone coverage |
| mr-boss regression `test/Shared/`, `test/Commons/` | Chatter, RecordFiles; QuickCreate, TodayPanel, Notifications | PRD-01, 16, 24; use affected shared checks without repeating the Commons review |
| mr-boss acceptance root | AppStructure, ServerStatic, TuiRender | Existing structural/render coverage; reconcile with Products render files before changing a sweep |
| mr-mantle regression `test/product/` | ProductLifecycle, ProductCatalogServices, ProductCatalogSettings, ProductFeaturePolicy, ProductVariants | PRD-02–06, 22–23; native business rules |
| mr-mantle regression `test/product/` | ProductPricePolicy, ProductPriceLists, ProductEffectivePrices | PRD-07–11; direction, provenance, bulk changes and resolved output |
| mr-mantle regression `test/product/` | ProductStockTotals, ProductMethods, ProductStandardCosts | PRD-12–15; stock, method and estimate rules |
| mr-mantle regression `test/product/` | ProductContents, ProductPackaging, ProductLabels | PRD-16–19 |
| mr-mantle regression `test/product/` | ProductCatalogCsv, ProductCatalogImport, ProductCatalogChecks | PRD-20–21 |
| webroot regression `test/client/` | WebrootVue.qvt, WebrootVue.qvt.shell, WebrootVue.qvt.layout, WebrootVue.qvt.records, WebrootVue.qvt.static, WebrootVue.qvt.views, WebrootTerminal, QvtKeys, Keys | Only for affected shared-widget/shell/renderer behavior |
| webroot acceptance `acceptance/client/` | ThemeLayout | Existing home for reusable theme/geometry checks, not permission to run it while planning |

There are **18 Products server regression files**, **one Products browser regression golden path**, **eight Products
server acceptance files** (four render specs and four fixture specs) and **15 registered Products browser acceptance
specs**. `test/client/suite.js` registers ProductsWalk; `acceptance/client/suite.js` registers the other 15 and requests
price/inventory/method/cost/tools/import fixtures alongside other apps' setup. Method/cost fixtures live in regression
despite their use by acceptance. Select a focused run deliberately and inspect setup dependencies before execution.

Neither a browser opening of VariantBuilderTui nor a rendered terminal response proves actual TUI keyboard use.
Current phone coverage is narrow, and the purchased-cost scenario does not cover every by-product/phantom/stale-input
roll-up. Shared-screen contexts and newer PaidAccess/Insights handoffs also need current live evidence. Existing
render coverage is spread across several acceptance files and root checks: reconcile overlap before extending it,
keep at most one screen sweep per app/mode, and do not add another sweep simply to satisfy this plan.

No new automation is prescribed by this planning task. If a later finding needs coverage, name the activity and
existing or new spec first: focused rule/bug assertions in regression, additional complete journeys and access,
phone or terminal walks in acceptance. Do not recreate ProductsShots or add screenshot baselines.

### Verification rules for later refinements

- Read the [testing skill](../../../../.agents/skills/testing/SKILL.md) before writing/running tests. Commands run
  from the mr-moqui root. Use affected regression specs on a suitable binary, for example
  `./moq test mr-boss --spec ProductsCatalog --nobuild`; client specs run through Moqui, not Node:
  `./moq test-client mr-boss --serve --spec ProductsWalk --nobuild`.
- Follow the supplied repository instructions: `./moq test-apps` before an application-work commit;
  `./moq test-framework` before a framework-work commit. Any later user-directed review cadence must be recorded
  explicitly. Do not copy Projects' exception or infer one from older review notes. No commit is requested here.
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
  never a screen path. Compare parse/idiom findings against baseline. This Markdown-only task needs no runtime lint.
- A shared renderer/widget correction is framework work; follow the building skill, embedded asset regeneration
  and relevant generated/precompiled checks. Do not run framework specs, `cargo test` or `test-all` merely because
  application files changed. No Rust rebuild is needed for this plan.
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
| PRD-01 — Workday/find | pending | Not executed | — |
| PRD-02 — Create/clone/lifecycle | pending | Not executed | — |
| PRD-03 — Master record | pending | Not executed; tab continuations PRD-07–18 | — |
| PRD-04 — Categories | pending | Not executed; content continuation PRD-16 | — |
| PRD-05 — Features/groups | pending | Not executed | — |
| PRD-06 — Variants | pending | Not executed | — |
| PRD-07 — Sales prices/bulk | pending | Not executed | — |
| PRD-08 — Price lists/rules | pending | Not executed; output PRD-10 | — |
| PRD-09 — Explain/history | pending | Not executed; cost basis/margin PRD-14/15 | — |
| PRD-10 — Price outputs | pending | Not executed; offered purchase direction PRD-11 | — |
| PRD-11 — Supplier offers | pending | Not executed | — |
| PRD-12 — Stock/policy | pending | Not executed | — |
| PRD-13 — Methods | pending | Not executed; cost basis PRD-14 | — |
| PRD-14 — Cost roll-up | pending | Not executed | — |
| PRD-15 — Standard/finance handoff | pending | Not executed; posting scope/prerequisites unresolved | — |
| PRD-16 — Documents/files/Chatter | pending | Not executed | — |
| PRD-17 — Translations | pending | Not executed | — |
| PRD-18 — Units/packs/scans | pending | Not executed; labels PRD-19 | — |
| PRD-19 — Labels | pending | Not executed; printer availability unresolved | — |
| PRD-20 — Import/resume | pending | Not executed | — |
| PRD-21 — Catalog checks | pending | Not executed | — |
| PRD-22 — Settings/consumers | pending | Not executed | — |
| PRD-23 — Access/scope | pending | Not executed | — |
| PRD-24 — Cross-app/modes | pending | Not executed | — |

### Findings register

No interactive findings yet. Assign `PRD-UI-001` onward only after reproducing an issue or making an explicit design
judgment. Record severity, actor/activity step, route, theme/measured geometry, reproduction, observed impact,
evidence, owning component, correction and retest. P1 blocks work or exposes restricted data; P2 materially misleads
or impedes work; P3 is a localized refinement. Keep static leads separate until investigated.

| ID | Severity | Activity / surface | Observation and evidence | Owner / correction | Retest / disposition |
| --- | --- | --- | --- | --- | --- |
| — | — | — | No live review performed | — | — |

### Static leads

These are source observations/questions, not confirmed interactive defects or passed coverage.

| Lead | Evidence and planned investigation | Activity |
| --- | --- | --- |
| Shared-context documentation drift | Shared-screen/implementation notes say only Products is implemented; current context branches and Accounting presentation are broader. Reconcile current consumers and later update the affected documentation with decided behavior | PRD-23–24 |
| Variant Standard fallback | VariantBuilder declares `vue,qvue,tui` but authors an `html,qvt` link. Verify actual mode reachability, as Projects found a similar declaration mismatch | PRD-06, 24 |
| Repeated row-dialog identity | Product360 contains fixed dialog IDs such as `EditCategories`, `EditFeatures`, `EditIdentifiers`, `EditDimensions`, `EditAssociations`, `EditParties`, `EditKitComponents`, `EditEquipment`. Exercise two rows and post-reload/static QVT behavior before classifying | PRD-03–05 |
| Variant asynchronous ownership | QVue preview/batch handlers update shared state after awaiting requests, without an obvious request-generation guard. Reproduce source/axis/operation changes and late success/failure before deciding whether correction is needed | PRD-06 |
| Newer shared tabs | PaidAccess is read-only in Products but shares a mutation-bearing source with Commerce; Product360/Supplier360 inherit context-excluded children. Check controls and service/direct-route boundaries | PRD-23–24 |
| Historical output evidence | Old notes include PDF failures, later passes, removed shots and broad render counts. Establish current capability and inspect actual outputs; do not carry either old outcome forward | PRD-10, 15–16, 19 |

### Bounded batch record

**Planning batch, 2026-11-09:** read the Projects pattern, document convention, application/style/review guidance,
Products design/implementation/research, current screen mounts/context code, demo roles and test registrations.
Two delegated source audits covered inventory and activities/tests. Produced this plan only. No runtime, browser,
database, build, test, acceptance fixture or application mutation was used. Document validation and independent
plan review confirmed 44 local XML definitions, 74 Shared sources, the 18/1 regression and 8/15 acceptance file
counts, current spec references, relative links and the 24-activity pending ledger. Corrected review comments on
feature-list wording, supplier attachments and product-specific tracking authority; added explicit stale-cost,
packaging-history and lifecycle-continuity checks. All live coverage remains pending.

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
into the framework review guide. This planning task is complete when the document is accurate and reviewable;
it does not close any live activity.

## 7. Decisions

- **Execution boundary:** this request writes the plan only. Live execution, correction batches, acceptance selection
  and any commit/push instructions belong to a subsequent request; no prior Projects exception is assumed.
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
  Verify method/cost owner alignment and only add narrowly missing roles/data.
- **Tool capability:** measure browser dimensions/zoom and terminal interaction; verify PDF/content resource support
  and whether a safe printer is available. Leave unsupported variants explicit.
- **Finance extent:** choose whether PRD-15 stops at an inspected revaluation preview/cancel or includes an actual
  posting in the disposable database under finance authority; record the choice and required accounts/periods.
- **Automation selection:** identify existing acceptance specs the next execution request actually asks to run.
  The map in §5 is available coverage, not a default command to run all of it.
