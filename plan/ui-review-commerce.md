# IronStone BOSS — UI review: Commerce

Contents: [scope and sources](#1-purpose-scope-and-sources) · [method](#2-review-method-and-refinement-criteria) ·
[surface inventory](#3-screen-and-surface-inventory) · [activities](#4-end-to-end-activities) ·
[verification](#5-existing-checks-and-future-verification) · [running record](#6-coverage-findings-and-running-record) ·
[decisions](#7-decisions).

## 1. Purpose, scope and sources

Review Commerce as the staff workspace for running a store: establish what it sells and where, prepare the public
experience, publish deliberately, explain the customer's offer, and follow purchases into fulfillment, access and
recovery. Cover physical products, digital delivery and subscriptions. Staff should always know the store, customer,
publication state, currency and next responsible owner, including when an action belongs to another application.
Review the whole implemented application, including its shared descendants and outputs, without turning historical
design candidates into new features.

This follows [Accounting](ui-review-accounting.md), [Products](ui-review-products.md) and the
[review document convention](design-doc-guide.md#ui-review-and-refinement-phase). Its public companion is the
[Shop review](../../mr-pass/plan/ui-review-shop.md). Research preserves comparisons, design describes intended behavior,
implementation records construction, and these two files hold the current review plan and later bounded execution record.

**Status: planning only, 2026-11-10 America/Chicago.** All live activity and mode coverage is pending. Source inspection
and document review establish a plan, not a passed UI review. No runtime, browser walk, build, test or provider exercise
was performed for this document. Documentation completion does not authorize acceptance execution.

### Inputs and source map

- [Commerce research](research-commerce.md), [design](design-commerce.md), [implementation](impl-commerce.md),
  [crosscut design](design-crosscut.md) and [style guide](style-guide.md).
- [Shop design](../../mr-pass/plan/design-shop.md), [implementation](../../mr-pass/plan/impl-shop.md),
  PASS `README.md`, its deployment documentation and current site/authority contracts. Use the companion review for
  public page details rather than importing the BOSS shell into Shop.
- [Application practices](../../../../../docs/dev/Practices-App-Dev.md),
  [UI review guide](../../../../../docs/dev/UI-Review.md), [building/testing rules](../../../../../docs/Build-Test.md),
  repository README hierarchy and `.agents/skills/building/SKILL.md` / `.agents/skills/testing/SKILL.md`.
- [Warehouse](ui-review-warehouse.md), [Customer Service](ui-review-customer-service.md), Accounting and Products reviews
  for bounded ownership handoffs; the Commons/drawers review for existing evidence and communication widgets.

| Current source family | Contract inspected and review use |
| --- | --- |
| `screen/Commerce.xml`, `screen/Commerce/`, `screen/Shared/` | Root authorization/context, ten areas, explicit shared mounts, physical descendants, transitions and actual controls |
| `template/CommerceParts.xml`, `CommerceReportParts.xml`, `CommerceOrderDetail.xml`, `CommerceCustomer360.xml`, `CommerceRequestDetail.xml`, `CommerceReturnDetail.xml` | Scoped choices, report outputs and Commerce-specific operational branches |
| `service/ironstone/commerce/ContextServices.xml`, `Commerce.js`, `ReportingServices.xml`, `Reporting.js`, `DemoServices.xml`, `Demo.js` | Store scope, capabilities, palette/record/call links, report basis and repeatable fixture preparation |
| `data/BossSetupData.xml`, `BossUsersDemoData.xml`, `BossCommerceDemoData.xml`, `BossZCommerceDemoData.xml`, `BossZZCommerceForumDemoData.xml`, `BossCommerceReportData.xml` | Groups/grants, staff restrictions, stores/sites, theme/catalog/order/subscription examples and report definitions |
| Mantle `service/mantle/product/StoreAdminServices.xml`, `StoreMerchandisingServices.xml`, `StorePromotionServices.xml`, `StoreChannelServices.xml` and their scripts | Dated settings, readiness, assortment/publication, moderation, promotion limits, intake/import/feed contracts |
| Mantle `service/mantle/public/ThemeServices.xml` and implementation scripts | Pages/navigation, revision guards, theme authoring, preview isolation, immutable release/restore and public projections |
| Mantle `service/mantle/order/StoreOperationsServices.xml`, `ShopOperationsServices.xml`, `ShopCartServices.xml`, `ShopCheckoutServices.xml` | Scoped staff reads, reorder, consent-based recovery, stuck placement and checkout/payment identity |
| Mantle `service/mantle/product/ShopSubscriptionServices.xml`, public site/authority services and party customer services | Paid-access bindings, recurring offers/contracts, renewal/payment/access separation and local/remote authority |
| PASS `screen/Shop.xml`, `screen/Shop/`, `service/`, `theme/starter/`, `MoquiConf.xml` | Published storefront consumer, HTML forms, optional Vue, guest capabilities, downloads and Support/Billing handoffs |
| BOSS `test/Commerce/`, `test/client/Commerce/`, `test/acceptance/Commerce/`, `test/acceptance/client/Commerce/`, both client `suite.js` files | Actual rules, selected renders, one regression golden path and separate acceptance scenarios |
| Mantle `test/product/`, `test/order/`, `test/public/`; PASS Shop regression/acceptance specs | Business-rule assertions and companion scenarios; no result is inherited as live review evidence |

Use earlier comparisons as lenses: Odoo's store/order triage and website authoring, Frappe's content/portal patterns,
Dolibarr's CMS/public boundaries and the Moqui/ridgecrest store integration lineage. These are the comparisons already
recorded in research, not fresh external verification or a request to reproduce another product's inventory.

### Ownership and implemented boundaries

| Work | Owner and boundary |
| --- | --- |
| Store workspace, scoped lists, forms, editor shells and operational evidence | Commerce/BOSS; server-derived context is required, and a mount never grants permission |
| Catalog master, prices, files and stock explanations | Shared Products/Warehouse services/screens; Commerce owns assortment and publication, not unrestricted master/cost/supplier editing |
| Store configuration, promotions, publication, theme packages and commerce rules | Mantle; services must enforce store/organization/permission boundaries independently of BOSS |
| Public rendering, checkout, public identity, downloads and self-service | PASS Shop over Mantle authority; a published shop must operate without a BOSS runtime |
| Site hosts, mounts, authority and credentials | PASS site operator / appropriate administration owner; StoreDetail/Sites is a read-only consuming view |
| Order changes, cancellation proposals, returns authorization and public case replies | Customer Service; Commerce reads and links, and may add explicitly internal case/order notes |
| Physical receipt/shipment/return disposition | Warehouse; Commerce consumes fulfillment status, not warehouse execution controls |
| Payments, holds, refunds, invoice settlement and financial records | Accounting/Mantle; the explicit stuck-placement resolver is Commerce's bounded recovery action, not a general refund desk |
| Product paid-access bindings and recurring store operations | Commerce/Mantle; paid term, renewal, charge and entitlement are separate states, with customer recovery in Shop |
| Chatter, files, notifications, Comms and approvals | Existing shared infrastructure; inspect record identity, audience and return path without repeating another whole-app review |
| Reports/readiness registrations | Commerce owns its store basis; Insights/Admin consume registered providers where currently installed |

Current source supersedes historical “six placeholders,” “implementation future” and completed-phase deferrals.
Pages, theme editing/release, reviews, recovery, subscriptions, channel import, feeds and reports are implemented.
`BossSetupData.xml` now registers Commerce readiness/settings and capabilities; do not repeat old statements that
Admin registrations are necessarily absent. Inspect an external owner's current registration before promising a link.
There is no separate Commerce implementation guide in `docs/` to assume or link.

Theme release is not product or page publication. Publishing pins immutable files and switches the site's binding and
generation; restore rechecks compatibility and retains current product/page publication. A draft save never makes a
product, page or theme live by itself. Store groups select stores; they do not share settings. Cloning creates an
unpublished store without a site mount. Customer360's Commerce branch is one scoped overview with no ordinary tabs.

Keep still-absent Liquid compatibility, theme marketplace, git-backed themes, POS, advanced B2B, loyalty, gift-card/store
credit and click-and-collect workflows outside this review. Do not infer a feature from a generic enum, shared descendant
or historical design table. Preserve route names, keys, date/revision/operation identities, preferences and saved finds.

## 2. Review method and refinement criteria

### Future environment and fixtures

Use the repository review guide and building/testing skills when execution is separately requested. One coordinator owns
an isolated runtime, fresh disposable database, linked Mantle/BOSS/PASS components and mutable config. The guide's bare
framework bootstrap does not include app components. Different ports alone isolate neither databases nor cookies: use
separate hostnames for staff, public shops, preview hosts and independent customer sessions. Keep uploads, downloaded
artifacts, captured mail, provider doubles and evidence separate from working data. A component symlink still writes to
source; avoid accidental source mutation through runtime files.

Record source/binary revisions, loaded components, runtime/database paths, hostnames/ports, fixture setup, clock/zone,
mail sink and output directory before a live batch. Confirm the actual compiled web assets, TUI availability and remote
authority configuration. Restore temporary grants/configuration/preferences and stop listeners afterwards. Missing
browser/terminal/provider/authority/media tooling leaves that branch unverified, not passed through a proxy.

`POPC_DEFAULT` is the Retail store in `ORG_ZIZI_RETAIL`; `BOSS_COM_DIGITAL` belongs to `ORG_ZIZI_SERVICES`.
`ZIZI_SHOP` and `ZIZI_DIGITAL` are the corresponding demo sites, initially disabled until deliberately made ready and
published. Shop hosts include `shop.zizi.localhost` and `digital.zizi.localhost`; provision distinct preview hosts through
the site owner. Do not silently activate existing demo sites or send real customer mail. The foreign Accounting store
`BOSS_ACCT_STORE` belongs to `BOSS_ACCT_ORG`, outside ordinary Commerce scope.

| Actor | Existing starting point; verify effective grants before use |
| --- | --- |
| Reader | `commerce.read`: launcher, catalog read and store scope; no implied order, report or mutation authority |
| Manager | `commerce.manager`: store settings/promotion work and price reads; no blanket publishing or source editing |
| Merchandiser | `commerce.merchandiser`: assortment/categories/review moderation; borrowed price read, not price edit |
| Designer | `commerce.designer`: visual theme/content authoring; no source-code edit or publication by default |
| Theme developer | `commerce.developer`: theme editing plus `COMMERCE_THEME_CODE`; no publish by implication |
| Publisher | `commerce.publisher`: product/page publication and `COMMERCE_THEME_PUBLISH`; distinct from designer |
| Store operator | `commerce.operator`: orders/customers, recovery and price reads; cannot resolve stuck placement by default |
| Channel operator | `commerce.channel`: integrations/import/feed operations and appropriate reports; no general order-note authority |
| Subscription operator | `commerce.subscriptions`: contract operations and scoped orders; paid-access binding changes need the actual service checks |
| Store administrator | `commerce.admin`: composed permissions including placement resolution and all-organization scope; never the sole negative-role fixture |
| Store-limited / foreign organization | `commerce.storestaff`, `commerce.services`; create a second same-organization store to separate store isolation from organization isolation |
| Neighboring and public identities | Products price owner, Warehouse operator, Accounting payment owner, Customer Service agent; guest, verified customer, another customer, unverified account and foreign-site account |

Groups are composed, not nested assumptions. Current `StoreStaff` rows restrict a person to assigned stores but grant
no permission. A non-limited user works their permitted organizations' stores. Pair every denied action with the same
otherwise-valid input under its holder. A system administrator is unsuitable for verifying ordinary isolation. Test
selected-value lookups, direct links, hidden transitions, shared descendants, output bytes and authority calls, not just
menus. Check missing and inaccessible records for equivalent safe responses.

Prepare physical, digital-only, mixed and subscription orders; a virtual product with multiple saleable variants; current,
future and expired category/store/product bindings; unpublished/withdrawn products and pages; a store with no site;
local/remote authority sites; a published release and unpublished draft; shared categories; two customers and guest carts.
Use `CommerceSpecLib.js` and demo loader identities as starting points, not immutable fixture state. `BOSS_CS_SO_DELIVERED`
and `CustJqp` are useful existing store order/customer references; `BOSS_CS_SO_OTHER` lacks the matching store context.
Discover generated theme, cart, feed, page and contract IDs from the prepared runtime instead of inventing fixed IDs.

Prepare captured payment with failed placement, uncertain payment, declined renewal, paid-term cancellation, expired
recovery link, two competing revisions, partially invalid publication/review/import batches, malformed theme package,
unsafe source and mixed feed outcomes. Use synthetic provider responses and local mail only. Never provoke a real charge,
refund, shipment, public release or customer contact as a review fixture. Remote fixtures must distinguish timeout before
a mutation from a lost response after it, preserving operation identity on reconciliation.

Record the execution date/zone and regenerate time-sensitive fixtures: date bands, publication schedules, rate/promotional
windows, idle carts, recovery retention, terms versions, prepaid boundaries and renewal attempts. Include large/empty lists,
long/localized labels, fractional quantities, multiple currencies where supported, two repeated row dialogs, expired grants,
a deleted record, a foreign same-looking name and realistic masked customer details.

### Visual, interaction and evidence standards

- Material `/qapps`: light/dark at **1920×1080**, selected **1280px** and **390px**, keyboard-only and actual **200% zoom**.
  Record dimensions and zoom tooling. Inspect scope pickers, lists, detail headers, action priority, dialog overflow,
  validation placement, loading/empty/partial/error states and return navigation.
- TUI: interact with the actual terminal, including its custom alternatives and ordinary forms. A model-document render
  is supporting evidence only. Inspect focus, selection, scrolling, confirmation, retry and persisted result.
- Standard `/apps`: bounded functional/fallback/output checks. The visual/source/category custom Vue pages offer explicit
  form twins; do not assume full custom-editor parity or call a JSON response a rendered fallback.
- Apply contrast thresholds to composited backgrounds: **4.5:1** ordinary text, **3:1** qualifying large text and meaningful
  controls/states. Check disabled text, chips, drag controls, focus, masked values and preview backgrounds.
- Keep store/site, draft versus live release, revision, currency, date basis, customer identity and ownership visible at the
  point of decision. Destructive actions describe the actual consequence and retain a safe cancel/back path.
- Review drag actions with keyboard alternatives; unsaved navigation, stale revision and retry must preserve or explain
  work. A successful toast alone never proves the intended row changed. Reopen and inspect the persisted result.
- Public outcomes use Shop's ordinary HTML/forms, optional Vue, JavaScript-disabled/responsive/accessibility criteria.
  No Shop terminal workflow is invented. The companion owns public-detail execution; Commerce records paired evidence.
- Capture actual output MIME/body, filenames, row/filter/scope/column basis and safe data. Inspect print layout and exported
  CSV/XLSX/JSON/feed files, including denied direct requests. Preview images and download links are separate outputs.

Each activity record identifies actor, starting fixture, exact route/actions, observed state, persisted result, mode and
evidence location. Record source concerns separately until reproduced. A regression correction needs the smallest rule or
owned-template assertion; a scenario/matrix belongs in acceptance under the current execution rules.

### Ordered review waves

| Wave | Activities | Prerequisite and purpose |
| --- | --- | --- |
| 1 — scope and store foundation | COM-01–COM-07 | Verify actors, store/site selection and safe checkout configuration before public work |
| 2 — what the store sells | COM-08–COM-13 | Assortment, shared context, paid access, price/availability and deliberate publication |
| 3 — public presentation | COM-14–COM-20 | Pages/navigation, draft tools, preview, release and companion state continuity |
| 4 — customer offer and operations | COM-21–COM-28 | Promotions/reviews; physical/digital purchases, recovery, returns, identity and subscriptions |
| 5 — channels and evidence | COM-29–COM-33 | Intake/import/feed/report outputs, hidden helper isolation and cross-app closure |

### Companion activity checkpoints

Use the same store/site and record identities on both sides of each handoff. Link the resulting staff and customer
evidence; each activity retains its own pending modes until exercised. A handoff does not grant the next owner's
permission or call for repeating an already completed business operation.

| Paired flow | Commerce activities | Shop activities | Contract to reconcile |
| --- | --- | --- | --- |
| Assortment, pages, navigation and theme release | COM-08–COM-09, COM-13–COM-20 | [SHP-01–SHP-08](../../mr-pass/plan/ui-review-shop.md#shp-01--enter-the-right-published-store) | Draft saves, product publication, page/navigation publication and immutable theme activation are separate. Restore preserves current publication decisions and customer state; preview requires its separate authority host |
| Prices, promotions, availability and checkout settings | COM-05–COM-07, COM-11–COM-12, COM-21 | [SHP-04](../../mr-pass/plan/ui-review-shop.md#shp-04--understand-and-price-the-exact-selection), SHP-09–SHP-10, SHP-13–SHP-16, SHP-26–SHP-27 | Compare the actual customer offer, delivery/tax, terms and consent with authoritative store configuration; a changed offer requires review before payment |
| Cart, payment attempt, order and recovery | COM-23–COM-25 | [SHP-09–SHP-21](../../mr-pass/plan/ui-review-shop.md#shp-09--start-a-guest-cart-from-a-precise-product-choice) | Preserve attempt/operation identity through uncertainty and lost responses. Distinguish minimal reference-and-key-only confirmation from the originating cart's full result, and paid-but-unplaced recovery from payment-hold release |
| Fulfillment, downloads and subscriptions | COM-12, COM-23, COM-26, COM-28 | [SHP-18–SHP-29](../../mr-pass/plan/ui-review-shop.md#shp-18--recognize-confirmation-and-the-next-fulfillment-step) | Warehouse physical work, Accounting settlement and Mantle access remain separate. Download scope is distinct from OrderView; cancel retains the paid term, and a refund affects its own access source |
| Moderation, cart recovery, feeds and reports | COM-22, COM-25, COM-31–COM-32 | [SHP-08](../../mr-pass/plan/ui-review-shop.md#shp-08--inspect-discoverability-and-catalogue-feeds), SHP-12, SHP-18, SHP-30, SHP-32 | Approved review content, explicit consented recovery, current published feed bytes and report/order basis must agree. A feed build or mail request alone is not a public outcome |
| Guest capabilities, signed-in identities and Support | COM-26–COM-27, COM-33 | [SHP-11](../../mr-pass/plan/ui-review-shop.md#shp-11--sign-in-merge-the-proven-cart-and-sign-out), SHP-19–SHP-25, SHP-31–SHP-32 | Guest intake stays within one order and returns receipts; account claims require verified ownership. Commerce internal notes do not become public replies or account impersonation |
| Local/remote authority, isolation and outage | COM-13, COM-20, COM-24, COM-28, COM-31, COM-33 | [SHP-33](../../mr-pass/plan/ui-review-shop.md#shp-33--preserve-isolation-and-recover-from-authority-or-job-outage), SHP-01, SHP-06–SHP-08, SHP-17 | Published Shop depends on PASS/Mantle authority without BOSS. Enforce store/customer scope, generation-aware refusal and safe reconciliation; draft preview topology is a separate prerequisite |

## 3. Screen and surface inventory

Inventory is a static route census, not evidence that every route is reachable or authorized. Current physical-child plus
explicit-mount recursion produces **149 route instances: 57 local XML screens including the root, and 92 Shared instances**.
Names below are relative to `/Commerce`; Material and Standard shell prefixes are applied at execution. A grouped row
names every member and applies its mapping to every member. Hidden inherited children still require supporting inspection.

### Local routes and first-level mounts

| Route(s) | Implemented surface, controls and activity |
| --- | --- |
| `/`, `Home` | Root organization/store context, menu/palette/call providers; Home work queues, reporting period, store choices and channel health; COM-01, COM-32, COM-33 |
| `Stores`, `Stores/Stores` | Area/list, filter, New store and row readiness; COM-02 |
| `Stores/StoreDetail` | Header, Clone store preview/confirm, CSV and print summaries, readiness/fix links; COM-02, COM-04, COM-33 |
| `Stores/StoreDetail/General` | Identity, organization, defaults, reason/revision, readiness and Warehouse reservation link; COM-02 |
| `Stores/StoreDetail/Sites` | Read-only sites, host/mount/state/served information; COM-02, COM-19 |
| `Stores/StoreDetail/Facilities`, `Staff` | Dated binding add/end, organization-scoped choices, priority and staff limitation; COM-03 |
| `Stores/StoreDetail/Emails`, `OrderChecks` | Registered notice templates and checks, typed parameters, sequence, date/end; COM-03 |
| `Stores/StoreDetail/SearchContent`, `Settings`, `History` | Search documents/content spaces, typed dated settings and attributable history; COM-03 |
| `Stores/StoreGroups` | New/edit group, Add store, Add party, dated end actions; COM-04 |
| `Settings`, `Settings/CheckoutSettings` | Readiness, policy, shipping options/gateways/rates/simulator, payment bindings, tax preview, recovery policy and recurring offers; COM-05–COM-07, COM-12, COM-25 |
| `Merchandising`, `Merchandising/Assortment` | Store/status/product search, store-product row dialog, publication proposal; COM-08, COM-13 |
| `Merchandising/PublishProducts` | Hidden publication preview/confirmation, per-product result and withdrawal; COM-13 |
| `Merchandising/StoreCategories`, `StoreCategoriesTui` | Vue tree drag/step and member read; explicit role/membership/move form twin; COM-09 |
| `Merchandising/Reviews` | Filters, bulk moderation, per-review decision/reply/withdraw reply and image transition; COM-22 |
| `Merchandising/Documents`, `Merchandising/PriceLists` | Local wrappers around shared lists/details, not duplicate master editors; COM-10, COM-11 |
| `Website`, `Website/Navigation` | Area, menus/items/order/hierarchy, publish/withdraw and redirects; COM-15 |
| `Website/Themes` | New theme from starter and Import theme package, store/state search; COM-16 |
| `Website/ThemeDetail` | Identity, Validate, Edit theme/source, publish-per-site, bindings, releases, Restore and JSON export; COM-16, COM-20 |
| `Website/ThemeEditor`, `ThemeEditorTui` | Vue composition/settings/assets/translations/page assignment with form alternative; COM-17, COM-19 |
| `Website/TemplateEditor`, `TemplateEditorTui` | Vue file tree/source/diff/diagnostics and form source/file-operation alternative; COM-18 |
| `Orders`, `Orders/Orders` | Store/customer/channel/status/payment/fulfillment triage, stuck cart link versus placed detail; COM-23, COM-24 |
| `Orders/Carts`, `CartDetail` | Cart state/activity/items/checkout evidence, Send recovery and explicit Resolve placement; COM-24, COM-25 |
| `Orders/Returns` | Scoped return find and read-only detail link; COM-26 |
| `Orders/LogNote` | Hidden Comms/order-context internal-note form; COM-23, COM-33 |
| `Customers`, `Customers/Customers` | Store customers and account/order context, not general party directory; COM-27 |
| `Customers/Requests` | Store-linked Support cases and operational detail; COM-26 |
| `Customers/Subscriptions`, `SubscriptionDetail` | Filters, paid-through/next renewal/access; retry/cancel dialogs and origin/renewal orders; COM-28 |
| `Promotions` | Shared promotion/code area; COM-21 |
| `Integrations`, `Integrations/Integrations`, `IntegrationDetail` | Registered connector binding/mapping, enablement and message detail/retry; managed EDI branch has read-only connection/profile summary, `EdiDocuments`, `EdiInterchanges` and `RetryEdiDocuments`, with safe exception summaries; COM-29 |
| `Integrations/ChannelImport` | File-upload stage, preview, digest/reason commit and independent order results; COM-30 |
| `Integrations/Feeds`, `FeedDetail` | New/configure/end, build, preview/download, publish and build history; COM-31 |
| `Reports`, `Reports/ReportsHome`, `OnlineSales`, `CartRecovery`, `PromotionUse`, `ChannelHealth` | Report catalogue, filters/date basis, rows/drill links and CSV; COM-32 |

For local rows using shortened sibling names, retain the preceding full parent: for example `Staff` is
`Stores/StoreDetail/Staff`, `TemplateEditorTui` is `Website/TemplateEditorTui`, and `ChannelHealth` is
`Reports/ChannelHealth`. This does not create root-level aliases.

### Shared mounted routes and every inherited descendant

| Commerce route prefix | Exact mounted/inherited surfaces and supporting inspection |
| --- | --- |
| `Merchandising/Documents` | `Index` → Shared/Documents; `DocumentDetail` → Shared/DocumentDetail. List/detail/file read and allowed owner actions; COM-10, COM-33 |
| `Merchandising/PriceLists` | `List` → Shared/PriceLists; `PriceListDetail` → Shared/PriceListDetail, including effective-price CSV/XLSX; COM-11, COM-33 |
| `Merchandising/PriceExplain` | Shared price explanation, customer/date/quantity/store basis; COM-11 |
| `Merchandising/Product360` | Shared root with Commerce publication/review context and catalog capability filtering; COM-10–COM-13, COM-22 |
| `Merchandising/Product360` ordinary physical children | `Associations`, `Categories`, `Connections`, `Dimensions`, `Documents`, `Equipment`, `Features`, `History`, `Identifiers`, `KitComponents`, `PaidAccess`, `Parties`, `PurchaseHistory`, `Replenishment`, `Summary`; map each to COM-10 or paid-access COM-12, with direct-route restrictions in COM-33 |
| `Merchandising/Product360/Documents/Index` | Nested Shared/Documents under the product wrapper; document scope and retained product context, COM-10, COM-33 |
| `Merchandising/Product360` explicit children | `InsightsRecord` → Shared/InsightsRecord; `Packaging` → Shared/Packaging; `Prices` → Shared/Prices; `Suppliers` → Shared/SupplierPrices; `Costs` → Shared/StandardCosts; COM-10, COM-11, COM-33. Cost/supplier mounts do not imply Commerce capabilities |
| `Merchandising/Product360/Stock` | Shared/InventoryAvailability plus `Locations`, `Movements`, `Policy`, `Projection`, `Reservations`, `Summary`; COM-11, COM-33 for each, respecting actual facility/product scope |
| `Merchandising/Product360/BOM` | Shared/BillOfMaterialsDetail plus `Overview`, `BillOfMaterialsExplosion`, `BillOfMaterialsCompare`, `WhereUsed`, `RoutingDetail`; COM-10, COM-33 supporting inherited-route checks, not a Commerce manufacturing workflow |
| `Merchandising/CategoryDetail` | Shared root plus `Content`, `FeatureDefaults`, `Identifiers`, `Parents`, `Products`, `Summary`; COM-09, COM-10, COM-33. Commerce category moves/membership use Store categories, not generic parent/member writes |
| `Merchandising/CategoryDetail/Content/Index` | Shared/CategoryContent; its `Index` mounts Shared/Documents. Both nesting levels belong to document/category context checks, COM-10, COM-33 |
| `Merchandising/InventoryAvailability` | Shared root plus `Locations`, `Movements`, `Policy`, `Projection`, `Reservations`, `Summary`; COM-11, COM-33, independently from Product360/Stock alias |
| `Orders/OrderDetail` | Shared root's CommerceOrderDetail template, read-only operational cards/rows, Order again, owner links and notices; COM-23 |
| `Orders/ReturnDetail` | Shared root's CommerceReturnDetail template, read-only quantity/receipt/settlement and owner links; COM-26 |
| `Customers/Customer360` | Shared root's CommerceCustomer360 template, store/account/customer/order/cart/case/return/subscription overview without ordinary tabs; COM-27 |
| `Customers/Customer360` physical children | `Activities`, `Agreements`, `Contact`, `Credit`, `Files`, `FinanceDetails`, `Money`, `Orders`, `ServiceActivities`, `ServiceBilling`, `ServiceCases`, `ServiceDeliveredItems`, `ServiceOrders`, `ServiceOverview`, `ServiceReturns`, `ServiceStatistics`; all COM-27, COM-33 supporting direct-route inspection, not promised visible Commerce tabs |
| `Customers/Customer360/InsightsRecord` | Explicit Shared/InsightsRecord child, COM-27, COM-33; inspect effective scope/availability without adding a Commerce analytics workflow |
| `Customers/RequestDetail` | Shared root's CommerceRequestDetail template, case read/internal note and Customer Service link; COM-26 |
| `Promotions/Promotions`, `PromotionDetail`, `PromoCodes`, `PromoCodeDetail` | Shared lists/details, typed rules/products/limits, preview/generate codes, expire/customer restriction/usage; COM-21 |
| `Website/Pages`, `Website/PageDetail` | Shared pages list/root; `PageContent`, `PageHistory`, `PagePublication`, `PageRoute`, `PageText` inherited children; COM-14 |
| `Chatter`, `Chatter/ChatterTui` | Shared evidence/conversation and terminal helper with Commerce record identity/audience; COM-33 |
| `RecordFiles`, `RecordFiles/RecordFilesTui` | Shared attachment surface and terminal helper, authorized upload/read/download scope; COM-33 |

Supporting inspection means enter the actual mounted URL with an authorized fixture and a denied counterpart, inspect
its server response and retained scope, and document whether the consuming context intentionally refuses it. It does not
mean exposing a hidden route in navigation or copying another application's editor into Commerce. For shared fixes,
select a second legitimate consuming application and verify its contract with its own role.

### Custom variants, helpers, dialogs and outputs

| Surface | Inventory and required inspection |
| --- | --- |
| Category Vue | `StoreCategories.qvue`: store selector, selected category/member/role lists, drag/drop, up/down, error/busy handling and form-view navigation. `StoreCategoriesTui.xml` supplies role/membership edits and move forms; COM-09 |
| Visual theme Vue | `ThemeEditor.qvue`: template/device selector, outline, add/duplicate/hide/remove/reorder, undo/redo, unsaved warning, explicit Save, settings/schema fields, assets, translations, page assignment and framed preview; COM-17, COM-19 |
| Source Vue | `TemplateEditor.qvue`: files, source, diff/diagnostics, save/validate, file operations and form-view path; COM-18 |
| Editor XML alternatives | `ThemeEditorTui` moves sections, edits settings and obtains preview links; `TemplateEditorTui` selects text/source, saves with digest/revision and adds/renames/removes files with dependent confirmation. These are actual alternatives, not identical editor feature sets; COM-17–COM-19 |
| Inline render variants | Authored `render-mode` sections occur in Stores, StoreDetail and its General/Facilities/Staff/Emails/OrderChecks/SearchContent/Settings/Sites tabs, Assortment, PublishProducts, Reviews, Subscriptions, CheckoutSettings, Themes, ThemeDetail, Navigation and the StoreCategories/ThemeEditor/TemplateEditor dispatchers. Shared screens have their own variants. Inspect actual branch selection/labels, not only a blanket renderer result; COM-02–COM-03, COM-05–COM-08, COM-13, COM-15–COM-16, COM-20, COM-22, COM-28 |
| Shared page editor | `PageContent` custom content editor and helper `setup`, `page`, `history`, `diff`, `attachment`, `savePage`; `PageText` is the ordinary versioned text form. History/publication/route remain distinct tabs; COM-14 |
| Common JSON choices | Included `choices`, `storeOptions`, `catalogChoices`, `promotionOptions`; Home choices and CheckoutSettings `checkoutOptions`. Search and selected-value resolution must enforce the same scope as save; COM-01–COM-12, COM-21, COM-33 |
| Theme JSON helpers | ThemeEditor `editorData`, `saveComposition`, `saveSettings`, `saveTranslations`, `uploadAsset`, `assignTemplate`, `preview`; TemplateEditor `files`, `file`, `diff`, `saveFile`, `fileOperation`, `validate`; `ThemeCalls.js` envelopes must retain safe errors/revisions; COM-17–COM-19, COM-33 |
| Store dialogs | NewStore, CloneStore, NewStoreGroup, AddGroupStore, AddGroupParty; AddStoreFacility/Staff/Email/Setting, AddOrderCheck, SetSearchDocument, AddContentSpace and end actions; COM-02–COM-04 |
| Checkout dialogs | ChangePolicy; Add/RemoveShipOption; Add/RemoveShipGateway; Add/Change/EndRate; Add/RemovePaymentGateway binding; ChangeTax; ChangeRecovery; New/Change/EndOffer. Repeated row IDs must affect their own record; COM-05–COM-07, COM-12, COM-25 |
| Publication/content dialogs | StoreProduct row dialog, review publish confirmation, review decision/reply, page publish/withdraw, menu creation/rename/publish/items/redirects; COM-08–COM-09, COM-13–COM-15, COM-22 |
| Theme dialogs | NewTheme, ImportTheme, PublishTheme per site, RestoreRelease per release; unsaved/source dependent confirmation and asset upload; COM-16–COM-20 |
| Operational dialogs | CommerceOrderAgain, CommerceRequestNote, ResolvePlacement, RecoverCart, RetryRenewal, CancelRenewal, NewBinding, NewFeed, EndFeed, PublishFeed; COM-23–COM-31 |
| Promotion dialogs | NewPromotion, typed rule parameter, AddPromotionProduct, NewCode, GenerateCodes preview/confirm, AddCodeParty and expiration; COM-21 |
| Managed EDI controls | IntegrationDetail suppresses Binding/Mapping editors for managed connections, shows rejected documents/quarantined interchanges and offers Retry selected only for eligible EDI documents, with reason/operation key. Connection/profile/transport remain the EDI administrator's; no owner navigation link is rendered here; COM-29 |
| Store summary | StoreDetail `exportSummary` CSV and `printSummary` printable HTML. Inspect values/readiness, masked configuration, correct store and page layout. Printable HTML is not a promised PDF; COM-04, COM-33 |
| Inherited price outputs | PriceListDetail `EffectivePrices`, Product360/Prices `Prices`, Product360/Suppliers `SupplierOffers` declare CSV and XLSX. Check actual consuming-context eligibility, selected/filtered columns and bytes; pair restricted supplier output denial with a permitted Products/Purchasing owner, not a fabricated Commerce grant; COM-11, COM-33 |
| Price explanation CSV | `Merchandising/PriceExplain` → Shared/PriceExplain `PriceTrace`; inspect explanation rows under the same permitted store/customer/date/quantity basis, including denied price readers; COM-11, COM-33 |
| Packaging CSV | `Merchandising/Product360/Packaging` → Shared/Packaging `Packaging`; inspect allowed product-pack/base-product/date/history filters and actual rows, with unauthorized product counterpart; COM-10, COM-33 |
| Inherited stock CSV | Both `Merchandising/InventoryAvailability/{Locations,Movements}` and `Merchandising/Product360/Stock/{Locations,Movements}` declare `ProductLocations` and `ProductMovements` CSV. These child screens require `appRoot == 'Warehouse'`: inspect denied direct Commerce requests for both aliases, and actual authorized Warehouse output/row scope separately; COM-11, COM-33 |
| Inherited BOM overview CSV | Product360/BOM/Overview declares `ReleasedBomItems`, `DraftBomItems`, `BomReleaseHistory`; Commerce's shared context disables method capability. Inspect denied Commerce exports, then authorized Products/Manufacturing owner bytes with correct BOM/version scope; COM-10, COM-33 |
| Inherited BOM analysis CSV | Product360/BOM/BillOfMaterialsExplosion declares `BillOfMaterialsExplosionFindings`, `BillOfMaterialsExplosionRows`; BillOfMaterialsCompare declares `BillOfMaterialsCompareFindings`, `BillOfMaterialsCompareRows`, `BomHeaderChanges`, `BomOperationChanges`; WhereUsed declares `WhereUsedFindings`, `WhereUsedRows`. All are method-context denial inspections in Commerce, paired with authorized owner outputs; COM-10, COM-33 |
| Inherited routing CSV | Product360/BOM/RoutingDetail declares `ReleasedRoutingOperations`, `DraftRoutingOperations`; retain method/version scope and verify denied Commerce versus authorized Products/Manufacturing export; COM-10, COM-33 |
| Inherited cost CSV | Product360/Costs → Shared/StandardCosts declares `StandardCosts`, `StandardCostComponents`, `StandardCostFindings`; Commerce disables cost capability. Verify denial/absence of cost bytes in Commerce and legitimate Products/Accounting owner exports separately; COM-10, COM-33 |
| Theme release | ThemeDetail `exportRelease` sends `application/json`, manifest digest, manifest and files. Inspect immutable release identity, encoded assets and absence of secrets; it is not a ZIP or screenshot; COM-20 |
| Feed build | FeedDetail `downloadBuild` returns artifact text with build MIME and `.csv`, `.json` or `.xml` suffix. Inspect registered-format contents and public endpoint separately; COM-31 |
| Report outputs | OnlineSales, CartRecovery, PromotionUse, ChannelHealth `exportCsv`, linked by CommerceReportParts with filter parameters; COM-32 |
| Images/files | Review `reviewImage`, page attachment, theme asset/preview release assets, Shared Documents and RecordFiles download paths; inspect actual MIME/disposition/content and unavailable/foreign responses; COM-10, COM-14, COM-17, COM-19, COM-22, COM-33 |
| Companion outputs | Shop order document is scoped HTML with a conditional Billing link; downloads use separate short-lived capability/range handling. Do not label these as Commerce invoice PDFs or general order-token file access; COM-23, COM-26–COM-27 |

### Design surfaces that are not additional current routes

“Publishing,” “Publish preview,” “Recovery policy,” “Recurring policy,” “Import preview/result” and “Feed preview/builds”
are controls/sections of the routes above, not missing standalone pages. Commerce does not mount a full carriers, bank,
tax-authority, credential, warehouse shipment, customer reply or general refund editor: it offers bounded settings or
owner links. Product360's physical descendant set is broader than Commerce's visible capabilities. The same is true of
Customer360; count inherited routes as inspection work, not normal customer tabs. Public storefront page types live in
PASS theme/templates and Shop routes, not under the staff Website area.

## 4. End-to-end activities

Use **M** for Material, **T** for actual TUI, **S** for bounded Standard/fallback/output and **P** for the paired public
Shop outcome. Every activity includes role/scope refusals and safe recovery under the common method; the branches below
identify the distinguishing cases. A missing prerequisite remains pending with a reason. Never mark a whole activity
complete from one rendered screen or from a successful service response alone.

### COM-01 — Enter the correct store workspace and find the next task

- **Actor/start:** reader, manager, store operator, store-limited staff and foreign organization; two same-organization
  stores and one foreign store, populated/empty Home periods.
- **Entry/actions:** launch Commerce in the shell; inspect each actor's ten-area menu visibility, organization/store
  selector and Home. Select a store and period; follow queue/report links, search the palette by store/order key and name,
  and return without losing context. Open a copied deep link under the second identity.
- **Visible result:** store and period explain work/counts; missing report configuration is explicit. Orders/carts link to
  the proper detail type; unavailable menu areas and owner links do not imply access.
- **Persisted/result evidence:** reads do not mutate records; scope follows current organization and StoreStaff rows,
  including choices' selected-label lookup, palette and Comms record providers.
- **Recovery:** missing/deleted/foreign store produces a safe unavailable result; switch organization and remove stale
  selection. Confirm a launcher-only user cannot gain another area through URL, helper or forged `appRoot`.
- **Modes:** M/T/S; include empty Home, narrow layout and keyboard selection.

### COM-02 — Create a store and understand readiness

- **Actor/start:** manager of a disposable organization, reader counterpart; an existing ordered store and a new store.
- **Entry/actions:** Stores → New store; name it, choose allowed organization/currency/locale and optional facility. Open
  StoreDetail → General, change an allowed default with required reason and current revision, then reopen.
- **Visible result:** header, readiness findings and fix links identify the store and distinguish blockers/warnings. Open
  Sites to see actual hosts/mount/state/served status; no host editor is implied by this read-only view.
- **Persisted/result evidence:** one store is created with intended defaults and dated facility; no site mount or public
  publication appears automatically. History attributes the change; an ordered store cannot casually change organization.
- **Recovery:** missing required fields, wrong-organization facility, no site, stale revision and reader save refusal retain
  a useful path. A digital-only store's facility finding must reflect readiness's actual warning semantics.
- **Modes:** M/T/S; inspect first-use empty state and owner reservation link to Warehouse.

### COM-03 — Bind staff, facilities, notices and operating checks

- **Actor/start:** manager, limited staff member and reader; current/future/expired bindings, two valid rows per list.
- **Entry/actions:** StoreDetail → Facilities and Staff: add dated facility/priority and eligible staff; end a selected row.
  In Emails choose a registered template/site path; in OrderChecks add a registered check and typed parameters/sequence.
  In SearchContent choose a valid indexed document/public content space; in Settings save an allowed typed value.
- **Visible result:** dates, active/future/ended state and exact changed row are understandable. Choice lists match allowed
  values; History shows reason/user when required, and invalid raw service/location fields are not offered as free text.
- **Persisted/result evidence:** dated successor/end rows are correct; StoreStaff restricts scope without creating grants.
  Customer party rows are never repurposed as staff. Registered order checks continue to apply to subsequent placement.
- **Recovery:** overlap, private space, unregistered check/template, invalid setting type and foreign-party/facility inputs
  fail safely. A store-limited user must not edit away their own store limitation through staff setup.
- **Modes:** M/T/S, including repeated dialogs, dates, selected-value lookup and keyboard end confirmation.

### COM-04 — Group and clone stores with intelligible outputs

- **Actor/start:** manager, store-limited staff and foreign manager; source with facilities/staff/catalog/email bindings.
- **Entry/actions:** Stores → Store groups: create/update group, add/end a same-organization store and eligible party.
  Return to StoreDetail → Clone store, inspect preview, choose target organization/name, then confirm once. Open clone.
- **Visible result:** preview names copied/excluded sections and organization-sensitive references. Groups explain
  membership, not shared configuration. Clone opens under its own key and scope.
- **Persisted/result evidence:** new store is unpublished and has no site mount; references belong to target organization.
  Source configuration and other members remain unchanged. Export summary CSV and print summary for source and clone.
- **Recovery:** stale group update, foreign group member, invalid target and interrupted confirmation explain recovery
  without accidental duplicate clone. Inspect actual summary bytes/layout for credentials and foreign records.
- **Modes:** M/T/S, including printable HTML and CSV; do not assume a PDF generator for this transition.

### COM-05 — Set customer checkout policy and observe its effective date

- **Actor/start:** manager and reader; prepared Shop site with guest and verified-account sessions, draft/published Terms.
- **Entry/actions:** Settings → Checkout settings → Change policy. Choose guest/account/either, destinations, stock
  disclosure, Terms requirement, phone policy and an offered Support queue; use current and future effective dates.
- **Visible result:** default/current/scheduled values and readiness are distinct. Follow relevant Terms/owner references;
  read the resulting Shop entry, destination, contact and acceptance controls with the companion reviewer.
- **Persisted/result evidence:** dated policy rows apply at their intended boundary, and Shop server validation uses the
  same policy even if a public client omits a field. Queue belongs to the store organization's offered Support queues.
- **Recovery:** unpublished Terms, disallowed country, unsupported queue, invalid past date and missing required phone
  produce useful paths. A future setting must not prematurely alter the current customer's checkout.
- **Modes:** M/T/S/P; public ordinary forms and JavaScript-disabled path belong to the paired observation.

### COM-06 — Configure shipping and explain the offered rate

- **Actor/start:** manager; physical cart in two allowed zones, an unsupported country, weight/value band boundaries.
- **Entry/actions:** Checkout settings → add shipping option and approved carrier gateway; add local rates with method,
  zone, weight/value/currency/priority and dates. Run the shipping simulator for each destination; compare Shop delivery
  choices for the same product/quantity/address. Change/end one row with reason where required.
- **Visible result:** carrier/method and masked account are clear; simulator explains available rate or no delivery.
  An unmatched configured rate is not shown as free shipping. Readiness points to the missing cause.
- **Persisted/result evidence:** bindings and dated rate rows match the chosen store; current/future/end boundaries and
  inclusive lower/exclusive upper bands agree with the authoritative quote. Carrier maintenance remains Warehouse's.
- **Recovery:** overlapping equal-priority bands, unapproved gateway, invalid unit/zone and unavailable destination
  preserve valid rows. Returning from the owner link must retain store/organization and intended edit.
- **Modes:** M/T/S/P, including narrow rate tables and long zone labels.

### COM-07 — Bind payment methods and tax without exposing credentials

- **Actor/start:** manager, reader and Accounting owner; enabled/disabled organization gateways, physical/digital samples.
- **Entry/actions:** Checkout settings → add/change payment instrument gateway and inspect hosted/saved/off-session
  capability summary. Follow Payment methods in Accounting when allowed. Set tax gateway/display/origin, run sample tax
  preview and compare the same Shop offer through review/checkout.
- **Visible result:** configuration names and masked values suffice; raw credentials/provider internals are absent from
  screen, helpers and summaries. Tax basis and inclusive/exclusive display are explicit.
- **Persisted/result evidence:** only current enabled organization gateways bind; audited changes retain their reasons.
  Quote and checkout use authoritative settings, not a cosmetic client total. Accounting owns provider configuration.
- **Recovery:** disabled/foreign gateway, unavailable origin, unsupported hosted/off-session capability and failed tax
  calculation explain what is missing. A payment timeout remains uncertain until reconciled, not automatically unpaid.
- **Modes:** M/T/S/P; hosted-provider exercise requires a local double or separately approved sandbox prerequisite.

### COM-08 — Prepare the store assortment

- **Actor/start:** merchandiser and reader; shared/owned catalog products, virtual variants, physical/digital and inactive
  products, with a second store carrying some of the same products.
- **Entry/actions:** Merchandising → Assortment; choose store, filter/search, open the row's store-product dialog and set
  allowed store-specific availability/merchandising values. Follow Product360 and return to the same filtered assortment.
- **Visible result:** catalog status, store saleability and public state are distinct; unavailable products explain why.
  Row changes do not silently edit another store or claim the master product was published.
- **Persisted/result evidence:** intended store-product association/values and effective dates change; other store and
  catalog ownership remain as before. Prepare the proposal for COM-13 without treating proposal as publication.
- **Recovery:** missing store, invalid/foreign product, stale values, empty results and two repeated row dialogs recover
  clearly. Reader cannot save using a copied transition.
- **Modes:** M/T/S, including bulk-selection visibility and returning from shared context.

### COM-09 — Organize store categories and inspect shared taxonomy impact

- **Actor/start:** merchandiser; categories used by two stores, nested children, one empty category and membership dates.
- **Entry/actions:** Merchandising → Store categories; select store/category, inspect roles/members, move by drag and by
  up/down controls. Use form view/StoreCategoriesTui to add/end role, move category to parent, and add/remove members.
  Open CategoryDetail to inspect summary/content/identifiers/parents/products and the stores using it.
- **Visible result:** shared-category impact is named before confirmation; keyboard and drag produce equivalent order.
  General CategoryDetail parent/member writes are refused in Commerce in favor of the store-specific workflow.
- **Persisted/result evidence:** intended hierarchy/sequence/membership dates persist, unrelated categories/stores remain
  consistent and public navigation reflects publication rules rather than exposing drafts.
- **Recovery:** cycle, stale/shared confirmation, foreign category and denied generic write provide a useful return path.
  Cancelling a move changes nothing; selecting another store clears stale member detail.
- **Modes:** M custom Vue, actual T form twin and S form view, plus bounded P category visibility.

### COM-10 — Inspect product and document context without expanding authority

- **Actor/start:** merchandiser/reader and authorized Products owner; physical, digital, kit/variant and foreign products.
- **Entry/actions:** Assortment → Product360. Read allowed summary, identifiers/features/dimensions/associations/categories,
  packaging, history/connections and documents. Open Merchandising → Documents and DocumentDetail; inspect a product and
  category nested Documents/Index alias. Use only actually offered authorized document actions.
- **Visible result:** source product/store context and publication/review handoffs remain clear; file purpose, version,
  availability and safe download behavior are understandable. Cost, supplier, purchase and manufacturing context does not
  leak simply because its shared source is physically beneath Product360.
- **Persisted/result evidence:** allowed evidence edits attach to the intended record; reads preserve master data. Inspect
  Packaging CSV with its base/pack product, date/history filters and actual rows. Inspect each inventory descendant under
  COM-33, including BOM/stock/Insights aliases and the named BOM/routing/cost CSV families, recording intentional denial
  in Commerce and permitted owner output separately.
- **Recovery:** inaccessible/deleted file, foreign owner, invalid upload and restricted direct descendant leave safe output.
  Return links keep product/category/store context; no unavailable price-history route is invented.
- **Modes:** M/T/S with actual file bytes and owner counterpart; P only for intended public product documents.

### COM-11 — Explain price and availability, including inherited exports

- **Actor/start:** manager/merchandiser with price read, reader without it, Products price owner and Warehouse counterpart;
  dated price tiers, quantity breaks, promotion, available/out-of-stock variants and foreign facilities.
- **Entry/actions:** Merchandising → Price lists → list/detail; inspect effective prices. Product360 → Prices and Stock,
  standalone Inventory availability and Price explain: apply store/customer/date/quantity and inspect the same SKU offer.
- **Visible result:** sell price, currency, quantity/date basis, availability disclosure and authoritative explanation agree.
  Supplier cost and margin remain unavailable in Commerce context even for a broadly privileged neighboring-app user.
- **Persisted/result evidence:** reads/export do not change price or reserve stock. Compare customer-facing quote after
  public repricing; a stock view alone is not a checkout reservation guarantee.
- **Recovery:** no matching price, missing availability, foreign facility and restricted edit/export return useful errors.
  Inspect CSV/XLSX from EffectivePrices/Prices and PriceTrace CSV with their actual basis; probe SupplierOffers only as an
  inherited restricted route, with an authorized owner check. For both standalone InventoryAvailability and Product360/Stock,
  directly request ProductLocations/ProductMovements CSV: their child screens require Warehouse context, so Commerce must
  not return location/movement bytes. Inspect permitted Warehouse counterpart outputs and filters separately. Confirm
  selected columns/filters/bytes contain no restricted values.
- **Modes:** M/T/S/P; no invented Commerce price editor or unsupported general report format.

### COM-12 — Define paid access and recurring offers

- **Actor/start:** subscription operator for access bindings, manager for recurring offers; a digital product sold in the
  actor's stores, installed resource handlers, automatic and prepaid plans, suitable off-session gateway.
- **Entry/actions:** Product360 → Paid access: inspect handler names read-only, add/change/end eligible resource binding
  using the actual offered form. Checkout settings → recurring offers: create/change/end a current plan with price,
  currency, term, terms version and retry days; inspect renewal notices/readiness.
- **Visible result:** what purchase grants, paid term and automatic charge consent are distinct. Handler implementation is
  not editable text. An automatic plan names the required gateway capability rather than silently becoming prepaid.
- **Persisted/result evidence:** effective binding/offer version applies to later purchases; previous accepted terms remain
  attributable. Shop shows the valid offer and asks for recorded off-session consent when required.
- **Recovery:** missing handler, product also in an out-of-scope store, mismatched catalog price, unavailable gateway or
  stale binding is refused safely. Ending an offer does not rewrite an existing contract's accepted history.
- **Modes:** M/T/S/P; Products' read-only Paid access view is a bounded second-consumer check.

### COM-13 — Preview, publish and withdraw the actual assortment

- **Actor/start:** publisher separate from merchandiser; draft virtual parent/variants, one already-public item and one
  invalid item, second store and signed-in Shop cart session.
- **Entry/actions:** Assortment → Review publishing → PublishProducts; inspect proposed products/variants, readiness and
  intended action; confirm once and inspect every product result. Withdraw a selected variant and re-enter the public shop.
- **Visible result:** partial success is explicit per row; rejected/stale rows do not hide successful independent items.
  Only eligible published products are public in category/search/product/feeds. Withdrawal is clear and reversible through
  a later valid publication, without falsely implying a theme rollback will restore the product.
- **Persisted/result evidence:** publication records/generation match results; another store is unchanged. A retained cart
  is repriced/revalidated and does not buy a now-unavailable item by holding an old page open.
- **Recovery:** duplicate request, changed readiness/product state, missing publish permission and foreign store cannot
  bypass the preview's authority. Public cache/remote propagation is observed, not assumed from the staff toast.
- **Modes:** M/T/S/P; inspect both root and prefixed Shop mount outcomes with the companion plan.

### COM-14 — Draft, publish and schedule site pages

- **Actor/start:** designer, publisher and reader; draft Returns/Terms page, an existing published page, two sites and locales.
- **Entry/actions:** Website → Pages → PageDetail. Edit PageContent with preview/history/diff or PageText's versioned form;
  inspect PageHistory. In PageRoute choose the actual route/role/template values, then PagePublication → Publish current
  version immediately or on a future date. Inspect withdraw and cancel-schedule actions separately.
- **Visible result:** draft/latest/live version, published address and schedule are distinct. Editing text does not publish.
  Published route binding changes require publish authority even when the designer can edit content.
- **Persisted/result evidence:** version and publication revision point to the selected version; Shop serves only eligible
  published content. Terms acceptance refers to the appropriate version, and Forum's unrelated page bindings stay intact.
- **Recovery:** stale/unknown version, reserved route, inaccessible attachment, lost publisher grant at scheduled time and
  foreign site yield safe failures/readiness evidence. Restore work through history without silently publishing it.
- **Modes:** M content editor, T/S PageText/form alternatives, P public page and locale; inspect helper attachment bytes.

### COM-15 — Publish navigation and redirects deliberately

- **Actor/start:** merchandiser (`COMMERCE_MERCHANDISE`) drafts, publisher (`COMMERCE_PUBLISH`) publishes; current menu, draft target product/page and
  root/prefixed public sites.
- **Entry/actions:** Website → Navigation: create/rename menu, add/edit/remove item, move order/parent and publish. Follow
  live links, withdraw menu, then add/publish/withdraw redirect using its actual local target constraints.
- **Visible result:** draft versus live menu and redirect states are clear; labels/hierarchy/order and actual public URLs
  match. Keyboard movement explains its target and does not leave ambiguous empty labels.
- **Persisted/result evidence:** navigation publication/generation is independent from theme release and product/page
  publication. Prefixed links remain within the intended site, and customer cart/session state survives navigation change.
- **Recovery:** unpublished target, reserved `/api` route, redirect loop, unsafe external target, duplicate path and stale
  revision are rejected with a useful correction path. A scheduled action with revoked authority must not bypass checks.
- **Modes:** M/T/S/P with narrow layout, keyboard hierarchy and forward/back navigation.

### COM-16 — Create or import a theme draft and inspect its identity

- **Actor/start:** designer/developer, publisher and reader; registered starter, valid exported package and invalid/foreign
  package, prepared store/site without assuming a live binding.
- **Entry/actions:** Website → Themes → New theme from starter; choose store/name. Open ThemeDetail and edit identity.
  Separately use Import theme, inspect accepted engine/view API, files, validation findings, bindings and release history.
- **Visible result:** draft revision, validation state, store and where-used are clear; designer sees Edit theme, developer
  source permission separately, publisher publish controls. Import does not automatically activate a site.
- **Persisted/result evidence:** draft/package identity and files belong to the correct store; live release remains pinned.
  A failed import leaves no misleading publishable theme or untrusted arbitrary script execution path.
- **Recovery:** unsupported Liquid/script package, invalid manifest/path, foreign store and missing role produce bounded
  diagnostics. Cancelling creation/import and returning to filtered theme list retain useful context.
- **Modes:** M/T/S; inspect long filenames and empty where-used/history states.

### COM-17 — Edit theme composition, settings, assets and translations

- **Actor/start:** designer with current draft, another editor, preview host and safe local asset; published release retained.
- **Entry/actions:** ThemeDetail → Edit theme. Select page template, reorder via drag and keyboard, add/duplicate/hide/remove
  allowed sections, edit schema settings and translations, upload an allowed image and assign a page template. Exercise
  undo/redo, explicit Save and navigation with unsaved work. Repeat supported movement/settings in form view.
- **Visible result:** selected section and preview correspond; busy/error state, revision, validation field location and
  unsaved warning help recovery. Required purchase/checkout components cannot disappear through a visual shortcut.
- **Persisted/result evidence:** saved composition/settings/assets/translations advance the intended draft revision, and
  page assignment follows its own publication revision. Live release changes only in COM-20.
- **Recovery:** concurrent save/stale revision, invalid schema value, wrong image MIME/scan failure and required-component
  removal preserve recoverable work. Form twin coverage is stated per implemented function, not blanket parity.
- **Modes:** M custom editor, T/S explicit form twin; keyboard, phone-width preview and actual zoom are separate checks.

### COM-18 — Edit theme source with safe diagnostics and file operations

- **Actor/start:** theme developer and designer denied counterpart; current text file, base digest and dependent files.
- **Entry/actions:** ThemeDetail → Edit source. Open file, inspect source/diff, make a safe edit, Save and Validate. Add,
  rename and remove a disposable file with reason/dependent confirmation; inspect resulting references and diagnostics.
  Repeat a text save and supported file operation through TemplateEditorTui/form view.
- **Visible result:** exact file/line, base/current digest and revision distinguish validation failure from conflict.
  Binary asset is not offered as an arbitrary text edit. Source role requirements are explicit.
- **Persisted/result evidence:** one intended draft file change survives reopen; release files remain immutable. Validation
  rejects forbidden template operations, scripts/event handlers and runtime context exposure using the actual adapter.
- **Recovery:** stale digest/revision, forbidden path, missing dependent confirmation and malicious source report safe
  actionable diagnostics without saving unsafe content. A copied POST cannot grant the designer source authority.
- **Modes:** M editor, T/S source forms; inspect focus, editor scrolling, long lines and unsaved navigation.

### COM-19 — Preview safely on the separate preview host

- **Actor/start:** designer, configured preview host on an authority runtime with Mantle in process, intended origin/nonce,
  foreign site and expired preview token. A remote PASS frontend treats hosts as live; it is not this preview runtime.
- **Entry/actions:** Theme editor → Preview/device width; follow form twin's preview link. Select section in the frame,
  confirm editor selection, navigate allowed preview pages and inspect synthetic cart/account/order states.
- **Visible result:** preview is distinguishable from public live site; device width changes frame presentation, not the
  real browser zoom/accessibility result. Errors explain an unavailable host/token rather than silently showing live state.
- **Persisted/result evidence:** preview reads draft under a bounded token and synthetic private context; it does not expose
  real customer details or place an order. Editor communication is bound to allowed origin and nonce/MessageChannel.
- **Recovery:** wrong origin/nonce, expired/foreign token and ordinary Shop/Login URL on the preview-only host are refused.
  Local/remote authority outage is safe; return to draft retains unsaved edits. Never reuse public cookies as preview data.
- **Modes:** M frame and T/S external preview link, P-like preview only; separate from a live storefront acceptance walk.

### COM-20 — Validate, release, restore and export a theme

- **Actor/start:** publisher separate from designer; validated draft, existing release, selected site and current active
  revision; customer with live cart/account state and product/page publication changed since prior release.
- **Entry/actions:** ThemeDetail → Validate; inspect findings. Publish to the selected site's binding with validated digest,
  current active revision and operation key. Open public pages and retained customer state. Restore an earlier release,
  then Export that immutable release as JSON.
- **Visible result:** confirmation names site/store/release; bindings/history identify active and earlier releases. Restored
  layout does not claim to restore withdrawn products/pages. Export describes the selected release, not unsaved draft.
- **Persisted/result evidence:** atomic binding/generation and attributable activation history; retry of the same operation
  does not create another effect. Published Shop serves without BOSS runtime dependency under local/remote authority.
- **Recovery:** stale validation/active revision, incompatible runtime/release, foreign-store theme and missing publish grant
  leave current binding intact. Lost remote response requires reconciliation with the same identity. Inspect JSON manifest,
  digests/files/assets and no credentials; cart/account/payment state must survive a presentation release.
- **Modes:** M/T/S/P, with JSON byte inspection and actual public assets/cache behavior pending until execution.

### COM-21 — Define promotions and codes, then explain the actual discount

- **Actor/start:** manager/promotion editor, reader and foreign manager; eligible product/customer, competing carts and code
  limits with current/future/expired dates.
- **Entry/actions:** Promotions → Promotions → New promotion; choose registered rule and typed parameters, dates, limits
  and products. Open Promo codes, create a code or preview/generate a batch with prefix. In PromoCodeDetail limit customers,
  inspect uses and expire a disposable code. Apply eligible/ineligible code in Shop and place controlled fixture orders.
- **Visible result:** promotion conditions, code/customer/global limits and usage are understandable; bulk generation preview
  is distinct from completion. Checkout discount names its cause and explains rejection without exposing other customers.
- **Persisted/result evidence:** authoritative usage at placement enforces limits across store orders, not only Shop carts.
  Two simultaneous placements cannot both consume the final use. Expired code remains readable with history.
- **Recovery:** unregistered rule, wrong parameter type, foreign product/customer, changed usage/eligibility and duplicate
  generation request are safe. A failed/ineligible discount is not presented as a successful total reduction.
- **Modes:** M/T/S/P; inspect typed rule dialogs, code list overflow and retained offer after reprice.

### COM-22 — Moderate reviews and reply without exposing customer identity

- **Actor/start:** merchandiser, reader, verified delivered-order buyer and another customer; pending/approved/stale reviews
  and permitted image attachments. Use a local fixture for any request notice.
- **Entry/actions:** Merchandising → Reviews; filter by store/product/state, open image and row decision/reply dialog.
  Approve one, reject another, submit a mixed-validity bulk decision and withdraw a staff reply. Follow Product360 reviews
  and public product page, then edit the original buyer review through Shop.
- **Visible result:** per-review outcomes, decision reason and public/private distinction are clear. Public shows only
  approved content, permitted images and public staff reply; internal customer identity stays private.
- **Persisted/result evidence:** moderation respects revision and scope; buyer edit returns review to pending and updates
  public visibility/average consistently. Another row's decision leaves this review unchanged.
- **Recovery:** stale row, foreign review/image, invalid reply/photo and denied role cannot reveal media or alter publication.
  Show partial bulk outcomes without throwing away successful independent decisions.
- **Modes:** M/T/S/P, including actual image MIME/body, keyboard dialogs and long review text.

### COM-23 — Trace physical and digital orders and reorder safely

- **Actor/start:** operator, narrow reader and appropriate Warehouse/Accounting owners; physical, digital-only and mixed
  placed orders, unpaid/paid/payment-held states, masked notices and a cancellation proposal.
- **Entry/actions:** Orders → Orders; filter store/customer/channel/payment/fulfillment, open OrderDetail. Inspect header,
  items, payment/fulfillment cards, shipments, invoices, cases, returns and notice delivery ledger. Follow authorized owner
  links and return. Use Order again and the hidden LogNote surface from its intended Comms/order context.
- **Visible result:** placed order differs from open cart; payment hold explicitly belongs to Accounting and proposed
  cancellation to Customer Service. Shipped and digitally delivered quantities do not become the same misleading status.
- **Persisted/result evidence:** read-only operational detail changes nothing. Order again creates a current-price open
  order once per operation key, copying no payment and placing/charging nothing. Internal note has the intended order.
  Compare customer's order/HTML invoice/download entitlement with staff evidence; do not assume a Commerce PDF action.
- **Recovery:** stale reorder revision, withdrawn item, foreign/no-store order and unauthorized owner link are safe. A guest
  digital order waiting for approval stays pending until actual checks/approval/fulfillment complete.
- **Modes:** M/T/S/P; execution across physical fulfillment and Accounting remains bounded to relevant handoff evidence.

### COM-24 — Understand uncertain checkout and resolve stuck placement

- **Actor/start:** store operator for read, Commerce administrator or composed holder of `COMMERCE_ORDER_VIEW` plus
  `COMMERCE_PLACEMENT_RESOLVE` for resolution; paid checkout whose placement repeatedly failed and a genuinely uncertain payment.
- **Entry/actions:** Orders/Carts or Orders' stuck entry → CartDetail. Inspect checkout/payment/attempt/failure evidence.
  Use Resolve placement with explicit reason/key: retry placement in one fixture; refund/release in a separate fixture.
  Reopen the same record after a simulated lost response and compare Shop's result/recovery page.
- **Visible result:** paid-but-not-placed differs from abandoned/unpaid. Retry does not promise a new charge; refund text
  names authorization release versus captured refund and waits for provider confirmation.
- **Persisted/result evidence:** retry uses the paid snapshot and original payment; refund confirmation cancels the cart
  only after authoritative provider outcome. An unknown outcome remains unresolved for reconciliation, not a new payment key.
- **Recovery:** changed order after payment, unresolved provider result, missing reason, replay and foreign store preserve
  payment evidence. Ordinary operator cannot invoke resolution by copying the transition. Verify client retry navigation
  does not duplicate the order/charge or falsely show success.
- **Modes:** M/T/S/P; real gateway uncertainty remains a provider-double/sandbox prerequisite, not established by static text.

### COM-25 — Recover an eligible cart with consent and a bounded link

- **Actor/start:** manager configures policy, operator sends; verified signed-in opted-in shopper, guest and opted-out shopper,
  idle/current/expired/already-recovered carts; local mail capture.
- **Entry/actions:** Checkout settings → Recovery policy: inspect enablement/delay/send limit/retention and current optional
  email settings. Carts → CartDetail: inspect eligibility/history and Send recovery. Observe captured notice and scheduled
  job scenario separately. Follow link in fresh public session, sign in and explicitly choose Open my cart.
- **Visible result:** ineligibility names consent/identity/timing reason. GET captures/cleans the recovery token but does not
  consume it; explicit signed-in restore POST restores/reprices the correct cart. A redirect alone is not recovery success.
- **Persisted/result evidence:** one permitted notice per policy boundary, bounded token use and delivery ledger; guest and
  opted-out carts are not mailed merely because an address is present. Repricing/publication changes are shown on return.
- **Recovery:** stale cart, expired/reused/other-customer token, changed consent and mail/authority failure retain safe
  explanation. Another scheduled pass must not resend beyond policy. Old design prose about checkout opt-ins is not the
  current UI contract: inspect current optional settings and the shopper's recorded preference.
- **Modes:** M/T/S/P; actual local mail content/destination and account binding are required later evidence.

### COM-26 — Follow returns and Support requests to their responsible owners

- **Actor/start:** operator and composed Customer Service/Accounting/Warehouse identities; return at requested/received/settled
  stages, signed-in Support case and one-order guest OrderView capability.
- **Entry/actions:** Orders → Returns → ReturnDetail; inspect source orders, requested/received quantities and settlement.
  Follow Customer Service authorization and Accounting settlement links if allowed. Customers → Requests → RequestDetail:
  inspect customer/order/queue/assignee/due/conversation, add Internal note and follow owner case link.
- **Visible result:** Commerce is read-only for return disposition, case assignment/reply/resolution and settlement. Internal
  note explicitly never goes to the customer. Public Support request is a request for service, not completed cancellation/refund.
- **Persisted/result evidence:** correct order/return/request identity survives handoff; Warehouse receipt and Accounting
  result appear only after owner's actual operation. Guest capability is bounded to one permitted order and Support action,
  not general account history, customer notes or download rights.
- **Recovery:** expired/wrong-order token, foreign return/case, unavailable owner grant and settled/changed source expose no
  neighboring records. A failed note stays recoverable without being mistaken for a customer-facing message.
- **Modes:** M/T/S/P, with public Support details owned by companion/Customer Service review.

### COM-27 — Read a customer's scoped account context

- **Actor/start:** operator, second-store operator, guest and two verified customer identities; same customer in more than
  one store and a foreign customer with similar name.
- **Entry/actions:** Customers → Customers → Customer360; inspect store/account state, addresses, masked payment methods,
  orders/carts/cases/returns/subscriptions, and filtered list links. Follow Customer Service only if authorized.
- **Visible result:** this Commerce overview has no ordinary tab navigation. Account state and guest versus signed-in identity
  are explicit; masked card is not raw gateway/profile data. Counts/links reflect the actor's stores, not a party directory.
- **Persisted/result evidence:** reads do not merge identities or alter addresses/payment methods. Public account changes
  appear only through permitted authority and retain customer/site scope; staff view does not become account impersonation.
- **Recovery:** direct inherited child URLs (`Credit`, `Money`, service tabs, Files and others in inventory), foreign customer,
  stale address and copied account links receive their actual consuming-context guard under COM-33. Missing customer and
  inaccessible customer should not disclose existence through helpers or output.
- **Modes:** M/T/S/P; compare account address/method/download behavior with Shop without assuming staff controls exist.

### COM-28 — Operate subscriptions while separating charge and access state

- **Actor/start:** subscription operator, ordinary store operator denied for mutation, verified customer; prepaid, active,
  cancelled, declined/waiting, exhausted-retry and in-flight renewal examples.
- **Entry/actions:** Customers → Subscriptions; filter store/customer/product/resource/state/next renewal. Open detail,
  inspect accepted terms, masked method/consent, paid-through, access and renewal history; follow origin/renewal orders.
  Retry an eligible failed renewal with reason/key, and cancel future renewal on a separate contract.
- **Visible result:** payment/billing/access/contract states are separate. Cancel stops future renewals and preserves the paid
  term; it is not a refund. A prepaid term is not presented as automatically renewable.
- **Persisted/result evidence:** retry uses the same occurrence and recorded consent, with one charge/order/access extension;
  cancellation preserves paid access and closes eligible waiting renewal without charge. Shop shows corresponding access
  and customer recovery; Accounting owns financial refund and its exact entitlement consequences.
- **Recovery:** in-flight payment refuses retry/cancel until resolved; stale revision, no consent, foreign contract and repeated
  operation do not double charge or extend access twice. Revoked/refunded term must not revoke unrelated manual/other paid grants.
- **Modes:** M/T/S/P; provider/job clocks and external entitlement handler are explicit future prerequisites.

### COM-29 — Bind integrations and recover channel or managed EDI exceptions

- **Actor/start:** channel operator, ordinary operator denied counterpart and foreign-store channel operator; registered
  intake connector, redacted credentials, mapping and successful/failed/conflicting messages. Separately prepare an existing
  managed EDI connection with rejected/retryable document, conflict/nonretryable document and quarantined interchange.
- **Entry/actions:** Integrations → New binding for an eligible registered connector; save mapping and enable only with
  required credential configuration. In IntegrationDetail filter Messages by **State** and **External or message ID**,
  inspect detail, select eligible failures and Retry. Follow the resulting order link and return to its message.
  Open the existing managed EDI integration: inspect EdiDocuments and EdiInterchanges safe summaries; in RetryEdiDocuments
  choose eligible documents, supply reason and confirm Retry selected with their identity. Reopen the exception list/results.
- **Visible result:** connector purpose, enablement/mapping and safe diagnostics explain failures; managed EDI displays its
  profile and exception evidence without Binding/Mapping editors, raw document/interchange text or credentials. Connection,
  profile and transport belong to the EDI administrator; the screen describes that boundary but renders no owner link.
- **Persisted/result evidence:** channel receipt bytes/external identity remain traceable, and replay creates no duplicate
  order. Eligible EDI retry uses the retained document/message/control identity, reason and operation key; independent item
  failures do not abort successful items. Channel prices/shipping/tax follow intake, not an assumed Shop recalculation;
  seller approval remains separate. Repeating the same batch key returns its recorded result.
- **Recovery:** missing credential, unsupported mapping, invalid product, conflict/nonretryable item and foreign integration
  or EDI document preserve safe evidence. Conflict messages require review; applied/duplicate messages and conflicting EDI
  documents cannot become retryable through a forged request. Managed binding/mapping saves are refused (`EDI_MANAGED`).
  Fix a retryable source through its actual owner, then retry the same identity; no Commerce EDI configuration action is invented.
- **Modes:** M/T/S; inspect empty/populated exception tables, repeated selection and safe per-item outcomes. External API/EDI
  delivery requires controlled local fixtures; existing managed-EDI projection/rule assertions do not prove this UI journey.

### COM-30 — Stage and commit a channel import with partial results

- **Actor/start:** channel operator; CSV/JSON file containing new, duplicate, conflicting and invalid orders, valid binding,
  local artifact with known bytes/digest and no real customer delivery.
- **Entry/actions:** Integrations → Channel import; choose integration/format and upload the file. Choose Read the file;
  inspect order-by-order preview, file/digest and predicted outcomes. Commit with reason/current digest, then inspect
  committed results and follow order/message links. Retry eligible failures from IntegrationDetail.
- **Visible result:** stage/commit/result are distinct, counts reconcile to file contents, duplicate and conflict are not
  conflated, and successful independent orders stay visible beside failure details.
- **Persisted/result evidence:** stored batch consumes through the same connector path, once; each order's transaction and
  external identity remain traceable. Current limits are UTF-8, 2 MiB and 500 orders, not unrestricted file upload.
- **Recovery:** unreadable/oversized/wrong-format file, stale digest, concurrent commit, repeated identical file and foreign
  binding are handled safely. Lost response leads back to batch status instead of creating a new uncontrolled import.
- **Modes:** M/T/S; file-picker fallback, long diagnostics and keyboard confirmation.

### COM-31 — Build, inspect and publish a feed without reviving withdrawn items

- **Actor/start:** channel operator; published Shop site with canonical host, valid registered format/destination, mixed
  product availability/image state and a second site's feed.
- **Entry/actions:** Integrations → Feeds → New feed; configure store/site/key/format/schedule and inclusion settings.
  FeedDetail → Build now; inspect row/skipped/error summary and sample rows, download complete artifact, then Publish this
  build with current revision/key. Follow actual public feed path. Withdraw one included product, rebuild and republish.
- **Visible result:** latest build, last complete build and active build are distinct. Failed build leaves prior active
  build intact; a withdrawn product blocks serving the stale feed until a valid new build is active.
- **Persisted/result evidence:** build captures publication generation/digest/size; publish changes active build once and
  public representation uses the same scoped projection. CSV/JSON/XML content matches actual registered format/MIME.
- **Recovery:** missing host/site, stale revision, wrong format/build, withdrawn product, failed scheduled build and foreign
  feed do not expose invalid artifacts. End feed stops serving immediately but retains build history; another feed continues.
- **Modes:** M/T/S/P; actual downloaded and public bytes, caching/digest and root/prefix routing are separate observations.

### COM-32 — Reconcile Home and reports to their actual basis

- **Actor/start:** manager/operator/channel/subscription reader as allowed by Reports area; two stores/organizations, placed
  order, open cart, invoice, recovery notice, promotion use and channel/feed activity in a known date window.
- **Entry/actions:** Reports → catalogue → Online sales, Cart recovery, Promotion use, Channel health. Set store/date/group
  filters, inspect totals/rows and drill to eligible records. Compare Home's period strip to Online sales with the same
  scope/window. Export each report CSV and inspect its rows and safe fields.
- **Visible result:** period/date basis, store, currency and source freshness are explicit. Order and invoice measures do not
  silently become one amount; open carts are not sales. Missing report/index configuration has an actionable empty state.
- **Persisted/result evidence:** totals reconcile to source order/invoice/delivery/promotion/message/build records under the
  report's actual definitions. Export matches filters rather than merely the screen filename. Reports do not mutate records.
- **Recovery:** no rows, late index refresh, foreign store/group, invalid/too-wide period and unavailable report registration
  explain limits. Do not infer traffic/conversion attribution or third-party metrics from the commerce report names.
- **Modes:** M/T/S with CSV bytes and narrow tables; bounded Insights registration/return checks only where currently mounted.

### COM-33 — Inspect evidence, hidden helpers and consuming-context boundaries

- **Actor/start:** appropriate activity owner, reader, another store/customer, no-Commerce user, PASS public account and
  a legitimate second-app owner; known record, restricted record and missing record for each family.
- **Entry/actions:** From representative store/product/order/case context open Chatter and RecordFiles, including terminal
  helpers; add permitted disposable evidence and retrieve it. Exercise every shared descendant listed in section 3 using
  its actual route and parameters, including hidden BOM/cost/supplier/customer financial/service children. For each named
  inherited CSV family in section 3 (BOM overview/explosion/comparison/where-used/routing; standard costs/components/findings;
  Warehouse-only location/movement aliases), inspect denied Commerce output and separately the authorized owner's bytes,
  source/version/filter scope and absence of unrelated rows. Inspect permitted packaging/price-trace CSV as well. Inspect choices,
  record/palette/call providers, preview helpers, attachments and direct export requests under allowed and denied identities.
- **Visible result:** supported surface retains scope/record/return path; intentionally unavailable route is safe and clearly
  documented. Internal case/evidence and public review/download/Support capabilities never become interchangeable.
- **Persisted/result evidence:** evidence attaches to the intended record/audience; no unauthorized mutation, value or
  credential escapes in HTML/JSON/TUI, chosen-value labels, CSV/XLSX/JSON/feed/print/image/file bytes or error text.
- **Recovery:** stale link, removed grant, foreign `appRoot`/record, broken owner handoff and local/remote authority outage
  retain safe behavior. Record exact unresolved source concern rather than exposing a hidden route to make it pass.
- **Modes:** M/T/S plus paired P boundary observations. This supporting inspection does not authorize a regression sweep.

## 5. Existing checks and future verification

### Current regression coverage

The current BOSS Commerce subtree has **14 server regression specs**, one registered client golden-path spec and a shared
`CommerceSpecLib.js`. File existence is not proof of a run. The table describes inspected assertions; historical pass counts
or durations do not advance this review's pending ledger. Read exact fixtures/assertions before extending a check.

| Current `test/Commerce/` spec | What its assertions establish; corresponding review work |
| --- | --- |
| `CommerceAccess.spec.js` | Launcher/menu/providers, permission-derived capabilities, store/organization/record/choice checks, page/source/feed/placement authority and negative counterparts; COM-01, COM-13–COM-14, COM-18, COM-24, COM-31, COM-33 |
| `CommerceStores.spec.js` | Scoped stores/groups/readiness and focused store rendering/controls; not a complete clone/configuration walk; COM-02–COM-04 |
| `CommerceAssortment.spec.js` | Independent publish outcomes, shared-category impact, Commerce Product360 publication/catalog view without cost and supplier-price suppression; COM-08–COM-13 |
| `CommerceSitePages.spec.js` | Store-site page list, live/publication tab, published route save visibility and refusal of generic category parent/member writes; COM-09, COM-14 |
| `CommerceThemes.spec.js` | Designer/publisher/developer control separation, theme choices and one render of each terminal editor twin with persisted section move/source content; not actual terminal use; COM-16–COM-20 |
| `CommerceCheckoutSettings.spec.js` | Disabled gateway/scope refusals and selected CheckoutSettings render/readiness/actions; COM-05–COM-07 |
| `CommercePromotions.spec.js` | Promotion/code scope and focused PromotionDetail header/typed rule/limit/code presentation; complete consumption scenarios are elsewhere; COM-21 |
| `CommerceOrders.spec.js` | Held store order read/denied release and Commerce OrderDetail payment-hold/reorder plus CartDetail content; COM-23–COM-24 |
| `CommerceReviews.spec.js` | Per-review bulk results for valid/stale/foreign rows and focused moderation controls render; COM-22 |
| `CommerceRecovery.spec.js` | Enabled policy/opted-in idle cart recovery by operator with denied counterparts; not full browser/mail recovery; COM-25 |
| `CommerceReports.spec.js` | Placed-order versus open-cart totals, Home parity, Reports/store scope and focused report renders; COM-01, COM-32 |
| `CommerceSubscriptions.spec.js` | Store contract scope, refusal to retry unresolved payment, handler-name read and selected detail/pane renders; COM-12, COM-28 |
| `CommerceChannels.spec.js` | Scoped channel behavior and internal order note by operator versus channel-role refusal; COM-23, COM-29–COM-30 |
| `CommerceFeeds.spec.js` | Feed/detail preview/publish controls and channel health catalogue/store/role basis; COM-31–COM-32 |

`test/client/Commerce/CommerceThemesWalk.spec.js` is registered by `test/client/suite.js`: a designer enters the theme,
moves the home hero, saves/previews at phone width, then a publisher publishes. It is the one Commerce browser golden
path, not a whole-application responsive/accessibility, preview-security or public checkout review. Its client fixture
and data setup are prerequisites to inspect before any future run, not authorization to run it now.

### Existing acceptance and companion coverage

| Current acceptance source | Actual scenario boundary |
| --- | --- |
| `test/acceptance/Commerce/CommerceFoundationWalk.spec.js` | Group menus/areas, palette/store scope, forged records, public/client outsider refusal and demo foundation |
| `CommerceStoresWalk.spec.js` | Store creation/clone/configuration/read-only/scope/history and Stores route/tab walk |
| `CommerceAssortmentWalk.spec.js` | Virtual/variant publication/withdrawal, shared/cyclic category changes, form/tree agreement, no price-edit grant and Merchandising opens |
| `CommerceSitePagesWalk.spec.js` | Draft/publish schedule and Forum separation, invalid menu/redirect, lost publisher permission at schedule, Website opens |
| `CommerceCheckoutWalk.spec.js` | Readiness, local rate zones/no delivery, setting scenario and qvt/html CheckoutSettings |
| `CommercePromotionsWalk.spec.js` | Promotion creation, code generation, per-customer placement limit, expired usage, scope and promotion routes |
| `CommerceReviewsScenario.spec.js` | Delivered buyer/photo, moderation/reply/public projection and buyer edit returning review to pending |
| `CommerceRecoveryScenario.spec.js` | Signed-in preference versus guest, idle job notice once, fresh-session sign-in and one-use repriced restoration |
| `CommerceReportsScenario.spec.js` | Indexed order/invoice basis, Home/report/source reconciliation, store isolation and CSV rows |
| `CommerceChannelsScenario.spec.js` | Credential-dependent enablement, intake outcomes/replay/conflict, corrected retry and integration screens |
| `CommerceFeedsWalk.spec.js` | Create/build/publish, public Shop feed, withdrawal invalidation and health/Home evidence |
| `CommerceIsolationWalk.spec.js` | Consuming-context cost/price/margin constraints, credentials absent from configuration/CSV/print, record/preview/palette/choice scope |
| `CommerceServerStatic.spec.js` | Source audit and eligible qvt rendering across the sweep's discovered screens; no visual or full hidden-transition claim |
| `CommerceTui.spec.js` | Sweep model documents/no error node and selected twin data; does not establish terminal interaction |
| `test/acceptance/client/Commerce/ThemeEditorWalk.spec.js` | Drag versus keyboard section order/save, preview origin/nonce behavior and unsafe source diagnostic followed by clean save |

There are **14 Commerce server acceptance specs** and **one Commerce client acceptance spec**; the client registration is
in `test/acceptance/client/suite.js`, separate from the regression golden path. The sweep helper discovers physical and selected
mounted descendants; its route count must not substitute for the explicit inventory here. A sweep assertion over rendered
models does not establish permissions for every transition or actual responsive/keyboard/terminal usability.

Mantle owns durable rules. Relevant inspected families include `test/product/StoreAdmin.spec.js` (store/date/scope/history,
clone/readiness/checkout), `StorePromotions.spec.js` (typed rules, limits and concurrent placement), `StoreChannels.spec.js`
(identity, conflict, guarded staged import and feed rules), `ShopSubscriptions.spec.js` (consent, occurrence identity,
concurrent renewal, cancellation, refunds and scoped paid access), `test/order/StoreOperations.spec.js` (scoped operational
projection and idempotent current-price reorder), `ShopOperations.spec.js` (expiry/stuck placement/isolated jobs),
`ShopCart.spec.js`, `ShopCheckout.spec.js`, and `test/public/SitePages.spec.js`, `ThemeAuthoring.spec.js`,
`ThemeReleases.spec.js` (publication, validation, safe source/assets, preview and release revisions). These rule tests do
not substitute for a staff/customer activity or provider delivery evidence.

`test/product/StoreChannels.spec.js` prepares an existing managed EDI connection with conflicting document and quarantined
interchange (fixture lines 188–218); its assertions around lines 484–501 check safe first-line exception projection without
raw transaction text and refusal to retry the conflicting EDI document. These are narrow fixture/service assertions,
not coverage of the complete IntegrationDetail EdiDocuments/EdiInterchanges/RetryEdiDocuments UI, successful eligible EDI
retry, cross-store UI access, or connection-owner handoff. COM-29 keeps those live branches pending. The authoritative
contracts are `StoreChannelServices.get#StoreIntegration`, `store#StoreIntegration`, `retry#StoreMessages` and
`StoreChannels.js`'s scoped `retryStoreMessage` path; binding/mapping is not editable for EDI-managed connections.

PASS's Shop regression and acceptance sources establish consumer-side contracts. In particular
`test/acceptance/ShopOrdersInCommerce.spec.js` and `ShopSubscriptionsInCommerce.spec.js` exercise paired staff/public
outcomes when BOSS is installed; they are conditional companion scenarios, not a published Shop dependency on BOSS.
Shop theme-release, order, payment, subscription, operations, mount and local/remote fixture scenarios plus browser HTTP,
checkout/cart and accessibility walks remain in the Shop review's verification map. Confirm actual registrations and
installed components before selecting one later.

### Gaps, classification and permitted future work

Pending review includes actual Material light/dark/zoom and repeated-dialog behavior; real terminal focus/navigation;
Standard form-twin and output bytes; preview-host deployment and editor state recovery; all shared inherited descendant
and export boundaries; retained public identity/cart/payment state across release; remote outage/retry reconciliation;
provider uncertainty; local mail evidence; digital entitlement and Support capability separation. Existing tests are useful
starting evidence, not claims these modes were manually reviewed.

For a later implementation correction:

- Put business-rule assertions in Mantle and BOSS context/control assertions in BOSS. Reuse the nearest spec and fixture.
  Exercise the changed rule and its relevant denied counterpart; avoid tests that merely mirror markup or implementation.
- Regression belongs in `test/` / `test/client/`; run the changed component spec with `./moq test <component> --spec ...`
  under current building/testing instructions. No such command was run for this documentation batch.
- Render a screen at most once per mode across regression; a second mode requires that screen's own qvue/tui/render-mode
  branch. Consolidate assertions on the existing render. Do not add an application-wide screen/mode sweep or access matrix
  to regression. Keep the one Commerce browser golden path; put complete flows/matrices in acceptance.
- Acceptance is `test/acceptance/` / `test/acceptance/client/`, executed only when requested or when its test is added/changed under
  the repository rule. This document changes no test and supplies no such permission.
- Current BOSS regression budgets are **264 seconds server / 57 seconds client**, as recorded in `test/budget`; verify
  current values at execution. A spec over **15 seconds** must be moved to acceptance or removed, not hidden by a budget
  increase. No budget change is part of this review.
- Before a future application commit, use required `./moq test-apps`; framework changes use their own required checks.
  Do not run framework tests, `cargo test` or `test-all` merely for a Commerce app change. Node is not a test dependency.
- Browser/server HTTP fixtures and script checks do not prove an external payment, mail or provider result. Preserve keys
  and inspect authoritative state; independent failed batch items should not prevent unrelated items completing safely.

## 6. Coverage, findings and running record

### Pending activity ledger

`Pending` means no live execution evidence has yet been recorded for this review. `M/T/S/P` means applicable modes, not
passed modes. When execution is authorized, replace a pending cell with bounded evidence/result or an explicit prerequisite;
record partial branches rather than marking the whole activity complete. Public results link the companion activity/evidence.

| Activity | Applicable modes | Live coverage | Required evidence focus |
| --- | --- | --- | --- |
| COM-01 | M/T/S | Pending | Scoped launcher, picker, Home and provider results |
| COM-02 | M/T/S | Pending | New store, readiness, identity and site read |
| COM-03 | M/T/S | Pending | Dated bindings, staff scope, registered checks/history |
| COM-04 | M/T/S | Pending | Group/clone preview/result, CSV/print bytes |
| COM-05 | M/T/S/P | Pending | Effective checkout policy and public form/server agreement |
| COM-06 | M/T/S/P | Pending | Rate boundary, no-delivery and public quote |
| COM-07 | M/T/S/P | Pending | Gateway/tax scope, masking and authoritative offer |
| COM-08 | M/T/S | Pending | Store-specific assortment and catalog return path |
| COM-09 | M/T/S/P | Pending | Shared category impact, drag/key/form movement |
| COM-10 | M/T/S/P | Pending | Catalog/document context and actual permitted bytes |
| COM-11 | M/T/S/P | Pending | Price/availability basis and CSV/XLSX boundaries |
| COM-12 | M/T/S/P | Pending | Paid access/offer version and consent prerequisite |
| COM-13 | M/T/S/P | Pending | Publication batch outcomes and public withdrawal |
| COM-14 | M/T/S/P | Pending | Version/route/schedule/public content isolation |
| COM-15 | M/T/S/P | Pending | Navigation/redirect state and retained customer context |
| COM-16 | M/T/S | Pending | Draft import/identity and permission-specific actions |
| COM-17 | M/T/S | Pending | Saved composition/settings/assets and stale recovery |
| COM-18 | M/T/S | Pending | Source digest, file operations and safe diagnostics |
| COM-19 | M/T/S/P | Pending | Preview host/origin/token and synthetic private context |
| COM-20 | M/T/S/P | Pending | Release/restore/export and BOSS-free public operation |
| COM-21 | M/T/S/P | Pending | Typed promotion/code rule and placement limits |
| COM-22 | M/T/S/P | Pending | Moderation/reply/photo and public privacy |
| COM-23 | M/T/S/P | Pending | Physical/digital evidence, reorder and internal note |
| COM-24 | M/T/S/P | Pending | Uncertain/stuck payment resolution without duplicate effect |
| COM-25 | M/T/S/P | Pending | Consent, captured mail and explicit bounded restore |
| COM-26 | M/T/S/P | Pending | Return/Support ownership and guest capability boundaries |
| COM-27 | M/T/S/P | Pending | Scoped customer overview and hidden-child refusals |
| COM-28 | M/T/S/P | Pending | Billing/access distinction and safe renewal recovery |
| COM-29 | M/T/S | Pending | Connector/message identity, redaction and independent retry |
| COM-30 | M/T/S | Pending | Staged digest, commit identity and per-order outcomes |
| COM-31 | M/T/S/P | Pending | Built/active/public feed bytes and withdrawal |
| COM-32 | M/T/S | Pending | Report/Home/source reconciliation and CSV |
| COM-33 | M/T/S/P | Pending | Complete inherited/helper/output scope and evidence |

### Findings register

No live UI defects were observed in this documentation batch. Do not promote historical implementation finding numbers
or static suspicions into current observed defects. Reserve the next live finding **COM-UI-001**, then increment without
reuse. A finding records activity, route/mode, actor/fixture, expected/observed behavior, source/evidence, severity, owner,
proposed correction, verification and disposition. Cross-app findings link the Shop record instead of duplicating status.

| Finding | Activity / surface | Evidence and disposition |
| --- | --- | --- |
| None recorded | All activities | Live execution pending; COM-UI-001 is the next available identifier |

### Source concerns and prerequisites to resolve during execution

| Investigation input | Bounded question; not an observed defect |
| --- | --- |
| Physical versus visible Shared descendants | COM-10/COM-27/COM-33 must record actual response of each inherited route under Commerce context, especially Customer360 descendants and supplier/cost/BOM children |
| Inherited output eligibility | COM-10/COM-11/COM-33 must inspect permitted packaging/price-trace/selling-price exports separately from denied supplier/method/cost and Warehouse-only location/movement CSV through both Commerce aliases; pair each restricted family with an authorized owner output |
| Managed EDI exceptions | COM-29 requires an existing managed connection, safe document/interchange summaries and controlled eligible retry plus nonretryable/conflict/foreign-scope cases; narrow Mantle projection/refusal assertions are not full UI evidence |
| Preview deployment | COM-19 needs a separate preview host on the authority runtime with Mantle in process, configured frame origins and actual editor access; a remote PASS frontend treats hosts as live and is not a substitute preview host |
| Remote authority and retries | COM-13/COM-20/COM-24/COM-28/COM-31 need deliberately configured local and remote sites, controlled outage/lost-response fixtures and retained operation identity |
| Payment/provider confirmation | COM-07/COM-24/COM-28 need synthetic or separately approved sandbox provider evidence; screen statuses alone do not prove settlement, release or a refund |
| Digital and subscription fulfillment | COM-12/COM-23/COM-28 need installed resource handlers, approval/fulfillment progression, bounded download capability and clock-controlled paid terms; an order row alone does not establish usable access |
| Report freshness and registrations | COM-01/COM-32 need current report/DataDocument/index setup and exact window/basis; stale implementation counts and old Admin/Insights deferrals are not current facts |
| Mail and recovery preference | COM-25 needs a local mail sink and effective optional-email/preference settings, including revoked consent; no real recovery notice is authorized |
| Runtime/browser/device/terminal availability | All mode cells remain pending until measured environment and actual interaction evidence exist; model renders and viewport emulation are labeled accordingly |

### Bounded documentation-batch record

- **2026-11-10 — author source pass:** read repository practices, review/document/style guidance and prior plans;
  traced Commerce routes, shared descendants, controls, templates, services, grants, demo fixtures and current tests.
  Reconciled product/page/theme publication, operational ownership, inherited output declarations, public recovery and
  subscription access. Baseline supplied by coordinator: framework `47cd8a827ef2`, BOSS `65affc144440`, PASS `3bb823d3a31b`,
  Mantle `10d3b8c1f2e2`; the new file was absent and repositories clean at start. Static author checks found 33 unique
  activities and 33 pending rows, resolved Markdown targets/section anchors and no whitespace errors. Created this file
  only; no application/test/runtime action or live coverage advancement.
- **2026-11-10 — independent document review and recheck passed:** the separate reviewer required explicit managed-EDI
  exception/retry coverage and complete inherited CSV inventory. The author reread IntegrationDetail, StoreChannelServices,
  StoreChannels.js, StoreChannels rule fixtures/assertions and every affected Shared export declaration; added both branches,
  corrected message filters, and mapped permitted versus denied outputs with owner counterparts. These are source-only
  documentation corrections. The same independent reviewer rechecked both corrections against current sources, including
  all 25 inherited export form instances across their mounts, and found no further required corrections or introduced
  contradictions. All 33 live activities remain pending.
- **2026-11-10 — coordinator companion reconciliation complete:** compared both plans with current publication,
  offer/payment, fulfillment/access, subscription, identity/Support and local/remote authority contracts and the core-app
  owner boundaries. Added reciprocal activity checkpoints. Read-only checks passed for relative links/anchors, seven
  sections, activity/finding identifiers, inventory mappings, pending ledgers and whitespace; repository state confirms
  only the two requested new documents, with baseline revisions unchanged. Both independent reviews and correction
  rechecks passed. Documentation is complete; source concerns and all live coverage remain pending. No builds, runtimes,
  walkthroughs, tests or commits were performed.

Keep later execution notes bounded by wave: sources/runtime/fixtures, activity/mode evidence, findings/corrections,
verification and remaining prerequisites. Do not turn this document into an unbounded command transcript.

## 7. Decisions

| Decision | Rationale / later boundary |
| --- | --- |
| Documentation-only companion batch | Only this new Commerce plan and Shop's new plan change; no application/API/test changes, builds, runtimes, walks, test runs or commits |
| Seven-part living review document | Matches Accounting/core plans while retaining Commerce's actual public-authoring and operational scope |
| Current source wins | Old placeholder/proposed/deferred tables are historical evidence; implemented current routes/contracts are inventoried |
| Full physical/digital/subscription coverage | Store publication, customer offer, fulfillment/download access and recurrence are inseparable operational handoffs |
| Separate publication boundaries | Assortment save, product publication, page/navigation publication and theme release/restore have separate authority, revisions and effects |
| Immutable theme release; retained commerce state | Restoring presentation does not restore withdrawn products/pages or undo carts, orders/payments; reconciliation can finish open attempts after a release/mount change |
| Staff/public authority separation | Commerce is an author/operational consumer; published Shop runs on PASS/Mantle authority without BOSS; preview specifically requires Mantle in process on its authority host |
| Store and organization checks at each boundary | Menus, StoreStaff assignment, shared mounts and browser state do not grant permission; record/helper/output reads and mutations retain service checks |
| Actual UI controls govern activities | No generic carriers, refunds, case-reply, manufacturing or inherited financial editor is invented in Commerce; explicit owner handoffs retain context |
| Cart and payment uncertainty remain visible | Retry/reconcile preserves identity; stuck placement resolution is explicit, scoped, reasoned and dependent on provider confirmation |
| Subscription cancellation differs from financial refund | Cancel stops future renewal and preserves paid term; separate financial reversal affects the term actually paid, not unrelated entitlements |
| Material/TUI/Standard reflect implemented alternatives | Three custom Vue surfaces have actual form/TUI twins; ordinary shared branches and declared outputs remain in inventory |
| Public criteria belong to Shop | Include ordinary forms, optional Vue, JavaScript-disabled paths, root/prefixed mounts and accessibility; do not invent a Shop TUI |
| All live coverage pending | Source/document review and existing test assertions do not establish runtime/provider/device or user activity results |
| Future verification follows current suite rules | Focused regressions for rules/fixed bugs; scenarios/sweeps in acceptance with explicit execution authority; no budget increase or new acceptance authorization here |
| Deferred capabilities stay separate | Liquid/marketplace/git themes, POS, advanced B2B, loyalty, gift/store credit and click-and-collect are not built to satisfy this review |
