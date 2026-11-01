# IronStone BOSS — Commerce design

Oct 31, 2026 — design specification; application implementation remains future.

IronStone Commerce serves e-commerce and channel managers: store operations, merchandising,
online orders and carts, promotions, checkout configuration, integrations, and storefront
authoring. **IronStone Shop**, part of **IronStone PASS**, is its public companion in `mr-pass`.
They share Mantle business records. Commerce owns the staff theme and page editors; Shop renders
published releases and serves customers without a runtime dependency on BOSS.

**Inputs:** [commerce research](research-commerce.md), [design guide](design-doc-guide.md),
[style guide](style-guide.md), [crosscut](design-crosscut.md), [Products](design-products.md),
[Warehouse](design-warehouse.md), [Accounting](design-accounting.md),
[Customer Service](design-customer-service.md), [Commons/Comms](design-drawers-commons.md),
[Shop](../../mr-pass/plan/design-shop.md), [Forum foundation](../../mr-pass/plan/design-forum.md),
[screen inventory](ss-inventory.md), and [service inventory](usl-inventory.md).
Source verification uses the current `mr-mantle`, `mr-marble`, and `mr-pass` checkouts. Shop §3
adds storefront and template research, including the Java PopRestStore source. Research records
observations; this document decides the staff behavior.

