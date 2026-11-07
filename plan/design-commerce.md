# IronStone BOSS — Commerce design

Nov 7, 2026 — built (impl-commerce P1–P15): §2's **Impl** column names the phase that built each screen. Nov 5, 2026 —
checked against the code while writing [impl-commerce.md](impl-commerce.md) (its F1–F36); the changes are
marked Nov 5. Nov 1, 2026 — draft; reviewed against research-commerce.md, the reference apps and the other designs (the
suite-app review, since removed from the tree; read it with `git show bd74564^:plan/review-suite-apps.md`).

IronStone Commerce serves e-commerce and channel managers: store operations, merchandising,
online orders and carts, promotions, checkout configuration, integrations, store reports and
storefront authoring. **IronStone Shop**, part of **IronStone PASS**, is its public companion in
`mr-pass`. They share Mantle business records. Commerce owns the staff theme and page editors;
Shop renders published releases and serves customers without a runtime dependency on BOSS.
Customer requests from a store (returns, questions, cancellations) are Customer Service's work;
Commerce shows them filtered by store.

**Inputs:** [commerce research](research-commerce.md), [design guide](design-doc-guide.md),
[style guide](style-guide.md), [crosscut](design-crosscut.md), [Products](design-products.md),
[Warehouse](design-warehouse.md), [Accounting](design-accounting.md),
[Customer Service](design-customer-service.md), [Sales](design-sales.md),
[Marketing](design-marketing.md), [Insights](design-insights.md), [Admin](design-admin.md),
[Commons/Comms](design-drawers-commons.md), [Shop](../../mr-pass/plan/design-shop.md),
[Forum foundation](../../mr-pass/plan/design-forum.md), the Mantle
[payments plan](../../mr-mantle/plan/payments-shipping-edi.md), the suite-app review (see above),
[screen inventory](ss-inventory.md), and [service inventory](usl-inventory.md). The build is planned in
[impl-commerce.md](impl-commerce.md) with Shop's [impl-shop.md](../../mr-pass/plan/impl-shop.md). Shop §3 adds storefront and template research, including
the Java PopRestStore source.