**Sections:** [1 shell](#1-shell) · [2 screens](#2-screens) · [3 stores](#3-home-and-stores) ·
[4 merchandising](#4-merchandising) · [5 website](#5-website-authoring) ·
[6 orders](#6-orders-carts-and-customers) · [7 promotions](#7-promotions) ·
[8 checkout settings](#8-checkout-settings) · [9 channels](#9-integrations-and-feeds) ·
[10 shared contracts](#10-shared-screen-contexts) · [11 automation](#11-automation-and-operations) ·
[12 coverage](#12-coverage-and-acceptance) · [13 outputs](#13-documents-and-outputs) ·
[14 needs](#14-framework-and-data-needs) · [15 delivery](#15-delivery-stages) ·
[16 decisions](#16-decided) · [17 open](#17-open).

## 1. Shell

### 1.1 Root and access

Root `screen/Commerce.xml`, app path `Commerce`, icon `sym_o_storefront`. The root and its
section placeholders exist, but the `BOSS_COMMERCE` grant is commented out; they are not a built
Commerce application. Keep the existing `mantle.party.PartyServices.setup#UserOrganizationInfo`
call, and add proposed `ironstone.commerce.ContextServices.get#SharedContext` for capabilities,
authorized store choices, `appRoot`, and `sharedLinks`.

The following permissions and their BOSS role mappings are **proposed**. Permission checks live
in Mantle services, including reads, choices, exports, jobs and public projections. A store must
belong to an authorized organization; a dated `ProductStoreParty` assignment narrows access for
a store-limited staff member. A store assignment never grants a permission by itself. App entry
does not grant access to another app's records, and edits do not imply view permissions.

| Capability | Permission | Typical role and boundary |
| --- | --- | --- |
| Enter and read stores | `COMMERCE_VIEW` | Commerce reader; store/organization scoped |
| Maintain store configuration | `COMMERCE_STORE_EDIT` | Store manager; cannot set operator host allowlists or credentials |
| Manage merchandising | `COMMERCE_MERCHANDISE` | Merchandiser; assortment, navigation and review moderation; master edits need Products grants |
| Publish assortment/content | `COMMERCE_PUBLISH` | Publisher; explicit audience and readiness check |
| Edit visual themes/pages | `COMMERCE_THEME_EDIT` | Designer; draft settings/composition/assets |
| Edit template source | `COMMERCE_THEME_CODE` | Theme developer; locked templates only; does not permit browser scripts |
| Publish or restore a theme | `COMMERCE_THEME_PUBLISH` | Publisher; validated release, preview and confirmation |
| Work orders/carts | `COMMERCE_ORDER_VIEW`, `COMMERCE_RECOVERY` | Operator; existing order/return/financial capabilities still govern mutations |
| Maintain promotions | `COMMERCE_PROMOTION_EDIT` | Promotion manager; store-scoped registered promotion services |
| Operate integrations | `COMMERCE_CHANNEL_OPERATE` | Channel operator; retry/import and feed publication; no gateway secrets |
| Manage recurring contracts | `COMMERCE_SUBSCRIPTION_MANAGE` | Subscription operator; scoped schedule/cancellation, no implicit refund authority |

Proposed starter role mappings compose the app-entry group with an explicit role; a deployment
may assign narrower permission sets. Publishing is not implied by editing.

| Group | Proposed grants |
| --- | --- |
| `BOSS_COMMERCE` | `COMMERCE_VIEW` and scoped app entry |
| `BOSS_COMMERCE_MANAGER` | `COMMERCE_STORE_EDIT`, `COMMERCE_PROMOTION_EDIT` |
| `BOSS_COMMERCE_MERCHANDISER` | `COMMERCE_MERCHANDISE` |
| `BOSS_COMMERCE_DESIGNER` | `COMMERCE_THEME_EDIT` |
| `BOSS_COMMERCE_THEME_DEVELOPER` | `COMMERCE_THEME_EDIT`, `COMMERCE_THEME_CODE` |
| `BOSS_COMMERCE_PUBLISHER` | `COMMERCE_PUBLISH`, `COMMERCE_THEME_PUBLISH` |
| `BOSS_COMMERCE_OPERATOR` | `COMMERCE_ORDER_VIEW`, `COMMERCE_RECOVERY` |
| `BOSS_COMMERCE_CHANNEL_OPERATOR` | `COMMERCE_CHANNEL_OPERATE` |
| `BOSS_COMMERCE_SUBSCRIPTION_OPERATOR` | `COMMERCE_ORDER_VIEW`, `COMMERCE_SUBSCRIPTION_MANAGE` |

Group names supply grants, never service logic. Financial, product-price and warehouse privileges
are granted separately using their owning domains' permissions. Costs, margins, gateway payloads,
and customer-private fields are omitted from unauthorized service responses.

### 1.2 Navigation and landing

- Home — Home.
- Stores — Stores, StoreDetail, StoreGroups.
- Merchandising — Merchandising, StoreCategories, Reviews; Product360 and content links.
- Website — Themes, ThemeDetail, ThemeEditor, TemplateEditor; Pages, PageDetail, Navigation.
- Orders — Orders, OrderDetail, Carts, CartDetail; Returns, ReturnDetail.
- Customers — Customers, Customer360; Subscriptions, SubscriptionDetail; Requests, RequestDetail.
- Promotions — Promotions, PromotionDetail, PromoCodes, PromoCodeDetail.
- Integrations — Integrations, IntegrationDetail, ChannelImport; Feeds, FeedDetail.
- Settings — CheckoutSettings; shared Carriers, PaymentMethods, TaxAuthorities and pricing links.

Home has a store selector, action cards for approval/unpaid/fulfillment/cart/review/integration
work, a recent orders list, and visits/orders/net-sales comparisons for one selected period.
Each card opens the same scoped list used elsewhere. Values in different currencies are never
summed without an explicit reporting currency and Accounting's conversion policy. Visits exclude
preview/test traffic; orders exclude carts; refunds are separate from gross sales. Define
conversion against the same site/store/window and explain that aggregate visits are not people.
When visit collection is disabled, hide the visitor/conversion cards rather than show zero.

The shell receives store, site, record, selection and filter context. Register store/product/order
palette providers and scoped quick-create actions; unread intake errors and approval work reuse
existing notification/Today mechanisms. Never put guest capabilities, payment tokens or preview
credentials in Assist, Chatter, URLs copied to staff notes, or generic telemetry.

### 1.3 Conventions and service aliases

XML forms are the default. The category composer and theme/source editors use `.qvue` because
their interactions require it; each has a functional TUI alternative for ordered lists, typed
settings, file edits, validation and publication. Staff lists have mobile columns and paginated
queries. Preview works at phone and desktop widths. All dates use the user's zone, amounts use
currency precision, and writes check the expected row/release revision.

The aliases below name **proposed** service files, not existing services. Forms naming an alias
call the full package below. Ordinary short business operations use XML Actions. BOSS services
only supply access/context or presentation work; they do not duplicate Mantle business services.

| Alias | Proposed full service package | Responsibility |
| --- | --- | --- |
| C | `mantle.product.StoreAdminServices` | Scoped stores, settings, groups, readiness and store bindings |
| M | `mantle.product.StoreMerchandisingServices` | Assortment publication, tree changes, reviews and SEO |
| O | `mantle.order.StoreOperationsServices` | Store worklists, cart recovery and customer-safe operational summaries |
| P | `mantle.product.StorePromotionServices` | Guarded promotion/code maintenance over existing promotion entities |
| T | `mantle.public.ThemeServices` | Theme drafts/releases, page/navigation binding and preview authority; renderer contract in Shop §12 |
| I | `mantle.product.StoreChannelServices` | Store-bound integrations, imports, feed jobs and outcomes |
| R | `mantle.product.ShopSubscriptionServices` | Recurring purchase/renewal lifecycle, also used by Shop through public wrappers |

## 2. Screens

Paths are app identities, not a promise that the screens exist. Simple dialogs are forms on
their parent. StoreDetail's tabs and CheckoutSettings' groups are sections of those screens.
`parity` preserves baseline functionality; `new` belongs in the complete first release.
Stages C1–C4 are defined in §15. Shared rows are defined by their owner and contextualized in §10.

| Screen | Path | Archetype | Impl | Purpose | Main record | Reused | Roles | Scope/stage | Context |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home | Commerce/Home | landing | xml | Triage store work | scoped operational projection | dashboard widgets, crosscut | reader | new C1 | stores, period |
| Stores | Commerce/Stores | list | xml | Find/create stores | ProductStore | own | reader; manager writes | parity C1 | filters |
| StoreDetail | Commerce/Stores/StoreDetail | detail | xml | Configure one channel | ProductStore | own | reader; manager writes | parity C1 | store |
| StoreGroups | Commerce/Stores/StoreGroups | settings | xml | Maintain dated groups | ProductStoreGroup | own | manager | new C1 | organization, group |
| Merchandising | Commerce/Merchandising | list | xml | Prepare/publish assortment | ProductStoreProduct + publication | own | merchandiser/publisher | new C1 | store, products |
| StoreCategories | Commerce/Merchandising/StoreCategories | tree list | qvue | Arrange storefront categories | ProductStoreCategory + ProductCategoryRollup | own | merchandiser | parity C1 | store, category |
| Product360 | Commerce/Merchandising/Product360 | 360 | xml | Edit merchandising facets | Product | crosscut §3.5 | domain grants | parity C1 | product, store |
| CategoryDetail | Commerce/Merchandising/CategoryDetail | detail | xml | Edit category identity | ProductCategory | Products §5 | domain grants | parity C1 | category, store |
| CategoryContent | Commerce/Merchandising/CategoryDetail/Content | editor | xml | Maintain category content | ProductCategoryContent | Products §5 | domain grants | parity C1 | category, store |
| Documents | Commerce/Merchandising/Documents | list | xml | Find product content | ProductContent | Products §9 | domain grants | parity C1 | product, store |
| DocumentDetail | Commerce/Merchandising/Documents/DocumentDetail | detail | xml | Edit a content binding | ProductContent | Products §9 | domain grants | parity C1 | content, store |
| Reviews | Commerce/Merchandising/Reviews | split | xml | Moderate product reviews | ProductReview | own | merchandiser | new C2 | store, review |
| Themes | Commerce/Website/Themes | list | xml | Find/copy/import themes | proposed PublicTheme | own | designer | new C1 | site, store |
| ThemeDetail | Commerce/Website/Themes/ThemeDetail | detail | xml | Validate and publish releases | proposed PublicThemeRelease | own | designer/publisher | new C1 | theme, release |
| ThemeEditor | Commerce/Website/Themes/ThemeEditor | editor | qvue | Compose templates visually | proposed theme draft | own | designer | new C1 | template, section |
| TemplateEditor | Commerce/Website/Themes/TemplateEditor | editor | qvue | Edit locked template source | versioned resource | framework editor/diff, own workflow | theme developer | new C1 | theme, file, revision |
| Pages | Commerce/Website/Pages | list | xml | Manage shop pages and policies | WikiPage + proposed PublicShopPage | own | designer/publisher | new C1 | site, filters |
| PageDetail | Commerce/Website/Pages/PageDetail | editor | xml | Edit content and assign a template | WikiPage + PublicShopPage | Wiki editor, own publication | designer/publisher | new C1 | page, version |
| Navigation | Commerce/Website/Navigation | tree list | xml | Edit menus and redirects | proposed PublicShopNavigation | own | designer/publisher | new C1 | site, menu |
| Orders | Commerce/Orders | list | xml | Work submitted online orders | OrderHeader | own list, shared order reads | order reader | parity C2 | store, filters |
| OrderDetail | Commerce/Orders/OrderDetail | detail | xml | Work an authorized order | OrderHeader | crosscut §3.6 | domain grants | parity C2 | order, store |
| Carts | Commerce/Orders/Carts | list | xml | Inspect open/abandoned carts | OrderHeader + proposed StoreCartAccess | own | order reader | new C2 | store, filters |
| CartDetail | Commerce/Orders/Carts/CartDetail | detail | xml | Diagnose and recover a cart | OrderHeader + StoreCheckout | own | order reader/recovery | new C2 | cart, store |
| Returns | Commerce/Orders/Returns | list | xml | Find online returns | ReturnHeader | own list, shared return reads | domain grants | new C2 | store, filters |
| ReturnDetail | Commerce/Orders/Returns/ReturnDetail | detail | xml | Follow return authorization/settlement | ReturnHeader | crosscut §3.18 | domain grants | parity C2 | return, store |
| Customers | Commerce/Customers | list | xml | Find customers of permitted stores | PartyDetail | own scoped list | order reader | new C2 | store, filters |
| Customer360 | Commerce/Customers/Customer360 | 360 | xml | Inspect store relationships | Party | crosscut §3.2 | domain grants | parity C2 | customer, store |
| Subscriptions | Commerce/Customers/Subscriptions | list | xml | Monitor recurring contracts | Subscription + proposed StoreRecurringContract | own | order reader | new C3 | store, filters |
| SubscriptionDetail | Commerce/Customers/Subscriptions/SubscriptionDetail | detail | xml | Resolve renewal/cancellation work | StoreRecurringContract | own | subscription manager | new C3 | contract |
| Requests | Commerce/Customers/Requests | list | xml | Triage store-filed requests | Request | own filtered list | request grants | new C2 | store, filters |
| RequestDetail | Commerce/Customers/Requests/RequestDetail | detail | xml | Work a linked case/request | Request | Projects §6 / crosscut §3.11 | request grants | parity C2 | request |
| Promotions | Commerce/Promotions | list | xml | Find store promotions | ProductStorePromotion | own; shared definition §7 | promotion manager | parity C2 | store, filters |
| PromotionDetail | Commerce/Promotions/PromotionDetail | detail | xml | Configure one promotion | ProductStorePromotion | own; shared definition §7 | promotion manager | parity C2 | promotion |
| PromoCodes | Commerce/Promotions/PromoCodes | list | xml | Find/generate codes | ProductStorePromoCode | own; shared definition §7 | promotion manager | parity C2 | promotion, codes |
| PromoCodeDetail | Commerce/Promotions/PromoCodes/PromoCodeDetail | detail | xml | Configure eligibility and limits | ProductStorePromoCode | own; shared definition §7 | promotion manager | parity C2 | code |
| CheckoutSettings | Commerce/Settings/CheckoutSettings | settings | xml | Configure checkout choices | ProductStore + gateway/ship bindings | own | manager | parity C2 | store |
| Carriers | Commerce/Settings/Carriers | settings | xml | Inspect carrier/method definitions | CarrierShipmentMethod | Warehouse §12 | reader | parity C2 | store |
| PaymentMethods | Commerce/Settings/PaymentMethods | settings | xml | Inspect approved payment configuration | PaymentGatewayConfig | Accounting §15 | reader | parity C2 | organization |
| TaxAuthorities | Commerce/Settings/TaxAuthorities | list | xml | Inspect tax configuration | TaxAuthority | Accounting §11 | reader | parity C2 | organization |
| PriceLists | Commerce/Merchandising/PriceLists | list | xml | Inspect store price policy | ProductPriceList | Products §7 | price grants | parity C1 | store |
| PriceListDetail | Commerce/Merchandising/PriceLists/PriceListDetail | detail | xml | Maintain permitted price rules | ProductPriceList | Products §7 | price grants | parity C1 | store, list |
| PriceExplain | Commerce/Merchandising/PriceExplain | report | xml | Explain a storefront price | pricing projection | Products §7 | price grants | new C1 | store, product, buyer |
| InventoryAvailability | Commerce/Merchandising/InventoryAvailability | list | xml | Inspect store facility availability | availability projection | crosscut §3.7 | stock grants | parity C2 | store, product |
| Integrations | Commerce/Integrations | list | xml | Inspect channel connections | SystemMessageRemote | own | channel operator | new C4 | store, filters |
| IntegrationDetail | Commerce/Integrations/IntegrationDetail | detail | xml | Resolve channel message failures | SystemMessageRemote + SystemMessage | own | channel operator | new C4 | store, remote |
| ChannelImport | Commerce/Integrations/ChannelImport | wizard | xml | Validate/import channel orders | SystemMessage + import batch | own | channel operator | new C4 | store, batch |
| Feeds | Commerce/Integrations/Feeds | list | xml | Manage public product feeds | proposed ProductStoreFeed | own | channel operator | new C4 | store, filters |
| FeedDetail | Commerce/Integrations/Feeds/FeedDetail | detail | xml | Build/inspect a feed | ProductStoreFeed | own | channel operator/publisher | new C4 | feed, build |

## 3. Home and stores

### Home

**Layout:** landing; action cards precede recent orders and channel errors. No bespoke analytics
engine. **Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| HomeScope | find | Select permitted stores and period | store/group, period, channel | store search, date-period | — | Odoo eCommerce dashboard; research §1 |
| WorkCards | display | Open actionable work | approval, fulfillment, unpaid, carts, reviews, errors | dashboard number cards | O.get#StoreWorkSummary | Odoo sale.order dashboard |
| RecentOrders | list, read | Open the next order | number, customer, date, state, total | record link, currency | O.find#StoreOrders | SimpleScreens Order/FindOrder |

**Actions/navigation:** cards preserve store and period filters; first-use state links Create
store and its readiness checklist. Partial provider failures name the affected source and leave
independent cards usable. **Source:** research §1, §12. **Needs:** COM-ACCESS, COM-OPS.

### Stores

**Layout:** list; name is the record link, with organization, channel, locale/currency and site
readiness. **Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| StoreFind | find | Narrow stores | name, organization, channel, group | server-search choices | — | FindProductStore |
| Stores | list | Inspect store configuration | store, organization, default channel/currency, site | status chips | C.find#Stores | FindProductStore StoresForm |
| NewStore | dialog | Create a disabled/unpublished channel | name, organization, channel, currency, locale, facility | authorized choices | C.store#Store | FindProductStore NewStoreForm |

Creation does not enable a public mount or copy a gateway credential. Defaults come from the
organization, not hard-coded currency/locale. **Source:** research §2, §11. **Needs:** COM-ACCESS,
COM-STORE.

### StoreDetail

**Layout:** record header and tabs General, Sites, Facilities, Staff, Emails, Order checks,
Search/content, History. Settings are grouped by meaning, not arbitrary enum IDs.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| General | single | Maintain channel policy | name, organization, currency, locale, channel, reservation, requireInventory, autoApproveDelay | grouped fields, source hints | C.store#Store | EditProductStore EditStoreForm |
| SiteBindings | list, read | Inspect host/mount/publication | site, canonical host, mount, store, readiness | preview and operator-settings links | C.get#StoreSites | PopRestStore settings; PASS PublicSiteApp |
| Facilities | list, editable rows | Bind fulfillment facilities | facility, priority, effective dates | facility search | C.store#StoreFacility | FindProductStoreFacility forms |
| Staff | list, editable rows | Scope staff to a store | party, role, effective dates | authorized staff lookup | C.store#StoreParty | FindProductStoreParty forms |
| Emails | list, editable rows | Choose registered output templates | email type, template, dates, header/detail links, internal BCC | template preview | C.store#StoreEmail | FindProductStoreEmails forms |
| OrderChecks | list, editable rows | Configure approved validation hooks | registered check, order, dates, typed parameters | ServiceRegister selector | C.store#StoreApproval | ProductStoreApprove; research §11 |
| SearchContent | list, editable rows | Bind search and content sources | document type/id, wiki space/type, locale, effective dates | registered source choices | C.store#StoreContentBinding | EditProductStore data-document forms; ProductStoreWikiSpace/Content |
| TypedSettings | list, editable rows | Maintain other supported dated settings | setting type, value, dates | input derived from registered type | C.store#StoreSetting | FindProductStoreSettings forms |
| CloneStore | dialog | Copy permitted configuration | target name/org, selected settings/categories/facilities/promotions | copy preview | existing `mantle.product.StoreServices.clone#ProductStore`, through C.clone#Store guard | EditProductStore CloneProductStoreForm |
| Readiness | display | Explain publication/checkout blockers | site, catalog, theme, payments, delivery/tax, content issues | actionable findings | C.check#StoreReadiness | Odoo store settings; PASS readiness |

Clone starts unpublished, with no host mount, active recovery schedule, external credentials,
customer data or running connector. It produces a per-section result and requires explicit
approval of copied organization-sensitive references. An authorized operator binds hosts/mounts
through existing `mantle.public.SiteServices.store#Mounts`; Commerce shows the result and cannot
bypass the runtime allowlist. `storeDomain` is an email compatibility value, not a second router.

Staff cannot select arbitrary service names, resource URLs, sender identities, or remote origins.
Search/content bindings do not publish a private wiki space or expose a raw DataDocument.
**Source:** research §2, §11; Shop §§4, 12. **Needs:** COM-STORE, COM-ACCESS, SHOP-MOUNT.

### StoreGroups

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| GroupList | list | Find a group | name, member count | record links | C.find#StoreGroups | ProductStoreGroup; research §11 |
| GroupEdit | single | Maintain a group | name, description | — | C.store#StoreGroup | ProductStoreGroup |
| Members | list, editable rows | Bind stores | store, from/thru | authorized store lookup | C.store#StoreGroup | ProductStoreGroupMember; proposed dates |
| Parties | list, editable rows | Bind group parties | party, role, from/thru | party lookup | C.store#StoreGroup | ProductStoreGroupParty |

Baseline entities are `ProductStoreGroup`,
`ProductStoreGroupMember`, `ProductStoreGroupParty`; there is no baseline screen. These are the
complete new form fields, plus generated keys, expected revision and change reason.

Groups select stores for reporting and explicit bulk operations. They do not inherit settings,
share carts, combine currency totals, or turn per-store promotions into one global promotion.
Each bulk item is reauthorized and reports success/error independently. **Source:** research
§11–§12. **Needs:** COM-STORE.

## 4. Merchandising

### Merchandising

**Layout:** list with readiness and visibility facets. Publishing a product is separate from
editing its master or including it in a search category. **Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| AssortmentFind | find | Find products for this store | category, text, draft/published, readiness, type | server search | — | Odoo website products; research §3 |
| Assortment | list | Inspect store availability | product, publication, price readiness, stock policy, template, effective dates | preview, state chips | M.find#StoreProducts | ProductStoreProduct + Ever Gauzy channel product binding |
| StoreProduct | dialog | Maintain storefront overrides | publication, dates, template key, badge text, featured rank, signature requirement | approved template choice | M.store#StoreProduct | ProductStoreProduct; Odoo ribbons/publish |
| PublishProducts | list, bulk | Preview then publish/withdraw | selection, target state, effective time, reason, findings | audience preview | M.preview#Publication; M.publish#StoreProducts | Odoo published-multi-website |

**Policy:** explicit store publication is required for every public product, including variants.
The resolver intersects publication, effective categories, `PsctViewAllow`/`PsctPurchaseAllow`,
product sellability and site access. It never treats an empty allow-category as an instruction to
publish the entire catalog. Existing stores get an import preview, not automatic publication.
Shop §5 owns the exact projection and parent/variant rules. Withdrawal invalidates search,
feeds, recommendations and caches; existing orders retain their private historical description.

**Navigation:** Product360 opens with store fixed; product content, category and price links
mount their owning screens. **Source:** research §3, §12. **Needs:** COM-MERCH, SHOP-CATALOG.

### StoreCategories

**Layout:** left hierarchy, right category membership/products; `.qvue` handles drag ordering.
The TUI twin has parent and sequence fields with Move up/down actions.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| StoreRoots | list, editable rows | Bind category roles | type, category, dates, sequence | category lookup | M.store#StoreCategory | FindProductStoreCategory forms |
| CategoryTree | component | Move/reorder dated rollups | parent, child, sequence, dates | tree with move preview | M.move#StoreCategory | ProductCategoryRollup; Odoo category tree |
| CategoryProducts | list, editable rows | Arrange membership | product, dates, sequence | bulk assign/remove | M.store#CategoryMembership | Products category membership forms |

Store roots are `ProductStoreCategory`; descendants remain `ProductCategoryRollup`, not a second
public taxonomy. A category may be shared: the preview names all affected stores before a shared
rollup/membership change. Copy a store taxonomy explicitly if an independent hierarchy is needed.
Cycle and effective-date checks are mandatory. A category editor does not grant product
publication. **Source:** research §3, §11. **Needs:** COM-MERCH.

### Reviews

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ReviewFind | find | Narrow the queue | store, product, status, date, reporter | product lookup | — | research §3 |
| Reviews | list | Inspect submitted reviews | product, rating, author display, date, state | review preview | M.find#Reviews | ProductReview |
| ReviewDecision | single | Moderate selected reviews | review, approve/delete, reason, expected revision | body preview, confirmation | M.moderate#Review | ProductReview statuses; ridgecrest reviews |

Reads use M.find#Reviews; decisions use M.moderate#Review over existing
`ProductReview` and `PrvwPending`, `PrvwApproved`, `PrvwDeleted`. The full new decision form has
only those fields; no editable replacement for a customer's text.

Submitted reviews start pending. Public projection strips private author IDs/contact details;
verified-purchase evidence is computed from the actor's qualifying order, not a checkbox.
An author edit returns an approved review to pending through a proposed status-flow extension
and guarded Shop operation. Product discussion links use Forum's separate
communication records; reviews do not become copied forum posts. Bulk decisions confirm counts
and preserve per-review outcomes. **Source:** research §3 and ridgecrest's different review model.
**Needs:** COM-MERCH, SHOP-CATALOG.

## 5. Website authoring

This section is the **one definition of the staff editors**. Shop §12 owns the theme package,
safe rendering and public release contract. No authoring screen or authoring service is exposed
through the public Shop operation registry. Visual designers can manage safe assets and
translations without template-code permission; code edits and publication require their
separate grants. The underlying theme records/services are in Mantle
and versioned resources in the framework, so published sites keep running without BOSS.

### Themes

**Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ThemeFind | find | Find permitted themes | site, store, name, draft/live, engine | search | — | Shopify theme library |
| ThemeList | list | Inspect installed themes | name, engine/API version, active release, draft, validation | live/draft chips | T.find#Themes | Shopify theme library |
| NewTheme | dialog | Copy a starter or existing release | name, site/mount, source theme/release | starter preview | T.create#ThemeDraft | Shopify duplicate theme |
| ImportTheme | dialog | Stage a package for validation | name, package upload, target site/mount | scanned file upload | T.import#Theme | Shopify theme upload |

Imports are draft-only, size/path checked and declarative: no install scripts, dependency fetches,
or arbitrary executable browser assets. A package's renderer ID must be installed by the operator.
The initial engine is `js-fancy`; a Liquid package is refused with a clear unsupported-engine
finding. **Source:** Shop §3 R5, §12. **Needs:** COM-THEME, SHOP-THEME.

### ThemeDetail

**Layout:** record header, Overview, Validation, Releases, Bindings and Activity. **Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ThemeIdentity | single | Describe a draft | name, description, engine, API version | engine read-only after creation | T.store#ThemeDraft | Shopify theme metadata |
| Validation | display | Review publish blockers | files, schemas, routes, required components, assets, budgets | file/line links | T.validate#Theme | Shopify theme checks; PASS readiness |
| Bindings | list | Inspect pages using a template | site/mount, page kind, resource, template key | affected-page links | T.get#ThemeBindings | Shopify alternate templates |
| Releases | list, read | Inspect immutable releases | revision, author, published date, digest, previous release | diff and preview | T.get#ThemeHistory | framework resource revisions |
| PublishTheme | dialog | Activate a validated release | draft revision, target site/mount, validation digest, change reason | preview and affected-resource summary | T.publish#Theme | Shopify publish; framework change sets |
| RestoreRelease | dialog | Republish an earlier release | release, expected active revision, reason, findings | comparison | T.restore#ThemeRelease | framework revisions |
| ExportTheme | single | Export an authorized immutable release | selected release, manifest/API version | bounded archive download | T.export#ThemeRelease | Shopify theme download; framework resources |

Preview and Publish are separate actions. Publish confirms the site, store and release; it
atomically switches the active release after revalidation against current permissions and
bindings. Rollback is a new activation of old immutable content, not rewriting history. A stale
draft/release or incomplete resource transfer cannot replace the live site. A base-theme upgrade
creates a draft with a three-way comparison; unresolved merchant edits are explicit conflicts.
**Needs:** COM-THEME, SHOP-THEME, SHOP-RENDER.

### ThemeEditor

**Layout:** `.qvue` with page/resource selector and device width at top; section/block outline at
left; isolated Shop preview in the center; schema-generated settings at right. Use shared inputs,
undo/redo within the draft, explicit save, unsaved-change warning and file/release status. Preview
selection messages are origin-checked and carry only section IDs, never arbitrary commands.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| PreviewContext | single | Select a representative page | site/mount, locale, page kind, product/category/page, width | authorized record search | T.create#ThemePreview | Shopify editor preview |
| Composition | component | Add/move/duplicate/remove sections and blocks | template key, section/block ID, type, order, disabled | drag tree, keyboard movement | T.store#ThemeComposition | Shopify JSON templates/sections |
| SectionSettings | single | Edit typed values and data bindings | settings from selected schema | image/product/category/page pickers, rich text, colors | T.store#ThemeSettings | Shopify setting schema; Frappe Web Template fields |
| ThemeSettings | single | Edit global design values | schema-defined palette, typography, spacing, brand assets | contrast feedback | T.store#ThemeSettings | Shopify global settings |
| ThemeAssets | list, read | Inspect package assets | relative path, media type, size, digest, references | safe thumbnail and usage links | T.get#ThemeAssets | Shopify asset directory; framework media |
| UploadAsset | dialog | Add or replace a draft asset | scanned upload, relative target path, expected revision | bounded upload and replacement preview | T.store#ThemeAsset | framework upload/scanner |
| Translations | list, editable rows | Edit localized theme text | locale, stable key, text, fallback indicator, revision | locale/key filter and fallback preview | T.get#ThemeTranslations, T.store#ThemeTranslations | Shopify locale resources; framework translations |
| TemplateAssignment | dialog | Choose an alternate template | target kind/id, template key | resource preview | T.assign#ThemeTemplate | Shopify alternate templates |

The schema is the complete field list for settings forms; composition fields above are complete,
with expected draft revision on every save. Product price and availability are approved dynamic
sources, not editable literals masquerading as business values. Mandatory product/cart/checkout
components cannot be removed. A theme may choose layout and explanatory content around them;
payment SDK mounts and final submit behavior remain trusted components. The TUI twin lists the
same sections/settings and offers validated reorder/save/preview-link/publish actions.
**Source:** Shop §3 R3–R5, §12. **Needs:** COM-THEME, SHOP-THEME, SHOP-RENDER.

### TemplateEditor

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ThemeFiles | component | Select a package resource | package tree, file kind | bounded file tree | T.get#ThemeFile | framework resources; Shopify code editor |
| Source | component | Edit locked source | selected file, text, base revision | source editor | T.store#ThemeFile | framework editor |
| FileSchema | single | Edit a settings schema | schema text, file, revision | JSON editor | T.store#ThemeFile | Shopify section schema |
| Diagnostics | display | Inspect validation failures | file, line, code, message | file/line links | T.validate#Theme | framework diagnostics |
| RevisionDiff | component | Compare changes | base, current, draft | resource diff | T.get#ThemeHistory | framework resource revisions |
| FileOperation | dialog | Add, rename or remove a draft resource | operation, allowed file kind, relative source/target, revision, reason | affected-reference confirmation | T.change#ThemeFile | framework resource editor |

Use T.get#ThemeFile, T.store#ThemeFile, T.validate#Theme and T.get#ThemeHistory. Framework editor,
resource revisions and diff are the baseline; Shopify code editor is the reference. Those are
the full new editor fields; source and schema text are never evaluated by the authoring page.

Theme-code permission is separate from visual editing and publication. Files are restricted to
the package, with stable relative paths. CSS, safe HTML and locked JS expressions are editable;
script tags, event handlers, executable URLs, imports and browser JS files are rejected. Uploads
enforce media signatures, scanning, size limits and the same SVG/CSS rules as package import.
Rename/remove reports dependent templates/settings and cannot remove required components;
the active immutable release is unchanged. Locale resources also have ThemeEditor's typed
translation form, so visual authors need no source-code permission to translate text. Approved
interactive components are selected by registered identifier. Validation reports unsupported
syntax and exceeded limits without replacing the current draft or active release. TUI uses the
framework text editor and the same validate/save operations. **Needs:** COM-THEME, SHOP-THEME.

### Pages

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| PageFind | find | Find store pages | text, locale, publication state, role | — | — | Frappe Web Page |
| PageList | list | Inspect publication | title, route, locale, template, published version | draft/live links | T.find#ShopPages | Frappe Web Page; PublicSitePage |
| NewPage | dialog | Create a draft page | title, locale, route, template, policy role | template picker | T.store#ShopPage | Odoo website pages |

T.find#ShopPages and T.store#ShopPage provide the guarded reads/writes. These are
the full new form fields apart from IDs/revisions. Existing WikiPage stores content; a proposed
`PublicShopPage` binds an exact published version to a Shop route and template. **Actions:**
New page, edit, preview; withdrawal confirms and reports menu references. **Source:** Frappe Web
Page, Odoo website pages, PASS PublicSitePage. **Needs:** COM-THEME, SHOP-CONTENT.

### PageDetail

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| PageContent | component | Edit localized content | title, locale, body, revision | shared wiki editor | T.store#ShopPage | Commons Knowledge |
| PageRoute | single | Bind the public route/template | route, locale, SEO title/description, social image, template, policy role | safe media/template selectors | T.store#ShopPage | Frappe Web Page; Odoo pages |
| PagePublication | dialog | Publish, schedule or withdraw | draft/published version, from/thru, reason | affected-route preview | T.publish#ShopPage | PASS publication |
| PageHistory | list, read | Inspect prior versions | resource version, actor, publication activity | diff links | T.get#ShopPageHistory (proposed) | framework resource history |

T.store#ShopPage and
T.publish#ShopPage call the framework's versioned wiki operations and never publish the entire
space. Body editing reuses Commons Knowledge editing; the route/publication fields above are the
full new fields. A page chooses its composition from ThemeEditor rather than embedding another
page builder in the wiki editor.

Policies such as delivery, returns, privacy and terms are named roles with version-pinned content.
Checkout records the accepted terms version. Scheduled publication is revalidated at execution;
failure leaves the old published version active and creates an actionable finding. The first
release includes store pages, not the full Blog/Publishing editorial application. **Source:**
research §4, Shop §§3, 12. **Needs:** COM-THEME, SHOP-CONTENT.

### Navigation

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| MenuEdit | single | Describe a menu | key, name, locale | — | T.store#ShopNavigation | Odoo website menus |
| MenuItems | list, editable rows | Arrange typed destinations | stable ID, parent, label, destination, sequence, visibility | keyboard tree controls | T.store#ShopNavigation | Odoo website menus |
| Redirects | list, editable rows | Preserve old paths | old path, typed target, permanent/temporary, dates | destination validation | T.store#ShopNavigation | Frappe route redirects |
| PublishNavigation | dialog | Activate a menu version | draft revision, affected site/mount, reason | destination/visibility preview | T.publish#ShopNavigation | proposed versioned navigation |

T.store#ShopNavigation validates
all destinations and T.publish#ShopNavigation activates a versioned navigation snapshot.
These are the full new form fields plus revision/reason, derived from Odoo website menus and
Frappe route redirects. Reorder is by sequence and parent with keyboard controls; no custom
canvas is required.

Public links resolve through the site's mounts and authorized publication. Private BOSS links
and arbitrary redirect schemes are refused. Redirects cannot shadow reserved auth/API/assets,
loop, or cross a site's configured origin. A menu draft cannot expose a draft product/page.
**Needs:** COM-THEME, SHOP-CONTENT.

## 6. Orders, carts and customers

### Orders

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| OrderFind | find | Narrow submitted orders | store/group, channel, customer, status, payment/fulfillment, date, external reference | date-period and saved filters | — | SimpleScreens Order/FindOrder |
| Orders | list | Triage online orders | number, customer, store/channel, date, state, total, payment/fulfillment, intake health | record/status links | O.find#StoreOrders | Odoo eCommerce triage |

O.find#StoreOrders supplies the scoped projection; baseline
is SimpleScreens Order/FindOrder with Odoo eCommerce triage filters. Submitted orders are the
default, excluding `OrderOpen`; unpaid means a computed payment state, not a guessed order
status. Opening a row uses the shared OrderDetail. Bulk staff actions retain the shared guards.
**Source:** research §1, §6. **Needs:** COM-OPS, COM-ACCESS.

### Carts

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| CartFind | find | Narrow open/abandoned carts | store, last activity, abandonment, customer, recovery state | activity date-period | — | Odoo abandoned carts |
| Carts | list | Inspect cart and recovery work | order link, customer label, count, value/currency, activity, checkout, recovery eligibility | safe customer/status links | O.find#StoreCarts | OrderOpen; proposed activity metadata |

O.find#StoreCarts reads `OrderOpen` web orders with the
proposed activity metadata, not `lastUpdatedStamp` as a proxy for human activity. An abandoned cart
is inactive past the configured delay and not in a live payment/checkout attempt. Anonymous
carts show no invented identity. **Source:** research §5–§6, Odoo abandoned carts. **Needs:** COM-OPS,
SHOP-CART.

### CartDetail

**Layout:** read-only cart lines/totals, checkout findings, recovery history, and customer links.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| CartSummary | display | Explain latest cart state | order, lines, activity, store, totals, checkout phase | price/tax/shipping findings | O.get#StoreCart | existing `mantle.order.OrderInfoServices.get#OrderDisplayInfo`; PopRestStore cart info |
| RecoveryHistory | list, read | Inspect eligible contact and prior attempts | eligibility reason, channel, sent time, delivery, redeemed | redacted destination | O.get#CartRecovery | Odoo abandonment follow-up |
| RecoverCart | dialog | Send one authorized recovery invitation | registered template, verified destination choice, preview, reason | exact-body preview | O.send#CartRecovery | Odoo cart recovery; Comms consent |

Sending never changes an order or signs a staff member in as the shopper. The invitation opens
a narrowly scoped, expiring recovery flow; it cannot expose another customer's saved address or
payment method. Recovery respects consent/suppression, inactivity and send limits, with one
durable send per cart/campaign window. No automatic sends until the store enables them. Refresh
rechecks eligibility; a successful checkout suppresses queued recovery. **Needs:** COM-OPS,
SHOP-CART, SHOP-OUTBOX.

### Returns

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ReturnFind | find | Find online returns | store/channel, customer/order, status, dates | order search | — | crosscut ReturnDetail |
| Returns | list | Follow receipt and settlement | return, source order, customer, requested/authorized/received quantities, settlement state | shared record links | O.find#StoreReturns | Customer Service return policy |

O.find#StoreReturns derives store ownership from original order lines; no arbitrary client store
filter grants access. Open ReturnDetail for workflow. Shop intake creates a request for staff
decision; it cannot authorize a refund or post a return receipt. **Source:** research §6, crosscut
§3.18 and Customer Service ReturnDetail. **Needs:** COM-OPS.

### Customers

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| CustomerFind | find | Find store customers | name/contact text, store, order period, account state | scoped search | — | research §7 |
| Customers | list | Inspect store relationships | name, store relation, recent order, open carts, account state | shared customer link | O.find#StoreCustomers | AureusERP portal; Party and orders |

O.find#StoreCustomers returns customers with a permitted store relationship/order. The result
is not a directory of all Party records. Guest purchases do not automatically create public
community profiles or link to an existing account merely because an email matches. Open shared
Customer360 for details. **Source:** research §7; AureusERP portal contributions. **Needs:** COM-ACCESS,
COM-OPS, SHOP-ACCOUNT.

### Subscriptions

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| SubscriptionFind | find | Find renewal/access work | store, customer, product/resource, state, renewal period | date-period | — | Mantle Subscription/recurring orders |
| Subscriptions | list | Monitor paid access | contract, customer, product, paid-through, next charge, amount/currency, outcome | separate billing/access badges | R.find#StoreSubscriptions | Mantle recurring orders; PASS entitlements |

R.find#StoreSubscriptions returns contract and existing
Subscription projections. These fields are the full new list/filter contract; financial actions
link to the owning Accounting record. **Source:** Mantle Subscription/recurring orders; PASS
Forum entitlements. **Needs:** COM-SUBSCRIPTION, SHOP-SUBSCRIPTION.

### SubscriptionDetail

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Contract | display | Explain accepted terms | customer/store, plan/price/cadence/terms, base orders, paid-through, cancel-at | native record links | R.get#StoreSubscription | Mantle recurring orders |
| Renewals | list, read | Inspect billing attempts | occurrence, order/invoice/payment, due, outcome, next retry | safe diagnostic links | R.get#StoreSubscription | proposed occurrence coordinator |
| Access | list, read | Inspect source grants | resource, source grant, from/thru, revoked | source-linked status | R.get#StoreSubscription | Subscription resource lifecycle |
| CancelRenewal | dialog | Stop future billing | period end, reason, expected revision | paid-through confirmation | R.cancel#RecurringContract | Shop §10 |
| RetryRenewal | dialog | Resume a failed occurrence | occurrence, reason | current-outcome preview | R.retry#Renewal | Shop §10 |

Call R.get#StoreSubscription, R.cancel#RecurringContract and
R.retry#Renewal. These are complete new form fields, derived from Mantle recurring orders and
subscription resource lifecycle; Shop §10 specifies their behavior.

Cancellation stops future billing at the end of the paid term by default. Refunds use Accounting
and can separately revoke the affected entitlement. Retry resumes the same occurrence and
unresolved attempt; it cannot create another charge while the first is uncertain. Staff never
enter a customer's card in this screen. **Needs:** COM-SUBSCRIPTION, SHOP-SUBSCRIPTION.

### Requests

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| RequestFind | find | Narrow store requests | store, source type, status, assigned staff, customer | scoped choices | — | Projects RequestDetail |
| Requests | list | Triage customer intake | request, subject, customer, source order/product, state, assignee, date | shared request links | O.find#StoreRequests | ridgecrest retailer/public requests |

O.find#StoreRequests returns authorized requests explicitly linked to the store. Store questions,
return intake and retailer applications reuse Request records; open the shared RequestDetail.
Private case notes and financial facts are not mirrored into public Forum discussions.
**Source:** research §7, ridgecrest retailer registration; Projects RequestDetail. **Needs:**
COM-OPS, SHOP-SUPPORT.

## 7. Promotions

This section owns the initial **shared store-promotion screens**, physically proposed as
`Shared/Promotions`, `Shared/PromotionDetail`, `Shared/PromoCodes`, `Shared/PromoCodeDetail`.
Commerce mounts them under the paths in §2. Marketing may later mount the same definitions and
add program context; it does not fork these forms. Multi-store programs and loyalty ledgers are
later. This refines Products' earlier handoff of the baseline promotion forms to Marketing.

### Promotions

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| PromotionFind | find | Find eligible promotions | store, active dates, service type, code required | registered service choices | — | FindPromotion |
| Promotions | list | Inspect store rules | description, store, dates, priority, use limits | record links | P.find#Promotions | FindPromotion PromotionsForm |
| NewPromotion | dialog | Create a store promotion | store, description, registered service, dates, code requirement | typed service selector | P.store#Promotion | FindPromotion NewPromotionForm |

P.find#Promotions and P.store#Promotion
wrap existing `ProductStorePromotion` records. **Source:** FindPromotion NewPromotionForm and
PromotionsForm; Odoo loyalty program as a reference for independent promotion policy.
**Needs:** COM-PROMO.

### PromotionDetail

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Promotion | single | Maintain eligibility and limits | store, description, registered service, dates, sequence, requireCode, use limits, free shipping | typed registered action | P.store#Promotion | EditPromotion EditPromotionForm |
| Parameters | list, editable rows | Configure the registered rule | parameter name/value | input from service registration schema | P.store#PromotionParameters | EditPromotion PromoParameterForm |
| Products | list, editable rows | Include/exclude products | product, exclude | product search | P.store#PromotionProducts | EditPromotion AddProductForm, ProductsForm |
| Redemptions | list, read | Inspect committed use | order, customer-safe label, code, adjustments, time | order link | P.find#PromotionUses | baseline orders that used promotion |

Writes are scoped and validated; browser input never supplies a service name. Evaluation retains
existing `mantle.product.PromotionServices.apply#OrderPromotions` and its registered
`apply#Promotion` interface implementations. Price resolution remains separate. Redemption limits
are committed atomically at checkout, once per order/code; a cart preview does not consume them.
**Needs:** COM-PROMO, SHOP-CHECKOUT.

### PromoCodes

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| CodeFind | find | Find promotion codes | promotion, code, dates, party restriction | — | — | FindPromoCode |
| Codes | list | Inspect code usage | code, dates, limits, use count | code links | P.find#PromoCodes | FindPromoCode PromoCodeForm |
| NewCode | dialog | Create one code | code or generate, dates, use limits, requireParty | code preview | P.store#PromoCode | FindPromoCode NewPromoCodeForm |
| GenerateCodes | dialog | Generate a bounded batch | count, prefix, dates, limits, requireParty | collision/result preview | P.generate#PromoCodes (proposed) | new; fields here plus operation ID/revision |

P.find#PromoCodes and P.store#PromoCode serve the baseline FindPromoCode forms. Batch generation
adds count, prefix and collision/result preview, capped and executed as independent items.
**Source:** research §11; FindPromoCode NewPromoCodeForm/PromoCodeForm. **Needs:** COM-PROMO.

### PromoCodeDetail

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Code | single | Maintain eligibility and limits | code, promotion, dates, per-code/customer limits, userEntered, requireParty | expire action | P.store#PromoCode | EditPromoCode EditPromoCodeForm |
| Parties | list, editable rows | Restrict eligible customers | party | scoped customer lookup | P.store#PromoCodeParty | EditPromoCode NewPromoCodePartyForm/PromoCodePartyForm |
| Usage | list, read | Inspect committed use | order, date, count | order links | P.find#PromotionUses | native promotion usage |

P.store#PromoCode, P.store#PromoCodeParty and P.find#PromotionUses serve EditPromoCode
EditPromoCodeForm/NewPromoCodePartyForm/PromoCodePartyForm. Expire instead of deleting redeemed
codes. A customer restriction cannot be bypassed through guest checkout. **Needs:** COM-PROMO.

**Per-app context:** Commerce fixes permitted stores and emphasizes checkout eligibility;
Marketing selects permitted stores and emphasizes campaign links once designed; Sales only
reads eligible codes and applies them on the existing shared order form. No mount grants extra
promotion or pricing authority.

## 8. Checkout settings

### CheckoutSettings

**Layout:** grouped settings for customer experience, delivery, payment, tax, recovery and
recurring offers, with a shared readiness strip.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| CheckoutPolicy | single | Define supported checkout behavior | guest/account policy, destinations, inventory/backorder disclosure, terms page, purchase contact | policy preview | C.store#CheckoutPolicy | ProductStore settings; Odoo website_sale settings |
| ShippingOptions | list, editable rows | Offer carrier/method choices | carrier, method, sequence, markup percent/amount | authorized choices | existing `mantle.product.StoreServices.create#StoreShippingOption`; C.store#ShippingOption | EditProductStore NewShippingOptionForm/ShipOptionsForm |
| ShippingGateways | list, editable rows | Bind approved carrier providers | carrier, gateway, account reference, insurance/customs defaults | redacted approved config selector | C.store#StoreShippingGateway | EditProductStore NewShippingGatewayForm/ShippingGatewaysForm |
| LocalRates | list, editable rows | Set a local rating rule | destination zone, weight/value bands, amount, currency, priority, dates | zone selector and simulator | C.store#StoreShippingRate | Odoo delivery.price.rule; proposed ProductStoreShippingRate |
| PaymentGateways | list, editable rows | Offer approved instruments | instrument, gateway, customer label, availability | readiness indicators | C.store#StorePaymentGateway | EditProductStore NewPaymentGatewayForm/PaymentGatewayForm |
| TaxDisplay | single | Bind tax policy and display | approved tax gateway, inclusive/exclusive display, origin | tax calculation preview | C.store#StoreTax | EditStoreForm tax gateway; Odoo tax display |
| RecoveryPolicy | single | Configure eligible cart follow-up | enabled, inactivity delay, template, maximum sends, retention | consent/preview status | C.store#CartRecoveryPolicy | Odoo abandonment settings |
| RecurringPolicy | single | Configure supported renewal offers | product/plan, cadence, price terms, retry intervals/limit, notice templates, cancellation terms | registered plan selection | R.store#RecurringOffer | Mantle recurring orders; Shop §10 |

Local rate matching is deterministic by explicit priority and effective dates; overlapping rules
at the same priority are refused. Bands have inclusive lower and exclusive upper bounds; rule
currency/UOM must match or use approved conversions. Gateway failure never silently selects a
cheaper rate: an explicitly configured local fallback is quoted and disclosed. No applicable
rule means unavailable delivery, not free shipping. Digital-only orders skip shipping but retain
needed tax/billing address checks.

The existing `get#OrderShippingRateLocal` and tax gateway are implementation extension points,
not proof that every requested local rate/tax jurisdiction works. Use the implemented Accounting
tax services or configured external tax adapter; do not build another tax engine here. Payment
methods expose hosted/tokenized provider capabilities, including recurring/off-session support,
without collecting raw card data. Readiness refuses unsupported combinations.

**Source:** research §9, §11; Shop §§6–10. **Needs:** COM-CHECKOUT, COM-OPS, SHOP-CHECKOUT,
SHOP-PAYMENT, SHOP-SUBSCRIPTION.

## 9. Integrations and feeds

### Integrations

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| IntegrationFind | find | Find channel bindings | store, connector type, enabled, health | — | — | research §8 |
| Integrations | list | Monitor connections | name, remote, store, last success, failure count | health/status links | I.find#StoreIntegrations | tools SystemMessage/Remote |
| NewBinding | dialog | Bind an approved connector | store, connector/remote, direction, message types | registered connector choices | I.store#StoreIntegration | metasfresh external systems |

I.find#StoreIntegrations
and I.store#StoreIntegration use `SystemMessageRemote.productStoreId`; connector configuration
and secrets remain operator/Admin managed. Derived from research §8, metasfresh external-system
configuration and tools SystemMessage/Remote. **Needs:** COM-CHANNEL.

### IntegrationDetail

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| Binding | single | Maintain channel bindings | store, remote/types, directions, schedules | registered choices | I.store#StoreIntegration | tools SystemMessage/Remote/Type |
| Messages | list | Inspect incoming/outgoing work | ID, type, direction, external reference, state, attempts, time, safe error | record links | I.find#StoreMessages | tools SystemMessage |
| MessageDetail | display | Diagnose one result | safe payload summary, mapping findings, business links | redacted detail | I.get#StoreMessage | tools SystemMessage |
| RetryMessages | list, bulk | Resume selected failures | selected IDs, reason, preview | confirmation with per-item results | I.retry#StoreMessages | tools SystemMessage retry |
| Mapping | single | Configure approved mapping | registered mapping version, typed parameters | schema fields | I.store#StoreIntegration | ridgecrest VDC import |

I.store#StoreIntegration, I.find#StoreMessages,
I.get#StoreMessage and I.retry#StoreMessages call framework SystemMessage processing.
Derived from tools SystemMessage Message/Remote/Type screens and ridgecrest VDC import.

Retry reuses the message/business identity. Incoming order deduplication is by store, remote,
message kind and external ID, not external ID alone. A conflicting replay is quarantined with
its evidence; a matching replay returns the original result. Failed independent messages do
not stop other stores. Credentials and raw payment/identity payloads never appear in generic
logs, exports or Assist. **Needs:** COM-CHANNEL, COM-ACCESS.

### ChannelImport

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ImportSource | wizard step | Stage external orders | store, registered format, scanned upload, mapping version | file upload | I.prepare#ChannelImport | ridgecrest OrderFileImporter |
| ImportPreview | list, read | Review mappings and conflicts | source row/key, proposed order/return, duplicate/conflict/error | source-to-result comparison | I.prepare#ChannelImport | ridgecrest OrderFileImporter |
| ImportCommit | wizard step | Accept validated rows | batch digest, accepted rows, reason | commit confirmation | I.commit#ChannelImport | proposed guarded import |
| ImportResult | list, read | Inspect durable outcomes | row/message/business IDs, outcome, retry action | result links | I.get#ChannelImport (proposed) | SystemMessage outcomes |

I.prepare#ChannelImport and I.commit#ChannelImport
create SystemMessages and invoke the same connector path as API intake. These are the full new
forms, derived from ridgecrest OrderFileImporter. Unsupported formats are refused; no arbitrary
spreadsheet-to-entity mapping. Partial success is durable and visible. **Needs:** COM-CHANNEL.

### Feeds

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| FeedFind | find | Find public feeds | store/site, format, state | — | — | Odoo product.feed |
| Feeds | list | Monitor feed builds | name, format, locale/currency, last successful build, errors | feed/build links | I.find#StoreFeeds | Odoo product.feed |
| NewFeed | dialog | Create a feed binding | name, store/site, format, locale, currency, product scope | registered format selector | I.store#StoreFeed | Odoo product.feed |

I.find#StoreFeeds and I.store#StoreFeed serve proposed
`ProductStoreFeed`. Derived from Odoo product.feed; these are the complete new fields plus
revision. **Needs:** COM-FEED, SHOP-CATALOG.

### FeedDetail

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| FeedConfig | single | Configure an eligible feed | format, destination, schedule, locale/currency, categories, image/availability policy | registered destination selector | I.store#StoreFeed | Odoo product.feed |
| FeedBuilds | list, read | Inspect build history | start/end, projection revision, rows/skips/errors, artifact digest | build-result links | I.get#FeedBuild | Odoo cached feeds |
| FeedPreview | list, read | Check public output | sample product, URL, price, availability, validation | safe sample preview | I.build#StoreFeed, I.get#FeedBuild | Odoo cached feeds |
| PublishFeed | dialog | Activate a complete build | build, publication generation, confirmation | validation summary | I.publish#StoreFeed | new; complete fields here plus expected revision |

The build/publish flow follows Odoo's cached-feed pattern. Destinations are registered
endpoints, never arbitrary request URLs.

Only the Shop public catalog projection supplies data. A build reports skipped independent
products and the reason; a fatal build leaves the previous complete artifact active. Withdrawal
immediately invalidates an artifact containing withdrawn products: serving the old artifact is
blocked until a safe replacement is ready. A rebuild must not resurrect content withdrawn after
its snapshot. **Needs:** COM-FEED, SHOP-CATALOG, SHOP-RENDER.

## 10. Shared screen contexts

Each row below is a **Context passed** block for the matching §2 screen. Definitions stay with
their owner. `appRoot=Commerce`, authorized organization/store and `sharedLinks` are common;
request parameters cannot expand scope. Sharing a screen requires the record's view permission,
not that other app's launcher grant. Use the same header and restricted-field projection.

| Screen / Commerce mount | Owner | Tabs, fixed filters and action set | Emphasis |
| --- | --- | --- | --- |
| Product360, `Commerce/Merchandising/Product360` | crosscut §3.5 | store/organization fixed; overview, variants, category membership, content, store prices, availability, reviews/publication link; writes require the owning catalog/price permissions | published assortment and customer-facing content; no costs without cost view |
| CategoryDetail and CategoryContent, `Commerce/Merchandising/CategoryDetail[/Content]` | Products §5 | category/store fixed; existing category identity, slug and content forms; publication goes through Merchandising | show shared-category impact before changing a taxonomy |
| Documents and DocumentDetail, `Commerce/Merchandising/Documents[/DocumentDetail]` | Products §9 | store/product context; existing content types, files and translations; public approval is an explicit separate binding | safe images, descriptions, SEO and authorized downloadable assets |
| PriceLists, PriceListDetail and PriceExplain, `Commerce/Merchandising/PriceLists[/PriceListDetail]`, `Commerce/Merchandising/PriceExplain` | Products §7 | sales direction, store/internal seller fixed; selected buyer, date, quantity/UOM/currency; authorized list edits and explanation | storefront price provenance; promotions/tax shown as separate stages |
| InventoryAvailability, `Commerce/Merchandising/InventoryAvailability` | crosscut §3.7 | selected product, store facilities; read-only availability | customer promise/backorder policy; stock movements stay Warehouse actions |
| OrderDetail, `Commerce/Orders/OrderDetail` | crosscut §3.6 | sales orders in permitted stores; overview/items/payments/shipments/invoices/chatter; normal place/approve/hold/cancel actions only with domain grants | payment/fulfillment and intake references; active checkout is not a staff-editable draft |
| ReturnDetail, `Commerce/Orders/Returns/ReturnDetail` | crosscut §3.18 / Customer Service | source-order store fixed; authorization/receipt/settlement projections | refund and replacement progress; no parallel return workflow |
| Customer360, `Commerce/Customers/Customer360` | crosscut §3.2 | permitted store relationships, public account status, addresses and masked payment labels, carts/orders/subscriptions; existing account invitation actions when authorized | verified account linkage, consent and online history; no password editing or impersonation |
| RequestDetail, `Commerce/Customers/Requests/RequestDetail` | Projects §6 / crosscut §3.11 | store-linked requests/cases; normal assignment, reply and resolution | online intake/support; public replies are deliberate audience-checked actions |
| Carriers, `Commerce/Settings/Carriers` | Warehouse Carriers | authorized store carriers; read-only definitions; links to permitted Warehouse editor | Commerce edits its own shipping options/bindings only |
| PaymentMethods, `Commerce/Settings/PaymentMethods` | Accounting PaymentMethods | organization fixed, read-only approved gateway/method summaries | bind supported instruments without reading credentials |
| TaxAuthorities, `Commerce/Settings/TaxAuthorities` | Accounting TaxAuthorities | organization fixed, read-only tax authority/rate references | checkout tax binding/display remains in CheckoutSettings |

Chatter, record files, common contact selectors and the dashboard are existing shared components,
not new Commerce screen definitions. Product reviews are not staff Chatter. Billing/InvoicePay
may be linked through the authorized PASS Billing mount, never an internal Accounting URL.

## 11. Automation and operations

### 11.1 Existing automation disposition

Shop §8 specifies checkout ordering and reconciliation. The following source-verified rules are
part of that design, including their behavior without BOSS. The subscription guard is a proposed
Mantle change, not a BOSS-only wrapper. Existing Accounting flags remain effective.

| Rule / source | Disposition on Commerce/Shop paths |
| --- | --- |
| `OrderPlacedAuthorizePayments`, AccountingPayment.secas.xml | Keep the one payment service path; teach it to recognize the resolved/pending Shop attempt so explicit checkout authorization and placement cannot authorize twice. |
| `OrderPlacedAutoApprove`, OrderReturn.secas.xml; `OrderPreApproveCredit`, AccountingCredit.secas.xml | Keep store delay, pre-approval checks and credit holds; add Shop payment/checkout readiness as a narrow pre-approve check. Approval cannot outrun an unresolved payment. |
| `OrderPlacedReserveAssets`, `OrderApprovedReserveAssets`, `OrderItemCreateCheckReserve`, `OrderItemUpdateCheckReserve`, ProductAsset.secas.xml; `OrderItemHandleChange`, entity/Order.eecas.xml | Keep reservation and line-change ownership; enforce the configured reservation moment and refuse public edits once checkout freezes the order. No parallel Shop reservation ledger. |
| `OrderPlacedSendEmail`, `OrderApprovedSendEmail`, `OrderApprovedNotify`, OrderReturn.secas.xml | Keep authoritative status events; add idempotent delivery keys for retryable public notifications. Checkout does not send a second receipt for the same event. |
| `ShipmentOutgoingPackedCreateInvoices`, `ShipmentShippedFinalizeInvoices`, AccountingInvoice.secas.xml | Keep organization-specific pack/ship invoice and capture behavior for physical items. Shop reads fulfillment; it does not invoice shipment lines itself. |
| `OrderApprovedFulfillSubscriptions`, ProductSubscription.secas.xml | Extend/condition for Shop paid digital/subscription items: prepare invoice/settlement once and activate resources only after required payment is settled. Current code fulfills before applying/capturing payment, so it is not sufficient unchanged. |
| `ReturnApprovedProcess`, `ShipmentDeliveredReturnReceive`, `ReturnReceivedProcess`, OrderReturn.secas.xml | Keep existing Accounting return-settlement mode and shared authorization/receipt policy; public intake cannot trigger automatic financial responses. |
| AccountingLedger.secas.xml posting rules; `PaymentApplyForInvoice`, AccountingPayment.secas.xml | Keep native invoice/payment/application posting. Shop creates no parallel payment, invoice or GL ledger. |

### 11.2 Jobs and observability

Add scoped jobs for recovery eligibility/delivery, checkout reconciliation/expiry, recurring
occurrences and retry, scheduled publication, feed builds, and connector work. Each independent
store/cart/message/renewal gets its own transaction and outcome; log the record identifier and
safe reason code, then continue. Fail strictly on authorization, money integrity, conflicting
idempotency keys or invalid publication state. Expected failed provider probes use the framework
isolated transaction/error-stack pattern, not merely clearing errors on a poisoned transaction.

Commerce worklists expose pending age, unresolved provider outcomes, delivery failures, renewal
retries, blocked publication and stale feed generation. Correlation IDs connect checkout,
Payment, OrderHeader, invoice and job history without recording tokens or raw payment data.
No recovery job starts by default. Operator configuration supplies limits, provider capability
registrations and secrets; store forms choose only approved options.

## 12. Coverage and acceptance

### 12.1 Baseline and research disposition

All 34 ProductStore forms in `ss-inventory.md` are assigned to this design. Store identity and
clone forms go to Stores/StoreDetail; shipping/payment forms to CheckoutSettings; data-document
forms to StoreDetail SearchContent; dated store-category forms to StoreCategories; email,
facility, party and setting forms to StoreDetail; promotion/code forms to §7's shared screens.
The inventory records these exact paths. Gateway definition forms retain Admin/Accounting/
Warehouse ownership and are not claimed again. Product master/content/price forms keep their
existing owner mapping, with Commerce mounts added for consumed forms/services.

| Research §12 candidate / question | Disposition |
| --- | --- |
| Commerce landing and period strip | Home; scoped dashboard widgets, defined metrics, optional visit collection |
| Stores, domains/templates, facilities, staff, email/checks, cloning/groups | Stores/StoreDetail/StoreGroups; domains use existing PASS host/mount ownership; templates use §5 |
| Category tree, assortment, Product360, reviews, content spaces | Merchandising/StoreCategories/Reviews plus shared Products screens; public content is version-bound |
| Orders, carts, returns, Customer360 and requests | §6 and §10; ordinary orders exclude carts; dedicated cart worklists |
| Promotions across stores | Store-scoped existing records; explicit copy with independent limits; later Marketing program |
| Shipping/payment/tax and inventory availability | CheckoutSettings and owning-domain mounts; local rating rules are a proposed Mantle extension |
| Integrations and marketplace intake | §9; reusable message pipeline, registered connectors, per-item results |
| Missing feeds/ribbons/publication | Feed records/builds; simple store badge text; explicit product publication metadata |
| Gateway editing ownership | Owner screens remain canonical; Commerce only store bindings, approved choices and read-only mounts |
| Storefront ownership | IronStone Shop in PASS; full public design in design-shop.md |
| Checkout steps/sessions as data | Shop chooses a fixed validated core flow, configurable presentation and durable coordination; no arbitrary merchant workflow engine |
| POS | ScPos remains a valid channel; terminal, till/session, offline hardware and POS screens later |

### 12.2 Acceptance scenarios for implementation

1. A reader sees only permitted stores. A designer cannot publish, read credentials or alter
   prices without the separate grant. A different organization's store ID is refused by direct
   service calls, choices, export and preview as well as screens.
2. Clone a store: preview includes affected references, new site stays disabled, and no customer,
   host, credential or running job is copied. Configure a digital-only store without a facility.
3. Publish a product with variants after content/price checks. Another store remains unchanged.
   Withdraw it and verify catalog/search/feed/cache/cart purchase checks all agree.
4. Move a category shared by two stores: impact preview is explicit, cycles/stale edits fail,
   and the TUI sequence controls produce the same authorized tree.
5. Create a theme, arrange blocks, edit typed settings and a locked JS template, preview phone
   and desktop, validate, publish and roll back. Unauthorized browser script and filesystem/
   network attempts fail. A bad optional section leaves the rest usable; a bad required
   checkout component blocks purchase with a safe retry state.
6. Edit content and navigation without changing the live version. Scheduled publication rechecks
   access; restoring an old theme does not republish withdrawn business content.
7. Place a physical, digital and subscription purchase through Shop and locate the same records
   in Commerce, Warehouse and Accounting. Retry/callback duplication produces one logical
   payment/order/fulfillment event and one notification of each kind.
8. Change price/stock/address while checkout is open: require renewed consent to changed totals;
   pending payment freezes the monetary snapshot until reconciliation. Failed capture grants no
   digital access. Physical capture follows the organization's existing invoice policy.
9. An opted-in inactive cart receives one recovery notice. Active, completed, suppressed and
   unidentified carts do not; an unrelated failed send does not stop the batch.
10. Moderate a review: private identity is omitted publicly, an edited review returns pending,
    and an unrelated review decision remains independent.
11. Renew once per contract occurrence; timeout/retry never double charges. Failed payment does
    not extend access; cancellation preserves the paid term; refund/revocation preserves any
    independent manual grant. See Shop §10 for the authoritative lifecycle.
12. Import duplicate/conflicting channel rows and simulate one provider failure. Matching
    duplicates reuse results, conflicts are visible, other rows finish, and a feed never serves
    withdrawn items while rebuilding.

Every staff screen gets structure/TUI coverage, and critical browser walks check actual controls,
keyboard/focus, no overflow at 390 px, errors and result text. Fast server specs live with Mantle
business rules; public HTTP walks live in PASS. Split scenarios to run well under 15 seconds;
marked slow scenarios require explicit permission, never coverage-driven execution.

## 13. Documents and outputs

| Output | Kind | From screen | Derived from |
| --- | --- | --- | --- |
| Store readiness/configuration summary | authorized CSV/print | StoreDetail | grouped store settings; redact credentials |
| Order confirmation, invoices, delivery and return documents | existing email / html-print / PDF | OrderDetail, ReturnDetail | owning Order/Accounting/Warehouse services and store email bindings |
| Cart recovery and subscription notices | consent-checked email | CartDetail, SubscriptionDetail | ProductStoreEmail + registered EmailTemplate and durable delivery |
| Theme package and release manifest | bounded archive + JSON | ThemeDetail | exact resource revisions/digests; no secrets/customer data |
| Published shop pages/navigation | HTML / release snapshot | PageDetail, Navigation | versioned WikiPage and theme package |
| Channel import results | row-level CSV/result list | ChannelImport | SystemMessage outcomes |
| Product feed | registered XML/CSV/JSON format | FeedDetail | authorized Shop projection and last complete eligible build |
| Operational lists | permission-filtered CSV | Orders, Carts, Reviews, Subscriptions | same query/projection as the screen |

## 14. Framework and data needs

All rows below are **proposed additions/extensions**, even where their substrates exist. Shop
owns the `SHOP-*` definitions; Commerce references them rather than declaring another schema.

| Need | Kind | Proposed as | Used by | Stub spec |
| --- | --- | --- | --- | --- |
| COM-ACCESS | service type, seed data | scoped Mantle permissions and BOSS ContextServices | all screens, exports, choices | Organization/store scope, explicit view permissions, restricted-field omission, expected revisions; independent of launcher groups |
| COM-STORE | service type, seed data | StoreAdminServices over ProductStore and existing children | Stores, StoreDetail, StoreGroups | Guarded named writes; effective settings, safe clone, typed validation parameters; host mounts stay operator-owned |
| COM-MERCH | data model, service type | StoreMerchandisingServices; extend ProductStoreProduct with explicit publication/template/badge fields and revision | Merchandising, StoreCategories, Reviews | Effective publication and catalog predicates, tree conflict/cycle checks, review decisions with actor/reason/history; public contract SHOP-CATALOG |
| COM-THEME | Vue component, service type | Commerce ThemeEditor/TemplateEditor and TUI counterparts; Mantle ThemeServices | Website screens | One staff authoring surface over SHOP-THEME; schema forms, exact preview, compare, publish, rollback; no public editor API |
| COM-OPS | data model, service type, seed data | StoreOperationsServices; recovery policy/settings and durable delivery entries | Home, orders/carts/customers/requests | Paginated safe reads; real cart activity, consent and send limits, exact template preview; SHOP-OUTBOX delivery |
| COM-PROMO | service type | StorePromotionServices and shared screens | Promotions/codes | Registered algorithms, scoped CRUD, effective dates, atomic committed redemption limits; no new pricing resolver |
| COM-CHECKOUT | data model, service type | ProductStoreShippingRate and typed checkout settings; extend local rating | CheckoutSettings | Explicit destination/weight/value bands and dated priorities, scoped simulation, supported gateway bindings; errors never become zero rates |
| COM-CHANNEL | service type, data model | StoreChannelServices; durable import/mapping batch metadata | Integrations, ChannelImport | Approved remotes/types, canonical deduplication, per-row results, bounded retry; use SystemMessage |
| COM-FEED | data model, service type | ProductStoreFeed and feed-build metadata | Feeds/FeedDetail | Registered formats, public projection, immutable artifacts, generation-aware publication and immediate withdrawal invalidation |
| COM-SUBSCRIPTION | service type | Staff context/actions of ShopSubscriptionServices | Subscriptions | Store-scoped lifecycle controls; shared authoritative contract/occurrence/payment records; no staff card entry |

Proposed supplemental records use sequenced IDs, explicit relationships, typed enums/status
flows, audit fields and service guards. Theme release IDs/content digests are not surrogate
versions of ordinary business rows. Group membership effective dates, where absent in today's
entities, are extensions rather than assumed existing fields. Document current-source gaps in
the implementation plan before changing a lifecycle rule.

## 15. Delivery stages

**Dependencies:** C1 requires COM-ACCESS/STORE/MERCH and Shop S1's routing, public projection,
resource/renderer limits and immutable publication contract; the existing Products editors are
reused. Theme authoring cannot pass its gate before actual Shop preview/rendering works. C2
depends on C1 plus Shop S2's payment-attempt guards and settled digital fulfillment, native
Warehouse/Accounting configuration and the shared return/support access contract. C3 depends
on C2 plus Shop S3's occurrence coordinator, recurring provider capability and source-bound
entitlement expiry. C4 depends on the same catalog generations and idempotent order intake;
connector development may proceed earlier, but deployment waits for those contracts. Shop
§17 lists the matching customer-facing gates.

| Stage | Deliverable | Release gate |
| --- | --- | --- |
| C1 — stores, catalog and authoring | Scoped stores/groups, explicit assortment, Products mounts, visual/source theme editors, pages/navigation, publication and preview | Permission/TUI checks; draft/live isolation; a published browseable Shop in local and remote mode; no purchase advertised before C2 |
| C2 — checkout operations | Orders/carts/customers/returns/requests, promotions, checkout settings, review/recovery; Shop physical/digital checkout | Idempotent payment/placement, shared-rule audit, safe guest access, shipment/digital acceptance, consent-aware delivery |
| C3 — recurring commerce | Offers, contracts, renewals, notices, cancellations, failure recovery, entitlement reconciliation | Shop paid-access lifecycle, no duplicate occurrences/charges, expiry/revocation and operator recovery |
| C4 — channel completion | Connector bindings, registered import, feeds, operational metrics and diagnostics | Replay/partial failure tests, withdrawal-safe feeds, dashboard totals reconciled to authoritative records |

C1–C4 together are the complete initial design scope; recurring commerce and the visual editor
are not postponed to an unspecified second release. External provider adapters are installed
capabilities, so each deployment advertises only providers tested for its supported flows.
Advanced B2B, multi-store promotion programs, POS and a public theme marketplace are later.

## 16. Decided

| Decision | Notes |
| --- | --- |
| Suite/application names | IronStone PASS and IronStone Shop; `mr-pass`, `Pass`, and other technical identifiers remain unchanged |
| Staff/public separation | Commerce owns authoring and staff operations; Shop owns customer flows and rendering; shared records/services in Mantle, engine/resource primitives in framework |
| Public site authority | PublicSiteHost/PublicSiteApp plus operator runtime allowlists; no second regex-host table or default-store fallback |
| Cart and channel identity | ProductStore is the channel, OrderOpen is the cart; new records coordinate public access/checkout, not another order ledger |
| Publication | Explicit, default-deny per-store assortment and version-pinned page/theme publication; existing category/content bindings do not publish on installation |
| Themes in the first release | Visual editor, source editor, typed sections/blocks/settings, previews, immutable releases and rollback; JS fancy templates initially, Liquid later |
| Theme trust | Merchant source is sandboxed; browser code/extensions are operator-installed; validators/helpers protect HTML/URL contexts as well as server access |
| Promotion screen ownership | §7 is the first canonical shared store-promotion definition; Marketing later mounts it; no global-program schema now |
| Shared configuration | Existing domain owners retain forms; Commerce manages store-specific choices; credentials stay Admin/operator controlled |
| Sales breadth | Physical, digital, prepaid and automatic recurring purchases; payment/fulfillment extensions explicitly part of initial scope |
| Recovery and visits | Recovery requires explicit enablement and eligible consent; visit metrics are optional and exclude preview/test activity |
| Financial effects | Existing native order/payment/invoice/stock posting paths, with narrow documented checkout/subscription guards; no duplicate ledgers or webhook grants |
| Compatibility | Legacy store data is adopted through a preview; no automatic publication, host migration, FTL/Vue-2 execution or rewrite of existing orders |

## 17. Open

No first-release product decision is left open by this design. Provider credentials, enabled
currencies/destinations, brand assets and business-specific policies are deployment data selected
through the defined forms. Later work includes Liquid compatibility, advanced B2B purchasing,
loyalty/cross-store programs, POS, theme marketplace distribution and the separate Publishing app.
Those need their own scoped designs; their absence does not block the stages above.