**Sections:** [1 shell](#1-shell) · [2 screens](#2-screens) · [3 home, reports and stores](#3-home-reports-and-stores) ·
[4 merchandising](#4-merchandising) · [5 website](#5-website-authoring) ·
[6 orders](#6-orders-carts-and-customers) · [7 promotions](#7-promotions) ·
[8 checkout settings](#8-checkout-settings) · [9 channels](#9-integrations-and-feeds) ·
[10 shared contracts](#10-shared-screen-contexts) · [11 automation](#11-automation-and-operations) ·
[12 coverage](#12-coverage-and-acceptance) · [13 outputs](#13-documents-and-outputs) ·
[14 needs](#14-framework-and-data-needs) · [15 delivery](#15-delivery-stages) ·
[16 decisions](#16-decided) · [17 open](#17-open).

## 1. Shell

### 1.1 Root and access

Root `screen/Commerce.xml`, app path `Commerce`, icon `sym_o_storefront`. The root exists and
mr-boss `MoquiConf.xml` mounts it. The `BOSS_COMMERCE` artifact group in `data/BossSetupData.xml`
is active: it gives `ADMIN` and the existing `BOSS_COMMERCE_ADMIN` group all authz on the root,
with the `MANTLE_ACTIVE_ORG` and `MANTLE_PRIVATE_CONTACT` filters. The root's comment that the
grant is commented out is stale. Placeholder Home, Stores, Merchandising, Orders, Integrations and
Settings screens exist under `screen/Commerce/`; none holds the forms below. Keep the existing
`mantle.party.PartyServices.setup#UserOrganizationInfo` call, and add proposed
`ironstone.commerce.ContextServices.get#SharedContext` for capabilities, authorized store
choices, `appRoot`, and `sharedLinks`.

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

**Store-limited staff (Nov 5, 2026; impl-commerce §4).** A store's staff are dated
`ProductStoreParty` rows in the proposed `StoreStaff` role. A user with a current one works only
those stores of their organizations; a user with none works every store of their organizations.
Because the rows are the limit itself, a store-limited staff member does not change store staff rows (P2 review): ending
or dating their own would widen them to every store, and adding one to a manager would limit the manager.
Mantle seeds the `COMMERCE_*` permissions, none of which exists yet (impl-commerce F2).
The Commerce administrator (Nov 6, 2026; P6 review, impl-commerce F-P6-3) works every organization's stores with no
active organization, and the active one's with one, in its choices and in Mantle's store services alike: Mantle widens
its store scope for `COMMERCE_ALL_ORGANIZATIONS` (ADMIN's, and BOSS_COMMERCE_ADMIN's in BOSS), and Commerce.js offers every
organization only to a user whose root grant has the active organization filter and who holds that permission.

**Areas by group (Nov 5, 2026; impl-commerce P1).** Home, Stores, Merchandising and Promotions open for every Commerce
user; Website for the merchandiser, designer, theme developer and publisher; Orders and Customers for the store and
subscription operators; Integrations for the channel operator; Reports for the manager and the three operators;
Settings for the manager; the administrator opens every area. Each area seen by some groups is an artifact group that
denies `BOSS_COMMERCE`. A store-limited staff member's stores also narrow raw store reads (the `COMMERCE_STORE` filter,
impl-commerce F50), and they reach a site only through one of their stores.

| Group | Proposed grants |
| --- | --- |
| `BOSS_COMMERCE_ADMIN` (existing) | All authz on the root with `MANTLE_ACTIVE_ORG` and `MANTLE_PRIVATE_CONTACT`, as today; gains every `COMMERCE_*` permission. Operator host allowlists, credentials and other apps' financial, price and stock privileges stay separate |
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
and customer-private fields are omitted from unauthorized service responses. A payment hold
(proposed `OhtPayment`) shows in Commerce worklists, and an Accounting payment operator releases
it; no Commerce group carries its release permission (X4).

### 1.2 Navigation and landing

- Home — Home.
- Stores — Stores, StoreDetail, StoreGroups.
- Merchandising — Merchandising, StoreCategories, Reviews, PriceLists, PriceExplain,
  InventoryAvailability; Product360, CategoryDetail and Documents open from rows.
- Website — Themes, ThemeDetail, ThemeEditor, TemplateEditor; Pages, PageDetail, Navigation.
- Orders — Orders, OrderDetail, Carts, CartDetail; Returns, ReturnDetail.
- Customers — Customers, Customer360; Subscriptions, SubscriptionDetail; Requests, RequestDetail.
- Promotions — Promotions, PromotionDetail, PromoCodes, PromoCodeDetail.
- Integrations — Integrations, IntegrationDetail, ChannelImport; Feeds, FeedDetail.
- Reports — OnlineSales, CartRecovery, PromotionUse, ChannelHealth.
- Settings — CheckoutSettings, which links Warehouse's Carriers and Accounting's PaymentMethods
  and TaxAuthorities rather than mounting them (Nov 5, impl-commerce F6).

Home has a store selector and period strip, action cards for approval/unpaid/payment-hold/
fulfillment/cart/review/integration work, a recent orders list, and orders, net sales, visits
and conversion for the selected period against the previous one (R-COM-W01). Each card opens
the same scoped list used elsewhere. Each metric is the registry metric of its owner, filtered
to the permitted stores (X11): orders are Sales' `orders.placed` (by placed date, excluding open,
proposed and recurring-template orders), net sales are Accounting's `revenue.invoicedNet`, and
visits are Marketing's `visits`, counted from MKT-TRACKING events on the authority (X10).
Conversion is `orders.placed` over `visits` for the same site, store and window; Commerce has no
visit collector of its own and does not read `OrderHeader.visitId`, which a remote PASS cannot
fill (R-COM-W06, adjusted by X10). Values in different currencies are never summed without an
explicit reporting currency and Accounting's conversion policy. The summaries require
`ACCOUNTING_VIEW` today; they also answer a holder of `COMMERCE_VIEW` for stores all in that user's
store scope (Nov 5, impl-commerce F21). Visits exclude preview/test
traffic; refunds are separate from gross sales; the cards say that aggregate visits are not
people. When the site has no Marketing tracking, the visitor and conversion cards are hidden
rather than shown as zero.

The shell receives store, site, record, selection and filter context. Register store/product/order
palette providers, whose rows carry `recordEntity` and `recordId` (R-LV-W10), and scoped
quick-create actions; unread intake errors and approval work reuse existing notification/Today
mechanisms. Never put guest capabilities, payment tokens or preview credentials in Assist,
Chatter, URLs copied to staff notes, or generic telemetry.

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

### 1.4 Stack contributions

Commerce's entries in crosscut §1.5 (review L1–L8). Everything here is built in the framework
except where a needs row says otherwise.

- **Assist (CX-ASSIST).** The Commerce root's `shell-providers` declare `assist-prompt` chips:
  "Explain this store's readiness findings" (StoreDetail), "Why did this cart not convert?"
  (CartDetail), "Summarize payment and fulfillment" (OrderDetail), "Group these failures by
  cause" (IntegrationDetail), "Summarize recent reviews" (Product360 Commerce context). A
  `response-action` "Log as note" files a reply on the order or cart. mr-boss `skill/` gains
  procedure skills for store readiness, cart recovery and channel retry, with their `screens:`.
  Product copy (descriptions, SEO meta, alt text, theme translations) uses the built inline
  text actions (Rewrite, Shorten, Translate, Grammar) on Products' content forms and ThemeEditor
  Translations, and one "Draft from record" action over `org.moqui.agent.AiTaskServices.run#Generate`
  on DocumentDetail (R-LV-W09). These produce drafts; publication is unchanged. Commerce adds no
  `AgentToolExposure` rows, because its screens cover every task. Assist under organization scope
  waits on Mantle's active-organization user-facts provider (L1 prerequisite).
- **Comms hooks.** Commerce answers `call-context` with the caller's open store orders and carts
  in permitted stores, and adds store orders to `record-lookup`. Customer questions by mail,
  chat or phone are Customer Service cases (X7), so Commerce adds no `create-from` kind.
- **Sync and mail intake.** None; store support mail is a Customer Service queue intake.
- **Shipped reports (CX-OPS-REPORTS).** mr-boss ships Commerce `report/*.json` definitions: a store
  operations dataset (orders, carts, recovery sends, promotion use, channel messages and feed
  builds by store and day), one Store operations dashboard, and alert templates for checkout
  failures, long-unresolved payment attempts, feed build failures and intake error spikes
  (R-COM-L03). Recovery delivery, feed builds, channel import and renewal dispatch declare
  `operation` and `operation-ref` (R-LV-W07). The Reports area (§3) registers them with Insights.
- **Meetings.** Video help from an order is later, through Customer Service and an Event with a
  CallLink (L7); Commerce adds no guest-link need.
- **Devices.** POS terminals are later (§16).

## 2. Screens

Rows are grouped in menu order. Simple dialogs are forms on their parent. StoreDetail's tabs and
CheckoutSettings' groups are sections of those screens. The Scope column gives the guide's scope
(`parity` preserves baseline functionality; `new` belongs in the complete first release) and the
stage C1–C4 of §15. Shared rows are defined by their owner and contextualized in §10. Pages and
PageDetail are Commerce's definitions of `Shared/Pages` and `Shared/PageDetail`, which Marketing
also mounts (§5, X14). Requests and Returns are store-filtered views over Customer Service's
cases and returns (X7).

| Screen | Path | Archetype | Impl | Purpose | Main record | Reused | Roles | Scope/stage | Context |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home | Commerce/Home | landing | xml (built P1; measures P11) | Triage store work | scoped operational projection | dashboard widgets, crosscut | reader | new C1 | stores, period |
| Stores | Commerce/Stores | list | xml (built P2, at `Commerce/Stores/Stores`) | Find/create stores | ProductStore | own | reader; manager writes | parity C1 | filters |
| StoreDetail | Commerce/Stores/StoreDetail | detail | xml (built P2; its configuration summary, CSV and print, P15) | Configure one channel | ProductStore | own | reader; manager writes | parity C1 | store |
| StoreGroups | Commerce/Stores/StoreGroups | settings | xml (built P2) | Maintain dated groups | ProductStoreGroup | own | manager | new C1 | organization, group |
| Merchandising | Commerce/Merchandising | list | xml (built P3, at `Commerce/Merchandising/Assortment`) | Prepare/publish assortment | ProductStoreProduct + publication | own | merchandiser/publisher | new C1 | store, products |
| StoreCategories | Commerce/Merchandising/StoreCategories | tree list | qvue (built P3, with its terminal twin StoreCategoriesTui) | Arrange storefront categories | ProductStoreCategory + ProductCategoryRollup | own | merchandiser | parity C1 | store, category |
| Product360 | Commerce/Merchandising/Product360 | 360 | xml (built P3; Paid access P12; its review prompt P15) | Edit merchandising facets and paid access | Product | crosscut §3.5 | domain grants | parity C1 (paid access C3) | product, store |
| CategoryDetail | Commerce/Merchandising/CategoryDetail | detail | xml (built P3) | Edit category identity | ProductCategory | Products §5, made `Shared/CategoryDetail` (Nov 5, impl-commerce F5) | domain grants | parity C1 | category, store |
| CategoryContent | Commerce/Merchandising/CategoryDetail/Content | editor | xml (built P3) | Maintain category content | ProductCategoryContent | Products §5 | domain grants | parity C1 | category, store |
| Documents | Commerce/Merchandising/Documents | list | xml (built P3) | Find product content | ProductContent | Products §9 | domain grants | parity C1 | product, store |
| DocumentDetail | Commerce/Merchandising/Documents/DocumentDetail | detail | xml (built P3) | Edit a content binding | ProductContent | Products §9 | domain grants | parity C1 | content, store |
| Reviews | Commerce/Merchandising/Reviews | split | xml (built P9) | Moderate and reply to product reviews | ProductReview | own | merchandiser | new C2 | store, review |
| PriceLists | Commerce/Merchandising/PriceLists | list | xml (built P3) | Inspect store price policy | ProductPriceList | Products §7 | price grants | parity C1 | store |
| PriceListDetail | Commerce/Merchandising/PriceLists/PriceListDetail | detail | xml (built P3) | Maintain permitted price rules | ProductPriceList | Products §7 | price grants | parity C1 | store, list |
| PriceExplain | Commerce/Merchandising/PriceExplain | report | xml (built P3) | Explain a storefront price | pricing projection | Products §7 | price grants | new C1 | store, product, buyer |
| InventoryAvailability | Commerce/Merchandising/InventoryAvailability | list | xml (built P3) | Inspect store facility availability | availability projection | crosscut §3.7 | stock grants | parity C1 (Nov 5, mounted with the catalog screens, impl-commerce P3) | store, product |
| Themes | Commerce/Website/Themes | list | xml (built P5) | Find/copy/import themes | proposed PublicTheme | own | designer | new C1 | site, store |
| ThemeDetail | Commerce/Website/Themes/ThemeDetail | detail | xml (built P5, at `Commerce/Website/ThemeDetail`) | Validate and publish releases | proposed PublicThemeRelease | own | designer/publisher | new C1 | theme, release |
| ThemeEditor | Commerce/Website/Themes/ThemeEditor | editor | qvue (built P5, at `Commerce/Website/ThemeEditor`, with its terminal twin ThemeEditorTui) | Compose templates visually | proposed theme draft | own | designer | new C1 | template, section |
| TemplateEditor | Commerce/Website/Themes/TemplateEditor | editor | qvue (built P5, at `Commerce/Website/TemplateEditor`, with its terminal twin TemplateEditorTui) | Edit locked template source | versioned resource | framework editor/diff, own workflow | theme developer | new C1 | theme, file, revision |
| Pages | Commerce/Website/Pages | list | xml (built P4) | Manage site pages and policies | WikiPage + PublicSitePage (proposed extension) | own; defines `Shared/Pages` | designer/publisher | new C1 | site, filters |
| PageDetail | Commerce/Website/PageDetail | editor | xml (built P4) | Edit content and assign a template | WikiPage + PublicSitePage | own; defines `Shared/PageDetail`; Wiki editor | designer/publisher | new C1 | page, version |
| Navigation | Commerce/Website/Navigation | tree list | xml (built P4) | Edit menus and redirects | proposed PublicSiteNavigation | own | merchandiser/publisher (Nov 5, as §1.1's `COMMERCE_MERCHANDISE`) | new C1 | site, menu |
| Orders | Commerce/Orders | list | xml (built P8, at `Commerce/Orders/Orders`) | Work submitted online orders | OrderHeader | own list, shared order reads | order reader | parity C2 | store, filters |
| OrderDetail | Commerce/Orders/OrderDetail | detail | xml (built P8) | Work an authorized order | OrderHeader | crosscut §3.6 | domain grants | parity C2 | order, store |
| Carts | Commerce/Orders/Carts | list | xml (built P8) | Inspect open/abandoned carts | OrderHeader + proposed StoreCartAccess | own | order reader | new C2 | store, filters |
| CartDetail | Commerce/Orders/CartDetail | detail | xml (built P8; recovery P10) | Diagnose and recover a cart | OrderHeader + StoreCheckout | own | order reader/recovery | new C2 | cart, store |
| Returns | Commerce/Orders/Returns | list | xml (built P8) | Follow returns of store orders | ReturnHeader | own store-filtered view of Customer Service returns | domain grants | new C2 | store, filters |
| ReturnDetail | Commerce/Orders/ReturnDetail | detail | xml (built P8) | Follow return authorization/settlement | ReturnHeader | crosscut §3.18 | domain grants | parity C2 | return, store |
| Customers | Commerce/Customers | list | xml (built P8, at `Commerce/Customers/Customers`) | Find customers of permitted stores | PartyDetail | own scoped list | order reader | new C2 | store, filters |
| Customer360 | Commerce/Customers/Customer360 | 360 | xml (built P8) | Inspect store relationships | Party | crosscut §3.2 | domain grants | parity C2 | customer, store |
| Subscriptions | Commerce/Customers/Subscriptions | list | xml (built P12) | Monitor recurring contracts | Subscription + proposed StoreRecurringContract | own | order reader | new C3 | store, filters |
| SubscriptionDetail | Commerce/Customers/SubscriptionDetail | detail | xml (built P12) | Resolve renewal/cancellation work | StoreRecurringContract | own | subscription manager | new C3 | contract |
| Requests | Commerce/Customers/Requests | list | xml (built P8) | Follow customer cases about store orders and products | Request | own store-filtered view of Customer Service cases | case readers | new C2 | store, filters |
| RequestDetail | Commerce/Customers/RequestDetail | detail | xml (built P8) | Read a store case and open it in Customer Service | Request | Projects §6 / crosscut §3.11 | case readers | parity C2 | request |
| Promotions | Commerce/Promotions/Promotions (the area's default) | list | xml (built P7) | Find store promotions | ProductStorePromotion | own; shared definition §7 | promotion manager | parity C2 | store, filters |
| PromotionDetail | Commerce/Promotions/PromotionDetail | detail | xml (built P7) | Configure one promotion | ProductStorePromotion | own; shared definition §7 | promotion manager | parity C2 | promotion |
| PromoCodes | Commerce/Promotions/PromoCodes | list | xml (built P7) | Find/generate codes | ProductStorePromoCode | own; shared definition §7 | promotion manager | parity C2 | promotion, codes |
| PromoCodeDetail | Commerce/Promotions/PromoCodeDetail | detail | xml (built P7) | Configure eligibility and limits | ProductStorePromoCode | own; shared definition §7 | promotion manager | parity C2 | code |
| Integrations | Commerce/Integrations | list | xml (built P13, at `Commerce/Integrations/Integrations`) | Inspect channel connections | SystemMessageRemote | own | channel operator | new C4 | store, filters |
| IntegrationDetail | Commerce/Integrations/IntegrationDetail | detail | xml (built P13) | Resolve channel message failures | SystemMessageRemote + SystemMessage | own | channel operator | new C4 | store, remote |
| ChannelImport | Commerce/Integrations/ChannelImport | wizard | xml (built P13) | Validate/import channel orders | SystemMessage + import batch | own | channel operator | new C4 | store, batch |
| Feeds | Commerce/Integrations/Feeds | list | xml (built P14) | Manage public product feeds | proposed ProductStoreFeed | own | channel operator | new C4 | store, filters |
| FeedDetail | Commerce/Integrations/Feeds/FeedDetail | detail | xml (built P14) | Build/inspect a feed | ProductStoreFeed | own | channel operator (Nov 5: publishing a feed is `COMMERCE_CHANNEL_OPERATE`'s, §1.1) | new C4 | feed, build |
| OnlineSales | Commerce/Reports/OnlineSales | report | xml (built P11) | Orders, net sales and top products by store and period | `mantle.sales.SalesReportServices.get#SalesOrderSummary` | own | reader | new C2 | stores, period |
| CartRecovery | Commerce/Reports/CartRecovery | report | xml (built P11) | Carts, abandonment, recovery sends and recovered orders | proposed O.get#CartRecoverySummary | own | reader | new C2 | stores, period |
| PromotionUse | Commerce/Reports/PromotionUse | report | xml (built P11) | Redemptions and discount totals per promotion and code | proposed P.get#PromotionUseSummary | own | promotion manager | new C2 | stores, period, promotion |
| ChannelHealth | Commerce/Reports/ChannelHealth | report | xml (built P14) | Channel message outcomes and feed builds over time | proposed I.get#ChannelHealth | own | channel operator | new C4 | stores, period, remote |
| CheckoutSettings | Commerce/Settings/CheckoutSettings | settings | xml (built P6; RecoveryPolicy P10, RecurringPolicy P12) | Configure checkout choices | ProductStore + gateway/ship bindings | own | manager | parity C2 | store |

## 3. Home, reports and stores

The Reports area is designed here beside Home, because Home's cards and period strip open its
reports with the same store and period filters; in the menu it sits before Settings.

### Home

**Layout:** landing; action cards and the period strip precede recent orders and channel errors.
No bespoke analytics engine: the strip reads the owners' metrics (§1.2). **Forms:**

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| HomeScope | find | Select permitted stores and period | store/group, period, channel | store search, date-period | — | Odoo eCommerce dashboard; research §1 |
| WorkCards | display | Open actionable work | approval, payment holds, fulfillment, unpaid, carts, reviews, errors | dashboard number cards | O.get#StoreWorkSummary | Odoo sale.order dashboard |
| PeriodStrip | display | Compare the period with the previous one | orders, net sales, visits, conversion, top product | dashboard number cards with change | `mantle.sales.SalesReportServices.get#SalesOrderSummary`, `get#SalesInvoiceSummary` (`productStoreIds`), `get#SalesTopProduct` (gains a proposed `productStoreIds` filter); Marketing visits | Odoo eCommerce dashboard; research §1 period strip |
| RecentOrders | list, read | Open the next order | number, customer, date, state, total | record link, currency | O.find#StoreOrders | SimpleScreens Order/FindOrder |

**Actions/navigation:** cards and the strip preserve store and period filters; strip values open
the matching Reports screen. The first-use state links Create store and its readiness checklist.
Partial provider failures name the affected source and leave independent cards usable. Home also
answers Insights' attention provider with the same work counts (Z9). **Source:** research §1,
§12. **Needs:** COM-ACCESS, COM-OPS, COM-REPORTS.

### OnlineSales, CartRecovery, PromotionUse and ChannelHealth

The four Reports screens each hold the shared ReportScope find form and their own list form. They
read the same query as the registered report definitions of §1.4, so a pinned
Insights copy and the Commerce screen agree. Orders and net sales are the owners' metrics (X11):
Commerce filters them by store and adds nothing to their definition.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ReportScope | find | Narrow every report | store/group, period, compare period, currency | date-period, store search | — | Odoo eCommerce reporting filters |
| OnlineSales | list, read | Orders and net sales by store and period | store, period, orders, items, gross, discounts, net invoiced, average order, top products | graph view by period; currency per row | `mantle.sales.SalesReportServices.get#SalesOrderSummary`, `get#SalesInvoiceSummary` (`productStoreIds`), `get#SalesTopProduct` (gains a proposed `productStoreIds` filter) | Odoo Online Sales report; ridgecrest order reports |
| CartRecovery | list, read | Recovery funnel | store, carts opened, abandoned, eligible, recovery sends, delivered, recovered orders, recovered value | graph view | proposed O.get#CartRecoverySummary | Odoo abandoned-cart report |
| PromotionUse | list, read | Promotion and code performance | promotion, code, orders, discount total, net sales of those orders, use limits left | record links to PromotionDetail | proposed P.get#PromotionUseSummary over OrderPromoCode and promotion adjustments | Odoo loyalty reporting |
| ChannelHealth | list, read | Integration and feed outcomes | remote, message type, received, processed, errors, retries, last success; feed, last complete build, skipped products | graph view; links to IntegrationDetail and FeedDetail | proposed I.get#ChannelHealth over SystemMessage and feed builds | tools SystemMessage screens |

The CartRecovery, PromotionUse and ChannelHealth forms are new, and their fields above are the
complete lists. Each report is a registered report definition with its owner (Commerce) in the
Insights catalog (Z10); Insights reads it and does not redefine it. Recurring-template orders and
open carts never count as orders. **Source:** research §1, §12; R-COM-02. **Needs:** COM-REPORTS,
COM-ACCESS.

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
| General | single | Maintain channel policy | name, organization, currency, locale, channel, autoApproveDelay; reservation group (inventoryFacilityId, reservationOrderEnumId, reservationAutoEnumId, requireInventory) read-only | grouped fields, source hints; reservation group links to Warehouse StoreReservation | C.store#Store | EditProductStore EditStoreForm |
| SiteBindings | list, read | Inspect host/mount/publication | site, canonical host, mount, store, readiness | preview and operator-settings links | C.get#StoreSites | PopRestStore settings; PASS PublicSiteApp |
| Facilities | list, editable rows | Bind fulfillment facilities | facility, priority, effective dates | facility search | C.store#StoreFacility | FindProductStoreFacility forms |
| Staff | list, editable rows | Scope staff to a store | party, role, effective dates | authorized staff lookup | C.store#StoreParty | FindProductStoreParty forms |
| Emails | list, editable rows | Choose registered output templates | email type, template, dates, header/detail links, internal BCC | template preview; type choices are the seeded ProductStoreEmailType values | C.store#StoreEmail | FindProductStoreEmails forms |
| OrderChecks | list, editable rows | Configure approved validation hooks | registered check, order, dates, typed parameters | ServiceRegister selector | C.store#StoreApproval | ProductStoreApprove; research §11 |
| SearchContent | list, editable rows | Bind search and content sources | document type/id, wiki space/type, locale, effective dates | registered source choices | C.store#StoreContentBinding | EditProductStore data-document forms; ProductStoreWikiSpace/Content |
| TypedSettings | list, editable rows | Maintain other supported dated settings | setting type, value, dates | input derived from registered type | C.store#StoreSetting | FindProductStoreSettings forms |
| CloneStore | dialog | Copy permitted configuration | target name/org, selected settings/categories/facilities/promotions | copy preview | existing `mantle.product.StoreServices.clone#ProductStore`, through C.clone#Store guard | EditProductStore CloneProductStoreForm |
| Readiness | display | Explain publication/checkout blockers | site, catalog, theme, payments, delivery/tax, content issues | actionable findings | C.check#StoreReadiness | Odoo store settings; PASS readiness |

**Emails.** The type choices include the seeded `PsetPaymentRetry` (renewal payment failure),
`PsetBackOrder`, `PsetOrderChange`, `PsetReturnAccepted`, `PsetReturnCompleted`,
`PsetReturnCancelled`, `PsetGiftCardPurchase` and `PsetGiftCardReload`, beside the order,
shipment and invoice types; proposed seed adds `PsetCartRecovery`, `PsetSubscriptionRenewal`
and `PsetReviewRequest` (R-COM-W03). RecoveryPolicy and RecurringPolicy (§8) choose among these
bindings. Messages go out through the Comms delivery ledger (X8).

**Reservation.** The reservation fields are shown read-only. Warehouse's StoreReservation form
is their one editor, over the one Mantle store reservation service (WH-POLICY); Commerce links
to it and does not write them (X16, R-COM-05).

**Readiness and recovery registration.** `C.check#StoreReadiness` is a registered Admin §14
readiness provider (stable key, owner Commerce, freshness and fix link), and
`I.retry#StoreMessages` is a registered operational recovery action that keeps the original
message identity (Z9, R-COM-13). Admin has not built those registries, so until it does the
readiness service is StoreDetail's Readiness and the Shop app's PASS readiness, and retry is
IntegrationDetail's action (Nov 5, impl-commerce F23). Readiness refuses a payment gateway outside the store
organization's enabled `PaymentGatewayOrganization` rows (Z4) and a store whose shipping is bound
to the local rate gateway with no local rate rule (§8).

**As built (Nov 5, 2026; impl-commerce P2).** Readiness is the first box of the General tab, and the record header shows
its count of blocking findings. Each finding names the section that fixes it (`general`, `sites`, `facilities`,
`emails`, `settings`), never a screen path, so Mantle names no BOSS screen; StoreDetail maps the section to its tab. A
missing fulfillment facility only warns (a digital store needs none). TypedSettings sets only the types StoreAdmin.js
lists with their kinds (true/false, number, percentage, one line); template, content and URL locations are shown, not
set. OrderChecks' typed parameters are the names a ServiceRegister's `configParameters` lists. History is the audit log
of ProductStore's fields and the ship-option and payment-gateway bindings; the dated tabs keep their ended rows.

Clone starts unpublished, with no host mount, active recovery schedule, external credentials,
customer data or running connector. Mantle's `clone#ProductStore` copies party rows of every role,
a customer's CustomerBillTo included, so the guard passes staff roles only and reports the sections
Mantle does not copy (Nov 5, impl-commerce F12). It produces a per-section result and requires explicit
approval of copied organization-sensitive references. An authorized operator binds hosts/mounts
through existing `mantle.public.SiteServices.store#Mounts`; Commerce shows the result and cannot
bypass the runtime allowlist. `storeDomain` is an email compatibility value, not a second router.

Staff cannot select arbitrary service names, resource URLs, sender identities, or remote origins.
Search/content bindings do not publish a private wiki space or expose a raw DataDocument.
**Source:** research §2, §11; Shop §§4, 12. **Needs:** COM-STORE, COM-ACCESS, SHOP-MOUNT.

### StoreGroups

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| GroupList | list | Find a group | description, type, member count | record links | C.find#StoreGroups | ProductStoreGroup; research §11 |
| GroupEdit | single | Maintain a group | description, storeGroupTypeEnumId | type choice | C.store#StoreGroup | ProductStoreGroup |
| Members | list, editable rows | Bind stores | store, fromDate, thruDate | authorized store lookup | C.store#StoreGroup | ProductStoreGroupMember |
| Parties | list, editable rows | Bind group parties | party, role, fromDate, thruDate | party lookup | C.store#StoreGroup | ProductStoreGroupParty |

Baseline entities are `ProductStoreGroup` (description and `storeGroupTypeEnumId`; it has no name
field), `ProductStoreGroupMember` and `ProductStoreGroupParty`, whose keys already include
`fromDate` and which carry `thruDate`. There is no baseline screen, and the ProductStoreGroupType
enumeration has no values; Commerce seeds them (Nov 5). These are the complete new
form fields, plus generated keys, expected revision and change reason.

**A group's organization (Nov 5, 2026; impl-commerce P2).** ProductStoreGroup has no organization field, so a group
belongs to the organization of its current `OrgInternal` ProductStoreGroupParty row, which `C.store#StoreGroup` writes at
creation; Parties lists the other rows (staff roles). A group holds stores of its own organization only, and a
store-limited staff member changes only a group whose members in effect are all theirs.

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

**Policy:** explicit store publication is required for every public product. Publishing a
virtual product covers its saleable variants by default; a variant is withdrawn by its own
explicit row, and the bulk preview lists the variants a publication covers (R-COM-14). So a
50-variant product is one publication row, plus one row per withdrawn variant. The resolver
intersects publication, effective categories, `PsctViewAllow`/`PsctPurchaseAllow`, product
sellability and site access. It never treats an empty allow-category as an instruction to
publish the entire catalog. Existing stores get an import preview, not automatic publication.
Shop §5 owns the exact projection. Withdrawal invalidates search, feeds, recommendations and
caches; existing orders retain their private historical description.

**Publication rows (Nov 5, 2026; impl-commerce §4).** `ProductStoreProduct` today is keyed by store
and product and holds only a signature requirement. It becomes an effective-dated association, as
`ProductStoreCategory` is: `fromDate` joins its key, with `thruDate`, the publication kind
(published, or a variant's exclusion), template key, badge text, featured rank and the change's
reason, its key fields audit-logged (built in P3; a row with no kind, made before, is published). Publishing starts a row from a date, withdrawal ends it, and a change of template or
badge is a new row. Store-specific title, description and SEO text are the store's `ProductContent`
rows, which Mantle already keys by `productStoreId`; there is no override field.

**Navigation:** Product360 opens with store fixed; product content, category and price links
mount their owning screens. **Source:** research §3, §12. **Needs:** COM-MERCH, SHOP-CATALOG.

### Product360 paid access

Commerce's Product360 context has a Paid access pane, the one editor of what a product grants
(X16, R-COM-01). Products gives up the claim, and Shop and Forum read the result. The pane edits
existing `ProductSubscriptionResource` rows; it never edits a `SubscriptionResource`'s handler
service names. A resource and its init, renew, revoke, restore and destroy handlers come from the
installed component that implements them: PASS site and category access is bound by an operator
through PASS SiteDetail's existing subscription-binding form, which the pane links.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| PaidAccess | list, editable rows | Bind the product to the resources a purchase grants | subscriptionResourceId, fromDate, thruDate, purchaseFromDate, purchaseThruDate, availableTime, availableTimeUomId, useCountLimit, useTime, useTimeUomId, useRoleTypeId | resource choice limited to registered resources with handlers; handler names shown read-only; time UOM choices | proposed R.store#ProductSubscriptionResource | new |
| ResourceUse | list, read | Show who holds access from this product | resource, subscriber label, from/thru, source order | separate billing/access badges | R.find#StoreSubscriptions | Mantle Subscription |

PaidAccess's fields above are the complete list; the product is fixed by the context. A change
applies to purchases made after it; existing Subscriptions keep their source terms. Removing a
resource with live subscriptions is refused and names the count. **Source:** research §3;
`mantle.product.SubscriptionServices.fulfill#ProductSubscriptionResource`, which reads these
rows. **Needs:** COM-SUBSCRIPTION, SHOP-SUBSCRIPTION.

**As built (Nov 6, impl-commerce P12).** Paid access is a Product360 tab (`Shared/Product360/PaidAccess`)
over `R.get#ProductPaidAccess` and `R.store#ProductSubscriptionResource`: Commerce edits it
(`COMMERCE_SUBSCRIPTION_MANAGE`, the product sold only in stores the user works: PRODUCT_SHARED otherwise, P12 review R2), Products shows
the rows read only for a digital product. A change ends the row in effect and starts its successor (a row
not yet started changes in place); one current row per resource (RESOURCE_BOUND); a resource is offered
only when its init and every named handler service is installed (RESOURCE_UNAVAILABLE); ending one with
live subscriptions is refused naming the count (SUBSCRIPTIONS_LIVE). ResourceUse is `R.find#StoreSubscriptions`
with the product, for an order reader. PASS SiteDetail is on the site's own host, not a BOSS route, so the
pane names its subscription binding rather than linking it.

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
rollup/membership change. Copy a store taxonomy explicitly if an independent hierarchy is needed. A change a store the
user does not work would see is refused, not confirmed (Nov 5, impl-commerce P3). Roles and
membership forms are in the TUI twin, which the tree view opens; the tree view moves and reorders.
Cycle and effective-date checks are mandatory. A category editor does not grant product
publication. **Source:** research §3, §11. **Needs:** COM-MERCH.

### Reviews

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ReviewFind | find | Narrow the queue | store, product, status, date, reporter | product lookup | — | research §3 |
| Reviews | list | Inspect submitted reviews | product, rating, author display, date, state, replied | review preview | M.find#Reviews | ProductReview |
| ReviewDecision | single | Moderate selected reviews | review, approve/delete, reason, expected revision | body and image preview, confirmation | M.moderate#Review | ProductReview statuses; ridgecrest reviews |
| Reply | single | Publish the store's public reply to one approved review | review, reply text, expected revision | plain-text editor with inline text actions; public preview | proposed M.reply#Review | Odoo `portal_rating` publisher comment (COM-F03) |

Reads use M.find#Reviews; decisions use M.moderate#Review over existing
`ProductReview` and `PrvwPending`, `PrvwApproved`, `PrvwDeleted`. `ProductReview` keys its author
by user account, has no order proof or reply, and no service reads or writes it today. A decision
is a status change whose reason is in the audit log (the status is already audit-logged); the
reply's text, actor and time and the purchase proof are fields of the review, audit-logged; there
is no decision record (Nov 5, impl-commerce F19). The full new decision form has
only those fields; no editable replacement for a customer's text. Reply's fields above are its
complete list; the reply, its actor and time live in the proposed review extension (COM-MERCH),
show under the review in Shop, and can be edited or withdrawn by the same permission. A
post-purchase review request is the proposed `PsetReviewRequest` store email, sent after
delivery or download through the Comms delivery ledger.

**Images (Nov 5, 2026; impl-commerce §4).** A review may carry a few images, staged and scanned
through Mantle's shared `PortalMedia.js` (PNG or JPEG), decided with the review and served only
once it is approved; an author's change of the images returns it to pending.

Submitted reviews start pending. Public projection strips private author IDs/contact details;
verified-purchase evidence is computed from the actor's qualifying order, not a checkbox.
An author edit returns an approved review to pending through a proposed status-flow extension
and guarded Shop operation. A review staff delete stays the author's one review of the product: deletion is final, so it
is neither edited nor written again (Nov 7, impl-commerce F101); a decision or reply names the revision it was made at
(F102). Product discussion links use Forum's separate
communication records; reviews do not become copied forum posts. Bulk decisions confirm counts
and preserve per-review outcomes. **Source:** research §3 and ridgecrest's different review model.
**Needs:** COM-MERCH, SHOP-CATALOG.

**Built (Nov 6, 2026; impl-commerce P9).** The proof is the author's own delivered order line (shipment delivered, order
completed or a download granted), one review per account, store and product; the author's label is chosen at submission.
A bulk decision posts each selected row with the revision shown and answers per review. The review request is queued on
the delivery ledger at a Shop line's delivery or first download, once per line, and needs the recipient's marketing email
consent (impl-commerce F95).

**Review requests are their own opt-in (Nov 6, 2026; impl-commerce §4, F95).** The review request is a solicitation, not a
transactional notice, and is consented per store, not by marketing email: each store has a "review requests" topic (a
contact list of its own, purpose `PcpReviewRequest`, as Shop P6's "cart reminders"), which a customer turns on on the PASS
Account email preferences page or at checkout (design-shop §6 Checkout's optional emails). The delivery ledger sends the
request only while that topic is granted; marketing email consent neither sends it nor is needed. Its message carries the
preferences link. **Message classes.** Transactional (no opt-in, sent whatever the buyer chose): the receipt, order,
shipment, download-ready, invoice and subscription notices, and instructional or documentation follow-ups of a purchase
(how to use it, download instructions, setup guides). Opt-in per store topic: review requests and cart reminders. Marketing
(the store's news and offers list, `ConsentServices`' list consent): anything that promotes. A message that both instructs
and promotes is marketing.

## 5. Website authoring

This section is the **one definition of the staff editors**. Shop §12 owns the theme package,
safe rendering and public release contract. No authoring screen or authoring service is exposed
through the public Shop operation registry. Visual designers can manage safe assets and
translations without template-code permission; code edits and publication require their
separate grants. The underlying theme records/services are in Mantle
and versioned resources in the framework, so published sites keep running without BOSS.

**Site pages (X14, R-COM-03, R-COM-09).** A public page is a published WikiPage version bound by
existing `mantle.public.PublicSitePage` and served by existing
`mantle.public.SiteServices.get#SitePage` and `publish#SitePage`, which today bind a site and page
role to a wiki page, version and publication revision. The proposed extension adds app mount,
route, locale, publication window, template key and SEO fields, with the page role optional (set
for policy pages). There is no `PublicShopPage`: one binding serves Shop pages, policy pages and
Marketing's storeless landing pages, and a campaign landing page needs no ProductStore. Pages and
PageDetail are defined once here as `Shared/Pages` and `Shared/PageDetail`, with crosscut §2
registry rows; [Marketing §8](design-marketing.md#8-content-and-tracking) mounts them with its
campaign context. Registered subscription, form and event components use PASS Marketing
operations (MKT-CONTENT, MKT-PUBLIC). Neither mount is authority to publish private wiki content.

**Per-app context** for `Shared/Pages` and `Shared/PageDetail`:

| App | Mount | Filters fixed | Action set | Emphasis |
| --- | --- | --- | --- | --- |
| Commerce | `Commerce/Website/Pages`, `Commerce/Website/PageDetail` (one route per screen, Nov 6) | permitted sites with a Shop mount; store pages and policy roles | new, edit, preview, publish, schedule, withdraw, assign template | policy versions accepted at checkout; menu references |
| Marketing | `Marketing/Content/LandingPages[/PageDetail]` | permitted sites; campaign landing pages (no policy roles) | new, edit, preview, publish, schedule, withdraw; campaign link | campaign association and tracking links |

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

**As built (Nov 6, impl-commerce P5).** The screens are `Commerce/Website/Themes`, `ThemeDetail`, `ThemeEditor` (.qvue,
twin `ThemeEditorTui`) and `TemplateEditor` (.qvue, twin `TemplateEditorTui`), one route each. ThemeDetail is one page
of boxes (Theme, Validation after Validate, Where it is used, Pages and products with their own template, Releases,
Activity) rather than tabs; Publish is the header's primary action for a store with one Shop site and a row action
("Publish here") for several; Restore and Export are release-row actions. The authoring services are
`mantle.public.ThemeServices`' authoring part (`ThemeAuthoring.js`): every save checks the draft revision and is refused
when the adapter finds an error in the file it changes (`THEME_SOURCE_INVALID` with file and line), so a draft never
holds a script or an event handler; `get#ThemeComposition` and `get#PreviewHost` were added beside the named ones. A
section's settings travel with the composition (one save), the global settings with `store#ThemeSettings`. Template
assignment covers pages (through `store#SitePage`, so F78's publish rule holds) and published products (through
`store#StoreProduct`); a page's template key must be a page template of the site's active release or of a draft of the
store's themes (F77), and a live page renders with it when the active release has it. Images and fonts are assets kept
as bytes (F55). Imports are a `.tar.gz` (or a files map through the service). The preview is ZIZI_SHOP-style: a
`PshkPreview` host of the site (impl-commerce F54) answering only `/preview/{token}`; the editor frames it and talks to
it through a MessageChannel port given with the nonce of the frame's URL; the starter's sections carry
`data-section-id` so a click selects a section.

### Pages

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| PageFind | find | Find site pages | text, locale, publication state, role | — | — | Frappe Web Page |
| PageList | list | Inspect publication | title, mount, route, locale, template, published version | draft/live links | T.find#SitePages | Frappe Web Page; PublicSitePage |
| NewPage | dialog | Create a draft page | title, mount, locale, route, template, policy role | template picker | T.store#SitePage | Odoo website pages |

T.find#SitePages and T.store#SitePage provide the guarded reads/writes. These are the full new
form fields apart from IDs/revisions. Existing WikiPage stores content; the extended
`PublicSitePage` binds an exact published version to a mount, route, locale and template.
**Actions:** New page, edit, preview; withdrawal confirms and reports menu references.
**Source:** Frappe Web Page, Odoo website pages, PASS PublicSitePage. **Needs:** COM-THEME,
SHOP-CONTENT.

### PageDetail

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| PageContent | component | Edit localized content | title, locale, body, revision | shared wiki editor with inline text actions | T.store#SitePage | Commons Knowledge |
| PageRoute | single | Bind the public route/template | mount, route, locale, SEO title/description, social image, template, policy role | safe media/template selectors | T.store#SitePage | Frappe Web Page; Odoo pages |
| PagePublication | dialog | Publish, schedule or withdraw | draft/published version, from/thru, reason | affected-route preview | existing `mantle.public.SiteServices.publish#SitePage`, extended with mount, route, locale and window | PASS publication |
| PageHistory | list, read | Inspect prior versions | resource version, actor, publication activity | diff links | proposed T.get#SitePageHistory | framework resource history |

T.store#SitePage and `publish#SitePage` call the framework's versioned wiki operations and never
publish the entire space. Body editing reuses Commons Knowledge editing; the route/publication
fields above are the full new fields. A page chooses its composition from ThemeEditor rather
than embedding another page builder in the wiki editor.

**As built (Nov 6, impl-commerce P4).** `PublicSitePage` is keyed by a sequenced `sitePageId`; its role is unique
within a site when set (the Forum keeps guidelines and about, Commerce's policy roles are delivery, returns, privacy and
terms). A Commerce page is on the site's Shop mount, its route under the mount's `pages/`. Its body is a page of the
store's page space (the store's full-page content space, made with `restrictUpdate` when it has none), which only
`T.store#SitePage` writes, giving the designer the space's update right for the one write, so Commons Knowledge cannot
change or wiki-publish it. Publishing a version makes it the page's published wiki version and the binding's in one
transaction, so a visitor's read always finds the binding's exact version published; a version saved since stays a draft.
A published or scheduled page's route, locale, role, title, template and SEO are what the site shows, so changing them is
a publication too: `COMMERCE_PUBLISH` as well as `COMMERCE_THEME_EDIT`, against the binding's publication revision, which
advances (F78). A publication from a later date waits in the binding's scheduled fields and the `run_ScheduledSitePublications` job
revalidates it as its publisher (the grant and the store still theirs, the version and route still valid); a refusal is
kept on the page and listed by the store's readiness, and the live version stays. PageContent is Commons Knowledge's
component in a Commerce mode (the bound page alone) with PageDetail's own transitions, its terminal twin a text form
(PageText). Navigation: a menu is `PublicSiteNavigation` (draft items as JSON, a draft revision) with dated
`PublicSiteNavigationVersion` snapshots; a redirect is a dated `PublicSiteRedirect` (draft, scheduled, active, failed,
withdrawn), published like a menu. The live menu feeds the Shop view's `navigation` (the `main` menu).

Policies such as delivery, returns, privacy and terms are named roles with version-pinned content.
Checkout records the accepted terms version. Scheduled publication is revalidated at execution;
failure leaves the old published version active and creates an actionable finding. The first
release includes store pages, not the full Blog/Publishing editorial application. **Source:**
research §4, Shop §§3, 12. **Needs:** COM-THEME, SHOP-CONTENT.

### Navigation

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| MenuEdit | single | Describe a menu | key, name, locale | — | T.store#SiteNavigation | Odoo website menus |
| MenuItems | list, editable rows | Arrange typed destinations | stable ID, parent, label, destination, sequence, visibility | keyboard tree controls | T.store#SiteNavigation | Odoo website menus |
| Redirects | list, editable rows | Preserve old paths | old path, typed target, permanent/temporary, dates | destination validation | T.store#SiteNavigation | Frappe route redirects |
| PublishNavigation | dialog | Activate a menu version | draft revision, affected site/mount, reason | destination/visibility preview | T.publish#SiteNavigation | proposed versioned navigation |

T.store#SiteNavigation validates all destinations and T.publish#SiteNavigation activates a
versioned navigation snapshot over proposed `PublicSiteNavigation`, which is site-level like
PublicSitePage rather than Shop-named.
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
default, excluding `OrderOpen` and recurring base orders, which carry Sales' proposed
`orderPurposeEnumId` value RecurringTemplate (X5); a Recurring filter shows the bases on their
own. Unpaid means a computed payment state, not a guessed order status. A Payment hold filter
lists orders with an open `OhtPayment` hold, placed when a capture fails or a chargeback arrives
after placement; Commerce shows the hold and its reason and links Accounting, which releases it
(X4). Customer cancellation requests are Customer Service order-change proposals; a row shows a
badge and opens the shared OrderChangeDetail in Customer Service (X7). Opening a row uses the
shared OrderDetail. Bulk staff actions retain the shared guards. **Source:** research §1, §6.
**Needs:** COM-OPS, COM-ACCESS.

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
| RecoveryHistory | list, read | Inspect eligible contact and prior attempts | eligibility reason, consent state, channel, sent time, delivery outcome, redeemed | redacted destination | O.get#CartRecovery; existing `mantle.party.ConsentServices.get#PartyConsentState` | Odoo abandonment follow-up |
| RecoverCart | dialog | Send one authorized recovery invitation | registered template, verified destination choice, preview, reason | exact-body preview with its unsubscribe link | O.send#CartRecovery; existing `ConsentServices.create#UnsubscribeToken` | Odoo cart recovery; Comms consent |
| ResolvePlacement | dialog | Resolve a stuck Shop placement (Shop P8, impl-commerce F108) | place again, or refund the kept payment and cancel the cart; reason | shown only for a stuck placement and a holder of `COMMERCE_PLACEMENT_RESOLVE` | `mantle.order.ShopOperationsServices.resolve#StuckPlacement` (operation key; existing `release#SinglePayment` / `refund#SinglePayment`, `cancel#Order`) | design-shop §18.1 "Failed placement after provider success" |

Sending never changes an order or signs a staff member in as the shopper. The invitation carries
a one-time recovery token of the cart's proposed `StoreCartAccess` (digest and throttle as the
ExternalAccess capability, X6); redeeming it binds a fresh session cart capability and opens a
narrowly scoped recovery flow that cannot expose another customer's saved address or payment
method. Each message is a source on the Comms delivery ledger (X8), keyed by cart, recovery
window and template, which records the consent snapshot and the outcome; RecoveryHistory reads
it. Every message carries an unsubscribe link to the PASS Account email preferences page (X15,
R-COM-W05). Recovery respects consent/suppression, inactivity and send limits. No automatic
sends until the store enables them. **Consent (Nov 5, 2026; impl-commerce §4):** the consent is
the store's "cart reminders" topic, which a signed-in customer turns on in the PASS Account email
preferences page (Shop §9), or, since Nov 6, checks among checkout's optional emails (offered
only to a signed-in buyer whose account email is verified, Shop P6 review R2's rule; P9 follow-up review R2); a guest's
cart is never eligible. Refresh rechecks eligibility; a successful checkout
suppresses queued recovery. **Needs:** COM-OPS, SHOP-CART.

**As built (Nov 6, 2026; impl-commerce P10).** RecoveryHistory and RecoverCart read and send through
`O.get#CartRecovery` and `O.send#CartRecovery` (`COMMERCE_RECOVERY`, a reason, an operation key and
the cart's revision). A cart is eligible when the store's recovery is on with a current
`PsetCartRecovery` email, the cart is a signed-in account's (never a guest's or staff's), open, not in
a live or completed checkout and not empty, the account holds the store's cart reminders topic with
its own email verified, it is idle past the delay and within the window, and it is under the most
sends; otherwise its reason is named. The abandonment event is the cart and its last activity
(`cartRecovery:{orderId}:{activity}` on the delivery ledger, source `MdsrcCartRecovery`), so one
visit to the cart is one mail at most; the `run_CartRecovery` job raises it every ten minutes for
the stores that turned recovery on, each cart in its own transaction. Each attempt checks the cart
again (closed, completed, checking out or the shopper back suppresses it) and makes a new one-time
token for the link of that message; the token's digest is the cart's StoreCartAccess
`recoveryTokenDigest` until the window ends (`recoveryExpireDate`). The link is Shop's Recover page
(design-shop §13.2): it asks a visitor to sign in, since the cart is an account's, and the shopper's
Open my cart spends the token. The preview renders the template's exact body with the link shown
as made at the send. The consent read is the topic's (`check#CartReminderConsent`), not
`get#PartyConsentState`.

**One sender per cart (Nov 1, 2026; review R-MKT-R03, X8).** Cart abandonment is one shared trigger
event, raised once per cart and inactivity window when the store's RecoveryPolicy delay passes.
Commerce's built-in recovery and a Marketing automation with the cart-abandoned trigger
([Marketing §6](design-marketing.md#6-automation)) both consume it. RecoveryPolicy names the one
sender for the store's carts, built-in recovery or a named Marketing automation, and the other
does not send. The Comms delivery ledger deduplicates by cart and recipient as a second guard, so
a cart never gets two recovery mails.

### Returns

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| ReturnFind | find | Find returns of store orders | store/channel, customer/order, status (Requested first), dates | order search | — | crosscut ReturnDetail |
| Returns | list | Follow authorization, receipt and settlement | RMA number, customer reference, source order, customer, requested/authorized/received quantities, settlement state | shared record links | O.find#StoreReturns | Customer Service return policy |

This is a store-filtered view of Customer Service's returns (X7, R-COM-04). A customer's return
request from Shop or PASS Support is a `ReturnHeader` in ReturnRequested, made by Customer
Service's proposed `mantle.order.ReturnPolicyServices.request#CustomerReturn`; no Request is
created. O.find#StoreReturns lists ReturnHeaders by the store of their source order lines; no
arbitrary client store filter grants access. Rows open the shared ReturnDetail, where Customer
Service authorizes and Accounting settles; Commerce takes no return action of its own.
**Source:** research §6, crosscut §3.18 and Customer Service ReturnDetail. **Needs:** COM-OPS.

### Customers

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| CustomerFind | find | Find store customers | name/contact text, store, order period, account state | scoped search | — | research §7 |
| Customers | list | Inspect store relationships | name, store relation, recent order, open carts, account state | shared customer link | O.find#StoreCustomers | AureusERP portal; Party and orders |

O.find#StoreCustomers returns customers with a permitted store relationship/order. The result
is not a directory of all Party records. Guest purchases do not automatically create public
community profiles or link to an existing account merely because an email matches; duplicates
are merged only through Commons' guarded `merge#Parties` (X15). Open shared Customer360 for
details. A data-subject request for a store customer is an Admin privacy request; the store
privacy provider Shop registers (Shop §9) answers it for carts, recovery sends, reviews, download
grants and recurring contracts. **Source:** research §7; AureusERP portal contributions.
**Needs:** COM-ACCESS, COM-OPS, SHOP-ACCOUNT.

### Subscriptions

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| SubscriptionFind | find | Find renewal/access work | store, customer, product/resource, state, renewal period | date-period | — | Mantle Subscription/recurring orders |
| Subscriptions | list | Monitor paid access | contract, customer, product, paid-through, next charge, amount/currency, outcome | separate billing/access badges | R.find#StoreSubscriptions | Mantle recurring orders; PASS entitlements |

R.find#StoreSubscriptions returns contract and existing
Subscription projections. These fields are the full new list/filter contract; financial actions
link to the owning Accounting record. A contract's recurring base order carries the
RecurringTemplate purpose (X5), so it never counts as an order, as open credit exposure or as
reserved stock; the list shows it only as the contract's schedule. **Source:** Mantle
Subscription/recurring orders; PASS Forum entitlements. **Needs:** COM-SUBSCRIPTION,
SHOP-SUBSCRIPTION.

**Sales context (Nov 1, 2026; review R-SAL-13).** This list is the one Subscriptions list. Sales mounts
it at `Sales/Agreements/Subscriptions` ([Sales](design-sales.md#subscriptions--context-passed)), and
`R.find#StoreSubscriptions` therefore takes the store as an optional filter: with no store, storeless
Subscription rows from native sales orders appear beside store contracts, scoped by the seller
organization the user may see.

| App | Tabs or panes shown | Filters fixed | Action set | Emphasis |
| --- | --- | --- | --- | --- |
| Commerce | Subscriptions with contract and access badges | the stores the user may see | open SubscriptionDetail; cancel or retry under Commerce grants | paid access and renewals |
| Sales | Subscription list with source order, agreement and recurring owner | permitted seller; customer and agreement when opened from them; store optional | follow up, open base order; lifecycle actions only with Commerce or Accounting grants | renewals as account work |

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

Cancellation stops future billing at the end of the paid term by default. Refunds use Accounting:
a refund, a return settlement or a chargeback intake runs the proposed Mantle SECA that calls
Shop's proposed `mantle.product.ShopFulfillmentServices.reconcile#RefundedItem`, which revokes or
shortens the affected source grant and leaves independent grants alone (X5). Access shows the
result; staff do not revoke by hand. Retry resumes the same occurrence and unresolved attempt; it
cannot create another charge while the first is uncertain. A renewal charges a saved method only
with the customer's recorded off-session consent (X5). Renewal failure notices are Shop's
payment-attempt notices (`PsetPaymentRetry`); Accounting's Dunning excludes the invoice of a
renewal still in retry (R-SC-03). Staff never enter a customer's card in this screen.
**Needs:** COM-SUBSCRIPTION, SHOP-SUBSCRIPTION.

**As built (Nov 6, impl-commerce P12).** Subscriptions and SubscriptionDetail are under Customers
(`Commerce/Customers/Subscriptions`, `Customers/SubscriptionDetail`), for the store and subscription
operators. `R.find#StoreSubscriptions` and `R.get#StoreSubscription` need `COMMERCE_ORDER_VIEW` (or
`COMMERCE_SUBSCRIPTION_MANAGE`) and the store scope; the store is optional. The detail shows the method as
type and last four and whether the consent is recorded, never its evidence, provider profile or gateway.
`R.cancel#RecurringContract` takes the revision shown and keeps the paid term (RENEWAL_IN_PROGRESS while a
payment is in flight); `R.retry#Renewal` takes an operation key (a double submit answers the first result),
resumes the same occurrence through Shop's coordinator, and is refused while a payment is unresolved
(PAYMENT_UNRESOLVED) or with no recorded consent (CONSENT_REQUIRED). A refund of an automatic contract's
latest term ends its renewal (design-shop §10.2 as built). Customer360 lists the customer's subscriptions.
Storeless native Subscription rows for Sales' mount are not listed yet (impl-commerce F145).

### Requests

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| RequestFind | find | Narrow store cases | store, queue, customer-visible status, assignee, customer, source order/product | scoped choices | — | Customer Service Cases find |
| Requests | list, read | Follow cases about store orders and products | case, subject, customer, source order/product, status, queue, assignee, SLA due | shared request links; Open in Customer Service | O.find#StoreRequests | Customer Service Cases; ridgecrest public requests |

This is a store-filtered view of Customer Service's cases (X7, R-SC-06). A Shop question is a
case made by Customer Service's proposed `mantle.request.SupportCaseServices.create#CustomerCase`
in the store's service queue, which CheckoutSettings' CheckoutPolicy names; Customer Service
triages, assigns and answers it. O.find#StoreRequests returns cases linked to the store's orders
or products or filed in its queue. Rows open the shared RequestDetail with Customer Service's
case context, read-only in Commerce apart from adding an internal note; working the case opens it
in Customer Service. Returns are ReturnHeaders, not requests (Returns above), and a retailer
application is a lead through the one public lead page (X15). Private case notes and financial
facts are not mirrored into public Forum discussions. **Source:** research §7; Customer Service
§3 and §8. **Needs:** COM-OPS.

## 7. Promotions

This section owns the initial **shared store-promotion screens**, physically proposed as
`Shared/Promotions`, `Shared/PromotionDetail`, `Shared/PromoCodes`, `Shared/PromoCodeDetail`.
Commerce mounts them under the paths in §2. [Marketing §7](design-marketing.md#7-promotions) mounts
the same definitions with dated campaign links and permitted-store context; it does not fork these forms. Multi-store programs and loyalty ledgers are
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
Mantle counts uses over placed orders only, without a lock, when a code is added and at repricing,
never at placement; so `P.check#OrderPromotionLimits` counts every limit field again under a lock
of the promotion's and code's rows at checkout's freeze and at the placement of any store order
(Nov 5, impl-commerce F18 and §4: a deliberate change to Mantle's default, with an order with no
limits and mr-marble's order screens unchanged). Built in P7 (Nov 6): a use is Mantle's
`promoTimesUsed` of the promotion items of orders whose part is placed or later, as
`apply#OrderPromotions` counts it; the uses per order are per order part, as it applies them;
`place#Order` refuses an order past a limit (`PROMOTION_LIMIT_REACHED`, naming each limit) before
its status changes, and the caller reprices it (the discount comes off) and places it again; an
order already placed is not counted again when it is placed back (un-approve); an order whose
promotions and codes set no limit takes no lock. The promotion's dates and limits and the code's are
audit-logged with the reason of a change. A promotion keeps its store and rule; reads are
`P.get#Promotion` and `P.get#PromoCode`, and the drop-downs `P.find#PromotionOptions`.
**Needs:** COM-PROMO, SHOP-CHECKOUT.

### PromoCodes

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| CodeFind | find | Find promotion codes | promotion, code, dates, party restriction | — | — | FindPromoCode |
| Codes | list | Inspect code usage | code, dates, limits, use count | code links | P.find#PromoCodes | FindPromoCode PromoCodeForm |
| NewCode | dialog | Create one code | code or generate, dates, use limits, requireParty | code preview | P.store#PromoCode | FindPromoCode NewPromoCodeForm |
| GenerateCodes | dialog | Generate a bounded batch | count, prefix, dates, limits, requireParty | collision/result preview | P.generate#PromoCodes (proposed) | new; fields here plus operation ID/revision |

P.find#PromoCodes and P.store#PromoCode serve the baseline FindPromoCode forms. Batch generation
adds count, prefix and collision/result preview, capped and executed as independent items (P7:
up to 500, random characters drawn again on a collision or numbered from a start with the taken
ones listed in the preview and skipped, keyed by an operation key on `PostingOperation`).
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
Marketing selects permitted stores and emphasizes the campaign links defined in its §7; Sales only
reads eligible codes and applies them on the existing shared order form. No mount grants extra
promotion or pricing authority.

## 8. Checkout settings

### CheckoutSettings

**Layout:** grouped settings for customer experience, delivery, payment, tax, recovery and
recurring offers, with a shared readiness strip. CheckoutPolicy's and RecoveryPolicy's fields are
dated `ProductStoreSetting` types, validated per type; no new policy record (Nov 5, impl-commerce
§4). The forms show the carriers, payment methods and tax authorities their choices come from and
link the owners' screens.

| Form | Kind | Purpose | Highlighted fields | Widgets of note | Services | Derived from |
| --- | --- | --- | --- | --- | --- | --- |
| CheckoutPolicy | single | Define supported checkout behavior | guest/account policy, destinations, inventory/backorder disclosure, terms page, purchase contact, support queue | policy preview; queue choice from Customer Service service queues | C.store#CheckoutPolicy | ProductStore settings; Odoo website_sale settings |
| ShippingOptions | list, editable rows | Offer carrier/method choices | carrier, method, sequence, markup percent/amount | authorized choices | existing `mantle.product.StoreServices.create#StoreShippingOption`; C.store#ShippingOption | EditProductStore NewShippingOptionForm/ShipOptionsForm |
| ShippingGateways | list, editable rows | Bind approved carrier providers | carrier, gateway, account reference, insurance/customs defaults | redacted approved config selector | C.store#StoreShippingGateway | EditProductStore NewShippingGatewayForm/ShippingGatewaysForm |
| LocalRates | list, editable rows | Set a local rating rule | destination Geo group, weight/value bands, amount, currency, priority, dates | Geo group selector and simulator | C.store#StoreShippingRate | Odoo delivery.price.rule; proposed ProductStoreShippingRate |
| PaymentGateways | list, editable rows | Offer approved instruments | instrument, gateway, customer label, availability | choices limited to the store organization's enabled PaymentGatewayOrganization rows; readiness indicators | C.store#StorePaymentGateway | EditProductStore NewPaymentGatewayForm/PaymentGatewayForm |
| TaxDisplay | single | Bind tax policy and display | approved tax gateway, inclusive/exclusive display, origin | tax preview for a sample address and cart | C.store#StoreTax; existing `mantle.other.TaxServices.simulate#SalesTax` | EditStoreForm tax gateway; Odoo tax display |
| RecoveryPolicy | single | Configure eligible cart follow-up | enabled, inactivity delay, sender (built-in recovery or a Marketing automation), `PsetCartRecovery` binding, maximum sends, retention | consent/preview status | C.store#CartRecoveryPolicy | Odoo abandonment settings |
| RecurringPolicy | single | Configure supported renewal offers | product/plan, cadence, price terms, retry intervals/limit, `PsetPaymentRetry` and `PsetSubscriptionRenewal` bindings, cancellation terms | registered plan selection; off-session capability of the chosen gateway | R.store#RecurringOffer, which also keeps the site's `subscriptionUrl` (Shop §4.3) | Mantle recurring orders; Shop §10 |

Local rate matching is deterministic by explicit priority and effective dates; overlapping rules
at the same priority are refused. Bands have inclusive lower and exclusive upper bounds; rule
currency/UOM must match or use approved conversions. Gateway failure never silently selects a
cheaper rate: an explicitly configured local fallback is quoted and disclosed. No applicable
rule means unavailable delivery, not free shipping. Digital-only orders skip shipping but retain
needed tax/billing address checks.

**Zones.** A destination zone is a Geo group: a `Geo` whose members are linked by `GeoAssoc` rows
of type `GAT_GROUP_MEMBER`, as Mantle's geo data already does. A rule matches when the group is
in the address's geo set, which `mantle.party.ContactServices.get#PostalAddressGeoIdSet` returns
and the local rate service already reads (R-COM-12).

**Local rate gateway today.** Existing `mantle.shipment.CarrierServices.get#OrderShippingRateLocal`
counts items and weight but always sets `shippingTotal` to 0, so a store bound to it ships free.
The proposed ProductStoreShippingRate rules (COM-CHECKOUT) replace that stub's result; until a
store has rules, readiness blocks checkout for a store bound to the local gateway. Use the
implemented Accounting tax services or the configured external tax adapter; do not build another
tax engine here.

**Payment choices.** PaymentGateways offers only gateways in the store organization's enabled
`mantle.account.method.PaymentGatewayOrganization` rows (`isEnabled`, current from/thru); Admin
Connections owns the gateway configuration and Commerce owns only the store binding and its
selection (Z4, R-COM-08). Readiness refuses any other binding. Payment methods expose
hosted/tokenized provider capabilities, including recurring/off-session support, without
collecting raw card data; RecurringPolicy accepts an offer only when the store's gateway has the
off-session capability of the first adapter Shop §8.1 names. Readiness refuses unsupported
combinations.

**Support queue and mount (Nov 5; impl-commerce F37, F38).** CheckoutPolicy's support queue is
one of the store organization's offered queues (`SupportAppSetting.queueIds`, or else
`ServicePolicy.defaultCategoryId`), as `create#CustomerCase` accepts no other. Shop links its
return, question and cancel requests to the site's Support pages, so readiness for purchase
requires a Support mount on each of the store's sites targeting the store's organization.

**Recovery sender (Nov 5).** Until Marketing is built, RecoveryPolicy offers built-in recovery
only; the Marketing automation choice appears with Marketing's cart-abandoned trigger.

**Renewal notices.** RecurringPolicy's retry notices are payment-attempt notices sent by Shop.
Accounting's Dunning preview (`mantle.account.CollectionServices.preview#Dunning`) skips the
invoice of a renewal still in retry, so a customer never gets both (X5, R-SC-03).

**As built (Nov 6, impl-commerce P6).** CheckoutPolicy's fields are the setting types
`PsstCheckoutAccount` (either, account, guest), `PsstCheckoutDestinations` (geo ids),
`PsstCheckoutStockDisclosure` (hidden, availability, backorder), `PsstCheckoutTerms` (whether buyers
accept the site's `terms` policy page), `PsstCheckoutPhone` (the purchase contact's phone: hidden,
optional, required) and `PsstCheckoutSupportQueue`; TaxDisplay's display and origin are
`PsstTaxDisplay` and `PsstTaxOrigin` beside the store's tax gateway. An absent setting means its
default (either, any destination, availability, terms accepted, phone optional, prices exclusive of
tax). A local rate may also name a carrier and method (empty for any). A store is rated by its local
rates while one is in effect or starts later; once all have ended, the local gateway's zero applies
again. Matching takes the lowest priority, then the latest start; the overlap refusal compares rates
of the same zone id (a group and its member at one priority are not detected). An order part with
no matching rate gets no shipping item and `rateUnavailable`, and `get#OrderShippingRatesBulk` leaves
the method out. Removing a ship option, shipping gateway or payment gateway binding writes its own
audit row with the user and reason. The tax preview is `simulate#SalesTax`'s calculation for a user
who reads the store (COMMERCE_VIEW), without Accounting's read. Gateway capabilities are a table of
StoreCheckout.js by gateway type, which Shop P5 and P7 extend; they inform, and readiness blocks only
a binding the organization no longer enables. Readiness adds Payments, Delivery (a warning), Local
rates, Terms page, Support queue and Support pages, each fixed in CheckoutSettings (the Terms page and
Support pages on the store's sites).

**As built (Nov 6, impl-commerce P10).** RecoveryPolicy's fields are the setting types
`PsstRecoveryEnabled` (false until a store turns it on: nothing is sent before), `PsstRecoveryDelay`
(minutes, 15 to 30 days, an hour by default, which is also Carts' abandonment), `PsstRecoverySender`
(`builtin`, the only choice until Marketing), `PsstRecoveryMaxSends` (1 to 5, one by default) and
`PsstRecoveryRetention` (the recovery window in days, 7 by default: a cart idle longer is not
reminded, and a link stops working at its end), saved by `C.store#CartRecoveryPolicy` with
`COMMERCE_STORE_EDIT`. The `PsetCartRecovery` binding is shown and edited with the store's emails
(StoreDetail). Beside them the form edits the checkout's optional emails, `PsstCheckoutOptIns`
(none, or some of review requests, cart reminders and news) and `PsstNewsList` (a current list of
the store's organization), which before were set only by data (impl-commerce F118). A clone leaves
out `PsstRecoveryEnabled` and `PsstNewsList`.

**As built (Nov 6, impl-commerce P12).** RecurringPolicy is CheckoutSettings' Subscription offers group over
`R.find#RecurringOffers` (`COMMERCE_VIEW`, the store) and Shop P7's `R.store#RecurringOffer` (`COMMERCE_STORE_EDIT`):
the store's offers, current first; New offer (a paid-access product of the assortment, name, price, automatic
renewal or a prepaid term, terms version, retry days), Change (a new offer row, contracts keep theirs) and End;
whether the store's gateway charges a kept card off-session, its `PsetPaymentRetry` and `PsetSubscriptionRenewal`
emails (set in the store's emails) and the subscriptions readiness (each Shop site's address, an outside one
named). Cancellation terms are the offer's terms version; the cancellation rule itself is fixed (end of the
paid term).

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
configuration and tools SystemMessage/Remote.

**EDI trading partners (R-COM-11).** An EDI channel is a store with the `ScEdi` sales channel and
an EDI SystemMessageRemote, as the Mantle [payments plan](../../mr-mantle/plan/payments-shipping-edi.md)
E1–E2 deliver it (an inbound 850 becomes a sales order through SPS Commerce). Commerce owns
trading-partner intake exceptions for that store: Integrations lists the partner remote, and
IntegrationDetail shows its rejected or quarantined transactions with the same retry and
replay rules as any other channel. Sales owns the trading partner as a customer, its agreements
and pricing. **Needs:** COM-CHANNEL.

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

Retry reuses the message/business identity, and I.retry#StoreMessages is registered with Admin
§14 as an operational recovery action, so Admin offers the same retry with the original
operation identity (Z9). Incoming order deduplication is by store, remote, message kind and
external ID, not external ID alone. A conflicting replay is quarantined with
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
spreadsheet-to-entity mapping. Partial success is durable and visible. ChannelImport is an
owner wizard registered in [Admin §11's import targets](design-admin.md#111-shared-transfer-contract)
(Commerce, channel orders): it keeps its own wizard and its SystemMessage batch and provides `get#`
for its runs; there is no second import batch (Z2). **Needs:** COM-CHANNEL.

**As built (Nov 6, 2026; impl-commerce P13).** A binding is a SystemMessageRemote with the store and a registered
connector (`mantle.product.store.StoreChannelConnector`: `ChannelOrders`, the API's and ChannelImport's channel orders, and
`EdiX12`, an EDI partner whose EdiConnection names the store), with a mapping version and typed parameters (the customer
orders are placed for, the sales channel). The operator sets its endpoint authentication and credentials in the System
tools; Commerce shows only whether they are set. A new binding starts with its intake stopped and is enabled only with an
authentication method, credentials and a complete mapping; ChannelImport works through a stopped binding. Each channel order
is its own SystemMessage, kept by the four keys (`productStoreId`, `systemMessageRemoteId`, `docType`, `messageId`) with its
canonical content's hash: a replay is kept as a duplicate answering the original's order, a conflict kept rejected with the
fields that differ. Orders are placed (not approved) at the channel's prices with shipping and tax as items, each line a
product the store sells. A ChannelImport batch is a SystemMessage of its own, Staged until committed against the digest of
its preview, with its reason recorded; its orders go through the API's receive and consume services. Retry
(`retry#StoreMessages`) takes a reason and an operation key and runs each message or EDI document in its own transaction
with its identity. IntegrationDetail's Assist prompt is "Group these failures by cause", with the channel-retry skill.

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
endpoints, never arbitrary request URLs. One registered destination kind is the store's own Shop
site: Shop serves the active build at a reserved feed path under its mount, checked against the
current publication generation (Nov 5, impl-commerce P14; Shop §13.2).

Only the Shop public catalog projection supplies data. A build reports skipped independent
products and the reason; a fatal build leaves the previous complete artifact active. Withdrawal
immediately invalidates an artifact containing withdrawn products: serving the old artifact is
blocked until a safe replacement is ready. A rebuild must not resurrect content withdrawn after
its snapshot. **Needs:** COM-FEED, SHOP-CATALOG, SHOP-RENDER.

**As built (Nov 6, 2026; impl-commerce P14).** `ProductStoreFeed` (Mantle `entity/StoreFeedEntities.xml`) is a feed of
a store bound to one of its Shop sites, a registered format (Google Merchant RSS, CSV, JSON) and destination (the Shop
site only; a pushed destination registers with its connector), with a category scope, image and out-of-stock policy and
a schedule; its locale and currency are the store's, the only ones Shop's projection sells in. It is current from
`fromDate` until `thruDate` (ending it stops serving) and changed in place at its revision with its key fields
audit-logged and a reason, not as dated rows: a change of site, address, format or category clears the active build.
`ProductStoreFeedBuild` is the immutable build (complete with its artifact, digest, generation, row products, skips and
errors, or failed with its reason). The feed path is `feeds/{key}.{xml|csv|json}` under the Shop mount (`feeds` joins
PublicApps.js `reservedPaths`), answered no-store; once the site's generation has moved past the build's, the build's
products are resolved again and any one no longer public blocks it (remembered per build and generation). Publishing
takes an operation key and the feed's revision. The feed job publishes only a complete build with no errors; one with
errors waits for the operator. A virtual product is one row (its lowest public variant price), not one row per
variant. ChannelHealth reads the stores' SystemMessages through `SystemMessageRemote.productStoreId` (counts only),
and Home's Integration errors card is its attention total for a channel operator.

## 10. Shared screen contexts

**Shared maps (proposed, CX-MAPS):** store/pickup facilities, readable Customer360 addresses and transaction address
blocks reuse [crosscut §3.32](design-crosscut.md#332-maps-and-record-location-dialogs). View the selected address or
coordinate in the framework dialog, with full-screen Maps available for context. Postal-area fallback is approximate;
choosing a point never bypasses store, party or order-change authority. Publishing a pickup map to PASS requires an
explicit public projection and approved basemap profile; it does not expose the staff layer or customer addresses.

**Context passed blocks, collected.** Each row below is the **Context passed** block (guide §7)
for the matching §2 screen; they are gathered in one table rather than repeated under each
area because every mount shares the same common context. Definitions stay with their owner.
`appRoot=Commerce`, authorized organization/store and `sharedLinks` are common; request
parameters cannot expand scope. Sharing a screen requires the record's view permission, not that
other app's launcher grant. Use the same header and restricted-field projection. `Shared/Pages`
and `Shared/PageDetail` are Commerce's own definitions; their per-app context is in §5.

| Screen / Commerce mount | Owner | Tabs, fixed filters and action set | Emphasis |
| --- | --- | --- | --- |
| Product360, `Commerce/Merchandising/Product360` | crosscut §3.5 | store/organization fixed; overview, variants, category membership, content, store prices, availability, reviews/publication link, Paid access (§4, the one ProductSubscriptionResource editor, X16); content forms offer the inline text actions and "Draft from record" (§1.4); writes require the owning catalog/price permissions | published assortment, customer-facing content and what a purchase grants; no costs without cost view |
| CategoryDetail and CategoryContent, `Commerce/Merchandising/CategoryDetail[/Content]` | Products §5 (CategoryDetail made `Shared/CategoryDetail`, Nov 5) | category/store fixed; existing category identity, slug and content forms; publication goes through Merchandising | show shared-category impact before changing a taxonomy |
| Documents and DocumentDetail, `Commerce/Merchandising/Documents[/DocumentDetail]` | Products §9 | store/product context; existing content types, files and translations; public approval is an explicit separate binding | safe images, descriptions, SEO and authorized downloadable assets |
| PriceLists, PriceListDetail and PriceExplain, `Commerce/Merchandising/PriceLists[/PriceListDetail]`, `Commerce/Merchandising/PriceExplain` | Products §7 | sales direction, store/internal seller fixed; selected buyer, date, quantity/UOM/currency; authorized list edits and explanation | storefront price provenance; promotions/tax shown as separate stages |
| InventoryAvailability, `Commerce/Merchandising/InventoryAvailability` | crosscut §3.7 | selected product, store facilities; read-only availability | customer promise/backorder policy; stock movements stay Warehouse actions |
| OrderDetail, `Commerce/Orders/OrderDetail` | crosscut §3.6 | sales orders in permitted stores, recurring bases only from SubscriptionDetail; overview/items/payments/shipments/invoices/chatter; normal place/approve/hold/cancel actions only with domain grants; `OhtPayment` hold banner read-only with a link to Accounting, which releases it (X4); open cancellation proposals link Customer Service's OrderChangeDetail (X7); "Order again" clones into a new open order with `mantle.order.OrderServices.clone#Order` (`copyPayment=false`), then reprices on the shared order form (R-COM-W04) | payment/fulfillment and intake references; active checkout is not a staff-editable draft |
| ReturnDetail, `Commerce/Orders/ReturnDetail` | crosscut §3.18 / Customer Service | source-order store fixed; authorization/receipt/settlement projections; no Commerce actions | refund and replacement progress; no parallel return workflow |
| Customer360, `Commerce/Customers/Customer360` | crosscut §3.2 | permitted store relationships, PASS account status (verified email, self access, X6), addresses and masked payment labels, carts/orders/subscriptions, store cases and returns; "Order again" on a past order as on OrderDetail | verified account linkage, consent and online history; no password editing or impersonation |
| RequestDetail, `Commerce/Customers/RequestDetail` | Projects §6 / crosscut §3.11, Customer Service case context | store cases; read, internal note and Open in Customer Service; assignment, replies and resolution stay in Customer Service (X7) | the source order or product and the case's SLA; public replies are Customer Service's audience-checked actions |

Warehouse's Carriers and Accounting's PaymentMethods and TaxAuthorities are their owners' editors,
not shared screens, so Commerce links them from CheckoutSettings for a user who may open them and
shows the choices they supply in its own forms; it mounts none of them (Nov 5, impl-commerce F6).
Chatter, record files, common contact selectors and the dashboard are existing shared components,
not new Commerce screen definitions. Product reviews are not staff Chatter. Billing/InvoicePay
may be linked through the authorized PASS Billing mount, never an internal Accounting URL.

## 11. Automation and operations

### 11.1 Existing automation disposition

Shop §8 specifies checkout ordering and reconciliation. The following source-verified rules are
part of that design, including their behavior without BOSS. The subscription guard is a proposed
Mantle change, not a BOSS-only wrapper. Existing Accounting flags remain effective. Each row
belongs in the crosscut §1.3 register.

| Rule / source | Disposition on Commerce/Shop paths |
| --- | --- |
| `OrderPlacedAuthorizePayments`, AccountingPayment.secas.xml | Kept. `authorize#OrderPayments` already skips Authorized payments; the proposed guard skips only a Promised payment that has an unresolved attempt, whose key is its `PaymentGatewayResponse.operationKey` (X9, R-SHP-08). |
| `OrderPlacedAutoApprove`, OrderReturn.secas.xml; `OrderPreApproveCredit`, AccountingCredit.secas.xml | Kept: store delay, pre-approval checks and credit holds. `autoApprove#Order` already refuses without authorized payment covering the grand total, so the Shop pre-approve check applies only to manual `approve#Order`, which runs `check#OrderPreApprove` (X4), and to an attempt in an unknown state. |
| D7 `OrderHold`/`OrderHoldReason`, OrderHoldEntities.xml | Extended: proposed `OhtPayment` hold type, whose `enumCode` names an Accounting payment-operator release permission. Placed when a capture fails or a chargeback arrives after placement, released by Accounting; Commerce shows it (X4). There is no `OhtStock`: stock lost after placement is Warehouse's reservation or backorder fact. |
| `OrderPlacedReserveAssets`, `OrderApprovedReserveAssets`, `OrderItemCreateCheckReserve`, `OrderItemUpdateCheckReserve`, ProductAsset.secas.xml; `OrderItemHandleChange`, entity/Order.eecas.xml | Kept for reservation and line-change ownership; enforce the configured reservation moment and refuse public edits once checkout freezes the order. Conditioned: none runs for a RecurringTemplate base order (X5). No parallel Shop reservation ledger. |
| `OrderPlacedSendEmail`, `OrderApprovedSendEmail`, `OrderApprovedNotify`, OrderReturn.secas.xml | Kept as authoritative status events, delivered through the Comms ledger with idempotent keys (X8). Conditioned: none runs for a RecurringTemplate base order (X5); `OrderApprovedSendEmail` does not run for an order whose parts are all digital or subscription items (Shop §8.3). |
| `ShipmentShippedSendEmail`, `ShipmentDeliveredSentEmail`, Shipment.secas.xml | Kept for physical parts; a digital part has no shipment, so they never run for it. |
| `InvoiceFinalizedSendEmail`, AccountingInvoice.secas.xml | Kept. It is the receipt of a digital or subscription purchase, whose invoice finalizes when the item is fulfilled (Shop §8.3). |
| `ShipmentOutgoingPackedCreateInvoices`, `ShipmentShippedFinalizeInvoices`, AccountingInvoice.secas.xml | Kept for physical items with their organization-specific pack/ship invoice and capture behavior. Digital items in their own order part are invoiced by `mantle.account.InvoiceServices.create#InvoiceFromSource` on the ordered basis (R-SC-07). |
| `OrderApprovedFulfillSubscriptions`, ProductSubscription.secas.xml | Conditioned for Shop paid digital/subscription items: prepare invoice/settlement once and activate resources only after required payment is settled. Current code fulfills before applying/capturing payment, so it is not sufficient unchanged. It already skips recurring bases. |
| ServiceJob `create_RecurringOrders` (`mantle.order.OrderServices.create#RecurringOrders`), MantleSetupData.xml | Kept, with owners per X5: Sales owns the worker guards and recurrence fields (SAL-RECURRENCE), Shop dispatches Shop-linked bases to its occurrence coordinator, and Accounting monitors it and owns the auto-invoice right. Renewals clone with `copyPayment=false`. |
| Proposed refund and chargeback SECA | New Mantle SECA on Payment refund and return-item settlement, and Accounting's chargeback intake, calls Shop's `reconcile#RefundedItem` (X5). |
| Proposed `OrderPlacedRecordAttribution` (tx-commit) | New Mantle SECA calling Marketing's `record#OrderAttribution` for store orders (X10). |
| `RequestTriageNotice`, entity/Request.eecas.xml | Kept for Customer Service cases filed by a Shop customer; Customer Service's queue rules decide who is told. Commerce files no plain Request. |
| `ReturnApprovedProcess`, OrderReturn.secas.xml | Conditioned per D11, behind Accounting's flag: it keeps only `create#ReturnShipment`, and responses are settled by Accounting's `settle#Return` (R-SC-08). |
| `ShipmentDeliveredReturnReceive`, `ReturnReceivedProcess`, OrderReturn.secas.xml | Replaced per D11, behind the same flag, by Warehouse's proposed `receive#ReturnItems` (R-SC-08). Public intake cannot trigger automatic financial responses. |
| AccountingLedger.secas.xml posting rules; `PaymentApplyForInvoice`, AccountingPayment.secas.xml | Kept: native invoice/payment/application posting. Shop creates no parallel payment, invoice or GL ledger. |

### 11.2 Jobs and observability

Add scoped jobs for recovery eligibility/delivery, checkout reconciliation/expiry, recurring
occurrences and retry, scheduled publication, feed builds, and connector work. Each independent
store/cart/message/renewal gets its own transaction and outcome; log the record identifier and
safe reason code, then continue. Fail strictly on authorization, money integrity, conflicting
idempotency keys or invalid publication state. Expected failed provider probes use the framework
isolated transaction/error-stack pattern, not merely clearing errors on a poisoned transaction.

Commerce worklists expose pending age, unresolved provider outcomes, payment holds, delivery
failures (read from the Comms ledger), renewal retries, blocked publication and stale feed
generation. These measures are the shipped report definitions and alert templates of §1.4, not a
separate measures list (L6); each job declares `operation` and `operation-ref`, so its runs show
in the framework Monitor. Store readiness and message retry are registered with Admin §14 and
Home's work counts with Insights' attention provider (Z9). Correlation IDs connect checkout,
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
existing owner mapping, with Commerce mounts added for consumed forms/services. Every screen of
the research candidate inventory (research §12) is a §2 row, including the staff "Order again"
on Customer360 (§10). The research open questions and candidate dispositions are answered in
§16 Decided.

### 12.2 Acceptance scenarios

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
13. A Shop customer asks a question, requests a return and asks to cancel. Commerce Requests
    shows the case in the store's queue, Returns shows a ReturnHeader in ReturnRequested, and the
    order shows a cancellation proposal; each is worked in Customer Service, and Commerce takes
    none of their actions.
14. A capture fails after placement: the order carries an `OhtPayment` hold that Commerce shows
    and cannot release; an Accounting payment operator releases it. A refund of a paid-access
    item revokes only that source grant.
15. Reports for one store agree with Sales' `orders.placed` and Accounting's
    `revenue.invoicedNet` for the same window; recurring bases and open carts are never counted.

## 13. Documents and outputs

| Output | Kind | From screen | Derived from |
| --- | --- | --- | --- |
| Store readiness/configuration summary | authorized CSV/print (built Nov 7, impl-commerce P15: StoreDetail's More menu over `mantle.product.StoreAdminServices.get#StoreSummary`) | StoreDetail | grouped store settings; redact credentials |
| Order confirmation, invoices, delivery and return documents | existing email / html-print / PDF | OrderDetail, ReturnDetail | owning Order/Accounting/Warehouse services and store email bindings |
| Cart recovery, subscription and review-request notices | consent-checked email | CartDetail, SubscriptionDetail, Reviews | ProductStoreEmail (`PsetCartRecovery`, `PsetPaymentRetry`, `PsetSubscriptionRenewal`, `PsetReviewRequest`) + registered EmailTemplate, sent through the Comms delivery ledger (X8) |
| Store reports | report screen, CSV, scheduled PDF through Insights | OnlineSales, CartRecovery, PromotionUse, ChannelHealth | registered `report/*.json` definitions over SalesReportServices and the proposed store summaries |
| Store operations dashboard and alerts | shipped dashboard and alert templates | Home; Insights | Commerce `report/*.json` (§1.4) |
| Theme package and release manifest | bounded archive + JSON | ThemeDetail | exact resource revisions/digests; no secrets/customer data |
| Published shop pages/navigation | HTML / release snapshot | PageDetail, Navigation | versioned WikiPage and theme package |
| Channel import results | row-level CSV/result list | ChannelImport | SystemMessage outcomes |
| Product feed | registered XML/CSV/JSON format | FeedDetail | authorized Shop projection and last complete eligible build |
| Operational lists | permission-filtered CSV | Orders, Carts, Reviews, Subscriptions | same query/projection as the screen |

## 14. Framework and data needs

All rows below are **proposed additions/extensions**, even where their substrates exist. Needs
lines also cite Shop's `SHOP-*` rows ([Shop §15](../../mr-pass/plan/design-shop.md#15-framework-and-data-needs)),
which Commerce uses without redefining, and crosscut rows (CX-DELIVERY for delivery, X8).
Commerce's stack contributions (§1.4) use built framework features and add no needs row.

| Need | Kind | Proposed as | Used by | Stub spec |
| --- | --- | --- | --- | --- |
| COM-ACCESS | service type, seed data | scoped Mantle permissions and BOSS ContextServices | all screens, exports, choices | Organization/store scope, explicit view permissions, restricted-field omission, expected revisions; independent of launcher groups; `BOSS_COMMERCE_ADMIN` keeps its existing root grant |
| COM-STORE | service type, seed data | StoreAdminServices over ProductStore and existing children | Stores, StoreDetail, StoreGroups | Guarded named writes; effective settings, safe clone, typed validation parameters; host mounts stay operator-owned; reservation fields read-only (Warehouse WH-POLICY edits them); `check#StoreReadiness` registered as an Admin §14 readiness provider; seed `PsetCartRecovery`, `PsetSubscriptionRenewal`, `PsetReviewRequest` |
| COM-MERCH | data model, service type | StoreMerchandisingServices; ProductStoreProduct made an effective-dated association carrying the publication kind, template, badge and featured rank (Nov 5); review fields with decisions in the audit log | Merchandising, StoreCategories, Reviews | Effective publication and catalog predicates, a virtual product's publication covering its saleable variants with per-variant withdrawal rows, tree conflict/cycle checks, review decisions with actor/reason/history, merchant reply text/actor/time (`reply#Review`); public contract SHOP-CATALOG |
| COM-THEME | Vue component, service type, data model | Commerce ThemeEditor/TemplateEditor and TUI counterparts; Mantle ThemeServices; `Shared/Pages` and `Shared/PageDetail`; `PublicSitePage` extension and `PublicSiteNavigation` | Website screens; Marketing landing pages | One staff authoring surface over SHOP-THEME; schema forms, exact preview, compare, publish, rollback; PublicSitePage gains mount, route, locale, window, template and SEO with role optional, served by `get#SitePage`/`publish#SitePage`; no `PublicShopPage`; no public editor API |
| COM-OPS | data model, service type, seed data | StoreOperationsServices; recovery policy/settings | Home, orders/carts/customers/requests/returns | Paginated safe reads excluding RecurringTemplate orders; payment-hold worklist; store-filtered views of Customer Service cases and returns; real cart activity, consent and send limits, exact template preview; recovery messages are sources on the Comms delivery ledger (CX-DELIVERY), with no Commerce delivery entries |
| COM-PROMO | service type | StorePromotionServices and shared screens | Promotions/codes | Registered algorithms, scoped CRUD, effective dates, atomic committed redemption limits; no new pricing resolver |
| COM-CHECKOUT | data model, service type | ProductStoreShippingRate and typed checkout settings (dated `ProductStoreSetting` types, Nov 5); extend local rating | CheckoutSettings | Geo-group destination zones, weight/value bands and dated priorities, scoped simulation; replaces the zero result of `get#OrderShippingRateLocal`, and readiness blocks a store bound to it with no rule; gateway choices only from enabled PaymentGatewayOrganization rows; tax preview over `simulate#SalesTax`; support queue choice; errors never become zero rates |
| COM-CHANNEL | service type, data model | StoreChannelServices; durable import/mapping batch metadata | Integrations, ChannelImport | Approved remotes/types including EDI (`ScEdi`) partner remotes, canonical deduplication, per-row results, bounded retry; use SystemMessage; `retry#StoreMessages` registered as an Admin §14 recovery action; ChannelImport registered as an Admin §11.1 import target (owner wizard) |
| COM-FEED | data model, service type | ProductStoreFeed and feed-build metadata | Feeds/FeedDetail | Registered formats, public projection, immutable artifacts, generation-aware publication and immediate withdrawal invalidation |
| COM-SUBSCRIPTION | service type | Staff context/actions of ShopSubscriptionServices; `R.store#ProductSubscriptionResource` | Subscriptions; Product360 Paid access | Store-scoped lifecycle controls; shared authoritative contract/occurrence/payment records; the one ProductSubscriptionResource editor, with resources limited to registered handlers; no staff card entry |
| COM-REPORTS | service type, seed data | Commerce report definitions (`report/*.json`) and store summaries `O.get#CartRecoverySummary`, `P.get#PromotionUseSummary`, `I.get#ChannelHealth`; Insights registration | Home, Reports | Orders and net sales read Sales' and Accounting's registry metrics through `SalesReportServices`: `get#SalesOrderSummary` and `get#SalesInvoiceSummary` with `productStoreIds`, and `get#SalesTopProduct` with a proposed `productStoreIds` filter, each answering `COMMERCE_VIEW` for the user's stores beside `ACCOUNTING_VIEW` (Nov 5); cart, recovery, promotion and channel summaries are Commerce's metrics; shipped dashboard and alert templates; definitions registered with Insights (Z10) and the attention provider (Z9) |

Proposed supplemental records use sequenced IDs, explicit relationships, typed enums/status
flows, audit fields and service guards. Theme release IDs/content digests are not surrogate
versions of ordinary business rows.

## 15. Delivery stages

**Dependencies:** C1 requires COM-ACCESS/STORE/MERCH and Shop S1's routing, public projection,
resource/renderer limits and immutable publication contract; the existing Products editors are
reused. Theme authoring cannot pass its gate before actual Shop preview/rendering works. C2
depends on C1 plus Shop S2's payment-attempt guards and settled digital fulfillment, Accounting's
typed payment-attempt coordinator (X9), native Warehouse/Accounting configuration, Customer
Service's case and return services (X7), the ExternalAccess `SalesOrder` record kind (X6) and the
Comms delivery ledger (X8). C3 depends on C2 plus Shop S3's occurrence coordinator, the
RecurringTemplate marker and refund hook (X5) and source-bound entitlement expiry; S3, and so C3,
is gated on the first adapter with off-session charges (Shop §8.1). C4 depends on the same catalog
generations and idempotent order intake; connector development may proceed earlier, but
deployment waits for those contracts. Shop §17 lists the matching customer-facing gates.

| Stage | Deliverable | Release gate |
| --- | --- | --- |
| C1 — stores, catalog and authoring | Scoped stores/groups, explicit assortment, Products mounts, visual/source theme editors, shared pages/navigation, publication and preview | Permission/TUI checks; draft/live isolation; a published browseable Shop in local and remote mode; no purchase advertised before C2 |
| C2 — checkout operations | Orders/carts/customers, store views of returns and cases, promotions, checkout settings, review moderation and replies, recovery; OnlineSales, CartRecovery and PromotionUse reports; Shop physical/digital checkout | Idempotent payment/placement, shared-rule audit, safe guest access, shipment/digital acceptance, consent-aware delivery, report totals equal the owners' metrics |
| C3 — recurring commerce | Paid access editor, offers, contracts, renewals, notices, cancellations, failure recovery, entitlement reconciliation | Shop paid-access lifecycle, no duplicate occurrences/charges, no charge without off-session consent, expiry/revocation and operator recovery |
| C4 — channel completion | Connector bindings including EDI partners, registered import, feeds, ChannelHealth report and diagnostics | Replay/partial failure tests, withdrawal-safe feeds, dashboard totals reconciled to authoritative records |

C1–C4 together are the complete initial design scope; recurring commerce and the visual editor
are not postponed to an unspecified second release. impl-commerce §1 orders the build of both
apps' phases within these stages and their shared gates (Nov 5). External provider adapters are installed
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
| Promotion screen ownership | §7 is the first canonical shared store-promotion definition; Marketing §7 mounts it with campaign links; no global-program schema now |
| Shared configuration | Existing domain owners retain forms; Commerce manages store-specific choices; credentials stay Admin/operator controlled |
| Sales breadth | Physical, digital, prepaid and automatic recurring purchases; payment/fulfillment extensions explicitly part of initial scope |
| Recovery and visits | Recovery requires explicit enablement and eligible consent; visit metrics are optional and exclude preview/test activity |
| Financial effects | Existing native order/payment/invoice/stock posting paths, with narrow documented checkout/subscription guards; no duplicate ledgers or webhook grants |
| Compatibility | Legacy store data is adopted through a preview; no automatic publication, host migration, FTL/Vue-2 execution or rewrite of existing orders |
| Research §12: landing and period strip | Home with action cards and a period strip of the owners' registry metrics (orders, net sales, visits, conversion), opening the Reports area; no Commerce visit collector |
| Research §12: stores, domains and templates, facilities, staff, emails and checks, cloning and groups | Stores, StoreDetail and StoreGroups; domains use existing PASS host/mount ownership; templates use §5 |
| Research §12: category tree, assortment, Product360, reviews, content spaces | Merchandising, StoreCategories and Reviews plus shared Products screens; public content is version-bound |
| Research §12: orders, carts, returns, Customer360 and requests | §6 and §10; ordinary orders exclude carts and recurring bases; dedicated cart worklists; returns and requests are store views of Customer Service's records |
| Research §12: promotions across stores | Store-scoped existing records; explicit copy with independent limits; cross-store programs later |
| Research §12: shipping, payment, tax and availability | CheckoutSettings and owning-domain mounts; local rating rules are a proposed Mantle extension over Geo groups |
| Research §12: integrations and marketplace intake | §9; reusable message pipeline, registered connectors, per-item results, EDI partners as a channel |
| Research §12: feeds, ribbons and publication | Feed records/builds; simple store badge text; explicit product publication metadata |
| Research §12: gateway editing ownership | Owner screens remain canonical; Commerce only store bindings, approved choices and read-only mounts |
| Research §12: storefront ownership | IronStone Shop in PASS; full public design in design-shop.md |
| Research §12: checkout steps and sessions as data | Shop has a fixed validated core flow, configurable presentation and durable coordination; no merchant workflow engine |
| Research §12: POS | ScPos remains a valid channel; terminal, till/session, offline hardware and POS screens are later |
| Payment holds (Nov 1, 2026; review X4) | A payment exception after placement is an `OhtPayment` hold, shown in Commerce and released by an Accounting payment operator; no `OhtStock` |
| Recurring model (Nov 1, 2026; review X5) | Recurring bases carry Sales' RecurringTemplate purpose and are excluded from Commerce order lists, credit, store email and reservation rules; renewals clone with `copyPayment=false` and charge only with recorded off-session consent; Sales owns worker guards and recurrence fields, Shop dispatch, Accounting monitoring and the auto-invoice right; Dunning skips renewals in retry; refunds, return settlement and chargebacks call Shop's `reconcile#RefundedItem` |
| Customer access (Nov 1, 2026; review X6) | Cart recovery tokens belong to session-bound StoreCartAccess and reuse the ExternalAccess capability digest and throttle; order, download and renewal links are the `SalesOrder` record kind; Customer360 shows the customer's PASS account and self access |
| Customer requests (Nov 1, 2026; review X7) | Returns are ReturnHeaders from `request#CustomerReturn`, questions are cases from `create#CustomerCase` in the store's queue, cancellations are `save#OrderChange` proposals; Commerce Requests and Returns are store-filtered views; §11.1 takes the D11 return verdicts |
| Delivery (Nov 1, 2026; review X8) | Recovery, renewal and review-request messages are sources on the one Comms delivery ledger; Commerce keeps no delivery entries |
| Payment attempts (Nov 1, 2026; review X9) | Commerce worklists read Accounting's typed PortalPaymentAttempt coordinator; a recurring offer needs the first adapter's off-session capability |
| Visits and attribution (Nov 1, 2026; review X10) | Visits and conversion come from Marketing's tracking on the authority; attribution at placement is Marketing's SECA |
| Metric owners and Reports (Nov 1, 2026; review X11, Z10) | Orders are Sales', invoiced revenue Accounting's, visits Marketing's, the funnel Insights'; Commerce has a Reports area over `SalesReportServices` with `productStoreIds` and registers its reports with Insights |
| Site pages (Nov 1, 2026; review X14) | `PublicSitePage` and `get#`/`publish#SitePage` are extended; no `PublicShopPage`; Pages and PageDetail are `Shared/` screens with Commerce and Marketing contexts |
| Identity hygiene (Nov 1, 2026; review X15) | Recovery mail links the one PASS Account email preferences page; duplicates merge through Commons' guarded `merge#Parties`; the store privacy provider Shop registers answers privacy requests for store records |
| Ownership (Nov 1, 2026; review X16) | Commerce's Product360 context owns the ProductSubscriptionResource editor; Warehouse StoreReservation is the one reservation editor and Commerce shows those fields read-only |
| Imports (Nov 1, 2026; review Z2) | ChannelImport is an owner wizard registered in Admin §11's import targets (channel orders); it keeps its own wizard and SystemMessage batch |
| Gateway choices (Nov 1, 2026; review Z4) | Commerce offers only the store organization's enabled PaymentGatewayOrganization rows; Admin Connections owns gateway configuration |
| Readiness and attention (Nov 1, 2026; review Z9) | `check#StoreReadiness` is an Admin §14 readiness provider, `retry#StoreMessages` a registered recovery action, and Home's work counts an Insights attention provider |
| Stack contributions (Nov 1, 2026; review L1, L6, L7, L8) | Assist prompts, response actions and built inline text actions for product copy; `call-context` with open orders and carts; shipped report definitions and alert templates; video help later through an Event with a CallLink (§1.4) |
| EDI channel (Nov 1, 2026; R-COM-11) | Commerce owns trading-partner intake exceptions for an `ScEdi` store; Sales owns the partner relationship |
| Variant publication (Nov 1, 2026; R-COM-14) | A virtual product's publication covers its saleable variants; withdrawal is per variant |
| Merchant reply to reviews (Nov 1, 2026; COM-F03) | Reviews has a public store reply and a post-purchase review request email |
| One Subscriptions list with a Sales context (Nov 1, 2026; review R-SAL-13) | Sales mounts Commerce's Subscriptions with the store optional, so storeless subscriptions from native sales orders appear; `R.find#StoreSubscriptions` takes the store as an optional filter (§6). |
| One recovery sender per cart (Nov 1, 2026; review R-MKT-R03, X8) | Cart abandonment is one shared trigger event; RecoveryPolicy names the sender, built-in recovery or a Marketing automation, and the delivery ledger deduplicates by cart and recipient (§6). |
| Gift cards and click and collect (Nov 5, 2026; the user's call, impl-commerce §4) | Later, not in the first build, though §17 recommended gift cards in C2. When built: gift cards and store credit as a checkout payment method over the existing financial-account gateway (`FinancialAccountType` GiftCard and CustomerCredit, `PmtGiftCard`, `authorize#FinancialAccountPayment`), a gift-card product that issues an account (no service does today) and Customer Service refunds to store credit, Accounting owning the liability; click and collect as a pickup ship option per store facility over `ShMthPickUp` and ProductStoreFacility, with per-facility availability in Shop, a Warehouse pickup task and a ready-for-pickup notice |
| Code check (Nov 5, 2026; impl-commerce F1–F36) | Store staff are dated `StoreStaff` ProductStoreParty rows (§1.1); publication is a dated ProductStoreProduct and store text the store's ProductContent (§4); review decisions live in the audit log (§4 Reviews); promotion limits are rechecked under lock at checkout and placement (§7); checkout and recovery policies are dated ProductStoreSetting types (§8); CategoryDetail becomes a shared screen, and Carriers, PaymentMethods and TaxAuthorities are linked, not mounted (§2, §10); readiness serves StoreDetail and Shop's PASS readiness until Admin's registry exists (§3); the store sales summaries answer `COMMERCE_VIEW` for the user's stores (§3). |
| Plan review (Nov 5, 2026; impl-commerce F37–F45 and §4) | Navigation is the merchandiser's (`COMMERCE_MERCHANDISE`) and feed publication the channel operator's (§2); promotion limits, every limit field, are enforced under lock at any store order's placement, a deliberate change to Mantle's default (§7); recovery consent is the store's "cart reminders" topic (§6); reviews take scanned images (§4); CheckoutPolicy's queue is an offered one and purchase readiness needs the site's Support mount (§8); the Shop-site feed destination (§9); Product360's paid access is C3 and InventoryAvailability C1 (§2) |
| Orders, carts and customers as built (Nov 6, 2026; impl-commerce P8) | The detail screens sit flat under their area (`Commerce/Orders/CartDetail`, `Orders/ReturnDetail`, `Customers/RequestDetail`, §2 changed), as P7's promotion screens. Orders' Attention filter adds stuck Shop placements (a placementPending checkout refused ORDER_CHANGED or past its tries: still an open order, opened as a cart, read only) and orders whose notice on the delivery ledger was not delivered; Unpaid is the computed payment state (held, paid, authorized, promised, no charge, unpaid). A cart is abandoned an hour after its last shopper activity with no live checkout until P10's RecoveryPolicy sets the store's delay; a cart staff made (Order again) has no shopper activity. Requests are cases by the case's store, linked to a store order or in the store's checkout support queue; a product link alone does not make a case the store's, as a product is not one store's. Customer360 in Commerce is one page, not tabs. Order again needs `COMMERCE_ORDER_VIEW` and makes an open order only (nothing placed or charged). A delivery exception is read in Commerce; its resolution stays `MESSAGE_DELIVERY_REVIEW`'s |
| Cart recovery as built (Nov 6, 2026; impl-commerce P10) | RecoveryPolicy is five dated settings (on, delay, sender, most sends, window) with the checkout's optional emails and news list beside them (§8, F118); nothing is sent until a store turns it on. Only a signed-in account's cart with the store's cart reminders topic and a verified email is reminded, once per visit to the cart (the event is the cart and its last activity) and at most the policy's sends; a completed checkout or the shopper's return suppresses a queued one. The link's one-time token is the cart access row's, made at each send and spent by the cart's own signed-in account on Shop's Recover page, which rotates the cart's capability into that session and reprices it (§6) |
| Reports and Home as built (Nov 6, 2026; impl-commerce P11) | The period of Home and the reports is a calendar day, week, month, quarter or year (this month by default) holding a chosen day, in the user's zone, against the one before, as Mantle's summaries bucket them; ReportScope is store, period, that day and currency (no store-group or free compare-period choice yet). Orders are `get#SalesOrderSummary`'s placed orders and net sales `get#SalesInvoiceSummary`'s invoiced product lines less discounts, read per store and per currency (a row per currency, never added across currencies), with `get#SalesTopProduct`; a Commerce reader without `ACCOUNTING_VIEW` is answered for stores of their scope, costs withheld (F21). Home's PeriodStrip is every Commerce user's and reads the same totals as OnlineSales; its cards open OnlineSales for a user of Reports. CartRecovery's cohort is the Shop carts opened in the period: abandoned (sent a reminder, idle past the store's delay in no live checkout, or recovered), signed in (the only carts a reminder may reach; consent is per send), sends (a suppressed one left out), delivered, recovered (the link used after the latest send and the order placed) and its value. PromotionUse counts placed orders' uses by promotion, code and currency with the orders' net sales and the uses left of a total limit. The report definitions shipped are two datasets (Shop checkouts and store payment attempts) beside Mantle's sales orders, the Store operations dashboard and the checkout-failure and unresolved-payment alerts; carts, recovery sends and promotion use are Commerce screens only for now. The graph views of §3 are not built |
| Integrations and channel import as built (Nov 6, 2026; impl-commerce P13) | Bindings are store SystemMessageRemotes of registered connectors (ChannelOrders, EdiX12); credentials and endpoint authentication stay the operator's and are never shown; a new binding is stopped until they are set. Channel orders are deduplicated by store, remote, kind and external ID over a canonical hash (a replay answers the original, a conflict is quarantined with its evidence and never retried); each order is its own message and transaction, placed for the binding's customer at the channel's prices. ChannelImport's batch is a Staged SystemMessage committed by its preview's digest with a reason, through the API's connector path. "Log as note" files an Assist answer as an internal order note (§1.4). Home's integration card is P14's |

## 17. Open

Decisions X4–X16 of the Nov 1 review settled the paid-access editor, Reports, site pages and the
reservation editor (§16); gift cards and click and collect are later (§16, Nov 5). Provider credentials, enabled currencies/destinations, brand assets and
business-specific policies are deployment data selected through the defined forms. These remain
open:

| Question | Recommendation | Why |
| --- | --- | --- |
| Git-backed themes (R-COM-L01, M) | Later: a theme package on `git://` publishes from an approved merge request and a release pins the commit; TemplateEditor stays for small edits | The first release's draft, validation and immutable release flow works on `dbresource://`; git review is a theme-developer convenience |
| Loyalty and cross-store programs (COM-F04, L) | Later, with its own design | It needs a points ledger and program model that no current record carries |
| Later scope: Liquid compatibility, advanced B2B purchasing, POS, theme marketplace, the Publishing app | Later, each with its own scoped design | Consistent with Marketing §7 and the Forum split; none blocks C1–C4 |
